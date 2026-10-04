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

### 2.4b Winding, again — the place the emitter was not used

Found 2026-09-10, and it had been there since the file was written. `sweptShell` closes a SOLID tube
(one with no inner surface — every `tubeAlong`, so every vein, artery, rod and tick in the corpus)
with a flat end cap emitted through `emitter().tri`, which pushes the three vertices in the order it
is handed and corrects nothing. Both branches had been written by reasoning about which way the ring
runs, and both were backwards: measured on a plain `tubeAlong`, **24 of 24** cap triangles were wound
against their own supplied normal.

It never showed. The caps sit inside the hull count, the materials are `DoubleSide`, and the shading
was right because the normals were supplied — which is §2.1's description of itself, arriving again in
the one code path that had bypassed the fix. It surfaced only when a ray-cast probe asked what surface
faces the camera FIRST, and the caps of every vein and dorsal aorta answered "the far one".

> **RULE.** `tri` is the raw primitive and corrects nothing. Any triangle that is not part of a ring
> quad — a cap, a taper, a sheet, a dome pole — goes through `emitter().triN(p1, p2, p3, n)`, which
> decides the vertex order from the geometry rather than from a comment. The corollary is the one
> §2.1 already implies and this proves: **a winding convention that has to be reasoned about at the
> call site will be got wrong at some call site.** The check is a ray-cast, and it is cheap: cast a
> grid of rays from the camera and count how many first hits face AWAY from it. On closed solids the
> answer is zero, and on this model it now is, from five cameras.

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

**A SIGN TEST ON A SPATIAL RELATION IS NOT A TEST.** Added 2026-09-10 after three consecutive review
rounds each cost something to the same shape of mistake. Round 2 found a test whose implementation did
not match its own `must` string. Round 2 found a second that asserted a defect and so locked it in.
Round 3 found a test that was CORRECT, asserted the right relation, and was satisfied by a value so
small the claim was invisible — `ventricle centroid x > 0` passing at x = +0.070 on a chamber 1.329
wide, five per cent of its own width. Its neighbour was the same: `atrium y - ventricle y > 0` passing
at +0.351 while 97.8% of the atrium's vertical extent still overlapped the ventricle's.

> **RULE.** Every acceptance assertion of the form "A is left of / above / behind B" carries a
> MAGNITUDE FLOOR expressed as a fraction of the relevant extent of the structures compared. As a
> starting figure, a separation of at least 35% of the mean of the two extents along that axis. Write
> them as `>= 0.35 * meanExtent`, never `> 0`, and read any existing sign test as UNPROVEN until it
> carries a floor. And where the claim is about a structure's EDGES — "straddles the median plane",
> "reaches as far as" — measure the BOUNDING BOX, not the centroid: a centroid near zero can be had by
> a chamber lying entirely on one side of a curve that crosses.
>
> The deeper rule, which is what the three rounds actually demonstrate: **A TEST THAT CAN BE SATISFIED
> WITHOUT THE PICTURE CHANGING IS NOT MEASURING WHAT THE NARRATION CLAIMS.** The narration is about
> what a student can SEE. The tests should be too.

**DECLARE THE AXES AND PROVE THEM.** Proposed by review round 1 and unwritten until now. A model states
its axis convention in a machine-readable field and the check asserts it against the corpus: RIGHT is
-x, LEFT is +x, CRANIAL +y, VENTRAL +z, measured from BodyParts3D right/left pairs rather than from a
comment. The cardiac-looping model's comment had the sign backwards and nothing noticed, because a
comment is not checked by anything.

**A DECLARED AXIS IS NOT A PROVED ONE, AND A SYMMETRIC MODEL CANNOT PROVE ITS OWN.** Added
2026-09-30 by the review run, on lateral-folding. "DECLARE THE AXES AND PROVE THEM" above asks for the
convention to be measured from BodyParts3D right/left pairs rather than taken from a comment. On a
PROCEDURAL model in its own units that rule silently does not run — lateral-folding is blocked from
gaining a mesh-backed structure until something reconciles scale, so its `-x = RIGHT` is a comment plus
a constant in `ACCEPTANCE.axes`, and the only test that touches a side asserts the lesion is at `x < 0`,
which is the same statement rather than a check on it. Measured voxel-wise, every structure that model
draws is mirror-symmetric in x apart from the lesion itself: there is no left/right landmark in it at
all. So flipping the sign in the header leaves every acceptance row passing and mirrors the picture,
teaching left-sided gastroschisis with nothing anywhere to catch it — which is precisely the
cardiac-looping failure this standard already records, reappearing in the one place the fix cannot
reach.

> **RULE.** A model whose axes cannot be measured against mesh-anchored right/left pairs must either
> (a) carry a landmark that is independently right/left determined and assert the convention against
> it, or (b) have its declared `axes` string checked, by a corpus-level test, against a model that IS
> mesh-anchored. Until one of those exists, any narration claim that names a SIDE is UNPROVEN, and the
> scene says so in `gaps[]` rather than letting the comment stand as the proof. A model with no chiral
> content cannot witness its own handedness, and an acceptance test written in the same coordinates as
> the declaration is circular, however carefully it is floored.

