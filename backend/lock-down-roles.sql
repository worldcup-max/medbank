-- ============================================================
-- MedBank: stop students from making themselves admin or Premium
-- Run in Supabase → SQL Editor. Do STEP 1 first and read the result.
--
-- Why: the app updates the signed-in student's own `accounts` row from the
-- browser (sync.js, auth-ui.js). If the table's UPDATE rights cover every column,
-- any student can open the browser console and run
--     __mbSB.from("accounts").update({ is_admin:true }).eq("id", <their id>)
-- and become an admin: the import server's /admin/* routes trust accounts.is_admin,
-- and so does the admin students view (names and emails). The same applies to
-- `subscriptions` (status / current_period_end = free Premium) if students can write it.
--
-- What the browser legitimately writes (checked in the code, 2026-11-16):
--   accounts       → UPDATE active_level_profile_id, start_level   (nothing else)
--   subscriptions  → read only (the server writes it with the service-role key)
-- The import server uses the service-role key, which this file does not touch.
-- ============================================================


-- ---------- STEP 1: check (read-only, safe to run any time) ----------
-- A row with privilege_type UPDATE on column is_admin, or any INSERT/UPDATE on
-- subscriptions, for role `authenticated` or `anon`, means the hole is open.
select table_name, grantee, privilege_type, column_name
from information_schema.column_privileges
where table_schema = 'public'
  and table_name in ('accounts', 'subscriptions')
  and grantee in ('anon', 'authenticated')
  and privilege_type in ('INSERT', 'UPDATE')
order by table_name, grantee, privilege_type, column_name;

-- The row-level policies on the same tables, for reference:
select tablename, policyname, cmd, roles, qual, with_check
from pg_policies
where schemaname = 'public' and tablename in ('accounts', 'subscriptions');


-- ---------- STEP 2: fix (run once) ----------
begin;
  -- accounts: students may change only which level profile is active and their start level
  revoke insert, update, delete on public.accounts from anon, authenticated;
  grant  update (active_level_profile_id, start_level) on public.accounts to authenticated;

  -- subscriptions: students may read their own row (RLS) but never write it
  revoke insert, update, delete on public.subscriptions from anon, authenticated;
commit;
-- Re-run STEP 1: accounts should list only active_level_profile_id and start_level
-- for `authenticated`, and subscriptions should list nothing.


-- ---------- UNDO (only if something in the app breaks) ----------
-- begin;
--   grant insert, update, delete on public.accounts      to authenticated;
--   grant insert, update, delete on public.subscriptions to authenticated;
-- commit;
