# Target Identity Audit

**Read-only audit against the production database, 8 September 2026.**
No implementation. No `MEDBANK_TARGETS` change. Nothing written.

**Headline:** the resolver is not the bottleneck, and my earlier "2 of 72" figure was measuring
the wrong thing. The real number going forward is **~30%**, the real bottleneck is a
**write-back gap**, and the real risk to the roadmap is **convergence**, not coverage.

---

## A. Inventory — what can actually be mapped

### The canonical question bank

```
topics carrying a qbank                 103
total questions                         905
questions carrying target_id in the JSON 256      (28.3%)
courses                                   4
```

### The mapping table

```
question_targets rows                   996        (996 distinct qh — no duplicates)
  MATCH                                 268        (26.9%)
  NEW                                   582        (58.4%)
  AMBIGUOUS                             146        (14.7%)

rows carrying a resolved target_id      849        (85.2%)
rows with target_id null                147        (AMBIGUOUS by design)
resolved by a human                       7        (0.7%)

knowledge_targets                       648        all status=active, 0 merged
```

### The headline ratio

**85.2% of questions the resolver has seen have a target. Only 28.3% of live questions carry
one.** Those two numbers describe different things, and the distance between them is the whole
problem.

Note also: **996 mapping rows for 905 current questions.** At least 91 mappings point at
questions that no longer exist in the canonical bank.

---

## B. Why so few — cause isolated

I tested each candidate cause you listed rather than guessing.

| Candidate cause | Verdict | Evidence |
|---|---|---|
| Stamping disabled | **No** | 256 questions carry a stamp; `stampTargetIds` has demonstrably run |
| Target resolver failure | **No** | 85.2% of seen questions resolved to a target |
| Missing target records | **No** | 648 active targets exist, 622 of them have questions attached |
| Client-side propagation failure | **No** | See the decisive test below |
| Mega bypassing the stamping path | **No** | A live Mega pool served 6 of 20 stamped (30%) |
| Questions genuinely unmapped | **Partly** | 146 AMBIGUOUS (14.7%) are unmapped *on purpose* |
| **Old questions / write-back gap** | **YES — this is it** | 849 resolved vs 256 stamped |

### The decisive test: propagation is NOT broken

I compared what the database stores against what the browser receives, for the same course:

```
SQL   — Paediatrics: 541 questions, 140 stamped  → 25.9%
CLIENT — Paediatrics: 541 questions, 140 stamped → 25.9%
```

Identical. The client gets exactly what is stored. Nothing is lost in transit.

### And a correction to my own earlier finding

The "2 of 72" figure I reported from the click-through came from `_qmeta`, which is **a
historical cache written by `qbRecord` at answer time and never refreshed**. It reflects
questions Frank answered over months, most of them before the target layer existed. It does not
describe what the system serves today.

```
_qmeta (historical, stale)          2 of 74     2.7%
live Mega pool (what is served now) 6 of 20    30.0%
canonical bank (stored)           256 of 905   28.3%
```

**The ledger will record `target_id` on roughly 30% of question events going forward, not 3%.**
That is a materially better starting position than the click-through implied, and I should have
distinguished the cache from the source before reporting it.

### The actual mechanism of the gap

1. `stampTargetIds` writes `target_id` back into `topics.extras.qbank` only for questions
   present in `question_targets` at the moment it runs.
2. `qh` is a **content hash of stem + options**, and — verified — **it is not stored on the
   question**: `items_with_qh_field = 0` across all 905 questions. It is recomputed every time.
3. So any edit or regeneration of a question changes its `qh` and **silently orphans its
   mapping**. That is the most likely source of the ≥91 orphaned rows.
4. Questions built before the target layer, or built while `MEDBANK_TARGETS` was off, were never
   sent through extraction at all and have no row to stamp from.

This is a backfill-and-identity-stability problem, not a resolver problem.

---

## C. Shadow resolver run — NOT DONE, needs your decision

I stopped short deliberately. Running the resolver over a sample means calling the import
server's target endpoints, and the ones that would produce the
`question → candidates → decision → confidence` trace you asked for
(`/admin/targets/backfill`, `/stamp`) **write to `question_targets`**. The read-only ones
(`/stats`, `/ambiguous`, `/near-miss`, `/health`) report on decisions already made rather than
making new ones.

Three options, your call:

1. **Read the decisions already recorded.** Every row in `question_targets` already stores
   `proposed`, `candidates`, `decision` and `map_confidence` verbatim — the full audit trail for
   996 real decisions. No new writes, and a much larger sample than a fresh run.
   **This is what I would do.**
2. Run `/admin/targets/backfill` on a small named sample, accepting that it writes.
3. Have me build a genuinely read-only shadow endpoint first.

Option 1 answers the question with more data and no side effects, so I would exhaust it before
writing anything.

---

## D. Stability — partial answer, and it is the real finding

I could not test "same question presented twice" without running the resolver (see C). But the
second half of your question — *do two different questions testing the same knowledge converge
on the same target?* — is answerable from the existing 849 mappings, and the answer is the most
important thing in this report.

### Convergence distribution

```
targets with 1 question mapped     472      (75.9%)
targets with 2                     105
targets with 3                      27
targets with 4                      15
targets with 5                       1
targets with 7                       2
                                   ---
targets with ≥2 questions          150      (24.1%)
```

**Three quarters of targets are one-question targets.**

### The resolver's disposition

```
NEW : MATCH  =  582 : 268  ≈  2.2 : 1
```

The resolver mints a new target **more than twice as often** as it recognises an existing one.

### What this means

That bias is not a bug — it is your stated principle, "a false merge is worse than a duplicate",
working exactly as designed. But it has a consequence for the roadmap that is worth stating
plainly:

> **In its current state, `knowledge_targets` behaves closer to a per-question identifier than to
> a concept identifier.**

That distinction is the whole basis of item 07. "This student knows the concept" rather than
"this flashcard is mature" requires that several different questions about one idea land on one
target. Today, for 76% of targets, there is only one question — so there is nothing to unify.

This does not mean the architecture is wrong. It means the corpus is young (648 targets over 905
questions is nearly one target per question by construction) and the merge threshold is
conservative. Both are fixable. But **building memory state on the target layer before
convergence improves would produce a memory model that is per-question wearing a concept's
name** — precisely the thing item 07 exists to avoid.

---

## Incidental findings

- **Two Paediatrics courses.** `Paediatrics` (541 questions, 64 topics) and `Pediatrics`
  (221 questions, 23 topics) are separate course rows. Same subject, different spelling. This
  splits the same discipline across two identities in every per-course view.
- **Only 7 human resolutions** across 146 AMBIGUOUS rows. The human-in-the-loop path exists and
  is barely used; the ambiguous queue is effectively unworked.
- **26 targets have no questions attached** (648 total, 622 with ≥1 question).

---

## What I recommend, and what I am not doing

I am not proposing an implementation. But the audit points somewhere specific:

1. **Store `qh` on the question.** One field. It stops every future edit from silently orphaning
   a mapping, and it is the cheapest durable fix in this report.
2. **Then backfill-and-stamp**, which would move stamping from 28% toward the 85% already
   resolved — without touching the resolver at all.
3. **Only then** revisit the merge threshold, using option C.1 above (the 996 recorded decisions)
   as the evidence base for whether the NEW:MATCH ratio is right.
4. **Do not gate the ledger on any of this.** Per your correction, events keep recording with
   `target_id = null` and get resolved later.

Nothing above has been started. Awaiting your decision on C, and on whether identity stability
(step 1) becomes item 01.5.
