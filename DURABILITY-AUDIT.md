# Durability Audit — what MedBank knows, and where it knows it

**Read-only. 9 September 2026.** No code changed, nothing written, everything frozen.
Question: *what is durable server-authoritative state, what exists on the server but is outside
the learning path, and what is still only a client-side signal?*

**Headline:** the answer is not "identity is durable, learning is not". It is that
**MedBank already contains a complete, normalised, server-side memory schema that was built and
never wired up.** Any decision about `LEARNING_EVENTS` has to reckon with that first, or we add a
third home for learning state to the two that already exist.

---

## The three states, applied

### ① Server-authoritative durable state

| What | Where | Volume |
|---|---|---|
| Lecture content | `topics` (note_md, simplified_md, transcript, extras) | 383 |
| Question & card content | `cards` (written at build, read by content-loader) | 4,814 |
| **Question identity** | `question_targets.qid` | **905 / 905, 0 duplicates** |
| Content-version identity | `question_targets.qh` | 996 rows |
| Concept identity | `knowledge_targets` | 648 |
| Question → concept mapping | `question_targets.target_id` | 849 resolved |
| Integrated-question corpus | `integrated_items` | 637 |
| Accounts / courses / profiles / subscriptions | — | 8 / 35 / 8 / 8 |

This half is genuinely solid, and 01.5a is why the first row can now be asserted.

### ② Server-side, but outside the learning path

| What | Rows | Status |
|---|---:|---|
| `learning_events` | 14 | The new ledger. All 14 rows are my own verification writes. Flag off; nothing reads it. |
| `intervention_events` | 20 | Its own header: *"Nothing in the learning path reads this table."* |
| **`srs_state`** | **0** | **Per-card SRS: `box, due, seen, lapses, starred`. Zero code references anywhere.** |
| **`daily_log`** | **0** | `account_id, log_date, new_counts, rev_count`. Zero code references. |
| **`plan_items`** | **0** | `level_profile_id, topic_id, position`. Zero code references. |
| `streaks` | 8 | Has rows, but zero code references — written by something no longer running. |
| `retest_pool` | 0 | A7 built, never populated. |

### ③ Client-owned learning signal

Everything a student actually *does* lives in one JSONB blob, `profile_state.state`, synced whole.

| Signal | Path in the blob | Live volume | Cap |
|---|---|---|---|
| Flashcard SRS (box/due/lapses) | `state.cards` | 161 / 7 cards | — |
| Q-bank answers | `state.qbank._attempts` | **137 / 134** | 4,000 |
| Telemetry events | `state.qbank._events` | **670 / 357** | **1,000** |
| Question snapshots | `state.qbank._qmeta` | 73 / 77 | — |
| Q-bank target schedule | `state.qbank._sched` | **1 / 0** | — |
| Reading progress, notes, folders, streak, study time, daily log, exams, plan | `state.read`, `.notes`, `.folders`, `.streak`, `.study`, `.log`, `.exams`, `.plan` | — | — |

Blob sizes 401 kB / 313 kB / 39 kB, at revisions **4,889 / 1,692 / 1,197** — i.e. thousands of
whole-document rewrites.

---

## Five findings

### 1. The memory layer has a server home that was never moved into

`srs_state` is not a vague idea — it is a table whose columns are **exactly** the fields the
client blob holds per card (`box`, `due`, `seen`, `lapses`, `starred`). It has zero rows and zero
code references. So does `daily_log`, whose columns mirror `state.log`. So does `plan_items`.

Someone designed the normalised server-side memory model, created it, and the blob won anyway.

**This is the prerequisite nobody had noticed.** Turning on `LEARNING_EVENTS` would give MedBank
*three* server-side stories about learning: an empty normalised SRS schema, a write-only event
ledger, and the blob that is actually authoritative. The right question is not "should we enable
the ledger" but "which of these is the system of record, and what happens to the other two".

