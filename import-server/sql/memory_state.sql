-- ============================================================================
-- MedBank — 02.4 DURABLE MEMORY STATE  (shadow phase: nothing reads this)
--
-- Architecture C: learning_events = immutable history
--                 memory_state    = authoritative current state
--                 scheduler       = computes the transition (CLIENT-SIDE)
--
-- This file creates the tables and the two projection RPCs. It does NOT
-- migrate, seed, switch authority, or change any feature flag. No application
-- code reads memory_state after this runs.
--
-- Design of record: PHASE-02.4-DESIGN-PROPOSAL.md (revision 5).
-- ============================================================================

-- ---------------------------------------------------------------------------
-- 1. memory_state — one learner-memory object = one independently writable row
-- ---------------------------------------------------------------------------
create table if not exists public.memory_state (
  account_id         uuid        not null default auth.uid()
                                 references auth.users(id) on delete cascade,
  level_profile_id   uuid        not null references public.level_profiles(id) on delete cascade,
  surface            text        not null,          -- 'flashcard' (qbank deferred, see design §2)
  object_key         text        not null,          -- cid for flashcards
  state              jsonb       not null default '{}'::jsonb,

  -- algorithm provenance of the CURRENT values (never a version set — see §0)
  scheduler_version  text,                          -- last writer; NULL for un-advanced seeds
  version_mixed      boolean     not null default false,   -- STICKY: 2+ distinct versions contributed
  origin             text        not null,          -- 'seed' | 'event'
  seed_format        text,                          -- shape contract when origin='seed' (§4.1a)

  -- concurrency + bookkeeping
  row_version        integer     not null default 1,        -- CAS token (NOT an algorithm version)
  transition_count   integer     not null default 0,        -- CARDINALITY, not a checksum (§1)
  last_occurred_at   timestamptz,                           -- newest applied event (pre-filter only)
  last_event_id      uuid,

  -- operational status: must be queryable, never merely logged (acceptance #1)
  needs_reconciliation boolean   not null default false,
  quarantined          boolean   not null default false,
  status_reason        text,
  status_at            timestamptz,

  updated_at         timestamptz not null default now(),

  primary key (level_profile_id, surface, object_key),
  constraint memory_state_origin_ck  check (origin in ('seed','event')),
  constraint memory_state_surface_ck check (surface in ('flashcard','qbank')),
  -- a seed must declare its shape; a non-seed must not pretend to have one
  constraint memory_state_seed_ck    check (
    (origin = 'seed' and seed_format is not null) or (origin = 'event')
  )
);

create index if not exists memory_state_acct_idx on public.memory_state (account_id, surface);
create index if not exists memory_state_attention_idx on public.memory_state (level_profile_id)
  where needs_reconciliation or quarantined;

-- ---------------------------------------------------------------------------
-- 2. memory_applied_events — the projection RECEIPT (the exactly-once boundary)
--    Same identity the ledger dedupes on, so both layers agree what "the same
--    event" means. ADDITIVE ONLY: receipts are never deleted by reconciliation.
-- ---------------------------------------------------------------------------
create table if not exists public.memory_applied_events (
  account_id        uuid        not null default auth.uid()
                                references auth.users(id) on delete cascade,
  client_event_id   uuid        not null,
  level_profile_id  uuid        not null,
  surface           text        not null,
  object_key        text        not null,
  -- detects client reuse of an id with a DIFFERENT payload (acceptance #4).
  -- A uuid collision is negligible; a client bug reusing an id is not.
  event_fingerprint text        not null,
  applied_at        timestamptz not null default now(),
  primary key (account_id, client_event_id)
);

create index if not exists memory_applied_identity_idx
  on public.memory_applied_events (account_id, level_profile_id, surface, object_key);

-- ---------------------------------------------------------------------------
-- 3. scheduler_compatibility — FAIL CLOSED. Absence means NOT compatible.
--    Directional: (v1 consumes v2) and (v2 consumes v1) are separate facts.
--    Seeds participate via a namespaced producer 'seed:<seed_format>' so there
--    is ONE lookup path that cannot be half-implemented (§4.1a).
-- ---------------------------------------------------------------------------
create table if not exists public.scheduler_compatibility (
  consumer_version text        not null,
  producer_version text        not null,   -- another version, or 'seed:<format>'
  compatible       boolean     not null,
  note             text,
  declared_by      text,
  declared_at      timestamptz not null default now(),
  primary key (consumer_version, producer_version)
);

-- ---------------------------------------------------------------------------
-- 4. RLS. memory_state is MUTABLE (unlike learning_events) — it is current
--    state, not history. That difference IS the architecture.
--    memory_applied_events is insert+select only: a receipt is a fact.
-- ---------------------------------------------------------------------------
alter table public.memory_state           enable row level security;
alter table public.memory_applied_events  enable row level security;
alter table public.scheduler_compatibility enable row level security;

drop policy if exists "memory_state rw own" on public.memory_state;
create policy "memory_state rw own" on public.memory_state
  for all to authenticated
  using (account_id = auth.uid())
  with check (
    account_id = auth.uid()
    and exists (select 1 from public.level_profiles lp
                 where lp.id = level_profile_id and lp.account_id = auth.uid())
  );

drop policy if exists "memory_applied insert own" on public.memory_applied_events;
create policy "memory_applied insert own" on public.memory_applied_events
  for insert to authenticated with check (account_id = auth.uid());

drop policy if exists "memory_applied read own" on public.memory_applied_events;
create policy "memory_applied read own" on public.memory_applied_events
  for select to authenticated using (account_id = auth.uid());
-- deliberately NO update/delete policy: receipts are additive only.

drop policy if exists "sched_compat read all" on public.scheduler_compatibility;
create policy "sched_compat read all" on public.scheduler_compatibility
  for select to authenticated using (true);
-- writes are admin/migration only (service role), never from the client.

-- ---------------------------------------------------------------------------
-- 5. Helpers
-- ---------------------------------------------------------------------------

-- 64-bit advisory key over the COMPLETE memory identity. hashtext() is 32-bit,
-- where collisions are plausible at scale. A collision here costs only
-- unrelated waiting — never correctness, since every write is independently
-- guarded by row_version and the receipt's primary key.
create or replace function public.mb_mem_lock_key(
  p_level_profile_id uuid, p_surface text, p_object_key text
) returns bigint language sql immutable as $$
  select ('x' || substr(md5(p_level_profile_id::text || '|' || p_surface || '|' || p_object_key), 1, 16))::bit(64)::bigint;
$$;

-- which ledger event_type feeds which surface
create or replace function public.mb_surface_event_type(p_surface text)
returns text language sql immutable as $$
  select case p_surface when 'flashcard' then 'card_reviewed'
                        when 'qbank'     then 'question_answered' end;
$$;

-- The scheduler-relevant ledger events for ONE memory identity, in canonical
-- order. Canonical order is (occurred_at, client_event_id) — occurrence order,
-- never arrival order (§3A.3).
create or replace function public.mb_identity_events(
  p_account uuid, p_level_profile_id uuid, p_surface text, p_object_key text
) returns table (client_event_id uuid, occurred_at timestamptz)
language sql stable as $$
  select e.client_event_id, e.occurred_at
    from public.learning_events e
   where e.account_id = p_account
     and e.level_profile_id is not distinct from p_level_profile_id
     and e.object_id = p_object_key
     and e.event_type = public.mb_surface_event_type(p_surface)
   order by e.occurred_at, e.client_event_id;
$$;

-- ---------------------------------------------------------------------------
-- 6. mb_project_event — the ONE atomic projection path.
--
-- Returns jsonb { status, row_version, reason }:
--   applied              transition committed, receipt written
--   already_applied      this exact event was projected before (lost response)
--   conflict             CAS lost; caller re-reads, RECOMPUTES, retries
--   replay_required      an earlier event is unapplied, or this one is late
--   quarantined          no compatibility declaration permits this transition
--   integrity_violation  event id reused with a different payload
--
-- The scheduler stays CLIENT-SIDE: the caller passes the state it computed
-- against a freshly-read row. Only the atomic commit of (receipt + state) is
-- server-side, because it cannot be expressed any other way.
-- ---------------------------------------------------------------------------
create or replace function public.mb_project_event(
  p_level_profile_id uuid,
  p_surface          text,
  p_object_key       text,
  p_client_event_id  uuid,
  p_expected_row_version integer,
  p_new_state        jsonb,
  p_scheduler_version text,
  p_occurred_at      timestamptz,
  p_event_fingerprint text
) returns jsonb
language plpgsql
security invoker      -- RLS still applies; ownership re-checked below regardless
as $$
declare
  v_account   uuid := auth.uid();
  v_row       public.memory_state%rowtype;
  v_receipt   public.memory_applied_events%rowtype;
  v_producer  text;
  v_compat    boolean;
  v_gap       boolean;
  v_mixed     boolean;
begin
  if v_account is null then
    raise exception 'auth required' using errcode = '28000';
  end if;

  -- OWNERSHIP: never trust the client's identity arguments (acceptance #6).
  -- The profile must belong to the AUTHENTICATED caller, not to whoever the
  -- caller named.
  if not exists (select 1 from public.level_profiles lp
                  where lp.id = p_level_profile_id and lp.account_id = v_account) then
    raise exception 'not your level profile' using errcode = '42501';
  end if;

  -- serialise this memory identity for the whole transaction. Advisory rather
  -- than FOR UPDATE because the FIRST event for a card has no row to lock yet.
  perform pg_advisory_xact_lock(public.mb_mem_lock_key(p_level_profile_id, p_surface, p_object_key));

  -- (a) RECEIPT FIRST. This must precede the CAS check, so that a successful
  -- commit whose response was lost returns already_applied rather than conflict.
  select * into v_receipt from public.memory_applied_events
   where account_id = v_account and client_event_id = p_client_event_id;

  if found then
    if v_receipt.event_fingerprint is distinct from p_event_fingerprint
       or v_receipt.object_key <> p_object_key
       or v_receipt.surface    <> p_surface then
      -- Same id, different event. A uuid collision is negligible; a client
      -- reusing an id is the realistic cause. This must NEVER be swallowed
      -- as "already applied, carry on".
      return jsonb_build_object('status','integrity_violation',
        'reason','client_event_id reused with a different event');
    end if;
    select * into v_row from public.memory_state
     where level_profile_id = p_level_profile_id and surface = p_surface and object_key = p_object_key;
    return jsonb_build_object('status','already_applied','row_version', coalesce(v_row.row_version,0));
  end if;

  select * into v_row from public.memory_state
   where level_profile_id = p_level_profile_id and surface = p_surface and object_key = p_object_key
   for update;

  -- (b) COMPATIBILITY, fail closed. A brand-new row has no prior state, so
  -- there is nothing to be incompatible with.
  if found then
    v_producer := case
      when v_row.origin = 'seed' and v_row.scheduler_version is null
        then 'seed:' || coalesce(v_row.seed_format,'unknown')
      else v_row.scheduler_version end;

    if v_producer is not null and v_producer <> p_scheduler_version then
      select compatible into v_compat from public.scheduler_compatibility
       where consumer_version = p_scheduler_version and producer_version = v_producer;

      if v_compat is distinct from true then          -- absent OR explicitly false
        update public.memory_state
           set quarantined = true,
               status_reason = 'no declaration permits ' || p_scheduler_version || ' to consume ' || v_producer,
               status_at = now()
         where level_profile_id = p_level_profile_id and surface = p_surface and object_key = p_object_key;
        return jsonb_build_object('status','quarantined',
          'reason', coalesce(v_compat::text,'undeclared'),
          'consumer', p_scheduler_version, 'producer', v_producer);
      end if;
    end if;
  end if;

  -- (c) CANONICAL POSITION. The fast path requires this event to be the
  -- IMMEDIATE NEXT unapplied event — a watermark cannot see a gap (§3A.3).
  select exists (
    select 1 from public.mb_identity_events(v_account, p_level_profile_id, p_surface, p_object_key) ev
     where (ev.occurred_at, ev.client_event_id) < (p_occurred_at, p_client_event_id)
       and not exists (select 1 from public.memory_applied_events r
                        where r.account_id = v_account and r.client_event_id = ev.client_event_id)
  ) into v_gap;

  if v_gap then
    update public.memory_state
       set needs_reconciliation = true,
           status_reason = 'earlier scheduler event unapplied; replay required',
           status_at = now()
     where level_profile_id = p_level_profile_id and surface = p_surface and object_key = p_object_key;
    return jsonb_build_object('status','replay_required','row_version', coalesce(v_row.row_version,0));
  end if;

  -- late event: it precedes applied history -> also replay, never append
  if v_row.last_occurred_at is not null
     and (p_occurred_at, p_client_event_id) < (v_row.last_occurred_at, coalesce(v_row.last_event_id, p_client_event_id)) then
    update public.memory_state
       set needs_reconciliation = true,
           status_reason = 'late event precedes applied history; replay required',
           status_at = now()
     where level_profile_id = p_level_profile_id and surface = p_surface and object_key = p_object_key;
    return jsonb_build_object('status','replay_required','row_version', v_row.row_version);
  end if;

  -- (d) CAS
  if v_row.object_key is not null and v_row.row_version <> p_expected_row_version then
    return jsonb_build_object('status','conflict','row_version', v_row.row_version);
  end if;

  -- (e) COMMIT: receipt + state, together or not at all.
  insert into public.memory_applied_events
    (account_id, client_event_id, level_profile_id, surface, object_key, event_fingerprint)
  values (v_account, p_client_event_id, p_level_profile_id, p_surface, p_object_key, p_event_fingerprint);

  if v_row.object_key is null then
    insert into public.memory_state
      (account_id, level_profile_id, surface, object_key, state, scheduler_version,
       version_mixed, origin, row_version, transition_count, last_occurred_at, last_event_id, updated_at)
    values (v_account, p_level_profile_id, p_surface, p_object_key, p_new_state, p_scheduler_version,
            false, 'event', 1, 1, p_occurred_at, p_client_event_id, now());
    return jsonb_build_object('status','applied','row_version',1);
  end if;

  -- STICKY: true when a SECOND distinct version contributes. seed(NULL) -> v1
  -- is NOT a crossing (§0.1).
  v_mixed := v_row.version_mixed
             or (v_row.scheduler_version is not null and v_row.scheduler_version <> p_scheduler_version);

  update public.memory_state
     set state = p_new_state,
         scheduler_version = p_scheduler_version,
         version_mixed = v_mixed,
         origin = 'event',
         row_version = v_row.row_version + 1,
         transition_count = v_row.transition_count + 1,
         last_occurred_at = p_occurred_at,
         last_event_id = p_client_event_id,
         needs_reconciliation = false,
         status_reason = null,
         status_at = null,
         updated_at = now()
   where level_profile_id = p_level_profile_id and surface = p_surface and object_key = p_object_key;

  return jsonb_build_object('status','applied','row_version', v_row.row_version + 1);
end;
$$;

-- ---------------------------------------------------------------------------
-- 7. mb_apply_replay — the reconciliation path.
--
-- Replay is CLIENT-COMPUTED. Server-side replay would mean a SECOND rateSRS
-- implementation that must agree with the client's forever — exactly the drift
-- risk 02.3 spent a phase eliminating. Holding a transaction open across a
-- network round-trip is also unacceptable. So the client replays and submits;
-- row_version guards the submission, because EVERY projection bumps it.
--
-- Verification is SET EQUALITY over the canonical order, never cardinality:
-- [E1,E2,E3] and [E1,E2,E4] have the same count and different history (§1).
--
-- The receipt table is ADDITIVE ONLY. This inserts what is missing and never
-- deletes a historical receipt because the submission omitted it.
-- ---------------------------------------------------------------------------
create or replace function public.mb_apply_replay(
  p_level_profile_id uuid,
  p_surface          text,
  p_object_key       text,
  p_expected_row_version integer,
  p_new_state        jsonb,
  p_scheduler_version text,
  p_version_mixed    boolean,
  p_applied_event_ids uuid[],
  p_fingerprints     text[]
) returns jsonb
language plpgsql security invoker as $$
declare
  v_account uuid := auth.uid();
  v_row     public.memory_state%rowtype;
  v_ledger  uuid[];
  v_last    timestamptz;
  v_lastid  uuid;
  i         integer;
begin
  if v_account is null then
    raise exception 'auth required' using errcode = '28000';
  end if;
  if not exists (select 1 from public.level_profiles lp
                  where lp.id = p_level_profile_id and lp.account_id = v_account) then
    raise exception 'not your level profile' using errcode = '42501';
  end if;
  if coalesce(array_length(p_applied_event_ids,1),0) <> coalesce(array_length(p_fingerprints,1),0) then
    raise exception 'ids/fingerprints length mismatch' using errcode = '22023';
  end if;

  perform pg_advisory_xact_lock(public.mb_mem_lock_key(p_level_profile_id, p_surface, p_object_key));

  select * into v_row from public.memory_state
   where level_profile_id = p_level_profile_id and surface = p_surface and object_key = p_object_key
   for update;

  if v_row.object_key is not null and v_row.row_version <> p_expected_row_version then
    return jsonb_build_object('status','conflict','row_version', v_row.row_version);
  end if;

  -- SET EQUALITY in canonical order, against the authoritative ledger.
  select array_agg(ev.client_event_id order by ev.occurred_at, ev.client_event_id),
         max(ev.occurred_at)
    into v_ledger, v_last
    from public.mb_identity_events(v_account, p_level_profile_id, p_surface, p_object_key) ev;

  v_ledger := coalesce(v_ledger, array[]::uuid[]);

  if v_ledger <> coalesce(p_applied_event_ids, array[]::uuid[]) then
    return jsonb_build_object('status','set_mismatch',
      'reason','submitted replay set does not equal the ledger set for this identity',
      'ledger_n', coalesce(array_length(v_ledger,1),0),
      'submitted_n', coalesce(array_length(p_applied_event_ids,1),0));
  end if;

  -- receipts: ADDITIVE. insert only what is missing.
  if coalesce(array_length(p_applied_event_ids,1),0) > 0 then
    for i in 1 .. array_length(p_applied_event_ids,1) loop
      insert into public.memory_applied_events
        (account_id, client_event_id, level_profile_id, surface, object_key, event_fingerprint)
      values (v_account, p_applied_event_ids[i], p_level_profile_id, p_surface, p_object_key, p_fingerprints[i])
      on conflict (account_id, client_event_id) do nothing;
    end loop;
    v_lastid := p_applied_event_ids[array_length(p_applied_event_ids,1)];
  end if;

  if v_row.object_key is null then
    insert into public.memory_state
      (account_id, level_profile_id, surface, object_key, state, scheduler_version, version_mixed,
       origin, row_version, transition_count, last_occurred_at, last_event_id,
       needs_reconciliation, quarantined, updated_at)
    values (v_account, p_level_profile_id, p_surface, p_object_key, p_new_state, p_scheduler_version,
            coalesce(p_version_mixed,false), 'event', 1,
            coalesce(array_length(p_applied_event_ids,1),0), v_last, v_lastid, false, false, now());
    return jsonb_build_object('status','replayed','row_version',1);
  end if;

  update public.memory_state
     set state = p_new_state,
         scheduler_version = p_scheduler_version,
         version_mixed = coalesce(p_version_mixed, v_row.version_mixed),
         origin = 'event',
         row_version = v_row.row_version + 1,
         transition_count = coalesce(array_length(p_applied_event_ids,1),0),
         last_occurred_at = v_last,
         last_event_id = v_lastid,
         needs_reconciliation = false,
         quarantined = false,
         status_reason = null,
         status_at = null,
         updated_at = now()
   where level_profile_id = p_level_profile_id and surface = p_surface and object_key = p_object_key;

  return jsonb_build_object('status','replayed','row_version', v_row.row_version + 1);
end;
$$;

grant execute on function public.mb_project_event(uuid,text,text,uuid,integer,jsonb,text,timestamptz,text) to authenticated;
grant execute on function public.mb_apply_replay(uuid,text,text,integer,jsonb,text,boolean,uuid[],text[]) to authenticated;

-- ---------------------------------------------------------------------------
-- 8. The ONE seed declaration 02.4 needs.
--    Classification evidence (2026-09-10): legacy-box-v0 = 322 classified,
--    1 dead/orphan, => 321 eligible for seeding. legacy-anki-v0 = 1, and that
--    single row is the OTHER known orphan (0 live cards) — so it is never
--    seeded and needs no consumer declaration today. unknown = 0.
--    The legacy-anki-v0 MECHANISM stays in the design: app.html:1928 can still
--    produce that shape for future viz-quiz cards.
-- ---------------------------------------------------------------------------
insert into public.scheduler_compatibility
  (consumer_version, producer_version, compatible, note, declared_by)
values
  ('srs-box-v1@1.3.7.7.7.14.14', 'seed:legacy-box-v0', true,
   'Shapes match: {box,due,seen,lapses,ms} is exactly what rateSRS reads and writes. Verified against 321 live legacy rows, 2026-09-10.',
   '02.4 migration')
on conflict (consumer_version, producer_version) do nothing;

-- NOTE: no declaration is made for seed:unknown, and none may ever be.
-- NOTE: no declaration is made for seed:legacy-anki-v0 — that shape is not
--       seeded in 02.4 and rateSRS cannot read it ({due,ivl,ease,reps,isNew}
--       has no box).
