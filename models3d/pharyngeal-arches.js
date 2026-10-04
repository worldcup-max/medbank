/* MedBank · pharyngeal arches — PRODUCTION procedural model.
 *
 * Registers itself as MB3D_MODELS['pharyngeal-arches']: a LAYERS palette and build(t, opts) ->
 * THREE.Group whose meshes carry userData.key. That is the whole contract the procedural provider in
 * viz3d.js depends on.
 *
 * WRAPPED IN AN IIFE. Only the registration escapes — RENDER-STANDARD, "EVERY MODEL IS WRAPPED IN AN
 * IIFE": a model written at top level puts T, K, C and LAYERS into global lexical scope and the next
 * model to load dies on "Identifier 'T' has already been declared", taking the page with it.
 *
 * ---------------------------------------------------------------------------------------------
 * WHY THIS IS PROCEDURAL AT ALL, since RENDER-STANDARD section 5 says to ask.
 *
 * `available-meshes.json` holds no pharyngeal-region embryonic geometry, and there is no scan of a
 * week-4 embryo's arches to have: BodyParts3D is an adult. So the choice is not mesh-versus-procedural,
 * it is procedural-versus-nothing, and Frank's standing rule (BUILD-QUEUE policy note, 2026-09-10) is
 * "WHERE NO MESH EXISTS, GO PROCEDURAL IMMEDIATELY".
 *
 * And the test RENDER-STANDARD section 5 actually names — "would a student be marked wrong for the
 * difference between our version and the real one?" — comes out NO here, which is the stronger reason.
 * A pharyngeal arch is not an irregular form a student is examined on recognising. It is examined as a
 * SERIES: six bars on the side wall of the pharynx, each with one cartilage, one muscle block, one
 * nerve and one artery, and the examinable content is which belongs to which, plus the two consequences
 * that follow from the artery pattern. Bars round a tube is what every text draws, because that is what
 * the thing is. Contrast the scapula in section 5: its fossae answer to muscle pull and a plausible one
 * is wrong in ways no reviewer can name. Nothing here has that property.
 *
 * ---------------------------------------------------------------------------------------------
 * WHAT t MEANS. t = 0 is DAY 22 — arch 1 is up, arch 2 appearing. t = 1 is DAY 56, the end of week 8:
 * the arch arteries have finished remodelling into the adult pattern, the cervical sinus has closed and
 * the heart has descended. day(t) = 22 + 34 t. Every number below that quotes a day is converted
 * through dayT() so there is one place the mapping lives.
 *
 * AXES. +x = embryo LEFT, -x = RIGHT, +y = CRANIAL, +z = VENTRAL. This is the corpus convention and it
 * is NOT asserted here by comment: `viz-training/tools/prove-corpus-axes.mjs` measures it off six
 * BodyParts3D right/left mesh pairs and checks this file's `axes` string against what it measured.
 * RENDER-STANDARD, "A DECLARED AXIS IS NOT A PROVED ONE, AND A SYMMETRIC MODEL CANNOT PROVE ITS OWN",
 * gives two ways out and that tool is route (b). Route (a) is covered too, and it matters more here than
 * on most items because THE SIDE IS THE TEACHING: acceptance rows A, H, I, J and K measure the two
 * recurrent laryngeal nerves out of the built geometry, and row K checks that the asymmetry is ABSENT
 * early and arrives with the regression — so a flipped sign cannot pass by mirroring the picture, which
 * is exactly how lateral-folding's declaration went unchecked.
 *
 * ---------------------------------------------------------------------------------------------
 * THE MECHANISM, AND THE PARAMETER THAT IS SOLVED RATHER THAN TUNED.
 *
 * RENDER-STANDARD: "SOLVE THE PARAMETER THAT DECIDES THE EXAMINABLE RELATION. Ask which number a
 * student would be marked wrong for, and solve THAT one against a stated constraint."
 *
 * On this item that number is not a shape. It is WHERE EACH RECURRENT LARYNGEAL NERVE HOOKS. The rule a
 * student is examined on is one sentence — each nerve is caught under the LOWEST ARCH ARTERY ON ITS OWN
 * SIDE THAT IS STILL THERE — and the asymmetry everybody memorises is a CONSEQUENCE of it:
 *
 *   · on the RIGHT the sixth arch artery's distal part regresses, so nothing holds the nerve at arch 6
 *     and it rides up to the fourth, which is the right subclavian artery;
 *   · on the LEFT the sixth arch artery's distal part survives as the ductus arteriosus, so the nerve
 *     stays under it and is towed down into the chest by the descending heart.
 *
 * So the hooks are NOT positioned. `solveHook(side, t)` searches the arch arteries this model actually
 * built, caudal-most first, and returns the first whose hook station still exists at that t —
 * `archArteryKeep()` is the only input, and it is the regression schedule, not a nerve parameter. The
 * left hook's DEPTH is likewise not a constant: it is read off the ventral end of the artery it hooks,
 * which descends with the heart, so "towed down by the descent of the heart" is arithmetic here rather
 * than a caption. Change the regression schedule and both nerves move, correctly, with no edit to
 * either nerve. Row K is the proof that this is what is happening: before the regression the two hooks
 * sit at the SAME level to within 7% of the model's height, and the whole asymmetry appears afterwards.
 *
 * A tuned alternative — two hand-placed hook heights — would have passed every rendering check in the
 * battery and taught the right picture for the wrong reason, which is the lateral-folding failure mode:
 * a constant restated in the test that checks it.
 *
 * ---------------------------------------------------------------------------------------------
 * GEOMETRY NOTES, stated because each one is a simplification somebody should be able to argue with.
 * All five are repeated in the scene's gaps[] so a reviewer meets them without reading source.
 *
 *  1. THE PHARYNGEAL AXIS CURVES, and the arches are built in its frame rather than in world y. The
 *     axis bends ventrally as it runs cranially — the cervical flexure — which is what makes the
 *     picture read as an embryo with its head bent over the arches instead of a ladder. Because the
 *     axis curves only in the y-z plane, world x is exactly perpendicular to it everywhere, so the
 *     frame is analytic (N = +x, B = N x D) and needs no parallel transport. That is not a shortcut:
 *     a transported frame twists, and RENDER-STANDARD's "AIM A CUTAWAY AT A WORLD DIRECTION, NOT AN
 *     ANGLE" is the same hazard. Here there is nothing to twist.
 *
 *  2. EACH ARCH IS ONE SOLID THROUGH THE MIDLINE, not a left half plus a right half. The arch is
 *     swept as a single continuous crescent from the right dorsal end, round the right side, through
 *     the ventral midline, and out to the left dorsal end. Two halves meeting at x = 0 would either
 *     leave two end caps exposed at the join or interpenetrate, and either way the pair would need
 *     excluding by name from the no-shared-space row. One solid has no join to argue about, and it is
 *     also what the thing is: the arch pair meets its fellow ventrally.
 *
 *     The parametrisation is in the signed angle th about the pharyngeal axis, th = 0 at the ventral
 *     midline and |th| growing to THM at the two dorsal ends, with the caudal droop as (th/THM)^2 —
 *     EVEN in th, so the curve is smooth through the midline. The obvious parametrisation, |th|, puts
 *     a V in the centreline exactly where the picture is most looked at; and the other obvious one,
 *     u^2, makes the curve's speed zero at u = 0, where a swept frame degenerates.
 *
 *  3. THE CROSS-SECTION IS A MAGNIFIED SPECIMEN, OFF TO THE SIDE, not a clip plane. Beat 2 teaches the
 *     five ingredients of one arch, which at the scale of the whole series is a few pixels across. So
 *     `section: true` builds a x12 transverse slab of arch 2 and parks it clear of the embryo, the same
 *     shape chorion-placenta-early uses for its villus strip. The player frames per view, to the
 *     bounding box of what is VISIBLE, so a beat that shows only the slab keys frames only the slab.
 *
 *  4. THE SLAB'S FOUR CORE INCLUSIONS SPAN 1.25x THE MATRIX THICKNESS, so each presents its own face
 *     to a camera looking down the section axis. This is a presentational offset and it is declared
 *     rather than hidden: without it the matrix's near face is the first surface over all four, and
 *     the beat whose entire subject is what is IN the core would be a picture of a blank disc.
 *     Row N measures the protrusion so it cannot drift, and acceptance excludes the four from the
 *     no-shared-space row BY NAME — they are inside the matrix, which is the anatomy.
 *
 *  5. TWO VESTIGE FLOORS, and they are not claims. Arch 5 and the fifth arch artery leave nothing in
 *     the human, so the honest size for both at t = 1 is zero — but a key that builds no triangles
 *     resolves through the adapter as reason:'none', which the player shows a student as "there is no
 *     model of this structure". So both floor at a few per cent of full size rather than vanishing.
 *     Row F asserts arch 5 is at least 3x larger at its own day 29 than at t = 1, which is what makes
 *     the floor legible as a vestige; the scene pins arch5's ref to day 29, where the beat that names
 *     it can actually show it; and the scene's gaps[] says in words that the residue is a rendering
 *     floor and not an anatomical persistence.
 *
 *  6. WHAT THIS MODEL DOES NOT BUILD. No surface ectoderm over the whole series — the ectodermal
 *     covering is taught on the magnified slab, where it is legible, and a translucent closed shell
 *     over the embryo would have bought the self-occlusion artefact RENDER-STANDARD 3.ac describes for
 *     nothing. No muscle blocks on the whole-series model, for the same reason, only on the slab. No
 *     pouch derivatives (thymus, parathyroids, tonsil, tubotympanic recess): those belong to the
 *     'Pharyngeal pouches' curriculum entry and the scene deliberately does not claim it.
 */
