-- ============================================================================
-- 3D Tutor — shared cache of personalised lessons (POST /explainer).
-- One row per (template, note excerpt). The first student to open a topic pays
-- for the DeepSeek call; everyone with the same note gets the row for free.
-- Only the import server (service role) reads or writes this table.
-- ============================================================================
create table if not exists public.explainers (
  cache_key   text primary key,              -- md5(template | v1 | normalised excerpt)
  template    text not null,                 -- e.g. 'sn2'
  account_id  text,                          -- who triggered the build (for the daily cap)
  lesson      jsonb not null,                -- { v, template, lg, lines[], steps{id:{say}}, quiz{say,answer}, personal }
  created_at  timestamptz not null default now()
);
create index if not exists explainers_acct_idx on public.explainers (account_id, created_at);
alter table public.explainers enable row level security;   -- no policies: clients cannot read it directly

-- What students ask the instant builder for. The most-wanted (and any that failed or were flagged)
-- are what explainer/tools/queue.mjs hands to the build agent for a polished hand-built version.
create table if not exists public.explainer_requests (
  mech_key    text primary key,            -- normalised mechanism name
  name        text,
  requests    int  not null default 0,     -- opened from the shared cache
  built       int  not null default 0,     -- built fresh by the instant builder
  failed      int  not null default 0,     -- the chemistry check rejected every try
  flags       int  not null default 0,     -- students tapped "Something looks wrong?"
  last_topic  text,
  updated_at  timestamptz not null default now()
);
alter table public.explainer_requests enable row level security;
