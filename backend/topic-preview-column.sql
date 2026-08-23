-- Topic Preview caching column (SPEC-TOPIC-PREVIEW.md)
-- Run once in the Supabase dashboard → SQL editor. Idempotent (safe to run again).
-- Without this column the feature still works, but the server can't cache the built preview,
-- so it regenerates on every note-open (extra model spend + a 2-4 min wait each time).
-- With it, each topic's preview is built ONCE and served instantly forever after.

alter table public.topics
  add column if not exists preview jsonb;

-- (optional) confirm it landed:
-- select column_name, data_type from information_schema.columns
--   where table_name = 'topics' and column_name = 'preview';
