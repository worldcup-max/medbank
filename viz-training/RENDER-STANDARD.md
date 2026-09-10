# MedBank · viz-training · RENDER STANDARD

How a procedural 3D structure is built and lit, and the four bugs that must never be written again.

Companion to `ARTWORK-STANDARD.md`, which covers 2D plates. That document exists because a drawer
cannot review their own drawing. This one exists for a different reason: because four rendering
faults were mistaken for anatomy problems for weeks, and they were degrading **every** model in the
corpus at once.

Written 2026-09-10, after the cardiac-looping model.

---

## 1 · Why this document exists

Neurulation was hard. It was assumed to be hard because neurulation is hard — seven germ layers in
mutual contact, where the neural plate *is* the ectoderm rather than sitting beside it. That is real,
and it is still real.

Cardiac looping was then built as a control: one tube, made of separated solids meeting only at
narrow waists. The prediction was that it would come out clean first time.

It did not. It took six passes. But **not one** of the six was a structure-versus-structure problem.
There was no bleeding, no mottling, no tissues fading into one another — none of the neurulation
symptoms appeared. Every problem was in the machinery, and three of the four had been present in the
neurulation renderer the whole time.

That is the finding this standard encodes: **when a render looks wrong, the fault is more often in
the machinery than in the anatomy, and machinery faults are invisible because they look like
anatomy faults.** The four below are now fixed in one place — `spike/render-kit.js` — so that they
are fixed for every structure, including the ones not yet written.

## 2 · The four faults, and the rule each leaves behind

### 2.1 Winding — the one that cost the most

Emitting a ring quad in the obvious order `a, b, c, d` makes `(b−a) × (c−a)` point **into** the
solid. On a `DoubleSide` material that hides itself perfectly: the shading is correct because the
normals were supplied explicitly. Nothing looks wrong.

It surfaces only through the inverted-hull silhouette. `side: BackSide` on an inflated shell is
supposed to draw the shell's **far** half, safely behind the surface. With the winding inverted it
draws the **near** half instead, sitting a hair in front. `polygonOffset` then buries it — but
polygon offset scales with the polygon's depth slope, so it buries it only where the surface is
oblique. On the part of a chamber that faces the camera head-on there is no slope, and the shell
shows through as torn dark patches with stair-stepped edges.

It looks exactly like z-fighting. It is not z-fighting. Four diagnostic renders were spent blaming
z-fighting, shadow acne, degenerate normals and hull tearing before the winding itself was tested.

> **RULE.** Never write winding by hand. Emit through `VizKit.emitter()`. `quad(a,b,c,d, …)` takes
> corners in natural ring order and orders the triangles so the face normal agrees with the supplied
> vertex normals. `quadFlip` is the deliberate reverse, for an inner wall or a reversed cap.

### 2.2 Colour space — the one that cost the most *credibility*

three r128 treats a `Color` built from a hex literal as **already linear**, and the renderer encodes
linear → sRGB on output. Feed it an sRGB hex and every colour comes back lighter and less saturated.

This is why our renders read as pastel candy next to any reference image, and why no amount of
light-tuning fixed it: the wash was applied after the lighting. Deep reds arrived as salmon. Blues
arrived as powder.

> **RULE.** Every colour that reaches a **material** goes through `VizKit.C()`.
> A **background** colour does not — the clear colour is written raw, not output-encoded, so
> converting it darkens it to black. Use `VizKit.bg()` for that, and never the same helper for both.

### 2.3 Normals — the one that made everything look like plastic

The normal of a swept surface does **not** point radially wherever the calibre changes fast, and on
anatomy the calibre always changes fast: every sulcus, every ballooning chamber, every taper. A
radial assumption is wrong twice over — it shades the form flat, and it pushes the silhouette shell
sideways instead of outwards.

