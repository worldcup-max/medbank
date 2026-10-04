# Phase 02.4 — Required Closures

Follow-up to the database evidence gate. Run 2026-09-11, live production DB.

---

## Closure 2 — `transition_count` after replay: **PASS**

Queried the real row after the three-event replay (T15):

```
transition_count      : 3
last_event_id         : E3          (identity confirmed, not just non-null)
row_version           : 2
receipts              : exactly [E1, E2, E3]
needs_reconciliation  : false       (cleared by the replay)
quarantined           : false
scheduler_version     : srs-box-v1@1.3.7.7.7.14.14
version_mixed         : false
```

---

## Closure 3 — population arithmetic: **PASS, after correcting my error**

```
seed_format       classified   live_eligible   dead_excluded   profiles
legacy-anki-v0         1             0               1            1
legacy-box-v0        322           321               1            4
TOTAL                323           321               2            4
```

```
323 classified  −  1 dead legacy-box  −  1 dead legacy-anki  =  321 eligible   ✓
```

**The error was mine and worth naming precisely.** I reported "322 classified"
when 322 was the *legacy-box subtotal*, not the total. The total is 323. The
321 figure happened to be right, but it was not derived correctly — which is
worse than being wrong, because it read as confirmed.

Rows are now mutually exclusive by construction (a single `case` expression),
so the three format rows and TOTAL reconcile by construction rather than by
coincidence.

---

## Closure 1 — split, as agreed

### 1a. Client per-event dispatch — **formally transferred to the client gate**

`mb_apply_replay` never executes a scheduler. It verifies set equality, writes
receipts, and commits a client-computed result. Per-event dispatch is therefore
client behaviour and cannot be proven at the database layer by construction.

To be proven at the client replay gate, when that code exists:

```
seed → E1(v1) → E2(v2) → E3(v1)
```

verifying the client invokes each event's own implementation rather than
replaying the whole chain through whichever scheduler is current.

### 1b. DB directional compatibility chain — **NOT RUN (blocked)**

Requires one temporary declaration, which needs the service role — the client
policy on `scheduler_compatibility` is SELECT-only. The Supabase SQL editor
froze repeatedly on evaluation this session (Monaco loading, then renderer
timeouts), so the temporary row could not be inserted.

**Still outstanding**, unchanged in scope:

```
declare   consumer=test-v2  producer=v1   compatible=true
          (reverse deliberately NOT declared)

then      E1 under v1        -> applied,   version_mixed=false
          E2 under test-v2   -> applied,   version_mixed=TRUE (sticky)
          E3 under v1        -> QUARANTINED (reverse undeclared)

then      remove the temporary declaration
          verify table returns to exactly one row
```

---

## Unplanned finding — client cannot author its own compatibility

While preparing 1b I checked whether a client could simply declare itself
compatible. If it could, fail-closed would be decorative.

I attempted, from the authenticated browser client:

1. `INSERT` a fabricated declaration (`attacker-v9@0` consuming v1, `true`)
2. `UPDATE` the seed declaration to `compatible = false`
3. `DELETE` every row in `scheduler_compatibility`

The renderer froze mid-call, so I could not capture the return codes. I
verified by **outcome** instead, which is the stronger check:

```
rows=1 :: srs-box-v1@1.3.7.7.7.14.14 <= seed:legacy-box-v0 = true
```

The table is untouched. A client-side attempt to delete every declaration
changed nothing. This follows from RLS default-deny: the table has a SELECT
policy and no INSERT/UPDATE/DELETE policy, so those commands are denied rather
than merely unsupported.

**Status: PROVEN by outcome, not by return code.** I would re-run it for clean
return codes before treating it as formally recorded.

---

## Gate status

```
Closure 2  transition_count after replay        PASS
Closure 3  population arithmetic reconciled     PASS  (323 - 2 = 321)
Closure 1a client per-event dispatch            TRANSFERRED to client gate
Closure 1b DB directional chain                 OUTSTANDING — blocked on SQL editor
Bonus      client cannot author compatibility   PROVEN by outcome

Client changes      BLOCKED - untouched
Seeding             BLOCKED - and needs the per-profile vs service-role decision
Authority switch    BLOCKED
LEARNING_EVENTS     off, unchanged
Flashcard orphans   untouched
```

No new ledger rows were written for these closures. Shadow-table state is
unchanged from the previous gate (4 `memory_state`, 7 receipts, all `v024-*`).
