# Repair backlog — everything the authoring task got wrong or left undone

Built 2026-08-28 by reading all fifty run blocks in `RUNLOG.md` one at a time and cross-checking
every claim against the scene files and `available-meshes.json`. This file is the worklist. It is
ordered so that the top of it is the work that changes what a student sees.

**Forty-six corrections were already applied** in the same session (nineteen anatomical errors,
twenty false absence claims, five wrong labels, plus the delivery gate). Those are done and are
recorded in `RUNLOG.md`, not here. What follows is what is left.

---

## How the task got things wrong

Three failure modes account for nearly everything below, and knowing them is worth more than the
list itself.

**1. Searching for the clinical name instead of the catalog's name.** The catalog spells things in
Terminologia: `scalenus` not scalene, `deferent duct` not vas deferens, `interosseous` not
interossei, `disk` not disc, `levatores costarum` where the run searched only the singular. Every
time, the run searched once, got nothing, wrote "there is no X in the catalog" into `gaps[]`, and
moved on. The note then became evidence: later runs quoted it instead of searching again, and one
of them — "there are no ligaments in the catalog" — was contradicted by a ligament the previous run
had itself authored. **Nine meshes were declared missing that were sitting in the catalog the whole
time.** The rule the runs themselves wrote after the third occurrence is the right one and was never
followed: *search the catalog for the structure, every time; a note in this file is not evidence.*

**2. Writing the fact once and contradicting it elsewhere.** Almost every anatomical error found was
already stated correctly somewhere else in the same corpus, and usually in the same file. The kidney
scene said you cannot get above an enlarged kidney in beat 1 and that you can in the spleen card two
structures later. The clavicle scene named subclavius as the separator of the subclavian vein and
artery, then correctly described subclavius as lying between the vessels and the bone. The hip scene
said obturator externus passes in front of the axis of the neck, then said in beat 9 that it winds
under it. **The corpus already contained the correct answer in every single case.** A consistency
pass over one scene would have caught more than any amount of external checking.

**3. Counting from memory.** Anchors, structures, ids, landmarks — the run log's numbers disagree
with the files often enough that the log cannot be used to audit the corpus. Three runs claimed a
scene was `ready` when the file said `candidate`, and the covered-structure arithmetic in every
later run was built on those numbers.

---

## 1 · Structures to add — the mesh exists and the scene said it did not

**STATUS 2026-08-28: thirteen of the fourteen are DONE** — applied in the same session that wrote this
file, meshes fetched, decimated and uploaded, `104/104` valid, `64 of 64` gross scenes drawing complete.
**Section 1 is now CLEAR (2026-08-28)** — all fourteen table rows and the routing re-open are DONE. Go to section 2.

These are the direct consequence of failure mode 1. Each is one authoring job: add the structure with
the catalog's `name` verbatim, put it in an existing group, give it a label, terms and narration, and
show it in the beat that already talks about it. The `gaps[]` line has already been corrected in each
file to say the mesh exists, so the scene currently tells the reader to do this.

| scene | add | why it matters |
|---|---|---|
| DONE `forearm-hand__flexor-compartment` | `FMA23707` interosseous membrane of right forearm | the boundary the compartment is defined by |
| DONE `forearm-hand__extensor-compartment` | `FMA23707` | beat 3 already says "the membrane between them" |
| DONE `leg-foot__gastrocnemius-soleus` | `FMA35192` interosseous membrane of right leg | the fourth wall of the closed box the compartment-syndrome beat needs |
| DONE `thoracic-wall-diaphragm__intercostal-muscles` | `FMA74075` + `FMA74077` levatores costarum longi and breves, right | why the posterior wall looks thinner than it is |
| DONE `pelvis-perineum__internal-reproductive-organs` | `FMA19235` + `FMA19236` deferent ducts | **highest value on this list.** Beat 1 currently traces sperm from epididymis to seminal vesicle with the connecting duct invisible, and beat 4 draws "water under the bridge" from the seminal vesicle to the ureter as a proxy for a crossing the vas actually makes. Rewire both beats. |
| DONE `anterior-abdominal-wall-inguinal-region__inguinal-canal` | `FMA19235` | the principal content of the cord, currently a concept trace |
| DONE `kidney-posterior-abdominal-wall__ureters` | `FMA19235` as context | lets the vas-crosses-ureter relation be shown, not described |
| DONE `pectoral-region-breast__clavicle` | `FMA4754` right internal jugular vein; `FMA13392` right scalenus anterior | the venous angle is narrated as a junction with nothing to join; scalenus anterior is the answer to "what separates the subclavian artery from the vein", which this scene was getting wrong until today |
| DONE `pectoral-region-breast__axillary-vessels-lymph-nodes` | `FMA4754` | same venous angle, same scene pair |
| DONE `leg-foot__arches-of-the-foot` | `FMA37741`, `FMA37743`, `FMA37745` plantar interossei | the fourth layer of the sole, currently summarised because they were thought to exist only as sets |
| DONE `forearm-hand__flexor-compartment` | index, ring and little finger phalanges (`FMA24451/24455/24460`, `FMA24453/24457/24462`, `FMA24454/24458/24463`) | beats 7 and 8 teach a four-tendon fan on one digit |
| DONE `leg-foot__ankle-joint` | `FMA22546` right extensor hallucis longus | beat 6 names it as one of three tendons in front of the axis and does not draw it |
| DONE (as drawn regions — this is an svg scene, so no model ids) `arm__brachial-artery` | `FMA37665` coracobrachialis, `FMA37695` medial head of right triceps | beat 2 lists "three muscles in order" and draws one |
| DONE (as drawn regions — svg scene) `axilla-brachial-plexus__axillary-vein` | `FMA79979` pectoralis major, `FMA13414` subscapularis as drawn regions | the cross-section beat asks the student to read five things and two are not there |

DONE (2026-08-28: re-opened, re-searched, routing CONFIRMED as `diagram` — no upper-limb nerve mesh exists, so the corridor is renderable but its subject is not) — also re-open one routing decision: **`axilla-brachial-plexus__brachial-plexus` was routed to `diagram`
partly because the scalenes were thought not to exist.** They do (`FMA13392`, `FMA13390`), as do the
first rib and clavicle, so the interscalene groove that beat 1 teaches is renderable in 3D today.

## 2 · Views the curriculum asks for and the scene does not have

- DONE (2026-08-28: catalog re-searched under ten spellings — no vertebral, spinal, radicular, segmental
  medullary, posterior intercostal or lumbar vessel exists; gap note added, view correctly not authored)
  `back-vertebral-column__spinal-cord-in-vertebral-canal` — curriculum requires a `vasculature` view
  ("segmental blood supply"). There is none, and `gaps[]` does not record the omission even though it
  records six others. It is genuinely unauthorable (no vertebral or spinal artery in the catalog), so
  the fix is the gap note, not the view.
- DONE (2026-08-28: beat 3 re-moded `associated_organs` → `glands`; beat 5 left as-is; gap note added)
  `embryology__pharyngeal-apparatus__pharyngeal-pouches` — curriculum requires `glands`. Beat 3 and
  beat 4 already *are* glands views (thymus, both parathyroid pairs, the C cells); they are moded
  `associated_organs`. Re-mode one.

**SECTION 2 IS NOW CLEAR (2026-08-28).** Sections 1 and 2 are both clear; the next run falls through
to the audit walk at `next to audit`.

**Neither was caught by validation.** Nothing in the eight stages compares a scene's view modes to the
`views` its curriculum entry asks for. That check is worth adding — it is a three-line comparison and
it is the only thing standing between the corpus and a silently incomplete scene.

## 3 · Contradictions still open — these need a judgement, not a rewrite

- DONE (2026-08-29 audit) **`pectoral-region-breast__clavicle`** counts the muscles attached to the clavicle
  three ways in one beat: the title says four, the narration says five, the trace path now names six. Pick a
  number. — the number is **six**, and it is the trace path that was right. Four on the medial two-thirds
  (sternocleidomastoid, pectoralis major, subclavius, sternohyoid), two on the lateral third (trapezius,
  deltoid). Title, narration and the sternohyoid structure card all now say six, and the narration states the
  4+2 split explicitly so the count is reconstructable rather than memorised. The ligaments are named in the
  same breath as explicitly *not* in the count, which is where the old "four" probably came from.
- DONE (verified 2026-09-08) **`arm__humerus`** promises "the four places it commonly breaks" in its learning goal and beat 7
  delivers three; `arm__median-ulnar-radial-nerves` `gaps[1]` then defers to a fourth that was never
  written. Either add the supracondylar/median-nerve pair to beat 7 or drop "four" from both.
- DONE (2026-08-29 audit) **kidney vs ureters** give different segmental levels for the same referred pain — T10–L1 in one,
  T11–L2 in the other. The right answer is kidney T10–L1, ureter T11–L2; say both in both. — both scenes
  now state both levels and use the one-segment difference to explain the loin-to-groin march itself,
  rather than leaving it as two numbers that look like a contradiction.
