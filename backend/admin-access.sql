-- ============================================================
-- MedBank — ADMIN READ ACCESS  (v2 — safe, does NOT break the app)
-- Run in Supabase → SQL Editor → New query → Run.
--
-- IMPORTANT LESSON: do NOT add a broad admin SELECT policy to tables the APP
-- reads with .maybeSingle() (accounts, level_profiles, subscriptions, courses).
-- Those queries assume RLS returns ONLY your own row; an admin policy makes them
-- return every user's row, so maybeSingle() errors and the app's sync silently
-- aborts on any fresh device. The dashboard instead reads through the definer
-- VIEW below (which bypasses RLS safely), so no table policy is needed for it.
-- ============================================================

-- 1) Who is admin
create or replace function public.is_admin()
returns boolean language sql stable as $$
  select coalesce(auth.jwt()->>'email','') = 'frankthewiz1@gmail.com'
$$;

-- 2) REMOVE the app-breaking admin table policies (safe to run even if absent)
drop policy if exists "admin read accounts"        on public.accounts;
drop policy if exists "admin read level_profiles"  on public.level_profiles;
drop policy if exists "admin read subscriptions"   on public.subscriptions;
drop policy if exists "admin read courses"         on public.courses;

-- 3) KEEP an admin read on profile_state ONLY.
--    The app always queries profile_state filtered by level_profile_id (eq + maybeSingle),
--    so it still returns exactly one row for a normal user — this policy does NOT break sync,
--    and the dashboard needs it to read every student's synced blob.
drop policy if exists "admin read profile_state" on public.profile_state;
create policy "admin read profile_state" on public.profile_state
  for select to authenticated using (public.is_admin());

-- 4) Students view: names + emails from auth.users, admin-only.
--    security_invoker=false → runs as the view owner, so it can read accounts + auth.users
--    regardless of table RLS; the WHERE is_admin() returns nothing unless YOU are the caller.
drop view if exists public.admin_students;
create view public.admin_students
with (security_invoker = false) as
select
  a.id                                            as account_id,
  u.email                                         as email,
  coalesce(u.raw_user_meta_data->>'full_name','') as full_name,
  a.start_level                                   as start_level,
  a.active_level_profile_id                       as active_profile,
  u.created_at                                    as joined,
  u.last_sign_in_at                               as last_sign_in
from public.accounts a
join auth.users u on u.id = a.id
where public.is_admin();

grant select on public.admin_students to authenticated;
notify pgrst, 'reload schema';
