# Corpus index

One line per authored scene. Regenerate the app-facing lookup with
`node viz-training/tools/build-scene-index.mjs` — this file is the human view, `scenes/index.json` is the machine one.

| course | topic | structure | mesh parts | landmarks | status | scene |
|---|---|---|---|---|---|---|
| Gross Anatomy | Arm (Brachium) | Biceps brachii & Triceps brachii | 5 muscle heads + 4 bones | 6 (measured, 0.0–0.2 mm) | ✅ ready | `scenes/gross__arm__biceps-triceps.json` |
| Gross Anatomy | Heart & Pericardium | Heart | 20 (valves, papillary muscles, great vessels, coronaries, cardiac veins) + lungs (all five lobes), diaphragm, trachea context | 0 | ✅ ready · audited 2026-08-29 | `scenes/gross__heart-pericardium__heart.json` |
| Gross Anatomy | Back & Vertebral Column | Vertebral column | 24 vertebrae (C1–C7, T1–T12, L1–L5) + sacrum + all 23 intervertebral discs as context | 1 (coccyx, measured on the sacral mesh) | ✅ ready | `scenes/gross__back-vertebral-column__vertebral-column.json` |
| Gross Anatomy | Back & Vertebral Column | Typical vertebra | 3 regional exemplars (L2, T6, C5) + 2 neighbour vertebrae + 2 discs | 13 | ✅ ready · audited 2026-08-29 (landmark count corrected 16 → 13; beats renumbered — two views were both "3" and one had none; intervertebral foramen re-described as the paired pedicle notches) | `scenes/gross__back-vertebral-column__typical-vertebra.json` |
| Gross Anatomy | Back & Vertebral Column | Intervertebral disc | 4 disc exemplars (L4/5, L5/S1, T6/7, C5/6) within the complete set of 23 discs + all 24 vertebrae & sacrum as context | 1 | ✅ ready · audited 2026-08-29 (structure line corrected — the scene holds the whole column, not 6 vertebrae; coccyx anchor was uncounted; three views had no beat number) | `scenes/gross__back-vertebral-column__intervertebral-disc.json` |
| Gross Anatomy | Back & Vertebral Column | Spinal cord in vertebral canal | 24 vertebrae (C1–C7, T1–T12, L1–L5) + sacrum, 2 discs, central canal of cord | 0 | 🟡 candidate · audited 2026-08-29 (vertebra count corrected 25 → 24; C3 claimed the cervical enlargement sat at its level while C2 said it began at C4 — enlargement now stated once as C4–T1 and applied consistently; midline beat no longer implies a cord is drawn; three views had no beat number. Stays candidate: no cord mesh, and the curriculum-required `vasculature` view is unauthorable — no vertebral/spinal/segmental vessel in the catalog) | `scenes/gross__back-vertebral-column__spinal-cord-in-vertebral-canal.json` |
| Gross Anatomy | Back & Vertebral Column | Erector spinae / deep back muscles | 19 muscle parts (3 columns × 9, transversospinal ×7 (semispinalis ×3, multifidus, rotatores ×3), levatores ×2 in their own group, splenius ×2) + 8 extrinsic/intermediate muscles & 6 bones as context | 0 | ✅ ready · audited 2026-08-29 | `scenes/gross__back-vertebral-column__erector-spinae-deep-back-muscles.json` |
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
- **Erector spinae / deep back muscles** — `ready`, audited 2026-08-29. `gross__back-vertebral-column__erector-spinae-deep-back-muscles`
  *(2026-08-29 audit: levatores costarum moved out of the Transversospinalis group — beat 6 was isolating that group and narrating "three muscles, one plan" over five. Beat 4's "only column that reaches the skull" softened to "reliably reaches" to agree with gaps[1] on spinalis capitis.)*
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
  *Audited 2026-08-29.* All 19 model ids and names verified against the catalog character for character;
  no left/right pair in the scene (every sided mesh is right). The insertion is now carried by a **measured
  landmark anchor** on the lateral lip of the bicipital groove, and the `gaps[]` entry that still asked for
  that anchor to be built was stale and has been rewritten to describe what was measured and what the anchor
  still cannot mark (the medial lip and the floor of the groove, named in the same breath for teres major and
  latissimus dorsi). Beats 5 and 7 now say aloud that the cephalic vein, the pectoral nerves, the
  thoracoacromial artery and both fasciae are being described rather than shown.

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
  *Audited 2026-08-29.* All 17 model ids and names verified; no left/right pair (every sided mesh is right).
  The line above about the coracoid is superseded: the insertion is now a **measured landmark anchor** on the
  right scapula, witnessed by pectoralis minor, coracobrachialis and the short head of biceps, and the stale
  `gaps[]` entry asking for that anchor has been rewritten to record what it can and cannot distinguish
  (medial border versus tip). Beats 4, 5 and 6 now state openly that the axillary artery and its branches,
  the lymph nodes, the cords, teres major and latissimus dorsi are named rather than drawn. Beat 5's
  `SHOW_RELATIONSHIP` pointed at the subclavian vein under the label "landmark for nodal levels", which the
  vein is not; it now points at the clavicle and names the apex of the axilla, where level three sits.
- **Breast (mammary gland)** — `planned`. `gross__pectoral-region-breast__breast-mammary-gland` · Gross
  Anatomy · Pectoral Region & Breast · **diagram** (svg) · 12 parts + 2 context · planned.
  The gap flagged in run 3 came due this run. Searching the catalog for breast, mammary, nipple, areola and
  lactiferous returns **zero** meshes, so the structure took its deferred `diagram` mode: no refs, six beats
  over a sagittal section — layers, lobes and ducts, Cooper's ligaments and skin dimpling, blood and lymph,
  clinical anatomy. `3d_anatomy` is kept in `deferred_modes`, so the day a mammary mesh exists this becomes
  a 3D scene with no curriculum edit. Status is `planned`, not `ready`: the authoring is complete but no SVG
  artwork has been drawn, so nothing renders to a student yet. **Audited 2026-08-29**: the absence claim was
  re-verified independently (breast, mammar, nipple, areol, lactif, gland, lymph, node, sweat, fascia,
  retromammar — zero hits for all the mammary terms), and one anatomical error was corrected: the axillary
  tail card called itself "the commonest site of breast cancer" while beat 6 correctly gave that to the upper
  outer quadrant. The tail card now says the same thing beat 6 does. The sentinel-node sentence was also
  loosened from "the first node the lateral breast drains into" to the first node draining a given tumour.

## Run 2026-08-26 (run 5) — Clavicle, then the axillary vessels the catalog does not hold
- **Clavicle** — `ready`. `gross__pectoral-region-breast__clavicle` · Gross Anatomy · Pectoral Region &
  Breast · 3d_anatomy · 10 parts + 6 context · ready · degrades PEEL_LAYER.
  The bone resolves exactly (`right clavicle`, FMA13322) and so does every one of its attachments: the
  clavicular head of pectoralis major, the clavicular part of deltoid, the descending part of trapezius,
  sternocleidomastoid, subclavius and — added 2026-08-28 in the audit pass — sternohyoid (FMA13346), which
  the scene's gaps[] had wrongly recorded as absent from the catalog. It is now on screen and in that beat's
  trace path. **Audited 2026-08-29**: beat 4 counted the attachments three different ways in one beat — title
  four, narration five, trace path six — and the repair backlog had held that open. The answer is **six**
  (four on the medial two-thirds: sternocleidomastoid, pectoralis major, subclavius, sternohyoid; two on the
  lateral third: trapezius, deltoid), and title, narration and the sternohyoid card now all say six.
  Both joints are shown as bone meeting bone — manubrium medially,
  scapula laterally — because no capsule, disc or ligament exists as a model. Eight beats: the subcutaneous
  strut, the S-curve seen only from above, a joint at each end, the attachments sorted by half, what hides
  behind the middle third, a cross-section of the costoclavicular space, the middle-third fracture and how
  the fragments displace, and the ossification story. `covers` is `["Clavicle"]`. **The claim that the clavicle mesh is
  not in the local set was FALSE and is corrected 2026-08-29**: `FMA13322.stl` is on disk, and three of the
  bone's own surface landmarks were measured at audit — sternal facet (manubrium contact, 0.12 mm, 113-vertex
  patch), acromial facet (scapula contact, 0.99 mm, 65 vertices, cross-checking the existing `acromion`
  anchor measured from the other side of the same joint) and subclavian groove (subclavius contact, 0.22 mm,
  188 vertices), all three with the `--area` form because facets and grooves are surfaces. All are
  `needs-review`. The conoid tubercle and trapezoid line remain narration: their defining ligament has no
  mesh, and the scapula is not a substitute witness — `--contact FMA13395` returns the acromioclavicular
  joint, a measured and wholly wrong answer, now recorded in `gaps[]` so nobody re-derives and believes it.
- **Axillary vessels & lymph nodes** — `candidate`. `gross__pectoral-region-breast__axillary-vessels-lymph-nodes`
  · Gross Anatomy · Pectoral Region & Breast · 3d_anatomy · 12 parts + 5 context · **candidate**.
  **Amended at audit 2026-08-29** (`provenance.audited_at`; still `candidate`, correctly): the scene's
  `gaps[]` said the wall meshes "are not in the local mesh set" and that a measured anchor was therefore
  impossible — all fifteen meshes are in `meshes-lite/`. Two sites measured: the ANTERIOR (pectoral) group
  at the serratus anterior / pectoralis minor contact, 0.33 mm; the LATERAL WALL at the intertubercular
  groove of the humerus on two converging witnesses (subscapularis 0.09 mm, teres major 0.35 mm). Both carry
  `approx{}` — they mark a wall, never a node. Three refusals recorded so no later run re-derives them:
  posterior group (3.23 mm), apical group (3.27 mm, and it is a space bounded by three bones), central group
  (axillary fat, no mesh). The same `gaps[]` also claimed anchors were "the single change that would let the
  scene reach ready", which contradicted `candidate_reason` two fields above it; the real blocker is the
  absent axillary artery, axillary vein and lymph nodes, and that is now said in one place only.
  The gap flagged in runs 3 and 4 came due. All three subjects the entry names — axillary artery, axillary
  vein, axillary lymph nodes — have **zero** meshes. The scene takes option (b) throughout: the subclavian
  artery and vein stand in for their axillary continuations, the first rib and the lower border of teres
  major fix the two borders where the names change, pectoralis minor divides the artery into three parts and
  the nodes into three levels, and the four walls of the axilla carry the five nodal groups. Eight beats,
  35 ops, including the 1-2-3 branch rule and the route of breast-cancer spread traced as `concept:lymph`.
  Held as `candidate`, not `ready`: a scene whose entire named subject is narrated rather than shown has not
  earned the status. Measured node anchors on the axillary walls are the one change that would release it.
