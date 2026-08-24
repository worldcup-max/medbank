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
