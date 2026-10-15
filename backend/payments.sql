-- ============================================================
-- MedBank — subscriptions + Paystack payments
-- Run once in Supabase → SQL Editor → New query → Run. Safe to re-run.
--
-- The subscriptions table already exists in the live project (it was created by hand and
-- never committed). This file creates it if missing, then adds what payments need:
--   tier                'basic' or 'premium' (rows from before tiers count as premium)
--   current_period_end  when paid access ends (expiry)
--   auto_renew          false once a recurring plan is cancelled
--   paystack_*          codes to look a subscription up on Paystack
--   payments            one row per Paystack reference, so a payment counts exactly once
--   medbank_apply_payment()  the single place a payment extends a subscription
--
-- BEFORE RUNNING: if any account has two subscriptions rows, step 2 fails. Check with
--   select account_id, count(*) from public.subscriptions group by 1 having count(*) > 1;
-- and delete the extra rows first.
-- ============================================================

-- 1) table + new columns
create table if not exists public.subscriptions (
  account_id     uuid primary key references public.accounts(id) on delete cascade,
  status         text not null default 'trialing',
  plan           text,
  trial_ends_at  timestamptz,
  created_at     timestamptz not null default now()
);
alter table public.subscriptions add column if not exists tier                        text check (tier in ('basic','premium'));
alter table public.subscriptions add column if not exists current_period_end          timestamptz;
alter table public.subscriptions add column if not exists auto_renew                  boolean not null default false;
alter table public.subscriptions add column if not exists paystack_customer_code      text;
alter table public.subscriptions add column if not exists paystack_subscription_code  text;
alter table public.subscriptions add column if not exists paystack_email_token        text;
alter table public.subscriptions add column if not exists updated_at                  timestamptz not null default now();

-- 2) one row per account (the payment function upserts on it)
create unique index if not exists subscriptions_account_id_key on public.subscriptions(account_id);

-- 3) students may read their own row; only the server (service role) writes
alter table public.subscriptions enable row level security;
drop policy if exists "read own subscription" on public.subscriptions;
create policy "read own subscription" on public.subscriptions
  for select to authenticated using (account_id = auth.uid());

-- 4) payments ledger — the reference is the idempotency key
create table if not exists public.payments (
  reference      text primary key,
  account_id     uuid not null references public.accounts(id) on delete cascade,
  plan           text not null,
  amount_kobo    bigint not null,
  period_end     timestamptz not null,
  created_at     timestamptz not null default now()
);
alter table public.payments enable row level security;   -- no policies: server only

-- 5) apply a payment. Same tier: extend from whichever is later, now or the current end, so paying
--    early never loses days. Switching tier with time left: that time is converted at the two
--    tiers' monthly prices (p_tier_prices, e.g. {"basic":4999,"premium":7999}), so 1 month of Basic
--    left becomes ~19 days of Premium, then the new plan's months are added.
--    A reference seen before changes nothing (applied = false).
drop function if exists public.medbank_apply_payment(text, uuid, text, int, bigint, text);
create or replace function public.medbank_apply_payment(
  p_reference text, p_account_id uuid, p_plan text, p_months int,
  p_amount_kobo bigint, p_customer_code text, p_tier text, p_tier_prices jsonb
) returns table(applied boolean, current_period_end timestamptz)
language plpgsql security definer set search_path = public as $$
declare
  v_end   timestamptz;
  v_tier  text;
  v_left  interval;
  v_new   timestamptz;
begin
  -- serialise payments for one account so two at once can't both read the same end date
  perform pg_advisory_xact_lock(hashtext(p_account_id::text));

  if exists (select 1 from payments where reference = p_reference) then
    return query select false, s.current_period_end from subscriptions s where s.account_id = p_account_id;
    return;
  end if;

  select s.current_period_end,
         coalesce(s.tier, case when s.plan like 'basic%' then 'basic' else 'premium' end)
    into v_end, v_tier
    from subscriptions s
   where s.account_id = p_account_id and s.status = 'active';

  if v_end is null or v_end <= now() then
    v_left := interval '0';
  elsif v_tier = p_tier then
    v_left := v_end - now();
  else
    v_left := (v_end - now()) * ((p_tier_prices->>v_tier)::float8 / (p_tier_prices->>p_tier)::float8);
  end if;
  v_new := now() + v_left + make_interval(months => p_months);

  insert into payments(reference, account_id, plan, amount_kobo, period_end)
  values (p_reference, p_account_id, p_plan, p_amount_kobo, v_new);

  insert into subscriptions as s (account_id, status, plan, tier, current_period_end, paystack_customer_code, updated_at)
  values (p_account_id, 'active', p_plan, p_tier, v_new, p_customer_code, now())
  on conflict (account_id) do update
    set status = 'active', plan = excluded.plan, tier = excluded.tier, current_period_end = excluded.current_period_end,
        paystack_customer_code = coalesce(excluded.paystack_customer_code, s.paystack_customer_code),
        updated_at = now();

  return query select true, v_new;
end $$;
revoke all on function public.medbank_apply_payment(text, uuid, text, int, bigint, text, text, jsonb) from public, anon, authenticated;
