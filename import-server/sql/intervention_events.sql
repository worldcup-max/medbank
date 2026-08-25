-- ============================================================================
-- V1.6 Phase 1 — intervention telemetry. APPEND-ONLY. Records what happened; it
-- does NOT decide anything. Nothing in the learning path reads this table.
-- ============================================================================
create table if not exists public.intervention_events (
  event_id             uuid primary key default gen_random_uuid(),
  account_id           text,
  created_at           timestamptz not null default now(),
  target_id            text,
  qh                   text,
  event_type           text not null default 'intervention_eligibility',
  ok                   boolean,
  confidence           int,
  attempt_signal       text,                 -- wrong_confident | wrong_unsure | wrong | correct_unsure | correct_confident | correct
  standing_diagnosis   text,                 -- gap | fragile | misconception | solid | null  (smartDiagnose snapshot AT THAT MOMENT)
  ab_bucket            text,                 -- A | B  (stable, deterministic; inactive until Phase 2)
  diagnosis_version    text,                 -- e.g. v1.5
  intervention_version text                  -- e.g. v1.6-phase1
);
create index if not exists intervention_events_acct_idx   on public.intervention_events (account_id, created_at);
create index if not exists intervention_events_target_idx on public.intervention_events (target_id, created_at);
