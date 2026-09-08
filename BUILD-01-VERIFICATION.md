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

---

# CLICK-THROUGH ON THE DEPLOYED BUILD — 8 Sep 2026

Deploy confirmed live before testing: `sw.js` = `medbank-v224`, `learning-events.js` served
(9,353 bytes), `app.html` requesting `learning-events.js?v=20260908`, 4 `MB_EVENTS.emit` call
sites present, `config.js` shipping `LEARNING_EVENTS: false`.

The service worker had v224 **installed but waiting** — the old v223 was still serving
`config.js`, so the flag key read as `undefined` until `postMessage({type:'skipWaiting'})`
activated it. This is the banner-driven upgrade working as designed (SW-08), and it is what a
returning student will experience: they get the update banner, not the new code, until they
accept it.

During the click-through every emitted event was wrapped to add
`metadata.verification = 'build01-clickthrough'`, so these rows are excludable from real
analysis without violating the ledger's immutability.

## Real flashcard — genuine click, real SRS mutation

Card: `c78ecd9e…|r|8lvxrc` — "What is the definition of neonatal jaundice?" (Paediatrics),
answered correctly through the real MCQ path (`pickOpt`).

```
SRS before : {box:0, due:20695, lapses:1, seen:20694}
SRS after  : {box:1, due:20707, lapses:1, seen:20704}
event      : card_reviewed / flashcard / correct:true / response_ms:50597 / target_id:null
```

The scheduler behaved exactly as it does without the ledger — box advanced, due pushed out by
the ladder. The event is an observer, not a participant.

## Real Q-bank — genuine click

A live 20-question Mega session (`mgStart(true)` → Quick Exam, timed/blind). Two questions were
finalised (`jbc7ve`, `3khk1z`), both emitted, both persisted. Session ended early via
`qbEndEarly()`.

```
question_answered / qbank / correct:true / skill:diagnosis  / target_id:null
question_answered / qbank / correct:true / skill:next_step  / target_id:null
```

## THREE FINDINGS FROM THE CLICK-THROUGH

**1. `target_id` is almost never present in production. This is the important one.**

```
questions in this account's _qmeta : 72
of those carrying a target_id      : 2      (2.8%)
example that does have one         : BRONCH-NEXT-004
```

The ledger is therefore recording `target_id: null` for roughly 97% of question events today.
This is consistent with the audit's note that server-side target annotation is env-gated
(`MEDBANK_TARGETS` = off | shadow) — but its consequence is much bigger than a null column:

> **Roadmap items 05 (target edges), 06 (targets → notes), 07 (unified memory) and 08 (learner
> model) all assume the concept identity flows through to student events. Today it does not.**

The event rail is correct and will carry `target_id` the moment questions carry one. But
turning on target stamping is now a prerequisite for the personalisation half of the roadmap,
and it is not currently on the list.

**2. `topic_id` is null in Q-bank event metadata.**
The call site reads `_it.topicId`, which is undefined for Mega items (they carry topic
association differently). Cosmetic — `object_id` (the qh) still identifies the question — but
the metadata is less useful than intended and should be fixed before the flag goes on.

**3. `response_ms` was identical (16448) for both Q-bank events.**
`_r.ms` appears to be a session-level rather than per-question measure on this path. Also
cosmetic, also worth fixing before enabling, since response time is a real signal for the
learner model later.

## One behaviour worth knowing, not a bug

An explicit `MB_EVENTS.flush()` called while a debounced flush is already in flight returns
immediately (the `_flushing` guard) and reports `sent: 0`. The queue drains on the next tick.
Correct behaviour — it prevents double-sending — but it means `flush()` is not a synchronous
"send everything now" and should not be treated as one in tests.

## State left behind

- 3 rows tagged `metadata.verification = 'build01-clickthrough'` (1 flashcard, 2 qbank), plus
  the 5 earlier `surface = 'verification'` rows.
