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
node viz-training/tools/build-scene-index.mjs    # regenerate if any scene changed
```

`test-topic-match.mjs` is not optional. A topic that fails to match produces **no error and no log** —
zero scenes is a legal answer — so the tab simply never appears and nothing anywhere says why. That is
exactly how the `t.length > 3` bug survived a green deploy check on 2026-08-25: it excluded the string
`"arm"`, so a note titled "Anatomy of the Arm" matched nothing. The match table is the only place this
class of failure is visible; assert it every push.

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
- **The mesh payload is the real cost, and it is bigger than this doc used to claim.** Measured against the
  live archive on 2026-08-25: the arm scene is **~15 MB** across nine files — scapula alone is 5.4 MB
  (113,256 triangles), and two of the nine took over 40 seconds to arrive from the CDN. On a Nigerian phone
  on mobile data that is not acceptable, and it is the one thing between this build and a pilot. See §8.
- **WebGL**, which every browser MedBank already supports has.
- Nothing else — no account change, no new permission, no install.

## 8 · Known limits at launch

- **The public CDN is not a production source, and this is now the blocking issue.** Opened on the live site
  2026-08-25, the arm scene reported *"Loaded 2 of 15 parts — 8 unavailable"*: seven meshes that render
  perfectly failed to arrive. The meshes are fine; the CDN is not, for files this size. §9 is the fix, and
  it is no longer an optimisation — the feature does not work without it.
- Two defects on our side of that, now fixed but worth knowing about: the loader tried **once**, with **no
  timeout**, and reported a failed download as *"not available in this mesh set"* — telling the student a
  permanent falsehood about the corpus, and very nearly sending us to price a different mesh provider we do
  not need. It now retries three times against a 12-second timeout, opens the scene after 8 seconds with
  whatever has arrived and folds in stragglers as they land, offers **↻ Retry** for the ones that gave up,
  and says *"download failed"* and *"no 3D model of this structure yet"* as the different things they are.
  `test-mesh-loading.mjs` holds that distinction in place.
- Two scenes (arm, heart). The 3D tab appears only on topics that match one of them; every other topic is
  unchanged. The corpus grows from Thursday.
- The heart declares three real gaps (no chamber meshes, no aortic valve, no pericardium) rather than faking them.
- Landmark anchors are `needs-review` until a human clears them — they render, they are simply not signed off.
- Engagement counts live in `localStorage` only; nothing reaches a server yet.

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
