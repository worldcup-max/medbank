
---

## 2026-09-10 · `engine__per-view-t` — SET_STAGE, a process scene that can walk its own stages

Build run, fired 13:15Z. Claimed at 13:17:26Z, built at the timestamp in the queue. Repo reachable
(`viz-training/BUILD-QUEUE.json` stat'd first, as the task prompt now demands).

`--next` offered `engine__per-view-t` as the first todo; no item was `changes-requested` and none was
`building`. **The item's own `why` says "Do it AFTER cardiac-looping is wired and reviewed", and
cardiac-looping is `built`, not `done`.** I took it anyway, and the reason is worth stating rather than
buried: the precondition exists so that a real consumer can show what the op needs instead of guessing,
and that half is satisfied — the scene is wired and I read it. The unsatisfied half is "reviewed", and
the review chain has been broken for two items already (below). Blocking on it would have parked a third
item behind a link nobody has fixed. **If review thinks the precondition meant the whole thing, that is a
fair finding against this item.**

### What it is

A view can now say which point in a process it is about:

```json
{ "title": "Movement one — the bulbus swings right",
  "ops": [ { "op": "SET_STAGE", "t": 0.65 }, { "op": "SHOW_STRUCTURE", "target": "*" } ] }
```

and the player rebuilds every structure that has not pinned its own `t`. One rule decides which:

- a ref that WRITES a t — `"cardiac-looping#ventricle@1"` — is **pinned** and never follows a view;
- a ref with no `@t` **follows the view**;
- a view with no `SET_STAGE` is at **t = 1**, which is exactly what a bare ref has always meant.

That third rule is what makes this safe for the 142 scenes already written: with no `SET_STAGE`
anywhere, nothing moves, and `validate-scenes.mjs` still passes 142/142 on the real corpus.

It is deliberately **not sticky**. A view that rendered differently depending on which chip the student
pressed before it is not a view — RENDER-STANDARD §3.

### Decisions a reviewer should push on if they disagree

1. **The ref decides what moves, not the op.** The alternative was a `targets[]` on `SET_STAGE`. The ref
   won because view 7 of cardiac-looping compares the finished D-loop against the finished mirror loop,
   and a stage op that dragged those to 0.65 would quietly stop the comparison being true. An author who
   wrote a `t` meant it.
2. **One spelling, `SET_STAGE`, and no `t:` property on the view.** A bare property would be invisible to
   the capability table and to the validator — a bodyparts3d scene could carry one and nobody would ever
   say that a scanned scapula has no stages.
3. **The adapter exposes `stageable(s)` / `atStage(s, t)`; the dispatcher never parses a ref string.**
   An adapter without the pair reports nothing stageable and `SET_STAGE` changes nothing rather than
   throwing. Ref syntax is delivery mechanics and belongs below that boundary.
4. **Only structures that ARRIVED are restaged.** A part that is `missing` or `failed` stays that way, so
   "Loaded 41 of 44" keeps meaning what it says. Cost: a part that exists at one t and not at another
   will not appear when the scene walks onto it. No such part exists in cardiac-looping. **Listed in
   `built_notes` as a deliberate omission.**

### The bug this turned up, which is bigger than the item

`fit()` measured a **world** bounding box with `Box3.setFromObject(holder)` and subtracted its centre
from each child's **local** position. Two different spaces. They agree only while `holder.rotation` is
identity — which is true for the one call the function was written for, because `mount()` fits *before*
it applies `initialYaw`. It is not true for any call added since: a straggler landing, a retry, and now a
stage change all run after the yaw is on and after the opening spin has moved it.

Two visible consequences, both of which were already live before this item:

- **The model slides sideways.** Revisiting one view put it somewhere else. Rotation about y leaves y
  alone and mixes x and z, and that is exactly the signature it left: same height, different place.
- **The subject is made too small.** On the arm-shaped fixture, a yawed re-fit produced scale 0.009521
  where the correct answer is 0.007807 — the model normalised to the diagonal of its rotated box rather
  than to itself. RENDER-STANDARD's first standing rule failing in the player, for a second reason and
  in every scene, procedural or BodyParts3D.

Fixed by zeroing the holder's rotation for the measurement and restoring it after.

**Why no test caught it, which is the part worth keeping:** `test-fit-idempotent.mjs` fits, fits again,
and checks the two agree — but it only ever fits a holder whose rotation is identity, the one state
nobody was worried about. Green on a substrate that resembled the real one. I added three cases to that
file: fit twice at a yaw, fit at a yaw versus unrotated, and fit at two different yaws. **They fail on
the old `viz3d.js` and pass on the new one** — both runs are in this session, not inferred.

### What I PROVED

Everything below was run, not reasoned about. `node viz-training/tools/test-per-view-t.mjs` — **72
checks, 0 failures** — in the real player via `MB3D.mountScene()`, against the real procedural adapter
and the real `cardiac-looping.js`, driving the view chips a student clicks.

- **It resolves through the real adapter.** All 7 fixture refs come back with geometry (21 216 – 33 864
  vertices). This is check 5 of the task prompt, and it is the only one that proves a student sees it.
- **The geometry genuinely changes.** Every chamber differs between t = 0, 0.65 and 1 — compared by
  vertex count, local bounding box, and summed positions AND normals, read out of the live scene. A test
  asserting a flag would have passed on a build that rebuilt nothing.
- **A pinned ref does not move** at t = 0, 0.65 or 1 — and it is pinned to something real, because at
  t = 0 it differs from the ventricle that follows the view.
- **No `SET_STAGE` renders t = 1**, for all five chambers.
- **A restaged mesh is bit-identical, positions and normals, to the same part loaded fresh at that t.**
- **Flags survive**: `#ventricle+mirror` is still on the opposite side of the midline at 0.65 and 1, and
  still follows the stage. At t = 0 it is near-coincident with the original — a straight tube has no
  handedness, so asserting a side there would have been asserting a falsehood.
- **Parts stay clickable**: every mesh still carries the original structure object, not the adapter's
  shallow copy, after several restages. This one was found by writing the check, not by predicting it.
- **Revisiting a view is identical** — geometry *and* placement (scale and position). The placement half
  is what caught the `fit()` bug.
- **Eight chips 60 ms apart settle** on what the last one asked for; losing rebuilds dispose what they
  built instead of leaving it on the GPU.
- **Console clean, loop alive, 107 frames drawn, no loop error.** The page is *served* rather than set
  with `page.setContent()`, because setContent injects scripts through `document.write` and chromium logs
  a parser-blocking warning for each — six lines that a "console is clean" check would have to filter,
  and a filter is how a real warning gets thrown away.
- **No regression** on the real corpus scene: `test-view-framing-player.mjs` run on old and new
  `viz3d.js` in this session — 44 meshes loaded, 0 without geometry, isolate moves in, trace flies stop
  by stop, 11 hammered chips settle exactly where the calm approach settles, console empty in both.
- `lint-viz3d.mjs` with the repo's real eslint on the Windows machine: **every name resolves.**
- `validate-scenes.mjs`: **142/142 valid** with the new op in the table.
- The validator's new checks were **negative-tested** on four fixture scenes in a scratch tree: bad `t`
  type → error; `t = 3` → error; `SET_STAGE` where every ref is pinned → warning, not error; one
  unpinned ref → clean.

### Normals — the number, and what it actually means

The whole-part centroid probe reads **~51 % outward** on every chamber. That is not a winding bug, and
here is why, checked rather than assumed:

- It is **identical** with my change, without it, and on the model's group built directly with no player
  and no adapter involved. Nothing about `SET_STAGE` moves it.
- A chamber is a **hollow wall**. `geometry.userData.hullCount` says 10 404 of 21 216 vertices for the
  sinus — 49 %. The rest is the inner lumen surface, whose normals point inward on purpose. A centroid
  probe over the whole part therefore reads ~50 % **by construction**, on a correct model and an
  inverted one alike. It is the "tube read at its own centreline" case the task prompt warns about, and
  it is a probe that cannot answer the question.

So the test probes the two things that can be wrong, and both are green at t = 0, 0.65 and 1:

- **hullOut** — outwardness over the outer surface only, the half `VizKit.outlineOf` inflates:
  **96.5 – 100 %** on all five chambers.
- **wind** — do face normals implied by the vertex ORDER agree with the supplied vertex normals? That is
  the invariant `emitter().quad()` exists to keep, it is what the inverted-hull silhouette depends on,
  and unlike any centroid test it is independent of shape: **98.8 – 99.4 %**.

Full per-part figures at every t in `viz-training/models-out/_per-view-t/normals.json`.

### What I did NOT do

- **I did not re-author `cardiac-looping.json` to use the op.** That scene declares the ventricle three
  times and carries 44 structures for about fifteen distinct organs; collapsing it is exactly what this
  op is for, but it is a content change to a scene sitting at `built` awaiting review, and it is its own
  item. **So the op is proven but has no consumer in the corpus yet.** Recommend a queue item:
  *"re-author cardiac-looping onto SET_STAGE"*, after that scene's review lands.
- The fixture is therefore that scene re-authored the new way, in memory. Nothing was written to
  `scenes/`. Driving the live scene would have proved nothing: every ref in it is pinned, so `SET_STAGE`
  correctly moves nothing and the file would have gone green against an engine that does not work.
- **Not exercised with `SET_STAGE`:** `TRACE_STRUCTURE` (a traced view skips the framing pass, and the
  interaction of a trace with a mid-flight rebuild is untested), `CROSS_SECTION`, `PEEL_LAYER`,
  `ISOLATE_REGION`. Reachable, unproven.
- **Not measured:** GPU memory across many stage changes. Losing rebuilds and replaced meshes are
  disposed, and I read the code path, but I did not watch the number.
- I did not touch `app.html`, `sync.js`, `sw.js`, the frozen engine, or `viz-training/spike/`. No commit,
  no push, no deploy.

### Two things I found that are NOT this item

1. **`test-view-framing-player.mjs` reports `showAll.pulledBack: false`** — on the old `viz3d.js` as well
   as the new one, so it is not a regression from anything I did. The file's own header says "Show all"
   pulls back out" is one of the things it checks, but the tool prints raw JSON with no pass/fail line,
   so a false there is invisible unless someone reads the object. **A check nobody can fail is not a
   check.** Belongs with `engine__refit-camera-on-isolate`, which is `built` and unreviewed. I have not
   diagnosed it.
2. **`model3d-scene-spec-v2.md` said "Ten ops" and listed nine** — `PEEL_LAYER` was in the validator and
   in the player but never in the table. I added it alongside `SET_STAGE` and corrected the count to
   eleven, with a dated note saying so.

And the correction from the last run's log that I re-checked and can confirm: the queue tool is at
`viz-training/tools/queue-set.mjs`, not `tools/queue-set.mjs` as §1 of `BUILD-TASK-PROMPT.md` still says.
It still fails with MODULE_NOT_FOUND from the repo root. **Two build runs have now hit it. It is a
one-line edit to the standing instructions and it is still Frank's to make.**

### Files

- `viz3d.js` — `SET_STAGE` in the dispatcher, `restage()`, `stageable`/`atStage` on the procedural
  adapter, `tPinned` on the ref parser, the `fit()` rotation fix.
- `viz-training/tools/test-per-view-t.mjs` — new; the 72 checks above.
- `viz-training/tools/test-fit-idempotent.mjs` — three yaw cases added; they fail on the old file.
- `viz-training/tools/validate-scenes.mjs` — `SET_STAGE` in `OPS`, in the procedural capability set, plus
  the range and all-pinned checks.
- `viz-training/model3d-scene-spec-v2.md` — the op table, and a section on the pinning rule.
- `viz-training/models-out/_per-view-t/` — five stage screenshots, the chip-mash shot, `normals.json`.