> **RULE.** Normals come from a finite difference of the **same point function** that produced the
> positions, so the two cannot disagree. Guard the difference: it can collapse, and three's
> `normalize()` returns `(0,0,0)` for a zero vector without complaining — which would leave a
> silhouette shell undisplaced and coincident with the surface it is meant to hide behind. Fall back
> to the radial direction, and force the result to point away from the centreline.

### 2.4 Hulls — inflate the skin, not the solid

Inflating a whole solid — outer surface, inner wall, end caps, cutaway rims — tears the hull open at
every seam where one position carries two different normals, and the torn interior shows through.

> **RULE.** Only the outer surface becomes a silhouette. Geometry records how much of its buffer that
> is, in `geometry.userData.hullCount`, and `VizKit.outlineOf` respects it. An **indexed** geometry
> (anything from a three primitive such as `SphereGeometry`) must be de-indexed first, or inflating
> it walks the vertex list and produces triangle soup.

### 2.5 A fifth thing, which is a decision rather than a bug

Depth-rank `polygonOffset` was introduced for neurulation, where sheets genuinely share surfaces and
must be forced into a stable order. **For separated solids it does active harm** — it drags buried
vessels forward through the tubes that contain them, which is what put dark scratches across the
truncus arteriosus.

> **RULE.** Depth-rank polygon offset is opt-in, for surfaces in genuine contact. Never a default.

## 3 · Standing rules for any new structure

**THE SUBJECT FILLS THE FRAME, AT EVERY t.** A parametric model changes size and position as `t`
advances. A camera parked at a distance that suited one stage will crop another and shrink a third.
Fit to the bounding box every rebuild — `VizKit.fitCamera`. This is the 3D form of the first rule in
`ARTWORK-STANDARD.md`, and it was broken the same way: by tuning one view and assuming the rest.

**PREFER A SOLVED PARAMETER TO A TUNED ONE.** The looping model does not carry a hand-tuned bend
amplitude. It carries the physical constraint — both poles are tethered while the tube lengthens —
and solves for the amplitude at every `t` by bisection. A tuned constant drifts out of agreement with
the anatomy the moment anything else changes; a solved one cannot.

**SEGMENT BOUNDARIES BELONG AT THE WAISTS.** Where a structure is divided into named parts, put the
divisions where the real landmarks are — the sinoatrial orifice, the atrioventricular canal, the
bulboventricular sulcus. This is anatomically right *and* it means neighbouring parts meet where they
are narrowest, which is the geometry least likely to fight. Overlap adjacent parts very slightly so
neither end cap is ever exposed.

**A VIEW MUST CHANGE THE PICTURE.** If a beat renders the same frame as the one before it — same
structures, no highlight, no rotation, no section — it is not a view. It is text, and text has its own
home in this app. Every embryology scene in the queue is a converted SEQUENCE scene, where a "beat" was
a panel of prose, so every one of them will arrive carrying beats like this. Move them to
`deferred_beats[]` with their full narration, why they are not a view, and where they belong. **Never
delete the words** — the narration is the best content in this corpus. The first conversion kept four
identical frames because it confused "do not lose teaching" with "do not lose views".

**EVERY MODEL IS WRAPPED IN AN IIFE.** Only the `window.MB3D_MODELS[...]` registration escapes. A
model written at top level puts `T`, `K`, `C`, `LAYERS` and every constant into global lexical scope,
and the second model to load — written the obvious way, `const T = window.THREE` — dies on
`SyntaxError: Identifier 'T' has already been declared` and takes the whole page with it. Found on the
first model, reproduced rather than predicted: a reviewer's own harness declared a `K` and hit it.
One model works fine at top level, which is exactly why this has to be a rule and not a habit.

**SOLVE THE PARAMETER THAT DECIDES THE EXAMINABLE RELATION.** "Prefer a solved parameter to a tuned
one" above is not satisfied by solving the easy one. The looping model solves its bend amplitude by
bisection and then hand-tunes the two torsion constants — and torsion is what decides whether the loop
is convex ventrally or dorsally, which is the whole D-loop. The solved half was the half that did not
matter. Ask which number a student would be marked wrong for, and solve *that* one against a stated
constraint.

