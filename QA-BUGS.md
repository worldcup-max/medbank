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

---

# Flow 2 — Add lecture / Import UI (`import-tab.js`) — code review, 2026-08-22

Scope: course/lecturer/title validation, the File / YouTube / Paste / Record source selector,
`createCourse`, and the `/import` request+response path. Static review only — nothing was run.
9 issues found: **5 fixed**, **4 logged for review**. `node --check import-tab.js` → PASS. Nothing committed.

## 🟠 IMP-01 — "🎙 Record" closes the sheet and opens nothing if the recorder isn't loaded — MEDIUM → ✅ FIXED
**What's wrong:** the segment button did `if(o.parentNode) document.body.removeChild(o); if(window.MB_openRecorder) MB_openRecorder();` — it tore the sheet down **before** checking. If `lecture-record.js` hadn't loaded (offline, stale SW cache, script error), the student's sheet vanished, nothing opened, everything they'd typed was lost, and there was no error at all. Worse in `opts.mandatory` mode (first-import gate): that sheet has no close button and no backdrop dismiss, so the only escape route silently destroyed it.
**Root cause:** `import-tab.js:144` — dismiss-then-check ordering, plus a bare `if(fn)` with no else.
**Fix applied:** check first; if `MB_openRecorder` is missing, keep the sheet open and `show("Recording isn't available right now — reload the app, or use File / YouTube / Paste.")`. Only remove the overlay once the recorder is confirmed present.

## 🟠 IMP-02 — A leftover file selection is uploaded in YouTube / Paste mode — MEDIUM → ✅ FIXED
**What's wrong:** `paintSeg()` only *hides* the file `<input>`; the chosen file stays in `file.files`. But the submit handler ran `usableFiles(file.files)` unconditionally, so a student who attached a PDF, changed their mind and switched to **Paste** or **YouTube** still had that PDF base64'd and sent. The model then built from two unrelated sources, and the (48 MB) request carried a payload the student thought they'd discarded.
**Root cause:** `import-tab.js:220` — no `srcMode` check, contradicting the comment one line above ("used in file mode, and as an optional add-on to a recording").
**Fix applied:** `var files=(recAudio || srcMode==="file") ? usableFiles(file.files) : [];` — recording add-ons still work, the other two modes send only their own source.

## 🟠 IMP-03 — A non-JSON server reply surfaced as "Unexpected token '<'" — MEDIUM → ✅ FIXED
**What's wrong:** `var out=await resp.json();` with no guard. Any HTML error page — onrender 502/504 cold-start, a proxy 413 on a big PDF, a gateway timeout — made `.json()` throw. The outer `catch` then displayed the raw parse error to the student. Given BUG-05 (imports timing out / hanging on the free instance) this is the *most likely* message a failing import actually shows today.
**Root cause:** `import-tab.js:236` — unparsed body assumed to be JSON.
**Fix applied:** wrapped in try/catch; on unparseable bodies show a status-aware message — 413 → "That upload is too large. Try a smaller PDF or fewer photos."; other non-OK → "The import server didn't respond properly (`status`). Try again in a moment."; OK-but-unreadable → tells them to check their topics before rebuilding (guards against a double-build charging twice). Button is re-enabled in every branch.

## 🟡 IMP-04 — Sends the literal header `Bearer null` when signed out — LOW/MEDIUM → ✅ FIXED
**What's wrong:** `token` stays `null` if `window.__mbSB` is absent or the session has expired, and it was interpolated straight into the header. The student got whatever the server's 401 body said rather than "your session expired", and it burns a pointless round-trip with a full base64 payload attached.
**Root cause:** `import-tab.js:232-235`.
**Fix applied:** bail before `fetch` with "You're signed out — sign in and try again.", re-enabling the button.

## 🟡 IMP-05 — Success alert can read "Built undefined primer + undefined recall cards" — LOW → ✅ FIXED
**What's wrong:** the completion `alert()` interpolated `out.primer` / `out.recall` with no check. Per BUG-05 the server can return a topic whose card arrays came back empty/absent, so the student's *only* confirmation message reads "undefined".
**Root cause:** `import-tab.js:243`.
**Fix applied:** coerce with `Number()` and fall back to "Done! Built your study set for X." when either count isn't finite.

## 🟡 IMP-06 — A rejected Supabase call made "Add a lecture" do nothing at all — LOW/MEDIUM → ✅ FIXED
**What's wrong:** `openImport` awaits `courses()` (line 67) and `loadLecturers()` (line 106) **before** `document.body.appendChild(o)` on the last line. Neither had a try/catch, and there's no `.catch` on the caller. On a dropped connection the promise rejected, `openImport` aborted mid-way, and the sheet was never inserted — tapping "Add a lecture" was a complete silent no-op. Also left `lecSel` wiped with not even the "＋ Add the lecturer" option, so recovery was impossible without a reload.
**Root cause:** `import-tab.js:30-35` and `55-61` — supabase-js normally resolves with `{error}`, but network/abort failures do reject.
**Fix applied:** both helpers now catch and return `[]`, so the sheet always renders (with the "add a new course/lecturer" escape hatches intact).

## 🟡 IMP-07 — No client-side upload-size cap — MEDIUM — proposed, needs review
**What's wrong:** the server caps JSON at 48 MB (`server.mjs:44`), but the client will happily base64 a 60 MB scanned PDF or 20 phone photos (base64 inflates ~1.33×) after a 30–60 s "Building…" wait, then fail on a 413. IMP-03 now at least gives a readable message, but the student has already paid the encoding wait, and on mobile data the upload itself.
**Fix direction:** sum `file.size` (plus `recAudio.size`) before encoding and reject above ~32 MB raw with "That's too big to upload — split the PDF or use fewer photos." Not applied: the right threshold depends on whether `/import` sits behind another proxy with a smaller body limit than express's 48 MB — worth confirming during Flow 3.

## 🟡 IMP-08 — `loadLecturers()` has no request ordering guard — LOW — proposed, needs review
**What's wrong:** `sel.onchange` fires `loadLecturers()` without awaiting it (`import-tab.js:104`). Switching course twice quickly runs two overlapping queries; whichever resolves last paints the `<select>`, so the lecturer list can belong to the *previously* selected course. The submitted `course_id` is read fresh from `sel.value`, so this misfiles the lecturer, not the course.
**Fix direction:** a monotonically increasing request token compared before painting. Not applied — needs the concurrency reasoning verified, and the window is narrow.

## 🟢 IMP-09 — Cosmetic / low-priority observations (logged, not fixed)
- **`courseNew.focus()` never works on first paint** (`import-tab.js:86`, called at :105): `syncCourseNew()` runs before the sheet is appended to the DOM, and `focus()` on a detached node is a no-op. A brand-new account (no courses → auto-selects "＋ Add your first course") therefore sees the input but doesn't get the keyboard. Deliberately not touched: moving the call after `appendChild` would also pop the mobile keyboard on every open, which may be unwanted.
- **Dead check** (`import-tab.js:191`): `if(!course_id)` can never be true — the `<select>` always contains at least the `__new__` option, so `sel.value` is never empty. Harmless.
- **Weak YouTube validation** (`import-tab.js:199`): `/(?:youtube\.com|youtu\.be)\//i` is a substring test, so `notyoutube.com/` passes and a bare `youtu.be/` (no video id) passes. Left alone — tightening it risks rejecting valid share/shorts/mobile URLs; the server should be the authority here (check in Flow 3).
- **The sheet can be opened on top of itself:** `MB_openImport()` builds a new overlay each call with no singleton guard, so double-tapping the nav item stacks two identical sheets.
- **VERIFY-01 is explained:** the "Model (admin A/B)" selector is correctly gated by `isAdmin` (`import-tab.js:68,175`), read from `accounts.is_admin` via `maybeSingle()`. It appeared for the non-admin `frankthejay` account on live `v207` because of the FIXED-01 admin-RLS bug, which made `accounts` return every row. With that policy dropped, this should no longer render for normal users — worth one live re-check, but no code change is needed.

**Verification:** `node --check import-tab.js` → PASS after all 5 edits. No `app.html` changes, no `APP_VERSION` / `sw.js` cache bump, nothing committed.

---

# Flow 3 — Import server build (`import-server/server.mjs`: `/import`, `validateObj`, `generate`, retry path)

Code review only — no runtime, no requests made. 11 findings (SRV-01..11): 6 fixed, 4 proposed, 1 notes block.
`node --check import-server/server.mjs` → **PASS** after all edits. Nothing committed.

## 🔴 SRV-01 — A scanned / image-only PDF was fed to the model as an empty lecture — HIGH → ✅ FIXED
**What's wrong:** `extractContent` pushed the PDF part **unconditionally**: `parts.push({text:"RAW LECTURE (PDF):\n\n"+d.text})`. `pdf-parse` returns `text:""` for a scanned or image-only PDF (photos of slides exported to PDF, a phone "scan", most lecture handouts distributed as images) — so the model received a prompt whose entire lecture was the header `RAW LECTURE (PDF):` and nothing else. It then either hallucinated a whole topic from the title alone, or produced junk that failed `validateObj` **twice** (two full paid model calls, up to 2×`GEN_TIMEOUT_MS` = 10 min) before the student was told "The AI returned an unreadable response. Please try building again." — advice that guarantees a second identical failure.
**Root cause:** `server.mjs:143` (old) — no check on `d.text`; and `/import` had no "did we actually extract anything?" guard before generating.
**Fix applied:** two guards.
1. `extractContent` only pushes the PDF part when the extracted text is non-empty, and wraps `pdf-parse` in try/catch (a corrupt/password-protected PDF used to surface its raw library error, e.g. "Invalid PDF structure", to the student) → *"Couldn't read that PDF — it may be damaged or password-protected. Re-save it and try again, or attach clear photos of the slides instead."*
2. `/import` now fails fast **before** the first model call when `!parts.length && !images.length` → HTTP 400 *"We couldn't read any lecture content from what you sent. If that PDF is a scan or image-only slides, attach clear photos of the slides instead, or paste the lecture text."*, and marks the import row `failed`.
**Also covers:** a recording that transcribes to silence, and a YouTube video whose captions yield no text (both previously produced the same empty-prompt build).
**Note:** the client-side guard added in Flow 2 (`import-tab.js:249`) only checks that a *file was attached* — it cannot know the PDF has no extractable text. This is the server-side half of the same bug.

## 🟠 SRV-02 — A crashed build left the import row stuck at "processing" forever — MEDIUM → ✅ FIXED
**What's wrong:** the handler set `status:"failed"` on exactly two paths (no active prompt, validation exhausted). Every *thrown* failure — transcription error, `topics` insert rejected, `cards` insert rejected, model timeout, network drop — fell to the outer `catch`, which only logged and returned 500. The `imports` row stayed `processing` permanently, so any "your imports" / admin view can never distinguish a build that's running from one that died, and the failure reason was never persisted.
**Root cause:** `server.mjs:824` (old) — bare `catch(e){ console.error(e); res.status(500)… }`, and `importId` was `const`-scoped *inside* the `try`, so the catch couldn't even see it.
**Fix applied:** hoisted `let importId = null;` above the `try`; the catch now writes `status:"failed"` with the truncated error message (itself wrapped in try/catch, since a supabase-js builder is a thenable without `.catch`).

## 🟠 SRV-03 — Card-insert failure leaves an orphan topic marked "ready" — MEDIUM — proposed, needs review
**What's wrong:** the topic row is inserted with `status:"ready"` (`server.mjs:816`) *before* the cards. If `admin.from("cards").insert(cards)` fails (`server.mjs:830`) the handler throws — but the topic is already saved and visible. The student gets a lecture in their library with a full note and **zero cards**; opening it dead-ends, and rebuilding creates a duplicate rather than repairing it. Worse, that orphan counts toward `builtCount()`, so a **free account is now permanently locked out** (`FREE_BUILD_LIMIT = 1`) by a build that failed.
**Fix direction:** insert the topic as `status:"building"` and flip to `"ready"` only after the cards land, or delete the topic row in the failure path. Not applied — it changes what the app's topic queries see (`status` is read in `app.html`/`sync.js`), which is outside this flow's review scope.

## 🟠 SRV-04 — Duplicate card questions can reject the whole card insert — MEDIUM — proposed, needs review
**What's wrong:** `card_key = topicId+"|p|"+hstr(c.q)` is derived purely from the question text (`server.mjs:828-829`), and the cards array is inserted with no de-duplication. An LLM repeating a question inside one deck (common on a thin lecture, and `validateObj` doesn't check for it) produces two rows with an identical `card_key`. If `cards.card_key` carries a unique constraint, the **entire insert** is rejected → SRV-03's orphan topic. If it doesn't, the student simply studies the same card twice.
**Fix direction:** de-dupe by `card_key` before inserting (keeping the first), and report the *inserted* counts in the response rather than `obj.primer.cards.length`. Not applied — I can't see the `cards` DDL from this flow's files, so I can't tell which of the two failure modes is live. **Worth checking the schema for a unique index on `card_key`** — if it exists, this is HIGH.

## 🟠 SRV-05 — A truncated response is reported as "unreadable", and the retry can't fix it — MEDIUM — proposed, needs review
**What's wrong:** the build parses with `raw.slice(raw.indexOf("{"), raw.lastIndexOf("}")+1)` (`server.mjs:801-802`). When the model hits its output cap, the JSON is cut off mid-object, `JSON.parse` throws, and the student is told *"The AI returned an unreadable response"* — the wrong diagnosis. The retry then runs the **same prompt at the same `max_tokens`**, plus an extra "your previous output was rejected" paragraph that makes the output *longer*, so it truncates again. `finish_reason` is available in the response and is never inspected; `genRawItems` already has `salvageItems()` for exactly this, but the core import path doesn't use it.
**Fix direction:** return `finish_reason` from `generate()` (additive), and on `length` either raise `max_tokens` for the retry or report *"the lecture is too long for one build — split it"*. Not applied — `generate()` is shared by qbank/podcast/visualize/solve, so it belongs in a change reviewed across all of them.

## 🟠 SRV-06 — Total worst-case `/import` time can exceed the host's request timeout — MEDIUM — proposed, needs review (answers IMP-07)
**What's wrong:** one request can serially run: transcription (up to a 25 MB upload to Groq/OpenAI) → model call #1 (up to `GEN_TIMEOUT_MS`, **default 300 s**, `server.mjs:175`) → model call #2 on retry (another 300 s) → then the extras loop, which builds `qbank` and `written` **sequentially** (`server.mjs:838`), each itself a multi-call generation. Comfortably 12+ minutes worst case. Render/Railway/Cloudflare front-ends cut idle requests well before that, so the student gets IMP-03's HTML 502/504 — *while the server keeps building and eventually saves the topic*. That is a strong candidate for what **BUG-05** actually is, and it's why the IMP-03 "the build finished but the reply couldn't be read — check your topics before rebuilding" wording matters.
**Fix direction:** make `/import` return `202 + importId` immediately and have the client poll the `imports` row (the row already carries `status`/`topic_id`), or at minimum cap the end-to-end budget below the proxy's. Not applied — architectural.
**Also answers IMP-07's open question:** express's own cap is `48mb` (`server.mjs:44`), so a client-side cap of ~32 MB raw (base64 inflates ~1.33×) is the right threshold *provided* nothing smaller sits in front; that has to be confirmed on the host, not in code.

## 🟡 SRV-07 — Extras failures were swallowed completely — LOW/MEDIUM → ✅ FIXED
**What's wrong:** `try{ …buildExtra… }catch(_){}` (`server.mjs:838`). A student who ticked "Q-bank" got a "Done!" with no Q-bank, no error, and nothing in the server log to explain it. Recoverable (the app can call `/build-extra` on demand), but undiagnosable.
**Fix applied:** both the throw and the empty-result case now `console.warn` with the kind and topic id. Left as non-fatal deliberately — the core lecture built fine and shouldn't be failed for a missing extra. Reporting the built extras back in the response is a UI decision; logged here rather than changed.

## 🟡 SRV-08 — `images: []` mislabelled the import's `source_kind` — LOW → ✅ FIXED
**What's wrong:** `req.body.images ? "images" : "text"` in **both** the `imports` row (`server.mjs:747` old) and the `topics` row (`:792` old) — an empty array is truthy, so any caller sending `images:[]` had a pasted-text import filed as an image import. Corrupts the source-mix analytics the pilot is meant to read.
**Fix applied:** computed once into `const sourceKind` (checking `images.length`) and used in both rows — also removes the duplicated expression that let the two rows drift apart.

## 🟡 SRV-09 — A failed `imports` insert silently no-op'd every later status update — LOW → ✅ FIXED
**What's wrong:** `imp.error` was never checked, so on failure `importId` was `undefined` and each subsequent `.eq("id", importId)` matched nothing — the build ran to completion with no import record and no trace of why.
**Fix applied:** `console.warn` on `imp.error`, and `importId` normalised to `null`.

## 🟡 SRV-10 — `validateObj` accepts recall cards with blank options — LOW/MEDIUM — proposed, needs review
**What's wrong:** `validateObj` (`server.mjs:64-75`) checks `opts` is a 4-item array and `ans` is 0-3, but never that the options contain anything. `["Hypotension","","",""]` passes and reaches the student as an MCQ with three blank buttons. Compare `validateQbankItems` (`:333`) which does exactly this check: `it.options.every(o=>String(o||"").trim())`. Related gaps: options aren't checked for duplicates, `q`/`a` aren't length-checked, and nothing verifies `opts` are strings.
**Fix direction:** add `if(!c.opts.every(o=>String(o||"").trim())) errors.push(...)` — the retry loop is designed to absorb exactly this. Not applied: tightening validation raises the build-failure rate, and per the FREEZE rules a change that makes more imports fail needs a human call, not an autonomous one.

## 🟢 SRV-11 — Lower-priority observations (logged, not fixed)
- **`$`-substitution in prompt templating** (`server.mjs:778-780`, and `buildExtra`'s `.replace(/\{\{note\}\}/g, note)`): `String.replace` interprets `$&`, `$'`, `` $` `` and `$$` **in the replacement string**. A topic title or a generated note containing `$&` silently corrupts the prompt. Use a function replacer (`() => topicName`) if it ever bites; impact today is negligible.
- **`temperature` is ignored on the OpenAI path** (`server.mjs:219`): only `max_completion_tokens` is set, deliberately. So the retry's `temperature: 0.35` (`:800`) — the whole point of which is to shake the model off a bad response — is a **no-op for any `gpt`/`o` model**. It does work for the DeepSeek default. Worth knowing before anyone concludes "the retry doesn't help".
- **`Number(pt.data.temperature) || 0.3`** (`:800`) turns a deliberately configured `temperature: 0` into `0.3`. Same pattern at `:298`. Use `== null` checks if a zero-temperature prompt row is ever wanted.
- **The Claude branch in `generate()` is dead code** (`:177`): the line above rewrites any `claude*`/empty model to `TEXT_MODEL`, so `m.startsWith("claude")` can only be true if `MEDBANK_TEXT_MODEL` is itself set to a Claude model. Harmless, but the `anthropic` client and `ANTHROPIC_API_KEY` are now effectively unused by this path.
- **The subscription is queried twice per import**: `isPremium()` at `:748` and again directly at `:773` for the model tier. One extra round-trip on every build; also means the gate and the tier could disagree for a `PREMIUM_TEST_EMAILS` account (test-premium gets unlimited imports but is still built on `BASIC_MODEL`) — intentional-looking, but confirm that's the desired behaviour for QA accounts.
- **`builtCount()` fails open, `isPremium()` fails closed** (`:100` / `:99`): a transient DB error grants a free user an extra import, but denies a paying user their premium model. The asymmetry is defensible (be generous on quota, cautious on spend) — noting it so it's a decision rather than an accident.
- **No YouTube URL validation server-side** (answering IMP-09's open question): `/import` passes `body.youtube_url` straight to `YoutubeTranscript.fetchTranscript`, whose failure is already converted to a friendly message. So the client's loose regex is not a security or crash risk — the library is the authority, as hoped.
- **`topicName` is unbounded** and interpolated into the prompt; no length cap anywhere in the chain.
- **No idempotency:** two rapid `/import` posts build (and bill for) two topics. The client disables its button, so this only matters for retries/other callers.

---

# Flow 4 — Q-bank generation (`buildExtra('qbank')`, `buildQbankBatched`, `validateQbankItems`, `/build-extra`) — code review

Reviewed `import-server/server.mjs` only (plus the two client call sites `app.html:2464-2485` and the render at `:2646` for the data contract). Static review — nothing was run.

## 🟠 QB-01 — A non-integer `answer` silently destroys the whole question (and can empty the q-bank) — MEDIUM → ✅ FIXED
**What's wrong:** `validateQbankItems` required `Number.isInteger(it.answer)` (`server.mjs:344` old). Models very commonly return `"answer":"2"`, `"answer":"B"` or the option's text instead of a 0-based index — every one of those failed the filter and the item was dropped with **no log line**. Because qbank is generated as 5 parallel batches of **3 questions each** (`buildQbankBatched`), one such habit doesn't cost one question — it costs a whole batch, and if the model is consistent it empties the entire set. `buildQbankBatched` then returns `null` → `/build-extra` answers `502 "couldn't build this — try again"` (`:908`), and the student's retry hits the identical failure forever. Same failure shape as SRV-01: the wrong diagnosis shown to the student, and a retry that cannot possibly work.
**Fix applied:** a `coerceAnswer(a, opts)` step ahead of the filter (`server.mjs:337-358`) accepts a real integer, a digit string (`"2"`), the option text verbatim (case-insensitive exact match), and a bare letter key (`"B"`, `"B)"`, `"B."`, capped at 3 chars so an option that merely *starts* with "A " can't be mistaken for index 0). Anything else still becomes `NaN` and is dropped by the unchanged filter — so this only ever *recovers* items, never admits worse ones.

## 🟡 QB-02 — `temperature: 0` in a prompt row was silently rewritten to 0.3 — LOW → ✅ FIXED
**What's wrong:** `Number(row&&row.temperature)||0.3` (`server.mjs:308` old) — the same falsy-zero pattern already flagged in SRV-11. An admin who sets `temperature: 0` on a `prompt_templates` row (the obvious thing to do to make question generation reproducible) gets 0.3 and no indication why the output still varies.
**Fix applied:** `row.temperature != null && !isNaN(...)` check instead (`server.mjs:308-309`).

## 🟡 QB-03 — The batched qbank path ignored the prompt row's temperature entirely — LOW → ✅ FIXED
**What's wrong:** `buildQbankBatched` hard-coded `0.3` in its `genRawItems` call (`server.mjs:403` old) and was never even passed `row.temperature`, while the single-shot (`written`) path honoured it. So a per-level tuned temperature applied to `written` and was a **no-op for qbank** — the exact kind of "I changed the config and nothing happened" that costs an afternoon.
**Fix applied:** `rowTemp` threaded through `buildExtra` → `buildQbankBatched` (`:306`, `:410-414`), defaulting to 0.3 exactly as before when unset or unparseable. Note this only bites on DeepSeek: per SRV-11, `temperature` is not sent at all on the OpenAI path (`:228-229`).

## 🟡 QB-04 — `/build-extra` would build a q-bank from an EMPTY note — LOW/MEDIUM → ✅ FIXED
**What's wrong:** `/build-extra` read `t.data.note_md` and passed it straight to `buildExtra` with no emptiness check (`:906` old). `buildQbankBatched` does `tmpl.replace(/\{\{note\}\}/g, note || "")` — a null note produces a prompt ending in "LECTURE NOTE:" and nothing else. That is **5 paid model calls** that either fail or, worse, succeed by inventing 15 questions from general knowledge, which are then cached onto the topic as if they came from the lecture. Precisely the SRV-02 empty-PDF failure in a second place.
**Fix applied:** `422 {error:"no_note", reason:"This lecture has no note to build questions from — rebuild the lecture first."}` before any model call (`:903`). The client surfaces `out.reason` (`app.html:2472`) and does not auto-retry on 422 (its retry is 502/503/504 only), so the student sees a true message instead of a spinner and a generic failure.

## 🟡 QB-05 — A half-failed batch set was indistinguishable from a full one in the log — LOW → ✅ FIXED
**What's wrong:** each batch's `.catch` returned `[]` (`:403` old) and the summary line only printed the merged raw count — so "4 of 5 batches died" and "the note was thin" produced the same log. Nothing to diagnose QB-06 with.
**Fix applied:** the summary now reports how many batches errored and how many returned nothing (`:423-431`).

## 🟠 QB-06 — A partially-failed build is cached as a complete q-bank — MEDIUM — proposed, needs review
**What's wrong:** there is no floor on the result. `buildQbankBatched` returns `items.length ? items : null` (`:434`), so **one surviving question counts as success**. If 4 of the 5 parallel calls hit a rate limit (all five fire simultaneously against the same provider — a 429 here is the *expected* failure, not the exotic one), the student gets a 3-question "Q-bank", `/build-extra` writes it into `topics.extras` (`:910`), and the cache check `if(have && have.length && !force)` (`:900`) means **every later visit returns those 3 questions without ever calling the model again**. The student has no way to know the set is a quarter-built. A `↻ Rebuild` button exists (`app.html:2481`, sends `force:true`) so it's recoverable — but only by a student who suspects something is wrong.
**Fix direction:** treat a build with `failed > 0` (now counted — QB-05) or `items.length < ~6` as partial: either don't persist it, or persist it with a `partial:true` marker the topic page can show as "3 of ~15 built — tap rebuild". Not applied: "what counts as good enough to keep" is a product call, and the alternative (throw on partial) would turn a usable 10-question set into a hard failure.

## 🟠 QB-07 — The de-dup systematically eats the exam-trap batch — MEDIUM — proposed, needs review
**What's wrong:** `raw = [].concat(...settled)` (`:426`) preserves `FOCI` order, and the de-dup loop keeps the **first** item of any colliding pair (`:392-402`). FOCI is ordered interpretation → clinical_reasoning → clinical_reasoning → complex_reasoning → **exam_trap last** (`:415-421`). So on a thin lecture — where several batches necessarily land on the same subtopic — the questions dropped are disproportionately the `complex_reasoning` and `exam_trap` ones, i.e. exactly the two levels the v1.7 spec cares most about, and the two the student is least likely to get elsewhere. The `(st && k.st===st)` rule (`:398`) makes this sharp: **one shared subtopic label is enough**, no stem similarity required, so a "Hyperkalaemia" interpretation item silently kills the "Hyperkalaemia" next-step trap item.
**Fix direction:** interleave the batches round-robin before de-duplicating so each focus contributes evenly, or make the survivor the rarer cognitive level rather than the earlier one. Not applied: it changes the composition of every q-bank generated during a running pilot, which is a human call.

## 🟠 QB-08 — Short/misaligned `rationales` can attach the right explanation to a wrong option — MEDIUM — proposed, needs review
**What's wrong:** `rationales: (Array.isArray(it.rationales) ? it.rationales : []).slice(0, it.options.length)` (`:376`) truncates a long array but **never pads a short one, and never checks the lengths match**. The client indexes strictly positionally — `q.rationales[j]` for option `j` (`app.html:2646`, `:2695`) — and renders nothing when the entry is missing. Two consequences: (a) if the model omits a rationale *in the middle* (rather than running out at the end), every later rationale shifts up one and the student is shown a confident explanation **next to the wrong option** — including, potentially, the correct answer's reasoning printed under a distractor; (b) if the missing one is the answer's, the student who got it wrong gets no explanation at all, which is the entire point of the mode.
**Fix direction:** compare `rationales.length` to `options.length` at validation time and, on a shortfall, either drop the rationales for that item (safe but lossy) or drop the item. Not applied deliberately: a short array is *usually* a token-budget truncation, where the entries present are correctly aligned and worth keeping — I can't tell truncation from omission from the data, so binning them would throw away good teaching on the common case to fix the rare one. Needs a human decision (a cheap middle ground: keep them, and log a warning with the topic id so the real frequency becomes visible).

## 🟠 QB-09 — `max_tokens: 12000` per batch is never clamped to the provider's cap — MEDIUM — proposed, needs review (**RUNTIME — needs a live call to confirm**)
**What's wrong:** `const per = rowMax || 12000` (`:412`) is sent as `max_tokens` on every batch (`:228`). Several OpenAI-compatible providers reject rather than clamp a `max_tokens` above the model's output cap (DeepSeek's chat models have historically capped at 8192). If the configured `EXTRAS_MODEL` is one of them, **all five batches fail with the identical 400**, `raw.length` is 0, and the student gets "couldn't build this — try again" forever — a q-bank feature that has never worked once, presenting as a transient error. Note the default is `rowMax || 12000` where `rowMax` comes from the prompt row, so this is silent config drift, not a fixed constant.
**Fix direction:** clamp `per` to a known-safe value (8000 covers 3 questions comfortably) or read the cap from the provider. Not applied: I can't verify the live model's real cap from code, and lowering it blindly could truncate legitimate output. **Confirm with one live `/build-extra` call and check the server log** — if the batches are erroring, this is HIGH and it is the whole bug.

## 🟡 QB-10 — `/build-extra` is unmetered and unlimited — LOW/MEDIUM — proposed, needs review (overlaps flow 18)
**What's wrong:** the handler has no entitlement gate, no quota and no `bump_ai_usage` call (`:889-913`) — compare `/import` which meters (`:872`), `/solve` which is premium-gated (`:1113`), and `/visualize` which enforces a daily limit with a 429 (`:1185`). A q-bank build is **five model calls**, and the client exposes a `↻ Rebuild` button that sends `force:true` (`app.html:2481-2485`), bypassing the cache. Any signed-in free account can hold that button down. No per-account record of the spend exists either, so it won't show up in the pilot's usage numbers.
**Fix direction:** meter it (`bump_ai_usage` with `p_feature:"extra"`) and give it the same daily-limit treatment as `/visualize`. Not applied: entitlement policy is flow 18's call, and adding a gate mid-pilot could lock students out of a mode they're relying on.

## 🟢 QB-11 — Lower-priority observations (logged, not fixed)
- **`QBANK_BATCHES < 5` silently truncates the taxonomy** (`:422`): `FOCI.slice(0, ...)` takes the *first* N foci, so setting `QBANK_BATCHES=3` to save money doesn't thin the set evenly — it removes `complex_reasoning` and `exam_trap` **entirely**, while the config reads like a volume knob. Sample from the list instead, or document it.
- **`trap_explanation` survives an invalid `trap_type`** (`:370-371`): an unrecognised `trap_type` is blanked but the explanation is kept, so the client can show a trap hint on a question with no trap type. Harmless, and blanking it would lose good text on a mere misspelling — noting only.
- **Options are never checked for duplicates or for being strings** (`:363`): `it.options.every(o => String(o||"").trim())` passes for `{text:"..."}` objects, which then render to the student as `[object Object]` via `it.options.map(o=>String(o).trim())`. Two identical option strings also pass, making the item unanswerable. Same family as SRV-10.
- **A q-bank build inside `/import` extends the request by five more model calls** (`:859-867`, sequential per kind): directly feeds SRV-06's proxy-timeout problem. Ticking "Q-bank" at import time is the slowest path in the app, and the extras are the *last* thing built — so a timeout loses exactly the extra the student asked for, while the lecture itself survives.
- **`/build-extra` accepts `force` from the client with no throttle** and overwrites the cached set with whatever the rebuild returns — including a worse or smaller one (QB-06). A rebuild that produces *fewer* questions than the cached set replaces it silently.
- **`genRawItems` swallows the distinction between "model refused" and "JSON was unreadable"** (`:315-321`): both end as an empty array. With `salvageItems` in front of it the parse path is fairly robust, but the caller can't tell a content refusal from a formatting failure.

---

# 🧪 Live end-to-end validation session — 2026-08-22 (Claude, test account frankthejay)

Drove the real **Q-bank → engine → Smart Drill → telemetry → cloud** pipeline on the imported *Bronchiolitis* topic (11 Q-bank items), answering through the real handlers (`qbStart`/`qbPick`/`qbSetConf`/`qbNext`), then ran the frozen engine and Smart Drill and read the data back from Supabase. Two new bugs found and fixed (both infrastructure, engine untouched); pipeline otherwise validated.

## 🔴 SYNC-EVENTS-01 — Pilot telemetry (`_events`) is dropped on every sync merge/adopt — HIGH — ✅ FIXED (sync.js, not deployed)
**Observed:** After logging 7 pilot events (`smart_drill_started`×2, `smart_drill_completed`×2, `reco_agree`×2, `reco_accept`×1) and syncing (cloud `profile_state` rev 18 correctly held all 7), a tab reload left **local `_events` = 0 while `_attempts` (40) survived** — both at rev 18, `dirty:false`. Cloud still had 7, local had 0, and sync believed it was in sync.
**Root cause:** `mergeQbankStore()` (`sync.js:101`) rebuilds `qbank` as a fresh `m={}` and unions `_attempts`, `_qmeta`, `_sessions` — but **never copies `_events`**. Every merge/adopt path (`mergeState` line 147, and the adopt path line 269) therefore strips telemetry locally.
**Why it's HIGH for the pilot:** the danger is the *next push*. Once local `_events` is empty, the student's next action pushes the near-empty array **over the cloud's accumulated events**, permanently losing them. Across a pilot where students reopen the PWA daily and sync across devices, this silently shreds most `smart_drill_*` / `reco_*` telemetry — the exact data the whole Supabase backend was built to collect. (The admin dashboard reads cloud, so it would show ever-resetting counts.)
**Fix:** added an `_events` union in `mergeQbankStore` mirroring `_attempts`/`_sessions`, deduped by content signature (events carry no unique id), capped at 1000, sorted by ts; sets `__qbAdded` when local carries events the base lacks so they get pushed up.
**Verified:** `node --check sync.js` OK; standalone node merge test (`/tmp/test_events_merge.mjs`) — local 3 events + remote 3 events (1 overlapping) → **5 unique events preserved**, attempts unioned to 3. PASS. Old code produced no `_events` at all.
**Status:** ✅ fixed on disk, NOT deployed. Cherry-pick into the pilot baseline before onboarding real students — otherwise the pilot's telemetry is unreliable.

## 🟠 AUTH-ISO-01 — Out-of-band account change leaves the previous account's data on screen — HIGH — ✅ FIXED (auth-ui.js, not deployed)
**Observed (this session):** the tab's auth session was `frankthejay` (uid `96259a94`) while the app rendered **`frankthewiz1`'s** content (9 topics / 47 cards, streak, "weakest"). A hard reload fixed it (showed frankthejay's real 1-topic state), proving the on-screen data was stale in-memory `DATA` from the previous account.
**Relationship to BUG-01:** BUG-01's fix (`sync.js init` uid-guard → purge + reload) only runs on **init** (page load / normal in-app login via `afterAuth`→`startSync`→`MB_SYNC.init`). It does **not** cover an account change that arrives **out-of-band** — e.g. another tab/window signs in as a different user and Supabase propagates the new session into this tab, which never re-runs init. The `onAuthStateChange` handler (`auth-ui.js:401`) only handled `PASSWORD_RECOVERY`, so these events were ignored and the tab kept rendering the old account.
**Fix:** extended the `onAuthStateChange` handler to reload into a clean state on a genuine account change: on `SIGNED_IN`/`TOKEN_REFRESHED`/`USER_UPDATED` where the session uid differs from stored `mb_current_uid`, and on `SIGNED_OUT` while a uid was cached (also clears `mb_current_uid`). Only fires on a real change, so no reload loop; the normal login path is unaffected (init already set `mb_current_uid` before its own reload).
**Verified:** `node --check auth-ui.js` OK. **Not runtime-verified** (would need a two-tab account-switch on a live build).
**Status:** ✅ fixed on disk, NOT deployed. Cherry-pick alongside BUG-01/BUG-02.

## ✅ VALIDATED — the diagnostic engine + telemetry work end-to-end on real data
Drove a deliberately diagnosable answer pattern (management = confident-wrong, investigation = unsure-wrong, diagnosis = confident-correct, differential = correct-but-unsure) across 3 tutor passes (33 attempts). The **frozen `smartDiagnose` produced exactly the right two-axis reads**:
- investigation (0% acc, no confident-wrong) → **gap**
- management (14% acc, 6 confident-wrong) → **misconception** — correctly separated from gap despite identical low accuracy
- diagnosis (100%) → **solid**; **differential (100% but all unsure) → fragile** — same accuracy as "solid", flagged differently purely on the confidence axis (the core thesis of the engine, working)
- `smartDrillPlan` produced coherent focus chips + "why" reasons; Smart Drill ran; **all 4 pilot events fired and synced to Supabase `profile_state`** (verified by reading the account's own row back: 7 events, 40 attempts, 5 sessions). `smartValidation()` computed the pilot readout correctly.

## 🟡 OBS — smaller notes from the session (engine frozen → not changed)
- **Thin-bank Smart Drill shrinkage:** with a single 11-Q topic all recently seen, the 2-day reuse cooldown (`smartDrillPlan`) shrank a requested 20-question drill to **4**. Correct by design, but a pilot student with one imported topic gets very short drills — consider a "short drill, limited fresh questions" note or relaxing the cooldown when the pool is small. (Product call; engine is frozen.)
- **`smartValidation` "recovered 6 of 5":** the concept-recovery ratio can exceed 100% when a concept oscillates wrong→right→wrong→right (recovery events counted against unique-concepts-ever-wrong). Display quirk only; `smartValidation` is frozen — note for post-pilot.
- **Topic route → Home fallback:** navigating to `#/topic/<id>` for an id not in the loaded set silently renders **Home** rather than a "topic not found"/loader state (the `NEEDS_TOPIC` guard only catches the not-yet-loaded case, not the genuinely-absent case). Minor.
- **Renderer instability under rapid re-render:** issuing many `render()`/page-builder calls back-to-back (a 27-route sweep, then a 6-builder probe) froze the tab twice this session. Not reproduced in normal single-route navigation and likely aggravated by the messy multi-login state created during testing — flagged, not confirmed as a product bug.

---

# Flow 5 — Podcast generation (`/podcast`, `/podcast-audio`, TTS: Fish / OpenAI / Kokoro) — code review, 2026-08-22

Reviewed `import-server/server.mjs:437-667` (script prompt, `podcastScript`, `fishMultiTTS`, `fishTTS`, `kokoroTTS`, `openaiTTS`, `_ttsRaw`, `ttsClip`, `uploadPodcastAudio`) and `:919-1140` (`/podcast`, `/podcast-voices`, `/podcast-audio`), plus the client call sites `app.html:3498-3575` (`podLoadScript`, `podGenAudio`) and `:3599-3606` (per-line regen) for the data contract only. Static review — nothing was run. **Line numbers below are POST-fix.** 11 findings: 6 fixed, 4 proposed, plus notes.

## 🟠 POD-01 — `/podcast` builds an episode from an EMPTY note — MEDIUM → ✅ FIXED
**What's wrong:** `/podcast` read `t.data.note_md` and passed it straight to `podcastScript` with no emptiness check. `podcastScript` does `tmpl.replace(/\{\{note\}\}/g, note || "")` (`:491`), so a topic whose build saved the row but never produced `note_md` sends the model a prompt ending in "LECTURE NOTE:" and nothing else — a paid call that either fails (→ `502 "couldn't write the script — try again"`, `:940`) or, worse, **succeeds by inventing a whole medical podcast from general knowledge**, which is then cached onto the topic and spoken aloud to the student as if it came from their lecture. This is the third instance of the same hole: SRV-02 (empty PDF) and QB-04 (`/build-extra`) were both fixed; `/podcast` was missed. Directly comparable code: `/build-extra:903` already has the guard.
**Fix applied:** `422 {error:"no_note", reason:"This lecture has no note to build a podcast from — rebuild the lecture first."}` before any model call (`:936`), mirroring `/build-extra` exactly. The client shows `r.data.reason` (`app.html:3503`) and its retry loop is 502/503/504-only, so a 422 surfaces the real message instead of a spinner.

## 🔴 POD-02 — Total voice failure returned `HTTP 200 ok:true` — the student got a silent, endless spinner — HIGH → ✅ FIXED
**What's wrong:** in the per-line worker, a clip that failed both attempts was swallowed (`:1116`) and simply left `urls[i] = null`. Nothing counted failures, so if **every** clip failed — no TTS provider configured (`ttsClip` throws "No TTS provider configured", `:643`), a bad `FISH_API_KEY`, Kokoro host down and no Fish key, or the `podcasts` storage bucket missing — the endpoint still answered `{ok:true, done:false, remaining:N, urls:[null,…]}` with **no error field at all**. The client (`app.html:3542`) treats that as "partial progress, keep going" and re-requests up to **14 times**, each pass running to the full 40 s server budget, before finally throwing *"This episode is taking longer than expected — tap Generate again to finish it."* So a hard configuration failure is reported to the student as a slowness problem, after ~10 minutes of spinner, with a suggested action (tap Generate again) that can never work. Same "wrong diagnosis + unwinnable retry" shape as SRV-01/QB-01.
**Fix applied:** the worker now counts `_made` / `_failed` and keeps `_lastErr`; after progress is persisted, a pass that attempted clips and produced **none** returns `502 {error:"voice generation failed — <real reason>", engine}` (`:1130-1132`). Guarded with `&& !done` so a pass that only skipped already-finished clips is unaffected, and partial progress still returns 200 exactly as before. The seamless path got the matching guard (`:1077`) for the case where every chapter *and* every per-line fallback failed and `segments:[]` was returned as a success.

## 🟠 POD-03 — The seamless fallback re-bought clips it already had, and could LOSE them — MEDIUM → ✅ FIXED
**What's wrong:** the seamless (multi-speaker Fish) path resumes by keying finished work as `from_to` in `have` (`:1049`). When a chapter's one-shot multi-speaker call fails it drops to per-line clips, which are pushed as `{from:i, to:i}` — so a *chapter* key like `5_9` is **never** satisfied by the per-line clips `5_5, 6_6, 7_7` a previous pass already generated and uploaded. Two consequences: (1) every subsequent pass re-spoke every line of that chapter through **paid Fish**, and (2) `extras.podcast.seg[seamKey]` is overwritten with only what *this* pass pushed (`:1076`) — so a line that succeeded last pass but failed this pass **disappears from the persisted segments**. Coverage can therefore go *backwards*, and `allDone` may never become true no matter how many times the student retries (the client caps at 14 passes and then reports "taking longer than expected" — POD-02's misleading message again).
**Fix applied:** the per-line fallback now checks `have[i+"_"+i]` first and reuses the existing segment (`:1067`). The upload path is `L{i}.mp3` under the same `seamKey`, so the URL is stable and this is a pure cache hit — no behaviour change beyond not re-billing and not losing work.

## 🟠 POD-04 — One storage failure discarded every paid clip in the pass — MEDIUM → ✅ FIXED
**What's wrong:** `uploadPodcastAudio` **throws** when the bucket is missing or storage errors (`:665`). In the per-line worker that throw was unguarded, so it rejected `Promise.all` (`:1124`) and fell through to the outer `catch` → `500`. Because `extras` is persisted **after** `Promise.all`, a failure on clip 15 of 16 threw away all 14 successfully-generated, already-paid-for clips from that pass — and since the failure is deterministic (missing bucket), all 14 client retries repeated the same burn with **zero** saved output. The seamless path already handled this correctly with a per-line `try/catch` (`:1068`); the per-line path did not.
**Fix applied:** the upload is wrapped in `try/catch` inside the worker (`:1115-1120`) — a failed upload now just leaves `urls[i] = null` (picked up by the resume pass) and counts toward `_failed`, so the rest of the pass is persisted and POD-02's guard reports the storage error instead of a bare 500.

## 🟡 POD-05 — Per-line regenerate could create array holes that make `.every()` report "done" — LOW → ✅ FIXED
**What's wrong:** the regen path (`:1017-1030`) copies the cached URL array and writes `rarr[ri] = rurl`. If that cached array is **shorter** than the current script (the script was regenerated or migrated between runs), assigning past its end creates a **sparse array with holes**. `Array.prototype.every()` skips holes, so the "already fully generated" check at `:1071` (`…[combo].every(Boolean)`) returns `true` for an array that is mostly missing, and the endpoint answers `{done:true, urls:[…undefined…]}`. The player then loads `undefined` for those lines. Narrow trigger, silent failure.
**Fix applied:** `rarr` is normalised to `script.length` with explicit `null`s before the write (`:1022-1025`).

## 🟡 POD-06 — Both hosts can silently resolve to the SAME voice — LOW/MEDIUM → ✅ WARN ADDED (root cause is config; needs a decision)
**What's wrong:** `providerReady("fish")` only checks that `FISH_KEY` exists (`:604`) — it never checks that any Fish **voice reference id** is configured. On a host with `FISH_API_KEY` set but no `FISH_VOICE_*` ids: `FISH_VOICES` is empty → `/podcast-voices` returns `[]` → the client falls back to `POD_OPENAI` (`app.html:3527`), whose keys are OpenAI voice names (`nova`, `shimmer`, …) → `fishRefForKey("nova", …)` matches nothing → `vA` and `vB` both fall through to `undefined` (`:1004-1005`, note `vB`'s explicit `|| vA`). Result: `fishMultiTTS` is called with `reference_id: [undefined, undefined]` → serialises to `[null,null]` → Fish almost certainly 400s → **every chapter fails and falls back to per-line**, where `fishTTS` omits `reference_id` entirely (`:571`) and uses Fish's default voice for **both** hosts. The student gets a "two-host podcast" spoken end-to-end in one indistinguishable voice, after a wasted failed API call per chapter, with nothing in the logs saying why.
**Fix applied:** a loud `console.warn` when `!vA || !vB || vA===vB`, naming the requested keys and the env vars to set (`:1006`), so it is diagnosable alongside `/health`'s `voiceA`/`voiceB` booleans.
**Not applied (needs review):** the real fixes are (a) make `providerReady("fish")` also require a voice id, and/or (b) skip the multi-speaker path when the two refs are not distinct, since it cannot possibly distinguish speakers and only wastes a call. Both change provider-selection behaviour on a live pilot host — your call.

## 🟡 POD-07 — A failed script cache write was silent (every open re-bills a model call) — LOW → ✅ LOGGED
**What's wrong:** `/podcast` persisted the script with a bare `await admin.from("topics").update(...)` whose result was discarded, commented "ignored if extras column absent" (`:944`). If that write ever fails, the script is never cached and **every single open of that podcast pays for a fresh 7000-token script generation** — with no signal anywhere. (Same discarded-result pattern at `/build-extra:913`, `:1075`, `:1128`.)
**Fix applied:** the result is captured and `console.warn`ed on error (`:945`). Deliberately non-fatal — the endpoint still returns the script it just generated, exactly as before.

## 🔴 POD-08 — The 40 s time budget is not enforced *inside* a clip — a single slow chunk can blow the platform timeout — MEDIUM/HIGH — proposed, needs review
**What's wrong:** both paths check `Date.now() > DEADLINE` only **between** items (`:1050`/`:1091`, checked at `:1053` and `:1099`). But one item can take far longer than the whole budget: `fishMultiTTS` has a **60 s** abort timeout and retries up to 3 attempts with backoff (`:504-515`) → worst case ≈ **182 s for a single chapter**; `fishTTS` is 30 s × 4 attempts ≈ **124 s**, and the worker wraps that in its own 2-attempt loop (`:1104-1117`) → ≈ **250 s for one line**. The deadline is checked *after* that returns, so the "guarantees each request finishes" comment (`:1069-1070`) does not hold. The request dies at the proxy/platform limit instead, and — critically — the persist at `:1075`/`:1127` never runs, so **an entire pass of paid audio is lost** whenever this happens. This is the podcast twin of SRV-06 (total build time vs proxy timeout) and is a strong candidate for "the podcast just spins forever" reports.
**Fix direction:** thread the remaining budget into the TTS calls — cap each `AbortController` timeout at `min(providerTimeout, DEADLINE - Date.now())` and stop retrying once the budget is spent; or drop `SEAM_CAP`/attempt counts so worst-case-per-item fits inside the budget. Not applied: it changes timeout behaviour in every TTS caller (tutor, `/tts`, visualize all share `ttsClip`) and needs a live timing check to pick sane numbers. **RUNTIME — needs a live session to confirm the real per-chapter timings.**

## 🟡 POD-09 — Basic (Kokoro) students pick host voices that are ignored — LOW/MEDIUM — proposed, needs review
**What's wrong:** `/podcast-audio` **requires** `voiceA` and `voiceB` (`:971`) and the client makes the student pick two hosts from the picker — but on the Kokoro path both are discarded and replaced with `KOKORO_VOICE_A`/`KOKORO_VOICE_B` (`:1003`), and the cache key is just `"kokoro_"+mode` (`:1009`) with no voice component. So a basic-tier student chooses Ethan and Laura, hears two completely different voices, changes the pick, and hears **exactly the same audio** (now a cache hit) with no explanation. A confusing dead-end rather than a crash.
**Fix direction:** either offer Kokoro's own voice list to basic users and include the pick in the cache key, or grey out the picker for basic tier with a "host voices are a premium feature" note. Product call — not applied.

## 🟡 POD-10 — `/podcast-audio` is unmetered and can be made to spend paid Fish credits repeatedly — MEDIUM — proposed, needs review (hand to flow 18)
**What's wrong:** the endpoint is open to any signed-in student ("runs on their own built lecture", `:965`) with no quota check at all. Two ways that costs money: (1) the cache key `combo` includes the chosen **voice pair** (`:1009`), so a premium student can generate a fresh full episode for every voice combination — 8 catalogue voices ⇒ 56 distinct paid episodes per topic per mode; (2) for a **basic** student, if Kokoro is down the whole episode is switched to **paid Fish** (`:1000`) — the code detects this and even sets `degraded:true` (`:1134`), but it happily spends first and reports after. Pairs with QB-10 (`/build-extra` unmetered).
**Fix direction:** count episodes per account per period the way the import path is metered, and/or refuse (rather than silently upgrade) a basic-tier episode when Kokoro is down. Not applied — entitlement policy belongs to flow 18.

## 🟡 POD-NOTES — smaller observations, not fixed
- **Truncated script = permanent "try again".** `podcastScript` (`:494-500`) locates `{`/`}` and `JSON.parse`s; any failure returns `null` → `502 "couldn't write the script — try again"`. A script cut off by `max_tokens` (7000 for deep) fails *deterministically*, so the retry the message asks for can never succeed. The import path retries/repairs; this one does not. Salvaging the complete objects out of a truncated `lines` array would fix it — flagged, not applied (QB-01 class).
- **No floor on script length.** `if(!lines || !lines.length)` (`:939`) — a 2-line "podcast" counts as success and is cached permanently. The prompt asks for 16-50 lines; a sanity floor (~8) would catch a degenerate generation. Same shape as QB-06.
- **Wrong-mode script can be spoken.** `/podcast` keeps `extras.podcast.script` as *the latest* mode (`:943`), and `/podcast-audio` falls back to it when `scripts[mode]` is missing (`:979`). On a legacy topic that means a **quick** script can be generated as **deep** audio and cached under the deep key. Narrow (needs a legacy topic), so left alone.
- **`_ttsCache` is bounded by count, not bytes.** 400 entries (`:610`) of whole-line mp3s, never expiring by time, on the same box as everything else — a plausible OOM contributor on a small Render instance. Consider a byte budget.
- **Stale segments if the script changes.** Seamless resume keys are line **indices** (`:1049`); if the script is regenerated, old `from_to` segments map onto different lines. No version/hash on the cache key.
- **`openaiTTS` is dead code** (`:517-527`) — `_ttsRaw` explicitly rejects `"openai"` (`:622`) and `providerReady` never returns true for it (`:603-607`). Harmless, but the "fall back to OpenAI" comments at `:612-613` now describe behaviour that no longer exists and misled this review at first.
- **`/podcast-voices` comment says ElevenLabs** (`:945`) — it returns Fish voices. Stale comment.
- **RUNTIME — needs a live session to confirm:** whether the seamless multi-speaker Fish call actually succeeds on this account's `FISH_MODEL` (`s2.1-pro`), the real per-chapter timings behind POD-08, and whether audio plays gaplessly. This review could not run any of it.

---

# Flow 6 — Visualize feature (`/visualize`, viz rendering, client viz modal)
Reviewed `import-server/server.mjs` (`/visualize`, `/simplify`, `vizQuota`, `completenessCheck`) and the `app.html`
Visualize IIFE (`:6626-8402`) — modal player, inline card player, float pill, quiz layer, note-path replay.
**11 findings (VIZ-01..11). 6 fixed, 3 proposed-needs-review, plus notes.** The voice pre-gen / "tap to watch"
gating is deliberately left to flow 7.

## 🔴 VIZ-01 — A stepless blueprint was shipped AND cached forever → that sentence can never be visualized again — HIGH → ✅ FIXED
**What's wrong:** the only guard before shipping was `if(!bp)` (`server.mjs:1242`). `qcCheck` counts "too few steps
(0, need ≥5)" as an *issue*, not a rejection, and the corrective retry keeps the original whenever the retry also
fails QC (`:1240`, `ev2.pass || !bp`). So a blueprint with **zero or one** `narration_steps` was returned as
`ok:true` — the client refuses it ("Could not build this one — try a clearer single sentence", `app.html:8007`) —
**and it was written to the `visualizations` cache first** (`:1260`). The cache read happens *before* generation
(`:1204`), so from then on **every** student who highlights that sentence gets the poisoned row served instantly
and the same dead-end message, forever, with no code path that can ever replace it. Same family as QB-06
(a partial build cached as if complete) but worse, because the cache is global, not per-topic.
**Fix applied:** `narratedSteps(b)` helper (`:1192-1198`) counts steps with real narration text.
(a) the cache read only accepts a row with ≥2 narrated steps (`:1213`) — an already-poisoned row is now ignored
and rebuilt; (b) a freshly generated blueprint with <2 narrated steps returns 502 with the actionable message
*before* the cache write (`:1252-1256`) and is `console.warn`ed. Nothing else in the path changes.

## 🟠 VIZ-02 — A non-integer `quiz.answer` silently taught the WRONG answer and saved it to the SRS deck — MEDIUM/HIGH → ✅ FIXED
**What's wrong:** `askNext` (`app.html:7883-7885`) took the AI-authored per-step quiz and did
`var corr = (qz.answer!=null && qz.options[qz.answer]!=null) ? qz.options[qz.answer] : qz.options[0];`.
When the model returns `"B"`, or the option **text**, or an out-of-range index — exactly the failure QB-01
documented for the q-bank — `qz.options["B"]` is `undefined`, so `corr` **silently became option 0**. The student
is then told option 0 is correct, the real answer is marked wrong, and on a miss `showQuiz` writes a card with
`ans: opts.indexOf(correct)` straight into the review deck via `addVizCard` (`:7897-7898`) — so a wrong answer key
is *persisted* into SRS and re-tested for weeks. `"2"` happened to work (JS coerces), which is why this would
never show up consistently.
**Fix applied:** the index is parsed and range-checked (`:7885-7889`); if it isn't a valid index the AI quiz is
skipped entirely and the deterministic "what comes next?" quiz is used instead. Fail-to-safe, no wrong key.

## 🟠 VIZ-03 — Every server 502 was treated as a cold start: 5 rebuilds, ~22 s wait, and the real message thrown away — MEDIUM/HIGH → ✅ FIXED
**What's wrong:** `fetchBlueprint` retried `502|503|504` five times with backoff to cover Render's cold start
(`app.html:7935`). But `/visualize` returns **502 for its own deterministic failures** ("couldn't build a
visualization — try selecting one clear sentence"). Those were swallowed: the student waited
1.5+3+4.5+6 ≈ **15-22 s** and then saw `"Waking the Visualize server…"` — a message that tells them nothing and
suggests a retry that cannot work. Worse on cost: each attempt re-runs the whole handler, and one handler run is
up to **three** 8000-token generations (initial + QC retry + completeness regen), so one tap could bill
**up to 15 model calls** for a sentence that will never parse.
**Fix applied:** on 502/503/504 the body is parsed first; if it is JSON carrying `error`/`message` it is a real
verdict from our handler → thrown immediately with `fatal=true` and **not** retried (`:7941-7947`), matching the
existing 429 escape hatch (`:7952`). A genuine cold start returns HTML/empty, fails `.json()`, and still retries
exactly as before.

## 🟠 VIZ-04 — "Out of explainers" showed a 3.8-second error pill instead of the upgrade path — MEDIUM → ✅ FIXED
**What's wrong:** `/visualize` returns a rich 429 (`limit`, `premium`, and a message that literally says "Upgrade
to Premium for 10 a day", `server.mjs:1215-1217`) and `fetchBlueprint` carefully preserves it as `e.status`/`e.info`
(`:7934`). Both callers then dropped it: `aiVisualize`'s catch passed it to `vizFloatError`, which paints the pill
red and **deletes itself after 3.8 s** (`:7969`). So a free student who hits the 3/day cap sees a fleeting error,
no explanation that a limit exists, no reset time and no upgrade button — while `/simplify`'s handler for the very
same 429 does show `MB_PAYWALL.nudge` (`:7867-7872`). A monetisation dead-end, and it reads as a bug to the student.
**Fix applied:** shared `vizLimitHit(e)` (`:8025-8031`) — paywall nudge for basic, `vizNotice` (persistent-ish
toast) for premium — wired into `aiVisualize` (`:8021`) and `aiVisualizeInline` (`:8080`).

## 🟡 VIZ-05 — Closing the modal left a 9-second speechSynthesis timer running forever — LOW/MEDIUM → ✅ FIXED
**What's wrong:** `play()` starts a keep-alive `setInterval` that calls `speechSynthesis.pause()/resume()` every
9 s to defeat Chrome's ~15 s cutoff (`:7918`), and `say()` arms a watchdog `setTimeout`. `closeModal` only set
`playing=false` and called `stopSpeak()` (`:7696`) — it never cleared either timer, and `stop()` (which does) was
not called. So every open→close of the Visualize modal left a permanent interval poking the global speech engine
every 9 seconds for the rest of the session, which can interrupt read-aloud/genie speech started elsewhere.
**Fix applied:** `closeModal` now calls `stop()` first (`:7696`). `stop()` is id-guarded, so it is safe on the
`openModal → closeModal` self-call when no player is mounted.

## 🟡 VIZ-06 — A saved card explainer with no steps was a silent blank dead-end — MEDIUM → ✅ FIXED
**What's wrong:** `vizWatchSaved` hides the "▶ Watch your explainer" button **before** calling
`aiVisualizeInlineSaved` (`:4781-4784`). That function returned silently when the record was missing (`:8083`),
and `mountInline` passed any saved `bp` straight to `mountPlayer`, which does `BP.narration_steps.map(...)`
(`:7698`) — a legacy/partial `DATA.cardViz` record therefore threw a TypeError, leaving an empty gap where the
button used to be and **no way to get it back without leaving the card**. `DATA.cardViz` is synced across devices,
so one bad record follows the student around.
**Fix applied:** `mountInline` now rejects a step-less blueprint with a visible message (`:8049-8052`), and
`aiVisualizeInlineSaved` renders "That saved explainer is missing — tap the card again to rebuild it" instead of
returning silently (`:8083-8085`).

## 🟡 VIZ-07 — A single generated quiz could have exactly one option — LOW → ✅ FIXED
**What's wrong:** the fallback "🧠 What comes next?" quiz builds distractors from other steps' `short`/`term`
(`:7893-7894`). If every step shares a label (or all are blank), `pool` is empty, `ds` stays empty and the quiz
renders with **only the correct answer** — a guaranteed "correct", which inflates the streak and the
"you predicted N/N" recap into nonsense.
**Fix applied:** no distractors → skip the quiz and continue playing (`:7895`).

## 🟠 VIZ-08 — Opening the modal while an inline card player is mounted renders the modal's content into the CARD — MEDIUM — proposed, needs review
**What's wrong:** the modal body (`openModal:7691`) and the inline host (`mountInline:8055`) both create an element
with **`id="vizBody"`**, and `mountPlayer` resolves it with `document.getElementById` (`:7700`), which returns the
first in document order — the inline one inside `#main`, since the overlay is appended to `<body>` afterwards.
Every other player element (`vizStage`, `vizSvg`, `vizCap`, `vizScrub`, …) has the same collision. Reachable path:
start a note-path Visualize (float pill keeps building across route changes), navigate to a review card, tap
"🎬 Visualize how to get this answer" (inline mounts), then tap the ready pill → `playVizFloat` → `openModal` →
`mountPlayer` writes the new player **into the card**, and the modal sits on "Building your explainer… (first time
only)" **forever** with no error. `vizInlineStop` already bails out when the modal exists (`:8099`), which shows
the shared-state assumption is known.
**Root cause:** the whole IIFE keeps ONE set of player state (`BP`, `i`, `playing`, `vizScore`, `VIZ_TID`,
`:6660`) and addresses the DOM by global id, so two players cannot coexist.
**Fix direction:** unmount/clear any non-modal `#vizBody` inside `openModal` before appending the overlay (small),
or scope every lookup to a `root` element passed into `mountPlayer`/`render` (correct, but touches ~30 call sites).
Not applied — the small version silently destroys the student's inline player, the correct version is too large
for a conservative pass. Your call.

## 🟠 VIZ-09 — "Replay (instant, cached)" is actually a full rebuild that can spend a daily explainer — MEDIUM — proposed, needs review
**What's wrong:** the note path stores only `{text, ts}` in `DATA.viz` (`recordViz:8364-8368`) — **not** the
blueprint. Both replay entry points, the topic Videos list (`playVizIdx:2452`) and the inline "▶ watch" chip
(`wrapPhrase:8393`), call `aiVisualize(text, …)`, which POSTs `/visualize` again and depends entirely on the
**server-side** cache being warm. The UI promises otherwise: "tap to replay (instant, cached)" (`:2450`). If the
`visualizations` row is absent — the table doesn't exist yet (every read/write there is best-effort and swallowed,
`:1204`/`:1260`), the row was pruned, or the stored text normalises differently — the "replay" is a **new build**
that counts against the 3/day limit, and offline it fails outright. The card path already does the right thing and
keeps the full blueprint locally (`DATA.cardViz`, `:8076`).
**Fix direction:** store the blueprint in `DATA.viz` the way `DATA.cardViz` does and replay from local first.
Not applied: blueprints are large and `DATA` is synced wholesale by `sync.js`, so this needs a size/pruning
decision (cap N per topic, or keep the last few). Cheap interim: change the copy to "tap to replay".

## 🟡 VIZ-10 — Cache key ignores the subject — LOW — logged, not fixed
`textKey` is an md5 of the normalised **text only** (`visualize.mjs:2666`), while `subject` is stored on the row and
overwritten by each `upsert` (`server.mjs:1260`). Identical wording in two subjects (say "the current is the same
everywhere in the loop") shares one blueprint, so the second student can get a diagram built for another course —
and the row's `subject` column silently flips under the first one. Low frequency, but the fix (include `subject` in
the key) also multiplies cache misses and therefore spend, so it needs a deliberate decision.

## 🟡 VIZ-11 — No minimum on the highlighted text — LOW — proposed, needs review
`/visualize` rejects empty and >2000 chars (`:1198-1200`); the client rejects >110 words (`:8002`). Nothing rejects
**too little**: highlighting a single word ("Glycolysis") produces a confident 6-12 step invented mechanism, the
fourth instance of the SRV-02 / QB-04 / POD-01 empty-input family. Not applied because any threshold also blocks
legitimate short highlights (`F = ma`, `PV = nRT`); a word-count floor of ~4 words *unless* the text contains
`=`/digits would be the shape of it. Flagged for a product call.

## 🟡 VIZ-NOTES — smaller observations, not fixed
- **`qc_issues` are shipped and ignored.** The server returns the surviving QC/graph issues (`:1267`) when a
  blueprint failed both attempts; the client never looks at them. A blueprint with "element X is never revealed —
  it won't appear" renders as if fine, and the student sees a diagram with a missing step. The admin selftest page
  is the only consumer (`app.html:3936`).
- **Cached responses skip `_chain`.** The cache-read path sets `_render`/`_defs` but not `bp._chain` (`:1205` vs
  `:1266`). Nothing in `app.html` reads `_chain` today, so this is only a debugging-parity wart.
- **Two rapid Visualize taps: the first result is discarded.** `showVizFloat` removes the previous pill and
  `_vizFloatReady` is a single slot (`:7962`/`:8010`), so the earlier (paid) build is silently dropped.
- **`esc()` doesn't escape quotes** (`:6627` — only `&` and `<`). Harmless in the text contexts it's used for, but
  `fillVoices` interpolates it into `value="…"` (`:7760`); an OS voice name with a quote breaks the option.
- **`showQuiz` matches by `textContent`** (`:7894`), so two identical option strings collide and
  `opts.indexOf(correct)` picks the first. Cosmetic in practice.
- **Cost shape of one build:** initial generation + QC retry + completeness regen = up to 3 × 8000-token calls
  before a single explainer is delivered (`:1222`, `:1236`, `:1254`), plus a `BASIC_MODEL` critic call
  (`completenessCheck:1186`). Only the *successful* build inserts a `viz_events` row (`:1261`), and that insert is
  swallowed on failure (`try/catch(_)`) — a broken `viz_events` table means Visualize is **unmetered**, exactly
  like QB-10/POD-10. Hand to flow 18.
- **`/simplify` and `/visualize` duplicate the quota block verbatim** (`:1207-1219` vs `:1280-1289`) instead of
  using the existing `vizQuota()` helper (`:102`) — three copies of the same limit logic to keep in sync.
- **RUNTIME — needs a live session to confirm:** whether real generations actually pass `qcCheck` often enough that
  the corrective retry is rare (it doubles latency and spend), how long a full build takes against the proxy
  timeout (the SRV-06 question, restated for Visualize), and whether the poisoned-cache rows VIZ-01 describes
  already exist in the `visualizations` table — **worth a one-off query for rows whose blueprint has <2
  narration_steps, since the fix stops new ones but the old rows are now simply ignored and rebuilt.**

---

# Flow 7 — Visualize voice-playback DELAY (audio pre-gen + "tap to watch" gating, `app.html`)
Code review only — **every timing claim below is a code reading, not a measurement. RUNTIME — needs a live
session to confirm the actual `/tts` latency per line, which is the number that decides how bad VZD-01..03 are.**
Scope: `warmSpeak`/`serverSpeak`/`voiceSpeak` (`:1497-1534`), `say`/`startKaraokeTimed` (`:7787-7803`),
`vizWarmVoices`/`vizPlayWhenReady`/`playVizFloat` (`:8001-8018`), `aiVisualize` pre-gen (`:8030-8040`),
`mountInline`/`aiVisualizeInlineSaved`/`showReadyPill` (`:8067-8123`).

## 🔴 VZD-01 — Captions and the step cursor start BEFORE the audio exists, then run over it — HIGH — partly fixed
**What's wrong:** `say()` on the app-narrator path calls `startKaraokeTimed(text)` and *then*
`window.voiceSpeak(...)` (`:7802`). `voiceSpeak → serverSpeak` does a full `/tts` POST + `blob()` before a single
sample plays. So for any line that is **not** already in `_ttsBlobCache`, the karaoke words light up, the pointer
moves and the step timer runs for the entire network round-trip while the student hears **silence** — this is the
"voice-playback delay" symptom exactly. It compounds: the `vizWatch` watchdog was armed from the same instant
(`:7795-7796`), so a slow clip could fire `fin()` *during* its own audio, `playStep` advanced (`:7938`), and the next
`say()` reassigned `a.src` on the shared audio element (`playCloudSrc:1480`) — cutting the previous sentence off
mid-word. That is why narration can appear to skip a step on a cold server.
**Root cause:** no "audio actually started" signal anywhere in the TTS stack. `playCloudSrc` exposes only
`onended`/`onerror`; nothing surfaces `play()`/`onplaying`, so the viz player has no way to sync to real audio.
**Applied (partial):** the watchdog now adds 15s of head-room when the clip is not pre-cached and the app narrator
is in use (`:7794-7796`), so the safety net can no longer overrun a clip that is merely slow to fetch. `fin()` is
still called normally by `playCloudSrc.onended`/`deviceSpeakThen`, so nothing stalls.
**Proposed — needs review (NOT applied):** have `playCloudSrc` accept an `onstart` callback (fire it from
`a.onplaying`) and thread it through `serverSpeak`/`voiceSpeak`, so `say()` can call `startKaraokeTimed` **when
the first sample plays** instead of when the request is sent. That deletes the desync at the source, but it edits
three shared helpers used by the tutor, card read-aloud and the genie — too wide for a conservative pass.

## 🟠 VZD-02 — A hung `/tts` traps a FINISHED explainer behind a "Building…" pill forever — MEDIUM — FIXED
**What's wrong:** `aiVisualize` deliberately `await`ed the first line's pre-generation before flipping the pill to
"tap to watch" (`:8036`). `warmSpeak`'s `fetch` has **no timeout and no AbortController** (`:1508`). If `/tts` is
cold, rate-limited or wedged, that await never settles — the blueprint is built, paid for, recorded via
`recordViz`, and the student stares at "Building your explainer… keep reading" indefinitely with no way in. The
daily quota was already spent.
**Root cause:** an *optimisation* (pre-warm line 0) placed on the critical path to the *gate* (pill → ready).
**Fix applied:** `:8036` now races the warm against `_vizSleep(12000)`, so the pill flips to "tap to watch" within
12s no matter what. Worst case the student gets the VZD-01 delay on line 0 — which `vizPlayWhenReady` already
covers with its ~4s poll — instead of a permanent dead end.

## 🟠 VZD-03 — The inline player ignored the pre-gen gate and played into dead air — MEDIUM — FIXED
**What's wrong:** `vizPlayWhenReady()` (`:8006`, the "don't start until step 0's clip is cached" gate) was wired
**only** to the floating-pill path (`playVizFloat:8012-8018`). Every other "watch" entry point called raw `play()`:
the inline poster button (`:8082`), the ready pill (`:8116`) and the saved-explainer replay (`:8108`) — the last
two on a `setTimeout` of 300/700ms after a mount that had *just* started warming. Step 0 is essentially never
cached at that point, so the student taps ▶ and gets captions with no voice — the same complaint as VZD-01, but
100% reproducible rather than latency-dependent.
**Fix applied:** all three now call `vizPlayWhenReady()` (guarded by the existing `if(!playing)`), reusing the
gate's ~4s cap so it can never wait longer than the old behaviour felt.

## 🟠 VZD-04 — No audio unlock inside the tap on three of four play entry points (iOS: silent explainer) — MEDIUM — FIXED
**What's wrong:** iOS only lets an `<audio>` element play if it was first `play()`ed inside a user gesture; the
app handles this with `unlockAudio()` on the shared `_ttsAudio` (`:1477`). `playVizFloat` correctly calls it
**inside** the tap (`:8014`), but the modal ▶ button, the caption "🔊 Replay" button, the inline poster, the
ready pill and the saved-replay did not — and the pill/replay paths deliberately deferred `play()` by 300–700ms,
i.e. **outside** the gesture. `voiceSpeak`'s own `unlockAudio()` (`:1533`) is then too late. The rejected
`a.play()` promise is caught and routed straight to the callback (`:1483`), so the step advances with **no audio
and no error** — a silent movie with no explanation.
**Fix applied:** `unlockAudio()` is now called synchronously inside all five handlers
(`:7723`, `:7728`, `:8082`, `:8106`, `:8116`).

## 🟡 VZD-05 — The 0.75×–1.5× speed select is a no-op for the app narrator (and used to desync the captions) — LOW/MEDIUM — partly fixed
**What's wrong:** `say()` calls `window.voiceSpeak(text, fin, 'read', vizRate)` (`:7802`) — but `voiceSpeak` is
declared `(text, cb, use)` (`:1532`). **The 4th argument is silently dropped**, and neither `serverSpeak` nor the
`/tts` payload carries a rate. So the speed control only ever worked for a picked *device* voice
(`speakSS`, `u.rate`). Worse, `startKaraokeTimed` and the watchdog *did* divide by `vizRate`, so choosing 1.5×
made the captions and the step advance run 1.5× faster than audio still playing at 1× — VZD-01's cut-off, on
demand.
**Fix applied:** new `vizEffRate()` (`:7787`) returns the rate that is *actually* in effect (real `vizRate` for a
device voice, 1 for the server narrator) and both the caption timer and the watchdog use it. Captions now match
what is audible.
**Proposed — needs review:** make the control real by setting `a.playbackRate` in `playCloudSrc` (always assign,
`rate||1`, so other callers are explicitly reset) and threading a rate arg through `voiceSpeak`/`serverSpeak`.
Not applied — same shared-helper blast radius as VZD-01, and it should land in the same change.

## 🟡 VZD-06 — `fillVoices` clobbered the app-wide `onvoiceschanged` handler — LOW — FIXED
`fillVoices` assigned `speechSynthesis.onvoiceschanged = load` (`:7772`), overwriting the app-level `loadVoices`
registered at `:1441`. After opening Visualize once, the global `VOICES` array never refreshed again for the rest
of the session, so `pickVoice()` (card read-aloud, tutor) could stay stuck on whatever was loaded first — and the
handler kept firing into a `<select>` that had been detached when the modal closed. Now chains the previous
handler and no-ops when `#vizVoice` is gone.

## 🟡 VZD-07 — The same narration line could be generated (and paid for) twice — LOW/MEDIUM — FIXED
`warmSpeak` only checked the *completed* cache (`_ttsBlobCache`), never in-flight requests (`:1507`). Overlapping
callers are the norm here: `aiVisualize` fires warm-ups for steps 1..n (`:8037`) and then `playVizFloat` →
`vizWarmVoices` re-queues **every** step on tap (`:8012`), while `vizWarmVoices` itself runs two concurrent
chains. Any line still in flight was requested again — duplicate paid TTS calls, and duplicate blob URLs.
Now deduped through a `_ttsPending` promise map (`:1502-1520`); callers still receive a promise, and `aiVisualize`'s
`await` now joins the in-flight request instead of starting a second one.

## 🟡 VZD-08 — Pre-generation ran even when the student had picked a device voice — LOW — FIXED
`vizWarmVoices` pre-bought every narration line from `/tts` unconditionally, but if `vizVoiceName` is set `say()`
takes the `speakSS` branch (`:7800`) and **never touches those clips**. Every step of every explainer was paid for
and discarded. Now returns early when a device voice is selected (`:8002`).

## 🟠 VZD-09 — Pause / Prev / Next during the fetch window doesn't stop the clip that arrives later — MEDIUM — proposed, needs review
**What's wrong:** `stop()` calls `stopSpeak()` → `speechSynthesis.cancel()` + `stopCloud()` (`:7945`), which only
affects audio that is *already* playing. An in-flight `serverSpeak` fetch is not cancellable: it resolves seconds
later and calls `playCloudSrc` unconditionally (`:1529`), so the narration for the step the student just left
starts playing while the button reads "▶ Play" and a different step is on screen. Same for `jump()` (`:7946`) and
for `closeModal` if the tap lands inside the fetch window (the overlay is gone, the voice is not).
**Fix direction:** a generation counter in the viz module bumped by `stop()`/`say()`, checked inside `serverSpeak`
before it plays (or an AbortController per clip). Not applied: it requires `serverSpeak` to learn about a caller's
lifecycle, which is exactly the shared-helper change VZD-01/VZD-05 also want — all three should be designed
together.

## 🟡 VZD-10 — Leaving the card keeps buying narration for an explainer nobody is watching — LOW/MEDIUM — proposed, needs review
`vizInlineStop()` (`:8122`) stops playback and removes the pill, but the `vizWarmVoices` chains keep walking every
remaining step and paying `/tts` for each. Same on `closeModal`. Needs the same cancellation token as VZD-09.

## 🟡 VZD-NOTES — smaller observations, not fixed
- **Blob URLs are never revoked.** `_ttsBlobCache` grows for the life of the page (`:1508`) — one entry per
  narration line per explainer, never `URL.revokeObjectURL`d. A long study session leaks steadily. `mbPrepareVoice`
  is the only path that revokes (`:1547`).
- **`_ttsHas` and the cache key hard-code the *current* `ttsVoiceAI`** (`:1500`). Changing the AI voice in Settings
  between pre-gen and tap makes `vizPlayWhenReady` miss, so the student silently gets the ~4s poll and then the
  full VZD-01 delay. Harmless but invisible.
- **The `if(ss){ speakSS(''); }` fallback at `:7803` is unreachable** — `voiceSpeak` is a top-level function
  declaration, so `window.voiceSpeak` is always truthy and `:7802` always returns. The viz player therefore never
  uses the browser voice unless one is explicitly picked; when the server has no TTS key it still reaches
  `deviceSpeakThen` *inside* `voiceSpeak`, so audio survives — but the dead branch is misleading.
- **A stale device-voice name fails silently.** `vizVoiceName` persists across explainers; if that OS voice is
  gone, `sel.value=vizVoiceName` (`:7770`) resolves to `""` while `vizVoiceName` still holds the old name, so the
  dropdown shows "Narrator (app)" and `speakSS` runs with no matching voice.
- **The "ready" pill has no dismiss.** `showVizFloat('ready')` (`:7987`) has no ✕ and no timeout (the error state
  auto-removes after 3.8s), so an ignored explainer sits over the note until the page is left.
- **`vizPlayWhenReady`'s poll bails if `#vizSvg` is missing but never retries or tells anyone** (`:8010`) — if the
  host was torn down mid-poll the tap simply does nothing.
- **`warmSpeak` truncates to 3000 chars and `say()` speaks the full text** (`:1508` vs `:7790`) — a narration step
  longer than 3000 characters would cache a *shorter* clip under the full text's key. No blueprint is anywhere
  near that today, so it is theoretical.
- **RUNTIME — needs a live session to confirm:** real `/tts` latency per narration line (cold vs warm), whether
  the 12s VZD-02 race is generous or tight, whether iOS actually plays the first clip after the VZD-04 unlock
  fix, and whether captions now track the voice at 1× and 1.5× after VZD-05.

---

# Flow 8 — Home / today's session (`pageHome`, `buildRecallSession`, `startToday`/`startRecallSession`, hero CTAs, `app.html`)
Code review, 2026-08-22 · scope: `app.html` lines ~1284–2130 (home page + session engine) and ~4020–4200
(`startToday`, `startSession`, `startBucket`, `startRecallSession`, `reviewWeak`, custom session), plus `pageToday`
(~4487) and `sessionSummary` (~4433). Static review only — no runtime, no sign-in. Smart Drill engine untouched.

## 🔴 HOME-01 — Every student is greeted "Good morning, **Frank**" — HIGH — FIXED
`app.html:2036` (was `:2027`) rendered the home hero as `${greeting()}, Frank ☀️`. The name is a **string literal**
in the template, so the pilot's other students all get greeted as the developer. It is the very first line of the
first screen after sign-in, so it also quietly signals "this is someone else's account", which is the worst possible
first impression for a paid pilot, and it directly contradicts the per-account isolation work in Flow 1/17.
**Root cause:** the greeting was never wired to an identity source. `auth-ui.js` already reads
`user_metadata.full_name` (`:345`, `:389`) but never publishes it, and `app.html` has no global for it.
**Fix applied (two files, both additive):**
- `app.html:1969` — new `studentName()` helper: reads `window.MB_USER.name`, falls back to a `localStorage`
  cache (`mb_user_name`), takes the first token, and returns `''` for anything > 18 chars.
- `app.html:2036` — `${greeting()}${n?', '+esc(n):''} ☀️`; with no name it degrades to "Good morning ☀️", which is
  correct for everyone instead of wrong for everyone.
- `auth-ui.js:389` — `updateChip()` now sets `window.MB_USER={name,email}` and caches the name in `localStorage`
  (and clears both on a signed-out session, so a logged-out or switched account can never keep the old name).
**Known limitation (deliberate):** `updateChip` runs ~800 ms after `DOMContentLoaded`, so on the *very first* load
of a new device the greeting paints nameless and only personalises after the next render. The `localStorage` cache
means every subsequent load has it at first paint. Wiring a re-render into `updateChip` was rejected as too broad.

## 🟠 HOME-02 — A topic with no lecturer makes the "Weakest" tile read `undefined` — MEDIUM — FIXED
`weekStats()` (`app.html:1855`) buckets lapsed cards by `lap[t.lecturer]`. Object keys stringify, so a topic whose
`lecturer` is empty/undefined accumulates under the literal key `"undefined"`. The Home "Weakest" stat then renders
**"undefined · relearning"**, and its CTA calls `reviewWeak('undefined')` → `WEAK_PRED` compares
`t.lecturer==='undefined'` → matches nothing → the student gets the toast *"No weak cards for undefined — nicely
done."* while the tile still shows a non-zero count. Same string also feeds the `h2weak` "Fix these →" banner.
**Fix applied:** `app.html:1855` — added `&& t.lecturer` to the guard so lecturer-less cards are skipped.
Import validation (Flow 2) is supposed to make lecturer mandatory, but restored backups, older imports and
`addVizCard`-created topics are not covered by it, so the guard belongs here.

## 🟠 HOME-03 — Lecturer names with a `"` break the two weak-card CTAs — MEDIUM — FIXED
`pageHome` built `lecArg` (`app.html:2018`) by escaping only `\` and `'` — i.e. it was escaped for the **JS string**
but not for the **double-quoted HTML attribute** it is interpolated into
(`onclick="reviewWeak('${lecArg}')"`, used twice: the Weakest stat tile and the "Fix these →" banner).
A lecturer recorded as e.g. `Dr "Sam" Okoro` terminates the `onclick` attribute early: the button becomes inert and
the tail of the name leaks into the DOM as stray attributes. `&` was likewise unescaped.
**Fix applied:** appended `.replace(/&/g,'&amp;').replace(/"/g,'&quot;')` (ampersand first, so the entities added
afterwards are not double-encoded). The attribute decodes back to the exact original string, so `WEAK_PRED`'s
`t.lecturer===scope` comparison is unchanged.

## 🟠 HOME-04 — "Confidence check · 5" could launch a 400-card session — MEDIUM — FIXED
`buildRecallSession()` caps the confidence check at 5 (`sh(mastered).slice(0,5)`, `:1778`) and `pageToday`'s
breakdown row prints that capped `counts.conf`. But tapping the row calls `startBucket('conf')` →
`bucketItems('conf')` (`:4062`), which returns **every** mastered (`box>=3`), not-yet-due card with no cap at all.
So the row advertises 5 cards and starts a session containing the student's entire mastered deck — the session
meter reads "0 / 412", which reads as a bug and is a hard bounce out of a screen that was supposed to be a
30-second reassurance exercise.
**Fix applied:** `app.html:4076` — `startBucket` now slices `conf` to 5 after the shuffle, so the launched session
matches the advertised count. (Capping in `startBucket` rather than `bucketItems` keeps `bucketItems` usable as a
plain "give me this pool" helper.)

## 🟠 HOME-05 — A card state with no `box` is labelled a "2-week review" — MEDIUM — partly FIXED
`reviewBucket(box,starred)` (`:1721`) tested `box<0`, `box<=0`, `box===1`, `box>=2&&box<=4` and otherwise returned
`'fn'` (2-week). With `box === undefined` every comparison is false, so the card falls out of the bottom and is
presented to the student as their **longest-interval, most-mastered tier**. This is reachable today:
`addVizCard()` (`:1665`) writes `{due,ivl,ease,reps,isNew}` — deliberately **no `box`** — so every card a student
earns by missing a Visualize quiz shows up under "2-week reviews" on `/today` the moment it is created.
**Fix applied:** `:1723` — explicit `if(box==null) return 'd1';` (just-learned) before the interval tests.
**Still open (logged, not fixed):**
- `buildRecallSession` sorts `reviews` with `(a,b)=>a.box-b.box` (`:1755`); an undefined `box` yields `NaN`, an
  invalid comparator result, so ordering around those cards is implementation-defined.
- Those cards also miss `isNew`, so they are never counted in `counts.new` and never counted by `dueReviewCount()`
  (`:1298`, which requires `s.box>=0`) — i.e. they are invisible to the adaptive new-card cap.
  The clean fix is for `addVizCard` to write the same state shape `rateSRS` assumes (`{box:-1,…}`) or for
  `buildRecallSession` to normalise `box:(s.box==null?-1:s.box)` on read. Both change which *tier* those cards
  land in and how they are counted, so they need a decision, not a drive-by edit.

## 🟡 HOME-06 — Home says "Nothing due", `/today` says "5 cards due" — MEDIUM — proposed, needs review
`pageHome` sets `allCaught = (sess.capped.length === 0)` (`:2025`) — the confidence-check cards are **excluded**.
`pageToday` sets `total = b.capped.length + b.conf.length` (`:4492`). With no due cards but mastered cards
available, Home shows "Nothing due / You're all caught up 🎉" and its CTA reads "Open active recall" → `/today`,
which immediately contradicts it with "**5 cards due**" and a "▶ Start session" button. Neither number is wrong on
its own; they answer different questions, and the student is walked straight from one to the other.
Also note `/today`'s wording — those 5 cards are by definition **not** due (`s.due>today`), so "5 cards due" is
inaccurate regardless of which count Home adopts. Suggested: `/today` reports `capped` as due and shows the
confidence check as a separate "+5 confidence check" affordance. Not applied — it is a copy/product decision.

## 🟡 HOME-07 — "Continue studying" is stuck at "1 / N · 0%" for anyone who studies from Home — MEDIUM — proposed
`topicResume()` (`:1980`) derives both the resume point and the progress bar entirely from `DATA.pos`. `DATA.pos` is
written in exactly three places (`:4783`, `:4826`, `:4890`) and **all three are guarded by `S.mode==='deck'`** —
i.e. only the per-topic deck runner writes it. The daily/recall session (`S.mode==='daily'`), which is the primary
loop this whole home screen pushes the student into, never writes a position. So for a student who uses "Start
today's session" the shelf permanently shows `Recall deck · 1 / 40 · 0%` no matter how much of that topic they have
actually mastered, and "▶ Resume" always restarts at card 1. The card is titled "Continue studying" and is the
main re-entry point on the home screen, so a frozen 0% is actively discouraging.
**Proposed:** when neither `pos:` key exists, fall back to the existing `topicPct(t)` (seen-fraction) for the bar
and label it as mastery rather than deck position. Not applied — it changes what the number *means* on a
high-traffic surface and should be a deliberate design call.

## 🟡 HOME-08 — "🔔 Enable 7am reminder" promised a setting that does not exist — LOW — FIXED
`app.html:2075` hard-coded that string in the home footer. Two problems: (a) it was shown unconditionally, so a
student who already turned reminders on is still told to enable them; (b) Settings has **no 7am option** — the
reminder model is `remindOn` + an interval `remindMins` (default 120) plus an optional `remindAt`, so the promised
"7am reminder" is not a thing the student can go and switch on.
**Fix applied:** now `🔔 ${DATA.settings.remindOn?'Reminders on':'Turn on study reminders'}` — reflects real state
and drops the fictional time. Still routes to `go('settings')`.

## 🟡 HOME-09 — Custom-session overlay could be opened twice — LOW — FIXED
`customSessionOpen()` (`:4122`) appended a fresh `<div id="csov">` on every call with no guard. Two overlays share
the id `csov`, and `csPick`'s `document.querySelectorAll('#csov .cs-sub')` only clears the highlight inside the
first one — so the visible (second) sheet shows two "selected" scopes while `CS` holds one, and `csClose()` removes
only one layer, leaving the screen locked behind the second.
**Fix applied:** early `if(document.getElementById('csov')) return;`.

## 🟡 HOME-10 — "Keep going · 120 more cards" starts a 25-card session — LOW — proposed, needs review
`sessionSummary` (`:4448`) computes `remain = dueCount()` — **every** card due today — and renders
`Keep going · ${remain} more cards`. The button calls `startRecallSession()` with no argument, which rebuilds a
*fresh time-budgeted* session from `DATA.daily.budget`. So on a backlog the promise and the delivery differ by an
order of magnitude, and the student who taps it expecting to clear 120 cards is handed 25 and another celebration
screen. `b.over` (the count actually held back by the budget) is already carried in `S.session.over` and is the
honest number for this button. Not applied — it is a one-line copy change but it interacts with the celebration
copy above it (`s.over` is already surfaced there), so both should be reworded together.

## 🟡 HOME-11 — Dead code and dead work on the hottest render path — LOW — logged only
- **`pageHomeClassic()` (`:2113`) and `homeMore()` (`:2093`) are never called** — no route, no caller. ~90 lines.
  `pageHomeClassic` is also **stale**: it parses resume keys with `resume.split('|')` (`:2118`), a format the app
  no longer writes — `DATA.pos` keys are `'pos:'+topicId+deck`. If anyone re-enables it, the resume button points
  at a garbage topic id. Removing them is a large deletion; flagged rather than done.
- **`pageHome` computes four values it never uses**: `due=dueCount()` (`:2016`) and
  `started`/`complete`/`best` (`:2031`). `dueCount()` walks every recall card of every started topic, and
  `startedTopics()` is called three more times in the same function. Home also runs `buildQueue()` **and**
  `buildRecallSession()` (which walks the full card set twice more) **and** `weekStats()` **and** `streakMet()`
  (→ `reviewTotals()` → another `buildQueue()`). That is ~8 full passes over the card set per home render, and
  `render()` is called on every rating. Harmless at pilot deck sizes; the first thing to look at if Home ever
  feels sluggish on a large account.

## 🟡 HOME-NOTES — smaller observations, not fixed
- **Custom session: an off-list budget leaves no button selected.** `CS.min` seeds from `DATA.daily.budget`
  (`:4124`) but the picker only offers `[5,15,30,45]` (`:4126`). A student on a 20-minute budget sees *no*
  highlighted length while `CS.min` is silently 20 — then gets a 20-minute session they never picked.
- **`topicResume` can render "1 / 0 · 0%".** `at:Math.min(idx+1, total||1)` (`:1982`) returns 1 even when `total`
  is 0, so a topic with an empty recall *and* primer deck shows `1 / 0` in the Continue-studying shelf.
- **The exam-aware re-sort discards the interval ordering it just built.** `reviews` is sorted youngest-interval
  first (`:1755`) and then, if any exam is ≤21 days out, re-sorted by exam proximity (`:1760`) — `Array.sort` is
  stable, so the box order survives only *within* a subject, not across. Intentional-looking, but worth confirming
  that exam proximity really should outrank "this card is about to be forgotten".
- **`startToday()` and `startSession()` set a session with no empty guard** (`:4038`, `:4051`) — `items` can be
  `[]`. Currently harmless because `pageReview` catches `!S.items.length` and renders `caughtUp()`, and `modesBar`
  disables the buttons at 0. Noted so it stays that way.
- **`startRecallSession(limit)` slices *after* concatenating `conf`** (`:4087`), so a limited session
  (`▶ 10` / `▶ 20` on `/today`) can never contain a confidence-check card — those always sort last. Probably
  intended, but it means the "start small" sizes and the "All" button build qualitatively different sessions.
- **`h2rem` and the exam chips both route to `go('settings')`** with no deep link to the relevant tab, so the
  student lands on `⚙️ Study` and has to find `🔔 Reminders` / the exam-date fields themselves.

---

# Flow 9 — Active recall / review (card flow, SRS rating, `rateSRS`, `LADDER`) — `app.html`
Reviewed: `rateSRS` / `LADDER` (:1264), `buildRecallSession` (:1741), `planNew` (:1628), `buildQueue` (:1649),
`collectRecall` (:1668), `bucketItems`/`startBucket` (:4063), `startDeck`/`startToday`/`startSession`/
`startRecallSession`/`startFilteredSession`/`csStart`/`startHard`/`startLeeches`/`startMistakes` (:4017–4344),
`pageReview`/`pageStudy`/`pageHard`/`sessionSummary` (:4380–4475), `cardView`/`mcqView` (:4607–4690),
`pickOpt`/`rateCard`/`mcqNext`/`reveal`/`step`/`shuffle`/`restartDeck`/`endSession` (:4749–4906), the review
keydown handler (:4956). 11 findings + 6 notes. 6 fixed, 5 logged.

## 🔴 REV-01 — Rating a Visualize-quiz card set `box:NaN` / `due:NaN` and deleted it from the app forever — HIGH — FIXED
`addVizCard` (`:1663`) writes a card state with **no `box` field**: `{due,ivl,ease,reps,isNew:true}`. `rateSRS`
(`:1267`) then did `s.box = Math.min((s.box<0 ? -1 : s.box)+1, LADDER.length-1)`. For `s.box === undefined`,
`undefined < 0` is `false`, so the expression evaluates `undefined + 1` → **`NaN`**, `Math.min(NaN,6)` → `NaN`,
and `s.due = today + LADDER[NaN]` → `today + undefined` → **`NaN`**.

Consequences, all silent:
- Every queue tests `s.due <= today`. `NaN <= n` is `false`, so the card **never comes due again** — in
  `buildQueue`, `buildRecallSession`, `bucketItems`, `dueCount`, `reviewHealth`, `reviewForecast`, everywhere.
  It is not deleted, it is simply unreachable, and no screen ever reports it missing.
- The student is told this to their face: `reviewIntervalText` → `intervalPhrase(NaN)` falls through every
  comparison (`NaN < 7` etc. are all `false`, `NaN % 7 === 0` is `false`) and returns the literal string
  **"in NaN days"**, printed in the green `↻ You'll see this again <b>in NaN days</b>` line under the answer
  (`:4638`) and in the `flashReview` toast (`:4865`).
- The irony: these are exactly the cards the student got *wrong* in a Visualize explainer — the app promises
  "➕ Saved to your review deck" (`:7937`) and then loses the card the first time it is answered.

**Fix applied** (`:1265`): normalise the box once, up front —
`const cur=(s.box==null||typeof s.box!=='number'||isNaN(s.box))?-1:s.box;` — and use `cur` for both `wasMastered`
and the pass branch. Behaviour for every well-formed card is byte-identical; a box-less card now correctly starts
its ladder at box 0 (`due = today + 1`).
**Not changed on purpose:** `addVizCard` still omits `box`. Adding `box:-1` there would flip
`reviewBucket(box)` from `'d1'` to `'hard'` and undo the HOME-05 decision that a Visualize-quiz card is
"just-learned", not "relapsed". The defensive fix belongs in `rateSRS`, where it now is.
*Existing accounts:* any card already written as `due:NaN` stays invisible. A one-line repair pass
(`for(const id in DATA.cards) if(isNaN(DATA.cards[id].due)){DATA.cards[id].box=-1;DATA.cards[id].due=dayNum();}`)
would recover them — **not applied**, migrations on live pilot data should be a human decision.

## 🔴 REV-02 — You cannot type a space into your own card note; typing "1" or "2" rates the card — HIGH — FIXED
The review keydown handler (`:4962`) matched on route only. The exam branch directly above it (`:4955`) already
guards with `if(e.target && /INPUT|TEXTAREA/.test(e.target.tagName)) return;` — the study/review/hard branch had
no such guard, while those very screens render text inputs on top of the card:
- `noteBlock` (`:1567`) — the "✎ My note / mnemonic" `<textarea>`, shown under every revealed/answered card.
- `openNoteFull` (`:1574`) — the full-screen note overlay.
- `cardEditor` (`:1373`) — the `✎ Edit` textareas for question and answer.

So while a student types a mnemonic: **Space** hits `if(e.code==='Space'){ e.preventDefault(); reveal(); }`
(`:4974`) — the space character is swallowed *and* the card behind flips; **1** and **2** hit
`if(canRate && S.show){ if(e.key==='1')rateCard(false); if(e.key==='2')rateCard(true); }` (`:4975`) — the card is
rated, the SRS box moves, the session advances, and the half-typed note is left attached to a card that is no
longer on screen. The `onclick="event.stopPropagation()"` on the note wrapper does nothing here: the listener is
on `document` and this is `keydown`.
**Fix applied** (`:4963`): the same guard as the exam branch, plus `e.target.isContentEditable`.

## 🟠 REV-03 — A topic missing one of its two decks blanked the whole app — MEDIUM — FIXED
`startDeck` (`:4016`) did `let cards = deck==='primer' ? t.primer : t.recall;` and then called `cards.filter(...)`
unconditionally at `:4019` (flag filter) — an uncaught `TypeError: Cannot read properties of undefined` inside
`render()`, i.e. a white screen, not a friendly empty state. The same file treats a missing deck as normal
everywhere else — `(t.primer||[])` at `:1386`, `:1422`, `:1982` — so this is an inconsistency, not a
can't-happen. `pageStudy` even has an empty-deck message ready (`:4388`) that this crash pre-empts.
**Fix applied:** `let cards = (deck==='primer'? t.primer : t.recall) || [];` — the empty state now renders.
*(Related, not fixed: `:1942`, `:2392` and `:4006` also dereference `t.primer.length` unguarded — those are
flow 13/14 surfaces, handed over.)*

## 🟠 REV-04 — "Report this card as wrong and hide it from your studying" did not hide it from studying — MEDIUM — FIXED
`flagCard` (`:1342`) asks for confirmation with that exact sentence, sets `DATA.cardFlags[id]=1`, and strips the
card from the *current* `S.items`. But `isFlagged` was consulted in exactly **one** place in the whole build —
`startDeck` (`:4019`). Every other way into a card ignored it:
`buildQueue` (:1650) → Quick 10 / Clear due / `startToday`; `buildRecallSession` (:1742 and the confidence-check
pool at :1767) → the main **Active Recall** session and every `/today` count; `bucketItems` (:4065/:4069) → the
per-stage "Drill →" rows; `collectRecall` (:1669) → Weak spots, Exam cram, Clinical only, `startFilteredSession`,
`reviewWeak`, `csStart`, `weakCount`; `planNew` (:1635) → tomorrow's new cards.
Net effect: the student reports a card as factually wrong, watches it vanish from the current session, and meets
it again in the next one — permanently, since the only way back out (`unflagCard`) is not on the study screen.
Worse, they keep being *graded* on a card they have already declared broken, and failing it stars it as a hard
card, which pushes it to the **front** of the next session.
**Fix applied:** one `isFlagged(id)` guard in each of the six pools listed above. Counts and sessions now agree
with the promise. Flagged cards remain in `DATA` and are still reachable from wherever `unflagCard` is exposed.

## 🟠 REV-05 — Nothing stops the same card being rated three times in one sitting — MEDIUM — proposed, needs review
`rateSRS` has no same-day / already-rated guard, and the two rating paths disagree about whether that matters:
- **MCQ path (`pickOpt`, :4765)** *does* guard: `const alreadyAns = S.answered[it.id]!=null || (deck-mode
  DATA.cardAns[it.id]!=null); if(alreadyAns){ S.pick=null; render(); return; }` — "answered before → just show
  it, never re-rate".
- **✓/✗ path (`rateCard`, :4881)** has **no equivalent check**. And it is reachable a second time: the keydown
  handler falls through to `if(e.key==='ArrowLeft')step(-1)` (`:4978`) whenever `S.show` is false, so ← walks
  back onto an already-rated card in a live session; Space reveals it; `2` rates it again.
- Across sessions it is trivial: the same card sits in *Quick 10*, *Clear due*, *Exam cram* (40 random cards,
  due or not), *Weak spots*, a bucket drill and its own topic deck. Each pass calls `rateSRS` again.
- `restartDeck` (`:4830`) actively enables it in deck mode — it clears `S.answered` **and** deletes
  `DATA.cardAns` for every card in the deck, which is exactly the state `pickOpt` uses to refuse a re-rate.

Consequences: a card can climb `-1 → 0 → 1 → 2 → 3` in one evening and be scheduled 7 days out having been
recalled three times in ten minutes (the interval is meant to encode *forgetting*, so this is the one thing the
LADDER must not allow); `S.session.mastered` and the "🏆 N cards mastered" line inflate; and `logRate`/`logDaily`
double-count toward `goal`, `floor` and `streakMet()` — the streak is farmable by re-running the same ten cards.
**Proposed fix (not applied):** in `rateSRS`, after computing `today`, `if(s.seen===today && s.box>=0 && ok) return;`
— i.e. a card that already passed today does not advance again (a *miss* should still demote, that must stay).
Not applied: this is the core scheduler, the pilot is running on it, and "should Exam cram move the SRS at all?"
is a product decision, not a bug fix. Recommend deciding it together with REV-08.

## 🟠 REV-06 — The daily new-card cap eats one whole course — MEDIUM — proposed, needs review
`planNew` (`:1628`) is documented as "top 5 topics per course, each in order, **interleaved**". It does build a
proper per-course round-robin — but *inside* `DB.subjects.forEach`, so `out` ends up as
`[…all of subject A…, …all of subject B…]`. The last line then applies a single global cut:
`return out.slice(0, remain)` where `remain = effectiveNewCap() - newDoneToday()`.
With the shipping defaults — per-course `courseGoal` 30 (`DEFAULTS`, `:1124`) vs. a global
`effectiveNewCap()` of `min(newPerDay 20, adaptive newCap 12)` = **12** — subject A alone contributes up to 30
items before subject B is ever appended. The student therefore receives **12 new cards, all from subject A,
every single day**, and course B never starts, no matter what the weekly plan says. The exam-aware re-sort at
`:1752` only reorders within the already-truncated list, so an imminent exam in subject B does not rescue it.
**Proposed fix (not applied):** interleave across subjects before the cut (collect per-subject arrays, then
round-robin into `out`), or apply `remain` proportionally per course. Not applied — it changes which cards every
student is served tomorrow, and it interacts with `effectiveNewCap`/`adaptNewCap` (flow 15).

## 🟡 REV-07 — The results screen congratulated you for a streak you had not earned — LOW — FIXED
`sessionSummary` (`:4468`) printed `🔥 Streak extended → ${st} days` unconditionally, on every session, for
everyone — including a student who has just done 4 cards and is nowhere near `streakMet()` (≥20 new cards **and**
≥65% of due reviews, `:1257`). `st` is `curStreak()`, i.e. *yesterday's* number, so the banner claims an
extension that has not happened and may well not happen today.
**Fix applied:** the banner is now conditional — `streakMet()` → "🔥 Streak extended → N days", otherwise
"🔥 N-day streak · finish today's target to keep it", which is both true and a nudge.
*Same screen, not fixed (needs the flow-18 freeze logic):* `:4452` shows "🔥 N-day streak — you just earned a
streak freeze 🛡" on **every** session run on a multiple-of-7 day, while the freeze is granted once in
`bumpStreak` and is capped at 2 — so a student at the cap is repeatedly told they earned one.

## 🟡 REV-08 — Three different definitions of "mastered" on the same screens — LOW — logged only
- `rateSRS` (`:1271`) counts a card as newly mastered at **`box >= 3`** — this drives `S.session.mastered` and
  the "🏆 N cards mastered — that many less things to fear on exam day" line on the results screen (`:4453`).
- `cardState4` (`:1315`) calls `box <= 4` **"Familiar"** and only `box >= 5` **"Mastered"** — this drives the
  `masteryChips` strip rendered on top of every card in the session (`:4730`, `:4669`).
- `buildRecallSession`'s confidence check (`:1767`), `bucketItems('conf')` (`:4065`) and the "Confidence check —
  a mastered card, just making sure it stuck" banner (`:4415`) use **`box >= 3`**.

So a card at box 3 is announced as "mastered" in the celebration, offered as a "mastered card" in the confidence
check, and simultaneously shown as **Familiar** in the chips two lines above. Not fixed because the correct
answer is a product call: `LADDER=[1,3,7,7,7,14,14]` means box 3 is only the *first* 7-day interval, which argues
for the stricter box 5 — but that would also shrink the confidence-check pool and make the results screen much
quieter. Decide once, then apply to all three.

## 🟡 REV-09 — "⇄ Shuffle" mid-session restarts the session and breaks the progress meter — LOW — logged only
`shuffle()` (`:4828`) reshuffles `S.order` **and sets `S.i = 0`**. It is offered inside a live session on the MCQ
nav row (`:4647`) and on the `S`/`s` key (`:4971`). `pageReview` derives its meter from the index
(`done = S.i`, `:4399`), so tapping Shuffle at card 18/20 snaps the bar from 90% back to 0% and re-shows cards
the student already answered; `S.session.done` meanwhile keeps counting up, so the summary can read "27 cards
reviewed" out of a 20-card session, and the accuracy denominator drifts with it. Re-rating is blocked by
`S.answered` (see REV-05), so the SRS itself is safe — but the student now has to click "Next" through every card
they already did to reach the end. Suggested: in a session (`S.mode!=='deck'`), shuffle only the *remaining*
slice `S.order.slice(S.i)` and leave `S.i` alone. Not applied — one-line change but it alters a control students
are already using, so it wants a human's eye.

## 🟡 REV-10 — Pressing ← on the results screen puts you back inside the finished session — LOW — logged only
At the end of a session `S.i` is set to `S.items.length` (`:4810`, `:4899`, `:4851`) and `pageReview` renders
`sessionSummary` (`:4396`). The keydown handler still matches the `#/review` route, so on the celebration screen:
**←** → `step(-1)` → `n = length-1`, which passes the `n<0||n>=S.items.length` check, so `S.i` is reset and the
last card of the completed session is re-rendered with its rating buttons live (re-rate via the ✓/✗ path, see
REV-05). **Space** → `reveal()` toggles `S.show` and re-renders the summary underneath. Cheap fix: `if(!S.items
|| S.i>=S.items.length) return;` after the route test.

## 🟡 REV-11 — A "Drill →" row can launch far more cards than the number printed on it — LOW — logged only
The `/today` stage rows and the "Today's mix" chips print `b.counts[k]`, computed from `buildRecallSession()`'s
**budget-capped** `capped` set (`:1772`). `startBucket(k)` (`:4073`) runs `bucketItems(k)`, which is **uncapped**
— and for `k==='new'` it returns `planNew()` in full. So with a 15-minute budget and a backlog, the row reads
"New cards · 6 · Drill →" and the tap opens a 12-card session. Exactly the HOME-04 bug (confidence check
capped at 5) in a second place; HOME-04 was fixed with a `.slice(0,5)` at `:4076`, and the same treatment
(`items = items.slice(0, count-shown)`) would work here. Not applied because the honest number for a *drill* is
arguably the full pool — the row label is what should change, and that is the same copy decision as HOME-10.
Also: `startBucket` returns silently when `bucketItems` is empty (`:4074`), so a stale render = a dead tap with
no feedback. `mgStart`/`startSmartDrill` both toast in that situation; this one should too.

## 🟡 REV-NOTES — smaller observations, not fixed
- **`classifyItem` mislabels a box-less card as a review** (`:4838`): `s` exists so it does not return `'new'`,
  and `s.box < 0` is `false` for `undefined`, so a Visualize-quiz card is counted `'rev'` in the session mix bar.
  Cosmetic only (the bar under the meter), but it is the same missing-`box` assumption as REV-01.
- **`pickOpt` grades against the raw card, `mcqView` renders the edited one.** `pickOpt` (`:4767`) uses
  `it.c`, `mcqView` (`:4605`) uses `effCard(it.id,it.c)`. Harmless *today* because `saveEditCard` (`:1334`) only
  patches `q`/`a`/`explain` — never `opts` or `ans`. The moment card editing is extended to options, the
  student's answer will be graded against the pre-edit key. `pickOpt` should use `effCard` too.
- **`cardView`'s MCQ test dereferences `it0.c` unguarded** (`:4686`): `it0.c.opts` throws if any item ever
  reaches a session without a `c`. Every builder currently sets it; noted so it stays true.
- **Starred *primer* cards can never leave the Hard-cards deck by studying.** `starItems()` (`:1836`) walks both
  decks, but a primer card has `canRate === false` (`:4701`) — the ✓/✗ buttons are never rendered, so the only
  exit is the ☆ toggle. `startHard`'s session therefore never shrinks by itself.
- **`intervalPhrase(days)` says "tomorrow" for 0 and for negative values** (`:1190`). Not reachable from a normal
  pass (the LADDER floor is 1 day), but any caller passing an overdue delta gets a wrong word rather than
  "overdue".
- **`estMin()` still prices every card at a flat `SEC_PER_CARD=20`** (`:1718`) for the "~N min left" line on the
  session meter (`:4410`) and the `/today` hero — while the session was *built* with the measured rolling median
  (`estCardMs`, `:1284`, seeds 45s new / 30s relearning / 17s review). A 20-new-card session is advertised at
  ~7 min and budgeted at ~15. The honest number (`S.session` could carry `estMs`) is already computed.

---

# Flow 10 — Mega Q-bank (code review, `app.html`)

Scope: `_mgCfg`, `mgPools`/`mgTopicGroups`/`mgBuildItems`/`mgAssemble`, `mgStart`, `mgDrillWeak`, `pageMega`,
and the shared session machinery Mega drives (`qbPick`, `qbNext`, `qbRecord`, `qbFinalize`, `qbEndEarly`,
`qbQuestionHtml`, `qbDoneHtml`). The FROZEN Smart/Adaptive engine (`adaptStart`, `adaptPick`, `adaptAdjust`,
`smart*`, `SMART`) was read but NOT edited — findings against it are logged as proposals only.

## 🟠 MG-01 — "⚡ Quick Exam" silently wipes the student's Customize panel — MEDIUM — ✅ FIXED
**What's wrong:** Tapping Quick Exam resets every control in "Customize your session" — courses, the whole
topic picker, exposure, mode, level, skill and count all snap back to All / Blind / Test / 20. A student who
spends time selecting 6 topics, then takes one quick exam, loses that selection with no warning and no undo.
**Root cause:** `mgStart` (`app.html:2918`) took `var cfg=_mgCfg` — a *reference* to the global config — and the
quick branch mutated it in place (`cfg.subj={}; cfg.topics={}; … cfg.count=20;`). `pageMega` renders the panel
straight off `_mgCfg`, so the reset is permanent for the session.
**Fix (applied):** the quick branch now builds a throwaway preset object, swaps it into `window._mgCfg` only for
the duration of `mgAssemble` (which reads the global via `mgTopicGroups`), and restores the student's config in
a `finally`. `examDate` is carried across so `smartHalfLife()` is unaffected.

## 🟠 MG-02 — Double-tapping an option in Test mode records two answers and skips a question — MEDIUM — ✅ FIXED
**What's wrong:** In Test mode (the default for Mega, and what Quick Exam always uses) two taps inside ~180ms —
a double-tap, or a quick change of mind from A to B — are both graded. The result: two rows in `QB.results` and
two rows in the attempts log for one question, `QB.correct` incremented twice, and two queued `qbNext` calls, so
the *next* question is skipped without ever being shown. Because `qbScore` divides by `QB.items.length`, a
session can finish above 100%.
**Root cause:** `qbPick` (`:2648`) guards on `QB.answered`, but the timed branch deliberately never sets
`QB.answered` (that would reveal the key mid-exam) — it just calls `qbRecord(j)` and `setTimeout(qbNext,180)`.
So the guard is dead for the entire Test-mode path. Tutor mode is safe (`QB.answered=true` before render).
**Fix (applied):** added a `QB._lock` flag set for the 180ms window and checked alongside `QB.answered`; the
timeout callback clears it, guards `if(!QB) return;` and only advances `if(!QB.done)` (so tapping *End & grade*
inside the window can no longer step the finished session forward).
**Note:** this is the Test-mode instance of REV-05 (the ✓/✗ review path has the same missing re-answer guard);
REV-05 itself is still open.

## 🟠 MG-03 — "End & grade" logs the session at its PLANNED length, so the trend chart contradicts the score — MEDIUM — ✅ FIXED
**What's wrong:** End a 20-question Mega set after 3 correct answers and the results screen honestly says
"100% · 3/3 correct — Ended early, graded on the 3 questions you answered" — then the Performance dashboard
plots that same session as **15%** on the trend spark, and "Trend over sessions" reads as a collapse. The
student is shown two different scores for one session.
**Root cause:** `qbScore` (`:2612`) grades over `QB.results.length` when `QB.endedEarly`, but `qbFinalize`
(`:2633`) pushed `n:QB.items.length` unconditionally into `_sessions`, and `qbSpark`/the dashboard divide
`correct/n`.
**Fix (applied):** `qbFinalize` now stores `n:(QB.endedEarly ? answered : QB.items.length)`, matching `qbScore`.
Only newly-logged sessions are corrected — existing `_sessions` rows on live accounts keep the inflated `n`.

## 🟡 MG-04 — "Choose…" with nothing ticked dead-ends with a message about the wrong control — MEDIUM — ✅ FIXED
**What's wrong:** Switch Topics to "Choose…" and the pool immediately drops to 0, so the CTA greys out reading
"🚀 Start — none match" with "0 questions in your current selection" under it. Nothing says *tick a topic* —
the copy points the student at the level/skill filters, which are not the problem. Same trap when they select a
different course than the topics they had ticked.
**Root cause:** `pageMega` (`:3400`) derived the button state purely from `n = mgBuildItems().length`, and
`mgTopicGroups` returns nothing when `cfg.chooseTopics` is on and no `cfg.topics[id]` is true.
**Fix (applied):** `pageMega` now detects that specific state (`needPick`) and swaps the label to "🚀 Start —
choose a topic" with "No topics ticked yet — tap the ones you want above, or switch back to 'All topics'."
Blind and Adaptive are excluded, since both deliberately ignore topic picks. Text-only; the button was already
disabled in this state.

## 🟡 MG-05 — Mega offers Level/Skill filters that its pool cannot satisfy — MEDIUM — proposed, needs review
The topic Q-bank start screen builds its chips from what actually exists (`:2570-2572`: `skillOpts`/`levelOpts`
only include values present in that topic's items). Mega does the opposite — `pageMega` (`:3389-3390`) renders
all 4 `QB_COGS` × all 6 `QB_SKILLS` unconditionally. Most combinations are empty for a real library, and picking
one gives a disabled "— none match" button with no indication of *which* of the two chips emptied the pool
(and no "All" count next to each chip). Fix direction: mirror the topic screen — compute the chips from
`mgBuildItems()` ignoring the dimension being rendered, and grey out (with a count) rather than hide, so the
student can see that e.g. "Exam trap" has 0 while "Complex reasoning" has 40. Not applied: it changes how the
config panel is built, which is more than a guard.

## 🟡 MG-06 — Adaptive ignores the topic picker and the Level chip, but the panel above it still promises them — MEDIUM — proposed (FROZEN engine, not edited)
`adaptStart` (`:3297`) filters `smartPool()` by **course and skill only**. `cfg.chooseTopics`/`cfg.topics` and
`cfg.level` are never consulted, so a student who ticks 3 topics and selects Adaptive gets questions from every
topic in those courses. The exposure note only warns that the *Level* chip is automatic ("Level chip is set
automatically", `:3386`) — nothing says topic picks are dropped. Worse, the Start button's enabled/disabled
state and its "Start N questions" count come from `mgBuildItems()`, which DOES apply the topic and level
filters: a selection that leaves `n===0` disables the button even though `adaptStart` would have had a full
pool to draw from. Fix direction (needs the human, engine is frozen): either honour `cfg.topics` in
`adaptStart`'s pool filter, or compute the Adaptive pool with the same `smartPool()` filter for the count and
say so in the note. Logged only.

## 🟡 MG-07 — A failed Adaptive start leaves a live, empty session behind — LOW — proposed (FROZEN engine, not edited)
`adaptStart` assigns `QB` and fires the `smart_drill_started` analytics event (`:3305`) *before* `adaptPick()`
runs; if the pick returns null it `alert`s "No questions available." and returns **without clearing `QB` and
without `render()`**. The app is now holding a mega session with `items:[]`, `i:0`. Navigating to the Mega tab
then hits `pageMega`'s `if(QB && (QB.mega||QB.mistakes))` branch and calls `qbQuestionHtml`, which returns `''`
for a missing item — a blank page with no way back except another route change. Also inflates
`smart_drill_started` with sessions that never began (the pilot is counting these). Fix is one line
(`QB=null;` before the alert, and log after the first pick succeeds) but sits inside the freeze.

## 🟡 MG-08 — "↻ New Mega set" after a Quick Exam rebuilt the wrong kind of set — LOW — ✅ partly FIXED
The results screen's retry button was hard-coded to `mgStart(false)` (`:2729`), i.e. "build from the Customize
panel". After MG-01's fix that panel is no longer the quick preset, so a student who took a Quick Exam and
tapped "New Mega set" would silently get a differently-sized set in a different mode.
**Fix (applied):** the button now reads `QB.kind` and offers "↻ New Quick Exam" → `mgStart(true)` for a quick
session, "↻ New Mega set" → `mgStart(false)` otherwise.
**Still open:** after `mgDrillWeak` (and after a Smart Drill / concept retest, which also set `mega:true`) the
same button still builds a generic Mega set rather than re-running the drill. Routing those by `kind` too is a
small change but touches the frozen engine's entry points — logged for the human.

## 🟡 MG-09 — The 1-second question timer never stops — LOW — ✅ FIXED
Every start path arms `window._qbInt = setInterval(qbTick,1000)` and nothing ever cleared it, so after the
student left the session the interval kept firing once a second for the rest of the app's life (harmless work,
but it is a wake-up per second on a phone, forever). `qbExit` (`:2606`) now clears it and nulls the handle; all
start paths re-arm it via their existing `if(!window._qbInt)` check.

## 🟡 MG-10 — "Drill my weaknesses" sessions were unlabelled in analytics — LOW — ✅ FIXED
`mgDrillWeak` (`:2934`) built its `QB` with no `kind`, so `qbFinalize`'s `stype` fell through to `'mega'` and
the session was indistinguishable from an ordinary custom set in `_sessions` — the one report that would show
whether weakness-drilling actually moves accuracy. Added `kind:'drill_weak'`, matching the convention already
used by `quick_exam` / `custom` / `smart_drill` / `drill_dim` / `concept_retest` / `adaptive`.

## ℹ️ MG-NOTES — smaller observations, not fixed
- **Quick Exam's subtitle contradicts itself** (`:3395`): "20 questions · **Mixed** · **Blind** · Timed" — Mixed
  and Blind are mutually exclusive values of the same `exposure` chip, and the code sets `blind`. Presumably
  "mixed courses" was meant; worth one word of copy.
- **No cross-topic de-duplication.** `mgAssemble` concatenates each topic's items as-is. Two topics covering the
  same ground (a re-imported lecture, a split module) can put the *same* question in one set twice; the topic
  Q-bank never can. `_qh` is already computed in `qbRecord` and could de-dup at assemble time.
- **`mgBuildItems()` deep-copies the entire question library on every render of the Mega page** (`:2902` →
  `mgTopicGroups` `Object.assign` per question) purely to print "N questions in your current selection", and
  the page re-renders on every chip tap. A count-only path (or memoising per config) would be cheap.
- **Test mode has no clock limit and no auto-submit**, despite "Sit all N, then review — like the real paper"
  and a visible ⏱ timer. `qbTick` only counts up. If exam-condition timing is the point, the budget should be
  enforced (or the copy softened).
- **Starting a Mega set discards an in-progress topic session without asking.** `mgStart` overwrites the global
  `QB` outright; a student mid-way through a topic Q-bank who taps Mega Q-bank loses those answers (the
  attempts already recorded survive, but the session is never finalised, so it never reaches `_sessions`).
  `qbEndEarly`'s confirm exists precisely for this and could be reused.
- **The round-robin guard in `mgAssemble` (`:2904`) is sound** — `guard < flat.length*3` plus the all-decks-empty
  break, and `decks.length===0` can't spin because `flat.length===0` fails the loop condition. Checked because
  the "balanced switch" claim in the exposure note depends on it; it does hold, and the final `qbShuffle(out)`
  hides the rotation as intended.
- **Client-side answer keys are trusted as integers** (`qbRecord` `:2623`: `ok=(j===q.answer)`, strict). Safe
  *today* because `validateQbankItems`' `coerceAnswer` (server `:346`) now guarantees an integer index and
  drops anything else — but any future path that writes `extras.qbank` without going through the server would
  grade every question wrong and never mark an option green. Same failure family as QB-01 / VIZ-02.

---

# Flow 11 — Mock exam (code review, `app.html`)

Scope: `examPool`, `startExam`, `examPick` / `examNav` / `examSubmit`, `pageExam` (setup + running + results),
`launchExam` / `selExamScope` / `selExamCount` / `newExam`, `examResult`, `examMissedItems`, `examSendHard`,
`examDrillMissed`, the `#/exam` branch of the global keydown handler, and the `_examTimer` block in `render()`.
Static review only — no runtime session.

## 🔴 MX-01 — "▶ Start exam" did nothing: the mock exam could not be started at all — HIGH — ✅ FIXED
**What's wrong:** On the Mock exam setup screen, picking a scope and a length and tapping **▶ Start exam**
produced no visible change whatsoever. The setup screen just sat there. Same for **New exam** on the results
screen. There is no error, no toast, no console message — the button is simply inert.
**Root cause:** `go(route)` (`app.html:1927`) is `location.hash='#/'+route` and nothing else; the app only ever
re-renders from the `hashchange` listener (`:6045`). Assigning a hash that is **identical** to the current one
does not fire `hashchange`. `startExam` ends with `go('exam')` (`:4386`) — but `startExam` is reachable from
exactly one place, `launchExam`, which only exists on the setup screen, which is itself rendered *at* `#/exam`.
So the hash is always already `#/exam` and the render never happens. `newExam` (`:5489`) had the identical
defect, fired from the results screen which is also at `#/exam`.
Worse than a dead button: the global `S` **is** mutated, so the exam is now live and its `started` clock is
running invisibly. The next unrelated render — a background pull in `sync.js:170` calls `render()`, or the
student taps another nav item and comes back — drops them straight into question 1 of an exam whose timer has
been counting since the tap they thought failed.
**Fix (applied):** `startExam` and `newExam` now call `render()` immediately after `go('exam')`. If the hash
*did* change, the `hashchange` render is a harmless duplicate; if it didn't, this is the only render there is.
Deliberately did **not** change `go()` itself — making a same-hash `go()` render globally would alter behaviour
at ~40 other call sites and is not a conservative change. Those call sites should still be swept for the same
pattern (any `go(x)` fired from a page already at `#/x`).

## 🔴 MX-02 — "Clinical only" scope feeds non-MCQ cards into an MCQ renderer — HIGH — ✅ FIXED
**What's wrong:** Choosing the 🩺 Clinical only scope could throw the student into a white screen, either at
question 1 or partway through the paper.
**Root cause:** `examPool` (`:4369`) branches three ways and only two of them filter for options. The `all`
branch and the per-subject branch both test `if(c.opts&&c.opts.length)`; the clinical branch was a bare
`items=clinItems()`. `clinItems()` (`:1408`) selects purely on the question text matching
`/^\s*(CLINICAL|OSPE|OSCE|SCENARIO|CASE)\b/i` — nothing about options. Clinical/OSPE stems are usually
free-recall, so most of that pool has no `opts` at all. `pageExam` then runs `c.opts.map(...)` (`:5467`)
unconditionally → `TypeError: c.opts is undefined` → the render throws and `#main` is left blank.
**Fix (applied):** all three branches now push unfiltered and a single `items.filter(...)` gate is applied to
every scope, so no future scope can bypass it.

## 🟠 MX-03 — Cards the student reported as wrong were still served in exams — MEDIUM — ✅ FIXED
**What's wrong:** "Report this card as wrong and hide it from your studying" did not hide the card from mock
exams. A student who flagged a card as broken could be graded on it, and the card would come back in the
"Drill missed" set afterwards.
**Root cause:** `examPool` never consulted `isFlagged(id)` (`:1331`). This is the **eighth** pool with that
omission — REV-04 fixed `startDeck`, `buildQueue`, `buildRecallSession` ×2, `bucketItems` ×2, `collectRecall`
and `planNew`, and `examPool` was missed because it lives in the exam block, not the review block.
**Fix (applied):** `&& !isFlagged(it.id)` added to the new shared `examPool` filter.
**Follow-up:** there is still no single chokepoint for "is this card studyable" — the predicate is copy-pasted
in nine places now. A `studyable(t,c,id)` helper would stop the tenth.

## 🟠 MX-04 — The empty-state told students to build a Q-bank, which never adds a single exam question — MEDIUM — ✅ FIXED
**What's wrong:** On an account with no MCQ cards, starting an exam alerted *"No exam questions yet — open a
topic → 🧠 Q-bank to build one first, then come back."* A student who follows that instruction builds a
Q-bank, comes back, and gets the **exact same message** — a closed loop with no way out.
**Root cause:** the mock exam draws from `t.recall` cards that carry `opts` (`examPool`). `t.recall` is written
by the lecture import build and by `addVizCard`/`mergeVizCards` (`:1658–1665`) — and by nothing else. The
Q-bank builder writes to the separate `extras.qbank` / `qbStore()` store (`_qmeta`, `_attempts`) which
`examPool` never reads. Building a Q-bank therefore adds exactly zero mock-exam questions.
**Fix (applied):** the message now says the exam is built from the multiple-choice cards in your lectures and
points at Import. (The underlying product question — *should* the Q-bank feed mock exams, given it is the
richer question source? — is a design call, logged as a note below.)

## 🟠 MX-05 — A question with a broken answer key is unanswerable, and the review says "Correct: ." — MEDIUM — ✅ FIXED
**What's wrong:** A recall card with options but a non-integer / out-of-range `ans` can never be got right by
anyone. The results screen then prints `Correct: ` with a blank letter and a blank option text, so the student
is told they were wrong and shown nothing to learn from.
**Root cause:** `examPool` only checked `c.opts && c.opts.length`; nothing validated `c.ans`. Grading is strict
(`S.answers[k]===it.c.ans`, `:5493`), matching `pickOpt`'s `ok=(i===c.ans)` (`:4785`), so `ans:"2"` or
`ans:undefined` fails every comparison. `examResult` (`:5503`) then does `String.fromCharCode(65+c.ans)` →
`65+undefined = NaN` → `String.fromCharCode(NaN)` = `" "`, and `esc(c.opts[undefined])` → `''`.
Third instance of the QB-01 / VIZ-02 family.
**Fix (applied):** new `examUsable(c)` predicate — `opts.length>1 && Number.isInteger(c.ans) && 0<=ans<opts.length`
— gates the pool for every scope. Broken cards are now silently excluded rather than served as unwinnable.
**Note:** this *excludes* rather than *repairs*. If a lecture's cards were built by an older path that stored
`ans` as a string, its whole deck drops out of the exam pool. Worth one sweep on a live account to confirm
`ans` is an integer everywhere before assuming this is a no-op.

## 🟠 MX-06 — Opening the Mock exam tab silently destroyed a live review session — MEDIUM — ✅ FIXED
**What's wrong:** A student 18 cards into a review session who taps 📝 Mock exam in the nav — just to *look* —
loses that session. Coming back to Active Recall starts a brand-new one; the 18 rated cards are kept (they were
persisted at rate time) but the session, its meter and its remaining queue are gone.
**Root cause:** `pageExam`'s setup branch executed `S=null` (`:5450`) as a side effect *of rendering*. Merely
navigating to the page was enough. Nothing needed it: the branch is only entered when `S` is null or not an
exam, and `startExam` overwrites `S` wholesale anyway; `newExam` clears `S` itself.
**Fix (applied):** the `S=null` line removed (comment left in its place). The review/deck session now survives a
detour to the exam tab, which is what `pageReview`/`pageStudy`'s resume logic already expects.

## 🟡 MX-07 — Submit was irreversible with no confirmation, even with blanks — MEDIUM — ✅ FIXED
**What's wrong:** The Submit button reads `Submit (7 blank)` and one tap ends the paper permanently. There is
no confirm, no undo, and no route back into the exam — `S.finished` is set and `pageExam` routes to
`examResult()` from then on. On a phone this is one mis-tap next to `Next →`.
**Root cause:** `examSubmit` (`:4390`) was a bare three statements. The Q-bank's equivalent, `qbEndEarly`
(`:2611`), already confirms with a count of what will be skipped — the exam just never got the same treatment.
**Fix (applied):** `examSubmit` now returns early if already finished (it was re-settable, which re-stamped
`S.finished` and inflated the duration on re-render) and confirms when any answer is blank, naming the count.
A fully-answered paper submits with no interruption, as before.

## 🟡 MX-08 — Keyboard: the on-screen hint says "Pick A–D" but only 1–9 worked — LOW — ✅ FIXED
**What's wrong:** The footer hint under every exam question reads *"Pick A–D · you can go back and change
answers · Submit when done"* and each option is badged **A**, **B**, **C**, **D** — but pressing `a` did
nothing. Only the number row worked, and nothing on screen said so.
**Root cause:** the `#/exam` branch of the keydown handler (`:4981`) tested `/^[1-9]$/` only.
**Fix (applied):** `a`–`z` are now mapped to option index `charCode-65` and accepted when in range (modifier
keys excluded so ⌘R / ⌃A still work). Also widened that branch's typing guard from `/INPUT|TEXTAREA/` to
`/INPUT|TEXTAREA|SELECT/ || isContentEditable`, matching the review branch two lines below (`:4987`) — this was
the REV-02 guard, applied inconsistently.

## 🟡 MX-09 — "Clinical only — N scenarios" promised questions the exam cannot serve — LOW — ✅ FIXED
**What's wrong:** The clinical scope tile advertised e.g. "62 scenarios" and then produced an exam of 4
questions (or, before MX-02, a crash).
**Root cause:** the tile used `clinCount()` (`:1416`) = every clinical-prefixed recall card; the exam can only
use the MCQ-capable subset.
**Fix (applied):** the tile now counts `examPool('clinical').length` and is labelled "N MCQ scenarios".
**Cost note:** this runs a full `examPool` pass on every render of the setup screen. Cheap relative to the
existing `DB.subjects` map, but if the card set grows it should be memoised.

## 🟠 MX-10 — A background sync silently resets the scope and length you picked — MEDIUM — proposed, needs review
**What's wrong:** The student picks "Pharmacology / 60 questions", and a sync completes in the background. The
selection snaps back to "All topics / 20" with no visual cue beyond the highlight moving. Tapping Start then
sits a 20-question all-topics paper they did not ask for.
**Root cause:** the setup screen's state lives **only in the DOM**. `selExamScope`/`selExamCount` (`:5485–5486`)
just toggle an `.on` class, and `launchExam` (`:5487`) reads the selection back out of the DOM at tap time.
`pageExam` re-emits the markup with the defaults hard-coded (`k===0` for scope, `k===1` for count), so any
re-render wipes it. `sync.js:170` calls the global `render()` on every successful pull.
**Fix (proposed, NOT applied):** mirror Mega's `_mgCfg` — a module-level `_examCfg={sc:'all',n:20}` written by
the two selectors, read by `launchExam`, and used to decide the `on` class in `pageExam`. Held back because it
rewrites the setup template and MG-01 showed how easy it is to introduce a shared-reference bug here; wants a
human eye and one manual pass.

## 🟠 MX-11 — Mock exams are invisible to every progress surface in the app — MEDIUM — proposed, needs review
**What's wrong:** A student sits a 60-question mock exam. Their daily ring shows 0 cards, minutes-studied is
unchanged, the streak does not count it, This week shows nothing, and Progress has no record the exam happened.
Only the two optional buttons on the results screen (`★ Send missed to hard`, `Drill N missed`) write anything
at all, and both only touch the *missed* subset.
**Root cause:** the whole exam block writes nothing. There is no `logRate`/`logDaily` (`:1248`,`:1251`), no
`DATA.log[dstr()]` entry, no `logMs`, no `touchTopic`, and nothing equivalent to the Q-bank's `qbRecord` →
`_attempts`/`_sessions` store (`:2620–2628`). `S` is memory-only and `persist()` is never called for it.
**Fix (proposed, NOT applied):** on `examSubmit`, record the session the way `qbFinalize` does and credit
`DATA.log`. Held back deliberately: this feeds the **streak** and the daily goal, and a wrong call here either
gifts streaks or double-counts cards that also get rated in "Drill missed" straight afterwards. Needs a
decision from you on whether a mock exam should count toward the daily goal at all.

## 🟠 MX-12 — There is no way to get back to the questions you left blank — MEDIUM — proposed, needs review
**What's wrong:** The Submit button truthfully reports `Submit (7 blank)` — and then gives the student no way
to find those 7. The only navigation is `← Prev` / `Next →`, one question at a time, both disabled at the ends.
On a 60-question paper, finding a blank at position 12 from position 60 is 48 taps with no indicator of which
questions are answered. Most students will just submit and eat the marks.
**Root cause:** `pageExam`'s running view has no question navigator; `examNav(d)` (`:4389`) is strictly ±1.
**Fix (proposed, NOT applied):** a compact number grid above the question — answered filled, blank outlined,
current ringed — with `onclick="examJump(k)"`, plus a "Go to first blank" affordance on the Submit row. Small
feature rather than a bug fix, so logged rather than applied.

## 🟡 MX-13 — Questions you never saw are filed as cards you got wrong — LOW — logged only
**What's wrong:** `★ Send missed to hard` on an early-submitted paper stars every unanswered question as a hard
card **and** writes `logMiss(it.id)` for it, so questions the student never even scrolled to now pollute the
"Recent mistakes" deck and the hard-card badge.
**Root cause:** `examMissedItems()` (`:4391`) is `S.answers[k]!==it.c.ans`, and `null !== 0` is true, so blanks
and wrong answers are indistinguishable to both `examSendHard` and `examDrillMissed`.
**Not fixed because** it is a judgment call, not a defect: "I couldn't answer it" is arguably worth drilling.
But *starring as hard* and *logging as a miss* are stronger claims than "left blank", and the results list
already renders these as `Your answer: —`, so the data to separate them exists. Suggest: drill includes blanks,
send-to-hard does not.

## ℹ️ MX-NOTES — smaller observations, not fixed
- **"Timed … like the real paper" is not timed.** The setup copy promises exam conditions and each length tile
  prints "~45 min", but `_examTimer` (`:6036`) only counts *up* and nothing ever auto-submits. Either enforce
  the budget or soften the copy — the same gap MG-NOTES flagged for Mega Test mode.
- **The clock keeps running while you are somewhere else.** `S.started` is wall-clock, so a student who leaves
  the exam to read a topic for ten minutes has those ten minutes in their final "12m 04s". `render()` clears
  and re-arms `_examTimer` correctly on nav, but nothing pauses the underlying elapsed calculation. There is no
  pause control either.
- **A refresh loses the whole paper.** `S` is never persisted and there is no `beforeunload` guard, so a reload,
  an iOS tab eviction, or the service worker updating mid-exam discards 60 answers with no warning. The Q-bank
  has the same exposure (`QB` is memory-only too), so this is consistent rather than a regression — but the
  exam is the longest single session in the app and therefore the most expensive one to lose.
- **`examDrillMissed` destroys the results screen with no way back.** It overwrites `S` with the drill session
  (`:4395`), so the score, the per-subject breakdown, the missed-question review list and the `★ Send missed to
  hard` button are all gone permanently the moment the student taps Drill. Nothing is persisted first. A
  "finish drill → back to results" path, or simply persisting the last exam result, would fix it.
- **`S.answers` is written by one index and read by another.** `examPick` writes `S.answers[S.order[S.i]]`
  (`:4388`) while `examResult` and `examMissedItems` read `S.answers[k]` where `k` is the position in `S.items`.
  These agree *only* because `order` is built as the identity map and the exam has no shuffle control. If a
  shuffle is ever added to this flow (the review flow has one — REV-09), every answer silently attaches to the
  wrong question and the whole paper mis-grades with no error.
- **The progress bar measures position, not progress.** `((S.i+1)/n)` (`:5472`) fills as the student walks
  forward, so skipping to the end shows 100% with nothing answered. The counter beside it already prints the
  honest `N answered`.
- **No "retake this paper".** After results, the only option is `New exam` → back to setup → a freshly shuffled
  pool. Re-sitting the same questions after drilling them is the obvious study move and is not offered.
- **The mock exam is completely ungated.** `startExam` has no `isPremium` / entitlement check and no daily cap,
  unlike Visualize (3/day) and the import quota. Whether that is intentional is a paywall question → **hand to
  flow 18**.
- **A bad count used to produce a misleading empty-state.** `startExam` took `count` straight into
  `Math.min(count, pool.length)`; a `NaN` (a malformed `data-n`) made `slice(0,NaN)` return `[]` and the student
  saw "No exam questions yet" — the wrong diagnosis entirely. Now coerced with
  `Math.max(1, Math.floor(+count)||20)`.
- **Design question raised by MX-04:** the Q-bank is the app's richer question source (stems, lead-ins,
  rationales, trap explanations, cognitive level, skill tags) and the mock exam ignores it entirely in favour of
  bare `recall` MCQs. Mega Q-bank already assembles across topics from that store. If mock exam is meant to be
  the exam-condition surface, `examPool` arguably belongs on top of `qbStore()` rather than `t.recall` — a
  product decision, not a bug.

---

# FLOW 12 — Solve (photo/text → worked explanation) · `app.html:2278-2327`, `import-server/server.mjs:1140-1166`

Reviewed the whole surface: `pageSolve` / `solvePreview` / `fileToB64solve` / `solveNow` on the client, and the
`/solve` handler plus the `generate()` path it depends on, on the server. 11 findings. The Solve page is small,
so most of these are one- or two-line defects — but three of them make a *paying* student's failed solve look
like their own bad photo, and one of them can hand back a confidently invented answer to a photo the model
never received.

## 🔴 SOLVE-01 — A photo can be silently dropped and the answer invented — HIGH — FIXED (guard added)
**What's wrong:** `/solve` sends the image to `generate()` and trusts it to arrive. It doesn't always.
`generate()` only attaches images on two of its four branches:
- OpenAI branch: `if(!isDeep) imgs.forEach(...)` (`server.mjs:227`) — **DeepSeek models get no image at all**
- and `generate()`'s first line reroutes **any** `claude*` model to `TEXT_MODEL` (= `BASIC_MODEL` = deepseek)
  before the branch is even chosen (`server.mjs:181`).

So if `SOLVE_MODEL` is ever set to a deepseek model, **or** to a Claude vision model (an entirely reasonable
thing to set — Claude reads images), the photo is discarded and the model is asked `SOLVE_PROMPT` with nothing
but "explain the question in the image". It cannot see the image, is not told the image is missing, and is
instructed to be "a sharp medical tutor" — so it writes a fluent, confident worked solution to a question it
invented. The student gets a wrong answer with no error, no warning and no way to tell. This is the worst
failure mode in the app: everything else that breaks at least *looks* broken.
**Root cause:** the image-capability assumption lives in a comment (`server.mjs:1148` "vision-capable, cheap,
non-Claude") instead of in code, and the comment at `:180-181` explicitly notes Solve depends on this — the
dependency is documented but never enforced.
**Fix (APPLIED, `server.mjs:1150-1154`):** before generating, if `images.length` and the model matches
`/^deepseek/i` or `/^claude/i`, return 500 with *"Solve can't read photos with the model this server is set to.
Type the question out instead."* A blind guess is strictly worse than an honest refusal here.
**Follow-up (not applied):** the real fix belongs in `generate()` — it should throw when handed images it is
about to drop, which would also protect any future image caller. Left alone because `generate()` is shared by
every build path and this run only owns Solve.

## 🟠 SOLVE-02 — An empty model reply was blamed on the student's photo — MEDIUM — FIXED
**What's wrong:** `res.json({ ok:true, answer:(gen.text||"").trim() })` (old `:1150`) shipped **200 ok:true with
`answer:""`** whenever the model returned nothing (filtered, refused, zero-token reply, or a reasoning model
leaving both `content` and `reasoning_content` empty). The client's `if(!r.ok||!o.answer)` then threw its
fallback string — *"Could not solve this — try a clearer photo."* The photo was fine. The student retakes it,
gets the identical message, retakes it again. A retry that can never work, driven by a diagnosis the server
knows is wrong.
**Root cause:** the fourth instance of this exact family (SRV-02 empty lecture, QB-04, POD-01, VIZ-01): an empty
generation is shipped as success and the failure is re-described downstream as a user error.
**Fix (APPLIED, `server.mjs:1157-1158`):** blank `answer` → `502 {error:"The tutor didn't return an answer this
time. Try again in a moment."}`, which the client already surfaces verbatim.

## 🟠 SOLVE-03 — A 502/413 from the proxy printed "Unexpected token '<'" — MEDIUM — FIXED
**What's wrong:** `const o=await r.json();` (old `:2309`) with no guard. A Render/Cloudflare 502, 504 or 413
returns an **HTML** error page, so `r.json()` throws a `SyntaxError` and the catch block paints the student
`Unexpected token '<', "<html>..." is not valid JSON` in red. Since a Solve request carries a multi-megabyte
base64 photo, 413 and proxy timeouts are the *most likely* failures on this endpoint, not edge cases.
**Root cause:** the same defect IMP-05 fixed in `import-tab.js:261-267`; the fix was never carried across to
Solve, which is the other endpoint that uploads large bodies.
**Fix (APPLIED, `app.html:2313-2317`):** `try{ o=await r.json(); }catch(_){ o=null; }` and, on `!o`, a message
chosen by status — 413 → *"That photo is too large — retake it at a lower resolution."*, anything else →
*"The Solve server didn't respond properly (N). Try again in a moment."*

## 🟠 SOLVE-04 — "Solve it" was a dead button for anyone the paywall couldn't nudge — MEDIUM — FIXED
**What's wrong:** the 402 branch was `if(!r.ok && o.error==='upgrade'){ if(window.MB_PAYWALL) MB_PAYWALL.nudge(...); ... return; }`
(old `:2310`). If `paywall.js` hasn't loaded — a stale service-worker cache, a blocked script, or simply a
different page-load order — the branch re-enables the button and returns **having displayed nothing at all**.
`solveMsg` stays empty, `solveOut` stays empty. A basic-tier student taps Solve it, waits, watches the button
say "Solving… ~10s" and then go back to "Solve it", with no message, forever. They will report it as "Solve
doesn't work", not as "I need to subscribe" — and the one message that would convert them is the one that
didn't render.
**Root cause:** a paywall nudge used as the *only* channel for a server error, with no fallback path.
**Fix (APPLIED, `app.html:2318-2324`):** `else msg.innerHTML = …esc(why)…` so the upgrade reason always lands
somewhere. Also widened the condition to `o.error==='upgrade' || r.status===402` so a 402 with any other body
still reads as a paywall rather than a crash.

## 🟡 SOLVE-05 — A signed-out student was told "not signed in" as if it were the answer — LOW — FIXED
**What's wrong:** `token` is whatever `getSession()` yields, including `null`, and was interpolated regardless:
`'Authorization':'Bearer '+token` → the literal header `Bearer null` → `getUser` returns null → 401
`{error:"not signed in"}` → thrown → rendered in red under the button. It is the server's internal phrasing,
it doesn't tell the student what to do, and it doesn't offer a way to sign in.
**Root cause:** the `Bearer null` bug IMP-03 already fixed in `import-tab.js:257`; not carried across.
**Fix (APPLIED, `app.html:2306-2309`):** null-safe session read (`ses&&ses.data&&ses.data.session`) plus an
early `throw new Error("You're signed out — sign in and try again.")` before the fetch is made.

## 🟡 SOLVE-06 — Android students could not upload a past question at all — LOW/MEDIUM — FIXED
**What's wrong:** the file input carried `capture="environment"` (old `:2284`). On Android Chrome that attribute
makes the picker open the **rear camera directly**, with no route to the gallery or to Files. The page copy
promises "Snap **or upload** a question" and the feature's headline use case — past questions — is almost
always a screenshot, a PDF page or a photo already in the camera roll. Every one of those was unreachable: the
student's only option was to point the camera at their own screen.
**Root cause:** `capture` was presumably added for the "snap" case, but it *removes* the choice rather than
defaulting to it.
**Fix (APPLIED, `app.html:2284`):** dropped `capture`. `accept="image/*"` alone still offers "Take Photo /
Camera" as the first entry in both the iOS and Android pickers, so snapping costs one extra tap and uploading
becomes possible at all. Flagged in case the one extra tap on the snap path is judged the worse trade.

## 🟡 SOLVE-07 — A missing API key was returned as the answer to the question — LOW — FIXED
**What's wrong:** `generate()` throws `"OPENAI_API_KEY not set"` (`server.mjs:222`) when the key is absent, and
the handler's catch did `res.status(500).json({ error:e.message })` — which the client renders straight into
`solveMsg`. A paying subscriber photographs an exam question and is told, in red, `OPENAI_API_KEY not set`.
It leaks the server's configuration vocabulary and reads as if the student did something wrong.
**Fix (APPLIED, `server.mjs:1160-1165`):** the catch now maps `/API_KEY not set/i` to *"Solve isn't set up on
this server yet."* and passes everything else through unchanged.

## 🟡 SOLVE-08 — Typed text had no length cap — LOW — FIXED
**What's wrong:** `text` went to the model in full. The textarea is `rows="2"` but nothing stops a paste, and
nothing stops a scripted client; a pasted chapter is billed as input tokens on a vision model and then fails the
context window with a provider error. Every other text input on this server is capped (`/tts` slices to 3000).
**Fix (APPLIED, `server.mjs:1145`):** `.toString().trim().slice(0,6000)`, and the sliced value (`q`) is what is
used for both the empty-check and the prompt part, so the two can't disagree.

## 🟡 SOLVE-09 — `req.body` destructured with no guard — LOW — FIXED
**What's wrong:** `const { image_base64, media_type, text } = req.body;` throws `TypeError: Cannot destructure
property … of undefined` on a request with no body or a non-JSON content-type, producing a 500 with a stack in
the logs instead of the intended 400.
**Fix (APPLIED, `server.mjs:1144`):** `req.body || {}` → falls through to the existing
`"send a photo or type the question"` 400.

## 🟠 SOLVE-10 — Nothing limits, meters or records a Solve — MEDIUM — proposed, needs review
**What's wrong:** `/solve` checks `isPremium` and then does no accounting whatsoever. There is no daily cap
(Visualize has 3/day basic, 10/day premium via `vizQuota`), no `solve_events` table, no usage row, and no cache.
One subscription therefore buys **unlimited** vision-model calls at up to ~48 MB of image per call, from a
client with no rate limiting either — the button re-enables the instant the response lands. A single shared
account, or a loop against the endpoint with a valid token, is uncapped spend. It is also invisible: there is no
record that Solve was ever used, so the feature cannot be costed, and if it *is* being abused nobody can tell.
**Not fixed because** picking a limit is a product decision and adding a table + quota read is well beyond a
localized fix. **→ hand to flow 18** alongside QB-10 (`/build-extra` unmetered), POD-10 (`/podcast-audio`
unmetered, 56 paid episodes per topic) and the ungated mock exam.
**Suggested shape:** reuse the `vizQuota` pattern exactly — a `solve_events` row per call and a premium-tier
daily allowance — so both features share one mechanism.

## 🟠 SOLVE-11 — The photo is uploaded at full size, with no timeout and no progress — MEDIUM — proposed, needs review
**What's wrong:** `fileToB64solve` base64-encodes the file exactly as the camera produced it. A modern phone
photo is 3-12 MB, and base64 adds 33%, so a routine solve POSTs 4-16 MB. Three consequences, none handled:
1. **No timeout.** The `fetch` has no `AbortController`. On a weak connection the upload can run for minutes
   with the button frozen at "Solving… ~10s" — a label that is now actively lying — and no cancel.
2. **No progress.** `fetch` gives no upload progress, so there is nothing to show even if we wanted to.
3. **The server-side budget is real.** `express.json` accepts 48 MB (`server.mjs:44`) but the hosting proxy in
   front of it may cap lower and reply 413/502 — the same class of failure as SRV-06 and POD-08.
**Fix (proposed, NOT applied):** downscale client-side before encoding — draw to a `<canvas>` at max ~1600px on
the long edge and `toDataURL('image/jpeg', 0.85)`. A photographed exam question stays comfortably legible at
that size, and the payload drops to a few hundred KB, which fixes the timeout, the cost and the 413 together.
Add an `AbortController` with a ~90s cap alongside it. Logged rather than applied because a resize touches the
image the model reads, and this run cannot test that the resized image is still legible — **RUNTIME: needs a
live session with a real photo of a real past question to confirm legibility at 1600px.**

## ℹ️ SOLVE-NOTES — smaller observations, not fixed
- **The answer is destroyed by any navigation.** `solveOut` is page-local and nothing is persisted. Tapping the
  back gesture, a sync-triggered `render()`, or opening the topic the question came from, all discard the
  explanation permanently with no undo and no history. There is no "save this", no "add to my cards", and no
  list of past solves — so the one feature that produces a keepable artefact keeps nothing. Given a worked
  explanation is exactly the thing a student wants to revisit before an exam, a `solve_history` in `DATA` (or
  even just "★ Save as a card") looks like the highest-value addition to this flow.
- **No dead-end handling for a non-image file.** `accept="image/*"` is a filter, not a rule — desktop pickers
  can override it. A selected PDF is base64'd and sent with `media_type:"application/pdf"`, and OpenAI rejects
  it with a provider error the student sees raw. A `f.type.startsWith('image/')` check in `solvePreview` would
  catch it at selection time, which is where the student can still fix it.
- **HEIC is not considered.** iOS usually hands JPEG to a file input, but not always; a genuine `image/heic`
  payload is rejected by the vision model. Same one-line place to catch it as the note above.
- **`URL.createObjectURL` is never revoked** (`:2295`). Each re-pick leaks a blob for the page's lifetime.
  Harmless in practice, one line to fix (`URL.revokeObjectURL` on the previous preview).
- **`fileToB64solve` rejects with an `Event`, not an `Error`.** `r.onerror=rej` (`:2297`) means the catch reads
  `e.message` off a `ProgressEvent` → `undefined` → the generic "Something went wrong". A read failure on a file
  the OS won't hand over (an iCloud-evicted photo is the common one) deserves its own message.
- **"Solving… ~10s" is an unverified promise.** Nothing measures it. With a multi-MB upload on mobile data plus
  a vision call, 30-60s is ordinary. Either drop the number or make it a phase label ("Uploading…" → "Reading
  the question…"). **RUNTIME — needs a live session to time honestly.**
- **Nothing tells the student Solve is premium until after they've done the work.** The nav item, the page
  heading and the sub-copy are identical for every tier; the 402 only arrives after they have taken a photo,
  typed context and waited through an upload. Settings (`:5331`) is the only place premium-ness is stated. A
  small "Premium" chip on the nav row or in the sub-line would spend the student's effort more honestly. Not
  applied because the client has no tier flag to read — `MB_PAYWALL.guard` reads trial/entitlement state, not
  premium — so doing it properly means surfacing tier client-side. **→ relevant to flow 18.**
- **`md()` is safe here.** It escapes before applying inline markup (`:1034`), so a model reply containing HTML
  renders as text rather than executing — worth recording since `o.answer` is model output going straight into
  `innerHTML`. One caveat: an image line in the reply reaches `imgBlock` via `m[2].replace(/^img\//,'')`
  (`:1057`), which resolves against local content paths, so a model-emitted image URL renders as a broken image
  rather than being ignored.
- **`MB_PAYWALL.nudge` puts its arguments in `innerHTML`** (`paywall.js:16-18`). Here the input is a
  server-authored constant, so it's fine today — but it is a sink worth remembering before any caller passes it
  something a user typed.

---

# Flow 13 — Topic page (open topic + its Q-bank / notes / cards / podcast / Visualize entry points, `app.html`)
Scope: `pageTopic` (`:2379-2461`), `modeSwitcher` (`:2459`), `topicVizList`/`renderVizList`/`playVizIdx`/`delVizIdx`
(`:2475-2504`), `genPrompt`/`buildExtraNow`/`genExtra`/`rebuildExtra` (`:2506-2541`), `renderWritten`/`wtGrade`
(`:2543-2566`), `renderQbank`/`qbStart` (`:2589-2643`), `renderPodcast`/`podAudioEl`/`podStopAudio` (`:3549-3560`),
plus the topic-page helpers `topicStage` (`:1796`), `topicMastery` (`:1814`), `resetTopicProgress` (`:1384`),
`exportTopicPDF` (`:1393`), `addToFolderPrompt` (`:2255`), and `content-loader.js:applyContent` (`:53-82`).

## 🔴 TOP-01 — One Visualize-quiz card blanks the entire spaced-repetition pipeline on the topic page — HIGH — ✅ FIXED
**What's wrong:** the "Read → Learning → 24-hour → 3-day → Weekend → Weekly → Long-term" pipeline is the topic
page's main progress display. For any topic where the student has saved a card from a Visualize quiz, **every step
renders inert** — nothing is `done`, nothing is `on` — so a student who has studied the topic for weeks sees a row
of empty circles and no indication of where they are.
**Root cause:** `addVizCard` (`:1660-1665`) pushes the new card into `t.recall` **and** writes its state row as
`{due,ivl,ease,reps,isNew}` — with **no `box`**. `topicStage` (`:1796-1802`) collected states with
`.filter(Boolean)`, so that row counted as "seen", then `Math.max(0, s.box)` → `Math.max(0, undefined)` → **`NaN`**
→ `avg` `NaN` → `Math.min(5, Math.round(NaN))` → `NaN`. In `pageTopic` the consumer is
`activeIdx = stage<0 ? (rd?0:-1) : stage+1` — and `NaN < 0` is **false**, so `activeIdx` becomes `NaN` and the
`i<activeIdx` / `i===activeIdx` tests are false for every step. Same REV-01 family (a state row created without a
`box`); `rateSRS` was hardened at `:1266`, but `topicStage` was the other reader and was missed.
**Fix applied (`:1798-1803`):** the filter now keeps only rows with a numeric, non-`NaN` `box`, so unstudied
Visualize cards are ignored (they also no longer dilute the average), and the return is `NaN`-guarded to `-1`.

## 🔴 TOP-02 — A background content refresh wipes the locally-built Q-bank / Written test — HIGH — ✅ FIXED
**What's wrong:** a student builds the Question bank on a topic (a paid model call), studies it, and then at some
arbitrary later moment the Q-bank tab reverts to "Question bank isn't built for this lecture yet" with a
**✨ Build Question bank** button — inviting them to pay for the same build again. Same for the Written test.
**Root cause:** `buildExtraNow` caches the result on the in-memory topic (`app.html:2521`,
`t.extras[kind]=out.items`). `content-loader.js:applyContent` rebuilds the topic's fields on every refresh with
`extras: (exById[t.id] || null)` (`:68`) and then `Object.assign(em/ea, fields)` (`:75-76`) — so any refresh whose
payload doesn't carry extras **overwrites the cache with `null`**. The file already protects `transcript` from
exactly this (`:73-74`, "don't wipe a transcript we already loaded with a cache/refresh that lacks it"); `extras`
was never given the same treatment.
**Fix applied (`content-loader.js:75-77`):** mirrors the transcript guard — if the incoming `extras` is `null`, the
already-loaded value is carried forward. A refresh that *does* carry extras still wins, so the server stays the
source of truth. `node --check content-loader.js` passes.

## 🟠 TOP-03 — A failed "↻ Rebuild" destroys the cached questions *and* the live session — MEDIUM — ✅ FIXED
**What's wrong:** the ↻ Rebuild button sits in `renderQbank`'s header, which is rendered **during an active
session too** (`:2597`). Tapping it offline, or when the build server 5xx's, left the student with no Q-bank at
all: the "isn't built yet" prompt, and their in-progress session gone from the screen (though `QB` was still set —
so the app was in a live-session state with no session UI).
**Root cause:** `rebuildExtra` deleted the local cache **before** the network call (`:2533`,
`if(t&&t.extras) delete t.extras[kind]`), and `renderQbank` checks `if(!items||!items.length) return genPrompt(...)`
(`:2591`) **before** the active-session branch (`:2597`). A rejected `buildExtraNow` therefore leaves the deletion
in place with nothing to restore from.
**Fix applied (`:2533-2537`):** the pre-delete is gone. `buildExtraNow(topicId,kind,true)` already assigns
`t.extras[kind]` on success, so `force:true` still produces a fresh set — the difference is that a **failure** now
leaves the existing questions untouched.

## 🟠 TOP-04 — A built topic missing one deck white-screened the topic page — MEDIUM — ✅ FIXED
**What's wrong:** `pageTopic`'s cards tab read `t.primer.length` and `t.recall.length` directly (`:2414`, `:2417`).
For a `ready` topic whose content is missing a deck, that throws inside `render()`, so `$('#main').innerHTML=html`
(`:6035`) never runs — the student taps the topic and the page **does not change at all** (previous screen frozen),
with no error. This is REV-03 (the same crash in `startDeck`) reaching a second entry point. Note `:2448` in the
same function already writes `(t.recall||[])` — the guard was inconsistent within one function.
**Fix applied (`:2410-2417`):** `nPrimer`/`nRecall` are computed with `(t.x||[]).length` and used in the markup.
Topics loaded through `content-loader.js` always get `[]` (`:69`), so this only bites statically-defined content —
but it costs one line to make the page unbreakable.

## 🟠 TOP-05 — A busy build server shows the student "Unexpected token '<'" — MEDIUM — ✅ FIXED
**What's wrong:** `buildExtraNow` did `const out=await r.json()` (`:2519`). The proxy answers 413/502/504 with an
**HTML** error page, so `r.json()` throws a `SyntaxError` whose message surfaces through `genExtra`'s catch as
`mbToast('Build failed: Unexpected token '<'…')`. Fourth appearance of this family (IMP-03, SOLVE-03, SRV).
**Root cause:** the response is assumed to be JSON on the failure paths, not just the success path. The 502/503/504
auto-retry above it only covers the *first* attempt — the second one lands here.
**Fix applied (`:2519-2523`):** read `r.text()` first and `JSON.parse` inside a try; a non-JSON body becomes
"That note is too large to build from." (413) or "The build server is busy right now — try again in a minute."

## 🟠 TOP-06 — A filter picked on another lecture disables both Q-bank modes on a topic full of questions — MEDIUM — ✅ FIXED
**What's wrong:** `_qbCfg` is a single global (`:2570`) shared by every topic. Pick 🎯 Practice = "Management" on
lecture A, open lecture B whose questions are all tagged `diagnosis`, and B's Q-bank start screen shows **both mode
cards greyed out** with "No questions match — widen the filter" — while the chip row shows only a single **All**
chip that is *not* highlighted (the `management` chip isn't offered on B, so nothing reads as selected). The
student is told their brand-new question bank is empty. The escape (tap All) is there but unmarked.
**Root cause:** `skillOpts`/`levelOpts` are built from **this** topic's items (`:2603-2604`) but `cfg` is never
reconciled against them, and `match` (`:2609`) then filters on a value that cannot exist here.
**Fix applied (`:2605-2609`):** before `cfgBlock`/`match` are computed, a `cfg.skill`/`cfg.level` that isn't among
this topic's options falls back to `'all'`, and a `cfg.count` larger than the topic's pool resets to All. Purely a
per-topic reconciliation — the student's choice still persists wherever it is valid.

## 🟠 TOP-07 — Deleting a saved explainer had no confirmation and could silently come back — MEDIUM — ✅ FIXED
**What's wrong:** two problems on the 🎬 Videos tab. (1) 🗑 deleted immediately — one mis-tap destroys a saved
explainer, and replaying it later is a **rebuild that can spend a daily explainer** (see VIZ-09). (2) The row could
**reappear on the next render**: `topicVizList` de-dupes **by text** across `DATA.viz[topicId]` and `DATA.cardViz`
(`:2480`), keeping the first copy, but `delVizIdx` removed only the source the surviving row happened to carry
(`:2497-2501`) — so when the same sentence had been visualized from both the note and a card, deleting removed one
copy and the other immediately took its place in the list. A delete that visibly does nothing.
**Fix applied (`:2497-2504`):** a `confirm()` that states the replay cost, then removal of **every** copy of that
text — from `DATA.viz[topicId]` and from any `DATA.cardViz` key under this topic.

## 🟡 TOP-08 — Podcast audio keeps playing after the student leaves the topic, with no way to stop it — MEDIUM — proposed, needs review
**What's wrong:** the `<audio id="podAudio">` element is created once and appended to **`document.body`**
(`:3549-3555`), i.e. outside `#main`, so it survives every re-render. `podStopAudio` (`:3557`) is only called from
`podEnter` when the **topic id changes** (`:3564`), from `podRemake` and from `podChangeVoices`. Switching to
another tab on the same topic, or navigating to Home / a study session, leaves the episode **playing** with the
player UI gone. `podTick`/`podPaintTimes` keep firing against `#podRoot` elements that no longer exist. To stop it
the student has to find their way back to that exact topic's Podcast tab (or close the tab).
**Root cause:** playback lifetime is bound to the `POD` object, but nothing binds it to the route. `render()`
(`:6035-6094`) has per-route teardown for the exam timer (`:6086`) — there is no equivalent for audio.
**Proposed (NOT applied):** either (a) in `render()`, stop the audio when leaving the topic route
(`PREV_BASE==='topic' && p[0]!=='topic'`) — but that also needs to survive a `topicTab` switch, which re-renders
the same route, so the condition has to include the tab; or (b) the better product answer, a persistent mini-player
so background listening becomes a feature rather than a leak. Both touch shared render/teardown code — logged.

## 🟡 TOP-09 — A cross-topic "Practise my mistakes" session renders inside every topic's Q-bank tab — MEDIUM — logged, not fixed
**What's wrong:** `renderQbank` shows the active session when `QB.topicId===t.id` **or** `QB.mistakes` (`:2597`).
`qbStartMistakes` sets `mistakes:true` (`:2880`/`:2922`), so once a mistakes session is live, opening **any other**
topic's Q-bank tab renders that session — under topic B's `<h1>`, breadcrumbs and "Your accuracy" header (`:2595`,
computed from `qbData(t.id)`, i.e. B's stats). The student cannot reach B's own start screen without ending A's
session, and the accuracy line above the question describes a different lecture.
**Root cause:** `QB` is a single global session object with no owning route; the `|| QB.mistakes` escape hatch
exists so the cross-topic pool can render *somewhere*, but it matches *everywhere*.
**Not fixed:** the correct fix is to give the mistakes session its own route (as Mega has, `:3400`) rather than
borrowing a topic page — too large for a conservative pass.

## 🟡 TOP-10 — Starting a topic Q-bank silently destroys a live Mega / mistakes session — MEDIUM — proposed, needs review
**What's wrong:** `qbStart` (`:2637-2643`) overwrites the global `QB` with no check. During a live Mega session
(20-100 questions) or a mistakes drill, navigating to any topic and tapping "Tutor mode" discards every answered
question and its grading — no confirm, no warning. MG-01 is the same class of bug in the Mega config.
**Root cause:** one global `QB`; `qbEndEarly` exists precisely because a half-finished session has value, but
nothing routes through it here.
**Proposed (NOT applied):** in `qbStart`, if `QB && !QB.done && (QB.results||[]).length`, `confirm()` before
replacing (and ideally offer `qbEndEarly()` so the answered questions are still graded and logged). Left unapplied
because it inserts a modal into a start path shared with the mistakes/weak-pool entry points — wants a human eye.

## 🟡 TOP-11 — "Add to folder" silently did nothing if you typed the folder's name — LOW — ✅ FIXED
**What's wrong:** `addToFolderPrompt` (`:2255-2264`) shows a numbered `prompt()`. Typing the folder **name** (the
obvious thing to do when the prompt lists names) → `parseInt('Weak areas')` → `NaN` → `fs[NaN-1]` → `undefined` →
`if(!f){ return; }` — the dialog closes and **nothing happens at all**, no message, no folder. Same for any number
out of range. `f.topics.indexOf(...)` (`:2259`) also assumed `topics` exists, which throws on a folder restored
from an older backup shape.
**Fix applied (`:2259-2266`):** the prompt now says "Type the NUMBER, then OK"; an unrecognised entry gets an
explicit "Type the number next to the folder (1–N), or 0 for a new folder."; and `f.topics` is defaulted.

## 🟡 TOP-12 — The Simplified tab offered "Mark as read" on a lecture that has no simplified note — LOW — ✅ FIXED
**What's wrong:** 📝 Simplified is always in `modeSwitcher` (`:2463`). For a topic imported without a simplified
note, the tab rendered `md(undefined)` → the generic "Nothing here yet." **plus a working "Mark as read" button**
(`:2398-2400`) — so the student could mark an empty page read, which lights the **Read** step of the pipeline
(`:2436`, `isRead`) and misreports their progress.
**Fix applied (`:2395-2400`):** when `!t.simplified` the tab renders a real empty state that points at 📖 Notes
and explains that the simplified version is written at import time. No Mark-as-read button on an empty note.

## 🟡 TOP-13 — "% of Recall cards answered right at least once" was not what the number measures — LOW — ✅ FIXED
**What's wrong:** the Recall Cards tile printed `${mast}% of Recall cards answered right at least once` (`:2419`).
`topicMastery` (`:1814-1818`) counts `s.box>=0`, and `rateSRS` sets `box=-1` on **every** wrong answer (`:1270`).
So a card answered right and then missed stops counting: the number **goes down**, which is impossible for a stat
described as "at least once". Students reading this after a bad review session see their mastery drop and conclude
the app lost their history.
**Fix applied:** label changed to "right on your last attempt" (`:2419`) and the function comment corrected
(`:1814`). The metric itself is unchanged — it is a reasonable "currently solid" measure, it was just mis-described.

## 🟡 TOP-NOTES — smaller observations, not fixed
- **`pageTopic` falls back to `pageHome()` for an unknown id** (`:2380`). The loader guard at `:6039` covers the
  "content not ready yet" case, but a genuinely deleted/foreign topic id silently renders Home with the topic URL
  still in the address bar. A "That lecture isn't in your account any more" empty state would be honest.
- **`resetTopicProgress` (`:1384-1392`) deletes more than it says.** The confirm mentions "card history, resume
  position and read/done marks" — it also clears `DATA.starred` (the student's own hard-card marks) and
  `DATA.missLog`. It does **not** clear `DATA.qbank[id]`, so Q-bank accuracy survives a "reset progress" while
  flashcard history doesn't. Both are defensible; the copy should match whichever is intended.
- **`exportTopicPDF` (`:1393-1404`) is pop-up dependent and silently partial.** It exports the note + simplified
  note only — no cards, no Q-bank — while the button is labelled "⬇ Export PDF" on a page whose main content is
  cards. It also relies on `window.print()` in a blank tab, which on iOS Safari commonly yields a share sheet
  rather than a PDF. **RUNTIME — needs a live session to confirm the mobile behaviour.**
- **`wtGrade` (`:2555`) has no double-submit guard**, so a double-tap buys two model calls, and it writes into
  `#wtr_i` — any `render()` (a background sync will do it) **destroys both the student's typed answer and the
  feedback**, because the textarea's value lives only in the DOM. Same class as MX-10.
- **`WRITTENITEMS` / `_VIZLIST` are index-addressed globals** written at render time (`:2545`, `:2486`). Any
  re-render between paint and tap re-points the index. Harmless while the list is stable; it is the same pattern
  that made stale indices dangerous elsewhere.
- **`buildExtraNow` has no timeout and the button promises "~5s"** (`:2525`). A q-bank build is five parallel
  model batches server-side (QB-09); the button text is decoration, not a measurement.
- **`masteryChips` on the topic page (`:2448`) counts flagged cards**, so a card the student reported as wrong
  still contributes to their Unfamiliar/Learning/Familiar/Mastered totals — REV-04's pool list, ninth entry.
- **`renderPodcast` paints via `setTimeout(...,30)`** (`:3558`) rather than after the innerHTML assignment. It
  works because `render()` is synchronous, but a second render inside 30ms queues a second `podEnter`.
- **Both `qbStart` and `renderQbank` re-implement the same filter predicate** (`:2609` vs `:2639`). They agree
  today; they are two places to change and one is `cfg.skill==='all'` while the other also tolerates a falsy
  `cfg.skill`. Worth collapsing into one helper before anyone edits either.

---

# Flow 14 — Cards library / Note builder / Lecturers / Folders (`app.html`) — code review, 2026-08-22

Scope reviewed: `pageCards` (`:4077`), `pageStudy` deck entry (`:4474`), `topicRow` (`:1952`), `pageBuilder`
(`:2231`), `pageLecturers` / `pageLecturer` (`:2365`, `:2387`), the folders block (`:2256-2311`), the library
view toggle (`:2251-2255`), the card-correction store (`saveEditCard` / `flagCard` / `unflagCard`, `:1335-1353`),
plus `content-loader.js recomputeStats` and `sync.js mergeState` where they own this flow's data.

## 🔴 LIB-01 — "Report this card as wrong" is permanent: `unflagCard()` exists but nothing ever calls it — MEDIUM/HIGH — ⚠️ PROPOSED, NOT FIXED
**What's wrong:** `flagCard` (`:1342`) asks *"Report this card as wrong and hide it from your studying?"* and sets
`DATA.cardFlags[id]=1`. Since REV-04 hardened the pools, that flag now removes the card from **all eight** study
pools (`startDeck`, `buildQueue`, `buildRecallSession` ×2, `bucketItems` ×2, `collectRecall`, `planNew`, `examPool`).
`unflagCard` (`:1353`) is defined, correct, and **grepped for zero call sites** — no button, no settings row, no
list of hidden cards anywhere in the app.
**Root cause:** the undo half of the feature was never built. `app.html:1353` is dead code.
**Why it matters:** a mis-tap on a card the student actually understood deletes it from their account forever.
There is no count, no list, and no restore — the student cannot even discover that cards are missing. The confirm
copy says "hide", which promises reversibility the app does not have.
**Proposed fix (needs review — new UI, not a guard):** a `🚫 Hidden cards · N` row in Settings (or under the Cards
page) listing `Object.keys(DATA.cardFlags)`, each with a "Restore" button calling `unflagCard(id)`. Until that
exists, at minimum the confirm should say "hide it permanently".

## 🟠 LIB-02 — A cleared edit box permanently blanked the card, with no revert anywhere — MEDIUM — ✅ FIXED
**What's wrong:** `saveEditCard` (`:1335`) wrote `patch.q=q.trim()` for any non-null textarea value, including `''`.
`effCard` (`:1330`) then `Object.assign`s that blank over the real card, so the card renders with an empty question
(or empty answer) in every deck, session, exam and search result.
**Root cause:** no emptiness check before building the patch — and, critically, **nothing in the app can ever delete
a `DATA.cardEdits[id]` entry**, so the blank is not recoverable by re-editing (the editor pre-fills from `c`, which
is already the blanked `effCard` on the next render). One accidental select-all-delete destroys the card's text.
**Fix applied (`:1337-1343`):** empty fields are ignored instead of written; if the student cleared both boxes the
editor closes with a toast ("Nothing saved — a card needs a question and an answer.") and no patch is stored.
**Still open (note, not fixed):** clearing *one* box now silently keeps the old value with no feedback, and there is
still no "revert to the original card" action — LIB-01's restore UI should cover `cardEdits` too.

## 🟠 LIB-03 — `topicRow` / `pageCards` crashed on a topic built without one of its decks — MEDIUM — ✅ FIXED
**What's wrong:** `topicRow` (`:1958`) printed `${t.primer.length||t.primer} Primer · ${t.recall.length||t.recall}`
and `pageCards` (`:4093-4094`) printed `${t.primer.length}` / `${t.recall.length}` — all four unguarded.
**Root cause:** the ninth and tenth instances of the missing-deck defect already fixed in `startDeck` (REV-03) and
`pageTopic` (TOP-04). `topicRow` is the shared row renderer for the subject page, the lecturer page, the folder page
**and search**, so one half-built topic white-screened four separate pages, not one. `pageCards` is the whole Cards
tab for that subject.
**Second, quieter bug in the same expression:** `t.primer.length||t.primer` falls through on an **empty** deck —
`[].length` is `0`, which is falsy — so it printed the array itself (an empty string). A topic with 0 primer cards
rendered `· ` `Primer · 12 Recall`: a label with no number, which reads like a rendering fault.
**Fix applied:** new `deckN()` helper (`:1951`) returns `d.length` for an array, `d` for a legacy number, `0`
otherwise; used in `topicRow` (`:1958`) and `pageCards` (`:4089`). Also `s.modules.flatMap(m=>m.topics||[])`
(`:4078`) so a module with no `topics` array can't throw either.

## 🟡 LIB-04 — A topic can be added to a folder but never removed from one — MEDIUM — ⚠️ PROPOSED, NOT FIXED
**What's wrong:** `addToFolderPrompt` (`:2265`) pushes a topic id into `f.topics`. There is **no** `removeFromFolder`
anywhere in the repo. `pageFolder` (`:2301`) offers only ✎ Rename and 🗑 Delete folder; the rows are plain
`topicRow`s whose only action is opening the topic.
**Root cause:** the mutator was written without its inverse, same shape as LIB-01.
**Why it matters:** the add path is a **numbered `prompt()`** — typing `2` instead of `3` files the lecture in the
wrong folder, and the only way to undo it is to delete the entire folder and rebuild it. For a feature sold as
"Weak areas" / "Exam block 1", a folder that only grows is close to useless by mid-term.
**Proposed fix (needs review — touches the shared row renderer):** render folder rows with a trailing
`✕` calling `removeFromFolder(folderId, topicId)` → filter `f.topics`, `persist()`, `render()`. Either add an
optional third arg to `topicRow` or wrap each row in the folder page.

## 🟡 LIB-05 — Folder cards counted topic ids that no longer resolve — MEDIUM — ✅ FIXED
**What's wrong:** `pageFolders` (`:2287`) printed `f.topics.length` raw, while `pageFolder` (`:2303`) resolves each
id through `topById` and drops the misses. So the grid said "5 topics" and the folder opened showing 3.
**Root cause:** folder membership is stored as bare topic ids that are never reconciled. Ids go stale two ways:
(a) a lecture is deleted server-side — `content-loader.applyContent` upserts but never removes, so the topic
survives in memory until a reload and then vanishes; (b) **the level switcher** — `DATA` (and therefore
`DATA.folders`) is per level profile, but a folder created before a switch keeps ids from the other profile's
content, none of which resolve.
Secondary: `pageFolders` used `f.topics.length` where every other folder function guards `(f.topics||[])`, so a
folder object without the array threw and blanked the page.
**Fix applied (`:2287-2288`):** the grid counts resolvable topics (`.map(topById).filter(Boolean).length`) and
guards the array, so the card and the page it opens now agree.

## 🟡 LIB-06 — The Lecturers page rendered a heading and nothing else — LOW — ✅ FIXED
**What's wrong:** `pageLecturers` (`:2365`) filters out `name!=='To be confirmed'` and `return`s early per subject
when nothing is left, so with no named lecturers it returned only `<h1>Lecturers</h1>` plus a subtitle promising
"Every lecturer and the topics assigned to them" — over a blank page.
**Root cause:** no empty state. `content-loader.recomputeStats` (`content-loader.js:33`) files every import whose
lecturer field was left blank under the literal `"To be confirmed"`, and the import sheet does not require the
field — so this is the **default** state for a student who skipped it, not an edge case. The nav row is also
badge-less in that state (`DB.stats.lecturers` is 0), so the page looks broken rather than empty.
**Fix applied (`:2367`, `:2371`, `:2383`):** track how many lecturer cards were rendered; if none, show an empty state
that names the cause and points at ＋ Add lecture's lecturer field.

## 🟡 LIB-07 — An empty deck still offered a live "Primer · 0" button into a dead end — LOW — ✅ FIXED
**What's wrong:** `pageCards` rendered both deck buttons unconditionally. Tapping one on a topic with 0 cards in
that deck lands on `pageStudy` (`:4474`), which returns `head + filterBar + "This deck is empty."` — and for the
**primer** deck `filterBar` is `''` (it is built only for `deck==='recall'`, `:4479`), so the screen is a crumb
trail and one grey sentence with no action at all.
**Fix applied (`:4093-4094`):** the button is `disabled` (the app already styles `.btn:disabled` at `:125`) with a
title explaining why, so the count is still visible but the dead end is unreachable.

## 🟠 LIB-08 — "✎ Note builder" ships the developer's own workflow to students — MEDIUM (product) — ⚠️ PROPOSED, NOT FIXED
**What's wrong:** `pageBuilder` (`:2231`) is a nav item in the student Library. Its four steps are:
*"Open **Cowork on your laptop** and send photos…"*, *"MedBank builds the topic"*, *"It is filed automatically"*,
and *"**Commit and push in GitHub Desktop.** About a minute later your phone has it."* — followed by a copy block
of the prompt to paste into Cowork.
**Root cause:** the page predates the in-app importer and was never retired. The real student path is the
`＋ Add lecture` sheet (`import-tab.js`), which is two rows above it in the same nav.
**Why it matters:** a student who taps the one nav item literally called "Note builder" is told the way to build a
note is to install GitHub Desktop and push a commit. The same stale instructions are duplicated in `pageTopic`'s
not-built empty state (`:2409`: *"Send MedBank the slides… `Build MedBank topic N (SUBJ) - Name`"*).
**Not fixed because** it is a copy decision, and the human may still use this page as their own build checklist —
same call as HOME-11. **Proposed:** either replace the body with "Tap ＋ Add lecture" + what each source type does,
or drop the nav item and keep the page at `#/builder` unlinked.

## 🟡 LIB-09 — Folders are the one store `mergeState` does not merge — MEDIUM — ⚠️ PROPOSED, NOT FIXED
**What's wrong:** `sync.js mergeState` (`sync.js:142`) starts from `Object.assign({}, remoteD, localD)`, then
explicitly unions `cards`, `starred`, `log`, `study`, `streak`, `topics/done/read/notes/missLog/dayTopics/exams/
pos/flags/cardEdits/cardFlags`, `viz`/`cardViz` and `qbank`. **`folders` is not in any of those lists**, so it
falls through the initial assign and the local array wins wholesale.
**Why it matters:** a two-sided merge (the normal case when a student uses phone + laptop) silently discards every
folder created on the other device — not merged, not conflicted, just gone. The same comment block at `sync.js:126`
explains exactly why this was fixed for `_events`; folders were missed.
**Not fixed because** `mergeState` is core sync and this is flow 17's territory. **Proposed:** union by `id`,
preferring local on conflict, e.g. `out.folders = unionById(localD.folders, remoteD.folders)` with membership
`f.topics` unioned too — a deleted-on-one-device folder will resurrect, which is the standard trade-off everywhere
else in this merge.

## 🟡 LIB-NOTES — smaller observations, not fixed
- **`regenCard` is a silent no-op outside a live session** (`:1354-1357`). It resolves the card from `S.items`
  and `return`s with no toast and no button change if `S` is null. Reachable today only from `cardActionsRow`
  inside a session, so it works — but the failure mode is invisible rather than explained.
- **Duplicate folder names are allowed** (`createFolderWith`, `:2257`), and `addToFolderPrompt` (`:2265`) is a
  numbered `prompt()` listing them by name — two "Exam block 1"s are indistinguishable in the picker.
- **`renameFolder` silently keeps the old name on whitespace** (`:2263`, `n.trim()||f.name`) — deliberate, but the
  student gets no "that name is empty" feedback and assumes the rename failed.
- **Folder ids are `'f'+Date.now().toString(36)`** (`:2259`) — unique per device, but two devices creating a folder
  in the same millisecond collide, which LIB-09's proposed union-by-id would then merge into one.
- **`recomputeStats` normalises lecturer ids to `lec_<subject>_<slug>`** (`content-loader.js:35`), so "Dr. A" and
  "Dr A" become one lecturer card, while `s.lecturerCount` (`:41`) counts **raw** trimmed names — a subject can
  report "2 lecturers" on the subject page and show one card on the Lecturers page.
- **`content-loader.applyContent` never removes** courses or topics deleted server-side (`content-loader.js:53-85`
  is upsert-only), so a deleted lecture stays in Cards / Lecturers / Folders / Search for the rest of the session.
- **`pageCards` says "N cards across M built topics"** (`:4087`) using `s.cardCount`, which `recomputeStats` sums
  over **all** topics including not-built ones — equal today only because unbuilt topics carry no cards.
- **Naming is inconsistent:** the nav row is "Cards", the page is "Anki Cards" (`:4079`, `:4080`, and the crumb at
  `:4484`), and nothing in the app exports to or imports from Anki.
- **`pageCards(bad-id)` renders the subject picker while the URL stays `#/cards/bad-id`** (`:4077`), so the crumb
  trail and the back button disagree with what is on screen — same shape as the TOP-NOTES entry for `pageTopic`.
- **`LIBVIEW` is a module-level global synced to `localStorage`** (`:2251`) but read by `rowsCls()` at render time
  only; the toggle button is absent from `pageCards` and `pageStudy`, so the Cards tab is the one library surface
  where the grid/list preference has no effect and no control.

---

# Flow 15 — Progress + This week (weekly report, new-card scheduling) — `app.html`
Reviewed: `pageWeek` (`:5135`), `weekStats` (`:1857`), `weekDayStrs`/`weekProgress`/`pageJumpback` (`:5086-5132`),
`pagePlan` + `planAdd`/`planRemove`/`planTop`/`unseenCount` (`:6001-6023`), `planNew`/`planCount` (`:1634`),
`effectiveNewCap`/`adaptNewCap`/`reviewLoadRatio` (`:1295-1312`), `logDaily`/`newDoneToday`/`streakMet` (`:1251-1261`).

## 🔴 PRG-01 — The daily streak is mathematically unreachable on the shipping defaults — HIGH — proposed, needs review
`streakMet()` (`:1257`) requires `newDoneToday() >= STREAK_NEW`, and `STREAK_NEW = 20` (`:1125`). New cards can only
ever come from `planNew()`, whose last line is `return out.slice(0, effectiveNewCap() - newDoneToday())` (`:1650`).
`effectiveNewCap()` (`:1300`) is `min(newPerDay, newCap)` and **`newCap` starts at 12** (`:1305`). So on day one the
app will not hand a student more than **12** new cards, while the streak demands **20**. The dashboard chip renders
"🔥 Keep streak: new 0/20" (`:2157`) next to a plan that cannot produce 20, the freeze economy and the
"✓ Day's target met" celebration (`:4888`) hang off the same test, and REV-07's newly-honest banner will now
correctly say "finish today's target to keep it" every single day, forever.

It gets worse in the two situations where a student cares most:
- `adaptNewCap` (`:1302`) sets `cap = 0` outright when `reviewLoadRatio() > 1.2` — a student with a review backlog
  is served **zero** new cards, so the streak is impossible *and* the plan page produces nothing (see PRG-03).
- `if(examSoon(14)) cap = Math.min(cap,5)` (`:1309`) — for the fortnight before an exam the ceiling is **5**. The
  streak is guaranteed to break during revision season, which is exactly when the motivation mechanic is meant to bite.

The cap only climbs `+2` per fully-caught-up day (`:1307`, ceiling 20), so the *best* case is a student who reviews
perfectly for ~4 days and then must answer **every single** new card the app offers, with zero slack, to hold a streak.
**Not fixed** — this is the streak/entitlement engine (flow 18) and the pilot is live on it. **Proposed:** make the
target track what the app is actually willing to serve, e.g.
`const need = Math.max(1, Math.min(STREAK_NEW, effectiveNewCap()));  return newDoneToday() >= need && revOk;`
and print `need` in the chip at `:2157` instead of the constant. Decide together with PRG-03 and REV-06.

## 🟠 PRG-02 — New cards learned from a topic page were logged as *reviews* — MEDIUM — FIXED
`logDaily(isNew, subId)` (`:1251`) is the only writer of `DATA.log[d].new[subject]`, and both rating paths called it as
`logDaily(!!it.isNew, …)` (`:4877`, `:4987`). **`isNew` is only ever set by `planNew()`** (`:1646`) and the two pools
that copy it through (`startToday` `:4126`, `startSession('quick')` `:4133`). Every other pool omits it:
`startDeck` (`:4101`, the topic page's "Recall · N" button — the single most-used study entry point),
`startSession('weak'|'cram'|'clinical')` (`:4134-4140`), and `pageCram`. A card answered for the very first time from
any of those was therefore booked as a **review**: `L.rev++` instead of `L.new[subject]++`.

Consequences, all of them silent:
- `newDoneToday()` (`:1255`) stays at 0, so `streakMet()` can never pass for a student who studies from topic pages —
  they can do 200 first-time cards and still read "new 0/20". (Compounds PRG-01.)
- The Home per-course bars (`:2148`) read "0 / 30" all day while the student is visibly learning.
- `L.rev` inflates, so `reviewTotals()` (`:1256`) reports a *better* review-completion ratio than reality — the same
  number `adaptNewCap` does not use but `streakMet` does.
- `planNew`'s per-course budget `doneToday[sb.id]` (`:1635`) is never charged, so those cards do not count against the
  daily cap: a student can learn 40 new cards in a deck and still be served a full extra allowance of new cards.
**Fix applied** (`:4877`, `:4987`): both sites now pass `!!it.isNew || (_pt==='new' && it.deck!=='primer')`. `_pt` is
`cardTimeState(it.id,false)` which is already computed one line *above* `rateSRS` for the timing median (`:4873`,
`:4983`) and returns `'new'` exactly when the card had no SRS state a moment ago — so no new state read was needed and
there is no ordering hazard. Primer is excluded deliberately: `planNew` is recall-only, so counting primer read-through
against the per-course new budget would starve the recall queue.

## 🟠 PRG-03 — The adaptive cap can silently zero out the whole weekly plan, and nothing anywhere says so — MEDIUM — logged only
`adaptNewCap` (`:1302`) drops the cap to **0** whenever `reviewLoadRatio() > 1.2`. That is a deliberate and defensible
policy ("new cards are a privilege earned by keeping reviews under control", `:1294`) — but it is completely invisible:
- `pagePlan` still promises "**30 new per course a day**" (`:6007`) over a list of topics chipped "● active".
- The Home bars still render "0 / 30" per course (`:2148`) with no explanation for why they never move.
- The Active Recall breakdown simply has no "New cards" row, indistinguishable from having finished them.
The student's reasonable read is "the plan is broken" or "my import didn't work". There is also no way to override it —
see PRG-09, the manual arm of `effectiveNewCap` has no UI.
**Also:** `adaptNewCap()` is called exactly once, at load (`:6300`), guarded by `d.newCapDay===today`. An installed PWA
left open across midnight keeps yesterday's cap while `newDoneToday()` resets — so the first session of a new day runs
on a stale cap until a hard reload. Cheap: call it from `render()` (it self-guards) or on `visibilitychange`.
**Proposed:** when `effectiveNewCap()===0`, replace the plan-page promise line and the Home new-card bars with the real
reason ("New cards are paused until your reviews are back under control — N due today"), and add a "learn new cards
anyway" escape hatch. Not applied: this is new copy plus a UI branch on two screens, not a localized guard.

## 🟡 PRG-04 — A topic whose remaining cards are all reported-wrong sits "active" forever and blocks the queue — LOW — FIXED
`unseenCount(t)` (`:6002`) counted `!DATA.cards[id]` only. `planNew`'s pool (`:1641`) counts
`!DATA.cards[id] && !isFlagged(id)` — cards the student reported wrong are hidden from study (REV-04). The two
therefore disagreed: a topic with 3 remaining, all flagged, showed **"● active · 3 new left"** on the plan page and
contributed **zero** cards, while permanently occupying one of the five active slots per course (`:6012`) so the next
topic in the plan could never become active. The student sees a plan that is working and a new-card queue that is empty.
**Fix applied:** `unseenCount` now applies the same `isFlagged` filter, so the chip, the "N new left" count and
`planNew`'s pool are one definition. Second (correct) effect: `topicPct` (`:1991`) is derived from `unseenCount`, so a
topic with flagged cards can now reach 100% instead of being pinned below it forever.

## 🟡 PRG-05 — Two different definitions of "this week" on two screens — LOW — FIXED
`weekStats().days` (`:1858`) is a **rolling last-7-days** window (`i=6…0`), but `pageWeek` rendered it under
`<h2>This week</h2>` (`:5149`) — so on a Wednesday the grid runs Thu→Wed and the day-letter strip reads
`T F S S M T W`, which looks like a rendering fault. Meanwhile `weekDayStrs()` (`:5086`) — used by `weekProgress()` and
the "This week so far" card on Jump back in (`:5124`) — is the **calendar** week, Sunday→today. The same phrase means
two different windows, and the two cards will disagree on any day except Saturday.
**Fix applied:** the heading is now "Last 7 days", matching the page's own subtitle "Your last 7 days." (`:5140`). The
calendar-week card on Jump back in is left as-is; if the product wants one definition, `weekStats` should adopt
`weekDayStrs()` and pad the grid to 7 cells — that changes every number on the Progress page, so it is a human call.

## 🟡 PRG-06 — "This week's topics" rendered a promise and a blank page — LOW — FIXED
`pagePlan` (`:6006`) builds its body from `DB.subjects.filter(sb=>sb.readyCount>0)`. For an account with no built
topics — a new student, or one whose only import is still processing — that loop produces nothing, so the page was the
header paragraph ("Choose where your daily new cards come from…", explaining a mechanism with no visible controls)
followed by empty space. Same shape as LIB-06, which was fixed.
**Fix applied:** an empty state with the reason ("No built topics yet") and an `＋ Add a lecture` button wired to
`MB_openImport`, matching the pattern used by `pageStatusList` (`:6047`) and `pageLecturers`.

## 🟡 PRG-07 — The Progress page cannot see Mega Q-bank, mock exams, written tests or Visualize quizzes — MEDIUM — logged only
`DATA.log` is written by exactly three functions — `logRate` (`:1247`), `logDaily` (`:1251`) and `recordAnswerMs`
(`:1292`) — and `logRate`/`logDaily` have exactly **two** call sites, both inside the flashcard rating path
(`:4877`, `:4987`). Nothing in the Mega Q-bank, the mock exam (already logged as MX-11), the written tests or the
Visualize quizzes touches it. So a student who spends a week doing 300 Mega Q-bank questions and two mock papers opens
Progress and reads **"0 cards reviewed · 0% accuracy · 0/7 days active · 0 per day"**, the heat-map is empty, and the
streak is broken — the app's own report says they did not study. This is the most demoralising possible failure of a
progress screen and it is silent.
**Not fixed** — the honest fix is a second counter (`L.q` / `L.qcorrect`) written by the q-bank and exam grade paths
plus new rows on the Progress page, because folding q-bank questions into `cards`/`correct` would silently redefine
"accuracy" and pollute `streakMet`'s review ratio. Sizeable and cross-flow; hand it to flow 18 with MX-11.

## 🟡 PRG-08 — "Finished topics drop off" — they do not — LOW — logged only
`pagePlan`'s header states "Finished topics drop off; unfinished ones stay for next week" (`:6007`). Nothing removes
them: `planRemove` (`:6005`) is only ever called from the ✕ button. A finished topic keeps its row (chipped
"✓ finished"), and — because `planCount()` (`:1652`) filters only on `t && t.ready` — it keeps counting toward the
**nav badge** "🗓 This week · N" (`:1907`) and the Home CTA "🗓 This week's topics · N" (`:4656`). After a month the
badge reads 20 while there are three topics actually feeding new cards. Two candidate fixes, both product calls:
auto-drop on `unseenCount(t)===0`, or make `planCount` count only topics with cards left. Not applied — the badge is a
number students act on and either choice changes it.

## 🟡 PRG-NOTES — smaller observations, not fixed
- **`newPerDay` has no UI** (`:1300`). It is in `DEFAULTS` (`:1124`) and read by `effectiveNewCap`, and that is the
  whole story — no Settings control writes it. The "manual" arm is a dead constant 20, so `effectiveNewCap()` is
  always just the adaptive `newCap`, and a student has no way to ask for more new cards. Same for `courseGoal`
  (`:1124`, migrated 20→30 at `:1157`), which the plan page quotes at students as if they had chosen it.
- **The per-course goal is unreachable by construction.** `courseGoal` is **30** but `effectiveNewCap()` tops out at
  **20** and starts at 12 — with two courses, the Home bars total 60 while the global ceiling is 12. Even ignoring
  REV-06's ordering bug, no student can ever fill one bar, let alone both. The plan-page sentence "30 new per course a
  day" (`:6007`) has never been true. See REV-06 for the ordering half of this.
- **Dead `||20` fallbacks.** `planNew` (`:1635`), `pagePlan` (`:6007`) and the Home bars (`:2147`) all read
  `DATA.daily.courseGoal||20` while `DEFAULTS` and the migration guarantee 30 — three copies of a stale default that
  will be wrong if anyone ever changes it in one place.
- **`weekStats().perDay` always divides by 7** (`:1869`), so a student two days into using the app who has done 60
  cards is shown "9 per day avg" directly beside "2/7 days active". `cards / Math.max(1, active)` labelled "per active
  day" is the more useful number, but which one is right is a product call.
- **`pageWeek` has no empty state** (`:5135`). A brand-new account gets six zeroes and "No weak spots right now —
  nothing is sitting in relearning", which is technically true and reads as broken.
- **`weekProgress()` computes `notStarted` and nobody uses it** (`:5093`); `pageJumpback` renders only `complete`,
  `inprog` and `touched` (`:5122-5124`). It walks all of `allTopics` calling `status()` for a value that is discarded.
- **`pageWeek`'s CTA says "Go to today's plan →" and navigates to `#/today`** (`:5157`), the Active Recall page —
  while the thing actually called a plan ("🗓 This week's topics") lives at `#/plan`. The Progress page is the one
  screen with no route to the plan it reports on.
- **`DATA.plan` is never pruned.** `planAdd` (`:6003`) pushes raw ids and nothing removes ids whose topic has vanished
  (deleted server-side, or belonging to another level — the level switcher, cf. LIB-05). `pagePlan`/`planCount`/
  `planNew` all filter with `topById`, so it is invisible rather than harmful, but the array grows without bound and
  syncs to every device.
- **`weekStats().completed` counts raw `DATA.done` keys** (`:1862`) with no `topById` check, unlike every other
  surface. `deleteTopic` clears the entry (`:1395`) but `content-loader.applyContent` is upsert-only (LIB-NOTES), so a
  lecture removed server-side keeps inflating "topics completed" until the entry ages past the 7-day window.
- **`planNew`'s `guard++<2000`** (`:1644`) silently truncates rather than erroring, and `planTop`/`planAdd`/
  `planRemove` each call a full `render()` (`:6003-6005`), so re-ordering a ten-topic plan repaints the page ten times.

---

# Flow 16 — Settings: backup/restore, reminders, TTS — `app.html` (+ `sw.js`, `sync.js` read-only)
Reviewed: `pageSettings` (`:5391`) and all five tabs; `exportData`/`importData` (`:5218-5236`);
the File System Access auto-backup block `idbSet`/`idbGet`/`writeBackup`/`scheduleBackup`/`enableAutoBackup`/
`initAutoBackup` (`:5237-5290`); `shareBackup`/`copyBackup`/`restoreFromText`/`backupRel` (`:5292-5319`);
Reset (`:5529`); reminders — `setRemindMins`/`setQuiet`/`testNudge`/`enableReminders`/`disableReminders`
(`:5215-5375`), `nudgeTick` (`:4391`), `habitNudge`/`nudgeItems` (`:4258-4338`), `setupReminder`/`swPing` (`:6299`),
and the `sw.js` side (`periodicsync` `:75`, `maybeRemind` `:88`, message channel `:105`);
TTS — `ttsOn`/`loadVoices`/`pickVoice`/`topVoices`/`tuneUtter` (`:1441-1460`, `:5688`), `setTts`/`setTtsVoice`/
`setCloudVoiceOn`/`setCloudVoice`/`testCloudVoice` (`:5212`, `:5669-5686`), `voiceSpeak`/`serverSpeak`/`cloudSpeak`
(`:1498-1560`). Cross-read `sync.js` only to trace what happens to a restored/reset state on the next load.

## 🔴 SET-01 — "Reset all progress" is a silent no-op for every signed-in student — HIGH — partly fixed, real fix proposed
**What's wrong:** Settings → Data → Reset promised "Cannot be undone" and did
`localStorage.removeItem('medbank_v1'); location.reload()`. For a signed-in student that reload immediately hands
control to `sync.js init`, which finds `medbank_sync_meta` still present (`m.rev` set → `firstOnDevice` false) and
`m.dirty` false, so it takes the adopt branch (`sync.js:257-276`) and re-applies the **cloud** state over the empty
local one. Every card, streak day and note comes straight back. Clearing the meta doesn't help either — that makes
`firstOnDevice` true, which runs `mergeState(DATA, remote.state)` (`sync.js:254`) and restores the same data by a
different route. There is no local-only path that can win.
**Root cause:** the reset is a localStorage delete only; the account copy in `profile_state` is never touched, and
`sync.js` is specifically hardened (correctly, per BUG-02) to never let an empty local state win.
**Why it matters:** the one destructive control in the app does nothing, silently. A student trying to clear a
messed-up account, or hand a device on, believes their data is gone when it is not — and the button that says
"Cannot be undone" is the single most misleading string in Settings.
**Applied (safe, `:5321` `mbResetAll()`):** the reset now runs through a named function that detects a live
`MB_SYNC.currentProfileId()` and tells the student the truth in the confirm dialog ("you are signed in, so your
progress is also saved to your account and will sync back down after the reload — sign out first…"), and the
`setrow` copy at `:5529` no longer claims "Cannot be undone". Behaviour is otherwise unchanged.
**Proposed — needs review:** a real reset must delete the row server-side (`profile_state` for the active
`level_profile_id`) and only then clear local + meta, i.e. a new `MB_SYNC.wipeProfile()`. That is a destructive
network op behind a typed confirmation and is out of scope for a conservative pass. Deliberately NOT done:
clearing `medbank_content_*` alongside it, which would strand an offline student without their lecture content.

## 🔴 SET-02 — Restoring a backup is silently discarded (or half-merged) on a signed-in account — HIGH — proposed, needs review
**What's wrong:** both restore paths — `importData` (`:5224`) and `restoreFromText` (`:5308`) — do exactly
`localStorage.setItem(SKEY, restored); location.reload()`, after telling the student "This **REPLACES** all current
progress on this device." On the reload `sync.js` sees a non-dirty meta and a non-empty cloud, and takes the adopt
branch: the restored blob is thrown away wholesale (only `viz`/`cardViz`/`qbank` are unioned back, `sync.js:268-269`).
If the meta happened to be dirty it instead merges — and `pickCard` (`sync.js:30`) resolves each card by the greater
`seen`, so an **older** backup loses every card it disagrees about.
**Why it matters:** this is the actual disaster-recovery path. "I studied on my phone, my streak broke, restore
yesterday's backup" cannot work while signed in; the student sees the confirm, the reload, and then the same broken
state, with no error to explain it. It also makes the whole "Move to another browser or phone" section unreliable
for anyone who signs in on the new device before pasting.
**Root cause:** the restore writes state but never claims authority over it — it doesn't set `medbank_sync_meta`
dirty, doesn't bump `rev`, and doesn't flush a push before sync can pull.
**Proposed fix (NOT applied — touches the sync contract):** after writing the restored blob, set
`medbank_sync_meta` to `{rev: <current>, dirty: true, profileId: <current>}` and have `sync.init` treat a
restore-marked state as authoritative (adopt-local + push) rather than merging. Needs the same care as BUG-01/02 and
should be reviewed together with flow 17.

## 🟠 SET-03 — Turning reminders OFF doesn't stop background reminders — MEDIUM — FIXED (app side), sw.js half proposed
**What's wrong:** `disableReminders` (`:5367`) only set `remindOn=false` and re-rendered. It never unregistered the
`periodicSync` tag that `setupReminder` (`:6301`) registered, and never cleared the payload staged in the SW's cache.
`sw.js maybeRemind` (`:88`) checks **neither** `remindOn` **nor** quiet hours — it replays `payloadBody` verbatim, and
if that's empty it falls through to a `hardCount` fallback notification anyway (`sw.js:97-101`). So a student who
turned reminders off kept getting nudged, at any hour, from a worker with no off switch in the UI.
**Fix applied (`:5367`):** `disableReminders` now also `await reg.periodicSync.unregister('medbank-nudge')` and
blanks the staged payload, both inside try/catch so a browser without periodicSync is unaffected.
**Still open — proposed:** `maybeRemind` should honour quiet hours itself (the page-side `nudgeTick` does; the SW
path does not, so a background nudge can fire at 03:00 regardless of the student's Active hours). That needs a
quiet-window flag written through `swPing` and read in `sw.js` — a two-file change, logged rather than applied.
Also noted: `forceUpdate()` (`:6251`) deletes **all** caches, which wipes the SW's flag store (payload, strict,
hardCount) since `writeFlag` lives in the same cache — after any "Check for updates" the next background nudge is
the generic fallback string.

## 🟠 SET-04 — "Turn on" reminders reports success after a denied permission prompt — MEDIUM — FIXED
**What's wrong:** `enableReminders` set `DATA.settings.remindOn=true` and persisted it **before** calling
`Notification.requestPermission()`, and never reverted it if the answer was `denied`/`default`. The settings row then
switched to a "Turn off" button and unfolded the whole reminders panel — interval, active hours, strict mode, "Send
test" — while `nudgeTick` (`:4391`) bailed at its `Notification.permission!=='granted'` check on every single tick.
The student configures a feature that is structurally incapable of firing, and the only hint is that the description
text stays on the OFF copy (`:5426` reads `s.remindOn && perm==='granted'`) beside a button that says Turn off.
**Fix applied (`:5350`):** the permission is requested first; `remindOn` is only set on `granted`; a denial resets it
to false, re-renders, and explains that notifications are blocked for the site and how to unblock. A browser with no
`Notification` at all now gets an explanatory alert instead of a phantom "on" state.

## 🟠 SET-05 — An overnight "Active hours" window silently disables every reminder — MEDIUM — FIXED
**What's wrong:** `nudgeTick` gated on `hr < (s.quietStart||7) || hr >= (s.quietEnd||22)`. The UI (`:5436`) offers two
free 0-23 number inputs labelled "Active hours … No nudges outside this window", which openly invites a night-shift
student to enter **22 to 7** — and for a wrapping window that expression is TRUE for all 24 hours, so every nudge is
suppressed forever with no feedback anywhere. The same line also mis-read a legitimate `0`: `s.quietStart||7` turns a
midnight start into 07:00.
**Fix applied (`:4391`):** the window is now evaluated with wrap-around (`qs<qe ? in-range : hr>=qs||hr<qe`),
`qs===qe` is treated as all-day, and the defaults use `==null` rather than `||` so hour 0 survives.
**Note (not fixed):** `setQuiet` (`:5335`) still accepts start===end and any ordering without a word to the student;
the panel could usefully render the resulting window back ("nudges between 22:00 and 07:00").

## 🟠 SET-06 — "Back up now" gave no feedback and a failed auto-backup kept saying "on" — MEDIUM — FIXED
**What's wrong:** the button called `writeBackup(true)` directly (`:5504`). `writeBackup` (`:5251`) renders nothing
and returns nothing: on success `lastBackup` moves but the "Last saved 2 h ago" line on screen doesn't, and on
failure it just sets `_bakPaused=true` — which only becomes visible the next time something *else* triggers a render.
It also early-returns silently if `_bakBusy` (a debounced write is in flight) or if the handle is gone. Every one of
those outcomes looks identical to the student: tap, nothing happens.
**Fix applied (`:5279` `backupNow()`):** compares `lastBackup` before/after, re-renders, and toasts either
"✓ Backed up just now" or "Backup did not complete — tap Resume and allow MedBank to write to your backup file."
The button now calls it.

## 🟠 SET-07 — Import is a dead button after a cancel (file input never reset) — MEDIUM — FIXED
**What's wrong:** `importData` never cleared `input.value`. Because the label wraps a hidden `<input type=file>` and
the handler is `onchange`, re-picking the **same** file fires no event — so the natural sequence "tap Import → see
the REPLACES-everything confirm → tap Cancel to think about it → tap Import and pick the same file" does nothing at
all, permanently, until the page is reloaded. The same trap follows any parse failure.
**Fix applied (`:5224`):** `input.value=''` after `readAsText` (the `File` handle is already captured).

## 🟠 SET-08 — An unreadable backup file imports as total silence — MEDIUM — FIXED
**What's wrong:** `importData` wired `rd.onload` but no `rd.onerror`. A FileReader failure — an iCloud/OneDrive
placeholder that isn't downloaded, a permissions error, a file removed between picking and reading — produced no
alert, no toast, no console path. Combined with SET-07 the student then couldn't even retry the same file.
**Fix applied (`:5231`):** `rd.onerror` alerts and points at "Restore from text" as the fallback.

## 🟡 SET-09 — The Settings "realistic voice" picker doesn't control the voice any signed-in student hears — MEDIUM — proposed, needs review
**What's wrong:** Settings → AI & Voice presents ✨ Realistic online voice plus eight named Polly chips
(Joanna/Matthew/Amy/…) writing `settings.cloudVoice` (`:5673`). But `voiceSpeak` (`:1545`) — the entry point behind
the 🔊 read-aloud button (`speakCurrent`, `:1570`) and the tutor — calls `serverSpeak` **first**, which posts to
`/tts` with `voice: DATA.settings.ttsVoiceAI || 'nova'` (`:1527`, `:1537`, `:1556`). `cloudSpeak` (and the chosen
Polly voice) is only reached when that server call *fails*. So for any signed-in student — the normal case — the
voice they picked is never used; they always get OpenAI `nova`. And `ttsVoiceAI`, the setting that actually decides,
is absent from the `d.settings` defaults (`:1149`) and has no UI anywhere in the app.
**Why it matters:** this is the third instance of the POD-09 family (basic-tier voice picks ignored). Students are
being given a voice picker that demonstrably does nothing, and each ▶ preview plays a Polly voice they will then
never hear again.
**Proposed (NOT applied):** either point the chips at `ttsVoiceAI` with a Polly→OpenAI voice map, or hide the
cloud-voice block whenever `serverSpeak` is available. Needs a product call on which engine is canonical, so logged.

## 🟡 SET-10 — `copyBackup` puts the entire DATA blob on the clipboard — MEDIUM — proposed, needs review
**What's wrong:** `copyBackup` (`:5298`) `JSON.stringify(DATA)`s everything, including `cardViz` (full Visualize
blueprints, one per saved explainer), `qbank._attempts` (up to 4000 records, `sync.js:113`), `_qmeta`, `_sessions` and
`_events` (up to 1000). On a real account that is comfortably multi-megabyte. `navigator.clipboard.writeText` of that
size is unreliable on iOS Safari — the documented failure is truncation, not rejection — and the
`document.execCommand('copy')` fallback is worse. Both paths then `alert('Backup copied.')` unconditionally.
**Why it matters:** the section header calls this "the most reliable" iPhone path. A truncated paste still fails
`JSON.parse`, so the student sees "Restore failed: Unexpected token …" on the **new** device, with the old device
already claiming success — and no reason to suspect size. Same exposure applies to the exported file.
**Proposed (NOT applied):** strip the derivable caches (`cardViz` blueprints, `qbank._attempts/_qmeta/_sessions`)
from the transfer blob, or refuse and route to Share when `txt.length` exceeds ~1 MB. Changing what a backup
contains is a data-format decision, so logged rather than applied.

## 🟡 SET-11 — Settings claims only one device voice is installed, because the voice list is empty on first paint — LOW — FIXED
**What's wrong:** `topVoices()` (`:5688`) reads `VOICES`, which on Chrome/Android (and often desktop Chrome) is `[]`
until `voiceschanged` fires. The handler was `speechSynthesis.onvoiceschanged = loadVoices` (`:1447`) — it refills the
array but never repaints. A student opening AI & Voice in that window sees a single "Auto (best)" chip plus
"Only your default voice is installed — download an Enhanced voice (steps above) to get more choices", which is false
and sends them into iOS Accessibility settings for no reason.
**Fix applied (`:1447`):** the handler repaints — but **only** when `settingsTab==='ai'` and the route is Settings,
specifically so an async repaint can never wipe a half-pasted backup out of the `#restoretext` textarea on the Data
tab.

## 🟡 SET-12 — Dead reminder settings — LOW — logged only
`setRemindAt` (`:5214`) and `settings.remindAt` have no call site and no UI; `settings.remindEvery` survives only as
the one-time migration into `remindMins` (`:1151`). `setRemindAt` also persists without rendering. Harmless, but
three of the seven reminder keys in `d.settings` are now fiction.

### Notes (no fix)
- **The backup carries `settings.geminiKey`.** `exportData`, `shareBackup` and `copyBackup` all serialise the whole
  `DATA`, so a student's own API key rides along into a file, the share sheet and the system clipboard.
- **Reset leaves everything except `medbank_v1`:** `medbank_sync_meta`, `medbank_presync_backup`, `mb_current_uid`,
  every `medbank_content_*`, `mb_nav`, `mb_libview`, `mb_swipe_used` all survive. Intentional here (see SET-01), but
  it means "Reset all progress" is not a clean-slate button even offline.
- **Backups have no version or profile marker.** Nothing stops a 400-level backup being restored into a 300-level
  profile and then pushed to the cloud; the only validation is `'cards' in d || 'log' in d || 'streak' in d`
  (`:5227`, `:5311`), which a truncated-but-parseable paste can also satisfy.
- **`testNudge` (`:5336`) doesn't check `remindOn`** — it fires whenever permission is granted, so "Send test" works
  on a student who has reminders turned off. It also refuses outright when `nudgeItems` is empty ("study a topic
  first, then star a few cards"), i.e. the one control for checking your notification sound is unavailable to exactly
  the new student who most needs to set it up.
- **`enableReminders` doesn't call `nudgeTick`** after a successful opt-in, so the first nudge waits for the 60 s
  interval; and `setupReminder` (`:6301`) re-registers `periodicSync` with the new interval but the SW's timing is
  best-effort regardless — the "Remind me every N minutes" input is closer to a hint than a setting.
- **`writeBackup` bypasses `persist()`** deliberately (`:5258`) to avoid re-scheduling itself, which also skips
  `MB_SYNC.markDirty()` — correct here (only `lastBackup` changed) but worth knowing if more state is ever written
  from that path.
- **The voice chips are JS-escaped but not attribute-escaped** (`:5481-5482`: `v.name.replace(/'/g,"\\'")` inside a
  double-quoted `onclick`), the HOME-03 pattern. OS voice names with a `"` are unlikely, so LOW.
- **`_bakHandle` is dropped, not revoked, on `disableAutoBackup`** (`:5274`) and `idbSet('bakHandle', null)` leaves a
  null row behind; `initAutoBackup` handles it (`if(h)`), so cosmetic.
- **`pageSettings` reads `Notification.permission` once per render** (`:5393`) — a permission changed in browser
  settings while the page is open is not reflected until something else triggers a render.

---

# Flow 17 — Auth / sync: login, logout, level switcher, cross-account isolation — `sync.js`, `auth-ui.js` (+ `level-switcher.js`, `paywall.js` read-only)

Reviewed 2026-08-22. `level-switcher.js` is not named on the checklist line but *is* the level switcher, so it was
reviewed and fixed as part of this flow. `app.html` was **not** touched in this run.

## 🔴 AUTH-01 — A failed cloud read is treated as "no cloud state", and the device then OVERWRITES the account's real progress — HIGH — ✅ FIXED
**What's wrong:** `pull()` (`sync.js:180`) did `var r = await sb.from("profile_state").select(...).maybeSingle(); return r.data || null;`
— it never looked at `r.error`. `maybeSingle()` returns `{data:null, error:null}` for a genuine 0 rows but
`{data:null, error:{...}}` for an RLS failure, a 5xx, a dropped connection or a >1-row result. Both collapse to `null`.
`init` then takes `if(!remote){ await pushNow(); }` (`:267`) — **the first branch, the one that means "this profile has
never been synced" — and uploads this device's whole `DATA` blob as the account's cloud state.**
**Why this matters:** on a *fresh* device `DATA` is empty, so one transient read failure at page load replaces the
student's entire cloud copy (cards, streak, log, notes, q-bank attempts) with `{}`, at `rev = m.rev+1`, with no
warning and nothing to roll back to (`medbank_presync_backup` only ever holds this device's own first snapshot).
This is the same failure shape as FIXED-01, where a widened admin policy made an unfiltered `maybeSingle()` error on
every device — that incident aborted sync; with this path it would have *destroyed* it.
**Root cause:** `sync.js:180-183` — no `.error` check on the only read that decides "first upload" vs "merge/adopt".
**Fix applied:** `pull()` now throws on `r.error`. `init`'s outer catch swallows it, so sync stays inert
(`ready` stays false → `schedulePush` is a no-op → nothing is pushed), the meta is untouched, and the next page load
retries cleanly. Failing closed is always correct here: the cloud copy is never rewritten from an unverified read.
Pairs with AUTH-04, which makes that inert state visible to the student instead of silent.

## 🔴 AUTH-02 — Switching level merges the PREVIOUS level's progress into the new one, permanently and in the cloud — HIGH — ⚠️ PROPOSED, NOT FIXED
**What's wrong:** the whole promise of the level system is per-level separation ("Levels below stay view-only",
`auth-ui.js:122`). It does not hold after the first switch.
`switchProfile` (`sync.js:319`) and `goToNextLevel` (`:347`) both finish with
`setMeta({ rev:0, pushedAt:0, dirty:false, profileId:newId })` and a `location.reload()`. **They never clear
`localStorage['medbank_v1']`.** So on the reload:
1. `DATA` is loaded from disk — still the **old level's** cards, log, streak, topics, notes, exams, q-bank attempts.
2. `init` computes `firstOnDevice = !m.rev` (`:265`) → `rev` was just set to `0` → **true**.
3. That is the "first login on a device with existing progress ALWAYS merges, never blind-adopts" branch (`:268`):
   `applyState(mergeState(DATA, remote.state||{}))` followed by `pushNow()`.
So 300-level cards, the 300-level streak and the 300-level day log are merged into the 400-level profile **and pushed
up to its `profile_state` row**. Switch back and the same thing happens in reverse; after one round trip both cloud
profiles hold the union of both levels, and nothing in the app can separate them again.
**The content side does the same thing:** `content-loader.js` repaints from `medbank_content_<pid>` via
`hydrateFromCache()` at script load (`:160`), reading `medbank_content_pid` — which still names the **old** profile
until `loadProfileContent()` finishes a round trip. And `applyContent` is upsert-only (already noted in LIB-NOTES),
so the old level's topics are never removed from the library even after the new profile's content arrives.
**Root cause:** `sync.js:319-345` and `:347-372` treat a profile switch as "reset the revision counter", but `rev:0`
is indistinguishable from a first-ever sync, which is defined to merge.
**Fix (proposed — do NOT apply blind):** the switch must hand the reload an *empty* local state, e.g. clear
`medbank_v1` + `medbank_content_pid` + `medbank_content_*` inside `switchProfile`/`goToNextLevel` **after** the flush
`pushNow()` has demonstrably succeeded. The danger is the offline case: if the post-reload `pull()` then fails
(and after AUTH-01 it now fails loudly), the student sits on an empty app until they reconnect, and the first
`persist()` writes that empty `DATA` back to `medbank_v1`. A safer shape is probably a meta marker
(`{ switched:true }`) that makes `init` require a successful pull before it adopts, and refuse to merge across
profile ids. Needs a human decision — this is the one place where "never lose local data" and "never mix levels"
genuinely conflict.
**Also blocked on this:** `medbank_presync_backup` is written once, ever (`:259`), so it is the *first* profile's
snapshot forever and is no use as a rollback for a level switch.

## 🔴 AUTH-03 — Logging out re-opens BUG-01: the next student's account absorbs the previous student's data — HIGH — ⚠️ PROPOSED, NOT FIXED
**What's wrong:** BUG-01's fix keys account isolation off `localStorage['mb_current_uid']`: on login, if the stored
uid differs from the new one, purge and reload (`sync.js:226-241`). A first-ever login (no stored uid) is
deliberately **not** purged, so "studied logged-out, then signed up" still merges.
The `onAuthStateChange` handler added for AUTH-ISO-01 ends with (`auth-ui.js:432`):
`if(ev==="SIGNED_OUT" && prev){ localStorage.removeItem("mb_current_uid"); location.reload(); return; }`
**Deleting that key puts the device back into the "first-ever login" state.** So the sequence
**A logs out → B logs in on the same device** finds `prevUid === null`, skips the purge, and hands B the entirety of
A's `medbank_v1`. `init` then takes the `firstOnDevice` merge branch and `pushNow()`s the result — A's cards, notes,
streak and day log are written into **B's cloud profile**, and follow B to every device they ever sign in on.
This is strictly worse than the original BUG-01, which was an on-screen leak; this one is permanent contamination of
a second account, and it is triggered by the most ordinary shared-device flow there is.
**Root cause:** `auth-ui.js:432` — the SIGNED_OUT branch clears the guard's only piece of state.
**Why it's cleared (don't just revert it):** Supabase emits `SIGNED_OUT` whenever a refresh token is rejected, not
only on an explicit logout. If `mb_current_uid` survived, that handler's `location.reload()` would fire on every load
of an expired session → **reload loop**. The key is being cleared as the loop guard.
**Fix (proposed, two options):**
(a) keep `mb_current_uid` and move the loop guard elsewhere — e.g. a one-shot `sessionStorage` flag set immediately
before the reload and cleared on the next successful `SIGNED_IN`; or
(b) purge at logout instead (`medbank_v1` + `medbank_content_*` + sync meta + `mb_pending_onboard`), which is ONB-04
— explicitly deferred there because it destroys work done while logged out.
Whichever is chosen, note the residual trade-off: after (a), a student who studies logged-out on a device someone
else used and then signs in *is* purged. That is the correct call on a shared device (the work being discarded is a
different person's), but it should probably be announced rather than silent.
**Status:** LOGGED, not edited — every candidate fix either risks a reload loop or deletes a student's local work.

## 🟠 AUTH-04 — Sync can be permanently inert while the app says "✓ Synced" — MEDIUM/HIGH — ✅ FIXED (honest status; the underlying causes are AUTH-01/07 + ONB-01/02)
**What's wrong:** `schedulePush` — the only thing `persist()` calls (`app.html:1163` → `MB_SYNC.markDirty()`) —
opens with `if(!ready) return;` (`sync.js:200`). `ready` is set at the very end of `init` (`:299`), *after* five
early returns: not configured, no client, no session, **no `accounts` row**, and **`no active profile yet`**
(`:246`) — plus anything the outer `catch` swallows (`:303`).
So a signed-in student whose account has no active `level_profile` — exactly the half-onboarded state ONB-01 creates
on every email-verified sign-up, and the account behind BUG-01/FRICTION-02 — pushes **nothing, ever**, for the whole
life of the install. Meanwhile `showAccount` opened with the fixed subtitle *"You're signed in and syncing."* and a
green *"✓ Sync on"* pill, and the avatar menu printed a green *"✓ Synced"*, both derived from nothing but the
presence of a session. A student can study for weeks, be told their work is backed up on every check, and lose all
of it with the device.
**Root cause:** `sync.js:377` `status()` never exposed `ready`; `auth-ui.js:307` and `:351` inferred "syncing" from
`sb.auth.getSession()`.
**Fix applied:** `status()` now returns `syncing:!!ready` (and `profileId`). `showAccount` renders either the green
"✓ Sync on" pill or a red **"⚠ Not syncing — your progress is saved on this device only"** panel with what to do
next, and the subtitle changes to match; the avatar menu shows "⚠ Not syncing — this device only" instead of
"✓ Synced". No gating logic reads `syncing`, so nothing else changes behaviour.
**Note for flow 18:** `paywall.js` reads the same `status()` object — it is unaffected (it only reads
`canUseFeatures`/`archived`/`entitled`), but see AUTH-08.

## 🟠 AUTH-05 — No write conflict check: a tab left open silently overwrites the other device's work — MEDIUM — ⚠️ PROPOSED, NOT FIXED
**What's wrong:** `pushNow` (`sync.js:190`) upserts the **entire** `DATA` blob with
`{ onConflict:"level_profile_id" }` and a locally-incremented `rev`. Nothing compares that `rev` to the row's
current one, and nothing re-pulls before writing. `rev` is tracked but never enforced — it is decoration.
Merging only ever happens inside `init`, i.e. at page load.
**Scenario (the app's headline use case — "sync across your phone and laptop"):** laptop tab open since morning →
student does an evening session on the phone, which pushes fine → student touches the laptop tab once → the 1500 ms
debounce fires → the laptop uploads its morning-stale snapshot over the top and the evening session is gone. There
is no realtime subscription, no visibility/focus re-pull, and no `pagehide`/`visibilitychange` flush either, so the
stale tab never learns it is stale.
**Fix (proposed):** compare-and-set — `update(...).eq("level_profile_id", pid).eq("rev", m.rev)` (or an RPC) and, on
0 rows affected, re-pull + `mergeState` + retry. Optionally re-pull on `visibilitychange` when the tab regains focus.
Non-trivial; needs a schema/RPC decision.

## 🟠 AUTH-06 — Level-profile writes were unchecked: a silent no-op, or a student locked into a view-only level — MEDIUM — ✅ FIXED
**What's wrong:** neither `switchProfile` (`sync.js:319`) nor `goToNextLevel` (`:347`) looked at `.error` on any of
their writes.
- `switchProfile`: if `accounts.update({active_level_profile_id})` is rejected (RLS, offline, 5xx) the code still ran
  `setMeta({...profileId:newId})` and reloaded. The student taps "300 level", the app reloads, and they are still on
  400 with **no message at all** — while the local meta now names a profile the server never activated, so the next
  `init` takes the "genuine level-profile change" adopt branch (`:274`) against the *old* profile.
- `goToNextLevel`: it archived the current level **first**, then created the next one. If `createProfile` returned
  null (its `maybeSingle()` erroring, an insert rejected — see AUTH-07) the function returned silently, leaving the
  student on an **archived** profile: `canUseFeatures()` is false, so `paywall.js` blocks every import/AI action with
  "This level is view-only… runs on your current level", and there is no current level to go to. Unrecoverable from
  inside the app.
**Fix applied:** added a small `notify()` (alert, matching `auth-ui`'s own `toast`) and:
(1) `switchProfile` checks the update's `.error` and aborts with "Couldn't switch levels just now…" *before* writing
the meta or reloading; (2) `goToNextLevel` now **creates and activates the new level before archiving the old one**,
checks both errors, and treats the archive as best-effort — if the archive fails the student is safely on the new
level and the old one merely keeps its features, instead of being stranded on a dead one. Both catch blocks notify.

## 🟠 AUTH-07 — Unfiltered `maybeSingle()` reads — the exact shape of the FIXED-01 outage — MEDIUM — ✅ FIXED
**What's wrong:** four reads asked for a row belonging to the signed-in student without ever saying which student:
`accounts.select(...).maybeSingle()` (`:248`), `subscriptions.select(...).maybeSingle()` (`:257`),
`level_profiles.select(...)` in `listProfiles` (`:314`) and the "one profile per level" existence check in
`createProfile` (`:334`, filtered on `level` only). They rely entirely on RLS narrowing the result to one row.
**Why this matters:** that assumption has already failed in production. FIXED-01: *"Admin read policy made `accounts`
return every row, so the app's `maybeSingle()` errored and sync aborted on fresh devices (caused today's 'phone
empty')."* `backend/admin-access.sql:6` still carries the warning in a comment. `import-server/server.mjs` filters
every equivalent read (`:86`, `:798`, `:1501` all use `.eq("account_id", account_id)`); the client does not. With
`listProfiles` unfiltered, a widened policy would also list **other accounts' levels** in the switcher.
**Fix applied:** explicit filters everywhere — `accounts` by the session uid (built conditionally so a missing uid
degrades to the old behaviour rather than throwing), `subscriptions` and `listProfiles` by `account.id`, and
`createProfile`'s existence check by `account_id` + `level`. Each can only *narrow* to the correct rows. Also logged
`accounts.error` distinctly from "no account row" so the two stop looking identical in the debug log.

## 🟡 AUTH-08 — "Couldn't read your subscription" is silently rendered as "you haven't paid" — MEDIUM — logged only (flow 18)
**What's wrong:** `entitled` starts `false` (`sync.js:21`) and is only ever set inside the try block at `:254-259`.
Any failure in that block — the `level_profiles` read, the `subscriptions` read, a network blip — leaves it `false`
**and** leaves `curLevel` null, and `canUseFeatures(){ return !!entitled && !curArchived; }` (`:373`) then reports a
paying subscriber as unentitled. `paywall.js:guard` shows them *"Your free trial has ended — Subscribe to keep
using imports and AI"*.
**The inconsistency that makes it a bug rather than a policy:** `paywall.js:35` opens with
`if(!window.MB_SYNC) return true; // logged-out/local mode: don't block`. A completely logged-out student is
**not** blocked, but a paying student whose entitlement read hiccuped **is**. Unknown must not resolve to "no".
**Fix direction:** tri-state — leave `entitled` as `null` until a read succeeds and have `canUseFeatures()` treat
`null` as permissive, matching paywall's own logged-out stance. Behavioural change to gating → hand to flow 18.
**Related, same block:** a `level_profiles` read failure also nulls `curLevel`, which is what AUTH-09 renders.

## 🟡 AUTH-09 — The level switcher shows six 🔒 locked levels and no way out whenever sync didn't initialise — MEDIUM — ✅ FIXED
**What's wrong:** `openLevelSwitcher` (`level-switcher.js:16`) only bails when `MB_SYNC.listProfiles` is missing —
which it never is, since the `MB_SYNC` IIFE always defines it. When `init` bailed early (AUTH-04's five paths) or the
entitlement/level read threw (AUTH-08), `listProfiles()` returns `[]` and `curId`/`curLevel` are null. Every row then
falls through `isCurrent`/`isDone` to the locked branch, and `if(curLevel && curLevel < 600)` hides "Go to next
level". The student taps "🎚 Switch level" from the avatar menu and gets **all six levels padlocked, no current
level, no action and no explanation** — including on their own paid account.
**Fix applied:** when `curLevel`/`curId` are unavailable the sheet now renders a single explanatory panel
("We couldn't load your levels right now… If you've just created your account, finish picking your level and
courses first") instead of six misleading padlocks, and the level rows are skipped entirely.

## 🟡 AUTH-10 — A completed level you switch back to is labelled "current" while every feature is off — LOW/MEDIUM — ✅ FIXED
**What's wrong:** switching back to a finished level is supported and advertised ("✓ view only · tap to open"), and
`switchProfile` makes it `accounts.active_level_profile_id`. It is now both **current** *and* still `archived:true` —
`level-switcher.js:37` printed a plain indigo "current" for it, while `canUseFeatures()` is false so every import/AI
tap is met with the paywall's "This level is view-only… runs on your current level" — advice that points at the level
the student is already on.
**Fix applied:** `isCurrent && archived` now renders "current · view only" on a muted background.
**Still open (product):** there is no "return to my active level" affordance — the only way back is the teal
"Go to next level →" button, whose confirm text ("Move up to 400 level?") is wrong for what is really a return.

## 🟡 AUTH-11 — Root cause of MINOR-02 "Multiple GoTrueClient instances" — LOW/MEDIUM — ✅ FIXED
**What's wrong:** `auth-ui.js client()` caches its client on `window.__mbSB`, and `sync.js init` *sets*
`window.__mbSB` (`:212`) — but it never *read* it: `sb = client || (window.supabase && createClient(...))`
(`sync.js:209`). `app.html:6381` calls `MB_SYNC.init()` with **no argument**, so whenever that fires after
`auth-ui` has built its client, a second GoTrueClient is constructed against the same storage key. That is the
warning logged as MINOR-02 ("fires 3×+ per page… flagged by Supabase as possible undefined behaviour") — two clients
sharing one refresh token can race a refresh and sign the student out.
**Fix applied:** `sb = client || window.__mbSB || (window.supabase && createClient(...))`.

## 🟡 AUTH-12 — The account-switch purge leaves `mb_pending_onboard` behind — LOW/MEDIUM — ✅ FIXED
**What's wrong:** the BUG-01 purge cleared `medbank_v1`, `medbank_sync_meta`, `medbank_presync_backup` and the
content caches, but not `mb_pending_onboard`. Student A signs up and never verifies (payload stashed at
`auth-ui.js:318`); student B signs in on the same device; if B has no profile yet, `afterAuth` (`:268`) reads A's
pending payload and `saveOnboarding` creates **A's level and A's course list** under B's account.
**Fix applied:** added `"mb_pending_onboard"` to the purge list (`sync.js:232`). Only affects the uid-change path,
where clearing it is unambiguously correct.

## 🟢 AUTH-NOTES — smaller observations, not fixed
- **`applyState` can only add and overwrite, never remove** (`sync.js:165-171`): keys present locally but absent from
  the incoming state survive. So "adopt cloud" is not really an adopt, and a store deleted on another device comes
  back. Masked today by the account-switch purge + reload.
- **The adopt branch unions only `viz` and `qbank`** (`:284-287`). Local-only `notes`, `starred`, `exams`,
  `cardEdits`, `flags`, `missLog` are taken wholesale from the cloud and dropped. In practice the `dirty` flag
  protects this (a clean meta means the last push succeeded), but it is one silent-push-failure away from losing a
  student's typed notes, and `pushNow` swallows its error with a `log()` that only prints under `SYNC_DEBUG`.
- **`isEmptyState`** (`:175`) counts only `cards`, `log` and `topics`. A student whose work so far is q-bank
  attempts, notes or mock exams (all invisible to `DATA.log` — see PRG-07 / MX-11) is classified as having no
  progress at all, which is the exact input to the "never adopt an empty cloud over real local data" guard.
- **`init` has no re-entrancy guard and stacks an `online` listener per call** (`:300`). `app.html:6381` calls it on
  DOMContentLoaded and `auth-ui startSync` calls it again after login/onboarding, so a signed-in student who opens
  "Account & sync" gets a second full pull/merge/push cycle running against a live `ready=true` state.
- **Nothing flushes on unload.** The 1500 ms debounce is the only push trigger (plus the `online` listener); there is
  no `pagehide`/`visibilitychange` handler. `app.html:8270` and `:8565` work around this with explicit
  `MB_SYNC.flush()` calls for Visualize ("never let a reload beat the 1500ms debounce"), which the rest of the app
  does not do. Recoverable at the next `init` on the same device — not across devices (AUTH-05).
- **`mergeStreak` treats day 0 as absent** (`:59`, `(b.lastN||-1)`), and `mergeLog` maxes each counter independently,
  so a day studied on two devices reports `max(cards)` and `max(correct)` rather than a real total.
- **"One profile per level" is enforced client-side only** (`createProfile`, `:333`) — a `unique(account_id, level)`
  index is the real guard, and ONB-03 already documents a retry path that creates duplicates.
- **`level-switcher.js` calls `document.body.removeChild(overlay)` at four sites** with no parent check and has no
  Escape handling; a `listProfiles()` rejection propagates out of `openLevelSwitcher` unhandled (the sheet never
  opens and the tap looks dead).
- **Levels below `start_level` are filtered out of the switcher entirely** (`:30`). If `start_level` is ever written
  too high — `saveOnboarding` sets it from the picker on every run, including ONB-03's retry — an existing lower
  profile becomes permanently unreachable from the UI.
- **"Log out" sits directly under "Switch level" in `showAccount` with no confirmation step**, and given ONB-04
  (logout leaves local data) + AUTH-03 (logout disarms the isolation guard), a mis-tap there is more consequential
  than it looks.
- **`updateChip` is the only publisher of `window.MB_USER` / `mb_user_name`** (HOME-01's greeting) and returns early
  when `chip` is null, so an unconfigured build never greets the student by name. Working as designed, worth knowing.

---

# Flow 18 — Streak / freezes + paywall & entitlement gating (`app.html`, `paywall.js`, `sync.js`, `import-server/server.mjs`) — code review, 2026-08-22

Two halves, reviewed together because they are the app's two "promise" systems: the streak promises a rule,
the paywall promises a tier. **Both currently promise something the code does not do.**
Prefixes: `STK-` = streak/freezes · `ENT-` = entitlement/paywall.

## 🔴 STK-01 — The streak has two contradictory rules, and the lenient one always wins — HIGH — proposed, needs review
**What's wrong:** the streak number goes up when a student flips **one card**, while every piece of copy on
screen describes a much harder target — so the counter and the text disagree on essentially every study day.
**Root cause:** there are two paths into `bumpStreak`, and only one of them checks anything.
- `markActive()` (`app.html:1200-1205`) calls `bumpStreak(d)` **unconditionally**. It is called from four
  places in the card flow: `:4861` and `:4933` (the *flip*, before the card is even graded) and `:4880` /
  `:4994` (the rating).
- `logDaily()` (`:1254`) → `maybeBumpStreak()` (`:1261`) → `streakMet()` (`:1257`), which enforces the
  advertised rule: `newDoneToday() >= STREAK_NEW (20)` **and** ≥65% of due reviews.
Because the flip fires first and `bumpStreak` is idempotent per day (`:1214` returns early when `lN===tN`),
`streakMet()` never gets to decide anything. It is a display predicate that believes it is a gate.
**What the student sees, every day:**
- Home chip (`:2085-2086`): "**7-day streak** — study today to keep it alive!" on a day already banked.
- Today page (`:2161-2164`): "🔥 Keep streak: new 0/20 · reviews 40% (need 65%)" printed next to a streak
  counter that just incremented — and PRG-01 already showed that 20 is unreachable anyway, since
  `effectiveNewCap()` is 12, drops to 5 within a fortnight of an exam and to 0 when reviews are backed up.
- Results screen (`:4577`, which REV-07 *fixed* to be honest): "🔥 7-day streak · finish today's target to
  keep it" — after it was kept.
- The evening reminder (`:4315`): `st>=1 && !met && hr>=18` sends "**Your 7-day streak ends at midnight**"
  to a student who studied this morning. The one nudge whose comment promises it will "never guilt-nag"
  is a false alarm nearly every evening.
- `celebrate('floor','✓ Day's target met — streak safe!')` (`:4900`, `:5009`) can never fire.
**Fix (needs a product decision — NOT applied):** pick one rule and make the other follow it.
 (a) *Streak = showed up* — drop `STREAK_NEW`/`streakMet` from the streak copy entirely and let the chip read
     "safe today" as soon as `markActive` has run; keep the 20-new target as a separate daily goal.
 (b) *Streak = hit the target* — remove `bumpStreak(d)` from `markActive` (leave the log + `swPing`), letting
     `maybeBumpStreak` be the only writer, **and** fix PRG-01 first, or the streak becomes unreachable
     instead of automatic.
Not edited: this is the core habit mechanic of a live pilot and (b) can silently break every student's streak.

## 🟠 STK-02 — Freezes are spent on days the student never studies, and never refunded — MEDIUM — proposed, needs review
**What's wrong:** a banked freeze can be consumed by *opening the app*, buying nothing.
**Root cause:** `streakMaintain()` (`app.html:1234-1244`, called on every open at `:6357`) bridges the gap
**eagerly** — it decrements `s.freezes` and advances `s.lastN` to yesterday before knowing whether the student
will study today, and there is no refund path. Walk it through with 2 banked freezes and a last study day of
day 10: open on day 12 without studying → 1 freeze gone, `lastN=11`; open on day 13 without studying → the
second freeze gone, `lastN=12`; day 14 → nothing left and the streak dies anyway. Two freezes bought zero days.
`bumpStreak` (`:1217-1220`) already contains the identical bridging arithmetic applied **at the moment of
study**, where the information is complete, so the eager spend is both redundant and lossy.
**Fix (proposed):** make `streakMaintain` display-only (or delete it) and let `bumpStreak` do the bridging.
`curStreak()` (`:1230`) already keeps the streak alive off *banked* freezes without spending them, so the
displayed number does not change. Not applied: it alters a live pilot's freeze economy.

## 🟠 STK-03 — `DATA.streak.frozen` is write-only — a freeze buys a day nobody can see — MEDIUM — proposed, needs review
**What's wrong:** the day a freeze rescued renders exactly like a day the student skipped.
**Root cause:** `s.frozen` is pushed at `app.html:1218` and `:1240` and initialised at `:1136-1140`, and is
**read nowhere in the codebase** (grep: those five lines and nothing else). `weekStats()` (`:1864-1867`)
builds the 7-day grid purely from `DATA.log[d]`, so both the Progress "This week" grid and Home's "This week
so far" show a plain gap — no ❄, no "streak saved" marker. The only place the student is ever told a freeze
fired is the *notification* at `:4311`, which requires reminders to be on and permission granted (and SET-03/04
show that path has its own problems). The array also grows unbounded and rides along in the synced state blob.
**Fix (proposed):** have `weekStats` return the frozen day-numbers and render a ❄ cell in both grids; cap
`frozen` to the last ~60 entries on load. Two render sites → logged rather than edited.

## 🟢 STK-04 — The evening reminder offers a "tap to use a streak freeze" off-ramp that does not exist — LOW — ✅ FIXED
**What's wrong:** `app.html:4317` sent "2 minutes keeps it alive — **or tap to use a streak freeze**. No
pressure." There is no manual freeze control anywhere in the app: no `useFreeze` function, nothing in Settings,
and the Home 🛡 chip (`:2087`) is a `title` tooltip on a span whose only click handler is the parent's
`go('today')`. Freezes are 100% automatic (`streakMaintain`). The `url` is plain `#/today`, so tapping does
nothing a normal open wouldn't — and the freeze it implies is spent *tomorrow*, not tonight.
**Fix applied:** copy now says the freeze covers the day automatically, which is what the code actually does.

## 🔴 ENT-01 — A successful payment can silently fail to grant Premium, and Paystack is told everything is fine — HIGH — ✅ PARTLY FIXED
**What's wrong:** the student pays, stays Basic, and nothing anywhere records it.
**Root cause:** `import-server/server.mjs` `/paystack/webhook` (`:1491-1506`) had three independent silent
failure modes on the activation path:
1. **`.update()` matching zero rows is a silent success.** `admin.from("subscriptions").update({status:"active"})
   .eq("account_id", …)` only works if a `subscriptions` row already exists. **Nothing in this repo ever
   inserts one** — `subscriptions` appears at `server.mjs:86`, `:798`, `:1501` and `sync.js:254`, which is three
   reads plus this one update, and `backend/supabase-setup.sql` does not define the table at all.
   ⚠️ **CHECK THE SCHEMA for a signup trigger that inserts a `subscriptions` row.** If there isn't one, no
   first-time payment has ever activated a single account.
2. **The email lookup was case- and whitespace-sensitive.** `.eq("email", email)` against whatever Paystack's
   customer record holds, while `isPremium` lowercases and trims at `:91-96` precisely because that field is
   unreliable — and its own comment (`:90`) records that `accounts.email` is sometimes **blank**.
3. **Every path returns `200`** (`:1505`, deliberate: "always 200 so Paystack stops retrying"). So a dropped
   payment gets no retry, no log line and no alert. The first anyone hears of it is a support message.
**Fix applied (the safe half):** added a lowercase-fallback account lookup, `.select("account_id")` on the
update so the affected-row count is visible, and a loud `console.error` on each of the three misses
(no customer email / no matching account / zero rows or update error) plus a success line. Behaviour is
otherwise unchanged — still always 200.
**Proposed — needs review:** switch the update to an **upsert** on `account_id`. Not applied because the
table isn't in the repo and I can't see its NOT NULL columns or its unique constraint. Also worth adding:
`event.event === "invoice.payment_failed"` / `subscription.disable` → `status:"cancelled"`, since **nothing
in the codebase ever revokes a subscription** — today `status:"active"` is permanent once set.

## 🔴 ENT-02 — The client thinks a trial entitles you; the server has never heard of trials — HIGH — proposed, needs review
**What's wrong:** a student inside a valid free trial is told they're fine and then refused by every paid
feature. **The trial grants nothing.**
**Root cause:** the two sides use different definitions of "entitled".
- Client (`sync.js:255-256`): `entitled = status==="active" || (status==="trialing" && trial_ends_at > now)`.
- Server (`server.mjs:87`): `isPremium` accepts `status==="active"` **only**. `/import`'s model tiering
  (`:799`) repeats the same `==="active"` test inline.
So during a trial: the account menu reads "✓ Sync on" with no "trial ended" (`auth-ui.js:316`),
`MB_SYNC.canUseFeatures()` returns true — and then `/solve` answers 402 "Solve is a premium feature —
subscribe" (`:1143`), `/import` stops at 1 lecture (`:774`), Visualize is 3/day not 10 (`:1232`), podcasts
route to free Kokoro (`:988`), and the import build runs `BASIC_MODEL`. Settings' Plan badge reads **Basic**
(`app.html:5386` — it asks `/me`, so it is server-truth) in the same session in which the paywall layer
believes the student is entitled.
**Compounding:** `MEDBANK_CONFIG.TRIAL_DAYS: 14` is read by nothing; no code anywhere writes `status:"trialing"`
or `trial_ends_at`; `paywall.js:47` still carries "days-left text can be added once the app surfaces
trial_ends_at". So the trial is a client-side concept with no producer and no server consumer.
**Fix (proposed):** give `isPremium` the same rule as the client — select `status,trial_ends_at` and accept a
live `trialing` — and use it at `:799` too instead of the inline test. Not applied: granting trial students
paid model calls is a revenue decision, and I cannot confirm `trial_ends_at` exists on that table from the repo.

## 🔴 ENT-03 — `MB_PAYWALL.guard()` has ZERO call sites — the entire client-side gate is dead code — HIGH — proposed, needs review
**What's wrong:** the function whose docstring reads "Call this before running any token-costing feature.
Returns true if allowed" (`paywall.js:34`) is never called. Grep across `app.html`, `import-tab.js`,
`auth-ui.js`, `level-switcher.js`, `sync.js`: every reference is `MB_PAYWALL.nudge` (`app.html:2349`, `:8064`,
`:8225`, `import-tab.js:270`), always as a **reaction** to a server 402/429. This is the LIB-01 pattern — a
defined, documented, apparently-load-bearing function with no callers.
**Consequences:**
- **"View-only" archived levels are not enforced anywhere.** The archived branch (`paywall.js:38`) is the only
  code in the product that blocks an archived level, and it never runs. Every server endpoint keys off
  `account_id`, never the level profile, so a student on an archived level can still build lectures, q-banks,
  podcasts and explainers on it. `level-switcher.js:45` comments "every import/AI feature is off there and
  nothing said so" — in fact nothing turns them off. (AUTH-06/AUTH-10 territory.)
- **Every gate costs a round trip.** A blocked student uploads first and is refused second — worst on `/solve`,
  which ships a multi-MB photo (SOLVE-11) to be answered 402, and on `/import`, which uploads the whole PDF
  before `:774` checks the free-build limit.
**Fix (proposed):** call `guard()` at the six entry points (Solve, Visualize, Import build, build-extra,
podcast script, podcast audio) *before* the upload. Blocked by ENT-02 — wiring it in today would lock trial
students out of the client too, since `canUseFeatures()` and `isPremium` disagree.

## 🟠 ENT-04 — Every quota read fails open silently: one DB hiccup makes the paid features free — MEDIUM — ✅ PARTLY FIXED
**What's wrong:** four separate error swallows each substitute the most permissive possible value, and all four
are invisible.
- `vizQuota` (`:108`) and `/visualize` (`:1237`): `used = (c && !c.error) ? (c.count||0) : 0`. Any `viz_events`
  read error → `used = 0` → the 3/day basic cap is off entirely. `/simplify` (`:1313`) repeats it verbatim.
  The comment says "table not created yet → fail open (don't block students)", which is the right call for a
  missing table and the wrong one for a transient error — and the code cannot tell them apart.
- The counting **write** is best-effort too (`:1290`, `:1327`, both `catch(_){}`): the build happened, the paid
  call was made, and it was never counted against anyone.
- `isPremium` (`:86-99`): `maybeSingle()` **returns** `{data:null,error}` rather than throwing, so a
  `subscriptions` read error never reaches the `catch` and simply returns **false** — a paying subscriber is
  downgraded mid-session and told "Solve is a premium feature — subscribe". Same shape as AUTH-01/AUTH-07.
- `builtCount` (`:100`): `catch(e){ return 0; }` — a `topics` count failure gives a free account an unlimited
  free import.
**Fix applied:** a `console.error` on each swallowed error naming what stopped being enforced. No behaviour
change. **Proposed — needs review:** deciding which of these should fail *closed* is a real trade (blocking a
paying student vs. giving away model calls) and belongs with the human; `isPremium` in particular arguably
deserves a distinct `503 "couldn't verify your subscription — try again"` instead of the upgrade nudge, so a
paying student is never told they haven't paid.

## 🟠 ENT-05 — The free tier caps the one cheap thing and leaves every expensive thing wide open — MEDIUM — proposed (pricing decision)
**What's wrong:** `FREE_BUILD_LIMIT = 1` (`:111`) gates `/import` and nothing else. On that one free lecture a
free account can then call, with no entitlement check at all:
- `/build-extra` (`:889`, comment: "open to any signed-in student") — 5 parallel model calls per q-bank, and
  `req.body.force` (`:900`) bypasses the cache, so the ↻ Rebuild button is an unlimited paid loop (QB-10).
- `/podcast` (`:919`) and `/podcast-audio` (`:962`) — POD-10 counted 56 payable episodes per topic from the
  per-voice-pair cache key alone.
- `/tts` (`:1172`) — see ENT-06.
- Mega Q-bank and mock exams, which are pure client-side and never reach the server at all (MX: "the exam is
  entirely ungated").
The only real limits in the shipping product are **1 import** and **3 explainers/day**. Stated here in one
place because it is a pricing decision, not a code defect — but it is the answer to "why is the model bill
higher than the subscription count".

## 🟠 ENT-06 — `/tts` lets any signed-in student select the *paid* voice provider from the request body — MEDIUM — proposed, needs review
**What's wrong:** `server.mjs:1177-1182` picks the provider from client-supplied fields before any tier check —
and this handler has no tier check at all. `use:"tutor"` → `provider = "fish"` (the paid API); any `voiceKey`
in `FISH_VOICE_BY_KEY` also forces `provider = "fish"`. `app.html:3838` ("ask the hosts") sends
`use:'tutor'` **unconditionally**, so a basic account spends Fish credits on every question — 1500 chars a
time, uncached, uncapped — while `/podcast-audio` (`:988-992`) carefully routes the same student to free Kokoro.
Second leak in the same area: `:996`, a **basic** student whose Kokoro is down is switched to Fish for the whole
episode. That is exactly what the admin banner at `app.html:6271-6287` exists to warn about — the leak is known
and monitored but not closed.
**Fix (proposed):** resolve the provider from `isPremium` server-side and treat `use`/`voiceKey` as a *request*,
not an instruction; or meter `/tts` per account per day. Not applied — it would change the tutor's voice for
basic students, which is a product call (SET-09/POD-09 family).

## 🟢 ENT-07 — Settings' "Plan" row was a dead end for exactly the student it targets — LOW — ✅ FIXED
**What's wrong:** `app.html:5457` tells a Basic student "Premium unlocks Solve, 10 explainers a day, and the
premium podcast voices" and puts a **static** `Basic` badge next to it with no way to buy anything. There is no
in-app checkout at all: `MEDBANK_CONFIG.PAYSTACK_PUBLIC_KEY` is still the `pk_test_XXXX` placeholder and is read
by nothing, and the only subscribe route in the whole codebase is `paywall.js:22`
(`window.open(WEBSITE_URL + "#pricing")`) — reachable only by **hitting a wall**. A student who decides to pay
after reading the Plan row has nowhere to tap.
**Fix applied:** `loadPlanBadge` (`:5387`) now renders "Basic · Upgrade →" as a tappable badge opening the same
`WEBSITE_URL#pricing` target the nudge uses.
**Also noted (LOW, not fixed):** `loadPlanBadge` collapses four different failures — no `IMPORT_API`, no
session, network error, non-`ok` response — into a bare `—` with no retry and no tooltip.

## 🟢 ENT-08 — `MB_PAYWALL.nudge` interpolates strings into `innerHTML` unescaped — LOW — proposed, needs review
`paywall.js:16-18` concatenates `title` and `msg` straight into `c.innerHTML`. Today's inputs are all
server-authored (`app.html:8064` passes `jj.message`, `:8225` a server `msg`, `import-tab.js:270` passes
`out.reason`), so this is not reachable from student input right now — but it is an HTML sink one refactor away
from carrying a topic name or a lecturer name, which is precisely how HOME-03 happened. Two-line fix
(`textContent` on child nodes); logged rather than edited because `paywall.js` is shared and untested.

## 🟢 STK/ENT NOTES — smaller observations, not fixed
- **`streakMaintain` writes `s.lastN` but never `s.last`** (`:1241`), leaving the two fields disagreeing by up
  to `gap` days. Inert today — every reader prefers `lastN` (`:1213`, `:1227`, `:1236`, `:4305`) — but
  `mergeStreak` (`sync.js:59`) maxes `lastN` with `(b.lastN||-1)`, and any merge that loses `lastN` silently
  falls back to a stale `last`.
- **`freezeState()`** (`:1245`) returns `'used'` whenever the bank is empty, so the Today page prints
  "❄ freeze used" (`:2152`) to a student who has **never earned one** — every new account, from day 1.
- **Freezes are granted retroactively on first load**: `:1138` seeds `freezes = min(2, floor(current/7))` for
  any existing profile, so an imported/merged streak can mint up to 2 freezes that were never earned.
- **`grantFreeze` only fires on an exact multiple of 7** (`:1209`). Safe today because `current` only ever
  increments by 1 — but STK-02's bridging path (`:1219`) also does `+1`, so a future multi-day bridge that
  incremented by the gap would skip the milestone entirely.
- **`streakMet()` calls `reviewTotals()` → `buildQueue()`** (`:1256`), a full pass over every card, and
  `streakMet` is called from `logDaily` on **every rated card** plus several render paths. HOME already does
  ~8 full passes per render; this adds more.
- **`reviewTotals`' denominator is self-fulfilling**: `total = done + due`, so finishing the queue always
  reports 100% regardless of how much was actually due at the start of the day.
- **`/me` (`:680`) is the only honest tier surface in the app** and only Settings' badge consumes it. The
  Home, Today and topic pages never ask; nothing else in the UI knows what tier the student is on.
- **`/import`'s model tiering duplicates `isPremium`'s query inline** (`:798-799`) instead of calling it —
  so `PREMIUM_TEST_EMAILS` (`:84`) grants test accounts premium *features* but NOT the premium *model*.
  A QA build measuring import quality is silently measuring `BASIC_MODEL`.
- **The Visualize quota resets at UTC midnight** (`:106`, `:1235`) — 01:00 for a WAT student — while the copy
  says "they reset tomorrow". A student working after midnight is on yesterday's allowance for an hour.
- **The daily cap is count-then-insert with no atomicity** (`:1236` → `:1290`): concurrent taps all read the
  same `used` and all pass. Small in practice (one student, one device), but the cap is advisory not enforced.
- **Nothing ever downgrades an account.** No code path writes `status` to anything but `"active"`; there is no
  `cancelled`/`past_due` handling and no expiry check on the server side. A subscription is permanent once set.

---

# Flow 19 — Study screen + Subject page (`pageStudy` `app.html:4486`, `pageSubject` `:2358`) — code review, 2026-08-22

The most-trafficked route in the app (19 `go('study/…')` call sites, 6 for `subject/`). Reviewed together with
everything `pageStudy` reaches: `startDeck` (`:4108`), `toggleWeakFilter`/`toggleClinFilter` (`:4123`),
`cardView` (`:4792`), `mcqView` (`:4713`), `rateCard`/`mcqRate`/`step`/`shuffle`/`restartDeck`,
`sessionRecallIds` (`:1323`), and `topicRow`/`recomputeStats` on the subject side.

## 🟠 STU-01 — A filtered pass ("⚡ Weak only" / "🩺 Clinical only") overwrites the FULL deck's saved place — MEDIUM → ✅ FIXED
**What's wrong.** Student is 41 cards into a 60-card Recall deck. They tap **⚡ Weak only**, drill the 4 weak
cards, and leave. The topic page now says **"Continue · 1 / 60 · 2%"** and reopening the deck drops them back
at card 1. Their real place is gone, with nothing on screen to explain it.
**Root cause.** `startDeck` (`app.html:4117`) is careful to only *read* `DATA.pos` on the unfiltered deck —
`if(!clinOnly && !weakOnly)`. Every *write* is missing the same guard, and they all key on
`'pos:'+S.t.id+S.deck`, which does not distinguish a filtered session from the full one:
`mcqRate` (`:4895`), `rateCard` (`:5002`), `step` (`:4938`) and `restartDeck` (`:4944`, writes `0`).
So the index of a card inside a 4-item filtered list is stored as the position inside the 60-item deck.
Readers of that number: `topicResume` (`:2003`), the topic page's Continue row (`:2439`), Jump back in.
**Fix (applied).** All four writes now carry `&& !S.clinOnly && !S.weakOnly`. `restartDeck` still clears
`DATA.cardAns` for the cards it actually restarted; only the `pos` reset is now full-deck-only.

## 🟠 STU-02 — `#/study/<id>` with no deck segment froze the whole app — MEDIUM → ✅ FIXED
**What's wrong.** A typed, shared or bookmarked `#/study/<topicId>` link (no `/primer` or `/recall`) left the
app stuck on whatever screen was already showing, and reloading reproduced it — the hash persists, so the
route is un-escapable without editing the URL.
**Root cause.** `render()` (`:6167`) calls `pageStudy(p[1], p[2])`; with `p[2]` undefined, `startDeck` picks
the recall deck but then calls `cid(t.id, undefined, c)` (`:1176`), which evaluates `deck[0]` on `undefined`
and throws. `render()` has **no try/catch**, so `$('#main').innerHTML=html` and `renderNav()` never run —
the exact failure mode already logged as REV-03 and TOP-04.
**Fix (applied).** `pageStudy` now normalises: `deck = (deck==='primer') ? 'primer' : 'recall'`. This also
makes the `S.deck!==deck` session-reuse test stable for the same link written two different ways.

## 🟠 STU-03 — 12th pool missing the `isFlagged` filter: the mastery chips count cards that can never be studied — LOW/MEDIUM → ✅ FIXED
**What's wrong.** The Unfamiliar / Learning / Familiar / Mastered chips above every study card counted
reported-wrong cards, so a student who hid 3 broken cards saw a permanent "3 Unfamiliar" that no amount of
studying could clear — and there is no un-flag UI to undo it (LIB-01).
**Root cause.** `sessionRecallIds()` (`:1325`) deck branch maps the raw `S.t.recall` array. Every serving pool
was hardened by REV-04; this *reporting* pool was missed. (The session branch on the next line is safe — its
`S.items` were already filtered by `startDeck`.)
**Fix (applied).** `.filter(id=>!isFlagged(id))` on the deck branch.

## 🟢 STU-04 — The empty study screen was a dead end, and blamed the wrong thing — LOW → ✅ FIXED
**What's wrong.** `if(!S.items.length)` rendered `"This deck is empty."` with no button of any kind — no way
back except the browser or the breadcrumb. Worse, `startDeck` drops flagged cards (`:4113`), so a deck of 40
cards where the student has reported all 40 wrong also reported itself as *empty*: the app told them the
lecture has no cards.
**Fix (applied).** The message now distinguishes "empty deck" from "all N cards are reported as wrong, so none
are being shown", and every empty state gets a **← Back to this lecture** button.

## 🟢 STU-05 — The Subject page's empty state shipped the developer's workflow to students — LOW → ✅ FIXED
**What's wrong.** A course with no lectures rendered: *"No lecture schedule loaded for this subject yet. Send
MedBank a photo of the schedule and every topic will be listed here."* There is nobody to send a photo to and
no button on the page. Same defect as LIB-08 (`pageBuilder`) and the LIB-06 blank-page family.
**Fix (applied).** Replaced with "No lectures in this course yet" plus a **＋ Add a lecture** button wired to
`MB_openImport()`, matching the pattern already used at `:6087`.

## 🟢 STU-06 — `pageSubject` mapped `s.modules` and `m.topics` unguarded — LOW → ✅ FIXED
`s.modules.map(...)` / `m.topics.map(...)` (`:2368-2369`) had no `||[]`, while the same structures are read
defensively everywhere else (`:2956`, `:3042`, `content-loader.js:27`). A course object created without a
module array (or a module created without topics) would throw inside `render()` — and per STU-02 that means a
frozen screen, not an error. In practice `applyContent` always creates `modules[0]`, so this was latent.
**Fix (applied).** `(s.modules||[])` / `(m.topics||[])`.

## 🟠 STU-07 — A topic deck can never be *finished* — MEDIUM — proposed, needs review
Every other runner ends somewhere: `pageReview` → `sessionSummary` (`:4505`), `pageHard` → `sessionSummary`
(`:4534`), Mega and the mock exam have results screens. The deck runner has no end state at all. On the last
card, `rateCard` and `mcqNext` deliberately stop (`:5011-5013`, `:4922-4924`, *"deck: stay on last card"*),
`mcqView` renders **Next → disabled** (`:4769`, `(!session&&last)`), and `pageStudy` returns the same card
forever. The student gets no "deck complete", no accuracy, no streak feedback and no next-step CTA — the one
place in the app where finishing 60 cards is rewarded with a greyed-out button.
**Proposed.** Give `pageStudy` a completion branch (a `sessionSummary`-style card once every item has been
rated, with "Back to lecture" / "Study the other deck" / "↺ Restart"). Not applied: it changes the deck
runner's end state and interacts with resume, `DATA.pos` and `DATA.cardAns`.

## 🟠 STU-08 — `⇄ Shuffle` makes the saved place meaningless — MEDIUM — proposed, needs review
`shuffle()` (`:4941`) permutes `S.order` and resets `S.i=0`, but the `DATA.pos` writes store `S.i+1` — an index
into the *shuffled* order. `startDeck` restores that number into a freshly built, identity-ordered `S.order`
(`:4119`), so the resume point lands on an unrelated card and the topic page's "Continue · 12 / 60 · 20%" is
fiction. STU-01's guard does not help here: a shuffled full-deck pass is still `!clinOnly && !weakOnly`.
**Proposed.** Either stop writing `pos` once `S.shuffled` is set, or store the card *id* instead of the index
and resolve it back to an index on resume (the id form also survives a deck rebuild, which the index does not).
Not applied — it changes the shape of a persisted, synced field.

## 🟠 STU-09 — Opening any `study/…` link silently destroys a live session — MEDIUM — proposed, needs review
`pageStudy:4489` runs `startDeck` whenever `S.mode!=='deck'`, with no confirm and no notice. A student halfway
through today's review who taps a topic from Jump back in, Search, the Weakest tile or a status list loses the
session's meter, mix and summary. Same defect as MX-06 (opening the exam tab ran `S=null`) and TOP-10
(`qbStart`), but on the highest-traffic route in the app — 19 call sites. Ratings themselves are persisted per
card, so the loss is the session, not the progress. Not applied: prompting on navigation is a UX decision, and
the honest fix is to keep the daily session in a separate slot from the deck session rather than sharing `S`.

## 🟢 FLOW 19 NOTES — smaller observations, not fixed
- **`nClin` counts flagged cards** (`pageStudy:4490` → `clinInDeck` `:1422` reads `t.recall` raw), so the
  "🩺 Clinical only" button can be offered on a deck whose clinical cards are all hidden — tapping it lands on
  "No clinical cards in this deck." Same family as STU-03, but on a control rather than a counter.
- **The card count in the filter bar is filtered, the clinical count next to it is not** — `${S.items.length}`
  vs `nClin`, so "4 cards" can sit beside a button promising 9 scenarios.
- **Revealing a non-MCQ recall card in deck mode removes the navigation.** `cardView` (`:4812`) swaps the
  Prev / Reveal / Next + Shuffle / Restart row for the ✗/✓ rate buttons, so mid-card the only way forward is
  to rate it (the ←/→ keys still work, but nothing on screen says so).
- **Breadcrumb mismatch.** `pageStudy` builds `Anki Cards › Subject › Topic` (`:4496`) while `pageSubject`
  builds `Home › Subject` (`:2364`). A student who arrived from Home and taps the crumb lands in a section of
  the app they were never in.
- **`DATA.cardAns` makes a topic deck one-shot.** `mcqView:4719` restores a previous day's pick, so re-opening
  a Recall deck shows every question pre-answered with the answer revealed; the only way to re-test is
  ↺ Restart, which is not labelled as "clear my answers". Deliberate (`restartDeck:4943` comments say so), but
  it means "study this deck again" is not the obvious path.
- **`s.topicCount` / `readyCount` / `cardCount` exist only if `recomputeStats()` ran** (`content-loader.js:40`),
  which happens only inside `applyContent`. Harmless today because `content.js` ships `subjects: []`, so every
  subject on screen came through `applyContent` — but `pageSubject`'s first line of logic (`if(!s.topicCount)`)
  would hide a fully-populated course if a subject ever arrives by another path.
- **`allTopics` holds copies, not references** (`:1110`, `Object.assign({subject,module},t)`), so `topById()`
  and `pageSubject`'s `m.topics[]` are two different objects per topic. `applyContent` writes both (`:78-79`),
  but a *local* runtime mutation via `topById` (e.g. a freshly built q-bank) is invisible to the subject page's
  row until the next content refresh. No user-visible symptom found in this flow — `topicRow` only reads
  `name`/`lecturer`/`ready`/`primer`/`recall` — but it is a trap for anything that starts rendering `extras`.

---

# Flow 20 — Recall side-sessions (`pageHard`/`startHardQuick`, `pageLeeches`, `pageMistakes`, `startNudgeSession`)
Reviewed 2026-08-22. LOG-ONLY — no code changed in this run. Four pools read: `starItems` (`:1853`),
`leechItems` (`:1598`), `missItems` (`:1606`), `nudgeItems` (`:4272`); plus their runners and the
`hard`/`leeches`/`mistakes`/`nudge`/`hardnudge` router cases (`:6169-6173`).

## 🔴 SIDE-01 — All four side-session pools are missing the `isFlagged` filter — HIGH — logged, not fixed
**What's wrong:** family (a) again, in four more pools, none of which filters reported-wrong cards:
- `starItems()` `app.html:1853-1861` — no filter (feeds `startHard`, `startHardQuick`, `nudgeItems`)
- `leechItems()` `app.html:1598-1601` — walks `DATA.cards` raw, no filter
- `missItems()` `app.html:1606-1612` — walks `DATA.missLog` raw, no filter
- `nudgeItems()` due loop `app.html:4276-4277` — filters `DATA.starred` but not `isFlagged`

That takes the count to **16 pools** since REV-04 (11), PRG-04 (11th), STU-03 (12th).
It is worse here than in the earlier cases because of the auto-star on failure: a missed card is written
into **both** `DATA.starred` and `DATA.missLog` at `app.html:4917` and `:5028`. So the normal life of a bad
card is: student misses it → it lands in Hard + Mistakes → student taps "Report this card as wrong and hide
it from my studying" → `cardFlags` hides it from the twelve *studying* pools, and it keeps being served by
Hard cards, Leeches, Recent mistakes **and the push notification**.

**Why it matters to a student:** the hide button is the app's promise that a bad card will stop appearing.
Here it appears on the three surfaces the student visits *specifically* to clean up bad cards, plus a phone
notification that quotes the card's question and answer on the lock screen (`nudgeBody`, `:4295`). It reads
as the report button being broken — and per LIB-01 there is no un-flag UI to undo the report either.

**Proposed fix:** add `if(isFlagged(id)) continue;` / `&& !isFlagged(id)` at each of the four sites.
For `leechItems`/`missItems` the guard goes right before `itemById(id)` so the count and the rows agree.
Also worth considering: don't auto-star/auto-log a card that is already flagged (`:4917`, `:5028`).

## 🔴 SIDE-02 — Un-starring a hard card never syncs — the Hard-cards pool can only grow — HIGH — logged, not fixed
**What's wrong:** `DATA.starred` is merged as a pure **union**, `sync.js:144`
(`out.starred = mergeMap(localD.starred, remoteD.starred, "b")`, and `mergeMap` `sync.js:~200` copies both
key sets). A union has no way to express a deletion, and the two places that remove a star both delete the key:
`rateSRS` on a pass — `if(DATA.starred[id]) delete DATA.starred[id]` (`app.html:1270`, the documented
"passed → graduate out of hard cards" rule) — and `toggleStar` (`app.html:1850`).

So on any account that has synced from two contexts (two devices, or one device plus a stale cloud row), every
star ever set is resurrected on the next `mergeState`.

**Why it matters to a student:** the Hard-cards list is supposed to *drain* as you master things — that is the
entire reward loop. Instead it ratchets upward: the card you just aced reappears, the card you deliberately
un-starred reappears, `starCount()` (which drives the ★ nav subtitle at `:4716` and the service worker's
`hardcount` badge, `:4919`) only ever climbs, and `nudgeItems` weights notifications toward that stale pool
1-hard-to-2-due. The feature quietly becomes a list of everything you ever got wrong.

**Proposed fix direction:** stars need to be a last-write-wins map rather than a set — e.g. store
`DATA.starred[id] = {v:0|1, ts}` and merge by `ts`, or keep the current shape and add a `DATA.starredOff`
tombstone map (id → ts) that `mergeState` subtracts after the union. Either is a state-shape change on the
sync path, so it needs a migration and Frank's call — not a drive-by fix.

## 🟠 SIDE-03 — `missLog` is never cleared when you get the card right — MEDIUM/HIGH — logged, not fixed
**What's wrong:** `logMiss(id)` (`app.html:1605`) is write-only. The single delete in the codebase is the
per-topic reset at `app.html:1395`. Nothing in the rating path removes an entry when the same card is
subsequently answered correctly (`:4917`, `:5028` only ever add).

**Why it matters to a student:** "Recent mistakes — every card you miss lands here automatically. **Clear them
while they're fresh**" (`pageMistakes`, `:5581`) describes a mop-up loop that cannot complete. Drill all 12 of
today's misses, get 12/12, come back: the button still says "Today's misses · 12 cards" and re-serves the
identical 12. The only thing that ever shrinks the list is the calendar rolling past the 1-day / 7-day window.
Two knock-on effects: (i) those re-drills run through the full `rateSRS` path, so the same cards can be
re-rated repeatedly the same day and inflate the daily goal/streak counters (REV-05 family, and here the app
actively invites it); (ii) the SRS schedule is bypassed — a card correctly boxed to +7 days is dragged back
today, resetting nothing but wasting the review.

**Proposed fix:** on a correct rating, `delete DATA.missLog[it.id]` alongside the existing star cleanup at
both rating sites. Note the sync side: `missLog` is union-merged (`sync.js:149`), so — exactly as in SIDE-02 —
the deletion will not propagate across devices without a tombstone. Fixing this properly and fixing SIDE-02
are the same piece of work.

## 🟠 SIDE-04 — `lapses` never decays, so a leech is a leech forever — MEDIUM — logged, not fixed
**What's wrong:** `rateSRS` increments `s.lapses` on every miss (`app.html:1269`) and **never** decrements or
resets it on a pass. `leechItems()` selects on `(st.lapses||0) >= LEECH_LAPSES` (4) with no recency window and
no "but it's mastered now" escape (`:1598-1601`).

**Why it matters to a student:** a card missed 4 times in first-year week 3 and mastered ever since is still
listed under "🩸 Leeches — the ones quietly costing you marks", still counted in the Practice-tab button
(`leechCount()`, `:4715`), and still included in "▶ Drill all N leeches". There is no way to clear it: no
dismiss control on the row, no threshold setting, and passing the card does nothing. Over a year the page
becomes a permanent monument that costs the student time on cards they already own — the opposite of the
targeting the page promises. Combined with SIDE-01 it also lists cards the student has explicitly hidden.

**Proposed fix direction:** either decay on success (`if(ok && s.lapses) s.lapses--`, matching how Anki's
leech tag is cleared), or leave `lapses` as the lifetime counter and add a second condition to `leechItems` —
e.g. only list a card whose current `box < 2`, so mastered cards fall off but the history is preserved. The
second is safer mid-pilot: it changes one predicate and touches no stored state.

## 🟠 SIDE-05 — Finishing a Hard-cards or Nudge session leaves the route stuck on a stale results screen — MEDIUM — logged, not fixed
**What's wrong:** `sessionSummary` (`app.html:4578`) renders the celebration but never clears `S`, and the
routers guard on identity rather than completion:
- `pageHard` `app.html:4553` — `if(!S || S.mode!=='hard') startHard();` then `if(S.i>=S.items.length) return sessionSummary('Back to dashboard','home')`
- `case 'nudge'` `app.html:6170` — `if(!S || S.key!=='nudge') startNudgeSession();`
- `case 'hardnudge'` `app.html:6169` — same, keyed on `S.key!=='hardquick'`

After the student finishes a hard session and taps "See what's next tomorrow →" (`go('home')`), `S` is still
`{mode:'hard', i===items.length}`. Tapping "★ Hard cards" again re-enters `pageHard`, the rebuild guard passes,
and they get **the same finished summary** — zero cards, no session. It only unsticks if they happen to start
some other session first (which changes `S.mode`), or reload.

**Why it matters to a student:** the most natural thing after a good hard-card round is a second one. Instead
the button appears to have stopped working, showing yesterday's confetti and stats. The `#/nudge` case is
worse because it is reached from a **push notification**: the second notification of the day drops the student
onto the previous session's celebration screen instead of any cards, which makes the whole reminder feature
look broken from the outside.

**Proposed fix:** make the rebuild guard include completion — e.g. `if(!S || S.mode!=='hard' || S.i>=S.items.length) startHard();` (and the `key` equivalents for nudge/hardnudge). Alternatively have the
summary's back button null `S`, but that risks the MX-06/TOP-10 class of accidental session destruction, so
the guard is the narrower change.

## 🟠 SIDE-06 — `#/nudge` silently destroys a live study session — MEDIUM — logged, not fixed
**What's wrong:** `case 'nudge'` (`app.html:6170`) overwrites `S` whenever `S.key!=='nudge'`, with no check for
an in-progress session. Entry points: the service worker notification (`sw.js:85, 92, 101, 110, 120`, all of
which route to `./app.html#/nudge`) and the study-timer strict overlay's "Start review now" button
(`app.html:4369`).

**Why it matters to a student:** this is the MX-06 / TOP-10 / STU-09 family, but with the worst trigger of the
set — the strict overlay is raised by a **timer alarm** (`:4425-4429`), not by the student navigating anywhere.
Mid-way through a 40-card deck, the break alarm fires, the student taps the one primary button on the overlay,
and their session — position, `session.done`, `session.correct`, the time-budget `over` count — is gone with no
warning and no way back. The overlay's copy ("Start review now") does not suggest anything is being discarded.

**Proposed fix:** same shape as the STU-09 fix direction — before overwriting, check for
`S && S.session && S.session.done > 0 && S.i < S.items.length` and either resume it or show a two-button
choice ("Resume your session" / "Start the quick review"). Should be solved once, centrally, for all five
session-clobbering routes rather than patched per route.

## 🟠 SIDE-07 — Leech and mistake drills are the only sessions with no time budget and no cap — MEDIUM — logged, not fixed
**What's wrong:** `startLeeches` (`:4438`) and `startMistakes` (`:4444`) do `shuf(pool)` and hand the **entire**
pool to the runner. Every comparable builder in the app budgets: `startRecallSession` and `csStart` (`:4247`)
both run `greedyBudget(orderItems(pool), min)` and report the held-back remainder as `session.over`, which
`sessionSummary` then surfaces ("N extra due cards held for tomorrow to fit your time budget", `:4600`).

**Why it matters to a student:** "▶ Drill all 74 leeches" (`:5578`) is presented as a mop-up and is really a
~35–40 minute unbroken block by the app's own 17s/card review estimate — with no progress expectation set, no
`over` note, and no interleaving (`orderItems` is skipped, so exam-proximity ordering doesn't apply either).
`missItems(7)` can be similarly large after a heavy week. The likely outcome is an abandoned session, and
because `endSession` only shows results when `done>0` (`:4990`) an early bail is at least graceful — but the
student's 15-minute daily budget has been quietly ignored.

**Proposed fix:** route both through `greedyBudget(orderItems(items), DATA.daily.budget||15)` and set
`session.over = g.over`, exactly as `csStart` does; change the button label to the capped count.

## 🟡 SIDE-08 — The `hardnudge` route and `startHardQuick` are dead code — LOW/MEDIUM — CONFIRMED ORPHANED, logged
**What's wrong:** verified across the whole repo. `hardnudge` appears exactly twice: the router case
(`app.html:6169`) and the `onStudyScreen` route list (`app.html:991`). Nothing anywhere navigates to it.
`startHardQuick` (`app.html:4264`, commented "a short 3-5 card hard-card review, launched from the
notification") has that router case as its only call site. And the notification never sends there —
`sw.js:101` picks `hc > 0 ? './app.html#/nudge' : './app.html#/today'`, i.e. the hard-card branch also goes
to `#/nudge`.

**Why it matters to a student:** the designed behaviour is missing rather than broken — a "you have 12 hard
cards" notification opens the generic mixed quick-review instead of the short hard-card drill it advertises.
Also note `startHardQuick` slices to 5 while its own comment says 3–5, and unlike `startNudgeSession` it sets
no `label`, so `pageReview` would render it unlabelled if it ever were reachable.

**Proposed fix (Frank's call, two options):** (a) intended behaviour — change `sw.js:101`'s hard branch to
`'./app.html#/hardnudge'` and keep the route; or (b) delete `startHardQuick`, the router case and the `991`
list entry. Do **not** do (a) blind: `sw.js` is also carrying the unfixed half of SET-03 (the worker checks
neither `remindOn` nor quiet hours), and flow 26 is scheduled to review that file — better to change `sw.js`
once. Deleting is a code change, so logged only either way.

## 🟡 SIDE-09 — "Open" on a leech / mistake row opens the whole deck, not the card — LOW — logged, not fixed
`pageLeeches:5576` and `pageMistakes:5589` both render `<button ... onclick="go('study/${it.t.id}/recall')">Open</button>`.
That lands on the topic's full recall deck at its saved `DATA.pos` position — so tapping "Open" next to the
card you have missed 7 times shows you card 1 of 60, with no indication of where the leech is. It is also the
STU-09 path, so it destroys any live session on the way. The row already holds `it.id`; a deep link that seeks
to that card (or an inline flip on the row itself) is what the layout implies.

## 🟡 SIDE-10 — `missItems` date handling: silent drops, and a card can never age out — LOW — logged, not fixed
Two small things in `missItems` (`app.html:1606-1612`):
- `dayNum(new Date(DATA.missLog[id]+'T00:00'))` — any value that is not a `YYYY-MM-DD` string yields `NaN`,
  `NaN>=cut` is false, and the entry vanishes from every mistakes count with no error. Given `missLog` crosses
  the sync boundary (`sync.js:149`) and is user-restorable via Settings' paste-a-backup path, a shape guard is
  cheap insurance.
- A miss *inside* the mistakes drill re-stamps `missLog[id]` to today (`:5028`), so a genuinely hard card is
  pinned in "Today's misses" indefinitely — combined with SIDE-03 (correct answers never clear it) the list has
  no reliable exit at all.

## 🟡 SIDE-NOTES — smaller observations, not fixed
- **Families (b), (c), (d) did not reach this flow.** None of the four pools reads `box`: `leechItems` uses
  `(st.lapses||0)`, `nudgeItems` uses `s.due`, `starItems`/`missItems` read no state fields. There is no
  answer-key parsing and no `fetch` on any of these paths. The one adjacent `box` read is `classifyItem`
  (`:4975`) — `DATA.starred[it.id] || s.box<0`; a Visualize-quiz state with no `box` gives `undefined<0` =
  false, so the card is mislabelled 'rev' in the session mix rather than crashing. Cosmetic, but it is the
  REV-01/TOP-01 shape surviving in a third reader.
- **`starItems` includes `primer` cards** (`:1855`, `['primer','recall'].forEach`). Primer cards are not rated,
  so a hard session made only of primer cards advances via `sessionNext` (`:4996`) and scores nothing. Worse,
  `nudgeBody` (`:4297`) prints `it.deck==='primer' ? (it.c.lecturer||'') : it.c.a` as the answer — so a push
  notification's "↳" line can read a lecturer's name, or be blank when the topic kept the default lecturer.
- **Perf:** the Practice tab (`:4714-4716`) calls `missCountWeek()`, `leechCount()` and `starCount()` inline,
  and `pageMistakes` calls `missItems` twice (`:5581`). Each `leechItems`/`missItems` call rebuilds
  `cardIndex()` via `itemById`. That is three-to-four more full index passes per render, on top of the ~8
  noted in HOME.
- **Row lists are silently truncated at 60** (`:5575`, `:5588`) with no "showing 60 of N" line, while the drill
  button above them promises the full count.
- **`LEECH_LAPSES=4` is a hard-coded constant** (`:1597`) with no setting, and the copy repeats it in two
  places — fine, but worth knowing it is the only knob if the leech list turns out to be too noisy in the pilot.
- **`startLeeches`/`startMistakes` label their sessions 'Leeches' / 'Recent mistakes'** but set `mode:'daily'`,
  which means `pageReview`'s cold-start guard (`:4531`, `if(!S || S.mode!=='daily') startRecallSession(0)`)
  correctly leaves them alone. Checked — no defect, but it is why these two routes escape the SIDE-05 bug that
  `#/hard` and `#/nudge` have.

---

# 🧪 Live post-deploy smoke test — 2026-08-22 (Claude, test account frankthejay)

Verified the live build after Frank committed + deployed the ~120 auto-fixes + my 2 fixes.

## ✅ Deploy is healthy (verified against the SERVED files, not just local)
- Fetched live `sync.js` + `auth-ui.js` from production: my `_events` merge-union fix and my out-of-band account-isolation guard are **live**, alongside the task's AUTH hardening (AUTH-01 pull-error throw, AUTH-04 real "syncing" status, AUTH-07 uid-filtered queries, AUTH-11 shared client, AUTH-12 purge `mb_pending_onboard` on switch). HOME-01 real-name greeting is live.
- Committed app.html diff touches only UI/session/flow functions — **no frozen engine function changed** (verified: startSmartDrill/smartDrillPlan/smartPool/qbShuffle/take/poolByQh are byte-identical to the pre-deploy commit). Freeze/engine integrity intact.
- Live Mega Q-bank page renders correctly: Quick Exam + Smart Drill card showing **real diagnosis** ("Exam trap 25%", "Management 40%", misconception "why" text) + customize panel. Smart Drill flow code unchanged from the version already proven end-to-end (start→answer→complete→4 telemetry events→cloud sync).

## 🔴→note AUTH-ISO-01b — my first SIGNED_OUT fix was itself slightly wrong (caught + re-fixed)
The initially-deployed `SIGNED_OUT` handler did `localStorage.removeItem("mb_current_uid")` — but that uid is the whole signal the init() guard uses to detect an account switch on the next login. Clearing it on logout would let the next student on a shared device merge/adopt the previous student's local data (the AUTH-03 risk). Re-fixed: keep `mb_current_uid` through logout (reload only). Frank committed + redeployed. ✅

## 🟠 SET-01 — CONFIRMED LIVE — "Reset progress" does not stick — MEDIUM/HIGH
Frank reset the topic's progress + Q-bank stats, yet the account still shows 40 attempts / 7 events / 5 sessions afterward.
**Two causes:** (1) `qbReset` (app.html) filters `_attempts` and `_sessions` by topicId but **never clears `_events`** at all; (2) even the cleared `_attempts` come back because `mergeQbankStore` is a pure UNION — on the next sync the cloud's copy is re-adopted and re-unioned onto local, undoing the reset. Same class as BUG-02, but here the union *defeats* an explicit user action.
**Fix direction (needs Frank; not applied):** a reset must be authoritative — either (a) push the emptied state with a rev bump and have merge respect a per-record tombstone/reset-timestamp so unions don't resurrect deleted history, or (b) on reset, clear `_events` too and mark the profile so the next pull adopts-clean instead of union-merging. This is a real design tension (multi-device "never lose history" vs. "let me wipe this") and needs a product decision.

## ℹ️ Automation note (not an app bug)
Chrome-extension driving grew unstable across this long session (renderer wedged after a few ops per tab; screenshots intermittently hit a `clip.scale` serialization error). Confirmed environmental: the Smart Drill code path is byte-identical to the version that ran clean earlier, and students aren't reporting freezes. A fresh browser/session drives fine.

---

# Flow 21 — Notification → session landing (`sw.js` reminder path, `strictOverlay`, `startNudgeSession`)
Reviewed 2026-08-22. **LOG-ONLY — no code changed in this run.** Read end-to-end: `sw.js:74-125`
(`periodicsync` → `maybeRemind` → `notifyOpts` → `notificationclick`, plus the `message` channel and
`writeFlag`/`readFlag`), `nudgeTick`/`habitNudge`/`nudgeBody`/`strictOverlay` (`app.html:4271-4430`),
`startNudgeSession` (`:4288`), the `nudge`/`hardnudge` router cases (`:6169-6170`), `swPing`/`setupReminder`
(`:6330-6358`) and the boot order (`render()` at `:6390` vs `content-loader.js` at `:6410`).

## 🔴 NTF-01 — The service worker's flag store can never write a single value — HIGH
**What's wrong:** `writeFlag` (`sw.js:114`) does `c.put('flag:' + k, new Response(v))`. The string
`'flag:hardCount'` is not a relative path — it parses as an **absolute URL with the scheme `flag:`**, and the
Cache API spec rejects `Cache.put()` for any request whose URL scheme is not `http`/`https`, with a TypeError.
Every call site (`sw.js:108,109,110,111`) invokes `writeFlag` **un-awaited and un-`catch`ed**, so the rejection
is an unhandled promise rejection nobody sees. `readFlag` (`:115`) then matches against a cache that has never
contained anything and returns `null` forever.
**Why it matters to a student:** the entire staged-payload mechanism is dead. `maybeRemind` (`:88-103`) always
falls through to its fallback branch, so:
- the habit-loop copy the app spends real work computing (`habitNudge`, `app.html:4306`) never reaches a
  background notification — every push is the generic *"Time for a quick review — keep your streak alive."*
- `hardCount` is always `0`, so the fallback never says *"Review 3 hard cards"* and never routes to `#/nudge`
- `strict` is always falsy, so `requireInteraction` is off — the student paid for strict mode and the
  background notification quietly ignores it
- `lastStudied` is written and read by nothing at all (dead either way)
**Confirm in one line** (DevTools → Application → Service Workers → console):
`caches.open('medbank-v213').then(c=>c.put('flag:x',new Response('1'))).then(()=>console.log('OK'),e=>console.log('FAIL',e))`
**Proposed fix (do NOT apply here — batch it into the flow-26 `sw.js` pass):** give the keys a real same-origin
http(s) URL — e.g. `'./__mbflag/' + k`, which resolves against the SW scope — and add `.catch(()=>{})` to every
write. If that path is used, the `fetch` handler (`:53`) must skip `/__mbflag/` so a stray navigation can't
serve a flag as a document. Cleaner alternative: move the store to IndexedDB (~15 lines), which also fixes
NTF-06 for free. **One `sw.js` edit + one `CACHE` bump for NTF-01, NTF-03, NTF-06, NTF-07 and SIDE-08 together
— do not touch `sw.js` five times.**

## 🔴 NTF-02 — Landing on `#/nudge` from a cold start always builds an EMPTY session, and never rebuilds — HIGH
**What's wrong:** a boot-order race that the nudge route has no guard against.
1. `content.js` is a **104-byte empty shim** (`{subjects:[],lecturers:[],stats:{…}}`) — every real topic
   arrives through `content-loader.js`.
2. The inline script's boot `render()` runs at `app.html:6390`, inside the `<script>` block that ends at
   `:6400`. `content-loader.js` is not loaded until `:6410`. So at the first render **`allTopics` is empty for
   every student, always.**
3. Router `:6170`: `case 'nudge': if(!S||S.key!=='nudge') startNudgeSession();` — `S` is null, so
   `startNudgeSession` (`:4288`) runs `nudgeItems(10)`, whose two sources (`starItems()` `:1853` and
   `startedTopics()` `:4276`) both walk the still-empty `allTopics` → **`items: []`**.
4. `content-loader.js` hydrates from cache and calls `render()` (`content-loader.js:160`, and again at `:149`
   after the network fetch) — but the guard is now false (`S` exists, `S.key==='nudge'`), so **the session is
   never rebuilt**. `pageReview`'s own cold-start guard (`app.html:4528`) also declines, because
   `startNudgeSession` sets `mode:'daily'`.
5. `pageReview:4529` → `!S.items.length` → **`caughtUp()`**.
**Why it matters to a student:** they tap a notification that exists solely because cards are due, and the app
opens on **"All caught up. No Recall cards are due right now."** (On the very first paint it is even worse —
`startedTopics()` is 0 too, so it reads *"Nothing started yet. Open any built topic and study it."* to a
student with 200 built cards.) It is unrecoverable without navigating away and back, and it discredits every
future notification. `hardnudge` (`:6169`) has the identical defect, currently masked only because SIDE-08
established that route is orphaned.
**Proposed fix (not applied):** make the two nudge cases content-aware rather than identity-only, e.g.
`if(!S || S.key!=='nudge' || (!S.items.length && !window.__MB_CONTENT_READY)) startNudgeSession();`.
The cleaner version is to extend the pre-content loader guard at `:6159-6162` to cover id-less study routes
(`nudge`, `hardnudge`, and arguably `today`/`hard`/`mistakes`/`leeches`) so they paint `pageLoadingTopic()`
until content is ready — **but note `__MB_CONTENT_READY` is only ever set in `loadProfileContent`'s `finally`
(`content-loader.js:152`), which is never reached for a logged-out or local-only student**, so a naive
loader-gate would spin forever for them. Whichever route is taken, that flag needs an honest
"content-will-never-arrive" terminal state first.

## 🟠 NTF-03 — The background notification path has none of the three guardrails the foreground path has — HIGH/MEDIUM
**What's wrong:** `maybeRemind()` (`sw.js:88`) checks **nothing**. All three gates live in `nudgeTick`
(`app.html:4398`), which only runs while the page is open:
- `if(!s.remindOn) return;` (`:4401`) — no equivalent in the worker
- the active-hours window (`:4407-4409`, the SET-05 wrap-past-midnight fix) — no equivalent in the worker
- the one-pull-and-one-streak-save-per-day guardrail (`:4417-4421`) — no equivalent in the worker
`periodicsync` fires at the browser's discretion at `minInterval` (default 120 min from `remindMins`,
`:6335`) around the clock, and `notifyOpts` sets `renotify:true`, so each one re-buzzes.
**Why it matters to a student:** the v197 promise of *"one pull/day, never guilt-nag"* and the Settings copy
*"No nudges outside this window (so it won't wake you)"* (`:5466`) are both true only while the app is open —
i.e. exactly when the notification is least needed. In the background they are unenforced. `disableReminders`
(`:5392`) now unregisters `periodicSync`, but that is wrapped in `try/catch` and depends on
`navigator.serviceWorker.ready`; if it doesn't land, the student has turned reminders off and the worker keeps
firing with no off switch. This is the still-open half of **SET-03**, plus the newly-found missing daily cap.
**Proposed fix (not applied, belongs in the flow-26 `sw.js` pass):** once NTF-01 makes the flag store work,
mirror `remindOn`, `quietStart`, `quietEnd` and `nudgedDay` into it on every `persist()` and gate
`maybeRemind` on all four — and treat *unreadable settings* as **do not notify**, not as "notify anyway".

## 🟠 NTF-04 — `nudgeBody()` has ZERO call sites — the card-carrying notification was never wired up — MEDIUM
**What's wrong:** `nudgeBody(items)` (`app.html:4294-4303`) builds the whole "🔴 question ↳ answer …
+ 7 more · tap to drill" body, complete with its own clipper. Grepped the repo: **the only occurrence of the
identifier is its own `function` line.** Both senders — `nudgeTick` (`:4423-4424`) and `testNudge`
(`:5370-5371`) — pass `habitNudge()`'s generic marketing copy instead. LIB-01 / ENT-03 pattern: a complete
feature reachable from nowhere.
**Why it matters to a student:** Settings makes two contradictory promises about this and ships neither
cleanly. The reminders row says *"No card spoilers, no guilt-trips"* (`:5459`); the **Test it now** row two
screens down says *"Fire a sample nudge so you can set the sound and **see the card in your notification
shade**"* (`:5474`). Shipped behaviour matches the first and makes the second a lie. A student who taps "Test
it now" specifically to check the card-preview feature sees no card and reasonably concludes notifications are
broken.
**Proposed fix (not applied — this is a product decision, not a bug fix):** pick one. If no-spoilers is the
intent, delete `nudgeBody` and correct the "Test it now" copy. If card-carrying is the intent, wire
`nudgeBody(items)` into the `payload` ping only (never the foreground `notify`), and gate it behind a setting —
a lock-screen answer key is a genuine privacy call, not a default. **See also the SIDE-notes finding that
`nudgeBody:4298` prints a lecturer's name as the "answer" for a primer card** — that needs fixing before this
function is ever called.

## 🟠 NTF-05 — The strict overlay's "Start review now" silently destroys a live session — MEDIUM
**What's wrong:** `strictOverlay` (`:4363`) is only ever shown from `nudgeTick` under
`document.visibilityState==='visible'` (`:4425-4427`) — **by definition while the student is using the app**,
and very often mid-session on `#/review`. Its primary button (`:4369`) is
`document.getElementById('strictov').remove();go('nudge')` → hashchange → router `:6170` → `S.key!=='nudge'`
→ `startNudgeSession()` overwrites `S` wholesale. No confirm, no restore.
**Why it matters to a student:** a modal the app throws over them *while they are already studying* wipes the
session they are 14 cards into — `session.done`, `session.correct` and their place, gone. MX-06 / TOP-10 /
STU-09 / SIDE-06 family, but this is the only instance where the app itself initiates the interruption.
**Second defect in the same two lines:** if the student is already on `#/nudge` when the overlay fires,
`go('nudge')` assigns an identical `location.hash` → no `hashchange` → no `render()` → the overlay disappears
and **nothing happens**. That is the MX-01 "`go()` is not a render" defect, third instance.
**Proposed fix (not applied):** (a) don't show the overlay at all when already studying —
`window.MB_DOCK.onStudyScreen()` (`:991`) already enumerates exactly these routes and already includes
`'nudge'`, so the guard is a one-liner; and (b) make the button `startNudgeSession(); go('nudge'); render();`
so it also works from the nudge route itself.

## 🟡 NTF-06 — Every deploy wipes the notification state, because the flags live inside the versioned cache — MEDIUM
**What's wrong:** `activate` (`sw.js:42-47`) deletes **every** cache whose key !== the new `CACHE`, and
`writeFlag`/`readFlag` (`:114-115`) store into that same `CACHE`. Bumping the `CACHE` string is how every
MedBank build ships (27 version lines in this file's header), so each deploy drops `payloadBody`, `payloadUrl`,
`payloadTitle`, `hardCount`, `strict` and `lastStudied`.
**Why it matters to a student:** independent of NTF-01. Even after the scheme bug is fixed, the staged payload
survives only until the next deploy — and the first background nudge after every release reverts to the
generic fallback with `hardCount=0` and strict mode off, which is precisely the window (post-update) where a
re-engagement nudge matters most.
**Proposed fix (not applied):** keep flags in a **version-independent** cache (e.g. `medbank-flags`) and
exclude it from the `activate` sweep, or move the store to IndexedDB, which `activate` never touches. The
IndexedDB route fixes NTF-01 and NTF-06 in the same change. **Do NOT touch the `CACHE` string as part of this
finding** — per the flow-26 rule, one bump, one pass.

## 🟡 NTF-07 — `notificationclick` navigates an arbitrary window, and can be a no-op — LOW/MEDIUM
**What's wrong:** `sw.js:121-124` iterates `clients.matchAll({type:'window'})` and focuses/navigates the
**first** client that has `focus`, with no URL check. Two problems: (1) with two MedBank tabs open, the tap can
navigate the wrong one — and if that tab holds a live mock exam, MX-06 showed that is destructive; (2) if the
focused client is already at the exact target URL, `navigate()` to an identical URL fires no `hashchange`, so
a second tap on the same notification leaves the student on the previous session's stale completion screen —
the SIDE-05 shape, reached from the lock screen.
**Proposed fix (not applied):** prefer a client whose URL contains `app.html`; and after focusing, also
`postMessage({type:'route', url})` so the page can apply the route itself (`location.hash=…; render();`)
instead of relying on `navigate()` alone.

## 🟡 NTF-08 — `swPing` silently no-ops until the worker controls the page — LOW
**What's wrong:** `swPing` (`app.html:6330`) requires `navigator.serviceWorker.controller`, which is `null` on
the very first load after an install until the page reloads. Every `payload` / `hardcount` / `notify` ping in
that window is dropped with no retry — including `setupReminder`'s pre-staging (`:6341`) and the ping
`enableReminders` triggers immediately after the permission grant (`:5389`).
**Why it matters to a student:** the student most likely to turn reminders on is the one who just installed —
and for them nothing is staged until they reopen the app.
**Proposed fix (not applied):** fall back to
`navigator.serviceWorker.ready.then(r=>r.active && r.active.postMessage(msg))` when `controller` is null.

## 🟡 NTF-09 — The strict overlay's card count is the capped 10 — LOW
**What's wrong:** `nudgeTick` builds `items=nudgeItems(10)` (`:4413`) and passes `items.length` into
`strictOverlay` (`:4427`). A student with 90 cards due gets a blocking modal that says **"10 cards waiting"**.
HOME-04 / REV-11 family (a capped pool printed as if it were the true count).
**Proposed fix (not applied):** use `dueCount()` + `starCount()` for the sentence and keep the capped list for
the session it launches.

## Notes / smaller things (Flow 21)
- **Family (a):** `nudgeItems`' due loop filters `DATA.starred` but not `isFlagged` (`:4276-4277`), and
  `starItems()` (`:1853`) is unfiltered — both already logged as **SIDE-01**. Restating because *this* is the
  pool a **notification** opens: the app can push a card the student explicitly asked it to hide straight to
  the lock screen. That raises SIDE-01's priority.
- **Families (b), (c), (d) did not reach this flow.** `nudgeItems` compares `s.due<=today`, so a `NaN` due from
  the REV-01/TOP-01 shape is simply excluded rather than crashing — safe by accident, not by design.
- **`habitNudge()` hard-codes `url='./app.html#/today'`** (`:4315`) and never varies it across any of its five
  branches. Combined with NTF-01 and NTF-04, `#/nudge` today is reachable only from the `sw.js:101` fallback
  (needs `hardCount>0`, which NTF-01 makes impossible) and from the strict overlay. **So NTF-02 is rarer in
  practice right now than it looks — but it becomes the default landing the moment NTF-01 is fixed and
  `hardCount` starts staging. Fix NTF-02 before or in the same change as NTF-01, not after.**
- **Perf:** `nudgeTick` runs every 60s on every screen (`setInterval`, `:6357`) plus on every
  `visibilitychange` (`:6360`) and on every Idle-Detector `active` transition (`:4390`). Each non-bailing tick
  calls `nudgeItems(10)` (two full passes over `allTopics`) and `habitNudge()`, which itself calls
  `buildRecallSession()`, `dueCount()` and `freezeState()` — the **entire session builder, once a minute,
  purely to compute a minute count for notification copy**. The early bails (`remindOn`, permission,
  active-hours, interval) do cover the common case, but the interval check is *after* the hours check and
  *before* `nudgeItems`, so it is fine — worth confirming on a low-end phone during the pilot.
- **`actions:[review, later]`** (`sw.js:84`): `'review'` isn't special-cased and correctly falls through to the
  URL. `'later'` returns without opening (`:119`) — but `s.nudgedDay` was already set *before* the notification
  fired (`app.html:4421`), so "Later" is functionally "no more nudges today", not "remind me later". Probably
  intended given the no-guilt design; flagging for Frank to confirm, because the button label promises the
  opposite.
- **iOS:** `vibrate` and `actions` are ignored by iOS PWAs entirely, so the two action buttons don't exist
  there. Settings' iPhone note (`:5479`) correctly warns about background timing but doesn't mention this.
- `notifyOpts`' defaults (`sw.js:85`, `:92`, `:110`, `:120`) are the only four places `#/nudge` is the fallback
  target; every app-side sender says `#/today`.

---

# Flow 22 — Status lists + Jump back in (`pageStatusList` `app.html:6119`, `pageJumpback` `:5143`)
Code review, 2026-08-22. **LOG-ONLY — no code was edited in this run.** 10 findings (SL-01..SL-10) + 8 notes.
Brief for this item was "check the counts these lists print against the pools they actually open" — that is
exactly where the damage is: **every count on these two screens is computed from a different pool than the
thing its button opens.**

## 🔴 SL-01 — "Due now" and "Jump back in" promise N due cards and open the whole deck at a stale position — HIGH
**Where:** `app.html:6125` (`Open` on a Due-now row) and `app.html:5153` (`Continue →` on a Jump-back-in row).
Both do `go('study/<topicId>/recall')` → `render()` `:6188` → `pageStudy` → `startDeck(topicId,'recall')`
(`app.html:4880` region).

`startDeck` builds `cards = t.recall` — **the entire recall deck** — and never looks at `due`, `box` or
`isNew`. It then restores `i = DATA.pos['pos:'+topicId+'recall']` (`:4888`). So the row that reads

> `12` · Pharmacology of diuretics · **Open**

opens a 60-card deck positioned at card 41, and the next cards the student sees are whatever happens to sit at
index 41-60 — which by definition are the ones they most recently *passed*, not the 12 that came due. There is
no filter, no jump-to-due, and nothing on the study screen tells them the 12 aren't what they're looking at.

**Why it matters to a student:** this is the one screen in the app whose entire job is "here is what you owe
today, tap to clear it", and tapping it does not clear it. The 12 stay due, the number on the tile doesn't
move, and the student concludes the SRS is broken. It also compounds STU-09 (opening any `study/…` link
silently destroys a live session) and STU-01/STU-08 (the deck's saved position is already unreliable), so a
Due-now tap can additionally rewind their real place in that deck.

**Proposed fix (NOT applied):** don't route these buttons through `startDeck` at all. `startFilteredSession`
(`:4210`) already does the right thing — call it with a predicate scoped to the topic
(`(st,t)=>t.id===tid && st && st.due<=dayNum() && st.box>=0`), label `t.name`, key `'due:'+tid`, then
`go('review')`. That delivers exactly the N cards the row counted, in the runner that grades and reschedules
them. Fallback option if that is too big for the pilot: relabel the buttons to "Open topic" and point them at
`topic/<id>`, so at least the copy stops lying.

## 🔴 SL-02 — The number that opens "Due now" is counted from a pool "Due now" filters out — HIGH — family (a), 17th pool
**Where:** `reviewHealth()` `app.html:1795-1806` vs `buildQueue()` `app.html:1662-1670`.

The live entry point to this page is pageToday's tile at `:4684`:
`<div class="artile" onclick="go('duenow')"><b>${h.overdue}</b><span>overdue</span></div>`.
`h.overdue` comes from `reviewHealth()`, whose loop (`:1797-1800`) is
`if(s&&s.due<=today){ dueNow++; …; if(s.due<today) overdue++; }` — **no `isFlagged` guard**.
`buildQueue()`, which the destination page uses, does have one (`:1666`: `&& !isFlagged(id)`).

So a student who used "Report this card as wrong and hide it from your studying" on their overdue cards sees
a tile reading **"4 overdue"**, taps it, and lands on **"✓ Nothing due right now. You're caught up."** The
number is unclearable — the cards behind it can never be served, rated or rescheduled (REV-04 hardened the
eight study pools precisely so they wouldn't be), so `overdue` stays 4 forever.

**Same defect, wider blast radius:** `dueCount()` (`:1820-1824`) is also missing `isFlagged`, and it is the
number on **the nav badge** (`:1914`), **Home** (`:2040`), **`habitNudge()`** (`:4308`) and pageToday's
"cleared" check (`:4582` `const remain=dueCount(), cleared=(remain===0)`). A student with flagged overdue
cards therefore carries a permanent red badge, can never see the "all clear" state, and — via `habitNudge` —
**gets notified every day about cards the app has promised never to show them.** That takes family (a) to 18
known pools; `reviewForecast()` (`:1692`) and `weakTopics()` (`:1696`) are missing it too but are display-only.

**Proposed fix (NOT applied):** add `&& !isFlagged(cid(t.id,'recall',c))` to the loops in `reviewHealth`
(`:1799`), `dueCount` (`:1823`), `dueReviewCount` (`:1297`) and `reviewForecast` (`:1693`) so every count
matches the pool that is actually servable. `dueReviewCount` is the more urgent of the two extras — it feeds
`reviewLoadRatio()` → `effectiveNewCap()`, so phantom flagged reviews can **zero out the daily new-card cap**
(PRG-03) for a backlog that does not exist.

## 🟠 SL-03 — The headline count and the Start button on the same screen describe two different sessions — MEDIUM
**Where:** `app.html:6121-6128`.
The header prints `rows.reduce((s,r)=>s+r.n,0)` over `q.due.concat(q.neu)` — the **uncapped** `buildQueue()`
output. The button one line below calls `startRecallSession()` with no argument (`:6128`), and
`startRecallSession` (`:4184`) builds from `buildRecallSession()`, which is **greedy-budget capped** to
`DATA.daily.budget` (default 15 min, `greedyBudget` `:4192`) and then **appends a confidence bucket** the
header never counted (`items=b.capped.concat(b.conf)`).

So "74 cards due across 9 topics · ▶ Start Active Recall" starts a ~22-card session containing cards that
aren't in the 74. pageToday handles this honestly — it prints `b.over` as "+N more due — held for tomorrow to
fit your 15-min budget" (`:4680`) — and Due now simply doesn't. HOME-10 family.

**Proposed fix (NOT applied):** build once (`const b=buildRecallSession()`), print `b.capped.length+b.conf.length`
as the session size with `b.over` shown as the held-back line, exactly as pageToday does; or pass an explicit
`0`/uncapped intent if this page is meant to be the "give me everything" route.

## 🟠 SL-04 — "Due now" counts never-seen cards as due — MEDIUM
**Where:** `app.html:6121` `const q=buildQueue(), due=q.due.concat(q.neu)`.
`q.neu` is `planNew()` (`:1643`) — cards with **no `DATA.cards` entry at all**. They have never been seen and
have no due date; they're this week's plan allocation. The page then prints
`"N cards due across M topics"` (`:6127`) over the combined list, and the per-topic `<span class="lcount">`
numbers include them.

**Why it matters to a student:** "due" is the word the whole SRS contract rests on — it means *you will forget
this if you don't review it today*. Inflating it with new material makes the backlog look permanently
unbeatable (this is the classic Anki-overwhelm failure), and it double-counts against pageToday, which keeps
them separate (`＋ New · N` vs `↻ Reviews · N`, `:4674-4676`).

**Proposed fix (NOT applied):** print two figures — `${q.due.length} due · ${q.neu.length} new` — and either
split the rows or add a `+N new` suffix to the per-topic count.

## 🟠 SL-05 — `#/inprogress` and `#/completed` are orphaned routes — MEDIUM — LIB-01 / ENT-03 / SIDE-08 pattern
**Where:** the only `go('inprogress')` / `go('completed')` call sites in the repo are `app.html:2173` and
`:2174`, both inside **`pageHomeClassic`** — confirmed dead in HOME-11.
The shipping Home and pageToday have no equivalent tiles (`:4683-4685` offers only `duenow` and a
non-clickable "topics waiting"). So **two full screens plus their empty states are unreachable in the running
app** except by typing the hash.

**Why it matters to a student:** the app asks them to mark topics Complete — there's a three-way segmented
control for it on the topic page (`:2467`) and a `✅ Completed` list built and styled to receive them — and
then gives them no way to ever see that list. Every completion they record disappears into `DATA.topics` with
no payoff screen. Half the reason to mark anything complete is gone.

**Proposed fix (NOT applied):** decide one way. Either add the two tiles to the live Home/Today metric row
(one line each, the page already works), or delete the branch and the `stbtn` "Complete" affordance together
so nothing promises a list that doesn't exist. Do not leave it half-wired through the pilot.

## 🟠 SL-06 — The "In progress" tile counts completed topics into the in-progress list — MEDIUM — latent
**Where:** `app.html:2141` `const started=startedTopics().length` → rendered on the `go('inprogress')` tile at
`:2173`, against `pageStatusList`'s filter at `:6132` `status(t.id)===st` where `st==='inprogress'`.
`startedTopics()` (`:1313`) is `status(t.id)!=='notstarted'` — i.e. **in-progress *plus* complete**. Tile says
12, list shows 9.

Second, smaller mismatch on the same pair of screens: `completeCount()` (`:1865`) is
`allTopics.filter(t=>status(t.id)==='complete')` with **no `t.ready` filter**, while the Completed list
requires `t.ready` (`:6132`). A topic marked complete that later loses `ready` (a rebuild, or the level
switcher's stale ids — LIB-05) is counted and not listed.

This is dead code today (SL-05), which is why it's MEDIUM and not HIGH — **but it ships the instant SL-05 is
wired up**, so fix them in the same change.

**Proposed fix (NOT applied):** `startedTopics().filter(t=>status(t.id)==='inprogress').length` for the tile;
add `t.ready &&` to `completeCount`.

## 🟠 SL-07 — Jump back in silently drops a day's topics when two devices study on the same day — MEDIUM — LIB-09 family
**Where:** `sync.js:150` lists `dayTopics` among the maps merged with `mergeMap`, and `mergeMap`
(`sync.js:66-72`) is a **single-level key union**:
```js
for(k in lo) out[k]=lo[k];
for(k in hi) out[k]=hi[k];   // whole value replaced, not merged
```
Every other key in that list (`topics`, `done`, `read`, `notes`, `missLog`, `pos`, `cardFlags`…) is flat, so a
key union is correct for them. **`dayTopics` is the only nested one** — its shape is
`{'YYYY-MM-DD': {topicId:1, …}}` (`app.html:1143`, written by `logDayTopic` `:1187`). For any date present on
both sides, one device's entire day-object overwrites the other's.

**Why it matters to a student:** phone on the bus (3 topics), laptop that evening (2 topics) → after the sync
their "Today" block on Jump back in lists 2 of the 5, and `weekProgress()`'s "topics touched" (`:5132`)
undercounts to match. Not data-loss in the SRS sense — the cards and their boxes merge fine — but the one
screen whose entire purpose is *"pick up where you left off"* forgets where they left off, on exactly the
multi-device workflow it exists to serve. It also silently deflates the "This week so far" card, and via
`topicLastDay()` (`:2003`) it reorders Home's resume list.

**Proposed fix (NOT applied):** special-case `dayTopics` out of the `mergeMap` loop with a two-level union:
```js
out.dayTopics = (function(a,b){ a=a||{}; b=b||{}; var o={};
  Object.keys(a).concat(Object.keys(b)).forEach(function(d){ o[d]=Object.assign({}, b[d]||{}, a[d]||{}); });
  return o; })(localD.dayTopics, remoteD.dayTopics);
```
Same shape as the existing `study` handler two lines above (`sync.js:148`), which already got bespoke
treatment for the same reason. **Also worth confirming with Frank:** `dayTopics` is never pruned, so it grows
one object per study-day forever inside the blob `copyBackup` puts on the clipboard (SET-10).

## 🟡 SL-08 — "This week so far" buckets this week's topics by their *current* status — LOW
**Where:** `weekProgress()` `app.html:5130-5136`, rendered on the Jump-back-in card `:5163-5169`.
`touched` is built from this week's `dayTopics`, but each id is then bucketed by `status(id)` — the topic's
status **right now**, with no reference to the week. A topic finished in March and revised on Tuesday prints
under *this week's* "completed". Conversely `else inprog++` has no `notstarted` branch, so a topic the student
manually reset with the segmented control (`:2467`) is counted as "in progress" this week.
`wp.notStarted` is computed over every ready topic on every render and **`pageJumpback` never uses it** — the
only consumer is the dead `homeMore` (`:2124`).
PRG-05 already relabelled the other half of this card (rolling-7 vs calendar-week). This is the same card's
other axis.

**Proposed fix (NOT applied):** count completions from `DATA.done[id]` compared against the week window (the
way `weekStats()` already does at `:1836` region: `Object.entries(DATA.done).filter(([id,d])=>d>=since)`),
and either add a `notstarted` bucket or relabel the middle metric "still open". Drop the unused `notStarted`
computation from the `pageJumpback` path.

## 🟡 SL-09 — Due now's empty state is a dead end, on a screen you only reach by tapping a non-zero number — LOW
**Where:** `app.html:6126`:
`<div class="alldone"><div class="big">✓</div><b>Nothing due right now.</b><p>You're caught up — learn a new topic or come back later.</p></div>`
No button. It tells the student to "learn a new topic" and gives them nothing to tap; the plan picker
(`go('plan')`), the topic list and `MB_openImport()` are all one line away. STU-04 / LIB-06 / PRG-06 / SET-07
family — the fifth empty state in the app that describes an action instead of offering it.
**Compounded by SL-02:** the only live route here is a tile showing a non-zero overdue count, so the student
who sees this screen most often is precisely the one whose flagged cards make the tile lie.

**Proposed fix (NOT applied):** add the `🗓 This week's topics` / `＋ Add a lecture` button row that
`pagePlan`'s empty state already uses verbatim (`:6115`).

## 🟡 SL-10 — Both screens render an uncapped, unsorted wall of rows with no way back — LOW
**Where:** `pageStatusList` `:6123` (Due now, `rows` uncapped) and `:6131-6137` (in-progress/completed, every
subject, every topic), `pageJumpback` `:5145` (14 days × every topic touched).
None of the three gets `recallTabs()` (`render()` `:6197` adds those only for `today`/`hard`/`mistakes`/`leeches`)
and none renders a back control, so on a phone a student 30 topics into the pilot scrolls a long list and then
has to use the browser back gesture. Jump back in is the worst case: 14 day-blocks with no collapse.
**Proposed fix (NOT applied):** cap Due now at ~15 rows with a "show all", collapse Jump-back-in days older
than 3 into `<details>`, and add the standard back affordance. Purely cosmetic — safe to defer past the pilot.

## 🟡 SL-NOTES — smaller observations, not fixed
- **Family (b) — `box`-less card state.** Safe here by accident, not by design: `buildQueue` (`:1666`),
  `reviewHealth` (`:1799`) and `dueCount` (`:1823`) all test `s.due<=today`, and a REV-01/TOP-01 `NaN` due
  fails that comparison, so the card is silently *excluded* rather than crashing. Same accident as flow 20/21.
  It does mean a NaN-due card is invisible on every one of these counters — consistent with REV-01's note that
  live accounts still need a repair pass.
- **Families (c) and (d) did not reach this flow** — neither page parses a model answer key nor calls `fetch`.
- **`esc()` (`:981`) is `(s||'')`-guarded**, so the `esc(t.lecturer)` on the in-progress/completed rows
  (`:6134`) and `esc(t.subject.short)` on Due-now rows (`:6124`) degrade to a blank sub-line rather than the
  literal `undefined` that HOME-02 hit. The guard held; the row just loses its only context. No action.
- **`pageJumpback`'s nested click targets are correctly wired** — the row's `onclick="go('topic/…')"` and the
  inner `Continue →` button's `event.stopPropagation()` (`:5153`) do the right thing. Worth keeping in mind if
  SL-01's fix rewrites that button.
- **`planNew()` does not mutate `DATA`** — the `q.cards.shift()` at `:1655` drains a locally-built `unseen`
  array, so `pageStatusList` calling `buildQueue()` purely to print a number is side-effect-free. Confirmed,
  because a render-time mutation here would have been severe.
- **Perf:** `pageStatusList('duenow')` runs a full `buildQueue()` (two passes over every started topic's recall
  deck plus `planNew`'s plan walk) on every render, and `pageJumpback` runs `weekProgress()` which walks
  `allTopics` again for the `notStarted` figure it then throws away (SL-08). Small next to Home's ~8 passes
  (HOME notes), but the wasted `notStarted` pass is free to delete.
- **`go('duenow')` from pageToday is a real hash change** (`#/today` → `#/duenow`), so the MX-01 /
  NTF-05 "`go()` is not a render" trap does **not** apply to any button on these screens. Checked all six.
- **`dayLabel()` (`:5138`)** relies on `dstr()`/`yesterdayStr()` (`:1171-1172`), both local-timezone and
  consistent with `logDayTopic`'s writer. No off-by-one. It does mean a student who crosses a timezone mid-week
  can see two "Today"-adjacent blocks; not worth changing.
- **Ordering note for Frank:** SL-02 is the cheapest high-value fix in this flow (four one-line `isFlagged`
  guards) and it also closes the PRG-03 new-card-cap hole. SL-01 is the one students will actually report.
  SL-05/SL-06 should be decided together, and SL-07 belongs in whatever `sync.js` pass follows AUTH-02/LIB-09.

---

# Flow 19+ · item 19 — `study` card session: swipe gestures, rating path, study-timer + dock bridge
*Reviewed 2026-08-22 · LOG-ONLY, nothing edited.*
Round-2 flow 19 already covered `pageStudy`/`pageSubject`/`startDeck` (STU-01..09) and Round-2 flow 15/9
covered `rateSRS`/`logDaily`. This pass deliberately reads the three sub-areas those left untouched:
the **phone swipe layer** (`app.html:5126-5177`), the **rating/advance state machine**
(`rateCard :5100`, `mcqNext :5026`, `step :5043`, `sessionNext :5089`) and the
**`MB_STUDY_ADD` / `MB_DOCK` bridge** (`app.html:987-1000`, `study-timer.js`, `study-dock.js`).
Part A (`node qa/engine-scenarios.mjs`) passed — all 6 scenarios, engine unchanged.

## 🔴 TIM-01 — the study timer's "never lose seconds" fallback cannot fire; a storage-full account silently studies for zero minutes — MEDIUM (data loss)
**What's wrong:** `study-timer.js:44-49`
```
function flush(){
  if(pending<=0) return;
  var n=pending; pending=0;                        // <-- zeroed BEFORE the write
  if(window.MB_STUDY_ADD) window.MB_STUDY_ADD(n);
  else mem[today()]=(mem[today()]||0)+n;           // "defensive: never lose seconds"
}
```
The defensive branch runs only when `MB_STUDY_ADD` is **absent**. It never runs when the function is
present and **fails** — and it fails silently by construction: `app.html:987` wraps the whole body in
`try{…}catch(e){}`, and the `persist()` it calls (`app.html:1161`) wraps `localStorage.setItem` in its
own bare `catch(e){}`. So on a `QuotaExceededError` the seconds are already gone from `pending`,
never reach `DATA.study`, and nothing anywhere reports it.

**Why it matters to a student:** quota exhaustion is not hypothetical on this app — SET-10 records
multi-MB `DATA` blobs (`cardViz` blueprints + thousands of qbank attempts) and iOS Safari caps
localStorage around 5 MB. The failure mode is a student who studies for an hour and is shown
"0m today", a flat weekly time chart, and (because `persist()` is the same call that feeds
`MB_SYNC.markDirty()`) **no synced progress at all** — while every UI surface says everything is fine.
The timer is the one number a student uses to decide whether they've done enough today.

**Proposed fix direction:** make the write path honest end-to-end.
1. `persist()` returns `true`/`false` (`setItem` succeeded), and on its first failure per session calls
   `mbToast('Your device is out of storage — progress isn't being saved. Open Settings → Back up now.')`.
   The toast helper already exists at `:1163` and is non-blocking.
2. `MB_STUDY_ADD` returns that boolean instead of swallowing it.
3. `flush()` becomes `var n=pending; pending=0; if(!(window.MB_STUDY_ADD && window.MB_STUDY_ADD(n))) pending+=n;`
   so unwritten seconds stay banked for the next 10s tick instead of being destroyed.
Step 1 is the valuable half and is app-wide, not timer-specific — every `persist()` caller inherits it.
**Do not fix during the pilot without a live check first:** confirm on one pilot device whether
`localStorage` is actually near the cap (`JSON.stringify(DATA).length` in the console). If it is,
this is already happening and is HIGH, not MEDIUM.

## 🟡 SWP-01 — swipe navigation and its onboarding hint are switched off on `#/nudge`, the one session that is always opened on a phone — MEDIUM
**What's wrong:** every gate in the swipe layer is the same three-route regex —
`swipeHintEligible()` (`:5131`), `swipeAct()` (`:5142`), the `touchstart`/`touchend` listeners
(`:5160`, `:5167`) and the enter-session hint trigger (`:6287`) all test
`/^#\/(study|review|hard)/`. The notification session renders the **identical** card UI
(`router :6252`: `case 'nudge': … html=pageReview()`) but sits at `#/nudge`, which matches none of them.
`hardnudge` survives only by accident, as a prefix match on `hard`.

**Why it matters to a student:** `#/nudge` is reached by tapping a lock-screen notification, i.e. it is
100% phone traffic and disproportionately a first-session-of-the-day experience. Those students get a
card stack that ignores every swipe, and never see the "Swipe left for the next card" coach mark, so the
gesture is never learned — which then makes it feel broken on the routes where it *does* work.
Compare `MB_DOCK.onStudyScreen` (`:991`), which correctly lists all nine session routes; the swipe layer
is the one consumer that hard-codes a shorter list.

**Proposed fix direction:** one shared predicate instead of five copies of the regex —
`function onCardRoute(){ return /^#\/(study|review|hard|hardnudge|nudge)/.test(location.hash); }` — and
call it from all five sites. Cheap and self-contained. Reuse `MB_DOCK.onStudyScreen`'s route list as the
source of truth minus `topic`/`cram` (those are reading screens, not card stacks).

## 🟡 SWP-02 — swiping to the end of a session never reaches the results screen; the last swipe is a silent no-op — MEDIUM
**What's wrong:** `swipeAct('left')` (`:5148-5154`) ends in `else if(S.i<S.items.length-1){ step(1); }`,
and `step()` itself hard-returns on `n>=S.items.length` (`:5043`). Both tap paths do the opposite: at the
last card `rateCard` (`:5122`) and `mcqNext` (`:5029`) set `S.i=S.items.length` for non-deck sessions,
which is exactly what makes `pageReview` draw the end-of-session summary; `sessionNext` (`:5090`) does the
same for primer cards. So the final left-swipe of a daily / mistakes / leech / nudge session does
**nothing at all** — no advance, no summary, no toast, no error.

**Why it matters to a student:** the app spends an onboarding coach mark teaching "Swipe left for the next
card", so swiping is the taught behaviour — and a student who swipes their way through a session is
dropped at a dead card with no completion, no accuracy figure and no CTA, and has to work out for
themselves that the session is over. This is STU-07's dead-end shape, but STU-07 was scoped to `mode==='deck'`
(which genuinely has no end state); SWP-02 is the sessions that *do* have one and can't be reached by gesture.

**Proposed fix direction:** in `swipeAct`'s left branch, mirror the tap path rather than calling `step(1)`
directly — on the last card, if `S.mode!=='deck'` set `S.i=S.items.length; render();`. Better still, route
the swipe through the same `sessionNext()`/`mcqNext()` the buttons use so there is one advance
implementation instead of two that disagree at the boundary.

## 🟡 SWP-03 — `_mbViaSwipe` leaks `true` when a left-swipe falls through all its branches — LOW
**What's wrong:** `swipeAct` sets `_mbViaSwipe=true` (`:5149`) *before* deciding what the swipe does. If
none of the three branches fires — precisely the SWP-02 case (last card, already revealed, non-MCQ) — the
flag is never consumed and stays `true`. The next **tap** of Next then hits
`if(_mbViaSwipe){ _mbViaSwipe=false; } else bumpNext();` (`mcqNext :5028`, `sessionNext :5089`,
`rateCard`'s callers) and is misread as a swipe.

**Why it matters to a student:** consequence is confined to the coach mark — `bumpNext()` is skipped, so
the "you can swipe" reminder is delayed by one tap. Trivial on its own; logged because it is evidence that
the swipe/tap paths share mutable global state with no single owner, which is the same seam SWP-02 sits on.

**Proposed fix direction:** set the flag inside each branch that actually acts, or clear it at the top of
`swipeAct` on the fall-through path. Fixing SWP-02 removes the fall-through and this with it.

## 🟡 SWP-04 — two gestures that do nothing permanently retire the swipe coach mark — LOW
**What's wrong:** `markSwipeUsed()` is called at `:5145`, *above* the direction handling, and increments a
counter persisted to `localStorage.mb_swipe_used` with the hint gated on `SWIPE_USED<2` (`:5131`). So a
right-swipe on card 1 (`S.i>0` false → no-op, `:5146`) and a left-swipe that falls through (SWP-02) both
count as "feature learned".

**Why it matters to a student:** a student who swipes the wrong way twice on their first card — the most
likely moment to swipe experimentally — burns both impressions of the only instruction the app gives, and
never learns the gesture. The hint is also never re-armed by anything.

**Proposed fix direction:** move `markSwipeUsed()` into the branches that produce a visible result. Optionally
require the two uses to be on different days so an experimental first session doesn't consume both.

## 🟡 DOCK-01 — the docked Ask/Source panel only refreshes on `hashchange`, so it shows the previous card's lecture for the rest of the session — MEDIUM
**What's wrong:** `study-dock.js:191` is the panel's only refresh trigger:
`window.addEventListener("hashchange", function(){ if(isOpen && onStudy()) render(); apply(); });`
Advancing a card inside a session does **not** change the hash — `rateCard`/`mcqNext`/`step`/`sessionNext`
all just mutate `S.i` and call the app's own `render()`. Meanwhile `MB_DOCK.ctx()` (`app.html:992-1000`)
is fully card-scoped: it reads `S.items[S.order[S.i]]` and returns that card's `topicName`, `noteHtml`,
`simplifiedHtml`, `transcript`, `cardSrc` and `personalNote`. Nothing in `app.html` calls back into the
dock on card change (grepped: no `MB_DOCK_REFRESH` / `dockRefresh` exists), and the Ask tab keys its
transcript off `hist[ctx.topicId]` (`study-dock.js:113`).

**Why it matters to a student:** the daily session is deliberately interleaved across lectures (`planNew`,
`buildQueue`), so the topic behind the dock changes every few cards. A student who opens the dock on
desktop and leaves it open — which is the whole point of a dock — reads **the wrong lecture's note**
beside the card in front of them, and the Ask history shown belongs to whichever topic was on screen when
the dock last re-rendered. There is no visible staleness cue: the header just says the old topic's name.
`MB_DOCK_SOURCE` (the "📄 Show in the note" chip, `app.html:4893`/`:4954`) happens to force a `render()`,
so the chip path is correct — which makes the passive path's wrongness harder to notice, not easier.

**Proposed fix direction:** publish a card-change signal the dock can subscribe to rather than adding
another cross-file call — e.g. `document.dispatchEvent(new CustomEvent('mb:card'))` at the end of the app's
`render()` when `S && S.items`, and in `study-dock.js` add
`document.addEventListener('mb:card', function(){ if(isOpen && onStudy()) render(); })`.
Guard the re-render so it does not blow away a half-typed question in `#mbDockAsk` (preserve the textarea
value across `render()`), otherwise this fix trades a stale note for lost input.

## 🟡 STUDY19-NOTES — checked and clean, or noted without a finding
- **Recurring family (a) — missing `isFlagged`:** no new pool in this flow. The swipe layer and the dock
  both read `S.items`, which is built by pools already audited (STU-03, SIDE-01, SL-02). Nothing new to add
  to the 18-pool count.
- **Family (b) — `box`-less card state → `NaN`:** `rateCard` calls `rateSRS`, hardened in REV-01, and
  `classifyItem` (`:5057`) reads `s.box<0` on a `NaN` box, which is `false` — so a Visualize-quiz card is
  silently classified `rev` rather than `hard` in the remaining-mix bar. Wrong, but cosmetic and it does not
  crash; folding it into REV-01's outstanding repair pass is better than a separate fix.
- **Family (c) — non-integer answer key:** `isMcqCard` gates the MCQ path and was hardened in MX-05/QB-01;
  the swipe path calls `mcqNext()` only after `isMcqCard(it)`, so nothing new reaches an unvalidated `ans`.
- **Family (d) — `r.json()` on HTML 413/502:** no network call in this flow. Clean.
- **Re-rate guard (REV-05) restated, now via gesture:** the ✓/✗ path still has no `S.answered` guard, and
  the swipe layer adds a second way in — a fast left-swipe during the render is not debounced the way
  MG-02's `_lock` debounces Mega. Not a new bug, but it widens REV-05's surface; whoever fixes REV-05
  should put the lock in `rateCard`, not in the button handler.
- **`markSwipeUsed()` writes `localStorage` on every single swipe** (`:5132`) even once `SWIPE_USED` is past
  the threshold and the value can no longer change any behaviour. Harmless, but it is a synchronous write
  on the touch path of the app's highest-traffic screen and is free to drop (`if(SWIPE_USED<3)`).
- **`swipeAct('up')` is dead by design** (`:5144`, "starring by accident was too easy") yet the `touchend`
  handler still spends a comparison detecting it (`:5171`) and the comment block above still advertises
  "↑ star" (`:5126`). Delete the branch or the comment — a future reader will implement the comment.
- **`touchstart`'s control blacklist** (`:5165`) covers `.vizmiss,.vizinlinehost,.vizctrl,input,select,textarea,.mcqopt,.ratebtns,.navbtns`
  but **not** the inline `<button>` chips rendered at `:4893`/`:4954` ("📄 Show in the note" / "🎙 mm:ss in the
  lecture"), which carry no class from that list. A slightly draggy tap on that chip is eaten as a swipe.
  Low frequency, one-word fix (add `button` to the selector), but it is on the card-source affordance the
  dock work above is meant to make more useful.
- **`MB_STUDY_ADD` itself is sound on types:** `sec=Math.round(sec)||0` rejects `NaN`, `d.study` defaults to
  `{}` (`:1135`), and `sync.js:146` merges per-day seconds with `Math.max`, which always returns a Number —
  so no string-concatenation corruption path exists here. Checked specifically for the non-integer family.
- **Timer flush cadence is fine** — `flush()` is wired to the 10s loop, `visibilitychange`, `blur`,
  `beforeunload` and `pagehide` (`study-timer.js:252,262,345,346,349,350`). The problem is TIM-01's silent
  failure, not the trigger coverage.
- **Ordering note for Frank:** SWP-01 is the cheapest of these (one predicate, five call sites) and it is
  the one that pairs with the flow-26 `sw.js` batch — there is no point fixing NTF-02's empty `#/nudge`
  session and shipping a session the student can't swipe. TIM-01's step 1 (`persist()` telling the truth
  about quota) is the highest-value line in this flow and belongs with SET-01/SET-02, since a storage-full
  device is also a device whose backup is failing.

---

## Flow 23 — Search + Cram sheet + AI tutor (`pageSearch` `:5359`, `searchRun` `:5365`, `pageCram` `:5754`, `pageAI` `:6069`) — 2026-08-22
**LOG-ONLY — no code changed.** Part A (`node qa/engine-scenarios.mjs`) exited 0, all 6 scenarios PASS; nothing logged for it.
Note: the line numbers in the flow-19+ block of QA-PROGRESS.md are stale by ~185 lines (`pageSearch` is at `:5359`, not `:5174`;
`pageCram` `:5754` not `:5569`; `pageAI` `:6069` not `:5884`). All references below are to the file as of this run.

### SCA-01 — HIGH — the cram sheet prints questions with no answers, and one whole topic is 100% blank
`pageCram` (`app.html:5756-5761`) builds every row from `cramLine(c)` (`:1615`), which pulls the answer **only** from a
`**bold**` span and the takeaway **only** from a `>> ` line. If a card's `a` is plain prose both come back `''`, and the
template drops the `.ca` and `.ct` divs entirely — the row renders as a bare numbered question. No fallback to `c.a`, no
marker, no count, no warning.
Measured against the real content directory: **113 of 2203 recall cards (5.1%) have neither marker — and all 113 are the
same topic, `content/OG/.../Embryology of the Cardiovascular System/recall.json`, whose cram sheet is therefore 113
numbered questions and ZERO answers.** (Sample card: `q:"When does the cardiovascular system develop?"`,
`a:"From 18 days to 12 weeks — it is the earliest functional system in the body."` — a perfectly good answer, invisible
because it has no asterisks.)
Why it matters: the page header says "113 points — **the bold answer and takeaway from every recall card**, on one page",
the ▸ Print / save PDF button is right there, and this is by design a night-before artifact that leaves the app. A student
prints it, gets a blank quiz, and has no way to know the answers exist in the deck. The failure scales with authoring
inconsistency and is completely silent.
PROPOSED: in `cramLine`, when `bold` is empty fall back to the first sentence/short clause of `stripMd(c.a)` (`:1444`)
rather than returning `''`; and surface a count in `pageCram`'s sub-line ("N cards have no highlighted answer"). `cramLine`
is NOT part of the frozen engine (not in the SMART set), so this is safe to fix during the pilot. A content-side pass to add
`**` to that one topic also works but the renderer should not silently depend on an authoring convention.

### SCA-02 — MEDIUM — the cram sheet has no `isFlagged` filter, so reported-wrong cards get printed (family (a), 19th pool)
`pageCram:5756` — `const cards=(t.recall||[]);` — no guard, unlike `sessionRecallIds` (`:1327`), `buildQueue` (`:1666`) and
the 16 other pools already logged. A card the student explicitly reported as wrong — and which the app then hides from
study, review, hard, leeches, mistakes and the nudge — is printed on the cram sheet, numbered and styled identically to
trusted cards, with its wrong answer in the answer colour. Worse than the session pools because the output is a PDF that
leaves the app and gets memorised, with no flag UI on it at all.
PROPOSED: `.filter(c=>!isFlagged(cid(t.id,'recall',c)))` (matches the `cid` signature at `:1176`), and print "N hidden"
in the sub-line so the point count still reconciles with the deck.

### SCA-03 — MEDIUM — cram sheet ignores the primer deck and has no empty state
`pageCram:5756` reads `t.recall` only. A topic that is `ready` on primer cards renders `<div class="cramsheet"></div>` —
an empty bordered box under "📄 Cram sheet · 0 points — the bold answer and takeaway from every recall card". Same shape as
STU-04's empty study screen: a dead end that reads like the content is broken. Note also that `t.ready` does not imply
`recall.length`, so this is reachable, and the "Drill this deck →" button beside it starts an empty deck.
PROPOSED: `if(!cards.length)` → an explicit empty state with a real action (＋ Add cards / open the note), and consider
appending the primer deck as a second section rather than silently omitting half the topic.

### SCA-04 — MEDIUM — typing while the tutor is replying silently destroys the message
`aiSendFromInput` (`:6051`) clears the box — `el.value=''` — and *then* calls `aiSend`, whose first real statement is
`if(AIBUSY) return;` (`:5934`). Tap ➤ (or hit Enter) while the previous reply is in flight and the typed answer is gone:
no error, no re-fill, no queue, no disabled state on the button to warn you. Compounded by the fact that `aiSend` calls
`render()` twice (`:5944` busy, `:5966` reply), and `pageAI` rebuilds `#aiin` from scratch each time with no value
restoration — so anything typed *during* the reply is also wiped the moment it lands, along with focus and caret.
Why it matters: the tutor's own copy invites a fast back-and-forth ("Type your answer…"), replies take seconds, and this
is the exact rhythm in which a student types their next answer early. The app teaches the habit and then eats the input.
PROPOSED: test `AIBUSY` in `aiSendFromInput` *before* clearing (and disable/spin the send button while busy); and preserve
`#aiin`'s value across renders the way `render()` already preserves the search box (`:6359` — same problem, solved).

### SCA-05 — MEDIUM — the error bubble is replayed to the model as its own previous turn
`aiSend`'s catch (`:5973`) pushes `{role:'model', text:'⚠️ '+e.message+'  (check your key/model in Settings, or your data
connection)'}` straight into `AICHAT`. `claudeTutor` (`:5902`) maps **every** history entry into the request, so the next
question sends `⚠️ AI service unavailable — check your internet…` as an `assistant` turn. The tutor is told it previously
apologised for a network error; on a flaky connection several stack up inside the 24-turn window and it starts responding
to the errors instead of resuming the answer key. Same defect in `geminiTutor`'s history map (`:5909`).
Secondary: the copy is wrong for the default engine. `tutorEngine` defaults to `deepseek-v4-flash` via Puter (`:5933`),
which has no key and no model field in Settings — "check your key/model in Settings" only applies to the Gemini path and
sends the student hunting for a setting that isn't there.
PROPOSED: tag the bubble `{role:'model', err:true}` and filter `err` entries out of both history maps; branch the copy on
the active engine.

### SCA-06 — MEDIUM — the voice quiz dies silently on any mic or transcription failure and cannot be restarted
Four exits leave `VOICE.on===true` with nothing pending: `aiListen`'s catch (`:6015`, permission denied / no mic /
`getUserMedia` throw), `finishRecording` with zero chunks (`:6023`), a blank transcript (`:6030`), and the
`speech2txt` catch (`:6031`). All four do exactly `VOICE.phase=''; render(); return;`. `aiStatus` (`:6061`) then falls
through to `{k:'idle', big:'🎙 Voice mode on'}` — the orb sits there, nothing listens, nothing speaks, no message appears,
and no timer re-arms. The `✓ Done` button is hidden (it only renders when `st.k==='listen'`), so the only control left is
`■ Stop`, which reads like it would end a session that is working.
Why it matters: the most likely trigger is the most ordinary one — a quiet or mumbled answer producing an empty
transcript. The student thinks the tutor is thinking, waits, and eventually leaves. A voice quiz that stops responding
without saying so is indistinguishable from the app being broken.
PROPOSED: on all four paths either re-arm (`aiListen(topicId)` once, with a bounded retry count) or drop to a visible
recoverable state — "Didn't catch that — tap 🎤 to try again" — and never leave `VOICE.on` true with no pending operation.
A single `voiceFail(msg)` helper covers all four.

### SCA-07 — MEDIUM — `↺ Redo` deletes your question and does nothing on the text path
`aiRedo` (`:6057`) pops the last model reply, pops the last user message, calls `render()`, and only re-listens
`if(VOICE.on && sttSupported())` (`:6060`). A student on the text path — no `MediaRecorder`, or simply typing — taps Redo
and watches the exchange vanish with no replacement: the question is destroyed rather than retried, and re-asking means
typing it again from memory. The button is also enabled whenever `msgs.length && !AIBUSY`, including when the last entry
is a *user* message left behind by a failed send, in which case it pops the user turn and nothing else.
PROPOSED: capture the popped user text and re-`aiSend` it when not in voice mode; disable the button unless the last
entry is a model reply.

### SCA-08 — LOW/MEDIUM — `Clear chat` is an unconfirmed one-tap wipe, and the transcript is never persisted anyway
`clearAI` (`:6053`) does `AICHAT[topicId]=[]` with no confirm and no undo, sitting in the same `.ai2tools` row (`:6103`)
directly beside "🎤 Start voice quiz" — a mis-tap on a phone destroys the session. Separately, `AICHAT` is a plain
in-memory object (`:5851`): never written to `DATA`, never persisted, never synced. So the same loss happens on every
reload, every navigation away and back, and every iOS tab eviction — a 40-minute oral-exam session is gone with no trace
and no way to review what the tutor taught.
PROPOSED: `confirm()` on Clear. Persisting the transcript is the bigger win but is NOT free — it lands on the sync path,
so size-cap it (last N turns per topic) and read SET-10/TIM-01 on the storage budget before adding multi-KB transcripts to
`DATA`.

### SCA-09 — MEDIUM — searching "und", "ned" or "def" returns every topic that has no lecturer
`searchRun:5368` builds the haystack as `((t.name+' '+t.lecturer)||'').toLowerCase()`. Two problems in one line: `t.lecturer`
is routinely undefined (`:1875` carries an explicit comment guarding against exactly this stringification on the Home
tile), and the `||''` fallback is dead code because string concatenation always yields a truthy string. So the searchable
text for such a topic is literally `"Cardiac cycle undefined"`, and **any query that is a ≥2-char substring of "undefined"
— "un", "nd", "de", "ef", "fi", "in", "ne", "ed", "ine", "ned", "defi" — matches every lecturer-less topic in the
library**, capped at 25 and printed *above* the real card hits under a confident "Topics · 25" heading.
PROPOSED: `[t.name, t.lecturer].filter(Boolean).join(' ').toLowerCase()`. One line, no behaviour change for topics that
do have a lecturer.

### SCA-10 — MEDIUM — a search hit cannot take you to the card it found
Every card result routes to `go('study/${x.t.id}/${x.dk}')` (`:5382`) — i.e. `startDeck`, which restores `DATA.pos` and
ignores the matched card completely. Search a term, tap the single card that mentions it, and you land on card 41 of 60
with no path to the card you searched for; the match index is computed, rendered, and thrown away. This is SL-01's shape
on the one screen whose entire purpose is "take me to this specific thing".
It is also STU-09's destroy-a-live-session path with a realistic trigger: Search is in the library nav (`:1909`), so it is
reachable *mid-session*, and one tap on a result replaces the running daily/hard session with a deck.
PROPOSED: carry the index — `study/<id>/<deck>/<i>` — and have `startDeck` honour an explicit index in preference to
`DATA.pos` **without writing it back** (STU-01's rule). Minimum viable version: don't clobber the saved position when the
route came from search.

### Notes (not filed as bugs)
- **Search never matches answers.** `searchRun:5372` tests `c.q` only. The placeholder says "card questions" so it is
  honest, but a student searching a term that appears only in an answer body gets "No matches" for content that exists.
  Card search is also correctly gated on `t.ready` (`:5370`), so un-built topics stay invisible — right call.
- **The topic cap is undisclosed.** Card hits say "Showing first 40 of N" (`:5386`) but topics are silently `.slice(0,25)`
  (`:5368`) with the heading printing the *capped* count as if it were the total.
- **`render()`'s search branch is the pattern SCA-04 should copy** — `:6359` re-runs `searchRun()`, refocuses and restores
  the caret to the end. Correct, and it is the only text input in the app that survives a re-render.
  Small side effect: `b.focus()` runs on *every* render while on `#/search`, so a background sync-triggered render pops the
  mobile keyboard back open under the user.
- **`pageCram` and `pageAI` both `return pageHome()` on a not-ready topic** (`:5755`, `:6070`) while the hash still reads
  `#/cram/<id>` — Home content under a cram URL, and Back appears not to work (REV-03/TOP-04 family, non-fatal variant).
  On a cold start this is also NTF-02's shape: the boot `render()` at `:6390` runs before `content-loader.js` at `:6410`,
  so `topById` is empty and a deep link into a cram sheet or the tutor lands on Home once and never rebuilds.
- **Neither page calls `guard()`** — restates ENT-03. The AI tutor is the most expensive surface in the app (unbounded
  Puter chat + speech2txt + TTS per student) and is completely ungated.
- **Escaping is clean here.** Every interpolation in all three pages goes through `esc()` (`:981`) — `c.q`, the cram answer
  and takeaway, `m.text`, `t.name`. No `innerHTML` sink of the ENT-08 kind in this flow.
- **Family (b) NaN box:** none of the three reads `s.box` — cram renders content only, search matches `c.q`, the tutor
  reads `t.recall`. Clean.
- **Family (c) non-integer answer key:** no `ans` / MCQ path in this flow. Clean.
- **Family (d) `r.json()` on an HTML 413/502:** `claudeTutor` goes through `window.puter.ai.chat` (no raw parse), and
  `geminiTutor:5917` does `await r.json().catch(()=>({}))` — **correctly guarded, and it is the only call site in the repo
  that is.** That is the exact pattern IMP-03 / TOP-05 / SOLVE-03 should be fixed to; point their fix at this line.
- **Ordering for Frank:** SCA-09 is a one-line fix and the cheapest thing in this flow. SCA-01 is the highest-value one —
  it is the only finding here that produces a wrong artifact the student takes *out* of the app, it has a named
  reproduction (open `#/cram/` on Embryology of the Cardiovascular System), and `cramLine` is outside the freeze.
  SCA-02 should ship with SCA-01 since both are edits to the same six lines.

---

# Flow 20 (19+ block) — `cram` route — 2026-08-22 — **log-only, nothing changed**

Scope: `pageCram` (`app.html:5759-5773`), `cramLine` (`:1615-1620`), the print stylesheet (`:617`), the three entry
points (`jbActs :2026`, topic body `:2460`, `modeSwitcher :2500`), the router case (`:6340`) and the separate
**"Exam cram" session mode** `startSession('cram')` (`:4312-4314`). Round-2 flow 23 already covered the *content*
side of this page (SCA-01/02/03); this pass took the parts it did not — the **print path**, the **edit path** and the
**mode of the same name**. SCA-01/02/03 are re-confirmed at the bottom, not re-litigated.

## 🟠 CRAM-01 — The cram sheet ignores every correction the student has made to their cards — MEDIUM — logged
`app.html:5762` — `pageCram` maps over the raw content objects: `cards.map((c,i)=>{ const {ans,take}=cramLine(c); …
esc(c.q) … })`. It never calls `effCard(id, c)` (`:1332`), the accessor that overlays `DATA.cardEdits`.
Every other card-rendering surface in the app does: `cardActionsRow`-adjacent render (`:1358`), `speakCurrent`
(`:1572`), `rateCard` (`:4902`), `mcqNext` (`:4984`), `step` (`:5096`). `pageCram` is the only reader that does not.

Why it matters: a student who spots a wrong AI answer, taps ✎ and fixes it, then hits **🖨 Print / save PDF** carries
the **uncorrected** answer into the exam hall — on the one artifact that leaves the app and is used without the app
next to it. It is also silently inconsistent: the same card reads one way when drilled and another way when printed.
This is the LIB-02 family (`cardEdits` is a store with more writers than readers).

PROPOSED (one line, safe, outside the freeze):
```
const rows=cards.map((c0,i)=>{ const c=effCard(cid(t.id,'recall',c0), c0); const {ans,take}=cramLine(c); …
```
`cid(t.id,'recall',c0)` must be computed from the **original** object, since `cid` hashes the card content.
Ship with SCA-01/SCA-02 — same six lines.

## 🟠 CRAM-02 — The print stylesheet hides nothing it is trying to hide; the PDF comes out with the sidebar, a 248px indent and the AI dock printed over it — MEDIUM/HIGH — logged
`app.html:617`:
```
@media print{ .nav,.topbar,.btnrow{display:none!important} .cramsheet{border:0} … }
```
**`.nav` and `.topbar` match zero elements in the document.** Verified: `grep -c 'class="nav"' app.html` → 0,
`grep -c 'class="topbar"' app.html` → 0, and `.topbar` appears nowhere in the CSS either. The sidebar is
`<nav id="sidebar">` (`:970`) — a *class* selector `.nav` does not match a `<nav>` **element**. So the only rule that
fires is `.btnrow{display:none}`, which correctly hides the Print button itself. Everything else prints:

- **`#sidebar`** (`:29`) — `position:fixed; width:248px; top:0; bottom:0; z-index:50`, opaque `--panel`. Fixed
  elements paint on page 1 of a print job, so the full student nav is stamped over the top-left of the first page.
- **`#main{margin-left:248px}`** (`:31`) is never reset — on A4 portrait (~794 CSS px) that eats ~31% of the page
  width for every page, and `max-width:1000px` does not save it; long cram questions wrap into a narrow gutter column.
- **`#mbDock`** (`study-dock.js:55`) — `position:fixed; top:0; right:0; bottom:0; width:min(420px,92vw);
  background:#fff; z-index:100001`. `MB_DOCK.onStudyScreen` (`app.html:991`) **includes `'cram'`**, and the dock
  defaults to `isOpen = isDesktop()` when the student has no saved preference (`study-dock.js:188`) — so on the
  desktop-first "print my cram sheet" path the *default* state is a 420px opaque white panel covering the right
  half of page 1.
- **`#mbDockTab`** (`study-dock.js:50`, fixed, z-9996), **`#mbTimer`** (`study-timer.js:107`, fixed, z-9997),
  **`#hamburger`** (`app.html:44`, fixed, shown ≤820px) — all print too.

Why it matters: "🖨 Print / save PDF" is the cram sheet's whole reason to exist and its primary CTA. The colour half
of the print rule was clearly thought about (`body{background:#fff}`, `.ca{color:#0a7}`) — the layout half has
never worked. This is cheap to verify without a device: `document.querySelectorAll('.nav,.topbar').length` → `0`.

PROPOSED (one line, replaces `:617`, no JS, no cache bump):
```
@media print{ #sidebar,#hamburger,#scrim,#mbDock,#mbDockScrim,#mbDockTab,#mbTimer,#mbtPop,.btnrow,.crumb{display:none!important}
  #main{margin-left:0!important;max-width:none!important;padding:0!important}
  .cramsheet{border:0} body{background:#fff;color:#000} .cramrow{page-break-inside:avoid} .cramrow .ca{color:#0a7} }
```
(`page-break-inside:avoid` also stops a question splitting from its answer across a page boundary — currently nothing
prevents that.) Note the `#mbDock*`/`#mbTimer` ids live in `study-dock.js`/`study-timer.js`, but the *rule* belongs
in `app.html`'s print block, so this stays a single-file edit and does not touch those modules.

## 🟠 CRAM-03 — `window.print()` is likely a dead button in the installed app — MEDIUM — logged, **needs one live check**
`app.html:5769` — `<button class="btn" onclick="window.print()">🖨 Print / save PDF</button>`, called bare with no
feature test, no fallback and no failure feedback. `manifest.webmanifest` sets `"display": "standalone"`, and MedBank
is installed-to-homescreen by design (`sw.js`, the install prompt). On iOS, a standalone-mode PWA has no browser
chrome and no share/print affordance, and `window.print()` in that context does nothing observable — no dialog, no
error, no `catch` to fire. Android/Chrome standalone does show the print dialog, and iOS **Safari** (not installed)
does work, so this is device- and install-state-specific.

Why it matters: the audience is Nigerian medical students on phones, and the printed cram sheet is the one deliverable
they'd want off-device before an exam. If it silently no-ops on installed iOS, the feature is invisible-broken for a
whole platform and would never be reported as a bug — it just looks like the button "doesn't do anything".

CHECK (Frank, 30 seconds, no code change): open the installed app on an iPhone → any topic → 📄 Cram → tap
🖨 Print / save PDF. If nothing happens, this is confirmed.
PROPOSED if confirmed: detect standalone (`window.matchMedia('(display-mode: standalone)').matches ||
navigator.standalone`) and swap the button for a "Copy as text" / share-sheet path, or at minimum toast
"Open MedBank in Safari to print this sheet" instead of a silent no-op. Do **not** wire this to `exportTopicPDF`
until flow 13's iOS runtime item is settled — that path has the same platform question open.

## 🟡 CRAM-04 — The takeaway line is never markdown-stripped, so 188 cards print literal `**` on the sheet — LOW — logged
`app.html:1615-1620`:
```
const bold=(a.match(/\*\*(.+?)\*\*/s)||[])[1]||'';
const take=(a.match(/>>\s*(.+?)(?:\n|$)/)||[])[1]||'';
return {ans:bold.replace(/\n+/g,' ').trim(), take:take.trim()};
```
`ans` is markdown-free by construction (it *is* the capture group inside the `**…**`). `take` is raw text and is
passed straight to `esc(take)` at `:5765`, so any emphasis inside a `>>` line prints as asterisks.

Measured against the shipped content tree (66 `recall.json`, 2203 cards, 2090 with a takeaway):
**188 takeaways (9.0%) contain `**`, `__` or backticks.** Samples: `**Metastases double FASTER than the primary.**`,
`**Alkylating = "glue the DNA strands so the cell can't copy them."**`, `The word **"ideal"** matters: …`.
These print with the asterisks visible on a sheet the student hands in front of.

Second, smaller half: the `(.+?)(?:\n|$)` capture stops at the first newline, so a **multi-line** `>>` block keeps
only line 1. One card in the tree hits this — the cytotoxic-toxicity mnemonic in *Chemotherapy / Hormone Therapy in
Gynaecology* prints `**Cisplatin → Kidney**` and silently drops Adriamycin→Heart, Bleomycin→Lung,
Methotrexate→Liver, Vincristine→Nerves. Rare today, but the note-generation prompt is free to emit more.

PROPOSED: strip inline markers from `take` (and join consecutive `>>` lines) —
```
const takeRaw=(a.match(/>>\s*([\s\S]+?)(?:\n\s*\n|$)/)||[])[1]||'';
const take=takeRaw.split(/\n\s*>>\s*/).join(' · ').replace(/\*\*|__|`/g,'').replace(/\s+/g,' ').trim();
```
`md()`'s `inline()` helper (`:1034`) does the same job but is closured inside `md` and returns HTML, which the cram
row does not want (it `esc()`s). Keep the local strip.

## 🟡 CRAM-05 — "Exam cram" is the one study mode that ignores exam dates and overrides the student's Mix-subjects setting — LOW — logged
`app.html:4312-4314` — the mode literally named *Exam cram*:
```
else if(mode==='cram'){ items=collectRecall(()=>true);
  for(let i=items.length-1;i>0;i--){…shuffle…}
  items=items.slice(0,40); label='Exam cram'; }
```
The `weak` branch one line above uses `orderItems(...)` (`:1631`), which — when *Mix subjects together* is **off** —
sorts by `subjectExamRank()`, i.e. nearest exam first. `cram` bypasses `orderItems` entirely and force-shuffles, so
a student who has explicitly set "Off = one subject at a time (nearest exam first)" (Settings, `:5604`) gets an
interleaved random mix anyway, and the 40-card cap then slices that shuffle — meaning **the subject they actually
have an exam in next may contribute a handful of cards or none**, purely by chance.

Not a crash and not data loss, but the mode's name is a promise about exam proximity that the implementation
contradicts, and `DATA.exams` is already populated and already ranked by `subjectExamRank()`.
PROPOSED: `items=orderItems(collectRecall(()=>true)).slice(0,40)` — one line, reuses the existing helper, and keeps
the shuffle for students who have interleave **on** (which is the default) because `orderItems` shuffles in that
branch anyway. Frozen-engine check: `orderItems`/`subjectExamRank` are not in the SMART set — safe.

## 🟡 CRAM-06 — A not-built topic renders Home under the `#/cram/<id>` URL — LOW — logged
`app.html:5760` — `const t=topById(topicId); if(!t||!t.ready) return pageHome();`. The hash stays `#/cram/<id>` while
the Home page is drawn, so the nav highlight, the back button and any reload all disagree with what is on screen, and
`pageHome()` (~8 full passes over the card set, per HOME-NOTES) is paid for a route the student did not ask for.
The router's `NEEDS_TOPIC` loader (`:6322`) covers the *content-not-loaded-yet* case correctly; this is the
*loaded-but-not-ready* case, which falls through it.

All three in-app entry points are inside `t.ready` branches, so today this is only reachable by URL, a stale
bookmark, or a topic that was ready and then reloaded un-built — hence LOW.
PROPOSED: return a real empty state (`crumbs` + "This lecture hasn't been built yet" + a ＋ Add a lecture / back
button), matching the STU-04 / LIB-06 / PRG-06 pattern this repo has now applied five times.

## 🔵 CRAM-NOTES — checked and clean, plus re-confirmations
1. **SCA-01 re-confirmed with a fresh count.** Re-ran `cramLine` over the shipped tree: 2203 recall cards,
   **113 (5.1%) produce a completely blank cram row**, and all 113 are still the single topic
   *Embryology of the Cardiovascular System*. Its cram sheet is 113 numbered questions and zero answers under a
   header promising "the bold answer and takeaway from every recall card". Unchanged, still the highest-value fix here.
2. **The "only the first `**bold**` is used" behaviour is CORRECT, not a bug.** 1644 of 2203 cards (74.6%) contain
   more than one bold span, but the content format is `**lead answer**\n\n## Understanding it\n- …**emphasis**…`, so
   the first span *is* the answer and the rest are mid-body emphasis that the sheet rightly drops. Checked so nobody
   "fixes" this later into concatenating them.
3. **`ans` has zero residual markdown** — 0 of 2090 extracted answers contain `*`, `_`, `` ` ``, a link or a heading.
   Only `take` has the problem (CRAM-04).
4. **Escaping is clean** — `esc()` on `c.q`, `ans`, `take`, `t.name`; no ENT-08-style `innerHTML` sink on this route.
5. **LIB-03 family clean** — `(t.recall||[])` is guarded at `:5761`; no `.length` crash on a half-built topic.
6. **Families (b) `NaN` box, (c) non-integer answer key and (d) `r.json()` on HTML did not reach this flow** — the
   cram sheet reads no card state and makes no network call at all.
7. **Family (a) `isFlagged` — restated, not re-counted.** SCA-02 already logged the cram sheet as the 19th pool with
   no flag guard; `pageCram:5761` still reads `t.recall` directly. It remains the worst instance because a
   reported-wrong card is *printed in the answer colour on a PDF that leaves the app*. Fix with CRAM-01 — same map.
8. **SCA-03 restated** — no primer deck, and `cards.length===0` yields "0 points", an empty box and a live
   "Drill this deck →" into a dead deck. Fold the empty state into CRAM-06's fix.
9. **ENT-03 restated with the export angle.** `pageCram` calls no `MB_PAYWALL.guard()`, and `guard()` still has zero
   call sites anywhere. The cram sheet is therefore the app's highest-leverage ungated surface for getting content
   *out*: every answer in a lecture, on one page, one tap from a PDF, available to a basic-tier account and to an
   archived (nominally view-only) level. Worth naming explicitly when ENT-03 is scheduled.
10. **`document.title` is never set for print**, so a saved PDF is named after the page URL rather than the topic.
    Cosmetic, but it is one line next to CRAM-02's fix and it is the file the student then has to find again.

**Ordering for Frank:** **CRAM-02 is the cheapest high-value item in this flow** — one CSS line, no JS, no service-worker
cache bump, and it repairs the only artifact the student takes out of the app. Ship CRAM-01 + SCA-01 + SCA-02 together
(all three are edits to the same `cards.map` at `:5761-5766`). CRAM-03 is blocked on one 30-second device check.
CRAM-04/05/06 are one-liners that can ride along. Nothing in this flow touches the frozen engine.

## Flow 19+ item 21 — `mistakes` route: pool + drill-missed (`missItems` `:1605-1612`, `pageMistakes` `:5743`, `startMistakes`/`runMistakes` `:4607-4612`, `qbStartMistakes` `:3037`) — 2026-08-22
**LOG-ONLY — no code changed.** Part A: all four harnesses exited 0 — `qa/engine-scenarios.mjs` (6/6),
`qa/gap-loop.mjs` (7/7), `qa/fix-queue.mjs` (11/11), `qa/flow-e2e.mjs` (18/18). Nothing logged for Part A.
Round-2 flow 20 (SIDE-01..10) already covered the *pool semantics* (`isFlagged`, never-cleared-on-correct,
`lapses` never decaying). This pass took what it did not: the **route** — `pageMistakes`'s rows and buttons, the
`startMistakes` → `pageReview` runner, the summary screen it lands on, and the separate Q-bank `qbStartMistakes`
path named in the item title as "drill-missed".

### MIS-01 — MEDIUM/HIGH — a mistakes drill is chrome-identical to the daily session, and its summary reports the *daily* pool
`startMistakes` (`:4607`) builds `S={mode:'daily',key:'mistakes',label:'Recent mistakes',…}` and `runMistakes` (`:4612`)
sends it to `#/review`. `pageReview` (`:4690`) renders the **daily** chrome unconditionally: the new/review/hard mix bar,
"~N min left", and no mode pill. **`S.label` is never read anywhere in the app** — `grep -n "S\.label" app.html` returns
nothing; the only `.label` reads are `x.label` inside `startBucket`'s arrows (`:4794`). Compare `pageHard` (`:4716`),
which does print a `★ Hard cards` pill. So a student who taps "This week · 23 cards" lands on a screen that says
nothing about mistakes and is pixel-identical to today's review.
It gets worse at the end. `sessionSummary` (`:4743`) is called as `sessionSummary('Back to Active Recall','today')` and
computes `const remain=dueCount(), cleared=(remain===0)`. `dueCount()` is the **global daily due count** — a different
pool from the one just drilled. Consequences, all on the mistakes route:
- finishing a mistakes drill with an empty daily queue prints the headline **"Active Recall complete!"** to a student
  who never opened active recall;
- the "Keep going · N more cards" button (`:4767`) calls `startRecallSession()` and **silently switches them into the
  daily session** under the same `#/review` URL — the third instance of "a button on screen A starts session B";
- `remain` inherits SL-02's missing `isFlagged` guard, so N can count cards the app promised to hide;
- the primary CTA goes to `#/today`, **not back to `#/mistakes`**, so the student never sees whether the mistakes pool
  shrank. It did not (SIDE-03), which is precisely why not showing them is convenient-looking and wrong.
**Why it matters:** the page's whole promise is a closable loop — "Clear them while they're fresh" (`:5745`). The runner
never tells you you're in the loop and the summary never tells you the loop closed. Together with SIDE-03 (nothing is
ever removed from `missLog` on a correct answer) the route is a loop that neither completes nor reports.
**PROPOSED:** (a) render `S.label` in `pageReview` as a pill when `S.key!=='daily'` — one span, and it fixes `leeches`,
`custom`, `weak` and `drill:<id>` at the same time; (b) in `sessionSummary`, take the "cleared / remain" numbers from
`S.key`'s own pool rather than `dueCount()` — for a keyed side-session, `remain` should be that pool's residual and the
back-route should be `S.key`; (c) at minimum, gate the "Active Recall complete!" headline on `S.key==='daily'`.

### MIS-02 — MEDIUM — reloading during a mistakes drill silently replaces it with a *different* session at the same URL
`pageReview`'s rebuild guard is `if(!S || S.mode!=='daily') startRecallSession(0)` (`:4691`) — it checks `S.mode`, never
`S.key`, and `startMistakes` deliberately sets `mode:'daily'`. `S` is in-memory only. So on any reload, tab restore or
cold open of `#/review` mid-drill, `S` is null, the guard fires, and the student gets **today's daily session** —
same URL, same chrome, entirely different cards — with no notice and no resume. Every other side-session route
self-heals because it owns a hash (`#/hard` → `startHard`, `#/leeches` → `pageLeeches`, `#/nudge` → `startNudgeSession`);
`mistakes` is the one that hands its session to a route it does not own.
This is the same identity-vs-completion confusion as SIDE-05 and NTF-02, but inverted: there the guard was too strict
and blocked a needed rebuild; here it is too loose and permits a wrong one.
**PROPOSED:** give the drill its own route (`#/mistakes/drill/<days>`) with a `S.key!=='mistakes'` rebuild guard, so a
reload rebuilds the *mistakes* session. Cheap interim: persist `{key,days}` to `DATA.flags._lastSide` on start and have
`pageReview` rebuild from it. Note this also removes the MIS-01(b) ambiguity, since the route then knows its own pool.

### MIS-03 — MEDIUM — the mistakes list shows the *uncorrected* text of every card the student has fixed
`pageMistakes` builds each row from `esc(it.c.q)` (`:5751`) — the raw content-tree card. It is one of the few
card-rendering surfaces that never calls `effCard(it.id, it.c)`; the five that do are `:1358`, `:1572`, `:4902`,
`:4984`, `:5096`. `pageLeeches` (`:5736`) has the identical hole.
**Why it matters:** the student most likely to have used ✎ Edit / "fix this card" is exactly the student staring at a
list of cards they got wrong. They correct a card, then the Mistakes page keeps showing them the old wording — and
tapping through to the drill shows the corrected one (the runner *does* call `effCard`), so the app contradicts itself
one tap apart. Same family as CRAM-01 and LIB-02; this is the third instance and the cheapest.
**PROPOSED:** `const c=effCard(it.id,it.c)` at the top of both row maps, then `esc(c.q)`. Two lines, no state change.

### MIS-04 — MEDIUM — `DATA.missLog` is append-only forever: nothing prunes it and sync resurrects every delete
Three separate mechanisms, and they compound:
1. `logMiss(id)` (`:1605`) writes `DATA.missLog[id]=dstr()`. The **only** delete site in the whole app is the topic
   reset (`:1395`). Correct answers never clear it (SIDE-03).
2. `missItems(days)` (`:1606`) *filters* by date but never *removes* — an entry from March is skipped on every read
   and kept on disk forever.
3. `sync.js:149` union-merges `missLog` with `mergeMap(..., "a")`. Union means removal cannot propagate, so even the
   topic-reset delete is undone by the next pull — **SET-01 class, and the same shape as SIDE-02's `starred`**.
**Why it matters:** `missLog` is serialised into every `persist()` and every sync payload, and it grows with one entry
per card ever missed, for the life of the account, with no ceiling and no user-facing way to clear it. That feeds
directly into TIM-01/SET-10's quota risk — and `persist()` swallows `QuotaExceededError` in a bare catch, so the
failure mode is silent data loss elsewhere. There is also a read cost: `missItems` walks the entire map and calls
`itemById` per surviving key, and `pageMistakes` calls it **twice** per render (`:5744`), while `missCountWeek()`
(`:4877`) walks it again on every Today render.
**PROPOSED:** (a) prune on write — in `logMiss`, drop any entry older than ~30 days (a cheap sweep, bounded by the
longest window any caller uses, 7); (b) treat `missLog` the way SIDE-02's fix treats `starred` — record deletions as
tombstones (`missLog[id]=0` or a `_delMiss` set) so union-merge can carry a removal, since a plain `delete` provably
cannot. (a) is safe on its own and shrinks the blob immediately; (b) must land with SIDE-02/SIDE-03 or those fixes
will appear to work locally and silently revert on the next sync.

### MIS-05 — MEDIUM — every "Open" button on this page opens the deck at the *saved place*, not the card you tapped
Each row's action is `go('study/${it.t.id}/recall')` (`:5752`) → `startDeck`, which restores `DATA.pos['pos:'+id+'recall']`
and ignores which card was clicked. A student looking at "you missed *this* question on Tuesday" taps Open and lands on
card 41 of 60 — the cards they most recently *passed*. `it.id` and the card's index are both in hand and both discarded.
This is SL-01 / SCA-10's shape on a third screen, and here it is the *only* per-card action the page offers.
It also carries STU-09: `startDeck` overwrites `S`, so tapping Open mid-session destroys a live daily/hard/nudge
session with no confirmation.
**PROPOSED:** route to a card-addressed form (`study/<t.id>/<deck>/<index>`) and have `startDeck` honour a supplied
index instead of `DATA.pos` — one change that closes SL-01, SCA-10 and MIS-05 together. Guard the session-destruction
with the same confirm STU-09 proposes. Note `it.deck` is already on the item, so the hard-coded `/recall` should
become `/${it.deck}` while touching this line (not currently reachable — `canRate=!isP` at `:4998` and the MCQ path's
`deck!=='primer'` test at `:4983` mean primer cards cannot enter `missLog` today — but it is a latent trap for anyone
who later makes primer ratable).

### MIS-06 — LOW/MEDIUM — the mistakes drill is unbudgeted, uncapped and counts as ordinary daily review
`startMistakes` (`:4607`) does `shuf(missItems(days))` and takes **all** of it — no `greedyBudget`, no `orderItems`, no
size picker, unlike `startRecallSession` (`:4823-4826`, which offers explicit sizes) and `customSessionStart` (`:4413`,
which calls `greedyBudget(orderItems(pool), min)`). A student with 90 misses this week taps one button and gets a
90-card session whose only exit is ✕ End. Same gap SIDE-07 found in leeches/mistakes; restated here because the button
copy — "This week · 90 cards" — is the *only* warning, and the meter then reads "~35 min left" against a stated
15-minute budget.
Because `mode:'daily'`, the drill also feeds `logRate`/`logDaily`/`touchTopic`/streak as ordinary review and re-runs
`rateSRS` on every card, re-scheduling cards off their SRS interval (SIDE-03's off-schedule re-rating, now with a
session size that makes it likely).
**PROPOSED:** run the pool through `greedyBudget(orderItems(pool), DATA.daily.budget||15)` like the custom session, and
offer the same size chips `startRecallSession` already has. Do not change `rateSRS` — that is engine-adjacent.

### MIS-07 — LOW — the mistakes list silently truncates at 60 rows
`week.slice(0,60)` (`:5750`) with no "showing 60 of 90", no count line and no paging. The button above it says 90.
`pageLeeches` (`:5736`) has the same `slice(0,60)`; `qbStartMistakes`'s dashboard list has `mk.slice(0,8)` (`:3033`)
under a heading that *does* print the true count, which is the pattern to copy.
**PROPOSED:** append a muted "Showing 60 of ${week.length}" row when truncated. One line, both pages.

### MIS-08 — LOW — `missItems`' comparator never returns 0, so same-day rows reorder between visits
`out.sort((a,b)=> a.missOn<b.missOn?1:-1)` (`:1610`). For two entries with the same `missOn` — i.e. every pair of
cards missed on the same day, which is most of the list — `cmp(a,b)` and `cmp(b,a)` **both** return `-1`. That
violates the comparator contract, and V8 is free to produce a different arrangement per call. So "Today's misses"
renders in an arbitrary order that changes on each visit to the page, with no stable secondary key.
`leechItems` (`:1601`) does this correctly (`b.lapses-a.lapses`, returns 0 on ties), so the fix is a one-character class
of change and the correct pattern is already in the file two lines up.
**PROPOSED:** `out.sort((a,b)=> a.missOn===b.missOn ? (a.id<b.id?-1:1) : (a.missOn<b.missOn?1:-1))` — stable, still
newest-first.

### MIS-09 — LOW — `missItems` has no `isFlagged` filter (SIDE-01 restated; the count is now 20 pools)
`missItems` (`:1606-1609`) walks `DATA.missLog` raw. A card the student reported as wrong and asked to hide is
auto-written into `missLog` by both rating sites (`:5079`, `:5191`) and then shown on this page, counted in
`missCountToday`/`missCountWeek`, used to enable/disable both mode buttons (`:4877`), and served inside the drill.
Logged in full as SIDE-01; restated because this route is where the student *sees* it, and because the one-line guard
(`if(isFlagged(id)) continue;`) belongs in the same edit as MIS-03 and MIS-08 — all three are inside 6 lines of code.

### MIS-NOTES — checked and clean, plus the Q-bank half of the item
1. **`qbStartMistakes` (`:3037`) — the "drill-missed" path — is sound and is the model the card side should copy.**
   `qbAgg` (`:2932`) derives mistakes from `lastByQ`, i.e. the student's **most recent** attempt per question hash, so
   getting a question right in the retry session removes it from the pool automatically. That is exactly the closable
   loop `missLog` fails to be (SIDE-03/MIS-04). The dashboard heading also prints the true count next to a truncated
   list, which is MIS-07's fix. Worth citing when SIDE-03 is scheduled.
2. **Count/pool consistency is correct on this route** — unlike SL-01, both buttons and both labels come from the same
   `missItems(days)` call the drill uses (`missCountToday`/`missCountWeek` `:1611-1612` vs `runMistakes` `:4612`). The
   only mismatch is the flagged-card one (MIS-09), which is upstream of both.
3. **`itemById` (`:1433`) returns a fresh object per call**, so `it.missOn=…` (`:1609`) does not mutate the shared
   `cardIndex()` entry. Same for `leechItems`' `it.lapses`. No aliasing bug here.
4. **`yesterdayStr` exists** (`:1172`, `dstr(new Date(Date.now()-864e5))`) — checked because `dayLabel` (`:5303`) calls
   it inside the row map and `render()` still has no try/catch (STU-02), so a missing symbol would blank the whole
   page. It is defined. Narrow nit only: fixed-86,400,000ms arithmetic can mislabel "Yesterday" within ~1h of midnight
   on the two DST transition days. Not worth a fix.
5. **Family (b) `NaN`** — `dayNum(new Date(missLog[id]+'T00:00'))` yields `NaN` for a corrupt value, `NaN>=cut` is
   false, and the entry silently vanishes rather than crashing. Safe by accident, already noted in the SIDE block.
   Family (c) and (d) cannot reach this route — it reads no answer key and makes no network call.
6. **Escaping is clean** — `esc()` on `c.q`, `t.name`, `t.subject.short`; `dayLabel` output is app-generated. No
   ENT-08-style sink. `pageMistakes` calls no `MB_PAYWALL.guard()`, consistent with ENT-03's zero call sites.
7. **The empty state is good** — `!week.length` returns a real ✓ panel with a working CTA (`:5746-5748`), unlike
   STU-04's buttonless dead end. No change needed.

**Ordering for Frank:** **MIS-03 + MIS-08 + MIS-09 are one edit** (six lines, `missItems` and the row map) and are the
cheapest thing in this flow. **MIS-01 is the highest-value** — rendering `S.label` and keying the summary off `S.key`
fixes the mistakes, leeches, custom, weak and drill-topic sessions in one change, and it is the only finding here a
student would describe as "the app told me something untrue". **MIS-04(b) must ship with SIDE-02/SIDE-03** or those
fixes will silently revert on sync. Nothing in this flow touches the frozen engine; `rateSRS` is named only as the
thing *not* to change.

---

## Flow 24 — Study timer + Study dock (`study-timer.js`, `study-dock.js`, the `MB_STUDY_*` / `MB_DOCK` bridge at `app.html:984-1009`)
Reviewed 2026-08-22, **log-only, nothing changed**. Part A regression harnesses all exit 0 this run
(`engine-scenarios`, `gap-loop`, `fix-queue`, `flow-e2e`), so nothing was logged for Part A.

### DCK-01 — HIGH — "Save note" writes your note onto the PREVIOUS card (the dock never re-renders when the card changes)
`study-dock.js:103` captures `ctx` **once per render**, and `:166` closes over it:
`save.onclick=function(){ d.saveNote(ctx.cardId, noteTa.value||""); … }`.
The dock only re-renders on **`hashchange`** (`:191`), on a manual tab click (`:140`), or via
`open()`/`MB_DOCK_SOURCE`/`MB_DOCK_FOLLOW`. But advancing a card **does not change the hash** — `step()`
(`app.html:5114`, `:5161`, `:5205`), `rateSRS`, `shuffle` (`:5129`) and `restartDeck` (`:5130`) all just call the app's
own `render()`, which rewrites `#main` and leaves `location.hash` alone. `study-dock.js` exports only
`MB_DOCK_OPEN`, `MB_DOCK_SOURCE` and `MB_DOCK_FOLLOW` — there is **no refresh entry point at all**, and `app.html` never
calls one (only refs are `:2788`, `:3416`, `:3871`, `:3891-3892`, `:3918`, `:4974`, `:5035`, all *open* calls).

Consequence, on the app's core loop: open the dock on ✍ Note at card 1 → press Next a few times → the textarea still
shows **card 1's note**, and the student types their note for card 5 into it. Hitting Save calls
`setNote(<card 1 id>, "<card 5's note>")`, which **destroys card 1's note and never stores card 5's**. Two losses per
save, silent, on a field the UI explicitly promises is "synced with your account" (`:132`).
The ✨ Ask tab is stale in the same way — `MB_DOCK.ask` (`app.html:1003`) injects `ctx.cardQ` as *"The card on screen
asks: …"*, so the tutor is told about a card the student passed several rates ago; and 📄 Source keeps the old card's
`hl` phrase.
**PROPOSED:** export `window.MB_DOCK_REFRESH = function(){ if(isOpen && onStudy()) render(); apply(); }` from
`study-dock.js` and call it at the end of `app.html`'s `render()` (one line, next to `renderNav()`), guarded by
`try{}catch{}`. Cheap hardening on top: in `save.onclick`, re-read `d.ctx()` at click time and abort with a toast if
`cardId` no longer matches the one rendered, so a stale panel can never write.

### DCK-02 — HIGH — "📄 Show in the note" is a silent no-op in the Mega Q-bank and in the V1.6 gap loop
`MB_DOCK.onStudyScreen` (`app.html:991`) whitelists
`['topic','study','review','cram','hard','leeches','mistakes','nudge','hardnudge']`.
**`mega` is not on that list**, and `exam`, `solve`, `folder`, `search` aren't either.
The Mega Q-bank is a *state* overlay, not a route: `pageMega` (`app.html:3597`) renders `qbQuestionHtml()` while the
hash stays `#/mega`, and `qbStart`/`qbExit` (`:2671`, `:2679`) only call `render()`.
So in a Mega session, `qbShowNote(idx)` (`:2788`) → `MB_DOCK_SOURCE(q.src)` → `open("source")` → `apply()` (`:86-96`)
evaluates `isOpen && onStudy()` as **false**, immediately strips `.on` from the drawer *and* sets
`tab.style.display="none"`. The button does nothing, shows nothing, and logs nothing. `gapShowNote()`
(`:3416`) is the same call, so **the V1.6 gap loop's Open-note step is dead whenever the loop is launched from a Mega
session or the post-session fix queue on `#/mega`** — which is the primary launch path in `flow-e2e`.
The reverse also holds: even on a `topic` route where the whitelist passes, `MB_DOCK.ctx` (`app.html:994`) reads only
`S.items[S.order[S.i]]` — the *flashcard* session. It never looks at `QB` or `GAPLOOP`. So a student who opens the dock
during a Q-bank or gap loop gets the Ask/Note tabs bound to whatever flashcard session is still alive from earlier
(STU-09/SIDE-06 family: `S` outlives the route), i.e. DCK-01's wrong-card write with an even bigger gap.
**PROPOSED:** two parts, both in `app.html` only. (1) add `'mega','exam','solve'` to the `onStudyScreen` array — or
better, make it `return !!(QB || GAPLOOP || S) || whitelist.indexOf(r)>=0`, since the dock's real precondition is
"content is on screen", not "the route is named X". (2) make `ctx()` prefer the innermost live session:
`GAPLOOP` → `QB.items[QB.i]` → `S`, falling back to the route topic as it does now. Read-only against the engine —
`GAPLOOP`/`QB` are inspected, never mutated.

### TIM-01 — MEDIUM — two devices on the same day silently discard one side's study time
`sync.js:146` merges `study` as a **per-day `Math.max`**:
`for(k in b) o[k]=Math.max(o[k]||0, b[k]||0)  // seconds/day: keep the larger`.
40 minutes on the laptop plus 40 on the phone on the same date resolves to **40**, not 80. That is the SET-01 shape —
real work undone by sync — on the one number the timer's own header comment (`study-timer.js:33-36`) promises "always
reflects the signed-in account and follows it across devices". It also feeds `studyStreak()` (`:176`), the "This week"
and "Daily avg" tiles (`:224`, `:227`) and the ▲/▼ vs-last-week verdict (`:191-196`), so the trend line understates for
any multi-device student and can flip an "up" week to "about the same".
`Math.max` was almost certainly chosen to make the merge idempotent under repeated pushes of the *same* device's
counter — summing raw totals would double-count on every re-merge. That constraint is real; the fix is to make the
counter per-device rather than to change the operator.
**PROPOSED:** key seconds by device as well as day — `DATA.study[k] = { <deviceId>: secs }` — merge with `Math.max`
per device (still idempotent) and sum across devices on read. `MB_STUDY_GET` (`app.html:988`) can flatten to the old
`{day: total}` shape so `study-timer.js` needs no change. Migration: treat a numeric `DATA.study[k]` as
`{legacy: n}`. Until then, the honest one-liner is to change the stats subtitle from a cross-device promise to
"time on this device".

### TIM-02 — MEDIUM — every bar in the stats chart is labelled with the wrong weekday west of UTC
`keyOf` (`study-timer.js:29`) builds a **local** date string from `getFullYear/getMonth/getDate`. Three places then
parse it back with `new Date(k)` — `:152` (popover row label), `:205` (`week` bar label), `:206` (`month` day number) —
and a bare `"YYYY-MM-DD"` is spec'd as **UTC midnight**, not local. `toLocaleDateString` then renders it in local time,
so for any negative UTC offset the label lands on the **previous day**: a student in UTC−5 sees today's fire-coloured
bar labelled "Fr" on a Saturday, and the month view's `getDate()` numbers are all one low. Positive offsets are
unaffected, which is why this has survived.
**PROPOSED:** parse as local — `new Date(k + "T00:00")` (or `new Date(+y, +m-1, +d)`) at all three sites. Three-character
change, no data touched. `app.html`'s `dstr` (`:1171`) has the identical local-build convention, so any future reader of
`DATA.log`/`DATA.study` keys needs the same treatment; `dayLabel` (`:5303`) already does it correctly and is the pattern
to copy.

### TIM-03 — MEDIUM — the timer serialises the entire `DATA` object to localStorage every ~10 seconds while you study
`loop()` (`study-timer.js:262`) flushes on every 10th tick, and `flush()` (`:44-49`) calls `MB_STUDY_ADD`, which is
`app.html:987` → `persist()` → `localStorage.setItem(SKEY, JSON.stringify(DATA))` **+** `scheduleBackup()` **+**
`MB_SYNC.markDirty()` (`app.html:1161-1163`).
`DATA` carries every card's SRS state, `notes`, `cardEdits`, `viz`/`cardViz` blueprints and a `qbank._attempts` log
capped at **4000** entries plus `_qmeta`, `_sessions` and `_events` (`sync.js:112-135`) — routinely multi-megabyte.
A full synchronous `JSON.stringify` + `setItem` of that, on the main thread, six times a minute, for the whole duration
of a study session, to add **one integer**. It also marks the state dirty continuously, so the sync pusher never sees a
quiet moment. On a mid-range phone this is the most likely cause of mid-session jank on the card screen, and it is
pure write amplification.
**PROPOSED:** keep the seconds in `DATA.study` in memory but debounce the *write* — have `MB_STUDY_ADD` accumulate and
call `persist()` at most once every 60 s, plus unconditionally on `visibilitychange`/`pagehide`/`beforeunload`
(`study-timer.js:345-350` already fires `flush()` at all three). Alternatively raise the flush interval in `loop()` from
10 to 60 ticks — one character, most of the benefit.

### TIM-04 — MEDIUM — the idle genie stops your podcast when you dismiss it
`hideGenie()` (`:333-337`) calls **`window.stopSpeak()`** unconditionally, and `stopSpeak` (`app.html:1571`) is global:
`speechSynthesis.cancel()` + `stopCloud()`. `hideGenie` is reached from `bump()` (`:340`), which is bound capture-phase
to `scroll`/`touchstart`/`pointerdown`/`keydown`/`click`/`wheel` (`:341-343`) — i.e. **the student's next tap anywhere**.
The genie's own suppression check only excludes the visualiser (`:257`, `:306`: `#vizov, .vizinlinebody`) — the podcast
player is neither. Listening to the podcast on a topic page is exactly the case that trips the 90 s idle warning
(`WARN_MS`, `:267`): `route()==="topic"` with `.md` present is `isStudying()` (`:70`), and a listener isn't scrolling.
So the sequence is: podcast plays → 90 s of no input → genie pops up and **talks over the podcast** → student taps to
dismiss it → `stopSpeak()` kills the podcast audio too.
**PROPOSED:** (a) add the podcast to the suppression selector alongside `#vizov` — one selector, matching the existing
"skip during a video so its voice doesn't clash" intent at `:255-257`; and (b) in `hideGenie`, only call `stopSpeak()`
when the genie actually used the fallback path (`_geniePlay===null`), since the `mbPrepareVoice` path already has its
own `playObj.cancel()` on the line above.

### TIM-05 — LOW — `flush()` zeroes `pending` before the write, and the "never lose seconds" fallback can't fire
`flush()` (`:44-49`) does `var n=pending; pending=0;` and *then* `if(window.MB_STUDY_ADD) MB_STUDY_ADD(n); else mem[…]`.
`MB_STUDY_ADD` (`app.html:987`) is wrapped in `try{…}catch(e){}` with an empty handler, so it always returns normally
whether or not it stored anything — a `QuotaExceededError` inside `persist()` is separately swallowed
(`app.html:1161`). The `else` branch commented "defensive: never lose seconds" is therefore unreachable in practice:
the helper exists, so the fallback never runs, and a failed write is indistinguishable from a successful one. The
seconds are gone. Same shape on the account side — `flush()` on `pagehide` (`:350`) marks dirty but cannot await a push.
**PROPOSED:** have `MB_STUDY_ADD` **return true/false** (false in the `catch`), and in `flush()` restore
`pending += n` when it returns false. Four lines, and it makes the existing `mem` fallback meaningful.

### TIM-06 — LOW — a failed genie reveal re-requests TTS every second
`tick()` (`:257`) calls `armGenie()` on **every 1 s tick** while `visible && inactive>WARN_MS && isStudying()`.
`armGenie` (`:308`) guards on `genieUp||geniePending`, and clears `geniePending` on every exit path — but `showGenie`
(`:318-332`) is wrapped in `try{…}catch(_)` and can return **without setting `genieUp`** (the `!dot` early return, or a
throw inside the DOM build). When that happens both flags are false at the next tick, the condition is still true, and
`window.mbPrepareVoice(msg)` (`app.html:1553`) is invoked again — every ~1 s until the student moves, each one a
server voice request. Low confidence that the throw path is reachable today (`dot` is set in `inject()`), so this is a
latent hardening item, not an observed failure.
**PROPOSED:** set a `genieCooldown = Date.now()+60000` at the top of `armGenie` and return early while it's live, so the
worst case is one attempt per minute regardless of what `showGenie` does.

### DCK-03 — LOW — `esc()` doesn't escape `'`, and every attribute in the dock is single-quoted
`study-dock.js:22` escapes `& < > "` only. `:120` writes `href='"+esc(ctx.pdf)+"'` and `:125` writes
`data-t='"+seg.t+"'` (unescaped) — both single-quoted. A `'` anywhere in `t.pdf` closes the attribute and lets the rest
of the string inject markup into the drawer. `ctx.pdf` comes from the content tree / import pipeline rather than from
the student, so this is low exploitability, but it is the same class ENT-08 was logged for, and `app.html`'s own `esc`
(`:981`) has the identical gap.
**PROPOSED:** add `"'":"&#39;"` to both maps and extend the character class to `/[&<>"']/g`. Two files, one line each.

### DCK-04 — LOW — the dock's Ask tab has no busy guard, so Send can fire concurrent tutor calls
`doSend` (`study-dock.js:146-160`) disables the button (`:153`), but any subsequent `render()` — a tab click, a
`hashchange`, or the resolution of an *earlier* request — rebuilds the drawer from `head+body+foot` and returns a fresh,
**enabled** `#mbDockSend`. There is no equivalent of `pageAI`'s `AIBUSY` flag (`app.html:5934`, SCA-04). Two in-flight
`claudeTutor` calls then push into `hist[ctx.topicId]` in completion order, which can interleave the answers.
`hist` (`:17`) is also unbounded and purely in-memory — a reload silently empties a conversation the panel gives no
indication is ephemeral.
**PROPOSED:** hoist a module-level `DOCKBUSY` flag, return early from `doSend` while set, and render the Send button
disabled whenever it is true.

### F24-NOTES — checked, and the small stuff
1. **`syncTab()` (`study-dock.js:182`) has zero call sites** — dead since the `apply()` refactor. LIB-01/ENT-03/SIDE-08
   pattern, harmless here. Delete it with DCK-01's edit.
2. **`var KEY = "mb_study_time"` (`study-timer.js:25`) is never read** — leftover from the pre-account localStorage
   store. The comment block at `:33-36` correctly says `DATA.study` is now the source of truth; the constant is just
   litter, but it's a false lead for the next reader.
3. **Family (b) `NaN` does not reach this flow.** `MB_STUDY_ADD` (`app.html:987`) does `sec=Math.round(sec)||0` and
   bails on `<=0`, `pending` only ever increments by 1 (`:43`), and `base()`/`cardsOn()` both `||0`. `fmt` (`:55`)
   floors and clamps. Clean.
4. **Family (c) and (d) cannot reach this flow** — no answer key is read, and the only network call is via
   `d.ask` → `claudeTutor`, which was covered in flow 23 (SCA-05).
5. **Family (a) `isFlagged` does not apply** — the timer reads dates, not card pools. But `MB_CARDS_BY_DAY`
   (`app.html:984`) returns `DATA.log`, whose `cards` counts *were* incremented for cards later reported wrong, so the
   "· N cards" figures under each bar (`:157`, `:208`) inherit whatever `logRate` counted. Not actionable here.
6. **`avg` divides by 7 unconditionally** (`:198`) — a student three days into using the app sees a "Daily avg" diluted
   by four days that predate their account. Cosmetic; `"Daily avg"` → `"Avg / day this week"` would be honest enough.
7. **Two different streaks are shown in two places** — `studyStreak()` (`:176`, any study *time*) and `curStreak()`
   (exposed as `MB_STREAK`, `app.html:985`, cards reviewed). They can legitimately disagree by days and nothing labels
   the difference. Worth one word in the stats copy.
8. **Midnight rollover is ~10 s of misattribution**, not a bug worth fixing: `pending` is credited to `today()` on read
   (`:41`) but written under `dstr()` at flush time (`app.html:987`), so a session crossing midnight moves up to one
   flush interval into the new day.
9. **Layering is fine.** `#mbDock` is z-index 100001 and `#mbDockScrim` 100000 (`study-dock.js:53-57`) vs `.gapov`
   100000 (`app.html:6808`) and `#mbtStats` 100003 (`study-timer.js:117`). The dock correctly sits above the gap
   overlay and the stats sheet above both. No trap — but note this only matters once DCK-02 lets the dock open there
   at all.
10. **`highlightIn` (`:25-44`) is sound** — it walks text nodes, restores `prev||"transparent"` after 2.4 s, and bails
    on needles under 4 chars. The three-tier fallback (full → 6 words → 4 words) is a good pattern. No leak: it styles
    existing nodes rather than wrapping new ones.

**Ordering for Frank:** **DCK-02 is the one to fix first** — it is a V1.6 surface (`gapShowNote`), the harnesses can't
see it because they test decision logic rather than the DOM, and it is a two-line change in `app.html` with no risk to
the frozen engine. **DCK-01 is the highest-severity** and is the only finding in this flow that destroys student data;
its fix is one exported function plus one call site. **TIM-03 is the cheapest real win** (one number, 10 → 60).
**TIM-01 needs a decision from you, not a patch** — either the per-device keying or honest copy. Nothing in this flow
touches `smartDiagnose`/`smartDrillPlan`/`smartStats`/`rateSRS`; DCK-02's proposed `ctx()` change *reads* `QB` and
`GAPLOOP` and must not write to them.

---

# 🧪 V1.6 live validation + import test — 2026-08-22 (flags LIVE, test account frankthejay)

## ✅ Deployed V1.6 is smart on real data
Ran the LIVE deployed `fixQueue('*')` against frankthejay's real 40-attempt history (Bronchiolitis). It returned a correctly-prioritised queue:
1. Management — misconception (40% acc) → "Practise & confront" — **ranked #1**
2. Investigation — gap (25% acc) → "Learn → Practice → Retest"
3. Complications — misconception
The intelligence check passes: Management ranks **above** Investigation despite HIGHER accuracy (40% vs 25%), because its confidence/severity score is higher (0.575 vs 0.547). Diagnosis-specific routing correct; sev/conf/recur components captured in telemetry. Flags confirmed live (`gapOn()`/`fixQueueOn()` both true).

## 🔴 IMPORT-01 — Importing a lecture WITH Q-bank fails (502) even on a PREMIUM account — HIGH (needs investigation)
**Observed:** POST `/import` with `builds:['qbank']` (rich ~500-word lecture, single topic) returned **502 after 402s**: *"The AI returned an unreadable response. Please try building again."* No topic row was created. `/me` confirms frankthejay is `premium:true` (uses PREMIUM_MODEL deepseek-v4-pro), so this is NOT a model-tier issue. A base import (no qbank) was fired to isolate but the browser tab reloaded mid-request, so base-vs-qbank isolation is unconfirmed — but the topics table still shows only the old Bronchiolitis, i.e. neither attempt landed.
**Why it matters:** if importing a lecture (the app's core action) fails on a premium account, it likely fails for pilot students too — a blocker for building any study material. Combined with ENT-01 (entitlement), this is the single biggest live risk to the pilot.
**Likely causes (to confirm):** (a) the Q-bank build step uses `EXTRAS_MODEL` = deepseek-v4-flash (server.mjs:184/914) which may emit unreadable JSON — see QB-09 (`max_tokens:12000` possibly rejected/clamped) and QB-08; (b) the combined import+qbank exceeds the onrender proxy timeout (SRV-06) — 402s is far past a typical 100-120s proxy cap.
**Next step:** isolate with a clean run — base `/import` (no builds) alone, then `/build-extra` for qbank separately, each timed; check the Render server logs for the actual model error; verify the EXTRAS_MODEL `max_tokens` against the provider cap.

## 🟠 GAP-QUEUE-01 — fix-queue offered a gap loop that silently did nothing — MEDIUM — ✅ FIXED (not deployed)
**Observed (live):** for the Investigation gap concept, `fixQueue` offered "Learn → Practice → Retest", but calling `gapStart` returned early (Bronchiolitis has no second Investigation question with the *same* skill+tag+objective to build a distinct practice+retest). Because `fixQGo` calls `qbExit()` first, clicking the item would close the results screen and open **nothing** — a silent dead click (exactly the failure mode we were guarding against).
**Fix:** made the queue availability-aware — `fixQueue` computes `canLoop = (gap && a distinct sibling exists)`; `fixQAction` routes a no-material gap to "Practise this" (a focused drill) instead of the loop; and `fixQGo` now treats `gapStart` as returning a boolean and **always falls back to `smartDrillDim`** if the loop can't build. No queue item can ever be a dead click now.
**Verified:** `qa/flow-e2e.mjs` extended with a "gap with no material → falls back to a drill (no silent fail)" scenario; all four harnesses pass.
