-- Visualize asset-library growth loop (run once in Supabase SQL editor).
-- Two tables, both written only by the server via the service-role key.

-- 1) Demand log: every time the generator reaches for an asset the manifest doesn't have.
create table if not exists public.viz_expansion_log (
  id          bigint generated always as identity primary key,
  requested_type text not null,
  subject     text,
  source_text text,
  created_at  timestamptz not null default now()
);
create index if not exists viz_expansion_log_type_idx on public.viz_expansion_log (requested_type);

-- 2) Proposals: AI-drafted, data-driven asset specs awaiting one-tap admin approval.
--    status: pending | approved | rejected. `spec` is the full asset JSON (incl. the SVG).
create table if not exists public.viz_asset_proposals (
  id         text primary key,           -- the requested asset name (snake_case)
  status     text not null default 'pending',
  demand     int  not null default 1,
  spec       jsonb not null,
  drafted_at timestamptz not null default now()
);
create index if not exists viz_asset_proposals_status_idx on public.viz_asset_proposals (status);

-- Locked down: only the service role (this server) touches these. Enable RLS with no policies.
alter table public.viz_expansion_log   enable row level security;
alter table public.viz_asset_proposals enable row level security;
