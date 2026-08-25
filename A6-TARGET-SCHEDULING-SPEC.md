# A6 — Target-ID Scheduling (design spec, NOT yet implemented)

_First change to the previously-frozen scheduler. Deliberately narrow. Target reconciliation layer stays FROZEN._
_Answers ONE question: can the existing client scheduler safely move from question-hash retention to validated Knowledge-Target retention, using the existing Q-bank?_

---

## 0. Locked contract
- **Data path #1:** build-time / backfill writes `target_id` onto each question in `topics.extras.qbank`. No runtime network dependency; the offline/local scheduler stays intact.
- **Eligibility invariant (server-enforced at write time):**
  ```
  MATCH        → target_id = canonical target
  human NEW    → target_id = newly-created target
  AMBIGUOUS    → target_id = null (absent)
  unresolved   → target_id = null (absent)
  ```
  ⇒ **Only questions with an authoritative Target mapping participate in Target-based scheduling.** AMBIGUOUS is structurally excluded — it never gets a `target_id`, so the client can't schedule it.
- **No AI** (generation/rephrasing is A7). **No reconciliation changes** (frozen). **No streak/commitment policy changes** except the identity seam below.

---

## 1. Server side (propagate the resolved target_id to the client)
Reconciliation is unchanged; we only PROPAGATE its already-decided result to client-visible data.
- `annotateTargets`: after `decide()`, if `MATCH` or (later) a human `NEW`, write `target_id` onto the matching question object in that topic's `extras.qbank` and persist the topic. `AMBIGUOUS`/unresolved → leave `target_id` absent.
- `/admin/targets/resolve`: when a human resolves AMBIGUOUS → MATCH/NEW, also write the `target_id` onto the question in `extras.qbank`.
- Backfill endpoint: one pass to stamp `target_id` onto existing MATCH/human-NEW questions in every topic's `extras.qbank`.
- Client already loads `extras.qbank`; each question object simply gains an optional `target_id`.

## 2. Retention identity: `qh` → `target_id`
- Current: `qbStore()._sched[qh]` — each question its own retention record.
- A6: retention keyed by **retentionKey(q)** = `q.target_id` if present, else `"qh:"+qh` (legacy fallback).
- Consequence (intended): **two questions mapped to the same Target share ONE retention record** — the concept's retention, not the question's. Different Targets keep independent histories.
- `qbSchedApply(q, ok, conf)` resolves `retentionKey(q)` and updates that record. Ladder (1→3→7→14), near-miss classification, streak — all unchanged; they now operate on the Target's record.

## 3. Question selection when a Target is due
- The retention record adds `servedQhs: []` — the question hashes already served **for this Target** (per-Target, not global).
- When Target X is due, from all corpus questions with `target_id === X`, pick one whose `qh ∉ servedQhs`. Serve it; append its `qh` to `servedQhs`.
- This is concept-equivalent retesting with the *existing* Q-bank: a different question on the same Target each due event.

## 4. Anti-repeat
- Exclude **all** previously-served qhs for the Target (not just the last). Tracked per-Target in `servedQhs`.
- No global exclusion — a qh served for Target X is unrelated to Target Y.

## 5. No-fresh-assessment state
- If Target X is due but every eligible question (`target_id===X`) is already in `servedQhs`, enter an explicit **`no_fresh_assessment`** state for X.
- **Do NOT substitute a question from another Target.** X stays due/flagged; no fresh item is served.
- (A7 fills this gap with an AI parallel question. A6 does nothing here.)

## 6. Backward compatibility
- Unmapped questions (`target_id` absent) keep the existing `qh:`-keyed behavior — no regression for users mid-flight or for AMBIGUOUS/unmapped content.
- **Migration seam:** on load, for an existing `_sched[qh]` record whose question now has a `target_id`, fold it into the Target record: if the Target has no record yet, re-key `qh`→`target_id` (carry interval/dueAt/streak, seed `servedQhs=[qh]`); if both exist, merge conservatively (min dueAt, max interval, union `servedQhs`, keep higher priority/misconception flag). One-time, idempotent, guarded.

