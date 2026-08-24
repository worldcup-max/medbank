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
node viz-training/tools/build-scene-index.mjs    # regenerate if any scene changed
```

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

- **A connection**, the first time they open a scene: three.js (~600 KB, then browser-cached) and the meshes
  (~1–3 MB per scene, browser-cached per URL). Later opens of the same scene are cheap.
- **WebGL**, which every browser MedBank already supports has.
- Nothing else — no account change, no new permission, no install.

## 8 · Known limits at launch

- Two scenes (arm, heart). The 3D tab appears only on topics that match one of them; every other topic is
  unchanged. The corpus grows from Thursday.
- The heart declares three real gaps (no chamber meshes, no aortic valve, no pericardium) rather than faking them.
- Landmark anchors are `needs-review` until a human clears them — they render, they are simply not signed off.
- Engagement counts live in `localStorage` only; nothing reaches a server yet.