(function () {

const T = window.THREE;
const K = window.VizKit;      // render-kit.js owns winding, normals, colour and silhouettes
const C = K.C;

/* ------------------------------------------------------------------ palette */

const LAYERS = {
  pharynx:        { color: 0xd8b48a, name: 'Pharyngeal foregut' },
  grooves:        { color: 0x9fb4c9, name: 'Ectodermal clefts' },
  pouches:        { color: 0xc98fb0, name: 'Endodermal pouches' },
  arch1:          { color: 0xc0392b, name: 'Arch 1 — mandibular' },
  arch2:          { color: 0xe67e22, name: 'Arch 2 — hyoid' },
  arch3:          { color: 0xd4ac0d, name: 'Arch 3' },
  arch4:          { color: 0x117864, name: 'Arch 4' },
  arch5:          { color: 0x95a5a6, name: 'Arch 5 — transient' },
  arch6:          { color: 0x2874a6, name: 'Arch 6' },
  cart1:          { color: 0xf1948a, name: "Meckel's cartilage" },
  cart2:          { color: 0xf0b27a, name: "Reichert's cartilage" },
  cart3:          { color: 0xf4d03f, name: 'Arch 3 cartilage — hyoid' },
  cart4:          { color: 0x48c9b0, name: 'Thyroid & epiglottic cartilage' },
  cart6:          { color: 0x5dade2, name: 'Cricoid & arytenoid cartilage' },
  aortic_sac:     { color: 0xb03a2e, name: 'Aortic sac' },
  dorsal_aorta:   { color: 0x7b241c, name: 'Dorsal aortae' },
  aa1:            { color: 0xcd6155, name: 'First arch artery' },
  aa2:            { color: 0xd98880, name: 'Second arch artery' },
  aa3_r:          { color: 0xa93226, name: 'Third arch artery — right' },
  aa3_l:          { color: 0xcb4335, name: 'Third arch artery — left' },
  aa4_r:          { color: 0x922b21, name: 'Fourth arch artery — right' },
  aa4_l:          { color: 0xc0392b, name: 'Fourth arch artery — left' },
  aa5:            { color: 0xe6b0aa, name: 'Fifth arch artery — transient' },
  aa6_r:          { color: 0x5499c7, name: 'Sixth arch artery — right' },
  aa6_l:          { color: 0x2e86c1, name: 'Sixth arch artery — left' },
  cn5:            { color: 0xf7dc6f, name: 'Trigeminal nerve (V)' },
  cn7:            { color: 0xf8c471, name: 'Facial nerve (VII)' },
  cn9:            { color: 0xf5b041, name: 'Glossopharyngeal nerve (IX)' },
  cn10:           { color: 0xeaeded, name: 'Vagus nerve (X)' },
  sln:            { color: 0xd5d8dc, name: 'Superior laryngeal nerve' },
  rln_r:          { color: 0xffffff, name: 'Right recurrent laryngeal nerve' },
  rln_l:          { color: 0xfcf3cf, name: 'Left recurrent laryngeal nerve' },
  heart:          { color: 0x8e44ad, name: 'Heart' },
  cervical_sinus: { color: 0x7f8c8d, name: 'Cervical sinus' },
  branchial_cyst: { color: 0xaf7ac5, name: 'Branchial cyst' },
  sec_mesoderm:   { color: 0xd7bde2, name: 'Arch core — mesoderm' },
  sec_ectoderm:   { color: 0x85c1e9, name: 'Ectoderm (outside)' },
  sec_endoderm:   { color: 0xf1948a, name: 'Endoderm (inside)' },
  sec_cartilage:  { color: 0x5dade2, name: 'Cartilage — neural crest' },
  sec_muscle:     { color: 0xc0392b, name: 'Muscle — paraxial mesoderm' },
  sec_nerve:      { color: 0xf7dc6f, name: 'Arch nerve' },
  sec_artery:     { color: 0xa93226, name: 'Arch artery' },
};

/* --------------------------------------------------------------- time, days */

const DAY0 = 22, DAY1 = 56;
function dayT(d) { return (d - DAY0) / (DAY1 - DAY0); }     // a day -> t
function tDay(t) { return DAY0 + t * (DAY1 - DAY0); }       // t -> a day

/* smoothstep between two DAYS, so every schedule below reads in days */
function ramp(t, dA, dB) {
  const a = dayT(dA), b = dayT(dB);
  if (b <= a) return t >= b ? 1 : 0;
  const u = Math.max(0, Math.min(1, (t - a) / (b - a)));
  return u * u * (3 - 2 * u);
}

/* --------------------------------------------------------- the pharyngeal axis

   A(v) for v in [0,1], v = 1 CRANIAL. The axis curves ventrally as it runs cranially (the cervical
   flexure) and is straight-ish caudally. Only y and z vary, so world x stays exactly perpendicular to
   it and the frame is analytic — note 1 in the header.                                              */

const AX_Y0 = -1.95, AX_Y1 = 2.30;     // caudal and cranial ends of the axis
const AX_BEND = 0.78;                   // how far the cranial end swings ventrally

function axisPoint(v, out) {
  const y = AX_Y0 + (AX_Y1 - AX_Y0) * v;
  const z = AX_BEND * v * v * v;        // flat caudally, swinging ventrally over the top
  return out.set(0, y, z);
}
function axisDir(v, out) {
  const dy = (AX_Y1 - AX_Y0);
  const dz = AX_BEND * 3 * v * v;
  return out.set(0, dy, dz).normalize();
}
/* the pharyngeal tube's own radius at v: wider cranially (the primitive pharynx is a broad slit) */
function pharynxR(v) { return 0.115 + 0.135 * v; }

const _N = new T.Vector3(1, 0, 0);       // LEFT — exactly perpendicular to the axis everywhere
const _d = new T.Vector3(), _bv = new T.Vector3(), _ap = new T.Vector3();

/** A point at (v, th, r): th = 0 is VENTRAL, +th swings to the embryo's LEFT. */
function ringPoint(v, th, r, out) {
  axisPoint(v, _ap); axisDir(v, _d);
  _bv.crossVectors(_N, _d).normalize();                 // ventral-ish, perpendicular to the axis
  return out.copy(_ap)
    .addScaledVector(_N, r * Math.sin(th))
    .addScaledVector(_bv, r * Math.cos(th));
}

/** The same, displaced `ax` ALONG the pharyngeal axis — the arch's own cranio-caudal direction.
    This is what lets the three things inside an arch occupy three different places in its
    cross-section instead of three different radii on one line. See the note on ARCH_CORE. */
function ringPointOff(v, th, r, ax, out) {
  ringPoint(v, th, r, out);
  axisDir(v, _d);
  return out.addScaledVector(_d, ax);
}

/* ------------------------------------------------- polyline hygiene

   EVERY HAND-BUILT CENTRELINE IN THIS FILE GOES THROUGH resampleUniform() BEFORE IT IS SWEPT, and
   that is a correctness requirement rather than tidiness.

   A tube swept along a polyline self-intersects wherever the centreline's radius of curvature falls
   below the tube's own radius: the inner side of the bend folds through itself, and the result is a
   solid some of whose surface is INSIDE it. The outward-normal probe is what detects this, and on the
   first version of the two recurrent laryngeal nerves it read 0.786 and 0.871 against a floor of
   0.98, with the failing vertices clustered at one place — y = -0.929, z = 0.238, the laryngeal end.
   The cause was spacing, not curvature as such: the ascending limb's samples were 0.021 apart in the
   tracheo-oesophageal groove and then made a single 0.55 jump on to the larynx, a ratio of 26 to 1,
   and `parallelFrame` transporting a frame across a step like that turns the ring most of the way
   round in one segment. The last point was also a duplicate of the one before it, which is where the
   56 edges shared by THREE triangles came from.
   So: strip duplicates, then resample at uniform arc length through a Catmull-Rom spline, which
   bounds the spacing and smooths the waypoints into a curve. This is the geometric statement of
   "a nerve is a smooth cord", and the probe is what says whether it worked.                        */

function dedupe(pts, eps) {
  const E = eps == null ? 1e-5 : eps;
  const out = [pts[0].clone()];
  for (let i = 1; i < pts.length; i++) {
    if (pts[i].distanceTo(out[out.length - 1]) > E) out.push(pts[i].clone());
  }
  return out.length >= 2 ? out : [pts[0].clone(), pts[pts.length - 1].clone()];
}

/** Catmull-Rom through the waypoints, resampled at uniform arc length. */
function resampleUniform(waypoints, n) {
  const P = dedupe(waypoints);
  if (P.length < 3) {
    const out = [];
    for (let i = 0; i <= n; i++) out.push(new T.Vector3().lerpVectors(P[0], P[P.length - 1], i / n));
    return out;
  }
  /* duplicate the ends so the spline reaches them */
  const Q = [P[0].clone()].concat(P, [P[P.length - 1].clone()]);
  const DENSE = Math.max(n * 6, 240);
  const dense = [];
  const segs = Q.length - 3;
  for (let i = 0; i < DENSE; i++) {
    const u = (i / (DENSE - 1)) * segs;
    const k = Math.min(segs - 1, Math.floor(u));
    const f = u - k;
    const p0 = Q[k], p1 = Q[k + 1], p2 = Q[k + 2], p3 = Q[k + 3];
    const f2 = f * f, f3 = f2 * f;
    dense.push(new T.Vector3(
      0.5 * ((2 * p1.x) + (-p0.x + p2.x) * f + (2 * p0.x - 5 * p1.x + 4 * p2.x - p3.x) * f2 + (-p0.x + 3 * p1.x - 3 * p2.x + p3.x) * f3),
      0.5 * ((2 * p1.y) + (-p0.y + p2.y) * f + (2 * p0.y - 5 * p1.y + 4 * p2.y - p3.y) * f2 + (-p0.y + 3 * p1.y - 3 * p2.y + p3.y) * f3),
      0.5 * ((2 * p1.z) + (-p0.z + p2.z) * f + (2 * p0.z - 5 * p1.z + 4 * p2.z - p3.z) * f2 + (-p0.z + 3 * p1.z - 3 * p2.z + p3.z) * f3)));
  }
  /* walk it at uniform arc length */
  const cum = [0];
  for (let i = 1; i < dense.length; i++) cum.push(cum[i - 1] + dense[i].distanceTo(dense[i - 1]));
  const total = cum[cum.length - 1];
  const out = [];
  let j = 1;
  for (let i = 0; i <= n; i++) {
    const want = (i / n) * total;
    while (j < cum.length - 1 && cum[j] < want) j++;
    const a = cum[j - 1], b = cum[j];
    const f = b > a ? (want - a) / (b - a) : 0;
    out.push(new T.Vector3().lerpVectors(dense[j - 1], dense[j], f));
  }
  return out;
}

/* MAKE A CENTRELINE SWEEPABLE BY THE TUBE IT CARRIES.
 *
 * This is the constraint the polyline note above only half states. Uniform resampling fixed the
 * SPACING, and the outward-normal probe went from 0.786 to 1.000 on both recurrent nerves — but
 * measuring the curvature directly showed the probe had been flattered by its own sample size. Seven
 * of the arch arteries still had a minimum radius of curvature BELOW their own tube radius (the first
 * arch artery: 0.0106 against 0.0210, a ratio of 0.51), which means the inner side of that bend folds
 * through itself and part of the solid's surface lies inside the solid. The probe passed them at 71
 * sampled vertices because the folded patch is small, which is worth recording on its own: a sampled
 * probe that passes is evidence about the samples, and the curvature is the thing the fold is made of.
 * So the probe's sample count went up by a factor of six AND this constraint was added, because the
 * second is what makes the geometry right and the first is only what would have caught it.
 *
 * The sharp bends are at the junctions where the artery's three legs meet — origin to ventral
 * midline, round the crescent, then the dive into the dorsal aorta — and a Catmull-Rom through those
 * waypoints is smooth but not gentle. Light Laplacian passes, with the ends pinned, open the bends
 * out with almost no change to the course: the loop stops as soon as the ratio clears its target, so
 * a path that is already sweepable is left exactly alone.
 */
const SWEEP_BUDGET = 260;   // a numerical budget, not a quality bar: row Q's floor is the bar
function smoothUntilSweepable(line, tubeR, target, maxPasses) {
  const want = (target || 1.25) * tubeR;
  const budget = maxPasses == null ? SWEEP_BUDGET : maxPasses;
  let passes = 0;
  let R = minCurvatureRadius(line);
  const lam = 0.5;
  while (R < want && passes < budget) {
    const prev = line.map(q => q.clone());
    for (let i = 1; i < line.length - 1; i++) {
      line[i].x += lam * ((prev[i - 1].x + prev[i + 1].x) / 2 - prev[i].x);
      line[i].y += lam * ((prev[i - 1].y + prev[i + 1].y) / 2 - prev[i].y);
      line[i].z += lam * ((prev[i - 1].z + prev[i + 1].z) / 2 - prev[i].z);
    }
    passes++;
    R = minCurvatureRadius(line);
  }
  return { passes, minR: R, ratio: R / (tubeR || 1e-9), reached: R >= want };
}

/** The smallest radius of curvature along a polyline — must exceed the tube radius it carries. */
function minCurvatureRadius(pts) {
  let best = Infinity;
  for (let i = 1; i < pts.length - 1; i++) {
    const a = pts[i - 1], b = pts[i], c = pts[i + 1];
    const ab = a.distanceTo(b), bc = b.distanceTo(c), ca = c.distanceTo(a);
    const s = (ab + bc + ca) / 2;
    const ar2 = s * (s - ab) * (s - bc) * (s - ca);
    if (ar2 <= 0) continue;
    const area = Math.sqrt(ar2);
    const R = (ab * bc * ca) / (4 * area);
    if (R < best) best = R;
  }
  return best;
}

/* ------------------------------------------------------------------ the arches

   Six arches. Each is ONE crescent solid from the right dorsal end through the ventral midline to the
   left dorsal end — note 2 in the header. THM is the dorsal half-angle; the dorsal ends sit at
   |th| = THM, paramedian and dorsal, beside the neural tube.                                        */

const THM = 2.32;                // the arch's dorsal end, beside the neural tube
const ARCH_DROOP = 0.072;        // how far down the axis an arch droops reaching the ventral midline

/* Per arch: v station of the DORSAL end, how far the bar stands out from the pharyngeal wall, the
   bar's own tube radius, and the day it appears. The levels are not evenly spaced: arches 1 and 2 are
   the big ones and arches 5 and 6 are crowded together at the bottom, which is what the series looks
   like and is also why a student mis-numbers 6 as 5. */
const ARCHES = [
  { n: 1, v: 0.795, stand: 0.090, rad: 0.215, day: 22.0 },
  { n: 2, v: 0.660, stand: 0.088, rad: 0.205, day: 24.0 },
  { n: 3, v: 0.533, stand: 0.070, rad: 0.158, day: 26.0 },
  { n: 4, v: 0.423, stand: 0.058, rad: 0.130, day: 28.0 },
  { n: 5, v: 0.345, stand: 0.055, rad: 0.076, day: 29.0 },
  { n: 6, v: 0.268, stand: 0.052, rad: 0.116, day: 28.5 },
];

/* THE CROSS-SECTIONAL LAYOUT OF AN ARCH, expressed once and used by the cartilage, the nerve and the
 * artery alike — which is the same arrangement the magnified section slab teaches, so the whole-series
 * model and the section cannot disagree about what is where.
 *
 * It exists because placing the three contents by RADIUS ALONE put them all on one line through the
 * bar's centre, where they cannot avoid each other, and the containment row walked them into one
 * another three times in a row: the nerve into the artery first, then — after being moved deeper — the
 * nerve into the cartilage, 22.4% of the trigeminal inside Meckel's cartilage. Each move fixed one
 * pair and created another, which is the signature of a layout problem rather than a number problem.
 *
 * An arch's cross-section has two free directions, not one: radially out from the pharynx, and ALONG
 * the pharyngeal axis (the bar's own cranio-caudal thickness). So the cartilage sits at the centre,
 * and the nerve and the artery flank it to either side along the axis, each pulled slightly deep.
 * The offsets are fractions of the BAR'S OWN radius, so every arch gets the same arrangement at its
 * own scale rather than six hand-fitted sets of numbers — and the bars were thickened by a factor of
 * 1.4 because the thinnest of them could not hold its own contents with clearance at the old size.
 */
const ARCH_CORE = {
  cart:   { ax:  0.00, rad:  0.00, calibre: 0.38 },   // central: the skeletal element
  nerve:  { ax:  0.72, rad: -0.25, calibre: 0.14 },   // cranial side of the bar, slightly deep
  artery: { ax: -0.72, rad: -0.25, calibre: 0.23 },   // caudal side, slightly deep — the deeper of the two
};
/** The radial distance of arch `a`'s bar CENTRELINE at station v, at size sz.
 *
 * THE STANDOFF DOES NOT SCALE WITH SIZE; only the thickness does. Both scaled at first, and the
 * consequence was found on arch 5: at its t = 1 vestige, size 0.085, the standoff collapsed to 0.005
 * and the whole bar sank back on to the pharyngeal wall — landing at radius 0.176, which is where the
 * arch arteries climb. The containment row measured 4.2% of it inside the third arch artery on both
 * sides, and no amount of re-fanning the arteries could fix it, because the bar was in their corridor
 * rather than beside it.
 *
 * Not scaling it is also the better reading of the anatomy. An arch that regresses THINS; it does not
 * sink into the wall it sits on, and a flattening ridge that ends up level with the vessels running
 * underneath it is not a picture of anything. (The deficit variants are a different scaling and still
 * reduce the standoff, deliberately: an under-built arch really is a lower one.) */
function barCentreR(a, sz, v) { return pharynxR(v) + a.stand + a.rad * sz + 0.012; }

/* HOW BIG AN ARCH IS AT t. It grows in over about two days from its own appearance day, then stays.
   Arch 5 is the exception: it appears on day 29 and is gone again by day 31, and floors at a vestige
   rather than at zero — note 5 in the header. */
const ARCH5_FLOOR = 0.085;
function archSize(a, t) {
  if (a.n === 5) {
    /* ARCH 5 HAS ITS OWN SCHEDULE AND THE TWO RAMPS MUST NOT OVERLAP. The first version had it
       appearing over days 29-31 and regressing over 29.6-31, so the two ramps fought and the arch
       never exceeded 0.41 of its own size — it was impossible to SHOW a student the thing they are
       meant to count and find missing, and row F could not measure a transient against a vestige
       because the peak and the floor were the same order. Appearing fast and then going is also what
       the texts describe. Its rudimentary CHARACTER is carried by its dimensions — `stand` 0.058 and
       `rad` 0.030 against arch 6's 0.092 and 0.053 — not by holding its growth down, so a full-size
       arch 5 is still a slim bar beside its neighbours. */
    const up = ramp(t, 28.8, 29.8);
    const gone = ramp(t, 30.2, 31.6);
    return up * (1 - (1 - ARCH5_FLOOR) * gone);
  }
  return ramp(t, a.day, a.day + 2.0);
}
/* The day arch 5 is at its largest — what the scene pins its ref to, and where row F measures. */
const ARCH5_PEAK_DAY = 30.0;

/** The centreline of arch `a` at t, as a polyline of NSEG+1 points, right dorsal end to left. */
function archCurve(a, t, nseg) {
  const sz = archSize(a, t);
  const pts = [];
  const n = nseg || 46;
  for (let i = 0; i <= n; i++) {
    const th = -THM + (2 * THM) * (i / n);
    const q = th / THM;
    /* EVEN in th, so the curve is smooth through the ventral midline — note 2 */
    const v = a.v - ARCH_DROOP * (1 - q * q);
    pts.push(ringPoint(v, th, barCentreR(a, sz, v), new T.Vector3()));
  }
  return pts;
}
/** The bar tapers towards both dorsal ends: thickest at the ventral midline, where the prominence is. */
function archRadiusFn(a, t) {
  const sz = Math.max(0.06, archSize(a, t));
  return s => a.rad * sz * (0.56 + 0.44 * Math.sin(Math.PI * s));
}

/* ---------------------------------------------------------- the cartilage bars

   The cartilage sits in the CORE of its arch, so its centreline runs at a smaller radius than the
   bar's. Arch 5 has none, by design and by anatomy: it is the one arch with no cartilage, no muscle,
   no nerve and no artery, and a cart5 that existed would teach the opposite.

   The cartilage spans only part of the arch: it runs from the dorsal end forward, and how far forward
   differs per arch. Arch 1's reaches nearly to the midline (Meckel's cartilage, and the mandible forms
   round it); arch 3's is a short caudal piece (the greater horn and lower body of the hyoid). The two
   halves of the hyoid are the examinable case and row M measures them.                              */
const CARTS = [
  { n: 1, frac: 0.90, day: 24.5 },
  { n: 2, frac: 0.80, day: 26.0 },
  { n: 3, frac: 0.62, day: 28.0 },
  { n: 4, frac: 0.70, day: 30.0 },
  { n: 6, frac: 0.76, day: 31.0 },
];
/** A content's tube radius inside arch `a` at size sz — a fraction of the bar's own calibre. */
function coreCalibre(a, sz, which) { return a.rad * sz * ARCH_CORE[which].calibre; }

function cartCurve(a, c, t, nseg) {
  const sz = archSize(a, t);
  const n = nseg || 40;
  const pts = [];
  const span = THM * c.frac;
  for (let i = 0; i <= n; i++) {
    const th = -span + (2 * span) * (i / n);
    const q = th / THM;
    const v = a.v - ARCH_DROOP * (1 - q * q);
    const C2 = ARCH_CORE.cart;
    pts.push(ringPointOff(v, th, barCentreR(a, sz, v) + C2.rad * a.rad * sz,
                          C2.ax * a.rad * sz, new T.Vector3()));
  }
  return pts;
}

/* ------------------------------------------------- the clefts and the pouches

   Context, not claimed: the scene's covers[] does NOT claim 'Pharyngeal clefts & membranes' or
   'Pharyngeal pouches' — those are their own curriculum entries. They are built because beat 1's
   narration says the bars are "separated outside by clefts and inside by pouches", and a narration
   that names something the picture does not draw is the defect this corpus keeps finding.

   A cleft is an ectodermal groove BETWEEN two arches, outside; a pouch is the endodermal recess at the
   same level, inside. Four of each, built as lens-shaped collars in the gap between consecutive arches.
   Both are ONE key each: the narration names them collectively, so four connected components is the
   correct answer and not a 3.ab finding — the intervertebral-disc case in that rule.             */
function gapStations() {
  const out = [];
  for (let i = 0; i < 4; i++) {
    const a = ARCHES[i], b = ARCHES[i + 1];
    out.push({ i: i + 1, v: (a.v + b.v) / 2 });
  }
  return out;
}

/* ------------------------------------------------------- the heart, descending

   The heart starts high, in the neck, and descends into the thorax through weeks 5 to 8. This is the
   input the left recurrent laryngeal nerve's depth is read off — see solveHook(). It is a single
   function and both the aortic sac and the sixth arch artery's ventral end follow it, so "towed down
   by the descending heart" is a consequence here rather than a second constant.                     */
const HEART_DESC = 1.42;
function heartDrop(t) { return HEART_DESC * ramp(t, 32.0, 54.0); }
function sacPoint(t, out) {
  /* the aortic sac sits just caudal and ventral to arch 6, on the midline, and goes down with the heart */
  const v = 0.215;
  axisPoint(v, _ap);
  return out.set(0, _ap.y - heartDrop(t), _ap.z + pharynxR(v) + 0.165);
}

/* WHERE EACH ARCH ARTERY LEAVES THE SAC, and this is a correction rather than a detail.
 *
 * The first version started all twelve arteries at the IDENTICAL sac point, which is a fair reading of
 * "each arch is fed by an artery running from the aortic sac to the dorsal aorta" and is wrong as
 * geometry: twelve tubes from one point are twelve tubes inside one another. The containment row
 * measured it immediately and the numbers were not marginal — the fifth arch artery's vestige sat
 * 95.8% inside the fourth's and 75% inside the third's, so the one artery a student is asked to notice
 * is missing would have been invisible in the beat that counts them, buried in its neighbours.
 *
 * The sac is a broad chamber with two horns, and the six pairs arise from it in cranio-caudal order.
 * So each artery gets its own origin: fanned along the sac in y, and off the midline in x by side, so
 * the left and right members of a pair are distinct vessels from the start instead of one vessel the
 * probe sees twice. The arteries are still CONFLUENT WITH THE SAC, which is the anatomy and is
 * excluded from the containment row by name. */
const SAC_HALF_X = 0.052;
const SAC_FAN_Y = 0.078;
const _sac = new T.Vector3();
function arteryOrigin(n, side, t, out) {
  sacPoint(t, _sac);
  return out.set(side * SAC_HALF_X, _sac.y + 0.125 - SAC_FAN_Y * (n - 1), _sac.z);
}

/* ------------------------------------------------------- the arch arteries

   Each runs from the aortic sac, round inside its own arch, to the dorsal aorta of its own side.

   REGRESSION IS A SURVIVING FRACTION, NOT A THINNING. `archArteryKeep(n, side, t)` returns how much of
   the path, measured FROM THE SAC, is still there. A regressing artery therefore gets shorter from the
   dorsal end inwards, which is what happens and what the adult derivative is: arch 1 keeps a proximal
   stub (part of the maxillary artery), arch 2 a smaller one (the stapedial), arch 6 on the RIGHT keeps
   its proximal half (the right pulmonary artery) and loses the distal half, while arch 6 on the LEFT
   keeps all of it, the distal part being the ductus arteriosus.

   NOTHING EVER REACHES ZERO, for the reason in header note 5: a key with no triangles comes back from
   the adapter as reason:'none', which the player shows a student as "there is no model of this
   structure". The floors are declared in the scene's gaps[].                                        */
function archArteryKeep(n, side, t) {
  /* 28-32 and 29-33 rather than 26-29 and 28-31. The texts put the first and second arch arteries'
     regression through week 5, and the earlier schedule had both already reduced to their stubs by
     day 30 — which is the only day on which all six pairs are present at once, and therefore the day
     the beat that asks a student to count them has to stand on. A schedule that leaves no instant
     where the scene's own picture exists is a model finding, not a narration one. */
  if (n === 1) return 1 - 0.70 * ramp(t, 28, 32);                 // -> maxillary stub
  if (n === 2) return 1 - 0.78 * ramp(t, 29, 33);                 // -> stapedial stub
  if (n === 3) return 1;                                           // -> common + proximal internal carotid
  if (n === 4) return 1;                                           // -> arch of aorta (L) / subclavian (R)
  if (n === 5) return 1 - 0.94 * ramp(t, 29.6, 31);                // -> nothing; floors at 0.06
  if (n === 6) return side < 0 ? 1 - 0.58 * ramp(t, 32, 38) : 1;   // R loses the distal half; L keeps it
  return 1;
}

/* WHICH END AN ARTERY REGRESSES FROM, and this is anatomy that the first version had backwards for
 * two of the six — found by the containment row, which is not what it was written to look for.
 *
 * Every artery was being trimmed from its DORSAL end, keeping the part nearest the aortic sac. For
 * arch 6 on the right that is correct: its proximal part becomes the right pulmonary artery and the
 * distal part is what goes. For arches 1 and 2 it is the wrong way round. What survives of the first
 * arch artery is a piece of the MAXILLARY artery and of the second a piece of the STAPEDIAL — both
 * DISTAL remnants, up in the face and the middle ear, which are taken over by the carotid system when
 * the proximal segments disappear. Neither has any remaining connection to the aortic sac.
 *
 * Trimming them the wrong way did not merely mislabel a stub, it drew an impossible vessel. At t = 1
 * the sac has descended 1.42 while arch 1 has not descended at all, so arch 1's full path is 3.8 units
 * long and "the first 30% of it from the sac" is a 1.4-unit trunk climbing out of the chest towards
 * the face — alongside arch 2's, from an origin 0.078 away, which is why the probe found 37.5% of one
 * inside the other. The picture was two long parallel vessels where the anatomy has two small distant
 * remnants, and the geometric defect and the anatomical one had the same single cause.
 */
const ARTERY_TRIM_FROM = { 1: 'start', 2: 'start', 3: 'end', 4: 'end', 5: 'start', 6: 'end' };

/* dorsal aorta: paired, running caudally alongside the axis, dorsal to the pharynx. It EXTENDS
   caudally as the embryo elongates and the heart descends — that extension is the descending thoracic
   aorta forming, and it is what the sixth arch artery's dorsal end comes to join. Driven by
   heartDrop(t), so there is still only one descent function in the model. */
/* IN THE RING FRAME, at a stated angle, like every other structure in this file.
   It used to be placed by world-space offsets off the axis — (side*r*0.42, y, z - r*0.92) — and that
   is not the same thing as an angle, because the pharyngeal axis CURVES: the ring frame's dorsal
   direction is perpendicular to the local axis direction, which near the cranial end is tilted a long
   way off world -z. So the reasoning used to separate the vagus from this vessel ("the aorta is at
   th = 2.714, so put the trunk at 2.98") was being done in one frame and the geometry built in
   another, and the probe went on finding 6.1% of the vagus inside the aorta while the arithmetic said
   they were 0.104 apart. Both are now angles in the same frame and the separation is real. */
const DA_TH = 2.71;
function dorsalAortaPoint(v, side, out) {
  if (v >= 0.10) return ringPoint(v, side * DA_TH, pharynxR(v) + 0.085, out);
  /* below v = 0.10 the vessel runs straight on down, converging towards the midline */
  ringPoint(0.10, side * DA_TH, pharynxR(0.10) + 0.085, out);
  const below = (0.10 - v) * (AX_Y1 - AX_Y0);
  out.y -= below;
  out.x *= Math.max(0.35, 1 - below * 0.45);
  return out;
}

/* HOW FAR EACH ARCH ARTERY IS DRAWN DOWN BY THE DESCENDING HEART.
 *
 * This is the input that makes "the nerve is towed down into the chest by the descending heart" a
 * measured consequence rather than a caption, and it is per-arch because the descent is not uniform:
 * the sixth arch artery is the one nearest the heart and goes down with it almost completely (its
 * distal part is the ductus arteriosus, which ends up low in the thorax running to the descending
 * aorta), the fourth is drawn down about four tenths as far (the arch of the aorta finishes at the
 * level of T4, well below where it started, but far above the ductus), the third hardly moves (the
 * carotids stay in the neck), and arches 1, 2 and 5 are gone before the descent begins so the number
 * is unused for them.
 *
 * WHY IT IS NEEDED AT ALL, recorded because the first version did not have it and looked fine. With
 * only the aortic SAC descending, the hook station at HOOK_FRAC = 0.62 sits in the arch crescent,
 * whose dorsal end was pinned to an undescended dorsal aorta — so the left hook moved 0.104 units
 * while heartDrop moved 1.42, and the beat that teaches why the left nerve ends up in the chest drew
 * a nerve that had barely moved. Row J is floored at 0.35 of the model's own y span precisely so that
 * version cannot pass. */
const ARTERY_DESCENT = {
  1: { r: 0, l: 0 }, 2: { r: 0, l: 0 }, 5: { r: 0, l: 0 },
  3: { r: 0.10, l: 0.10 },      // the carotids stay in the neck
  4: { r: 0.52, l: 0.74 },      // right subclavian at the root of the neck; arch of aorta lower, at T4
  6: { r: 0.80, l: 0.95 },      // right pulmonary artery; the ductus is the deepest of the lot
};
function arteryDescent(n, side) {
  const d = ARTERY_DESCENT[n]; if (!d) return 0;
  return side < 0 ? d.r : d.l;
}

/** The full artery centreline for arch n on `side` (-1 right, +1 left) at t, before trimming. */
function arteryFullCurve(a, side, t, nseg) {
  const n = nseg || ARTERY_NSEG;
  const pts = [];
  const sac = arteryOrigin(a.n, side, t, new T.Vector3());
  const sz = Math.max(0.05, archSize(a, t));
  const dy = arteryDescent(a.n, side) * heartDrop(t);
  const down = p => { p.y -= dy; return p; };

  /* leg 1a: this artery's own origin on the sac, out to the pharyngeal wall */
  const te = thEntry(a.n);
  const wall = down(ringPoint(V_WALL, side * te, pharynxR(V_WALL) + climbClear(a.n), new T.Vector3()));
  for (let i = 0; i < LEG1A; i++) {
    const u = i / LEG1A;
    pts.push(new T.Vector3().lerpVectors(sac, wall, u * u * (3 - 2 * u)));
  }
  /* leg 1b: UP THE PHARYNGEAL WALL at th = side*TH_ENTRY, clear of every arch bar it passes */
  const vMid = a.v - ARCH_DROOP;
  const rCore = barCentreR(a, sz, vMid) + ARCH_CORE.artery.rad * a.rad * sz;
  for (let i = 0; i < LEG1B; i++) {
    const u = (i + 1) / LEG1B;
    const su = u * u * (3 - 2 * u);
    const v = V_WALL + (vMid - V_WALL) * su;
    /* HUG THE WALL, and rise into the arch core only right at the end. su^2 was not late enough:
       the third arch artery's outer surface reached pharynxR + 0.113 as it passed arch 4's level,
       where arch 4's bar inner surface sits at pharynxR + 0.112, and the probe found the 4% overlap
       that one thousandth of a unit buys. su^4 keeps the climb on the wall until it is at its own
       arch. (The bars were thickened for the core layout, which is what made the old exponent too
       early — a change in one place moving a clearance in another, which is the reason the row is
       computed over every pair rather than over a list someone maintains.) */
    /* su^6, not su^4. Each time the bars were thickened the climb's rise had to start later, and the
       exponent is the honest place to pay for it: the vessel lies ON the wall for the whole of its
       run past other arches and lifts into its own arch's core only at the end of it. */
    const w = su * su * su * su * su * su;
    const cc = climbClear(a.n);
    const r = pharynxR(v) + cc + (rCore - pharynxR(vMid) - cc) * w;
    pts.push(down(ringPointOff(v, side * te, r, ARCH_CORE.artery.ax * a.rad * sz * w, new T.Vector3())));
  }
  /* leg 2: round inside the arch, from its own entry angle out to its dorsal end */
  for (let i = 0; i <= n; i++) {
    const th = side * (te + (THM - te) * (i / n));
    const q = th / THM;
    const v = a.v - ARCH_DROOP * (1 - q * q);
    const C2 = ARCH_CORE.artery;
    pts.push(down(ringPointOff(v, th, barCentreR(a, sz, v) + C2.rad * a.rad * sz,
                               C2.ax * a.rad * sz, new T.Vector3())));
  }
  /* leg 3: turn caudally into the dorsal aorta, which has itself grown down to meet it */
  const dEnd = down(dorsalAortaPoint(a.v - 0.018, side, new T.Vector3()));
  const last = pts[pts.length - 1].clone();
  for (let i = 1; i <= 5; i++) {
    const u = i / 5;
    pts.push(new T.Vector3().lerpVectors(last, dEnd, u * u * (3 - 2 * u)));
  }
  return pts;
}

/** Keep the first `keep` fraction of a polyline's own ARC LENGTH, measured from the start. */
function trimToFraction(pts, keep) {
  if (keep >= 0.999) return pts;
  const seg = [];
  let total = 0;
  for (let i = 1; i < pts.length; i++) { const d = pts[i].distanceTo(pts[i - 1]); seg.push(d); total += d; }
  const want = Math.max(1e-4, total * Math.max(0.02, keep));
  const out = [pts[0].clone()];
  let acc = 0;
  for (let i = 1; i < pts.length; i++) {
    const d = seg[i - 1];
    if (acc + d >= want) {
      const u = (want - acc) / (d || 1);
      out.push(new T.Vector3().lerpVectors(pts[i - 1], pts[i], u));
      break;
    }
    acc += d; out.push(pts[i].clone());
  }
  return out.length >= 2 ? out : [pts[0].clone(), pts[1].clone()];
}
/** Keep the LAST `keep` fraction — for an artery whose surviving derivative is its distal part. */
function trimToFractionFromEnd(pts, keep) {
  const rev = pts.slice().reverse().map(q => q.clone());
  return trimToFraction(rev, keep).reverse();
}

function arteryCurve(a, side, t) {
  const keep = archArteryKeep(a.n, side, t);
  const full = arteryFullCurve(a, side, t);
  return ARTERY_TRIM_FROM[a.n] === 'start'
    ? trimToFractionFromEnd(full, keep)      // keep the DISTAL remnant (maxillary, stapedial)
    : trimToFraction(full, keep);            // keep the PROXIMAL remnant (right pulmonary artery)
}
/* THE CAP WAS 0.021 AND IS 0.030. The visibility walk measured the artery beat's subject at 3.66% of
   its own frame against an 8% floor — nine thin vessels in a tall frame, which is a legibility defect
   rather than a geometric one and does not show up in any other check. The cap is what was binding:
   every artery was clamped to it, so raising the per-arch calibre alone moved nothing (probe 9 said
   so, which is how the cap was found). */
function arteryRadius(a) { return Math.max(0.010, Math.min(0.030, a.rad * ARCH_CORE.artery.calibre)); }

/* ============================================================================
   THE SOLVED PARAMETER — WHERE EACH RECURRENT LARYNGEAL NERVE HOOKS
   ============================================================================

   The constraint, which is the sentence a student is examined on: a recurrent laryngeal nerve is
   caught under the LOWEST-LYING arch artery on its own side that is STILL THERE. Nothing below picks
   a height. It searches the arteries this model built, caudal-most first, asks whether that artery
   still reaches its hook station at this t, and takes the first that does.

   `archArteryKeep` is the ONLY input. The nerve has no parameter of its own, which is the point:
   change the regression schedule and both nerves move correctly with no edit here. And because the
   hook POSITION is read off the artery's own geometry, the left hook descends with the heart for free,
   through sacPoint() -> arteryFullCurve() -> the hook station.

   THE TRANSITION IS CONTINUOUS. As arch 6's surviving fraction on the right falls past its hook
   station the nerve rides up to arch 4, and a hard switch would put a jump in a model that is supposed
   to be one continuous function of t. So the hook blends over a short window in `keep`, which is both
   smooth and what the nerve does: it is pulled up as the artery holding it withers.

   WHERE THE HOOK IS, AND WHY IT IS AN ANGLE RATHER THAN AN ARC FRACTION. The nerve comes down the
   side of the pharynx on the vagus and catches its artery where the artery runs DORSOLATERALLY — on
   the left, just lateral to what becomes the ligamentum arteriosum. So the hook station is a station
   ON THE ARCH CRESCENT, at |th| = HOOK_TH, and `archArteryKeep` decides whether the artery still
   reaches it.

   The first two versions made it a fraction of the artery's whole arc length and both were wrong, in
   ways worth recording because the second looked right:

     · at 0.40 the station was PROXIMAL to where the right sixth arch artery stops regressing (it keeps
       0.42 of its path, as the right pulmonary artery), so the right nerve never lost its hook and
       solveHook sat permanently inside its own blend window, reporting `under: 4, weight: 0.2` —
       neither state, for every t.
     · at 0.62 the transition worked, and the station still drifted, because leg 1 — origin to the
       arch's ventral midline — changes length enormously with t and with which arch it is. The sac
       descends 1.42 while arch 4 descends 0.74, so by t = 1 leg 1 dominates the arc and 0.62 of the
       TOTAL landed at th = -0.39: ventral, 0.03 clear of the pharynx's own surface, and the nerve
       reaching it from behind had to pass through the pharyngeal wall to get there. The containment
       row measured 12.5% of the right nerve's vertices inside the pharynx. That is an anatomical
       error as much as a rendering one — where this nerve runs is the examinable fact, and it runs in
       the groove between trachea and oesophagus, which is why it is the nerve at risk in thyroid
       surgery.

   An angle cannot drift: th = 0.82 * THM is dorsolateral at every t and for every arch, so the nerve
   reaches it from the side, under the vessel, without crossing the gut tube. The lesson is the one
   RENDER-STANDARD keeps recording in other words — a station defined against something that moves is
   not a station.                                                                                     */
const HOOK_TH = 0.82 * THM;
const HOOK_BLEND = 0.10;

/* THE ARTERY POLYLINE'S LAYOUT — fixed, documented, and asserted rather than assumed, because
   arteryHookStation() turns an ANGLE into an index into it.

     leg 1  LEG1A + LEG1B points   this artery's own origin on the sac, out to the pharyngeal wall,
                                   then up the wall at th = side*TH_ENTRY to its own arch's level
     leg 2  ARTERY_NSEG + 1        round the arch, th from side*TH_ENTRY to side*THM
     leg 3  LEG3 points            the dive into the dorsal aorta

   TWO THINGS ABOUT LEG 1 THAT WERE WRONG AND WERE FOUND BY MEASUREMENT, not by reading.

   It used to run as a straight interpolation from the origin to the arch's VENTRAL MIDLINE at th = 0,
   and both halves of that were defects:

     · th = 0 is the midline exactly, so the left and right members of every pair converged on one
       point OUTSIDE the sac. After the curvature smoothing opened the bends out, the two third arch
       arteries measured 9.3% and 11.9% inside one another clear of the chamber they are allowed to
       share. The arch arteries are PAIRED — they meet in the aortic sac and nowhere else — so leg 1
       now runs at th = side*TH_ENTRY and the two sides never touch outside it.
     · the straight line ran at the radius of its own arch's core, which for a CRANIAL arch means
       passing the levels of all the caudal arches at a radius well inside their bars: the third arch
       artery measured 4.1% inside arch 4 and 4.1% inside the arch 4 cartilage. The arch arteries lie
       ON the pharyngeal wall and the bars stand out FROM it, so leg 1 now climbs the wall at
       pharynxR(v) + 0.030 — comfortably inside every bar's inner surface, which sits at
       pharynxR(v) + stand + 0.012 — and only rises into the arch core in its own arch.

   Both were invisible in the renders and both were anatomical errors as well as geometric ones. */
/* EACH ARTERY CLIMBS THE WALL AT ITS OWN ANGLE, which is the third version of leg 1 and the reason
   is arithmetic rather than taste. Routing all six up the wall at one angle fixed the midline
   crossing and the bar clearance, and simply moved the crowding from the sac to the wall: the fifth
   arch artery then measured 15% inside the third's and 12.5% inside the fourth's, clear of the sac,
   which is row P's whole subject. Six vessels of radius 0.019 need 0.045 of arc between neighbours,
   and at the wall radius of about 0.32 that is 0.14 radians each — so they fan, which is also what
   the arch arteries do: they leave a common chamber and go to six different places, like the ribs of
   a fan, rather than running parallel and turning off. */
/* THE FAN IS ANGULAR AND RADIAL, AND THE RADIAL HALF RUNS THE OPPOSITE WAY TO INTUITION.
   The angular step had to grow when the whole model's proportions were rebalanced — the foregut got
   narrower, so the same angle buys less arc, and the fifth arch artery measured 5% inside the fourth
   again. But the step cannot grow far: thEntry(6) must stay below HOOK_TH or arch 6's hook station
   would fall before its own entry angle and solveHook would have nothing to measure.
   THE FAN IS PURELY ANGULAR, AND THAT IS THE THIRD ARRANGEMENT TRIED. A radial component was added
   first, because the angular step could not be widened without thEntry(6) overrunning HOOK_TH and
   leaving arch 6's hook station before its own entry angle. It worked until the arteries were made
   thicker (for beat 4's legibility — see arteryRadius), and then nothing could satisfy both
   constraints at once: a radial fan wide enough to separate two 0.030 vessels pushes the outermost
   climb through the inner surface of every bar it passes, and one narrow enough to clear the bars
   does not separate the vessels. The way out was to move HOOK_TH dorsally, from 0.62 THM to 0.82,
   which buys the angular room the radial fan was standing in for — so every artery now hugs the wall
   at the same depth, where there is room for all of them, and they are separated by angle alone.
   Hooking the nerve more dorsally is anatomically neutral at worst: the nerve catches its vessel out
   towards the dorsal end either way. */
const TH_ENTRY_BASE = 0.20, TH_ENTRY_STEP = 0.32, RAD_FAN = 0.0;
function thEntry(n) { return TH_ENTRY_BASE + TH_ENTRY_STEP * (n - 1); }
function climbClear(n) { return WALL_CLEAR + RAD_FAN * (n - 1); }
/* HOW CLOSE THE WALL CLIMB HUGS THE FOREGUT. 0.020 rather than the first value of 0.030, because
   the arch bars were thickened by 1.4x for the core layout and again when the whole model's
   proportions were rebalanced to make the bars read as bars instead of hoops — and a bar that stands
   further out has its INNER surface further in. The third arch artery's climb then measured 4.1%
   inside arch 4 as it passed that level. Hugging closer restores the clearance without moving any
   arch, and is the right side to give ground on: the arch arteries lie ON the pharyngeal wall. */
const WALL_CLEAR = 0.018;
const LEG1A = 4, LEG1B = 7, LEG1 = LEG1A + LEG1B, ARTERY_NSEG = 40, LEG3 = 5;
const V_WALL = 0.215;          // where an artery leaves the sac and reaches the pharyngeal wall

/**
 * The hook station on artery (a, side) at t: the point at |th| = HOOK_TH, and what fraction of the
 * artery's own arc length you have to keep in order to still reach it. Both read off the built
 * polyline, so `archArteryKeep` is the only thing that decides whether the hook survives.
 */
function arteryHookStation(a, side, t) {
  const pts = arteryFullCurve(a, side, t);
  const expect = LEG1 + ARTERY_NSEG + 1 + LEG3;
  if (pts.length !== expect) {
    /* the layout changed under us; fall back to the dorsal end rather than silently measuring the
       wrong index — a wrong station here would move both nerves and nothing else would notice */
    return { point: pts[pts.length - 1].clone(), frac: 1, degraded: true };
  }
  const te = thEntry(a.n);
  const f = (HOOK_TH - te) / (THM - te);
  const idx = LEG1 + Math.round(ARTERY_NSEG * Math.max(0, Math.min(1, f)));
  let total = 0; const cum = [0];
  for (let i = 1; i < pts.length; i++) { total += pts[i].distanceTo(pts[i - 1]); cum.push(total); }
  return { point: pts[idx].clone(), frac: total > 0 ? cum[idx] / total : 1, degraded: false };
}

/**
 * SOLVE the hook for one side at one t.
 * Returns { point, under, weight } — `under` is the arch NUMBER the nerve hooks under, which is a
 * measured outcome of the regression schedule and not a constant anywhere in this file.
 */
function solveHook(side, t) {
  /* candidates, CAUDAL-MOST FIRST. The caudal order of the arch arteries is 6, then 4, then 3 — the
     fifth leaves nothing to hook under and the first two are gone before the nerve matters. */
  const order = [6, 4, 3];
  const cand = order.map(n => {
    const a = ARCHES[n - 1];
    const st = arteryHookStation(a, side, t);
    const keep = archArteryKeep(n, side, t);
    /* does the SURVIVING span still contain the hook station? That depends on which end regresses:
       a proximally-trimmed artery keeps [1-keep, 1] of its path, a distally-trimmed one keeps
       [0, keep]. Arches 3, 4 and 6 — the only candidates — are all distally trimmed, so the second
       branch is the live one; the first is here so the predicate stays correct if that ever changes. */
    const reaches = ARTERY_TRIM_FROM[n] === 'start'
      ? st.frac - (1 - keep)
      : keep - st.frac;
    return { n, a, st, keep, reaches };
  });
  const held = cand.filter(c => c.reaches >= 0);
  if (!held.length) {
    const c = cand[cand.length - 1];
    return { point: c.st.point, under: c.n, weight: 1, degraded: true };
  }
  const chosen = held[0];
  const next = held[1] || null;
  /* BLEND while the chosen artery is within HOOK_BLEND of losing the station, so the ride up is
     continuous — the nerve is pulled up as the vessel holding it withers, rather than teleporting. */
  if (next && chosen.reaches < HOOK_BLEND) {
    const w = chosen.reaches / HOOK_BLEND;
    const sm = w * w * (3 - 2 * w);
    return { point: new T.Vector3().lerpVectors(next.st.point, chosen.st.point, sm),
             under: w > 0.5 ? chosen.n : next.n, blendedWith: next.n, weight: w };
  }
  return { point: chosen.st.point, under: chosen.n, weight: 1 };
}

/* ------------------------------------------------------------------ the nerves

   Each arch is claimed by one cranial nerve, and the nerve enters its arch from dorsally — from the
   hindbrain, behind the pharynx — then runs forward in the arch core with its own muscle block. The
   vagus runs on caudally past arches 4 and 6; the superior laryngeal branch takes arch 4 and the
   recurrent laryngeal branch takes arch 6, which is the whole of the next two beats.                */
const BRAINSTEM_V = 0.76;        // where the arch nerves emerge, dorsal to the pharynx

function nerveRoot(side, v, out) {
  axisPoint(v, _ap);
  const r = pharynxR(v) + 0.175;
  return out.set(side * r * 0.52, _ap.y + 0.10, _ap.z - r * 0.80);
}

/* An arch nerve: from its root, round into its arch's core, running forward with its muscle block.
 *
 * `reach` is how far forward it runs, as a fraction of the arch's own angular span. TWO CORRECTIONS,
 * both found by the containment row:
 *
 *  · IT USED TO REACH th = 0 WHATEVER `reach` SAID. The loop ran from side*span down to 0, so `reach`
 *    only set where the nerve STARTED and every nerve finished at the ventral midline regardless —
 *    which is both wrong (an arch nerve supplies its arch, it does not cross to the other side) and
 *    the reason the superior laryngeal nerve was crossing the third arch artery's wall climb. The
 *    nerves now stop at TH_STOP, dorsal of every artery's entry angle.
 *  · IT RAN AT THE SAME RADIUS AS THE ARTERIES. Both were placed in "the arch core", 0.043 apart with
 *    calibres summing to 0.032, and they met. The nerve now runs superficial to the artery in the
 *    core — stand * 1.05 against the artery's stand * 0.42 — which is clear of it and is also the
 *    real arrangement: the vessel is the deeper of the two.
 */
const NERVE_TH_STOP = 0.40;         // in units of THM — dorsal of thEntry(6) = 0.895 rad
function archNerveCurve(a, side, t, reach) {
  const sz = Math.max(0.06, archSize(a, t));
  const root = nerveRoot(side, Math.min(0.92, a.v + 0.14), new T.Vector3());
  const pts = [root];
  const thA = THM * 0.95;
  const thB = THM * Math.max(NERVE_TH_STOP, 0.95 - (reach == null ? 0.55 : reach) * 0.70);
  const n = 22;
  for (let i = 0; i <= n; i++) {
    const th = side * (thA + (thB - thA) * (i / n));
    const q = th / THM;
    const v = a.v - ARCH_DROOP * (1 - q * q);
    const C2 = ARCH_CORE.nerve;
    pts.push(ringPointOff(v, th, barCentreR(a, sz, v) + C2.rad * a.rad * sz,
                          side > 0 ? C2.ax * a.rad * sz : C2.ax * a.rad * sz, new T.Vector3()));
  }
  return pts;
}

/* A NERVE DOES NOT PASS THROUGH THE GUT TUBE, enforced as a constraint rather than hoped for.
 *
 * Every nerve in this model is routed by interpolating between anatomical waypoints, and an
 * interpolation between two points that are both outside a convex-ish tube can still cut the corner
 * through it. Moving the hook station to an angle fixed most of it — 12.5% of the right recurrent
 * nerve's vertices were inside the pharynx and that fell to 6.3% — but a few samples survived, on the
 * final swing from the tracheo-oesophageal groove forward on to the larynx.
 *
 * So the constraint is applied where it belongs: any station closer to the pharyngeal axis than the
 * pharynx's own radius plus a clearance is pushed radially out to that distance. This is not a
 * tolerance hiding a defect, it is the statement "the nerve runs outside the foregut" expressed as
 * arithmetic, and the number of stations it had to move is reported on the group as
 * userData.nerveClamped so it is visible rather than silent. If that count were large it would mean
 * the waypoints are wrong and the clamp is papering over them; it is 0 to 3 per nerve, which is the
 * corner-cutting it was written for.
 */
/* The foregut is drawn from just below arch 6 to just above arch 1. It used to run to v = 0.98,
   which put a hand's length of bare tube above the first arch where the head should be — the picture
   read as rings on a stick rather than as the arches of a head and neck. */
const PH_V0 = 0.06, PH_V1 = 0.895;
function clearOfPharynx(pts, clear) {
  let moved = 0;
  const A = new T.Vector3(), D = new T.Vector3(), rad = new T.Vector3();
  for (const p of pts) {
    const v = (p.y - AX_Y0) / (AX_Y1 - AX_Y0);
    /* THE PHARYNX IS A FINITE TUBE. Outside the stations it is drawn between there is nothing to be
       clear OF, and pushing a point out there would only inflate a nerve's thoracic course away from
       where it belongs — the vagus runs for more than its own length below the foregut's caudal end. */
    if (v < PH_V0 - 0.02 || v > PH_V1 + 0.02) continue;
    axisPoint(v, A); axisDir(v, D);
    rad.subVectors(p, A);
    rad.addScaledVector(D, -rad.dot(D));          // the component perpendicular to the axis
    const r = rad.length();
    const want = pharynxR(v) + clear;
    if (r > 1e-9 && r < want) {
      p.addScaledVector(rad, (want - r) / r);
      moved++;
    }
  }
  return moved;
}

/* The vagus trunk: down the side of the pharynx, past arch 4 and arch 6, into the thorax.
   IT RUNS DORSAL TO THE ARCHES' OWN DORSAL ENDS, at |th| beyond THM, which is the free space beside
   the neural tube. The first version placed it by Cartesian offsets off the axis that happened to put
   its radial distance at pharynxR + 0.32 of the local radius — the same radius as the endodermal
   pouches — and 10.2% of it measured inside them. Routed through ringPoint at an angle past the arch
   bars it is clear of the pouches (which span |th| <= 0.80 THM), of the grooves (0.92 THM) and of
   every bar, by construction rather than by a number that happened to work. */
function vagusCurve(side, t) {
  const pts = [];
  const top = 0.80, bot = 0.252;
  /* In the dorsal band beyond the arch bars' own ends (|th| > THM), and separated from the dorsal
     aorta ANGULARLY rather than radially: the aorta sits at th = 2.714 by its own construction, so
     the trunk sits at 2.98, which is 0.27 radians and about 0.104 of arc away — against calibres
     summing to 0.043. Chosen by measuring the aorta's own angle rather than by trying radii until
     the probe went quiet, which is how the first two placements were arrived at and why both failed. */
  const th = side * 2.98;
  for (let i = 0; i <= 16; i++) {
    const v = top + (bot - top) * (i / 16);
    pts.push(ringPoint(v, th, pharynxR(v) + 0.150, new T.Vector3()));
  }
  /* THEN ON DOWN INTO THE CHEST, FOLLOWING THE HEART — and VENTRAL to the descending aorta, which
     is where the vagus actually goes: it runs with the oesophagus, and the oesophagus lies in front of
     the aorta in the lower thorax. The first version held the trunk at its dorsal station all the way
     down while the paired dorsal aortae converged on the midline to fuse into the descending aorta,
     so the two ended up at x = 0.045 against 0.048 and the probe found 6.1% of the trunk inside the
     vessel. Rising ventrally as it descends separates them by the one thing that is not converging. */
  const last = pts[pts.length - 1];
  const drop = heartDrop(t);
  for (let i = 1; i <= 6; i++) {
    const u = i / 6;
    pts.push(new T.Vector3(last.x * (1 - 0.08 * u),
                           last.y - (drop + 0.42) * u,
                           last.z + 0.34 * Math.sqrt(u)));
  }
  return pts;
}

/**
 * A recurrent laryngeal nerve: leaves the vagus, descends to the SOLVED hook, passes under the artery
 * there, and runs back up to the arch-6 cartilages (the larynx). The hook is not a parameter — see
 * solveHook(). The larynx end is read off arch 6's own cartilage so the nerve ends where the thing it
 * supplies actually is.
 */
function rlnCurve(side, t) {
  const hook = solveHook(side, t);
  const vg = vagusCurve(side, t);
  /* leave the vagus at the level just above the hook */
  let leave = vg[0];
  let best = 1e9;
  for (const p of vg) { const d = Math.abs(p.y - hook.point.y) + 0.28; if (p.y > hook.point.y && d < best) { best = d; leave = p; } }

  /* THE NERVE ENDS ON THE ARCH 6 CARTILAGE, which is what the larynx IS and what this nerve supplies.
     It used to end at a point placed near arch 6 by its own offsets — pharynxR + stand*0.55 + 0.020 —
     which put it at radius 0.195 and angle -0.70, and the third arch artery's climb up the pharyngeal
     wall passes through radius 0.188 at angle -0.58: 0.022 apart, against calibres summing to 0.034,
     and the probe found 10.2% of the right nerve inside the right common carotid's stem. Ending on
     the cartilage instead puts the target at the BAR'S core radius, 0.326, which clears every
     artery's wall climb by more than 0.12 — and it is where the nerve actually goes. */
  const a6 = ARCHES[5];
  const sz = Math.max(0.06, archSize(a6, t));
  const thL = side * THM * 0.40;
  const qL = thL / THM;
  const vL = a6.v - ARCH_DROOP * (1 - qL * qL);
  const laryngeal = ringPoint(vL, thL, barCentreR(a6, sz, vL), new T.Vector3());

  const h = hook.point;
  const pts = [];
  /* THE DESCENDING LIMB KEEPS THE VAGUS'S OWN DORSAL ANGLE until it is level with the hook, and only
     then swings out to it. Interpolating straight from the trunk to a point beside the hook crosses
     the corridor the ASCENDING limb uses: the trunk sits at th = 2.98, which is close to the midline
     in x, the hook is well lateral, and the straight line between them passes through th = 2.16 —
     which is exactly where the same nerve comes back up. The probe found vertices of one limb inside
     the other, at the same place in space from two points 0.52 of the buffer apart. Curvature was not
     the cause (row Q read 1.69) and no neighbour was involved: a tube can be perfectly sweepable and
     still pass through itself further along, and nothing else in the battery asks that question.
     Holding th = 2.80 on the way down puts 0.64 radians between the two limbs. */
  /* 2.62 and 0.175: BETWEEN the arch bars' dorsal ends and the dorsal aorta in angle, and well
     outside both the aorta and the vagus in radius. The dorsal band is crowded — the ascending groove
     at 2.16, the bars ending at 2.32, the aorta at 2.71, the trunk at 2.98 — and a slot chosen on
     angle alone (2.80) put this limb 0.09 radians and 0.015 of radius from the aorta, which the probe
     found as 10.2% of the left nerve inside it. Radius is the free direction here and it is the one
     the anatomy uses too: the nerve descends lateral to the vessel it is going to hook. */
  const DESC_TH = 2.62, DESC_R = 0.175;
  const approach = new T.Vector3(h.x * 1.18, h.y + 0.14, h.z - 0.10);
  const _dp = new T.Vector3();
  const nDown = 8;
  for (let i = 0; i <= nDown; i++) {
    const u = i / nDown;
    const yy = leave.y + (approach.y - leave.y) * (u * u * (3 - 2 * u));
    const vv = Math.max(PH_V0, Math.min(0.99, (yy - AX_Y0) / (AX_Y1 - AX_Y0)));
    ringPoint(vv, side * DESC_TH, pharynxR(vv) + DESC_R, _dp);
    /* hold the dorsal line, then swing out to the hook over the last third */
    const toward = Math.max(0, (u - 0.66) / 0.34);
    const w = toward * toward * (3 - 2 * toward);
    pts.push(new T.Vector3(_dp.x * (1 - w) + approach.x * w, yy,
                           _dp.z * (1 - w) + approach.z * w));
  }
  /* UNDER the artery: three points passing beneath the hook point and turning back up.
     The offset has been set twice, in both directions, and the second move is the interesting one.
     It started at 0.055 and came DOWN to 0.042 because the nerve's lowest surface measured 0.064 from
     the artery's and rows H and I would have had to be loosened to accept that — tightening the
     geometry being the right repair and loosening the row being the lateral-folding mistake. It then
     went UP to 0.062, because smoothUntilSweepable pulls a hairpin towards its chord, which on this
     hairpin means towards the vessel it is hooked under: the containment probe measured 4.1% of the
     left nerve inside the left sixth arch artery. A constraint that moves the geometry has to be
     allowed for in the geometry it moves.
     And then UP again to 0.086, for a third reason that is neither of the first two: at 0.062 the
     hairpin's two limbs ran within their own diameter of each other, so the outward-normal probe —
     which tests each solid against its OWN triangles — found vertices of the ascending limb inside
     the descending one. Curvature was not the cause and row Q was clean at a ratio of 1.69; a tube
     can be perfectly sweepable and still pass through itself further along. Opening the loop fixes
     it, and the nerve's surface is still 0.078 from the artery's centre, well inside the four
     calibres rows H and I bound it by. */
  const r = 0.086;
  pts.push(new T.Vector3(h.x * 1.05, h.y - r * 0.6, h.z - r * 0.55));
  pts.push(new T.Vector3(h.x * 0.86, h.y - r * 1.15, h.z + r * 0.10));
  pts.push(new T.Vector3(h.x * 0.70, h.y - r * 0.6, h.z + r * 0.75));
  /* AND BACK UP IN THE TRACHEO-OESOPHAGEAL GROOVE — behind the pharynx, not through it.
     The first version ran the ascending limb straight from the hook to the laryngeal target by
     interpolation, and because the hook on the right sits fairly medial (x = -0.126 at t = 1) while
     the laryngeal target is lateral, the straight line passed within 0.06 of the midline at the
     pharynx's own level and went THROUGH the pharyngeal wall: the containment row measured 8.3% of
     the nerve's vertices inside the pharynx. Which is also an anatomical error and not only a
     rendering one, because where this nerve runs is the examinable fact — it ascends in the groove
     between trachea and oesophagus, DORSAL to the gut tube, which is exactly why it is the nerve at
     risk in thyroid surgery. So the limb is now built to hug the axis from behind: a small constant
     lateral offset, and z held dorsal of the pharyngeal wall at every station it passes. */
  /* THE GROOVE IS DORSAL TO THE GUT TUBE AND VENTRAL TO THE AORTA, and it has to be both. Placing it
     by a z offset off the axis — "behind the pharynx by pharynxR + 0.052" — satisfied the first and
     not the second: the left nerve's hook ends up at y = -2.43, which is far below the foregut's
     caudal end, and down there the paired dorsal aortae have converged on the midline to fuse. The
     probe measured 10.2% of the left nerve inside the descending aorta. Placing it instead at an
     ANGLE in the ring frame, 0.26 radians ventral of the aorta's own DA_TH and at a smaller radius,
     separates it from the vessel by construction and in the direction the anatomy separates them:
     the trachea and oesophagus the nerve runs between lie in FRONT of the descending aorta. */
  /* 0.55 radians ventral of the dorsal aorta, not 0.26. At 0.26 the groove sat at th = 2.45, and the
     THIRD arch artery's dive into the dorsal aorta sweeps through th = 2.32 to 2.71 on its way there,
     so the nerve crossed it — 10.2% of the right nerve inside the right common carotid's stem. At
     2.16 the groove is clear of that dive, still clear of the grooves (which end at 0.92 THM = 2.13,
     and lie 0.075 further out radially anyway) and still ventral of the aorta, which is the relation
     that matters: the recurrent nerve runs in the tracheo-oesophageal groove, MEDIAL and ventral to
     the carotid, which is the arrangement a surgeon is taught. */
  const GROOVE_TH = DA_TH - 0.55, GROOVE_R = 0.030;
  const vAtY = yy => Math.max(0.02, Math.min(0.99, (yy - AX_Y0) / (AX_Y1 - AX_Y0)));
  const lastUnder = pts[pts.length - 1];
  const nRise = 7;
  const _g = new T.Vector3();
  for (let i = 1; i <= nRise; i++) {
    const u = i / nRise;
    const yy = lastUnder.y + (laryngeal.y - lastUnder.y) * (u * u * (3 - 2 * u));
    const vv = vAtY(yy);
    /* the radius follows the foregut where there is one, and holds its caudal calibre below it */
    ringPoint(Math.max(PH_V0, vv), side * GROOVE_TH,
              pharynxR(Math.max(PH_V0, vv)) + GROOVE_R, _g);
    /* hold the groove, then swing forward on to the larynx over the last HALF of the limb rather
       than the last two samples — the abrupt version put a 26:1 step in the spacing, which is what
       the polyline-hygiene note above is about */
    const toward = Math.max(0, (u - 0.45) / 0.55);
    const w = toward * toward * (3 - 2 * toward);
    pts.push(new T.Vector3(
      _g.x * (1 - w) + laryngeal.x * w,
      yy,
      _g.z * (1 - w) + laryngeal.z * w));
  }
  /* NOT pushing laryngeal again: the loop's last sample already is it (w = 1 at u = 1), and the
     duplicate is where the 56 edges shared by three triangles came from. */
  return { pts, hook };
}

/* ------------------------------------------------------------------ the heart */

/* The heart sits just caudal to the aortic sac, so it follows sacPoint() and therefore heartDrop().
   There is deliberately no second descent constant: one function moves the sac, the sixth arch
   artery's ventral end, the heart and — through solveHook — the left recurrent nerve's hook. */
function heartGroupCurve(t) {
  const sac = sacPoint(t, new T.Vector3());
  const pts = [];
  for (let i = 0; i <= 10; i++) {
    const u = i / 10;
    pts.push(new T.Vector3(0.10 * Math.sin(Math.PI * u),
      sac.y - 0.16 - 0.56 * u, sac.z + 0.10 + 0.20 * Math.sin(Math.PI * u)));
  }
  return pts;
}

/* ------------------------------------------------- the cervical sinus & cyst

   Arch 2 overgrows the arches below it and buries the clefts of 2, 3 and 4 in a space — the cervical
   sinus — which should then obliterate. When it does not, a branchial cyst appears at the anterior
   border of sternocleidomastoid. The sinus opens as arch 2 overgrows (week 5) and closes in week 7;
   the cyst is the `persistent_sinus` variant, which is the same space failing to close.             */
function sinusOpen(t) {
  return ramp(t, 31, 36) * (1 - ramp(t, 44, 50));
}

/* ======================================================================== build */

/* THE TESSELLATION FOLLOWS THE CALIBRE, and this is the other half of the polyline note above.
   domeCap closes a terminal ring with `rows` bands of `ring` quads, and its last band sits at
   r * cos(phi) of the axis. On a tube as thin as arch 5's vestige — radius 0.0026 — the last band's
   ring points are 0.00026 apart, which the watertight probe's 0.2 um weld quantises on to the same
   vertex: the fan collapses and the probe reported 10 edges shared by FOUR triangles. That is a
   tessellation fault and not an anatomy one, so it is fixed by tessellating a thin tube less finely
   rather than by inflating the vestige, which would have been a claim that arch 5 leaves something. */
function addTube(group, key, pts, radiusFn, opts) {
  const o = opts || {};
  /* resample before sweeping — see the polyline-hygiene note */
  const n = o.samples || Math.max(24, Math.min(64, (pts.length - 1) * 2));
  const line = resampleUniform(pts, n);
  let maxR = 0;
  for (let i = 0; i <= 12; i++) maxR = Math.max(maxR, radiusFn(i / 12));
  /* THE CLEARANCE HAS TO BE APPLIED AFTER THE SMOOTHING, NOT BEFORE IT. clearOfPharynx() was being
     run on the WAYPOINTS and then smoothUntilSweepable pulled the line straight again, back through
     the wall it had just been pushed out of — the probe still found 12.2% of the right recurrent
     nerve inside the pharynx. The two constraints have to be satisfied together, so they alternate:
     smooth a little, push out, repeat, and report what each ended at. If they cannot both be met the
     curvature ratio comes out below its floor and row Q says so, rather than one of them quietly
     winning. */
  let sw;
  if (o.clearPharynx) {
    let moved = 0;
    for (let k = 0; k < 10; k++) {
      sw = smoothUntilSweepable(line, maxR, o.sweepTarget || 1.25, 12);
      const mv = clearOfPharynx(line, o.clearPharynx + maxR);
      moved += mv;
      if (sw.reached && mv === 0) break;
    }
    sw = { passes: sw.passes, minR: minCurvatureRadius(line), ratio: minCurvatureRadius(line) / (maxR || 1e-9),
           reached: minCurvatureRadius(line) >= (o.sweepTarget || 1.25) * maxR, pushedOut: moved };
  } else {
    sw = smoothUntilSweepable(line, maxR, o.sweepTarget || 1.25);
  }
  const thin = maxR < 0.010;
  const geo = K.tubeCapped(line, radiusFn, {
    ring: thin ? 8 : (o.ring || 14), cap: 'both', capRows: thin ? 3 : (o.capRows || 6),
    bulge: o.bulge != null ? o.bulge : 0.85,
    flatten: o.flatten != null ? o.flatten : 1,
  });
  if (!geo) return null;
  const m = K.addSolid(group, key, geo, {
    color: o.color, name: o.name, outline: o.outline || 0.006,
    matOver: o.matOver, renderOrder: o.renderOrder,
  });
  /* record the curvature headroom so acceptance can assert it rather than hoping */
  const g2 = group.userData;
  g2.curvature = g2.curvature || {};
  const prev = g2.curvature[key];
  const entry = { minR: sw.minR, tubeR: maxR, ratio: sw.ratio, passes: sw.passes, reached: sw.reached,
                  pushedOut: sw.pushedOut || 0 };
  if (!prev || entry.ratio < prev.ratio) g2.curvature[key] = entry;
  return m;
}

function hex(k) { return LAYERS[k] ? LAYERS[k].color : 0xcccccc; }
function nameOf(k) { return LAYERS[k] ? LAYERS[k].name : k; }

/* ------------------------------------------------ the magnified section slab

   A x12 transverse slab of arch 2, parked clear of the embryo — header note 3. Built as short
   elliptical cylinders about a local axis, so the camera that looks down that axis sees a section.
   The four core inclusions span 1.25x the matrix thickness, declared in note 4 and measured by row N. */
const SEC = {
  mag: 12,
  thick: 0.10,                 // matrix thickness, in model units after magnification
  protrude: 1.25,              // the core inclusions' thickness, as a multiple of the matrix's
  ro: 0.52, ri: 0.40,          // outer and inner radius of the arch wall in the slab
  gap: 2.30,                   // how far the slab is parked from the embryo's own x extent
};

/** A short elliptical cylinder about x, centred at c, radius (ry, rz), half-thickness hx. */
function slabCylinder(c, ry, rz, hx, ring, thetaA, thetaB) {
  const E = K.emitter();
  const n = ring || 40;
  const a = thetaA == null ? 0 : thetaA, b = thetaB == null ? Math.PI * 2 : thetaB;
  const closed = (b - a) >= Math.PI * 2 - 1e-6;
  const P = (i, s) => {
    const th = a + (b - a) * (i / n);
    return new T.Vector3(c.x + s * hx, c.y + ry * Math.cos(th), c.z + rz * Math.sin(th));
  };
  const Nr = i => {
    const th = a + (b - a) * (i / n);
    return new T.Vector3(0, Math.cos(th) / ry, Math.sin(th) / rz).normalize();
  };
  /* the wall */
  for (let i = 0; i < n; i++) {
    const p00 = P(i, -1), p10 = P(i, 1), p11 = P(i + 1, 1), p01 = P(i + 1, -1);
    const n0 = Nr(i), n1 = Nr(i + 1);
    E.quad(p00, p10, p11, p01, n0, n0, n1, n1);
  }
  const hull = E.count();
  /* the two faces, as fans to the centre — triN so winding comes from the geometry, not a comment */
  for (const s of [-1, 1]) {
    const ctr = new T.Vector3(c.x + s * hx, c.y, c.z);
    const nf = new T.Vector3(s, 0, 0);
    for (let i = 0; i < n; i++) {
      const p1 = P(i, s), p2 = P(i + 1, s);
      E.triN(ctr, p1, p2, nf);
    }
  }
  if (!closed) {
    /* cap the two radial ends of a partial ring */
    for (const i of [0, n]) {
      const inner = new T.Vector3(c.x, c.y, c.z);
      const o1 = P(i, -1), o2 = P(i, 1);
      const nn = new T.Vector3().subVectors(o1, inner).cross(new T.Vector3(1, 0, 0)).normalize();
      E.triN(inner, o1, o2, nn);
    }
  }
  const g = E.geometry(hull);
  return g;
}

/** An annular wall segment (a crescent of arch wall) — ectoderm outside, endoderm inside. */
function slabAnnulus(c, rOut, rIn, hx, thetaA, thetaB, ring) {
  const E = K.emitter();
  const n = ring || 34;
  const P = (i, s, r) => {
    const th = thetaA + (thetaB - thetaA) * (i / n);
    return new T.Vector3(c.x + s * hx, c.y + r * Math.cos(th), c.z + r * Math.sin(th));
  };
  const Nr = (i, sign) => {
    const th = thetaA + (thetaB - thetaA) * (i / n);
    return new T.Vector3(0, sign * Math.cos(th), sign * Math.sin(th)).normalize();
  };
  /* outer surface */
  for (let i = 0; i < n; i++) {
    E.quad(P(i, -1, rOut), P(i, 1, rOut), P(i + 1, 1, rOut), P(i + 1, -1, rOut),
      Nr(i, 1), Nr(i, 1), Nr(i + 1, 1), Nr(i + 1, 1));
  }
  const hull = E.count();
  /* inner surface, facing in */
  for (let i = 0; i < n; i++) {
    E.quadFlip(P(i, -1, rIn), P(i, 1, rIn), P(i + 1, 1, rIn), P(i + 1, -1, rIn),
      Nr(i, -1), Nr(i, -1), Nr(i + 1, -1), Nr(i + 1, -1));
  }
  /* the two flat faces, each an annular band */
  for (const s of [-1, 1]) {
    const nf = new T.Vector3(s, 0, 0);
    for (let i = 0; i < n; i++) {
      E.triN(P(i, s, rIn), P(i, s, rOut), P(i + 1, s, rOut), nf);
      E.triN(P(i, s, rIn), P(i + 1, s, rOut), P(i + 1, s, rIn), nf);
    }
  }
  /* the two radial ends */
  for (const i of [0, n]) {
    const sgn = i === 0 ? -1 : 1;
    const th = thetaA + (thetaB - thetaA) * (i / n);
    const nn = new T.Vector3(0, -Math.sin(th) * sgn, Math.cos(th) * sgn).normalize();
    E.triN(P(i, -1, rIn), P(i, -1, rOut), P(i, 1, rOut), nn);
    E.triN(P(i, -1, rIn), P(i, 1, rOut), P(i, 1, rIn), nn);
  }
  return E.geometry(hull);
}

function buildSection(group, t, originX) {
  const h = SEC.thick / 2;
  const hc = h * SEC.protrude;
  const c = new T.Vector3(originX, 0.0, 0.0);

  /* the matrix: the arch core, a full elliptical disc */
  K.addSolid(group, 'sec_mesoderm',
    slabCylinder(c, SEC.ri * 0.985, SEC.ri * 0.985, h, 44),
    { color: hex('sec_mesoderm'), name: nameOf('sec_mesoderm'), outline: 0.006 });

  /* ectoderm over the OUTER (lateral) two-thirds; endoderm over the INNER third, facing the pharynx.
     The pharynx is towards -z in the slab's local frame, so the endoderm takes the -z arc. */
  K.addSolid(group, 'sec_ectoderm',
    slabAnnulus(c, SEC.ro, SEC.ri, h, -Math.PI * 0.46, Math.PI * 0.46, 36),
    { color: hex('sec_ectoderm'), name: nameOf('sec_ectoderm'), outline: 0.006 });
  K.addSolid(group, 'sec_endoderm',
    slabAnnulus(c, SEC.ri * 1.12, SEC.ri * 0.88, h, Math.PI * 0.54, Math.PI * 1.46, 34),
    { color: hex('sec_endoderm'), name: nameOf('sec_endoderm'), outline: 0.006 });

  /* the four core ingredients, each spanning 1.25x the matrix thickness — note 4 */
  /* The four inclusions must CLEAR one another: the first layout put the cartilage at cz = -0.055 and
     the muscle at cz = +0.150, which is 0.205 apart with radii summing to 0.220 — they interpenetrated
     by 0.015 and the containment row said so. Cartilage sits deep (towards the pharynx, -z here) and
     the muscle block superficial to it, with the nerve and the artery flanking the cartilage. */
  const core = [
    ['sec_cartilage', 0.00, -0.090, 0.112],
    ['sec_muscle',    0.00,  0.168, 0.100],
    ['sec_nerve',     0.160, -0.165, 0.042],
    ['sec_artery',   -0.160, -0.165, 0.052],
  ];
  for (const [key, cy, cz, r] of core) {
    K.addSolid(group, key,
      slabCylinder(new T.Vector3(originX, cy, cz), r, r, hc, 26),
      { color: hex(key), name: nameOf(key), outline: 0.005 });
  }
}

/* ======================================================================= build */

function buildArches(t, opts) {
  const o = opts || {};
  const tt = Math.max(0, Math.min(1, +t));
  const g = new T.Group();
  g.userData.t = tt;
  g.userData.day = tDay(tt);

  /* ---- the pharyngeal foregut (context: the thing the arches are arranged round) ---- */
  if (o.pharynx !== false) {
    const pts = [];
    for (let i = 0; i <= 26; i++) {
      const v = PH_V0 + (PH_V1 - PH_V0) * (i / 26);
      pts.push(axisPoint(v, new T.Vector3()).clone());
    }
    addTube(g, 'pharynx', pts, s => pharynxR(PH_V0 + (PH_V1 - PH_V0) * s), {
      color: hex('pharynx'), name: nameOf('pharynx'), ring: 26, outline: 0.008,
    });
  }

  /* ---- the six arches ----
     `embryo: false` builds none of the whole-series geometry, which is what a proof frame of the
     magnified section needs: the player frames each beat to what is VISIBLE, so a beat that isolates
     the section's keys sees only the section, and a harness that cannot do the same is framing a
     picture the student never sees. */
  for (const a of (o.embryo === false ? [] : ARCHES)) {
    if (archSize(a, tt) < 0.02) continue;
    const key = 'arch' + a.n;
    let sz = archSize(a, tt);
    /* the deficit variants: too few neural crest cells reach an arch and it is UNDER-BUILT. This is
       the mechanism of the first-arch syndromes and of the 22q11 deletion, and it is geometric. */
    /* BOOLEAN FLAGS, not a string. viz3d's parseProceduralRef accepts only booleans after the '+'
       ("Flags are booleans only, deliberately — anything needing a value belongs in the model"), so a
       string-valued `deficit` could not be reached from a scene ref at all: the variants existed and
       nothing could ask for them. */
    if (o.deficit_arch1 && a.n === 1) sz *= 0.42;
    if (o.deficit_crest34 && (a.n === 3 || a.n === 4)) sz *= 0.46;
    const aa = (sz === archSize(a, tt)) ? a
      : Object.assign({}, a, { stand: a.stand * sz / archSize(a, tt), rad: a.rad * sz / archSize(a, tt) });
    addTube(g, key, archCurve(aa, tt), archRadiusFn(aa, tt), {
      color: hex(key), name: nameOf(key), ring: 16, outline: 0.007,
    });
  }

  /* ---- the cartilage bars ---- */
  for (const c of (o.embryo === false ? [] : CARTS)) {
    const a = ARCHES[c.n - 1];
    const grown = ramp(tt, c.day, c.day + 3.0);
    if (grown < 0.02) continue;
    const key = 'cart' + c.n;
    const cr = coreCalibre(a, archSize(a, tt), 'cart');
    addTube(g, key, cartCurve(a, c, tt), s => cr * grown * (0.60 + 0.40 * Math.sin(Math.PI * s)), {
      color: hex(key), name: nameOf(key), ring: 12, outline: 0.005,
    });
  }

  /* ---- clefts and pouches (context) ---- */
  if (o.grooves !== false) {
    for (const gs of gapStations()) {
      /* A GROOVE DROOPS LIKE THE ARCHES IT LIES BETWEEN. Without this the collar is built at a
         constant station while the arches sweep ARCH_DROOP ventrally, so a groove that sits correctly
         in the gap dorsally is driven straight into the middle of arch 3 and arch 4 by the time it
         reaches the ventral midline — measured at 6.3% and 8.3% of the groove's own vertices inside
         those two arches before this was fixed. The gap between two arches is a gap at every station,
         so the thing that lies in it has to follow them. */
      const pts = [], pp = [];
      for (let i = 0; i <= 26; i++) {
        const th = -THM * 0.92 + (2 * THM * 0.92) * (i / 26);
        const q = th / THM;
        const v = gs.v - ARCH_DROOP * (1 - q * q);
        pts.push(ringPoint(v, th, pharynxR(v) + 0.105, new T.Vector3()));
      }
      addTube(g, 'grooves', pts, () => 0.022, { color: hex('grooves'), name: nameOf('grooves'), ring: 10, outline: 0.004 });
      for (let i = 0; i <= 24; i++) {
        const th = -THM * 0.80 + (2 * THM * 0.80) * (i / 24);
        const q = th / THM;
        const v = gs.v - ARCH_DROOP * (1 - q * q);
        pp.push(ringPoint(v, th, pharynxR(v) + 0.042, new T.Vector3()));
      }
      addTube(g, 'pouches', pp, () => 0.018, { color: hex('pouches'), name: nameOf('pouches'), ring: 10, outline: 0.004 });
    }
  }

  /* ---- the aortic sac, the dorsal aortae, and the six arch arteries ---- */
  if (o.vessels !== false) {
    /* The sac spans the whole fan of origins, and is wide enough in x to contain both horns — so
       every artery genuinely arises from INSIDE it rather than from a point beside it. */
    const sac = sacPoint(tt, new T.Vector3());
    const yTop = sac.y + 0.125 + 0.055, yBot = sac.y + 0.125 - SAC_FAN_Y * 5 - 0.055;
    const sacPts = [];
    for (let i = 0; i <= 10; i++) {
      const u = i / 10;
      sacPts.push(new T.Vector3(0, yTop + (yBot - yTop) * u, sac.z + 0.02 * Math.sin(Math.PI * u)));
    }
    addTube(g, 'aortic_sac', sacPts, s => (SAC_HALF_X + 0.030) * (0.74 + 0.26 * Math.sin(Math.PI * s)), {
      color: hex('aortic_sac'), name: nameOf('aortic_sac'), ring: 18, outline: 0.006,
    });

    for (const side of [-1, 1]) {
      const da = [];
      /* it reaches far enough caudally to receive the sixth arch artery after the descent — the
         descending thoracic aorta forming. One descent function, read here too. */
      const vEnd = 0.10 - (heartDrop(tt) + 0.42) / (AX_Y1 - AX_Y0);
      for (let i = 0; i <= 24; i++) {
        const v = 0.86 + (vEnd - 0.86) * (i / 24);
        da.push(dorsalAortaPoint(v, side, new T.Vector3()));
      }
      addTube(g, 'dorsal_aorta', da, () => 0.024, {
        color: hex('dorsal_aorta'), name: nameOf('dorsal_aorta'), ring: 12, outline: 0.005,
      });
    }

    for (const a of ARCHES) {
      if (archSize(a, tt) < 0.02) continue;
      const bilateral = (a.n === 1 || a.n === 2 || a.n === 5);
      for (const side of [-1, 1]) {
        const key = bilateral ? ('aa' + a.n) : ('aa' + a.n + (side < 0 ? '_r' : '_l'));
        if (!LAYERS[key]) continue;
        const pts = arteryCurve(a, side, tt);
        const rr = arteryRadius(a);
        addTube(g, key, pts, s => rr * (0.78 + 0.22 * Math.sin(Math.PI * s)), {
          color: hex(key), name: nameOf(key), ring: 12, outline: 0.005,
        });
      }
    }
  }

  /* ---- the nerves ---- */
  if (o.nerves !== false) {
    const NV = [[1, 'cn5', 0.80], [2, 'cn7', 0.74], [3, 'cn9', 0.66]];
    for (const [n, key, reach] of NV) {
      const a = ARCHES[n - 1];
      if (archSize(a, tt) < 0.05) continue;
      const nr = Math.max(0.008, coreCalibre(a, archSize(a, tt), 'nerve'));
      for (const side of [-1, 1]) {
        addTube(g, key, archNerveCurve(a, side, tt, reach), () => nr, {
          color: hex(key), name: nameOf(key), ring: 10, outline: 0.004, clearPharynx: 0.012,
        });
      }
    }
    for (const side of [-1, 1]) {
      addTube(g, 'cn10', vagusCurve(side, tt), () => 0.019, {
        color: hex('cn10'), name: nameOf('cn10'), ring: 10, outline: 0.004, clearPharynx: 0.022,
      });
      /* the superior laryngeal nerve: the arch-4 branch of the vagus */
      const a4 = ARCHES[3];
      if (archSize(a4, tt) > 0.05) {
        addTube(g, 'sln', archNerveCurve(a4, side, tt, 0.58), () => Math.max(0.008, coreCalibre(a4, archSize(a4, tt), 'nerve') * 0.86), {
          color: hex('sln'), name: nameOf('sln'), ring: 10, outline: 0.004, clearPharynx: 0.012,
        });
      }
    }
    /* the two recurrent laryngeal nerves, hooked where solveHook() says and nowhere else */
    const a6 = ARCHES[5];
    if (archSize(a6, tt) > 0.05) {
      g.userData.nerveClamped = g.userData.nerveClamped || {};
      for (const side of [-1, 1]) {
        const key = side < 0 ? 'rln_r' : 'rln_l';
        const r = rlnCurve(side, tt);
        g.userData[key + '_hook'] = { x: r.hook.point.x, y: r.hook.point.y, z: r.hook.point.z,
                                      under: r.hook.under, weight: r.hook.weight };
        addTube(g, key, r.pts, () => 0.0135, {
          color: hex(key), name: nameOf(key), ring: 10, outline: 0.004, clearPharynx: 0.022,
        });
        g.userData.nerveClamped[key] = (g.userData.curvature[key] || {}).pushedOut || 0;
      }
    }
  }

  /* ---- the heart (context), which descends and tows the left nerve with it ---- */
  if (o.heart) {
    addTube(g, 'heart', heartGroupCurve(tt), s => 0.115 * (0.52 + 0.48 * Math.sin(Math.PI * s)), {
      color: hex('heart'), name: nameOf('heart'), ring: 18, outline: 0.008,
    });
  }

  /* ---- the cervical sinus, and the cyst that is it failing to close ---- */
  if (o.sinus) {
    const open = o.persistent_sinus ? Math.max(sinusOpen(tt), ramp(tt, 31, 36)) : sinusOpen(tt);
    if (open > 0.04) {
      const a2 = ARCHES[1], a4 = ARCHES[3];
      const vMid = (a2.v + a4.v) / 2;
      for (const side of [-1, 1]) {
        const pts = [];
        for (let i = 0; i <= 12; i++) {
          const u = i / 12;
          const v = a2.v - (a2.v - a4.v) * u;
          const r = pharynxR(v) + 0.115;
          pts.push(ringPoint(v, side * THM * (0.30 + 0.26 * Math.sin(Math.PI * u)), r, new T.Vector3()));
        }
        addTube(g, 'cervical_sinus', pts, s => 0.048 * open * (0.5 + 0.5 * Math.sin(Math.PI * s)), {
          color: hex('cervical_sinus'), name: nameOf('cervical_sinus'), ring: 12, outline: 0.004,
          matOver: { transparent: true, opacity: 0.55 },
        });
      }
      if (o.persistent_sinus) {
        for (const side of [-1, 1]) {
          const r = pharynxR(vMid) + 0.145;
          const c0 = ringPoint(vMid, side * THM * 0.44, r, new T.Vector3());
          const pts = [];
          for (let i = 0; i <= 10; i++) {
            const u = i / 10;
            pts.push(new T.Vector3(c0.x + side * 0.02 * u, c0.y - 0.16 * u, c0.z + 0.05 * u));
          }
          /* A BRANCHIAL CYST IS A LUMP SOMEBODY NOTICES, and it has to be one in the picture too. At
             0.072 it covered 0.075% of its own beat's frame against the visibility walk's 0.3% floor
             for a structure the beat POINTS AT — the beat highlights it, and a highlight on something
             a student cannot find is worse than not drawing it. 0.125 is still under two thirds of
             arch 2's own calibre, and clinically the thing presents as a swelling at the anterior
             border of sternocleidomastoid that a patient can feel. Raised again to 0.160 when the
             walk still read it at 0.298% — a tenth of a percent under the floor is not a pass. */
          addTube(g, 'branchial_cyst', pts, s => 0.160 * Math.sin(Math.PI * (0.12 + 0.76 * s)), {
            color: hex('branchial_cyst'), name: nameOf('branchial_cyst'), ring: 16, outline: 0.006,
          });
        }
      }
    }
  }

  /* ---- the magnified section slab, parked clear of the embryo ---- */
  if (o.section) {
    g.updateMatrixWorld(true);
    const box = new T.Box3().setFromObject(g);
    const originX = (box.isEmpty() ? 0 : box.max.x + SEC.gap);
    buildSection(g, tt, originX);
  }

  return g;
}

/* =================================================================== acceptance

   Every row's MEASURED side is read out of the geometry this model BUILDS — vertices of real meshes,
   never the constants the geometry was built from. RENDER-STANDARD, "AN ACCEPTANCE MEASUREMENT MUST BE
   A FUNCTION OF THE BUILT GEOMETRY": restating a shape law in the test that checks it proves only that
   the author can do the arithmetic twice, and lateral-folding shipped two rows that did exactly that,
   both floored and both with a negative case. So `measure()` below builds the group and reads
   bounding boxes and vertex lists off it, and `PERTURB` names, for each row, a constant whose change
   must move the reported number — the check the rule actually asks for.

   Every spatial row carries a MAGNITUDE FLOOR as a fraction of the relevant extent, never `> 0`, and
   every row carries a NEGATIVE CASE: a deliberately wrong input it must reject.                      */

const FLOORS = {
  SEP: 0.35,          // RENDER-STANDARD's starting figure for a spatial magnitude floor
  SIDE: 0.35,         // a right/left structure's displacement, over its own x extent
  STRADDLE: 0.35,     // how far each side of a midline-crossing bar reaches, over its half extent
  CLEAR: 0.004,       // minimum surface clearance between two arches, in model units
  SYMM: 0.07,         // row K: how equal the two hooks must be BEFORE the regression
  PROTRUDE: 0.10,     // row N: core inclusion protrusion, over the matrix half-thickness
  SWEEP: 1.20,        // row Q: centreline curvature radius over the tube radius it carries
};

const ACCEPTANCE = {
  axes: '+x = embryo LEFT, -x = RIGHT, +y = CRANIAL, +z = VENTRAL',
  t_meaning: 't = 0 is day 22; t = 1 is day 56. day(t) = 22 + 34t.',
  /* the constants a perturbation must move, per row — the rule's own check on the measure */
  perturb: {
    C: 'ARCHES[n].v', E: 'THM', D: 'ARCHES[n].rad',
    H: 'archArteryKeep(6,-1,t)', I: 'archArteryKeep(6,+1,t)',
    J: 'HEART_DESC', K: 'archArteryKeep(6,-1,t)', L: 'archArteryKeep(6,-1,t)',
    F: 'ARCH5_FLOOR', M: 'CARTS[3].frac', N: 'SEC.protrude', A: 'ARCHES[n].stand',
  },
};

function vertsOf(group, key) {
  const out = [];
  group.traverse(m => {
    if (!m.isMesh || !m.geometry || (m.userData && m.userData.outline)) return;
    if ((m.userData && m.userData.key) !== key) return;
    const p = m.geometry.attributes.position.array;
    for (let i = 0; i < p.length; i += 3) out.push([p[i], p[i + 1], p[i + 2]]);
  });
  return out;
}
function boxOf(group, key) {
  const v = vertsOf(group, key);
  if (!v.length) return null;
  const mn = [Infinity, Infinity, Infinity], mx = [-Infinity, -Infinity, -Infinity];
  for (const p of v) for (let c = 0; c < 3; c++) { if (p[c] < mn[c]) mn[c] = p[c]; if (p[c] > mx[c]) mx[c] = p[c]; }
  return { min: mn, max: mx, size: [mx[0] - mn[0], mx[1] - mn[1], mx[2] - mn[2]],
           ctr: [(mn[0] + mx[0]) / 2, (mn[1] + mx[1]) / 2, (mn[2] + mx[2]) / 2], n: v.length };
}
/** Total triangle area carried by a key — a measure of a tube that tracks its CALIBRE.
    Row F needs this because a bounding box does not: an arch's y extent is set by ARCH_DROOP and the
    crescent's own sweep, which barely move when the bar thins, so arch 5's box shrank by only 20%
    between full size and its 8.5% vestige and the row could not tell a transient from a persistence.
    A swept tube's area is proportional to its radius at fixed length, so this falls with the vestige
    the way the picture does. */
function areaOf(group, key) {
  const tris = trisOf(group, key);
  let a = 0;
  for (const t of tris) {
    const ux = t[3] - t[0], uy = t[4] - t[1], uz = t[5] - t[2];
    const vx = t[6] - t[0], vy = t[7] - t[1], vz = t[8] - t[2];
    a += 0.5 * Math.hypot(uy * vz - uz * vy, uz * vx - ux * vz, ux * vy - uy * vx);
  }
  return a;
}
function meanOf(group, key, axis) {
  const v = vertsOf(group, key); if (!v.length) return null;
  let s = 0; for (const p of v) s += p[axis]; return s / v.length;
}
/* ----------------------------------------------------- REAL SOLID CONTAINMENT

   RENDER-STANDARD 3.z asks a model that builds more than one closed solid to assert that neither of
   any pair lies inside the other, and names the method: ray-cast containment, as cardiac-cycle-pumping
   does for its two ventricular casts.

   THE FIRST VERSION OF ROW O USED BOUNDING-BOX CONTAINMENT AND IT WAS THE WRONG MEASURE. It reported
   fifteen containments on a model that has far fewer, and the false positives were not noise — they
   were systematic, and they were systematic in exactly the shapes this model is made of. Every part
   here is either a CRESCENT wrapped round the pharynx or a THREAD running beside one, and a thin
   curved solid's axis-aligned box is mostly empty space: arch 5's box sits inside the pharynx's box
   while arch 5 is wrapped round the OUTSIDE of the pharynx and touches it nowhere. A box test cannot
   tell those apart, so it would have sent a reviewer to look for a defect that is not there, and —
   worse, because it is the failure that survives — it would have been satisfied by any pair whose
   boxes merely failed to nest, including a pair that genuinely interpenetrates.

   So: Moller-Trumbore parity, three skew directions and a majority vote per vertex, sampled. Three
   rather than one because a single axis-aligned ray from a vertex that lies ON a surface, or that
   grazes a neighbouring triangle edge-on, returns a parity that is right in principle and wrong in
   arithmetic — the same degeneracy chorion-placenta-early's outward probe documents. The probe counts
   how often the three disagreed and reports it, per RENDER-STANDARD's "A PROBE WITH A DEGENERATE CASE
   MUST REPORT THE DEGENERACY".                                                                      */

const _INS_DIRS = [[1, 0.0371, 0.0177], [0.0213, 1, 0.0431], [0.0307, 0.0119, 1]].map(d => {
  const L = Math.hypot(d[0], d[1], d[2]); return [d[0] / L, d[1] / L, d[2] / L];
});

function trisOf(group, key) {
  const out = [];
  group.traverse(m => {
    if (!m.isMesh || !m.geometry || (m.userData && m.userData.outline)) return;
    if ((m.userData && m.userData.key) !== key) return;
    const p = m.geometry.attributes.position.array;
    for (let i = 0; i < p.length; i += 9) {
      out.push([p[i], p[i + 1], p[i + 2], p[i + 3], p[i + 4], p[i + 5], p[i + 6], p[i + 7], p[i + 8]]);
    }
  });
  return out;
}

function _crossings(o, d, tris) {
  let n = 0;
  for (let k = 0; k < tris.length; k++) {
    const tr = tris[k];
    const e1x = tr[3] - tr[0], e1y = tr[4] - tr[1], e1z = tr[5] - tr[2];
    const e2x = tr[6] - tr[0], e2y = tr[7] - tr[1], e2z = tr[8] - tr[2];
    const px = d[1] * e2z - d[2] * e2y, py = d[2] * e2x - d[0] * e2z, pz = d[0] * e2y - d[1] * e2x;
    const det = e1x * px + e1y * py + e1z * pz;
    if (Math.abs(det) < 1e-18) continue;
    const inv = 1 / det, tx = o[0] - tr[0], ty = o[1] - tr[1], tz = o[2] - tr[2];
    const u = (tx * px + ty * py + tz * pz) * inv;
    if (u < 0 || u > 1) continue;
    const qx = ty * e1z - tz * e1y, qy = tz * e1x - tx * e1z, qz = tx * e1y - ty * e1x;
    const v = (d[0] * qx + d[1] * qy + d[2] * qz) * inv;
    if (v < 0 || u + v > 1) continue;
    const s = (e2x * qx + e2y * qy + e2z * qz) * inv;
    if (s > 1e-9) n++;
  }
  return n;
}

/**
 * What fraction of key A's sampled vertices lie INSIDE key B's solid.
 *
 * `exclude` is a key whose interior is NOT counted: a vertex of A that lies inside `exclude` is
 * skipped rather than scored. That exists for one specific and legitimate case — see the note on
 * ARTERY_KEYS below — and it reports how many it skipped, so the exemption is never silent.
 */
function insideFrac(group, kA, kB, sample, exclude) {
  const A = vertsOf(group, kA);
  const B = trisOf(group, kB);
  if (!A.length || !B.length) return null;
  const X = exclude ? trisOf(group, exclude) : null;
  const S = sample || 70;
  const step = Math.max(1, Math.floor(A.length / S));
  let inside = 0, tested = 0, split = 0, skipped = 0;
  for (let i = 0; i < A.length; i += step) {
    if (X && X.length) {
      let yx = 0, nx = 0;
      for (const d of _INS_DIRS) { if (_crossings(A[i], d, X) % 2 === 1) yx++; else nx++; }
      if (yx > nx) { skipped++; continue; }
    }
    let yes = 0, no = 0;
    for (const d of _INS_DIRS) { if (_crossings(A[i], d, B) % 2 === 1) yes++; else no++; }
    tested++;
    if (yes > no) inside++;
    if (yes > 0 && no > 0) split++;
  }
  return { frac: tested ? inside / tested : 0, tested, raysDisagreed: split, skippedInExclude: skipped };
}

/* WHY ARTERY-AGAINST-ARTERY IS MEASURED OUTSIDE THE SAC, and why that is a partition rather than a
 * tolerance — which is the distinction 3.z turns on, so it has to be argued and not asserted.
 *
 * Six pairs of arch arteries arise from the aortic sac. Each is 0.038 across and the sac is 0.164
 * across, so six of them side by side need 0.228 of room and have 0.164: they CANNOT be disjoint at
 * their origins, and a model in which they were would be a model of something else. That is not a
 * geometry problem to be solved, it is what a common chamber is — the sac is one cavity with twelve
 * outflows, and two outflows share space inside it in the same sense that two coronary ostia share
 * the aortic root.
 *
 * Measured, that showed up as the last two rows standing: 8.2% of the third arch artery's vertices
 * inside the fourth's, at y = -2.49, which is inside the sac. The mechanism is that all six origins
 * sit on one line and differ only in y, so each artery rising towards its own arch passes through the
 * origin of every artery caudal to it.
 *
 * So the row asks the question that actually matters for the teaching, which is a question about the
 * COURSE and not about the root: does any arch artery lie inside another arch artery ANYWHERE OUTSIDE
 * the chamber they both arise from. The beat that asks a student to count six pairs needs six pairs
 * they can see and follow, and this measures exactly that, with no threshold loosened anywhere: the
 * floor stays at INSIDE_FLOOR, and the exemption is a named region with a reason, reported with the
 * count of vertices it absorbed. A genuine mid-course overlap — two arteries crossing out in the arch,
 * which WOULD be a defect — is still caught, and row P checks the one most at risk of it.
 */
const ARTERY_KEYS = ['aa1', 'aa2', 'aa3_r', 'aa3_l', 'aa4_r', 'aa4_l', 'aa5', 'aa6_r', 'aa6_l'];

/** minimum vertex-to-vertex distance between two keys — a cheap surface clearance */
function minGap(group, k1, k2, stride) {
  const A = vertsOf(group, k1), B = vertsOf(group, k2);
  if (!A.length || !B.length) return null;
  const st = stride || 3;
  let best = Infinity;
  for (let i = 0; i < A.length; i += st) for (let j = 0; j < B.length; j += st) {
    const dx = A[i][0] - B[j][0], dy = A[i][1] - B[j][1], dz = A[i][2] - B[j][2];
    const d = dx * dx + dy * dy + dz * dz;
    if (d < best) best = d;
  }
  return Math.sqrt(best);
}
/** the lowest point of a key, and the point on another key nearest to it */
function lowest(group, key) {
  const v = vertsOf(group, key); if (!v.length) return null;
  let b = v[0]; for (const p of v) if (p[1] < b[1]) b = p;
  return b;
}
function nearestDist(group, key, pt, stride) {
  const v = vertsOf(group, key); if (!v.length) return null;
  const st = stride || 1;
  let best = Infinity;
  for (let i = 0; i < v.length; i += st) {
    const dx = v[i][0] - pt[0], dy = v[i][1] - pt[1], dz = v[i][2] - pt[2];
    const d = dx * dx + dy * dy + dz * dz; if (d < best) best = d;
  }
  return Math.sqrt(best);
}

/* the no-shared-space partition (RENDER-STANDARD 3.z), published rather than left to a tolerance.
   Each pair here is CONSTRUCTION or ANATOMY rather than a defect, and says which. */
const CONTAINMENT_EXCLUSIONS = [
  /* THE CONTENTS OF AN ARCH ARE INSIDE IT, AND THAT IS THE WHOLE SUBJECT OF THE SCENE. An arch is a
     block of mesenchyme with one cartilage, one nerve and one artery in its core; those three being
     inside it is the anatomy the student is being taught, not a modelling accident. Excluded by name
     here, per 3.z — "never by a tolerance" — and the consequence is declared where it matters: a
     structure inside an opaque one is INVISIBLE, so the beats that teach the cartilages author the
     arch bars down in opacity, and the figure is measured rather than guessed. */
  ['cart1', 'arch1', "the arch 1 cartilage lies in arch 1's own core — the anatomy"],
  ['cart2', 'arch2', "as cart1/arch1"],
  ['cart3', 'arch3', "as cart1/arch1"],
  ['cart4', 'arch4', "as cart1/arch1"],
  ['cart6', 'arch6', "as cart1/arch1"],
  ['cn5', 'arch1', "the arch nerve runs in its own arch's core — the anatomy, and the nerve rule"],
  ['cn7', 'arch2', "as cn5/arch1"],
  ['cn9', 'arch3', "as cn5/arch1"],
  ['sln', 'arch4', "the superior laryngeal nerve is arch 4's nerve, in arch 4's core"],
  ['rln_r', 'arch6', "the recurrent laryngeal nerve ENDS IN THE LARYNX, which is arch 6's own territory — that is why it is arch 6's nerve"],
  ['rln_l', 'arch6', "as rln_r"],
  ['rln_r', 'cart6', "it reaches the arch 6 cartilages themselves — the laryngeal cartilages it supplies"],
  ['rln_l', 'cart6', "as rln_r"],
  ['aa1', 'arch1', "the arch artery runs in its own arch's core — the anatomy"],
  ['aa2', 'arch2', "as aa1/arch1"],
  ['aa3_r', 'arch3', "as aa1/arch1"], ['aa3_l', 'arch3', "as aa1/arch1"],
  ['aa4_r', 'arch4', "as aa1/arch1"], ['aa4_l', 'arch4', "as aa1/arch1"],
  ['aa5', 'arch5', "as aa1/arch1"],
  ['aa6_r', 'arch6', "as aa1/arch1"], ['aa6_l', 'arch6', "as aa1/arch1"],
  /* CONTINUITY. These pairs are one continuous channel built as two named parts, which is 3.z's own
     "a leaflet continuous with its own annulus and its own cords" case. Each arch artery ARISES FROM
     the aortic sac and ENDS IN the dorsal aorta — that is what the narration says it does — so its
     two ends are inside those two vessels by construction; the heart is continuous with the sac
     through the outflow tract; and each recurrent laryngeal nerve is a BRANCH of the vagus, so its
     first stretch lies within the trunk it leaves. Excluded by name, not by a tolerance, and the
     thing that is NOT excluded is the one that matters: no arch artery may lie inside ANOTHER ARCH
     ARTERY, because the beat that counts six pairs needs six pairs a student can see. */
  ['aa1', 'aortic_sac', 'an arch artery arises from the sac — continuity'],
  ['aa2', 'aortic_sac', 'as aa1'], ['aa5', 'aortic_sac', 'as aa1'],
  ['aa3_r', 'aortic_sac', 'as aa1'], ['aa3_l', 'aortic_sac', 'as aa1'],
  ['aa4_r', 'aortic_sac', 'as aa1'], ['aa4_l', 'aortic_sac', 'as aa1'],
  ['aa6_r', 'aortic_sac', 'as aa1'], ['aa6_l', 'aortic_sac', 'as aa1'],
  ['heart', 'aortic_sac', 'the heart is continuous with the sac through its outflow'],
  ['aa3_r', 'dorsal_aorta', 'an arch artery ends in the dorsal aorta — continuity'],
  ['aa3_l', 'dorsal_aorta', 'as aa3_r'],
  ['aa4_r', 'dorsal_aorta', 'as aa3_r'], ['aa4_l', 'dorsal_aorta', 'as aa3_r'],
  ['aa6_r', 'dorsal_aorta', 'as aa3_r'], ['aa6_l', 'dorsal_aorta', 'as aa3_r'],
  ['aa1', 'dorsal_aorta', 'as aa3_r'], ['aa2', 'dorsal_aorta', 'as aa3_r'],
  ['aa5', 'dorsal_aorta', 'as aa3_r'],
  ['rln_r', 'cn10', 'the recurrent laryngeal nerve is a branch of the vagus — continuity'],
  ['rln_l', 'cn10', 'as rln_r'],
  ['sln', 'cn10', 'the superior laryngeal nerve is a branch of the vagus — continuity'],
  /* CONSTRUCTION rather than anatomy: the magnified section's inclusions and its two coverings are
     built on and in the matrix disc, which is what a section through an arch looks like. */
  ['sec_cartilage', 'sec_mesoderm', 'a core inclusion inside the arch core — the subject of the section'],
  ['sec_muscle', 'sec_mesoderm', 'as sec_cartilage'],
  ['sec_nerve', 'sec_mesoderm', 'as sec_cartilage'],
  ['sec_artery', 'sec_mesoderm', 'as sec_cartilage'],
  ['sec_ectoderm', 'sec_mesoderm', "the covering is built flush on the core's outer arc"],
  ['sec_endoderm', 'sec_mesoderm', "the lining is built flush on the core's inner arc"],
];
/* How much of a part may lie inside another before it counts. NOT a tolerance standing in for the
   partition above — it is the probe's own sampling noise plus the shared-surface case, where a
   vertex lying exactly ON the other solid's surface votes either way. A genuine interpenetration
   reads far above this; the ones excluded above read near 1. */
const INSIDE_FLOOR = 0.04;

function measure(buildFn) {
  const m = {};
  const gLate = buildFn(1, { section: true, heart: true, sinus: true });
  const gEarly = buildFn(dayT(30), { section: false, heart: true, sinus: true });
  const g5 = buildFn(dayT(ARCH5_PEAK_DAY), {});

  /* --- A · sides. The right-hand members of the two per-side artery pairs sit at NEGATIVE x, by at
         least FLOORS.SIDE of their own x extent. This is the geometric half of the axis proof; the
         declaration half is prove-corpus-axes.mjs. --- */
  const a4r = boxOf(gLate, 'aa4_r'), a4l = boxOf(gLate, 'aa4_l');
  m.A = {
    aa4_r_meanX: meanOf(gLate, 'aa4_r', 0), aa4_l_meanX: meanOf(gLate, 'aa4_l', 0),
    aa4_meanXExtent: a4r && a4l ? (a4r.size[0] + a4l.size[0]) / 2 : null,
    aa6_r_meanX: meanOf(gLate, 'aa6_r', 0), aa6_l_meanX: meanOf(gLate, 'aa6_l', 0),
  };
  m.A.aa4_sepOverExtent = m.A.aa4_meanXExtent
    ? (m.A.aa4_l_meanX - m.A.aa4_r_meanX) / m.A.aa4_meanXExtent : null;

  /* --- C · the arches run cranio-caudally in order, each gap floored on the pair's own y extent --- */
  m.C = [];
  for (let i = 0; i < 5; i++) {
    const b1 = boxOf(gLate, 'arch' + (i + 1)), b2 = boxOf(gLate, 'arch' + (i + 2));
    if (!b1 || !b2) { m.C.push({ pair: (i + 1) + '-' + (i + 2), gapOverExtent: null }); continue; }
    const meanExt = (b1.size[1] + b2.size[1]) / 2;
    m.C.push({ pair: (i + 1) + '-' + (i + 2), dy: b1.ctr[1] - b2.ctr[1],
               meanYExtent: meanExt, gapOverExtent: (b1.ctr[1] - b2.ctr[1]) / meanExt });
  }

  /* --- D · no two arches share space, and consecutive ones keep a real clearance --- */
  m.D = [];
  for (let i = 0; i < 5; i++) {
    m.D.push({ pair: (i + 1) + '-' + (i + 2), minGap: minGap(gLate, 'arch' + (i + 1), 'arch' + (i + 2), 2) });
  }

  /* --- E · every arch STRADDLES the median plane: measured on the BOUNDING BOX, not the centroid,
         which is RENDER-STANDARD's explicit instruction for an edge claim --- */
  m.E = [];
  for (let n = 1; n <= 6; n++) {
    const b = boxOf(gLate, 'arch' + n);
    if (!b) { m.E.push({ arch: n, left: null }); continue; }
    const half = b.size[0] / 2;
    m.E.push({ arch: n, minX: b.min[0], maxX: b.max[0],
               leftOverHalf: b.max[0] / half, rightOverHalf: -b.min[0] / half });
  }

  /* --- F · arch 5 is TRANSIENT: much larger at its own day 29 than at t = 1 --- */
  const b5now = boxOf(g5, 'arch5'), b5late = boxOf(gLate, 'arch5');
  const a5peak = areaOf(g5, 'arch5'), a5late = areaOf(gLate, 'arch5');
  m.F = { peakDay: ARCH5_PEAK_DAY,
          peak_area: a5peak, late_area: a5late,
          ratio: a5late > 0 ? a5peak / a5late : null,
          peak_yExtent: b5now ? b5now.size[1] : null, late_yExtent: b5late ? b5late.size[1] : null,
          yExtentRatio_notGated: (b5now && b5late && b5late.size[1] > 0) ? b5now.size[1] / b5late.size[1] : null,
          cart5_built: !!boxOf(gLate, 'cart5'),
          arch6_peak_area_forScale: areaOf(g5, 'arch6') };

  /* --- H, I · WHERE EACH NERVE HOOKS, measured off the built nerve against the built arteries.
         The right nerve's lowest point must be ON the fourth arch artery and clear of the sixth;
         the left nerve's must be ON the sixth. "On" is a distance floored against the nerve's own
         calibre, so it cannot be satisfied by being vaguely nearby. --- */
  const loR = lowest(gLate, 'rln_r'), loL = lowest(gLate, 'rln_l');
  const rlnR_box = boxOf(gLate, 'rln_r');
  const calibre = rlnR_box ? 0.0135 * 2 : 0.027;
  /* THE PREDICATE IS A DISCRIMINATION, NOT A PROXIMITY. What rows H and I have to establish is WHICH
     artery each nerve hooks under, so the measured quantity is the RATIO of the distance to the artery
     claimed against the distance to the only rival — floored, so "nearer" cannot be satisfied by a
     hair. An absolute tolerance on the near distance alone is the weaker test and it is also the one
     that tempts an author to widen it when the geometry is slightly off, which is how a row stops
     measuring anything. The absolute bound is kept as well, against the nerve's own calibre, so that
     "under the fourth arch artery" cannot be satisfied by being far from both. */
  const dHR4 = loR ? nearestDist(gLate, 'aa4_r', loR) : null;
  const dHR6 = loR ? nearestDist(gLate, 'aa6_r', loR) : null;
  const dIL6 = loL ? nearestDist(gLate, 'aa6_l', loL) : null;
  const dIL4 = loL ? nearestDist(gLate, 'aa4_l', loL) : null;
  m.H = { lowestY: loR ? loR[1] : null,
          dist_to_aa4_r: dHR4, dist_to_aa6_r: dHR6,
          ratio_claimed_over_rival: (dHR4 != null && dHR6) ? dHR4 / dHR6 : null,
          calibre, declared_under: gLate.userData.rln_r_hook ? gLate.userData.rln_r_hook.under : null };
  m.I = { lowestY: loL ? loL[1] : null,
          dist_to_aa6_l: dIL6, dist_to_aa4_l: dIL4,
          ratio_claimed_over_rival: (dIL6 != null && dIL4) ? dIL6 / dIL4 : null,
          calibre, declared_under: gLate.userData.rln_l_hook ? gLate.userData.rln_l_hook.under : null };

  /* --- J · the LEFT hook ends up CAUDAL to the right, by a floored margin on the model's height --- */
  let modelH = 0;
  for (let n = 1; n <= 6; n++) { const b = boxOf(gLate, 'arch' + n); if (b) modelH = Math.max(modelH, b.max[1]); }
  let modelLo = Infinity;
  for (const k of ['rln_r', 'rln_l', 'cn10']) { const b = boxOf(gLate, k); if (b) modelLo = Math.min(modelLo, b.min[1]); }
  const H_SPAN = modelH - modelLo;
  /* THE DENOMINATOR IS THE MEAN EXTENT OF THE TWO STRUCTURES COMPARED, which is what RENDER-STANDARD
     specifies — "a fraction of the relevant extent of the structures compared ... at least 35% of the
     MEAN of the two extents along that axis". The first version divided by the whole model's y span,
     which is the wrong unit and a misleading one: that span is set by how far the vagus and the
     descending aorta happen to be drawn, so lengthening a context structure would have made a
     perfectly good asymmetry fail, and shortening one would have made a bad one pass. Both figures
     are reported, because a reviewer should be able to see the one I am not gating on. */
  const bR = boxOf(gLate, 'rln_r'), bL = boxOf(gLate, 'rln_l');
  const nerveMeanExt = (bR && bL) ? (bR.size[1] + bL.size[1]) / 2 : null;
  m.J = { rightLowestY: m.H.lowestY, leftLowestY: m.I.lowestY,
          drop: (m.H.lowestY != null && m.I.lowestY != null) ? m.H.lowestY - m.I.lowestY : null,
          nerveMeanYExtent: nerveMeanExt,
          dropOverNerveExtent: (m.H.lowestY != null && m.I.lowestY != null && nerveMeanExt)
            ? (m.H.lowestY - m.I.lowestY) / nerveMeanExt : null,
          modelYSpan: H_SPAN,
          dropOverModelSpan: (m.H.lowestY != null && m.I.lowestY != null)
            ? (m.H.lowestY - m.I.lowestY) / H_SPAN : null };

  /* --- K · THE SHARPER HALF. Before the regression the two hooks sit at the SAME level: the whole
         asymmetry is a consequence of archArteryKeep, not of anything written into the nerves. A model
         with two hand-placed hook heights fails this row and passes H, I and J. --- */
  const eR = lowest(gEarly, 'rln_r'), eL = lowest(gEarly, 'rln_l');
  m.K = { day: 30, rightLowestY: eR ? eR[1] : null, leftLowestY: eL ? eL[1] : null,
          asymOverSpan: (eR && eL) ? Math.abs(eR[1] - eL[1]) / H_SPAN : null,
          right_under: gEarly.userData.rln_r_hook ? gEarly.userData.rln_r_hook.under : null,
          left_under: gEarly.userData.rln_l_hook ? gEarly.userData.rln_l_hook.under : null };

  /* --- L · the sixth arch artery's regression is the asymmetry's cause: the right one's dorsal reach
         is shorter than the left's by a floored margin --- */
  /* HOW MUCH SHORTER, MEASURED AS SURFACE AREA RATHER THAN AS A BOUNDING-BOX DIAGONAL. The diagonal
     was the first measure and it is a poor one for this claim: the LEFT sixth arch artery is towed
     deep into the thorax, so its box grows for a reason that has nothing to do with how much of the
     vessel survives, and the ratio read 0.749 against a 0.72 floor while the surviving fractions were
     0.42 and 1.00. Area is proportional to length at a fixed calibre and both vessels have the same
     calibre, so it measures the thing the claim is about. The diagonal is still reported, because a
     reviewer should be able to see the number I am not gating on. */
  const dorsalReach = (g, k) => { const b = boxOf(g, k); return b ? -b.min[2] : null; };
  const diagOf = (g, k) => { const b = boxOf(g, k); return b ? Math.hypot(b.size[0], b.size[1], b.size[2]) : null; };
  const ar = areaOf(gLate, 'aa6_r'), al = areaOf(gLate, 'aa6_l');
  m.L = { aa6_r_area: ar, aa6_l_area: al, ratio: al > 0 ? ar / al : null,
          aa6_r_diag_notGated: diagOf(gLate, 'aa6_r'), aa6_l_diag_notGated: diagOf(gLate, 'aa6_l'),
          aa6_r_dorsal: dorsalReach(gLate, 'aa6_r'), aa6_l_dorsal: dorsalReach(gLate, 'aa6_l'),
          keep_r: archArteryKeep(6, -1, 1), keep_l: archArteryKeep(6, 1, 1) };

  /* --- M · THE HYOID IS A TWO-ARCH BONE, and this row asserts the half of that claim the model can
         actually carry: the ORDER. cart2 lies entirely cranial to cart3 — upper half of the hyoid from
         arch 2, lower half from arch 3 — floored on the two cartilages' mean y extent.

         WHAT IT DELIBERATELY DOES NOT ASSERT, and why. The claim a student is really being told to
         notice is that the two halves MEET: one bone, two arches. They do not meet in this model, and
         they cannot without breaking something truer. Each cartilage is built inside its own arch, and
         the arches sit 0.127 apart in the pharyngeal axis parameter, which is 0.54 in y; an arch bar's
         own thickness lets its cartilage move about 0.015 of that, so converging the two ventral ends
         closes 0.128 of a 0.54 gap and the rest can only be bought by letting a cartilage leave the
         arch it belongs to. Measured gap: see `gap` below, against `meanYExtent`.

         So the narration keeps the sentence and the scene's gaps[] carries the shortfall WITH THE
         NUMBER — RENDER-STANDARD's instruction for exactly this case, where editing a teaching
         sentence to agree with an approximate model "teaches something false about the body in order
         to make a check go green". The honest fix is a hyoid structure of its own, in two colours; it
         is named in gaps[] as the next improvement and is not attempted here. --- */
  const c2 = boxOf(gLate, 'cart2'), c3 = boxOf(gLate, 'cart3');
  m.M = { cart2_minY: c2 ? c2.min[1] : null, cart3_maxY: c3 ? c3.max[1] : null,
          gap: (c2 && c3) ? c2.min[1] - c3.max[1] : null,
          meanYExtent: (c2 && c3) ? (c2.size[1] + c3.size[1]) / 2 : null,
          orderOverExtent: (c2 && c3 && (c2.size[1] + c3.size[1]) > 0)
            ? (c2.min[1] - c3.max[1]) / ((c2.size[1] + c3.size[1]) / 2) : null,
          surfaceGap: minGap(gLate, 'cart2', 'cart3', 2),
          contact_shown: false };

  /* --- N · the section slab's four core inclusions each present their own face to the section
         camera: they are thicker than the matrix, measured, so the declared offset cannot drift --- */
  const mat = boxOf(gLate, 'sec_mesoderm');
  m.N = { matrix_xExtent: mat ? mat.size[0] : null, cores: {} };
  for (const k of ['sec_cartilage', 'sec_muscle', 'sec_nerve', 'sec_artery']) {
    const b = boxOf(gLate, k);
    m.N.cores[k] = b && mat
      ? { xExtent: b.size[0], protrudeEachSide: (b.size[0] - mat.size[0]) / 2,
          overMatrixHalf: ((b.size[0] - mat.size[0]) / 2) / (mat.size[0] / 2) }
      : null;
  }

  /* --- O · no two PARTS share space, outside the published exclusion partition (3.z) --- */
  const keys = [];
  gLate.traverse(mm => { if (mm.isMesh && mm.userData && !mm.userData.outline && mm.userData.key) {
    if (keys.indexOf(mm.userData.key) < 0) keys.push(mm.userData.key); } });
  const excl = new Set(CONTAINMENT_EXCLUSIONS.map(e => [e[0], e[1]].sort().join('|')));
  const overlaps = [];
  let boxMeets = 0;
  for (let i = 0; i < keys.length; i++) for (let j = i + 1; j < keys.length; j++) {
    const k1 = keys[i], k2 = keys[j];
    if (excl.has([k1, k2].sort().join('|'))) continue;
    const b1 = boxOf(gLate, k1), b2 = boxOf(gLate, k2);
    if (!b1 || !b2) continue;
    /* boxes must overlap on all three axes before it is even a question */
    let meet = true;
    for (let c = 0; c < 3; c++) if (b1.min[c] > b2.max[c] || b2.min[c] > b1.max[c]) meet = false;
    if (!meet) continue;
    /* CONTAINMENT BY RAY PARITY, both ways round — see the note on insideFrac(). A box overlap is
       only the trigger for asking; it is never the answer. */
    const bothArteries = ARTERY_KEYS.indexOf(k1) >= 0 && ARTERY_KEYS.indexOf(k2) >= 0;
    const ex = bothArteries ? 'aortic_sac' : null;
    const f12 = insideFrac(gLate, k1, k2, 48, ex), f21 = insideFrac(gLate, k2, k1, 48, ex);
    const a = f12 ? f12.frac : 0, b = f21 ? f21.frac : 0;
    boxMeets++;
    if (a > INSIDE_FLOOR || b > INSIDE_FLOOR) {
      overlaps.push({ a: k1, b: k2, aInsideB: +a.toFixed(3), bInsideA: +b.toFixed(3),
                      raysDisagreed: (f12 ? f12.raysDisagreed : 0) + (f21 ? f21.raysDisagreed : 0),
                      sacExempt: bothArteries,
                      skippedInSac: (f12 ? f12.skippedInExclude : 0) + (f21 ? f21.skippedInExclude : 0) });
    }
  }
  m.O = { pairs_total: keys.length * (keys.length - 1) / 2,
          pairs_whose_boxes_meet: boxMeets, excluded_by_name: CONTAINMENT_EXCLUSIONS.length,
          inside_floor: INSIDE_FLOOR, containments: overlaps, keys: keys.length };

  /* --- P · THE FIFTH ARCH ARTERY IS VISIBLE IN THE BEAT THAT COUNTS THE PAIRS. This is the row that
         protects the picture rather than the geometry, and it exists because the first two versions of
         this model both lost aa5: once at 95.8% inside the fourth arch artery (all twelve arteries
         started from one point), and once at 100% inside the aortic sac (its vestige was trimmed from
         the wrong end). Both times the one artery a student is asked to notice is absent would itself
         have been absent, which is a worse error than the geometry that caused it. Measured at arch
         5's own peak day, which is the t the scene pins its ref to. --- */
  const g5p = buildFn(dayT(ARCH5_PEAK_DAY), { section: false });
  m.P = { peakDay: ARCH5_PEAK_DAY, aa5_area: areaOf(g5p, 'aa5'), inside: {} };
  for (const k of ARTERY_KEYS.concat(['aortic_sac', 'pharynx'])) {
    if (k === 'aa5') continue;
    const f = insideFrac(g5p, 'aa5', k, 40, k === 'aortic_sac' ? null : 'aortic_sac');
    m.P.inside[k] = f ? { frac: +f.frac.toFixed(3), skippedInSac: f.skippedInExclude } : null;
  }

  /* --- Q · EVERY TUBE IS SWEEPABLE BY ITS OWN CALIBRE: the minimum radius of curvature of each
         centreline is at least 1.2x the tube radius it carries. Below 1.0 the inner side of the bend
         folds through itself and part of the solid's surface lies inside the solid — which is what
         the outward-normal probe is for, and which that probe MISSED on seven of this model's
         arteries at 71 sampled vertices. The ratio is the quantity the fold is actually made of, so
         it is asserted here directly rather than left to a sample. Recorded by addTube() as each
         tube is built, i.e. read off the line that was swept and not off the waypoints. --- */
  const cur = gLate.userData.curvature || {};
  const curE = gEarly.userData.curvature || {};
  const worst = (c) => {
    let w = null;
    for (const k of Object.keys(c)) if (!w || c[k].ratio < w.ratio) w = Object.assign({ key: k }, c[k]);
    return w;
  };
  m.Q = { late_worst: worst(cur), early_worst: worst(curE),
          late_tubes: Object.keys(cur).length,
          late_below_1: Object.keys(cur).filter(k => cur[k].ratio < 1.0),
          late_below_floor: Object.keys(cur).filter(k => cur[k].ratio < FLOORS.SWEEP),
          early_below_floor: Object.keys(curE).filter(k => curE[k].ratio < FLOORS.SWEEP) };

  m.keys_built = keys.slice().sort();
  m.day_at_t1 = tDay(1);
  return m;
}

/* The rows. Each: the predicate on the measured object, and a NEGATIVE CASE — a wrong measured object
   the predicate must reject. RENDER-STANDARD: "EVERY ACCEPTANCE TEST NEEDS A NEGATIVE CASE. A test
   that grades its own homework in the wrong units launders a defect into a proof." */
const ROWS = [
  { id: 'A', must: 'the right members of the per-side artery pairs lie at negative x, by >= 0.35 of their own mean x extent',
    ok: m => m.A.aa4_r_meanX < 0 && m.A.aa4_l_meanX > 0 && m.A.aa6_r_meanX < 0 && m.A.aa6_l_meanX > 0 &&
             m.A.aa4_sepOverExtent >= FLOORS.SIDE,
    neg: m => ({ A: Object.assign({}, m.A, { aa4_r_meanX: 0.001, aa4_sepOverExtent: 0.02 }) }) },

  { id: 'C', must: 'arch 1..6 descend in order, each gap >= 0.35 of the pair\'s mean y extent',
    ok: m => m.C.length === 5 && m.C.every(r => r.gapOverExtent != null && r.gapOverExtent >= FLOORS.SEP),
    neg: m => ({ C: m.C.map((r, i) => i === 2 ? Object.assign({}, r, { gapOverExtent: 0.04 }) : r) }) },

  { id: 'D', must: 'consecutive arches are separated solids: a real clearance, never touching',
    ok: m => m.D.length === 5 && m.D.every(r => r.minGap != null && r.minGap >= FLOORS.CLEAR),
    neg: m => ({ D: m.D.map((r, i) => i === 0 ? Object.assign({}, r, { minGap: 0.0 }) : r) }) },

  { id: 'E', must: 'every arch straddles the median plane, each side reaching >= 0.35 of its half extent',
    ok: m => m.E.length === 6 && m.E.every(r => r.leftOverHalf != null &&
             r.leftOverHalf >= FLOORS.STRADDLE && r.rightOverHalf >= FLOORS.STRADDLE),
    neg: m => ({ E: m.E.map((r, i) => i === 1 ? Object.assign({}, r, { rightOverHalf: 0.01 }) : r) }) },

  { id: 'F', must: 'arch 5 is transient — at its own peak day it is >= 3x its t=1 vestige — and it has no cartilage at all',
    ok: m => m.F.ratio != null && m.F.ratio >= 3.0 && m.F.cart5_built === false,
    neg: m => ({ F: Object.assign({}, m.F, { ratio: 1.02 }) }) },

  { id: 'H', must: 'the RIGHT recurrent nerve hooks under the FOURTH arch artery: >= 4x nearer to it than to the sixth, and within 4 calibres of it',
    ok: m => m.H.ratio_claimed_over_rival != null && m.H.ratio_claimed_over_rival <= 0.25 &&
             m.H.dist_to_aa4_r <= m.H.calibre * 4 && m.H.declared_under === 4,
    neg: m => ({ H: Object.assign({}, m.H, { ratio_claimed_over_rival: 0.95, dist_to_aa4_r: 0.9, declared_under: 6 }) }) },

  { id: 'I', must: 'the LEFT recurrent nerve hooks under the SIXTH arch artery (the ductus): >= 4x nearer to it than to the fourth, and within 4 calibres of it',
    ok: m => m.I.ratio_claimed_over_rival != null && m.I.ratio_claimed_over_rival <= 0.25 &&
             m.I.dist_to_aa6_l <= m.I.calibre * 4 && m.I.declared_under === 6,
    neg: m => ({ I: Object.assign({}, m.I, { ratio_claimed_over_rival: 0.95, dist_to_aa6_l: 0.9, declared_under: 4 }) }) },

  { id: 'J', must: 'the LEFT hook ends up caudal to the right by >= 0.35 of the two nerves\' mean y extent',
    ok: m => m.J.dropOverNerveExtent != null && m.J.dropOverNerveExtent >= FLOORS.SEP,
    neg: m => ({ J: Object.assign({}, m.J, { dropOverNerveExtent: 0.03 }) }) },

  { id: 'K', must: 'BEFORE the regression the two hooks are level to within 0.07 of the y span, and both hook arch 6 — so the asymmetry is the regression\'s doing, not the nerves\'',
    ok: m => m.K.asymOverSpan != null && m.K.asymOverSpan <= FLOORS.SYMM &&
             m.K.right_under === 6 && m.K.left_under === 6,
    neg: m => ({ K: Object.assign({}, m.K, { asymOverSpan: 0.42 }) }) },

  { id: 'L', must: 'the sixth arch artery is substantially shorter on the RIGHT than on the left at t=1 — the cause of H vs I — measured by surface area, which is proportional to length at equal calibre',
    ok: m => m.L.ratio != null && m.L.ratio <= 0.72,
    neg: m => ({ L: Object.assign({}, m.L, { ratio: 1.0 }) }) },

  { id: 'M', must: 'the arch 2 cartilage lies wholly CRANIAL to the arch 3 cartilage — upper hyoid from arch 2, lower from arch 3 — by >= 0.35 of their mean y extent. It does NOT assert that the two halves meet: they do not, and gaps[] says so with the number.',
    ok: m => m.M.orderOverExtent != null && m.M.orderOverExtent >= FLOORS.SEP,
    neg: m => ({ M: Object.assign({}, m.M, { orderOverExtent: -0.4 }) }) },

  { id: 'N', must: 'each of the four core inclusions is thicker than the matrix, so it presents its own face to the section camera',
    ok: m => ['sec_cartilage', 'sec_muscle', 'sec_nerve', 'sec_artery'].every(k =>
             m.N.cores[k] && m.N.cores[k].overMatrixHalf >= FLOORS.PROTRUDE),
    neg: m => ({ N: { matrix_xExtent: m.N.matrix_xExtent, cores: Object.assign({}, m.N.cores,
             { sec_nerve: Object.assign({}, m.N.cores.sec_nerve, { overMatrixHalf: 0.0 }) }) } }) },

  { id: 'P', must: 'at arch 5\'s peak day the fifth arch artery exists and lies inside no other artery outside the sac, and not inside the pharynx — so the beat that counts six pairs can show it',
    ok: m => m.P.aa5_area > 0 &&
             Object.keys(m.P.inside).every(k => m.P.inside[k] &&
               (k === 'aortic_sac' ? true : m.P.inside[k].frac <= INSIDE_FLOOR)),
    neg: m => ({ P: { peakDay: m.P.peakDay, aa5_area: m.P.aa5_area,
                      inside: Object.assign({}, m.P.inside, { aa4_r: { frac: 0.9, skippedInSac: 0 } }) } }) },

  { id: 'Q', must: 'every tube\'s centreline has a minimum radius of curvature >= 1.2x its own tube radius, so the swept solid cannot fold through itself',
    ok: m => m.Q.late_worst && m.Q.late_below_floor.length === 0 && m.Q.early_below_floor.length === 0,
    neg: m => ({ Q: Object.assign({}, m.Q, { late_below_floor: ['aa1'] }) }) },

  { id: 'O', must: 'no part lies inside another, outside the published exclusion partition (artery-against-artery measured outside the aortic sac — see the note on ARTERY_KEYS)',
    ok: m => m.O.containments.length === 0,
    neg: m => ({ O: Object.assign({}, m.O, { containments: [{ a: 'arch1', b: 'arch2' }] }) }) },
];

function acceptance(buildFn) {
  const bf = buildFn || buildArches;
  const m = measure(bf);
  const rows = ROWS.map(r => {
    let pass = false, err = null;
    try { pass = !!r.ok(m); } catch (e) { err = String(e && e.message || e); }
    let rejected = null;
    try { rejected = !r.ok(Object.assign({}, m, r.neg(m))); } catch (e) { rejected = true; }
    return { id: r.id, must: r.must, pass, error: err,
             got: pickFor(r.id, m), negative: { rejected } };
  });
  return { measured: m, rows, pass: rows.every(r => r.pass && r.negative.rejected),
           spec: ACCEPTANCE, floors: FLOORS, exclusions: CONTAINMENT_EXCLUSIONS };
}
function pickFor(id, m) { return m[id] !== undefined ? m[id] : null; }

/* ---------------------------------------------------------- claimMeasure (3.y)

   A beat that narrates a SHAPE asserts it AS PROJECTED ON TO THE SCREEN PLANE OF THE CAMERA THAT BEAT
   ROTATES TO, not in the model's own frame. VIEW_DIR is COPIED from viz3d.js:2095, not restated, so
   the player's cameras and the probe's cannot drift apart.                                           */
const VIEW_DIR = {
  anterior: [0, 0, 1], posterior: [0, 0, -1], lateral: [1, 0, 0], medial: [-1, 0, 0],
  superior: [0, 1, 0.001], inferior: [0, -1, 0.001],
};

function screenAxes(view) {
  const d = new T.Vector3().fromArray(VIEW_DIR[view] || VIEW_DIR.anterior).normalize();
  let up = Math.abs(d.y) > 0.99 ? new T.Vector3(0, 0, -1) : new T.Vector3(0, 1, 0);
  const right = new T.Vector3().crossVectors(up, d).normalize();
  up = new T.Vector3().crossVectors(d, right).normalize();
  return { d, right, up };
}

/**
 * Measures a beat can assert. Each takes the built group and a view, and returns a number IN THE
 * CAMERA'S SCREEN PLANE where the claim is about what can be seen.
 *
 *   hookDropAcross.<view>   how far apart on screen the two recurrent nerves' lowest points are,
 *                           as a fraction of the model's own on-screen height. The asymmetry is the
 *                           payoff of the artery beat and it is only visible from some cameras.
 *   archOrderAcross.<view>  the smallest on-screen gap between consecutive arch centres, over the
 *                           mean of their on-screen extents — "six bars, countable" is a claim about
 *                           a picture, and from `anterior` the series is seen end-on and collapses.
 *   straddleAcross.<view>   how far an arch reaches either side of the median plane, on screen.
 */
/* claimMeasure(name, t) — THE SIGNATURE viz-training/tools/check-beat-claims.mjs CALLS. That tool
   evaluates a view's claims at the view's own SET_STAGE t by calling `ownMeasure(name, t)`, so the
   measure takes a NAME and a t and builds its own geometry; the first version took a group and was
   simply never going to be called. Builds are cached per t because a beat asks several measures.   */
const _cmCache = new Map();
function buildForClaim(t) {
  const k = t.toFixed(6);
  if (!_cmCache.has(k)) {
    if (_cmCache.size > 24) _cmCache.clear();
    _cmCache.set(k, buildArches(t, { pharynx: true, grooves: true, vessels: true, nerves: true,
                                     heart: true, sinus: true, section: false }));
  }
  return _cmCache.get(k);
}

function claimMeasure(name, t) {
  const parts = String(name).split('.');
  const kind = parts[0];

  /* measures that are pure functions of t and need no geometry */
  if (kind === 'day') return tDay(t);
  if (kind === 'arch5SizeFrac') return archSize(ARCHES[4], t);
  if (kind === 'arteryKeep') return archArteryKeep(+parts[1], parts[2] === 'right' ? -1 : 1, t);
  if (kind === 'heartDropFrac') return heartDrop(t) / HEART_DESC;
  if (kind === 'sinusOpen') return sinusOpen(t);
  if (kind === 'hookUnder') return solveHook(parts[1] === 'right' ? -1 : 1, t).under;

  const group = buildForClaim(t);

  if (kind === 'archCount') {
    /* HOW MANY ARCHES A STUDENT COULD COUNT, which is the claim the first beat makes and is not the
       same as how many keys the model built. The threshold is a quarter of arch 6's own surface area
       — arch 6 being the smallest arch that is fully there — rather than an absolute number, so it
       scales with the model instead of needing to be retuned whenever a calibre changes. Arch 5 at
       its peak is 53% of arch 6 and counts; its t = 1 vestige is 4.5% and does not, which is exactly
       the distinction the fifth arch exists in this model to draw. */
    const ref = areaOf(group, 'arch6');
    if (!(ref > 0)) return 0;
    let n = 0;
    for (let i = 1; i <= 6; i++) if (areaOf(group, 'arch' + i) >= 0.25 * ref) n++;
    return n;
  }
  if (kind === 'cartBuilt') return areaOf(group, 'cart' + parts[1]) > 0 ? 1 : 0;
  if (kind === 'arteryCount') {
    /* as archCount: a quarter of the third arch artery's own surface, which never regresses */
    const ref = areaOf(group, 'aa3_r');
    if (!(ref > 0)) return 0;
    let n = 0;
    for (const k of ARTERY_KEYS) if (areaOf(group, k) >= 0.25 * ref) n++;
    return n;
  }
  if (kind === 'hookDropOverNerveExtent') {
    const bR = boxOf(group, 'rln_r'), bL = boxOf(group, 'rln_l');
    const lo = k => { const v = vertsOf(group, k); if (!v.length) return null;
      let b = v[0]; for (const q of v) if (q[1] < b[1]) b = q; return b; };
    const r = lo('rln_r'), l = lo('rln_l');
    if (!r || !l || !bR || !bL) return null;
    const mean = (bR.size[1] + bL.size[1]) / 2;
    return mean > 0 ? (r[1] - l[1]) / mean : null;
  }

  const v = parts[parts.length - 1];
  const S = screenAxes(v);
  const proj = (p, a) => p[0] * a.x + p[1] * a.y + p[2] * a.z;

  if (kind === 'hookDropAcross') {
    const lo = k => { const vv = vertsOf(group, k); if (!vv.length) return null;
      let b = vv[0]; for (const p of vv) if (p[1] < b[1]) b = p; return b; };
    const r = lo('rln_r'), l = lo('rln_l');
    if (!r || !l) return null;
    let hi = -Infinity, low = Infinity;
    for (let n = 1; n <= 6; n++) {
      const vv = vertsOf(group, 'arch' + n);
      for (const p of vv) { const u = proj(p, S.up); if (u > hi) hi = u; if (u < low) low = u; }
    }
    for (const k of ['rln_r', 'rln_l']) for (const p of vertsOf(group, k)) {
      const u = proj(p, S.up); if (u > hi) hi = u; if (u < low) low = u;
    }
    const span = hi - low;
    return span > 0 ? (proj(r, S.up) - proj(l, S.up)) / span : null;
  }

  if (kind === 'archOrderAcross') {
    const ctrs = [];
    for (let n = 1; n <= 6; n++) {
      const vv = vertsOf(group, 'arch' + n);
      if (!vv.length) { ctrs.push(null); continue; }
      let mn = Infinity, mx = -Infinity;
      for (const p of vv) { const u = proj(p, S.up); if (u < mn) mn = u; if (u > mx) mx = u; }
      ctrs.push({ c: (mn + mx) / 2, e: mx - mn });
    }
    let worst = Infinity;
    for (let i = 0; i < 5; i++) {
      const a = ctrs[i], b = ctrs[i + 1];
      if (!a || !b) continue;
      const mean = (a.e + b.e) / 2;
      const gap = mean > 0 ? (a.c - b.c) / mean : 0;
      if (gap < worst) worst = gap;
    }
    return isFinite(worst) ? worst : null;
  }

  if (kind === 'straddleAcross') {
    const key = parts[1];
    const vv = vertsOf(group, key);
    if (!vv.length) return null;
    let mn = Infinity, mx = -Infinity;
    for (const p of vv) { const u = proj(p, S.right); if (u < mn) mn = u; if (u > mx) mx = u; }
    const half = (mx - mn) / 2;
    return half > 0 ? Math.min(mx, -mn) / half : null;
  }

  return null;
}

/* ------------------------------------------------------------------ registration */

window.MB3D_MODELS = window.MB3D_MODELS || {};
window.MB3D_MODELS['pharyngeal-arches'] = {
  LAYERS: LAYERS,
  build: buildArches,
  /* Every optional layer on, so a structure behind a flag is still RESOLVABLE. Without this the
     provider builds only the defaults and anything behind an option comes back reason:'none', which
     the player shows a student as "there is no model of this structure" — a confident lie about a
     model sitting right there. */
  FULL: { pharynx: true, grooves: true, vessels: true, nerves: true, heart: true, sinus: true, section: true },
  /* Variants a scene may ask for as ref flags, e.g. "pharyngeal-arches#arch1@0.53+deficit_arch1".
     Deliberately NOT in FULL: FULL is "every optional layer on", and a deficit is not a layer — a
     build with all three on would be a model of three syndromes at once. */
  VARIANTS: {
    /* AN INERT FLAG, AND IT EARNS ITS PLACE. `ghost` changes nothing about what is built: it exists so
       that a scene can declare a SECOND structure pointing at the same model part and get its own mesh
       for it. Both viz3d (MODEL_GROUPS, keyed model@t+flags) and
       viz-training/tools/measure-scene-visibility.mjs (groupFor, keyed t|flags) cache the built group
       by exactly that triple, and the walk is explicit that "one mesh belongs to at most one structure;
       a later structure naming the same (t, flags, part) is reported rather than silently stealing
       it" — so without a distinguishing flag the second structure gets no geometry at all, which is
       what happened: all six ghosts measured 0.000% and the beats they were added to fix were
       unchanged to three decimal places. The scene uses it for the six translucent arch bars that
       beats 3 and 4 draw their contents inside. */
    ghost: 'no effect on the geometry — a cache key, so a second structure can reference the same part',
    deficit_arch1: 'arch 1 under-built: too few neural crest cells reach it — the first-arch syndromes',
    deficit_crest34: 'arch 3 and 4 territory under-built — the 22q11.2 deletion',
    persistent_sinus: 'the cervical sinus fails to close, leaving a branchial cyst',
    embryo: 'set false to build the magnified section alone, with none of the whole-series geometry',
  },
  ACCEPTANCE: ACCEPTANCE,
  FLOORS: FLOORS,
  EXCLUSIONS: CONTAINMENT_EXCLUSIONS,
  acceptance: function () { return acceptance(buildArches); },
  claimMeasure: claimMeasure,
  VIEW_DIR: VIEW_DIR,
  /* exposed so a probe or a review can re-derive the solved hooks without reading the source */
  solveHook: function (side, t) { const h = solveHook(side, t); return { under: h.under, weight: h.weight,
    point: [h.point.x, h.point.y, h.point.z] }; },
  archArteryKeep: archArteryKeep,
  dayT: dayT, tDay: tDay,
};

})();
