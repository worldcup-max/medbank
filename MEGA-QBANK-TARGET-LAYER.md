# Mega Q-bank — Knowledge Target Layer (Phase A)

_The foundation beneath concept-equivalent retesting, AI parallel questions, and the Intervention Engine._
_Date: 2026-08-24. Status: DESIGN — no code wired into the live app yet. The proven scheduler stays FROZEN until this layer passes its own validation._

---

## 0. Principle

**The Knowledge Target is the source of truth. The Target ID is only its stable identifier.**

A question does not "have a subtopic string" — it *assesses a knowledge target*, and a knowledge target is a **canonical record with a semantic contract**. Many different stems map to one target. The scheduler will eventually say "retest `BRONCH-MGMT-001`", never "retest hash `a8f73…`".

Governing rules:
- **Existing target wins.** AI proposes; reconciliation decides. AI may never create a duplicate target merely by rewording the knowledge.
- **Never force a merge on similarity alone.** Related ≠ same. When unsure → `AMBIGUOUS`, do not merge.
- **A false merge is worse than a duplicate.** Merging two distinct targets makes the scheduler believe mastery transferred when it did not. Duplicates are cheap to reconcile later; false merges corrupt the retention signal.

---

## 1. The canonical Target record

```jsonc
{
  "target_id": "BRONCH-MGMT-001",          // stable, human-readable: <TOPIC>-<SKILL>-<seq>
  "version": 1,

  "canonical_statement": "Supportive care is the mainstay of uncomplicated bronchiolitis; routine antibiotics, bronchodilators and corticosteroids are not indicated.",

  "topic": "Bronchiolitis",
  "subtopic": "Management",
  "skill": "management",                    // from the existing QB_SKILLS vocabulary
  "scope": "Uncomplicated bronchiolitis in infants / young children",

  "tests": [                                // acceptable assessment angles (parallel-question generator draws from these)
    "appropriate supportive management",
    "which routine medications are NOT indicated",
    "supportive measures (hydration, oxygen, feeding support)"
  ],
  "excludes": [                             // explicit boundaries — the guardrail against drift AND false merges
    "severe bronchiolitis requiring escalation",
    "differential diagnosis",
    "prevention",
    "complications"
  ],
  "misconceptions": [                       // seeds the Intervention Engine's 'confront the belief' step
    "antibiotics are routinely indicated",
    "bronchodilators are routinely indicated",
    "corticosteroids are routinely indicated"
  ],
  "difficulty_band": "medium",             // difficulty boundary for generated parallels (from cognitive_level)

  "status": "active",                       // active | ambiguous | deprecated | merged
  "merged_into": null,                      // if this target was later merged, points at the survivor
  "source": "ai_reconciled",                // ai_reconciled | human_defined | ai_provisional
  "created_at": "…", "reviewed_by": null,
  "member_count": 3                          // how many questions currently map here (health signal)
}
```

`target_id` format: `<TOPIC-CODE>-<SKILL-CODE>-<NNN>` (e.g. `BRONCH-MGMT-001`). Human-readable on purpose — it's connective tissue we'll read in logs, drills, and the eventual knowledge graph.

---

## 2. The question → target link + extraction record

Every question carries what the AI *proposed* AND what reconciliation *decided*, so a bad mapping is always auditable and reversible.

```jsonc
{
  "qh": "a8f73…",                           // existing question hash (unchanged)
  "target_id": "BRONCH-MGMT-001",           // the RESOLVED target (null while AMBIGUOUS)
  "map_state": "MATCH",                     // MATCH | NEW | AMBIGUOUS
  "map_confidence": 0.86,                    // 0..1 from reconciliation
  "proposed": {                              // what the AI extracted, kept verbatim for audit
    "topic": "Bronchiolitis",
    "subtopic": "Management",
    "skill": "management",
    "knowledge_statement": "Management of uncomplicated bronchiolitis is primarily supportive.",
    "clinical_context": "4-month-old, mild respiratory distress",
    "expected_reasoning": "recognise supportive care as first-line; reject routine pharmacology",
    "tested_misconception": "antibiotics routinely indicated"
  },
  "candidates": [                            // top reconciliation candidates (for the audit view)
    { "target_id": "BRONCH-MGMT-001", "score": 0.86 },
    { "target_id": "BRONCH-MGMT-004", "score": 0.41 }
  ]
}
```

