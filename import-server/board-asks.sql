-- Ask Auntie daily limit (run once in Supabase SQL editor).
-- One row per NEW answer the AI writes for a student (replayed answers, "most asked" and ready-made
-- questions are free and not logged). The server counts today's rows per account: 2 a day for everyone.
-- Only the account and the time are kept, never the question. Written only by the server (service-role
-- key); RLS on with no policies keeps it private.

create table if not exists public.board_asks (
  id          bigint generated always as identity primary key,
  account_id  uuid not null,
  created_at  timestamptz not null default now()
);
create index if not exists board_asks_acct_day_idx on public.board_asks (account_id, created_at);

alter table public.board_asks enable row level security;

-- Optional housekeeping: prune rows older than ~40 days (the limit only needs "today").
-- delete from public.board_asks where created_at < now() - interval '40 days';
