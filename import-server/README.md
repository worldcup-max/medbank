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

Payments (Paystack): see **Payments** below.

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

## Payments

The app's Subscribe buttons open an in-app checkout (`checkout.js`). This server does all the
Paystack work (`payments.mjs`), so the app never holds a Paystack key and can't choose its own price.

| Endpoint | What it does |
|---|---|
| `GET /plans` | Prices for the plan picker |
| `POST /paystack/checkout` | Opens a Paystack transaction for the signed-in student (`{ plan }`) |
| `GET /paystack/verify?reference=` | Confirms a payment the moment the student is back in the app |
| `POST /paystack/webhook` | Charges, renewals and cancellations from Paystack |

**Plans**: monthly (₦2,000, 1 month), semester (₦8,000, 6 months), annual (₦15,000, 12 months).
Change a price with `PRICE_NGN_MONTHLY` / `PRICE_NGN_SEMESTER` / `PRICE_NGN_ANNUAL`.

**Expiry**: each payment sets `subscriptions.current_period_end`, extended from the current end
if the student pays early. Premium ends on that date; cancelling a recurring plan keeps access
until then. Rows with no end date (granted by hand) stay active.

**Exactly once**: a payment is applied by the SQL function `medbank_apply_payment`, keyed on the
Paystack reference, so the webhook and the app's verify call can both arrive (in any order, any
number of times) and the period is extended once. If the database can't apply a payment the
webhook answers 500 and Paystack retries.

**Going live, in this order:**
1. Run `backend/payments.sql` in Supabase → SQL Editor (safe to re-run; read the note at the top
   about duplicate rows first).
2. On the host set `PAYSTACK_SECRET_KEY` (start with `sk_test_…`, then `sk_live_…`) and `APP_URL`.
3. Paystack → Settings → API Keys & Webhooks: set the webhook URL to
   `https://<server>/paystack/webhook`.
4. Optional auto-renew: create Plans in Paystack and set `PAYSTACK_PLAN_MONTHLY`
   (and `_SEMESTER` / `_ANNUAL`). Plan amounts must match the prices above. Without plan codes,
   each payment is one-off and students renew from the app.
5. Test with a Paystack test card, then switch to the live key.

Tests: `npm run test:payments`.

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
