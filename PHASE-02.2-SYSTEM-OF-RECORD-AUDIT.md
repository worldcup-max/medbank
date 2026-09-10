# Phase 02.2 — System of Record Audit (read-only)

02.2-A `profile_state` durability · 02.2-B ledger reconstruction capability.
No schema changes, no learner-state writes, no scheduler changes.
`LEARNING_EVENTS` remains false. The two flashcard orphans were not touched.

---

# 02.2-A — `profile_state`

## 1. Schema and size

```
profile_state
  level_profile_id  uuid        not null          (conflict target)
  account_id        uuid        not null
  state             jsonb       not null  '{}'
  rev               integer     not null  0
  device_updated_at timestamptz null
  updated_at        timestamptz not null  now()
```

Measured:

```
rows      6
total     758 kB
avg blob  126 kB
max blob  401 kB
max rev   4889
avg rev   1301
```

**One profile has been rewritten 4,889 times.** Each rewrite ships the entire
blob. At 401 kB that is ~1.9 GB of cumulative upload for a single learner's
history, to persist changes that are typically one card.

### What lives in `state`

Everything the app calls progress, in one object (from `mergeState`):

`cards` · `starred` · `log` · `study` · `streak` · `topics` · `done` · `read` ·
`notes` · `missLog` · `dayTopics` · `exams` · `pos` · `flags` · `cardEdits` ·
`cardFlags` · `plan` · `settings` · `viz` · `cardViz` ·
`qbank{ _attempts(cap 4000), _qmeta, _sessions(cap 200), _events(cap 1000) }`

Live counts: 271 q-bank attempts, **1,036 client `_events`** — already past the
1,000 per-profile cap, i.e. **telemetry is being dropped now**, which is the
decay you predicted in the durability audit.

### A second finding: two card-state shapes coexist

```js
app.html:1485   DATA.cards[id] = { box, due, seen, lapses, ms }     // rateSRS
app.html:1928   DATA.cards[id] = { due, ivl, ease, reps, isNew }    // viz-quiz seed
```

The second shape has no `box`. `rateSRS` defends against it explicitly
(line 1480: "a state written without a box … starts at -1"). So `DATA.cards`
is not a homogeneous type — any projection or migration must handle both.

## 2. Write path

Read: `sync.js:181`, **only inside `init()`** — once per page load.
Write: `sync.js:196`.

```js
var body = { level_profile_id, account_id,
             state: snapshot,              // the WHOLE DATA object
             rev: (m.rev||0)+1,            // from LOCAL meta, not the server
             device_updated_at: new Date().toISOString() };
await sb.from("profile_state").upsert(body, { onConflict:"level_profile_id" });
```

- **Full replacement.** Never a patch, never a jsonb merge.
- Debounced 1,500 ms via `schedulePush`, triggered by `persist()` (app.html:1317).
- On success `setMeta({rev, dirty:false})`; on error it logs and leaves
  `dirty:true`, but there is **no retry timer** — only a `window "online"`
  listener.
- **No flush on unload.** `sync.js` registers no `pagehide`, `beforeunload` or
  `visibilitychange` handler. (Notably, `learning-events.js` *does* — the newer
  writer is strictly more careful than the one holding the real state.)

## 3. Concurrency

**`rev` is not concurrency control.** It is incremented from `localStorage`
meta and written as a value. The upsert carries **no `.eq("rev", …)` predicate**
and there is no trigger or constraint on the table enforcing monotonicity.
It is descriptive metadata, not a compare-and-swap.

Consequently:

| Scenario | Behaviour |
|---|---|
| Two tabs, one device | Separate in-memory `DATA` each; shared `meta`. Last debounce to fire overwrites the other's whole blob. |
| Two devices | Each merges at load, then overwrites unconditionally on every push. |
| Stale read then write | Nothing detects staleness. The write succeeds. |
| Versioning / locking | None. **Last-write-wins on the entire document.** |

The merge logic (`mergeState`, `mergeCards`, `mergeQbankStore`, …) is
genuinely careful — `pickCard` resolves by `seen` then `box`, `_attempts`
union by id, `_events` union by content signature. But it runs **only in
`init()`**. The architecture is:

```
merge on load  ·  overwrite on write
```

Once a session is running, a device never sees another device's writes again.

## 4. Lost update — code-provable

```
Device A loads  → merges → holds S
Device B loads  → merges → holds S
A rates a card  → local S+A → debounce 1.5s → upsert(S+A)     rev = a+1
B rates a card  → local S+B → debounce 1.5s → upsert(S+B)     rev = b+1
```