## 7–8. Frozen
- Target reconciliation (retrieval, adjudicator V1, near-miss, excludes, sticky): **untouched**.
- Streak/commitment policy: **untouched** except that streak counts now attach to the Target record via the same `qbSchedApply` path (identity seam only — no policy change).

---

## Deterministic acceptance matrix (must pass BEFORE touching the live scheduler)
Unit-tested against extracted functions, no network:

| # | Situation | Expected |
|---|---|---|
| 1 | Target due + 3 unused mapped questions | serve one (any), append its qh to servedQhs |
| 2 | Same Target due again | serve a *different* one (qh not in servedQhs) |
| 3 | All the Target's questions exhausted | **no_fresh_assessment** — no item served |
| 4 | AMBIGUOUS question (no target_id) | never selected for Target scheduling |
| 5 | Unmapped question answered | legacy `qh:` retention record (no regression) |
| 6 | Two questions, same Target | one shared retention record (same learning target) |
| 7 | Two questions, different Targets | independent retention records |
| 8 | Target due, zero eligible questions | no_fresh_assessment; **no substitution** from another Target |
| 9 | Migration: existing qh-record whose question now has a target_id | folded into Target record once, idempotent |

**A6 exit:** all 9 pass as pure unit tests → then wire into `qbStartDue`/`qbSchedApply` behind the existing flag → live check on the test account → only then consider it done.

---

## Explicitly out of scope (A7+)
AI parallel-retest generation, Retest Pool, Intervention Engine, target atomicity/splitting, orphan cleanup, threshold calibration. Each is in the Decision Ledger with a revisit trigger.

---

## BUILT — 2026-08-25 (awaiting Frank review + deploy)

**Client (`app.html`)** — scheduler block rewritten, keyed by retention identity:
- `qbRetentionKey(qh)` = `t:<target_id>` when known, else `q:<qh>` (legacy / AMBIGUOUS / unmapped fallback).
- `qbSchedApply` operates on the retention key; records the answered `qh` on `servedQhs` (anti-repeat).
- `qbServeForRecord` / `qbQuestionsForTarget`: a due Target draws a FRESH unused sibling question; if none remain → `noFresh` (no_fresh_assessment), excluded from the due list, never substituted by another Target's question.
- `qbMigrateSched()`: one-time, idempotent fold of pre-A6 bare-`qh` records into Target records (min dueAt, max interval, union servedQhs, keep higher prio/miscon). Guarded by `window._qbSchedMigrated`, runs once at top of `render()`.
- `target_id` added to both `_qmeta` snapshots so the key resolves offline.
- Streak / commitment policy untouched.

**Server (`server.mjs`)** — `stampTargetIds(topic_id)` projects the AUTHORITATIVE mappings (`MATCH` ai OR any human resolution) from `question_targets` onto each question in `topics.extras.qbank`. ai-NEW and AMBIGUOUS/unresolved are NOT stamped (structurally excluded). Idempotent + self-correcting (strips stale ids). Wired into `annotateTargets` (per-topic, post-annotate) and `/admin/targets/resolve` (per-resolved-topic). New backfill endpoint **`POST /admin/targets/stamp`** stamps every topic.

**No new SQL** — `extras` is jsonb; questions just gain an optional `target_id`. `question_targets` already has target_id / map_state / mapping_source / mapping_status.

**Verification:** 23/23 live acceptance matrix (extracted from real app.html fns) + 9-row matrix + 2 cross-Target invariants; app.html inline parse OK; 5 QA harnesses PASS; `node --check server.mjs` OK.

**Deploy order (Frank):** push app.html + server.mjs → Render redeploys → `POST /admin/targets/stamp` once → confirm `questionsStamped > 0` → live test on frankthejay@gmail.com → freeze A6.
