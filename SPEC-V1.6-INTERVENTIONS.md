# MedBank — V1.6 Intervention Engine — Specification (LOCKED for review)

**Status:** specification only — no code until §7 decisions are signed off. Supersedes the earlier `DESIGN-V1.6.md` sketch.
**Sequencing:** V1.5 (frozen) → **Pilot** → **V1.6 Interventions (this doc)** → V1.7 Mega Clinical Reasoning (`SPEC-V1.7-MEGA.md`) → V1.8+ branching.

## 0. Baseline & branch rule (read first — there is a version discrepancy to settle)

The pilot baseline is the build students actually run. Today that is **`main` = v207** (engine v203 + pilot telemetry instrumentation + End&grade). The earlier intervention sketch said "main frozen at v209" — that was wrong; **v209/v212 work lives on the `v1.6-experiments` branch and is NOT what students run.**

Agreed structure going forward:
```
v207-pilot   ← TAG this exact commit. Frozen. Students use it. Never touched.
   └── v1.6-interventions   ← NEW clean branch off the pilot baseline. All V1.6 work here.
```
Before any V1.6 code (LOCKED): **freeze = behavior frozen, safety fixes allowed.** (a) Cherry-pick the **sync data-loss fix** and **admin-access fix** into the pilot baseline as *non-behavioral pilot patches* — no Smart Drill / diagnosis / routing / student-behavior changes. (b) Tag that commit `v207-pilot`. (c) Branch `v1.6-interventions` off it.

**The V1.5 Smart Engine stays frozen.** V1.6 *reads* `smartDiagnose` output; it does not change the diagnosis/routing until pilot data justifies it.

---

## 1. Premise

V1.5 answers *"what kind of problem does this student have?"* V1.6 gives each kind a **different treatment**, then closes the loop:

```
Diagnose → Intervene → Retest → Update profile → Adapt
```

The three diagnoses and their treatments:

| Diagnosis (internal) | Signal | Treatment | Reuses |
|---|---|---|---|
| Knowledge gap | wrong + unsure | **Learn → Practice → Retest** | Notes/Primer, `qbShowNote`, `q.src` |
| Misconception | wrong + confident | **Challenge (contrast) → Retest** | per-option `rationales`, `trap_type` |
| Fragile knowledge | right + unsure | **Spaced reinforcement** | existing SRS (`LADDER`, `rateSRS`) |

## 2. The per-diagnosis gate (non-negotiable)

Build an intervention **only if the pilot validates its diagnosis** — i.e., students agree the diagnosis is real *and* the pattern predicts performance. If a diagnosis shows no distinct signal in the pilot, **cut its intervention**, don't build on faith. This is the whole reason for the freeze.

---

## 3. The three interventions — behavior

### 3.1 🟠 Knowledge gap → Learn → Practice → Retest
Trigger: `smartDiagnose === 'gap'`. Flow:
1. Surface the relevant **Note/Primer** section for the missed concept (via `q.src` / `qbShowNote`).
2. A short explanation of the specific point missed (from `objective`/`teaching`).
3. A **fresh practice question** on the same objective.
4. A **retest** (a different question, same concept) to confirm the gap closed.
Message to student: **"You don't appear to know this yet — let's teach it before testing you again."**

