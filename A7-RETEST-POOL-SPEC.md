# A7 — AI Parallel-Retest Generator + Retest Pool — DESIGN CONTRACT (draft for sign-off)

_Status: **contract only — no code yet.** Mirrors the A6 discipline: freeze the contract + deterministic acceptance matrix first, then build against it. A6 is frozen; A7 sits **downstream** of the Target layer and must not reopen any frozen guarantee._

Date drafted: 2026-08-25. Depends on: A6 (frozen), reconciliation engine + V1 adjudicator (frozen), knowledge_targets/question_targets (frozen).

---

## §0. The one question A7 answers

> When a Target is due for retest but **no unused canonical question remains** (`no_fresh_assessment`), can we generate a *new assessment of that same Target*, prove it is Target-equivalent, serve it, and feed it into the exact same retention machinery — **without** minting Targets, polluting the canonical corpus, substituting another Target, or becoming an uncontrolled cost sink?

A7 turns `no_fresh_assessment` from a dead end into a *transient* state. It changes nothing about *how* retention is scheduled — only *what question* fills a due slot when the canonical pool is dry.

**A7 is NOT:** a new Target taxonomy, a reconciliation change, an Intervention Engine, a scheduler redesign, or a corpus authoring tool. Those are A8+.

---

## §1. Control flow (the only place A7 is allowed to act)

