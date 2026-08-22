# MedBank — Automated End-to-End QA Brief (for a Claude-in-Chrome agent)

## What this IS and ISN'T
- **IS:** functional + engine-behavior QA of Mega Q-bank, Smart Drill, telemetry, sync, and the admin dashboard, driven through the real app. Goal: find integration/UI bugs before real students hit them.
- **IS NOT:** a substitute for the human pilot. A bot's 👍/👎 and "improvement" do **not** validate whether the diagnoses are useful — only real students can. Do not treat any output here as pilot validation.

## Hard rules
1. **Use only tagged TEST accounts.** Sign up with emails like `qa1+medbank@…`, `qa2+medbank@…`. Record every test email used.
2. **Never touch `frankthewiz1@gmail.com` or its data.**
3. **All test data must be excludable later** — keep the list of test account emails so their telemetry can be filtered out of real pilot metrics. (Bot sessions must never pollute the real agreement/improvement numbers.)
4. Report every result as **PASS/FAIL + repro steps + screenshot**. Compile a bug list at the end.

## Target
`https://medbank.com.ng` (the live app).

---

## Suite A — Auth & onboarding
- Sign up a fresh test account → pick a level → pick courses → land in the app.
- Verify: account created, no console errors, data persists on reload, appears in `admin-dashboard.html`.

## Suite B — Mega Q-bank configuration (behavior-by-behavior)
For each: launch, answer a few, verify behavior.
- Exposure: **Focused, Mixed, Blind, Adaptive** — verify no topic/skill/level metadata is shown *before* answering in Blind/Adaptive; verify Mixed rotates (no single topic dominates).
- Mode: **Tutor** (rationale + teaching appear after answering) and **Test** (locks in, advances, results at end); **timed vs untimed** if present.
- Cognitive level chips + **Quick Exam** (20 · Mixed · Blind · Timed).
- Session sizes (10/20/40/60).

## Suite C — Answer & grading flows
- Tutor reveal: rationales, teaching, **optional** confidence capture (can advance without it).
- Test mode: auto-advance on answer.
- **End & grade early:** answer 4 of 20, tap End & grade → score is over the 4 answered (not diluted), review hides unreached questions.

## Suite D — Smart Drill & recommendations
- Launch Smart Drill → verify "why this?", focus chips, reasons.
- Tap 👍 and 👎 on a recommendation → verify it logs (check event fires; see Suite F).
- "Drill this" from a dashboard weakness bar → focused 10-Q set.
- Concept retest after a miss → a *different* question, same concept.

## Suite E — Engine behavior via CONTROLLED profiles (the important one)
Run several test accounts, each answering with a **deliberate pattern**, and verify the diagnosis end-to-end matches the injected behavior:
1. **Strong** — mostly correct + "very confident" → expect: diagnosed solid; Adaptive difficulty climbs.
2. **Management gap** — on Management questions answer wrong + "unsure"; other skills correct → expect: Management flagged as **knowledge gap**; Smart Drill + "3 things"/dashboard target **Management**, not the topic.
3. **Confidently wrong** — on one tag, repeatedly pick the same wrong option + "very confident" → expect: flagged as **misleading rule / misconception**; wording is soft ("you may be using a misleading rule"), never "you have a misconception".
4. **Fragile** — answer correct but "unsure" repeatedly → expect: **fragile**, a "reinforce" suggestion, and it is NOT treated as a core weakness.
Confirm each injected profile produces the *matching* diagnosis. Flag any mismatch.

## Suite F — Telemetry & dashboards
- After the Suite E sessions, verify events exist: `smart_drill_started`, `smart_drill_completed`, `reco_accept`, `reco_agree` (with dimension/diagnosis/accuracy snapshot).
- Open the dev readout at route `#/intel` — verify funnel + agreement-by-diagnosis populate for the test accounts.
- Open `backend/admin-dashboard.html`, sign in as admin → verify each **test student** appears with name/email + metrics, and the pilot-readiness strip computes. (Then note these test accounts for exclusion.)

## Suite G — Sync & cross-device (regression for today's bug)
- Log the same test account in on a second fresh context → verify data pulls down (147-card-style pull), streak/topics appear.
- Verify logging in does **not** wipe local data (the empty-cloud-adopt bug).
- Verify a normal user's `accounts` lookup returns exactly one row (the admin-RLS/`maybeSingle` regression).

## Suite H — Edge cases
- Selection with no matching questions → friendly empty state, no crash.
- End session with 0 answered → offers to leave, no 0% grade.
- Expired-trial account on a fresh device → confirm the gating behavior (and that it's intended).
- Rapid answering, back/forward, reload mid-session → no data loss, no console errors.

## Deliverable
A bug report: each suite PASS/FAIL, repro steps, screenshots, console/network errors, and a prioritized fix list. Plus the list of test-account emails used (for exclusion from real pilot data).
