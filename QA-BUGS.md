# MedBank — QA Bug Log (live end-to-end testing)

Target: `https://medbank.com.ng` (live = cache `v207`). Tester: Claude-in-Chrome. Test account: `frankthejay@gmail.com` (throwaway).

---

## 🔴 BUG-01 — Account switch shows the previous account's data (data isolation / privacy) — HIGH
**Observed:** Logged in as `frankthejay` (uid `96259a94`), but the app displayed **`frankthewiz1`'s** data — 147 cards, 13 topics, streak best 24 — and `medbank_sync_meta` still pointed at frankthewiz1's profile `3540234b` (rev 2717).
**Root cause:** On login the app never clears `localStorage['medbank_v1']` (or content caches); and `sync.init` bails out early for an account with no active level-profile (frankthejay never finished onboarding), leaving the prior user's cached data rendered.
**Risk:** privacy leak on shared/lab devices and on account switch; **potential corruption** — importing/studying while in this state writes against the *stale* profile (`3540234b`), which could damage the other account's real content. (Testing was paused here for exactly this reason.)
**Repro:** use account A in a browser → log in account B (esp. a fresh/half-onboarded account) on the same browser → account A's data shows under B's session.
**Fix direction:** on `onAuthStateChange` to a different `uid`, clear local `DATA` + `medbank_content_*` + sync meta before rendering/syncing (or namespace localStorage per account id). Verify sync sets a clean empty state when an account has no active profile.
**Status:** ✅ **FIXED on branch (v213).** `sync.js init` now stores `mb_current_uid` and, on login with a different uid than cached, purges the previous account's local data and reloads clean; first-ever login is not purged (preserves the logged-out→signup merge). Verified: parse + 4 switch-logic checks. Ships as a non-behavioral safety patch (cherry-pick to `v207-pilot`). NOT yet deployed to students.

## 🟠 BUG-02 — Sync data-loss fix not deployed — HIGH (deploy gap, fix already written)
**Observed:** live = `v207`; the empty-cloud-adopt guard (`isEmptyState`, v212 `sync.js`) is NOT live. So the "logging in adopts an empty cloud and wipes local data" bug is still live for students.
**Fix:** exists on `v1.6-experiments` (v212). Per D7, cherry-pick into the pilot baseline as a non-behavioral safety patch.
**Status:** fix written, NOT deployed.

## ✅ FIXED-01 — Admin RLS / `maybeSingle` regression — verified fixed live
Admin read policy made `accounts` return every row, so the app's `maybeSingle()` errored and sync aborted on fresh devices (caused today's "phone empty"). After dropping the broad admin table policies, the live `accounts` query now returns exactly **1 row**, and the admin dashboard still reads all 7 via the definer view. Verified on the live DB.

## ℹ️ OBS-01 — Pilot has essentially no data yet
Across all 7 accounts: only `frankthewiz1` has activity (65 attempts, **1** event = `smart_drill_started`). **Zero** `reco_agree` / `smart_drill_completed` events anywhere. Pending UI test: confirm those events actually fire (Suite D/F), and note there is nothing to validate diagnoses with yet.

## 🟠 FRICTION-02 — Import dead-ends for a new account (no course) — MEDIUM
**Observed:** In "Add a lecture," the Course dropdown reads **"(no courses — add one in Settings first)"**. A brand-new account (frankthejay never completed onboarding → no active level-profile) therefore cannot import: there's no course to attach the lecture to, and on live `v207` there is **no create-course-in-flow**. The account also has no level-profile at all, so even Settings may not let you add a course until onboarding is completed.
**Impact:** a new user who taps "Add lecture" first (very likely) hits a dead-end.
**Note:** the branch (`import-tab.js`, v212) already adds `createCourse()` on the fly — but it's **not deployed** (live is v207).
**Status:** OPEN (partly addressed on branch).

## 🟡 VERIFY-01 — "Model (admin A/B)" selector visible in the import form — LOW
**Observed:** the import form shows a **"Model (admin A/B) — Default (trial / paid setting)"** dropdown for the `frankthejay` test account (not an admin). Confirm this control is meant to be admin-only and shouldn't render for normal users.

## ℹ️ CLARIFIED (not a bug)
The 🔒 on Notes / Flashcards / Quiz / Cram sheet means **"always built"** (mandatory outputs), not a paywall. Q-bank / Written test are optional extras. Earlier "paywall" read was wrong.

## 📌 KNOWN (fixed on branch, not deployed)
The non-PDF import bug (a `.pptx`/`.docx` passes the "did you pick a file?" check, then gets dropped → "model returned invalid JSON") is already fixed on `v1.6-experiments` (`import-tab.js` v212). Live `v207` still has it. Reproducing live would only re-confirm it.

## 🔴 BUG-03 — Import build fails: "validation failed" (import server) — HIGH
**Observed:** With a valid pasted Paediatrics lecture (Bronchiolitis, ~1 paragraph) + Notes/Flashcards/Quiz/Cram (± Q-bank), "Build my study set" runs ~2 min then errors **"validation failed"**. Reproduced twice.
**Root cause:** the string "validation failed" is **not** in `app.html` or `import-tab.js` (live) — it is returned by the **import server** (`medbank-import.onrender.com`). The server's AI pipeline is rejecting its own generated output at a schema-validation step (or the model returned malformed/incomplete JSON). So the core "turn a lecture into a study set" feature fails end-to-end for this input.
**Where the fix lives:** `import-server/server.mjs` → `validateObj()` (line 64) rejects the generated topic. It requires: `note_md` ≥200 chars, `simplified_md` ≥200 chars, a **primer** deck (each card: q + lecturer + explain + tie) and a **recall** deck (each card: q + exactly 4 `opts` + integer `ans` 0–3 + `a`). The model's output for a short pasted input failed at least one rule.
**Likely fixes:** (a) get the server logs to see which rule failed (the server knows — it builds an `errors[]` array but returns only "validation failed" to the client → **it should surface the specific error**); (b) make the generation prompt reliably meet the schema (esp. recall = exactly 4 opts); (c) consider a graceful retry or a clearer user-facing message than "validation failed".
**Side note:** client treats `trialing` as entitled, but the server's `isPremium()` only counts `status==='active'` (not `trialing`) — a minor client/server entitlement mismatch (the free 1-build limit let this build through anyway).
**Status:** ✅ **FIXED in code (`import-server/server.mjs`).** The `/import` handler now (1) **retries generation once** with a corrective instruction when the first output fails parse/validation (a single flaky LLM response no longer hard-fails the build), and (2) returns a **specific, friendly error** with `details[]` instead of a bare "validation failed". Parse-verified. **Needs deploy to the import server (onrender)** — this is a separate service from the app. If the failure persists after retry, next step is tuning the DB build-prompt (via /admin/prompt) to guarantee the recall-4-options / min-length schema.

## 🟡 MINOR findings (import UX)
- **Stale error:** "Choose or add the lecturer's name" does not clear when you type a lecturer name — it only clears on the next Build click.
- **Optimistic estimate:** the button says "Building… ~30–60s" but the build ran ~2 min before failing (no real progress feedback).
- **Console warning:** "Multiple GoTrueClient instances detected in the same browser context" — the app creates the Supabase auth client more than once; harmless now but can cause undefined behaviour.
- **Not re-tested live:** the known non-PDF "invalid JSON" bug — `file_upload` is unavailable in this session (host limitation), so a file couldn't be pushed through the picker. Used the "Paste" source instead.

---
*Test-account emails used (exclude from real pilot metrics): frankthejay@gmail.com. Test setup created: level-500 profile + "Paediatrics" course + extended trial on that account.*
