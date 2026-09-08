-- ============================================================================
-- MedBank — LEARNING EVENTS  (build 01, durable event rail)
-- Run in Supabase → SQL Editor → New query → Run. Safe to re-run.
--
-- WHAT THIS IS
--   The permanent record of what a student did. One row per learning
--   interaction, on every surface, keyed on target_id where one is known.
--
-- THE LEDGER RULE — this table is IMMUTABLE.
--   Rows are inserted and never updated or deleted. If we later learn that a
--   card belonged to target X, that belongs in a SEPARATE card→target mapping
--   layer joined at read time. We never rewrite history: "student reviewed
--   card 123 at 14:32 and got it wrong" must still say exactly that in a year.
--   The RLS below enforces this — students may INSERT and SELECT their own
--   rows, and there is deliberately NO update or delete policy for anyone.
--
-- WRITE-ONLY FOR NOW
--   Nothing in the learning path reads this table. Same discipline as
--   intervention_events: a bug in here cannot change what a student sees.
--
-- IDENTITY
--   The client NEVER states who it is. account_id defaults to auth.uid() and
--   the insert policy re-checks it, so a forged account_id is rejected by the
--   database rather than trusted. level_profile_id IS client-supplied, so the
--   policy verifies the profile actually belongs to the caller.
-- ============================================================================

create table if not exists public.learning_events (
  event_id          uuid        primary key default gen_random_uuid(),

  -- identity (server-established, see RLS below)
  account_id        uuid        not null default auth.uid()
                                references auth.users(id) on delete cascade,
  level_profile_id  uuid,       -- which level/profile this happened under; null tolerated

  -- what happened
  event_type        text        not null,   -- question_answered | card_reviewed | note_read
                                            -- | intervention_shown | intervention_completed
  surface           text        not null,   -- qbank | flashcard | note | gap_loop | retest
  target_id         text,                   -- null until that surface has target identity
  object_id         text,                   -- qh (question) | cid (card) | topic_id (note)

  -- the observation
  correct           boolean,                -- null for reads and non-graded events
  confidence        smallint,               -- 0..3, null when not captured
  response_ms       integer,

  -- time: client truth and server truth, kept apart on purpose
  occurred_at       timestamptz not null,   -- when the student actually did it (client clock)
  received_at       timestamptz not null default now(),   -- when it landed (server clock)

  -- idempotency: a retry of the same event can never create a second row
  client_event_id   uuid        not null,

  metadata          jsonb       not null default '{}'::jsonb,

  constraint learning_events_confidence_range check (confidence is null or (confidence between 0 and 3)),
  constraint learning_events_response_ms_sane check (response_ms is null or (response_ms >= 0 and response_ms < 86400000))
);

-- THE idempotency guarantee. Scoped per account so two students can never
-- collide, and so a replayed queue is a no-op rather than a duplicate.
create unique index if not exists learning_events_dedupe_idx
  on public.learning_events (account_id, client_event_id);

-- read paths we know we will need
create index if not exists learning_events_acct_time_idx
  on public.learning_events (account_id, occurred_at desc);
create index if not exists learning_events_target_idx
  on public.learning_events (target_id, occurred_at desc)
  where target_id is not null;
create index if not exists learning_events_acct_surface_idx
  on public.learning_events (account_id, surface, occurred_at desc);
create index if not exists learning_events_object_idx
  on public.learning_events (account_id, object_id, occurred_at desc);

-- ---------------------------------------------------------------------------
-- RLS — insert-and-read-own-rows only. No update policy, no delete policy:
-- their absence is what makes the ledger immutable, including for the student.
-- ---------------------------------------------------------------------------
alter table public.learning_events enable row level security;

drop policy if exists "learning_events insert own" on public.learning_events;
create policy "learning_events insert own" on public.learning_events
  for insert to authenticated
  with check (
    account_id = auth.uid()
    and (
      level_profile_id is null
      or exists (
        select 1 from public.level_profiles lp
        where lp.id = level_profile_id
          and lp.account_id = auth.uid()
      )
    )
  );

drop policy if exists "learning_events read own" on public.learning_events;
create policy "learning_events read own" on public.learning_events
  for select to authenticated
  using (account_id = auth.uid());

-- Admin reads go through a definer view, NOT a table policy — a broad admin
-- SELECT policy on a table the app queries with maybeSingle() is what broke
-- sync last time (see backend/admin-access.sql). This table is never read with
-- maybeSingle(), but the view keeps the pattern consistent and safe.
drop view if exists public.admin_learning_events;
create view public.admin_learning_events
with (security_invoker = false) as
select e.*
  from public.learning_events e
 where public.is_admin();

grant select on public.admin_learning_events to authenticated;

-- ---------------------------------------------------------------------------
-- Verification queries — run these after the first dark deploy.
-- ---------------------------------------------------------------------------
-- 1) volume and shape
--    select surface, event_type, count(*), min(occurred_at), max(occurred_at)
--      from learning_events group by 1,2 order by 3 desc;
--
-- 2) idempotency held (must return 0 rows)
--    select account_id, client_event_id, count(*)
--      from learning_events group by 1,2 having count(*) > 1;
--
-- 3) target coverage by surface (flashcards are EXPECTED to be 0% for now)
--    select surface,
--           count(*) filter (where target_id is not null) as with_target,
--           count(*) as total
--      from learning_events group by 1;
--
-- 4) clock skew / offline flush lag
--    select percentile_disc(0.5) within group (order by received_at - occurred_at) as median_lag,
--           max(received_at - occurred_at) as worst_lag
--      from learning_events;
