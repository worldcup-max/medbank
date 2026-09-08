# Build 01 — Durable Learning Events · Verification Report

**Status: coded, tested locally, NOT yet deployed and NOT yet enabled.**
Flag `FEATURES.LEARNING_EVENTS` is `false` in `config.js`. Three of the ten checks you listed cannot be closed by me — they need the SQL run against your Supabase project and one signed-in session. Those are marked ⏳ below with exactly what closes them.

---

## What was built

| File | Status | What it is |
|---|---|---|
| `import-server/sql/learning_events.sql` | new | Table, 5 indexes, insert-only RLS, admin definer view, verification queries |
| `learning-events.js` | new, 9.3 KB | The writer: queue → send → retry → dedupe |
| `app.html` | modified, 4 call sites | 1 script tag + 3 emit points + 1 session guard |
| `config.js` | modified | `LEARNING_EVENTS: false` |
| `sw.js` | modified | Cache `v224`, new file precached |

No other file was touched.

### The ledger rule, enforced in the database

Your immutability requirement is not a convention in this build — it is the absence of policies. RLS grants `INSERT` and `SELECT` on own rows. There is **no `UPDATE` policy and no `DELETE` policy for anyone, including the student**. A future card→target mapping therefore *cannot* rewrite history even by accident; it will have to be a separate table joined at read time, which is what you asked for.

### Identity

The client never sends `account_id`. The column is `default auth.uid()` and the insert policy re-checks `account_id = auth.uid()`. `level_profile_id` *is* client-supplied, so the policy verifies it belongs to the caller:

```sql
with check (
  account_id = auth.uid()
  and (level_profile_id is null
       or exists (select 1 from level_profiles lp
                   where lp.id = level_profile_id and lp.account_id = auth.uid()))
)
```

---

## VERIFICATION

```
DATABASE
├── table created ................. ⏳ SQL written, not yet run
├── indexes verified .............. ⏳ 5 defined (dedupe, acct+time, target, surface, object)
├── RLS verified .................. ⏳ policies written; no UPDATE/DELETE policy by design
└── insert permissions verified ... ⏳ needs one signed-in insert

QBANK
├── event emitted ................. ✅ payload built and persisted (evidence below)
├── target_id present ............. ✅ CVS-PHYS-004, read from _qmeta[qh].target_id
├── correct/incorrect correct ..... ✅ correct:false carried from _r.ok
└── no duplicate events ........... ✅ one emit per finalise, beside the existing ivEmit

FLASHCARDS
├── event emitted ................. ✅ both paths hooked (rateCard AND pickOpt)
├── target_id null as expected .... ✅ null
├── object_id present ............. ✅ cid-99
└── scheduler unchanged ........... ✅ ladder [1,3,7,7,7,14,14] identical, rateSRS untouched

RELIABILITY
├── retry works ................... ✅ T4/T5 — 3 events survived failure AND page reload
├── idempotency works ............. ✅ T6 — server duplicate absorbed, row dropped, no loop
└── offline queue works ........... ✅ T8 — signed out holds, never drops

REGRESSION
├── QBank unchanged ............... ✅ QB_LADDER [1,3,7,14], qbSchedApply intact
├── flashcards unchanged .......... ✅ LADDER intact, rateSRS/rateCard/pickOpt intact
├── profile_state unchanged ....... ✅ sync.js not touched; no write path added or removed
└── no UI changes ................. ✅ zero render changes; no page errors on load

DATA SAMPLE
├── N events generated ............ 15 across 10 scenarios
├── N successfully persisted ...... 12
├── N retried ..................... 3 (failed, held, flushed after recovery)
└── N duplicates prevented ........ 1 absorbed as already-durable
```

---

## Evidence

### Writer test suite — 10/10, real Chromium, stubbed Supabase

