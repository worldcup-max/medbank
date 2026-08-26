# Corpus index

One line per authored scene. Regenerate the app-facing lookup with
`node viz-training/tools/build-scene-index.mjs` — this file is the human view, `scenes/index.json` is the machine one.

| course | topic | structure | mesh parts | landmarks | status | scene |
|---|---|---|---|---|---|---|
| Gross Anatomy | Arm (Brachium) | Biceps brachii & Triceps brachii | 5 muscle heads + 4 bones | 6 (measured, 0.0–0.2 mm) | ✅ ready | `scenes/gross__arm__biceps-triceps.json` |
| Gross Anatomy | Heart & Pericardium | Heart | 18 (valves, papillary muscles, great vessels, coronaries, cardiac veins) + lungs/trachea context | 0 | ✅ ready | `scenes/gross__heart-pericardium__heart.json` |
| Gross Anatomy | Back & Vertebral Column | Vertebral column | 25 vertebrae (C1–C7, T1–T12, L1–L5, sacrum) + 5 lumbar discs as context | 0 | ✅ ready | `scenes/gross__back-vertebral-column__vertebral-column.json` |
| Gross Anatomy | Back & Vertebral Column | Typical vertebra | 3 regional exemplars (L2, T6, C5) + 2 neighbour vertebrae + 2 discs | 0 | 🟡 candidate | `scenes/gross__back-vertebral-column__typical-vertebra.json` |
| Gross Anatomy | Back & Vertebral Column | Intervertebral disc | 4 disc parts (L4/5, L5/S1, T6/7, C5/6) + 3 lumbar discs, 6 vertebrae & sacrum as context | 0 | ✅ ready | `scenes/gross__back-vertebral-column__intervertebral-disc.json` |
| Gross Anatomy | Back & Vertebral Column | Spinal cord in vertebral canal | 25 vertebrae (C1–C7, T1–T12, L1–L5) + sacrum, 2 discs, central canal of cord | 0 | 🟡 candidate | `scenes/gross__back-vertebral-column__spinal-cord-in-vertebral-canal.json` |

**6 scenes · 4 ready · 2 candidate · 0 blocked · 280 term mappings.**

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

## Run 2026-08-26 — Back & Vertebral Column
- **Vertebral column** — every vertebra from the atlas to the sacrum exists in the catalog, so the column is
  authored whole: four curves seen from the side, the regions counted from behind, atlas and axis compared
  from above, a midline cut separating the load-bearing bodies from the canal, and a trace of body weight
  running C1 → sacrum. The coccyx has no model and is narrated only; that is recorded in `gaps[]` rather
  than quietly dropped from the count of five regions.
- **Typical vertebra** — held at `candidate`. The catalog's smallest unit is a whole vertebra, so body,
  pedicle, lamina, foramen and the processes have no models. They belong as measured landmark anchors on the
  L2 mesh, and the measurement needs the source geometry, which was not available offline this run. The
  scene teaches the plan by rotation, cross-section and a three-region comparison instead, and stays on the
  worklist until the anchors are derived.

## Run 2026-08-26 (run 2) — Back & Vertebral Column, continued
- **Intervertebral disc** — `ready`. Every disc from C2/3 to L5/S1 is in the catalog, so the joint is taught
  literally: the L4/5 disc isolated between the bodies of L4 and L5, a transverse cut for annulus and
  nucleus, a load trace down the lumbar stack, and cervical / thoracic / lumbar discs compared side by side
  to make the point that thickness tracks movement rather than size. The nucleus and annulus are not
  separate models and no nerve root exists in the catalog, so the two clinical beats — why a prolapse goes
  posterolateral, and which root it traps — are narrated over the disc and recorded in `gaps[]`.
- **Spinal cord in vertebral canal** — held at `candidate`. **The catalog has no spinal cord.** Its only
  entry in that neighbourhood is `FMA78497`, the *central canal* — a thread down the middle of the cord. The
  scene is therefore built on the bony canal, which is complete from the atlas to the sacrum, and uses the
  central canal to mark the cord's axis with a label that says exactly that. Cord termination at L1/L2, the
  cauda equina, and the L3/4–L4/5 puncture window are all taught from the vertebrae, which are measured, so
  nothing in the scene depends on where that thread happens to stop. Meninges, roots and the enlargements
  are narrated. `covers` is declared but `candidate` keeps the structure on the worklist.
