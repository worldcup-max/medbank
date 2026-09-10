/* MedBank · cardiac looping — PRODUCTION procedural model.
 *
 * This is the live file the player loads. `viz-training/spike/heart-loop.js` is the frozen spike that
 * proved the method and is kept as the reference for RENDER-STANDARD; it is not loaded by anything.
 * Changes belong HERE. If the two ever disagree, this one is right.
 *
 * Registers itself as MB3D_MODELS['cardiac-looping'], which is the whole contract the procedural
 * provider in viz3d.js depends on: a LAYERS palette and build(t, opts) -> THREE.Group whose meshes
 * carry userData.key.
 *
 * WRAPPED IN AN IIFE. Only the registration escapes. RENDER-STANDARD: a model written at top level
 * puts T, K, C, LAYERS and every constant into global lexical scope, and the second model to load —
 * written the obvious way, `const T = window.THREE` — dies on "Identifier 'T' has already been
 * declared" and takes the page with it. One model works fine at top level, which is why this is a
 * rule and not a habit. (Review finding 5, 2026-09-10.)
 *
 * THE MECHANISM. The tube GROWS about 50% longer while both poles stay tethered (arterial pole to
 * the aortic arches, venous pole to the septum transversum), so the extra length has nowhere to go
 * but sideways. Growth-driven buckling, not folding.
 *
 * WHAT t MEANS. t = 0 is the straight heart tube at the start of looping — DAY 23, which is what
 * view 1's narration says; t = 1 is the looped heart of day 28. CORRECTED 2026-09-10: this header
 * previously called t = 0 day 21, while the scene it feeds called the same moment day 23, so the two
 * disagreed by two days on every intermediate stage (review finding 11). The tube fuses at day 21-22;
 * looping is a day 23 to day 28 event, so day 23 is the straight tube this model starts from.
 *
 * AXES. +x = embryo's LEFT, -x = RIGHT, +y = CRANIAL, +z = VENTRAL. Measured, not assumed: six
 * BodyParts3D right/left pairs in viz-training/meshes-lite (tenth rib, hip bone, epididymis, both
 * lung lobes, pyramidalis) all put RIGHT at negative x, and viz3d.js puts the 'anterior' camera at +z.
 *
 * GEOMETRY NOTE. The myocardial tube is a THICK-WALLED shell — outer surface, inner surface, and
 * annular end caps — not a zero-thickness skin. That costs triangles but it means a cutaway shows a
 * wall, and the endocardial tube inside is separated from it by a real gap (the cardiac jelly)
 * instead of touching it. Nothing in this model shares a surface with anything else.
 */
