
---

## 2026-08-28 — human session · Gross Anatomy audit, entry 2 · all fifty runs read one at a time

Frank asked for every run's output to be read individually rather than swept with scripts. All fifty
blocks in this file were read, and every factual claim in each was checked against the scene files and
against `available-meshes.json`. **Forty-six corrections have been applied.** The full remaining
worklist is `viz-training/REPAIR-BACKLOG.md`; this entry records what was wrong and what changed.

### Nineteen places a student was being taught something false

Each of these was live. Each is now corrected.

| scene | was | is |
|---|---|---|
| `arm__brachial-artery` | the artery may be tied **above** the profunda origin and the limb lives | **below** — tying above cuts off the collaterals the same beat has just listed |
| `pectoral-region-breast__clavicle` | **subclavius** separates the subclavian vein from the artery | **scalenus anterior** does; subclavius lies between both vessels and the bone, as the same scene says two beats later |
| `kidney…__kidney` | an enlarged kidney is ballotable and **you cannot get above it**; a spleen is the same but not ballotable | you **can** get above a kidney and cannot get above a spleen — the sign the scene said "separates the two swellings" did not separate anything |
| `kidney…__kidney` | the **SMA** marks where an ascending horseshoe kidney is arrested | the **IMA** does, as the same scene's beat 6 says |
| `kidney…__kidney` | the **cortex** dies first in acute tubular necrosis | the **outer medulla** does |
| `pelvis-perineum__pelvic-diaphragm` | pudendal nerve **S3–S4**; "S3 and S4 keep the pelvis off the floor" | **S2–S4**; "S2, 3, 4 keeps the pelvis off the floor" — the mnemonic as written encoded nothing |
| `pelvis-perineum__internal-iliac-vessels` | "a mnemonic for the **anterior division**" expanding to a list containing three posterior-division branches | a mnemonic for **all** the branches, both divisions |
| `lungs-mediastinum__tracheobronchial-tree` | carina at T4 in the **living**, T5–T6 in the **cadaver** | the other way round — and the scene's own reason ("a dead body is not breathing in") gave it away |
| `lungs-mediastinum__tracheobronchial-tree` | tracheostomy through rings 2–4, **below the isthmus** | the isthmus lies **across** rings 2–4; it is retracted or divided, and a low tracheostomy is rings 5–6 |
| `lungs-mediastinum__great-vessels` | everything distal to the left subclavian is the **isthmus**; coarctation is described relative to **that branch** | the isthmus is the short segment to the **ligamentum**; coarctation is pre- or post-**ductal** |
| `stomach-intestines__large-intestine` | only the **upper third** of the rectum is covered by peritoneum in front | upper third front and sides, **middle third in front**, lower third not at all |
| `stomach-intestines__small-intestine` | Brunner's glands are the **only** submucosal glands in the gut | one of **two** — the oesophagus has them too |
| `gluteal-region__hip-joint` | obturator externus passes **in front of** the axis of the neck | below and behind it — as the same scene's beat 9 says |
| `gluteal-region__gluteal-vessels` | the circumflex femorals are branches of the **external iliac** | of the **profunda femoris**, two steps down |
| `thigh__hamstrings` | sciatic root value **L5, S1, S2** | **L4–S3**, as the corpus's own sciatic scene says |
| `thigh__adductor-canal` | vein **above** the artery in the canal, **below** it in the fossa | **deep** in the canal, **superficial** in the fossa — the scene said both |
| `leg-foot__popliteal-fossa` | popliteal nodes drain **the sole**; a sole wound is felt for here, not the groin | they drain the **small saphenous territory**; most of the sole goes to the groin |
| `forearm-hand__intrinsic-hand-muscles` | a hook-of-hamate fracture paralyses **every muscle in the palm** | every **ulnar-supplied** muscle; the thenar three and lateral two lumbricals are median and survive |
| `back-vertebral-column__spinal-cord` | the cervical enlargement sits at **C1 and C2** | it lies from about C4 to T1; the sentence had been pasted onto all seven cervical vertebrae |

**The corpus already held the correct answer in every one of these cases**, usually in the same file.
That is the finding worth keeping: a consistency pass over one scene would have caught more than any
amount of external checking, and the audit prompt now asks for exactly that pass.

### Nine meshes declared missing that were in the catalog all along

The catalog spells things in Terminologia and the runs searched with the clinical name. One search,
no result, and "there is no X in the catalog" went into `gaps[]` — where it stopped being a search
result and became evidence. Later runs quoted it instead of searching again. Run 17 wrote "the catalog
contains no ligament at all" one run after run 16 had authored a ligament from it.

- **`scalenus`**, not scalene — six meshes. The brachial plexus scene was routed to `diagram` partly
  on this, and the interscalene groove it teaches is renderable in 3D today.
- **`deferent duct`**, not vas deferens — `FMA19235`/`FMA19236`. Declared absent in three scenes, and
  raised to a human in run 37 as "the cheapest high-value model request the corpus has".
- **`interosseous membrane`** — `FMA23707` forearm, `FMA35192` leg. Declared absent in three scenes,
  two of which narrate it, while a fourth scene had it as an authored part.
- **`levatores costarum`** — four meshes.
- **plantar interossei** — three individual meshes, said to exist "only as sets".
- **`skin`** — `FMA7163` exists (one undivided whole-body mesh, so the conclusion held; the reason
  did not).
- **the taeniae coli** — a stale note in the small-intestine scene still said the appendix and rectum
  were the only large-gut meshes, four runs after the large-intestine scene disproved it. Run 29
  asked a human to fix it; nobody had.

All nine `gaps[]` entries now say what is actually true, and the meshes are itemised as authoring jobs
in section 1 of `REPAIR-BACKLOG.md`.

### Five labels naming the wrong object

`FMA7333` and `FMA7370` are the **upper lobes** of the right and left lung and were labelled "Right
lung" and "Left lung" in the great-vessels and mediastinum scenes — so three beats that "take the
lungs out" removed only the upper lobes. `FMA8364` is the right ninth **rib** and was labelled a
costal cartilage. `FMA38619` is the **ulnar head** of flexor carpi ulnaris and was labelled the whole
muscle. Every other scene in the corpus labels these correctly, so all five were slips rather than
conventions.

### What the reading found that is not fixed here

`REPAIR-BACKLOG.md` carries it. In short: fourteen scenes need a structure added whose mesh exists;
two scenes are missing a view mode their curriculum entry requires and nothing in the validator checks
that; eight views in the Back scenes have no beat number and one scene numbers two beats "3"; six
embryology scenes carry errors that will be baked into artwork the day it is commissioned, including a
colour key that three scenes call binding and one of the three does not implement; and **aortic arch
artery remodelling has no curriculum entry anywhere**, which orphans coarctation, the vascular rings,
the aberrant right subclavian and the anatomical origin of a patent ductus. About a hundred landmark
anchors sit unsigned on scenes that are live.

### Verified clean

Worth recording, because it says where the task was reliable. Across all 1218 model references in the
corpus: every id resolves, every `name` matches the catalog character for character, no id is used
twice inside a scene, and after this session's label work no scene disagrees with the catalog about
side. Every op target, `from`, `to`, `path[]` and `targets[]` in the corpus resolves to a real
structure, group or declared concept — no beat points at something that is not there. The
anatomical content of the arm, forearm, hand, rotator cuff, femoral triangle, quadriceps, tibia and
fibula, ankle, ribs and sternum, intercostal bundle, pleura, conducting system, lungs, stomach,
duodenum, liver, biliary tree, pancreas, suprarenal, bony pelvis, bladder and the whole of the
embryology corpus was read line by line and found sound.