B's upsert replaces the row. **A's card is gone** — not merged, not
conflicted, not logged. B's `rev` may even be *lower* than A's; nothing checks.
A's device still believes it is clean (`dirty:false`) and will not re-push.
The loss is silent and permanent until A next reloads — and at that point A
adopts or merges *the cloud copy that no longer contains A's update*.

**I did not demonstrate this live.** Any demonstration requires writing to
`profile_state`, which is real learner state and outside the read-only
mandate. The code path above is unambiguous: an upsert with no predicate on
`rev` cannot fail on a concurrent write, so the interleaving is not merely
possible but unavoidable whenever two writers overlap.

**This is a genuine durability defect, of the same class as the `qh` churn
that justified 01.5a.** It is currently masked by single-device usage: 6
profiles, low concurrency. It scales directly with adoption.

## 5. Failure behaviour

| Failure | Behaviour | Assessment |
|---|---|---|
| Network failure on push | Logged; `dirty` stays true; no retry timer | Recovered only by `online` event or next load |
| Navigate away mid-debounce | Push never fires | Safe-ish: `localStorage` holds it, next `init()` merges it up |
| Concurrent saves | Silent overwrite | **Defect (§4)** |
| Failed *read* | Throws deliberately (`AUTH-01`) rather than treating as "no cloud state" | **Correct, and hard-won** |
| Empty cloud vs real local | Refuses to adopt empty over real data | **Correct** |
| Account switch | Purges local, reloads | **Correct** |
| Partial write | Not possible — single-row upsert is atomic | Fine |

The read path has been hardened by real incidents. The write path has not.

---

# 02.2-B — Can the ledger reconstruct memory state?

Ledger contents today: **14 rows** (my own Build-01 verification), flag off.

## What the schedulers actually hold

**Flashcards** — `DATA.cards[id] = {box, due, seen, lapses, ms}`
`rateSRS(id, ok)`: correct → `box+1` capped, `due = today + LADDER[box]`;
wrong → `box = -1`, `due = today+1`, `lapses+1`. Plus a side effect:
a pass **deletes `DATA.starred[id]`**.

**Q-bank** — `qbSched()[key] = {n, streak, interval, dueAt, firstAt, servedQhs,
_day, lastOk, conf, miscon, prio, lastSeen, noFresh}`
`qbSchedApply(qh, ok, conf)`: `conf` drives three actions —
`reset` (wrong) / `hold` (correct-but-unsure, conf≤1) / `advance` (secure).
Key is `qbRetentionKey(qh)` = `t:<target_id>` when a target is known,
else `q:<qh>`.

## Reconstructible

| State | From | Confidence |
|---|---|---|
| `box`, `due` | ordered `correct` + day | High |
| `lapses` | count of `correct=false` | High |
| `streak`, `n`, `interval`, `dueAt` | ordered `correct` + `confidence` | High |
| `servedQhs` | `object_id` sequence | High |
| `miscon`, `prio`, `lastOk`, `conf` | derived per event | High |
| `ms` (EWMA) | `response_ms` | High — `response_ms` **is** sufficient |
| graduation (`interval→99`) | replay | High |

`response_ms` is adequate: `recordAnswerMs` clamps to 1.5–120 s and blends
0.7/0.3, and the ledger stores clamped integer ms.

## NOT reconstructible — six gaps

**1. Day boundaries.** `dayNum()` is the *device's local calendar day*
(`Date.UTC(y, m, d)/864e5`). The ledger stores `occurred_at` as a UTC instant
and **no timezone offset**. `qbSchedApply` gates the ladder on `e._day !== today`
— at most one advance per attempt-day — so a wrong day boundary changes the
resulting interval. This is a correctness gap, not a rounding one.

**2. No scheduler version.** `LADDER = [1,3,7,7,7,14,14]` and
`QB_LADDER = [1,3,7,14]` are not recorded on events. Replaying old events
under a future ladder silently yields different state, with no way to detect
it. **This alone rules out architecture B (ledger + projection) as the sole
store unless a `scheduler_version` field is added first.**

**3. No corrections or reversals.** The ledger is insert-only by design and has
no compensating-event vocabulary. An undo, a mis-tap, or an admin fix has no
representation. Immutability without compensation means "wrong" is permanent.

**4. No pre-ledger history.** All 321 live card states and the entire q-bank
schedule predate the ledger. A projection can only reconstruct forward, so it
needs a **seed snapshot** of current state — which means the state store has
to exist regardless of what the ledger can do.

**5. State no event models.** `starred` (deleted as a side effect of passing),
`medianSamples`, `log` daily counters, `study` seconds, `streak`, `missLog`,
`cardEdits`, `flags`. These are learner state and no emit site covers them.