### 2. The truncation risk is real, but it is the EVENTS array, not attempts

My original audit warned about a 4,000-attempt ring buffer. Measured:

```
_attempts   137 / 4000   and   134 / 4000     ← no loss yet, and years away at this rate
_events     670 / 1000   and   357 / 1000     ← 67% full
```

**Nothing has been lost yet.** I overstated the immediacy for attempts and understated it for
events: `_events` is two-thirds full and *will* start silently discarding the oldest telemetry
within a few hundred more interactions. That is the concrete deadline, and it is close.

### 3. Concept identity binds to questions only

`target_id` appears in 7 tables — `knowledge_targets`, `question_targets`, `integrated_items`,
`retest_pool`, `intervention_events`, `learning_events`, and the admin view. **Every one of them
is assessment-side.**

- `topics` (the notes) has **no** `target_id`.
- `visualizations` keys on `text_key` / `concept_id` — a **different identity namespace entirely**.

So "target → note" and "target → visual" do not exist as relationships. Roadmap item 06 is not an
extension of the current model; it is a new binding across two namespaces that currently share
nothing.

### 4. The Q-bank target scheduler is effectively unused

`_sched` holds **1 entry in one profile and 0 in the other**, against 905 questions and 648
targets. The A6/A7 target-retention machinery is built, deployed and flag-on — and has almost no
state, because so few questions carry a `target_id` for it to key on (the 28% stamping ceiling).
The scheduler is not broken; it has nothing to schedule.

### 5. Two students, and the data is small

Two profiles carry essentially all activity (rev 4,889 and 1,692); the rest are near-empty.
Total learning signal in existence: ~271 attempts, ~1,027 events, ~168 SRS cards.

That is a genuinely good position for a migration — the cost of getting the architecture right is
near zero today, and rises with every student.

---

## Answering the question directly

**Durable:** content, question identity, content-version identity, concept identity, and the
question→concept mapping. That is the whole of what 01.5a and the target layer bought.

**Not durable:** *everything about the learner*. Every answer, every review, every SRS box, every
reading position, every streak. All of it is client-owned, capped, and synced as one blob whose
top-level shape is rewritten in full on every change.

**Between the two:** an empty normalised SRS schema, an empty ledger, and a telemetry table that
nothing reads.

---

## What this implies for the next move (not a proposal — an argument)

Enabling `LEARNING_EVENTS` is defensible: it is additive, write-only, and stops the *future* loss.
But on this evidence it is **not obviously the next architectural move**, for two reasons:

1. **It does not rescue the memory layer.** The ledger records that a card was reviewed; it does
   not make `state.cards` durable. The SRS state — the thing the scheduler actually reads — stays
   in the blob either way. `srs_state` sitting empty is the sharper problem.
2. **It would be the third store.** Adding it without deciding the fate of `srs_state`,
   `daily_log` and `plan_items` means four places learning state could live, three of them
   partially right.

The one thing with a real clock on it is `_events` at 670/1000. If the priority is "stop losing
data", that is the specific thing being lost, and it is telemetry rather than learning history.

Three coherent orderings, for you to choose between:

- **A. Ledger first** — enable `LEARNING_EVENTS`, accept three stores, decide later. Fastest,
  additive, reversible. Leaves the memory question untouched.
- **B. Decide the system of record first** — settle whether normalised tables or the ledger are
  authoritative for learning state, then wire exactly one. Slower, but stops the accretion.
- **C. Narrow rescue** — raise or drain the `_events` cap so nothing is lost while B is decided.
  Smallest possible action against the only measured deadline.

I am not recommending one from inside this audit; the choice depends on whether you want to move
or to consolidate. What I would say plainly is that **"enable the ledger" and "make learning state
durable" are not the same project**, and today they look like one.

---

## Frozen

No code changed. No data written. `LEARNING_EVENTS` remains `false`. 01.5b and 01.5c remain
deployed-but-dormant, awaiting the next legitimate resolver run.