**SHADOWS ARE OFF BY DEFAULT.** With no ground plane to catch them they contribute nothing but
self-shadow acne, which looks like — again — z-fighting.

**AIM A CUTAWAY AT A WORLD DIRECTION, NOT AN ANGLE.** A transported frame twists along a sweep, so a
window opened at a fixed θ points somewhere different at every station and can end up facing away
from the camera entirely. Resolve the angle per row from the direction you actually want it to face.

**A MEMBRANE TAPERS.** Any suspending sheet — mesocardium, mesentery, meningeal fold — must narrow to
nothing where it meets the structure it suspends. Drawn with a constant free edge it reads as a slab
of card standing behind the subject, which is exactly what the first dorsal mesocardium looked like.

## 4 · The diagnostic ladder

When something looks wrong on a surface, work down this list in order. It is written in the order
that would have found the winding bug fastest, rather than the order it was actually found in.

1. **Render the suspect layer alone, in a colour that cannot be confused with anything else.**
   Magenta on the silhouette shells identified the culprit in one frame after four frames of theory.
2. **Turn the suspect off entirely.** If the artefact goes, you have the component. If it stays, you
   have eliminated it — which is worth as much.
3. **Exaggerate the parameter.** Setting the hull thickness to five times its value showed the shell
   covering the whole silhouette, which proved it was the near half and not the far half. A subtle
   artefact made obvious is a solved artefact.
4. **Colour by identity.** Tinting each outline with its own structure's colour proved each patch
   belonged to the structure it sat on, ruling out every neighbour at once.
5. **Only then reason about depth precision.** Depth-buffer explanations are seductive and were wrong
   three times here. Reach for them last, after geometry and orientation are eliminated.

## 5 · What procedural geometry is for, and what it is not for

Recorded here so it is not relitigated every time.

**Procedural belongs where the form is a function of something.** A tube that bends. A sheet that
folds. A tree that branches. A series that segments. Anything where a student's real question is
*what happens next* — because then the stages are samples of one continuous function and cannot drift
out of agreement with each other. Both models built so far are this shape, and they use opposite
mechanisms: neurulation conserves arc length, looping conserves the distance between two tethered
poles while the length grows. The method carried both.

**Meshes belong where the form is irregular and has to be remembered exactly.** A scapula is not a
function of anything. Its subscapular fossa, spine, acromion, coracoid and glenoid each have their
own curvature answering to muscle pull and joint geometry, and an exam asks a student to recognise
*that* shape, not a plausible one. Writing it procedurally is hand-sculpting through a keyboard, and
the result is a model that is wrong in ways no reviewer can name. Use BodyParts3D; we already have
it, it is real scan data, and it is CC-BY-SA attributed.

The test: **would a student be marked wrong for the difference between our version and the real
one?** If yes, it needs a mesh.

**And if no mesh exists, build it procedurally anyway** — added 2026-09-10, after checking rather than
assuming. Four neuroanatomy scenes had been parked as "needs a mesh" for weeks; between them they carry
**zero** BodyParts3D refs across 35 structures. Nothing was coming. A scene waiting on a mesh that does
not exist is a scene that teaches nobody, and "it should be a mesh" is only a real objection when there
is a mesh to have. Where there is not, build it, and escalate honestly if it cannot reach the standard —
that is what `ESCALATIONS.md` is for.

## 6 · Log

| date | what | outcome |
|---|---|---|
| 2026-09-09 | neurulation, procedural, v1–v2 | shipped; layered sheets in contact still unresolved |
| 2026-09-10 | cardiac looping, procedural, v1 | six passes; four machinery bugs found and fixed in `render-kit.js` |

Every structure built after this date uses `render-kit.js`. A structure that reimplements winding,
normals, silhouettes or colour conversion locally is a bug, not a style choice.
