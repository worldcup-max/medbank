# Shipping the 3D anatomy player

The feature is **dormant by default**. With `FEATURES.MODEL3D` false, `viz3d.js` defines one object and
stops: no tab, no chips, no fetch, no three.js, no DOM. Deploying it changes nothing a student sees. That is
deliberate — get the code onto the live site first, prove it there, and flip the switch as a separate,
reversible decision.

## 1 · What ships

| file | why |
|---|---|
| `viz3d.js` | **new** — the whole player |
| `app.html` | 8 additive hunks (script tag, 3D tab, note trigger, `#/viz3d` dev route, dispose on navigate) |
| `config.js` | `FEATURES.MODEL3D: false` |
| `sw.js` | already lists `./viz3d.js` in `ASSETS` — **no edit needed** |
| `viz-training/scenes/*.json` + `index.json` | the corpus and its lookup table |
| `viz-training/tools/*`, `*.md` | authoring tools and docs (not served to students, but keep them versioned) |

Nothing in the Visualize IIFE or the frozen Smart-Drill engine is touched. Confirm before pushing:

```
git diff --stat
node --check viz3d.js
node viz-training/tools/validate-scenes.mjs      # must end "2/2 scenes valid."
node viz-training/tools/test-topic-match.mjs     # must end "18/18 expectations met."
node viz-training/tools/test-mesh-loading.mjs    # must end "6/6 expectations met." (takes ~40s)
node viz-training/tools/test-fit-idempotent.mjs  # must end "5/5 expectations met." (needs `npm i three@0.128.0`)
node viz-training/tools/lint-viz3d.mjs           # must end "every name resolves" (needs `npm i eslint`)
node viz-training/tools/test-fourchamber-ingest.mjs  # must end "13/13 expectations met."
node viz-training/tools/build-scene-index.mjs    # regenerate if any scene changed
```

`test-topic-match.mjs` is not optional. A topic that fails to match produces **no error and no log** —
zero scenes is a legal answer — so the tab simply never appears and nothing anywhere says why. That is
exactly how the `t.length > 3` bug survived a green deploy check on 2026-08-25: it excluded the string
`"arm"`, so a note titled "Anatomy of the Arm" matched nothing. The match table is the only place this
class of failure is visible; assert it every push.

**`lint-viz3d.mjs` is the one that would have caught the worst bug of the build.** `node --check` only
asks whether the file parses, and `if (v.narration) …` in a function that never receives `v` parses
perfectly. It deployed, passed every test we had, and then threw `ReferenceError: v is not defined` on
every traced view — from inside a forEach, so it took out the narration, the step-through, the Play/Stop
toggle and the heart's blood path at once, left the caption frozen on step 1, and said nothing in the
console unless you went looking. ESLint's scope analysis finds it in under a second. Run it every push.

## 2 · Deploy

Normal flow — commit, push, let the site update. **The service worker matters here:** `sw.js` is at
`medbank-v214` and already includes `viz3d.js`, so it precaches on the next install. If the v214 install
already happened on a device *before* `viz3d.js` was in `ASSETS`, that device fetches it from the network on
first use and caches it then — either way it works, and no cache bump is required for this feature alone.

## 3 · Prove the deployment serves the corpus

A missing `index.json` fails **silently**: the service worker answers with the app shell, so the app sees
HTML where it expected JSON. `viz3d.js` detects exactly that and reports it, but check it directly:

```
node viz-training/tools/check-deploy.mjs https://medbank.com.ng
```

Every line must be `ok`. A 404 on `viz-training/scenes/index.json` means the corpus did not deploy — the 3D
tab would then simply never appear, with no error anywhere.

## 4 · Turn it on for yourself only

**Do not flip the flag to test.** On your own device, in the browser console on the live site:

```js
localStorage.mb3d = '1'      // this device only; the flag stays false for everyone else
location.reload()
```

Test on `frankthejay@gmail.com`, never on the real account. To turn it off again: `localStorage.removeItem('mb3d')`.

