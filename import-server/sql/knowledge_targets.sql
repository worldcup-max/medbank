-- Mega Q-bank — Knowledge Target layer (Phase A) storage
-- Run once in the Supabase SQL editor. Service-role (the import server) is the only writer.
-- The Knowledge Target is the source of truth; target_id is its stable identifier.

-- ── canonical knowledge targets ────────────────────────────────────────────
create table if not exists public.knowledge_targets (
  target_id            text primary key,                 -- e.g. BRONCH-MGMT-001  (<TOPIC>-<SKILL>-<NNN>)
  version              integer      not null default 1,
  canonical_statement  text         not null,            -- the semantic contract, in one sentence
  topic                text         not null,
  subtopic             text,
  skill                text,                              -- from the QB_SKILLS vocabulary
  scope                text,                              -- what the target covers
  tests                jsonb        not null default '[]'::jsonb,   -- acceptable assessment angles
  excludes             jsonb        not null default '[]'::jsonb,   -- explicit boundaries (guards against false merges + drift)
  misconceptions       jsonb        not null default '[]'::jsonb,   -- seeds the Intervention Engine
  difficulty_band      text,                              -- easy | medium | hard
  status               text         not null default 'active',      -- active | ambiguous | deprecated | merged
  merged_into          text         references public.knowledge_targets(target_id),  -- survivor, if merged later
  source               text         not null default 'ai_reconciled',               -- ai_reconciled | human_defined | ai_provisional
  member_count         integer      not null default 0,   -- questions currently mapped here (health signal)
  reviewed_by          text,
  reviewed_at          timestamptz,
  created_at           timestamptz  not null default now()
);
create index if not exists knowledge_targets_topic_skill_idx on public.knowledge_targets (topic, skill);
create index if not exists knowledge_targets_status_idx      on public.knowledge_targets (status);

-- ── per-question mapping (audit-complete: keeps AI proposal AND the decision) ─
create table if not exists public.question_targets (
  qh             text primary key,                        -- question content hash (global; deterministic from stem+options)
  target_id      text references public.knowledge_targets(target_id),  -- RESOLVED target; NULL while AMBIGUOUS
  map_state      text        not null,                    -- MATCH | NEW | AMBIGUOUS
  map_confidence numeric,                                  -- 0..1 from reconciliation
  proposed       jsonb       not null default '{}'::jsonb, -- what the AI extracted (verbatim, for audit)
  candidates     jsonb       not null default '[]'::jsonb, -- top reconciliation candidates + scores
  topic_id       uuid,                                     -- provenance (which lecture it came from)
  account_id     uuid,                                     -- provenance (who built it)
  -- map_state is the AI's verdict and is NEVER overwritten by a human. A manual decision is recorded here
  -- as its own event: { action:'match'|'new'|'keep', target_id, by, at, from_state }. So the audit trail reads
  -- "AI proposed X → reconciliation said AMBIGUOUS → Frank approved existing target Y" — calibration data later.
  resolution     jsonb,
  resolved_by    text,                                     -- quick-filter mirror of resolution.by
  resolved_at    timestamptz,
  created_at     timestamptz not null default now(),
  updated_at     timestamptz not null default now()
);
create index if not exists question_targets_target_idx on public.question_targets (target_id);
create index if not exists question_targets_state_idx  on public.question_targets (map_state);

-- Admin-only: enable RLS with no public policies. The service-role key (import server) bypasses RLS;
-- anon/auth clients get no access, which is what we want for a build-time/back-office layer.
alter table public.knowledge_targets enable row level security;
alter table public.question_targets  enable row level security;

-- 2026-08-24: near-miss safety-net provenance. Records the model's OWN verdict (e.g. NOT_SAME) and the nearest
-- candidate alongside the FINAL decision, so an AMBIGUOUS-from-near-miss row never pretends the model said "X% same".
alter table public.question_targets add column if not exists decision jsonb;

-- 2026-08-24: STICKY INVARIANT — a human-resolved mapping is authoritative and is never re-derived by the engine.
-- mapping_source distinguishes an AI mapping from a human one; mapping_status supports later supersession.
-- The scheduler trusts: active human mapping > active AI mapping.
alter table public.question_targets add column if not exists mapping_source text not null default 'ai';    -- ai | human
alter table public.question_targets add column if not exists mapping_status text not null default 'active'; -- active | superseded
-- backfill: any row a human has already resolved is authoritative
update public.question_targets set mapping_source = 'human' where resolution is not null;

-- ============================================================================
-- A7 — Retest Pool. Disposable, AI-generated alternate assessments of an EXISTING
-- Target, served only when a Target is due and its canonical pool is exhausted.
-- NEVER canonical: a row here can never migrate into topics.extras.qbank, and this
-- pipeline has no write path to knowledge_targets (I1/I4/I11).
-- ============================================================================
create table if not exists public.retest_pool (
  id            uuid primary key default gen_random_uuid(),
  target_id     text not null references public.knowledge_targets(target_id),
  qh            text not null,                                   -- hash(stem+'|'+options) — same identity fn as the scheduler
  account_id    text,
  content       jsonb not null,                                  -- {stem, lead_in, options, answer, rationales, ...} qbank-shaped item
  source        text not null default 'ai_retest',
  model         text,
  generated_at  timestamptz not null default now(),
  validation    jsonb,                                           -- {passed, reason, reconciled_to, confidence, matched_via}
  status        text not null default 'candidate',               -- candidate | served | invalid | quarantined | expired
  served_count  int  not null default 0,
  served_at     timestamptz,
  unique(target_id, qh)                                          -- idempotent: same generated item can't double-insert
);
create index if not exists retest_pool_target_status_idx on public.retest_pool (target_id, status);
