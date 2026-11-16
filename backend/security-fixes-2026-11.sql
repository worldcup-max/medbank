-- ============================================================
-- MedBank — database security fixes (audit of 2026-11-16)
-- Run in Supabase → SQL Editor → New query → Run. Safe to re-run.
--
-- What the audit found on the live project:
--  1) Four tables had row-level security OFF while the public (anon) key had full
--     read/write/delete grants on them. Anyone with the key in config.js could read,
--     change or wipe them:
--       integrated_items (approved integrated questions served to students),
--       intervention_events (per-account telemetry), retest_pool, visualizations (3D cache).
--     Only the Render server touches these tables, through the service_role key, which
--     ignores RLS. So turning RLS on with no policies locks out browsers and changes
--     nothing for the server or the app.
--  2) bump_ai_usage() and check_ai_quota() are SECURITY DEFINER and callable by anyone.
--     bump_ai_usage lets a stranger burn any student's daily AI quota by account id.
--     Only the server calls them (service_role), so browsers lose nothing.
-- ============================================================

alter table if exists public.integrated_items    enable row level security;
alter table if exists public.intervention_events enable row level security;
alter table if exists public.retest_pool         enable row level security;
alter table if exists public.visualizations      enable row level security;

revoke execute on function public.bump_ai_usage  from public, anon, authenticated;
revoke execute on function public.check_ai_quota from public, anon, authenticated;
grant  execute on function public.bump_ai_usage  to service_role;
grant  execute on function public.check_ai_quota to service_role;

notify pgrst, 'reload schema';