**A SPATIAL CLAIM IN NARRATION IS A TESTABLE ASSERTION.** Also round 1. When a view says one part ends
up behind, above, right of or inside another, that is one line of arithmetic against the two bounding
boxes at that view's `t` — and it must be evaluated at the `t` THE VIEW IS DRAWN AT, not only at the
end. "The inflow end comes to lie behind and above the ventricles" is a check, not a caption.

**A MIRRORED VARIANT MUST BE PROVED TO BE A REFLECTION.** Round 2. Chirality is implied by none of the
checks here: triangle count, outward-normal fraction, negated mean x and untouched winding ALL pass on
a 180-degree rotation, and all four were cited as proof of an "L-loop" that was a rotation. The test is
one line — the signed volume of four named landmark centroids must be NEGATED, not preserved — and it
belongs in the model's `acceptance()`, asserted on the MIRROR build, which is the build `acceptance()`
otherwise never touches. Note the corollary, because §2.1 above actively pushes an author the wrong
way: §2.1 makes reversed winding the cardinal sin, so a mirror written to leave winding untouched
feels like the careful choice. It is the opposite. **A genuine enantiomer MUST reverse winding.** If a
mirror needed no rendering change at all, it is not a mirror.

**EVERY ACCEPTANCE TEST NEEDS A NEGATIVE CASE.** Round 2. A test that grades its own homework in the
wrong units is worse than no test: it launders a defect into a proof. Every id in an ACCEPTANCE block
gets a deliberately wrong input it must reject, the way `validate-scenes` negative-tests its checks.

**A PROBE WITH A DEGENERATE CASE MUST REPORT THE DEGENERACY.** Round 3. The mirror chirality probe
divided by a signed volume that is exactly zero at `t = 0`, where a straight tube has no handedness to
reverse, and reported CANNOT MEASURE as MEASURED AND WRONG — firing a warning on every `t = 0` mirror
build. A warning that is a known false alarm trains every future run to ignore the channel it prints
on, and it did: it cost an unrelated item its console-clean check.

**A TUBE THAT ENDS IN MID-AIR NEEDS A ROUNDED END, NOT AN ANNULUS.** Added 2026-09-10 by the round-3
build run. `sweptShell` closes every span with an annular end cap, which is right at an internal waist
where the neighbouring segment overlaps it and wrong at a TERMINAL end, where the annulus reads as an
open pipe — a wall ring with a lit inner surface, the one thing this document says must never be
visible. Found at the caudal end of the sinus venosus; the same defect at the cranial end of the same
tube had been found a round earlier and "fixed" by re-pointing the camera away from it, which closed no
hole and only moved it to the next view. Use `VizKit.domeCap`. And note the general form, which is
worth more than the fix: **a camera is not a fix.** If the answer to a visible defect is a different
viewpoint, the defect is still there, in the unlisted place.

**A REFERENCE MUST SURVIVE THE VIEW THAT USES IT.** Round 3. The median-plane reference was added so
that "mirror image about the median plane" would be a visible claim rather than a caption, and the only
view that HIGHLIGHTs it showed 125 of its 3,525 pixels — 96.5% occluded, because the rod lay at z = 0,
behind a loop whose ventral surface reaches z = +1.68. Nothing measured it. Render the view with and
without, difference the frames, and count. Note also what the obvious fix would have been and why it is
wrong: a translucent quad IN the median plane is seen exactly edge-on by an anterior camera, because
the median plane contains that camera's view direction. What a plane gives a camera looking along it is
its TRACE, and the fault was never that the reference was a line — it was that the line was buried.

**A TIME-VARYING SCENE CHECKS ITS OWN NARRATION AGAINST THE MODEL, BEAT BY BEAT.** Added 2026-09-29,
proposed by the review task on 2026-09-23 after two rounds on the cardiac-cycle item, and implemented
in the same round it was proposed. Of the eight defects found on that item across those two rounds,
FOUR were the same shape: the model was right, and the SCENE pointed at an instant where its own
narration was false. Beat 7 said "all four valves are shut" at a `t` where the pulmonary valve
measured 0.82 open. Beat 4 said "flow peaks here" at 36% of peak. Beat 3 promised a picture it did
not draw. Beat 9 narrated a diastasis that existed at no `t` at all.

The model's acceptance battery grew from 19 rows to 30 between those rounds and still could not have
caught one of them, and the reason is structural rather than an oversight: **every row tested the
model against physiology, and no row tested the SCENE against the model.** Row X asserted that an
all-shut window exists. Nothing asserted that beat 7 sat inside it.

