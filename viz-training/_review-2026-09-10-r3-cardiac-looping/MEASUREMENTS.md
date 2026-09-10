# cardiac-looping · REVIEW round 3 · measurements

Every number in this round's findings, with the method. Produced by a run that did NOT build this
scene and did not use the builder's own provers.

**Axes** (the model's own, and independently consistent with viz3d's anterior camera):
`+x = embryo LEFT`, `-x = RIGHT`, `+y = CRANIAL`, `+z = VENTRAL`.

**Method.** `models3d/cardiac-looping.js` + `render-kit.js` + three.js loaded by `<script src>` from a
static server into headless Chromium — the same substrate the build task uses, but a harness written
for this review (`probe.mjs`, `probe2.mjs`, `render.mjs`, `vis.mjs`). Centroids and bounding boxes are
taken from **real mesh vertices transformed to world space**, not from the centreline, so they are
independent of `measureLoop()`. Outline meshes carry no normal attribute and are excluded from the
normals fractions.

---

## 1 · Mechanical review — what passed

- **Builds at every `t` in 0, 0.2, 0.4, 0.6, 0.65, 0.8, 1.0 without throwing.** No errors.
- **Console clean — after this round's correction (a).** Before it, every `t = 0` mirror build emitted
  `MIRROR IS NOT A REFLECTION`, a false alarm on the guard's own degenerate case. Now 0 console lines
  across all seven `t` plus the mirror build.
- **Key resolution.** The model builds exactly 11 keys — sinus, atrium, ventricle, bulbus, truncus,
  veins, arches, endocardium, mesocardium, midline, pericardium. Every `structures[].refs.procedural`
  in the scene names one of those 11; every one of the 11 is named by a view or declared in `gaps[]`
  (`mesocardium@1` is the declared one). Passes.
- **Normals, per mesh, against that mesh's own centroid:** myocardial segments 0.512–0.517. That is the
  documented thick-walled-shell figure (outer surface out, inner surface in, in near-equal counts), not
  a defect. veins 0.94–1.00, arches 0.61–1.00, midline 1.00, pericardium 1.00.
  Mesocardium cuffs 0.103 / 0.655 — a thin curved sheet, where the meaningful check is winding; the
  builder declared this and it is not a new defect.
- **No two consecutive views share the (structure set + highlight + rotation + section) tuple.** Views 3
  and 4 come closest: identical structure set and camera, different highlight. Passes the rule as
  written — but see finding 6 for what that near-identity costs anatomically.
- **Nothing imported from a CDN**; no local reimplementation of winding, normals or colour — the sweep,
  the reflection and the emitter all go through `render-kit.js`.

## 2 · Round 2's four findings — independently re-verified as FIXED

### Finding 1, the mirror. FIXED, confirmed three ways, none of them the builder's prover.

| test | round 2 measured | this round |
|---|---|---|
| vertex match vs true reflect-X | 0.0% (chambers) | **1.0000 on all 11 parts** |
| vertex match vs rot-Y-180 | 100.0% | **0.0000 – 0.0020** |
| signed volume ratio D:L | **+1.0000** (a rotation) | **−1.0000** (a reflection) |

The signed volume was recomputed here from **mesh centroids** (D −0.05029, L +0.05029), not from the
centreline tetrahedron the model's own `mirrorProof()` uses, so it is an independent measurement.
Vertex counts are identical part for part. `veins` and `midline` and `pericardium` also match the
identity, because they are symmetric about x — expected, not a disagreement.
And in the picture: `v9-mirror-anterior.png` against `v6b-stage-c-anterior-nosac.png` is a clean
left-right flip at the same size, where round 2 measured the "L-loop" at 79% of the D-loop's width.

### Findings 3 and 4, side-by-side and the ventricle's side. Geometry re-solved; tests now pass.

All nine acceptance tests pass, and are **stable across integration density** — nseg 140 / 300 / 600:

| | A | B′ | bvx | C | D | E | F | G | H | H@0.65 | I |
|---|---|---|---|---|---|---|---|---|---|---|---|
| nseg 140 | +0.632 | −0.598 | −0.715 | −0.797 | +0.408 | +0.356 | −0.670 | +0.581 | +0.314 | +0.183 | +0.072 |
| nseg 300 | +0.635 | −0.607 | −0.715 | −0.800 | +0.417 | +0.352 | −0.677 | +0.599 | +0.325 | +0.188 | +0.070 |
| nseg 600 | +0.635 | −0.608 | −0.715 | −0.801 | +0.416 | +0.352 | −0.678 | +0.602 | +0.326 | +0.188 | +0.070 |

