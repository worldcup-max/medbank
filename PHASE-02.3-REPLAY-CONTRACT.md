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

## Outstanding

Live emit of a genuine 02.3 event needs the deploy. Chain remaining:
deploy -> session-only flag flip on my own account -> emit -> read persisted
row -> confirm all three fields -> confirm the 14 pre-02.3 rows still NULL.
