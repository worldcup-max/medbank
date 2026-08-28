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

- `back-vertebral-column__spinal-cord-in-vertebral-canal` — curriculum requires a `vasculature` view
  ("segmental blood supply"). There is none, and `gaps[]` does not record the omission even though it
  records six others. It is genuinely unauthorable (no vertebral or spinal artery in the catalog), so
  the fix is the gap note, not the view.
- `embryology__pharyngeal-apparatus__pharyngeal-pouches` — curriculum requires `glands`. Beat 3 and
  beat 4 already *are* glands views (thymus, both parathyroid pairs, the C cells); they are moded
  `associated_organs`. Re-mode one.

**Neither was caught by validation.** Nothing in the eight stages compares a scene's view modes to the
`views` its curriculum entry asks for. That check is worth adding — it is a three-line comparison and
it is the only thing standing between the corpus and a silently incomplete scene.

## 3 · Contradictions still open — these need a judgement, not a rewrite

- **`pectoral-region-breast__clavicle`** counts the muscles attached to the clavicle three ways in one
  beat: the title says four, the narration says five, the trace path now names six. Pick a number.
- **`arm__humerus`** promises "the four places it commonly breaks" in its learning goal and beat 7
  delivers three; `arm__median-ulnar-radial-nerves` `gaps[1]` then defers to a fourth that was never
  written. Either add the supracondylar/median-nerve pair to beat 7 or drop "four" from both.
- **kidney vs ureters** give different segmental levels for the same referred pain — T10–L1 in one,
  T11–L2 in the other. The right answer is kidney T10–L1, ureter T11–L2; say both in both.
- **liver vs spleen** each claim to be the most commonly injured abdominal organ, in the same topic.
  Split it by mechanism: spleen commonest in blunt trauma, liver in penetrating.
- **`inguinal-ligament-landmarks` vs `inguinal-canal`** teach the deep-ring occlusion test as
  diagnostic and as unreliable respectively. The canal scene is right.
- **`inguinal-ligament-landmarks`** conflates the supracristal plane (highest point of the crest, L4)
  with the transtubercular plane (tubercle of the crest, L5) on one anchor, and the anchor's geometry
  is the supracristal point while its terms claim both.
- **`forearm-hand__radius-ulna`** `gaps[]` says eleven anchors were derived; there are ten. The
  obvious eleventh is the neck of the radius, which the head narration already names.
- **`back-vertebral-column__typical-vertebra`** — `CORPUS.md` records 16 landmarks, the file has 13.
- **Eight views across the four Back & Vertebral Column scenes carry no `beat` number**, and
  `typical-vertebra` numbers two different beats "3". Every run reported the validator clean, because
  nothing checks beat ordinals. Renumber, and add the check.

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
- **No beat-ordinal check** in the validator (see §3).
- **No curriculum-view-coverage check** in the validator (see §2).
- **`DEMAND.json` has never been built.** `tools/build-demand.mjs` exists and has never been run, so
  the demand-priority branch of the authoring task has never once executed. An untested branch in a
  scheduled task is a branch that will surprise someone.
- **Run 32 is undocumented.** `spleen.json` and `portal-venous-system.json` exist and validate; no run
  block records authoring them.
