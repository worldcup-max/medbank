# MedBank — Context Audit

**Read-only audit of the working tree, 8 September 2026.**
Read from the code, not from the roadmap docs. No files were modified.
Every claim is cited to file and line. Where the code could not settle a question, it says so rather than guessing.

**Headline:** the learning loop is far more built than the master timeline assumes — the gap loop, target-level scheduling and the post-session fix queue are live in production today. What is missing is not intelligence. It is **durable data**, a **curriculum graph**, and the **note as a place to read**.

---

## §1 — Status board

Against the ten branches of the product tree.

### WORKS

**Assessment engine — generation, validation, dedup**
The full miner → 4 reviewers → redundancy gate → human approval pipeline runs. Real funnel measured: 100 sources → 56 integrated → 41 reviewable → 28 novel → 27 approved (27% yield).
Important: it is **not** in `backend/`. It lives in `import-server/server.mjs` (2,756 lines) plus `integrated.mjs` (342), `targets.mjs` (310), `retestpool.mjs` (96). The SQL in `backend/` is explicitly marked `DEPRECATED — do not run`.
- Generation: `server.mjs:328` (prompt), `buildQbankBatched()` `server.mjs:378/498`
- Deterministic validate + clean + dedupe: `server.mjs:408`, yield logged at `:495`
- Miner → reviewers → gate: `integrated.mjs:294 runCandidate()`; R1 adversarial/dependency `:10`, R2 clinical `:34`, R3 SBA `:47`, R4 deterministic redundancy `:95`, verdict `:117`
- Readiness gate: `integrated.mjs:177` — ≥100 approved, ≥8 families, ≥10/family, ≤30% share, ≥3/pair

**Knowledge targets — the concept identity layer**
Already built and shipped. `knowledge_targets` (canonical_statement, tests, excludes, misconceptions, status/merged_into) and `question_targets` (map_state MATCH|NEW|AMBIGUOUS, sticky human authority via `mapping_source`/`mapping_status`).
- Schema: `import-server/sql/knowledge_targets.sql:6` and `:30`
- Logic: `targets.mjs` — `mintTargetId` `:29`, `retrieveCandidates` `:144`, `decide` `:179`
- Propagated to the client via `stampTargetIds()` `server.mjs:607`
- Client scheduling already keys on it: `qbRetentionKey` `app.html:3252` uses `t:<target_id>` when known, else `q:<qh>`; `qbQuestionsForTarget` `app.html:3294` serves a **different** question for the same target at retest
- Caveat: server-side annotation is env-gated (`MEDBANK_TARGETS`, off | shadow) at `server.mjs:1322` — whether it is on in production cannot be told from the repo

**The wrong-answer loop — in the Q-bank**
Live, flags on. This is Phase 4 of the master timeline, already shipped.
- Miss → `gapEligible()` `app.html:4172` → "❌ Not quite — this looks like a knowledge gap." / "Learn this" (`gapOfferHtml` `:4181`)
- `gapStart` `:4186` builds learn → practice → result (`gapBodyHtml` `:4243`): objective text, "📄 Open the note", one **sibling question on the same target_id**, then result
- Retest is delegated to the A6 target scheduler via `qbSchedApply`
- Practice answers are deliberately excluded from diagnostics (`gapLogAttempt` `:4228`)
- Post-session fix queue: `fixQueueHtml` `:3560`, ranked `severity·0.5 + confidence·0.3 + recurrence·0.2` (`:3512`), routed by `fixQAction` `:3554`
- Flags in `config.js:57`: `GAP_LOOP:true, POST_SESSION_FIX_QUEUE:true, TOPIC_PREVIEW:true, MODEL3D:true, A7:true, V16_TELEMETRY:true, FRAGILE:true, MISCONCEPTION:false`

### PARTIAL

**Memory engine**
Two separate schedulers, both custom ladders, **neither is SM-2**.
- Flashcards: `rateSRS(id, ok)` `app.html:1478`, ladder `[1,3,7,7,7,14,14]` `:1235`. Per card: `{box, due, seen, lapses, ms}`. A legacy `ease:2.5` field is written once at `:1928` and **never read or updated**.
- Q-bank: `qbSchedApply(qh, ok, conf)` `:3263`, ladder `[1,3,7,14]` `:3240`, graduation past 14 days. Wrong → reset; correct-but-unsure → hold; secure correct → advance.
- **They do not know about each other.** The same concept can be strong in one and forgotten in the other.

