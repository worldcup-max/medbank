# A8 — Retest Pool → Canonical Promotion: CONTRACT

_Attaches to roadmap box "A8 — RETEST POOL → CANONICAL PROMOTION" (Phase D). Pure gate: `import-server/a8.mjs`.
Tests: `qa/v19-a8-promotion.mjs` (22/22)._

## Purpose
A7 generates parallel retests and serves them when a Target runs out of fresh canonical questions. Being generated and
served does NOT make an item canonical. A8 decides which served retests have EARNED promotion. It is never automatic:
the gate says "eligible"; a human promotes from the Integrated Workbench (A8 panel).

## Guarantees
- **P1 Target preserved.** A promoted item keeps the exact `target_id` it was generated and validated for. No
  re-reconciliation, no re-mapping, no new Target. A6 identity is untouched.
- **P2 Validated only.** `validation.passed`, round-trip MATCH to the SAME target, confidence ≥ 0.90 (stricter than A7's
  0.85 serve floor).
- **P3 Evidence first.** Served ≥ 3 times and answered ≥ 5 times (from `learning_events`), with accuracy between 25% and
  90%: not trivially easy, not a broken item everyone misses. No evidence → never eligible.
- **P4 Status.** Only `served` rows. Candidate / invalid / quarantined / expired never. Student-flagged → held.
- **P5 Not a duplicate** of an existing canonical question for the same Target (stem Jaccard < 0.85).
- **P6 A7 stays frozen.** Promotion is written BESIDE the A7 row (`promoted_at`, `promoted_by`, `promotion`);
  `retest_pool.status` is never changed, so A7's anti-repeat set and pool accounting are exactly as before.
  `retestpool.mjs` is not modified.

## Evidence dependency (known limitation)
Answer counts come from `learning_events`, which only fills when `FEATURES.LEARNING_EVENTS` is on. Until then every
candidate correctly reports "not enough evidence yet". Turning that flag on is the trigger for A8 to start producing
eligible items.

## Deferred
- Serving promoted items as shared canonical supply ahead of A7 generation. That is a change to the A7 serve path and
  needs its own box (do not reopen A7 for it without evidence).
- Student "report a problem" flags feeding `promotion.flags` automatically.

## Schema
`import-server/sql/mega-qbank-phases-b-e.sql` (additive; safe to re-run).