- DONE (2026-08-29 audit) **liver vs spleen** each claim to be the most commonly injured abdominal organ, in the same topic.
  Split it by mechanism: spleen commonest in blunt trauma, liver in penetrating. — the spleen scene was
  already correctly qualified ("in blunt abdominal trauma"); the liver scene's beat 7 said "the most commonly
  injured solid abdominal organ" flat, and now says penetrating first and second to the spleen in blunt.
- DONE (2026-08-28 audit) **`inguinal-ligament-landmarks` vs `inguinal-canal`** teach the deep-ring
  occlusion test as diagnostic and as unreliable respectively. The canal scene is right. — the landmarks
  scene now states the test, then says it is unreliable and that the inferior epigastric artery settles
  it at operation, matching the canal scene word for sense.
- DONE (2026-08-28 audit) **`inguinal-ligament-landmarks`** conflates the supracristal plane (highest
  point of the crest, L4) with the transtubercular plane (tubercle of the crest, L5) on one anchor, and
  the anchor's geometry is the supracristal point while its terms claim both. — anchor relabelled
  "Iliac crest — highest point (supracristal plane)", `terms` reduced to the supracristal set, and the
  narration now names the tubercle and the L5 transtubercular plane explicitly as the OTHER point.
- DONE (2026-08-29 audit) **`forearm-hand__radius-ulna`** `gaps[]` says eleven anchors were derived;
  there are ten. The obvious eleventh is the neck of the radius, which the head narration already names.
  — count corrected to ten. The neck was NOT authored, and that is the finding: a neck is the narrowest
  cross-section, which is neither of `derive-landmark.mjs`'s two definitions. The nearest measurable
  proxy, contact between the radius and supinator, converges at 0.21 mm but on one witness and lands at
  w=0.81, below the radial tuberosity at w=0.83 — upper shaft, not neck. Recorded in the scene's `gaps[]`
  with the measurement, so no later run re-derives it and believes it.
- DONE (applied 2026-08-30; verified 2026-09-08 — the anchor and the corrected gaps[] note are present in `femur`, `hamstrings` and `adductor-canal`) **NEW (2026-08-29 audit) — the adductor tubercle is measurable and two signed scenes say it is not.**
  `gross__thigh__adductor-canal` derived it at audit: `--parent FMA24474 --contact FMA22459`, gap 0.49 mm,
  stable under `--slab z:0,0.15` and `z:0,0.25`, and 25 mm above the medial epicondyle — exactly the
  relation `gross__thigh__femur` states in words. But `gross__thigh__femur` and `gross__thigh__hamstrings`
  both still carry "the adductor tubercle is a sub-feature of a whole-bone mesh and is named rather than
  marked", and both are already signed, so the anchor was not added to them. It should be. Same for the
  medial epicondyle, which fell out of the same cross-check for free. This is failure mode 1 in its
  landmark form: a definition was thought impossible, was never attempted, and the note became evidence.

- DONE (verified 2026-09-08 — file has 13 anchors and `CORPUS.md` line 11 records 13) **`back-vertebral-column__typical-vertebra`** — `CORPUS.md` records 16 landmarks, the file has 13.
- DONE (verified 2026-09-08 — all five Back scenes now number their beats 1..n with no gaps and no repeats; the validator beat-ordinal check is still NOT written and remains open) **Eight views across the four Back & Vertebral Column scenes carry no `beat` number**, and
  `typical-vertebra` numbers two different beats "3". Every run reported the validator clean, because
  nothing checks beat ordinals. Renumber, and add the check.