At retest serve-time for a due Target X (this is A6's `qbServeForRecord` decision, extended):

```
(async, on canonical exhaustion) last unused canonical for X served ─► background: generate→validate→pool (up to POOL_CAP candidates)

Target X due
 ├─ unused CANONICAL question for X?  ── yes ─► serve it            (A6 path, unchanged)
 └─ no  (canonical pool exhausted)
     ├─ unused `candidate` in Retest Pool for X? ── yes ─► serve it   (A7 normal path — instant, pre-validated)
     └─ no ─► LAZY FALLBACK: generate → validate → pool → serve
              └─ generation unavailable / fails ─► REMAIN no_fresh_assessment   (safe)
```

**Canonical always wins.** A7 is reached only after the canonical pool for X is provably exhausted (Invariant 2). A7 never competes with an available fresh canonical question.

**Timing — LOCKED (D1, final 2026-08-25): opportunistic background pre-generation after canonical exhaustion, with lazy as the emergency fallback.** _(Supersedes both the pure-pre-generation and the pure-lazy picks.)_

- **Replenishment trigger (the normal path):** the moment the **last unused canonical question for X is served**, asynchronously generate + validate up to `A7_POOL_CAP` (3) retests into the pool. We spend budget only on Targets whose canonical supply is *actually* exhausted — never on Targets that merely *might* become due. By the time X is due again, a validated item is waiting → **instant serve, no student wait**.
- **Lazy fallback (the emergency path):** if X is due and the pool has no `candidate` (background gen hadn't run, was still running, or failed), fall back to generate-validate-serve inline. If that also fails ⇒ `no_fresh_assessment`.

This gets the UX of pre-generation (no latency at the worst moment) with the cost discipline of lazy (nothing generated speculatively). All invariants hold regardless of *when* generation fires; the matrix is written against the orchestrator, not the schedule.

---

## §2. Hard invariants (Frank's 8, refined to be testable, + 2 additions)

| # | Invariant | Enforcement (how it's guaranteed, not just asserted) |
|---|-----------|------------------------------------------------------|
| I1 | **Target identity is immutable.** Generator receives `target_id`; cannot create or change a Target. | Generator input is the frozen Target *contract* (statement/skill/topic), not a corpus to classify. Pipeline has **no** write path to `knowledge_targets`. Audited by INV-B. |
| I2 | **No silent AI substitution.** Generation only when canonical pool for X is exhausted; never competes with a fresh canonical question. | Serve order in §1 is canonical → pool → generate. Gating is a pure predicate on `qbQuestionsForTarget(X, servedQhs)`. |
| I3 | **Generated question must be Target-equivalent.** Same independently-testable claim; no facet/subset/broader drift. | **Round-trip reconciliation gate (§4):** the generated question is put back through the *frozen* extract→retrieve→decide pipeline and must return `MATCH` to **X specifically**. Any NEW / AMBIGUOUS / MATCH-to-Y ⇒ reject. |
| I4 | **Generated content is disposable.** Lives in the Retest Pool, never the canonical `topics.extras.qbank`. | Separate store (§3). A7 has **no** write path to `topics.extras.qbank`. Audited by INV-A. |
| I5 | **Generation failure is safe.** Timeout / bad output / validation fail ⇒ stay `no_fresh_assessment`; never substitute another Target; retention record **not** advanced. | Failure returns `{noFresh:true}` — the identical A6 outcome. No attempt is recorded, so `qbSchedApply` is never called. |
| I6 | **An AI question cannot consume the Target twice.** Once served, its `qh` joins X's `servedQhs`. | Same anti-repeat path as canonical questions; generated `qh` = hash(stem+options), appended on serve. |
| I7 | **Human/audit visibility.** We can see which questions were generated, for which Target, why, and whether they passed validation. | Retest Pool row carries `target_id`, `qh`, content, `generated_at`, `model`, `validation{reconciled_to,confidence,matched_via,passed,reason}`, `status`, `served_count`. Admin page lists them per Target. |
| I8 | **Cost control.** A repeatedly-due Target cannot become an uncontrolled AI-cost sink. | Bounded policy (§6): per-Target retained-pool cap, per-due regeneration-attempt cap, global daily budget, exponential backoff after failures. |
| **I9** (add) | **Retention parity.** An attempt on a generated question drives `qbSchedApply` **identically** to a canonical one (same ladder, same misconception/streak/anti-repeat), keyed `t:X`. | Generated item carries `target_id=X` ⇒ `qbRetentionKey` returns `t:X` automatically. No A7-specific retention code. |
| **I10** (add) | **Idempotent, non-authoritative pool.** Regenerating or clearing the pool never alters retention records, Targets, or canonical questions. Pool is a cache of disposable assessments. | Pool writes are isolated from `_sched`, `knowledge_targets`, `question_targets`, `topics.extras`. |
| **I11** (add, Frank) | **The generated question cannot redefine what "correct" means for the Target.** The Target contract stays authoritative: meaning → question → answer/explanation, **never** question → AI reinterprets Target. Blocks A7 becoming a backdoor Target-reconciliation system. | The validation gate extracts the knowledge statement from the question **as answered** (stem + keyed-correct option + rationale), so a mis-keyed answer that encodes a different claim drifts the extraction and **fails** the MATCH→X gate. Nothing A7 produces is ever written back to `knowledge_targets`. |

---

## §3. Retest Pool — storage model

A dedicated store, **not** the canonical corpus. **LOCKED (D2): server table `retest_pool`** — satisfies audit (I7), survives across devices, and lets validation reuse the server-side frozen reconciliation code directly:

```
retest_pool(
  id            uuid pk,
  target_id     text  not null,     -- the Target this assesses (immutable, from knowledge_targets)
  qh            text  not null,     -- hash(stem+'|'+options.join('|')) — same identity fn as everywhere
  account_id    text,               -- scope (or null = shared)
  content       jsonb not null,     -- {stem, lead_in, options, answer, rationales, ...} — same shape as a qbank item
  source        text default 'ai_retest',
  model         text,
  generated_at  timestamptz,
  validation    jsonb,              -- {reconciled_to, confidence, matched_via, passed:bool, reason, checks:{structural,antidup}}
  status        text,               -- 'candidate' | 'served' | 'invalid' | 'quarantined' | 'expired'
  served_count  int default 0,
  unique(target_id, qh)
)
```

The client fetches unused **validated** items for a due Target exactly as it fetches canonical questions. (Client-only storage was rejected: it forfeits audit, cross-device sync, and server-side reuse of the frozen validation code.)

**Pool membership is an explicit STATE, not an attribute buried in the question** (per Frank). A generated item moves through a small state machine; **`canonical` is never one of these states** — a generated question can never become canonical (I1/I4):

```
generated_retest ──validate──► candidate ──serve──► served
      │                 │                              │
      │            fail │                              │ later flagged
      ▼                 ▼                              ▼
   (n/a)             invalid                      quarantined
                        │
                 cap/superseded
                        ▼
                     expired
```

| State | Meaning | Servable? | Can become canonical? |
|-------|---------|-----------|-----------------------|
| `candidate` | generated + passed the validation gate, unused | yes | **no** |
| `served` | served for its Target once; `qh` in that Target's `servedQhs` | no (anti-repeat) | **no** |
| `invalid` | failed structural / anti-dup / reconciliation gate | never | **no** |
| `quarantined` | passed, served, later flagged (audit/human/heuristic) → withheld | never again | **no** |
| `expired` | retired: canonical fresh question later superseded it, or pool over cap | no | **no** |

**Retirement/quarantine never touch retention** (`_sched`, Targets, canonical corpus). The `status` column holds these values; `content` never migrates to `topics.extras.qbank`.

---

## §4. Validation gate — the intellectual core

A generated question is served **only** if it passes, in order (cheap → expensive, fail-closed):

1. **Structural.** Exactly one correct answer; 4–5 distinct options; valid `answer` index; non-empty stem; rationales present. Fail ⇒ reject (no LLM spent on reconciliation).
2. **Anti-duplication.** `normStatement`/stem Jaccard below `A7_ANTIDUP_MAX` (proposed 0.85) against, for X: **served canonical questions + served generated questions + existing unused `candidate` retests** (NOT `invalid`/`quarantined`/`expired`). Comparing against live candidates stops two concurrent generations from parking near-identical items in the pool. Too similar ⇒ reject (not a *fresh* assessment).
3. **Round-trip reconciliation (the guarantee for I3).** Run the generated question through the **frozen** pipeline: `tExtractBatch` → `retrieveCandidates` → `decide`. **Pass iff** `decision.state==='MATCH'` **and** `decision.target_id===X` **and** `decision.confidence ≥ A7_MATCH_CONF_FLOOR` (**LOCKED D4: confidence floor on**). Any of `NEW` (drifted out), `AMBIGUOUS` (not clean), `MATCH→Y` (sibling drift), or a **too-weak MATCH→X** (below floor) ⇒ reject. Rationale: a barely-passing self-MATCH is not strong enough evidence that the generated item truly assesses X; a weak match is treated as drift.

Because the gate *is* the frozen reconciliation engine, a generated question is held to the exact same bar as any real question, and the generator is structurally incapable of reopening reconciliation — it proposes, `decide()` (frozen) adjudicates, only a clean self-MATCH survives.

On a failed candidate: set `status='invalid'` with the cause in `validation.reason` (never the undefined `rejected`); increment the **candidate-rejection** counter; regenerate up to `A7_MAX_ATTEMPTS`; if still failing ⇒ `no_fresh_assessment` (I5).

---

## §5. Generation prompt contract (generator is downstream of the Target layer)

Per Frank: **the prompt is NOT responsible for Target identity.** The Target already exists and is frozen. The generator is told the contract and asked to assess it:

> *Input:* the frozen **Target Contract** —
> ```
> target_id:  T-XXXX
> canonical claim:  [exact independently-testable claim]
> scope:            [what IS included]
> exclusions:       [what is explicitly OUTSIDE this Target]
> assessment constraints:  [question-type / difficulty / clinical-framing rules]
> ```
> plus the stems of already-served questions for X (as **negative examples to avoid duplicating**, not to classify).
>
> **Sourcing `exclusions`:** the frozen target record carries the claim/skill/topic; `scope`/`exclusions` are supplied by feeding the Target's **neighboring Targets** (the same-topic candidates that `retrieveCandidates` already surfaces) as explicit "this is NOT what you're testing" anchors. This reuses frozen machinery and is the concrete defense against facet/subset/neighbor drift.
> *Task:* "Produce one **new, independently-testable** multiple-choice question that assesses **this exact contract**. Do not test a facet, a subset, or a broader claim. Do not restate an existing question."
> *Output:* a single qbank-shaped item (stem, lead_in, options, answer, rationales).

It never sees "here are questions, figure out the Target" — that would reopen reconciliation. Identity flows *in*, never *inferred out*.

---

## §6. Cost / bounded-generation policy (I8)

**Two distinct counters (clean telemetry):**
- **generation-attempt counter** — increments **whenever A7 calls the generator**, including timeouts/network errors (no candidate produced). Counts against `MAX_ATTEMPTS` and the daily budget.
- **candidate-rejection counter** — increments **only when a returned candidate fails validation** (structural / anti-dup / reconciliation / floor). Each rejection writes a `status='invalid'` row for audit.

A timeout is a failed *generation attempt* with no candidate row; a bad candidate is a *rejection* with an `invalid` row. Both count toward `MAX_ATTEMPTS`.

Proposed defaults (Decision D3 — all tunable, none load-bearing for correctness):

- **Per-Target pool cap** `A7_POOL_CAP = 3` = the maximum number of **`status='candidate'`** (validated, unused) items for X. `served` / `invalid` / `quarantined` / `expired` items **do not** consume the cap, so the pool can never become permanently blocked by history. At cap ⇒ no new generation.
- **Per-due regeneration attempts** `A7_MAX_ATTEMPTS = 2` before giving up to `no_fresh` for that due event.
- **Global daily budget** `A7_DAILY_MAX` generations per account (proposed 200) and/or a token ceiling; exhausted ⇒ new due Targets stay `no_fresh` until reset.
- **Backoff after failure** for a Target: exponential cooldown (1 → 2 → 4 days, capped) before A7 retries it, so a Target the model can't assess cleanly isn't retried every open.
- **Validation confidence floor** `A7_MATCH_CONF_FLOOR = 0.85` (above reconciliation's `T_match = 0.80`): a MATCH→X below this is rejected as too weak to serve (D4). Configurable; does not affect the frozen reconciliation threshold — it is a *serve* gate layered on top.

**Defaults LOCKED (D3): accepted as above.** All are tunable and affect only how many serves happen, never whether a serve is correct.

None of these can cause a wrong serve — only *fewer* serves. Correctness lives entirely in §2/§4.

---

## §7. Failure semantics (I5 restated as a table)

| Failure | Behavior |
|---------|----------|
| Generator timeout / network error | **failed generation attempt** (increments the generation-attempt counter, counts against `MAX_ATTEMPTS`/budget) but produces **no `retest_pool` row**; remain `no_fresh_assessment`; retention untouched |
| Malformed output (structural fail) | reject; regenerate ≤ attempts; else `no_fresh` |
| Anti-dup fail | reject; regenerate ≤ attempts; else `no_fresh` |
| Reconciliation ≠ MATCH→X (or below floor) | candidate → `status='invalid'`, cause in `validation.reason`; regenerate ≤ attempts; else `no_fresh` |
| Budget exhausted / in backoff | remain `no_fresh`; do not call the model |

In **every** row: no substitution from another Target (I2), no retention advance (I9), no corpus write (I4).

---

## §8. Audit / telemetry

- Admin (extends the existing `#/admin-targets` page): per-Target list of generated retests — content, `validation.passed`, `reconciled_to`, `matched_via`, `served_count`, `status`. Counters: generated, passed, rejected-by-reason, served, retired, backed-off.
- Server endpoint(s) (names TBD at build): `POST /admin/retest/generate` (manual/priming), `GET /admin/retest/pool?target_id=`, `GET /admin/retest/stats`.

---

## §9. Explicitly NOT in A7 (deferred to A8+)

Promotion of a proven generated question into the canonical `qbank` (human-reviewed); multi-question retest batches; difficulty adaptation of generated items; cross-account shared pools; any change to reconciliation thresholds or the V1 adjudicator.

---

## §10. Decisions — RESOLVED (2026-08-25)

- **D1 — Timing:** ✅ **Hybrid: opportunistic background pre-generation after canonical exhaustion + lazy fallback** _(final — supersedes both the pure-lazy and pure-pre-generation picks)_. Trigger replenishment when the **last canonical question for X is served**; keep up to `POOL_CAP=3` validated candidates ready for instant serve; fall back to lazy generate-at-due only if the pool is empty; else `no_fresh_assessment`. Best UX + cost discipline, all invariants preserved.
- **D2 — Pool location:** ✅ **Server `retest_pool` table.** Audit (I7), cross-device, server-side reuse of frozen validation.
- **D3 — Budget defaults:** ✅ **Accepted** (`POOL_CAP=3`, `MAX_ATTEMPTS=2`, `DAILY_MAX=200`, backoff 1/2/4d).
- **D4 — Validation strictness:** ✅ **Confidence floor ON.** MATCH→X **and** `confidence ≥ A7_MATCH_CONF_FLOOR` (0.85). A weak self-MATCH is treated as drift and rejected.

---

## §11. Deterministic acceptance matrix (LLM mocked at the generate + reconcile seams)

The generator and reconciler are non-deterministic, so they are **injected/mocked**; the *orchestration contract* around them is fully deterministic and is what these tests pin. Build the orchestrator so `generate()` and `validate()` are injected dependencies (as A6 did with pure logic), then:

| # | Scenario | Mocked seam | Expected |
|---|----------|-------------|----------|
| 1 | Target due, **fresh canonical exists** | — | A7 **not invoked**; canonical served (I2) |
| 2 | Target due, canonical exhausted | — | A7 invoked |
| 3 | Generator returns Q, reconcile ⇒ MATCH→X (≥ floor) | gen ok, reconcile MATCH→X conf 0.90 | accepted; stored `candidate`→`served`; `qh`∈servedQhs (I3,I6) |
| 3b | Reconcile ⇒ **MATCH→X but below floor** | reconcile MATCH→X conf 0.82 | **rejected** as too-weak (D4); Target stays `no_fresh` |
| 4 | Reconcile ⇒ MATCH→**Y** (sibling drift) | reconcile MATCH→Y | **rejected**; not served; Target stays `no_fresh` (I3,I5) |
| 5 | Reconcile ⇒ NEW | reconcile NEW | rejected (I3) |
| 6 | Reconcile ⇒ AMBIGUOUS | reconcile AMBIGUOUS | rejected (I3) |
| 6a | Candidate tests only a **facet/subset** of X | reconcile ⇒ NEW or AMBIGUOUS (narrower) | rejected; never served (I3) |
| 6b | Candidate **broadens** X | reconcile ⇒ MATCH→broader / NEW | rejected; never served (I3) |
| 6c | Candidate tests a **neighboring** Target | reconcile ⇒ MATCH→Y | rejected; never served (I3) |
| 7 | Structural-invalid output | gen bad options | rejected **before** reconcile (no LLM spent) |
| 8 | Near-duplicate of a served Q for X | gen dup stem | rejected by anti-dup |
| 9 | Accepted Q **disposability** | gen ok, MATCH→X | written to `retest_pool`, **not** `topics.extras.qbank` (I4 / INV-A) |
| 10 | **Identity immutability** | gen ok, MATCH→X | `knowledge_targets` count unchanged; item carries `target_id=X` (I1 / INV-B) |
| 11 | Served-once | serve accepted Q | `qh`∈servedQhs; not re-served for X (I6) |
| 12 | Generator timeout / empty | gen throws | `no_fresh_assessment`; no substitution; retention **not** advanced (I5,I9) |
| 13 | Budget: pool at cap | pool has CAP unused | no generation attempted (I8) |
| 13b | Attempts cap | reconcile fails twice | stops after `MAX_ATTEMPTS`; `no_fresh` |
| 14 | Backoff | prior failure recent | not retried before cooldown elapses (I8) |
| 15 | **No-substitution invariant** (cross-Target) | any failure path | no other Target's question (canonical **or** generated) ever served for X (I2) |
| 16 | **Retention parity** | attempt on accepted Q | `qbSchedApply` advances/resets `t:X` identically to a canonical attempt (I9) |
| 17 | Served item **later flagged** | mark flagged | → `quarantined`; never served again; never canonical (state machine) |
| INV-A | Corpus disposability | N generations | canonical qbank question count invariant |
| INV-B | No target minting | N generations | `knowledge_targets` count invariant |

**Exit criterion (mirrors A6):** every row green as pure tests with the LLM mocked; then a shadow/live pass on the test account confirms a real generated retest for an exhausted Target passes the round-trip gate and serves — before A7 is frozen.
