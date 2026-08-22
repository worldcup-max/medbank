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

## 🟠 BUG-04 — Mock exam "Start exam" has no empty-pool guard — MEDIUM → ✅ FIXED
**Observed:** On an account with no questions built, tapping **Start exam** does nothing visible. `startExam()` (app.html) built an exam session with **0 items** and called `go('exam')` — but since the hash was already `#/exam` it didn't re-render, so it looked like a dead button; and it left a broken empty exam session in state.
**Root cause:** unlike `mgStart` and `startSmartDrill` (both alert on an empty pool), `startExam` had no `if(!items.length)` guard.
**Fix:** added the same guard — alerts "No exam questions yet — open a topic → 🧠 Q-bank to build one first." Parse-verified. (Pending deploy with the next release.)

## 🟡 MINOR-02 — "Multiple GoTrueClient instances" warning (repeats) — LOW
The Supabase auth client is instantiated more than once (warning fires 3×+ per page). Harmless today but flagged by Supabase as possible undefined behaviour. Likely `auth-ui.js` `client()` and `sync.js` each create a client instead of always sharing `window.__mbSB`. Worth consolidating to one client.

## ✅ Verified live this round (deployed v213)
- **BUG-01 (account isolation):** confirmed fixed on the live app — the test account now shows its OWN empty state, no data bleed from the previous account.
- **BUG-02 / BUG-03:** both present in deployed v213 (`isEmptyState` + `mb_current_uid` in live sync.js; import-server retry live).
- **Mega Q-bank empty state:** clean, friendly ("No Q-banks built yet…"). No bug.

---

# Code-review pass — Flow 1: Onboarding / first-run (`auth-ui.js`) — 2026-08-22

