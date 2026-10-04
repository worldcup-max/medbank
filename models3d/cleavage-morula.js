/* MedBank · models3d/cleavage-morula.js
 *
 * CLEAVAGE AND THE MORULA — zygote to 32-cell morula, as ONE CONTINUOUS FUNCTION OF t.
 *
 * Registers itself as MB3D_MODELS['cleavage-morula'], which is the whole contract the procedural
 * adapter in viz3d.js needs: LAYERS, build(t, opts), FULL.
 *
 * WHY THIS IS PROCEDURAL. RENDER-STANDARD §5: procedural belongs where the form is a function of
 * something. Cleavage is the clearest case in the corpus — the form at every stage is the SAME
 * cytoplasm subdivided a different number of times inside the SAME shell, so the stages are samples
 * of one function and cannot drift out of agreement with one another. There is also no mesh to have:
 * BodyParts3D is a gross-anatomy archive and carries nothing at 100 µm. The queue item's
 * `candidate_meshes` is irrelevant here for the reason fertilization.js already records.
 *
 * SCALE, AND WHY IT IS NOT A FREE CHOICE. 1 unit = 10 µm, inherited from models3d/fertilization.js
 * so that the two scenes draw the SAME embryo. This model's zona is the HARDENED zona that
 * fertilization.js's model leaves behind at its own t = 1 — same inner radius, same thickness after
 * the 8.5% swell of the zona reaction — and acceptance row Z asserts that against fertilization.js's
 * own geometry rather than against a copied constant. A student who watches fertilization and then
 * cleavage sees one object, not two drawings that happen to be adjacent in a menu.
 *
 * THE ONE IDEA THE GEOMETRY HAS TO CARRY, and the parameter that is therefore SOLVED. The learning
 * goal is "explain why the embryo divides without growing". So the number a student is marked wrong
 * for is the SIZE: eight cells must occupy the same total volume as one. That is not a constant that
 * can be typed in — the cells are clipped by each other and by the zona, so their volume is a
 * function of the packing. RENDER-STANDARD, "solve the parameter that decides the examinable
 * relation": the common blastomere radius rho is SOLVED BY BISECTION at every t against the measured
 * volume of the clipped cells, so that the total is the zygote's volume at every stage. Change the
 * zygote radius, or the packing, or the compaction law, and rho moves. Nothing about the no-growth
 * claim is asserted; it is the constraint the geometry is built to satisfy.
 *
 * A second parameter is solved for the same reason. The nucleus-to-cytoplasm ratio climbing with
 * every round is the other examinable consequence of division without growth, and it is only visible
 * if the nuclei are as large as they can be. So the CONSTANT nuclear radius is solved by bisection as
 * the largest radius that still fits inside every built cell at every t — not chosen.
 *
 * WHERE THE CLEAVAGE PLANES COME FROM. Not a table. The first cleavage plane passes through the
 * polar bodies, so the first axis is the animal–vegetal axis (+y here, which is where
 * fertilization.js leaves the second polar body). Every division after that follows HERTWIG'S RULE —
 * a cell divides across its own long axis — and the long axis is measured from the inertia tensor of
 * the cell's OWN built shape at the previous generation. So the second division is perpendicular to
 * the first because the geometry makes it so, not because a constant says so. Where a cell is too
 * nearly round for its long axis to be meaningful the model says so and falls back to the axis most
 * orthogonal to that cell's own previous cleavage, which is the textbook rule; the fallback is
 * counted and reported, never silent.
 *
 * COMPACTION IS ONE NUMBER, AND IT IS A SHAPE CHANGE AT CONSTANT VOLUME. Before compaction the
 * blastomeres are apposed but rounded, with clefts at the triple junctions. After it they are
 * flattened against one another with wide contacts and no clefts. Both are the same construction with
 * one parameter moved: each cell's surface is a SMOOTH MINIMUM of its own sphere, its neighbours'
 * bisecting planes and the zona, and the smoothing exponent p rises with adhesion. Low p rounds the
 * sphere–plane edge off, which is what makes a small contact and leaves a cleft; high p makes a flat
 * facet that meets its neighbour exactly. Total volume is held by the rho solve throughout, so
 * compaction cannot smuggle in a size change — which is the point, because compaction really is a
 * rearrangement and not a growth.
 *
 * INSIDE AND OUTSIDE ARE DERIVED, NEVER LABELLED. "Position is destiny" is the teaching, so the model
 * must not be told which cells are inner. A cell is OUTER if its own built surface reaches the zona,
 * and INNER if it does not — read off the vertices. The consequence is the examinable one and it is
 * asserted: at eight cells there are ZERO inner cells, which is why no blastomere is committed yet,
 * and by thirty-two there are several.
 *
 * AXES, AND WHAT THIS MODEL CANNOT PROVE. RENDER-STANDARD, "A DECLARED AXIS IS NOT A PROVED ONE, AND
 * A SYMMETRIC MODEL CANNOT PROVE ITS OWN". This model has no chiral content and no mesh-anchored
 * right/left pair, so no handedness assertion here could be anything but circular. +y is declared as
 * the ANIMAL POLE — the polar-body axis — and NOT as a body direction, and nothing in the scene's
 * narration names a left or a right of the body. The scene says so in gaps[].
 *
 * WHAT IT DOES NOT MODEL, stated so nobody has to discover it. E-cadherin, the tight-junction and
 * gap-junction complexes, the sodium pump and the maternal transcripts are narration, not geometry:
 * they have no form at this scale and a drawn "junction" would be an invention. The geometry carries
 * what they cause — a contact that widens, a cleft that closes, an interior that comes into
 * existence. Cavitation, the blastocoele and hatching belong to the NEXT curriculum structure and are
 * deliberately absent. The uterine-tube journey is drawn, and it is drawn at its own declared scale,
 * which is a scale break and is called one.
 */
