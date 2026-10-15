-- ============================================================================
-- 3D Tutor · plates built for topics the library has no plate for (quick drafts now, full plates later).
-- One row per topic (slug). Students with the same or similar material share it. Run once in Supabase → SQL editor.
-- Only the import server (service role) reads or writes it.
--   status   'drafting' | 'draft' (quick draft ready) | 'failed' | 'building' (full build running) | 'full' (replaced by the library plate)
--   usd      what building it has cost so far (every Claude call), so the admin page can show it
-- ============================================================================
create table if not exists public.plate_topics (
  slug        text primary key,
  title       text not null,
  course      text,
  status      text not null default 'drafting',
  html        text,                      -- the built page (a guided tour on explainer/tours)
  manifest    jsonb,                     -- what the 3D Tutor maps a note onto
  meta        jsonb,
  sample_note text,                      -- the first note it was built from (the full build reads it too)
  aliases     text[] not null default '{}',   -- other titles students' topics had
  students    int not null default 0,    -- how many students' topics point at it
  wanted      int not null default 0,    -- engagement: students who studied it (the full build takes the most-wanted first)
  usd         numeric not null default 0,
  calls       jsonb not null default '[]'::jsonb,
  problems    jsonb,
  error       text,
  built_by    text,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now(),
  built_at    timestamptz
);
create index if not exists plate_topics_status_idx on public.plate_topics (status, wanted desc);
alter table public.plate_topics enable row level security;   -- no policies: clients cannot read or write it directly