`AMBIGUOUS` questions keep `target_id: null` and are **excluded from scheduler retest selection** until resolved — they still work as ordinary Q-bank questions; they simply can't yet be used as concept-equivalent retests.

---

## 3. Reconciliation contract (multi-dimensional, statement-primary)

Input: one `proposed` extraction. Output: `{ state, target_id, confidence, candidates }`.

Signals, weighted — **knowledge statement is primary; the others gate, they don't outvote a boundary violation**:

| Signal | Role |
|---|---|
| knowledge_statement | primary equivalence signal (paraphrase-robust comparison, not raw string) |
| topic + subtopic + skill | hard pre-filter — a candidate in a different skill/topic is not a match |
| scope / clinical context | must be compatible with the candidate's `scope` |
| `excludes` check | a proposal that falls in a candidate's `excludes` is **forced apart**, however similar the wording |
| tested_misconception | corroborating: same misconception raises confidence |

Decision:
- **MATCH** — statement-equivalent AND passes the pre-filter AND not in `excludes`, confidence ≥ `T_match` → attach the existing `target_id`.
- **NEW** — clearly novel (best candidate < `T_new`) → mint a new target from the proposal.
- **AMBIGUOUS** — in the band between (`T_new ≤ best < T_match`), OR two candidates near-tie, OR an `excludes` conflict with an otherwise-high similarity → **do not merge, do not mint**; park for audit.

Thresholds are deliberately conservative (bias toward AMBIGUOUS over a wrong MATCH). Exact values get tuned from the backfill audit (step A5), not guessed now.

---

## 4. Build order (Phase A) — scheduler stays frozen throughout

```
A1. Target schema            ← this document
A2. Target extraction         (AI proposes topic/subtopic/skill/knowledge_statement per question)
A3. Reconciliation / collision detection  (MATCH / NEW / AMBIGUOUS)
A4. Backfill existing questions
A5. Audit the AMBIGUOUS + low-confidence MATCH buckets  ← measure collision quality; tune thresholds
    ── gate: mapping must be trustworthy before proceeding ──
A6. Connect scheduler → Target ID   (qbStartDue selects by target, not hash)   ← first scheduler change, only now
A7. AI parallel-retest generator + Retest Pool
A8. Intervention Engine routing (persistent misconception → repair → verify → resume)
```

The scheduler proven in production is **not touched before A6**, and A6 only proceeds if A5 shows the mapping is trustworthy.

---

## 5. Open decisions before A2 (extraction) can be wired

These are storage/model choices that belong to Frank because they shape everything downstream:

1. **Where do targets live?** New Supabase tables (`knowledge_targets`, `question_targets`) — queryable, shared across learners, and the natural home for a growing knowledge graph — vs. embedded in `topics.extras`. Recommendation: dedicated tables, because targets are cross-topic and cross-learner by nature.
2. **When does extraction run?** At build time inside `buildQbankBatched` (each new question extracted + reconciled as it's created), plus a one-off backfill job for the existing corpus. Recommendation: both — build-time for new, batch for backfill.
3. **Which model extracts + reconciles?** The extraction is a light tagging call; reconciliation's statement-equivalence check is the sensitive part. Same `EXTRAS_MODEL`, or a dedicated step?
4. **Human-in-the-loop for AMBIGUOUS?** A5's audit implies a small review surface. Is that a you-only admin view for the pilot, or automated-with-logging for now?

---

## 6. Why this is worth the care

Once every question maps to a trustworthy target, the Target ID becomes the connective tissue for far more than retention:

```
Knowledge Target
 ├── core Q-bank questions
 ├── generated retest (parallel) questions
 ├── misconception patterns
 ├── explanations / contrasts
 ├── visualisations
 ├── clinical-reasoning tasks
 ├── GAP_LOOP / Intervention Engine content
 └── mastery history
```

That is no longer a question database — it's a knowledge graph under the Q-bank. Which is exactly why the mapping has to be right before anything consumes it.

---

## 7. Decisions locked + build status (2026-08-24)

Decisions: **dedicated Supabase tables** · extraction runs **build-time + a one-off backfill** · AMBIGUOUS handled via a **log + you-only admin review surface**.

Reconciliation approach (avoids embeddings-alone): a **deterministic pre-filter** (same topic + skill; deprecated/merged excluded) bounds the candidate set, a **constrained AI adjudication** judges statement-equivalence *only among those candidates*, and **deterministic guards** make the final call — `excludes` conflict forces apart, near-tie → AMBIGUOUS, uncertainty band → AMBIGUOUS, below `T_new` → NEW, ≥ `T_match` → MATCH. Thresholds (`T_match 0.80 / T_new 0.45 / tieGap 0.12`) are conservative and get tuned from the A5 audit, not guessed live.

Built (isolated, NOT yet wired into the live build):
- `import-server/sql/knowledge_targets.sql` — the two tables (Frank runs it).
- `import-server/targets.mjs` — extraction prompt + parse, candidate pre-filter, `excludes` guard, `decide()` (MATCH/NEW/AMBIGUOUS), id minting, new-target record builder. Pure; model + DB calls stay in `server.mjs`.
- 17-case unit test on the decision guards — all green (false-merge protections verified).

Next (each a deliberate, gated step): **A2 wiring** — call extraction + reconciliation from `server.mjs` (build-time in `buildQbankBatched`, writing to the tables) → **A4 backfill** endpoint over the existing corpus → **A5 audit** surface for AMBIGUOUS. Only after A5 shows the mapping is trustworthy do we touch the scheduler (A6).

---

## 8. A2 + A4 + A5 — BUILT in SHADOW MODE (2026-08-24, pending push + migration)

Gated by `MEDBANK_TARGETS` env (`off` default → fully inert · `shadow` → annotate). **Shadow mode only observes and annotates; it never blocks or alters q-bank generation.** With the flag off, generation is byte-identical to today (this is the control).

**A2 — build-time annotation** (`server.mjs`)
- `annotateTargets(questions, ctx)` — best-effort, fire-and-forget, fully try/caught. Fired (un-awaited) from `/build-extra` and `/import` for `kind==='qbank'`, so it adds zero latency and can never fail a build.
- Idempotent: skips any `qh` already in `question_targets`. Batched extraction (one model call per build) + per-proposal reconciliation only when candidates exist. Writes `question_targets`; mints a `knowledge_targets` row only on a genuine `NEW`.
- `qbHashServer` replicates the client `qbHash` **exactly** (verified) so `question_targets.qh` will line up with the scheduler's keys at A6.

**A4 — corpus backfill** (`POST /admin/targets/backfill`, admin-only)
- Scans topics with a `qbank` extra, runs the same `annotateTargets` path in batches, idempotent on rerun. Returns a summary.

**A5 — audit** (admin-only endpoints + `#/admin-targets` page in-app)
- `GET /admin/targets/stats` — aggregate dashboard: processed, MATCH/NEW/AMBIGUOUS counts + %, unresolved, targets created, questions-per-target, singletons, heavy (≥8) targets, confidence distribution.
- `GET /admin/targets/ambiguous` — each ambiguous mapping with the proposed target, candidate targets + scores, and their canonical statements.
- `POST /admin/targets/resolve` — records a human decision (`match | new | keep`) as its **own event** in `resolution` (`{action, target_id, by, at, from_state}`); `map_state` (the AI verdict) is **never overwritten**. So the trail reads "AI proposed X → reconciliation said AMBIGUOUS → Frank approved Y" — calibration data.
- In-app review surface at Admin → "🎯 Knowledge Targets audit": KPI dashboard + an AMBIGUOUS review list with `[Match this target] [Create new] [Keep ambiguous]` per item.

**Verified:** `server.mjs` + `targets.mjs` parse; app inline JS parses; 5 client harnesses green; 17 reconciliation-guard tests green; batch-parse aligns + drops bad items; `qbHashServer === client qbHash`.

**To activate (Frank):** run `import-server/sql/knowledge_targets.sql` in Supabase, deploy the server, set `MEDBANK_TARGETS=shadow`, then Admin → Knowledge Targets audit → Run corpus backfill. Leaving the flag `off` keeps everything inert.

Gate unchanged: **no scheduler changes before A6**, and A6 only proceeds once the A5 audit shows the mapping is trustworthy.
