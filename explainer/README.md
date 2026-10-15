# 3D Tutor (explainer/)

Chemistry mechanisms played as real 3D molecules, narrated step by step and matched to the student's note.
The **⚗️ 3D Tutor** tab appears on chemistry topics (`mbxShow` in app.html). Turn it off on a device with `localStorage.mbmech='0'`.

## Three layers
1. **Hand-built templates** (best): `src/sn2.js` today. Play instantly; `POST /explainer` swaps in narration written from the note.
2. **Instant builder** (any mechanism): `POST /explainer/scan` lists the mechanisms in the note; the student taps one (or types one)
   and `POST /explainer/build` has DeepSeek write it as atom-mapped SMILES states + curly arrows. The server checks it with
   `import-server/chemspec.mjs` (atoms conserved, charges balance, valences, every bond change explained by an arrow) and
   `import-server/chem3d.mjs` (the 3D motion agrees with the written stereochemistry), feeding errors back for up to 3 tries.
   The app builds the 3D geometry itself (`src/auto.js`). ~30–90 s the first time; cached and shared after that.
3. **Fallback**: if no try passes the check, the student is told it's queued, and the app's 2D Visualize still covers it.

**Upgrade loop:** every request, failure and "Something looks wrong?" tap is counted in `explainer_requests`.
`node explainer/tools/queue.mjs` writes `BUILD-QUEUE.md`; the build agent builds the top one by hand with
`BUILD-TASK-PROMPT.md` (the /anatomy method), and it then replaces the instant version for every matching topic.

## Files
- `src/index.js` — bundle entry (`window.MBMech = { mount, mountAuto }`)
- `src/mech3d.js` + `src/sn2.js` — hand-built engine + SN2 screenplay. **Step ids must match `import-server/explainer.mjs`.**
- `src/auto.js` — player for instant-built lessons (geometry from `chem3d.mjs`, drag slider to run the reaction)
- `src/ui.js` — shared styles
- `mech3d.js` — built bundle the app loads (commit it after building)
- `../import-server/chemspec.mjs`, `chem3d.mjs` — the chemistry checker + 3D geometry (shared by server and app)
- `../import-server/explainer.mjs`, `explainer-auto.mjs` — prompts, checks, cache keys; routes in server.mjs
- `../import-server/sql/explainers.sql` — run once in the Supabase SQL editor
- `tools/queue.mjs`, `BUILD-TASK-PROMPT.md` — the polished-build queue
- `tests/` — `node explainer/tests/run.mjs` checks the checker and the geometry on SN2, SN1, E2 and carbonyl addition

## Build
```
cd explainer && npm install && npm run build
```
Then bump `?v=` in `mbxLoad()` (app.html) so phones fetch the new engine.

## Cost
Scan ≈ $0.001 per note, build ≈ $0.006–0.02 per new mechanism (retries included); cached replays are free. Narration uses /tts.

## Adding a hand-built mechanism
Follow `BUILD-TASK-PROMPT.md`.