**Home / front door**
`pageHome()` `app.html:2293-2367`, default route at `:7593`. Top to bottom: hero session card → 4 stat tiles (Today / Streak / Weakest / Freezes) → `commitmentCard()` `:1454` (incl. "🧠 N Q-bank concepts due for retest") → weakest-area banner "Fix these →" → "Review weak cards" + "Custom session" → daily goal → exam chips → "Continue studying" shelf → per-subject progress.
Against the Phase 1 spec:
- Continue studying: **exists but is not reading resume.** `topicResume()` `:2259` restores a **card index in a deck** (`DATA.pos`), never a position in a note. No note scroll position exists anywhere.
- Reviews due today: **exists** (hero + commitment card + `#/today` `pageToday` `:5955`)
- Test yourself: **does not exist on Home.** Mega Q-bank is nav-only. Nearest is "Custom session" `:2341`.
- Recommended next from a weakness signal: **exists** — `weekStats().weak` → `reviewWeak()` `:2331,2336`

**Visual / 3D learning**
143 scenes in `viz-training/scenes/`, player live (`viz3d.js`, `MODEL3D:true`). But only **18 anchors signed off against 212 still `needs-review`** — the content is ~8% verified, the renderer 100% built.

### FRAGILE

**Learning data — the foundation everything else needs**
There is **no server-side attempt table.** Every answer a student has ever given lives in one client-owned JSON blob, ring-buffered.
- `profile_state.state`, read `sync.js:181`, upsert `:196`, keyed by `level_profile_id`
- `s._attempts.push({u, qh, topicId, chosen, answer, ok, ms, mode, ts})` `app.html:3207` — **capped and truncated at 4000** `:3208`
- `s._events` via `smartLog()` `:3939` — **capped at 1000**
- `s._qmeta[qh]` question snapshots `:3206`
- Comment at `:3965`: "Telemetry needs no separate transport: `_events` live in DATA and already sync to `profile_state`."
- The only server-side append-only table is `intervention_events`, and its own header says: "APPEND-ONLY. Records what happened; it does NOT decide anything. **Nothing in the learning path reads this table**" (`sql/intervention_events.sql:2-4`)

### NOT BUILT

**Curriculum graph** — no prerequisite relationships, no concept-to-concept edges, no cross-department linking. Knowledge targets are a flat set of identities, not a graph. Topic pages have **no "related topics" block at all**.

**Medical Inbox** — zero matches for inbox / capture / screenshot / whatsapp / clipboard across `app.html`, `import-tab.js`, `lecture-record.js`, `study-dock.js`. What exists is a one-shot lecture **build** sheet: `MB_openImport()` `import-tab.js:71`, four modes (`:166`) — File (`accept=".pdf,image/*"`, `:124`), YouTube, Paste (min 40 chars, `:277`), Record. Everything is base64'd into one POST to `IMPORT_API + "/import"` (`:287-317`) and comes back as a built topic. **Nothing is ever held as an unprocessed item** — abandon an import and nothing remains.

**Learner model · Educator platform** — correctly not started. `smartDiagnose` `app.html:3918` classifies a single target as gap / fragile / misconception, which is a diagnosis, not a model of a student.

### Question inventory

There is **no question JSON in the repo**. The canonical bank is a Supabase JSONB column, `topics.extras.qbank` (`server.mjs:2468, 2605, 617`). Counts, from docs rather than a live DB read:
- Inventory probe: 127 questions across 13 topics (`MEGA-QBANK-MASTER-ROADMAP.md:69`)
- `SEED-MANIFEST.md` (2026-09-08): +131 QBank cards across 15 new Integrated Source Pool lectures
- `integrated_items` approved: 47 → **54** (`PRODUCTION-REVIEW-LOG.md`, batch 2026-08-30), against a gate of 100

### Tables that exist

In repo SQL: `knowledge_targets`, `question_targets`, `retest_pool`, `integrated_items`, `intervention_events`, `viz_events`, `viz_expansion_log`, `viz_asset_proposals`.
Referenced in code but schema **not in the repo** (lives only in the deployed Supabase project): `topics` (holds `extras.qbank`), `cards`, `courses`, `accounts`, `level_profiles`, `profile_state`, `subscriptions`, `imports`, `prompt_templates`, `visualizations`, `podcasts`, `pronunciations`, `signup_signals`, `app_config`.

---

## §2 — Three findings that change the build order

### Finding 1 — the floor is missing, not the ceiling

