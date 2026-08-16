-- Daily "Visualize" limit (run once in Supabase SQL editor).
-- One row per NEW video build (cached replays are free and not logged).
-- The server counts today's rows per account to enforce: basic 3/day, premium 10/day.
-- Written only by the server (service-role key); RLS on with no policies keeps it private.

create table if not exists public.viz_events (
  id          bigint generated always as identity primary key,
  account_id  uuid not null,
  created_at  timestamptz not null default now()
);
create index if not exists viz_events_acct_day_idx on public.viz_events (account_id, created_at);

alter table public.viz_events enable row level security;

-- Optional housekeeping: prune rows older than ~40 days (limits only need "today").
-- delete from public.viz_events where created_at < now() - interval '40 days';
