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
