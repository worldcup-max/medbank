# Case Mode (linear) — SCOPING PASS (analysis/architecture only; NO schema or UI designed; implementation HELD)

_Grounded in V1.7-CONTRACT.md decisions D1–D5 and the Phase-5 line. This is the next BUILDABLE step above the integrated
inventory, but it is GATED on the Phase-A corpus reaching readiness. Nothing here is a schema or UI — boundary only._

## 1. The primitive — what a linear Case IS
An **ordered** sequence of N stages sharing one `case_id`, about ONE patient, revealed PROGRESSIVELY: stage k+1 is shown
only after stage k is answered. **Each stage is a normal question** (its own stem/options/answer, its own `target_id`),
in a FIXED order (no learner-chosen path — that is Branching). Case Mode adds exactly three things over the existing
runner: (a) progressive reveal, (b) per-stage + case-level scoring, (c) the narrative binding of stages to one patient.
Per D-lock: "a case = N question rows sharing `case_id`, each stage is its OWN question with its OWN `target_id`."

## …and what it is NOT
- NOT branching (no decision-determined path; fixed linear order).
- NOT a new identity or scheduling concept — each stage is an independent Target assessment; A6/A7 unaffected.
- NOT AI-generated content (D1: assemble existing + small clinician showcase; generator deferred — D4).
- NOT a new table — a case is N rows sharing `case_id` (D-lock, additive schema only).

## 2. What existing infrastructure it CONSUMES
- The existing question **runner** (QB): Case Mode = progressive reveal + case scoring layered over it (D-lock line 50).
- The **question object** + additive fields `case_id`, `case_stage` (reserve `branch_id`, `parent_question_id`).
- The **target layer**: each stage → its `target_id`; A6 schedules each stage as a normal Target, A7 supplies per stage.
- **Tutor + test** modes (progressive reveal works in both; test = whole-case timing via the existing session timer, D2).
- **Approved integrated inventory** (Phase A) as the source material for assembled cases (D4).
- Optionally surfaced via the **Exam Blueprint selector** (Phase B) — but that is a later integration, not a prerequisite.

## 3. What Case Mode MUST NOT modify (invariants)
- A6 scheduling, A7 supply, V1.5 diagnosis, the frozen V1.6 intervention contracts, and the frozen QA engine (R1–R4).
- Target identity: `case_id`/`case_stage` are METADATA ONLY, never scheduling keys; each stage stays an independent Target.
- Single-topic questions behave EXACTLY as today (additive-only).
- No case generator (D4). No branching fields used (reserved only).

## 4. Minimum viable authored case set (before ANY implementation)
Per D4 (assemble + clinician showcase): a SMALL set (≈3–5) of coherent linear cases, each ≈3–5 stages, one patient,
each stage a genuine decision point drawn from the APPROVED integrated corpus, validated by a clinician. This is
content-gated: it cannot be assembled until Phase A has enough approved, diverse integrated inventory (the readiness
gate). Building the runner before this set exists repeats the Phase-4 mistake (engine with nothing to run).

## 5. Scoring / progression / persistence / measurement invariants
- **Scoring:** each stage graded EXACTLY like a standalone question (the clean unit); case-level score is a DERIVED summary
  (stages-correct / total), not a new metric. Per-stage is authoritative.
- **Progression:** strictly linear; stage k+1 hidden until stage k answered. Cross-stage **answer-leakage guard** — a later
  stage's stem/reveal must not disclose an earlier stage's answer, and an earlier reveal must not leak later stages (reuse
  the R3/leakage discipline across stages). Define behavior for revisiting an answered stage (view-only, never re-rate).
- **Persistence:** NO new table — N rows sharing `case_id`; branch fields reserved. In-session case progress is session
  state; no new durable schema beyond the additive fields.
- **Measurement:** each stage emits its normal per-Target signal (correct/confidence/response_ms via the learning-events
  ledger + A6). Case Mode adds a case-completion + per-stage-in-context signal ONLY. Identity invariant: each stage's
  `target_id` unchanged; `integrated_topics[]`/`case_id`/`case_stage` never influence scheduling.

## 6. Case Mode prerequisites vs. things that wait for Branching
- **Case Mode needs:** linear progressive reveal, per-stage + case scoring, assembled linear cases, leakage guard.
- **Defer to Branching (RESERVE only, do NOT use):** `branch_id`/`parent_question_id`, DAG traversal, path-dependent
  scoring, evolving patient state, adaptive paths.
- Case Mode must RESERVE the branch fields so the later step is additive — but must not implement any of them.

## 7. Gated sequence + measurable acceptance
- Gate 0 Prerequisite (content + order): Phase-A integrated-inventory readiness gate MET, and (per D5 order)
  Blueprint + Reasoning Profile shipped first. ACCEPT: Case Mode blocked until true. TODAY: corpus 67/100 → BLOCKED.
- Gate 1 Additive schema: `case_id`, `case_stage`; reserve `branch_id`/`parent_question_id`. ACCEPT: single-topic +
  integrated questions unchanged; A6/A7 regressions green; case fields never a scheduling key.
- Gate 2 Minimum viable case set assembled from approved corpus. ACCEPT: clinician validates each case coherent, each stage
  a defensible single-best, no cross-stage answer leakage.
- Gate 3 Runner/presentation: progressive reveal + per-stage grading + case aggregate; tutor + test. ACCEPT: stage k+1 hidden
  until k answered; each stage graded exactly as a standalone question; identity invariant (each stage `target_id` + A6
  scheduling unchanged); flag-gated + reversible.
- Gate 4 Measurement: per-stage + case-level signal captured (ledger/A6), reportable, tied to targets; no new identity.
- Gate 5 Only then: integrate with Exam Blueprint selection / scale authoring. Branching stays reserved.

## Conclusion
Case Mode linear is the correct next buildable capability above integrated inventory — but it is CONTENT-GATED on Phase A.
HOLD implementation until the integrated-inventory readiness gate is actually met; until then this stays a scoping/
architecture document. Sequence: Branching scope (recorded) → Case Mode scope (this doc) → hold until the Phase-A gate is met.
