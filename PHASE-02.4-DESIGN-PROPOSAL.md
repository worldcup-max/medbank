# Phase 02.4 — Durable Memory State · DESIGN PROPOSAL

**Status: DESIGN ONLY — REVISION 5. No code, no DDL, no migration, no flags.**

Revised after the 02.4 architecture gate. Six amendments applied:

1. Same-prefix automatic compatibility **removed** — replaced by explicit
   directional compatibility declarations (§4).
2. `pickCard` as exhausted-CAS fallback **removed** (§3.1).
3. `version_mixed` defined precisely around *distinct contributing versions*,
   including seed behaviour (§0.1).
4. `transitions` renamed `transition_count`; reframed as cardinality, not a
   checksum (§1).
5. Bounded replay formalised as a **support policy** with three event states,
   and its consequence for correction stated (§5).
6. Everything else unchanged.

**Revision 3** adds the one item the final gate held on:

7. **Event-projection idempotency** (§3A) — an applied-event registry as the
   exactly-once boundary, atomic with the state write, plus canonical
   occurrence ordering and the seven required scenarios.

**Revision 4** closes the final two ordering gaps:

8. **Fast path = immediate next unapplied canonical event**, not "newer than
   the watermark". A gap in applied history now forces replay (§3A.3).
9. **Per-identity transactional serialisation** of the fast-path/replay
   decision, via advisory lock (§3A.3.1) — with the client-computed replay
   guarded by `row_version` so no second scheduler implementation is needed
   (§3A.3.2).

**Revision 5** closes the last hole in the fail-closed rule:

10. **Seed-consumption contract** (§4.1a, §8) — an unknown-provenance seed may
    not be consumed merely because `scheduler_version IS NULL`. Seeds carry a
    `seed_format`, consumed only via an explicit `seed:<format>` declaration;
    `unknown` shapes are quarantined at seed time.
11. **Replay verification is set equality**, not cardinality (§3A.3.2).
12. **64-bit advisory lock key**, with the concurrency claim stated precisely
    rather than overclaimed (§3A.3.1).

Approved at the gate and carried forward unchanged: defer q-bank (§2),
CAS recompute-from-fresh-state (§3), sticky `version_mixed` (§0.1),
per-level-profile authority (§7).

---

## 0. The distinction this design turns on

> Events have **algorithm provenance**.
> Current state has **accumulated algorithmic state**.
> Those are not the same thing.

Sharpened, because the difference is not merely one of scope:

```
learning_events.scheduler_version
    a FACT about one transition. Immutable. Already correct (02.3).

memory_state
    the RESULT of a SEQUENCE of transitions, each under some algorithm.
    It is not "produced by" one algorithm at all.
```

A state value is therefore never simply "a v2 value". `box = 5` may be the
residue of three v1 transitions and two v2 transitions. Any schema that stores
a single version and calls it *the* version of the state is asserting something
false.

### The consequence for what we store

Both current schedulers are **pure functions of `(state, outcome, today)`**:

```js
rateSRS:       (box, ok)             -> box', due', lapses'
qbSchedApply:  (e, ok, conf, today)  -> e'
```

So advancing does **not** require the version. The version is required for
three other things, and only these:

| Need | Question it answers |
|---|---|
| **Interpretation** | Does `box=3` mean under v2 what it meant under v1? |
| **Correction** | If v2 was wrong, which rows are contaminated? |
| **Replay** | How did we arrive here? |

**Replay is already answered by the ledger.** Storing the contributing version
set in `memory_state` would duplicate `learning_events` — precisely the
"compressed substitute for event history" the governing principle forbids.

So the design stores the minimum needed for **interpretation** and
**correction**, and derives everything else from the ledger.

### Proposal: a sticky mixed-version bit, not a version set

### §0.1 `version_mixed` — precise definition

```
scheduler_version   the version that computed the CURRENT values
                    -> "what semantics do these numbers carry"

version_mixed       STICKY boolean, defined as:
                    TRUE iff TWO OR MORE DISTINCT scheduler versions have
                    contributed transitions to this row.
                    Once true, never cleared.

(the ledger)        -> answers everything else, on demand
```

The definition is stated over *distinct contributing versions*, not over
"incoming differs from stored", because the latter is ambiguous at the seed
boundary. Required behaviour:

| Situation | `scheduler_version` | `version_mixed` |
|---|---|---|
| Seeded row, no events yet | `NULL` | `false` |
| First event, under v1 | `v1` | **`false`** — one version has contributed |
| Next event, under v1 | `v1` | `false` |
| Next event, under v2 | `v2` | **`true`** |
| Next event, back under v1 | `v1` | **`true`** (sticky) |

The transition from a `NULL` seed to its first version is **not** a version
crossing and must not set the bit.

The write rule that satisfies this: set `version_mixed = true` when
`scheduler_version IS NOT NULL AND incoming <> scheduler_version`, or when it
is already true. Because the bit is sticky, this is equivalent to the
distinct-versions definition — if two distinct versions contribute there must
be a consecutive pair where they differ.

Why sticky rather than first-vs-last: a `first_version != last_version`
comparison **fails case 2**. In `v1 -> v2 -> v1`, first and last are both v1
while v2 genuinely contributed. The sticky bit is set at the v2 write and
survives the reversion. It is the same sticky-authority pattern already used
by `question_targets.resolution`.

One bit, cheap, and it does not pretend provenance is simple — it *flags*
complexity and points at the authoritative record.

### §0.2 Four separate concepts

The gate's central correction: identity, provenance, compatibility and current
state are four dimensions, not one.

| Question | Source |
|---|---|
| What version wrote this transition? | `learning_events.scheduler_version` |
| What version computed current state? | `memory_state.scheduler_version` |
| Has this row crossed versions? | `memory_state.version_mixed` |
| What versions contributed historically? | `learning_events` |
| **May version A consume state produced by B?** | **compatibility policy (§4)** |
| Can we replay the history? | ledger + retained implementations (§5) |

