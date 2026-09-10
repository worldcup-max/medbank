# MedBank · model3d build + review log

Append-only. Newest entries at the bottom. One block per run, from either task.

Format: `## <UTC timestamp> · <BUILD|REVIEW> · <item id>` then what was done, what was PROVEN (not
assumed), and what is still unknown. Be specific about uncertainty — the other task reads this, and a
vague note wastes its whole run.

---

## 2026-09-10 · seed · (no run)

Queue created with 34 items: one engine capability, 28 embryology structures, one histology renderer,
four histology structures. Order is deliberate.

`engine__procedural-provider` is first and it blocks everything after it. `viz3d.js` registers exactly
two providers, `bodyparts3d` and `svg`. There is no procedural one, so the models these tasks build
have nothing to plug into and cannot reach a student until that exists. The spikes in
`viz-training/spike/` render beautifully and are wired to nothing.

Two structures are already built as spikes and should be PORTED, not rebuilt:
`heart-loop.js` (cardiac looping) and `neurulation.js` (neurulation). Both use `render-kit.js`.

Histology moved from the SVG/microscopy path onto procedural 3D on Frank's instruction, 2026-09-10.
The honest form of that is a rotatable block whose cut face reads as a section — see the queue entry
for `engine__epithelium-renderer` for why that is better than a picture of a slide rather than worse.

---

## 2026-09-10T09:20Z · BUILD · engine__procedural-provider

**Built by hand, not by the build task.** The task's first-ever run would have been an edit to the
production engine, which is the riskiest possible sequencing for something unproven. The task was
disabled at 09:05:01 — the queue head was still `todo` and nothing had been touched, so no run got in.

### What was built

A third provider in `viz3d.js`, beside `bodyparts3d` and `svg`. Same adapter contract — `resolve(s)`
and `load(T, s) -> {mesh, reason}`. Neither existing provider was touched.

- `refs.procedural = "<model>#<part>"`, optionally `"...@<t>"`. A plain string, the same shape as a
  bodyparts3d ref, so a scene author never writes an object literal.
- Models live under `MEDBANK_CONFIG.MODEL_BASE` (default `./models3d/`) and register
  `window.MB3D_MODELS[id] = { LAYERS, build, FULL }`.
- `render-kit.js` is loaded once before any model, because it reads `window.THREE` when it evaluates.
- **One structure, one mesh.** The engine reads `m.geometry` directly for highlight patches, anchors
  and bounding boxes, so handing it a Group would break it. The adapter merges every mesh carrying the
  requested key into a single geometry and drops silhouette shells — the player has its own lighting
  and its own look, and a spike's presentation is not the app's.

### What was PROVEN, as against assumed

Driven through `MB3D.adapters.procedural` directly, which is public, so no player boot was needed:

| case | result |
|---|---|
| all 8 parts of `cardiac-looping` | resolve, 1920–11288 triangles each, `geometry` present, `userData.key` correct |
| unknown part name | `{mesh: null, reason: 'none'}` |
| no `refs.procedural` | `{mesh: null, reason: 'none'}` |
| model file missing | `{mesh: null, reason: 'failed'}` — the distinction the STL path is careful about is preserved |
| `@0` vs `@1` | different geometry, so `t` is really reaching the builder |
| rendered under the app's own camera-parented rig | correct; screenshot kept |

### A bug the testing caught

The adapter first built with `{}`, so any layer behind an option flag — the heart's endocardial tube —
came back as `reason: 'none'`, which the engine reports to a student as *"there is no model of this
structure."* That was a lie about a model sitting right there. Models now declare `FULL`, the set of
options that produces every part, and the adapter builds that. The adapter slices by key afterwards,
so building everything costs one group and makes the two failure kinds impossible to confuse.

This is exactly the case RENDER-STANDARD §6 is about: the first version *looked* correct and its own
error message was confidently wrong.

### Known gaps — stated so nobody has to discover them

1. **`t` is per scene or per structure, not per view.** A scene cannot yet animate through its own
   stages with an op. That belongs in the op dispatcher, not the adapter.
2. **Units do not reconcile.** Procedural models are in their own units; BodyParts3D meshes are
   anatomical millimetres. A scene must not mix the two providers until something addresses this.

Both are gaps, not bugs, and neither blocks the queue.

### Also this run

- `models3d/cardiac-looping.js` created — the ported spike plus the registration. The spike at
  `viz-training/spike/heart-loop.js` is now a frozen reference; **changes belong in `models3d/`.**
