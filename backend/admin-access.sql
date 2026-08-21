-- ============================================================
-- MedBank — ADMIN READ ACCESS  (simplified, safe to re-run)
-- Run ALL of this in Supabase → SQL Editor → New query → Run.
-- Watch the result: green "Success" = done. Red text = paste it to Claude.
-- ============================================================

-- 1) Who is admin  (change the email if you log in with a different one)
create or replace function public.is_admin()
returns boolean language sql stable as $$
  select coalesce(auth.jwt()->>'email','') = 'frankthewiz1@gmail.com'
$$;

-- 2) Admin can read the three tables we need (drop+create so it's safe to re-run)
drop policy if exists "admin read accounts" on public.accounts;
create policy "admin read accounts" on public.accounts
  for select to authenticated using (public.is_admin());

drop policy if exists "admin read level_profiles" on public.level_profiles;
create policy "admin read level_profiles" on public.level_profiles
  for select to authenticated using (public.is_admin());

drop policy if exists "admin read profile_state" on public.profile_state;
create policy "admin read profile_state" on public.profile_state
  for select to authenticated using (public.is_admin());

-- 3) The students view: names + emails from auth.users, admin-only.
--    (A view runs with its owner's rights by default, so it can read auth.users;
--     the WHERE is_admin() means it returns nothing unless YOU are the caller.)
drop view if exists public.admin_students;
create view public.admin_students as
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

-- 4) Force the API to notice the new view immediately
notify pgrst, 'reload schema';

-- 5) CHECK — run this line on its own AFTER the above succeeds:
--    select count(*) from public.admin_students;
--    (Run it in the SQL editor = you're the owner, so it should return your student count.)
