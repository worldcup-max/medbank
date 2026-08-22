# V1.6 · Intervention #1 — Knowledge Gap → Learn → Practice → Retest (build spec)

**Status:** implementation-ready spec. **Do not build until the pilot validates the gap diagnosis** (agreement + does `gap` predict who improves). Engine stays frozen; this reads `smartDiagnose`, it does not change it.
**Branch:** `v1.6-interventions` (off `v207-pilot`). See `SPEC-V1.6-INTERVENTIONS.md` for the locked decisions this implements.

---

## 1. Trigger
Fires when a Smart Drill / Mega answer is graded and, for that concept, `smartDiagnose(band).type === 'gap'` (low accuracy, low confidence, no confident-wrong signature). Concept = `skill | tag | objective` (same key the engine already uses).

**Gate:** only offer the loop for a concept that has crossed the evidence floor (`SMART.MIN_EV`), same discipline as V1.5 mastery. Never diagnose a gap off one miss.

## 2. What it reuses (no new systems)
| Need | Existing hook |
|---|---|
| The teaching material | `q.src` + `qbShowNote()` / `MB_DOCK_SOURCE` (jumps to the exact note section) |
| The learning objective | `q.objective` / `q.teaching` |
| A fresh practice question | `smartPool()` filtered to the same concept, unseen-preferred (like `conceptRetest`) |
| The retest | a *different* question, same `skill+tag+objective` (reuse `conceptRetest` logic) |
| Diagnosis | frozen `smartDiagnose` |

## 3. UX — both surfaces (locked D1)