> **RULE.** Every view of a time-varying scene carries its narrated claims as machine-checkable
> `claims[]`, evaluated against the model at THAT VIEW'S OWN `SET_STAGE` t — at minimum every valve
> state, the chamber volume, and any rate, duration or fraction the narration quotes as a number.
> `tools/check-beat-claims.mjs` runs them. It is mechanical and it is cheap: 76 claims on the
> cardiac-cycle scene, and on its first run it found two defects two review rounds had missed.
>
> **AND EACH BEAT MUST FAIL WHEN IT IS MOVED.** The claims are re-evaluated at t ± 0.05 and t ± 0.15
> of a cycle and at least one must fail at each, or the beat is reported as NOT PINNED to its own
> instant — a claim set that is true 40 ms away would not have caught any of the four above. A beat
> that genuinely stands for an INTERVAL rather than an instant (diastasis is 0.104 of a cycle wide)
> declares a wider near displacement in the scene, where a reviewer can see it and argue with it; the
> far displacement is not negotiable, so declaring an interval cannot buy a beat out of the check.
>
> **THE COROLLARY IS THE MORE IMPORTANT HALF.** A beat whose claim is true at NO `t` is a MODEL
> finding, not a narration finding, and must not be fixed by rewriting the narration. Beat 9 was
> fixed by giving the model a diastasis, not by deleting the word. Where the model then still falls
> short of the physiology the narration teaches — the aorta storing 73% of the stroke volume where a
> real one stores about half — the narration stays and the shortfall is declared in `gaps[]` with the
> number, because editing a teaching sentence to agree with an approximate model teaches something
> false about the body in order to make a check go green.

**AN ACCEPTANCE MEASUREMENT MUST BE A FUNCTION OF THE BUILT GEOMETRY.** Added 2026-09-23 by the
review of lateral-folding, which arrived carrying two acceptance tests whose measured side was a
compile-time constant. `m.H = (1 - 0.92 * 1 * 1) / (1 - 0)` is the mesentery's taper law evaluated by
hand and typed in; `m.J`'s separation is `|(Y_UMB - 0.72) - Y_UMB|`, where `Y_UMB` cancels. Neither
touches a vertex, a row or a grid. Both carried a magnitude floor. Both had a negative case. Both
passed, and were reported as proof — and J's claim, that the exstrophy defect is clear of the
umbilical ring, was FALSE in the geometry: the wall gap never returns to zero between them.

The two rules above this one are why that happened. A magnitude floor disciplines the COMPARISON. A
negative case disciplines the PREDICATE — it feeds the floor a wrong number and checks it is rejected,
which tests the `>=` and nothing else. Neither rule says one word about where the measured number came
from, so a constant satisfies both perfectly.

> **RULE.** The measured side of every acceptance assertion must be read from the geometry the model
> builds — rows, grids or mesh vertices — and never from the constants the geometry was built from.
> Restating a shape law in the test that checks it proves only that the author can do the arithmetic
> twice. The check is a PERTURBATION: change the constant the geometry uses and the reported number
> must move. If it does not, the test is not measuring the model, and a test that cannot fail is not
> evidence, however carefully its floor was chosen.
>
> The corollary for a reviewer, because this is the form the fault takes: a test whose value is
> identical on every build, and identical to a number you can compute by reading the source, has not
> measured anything. Both of lateral-folding's did, and the build notes described one of them as
> "measured".

### 3.x A SCENE MUST BE WALKED AS THE PLAYER DRAWS IT, NOT AS THE HARNESS DOES

Every proof tool in this corpus renders `build(t)` with every layer on, at full opacity, with the
camera fitted ONCE to the whole model. The player does none of those three things. `viz3d.js` resets
every structure to visible, applies the view's ops, applies each structure's own `opacity`, and
**refits the camera per view** to the bounding box of what is still visible. The proof frames
therefore prove the geometry and prove nothing whatever about the pictures a student looks at.

The cardiac-cycle item is what put this here. It passed three review rounds, a 34-row acceptance
battery with 30 negative cases, a 76-claim beat check, an outward-normals probe and a full adapter
resolution pass. Its own `gaps[]` said, for three rounds running, "nobody has yet loaded this scene
into viz3d.js and walked its ten beats" — and behind that one sentence sat eight defects. The aortic
valve changed 0.000% of the frame in all six beats whose narration pointed at it. The tricuspid
changed 0.000% in nine beats of ten. Two beats highlighted a structure that drew nothing. The two
beats that promise "the wall is taken away here so you can see the four rings" drew opaque blood
casts over the rings. None of the other checks could see any of it, because none of them was looking
at the picture.

> **RULE.** No time-varying scene may be marked `built` until every structure each beat DRAWS or
> POINTS AT has been shown to survive that beat, measured on a frame composed the way the player
> composes it — ops applied, per-structure opacity applied, camera refitted to the visible set. Any
> structure that legitimately does not survive carries a waiver in `scene.visibility_waivers`
> giving the reason and, where one exists, naming the beat that does show it. A waiver is an
> argument someone wrote down; quietly lowering a threshold is not.
>
> `viz-training/tools/measure-scene-visibility.mjs` implements this and exits non-zero. It counts
> twice — by id-pick, which is geometric occlusion, and by rendering the beat with and without each
> structure and differencing the frames, which is alpha-aware — and a structure clears a bar if
> EITHER measure clears it. That is deliberate: a valve seen through a 0.38-opacity blood cast is
> exactly what a teaching diagram draws, and the id-pick alone reads it as invisible. The tool's one
> weakness is stated in its own header: it reimplements viz3d's ops rather than driving viz3d. If
> the two ever disagree, viz3d is right.