**Every learning signal is in a capped client blob.**

Phase D of the master timeline says "start collecting the signals needed for intelligence." The truthful version is stronger: **the signals are being collected and then thrown away.** A student who answers 4,001 questions loses the first one permanently, and it was never on the server to begin with.

This makes Phases 6 (Memory Engine) and 7 (Learner Model) impossible on the current foundation — and the failure is silent. Nothing breaks. The history just quietly shortens.

*Cited:* `app.html:3207-3208`, `sync.js:181,196`, `sql/intervention_events.sql:2-4`

### Finding 2 — half a spine already exists

**Targets exist; the graph does not.**

Knowledge targets are real, shipped, and already drive retest scheduling. What is missing is the second half: targets have **identity** but no **relationships**. Nothing in the system says filtration comes before sodium handling — so "you understand X but keep missing Y" cannot be computed however good the diagnosis becomes.

The cheaper move is therefore not to build a spine. It is to **add edges to the one that exists**, and to extend targets beyond the Q-bank into notes and flashcards.

*Cited:* `import-server/sql/knowledge_targets.sql`, `targets.mjs`, `app.html:3252,3294`

### Finding 3 — the loop is complete on one surface only

**Get a question wrong and MedBank teaches you. Get a flashcard wrong and it shrugs.**

The Q-bank miss path is everything Phase 4 asks for. The flashcard miss path is three lines: box to −1, due tomorrow, star it. No diagnosis, no concept identification, no explanation, no different-question retest.

Same student, same forgotten idea, two completely different qualities of response depending on which surface they happened to be on.

Notes are the third surface and have no recall integration at all — no explain-deeper control, no related topics, and the "Simplified" tab is a **pre-authored field** (`t.simplified`, `app.html:2770`), not something the student can ask for on demand.

*Cited:* `app.html:6349-6377` (flashcard miss) versus `app.html:4172-4243` (question miss)

---

## §3 — Recommended build order

Each step is chosen so that the step beneath it is already stable — the master doc's own rule.

**1. Ship the attempt table.**
One append-only `learning_events` row per answer, review and read, carrying `target_id`. Write to it alongside the existing blob — nothing breaks, nothing changes on screen, and every later phase becomes possible. Until this exists, Phases 6 and 7 are building on sand.

**2. Level the flashcard miss up to match the Q-bank miss.**
Highest ratio of student-felt improvement to work in the whole list, because the machinery already exists — it simply is not wired to that surface. This is Phase B's "one excellent complete loop", finished rather than started.

**3. Put "test yourself" and a real resume on the home screen.**
Phase 1's success condition fails on two of its five blocks today. Small, visible, and it stops the front door contradicting the product.

**4. Add prerequisite edges between targets.**
Not a new system — a relationship table on the identities that already exist, plus a "related concepts" block on the note page so the graph is visible to the student the day it exists.

**5. Unify the two schedulers on the target.**
Cards and questions about the same concept should share one memory estimate. Only sensible once steps 1 and 4 are in, which is why it is not first.

**6. Then, and only then, the learner model — and the Inbox.**
Both need real event history. The Inbox is the most habit-forming item on the list and the most tempting to start early; it should wait until there is a concept graph to attach captured material to, or it becomes a folder of orphans.

---

## §4 — Do not build yet

- **Learner model** — no durable event history to learn from. Building it now means guessing, which the master doc explicitly forbids.
- **More questions** — 54 approved integrated items against a gate of 100. The pipeline works; it needs running, not rebuilding.
- **More 3D scenes** — 212 anchors unverified. Verification is the bottleneck, not coverage.
- **Educator / tutor mode** — correctly last. It sits on the student product, and the student product still drops data.
- **Turning on `MISCONCEPTION`** — the flag is off deliberately. Leave it until the gap loop has measured evidence behind it.

---

## §5 — Known limits of this audit

- Counts of questions and approved integrated items come from the repo's own docs, not from a live database query. No DB was queried.
- The core app schema (`topics`, `cards`, `accounts`, `profile_state`, …) is not in the repo, so those tables were reconstructed from `.from("…")` calls in `server.mjs` and `sync.js`.
- Whether server-side target annotation is enabled in production depends on the `MEDBANK_TARGETS` environment variable, which is not visible in the repo.
- "Exact-duplicate rejection" is reported in `PRODUCTION-RUN-1.md` (9 exact dups), but no distinct exact-dup function was located beyond the diversity/source-budget path.
