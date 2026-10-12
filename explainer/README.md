# 3D Tutor (explainer/)

Organic mechanisms played as real 3D molecules, narrated step by step and matched to the student's note.
First template: **SN2**. Shown as the **⚗️ 3D Tutor** tab on any topic whose name, subject or note mentions SN2
(`mbxTemplateFor` in app.html). Turn it off on a device with `localStorage.mbmech='0'`.

## How it works
1. Student taps **⚗️ 3D Tutor** → the app downloads `explainer/mech3d.js` once (~540 KB, three.js bundled in) and
   plays the template's built-in lesson immediately. Narration goes through the app's own voice (`voiceSpeak` → `/tts`).
2. In the background the app calls `POST /explainer` with the note. The server cuts out the part of the note about
   the mechanism, asks DeepSeek to rewrite each step's narration and the "From your note" lines in the note's own
   terms, validates it, caches it in `explainers` (shared by everyone with the same note) and returns it.
3. The player swaps the new words in (badge: "✓ Matched to your note"). If anything fails, the standard lesson keeps playing.

The model only writes words. What the 3D shows is fixed by the template (`src/sn2.js`), so it cannot draw anything wrong.
The R/S label on screen is computed from the 3D coordinates.

## Files
- `src/mech3d.js` — engine (molecules from bond lengths/angles, curly arrows, σ*, lone pairs, energy profile, figure sync, narration)
- `src/sn2.js` — SN2 screenplay: steps, camera shots, default narration, mechanism figure. **Step ids must match `import-server/explainer.mjs`.**
- `mech3d.js` — built bundle the app loads (commit it after building)
- `../import-server/explainer.mjs` — prompt, excerpt, validation, cache key; route `POST /explainer` in server.mjs
- `../import-server/sql/explainers.sql` — run once in Supabase SQL editor

## Build
```
cd explainer && npm install && npm run build
```
Then bump `?v=` in `mbxLoad()` (app.html) so phones fetch the new engine.

## Cost
~$0.006 of DeepSeek per new note (cached replays free). Narration uses /tts like the rest of the app (Fish for paying students).

## Adding a mechanism (SN1, E2, …)
Add `src/<id>.js` with the same shape as `sn2.js` (plus any new geometry mode in the engine), register it in `TEMPLATES`
in `src/mech3d.js`, add the step list to `EXPLAINER_TEMPLATES` in `import-server/explainer.mjs`, and a matcher to `MBX_TEMPLATES` in app.html.
