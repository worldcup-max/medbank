# Corpus index

One line per authored scene. Regenerate the app-facing lookup with
`node viz-training/tools/build-scene-index.mjs` — this file is the human view, `scenes/index.json` is the machine one.

| course | topic | structure | mesh parts | landmarks | status | scene |
|---|---|---|---|---|---|---|
| Gross Anatomy | Arm (Brachium) | Biceps brachii & Triceps brachii | 5 muscle heads + 4 bones | 6 (measured, 0.0–0.2 mm) | ✅ ready | `scenes/gross__arm__biceps-triceps.json` |
| Gross Anatomy | Heart & Pericardium | Heart | 18 (valves, papillary muscles, great vessels, coronaries, cardiac veins) + lungs/trachea context | 0 | ✅ ready | `scenes/gross__heart-pericardium__heart.json` |
| Gross Anatomy | Back & Vertebral Column | Vertebral column | 25 vertebrae (C1–C7, T1–T12, L1–L5, sacrum) + 5 lumbar discs as context | 0 | ✅ ready | `scenes/gross__back-vertebral-column__vertebral-column.json` |
| Gross Anatomy | Back & Vertebral Column | Typical vertebra | 3 regional exemplars (L2, T6, C5) + 2 neighbour vertebrae + 2 discs | 16 | ✅ ready | `scenes/gross__back-vertebral-column__typical-vertebra.json` |
| Gross Anatomy | Back & Vertebral Column | Intervertebral disc | 4 disc parts (L4/5, L5/S1, T6/7, C5/6) + 3 lumbar discs, 6 vertebrae & sacrum as context | 0 | ✅ ready | `scenes/gross__back-vertebral-column__intervertebral-disc.json` |
| Gross Anatomy | Back & Vertebral Column | Spinal cord in vertebral canal | 25 vertebrae (C1–C7, T1–T12, L1–L5) + sacrum, 2 discs, central canal of cord | 0 | 🟡 candidate | `scenes/gross__back-vertebral-column__spinal-cord-in-vertebral-canal.json` |
| Gross Anatomy | Back & Vertebral Column | Erector spinae / deep back muscles | 19 muscle parts (3 columns × 9, transversospinal ×6, splenius ×2, levatores ×2) + 8 extrinsic/intermediate muscles & 6 bones as context | 0 | ✅ ready | `scenes/gross__back-vertebral-column__erector-spinae-deep-back-muscles.json` |
| Gross Anatomy | Pectoral Region & Breast | Pectoralis major | 3 heads (clavicular, sternocostal, abdominal) + 16 context (clavicle, sternum, 5 costal cartilages, humerus, pec minor, subclavius, serratus anterior, deltoid, latissimus, obliques) | 0 | ✅ ready | `scenes/gross__pectoral-region-breast__pectoralis-major.json` |

**8 scenes · 7 ready · 1 candidate · 0 blocked · 556 term mappings.**

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

## Run 2026-08-26 (run 3) — Erector spinae, then across to the pectoral region
- **Erector spinae / deep back muscles** — `ready`. `gross__back-vertebral-column__erector-spinae-deep-back-muscles`
  · Gross Anatomy · Back & Vertebral Column · 3d_anatomy · 19 parts + 14 context · ready.
  There is no mesh called "erector spinae", but all three of its columns are in the catalog by name, so the
  muscle is assembled from its nine named parts — iliocostalis lumborum/thoracis/cervicis, longissimus
  thoracis/cervicis/capitis, spinalis thoracis/cervicis — and taught lateral to medial. Under them sit the
  transversospinal group (semispinalis ×3, multifidus, rotatores cervical/thoracic/lumbar, levatores
  costarum), and over them trapezius, latissimus, the rhomboids and the two serratus posterior sheets are
  carried as context so the scene can strip the back layer by layer. No fascia and no dorsal rami exist in
  the catalog, so the compartment roof and the nerve-supply rule that defines "intrinsic" are narrated.
- **Pectoralis major** — `ready`. `gross__pectoral-region-breast__pectoralis-major` · Gross Anatomy ·
  Pectoral Region & Breast · 3d_anatomy · 3 parts + 16 context · ready.
  The catalog holds all three heads separately, so the structure resolves exactly: clavicular, sternocostal
  and abdominal parts, with the clavicle, sternum, five costal cartilages, external oblique and humerus as
  the origin-and-insertion frame, and pectoralis minor, subclavius, serratus anterior, deltoid and
  latissimus around it. `covers` is `["Pectoralis major"]` only — pectoralis minor is present as context but
  its own curriculum entry (axillary landmark, the three parts of the axillary artery) is not taught here.
  **The catalog has no breast**: no mesh matches breast, mammary gland or nipple, so curriculum entry
  "Breast (mammary gland)" cannot be a 3D scene and should take its deferred `diagram` mode when reached.

## Run 2026-08-26 (run 4) — Pectoralis minor, then the breast the catalog does not hold
- **Pectoralis minor** — `ready`. `gross__pectoral-region-breast__pectoralis-minor` · Gross Anatomy ·
  Pectoral Region & Breast · 3d_anatomy · 5 parts + 12 context · ready · degrades PEEL_LAYER.
  The muscle itself resolves exactly (`right pectoralis minor`), and so do the three origin ribs. The
  **coracoid process has no mesh**, so the insertion is taught on the whole right scapula with the coracoid
  named and highlighted — option (b), an adjacent structure that exists. The scene is built around the two
  things the muscle is examined on: it divides the axillary artery into three parts (1-2-3 branches) and the
  axillary nodes into three levels (Patey). Neither the axillary artery nor any lymph node exists in the
  catalog, so both are narrated against the muscle, with the subclavian artery traced to the lateral border
  of the first rib to place where the name changes. `covers` is `["Pectoralis minor"]` only.
