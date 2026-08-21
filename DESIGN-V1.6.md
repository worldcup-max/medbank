# MedBank V1.6 — Intervention Engine (Design)

**Status:** design only. No code until the pilot validates the V1.5 diagnoses.
**Branch:** all V1.6 code lives on `v1.6-interventions`. `main` stays frozen at v209 during the pilot.

---

## 1. The one-line premise

V1.5 answers *"what kind of problem does this student have?"* — knowledge gap, misconception, or fragile knowledge. V1.6 answers the next question: **give each kind the right fix instead of the same "here's another question."**

That is MedBank's actual differentiator. "AI Q-bank" is commodity. *"It figures out why you got it wrong and fixes it the right way"* is not.

---

## 2. The gate (do not skip this)

This whole document is **contingent on pilot data**. Each intervention is only justified if the pilot shows its diagnosis is real and useful. Concretely, before building each one:

| Intervention | Only build if the pilot shows… |
|---|---|
| Misconception → Challenge | Students *agree* with misconception calls at a decent rate **and** confidently-wrong areas don't self-correct without help. |
| Gap → Learn loop | Gap diagnoses are accepted **and** low-accuracy areas improve when targeted (they're teachable, not just noise). |
| Fragile → Reinforce | Fragile students exist in meaningful numbers **and** their accuracy holds while confidence lags. |

If a diagnosis type shows no distinct pattern in the pilot, **its intervention isn't justified yet** — cut it, don't build it on faith. That's the discipline we've held the whole way.

---

## 3. Design principles (carried over from V1.5)

1. **Reuse the existing question pool first.** No AI generation in V1.6 — same rule that kept V1.5 honest. Generation is a separate, later bet.
2. **Every intervention closes a loop:** diagnose → intervene → retest → update the profile → Smart Drill adapts. No dead ends.
3. **Additive, versioned telemetry.** V1.6 gets its own events; we never rename or repurpose V1.5's, so pilot data stays comparable.
4. **Low friction.** Interventions are offered, not forced. The student can always just keep practicing.
5. **Measurable by design.** If we can't measure whether an intervention beats "another random question," we don't ship it.

---

## 4. The three interventions

### 🚨 Misconception → "Challenge your reasoning" (contrast)
**Trigger:** `smartDiagnose === 'misconception'` (wrong *while confident*).
**Goal:** break the wrong mental model — re-drilling a confidently-held wrong belief just reinforces it.
**Mechanic:** instead of another question, serve a **tight contrast**: a question where the student's likely wrong belief leads to one specific wrong option, followed by an explicit *"why B, not D?"* reveal that names the misconception. Optionally a 2-item pair (the concept + a near-miss contrast).
**Reuses what we have:** questions already carry per-option `rationales[]`, plus `trap_type` / `trap_explanation` (`qbTeachHtml`). Those are the raw material for "here's the trap you fell into."
**Content dependency (be honest):** the strongest version needs distractor-level tagging — *which misconception each wrong option represents.* That's content work, possibly the real bottleneck. Phase it.

### 🟠 Knowledge gap → Learn → Practice → Retest loop
**Trigger:** `smartDiagnose === 'gap'` (low accuracy, low confidence).
**Goal:** teach *before* drilling — drilling a gap just manufactures frustration.
**Mechanic:** missed question → surface the relevant **Note/Primer** section → a short explanation → a fresh practice question on the same objective → retest. This closes MedBank's existing **Notes → Primer → Quiz → Q-bank** loop, which today are separate products.
**Reuses what we have:** `q.src` + `qbShowNote()` / `MB_DOCK_SOURCE` already jump to the source note; `objective`/`teaching` fields already exist. The plumbing is largely there.

### 🟡 Fragile knowledge → Spaced reinforcement
**Trigger:** `smartDiagnose === 'fragile'` (correct but unsure).
**Goal:** convert knowledge into confidence — *don't re-teach*, just space it.
**Mechanic:** schedule the concept for a lighter re-test after a delay; fewer, spaced reps. Success = confidence rises while accuracy holds.
**Reuses what we have:** the existing SRS engine (`LADDER`, `rateSRS`, the review pipeline). Fragile items get fed into spacing rather than the weakness drill. This is likely the **cheapest** intervention to ship first, since the scheduler already exists.

---

## 5. Orchestration

After a Smart Drill / session, route each diagnosed area to its intervention. Two candidate UX shapes to decide between:

- **At the miss** (contextual): the fix appears right when they get something wrong — highest relevance, but interrupts flow.
- **An intervention queue** (batched): a post-session "3 things to fix" list they work through — lower friction, easy to skip.

Open question: **priority order** when a student has several. First instinct: misconception first (actively harmful), then gap (foundational), then fragile (polish). Validate against pilot behavior.

---

## 6. Measurement — the experiment that justifies V1.6

Additive events (on the branch, versioned):

- `intervention_shown { type, diagnosis, concept }`
- `intervention_completed { type, outcome }`
- post-intervention accuracy/confidence on that concept vs pre.

**The real test:** does matching the intervention to the diagnosis beat a generic "here's another question"? The clean way to prove it is a small **A/B** — some misconception cases get the contrast, some get a generic re-drill — and compare later performance. If matched interventions don't outperform generic ones, the architecture is elegant but not *useful*, and we'd learn that cheaply. That result matters as much as a positive one.

---

## 7. Content dependencies (the honest cost)

Code is not the bottleneck; **content tagging** probably is:

- Contrast needs distractor-level misconception tags.
- The gap loop needs reliable note/primer links per objective.
- Reinforcement needs concepts cleanly keyed (skill + tag + objective) — already mostly true.

Budget for content work explicitly, or each intervention degrades to a nicer-worded version of "another question."

---

## 8. Suggested build phasing (each gated + measured)

- **Phase 0 (now):** this design. Wait for pilot data.
- **Phase 1:** ship the **cheapest** intervention that reuses existing data — likely **fragile → reinforcement** (SRS exists) and/or **gap → show-in-note** (`qbShowNote` exists). Measure.
- **Phase 2:** **misconception → contrast**, once distractor tagging exists. Measure with the A/B.
- **Phase 3:** only if the data begs for it — richer content, and *then* consider generation.

---

## 9. Explicitly NOT in V1.6

- ❌ AI question generation (separate, later bet).
- ❌ Any change to the frozen V1.5 diagnosis/routing until the pilot validates it.
- ❌ New analytics for their own sake — every addition must inform an intervention decision.

---

## 10. Open decisions for Frank

1. UX shape: at-the-miss vs intervention queue (or both, context-dependent)?
2. Priority order when multiple diagnoses apply?
3. Which intervention ships first — fragile (cheapest) or gap (highest felt value)?
4. Appetite for the A/B test, or ship-and-observe?
5. Who does the content tagging, and on what timeline?
