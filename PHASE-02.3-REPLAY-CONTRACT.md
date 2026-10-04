# Phase 02.3 — Replay-Safe Event Contract

Implemented (b): declare Q-bank scheduler parameters in the version module,
leave `qbSchedApply` untouched, prove the declaration truthful by contract test.

`LEARNING_EVENTS` remains **false**. No scheduler change, no `memory_state`,
no `profile_state` migration, no `cid` change. The two flashcard orphans are
untouched.

---

## The audit that changed the design

You asked that the fingerprint cover **every** constant that changes scheduler
output, not merely the ladder, and that the test establish the assumption
rather than assume it. It did not hold:

| Surface | Output-changing constants |
|---|---|
| `rateSRS` | `LADDER` only. Box cap derives from `LADDER.length`; `-1` reset and `+1` failure step are control flow, not parameters. |
| `qbSchedApply` | `QB_LADDER` **plus four inline literals**: `conf>=2` (confident), `conf<=1` (unsure), `interval=1` (failure reset), `99` (graduation sentinel). |

Fingerprinting only `QB_LADDER` would have shipped exactly the silent drift the
two-part design exists to prevent: changing `conf>=2` to `conf>=3` alters replay
output while leaving the version string identical.

## Versions

```
srs-box-v1@1.3.7.7.7.14.14
qb-retention-v1@1.3.7.14~2.1.1.99
                └ladder┘ └params┘
```

The Q-bank suffix carries a second segment because the ladder alone is not the
whole parameter set. `~confHi.confLo.resetInterval.graduate`.

- **Prefix** — semantic algorithm version, bumped **by hand** when logic changes.
- **Suffix** — deterministic fingerprint, computed at emit time from the live
  constants, so a parameter edit cannot masquerade as the old algorithm.
- Separate namespaces per surface; they move independently.
- An app/build version must **never** be used here.

## Descriptive, not configuration

```
        qbSchedApply
             |
             +-- actual behaviour
                     ^
                     |  qa/v18-replay-contract.mjs asserts they agree
                     |
             declared parameters (MB_QB_PARAMS)
```

`MB_QB_PARAMS` **describes** what `qbSchedApply` does. It does not control it.
The block carries a standing warning against "fixing" a scheduler by editing
the declaration — that changes nothing except the recorded version string,
which would then be a lie about what the code did.

### Technical debt (recorded)

> Q-bank scheduler parameters are currently inline literals inside
> `qbSchedApply`. 02.3 fingerprints them through an external declaration
> verified by contract test rather than authoritative constants. Extracting
> them into real constants is deferred to a legitimate scheduler-change phase.

## The contract

```
scheduler-relevant  (question_answered, card_reviewed)
    -> local_day + tz_offset + scheduler_version  REQUIRED

non-scheduler       (note_read)
    -> all three NULL. A note has no scheduler; stamping one would be
       meaningless provenance.
```

Nullable in the database, **mandatory in the application**. A scheduler event
without a version is **refused**, not stored unusable — an immutable ledger has
no UPDATE policy, so an unreplayable row could never be corrected.

## The temporal boundary — historical truth preserved

The 14 Build-01 verification rows predate the contract and are genuinely not
replay-safe. They were **not** retrofitted with invented values.

```
total  with_day  with_tz  with_ver
  14        0        0        0
```

```
pre-02.3   scheduler_version = NULL   local_day = NULL   tz_offset = NULL
02.3+      scheduler event -> all three populated
```

---

## VERIFICATION