- One real SRS change: card `c78ecd9e…|r|8lvxrc` advanced box 0 → 1. Reversible via the topic's
  "Reset progress" if you want it back.
- Two Q-bank questions have schedule records they did not have before.
- Flag returned to false in the live session; `config.js` still ships false.

## Verdict

The rail works end to end on the deployed build, under real auth, through real user clicks,
without touching the schedulers. **It is ready to enable — but findings 2 and 3 are worth a
small follow-up patch first, and finding 1 is a roadmap question, not a code question.**

---

# PATCH RE-CHECK — v225, deployed, 8 Sep 2026

Live before testing: `sw.js` = `medbank-v225`, guard `_r.i === QB.i` present in the served
`app.html`, writer at `?v=20260908b`.

## Correction to the earlier diagnosis

The report above blamed `response_ms` on "session-level timing". **That was wrong.**
`qbRecord` (`app.html:3205`) already computes it per question as `Date.now() - QB.qStart`, and
`QB.qStart` resets on every advance (`:3399`, `:3403`). The timing was correct all along.

The real defect was **result/item misalignment in the build-01 call site**. `qbNext()` also runs
when the current question was NOT answered — a skip, an auto-advance, the exam timer. In that
case `QB.results[length-1]` is still the PREVIOUS question's result while `QB.items[QB.i]` has
already moved on, so the event paired the next question's identity with the previous question's
result — wrong `object_id`, wrong `correct`, duplicated `ms`.

That is worse than weak metadata: unfixed, the permanent ledger would have recorded confident
wrong answers for questions the student never answered.

Fix: emit only when the result belongs to the question on screen.

```js
if (window.MB_EVENTS && _r.i === QB.i) MB_EVENTS.emit({ ... })
```

`topic_id` now reads `_it._topicId || QB.topicId` — the same expression `qbRecord` uses for its
own attempt log, so the ledger and the attempt store agree by construction. `level` now uses
`qbCogOf(_it)`; `kind` (quick_exam / smart_drill / concept_retest…) added.

**NOT FIXED, flagged only:** the pre-existing `ivEmit` on the line above has the same
misalignment and has been mispairing `intervention_events` rows since V1.6. Left untouched — it
is telemetry-only rather than the permanent ledger, and it is a separate decision.

## Re-run: answer / skip / answer, on the deployed build

Live 20-question Quick Exam. Q1 answered, **Q2 advanced without answering**, Q3 answered.

```
QB.results : [ {i:0, ok:true, ms:61258}, {i:2, ok:true, ms:75022} ]     ← index 1 absent
events     : 2                                                          ← not 3
```

The skipped question produced **no event at all**. Before the patch it would have produced a
phantom row carrying Q2's id and Q1's result.

## Persisted rows — old and new, side by side in the ledger

```
obj       ok    ms      topic_id                                kind        tag
i2aeao    true  75022   5d8cf4d8-c86b-4703-988e-284b7fbcb4f0    quick_exam  build01-patch-recheck
104xbbk   true  61258   fc0a940d-b84e-45e4-81e9-339f52546ca4    quick_exam  build01-patch-recheck
3khk1z    true  16448   null                                    -           build01-clickthrough
jbc7ve    true  16448   null                                    -           build01-clickthrough
```

The two older rows show the defect (null topic, identical ms); the two new rows show it fixed
(real topic UUIDs, distinct per-question times). The ledger's own immutability is what let us
compare them.

## Still true after the patch

`target_id` is `null` on both new Q-bank rows. Nothing about this patch changes that — it is the
identity-propagation problem, and it is the subject of the next report.

## State

- 2 rows tagged `build01-patch-recheck`; Q-bank session ended via `qbEndEarly()`.
- Flag returned to false in the live session. `config.js` still ships `LEARNING_EVENTS: false`.
- **The flag has NOT been enabled.** Awaiting the Target Identity Audit.
