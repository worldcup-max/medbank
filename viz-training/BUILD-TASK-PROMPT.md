# MedBank · model3d BUILD task — standing instructions

You are one run of a recurring task. You have no memory of any previous run. Everything you need is
in this repository. **Read this file to the end before you touch anything.**

Your job: take **one** item from `viz-training/BUILD-QUEUE.json`, build it properly, prove it renders,
and hand it to the review task. One item. Not two.

---

## 0 · HOW YOU REACH THE REPO — read this first, it changed on 2026-09-13

**You have no shell on Frank's machine.** A Windows update released 2026-09-08 stopped Claude's
workspace from starting there, so `device_bash` fails with "Workspace unavailable" and every path
under `$HOME/mnt/` is unreachable. Do not try it, and do not treat its failure as your failure.

All three tasks auto-suspended with `device_absent` because of this. The review task died first, on
the evening of the 10th; the build task ran on for another eight and a half hours making work nothing
consumed, and eleven items reached `built` with nine never reviewed. That is the failure this section
exists to prevent recurring.

**What still works is FILE access, plus the shell in your own cloud container.** So the shape of a run
is: stage in, work in the cloud, commit back.

1. **Stage what you need** with `device_stage_files`, using Windows absolute paths under
   `C:\Users\domin\OneDrive\Documents\GitHub\medbank\`. They land in your container under
   `/mnt/user-data/uploads/medbank/...`. **Record the `mtimeMs` of anything you intend to write back.**
2. **Work in your own container.** It has node. Run the repo's tools there against the staged copies —
   `queue-set.mjs`, `validate-scenes.mjs` and the rest all take `--queue` or a path argument.
3. **Commit back** with `device_commit_files`, passing `expectedMtimeMs` — the value you recorded at
   step 1 — for every file.

**THE QUEUE IS WRITTEN BY COMPARE-AND-SWAP, NOT BY A LOCK.** `queue-set.mjs` still takes a lock file,
and on a staged copy that lock is worthless: two runs would each take their own uncontended lock and
the second commit would erase the first. What actually protects the queue is `expectedMtimeMs` —
`device_commit_files` REFUSES the write if the file changed since you staged it. So:

```
stage BUILD-QUEUE.json, note mtimeMs
node viz-training/tools/queue-set.mjs --queue /mnt/user-data/uploads/medbank/viz-training/BUILD-QUEUE.json <item> --status building --set claimed_at=<utc>
commit it back with expectedMtimeMs = the noted value
```

**If that commit is REFUSED, another run edited the queue while you were working. Do not force it.**
Re-stage, re-apply your change to the fresh copy, and commit again. A refusal is the system working.

**NEVER COMMIT TWICE FROM THE SAME PATH UNDER `/mnt/user-data/outputs/`. Added 2026-10-03 by the build
run on neurulation, which clobbered the queue for seventy seconds doing exactly that.** That run wrote
its claim from `outputs/BUILD-QUEUE.json`, and later wrote its `built` update over the SAME path and
committed it — and the bytes that reached Frank's machine were the EARLIER ones, erasing another run's
`built` and `building` entries. A local read of that path a second before the commit returned the NEW
content, so the staleness was in the transfer, not in the file. `expectedMtimeMs` cannot catch this: it
compares the DEVICE's file against what you staged and says nothing about whether the bytes you are
SENDING are the bytes you meant. So: **one output path per commit, a name this run has not used before,
and re-read it from that path immediately before committing.** A fresh name committed correctly on the
first try. The read-back in section 3 is what caught it — but a read-back tells you only after you have
already overwritten someone else's work, which on the queue is a race another run can lose.

**PROVE YOU CAN SEE THE REPO BEFORE ANYTHING ELSE.** Stage
`C:\Users\domin\OneDrive\Documents\GitHub\medbank\viz-training\BUILD-QUEUE.json` and read it. If that
fails, STOP and make it the first line of your reply. An earlier version of this task ran repeatedly,
reported success and touched nothing; a run that cannot reach the repo has failed and must say so
loudly.

## 0.1 · Before anything else

Read, in this order:

1. `viz-training/RENDER-STANDARD.md` — the four rendering bugs and the rules that prevent them. This
   is not optional background. Three of the four were invisible for weeks and were degrading every
   model in the corpus at once.
2. `viz-training/ARTWORK-STANDARD.md` — the two-review rule and why the builder never reviews.
3. `models3d/render-kit.js` — the machinery you must build on.
4. `models3d/cardiac-looping.js` — the reference model. It is what "good" looks like here.

## 1 · Pick the item

Open `viz-training/BUILD-QUEUE.json`.

**PATHS, CORRECTED 2026-09-10 by the round-2 build run.** Every tool lives in
**`viz-training/tools/`**, not in a repo-root `tools/`. This file used to give repo-root paths for
them, and a run that trusted it died on its first queue write — `MODULE_NOT_FOUND`, before it had
claimed anything. The `models3d/` paths in section 2 ARE repo-root-relative and are correct; it was
only the tools half that was wrong. Commands below are written to run from the repo root.

**NEVER EDIT `BUILD-QUEUE.json` BY HAND.** Every write goes through `viz-training/tools/queue-set.mjs`,
which re-reads the file, changes only your fields and renames the result into place. You and the
review task can be alive at the same time, and two hand-edits of the same JSON silently erase one
another — the file stays valid, the run reports success, and a review's findings just vanish.

The tool also takes a lock file. **That lock no longer protects anything** now that you work on a
staged copy: two runs would each take their own uncontended lock in their own container. Section 0 has
the replacement — `expectedMtimeMs` on the commit. Do not let the lock talk you out of passing it.

```
# $Q is the STAGED copy in your own container, not a path on Frank's machine:
#   Q=/mnt/user-data/uploads/medbank/viz-training/BUILD-QUEUE.json
node viz-training/tools/queue-set.mjs --queue $Q --next                    # what to take, rework-first, with its findings
node viz-training/tools/queue-set.mjs --queue $Q <item> --status building --set claimed_at=<utc>
node viz-training/tools/queue-set.mjs --queue $Q <item> --status built --set built_at=<utc> --append built_notes="…"
# then commit BUILD-QUEUE.json back with expectedMtimeMs — see section 0.
```

- `--next` tells you what to take and why. It puts any **`changes-requested`** item ahead of every
  `todo` one — rework beats new work, always — and hands you its `findings`. Fix **every** one.
- Never take an item marked `escalated`. That one is waiting on a human.
- Claim it **before** you start: `--status building --set claimed_at=<utc>`, so an overlapping run can
  see it is taken. If you find an item already `building` with a `claimed_at` older than two hours,
  that run died; reclaim it.

If every item is `done` or `escalated`, do not invent work. Write that in the log and stop — and do
NOT fire the review task, which section 4 explains. (This paragraph used to say "fire the review
task", contradicting section 4 in the same file. Corrected 2026-09-13.) A run with nothing to build is
a complete run, not a failed one.

## 1a · BACK-PRESSURE — do not outrun the reviewer

**Before you claim anything, count the items with status `built`. If there are more than THREE, stop.**
Write in the log that you stopped because the review queue is `built`×N and the reviewer is behind,
and end your run. Do not build. That is a complete run.

This rule exists because the alternative already happened. On 2026-09-10 the review task died at
18:35 and this one carried on for another eight and a half hours, producing nine more scenes that
nothing ever looked at. Eleven items sat `built`, nine of them never reviewed, and the queue was still
sitting that way three days later. A builder with no reviewer does not idle — it manufactures unread
work, and every item it adds is one more thing a human eventually has to check by hand.

Three is not a magic number; it is roughly one review cycle of slack. The point is that a growing
`built` count is a symptom, and the correct response to a symptom is to stop and say so, not to add
to it.

## 1b · Which KIND of item is it?

The queue holds two kinds and they are different jobs. `--next` tells you which.

**`kind: "model3d"` — a scene already exists, geometry is missing.** Everything in section 2 applies:
write a procedural model, wire the scene's refs to it. This is the work the queue started with.

**`kind: "scene"` — NOTHING exists.** These are the 71 curriculum structures that have never been
authored, found by `viz-training/tools/coverage.mjs` on 2026-09-10. The job is to AUTHOR the VisualScene first, and
only then build whatever it needs. Do not skip to geometry.

For a `kind: "scene"` item:

1. **Read the curriculum entry.** `CURRICULUM.json` gives the structure its `views` list — the view
   TYPES it must have (`location`, `cross_section`, `mechanism`, `vasculature`, …) — plus a `note`
   saying what the topic is actually about, and `preferred_modes`. **That `views` list is the
   contract.** A scene is not finished until it has a view of every declared type. `COVERAGE.md`
   reports exactly this, so anything you leave out will show up there by name.
2. **Decide the provider from the catalog, not from habit.** The item carries `candidate_meshes`: how
   many BodyParts3D meshes name-match this structure. Confirm it yourself against
   `available-meshes.json` — the count is a hint, not a fact, and a name match is not an anatomical
   match. Meshes exist → `bodyparts3d`. None → procedural, per NO MESH MEANS BUILD IT. A **process**
   (a cycle, a flow, a sequence) has no mesh by its nature and is procedural however rich the catalog
   looks: there is no STL of "the cardiac cycle".
3. **Author the scene** to `model3d-scene-spec-v2.md`: `structures[]` with real anatomical parts,
   `views[]` of the declared types, each a beat with `ops` and narration. Seven views per structure is
   the corpus average — that is the bar, not a ceiling.
4. **Every view must change the picture** (RENDER-STANDARD). A beat that shows the same frame as the
   one before it is text, and belongs in `deferred_beats[]`, not in `views[]`.
5. **Then build** whatever the scene needs, and prove it with section 3.
6. `status: "candidate"`, never `"ready"`. Only a review promotes a scene, and only after seeing it.

Validate with `node viz-training/tools/validate-scenes.mjs`, rebuild the index with `viz-training/tools/build-scene-index.mjs`,
and rerun `viz-training/tools/coverage.mjs` so the report reflects what you did.

**One scene, done properly, beats three sketched.** There are 71 of these; the queue is not a race.

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

**IF THE SCENE IS TIME-VARYING, CHECK ITS NARRATION AGAINST THE MODEL AT EVERY BEAT'S OWN `t`.**
`node viz-training/tools/check-beat-claims.mjs <scene>`. Every view carries its narrated claims as
`claims[]` and the tool evaluates them at that view's `SET_STAGE` t, then displaces each beat and
requires it to stop being true. Added 2026-09-29 as RENDER-STANDARD §3; the reason it is worth a
whole check of its own is that four of the eight defects found on the cardiac-cycle item across two
review rounds were of this one shape — a correct model with the scene pointed at the wrong instant —
and a 30-row acceptance battery could not have caught any of them, because every row tested the model
against physiology and none tested the scene against the model. A beat whose claim is true at NO `t`
is a MODEL finding and must not be fixed by rewriting the narration.

**IF THE SCENE IS TIME-VARYING, WALK IT AS THE PLAYER DRAWS IT BEFORE YOU MARK IT BUILT.**
`node viz-training/tools/measure-scene-visibility.mjs <scene>`. Every proof tool in this corpus
renders `build(t)` with every layer on, at full opacity, with the camera fitted ONCE to the whole
model. The player does none of those things: it resets every structure to visible, applies the
view's ops, applies each structure's own `opacity`, and REFITS THE CAMERA PER VIEW to what is still
visible. So the proof frames prove the geometry and prove nothing about the pictures a student looks
at. Proposed by the review task on 2026-09-29 and adopted here the same day, because the first time
anyone ran the walk on a model that had already passed three review rounds and a 34-row battery, it
found EIGHT defects at once: the aortic valve contributed 0.000% of the frame in all six beats whose
narration pointed at it, the tricuspid 0.000% in nine of ten, the beats that promise "the wall is
taken away so you can see the four rings" drew opaque blood casts over the rings, and two beats
highlighted structures that drew nothing at all. Every structure a beat draws or points at must
survive that beat, or carry a waiver in `scene.visibility_waivers` that says WHY and, where it can,
names the beat that does show it. A waiver is an argument someone wrote down; a lowered threshold is
not.

**TEST ON THE SUBSTRATE, NOT ON SOMETHING THAT RESEMBLES IT.** The queue lock tool passed a race test
with eight concurrent writers — in a container where deleting files works. This repo is reached through
a mount that FORBIDS deletion, so on the real machine the tool could not release its own lock and would
have jammed the queue permanently. A green test on the wrong substrate is worse than no test: it buys
confidence you have not earned.
5. **It resolves through the real adapter**, not just in your test harness. Load `viz3d.js` in a page and
   call `MB3D.adapters.procedural.load(THREE, {refs:{procedural:'<short-name>#<part>'}})` for EVERY part
   the scene names. Each must come back with a mesh carrying geometry. This is the only check that proves
   a student would see it; everything above only proves the geometry exists.

**READ IT BACK. A COMMIT THAT WAS ISSUED IS NOT A COMMIT THAT LANDED.** Before you set an item to
`built`, re-stage EVERY file you claim to have written with `device_stage_files` and confirm each one
exists with an mtime later than the moment your run started. Report the read-back in `built_notes` —
the paths and their mtimes. If a file is missing or older than your run, your work did not reach the
repo: say so as the first line of your reply and leave the item where it was.

This is not belt-and-braces. On 2026-09-11 a run marked `cranio-caudal-folding` built with 1,900 words
of specific proof, and nothing reached the repo — the model file has never existed, nor its render
harness, nor the probe it cited, and the scene on disk was the untouched August version. It was the
first run to lose the shell on Frank's machine and it improvised the stage-in / commit-back shape you
are using now. Its queue commit landed; its file commits did not; and nothing required it to look.
The item sat `built` for nine days while six others were reviewed ahead of it.

Note that this is STRICTLY STRONGER than checking the `written` and `rejected` arrays
`device_commit_files` returns, and that is deliberate: a run that never issued the commit at all also
fails a read-back, and we cannot rule that out as what happened.

Then set status `built`, record `built_at`, and list in `built_notes` what you deliberately left out.

**STAMP TIMESTAMPS FROM THE CLOCK, NEVER FROM A SCHEDULE.** On 2026-09-22 a run wrote
`built_at: 2026-09-22T15:05:00Z` at 14:37 — twenty-eight minutes in the future, and exactly its next
`:05` cron slot. Every "built for over a day without review" check then read that item wrong. If a
timestamp you write is later than the moment you write it, that is a bug in your run, not a rounding
choice.

## 4 · Log, then hand over

Append to `viz-training/BUILD-LOG.md`: the item, what you did, what you proved, what you could not do.
Be specific about what you are unsure of — the review task reads this and a vague note wastes its run.

**DO NOT FIRE THE REVIEW TASK.** It runs on its own schedule, hourly at :35, and it picks up whatever
is marked `built`. It used to be poked from here, and that was broken in a way worth recording: a run
fired from another cloud session inherits no device binding, so the review woke with no `$HOME/mnt`,
no repo, and no remote-devices tools at all. It correctly refused to review from the builder's own
write-up and reported RUN FAILED — twice — which is the right behaviour and a useless outcome. A
scheduler-fired run carries the binding; a session-fired one does not. Just finish, log, and stop.

## 5 · Boundaries

- **Never modify the frozen Smart-Drill engine.**
- **Never touch `frankthewiz1@gmail.com`'s account data.** Test with `frankthejay@gmail.com`.
- `app.html` and `sync.js` are shared with another session — first come, first served, and only if the
  item genuinely needs them.
- Meshes stay attributed: `BodyParts3D, © DBCLS, licensed CC-BY-SA 2.1 JP.`
- If you change `sw.js`, **read its current CACHE version first** — another session moves it, and it
  has jumped several versions in a single morning.
- Do not `git commit` or `git push`, and do not deploy. Frank does those. **And do not run git at all**
  — not even `git status`. This repo is reached through a mount that forbids deletion, so every git
  command leaves a `.git/*.lock` it cannot clean up, and the NEXT git command fails with "Another git
  process seems to be running". Two such locks, three hours stale, blocked a commit today. If you
  genuinely need repo history, ask for it in your reply instead.
- Do not edit `viz-training/spike/` — those are the reference spikes.

## 6 · One thing worth more than the rest

A note in a file is a claim, not a fact — **including your own**. If the queue says a spike exists,
open it. If a note says a mesh is there, stat it. If this file's account of something and what you
find in the repo disagree, that disagreement is the finding, and it goes in the log.