```
DDL
├── local_day integer ............... APPLIED, nullable
├── tz_offset smallint .............. APPLIED, nullable
├── scheduler_version text .......... APPLIED, nullable
├── partial index on version ........ APPLIED
└── IMMUTABILITY INTACT ............. policies = 2, cmds = INSERT,SELECT
                                      (no UPDATE, no DELETE — unchanged)

TESTS  qa/v18-replay-contract.mjs ... 18/18
├── T1-T4   shape, namespaces, not-a-build-version
├── T5-T8   each ladder moves ONLY its own surface
├── T9      confHi / confLo / resetInterval / graduate each move the version
├── T10     DECLARATION vs REAL qbSchedApply (below)
└── T11     a logic edit does NOT move the fingerprint -> prefix is the guard

TESTS  qa/v18-event-contract.mjs .... 15/15
├── T1-T4   scheduler event carries all three, local_day from app dayNum()
├── T5-T7   REFUSED without a version; nothing queued; refusal counted
├── T8-T9   qbank uses its own namespace + temporal context
├── T10-T14 note_read stays NULL; an offered version is IGNORED, not stored
└── T15     client still never sends account_id

REGRESSION
├── v18-tkey-normalisation .......... 18/18
├── v18-resolver-evidence ........... 21/21
├── v18-qid-identity ................ 16/16
└── LEARNING_EVENTS ................. still false
```

### T10 — the test that matters

`MB_QB_PARAMS` claims the confidence boundary; `qbSchedApply` is the only
authority on it. The test extracts the **real function source from app.html**
and executes it at conf 0/1/2/3 against a live schedule:

```
observed on correct answers: {"0":"hold","1":"hold","2":"advance","3":"advance"}

T10a declared confLo=1        observed hold at conf [0,1]        AGREE
T10b declared confHi=2        observed advance at conf [2,3]     AGREE
T10c declared resetInterval=1 observed on a real failure = 1     AGREE
T10d confident-wrong flagged as misconception                    AGREE
T10e declared graduate=99     real row deleted at ladder top     AGREE
```

If anyone later edits `conf>=2` without updating the declaration, T10 fails.

---

## Files changed

| File | Change |
|---|---|
| `app.html` | Replay-contract module after `QB_LADDER`; `scheduler_version` at 3 emit sites. **No scheduler logic touched.** |
| `learning-events.js` | Contract enforcement + stamping in `emit()`; `refused` counter |
| `import-server/sql/replay_contract.sql` | new — additive DDL + verification queries |
| `qa/v18-replay-contract.mjs` | new — 18 tests |
| `qa/v18-event-contract.mjs` | new — 15 tests |
| `sw.js` | cache v226 |

---

## LIVE VERIFICATION (commit 3d8fa61, SW v226 active)

Deployed, then the flag flipped **in that browser session only** — `config.js`
was not in the commit and still reads `LEARNING_EVENTS: false`; the live page
reported `flag:false` on load before the flip, and the flip died with the tab.

### Version builders, live in production

```
mbSchedVerCard()   -> srs-box-v1@1.3.7.7.7.14.14
mbSchedVerQbank()  -> qb-retention-v1@1.3.7.14~2.1.1.99
caches             -> ['medbank-v226']
```

### Four genuine events emitted

```
emitted: { card:true, qbank:true, note:true, refused:false }
stats:   { queued:3, sent:3, dup:0, pending:0, failed:0, refused:1 }
```

### Read back from the database

```
event_type        surface    sched_ver                          local_day  tz
card_reviewed     flashcard  srs-box-v1@1.3.7.7.7.14.14           20706    -60
question_answered qbank      qb-retention-v1@1.3.7.14~2.1.1.99    20706    -60
note_read         note       <NULL>                              <NULL>   <NULL>
```

- Each surface persisted **its own** algorithm namespace.
- `tz_offset = -60` (WAT, UTC+1) — the real device offset, so `local_day`
  20706 is interpretable rather than an opaque integer.
- `note_read` stayed NULL **although a `scheduler_version` was deliberately
  offered to it**. Meaningless provenance is refused at the writer.
- The 4th event — a `card_reviewed` with no version — was **refused**, counted,
  and never reached the database.

### The temporal boundary holds