Note the fifth row: **compatibility is its own concept with its own store.**
It is not derivable from the version string.

---

## 1. Proposed `memory_state` schema

```
memory_state
──────────────────────────────────────────────────────────────────
  account_id          uuid    not null   default auth.uid()
  level_profile_id    uuid    not null
  surface             text    not null   -- 'flashcard' | 'qbank'
  object_key          text    not null   -- see §2
  state               jsonb   not null   -- scheduler-shaped payload

  scheduler_version   text                -- last writer; NULL for seeds
  version_mixed       boolean not null default false   -- sticky
  origin              text    not null    -- 'seed' | 'event'
  seed_format         text                -- shape of the legacy state, when origin='seed'
                                          -- 'legacy-box-v0' | 'legacy-anki-v0' | 'unknown'
                                          -- consumed only via an explicit declaration (§4.1a)

  row_version         integer not null default 1       -- CAS token
  transition_count    integer not null default 0       -- cardinality, NOT a checksum

  last_occurred_at    timestamptz          -- newest applied event (canonical order, §3A.3)
  last_event_id       uuid                 -- its client_event_id; deterministic tie-break
  updated_at          timestamptz not null default now()

  primary key (level_profile_id, surface, object_key)
```

Deliberate choices:

- **`row_version` is named separately from `scheduler_version`.** One is a
  concurrency token, the other is algorithm identity. Conflating them in a
  single `version` column is how this gets confusing six months from now.
- **`state` stays `jsonb`.** 02.2 found `DATA.cards` already holds two
  incompatible shapes (`{box,due,seen,lapses,ms}` and
  `{due,ivl,ease,reps,isNew}`). Typed columns would force a normalisation
  decision we have not earned yet. `jsonb` per row is still row-level
  granularity — the property that fixes the lost update.
- **`transition_count`** is a *cardinality check*, deliberately not called a
  checksum. It can say "I replayed 17 events". It **cannot** say "I replayed
  the correct 17 events, in the correct order, through the correct intermediate
  states". Keeping the count is worthwhile — a mismatch is a real signal — but
  the architecture must not be written as though it guarantees replay
  integrity. A true integrity digest would be a separate field and a separate
  design decision, not yet taken.
- **No `state_history`, no version array.** That is the ledger's job.