The dev route `#/viz3d` lists every scene in the corpus and opens any of them, including `candidate` and
`blocked` ones — those carry a status badge and are invisible to students.

## 5 · QA on the live site

Ten checks. The first four prove it is dormant for students; the rest prove it works when enabled.

1. **Flag off, no trace** — DevTools Network, open a note: no request for `three.min.js`, no `index.json`, no 🧬 tab, no 👁 3D chips.
2. **Flag off, no console noise** — no errors mentioning MB3D.
3. **Existing Visualize untouched** — highlight a sentence, tap 🎬 Visualize this: behaves exactly as before.
4. **Smart Drill untouched** — start one, answer a question, end it.
5. **Enable, then a matching topic** — a note about the arm or the heart grows a 🧬 3D chip in the mode switcher.
6. **The player** — parts list, view chips, tap a part (it isolates and is named), Ghost others, Only this, ▶ Play.
7. **Trace** — "Follow the long head" flies through supraglenoid tubercle → intertubercular groove → radial tuberosity.
8. **Note trigger** — a sentence describing a relationship gets a 👁 3D chip; a bare definition does not.
9. **Highlight trigger** — select "long head of biceps": the popup grows 🧬 See it in 3D and opens focused on it.
10. **Phone** — same note on your phone: stage is a usable size, controls on one row, overlay full-bleed, no sideways scroll.

Offline check: turn off the network with the flag on. The 3D tab should say it needs a connection, not hang
or throw. Everything else in the app keeps working from cache.

## 6 · Going live for the pilot

One line in `config.js`:

```js
FEATURES: { GAP_LOOP: true, POST_SESSION_FIX_QUEUE: true, TOPIC_PREVIEW: true, MODEL3D: true }
```

Commit, push. **Rollback is the same line back to `false`** — no data migration, nothing to undo, no student
state involved. That is the whole point of shipping it dark first.

## 7 · What students need

- **A connection**, the first time they open a scene: three.js (~600 KB, then browser-cached) and the meshes,
  browser-cached per URL. Later opens of the same scene are cheap.
- **Mesh payload, after §9:** arm scene **3.3 MB** (was 14.2), heart **7.0 MB** (was 41.5), served from our
  own Supabase bucket rather than a public CDN that dropped most of the files. Maximum surface movement from
  decimation is 0.12 mm on the scapula — a tenth of a millimetre on a 158 mm bone.
- **WebGL**, which every browser MedBank already supports has.
- Nothing else — no account change, no new permission, no install.

## 8 · Known limits, and the four bugs that got us here

Everything in this section was found by opening the thing on the live site and looking at it. None of it
was caught by a green `check-deploy` run, and that is the lesson: file-exists checks say nothing about
whether a student can reach a working picture.

**Fixed, 2026-08-25 — keep the tests, they are the only thing holding these shut:**

1. **No 3D tab on a note about the arm.** `scenesForTopic` filtered keywords with `t.length > 3`, which
   excluded the string `"arm"` — the commonest way a note names that topic. Zero scenes is a legal answer,
   so nothing errored and nothing logged. → whole-word matching, `test-topic-match.mjs`.
2. **"Loaded 2 of 15 parts", muscles greyed out as "not available in this mesh set".** The meshes were
   fine; the public CDN dropped them. One attempt, no timeout, and a network failure reported as a
   permanent fact about the corpus — which nearly sent us to price a different mesh provider.
   → retries, a 12s timeout, honest wording, `test-mesh-loading.mjs`.
3. **Solid black viewport.** `fit()` measured a group that already carried the scale it had set on the
   previous call, so re-framing after a late mesh blew a 545 mm scene up 128× with the camera inside it.
   → reset-then-measure, `test-fit-idempotent.mjs`.