- `sw.js` bumped v227 → v228, reading its current value first.
- 13 neuroanatomy items added to the queue. They were held on meshes BodyParts3D does not have, but
  they are tubes, cords and cavity casts — what the swept shell already does. The circle of Willis is
  a better procedural candidate than cardiac looping was.

REVIEW NOT FIRED — deliberately. This item was built and verified in a session with Frank present,
which is a stronger check than the review task performs. The next build run starts at item 1.

---

## 2026-09-10T09:45Z · BUILD · embryology__cardiovascular-development__cardiac-looping

**The queue said "wire the scene's refs". That was wrong, and the disagreement is the finding.**

The scene's `structures[]` were teaching BEATS — `why_it_bends`, `laterality_genes`, `dextrocardia`,
`exam_frame` — because it was authored for the SVG panel engine, where a "structure" is a panel. There
were no anatomical parts to hang a `refs.procedural` on. **This is true of all 28 embryology scenes**,
so every one of them is a re-authoring job, not a wiring job. The queue notes now say so.

The narration in those beats is the best content in the corpus. It was moved **verbatim and
programmatically** onto the views that replaced each beat — no retyping, so no transcription drift.
21 structures, 12 views, nothing taught was dropped.

### Two bugs found by testing, both of which looked correct first

1. **The build task's own instructions were wrong.** They said to write models to
   `viz-training/models/`. Nothing reads that path — the provider loads from `models3d/`. A run
   following them would have produced a model that rendered nowhere while every check still passed.
   Corrected, and the prompt now states where things live and why.
2. **A model id maps to a FILE.** The L-loop was first added by registering a second model,
   `cardiac-looping-l`, inside the same file. It resolved to nothing. Rather than a stub file per
   variant, the ref grammar gained boolean flags: `cardiac-looping#ventricle@1+mirror`. A mirrored
   heart is the same model with one sign changed, not a different model.

### The L-loop is built, not described

Mirroring by scaling −1 in x would have reintroduced RENDER-STANDARD bug 1 deliberately: every
triangle's winding inverted, silhouettes flipped to the near side, surfaces shading inside-out. So the
mirror is taken in the **construction** — the transported frame is seeded −x instead of +x — and every
ring is still built right-handed.

Proven rather than assumed: mean x exactly negated (−2.468 → +2.468), identical triangle counts, and
**identical outward-normal fraction**, which a negative scale would have inverted.

### Proven

- validator **142/142**, after teaching `tools/validate-scenes.mjs` the procedural adapter (it had no
  entry, so it correctly refused the scene) and fixing a real error it caught: `CROSS_SECTION` takes
  `axis`, not `plane`
- **all 21 refs resolve** through `MB3D.adapters.procedural` with geometry — 163,208 triangles
- console clean; three stages and the D-vs-L comparison rendered and looked at
- scene index rebuilt: 142 scenes, 14,640 term mappings

### Not proven, and left for review

How it frames inside the real player's camera. Whether 12 views is too many for one scene. Whether
t = 0.4 is the mid-loop a textbook would recognise or an arbitrary point. And whether showing
dextrocardia with the L-loop build teaches that dextrocardia always means L-loop — the narration
distinguishes it from dextroposition, the geometry cannot.

---

## 2026-09-10T10:45Z · REVIEW · embryology__cardiovascular-development__cardiac-looping

Round 1. Reviewed by a run that did not build it. Status set to **changes-requested**.

**First, a task failure that has to be recorded, because it has now happened three times.** This run
was given the computer but no folders, so `ls viz-training/BUILD-QUEUE.json` failed and the repo was
invisible. Two earlier runs in this state reported quiet successes and touched nothing. This run
requested folder access explicitly and got it, then proceeded. If a future run cannot see the repo,
requesting access is the move; reporting success is not.

### Method

