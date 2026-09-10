# Phase 02.1 — Card Identity Investigation (read-only)

Scope: the six read-only questions authorised before any 02.1 code.
Nothing was written. No migration, no scheduler change, no `cid` removal,
no `LEARNING_EVENTS` change.

---

## Headline

**There is no card rebuild path.** `cards` rows are written exactly once,
at topic creation, and are never updated, never upserted, never replaced.
The "server-side rebuild" exposure I flagged at the end of the last phase
**does not exist in the current code**. A "rebuild" in MedBank creates a
*new topic*, which is a new object by design, not a re-keying of an old one.

This changes the shape of 02.1: it is a pure delivery/adoption phase.

---

## 2 & 3 — How cards are inserted, replaced, accumulated

Repo-wide, there are exactly **two** touch points on the `cards` table:

```
content-loader.js:150    sb.from("cards").select("topic_id,deck,idx,q,payload")   READ
import-server/server.mjs:1350   admin.from("cards").insert(cards)                 WRITE
```

No `.update(`, no `.upsert(`, no `.delete(` on `cards` anywhere —
client, server, or SQL.

The single write is inside `POST /import`, immediately after a **new**
`topics` row is inserted (server.mjs:1341-1350):

```js
let topic = await admin.from("topics").insert(topicRow).select("id").single();
const topicId = topic.data.id;
...
card_key: topicId+"|p|"+hstr(c.q)      // primer
card_key: topicId+"|r|"+hstr(c.q)      // recall
const cw = await admin.from("cards").insert(cards);
```

Because `card_key` embeds the freshly-minted `topicId`, a re-import can never
collide with an existing card. It produces a disjoint set under a new topic.

The only deletion is `POST /topic/delete`, which deletes the *topic* and lets
the FK cascade take its cards. Nothing partially replaces a topic's cards.

### What "rebuild" actually means here
The word covers two different things, and only one touches cards:

| Operation | Endpoint | Touches `cards`? |
|---|---|---|
| Re-import a lecture | `POST /import` | New topic, new cards. Old ones untouched. |
| Rebuild q-bank / written extras | `POST /build-extra` with `force` | **No.** Overwrites `topics.extras[kind]`. |

`/build-extra?force` is the *question*-side churn engine — it replaces the
cached qbank array wholesale. That is the mechanism behind the 10% question
orphan rate. It has no equivalent on the flashcard side.

### Accumulation, measured

```
topics             = 383
cards              = 4814
orphan_cards       = 0      (cards whose topic_id no longer resolves)
cards_null_topic   = 0
dup_title_groups   = 6      (account+title appearing more than once)
dup_title_rows     = 13
```

So there *is* mild accumulation — 13 topic rows across 6 duplicate
title groups, i.e. ~7 re-imports of a lecture that already existed. Those are
additive: each carries its own cards and its own keys. Nothing was
overwritten; the old topic simply sits alongside the new one.

---

## 1 — Is `cards.id` stable across server rebuilds?

**Yes, trivially — because a rebuild never revisits an existing card row.**

`cards.id` is assigned once by the database at insert and there is no code
path that can change it or replace the row it belongs to. It survives
everything short of deleting the topic, which removes the card anyway.

The important caveat is the one you already drew: this is *object* stability,
not semantic continuity. A re-imported lecture yields brand-new `cards.id`s
under a new `topic_id`. `cards.id` says "this persisted card object" and
nothing more — exactly the distinction you asked to keep explicit.

Note that `cid` is stable under the same conditions, for the same reason.
Migrating from `cid` to `cards.id` therefore does **not** buy stability we
lack today. What it buys is a key that is *server-issued and opaque* rather
than *client-derived from question text* — which matters the moment we want
the server to reason about a card, or want text to be editable without the
key being a function of it.

---

## 4 — Provenance of the two orphaned SRS entries

Joined every `profile_state.state.cards` key against `cards.card_key`:

```
ck                                              card_hit  topic_hit
x                                                     0        0
ef59f781-6803-4768-b4df-97a220f68ddc|r|1kd4gum        0        1
```

**Orphan 1: `"x"`** — not a card key at all. A single-character literal.
Test or debug residue that got persisted into a profile's SRS map. It has
never corresponded to a card and never will.

**Orphan 2:** the topic `ef59f781…` is **alive**, and holds 48 cards, 39 of
them in the `recall` deck. So this is not a deleted topic and not a rebuild.
A recall card key under a live topic simply doesn't match any stored
`card_key` — meaning the hash was computed over question text that differs
from what the server stored. Five profiles carry a `cardEdits` overlay, which
is the plausible source: an SRS write that keyed off effective (post-edit)
text rather than the original.