4. **Solid black viewport, again, and nothing wrong anywhere.** The render loop skipped its work whenever
   `document.hidden` was true — including before it had ever drawn a frame. Camera, scale, materials and
   host all checked out; the loop was simply saving battery on a viewer showing nothing. `document.hidden`
   is true in more cases than the name suggests: a prerendered page, a tab restored in the background, a
   window occluded at the moment of mount. → never skip before the first frame.

Two of those were black rectangles with entirely different causes, and neither announced itself. The
player now carries its own instruments: `MB3D.player().stats()` reports `ticks` against `frames` (called
but not drawing is a different fault from never scheduled), `lastError()` surfaces a throw inside the loop
instead of repeating it silently forever, and a mount that has been superseded stands down rather than
claiming `LIVE` and rendering into a discarded DOM node.

**Still true at launch:**

- Two scenes (arm, heart). The 3D tab appears only on topics that match one; every other topic is unchanged.
- **No motion op.** "Flex vs extend" shows the antagonist pair side by side — it does not animate flexion.
  No renderer we have moves a joint. Better to rename the op than to imply motion that is not there.
- The heart declares three real gaps (no chamber meshes, no aortic valve, no pericardium) rather than faking them.
- Landmark anchors are `needs-review` until a human clears them — they render, they are simply not signed off.
- Engagement counts live in `localStorage` only; nothing reaches a server yet.
- `FEATURES.MODEL3D` is still **false**. Nothing above is visible to a student until that line flips.

## 9 · Getting the meshes down to phone size

Three steps, run once per batch of new scenes. **Step 1 needs the open internet, so run it in your own
terminal** — neither the Cowork cloud container nor the desktop workspace VM can reach the mesh hosts, and
both answer `403` for every id, which looks like "the mesh doesn't exist" if you aren't expecting it.

```
# 1 · fetch only what the corpus references (your own terminal)
node viz-training/tools/fetch-scene-meshes.mjs

# 2 · decimate, and prove the geometry survived
node viz-training/tools/decimate-meshes.mjs viz-training/meshes \
     --target 8000 --verify --out viz-training/meshes-lite

# 3 · upload meshes-lite/ to the bucket, then in config.js:
#     MESH_BASE: "https://<project>.supabase.co/storage/v1/object/public/viz-meshes/"
```

`--target 8000` is the recommendation, not a law. Measured on a 35k-triangle test solid with a deliberately
thin process (to stand in for a coracoid), the surface moves like this:

| triangles kept | file size | max surface movement | as % of the model |
|---:|---:|---:|---:|
| 19,803 | 0.94 MB | 0.016 mm | 0.01% |
| 11,802 | 0.56 MB | 0.020 mm | 0.02% |
| 5,803 | 0.28 MB | 0.038 mm | 0.03% |
| 2,803 | 0.13 MB | 0.096 mm | 0.07% |
| 1,302 | 0.06 MB | 0.210 mm | 0.16% |

Even at a 27× cut the surface moves a fifth of a millimetre. Detail is not what is at risk here; the payload
is. At `--target 8000` the arm scene should land near 3 MB instead of 15.

**Why `--verify` is not optional.** Landmark anchors are stored as `uvw` fractions of a mesh's bounding box —
the supraglenoid tubercle is `[0.254, 0.311, 0.863]` of the scapula's box, not a vertex id. Move the box by
a millimetre and every landmark on that bone moves with it, silently, and the contact-measured calibration
(supraglenoid↔coracoid 24.1 mm, supraglenoid↔infraglenoid 38.4 mm) quietly stops being true with nothing on
screen to show it. So the decimator freezes every vertex that defines the box, asserts the box is
bit-identical before writing, and refuses the file outright if it is not. `--verify` adds the second
measurement: how far the *surface* moved, in millimetres, sampled against the original. A refusal is
information — raise `--target`, don't raise the ceiling to make it go away.

After step 3, re-run the landmark check by opening a scene and confirming the gold pin still sits on the
supraglenoid tubercle rather than out on the acromion. The numbers can be right and the pin still wrong if
the wrong mesh was uploaded under the right filename.
