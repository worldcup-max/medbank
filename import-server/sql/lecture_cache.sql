-- ============================================================================
-- Shared class library — one build per lecture, reused by every classmate
-- (FEATURE_BACKLOG #7). Run in Supabase → SQL Editor. Additive and safe to re-run.
--
-- The import server fingerprints each upload (PDF bytes, YouTube video id, slide
-- photos, pasted text). When a classmate already built the same source at the same
-- level with the same build prompt, the stored build is copied into the new
-- student's own topic: no AI call. Progress stays personal; only content is shared.
--
-- Until this runs, the server skips the cache and builds every import as before.
-- ============================================================================

create table if not exists public.lecture_cache (
  id            uuid primary key default gen_random_uuid(),
  input_key     text not null,          -- hash of the raw upload
  content_key   text,                   -- hash of the extracted text (+ image hashes)
  scope         text not null,          -- "<level>:<prompt hash>" — a new prompt never serves an old build
  level         int,
  source_kind   text,                   -- pdf | audio | youtube | images | text
  model         text,                   -- model that paid for the build
  note_md       text not null,
  simplified_md text,
  primer        jsonb not null default '[]'::jsonb,
  recall        jsonb not null default '[]'::jsonb,
  transcript    jsonb,
  extras        jsonb not null default '{}'::jsonb,   -- qbank / written / podcast scripts, filled as any copy builds them
  preview       jsonb,
  built_by      uuid,                   -- account whose import paid for it (audit only; never shown to students)
  hits          int not null default 0, -- how many classmates got it free
  created_at    timestamptz not null default now(),
  last_hit_at   timestamptz
);

create unique index if not exists lecture_cache_input_idx   on public.lecture_cache (input_key, scope);
create index        if not exists lecture_cache_content_idx on public.lecture_cache (content_key, scope) where content_key is not null;

-- Server-only: RLS on with no policies, so only the service role (import server) can read or write it.
alter table public.lecture_cache enable row level security;

-- Which shared build a topic came from, so extras built on any copy flow back to the class.
alter table public.topics add column if not exists shared_source uuid references public.lecture_cache(id) on delete set null;

create or replace function public.lecture_cache_merge_extras(p_id uuid, p_patch jsonb)
returns void language sql as $$
  update public.lecture_cache set extras = coalesce(extras, '{}'::jsonb) || coalesce(p_patch, '{}'::jsonb) where id = p_id;
$$;

create or replace function public.lecture_cache_hit(p_id uuid)
returns void language sql as $$
  update public.lecture_cache set hits = hits + 1, last_hit_at = now() where id = p_id;
$$;

revoke all on function public.lecture_cache_merge_extras(uuid, jsonb) from public, anon, authenticated;
revoke all on function public.lecture_cache_hit(uuid) from public, anon, authenticated;

-- How much it is saving:
--   select count(*) builds, sum(hits) free_copies from public.lecture_cache;
-- Remove one bad shared build (classmates' existing copies are untouched; the next import rebuilds it):
--   delete from public.lecture_cache where id = '<id>';
