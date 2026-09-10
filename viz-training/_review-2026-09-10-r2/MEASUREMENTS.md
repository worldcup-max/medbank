# cardiac-looping — REVIEW round 2 measurements
2026-09-10, model3d REVIEW task. I did not build this scene.
Everything below was measured on real geometry through the real adapter, not read from a log.

## 1. Round-1 acceptance tests A–D: ALL NOW PASS on the un-mirrored build
Measured on mesh vertex centroids at t = 1 (axes: +x LEFT, +y CRANIAL, +z VENTRAL):

| id | test | measured | verdict |
|---|---|---|---|
| A | ventricle centroid z > 0 (convex ventrally) | +0.554 | PASS |
| B | ventricle centroid x < 0 | −0.548 | PASS (but see finding 3 — this test is mis-specified) |
| C | atrium z − ventricle z < 0 (atrium dorsal) | −1.319 | PASS |
| D | atrium y − ventricle y > 0 (atrium cranial) | +0.446 | PASS |

Round-1 findings 1 and 2 are genuinely fixed. The atrium started 1.48 below the ventricle at t = 0
and now finishes 0.45 **above** it; the AP relation is inverted throughout the sweep in the right
direction. Verified independently, not taken from the build log.

## 2. The `mirror` variant is a ROTATION, not a reflection  (finding 1, critical)
Vertex-level test — every vertex of the D-loop build transformed and matched against the mirror build:

| part | match vs reflect-X (a true mirror) | match vs rot-Y-180 (a rotation) |
|---|---|---|
| sinus | 0.0 % | **100.0 %** |
| atrium | 0.0 % | **100.0 %** |
| ventricle | 0.0 % | **100.0 %** |
| bulbus | 0.0 % | **100.0 %** |
| truncus | 0.0 % | **100.0 %** |
| veins | **100.0 %** | 0.0 % |
| arches | 15.6 % | 21.7 % |
| mesocardium | 0.0 % | 0.0 % |

Chirality: signed volume of the sinus–atrium–ventricle–bulbus tetrahedron is **0.0427 in both
builds, ratio 1.0000**. A mirror image must negate it. The two builds have the same handedness.

Picture proof, one fixed camera, chambers only: the mirror build seen from the front is
**pixel-identical** (sha1 9a4c71e3c9dc) to the normal D-loop simply turned 180° about its long axis.
See `mirror-is-a-rotation.png`.

Consequences:
- The mirrored build fails the model's own acceptance A (ventricle z −0.554, convex **dorsally**),
  C (+1.319) and E (−0.691). `acceptance()` only ever runs un-mirrored, so nothing caught it.
- In view 8 the "L-loop" renders at **79 % of the D-loop's width and 81 % of its silhouette area**,
  because it is the same solid seen from behind. Heights are identical to the pixel — the signature
  of a Y-rotation.
- The three transforms are mutually inconsistent: chambers rotated, veins reflected, arches neither.
  The tube and its poles no longer agree.

## 3. "Side by side" — bulbus vs ventricle separation
Measured centroid separations:

| t | dx transverse | dy cranio-caudal | dz antero-posterior | dominant relation |
|---|---|---|---|---|
| 0.40 | 0.296 | 0.983 | 0.606 | cranio-caudal |
| 0.60 | 0.317 | 0.740 | 0.699 | cranio-caudal |
| **0.65** (stage _b, views 3–4) | **0.319** | **0.675** | **0.714** | **one BEHIND the other** |
| 0.80 | 0.320 | 0.466 | 0.735 | one behind the other |
| 1.00 | 0.305 | 0.136 | 0.691 | one behind the other |

Bounding-box x-overlap at t = 1 is 1.05 units on chambers ~1.56 wide — they overlap in the transverse
axis almost completely at every t.

## 4. Pericardial cavity
| stage | heart h/w/d | sac h/w/d | fill |
|---|---|---|---|
| day 23 | 6.00 / 0.92 / 0.74 | 7.84 / 2.36 / 2.36 | 77 % h, 39 % w, 31 % d |
| day 28 | 3.00 / 2.54 / 3.46 | 4.24 / 4.73 / 4.73 | 71 % h, 54 % w, 73 % d |

The geometry now supports the teaching, but the sac appears on view 1 only, so a student sees one
frame and no crowding.

## 5. Mechanical review — all pass
44/44 refs resolve through the real adapter with geometry · console clean · **0 pixel-identical view
pairs** across all 9 views · builds at t = 0, 0.2, 0.4, 0.6, 0.65, 0.8, 1.0 without throwing · frame
fill 71–79 % of height on 8 of 9 views (view 8 is 87 % wide × 42 % high, two subjects) · no CDN
imports · winding, normals, colour and silhouettes all through render-kit · IIFE confirmed.
