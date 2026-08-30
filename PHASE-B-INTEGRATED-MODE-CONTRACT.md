# Phase B — Integrated Mode: CONTRACT (draft, pre-implementation)

_Status: 📝 CONTRACT — written during Phase A while the corpus grows. NO code until the readiness gate is genuinely met and this contract is agreed. Attaches to roadmap box "PHASE B — INTEGRATED MODE"._

## Purpose
Expose the approved integrated questions to students as a first-class practice surface, WITHOUT disturbing the frozen scheduling/supply architecture (A6/A7) or the frozen QA engine (R1/R2/R3/R4).

## Entry gate (fail-closed — non-negotiable)
Integrated Mode is LOCKED until the single canonical `readinessGate` returns `ready===true` (production contract:
≥100 approved · ≥8 families · each present family ≥10 · each present pair ≥3 · top family ≤30%). There is exactly ONE
readiness definition (integrated.mjs `READINESS`); no relaxed variant may gate this. The `/admin/integrated/readiness`
endpoint returns `integrated_mode: "available" | "locked"` + `blockers[]`; the client keys off that, never off a
local recomputation.

## Locked architectural invariants (do NOT renegotiate)
1. **One primary `target_id` per integrated item.** `integrated_topics[]`, `case_id`, `case_stage` are METADATA only.
   A6 schedules on the single primary target exactly as for any canonical item — zero scheduling change, zero A6/A7
   reopen. This is the invariant proven additive in V1.7 Phase 1 (9/9).
2. **Integrated items are canonical-eligible questions, not a parallel universe.** They flow through the same serve
   path, the same retention keys, the same anti-repeat. "Integrated" is a tag + eligibility, not a separate scheduler.
3. **The QA engine is upstream and frozen.** Only human-approved items are eligible. Phase B reads approval; it never
   re-reviews.

## Scope of Phase B (what we build)
- **Selector wiring.** The Exam Blueprint selector (V1.7 Phase 2, already BUILT 11/11) gains an "integrated" axis:
  a requested count of integrated items per exam/session, drawn only from the approved integrated pool, honoring the
  existing shortfall-no-substitution rule (if fewer integrated items exist than requested, serve what exists + report
  the shortfall; never pad with non-integrated items relabeled).
- **Surfacing.** Integrated Mode appears in the existing entry points (Quick Exam / Smart Drill / Customize) as an
  option — kept underneath, not a new control panel (Foundation UI rule). When locked, show the explicit reason.
- **Lock-state UI.** When `integrated_mode==="locked"`, render the auditable message, e.g.:
  > Integrated Mode locked — 47/100 approved · 8/10 pairs ready · 2 families below minimum
  driven directly by `blockers[]`.
- **Analytics: requested-vs-delivered.** The single most important production metric for Phase B. For every session
  that requests integrated items, record requested N vs delivered M vs shortfall, by family/pair. This tells us
  whether the corpus can actually satisfy demand and where the thin pairs bite.

## Explicitly OUT of scope for Phase B (later phases)
- Integration performance in the Reasoning Profile → **Phase C** (evidence-gated; no premature ability claims).
- Promoting generated/retest items into canonical → **Phase D (A8)**.
- Multi-stage cases assembled from integrated items → **Phase E**. Branching → **Phase F**.
- No new question generation at serve time. No branching, no evolving state.

## Acceptance tests (to be written before implementation)
- Locked below gate: with a sub-gate corpus, `integrated_mode==="locked"`, Mode not offered, blockers correct.
- Unlocks exactly at gate: at ready===true, Mode becomes available; one item below gate flips it back to locked.
- Identity invariant: an integrated item served carries ONE primary target_id; A6 schedules it identically to a
  canonical item; integrated_topics[]/case_id never influence scheduling (regression against the frozen A6 suite).
- Shortfall: request > available integrated → serve available + report shortfall, never substitute.
- Requested-vs-delivered analytics recorded and correct by family/pair.
- Frozen engines untouched: A6/A7 harnesses and the R1–R4 QA suite stay green.

## Sequence
Phase A gate met → agree this contract → deterministic tests → implement selector axis + lock UI + analytics →
live validation (requested-vs-delivered on real sessions) → freeze → Phase C opens.
