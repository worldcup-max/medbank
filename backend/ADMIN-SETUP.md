# MedBank — see student names + data (admin), ~10 minutes

Your app already has accounts and cloud sync. Every signed-in student's full progress (including the
Smart Drill pilot events) already syncs to your Supabase `profile_state` table. This just gives **you**
a private admin view over it. No new backend, no data collection to add.

## Step 1 — Grant yourself admin read (once)

1. Supabase → **SQL Editor** → **New query**.
2. Open `admin-access.sql`, change **one line** — the email in `is_admin()` — to the email you'll log in with.
3. Paste it all in and **Run**. This adds admin-only read policies to your existing tables and a
   secure `admin_students` view (names + emails). It does **not** change what students can see.

> The security guarantee lives in the database: every read is checked against `is_admin()`, so only
> your email gets rows back — even someone holding the app's public key sees nothing.

## Step 2 — Make sure you have an admin account

Sign up in the app (or in Supabase → Authentication → Users → Add user) using **that same email**.
That account is now the only one that can read everyone's data.

## Step 3 — Open the dashboard

1. Open `admin-dashboard.html` (this folder) in your browser.
2. Fill in:
   - **Supabase URL** and **anon public key** — from `config.js` (both are public/safe).
   - **Admin email** + **password** — your admin login.
3. Click **Sign in & load**.

You'll see: every student by **name + email**, their level, overall accuracy, attempts, Smart Drills
started/completed, agreement rate, streak, and last sync — click any row for detail. Below that:
cohort agreement by diagnosis and dimension, and the **who-rejected-what** disagreement log.

> This page stores **no secret key**. URL/anon/email are remembered for convenience; your password is
> never saved. You can host it privately, but it isn't required — running it locally is the safest.

## About "full performance, locked until you request it"

The dashboard already reads each student's synced blob, so their performance is available to you on
demand — but only to your admin account, and only when you open it. Nothing extra is collected. If you
later want deeper per-question exports, say so and I'll add a per-student drill-down.

## The login requirement

`config.js` now has `REQUIRE_LOGIN: true`, so students must sign in before studying (that's how you get
every student identified). To revert to the old study-first behavior, set it to `false` — one line, no
code change.

## Privacy — now mandatory, not optional

You're storing named student performance. Tell students plainly what you collect and why, and how they
can request deletion. If any are in the EU/UK, GDPR applies. This is the real-launch responsibility that
comes with identified data — worth 30 minutes of proper thought or advice before you scale.
