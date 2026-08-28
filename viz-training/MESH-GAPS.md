# Mesh gaps — sub-parts shown as their parent

Every structure listed here is a **landmark on a bone** that the mesh catalog (BodyParts3D, one model
per bone) cannot supply on its own. Isolating it highlights the whole parent bone.

These are not bugs in the scenes — the anatomy is right and the narration is right. They are the
boundary of the catalog. Each one now carries `approx: {shown_as, detail}` in its scene file, and the
player marks it: amber highlight instead of a part colour, a dashed leader, a `≈` on the pin, and a
line in the parts list saying which bone is actually lit.

## How to close one

Two routes, in order of preference:

1. **A landmark anchor.** The renderer can paint a coloured patch onto the parent bone's vertices
   (`anchor: {on, uvw, radius}`) — a measured area, not a guess. This needs someone who can place the
   point on the model to author the `uvw`. Placing it by eye from a textbook is not good enough: a
   patch in the wrong place teaches a wrong location with more authority than no patch at all.
2. **A real mesh**, if a provider ever ships one for that landmark. Then drop `approx` and add the ref.

Until then the marking stands. It is honest, and honest beats absent.

## The list (22)

### `gross__back-vertebral-column__erector-spinae-deep-back-muscles`
- **iliac crest** — shown as the whole **Hip bone** (`hip_bone`)
- **angle** — shown as the whole **Sixth rib** (`rib6`)
- **mastoid process** — shown as the whole **Temporal bone** (`temporal`)

### `gross__back-vertebral-column__spinal-cord-in-vertebral-canal`
- **level of the iliac crests** — shown as the whole **L4** (`l4`)

### `gross__gluteal-region-hip-joint__hip-joint`
- **the socket** — shown as the whole **Hip bone** (`hip_bone`)
- **the ball** — shown as the whole **Femur** (`femur`)

### `gross__gluteal-region-hip-joint__proximal-femur`
- **upper end** — shown as the whole **Femur** (`femur`)

### `gross__kidney-posterior-abdominal-wall__psoas-major-posterior-wall`
- **the iliac fossa** — shown as the whole **Hip bone (right)** (`right_hip_bone`)
- **the lesser trochanter** — shown as the whole **Femur (right)** (`right_femur`)

### `gross__kidney-posterior-abdominal-wall__ureters`
- **the ischial spine turn** — shown as the whole **Hip bone** (`right_hip_bone`)

### `gross__leg-foot__ankle-joint`
- **medial malleolus & roof** — shown as the whole **Tibia** (`tibia`)
- **lateral malleolus** — shown as the whole **Fibula** (`fibula`)

### `gross__leg-foot__arches-of-the-foot`
- **the keystone** — shown as the whole **Talus** (`talus`)

### `gross__leg-foot__popliteal-fossa`
- **popliteal surface** — shown as the whole **Femur** (`femur`)
- **posterior surface** — shown as the whole **Tibia** (`tibia`)

### `gross__pectoral-region-breast__axillary-vessels-lymph-nodes`
- **apex of the axilla** — shown as the whole **Clavicle** (`clavicle`)

### `gross__pectoral-region-breast__clavicle`
- **acromion and coracoid** — shown as the whole **Scapula** (`scapula`)

### `gross__pectoral-region-breast__pectoralis-major`
- **bicipital groove** — shown as the whole **Humerus** (`humerus`)

### `gross__pectoral-region-breast__pectoralis-minor`
- **coracoid process** — shown as the whole **Scapula** (`scapula`)

### `gross__pelvis-perineum__bony-pelvis`
- **the keystone behind** — shown as the whole **Sacrum** (`sacrum`)
- **the lumbosacral angle** — shown as the whole **Fifth lumbar vertebra** (`l5`)

### `gross__pelvis-perineum__pelvic-diaphragm-levator-ani`
- **pubis and ischial spine** — shown as the whole **Hip bone (right)** (`right_hip_bone`)