Worst drift 300→600 is 0.003. The builder's shipped numbers are reproduced. See findings 2 and 3 below
for why passing these tests is not the same as satisfying the narration.

### Finding 5, the pericardial sac at two stages. FIXED — `peri_a` on view 1, `peri_c` on view 6.

---

## 3 · Round 3's findings — the numbers

### F1 · The atrium and the sinus venosus finish entirely on the embryo's LEFT

Mesh bounding boxes at `t = 1`:

| part | x range | verdict |
|---|---|---|
| atrium | **+0.151 … +2.017** | **entirely** left of the median plane; does not cross it at all |
| sinus | −0.085 … +1.716 | **95.3%** of its width left of the median plane |
| ventricle | −0.593 … +0.736 | straddles |
| bulbus | −1.251 … −0.074 | entirely right — correct, this is the D-loop convexity |

Centroids: atrium **+1.101**, sinus **+0.729**, ventricle +0.072, bulbus −0.574, truncus −0.213.
The builder declared this at centroid level (+1.14) and could not solve it out. The bounding box makes
it worse than the centroid does: the common atrium does not merely sit off-centre, it never reaches the
midline, and the sinus venosus — the structure whose right horn becomes the sinus venarum — is a
left-sided structure in this model.

### F2 · The atria are not above the ventricles

At `t = 1`:

- atrium y **[−2.714, −0.514]**, height 2.200
- ventricle y **[−3.100, −0.563]**, height 2.538
- **overlap 2.152 = 97.8% of the atrium's own vertical extent**
- centroid separation D = **+0.351**, i.e. 16% of the atrium's height

Test D asks only `atrium y − ventricle y > 0`, which +0.351 satisfies. The picture does not.
For contrast the dorsal relation is genuinely legible: C = −0.80, with atrium z [−0.809, +0.558]
against ventricle z [−0.229, +1.684] — 58% overlap, not 98%.

### F3 · The ventricle finishes on the median plane, not to the left

Ventricle centroid x = **+0.070** on a chamber **1.329 wide** — 5% of its own width. Test I
(`ventricle x > 0`) passes on the sign. A student looking at views 4, 6 and 8 sees a ventricle in the
middle.

### F4 · The sinus venosus is an open pipe at its caudal end

`sweptShell()` closes each segment with **annular end caps**, and `OVERLAP = 0.006` hides the caps at
the four internal waists — but not at the tube's two terminal ends. `gaps[10]` records that view 9 was
tried from ABOVE and rejected because it "looks straight down the truncus and shows its open lumen —
the one thing RENDER-STANDARD says must never be visible". The **caudal** end of the sinus has the same
cap and was not worked around: it is visible from the plain **anterior** camera at stage `_b`, which is
the camera and the stage views 3 and 4 both use. See `crop-sinus-b.png` — the wall ring and the lit
inner surface are unambiguous. The veins pass across the opening without plugging it.

### F5 · The median-plane reference is invisible in the view that needs it

The midline is a rod of **radius 0.030** plus three ventral ticks reaching only to `z = +1.15`, while
the heart's ventral surface reaches `z = +1.684`. In view 9's own camera:

- midline pixels if nothing occluded it: **3,525**
- midline pixels **actually visible**: **125**
- **96.5% occluded**; 0.081% of the subject's 154,711 pixels

Measured by differencing view 9's camera with and without `midline:true` (`m9-all.png`,
`m9-nomid.png`). The reference added in round 1 to make "mirror image about the median plane" a visible
claim rather than a caption does not survive its own view.

### F6 · Views 3 and 4 narrate two sequential movements over one frozen stage

Both draw stage `_b` (`t = 0.65`) with an identical structure set and camera, differing only in
highlight. All four bends grow together with `t`, so no `t` separates movement one from movement two:
at `t = 0.65` the ventricle has already swung dorsally whatever view 3's title says, and at `t = 1` all
three movements are complete. `gaps[2]` declares the per-structure-`t` mechanism but not this
consequence.

### F7 · Not a defect — recorded because it looked like one

`veins_c` is used on views 1–4, alongside stage `_a` and `_b` chambers. The veins are **byte-identical
at every t** — same 11,136 vertices, same centroid (0.000, −2.887, −0.182), same hash — so the suffix is
cosmetic and `gaps[5]`'s claim that they are genuinely t-invariant is **true**. Checked because the
arches are stage-matched and the veins are not, which looked like the same defect half-fixed. It is not.
The arches do move: centroid y **+3.780 → +1.517 → +0.317**.