## 🔴 ONB-01 — Email-verified users are dropped into the app half-onboarded — HIGH (proposed — needs review)
**What's wrong:** When sign-up requires email confirmation, `renderAccount` stashes the pending onboarding and shows `renderCheckEmail`. When the student clicks the emailed link, Supabase restores a session and fires `onAuthStateChange('SIGNED_IN')` — but the app's only `onAuthStateChange` handler (`auth-ui.js:400`) handles **`PASSWORD_RECOVERY` and nothing else**. So `afterAuth()` is never called: `mb_pending_onboard` is never consumed, no `level_profile` / `courses` rows are created, and the student lands signed-in with an empty, courseless account.
**Why this matters:** this is very likely the root cause of the half-onboarded `frankthejay` state behind BUG-01 and FRICTION-02 — a signed-in account with no active level-profile that then dead-ends at "Add a lecture" (no courses).
**Root cause:** `auth-ui.js:400` — `onAuthStateChange(function(ev){ if(ev==="PASSWORD_RECOVERY"){...} })`; no `SIGNED_IN` branch.
**Fix (proposed):** in the same handler, on `SIGNED_IN`/`INITIAL_SESSION`, if `readPending()` has a level and no profile exists, run `afterAuth(sb)` (guarded by a once-flag so it can't double-fire alongside `MB_SYNC.init`).
**Status:** LOGGED, not edited — touches auth state routing and can double-fire with `sync.js`; needs a human to sequence it against `MB_SYNC.init`.

## 🟠 ONB-02 — `afterAuth` treats a failed profile query as "no profile" → duplicate level_profile — MEDIUM (proposed — needs review)
**What's wrong:** `afterAuth` (`auth-ui.js:265`) does `var { data:profs } = await sb.from("level_profiles").select("id").limit(1);` and **never checks `.error`**. On an RLS hiccup or transient failure, `profs` is `null`, so the code assumes the user has no profile and proceeds to `saveOnboarding` / `renderLevel` — **inserting a second `level_profile`** for a user who already has one and repointing `accounts.active_level_profile_id` at it. That orphans the student's existing courses/content. (Compare FIXED-01: a `maybeSingle` RLS regression already caused exactly this class of failure once.)
**Fix (proposed):** treat an errored query as "unknown, don't create" — bail to `startSync(sb)` (or show a retry) instead of falling through to onboarding.
**Status:** LOGGED, not edited — the correct fallback is a routing decision; conservative to leave to a human.

## 🟠 ONB-03 — `saveOnboarding` retry creates a duplicate level_profile — MEDIUM (proposed — needs review)
**What's wrong:** `saveOnboarding` (`auth-ui.js:272-289`) inserts the `level_profile` first, then the `courses` rows. If the **courses insert** fails (line 281), the catch renders a "Try again" button that re-runs the whole function — inserting **another** `level_profile` and repointing `accounts.active_level_profile_id` at the new empty one. Each retry leaks one more orphan profile.
**Fix (proposed):** make it idempotent — cache `lp.data.id` on `chosen` (e.g. `chosen._lpId`) and skip the profile insert on retry, or wrap both inserts in a single RPC/transaction.
**Status:** LOGGED, not edited — needs a schema/RPC decision.

## 🟡 ONB-04 — Log out leaves the previous account's local data on the device — MEDIUM (proposed — needs review)
**What's wrong:** both log-out paths (`showAccount` at `auth-ui.js:311` and the avatar-menu row at `:362`) call `sb.auth.signOut()` then only `updateChip()`. Local `medbank_v1` / `medbank_content_*` / sync meta are untouched, so the next person on the device sees the previous student's decks and progress until they log in as someone else.
**Note:** BUG-01's v213 fix covers the **login** direction (`mb_current_uid` purge on uid change) but not the **logout** direction.
**Fix (proposed):** reuse the same purge helper from `sync.js` on sign-out, or accept it deliberately (logged-out study is a supported mode — a full purge would destroy work done while logged out). Decision needed.
**Status:** LOGGED, not edited — genuine product trade-off, must not silently delete a student's local work.

## 🟢 ONB-05 — Server course templates never load in the `MB_openAuth` entry path — LOW → ✅ FIXED
**What's wrong:** `openWelcome()` called `loadServerTemplates(sb)`, but `open()` (`window.MB_openAuth`, used by the avatar menu's "Create account" / "Account & sync") did not. A student entering onboarding that way always got the hard-coded `DEFAULT_COURSES`, silently ignoring the server-side `app_config.course_templates` override.
**Fix applied:** added `loadServerTemplates(sb);` before `renderWelcome(sb)` in `open()` (`auth-ui.js:88`). Fire-and-forget with its own try/catch, same as the other path.

## 🟢 ONB-06 — Malformed server template crashes the course step — LOW → ✅ FIXED
**What's wrong:** `catalogFor()` did `if (s && s.length) return s.slice();`. If `app_config.course_templates` ever holds a **string** (or any non-array with a `length`) for a level, `s.slice()` returns a string and the caller's `.map()` throws a TypeError — breaking step 2 with a blank list and no error message.
**Fix applied:** `if (Array.isArray(s) && s.length)` (`auth-ui.js:31`) — falls back to `DEFAULT_COURSES` on bad data.

## 🟢 ONB-07 — Corrupt/empty pending-onboard payload throws during setup — LOW → ✅ FIXED
**What's wrong:** `afterAuth` accepted any `pend` with a `level` and passed it to `saveOnboarding`, which does `chosen.courses.filter(...)`. A stashed payload with a missing or empty `courses` array either threw a TypeError (→ "Couldn't finish setup") or inserted **zero courses**, producing exactly the courseless dead-end account in FRICTION-02.
**Fix applied:** `afterAuth` (`auth-ui.js:269`) now requires `Array.isArray(pend.courses)` with at least one `on:true` entry; otherwise it falls through to `renderLevel` so the student re-picks.

## 🟢 ONB-08 — Stale validation errors don't clear (same pattern as MINOR "stale error") — LOW → ✅ FIXED
**What's wrong:** on step 1, "Pick your level to continue." stayed visible after picking a level; on step 2, "Pick at least one course." stayed visible after ticking one. The student sees a red error contradicting what they just did.
**Fix applied:** the level tile's `onclick` (`auth-ui.js:127`) and the course checkbox's `onchange` (`auth-ui.js:155`) now hide the error box.