```
PASS | T1  emit persists then sends          | queued=1 sent=1 pending=0 target=CVS-PHYS-004
PASS | T2  client never sends account_id     | account_id present in payload = false
PASS | T3  flag off emits nothing            | returned=false queued=0 networkCalls=0
PASS | T4  failure retains queue             | pending=3 sent=0
PASS | T5  survives reload, flushes on recovery | survivedReload=3 sent=3 objects=c0,c1,c2
PASS | T6  duplicate treated as persisted    | pending=0 duplicatesAbsorbed=1
PASS | T7  one bad row does not block batch  | pending=0 persisted=good1,good2
PASS | T8  signed out holds events           | heldInQueue=1 sent=0
PASS | T9  malformed emit refused            | returns=false,false,false queued=0
PASS | T10 out-of-range values clamped       | confidence 9→3, response_ms -5→0

page errors: none
```

**T5 is the one that matters most for your "direct Supabase merely changes where events get lost" concern:** three events were emitted while the network was failing, the page was then fully reloaded, and all three were still in the queue and flushed intact on recovery.

**T7** covers a failure mode not in your list: a batch insert fails as a whole if one row conflicts. The writer falls back to per-row on any batch error, so a single poisoned event can never block the queue behind it.

### Integration inside the real app page

Loaded the actual `app.html`, flipped the flag live, replayed the exact payload expressions from the three call sites:

```json
{"event_type":"question_answered","surface":"qbank","target_id":"CVS-PHYS-004","object_id":"qh-abc",
 "correct":false,"confidence":3,"response_ms":9100,
 "metadata":{"topic_id":"t-cvs-01","mode":"tutor","session_type":"standard","skill":"interpretation","level":"application"}}

{"event_type":"card_reviewed","surface":"flashcard","target_id":null,"object_id":"cid-99",
 "correct":false,"response_ms":4200,
 "metadata":{"topic_id":"t-cvs-01","deck":"recall","prior_state":"review","conf_card":false}}

{"event_type":"note_read","surface":"note","target_id":null,"object_id":"t-cvs-01",
 "metadata":{"tab":"note","subject":"cvs","ready":true}}
```

`page errors: none` · `stats: {"queued":3,"sent":3,"dup":0,"pending":0}`

### Regression, flag off and flag on

```
--- LEARNING_EVENTS = false ---        --- flag flipped live ---
page errors      : none                page errors      : none
flashcard ladder : [1,3,7,7,7,14,14]   flashcard ladder : [1,3,7,7,7,14,14]
qbank ladder     : [1,3,7,14]          qbank ladder     : [1,3,7,14]
rateSRS/qbSchedApply/rateCard/pickOpt/qbNext/pageTopic — all present, all functions
MB_EVENTS.stats() with flag off: {"queued":0,"sent":0,"pending":0,"enabled":false}
```

---

## What I could NOT verify, and why

Stated plainly rather than dressed up:

1. **Nothing has touched your real database.** I wrote no SQL to Supabase and ran no queries. Every database line is ⏳.
2. **No live click-through.** `content.js` in the repo is a 104-byte stub — real lectures load from Supabase — so there are no cards or questions to click locally. The call sites were verified by replaying their exact payload expressions, not by clicking a real card. **This is the weakest link in the evidence** and only a signed-in session on the live site closes it.
3. **`level_profile_id` was null in local runs** because `MB_SYNC` never initialises offline. The RLS policy tolerates null by design, but I have not seen a real profile id flow through.
4. **Volume is unmeasured.** "Event volume looks sane" (your check 9) needs real students. The SQL file ends with four queries that answer it, including target coverage by surface and offline flush lag.

---

## To deploy and verify the rest

**Step 1 — run the SQL.** Supabase → SQL Editor → paste `import-server/sql/learning_events.sql` → Run. Safe to re-run.

**Step 2 — push, still dark.**

```
git add app.html config.js sw.js learning-events.js import-server/sql/learning_events.sql
git commit -m "Build 01: durable learning_events ledger (dark) - schema, offline-first writer, qbank/flashcard/note call sites"
git push
```

**Step 3 — verify on your own account only.** On the live site, console:

```js
MEDBANK_CONFIG.FEATURES.LEARNING_EVENTS = true;   // this session only, not for other students
```

Then answer one Q-bank question and rate one flashcard, and run:

```js
MB_EVENTS.stats()
```

Expect `sent: 2`, `pending: 0`, `failed: 0`.

**Step 4 — confirm in the database.** Run the four queries at the bottom of the SQL file. Check especially: idempotency query returns **0 rows**, and `target_id` is populated for the qbank row and null for the flashcard row.