- **Breast (mammary gland)** — `planned`. `gross__pectoral-region-breast__breast-mammary-gland` · Gross
  Anatomy · Pectoral Region & Breast · **diagram** (svg) · 12 parts + 2 context · planned.
  The gap flagged in run 3 came due this run. Searching the catalog for breast, mammary, nipple, areola and
  lactiferous returns **zero** meshes, so the structure took its deferred `diagram` mode: no refs, six beats
  over a sagittal section — layers, lobes and ducts, Cooper's ligaments and skin dimpling, blood and lymph,
  clinical anatomy. `3d_anatomy` is kept in `deferred_modes`, so the day a mammary mesh exists this becomes
  a 3D scene with no curriculum edit. Status is `planned`, not `ready`: the authoring is complete but no SVG
  artwork has been drawn, so nothing renders to a student yet.

## Run 2026-08-26 (run 5) — Clavicle, then the axillary vessels the catalog does not hold
- **Clavicle** — `ready`. `gross__pectoral-region-breast__clavicle` · Gross Anatomy · Pectoral Region &
  Breast · 3d_anatomy · 9 parts + 6 context · ready · degrades PEEL_LAYER.
  The bone resolves exactly (`right clavicle`, FMA13322) and so does every one of its attachments: the
  clavicular head of pectoralis major, the clavicular part of deltoid, the descending part of trapezius,
  sternocleidomastoid and subclavius. Both joints are shown as bone meeting bone — manubrium medially,
  scapula laterally — because no capsule, disc or ligament exists as a model. Eight beats: the subcutaneous
  strut, the S-curve seen only from above, a joint at each end, the attachments sorted by half, what hides
  behind the middle third, a cross-section of the costoclavicular space, the middle-third fracture and how
  the fragments displace, and the ossification story. `covers` is `["Clavicle"]`. **The bone's own surface
  landmarks — conoid tubercle, trapezoid line, subclavian groove, the two facets — have no meshes and were
  NOT authored as anchors**: the house standard is a position measured on the source mesh, and the clavicle
  mesh is not in the local set, so they are narrated instead of guessed.
- **Axillary vessels & lymph nodes** — `candidate`. `gross__pectoral-region-breast__axillary-vessels-lymph-nodes`
  · Gross Anatomy · Pectoral Region & Breast · 3d_anatomy · 10 parts + 4 context · **candidate**.
  The gap flagged in runs 3 and 4 came due. All three subjects the entry names — axillary artery, axillary
  vein, axillary lymph nodes — have **zero** meshes. The scene takes option (b) throughout: the subclavian
  artery and vein stand in for their axillary continuations, the first rib and the lower border of teres
  major fix the two borders where the names change, pectoralis minor divides the artery into three parts and
  the nodes into three levels, and the four walls of the axilla carry the five nodal groups. Eight beats,
  35 ops, including the 1-2-3 branch rule and the route of breast-cancer spread traced as `concept:lymph`.
  Held as `candidate`, not `ready`: a scene whose entire named subject is narrated rather than shown has not
  earned the status. Measured node anchors on the axillary walls are the one change that would release it.
- **Brachial plexus** — `planned`. `gross__axilla-brachial-plexus__brachial-plexus`
  · Gross Anatomy · Axilla & Brachial Plexus · diagram · 32 parts + 4 context · **planned**.
  Routed to its deferred `diagram` mode because the catalog holds **no nerve of the upper limb at all** —
  a search of all 934 entries for plexus, nerve, root, trunk and cord returns two optic nerves and two
  choroid plexuses and nothing else. Thirty nerve structures, zero resolvable. Roots C5–T1, three trunks,
  the divisions, three cords, four supraclavicular branches, seven cord branches and five terminal
  branches, plus Erb's palsy, Klumpke palsy and winged scapula authored as annotation regions beside the
  level that produces them. Six beats, 30 ops: the course from the interscalene groove to the axilla;
  five-three-six-three-five traced with `concept:nerve_fibres`; how the divisions build the cords around
  the second part of the axillary artery; the M; the branches that leave early, with ULTRA; and reading a
  lesion backwards from the deficit. `covers` is `["Brachial plexus"]`. `3d_anatomy` stays first in the
  curriculum's `preferred_modes` and is recorded in `deferred_modes` — this becomes a 3D scene the day
  upper-limb nerve models exist, with no curriculum edit. Waits on SVG artwork, not on anatomy.
- **Axillary artery** — `planned`. `gross__axilla-brachial-plexus__axillary-artery`
  · Gross Anatomy · Axilla & Brachial Plexus · diagram · 13 parts + 5 context · **planned**.
  No axillary artery and none of its six branches exist as models; the nearest are the subclavian
  continuations. **Deliberately not a second 3D axilla scene**: `gross__pectoral-region-breast__axillary-vessels-lymph-nodes`
  already teaches the space in 3D from those same continuations and the four walls, and its own `gaps[]`
  records that the 1-2-3 branch rule has no picture. This diagram is that picture — the two scenes are
  complementary, one for the space and one for the branching tree. Three parts divided by pectoralis minor;
  six branches tied part by part with SHOW_RELATIONSHIP; `PEEL_LAYER` takes the axillary sheath off to show
  artery and cords inside it and the vein outside; `concept:collateral_flow` walks the scapular anastomosis
  to explain where the vessel may safely be tied. Six beats, 31 ops. `covers` is `["Axillary artery"]`.