### 3.y A BEAT THAT NARRATES A SHAPE MUST ASSERT THAT SHAPE AGAINST ITS OWN CAMERA

Proposed by the review task on 2026-09-29 after finding the same defect twice on one item, and
adopted the same day by the build run that fixed it. Both times the MODEL was right and the PICTURE
carried nothing.

- Round 1, `heart-valves` beat 5: the narration gave a mitral coaptation depth of 0.685 cm below the
  annular plane and a coaptation line 0.34 R posterior of the annular centre. The model predicted
  both correctly. No camera in the scene could show either, because a shut mitral valve is a closed
  dome and the coaptation line is inside it.
- Round 2, same item, beat 9: the narration called the two arterial annuli crowns, "dipping to the
  floor of each sinus and rising to each commissure", from a superior camera. The crown rises
  1.30 cm along the ring's OWN axis — and from above that axis IS the view axis, so a crown and a
  flat ring draw the same picture. Measured after the fact: a superior camera keeps 0.151 cm of that
  rise across the screen and an anterior one keeps 1.298 cm.

Every acceptance row in this corpus asks the MODEL a question. None of them asks the PICTURE one, so
a correct model pointed at the wrong camera passes everything. The machinery already existed —
`heart-valves` row AB asserts that beat 5's camera is within 45° of the section's normal — and was
simply never applied to a shape claim.

> **RULE.** A beat that narrates a SHAPE — a curve, a rise, a depth, a difference in size — carries a
> claim measuring that property AS PROJECTED ON TO THE SCREEN PLANE OF THE CAMERA THAT BEAT ROTATES
> TO, not in the model's own frame. The model exposes the measure through `claimMeasure` so the
> assertion lives in the beat that makes the claim and moves with it; the model's `VIEW_DIR` table is
> COPIED from viz3d rather than restated, so the player's cameras and the probe's cannot drift apart.
> Where two claims want incompatible cameras, that is two beats. It is never one beat and a hope.
>
> Worked example: `models3d/heart-valves.js` section 12a, and rows AE and AF. Measures
> `crown.<valve>`, `crownAcross.<valve>.<view>`, `ringArea.<valve>.<view>` and
> `ringAreaRatio.<a>.<b>.<view>`. Row AF is the sharper half of the rule: from a superior camera the
> four annuli keep their stated size order on screen with ≥ 8% between neighbours, and from an
> ANTERIOR one the order does not survive at all (mitral 1.330 cm² against pulmonary 1.408) — so the
> beat that compares the four has exactly one camera it can stand at, and the row says which.

### 3.z A MODEL THAT BUILDS MORE THAN ONE SOLID PROVES THEY DO NOT SHARE SPACE

Proposed by the review task on 2026-09-29 and adopted the same day. `cardiac-cycle-pumping` proves
its LV and RV casts do not interpenetrate, by ray-cast containment, and reports 0.0%.
`heart-valves` had 31 parts and no such row — and a hand measurement in a review note had already
found one overlap, which is a claim in a file rather than a check that can fail.

> **RULE.** A model that builds more than one closed solid asserts, over every pair of parts whose
> bounding boxes meet, that neither lies inside the other. Contact that is CONSTRUCTION rather than
> anatomy — a leaflet continuous with its own annulus and its own cords, a ghost envelope that is
> meant to contain everything, a sectioned half that is the same surface as the whole it was cut
> from — is excluded BY NAME, in a partition the row publishes, never by a tolerance. Anything left
> over is either a defect or a declared consequence of something the model does not build, and in
> the second case the row pins it at its measured size so it cannot grow.
>
> Worked example: `models3d/heart-valves.js` section 12b and row AG. It found what four review
> rounds and 28 acceptance rows had not: the right coronary ostium passes 0.71 mm into the pulmonary
> annulus — a second and sharper instance of the un-modelled subpulmonary infundibulum already
> declared in that scene's `gaps[]`, and one that puts an examinable landmark inside the wrong
> valve. Round 2's review had checked the ostia against the pulmonary ROOT (0 of 198 vertices) and
> passed; nothing had checked them against the pulmonary CROWN.

### 3.aa A SCREEN-PLANE MEASURE IS COMPUTED OVER WHAT THE BEAT DRAWS, NOT OVER THE PAIR IT IS ABOUT

Proposed by the review task on 2026-10-01 (round 4 of `lateral-folding`) and written here by the
build run that fixed it the same day. 3.y above says a beat that narrates a shape must assert it on
that beat's own screen plane. It does not say what the measure must have on that plane, and that is
the hole: a measure can project the two things the claim names, agree with the narration perfectly,
and be blind to whatever the beat draws in front of them.