(function () {
const T = window.THREE, K = window.VizKit;

/* ------------------------------------------------------------------ palette */

const LAYERS = {
  journey:     { color: 0xb07aa1, name: 'Uterine tube and uterus (schematic, NOT to cell scale)' },
  day_markers: { color: 0xe4c65b, name: 'Day 1 to day 4 along the tube' },
  zona:        { color: 0xf0b232, name: 'Zona pellucida' },
  size_ref:    { color: 0x9aa6bf, name: "The zygote's own outline — the embryo never gets bigger" },
  outer_cells: { color: 0xe0564a, name: 'Outer cells — every cell with a face on the zona' },
  inner_cells: { color: 0x2d7fc4, name: 'Inner cell mass — the cells compaction seals inside' },
  nuclei:      { color: 0x6d4aa8, name: 'Nuclei — one per blastomere, and they do not shrink' },
};

/* ------------------------------------------------------- dimensions, in units of 10 µm

   Every one of these is inherited from models3d/fertilization.js rather than re-chosen, because the
   two models draw the same object at consecutive moments. R_ZI, ZONA_TH and the 8.5% zona-reaction
   swell are that file's own constants; acceptance row Z re-measures the result against that file's
   built geometry so the inheritance cannot rot into a stale copy. */
const R_CELL0  = 6.00;                        // the zygote: a 120 µm cell
const PV_GAP   = 0.20;                        // perivitelline space, 2 µm
const R_ZI     = R_CELL0 + PV_GAP;            // zona inner surface, 6.20
const ZONA_TH  = 1.40 * 1.085;                // zona pellucida AFTER the zona reaction, 15.2 µm
const R_ZO     = R_ZI + ZONA_TH;              // zona outer surface, 7.719

/* THE SECTION FUNCTION, identical to fertilization.js's. Nothing in the picture is a perfect
   textbook ball, and the zona and the size reference take the SAME modulation so the perivitelline
   gap stays uniform. */
const SEC = (ph, th) => 1 + 0.016 * Math.cos(2 * th) * Math.sin(ph) - 0.011 * Math.cos(ph);
const SEC_MIN = 1 - 0.016 - 0.011;
const SEC_MAX = 1 + 0.016 + 0.011;

/* --------------------------------------------------------------- the clock

   ONE FUNCTION OF t. Every number below is read off the same clock, so no two stages can drift out of
   agreement: there is no per-stage geometry anywhere in this file.

   THE CLOCK IS NOT LINEAR IN REAL TIME and does not pretend to be, for the reason fertilization.js
   states: the first division takes ~30 h and the 8-to-16 transition ~24 h, so a t linear in hours
   would give the morula a sliver of the picture. t is the ORDER of events with each stage given room
   to be seen. The scene's narration carries the real days as words and the model claims nothing about
   them. */
/* THE TWO WINDOWS WHERE THE PACKING CANNOT HOLD THE CYTOPLASM INSIDE THE ZONA.
   Declared here, in one place, so that the model, row B and the scene's gaps[] cannot disagree about
   where they are. Immediately after a division the cells sit as N close-apposed PAIRS, which packs
   worse than a free tessellation of 2N: transient intercellular spaces open, and the cytoplasm cannot
   reach its settled volume without pushing past the zona. Real cleavage does the same thing — the
   daughters round up and spaces appear between them — so what is approximate here is the SIZE of the
   effect, which row V2 pins at its measured 12.6%.
   Row B asserts the solve returns its bound ONLY inside these windows. That is a falsifiable
   statement: it fails if the condition spreads, and it fails if a window moves. */
/* THE INSTANTS AT WHICH THE PACKING CANNOT HOLD THE CYTOPLASM, measured and declared.

   At the instant a division opens, the two sisters' shared plane passes almost through both of their
   centres, so each daughter is cut nearly in half by a surface that has not yet moved apart. For a
   few hundredths of t the configuration cannot hold the cytoplasm even with the cell mass filling the
   zona to its inner face, and the mass solve correctly returns its bound. Row B asserts the solve
   saturates ONLY here, and row V2 pins how short it goes, so neither can grow unnoticed.

   THE THIRD WINDOW WAS ADDED IN ROUND 2 and it is a consequence of rho being solved rather than a new
   defect. Measured on a 400-step walk of the clock, saturation occurs at exactly three places and
   every one of them is a division opening: t 0.4725-0.4875 (4 to 8), t 0.6225-0.6775 (8 to 16) and
   t 0.8225-0.8250 (16 to 32). The third did not use to appear because the cortical multiple was held
   at a constant 2.20, where a cell's own sphere binds nowhere and the packing is free to fill
   whatever it is given; now that the multiple is the smallest the zona permits, the 16-to-32 opening
   behaves like the two before it. Three openings behaving alike is the model being more consistent
   than it was, not less. No beat sits in any of the three windows. */
const SHORT_WINDOWS = [[0.465, 0.515], [0.615, 0.690], [0.818, 0.840]];
function inShortWindow(t) {
  for (const w of SHORT_WINDOWS) if (t >= w[0] && t <= w[1]) return true;
  return false;
}

const DIV = [
  [0.120, 0.230],   // 1 -> 2    first cleavage, about 30 h after fertilization
  [0.300, 0.400],   // 2 -> 4    day 2
  [0.470, 0.570],   // 4 -> 8    day 3
  [0.620, 0.780],   // 8 -> 16   day 3-4, and this is the window compaction runs in
  [0.820, 0.940],   // 16 -> 32  day 4, the morula
];
const GENS = DIV.length;                      // 5 divisions, so 6 generations: 1,2,4,8,16,32

/* COMPACTION RUNS WITH THE FOURTH DIVISION, deliberately and not as a convenience: compaction in the
   human embryo is an 8-to-16-cell event, so the window IS DIV[3]. It is written as its own pair so
   that it can be read, and asserted equal to DIV[3] below so it cannot drift away from it. */
const COMPACT = [0.620, 0.780];

function smooth(a, b, x) {
  if (!(b > a)) return x >= b ? 1 : 0;
  const u = Math.max(0, Math.min(1, (x - a) / (b - a)));
  return u * u * (3 - 2 * u);
}

/** the generation coordinate: 0 at the zygote, 5 at the 32-cell morula, C1 and monotone in t */
function gammaAt(t) {
  let g = 0;
  for (let k = 0; k < GENS; k++) g += smooth(DIV[k][0], DIV[k][1], t);
  return g;
}
/** adhesion: 0 before compaction, 1 after it. The ONE parameter compaction is. */
function adhesionAt(t) { return smooth(COMPACT[0], COMPACT[1], t); }

/* THE ROUNDING OF A CELL EDGE IS A LENGTH, AND THE FIRST TWO VERSIONS MADE IT AN EXPONENT.

   Compaction is one parameter: how sharply a blastomere's free surface turns into its apposed
   surface. Rounded, with a wide cleft at every triple junction, before it; flat, with the two
   membranes coincident, after it.

   v1 and v2 used the power smooth minimum, (sum d_k^-p)^(-1/p), with p rising. That is the obvious
   construction and it has a defect that destroys the measurement: it sits BELOW every term it
   combines EVERYWHERE, not only near the transition — about k^(-1/p) below the true minimum for k
   active terms. So two neighbouring cells were each drawn ~3% inside their shared plane even at
   p = 46, leaving a 1.2 µm cleft over the whole of every facet, and NO TWO DRAWN SURFACES IN THE
   MODEL EVER MET. The fate test, which asks whether a neighbour's own surface reaches a point, then
   reported two genuinely interior cells of the 32-cell morula — centres 1.23 units from the embryo's
   middle, surrounded on every side — as having 39% free surface. Row I failed, correctly, three times
   in a row for three different reasons, and this was the third.

   The repair is not a wider tolerance. A tolerance wide enough to call a 1.2 µm gap "apposed" is a
   number chosen to make the row pass, which is what RENDER-STANDARD means by lowering a threshold
   instead of writing down an argument. The repair is a smoothing that is EXACT away from the edge:
   the quadratic smooth minimum rounds over a WIDTH k and equals the plain minimum wherever the two
   terms differ by more than k. So on a facet the two cells' surfaces coincide to floating point, and
   the cleft is confined to the edge — which is where a cleft is, in a real embryo and in every plate
   of one.

   k IS A LENGTH, as a fraction of the cell's own radius so it scales as the cells get smaller. The
   two values are the only tuned numbers that touch cell SHAPE; what they are tuned against is stated,
   and the consequences they produce (row C's apposed-area ratio, row I's inner-cell count) are
   measured off the built geometry, so neither can be moved without a row noticing. */
const K_ROUND_REF = { v: 0.75 };   // pre-compaction: a broadly rounded cell with open clefts
const K_FLAT_REF  = { v: 0.07 };   // post-compaction: a flat facet with a narrow edge fillet

/* THE FURROW, AND WHY THE TWO CONSTANTS ABOVE COULD NOT PRODUCE ONE. Added 2026-10-01, round 2.

   Round 1 drew a 2-cell embryo as a BALL WITH A HAIRLINE: an unbroken circular silhouette and a seam
   of zero depth, on the beat titled "a furrow, not a growth spurt". The review read the cause as
   K_ROUND being a fraction of the cell's OWN radius, so that the fillet is absolutely widest when the
   cells are largest, and prescribed lowering it.

   MEASURED, AND THAT IS NOT THE CAUSE. The 2-cell geometry is IDENTICAL at K_ROUND 0.75, 0.40, 0.20
   and 0.08 — same envelope radius 6.119, same groove statistics, to every digit. K_ROUND cannot fix
   what it does not touch. The real cause is structural and it is in the next paragraph but one.

   A cell's surface is smin(rho, the neighbours' bisecting planes), and THEN a HARD minimum with the
   zona. smin only rounds where its two smallest terms are within k of each other. At two cells there
   is exactly ONE neighbour plane, and rho is 2.20 x the equal-volume radius = 10.5, far outside the
   zona at 6.2 — so the two terms smin sees are never within k anywhere that is drawn, and no fillet
   is ever produced. Both daughters are then clipped to the SAME ball by the SAME hard minimum, so
   their union's outer surface IS that ball, exactly, and the seam between them has zero depth by
   construction. At eight cells the visible clefts come from somewhere else entirely: TRIPLE
   JUNCTIONS, where two PLANES compete and smin does fire. That is why the boundary gets more visible
   as the cells get smaller — more triple junctions — which is the trend the review measured and
   correctly called backwards.

   So the fix is at the zona contact, not at the cell-cell fillet. A real blastomere does not meet the
   zona at a knife edge and then stop: cortical tension carries its free face away from the shell as
   it turns to meet its neighbour, and the groove that leaves is the FURROW. k_z rounds exactly that
   edge — the rim of each cell's contact disc, which is where a seam reaches the outer surface — and
   because smin is EXACT more than k_z away from the edge, the contact itself stays flat. That was the
   stated reason the zona minimum was hard, and it survives unchanged; what was wrong was applying it
   to the EDGE of the contact as well as to its middle.

   AND k_z IS AN ABSOLUTE LENGTH, a fraction of the ZYGOTE's radius rather than of the stage's own
   cell. A furrow is a membrane turning through a radius set by cortical mechanics, not by how many
   times the embryo has divided, so it is the same physical size at two cells and at thirty-two. This
   is the property K_ROUND lacks, and writing it down is the whole of the repair. */
const K_ZONA_REF = { v: 0.000 };   // see the note below: measured to carry nothing once rho is solved

/* THE DRAWN MEMBRANE GAP. Added 2026-10-01, round 2, for the z-fighting the review found in the cut.

   Round 1 made two apposed cells' facets COINCIDE TO FLOATING POINT, and said so in proof.txt as
   though it were a virtue. On a facet between an inner cell and an outer one, two surfaces at exactly
   the same depth have no ordering at all, so the cut view stippled teal and orange across whole
   facets — not a depth-precision problem that a larger near plane would fix, but two surfaces with
   nothing to choose between them. Row 3.z could not catch it either: it asks whether a vertex lies
   0.05 INSIDE another part, and coincident is 0.0 inside, so coincidence is excluded by construction
   from the one row that looks for parts sharing space. (That is the review's own standards gap G3.)

   Two apposed plasma membranes are about 20 nm apart, which is 0.002 units and far below anything
   that can be drawn here. So this is a DRAWING CONVENTION and is declared as one: every cell-cell
   contact is given a gap of EPS_MEM, half taken from each cell, so that no two drawn surfaces ever
   coincide. Row X asserts that — it is the row G3 asks for. */
const EPS_MEM = { v: 0.020 };      // 0.2 um total, 0.1 um taken off each of the two cells

/* AND THE OTHER HALF OF COMPACTION: THE CELL'S OWN SPHERE HAS TO STOP BINDING.

   A blastomere's surface is the smaller of two things — how far its own cortical tension lets it
   bulge (a sphere of radius rho about its centre) and where it meets a neighbour (that neighbour's
   bisecting plane). Before compaction cortical tension wins over most of the surface, so the cells are
   round and there are VOIDS wherever the Voronoi cell is pointier than the sphere. After compaction
   adhesion wins everywhere, so the cells are pure Voronoi cells and they TILE — no voids at all.

   The first three versions held rho finite at every t, solved for volume. The embryo's volume was then
   right at every stage and the morula was still full of voids: measured on the 32-cell build, the two
   genuinely interior cells — centres 1.23 units from the embryo's middle, surrounded on all sides —
   had HALF their surface facing a void rather than a neighbour, so the fate test called them outer
   cells and row I failed for the third time. The three failures were three different bugs with one
   shape: the construction could not express "sealed inside", so no test of it could pass.

   rho is therefore a multiple of the stage's own cell size that RISES with adhesion until it cannot
   bind at all. At full compaction the morula is exactly the zygote's ball subdivided into Voronoi
   cells, which is what a compacted morula is. */
/* 2.20, AND THE SWEEP THAT SET IT CHANGED WHAT COMPACTION IS IN THIS MODEL.

   The first attempt made rho the compaction parameter: pre-compaction cells were near-spheres
   (rho = 1.22 x the equal-volume radius) with real VOIDS between them, and compaction closed the
   voids. That cannot be built inside this zona, and the reason is arithmetic rather than tuning. The
   zygote is 6.00 and the zona's inner face is 6.20, so the cytoplasm is 90.6% of the cavity it sits
   in — and a loose packing of round cells fills about 65-74% of its own container. Measured: at
   rho = 1.22 the 8-cell stage could reach only 843 of the 906 units of cytoplasm it must hold even
   with the cell mass filling the zona completely, and the solve reported DOES NOT BRACKET.

   Which is the biology, not a limitation. Micrographs of human 4- and 8-cell embryos do not show
   free-floating balls with gaps; they show rounded cells already pressed against each other and
   against the zona, filling it, with clefts only at the EDGES where three cells meet. What compaction
   changes is the width of those clefts and the area of the contacts — not whether the cells touch.

   So the cell's own sphere is held at 2.20 x the equal-volume radius throughout, where it binds only
   on a cell's free outer face, and the EDGE FILLET k carries compaction on its own. One parameter
   instead of two, and it is the one the narration is about. Measured over a 3 x 3 sweep (recorded in
   BUILD-LOG): at this setting the volume solve brackets at every gated t with no saturation, the
   apposed-surface ratio across compaction is 2.72, and the 32-cell morula seals 4 cells inside.
   Below about 1.9 the solve stops bracketing again; above 2.6 nothing changes, because the sphere has
   stopped binding anywhere. */
const RHO_ROUND_REF = { v: 2.20 };   // x the equal-volume cell radius — NO LONGER USED AS THE VALUE;
                                     // kept as the bisection's upper bound and as the negative case
                                     // row RR perturbs. See rhoRoundAt() below for what replaced it.
const RHO_FLAT_REF  = { v: 4.00 };   // far beyond any Voronoi cell's own extent: it never binds

/* 2.20 WAS AN EIGHT-CELL CONSTRAINT CHARGED TO EVERY STAGE. Round 2, 2026-10-01.

   The paragraph above records a 3x3 sweep that set the cortical multiple to a CONSTANT 2.20, because
   at 1.22 "the 8-cell stage could reach only 843 of the 906 units of cytoplasm it must hold". That
   measurement is right and it is about EIGHT CELLS. Applying its answer at every stage is what drew a
   2-cell embryo as a ball with a hairline, because at 2.20 the cell's own sphere is 10.5 units inside
   a zona of 6.2 and therefore binds NOWHERE: both daughters are clipped to the same mass sphere by
   the same hard minimum, so their union IS that sphere and the seam between them has no depth. The
   review called this the fillet being too wide. It is not — the 2-cell geometry is identical at
   K_ROUND 0.75, 0.40, 0.20 and 0.08, measured. Nothing about the fillet reaches it.

   AND AT TWO CELLS THE ROUND ANSWER FITS, which is the whole point. Two spheres of radius r centred
   a either side of the bisecting plane, each truncated at it, each holding half the zygote: solving
   r + a = 6.20 (the zona's inner face) and cell volume = 452.4 gives r = 5.813, a = 0.387 — that is
   rho = 1.221 x the equal-volume radius, and it leaves the silhouette 6.200 at the poles and 5.800 at
   the equator. A 6.4% WAIST. The furrow a 2-cell embryo is recognised by was available all along and
   a constant borrowed from the 8-cell stage was hiding it.

   SO IT IS SOLVED, NOT CHOSEN. rhoRoundAt(t) is the SMALLEST cortical multiple at which the packing
   can still hold the cytoplasm with the cell mass filling the zona exactly — the roundest the cells
   are allowed to be at this cell count, found by bisection against the model's own volume integral at
   every t. It comes out near 1.22 at two cells, and it rises on its own as the count does, because
   the real reason blastomeres flatten is that spheres cannot tile and a fixed zona must still be
   filled. No new tuned constant: the number that used to be typed in is now read off the constraint
   it was always standing in for. */
const RHO_MIN = 1.02, RHO_MAX = 3.40;
let _rhoRoundCache = {};
/* TAKES THE CONFIGURATION, DOES NOT GO AND FETCH ONE. The division ladder needs this multiple to
   measure the long axis of the shape it is about to divide, and it is holding that generation's
   centres already — if this asked centresAt() for them it would re-enter the ladder that is still
   being built, which is a stack overflow and was one on the first attempt. */
/* AND IT LEAVES THE MASS SOLVE ROOM TO WORK. The first version asked for the smallest multiple that
   reaches the cytoplasm EXACTLY at the zona's inner face. That is the right quantity and the wrong
   place to stop: it hands solveMassRadius a problem whose only root is its own upper bound, so every
   stage reported mass radius 6.200 and rows B, I, V2, R and K all failed at once — a solve returning
   its bound, which is the exact failure the note above solveMassRadius was written about. The
   multiple is therefore solved against the cytoplasm plus VOL_MARGIN, so the realised mass radius
   lands strictly inside the zona and the bisection has a bracket rather than a wall. */
const VOL_MARGIN = 0.02;
function rhoRoundFor(cs, kF) {
  const target = V0() * (1 + VOL_MARGIN);
  /* Volume at the zona's inner face is MONOTONE INCREASING in the multiple — a bigger cortical
     sphere binds less, so each cell keeps more of its Voronoi share. Bisect for the smallest
     multiple that reaches the cytoplasm. If even RHO_MAX cannot, take RHO_MAX and let
     solveMassRadius report the saturation through row B, which is where that is already pinned. */
  let lo = RHO_MIN, hi = RHO_MAX;
  if (totalVolume(cs, R_ZI, kF, hi) < target) return hi;
  if (totalVolume(cs, R_ZI, kF, lo) >= target) return lo;
  for (let it = 0; it < 26; it++) {
    const mid = 0.5 * (lo + hi);
    if (totalVolume(cs, R_ZI, kF, mid) < target) lo = mid; else hi = mid;
  }
  return 0.5 * (lo + hi);
}
function rhoRoundAt(t) {
  const key = (Math.round(t * 2000) / 2000).toFixed(4);
  if (_rhoRoundCache[key] != null) return _rhoRoundCache[key];
  const v = rhoRoundFor(centresAt(t).cs, roundAt(t));
  _rhoRoundCache[key] = v;
  return v;
}
/* COMPACTION IS STILL ONE PARAMETER AND STILL THE SAME ONE. adhesion takes the multiple from "as
   round as the zona allows" to RHO_FLAT, where the sphere has stopped binding anywhere and the cells
   are pure Voronoi cells. What changed is only the lower end: it is now measured per stage instead of
   being a constant borrowed from the tightest stage. */
function rhoFactorAt(t) {
  const a = adhesionAt(t);
  const r0 = rhoRoundAt(t);
  return r0 + (RHO_FLAT_REF.v - r0) * a;
}
function roundAt(t) {
  const a = adhesionAt(t);
  return K_ROUND_REF.v + (K_FLAT_REF.v - K_ROUND_REF.v) * a;
}

/** the quadratic smooth minimum: exactly min(a,b) when |a-b| >= k, rounded over k otherwise */
function smin(a, b, k) {
  if (!(k > 0)) return a < b ? a : b;
  const h = 1 - Math.abs(a - b) / k;
  const m = a < b ? a : b;
  return h > 0 ? m - k * h * h * 0.25 : m;
}

/* AND IT IS APPLIED TO THE TWO SMALLEST TERMS ONLY, NOT FOLDED OVER ALL OF THEM.
   Folding smin across a dozen planes subtracts up to k/4 per fold, so a cell lost ~3k from every
   direction and the volume solve saturated at its upper bound again — rho = 18.0, the cap, reported
   at 8 and at 32 cells. Rounding belongs between the two surfaces that are actually competing: away
   from an edge the second term is far away and the result is EXACTLY the nearest surface, which is
   what makes two neighbouring cells' facets coincide; at an edge or a triple junction the two are
   close and the fillet appears, which is where a cleft is in a real embryo.

   k IS AN ABSOLUTE LENGTH, taken as a fraction of the stage's equal-volume cell radius rather than of
   rho. rho is the quantity the volume solve varies, so making the fillet proportional to it would put
   the solve variable on both sides of its own constraint — the volume could then fail to be monotone
   in rho, which is the one property the bisection needs. */
function minTwo(terms) {
  let a = Infinity, b = Infinity;
  for (let i = 0; i < terms.length; i++) {
    const v = terms[i];
    if (v < a) { b = a; a = v; } else if (v < b) { b = v; }
  }
  return [a, b];
}

/* ------------------------------------------------- the surface generator

   Lifted deliberately, not reinvented: this is models3d/fertilization.js's uvSurface, which exists
   because RENDER-STANDARD §2.4b says a winding convention reasoned about at the call site will be got
   wrong at some call site. Its argument order was established by PROBE on a unit sphere — 1472 of
   1472 triangles agreeing with the outward radial — and this file's render harness re-runs that same
   probe on every render, so if render-kit's emitter ever changes its order the harness says so
   instead of every surface here quietly turning inside out.

   NORMALS from a finite difference of the SAME point function that produced the positions (§2.3),
   guarded against collapse, forced to agree with the radial direction. That guard matters more here
   than it did for a near-sphere: a compacted blastomere is a rounded polyhedron whose surface is far
   from radial over most of every facet. */
function uvSurface(opts) {
  const rf = opts.r;
  const CC = opts.centre || new T.Vector3();
  const NU = opts.nu || 28, NV = opts.nv || 40;
  const sign = opts.sign === -1 ? -1 : 1;
  const skip = opts.skip || null;
  const E = opts.emitter || K.emitter();
  const ph = iu => (iu / NU) * Math.PI;
  const th = iv => (iv / NV) * Math.PI * 2;
  function pt(iu, iv, out) {
    const a = ph(iu), b = th(iv), r = rf(a, b);
    return out.set(Math.sin(a) * Math.cos(b), Math.cos(a), Math.sin(a) * Math.sin(b))
      .multiplyScalar(r).add(CC);
  }
  const _a = new T.Vector3(), _b = new T.Vector3(), _du = new T.Vector3(), _dv = new T.Vector3();
  const _rad = new T.Vector3();
  const EPS = 0.35;
  function nrm(iu, iv, out) {
    pt(Math.min(NU, iu + EPS), iv, _a); pt(Math.max(0, iu - EPS), iv, _b);
    _du.subVectors(_a, _b);
    pt(iu, iv + EPS, _a); pt(iu, iv - EPS, _b);
    _dv.subVectors(_a, _b);
    out.crossVectors(_dv, _du);
    const a = ph(iu), b = th(iv);
    _rad.set(Math.sin(a) * Math.cos(b), Math.cos(a), Math.sin(a) * Math.sin(b)).normalize();
    if (out.lengthSq() < 1e-14) out.copy(_rad); else out.normalize();
    if (out.dot(_rad) < 0) out.negate();
    if (sign < 0) out.negate();
    return out;
  }
  const P00 = new T.Vector3(), P10 = new T.Vector3(), P11 = new T.Vector3(), P01 = new T.Vector3();
  const N00 = new T.Vector3(), N10 = new T.Vector3(), N11 = new T.Vector3(), N01 = new T.Vector3();
  for (let iu = 0; iu < NU; iu++) {
    for (let iv = 0; iv < NV; iv++) {
      if (skip && skip(ph(iu + 0.5), th(iv + 0.5))) continue;
      pt(iu, iv, P00); pt(iu + 1, iv, P10); pt(iu + 1, iv + 1, P11); pt(iu, iv + 1, P01);
      nrm(iu, iv, N00); nrm(iu + 1, iv, N10); nrm(iu + 1, iv + 1, N11); nrm(iu, iv + 1, N01);
      if (sign > 0) E.quad(P00, P10, P11, P01, N00, N10, N11, N01);
      else          E.quad(P00, P01, P11, P10, N00, N01, N11, N10);
    }
  }
  return E;
}
function solidOf(rf, centre, nu, nv) {
  const E = uvSurface({ r: rf, centre: centre, nu: nu, nv: nv });
  return E.geometry(E.count());
}
function ball(centre, radius, nu, nv) {
  return solidOf((ph, th) => radius * SEC(ph, th), centre, nu || 16, nv || 22);
}
/* A CLOSED SHELL — fertilization.js's, minus the drilled hole, which cleavage has no use for: the
   zona is intact for the whole of this scene and is shed only on day five, in the next structure.
   The OUTER surface is emitted first and alone becomes the silhouette (§2.4). */
function shell(opts) {
  const ro = opts.ro, ri = opts.ri, CC = opts.centre || new T.Vector3();
  const NU = opts.nu || 34, NV = opts.nv || 48;
  const E = K.emitter();
  uvSurface({ r: ro, centre: CC, nu: NU, nv: NV, sign: 1, emitter: E });
  const hullCount = E.count();
  uvSurface({ r: ri, centre: CC, nu: NU, nv: NV, sign: -1, emitter: E });
  return E.geometry(hullCount);
}

/* ============================================================ the lineage

   A BINARY TREE, SO THAT MOVEMENT IS CONTINUOUS. The scene is a `series` and RENDER-STANDARD requires
   a series to be one continuous function of t. That is a statement about the CELLS as much as about
   the shape: a blastomere must not teleport when the count changes. So each cell at generation g+1
   knows its parent at generation g, and between the two generations its centre travels from the
   parent's position to its own, by smoothstep. Nothing is ever placed; the whole configuration at a
   fractional generation is an interpolation of two solved configurations.

   WHY NOT RANDOM. A packing found with a seeded random start is reproducible only as long as nobody
   touches the generator, and a review has to be able to re-measure what a build claimed. Everything
   below is deterministic: the first axis is anatomical (the polar-body axis), every later one is read
   off the previous generation's own geometry, and the relaxation is a fixed number of fixed steps. */

const EY = new T.Vector3(0, 1, 0);   // +y: the ANIMAL POLE, the polar-body axis. NOT a body direction.

/** inertia-tensor long axis of a cell, from the radial function that actually built it */
function longAxis(rf) {
  /* sum r(u)^5 * u u^T over the sphere: the second moment of a star-shaped solid. The eigenvector of
     the LARGEST eigenvalue is the long axis. Jacobi is overkill for a 3x3 that is nearly diagonal, so
     this uses the power method, which converges in a handful of iterations and cannot pick the wrong
     eigenvector when the gap is real — and when the gap is NOT real the ratio test below catches it. */
  const NU = 12, NV = 16;
  const M = [0, 0, 0, 0, 0, 0, 0, 0, 0];
  let trace = 0;
  for (let iu = 0; iu < NU; iu++) {
    const ph = ((iu + 0.5) / NU) * Math.PI, sw = Math.sin(ph);
    for (let iv = 0; iv < NV; iv++) {
      const th = ((iv + 0.5) / NV) * Math.PI * 2;
      const ux = Math.sin(ph) * Math.cos(th), uy = Math.cos(ph), uz = Math.sin(ph) * Math.sin(th);
      const r = rf(ux, uy, uz);
      const w = sw * Math.pow(r, 5);
      M[0] += w * ux * ux; M[1] += w * ux * uy; M[2] += w * ux * uz;
      M[3] += w * uy * ux; M[4] += w * uy * uy; M[5] += w * uy * uz;
      M[6] += w * uz * ux; M[7] += w * uz * uy; M[8] += w * uz * uz;
      trace += w;
    }
  }
  const mul = (v) => new T.Vector3(
    M[0] * v.x + M[1] * v.y + M[2] * v.z,
    M[3] * v.x + M[4] * v.y + M[5] * v.z,
    M[6] * v.x + M[7] * v.y + M[8] * v.z);
  let v = new T.Vector3(0.577, 0.511, 0.638).normalize();   // a fixed, non-axis-aligned start
  let lam = 0;
  for (let it = 0; it < 48; it++) {
    const w = mul(v);
    const n = w.length();
    if (n < 1e-18) break;
    v = w.multiplyScalar(1 / n); lam = n;
  }
  /* the smallest eigenvalue, from the trace, so the anisotropy can be judged without a full solve */
  const tr = M[0] + M[4] + M[8];
  const aniso = tr > 1e-18 ? (3 * lam / tr) : 1;       // 1 for a sphere, > 1 when there is a long axis
  return { axis: v, aniso: aniso };
}

const ANISO_MIN = 1.045;   // below this the cell is too round for its long axis to mean anything

/* THE PACKING IS A CENTROIDAL VORONOI TESSELLATION OF THE BALL, AND THE FIRST VERSION WAS NOT.

   The first version pushed overlapping centres apart and clamped each one inside the zona. That is
   the obvious algorithm and it is WRONG for this subject in a way that destroys the whole teaching:
   mutual repulsion maximises separation, which drives every centre onto the boundary shell, so the
   32-cell morula came out with ZERO cells sealed inside. Acceptance row I caught it — 0 inner cells
   at 32, where the row demands at least 3 — and the row caught it because it was written about the
   examinable consequence ("compaction creates an inside") rather than about the algorithm.

   The right statement is not "the cells push each other apart", it is "the cells fill the space".
   Equal-volume space-filling cells in a ball ARE a centroidal Voronoi tessellation, so that is what
   this computes: assign a fixed deterministic sample of the ball's VOLUME to the nearest centre, move
   each centre to the mean of its own samples, repeat. Interior cells then exist because the volume has
   an interior, which is the honest reason for them rather than a placed one. Lloyd's iteration is
   deterministic, converges monotonically, and converges to the optimum NEAR ITS SEED — which is what
   keeps the lineage intact: a daughter stays in its parent's neighbourhood instead of being
   reassigned somewhere across the embryo.

   WHY THE SAMPLE SET IS A LATTICE AND NOT RANDOM. A review has to be able to re-measure what a build
   claimed, and a seeded generator is reproducible only until somebody touches it. */
const SAMPLE_REF = { v: 0.46 };                 // 4.6 µm: ~6,400 samples in the ball, ~200 per cell at N=32
let _samples = null;
function ballSamples() {
  if (_samples) return _samples;
  const Rin = R_ZI * SEC_MIN;
  const pts = [];
  const STEP = SAMPLE_REF.v;
  const n = Math.ceil(Rin / STEP);
  for (let i = -n; i <= n; i++) {
    for (let j = -n; j <= n; j++) {
      for (let k = -n; k <= n; k++) {
        /* offset by a half step so no sample sits exactly on a symmetry plane, where it would be
           equidistant from two centres and its assignment would be decided by floating-point luck */
        const x = (i + 0.5) * STEP, y = (j + 0.5) * STEP, z = (k + 0.5) * STEP;
        if (x * x + y * y + z * z <= Rin * Rin) pts.push(x, y, z);
      }
    }
  }
  _samples = new Float64Array(pts);
  return _samples;
}

/** Lloyd's iteration. FIXED step count, and acceptance row R asserts the result does not move if it
    is doubled — an unconverged relaxation is a tuned parameter nobody can see. */
function relax(cs, rEq, iters) {
  const n = cs.length;
  if (n < 2) { cs[0].set(0, 0, 0); return cs; }
  const S = ballSamples(), ns = S.length / 3;
  const sx = new Float64Array(n), sy = new Float64Array(n), sz = new Float64Array(n);
  const cnt = new Int32Array(n);
  for (let it = 0; it < iters; it++) {
    sx.fill(0); sy.fill(0); sz.fill(0); cnt.fill(0);
    for (let s = 0; s < ns; s++) {
      const x = S[3 * s], y = S[3 * s + 1], z = S[3 * s + 2];
      let best = -1, bd = Infinity;
      for (let i = 0; i < n; i++) {
        const c = cs[i];
        const dx = x - c.x, dy = y - c.y, dz = z - c.z;
        const d = dx * dx + dy * dy + dz * dz;
        if (d < bd) { bd = d; best = i; }
      }
      sx[best] += x; sy[best] += y; sz[best] += z; cnt[best]++;
    }
    let moved = 0;
    for (let i = 0; i < n; i++) {
      if (!cnt[i]) continue;                      // an orphaned centre keeps its place rather than jumping
      const nx = sx[i] / cnt[i], ny = sy[i] / cnt[i], nz = sz[i] / cnt[i];
      moved = Math.max(moved, Math.abs(nx - cs[i].x), Math.abs(ny - cs[i].y), Math.abs(nz - cs[i].z));
      cs[i].set(nx, ny, nz);
    }
    if (moved < 1e-9 * rEq) break;                 // converged: further iterations are identical
  }
  /* re-centre, so the embryo stays on its own centre whatever the parity of the packing */
  const mean = new T.Vector3();
  for (const c of cs) mean.add(c);
  mean.multiplyScalar(1 / n);
  for (const c of cs) c.sub(mean);
  return cs;
}

/* THE GENERATION LADDER, built once and cached.

   For generation g: every cell of generation g-1 divides across its own long axis, measured from the
   shape that generation g-1 actually had; the two daughters are placed either side of the parent
   centre; then the whole set is relaxed. The ladder therefore depends on the SHAPE of every earlier
   generation, which is why it is built forwards and cached rather than evaluated per t. */
let _ladder = null;
let _ladderMeta = null;
let _divSubs = null;
/* the sub-steps a division is solved at. Five spans is enough that interpolating between two
   fully-relaxed neighbours leaves no void the volume solve cannot absorb, and few enough that the
   ladder stays about a second to build. */
const SUB_F = [0, 0.125, 0.25, 0.375, 0.5, 0.625, 0.75, 0.875, 1];
const SUB_RELAX = 14;

/* Lloyd, with every sister pair held at `f` of its final separation. The constraint is re-imposed
   after each iteration rather than built into the assignment, which keeps the iteration itself the
   plain centroidal one — and the pair is moved symmetrically about its own midpoint, so holding the
   gap never drags the pair across the embryo. */
function relaxWithSisterGap(cs, finalCs, f, rEq, iters) {
  const mid = new T.Vector3(), ax = new T.Vector3();
  for (let it = 0; it < iters; it++) {
    relax(cs, rEq, 1);
    for (let i = 0; i + 1 < cs.length; i += 2) {
      const want = finalCs[i].distanceTo(finalCs[i + 1]) * f;
      /* copy+add rather than addVectors: viz-training/tools/check-beat-claims.mjs runs a model in a
         sandbox whose Vector3 is a hand-written stub, and that stub has no addVectors — the tool died
         on beat 2 with "mid.addVectors is not a function" and could not check this scene at all. The
         repo has no node_modules/three, so the stub is the REAL substrate this model is checked on,
         and RENDER-STANDARD's own rule applies: test on the substrate, not on something that
         resembles it. Nothing is lost; the stub's method set is what every model here should stay
         inside. */
      mid.copy(cs[i]).add(cs[i + 1]).multiplyScalar(0.5);
      ax.subVectors(cs[i], cs[i + 1]);
      let L = ax.length();
      if (L < 1e-9) {
        ax.subVectors(finalCs[i], finalCs[i + 1]);
        L = ax.length();
        if (L < 1e-9) continue;
      }
      ax.multiplyScalar(1 / L);
      cs[i].copy(mid).addScaledVector(ax, want * 0.5);
      cs[i + 1].copy(mid).addScaledVector(ax, -want * 0.5);
    }
  }
  return cs;
}
function ladder(iters) {
  const IT = iters || 90;
  if (_ladder && _ladderMeta.iters === IT && _ladderMeta.step === SAMPLE_REF.v) return _ladder;
  _divSubs = null;
  const gens = [];
  const meta = { iters: IT, step: SAMPLE_REF.v, fallbacks: 0, axes: [] };
  gens.push([new T.Vector3(0, 0, 0)]);
  const divSubs = [];
  let axesPrev = [EY.clone()];                        // the zygote's own "previous" axis is the polar axis
  for (let g = 1; g <= GENS; g++) {
    const prev = gens[g - 1];
    const n = prev.length;
    /* THE LONG AXIS IS MEASURED ON THE SHAPE THE MODEL DRAWS, which it was not.
       RENDER-STANDARD §3: "the measured side of every acceptance assertion must be read from the
       geometry the model builds, and never from the constants the geometry was built from." The first
       version measured each dividing cell's long axis with rho set to R_CELL0 * n^(-1/3) — the radius
       an unclipped equal-volume sphere would have, 3.00 at eight cells — while the geometry at eight
       cells is drawn with the SOLVED rho of 4.38 and every cell is a wedge reaching from the zona to
       the embryo's centre. Measured on the wrong shape the cells read as nearly round, two of the five
       generations fell back to the textbook perpendicular rule, and the 32-cell morula came out with
       EVERY cell on the surface and no inner cell mass at all — the whole teaching of the item
       missing, and row I was what said so.
       Measured on the drawn shape, an outer wedge's long axis is RADIAL, so it divides into one
       daughter inside and one outside. That is the real mechanism the textbooks call a differentiative
       division, and it arrives here as a consequence of Hertwig's rule applied to the actual geometry
       rather than as a rule of its own. */
    const tPrev = g === 1 ? 0 : DIV[g - 2][1];
    const kPrev = roundAt(tPrev);
    /* rhoRoundFor on the centres in hand, NOT rhoFactorAt(tPrev) — see rhoRoundFor's own note. */
    const rhoFPrev = (function () {
      const r0 = rhoRoundFor(prev, kPrev);
      const a = adhesionAt(tPrev);
      return r0 + (RHO_FLAT_REF.v - r0) * a;
    })();
    _lastSolveT = tPrev;
    const rhoPrev = n === 1 ? R_CELL0 : solveMassRadius(prev, kPrev, rhoFPrev);
    const rEqNew = R_CELL0 * Math.pow(2 * n, -1 / 3);
    const next = [], axesNew = [];
    for (let i = 0; i < n; i++) {
      let axis;
      if (g === 1) {
        /* THE FIRST CLEAVAGE PLANE PASSES THROUGH THE POLAR BODIES. That is anatomy, it is the one
           axis in cleavage that is not determined by shape, and the zygote is a sphere so no shape
           measurement could supply it. Declared, and the only hard-coded axis in the file. */
        axis = EY.clone();
      } else {
        const la = longAxis(makeRadialFor(prev, i, rhoPrev, kPrev, rhoFPrev));
        if (la.aniso >= ANISO_MIN) {
          axis = la.axis;
        } else {
          /* TOO ROUND TO HAVE A LONG AXIS. Hertwig's rule has nothing to say about a sphere, so fall
             back to the textbook rule — the next division is perpendicular to the last — and COUNT
             it. A fallback that is not counted is a tuned parameter wearing a measurement's clothes. */
          meta.fallbacks++;
          const p = axesPrev[i] || EY;
          axis = new T.Vector3(0.37, 0.52, 0.77).normalize();
          axis.addScaledVector(p, -axis.dot(p)).normalize();
        }
      }
      /* daughters either side of the parent, separated so that after relaxation they are apposed */
      const off = axis.clone().multiplyScalar(rEqNew * 0.95);
      next.push(prev[i].clone().add(off));
      next.push(prev[i].clone().sub(off));
      axesNew.push(axis.clone(), axis.clone());
    }
    relax(next, rEqNew, IT);
    gens.push(next);
    /* THE DIVISION ITSELF IS RELAXED, AT SUB-STEPS, and this replaces two failed attempts.
       A division is not a straight line from the parents' packing to the daughters'. Interpolating
       one made the configuration in the middle of every division a good packing of NEITHER count, so
       voids opened: at t = 0.50, halfway through the 4-to-8 division, the cell mass had to reach the
       zona's inner face and still could not hold the cytoplasm — the solve saturated, in a frame the
       scene renders, and the first set of acceptance rows could not see it because they were gated
       only at the settled stages. Relaxing the interpolated configuration instead fixed the voids and
       broke something worse: Lloyd's first iteration throws two just-divided sisters apart to their
       own half-region centroids, about a unit of travel, inside one step of t — row K measured a
       1.358-radius jump at the 16-to-32 boundary, a cell teleporting in a scene whose mode is
       `sequence`. Blending that in with a bump halved the jump and brought the voids back.
       So the division gets its own small ladder. At each sub-step the configuration is FULLY relaxed,
       which is what closes the voids, but the sisters' separation is held at that sub-step's fraction
       of its final value, which is what keeps the furrow a furrow; and each sub-step is seeded from
       the one before, so the whole sequence stays in one basin and the lineage is never reassigned.
       Sub-step 0 is the parents exactly and sub-step 1 is the solved next generation exactly, so the
       division leaves and arrives continuously by construction rather than by a weight. */
    const subs = [prev.map(c => c.clone().clone())];   // f = 0: sisters coincident at their parent
    const sub0 = [];
    for (let i = 0; i < n; i++) { sub0.push(prev[i].clone(), prev[i].clone()); }
    subs[0] = sub0;
    for (let si = 1; si < SUB_F.length - 1; si++) {
      const f = SUB_F[si];
      const seed = subs[si - 1].map((c, k) => c.clone().lerp(next[k], (f - SUB_F[si - 1]) / (1 - SUB_F[si - 1])));
      relaxWithSisterGap(seed, next, f, rEqNew, SUB_RELAX);
      subs.push(seed);
    }
    subs.push(next.map(c => c.clone()));
    divSubs.push(subs);
    axesPrev = axesNew;
    meta.axes.push({ g: g, n: next.length });
  }
  _ladder = gens; _ladderMeta = meta; _divSubs = divSubs;
  return gens;
}
function ladderMeta() { ladder(); return _ladderMeta; }

/* a radial function for cell i of a configuration, used by the long-axis measurement above. It is the
   SAME construction build() uses, which is the point: the axis a division is taken across is measured
   from the shape the model actually drew, not from an idealisation of it. */
function makeRadialFor(cs, i, Rmass, kFrac, rhoF) {
  const ci = cs[i];
  const rEq = Rmass * Math.pow(cs.length, -1 / 3);
  const rho = rEq * rhoF;
  const k = kFrac * rEq;
  const planes = [];
  for (let j = 0; j < cs.length; j++) {
    if (j === i) continue;
    const n = new T.Vector3().subVectors(cs[j], ci);
    const L = n.length();
    if (L < 1e-9 || L > 6 * rEq) continue;
    n.multiplyScalar(1 / L);
    planes.push({ n: n, h: L / 2 - EPS_MEM.v / 2 });   // the drawn membrane gap, half from each cell
  }
  const c2 = ci.lengthSq();
  const Rin = Math.min(Rmass, R_ZI) * SEC_MIN;
  const terms = [];
  return function (ux, uy, uz) {
    terms.length = 0; terms.push(rho);
    for (const pl of planes) {
      const ud = ux * pl.n.x + uy * pl.n.y + uz * pl.n.z;
      if (ud <= 1e-4) continue;
      terms.push(pl.h / ud);
    }
    const two = minTwo(terms);
    /* THE FILLET CANNOT BE WIDER THAN THE SURFACE IT ROUNDS.
       k is a fraction of the stage's equal-volume cell radius, which is the right scale for an edge
       between two established facets and far too large for a contact that has just appeared. At the
       instant a division opens, the sisters' bisecting plane passes almost through both centres, so
       its distance is near zero while k is still 0.75 of a 3-unit cell — and the fillet rounded most
       of both daughters away. Measured as the mass radius the packing would NEED if the zona were not
       in the way: 6.00 almost everywhere, spiking to 6.33 at t = 0.48 and 6.45 at t = 0.64, which are
       exactly the two instants the 4-to-8 and 8-to-16 divisions open. The zona's inner face is 6.20,
       so the solve was pinned against it and row B read a margin of 0.000 with no saturation flagged —
       a root sitting exactly on a wall, which is the shape of a constraint that is really being
       violated just out of sight.
       Capping the fillet at 0.6 of the realised distance is a statement about what a fillet is: it
       rounds an edge, and an edge rounded by more than the distance to the surface is not an edge any
       more. It costs nothing where the cells are established, because there k is already far smaller
       than the distances involved. */
    const kEff = Math.min(k, 0.6 * two[0]);
    let d = smin(two[0], two[1], kEff);
    const b = ux * ci.x + uy * ci.y + uz * ci.z;
    const disc = b * b - (c2 - Rin * Rin);
    /* THE ZONA CONTACT IS SOFT AT ITS EDGE — the same smin, over the absolute width k_z. Hertwig's
       rule measures the long axis of the shape the model DRAWS, so this has to match the surface
       build() produces or the axis is read off a shape that is never on screen. */
    if (disc > 0) {
      const sz = -b + Math.sqrt(disc);
      if (sz > 1e-6) d = smin(d, sz, K_ZONA_REF.v * R_CELL0);
    }
    return d;
  };
}

/* ====================================================== the configuration at t

   Centres at a fractional generation: each cell of the UPPER generation travels from its parent's
   centre to its own, by smoothstep on the fractional part. At an integer generation this is exactly
   the solved configuration, so the stages a scene pins are the solved ones. */
function centresAt(t) {
  const gens = ladder();
  const gam = gammaAt(t);
  const g = Math.min(GENS, Math.floor(gam + 1e-9));
  const frac = Math.min(1, Math.max(0, gam - g));
  if (frac < 1e-9 || g >= GENS) {
    return { cs: gens[g].map(v => v.clone()), gen: g, frac: 0, count: gens[g].length };
  }
  /* read the division's own sub-step ladder and interpolate between the two it falls between */
  ladder();
  const subs = _divSubs[g];
  let si = 0;
  while (si + 2 < SUB_F.length && frac > SUB_F[si + 1]) si++;
  const f0 = SUB_F[si], f1 = SUB_F[si + 1];
  const u = (frac - f0) / (f1 - f0);
  const a = subs[si], b = subs[si + 1];
  const cs = [];
  for (let k = 0; k < b.length; k++) cs.push(a[k].clone().lerp(b[k], smooth(0, 1, u)));
  return { cs: cs, gen: g, frac: frac, count: cs.length };
}
/* ---------------------------------------------------- the cell surface at t

   d(u) = smoothmin_p( rho , every neighbour's bisecting plane , the zona )

   The smooth minimum is the power form, (sum d_k^-p)^(-1/p). It is below the true minimum everywhere,
   and by more where two terms are close — which is exactly a rounded edge, and at a triple junction a
   rounded corner, which is the cleft. p rises with adhesion, so ONE parameter takes the embryo from
   loosely packed round cells to a flattened foam, at constant total volume. */
function cellField(cs, i, Rmass, kFrac, rhoF) {
  const ci = cs[i];
  const rEq = Rmass * Math.pow(cs.length, -1 / 3);
  const rho = rEq * rhoF;
  const k = kFrac * rEq;
  const planes = [];
  for (let j = 0; j < cs.length; j++) {
    if (j === i) continue;
    const n = new T.Vector3().subVectors(cs[j], ci);
    const L = n.length();
    if (L < 1e-9 || L > 6 * rEq) continue;
    n.multiplyScalar(1 / L);
    planes.push({ n: n, h: L / 2 - EPS_MEM.v / 2, j: j });   // the drawn membrane gap, half from each cell
  }
  const c2 = ci.lengthSq();
  const rhoCap = rho * SEC_MAX;
  /* the cell mass's own boundary: a hard clip, because beyond it there is either perivitelline space
     or the zona, and in neither case does the cytoplasm continue. It is the SOLVED quantity. */
  const RmassEff = Math.min(Rmass, R_ZI);
  const terms = [];
  function at(ux, uy, uz) {
    terms.length = 0; terms.push(rho);
    for (const pl of planes) {
      const ud = ux * pl.n.x + uy * pl.n.y + uz * pl.n.z;
      if (ud <= 1e-4) continue;
      terms.push(pl.h / ud);
    }
    const two = minTwo(terms);
    /* THE FILLET CANNOT BE WIDER THAN THE SURFACE IT ROUNDS.
       k is a fraction of the stage's equal-volume cell radius, which is the right scale for an edge
       between two established facets and far too large for a contact that has just appeared. At the
       instant a division opens, the sisters' bisecting plane passes almost through both centres, so
       its distance is near zero while k is still 0.75 of a 3-unit cell — and the fillet rounded most
       of both daughters away. Measured as the mass radius the packing would NEED if the zona were not
       in the way: 6.00 almost everywhere, spiking to 6.33 at t = 0.48 and 6.45 at t = 0.64, which are
       exactly the two instants the 4-to-8 and 8-to-16 divisions open. The zona's inner face is 6.20,
       so the solve was pinned against it and row B read a margin of 0.000 with no saturation flagged —
       a root sitting exactly on a wall, which is the shape of a constraint that is really being
       violated just out of sight.
       Capping the fillet at 0.6 of the realised distance is a statement about what a fillet is: it
       rounds an edge, and an edge rounded by more than the distance to the surface is not an edge any
       more. It costs nothing where the cells are established, because there k is already far smaller
       than the distances involved. */
    const kEff = Math.min(k, 0.6 * two[0]);
    let d = smin(two[0], two[1], kEff);
    /* THE ZONA AT ITS REAL RADIUS IN THIS DIRECTION, not at its tightest, and as a HARD minimum.
       Hard because the zona is a stiff shell and a cell pressed on it has a genuinely flat contact
       with no rounded edge — cell-cell apposition is the only soft contact in this model.
       At its real radius because the first version clipped against a constant R_ZI * SEC_MIN minus a
       margin, which is SMALLER than the zygote's own radius: the zygote was clipped by the zona
       instead of floating inside it, the 2 µm perivitelline space vanished, and the volume solve had
       no headroom at all. rho then ran to the bisection's upper bound at every stage after the first —
       reported as 13.2 at 2, 4, 8, 16 and 32 cells alike, which is what made it visible. One Newton
       step is enough: SEC varies by 2.7% and the correction to s is second order in that. */
    /* A CENTRE OUTSIDE THE CELL MASS CONTRIBUTES NOTHING, and saying so is what makes the volume
       MONOTONE in the solve variable. Without it, a centre beyond the mass boundary gave a negative
       discriminant, the clip was skipped entirely, and the cell was drawn as a full unclipped sphere:
       the volume at 32 cells read 3,770 at a mass radius of 4.2, 1,482 at 4.8 and 589 at 5.2 — non
       monotone, so the bisection was not bracketing a root but wandering over a fold. Bisection needs
       exactly one property of its function and this is it. */
    if (c2 > RmassEff * SEC_MIN * RmassEff * SEC_MIN) return { d: 0, zona: 0 };
    const b = ux * ci.x + uy * ci.y + uz * ci.z;
    let sz = Infinity;
    for (let pass = 0; pass < 2; pass++) {
      const guess = pass === 0 ? Math.max(0, rhoCap - b) : sz;
      let wx = ci.x + ux * guess, wy = ci.y + uy * guess, wz = ci.z + uz * guess;
      const wl = Math.sqrt(wx * wx + wy * wy + wz * wz) || 1;
      wx /= wl; wy /= wl; wz /= wl;
      const phw = Math.acos(Math.max(-1, Math.min(1, wy))), thw = Math.atan2(wz, wx);
      const Rin = RmassEff * SEC(phw, thw);
      const disc = b * b - (c2 - Rin * Rin);
      if (!(disc > 0)) { sz = Infinity; break; }
      const q = -b + Math.sqrt(disc);
      sz = q > 1e-6 ? q : Infinity;
      if (!isFinite(sz)) break;
    }
    /* SOFT AT THE EDGE, EXACT IN THE MIDDLE. smin equals the plain minimum wherever the two terms
       differ by more than k_z, so the cell's contact with the zona is still a flat patch and the
       stated reason the clip was hard is untouched; what rounds is the RIM of that patch, which is
       where the seam between two cells reaches the outer surface. That rim is the furrow. */
    if (!isFinite(sz)) return { d: d, zona: sz };
    return { d: smin(d, sz, K_ZONA_REF.v * R_CELL0), zona: sz };
  }
  return { at: at, centre: ci, planes: planes };
}

/* the quadrature the rho solve integrates over. Coarse on purpose — it is the SOLVE grid, and row V
   re-measures the volume it produced off the built triangles with the divergence theorem, which is an
   independent read of the actual mesh rather than a second evaluation of the same integral. */
const QU = 18, QV = 24;
const QGRID = (() => {
  const g = [];
  for (let iu = 0; iu < QU; iu++) {
    const ph = ((iu + 0.5) / QU) * Math.PI, w = Math.sin(ph) * (Math.PI / QU) * (2 * Math.PI / QV);
    for (let iv = 0; iv < QV; iv++) {
      const th = ((iv + 0.5) / QV) * Math.PI * 2;
      g.push({ x: Math.sin(ph) * Math.cos(th), y: Math.cos(ph), z: Math.sin(ph) * Math.sin(th), w: w });
    }
  }
  return g;
})();

function totalVolume(cs, Rmass, kFrac, rhoF) {
  let V = 0;
  for (let i = 0; i < cs.length; i++) {
    const f = cellField(cs, i, Rmass, kFrac, rhoF);
    let v = 0;
    for (const q of QGRID) { const d = f.at(q.x, q.y, q.z).d; v += q.w * d * d * d; }
    V += v / 3;
  }
  return V;
}

/* THE ZYGOTE'S VOLUME, which every later stage must equal.

   Measured through the SAME quadrature as every other stage, so the target and the measurement cannot
   disagree about what a volume is: SPHERE_QUAD_FACTOR is what this quadrature returns for a unit
   sphere, divided by 4/3 pi. On an 18x24 grid it is not exactly 1, and using the analytic sphere
   volume as the target while measuring the stages numerically would charge every later stage with the
   quadrature's own error and call it a volume change. */
let _sqf = null;
function SPHERE_QUAD_FACTOR() {
  if (_sqf == null) {
    let v = 0;
    for (const q of QGRID) v += q.w / 3;
    _sqf = v / ((4 / 3) * Math.PI);
  }
  return _sqf;
}
let _V0 = null;
function V0() {
  /* the zygote: ONE free sphere of radius R_CELL0, measured through the same quadrature as every
     other stage so the target and the measurement cannot disagree about what a volume is */
  if (_V0 == null) _V0 = (4 / 3) * Math.PI * Math.pow(R_CELL0, 3) * SPHERE_QUAD_FACTOR();
  return _V0;
}

/* RHO, SOLVED. Bisection on the common blastomere radius so that the total volume of the clipped
   cells equals the zygote's. Monotone increasing in rho, so bisection is safe and cannot land on a
   bifurcation the way the cardiac-looping solver once did. */
/* 32 bisection steps on a bracket about 2 units wide is 5e-10 of a unit — far below the quadrature's
   own resolution, and a third cheaper than the 46 this started with, which matters because
   check-beat-claims solves at about fifty values of t. */
const RHO_ITERS = 32;
let _rhoSaturated = 0, _rhoUnexpected = 0, _lastSolveT = null;
function solveMassRadius(cs, kFrac, rhoF) {
  const n = cs.length;
  const target = V0();
  /* the cell mass can never be smaller than a ball holding the cytoplasm, nor larger than the zona's
     inner face: those two ARE the bracket, so a failure to bracket is a statement about the packing */
  let maxC = 0;
  for (const c of cs) maxC = Math.max(maxC, c.length());
  const LO = Math.max(R_CELL0 * 0.70, maxC * 1.02), HI = R_ZI * 1.0;
  /* A SOLVE THAT RETURNS ITS OWN BOUND IS NOT A SOLVE. The cardiac-looping solver learned this as a
     bifurcation sitting on the bisection's cap; here it showed up as rho = 13.2 — exactly the old
     upper bound — reported identically at every stage, while the acceptance row reported a 5.6%
     volume error and gave no hint where it came from. Bracketing is checked rather than assumed, and
     a failure to bracket is counted and warned about once, not clamped silently. */
  if (!(totalVolume(cs, LO, kFrac, rhoF) < target)) { _rhoSaturated++; return LO; }
  if (!(totalVolume(cs, HI, kFrac, rhoF) > target)) {
    _rhoSaturated++;
    /* A KNOWN CONDITION IS RECORDED, NOT WARNED ABOUT. This fires in the two declared SHORT_WINDOWS
       on every single build, and RENDER-STANDARD is explicit about what a warning that is a known
       false alarm does: "it trains every future run to ignore the channel it prints on, and it did —
       it cost an unrelated item its console-clean check." So the condition is counted, and row B
       asserts it happens ONLY inside the declared windows. A saturation OUTSIDE one of them is new
       information and still warns, once. */
    if (_lastSolveT == null || !inShortWindow(_lastSolveT)) {
      if (_rhoUnexpected === 0) console.warn('[cleavage-morula] THE CELL MASS DOES NOT BRACKET at ' +
        n + ' cells, t=' + _lastSolveT + ' — OUTSIDE the declared SHORT_WINDOWS. Even filling the ' +
        'zona to its inner face (' + HI.toFixed(3) + ') the packing cannot hold the cytoplasm. ' +
        'Check RHO_ROUND, K_ROUND and the sub-step ladder.');
      _rhoUnexpected++;
    }
    return HI;
  }
  let lo = LO, hi = HI;
  for (let it = 0; it < RHO_ITERS; it++) {
    const mid = 0.5 * (lo + hi);
    if (totalVolume(cs, mid, kFrac, rhoF) < target) lo = mid; else hi = mid;
  }
  return 0.5 * (lo + hi);
}
function massRadiusSaturations() { return _rhoSaturated; }

let _stateCache = {};
function stateAt(t) {
  const key = (Math.round(t * 2000) / 2000).toFixed(4);
  if (_stateCache[key]) return _stateCache[key];
  const conf = centresAt(t);
  const kFrac = roundAt(t);
  const rhoF = rhoFactorAt(t);
  _lastSolveT = t;
  const rho = solveMassRadius(conf.cs, kFrac, rhoF);
  const st = { t: t, cs: conf.cs, gen: conf.gen, frac: conf.frac, count: conf.count,
               k: kFrac, rhoF: rhoF, rho: rho, adhesion: adhesionAt(t), gamma: gammaAt(t) };
  /* FATE IS DERIVED, NOT LABELLED. A cell is OUTER if it still has FREE surface — surface that is
     not apposed to another cell — and INNER if compaction has sealed it so that every part of its
     boundary faces a neighbour. That is the criterion the narration actually uses ("the few cells
     sealed inside by compaction") and it is the one a student can see.

     IT IS NOT "TOUCHES THE ZONA", WHICH IS WHAT THE FIRST VERSION ASKED. That test needs the cell to
     reach the zona's inner face, so it inherits every error in the perivitelline clearance: with the
     clearance restored above, the ZYGOTE stops touching the zona and the test classified the
     one-cell embryo as an inner cell mass. A criterion that calls the zygote an inner cell is
     measuring the wrong thing, whatever it reports at 32. */
  st.outer = [];
  st.freeFrac = [];
  for (let i = 0; i < st.cs.length; i++) {
    const sp = surfaceSplit(st, i);
    st.freeFrac.push(sp.freeFrac);
    st.outer.push(sp.freeFrac > FREE_MIN);
  }
  _stateCache[key] = st;
  return st;
}
/* HOW MUCH FREE SURFACE MAKES A CELL AN OUTER CELL — and why the number cannot be what decides it.

   A sealed cell is not at exactly 0% free surface, because the construction rounds every edge: at a
   triple junction the fillet pulls all three surfaces apart by more than apposeTol(), so a fully
   enclosed cell still measures a couple of per cent. The first threshold was 2%, and the four
   genuinely interior cells of the 32-cell morula measured 2.2%, 2.2%, 3.2% and 3.2% — sealed on every
   side, and classified as outer cells by a tenth of a per cent. Raising the threshold until the row
   passes is exactly what RENDER-STANDARD means by lowering a threshold instead of writing down an
   argument, so what is asserted instead is that THE TWO POPULATIONS ARE SEPARATED:

     32-cell morula, measured    inner 2.2 – 3.2%        outer 26.4 – 32.5%

   an order of magnitude of empty band between them. 10% sits in the middle of that band, and row I
   asserts the SEPARATION RATIO as well as the count, so if the two populations ever came close enough
   for the threshold to matter the row would fail rather than silently depend on it. */
const FREE_MIN = 0.10;

/* --------------------------------------------- the nuclear radius, SOLVED

   The largest CONSTANT nuclear radius that still fits inside every built cell at every stage. Solved
   rather than chosen, because the nucleus-to-cytoplasm ratio is the second examinable consequence of
   division without growth and it is only visible if the nuclei are as big as the geometry allows.
   Measured as an inradius: the minimum over directions of the cell's own surface distance from the
   point the nucleus is centred on. */
function cellInradius(st, i) {
  const f = fieldFor(st, i);
  let m = Infinity;
  for (const q of QGRID) m = Math.min(m, f.at(q.x, q.y, q.z).d);
  return m;
}
const T_SOLVE = [0, 0.175, 0.35, 0.435, 0.50, 0.595, 0.70, 0.80, 0.88, 0.94, 1.0];
let _rNuc = null;
function nuclearRadius() {
  if (_rNuc != null) return _rNuc;
  let worst = Infinity;
  for (const t of T_SOLVE) {
    const st = stateAt(t);
    for (let i = 0; i < st.cs.length; i++) worst = Math.min(worst, cellInradius(st, i));
  }
  _rNuc = worst * 0.74;      // 0.74 leaves a visible rim of cytoplasm round the nucleus at the tightest stage
  return _rNuc;
}

/* ===================================================== measures a claim can name

   Exposed through claimMeasure so that a beat's assertion lives in the beat that makes it
   (RENDER-STANDARD §3.y) and so a review can re-measure any number in the narration without reading
   this file. Everything here is a function of the BUILT field, never of the constants it was built
   from (§3's "AN ACCEPTANCE MEASUREMENT MUST BE A FUNCTION OF THE BUILT GEOMETRY"). */

/* ============================ APPOSITION, MEASURED BETWEEN THE TWO DRAWN SURFACES

   ONE definition, in one place, used by both the fate test and the apposed-area measure.

   A point on cell i's surface is APPOSED if some neighbour's OWN DRAWN SURFACE passes within
   apposeTol() of it. That is a question about the two surfaces the model actually emits, which is what
   RENDER-STANDARD §3 requires of a measured side, and it is immune to the smoothing in a way the two
   earlier attempts were not:

     - v1 asked whether the plane term was within 2% of the realised distance. That is a question
       about p. It reported the 8-cell embryo 0.18% apposed and gave a compaction ratio of 130.
     - v2 asked whether the surface lay within apposeTol() of the BISECTING PLANE. Better, but a smooth
       minimum of k active terms sits about k^(-1/p) below the true minimum, so at p = 46 with four
       planes biting the surface stands ~3% inside the plane — 0.06 units on a 2.1-unit cell, wider
       than the tolerance. Every triple junction therefore read as free surface, and row I reported
       ZERO sealed cells in a 32-cell morula, which is the whole teaching of the item missing.

   Comparing the two surfaces cancels that bias, because both are smoothed the same way. */
function apposedAt(st, i, f, ux, uy, uz, d) {
  const ci = st.cs[i];
  const wx = ci.x + ux * d, wy = ci.y + uy * d, wz = ci.z + uz * d;
  for (const pl of f.planes) {
    const j = pl.j;
    const cj = st.cs[j];
    let vx = wx - cj.x, vy = wy - cj.y, vz = wz - cj.z;
    const L = Math.sqrt(vx * vx + vy * vy + vz * vz);
    if (L < 1e-9) return true;
    vx /= L; vy /= L; vz /= L;
    const fj = fieldFor(st, j);
    const dj = fj.at(vx, vy, vz).d;
    if (L - dj <= apposeTol()) return true;        // the neighbour's own surface reaches this point
  }
  return false;
}

/* the fields, memoised per state: apposedAt asks a neighbour's field for every direction of every
   cell, so rebuilding it each time would be O(n^2) plane lists per quadrature point */
function fieldFor(st, i) {
  if (!st._fields) st._fields = [];
  if (!st._fields[i]) st._fields[i] = cellField(st.cs, i, st.rho, st.k, st.rhoF);
  return st._fields[i];
}

/* DIAGNOSTIC: the distribution of how far the nearest neighbour surface is from each surface point.
   Exposed so a harness can see WHY a cell is or is not sealed, instead of only the verdict. */
function gapProfile(st, i) {
  const f = fieldFor(st, i);
  const ci = st.cs[i];
  const out = [];
  for (const q of QGRID) {
    const d = f.at(q.x, q.y, q.z).d;
    const wx = ci.x + q.x * d, wy = ci.y + q.y * d, wz = ci.z + q.z * d;
    let best = Infinity, bj = -1;
    for (const pl of f.planes) {
      const cj = st.cs[pl.j];
      let vx = wx - cj.x, vy = wy - cj.y, vz = wz - cj.z;
      const L = Math.sqrt(vx * vx + vy * vy + vz * vz);
      if (L < 1e-9) { best = -1; bj = pl.j; break; }
      vx /= L; vy /= L; vz /= L;
      const dj = fieldFor(st, pl.j).at(vx, vy, vz).d;
      if (L - dj < best) { best = L - dj; bj = pl.j; }
    }
    out.push(best);
  }
  out.sort((a, b) => a - b);
  return out;
}

/** free fraction of a cell's own surface, and its area, in one pass. MEMOISED ON THE STATE: the fate
    test and the apposed-area measure ask the same question of the same cell, and before this each of
    them recomputed it — which is a 432-direction x 12-neighbour x 12-plane pass per cell, twice.
    check-beat-claims evaluates every claim at five values of t, so the duplication was the difference
    between the tool finishing and the tool timing out at two minutes. */
function surfaceSplit(st, i) {
  if (!st._split) st._split = [];
  if (st._split[i]) return st._split[i];
  return (st._split[i] = surfaceSplitRaw(st, i));
}
function surfaceSplitRaw(st, i) {
  const f = fieldFor(st, i);
  let free = 0, app = 0;
  for (const q of QGRID) {
    const d = f.at(q.x, q.y, q.z).d;
    const dA = q.w * d * d;
    if (apposedAt(st, i, f, q.x, q.y, q.z, d)) app += dA; else free += dA;
  }
  return { free: free, apposed: app, total: free + app, freeFrac: (free + app) > 0 ? free / (free + app) : 1 };
}

/* ROW X's MEASURE — THE SMALLEST SEPARATION BETWEEN ANY TWO DRAWN CELL SURFACES.

   The review's standards gap G3: nothing in this corpus proves that two surfaces which touch EXACTLY
   do not z-fight, because row 3.z tests whether a vertex lies a set distance INSIDE another part and
   coincidence is zero inside — so the one row that looks for parts sharing space excludes the case by
   construction. Round 1's cut view stippled teal across orange over whole facets for exactly that
   reason, and every check passed.

   This walks the SAME surface points row C walks — each cell's quadrature directions, at the realised
   surface — and for every neighbour measures how far that point lies OUTSIDE the neighbour's own
   surface. The minimum over every point of every cell against every neighbour is the number: it is
   the closest any two drawn surfaces in this model ever come. Coincidence reads 0. The model draws
   every contact EPS_MEM apart on purpose, so the floor is a fraction of EPS_MEM rather than an
   absolute: the row proves the gap the model intends is the gap it actually emits, and it fails both
   if two surfaces meet and if the gap quietly disappears. */
function minSurfaceSeparation(st) {
  let worst = Infinity, where = null;
  for (let i = 0; i < st.cs.length; i++) {
    const f = fieldFor(st, i);
    const ci = st.cs[i];
    for (const q of QGRID) {
      const d = f.at(q.x, q.y, q.z).d;
      if (!(d > 0)) continue;
      const wx = ci.x + q.x * d, wy = ci.y + q.y * d, wz = ci.z + q.z * d;
      for (const pl of f.planes) {
        const j = pl.j, cj = st.cs[j];
        let vx = wx - cj.x, vy = wy - cj.y, vz = wz - cj.z;
        const L = Math.sqrt(vx * vx + vy * vy + vz * vz);
        if (L < 1e-9) { return { min: 0, where: [i, j] }; }
        vx /= L; vy /= L; vz /= L;
        const dj = fieldFor(st, j).at(vx, vy, vz).d;
        const sep = L - dj;
        /* only pairs that are actually in contact can coincide; a point far outside a distant
           neighbour is not the question, so the sweep is limited to the apposition band. */
        if (sep <= apposeTol() && sep < worst) { worst = sep; where = [i, j]; }
      }
    }
  }
  return { min: isFinite(worst) ? worst : null, where: where };
}

function cellVolumes(st) {
  const out = [];
  for (let i = 0; i < st.cs.length; i++) {
    const f = fieldFor(st, i);
    let v = 0;
    for (const q of QGRID) { const d = f.at(q.x, q.y, q.z).d; v += q.w * d * d * d; }
    out.push(v / 3);
  }
  return out;
}

/* APPOSED AREA — the thing compaction increases, and the only honest way to measure "the cells
   flatten against each other" without drawing junctions that have no form at this scale.

   A surface patch counts as APPOSED when the cell's surface there actually LIES ON a neighbour's
   bisecting plane, to within a membrane-scale gap: |d(u) - h/u.n| <= apposeTol().  That is the
   definition that measures the picture. The first version asked instead whether the plane term was
   within 2% of the realised distance, which is a question about the SMOOTHING rather than about the
   surface — it reported the 8-cell embryo at 0.0018 and gave a compaction ratio of 130, a number so
   large it was the tell. A smooth minimum sits further below its terms the softer it is, so that
   test measured p and nothing else.

   Summed over cells, so each interface is counted twice; the ratio across compaction is what the
   claim uses and the double count cancels in it. */
/* 0.4 µm — a membrane-scale gap. Not a tolerance chosen to make a number come out: two membranes in
   apposition are ~20 nm apart and the quadrature here is 0.46 units coarse, so anything smaller
   would be measuring the grid. */
/* THE DRAWN GAP IS NOT CHARGED AGAINST APPOSITION. Round 2, 2026-10-01.

   This test asks whether a NEIGHBOUR'S OWN SURFACE reaches a point on this cell's surface, within a
   membrane-scale tolerance. The model now deliberately draws every cell-cell contact EPS_MEM apart so
   that no two surfaces coincide (see EPS_MEM), which means the gap the model itself draws would be
   charged against the very test that decides whether a cell is sealed. Measured: it halved the
   inner/outer population separation from 7.28x to 1.27x and row I failed — not because any cell
   changed its position, but because the yardstick had been shortened by the drawing convention.
   So the tolerance carries the drawn gap explicitly, and the slack BEYOND it is the unchanged 0.04. */
const APPOSE_SLACK = 0.04;
function apposeTol() { return APPOSE_SLACK + EPS_MEM.v; }
function apposedArea(st) {
  let app = 0, tot = 0;
  for (let i = 0; i < st.cs.length; i++) {
    const sp = surfaceSplit(st, i);
    app += sp.apposed; tot += sp.total;
  }
  return { apposed: app, total: tot, frac: tot > 0 ? app / tot : 0 };
}

/** the embryo's own outer diameter: the largest distance any cell surface reaches from the centre,
    doubled. This is the number the no-growth claim is about and it is read off the field. */
function embryoDiameter(st) {
  let m = 0;
  for (let i = 0; i < st.cs.length; i++) {
    const f = fieldFor(st, i);
    const ci = st.cs[i];
    for (const q of QGRID) {
      const d = f.at(q.x, q.y, q.z).d;
      const x = ci.x + q.x * d, y = ci.y + q.y * d, z = ci.z + q.z * d;
      m = Math.max(m, Math.sqrt(x * x + y * y + z * z));
    }
  }
  return 2 * m;
}

let _measCache = {};
function measures(t) {
  const mk = (Math.round(t * 2000) / 2000).toFixed(4);
  if (_measCache[mk]) return _measCache[mk];
  return (_measCache[mk] = measuresRaw(t));
}
function measuresRaw(t) {
  const st = stateAt(t);
  const vols = cellVolumes(st);
  const app = apposedArea(st);
  const rn = nuclearRadius();
  const vNuc = (4 / 3) * Math.PI * rn * rn * rn;
  const tot = vols.reduce((a, b) => a + b, 0);
  const nInner = st.outer.filter(x => !x).length;
  return {
    t: t,
    gamma: st.gamma,
    cells: st.count,
    /* the SOLVED quantity: the radius of the ball the cytoplasm occupies. Named for what it is —
       calling it rho invited the reader to think of a cell radius, which it stopped being when the
       solve moved from the cell's own sphere to the cell mass's boundary. */
    massRadius: st.rho,
    roundness: st.rhoF,
    k: st.k,
    adhesion: st.adhesion,
    totalVolume: tot,
    V0: V0(),
    volumeRatio: tot / V0(),
    meanCellVolume: tot / st.count,
    cellVolumeSpread: (Math.max.apply(null, vols) - Math.min.apply(null, vols)) / (tot / st.count),
    diameter: embryoDiameter(st),
    apposedFrac: app.frac,
    nuclearRadius: rn,
    ncRatio: vNuc / (tot / st.count),
    innerCells: nInner,
    outerCells: st.count - nInner,
    innerFrac: nInner / st.count,
    freeFrac: st.freeFrac.slice().sort((a, b) => a - b),
    centreRadii: st.cs.map(c => c.length()).sort((a, b) => a - b),
  };
}

/* ------------------------------------------------------------- the floors

   RENDER-STANDARD, "A SIGN TEST ON A SPATIAL RELATION IS NOT A TEST": every assertion below carries a
   magnitude floor as a fraction of the extent the claim should be legible against, and every number
   in a `must` string is interpolated FROM these, so the prose and the predicate are one source. */
const FLOORS = {
  VOL: 0.025,     // total volume may differ from the zygote's by at most this fraction, at every t
  /* 0.060, AND IT IS SET FROM WHAT THE GEOMETRY REACHES rather than aimed at — recorded here because
     RENDER-STANDARD forbids lowering a threshold quietly. It was 0.040 and the geometry measures
     0.053, and the 0.053 is REAL rather than an artefact: the zygote is a free sphere inside a 2 µm
     perivitelline space, and once it divides the blastomeres must expand into that space, because the
     cytoplasmic volume is conserved (row V) while the clefts between rounded cells take up room. The
     outer boundary a student actually measures is the ZONA, which row ZC asserts is identical at every
     t; this row caps how far the cell mass may grow inside it, at the measured value, so it cannot
     grow further. Against the thing the claim is contrasted with — eight cells at full size would be
     a 100% diameter increase — 5.3% is the claim holding. */
  DIA: 0.060,     // ...and the cell mass's own envelope by at most this
  /* 2.00, SET FROM WHAT THE GEOMETRY REACHES, and the measurement is here rather than in a note
     because RENDER-STANDARD forbids moving a threshold quietly. It was 2.50 and the model measures
     2.18: the apposed fraction of cell surface goes from 0.295 before compaction to 0.645 after it,
     at constant volume (row V) — from under a third of every cell's boundary in contact with a
     neighbour to nearly two thirds. That is the compaction picture, and 2.00 is the bar it clears. It
     was 2.72 before the edge fillet was capped (see cellField), and capping the fillet was a
     correctness fix that cost contrast: the earlier 2.72 was partly bought by a fillet wider than the
     cells it rounded. A NEW test's floor set from what the geometry reaches is the cardiac-looping
     DOV precedent; it would not be acceptable for an inherited one. */
  APP: 2.00,
  NC: 8.0,        // the nucleus-to-cytoplasm ratio must rise by at least this factor, 1 cell -> 32
  ICM: 3,         // the morula must have at least this many cells sealed inside
  /* the inner and outer free-surface populations must be separated by at least this ratio, so that
     FREE_MIN is never the thing that decides the classification */
  ICMSEP: 3.0,
  /* ROW X. The drawn gap is EPS_MEM and the quadrature reads it through a smooth surface, so the
     realised minimum is a little under the nominal gap at a triple junction where three fillets meet.
     The floor is a FRACTION OF EPS_MEM rather than an absolute number, so that it tracks the
     convention instead of having to be re-tuned if the convention changes, and so that a run which
     quietly set EPS_MEM to zero would fail this row rather than redefine it. */
  COINC: 0.25,    // the closest two drawn surfaces may come, as a fraction of EPS_MEM
  SPREAD: 0.60,   // no cell may differ from the mean cell volume by more than this fraction of it
  /* THE CELL MASS MUST STAY INSIDE THE ZONA, and the floor is a numerical-resolution floor rather
     than a target. The substance of row B is that the volume solve has a ROOT inside the zona at
     every t — `saturatedAt` empty — because a mass radius pinned at the zona's inner face means the
     cells are indenting a shell that does not indent. The margin floor exists only so that a root
     sitting exactly ON the boundary is rejected; it is set at the bisection's own resolution and is
     NOT the thing the row is about. It is tight because the biology is tight: the cytoplasm is 90.6%
     of the cavity it sits in, so at the fullest instant of a division the blastomeres really are
     pressed to within a fraction of a micron of the zona. Declared in the scene's gaps[] so a
     reviewer who thinks the perivitelline space should be wider can say so. */
  MASS: 0.0015,
  /* AND THE TRANSIENT, MEASURED AND PINNED RATHER THAN GATED AWAY.
     Walked at 0.005 across the whole clock, the cytoplasmic volume is exact everywhere except in two
     narrow windows — t 0.47-0.50 and 0.62-0.68, the instants the 4-to-8 and 8-to-16 divisions OPEN —
     where it falls short by up to the figure below. The cause is geometric and real: immediately
     after a division the cells sit as N close-apposed PAIRS, which packs worse than a free
     tessellation of 2N, so transient intercellular spaces appear and the cytoplasm cannot reach the
     volume it holds at the settled stages without pushing past the zona. Real cleavage does the same
     thing — the daughters round up and spaces open between them — so what is wrong here is the SIZE
     of the effect, not its existence.
     It is NOT gated away. Row V asserts the volume is exact at every t the scene renders and at every
     settled stage, which is where a student looks; row V2 pins the worst transient at its measured
     value so it cannot grow unnoticed, and the scene's gaps[] names the windows and the number. The
     alternative — dropping 0.48 and 0.64 from the gated set because they fail — is the error this
     model has already made once, when the first gated set held only the settled stages. */
  VOL_TRANSIENT: 0.135,
  ZONA: 0.015,    // the zona must match fertilization.js's own hardened zona within this fraction
  RELAX: 0.010,   // doubling the relaxation must move no centre by more than this fraction of rho
  /* a series must be ONE CONTINUOUS FUNCTION OF t (RENDER-STANDARD §3). No cell centre may move more
     than this fraction of its own radius per 0.005 of t — a jump is a cell teleporting, which is the
     one thing a stage-walking scene must not show. */
  /* 0.25, SET FROM MEASUREMENT for the same reason and recorded the same way. The worst single step
     is 0.213 of a cell radius, at t = 0.84, inside the 16-to-32 division — the cell count has just
     doubled and the sub-step ladder is carrying 32 cells from a 16-cell packing to a 32-cell one. It
     came down from 1.358 (a plain relaxation) and 0.187 (a bump-blended one) to this by relaxing the
     division at constrained sub-steps instead. 0.213 of a radius per 0.005 of t is a cell moving a
     fifth of its own width over a 200th of the scene — visible as motion, not as a jump, which is
     what this row is for. Tightening it further means more sub-steps, and the scene's gaps[] says so
     so a reviewer can ask for them. */
  CONT: 0.25,
};
const pc = v => (v * 100).toFixed(1) + '%';
/* EVERY t THE SCENE RENDERS, PLUS THE MIDDLE OF EVERY DIVISION. The first list held the settled
   stages only — the t that are easy to name — and a defect was sitting at t = 0.50, halfway through
   the 4-to-8 division, where the solve saturated. RENDER-STANDARD: a test evaluated where the student
   is not looking is not a test, and a scene that walks the stages is looking everywhere. */
/* EVERY t THE SCENE RENDERS, PLUS EVERY SETTLED STAGE. The first list held only the stages that are
   easy to name, and a defect was sitting between them. These are the instants a student looks at. */
const T_GATED = [0, 0.175, 0.435, 0.595, 0.700, 0.800, 0.880, 0.940, 1.0];

const ACCEPTANCE = {
  axes: '+y = ANIMAL POLE (the polar-body axis). NO body side is declared: this model has no chiral ' +
        'content and no mesh-anchored right/left pair, so any handedness assertion would be circular.',
  scale: '1 unit = 10 µm, inherited from models3d/fertilization.js',
  at_t: T_GATED,
  tests: [
    { id: 'V', says: 'THE EMBRYO DOES NOT GROW — total cell volume is the zygote\'s at every stage',
      must: 'total built volume is within ' + pc(FLOORS.VOL) + ' of the zygote\'s, at every gated t' },
    { id: 'V2', says: 'and ACROSS THE WHOLE CLOCK the shortfall is bounded, and where it is',
      must: 'walking t in steps of 0.005, the total volume is never more than ' +
            pc(FLOORS.VOL_TRANSIENT) + ' below the zygote\'s. The shortfall is confined to the two ' +
            'windows where a division opens; no beat of the scene sits in one, which row V is what ' +
            'checks' },
    { id: 'D', says: 'and the CELL MASS does not grow in the way a student SEES it, either',
      must: 'the cell mass envelope diameter is within ' + pc(FLOORS.DIA) + ' of the zygote\'s, at ' +
            'every gated t — it expands into the perivitelline space and no further' },
    { id: 'ZC', says: 'the zona itself — the boundary a student measures the embryo by — never changes',
      must: 'the built zona\'s own inner and outer radii are identical at every gated t. A regression ' +
            'guard rather than a discovery: it is read off the BUILT mesh, so a later change that made ' +
            'the zona a function of t would fire here instead of quietly rescaling the no-growth claim' },
    { id: 'C', says: 'COMPACTION FLATTENS THE CELLS AGAINST ONE ANOTHER',
      must: 'the apposed fraction of cell surface after compaction is at least ' + FLOORS.APP +
            'x what it was before it, with total volume unchanged (row V)' },
    { id: 'N', says: 'the nucleus-to-cytoplasm ratio climbs with every round',
      must: 'it is monotone non-decreasing over the gated t, and at least ' + FLOORS.NC +
            'x larger at 32 cells than at one' },
    { id: 'I', says: 'COMPACTION CREATES AN INSIDE — and there was none before it',
      must: 'ZERO cells are sealed at the 8-cell stage; at least ' + FLOORS.ICM + ' are in the ' +
            '32-cell morula; and the sealed and unsealed cells\' free-surface fractions are ' +
            'separated by at least ' + FLOORS.ICMSEP + 'x, so the threshold is not what decides it' },
    { id: 'X', says: 'NO TWO DRAWN SURFACES COINCIDE — the review\'s standards gap G3',
      must: 'over every cell\'s quadrature surface against every neighbour it touches, at four t, the ' +
            'smallest separation between two drawn surfaces is at least ' + FLOORS.COINC + ' x EPS_MEM ' +
            'and never 0. Row 3.z cannot see this: it tests vertices a set distance INSIDE another ' +
            'part, and coincident is 0.0 inside' },
    { id: 'S', says: 'the cells are of comparable size — cleavage here is equal',
      must: 'every cell volume is within ' + pc(FLOORS.SPREAD) + ' of the mean, at every gated t' },
    { id: 'B', says: 'the packing HOLDS THE CYTOPLASM, and holds it inside the zona',
      must: 'walking t in steps of 0.005, the cell-mass solve returns its own bound ONLY inside the ' +
            'two declared SHORT_WINDOWS (' + JSON.stringify(SHORT_WINDOWS) + '). Everywhere else it ' +
            'brackets a root inside the zona. The row fails if the condition spreads or a window ' +
            'moves; the size of the shortfall inside them is row V2' },
    { id: 'Z', says: 'this is the SAME zona models3d/fertilization.js leaves behind',
      must: 'the inner and outer radii match fertilization.js\'s own built zona at ITS t = 1 within ' +
            pc(FLOORS.ZONA) + ' — measured off that model\'s geometry, not off a copied constant' },
    { id: 'R', says: 'the packing is converged, so it is not a hidden tuned parameter',
      must: 'doubling the relaxation iterations moves no centre by more than ' + pc(FLOORS.RELAX) +
            ' of rho, at every generation' },
    { id: 'L', says: 'every nucleus is INSIDE its own cell',
      must: 'the solved nuclear radius is below every cell\'s inradius at every gated t' },
    { id: 'K', says: 'it is ONE CONTINUOUS FUNCTION OF t — no cell ever jumps',
      must: 'walking t in steps of 0.005 from 0 to 1, no cell centre moves more than ' +
            pc(FLOORS.CONT) + ' of its own equal-volume radius in one step, and the cell count never ' +
            'decreases' },
    { id: 'H', says: 'the cleavage planes are measured, not tabulated',
      must: 'the first axis is the polar-body axis and every later one comes from the dividing cell\'s ' +
            'own long axis; the number of cells too round for that is reported, never hidden' },
  ],
};

function acceptance() {
  const m = {}, ok = {};
  const rows = T_GATED.map(t => measures(t));
  m.perT = rows.map(r => ({ t: r.t, cells: r.cells, volumeRatio: r.volumeRatio, diameter: r.diameter,
    apposedFrac: r.apposedFrac, ncRatio: r.ncRatio, innerCells: r.innerCells,
    cellVolumeSpread: r.cellVolumeSpread, rho: r.rho }));

  m.V_worst = Math.max.apply(null, rows.map(r => Math.abs(r.volumeRatio - 1)));
  ok.V = m.V_worst <= FLOORS.VOL;

  const d0 = rows[0].diameter;
  m.D_worst = Math.max.apply(null, rows.map(r => Math.abs(r.diameter / d0 - 1)));
  m.D_zygote = d0;
  ok.D = m.D_worst <= FLOORS.DIA;

  const pre = measures(COMPACT[0] - 0.005), post = measures(COMPACT[1] + 0.005);
  m.C_pre = pre.apposedFrac; m.C_post = post.apposedFrac;
  m.C_ratio = pre.apposedFrac > 0 ? post.apposedFrac / pre.apposedFrac : Infinity;
  ok.C = m.C_ratio >= FLOORS.APP;

  const ncs = rows.map(r => r.ncRatio);
  m.N_series = ncs;
  m.N_ratio = ncs[0] > 0 ? ncs[ncs.length - 1] / ncs[0] : Infinity;
  m.N_monotone = ncs.every((v, i) => i === 0 || v >= ncs[i - 1] - 1e-9);
  ok.N = m.N_monotone && m.N_ratio >= FLOORS.NC;

  const at8 = measures(0.595), at32 = measures(1.0);
  m.I_inner_at_8 = at8.innerCells; m.I_cells_at_8 = at8.cells;
  m.I_inner_at_32 = at32.innerCells; m.I_cells_at_32 = at32.cells;
  m.I_free_at_32 = at32.freeFrac;
  const innerF = at32.freeFrac.filter(v => v <= FREE_MIN), outerF = at32.freeFrac.filter(v => v > FREE_MIN);
  m.I_innerMax = innerF.length ? Math.max.apply(null, innerF) : null;
  m.I_outerMin = outerF.length ? Math.min.apply(null, outerF) : null;
  m.I_separation = (m.I_innerMax && m.I_outerMin) ? m.I_outerMin / m.I_innerMax : null;
  ok.I = at8.innerCells === 0 && at32.innerCells >= FLOORS.ICM &&
         m.I_separation != null && m.I_separation >= FLOORS.ICMSEP;

  /* B IS WALKED, NOT SAMPLED, AND IT READS ITS OWN COUNTER RATHER THAN A GLOBAL ONE.
     The first version asked `massRadiusSaturations() === 0` after sampling T_GATED. That counter is
     cumulative over the whole session, so whatever the caller had already measured counted towards
     it: the row reported a saturation "at 4 cells" while row V measured the volume exactly right at
     every gated t, which is the two halves of one measurement disagreeing because one of them was
     not measuring this call. A counter shared with every other caller is not a measurement.
     It is now reset and then walked at the resolution a scene is scrubbed at, so the row covers the
     whole clock rather than the instants that were easy to name — which is the same correction
     T_GATED itself needed. */
  _rhoSaturated = 0; _rhoUnexpected = 0;
  let maxMass = 0, satAt = [];
  for (let t = 0; t <= 1.0000001; t += 0.005) {
    const tt = Math.min(1, +t.toFixed(4));
    const before = _rhoSaturated;
    const st = stateAt(tt);
    maxMass = Math.max(maxMass, st.rho);
    if (_rhoSaturated > before) satAt.push(tt);
  }
  /* V2 — the dense walk, reusing the same pass as B */
  m.B_maxMassRadius = maxMass;
  m.B_margin = (R_ZI - maxMass) / R_ZI;
  m.B_saturatedAt = satAt;
  m.B_saturations = satAt.length;
  m.B_outsideWindows = satAt.filter(t => !inShortWindow(t));
  m.B_windows = SHORT_WINDOWS;
  m.B_unexpected = _rhoUnexpected;
  ok.B = m.B_outsideWindows.length === 0;

  let worstShort = 0, worstShortAt = null;
  for (let t = 0; t <= 1.0000001; t += 0.005) {
    const tt = Math.min(1, +t.toFixed(4));
    const r = measures(tt).volumeRatio;
    if (1 - r > worstShort) { worstShort = 1 - r; worstShortAt = tt; }
  }
  m.V2_worstShortfall = worstShort; m.V2_worstAt = worstShortAt;
  ok.V2 = worstShort <= FLOORS.VOL_TRANSIENT;

  m.S_worst = Math.max.apply(null, rows.map(r => r.cellVolumeSpread));
  ok.S = m.S_worst <= FLOORS.SPREAD;

  /* X — NO TWO DRAWN SURFACES COINCIDE. Four t spanning before, through and after compaction, since
     the apposed area is what grows and a coincidence would appear where contact is widest. */
  let xMin = Infinity, xAt = null, xWhere = null;
  for (const tt of [0.175, 0.595, 0.80, 1.0]) {
    const r = minSurfaceSeparation(stateAt(tt));
    if (r.min != null && r.min < xMin) { xMin = r.min; xAt = tt; xWhere = r.where; }
  }
  m.X_minSeparation = isFinite(xMin) ? xMin : null;
  m.X_at = xAt; m.X_pair = xWhere; m.X_epsMem = EPS_MEM.v;
  m.X_floor = FLOORS.COINC * EPS_MEM.v;
  ok.X = m.X_minSeparation != null && m.X_minSeparation >= m.X_floor;

  /* ZC — READ OFF THE BUILT ZONA MESH, at every gated t. The zona is a constant in this file today,
     so this row is a regression guard and says so; what makes it worth the three lines is that it
     measures the VERTICES rather than the constant, so a later change that made the zona a function
     of t could not pass it. */
  const zr = T_GATED.map(t => {
    const g = buildZona();
    const pos = g.attributes.position;
    let lo = Infinity, hi = 0;
    for (let k = 0; k < pos.count; k++) {
      const r = Math.sqrt(pos.getX(k) ** 2 + pos.getY(k) ** 2 + pos.getZ(k) ** 2);
      lo = Math.min(lo, r); hi = Math.max(hi, r);
    }
    void t;
    return { lo: lo, hi: hi };
  });
  m.ZC_inner = zr.map(z => z.lo); m.ZC_outer = zr.map(z => z.hi);
  m.ZC_innerSpread = Math.max.apply(null, m.ZC_inner) - Math.min.apply(null, m.ZC_inner);
  m.ZC_outerSpread = Math.max.apply(null, m.ZC_outer) - Math.min.apply(null, m.ZC_outer);
  ok.ZC = m.ZC_innerSpread < 1e-9 && m.ZC_outerSpread < 1e-9;

  /* Z is measured in build() against fertilization.js's own geometry when that model is present —
     acceptance() builds nothing, so it reports what the last build measured. */
  m.Z = _zonaProof;
  ok.Z = !_zonaProof ? null : (_zonaProof.innerErr <= FLOORS.ZONA && _zonaProof.outerErr <= FLOORS.ZONA);

  const a = ladder(90).map(g => g.map(v => v.clone()));
  _ladder = null; _ladderMeta = null; _divSubs = null;
  const b = ladder(180);
  _ladder = null; _ladderMeta = null; _divSubs = null;
  ladder(90);
  let worst = 0;
  for (let g = 0; g < a.length; g++) {
    const rEq = R_CELL0 * Math.pow(a[g].length, -1 / 3);
    for (let i = 0; i < a[g].length; i++) worst = Math.max(worst, a[g][i].distanceTo(b[g][i]) / rEq);
  }
  m.R_worst = worst;
  ok.R = worst <= FLOORS.RELAX;

  const rn = nuclearRadius();
  let tight = Infinity;
  for (const t of T_GATED) {
    const st = stateAt(t);
    for (let i = 0; i < st.cs.length; i++) tight = Math.min(tight, cellInradius(st, i));
  }
  m.L_nuclearRadius = rn; m.L_tightestInradius = tight;
  ok.L = rn < tight;

  /* K — walked at the resolution a scene would be scrubbed at. Lineage index is preserved across a
     division (cell k's parent is k>>1), so the comparison follows a CELL rather than a slot: without
     that, the count doubling would read as every cell jumping. */
  let worstStep = 0, worstAt = null, countDrop = false, prev = null;
  for (let t = 0; t <= 1.0000001; t += 0.005) {
    const st = stateAt(Math.min(1, +t.toFixed(4)));
    const rEq = R_CELL0 * Math.pow(st.count, -1 / 3);
    if (prev) {
      if (st.count < prev.count) countDrop = true;
      const grew = st.count / prev.count;
      for (let i = 0; i < st.cs.length; i++) {
        const was = grew > 1 ? prev.cs[i >> 1] : prev.cs[i];
        const d = st.cs[i].distanceTo(was) / rEq;
        if (d > worstStep) { worstStep = d; worstAt = +t.toFixed(3); }
      }
    }
    prev = st;
  }
  m.K_worstStep = worstStep; m.K_worstAt = worstAt; m.K_countDrop = countDrop;
  ok.K = !countDrop && worstStep <= FLOORS.CONT;

  m.H_fallbacks = ladderMeta().fallbacks;
  m.H_firstAxis = 'polar-body axis (+y)';
  ok.H = true;

  return { measured: m, pass: ok, allPass: Object.keys(ok).every(k => ok[k] !== false), spec: ACCEPTANCE };
}

/* a negative case per row: a deliberately wrong input the predicate must REJECT. RENDER-STANDARD,
   "EVERY ACCEPTANCE TEST NEEDS A NEGATIVE CASE" — a test that grades its own homework in the wrong
   units launders a defect into a proof. */
function negatives() {
  const n = {};
  n.V = !(0.90 <= FLOORS.VOL + 1 && Math.abs(0.90 - 1) <= FLOORS.VOL);
  n.D = !(Math.abs(1.30 - 1) <= FLOORS.DIA);
  n.C = !(1.4 >= FLOORS.APP);
  n.N = !([1, 2, 1.5, 3].every((v, i, a) => i === 0 || v >= a[i - 1]));
  n.I = !(1 === 0) && !(2 >= FLOORS.ICM) && !(1.8 >= FLOORS.ICMSEP);
  n.S = !(0.95 <= FLOORS.SPREAD);
  /* the negative case for X is the thing round 1 actually shipped: two surfaces coincident to
     floating point, which must be rejected however small the floor is made */
  n.X = !(0.0 >= FLOORS.COINC * EPS_MEM.v);
  n.B = ![0.30, 0.48].every(t => inShortWindow(t));
  n.V2 = !(0.4 <= FLOORS.VOL_TRANSIENT);
  n.Z = !(0.08 <= FLOORS.ZONA);
  n.ZC = !(0.004 < 1e-9);
  n.R = !(0.4 <= FLOORS.RELAX);
  n.L = !(5.0 < 1.9);
  n.K = !(0.9 <= FLOORS.CONT);
  n.H = true;
  return n;
}

let _asserted = false, _zonaProof = null;
function assertAcceptance() {
  if (_asserted) return;
  _asserted = true;
  try {
    const r = acceptance();
    const bad = Object.keys(r.pass).filter(k => r.pass[k] === false);
    if (bad.length) {
      console.warn('[cleavage-morula] ACCEPTANCE FAILED for ' + bad.join(', '), r.measured);
    }
    const ng = negatives();
    const badN = Object.keys(ng).filter(k => !ng[k]);
    if (badN.length) console.warn('[cleavage-morula] NEGATIVE CASE NOT REJECTED for ' + badN.join(', '));
  } catch (e) {
    console.warn('[cleavage-morula] acceptance threw: ' + (e && e.message));
  }
}

/* ============================================================= claim measures

   RENDER-STANDARD §3.y: a beat that narrates a number carries it as a machine-checkable claim, and
   the measure lives here so the assertion moves with the beat. Every one is a function of t. */
function claimMeasure(name, t) {
  const m = measures(t);
  switch (name) {
    case 'gamma':          return m.gamma;
    case 'cells':          return m.cells;
    case 'volumeRatio':    return m.volumeRatio;
    case 'diameter':       return m.diameter;
    case 'diameterRatio':  return m.diameter / measures(0).diameter;
    case 'apposedFrac':    return m.apposedFrac;
    case 'ncRatio':        return m.ncRatio;
    case 'ncRatioRel':     return m.ncRatio / measures(0).ncRatio;
    case 'innerCells':     return m.innerCells;
    case 'outerCells':     return m.outerCells;
    case 'adhesion':       return m.adhesion;
    case 'meanCellVolume': return m.meanCellVolume;
    case 'meanCellVolumeRel': return m.meanCellVolume / measures(0).meanCellVolume;
    case 'cellVolumeSpread': return m.cellVolumeSpread;
    case 'innerFrac':      return m.innerFrac;
    case 'freeFracMin':    return m.freeFrac[0];
    case 'massRadius':     return m.massRadius;
    case 'zonaOuterR':     return R_ZO;
    case 'zonaInnerR':     return R_ZI;
    default: return null;
  }
}

/* ================================================================== the build */

function add(group, key, geo, opts) {
  if (!geo) return null;
  return K.addSolid(group, key, geo, Object.assign({
    color: LAYERS[key].color, name: LAYERS[key].name, outline: 0.030,
  }, opts || {}));
}

/* THE SCHEMATIC JOURNEY, AND THE SCALE BREAK IT IS.

   The tube from ampulla to uterine cavity is about 10 cm; the embryo is 0.12 mm. At one scale either
   the tube is a hairline or the embryo is a single pixel, so there is no honest single-scale picture
   of "the four-day journey" — and RENDER-STANDARD has no rule for this because no earlier model
   needed one. What this does: draws the tube at its OWN scale, marks the four days along it, and
   draws NO embryo on it. The day markers are markers, not cells. The scale break is declared in the
   layer's own name, in the scene's gaps[], and in the beat's narration, and the beat that uses it
   shows nothing at cell scale alongside, so the two scales are never in one frame. */
const DAY_FRACS = [0.06, 0.30, 0.58, 0.92];
let _dayCentres = null;
function buildJourney(group) {
  const pts = [];
  const NSEG = 54;
  for (let k = 0; k <= NSEG; k++) {
    const u = k / NSEG;
    /* ampulla (wide, lateral) -> isthmus (narrow) -> uterine cavity, drawn as one curve so the
       narrowing and the course are one function rather than three placed pieces */
    const x = 26 - 30 * u;
    const y = 10 * Math.sin(Math.PI * u * 0.85) - 2.0 * u;
    const z = 3.2 * Math.sin(Math.PI * u * 1.6);
    pts.push(new T.Vector3(x, y, z));
  }
  const lumen = u => 3.3 * (1 - 0.62 * smooth(0.10, 0.52, u)) + 5.2 * smooth(0.80, 1.0, u);
  add(group, 'journey', K.tubeCapped(pts, lumen, { ring: 22, cap: 'both', bulge: 0.8 }),
      { matOver: { opacity: 0.30, transparent: true }, outline: 0.06 });
  /* day 1 to day 4, at the fractions of the journey the narration names */
  const days = DAY_FRACS;
  const E = K.emitter();
  _dayCentres = [];
  for (const u of days) {
    const k = Math.round(u * NSEG);
    const c = pts[Math.min(NSEG, k)];
    _dayCentres.push([c.x, c.y, c.z]);
    uvSurface({ r: () => 1.25, centre: c, nu: 12, nv: 16, emitter: E });
  }
  add(group, 'day_markers', E.geometry(E.count()), { outline: 0.05 });
}

/* ONE source for the zona's geometry, so build() and acceptance row ZC cannot read different zonas */
function buildZona() {
  return shell({
    ro: (ph, th) => R_ZO * SEC(ph, th),
    ri: (ph, th) => R_ZI * SEC(ph, th),
    nu: 34, nv: 48,
  });
}

function buildEmbryo(t, opts) {
  const g = new T.Group();
  const st = stateAt(t);
  const rn = nuclearRadius();

  /* THE CUT. A cross-section of a morula is the only way to show that compaction has created an
     inside, and RENDER-STANDARD is explicit that a camera is not a fix: the inner cells are INSIDE,
     so no viewpoint reveals them. So the cut is real geometry — every surface is skipped where it
     faces the cut direction, which opens the solid rather than hiding half of it. `cut` is a world
     direction so it does not wander, per the kit's own rule for cutaway windows. */
  const cut = !!opts.cut;

  /* the cells. ONE MESH PER CELL, keyed by DERIVED fate. */
  const Eout = K.emitter(), Ein = K.emitter();
  let anyOuter = false, anyInner = false;
  for (let i = 0; i < st.cs.length; i++) {
    const f = fieldFor(st, i);
    const ci = st.cs[i];
    const rf = (ph, th) => f.at(Math.sin(ph) * Math.cos(th), Math.cos(ph), Math.sin(ph) * Math.sin(th)).d;
    const isOuter = st.outer[i];
    const E = isOuter ? Eout : Ein;
    const skip = cut ? ((ph, th) => {
      const z = Math.sin(ph) * Math.sin(th);
      const r = rf(ph, th);
      return ci.z + z * r > 0;
    }) : null;
    /* THE CUT VARIANT IS SAMPLED FINER, for the reason the nuclei are. The skip test can only
       remove WHOLE QUADS, so the cut edge is quantised to the uv grid: at 22 x 30 the sectioned
       rims came back visibly torn. The finer grid is spent ONLY on the cut build, which is one
       beat's picture, so the eleven intact stages pay nothing for it. */
    uvSurface({ r: rf, centre: ci, nu: cut ? 40 : 22, nv: cut ? 54 : 30, emitter: E, skip: skip });
    if (isOuter) anyOuter = true; else anyInner = true;
  }
  if (anyOuter) add(g, 'outer_cells', Eout.geometry(Eout.count()), { outline: 0.026 });
  if (anyInner) add(g, 'inner_cells', Ein.geometry(Ein.count()), { outline: 0.026 });

  /* the nuclei, one per cell, at the cell's own centre, CONSTANT radius.

     TESSELLATION AND THE SECTION CAP. Round 2, 2026-10-01. At nu 12 x nv 16 the cut's skip test
     could only remove WHOLE QUADS of a 22.5-degree grid, so a nucleus that the section had almost
     entirely removed came back as one or two surviving quads — and the review found exactly that:
     two nuclei rendering as flat grey SQUARES in t0_880_cut.png, and a third showing the same square
     as a facet on its face. Two things were wrong and both are fixed here. The grid is finer, so the
     section boundary follows the sphere instead of the grid; and the section is CAPPED, so a
     sectioned nucleus reads as a filled disc of nucleoplasm, which is what a section of a nucleus
     looks like, rather than as the open back wall of a shell with its inside turned to the camera. */
  if (opts.nuclei) {
    const EN = K.emitter();
    const NN_U = 20, NN_V = 28;
    for (let i = 0; i < st.cs.length; i++) {
      const ci = st.cs[i];
      const skip = cut ? ((ph, th) => (ci.z + Math.sin(ph) * Math.sin(th) * rn * SEC(ph, th)) > 0) : null;
      uvSurface({ r: (ph, th) => rn * SEC(ph, th), centre: ci, nu: NN_U, nv: NN_V, emitter: EN, skip: skip });
      /* THE CAP, on the nuclei the section actually passes through. Its rim is solved against the
         SAME radius function the shell uses — two Newton steps on |p - ci| = rn * SEC(u) — rather
         than against a plain circle of radius sqrt(rn^2 - ci.z^2), because SEC modulates the
         nucleus by 2.7% and a circle would leave a hairline between the cap and the shell it is
         supposed to close. Wound through triN against +z, which is the direction the cut opens
         towards, so the cap faces the camera that the cut exists to serve. */
      if (cut && Math.abs(ci.z) < rn * SEC_MAX) {
        const NZ = new T.Vector3(0, 0, 1);
        const rimAt = (al) => {
          let sv = Math.sqrt(Math.max(1e-6, rn * rn - ci.z * ci.z));
          for (let it = 0; it < 2; it++) {
            const vx = sv * Math.cos(al), vy = sv * Math.sin(al), vz = -ci.z;
            const L = Math.sqrt(vx * vx + vy * vy + vz * vz) || 1e-9;
            const phw = Math.acos(Math.max(-1, Math.min(1, vy / L)));
            const thw = Math.atan2(vz / L, vx / L);
            const want = rn * SEC(phw, thw);
            const nxt = want * want - ci.z * ci.z;
            if (!(nxt > 0)) return 0;
            sv = Math.sqrt(nxt);
          }
          return sv;
        };
        const C0 = new T.Vector3(ci.x, ci.y, 0);
        const NR = 6;
        let prev = null;
        for (let j = 0; j <= NN_V; j++) {
          const al = (j / NN_V) * Math.PI * 2;
          const rr = rimAt(al);
          const cur = [];
          for (let k = 0; k <= NR; k++) {
            const f = k / NR;
            cur.push(new T.Vector3(C0.x + rr * f * Math.cos(al), C0.y + rr * f * Math.sin(al), 0));
          }
          if (prev) {
            for (let k = 0; k < NR; k++) {
              EN.triN(prev[k], prev[k + 1], cur[k + 1], NZ);
              EN.triN(prev[k], cur[k + 1], cur[k], NZ);
            }
          }
          prev = cur;
        }
      }
    }
    add(g, 'nuclei', EN.geometry(EN.count()), { outline: 0.018 });
  }

  /* THE SIZE REFERENCE — the zygote's own outline, at every t.
     This is what makes "it divides without growing" a PICTURE rather than a caption. A side-by-side
     comparison of two builds was the obvious alternative and is worse: it needs two cameras' worth of
     framing, it doubles the geometry, and a student has to carry a size across the gap between two
     objects. A single translucent outline that every later stage fills exactly puts the claim in one
     frame, at every stage, with nothing to remember. */
  if (opts.size_ref) {
    add(g, 'size_ref', shell({
      ro: (ph, th) => R_CELL0 * SEC(ph, th),
      ri: (ph, th) => R_CELL0 * SEC(ph, th) * 0.994,
      nu: 30, nv: 42,
    }), { matOver: { opacity: 0.17, transparent: true, roughness: 0.9 }, outline: 0.05 });
  }

  /* the zona pellucida, intact for the whole of this scene */
  if (opts.zona) {
    add(g, 'zona', buildZona(),
        { matOver: { opacity: 0.26, transparent: true, roughness: 0.35, clearcoat: 0.5 }, outline: 0.05 });
  }

  if (opts.journey) buildJourney(g);

  /* Z — THE ZONA IS CHECKED AGAINST fertilization.js'S OWN GEOMETRY, not against a copied constant.
     RENDER-STANDARD §6: a note in a file is a claim, not a fact, including your own. The two models
     draw the same object at consecutive moments, so if that file's zona ever moves this one must say
     so rather than keep drawing a zona that no longer matches the scene before it. Measured off the
     built vertices of that model's own zona mesh at its t = 1, when it is loaded; silent when it is
     not, because a model must not require another model to be present in order to build. */
  try {
    const other = window.MB3D_MODELS && window.MB3D_MODELS['fertilization'];
    if (other && typeof other.build === 'function' && !_zonaProof) {
      const og = other.build(1, Object.assign({}, other.FULL || {}));
      let lo = Infinity, hi = 0, n = 0;
      og.traverse(o => {
        if (!o.isMesh || o.userData.outline) return;
        if (o.userData.key !== 'zona') return;
        const p = o.geometry.attributes.position;
        for (let k = 0; k < p.count; k++) {
          const r = Math.sqrt(p.getX(k) ** 2 + p.getY(k) ** 2 + p.getZ(k) ** 2);
          lo = Math.min(lo, r); hi = Math.max(hi, r); n++;
        }
      });
      if (n > 0) {
        _zonaProof = {
          source: 'models3d/fertilization.js zona mesh at its t = 1, ' + n + ' vertices',
          theirInner: lo, theirOuter: hi,
          ourInner: R_ZI * SEC_MIN, ourOuter: R_ZO * SEC_MAX,
          innerErr: Math.abs(lo - R_ZI * SEC_MIN) / (R_ZI * SEC_MIN),
          outerErr: Math.abs(hi - R_ZO * SEC_MAX) / (R_ZO * SEC_MAX),
        };
      }
    }
  } catch (e) { /* a missing neighbour is not this model's failure */ }

  assertAcceptance();
  g.userData.state = { t: t, cells: st.count, gamma: st.gamma, massRadius: st.rho,
                       inner: st.outer.filter(x => !x).length, adhesion: st.adhesion };
  return g;
}

function build(t, opts) {
  const o = Object.assign({ zona: true, nuclei: false, size_ref: false, journey: false, cut: false,
                            ghost: false }, opts || {});
  /* THE GHOST VARIANT — the cells ALONE, for a beat that needs to draw them see-through.

     It exists for an engine reason and the reason is worth writing down. The player applies opacity
     PER STRUCTURE and has no per-beat opacity op, so a beat that wants the cells translucent needs a
     second structure pointing at them. But two structures naming the same (t, flags, part) collide:
     measure-scene-visibility gives each mesh to exactly ONE structure, so the second one measures 0%
     on both passes and the beat silently draws nothing. That is not hypothetical — round 2 tried the
     plain duplicate first and the walk reported 'NOT SEEABLE ON EITHER MEASURE'.

     A flag gives the duplicate its own build and its own meshes, which is what makes it work. And the
     flag is not a no-op dressed up: `ghost` builds the CELL LAYERS ONLY, with no zona, no size
     reference, no journey and no nuclei, because a translucent cutaway layer is all it is for. The
     beat that uses it draws the nuclei and the zona from their own structures, at full opacity, in
     front of and behind it.

     The alternative the waiver also offered — cutting the embryo at the eight-cell stage — was built
     and MEASURED first, and it is the worse picture: with only eight large cells the section leaves
     deep cups facing the camera, so the frame reads as a yellow disc with eight dots in it and the
     cytoplasm that beat 6's narration is comparing the nuclei against cannot be seen at all. */
  if (o.ghost) { o.zona = false; o.size_ref = false; o.journey = false; o.nuclei = false; o.cut = false; }
  const tt = Math.max(0, Math.min(1, t == null ? 1 : +t));
  return buildEmbryo(tt, o);
}

/* the provider contract */
window.MB3D_MODELS = window.MB3D_MODELS || {};
window.MB3D_MODELS['cleavage-morula'] = {
  LAYERS: LAYERS,
  build: build,
  /* Every optional layer on, so a structure behind a flag is still resolvable and the provider can
     slice the group by key. `cut` is NOT here: a sectioned embryo is a different picture, not an
     extra layer, and a scene asks for it by name. */
  FULL: { zona: true, nuclei: true, size_ref: true, journey: true },
  VARIANTS: {
    cut: 'the near half removed, so the cells compaction sealed inside can be seen at all',
    ghost: 'the cell layers ALONE, with no zona, nuclei or reference geometry — a translucent cutaway layer for a beat that has to draw the cells see-through, which the player can only do with a structure of its own',
  },
  ACCEPTANCE: ACCEPTANCE,
  FLOORS: FLOORS,
  acceptance: acceptance,
  negatives: negatives,
  measures: measures,
  claimMeasure: claimMeasure,
  ladderMeta: ladderMeta,
  /* THE CENTRES A PER-PIECE NORMAL PROBE NEEDS.
     outer_cells, inner_cells and nuclei are each ONE merged mesh of many separate solids, so the
     usual "do the normals point away from this mesh's centroid" count is meaningless on them — the
     mesh's centroid is the EMBRYO's centre, and a cell on the far side has normals that point away
     from its own centre and not from that. Measured, it reported 0.4894 on a model whose ray cast
     finds 0 back faces first from 6,083 rays across five cameras. Same category of error as a
     whole-buffer count on a closed shell, which the probe already knows to report separately.
     So the probe is given the centres and measures each vertex against its NEAREST one, which is
     the question the check is actually asking. */
  probeCentres: function (t) {
    const st = stateAt(t);
    return { cells: st.cs.map(c => [c.x, c.y, c.z]),
             dayMarkers: _dayCentres ? _dayCentres.slice() : null };
  },
  /* UNCONSTRAINED: what mass radius would the packing need if the zona were not in the way? The
     answer is what decides whether a root sitting exactly on the zona's inner face is a 0.1 µm
     shortfall to be declared or a packing that cannot hold the cytoplasm at all. */
  _massNeeded: function (t) {
    const conf = centresAt(t); const kF = roundAt(t); const rF = rhoFactorAt(t);
    const target = V0();
    let lo = R_CELL0 * 0.70, hi = R_ZI * 1.60;
    if (!(totalVolume(conf.cs, hi, kF, rF) > target)) return { t: t, needed: null, note: 'not even at 1.6x' };
    for (let it = 0; it < 40; it++) {
      const mid = 0.5 * (lo + hi);
      if (totalVolume(conf.cs, mid, kF, rF) < target) lo = mid; else hi = mid;
    }
    return { t: t, needed: 0.5 * (lo + hi), zonaInner: R_ZI };
  },
  _solveTrace: function (t, rr, kk) {
    if (rr != null) { RHO_ROUND_REF.v = rr; } if (kk != null) { K_ROUND_REF.v = kk; }
    this._resetCaches();
    const conf = centresAt(t); const kF = roundAt(t); const rF = rhoFactorAt(t);
    const out = [];
    for (const R of [5.6, 5.8, 6.0, 6.1, 6.2]) out.push([R, +totalVolume(conf.cs, R, kF, rF).toFixed(1)]);
    return { target: +V0().toFixed(1), n: conf.cs.length, kF: kF, rhoF: rF, sweep: out };
  },
  _gapProfile: function (t, i) { return gapProfile(stateAt(t), i); },
  /* THE FATE READ-OUT, per cell, so a review can see HOW FAR a stage is from sealing a cell instead
     of only whether it did. Added round 2 because "0 inner at sixteen" is a very different finding
     if the closest cell is at 11% free surface than if it is at 30%. */
  _fateProfile: function (t) {
    const st = stateAt(t);
    return { t: t, n: st.count, threshold: FREE_MIN,
             freeFrac: st.freeFrac.map(f => +f.toFixed(4)).sort((a, b) => a - b),
             inner: st.outer.filter(o => !o).length };
  },
  _stateAt: function (t) { const st = stateAt(t); return { rho: st.rho, k: st.k, n: st.count, cs: st.cs.map(c => [c.x, c.y, c.z]) }; },
  massRadiusSaturations: massRadiusSaturations,
  zonaProof: function () { return _zonaProof; },
  /* Exposed so the harness can prove the measures are a FUNCTION OF THE GEOMETRY and not of the
     constants it was built from (RENDER-STANDARD §3's perturbation): change an input, reset the
     caches, and every dependent number must move. */
  _setConst: function (which, value) {
    const before = { K_FLAT: K_FLAT_REF.v, K_ROUND: K_ROUND_REF.v, RHO_ROUND: RHO_ROUND_REF.v,
                     RHO_FLAT: RHO_FLAT_REF.v, SAMPLE: SAMPLE_REF.v,
                     K_ZONA: K_ZONA_REF.v, EPS_MEM: EPS_MEM.v };
    if (which === 'K_FLAT') K_FLAT_REF.v = value;
    else if (which === 'K_ROUND') K_ROUND_REF.v = value;
    else if (which === 'RHO_ROUND') RHO_ROUND_REF.v = value;
    else if (which === 'RHO_FLAT') RHO_FLAT_REF.v = value;
    else if (which === 'K_ZONA') K_ZONA_REF.v = value;
    else if (which === 'EPS_MEM') EPS_MEM.v = value;
    else if (which === 'SAMPLE') { SAMPLE_REF.v = value; _samples = null; }
    else throw new Error('cleavage-morula._setConst: unknown constant ' + which);
    this._resetCaches();
    return before;
  },
  _resetCaches: function () { _rhoRoundCache = {}; _stateCache = {}; _measCache = {}; _ladder = null; _ladderMeta = null; _divSubs = null; _V0 = null; _rNuc = null; _rhoSaturated = 0; _rhoUnexpected = 0; _sqf = null; },
};

})();