- **Brachial plexus** — `planned`, audited 2026-08-29. `gross__axilla-brachial-plexus__brachial-plexus`
  *(2026-08-29 audit: no-upper-limb-nerve claim re-verified independently against all 934 catalog entries — diagram routing correct. Fixed the ULTRA mnemonic, which was presented twice as the proximal-to-distal ORDER of the posterior cord's branches when its letters spell a different order.)*
  · Gross Anatomy · Axilla & Brachial Plexus · diagram · 32 parts + 4 context · **planned**. *(2026-08-28: diagram routing re-opened per the repair backlog and re-confirmed. The scalenes, first rib, clavicle and subclavian artery all exist as meshes, so the interscalene corridor is renderable — but a fresh search on nerve, plexus, root, trunk, cord and ganglion still returns four meshes in the whole catalog, none of the upper limb, so the subject of all six beats does not exist. Stays diagram.)*
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
  to explain where the vessel may safely be tied. Six beats, 31 ops. `covers` is `["Axillary artery"]`. **Audited 2026-08-29**: beat 1 said the vessel runs "from the aortic arch", true only on the left — now states brachiocephalic trunk on the right; beat 4 counted "three things" inside the axillary sheath and listed artery + cords — now four (second part of the artery + three cords), matching the vein scene. Catalog re-searched under nine spellings, absence confirmed.
- **Axillary vein** — `planned`. `gross__axilla-brachial-plexus__axillary-vein`
  · Gross Anatomy · Axilla & Brachial Plexus · diagram · 17 parts + 1 context · **planned**.
  The catalog holds 21 veins and not one of them is in the upper limb below the subclavian — no axillary,
  basilic, cephalic or brachial venae comitantes, and none of the named tributaries. Same reasoning as the
  axillary artery: `gross__pectoral-region-breast__axillary-vessels-lymph-nodes` already teaches this vein
  in 3D through `right subclavian vein` (FMA4755) and its own `gaps[]` records that the vein is "spoken
  rather than seen", so a third 3D scene from the same fourteen wall meshes would have duplicated it
  without adding a picture. This diagram supplies what the 3D scene cannot: formation from basilic +
  venae comitantes at the lower border of teres major, the tributary tree that copies the artery's
  branches, the cephalic vein piercing the clavipectoral fascia, the front-to-back cross-section, and the
  three clinical failures — air embolism, effort thrombosis (Paget-Schroetter), lymphoedema. Seven beats,
  33 ops. `covers` is `["Axillary vein"]`. **Audited 2026-08-29**: one factual error — beat 7 placed the infraclavicular puncture at the junction of the medial two-thirds and lateral third of the clavicle; corrected to medial third / lateral two-thirds. Named-not-drawn structures logged in `gaps[]`; beat 7 is the hollow beat.
- **Axillary lymph nodes** — `planned`. `gross__axilla-brachial-plexus__axillary-lymph-nodes`
  · Gross Anatomy · Axilla & Brachial Plexus · diagram · 18 parts · **planned**.
  **There is not one lymph node anywhere in the catalog** — 934 entries searched for lymph and for node,
  in every region of the body, zero hits. A 3D scene here is impossible today rather than merely thin.
  Five groups placed on the walls they sit on, then the same nodes re-labelled as the surgeon's three
  levels across pectoralis minor, so beat 4 can show both overlays at once and teach the conversion. Flow
  traced with `concept:lymph` (three in, one in the middle, one at the top, then out at the venous angle);
  breast spread traced with `concept:tumour_spread` including the medial quarter that escapes to the
  internal thoracic nodes; `PEEL_LAYER` lifts the pectoral muscles to expose the three nerves at risk in a
  clearance — long thoracic, thoracodorsal, intercostobrachial — each with its own signature deficit; and
  a final beat on how to actually palpate an axilla. Seven beats, 33 ops. `covers` is
  `["Axillary lymph nodes"]`. This is the picture the 3D axillary vessels scene names as the single change
  that would release it, drawn separately because that scene teaches the space and this one the nodes. **Audited 2026-08-29**: the interpectoral (Rotter's) nodes were inside a group named "The five groups"
  that therefore held six structures, so beat 1 highlighted six while narrating five and beat 2's "the other
  two groups" counted against the wrong set; Rotter's now has its own group and beat 4 shows it explicitly at
  level II. Named-not-drawn structures logged in `gaps[]` — the axillary vein is the one the artwork most needs.

## Run 2026-08-26 (run 8) — Rotator cuff, then the humerus that carries every landmark
- **Rotator cuff muscles** — `ready`, audited 2026-08-29. `gross__axilla-brachial-plexus__rotator-cuff-muscles`
  *(2026-08-29 audit: the three facets of the greater tubercle are now MEASURED anchors, one per cuff tendon, and beat 4 points each muscle at its own facet. A gaps[] note claiming no supraspinatus mesh was held locally was false and is corrected.)*
  · Gross Anatomy · Axilla & Brachial Plexus · 3d_anatomy · 6 parts (4 muscles + 2 landmarks) + 5 context ·
  **ready**. The first fully-resolved 3D scene in this topic, and the topic's last structure. All four cuff
  muscles exist and were copied verbatim from the catalog: `right supraspinatus` FMA32544,
  `right infraspinatus muscle` FMA32547 — note the trailing word the other three do not carry —
  `right teres minor` FMA32553, `right subscapularis` FMA13414. Two parts of deltoid are context so beat 2
  can take the cover off, and `right teres major` FMA32551 is context for the exam trap: it sits next to
  teres minor, is not cuff, and rotates the other way. Seven beats, 22 ops: the cover, the three posterior
  muscles, the one in front you never see from behind, where each tendon lands, in-versus-out rotation as a
  `COMPARE_STRUCTURES`, supraspinatus traced under the acromion with the painful arc, and the teres trap.
  Two landmark anchors on the humerus — greater and lesser tubercle — carry the insertion story.
  `covers` is `["Rotator cuff muscles"]`.
- **Humerus** — `ready`. `gross__arm__humerus` · Gross Anatomy · Arm (Brachium) · 3d_anatomy · 13 parts
  (1 bone + 12 landmarks) + 3 context · **ready**. *(amended by the audit of 2026-08-28: a twelfth landmark,
  the supracondylar region, measured and added; beat 7 now pairs four fracture sites with four nerves.)* The catalog's smallest unit is the whole bone, so every
  named part of the humerus had to be a measured anchor or nothing. `tools/derive-humerus-landmarks.mjs`
  (new this run) measures eleven of them on the mesh itself and prints the evidence for each: six by
  CONTACT with a named neighbour — head (scapula, 1.00 mm), lesser tubercle (subscapularis, 0.09 mm),
  intertubercular groove (long head of biceps, 0.39 mm), deltoid tuberosity (deltoid, 0.75 mm), trochlea
  (ulna, 0.62 mm), capitulum (radius, 4.85 mm) — three by stated EXTREME — greater tubercle, medial and
  lateral epicondyle — and two DERIVED: the radial groove as the midpoint between the origins of the
  lateral and medial heads of triceps, which sit above and below it, and the surgical neck as the narrowest
  level in the 10% of bone below the lowest tubercle. Cross-checks print with the output: bicondylar width
  63.8 mm, head to trochlea 257.4 mm on a 307.5 mm bone. Seven beats, 25 ops: the whole bone in place, top
  end, shaft from behind, a draggable transverse cut, bottom end with both articulations, the radial nerve
  traced as `concept:radial_nerve` along neck → groove → lateral epicondyle, and a closing beat pairing
  fracture sites with the nerve at risk at each. The audit of 2026-08-28 measured a twelfth anchor — the
  supracondylar region, the most anterior point of the distal shaft within the slab z:0.10–0.25, sitting at
  Z-fraction 0.101 against 0.066 and 0.081 for the two epicondyles — because the learning goal promised
  four fracture sites, beat 7 delivered three, and the nerves scene deferred to a fourth nobody had written.
  Beat 7 now compares four: surgical neck/axillary, radial groove/radial, supracondylar/median (with the
  brachial artery), medial epicondyle/ulnar. `covers` is `["Humerus"]`.

## Run 2026-08-26 (run 9) — the brachial artery and the three nerves, both unresolvable
- **Brachial artery** — `planned`. `gross__arm__brachial-artery` · Gross Anatomy · Arm (Brachium) ·
  diagram · 17 parts + 6 context · **planned**. *(amended by the audit of 2026-08-28: the radial nerve added
  as a drawn context region, because beat 5 asked the student to read four things across the cubital fossa
  and only three were authored.)* Routed to its deferred `diagram` mode. The catalog holds
  **no brachial artery and none of its branches** — brachial, profunda, collateral, recurrent, radial
  artery and ulnar artery all return nothing across the 934 entries, and the nearest arterial models in the
  whole limb are the two subclavian arteries, two name-changes proximal. Same absence that sent the
  axillary artery to `diagram` in run 6, so the same treatment. Three course segments (upper, middle,
  lower), four named branches plus muscular, the two terminal branches, the median and ulnar nerves and the
  venae comitantes as relations, the elbow anastomosis as one region, and two clinical regions. Seven
  beats, 39 ops: start and stop traced with `concept:arterial_blood` from teres major to the two terminal
  vessels; medial-to-anterior course over triceps, coracobrachialis, brachialis; the median nerve crossing
  lateral-front-medial; the branches tied to the segment that gives them, with the two that carry a nerve
  highlighted; the cubital fossa contents read out under a peeled bicipital aponeurosis (My Blood Turns
  Red); collateral flow round the elbow and the safe level of ligation; and the pulse and the supracondylar
  fracture as two consequences of one relation. `covers` is `["Brachial artery"]`.
- **Median, ulnar & radial nerves** — `planned`. `gross__arm__median-ulnar-radial-nerves` · Gross Anatomy ·
  Arm (Brachium) · diagram · 19 parts + 4 context · **planned**. Routed to `diagram` for the reason run 6
  recorded for the plexus: the only nerve models in the catalog are the right and left optic nerves.
  Thirteen nerve structures, zero resolvable. Each nerve authored in three stages — arm, elbow, wrist for
  the median and ulnar; axilla, radial groove, elbow for the radial — plus three motor-territory regions,
  three sensory-territory regions and four lesions. Seven beats, 33 ops: the three courses at a glance;
  one trace per nerve, with the arm turned round for the radial; what each nerve moves; where each nerve
  feels, with the three autonomous test points; and a closing beat that reads a deformed hand backwards to
  the nerve and the level. Deliberately does **not** repeat the run-8 humerus scene's radial-nerve beat,
  which already traces that nerve in 3D along measured bony waypoints; this scene is the half that bone
  cannot carry. `covers` is `["Median, ulnar & radial nerves"]`.

## Run 2026-08-26 (run 10) — the forearm, where the catalog finally cooperates
- **Flexor compartment of forearm** — `ready`. `gross__forearm-hand__flexor-compartment` · Gross Anatomy ·
  Forearm & Hand · 3d_anatomy · 11 parts + 17 context · **ready**. *(2026-08-28: the nine phalanges of the index, ring and little fingers added, so beats 7 and 8 show the four-tendon fan on all four digits instead of one.)* *(2026-08-29 audit: those meshes have since arrived — the scene draws **28/28** and both beats render on all four digits; the two gap notes claiming otherwise, and a third saying the interosseous membrane still needed adding when it was already authored, were stale and are corrected. Beat 2's "all from the medial epicondyle" contradicted the scene's own ulnar and humeral head narrations and now names the two second heads explicitly.)* The first fully resolvable scene since
  the humerus: every muscle of all three flexor layers exists in the catalog. Superficial four (pronator
  teres by its humeral and ulnar heads, flexor carpi radialis, palmaris longus, flexor carpi ulnaris by its
  humeral and ulnar heads), the middle layer alone (flexor digitorum superficialis by its humeroulnar and
  radial heads), and the deep three (flexor digitorum profundus, flexor pollicis longus, pronator
  quadratus). Context is humerus, radius, ulna, third metacarpal, the flexor retinaculum, and — the reason
  this scene teaches rather than lists — the middle and distal phalanges of the middle finger, so the one
  fact that separates superficialis from profundus is a visible insertion rather than a sentence. Ten
  beats, 37 ops: the compartment whole; then layer one, layer two and layer three peeled in order; a
  transverse cut showing the layers stacked; radial versus ulnar wrist pull; superficialis versus profundus
  read off their two phalanges; profundus traced from the ulna under the retinaculum to the distal phalanx;
  the retinaculum peeled to show the crowd of tendons that becomes the carpal tunnel; and the two pronators
  gripping the radius. `covers` is `["Flexor compartment of forearm"]`.
- **Extensor compartment of forearm** — `ready`. `gross__forearm-hand__extensor-compartment` · Gross
  Anatomy · Forearm & Hand · 3d_anatomy · 13 parts + 8 context · **ready**. Superficial six
  (brachioradialis, extensor carpi radialis longus and brevis, extensor digitorum, extensor digiti minimi,
  extensor carpi ulnaris by both heads) and deep five (supinator, abductor pollicis longus, extensor
  pollicis brevis and longus, extensor indicis), plus anconeus, which beat 2 now lights faintly and names
  as belonging to the compartment but not to the six. Context carries the snuffbox: scaphoid and
  trapezium as its floor, first, second and fifth metacarpals as the insertion targets that make wrist
  deviation obvious. Nine beats, 45 ops: the compartment from behind; superficial group; deep group; the
  three thumb muscles winding to the radial side; the snuffbox with its two borders compared and its floor
  lit; extensor carpi radialis longus versus ulnaris landing on opposite sides of the hand; supinator
  traced as it wraps the radius; a transverse cut; and a closing peel of the muscle layer down to the two
  bones. `covers` is `["Extensor compartment of forearm"]`.

- **Radius & ulna** — `ready`. `gross__forearm-hand__radius-ulna` · Gross Anatomy · Forearm & Hand ·
  3d_anatomy · 13 parts (2 bones, the interosseous membrane, and **10 derived landmark anchors**) + 9
  context · **ready**. The two bones themselves are the only osteology meshes the catalog holds for the
  forearm, so every named feature — head of radius, radial tuberosity, ulnar notch, radial styloid,
  olecranon, trochlear notch, coronoid process, radial notch, head of ulna, ulnar styloid — was measured on
  the meshes by the new `tools/derive-forearm-landmarks.mjs` and authored as a `uvw` anchor carrying the
  measurement that placed it. Context is humerus (trochlea and capitulum), scaphoid and lunate (the wrist
  joint the radius alone makes), and the five muscles that turn the forearm: supinator, both heads of
  biceps, both heads of pronator teres, pronator quadratus. Ten beats, 49 ops: both bones together; which
  is which by their opposite ends; the elbow end where the ulna does the work; the wrist end where the
  radius does; the three links between them; the turning axis traced from radial head to ulnar head;
  pronation; supination; a transverse cut through both shafts and the membrane; and a closing beat on
  Colles, Smith, Monteggia and Galeazzi. One honest negative recorded: **on these meshes the ulna reaches
  0.8 mm further distally than the radial styloid**, so the ~1 cm styloid step is taught but must not be
  measured off the model. `covers` is `["Radius & ulna"]`.
- **Carpal tunnel** — `ready`. `gross__forearm-hand__carpal-tunnel` · Gross Anatomy · Forearm & Hand ·
  3d_anatomy · 23 parts + 5 context · **ready**. Roof (flexor retinaculum), the four pillars as whole bones
  (scaphoid and trapezium laterally, pisiform and hamate medially) with three measured landmark anchors on
  their retinacular attachments (scaphoid tubercle 0.45 mm, trapezium tubercle 0.20 mm, hook of hamate
  2.80 mm; the pisiform needs none), the floor (lunate, capitate, triquetral,
  trapezoid), the four muscles whose nine tendons pass through, the four thenar muscles, and the three
  tendons that pass outside. Ten beats, 45 ops: where the tunnel is; the arch of the carpus; the four
  pillars compared as proximal and distal pairs; the lid going on; the transverse section every exam draws;
  the nine tendons counted; the median nerve as a traced `concept:median_nerve` path — the catalog holds no
  nerve mesh — from behind superficialis, under the retinaculum, to the thenar muscles; what passes outside
  and why the little finger is spared; the retinaculum peeled, which is the operation; and the two findings
  the anatomy predicts, palmar sparing and the ulnar deep head of flexor pollicis brevis. `covers` is
  `["Carpal tunnel"]`.

## Run 2026-08-27 (run 12) — the hand finished, then out of the upper limb

- **Intrinsic hand muscles & arches** — `ready`. `gross__forearm-hand__intrinsic-hand-muscles-arches` ·
  Gross Anatomy · Forearm & Hand · 3d_anatomy · 13 parts + 16 context · **ready**. *(2026-08-29 audit: flexor digitorum profundus FMA38479 added as the one extrinsic in the scene, because beat 6 traced the lumbricals from a tendon that was not on screen; beats 2 and 11 disagreed with the scene's own fpb_deep narration about whether the deep head of flexor pollicis brevis is median or ulnar, and now both say ulnar.)* All five intrinsic
  groups: thenar (abductor pollicis brevis, opponens pollicis, both heads of flexor pollicis brevis),
  hypothenar (abductor, flexor and opponens digiti minimi), adductor pollicis by both heads, and the deep
  palm as the catalog holds it — **lumbricals, palmar interossei and dorsal interossei are single meshes
  for a whole set**, so no individual interosseous can be lit, and the scene says so rather than pretending
  otherwise. Context is the skeleton grouped as the three arches: carpal bones and the flexor retinaculum
  as the proximal transverse arch, all five metacarpals as the distal transverse arch, all five proximal
  phalanges as the longitudinal arches. Twelve beats, 55 ops: the five groups; the thenar eminence; the
  hypothenar eminence; adductor pollicis shown *not* to be thenar; PAD and DAB compared from behind; the
  lumbrical traced from flexor tendon to extensor expansion, in front of one joint and behind the next; a
  transverse cut through the palmar compartments; the three arches seen from below; grip as the arches
  closing; both palmar arterial arches as traced `concept:` paths — no artery of the hand exists as a mesh;
  the ulnar nerve's ownership of the palm counted out against the median's three thenar muscles; and the
  ulnar claw, with the paradox that a wrist lesion claws worse than an elbow lesion. `covers` is
  `["Intrinsic hand muscles & arches"]`.
- **Gluteus maximus** — `ready`. `gross__gluteal-region-hip-joint__gluteus-maximus` · Gross Anatomy ·
  Gluteal Region & Hip Joint · 3d_anatomy · 15 parts + 3 context · **ready** · audited 2026-08-29. The muscle itself, its two
  insertions (iliotibial tract and the gluteal tuberosity of the femur), tensor fasciae latae as the front
  half of the same sling, gluteus medius and minimus as the abductors underneath, the full stack of short
  lateral rotators (piriformis, gemellus superior, obturator internus, gemellus inferior, quadratus
  femoris, obturator externus), and three hip extensors that are *not* gluteal — long head of biceps
  femoris, semitendinosus, adductor magnus. Twelve beats, 58 ops: the shape of the buttock and why the
  gluteal fold is not the muscle border; the origin traced along ilium and sacrum; the split insertion
  traced through to the femur; the iliotibial sling compared with tensor fasciae latae; the contraction
  filter that makes the exam point — silent on level ground, firing to rise, climb and run; lateral
  rotation compared against medius and minimus rotating the other way; the maximus lifted off to show
  piriformis as the key to the foramen; the sciatic nerve as a traced `concept:sciatic_nerve` path across
  the rotators; a section showing how deep the fat is before a needle reaches muscle; the upper outer
  quadrant, with the greater trochanter lit as a measured anchor and the other three quadrants now
  distinguished correctly (sciatic nerve below, superior gluteal vessels above and medial); inferior versus superior gluteal palsy told apart by watching the patient walk; and a closing
  four-layer peel. `covers` is `["Gluteus maximus"]` only — Hip joint, Proximal femur, Sciatic nerve and
  Gluteal vessels are explicitly *not* claimed and are named in `gaps`.

### `gross__gluteal-region-hip-joint__hip-joint`
- **id** `gross__gluteal-region-hip-joint__hip-joint` · **course** Gross Anatomy · **topic** Gluteal Region &
  Hip Joint · **structure** Hip joint · **mode** `3d_anatomy` (deferred: `diagram`) · **26 structures
  (24 parts) · 13 views · 58 ops** · **status `ready`**.
- Every model resolved from the catalog: right hip bone FMA16586 and right femur FMA24474 as the two bones
  of the joint, sacrum FMA16202 and right inguinal ligament FMA21964 as context, then the muscles grouped by
  the movement they produce — Flexors (psoas major, iliacus, rectus femoris, sartorius, pectineus),
  Abductors (tensor fasciae latae, gluteus medius, gluteus minimus), Adductors (adductor longus, brevis,
  magnus, gracilis), Extensors (gluteus maximus, long head of biceps femoris, semitendinosus,
  semimembranosus) and the six Lateral rotators. Thirteen beats: locating a joint you can never palpate;
  the bones stripped to a ball in a deep cup and compared with the shoulder; a section through the lunate
  surface, fossa and labrum; a second section showing the capsule reaching the intertrochanteric line in
  front but only mid-neck behind; the three spiral ligaments that lock the hip in standing; the weight path
  traced sacrum → hip bone → femur as `concept:body_weight`; four movement beats comparing group against
  group by nerve; obturator externus highlighted as the one rotator that passes *under* the neck; the
  capsule's neighbours side by side; posterior dislocation with `concept:sciatic_nerve` traced behind the
  joint and the shortened-adducted-medially-rotated limb; hip pain referred to the knee through the shared
  femoral / obturator / sciatic supply; and a closing five-layer peel.
- `covers` is `["Hip joint"]` only. Proximal femur, Sciatic nerve and Gluteal vessels are explicitly not
  claimed. `gaps` records the eight things the catalog cannot show — above all the capsule, the three named
  ligaments, the labrum and the ligament of the head.

### `gross__gluteal-region-hip-joint__proximal-femur`
- **id** `gross__gluteal-region-hip-joint__proximal-femur` · **course** Gross Anatomy · **topic** Gluteal
  Region & Hip Joint · **structure** Proximal femur · **mode** `3d_anatomy` (deferred: `diagram`) ·
  **23 structures (21 parts) · 11 views · 46 ops** · **status `ready`** · audited 2026-08-29.
- Right femur FMA24474 is the subject; right hip bone FMA16586 the frame. Muscles are grouped by the
  landmark they attach to rather than by action — On the greater trochanter (piriformis, gluteus medius,
  gluteus minimus, obturator internus, both gemelli, obturator externus), On the intertrochanteric crest
  (quadratus femoris), On the lesser trochanter (psoas major, iliacus), On the shaft (gluteus maximus, the
  three vasti) — which is what makes the closing recitation beat work. Vessels are the two parent trunks
  the catalog does hold: right external iliac artery FMA18806, right internal iliac artery FMA18809, right
  external iliac vein FMA18885. Eleven beats: the one palpable landmark; the six names on the bone from in
  front and again from behind; neck-shaft angle and anteversion seen from above; a section on trabeculae,
  the calcar femorale and Ward's triangle; the arterial chain external iliac → femoral → profunda →
  circumflex femoral; `concept:retinacular_arteries` traced through the plane between quadratus femoris and
  obturator externus onto the neck; `concept:foveolar_artery` traced from the internal iliac as the supply
  that cannot save the head; intracapsular versus extracapsular and the two different operations; the
  muscle-by-muscle explanation of the shortened, externally rotated limb; and the attachment recitation.
- `covers` is `["Proximal femur"]` only. `gaps` is heavy by design: no femoral artery, no profunda, no
  circumflex femoral or obturator arteries, no capsule, no ligament of the head, and no separate head /
  neck / trochanter meshes.
- **Amended 2026-08-29 (audit).** Four measured landmark anchors added on FMA24474, closing the gap the
  scene itself called "the strongest case in the corpus for measured landmark anchors": **greater
  trochanter** (three witnesses — gluteus medius, minimus, piriformis — scattered 4.6% of the bone),
  **trochanteric fossa** (obturator externus, 0.23 mm), **quadrate tubercle** (quadratus femoris,
  0.02 mm), **lesser trochanter** (psoas major, 0.87 mm; iliacus rejected as a second witness for 17.7%
  scatter). All `render:"anchor"`, all `status:"needs-review"`, each carrying its measurement and its
  refusals in `calibrated_by`. Five features were deliberately NOT anchored and the reasons are now in
  `gaps[]` — the **gluteal tuberosity** measurement is clean and anatomically wrong (glutes maximus's
  nearest point is a third of the way down the shaft), and the fovea, intertrochanteric line and crest are
  ridges, which neither of `derive-landmark.mjs`'s definitions describes. Beat 2's narration said "learn
  these six names" while naming seven, and named the trochanteric fossa over an *anterior* view of a bone
  whose fossa faces posteromedially; the fossa moved to beat 3, which is the posterior view.

## Run 2026-08-27 (run 13) — the gluteal region finished, both subjects unmodelled

Cursor-driven (no DEMAND.json on disk). `Sciatic nerve`, then `Gluteal vessels` — the last two entries of
`Gluteal Region & Hip Joint`, and the topic is now fully authored. Neither subject has a model: the catalog
holds no nerve of the lower limb and no branch of the internal iliac artery. Both were nevertheless authored
as `3d_anatomy` rather than dropped to the diagram backlog, because in both cases the *teaching* is the
relations, and the relations resolve. Both are `candidate`, not `ready` — see the runlog for why.

### `gross__gluteal-region-hip-joint__sciatic-nerve`
- id `gross__gluteal-region-hip-joint__sciatic-nerve` · Gross Anatomy · Gluteal Region & Hip Joint ·
  **Sciatic nerve** · mode `3d_anatomy` (deferred: `diagram`) · 30 structures (25 parts) · 12 views ·
  69 ops · **candidate** · degrades `PEEL_LAYER` · audited 2026-08-29.
- The nerve itself is `concept:sciatic_nerve`, traced across the four beds it actually lies on — gemellus
  superior, the tendon of obturator internus, gemellus inferior, quadratus femoris — every one of them a
  real model. Roof `right gluteus maximus` FMA22328. Gateway `right piriformis` FMA22340. Frame
  `right hip bone` FMA16586, `sacrum` FMA16202, `right femur` FMA24474, `right fibula` FMA24480.
- The two divisions are taught by lighting the muscles they supply, which is the only way to teach them
  without a nerve model and is arguably the better way regardless. Tibial: `long head of right biceps
  femoris` FMA45888, `right semitendinosus` FMA22358, `right semimembranosus` FMA22448, `right adductor
  magnus` FMA22459, `medial head of right gastrocnemius` FMA45957, `right soleus` FMA22558, `right tibialis
  posterior` FMA65018, `right flexor digitorum longus` FMA65016. Common fibular: `short head of right
  biceps femoris` FMA45891, `right tibialis anterior` FMA22544, `right extensor digitorum longus` FMA22548,
  `right extensor hallucis longus` FMA22546, `right fibularis longus` FMA22552, `right fibularis brevis`
  FMA22554.
- Twelve beats: out below piriformis and the one-in-ten variation; lift the roof; the four beds in order as
  a traced path; the two-point surface marking; down the back of the thigh under the long head of biceps;
  the two divisions compared side by side; the short head of biceps as the one muscle above the knee that
  breaks the rule; foot drop traced round the neck of the fibula; the complete lesion and the flail foot;
  the three ways it is damaged; sciatica as a root problem and not a trunk one; and a cross-section
  counting the layers a needle passes.
- `covers` is `["Sciatic nerve"]` only. (**Re-corrected 2026-08-29 (audit).** An earlier entry on this line
  changed it to `["Hip joint"]` and claimed "the scene file has always said `["Hip joint"]`". The scene file
  has never said that; it says `["Sciatic nerve"]`, which is also what CURRICULUM.json spells and what
  `sync-state.mjs` matches against. The "correction" was made from memory rather than from the file — the
  third failure mode in REPAIR-BACKLOG.md — and it is reversed here against the file itself.)
- **Audit 2026-08-29.** Five measured landmark anchors added: ischial tuberosity (semitendinosus + long head
  of biceps, 12.7% scatter; adductor magnus rejected — the tool refused at 67.7 mm), ischial spine (gemellus
  superior, 0.05 mm), posterior superior iliac spine (extreme +y in the upper quarter), greater trochanter
  (the same three-witness contact the proximal femur scene uses, deliberately identical), and neck of the
  fibula (fibularis longus + extensor digitorum longus, 27.7 mm below the fibular tip — flagged in its own
  `calibrated_by` as a measured point at neck level, not a measured neck). Beat 4 said "two bony points give
  you the line" and then named three; corrected. The greater sciatic notch was deliberately not anchored —
  a notch is defined by absent bone, which neither definition in `derive-landmark.mjs` can measure.

### `gross__gluteal-region-hip-joint__gluteal-vessels`
- id `gross__gluteal-region-hip-joint__gluteal-vessels` · Gross Anatomy · Gluteal Region & Hip Joint ·
  **Gluteal vessels** · mode `3d_anatomy` (deferred: `diagram`) · 19 structures (12 parts) · 10 views ·
  53 ops · **candidate** · no degraded ops · audited 2026-08-29. Two measured landmark anchors on
  FMA24474 added in that audit — greater trochanter and lesser trochanter (contact with psoas major);
  `concept:retinacular_vessels` now runs from the trochanter anchor rather than from quadratus
  femoris, which is the cruciate site, not the trochanteric one. **Amended 2026-08-29 (later audit):** the
  greater trochanter anchor was re-derived from the extreme definition to the three-witness contact
  definition so that it is the same coordinate as in `proximal-femur` and `sciatic-nerve`. The topic now
  marks that landmark in one place in all three scenes.
- Taught through the parent vessel that does exist: `right internal iliac artery` FMA18809, with
  `right common iliac artery` FMA14765, `right external iliac artery` FMA18806, `descending aorta` FMA3784,
  `right internal iliac vein` FMA18887 and `right common iliac vein` FMA21387. Territory and floor from the
  same models as the sciatic scene, plus `right gluteus medius` FMA22330, `right gluteus minimus` FMA22332
  and `right tensor fasciae latae` FMA22425.
- Five concept traces carry what has no model: `concept:superior_gluteal_artery`,
  `concept:inferior_gluteal_artery`, `concept:internal_pudendal_artery`, `concept:retinacular_vessels`,
  `concept:gluteal_veins`.
- Ten beats: where the blood comes from; two divisions and two arteries; above piriformis with its
  superficial and deep branches; below piriformis in a crowd of six structures; the internal pudendal
  artery that only passes through; the trochanteric anastomosis and avascular necrosis of the femoral head;
  the cruciate anastomosis as a collateral route from internal iliac to femoral; why a torn superior
  gluteal artery in a pelvic fracture cannot be compressed; artery and nerve sharing one territory; and the
  veins going back the same way into a valveless plexus.
- `covers` is `["Gluteal vessels"]` only.

### `gross__thigh__quadriceps-femoris`
- id `gross__thigh__quadriceps-femoris` · Gross Anatomy · Thigh · **Quadriceps femoris** ·
  mode `3d_anatomy` (deferred: `diagram`) · 12 structures (8 parts) · 11 views · 52 ops · **ready** ·
  degrades `PEEL_LAYER`.
- Every head resolved: `right rectus femoris` FMA38928, `right vastus lateralis` FMA38930,
  `right vastus medialis` FMA38932, `right vastus intermedius` FMA38934. Extensor mechanism through
  `right patella` FMA24486 to `right tibia` FMA24477. Neighbours and comparison from `right sartorius`
  FMA22354, `right psoas major` FMA22342, `right iliacus` FMA22322 and `right iliotibial tract` FMA58776;
  bony frame `right femur` FMA24474, `right hip bone` FMA16586, `right tibia` FMA24477.
- One concept trace carries what has no model: `concept:femoral_nerve`, from psoas major through iliacus
  and under the inguinal ligament to sartorius and the quadriceps.
- Eleven beats: the compartment as one muscle; naming the four heads in order; where each head starts and
  the one that starts on the pelvis; rectus femoris traced across two joints; four heads into one tendon
  and the extensor mechanism; a mid-thigh cross-section putting vastus intermedius on the bone; what
  contraction does, including lowering under load; the Q angle and why vastus medialis checks it; the
  femoral nerve traced with the NAVEL order; the femoral lesion and the lost knee jerk; and a layer peel
  giving the dissection order.
- `covers` is `["Quadriceps femoris"]` only — the femur, hip bone and tibia are context, and the scene
  says so in `gaps[]`.
- **Audited 2026-08-30**: 12 ids and names verified character-for-character, all right-sided; required
  curriculum views `location` and `contraction_filter` both present; no anatomical error found. The
  absence claims in `gaps[]` were re-tested against the catalog rather than trusted — articularis genu,
  quadriceps tendon, patellar ligament, femoral artery/vein, femoral nerve and the bursae are all
  genuinely absent (the only nerves in 934 meshes are the two optic nerves). Added one missed gap: the
  great saphenous vein is recited in the beat-11 dissection order and has no mesh.

### `gross__thigh__hamstrings`
- id `gross__thigh__hamstrings` · Gross Anatomy · Thigh · **Hamstrings** · mode `3d_anatomy`
  (deferred: `diagram`) · 15 structures (9 parts) · 12 views · 62 ops · **ready** · degrades `PEEL_LAYER`.
- Carries the adductor tubercle as a measured anchor on `right femur` FMA24474 (adductor magnus contact,
  0.49 mm), added 2026-08-30 when the same false "sub-feature, not measurable" note was cleared from
  `gaps[]`. **Audited 2026-08-30**: all 14 ids and names verified against the catalog, every structure
  right-sided and consistent. One correction — the semitendinosus card called its tendon "the more
  lateral of the two you feel medially"; semimembranosus is palpable on either side of it, so the card
  now says the more superficial and prominent, which agrees with the semimembranosus card describing
  itself as lying deep to it. Two absence claims added to `gaps[]` after re-searching the catalog under
  several spellings (fascia lata / intermuscular septa; searched fascia, fasciae latae, tract, septum).
- Both heads of biceps femoris exist separately, which is what makes the defining exception teachable:
  `long head of right biceps femoris` FMA45888 and `short head of right biceps femoris` FMA45891, with
  `right semitendinosus` FMA22358, `right semimembranosus` FMA22448 and `right adductor magnus` FMA22459
  as the hybrid fourth extensor. Pes anserinus from `right gracilis` FMA43883 and `right sartorius`
  FMA22354; `right gluteus maximus` FMA22328 overlying; popliteal borders from
  `medial head of right gastrocnemius` FMA45957 and `lateral head of right gastrocnemius` FMA45960; bony
  frame `right hip bone` FMA16586, `right femur` FMA24474, `right tibia` FMA24477, `right fibula` FMA24480.
- One concept trace: `concept:sciatic_nerve`, down the compartment and on to the neck of the fibula.
- Twelve beats: three muscles and four bellies; the common ischial origin with its two facets; the short
  head compared with the long head as the head that fails all three tests; the lateral and medial
  insertions; the goose's foot and its three nerves; hip extension and knee flexion with the straight leg
  raise; rotation of the flexed knee; the sciatic nerve traced and split into its two divisions; a
  cross-section with adductor magnus as the floor; the popliteal diamond; why a two-joint muscle tears in
  sprinting and avulses in an adolescent; and a layer peel giving the dissection order.
- `covers` is `["Hamstrings"]` only — not Popliteal fossa, not Sciatic nerve, not Gluteus maximus.

### `gross__thigh__femoral-triangle`
- id `gross__thigh__femoral-triangle` · Gross Anatomy · Thigh · **Femoral triangle** · mode `3d_anatomy`
  (deferred: `diagram`) · 15 structures (11 parts) · 12 views · 57 ops · **ready** · degrades `PEEL_LAYER`
  · audited 2026-08-30.
- Three measured landmark anchors on `right hip bone` FMA16586, added at the 2026-08-30 audit after the
  "not measured in this run" note in `gaps[]` was found to be stale (the mesh was on disk all along):
  ASIS (inguinal-ligament contact 0.09 mm, sartorius witness 9.9 mm away, same coordinate as
  `bony-pelvis`), pubic tubercle (0.52 mm, ligament's medial end within the lower third of the bone;
  134 mm from the ASIS), pecten pubis (pectineus contact patch, `--area 3`, 13 mm lateral to the
  tubercle). All three `needs-review`.
- Boundaries: `right inguinal ligament` FMA21964 (base), `right sartorius` FMA22354 (lateral),
  `right adductor longus` FMA22456 (medial). Floor: `right psoas major` FMA22342, `right iliacus` FMA22322,
  `right pectineus` FMA22450. Contents: `right external iliac artery` FMA18806 and
  `right external iliac vein` FMA18885 — the femoral vessels resolved through the vessel they are
  continuous with, which is resolution option (b), an adjacent structure that exists, not a substitution.
  The labels say so on screen. Context: `right femur` FMA24474, `right hip bone` FMA16586,
  `right vastus medialis` FMA38932, `right adductor brevis` FMA22452.
- Two concept traces: `concept:femoral_nerve` from psoas through the psoas–iliacus groove and under the
  ligament, and `concept:inguinal_lymph_drainage` for the superficial and deep groups and Cloquet's node.
- Twelve beats: find the hollow; the three boundaries in base–lateral–medial order; where sartorius crosses
  adductor longus to make the apex; the floor from lateral to medial; NAVEL; the artery traced from behind
  the mid-inguinal point to the apex with the profunda origin named; artery-and-vein relations changing
  from base to apex; the nerve traced on the floor outside the sheath; a sliding cross-section from
  ligament to apex; the femoral canal, the four walls of the ring and the pubic-tubercle rule that
  separates a femoral from an inguinal hernia; groin lymph drainage and what it obliges you to examine;
  and a layer peel giving the dissection order.
- `covers` is `["Femoral triangle"]` only. No lymph node entry is claimed — nothing lymphatic is modelled
  anywhere in the catalog and `gaps[]` says so.

### `gross__thigh__adductor-canal`
- id `gross__thigh__adductor-canal` · Gross Anatomy · Thigh · **Adductor canal** · mode `3d_anatomy`
  (deferred: `diagram`) · 11 structures (7 parts) · 10 views · 50 ops · **ready** · degrades `PEEL_LAYER`.
- **Audited 2026-08-29.** Ids, names, sides, ops, covers and curriculum views all clean on read-back; the
  two required views (`cross_section`, `associated_organs`) are present. One anchor added: the **adductor
  tubercle** on the femur, measured where adductor magnus meets the bone (0.49 mm, stable under two slab
  restrictions, 25 mm above the medial epicondyle), replacing the old note that it could only be named.
  Two derivations recorded as rejected in `gaps[]` — the apex of the femoral triangle (definition wrong,
  answer wanders 24 mm with method) and the adductor hiatus (a hole is not a point on either boundary).
- Walls: `right vastus medialis` FMA38932 (anterolateral), `right adductor longus` FMA22456 (posterior,
  upper), `right adductor magnus` FMA22459 (posterior, lower, and the muscle that owns the hiatus),
  `right sartorius` FMA22354 (roof). Contents: `right external iliac artery` FMA18806 and
  `right external iliac vein` FMA18885, resolved the same way as in the femoral triangle scene. Context:
  `right femur` FMA24474, `right adductor brevis` FMA22452, `right gracilis` FMA43883,
  `right tibia` FMA24477.
- One concept trace: `concept:saphenous_nerve` — in lateral to the artery, across its front, through the
  roof, and down the medial side of the leg to the medial malleolus.
- Ten beats: where the tunnel is; three walls and a roof; lifting sartorius off it as the surgeon does;
  a sliding cross-section showing the triangular tunnel open and close; the four contents; the vessels
  swapping places across triangle, canal and popliteal fossa; the artery traced out through the adductor
  hiatus to become popliteal; the saphenous nerve as the one content that pierces the roof; why a canal
  block spares the quadriceps and a femoral block does not; and a layer peel giving the dissection order.
- `covers` is `["Adductor canal"]` only — not Femur, not Quadriceps femoris, and `gaps[]` says so.

## Run 2026-08-27 (run 17) — the Thigh closed, then into the leg

### `gross__thigh__femur`
- id `gross__thigh__femur` · Gross Anatomy · Thigh · **Femur** · mode `3d_anatomy` (deferred: `diagram`) ·
  21 structures (15 parts) · 11 views · 41 ops · **ready** · degrades `PEEL_LAYER` · audited 2026-08-30.
- Two measured landmark anchors on the femur, added at the 2026-08-30 audit to clear the backlog item that
  said two signed scenes were still calling the adductor tubercle unmeasurable: adductor tubercle
  (adductor magnus contact, 0.49 mm, stable under `--slab z:0,0.15`) and medial epicondyle
  (`--extreme +x --slab z:0,0.15`), 33 mm apart and 25 mm of that vertical. Both `needs-review`; both lit
  in beat 4.
- Subject `right femur` FMA24474. Joints above and below from `right hip bone` FMA16586, `right patella`
  FMA24486, `right tibia` FMA24477, `right fibula` FMA24480. Everything that pulls on the shaft, resolved
  one by one: `right vastus lateralis` FMA38930, `right vastus medialis` FMA38932, `right vastus
  intermedius` FMA38934, `right adductor longus` FMA22456, `right adductor brevis` FMA22452, `right
  adductor magnus` FMA22459, `right pectineus` FMA22450, `short head of right biceps femoris` FMA45891,
  `right gluteus maximus` FMA22328, `right popliteus` FMA22591, `medial head of right gastrocnemius`
  FMA45957, `lateral head of right gastrocnemius` FMA45960, `right psoas major` FMA22342, `right
  iliotibial tract` FMA58776.
- Two concept traces carry what no surface model can show: `concept:medullary_cavity` and
  `concept:nutrient_artery`.
- Eleven beats: one bone hip to knee; the bone alone from in front, deliberately featureless; the linea
  aspera from behind and how its two lips run up into the gluteal tuberosity and the spiral line and down
  into the supracondylar lines; the lower end from below with the condyles and the intercondylar fossa;
  everything that pulls on the shaft; a sliding cut showing the shaft is a tube and not a rod; what is in
  the medullary cavity and why a shaft fracture can embolise fat; the nutrient artery and the two blood
  supplies of a long bone; the three compartments arranged round the ridge; the predictable deformity,
  the hidden litre of blood, and the popliteal artery at the lowest fragment; and a layer peel down to
  cortex.
- `covers` is `["Femur"]` only — **not** `Proximal femur`, which `gross__gluteal-region-hip-joint__
  proximal-femur` already holds. The upper end and the retinacular supply are deliberately not repeated,
  and `gaps[]` says so.

### `gross__leg-foot__gastrocnemius-soleus`
- id `gross__leg-foot__gastrocnemius-soleus` · Gross Anatomy · Leg & Foot · **Gastrocnemius & soleus** ·
  mode `3d_anatomy` (deferred: `diagram`) · 16 structures (6 parts) · 11 views · 54 ops · **ready** ·
  degrades `PEEL_LAYER`. Audited 2026-08-29: the popliteal artery was said twice to pass under the
  tendinous arch of soleus; it ends at the lower border of popliteus and it is the posterior tibial
  that passes under the arch. Both sentences corrected, and the stale gap note claiming the
  interosseous membrane still needed authoring here was retired.
- Both heads exist as separate meshes and so does the muscle beneath and the tendon they share:
  `medial head of right gastrocnemius` FMA45957, `lateral head of right gastrocnemius` FMA45960,
  `right soleus` FMA22558, `right plantaris` FMA22560, `right calcaneal tendon` FMA258847. Insertion on
  `right calcaneus` FMA24497. Frame from `right talus` FMA24482, `right tibia` FMA24477, `right fibula`
  FMA24480, `right femur` FMA24474. Deep compartment for the cross-section from `right popliteus`
  FMA22591, `right tibialis posterior` FMA65018, `right flexor digitorum longus` FMA65016, `right flexor
  hallucis longus` FMA65014; antagonist `right tibialis anterior` FMA22544.
- Two concept traces: `concept:tibial_nerve` and `concept:venous_blood` — the calf pump, which is the
  physiological point of the entry and has no mesh anywhere in the catalog.
- Eleven beats: the calf as the superficial posterior compartment; two heads on the femur and the floor of
  the popliteal fossa; lifting gastrocnemius off to find soleus and its two origins below the knee; the
  three bellies traced into one tendon on the calcaneus; what plantarflexion does and why the heel is a
  lever; fast muscle against slow muscle and why a bent knee tests soleus; the tibial nerve under the
  tendinous arch and the S1 ankle jerk; the soleal sinuses as a pump and where a DVT begins; a cut across
  the calf showing two posterior compartments in a closed fascial box; the ruptured tendon and why the
  calf-squeeze test beats asking the patient to push; and a layer peel giving the dissection order.
- `covers` is `["Gastrocnemius & soleus"]` only — not `Popliteal fossa`, not `Ankle joint`, not
  `Tibia & fibula`, and `gaps[]` says so.

## Run 2026-08-27 (run 18) — the two leg bones, then the joint they make

### `gross__leg-foot__tibia-fibula`
- id `gross__leg-foot__tibia-fibula` · Gross Anatomy · Leg & Foot · **Tibia & fibula** · mode `3d_anatomy`
  (deferred: `diagram`) · 21 structures (16 parts) · 12 views · 46 ops · **ready** · degrades `PEEL_LAYER`
  · audited 2026-08-29. Four measured anchors added — medial malleolus and soleal line on the tibia, lateral
  malleolus and apex of the fibular head on the fibula, all `needs-review`. Corrections at audit: "four
  nerves" for four compartments (the tibial nerve serves both posterior compartments, so three), the lateral
  malleolus descends about one centimetre lower than the medial and not two, and the fibular attachment count
  is eight origins plus biceps femoris inserting on the head. Fibularis tertius `FMA22550` exists in the
  catalog but not in `meshes-lite/`; it is named as described-not-shown and recorded in `gaps[]`.
- Subjects `right tibia` FMA24477 and `right fibula` FMA24480. **The interosseous membrane exists** —
  `interosseous membrane of right leg` FMA35192 — contrary to the note left by the previous run, which
  assumed it absent without looking. It is authored as a `part`, not narration, and it carries the whole
  weight-bearing-bone-against-strut idea the pairing is for. Joints above and below from `right femur`
  FMA24474, `right patella` FMA24486, `right talus` FMA24482, `right calcaneus` FMA24497. Compartments
  resolved one by one: anterior `right tibialis anterior` FMA22544, `right extensor hallucis longus`
  FMA22546, `right extensor digitorum longus` FMA22548; lateral `right fibularis longus` FMA22552, `right
  fibularis brevis` FMA22554; superficial posterior `right soleus` FMA22558 with `medial head of right
  gastrocnemius` FMA45957 as cover; deep posterior `right tibialis posterior` FMA65018, `right flexor
  digitorum longus` FMA65016, `right flexor hallucis longus` FMA65014.
- One concept trace: `concept:nutrient_artery` along the tibia — the largest nutrient artery in the body
  relative to its bone, and the reason the junction of middle and lower thirds unites slowly.
- Twelve beats: the division of labour between the two bones; the tibia from the front with tuberosity,
  anterior border and subcutaneous surface; the fibula alone, head, neck and the nerve wound round it;
  siding the bones for the practical; the three tibiofibular connections and how they differ; a cut across
  the mid-leg showing four compartments; anterior against lateral with their two nerves from one trunk; the
  deep posterior three and the order behind the medial malleolus; nine muscles on a bone that bears no
  weight and can be taken as a graft; inside the tibia, the cavity and intraosseous access; the three
  fractures to know; and a layer peel that is one line long on the medial side.
- `covers` is `["Tibia & fibula"]` only. Ankle joint, Popliteal fossa and Arches of the foot are named in
  `gaps[]` as deliberately not covered.

### `gross__leg-foot__ankle-joint`
- id `gross__leg-foot__ankle-joint` · Gross Anatomy · Leg & Foot · **Ankle joint** · mode `3d_anatomy`
  (deferred: `diagram`) · 18 structures (14 parts) · 11 views · 43 ops · **ready** · degrades `PEEL_LAYER`
  · audited 2026-08-29 (tarsal-tunnel count corrected four→five; `right fifth metatarsal bone` FMA24515
  added as `mt5` and shown in beat 9, where the avulsion check was previously named and not drawn).
- Subject `right talus` FMA24482 as the tenon; the mortise from `right tibia` FMA24477, `right fibula`
  FMA24480 and `interosseous membrane of right leg` FMA35192. Joints below from `right calcaneus` FMA24497
  and `navicular bone of right foot` FMA24500. Movers: `right calcaneal tendon` FMA258847, `right soleus`
  FMA22558, `right tibialis anterior` FMA22544, `right extensor digitorum longus` FMA22548, `right
  tibialis posterior` FMA65018, `right flexor hallucis longus` FMA65014, `right fibularis longus` FMA22552,
  `right fibularis brevis` FMA22554.
- Three concept traces, all of them ligaments or movement the catalog cannot show:
  `concept:dorsiflexion`, `concept:deltoid_ligament`, `concept:lateral_ligament_complex`.
- Eleven beats: where the joint line really is; mortise and tenon; why the two malleoli differ and what
  that does to the axis; a cut through the mortise and the clear space on an X-ray; the trochlea wider in
  front than behind, so tight in dorsiflexion and loose in plantarflexion; everything in front of the axis
  against everything behind it; the subtalar joint as the one that actually inverts; the ligaments named
  and traced but not shown; the inversion sprain and why the anterior talofibular goes first; the Pott's
  fractures decided by the position of the talus rather than the number of pieces; and a layer peel that
  ends in the tarsal tunnel.
- **Authored `ready` on bones alone**, which the previous run flagged as a judgement call. The reasoning:
  the mortise, the malleolar asymmetry, the trochlear taper, the subtalar joint and the tendon-to-axis rule
  are all genuinely visible and genuinely teachable on the meshes that exist, and they are most of what an
  MBBS ankle question asks. The ligaments are traced as concepts and stated plainly in `gaps[]` as the
  largest hole in the scene. Holding it at `candidate` would have kept a teachable scene away from students
  to protest a gap that a status badge does not fix.
- `covers` is `["Ankle joint"]` only.

**38 scenes · 27 ready · 4 candidate · 7 planned · 0 blocked · 3125 term mappings.**

## Run 2026-08-27 (run 19) — the Leg & Foot closed: the fossa with no contents, then the arch with every bone

### `gross__leg-foot__popliteal-fossa`
- id `gross__leg-foot__popliteal-fossa` · Gross Anatomy · Leg & Foot · **Popliteal fossa** · mode
  `3d_anatomy` (deferred: `diagram`) · 19 structures (14 parts) · 10 views · 40 ops · **ready** ·
  degrades `PEEL_LAYER`. Audited 2026-08-29: `fibula` was labelled "Fibula — head & neck", lighting a
  351 mm bone for a palpable point, so the head is now a measured anchor `fibular_head`
  (biceps femoris 0.30 mm, tibia at the superior tibiofibular joint 0.95 mm, agreeing to 17.7 mm),
  `status:"needs-review"`; the neck is recorded in `gaps[]` as unmeasurable. The two exit sentences
  naming the popliteal artery under the arch of soleus were corrected to the posterior tibial, and the
  medial head of gastrocnemius now takes origin from the popliteal surface above the medial condyle in
  both Leg & Foot scenes.
- **A region whose entire contents are unmodelled, authored from its walls.** Boundaries: `long head of
  right biceps femoris` FMA45888 and `short head of right biceps femoris` FMA45891 superolaterally; `right
  semimembranosus` FMA22448 and `right semitendinosus` FMA22358 superomedially; `lateral head of right
  gastrocnemius` FMA45960 with `right plantaris` FMA22560 inferolaterally; `medial head of right
  gastrocnemius` FMA45957 inferomedially. Floor: `right femur` FMA24474, `right popliteus` FMA22591,
  `right tibia` FMA24477, with `right fibula` FMA24480 for the head and neck. Doorways: `right adductor
  magnus` FMA22459 for the adductor hiatus and `right soleus` FMA22558 for the tendinous arch, plus
  `interosseous membrane of right leg` FMA35192 for the opening the anterior tibial artery leaves by.
  Context: `right patella` FMA24486, `right calcaneal tendon` FMA258847.
- Four concept traces, one per unmodelled content or vessel ring: `concept:popliteal_artery` from hiatus to
  arch, `concept:tibial_nerve` straight down the middle, `concept:common_fibular_nerve` along the biceps
  tendon to the fibular neck, `concept:genicular_anastomosis` round the knee.
- Ten beats: the diamond that is a leftover space, not a hole; the four walls named as one lateral hamstring
  against two medial ones above and two heads of one muscle below; floor in three parts and a roof that does
  not stretch; in at the adductor hiatus and out under the arch of soleus; the NVA order from superficial to
  deep with the sciatic division at the apex; a transverse cut showing how much of the fossa is fat; a layer
  peel down to the artery on bone; why the pulse is the hardest in the limb to feel and what an easy one
  means; three lesions — supracondylar fracture, semimembranosus bursa, common fibular nerve at the neck;
  and the genicular anastomosis that saves a slow block but not a cut.
- **Authored `ready` on the walls, and `covers` is `["Popliteal fossa"]`.** The previous run's note said not
  to mark it covered if only the walls are taught. The judgement here is that the walls, the floor, the roof,
  the two doorways and the superficial-to-deep order *are* the fossa as an MBBS question asks for it — the
  boundaries and the order of contents are the two things that get marked. Every content is named in
  narration, positioned by a trace between real meshes, and listed in `gaps[]`. What the scene cannot do is
  show a student the popliteal artery, and it says so first in `gaps[]`.

### `gross__leg-foot__arches-of-the-foot`
- id `gross__leg-foot__arches-of-the-foot` · Gross Anatomy · Leg & Foot · **Arches of the foot** · mode
  `3d_anatomy` (deferred: `diagram`) · 26 structures (17 parts) · 12 views · 56 ops · **ready** ·
  degrades `PEEL_LAYER` · audited 2026-08-29 (beats 2, 3 and 4 isolated an arch group and then narrated
  bones belonging to the other groups — the cuneiforms and MT2/MT3 in the medial arch, MT4 in the lateral,
  the medial cuneiform in the transverse — all now shown explicitly; the three plantar interossei, which
  carried one identical paragraph three times, now each name their own metatarsal and toe).
- **The best-resolved scene in the lower limb.** Medial arch complete, bone by bone: `right calcaneus`
  FMA24497, `right talus` FMA24482, `navicular bone of right foot` FMA24500, `right medial cuneiform bone`
  FMA24521, `right first metatarsal bone` FMA24507, with `sesamoid bone of right foot` FMA45097. Lateral
  arch: `right cuboid bone` FMA24528, `right fifth metatarsal bone` FMA24515. Transverse arch: `right
  intermediate cuneiform bone` FMA24523, `right lateral cuneiform bone` FMA24525 and metatarsals two, three
  and four FMA24509 / FMA24511 / FMA24513. `right long plantar ligament` FMA44249 used as the previous run
  advised — one of only two lower-limb ligaments in the catalog. Support: `right tibialis posterior`
  FMA65018, `right fibularis longus` FMA22552, `right flexor hallucis longus` FMA65014, `right flexor
  digitorum longus` FMA65016, `right abductor hallucis` FMA37459, `right flexor digitorum brevis` FMA37461,
  `abductor digiti minimi of right foot` FMA37463, with `right extensor digitorum brevis` FMA51142 and
  `right tibia` FMA24477 as context.
- Three concept traces for the three unmodelled soft supports: `concept:plantar_aponeurosis` along the sole,
  `concept:stirrup` from tibialis posterior across to fibularis longus, `concept:windlass_mechanism` round
  the metatarsal heads.
- Twelve beats: why a flat plate would not do; the medial arch bone by bone with the talus as keystone; the
  lateral arch, low and load-bearing, with the cuboid as keystone; the transverse arch as stacked wedges and
  a half dome; the tripod and where the weight actually lands; the four supports ranked, ligament above
  muscle; the tie beams; the slings; the windlass at push-off turning a shock absorber into a rigid lever;
  a cut sliding along the foot to watch the vault flatten; flat foot and high arch with the tiptoe test; and
  a peel through the layers of the sole.
- `covers` is `["Arches of the foot"]` only. Ankle joint stays with its own scene.

**40 scenes · 29 ready · 4 candidate · 7 planned · 0 blocked · 3309 term mappings.**
**Leg & Foot is now complete — all five structures authored and all five `ready`.**

## Run 2026-08-27 (run 20) — out of the limbs: the cage, then the muscle that moves it

### `gross__thoracic-wall-diaphragm__ribs-sternum`
- id `gross__thoracic-wall-diaphragm__ribs-sternum` · Gross Anatomy · Thoracic Wall & Diaphragm ·
  **Ribs & sternum (thoracic cage)** · mode `3d_anatomy` (deferred: `diagram`) · 43 structures (29 parts) ·
  9 views · 36 ops · **ready** · degrades `PEEL_LAYER`.
- **The cage is complete — no partial stack.** All twelve pairs of ribs by name: `right first rib` FMA7857
  … `right twelfth rib` FMA8533 and `left first rib` FMA7987 … `left twelfth rib` FMA8534. Sternum in its
  three unsided pieces: `manubrium` FMA7486, `body of sternum` FMA7487, `xiphoid process` FMA7488.
  Cartilage as one composite per side: `right costal cartilage` BP28, `left costal cartilage` BP24.
  Context: all twelve thoracic vertebrae `first thoracic vertebra` FMA9165 … `twelfth thoracic vertebra`
  FMA10081, plus `right clavicle` FMA13322 and `left clavicle` FMA13323 for the sternoclavicular joint.
- Ribs are grouped as **True ribs** (1–7), **False ribs** (8–10) and **Floating ribs** (11–12), so the one
  classification a student is actually asked for is a group highlight rather than a sentence.
- Nine beats: the cage as a frame built to move; true / false / floating lit as three groups; the three
  parts of the sternum isolated; counting ribs from the sternal angle, with `SHOW_RELATIONSHIP` from the
  sternal body to rib two and T4 lit beside it; how a rib is fixed behind, head and tubercle making one
  axis; pump handle traced along the upper ribs to the sternum in lateral view; bucket handle traced across
  the lower ribs in anterior view; a transverse cut showing the kidney-shaped cage and naming the eleven
  intercostal spaces; and a cartilage peel for why the elderly chest stiffens.
- Two concept traces carry the movement the op vocabulary cannot animate: `concept:pump-handle` and
  `concept:bucket-handle`.
- `covers` is `["Ribs & sternum (thoracic cage)"]` only.

### `gross__thoracic-wall-diaphragm__intercostal-muscles`
- id `gross__thoracic-wall-diaphragm__intercostal-muscles` · Gross Anatomy · Thoracic Wall & Diaphragm ·
  **Intercostal muscles** · mode `3d_anatomy` (deferred: `diagram`) · 33 structures (5 parts) · 8 views ·
  29 ops · **ready** · degrades `PEEL_LAYER`.
- Parts: `external intercostal muscle` FMA9756, `internal intercostal muscle` FMA9757, `innermost
  intercostal muscle` FMA9758 — three **unsided** meshes, each spanning every space at once — plus `right
  transversus thoracis` FMA9761 and `left transversus thoracis` FMA9762. Context is the whole cage again
  (24 ribs, manubrium, body of sternum, both costal cartilages) so the sheets sit in something.
- Eight beats: the wall in place; a `PEEL_LAYER` on `bone` that strips the cage and leaves the muscle wall
  standing; the three layers compared outside-in and tied to the three flat abdominal muscles; fibre
  direction, hands-in-pockets against the right angle; `concept:inspiration` traced from the external layer
  up the ribs to the sternum; `concept:forced-expiration` traced back down; a transverse cut on the
  neurovascular plane with the drain rule stated as a rule; and the wall from inside for transversus
  thoracis and the internal thoracic artery.
- **`covers` is `["Intercostal muscles"]` only — it deliberately does NOT claim "Intercostal neurovascular
  bundle."** The nerve and the vessels have no meshes; only the plane they lie in can be shown. The VAN
  order still has to be taught in its own scene, and `gaps[]` says so.
- This is the only 3D scene so far whose most examinable fact — fibre direction — is narrated rather than
  shown, because no op in the vocabulary draws fibre orientation.
- **Amended 2026-08-30 (audit).** Now 35 structures: the right levatores costarum `longi` FMA74075 and
  `breves` FMA74077 were added by the section-1 backlog pass and are labelled `(right)` — the left sets
  FMA74076/FMA74078 exist in the catalog but not in `meshes-lite/`, so the posterior wall is drawn on one
  side and both cards say so. Both rib-12 cards taught a "twelfth intercostal space", contradicting beat 1's
  "eleven spaces on each side" in the same file; they now teach the boundary — eleven spaces, subcostal
  nerve below the last rib. Signed `audited_at: 2026-08-30`.

**42 scenes · 31 ready · 4 candidate · 7 planned · 0 blocked · 3543 term mappings.**
**Thoracic Wall & Diaphragm is open: 2 of 5 authored, both `ready`.**

## Run 2026-08-27 (run 21) — the muscle with three holes, then the bundle with no mesh

### `gross__thoracic-wall-diaphragm__diaphragm`
- id `gross__thoracic-wall-diaphragm__diaphragm` · Gross Anatomy · Thoracic Wall & Diaphragm ·
  **Diaphragm** · mode `3d_anatomy` (deferred: `diagram`) · 25 structures (4 parts) · 9 views · 38 ops ·
  **ready** · degrades `PEEL_LAYER`.
- Parts: `diaphragm` FMA13295 — one unsided mesh, no sub-parts — and then the three openings taught by
  **what passes through them**: `inferior vena cava` FMA10951, `esophagus` FMA7131, `descending aorta`
  FMA3784. That substitution is the whole design of the scene and is recorded in `gaps[]`.
- Context in five groups: **Vertebral levels** `eighth thoracic vertebra` FMA9991, `tenth thoracic
  vertebra` FMA10037, `twelfth thoracic vertebra` FMA10081, `first lumbar vertebra` FMA13072, so T8 / T10 /
  T12 are objects a student can point at rather than numbers in a sentence; **Arcuate ligaments** by proxy,
  `right/left psoas major` FMA22342/FMA22343 and `right/left quadratus lumborum` FMA22348/FMA22349, since
  the arches exist only as thickenings over those two muscles; **Costal origin** ribs 11 and 12 both sides
  FMA8531/FMA8532/FMA8533/FMA8534, `xiphoid process` FMA7488, both costal cartilages BP28 / BP24; **Above
  the diaphragm** `lower lobe of right lung` FMA7337, `lower lobe of left lung` FMA7371, `wall of heart`
  FMA7274; **Below the diaphragm** `liver` FMA7197, `stomach` FMA7148, `spleen` FMA7196.
- Nine beats: the floor of the chest; two domes and why the right is higher, with `SHOW_RELATIONSHIP` from
  liver to diaphragm; the ring of origin seen from below; the three openings compared against their
  vertebral levels — *I ate ten eggs at twelve*; **why each opening behaves differently** — tendon holds the
  caval opening open, muscle grips the oesophagus, the aorta passes behind and is never squeezed; inspiration
  as `concept:inspiration`; `concept:phrenic-nerve` traced spleen → diaphragm to carry C3-4-5 and shoulder-tip
  pain; a transverse cut for the hernia weak points; and an organ-then-bone `PEEL_LAYER` down to the bare
  muscle seen from above.
- `covers` is `["Diaphragm"]` only.
- **The scene is `ready` but its central structural fact is not shown.** There is no central tendon, no crus
  and no arcuate ligament mesh anywhere in the catalog, so "muscular rim converging on a fibrous centre" is
  narration. Beat 5 is the sharpest instance: it explains three openings by the tissue each is cut in, and
  the geometry cannot support a word of it.
- **Audited 2026-08-30, clean, signed.** All 25 ids and names verified character-for-character against the
  catalog; the sided pairs (psoas, quadratus lumborum, ribs 11 and 12, costal cartilages, and the lower
  lobes — FMA7337 **right**, FMA7371 **left**) are each labelled on the correct side. Every `gaps[]` absence
  claim was re-searched under multiple spellings — `crus`/`crura`/`crur`, `arcuate`, `tendon`, `central`,
  `phrenic`, `nerve`, `pericard`, `hiatus`, `oesophag`/`esophag`, `vagus`/`vagal`, `azygos`, `cupola`,
  `dome` — and every one holds: the catalog has 1 diaphragm mesh, 0 crura, 0 arcuate ligaments, 0 central
  tendon, and 2 nerves in all 934 entries, both optic. 25/25 models in `meshes-lite/`. No change made
  beyond the signature.

### `gross__thoracic-wall-diaphragm__intercostal-neurovascular-bundle`
- id `gross__thoracic-wall-diaphragm__intercostal-neurovascular-bundle` · Gross Anatomy · Thoracic Wall &
  Diaphragm · **Intercostal neurovascular bundle** · mode `3d_anatomy` (deferred: `diagram`) · 12
  structures (7 parts) · 7 views · 29 ops · **candidate**.
- **The subject of this scene has no mesh at all.** A sweep of all 934 catalog names for *artery*, *vein*
  and *nerve* returns 49 entries and not one is intercostal; there is no azygos vein and no internal
  thoracic artery either. The run before last predicted two options here, a `concept:` trace or `planned`.
  A third turned out to be available and better: **measured landmark anchors**.
- Four anchors carry the teaching. `ic_vein`, `ic_artery`, `ic_nerve` on `right fifth rib` FMA8066 and
  `collateral` on `right sixth rib` FMA8175, all `status:"needs-review"`. The groove they sit in was
  **measured**, not typed: `tools/derive-costal-groove.mjs` (new this run) finds it on the full-resolution
  rib mesh at the mid-axillary station and reports it stable to 2.0 mm across slab widths of 1.5–6°. The
  2 mm spacing that separates V from A from N inside the groove is an **estimate** and each anchor says
  which of the two it is in `calibrated_by`.
- Supporting parts are the plane itself: `external intercostal muscle` FMA9756, `internal intercostal
  muscle` FMA9757, `innermost intercostal muscle` FMA9758. Context: `right fourth rib` FMA7957,
  `descending aorta` FMA3784 and `body of sternum` FMA7487, the two ends the bundle runs between.
- Seven beats: one space close up; a transverse cut counting inwards to name the neurovascular plane; VAN
  compared top-down; `concept:posterior-intercostal-artery` traced aorta → bundle → sternum for the
  double supply; where to put the needle, with `SHOW_RELATIONSHIP` from nerve to the rib below; **the
  collateral branch that spoils the rule**; and `concept:dermatome` for T4 at the nipple, T10 at the
  umbilicus, shingles stopping at the midline.
- **Audited 2026-08-30.** Two statements that the internal thoracic artery supplies an anterior intercostal
  branch to *every* space were corrected — spaces 1-6 from the internal thoracic, 7-9 from its
  musculophrenic branch, 10-11 from the aorta alone. Beat 6 changed "behind the angle" to "near the angle"
  to match the structure card and `gaps[3]`. Ids 8/8, names 8/8 exact, ribs all right-sided, ops all
  resolve, curriculum views `cross_section` + `vasculature` both present. Drawability 8/8; beats 3-6 are
  hollow because the bundle itself has no mesh. Signed.
- `covers` is `["Intercostal neurovascular bundle"]` and the scene is deliberately **`candidate`, not
  `ready`** — every one of the three things the student is here to learn is an authored marker rather than
  a model. It is held on the worklist on purpose.

**44 scenes · 32 ready · 5 candidate · 7 planned · 0 blocked · 3692 term mappings.**
**Thoracic Wall & Diaphragm is open: 4 of 5 authored — 3 `ready`, 1 `candidate`.**

## Run 2026-08-27 (run 22) — the sac with no mesh, then the chambers the heart scene refused to claim

### `gross__thoracic-wall-diaphragm__pleura-pleural-cavity`
- id `gross__thoracic-wall-diaphragm__pleura-pleural-cavity` · Gross Anatomy · Thoracic Wall & Diaphragm ·
  **Pleura & pleural cavity** · mode `diagram` (deferred: `3d_anatomy`) · 22 structures (17 parts) ·
  7 views · 33 ops · **planned**.
- **The subject has no mesh of any kind.** A sweep of all 934 catalog names for *pleura*, *serous*,
  *membrane* and *cavity* returns four interosseous membranes and the septum pellucidum. There is no
  parietal pleura, no visceral pleura, no pleural sac. The last run flagged this structure a run ahead and
  left two defensible calls open; this run took `diagram`, because the subject is a two-layer membrane and
  a potential space, and neither the ribs nor the lungs nor the diaphragm can stand in for it. Under run
  21's second clause — *when the subject itself is unmodelled, adjacency is not enough* — a 3D scene here
  could not have been `ready` either, so nothing is lost by routing it to the engine that can eventually
  draw it in full.
- Parts in five groups: **The two layers** visceral and parietal; **Parts of the parietal pleura** costal,
  diaphragmatic, mediastinal, cervical (cupola); **The space** pleural cavity, pleural fluid, negative
  intrapleural pressure; **Recesses** costodiaphragmatic, costomediastinal, lines of pleural reflection,
  pulmonary ligament; **When the space fills** pneumothorax, tension pneumothorax, effusion, triangle of
  safety. Context: chest wall, lung, diaphragm, mediastinum, endothoracic fascia.
- **Audited 2026-08-30.** Beat 7's `PEEL_LAYER {layer:"organ"}` was removed — it would have hidden almost
  every structure in the scene, including the two the same beat had just compared — and replaced with a
  `SHOW_RELATIONSHIP`. The lower-intercostal supply of the peripheral diaphragmatic pleura was added to the
  structure card, its `terms[]` and beat 7. Ops all resolve; curriculum views `cross_section` + `mechanism`
  both present; the 6-8-10 / 8-10-12 rule, the 2.5 cm cupola and the drain rule are each stated twice and
  agree. Absence of any pleura re-confirmed under six spellings. Stays `planned` — no artwork. Signed.
- Seven beats: two separate sacs; a cut showing the cavity as a *line*, not a gap; the four parts named by
  the surface each lines; **why the lung follows the chest wall** with `concept:air` traced wall → cavity →
  lung; the recesses and the 6-8-10 / 8-10-12 surface markings; break the seal — pneumothorax against
  effusion, tension and the triangle of safety; and why pleurisy hurts while pneumonia does not.
- `covers` is `["Pleura & pleural cavity"]`.

### `gross__heart-pericardium__heart-chambers`
- id `gross__heart-pericardium__heart-chambers` · Gross Anatomy · Heart & Pericardium · **Heart chambers** ·
  mode `diagram` (deferred: `3d_anatomy`) · 23 structures (16 parts) · 7 views · 33 ops · **planned**.
- **The gap the heart scene has declared since day one is now authored rather than deferred.**
  `gross__heart-pericardium__heart` deliberately does not claim this entry: it has no chamber meshes and
  teaches the chambers through their valves. Searching the catalog for *atrium*, *ventricle*, *chamber* and
  *septum* returns the four ventricles of the **brain**, the septum pellucidum, three papillary muscles and
  `wall of heart` — nothing cardiac that is a chamber. Authoring a second 3D scene from the same valves
  would have repeated the first scene without teaching a chamber, so this went to `diagram`.
- Parts in four groups: **Chambers** RA, RV, LA, LV; **Inside the right atrium** crista terminalis,
  pectinate muscles, fossa ovalis, the three openings; **Inside the ventricles** trabeculae carneae,
  moderator band, papillary muscles and chordae, infundibulum, aortic vestibule; **Septa** interatrial,
  muscular and membranous interventricular. Context: the four valves as doors, and the vessels each
  chamber connects to.
- Seven beats: four chambers as two pumps; open the right atrium on the crista; open the right ventricle on
  the moderator band; the left side compared with the right in section; the septa and where they leak;
  `concept:blood` traced through thirteen waypoints for the order; and a spotter beat — *tell them apart in
  the pot*.
- `covers` is `["Heart chambers"]`. The gap records the exact ids that close this from the full archive:
  FMA7096, FMA7097, FMA7098, FMA7101, FMA7236, FMA7133. The structure list, the beats and the narration all
  survive the move to 3D unchanged.

**46 scenes · 32 ready · 5 candidate · 9 planned · 0 blocked · 3881 term mappings.**
**Thoracic Wall & Diaphragm is now fully authored: 5 of 5 — 3 `ready`, 1 `candidate`, 1 `planned`.**
**Heart & Pericardium: 5 of 6 covered; `Conducting system` is the only entry left.**


## Run 2026-08-27 (run 23) — the system with no mesh, then the first organ that resolved whole

### `gross__heart-pericardium__conducting-system`
`gross` · Heart & Pericardium · **Conducting system** · mode `diagram` (deferred: `3d_anatomy`) ·
17 structures (13 parts) · 7 views · 38 ops · **planned** · covers `["Conducting system"]` · audited 2026-08-29

- Routed to `diagram` because that is the **first** entry in this structure's `preferred_modes`, not as a
  downgrade. The curriculum puts diagram ahead of 3D here for the same reason it does for the cardiac
  cycle: the teaching point is a sequence in time, not a shape in space.
- No mesh exists for any part of it. **Re-searched 2026-08-29 (audit) under twenty-seven spellings** —
  node, nodal, sinoatrial, sinuatrial, atrioventricular, bundle, Purkinje, conducting, moderator, trabecula,
  annulus, anulus, crista, terminalis, septum, septal, papillary, valve, cusp, coronary, atrium, atrial,
  ventricle, heart, cardiac, pericardium, vena cava. Every conducting term returns nothing, and *terminalis*
  returns only the lamina and striae terminales of the brain, not the crista. The claim stands. Unlike the
  chambers, this gap is **not** closable by ingesting more of the archive.
- Two things that search corrected. The old note said the nearest entries were "the papillary muscles, the
  moderator band's parent chamber and *wall of heart*" — **there is no chamber mesh in the catalog at all**;
  *atrium* returns nothing and *ventricle* returns only the four brain ventricles. And the search found more
  than expected: superior vena cava FMA4720 (the SA node's landmark), coronary sinus FMA4706 and tricuspid
  valve FMA7234 (two of the three sides of the triangle of Koch), anterior papillary muscle of the right
  ventricle FMA7260 (where the right bundle ends), the two septal-branch sets FMA71670/FMA71669, the trunk
  of the right coronary FMA3802 and the circumflex FMA3895. A future `3d_anatomy` version could draw the
  **frame** the conducting system hangs on, though never the system itself. Recorded in `gaps[]`; not acted
  on, because `diagram` is the curriculum's first preference here.
- Parts in five groups: **The pacemaker** SA node; **Across the atria** internodal pathways, Bachmann's
  bundle; **The gate** AV node, triangle of Koch; **The bridge** bundle of His, fibrous skeleton;
  **The branches** right bundle, left bundle with its two fascicles, Purkinje fibres; **Blood supply**
  SA nodal artery, AV nodal artery, LAD septal branches. Context: atria, ventricles, the ECG trace, and
  the autonomic supply that changes the rate without creating the beat.
- Seven beats: where the beat begins; across the atria as the P wave, tracing `concept:impulse`; the gate
  in the triangle of Koch; the fibrous skeleton and the single bridge across it; branches and Purkinje as
  the QRS; blood supply mapped onto which rhythm fails; and a closing beat on escape rates — 60-100,
  40-60, 20-40 — so the rate on the strip names the pacemaker.

### `gross__lungs-mediastinum__lungs`
`gross` · Lungs & Mediastinum · **Lungs** · mode `3d_anatomy` (deferred: `diagram`) ·
22 structures (15 parts) · 7 views · 42 ops · **ready** · covers `["Lungs"]` · **audited 2026-08-29**

- Five lobes resolved outright: `FMA7333` upper lobe of right lung, `FMA7383` middle lobe of lung,
  `FMA7337` lower lobe of right lung, `FMA7370` upper lobe of left lung, `FMA7371` lower lobe of left lung.
  Context: `FMA7394` trachea, `FMA7409` bronchus, `FMA66326` pulmonary artery, `FMA66643` pulmonary vein,
  `FMA7274` wall of heart, `FMA13295` diaphragm, `FMA7131` esophagus.
- **Nine anchors, all measured — none typed in.** `tools/derive-lung-landmarks.mjs` was written this run and
  re-proves the LPS frame on the meshes it is handed before emitting anything: apex right and left (most
  superior vertex), oblique fissure right and left (lobe-to-lobe contact, gap 0.10 and 0.13 mm), cardiac
  notch (left upper lobe to wall of heart, gap 0.61 mm), lingula (most inferior vertex of the left upper
  lobe), hilum right and left (lobe to pulmonary artery, gap 0.73 and 0.81 mm), base (most inferior vertex
  of the right lower lobe). All nine are `needs-review` with their measurement in `calibrated_by`.
- Seven beats: the lungs in the chest; lobes and fissures with the surface markings; what makes the left
  lung left — notch and lingula; the root, with RALS and the vein rule; a cross-section for the neighbours
  and the phrenic-in-front / vagus-behind rule; `concept:air` traced to the right lower lobe; and a
  closing beat on where to put the stethoscope.
- **AUDIT 2026-08-29 — the horizontal fissure now HAS an anchor, and the note above was false.** The scene
  and this file both said `FMA7383` was "in the catalog but not in the local decimated set". It is in
  `meshes-lite/`, as are all twelve of this scene's meshes. The upper-lobe / middle-lobe contact measures at
  a 0.09 mm gap over a 210-vertex patch (`derive-landmark.mjs --parent FMA7333 --contact FMA7383 --area 8`),
  and the anchor is now shown in beats 2 and 7. Ten anchors, all measured, all `needs-review`. A no-op
  `PEEL_LAYER muscle` in beat 7 was also removed — after `ISOLATE_REGION Right lung` there is no muscle on
  screen to peel.

**48 scenes · 33 ready · 5 candidate · 10 planned · 0 blocked · 4091 term mappings.**
**Heart & Pericardium is now fully authored: 6 of 6 — 1 `ready` (covering four entries), 2 `planned`.**
**Lungs & Mediastinum opens 1 of 5, `ready`.**

## Run 2026-08-27 (run 24) — the airway from cricoid to alveolus, then the space it runs through

### `gross__lungs-mediastinum__tracheobronchial-tree`
`gross` · Lungs & Mediastinum · **Tracheobronchial tree** · mode `3d_anatomy` (deferred: `diagram`) ·
17 structures (7 parts) · 7 views · 36 ops · **ready** · covers `["Tracheobronchial tree", "Trachea"]`
**Amended at audit 2026-08-29** (`provenance.audited_at`): the oesophagus (`FMA7131`) added as a context
structure — the scene had claimed it was "not available locally to measure against" and it was on disk all
along, while beat 1 narrated the trachea as lying in front of it. The `t4_level` anchor was re-derived: it
had been placed on the trachea at its nearest approach to T4, a gap of 11.41 mm that `derive-landmark.mjs`
refuses outright, because the trachea does not touch T4 — the oesophagus is between. It now sits on the T4
vertebra as its lowest vertex (its lower border), which cross-checks against the carina anchor to 1.4 mm in
the vertical. Beat 7's `PEEL_LAYER bone` was removed: it hid the very structure the beat then drew a
relationship to. Anchor count in `gaps[]` corrected from six to five.

- Airway resolved outright: `FMA7394` trachea, `FMA7409` bronchus. Context: `FMA7486` manubrium,
  `FMA7487` body of sternum, `FMA9248` fourth thoracic vertebra, `FMA3768` arch of aorta, and all five
  lung lobes as the destinations of the trace.
- **Covers two curriculum entries.** "Trachea" (`location`, `cross_section`, *C-rings; bifurcation*) is
  entirely inside this scene: the mesh is the trachea itself, beat 2 gives both its levels — C6 at the
  cricoid, lower border of T4 at the fork — and beat 3 is a `CROSS_SECTION` through it for the C-shaped
  rings and the membranous back wall. Declaring it covered is honest; splitting it into a second scene
  would have duplicated the same mesh and the same two beats.
- **Six anchors, all measured.** New tool `tools/derive-mediastinum-landmarks.mjs`: carina (lowest vertex
  of the trachea, 65.5 mm from its centroid), beginning of the trachea (highest vertex, 54.5 mm), T4 level
  (trachea-to-T4 contact, gap 11.41 mm — the gap *is* the oesophagus, and is recorded rather than hidden),
  sternal angle (manubrium-to-sternal-body contact, gap 0.11 mm), arch over the airway (trachea-to-arch
  contact, gap 0.36 mm). All `needs-review` with the measurement in `calibrated_by`.
- Seven beats: the airway in the chest; the two levels that carry the topic; a cross-section for the
  C-rings; the branching plan counted in threes; `concept:air` traced from cricoid to lobe; why an inhaled
  object always goes right, with intubation depth; and what the bronchoscope sees at the carina.
- Gaps: one generic `bronchus` mesh so right-versus-left is narrated, not compared; no lobar or segmental
  bronchi; nothing below the segmental bronchus exists at all, so the acinus is narration and the alveolus
  properly belongs to a histology scene; no larynx or cricoid as an airway.

### `gross__lungs-mediastinum__mediastinum`
`gross` · Lungs & Mediastinum · **Mediastinum** · mode `3d_anatomy` (deferred: `diagram`) ·
29 structures (18 parts) · 8 views · 51 ops · **ready** · covers `["Mediastinum"]` · **audited 2026-08-29**

- Contents resolved outright: `FMA7274` wall of heart, `FMA3736` ascending aorta, `FMA3768` arch of aorta,
  `FMA3784` descending aorta, `FMA4720` superior vena cava, `FMA10951` inferior vena cava, `FMA66326`
  pulmonary artery, `FMA4751` right brachiocephalic vein, `FMA3953` right subclavian artery, `FMA7394`
  trachea, `FMA7409` bronchus. Boundaries: manubrium, body of sternum, `FMA9248` T4, `FMA10081` T12, and
  the two upper lobes standing in for the mediastinal pleura.
- **Nine anchors: eight measured, one authored and labelled as such.** Sternal angle and its posterior end
  at T4/T5 (T4-to-descending-aorta contact, gap 3.72 mm — the aorta lies just off the body, which is
  correct); summit of the arch; ligamentum arteriosum (arch-to-pulmonary-artery contact, gap 1.93 mm);
  cavo-atrial junction (gap 0.13 mm); IVC opening (gap 0.34 mm); aortic hiatus (descending-aorta-to-T12
  contact, gap 0.95 mm). The oesophagus anchor is the exception and says `author:` in `calibrated_by`.
- **One derived landmark was rejected and re-derived.** The first pass placed the aortic hiatus at the
  lowest vertex of `FMA3784`. That mesh runs on past the diaphragm to the aortic bifurcation — its floor is
  at z 960 against T12's 1063 — so the lowest vertex is in the abdomen. Measuring against T12 instead gives
  a 0.95 mm contact at the real hiatus. A measured number is not automatically a true one.
- Eight beats: the space between the lungs; one plane cuts it in two; superior mediastinum front to back
  (thymus, veins, arteries, tubes); middle mediastinum and where the cavae open; the anterior gap and the
  four Ts; posterior mediastinum in cross-section; the two nerve rules, with the left recurrent laryngeal
  traced as a concept; and reading a shifted mediastinum.
- **Does not claim "Great vessels".** The great vessels are all present here as contents, but the branching,
  surface markings and development a great-vessels scene owes the student are not taught. That entry stays
  on the worklist and is the next one at the cursor.
- Gaps: no pericardium mesh, which is the structure that actually defines three of the four divisions; no
  thymus locally (`FMA71194`/`FMA71195` are in the catalog, not in `meshes-lite/`); no thoracic nerve of any
  kind, so phrenic-in-front / vagus-behind is narration only; no azygos vein, no thoracic duct, no
  mediastinal lymph nodes. All re-verified against the catalog at audit and all genuinely absent.
- **AUDIT 2026-08-29 — two "not available locally" claims were false and one anchor was guessed.** The
  oesophagus (`FMA7131`) and the diaphragm (`FMA13295`) are both in `meshes-lite/`, and the Lungs scene in
  this same topic was already drawing both. The oesophagus was carried here as an anchor placed BY EYE on
  the front of the T4 body — the only unmeasured landmark in the scene, on a `ready` scene — and is now a
  model, with the three thoracic constrictions measured off it: arch of aorta 2.02 mm, bronchus 1.16 mm,
  diaphragm (oesophageal hiatus) 0.31 mm. Their measured heights come out in the textbook order, which is
  the check on the definitions. The diaphragm is now a context model, so the floor is drawn.
- **`ludwig_posterior` re-derived.** Its old definition — T4 to descending aorta, 3.72 mm — exceeds the
  3 mm gate the current `derive-landmark.mjs` enforces, i.e. today's tool would refuse it. Re-derived on the
  T4/T5 intervertebral disc (`FMA13501`) at 0.07 mm, which is the structure beat 2's narration names.
- **Anchor count corrected: the file said "eight of the nine anchors" and there were eight.** There are now
  ten, all measured.

**50 scenes · 35 ready · 5 candidate · 10 planned · 0 blocked · 4294 term mappings.**
**Lungs & Mediastinum now 4 of 5 — Lungs, Tracheobronchial tree, Trachea and Mediastinum all `ready`.**

## Run 2026-08-27 (run 25) — the vessels the mediastinum scene refused to claim, then out of the thorax

### `gross__lungs-mediastinum__great-vessels`
`gross` · Lungs & Mediastinum · **Great vessels** · mode `3d_anatomy` (deferred: `diagram`) ·
34 structures (25 parts) · 8 views · 53 ops · **ready** · covers `["Great vessels"]`

- Thirteen vessels resolved outright: `FMA3736` ascending aorta, `FMA3768` arch of aorta, `FMA3784`
  descending aorta, `FMA66326` pulmonary artery, `FMA66643` pulmonary vein, `FMA4720` superior vena cava,
  `FMA10951` inferior vena cava, `FMA4751` right brachiocephalic vein, `FMA4761` left brachiocephalic vein,
  `FMA4058` left common carotid artery, `FMA4694` left subclavian artery, `FMA3953` right subclavian
  artery, `FMA3941` right common carotid artery. Context: `FMA7274` wall of heart, `FMA7246` pulmonary
  valve, `FMA7394` trachea, manubrium, body of sternum, `FMA9248` T4, `FMA10081` T12, both upper lobes.
- **Twelve anchors, all twelve measured.** Aortic root (asc-to-heart, 0.15 mm) · arch begins (asc-to-arch,
  0.13 mm) · aortic isthmus (arch-to-desc, 0.19 mm) · origin of the brachiocephalic trunk
  (arch-to-right-subclavian, **17.84 mm — the gap IS the missing vessel**) · aortic hiatus (desc-to-T12,
  0.95 mm) · pulmonary trunk origin (PA-to-pulmonary-valve, 0.17 mm) · pulmonary bifurcation
  (PA-to-arch, 1.93 mm) · pulmonary venous return (PV-to-heart, 0.30 mm) · SVC formation
  (SVC-to-right-brachiocephalic-vein, 0.23 mm) · cavo-atrial junction (0.13 mm) · IVC opening (0.34 mm) ·
  sternal angle (manubrium-to-sternal-body, 0.11 mm).
- **Four of those reproduce the Mediastinum scene's `uvw` to three decimal places** — sternal angle, aortic
  hiatus, cavo-atrial junction, IVC opening. Two tools, written independently against the same meshes,
  agreeing exactly. A fifth pair, this scene's `pulmonary_bifurcation` and that scene's
  `ligamentum_arteriosum`, is the same contact at the same 1.93 mm gap expressed on a different parent, so
  the coordinates differ by construction and it is not counted as a match. That cross-check is why the
  numbers are printed rather than described.
- Eight beats: what makes a vessel great; the aorta in three parts traced root to hiatus; the three arch
  branches and why the right side gets its two arteries second-hand; the pulmonary side and the artery full
  of blue blood; everything drains to two veins; one drop of blood round the whole circuit as
  `concept:blood`; what lies against what and the symptom each contact causes; and a cross-section at the
  sternal angle read veins-arteries-tubes-bone.
- Gaps: no brachiocephalic trunk (taught through its two branches and a measured origin anchor); one generic
  pulmonary artery covering trunk and both branches; one generic pulmonary vein, so the count of four is
  narration; no ligamentum arteriosum and no ductus; no thoracic nerve of any kind; no azygos vein; no
  aortic valve although the other three valves exist.

### `gross__anterior-abdominal-wall-inguinal-region__rectus-abdominis`
`gross` · Anterior Abdominal Wall & Inguinal Region · **Rectus abdominis** · mode `3d_anatomy`
(deferred: `diagram`) · 25 structures (13 parts) · 7 views · 36 ops · **ready** ·
covers `["Rectus abdominis"]`

- Parts: `FMA13377` right rectus abdominis, `FMA13378` left rectus abdominis, `FMA11336` linea alba,
  `FMA22346`/`FMA22347` pyramidalis. Context: `FMA13336`/`FMA13337` external oblique, `FMA13892` internal
  oblique, `FMA22344` transversus abdominis, `FMA8070`/`FMA8194`/`FMA8248` fifth, sixth and seventh costal
  cartilages, `FMA7488` xiphoid process, `FMA16586`/`FMA16587` hip bones, `FMA21964` inguinal ligament,
  `FMA7487` body of sternum.
- **Eight anchors, all eight measured, all eight on the right rectus** — the only abdominal-wall mesh on
  disk. Pubic origin (rectus-to-hip-bone, 0.29 mm) · fifth costal insertion (0.35 mm) · sixth costal
  insertion (0.17 mm) · upper end and lower end as z-extremes · linea semilunaris as the most lateral
  vertex · closest approach to the midline · anterior wall of the sheath (rectus-to-external-oblique,
  0.34 mm). Nothing was mirrored across the midline to fake a left-sided landmark.
- Seven beats: one vertical muscle in a wall of oblique ones; pubis to costal margin traced along the five
  attachment anchors; two borders and the two hernias that belong to each; the sheath rule stated as three
  lines with a cross-section; what it does when it shortens; the segmental nerves traced as
  `concept:thoracoabdominal-nerves` with Carnett's sign; and where a surgeon cuts and why.
- **Does not claim "Rectus sheath", "Flat abdominal muscles", "Inguinal canal" or "Inguinal ligament &
  landmarks".** All four are separate curriculum entries and all four have meshes in this scene as context.
  The sheath rule is stated here because the muscle cannot be understood without it, but the arcuate line,
  the layers above and below it, and the transversalis fascia are not taught, so the entry stays visible.
- Gaps: no tendinous intersections and no arcuate line — both are markings on a structure rather than
  structures, so no provider will ever ship them; no rectus sheath as an object; no umbilicus, which is the
  reference point for almost every statement about this wall; no abdominal wall nerve or vessel, so the
  inferior epigastric artery — cause of the rectus sheath haematoma and the landmark that separates direct
  from indirect hernia — cannot be shown. Only the right side could be measured.

### `gross__anterior-abdominal-wall-inguinal-region__flat-abdominal-muscles`
`gross` · Anterior Abdominal Wall & Inguinal Region · **Flat abdominal muscles** · mode `3d_anatomy`
(deferred: `diagram`) · 23 structures (15 parts) · 7 views · 35 ops · **ready** ·
covers `["Flat abdominal muscles"]`

- Parts: `FMA13336`/`FMA13337` external oblique, `FMA13892`/`FMA13893` internal oblique,
  `FMA22344`/`FMA22345` transversus abdominis, `FMA11336` linea alba — all six flat muscles of both sides,
  the first scene in the corpus to carry the complete set. Context: `FMA13377`/`FMA13378` rectus abdominis,
  `FMA21964`/`FMA21965` inguinal ligament, `FMA16586`/`FMA16587` hip bones, `FMA8066` fifth rib,
  `FMA8533` twelfth rib.
- **AUDITED AND SIGNED 2026-08-28.** Three fixes: two stale "not on disk" gap notes corrected (all fifteen
  models are now in `meshes-lite/`), the nerve supply of transversus abdominis added to beat 4 — the learning
  goal promises it "of each" and beat 4 alone had none — and "transpyloric plane" removed from the iliac
  crest anchor's terms, which teaches the supracristal plane at L4 and not the transpyloric at L1.
  15 of 15 models in hand; no hollow beats. Six left/right pairs, every one correctly sided.
- **Eight anchors, all eight measured, seven on the right external oblique** — still the only flat muscle
  anything has been measured ON, though all three are now on disk — and one on the right hip bone. Origin from the fifth rib (0.55 mm) · origin from the twelfth rib
  (0.65 mm) · insertion into the iliac crest (0.22 mm, identified as crest rather than pubis by where the
  matching point sits on the hip bone's own box) · aponeurosis in front of the rectus (0.34 mm) · lower free
  border, lateral fleshy edge and upper limit as extremes · summit of the iliac crest.
- **The aponeurosis contact reproduces the rectus scene's 0.34 mm exactly.** `derive-flat-muscle-landmarks.mjs`
  was written against the same two meshes from the opposite side and got the same gap, which is the only
  real check on a derived number. The anchors hang on different parents by construction.
- Seven beats: three sheets and three directions; external oblique traced rib five to twelfth rib to crest
  to midline; internal oblique and its fanning fibres; transversus as a belt with the nerve plane on top of
  it; a horizontal cut read skin to peritoneum with the sheath rule above and below the arcuate line;
  rotation and the shutter mechanism explained from the crossing fibre directions; and the three ways a
  surgeon gets through this wall.
- **Does not claim "Rectus sheath" or "Inguinal ligament & landmarks".** The sheath rule is stated because
  these three muscles form it, but the arcuate line cannot be drawn and the groin's surface landmarks were
  not measured. Both entries stay visible.
- Gaps: no aponeurosis as a separate object anywhere in the catalog — the central fact of this topic, that a
  muscle becomes a sheet and the sheet then picks a side of the rectus, is taught by relationship and one
  measured contact; no arcuate line, no conjoint tendon, no transversalis fascia, no Camper's or Scarpa's;
  no nerve of the wall, so the transversus abdominis plane is traced as a concept.

### `gross__anterior-abdominal-wall-inguinal-region__inguinal-canal`
`gross` · Anterior Abdominal Wall & Inguinal Region · **Inguinal canal** · mode `3d_anatomy`
(deferred: `diagram`) · 15 structures (9 parts) · 7 views · 38 ops · **ready** ·
covers `["Inguinal canal"]`

- **AUDITED AND SIGNED 2026-08-28.** The vas ran backwards: the `vas_r` narration had the duct entering at
  the deep ring and leaving at the superficial ring *before* crossing the ureter, which puts it outside the
  wall on its way into the pelvis. Corrected to superficial ring in, deep ring out, ureter crossed beyond it.
  `FMA15571 right ureter` added as context so beat 5 draws that crossing rather than asserting it, and two
  stale gap notes (the deferent duct and the "only two meshes on disk" claim) rewritten. 12 of 12 models in
  hand; no hollow beats.

- **A space taught entirely through its walls** — authoring rule 2(b). Parts: `FMA13336` external oblique
  (anterior wall), `FMA13892` internal oblique (roof, and the lateral anterior wall), `FMA22344` transversus
  abdominis (roof, conjoint tendon behind), `FMA21964` inguinal ligament (floor), `FMA7211` right testis
  (why the canal exists at all). Context: `FMA16586`/`FMA16587` hip bones, `FMA13377` rectus abdominis for
  the medial side of Hesselbach's triangle, `FMA18806`/`FMA18885` external iliac artery and vein.
- **Three anchors, all measured**: the level of the canal as the lowest vertex of the external oblique, the
  symphyseal surface of the pubis, and the summit of the iliac crest. Each label says how far the structure
  it names — the superficial ring, the pubic tubercle, the anterior superior iliac spine — lies from the
  marker, rather than putting the marker where the structure ought to be.
- Seven beats: a gap that had to be left open; the four walls in the order an examiner asks; two rings at
  opposite ends and opposite depths, with the mid-inguinal point distinguished from the midpoint of the
  ligament; the shutter mechanism as three simultaneous movements; the contents, coverings and lymph
  drainage traced as `concept:spermatic-cord` to a testis that is a real model; indirect against direct
  decided by one artery; and sorting a groin lump by the pubic tubercle.
- Gaps: the lumen, both rings, the conjoint tendon, the transversalis fascia, the lacunar ligament and the
  whole spermatic cord are absent and permanently so for a surface catalog of organs. **The inferior
  epigastric artery is the highest-value single acquisition for this topic** — it is what separates indirect
  from direct — and the external iliac artery stands in for it as the parent vessel. No ilioinguinal nerve,
  so the nerve injured at repair and the afferent limb of the cremasteric reflex are narration only.

**54 scenes · 39 ready · 5 candidate · 10 planned · 0 blocked · 4790 term mappings.**
**Anterior Abdominal Wall & Inguinal Region now 3 of 5 — only the rectus sheath and the groin landmarks left.**

## Run 2026-08-27 (run 27) — the wrapping that is not an object, then the border that is not a ligament

### `gross__anterior-abdominal-wall-inguinal-region__rectus-sheath`
`gross` · Anterior Abdominal Wall & Inguinal Region · **Rectus sheath** · mode `3d_anatomy`
(deferred: `diagram`) · 20 structures (11 parts) · 6 views · 31 ops · **ready** ·
covers `["Rectus sheath"]`

- **The second space-not-an-object scene in this topic, after the inguinal canal** — authoring rule 2(b)
  again. Parts: `FMA13377` right rectus abdominis and `FMA22346` right pyramidalis as the contents;
  `FMA13336` external oblique, `FMA13892` internal oblique, `FMA22344` transversus abdominis and
  `FMA11336` linea alba as the four things that make the wrapping. Context: `FMA13378`/`FMA13337`/
  `FMA13893`/`FMA22345` the left-sided set, `FMA16586`/`FMA16587` hip bones, `FMA8248` seventh costal
  cartilage, `FMA7488` xiphoid process, `FMA21964` inguinal ligament.
- **Five anchors, all five measured on the right rectus abdominis.** Anterior wall of the sheath
  (rectus-to-external-oblique contact, 0.34 mm — the third independent reproduction of that same gap) ·
  back of the muscle belly as a **constrained** posterior extreme · linea semilunaris as the most lateral
  vertex · lower end and upper end as z-extremes.
- **The constraint on the posterior anchor is the point of it.** Unconstrained, the most posterior vertex of
  this mesh is at the pubic end, where the muscle curves back to its origin — identical coordinates to the
  rectus scene's `pubic_origin`. A marker labelled "posterior surface of the muscle" would have landed on
  the origin. Restricting the search to the middle 40% of the muscle's height moves it onto the belly, and
  the `calibrated_by` note records both the constraint and why it was needed.
- Six beats: the sheath as what the flat muscles do at the midline; three aponeuroses and three behaviours
  stated as three sentences; a transverse cut above the arcuate line with front wall and back wall lit;
  a second cut below it with the two levels compared; the four contents, with the epigastric vessels and the
  thoracoabdominal nerves traced as concepts through their two different doors; and the three clinical facts
  that fall out of the rule — the haematoma with Fothergill's sign, the Spigelian hernia, and the incisions.
- **Teaches the third arrangement most students miss.** Above the costal margin the front wall is external
  oblique alone and there is again no posterior wall, because the muscle lies straight on the costal
  cartilages. Three levels, not two.
- Gaps: no rectus sheath as an object and never will be; **no arcuate line and deliberately no anchor for
  it** — it is a free edge of fascia whose level is defined against an umbilicus the catalog also lacks, so
  it is taught by cutting at two levels and stating the rule at each; no aponeurosis separable from its
  muscle belly, so the internal oblique splitting into two laminae is narration and `SHOW_RELATIONSHIP`
  only; no transversalis fascia, extraperitoneal fat or peritoneum; no epigastric vessels and no
  thoracoabdominal nerves; no tendinous intersections. Only the right side could be measured.
- Audited 2026-08-28: Carnett's sign had the wrong mechanism (segmental innervation rather than
  position of the lesion relative to the contracted muscle) and beat 3 contradicted `linea_semilunaris`
  over whether a Spigelian hernia is visible; both fixed. Stale gap note about meshes not being on disk
  rewritten — all 17 models are now in `meshes-lite/`. Still `ready`.

### `gross__anterior-abdominal-wall-inguinal-region__inguinal-ligament-landmarks`

**Amended 2026-08-29** (not re-audited): this scene claimed in three places that the pubic tubercle could
not be isolated geometrically. It can — it is the medial attachment of the inguinal ligament, 0.52 mm, now
authored as an anchor in `gross__pelvis-perineum__bony-pelvis`. The three claims are corrected; this scene's
own anchors are left where they were measured and the re-derivation is recorded as open work.
`gross` · Anterior Abdominal Wall & Inguinal Region · **Inguinal ligament & landmarks** · mode `3d_anatomy`
(deferred: `diagram`) · 22 structures (11 parts) · 6 views · 33 ops · **ready** ·
covers `["Inguinal ligament & landmarks"]`

- **The first scene in the corpus to use `FMA21964`/`FMA21965` as parts rather than context** — the two
  inguinal ligaments are the subject at last. Parts also `FMA13336` external oblique (the ligament is its
  rolled lower border), `FMA18806` external iliac artery and `FMA18885` external iliac vein. Context:
  `FMA16586`/`FMA16587` hip bones, `FMA22342` psoas major, `FMA22322` iliacus, `FMA22354` sartorius,
  `FMA22450` pectineus, `FMA22456` adductor longus, `FMA13377` rectus abdominis, `FMA13892` internal
  oblique, `FMA22344` transversus abdominis, `FMA11336` linea alba.
- **Six anchors, all six measured, all six on the right hip bone** — the only bone of the region on disk.
  Anterior superior iliac spine as a **constrained** anterior extreme (the unconstrained bone's most
  anterior point is the pubis, not the ASIS, so the search was restricted to the iliac part) · summit of the
  iliac crest · pubic crest as the hip-bone-to-rectus contact, 0.29 mm · symphyseal surface as the most
  medial vertex · and **two midpoints computed from those measured points**.
- **A midpoint of two measured landmarks is a definition carried out, not an estimate.** The mid-inguinal
  point IS defined as halfway between ASIS and pubic symphysis, so computing it is exact. Both midpoints sit
  off the bone surface, in soft tissue, which is where those surface-anatomy points actually are.
- Six beats: a border and not a band; the two palpable ends traced along the ligament; **the two midpoints
  compared side by side** with the femoral artery related to one and the deep ring narrated above the other;
  the muscular and vascular compartments underneath with the lateral-to-medial list; the pubic tubercle as
  the one landmark that decides inguinal from femoral, found by following the adductor longus tendon; and
  the six palpable points run as one chain from iliac crest to symphysis.
- Gaps: **the pubic tubercle has no mesh and could not be isolated geometrically**, so the anchor carries
  the honest name "pubic crest" and the narration places the tubercle at its lateral end — everything taught
  against the tubercle is stated against a point a centimetre or two medial, and says so; both inguinal
  rings absent because a ring is a hole; no lacunar or pectineal ligament; no femoral sheath or canal; no
  femoral, ilioinguinal or genitofemoral nerve; no spermatic cord, round ligament or conjoint tendon. The
  ligament meshes themselves were not on disk, so no anchor sits on the ligament and its course is authored
  as a trace between two measured bony points.
- Audited 2026-08-28: the iliac-crest anchor conflated the supracristal plane (highest point, L4) with the
  transtubercular plane (tubercle of the crest, L5) — relabelled, `terms` cut to the supracristal set, and
  the tubercle now named in narration as the point this is NOT. The deep-ring occlusion test was taught as
  diagnostic, contradicting `inguinal-canal` in the same topic — now stated, flagged unreliable, and the
  inferior epigastric artery named as what settles it. Deep-ring offset harmonised to "about one
  centimetre — a finger's breadth" across all three mentions. Stale on-disk gap note rewritten: all 16
  models are now in `meshes-lite/`, so the two midpoints could be re-derived on the ligament itself.
  Still `ready`.

**56 scenes · 41 ready · 5 candidate · 10 planned · 0 blocked · 5011 term mappings.**
**Anterior Abdominal Wall & Inguinal Region COMPLETE — 5 of 5. Gross Anatomy 46 of 81.**

## Run 2026-08-27 (run 28) — into the gut: the organ with no named regions, then the six metres with no mesentery

### `gross__stomach-intestines__stomach`
`gross` · Stomach & Intestines · **Stomach** · mode `3d_anatomy`
(deferred: `diagram`) · 21 structures (13 parts) · 7 views · 46 ops · **ready** ·
covers `["Stomach"]`

- **Audited 2026-08-29.** All 17 model ids and names verified against the catalog character for character;
  all 17 meshes are on disk. Two false statements in `gaps[]` corrected: that none of the scene's meshes
  was in the local set (all were), and that the catalog holds no large-bowel mesh at all (the three
  taeniae, the appendix and the rectum are there, as the `large-intestine` scene in the same topic already
  said). Four anchors added — cardiac orifice 0.31 mm, pylorus 0.41 mm, gastrosplenic contact 0.40 mm
  (agreeing with the reciprocal anchor in the spleen scene), and the fundal dome as an extreme point,
  labelled as a property of the mesh because a distensible bag has no fixed top. Three definitions refused
  by the tool and recorded with their gaps so nobody re-derives them.

- **First scene in the abdominal viscera, and the first where the subject is one undivided mesh.**
  `FMA7148` is the whole stomach: no fundus, no body, no antrum, no pylorus, no curvature, no incisura.
  The five regions and two curvatures are the entire first-year answer, and none of them can be lit.
- **Resolution rule 2(b), applied to the neighbours instead of the parts.** Where the organ could not be
  subdivided, the scene was built outwards: `FMA7131` oesophagus and `FMA7206` duodenum as the inlet and
  outlet, and the coeliac trunk `FMA50737` with `FMA14768` left gastric, `FMA14773` splenic and `FMA14771`
  common hepatic as parts in their own right, because the arterial arches are examined as hard as the
  regions are. `FMA14331` splenic vein and `FMA14332` superior mesenteric vein carry the portal drainage.
- **The bed is a group.** `FMA10419` pancreatic duct, `FMA7205` left kidney and `FMA15630` left adrenal
  gland form a `Stomach bed` group that beat 3 isolates from behind — the five-item bed list taught as a
  shelf you turn the stomach off, which is how it is examined and how a posterior ulcer is explained.
- **The duct stands in for the pancreas and says so in its label.** There is no pancreas mesh in the
  catalog at all. `Pancreatic duct — marking the pancreas` is honest in the student's own parts list, not
  only in `gaps[]`: the duct runs the length of the gland, so it shows where the gland is and nothing more.
- Seven beats: find it behind ribs and liver; five regions and two curvatures read off the outline; the bed
  from behind; one trunk, three branches, two arches, traced from the aorta; a cut through the four coats
  and the third oblique muscle layer; a meal followed from receptive relaxation to retropulsion; and the
  posterior-bleeds / anterior-perforates rule with Virchow's node.
- **Deliberately no anchors.** None of these meshes is in the local decimated set, so the incisura
  angularis, cardiac orifice, pylorus and both curvatures could not be measured. They were not typed in by
  eye. **Ingesting `FMA7148` locally is the cheapest single unlock in the topic — six anchors on one mesh.**
- Gaps: no gastric subdivisions; no peritoneum, omenta or lesser sac; no right gastric, gastro-omental,
  short gastric or **gastroduodenal** artery (the last is the highest-value acquisition here — it is the
  reason a posterior duodenal ulcer bleeds, and beat 7 currently carries that lesson on the splenic artery
  alone); no portal vein; no vagal trunks; no transverse colon or mesocolon.

### `gross__stomach-intestines__small-intestine`
`gross` · Stomach & Intestines · **Small intestine** · mode `3d_anatomy`
(deferred: `diagram`) · 19 structures (11 parts, 3 of them anchors) · 7 views · 47 ops · **ready** ·
covers `["Small intestine"]` · **audited 2026-08-29**

- **AUDIT 2026-08-29 — two changes.** (1) The curriculum asks this entry for `cross_section`, `mechanism`
  and `associated_organs`; the scene had the first two and no `associated_organs` beat at all, and nothing
  in the validator's eight stages compares a scene's modes to its curriculum `views`. Beat 2 was re-moded
  `location` → `associated_organs`, which is what it already was in substance — the duodenum shown inside
  the organs that bed it and drain into it — leaving beats 1 and 7 to carry `location`. (2) Three landmark
  anchors were derived and authored, closing a `gaps[]` note that the Large-intestine run had explicitly
  left for this audit: duodenojejunal flexure (duodenum↔jejunum, 0.53 mm), major duodenal papilla
  (duodenum↔pancreatic duct, 1.26 mm), ileocaecal junction (ileum↔appendix, 0.95 mm). All three emitted;
  all three carry one witness, stated as such, because each of these junctions is by definition a meeting of
  exactly two meshes and no third structure in the catalog can converge on it. All `needs-review`.
  All 16 model ids re-checked against the catalog by id AND by name, character for character: all 16 correct.

- **Resolves cleanly into its three named parts** — `FMA7206` duodenum, `FMA7207` jejunum, `FMA7208`
  ileum — which makes it the opposite case to the stomach in the same topic and the same run.
- **The duodenum's four parts are taught by their bed, not by their meshes.** Beat 2 traces along the one
  duodenal mesh and lights each posterior relation in turn: pancreatic duct at the papilla, right kidney
  behind the second part, aorta under the third, left kidney behind the fourth. Rule 2(b) again — the
  relations exist as meshes even where the subdivisions do not, and the relations are the exam answer.
- **The ileum's ending is taught through the appendix.** `FMA14542` is the only large-bowel mesh in 934
  models apart from the rectum. Its label says `Appendix — the end of the road` and the narration finds the
  ileocaecal junction by the converging taeniae, because the caecum and the ileocaecal valve are not there.
- **Beat 3 is the jejunum-versus-ileum spotter answer as six explicit contrasts**, run as
  `COMPARE_STRUCTURES` — position, wall, lumen, folds, mesentery, lymphoid tissue.
- **`FMA14750` inferior mesenteric artery is carried as context that supplies nothing here**, purely to fix
  T12 / L1 / L3 in order, and its own narration says so, so its presence cannot be misread as a claim.
- **Nigerian clinical weighting in beat 7**: adhesions, strangulated external hernia, intussusception and
  Ascaris as the leading causes of obstruction; ileocaecal tuberculosis and Meckel's as the two mimics of
  appendicitis; typhoid ulcerating the Peyer's patches in the third week.
- Gaps: **no mesentery and no peritoneum — the single biggest omission, because half the jejunum-versus-
  ileum answer is a statement about the mesentery**; no caecum, colon or ileocaecal valve; no duodenal
  subdivisions, papillae or duodenojejunal flexure; no pancreas (duct only); no jejunal/ileal arteries,
  arcades or vasa recta; villi, crypts, Brunner's glands and Peyer's patches belong to a histology scene
  that does not exist yet. No anchors, for the same measurement reason as the stomach scene.

**58 scenes · 43 ready · 5 candidate · 10 planned · 0 blocked · 5225 term mappings.**
**Stomach & Intestines 2 of 5. Gross Anatomy 48 of 81.**

---

## Run 2026-08-27 (run 29) — the colon that is only three bands, then the membrane with no model

### `gross__stomach-intestines__large-intestine`
`gross` · Stomach & Intestines · **Large intestine** · mode `3d_anatomy`
(deferred: `diagram`) · 21 structures (9 parts) · 7 views · 43 ops · **candidate** ·
covers `["Large intestine"]` · audited 2026-08-29

- **All three taeniae coli exist and the previous run said they did not.** `FMA76893` free taenia,
  `FMA76891` mesocolic taenia, `FMA76892` omental taenia. The small-intestine scene's `gaps[]` claims the
  appendix and the rectum are the only large-bowel meshes in 934; that search did not include the word
  *taenia*. **A negative catalog result is only as good as the word you searched for.** (2026-08-29: that
  correction has since been applied in the small-intestine file itself; the note here is now the record of
  the failure mode, not open work.)
- **Three measured anchors, added at audit 2026-08-29.** `gaps[]` had said none could be placed because
  the meshes were not local; all eighteen were. Base of the appendix (three taeniae converging, gaps
  0.37–0.62 mm), rectosigmoid junction (three taeniae at the top of the rectum), anorectal ring (rectum
  against external sphincter, 0.17 mm). All `needs-review`. The first is deliberately **not** called
  McBurney's point — that is a point on the abdominal wall, and no abdominal-wall mesh is in this scene.
- **The colon is taught by the bands that lie on it.** The taeniae run from the base of the appendix to the
  rectosigmoid junction, so they carry the entire course of a tube that has no mesh — rule 2(b) at its most
  useful. Beat 2 traces `concept:faecal-stream` along the **free taenia end to end**, from the base of the
  appendix to the rectosigmoid junction, with the liver and spleen lit beside the two flexures as landmarks.
  (2026-08-29: it used to run free → *liver* → omental → *spleen* → mesocolic, which put stool through two
  solid organs and implied one band per colonic segment — which beat 1 denies. Corrected.)
- **The four-feature spotter answer is beat 3**: taeniae, haustra, appendices epiploicae, calibre and
  position — run as `COMPARE_STRUCTURES` against `FMA7208` ileum, and repeated as the plain-film contrast.
- **Both ends are real meshes.** `FMA14542` appendix at the start with McBurney's point and the wandering
  tip; `FMA14544` rectum and `FMA21930` external anal sphincter at the end, where beat 5 cuts sagittally and
  teaches the pectinate line — the two blood supplies, two venous drainages, two lymphatic fields and two
  sensations that decide why a haemorrhoid is painless and a fissure is not.
- **The midgut–hindgut line at the splenic flexure is beat 4**, with `FMA14749` and `FMA14750` compared
  head to head, the referred-pain shift from umbilical to suprapubic, and the marginal artery watershed.
- **Held at `candidate`, not `ready`, and the reason is not a validator failure.** All eight stages pass.
  A large intestine scene with no caecum and no colon wall cannot answer *identify the structure arrowed*,
  so it is not shippable to a student even though it is fully authored.
- Gaps: **no caecum and no colon of any kind**; no haustra or appendices epiploicae; no ileocaecal valve;
  no anal canal, internal sphincter or pectinate line; no colic arteries and **no marginal artery of
  Drummond**, the vessel the whole watershed idea rests on; both flexures taught through liver and spleen;
  no mesocolon or peritoneum. No anchors — none of these meshes is in the local decimated set.

### `gross__stomach-intestines__peritoneum-mesentery`
`gross` · Stomach & Intestines · **Peritoneum & mesentery** · mode `diagram`
(deferred: `3d_anatomy`) · 22 structures (18 parts) · 7 views · 34 ops · **planned** ·
covers `["Peritoneum & mesentery"]` · **audited 2026-08-29**

- **AUDIT 2026-08-29 — one change.** The curriculum asks for `location` and `cross_section`. The scene had
  four `location` beats, two `comparison` and one `mechanism`, and no `cross_section` — yet beat 3 carries a
  `CROSS_SECTION` op and is the beat that cuts through the lesser sac to show the epiploic foramen. Re-moded
  beat 3 `location` → `cross_section`; the required view was authored all along and mislabelled. Also
  corrected `gaps[]`, which said "twenty-three regions" where the file has twenty-two — the run-log
  arithmetic habit again. The catalog absence claim was re-tested at audit under twenty spellings
  (periton, mesenter, mesocol, omentu, falciform, serous, bursa, sac, recess, pouch, epiploic, teres,
  ligament, caecum, cecum, colon …) and holds: the only near hits are the three mesenteric vessels and
  `FMA76891` mesocolic taenia, which is a band on the colon and not a mesocolon. Routing to `diagram` stands.

- **Routed to its deferred mode, exactly as the pleura was.** Searching all 934 entries for peritoneum,
  mesentery, mesocolon, omentum, falciform, serous and sac returns nothing. A 3D scene here would show a
  stomach, a liver and some bowel with the subject missing from between them. `3d_anatomy` stays first in
  the curriculum's `preferred_modes` and is recorded in `deferred_modes`.
- **This is the third serous membrane to fail the same way** — pleura, pericardium, peritoneum. The free
  set is solid organs, muscles, bones and vessels; membranes and the folds derived from them are not in it.
  **This is now a provider limit, not a coverage gap, and no further ingest of the same archive fixes it.**
- **Beat 2 is the whole of abdominal pain**: one membrane, two nerve supplies, and appendicitis narrated as
  the two in sequence — umbilical while visceral, right iliac fossa once parietal.
- **Beat 3 gives the epiploic foramen its four boundaries and the Pringle manoeuvre**; beat 4 teaches every
  mesentery by what runs inside it; beat 5 sorts SAD PUCKER into primarily and secondarily retroperitoneal;
  beat 6 traces `concept:peritoneal-fluid` down the gutters to Morison's pouch and the pouch of Douglas,
  which is the FAST scan and the pelvic abscess in one path.
- **`planned`, because no artwork exists.** It needs two drawings, not one: a sagittal section showing the
  sheet folding round the organs, and a transverse section at the level of the foramen.
- Gaps: no model for any part of the subject; anterior abdominal wall folds deliberately left to the
  inguinal scenes; the broad ligament left to Pelvis & Perineum; mesothelium left to a histology scene that
  does not exist yet.

**60 scenes · 43 ready · 6 candidate · 11 planned · 0 blocked · 5485 term mappings.**
**Stomach & Intestines 4 of 5. Gross Anatomy 48 of 81 ready, 65 of 81 attended.**

## Run 2026-08-27 (run 30) — the last artery in the topic, then the first organ of the next

### `gross__stomach-intestines__gut-blood-supply`
`gross` · Stomach & Intestines · **Gut blood supply (coeliac/SMA/IMA)** · mode `diagram`
(deferred: `3d_anatomy`) · 29 structures (28 parts) · 7 views · 42 ops · **planned** ·
covers `["Gut blood supply (coeliac/SMA/IMA)"]` · audited 2026-08-29

- **Routed to `diagram` because `diagram` is FIRST in its `preferred_modes`, not because models are
  missing.** This is the opposite case to the peritoneum scene and it is worth naming: the coeliac,
  superior mesenteric and inferior mesenteric arteries all exist as meshes, and the scene was still
  authored as a drawing. The subject is a territory map — which artery owns which stretch of gut — and the
  answer is two junction lines, not three shapes floating in front of an aorta.
- **The two junction lines are the whole topic.** Foregut becomes midgut at the major duodenal papilla,
  halfway along the second part of the duodenum; midgut becomes hindgut two-thirds along the transverse
  colon. Beat 1 draws them and every later beat refers back to them.
- **The fourteen ids for the deferred 3D version are written into `gaps[1]`** as of 2026-08-29, so nobody
  re-runs the search that has failed nine times in this corpus. The trap worth repeating: the catalog spells
  it **`FMA50737` celiac artery**, and "coeliac" returns nothing. All fourteen are in `meshes-lite/`.
- **Beats 2–4 are one artery each, branches in examinable order** — beat 3 now gives *both* orders, along
  the artery (IPDA, middle, right, ileocolic) and along the gut (the reverse), because it used to promise
  "the exam answer" and give only the second. Each is traced as
  `concept:arterial-blood` from the aorta to the territory it feeds. Beat 5 is the anastomotic network —
  pancreaticoduodenal arcade, marginal artery of Drummond, arc of Riolan — and the two watersheds,
  Griffiths at the splenic flexure and Sudeck's at the rectosigmoid.
- **Beat 6 is portal drainage** including the one vein that does not follow its artery, and **beat 7 reads
  a patient backwards to an artery**: epigastric–periumbilical–suprapubic mapped to coeliac–SMA–IMA, with
  embolic ischaemia, mesenteric angina, ischaemic colitis and the appendicitis pain shift.
- **The 3D promotion work is pre-done in `gaps[]`.** Unusually for a deferred scene, every resolvable
  vessel and gut segment is named there so the future author does not repeat the lookup.
- Gaps: no colon of any kind in the catalog, no portal vein, no gastroduodenal, colic or rectal arteries;
  referred-pain bands should become wall anchors in a 3D version; splanchnic afferents left to a
  neuroanatomy sequence scene that does not exist yet.

### `gross__liver-biliary-tract-pancreas-spleen__liver`
`gross` · Liver, Biliary Tract, Pancreas & Spleen · **Liver** · mode `3d_anatomy`
(deferred: `diagram`) · 23 structures (13 parts) · 8 views · 62 ops · **ready** · audited 2026-08-29 ·
covers `["Liver"]`

- **First scene of a new topic, and it is `ready`.** `FMA7197` liver, `FMA7202` gallbladder, `FMA10951`
  inferior vena cava, `FMA14771` common hepatic artery, `FMA50737` coeliac, `FMA14331`/`FMA14332` splenic
  and superior mesenteric veins, plus nine context meshes for the visceral-surface impressions.
- **Cantlie's line is taught by its two endpoints, both of which are real meshes.** The functional
  interlobar plane runs from the gallbladder fossa in front to the groove for the inferior vena cava
  behind, so beat 2 compares `gallbladder` and `ivc` head to head and lets the plane fall between them —
  rule 2(b) used on a plane rather than on an organ. Four anatomical lobes, two functional halves and
  eight Couinaud segments are separated in that one beat.
- **The portal vein is absent and is taught as its two tributaries.** The narration states outright that
  there is no portal vein until the confluence behind the neck of the pancreas, so the substitution is
  visible to the student rather than hidden.
- **Beat 3 is the porta hepatis and the triad in its examined arrangement** — duct right, artery left, vein
  behind — ending in the Pringle manoeuvre and the four boundaries of the epiploic foramen.
- **Beat 4 is the dual supply**, two traces in one view: `concept:arterial-blood` down the coeliac and
  `concept:portal-blood` from the gut through the liver into the cava. First-pass metabolism, zone 3
  necrosis, metastasis and arterial embolisation all fall out of that one architecture.
- **Beat 5 does peritoneum by relation.** No ligament has a mesh, so the bare area is taught as the patch
  where liver meets diaphragm directly, and Morison's pouch as the space between liver and right kidney.
- **Beat 7 is the axial slice the curriculum asked for and the scene did not have** (added at audit,
  2026-08-29; the old beat 7 became beat 8). The cava in its groove is the orientation point.
- **Six measured anchors on `FMA7197`, added at audit** — gallbladder fossa, groove for the inferior vena
  cava, and the renal, suprarenal, duodenal and gastric impressions, each the centroid of the contact patch
  with the neighbour that makes it (gaps 0.18–0.78 mm), all `needs-review`. The porta hepatis and the
  oesophageal groove were attempted and refused at 3.78 mm and 4.07 mm; the bare area emitted and was
  rejected by judgement, because the liver-diaphragm contact is the whole diaphragmatic surface.
- Gaps: no lobes, no segments, no bile ducts of any kind, no hepatic veins, no peritoneal ligaments, no
  pancreas. The old claim that `FMA7197` is not in the local decimated set was **false** — every one of
  this scene's seventeen meshes is in `meshes-lite/`. Does **not** claim `Biliary tree & gallbladder` or
  `Portal venous system`.

**62 scenes · 44 ready · 6 candidate · 12 planned · 0 blocked · 5791 term mappings.**
**Stomach & Intestines 5 of 5 attended. Gross Anatomy 49 of 81 ready, 67 of 81 attended.**

---

## Run 2026-08-27 (run 31) — the tree with no branches, then the gland with no gland

### `gross__liver-biliary-tract-pancreas-spleen__biliary-tree-gallbladder`
`gross` · Liver, Biliary Tract, Pancreas & Spleen · **Biliary tree & gallbladder** · mode `3d_anatomy`
(deferred: `diagram`) · 17 structures (10 parts) · 6 views · 43 ops · **candidate** ·
covers `["Biliary tree & gallbladder"]` · audited 2026-08-29

- **The "no local geometry" gap note was false.** It claimed `FMA7202` was not in `meshes-lite/` and that
  no anchor could be measured. It is, and so are the liver, duodenum and pancreatic duct. Five anchors were
  measured at audit and added, all `needs-review`: fundus (EXTREME −z) and neck/Hartmann's pouch (EXTREME +z)
  on the gallbladder, its contact with the duodenum (0.44 mm, and nearer the neck than the body — the
  narration is written to the measurement), the gallbladder fossa on the liver (98-vertex patch, 0.18 mm),
  and the major duodenal papilla on the duodenum where the pancreatic duct meets the wall (1.26 mm).

- **The gallbladder is real, the tree is not.** `FMA7202` gallbladder, `FMA7197` liver, `FMA10419`
  pancreatic duct and `FMA7206` duodenum are the four points bile passes through that actually exist;
  every duct between them — right and left hepatic, common hepatic, cystic, common bile — is absent from
  all 934 entries. The scene is `candidate` for exactly that reason and says so in the first gap.
- **Bile is authored as a concept, which is what the vocabulary is for.** Beat 2 runs
  `concept:bile-storage` liver→gallbladder and `concept:bile-release` gallbladder→pancreatic duct→duodenum.
  Every waypoint is a real mesh in the right place; the leg the trace skips is the missing duct, and the
  narration names the duct order in full so the student still learns the sequence.
- **Calot's triangle is taught by the one boundary that exists.** Two of its three sides are ducts, so
  beat 3 uses `FMA14771` common hepatic artery — parent of the cystic artery under rule 2(a) — and the
  gallbladder, and names the boundaries. The critical view of safety and the caterpillar-hump trap are in
  the narration.
- **Beat 4 is the teaching spine of the scene: one stone, four diseases, sorted by where it lodges** —
  Hartmann's pouch (colic), cystic duct (cholecystitis, positive Murphy's), common bile duct
  (choledocholithiasis, obstructive jaundice, cholangitis with Charcot/Reynolds), ampulla (gallstone
  pancreatitis, because bile duct and pancreatic duct share the last centimetre).
- **Beat 6 does Courvoisier properly**, including the ultrasound levels: intrahepatic only, dilated CBD
  with normal pancreatic duct, or the double duct sign.
- Gaps: no duct of any kind; the pancreatic duct stands in for the biliary half of the common channel and
  the label says so; no cystic artery mesh; no sphincter or papilla (the duodenum is one model); no
  anchors, `FMA7202` is not in the local decimated set. Does **not** claim `Pancreas` or
  `Portal venous system`.

### `gross__liver-biliary-tract-pancreas-spleen__pancreas`
`gross` · Liver, Biliary Tract, Pancreas & Spleen · **Pancreas** · mode `3d_anatomy`
(deferred: `diagram`) · 18 structures (10 parts) · 6 views · 44 ops · **candidate** · audited 2026-08-29 ·
covers `["Pancreas"]`

- **The gland has no mesh; its duct does.** `FMA10419` runs the full length of the pancreas, so it
  occupies the organ's exact position and axis — rule 2(a), the most specific part that exists. Head,
  neck, body, tail and uncinate process are read off the duct's course and named in narration, and all
  five are in `terms[]` so a note saying "uncinate process" still opens this scene. Fourth consecutive
  scene to represent this gland by its duct alone.
- **The bed is the scene.** `FMA7148` stomach in front across the lesser sac; `FMA3784` aorta, `FMA10951`
  cava, `FMA7205` left kidney, `FMA15630` left suprarenal behind; `FMA14749`/`FMA14332` superior mesenteric
  artery and vein behind the neck; `FMA14773`/`FMA14331` splenic vessels along and behind the body;
  `FMA7196` spleen at the tail; `FMA13072` first lumbar vertebra for the transpyloric plane.
- **Beat 3 splits the gland by destination, not by histology**: `concept:pancreatic-juice` to the duodenum,
  `concept:islet-hormones` into the splenic and superior mesenteric veins and on to the liver. Trypsinogen
  and enterokinase are given as the mechanism of pancreatitis rather than as a list.
- **Beat 5 is a transpyloric axial slice read front to back**, ending in the two landmarks that find an
  atrophic pancreas on any scan: the splenic vein tracing its posterior surface and the SMA in its fat ring
  behind the neck.
- **Beat 6 derives the presentations from the relations already drawn** — boring back pain from the coeliac
  plexus between gland and aorta, Grey Turner and Cullen from retroperitoneal tracking, Courvoisier and the
  double duct sign from the bile duct in the head, and resectability from the portal confluence.
- Gaps: no pancreas mesh; no islets (a microscopic subject, and the histology course carries them); no bile
  duct; no gastroduodenal or pancreaticoduodenal arteries or arcades; no portal vein; no lesser sac or
  transverse mesocolon. **Two measured anchors added at audit (2026-08-29)** — the ampulla (duct-duodenum
  contact, 1.26 mm) and the tail (extreme +x on the duct); five others refused, all for the same reason,
  that the duct is separated from every defining vessel by the thickness of a gland that has no mesh. The
  old claim that `FMA10419` and `FMA7206` are not in the local decimated set was **false**. Does **not**
  claim `Spleen` or `Portal venous system`.

**64 scenes · 44 ready · 8 candidate · 12 planned · 0 blocked · 6011 term mappings.**
**Gross Anatomy 49 of 81 ready, 69 of 81 attended. Topic 13 is 3 of 5 attended; `Spleen` is next.**

## Run 2026-08-27 (run 33) — the organ whose inside has no meshes, twice over

| course | topic | structure | mode | mesh parts | status | scene |
|---|---|---|---|---|---|---|
| Gross Anatomy | Kidney & Posterior Abdominal Wall | Kidney | 3d_anatomy | 35 structures, 21 parts (both kidneys, both renal arteries and veins, both ureters, psoas, quadratus lumborum, transversus abdominis, diaphragm, 12th rib; 8 measured anchors — both poles and both hila, the PUJ and the renal angle) | ✅ ready · audited 2026-08-29 | `scenes/gross__kidney-posterior-abdominal-wall__kidney.json` |
| Gross Anatomy | Kidney & Posterior Abdominal Wall | Suprarenal (adrenal) gland | 3d_anatomy | 17 structures, 11 parts (both glands, both kidneys, IVC, left renal vein, aorta, renal artery, diaphragm; 2 measured anchors on the gland-kidney fascial septum) | ✅ ready · audited 2026-08-29 | `scenes/gross__kidney-posterior-abdominal-wall__suprarenal-adrenal-gland.json` |

- **Kidney** — resolved outright and generously. `right kidney`, `left kidney`, both renal arteries, both
  renal veins and both ureters all exist, and so does the entire muscular bed: psoas major, quadratus
  lumborum, transversus abdominis and the diaphragm. That is unusual for this corpus — the bed is normally
  the thing that is missing — so beat 2 turns the body round and teaches the posterior approach against real
  muscle rather than narration. The rib rule (twelfth crosses both kidneys, eleventh crosses the left only)
  is drawn, and the "stay below the twelfth rib or you enter the pleura" point is made against the same bone.
- **The kidney's inside is entirely narrated.** No cortex, medulla, pyramid, papilla, column, calyx or renal
  pelvis exists. Beat 3 is a `CROSS_SECTION` of the solid organ with the coverings and the cortex-to-pelvis
  sequence spoken over it, plus `PEEL_LAYER` authored for the four coverings so the beat becomes real when
  layered models arrive. Every internal name is in `match.terms`, so a note saying "column of Bertin" still
  opens the scene at the right subject.
- **The asymmetry is the spine of the scene.** Aorta left of the midline, cava right of it, therefore long
  right artery behind the cava and short right vein, short left artery and long left vein crossing in front
  of the aorta under the SMA. Beat 4 traces `concept:renal-blood` and compares the two veins, which carries
  the nutcracker, the left varicocele and why the left kidney is the transplant kidney.
- **Suprarenal (adrenal) gland** — both glands exist; nothing else of theirs does. No suprarenal vein and no
  suprarenal artery of any of the three orders. Beat 3 therefore teaches "three arteries in, one vein out"
  through the vessels the branches come **from** — diaphragm for the inferior phrenic, aorta for the middle,
  renal artery for the inferior, cava and left renal vein as the two destinations. Option (b), adjacent
  structures that exist, and every label says so.
- **Cortex and medulla are narrated over a cut of the whole gland**, the same compromise as the kidney. The
  scene keeps `diagram` in `deferred_modes` and says in `gaps[]` that a diagram-mode companion would teach
  the three zones better than the 3D model can.
- Gaps: no renal cortex/medulla/calyx/pelvis; no renal capsule, perirenal fat, renal fascia or pararenal
  fat; no segmental arteries; no gonadal veins; no suprarenal veins or arteries; no adrenal cortex or
  medulla; no splanchnic nerves or coeliac plexus; no peritoneum; no anchors (neither mesh set is local).
  Ribs are single-sided in the catalog, so the eleventh rib shown is the right one used to teach a left
  relation — said plainly in the label, the narration and `gaps[]`.
- Neither scene claims `Ureters` or `Abdominal aorta & IVC`, though both appear in the kidney scene; the
  kidney scene does not claim `Suprarenal (adrenal) gland` and the adrenal scene does not claim `Kidney`.

**68 scenes · 47 ready · 9 candidate · 12 planned · 0 blocked · 6505 term mappings.**
**Gross Anatomy 52 of 81 attended. Topic 14 is 2 of 5 attended; `Ureters` is next.**

## Run 2026-08-27 (run 34) — the tube and the two vessels it runs between

| course | topic | structure | mode | mesh parts | status | scene |
|---|---|---|---|---|---|---|
| Gross Anatomy | Kidney & Posterior Abdominal Wall | Ureters | 3d_anatomy | audited 2026-08-29 (referred-pain levels reconciled with the kidney scene; the vas, added earlier as `vas_r`, is now actually shown in beat 2 with a relationship to the ureter — the male water-under-the-bridge crossing had been narrated over a hidden group) · 22 structures, 6 parts (both ureters, bladder, right psoas, right common iliac artery; kidneys, iliac arteries, renal arteries, aorta, cava, sacrum, L5, hip bone, prostate, seminal vesicle as context) | ✅ ready | `scenes/gross__kidney-posterior-abdominal-wall__ureters.json` |
| Gross Anatomy | Kidney & Posterior Abdominal Wall | Abdominal aorta & IVC | 3d_anatomy | 35 structures, 14 parts (aorta, cava, coeliac, SMA, IMA, both renal arteries, both common iliac arteries, both renal veins, both common iliac veins, diaphragm; all six vertebral levels T12-L5 as bone, duodenum) · 6 views incl. associated_organs | ✅ ready · audited 2026-08-29, May-Thurner side error fixed | `scenes/gross__kidney-posterior-abdominal-wall__abdominal-aorta-ivc.json` |

- **Ureters** — both `right ureter` and `left ureter` exist, and so does everything the course is measured
  against: psoas major for the abdominal part, the common iliac artery for the crossing at the brim, the hip
  bone for the ischial-spine turn, the sacrum and L5 for the line on a plain film, and the bladder for the
  end. Beat 2 traces the whole course as `TRACE_STRUCTURE` along that path, so the ureteric line a student
  reads off a KUB is drawn rather than described.
- **The three constrictions are the one thing this scene cannot point at.** Start, brim, entry — the most
  examinable fact about the ureter — are narrated over a continuous mesh with no anchors, because these
  models are not in the local decimated set and a measured anchor could not be placed honestly. Ingesting
  `FMA15571` and `FMA15572` would yield three anchors a side and make beat 3 clickable.
- **The female pelvis is the weak half.** No uterus, cervix, vagina, broad ligament or uterine artery exists,
  so "water under the bridge" — the commonest cause of surgical ureteric injury — is taught through the
  internal iliac trunk and words. No vas deferens either; the male crossing is narrated against the prostate
  and seminal vesicle, both of which do exist. Beat 5 still names the four operations that damage a ureter.
- **Abdominal aorta & IVC** — resolved unusually well for a vascular subject. All three unpaired branches
  exist (`celiac artery`, `superior mesenteric artery`, `inferior mesenteric artery`) with the coeliac tripod
  complete, both renal arteries and veins, both common iliac arteries and veins, and the external and
  internal iliacs on the right. Beat 2 traces `concept:arterial-flow` down the aorta through the three
  midline branches; beat 3 traces `concept:venous-return` up from the external iliac vein to the liver.
- **The gut-does-not-drain-to-the-cava point is drawn, not asserted.** `superior mesenteric vein` and
  `splenic vein` are carried as a `Portal system` group precisely so beat 3 can show the two roots heading
  for the liver instead of the cava. There is no portal vein mesh, so the confluence itself is described.
- **`FMA3784` is the whole descending aorta**, thoracic and abdominal in one mesh, so the aortic hiatus at
  T12 cannot be shown as a boundary. L1, L4 and L5 are carried as whole vertebrae to fix three of the six
  branch levels visually; the other three, and all of the lumbar, phrenic, suprarenal, gonadal and median
  sacral branches, are recited. No hepatic veins, no lumbar or gonadal veins, no azygos, no cisterna chyli.
- Neither scene claims `Gut blood supply (coeliac/SMA/IMA)`, `Portal venous system`, `Kidney`, `Urinary
  bladder` or `Psoas major & posterior wall`, though all appear in one or both. All remain on the worklist.

**70 scenes · 49 ready · 9 candidate · 12 planned · 0 blocked · 6833 term mappings.**
**Gross Anatomy 54 of 81 attended. Topic 14 is 4 of 5 attended; `Psoas major & posterior wall` is next.**

## Run 2026-08-27 (run 35) — the muscle the plexus hides in, then the ring the head passes through

### `gross__kidney-posterior-abdominal-wall__psoas-major-posterior-wall`

`gross` · Kidney & Posterior Abdominal Wall · **Psoas major & posterior wall** · `3d_anatomy` ·
26 structures (15 parts) · 6 views · 44 ops · **ready** · audited 2026-08-29 · degrades `PEEL_LAYER`

Four measured anchors: the iliac fossa and the lesser trochanter (reviewed 2026-08-28), plus the tip
of the L3 transverse process and the iliac attachment of quadratus lumborum, added 2026-08-29.

Covers `Psoas major & posterior wall`. The last structure in topic 14, which is now complete.

All five muscles of the wall are present bilaterally where it teaches something — psoas major
(`FMA22342`/`FMA22343`), iliacus (`FMA22322`/`FMA22323`), quadratus lumborum (`FMA22348`/`FMA22349`),
transversus abdominis (`FMA22344`/`FMA22345`) — with the diaphragm (`FMA13295`) as the roof and the two
arcuate ligaments narrated over it. Attachments are shown as bone, not asserted: L1, L3 and L5, the L2 disc,
the right hip bone for the iliac fossa, the right femur for the lesser trochanter, the twelfth rib for
quadratus lumborum and the sacrum for the brim. Relations are shown as relations: kidney, ureter, aorta,
cava.

Six beats: the five muscles medial to lateral; what psoas does, traced spine to lesser trochanter; what
lies on its anterior surface, with the ureter traced down it; a `CROSS_SECTION` at L3 for the lumbar plexus
inside the muscle; the arcuate ligaments above and the muscular lacuna below; and the clinic — psoas
abscess traced from the L2 disc to the groin, the psoas sign, the psoas haematoma with femoral nerve palsy,
the psoas shadow.

**Gap that matters:** not one nerve of the lumbar plexus exists in the catalog. Beat four — the reason the
muscle is examined at all — is narration over a cut muscle. Also absent: psoas minor, psoas fascia and iliac
fascia (the sheath is the entire mechanism of the abscess), the lumbar sympathetic trunk, the lumbar and
gonadal vessels.

### `gross__pelvis-perineum__bony-pelvis`

`gross` · Pelvis & Perineum · **Bony pelvis** · `3d_anatomy` ·
22 structures (14 parts) · 6 views · 59 ops · **ready** · degrades `PEEL_LAYER` ·
**audited 2026-08-29** — five measured landmark anchors added (ASIS, pubic tubercle, ischial spine, ischial
tuberosity, sacral promontory), all `needs-review`; the gap note claiming the meshes were not local was
false and has been rewritten.

Covers `Bony pelvis`. Opens topic 15.

Both hip bones (`FMA16586`/`FMA16587`), the sacrum (`FMA16202`) and L5 for the lumbosacral angle. Piriformis
(`FMA22340`) marks the greater sciatic foramen, obturator internus (`FMA22324`) the lateral wall and the
obturator canal, and coccygeus (`FMA46443`) stands where the sacrospinous ligament runs. The common,
external and internal iliac arteries trace the brim and show where it divides the greater pelvis from the
lesser. Bladder and rectum are context only, to show what the true pelvis holds.

Six beats: four bones and three joints as a load-bearing ring; the brim traced from a superior view; a
midline `CROSS_SECTION` for the curved canal and the three conjugates; the notches converted into foramina
and what leaves through each; female versus male feature by feature; and the clinic — ring fracture and
haemorrhage, bladder and urethral injury, the ischial spine as station zero and pudendal block target,
cephalopelvic disproportion, the iliac crest as a marrow site.

**Gap that matters:** there is no second pelvis, so beat five compares nothing — the most examinable
material in the topic is spoken over one skeleton. No coccyx. No ligament of the pelvis exists at all:
sacrospinous, sacrotuberous, iliolumbar, pubic symphysis, obturator membrane. The hip bone is one fused
model, so ilium, ischium and pubis cannot be isolated.

- Neither scene claims `Kidney`, `Ureters`, `Abdominal aorta & IVC`, `Pelvic diaphragm (levator ani)`,
  `Urinary bladder` or `Internal iliac vessels`, though all appear in one or both. All remain on the
  worklist.

**72 scenes · 51 ready · 9 candidate · 12 planned · 0 blocked · 7073 term mappings.**
**Gross Anatomy 56 of 81 attended. Topic 14 is complete; topic 15 is 1 of 5, `Pelvic diaphragm (levator
ani)` next.**

---

## Run 2026-08-28 (run 36) — the floor with no vagina, then the reservoir with no trigone

| course | topic | structure | mode | mesh parts | status | scene |
|---|---|---|---|---|---|---|
| Gross Anatomy | Pelvis & Perineum | Pelvic diaphragm (levator ani) | 3d_anatomy | 20 structures, 12 parts (pubococcygeus ×2, puborectalis ×2, iliococcygeus ×2, coccygeus ×2, tendinous arch, rectum, external anal sphincter, urethra; bladder, prostate, obturator internus ×2, piriformis, hip bones, sacrum as context) | ✅ ready | `scenes/gross__pelvis-perineum__pelvic-diaphragm-levator-ani.json` |
| Gross Anatomy | Pelvis & Perineum | Urinary bladder | 3d_anatomy | 24 structures, 17 parts (bladder, both ureters, urethra, prostate, right seminal vesicle, right deferent duct, rectum, right internal iliac artery, right pubococcygeus, right hip bone + 5 measured anchors — both ureteric orifices, internal urethral orifice, neck, apex; left seminal vesicle, left deferent duct, left internal iliac, both kidneys, left pubococcygeus, left hip bone, sacrum as context) | ✅ ready | `scenes/gross__pelvis-perineum__urinary-bladder.json` |

### `gross__pelvis-perineum__pelvic-diaphragm-levator-ani`

The first scene in the corpus where the catalog is generous rather than thin: all three parts of levator ani
exist bilaterally as separate meshes — pubococcygeus, puborectalis, iliococcygeus — and so does coccygeus and,
unexpectedly, the **tendinous arch of levator ani** itself. That last mesh is what makes the scene teach: the
origin of levator ani is a line, only its two ends are bone, and with the arch present beat two can trace the
line from the pubis to the ischial spine and let the three parts name themselves off it.

Five beats: the funnel seen from above; one origin line and three parts, with `TRACE_STRUCTURE` along the
arch; the levator hiatus and what the floor does *not* close; a `contraction_filter` beat on the
puborectalis sling and the anorectal angle as the flap-valve mechanism of faecal continence; and a
`mechanism` beat on support, intra-abdominal pressure, prolapse and obstetric injury.

**Gap that matters:** no vagina, no uterus, no pubovaginalis, no perineal body. The female floor — which is
where this topic is examined and where it is clinically decisive — is taught in narration over male viscera.
Also no anococcygeal body, no coccyx, no nerves, no perineal membrane, so the two-diaphragm distinction is
made in words alone. **Corrected at the 2026-08-29 audit:** beat three had the anal canal passing through the
*urogenital* hiatus, while the two structure cards that describe the same gap had it right. The whole opening
is the levator hiatus; its anterior part, in front of the puborectalis sling and the perineal body, is the
urogenital hiatus and transmits the urethra and the vagina only. All three places now say so, and the learning
goal asks for the distinction rather than for one list.

### `gross__pelvis-perineum__urinary-bladder`

Five beats: empty in the pelvis and full in the abdomen, with the peritoneum-stripping ascent that licenses
suprapubic puncture; apex, base, surfaces and neck; a `cross_section` beat opening the bladder for the
trigone and the oblique intramural ureter; a `mechanism` beat on the three nerve supplies and the micturition
reflex, read forwards into the neurogenic bladder patterns; and the clinic — intraperitoneal versus
extraperitoneal rupture, urethral injury, obstruction back-pressuring to the kidney, and painless haematuria
with the schistosomal squamous variant named for a Nigerian cohort.

**Gap that matters (narrowed at the 2026-08-29 audit):** the trigone still has no mesh, but its three corners
are no longer narration. Both ureteric orifices and the internal urethral orifice are now measured anchors —
the contact patches of the two ureters and the urethra on the bladder wall, at 0.90, 0.87 and 0.41 mm — and
the neck (contact with the prostate, 0.16 mm) and the apex (most anterior vertex, landing on the midline
unforced) with them. Five anchors, all `needs-review`. What is left is the *surface*: the smooth bound mucosa
between the corners and the interureteric bar joining the upper two. The intramural ureteric tunnel — the
anti-reflux mechanism the whole of beat three turns on — still cannot be shown, because the ureter model stops
at the bladder surface. The same audit added both **deferent ducts** (`FMA19235`/`FMA19236`), which beat two
and the seminal-vesicle card had been naming as "the two vasa" over empty space.

- Neither scene claims `Bony pelvis`, `Ureters` or `Internal reproductive organs`, though parts of all three
  appear in one or both. The bladder scene does not claim the pelvic diaphragm and the diaphragm scene does
  not claim the bladder; each carries the other only as context.

## Run 2026-08-28 (run 37) — the tract with no vas, then the trunk with no branches

| course | topic | structure | mode | mesh parts | status | scene |
|---|---|---|---|---|---|---|
| Gross Anatomy | Pelvis & Perineum | Internal reproductive organs | 3d_anatomy | 21 structures, 11 parts (right testis, right epididymis, right vas, left vas, right seminal vesicle, prostate, urethra, corpus cavernosum, bladder, right ureter, rectum, right internal iliac artery, right pubococcygeus; left testis, left epididymis, left seminal vesicle, glans, left internal iliac, left pubococcygeus, hip bones, sacrum, descending aorta as context — vasa added 2026-08-28 from the backlog, aorta added 2026-08-29 in audit) | 🟡 candidate | `scenes/gross__pelvis-perineum__internal-reproductive-organs.json` |
| Gross Anatomy | Pelvis & Perineum | Internal iliac vessels | 3d_anatomy | 22 structures, 12 parts (internal iliac arteries ×2, internal iliac veins ×2, right common iliac artery, right external iliac artery, common iliac veins ×2, piriformis, obturator internus, right ureter, sacrum; left common/external iliac artery, external iliac veins ×2, aorta, IVC, bladder, rectum, prostate, right hip bone as context) | ✅ ready | `scenes/gross__pelvis-perineum__internal-iliac-vessels.json` |

### `gross__pelvis-perineum__internal-reproductive-organs`

**Authored `candidate`, deliberately, and this is the point of the entry.** The curriculum entry reads
"male/female organs in situ" and the catalog holds not one female internal genital organ — no uterus, no
ovary, no uterine tube, no vagina, no cervix. The male half resolves well: testis, epididymis, seminal
vesicle, prostate, urethra, corpus cavernosum and glans all exist bilaterally where they should. So the
scene teaches one sex completely and the other not at all, and marking it `ready` would have closed a
curriculum entry naming both while making the missing half invisible to every future run. `candidate` keeps
it on the HELD list where a human sees it and no future run re-authors it.

Five beats: the tract traced from seminiferous tubule to meatus with the contributions to semen named in
order; descent and what it left behind — L2 vessels, para-aortic lymph, T10 referred pain, the processus
vaginalis; a `cross_section` beat on the prostate by zone rather than lobe, transition versus peripheral read
straight into benign hyperplasia versus carcinoma; the pelvic map with the vas crossing the ureter and its
female twin, the uterine artery; and the three tables — arteries, veins, lymph — read forwards into
varicocele, retrograde ejaculation, torsion and the sclerotic spinal deposit.

**Gap that matters:** there is no **vas deferens** mesh. It is the spine of the whole tract — what makes
testis, epididymis, ampulla and ejaculatory duct one story, what crosses the ureter, what a vasectomy
divides — and beat one traces sperm across an invisible duct. A ductus deferens pair would improve this
scene more than any other single model. Second to it: no prostatic zones, so the beat built on them cuts a
solid object.

### `gross__pelvis-perineum__internal-iliac-vessels`

**Audited 2026-08-29.** Two anatomical repairs: the left-common-iliac-artery card taught May-Thurner
against the wrong artery (it is the RIGHT common iliac artery that pins the left common iliac vein — beat 4
and the aorta-IVC scene both already said so), and the ureter was described as running *medial to* the
internal iliac artery in one card and *in front of* it in another; in front is correct. Beats 2 and 3 now
open by saying that none of the named branches is drawn.

The trunks are all present — internal, external and common iliac, artery and vein, both sides — and **not
one named branch is.** No gluteal, no pudendal, no obturator, no vesical, no uterine, no rectal, no
iliolumbar, no lateral sacral. So the scene takes the honest option the spec offers and teaches each branch
through an adjacent structure that does exist: piriformis carries the above-and-below rule for the gluteal
and pudendal vessels, obturator internus carries the obturator and pudendal canals, the hip bone carries the
foramina, the bladder the vesical branches, the rectum the middle rectal and the portosystemic watershed,
the sacrum the posterior division.

Five `vasculature` beats: the two bifurcations at L4 and the sacroiliac joint, with the ureter crossing the
second; anterior division versus posterior division; how each branch leaves — above piriformis, below
piriformis, or through the obturator canal; the veins as valveless plexuses rather than mirrored branches,
with the vertebral connection and May-Thurner; and why internal iliac ligation works — the collateral
network, the eighty-five per cent drop in pulse pressure, tie distal to the posterior division, find the
ureter first.

**Gap that matters:** the anterior/posterior division split is the organising idea of the scene and the
basis of correct ligation, and the trunk is a single mesh that ends without dividing. Two anchors per side
marking the two origins would make beats two and five demonstrable instead of spoken.

- Neither scene claims `Bony pelvis`, `Urinary bladder` or `Pelvic diaphragm (levator ani)`, all already
  authored in this topic and carried here only as territory, relations or landmarks. The vessels scene does
  not claim `Abdominal aorta & IVC` either, though it borrows `FMA3784` and `FMA10951` as parents.

**76 scenes · 54 ready · 10 candidate · 12 planned · 0 blocked · 7616 term mappings.**
**Gross Anatomy 59 of 81 ready, 22 held. Topic 15 complete and the gross worklist walked to its end; the
cursor now stands at `embryology / Gametogenesis & Fertilization / Spermatogenesis & oogenesis`.**

## Run 2026-08-28 (run 38) — Embryology opens: two sequence scenes, no meshes at all

| course | topic | structure | mode | parts | status | scene |
|---|---|---|---|---|---|---|
| Embryology | Gametogenesis & Fertilization | Spermatogenesis & oogenesis | sequence (svg) | 20 regions, 18 parts (primordial germ cells; Sertoli, Leydig, seminiferous tubule; spermatogonium → primary spermatocyte → secondary spermatocyte → spermatid → spermiogenesis → spermatozoon; oogonium → primary oocyte → secondary oocyte → polar bodies → ovum; follicle; meiosis I, meiosis II, nondisjunction, the six-line comparison) · 8 views · 39 ops | 🔵 planned | `scenes/embryology__gametogenesis-fertilization__spermatogenesis-oogenesis.json` |
| Embryology | Gametogenesis & Fertilization | Fertilization | sequence (svg) | 16 regions, 14 parts (ampulla, fertile window; capacitation, capacitated sperm; corona radiata, zona pellucida/ZP3; acrosome reaction, oolemma fusion; fast block, cortical & zona reaction, polyspermy failure; completion of meiosis II, pronuclei, syngamy, the four results, clinical uses) · 8 views · 37 ops | 🔵 planned | `scenes/embryology__gametogenesis-fertilization__fertilization.json` |

### `embryology__gametogenesis-fertilization__spermatogenesis-oogenesis`

The first embryology scene in the corpus and the first genuine mode switch: `sequence`, the structure's
**first** preferred mode, not a downgrade — the curriculum offers only `sequence` then `diagram` here, and
`diagram` is the sole entry in `deferred_modes`. No `refs` anywhere, provider `svg`, and nothing was looked
up in `available-meshes.json` because a cell lineage over time has no mesh to look up.

Two authoring conventions are set here for the rest of Embryology, and are written into `gaps[]` so the next
run either follows them or changes them deliberately. First, **ploidy goes in the label** — "Primary
spermatocyte (2n, 4C)" — so the number a student is examined on is visible without opening the narration.
Second, **the two germ lines are separate groups**, so `ISOLATE_REGION` can run one column at a time through
beats 2–6 before beat 8 sets them side by side.

Eight beats: one origin in the yolk sac; the seminiferous tubule read from basement membrane to lumen with
the blood-testis barrier drawn across it; the male chain with its ploidy attached; spermiogenesis as
remodelling rather than division; her fixed stock of oogonia; the two arrests and what releases each;
meiosis I versus meiosis II with nondisjunction hanging off both; and the six-line male/female comparison
that answers most questions on the topic.

### `embryology__gametogenesis-fertilization__fertilization`

Same disposition — `sequence` first, `diagram` deferred, `svg`, no refs. Eight beats from the ampulla and the
fertile window through capacitation, the two coats, the acrosome reaction and IZUMO1–JUNO fusion, both blocks
to polyspermy, release of the metaphase II arrest by the same calcium wave that hardens the zona, pronuclei
and syngamy on the sperm's own centriole, and the four results with the places assisted reproduction steps
around each barrier.

The scene **stops at the first cleavage spindle on purpose**: `Cleavage & morula` is the next curriculum
structure and would otherwise be half-taught here without being claimable in `covers[]`. Its overlap with the
gametogenesis scene is bounded the same way — that scene ends at the metaphase II arrest, this one begins by
releasing it.

- Both scenes are `covers`-honest: one curriculum name each, exactly as the curriculum spells it. Neither
  claims `Cleavage & morula` or `Blastocyst`.
- Both are **`planned`, and that is the ceiling for this mode today**. Every stage of the validator passes;
  the block is that no SVG artwork exists for either scene, so nothing renders. Each `gaps[]` entry names the
  specific drawing needed to promote it to `ready`.

**78 scenes · 54 ready · 10 candidate · 14 planned · 0 blocked · 7912 term mappings.**
**Gross Anatomy 59 of 81 ready, 24 held. Embryology 0 of 46 ready with the first 2 authored and held on
artwork; the cursor now stands at `embryology / Gametogenesis & Fertilization / Cleavage & morula`.**

## Run 2026-08-28 (run 39) — Week 1 completed: cleavage, the morula and the blastocyst

| course | topic | structure | mode | parts | status | scene |
|---|---|---|---|---|---|---|
| Embryology | Gametogenesis & Fertilization | Cleavage & morula | sequence (svg) | 14 regions, 12 parts (the tubal journey; zygote → 2-cell → 4-cell → 8-cell; division without growth; embryonic genome activation; compaction; morula; inner cells, outer cells; the zona's three jobs; early twinning; day-3 clinical) · 8 views · 38 ops | 🔵 planned | `scenes/embryology__gametogenesis-fertilization__cleavage-morula.json` |
| Embryology | Gametogenesis & Fertilization | Blastocyst | sequence (svg) | 12 regions, 11 parts (uterine cavity days 4–6; cavitation; blastocoele, inner cell mass, trophoblast; embryonic and abembryonic poles; hatching; implantation onset; hCG and corpus luteum rescue; late twinning; day-5 clinical) · 8 views · 38 ops | 🔵 planned | `scenes/embryology__gametogenesis-fertilization__blastocyst.json` |

### `embryology__gametogenesis-fertilization__cleavage-morula`

`sequence` first, `diagram` deferred, provider `svg`, no refs — the third scene in a row where nothing was
looked up in `available-meshes.json`, because a four-day cell lineage has no mesh to look up.

The organising idea is **division without growth**, and it is authored as a `COMPARE_STRUCTURES` between the
zygote and the eight-cell embryo in beat 2. That comparison only teaches if the artwork draws every stage to
the same outer diameter, so `gaps[]` states the constraint as a requirement of the drawing rather than a
preference: an illustration that enlarges the later stages for legibility teaches the opposite of the
narration.

Eight beats: the four-day tubal journey with a day marked at each position; cleavage as mitosis with the
growth phases cut out; the maternal-to-zygotic handover at four-to-eight cells and why so many embryos arrest
exactly there; compaction as the first cell-fate decision; a cut morula separating inner cells from outer;
the zona's three simultaneous jobs and why losing it early means a tubal ectopic; the dichorionic split; and
day three as a clinic sees it.

### `embryology__gametogenesis-fertilization__blastocyst`

Same disposition. The curriculum asks for `cross_section` and `mechanism` here and both are authored — beat 1
is the cut, and it is deliberately the opening beat, because the three-part answer (trophoblast, cavity,
inner cell mass) is what the structure is examined on.

Cavitation is authored as mechanism rather than as a stage: a sealed sheet plus a sodium pump plus
aquaporins, which is why the cavity expands and why that expansion is what thins the zona. Hatching is then
given its own beat with the rule stated as an order — hatching before implantation, always — because that
ordering is what makes assisted hatching intelligible.

- Both scenes are `covers`-honest: one curriculum name each. Neither claims `Implantation` or
  `Bilaminar embryonic disc`, which are the next topic; the blastocyst scene stops at the *start* of
  implantation and says so in `gaps[]`.
- **Twinning is narrated in both scenes on purpose.** The dichorionic-diamniotic split happens before day
  three and the monochorionic splits after, so a student meets one rule from both ends. There is no twinning
  entry in the curriculum, so neither scene claims one.
- Both are `planned` for the same reason as run 38: every validator stage passes, and no SVG artwork exists.
  Each `gaps[]` entry names the specific drawing that would promote it.

**80 scenes · 54 ready · 10 candidate · 16 planned · 0 blocked · 8106 term mappings.**
**Gross Anatomy 59 of 81 ready, 24 held. Embryology 0 of 46 ready with topic 1 now complete — all 4
structures authored and all 4 held on artwork; the cursor now stands at
`embryology / Weeks 1-2: Implantation & Bilaminar Disc / Implantation`.**

## Run 2026-08-28 (run 40) — Week 2 begins: implantation and the bilaminar disc

| course | topic | structure | mode | parts | status | scene |
|---|---|---|---|---|---|---|
| Embryology | Weeks 1-2: Implantation & Bilaminar Disc | Implantation | sequence (svg) | 15 regions, 14 parts (window of implantation; apposition, adhesion, invasion; cytotrophoblast vs syncytiotrophoblast; lacunae, maternal sinusoids, primary villi; decidual reaction and basalis/capsularis/parietalis; closing plug and full burial; hCG and corpus luteum rescue; wrong site — ectopic and praevia; wrong depth — accreta spectrum and shallow invasion) · 8 views · 35 ops | 🔵 planned | `scenes/embryology__weeks-1-2-implantation-bilaminar-disc__implantation.json` |
| Embryology | Weeks 1-2: Implantation & Bilaminar Disc | Bilaminar embryonic disc | sequence (svg) | 13 regions, 12 parts (inner cell mass splits; epiblast, hypoblast, the disc; amniotic cavity, primary yolk sac and Heuser's membrane; extraembryonic mesoderm, chorionic cavity, secondary yolk sac, connecting stalk; prechordal plate; the week of twos; twinning, double bleb, the 14-day rule) · 9 views · 43 ops | 🔵 planned | `scenes/embryology__weeks-1-2-implantation-bilaminar-disc__bilaminar-embryonic-disc.json` |

### `embryology__weeks-1-2-implantation-bilaminar-disc__implantation`

`sequence` first, `diagram` deferred, provider `svg`, no refs — the fifth scene running where
`available-meshes.json` was never opened, because there is no mesh for a cell layer digging into a wall.

The scene is built around one sentence: **the trophoblast invades whatever it lands on.** Beats 1 to 4 are
the mechanism — the receptive window that has to be open first, the apposition/adhesion/invasion order, the
split into cytotrophoblast and syncytiotrophoblast, and the lacunae filling with maternal blood to become the
uteroplacental circulation. Beat 8 then spends that one sentence four times: ampullary ectopic, placenta
praevia, the accreta spectrum where a caesarean scar left no decidua to act as a brake, and shallow invasion
failing to remodel the spiral arteries. Half of third-trimester obstetrics falls out of fourteen days of
embryology, and the scene is arranged so a student sees that rather than being told it.

Cytotrophoblast and syncytiotrophoblast get their own regions here, exactly as run 39's blastocyst scene said
in `gaps[]` they should. That is the first time a gap written by one run has been discharged by a later one.

### `embryology__weeks-1-2-implantation-bilaminar-disc__bilaminar-embryonic-disc`

The curriculum asks for `cross_section` and beat 1 is the cut, deliberately opening the scene: a flat plate
with a balloon above and a balloon below, tall columnar epiblast on top, small cuboidal hypoblast beneath.
Everything after it hangs on getting that orientation right the first time, so `gaps[]` states as a
requirement of the artwork that the disc keeps the same way up in every panel — a layout that flips it
between the day-9 and day-13 drawings would teach the opposite of beat 1.

Beat 8 is a `COMPARE_STRUCTURES` on the single most examinable line in week two: every tissue of the fetus
comes from the epiblast, and the hypoblast — despite sitting where endoderm will be — contributes nothing and
is displaced at gastrulation. Authored as a comparison rather than as narration because the error it corrects
is a spatial assumption.

- Both scenes are `covers`-honest: one curriculum name each. The disc scene describes both cavities and
  defines the chorion, but does **not** claim `Amniotic cavity & yolk sac` or `Chorion & placenta (early)` —
  those are the other two entries in this topic and each `gaps[]` names what a real scene for them would
  still owe (amnion obliterating the chorionic cavity, vitelline duct and Meckel's, allantois; the villous
  tree and the placental barrier).
- The implantation scene names primary villi because day 13 falls inside implantation, and stops there.
- Both are `planned` for the fifth run in a row on the same ground: all eight validator stages pass, and no
  artwork exists.

**83 scenes · 54 ready · 10 candidate · 18 planned · 1 blocked (the deliberate fixture) · 8342 term mappings.**
**Gross Anatomy 59 of 81 ready, 24 held. Embryology 0 of 46 ready with 6 structures now authored and all 6
held on artwork; the cursor now stands at
`embryology / Weeks 1-2: Implantation & Bilaminar Disc / Amniotic cavity & yolk sac`.**

## Run 2026-08-28 (run 41) — Week 2 completed: the two cavities and the chorion

| course | topic | structure | mode | parts | status | scene |
|---|---|---|---|---|---|---|
| Embryology | Weeks 1-2: Implantation & Bilaminar Disc | Amniotic cavity & yolk sac | sequence (svg) | 15 regions, 14 parts (how each cavity forms — a space that opened vs a space that was lined; primary then secondary yolk sac; the amnion expanding to obliterate the chorionic cavity and sheathe the cord; amniotic fluid as a circuit, oligo- and polyhydramnios, Potter sequence; germ cells, blood islands, the roof folded in as the gut; vitelline duct and Meckel's, allantois and the urachus; the two cavities on an early scan) · 10 views · 44 ops | 🔵 planned | `scenes/embryology__weeks-1-2-implantation-bilaminar-disc__amniotic-cavity-yolk-sac.json` |
| Embryology | Weeks 1-2: Implantation & Bilaminar Disc | Chorion & placenta (early) | sequence (svg) | 15 regions, 15 parts (chorion in three layers; decidua basalis/capsularis/parietalis; frondosum vs laeve; lacunae filling before any villus grows; primary, secondary, tertiary villus; cytotrophoblastic shell, anchoring vs floating villi; intervillous space and two circulations that never mix; spiral artery remodelling and pre-eclampsia; the four barrier layers and how they thin; four transport mechanisms and what crosses harmfully; hCG and hPL; CVS, mole, choriocarcinoma, praevia, accreta, chorionicity) · 10 views · 40 ops | 🔵 planned | `scenes/embryology__weeks-1-2-implantation-bilaminar-disc__chorion-placenta-early.json` |

### `embryology__weeks-1-2-implantation-bilaminar-disc__amniotic-cavity-yolk-sac`

The curriculum asks for `cross_section` and `location`, and both are opening and closing beats: beat 1 is the
cut sandwich, beat 10 is what the same two cavities look like on a five-week transvaginal scan.

Beat 2 exists because the two cavities are made by opposite processes and students merge them. The amniotic
cavity is a space that **opened** inside the epiblast; the yolk sac is a pre-existing space that hypoblast
**lined**. One sentence each, authored as a `SHOW_RELATIONSHIP` between them rather than as two separate
descriptions, because the confusion is a comparison error.

Beat 8 is a transverse `CROSS_SECTION` through the folding embryo, and `gaps[]` states as an artwork
requirement that it must be drawn transverse rather than sagittal. The hourglass waist that becomes the
vitelline duct is only visible in cross section, and the whole beat — gut above, sac below, duct between —
depends on the student seeing it. Every umbilical anomaly in beat 9 is then that waist failing to close.

Beat 9 pairs the two stalks deliberately: vitelline duct to ileum, allantois to bladder, same umbilicus,
routinely mixed up. Meckel's rule of twos is given in the form Nigerian MBBS teaching uses, with `gaps[]`
recording that the twos are approximations rather than measurements.

### `embryology__weeks-1-2-implantation-bilaminar-disc__chorion-placenta-early`

Beat 1 is the three-layer definition and it opens the scene on purpose — somatic mesoderm, cytotrophoblast,
syncytiotrophoblast, in that order — because the last beat's clinical payload is derived from it.

Beat 3 fixes an ordering error rather than a fact: the lacunae fill with maternal blood **before** any villus
exists. A placenta is fetal fingers dipped into a maternal pool that was already there, not two vessel beds
joined together, and the haemochorial arrangement in beat 6 only makes sense in that order.

Beat 4 traces `concept:villus-maturation` across primary → secondary → tertiary, and `gaps[]` requires the
three panels be drawn at one magnification. An illustrator enlarging each stage to fit its label would show
a villus growing rather than gaining a core, which is the only thing the beat teaches. Same class of
constraint as run 39's no-growth rule on cleavage and run 40's disc-orientation rule.

Beat 7 is the scene's centre of gravity: extravillous trophoblast stripping the muscle from the spiral
arteries, and pre-eclampsia with growth restriction as what happens when it goes shallow. The implantation
scene (run 40) named shallow invasion in its clinical beat and stopped there; this scene supplies the
mechanism, which is the second gap-to-discharge hand-off in three runs.

- Both scenes are `covers`-honest: one curriculum name each, and each explicitly refuses the other. The
  amnion scene names the chorionic cavity only as the space the amnion obliterates and as the gestational
  sac; the chorion scene names the amnion nowhere except as the membrane the laeve fuses with.
- **The two `gaps[]` notes left by run 40 are both discharged.** Run 40's disc scene listed exactly what a
  real `Amniotic cavity & yolk sac` scene would owe — amnion obliterating the chorionic cavity, vitelline
  duct, Meckel's, allantois — and what a `Chorion & placenta (early)` scene would owe — the villous tree, the
  placental barrier, maternal-fetal exchange. All six are authored.
- **`Weeks 1-2: Implantation & Bilaminar Disc` is now complete**: 4 of 4 structures authored, 4 of 4 held on
  artwork.
- Both are `planned` for the sixth run running on the same ground: all eight validator stages pass, and no
  SVG artwork exists.

**85 scenes · 54 ready · 10 candidate · 20 planned · 1 blocked (the deliberate fixture) · 8679 term
mappings.**

## Run 2026-08-28 (run 42) — Week 3 opened: the streak, and the three sheets it makes

| course | topic | structure | mode | parts | status | scene |
|---|---|---|---|---|---|---|
| Embryology | Week 3: Gastrulation | Primitive streak | sequence (svg) | 15 regions, 14 parts (the streak on the dorsal epiblast; groove, node and pit as three named parts; ingression and EMT; first wave displacing the hypoblast, second wave filling the middle; midline cells through the pit; three axes at once; oropharyngeal and cloacal membranes; regression by day 26; nodal cilia, situs inversus and Kartagener; sacrococcygeal teratoma; caudal dysgenesis and maternal diabetes) · 8 views · 39 ops | 🔵 planned | `scenes/embryology__week-3-gastrulation__primitive-streak.json` |
| Embryology | Week 3: Gastrulation | Trilaminar disc (3 germ layers) | sequence (svg) | 13 regions, 11 parts (the cut disc with the layers the right way up; all three from the epiblast; ectoderm, mesoderm and endoderm derivatives; paraxial, intermediate and lateral plate on a transverse cut; somite into sclerotome/myotome/dermatome; somatic vs splanchnic and the intraembryonic coelom; the two membranes with no mesoderm; working backwards from an organ to its layer; why a teratoma contains hair and teeth) · 8 views · 37 ops | 🔵 planned | `scenes/embryology__week-3-gastrulation__trilaminar-disc-3-germ-layers.json` |

### `embryology__week-3-gastrulation__primitive-streak`

The curriculum asks for `mechanism` and `location`, and both open the scene: beat 1 is the dorsal view that
finds the line, beat 2 names the three parts on it. Groove and pit are authored as a `COMPARE_STRUCTURES`
pair rather than as two descriptions, because the error being corrected is that students merge them — the
groove is the door for the germ layers, the pit is the door for the midline.

Beat 3 cuts across the streak to watch one cell leave the epiblast. The EMT is given a name and two
reuses — neural crest and carcinoma metastasis — because that is what makes it worth remembering rather
than a mechanism recited once.

Beat 4 is where the run's central fact lives: two waves, and the definitive endoderm is the first wave, not
the old hypoblast renamed. It is authored as a `TRACE_STRUCTURE` along the two routes so the direction of
the sentence is visible, since the mistake is directional.

Beats 7 and 8 are the clinical payload, all three items derived rather than appended: cilia failing gives
situs inversus and therefore Kartagener; regression leaving cells behind gives sacrococcygeal teratoma;
regression making too little gives caudal dysgenesis, with maternal diabetes named and the periconceptional
window stated.

### `embryology__week-3-gastrulation__trilaminar-disc-3-germ-layers`

The curriculum asks for `cross_section` and `mechanism`; beats 1, 5 and 7 are cuts. Beat 1 deliberately
tells the student the orientation is unchanged from week two, and `gaps[]` makes that an artwork constraint
so the panel cannot be flipped for layout.

Beat 5 is the transverse cut that makes the mesoderm names mean something — paraxial, intermediate and
lateral plate are positions, and a list learned without the picture is a list of sounds. `gaps[]` requires
both sides of the midline to be drawn, or three bilateral columns read as a stack.

The notochord appears as a `context` region, not a `part`. Paraxial mesoderm is defined by its position
beside it, so beat 5 needs it drawn; `Notochord` is its own curriculum entry, so the scene does not claim
it. That is the distinction `role` exists for.

Beat 8 is the reverse lookup: most organs are built from two layers and the question is always about the
seam — gut lining vs gut wall, bladder epithelium vs detrusor, adrenal cortex vs medulla, the two ectoderms
of the pituitary, enamel on dentine. The teratoma then stops being an oddity, because the student has just
learned that one cell made all three layers.

**87 scenes · 54 ready · 10 candidate · 22 planned · 1 blocked (the deliberate fixture) · 8965 term
mappings.**
**Gross Anatomy 59 of 81 ready, 24 held. Embryology 0 of 46 ready with 10 structures now authored, topics 1
and 2 complete, topic 3 half authored, and all 10 held on artwork; the cursor now stands at
`embryology / Week 3: Gastrulation / Notochord`.**

## Run 2026-08-28 (run 43) — Week 3 completed: the axis, and the tube it induces

| course | topic | structure | mode | parts | status | scene |
|---|---|---|---|---|---|---|
| Embryology | Week 3: Gastrulation | Notochord | sequence (svg) | 15 regions, 14 parts (median section of the disc; prenotochordal cells entering at the pit; the four stages — process, canal, plate, definitive rod; the neurenteric canal as a normal transient communication; extent from node to prechordal plate; the primitive axis; induction of the neural plate and SHH ventral patterning; sclerotome patterning around, not from, the rod; nucleus pulposus and the apical ligament of the dens; chordoma at clivus and sacrum; split notochord syndrome and neurenteric cyst; the double failure when the axis is defective) · 8 views · 41 ops | 🔵 planned | `scenes/embryology__week-3-gastrulation__notochord.json` |
| Embryology | Week 3: Gastrulation | Neurulation (neural plate/tube) | sequence (svg) | 17 regions, 16 parts (notochordal induction; the four cross-sections plate/groove/folds/tube; closure beginning at the fifth somite and zipping both ways; cranial neuropore day 25 and caudal day 27; secondary neurulation by canalisation and retrogressive differentiation; neural crest delamination and its full derivative list; anencephaly; the spina bifida spectrum from occulta to myeloschisis; craniorachischisis and encephalocele; AFP, acetylcholinesterase and ultrasound; periconceptional folate and the timing argument) · 8 views · 41 ops | 🔵 planned | `scenes/embryology__week-3-gastrulation__neurulation-neural-plate-tube.json` |

### `embryology__week-3-gastrulation__notochord`

The curriculum asks for `location` and `mechanism`; beats 1, 5 and 7 locate, beats 2, 3, 4 and 6 explain.
The scene is built around one correction: the notochord is **hollow before it is solid**. Students who learn
it as a rod from day sixteen cannot explain the notochordal plate, cannot explain why it briefly forms part
of the yolk-sac roof, and have nowhere to put the neurenteric canal. So the four stages are authored as an
explicit named sequence — process, canal, plate, rod — and beat 4 traces `concept:prenotochordal-cells`
through all four so the transformation is one movement rather than four facts.

Beat 6 pairs the two inductions with `COMPARE_STRUCTURES` because they run in different directions: upward
to the ectoderm to make the neural plate, sideways to the somites to organise sclerotome. The narration
insists on the preposition — the vertebral column forms *around* the notochord, not *from* it, which is the
commonest wrong answer in this topic.

Beat 7 authors `PEEL_LAYER` to strip the vertebral bodies off what survives. It degrades today, but the
teaching move is right: the notochord is not gone, it is inside every intervertebral disc, and a prolapse is
notochordal tissue pushing through a torn annulus.

Chordoma is taught here in full rather than left to pathology. The only reason a midline tumour appears at
both the clivus and the sacrococcygeal region is the course of this rod — the explanation is embryological
and loses its point anywhere else.

### `embryology__week-3-gastrulation__neurulation-neural-plate-tube`

The curriculum asks for `cross_section` and `mechanism`, and this is the first Embryology scene whose
`preferred_modes` carry a **third** option: `["sequence","diagram","3d_anatomy"]`. `sequence` is taken
because it is the first an engine can render, and **both** `diagram` and `3d_anatomy` go into
`deferred_modes`. `gaps[]` says plainly that the 3d option is real and should be revisited — a closing tube
with migrating crest is a genuinely spatial subject, deferred for want of staged embryo geometry, not
because it is flat.

Beat 1 is the whole topic in one op: a `TRACE_STRUCTURE` through plate → groove → folds → tube on a single
transverse cut. The examinable skill is drawing those four sections, so the scene is arranged to build that
one habit before anything else.

Beat 3 fixes the three dates that every malformation hangs on: closure starts at the fifth somite about day
22 and zips both ways, cranial neuropore shuts about day 25, caudal about day 27. Beats 6 and 7 then derive
anencephaly from the first date and the spina bifida spectrum from the second, so the defects are
consequences rather than a list.

Beat 7's four lesions must be drawn to one scale with the same vertebral outline — written into `gaps[]` as
an artwork constraint, because the teaching point is *how much comes through the gap* and drawings at
different magnifications destroy exactly that comparison.

Beat 8 closes the argument that makes folate worth teaching: the tube is shut by day 27, usually before a
period is missed, so the tablet has to precede conception. The dose is secondary and `gaps[]` records that
national guidance varies and this is not a prescribing reference.

**89 scenes · 54 ready · 10 candidate · 24 planned · 1 blocked (the deliberate fixture) · 9258 term
mappings.**
**Gross Anatomy 59 of 81 ready, 24 held. Embryology 0 of 46 ready with 12 structures now authored, topics 1,
2 and 3 complete and all 12 held on artwork; the cursor now stands at
`embryology / Folding of the Embryo / Cranio-caudal folding`.**

## Run 2026-08-28 (run 44) — Folding: the two planes that turn a disc into a body

| course | topic | structure | mode | parts | status | scene |
|---|---|---|---|---|---|---|
| Embryology | Folding of the Embryo | Cranio-caudal folding | sequence (svg) | 17 regions, 15 parts (the flat disc and the median cut; differential growth of the neural tube and the expanding amnion as the two drivers; the head fold; the cranial strip before folding — septum transversum, pericardial cavity, cardiogenic area, oropharyngeal membrane — and its reversal after; foregut sealed at the oropharyngeal membrane; the septum transversum carried caudally and the C3–C4–C5 phrenic explanation; the tail fold; hindgut, allantois and cloaca; the connecting stalk swung ventrally with the cloacal membrane; midgut left open through the vitelline duct; the C-shaped embryo; ectopia cordis and the pentalogy of Cantrell; Bochdalek hernia and pulmonary hypoplasia; caudal regression, sirenomelia and maternal diabetes) · 6 views · 31 ops | 🔵 planned | `scenes/embryology__folding-of-the-embryo__cranio-caudal-folding.json` |
| Embryology | Folding of the Embryo | Lateral folding | sequence (svg) | 15 regions, 14 parts (the transverse cut; lateral plate mesoderm already split around the intraembryonic coelom; somatopleure as body wall and splanchnopleure as gut wall; the two folds swinging ventrally; midline fusion leaving only the umbilical ring; the coelom sealed off from the extraembryonic cavity and why every serous cavity has two layers; endoderm rolled into a gut tube and the vitelline duct narrowing; dorsal mesentery, and ventral mesentery only where the septum transversum reaches; physiological herniation weeks 6–10; omphalocele vs gastroschisis by membrane, midline and cord insertion; bladder and cloacal exstrophy below the umbilicus; the persistent vitelline duct — Meckel, fistula, cyst, band) · 6 views · 31 ops | 🔵 planned | `scenes/embryology__folding-of-the-embryo__lateral-folding.json` |

### `embryology__folding-of-the-embryo__cranio-caudal-folding`

The curriculum asks for `mechanism` and `cross_section`; beats 1, 2, 4 and 6 explain, beats 3 and 5 cut and
locate. The scene is organised around one idea students routinely miss: **folding is not something the
embryo does, it is something that happens to a sheet that grows faster than its anchor.** Beat 1 therefore
authors the two drivers as their own regions — the neural tube outgrowing a yolk sac that barely grows, and
the amnion closing round from outside — before a single fold is drawn.

The centre of the scene is beat 2, and it is a `COMPARE_STRUCTURES` rather than a sequence. The cranial
strip is authored twice, once as `head_order_before` (septum transversum, pericardial cavity, cardiogenic
area, oropharyngeal membrane) and once as `head_order_after`, because the fold **reverses the order end for
end** and no amount of narration substitutes for seeing the same four items renumbered. `gaps[]` carries the
artwork constraint that both panels must number the four items identically at one scale; drawn as two
unrelated pictures the reversal — the single most examined point in this topic — becomes invisible.

Beat 3 pays off a fact students are told to memorise elsewhere: the septum transversum begins opposite the
future neck and is dragged caudally by the head fold, so the diaphragm answers to C3, C4 and C5 and the
phrenic nerve is long because it followed. Beat 6 then maps three lesions onto three fold failures — ectopia
cordis to the cranial wall, Bochdalek hernia to the incomplete diaphragm, caudal regression to deficient
caudal mesoderm — so the malformations are consequences rather than a list.

`Primitive gut tube` and `Body cavity (coelom)` are named in passing and **not** claimed; both are separate
curriculum entries in the same topic and `gaps[]` says what belongs where.

### `embryology__folding-of-the-embryo__lateral-folding`

The same curriculum views, the other plane. The scene keeps a single transverse section on screen for all
six beats, and beat 1 refuses to fold anything until the lateral plate mesoderm has already been split into
somatopleure and splanchnopleure — because the entire payoff of this topic is that **the same two sheets
become the body wall and the gut wall**, which is also where the parietal and visceral layers of every
serous membrane come from. `gaps[]` carries the matching artwork constraint: one colour key for the four
layers across all three panels, or the point is lost.

Beat 5 is authored as a differential rather than a description. Omphalocele and gastroschisis are compared
side by side and the narration gives three checks in order — membrane, midline, cord insertion — with the
associated-anomaly burden attached to omphalocele where it belongs. Beat 6 then maps the remaining defects
by level, from ectopia cordis above the umbilicus down to bladder and cloacal exstrophy below it, and closes
on the vitelline duct that should have disappeared: Meckel and its rule of twos, the umbilical fistula, the
cyst, and the fibrous band that later twists bowel.

This is the first Embryology structure whose `preferred_modes` include `3d_anatomy`. It is recorded in
`deferred_modes` and argued for in `gaps[]` — two sheets closing round a cavity is a genuinely spatial
subject — and it is deferred only because no staged embryo geometry exists in the catalog, not because the
subject is flat.

## Run 2026-08-28 (run 45) — Folding, completed: the tube and the cavity it hangs in

| course | topic | structure | mode | parts | status | scene |
|---|---|---|---|---|---|---|
| Embryology | Folding of the Embryo | Primitive gut tube | sequence (svg) | 18 regions, 17 parts (the tube as the rolled roof of the yolk sac; endoderm for lining and glands, splanchnic mesoderm for muscle and peritoneum, neural crest for the enteric plexuses; the three arteries at T12, L1 and L3 and the two boundaries — major duodenal papilla, and the junction of proximal two-thirds and distal one-third of transverse colon; foregut, midgut and hindgut derivatives each with their splanchnic nerve and referred pain level; the midgut loop, physiological herniation and 270° anticlockwise rotation about the superior mesenteric artery; the cloaca partitioned by the urorectal septum onto the pectinate line; buccopharyngeal and cloacal membranes; the vitelline duct; the solid-cord stage and recanalization; oesophageal atresia with tracheo-oesophageal fistula, duodenal atresia and the double bubble, malrotation with midgut volvulus, Hirschsprung disease, imperforate anus) · 6 views · 32 ops | 🔵 planned | `scenes/embryology__folding-of-the-embryo__primitive-gut-tube.json` |
| Embryology | Folding of the Embryo | Body cavity (coelom) | sequence (svg) | 15 regions, 14 parts (the coelom appearing inside lateral plate mesoderm and why every serous cavity has a parietal and a visceral layer; the horseshoe open at both ends; folding sealing it and leaving the two pericardioperitoneal canals; the four partitions in order — septum transversum, pleuropericardial membranes carrying the phrenic nerve and becoming fibrous pericardium, pleuroperitoneal membranes closing right before left by week 7, body-wall muscle growing in around the rim with the crura from the oesophageal mesentery; descent of the diaphragm and the C3–C4–C5 phrenic supply with shoulder-tip referral; the three resulting cavities and the dorsal/ventral mesenteries; Bochdalek hernia and pulmonary hypoplasia, Morgagni hernia, eventration, congenital hiatus hernia, ectopia cordis and the pentalogy of Cantrell) · 6 views · 30 ops | 🔵 planned | `scenes/embryology__folding-of-the-embryo__body-cavity-coelom.json` |

### `embryology__folding-of-the-embryo__primitive-gut-tube`

The curriculum asks for `location` and `mechanism`. The scene is built on one claim: **the gut's three
divisions are an arterial fact, not an anatomical convenience.** Beat 2 therefore puts the three arteries on
before any derivative is named, and fixes the two boundaries verbatim — the major duodenal papilla, and the
junction of the proximal two-thirds and distal one-third of the transverse colon. Beat 3 then runs the tube
once from end to end and attaches a splanchnic nerve to each division, so epigastric, periumbilical and
suprapubic pain arrive as consequences rather than as three more things to memorise. Beat 4 gives the midgut
its rotation on its own, because it is the only division that does anything, and beat 6 hangs one
malformation on each developmental step in the order the step occurs.

Three germ-layer sources are separated deliberately in beat 1 — endoderm for lining and glands, splanchnic
mesoderm for muscle and peritoneum, neural crest for the nerve cells — because that split is what makes
Hirschsprung disease intelligible rather than arbitrary.

### `embryology__folding-of-the-embryo__body-cavity-coelom`

The curriculum asks for `cross_section` and `mechanism`. The organising claim is that **the adult diaphragm
is a map of its four embryological origins, and each origin has its own hernia.** The four partitions are
authored as four regions in the order they close, and beat 6 maps Bochdalek, Morgagni, eventration and the
congenital hiatus hernia straight back onto them. `gaps[]` carries the matching artwork constraint: the
inferior view of the finished diaphragm must use the same four colours as the partition sequence, and the
sequence must *draw* the right canal closing before the left, since that single detail is the whole reason
the common congenital diaphragmatic hernia is left-sided.

Beat 4 exists because the phrenic nerve is the cleanest payoff in the topic: a muscle that forms opposite
the third to fifth cervical somites, descends to L1, and drags its nerve behind it — which yields both the
high-cord-injury fact and shoulder-tip referral from a single picture.

**Topic 4, Folding of the Embryo, is now complete: four structures, four scenes, four `planned`.** The four
overlap heavily in subject matter and each declares in `gaps[]` exactly what it does not claim, so no
structure is covered twice and none is quietly dropped.

**93 scenes · 54 ready · 10 candidate · 28 planned · 1 blocked (the deliberate fixture) · 9917 term
mappings.**
**Gross Anatomy 59 of 81 ready, 24 held. Embryology 0 of 46 ready with 16 structures now authored, topics 1,
2, 3 and 4 complete, all 16 held on artwork; the cursor now stands at
`embryology / Pharyngeal Apparatus / Pharyngeal arches`.**

---

## Run 2026-08-28 (run 46) — Pharyngeal Apparatus, first half: the bars and the pockets

| course | topic | structure | mode | parts | status | scene |
|---|---|---|---|---|---|---|
| Embryology | Pharyngeal Apparatus | Pharyngeal arches | sequence (svg) | 14 regions, 13 parts (the shared five-ingredient plan — cartilage, muscle, nerve, artery, ectoderm outside and endoderm inside; neural crest for skeleton and connective tissue against paraxial mesoderm for muscle; the rule that a muscle keeps its own arch's nerve wherever it migrates; arch 1 with Meckel's cartilage, malleus and incus, the sphenomandibular ligament, the muscles of mastication and CN V; arch 2 with Reichert's cartilage, stapes and styloid, the muscles of facial expression, CN VII and the cervical sinus it buries; arch 3 with greater horn of hyoid, stylopharyngeus and CN IX; arch 4 with thyroid cartilage, the constrictors, cricothyroid and the superior laryngeal nerve; arch 5 authored as an explicit absence; arch 6 with the remaining laryngeal cartilages, all other intrinsic laryngeal muscles and the recurrent laryngeal nerve; the six arch arteries and their asymmetric regression; why the left recurrent laryngeal nerve is towed into the chest by the ductus arteriosus; Treacher Collins, Pierre Robin sequence, congenital facial palsy and branchial cyst, 22q11.2) · 5 views · 24 ops | 🔵 planned | `scenes/embryology__pharyngeal-apparatus__pharyngeal-arches.json` |
| Embryology | Pharyngeal Apparatus | Pharyngeal pouches | sequence (svg) | 12 regions, 11 parts (pouches as the endodermal inside of the apparatus against ectodermal clefts outside; dorsal and ventral wings of pouches 3 and 4; pouch 1 as the tubotympanic recess giving middle ear, mastoid antrum and auditory tube, meeting cleft 1 at the tympanic membrane; pouch 2 as the palatine tonsil and its fossa; pouch 3 giving thymus and inferior parathyroid; pouch 4 giving superior parathyroid and the ultimopharyngeal body with its neural-crest C cells; the descent of the thymus and the parathyroid crossover; ectopic parathyroid sites along the thymic route and the failed neck exploration; DiGeorge syndrome grouped by the pouch that failed; medullary thyroid carcinoma explained from C-cell origin; a four-line revision summary) · 5 views · 27 ops · beat 3 re-moded to `glands` 2026-08-28 to satisfy the curriculum view list | 🔵 planned | `scenes/embryology__pharyngeal-apparatus__pharyngeal-pouches.json` |

### `embryology__pharyngeal-apparatus__pharyngeal-arches`

The curriculum asks for `location` and `associated_organs`. The organising claim is that **there are not six
things to learn, there is one plan repeated and then edited.** Beat 2 therefore cuts a single generic arch
across and names the five ingredients before any arch is numbered, so beat 3 is a table being filled rather
than a list being memorised. The germ-layer split inside the arch — neural crest for skeleton and connective
tissue, paraxial mesoderm for muscle — is separated deliberately, because it is what makes a neural crest
syndrome wreck the jaw while leaving the innervation of its muscles intact.

Beat 4 is the payoff and is authored as a single rule rather than two facts: **each recurrent laryngeal nerve
hooks under the lowest arch artery still standing on its own side.** On the right the sixth arch artery
regresses and the nerve rides up to the fourth, the right subclavian; on the left the sixth persists as the
ductus arteriosus and tows the nerve into the chest. `gaps[]` carries the matching artwork constraint: that
panel must draw left and right together on one figure, because the asymmetry is invisible on a single-sided
drawing and the asymmetry is the entire point.

**Arch 5 is authored as a region with no derivatives rather than omitted.** A student who is never shown the
gap reliably mis-numbers arch 6 as arch 5, and an absence that is drawn is an absence that is learned.

### `embryology__pharyngeal-apparatus__pharyngeal-pouches`

The curriculum asks for `cross_section` and `glands`. The scene opens by turning the embryo inside out —
pouches are endoderm on the lumen side, clefts are ectoderm on the outside — because attributing a cleft
derivative to a pouch is the single commonest error in this topic, and `gaps[]` requires the two sides to
carry different fills in every panel for exactly that reason.

The organising claim is that **the parathyroid crossover is a consequence of movement, not a fact to
memorise.** Beat 4 is therefore a before-and-after of the same neck: the thymus descends towards the anterior
mediastinum and tows the third-pouch parathyroid past the fourth-pouch parathyroid, which is why the inferior
glands come from the higher pouch and why the inferior gland — towed rather than placed — is the one that
turns up in the carotid sheath, inside the thymus or in the mediastinum when an adenoma cannot be found.

Beat 5 groups the DiGeorge findings by the pouch that failed rather than listing them, so no thymus, no
parathyroids and a conotruncal defect arrive as one neural crest failure read three ways.

**Topic 5, Pharyngeal Apparatus, is now half authored: 2 of 4 structures, both `planned`. Neither claims the
other's territory** — the arches scene names the pouches only as the arch's inner lining, and the pouches
scene names the arches only as the bars it lies between; both explicitly decline "Pharyngeal clefts &
membranes" and "Thyroid gland development", which are the next two structures at the cursor.

**95 scenes · 54 ready · 10 candidate · 30 planned · 1 blocked (the deliberate fixture) · 10233 term
mappings.**
**Gross Anatomy 59 of 81 ready, 24 held. Embryology 0 of 46 ready with 18 structures now authored, topics 1–4
complete and topic 5 half done, all 18 held on artwork; the cursor now stands at
`embryology / Pharyngeal Apparatus / Pharyngeal clefts & membranes`.**

---

## Run 2026-08-28 (run 47) — Pharyngeal Apparatus, second half: the outside, and the gland that leaves

| course | topic | structure | mode | parts | status | scene |
|---|---|---|---|---|---|---|
| Embryology | Pharyngeal Apparatus | Pharyngeal clefts & membranes | sequence (svg) | 14 regions, 13 parts (clefts as the ectodermal outside against the endodermal pouches inside; the one-survivor rule; cleft 1 as the external acoustic meatus, the auricular hillocks around its mouth, the solid meatal plug and late recanalisation with congenital aural atresia; first-cleft anomalies clustering at the ear — preauricular pit and sinus, duplicated meatus, and their relation to the facial nerve; clefts 2, 3 and 4 sinking into the cervical sinus; the second-arch operculum as the movement that buries them; the three-layered closing membrane and the tympanic membrane as the only survivor, its three layers read off the three germ layers; the outside-versus-inside discipline stated as a self-test; branchial cyst at the anterior border of sternocleidomastoid, swelling after a sore throat, tract between the carotids; branchial sinus and complete fistula with the external opening at a cleft derivative and the internal opening in the tonsillar fossa; reading a neck lump by position, with the over-forty warning; a four-line revision summary) · 5 views · 27 ops · beat 3 re-moded to `glands` 2026-08-28 to satisfy the curriculum view list | 🔵 planned | `scenes/embryology__pharyngeal-apparatus__pharyngeal-clefts-membranes.json` |
| Embryology | Pharyngeal Apparatus | Thyroid gland development | sequence (svg) | 14 regions, 13 parts (midline endodermal origin in the pharyngeal floor between tuberculum impar and copula, the first endocrine gland, about day 24; the foramen cecum as the fixed upper end; the bilobed diverticulum descending in front of the pharyngeal gut on the thyroglossal duct; the relation at the hyoid and the bone ossifying around it; arrival on the second to fourth tracheal rings by about week 7 and why the gland moves on swallowing; the pyramidal lobe and levator glandulae thyroideae as surviving duct; the two lineages — follicular cells from this endoderm, C cells arriving from the fourth-pouch ultimopharyngeal body and neural crest in origin; follicles and colloid from about week 11 against maternal thyroxine before that; thyroglossal duct cyst, midline, rising on tongue protrusion, and the acquired thyroglossal fistula; the Sistrunk procedure and why the middle third of the hyoid is taken; ectopic and lingual thyroid with the scan-before-excision rule; thyroid agenesis, the well-looking newborn and the heel prick; a five-line revision summary) · 5 views · 27 ops | 🔵 planned | `scenes/embryology__pharyngeal-apparatus__thyroid-gland-development.json` |

### `embryology__pharyngeal-apparatus__pharyngeal-clefts-membranes`

The curriculum asks for `cross_section` alone. The organising claim is that **the whole of cleft anatomy is
one rule and one movement**: only the first cleft survives, and the other three are buried by the second-arch
operculum into the cervical sinus. Beat 2 cuts through a cleft to find the closing membrane, so that the
tympanic membrane's three layers are read off the three germ layers rather than memorised as a histology
list. Beat 3 shows the overgrowth as a before-and-after, because the cervical sinus is a space produced by a
movement and a single static drawing turns it into a labelled blob.

The clinical beat is deliberately built as prediction rather than recall: a remnant with no opening is a
cyst, a remnant open to skin is a sinus, a remnant open at both ends is a fistula whose internal opening must
be at a pouch derivative — the tonsillar fossa — because that is what a fistula in this region *means*.
`gaps[]` requires ectoderm, endoderm and mesoderm to carry the same three fills the pouches scene uses, for
the same reason that scene did: attributing a cleft derivative to a pouch is the commonest error here, and a
uniformly coloured drawing teaches it.

### `embryology__pharyngeal-apparatus__thyroid-gland-development`

The curriculum asks for `mechanism` and `glands`. The organising claim is that **every clinical sign follows
from one fixed point and one journey**: the foramen cecum never moves, and the gland travels away from it in
front of the hyoid and the laryngeal cartilages. A thyroglossal cyst rises on tongue protrusion because the
upper end is still tethered; the Sistrunk procedure takes the middle third of the hyoid because the bone
ossified around the duct; an ectopic thyroid can sit anywhere along the route and is often the only
functioning tissue the patient has, so it is scanned before it is touched.

Beat 3 is the one place the gland's **two ancestries** are put side by side: follicular cells down the midline
from the tongue, C cells sideways from the fourth pouch and neural crest in origin. The medullary thyroid
carcinoma thread that follows from that is deliberately left in the pouches scene rather than duplicated
here, and `gaps[]` says so; the terms stay in `match.terms` so a highlighted term still reaches a scene.

The congenital hypothyroidism beat is authored around the fact that **the newborn looks well** — maternal
thyroxine has been covering — which is the argument for screening rather than waiting, and is an
embryological argument rather than a paediatric one.

**97 scenes · 54 ready · 10 candidate · 32 planned · 1 blocked (the deliberate fixture) · 10543 term
mappings.**
**Gross Anatomy 59 of 81 ready, 22 held. Embryology 0 of 46 ready with 20 structures now authored, topics 1–5
complete, all 20 held on artwork; the cursor now stands at
`embryology / Cardiovascular Development / Heart tube formation`.**

---

## Run 2026-08-28 (run 48) — Cardiovascular Development, first half: the tube, and the bend it must make

| course | topic | structure | mode | parts | status | scene |
|---|---|---|---|---|---|---|
| Embryology | Cardiovascular Development | Heart tube formation | sequence (svg) | 15 regions, 14 parts (the cardiogenic horseshoe of splanchnic mesoderm cranial to the buccopharyngeal membrane; paired endocardial tubes from angiogenic clusters; the intraembryonic coelom as pericardial cavity with somatic wall against splanchnic heart; cranio-caudal folding inverting the field, the cavity and the septum transversum; lateral folding fusing the two tubes by about day 22, with cardia bifida and ectopia cordis as its failures; the three coats with cardiac jelly named as the future endocardial cushions and the epicardium arriving late from the proepicardial organ; the dorsal mesocardium breaking down to leave the transverse pericardial sinus and free the tube; the five segments caudal to cranial — sinus venosus with its three venous pairs, sinus venarum, coronary sinus and the SA node territory; primitive atrium as the pectinate auricles; primitive ventricle as the trabeculated left ventricle; bulbus cordis as the trabeculated right ventricle plus the smooth outflow of both; truncus arteriosus as aorta and pulmonary trunk; first beat about day 22 and unidirectional flow about day 24; the growth mismatch that forces looping; pentalogy of Cantrell and the weeks 3–4 teratogen window) · 5 views · 24 ops | 🔵 planned | `scenes/embryology__cardiovascular-development__heart-tube-formation.json` |
| Embryology | Cardiovascular Development | Cardiac looping | sequence (svg) | 12 regions, 11 parts (looping as mechanics — a tube elongating from both poles via the secondary heart field, anchored at both ends, free in the middle after the dorsal mesocardium breaks down; the three movements stated as three repeatable sentences: bulbus ventral-caudal-right giving the D-loop, primitive ventricle dorsal-left putting the ventricles side by side, atrium and sinus venosus dorsal-cranial putting inflow behind and above outflow; the day-28 S-shaped heart with atrioventricular canal, primary interventricular foramen and bulboventricular sulcus, still a single lumen; looping framed as the alignment step that septation presupposes, hence alignment errors read as connection faults; nodal cilia, leftward flow, Nodal and Pitx2 as what chooses the direction; L-loop with ventricular inversion and congenitally corrected transposition, pink but with a systemic right ventricle and conduction risk; dextrocardia distinguished from dextroposition, situs inversus totalis and Kartagener syndrome; right and left isomerism with asplenia and polysplenia, carrying the splenic prophylaxis point; and a three-step answering frame — situs, loop, connections) · 5 views · 26 ops | 🔵 planned | `scenes/embryology__cardiovascular-development__cardiac-looping.json` |

### `embryology__cardiovascular-development__heart-tube-formation`

The curriculum asks for `mechanism` and `cross_section`. The organising claim is that **the heart does not
move — the embryo folds around it**. The scene therefore spends beat 2 on the two foldings as a single
simultaneous event, because a student who learns cranio-caudal folding as "the heart descends" cannot later
explain why the septum transversum ends up below it or why the pericardial cavity ends up in front.

The five segments are authored in the direction of flow, not in the order textbooks usually list them, so
that one list carries both the anatomy and the haemodynamics. The bulbus cordis gets the longest narration
because it is where the recall reliably fails: most of the right ventricle and the smooth outflow of *both*
ventricles come from it, which is why the two ventricles are not mirror images.

Cardiac jelly is introduced as future endocardial cushions rather than as matrix, because that is the only
thing about it that the septation scene will need. `gaps[]` requires the five-segment colour key to be
identical here and in the looping and septation scenes — the entire teaching value of the segment list is
that it survives looping, and recolouring between scenes destroys it.

### `embryology__cardiovascular-development__cardiac-looping`

The curriculum asks for `mechanism`. The organising claim is that **looping is mechanics before it is
genetics**: a tube that elongates while fixed at both ends inside a cavity that does not grow has no option
but to bend, and the laterality genes decide only which way. Framing it this way makes the three movements
predictable rather than arbitrary, and it makes the ciliary beat in beat 4 an explanation rather than an
extra fact.

The three movements are authored as three short sentences in a fixed order, on the view that this is what a
student can actually reproduce under exam pressure. Beat 3 then asks the reader to check the day-28 heart
against the segment colours from the tube scene, because the claim being tested is that nothing was added or
removed — the same five segments simply arrived somewhere new.

The clinical beat is built as three distinct failures of one process — loop the wrong way, reverse everything,
or fail to choose — and closes with the segmental frame (situs, loop, connections) so that a laterality case
is answered in a fixed order instead of guessed at. `gaps[]` requires an explicit L and R marker on every
frame: a looping diagram without one is ambiguous exactly where the whole subject is left and right.

**99 scenes · 54 ready · 10 candidate · 34 planned · 1 blocked (the deliberate fixture) · 10789 term
mappings.**
**Gross Anatomy 59 of 81 ready, 22 held. Embryology 0 of 46 ready with 22 structures now authored, topics 1–5
complete and topic 6 half authored, all 22 held on artwork; the cursor now stands at
`embryology / Cardiovascular Development / Septation of heart`.**

## Run 2026-08-28 (run 49) — Cardiovascular Development, second half: the four walls, and the circuit they serve

| course | topic | structure | mode | parts | status | scene |
|---|---|---|---|---|---|---|
| Embryology | Cardiovascular Development | Septation of heart | sequence (svg) | 16 regions, 15 parts (septation framed as four separate walls built in parallel between weeks 4 and 8, not one event; the endocardial cushions with their four simultaneous jobs — dividing the atrioventricular canal, forming both AV valves, closing the lower atrial septum and contributing the membranous interventricular septum — and AVSD as all four failing together, with its trisomy 21 association, cleft mitral leaflet and left axis deviation; the atrial sequence authored in its true order, septum primum and ostium primum, then ostium secundum opening *before* ostium primum shuts so the right-to-left crossing is never interrupted, then septum secundum and the foramen ovale; the two overlapping incomplete sheets as a pressure-driven flap valve that closes at birth because the gradient reverses rather than because tissue grows, leaving the fossa ovalis and its limbus; secundum ASD from failed overlap distinguished from PFO with failed fusion, with fixed splitting and paradoxical embolism; the muscular septum left standing as the ventricles balloon around it, and the membranous part as a three-tissue junction — inferior cushion plus both conotruncal ridges — which is why most VSDs are perimembranous, with the pansystolic murmur and Eisenmenger reversal; the conotruncal ridges built by cardiac neural crest, giving the 22q11 link to face, thymus and parathyroids; the aorticopulmonary septum spiralling half a turn, which is why the great vessels cross; and one wall varied three ways — no spiral gives TGA, no septum gives persistent truncus, an anteriorly displaced spiral gives all four features of tetralogy; closing with a four-question frame: blue or pink, which septum, which way is pressure pushing, what else did those cells build) · 5 views · 31 ops | 🔵 planned | `scenes/embryology__cardiovascular-development__septation-of-heart.json` |
| Embryology | Cardiovascular Development | Fetal circulation | sequence (svg) | 18 regions, 17 parts (the whole circuit derived from two resistances — a fluid-filled lung bed that is nearly shut and a placenta that is the largest low-resistance bed in the body — and the three shunts that follow: ductus venosus past the liver, foramen ovale past the right heart, ductus arteriosus past the lungs; the full traced route from umbilical vein at ~80% through ductus venosus, IVC, right atrium, foramen ovale, left ventricle, coronaries and carotids, then SVC, right ventricle, pulmonary trunk, ductus arteriosus, descending aorta and the two umbilical arteries back to the placenta; streaming taught as the central mechanism, with the crista dividens aiming the caval stream so the brain and heart get the best blood and the lower body the worst; the cord reversal that catches students — vein oxygenated, arteries not — and the single-artery cord as a reportable finding; the two birth events, lungs open and cord clamped, from which every closure is derived; functional versus anatomical closure of each shunt with the prostaglandin E2, bradykinin and oxygen mechanism at the duct; the five remnant pairs including the superior vesical arteries as the only fetal vessel that keeps a job, and the recurrent laryngeal nerve left hooked under the ligamentum arteriosum; and three failure modes — PDA with its reversed gradient and machinery murmur closed by indomethacin, duct-dependent lesions kept open by prostaglandin E1 with the day-2 collapse and absent femoral pulses, and persistent fetal circulation as a self-feeding hypoxia-acidosis cycle) · 5 views · 30 ops | 🔵 planned | `scenes/embryology__cardiovascular-development__fetal-circulation.json` |

### `embryology__cardiovascular-development__septation-of-heart`

The curriculum asks for `cross_section` and `mechanism`. The organising claim is that **septation is four
separate jobs, not one**, and that every lesion in the topic is one of the four done badly. The scene is
therefore built as four groups rather than a chronology, and beat 1 shows all four being built at once so
that a student does not learn them as a queue.

The endocardial cushions are given the longest treatment because they do four things with one fusion — divide
the canal, build both AV valves, close the bottom of the atrial septum, help close the top of the ventricular
septum. Once that list is held, AVSD stops being a syndrome to memorise and becomes the arithmetic of one
failure. The atrial sequence is authored strictly in its real order, with `ostium_secundum` narrated around
the point that the new hole opens *before* the old one closes: this is the single most reliably reversed fact
in the topic, and the scene states the reason — the fetal shunt cannot be interrupted for one beat.

The membranous interventricular septum is deliberately framed as a three-tissue junction rather than as a
patch, so that the commonest congenital defect in medicine is predicted by the construction rather than
appended to it. The outflow beat then holds one variable — the spiral septum — and varies it three ways to
generate transposition, persistent truncus and tetralogy, which is why `outflow_defects` is authored as a
single region rather than three.

`gaps[]` binds the segment colour key to the tube-formation and looping scenes for the third time, so those
three drawings can no longer be commissioned independently. It also requires the fetal pressure arrow on
every atrial frame: two crescents without a gradient are a picture, not a mechanism.

### `embryology__cardiovascular-development__fetal-circulation`

The curriculum asks for `vasculature` and `mechanism`. The organising claim is that **two resistances explain
the entire circuit**, so the scene opens on the numbers rather than the diagram and lets the three shunts
fall out of them. Beat 2 is then a single uninterrupted trace of nine waypoints from placenta to placenta,
because in this topic the marks are in the recitation and the scene should rehearse it exactly as it will be
examined.

Beat 3 is given entirely to streaming, on the view that a student who thinks the fetus circulates uniformly
mixed blood cannot answer why the brain is favoured or why the lower body is not. The crista dividens is
authored as its own region for the same reason.

Beat 4 refuses to list the closures. It states the two events — lungs open, cord clamped — and derives each
closure from them, and it uses `HIDE_STRUCTURE` on the placental group at the moment of clamping so the
resistance change is seen rather than asserted. Functional versus anatomical closure is stated explicitly
because it is what makes a duct reopenable with a drug, which is the hinge of beat 5.

`gaps[]` rejects the conventional red-and-blue drawing outright. Nothing in a fetus is arterial by adult
standards, and a two-colour picture teaches a separation that does not exist; the artwork is specified as a
graded scale with the saturation printed on each vessel.

**101 scenes · 54 ready · 10 candidate · 36 planned · 1 blocked (the deliberate fixture).**
**Gross Anatomy 59 of 81 ready, 22 held. Embryology 0 of 46 ready with 24 structures now authored — topics 1
through 6 complete, Cardiovascular Development closed out this run — all 24 held on artwork; the cursor now
stands at `embryology / Respiratory System Development / Respiratory diverticulum`.**

## Run 2026-08-28 (run 50) — Respiratory System Development, first half: the bud, and the wall that splits the tube

> **Read the run-50 block in RUNLOG.md before using these two scenes as a precedent.** This run authored
> under the *old* task prompt. `AUTHOR-TASK-PROMPT.md` was rewritten on 2026-08-28 to suspend authoring and
> repoint the task at a Gross Anatomy audit, but that block was never pasted into the Scheduled panel, so the
> live task still carried the authoring instructions and followed them. The two scenes below are sound and
> validate clean; they are also two more Embryology sequence scenes that no engine can draw, which is the
> exact thing the suspension exists to stop.

| course | topic | structure | mode | parts | status | scene |
|---|---|---|---|---|---|---|
| Embryology | Respiratory System Development | Respiratory diverticulum | sequence (svg) | 10 regions, 9 parts (the whole lower airway derived from one median groove in the ventral wall of the foregut at about day 22, sited caudal to the fourth pharyngeal pouch, with ventral/median/caudal each given its consequence — ventral is why the trachea lies in front, median is why the defect is a midline one; the two-tissue rule authored as a single comparison — endoderm gives epithelium, glands and both pneumocytes, splanchnic mesoderm gives cartilage, muscle, connective tissue, vessels and visceral pleura — and bound by colour to the two scenes further down the tree; the first division into two bronchial buds by about day 28 and the secondary buds three-on-the-right, two-on-the-left that settle the adult lobe count, with the wider right bud tied to the inhaled groundnut; the buds expanding into the pericardioperitoneal canals with the fist-into-a-balloon account of visceral and parietal pleura, so the lung is never inside the pleural cavity; the laryngeal inlet kept open into the pharynx on purpose, its T-shape from the arytenoid swellings, the epiglottis from the hypobranchial eminence, cartilages from arches 4 and 6, and from that the reason cricothyroid keeps the superior laryngeal nerve while every other intrinsic muscle takes the recurrent, and the reason the recurrent hooks the aortic arch on the left and the subclavian on the right; closing on agenesis, tracheal agenesis, sequestration fed by a systemic artery, and the Bochdalek hernia where a normal bud is ruined from outside and the hypoplasia, not the hernia, is what kills) · 6 views · 25 ops | 🔵 planned | `scenes/embryology__respiratory-system-development__respiratory-diverticulum.json` |
| Embryology | Respiratory System Development | Tracheoesophageal septum | sequence (svg) | 12 regions, 11 parts (one lumen divided rather than two tubes separated — the point the beat-1 cross-section exists to make; the lateral tracheoesophageal ridges drawn as curtains meeting in the midline, fusing caudal-to-cranial and finishing by about the end of week 5, with the direction of the zip made load-bearing because a septum that stops short leaves its defect at the top, which is where the common fistula is; the laryngeal inlet left open into the pharynx on purpose; the trachea's C-ring open behind against the oesophagus as the surviving mark of the shared wall, and tracheomalacia where the mesoderm is deficient; the oesophagus short at first, elongating with the descent of the heart, recanalising after near-obliteration, striated in its upper third and smooth in its lower; then one partition varied two ways — deviated posteriorly, or incompletely fused — to generate the whole Gross list: type C at ~85% read as its two halves, blind pouch above explaining the froth and the arrested tube, distal fistula below explaining gas in the stomach and reflux aspiration; type A at ~7% with the gasless abdomen and the long gap; the H-type at ~4% that feeds, goes home and returns at six months with recurrent pneumonia; and the laryngotracheo-oesophageal cleft at the far end; closing at the cot side with polyhydramnios and no stomach bubble, the nasogastric tube that stops at ~10 cm and coils on the film, nil by mouth, pouch suction, head-up nursing, and the VACTERL sweep with the point that the cardiac lesion usually decides survival) · 5 views · 24 ops | 🔵 planned | `scenes/embryology__respiratory-system-development__tracheoesophageal-septum.json` |

### `embryology__respiratory-system-development__respiratory-diverticulum`

The curriculum asks for `mechanism` and `location`. The organising claim is that **the lower airway is an
outgrowth of the gut**, and the scene keeps returning to it: the foregut is authored as `role: "context"` so
it is on screen in every beat, and each malformation in beat 6 is stated as a way that outgrowth can fail.

The two-tissue rule gets a beat of its own rather than a sentence, because it is the load-bearing fact for
the two scenes that follow it — bronchial branching and alveolar development are the same rule applied
further down. `gaps[]` therefore binds the endoderm/mesoderm colour key across all three, in the same way
the cardiac segment key was bound across tube formation, looping and septation.

`PEEL_LAYER` is authored on the muscle layer in beat 2 to lift the mesodermal coat off the endodermal lining.
The renderer degrades it to a hide, and it is authored anyway: taking one coat off the other is the teaching.

The nerve beat is the one piece of adult anatomy in the scene, and it is here rather than in a Gross scene
because the recurrent laryngeal nerve's course is only explicable developmentally. Arch derivatives are named
but the arches themselves are not claimed in `covers[]` — they belong to Pharyngeal Apparatus.

### `embryology__respiratory-system-development__tracheoesophageal-septum`

The curriculum asks for `cross_section` and `mechanism`, and this is one of the few entries where the
cross-section genuinely has to come first: the standard error is to picture two tubes being pulled apart
rather than one tube being divided, and no lateral drawing corrects that. Beat 1 is therefore a transverse
section with the ridges mid-flight.

The direction of fusion is made to carry weight. Caudal-to-cranial is not a detail here; it is the reason the
commonest lesion sits at the top, and the scene states the inference rather than leaving the fact inert.

Beat 3 holds one variable — the septum — and varies it twice to produce the whole Gross list, so the
classification is derived rather than memorised, and `gaps[]` requires the five-type plate to be drawn at one
scale and one orientation because the comparison *is* the teaching.

This is the only Embryology entry so far whose third preferred mode, `3d_anatomy`, is genuinely live: the
finished trachea and oesophagus are adult structures a provider could hold. `gaps[]` records that a 3D
re-authoring may only ever be a companion to the sequence, never a replacement, since what is being taught is
a partition forming over two weeks and not a static pair of tubes.

Management is deliberately cut at the point a house officer hands over — nil by mouth, pouch suction, head-up,
refer, sweep for VACTERL. Gap length and staged repair are surgical curriculum; the terms are in
`match.terms` so a surgery note still finds the scene, and the narration does not pretend to teach them.

**102 scenes · 47 ready · 17 candidate · 38 planned.**
**Gross Anatomy 52 of 81 ready — down 7 from last run, not by regression: `validate-scenes --mark` demoted
the seven scenes with not one mesh in hand from `ready` to `candidate`, which is the delivery hold working as
designed and releases itself when the geometry lands. Embryology 0 of 46 ready with 26 structures authored —
topics 1 through 6 complete and Respiratory System Development half done, all 26 held on artwork; the cursor
now stands at `embryology / Respiratory System Development / Bronchial tree branching`, which is where it
should NOT be allowed to go next.**

---

## Run 2026-08-28 — Respiratory System Development completed

| id | course | topic | structure | mode | parts | status |
|---|---|---|---|---|---|---|
| `embryology__respiratory-system-development__bronchial-tree-branching` | Embryology | Respiratory System Development | Bronchial tree branching | sequence (deferred: diagram) | 10 structures (9 parts) · 6 views | planned |
| `embryology__respiratory-system-development__alveolar-development` | Embryology | Respiratory System Development | Alveolar development | sequence (deferred: diagram) | 10 structures (9 parts) · 6 views | planned |

### `embryology__respiratory-system-development__bronchial-tree-branching`

The curriculum note for this entry is "stages of lung maturation", which is a different subject from the
branching itself, so the scene carries both and keeps them in separate groups. Beats 1 to 3 are the tree —
one move repeated, the three named generations, and the mesenchymal induction that drives it. Beats 4 to 6
are the timeline. Splitting them is what lets beat 5 make the point that matters clinically: viability is set
by vascularisation in the canalicular stage, not by branching, which finished at sixteen weeks and could not
exchange a molecule of gas.

`covers[]` claims this entry only. The alveolar stage appears on the timeline because a four-stage table with
three stages in it is not a table, but the pneumocytes and surfactant are left entirely to the next scene.

The left lung is given eight to ten bronchopulmonary segments rather than the flat ten that is often taught.
`gaps[]` records why, so the range is not read later as an error.

### `embryology__respiratory-system-development__alveolar-development`

The curriculum note is one word, "surfactant", and the entry is examined as a mechanism rather than a list of
derivatives, so the scene runs the mechanism the whole way: septation, then the barrier, then the two cells,
then surfactant and Laplace, then the first breath, then RDS with its prediction, prevention and treatment
each hanging off the step of the mechanism it acts on. `gaps[]` states where the physiology is deliberately
cut — ventilation and perfusion are not touched.

Beat 3 is the one place the inherited endoderm/mesoderm colour key does real work rather than decorative
work: both pneumocytes carry the endoderm colour and the alveolar macrophage carries the mesoderm colour, and
that contrast *is* the answer to the question the beat is built around. `gaps[]` binds it accordingly, closing
the three-scene chain the respiratory diverticulum scene opened.

Hyaline membrane disease is given as a synonym but the narration is worded so the membranes read as a
consequence and not as the lesion. `gaps[]` says so explicitly, because it is the error the synonym invites.

**104 scenes · 47 ready · 17 candidate · 40 planned.**
**Respiratory System Development is now complete at 4 of 4 authored, all held on artwork. Embryology stands at
28 of 46 structures authored, 0 ready. The cursor advances to `embryology / GIT Development / Foregut
derivatives`. The previous run's note that the cursor should not be allowed to advance is answered in
RUNLOG.md, not overruled here.**

## Audit 2026-08-28 — amendments to two existing scenes

### `gross__anterior-abdominal-wall-inguinal-region__rectus-sheath` (amended, audited)
Now **23 structures (11 parts) · 6 views · 31 ops · ready**, signed `audited_at 2026-08-28`.
Added as context: `FMA8194` right sixth and `FMA8070` right fifth costal cartilage (beat narration named
five, six and seven and drew only the seventh) and `FMA18806` right external iliac artery, so beat 5's
inferior-epigastric concept trace now starts at the real parent vessel. All 15 model ids re-checked against
the catalog; all names character-exact; all right/left pairs correctly sided. `gaps[]` rewritten to record
the 2026-08-28 catalog searches as evidence rather than asserting absence.

### `gross__arm__biceps-triceps` (amended, audited)
Now **16 structures (11 parts) · 4 views · 14 ops · ready**, signed `audited_at 2026-08-28`.
Added `FMA37665` right coracobrachialis (named twice in narration, previously not drawn); added the
`contraction_filter` beat 4 that CURRICULUM.json requires for **both** Biceps brachii and Triceps brachii
and that the scene did not have; numbered the previously unnumbered third view. Three gap notes added
(transverse humeral ligament, bicipital aponeurosis/labrum, and brachialis/anconeus as a scope decision).

---

## Audit amendments 2026-08-29 (audit walk, scenes read back rather than authored)

### `gross__liver-biliary-tract-pancreas-spleen__portal-venous-system`

Signed `audited_at: 2026-08-29`, **status unchanged at 🟡 candidate** — the portal vein itself has no mesh
and the catalog returns 0 hits for `portal`, re-verified this run. 18 structures, 18 of 18 models in
`meshes-lite/`.

Two changes. The reversed-flow traces in beats 3 and 5 begin on the splenic vein (the last drawn vessel
before the missing confluence) and run through the stomach to the oesophagus, which on screen draws the
**left gastric vein out of the splenic vein**; both beats now state the substitution explicitly and name
the short gastrics as the veins that genuinely do run that way, matching what the stomach card already
said correctly. The group `Portal tributaries` was renamed **`Portal system`** — it carries the liver, the
spleen and the pancreatic duct, only two of its five members being tributaries — which also brings it into
line with the naming already used in the spleen scene's entry above.

### `gross__pelvis-perineum__internal-reproductive-organs`

Signed `audited_at: 2026-08-29`, **status unchanged at 🟡 candidate** — the female half of the curriculum
entry still has no mesh of any kind and that decision is a human's.

`descending aorta` `FMA3784` added as context, taking the scene to 21 structures (21 of 21 models in
`meshes-lite/`). It was added to repair beat 5, which traced testicular lymph to the **internal iliac
artery** — the prostatic nodal field, and precisely the error the same beat's narration warns against. The
one trace is now two that diverge: testis to the aorta (para-aortic, L2) and prostate to the internal
iliac. The aorta also gives the thrice-repeated "testicular artery arises from the aorta at L2" something
to point at. Separately, `gaps[1]` was rewritten: it still described the vas deferens as undrawn and both
its beats as proxies, more than a day after the backlog fix authored `FMA19235`/`FMA19236` and rewired
them.

### `gross__liver-biliary-tract-pancreas-spleen__spleen`

Signed `audited_at: 2026-08-29`, **status ✅ ready**, 20 structures (was 14), 6 views, 14 of 14 models in
`meshes-lite/`. This scene had **no CORPUS.md entry at all** before this run despite having existed since
2026-08-27 — the file drifted from the scenes directory and nothing checks that it has not.

**Six measured landmark anchors added** on `FMA7196`, which `gaps[4]` claimed was not in the local
decimated set. It is, and that was the eleventh scene found carrying that stale sentence. Hilum (CONTACT,
two witnesses — splenic artery 0.31 mm, splenic vein 0.56 mm, agreeing to 1.31 mm on a 99 mm organ),
gastric impression (0.40 mm, 634 verts), renal impression (0.18 mm, 365 verts), diaphragmatic surface
(0.57 mm, 662 verts), lower pole and upper pole (`--extreme -z` / `+z`). All six `needs-review`.
**The vertical axis of these meshes is z, not the long axis `y` that derive-landmark reports** — confirmed
against the rib-nine, rib-eleven and left-kidney centroids; an `--extreme -y` run returns a posterior
point, not the lower pole, and that trap is now recorded in `gaps[]`. Three derivations refused and are
recorded so no later run repeats them: the pancreatic duct stops 11.46 mm short of the spleen, and ribs
nine, ten and eleven miss by 6.01, 10.71 and 17.48 mm — which is correct anatomy, the diaphragm and the
costodiaphragmatic recess lying between, and is the reason splenic dullness is a narrow band.

Three factual repairs. Beat 5 called the notch **medial** while the organ card and `match.terms` both put
it on the **anterior** border; the anterior border is right and the medial edge is now only where the
fingers meet it. The match term `one ounce three inches five inches` was a garbled 1-3-5-7-9-11 mnemonic
the rib-ten card states correctly. `T10 to L2` was a stray segmental level belonging to no structure here.
Beat 6's haemorrhage trace ran spleen → diaphragm → **liver**, which draws blood tracking to an organ the
scene shows only as the portal destination; it now ends on the new diaphragmatic-surface anchor, where the
Kehr's-sign narration actually is.

### `gross__lungs-mediastinum__great-vessels`  (amended, audited)

Signed `audited_at: 2026-08-29`, **status unchanged at ✅ ready**. All 22 mesh ids verified against the
catalog, names character-for-character, 22 of 22 in `meshes-lite/`. Sides checked on the pair the spec
warns about: `FMA7333` upper lobe of **right** lung → "Right upper lobe", `FMA7370` upper lobe of **left**
lung → "Left upper lobe", both correct; so are both brachiocephalic veins, both carotids and both
subclavians. All 12 anchors carry `calibrated_by`. Curriculum asks `vasculature` and `associated_organs`;
both present.

Two narration repairs, both contradicted elsewhere in the corpus rather than merely arguable. Beat 5 said
the venae cavae open into the right atrium and "**neither has a valve**" — `heart-chambers`, same course,
correctly teaches that the superior enters unguarded while the inferior carries the rudimentary
**Eustachian valve**. Beat 5 now says both and draws the JVP conclusion the pair supports; the valve is
named-not-drawn, so it is in the cava's `terms[]` and in a new gap. Beat 1 said blocking **any** of the six
great vessels stops the circulation in seconds — the scene's own beat 7 teaches slow SVC obstruction as a
weeks-long syndrome and `gaps[5]` records the azygos collateral that is why. Beat 1 now separates the
vessels that are irreplaceable in seconds from the ones that collateralise, and points forward to beat 7.

---

## Run 2026-08-30 — gross audit complete; Neuroanatomy opens

### `gross__thoracic-wall-diaphragm__ribs-sternum` (amended)
- Audited and signed `audited_at: 2026-08-30`. Two narration corrections, no structural change: the
  sternal angle is a ridge that juts **forwards** (the manubriosternal angle opens backwards), corrected
  in both places it was stated — the `sternal_body` card and beat 3; and the xiphoid card now says it is
  the landmark chest compressions stay **clear of**, not the landmark to press on. Still 43 structures ·
  9 views · 36 ops · `ready`. 43/43 models in hand.

### `neuroanatomy__cerebrum-gross-lobes__cerebral-hemispheres-lobes` (new)
- id `neuroanatomy__cerebrum-gross-lobes__cerebral-hemispheres-lobes` · Neuroanatomy · Cerebrum — Gross &
  Lobes · **Cerebral hemispheres & lobes** · mode `3d_anatomy` (deferred: `diagram`) · 38 structures (31
  parts) · 10 views · 38 ops · **candidate**.
- Groups: **Frontal lobe** (superior and middle frontal gyri both sides FMA72653–72656, orbital/straight
  gyri BP51, precentral gyri FMA72661/72662), **Parietal lobe** (postcentral FMA72665/72666, superior
  parietal lobule & precuneus BP50/BP49, supramarginal FMA72667/72668, angular FMA72669/72670),
  **Temporal lobe** (superior temporal gyrus in anterior FMA72800/72801 and posterior FMA72804/72805
  parts, middle FMA72685/72686, inferior FMA72687/72688, fusiform FMA72689/72690), **Occipital lobe**
  (FMA72975/72976 — the only lobe that exists as a lobe), **Insula** (FMA72977/72978 plus accessory short
  gyri FMA72701/72702), **Limbic border** (cingulate FMA72717/72718, parahippocampal FMA72705/72706) and
  **Connections** (corpus callosum FMA86464, anterior commissure FMA61961, hemispheric white matter
  FMA61822).
- Ten beats: the folded sheet; the central sulcus as the orienting landmark, precentral against
  postcentral; each of the four surface lobes isolated in turn; the insula uncovered; the two commissures
  on the medial surface; the cingulate–parahippocampal ring; and a cross-section for grey outside, white
  inside.
- **Frontal, parietal and temporal lobes have no whole-lobe mesh** and are built from their gyri —
  `gaps[0]`. **No inferior frontal gyrus, so no Broca's area** (`gaps[1]`); Wernicke's area is present and
  lit. No sulci, no auditory or visual cortex, no cerebral arteries.
- **0 of 38 models are in `meshes-lite/`.** Every beat is hollow until they are fetched; this is the sole
  reason for `candidate`.

### `neuroanatomy__cerebrum-gross-lobes__gyri-sulci-landmarks` (new)
- id `neuroanatomy__cerebrum-gross-lobes__gyri-sulci-landmarks` · Neuroanatomy · Cerebrum — Gross & Lobes ·
  **Gyri & sulci landmarks** · mode `3d_anatomy` (deferred: `diagram`) · 20 structures (16 parts) · 9 views ·
  38 ops · **candidate**. Curriculum view required: `location` — satisfied (all nine beats are `location`).
- Groups: **Central sulcus bank** (precentral FMA72661/72662, postcentral FMA72665/72666 — both sides, so the
  facing pair can be shown twice), **Frontal gyri** (superior FMA72654, middle FMA72656, orbital/straight
  BP51), **Temporal gyri** (superior temporal anterior FMA72801 and posterior FMA72805, middle FMA72686,
  inferior FMA72688), **Parietal gyri** (supramarginal FMA72668, angular FMA72670, superior parietal
  lobule/precuneus BP49), **Occipital** (FMA72976), **Medial & inferior** (cingulate FMA72718,
  parahippocampal FMA72706, fusiform FMA72690), **Buried cortex** (insula FMA72978, accessory short gyrus
  FMA72702).
- The organising idea: **no sulcus is an object**, so every sulcus is taught by lighting the two gyri that
  bank it, and each beat names which two. Beats: ridges and clefts; the central sulcus from its two banks;
  the superior-frontal-sulcus route to the precentral gyrus from above; the lateral sulcus and its lower lip;
  the two upturned sulcal ends capped by supramarginal and angular gyri; the three temporal gyri; the
  parieto-occipital/calcarine Y on the medial face; the three strips and two clefts of the undersurface; the
  sulci that cannot be seen at all, inside the insula.
- 0/20 models in meshes-lite. Every beat is hollow until the brain meshes are fetched.

### `neuroanatomy__cerebrum-gross-lobes__functional-cortical-areas` (new)
- id `neuroanatomy__cerebrum-gross-lobes__functional-cortical-areas` · Neuroanatomy · Cerebrum — Gross &
  Lobes · **Functional cortical areas** · mode `3d_anatomy` (deferred: `diagram`) · 18 structures (12 parts) ·
  10 views · 44 ops · **candidate**. Curriculum views required: `location` + `mechanism` — both present
  (beats 1–5 and 10 `location`, beats 6–9 `mechanism`).
- Groups: **Primary areas** (M1 = precentral FMA72662/72661, S1 = postcentral FMA72666/72665, auditory on
  superior temporal FMA72801, visual = occipital lobes FMA72976/72975), **Motor association** (SMA on
  superior frontal FMA72654, FEF/prefrontal on middle frontal FMA72656), **Language network** (Wernicke
  FMA72805 with the right mirror FMA72804, supramarginal FMA72668, angular FMA72670), **Higher visual**
  (visual word form area on left fusiform FMA72690, fusiform face area on right FMA72689, inferior temporal
  FMA72688, dorsal stream on BP50, insula FMA72978).
- Six structures carry `approx{}` because the functional area is part of a larger gyrus with no model of its
  own: auditory cortex, V1, SMA, FEF, VWFA, FFA. The player shows those in amber and names the parent.
- **Broca's area is absent from the catalog and is never faked.** Beats 5, 6 and 7 each state that the
  inferior frontal gyrus does not exist as a model and say where to picture it. Beat 8 teaches arterial
  territory by reasoning and states in capitals that no cerebral artery is on screen.
- 0/18 models in meshes-lite. Every beat is hollow until the brain meshes are fetched.

### `neuroanatomy__cerebrum-gross-lobes__white-matter-tracts` (new)
- id `neuroanatomy__cerebrum-gross-lobes__white-matter-tracts` · Neuroanatomy · Cerebrum — Gross & Lobes ·
  **White matter tracts** · mode `3d_anatomy` (deferred: `diagram`) · 25 structures (10 parts) · 9 views ·
  41 ops · **candidate**. Curriculum views required: `cross_section` + `mechanism` — both present
  (beats 1, 2, 3, 5, 9 `cross_section`; beats 4, 6, 7, 8 `mechanism`). Completes the Cerebrum topic.
- Groups: **The white core** (FMA61822 white matter structure of cerebral hemisphere, FMA78450 left lateral
  ventricle for orientation), **Commissural** (FMA86464 corpus callosum, FMA61961 anterior commissure,
  FMA62072 posterior commissure, FMA61970 commissure of fornix, with FMA61975 lamina terminalis and
  FMA62033 pineal body as the walls that place them), **Limbic projection** (FMA72925/72924 fornices,
  FMA74877 mammillary body, FMA72714 left hippocampus, FMA73414/73413 striae medullares, FMA62032
  habenula), **Projection** (FMA72909/72908 anterior limbs of internal capsule, FMA62394 peduncle of
  midbrain, FMA67936/62382 optic tracts, FMA62045 chiasm), **Capsule walls** (caudate, putamen, globus
  pallidus, thalamus).
- **The whole association class is absent from the catalog** — no fasciculus of any name, searched under
  nine spellings. Beat 9 says so explicitly and teaches the cingulum and arcuate fasciculus as named, not
  shown. **Only the ANTERIOR limb of the internal capsule exists**; beat 5 lights it, states it carries no
  motor fibres, and points at the gap between thalamus and lentiform where the posterior limb runs.
- Descending trace (beat 6) is `concept:corticospinal-fibres` stepping white matter → capsule → peduncle,
  which is the last drawable station: no decussation, lemniscus or brainstem tract exists.
- 0/25 models in meshes-lite. Every beat is hollow until the brain meshes are fetched. No anchors authored —
  no parent mesh on disk to measure against.

### `neuroanatomy__ventricular-system-csf__ventricles` (new)
- id `neuroanatomy__ventricular-system-csf__ventricles` · Neuroanatomy · Ventricular System & CSF ·
  **Ventricles** · mode `3d_anatomy` (deferred: `diagram`) · 23 structures (10 parts) · 9 views · 43 ops ·
  **candidate**. Curriculum views required: `cross_section` + `location` — both present (beats 3, 4, 5, 6, 9
  `cross_section`; beats 1, 2, 7, 8 `location`). First scene of the Ventricular System topic.
- Groups: **Lateral ventricles** (FMA78450 L / FMA78449 R, FMA61844 septum pellucidum), **Channels**
  (FMA75351 interventricular foramen, FMA78467 cerebral aqueduct), **Midline cavities** (FMA78454 third,
  FMA78469 fourth, FMA78497 central canal of spinal cord), **Plexus** (FMA274029 L / FMA274027 R),
  **Walls & neighbours** (corpus callosum, caudates, thalami, left fornix, lamina terminalis, chiasm,
  mammillary body, pineal body, pons, medulla, cerebellum).
- Every cavity is taught by its walls rather than by its shape, because a ventricle is a space: beat 3 reads
  the coronal slice off callosum/septum/caudate, beat 4 finds the foramen between fornix column and
  thalamus, beat 5 walks the four walls of the third ventricle, beat 9 turns the order into the standard
  block-localisation rule.
- **No exit from the fourth ventricle and nothing of the subarachnoid route exists** — no aperture, no
  meninges, no cistern, no granulation, no dural sinus. Beat 8's `concept:csf` trace therefore ends at the
  central canal and says the last third of the journey is described, not drawn. For the same reason the
  scene does **not** claim the curriculum's `CSF circulation` structure, which needs the absorption half —
  that structure is now authored separately as `neuroanatomy__ventricular-system-csf__csf-circulation` in
  `diagram`, its first preferred mode. It also does not claim `Choroid plexus`, now authored separately as
  `neuroanatomy__ventricular-system-csf__choroid-plexus`.
- 22/23 models missing from meshes-lite. The one present is FMA78497, fetched for the gross spinal cord
  scene — verified by listing the directory. No anchors authored.

### `neuroanatomy__ventricular-system-csf__choroid-plexus` (new)
- id `neuroanatomy__ventricular-system-csf__choroid-plexus` · Neuroanatomy · Ventricular System & CSF ·
  Choroid plexus · mode `3d_anatomy`, deferred `diagram` · covers `Choroid plexus` · status **candidate**
  (delivery only) · 15 structures (2 parts) · 6 views · 27 ops.
- Parts: **Choroid plexus** FMA274029 (L) / FMA274027 (R) — the lateral ventricle plexus, the only plexus
  the catalog carries. Context groups: **Cavities it lies in** (FMA78450 L / FMA78449 R lateral ventricles),
  **Cavities with plexus not modelled** (third FMA78454, fourth FMA78469), **Cavities without plexus**
  (aqueduct FMA78467, interventricular foramen FMA75351, central canal FMA78497), **The line it hangs from**
  (fornices FMA72925 L / FMA72924 R, thalami FMA258716 L / FMA258714 R — the two lips of the choroid
  fissure, which has no model of its own), **Orientation** (corpus callosum FMA86464, cerebellum FMA67944).
- Views: `location` ×2 (where it is; where it is not — the negatives are visible as the gap between two lit
  groups), `glands` ×2 (the gland as one sheet through four cavities; slung on the choroid fissure between
  fornix and thalamus, continuous through the foramen), `mechanism` ×2 (the three layers and the reversed
  barrier — leaky capillary, tight-junctioned epithelium; rate versus pressure).
- The layer histology is described, not drawn: no ependyma, epithelium or capillary exists at any scale in
  this catalog, and beat 5 says so in the beat itself rather than implying a labelled section.
- 14/15 models missing from meshes-lite. The one present is FMA78497. **FMA274029 and FMA274027 are the two
  meshes to fetch first — without them this scene has no subject.** No anchors authored (no parent on disk).

### `neuroanatomy__ventricular-system-csf__csf-circulation` (new)
- id `neuroanatomy__ventricular-system-csf__csf-circulation` · Neuroanatomy · Ventricular System & CSF ·
  CSF circulation · mode `diagram` (SVG), deferred `3d_anatomy` · covers `CSF circulation` · status
  **planned** · 16 drawn regions (16 parts, no model ids) · 6 views · 27 ops.
- Groups: **Production** (choroid plexus), **Inside the brain** (lateral ventricles, foramen of Monro, third
  ventricle, aqueduct, fourth ventricle), **Leaving the brain** (the three apertures — the boundary that
  defines obstructive versus communicating), **Around the brain** (cisterna magna, basal cisterns,
  convexity, lumbar cistern), **Absorption** (arachnoid granulations, superior sagittal sinus, the nerve
  sleeve and glymphatic routes), **When it fails** (obstructive, communicating).
- Views: `mechanism` ×4 (the twelve-step route; fixed production against pressure-driven absorption; reading
  the block from the last normal cavity; the three operations), `vasculature` ×2 (the venous end — the
  granulation-to-sinus valve and why sinus pressure sets the threshold; Monro-Kellie).
- Routed to `diagram` because the absorption half has no geometry at all: no meninges, cistern, granulation,
  aperture or dural sinus anywhere in the 934 meshes, re-searched under sixteen spellings this run. A 3D
  version could only repeat what the Ventricles scene already draws and would stop at the fourth ventricle.
- Agrees with the Ventricles scene on every shared number (≈500 mL/day into ≈150 mL; aqueduct narrowest;
  three-up-one-normal reads an aqueduct block); the two were read against each other for that.

### `neuroanatomy__ventricular-system-csf__meninges` (new)
- id `neuroanatomy__ventricular-system-csf__meninges` · Neuroanatomy · Ventricular System & CSF · Meninges
  · mode `diagram` (deferred `3d_anatomy`) · provider `svg` · status **planned** · 19 structures (16 parts)
  · 6 views · 22 ops · covers "Meninges".
- Routed to `diagram` because the catalog is *completely* empty of meninges. Searched mater, menin, meninx,
  dura, arachnoid, pia, lepto, pachy, falx, tentor, sinus, sagittal, granulation, villus, cistern, subarach,
  filum, denticulate, thecal, sella, diaphragma across all 934 meshes — exactly one hit, `FMA4706 coronary
  sinus`, which is cardiac. No model ids and no `refs` anywhere in the scene.
- Teaches the four membranes outwards-in, the one real space against the two potential ones, the four dural
  folds with the two herniations their free edges permit, the spinal arithmetic (cord ends L1–L2, sac ends
  S2, needle at L3/4 or L4/5), and the three haematomas derived from the layer rather than memorised.
- Bounded against `neuroanatomy__ventricular-system-csf__csf-circulation`: that scene owns the fluid, this
  one owns the membranes. The arachnoid granulations appear in both and beat 4 says so explicitly; the one
  shared fact (fluid returns through the granulations into the superior sagittal sinus) is stated identically
  in both.

### `neuroanatomy__basal-ganglia-diencephalon__basal-ganglia` (new)
- id `neuroanatomy__basal-ganglia-diencephalon__basal-ganglia` · Neuroanatomy · Basal Ganglia &
  Diencephalon · Basal ganglia · mode `3d_anatomy` · provider `bodyparts3d` · status **candidate** ·
  17 structures (8 parts) · 7 views · 31 ops · covers "Basal ganglia" only.
- All 17 ids verified in `available-meshes.json`, names character-for-character. Sides: caudate
  FMA72826 R / FMA72827 L, putamen FMA72828 R / FMA72829 L, globus pallidus FMA72830 R / FMA72831 L,
  anterior limb of internal capsule FMA72908 R / FMA72909 L, amygdala FMA72832 R / FMA72833 L, insula
  FMA72977 R / FMA72978 L, lateral ventricle FMA78449 R / FMA78450 L, and the pair that breaks the
  consecutive-id pattern — thalamus **FMA258714 right, FMA258716 left**.
- ~~`candidate`, not `ready`: 17 of 17 models missing from `meshes-lite/`.~~ **Amended 2026-08-30: that
  delivery gap is closed.** All 17 were verified on disk individually and `sync-state.mjs` reports the scene
  drawing complete; every beat renders. The scene's two stale `gaps[]` notes were rewritten — the second of
  them had also given "the parent mesh is not on disk" as the reason no anchor was authored, which was the
  wrong reason as well as a stale one (see the new note for the per-feature definition reasons). It stays
  `candidate` for the authoring reasons only: no posterior limb, no substantia nigra, no subthalamic nucleus.
- Absences stated in the scene where the student would otherwise be misled: no substantia nigra, no
  subthalamic nucleus, globus pallidus undivided (no GPi/GPe), and **only the anterior limb of the internal
  capsule** — no genu, no posterior limb, so the beat that turns on capsular stroke is written as narration
  over an acknowledged gap. No claustrum or external/extreme capsule, which is why putamen and insula appear
  to touch. No cerebral vessel, so the lenticulostriate arteries are named and not drawn.
- Thalamus and Internal capsule are deliberately **not** in `covers[]` — both are separate curriculum
  structures in this topic and appear here only as neighbours.


### `neuroanatomy__basal-ganglia-diencephalon__thalamus` (new)
- id `neuroanatomy__basal-ganglia-diencephalon__thalamus` · Neuroanatomy · Basal Ganglia & Diencephalon ·
  Thalamus · mode `3d_anatomy` · provider `bodyparts3d` · status **candidate** · 21 structures (4 parts) ·
  6 views · covers "Thalamus" only.
- Built as a boundary scene rather than a nucleus scene, because the thalamus mesh is undivided: the six
  walls (third ventricle medially, internal capsule laterally, fornix and ventricular floor above,
  hypothalamus below the hypothalamic sulcus, pulvinar over the tectum behind) are the teaching, and the
  nuclei are named in beat 5 as described-not-shown.
- Curriculum views `cross_section` + `location` both present (beats 3 and 4 cross-section; beats 1 and 2
  location; beats 5 and 6 mechanism).
- Sides: thalamus **FMA258714 right, FMA258716 left** (not consecutive); stria medullaris FMA73413 R /
  FMA73414 L; anterior limb of internal capsule FMA72908 R / FMA72909 L; lateral ventricle FMA78449 R /
  FMA78450 L; fornix FMA72924 R / FMA72925 L; optic tract **FMA62382 right, FMA67936 left** (different id
  ranges — the second trap).
- `candidate`, not `ready`: 21 of 21 models missing from `meshes-lite/`. Every beat is hollow.
- Absences stated where a student would otherwise be misled: no thalamic nucleus and no geniculate body,
  no internal medullary lamina, **no posterior limb of the internal capsule** (so the drawn anterior limb
  lies in front of the thalamus, not beside it — said in both capsule cards and in beat 3), no
  interthalamic adhesion, no hypothalamic sulcus, no mammillothalamic tract, no cerebral vessel.
- Internal capsule, basal ganglia and hypothalamus deliberately **not** in `covers[]`.

### `neuroanatomy__basal-ganglia-diencephalon__hypothalamus-pituitary` (new)
- id `neuroanatomy__basal-ganglia-diencephalon__hypothalamus-pituitary` · Neuroanatomy · Basal Ganglia &
  Diencephalon · Hypothalamus & pituitary · mode `3d_anatomy` · provider `bodyparts3d` · status
  **candidate** · 15 structures (5 parts) · 5 views · covers "Hypothalamus & pituitary" only.
- Routed to `3d_anatomy` and not to `diagram` despite there being no "hypothalamus" mesh, because four
  genuine hypothalamic/perihypothalamic landmarks exist and are drawn — tuber cinereum FMA62327,
  mammillary body FMA74877, lamina terminalis FMA61975, optic chiasm FMA62045 — plus the pituitary gland
  FMA13889 and the third ventricle whose floor the hypothalamus is.
- Curriculum views `location` + `glands` + `mechanism` all present (beats 1–2 location, beat 3 glands,
  beats 4–5 mechanism).
- Sella turcica marked honestly rather than faked: `approx {shown_as: sphenoid bone, detail: sella
  turcica / hypophysial fossa}` on FMA52736. No anchor authored — derive-landmark cannot measure a mesh
  that is not in `meshes-lite/`; the gap note records that the correct future call is
  `--contact FMA13889 --area N`, because the fossa is a surface and not a point.
- Sides: optic nerve FMA50875 R / FMA50878 L; optic tract **FMA62382 right, FMA67936 left**; fornix
  FMA72924 R / FMA72925 L; thalamus **FMA258714 right, FMA258716 left**. Four true midline meshes carry no
  side: tuber cinereum, lamina terminalis, optic chiasm, pituitary gland.
- `candidate`, not `ready`: 15 of 15 models missing from `meshes-lite/`. Every beat is hollow.
- Absences stated in the beat that needs them: no hypothalamic nucleus of any kind, no infundibulum and no
  median eminence, pituitary undivided (no anterior/posterior lobe), no hypophysial portal system and no
  hypothalamohypophysial tract (beat 4's two mechanisms are concept traces), **no meninges anywhere in the
  catalog** (searched nine spellings, zero hits — this also settles the Meninges structure of the
  Ventricular System & CSF topic), no cavernous sinus and no internal carotid artery.


### `neuroanatomy__basal-ganglia-diencephalon__internal-capsule` (new)
- id `neuroanatomy__basal-ganglia-diencephalon__internal-capsule` · Neuroanatomy · Basal Ganglia &
  Diencephalon · Internal capsule · mode `3d_anatomy` · provider `bodyparts3d` · status **candidate** ·
  17 structures (2 parts) · 5 views · 24 ops · covers "Internal capsule" only.
- Curriculum views required (`cross_section`, `mechanism`) both present: beats 1-3 `cross_section`,
  beats 4-5 `mechanism`.
- All 17 ids verified in `available-meshes.json`, names character-for-character, and all 17 present in
  `meshes-lite/` — the scene draws complete. Sides: anterior limb FMA72908 R / FMA72909 L, caudate
  FMA72826 R / FMA72827 L, putamen FMA72828 R / FMA72829 L, globus pallidus FMA72830 R / FMA72831 L,
  lateral ventricle FMA78449 R / FMA78450 L, occipital lobe FMA72975 R / FMA72976 L, and the trap pair —
  thalamus **FMA258714 right, FMA258716 left**.
- `candidate` for an **authoring** reason, not a delivery one: only the two anterior limbs exist as meshes.
  No genu, no posterior limb, no retrolentiform or sublentiform part, no corona radiata — and the posterior
  limb is the part the clinical teaching turns on. The scene is built around that rather than over it: beat 2
  teaches the capsule as the space between its two walls (caudate then thalamus medially, lentiform nucleus
  laterally), which is how the capsule is defined anatomically and survives the missing geometry.
- Honest disclosure carried in the beat, not only in `gaps[]`: beat 4's corticospinal trace routes through
  `ic_ant_r` because it is the only capsular key that exists, and the narration says the fibres it stands for
  actually run in the posterior limb. Beat 5 names three arterial territories and draws none.
- No anchor authored. The genu is the bend of a shape with no mesh, so there is nothing to measure the corner
  of; the nearest proxy would define where the anterior limb ends, not where the capsule turns. Not attempted,
  deliberately, and recorded so no later run derives it and believes it.
- Caudate, putamen, globus pallidus and thalamus deliberately **not** in `covers[]` — all four have their own
  scenes in this topic and appear here only as the walls that define the capsule. The complementary boundary
  holds: `...__basal-ganglia` shows the same two anterior limbs and does not claim "Internal capsule".


### `neuroanatomy__brainstem__midbrain` (new — first Brainstem scene)
- id `neuroanatomy__brainstem__midbrain` · Neuroanatomy · Brainstem · Midbrain · mode `3d_anatomy` ·
  provider `bodyparts3d` · status **candidate** · 23 structures (10 parts) · 6 views · 31 ops ·
  covers "Midbrain" only.
- Curriculum views required (`cross_section`, `location`) both present: beats 1-2 `location`,
  beats 3-6 `cross_section`.
- All 23 ids verified in `available-meshes.json`, names character-for-character. **23 of 23 in
  `meshes-lite/` — the scene draws complete.** Recorded because it is the kind of fact this corpus keeps
  getting wrong: at the start of this run the eight tectal meshes (FMA73422/73423 superior colliculi,
  FMA73434/73435 inferior, FMA73461-73464 the four brachia) were verified ABSENT, and the scene was written
  saying beat 2's posterior half and all of beat 4 were hollow. They arrived during the run — `meshes-lite/`
  went 478 → 491 files — and the scene's `gaps[]` now carries both readings and the date of each. `candidate`
  is therefore an authoring status here, not a delivery one.
- Sides, and this scene has the worst id trap in the corpus so far: the four brachia interleave rather than
  grouping by colliculus — FMA73461 **superior** R, FMA73462 **superior** L, FMA73463 **inferior** R,
  FMA73464 **inferior** L. Colliculi FMA73422 R / FMA73423 L superior, FMA73434 R / FMA73435 L inferior.
  Optic tracts break the numbering entirely: FMA62382 **right**, FMA67936 **left**. Thalamus FMA258714 R /
  FMA258716 L. Aqueduct, pons, medulla, cerebellum, pineal body, posterior commissure, mammillary body,
  chiasm and the third and fourth ventricles are unpaired midline meshes.
- Absences stated in the beat that needs them: FMA62394 `peduncle of midbrain` is one undivided block, so
  crus, tegmentum, substantia nigra, red nucleus, periaqueductal grey and both cranial-nerve nuclei are a map
  read over a solid mesh and beat 3 says so. No CN III or CN IV (the catalog holds two nerve meshes in total,
  both optic). No geniculate body of either kind — beat 4's auditory trace ends on the thalamus and says the
  thalamus is standing for the medial geniculate rather than pretending to be it. No superior cerebellar
  peduncle or decussation. No basilar or posterior cerebral artery, so beat 6's vessels are named only.
- `FMA83740 interpeduncular fossa` is in the catalog but not on disk, and was **not** authored as an anchor
  either: it is a hollow bounded by two crura and the mammillary bodies, a space between structures rather
  than a point on one, the same shape of definition that made `derive-landmark.mjs` refuse the axillary apex.
- Verified for the topics ahead while searching: `cerebellum` returns exactly one catalog entry, FMA67944,
  the whole organ — no vermis, lobe, tonsil, flocculus or deep nucleus. The task's coverage table calling
  Cerebellum "whole cerebellum only" is confirmed by search, not assumed.
- Pons, medulla, cerebellum and thalamus deliberately **not** in `covers[]` — each has its own curriculum
  entry and appears here only as a boundary of the midbrain.