RLS: insert/select/**update** own rows. Unlike `learning_events`, this table
**must** be mutable — it is current state, not history. That difference is
the architecture, not an inconsistency.

---

## 2. Identity / key strategy — and the hardest problem in this phase

**Flashcards.** `object_key = cid` (`topicId|deck|hash(q)`).
02.1 established there is no re-keying pressure: cards are append-only,
client edits use an overlay, and 321/323 keys resolve. `cards.id` stays
available for a later phase. **Do not migrate the key in 02.4** — one
architectural change at a time.

**Q-bank — this needs your attention.**
The key is `qbRetentionKey(qh)`:

```js
qbRetentionKey(qh){ var t=qbTargetOf(qh); return t ? ('t:'+t) : ('q:'+qh); }
```

**This key is not stable.** When a target becomes known for a question, its
key changes from `q:<qh>` to `t:<target>`. Client-side, `qbMigrateSched`
already folds these — it merges the legacy record into the target-keyed one.

In a row-per-object table, that fold is a **row merge**: two rows must become
one, under CAS, without losing either's history. And since targets are stamped
server-side asynchronously, the merge can happen on one device while another
still holds the old key.

Options, none free:

- **(a) Key by `q:<qh>` permanently**, treat target-level retention as a
  read-time aggregation. Keeps keys immutable; loses the "one schedule per
  concept" property that A6 was built for.
- **(b) Allow the merge**, with an explicit `merged_into` tombstone row so a
  device holding the old key is redirected rather than resurrecting it.
- **(c) Defer q-bank entirely** — migrate flashcards only in 02.4, leave the
  q-bank schedule in `profile_state` until target identity is more settled.

**My recommendation is (c).** Flashcards have stable keys and 321 clean
records; q-bank has an unstable key *and* only ~30% target coverage. Doing
both at once means debugging a concurrency migration and an identity merge
simultaneously. (c) also keeps the phase small enough to roll back.

This is the single biggest scope decision in 02.4 and I would like it settled
before anything else.

---

## 3. CAS semantics — and a constraint that changes the client

```
version = 17
A reads 17                      B reads 17
A: update WHERE row_version=17  -> 18  OK
B: update WHERE row_version=17  -> 0 rows  REJECTED
B re-reads 18, resolves, retries
```

**The non-obvious part is what B retries with.**

If B retries by writing *the state it already computed*, the result is wrong —
B computed `box 3 -> 4` against the stale row, and A has since moved it to 4.
Re-applying B's computed value silently discards A's transition; re-applying
B's *delta* double-advances.

**Therefore: a memory_state write must be expressed as `(expected_row_version,
event)` and the transition recomputed against the fresh state — never as a
precomputed `new_state`.**

Two ways to honour that:

- **(i) Client recomputes on conflict.** On rejection, re-read, re-run
  `rateSRS` against the fresh state, retry. Small change; keeps the scheduler
  on the client where it is today.
- **(ii) Server computes the transition** (RPC takes the event, applies the
  algorithm, writes under CAS). Stronger — the algorithm has one home and the
  client cannot desync — but it moves scheduler logic server-side, which is a
  much larger change and would need its own phase.

**Recommend (i) for 02.4**, with (ii) noted as the eventual destination.

### §3.1 What happens when the retry budget is exhausted

The earlier draft proposed falling back to `pickCard`. **That is withdrawn.**

The objection is correct and is a category error, not a tuning question:
`pickCard` was built to reconcile two competing *blob snapshots* at load time,
where neither side has a claim to being "next". CAS is protecting a **sequence
of learner transitions**, where order is the meaning. Consider:

```
A reviews card -> pass
B reviews same card -> fail
one loses CAS, retries exhaust
```

`pickCard` would resolve this by "greater `seen`, ties to higher `box`" — a
heuristic that answers *which snapshot looks more advanced*, not *what the
learner actually did*. Silently resolving a genuine learning conflict with a
presentation-layer heuristic is exactly the kind of quiet wrongness this whole
phase exists to remove.

**The correct answer needs no heuristic, because the event is not lost.**

An unapplied transition is not missing data — it is a **pending projection**.
The event itself is durable in `learning_events` the moment it is emitted. So:

```
retry budget exhausted
    -> DO NOT resolve
    -> mark the row needs_reconciliation
    -> reconcile from the ledger (replay the row's events in order)
```

State is recomputed from the authoritative history rather than guessed.

### §3.2 A dependency this exposes — worth surfacing explicitly

Reconciliation-from-ledger only works **if the ledger is actually receiving
events**. `LEARNING_EVENTS` is currently false.

That produces an ordering constraint that was not visible before:

| Phase | Exhausted CAS is safe because... |
|---|---|
| **Shadow** (`memory_state` written, not read) | `profile_state` is still authoritative, so a dropped shadow write costs nothing. Count it and move on. |
| **After the authoritative switch** | There is no other authority. Reconciliation from the ledger is the *only* correct recovery. |

**Therefore: `LEARNING_EVENTS` must be live before the authoritative switch —
not after it.** Enabling the ledger is a prerequisite of 02.4's final step, not
an independent decision that can follow it.

This does not change the hold on enabling the flag today. It means the
enablement gate must be sequenced *inside* the 02.4 migration plan rather than
treated as unrelated work.

Worth stating plainly: **two devices rating two different cards stop
conflicting entirely.** Today they conflict merely by sharing one blob. Most
of the win is structural, before CAS does any work.

---

## 3A. Event-projection idempotency

The gate found this missing, and it is load-bearing: removing `pickCard` made
the ledger the sole recovery path, so the projection now needs a formal
exactly-once boundary. Durability is not idempotency.

**The contract being built:**

> Every durable learner event is projected into current memory **exactly
> once**, or is **explicitly pending** and reconcilable.

Note what is explicitly *not* the answer. `row_version` is a concurrency token.
`transition_count` is cardinality (§1) — at `17`, an incoming event may be the
unapplied 18th, the already-applied 18th, a late event belonging between
earlier ones, or a duplicate of #17. `learning_events.client_event_id`
uniqueness dedupes the **ledger**, and says nothing about the **projection**.
Three different questions.

### §3A.1 Decision: an applied-event registry (A), with replay (C) as the
### reconciliation path

```
memory_applied_events
──────────────────────────────────────────────────────────
  account_id        uuid  not null default auth.uid()
  client_event_id   uuid  not null      -- the same id the ledger dedupes on
  level_profile_id  uuid  not null
  surface           text  not null
  object_key        text  not null
  applied_at        timestamptz not null default now()
  primary key (account_id, client_event_id)
```

The primary key **is** the idempotency boundary — deliberately the same shape
as `learning_events_dedupe_idx (account_id, client_event_id)`, so the ledger
and the projection dedupe on the same identity.

**The single non-negotiable mechanic:** the registry insert and the state
update must occur in **one transaction**. PostgREST cannot express that across
two calls, so the projection is a single `rpc()`:

```
project_event(object_key, client_event_id, expected_row_version,
              new_state, scheduler_version)  -> applied | already_applied | conflict
```

in one transaction:

```
1. INSERT INTO memory_applied_events ...        -- unique violation -> already_applied, NO state change
2. UPDATE memory_state SET ... WHERE row_version = expected_row_version
                                                -- 0 rows -> conflict, ROLLBACK the insert too
3. both succeed                                 -> applied, return new row_version
```

Atomicity is what makes case 2 below correct: a failed CAS must leave **no**
registry row, or the event would be permanently marked applied while the state
never moved.

This does not move the *scheduler* server-side — the client still recomputes
the transition against freshly-read state, as approved. Only the atomic commit
of (marker + state) is server-side, because it cannot be expressed otherwise.

### §3A.2 Why not B or C alone

**B (embedded identity)** catches an immediate duplicate but cannot answer
"was this older event ever applied?" — and out-of-order arrival is normal here,
because an offline device can flush a queue days later.

**C (deterministic full projection)** is genuinely sound — replaying the same
event set always yields the same state, so it is idempotent by construction —
but on its own it makes every rating an O(n) ledger read, and it can only
*infer* what has been applied. It cannot distinguish "applied" from "pending".

The registry buys a property neither alternative has: **pending work becomes
measurable.**

Stated precisely, because the shorthand is dangerous:

> For **scheduler-relevant** events belonging to **a given memory-state
> identity** — `(account_id, level_profile_id, surface, object_key)` — the
> ledger events absent from `memory_applied_events` are the pending
> projections.

Both qualifiers are load-bearing. `learning_events` also holds `note_read` and
future intervention events, which have no memory projection at all; and the
comparison is meaningless unless scoped to one identity. A naive global
`count(ledger) - count(registry)` would be permanently non-zero and would look
like a fault forever. Writing the shorthand without its scope is how someone
six months from now builds a broken health check on top of it.

C is retained as the reconciliation mechanism, not the primary path.

### §3A.3 Ordering — canonical position, not a watermark

`rateSRS` is **order-sensitive**: pass-then-fail and fail-then-pass produce
different state. But events arrive out of order whenever a device syncs late.

Applying events in *arrival* order would mean two devices that receive the same
events in different orders converge to **different** state. That is not
acceptable for a system of record.

**Canonical order is occurrence order:** `(occurred_at, client_event_id)`,
the uuid breaking ties deterministically rather than arbitrarily-but-unstably.

#### The watermark rule was wrong

Revision 3 said "incoming event is the NEWEST for this row -> fast path".
**That is withdrawn.** A watermark cannot see a *gap*:

```
E1  10:00   projected        last_occurred_at = 10:00
E2  11:00   PENDING in the ledger, never projected
E3  12:00   arrives

watermark test:  12:00 > 10:00   -> fast path   WRONG
canonical truth: E1 -> E2 -> E3, and E2 is missing
```

The fast path would compute `E1 -> E3`, and the row would hold a state that
never occurred. Even if a later replay repairs it, the row is authoritative in
the meantime — which breaks the invariant outright, since E2 was neither
applied nor *explicitly* pending; it was simply skipped.

The deeper error: the fast path is meant to be **incremental advancement of the
canonical sequence**, not "apply anything newer than the last thing I applied".

#### The corrected rule

> **Fast path requires that the incoming event is the immediate next unapplied
> event in canonical order for that memory identity.**

Expressed as the absence of an earlier gap:

```
no scheduler-relevant event exists for this memory identity with
    canonical_order < incoming.canonical_order
    AND not present in memory_applied_events

    -> FAST PATH      apply one transition

otherwise (any earlier event still pending)
    -> REPLAY PATH    recompute from the ledger in canonical order
```

`last_occurred_at` / `last_event_id` remain useful as a cheap pre-filter and
for diagnostics, but they are **not** the authorisation. The anti-join against
the registry is. It rides the existing
`learning_events_object_idx (account_id, object_id, occurred_at desc)`.

Note this also makes the late-event case fall out for free: a late event has
earlier events unapplied *after* it only in the trivial sense — what actually
routes it to replay is that applying it would place it before the row's
existing history, which the same canonical-position test detects.

#### §3A.3.1 Per-row serialisation

The gap check and the write must not interleave, or a concurrent projection can
open a gap between the check and the commit. So the decision itself must be made
under a lock:

```
BEGIN
  lock this memory identity          -- see below
  re-read the authoritative row
  determine the event's canonical position   (gap check, above)
  if immediate-next : apply one transition
  else              : replay canonical history
  update memory_state
  insert memory_applied_events
COMMIT
```

**Locking mechanism.** `SELECT ... FOR UPDATE` covers the row once it exists,
but the first event for a card has no row to lock. So the RPC takes an
advisory transaction lock on the identity first — it serialises whether or not
the row exists yet, and releases automatically at commit.

**Use the full 64-bit key space.** `hashtext()` returns 32 bits, where
collisions are plausible at this scale. Derive a `bigint` instead:

```sql
pg_advisory_xact_lock(
  ('x' || substr(md5(level_profile_id::text || '|' || surface || '|' || object_key), 1, 16))::bit(64)::bigint
)
```

**Precisely stated:** distinct memory identities do not *intentionally* share a
lock, and with a 64-bit key the chance of an accidental collision is
negligible — but not zero. Saying "different cards never contend" would be
overclaiming. A collision costs only unrelated waiting; it is a concurrency
property, never a correctness one, because every write is independently
guarded by `row_version` and the registry's unique key.

The point stands regardless: two devices rating two different cards do not
contend, which is the entire reason for leaving the blob.

#### §3A.3.2 A tension this exposes, and how it resolves

Server-side replay would require a **server-side scheduler implementation** —
and the approved model (decision 2) keeps the scheduler on the client. Two
implementations of `rateSRS` that must agree forever is exactly the drift risk
02.3 spent a whole phase guarding against. I do not want to introduce it here.

Nor is holding the transaction open across a network round-trip acceptable.

**Resolution: the replay path is client-computed, guarded by `row_version`.**

```
1. RPC returns  replay_required  (+ the row's current row_version)
2. client reads that identity's scheduler-relevant events from the ledger,
   replays them from seed in canonical order  -- one scheduler, client-side
3. client calls apply_replay(object_key, expected_row_version,
                             new_state, applied_event_ids[], ...)
4. RPC, in ONE transaction, under the advisory lock:
     - verify row_version still matches        -> else conflict
     - verify SET EQUALITY (see below), not cardinality
     - write state, transition_count, scheduler_version, version_mixed
     - insert every missing registry row
   COMMIT
```

`row_version` is a sufficient guard because **every** projection bumps it. If
anything at all projected between the client's read and its replay submission,
the version differs and the replay is rejected — the client re-reads and
retries. No lock is held across the network, one scheduler implementation
survives, and the decision-plus-write still commits atomically under the lock.

**Set equality, explicitly — not cardinality.** `transition_count` was already
rejected as an integrity mechanism (§1); the same discipline applies here. The
RPC compares the submitted `applied_event_ids[]` against the authoritative
scheduler-relevant ledger set for that identity as **sets**:

```
[E1,E2,E3]  vs  [E1,E2,E4]     -- same count, DIFFERENT HISTORY
                               -- a cardinality check passes this. It must not.
```

Concretely: order both by `(occurred_at, client_event_id)` and require the
arrays to be equal, so the comparison covers membership *and* the canonical
sequence the replay actually assumed. Any difference → reject, re-read, retry.
This is what makes the registry an exact projection **receipt** rather than a
count of things that happened.

### §3A.4 The seven scenarios

**1 — CAS succeeds, response lost, client retries.**
Registry insert hits the unique violation → `already_applied`, no state change,
current `row_version` returned. **No double advance.** This is the case the
design previously had no answer for.

**2 — CAS fails, projection retries.**
The whole transaction rolled back, so *no* registry row exists. The retry
re-reads, recomputes against fresh state, and applies normally. Distinguishing
this from case 1 is exactly what atomicity provides.

**3 — Duplicate client emission.**
Same `client_event_id` throughout. The ledger rejects it (`23505`, already
handled as already-durable in `learning-events.js`); the registry rejects the
projection. Deduped at both layers on the same identity.

**4 — Two devices, same row, concurrently.**
Distinct `client_event_id`s, so both are legitimate and **both must land**.
The advisory lock serialises them. The first applies; the second finds the
first already applied and now *earlier* than itself, so it is still the
immediate-next event and takes the fast path against the updated state. Both
applied exactly once, in canonical order. This is precisely the case
`pickCard` would have resolved by discarding one — the reason its removal was
correct.

**5 — Out-of-order arrival, and the gap case.**
Two shapes, both routed by the same canonical-position test:

- *Late event* — `occurred_at` precedes applied history. Replay path. The event
  is **inserted into** history, not appended to it.
- *Gap* — the incoming event is newer than everything applied, but an earlier
  event is still unapplied (the E1/E2/E3 case above). Replay path. The fast
  path must **not** be taken merely because the timestamp is highest.

**6 — Ledger reconciliation (exhausted CAS, §3.1).**
Replay from seed in canonical order; rewrite `state`, `transition_count`,
`scheduler_version`, `version_mixed`; set the registry to exactly that event
set. Idempotent — running it twice yields the same row.

**7 — Correction / replay (§6).**
The same replay machinery, bounded by the support policy (§5.2). Outside the
window the outcome is "identified, not repairable" — the registry still says
precisely which events contributed, even when they can no longer be re-executed.

### §3A.5 Cost, honestly

The registry has the same cardinality as the ledger. Rows are small (two uuids
plus keys), but this is real growth and should be stated rather than discovered.

It can be pruned for rows that are fully reconciled and whose events are past
any possible retry — but the offline queue has no bounded lifetime (`QMAX`
2000, no expiry), so a naive time-based prune could resurrect a duplicate.
**Pruning is therefore deferred, not designed here.** Unbounded growth is the
safe default until the retry horizon is bounded.

## 4. Scheduler-version compatibility — case 1 and case 2

### §4.0 The withdrawn rule, and why it was wrong

The earlier draft proposed:

```
same prefix, different fingerprint  -> state-compatible BY DEFAULT
different prefix                    -> requires explicit declaration
```

**This is withdrawn.** The objection is correct, and it is worth recording the
reasoning so it is not re-proposed later.

The argument for the old rule was that `box` = "number of consecutive passes"
survives a ladder edit. But **the state is not only `box`.** It is:

```
{ box, due, seen, lapses, ms }
```

`due` was computed as `today + LADDER[box]`. A materialised `due` therefore
carries the *spacing policy of the version that wrote it*. After
`1.3.7.7.7.14.14 -> 1.3.7.10.7.14.14`, a row's stored `due` is a v1.0 interval
sitting in a v1.1 world — the number is intact but its meaning has drifted.
Worse, a *shortened* ladder can leave `box` indexing past the end.

The deeper error is conceptual:

> **Algorithm identity and state compatibility are different dimensions.**
> `scheduler_version` says what produced an event. It has no authority to say
> whether some other version may consume the resulting state.

Deriving one from the other collapses two of the four concepts in §0.2.

### §4.1 Explicit directional compatibility

Compatibility becomes its own declared policy:

```
scheduler_version          -> immutable provenance (02.3, settled)
compatibility declaration  -> may X consume state produced by Y?
scheduler implementation   -> can we still execute X? (§5)
```

Shape:

```
scheduler_compatibility
──────────────────────────────────────────────────────────
  consumer_version  text     -- the version about to advance the row
  producer_version  text     -- the version that wrote the current state
  compatible        boolean
  note              text     -- WHY, in words, for the next reader
  declared_by       text
  declared_at       timestamptz
  primary key (consumer_version, producer_version)
```

Three rules make this safe:

1. **Directional.** `(v1.1 consumes v1)` and `(v1 consumes v1.1)` are separate
   rows and may legitimately differ. `v1 -> v2` being safe does **not** imply
   `v2 -> v1` is safe. This is what actually protects case 2.
2. **Fail closed.** An absent row means **not compatible**. Silence is never
   permission. A new scheduler version ships unable to touch any prior state
   until someone declares, in writing, that it may.
3. **Identity is intrinsic.** `(v, v)` is compatible without a row. Nothing
   else is.

### §4.1a Seed consumption — the counterpart to fail-closed

§4.1 fails closed on *declared* versions. But a seeded row has
`scheduler_version = NULL`, so the lookup `(consumer=v1, producer=NULL)` cannot
be posed at all — and the first transition onto legacy state would take a free
compatibility pass. That is the one place the fail-closed rule leaked.

**A seed is not version-neutral.** It is legacy state whose producer is
*unknown*, which is strictly worse than a known foreign version. And 02.2
established there is more than one legacy shape actually present:

```
{ box, due, seen, lapses, ms }        rateSRS
{ due, ivl, ease, reps, isNew }       viz-quiz seed (app.html:1928)
```

The second has no `box` at all. A scheduler consuming it is not making a
version-compatibility judgement — it is guessing at a different data model.

#### The rule

> **A scheduler version may never consume an unknown-provenance seed merely
> because `scheduler_version IS NULL`. Consumption requires an explicit
> declaration naming both the consumer and the seed format.**

Mechanism: seeds carry a **`seed_format`** identifying the shape, and the
existing compatibility relation is reused with a namespaced producer:

```
memory_state.seed_format     e.g. 'legacy-box-v0'
                                  'legacy-anki-v0'
                                  'unknown'

scheduler_compatibility
  consumer_version = 'srs-box-v1@1.3.7.7.7.14.14'
  producer_version = 'seed:legacy-box-v0'
  compatible       = true
  note             = 'shapes match; box/due/lapses carry the same meaning'
```

**One relation, one lookup path, one fail-closed rule.** A separate
`scheduler_seed_compatibility` table would work equally well semantically, but
two mechanisms means someone implements the fail-closed check in one and
forgets it in the other. Namespacing the producer keeps a single code path
that cannot be half-applied.

#### `seed_format = 'unknown'`

A legacy row whose shape matches no declared format is seeded as `'unknown'`,
and **no consumer may ever be declared compatible with it**. Such rows are
quarantined at seed time rather than at first event — the learner discovers
the problem before their next review is mis-scheduled, not during it.

This makes shape classification a **concrete migration deliverable**: the
seeding step must report how many rows fall into each format and how many are
unclassifiable, *before* any switch. A non-zero `unknown` count is a decision
point for you, not something to route around.

#### Replay begins at the seed boundary

This is where it matters most. For a row whose history is:

```
seed -> E1(v1) -> E2(v2) -> E3(v1)
```

replay must clear **four** compatibility gates, not three:

```
(consumer=v1, producer=seed:<format>)   <- previously implicit; now explicit
(consumer=v2, producer=v1)
(consumer=v1, producer=v2)
```

Without §4.1a the first arrow was the one unchecked step in an otherwise
fail-closed chain — and it is the step operating on the least-known data.
Consistent with the principle applied everywhere else: *when the system cannot
establish that an operation is meaningful, it declines rather than approximates.*

Note `version_mixed` is unaffected: a seed is not a scheduler version, so
seed-to-first-version remains **not** a crossing (§0.1).

### §4.2 Case 1 — v1 -> v2

Event under v2 arrives at a row whose `scheduler_version` is v1.

```
lookup (consumer=v2, producer=v1)
  compatible=true   -> advance; scheduler_version=v2; version_mixed=true
  compatible=false  -> QUARANTINE the row. Do not advance.
  no row            -> QUARANTINE the row. Do not advance.
```

Quarantine, not silent advance, and not silent reset. This is the same
instinct as 02.3 refusing an unversioned event: **when the system cannot
establish that an operation is meaningful, it must decline rather than
approximate.** A quarantined row is visible, countable, and recoverable by
declaration or by reconciliation from the ledger.

### §4.3 Case 2 — v1 -> v2 -> v1 (rollback)

Reversion is *not* safe merely because v1 is older. It requires
`(consumer=v1, producer=v2)` to be declared true — a genuinely different
question from the forward direction, and often false: v2 may write state v1
cannot interpret at all.

Two consequences to state plainly:

- **Rolling back code does not roll back state.** A `due` written under v2's
  ladder keeps its value when v1 resumes. `version_mixed` records that this
  row crossed a boundary; a true rebuild requires replay (§5).
- **A code rollback can therefore quarantine rows**, if nobody declared the
  reverse direction. That is the system behaving correctly, but it is an
  operational surprise unless the reverse declaration is written *at the same
  time as the forward one*. Recommended practice: declare both directions when
  introducing a version, even if the reverse is `false`.

## 5. Replay — case 3, and the support policy

Replay applies each event **under its own version's algorithm**. The system
must therefore be able to *execute* an old algorithm, not merely name it.

**A version string is not a version registry.** If v1's implementation is
deleted, v1 events become unreplayable in practice even though 02.3 recorded
their provenance perfectly.

### §5.1 Three states of a historical event

Approved framing — an event can be perfectly identified yet non-replayable,
and saying so is the honest position (the same principle as 02.3's NULL rows):

| State | Meaning |
|---|---|
| **Replayable** | Provenance recorded **and** the referenced scheduler implementation is retained. Full reconstruction possible. |
| **Audit-only** | Provenance recorded, implementation outside the support window. We know exactly what happened and cannot recompute from it. |
| **Unreconstructable seed** | No event history exists at all (§8). Advanceable, never replayable. |

### §5.2 The support policy — contractual, not incidental

This must be a **stated policy**, not "old code gets deleted eventually":

> **A retired scheduler version remains replayable for N further versions, or
> M months after retirement, whichever is longer. After that it becomes
> audit-only and its implementation may be removed.**

`N` and `M` are deliberately left open — they are a product decision, not an
architectural one. The *concept* is what must be contractual, so that:

- removing a scheduler implementation is a **deliberate, policy-governed act**
  with a known consequence, never incidental cleanup;
- the replay window is a published property of the system rather than an
  emergent property of whatever happens to still be in the repo.

### §5.3 Correction must respect the boundary

This is the consequence that must not arrive as a surprise:

> **If a faulty scheduler version has fallen outside the replay window, we can
> still identify every contaminated row, but we cannot promise automatic
> reconstruction.**

Contamination detection depends only on stored provenance (§6) and therefore
always works. *Repair* depends on executable implementations and therefore does
not. The two capabilities have different lifetimes, and the architecture should
say so rather than implying that identification and remedy always come together.

Where reconstruction is impossible, the honest remedies are: leave the row and
mark it, or reset it to a seed with `origin='seed'` and `scheduler_version=NULL`
— never fabricate a plausible history.

`transition_count` gives a replay a cardinality check (not an integrity
guarantee — §1), and `origin='seed'` marks rows that can never be fully
replayed.

## 6. Correction — case 6

A scheduler version discovered to be wrong. Events are immutable and stay.
Affected rows are identifiable:

```sql
scheduler_version = '<bad>'                     -- last writer was bad
OR (version_mixed AND EXISTS (                  -- bad version contributed
      select 1 from learning_events e
       where e.object_id = ... and e.scheduler_version = '<bad>'))
```

Remedy: recompute those rows from the ledger and write a **new** state.
History is never rewritten.

**Detection and repair have different lifetimes.** The query above works
forever, because it reads only stored provenance. Repair works only while the
faulty version is still within the replay support window (§5.2). Outside it,
the outcome is "identified, not repairable" — which must be reported as such,
not silently approximated.

Note the sticky bit earns its place here: without it, finding contaminated
rows means scanning the whole ledger for every row.

---

## 7. Migration — case 4, and the rule I would not bend

Your sequence, with one constraint added:

```
schema -> shadow population -> dual-read comparison
      -> CAS verification -> controlled migration -> authoritative switch
```

**INVARIANT: authority is a property of the level profile, never of an
individual memory object.**

A learner whose flashcards are half-authoritative in `memory_state` and
half-authoritative in `profile_state` is exactly where corruption lives:
`mergeState` at load would union a blob that is no longer the whole truth,
and the two stores would diverge invisibly. Partial authority *within* one
learner is not an acceptable intermediate state — partial rollout *across*
learners is.

Never:

```
card A -> memory_state
card B -> profile_state
card C -> memory_state
```

That is precisely how two systems of record quietly emerge. Partial rollout
*across* learners is fine; partial authority *within* one learner is forbidden.

During shadow: `memory_state` is written but **never read**. `profile_state`
stays authoritative and keeps receiving writes throughout, so rollback is a
flag flip with no data loss. Divergence between the two is measured and
reported before any switch.

### §7.1 Sequencing — three things must hold before authority moves

The migration is not merely `schema -> shadow -> dual-read -> switch`. Three
capabilities must be established and verified *before* `memory_state` can
become authoritative:

```
     ledger live  +  projection idempotency  +  CAS verified
                          |
                          v
                 authoritative switch
```

- **Ledger live** (§3.2) — after the switch it is the only recovery path for
  an exhausted CAS.
- **Projection idempotency** (§3A) — without it, a lost response silently
  double-advances the scheduler.
- **CAS verified** — conflict detection demonstrated, not assumed.

Because once authority moves, the operative invariant is:

> **Every durable learner event is projected into current memory exactly once,
> or is explicitly pending and reconcilable.**

Each of the three is necessary for that sentence to be true; none is
sufficient alone. Enabling `LEARNING_EVENTS` is therefore a *step inside* this
migration, gated on its own evidence, not separate work that could follow.

---

## 8. Unreconstructable legacy state — case 7's tail

The 321 flashcard states and the entire q-bank schedule predate the ledger.
They are seeded, not replayed:

```
origin            = 'seed'
scheduler_version = NULL            -- honestly unknown; never fabricated
seed_format       = 'legacy-box-v0' | 'legacy-anki-v0' | 'unknown'
version_mixed     = false           -- no version has contributed yet (§0.1)
transition_count  = 0
```

Per §0.1, the first event to touch a seeded row sets `scheduler_version` and
leaves `version_mixed` **false** — seed-to-first-version is not a crossing.

**But that first touch is not automatic.** Per §4.1a it requires an explicit
`(consumer, producer='seed:<seed_format>')` declaration. `scheduler_version`
stays NULL because the producer genuinely is unknown; `seed_format` is what
carries the *shape* contract, which is knowable by inspection even when the
producing algorithm is not. Those are different facts and the schema keeps
them apart rather than inventing a version to make the lookup convenient.

A row seeded as `'unknown'` can never be consumed — it is quarantined from the
moment of seeding, before it can mis-schedule anything.

### §8.1 Seeding is a classification step, not a copy

The migration must classify every legacy row's shape and **report the
distribution before any switch**:

```
legacy-box-v0   n = ?
legacy-anki-v0  n = ?
unknown         n = ?     <- a decision point, not something to route around
```

02.2 already established both shapes are live in `DATA.cards`, so this is not a
hypothetical branch. The `unknown` count is evidence you should see, and it is
the kind of number that would otherwise only surface as a scheduling bug weeks
later.

Same honesty principle as 02.3's NULL rows: **a seeded row is advanceable but
never fully replayable, and must say so** rather than being backfilled with an
invented version. `origin` makes that permanent and queryable.

The two known orphans stay untouched and are simply not seeded.

---

## 9. Rollback

**Before the switch.**

```
profile_state  <- authority, still receiving writes
memory_state   <- shadow, written but never read
```

Rollback = stop reading `memory_state`. No data movement, no reconstruction.

**After the switch — the bridge period.**

```
memory_state   <- authority
profile_state  <- continues receiving a PROJECTION of memory_state
```

The projection is what makes rollback cheap after the switch. Without it,
reverting would mean reconstructing the blob after the fact from a store whose
shape deliberately differs from it — an operation performed for the first time
under incident conditions, which is exactly when it should not be attempted.

The bridge period must have a defined end, declared in advance. Only once it
closes does `profile_state` shed learner-memory and become what it should be:
profile and preferences.

---

## GATE RECORD — decisions taken

| Decision | Outcome |
|---|---|
| Q-bank scope | **Approved: defer.** Flashcard memory only; q-bank keeps its own later identity/memory phase. |
| CAS retry | **Approved:** `(expected_row_version, event)`, recomputed against fresh state. |
| Exhausted CAS -> `pickCard` | **Rejected.** Replaced by reconcile-from-ledger (§3.1). |
| Replay window | **Approved: bounded**, with a contractual support policy (§5.2). |
| Same-prefix auto-compatibility | **Rejected.** Replaced by explicit directional declarations (§4). |
| Sticky `version_mixed` | **Approved**, definition tightened to distinct contributing versions (§0.1). |
| Per-profile authority switch | **Approved as an invariant** (§7). |
| `transitions` as checksum | **Kept, reframed** as `transition_count` cardinality (§1). |
| **Event-projection idempotency** | **Designed (rev 3):** applied-event registry, atomic with the state write; replay as reconciliation; canonical occurrence order (§3A). |
| **Fast-path canonical position** | **Designed (rev 4):** immediate-next-unapplied test; watermark rule withdrawn (§3A.3). |
| **Per-row serialisation** | **Designed (rev 4):** advisory lock per memory identity; replay guarded by `row_version` (§3A.3.1-2). |
| **Seed consumption** | **Designed (rev 5):** `seed_format` + explicit `seed:<format>` declaration; `unknown` quarantined (§4.1a, §8). |
| Replay verification | **Tightened (rev 5):** set equality over `(occurred_at, client_event_id)`, never cardinality. |
| Advisory lock key | **Tightened (rev 5):** 64-bit; collision stated as a concurrency, not correctness, property. |

## What this revision changed, in one line each

1. Compatibility is now its own **fail-closed, directional** declaration —
   never derived from the version string (§4).
2. Exhausted CAS **reconciles from the ledger** instead of guessing (§3.1).
3. `version_mixed` is defined over **distinct contributing versions**, with
   seed-to-first-version explicitly not a crossing (§0.1).
4. `transition_count` claims **cardinality, not integrity** (§1).
5. Bounded replay is a **stated support policy**, and correction's
   identify-vs-repair asymmetry is written down (§5.2, §5.3).
6. Everything else stands as approved.

## What revision 3 added

Durability is not idempotency. An event can be safely in the ledger and still
be applied to `memory_state` twice — the failure needs nothing exotic, just a
lost response after a successful CAS.

- `memory_applied_events`, keyed `(account_id, client_event_id)` — the same
  identity the ledger dedupes on, so both layers agree on what "the same
  event" means.
- The registry insert and the state update commit **in one transaction**, via
  a single RPC. This is what separates "CAS failed, retry" from "CAS succeeded,
  response lost" — the two cases that otherwise look identical to the client.
- Canonical order is **occurrence order**, because `rateSRS` is order-sensitive
  and arrival order would let two devices converge to different state.
  A late event is *inserted into* history via replay, not appended to it.
- Pending work becomes a query, not an assumption:
  `ledger events - registry rows = pending projections`.

Two things stated rather than glossed: `occurred_at` is a client clock, so
cross-device ordering inherits clock skew; and the registry grows with the
ledger, with pruning deliberately deferred because the offline queue has no
bounded retry horizon.

## What revision 5 added

**The fail-closed rule had one leak, and it was at the least-known data.**
§4 refuses to let v2 consume v1 state without a declaration — but a seeded row
has `scheduler_version = NULL`, so `(consumer=v1, producer=NULL)` cannot even be
*posed*. The first transition onto legacy state was therefore taking a free
pass, and legacy state is precisely where the least is known.

The fix keeps two facts apart rather than collapsing them:

```
scheduler_version = NULL       the producing ALGORITHM is genuinely unknown
seed_format       = '...'      the SHAPE is knowable by inspection
```

Compatibility is asked against the shape, via a namespaced producer
`seed:<format>` in the existing relation — one lookup path, so the fail-closed
check cannot be implemented in one place and forgotten in another. No version
is invented to make the query convenient.

This matters most in replay: for `seed -> E1(v1) -> E2(v2) -> E3(v1)` there are
**four** gates, not three, and the seed arrow was the unchecked one.

02.2's finding that `DATA.cards` holds two incompatible shapes makes this
concrete, not hypothetical — so seeding becomes a **classification step** whose
distribution (`legacy-box-v0` / `legacy-anki-v0` / `unknown`) must be reported
before any switch. A non-zero `unknown` count is a decision for you.

## What revision 4 added

**The watermark rule was wrong.** "Newest for this row" cannot see a gap:

```
E1 10:00 projected      E2 11:00 PENDING      E3 12:00 arrives
12:00 > 10:00 -> fast path        but canonical truth is E1 -> E2 -> E3
```

The row would hold a state that never occurred, and E2 would be neither applied
nor explicitly pending — simply skipped. The fast path now requires that **no
earlier scheduler-relevant event for that identity is still unapplied**, tested
as an anti-join against the registry, not a timestamp comparison.

**The decision must be serialised.** The gap check and the write are now under
`pg_advisory_xact_lock` on the memory identity — advisory rather than
`FOR UPDATE` because the first event for a card has no row to lock yet.
Different cards never contend, which is the entire point of leaving the blob.

**A tension surfaced and resolved.** Server-side replay would require a second
`rateSRS` implementation, and two implementations that must agree forever is the
drift risk 02.3 spent a phase eliminating. Holding a transaction across a
network round-trip is also unacceptable. Resolution: replay stays
**client-computed**, submitted under `row_version` — sufficient because every
projection bumps it, so any concurrent write invalidates the replay and forces
a retry. One scheduler implementation survives; atomicity is preserved.

**The pending invariant is now properly scoped** to scheduler-relevant events
of one memory identity, so the elegant shorthand cannot become a broken global
health check.

## New consequence surfaced by revision 2

Amendment 2 exposed an ordering constraint that was not visible in revision 1:

> **`LEARNING_EVENTS` must be live before the authoritative switch.**

Once `memory_state` is authoritative, the ledger is the only correct recovery
path for an exhausted CAS. Enabling the ledger therefore belongs *inside* the
02.4 migration sequence, not as separate work that could follow it. This does
not alter the current hold — it fixes where that gate sits in the order.

## Status

**02.4 — design revision 5, submitted as the IMPLEMENTATION gate.**
Submitted as the implementation gate rather than a further architectural
expansion. No code, no DDL, no migration and no feature-flag change has been
made. The two flashcard orphans remain untouched.

If approved, the first implementation step is §7.1's prerequisite trio —
ledger live, projection idempotency, CAS verified — each with its own evidence
gate, before `memory_state` becomes authoritative for any profile.