**6. Identity coverage.** Flashcard events carry `target_id: null` and
`object_id: cid`; q-bank events carry `target_id` for ~30% of questions. Since
`qbRetentionKey` switches between `t:` and `q:` as targets become known, and
`qbMigrateSched` folds legacy keys, replay must reproduce *target-known-ness at
the time of each event*. The ledger does record `target_id` as it was at emit
time, which helps — but only for events emitted after the flag goes on.

---

# DECISION GATE

## 1. Current de facto system of record

**A single 126 kB (max 401 kB) JSON blob per level-profile in
`profile_state.state`, owned by the client, replaced wholesale on a 1.5-second
debounce with no concurrency control.**

## 2. Proven failure modes

1. **Silent lost update on concurrent write** (§4) — code-provable, no
   compare-and-swap exists. Not hypothetical; masked only by low concurrency.
2. **Telemetry already being dropped** — `_events` at 1,036 against a
   1,000 cap.
3. **No unload flush and no push retry timer** — recovery depends on
   `localStorage` surviving and the user returning.
4. **Unbounded write amplification** — 4,889 full-blob writes on one profile.
5. **Heterogeneous card-state shapes** in the same map.

## 3. Ledger reconstruction capability

Both scheduler ladders are **fully replayable in principle** from
`{object_id, correct, confidence, response_ms, occurred_at}` — every numeric
field of both schedulers is derivable.

It fails on **six** things: local day boundaries, scheduler version,
corrections/reversals, pre-ledger history, non-event state (`starred`,
`streak`, `log`, `medianSamples`), and identity coverage for flashcards.

The first four are fixable with additive event fields and a seed snapshot.
The fifth is not — it is state that simply is not a learning event.

**Therefore: the ledger cannot be the only store.** Not because replay is
weak, but because a seed snapshot is required and because a class of learner
state is not event-shaped.

## 4. Recommended architecture — **C, ledger + authoritative state**

Rejecting A (state only): discards the ledger we already built and proved, and
leaves no audit trail for the learner model.
Rejecting B (ledger + projection as sole store): defeated by gaps 2 and 4 —
no scheduler version, and no pre-ledger seed.

```
client  ──emit──→  learning_events   (immutable, audit + future learner model)
        │
        └──write─→  memory_state     (authoritative, per-object, row-level)
                          ↓
                      scheduler
```

- **Tables.** Keep `learning_events` exactly as it is. Add a per-object
  `memory_state` table — one row per (level_profile_id, object_key) holding
  `{box, due, seen, lapses, ms}` or the q-bank equivalent, with `updated_at`
  and a `version` integer. Leave `profile_state` in place for everything that
  is not memory state.
- **Ownership.** `memory_state` is authoritative for scheduling.
  `learning_events` is authoritative for history. `profile_state` retains
  settings, notes, plan, viz — the non-memory remainder.
- **Write direction.** Row-level upsert per card rated, guarded by
  `version` compare-and-swap. A conflict is *detected*, then resolved with
  the existing `pickCard` rule (greater `seen` wins, ties to higher `box`) —
  the merge logic already exists and is already tested; it simply needs to run
  at write time instead of only at load.
- **Read direction.** Scheduler reads `memory_state`; nothing reads
  `learning_events` in the learning path (unchanged discipline).
- **Migration.** Seed `memory_state` from today's `profile_state.state.cards`
  (321 valid entries, both shapes normalised). Dual-write for a measured
  period; compare and report divergence; then cut the scheduler over. Legacy
  `cid` keys are preserved — 02.1 established no re-keying is needed.
- **Offline.** Same queue discipline as `learning-events.js`: persist locally
  first, send after, drop only on confirmed success or confirmed duplicate.
- **Concurrency.** Per-row CAS. Two devices rating *different* cards no longer
  conflict at all — which removes the entire class of loss described in §4,
  since today they conflict merely by sharing a blob.
- **Scheduler relationship.** Unchanged behaviour. Same ladders, same
  functions. Only the storage location of `DATA.cards` changes.
- **Rollback.** `profile_state` keeps receiving writes throughout the
  dual-write period, so rollback is a one-line flag flip back to reading
  `DATA.cards`. No data is destroyed at any point.

### Additive prerequisites (small, and worth doing before any of the above)
Add to emitted events: `scheduler_version`, `local_day` (the client's
`dayNum()`), and `tz_offset`. These cost nothing now and are unrecoverable
later — every event written without them is permanently un-replayable.

---

## Explicitly not done

- No writes to `profile_state`, no live lost-update demonstration.
- No schema changes, no `memory_state` table created.
- No scheduler change. `LEARNING_EVENTS` still false.
- The two flashcard orphans untouched; still an open hygiene item.