### 3.2 🟣 Misconception → Challenge (contrast) → Retest
Trigger: `smartDiagnose === 'misconception'`. Flow:
1. Identify the likely wrong rule from the chosen distractor (`trap_type` / that option's rationale).
2. **Contrast** the wrong rule against the correct concept: *"Why B, not D — the key distinction is…"*.
3. A **different question testing the same distinction**.
**Wording (LOCKED per Frank):** never tell the student "you have a misconception." Say **"You may be using a misleading rule here,"** then explain. Only escalate to **"You seem to be consistently applying X when Y is the better distinction"** once there's enough repeated evidence. Tutor tone, not grading machine.

### 3.3 🟡 Fragile knowledge → Spaced reinforcement
Trigger: `smartDiagnose === 'fragile'`. Flow: don't re-teach. Route the concept into the **existing SRS** for a spaced re-test; success = accuracy holds while confidence rises (right + unsure → right + confident). Uses `LADDER`/`rateSRS`; no new scheduler.

---

## 4. UX — use BOTH, at different moments (LOCKED per Frank)

### 4.1 At the miss — lightweight, non-interrupting
On a wrong answer, a small, dismissible prompt — never a forced detour:
```
❌ Incorrect
Why? You may have a knowledge gap here.
[Learn this]   [Continue]
```
Wording varies by diagnosis (gap → "Learn this"; misconception → "Challenge me"; fragile only surfaces post-session, not at the miss). Default action is **Continue**; the intervention is opt-in.

### 4.2 After the session — the "3 things to fix" queue
```
🧭 Your 3 things to fix
1. Management — Knowledge gap    "You struggled with this repeatedly."      [Learn →]
2. Pharmacology — Possible misleading rule  "You kept picking the same wrong option, confidently."  [Challenge me →]
3. Cardiology — Fragile          "You're getting these right but aren't sure."  [Schedule reinforcement →]
```
Ranked list (max 3), each hands off to its intervention. Evidence-gated: an item only appears with enough data (reuse V1.5 `MIN_EV`).

## 5. Measurement — the A/B that proves it works (LOCKED, keep)

Additive, versioned telemetry (never rename V1.5 events):
`intervention_shown {type, diagnosis, concept}`, `intervention_completed {type, outcome}`, and post-intervention accuracy/confidence on that concept.

**The experiment:** does a *matched* intervention beat a generic re-drill?
- Group A: confidently-wrong → generic re-drill.
- Group B: confidently-wrong → misconception contrast.
- Measure later accuracy on the same concept. If A≈62% and B≈78% → keep it. If both ≈62% → the fancy intervention isn't helping; **kill or redesign it.**

Same A/B applies to gap (learn-loop vs re-drill) and fragile (spaced vs immediate).

---

## 6. Build order (each gated & measured)

| Phase | Deliverable | Content need | Depends on pilot? |
|---|---|---|---|
| 1 · Instrumentation | intervention events + A/B bucketing (no student-visible change) | none | no |
| 2 · Gap loop | Learn→Practice→Retest + at-miss/queue UX | uses existing notes (`q.src`) | gap diagnosis validated |
| 3 · Fragile reinforcement | route fragile → SRS | none | fragile validated |
| 4 · Misconception challenge | contrast + retest | starts with existing `trap_type`/rationales; distractor-level tagging only if A/B wins | misconception validated (hardest gate) |

## 7. Decisions — ALL LOCKED

| # | Decision | Status |
|---|---|---|
| D1 · UX | at-miss **and** after-session queue | ✅ both |
| D2 · Misconception wording | "misleading rule" → escalate to "consistently applying X when Y" only with repeated evidence; never say "misconception" to the student | ✅ softened |
| D3 · A/B testing | matched vs generic, measure later accuracy; kill if it doesn't beat generic | ✅ keep |
| D4 · Queue ranking | "3 things to fix" ranks by evidence-weighted severity: Misconception (actively harmful) → Gap (foundational) → Fragile (polish) | ✅ locked |
| D5 · Build order | **Gap Learn-loop first**, then **Fragile SRS**, then **Misconception Challenge** | ✅ locked |
| D6 · Content | reuse existing `q.src`/notes (gap) and `trap_type`/rationales (misconception) first; invest in distractor-level tagging only if the A/B proves contrast beats generic | ✅ reuse-first |
| D7 · Baseline & freeze policy | Freeze = **behavior frozen, safety fixes allowed.** Cherry-pick the **sync data-loss fix** and **admin-access fix** into `v207-pilot`, recorded as *non-behavioral pilot patches*. Do **not** cherry-pick any Smart Drill / diagnosis / routing / intervention / student-behavior change. Then tag `v207-pilot`, branch `v1.6-interventions` off it. | ✅ locked |

### Build-order caveat (from Frank)
Do **not** build the Gap Learn-loop merely because the diagnosis *sounds* right. The pilot must first establish that `gap = low accuracy + low confidence` is actually useful for these students — the whole reason the engine is frozen. Build order is settled; the **gate still applies per diagnosis.**

## 8. Risks / honest flags
- **Diagnosis accuracy is the whole foundation** — if the pilot doesn't validate a diagnosis, its intervention is unjustified. Gate hard.
- **Content is the bottleneck** for misconception (distractor tagging); gap and fragile need none — which is why they ship first.
- **Wording matters** — the softened misconception language is a real requirement, not polish.
- **Measure, don't assume** — the A/B is what separates "genuinely intelligent" from "AI-looking."
