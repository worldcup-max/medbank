# Branching Cases — SCOPING PASS (analysis only; nothing built; no schema/UI/engine designed)

_Grounded in V1.7-CONTRACT.md (D1–D5) and MEGA-QBANK-MASTER-ROADMAP.md. `branch_id`/`parent_question_id` are already
RESERVED for V1.8; this pass defines the boundary, it does not open implementation._

## Dependency chain (the core finding)
**Integrated inventory (Phase A) → Case Mode linear (Phase 5, NOT built) → Branching Cases (V1.8).**
Branching is DOWNSTREAM of two layers that don't exist yet. Do NOT build it now.

## 1. The primitive — what a Branching Case IS
A case (N stages sharing `case_id`) where **the student's decision at a stage determines which stage/information comes
next** — a learner-traversed **directed graph** of stages. `parent_question_id` links a stage to the decision that led to
it; `branch_id` names a path. Sub-forms (roadmap): multi-step decisions (each decision gates the next), evolving patient
state (authored state transitions on decision), adaptive paths (correct→harder, wrong→remediation).

## …and what it is NOT (boundaries)
- NOT a linear case (fixed reveal order) — that is Case Mode (Phase 5), which does not exist yet.
- NOT adaptive question SELECTION (A7/adaptive already picks a next item by difficulty; branching changes the *revealed
  clinical information* based on the *specific decision* — different thing).
- NOT an identity/scheduling change — each stage stays a normal question with a FIXED `target_id`; A6/A7 untouched.
  Branching is a presentation + path + measurement layer, never a scheduling key.
- NOT AI-generated content (D1 content-first holds).
- NOT a physiology simulator — "evolving patient state" = AUTHORED transitions, not a computed clinical model. Scope trap.

## 2. Dependencies (hard, in order)
1. Genuine integrated inventory — Phase A, 67/100 approved (2026-09-10), ongoing.
2. Case Mode linear (Phase 5) — NOT built. You cannot branch what you can't present linearly.
3. Question/target substrate (exists, frozen) — each stage = question + `target_id`; A6/A7 per stage.
4. Authoring model (D4: assemble + small clinician showcase; generator deferred) — combinatorially harder for branching.

## 3. Prerequisites & failure modes
- Prereq: Case Mode built + validated, and enough inventory to author even ONE good branching case.
- FM1 Authoring explosion (N decisions × M options = exponential) → bound depth; CONVERGING DAG (paths re-merge), not a tree.
- FM2 Identity/scheduling corruption (path-dependent target_id breaks A6/A7) → each stage's `target_id` fixed on every path.
- FM3 Scoring ambiguity (different paths not comparable by one score) → clean unit = PER-DECISION; case comparison is not.
- FM4 Measurement dilution → must emit a per-decision reasoning signal, not just a number.
- FM5 Content-gate violation (engine before authored content) → the exact Phase-4 mistake; forbidden.
- FM6 Scope creep into simulation ("evolving state" → physiology engine) → out for the first cut.

## 4. Gated sequence + measurable acceptance (recommendation, NOT a build)
- Gate 0 Prerequisite: Case Mode linear shipped+validated; ≥ a few authored integrated cases. ACCEPT: branching blocked
  until true. TODAY = FALSE → branching does not start.
- Gate 1 Data model: `branch_id`/`parent_question_id` as a converging DAG; additive. ACCEPT: single-topic + linear cases
  unchanged; each stage fixed `target_id`; A6/A7 regressions green.
- Gate 2 One reference case, hand-authored, ≤3 decisions, converging. ACCEPT: clinician confirms every path coherent + each
  decision has a defensible best answer (reuse R2/R3 discipline).
- Gate 3 Runner: traverse DAG by decision. ACCEPT: correct next stage per decision; per-decision scoring; identity invariant
  proven; flag-gated + reversible.
- Gate 4 Measurement: per-decision reasoning signal captured + reportable, tied to targets.
- Gate 5 Only then scale authoring; generation deferred.

## Conclusion
Branching Cases is a real Phase-F destination, but its true prerequisite (Case Mode linear) isn't built and its content
substrate (integrated inventory) is mid-Phase-A. The next BUILDABLE step here is Case Mode linear (see CASE-MODE-SCOPE.md),
itself gated on the corpus reaching readiness. Starting branching now = an engine on top of two missing layers. HOLD.
