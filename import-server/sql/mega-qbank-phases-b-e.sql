-- ============================================================================
-- Mega QBank Phases B–E — ADDITIVE schema only. Safe to run more than once.
-- Nothing here changes an existing column, a target_id, A6 retention keys, A7 pool status, or the QA engine.
-- Run in the Supabase SQL editor before turning on FEATURES.INTEGRATED_MODE / FEATURES.CASE_MODE.
-- ============================================================================

-- Phase E — linear Case Mode: a case = N approved integrated_items rows sharing case_id (metadata only, never a
-- scheduling key). branch_id / parent_question_id are RESERVED for Phase F (branching) and unused here.
alter table public.integrated_items add column if not exists case_id            text;
alter table public.integrated_items add column if not exists case_stage         integer;
alter table public.integrated_items add column if not exists case_title         text;
alter table public.integrated_items add column if not exists case_intro         text;
alter table public.integrated_items add column if not exists branch_id          text;   -- reserved (Phase F)
alter table public.integrated_items add column if not exists parent_question_id text;   -- reserved (Phase F)
create index if not exists integrated_items_case_idx on public.integrated_items (case_id, case_stage);

-- Phase B — requested-vs-delivered analytics (one row per Integrated / Case session started).
create table if not exists public.integrated_serve_log (
  id                   uuid primary key default gen_random_uuid(),
  account_id           uuid,
  kind                 text not null default 'integrated',      -- integrated | case
  requested            integer not null default 0,
  delivered            integer not null default 0,
  shortfall            integer not null default 0,
  requested_families   jsonb not null default '[]'::jsonb,
  delivered_by_family  jsonb not null default '{}'::jsonb,
  case_id              text,
  answered             integer not null default 0,
  correct              integer not null default 0,
  created_at           timestamptz not null default now()
);
alter table public.integrated_serve_log enable row level security;   -- server only (service_role)
create index if not exists integrated_serve_log_time_idx on public.integrated_serve_log (created_at desc);

-- Phase D — A8 promotion is recorded BESIDE the A7 row. retest_pool.status is never changed by A8, so A7's
-- anti-repeat set and pool accounting stay exactly as they are (A7 frozen).
alter table public.retest_pool add column if not exists promoted_at timestamptz;
alter table public.retest_pool add column if not exists promoted_by text;
alter table public.retest_pool add column if not exists promotion   jsonb;