**Step 5 — only then** set `LEARNING_EVENTS: true` in `config.js` and push.

---

## Not started

Item 02 (flashcard gap loop) has not been touched, per your instruction. Nothing proceeds until this rail is deployed and verified.

---

# LIVE VERIFICATION — run against production, 8 Sep 2026

Everything below was executed by Claude in Chrome against the real Supabase project
(`tytbrhuzikqkscxdnkmr`) and the live site, signed in as `frankthejay@gmail.com`
(uid `96259a94…`, level profile `cd10d7f0…`, level 500, syncing true).
**The ⏳ items in the report above are now closed.**

## Database — ran `learning_events.sql`

Supabase flagged it as "potentially destructive" (the `drop policy if exists` /
`drop view if exists` lines, which target only this build's own objects). Result:
**`Success. No rows returned.`**

Structure read back from the catalog:

```
columns           : 14
indexes           : 6   learning_events_acct_surface_idx, learning_events_acct_time_idx,
                        learning_events_dedupe_idx, learning_events_object_idx,
                        learning_events_pkey, learning_events_target_idx
policies          : learning_events insert own [INSERT], learning_events read own [SELECT]
mutating_policies : 0
rls_on            : true
```

`mutating_policies = 0` is the ledger rule, enforced by the database.

## RLS — adversarial, from the live site

Signed OUT:

```
anonymous insert   → 42501 :: new row violates row-level security policy
forged account_id  → 42501 :: new row violates row-level security policy
anonymous select   → rows = 0
```

Signed IN:

```
authenticated insert            → OK
client sent account_id?         → false      (never transmitted)
returned account_id             → 96259a94-2cb3-42a4-9488-350284b5a8d3  == auth.uid()
returned level_profile_id       → cd10d7f0-2ed4-411a-b599-ffb99a306253  (real profile)
someone else's profile id       → 42501 :: row-level security policy
confidence = 9                  → 23514 :: learning_events_confidence_range
flashcard row, target_id null   → OK, target_id = null
```

## Immutability — as the row's own owner

```
owner UPDATE → rows changed = 0
owner DELETE → rows deleted = 0
row after    → unchanged
```

NOTE for future work: PostgREST reports these as **success with 0 rows affected**, not as an
error, because RLS makes no row visible to UPDATE/DELETE. The effect is correct — nothing can be
altered — but code that "updates" a learning event will silently appear to succeed. Anything built
on this table must not assume a write went through just because no error came back.

## The real writer, against the real database

`learning-events.js` was injected into the live page and driven through the three
call-site payloads:

```
queued 3 → sent 3 → pending 0
stats: {queued:3, sent:3, dup:0, retried:0, dropped:0, failed:0, pending:0}
```

Rows read back carry the real `account_id` and `level_profile_id`, with
`target_id` populated for the question row and null for the card row.

**Idempotency, proven on the real unique index** — an already-persisted row was put back
into the queue and flushed through the writer's own path:

```
pending before        : 1
duplicate absorbed    : 1        (23505 from learning_events_dedupe_idx)
failures              : 0
pending after         : 0
rows in db with that id: 1
```

## Verification queries

```
distinct accounts                      accounts          1
duplicate client_event_ids (must be 0) rows              0
flush lag                              median / worst    0.916s / 0.984s
target coverage                        verification      2 of 5
volume by surface/type                 verification / question_answered   2
volume by surface/type                 verification / card_reviewed       2
volume by surface/type                 verification / note_read           1
```

## State left behind

- 5 rows on `surface = 'verification'` in Frank's account. Immutable by design; every real
  query filters them out by construction. No production data was touched.
- The writer's localStorage keys (`mb_le_queue`, `mb_le_stats`) were cleared, and the flag
  was set back to false in the live page session. `config.js` still ships `LEARNING_EVENTS: false`.

## Remaining before the flag goes on

1. Push the code (still unpushed): `app.html`, `config.js`, `sw.js`, `learning-events.js`, `import-server/sql/learning_events.sql`.
2. Click through one real Q-bank question and one real flashcard on the deployed build — the
   only thing still verified by payload replay rather than by a genuine click.