- DONE (2026-09-08 — swept corpus-wide and CLOSED; see the note appended at the end of this item)
  **NEW (2026-08-29 audit) — "not in the local decimated set" is a false claim repeated across at least
  eleven scenes.** The biliary-tree scene said `FMA7202` was not in `meshes-lite/` and that therefore no
  anchor could be measured; it is there, and five anchors were measured from it at audit. The same sentence
  is still live in `liver`, `pancreas`, `spleen`, `portal-venous-system`, `lungs`, `bony-pelvis`, `stomach`,
  `small-intestine`, `large-intestine` and `ureters`. `sync-state.mjs` reports **every mesh of all 64 gross
  scenes is present**, so every one of those notes is stale and each is suppressing landmark work on geometry
  that is sitting on disk. This is failure mode 1 wearing different clothes: a note became the evidence.
  Re-measure at each scene's audit; do not carry the sentence forward.
  **2026-08-29 (later run):** cleared in `spleen` — `FMA7196` was on disk, six anchors measured (hilum on two
  converging witnesses at 1.31 mm, gastric / renal / diaphragmatic contact patches, both poles) and three
  refusals recorded. That run also found a second trap worth carrying: `derive-landmark.mjs` reports the
  spleen's long axis as `y`, but **z is the vertical axis** of these meshes, so `--extreme -y` returns a
  measured, reproducible and completely wrong "lower pole". Confirm the vertical axis against neighbouring
  centroids before trusting any `--extreme` result. Remaining scenes still carrying the stale sentence:
  `portal-venous-system`, `lungs`, `bony-pelvis`, `stomach`, `small-intestine`, `large-intestine`, `ureters`.
  **2026-08-29:** cleared in `liver` (six anchors measured, three refusals recorded) and in `pancreas` (two
  measured, five refusals recorded). Still live in `biliary-tree-gallbladder`, `spleen`, `portal-venous-system`,
  `lungs`, `bony-pelvis`, `stomach`, `small-intestine`, `large-intestine`, `ureters`, `kidney`,
  `suprarenal-adrenal-gland` and `abdominal-aorta-ivc`.
  **2026-08-29 (audit run):** cleared in `lungs` — `FMA7383` was on disk and the horizontal fissure, missing
  an anchor entirely on a scene whose learning goal is placing the fissures, was measured at 0.09 mm. Cleared
  in `mediastinum`, where the note had done real damage: the oesophagus AND the diaphragm were both claimed
  absent, both were on disk, and the oesophagus had been carried as an anchor **placed by eye** on a `ready`
  scene. Both are now models and four anchors were measured (three oesophageal constrictions, plus
  `ludwig_posterior` re-derived on the T4/T5 disc at 0.07 mm after its old 3.72 mm definition was found to
  exceed the tool's own refusal gate). Still live in `biliary-tree-gallbladder`, `portal-venous-system`,
  `bony-pelvis`, `stomach`, `small-intestine`, `large-intestine`, `ureters`, `kidney`,
  `suprarenal-adrenal-gland` and `abdominal-aorta-ivc`.
  **2026-08-29 (audit run) — THE SENTENCE IS NOT CONFINED TO THE ABDOMEN.** Found in
  `pectoral-region-breast__axillary-vessels-lymph-nodes`, where `gaps[]` said the axillary wall meshes "are
  not in the local mesh set" and that no node anchor could therefore be measured — while naming that anchor
  work as "the single change that would let the scene reach ready". All fifteen of that scene's meshes were
  on disk. Two sites measured at audit (anterior/pectoral group 0.33 mm; lateral wall on two converging
  witnesses, 0.09 and 0.35 mm) and three refusals recorded. Also cleared in
  `lungs-mediastinum__tracheobronchial-tree`, which claimed the oesophagus was "not available locally" when
  `FMA7131` was on disk and the `mediastinum` scene in the same topic already carried it as a model.
  **Treat the list above as a lower bound, not an inventory** — assume the sentence is present in any topic
  and check `meshes-lite/` before believing it. A third instance sits in
  `pectoral-region-breast__clavicle` (`CORPUS.md` ~line 113: "the clavicle mesh is not in the local set", so
  the conoid tubercle, trapezoid line and subclavian groove were never derived). `FMA13322.stl` is on disk.
  That scene is two places down the audit walk; derive them when it comes up.
  **2026-08-29 (audit run): DONE in `clavicle`.** `FMA13322.stl` was on disk exactly as predicted. Three
  anchors measured — sternal facet (manubrium, 0.12 mm, 113-vertex patch), acromial facet (scapula, 0.99 mm,
  65 vertices, cross-checking the existing `acromion` anchor from the opposite side of the same joint) and
  subclavian groove (subclavius, 0.22 mm, 188 vertices) — all with `--area`, all `needs-review`. The conoid
  tubercle and trapezoid line could NOT be derived and that is a definition problem, not a delivery one:
  their ligament has no mesh, and `--contact FMA13395` silently returns the acromioclavicular joint instead,
  because the nearest scapular point to the clavicle is the AC joint and not the coracoid. That refusal is
  recorded in the scene's `gaps[]` with its wrong uvw, so a later run cannot re-derive it and believe it.
  **A fourth variant of the same habit found in the same file:** `gaps[]` said "no ligaments of any kind"
  and the catalog does hold four (both inguinal, both long plantar) — none of them this bone's, so the
  teaching consequence was right and the sentence was wrong. Re-scoped. And a live trap: **`FMA23725`
  "right trapezoid" is in the catalog and is the CARPAL BONE**, not the trapezoid line — the exact shape of
  mistake a run searching for "trapezoid" would make. Named in `gaps[]`.

  **2026-09-08 — CLOSED, and the running "still live in ..." inventory in this item was itself the last
  stale note.** All 20 scenes whose text matches any variant of the sentence ("local decimated set", "not
  in the local mesh set", "not available locally", "not in the local set") were read this run. Every one
  is now a *corrected* note that says the meshes ARE present and names the anchors measured as a result —
  including all ten that the paragraphs above still list as "still live": `biliary-tree-gallbladder`,
  `portal-venous-system`, `bony-pelvis`, `stomach`, `small-intestine`, `large-intestine`, `ureters`,
  `kidney`, `suprarenal-adrenal-gland`, `abdominal-aorta-ivc`. **Do not re-work them.** The sweep also
  reached four scenes this item never listed — `carpal-tunnel`, `femoral-triangle`,
  `pelvic-diaphragm-levator-ani` and the Neuroanatomy `white-matter-tracts` — confirming the item's own
  warning that the list was a lower bound. Exactly **one** live absence claim remains and it is TRUE:
  `pelvic-diaphragm-levator-ani` says the left piriformis `FMA22341` is in the catalog but not in
  `meshes-lite/`. Checked file by file: `FMA22340.stl` (right) is on disk, `FMA22341.stl` is not. That is
  a real delivery gap and the note stays.

- DONE (2026-09-08 — swept mechanically over all 142 scenes; see the note at the end of this item)
  **NEW (2026-08-29 audit) — anchors derived by the bespoke per-topic scripts predate `derive-landmark.mjs`'s
  refusal gate, and some of them would not pass it.** `mediastinum`'s `ludwig_posterior` was a 3.72 mm
  contact, above the 3 mm limit, and its `calibrated_by` defended the gap as anatomically correct instead of
  treating it as a wrong definition. It was: re-defined against the T4/T5 disc it names, it measures 0.07 mm.
  Every scene whose anchors say `see tools/derive-<topic>-landmarks.mjs` rather than `derive-landmark.mjs`
  should have its printed gaps read at audit, and anything over 3 mm re-defined rather than excused.
  **2026-08-29 (audit run): second instance confirmed.** `tracheobronchial-tree`'s `t4_level` was an 11.41 mm
  trachea-to-T4 contact whose `calibrated_by` presented the gap as a finding. Re-run today the tool REFUSES
  it, and correctly: the trachea does not touch T4 because the oesophagus lies between them, so the airway
  was the wrong parent for a vertebral level. Re-derived as the lowest vertex of T4 itself — its lower border
  — which cross-checks against the carina anchor to 1.4 mm in the vertical. Two for two: assume every
  pre-gate anchor is suspect until its printed gap has been read.
  **DONE 2026-09-08 — the sweep this item asked for has now been RUN MECHANICALLY over all 142 scenes**,
  parsing every `calibrated_by` for a printed contact gap and flagging anything above the 3 mm gate. That
  is the whole population, not a sample, so the item is closed rather than advanced. **Three offenders,
  all fixed this run** (details in `CORPUS.md`):
  - `arm__humerus` `capitulum` — 4.85 mm contact against the radius. Re-derived as EXTREME -z within the
    lateral quarter of the bone. Coordinate essentially unchanged, `[0.223, 0.635, 0.023]` →
    `[0.2228, 0.6352, 0.0228]`: **the definition was wrong and the point was right**, which is exactly why
    nobody had spotted it. Only the printed gap gives this class away.
  - `forearm-hand__radius-ulna` `head_of_radius` — the SAME 4.85 mm, read from the other bone of the same
    joint. Re-derived as EXTREME +z; **here the coordinate did move**, so the two cases together show the
    class can be either harmless or not, and you cannot tell without re-deriving.
  - `lungs-mediastinum__great-vessels` `brachiocephalic_trunk_origin` — 17.84 mm, and its note argued that
    the gap *was* the length of the absent vessel. It is — which is precisely what makes it not a contact.
    It cannot be re-defined, because the trunk has no mesh, so the anchor is kept, marked `approx`, and its
    `calibrated_by` now records the refusal and the two-witness convergence instead of excusing the gap.
  The lesson for later runs is narrower than "assume every pre-gate anchor is suspect": **all three
  offenders, and both 2026-08-29 instances, were joint or vessel-junction anchors defined by contact across
  a space that is not modelled.** Cartilage in a joint and a missing branch vessel both open a gap no mesh
  can close. Define an articular surface positionally, never by contact. Muscle-attachment contacts, which
  are the large majority of the corpus's anchors, all came through well under 1 mm.

## 4 · Embryology — twenty-four scenes that will ship the day the SVG engine exists

None of these can be seen today, which is exactly why they are easy to leave. They are also the
cheapest to fix now, before artwork is commissioned against them.

- **`cardiac-looping` does not carry the five-segment colour key** that it and two other scenes
  declare a binding contract. It has three regions standing in for segments, colours the bulbus in a
  hex the tube scene uses for the cardiogenic field, merges atrium with sinus venosus, and omits the
  truncus entirely. An illustrator following the file draws the wrong picture, and beat 3's "check
  yourself against the segment colours — nothing has been added or lost" cannot be checked.
- **`heart-tube-formation` puts the septum transversum at the caudal edge of the pericardial cavity
  in the flat disc.** It is cranial before folding; that is the whole point of the head fold, and
  `cranio-caudal-folding` calls the correct order "the only thing you have to memorise here".
- **The primordial germ cells appear in week 4 in one scene and week 3 in another.** Both figures are
  in the textbooks; the corpus should pick one and record the dispute in `gaps[]`, as it does
  elsewhere.
- **`neurulation` shows a finished solid notochord under a day-18 neural plate.** The notochord scene
  says the rod is complete about day 20 and warns in as many words that students who learn it as a
  solid rod from the start cannot explain the next three stages.
- **The pentalogy of Cantrell is given three ways in three scenes**, and the heart-tube version lists
  four of the five components.
- **`cranio-caudal-folding`** lists five items in one place and four in two others, and its `gaps[]`
  tells the illustrator to number "the four items identically in both panels" when the after-panel
  names three.

## 5 · The curriculum hole

**Aortic arch artery remodelling has no entry anywhere in `CURRICULUM.json`.** Verified against all
207 structures. Run 49 raised it but described the consequence wrongly — the left recurrent laryngeal
nerve's hook *is* explained, in `pharyngeal-arches`, three runs earlier. What is actually orphaned is
everything downstream of that one-line derivative list: the six pairs as one plan, the fate table by
side, the seventh intersegmental arteries and the dorsal aortae, the asymmetric regression that makes
the recurrent laryngeal asymmetry a consequence rather than a coincidence, and the lesions that
currently have nowhere to live — coarctation pre- and post-ductal, interrupted arch type B (named as
a 22q11 finding in two scenes with no scene able to say what it means), right-sided arch, double arch
and the vascular rings, aberrant right subclavian and dysphagia lusoria, and the anatomical origin of
a patent ductus.

Add to `courses.embryology`, topic `Cardiovascular Development`, as the **third** structure — after
`Septation of heart`, before `Fetal circulation`. The position is load-bearing: septation hands over
at the division of the truncus, which is where remodelling starts, and fetal circulation needs the
ductus to already exist as a left sixth arch derivative when it uses it as shunt three.

```json
{
  "name": "Aortic arch arteries & great vessel remodelling",
  "views": ["vasculature", "mechanism"],
  "note": "six pairs; selective regression; adult derivatives; coarctation, vascular rings, aberrant subclavian",
  "preferred_modes": ["sequence", "diagram", "3d_anatomy"]
}
```

Bookkeeping: `meta.totals.embryology` 46 → 47, `meta.totals.all` 207 → 208.

## 6 · Meshes — the delivery problem, not a catalog problem

`mesh-gaps.txt` lists the model ids the corpus references and nobody has downloaded. Seven scenes had
none of theirs and are now held at `candidate` by the delivery gate; forty-five more draw with holes.
Nothing in this repo can close it — the mirror is unreachable from the scheduled task, the desktop
workspace and the cloud container alike — so it is a human step in a terminal: fetch, decimate,
upload, verify. The section-1 additions above will add roughly thirty more ids to that list, so do
them before the fetch, not after.

## 7 · Genuinely absent, and asked for many times

Every one of these was re-verified against the catalog during this audit. They are real, and no
amount of re-searching will change them.

- **Nerves.** 934 models contain exactly two, both optic. Every nerve in the corpus is a narrated
  concept path. Asked for in thirty-seven consecutive runs.
- **Veins below the external iliac**, and **arteries below the iliac trunks**.
- **Lymph nodes and lymphatics** — nothing at all, so no lymphatic curriculum entry can ever be claimed.
- **Serous membranes** — pleura, pericardium, peritoneum. Three authored scenes wait on this alone.
- **A female pelvis set** — uterus, tube, ovary, vagina, cervix, broad ligament. Holds back four scenes
  and is why `internal-reproductive-organs` cannot close a curriculum entry that names both sexes.
- **Caecum and colon.** The three taeniae are all that exist.
- **Bile duct, portal vein, pancreas gland, hepatic veins** — four consecutive scenes teach around them.
- **The four heart chambers** — `tools/ingest-full-archive.mjs --fetch` on FMA7096, FMA7097, FMA7098,
  FMA7101, FMA7236, FMA7133. Called "the cheapest win on the list" in three separate runs; the script
  is already written and has never been run.
- **The anterior interventricular artery (the LAD).** Added 2026-08-29. Searched under anterior
  interventricular, interventricular, descending, anterior descending, paraconal and marginal: the catalog
  holds only `set of interventricular septal branches` FMA71669/FMA71670, which are intramural and not the
  groove vessel. The commonest infarct territory in medicine has no artery drawn anywhere in the corpus.
  `gross__heart-pericardium__heart` now uses the great cardiac vein as an explicit stand-in for the groove
  and says so in narration. Highest-value cardiac mesh after the four chambers.
- Ligaments beyond the inguinal and long plantar; fascia and retinacula beyond the wrist flexor
  retinaculum; renal internal architecture; the branches of the internal iliac artery.

## 8 · Things nobody has signed

**Roughly a hundred landmark anchors across the corpus sit at `status: "needs-review"`, and a number
of them are on scenes that are `ready` and live.** The rule is that an authored anchor stays unsigned
until a human clears it in-app. Nobody ever has. The `typical-vertebra` scene ships thirteen unsigned
anchors to students today and says so in its own `gaps[]`.

## 9 · Tooling

- **`CAPABILITIES.svg` is `{ native: [], degraded: [] }`.** Every op in every diagram or sequence
  scene therefore warns "unknown to the svg adapter" — 1209 warnings across the corpus, which is
  precisely the volume that trains people to stop reading warnings. Raised in a dozen consecutive runs.
- DONE (2026-09-08) **No beat-ordinal check** in the validator (see §3). *Written 2026-09-08 as a WARNING; corpus-wide result is ZERO warnings, so the earlier renumberings held.* *Confirmed beyond Back & Vertebral Column on
  2026-08-29: `gross__heart-pericardium__heart` had views numbered 1, 2, (none), 3, (none) and had been
  reported clean by every run since it was authored. Renumbered. Assume other scenes are affected.*
- **No curriculum-view-coverage check** in the validator (see §2). *This is now the second and third scene
  found missing a required view — `abdominal-aorta-ivc` had no `associated_organs` beat at all on
  2026-08-29, on a `ready` scene. Three misses across two audits is enough: this three-line comparison is
  the highest-value validator change on the list.*
- **`DEMAND.json` has never been built.** `tools/build-demand.mjs` exists and has never been run, so
  the demand-priority branch of the authoring task has never once executed. An untested branch in a
  scheduled task is a branch that will surprise someone.
- **Run 32 is undocumented.** `spleen.json` and `portal-venous-system.json` exist and validate; no run
  block records authoring them.

- **NEW (2026-09-10) — ten catalog entries have `"name": null`, and the validator's existence stage
  will pass an id that the name check then cannot check.** `available-meshes.json` holds 934 entries;
  only 924 have a name string. The ten are `FMA14543nsn`, `FMA19617nsn`, `FMA3840nsn`, `FMA3862nsn`,
  `FMA3932nsn`, `FMA59815nsn`, `FMA61993nsn`, `FMA62008nsn`, `FMA7198nsn`, `FMA9352nsn` — all with the
  `nsn` suffix, all nameless, and **none referenced by any scene today** (grepped, 2026-09-10). So this
  is a trap, not a live defect: audit check 2 says compare the structure's `name` to the catalog's
  `name` character for character, and for these ten there is nothing to compare against. Any future run
  that picks one gets an id which clears the existence stage and is unverifiable by name — the exact
  shape of error checks 1–3 exist to catch. Fix is either to give them names or to have
  `validate-scenes.mjs` reject a ref to a nameless catalog entry outright.

- **NEW (2026-09-02 audit) — a CROSS_SECTION axis can contradict the plane its own narration names,
  and nothing checks it.** `neuroanatomy__cerebellum__deep-cerebellar-nuclei` beat 1 narrated a
  CORONAL cut with `axis:"z"`; fixed to `y` at audit. The convention across this course is
  y = coronal, z = axial/transverse (`ventricles`, `basal-ganglia`, `thalamus` all use y for coronal;
  `pons`, `white-matter-tracts` use z for axial), and z is the vertical axis of these meshes.
  **Still open: `gross__kidney-posterior-abdominal-wall__kidney` narrates "coronal" with `axis:"z"`.**
  Left unfixed deliberately — that scene is signed, was outside the audit's two, and the convention is
  inferred from siblings rather than written down. Two jobs here: (a) write the axis convention into
  `model3d-scene-spec-v2.md` so it is evidence rather than a pattern, then (b) fix the kidney scene and
  add a validator check comparing a CROSS_SECTION axis to any plane word in the beat's narration.

  **DONE 2026-09-09 — both jobs, and the kidney was not the only offender.** (a) The convention is now
  written into `model3d-scene-spec-v2.md` under "`CROSS_SECTION.axis` — the anatomical plane convention",
  and it is stated as EVIDENCE rather than a pattern: `axis` is the normal of the cut plane, and the LPS
  orientation (+X left, +Y posterior, +Z superior) is printed in the `calibrated_by` of every anchor
  `derive-landmark.mjs` has emitted — so sagittal=x, coronal=y, axial/transverse=z. That is a fact about
  the meshes, not an inference from sibling scenes, which is what the 2026-09-02 note was waiting for.
  (b) The check is written (warning, 3d_anatomy scenes only, with a blocklist for "transverse process",
  "median sulcus", "frontal lobe", "sagittal sinus" and "the widest diameter is transverse", each of
  which it flagged before the blocklist and none of which is a cut plane). Corpus-wide it fires **four**
  times and all four are real:
  - `gross__kidney-posterior-abdominal-wall__kidney` beat 3 — narrates coronal, cut `z`. The known one.
  - `gross__leg-foot__popliteal-fossa` beat 6 — "a transverse section through the fossa", cut `y`.
  - `gross__liver-biliary-tract-pancreas-spleen__liver` beat 7 — "any axial liver image", cut `y`.
  - `gross__liver-biliary-tract-pancreas-spleen__pancreas` beat 5 — the transpyloric plane, cut `y`.
  All four fixed and stamped `corrected_at`. **The finding worth carrying is that three of the four were
  outside Neuroanatomy and outside the scene the 2026-09-02 note named.** That note assumed the kidney was
  a straggler; it was a sample. Three signed gross scenes had been showing a student a cut at ninety
  degrees to the one the voice was describing, on beats whose entire teaching point is reading a slice,
  and every run since 2026-08-29 reported them clean — because the check did not exist, exactly as the
  note said. This is now the third of the three one-line comparisons (beat ordinals, isolate-region reach,
  section axes) to be written, and the second of the three to find live defects the moment it ran.

- DONE in part (2026-09-08: job (a), the validator warning, is WRITTEN — scoped to beats that isolate a
  GROUP and to HIGHLIGHT/TRACE/COMPARE only; it surfaces 157 warnings corpus-wide, which is job (b), the
  sweep, now reduced to a printed queue nobody has walked yet. A second live instance was found by hand the
  same day in `neuroanatomy__brainstem__pons` beat 4 and fixed.)
- **NEW (2026-09-03 audit) — a third class of defect that passes all eight validator stages: an op
  that reaches out of its own beat's `ISOLATE_REGION`.** `ISOLATE_REGION` ghosts everything outside
  its group, while `TRACE_STRUCTURE` and `SHOW_RELATIONSHIP` light whatever they name. The validator
  checks only that a target RESOLVES, so an op naming a structure in a ghosted group is accepted
  silently. It is legal and sometimes right — `cerebellar-function` beat 2 draws a connector to the
  `signs` card and that connector is the beat's whole argument — but in beat 1 of the same scene a
  `TRACE_STRUCTURE` ended on `signs`, which beat 1 ghosts and never mentions, so the trace walked the
  student into a card for no stated reason. Trimmed at audit. Two jobs: (a) a validator WARNING (not
  a rejection) whenever an op target sits outside the beat's isolated group, and (b) a sweep of the
  corpus for the same pattern, since nothing has ever looked for it. This is now the third such class
  after beat ordinals and section axes, and all three are one-line comparisons the validator does not
  make.

- **NEW (2026-09-04 audit) — THE AUTHOR CURSOR NOW POINTS AT HISTOLOGY, WHICH IS SVG-BLOCKED EXACTLY
  AS EMBRYOLOGY IS. A HUMAN DECISION IS NEEDED BEFORE THE NEXT RUN.** `Fornix & Papez circuit` was
  authored on 2026-09-04 and was the 34th of 34 Neuroanatomy structures, so the course is fully
  authored and `sync-state.mjs` rolled the cursor on to `histology / Epithelium / Simple epithelia`.
  Every Histology structure's `preferred_modes` are `["microscopic","diagram"]` — verified in
  `CURRICULUM.json` this run, not remembered — and **both route to the SVG engine, neither is
  `3d_anatomy`**. Since `CAPABILITIES.svg` is still `{ native: [], degraded: [] }` (§9 above),
  authoring Histology produces scenes as undrawable as the 28 idle Embryology ones. This is the
  2026-08-30 failure one course to the right. Three options, in the run's order of value: (a) build
  `CAPABILITIES.svg` and commission artwork — unblocks 46 histology AND 28 embryology scenes at once;
  (b) mark `histology` `suspended` in `CURRICULUM.json` so both cursors skip it and the task idles
  honestly; (c) declare authoring finished and re-point the task at audit and repair, which still
  hold real work (14 unsigned Neuroanatomy scenes, ~100 anchors at `needs-review`, §3 and §9 items,
  three one-line validator checks). The audit cursor has 14 scenes left either way, so the next run
  is not idle — but it must author nothing.

- **NEW (2026-09-04 audit) — failure mode 1 recurred INSIDE a `gaps[]` note that congratulates the
  run for catching failure mode 1.** `limbic-system__amygdala` correctly caught the stria terminalis
  (searching `stria` after `amygdalofugal` returned nothing) and wrote that catch up as gaps[0] — then
  two entries below declared "NO HYPOTHALAMUS IN THIS CATALOG", specifically that `tuber` "returns
  NOTHING". It returns `FMA62327 tuber cinereum`, in the catalog and on disk. Beat 3's whole yield is
  "the destination is the HYPOTHALAMUS" and the trace was ending on the **thalamus** while saying so.
  Corrected at audit the same day; both notes deliberately left side by side in the file. **The
  general lesson, which is new and belongs at the top of this document's list of habits: catching the
  habit once in a run is not evidence of having avoided it elsewhere in the same run**, and a
  self-congratulating gaps[] entry should raise suspicion of the rest of the array rather than
  lowering it. Corroboration was available in two places and neither was checked — the sibling scene
  written the same hour names the tuber cinereum as real, and `hypothalamus-pituitary`, cited by the
  bad note as "record[ing] the same absence", actually *draws* FMA62327.

- **NEW (2026-09-02) — the AUTHOR-TASK prompt's Neuroanatomy coverage table is itself a remembered
  list and has at least one error.** It marks Spinal Cord DEAD as "no cord, no tract of any kind".
  No cord and no tract is correct; but `FMA78497 central canal of spinal cord` exists and has been in
  use in `gross__back-vertebral-column__spinal-cord-in-vertebral-canal` for weeks. The routing
  consequence is nil (that model is the upper 34 mm only), but the prompt line should be corrected, and
  the general point is the one this file already makes: the table is a starting point, never evidence.


- **NEW (2026-09-08 audit) — the stale "not in meshes-lite/" sentence is alive in NEUROANATOMY, and it
  cost two finished scenes nine days of invisibility.** `cerebrum-gross-lobes__white-matter-tracts` (25
  models) and `cerebrum-gross-lobes__cerebral-hemispheres-lobes` (38 models) each carried a gaps[] entry
  saying not one of their meshes had been fetched and that every beat was hollow. Every mesh of both was
  on disk. Both sat at `candidate` on that ground alone; both are `ready` today. It also suppressed
  landmark work: the genu and splenium of the corpus callosum were measurable the whole time and were
  derived at this audit. **Proposed fix, and it is mechanical rather than cultural:** `sync-state.mjs`
  already computes which model ids are present in `meshes-lite/`; the validator should REJECT (or at
  minimum warn on) any `gaps[]` string asserting a model is absent from the local set when it is not.
  Fourth one-line validator check on the §9 list, and the only one that closes a habit rather than a
  defect class.
- **NEW (2026-09-08 audit) — a CROSS_SECTION axis can contradict the beat's CAMERA rather than its
  words.** `cerebral-hemispheres-lobes` beat 10 cut on `axis:"z"` and then rotated to `anterior`; you see
  a cut face from the front only if the plane is coronal (`y`). The narration said merely "cut across",
  so the axis-versus-narration check proposed on 2026-09-02 would NOT have caught it. Extend the
  proposed check to compare the axis against any `ROTATE_TO_VIEW` in the same beat. Fixed at audit; axis
  frame measured from mesh centroids (x left+/right−, y anterior−/posterior+, z vertical) rather than
  inferred from sibling scenes, and that convention still is not written into
  `model3d-scene-spec-v2.md` — job (a) from the 2026-09-02 entry remains open.
- **NEW (2026-09-08 audit) — HIGHLIGHT_STRUCTURE accepts a GROUP name and nothing objects.**
  `cerebral-hemispheres-lobes` beat 7 highlighted `"Insula"`, the group, not `ins_l`/`ins_r`. The op pins
  a label, so the label was indeterminate. Fixed there; the corpus has never been swept for the pattern.

---

## 2026-09-08 — verification pass, no cursor work available

`sync-state.mjs` reports `next to author: nothing — the curriculum is covered`, and all 34 Neuroanatomy
scenes carry `provenance.audited_at`. There was no authoring slot and no unaudited scene, so this run
spent itself on section 3 and on the stale-claim sweep the task mandates.

**Four section-3 items were already fixed by later runs and had never been ticked.** That is the same
failure this file exists to name, one level up: the backlog itself became a stale note, and a run
following it would have re-done finished work. Ticked above with the evidence.

**Stale-delivery-claim sweep, corpus-wide.** Every `gaps[]` entry in all 142 scenes was matched for an
absence assertion and every FMA id it names was stat'd against `meshes-lite/` (494 files). 69 entries
name an id that is on disk; each was read, and in every case the on-disk id is the *stand-in*, not the
thing claimed absent. **No new stale delivery claim was found.** The six scenes held at `candidate`
whose models are 100% on disk are held for a real reason, and all three of the load-bearing absence
claims were re-searched in `available-meshes.json` under multiple spellings and confirmed:

| claim | spellings searched | result |
|---|---|---|
| no caecum or colon (`large-intestine`) | caecum, cecum, colon, sigmoid, appendix, rectum | TRUE — catalog holds only `appendix` FMA14542 and `rectum` FMA14544 |
| no pancreas (`pancreas`) | pancreas, pancrea* | TRUE — only `pancreatic duct` FMA10419 |
| no biliary tree (`biliary-tree-gallbladder`) | bile, biliary, choledoch, cystic duct, hepatic duct | TRUE — nothing |
| no spinal cord (`spinal-cord-in-vertebral-canal`) | spinal cord, medulla spinalis, cord | TRUE — only `central canal of spinal cord` FMA78497 |

These four holds are correct and should not be re-litigated; they are mesh-ingestion work, not authoring
work. What is still open in section 3 is listed above it.

## 2026-09-08 (later run) — curriculum-view coverage checked corpus-wide for the first time

§9 lists "No curriculum-view-coverage check in the validator" as open, and notes it as "the second and
third scene" found missing a required mode. That check has now been run by hand over all 142 scenes
against all 206 curriculum entries carrying a `views` field.

- **One gap, already closed.** `back-vertebral-column__spinal-cord-in-vertebral-canal` lacks
  `vasculature`; that is §2 item 1, unauthorable, gap note present and re-verified. **There is no second
  or third scene.** Do not spend a run looking for one.
- **`covers[]` spelling: zero entries matching nothing**, 142 scenes.
- **ids: zero fabrications**; **names: zero mismatches** against the 934-entry catalog.

The validator check is still worth writing — this pass proves it would pass today, not that it will
after the next authoring run. §9's tooling item stays open.

## 2026-09-09 — the §9 "157-warning isolate/highlight queue" is NOT a defect queue

The previous run left this as "real work a run can do while the cursors are dry". It has now been walked
mechanically over all 142 scenes and the result is a **negative** one, which is worth more than a partial
walk: the warning class does not describe a rendering defect, and no scene should be edited for it.

The queue narrows to **70 out-of-isolate op targets in `3d_anatomy` scenes**, in two classes:

- **CLASS A — 24 targets in 8 scenes.** The target is a measured landmark ANCHOR whose parent structure IS
  inside the isolated group, but the anchor's own `group` is a separate `Landmarks` / `Surfaces & landmarks`
  / `Parts of the ulna` bucket, so it falls outside the `ISOLATE_REGION` target and the validator warns.
  Scenes: `flat-abdominal-muscles`, `rectus-abdominis`, `radius-ulna`, `hip-joint`, `ankle-joint`,
  `popliteal-fossa`, `great-vessels`, `lungs`. All eight are signed.
- **CLASS B — 46 targets.** The target's parent is genuinely outside the isolate (a neighbouring column, a
  vessel, a bone in another group).

**Neither class is broken, and the reason is in the spec, not in the scenes.** `model3d-scene-spec-v2.md`
line 120 defines `ISOLATE_REGION` as "show only this; **ghost** everything else" — ghosted, not hidden. A
subsequent `HIGHLIGHT_STRUCTURE` / `COMPARE_STRUCTURES` / `TRACE_STRUCTURE` on a ghosted structure lights
it; in Class A the anchor's parent is lit at full opacity underneath it as well. The warning's own wording
is honest about this — "legal, but check the narration asks for them" — and it is a **narration-relevance
prompt, not a visibility bug**. It cannot be discharged mechanically at all, which is what made it look
like a 157-item queue.

**Recommendation: retire the queue as an item and keep the warning.** What is left is one small optional
tidy with no student-visible effect — Class A's anchors could be grouped with their parents so the warning
stops firing on them and the remaining 46 stand out — and that is a cosmetic change to eight signed scenes,
so it is a human's call and not this task's. Do NOT let a later run read "157 warnings" as 157 defects.

---

## Found 2026-09-10 by the `engine__refit-camera-on-isolate` round-2 build run

Both of these were found by measuring the corpus in the real player, not by reading it. Neither was
fixed in that run: the first is a different file from the item under rework, and the second is 21 scene
edits. Both are cheap to reproduce — the commands are given.

### A · `ISOLATE_REGION` ghosts its own subject — ENGINE, `viz3d.js`, `paint()`

`paint()` gives full opacity only to what is selected or carries an entry in `state.hi`:

```js
var ghosting = (ghost && anySel) || state.ghosted;
m.material.opacity = (isSel || isHi) ? baseOp : (ghosting ? Math.min(0.10, baseOp) : baseOp);
```

`COMPARE_STRUCTURES` sets `state.hi` on its targets. `ISOLATE_REGION`, eleven lines above it in
`runOps`, sets `state.only` and `state.ghosted` and **never sets `state.hi`**. So on an isolating view
with no separate `HIGHLIGHT_STRUCTURE`, the structure the view isolates is drawn at 10% opacity along
with everything it was isolated from. The isolate changes nothing a student can see.

**Measured on 9 of 94 views across the 11 scenes that run loaded** — the count over all 142 will be
larger. `neuroanatomy__cerebrum-gross-lobes__cerebral-hemispheres-lobes` v3 *Frontal lobe*, v4
*Parietal lobe*, v6 *Occipital lobe*; `gross__back-vertebral-column__intervertebral-disc` v3, v5, v7;
`gross__back-vertebral-column__vertebral-column` v6; `gross__forearm-hand__carpal-tunnel` v6;
`gross__heart-pericardium__heart` v1. The three lobe views are the clearest: the entire point is to show
one lobe, and the lobe is at the same 10% as the rest of the brain.

`viz-training/tools/measure-view-framing.mjs --all` names these as `engineDefectsNotThisItem` and does
not fail the build on them, so it stays usable as a framing gate until this is done.

**Why it matters beyond the picture:** every one of those 9 views also reports a framing failure, and
that is probably downstream — with no opaque subject, the measurement falls back to the whole visible
set and the fill numbers describe the ghosted context rather than the subject. **Fix this before
concluding anything about those 9 framing numbers.** Whoever takes it should re-run the gate afterwards
and expect the framing failure count to fall on its own.

Likely fix is one clause — exempt `state.only` from ghosting rather than setting `hi`, since `hi` also
drives the emissive glow and would light the subject up as well as un-fade it. It needs its own build
and its own review looking at the pictures; it changes the appearance of a large fraction of the corpus,
which is exactly the kind of change a builder should not slip into a rework item.

### B · 21 views peel away their own subject — SCENES

A view isolates something and then runs `PEEL_LAYER` on the layer that thing lives in, so the picture
the student is shown does not contain the structure the narration is about.
`gross__kidney-posterior-abdominal-wall__kidney` v3 *"Coverings, then cortex to pelvis"* peels layer
`organ`, which is where the kidneys are.

Until 2026-09-10 this was invisible: `subjectBox()` returned `null` for such a view and `frameView`
bailed out, so the student got the PREVIOUS view's camera over this view's geometry and every check
passed. The framing fallback added that day frames what is actually drawn, which is what made these
findable.

Found by this, over `viz-training/scenes/`, in 58 scenes — rerun it over all 142:

```
for each view with a PEEL_LAYER: collect the structures its ISOLATE_REGION / COMPARE_STRUCTURES
single out; flag the view if EVERY one of them has a `layer` the view peels.
```

| `embryology__cardiovascular-development__heart-tube-formation` | v3 | Cut the tube across | peels `organ`, which is where all 2 isolated structure(s) live |
| `embryology__cardiovascular-development__septation-of-heart` | v5 | One spiral wall, three famous failures | peels `organ`, which is where all 5 isolated structure(s) live |
| `embryology__folding-of-the-embryo__cranio-caudal-folding` | v6 | When a fold does not finish | peels `organ`, which is where all 3 isolated structure(s) live |
| `embryology__folding-of-the-embryo__lateral-folding` | v6 | The rest of the ventral wall, and a duct that lingers | peels `organ`, which is where all 4 isolated structure(s) live |
| `embryology__gametogenesis-fertilization__blastocyst` | v5 | Hatching must come first | peels `organ`, which is where all 3 isolated structure(s) live |
| `embryology__gametogenesis-fertilization__cleavage-morula` | v6 | What the zona is for | peels `organ`, which is where all 3 isolated structure(s) live |
| `embryology__gametogenesis-fertilization__fertilization` | v4 | The acrosome reaction and fusion | peels `organ`, which is where all 2 isolated structure(s) live |
| `embryology__gametogenesis-fertilization__spermatogenesis-oogenesis` | v4 | Spermiogenesis — remodelling, not division | peels `organ`, which is where all 6 isolated structure(s) live |
| `embryology__pharyngeal-apparatus__pharyngeal-clefts-membranes` | v5 | When the cervical sinus does not close | peels `organ`, which is where all 6 isolated structure(s) live |
| `embryology__pharyngeal-apparatus__pharyngeal-pouches` | v5 | When the pouches do not form | peels `organ`, which is where all 3 isolated structure(s) live |
| `embryology__pharyngeal-apparatus__thyroid-gland-development` | v5 | Descent gone wrong, and the baby who looks well | peels `organ`, which is where all 7 isolated structure(s) live |
| `embryology__respiratory-system-development__bronchial-tree-branching` | v3 | Mesenchyme instructs, endoderm obeys | peels `organ`, which is where all 5 isolated structure(s) live |
| `embryology__respiratory-system-development__tracheoesophageal-septum` | v5 | The rare end, and why it belongs to the same story | peels `organ`, which is where all 5 isolated structure(s) live |
| `embryology__week-3-gastrulation__neurulation-neural-plate-tube` | v8 | Finding them, and preventing them | peels `organ`, which is where all 2 isolated structure(s) live |
| `embryology__week-3-gastrulation__notochord` | v7 | What is left of it when you are grown | peels `organ`, which is where all 1 isolated structure(s) live |
| `embryology__week-3-gastrulation__trilaminar-disc-3-germ-layers` | v7 | Where the disc stays two layers thick | peels `organ`, which is where all 2 isolated structure(s) live |
| `embryology__weeks-1-2-implantation-bilaminar-disc__amniotic-cavity-yolk-sac` | v4 | The amnion grows until there is nowhere left to grow | peels `organ`, which is where all 4 isolated structure(s) live |
| `embryology__weeks-1-2-implantation-bilaminar-disc__bilaminar-embryonic-disc` | v4 | A new tissue fills the gap, then splits | peels `organ`, which is where all 4 isolated structure(s) live |
| `embryology__weeks-1-2-implantation-bilaminar-disc__chorion-placenta-early` | v8 | The layers between the two bloods | peels `organ`, which is where all 3 isolated structure(s) live |
| `embryology__weeks-1-2-implantation-bilaminar-disc__implantation` | v6 | Buried, plugged, and healed over | peels `organ`, which is where all 2 isolated structure(s) live |
| `gross__kidney-posterior-abdominal-wall__kidney` | v3 | Coverings, then cortex to pelvis | peels `organ`, which is where all 2 isolated structure(s) live |
Twenty of the twenty-one are embryology scenes converted from SEQUENCE panels, and all twenty peel
`organ` — which suggests one conversion habit rather than twenty independent mistakes, and that the fix
is probably one decision applied twenty times. The kidney one is a hand-authored gross scene and may
need its own answer.

**Do not fix these by changing the framing.** The picture is wrong before the camera is involved.

## 2026-09-30 · render-kit winds its ANNULAR END CAPS and CUTAWAY RIMS against their own normals

**Found by** the model3d BUILD run on `embryology__folding-of-the-embryo__cranio-caudal-folding`.
**Reproduced with no model in it:** `viz-training/tools/probe-kit-rim-winding.mjs`, checked in with this
entry. **NOT FIXED — it needs its own queue item.** `render-kit.js` is under every procedural model in
the corpus and changing it changes all of them at once.

### What the probe measures

Not a ray cast. It builds a *straight* thick-walled `sweptShell` — no curvature, no model, no options —
and for every triangle compares the geometric normal `(b-a) x (c-a)` against the normals render-kit
itself supplied for those three vertices. Disagreement is attributable to the code that wrote that span
of the buffer and to nothing else.

```
render-kit.js, thick-walled sweptShell, straight tube, ring=24, rows=25
  outer surface      0 / 1152 wound against their own normals
  inner surface      0 / 1152
  ANNULAR END CAPS   48 / 96
  with a cutaway window (dir +z, half 0.9 rad, rows 6..18):
  outer surface      0 / 960
  inner+caps+RIM     86 / 1132   (plain shell, no rim: 48 / 1248)
```

**48 of 96 — exactly half.** That is the signature of one of the two branches of `cap(k, sign)` being
backwards: `sign > 0` emits `quadFlip` and `sign < 0` emits `quad`, and one of the two is reversed. The
cutaway rim adds a further 38 over the same shell without a window.

### Why it has been invisible

The same reasons RENDER-STANDARD 2.4b records for the case it did fix: the caps and rims sit inside the
hull count so nothing inflates them into a silhouette, the materials are `DoubleSide`, and the shading
is right because the normals were supplied. 2.4b fixed the SOLID path — `triN`, `domeCap` — and left the
thick-walled path, which is every body wall, every gut tube, every vessel with an inner surface and
every opened sac in the corpus.

### How it shows

Ray-cast first hits that face AWAY from the camera wherever a cut end or a window rim is exposed. On
cranio-caudal-folding: 18 on the truncated trunk of the caudal-regression variant, 3 on the tail fold's
caudal tip, 2-3 on the pericardial sac's window. **Zero on any outer surface.** That item's render tool
attributes every back-facing first hit to hull vs non-hull and pins the non-hull ones rather than
hiding them.

### The claim this confirms, and the one it does not

A build note on that same queue item asserted this on 2026-09-11 and cited a probe at
`viz-training/tools/probe-kit-winding.mjs`. That build was **voided** on 2026-09-20 — nothing it
described was ever written — and the probe it cited **has never existed**; checked again today. The
assertion sat in the queue for nineteen days with nothing behind it. It turns out to have been right
about the cap and the rim. It remains true that nothing in that note was checkable, and the file above
exists so that this one is.

---

## 2026-10-01 · `meshes-hi/` IS NOT A SECOND TIER — IT IS A BYTE-FOR-BYTE COPY OF `meshes-lite/`

Raised by the 2026-09-30 review of `gross__back-vertebral-column__coccyx` as finding 4: "meshes-hi/
holds only the fused FMA16202, not the derived pair … a 404 on both the sacrum and the coccyx the day
a second tier is published." The 404 is real. The premise under it is not, and the difference changes
what should be done.

Measured today, in this container, on files staged from the repo:

```
md5                               file                                  triangles
a04e4d845d2e1e5e39df91fd13feb29f  meshes-hi/FMA16202.stl                   20,000
a04e4d845d2e1e5e39df91fd13feb29f  meshes-lite/FMA16202.stl                 20,000   <- IDENTICAL
6ab6f52119ae719e07c97d32e2433940  meshes-lite/FMA16202-sacrum.stl          20,000
10916fb4a8feb4473203532a2350856c  meshes-lite/FMA16202-coccyx.stl           5,322
8f2bf097b75054c9ee572837d3c57756  meshes/FMA16202-sacrum.stl               39,418
10916fb4a8feb4473203532a2350856c  meshes/FMA16202-coccyx.stl                5,322   <- IDENTICAL to lite
```

`meshes-hi/FMA16202.stl` and `meshes-lite/FMA16202.stl` are the same 20,000 triangles with the same
md5. `meshes-hi/` holds 49 files — exactly the vertebral-column scene's mesh set — and nothing in it
is higher resolution than the lite tier. So it is not a partially-built `full` tier; it is a partial
COPY of the lite one, under a name that says the opposite.

Three consequences, none of which the original finding could see:

1. **Publishing `meshes-hi/` as `MESH_TIERS.full` would do nothing at all** except 404 on the two
   derived ids. Every file it holds is already what `lite` serves. A tier that returns identical bytes
   is a tier that costs a second upload and buys no pixels.
2. **For this bone the budget inverts the tiers.** `decimate-meshes.mjs --target 20000` caps the full
   tier at 20,000 triangles, and `meshes/FMA16202-sacrum.stl` — the source — is 39,418. So a genuinely
   regenerated `full` tier would hand the sacrum (role `part` → `full`) FEWER triangles than a
   `context` structure gets from `meshes/`. That is worth knowing before anyone regenerates.
3. The names mislead. `config.js` describes the full tier as living at `viz-training/meshes-part`
   (`--out viz-training/meshes-part`), and no such directory exists. `meshes-hi` is not that
   directory and is not what the comment describes.

**Done today, and it is first aid rather than a fix:** `meshes-lite/FMA16202-sacrum.stl` and
`meshes-lite/FMA16202-coccyx.stl` were copied into `meshes-hi/` unchanged. That makes `meshes-hi/`
internally consistent — every file in it is now a copy of the corresponding lite file, which is what
the other 49 already were — and removes the latent 404. It does NOT make it a full tier and must not
be read as doing so.

**Still open, and it needs a human or its own item:** is `meshes-hi/` meant to be deleted as a
duplicate, renamed to `meshes-part`, or regenerated at a budget that is actually above lite? Nobody
should publish `MESH_TIERS` until that is answered, and the answer is not a builder's to give.

---

## 2026-10-01 · `walk-scene-in-player.mjs` REPORTED ANIMATION AS GEOMETRY ON ANY TRACED BEAT

Found while using the tool on mesh scenes for the first time (see BUILD-LOG, same date). **Fixed in
the same run**; recorded here because the numbers it produced are already quotable in two walk
outputs and because the shape of the mistake generalises.

Every per-structure `share` the tool reports is a difference between two renders taken about a second
apart: the beat as composed, then the beat with one structure's `visible` set to false. That is a
measurement of the structure only if nothing else moved in between. On a beat running
`TRACE_STRUCTURE`, something always does — `trace()` re-ghosts the whole scene at every waypoint, so
the blend over most of the frame is still changing while the shares are being taken.

What it produced, measured:

- `gross__pelvis-perineum__bony-pelvis` beat 2 (`TRACE_STRUCTURE`, duration 7): **nine structures each
  reported ~97.3% of subject**, among them `bladder` and `rectum` — which that beat explicitly hides.
- `gross__pelvis-perineum__pelvic-diaphragm-levator-ani` beat 4 (`TRACE_STRUCTURE`, duration 6): the
  coccyx reported **49.5% of frame**, while the same beat rendered in two separate runs, once with the
  coccyx in the scene and once without it, differed by **0.783% of pixels**, peak delta 31.
- Non-traced beats in the same two scenes were reproducible **to the pixel** across separate runs:
  0.000% changed, peak delta 0. So the instability is specific, not ambient.

**The fix is a measurement, not a special case for `TRACE_STRUCTURE`.** The tool now renders the same
state twice and counts what moved (`selfDriftPx`, `selfDriftOfLit`). Above 1% of the lit subject it
prints `SHARES SUPPRESSED (frame not still)` and reports no share for that beat. Framing, clipping,
the subject span and the screenshots are all still produced, because none of them depends on two
renders agreeing. Written as a drift measurement so it also catches anything else that animates,
rather than only the one cause that was found.

**The general shape, which is the part worth keeping:** a difference-of-two-renders metric is only
valid on a still frame, and nothing in this corpus was checking that the frame was still. Any other
harness that diffs two renders should be assumed to have the same hole until it is shown not to.

---

## engine · `trace()` REPLACES the highlight state instead of merging into it — so a traced view can hold no other op's lighting

Filed 2026-10-01 by the model3d BUILD task, while taking review round 1's finding 1 on
`embryology__folding-of-the-embryo__cranio-caudal-folding`. **Not fixed here, deliberately:**
`viz3d.js` is under every model in this corpus, and a build session has been live in this repo during
each of the last two runs. This needs its own `engine__` item.

`trace(o)` in `viz3d.js` opens every waypoint with

```js
state.hi = {}; state.hi[k] = 0.85;
state.only = subject ? [k, subject] : [k];
state.ghosted = true;
```

so whatever any earlier op in the same view put in `state.hi` or `state.only` is gone the moment the
first waypoint lights. `COMPARE_STRUCTURES` sets `state.only` to its targets and `state.hi[k] = 0.5`
on each of them; a view running both ops therefore cannot draw its comparison, whatever order they
are written in. **Measured in the real player, not reasoned about** — `viz-training/tools/probe-beat3-compare.mjs`,
written in the same run, mounts the scene through `MB3D.mountScene`, clicks the chip a student clicks
and samples `material.opacity`:

| beat 3 as round 1 reviewed it | 0.5s | 1.5s | 3s | 5s | 7s | 9s | 12s | 16s |
|---|---|---|---|---|---|---|---|---|
| `head_order_before` | 1.00 | 1.00 | 1.00 | 1.00 | 1.00 | 1.00 | 1.00 | 1.00 |
| `head_order_after` | 0.10 | 0.10 | 0.10 | 0.10 | 0.10 | 0.10 | 0.10 | 0.10 |

0.10 is the ghost floor — the same value the discarded context sits at. The scene was repaired by
splitting the beat in two (RENDER-STANDARD §3.y), which is the right repair at the SCENE level and
does nothing for the next author who writes the same pair of ops.

**Second consequence of the same `traced` flag, and the sharper one.** `applyView()` computes
`var traced = ops.some(TRACE_STRUCTURE)` and calls `frameView(700)` only `if (!traced)`, so no traced
beat in the corpus gets a per-view camera fit. Measured on this scene with the repo's own gate,
`viz-training/tools/measure-view-framing.mjs`, BEFORE any repair:

| beat (9-beat version) | traces | fillW | fillH | clipped at rest |
|---|---|---|---|---|
| 3 | yes | 0.8% | 12.5% | no |
| 4 | no | 14.4% | 89.4% | no |
| 5 | yes | 9.9% | 18.7% | no |
| 6 | yes | 10.8% | 68.1% | **YES — gate FAILURE** |

Review round 1 reported this as beat 3 being "the only beat in the scene that never gets a per-view
camera fit". It was not: beats 5 and 6 traced too, and beat 6 was failing the gate outright. A scene
can only go so far here — moving `ROTATE_TO_VIEW` ahead of `TRACE_STRUCTURE` so the trace's own
`flyTo` holds the newest camera ticket cleared beat 6's clip and improved beat 5 — but the framing of
a traced view is an engine question and belongs with the item above.

---

## harness · `walk-scene-in-player.mjs` reports a traced beat's LAST waypoint and measures its FIRST

Filed 2026-10-01 by the same run. The tool prints

> `TRACE_STRUCTURE — waiting 7.5s for the walk to finish before measuring; the frame measured is the
> trace's last waypoint, which is where the player parks it.`

and then waits `duration + 1.5s`. In a headless container that wait is far too short, and the frame
it measures is the walk's **first** stop. The cause is not the trace's own `step` (which is
`max(1600, duration*1000/path.length)`, 2333 ms here) but `sayThen()`: its fallback timer is
`max(readMs(text) + 8000, floorMs, 200)` whenever a SPEAK function is registered, and a stubbed
`speechSynthesis` registers one and then never calls back. So each stop costs about twenty seconds.

**Measured** with `probe-beat3-compare.mjs --beat 4`, sampling `material.opacity` out to 50 s on the
three waypoints of a 7-second, three-stop trace:

| | 1s | 4s | 8s | 12s | 16s | 20s | 26s | 32s | 40s | 50s |
|---|---|---|---|---|---|---|---|---|---|---|
| `head_order_before` | 1.00 | 1.00 | 1.00 | 1.00 | 1.00 | 1.00 | 0.10 | 0.10 | 0.10 | 0.10 |
| `head_fold` | 0.10 | 0.10 | 0.10 | 0.10 | 0.10 | 0.10 | 0.45 | 0.45 | 0.45 | 0.10 |
| `head_order_after` | 0.10 | 0.10 | 0.10 | 0.10 | 0.10 | 0.10 | 0.10 | 0.10 | 0.10 | **1.00** |

The walk does complete and it does light one waypoint at a time, which is the trace working as
designed. But `shares.json` for that beat records `subjectKeys: ["head_order_before"]`, the first
stop, under a banner saying it is the last — so every traced beat the tool has ever reported, in any
scene, has been measured at stop one. Nothing it says about a traced beat's framing or shares is
wrong about a frame the player draws; it is wrong about WHICH frame. Two honest fixes: drive the walk
from the player's own trace state rather than from a wall-clock guess, or register no SPEAK at all in
the harness so `sayThen` falls through on `floorMs`. The second is one line and the first is correct.

---

## Routed by the model3d review run, 2026-10-02 (from `embryology__week-3-gastrulation__notochord`)

Two defects in SHARED machinery, found by the notochord build run and deliberately not fixed there
because a build or review run editing shared files changes every model in the corpus at once, unreviewed.
The build run asked the reviewer to decide; the decision is that both are their own items.

**1. `models3d/render-kit.js` — `sweptShell`'s ANNULAR end caps are wound backwards (one of the two).**
Measured by the build run's own normals probe, with a minimal reproduction that involves nothing of the
notochord model: a straight annulus, ring 24, 4 rows, outer 1.0, inner 0.6 — 480 triangles, **48 wound
against their own supplied vertex normals, agreement 0.9000**. Outer surface 0/192 wrong, inner wall
0/192 wrong, **end caps 48/96 wrong, all of the `cap(0, -1)` branch, buffer indices 432..479**. The same
probe on a SOLID tube returns 0/240, because RENDER-STANDARD section 2.4b routed that path through `triN`.
So the 2.4b fix reached the solid cap and not the annular one.

*Consequence:* **every hollow `sweptShell` in the corpus has one cap inside out** — the neural tube, the
gut tube, bronchi, great vessels — and the cutaway-rim branch is written the same way. It is invisible in
normal rendering for exactly the reason 2.4b gives: the materials are `DoubleSide`, the normals are
supplied, so the shading is right. It surfaces on the inverted-hull silhouette and on a first-hit ray cast.

*Fix:* route the annular cap and the cutaway rim through `emitter().triN(p1, p2, p3, n)`, which decides
vertex order from the geometry instead of from a comment, exactly as 2.4b requires. Then re-run the
ray-cast probe across every model that uses a hollow `sweptShell`, because this changes them all.
The notochord model is NOT affected: it emits its collars and annulus through its own `axialSweep`, whose
annular caps already go through `triN`.

**2. `tools/build-scene-index.mjs` — the DEGRADED map has no `procedural` key.** So every procedural
scene's degraded ops are missing from `scenes/index.json`. Counted on the current index: **18 procedural
entries carry `degrades: []`**. The notochord scene degrades `TRACE_STRUCTURE` (viz3d highlights rather
than walking a centreline for the procedural provider) and its index entry says `degrades: []`, which is
what the tool would have written — the entry is not a splice error, the tool is wrong.

*Consequence:* the player cannot warn a student that an op is degraded for any procedural scene, and a
reviewer reading `index.json` gets a clean bill that the scene files contradict.

*Fix:* add a `procedural` key to the DEGRADED map in `build-scene-index.mjs`, then regenerate
`index.json` on a machine that holds the whole corpus — NOT in a container holding three scenes, which is
how a 146-scene index nearly got overwritten with a 3-scene one.

**3. `viz3d.js` — `SHOW_RELATIONSHIP` is declared `native` but silently discards its `kind` text.**
Found by the model3d review run, 2026-10-02, reviewing the notochord scene. The op is listed under
`capabilities.native` for both the bodyparts3d adapter (viz3d.js:194) and the procedural one
(:536). Its entire implementation is `drawPairs()` (:2263): a `THREE.Line` between the two
structures' bounding-box centres, in one fixed colour. **`o.kind` is never read anywhere in the
file** — `grep -n "\.kind" viz3d.js` returns nothing.

*Consequence:* every teaching sentence any scene in this corpus has written into a relationship's
`kind` is dead content, and the capability table tells the author it is natively supported. The
notochord scene had `from: prechordal_plate, to: chordoma_clival, kind: "remnants anywhere along it
become"` — teaching that clival chordoma arises from the prechordal plate, which is not notochord
and is the structure the scene's own beat 5 uses to mark where the notochord STOPS. Because the text
never renders, the error was invisible to every check that reads narration, and the only thing
carrying the claim to the student was which end the line was drawn from. It survived three build
rounds and two reviews. Fixed in that scene (`from` is now `definitive` for both masses); the engine
defect is here.

*Fix, either way round:* render `kind` as a small pin on the midpoint of the line — `addPin` already
does the label-and-leader work and the midpoint is `pa.lerp(pb, 0.5)` — **or** move
`SHOW_RELATIONSHIP` from `native` to `degraded` in both capability tables, so a scene author is told
their sentence will not be shown. The first is better teaching; the second is honest in one line.
Until one of them lands, a reviewer cannot take a relationship's text as something a student sees.

*And the standing rule this suggests, for RENDER-STANDARD section 3:* **a capability listed as
`native` is a claim about the adapter, not about the renderer.** Before trusting that an op teaches
what its payload says, read what the op actually draws.
