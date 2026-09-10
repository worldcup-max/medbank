# MedBank · model3d BUILD task — standing instructions

You are one run of a recurring task. You have no memory of any previous run. Everything you need is
in this repository. **Read this file to the end before you touch anything.**

Your job: take **one** item from `viz-training/BUILD-QUEUE.json`, build it properly, prove it renders,
and hand it to the review task. One item. Not two.

---

## 0 · Before anything else

Read, in this order:

1. `viz-training/RENDER-STANDARD.md` — the four rendering bugs and the rules that prevent them. This
   is not optional background. Three of the four were invisible for weeks and were degrading every
   model in the corpus at once.
2. `viz-training/ARTWORK-STANDARD.md` — the two-review rule and why the builder never reviews.
3. `models3d/render-kit.js` — the machinery you must build on.
4. `models3d/cardiac-looping.js` — the reference model. It is what "good" looks like here.

## 1 · Pick the item

Open `viz-training/BUILD-QUEUE.json`.

**NEVER EDIT `BUILD-QUEUE.json` BY HAND.** Every write goes through `tools/queue-set.mjs`, which takes
a lock, re-reads the file, changes only your fields and renames the result into place. You and the
review task can be alive at the same time, and two hand-edits of the same JSON silently erase one
another — the file stays valid, the run reports success, and a review's findings just vanish. Proven:
eight concurrent writers through the tool kept all eight changes.

```
node tools/queue-set.mjs --next                          # what to take, rework-first, with its findings
node tools/queue-set.mjs <item> --status building --set claimed_at=<utc>
node tools/queue-set.mjs <item> --status built --set built_at=<utc> --append built_notes="…"
```

- `--next` tells you what to take and why. It puts any **`changes-requested`** item ahead of every
  `todo` one — rework beats new work, always — and hands you its `findings`. Fix **every** one.
- Never take an item marked `escalated`. That one is waiting on a human.
- Claim it **before** you start: `--status building --set claimed_at=<utc>`, so an overlapping run can
  see it is taken. If you find an item already `building` with a `claimed_at` older than two hours,
  that run died; reclaim it.

If every item is `done` or `escalated`, do not invent work. Write that in the log, fire the review
task, and stop. A run with nothing to build is a complete run, not a failed one.

## 2 · Build it

**WHERE THINGS LIVE.** `models3d/` at the repo root is the LIVE home — it is what the player loads,
via `MEDBANK_CONFIG.MODEL_BASE`. `viz-training/spike/` is a frozen reference and is loaded by nothing;
never write there. An earlier revision of this file said `viz-training/models/`, which no code reads.
If you had followed it your model would have rendered nowhere and every check would still have passed.

**Everything geometric comes from `render-kit.js`.** Winding through `emitter().quad()`, colour
through `C()`, silhouettes through `outlineOf`/`outlineMaterial`, framing through `fitCamera`. A model
that reimplements any of those locally is a bug, not a style choice — RENDER-STANDARD §6.

Write the model to **`models3d/<short-name>.js`** — the short name is the last segment of the item id
(`cardiac-looping`, `lateral-folding`), because that is what a scene's ref says. It must register:

**Wrap the whole model in an IIFE.** Only the registration escapes. At top level your `const T`,
`const K`, `LAYERS` and every constant become globals, and the NEXT model to load dies on
`SyntaxError: Identifier 'T' has already been declared`, taking the page with it. One model works fine
that way, which is why this is a rule rather than something you would notice.

```js
(function () {
  const T = window.THREE, K = window.VizKit;
  // … the whole model …

window.MB3D_MODELS = window.MB3D_MODELS || {};
window.MB3D_MODELS['<short-name>'] = {
  LAYERS: LAYERS,              // key -> {color, name}
  build: build<Thing>,         // (t, opts) -> THREE.Group, meshes carrying userData.key
  FULL: { ...everyOptionalLayerOn }   // so a part behind a flag is still resolvable
};
})();
```

`FULL` is not optional bookkeeping. Without it the provider builds only the default layers, and any
structure behind an option flag comes back as `reason:'none'` — which the player shows a student as
"there is no model of this structure", a confident lie about a model sitting right there.

**Then wire the scene.** A model nobody can reach is not a finished item: set each `structures[]` entry's
`refs.procedural` to `"<short-name>#<partKey>"`, set `provider.primary` to `"procedural"`, and check every
key in the scene against the keys the model actually builds. Anything the scene names that the model does
not build goes in `gaps[]` with the reason — never left to fail silently at runtime.

Hold to these, from RENDER-STANDARD §3:

- **Prefer a solved parameter to a tuned one.** The looping model does not carry a hand-tuned bend
  amplitude; it carries the physical constraint and solves for the amplitude at every `t`. A tuned
  constant drifts out of agreement with the anatomy the moment anything else changes.
- **The subject fills the frame at every `t`,** not only the one you looked at.
- **Segment boundaries belong at the real landmarks** — the sulci, the constrictions, the named
  junctions. Anatomically right, and it puts the joins where the geometry is least likely to fight.
- **A membrane tapers** to nothing where it meets what it suspends.
- If the item's `shape` is `process` or `series`, it must be **one continuous function of `t`**. Seven
  stages are seven samples of one function, so they cannot drift out of agreement with each other.

**NO MESH MEANS BUILD IT.** If the scene's structures carry no `refs.bodyparts3d`, do not leave the item
waiting for a mesh — there isn't one coming, and a scene that waits forever teaches nobody. This was
checked before it became a rule: the four cerebellum and brainstem scenes parked as "needs a mesh"
carry **zero** mesh refs between them across 35 structures. There was nothing to wait for.

**But that rule is "build it", not "fake it".** If the honest answer is that this structure should not
be procedural — irregular organic form, the kind a student is examined on recognising *exactly* — say
so and stop. That is a correct outcome, not a failure.

Set the item to `escalated`, and because an escalation must reach a person rather than sit in a JSON
field: append a full entry to `viz-training/ESCALATIONS.md` in the format that file specifies, and make
the **first line of your reply** start `ESCALATED:` — the reply is what reaches Frank's phone.

## 3 · Prove it before you claim it

Do not mark anything built on the strength of having written it. Run all four:

1. **It renders.** Headless chromium, several values of `t`, screenshots written to
   `viz-training/models-out/<short-name>/`. Look at them.
2. **The console is clean.** No errors, no warnings, no throws.
3. **Normals point outward.** Build the group, and for each mesh count vertex normals pointing away
   from that mesh's centroid. A closed solid should be strongly majority-outward. A tube read at its
   own centreline will not be — understand which you have before you accept a low number. This probe
   is what caught the winding bug; it is cheap and it is not negotiable.
4. **It looks like the thing.** Open the render and ask whether a student would recognise it.

**TEST ON THE SUBSTRATE, NOT ON SOMETHING THAT RESEMBLES IT.** The queue lock tool passed a race test
with eight concurrent writers — in a container where deleting files works. This repo is reached through
a mount that FORBIDS deletion, so on the real machine the tool could not release its own lock and would
have jammed the queue permanently. A green test on the wrong substrate is worse than no test: it buys
confidence you have not earned.
5. **It resolves through the real adapter**, not just in your test harness. Load `viz3d.js` in a page and
   call `MB3D.adapters.procedural.load(THREE, {refs:{procedural:'<short-name>#<part>'}})` for EVERY part
   the scene names. Each must come back with a mesh carrying geometry. This is the only check that proves
   a student would see it; everything above only proves the geometry exists.

Then set status `built`, record `built_at`, and list in `built_notes` what you deliberately left out.

## 4 · Log, then hand over

Append to `viz-training/BUILD-LOG.md`: the item, what you did, what you proved, what you could not do.
Be specific about what you are unsure of — the review task reads this and a vague note wastes its run.

**Then fire the review task.** Use the scheduled-task tool `fire_trigger` with trigger id
`trig_01H67xqRQM5S1TeRSk6PK8N9`, passing the item id in `text`. This is the last thing you do.

If you cannot fire it, write **`REVIEW NOT FIRED`** on its own line at the end of your log entry and
say so in your reply, loudly. A silent break in the chain means work piles up unreviewed.

## 5 · Boundaries

- **Never modify the frozen Smart-Drill engine.**
- **Never touch `frankthewiz1@gmail.com`'s account data.** Test with `frankthejay@gmail.com`.
- `app.html` and `sync.js` are shared with another session — first come, first served, and only if the
  item genuinely needs them.
- Meshes stay attributed: `BodyParts3D, © DBCLS, licensed CC-BY-SA 2.1 JP.`
- If you change `sw.js`, **read its current CACHE version first** — another session moves it, and it
  has jumped several versions in a single morning.
- Do not `git commit` or `git push`, and do not deploy. Frank does those.
- Do not edit `viz-training/spike/` — those are the reference spikes.

## 6 · One thing worth more than the rest

A note in a file is a claim, not a fact — **including your own**. If the queue says a spike exists,
open it. If a note says a mesh is there, stat it. If this file's account of something and what you
find in the repo disagree, that disagreement is the finding, and it goes in the log.
