# Mesh gaps — sub-parts shown as their parent

A **landmark on a bone** that the mesh catalog (BodyParts3D, one model per bone) cannot supply on its
own. Isolating it highlights the whole parent bone.

These are not bugs in the scenes — the anatomy and the narration are right. They are the boundary of
the catalog. Each carries `approx: {shown_as, detail}` in its scene file, and the player marks it:
amber highlight instead of a part colour, a dashed leader, a `≈` on the pin, and a line in the parts
list saying which bone is actually lit.

## How to close one

**Measure it — never place it by eye.** `viz-training/tools/derive-scapula-landmarks.mjs` is the
worked example: it finds a landmark as the CONTACT point between the parent bone and the structures
that attach there, proves the coordinate frame before it emits anything, and prints the gaps so a
human can check the numbers. Cross-check with more than one attachment where the anatomy offers it —
three converging contacts are evidence; one is a guess with a decimal point on it.

Then replace the `approx` structure with a `render: "anchor"` landmark (`anchor: {on, uvw, radius}`),
repoint the views' ops at the new key, and rebuild the index. An anchor typed in by eye is worse than
a missing one: it puts the words somewhere plausible and the student believes it.

## Closed

- **Coracoid process** (`pectoralis-minor`, `clavicle`) — measured from the convergence of pectoralis
  minor, coracobrachialis and the short head of biceps: gaps 0.20 / 0.16 / 0.14 mm, agreeing to within
  12.8 mm on a 158 mm bone.
- **Acromion** (`clavicle`) — measured as the scapula's contact with the clavicle, the
  acromioclavicular joint: gap 0.99 mm.

## Still open (20)

### `erector-spinae-deep-back-muscles`
- **iliac crest** — shown as the whole **Hip bone** (`hip_bone`)
- **angle** — shown as the whole **Sixth rib** (`rib6`)
- **mastoid process** — shown as the whole **Temporal bone** (`temporal`)

### `spinal-cord-in-vertebral-canal`
- **level of the iliac crests** — shown as the whole **L4** (`l4`)

### `hip-joint`
- **the socket** — shown as the whole **Hip bone** (`hip_bone`)
- **the ball** — shown as the whole **Femur** (`femur`)

### `proximal-femur`
- **upper end** — shown as the whole **Femur** (`femur`)

### `psoas-major-posterior-wall`
- **the iliac fossa** — shown as the whole **Hip bone (right)** (`right_hip_bone`)
- **the lesser trochanter** — shown as the whole **Femur (right)** (`right_femur`)

### `ureters`
- **the ischial spine turn** — shown as the whole **Hip bone** (`right_hip_bone`)

### `ankle-joint`
- **medial malleolus & roof** — shown as the whole **Tibia** (`tibia`)
- **lateral malleolus** — shown as the whole **Fibula** (`fibula`)

### `arches-of-the-foot`
- **the keystone** — shown as the whole **Talus** (`talus`)

### `popliteal-fossa`
- **popliteal surface** — shown as the whole **Femur** (`femur`)
- **posterior surface** — shown as the whole **Tibia** (`tibia`)

### `axillary-vessels-lymph-nodes`
- **apex of the axilla** — shown as the whole **Clavicle** (`clavicle`)

### `pectoralis-major`
- **bicipital groove** — shown as the whole **Humerus** (`humerus`)

### `bony-pelvis`
- **the keystone behind** — shown as the whole **Sacrum** (`sacrum`)
- **the lumbosacral angle** — shown as the whole **Fifth lumbar vertebra** (`l5`)

### `pelvic-diaphragm-levator-ani`
- **pubis and ischial spine** — shown as the whole **Hip bone (right)** (`right_hip_bone`)