`lateral-folding` beat 6 is the discriminator beat of an exam-relevant pair — omphalocele against
gastroschisis, "is there a membrane?" — and claim B6-membrane certified `sac.covers_omphalocele_frac`
at 1.0000 against a floor of 0.95. That measure projected exactly two things: the herniated loop's
path dilated by its tube radius, and the sac's centre and radius. Measured on the built triangles in
that beat's own camera, by depth-buffering every structure the beat actually drew, the omphalocele
CORD was the nearest surface to the viewer (max depth 3.816, against the sac's 3.001 and the loop's
2.616) and the first surface over 32.8% of the loop's footprint. A third of what the claim called
"drawn under the sac" was drawn under an opaque flesh-coloured rod. 38 beat claims, 21 acceptance
rows, 9 visibility beats and four review rounds all passed with that in the picture.

This is the fifth instance of ONE fault on that item, which is why it is worth a rule rather than a
fix: test J certified a claim about geometry it never read; test H restated its own taper law; claim
B9-two-cords measured a gap ALONG an axis and was blind to being INSIDE a sphere; the pixel version
of "plugged" counted the far side of the same layer. Every time, the measured side was not a function
of the thing the claim is about.

Note also what does NOT catch it. The visibility walk of 3.x is a per-structure threshold, so it
passed the defective frame: with the cord shown, `omphalocele_gut` still reached 1.996% of the frame
through the membrane, over a 0.3% floor — the numbers only read as a defect once you compare them
with the fixed frame's 4.483%. "Every structure is visible" and "the right thing is in front of the
subject" are different questions.