Mechanical first, in headless chromium against the real `render-kit.js`: built at t = 0, 0.2, 0.4,
0.6, 0.8, 1.0 and at t = 1 mirrored. Console clean. Face-winding agreement computed per mesh (each
triangle's geometric normal against its own supplied vertex normals) — 0.92–0.99 across every tube
segment, so **RENDER-STANDARD bug 1 is genuinely not present here**, which is worth stating positively
because it was the expensive one. Frame fill measured by reading the framebuffer per view.

Anatomical second, and **all twelve views were rendered and looked at before the model source was
opened.** That order is why finding 1 was found: the source's own header states the loop swings
ventrally, and reading it first would have anchored me to that claim instead of measuring it.

### What was corrected in this run

- **The aortic arches were in the wrong place at two of the three stages.** The arches move with `t` —
  their cranial end follows the arterial pole down as the chord shortens — and the scene drew
  `arches@1` on all three stages. At day 21 that planted the arch roots on the **bulbus cordis**, with
  one limb buried inside it like a lesion; at mid-loop it left the entire arch complex **floating free
  in space** with the truncus's lumen gaping open. Added `arches_a` (@0) and `arches_b` (@0.4) and
  re-pointed views 1–4. Before and after renders are in `_review-2026-09-10/`. The veins are genuinely
  t-invariant, so `veins_c` was already correct at every stage.
- **`pericardium` was in neither `structures[]` nor `gaps[]`** — a review-1 key-coverage failure.
  Declared, with the reason it is not usable (finding 4).
- **The model's stated axis convention was backwards.** The header said `+x = embryo's RIGHT`. It is
  the LEFT. Measured, not argued: six BodyParts3D right/left pairs in `meshes-lite` — tenth rib, hip
  bone, epididymis, both lung lobes, pyramidalis — put RIGHT at negative x in every case, and
  `viz3d.js` parks the anterior camera at +z. **The geometry was already correct** (the default build
  sends the limb to −x, the embryo's right, which is the D-loop), so nothing rendered wrongly — but
  that comment is the axis convention the next procedural model will be written to, and it would come
  out mirrored. Corrected in place with the evidence.
- **Deleted the dead `DEPTH_ORDER` table**, whose comment claimed the model avoids z-fighting by
  polygonOffset ranking. Nothing read it, and RENDER-STANDARD §2.5 says that ranking does active harm
  on separated solids, which is exactly what this model is. Deleted rather than wired up.
- Validator re-run after every edit: **142/142**.

### What is sent back, and why it is not a patch

The full list is on the queue item. The two that matter:

**The loop bends dorsally.** Centroid z at t = 1: ventricle 0 → −1.12, bulbus 0 → −0.82, atrium
0 → −0.93. Every segment goes backwards, and +z is the model's own ventral. View 3 is *titled*
"swings ventrally, caudally and to the RIGHT". Right is built; ventral is not. **This is invisible in
the anterior view**, which is how it survived a build that rendered three stages and looked at them —
and it is the reason the diagnostic ladder's "render the suspect alone in a colour that cannot be
confused" generalises to "render it from an axis where the error can show at all". The axis-marked
lateral render is in `_review-2026-09-10/`.

**The atrium never gets behind and above the ventricle.** At t = 1 it is still caudal to it
(y −0.68 vs +0.51) and is the *less* dorsal of the two (z −0.93 vs −1.12). View 5 asserts the opposite
while pointing a lateral camera straight at it. Same root cause: the torsion `psi(u,t)` is two tuned
constants, `PSI0 = 0.26` and `TAU = 1.60`, and it is the torsion that decides which limb goes ventral.
A z sign flip does not fix this — it would send the atrium ventral, which is equally wrong.

Both are model changes with a design decision inside them, so this run did not attempt them from the
scene. Patching a scene around a model that is posed wrongly is how a corpus accumulates lies.

### §4 — the standards did not have these

Every rule in RENDER-STANDARD passed. Winding, normals, colour, hulls, frame fill: all clean. Nothing
in it asks whether the model is **oriented and posed the way the anatomy says**, and findings 1 and 2
are both that. Two rules proposed, recorded on the queue item:

1. **Declare the axes and prove them.** A model states its axis convention machine-readably and the
   check asserts it against the corpus — RIGHT is −x, LEFT is +x, CRANIAL +y, VENTRAL +z, measured
   from BodyParts3D pairs, not read from a comment. This model's comment had the sign inverted and
   nothing noticed.
2. **A spatial claim in narration is a testable assertion.** When a view says one part ends up behind,
   above, right of or inside another, that is one line of arithmetic on two bounding boxes at that
   view's `t`. "The inflow end comes to lie behind and above the ventricles" is checkable, and it
   fails.

### One more, for the next build run rather than this scene

`models3d/cardiac-looping.js` is not wrapped in an IIFE, so `const T`, `const K`, `const C`, `LAYERS`,
`buildHeart` and the rest sit in the global lexical scope. `neurulation.js` is next in the queue and
the obvious way to write it is `const T = window.THREE` — which throws
`SyntaxError: Identifier 'T' has already been declared` and takes the whole page with it. **Reproduced,
not predicted:** this run hit exactly that error when its own harness declared a `K`. Wrap it before
the second model exists, not after.

Not built, not committed, not deployed. The next build run takes this item before any `todo`.

---

## 2026-09-10T11:20Z · REVIEW · embryology__cardiovascular-development__cardiac-looping (round 1, second sitting)

Manual re-fire. **The item was already `changes-requested` from earlier today, not `built`** — the
firing message's premise was stale, so the two reviews were not re-run and the status was not touched.
`review_rounds` deliberately left at 1: this is the same reviewer continuing their own work, and
spending a round on that would push the item toward escalation without a build run having answered
anything.

The run went instead at the three questions the queue itself had left open. All three are now answered
and **none of the answers is the comfortable one.**

### The beat-to-view mapping is clean — and checking it found something else

Verified beat by beat against `git show HEAD:` — all 12 beats land on views 1–12 in order, titles
identical, narration byte-for-byte verbatim. The programmatic move did exactly what was claimed.

**But the sequence scene had 12 beats AND 5 views, and each of those 5 views carried its own
narration.** The re-authoring moved the beats and left the views behind: 2,367 characters, gone. The
scene's `gaps[]` and this log both say "Nothing taught was dropped."

It is not restatement. It is the synthesis layer — *"Three sentences, in this order… If you can say
those three lines you can draw the loop from memory"*; the cross-link back to the heart-tube scene
(*"nothing has been added or lost, the same five segments have simply been repositioned"*); the
compact three-way differential closing on *situs, loop, connections*; and the four words that carry
the whole mechanism, *"Held at both ends, free in the middle, growing. It bends."*

Recovered verbatim to `_review-2026-09-10/dropped-narration.md` so it no longer depends on git
archaeology. Where it lands is the build task's call — but this scene already has four views that
render as the same frame, so five more views is probably the wrong shape for it.

This is rule 6 doing its job. The log said nothing was dropped; the disagreement was the finding.

### t = 0.4 is not a mid-loop, and the day mapping is inconsistent

Rendered t = 0.2 / 0.3 / 0.4 / 0.5 / 0.6 / 0.8 and looked at all of them. At t = 0.4 the tube is a
shallow wave — bent, but the bulboventricular limbs have not folded alongside one another and there is
no C. The recognisable C-loop appears at about **t = 0.6**.

Worse for views 3 and 4 specifically: view 4's narration says *"the two now sit side by side rather
than one behind the other"*, and measured, the ventricle-to-bulbus vector is predominantly
cranio-caudal at **every** t — (0.28, 1.25, 0.20) at t = 0.6, (0.45, 1.09, 0.30) at t = 1. They never
sit side by side, so no choice of t fixes this.

Separately, the model's header calls t = 0 day 21 while view 1's narration calls the straight tube day
23. Those give day 23.8 and day 25 for the same t = 0.4.

**Stage _b was left at 0.4 on purpose.** The torsion is being rebuilt for findings 1 and 2, the legible
mid-loop will move when it is, and picking a number off a model that is about to change would lock in a
value derived from the broken version.

### View 10 does teach that dextrocardia means L-loop

Answer to the queue's own question: **yes, and it is wrong.** The view shows `ventricle_l` and
`bulbus_l` alone — two mirrored chambers, no atrium, no outflow, no midline, no chest — immediately
after view 9 has established that exact shape as "the L-loop". Mirror-image dextrocardia with situs
inversus is L-looped, but **dextroversion** — isolated dextrocardia with the abdominal organs in the
usual place, which is precisely the case this view's own narration flags as carrying a high rate of
associated defects — is a **D-looped** heart rotated into the right chest. The geometry contradicts the
most clinically loaded sentence in its own narration.

And dextrocardia is a claim about position and apex direction *within the thorax*. This model has no
body midline and no chest, so nothing in the frame says right or left; the picture cannot make the
claim at all. The existing `gaps[]` entry covered dextroposition and stopped short of this. Rewritten.

### Correcting my own round-1 overstatement

Round 1 said the whole tube bends dorsally and framed all three segments as wrong. Re-checked against
the recovered beat text, that is too strong and the sharper version is more useful to whoever rebuilds
it. Beat 4 wants the ventricle **dorsal** and beat 5 wants the atrium **dorsal and cranial** — the
model gets both of those right, and the two limbs are even in the right relative order (bulbus ventral
to ventricle, z −0.82 vs −1.12 at t = 1). Two things are actually wrong: the **bulbus** moves dorsally
from its own start while view 3 says it swings forwards, and the whole loop is displaced backwards,
which is what leaves the ventricle sitting behind the atrium. The target is not "flip z" — it is to
separate the limbs in the AP axis about an axis that does not itself travel dorsally.

Finding 2 also quantified: the atrium starts 1.48 below the ventricle and ends 1.19 below. The third
movement closes **20% of a gap it is supposed to cross**.

Validator 142/142 after the edits. Nothing built, nothing committed, nothing deployed. Status unchanged
at `changes-requested`, round 1.
