# MedBank — 3D Anatomy (model3d) — handoff brief

Self-contained brief for this workstream: **3D anatomy scenes** for MedBank's Visualize feature — real
revolving meshes with a parts list, where each part is its own mesh so it highlights correctly. A student
highlighting "biceps long head" in a note sees that exact mesh light up.

**Updated 2026-08-23:** the corpus moved to **schema v2** (provider-agnostic) and the player is wired into
`app.html` behind `FEATURES.MODEL3D`. What changed and why is in `model3d-scene-spec-v2.md`.

## Connect this folder
`C:\Users\domin\OneDrive\Documents\GitHub\medbank` — everything for this workstream is under `viz-training\`,
plus one new root file, `viz3d.js`.

## What MedBank is (context)
Single-file PWA `app.html` (~8,700 lines, inline `<script>`, hash-router `render()`), static site at
medbank.com.ng, backed by `import-server/server.mjs` on Render and Supabase `tytbrhuzikqkscxdnkmr`.
Config in `config.js` → `FEATURES` flags. **Frozen:** the Smart-Drill engine must never be modified.
The Q-bank workstream is a SEPARATE chat.

## The architecture (why it is shaped this way)
MedBank owns the **intelligence**; a provider owns the **models**. **The 207 scenes are not an anatomy
database — they are the semantic layer that says what anatomy to request and how to teach it.** A scene says
*what* a structure is and *which* model represents it per provider; the adapter decides *where* it comes from
and emits the licence credit. A scene may not contain a URL, a file type, a library name, or a provider name
outside `provider{}`/`refs{}` — the validator's purity stage enforces that.

```
note text → term match → VisualScene (scenes/*.json) → MB3D.render() → adapter → pixels
                                                          ├── bodyparts3d  (today)
                                                          ├── biodigital   (if licensed)
                                                          └── a MedBank engine (later)
```

Swapping providers is a map lookup in `refs`, not a corpus rewrite. Commercially: BioDigital does publish a
Human Widget with programmatic control, but developer toolkits are excluded from their free tier
(School/Business, price on request); Complete Anatomy publishes no third-party SDK. So `bodyparts3d` is the
only adapter until a quote exists — the seam keeps that decision reversible.

## Key files
**Player**
- `viz3d.js` (repo root) — the whole player. Dispatcher + `bodyparts3d` adapter + UI. Lazy-loads three r128
  only when a scene opens. Inert unless the flag is on.
- `viz-training/real-mesh-test/player-harness.html` — the same file, outside the app, against the real scenes.
  **Must be served over HTTP** (`npx serve .` from the repo root), not opened as `file://`.

**Corpus**
- `viz-training/model3d-scene-spec-v2.md` — **the scene contract.** Read this before authoring anything.
- `viz-training/available-meshes.json` — the 934 meshes that actually exist. The only source of valid ids.
- `viz-training/scenes/*.json` — production scenes (v2) · `index.json` — the app's lookup table.
- `viz-training/CURRICULUM.json` — 207 structures, each with `preferred_modes` (an ordered fallback list).
  Mode is a property of the **concept**, never of the course: a structure routed to `diagram` today becomes a
  3D scene the day a model exists, with no curriculum edit.
- `viz-training/tools/validate-scenes.mjs` — the eight-stage hard gate (schema · canonical · provider-id ·
  existence · ops · capability · purity · lifecycle). `tools/fixtures/regression-spleen.json` must always
  produce 11 errors; if it passes, the gate is broken. `build-scene-index.mjs` — regenerates `index.json`.
- `viz-training/tools/ingest-meshes.mjs` — catalog/diagnostics/self-host (`--catalog`, `--find`, `--diagnose`).
- `STATE.json`, `CORPUS.md`, `RUNLOG.md`, `SCHEDULE.md`, `AUTHOR-TASK-PROMPT.md` — the hourly task.

## App wiring (all of it)
`FEATURES.MODEL3D` in `config.js`, default **false**. With it off: no tab, no fetch, no three.js, no DOM.
Test without flipping it live: `localStorage.mb3d = '1'` in the console.

Six additive hunks in `app.html`, none inside the Visualize IIFE (~line 7150+) or the frozen engine:
1. `<script src="viz3d.js">` after `auth-ui.js`
2. `🧬 3D` chip in `modeSwitcher()` — appears only when a scene matches the topic
3. `topicTab==='model3d'` branch in `pageTopic()`
4. the `mb3dOn / mb3dScenes / renderModel3d / pageViz3d` block after `modeSwitcher()`
5. `MB3D.dispose()` at the top of `render()` (frees the GPU canvas on navigation)
6. `case 'viz3d':` — dev route `#/viz3d[/sceneId]`, not in student nav

`sw.js` gains `'./viz3d.js'` in `ASSETS`; it precaches on the next `CACHE` bump.

## Scene lifecycle
`ready | candidate | planned | blocked`. **Only `ready` reaches a student** — `scenesForTopic()` filters on
it. An AI-drafted scene is refused `ready` without `provenance.approved_by`, so the corpus grows as a
*validated cache*: note → concept → index lookup → hit renders; miss drafts a candidate → gate → human
approval → corpus. The AI expands a checked knowledge base rather than improvising anatomy per reader.

## Status
- Approach proven end-to-end on real meshes (arm). Catalog built. Curriculum speced and mode-routed.
- Both production scenes are v2 and pass the validator. The heart scene was **rebuilt**: its v1 form
  referenced 13 ids that do not exist and labelled `FMA7196` — the *spleen* — as "left lung". It now uses
  real valves, papillary muscles, great vessels and coronaries, with the true gaps declared.
- Player verified headless: 9/9 and 24/24 structures load, parts list, view chips, ops, cross-section
  slider, term→part deep link, degradation notice, dispose. **Real CDN meshes still need one look in a
  browser** — the build container cannot reach jsdelivr.

## "See it in 3D" — the reading experience (built)
Two triggers, both flag-gated, neither of them a model parked beside a paragraph:
- **Highlight a term** → the selection popup grows a `🧬 See it in 3D` button, but only when those words
  resolve to a real part (`MB3D.partForTermSync`). It opens `MB3D.open()` — a full-screen viewer already
  focused on that structure, ESC or backdrop to close.
- **Reading a note** → `mb3dScanNote()` marks at most **3** structures, each with a small `👁 3D` chip.
  Code, links and existing Visualize marks are skipped; a rendered note is scanned once.

**What earns a chip** (`MB3D.rankMentions`, threshold `MB3D.MIN_SCORE`): not "this note mentions anatomy"
but "this sentence describes something a flat page cannot carry".

| signal | score | example |
|---|---|---|
| the sentence describes a relationship or a course | **+4** | "arises from … passes through …", "lies between", "deep to" |
| the term opens the sentence — it is what the sentence is about | +2 | "The mitral valve lies between…" |
| the term is specific | +1 | "long head of biceps" over "biceps" |
| a bare definition with no spatial content | **−3** | "The humerus is a long bone of the upper limb" |

Every mention in the note is scored first, then the best three are placed — a weak mention in paragraph 1
never spends a chip that paragraph 6 deserves. Verified: definitional sentences ("The humerus is a long
bone", "Biceps is a muscle") produce **no** candidate at all.

`MB3D.terms()` only offers terms that resolve to a **part** — context scaffolding (the humerus behind a
muscle) is real anatomy but not a destination, and a chip on it would open a viewer with nothing selected.

## Next
1. **Open `real-mesh-test/real-mesh-check.html`** (double-click it — it inlines its scenes, so `file://`
   works) and judge the real meshes: do they look good enough to teach from? That is a product question the
   container cannot answer — it can't reach the CDN.
2. Let the hourly task accumulate v2 scenes from Thursday; review `scenes/` + `CORPUS.md`.
3. Heart chambers and other unsegmented structures: pull from the fuller upstream archive
   (dbarchive.biosciencedbc.jp) via the self-host ingest.
4. Intelligence layer: note → concept detection → index lookup → trigger; AI candidate only on a miss.

## Constraints (must hold)
Never modify the frozen Smart-Drill engine. Never pollute the real account `frankthewiz1@gmail.com` — test
with `frankthejay@gmail.com`. The agent does **not** git commit/push or trigger Render deploys — Frank does.
Keep meshes attributed: "BodyParts3D, © DBCLS, licensed CC-BY-SA 2.1 JP."
