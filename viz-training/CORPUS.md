# Corpus index

One line per authored scene. Regenerate the app-facing lookup with
`node viz-training/tools/build-scene-index.mjs` — this file is the human view, `scenes/index.json` is the machine one.

| course | topic | structure | mesh parts | landmarks | status | scene |
|---|---|---|---|---|---|---|
| Gross Anatomy | Arm (Brachium) | Biceps brachii & Triceps brachii | 5 muscle heads + 4 bones | 6 (measured, 0.0–0.2 mm) | ✅ ready | `scenes/gross__arm__biceps-triceps.json` |
| Gross Anatomy | Heart & Pericardium | Heart | 18 (valves, papillary muscles, great vessels, coronaries, cardiac veins) + lungs/trachea context | 0 | ✅ ready | `scenes/gross__heart-pericardium__heart.json` |

**2 scenes · 2 ready · 0 blocked · 103 term mappings.**

## Notes on the two hand-authored scenes
- **Arm** — the reference implementation. Six bony landmarks derived by measuring where each muscle actually
  contacts its bone (`tools/derive-landmarks.html`), so "Follow the long head" visits the supraglenoid
  tubercle, the intertubercular groove and the radial tuberosity rather than lighting whole bones.
- **Heart** — rebuilt from scratch. Its v1 form referenced 13 ids that do not exist in the catalog and
  labelled `FMA7196` — the **spleen** — as "left lung". It now teaches the chambers through their valves and
  papillary muscles, and declares the three real gaps (no chamber meshes, no aortic valve, no pericardium)
  rather than faking them.

## What the authoring task adds from Thursday
Two structures per run, each gated by `tools/validate-scenes.mjs`. A scene that fails is written
`status:"blocked"` with its reason and is NOT counted here. Run `tools/derive-landmarks.html` over new
anatomy scenes to add their bony landmarks.