**Neither orphan is evidence of rebuild churn.** One is junk, one is a
hashing-input mismatch. The 0.6% orphan rate is not a decay curve — it is two
unrelated one-offs.

---

## 5 — Is there metadata to match replacement cards to predecessors?

What a card row carries: `topic_id, account_id, deck, idx, q, payload, card_key, id`.

For matching a re-imported card to its predecessor, the usable signals are:

- **`deck` + `idx`** — positional. Cheap, but the AI regenerates cards in a
  different order and count each build, so position is weak evidence alone.
- **`q`** — the question text. Strong when wording is stable, useless when the
  model rephrases, which is the case that matters.
- **`topic.title` + `account_id`** — links the two topics as candidate
  predecessor/successor (this is what surfaced the 6 duplicate groups).

There is **no** stored lineage: no `replaces_id`, no `source_card_id`, no
build generation number. Nothing records that topic B is a re-import of topic A.

This means cross-rebuild continuity is not currently recoverable from
metadata — it would have to be *inferred*, i.e. the same
identity-vs-equivalence problem as knowledge targets, with the same
resolver-shaped answer. Which is an argument for your `card → learning_target`
sketch rather than for making card identity carry equivalence.

---

## 6 — Implication for the `cid → cards.id` compatibility migration

Deferred to design, but the investigation narrows it considerably:

- The mapping is **1:1 and total for live cards** — every `card_key` has
  exactly one `cards.id`, and 321/323 SRS keys resolve. The migration is a
  lookup, not an inference.
- The 2 unmatched keys need no policy: one is junk, one is an edit-hash
  mismatch that a `cardEdits`-aware second pass may or may not recover. Neither
  justifies delaying the other 321.
- Dual-key reading is cheap: `content-loader` delivers `id` alongside the
  existing fields, and the client resolves `state.cards[cards.id] ?? state.cards[cid]`.
  No hashing change, no `cid` deletion, no maturity inheritance.
- Cross-rebuild continuity is **out of scope** and should stay out — it is a
  concept-equivalence problem, not an identity-transport one.

---

## What I did not do

- No writes of any kind, to code or to the database.
- No migration of the 321 entries.
- No change to `cid`, the SRS ladder, or the scheduler.
- No design decision on what a rebuilt card *means* — that is yours.

---

## CLOSURE — 02.1 investigated, no migration warranted

Decision (Frank, on the evidence above): **close 02.1 without migrating.**

Rationale of record: there is no demonstrated production failure requiring
`cid` to be replaced. `cards.id` is the better primitive, but adopting it now
is future-proofing, not repair — and the migration would introduce risk into a
memory system that currently holds 321/323 valid entries.

Contrast with the phase that *was* justified:

| | 01.5a — question identity | 02.1 — card identity |
|---|---|---|
| Demonstrated failure | Yes — `qh` churn orphaned history | No systemic mechanism found |
| Orphan rate | 100/996 (10%) | 2/323 (0.6%), both one-offs |
| Churn engine | `/build-extra?force` rewrites extras | none — cards are append-only |
| Migration | justified, executed, proven | **not warranted** |

### Status

**02.1 — 🟡 investigated / no migration required.**

### Standing architectural direction (recorded, not implemented)

```
cards.id          ← object identity (server-issued, opaque, available, unused)
cid               ← legacy / derived compatibility identity (remains the SRS key)

Card
 ├── cards.id           ← which object this is
 └── knowledge_target   ← what it teaches
```

Object identity and semantic equivalence stay separate. Cross-import
continuity, if ever wanted, comes from **explicit lineage or target-level
continuity** — never from inferring it out of card text or overlapping titles.

### Explicitly not done, and not to be inferred later

- `cards.id` is **not** the SRS key. The scheduler and ladders are untouched.
- The ~13 duplicate-title topic rows are **not** treated as lineage.
  Duplicate titles ≠ duplicate lectures ≠ duplicate cards ≠ same content.
- The two orphaned SRS keys are a **data-hygiene** item, tracked separately.
  They are not evidence for any architectural change and must not be cited as
  such in a future phase.

### Open data-hygiene item (not actioned — needs approval to write)

Two keys in `profile_state.state.cards` reference nothing:
`x` (debug residue) and `ef59f781-6803-4768-b4df-97a220f68ddc|r|1kd4gum`
(live topic, hash computed over text that differs from what is stored).
Removing them is a write to live learner state and has not been performed.