> **RULE.** A claim about what covers, occludes, is under, is behind or is in front of something is
> measured by FIRST HIT along that beat's camera axis, over the whole list of structures the beat
> shows — not over the pair the claim names. Anything drawn in front counts against the claim,
> whatever it is. The measure reads the BUILT GEOMETRY (3's own rule): a dilated-proxy stand-in is
> not acceptable here, because a proxy that fattens a sheet occludes through the very window the
> beat exists to show. A shown structure the measure cannot resolve to geometry FAILS the row — it is
> never skipped, because a measure that cannot see something is the fault being fixed. Where the
> model keeps its own copy of a beat's shown list so acceptance can run with no scene loaded, the
> render harness asserts that copy against the scene's own ops, so the two cannot drift. And the
> perturbation that proves the measure (3's "must be a function of the built geometry") is putting
> the occluder BACK into the shown list: the number must fall.
>
> Then decide the composition on the number. Either the occluder leaves the beat or it moves clear —
> and dropping it is the cheaper answer whenever the claim it carried is already made, at the same
> floor, in a beat that can actually show it.
>
> Worked example: `models3d/lateral-folding.js` `sacSeen()` / `seenAt()` / `SEEN_BEATS`, acceptance
> row M-seen, floors SACSEEN and BARESEEN, and section 13 of
> `viz-training/tools/render-lateral-folding.mjs`. The fix took beat 6 from 0.6728 to 1.0000 with
> nothing in front, by dropping `omphalocele_cord` from the beat: acceptance row O already asserted
> that `anterior` keeps 0.0000 of a cord's length, so all it contributed there was a cream disc, and
> its claim B6-cord-sac was the identical measure and floor to B10-on-sac in the profile beat that
> does show the insertion. Moving the cord instead was rejected on the geometry — a cord leaves the
> umbilicus ventrally, which IS the anterior camera's axis.

### 3.ab A CONTINUOUS STRUCTURE IS MEASURED IN CONNECTED FRAGMENTS, NOT IN TOTAL PIXELS

Added 2026-10-02 by the model3d review run, from `embryology__week-3-gastrulation__notochord`.

`measure-scene-visibility.mjs` passed that scene's beat 6 with **0 failures**, and by its own
definition it was right: the definitive notochord had plenty of pixels on screen. What it could not see
is that the pixels arrived in **four disconnected pieces**. Three opaque sclerotome drums enclosed the
rod — `hemi` does not cut them, because they are not sheets — and from the beat's `lateral` camera the
near wall of each drum sat between the student and the midline. The rod showed as its cranial end, its
caudal end, and two sixteen-pixel slivers in the inter-drum gaps.

The geometry was never wrong. The rod is ONE welded component at every `t`. Winding, signed volume,
watertightness, the six-camera ray cast, the adapter walk and the coverage floor all passed, because none
of them asks the question. **A continuous structure drawn in pieces teaches a segmented one**, and for the
notochord that is the single error ARTWORK-STANDARD section 3 names as this corpus's canonical failure —
arriving here through occlusion rather than through geometry, one beat before the beat titled
"Round it, not from it".

> **RULE.** For any structure a beat narrates as continuous — a rod, a tube, a vessel, a nerve, a
> continuous sheet — measure the number of CONNECTED COMPONENTS of the pixels it is responsible for, by
> rendering the beat with and without that structure and differencing the two frames at a
> clearly-visible threshold. **More than one component is a finding, whatever the total coverage.**
> Report the fragment count beside the coverage figure; coverage alone cannot distinguish a rod from a
> row of beads.

Two corollaries worth having:

1. **Fixing it by part-opacity needs the same measure, because the obvious value makes it worse.** On
   beat 6, dropping the occluder to 0.7 and 0.6 gave **13 and 10** fragments — a dotted line, worse than
   the four it replaced. Only 0.4 and below gave one. A translucency chosen by eye is a guess; render it
   and count.
2. **Run the measure over every beat's subject before trusting it, so it cannot cry wolf.** On the same
   scene, beat 8's `nucleus_pulposus` returns four near-equal fragments and that is CORRECT — there are
   four intervertebral discs. The rule is about structures the narration calls continuous, and a
   fragment count is a question to answer, not an automatic defect.
3. **WHICH FRAME, AND AT WHAT THRESHOLD — added 2026-10-02T19:55Z by the model3d review run (review
   round 2 on the notochord), because the rule as first written did not say, and two rounds
   disagreed about the same beat as a direct result.** Round 1 reported beat 6's rod as **1**
   fragment; round 2 reported **3**, and neither was wrong about its own arithmetic. Round 1
   measured the HARNESS frame at 10/255; round 2 measured the PLAYER frame at the tool's 40/255
   "clearly visible" floor. The rule said "a clearly-visible threshold" and named no frame, so both
   readings were in compliance and the disagreement cost a round.

   > **The frame is the PLAYER frame, always.** `measure-scene-visibility.mjs` exists because the
   > proof frames "prove the geometry and prove nothing whatever about the ten pictures a student
   > actually looks at", and 3.ab is a rule about what a student sees. A harness frame fits the
   > camera to the whole model with every layer at full opacity, so it does not even apply the
   > per-structure opacity that a fix under corollary 1 consists of; it is the wrong picture for
   > this question and will keep over-reporting fragments. **The threshold is the tool's own
   > 40/255.** Report both — frame and threshold — beside the count, so a later round can tell
   > whether it is looking at the same measurement.

   > **A break that the overlying geometry draws is not a fragment.** Round 2's three components on
   > beat 6 were separated by TWO-PIXEL hairlines at the sclerotome drum seams — the rim edge of an
   > occluder drawn across the rod, which the with/without difference scores as absence. Looked at,
   > the rod is one unbroken dark column from one end of the frame to the other. So: **a gap
   > narrower than about 4 px that lies on an occluder's own edge is an artefact of the difference
   > method, not a visible break.** Discount it, say in the log that you did, and give the count
   > both with and without the discount. The question this rule asks is whether a student sees
   > beads, and a two-pixel line is not a bead.

   The notochord's beat 6 is CLOSED on this rule as of review round 2: **1** visible component on
   the player frame at 40/255 after discounting two rim hairlines, with `sclerotome` at opacity 0.4.
   The HARNESS frame of that beat still reads as four pieces and always will, for the reason above.
   **Do not re-open it from a proof frame.**

### 3.ac A WALK THAT REIMPLEMENTS THE PLAYER MUST REIMPLEMENT ITS MATERIAL STATE, NOT ONLY ITS OPS

Added 2026-10-03 by the model3d review run, from `amniotic-cavity-yolk-sac`.

3.x above makes `measure-scene-visibility.mjs` the authority on what a student sees, and states its one
weakness as "it reimplements viz3d's ops rather than driving viz3d. If the two ever disagree, viz3d is
right." Everybody read that as being about OPS — `HIDE_STRUCTURE`, `SET_STAGE`, `ROTATE_TO_VIEW`, the
camera refit. The ops were right. The MATERIAL was not, and nothing in this document said it had to be.

The walk applied each structure's authored opacity with `transparent = true; opacity = s.opacity` and
stopped there, leaving three's default `depthWrite: true`. viz3d sets `depthWrite: op >= 0.98` in two
separate places (viz3d.js:610 and the paint() path at :2419), and `render-kit.js`'s `tissueMaterial`
carries the identical rule with a comment explaining that a lung authored at 0.32 had filled the frame
without it. Three implementations of the rule, and the one that decides pass/fail was the one that
missed it.

What it does is subtle and it looks exactly like anatomy. A `DoubleSide` translucent shell with
depthWrite on **occludes itself**: the far half of its own surface writes depth before the near half is
drawn, and the near half is then rejected, in one wedge per azimuthal segment along the limb. On
`amniotic-cavity-yolk-sac` every large shell carried that band in every beat that showed it, and the
diagnostic ladder of section 4 ran its whole length against it — finer tessellation (which is what had
fixed a sawtooth on the item before, so it was the obvious cause and it was wrong), silhouettes off,
every other structure removed one at a time, and a 1000x sweep of the near plane. The geometry was
immaculate the entire time: constant wall thickness, every normal on the correct side, zero unpaired
edges, no seam.

> **RULE.** A tool that composes the player's frame reimplements the player's MATERIAL state as well as
> its ops — at minimum `transparent`, `opacity` and `depthWrite`, because those three are set together
> in viz3d and a frame composed from two of the three is a different picture. Where the player derives
> one material property from another, the tool derives it the same way, from the same expression, and
> says in a comment where it was copied from. The check is cheap and it is the one this would have
> failed: render one translucent `DoubleSide` closed shell, alone, and look at its limb. A clean
> silhouette means the material state agrees. A sawtooth means it does not, and **every number that
> tool reports is being read off a picture the player never draws** — the ink, the alpha peaks that
> decide the 40/255 floor, and every fragment count 3.ab asks for.

The corollary is why this is a rule and not a bug report. **A measurement tool's defects do not read as
tool defects — they read as findings against whatever is being measured.** This one had already
manufactured one: beat 8's `connecting_stalk` measured 2 connected components with the largest holding
84.5% of its ink, which is textbook 3.ab, a structure the narration calls continuous drawn in pieces.
It is 1 component at 99.4% once the tool draws what the player draws. A review round spent sending that
back would have been a round spent asking a build run to fix a picture that was already correct — and
3.ab's own corollary 3 exists because two earlier rounds had already disagreed about a fragment count
on a different item for a related reason. Fragment counts, coverage percentages and alpha peaks are
only ever as good as the frame underneath them, so when a measured picture disagrees with the geometry
on every other check, **suspect the frame before the model.**

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
5. **A comb of translucent wedges along a shell's limb is DOUBLE-SIDED BLEND ORDER until proved
   otherwise.** Render the part ALONE, then opaque, then with `side: FrontSide`, then outer surface
   only, then inner surface only, then with `depthTest` off. If opaque or FrontSide removes it and
   `depthTest` off does not, it is the shell's own inner surface blending against its outer surface
   in the wrong order, and no neighbour and no depth setting is involved. Proposed by the model3d
   REVIEW task on 2026-10-03 after exactly that six-way elimination on `amniotic-cavity-yolk-sac`'s
   amnion at t = 0.93 — as-is PRESENT, opaque GONE, FrontSide GONE, outer only GONE, inner only
   PRESENT, depthTest false PRESENT — one mesh alone in an empty scene, so nothing else could be
   implicated. Adopted here by the build run the same day, because it belongs ABOVE the depth rung:
   the run before it swept the depth buffer, finer tessellation, silhouettes off and a 1000x
   near-plane sweep before reaching the answer.

   **FrontSide is safe for a watertight, correctly-wound shell in any non-section view, and is NOT a
   free switch.** `viz3d.js` builds every player material with `side: T.DoubleSide` centrally
   (viz3d.js:609) with no per-structure override, and every `_cut`/`_cutz` beat in this corpus needs
   DoubleSide to show a cut face. So this is an ENGINE change that re-proves all 146 scenes, not a
   model change — a model that meets this artefact should DECLARE it, name this rung, and not
   reimplement its own materials to dodge it.

6. **Only then reason about depth precision.** Depth-buffer explanations are seductive and were wrong
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

## 5.5 · How much mesh a structure gets, and why a flat cap is always wrong

Added 2026-09-10. This is a gap the standard had: §5 said where procedural belongs and where meshes
belong, and nothing at all about how much mesh.

Every mesh in the corpus had been decimated to the same flat cap — 3,000 triangles, a handful
hand-raised. A flat cap is the wrong shape for the problem twice over. It spends the same budget on
the femur a scene is ABOUT as on the twelfth rib sitting behind it for context. And it is blind to
how many meshes a scene loads: the femur scene loads nineteen, the intercostal scene thirty-five, and
a number that is generous for one is ruinous for the other.

**What the cap was costing was not polish, and not the thing we expected.** A lumbar vertebra at
3,000 triangles still has every process and every facet — the before/after is nearly identical, and
the worry that started this was, on bone, unfounded. The damage was on muscle. The external oblique
at 8,000 is a smooth slab; at 76,733 its fibres are legible across the whole belly, running
inferomedially. Rectus abdominis gets its tendinous intersections back. **Fibre direction is how a
student tells external oblique from internal, and external intercostal from internal** — it is
examined. The cap was deleting the one feature that identifies the muscle.

> **RULE.** Resolution is a PER-SCENE budget, never a per-mesh cap, and the budget is measured rather
> than chosen: the heaviest scene already known to load. A scene under budget at full scan resolution
> is left alone entirely. A scene over it shares the budget in proportion to source complexity —
> which recovers "detail where the teaching is" from the geometry itself, without needing the `role`
> field, because the subject of a scene is nearly always its most complex mesh. Floor at 6,000; a rib
> at 6,000 is indistinguishable from its 44,634-triangle scan. Never give a mesh less than it already
> ships. `tools/apply-mesh-budget.mjs` implements this. Do not decimate by hand.

> **RULE.** Always decimate with `--verify`. It measures how far the surface actually moved, in mm,
> and refuses any file whose bounding box shifted — landmark anchors are `uvw` fractions of that box,
> so a box that moves silently moves every landmark on the bone. Across the whole corpus the worst
> surface deviation is 0.489 mm and no box moved at all.

> **RULE.** A loader's give-up clock measures SILENCE, never elapsed time. Raising resolution broke
> the intercostal scene the same day it shipped: the adapter gave up 12 seconds after each request
> started, so the scene mounted with 32 of its 35 structures and the three it dropped were the
> external, internal and innermost intercostals — every muscle the scene exists to teach, leaving a
> bare rib cage. Measured side by side against the live bucket: a flat 12-second timeout killed a
> download at 12.5 s with 2,368,058 of 3,931,984 bytes already in hand and sixty progress events
> received, while a 15-second stall timer re-armed on progress finished the same file in 15.7 s. A
> flat timeout does not drop meshes at random. It drops the biggest, and the biggest mesh in a scene
> is nearly always its subject — the same shape of bug as the flat decimation cap above.

**A budget derived from a scene must leave that scene alone.** The first version of this rule used
the vertebral column's current weight, 419,568 triangles. That scene ships 47 of its 48 meshes at
full source and the sacrum capped, so its SOURCE total is 443,984 — over its own budget. The rule
promptly reallocated it and cut T5 from 9,834 back to 6,000. If the scene you measured is not a fixed
point of the rule you derived, the rule is measuring something other than what it claims.

## 6 · Log

| date | what | outcome |
|---|---|---|
| 2026-09-09 | neurulation, procedural, v1–v2 | shipped; layered sheets in contact still unresolved |
| 2026-09-10 | cardiac looping, procedural, v1 | six passes; four machinery bugs found and fixed in `render-kit.js` |
| 2026-09-10 | mesh resolution, whole corpus | flat 3,000 cap replaced by a per-scene budget; 254 of 494 meshes now at full scan resolution; muscle fibre direction recovered |
| 2026-09-10 | cardiac looping, round-3 rework | curvature model enriched (per-bend plane twist, a fifth bend); every spatial test given a magnitude floor; `triN` and `domeCap` added to the kit |
| 2026-09-29 | cardiac cycle, round-3 rework | diastole rebuilt — venous reservoir and exponential EDPVR; per-beat claim checking added as a standing rule and a tool |

Every structure built after this date uses `render-kit.js`. A structure that reimplements winding,
normals, silhouettes or colour conversion locally is a bug, not a style choice.

## 7 · `VizKit.fitCamera` FRAMES CORRECTLY ONLY FROM THE ±z AXIS

*Added 2026-10-03 by the model3d REVIEW task, reviewing `chorion-placenta-early`. The build run that
converted that item measured this and wrote it into its `built_notes` "for RENDER-STANDARD and not
just for this item". It never reached this file, so it is written here now, re-measured
independently rather than copied — §4 of the review prompt: do not silently work around a gap.*

`render-kit.js:659`:

```js
const dist = Math.max((s.y / 2) / Math.tan(vFov / 2), (s.x / 2) / Math.tan(hFov / 2))
  * (margin || 1.05) + s.z / 2;
```

`s.y` is taken as the screen's vertical, `s.x` as the screen's horizontal and `s.z` as depth —
**with no reference to the view direction at all.** That mapping is true only for a camera on ±z.
From `lateral` (+x) the screen's horizontal axis is world z and the depth axis is world x, so the
two terms are swapped and an anisotropic subject is framed at the wrong distance.

Measured on `chorion-placenta-early`'s magnified specimen strip — 1.6 × 6.2 × 33.1 mm, viewed from
`lateral`, 32° fov, 1:1 aspect:

| | distance |
|---|---|
| `VizKit.fitCamera` | 27.9 |
| `viz3d.js` `distanceForBox` (viz3d.js:2155) | 61.4 |

fitCamera sits **2.20× too close**: the frame is 16.0 mm across where the subject is 33.1 mm, so
48% of it is on screen and **two of the four villus sections are cropped out of the plate entirely**.

**The player is not affected.** `viz3d.js` `distanceForBox` builds the screen axes from `dir` and
projects the box onto them, which is exact for any direction. The bug is in the KIT, so it bites
the offline harnesses — and therefore the pictures a review run looks at, which is worse than a
bug a student sees, because it is a bug that hides other bugs.

**Known affected harnesses** (both call `VizKit.fitCamera` and render from `lateral`):
`tools/render-bilaminar-embryonic-disc.mjs`, and `tools/render-cardiac-looping.mjs`, which is the
reference harness every later one was copied from. `tools/render-chorion-placenta-early.mjs` already
frames the way the player does and is the worked example of the fix.

**The rule.** A harness that renders from any direction other than `anterior`/`posterior` must not
use `VizKit.fitCamera` for its distance. Either copy `distanceForBox` from `viz3d.js` — as
`render-chorion-placenta-early.mjs` does, and as 3.y already requires for the `VIEW_DIR` table — or
fix `fitCamera` itself to take the direction. Fixing the kit is the better repair and is NOT done
here: `fitCamera` is called by every model in the corpus and changing its framing would move every
committed plate at once. That is a change for a run that can re-render and re-review the corpus,
not a side effect of reviewing one item.

**Why no existing check caught it.** Every framing check in the battery asks whether the subject
fits the frame *as that harness computes the frame*. A harness whose distance is wrong agrees with
itself. The check that finds this compares the harness's distance against the player's for the same
box and direction, and that is the check `measure-view-framing.mjs` should grow.

| date | what | outcome |
|---|---|---|
| 2026-10-03 | `fitCamera` view-direction blindness | measured on the chorion specimen strip: 2.20× too close from `lateral`, 2 of 4 panels cropped; rule written, kit deliberately left unfixed |
