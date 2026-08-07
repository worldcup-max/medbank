# MedBank import server (Phase 5)

The secure engine behind the app's **Import lectures** tab, plus the **Paystack payment
webhook**. It's the only place your Anthropic key and Supabase service-role key live —
never in the app.

## What it does

`POST /import` (called by the app):
1. Verifies the signed-in user (Supabase access token).
2. **Gates** the request server-side: `can_use_features()` (current level active + entitled)
   and `check_ai_quota('import')` (within trial/paid import limits). Blocked → 403/429.
3. Loads the **active prompt** from `prompt_templates` (so your live edits take effect).
4. Uses the cheaper `trial_model` for trial users, the full model for paid.
5. Calls Claude, parses + **validates** the output (same rules as the CLI validator).
6. Saves the `topic` + `cards` (with the app's exact `card_key` scheme) and records the
   import + usage for metering.

`POST /paystack/webhook`: verifies Paystack's signature with your secret key and flips the
subscription to `active` — the trustworthy, server-side confirmation the website's optimistic
checkout needs.

## Deploy (Render — near one-click via the included Blueprint)

This folder is **self-contained** and ships with `render.yaml` (Render Blueprint) and a
`Dockerfile` (for Railway/Fly/Cloud Run).

**Render steps:**
1. Push this `import-server/` folder as its own GitHub repo (root = this folder).
2. render.com → **New → Blueprint** → select that repo → it reads `render.yaml`.
3. In the dashboard, fill the 5 env vars (all secret except the first two):
   - `SUPABASE_URL` = `https://tytbrhuzikqkscxdnkmr.supabase.co`
   - `SUPABASE_SERVICE_ROLE_KEY` = Supabase → Settings → **API Keys → secret** (service_role). **Never put this in the app.**
   - `ANTHROPIC_API_KEY` = console.anthropic.com (add billing).
   - `PAYSTACK_SECRET_KEY` = Paystack `sk_…` (optional until you charge).
   - `ALLOWED_ORIGINS` = your app + website origins, comma-separated (e.g. `https://worldcup-max.github.io`). Use `*` only for a quick first test.
4. Deploy. Health check: open `https://<your-app>.onrender.com/health` → `{"ok":true}`.
5. Put that URL into `config.js` → **`IMPORT_API`** (both the working copy and the clone), and
   register `https://<your-app>.onrender.com/paystack/webhook` in Paystack → Settings → Webhooks.

**You handle the secret keys yourself** — I never read or store your service-role/Anthropic/Paystack
secrets. Enter them directly in the host's dashboard.

## CORS

The app and website call this server cross-origin. CORS is built in and controlled by
`ALLOWED_ORIGINS` (defaults to `*` for easy first setup; lock it to your real origins for launch).

## Local test

```bash
npm install
SUPABASE_URL=… SUPABASE_SERVICE_ROLE_KEY=… ANTHROPIC_API_KEY=… PAYSTACK_SECRET_KEY=… npm start
curl localhost:8787/health          # → {"ok":true}
```

## Notes

- Self-contained: validation is inline (`validateObj`), so no cross-folder files are needed.
- Requires the schema functions `can_use_features`, `check_ai_quota`, `bump_ai_usage`
  (already applied to your live database).
- CORS is built in (see above).