## 🟢 ONB-09 — Silent no-op when the Supabase JS client fails to load — LOW → ✅ FIXED
**What's wrong:** `open()` did `var sb=client(); if(!sb) return;` — if the Supabase CDN script hadn't loaded, tapping "Create account" or "Account & sync" did **nothing at all**, with no feedback.
**Fix applied:** now shows "Couldn't reach the sync service. Check your connection and try again." (`auth-ui.js:87`).

## 🟢 ONB-10 — `saveOnboarding` had no null-user guard — LOW → ✅ FIXED
**What's wrong:** `var u=(await sb.auth.getUser()).data.user;` then `u.id`. An expired session gave a raw `Cannot read properties of null` in the "Couldn't finish setup" panel.
**Fix applied:** explicit guard throwing "Your session expired. Please sign in again to finish setting up." (`auth-ui.js:278`).

## ℹ️ ONB-11 — Cosmetic / low-priority observations (logged, not fixed)
- **Fake-disabled Continue button** (`auth-ui.js:132`): step 1 sets `nextBtn.style.opacity=".5"` but never `nextBtn.disabled=true` (the tile click sets `disabled=false`, showing the intent). The button looks disabled but is clickable; the `fail()` guard catches it, so behaviour is correct — just inconsistent.
- **4 progress dots, 3 steps** (`auth-ui.js:53`): the stepper draws 4 dots but only steps 1–3 are ever passed, so the last dot never fills. Possibly intentional (step 4 = the mandatory first import), left alone.
- **Duplicate course add is a silent no-op** (`auth-ui.js:166`): typing a course that already exists clears the input with no "already in your list" feedback.
- **`CHOSEN` is module-global and never reset** (`auth-ui.js:82`): if user A abandons onboarding and user B signs in on the same page load, B's `renderLevel` starts pre-seeded with A's level/courses. Requires no reload between two users — edge case only.
- **MINOR-02 ("Multiple GoTrueClient") is NOT from this file:** `client()` (`auth-ui.js:37`) correctly caches into `window.__mbSB`. The duplicate instance comes from elsewhere — check `sync.js` when Flow 17 is reviewed.

**Verification:** `node --check auth-ui.js` → PASS after all edits. No `app.html` changes, no version/cache bump, nothing committed.

---
*Test-account emails used (exclude from real pilot metrics): frankthejay@gmail.com. Test setup created: level-500 profile + "Paediatrics" course + extended trial on that account.*

## 🔴 BUG-05 — Import pipeline produces empty / unparseable content (deeper than BUG-03) — HIGH
**Observed (live, after BUG-03 fix deployed):** 3 fresh imports of a valid ~150-word Paediatrics paragraph all failed:
- 2 parallel basic-model builds → `bad json` (model returned non-JSON).
- 1 earlier build → `note_md too short; simplified_md too short; primer: no cards; recall: no cards` (model returned near-EMPTY content).
- 1 premium-model single build → stuck "processing" for 3.5+ min (likely free-instance timeout/spin-down).
Net: **0 topics created**; the account still has no content to test Q-banks on.
**Diagnosis:** BUG-03's retry + friendly error is confirmed LIVE and working (error is now the specific message), but it only surfaces the failure — the underlying model output is bad/empty. Root-cause candidates: (a) the DB build-prompt doesn't force a minimum note length / N cards, so short inputs yield empty output; (b) `BASIC_MODEL` returns non-JSON; (c) the free onrender instance times out on longer premium generations / two parallel builds. 
**Next steps (server-side, needs onrender logs):** inspect the prompt template (min-content requirement), confirm which models `BASIC_MODEL`/`PREMIUM_MODEL` are, raise `GEN_TIMEOUT_MS` or the instance tier, and consider requiring a longer minimum input. The scheduled QA task will code-review flows #3 (import server) and #4 (qbank) next.
**Status:** OPEN. Blocks seeding a test account via import — content will need to be created another way (fix the pipeline, or seed directly server-side with the service key).
