# Mesh gaps — sub-parts shown as their parent

The mesh catalog (BodyParts3D) has one model per bone and none for the landmarks on them. A scene that
needs to point at the coracoid process, the lesser trochanter or the medial malleolus therefore cannot
show it as a mesh — it can only *mark the place on the parent bone*, with a measured anchor
(`render: "anchor"`, `anchor: {on, uvw, radius}`), which the renderer paints as a patch.

Until a landmark is measured it carries `approx: {shown_as, detail}` instead, and the player is honest
about it: amber highlight, dashed leader, `≈` on the pin, and a line in the parts list naming the bone
that is actually lit.

## The method

**Measure it on the mesh. Never place it by eye.** An anchor typed in from a textbook puts the words
somewhere plausible and the student believes it.

    node viz-training/tools/derive-landmark.mjs --parent FMA24474 --contact FMA22342 --name "lesser trochanter"
    node viz-training/tools/derive-landmark.mjs --parent FMA24480 --extreme -z --name "lateral malleolus"
    node viz-training/tools/derive-landmark.mjs --parent FMA24477 --extreme +x --slab z:0,0.15 --name "medial malleolus"

Two kinds of definition:

- **CONTACT** — the nearest point on the parent to a mesh that attaches or articulates there. An
  attachment is a place where two surfaces meet, so the meeting point IS the landmark; the gap in mm
  says how well they meet. More than one witness is much better than one: three structures that attach
  to the same process should converge on the same few millimetres, and that convergence is the proof.
- **EXTREME** — the furthest point in a stated direction, optionally within a stated slice of the bone.
  For features defined by position rather than by what touches them: the lateral malleolus is simply
  the lowest point of the fibula.

BodyParts3D is LPS — **+X = the body's LEFT, +Y = POSTERIOR, +Z = SUPERIOR** — and every run prints the
side and long axis of the parent so a definition written against the wrong axis is obvious immediately.

The tool refuses to emit when a contact gap exceeds 3 mm or witnesses scatter over more than a quarter
of the bone. A refusal is a result: it means the definition is wrong, not that the tool failed.

## Doing a batch

`viz-training/landmark-plan.json` holds one row per landmark — the scene, the parent structure, the new
key and label, the definition, and *why* that definition is the right one in one line.

    node viz-training/tools/run-landmark-plan.mjs            # measure everything, change nothing
    node viz-training/tools/run-landmark-plan.mjs --apply    # write the scenes

`--apply` puts the parent bone's label back to the bone, removes `approx`, inserts the anchored
landmark with its measurement recorded in `calibrated_by`, and repoints the views' ops at the new key.
Then rebuild: `node viz-training/tools/build-scene-index.mjs` and `node viz-training/tools/validate-scenes.mjs`.

A row can also say `drop`, for a label that was never an approximation at all — the sacrum IS the
keystone of the pelvis, the talus IS the keystone of the arches, and L4 marks a *level* rather than
carrying a feature. Those just lose the marking.

## What the narration still needs

`--apply` does not split the narration: the landmark inherits the text that was written about it and is
flagged `status: "needs-review"`. Deciding which sentences describe the bone and which describe the
feature is authoring, not measurement, and the tool has no business guessing at it.

## Measured (17)

- **Iliac crest** — `erector-spinae-deep-back-muscles` · iliocostalis lumborum arises from the crest
- **Angle of the sixth rib** — `erector-spinae-deep-back-muscles` · iliocostalis thoracis inserts on the rib angles
- **Mastoid process** — `erector-spinae-deep-back-muscles` · longissimus capitis inserts on the mastoid
- **Acetabulum** — `hip-joint` · the socket is where the femur meets the hip bone
- **Head of femur** — `hip-joint` · the ball is where the femur meets the hip bone
- **Upper end of the femur** — `proximal-femur` · the upper end is the top of the bone
- **Iliac fossa** — `psoas-major-posterior-wall` · iliacus fills the fossa
- **Lesser trochanter** — `psoas-major-posterior-wall` · psoas major inserts on the lesser trochanter
- **Ischial spine** — `ureters` · coccygeus arises from the ischial spine
- **Medial malleolus** — `ankle-joint` · the medial malleolus is the most medial point of the lower tibia (right leg: medial is +X)
- **Lateral malleolus** — `ankle-joint` · the lateral malleolus is the lowest point of the fibula
- **Popliteal surface of the femur** — `popliteal-fossa` · the popliteal surface is the posterior aspect of the lower femur
- **Posterior surface of the tibia** — `popliteal-fossa` · the floor of the fossa is the posterior aspect of the upper tibia
- **Bicipital groove** — `pectoralis-major` · both heads of pectoralis major insert on the lateral lip of the groove
- **Lumbosacral angle** — `bony-pelvis` · the angle is the L5/S1 junction
- **Body of the pubis** — `pelvic-diaphragm-levator-ani` · pubococcygeus arises from the body of the pubis
- **Ischial spine** — `pelvic-diaphragm-levator-ani` · coccygeus arises from the ischial spine

## Still open (1)

- **apex of the axilla** — shown as the whole **Clavicle** (`axillary-vessels-lymph-nodes`, `clavicle`)

The axillary apex was **refused** by the tool, correctly: it is the gap between the clavicle and the
first rib, and those two surfaces are 3.27 mm apart, so there is no contact point to measure. A space
bounded by three bones is not a landmark on any one of them. It needs either a different definition
(the midpoint of the three boundaries) or a scene that shows the space itself.