```
era                  rows  with_ver  with_day  with_tz  unreplayable_sched
02.3 verify             3         2         2        2                   0
pre-02.3 (build 01)    14         0         0        0                  12
```

The 12 pre-02.3 scheduler events are honestly unreplayable and remain so.
Nothing was retrofitted. Every scheduler event written after the deploy
carries the full contract.

### Immutability re-confirmed after the DDL

```
policies = 2    cmds = INSERT, SELECT
```

No UPDATE policy, no DELETE policy. Unchanged.

---

## GATE — 02.3 APPROVED / PROVEN IN PRODUCTION

> The immutable learning ledger now records sufficient temporal and scheduler
> provenance for future replay without retrofitting historical events.
> Scheduler-specific provenance is surface-specific and enforced at write time.
> Invalid scheduler events are refused. Existing pre-contract events remain
> explicitly unreplayable rather than being fabricated into compliance.
> Feature remains dark.

### The three verification rows — permanent by decision

`object_id like 'v023-verify-%'`

**02.3 production verification fixtures — permanent immutable audit records.**

They are legitimate rows written through the real production path. They are
NOT to be deleted, and **no DELETE capability may be added to remove them** —
introducing mutability into the ledger to tidy three rows would be
architectural damage far exceeding the benefit.

If a formal operational-vs-verification distinction is ever genuinely needed,
it belongs in `metadata` or a future event classification. That distinction
must **not** be introduced merely to clean these rows up.

### Production flag flip — bounded and recorded

```
deployed writer -> session-only flag -> genuine events
    -> database verification -> flag false -> session closed
```

`config.js` was never modified, so no persistent enablement existed at any
point. Recorded as controlled production verification, not a deviation.

---

## PHASE STATUS

| Phase | Status |
|---|---|
| 02.1 Card identity | **closed** — investigated, no migration warranted |
| 02.2 System of record | **closed** — Architecture C approved |
| 02.3 Replay contract | **closed** — production-proven |
| 02.4 `memory_state` | **HELD — design review required before any work** |

### 02.4 is frozen pending review of seven design questions

1. exact `memory_state` schema
2. identity/key strategy for Q-bank + flashcards
3. CAS semantics
4. migration strategy from existing `profile_state`
5. how scheduler versions interact with current state
6. recovery/rollback behaviour
7. what happens to legacy state that cannot be reconstructed from events

**Until that gate is explicitly approved: no feature-flag changes, no
migrations, no target work, no scheduler unification, no cleanup.**
The two flashcard orphans remain an open hygiene item, untouched.

### Question 5 is an ARCHITECTURAL decision, not an implementation detail

The two questions are genuinely different:

```
learning_events.scheduler_version
    -> "which algorithm produced THIS EVENT?"          (settled, 02.3)

memory_state
    -> "what algorithmic state do we currently hold,
        and under what semantics may the NEXT transition
        safely be computed?"                            (open, 02.4)
```

Neither "last writer wins" nor "set of contributing versions" may be chosen
prematurely — both can create subtle replay and rollback problems.

**Seven cases must be explicitly modelled before any schema is approved:**

1. **v1 -> v2 transition** — an existing row receives its first event under a
   new scheduler.
2. **v1 -> v2 -> v1** — rollback / reversion.
3. **Historical replay** — reconstructing state from events after scheduler
   versions have changed.
4. **Partial migration** — some memory objects migrated, others still
   represented only in `profile_state`.
5. **Concurrent transition** — two clients advancing the same memory row.
6. **Algorithm correction** — discovering a scheduler version was wrong,
   without rewriting historical events.
7. **Mixed-version history** — one current state genuinely being the
   accumulated result of multiple scheduler versions.

### Governing principle for 02.4

> **Never make `memory_state` pretend that historical provenance is simpler
> than it actually is.**

The immutable event ledger already holds the historical truth. `memory_state`
is an authoritative *materialised current state* carrying enough metadata to
know how that state may safely be advanced — **not** a compressed substitute
for the event history.