(function () {

const T = window.THREE;
const K = window.VizKit;   // render-kit.js must load first — it owns winding, normals and colour
const C = K.C;

const LAYERS = {
  pericardium: { color: 0x8fb8e8, name: 'Pericardial cavity' },
  mesocardium: { color: 0x7fc9b4, name: 'Dorsal mesocardium' },
  midline:     { color: 0x9aa6bf, name: 'Median plane' },
  veins:       { color: 0x27497a, name: 'Vitelline & cardinal veins' },
  sinus:       { color: 0x5b49ad, name: 'Sinus venosus' },
  atrium:      { color: 0x1f7fc4, name: 'Primitive atrium' },
  ventricle:   { color: 0xc02a3a, name: 'Primitive ventricle' },
  bulbus:      { color: 0xd85c26, name: 'Bulbus cordis' },
  truncus:     { color: 0xcf9a1e, name: 'Truncus arteriosus' },
  arches:      { color: 0x8f2438, name: 'Aortic arches' },
  endocardium: { color: 0xe7aebe, name: 'Endocardial tube' },
};

const L0    = 6.0;    // heart-tube arc length on day 23
const GROW  = 0.50;   // it lengthens by half again while the poles stay put — that is why it buckles
const NSEG  = 300;    // centreline samples
const NRING = 34;     // points around the tube
const WALL  = 0.095;  // myocardial wall thickness
const JELLY = 0.085;  // cardiac jelly: the GAP between myocardium and endocardium

function len(t) { return L0 * (1 + GROW * t); }
function gauss(u, c, w) { const z = (u - c) / w; return Math.exp(-z * z); }

/* ---------------------------------------------------------------- the curve

   THE BENDS ARE AT THE NAMED LANDMARKS. Each of the four is a constriction a student is examined on,
   and each is also where two neighbouring segments meet — so the divisions sit where the tube is
   narrowest, which is the geometry least likely to fight. The segment boundaries below use exactly
   these four numbers.                                                                              */

const BENDS = [
  { key: 'sinoatrial',       c: 0.165, w: 0.085 },
  { key: 'atrioventricular', c: 0.400, w: 0.100 },
  { key: 'bulboventricular', c: 0.660, w: 0.095 },
  { key: 'bulbotruncal',     c: 0.870, w: 0.080 },
];

/* SOLVED, NOT TUNED — and this is the parameter that decides the examinable relation.

   The previous version solved the bend AMPLITUDE by bisection (it still does, below) and then
   hand-tuned the two constants that set the PLANE each bend happens in: PSI0 = 0.26, TAU = 1.60.
   The plane is the torsion, and the torsion is what decides whether the loop is convex ventrally or
   dorsally and whether the atrium ends up behind and above the ventricle. Both came out wrong — the
   whole loop bent dorsally and the atrium finished 1.19 units BELOW the ventricle — and no rendering
   check could have caught it, because the geometry was clean; it was pointed the wrong way.
   (Review findings 1 and 2, 2026-09-10. RENDER-STANDARD: "solve the parameter that decides the
   examinable relation".)

   These nine numbers — four bend amplitudes, four bend planes, and how far the two poles converge —
   are the output of `viz-training/tools/solve-cardiac-torsion.mjs`, which searches them against the
   conditions in ACCEPTANCE below (as amended in round 2: B' replaces B, and G, H and I were added) and accepts nothing that measures differently at two integration
   resolutions, or whose loop is not already dextral and ventrally convex at t = 0.25, 0.45 and 0.70 —
   the first candidate that satisfied every day-28 condition swung the limb to the embryo's LEFT for
   most of the process and corrected itself only at the end, which is one continuous function of t and
   wrong for two thirds of it. Do not hand-edit them. Change the curvature model, re-run the solver, paste what it
   prints, and check that `MB3D_MODELS['cardiac-looping'].acceptance()` still passes — the model
   asserts it at build time, so a drifted parameter says so in the console instead of quietly
   teaching the wrong relation.

   Robustness matters here and was learned the hard way: an earlier candidate satisfied every
   condition at NSEG = 60 and INVERTED at NSEG = 80, because its bend amplitude was pinned at the
   bisection's cap and the curve sat on a bifurcation. The solver now rejects any candidate whose
   measurements move between NSEG = 140 and NSEG = 300.                                             */
const SOLVED = {
  amp:       [ 1.1662,  1.2171,  1.8362,  0.2518],   // per BENDS, signed
  psi:       [ 2.8932,  2.5564, -0.6181,  1.5845],   // the plane each bend happens in, radians
  chordFrac:  0.5756,                                // how far the two poles converge by t = 1
  solved_at: '2026-09-10',
  solved_round: 2,
  /* RE-SOLVED 2026-09-10 against the ROUND-2 AMENDED conditions. The previous nine numbers satisfied
     round 1's tests A-G — but test B was itself wrong (it asserted the primitive ventricle finishes
     on the embryo's RIGHT), and test G was implemented in the wrong units, so two of the seven were
     grading the wrong thing. Solving against a corrected test set moved every parameter: the bend
     amplitudes changed sign, because the planes psi moved by roughly pi.

     What changed in the picture, measured at t = 1: the ventricle now finishes LEFT of the median
     plane (x +0.070, was -0.548) with the bulbus on the right (x -0.607), so the future left and
     right ventricles are on the sides a student is examined on; and the bulbus-to-ventricle
     separation is now predominantly TRANSVERSE (|dx| 0.678 vs |dz| 0.352) instead of
     antero-posterior, which is the arrangement view 4's narration asserts and round 2 measured as
     false at every t. */
};

/* The conditions the torsion was solved against. Stated as measurements so a review can re-check the
   arithmetic and not just the conclusion; `acceptance()` returns them measured. */
const ACCEPTANCE = {
  axes: '+x = embryo LEFT, -x = RIGHT, +y = CRANIAL, +z = VENTRAL',
  at_t: 1,
  tests: [
    { id: 'A', says: 'the bulboventricular limb is convex VENTRALLY', must: 'ventricle centroid z > 0' },
    /* B' REPLACES ROUND-1's TEST B, which read "ventricle centroid x < 0" and so asserted that the
       primitive ventricle finishes on the embryo's RIGHT. It does not — it is the future LEFT
       ventricle and finishes left-posterior, which is the whole reason an L-loop can be described as
       putting "the morphological right ventricle on the left". B as written locked that defect in and
       the model asserted it on every build. Dextrality is a property of the bulboventricular
       CONVEXITY, not of the ventricle's final side. (Review round 2, finding 4.) */
    { id: "B'", says: 'the loop is DEXTRAL — a property of the CONVEXITY, not of the ventricle side',
      must: 'bulbus centroid x < 0 AND the max |x| of the bulboventricular centreline is on the -x side' },
    { id: 'C', says: 'the atrium lies BEHIND the ventricle',           must: 'atrium z - ventricle z < 0' },
    { id: 'D', says: 'the atrium lies ABOVE the ventricle',            must: 'atrium y - ventricle y > 0' },
    { id: 'E', says: 'the bulbus lies VENTRAL to the ventricle',       must: 'bulbus z - ventricle z > 0' },
    { id: 'F', says: 'the bulbus lies to the RIGHT of the ventricle',  must: 'bulbus x - ventricle x < 0' },
    { id: 'G', says: 'the two sit SIDE BY SIDE, not one ABOVE the other',
      must: '|dx| > |dy| for bulbus minus ventricle' },
    /* H is the OTHER half of view 4's sentence — "side by side rather than one BEHIND the other" —
       and it is the half test G never could express. Round 2 measured it failing at every t
       (dx 0.305 vs dz 0.691 at t = 1) and told the build task not to assert it until the geometry
       could satisfy it, or every render would warn. It is asserted here because it now does. */
    { id: 'H', says: 'the two sit SIDE BY SIDE, not one BEHIND the other',
      must: '|dx| > |dz| for bulbus minus ventricle, at t = 1 AND at the t view 4 renders (0.65)' },
    { id: 'I', says: 'the primitive ventricle finishes LEFT of the median plane',
      must: 'ventricle centroid x > 0' },
    /* M runs on the MIRROR build — the build acceptance() never touched, which is why round 2's
       rotation-masquerading-as-a-reflection passed as proven. It is measured in buildHeart on the
       real vertices immediately before and after the reflection; see mirrorProof(). */
    { id: 'M', says: 'the mirror variant is a REFLECTION, not a rotation',
      must: 'the signed volume of the sinus-atrium-ventricle-bulbus centroid tetrahedron NEGATES (ratio -1)' },
  ],
};

/* signed curvature, and the plane it acts in, at station u */
function bendAt(u) {
  let k = 0, wsum = 0, asum = 0;
  for (let j = 0; j < BENDS.length; j++) {
    const g = gauss(u, BENDS[j].c, BENDS[j].w);
    k += SOLVED.amp[j] * g;
    const wt = Math.abs(SOLVED.amp[j]) * g;
    wsum += wt; asum += wt * SOLVED.psi[j];
  }
  return { k: k, psi: wsum > 1e-9 ? asum / wsum : 0 };
}

/* MIRRORING — the L-loop. REBUILT 2026-09-10 (review round 2, finding 1).

   IT IS NOW A REAL REFLECTION. The previous version seeded the transported frame with n = -x and
   called that a mirror. It is not: b is derived as d x n, so negating n negates b too, and negating
   both is a 180-degree ROTATION about the tube's own long axis. Measured by the review: every
   chamber centroid of the "mirror" build was exactly diag(-1, +1, -1) of the D-loop's, and the
   signed volume of the sinus-atrium-ventricle-bulbus tetrahedron was UNCHANGED (ratio +1.0000)
   where a true mirror image must NEGATE it. Both builds had the same handedness, so view 8's
   "L-loop" was the normal D-looped heart seen from behind — which is also why it rendered at 79% of
   the D-loop's width and 1.79 units further from the camera.

   Worse, the parts disagreed about what mirroring meant: the chambers rotated, the veins (whose
   `side` was flipped separately) genuinely reflected, and the arches did neither.

   THE FIX. The curve is built once, always right-handed, and the FINISHED GROUP is reflected in the
   median plane by K.reflectGroupX — positions and normals negate x and every triangle's winding
   reverses, which is what keeps the faces outward after a handedness flip. One transform, applied to
   every mesh in the group, so no part can disagree with another. The per-side `side` flips in the
   veins and the arches are GONE; they were doing the mirroring a second time and in a different way.

   WHY THE OLD NOTE SOUNDED CONVINCING, recorded so it is not repeated: it claimed proof from
   identical triangle count, identical outward-normal fraction, negated mean x and untouched winding.
   All four pass on a rotation. None of them is a chirality test. "The winding is untouched" was the
   tell, not the proof — a genuine enantiomer MUST reverse winding, and this one now does.

   THE TEST. buildHeart measures the signed volume of the four chamber centroids on the real built
   vertices immediately BEFORE and AFTER the reflection and asserts the ratio is -1. That is the one
   check that separates a reflection from a rotation, and it runs on the mirror build — the build the
   old acceptance() never touched. See mirrorProof on the registration. */
let MIRROR = false;

const LAM_CAP = 3.2;

function integrate(lambda, t, nseg) {
  const N = nseg || NSEG;
  const L = len(t), ds = L / N;
  const p = new T.Vector3(0, 0, 0);
  const d = new T.Vector3(0, 1, 0);
  const n = new T.Vector3(1, 0, 0);   // never mirror-dependent: the mirror is a reflection of the finished group
  const P = [], D = [], Nv = [], B = [];
  for (let i = 0; i <= N; i++) {
    const u = i / N;
    const b = new T.Vector3().crossVectors(d, n).normalize();
    P.push(p.clone()); D.push(d.clone()); Nv.push(n.clone()); B.push(b.clone());
    if (i === N) break;
    const bd = bendAt(u);
    const axis = new T.Vector3()
      .addScaledVector(b, Math.cos(bd.psi))
      .addScaledVector(n, Math.sin(bd.psi))
      .normalize();
    const q = new T.Quaternion().setFromAxisAngle(axis, lambda * bd.k * ds);
    d.applyQuaternion(q).normalize();
    n.applyQuaternion(q);
    n.addScaledVector(d, -n.dot(d)).normalize();
    p.addScaledVector(d, ds);
  }
  return { P: P, D: D, N: Nv, B: B, L: L, nseg: N };
}

const POLE = new T.Vector3(0, -L0 * 0.46, 0);   // the venous pole, fixed for every t

/* Rigid-body fit: rotate the solved curve so the line between its two poles is vertical again, then
   drop the venous pole back onto its fixed point. Nothing is scaled — the poles really are where the
   septum transversum and the aortic arches hold them, and the loop is what happens in between. */
function orient(cl) {
  const last = cl.nseg;
  const chord = new T.Vector3().subVectors(cl.P[last], cl.P[0]).normalize();
  const q = new T.Quaternion().setFromUnitVectors(chord, new T.Vector3(0, 1, 0));
  for (const arr of [cl.D, cl.N, cl.B]) for (const v of arr) v.applyQuaternion(q);
  for (const v of cl.P) v.applyQuaternion(q);
  const shift = new T.Vector3().subVectors(POLE, cl.P[0]);
  for (const v of cl.P) v.add(shift);
  return cl;
}

function chordLen(cl) { return cl.P[cl.nseg].distanceTo(cl.P[0]); }

/* The one real constraint: both poles are tethered, so the distance between them is set by how far
   the heart has compacted — not by how much the tube has grown. The bend amplitude is whatever it
   takes to satisfy that, solved by bisection at every t. */
function centreline(t, nseg) {
  if (t <= 0.0001) return orient(integrate(0, t, nseg));
  const target = L0 * (1 - SOLVED.chordFrac * t);
  let lo = 0, hi = LAM_CAP;
  if (chordLen(integrate(hi, t, nseg)) > target) return orient(integrate(hi, t, nseg));
  for (let k = 0; k < 34; k++) {
    const mid = (lo + hi) / 2;
    if (chordLen(integrate(mid, t, nseg)) > target) lo = mid; else hi = mid;
  }
  return orient(integrate((lo + hi) / 2, t, nseg));
}

/* ------------------------------------------------------------- the calibre

   A heart tube is not a pipe. It is a string of dilations separated by constrictions, and those
   constrictions are the landmarks students are examined on: the sinoatrial orifice, the
   atrioventricular canal, the bulboventricular sulcus.                                             */

function radius(u, t) {
  const grow = 0.45 + 0.75 * t;
  let r = 0.285;
  r += 0.155 * gauss(u, 0.055, 0.075) * (0.7 + 0.3 * t);  // sinus horns
  r += 0.300 * gauss(u, 0.280, 0.110) * grow;             // atrium ballooning
  r += 0.335 * gauss(u, 0.530, 0.120) * grow;             // ventricle ballooning
  r += 0.170 * gauss(u, 0.755, 0.090) * (0.6 + 0.4 * t);  // bulbus cordis
  r -= 0.075 * gauss(u, 0.165, 0.055);                    // sinoatrial constriction
  r -= 0.105 * gauss(u, 0.400, 0.050);                    // atrioventricular canal
  r -= 0.072 * gauss(u, 0.660, 0.048);                    // bulboventricular sulcus
  r -= 0.042 * gauss(u, 0.870, 0.045);                    // bulbotruncal junction
  return Math.max(r, 0.125);
}

/* ---------------------------------------------- measuring the loop, not looking at it

   Volume-weighted centreline centroid. Weighted by r squared because that is how a swept solid's
   mass is distributed, so this tracks the mesh centroid closely without building any geometry —
   which is what makes the acceptance check cheap enough to run on every build.                     */
function segCentroid(cl, t, u0, u1) {
  const N = cl.nseg, c = new T.Vector3();
  let W = 0;
  for (let i = Math.round(u0 * N); i <= Math.round(u1 * N); i++) {
    const w = radius(i / N, t) * radius(i / N, t);
    c.addScaledVector(cl.P[i], w); W += w;
  }
  return c.divideScalar(W);
}

function measureLoop(t, nseg) {
  /* No mirror dance any more: the centreline is the same curve for both builds, because the mirror
     is a reflection applied to the finished group rather than a different integration. */
  const cl = centreline(t, nseg || 140);
  const g = k => segCentroid(cl, t, SEGS_U[k][0], SEGS_U[k][1]);
  const a = g('atrium'), v = g('ventricle'), b = g('bulbus'), s = g('sinus'), tr = g('truncus');
  const dx = b.x - v.x, dy = b.y - v.y, dz = b.z - v.z;
  /* B' — dextrality read off the CONVEXITY: the station of greatest lateral excursion over the
     ventricle+bulbus stretch must lie on the embryo's right. */
  let bvx = 0, bvAbs = -1;
  for (let i = Math.round(SEGS_U.ventricle[0] * cl.nseg); i <= Math.round(SEGS_U.bulbus[1] * cl.nseg); i++) {
    if (Math.abs(cl.P[i].x) > bvAbs) { bvAbs = Math.abs(cl.P[i].x); bvx = cl.P[i].x; }
  }
  return {
    A: v.z, Bp: b.x, bvx: bvx, C: a.z - v.z, D: a.y - v.y, E: dz, F: dx,
    H: Math.abs(dx) - Math.abs(dz), I: v.x,
    /* REVIEW 2026-09-10 round 2: was Math.hypot(dx, dz) - Math.abs(dy), which folded the
       ANTERO-POSTERIOR separation into "transverse" and so let "one behind the other" count as
       evidence for "side by side" — the one arrangement view 4's narration explicitly denies.
       G now tests what its own `must` string says. See the queue item's findings: the narration's
       full claim needs a further test dx > dz, which the geometry does NOT satisfy at any t. */
    G: Math.abs(dx) - Math.abs(dy),
    centroids: { sinus: s, atrium: a, ventricle: v, bulbus: b, truncus: tr },
  };
}

/* The build-time assertion. Cheap (one centreline, no geometry) and it is the only thing standing
   between a drifted parameter and a student being taught the loop backwards. */
function acceptance(nseg) {
  /* REVIEW 2026-09-10 round 3: this parameter is NSEG, not t, and a reviewer reading the built_notes
     naturally calls acceptance(1) or acceptance(0.65). That integrated the centreline with one
     segment and returned confident-looking numbers at 1e-16 with D, G and I reported FAILING — a
     false failure report on a model whose tests all pass. The trap cost this review run twenty
     minutes and would have put a fabricated CRITICAL finding on the queue if it had been believed.
     A curve needs segments; refuse anything that cannot be one. */
  if (nseg != null && !(nseg >= 8 && Number.isFinite(nseg))) {
    throw new Error('cardiac-looping acceptance(nseg): the argument is the SEGMENT COUNT, not t. ' +
      'Got ' + nseg + '. Call acceptance() for the default 140, or acceptance(300) to re-measure at ' +
      'a finer integration. The tests are all evaluated at t = 1 (and H also at t = 0.65) by design.');
  }
  const m = measureLoop(1, nseg || 140);
  /* H has to hold at the t view 4 is actually DRAWN at, not only at day 28: view 4 makes its
     side-by-side claim over stage _b, which is t = 0.65. Round 2 measured that claim false at the
     very t the picture uses, which is the sharpest form the defect took. */
  const m65 = measureLoop(0.65, nseg || 140);
  m.H65 = m65.H;
  const ok = {
    A: m.A > 0,
    "B'": m.Bp < 0 && m.bvx < 0,
    C: m.C < 0, D: m.D > 0,
    E: m.E > 0, F: m.F < 0, G: m.G > 0,
    H: m.H > 0 && m.H65 > 0,
    I: m.I > 0,
  };
  /* M is measured on the mirror build in buildHeart, not here — acceptance() builds no geometry.
     Reported when a mirror has been built this session, so a caller sees it alongside the rest. */
  const mp = _mirrorProof;
  if (mp) { ok.M = mp.ratio != null && mp.ratio < -0.999 && mp.ratio > -1.001; m.M = mp.ratio; }
  return { measured: m, pass: ok, allPass: Object.keys(ok).every(k => ok[k]), spec: ACCEPTANCE };
}

let _asserted = false;
function assertAcceptance() {
  if (_asserted) return;
  _asserted = true;
  try {
    const r = acceptance();
    if (!r.allPass) {
      const bad = Object.keys(r.pass).filter(k => !r.pass[k]).join(', ');
      console.warn('[cardiac-looping] ACCEPTANCE FAILED for ' + bad +
        ' — the solved torsion no longer satisfies the anatomy it was solved against. ' +
        'Re-run viz-training/tools/solve-cardiac-torsion.mjs.', r.measured);
    }
  } catch (e) { /* never let a self-check break a render */ }
}

function heartShell(cl, u0, u1, t, cut) {
  return K.sweptShell({
    frame: cl, i0: u0 * cl.nseg, i1: u1 * cl.nseg, ring: NRING,
    outerR: i => radius(i / cl.nseg, t),
    innerR: i => Math.max(radius(i / cl.nseg, t) - WALL, 0.045),
    window: cut,
  });
}

function add(group, key, geo, opts) {
  return K.addSolid(group, key, geo, Object.assign({
    color: LAYERS[key].color, name: LAYERS[key].name,
  }, opts || {}));
}

/* ------------------------------------------------------------------ segments
   The boundaries ARE the four bend centres — the named waists. */

const SEGS_U = {
  sinus:     [0.000, 0.165],
  atrium:    [0.165, 0.400],
  ventricle: [0.400, 0.660],
  bulbus:    [0.660, 0.870],
  truncus:   [0.870, 1.000],
};
const SEGS = Object.keys(SEGS_U).map(k => ({ key: k, u0: SEGS_U[k][0], u1: SEGS_U[k][1] }));
const OVERLAP = 0.006;   // segments interpenetrate slightly at each waist, so no cap is ever visible

function sampleAt(cl, u) {
  const i = Math.max(0, Math.min(cl.nseg, Math.round(u * cl.nseg)));
  return { p: cl.P[i], d: cl.D[i], n: cl.N[i], b: cl.B[i] };
}

/* --------------------------------------------------- the pericardial cavity

   REBUILT 2026-09-10 (review finding 4). It used to be scaled from the bounding box of the heart at
   that same t, so the cavity grew exactly as fast as the tube and could never show the one thing
   view 1 says about it — that the tube is elongating faster than the cavity around it. It was also
   drawn at opacity 0.022, which is invisible.

   Now its HEIGHT is set by the tethers: the sac has to span pole to pole, and the poles converge on
   their own solved schedule. Its WIDTH grows on a slower schedule of its own, from the room a day-23
   tube has around it to just containing the day-28 loop. So at day 23 the tube runs straight up the
   middle with clear space at its sides, and by day 28 the loop has come out to meet the wall. That
   is the crowding, and it is now visible.

   The transverse extent at t = 1 is MEASURED off the centreline rather than guessed, so it tracks
   the solved curve instead of drifting away from it. */
let _cavityR1 = null;
function cavityRadiusAtT1() {
  if (_cavityR1 != null) return _cavityR1;
  const cl = centreline(1, 140);
  let r = 0;
  for (let i = 0; i <= cl.nseg; i++) {
    r = Math.max(r, Math.hypot(cl.P[i].x, cl.P[i].z) + radius(i / cl.nseg, 1));
  }
  _cavityR1 = r * 1.06;
  return _cavityR1;
}
const CAV_R0 = 1.18;   // the room a day-23 tube (max radius ~0.60) has at its sides

/* one triangle, wound so its face normal agrees with the normal it is given */
function emitTri(E, p1, p2, p3, nrm, e1, e2) {
  const fn = e1.subVectors(p2, p1).cross(e2.subVectors(p3, p1));
  if (fn.lengthSq() < 1e-14) return;                 // degenerate at the taper's point
  if (fn.dot(nrm) >= 0) E.tri(p1, p2, p3, nrm, nrm, nrm);
  else                  E.tri(p1, p3, p2, nrm, nrm, nrm);
}

/* ------------------------------------------------- proving a mirror is a mirror

   Chirality is not implied by anything else we measure. Triangle count, outward-normal fraction,
   negated mean x and untouched winding ALL pass on a 180-degree rotation, and all four were cited as
   proof of the L-loop that turned out to be a rotation. The signed volume of four named landmark
   centroids is the test that separates them: a rotation PRESERVES it, a reflection NEGATES it.

   Measured on the real built vertices — not on the centreline, and not on the transform's own
   definition — so it fails if any part of the group is left untransformed or transformed differently
   from the rest, which is the second half of what went wrong last time. */

function partCentroids(group) {
  const acc = {};
  group.traverse(o => {
    if (!o.isMesh || o.userData.outline || !o.userData.key || !o.geometry) return;
    const a = o.geometry.attributes.position;
    if (!a) return;
    const e = acc[o.userData.key] || (acc[o.userData.key] = { x: 0, y: 0, z: 0, n: 0 });
    for (let i = 0; i < a.count; i++) { e.x += a.getX(i); e.y += a.getY(i); e.z += a.getZ(i); }
    e.n += a.count;
  });
  const out = {};
  for (const k in acc) if (acc[k].n) out[k] = new T.Vector3(acc[k].x / acc[k].n, acc[k].y / acc[k].n, acc[k].z / acc[k].n);
  return out;
}

/* signed volume of the sinus -> atrium -> ventricle -> bulbus tetrahedron */
function tetraVolume(c) {
  if (!c.sinus || !c.atrium || !c.ventricle || !c.bulbus) return null;
  const u = new T.Vector3().subVectors(c.atrium, c.sinus);
  const v = new T.Vector3().subVectors(c.ventricle, c.sinus);
  const w = new T.Vector3().subVectors(c.bulbus, c.sinus);
  return u.dot(new T.Vector3().crossVectors(v, w)) / 6;
}

let _mirrorProof = null;

/* ------------------------------------------------------------------- build */

function buildHeart(t, opts) {
  opts = opts || {};
  MIRROR = !!opts.mirror;
  assertAcceptance();
  const g = new T.Group();
  const cl = centreline(t);

  // the myocardial tube, five segments meeting at their waists
  for (const s of SEGS) {
    const cut = (opts.cutaway && s.key === 'ventricle')
      ? { i0: 0.420 * NSEG, i1: 0.640 * NSEG, dir: new T.Vector3(0.42, 0.10, 1).normalize(), half: 1.02 } : null;
    const geo = heartShell(cl, Math.max(0, s.u0 - OVERLAP), Math.min(1, s.u1 + OVERLAP), t, cut);
    add(g, s.key, geo, { outline: 0.034 });
  }

  // endocardial tube, floating inside with the cardiac jelly as a real gap
  if (opts.endocardium || opts.cutaway) {
    const path = [], rr = [];
    for (let i = 0; i <= NSEG; i += 2) { path.push(cl.P[i]); rr.push(Math.max(radius(i / NSEG, t) - WALL - JELLY, 0.035)); }
    const geo = K.tubeAlong(path, u => rr[Math.min(rr.length - 1, Math.round(u * (rr.length - 1)))], { ring: 20 });
    add(g, 'endocardium', geo, { outline: 0.014 });
  }

  // venous pole: the tube is tethered here, and the veins do not move while the tube grows
  {
    const a = sampleAt(cl, 0.0);
    const bez = (p0, p1, p2, n) => {
      const out = [];
      for (let i = 0; i <= n; i++) {
        const u = i / n, v = 1 - u;
        out.push(new T.Vector3(
          v * v * p0.x + 2 * v * u * p1.x + u * u * p2.x,
          v * v * p0.y + 2 * v * u * p1.y + u * u * p2.y,
          v * v * p0.z + 2 * v * u * p1.z + u * u * p2.z));
      }
      return out;
    };
    for (const side of [1, -1]) {
      // common cardinal vein, descending into the horn from above and behind
      const horn = new T.Vector3(a.p.x + side * 0.16, a.p.y + 0.05, a.p.z - 0.05);
      const ccv = bez(horn,
        new T.Vector3(side * 1.05, a.p.y + 0.28, -0.55),
        new T.Vector3(side * 1.10, a.p.y + 0.72, -1.00), 14);
      add(g, 'veins', K.tubeAlong(ccv, u => 0.155 - 0.030 * u, { ring: 16 }), { outline: 0.020 });

      // vitelline vein, climbing from the yolk stalk below
      const vit = bez(horn,
        new T.Vector3(side * 0.62, a.p.y - 0.72, 0.18),
        new T.Vector3(side * 0.70, a.p.y - 1.15, 0.38), 14);
      add(g, 'veins', K.tubeAlong(vit, u => 0.145 - 0.025 * u, { ring: 16 }), { outline: 0.020 });
    }
  }

  // arterial pole: aortic sac, the arches sweeping dorsally round the pharynx, paired dorsal aortae
  {
    const a = sampleAt(cl, 1.0);
    const sac = a.p.clone().addScaledVector(a.d, 0.09);
    const bez3 = (p0, p1, p2, p3, n) => {
      const out = [];
      for (let i = 0; i <= n; i++) {
        const u = i / n, v = 1 - u;
        const w0 = v * v * v, w1 = 3 * v * v * u, w2 = 3 * v * u * u, w3 = u * u * u;
        out.push(new T.Vector3(
          w0 * p0.x + w1 * p1.x + w2 * p2.x + w3 * p3.x,
          w0 * p0.y + w1 * p1.y + w2 * p2.y + w3 * p3.y,
          w0 * p0.z + w1 * p1.z + w2 * p2.z + w3 * p3.z));
      }
      return out;
    };
    const DA_X = 0.44, DA_Z = -1.35;   // where the dorsal aortae run, behind the pharynx
    for (const side of [1, -1]) {
      // arches, nested cranial to caudal. Each is ONE arc from the aortic sac, bulging laterally,
      // onto the dorsal aorta — arcs at different heights, so they never cross.
      for (let k = 0; k < 2; k++) {
        const yEnd = sac.y + 1.10 - k * 0.52;
        const end = new T.Vector3(side * DA_X, yEnd, DA_Z);
        const path = bez3(sac,
          new T.Vector3(sac.x + side * (0.80 - k * 0.06), sac.y + (yEnd - sac.y) * 0.42, sac.z - 0.05),
          new T.Vector3(side * (1.02 - k * 0.06), yEnd + (yEnd - sac.y) * 0.16, DA_Z * 0.55),
          end, 22);
        add(g, 'arches', K.tubeAlong(path, () => 0.088, { ring: 14 }), { outline: 0.018 });
      }
      // the dorsal aorta itself, running caudally down the back of the embryo
      const da = [];
      for (let i = 0; i <= 12; i++) {
        const u = i / 12;
        da.push(new T.Vector3(side * DA_X * (1 - 0.28 * u * u), sac.y + 1.22 - u * 1.55, DA_Z + 0.12 * u));
      }
      add(g, 'arches', K.tubeAlong(da, u => 0.086 * (1 - 0.55 * u * u), { ring: 12 }), { outline: 0.016 });
    }
    {
      const sg = new T.SphereGeometry(1, 26, 18);
      sg.scale(0.36, 0.27, 0.33);
      sg.translate(sac.x, sac.y + 0.03, sac.z);
      add(g, 'arches', sg, { outline: 0.024 });
    }
  }

  /* ----------------------------------------------------- dorsal mesocardium

     REBUILT 2026-09-10 (review finding 3). It used to be one continuous sheet at every t whose
     opacity ramped to zero — so it FADED rather than broke down, and the one thing view 2 exists to
     teach, the hole left behind, could not be shown at all. It is now TWO cuffs with a real gap
     between them at every t, and that gap is the transverse pericardial sinus — the reason you can
     pass a finger behind the aorta and pulmonary trunk and in front of the atria.

     The two cuffs do not then fade out. They are the cranial and caudal pericardial reflections and
     they persist; fading them away was the old model asserting that the mesocardium disappears,
     which it does not.

     A MEMBRANE TAPERS (RENDER-STANDARD §3). Every free edge — including the two new torn edges —
     narrows to nothing where it meets the tube, so it reads as something suspending the heart rather
     than a sheet of card standing behind it. */
  /* REVIEW 2026-09-10 round 3: this guard read `opts.mesocardium !== false`, so the mesocardium was
     the ONE optional layer that was on unless explicitly switched off, while its three siblings
     (endocardium, pericardium, midline) are all opt-in and FULL declares all four the same way.
     build(t, {}) therefore returned a mesocardium nobody asked for. Not visible in the player — the
     provider builds with FULL and slices by key — but every direct render carried it, including the
     build task's own stage proofs: in tools/render-cardiac-looping.mjs the plain stages pass {} and
     the `-meso` stages pass {mesocardium:true}, so the pair that was meant to show the sheet against
     its absence differed only by the midline rod. Now opt-in, like the other three. */
  if (opts.mesocardium) {
    const MESO_U0 = 0.30, MESO_U1 = 0.84;
    const MESO_MID = 0.575;          // where it has given way: between the AV canal and the BV sulcus
    const MESO_OPEN = 0.50;          // t by which the gap has reached its full width
    const GAP_0   = 0.055;           // half-width of the gap ALREADY PRESENT at day 23
    const GAP_MAX = 0.125;           // half-width once it is fully open

    /* THE GAP IS THERE FROM THE START. The breakdown of the central dorsal mesocardium PRECEDES the
       loop — it is what lets the tube hang free between its two fixed ends, which is the mechanical
       premise of view 1 and what the recovered original view 1 says in as many words: at day 23 "its
       dorsal mesocardium has broken down in the middle". An earlier draft of this rebuild had it
       breaking during the loop, which would have made view 2's "has already given way" false at the
       stage view 2 is drawn at. It starts open and widens. */
    const sm0 = Math.min(1, t / MESO_OPEN);
    const half = GAP_0 + (GAP_MAX - GAP_0) * (sm0 * sm0 * (3 - 2 * sm0));
    const panels = [[MESO_U0, MESO_MID - half], [MESO_MID + half, MESO_U1]];

    for (const [pu0, pu1] of panels) {
      if (pu1 - pu0 < 0.02) continue;
      /* THROUGH THE EMITTER, not by hand. The old sheet pushed its own position and normal arrays and
         its triangle order disagreed with its supplied normals on about a quarter of its faces —
         harmless on a DoubleSide sheet with no silhouette, but it is exactly the reimplemented
         winding RENDER-STANDARD §6 calls a bug rather than a style choice. quadFlip, not quad: for
         corners in ring order A,B,C,D the emitter's `quad` produces the face normal OPPOSITE to
         (B-A)x(D-A), which is the side this sheet has always been drawn from — checked against the
         probe, which read 0.00-0.25 agreement with `quad` and 1.00 with `quadFlip`. */
      const E = K.emitter(), steps = 30;
      const A = new T.Vector3(), Bv = new T.Vector3(), C2 = new T.Vector3(), D2 = new T.Vector3();
      const n1 = new T.Vector3(), e1 = new T.Vector3(), e2 = new T.Vector3();
      /* AIM IT AT A WORLD DIRECTION, NOT AT A FRAME AXIS. The sheet used to be laid along the
         transported frame's binormal, which IS dorsal at t = 0 and is not dorsal anywhere by t = 1 —
         the frame rotates through the loop, so the "dorsal" mesocardium came out draped across the
         front of the ventricle. RENDER-STANDARD makes this point about cutaway windows; it is the
         same mistake. Resolve the direction per station from the world direction the sheet actually
         has to reach: dorsal, -z, with the component along the tube removed. */
      const DORSAL = new T.Vector3(0, 0, -1);
      const dir = new T.Vector3();
      const dorsalAt = (u, sm) => {
        dir.copy(DORSAL).addScaledVector(sm.d, -DORSAL.dot(sm.d));
        if (dir.lengthSq() < 1e-6) dir.copy(sm.b);        // the tube is running straight fore-aft
        return dir.normalize();
      };
      const back = (u, out) => {
        const sm = sampleAt(cl, u);
        /* clamp before the fractional power: at the panel's last station the ratio can round to
           1 + 1e-16, sin comes back at -2e-16, and Math.pow of a negative base to a fractional
           exponent is NaN — which reaches three as "Computed radius is NaN" and nothing else. */
        const sArg = Math.min(1, Math.max(0, (u - pu0) / (pu1 - pu0)));
        const taper = Math.pow(Math.max(0, Math.sin(Math.PI * sArg)), 0.75);
        return out.copy(sm.p).addScaledVector(dorsalAt(u, sm), radius(u, t) * 0.80 + 1.35 * taper);
      };
      const front = (u, out) => {
        const sm = sampleAt(cl, u);
        return out.copy(sm.p).addScaledVector(dorsalAt(u, sm), radius(u, t) * 0.80);
      };
      /* The sheet's normal is the frame's own N at that station, not a cross product of the quad's
         edges. Taken from the edges it flipped sign on about a quarter of the quads — the frame
         rotates along the sweep, so where the strip narrows to its taper the two edges nearly line up
         and the sign of their cross product is decided by rounding. N comes from the same transported
         frame that produced the positions, so the two cannot disagree (RENDER-STANDARD 2.3). */
      for (let i = 0; i < steps; i++) {
        const ua = pu0 + (pu1 - pu0) * (i / steps), ub = pu0 + (pu1 - pu0) * ((i + 1) / steps);
        front(ua, A); front(ub, Bv); back(ub, C2); back(ua, D2);
        // the sheet lies in the plane spanned by the tube's tangent and the dorsal direction, so its
        // normal is their cross product — from the same functions that placed the corners
        const smA = sampleAt(cl, ua);
        n1.copy(smA.d).cross(dorsalAt(ua, smA));
        if (n1.lengthSq() < 1e-12) continue;
        n1.normalize();
        // Per TRIANGLE, not per quad: near the taper the quad is not planar, so one of its two
        // triangles can face the other way from the other. Each is emitted on the same side as N.
        emitTri(E, A, Bv, C2, n1, e1, e2);
        emitTri(E, A, C2, D2, n1, e1, e2);
      }
      const geo = E.geometry();
      add(g, 'mesocardium', geo, {
        noOutline: true,
        matOver: { transparent: true, opacity: 0.46, side: T.DoubleSide, depthWrite: false, roughness: 0.95, clearcoat: 0 },
        renderOrder: 18,
      });
    }
  }

  /* -------------------------------------------------------- median plane reference

     ADDED 2026-09-10 (review finding 12). Nothing in this model said which side of the embryo you
     were looking at, so a mirrored loop on its own could be captioned anything. This is a reference,
     not anatomy: the median plane the loop is dextral OR sinistral about. It is what makes "the
     bulboventricular limb bulges to the embryo's right" a visible claim rather than a caption. */
  if (opts.midline) {
    const yLo = POLE.y - 0.35, yHi = POLE.y + L0 * (1 - SOLVED.chordFrac * t) + 0.45;
    const rod = [];
    for (let i = 0; i <= 10; i++) rod.push(new T.Vector3(0, yLo + (yHi - yLo) * (i / 10), 0));
    add(g, 'midline', K.tubeAlong(rod, () => 0.030, { ring: 8 }), { noOutline: true,
      matOver: { transparent: true, opacity: 0.85, roughness: 0.9 } });
    // ventral tick, so the plane reads as a plane and not as a line
    for (const yy of [yLo + (yHi - yLo) * 0.22, yLo + (yHi - yLo) * 0.5, yLo + (yHi - yLo) * 0.78]) {
      const tick = [];
      for (let i = 0; i <= 6; i++) tick.push(new T.Vector3(0, yy, 1.15 * (i / 6)));
      add(g, 'midline', K.tubeAlong(tick, u => 0.022 * (1 - 0.7 * u), { ring: 8 }), { noOutline: true,
        matOver: { transparent: true, opacity: 0.55, roughness: 0.9 } });
    }
  }

  /* ------------------------------------------------------- pericardial cavity
     A CLOSED shell drawn from the inside, so rotating never has it swallow the heart. See the note
     above cavityRadiusAtT1 for why it is sized the way it is. */
  if (opts.pericardium) {
    const halfY = 0.5 * L0 * (1 - SOLVED.chordFrac * t) + 0.92;
    const rXZ = CAV_R0 + (cavityRadiusAtT1() - CAV_R0) * t;
    const cy = POLE.y + 0.5 * L0 * (1 - SOLVED.chordFrac * t);
    const geo = new T.SphereGeometry(1, 48, 32);
    geo.scale(rXZ, halfY, rXZ);
    geo.translate(0, cy, 0);
    const m = new T.Mesh(geo, new T.MeshBasicMaterial({
      color: C(LAYERS.pericardium.color), transparent: true, opacity: 0.10,
      side: T.BackSide, depthWrite: false,
    }));
    m.renderOrder = 20; m.userData.key = 'pericardium'; m.name = LAYERS.pericardium.name;
    g.add(m);
    // a second, front-facing copy gives the bubble an edge you can see from outside
    const rim = new T.Mesh(geo.clone(), new T.MeshBasicMaterial({
      color: C(0xbfd8ff), transparent: true, opacity: 0.075,
      side: T.FrontSide, depthWrite: false, blending: T.AdditiveBlending,
    }));
    rim.renderOrder = 21; rim.userData.key = 'pericardium'; rim.name = LAYERS.pericardium.name;
    g.add(rim);
  }

  /* THE MIRROR, taken here: on the FINISHED group, as a true reflection in the median plane.
     Measured before and after on the real vertices, because the one thing that distinguishes a
     reflection from the rotation this used to be is that the signed volume must NEGATE. */
  if (MIRROR) {
    const before = tetraVolume(partCentroids(g));
    K.reflectGroupX(g);
    const after = tetraVolume(partCentroids(g));
    /* REVIEW 2026-09-10 round 3: the probe has a degenerate case and it was warning on it.
       At t = 0 the tube is STRAIGHT, so the four centroids are coplanar, the tetrahedron has zero
       signed volume and the ratio is 0/0. The shape has no handedness yet, so the question "is this
       a reflection or a rotation" has no answer at t = 0 — and on a straight tube the two are the
       same transform anyway. The guard was reporting CANNOT MEASURE as MEASURED AND WRONG, which
       fired the alarm on every t=0 mirror build and cost tools/test-per-view-t.mjs its console-clean
       check on an unrelated item. Verified at t = 0/0.2/0.4/0.6/0.65/0.8/1: the ratio is null only
       at t = 0 and is exactly -1.000 at every other t. Not measurable is now said, not warned. */
    const measurable = before != null && Math.abs(before) > 1e-9;
    const ratio = measurable ? after / before : null;
    _mirrorProof = { tetraBefore: before, tetraAfter: after, ratio: ratio, t: t,
      measurable: measurable,
      note: measurable ? undefined : 'not measurable at this t — the tube is still straight, so the ' +
        'sinus-atrium-ventricle-bulbus centroids are coplanar and the shape has no handedness to reverse' };
    if (measurable && !(ratio < -0.999 && ratio > -1.001)) {
      console.warn('[cardiac-looping] MIRROR IS NOT A REFLECTION — the signed volume of the ' +
        'sinus-atrium-ventricle-bulbus tetrahedron must NEGATE (ratio -1). A rotation preserves it. ' +
        'This is the check that the L-loop failed silently in round 2.', _mirrorProof);
    }
  }

  /* APART — for a comparison view only.
     A D-loop and an L-loop are mirror images about the median plane, so drawn in one space they
     interpenetrate: the atrium and sinus of each straddle the midline and the two hearts merge into
     one unreadable mass. That is what happened the first time view 8 was given both whole loops in
     order to hide the cut ends that finding 7 is about. This offsets the whole heart away from the
     median plane, in the direction its own loop turns, so the two stand side by side. The offset is
     measured off the built geometry rather than picked, so it stays correct if the loop changes size.
     It is a PRESENTATION flag: a scene that shows one heart must not use it, because an offset heart
     is no longer at its own midline. */
  if (opts.apart) {
    const box = new T.Box3().setFromObject(g);
    const halfW = Math.max(Math.abs(box.min.x), Math.abs(box.max.x));
    g.position.x = (MIRROR ? 1 : -1) * (halfW + 0.30);
    g.updateMatrixWorld(true);
  }

  return g;
}

/* the provider contract */
window.MB3D_MODELS = window.MB3D_MODELS || {};
window.MB3D_MODELS['cardiac-looping'] = {
  LAYERS: LAYERS,
  build: buildHeart,
  /* Every optional layer on. The provider builds with this so that a structure behind a flag is still
     resolvable — it slices the group by key afterwards, so building the full set costs one group and
     makes the difference between "no model exists" and "you didn't ask for it" impossible to confuse. */
  FULL: { endocardium: true, pericardium: true, mesocardium: true, midline: true },
  /* Variants a scene may ask for as ref flags, e.g. "cardiac-looping#ventricle@1+mirror". */
  VARIANTS: {
    mirror: 'L-loop — the tube turns to the left instead of the right',
    apart: 'offset clear of the median plane, so a D-loop and an L-loop can be shown side by side',
  },
  /* Exposed so a test, a review or the console can re-check the relation the torsion was solved
     against without reading the source or trusting a comment. */
  ACCEPTANCE: ACCEPTANCE,
  SOLVED: SOLVED,
  acceptance: acceptance,
  /* The chirality measurement from the most recent mirror build: {tetraBefore, tetraAfter, ratio}.
     ratio must be -1. A rotation returns +1, which is exactly how round 2's L-loop passed as proven. */
  mirrorProof: function () { return _mirrorProof; },
};

})();
