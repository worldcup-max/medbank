-- ============================================================================
-- 3D Tutor · what students do with the plates (feature 7), for the admin page "3D Tutor insights".
-- Run once in Supabase → SQL editor. Only the import server (service role) reads or writes it.
--   kind   'open' | 'start' | 'stop' | 'finish' | 'exam' | 'predict' | 'ask' | 'explain' | 'report'
--   status 'open' | 'fixed' for reports (⚑ on the player); null for everything else
-- account_id is kept only to count students, never shown on the insights page.
-- ============================================================================
create table if not exists public.plate_events (
  id          bigserial primary key,
  at          timestamptz not null default now(),
  account_id  text,
  session     text,                       -- one opening of the 3D Tutor on one topic
  plate       text not null,
  topic       text,
  kind        text not null,
  data        jsonb not null default '{}'::jsonb,
  status      text
);
create index if not exists plate_events_plate_at_idx on public.plate_events (plate, at desc);
create index if not exists plate_events_reports_idx on public.plate_events (kind, status) where kind = 'report';
alter table public.plate_events enable row level security;   -- no policies: clients cannot read or write it directly
