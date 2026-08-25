# Mega Q-bank — Target Layer Decision Ledger

_Permanent reference for the Knowledge Target layer. Supersedes the need to remember this from conversation._
_Rule: **Deferred does not mean forgotten. Every unresolved question has a status, its evidence, and a revisit trigger. Frozen components are NOT reopened without NEW evidence.**_

Date frozen: 2026-08-24. Scheduler unlocked for A6 on this evidence.

---

## The north-star safety property (what the layer is judged by)
Not "how few AMBIGUOUS records do we have?" but:
> **An automatic MATCH means the learner is being treated as having demonstrated the SAME independently-testable knowledge claim.**
Evidence says the answer is currently **yes**: 0 observed false merges across the adversarial labeled set and the live corpus. The layer's failure mode is "too many targets / asks for human review" — never "silently merges distinct knowledge."

---

## ✅ Validated / FROZEN — do not touch without new evidence

| Component | Evidence | Rule |
|---|---|---|
| Tiered retrieval (T1 exact ∪ T2 same-topic ∪ T3 statement-overlap, ranked, reserve-under-cap) | churn collapsed **14 NEW → 2**; skill-drift→T2, topic-drift→T3 recovered | frozen |
| Retrieval precision (T2/T3 MATCHes) | all 5 non-T1 automatic MATCHes inspected = legitimate; 0 false | frozen |
| V1 adjudicator prompt | passes labeled A/B/C gates: **A 5/5 MATCH · B 0 false merges · C 0 forced-MATCH** | frozen — production |
| `excludes` / false-merge protection | 0 false merges on adversarial over-broad targets | frozen |
| Near-miss safety net (`null`+strong candidate → AMBIGUOUS) | prevents silent forks; uncertain never auto-MATCH | frozen (don't tune 0.30 yet) |
| **A6 Target-ID scheduling** (retention keyed by `target_id`, per-Target anti-repeat, `no_fresh_assessment`, idempotent migration) | **live-verified 2026-08-25**: stamp 53 authoritative / 12 AMBIGUOUS skipped / **invariant `ambiguousReceivedId=0`**; in-app scheduler 14/14 on real data (fresh-sibling served, Q1 never re-served, no cross-Target substitution, migration idempotent); 23/23 pure matrix + 13/13 stamp unit | **frozen** |
| A6 stamping = propagate-only (MATCH ai + human resolutions; ai-NEW & AMBIGUOUS excluded) | never mints/infers a mapping; self-correcting (strips stale ids) | frozen |
| Sticky human resolutions (`mapping_source=human`, reprocess skips resolved) | 7/7 preserved across re-runs incl. #0 | production rule |
| T3 token-overlap retrieval | located every excluded target at 0.6–0.95 | validated v1 (embeddings = future scale path, not now) |

---

## 🟡 Deferred — status + revisit trigger (NOT forgotten)

| Item | Why deferred | Revisit trigger |
|---|---|---|
| Target atomicity (one target = one atomic claim) | quality, not correctness; unresolved AMBIGUOUS never reaches scheduler | fast-follow after A6, using production evidence |
| Over-broad `BRONCH-NEXT-001` | authoring problem; magnet for facet-vs-broad AMBIGUOUS | include in atomicity pass |
| Over-broad DIC targets (`DIC-DX-001` bundling dx+consequences) | same | include in atomicity pass |
| `0.30` near-miss threshold | uncalibrated (deliberately) | revisit once enough human-resolved labels accumulate |
| `0.40` retrieval floor | uncalibrated | revisit if recall proves insufficient on more data |
| `K=8` candidate cap | uncalibrated | revisit if scale/recall demands |
| Orphan target cleanup (0-member duplicates from the bad run) | not a correctness issue | after stability + atomicity |

---

## ❌ Rejected — with reason (do NOT re-explore without contradicting evidence)

- **Adjudicator V2** — REJECTED: 0 false merges but over-committed → **3 false merges** on human-NEW facet-vs-broad cases (it matched on shared content). Blunt "commit on equivalence" is unsafe.
- **Adjudicator V3** — REJECTED: fixed the false merges (0/6 B) but regressed recall to **4/5 A** (missed a legitimate paraphrase). V1 already achieved 5/5 A + 0 false merges, so V3 does not beat V1. No reason to revisit unless new labeled evidence contradicts.
- **Loosening the retrieval pre-filter (drop skill/topic as a hard gate)** — REJECTED in favor of tiered retrieval: would have traded a 23% duplicate problem for a false-merge problem. Tiered union + adjudicator preserves precision.
- **Raw reproducibility test (re-derive human MATCH via engine)** — SUPERSEDED: a human MATCH override is by definition one the model scored <threshold; the engine cannot reproduce it. Sticky human authority is the correct architecture, not engine reproduction.
- **Lowering "obvious-same" auto-label to overlap ≥0.6 as a MATCH label** — REJECTED: overlap expands the candidate pool only; it must never assign the ground-truth label (would teach the evaluator the very mistake we prevent). Labels are human-assigned (A/B/C set).
- **Embeddings / vector search for T3** — NOT NOW: token overlap already solved the demonstrated failure. Add only when corpus scale proves T3 recall insufficient.

---

## A6 — scope, hard rules, rollout (the next build, deliberately narrow)

**A6 answers ONE question:** can the existing scheduler safely move from question-hash scheduling to validated Knowledge-Target scheduling, using the existing Q-bank?

**Hard rule (safety boundary):** only `MATCH` and human-confirmed `NEW` mappings are scheduler-eligible.
```
AMBIGUOUS → NOT scheduler-eligible → human resolution → MATCH/NEW → then eligible
```

**Rollout:**
```
existing scheduler  →  due record keeps question provenance
                    →  Target ID becomes the retention/scheduling identity
when a target is due:
  retrieve an eligible question for that Target (MATCH/NEW-mapped, active)
  EXCLUDE the previously-served question
  existing unused parallel question?  YES → serve it   NO → "no fresh assessment" state
```

**Explicitly NOT in A6:** atomicity splitting, new taxonomy, Intervention Engine, **AI retest generation**, Retest Pool, scheduler redesign. Those are A7+. A7 is specifically: "what happens when a Target has no unused existing question?" → that is where the AI parallel-retest generator belongs.

**A6 exit criterion:** Target-ID scheduling behaves correctly with the existing Q-bank (right question served for the due target, previously-served excluded, no AMBIGUOUS leakage), across repeated runs.

**✅ A6 EXIT MET — 2026-08-25.** Deployed (commit pushed by Frank; Render + medbank.com.ng live). Stamp run once: 53 stamped, 12 AMBIGUOUS skipped, 2 ai-NEW skipped, 0 stale, `invariantOk:true`. Live scheduler on frankthejay@gmail.com: 14/14 (schedules under Target, serves fresh sibling, never re-serves the seen question, exhausted→no_fresh_assessment with no substitution, migration idempotent). **A6 FROZEN.** Next: A7 — AI parallel-retest generator for the no_fresh_assessment gap.