### 3a. At the miss (lightweight, non-blocking)
On a gap miss, under the rationale:
```
❌ Not quite. This looks like a knowledge gap.
[Learn this]        [Keep going]
```
- Default = **Keep going** (opt-in; never force the detour).
- **[Learn this]** opens the loop (§4) inline.
- Wording rule: "knowledge gap" is acceptable here (factual, not accusatory). (Contrast: the misconception intervention must use soft wording — see D2 — but that's intervention #3.)

### 3b. After the session (the "3 things to fix" queue)
Gap concepts appear in the post-session `🧭 Your 3 things to fix` list (ranked by evidence-weighted severity, D4):
```
1. Management — Knowledge gap    "You struggled with this repeatedly."   [Learn →]
```
**[Learn →]** starts the same loop.

## 4. The loop (state machine)
```
LEARN → PRACTICE → RETEST → RESULT
```
1. **LEARN** — surface the relevant Note/Primer section (`q.src`), with a 1–2 line framing of the specific objective missed. A single **[I've read this → practise]** button. (No quiz here; this is the teaching beat.)
2. **PRACTICE** — one fresh question on the same objective (unseen preferred). Tutor-style: answer → full rationale. This is *guided*, not graded for mastery.
3. **RETEST** — a *different* question, same `skill+tag+objective`, answered cold. This is the measured beat.
4. **RESULT** —
   - Retest **correct** → "Gap closing — nice." Update: the concept's evidence gets this data point (via the normal attempt log; no special-casing the engine).
   - Retest **wrong** → "Still shaky — we'll bring this back." Schedule the concept for a spaced return (reuse SRS), and keep it in the weak set.

Each step is skippable/exitable; exiting mid-loop logs `intervention_abandoned` with the step.

## 5. Data model (session object, additive)
Reuse the existing `QB` session shape with an intervention wrapper:
```
QB.intervention = {
  type: 'gap_learn_loop',
  concept: { skill, tag, objective },
  fromQh,                 // the question that triggered it
  ab: 'matched' | 'generic',   // A/B bucket (§7)
  step: 'learn'|'practice'|'retest'|'result',
  practiceQh, retestQh,
  retestOk: null
}
```
No new server tables — the retest/practice are ordinary attempts; the loop is a client orchestration over `smartPool()`.

## 6. Telemetry (additive, versioned — never rename V1.5 events)
- `intervention_shown { type:'gap', concept, ab, source:'at_miss'|'queue' }`
- `intervention_step { type:'gap', step, concept }`
- `intervention_completed { type:'gap', concept, ab, retest_ok:true|false }`
- `intervention_abandoned { type:'gap', step, concept }`
All carry the same `concept` key so outcomes can be joined to the diagnosis. Reuse `smartLog`; these sync via `profile_state` like the pilot events.

## 7. The A/B (locked D3 — prove it beats "another question")
On trigger, bucket the student→concept deterministically:
- **matched** (treatment): the full Learn→Practice→Retest loop.
- **generic** (control): skip Learn; just serve another question on the concept, then the retest.
Bucketing: hash(`student_id + concept`) → stable, ~50/50, so a given student always gets the same arm for a given concept.
**Measure:** later accuracy on that concept (next N attempts). Report matched vs generic. If matched ≯ generic, the Learn beat isn't earning its cost → cut/redesign it. (Dashboard adds an "intervention lift by type" panel — post-pilot.)

## 8. Success metric
Primary: **retest-correct rate** and **subsequent-accuracy lift** for `matched` vs `generic`. Secondary: loop start rate (from at-miss and from queue), completion rate, abandonment step.

## 9. Edge cases
- No note/`src` for the concept → skip LEARN, go straight to a taught practice question (log `no_source`); still run the retest.
- Not enough pool questions for a distinct practice + retest → fall back to one taught question + a delayed retest; if truly none, don't offer the loop.
- Concept later re-diagnosed as misconception/fragile → hand off to that intervention instead (don't stack).
- Offline → the loop runs on local pool; events queue and sync later.

## 10. Acceptance criteria
- Gap miss → at-miss offer appears, opt-in, non-blocking.
- Post-session queue lists gap concepts with a working [Learn →].
- Loop runs Learn→Practice→Retest→Result; retest is a *different* question on the same objective.
- A/B bucket assigned + logged; all four events fire with the concept key.
- Nothing writes to or changes the frozen engine; retest/practice are normal attempts.
- Evidence-gated: no gap loop offered below `MIN_EV`.

## 11. NOT in this intervention
- No misconception contrast (that's #3, and gated separately).
- No new question generation — reuse the pool.
- No change to `smartDiagnose`/routing/adaptive.
- No forced/blocking flows — always opt-in.

---

## BUILD STATUS — 2026-08-22 (increment 1, feature-flagged)
**Implemented (behind `CFG.FEATURES.GAP_LOOP`, default OFF — dormant for the live pilot):**
- At-miss detection: on a wrong tutor answer whose concept the FROZEN `smartDiagnose` reads as `gap` (evidence-gated), the plain "Retest this concept" button is replaced by the opt-in offer `❌ Not quite — knowledge gap [Learn this] [Keep going]` (`gapEligible`/`gapOfferHtml` in app.html).
- The loop (§4) as a self-contained overlay isolated from `qbNext`/`qbPick`: LEARN (objective + Open-the-note) → PRACTICE (guided, with rationale) → RETEST (cold, different question) → RESULT (gap-closing / still-shaky). Practice + retest are logged as ordinary attempts (`mode:'gap_practice'|'gap_retest'`) so the engine counts them (§5).
- A/B bucketing (§7): `gapBucket` = stable hash(uid+concept) → `matched` (full loop) vs `generic` (skips LEARN).
- Telemetry (§6): `intervention_shown` / `intervention_step` / `intervention_completed` / `intervention_abandoned`, each with the concept key + A/B arm, via `smartLog` (syncs through profile_state like the pilot events).
- Verified: app.html + config.js parse clean; frozen-engine regression harness (`qa/engine-scenarios.mjs`) still passes; gap-loop decision logic tested headlessly (`qa/gap-loop.mjs`, 7/7 — incl. flag-off-dormant, gap-only, miss-only, empty-pool guard, deterministic 50/50 bucket).

**Not yet built (increment 2):**
- §3b the post-session "🧭 Your 3 things to fix" queue with a `[Learn →]` entry into the same loop (only the at-miss entry point exists so far).
- Live UI runtime verification (blocked until committed + deployed; the loop can only be exercised on a build that actually ships the code).
- Dashboard "intervention lift by type" panel (post-pilot, per spec §7).

**To trial it:** flip `FEATURES.GAP_LOOP` to `true` in config.js, commit + deploy, then take a Smart Drill and miss a low-confidence question on a concept with ≥3 evidence.

---

## BUILD STATUS — 2026-08-22 (increment 2: post-session "3 things to fix" queue)
**Architecture (as directed):** the queue is a PRIORITISATION LAYER that *consumes* the frozen engine's output — it never diagnoses. Separate flag `CFG.FEATURES.POST_SESSION_FIX_QUEUE` (default OFF), independent of `GAP_LOOP`, so the two surfaces can be trialled separately.

Session ends → `fixQueue()` reads `smartStats` + `smartDiagnose` across skill & tag bands → ranks the top-3 by
`score = severity·0.5 + diagnostic-confidence·0.3 + recurrence·0.2` (deliberately NOT the three lowest scores) → dedups so a skill-band and its own tag-band never list the same weakness twice (clustered by underlying skill) → routes each to the intervention its diagnosis calls for:
- **gap** → "Learn → Practice → Retest" (the V1.6 gap loop; works from the queue even if the at-miss `GAP_LOOP` flag is off)
- **misconception** → "Practise & confront" (focused Smart Drill — interim until dedicated intervention #3)
- **fragile** → "Smart Drill" (retrieval / reinforcement)

Each item shows the concept label, the diagnosis chip, and a one-sentence *why* (the engine's own `dg.tip`) — session-level framing ("this is one of the highest-value things to fix"), not "you got Q7 wrong".

**Telemetry (additive):** `fix_queue_shown` (once per session), `fix_queue_item_selected`, `intervention_started {source:'queue'}`; completion/abandonment flow through the existing `intervention_*` / `smart_drill_*` events; subsequent performance is joinable via the concept key on the attempt log.

**Verified:** app.html + config.js parse clean; engine regression harness still passes (engine untouched); new headless test `qa/fix-queue.mjs` (all pass) proves value-ranking (a 33%-accuracy misconception outranks a 0%-accuracy gap), solid-area exclusion, 3-item cap, skill/tag de-dup, diagnosis→action routing, and the MIN_EV gate. The watchdog task now runs all three harnesses (`engine-scenarios`, `gap-loop`, `fix-queue`) every 20 min.

**Remaining:** live UI runtime verification (blocked until committed + deployed with a flag flipped on); dedicated misconception intervention (#3) to replace the interim drill routing; dashboard "intervention lift by type" panel (post-pilot).

**To trial:** set `FEATURES.POST_SESSION_FIX_QUEUE = true` (and optionally `GAP_LOOP = true` for the gap route's full loop), commit + deploy, finish a Smart Drill with ≥3 evidence on a couple of weak concepts.

---

## VALIDATION STATUS — 2026-08-22 (Increment 2)
**Ranking formula (kept visible for later tuning):** `score = severity·0.5 + confidence·0.3 + recurrence·0.2`.
Each item now also carries its individual components (`sev`, `conf`, `recur`) into the telemetry (`fix_queue_shown`, `fix_queue_item_selected`) — internal only, never shown to students — so the weights can be tuned from real behaviour ("was this ranked high for severity, confidence, or recurrence?") once usage data exists.

**Headless end-to-end validation — all green (`qa/flow-e2e.mjs`, drives the REAL extracted functions):**
- Session ends → `fixQueue` → select item → the correct intervention opens.
- Gap route: Learn → Practice → Retest → Result; **retest is a DIFFERENT question on the SAME objective**; `intervention_shown{source:'queue'}` → `intervention_step`(learn/practice/retest) → `intervention_completed{retest_ok}`; practice & retest recorded as ordinary attempts (`gap_practice`/`gap_retest`).
- Misconception → focused drill; Fragile → Smart Drill (not the gap loop).
- Flag independence proven: `POST_SESSION_FIX_QUEUE=true` + `GAP_LOOP=false` → the queue's gap item STILL launches the loop (no silent fail); `gapOn()` correctly reflects the at-miss flag being off.
- Engine untouched (frozen-engine harness still passes).

Four regression harnesses now guard this every 20 min via the watchdog task: `engine-scenarios`, `gap-loop`, `fix-queue`, `flow-e2e`.

**Only remaining for Increment 2 = "done":** live DOM/runtime confirmation on a DEPLOYED build with the flags on (the code is dormant/uncommitted, so there is nothing to drive on the live site yet). Everything the runtime *logic* must do is validated above; what's left is the visual render + a live telemetry round-trip, to be driven the moment it ships with `POST_SESSION_FIX_QUEUE=true` (and `GAP_LOOP=true` for the gap route's full loop).
