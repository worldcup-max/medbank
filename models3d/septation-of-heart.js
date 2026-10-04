/* MedBank · septation of the heart — PRODUCTION procedural model.
 *
 * Registers itself as MB3D_MODELS['septation-of-heart'], which is the whole contract the procedural
 * provider in viz3d.js depends on: a LAYERS palette and build(t, opts) -> THREE.Group whose meshes
 * carry userData.key.
 *
 * WRAPPED IN AN IIFE. Only the registration escapes. RENDER-STANDARD: a model written at top level
 * puts T, K, C, LAYERS and every constant into global lexical scope, and the next model to load —
 * written the obvious way, `const T = window.THREE` — dies on "Identifier 'T' has already been
 * declared" and takes the page with it.
 *
 * ------------------------------------------------------------------------------------------------
 * WHAT t MEANS.  t = 0 is DAY 25, the middle of week four: looping has finished, the heart is one
 * continuous S-bent tube with ONE lumen, and not one of the four septa exists.  t = 1 is DAY 56, the
 * end of week eight: four walls built, four chambers, two outflow vessels that cross.
 *
 *     day(t) = 25 + 31 t
 *
 * The scene's own framing — "four separate walls are built inside it ... learn them as four jobs, not
 * one event" — is the structure of this model. Four growth schedules run on one clock, in the order
 * and over the windows the narration states, and every malformation in the topic is ONE of those
 * schedules arrested or displaced, never a different drawing.
 *
 * ------------------------------------------------------------------------------------------------
 * WHAT IS SOLVED RATHER THAN TUNED.
 *
 * RENDER-STANDARD §3: "Ask which number a student would be marked wrong for, and solve THAT one
 * against a stated constraint." In this topic there are exactly two such numbers, and both are
 * solved here.
 *
 * 1. THE SPIRAL OF THE OUTFLOW SEPTUM. The examinable claim is that the aorta arises from the LEFT
 *    ventricle and lies DORSAL at the arterial end, while the pulmonary trunk arises from the RIGHT
 *    ventricle and lies VENTRAL — i.e. the two vessels cross. Nothing here schedules a twist angle.
 *    The septum's orientation is PRESCRIBED AT ITS TWO ENDS, in world directions:
 *
 *        at the arterial end (u = 1)    the aortic half must be DORSAL          n_world = -z
 *        at the conal end   (u = UC)    the aortic half must lie over the LV    n_world = +n_IVS
 *
 *    and the twist is whatever carries one to the other along an outflow tract that is itself
 *    curving. Because the frame is parallel-transported, the LOCAL twist is not the world-space
 *    angle between those two directions — it is that angle plus the rotation the transported frame
 *    performs on its own, which comes out of the conus's curvature and nothing else. The branch is
 *    the minimal one: a septum that rotated by more than a full turn would sweep through a channel,
 *    so |dtheta| < 2pi, and of the two candidates the smaller is taken. The SENSE is not chosen at
 *    all; it falls out of the two prescribed directions. Measured, that solve gives a twist of
 *    about a half turn, which is the figure every textbook quotes — but it is a RESULT here.
 *
 *    TRANSPOSITION IS THE SAME MECHANISM WITH THE SECOND BOUNDARY CONDITION DROPPED. Set
 *    `{ transposition: true }` and the septum runs straight at its arterial orientation the whole
 *    way down; the aortic half then arrives DORSAL at the conal end, which is over the RIGHT
 *    ventricle. Aorta from the right ventricle, pulmonary trunk from the left. Test N asserts that
 *    flip, on the real channel geometry, and it is the only proof that the twist is doing the work
 *    rather than decorating it.
 *
 * 2. THE ATRIAL FLAP VALVE. The examinable claim is that the two sheets OVERLAP, so that the
 *    foramen ovale is a one-way valve: open while right atrial pressure is the higher, shut when
 *    left atrial pressure rises at birth. The overlap is not typed in. What is stated is the job
 *    the foramen has to do — it must carry the fetal right-to-left shunt, so its open area is a
 *    prescribed fraction SHUNT_AREA of the atrial septum's own area — and the limbus position that
 *    delivers exactly that area is found by bisection. The OVERLAP between the ostium secundum and
 *    the limbus is then a consequence, and test H measures it with a magnitude floor.
 *
 *    A SECUNDUM ASD IS THAT OVERLAP GONE. Set `{ asd: true }` and the ostium secundum is resorbed
 *    past the limbus; the flap no longer reaches, the overlap goes negative, and the valve cannot
 *    shut. Same geometry, one parameter.
 *
 * ------------------------------------------------------------------------------------------------
 * AXES. +x = embryo's LEFT, -x = RIGHT, +y = CRANIAL, +z = VENTRAL. The convention cardiac-looping
 * and heart-tube-formation both state and measure. Declared here so the checks can assert it rather
 * than a comment claiming it (RENDER-STANDARD: "declare the axes and prove them").
 *
 * THE FIVE SEGMENT COLOURS ARE heart-tube-formation's AND cardiac-looping's, UNCHANGED, because this
 * scene is the third panel of one continuous story and the segment key is the only visual thread
 * tying the three together.
 *
 *   A DISAGREEMENT, RECORDED RATHER THAN QUIETLY RESOLVED (RENDER-STANDARD §6 / BUILD-TASK §6).
 *   The septation scene's own gaps[] says the thread is "atrium blue, ventricle YELLOW, bulbus/conus
 *   orange, truncus RED, sinus venosus dark blue". The two models already built and rendered use
 *   ventricle #c02a3a (RED) and truncus #cf9a1e (GOLD) — the ventricle and truncus entries are
 *   swapped relative to that note. A note is a claim; a rendered model is a fact, and two of them
 *   agree with each other. This model follows the built corpus, and the disagreement is written up
 *   in BUILD-LOG.md for the review to settle.
 *
 * GEOMETRY NOTE. Every chamber shell here is built with a CIRCULAR cross-section — section = 1,
 * flatten = 1 — rather than render-kit's default slight ovoid. That is deliberate and it is not
 * cosmetic: every septum in this model is clipped to the lumen by bisecting outward to the lumen
 * boundary, and a circular lumen makes that clip EXACT rather than approximate. A septum that
 * overshot its chamber wall by a fraction of a millimetre would poke through it, and an overshoot is
 * exactly the kind of defect that only shows from the one camera nobody listed.
 */
(function () {

const T = window.THREE;
const K = window.VizKit;   // render-kit.js must load first — it owns winding, normals and colour
const C = K.C;

const LAYERS = {
  sinus:        { color: 0x5b49ad, name: 'Sinus venosus & venous inflow' },
  atrium:       { color: 0x1f7fc4, name: 'Common atrium' },
  ventricle:    { color: 0xc02a3a, name: 'Primitive ventricle (left ventricle)' },
  bulbus:       { color: 0xd85c26, name: 'Bulbus cordis & conus (right ventricle)' },
  truncus:      { color: 0xcf9a1e, name: 'Truncus arteriosus' },
  av_cushions:  { color: 0x2fa68a, name: 'Endocardial cushions' },
  septum_primum:{ color: 0xe8d6a8, name: 'Septum primum' },
  septum_secundum:{ color: 0xb08246, name: 'Septum secundum' },
  muscular_ivs: { color: 0x9e2430, name: 'Muscular interventricular septum' },
  membranous_ivs:{ color: 0xdcc7d8, name: 'Membranous interventricular septum' },
  spiral_septum:{ color: 0x7d3c98, name: 'Aorticopulmonary (spiral) septum' },
  aortic_channel:{ color: 0xd0405a, name: 'Aortic channel' },
  pulmonary_channel:{ color: 0x3f7fd0, name: 'Pulmonary channel' },
  shunt:        { color: 0xe25f3a, name: 'Fetal right-to-left shunt' },
  midline:      { color: 0x9aa6bf, name: 'Median plane' },
};

/* ------------------------------------------------------------------ the clock */

const DAY0 = 25, DAY1 = 56;
function day(t) { return DAY0 + (DAY1 - DAY0) * t; }
function tOfDay(d) { return (d - DAY0) / (DAY1 - DAY0); }
function clamp01(x) { return x < 0 ? 0 : x > 1 ? 1 : x; }
function smooth(s) { const x = clamp01(s); return x * x * (3 - 2 * x); }
/* a growth schedule stated in DAYS, because every one of them is stated in days in the narration */
function ramp(t, dA, dB) { return smooth((day(t) - dA) / (dB - dA)); }

/* THE FOUR JOBS, each over the window the narration names. Nothing else in this file has a date. */
const SCHED = {
  cushions:   [26, 35],   // "swellings appear ... by the end of week five they meet and fuse"
  /* REVIEW ROUND 1, FINDING 4. These two windows used to be [28,34] and [31,35], and measured on
     real mesh vertices that left NO FRAME in which a student can see both openings: the ostium
     primum gap was 0.512 of the atrial span at day 31.2, 0.068 at 32.8 and FUSED by 33.9, while the
     ostium secundum's own radius was 0.023 at day 32 and 0.075 at day 33 — so the window in which
     both are real was under a day, and both were near-invisible inside it. View 3 is the beat that
     narrates "the gap that remains beneath its free edge is the ostium primum", and its own frame
     had already closed it. The old test D asserted only the ORDERING of two dates (31.06 < 33.90),
     which was true and never a picture. The primum now takes eight days to reach the cushions and
     the perforations start two days earlier; test T measures the resulting window on the emitted
     meshes and puts a magnitude floor under BOTH openings inside it. */
  primum:     [28, 37],   // septum primum grows down toward the cushions
  ostium2:    [29, 34],   // "perforations open at its top ... before the primum shuts"
  secundum:   [33, 44],   // the thick wall, to the right, stopping at the limbus
  muscular:   [28, 46],   // the muscular septum, left standing as the ventricles balloon out
  membranous: [44, 50],   // "closed in week seven from three directions"
  ridges:     [35, 44],   // conotruncal ridges appear and fuse
};
function g(t, k) { return ramp(t, SCHED[k][0], SCHED[k][1]); }

/* ---------------------------------------------------------------- centreline

   The looped heart at day 25. Looping is FINISHED at t = 0 — this model does not re-run it — so the
   centreline is fixed and only the calibre and the septa change with t. The eight control points are
   the named stations, in the corpus frame (+x LEFT, +y CRANIAL, +z VENTRAL): the inflow comes in
   dorsally and cranially, the loop carries the ventricle to the LEFT and caudally, round the apex,
   back to the RIGHT into the bulbus, and then cranially and ventrally into the truncus. That is a
   D-loop, and it is the arrangement cardiac-looping ends at. */
const CTRL = [
  [0.00, -0.30,  2.05, -1.40],   // sinus venosus / venous inflow
  [0.16, -0.10,  1.70, -0.88],   // sinoatrial junction
  [0.30,  0.00,  1.28, -0.52],   // common atrium
  [0.46,  0.08,  0.62, -0.05],   // atrioventricular canal — the waist
  [0.60,  0.48, -0.44,  0.28],   // primitive ventricle (future LV)
  [0.70,  0.04, -0.98,  0.44],   // apex
  [0.80, -0.48, -0.40,  0.60],   // bulbus cordis (future RV)
  [0.90, -0.52,  0.55,  0.62],   // conus
  [1.00, -0.12,  1.70,  0.30],   // truncus arteriosus / aortic sac
];

const NSEG = 220;
const NRING = 30;

/* Catmull-Rom through the control points, parameterised by the stated u of each. */
function centre(u) {
  u = clamp01(u);
  let k = 0;
  while (k < CTRL.length - 2 && u > CTRL[k + 1][0]) k++;
  const p0 = CTRL[Math.max(0, k - 1)], p1 = CTRL[k], p2 = CTRL[k + 1], p3 = CTRL[Math.min(CTRL.length - 1, k + 2)];
  const s = (u - p1[0]) / (p2[0] - p1[0]);
  const s2 = s * s, s3 = s2 * s;
  const out = new T.Vector3();
  for (let c = 1; c <= 3; c++) {
    const v = 0.5 * ((2 * p1[c]) + (-p0[c] + p2[c]) * s +
      (2 * p0[c] - 5 * p1[c] + 4 * p2[c] - p3[c]) * s2 +
      (-p0[c] + 3 * p1[c] - 3 * p2[c] + p3[c]) * s3);
    if (c === 1) out.x = v; else if (c === 2) out.y = v; else out.z = v;
  }
  return out;
}

/* SMOOTHED. The control points are stated at uneven u, and a Catmull-Rom that takes its tangent as
   (p2 - p0)/2 assumes even spacing — so the curvature KINKS at every knot. Measured on the first
   build, the curvature radius jumped from 0.71 to 0.54 and back to 0.64 across three samples either
   side of one control point, which is a corner, not a curve. Laplacian passes on the sampled
   polyline remove the kinks, and — because the tightest bend in this loop is the ventricular apex,
   where a 180-degree turn is made in under a unit — they are also what buys the apex the curvature
   radius the tube needs in order not to fold there. The number of passes is not a free parameter:
   it is the smallest that makes test R pass at every station and every t, and test R is what says
   so. */
const CP = [];
for (let i = 0; i <= NSEG; i++) CP.push(centre(i / NSEG));
for (let pass = 0; pass < 200; pass++) {
  const next = CP.map(v => v.clone());
  for (let i = 1; i < NSEG; i++) {
    next[i].copy(CP[i - 1]).add(CP[i + 1]).multiplyScalar(0.5).lerp(CP[i], 0.55);
  }
  for (let i = 0; i <= NSEG; i++) CP[i].copy(next[i]);
}
const FRAME = K.parallelFrame(CP, new T.Vector3(1, 0, 0));
const iOf = u => clamp01(u) * NSEG;
const uOf = i => Math.max(0, Math.min(NSEG, i)) / NSEG;

/* ------------------------------------------------------------------- calibre

   The chambers BALLOON. That is the other thing happening over these four weeks and it is the reason
   the muscular septum ends up standing between two ventricles without ever being pushed up: "the
   ventricles grow out around it and leave it standing". So the ventricular bumps grow with t and the
   septum does not move. */
function gauss(u, c, w) { const z = (u - c) / w; return Math.exp(-z * z); }
const BASE_R = 0.150;
function balloon(t) { return smooth(clamp01((day(t) - 27) / (50 - 27))); }

/* THE TUBE IS SLENDER AND THE CHAMBERS ARE BALLOONS ON IT. The first version of this model made the
   chambers out of the tube itself, as large Gaussian swells in the calibre — and that is wrong twice
   over. It is wrong ANATOMICALLY, because by week five the ventricles are two sacs lying side by
   side with a wall between them, not one hose of varying thickness. And it is wrong GEOMETRICALLY,
   in a way the winding probe found before any camera did: a swept tube whose radius exceeds the
   curvature radius of its own centreline turns inside out on the inside of the bend. Measured on
   that version, the ratio of curvature radius to tube radius fell to 0.41 at the apex and was below
   1 across a third of the loop; the ventricle's OUTER surface read 0.926 winding, and every one of
   the disagreeing triangles was a fold. Test R now asserts the ratio directly, at every station and
   every t, so the failure cannot come back silently. */
function rOut(u, t) {
  const b = balloon(t);
  let r = BASE_R;
  r += (0.085 + 0.030 * b) * gauss(u, 0.05, 0.075);          // sinus venosus
  r += (0.060 + 0.030 * b) * gauss(u, 0.29, 0.105);          // the atrial part of the tube
  r += (0.055 + 0.035 * b) * gauss(u, 0.62, 0.11);           // the ventricular part
  r += (0.060 + 0.040 * b) * gauss(u, 0.80, 0.08);           // the bulbus part
  r += 0.030 * gauss(u, 0.97, 0.06);                         // aortic sac
  r += (0.030 + 0.020 * b) * gauss(u, 0.468, 0.055);         // the atrioventricular canal
  r -= (0.030 + 0.012 * b) * gauss(u, 0.468, 0.020);         // ...with a waist at its middle
  r -= 0.026 * gauss(u, 0.885, 0.030);                       // ...and so is the conoventricular junction
  return Math.max(0.075, r);
}
function wallAt(u, t) {
  const b = balloon(t);
  return 0.036 + (0.018 + 0.026 * b) * (gauss(u, 0.62, 0.12) + gauss(u, 0.80, 0.10));
}
function rIn(u, t) { return Math.max(0.038, rOut(u, t) - wallAt(u, t)); }

/* THE FOUR BALLOONS. Each is an ellipsoid on the tube, growing on the same clock as everything else.
   `grow` is [size at day 25, how much it adds by day 56]; the atrium is ONE chamber that the atrial
   septum divides, which is the whole point of the atrial half of this topic. */
const CHAMBERS = [
  /* THE ATRIA LIE BEHIND THE OUTFLOW, and putting them at z = -0.26 let the truncus cut straight
     across the front of the common atrium in every anterior view. */
  { key: 'atrium',    c: [ 0.00,  1.22, -0.58], a: [0.88, 0.56, 0.44], grow: [0.60, 0.44] },
  /* THE TWO VENTRICLES MUST TOUCH, or there is no wall to be the interventricular septum. The first
     version put their centres 1.52 apart with semi-axes of 0.47, which left a gap of 0.6 between two
     balloons floating in space — and the septum builder, which measures its own extent by reaching
     out to the lumen, correctly reported that there was no lumen where it was standing and built
     nothing at all. A septum is the wall between two chambers; it cannot be sited anywhere the two
     chambers are not in contact. */
  { key: 'ventricle', c: [ 0.40, -0.50,  0.28], a: [0.52, 0.70, 0.50], grow: [0.56, 0.48] },
  { key: 'bulbus',    c: [-0.40, -0.40,  0.60], a: [0.50, 0.64, 0.48], grow: [0.54, 0.46] },
];
const CHAMBER_WALL = 0.075;
function chamberAxes(ch, t, inner) {
  const k = ch.grow[0] + ch.grow[1] * balloon(t);
  return ch.a.map(v => Math.max(0.03, v * k - (inner ? CHAMBER_WALL : 0)));
}

/* the curvature radius of the centreline at u, from the circumscribed circle of three samples */
function curvatureRadius(u) {
  const i = Math.max(1, Math.min(NSEG - 1, Math.round(iOf(u))));
  const a = CP[i - 1], b = CP[i], c = CP[i + 1];
  const ab = a.distanceTo(b), bc = b.distanceTo(c), ca = c.distanceTo(a);
  const s2 = 0.5 * (ab + bc + ca);
  const ar = Math.sqrt(Math.max(0, s2 * (s2 - ab) * (s2 - bc) * (s2 - ca)));
  if (ar < 1e-12) return Infinity;
  return (ab * bc * ca) / (4 * ar);
}

/* ------------------------------------------------------------- the lumen test

   ONE point-in-lumen test, used to clip EVERY septum to the chamber it is built inside. A septum
   that overshoots its own chamber wall is a defect that shows from exactly one camera, which is the
   kind RENDER-STANDARD says a camera does not fix. The chamber shells are built with a circular
   cross-section (section = 1, flatten = 1) precisely so that this test is exact.                   */
function nearestU(p) {
  let best = 1e9, bi = 0;
  for (let i = 0; i <= NSEG; i += 2) {
    const d = p.distanceToSquared(CP[i]);
    if (d < best) { best = d; bi = i; }
  }
  for (let i = Math.max(0, bi - 3); i <= Math.min(NSEG, bi + 3); i++) {
    const d = p.distanceToSquared(CP[i]);
    if (d < best) { best = d; bi = i; }
  }
  return { i: bi, u: uOf(bi), d: Math.sqrt(best) };
}
function inLumen(p, t, shrink) {
  const k = (shrink == null ? 1 : shrink);
  const n = nearestU(p);
  if (n.d < rIn(n.u, t) * k) return true;
  for (const ch of CHAMBERS) {
    const A = chamberAxes(ch, t, true);
    const dx = (p.x - ch.c[0]) / (A[0] * k), dy = (p.y - ch.c[1]) / (A[1] * k),
          dz = (p.z - ch.c[2]) / (A[2] * k);
    if (dx * dx + dy * dy + dz * dz < 1) return true;
  }
  return false;
}
/* how far a ray from `o` along `d` runs before it leaves the lumen. Bisection, because the lumen
   boundary is a swept surface and there is no closed form once the calibre varies. */
function lumenReach(o, d, t, lo, hi, shrink) {
  const P = new T.Vector3();
  if (!inLumen(P.copy(o).addScaledVector(d, lo), t, shrink)) return lo;
  if (inLumen(P.copy(o).addScaledVector(d, hi), t, shrink)) return hi;
  for (let k = 0; k < 26; k++) {
    const m = 0.5 * (lo + hi);
    if (inLumen(P.copy(o).addScaledVector(d, m), t, shrink)) lo = m; else hi = m;
  }
  return lo;
}

/* ------------------------------------------------------------- the sheet kit

   Every septum in this model is a SHEET: a slab with two faces, a rim, real thickness, and a free
   edge that tapers to nothing (RENDER-STANDARD: "a membrane tapers"). One builder makes all of them,
   planar or twisted, because the normal is a finite difference of the SAME point function that
   placed the vertices — rule 3 — rather than a plane normal that would be wrong the moment a sheet
   stops being planar. The spiral septum is not planar; the atrial septa are; the builder does not
   need to know which.

   EVERY TRIANGLE GOES THROUGH triN. RENDER-STANDARD §2.4b: `tri` corrects nothing, and any triangle
   that is not part of a ring quad — "a cap, a taper, a SHEET, a dome pole" — must go through triN,
   which decides the vertex order from the geometry instead of from a comment.                      */
function sheetSolid(o) {
  const ns = o.ns || 44, nw = o.nw || 34;
  const pt = o.pt;                       // (s, w) -> Vector3
  const thick = o.thick;                 // (s, w) -> number
  const mask = o.mask || (() => true);   // (s, w) -> boolean
  const S = i => i / ns, W = j => (j / nw) * 2 - 1;

  const _a = new T.Vector3(), _b = new T.Vector3(), _c = new T.Vector3(), _d2 = new T.Vector3();
  const _ds = new T.Vector3(), _dw = new T.Vector3();
  const h = 1e-3;
  /* NORMALISE THE TWO DIFFERENCES BEFORE CROSSING THEM. RENDER-STANDARD rule 3 warns that a finite
     difference can collapse and that three's normalize() returns (0,0,0) for a zero vector without
     complaining. The first version of this function guarded the CROSS PRODUCT's squared length
     against 1e-14 — and on a sheet 1.5 across, sampled with h = 1e-4, the two differences are each
     about 3e-4 long, so their cross product is 3e-8 and its SQUARE is 9e-16. The guard fired on
     EVERY quad of both atrial septa and handed back the fallback (0, 0, 1), which is perpendicular
     to the true normal of a sagittal sheet. triN then compared its face normal against a normal at
     right angles to it, the dot product came out at machine zero, and exactly half the triangles
     were ordered backwards: measured, 2703 of 5408 on septum secundum. It never showed in a render —
     DoubleSide, and the shading came from the supplied normals — which is §2.1 arriving again in a
     new place. The differences are now normalised first, so the guard tests direction rather than
     scale and cannot be tripped by the size of the sheet. */
  function nrm(s, w, out) {
    pt(Math.min(1, s + h), w, _a); pt(Math.max(0, s - h), w, _b); _ds.subVectors(_a, _b);
    pt(s, Math.min(1, w + h), _c); pt(s, Math.max(-1, w - h), _d2); _dw.subVectors(_c, _d2);
    if (_ds.lengthSq() < 1e-24 || _dw.lengthSq() < 1e-24) { out.set(0, 0, 1); return out; }
    _ds.normalize(); _dw.normalize();
    out.crossVectors(_ds, _dw);
    if (out.lengthSq() < 1e-8) { out.set(0, 0, 1); return out; }   // ds and dw parallel: degenerate
    return out.normalize();
  }

  const P = [], N = [], M = [];
  const tmp = new T.Vector3();
  for (let i = 0; i <= ns; i++) {
    P.push([]); N.push([]); M.push([]);
    for (let j = 0; j <= nw; j++) {
      const s = S(i), w = W(j);
      P[i].push(pt(s, w, new T.Vector3()));
      N[i].push(nrm(s, w, new T.Vector3()));
      M[i].push(!!mask(s, w));
    }
  }
  const front = (i, j, out) => out.copy(P[i][j]).addScaledVector(N[i][j], 0.5 * thick(S(i), W(j)));
  const back  = (i, j, out) => out.copy(P[i][j]).addScaledVector(N[i][j], -0.5 * thick(S(i), W(j)));

  const E = K.emitter();
  const F00 = new T.Vector3(), F10 = new T.Vector3(), F11 = new T.Vector3(), F01 = new T.Vector3();
  const B00 = new T.Vector3(), B10 = new T.Vector3(), B11 = new T.Vector3(), B01 = new T.Vector3();
  const nn = new T.Vector3(), rim = new T.Vector3();
  let any = false;
  for (let i = 0; i < ns; i++) for (let j = 0; j < nw; j++) {
    if (!(M[i][j] && M[i + 1][j] && M[i + 1][j + 1] && M[i][j + 1])) continue;
    any = true;
    front(i, j, F00); front(i + 1, j, F10); front(i + 1, j + 1, F11); front(i, j + 1, F01);
    back(i, j, B00);  back(i + 1, j, B10);  back(i + 1, j + 1, B11);  back(i, j + 1, B01);
    nn.copy(N[i][j]).add(N[i + 1][j]).add(N[i + 1][j + 1]).add(N[i][j + 1]).normalize();
    E.triN(F00, F10, F11, nn); E.triN(F00, F11, F01, nn);
    nn.negate();
    E.triN(B00, B11, B10, nn); E.triN(B00, B01, B11, nn);
  }
  if (!any) return null;
  /* the RIM. Every boundary edge of the mask — the free edge, the attachment, and the whole way
     round every hole — gets a wall, so a sheet never reads as a sheet of paper seen edge-on. */
  const cellOn = (i, j) => i >= 0 && j >= 0 && i < ns && j < nw &&
    M[i][j] && M[i + 1][j] && M[i + 1][j + 1] && M[i][j + 1];
  const rimQuad = (ia, ja, ib, jb, outDir) => {
    front(ia, ja, F00); back(ia, ja, B00); front(ib, jb, F10); back(ib, jb, B10);
    E.triN(F00, B00, B10, outDir); E.triN(F00, B10, F10, outDir);
  };
  const centroid = new T.Vector3();
  for (let i = 0; i < ns; i++) for (let j = 0; j < nw; j++) {
    if (!cellOn(i, j)) continue;
    // s-direction boundaries
    if (!cellOn(i, j - 1)) { rim.subVectors(P[i][j], P[i][Math.min(nw, j + 1)]).normalize(); rimQuad(i, j, i + 1, j, rim); }
    if (!cellOn(i, j + 1)) { rim.subVectors(P[i][j + 1], P[i][Math.max(0, j)]).normalize(); rimQuad(i + 1, j + 1, i, j + 1, rim); }
    if (!cellOn(i - 1, j)) { rim.subVectors(P[i][j], P[Math.min(ns, i + 1)][j]).normalize(); rimQuad(i, j + 1, i, j, rim); }
    if (!cellOn(i + 1, j)) { rim.subVectors(P[i + 1][j], P[Math.max(0, i)][j]).normalize(); rimQuad(i + 1, j, i + 1, j + 1, rim); }
  }
  void centroid;
  return E.geometry(E.count());
}

/* THE ATRIOVENTRICULAR CANAL IS A CEILING AND A FLOOR, and nothing may cross it.

   Every septum in this model sizes itself by reaching out to the lumen — which is what keeps it
   inside the chamber it belongs to when the chambers balloon. But the lumen is CONTINUOUS from the
   atria through the canal into the ventricles, so a reach that only asks "am I still inside" walks
   straight through the canal: the first build had the atrial septum descending into the ventricles
   and the muscular interventricular septum standing up inside the atrium. Both were visible in the
   render and neither was caught by any probe, because both septa were perfectly inside a lumen —
   just not inside THEIR lumen. The canal is therefore a hard stop for both, and it is placed at the
   canal's own waist rather than at a fraction chosen to look right. */
const AV_U = 0.468;
function avPlane() {
  const i = Math.round(iOf(AV_U));
  return { p: CP[i], n: FRAME.D[i].clone() };
}
function reachToAV(o, d) {
  const A = avPlane();
  const den = d.dot(A.n);
  if (Math.abs(den) < 1e-9) return Infinity;
  const s = new T.Vector3().subVectors(A.p, o).dot(A.n) / den;
  return s > 0 ? s : Infinity;
}

/* ------------------------------------------------------- the atrial septa

   Both atrial septa are sheets in a SAGITTAL plane inside the common atrium, growing from the atrial
   ROOF towards the atrioventricular cushions. Septum primum is thin and in the median plane; septum
   secundum is thick and lies immediately to its RIGHT, which is why the flap it leaves opens to the
   LEFT and shuts when left atrial pressure rises.

   The geometry is stated in a local (s, w) frame: s runs from the roof (s = 0) to the cushions
   (s = 1) and w runs across the chamber, dorsal to ventral. Both extents are found by BISECTING OUT
   TO THE LUMEN, so a septum is exactly as big as the atrium it is inside at that t and cannot
   overshoot it when the atrium balloons.                                                           */
const ATRIAL_U = 0.315;           // the station the atrial septum is built across
const SS_OFFSET = 0.085;          // septum secundum lies this far to the RIGHT of septum primum

function atrialFrame(t, xOff) {
  const i = Math.round(iOf(ATRIAL_U));
  const c = CP[i].clone();
  c.x += xOff;
  /* THE ATRIAL SEPTUM IS SAGITTAL, so both of its in-plane axes must have NO x component and the
     sheet's own normal comes out as +-x. The first version took `down` straight off the centreline,
     which tilts out of the median plane where the loop carries the tube to the left — and a septum
     that is not in the median plane cannot be the wall between a right and a left atrium. */
  const down = new T.Vector3().subVectors(CP[Math.round(iOf(0.455))], CP[Math.round(iOf(0.20))]);
  down.x = 0; down.normalize();
  const across = new T.Vector3().crossVectors(new T.Vector3(1, 0, 0), down).normalize();
  const roofReach = lumenReach(c, down.clone().negate(), t, 0, 3.0);
  const roof = c.clone().addScaledVector(down, -roofReach * 0.96);
  const floorReach = Math.min(lumenReach(c, down, t, 0, 3.0), reachToAV(c, down));
  const floor = c.clone().addScaledVector(down, floorReach);
  return { roof: roof, floor: floor, down: down, across: across, c: c,
           span: roof.distanceTo(floor) };
}

/* half-width of the chamber, in the `across` direction, at fraction s from roof to floor */
function atrialHalf(A, s, t, sgn) {
  const o = new T.Vector3().copy(A.roof).lerp(A.floor, s);
  return lumenReach(o, A.across.clone().multiplyScalar(sgn), t, 0, 2.5, 0.985);
}

/* ---- the SOLVED limbus: the foramen ovale must carry the fetal shunt ----

   STATED CONSTRAINT: the foramen ovale's open area is SHUNT_AREA of the atrial septum's own area.
   That is the job the hole has to do — carry the right-to-left shunt that feeds the fetal systemic
   circulation — and it is the only thing prescribed. The limbus position s2 that delivers exactly
   that area is found by bisection on the real clipped outline, not chosen. The OVERLAP with the
   ostium secundum is then a consequence, and test H measures it. */
const SHUNT_AREA = 0.215;
const SEC_STEPS = 90;

function septalAreaBelow(A, s0, s1, t) {
  // area of the sagittal section of the atrium between fractions s0 and s1, by the trapezium rule
  let a = 0;
  for (let k = 0; k < SEC_STEPS; k++) {
    const sa = s0 + (s1 - s0) * (k / SEC_STEPS), sb = s0 + (s1 - s0) * ((k + 1) / SEC_STEPS);
    const wa = atrialHalf(A, sa, t, 1) + atrialHalf(A, sa, t, -1);
    const wb = atrialHalf(A, sb, t, 1) + atrialHalf(A, sb, t, -1);
    a += 0.5 * (wa + wb) * (sb - sa) * A.span;
  }
  return a;
}

let _limbusCache = null;
function limbus(t) {
  /* the limbus is a FIXED anatomical position, so it is solved once, at the t the septum secundum is
     finished (day 44), and then held. Solving it per-t would make the limbus slide as the atrium
     balloons, which is not what a wall of muscle does. */
  if (_limbusCache != null) return _limbusCache;
  const tf = tOfDay(44);
  const A = atrialFrame(tf, -SS_OFFSET);
  const total = septalAreaBelow(A, 0, 1, tf);
  let lo = 0.05, hi = 0.98;
  for (let k = 0; k < 40; k++) {
    const m = 0.5 * (lo + hi);
    const frac = septalAreaBelow(A, m, 1, tf) / total;
    if (frac > SHUNT_AREA) lo = m; else hi = m;
  }
  _limbusCache = 0.5 * (lo + hi);
  return _limbusCache;
}

/* where the ostium secundum sits in septum primum, and how big it is */
const OS2_S = 0.215;                 // its centre, as a fraction from the roof
function os2Radius(t, opts) {
  const base = 0.150 * g(t, 'ostium2');
  /* A SECUNDUM ASD IS EXCESSIVE RESORPTION, not a different drawing: the same hole, grown until its
     caudal edge passes the limbus and the flap no longer reaches. */
  return opts && opts.asd ? base * 3.60 : base;
}
function overlapAt(t, opts) { return limbus(t) - (OS2_S + os2Radius(t, opts)); }

/* THE TWO SHEET THICKNESS LAWS, NAMED ONCE. The builder uses them and so does test U, which checks
   that the fetal shunt does not run through either sheet. Review round 1, finding 3 was a claim in
   gaps[] disagreeing with the geometry; two copies of a thickness law is how that happens again. */
function primumThick(s) { return 0.030 * (0.25 + 0.75 * Math.pow(Math.max(0, 1 - s), 0.55)); }
function secundumThick(s) { return 0.072 * (0.55 + 0.45 * Math.sqrt(Math.max(0, 1 - s * s))); }

function primumDescent(t) { return 0.06 + 0.94 * g(t, 'primum'); }
function secundumDescent(t) { return limbus(t) * g(t, 'secundum'); }

/* ---------------------------------------------------- the ventricular septum

   The muscular septum grows from the APEX towards the cushions and STOPS SHORT. It is not pushed
   up: the ventricles balloon out on either side of it and leave it standing, which is why its height
   here is a schedule and the chambers' radii are the things that actually change around it.        */
const IVS_TOP = 0.815;               // the muscular septum reaches this far and no further

/* THE SEPTUM IS THE WALL BETWEEN TWO CHAMBERS, AND IT MUST EXIST BEFORE THEY TOUCH.
 *
 * REVIEW ROUND 1, FINDING 1 — THE DEFECT THIS REPLACES. The first version sited the frame at `mid`,
 * the midpoint of the two ventricular balloon CENTRES, and measured its foot and its reach by
 * bisecting out to the lumen from there. But `mid` lies in the CROTCH of the loop, and the crotch is
 * not lumen: measured, inLumen(mid, t) is FALSE at every t up to 0.64 and only becomes true at
 * t = 0.65 (day 45.2), the day the two balloons finally grow into contact. lumenReach returns its
 * `lo` bound the moment the origin is outside, so reach was EXACTLY 0.0000 on days 25 through 44.8
 * and sheetSolid emitted an empty buffer. muscular_ivs had ZERO vertices for the first 65% of the
 * clock and then appeared, at 0.808 of its final height, in one frame. View 5 — SET_STAGE day 40,
 * muscular_ivs its only subject — was a picture of nothing, while its narration taught the septum
 * standing with the interventricular foramen above it. The old test J could not see this, because it
 * measured ivForamen(t), an analytic parameter, and never touched a vertex. Test S below does.
 *
 * WHY A LUMEN PROBE CANNOT BE THE ANSWER HERE. It is not that the probe was aimed badly. Between day
 * 25 and day 45 this model's two ventricular lumens are genuinely NOT adjacent — their inner
 * envelopes are 0.36 apart at day 25 and still 0.17 apart at day 40 — so in the septal plane there is
 * no lumen to bisect out to for most of its span. Anchoring the probe on the tube instead only moves
 * the hole: measured that way the sheet has width at the loop apex, width again up at the
 * atrioventricular canal, and ZERO in between, which is an hourglass, not a septum.
 *
 * WHAT IS MEASURED INSTEAD. The muscular septum is the tissue left standing between the two
 * ventricles — so its extent is where there is ventricle on BOTH sides of it. That is the SHADOW of
 * the ventricular lumen along the septum's own normal: a point belongs to the septum when the line
 * through it in the +-nIVS direction meets ventricular lumen. Nothing is tuned; the outline is
 * whatever the two chambers and the tube between them cast, and it grows because they grow. At day
 * 28 that is a low ridge across the floor of the common ventricle (span 0.31), at day 40 a real wall
 * (0.71), at day 56 the full ventricular septum (0.89) — which is the narration's own sentence, "the
 * ventricles grow out around it and leave it standing", arriving as geometry rather than as a
 * schedule.                                                                                        */

/* the ventricular lumen alone: the two ventricular balloons, plus the tube over the span the SEGS
   table calls ventricle and bulbus. The atrium and the truncus must not cast a shadow here or the
   septum would grow up past the atrioventricular canal. */
const VENT_U0 = 0.465, VENT_U1 = 0.885;
function inVentricularLumen(p, t) {
  for (const idx of [1, 2]) {
    const ch = CHAMBERS[idx];
    const A = chamberAxes(ch, t, true);
    const dx = (p.x - ch.c[0]) / A[0], dy = (p.y - ch.c[1]) / A[1], dz = (p.z - ch.c[2]) / A[2];
    if (dx * dx + dy * dy + dz * dz < 1) return true;
  }
  const n = nearestU(p);
  return n.u >= VENT_U0 && n.u <= VENT_U1 && n.d < rIn(n.u, t);
}
/* is there ventricular lumen somewhere along the septum's own normal through p? The sampling span is
   the distance between the two chamber centres, because a point further out than that is not between
   them; the step is a third of the smallest inner semi-axis either chamber ever has, so the scan
   cannot pass through a chamber without landing in it. */
const _shadowTmp = new T.Vector3();
function inSeptalShadow(p, t, n, halfSpan, steps) {
  for (let k = -steps; k <= steps; k++) {
    if (inVentricularLumen(_shadowTmp.copy(p).addScaledVector(n, halfSpan * k / steps), t)) return true;
  }
  return false;
}
function shadowReach(o, d, t, n, hi, halfSpan, steps) {
  const P = new T.Vector3();
  if (!inSeptalShadow(P.copy(o), t, n, halfSpan, steps)) return 0;
  if (inSeptalShadow(P.copy(o).addScaledVector(d, hi), t, n, halfSpan, steps)) return hi;
  let lo = 0;
  for (let k = 0; k < 22; k++) {
    const m = 0.5 * (lo + hi);
    if (inSeptalShadow(P.copy(o).addScaledVector(d, m), t, n, halfSpan, steps)) lo = m; else hi = m;
  }
  return lo;
}

/* THE PLANE STAYS WHERE THE OLD ONE WAS — equidistant from the two ventricular centres, which is
   what makes it the wall BETWEEN them. Only the way its extent is measured has changed. An
   intermediate version of this fix seeded the frame on the loop apex instead, because that point is
   always lumen; it rendered a septum standing INSIDE the left ventricle, 0.310 from the LV centre
   against 0.556 from the RV's, and view 5 showed a wall in one chamber. Being always-lumen stopped
   mattering the moment the extent stopped being a lumen probe. */
let _ivsCache = {};
function ivsFrame(t) {
  const ck = t.toFixed(5);
  if (_ivsCache[ck]) return _ivsCache[ck];
  const LV = CHAMBERS[1].c, RV = CHAMBERS[2].c;
  const seed = new T.Vector3((LV[0] + RV[0]) / 2, (LV[1] + RV[1]) / 2, (LV[2] + RV[2]) / 2);
  const target = CP[Math.round(iOf(0.470))].clone();
  const up = new T.Vector3().subVectors(target, seed).normalize();
  const nIVS = new T.Vector3(LV[0] - RV[0], LV[1] - RV[1], LV[2] - RV[2]);
  const halfSpan = nIVS.length();
  nIVS.addScaledVector(up, -nIVS.dot(up)).normalize();
  const across = new T.Vector3().crossVectors(nIVS, up).normalize();  // in-plane, perpendicular to up
  const down = up.clone().negate();
  /* the step is a third of the smallest inner semi-axis either ventricle ever has */
  const aMin = Math.min.apply(null, [1, 2].map(i => Math.min.apply(null, chamberAxes(CHAMBERS[i], 0, true))));
  const steps = Math.max(8, Math.ceil(halfSpan / (aMin / 3)));
  const apex = seed.clone().addScaledVector(down, shadowReach(seed, down, t, nIVS, 1.5, halfSpan, steps) * 0.96);
  const reach = Math.min(shadowReach(apex, up, t, nIVS, 3.0, halfSpan, steps), reachToAV(apex, up));
  const V = { apex: apex, up: up, across: across, nIVS: nIVS, reach: reach,
              halfSpan: halfSpan, steps: steps, seed: seed };
  _ivsCache[ck] = V;
  return V;
}
function ivsHalf(V, s, t, sgn) {
  const o = new T.Vector3().copy(V.apex).addScaledVector(V.up, s * V.reach);
  return shadowReach(o, V.across.clone().multiplyScalar(sgn), t, V.nIVS, 2.5, V.halfSpan, V.steps);
}
function muscularHeight(t) { return IVS_TOP * g(t, 'muscular'); }
/* THE MUSCULAR SEPTUM STOPS SHORT AND THE GAP ABOVE IT IS THE INTERVENTRICULAR FORAMEN. It is not
   that the muscular part is still growing at day 44 — it is that its free edge never reaches the
   cushions at all, which is why the foramen has to be closed by something else, from three
   directions, in week seven. */
function ivForamen(t, opts) {
  const mm = (opts && opts.vsd) ? 0 : g(t, 'membranous');
  return (1 - muscularHeight(t)) * (1 - mm);
}

/* --------------------------------------------------------- the outflow spiral

   THE SOLVE. See the header. The septum's orientation is prescribed in WORLD directions at the two
   ends of the outflow tract and the twist is whatever carries one to the other through a tract that
   is itself curving. Nothing here is a rate constant.                                              */
/* WHERE THE SEPTUM'S FOOT IS, and why it is not further back. The conotruncal ridges live in the
   CONUS and the TRUNCUS, and the conus is the part of the bulbus that has turned to run cranially.
   The first version put the foot at u = 0.76, which in this loop is still the transverse limb where
   the tube runs from the apex across to the bulbus — and a septum there cannot separate left from
   right, because the tract's own axis lies almost along the left-right direction. Measured, the
   interventricular septum's normal was 53 degrees away from the plane the septum is free to turn
   in, so even the conal boundary condition could only be met to a direction cosine of 0.60. Moving
   the foot to 0.855, just proximal to the conoventricular waist at 0.885, puts it where the tract
   runs cranially and the septum has the freedom the anatomy gives it. */
const UC = 0.855;                    // the conus — the proximal end of the outflow septum
const U_ART = 1.0;

function outflowTwist() {
  const ic = Math.round(iOf(UC)), it = Math.round(iOf(U_ART));
  const V = ivsFrame(1);
  /* PRESCRIBED, in world directions, and both of them are the examined relation rather than a
     convenience. At the semilunar valves the AORTIC valve lies POSTERIOR AND TO THE RIGHT of the
     pulmonary valve — that pair of words is what a student is marked on — so the aorta-ward
     direction there is -z - x, normalised. At the conal end the aortic half must lie over the LEFT
     ventricle, so it is the interventricular septum's own normal. The first version of this solve
     prescribed the arterial end as DORSAL alone; that is only half the relation, it cost the twist
     a third of its size, and it made the no-twist variant put the aorta over neither ventricle
     rather than over the right one — i.e. it produced a transposition that could not be measured. */
  const nArt = new T.Vector3(-1, 0, -1).normalize();
  nArt.addScaledVector(FRAME.D[it], -nArt.dot(FRAME.D[it])).normalize();
  const nCon = V.nIVS.clone();
  nCon.addScaledVector(FRAME.D[ic], -nCon.dot(FRAME.D[ic])).normalize();
  const thAt = (n, i) => Math.atan2(n.dot(FRAME.B[i]), n.dot(FRAME.N[i]));
  const thArt = thAt(nArt, it), thCon = thAt(nCon, ic);
  /* THE BRANCH IS THE MINIMAL ONE, and that is a stated constraint rather than a preference: a
     septum that rotated by more than a full turn would have to sweep through one of the two channels
     it is dividing. Of the two candidates left, the smaller is taken. The SENSE is not chosen. */
  let d = thCon - thArt;
  while (d > Math.PI) d -= 2 * Math.PI;
  while (d < -Math.PI) d += 2 * Math.PI;
  const worldAngle = Math.acos(Math.max(-1, Math.min(1, nArt.dot(nCon))));
  return { thArt: thArt, thCon: thCon, delta: d, ic: ic, it: it,
           localDeg: d * 180 / Math.PI, worldDeg: worldAngle * 180 / Math.PI,
           nArt: nArt, nCon: nCon };
}
let _twist = null;
function twist() { return _twist || (_twist = outflowTwist()); }

/* the septum's normal (pointing into the AORTIC half) at station i */
function septumNormal(i, opts, out) {
  const W = twist();
  const f = clamp01((uOf(i) - UC) / (U_ART - UC));
  /* TRANSPOSITION: drop the conal boundary condition and the septum keeps its arterial orientation
     the whole way down. One parameter. */
  const th = (opts && opts.transposition) ? W.thArt : (W.thArt + W.delta * smooth(1 - f));
  const ii = Math.max(0, Math.min(NSEG, Math.round(i)));
  return out.set(0, 0, 0)
    .addScaledVector(FRAME.N[ii], Math.cos(th))
    .addScaledVector(FRAME.B[ii], Math.sin(th)).normalize();
}

/* TETRALOGY OF FALLOT is the same septum DISPLACED, not a different one: the conal septum is set
   too far ventrally, so it misses the muscular septum below it (the VSD), it narrows the pulmonary
   channel behind it (infundibular stenosis) and it leaves the aortic channel sitting across the top
   of the defect (the overriding aorta). Three of the tetrad are geometry and are measured here. The
   fourth, right ventricular hypertrophy, is a consequence of the other three over months of work
   against a stenosis, and it is NOT drawn: it is not a shape this model can honestly claim. */
const FALLOT_SHIFT = 0.62;           // as a fraction of the outflow radius
function septumOffset(i, opts) {
  if (!opts || !opts.fallot) return 0;
  const f = clamp01((uOf(i) - UC) / (U_ART - UC));
  return FALLOT_SHIFT * (1 - smooth(f));   // displaced at the conal end, normal at the arterial end
}

const AVSD_ARREST = 0.30;      // how far the cushions get before they stop — the hole is what is left
function ridgeHeight(t, opts) {
  if (opts && opts.truncus_persistent) return 0.30;   // the ridges form and never fuse
  return g(t, 'ridges');
}

/* the centreline of each channel: the centroid of a half-disc is 4r/3pi off the axis */
function channelCentre(u, t, sign, opts, out) {
  const i = iOf(u);
  const ii = Math.max(0, Math.min(NSEG, Math.round(i)));
  const n = septumNormal(i, opts, new T.Vector3());
  const r = rIn(u, t);
  const off = septumOffset(i, opts) * r;
  return out.copy(CP[ii]).addScaledVector(n, sign * (4 * r / (3 * Math.PI)) + off);
}

/* --------------------------------------------------------------- ACCEPTANCE

   Stated as measurements so a review can re-check the arithmetic rather than the conclusion.
   EVERY SPATIAL TEST CARRIES A MAGNITUDE FLOOR expressed as a fraction of the extent the claim
   should be legible against, and EVERY TEST HAS A NEGATIVE CASE — see negatives().               */
const FLOORS = {
  OVERLAP: 0.10,    // the flap must overlap the limbus by this much of the atrial span
  SIDE:    0.35,    // a channel sits this far to its own side of the IVS, as a fraction of extent
  DORSAL:  0.24,    // the aorta lies this far dorsal of, and this far right of, the pulmonary trunk
  GAP:     0.30,    // an unfused pair is this far apart, as a fraction of their mean size
  FORAMEN: 0.04,    // the interventricular foramen is this big before the membranous part closes it
  SWING:   0.60,    // dropping the twist moves the aortic half this far, in units of its own offset
  /* ADDED IN REVIEW ROUND 1. Both of these are floors on EMITTED MESH, not on a parameter. */
  SEPTUM:  0.30,    // the muscular septum's own emitted height at day 40, as a fraction of its reach
  OPENING: 0.06,    // each atrial opening, as a fraction of the atrial span, inside the shared window
  WINDOW:  1.00,    // days during which BOTH atrial openings are open and both clear their floor
  CLEAR:   0.004,   // the shunt arrow keeps at least this much clear of both atrial sheets
};

const ACCEPTANCE = {
  axes: '+x = embryo LEFT, -x = RIGHT, +y = CRANIAL, +z = VENTRAL',
  t_means: 'day 25 at t = 0, day 56 at t = 1; day(t) = 25 + 31t',
  solved: ['the outflow twist, from two prescribed world directions and the conus\'s own curvature',
           'the limbus of the fossa ovalis, from the area the fetal shunt has to carry'],
  tests: [
    { id: 'A', says: 'four septa, four windows, in the order the narration states',
      must: 'cushions fuse before the atrial septum is complete, the muscular septum is standing ' +
            'before the outflow ridges appear, and the membranous part closes last' },
    { id: 'B', says: 'at t = 0 there is ONE lumen — not one of the four septa exists',
      must: 'every septum growth fraction is 0 at day 25' },
    { id: 'C', says: 'the cushions grow towards each other and MEET',
      must: 'MEASURED ON EMITTED VERTICES: the surface gap between the two cushion masses is at ' +
            'least 30% of their mean thickness at day 28, and has closed (gap <= 0, i.e. the two ' +
            'interpenetrate and read as one mass) by day 35. This row used to read the schedule\'s ' +
            'own max(0, 1-2h), which said "met" at day 35 while the buffer had the masses 0.0966 ' +
            'apart and moving apart (review round 2, R2-1 and R2-7).' },
    { id: 'D', says: 'the ostium secundum is open BEFORE the ostium primum shuts — the crossing is ' +
            'never interrupted',
      must: 'the day the ostium secundum first opens is earlier than the day the ostium primum closes' },
    { id: 'E', says: 'the twist is SOLVED, not scheduled',
      must: 'the septum normal at each end equals the prescribed world direction to within 1e-6, ' +
            'and the local twist is the minimal branch' },
    { id: 'F', says: 'the aortic half arrives over the LEFT ventricle, the pulmonary half over the right',
      must: 'the direction cosine between the septum normal at its conal foot and the ' +
            'interventricular septum normal is at least 0.35. TRUE BY CONSTRUCTION in the normal ' +
            'build — the conal boundary condition IS this statement — and stated that way rather ' +
            'than dressed up. Tests N and Q are where the claim has teeth.' },
    { id: 'G', says: 'at the arterial end the aortic channel lies POSTERIOR AND TO THE RIGHT of the ' +
            'pulmonary channel — the pair of words the valves are examined on',
      must: 'its separation along -z and along -x are each at least 24% of the outflow calibre' },
    { id: 'Q', says: 'the two channels ROTATE about each other between the ventricles and the valves ' +
            '— that rotation is the crossing, and nothing prescribes it',
      must: 'the angle between the aorta-minus-pulmonary vector at the conal end and at the ' +
            'arterial end is at least 60 degrees, and at least twice the rotation the curving ' +
            'tract produces on its own when the twist is dropped' },
    { id: 'H', says: 'the two atrial sheets OVERLAP, so the foramen ovale is a one-way valve',
      must: 'the limbus lies caudal to the whole ostium secundum by at least 10% of the atrial span' },
    { id: 'I', says: 'the foramen ovale carries the shunt it is solved for',
      must: 'the open area below the limbus is 21.5% of the atrial septal area, to within 1%' },
    { id: 'J', says: 'the muscular septum STOPS SHORT, leaving the interventricular foramen',
      must: 'the gap above the muscular septum is at least 4% of the ventricular span at day 40 and ' +
            'at day 44, and is still that big at day 56 when the membranous part never forms' },
    { id: 'K', says: 'the membranous part closes that foramen, and it closes it LAST',
      must: 'the membranous fraction is 0 at day 44 and 1 at day 50, and the foramen is shut by day 50' },
    { id: 'L', says: 'AVSD is the cushions not fusing — one mechanism, arrested',
      must: 'MEASURED ON EMITTED VERTICES, and with a POLARITY CLAUSE: with the cushions arrested ' +
            'the surface gap at day 56 is at least 30% of their mean thickness, AND it exceeds the ' +
            'healthy heart\'s own gap at day 56 by at least that much. The polarity clause is the ' +
            'whole point of the row and it was missing: the old law parked the arrested cushions ' +
            '0.0386 apart against health\'s 0.1020, so the lesion defined by cushions that FAIL to ' +
            'fuse was drawn two and a half times MORE fused than health, and the analytic row ' +
            'reported a 0.4 gap throughout (review round 2, R2-1).' },
    { id: 'M', says: 'a secundum ASD is the overlap gone',
      must: 'with excessive resorption the overlap is negative at day 56' },
    { id: 'N', says: 'transposition is the twist dropped, and it FLIPS the connections',
      must: 'with the conal boundary condition dropped the aortic half sits on the RV side by a ' +
            'direction cosine of at least 0.35, having moved at least 0.60 of its own offset' },
    { id: 'O', says: 'persistent truncus arteriosus is the ridges never fusing',
      must: 'the two ridges leave a gap of at least 30% of the calibre at day 56' },
    { id: 'R', says: 'the swept tube never folds over itself',
      must: 'the curvature radius of the centreline is at least 1.05 times the tube\'s outer ' +
            'radius at every station and every t — a tube fatter than its own bend turns inside ' +
            'out on the inside of the curve, and reads as a winding failure on the outer surface' },
    { id: 'S', says: 'the muscular septum is a MESH on every day its own schedule says it is growing ' +
            '— not a parameter that says so while the buffer is empty',
      must: 'muscular_ivs emits vertices at days 29, 32, 36, 40 and 44, its emitted height rises ' +
            'strictly across those days, and at day 40 that height is at least 30% of its reach. ' +
            'THIS TEST EXISTS BECAUSE TEST J DID NOT: J measures ivForamen(t), an analytic ' +
            'parameter, and reported the foramen open at days 40 and 44 while the septum bounding ' +
            'it had NO VERTICES on either day (review round 1, finding 1). S builds the real ' +
            'builder and counts what came out.' },
    { id: 'T', says: 'there is a real stage at which a student can see BOTH atrial openings — the ' +
            'ostium primum below the free edge and the ostium secundum above it',
      must: 'measured on emitted vertices, there is a window of at least 1.0 day in which the gap ' +
            'between septum primum\'s free edge and the cushions AND the ostium secundum\'s own ' +
            'radius are each at least 6% of the atrial span. Test D asserts only that two DATES ' +
            'are in order, which was true while the window was under a day wide and both openings ' +
            'were invisible inside it (review round 1, finding 4).' },
    { id: 'U', says: 'the fetal right-to-left shunt runs where blood can run: under the limbus, up ' +
            'the slit between the two sheets, and out through the OSTIUM SECUNDUM',
      must: 'no emitted shunt vertex lies inside septum primum or septum secundum (clearance at ' +
            'least 0.004 from both), and the arrow does cross septum primum\'s own plane, inside ' +
            'the ostium secundum\'s aperture. The first version bowed straight across at one ' +
            'level and passed 0.0090 INSIDE septum primum at a level the narration says is solid ' +
            '(review round 1, finding 3), while gaps[] said it lifted the flap.' },
    { id: 'V', says: 'the membranous septum really does touch the two tissues this model builds as ' +
            'continuous with it — the muscular crest below and the cushions above',
      must: 'nearest emitted vertex distance membranous<->muscular and membranous<->cushions are ' +
            'each under 0.02. THE THIRD CONTRIBUTION IS NOT BUILT: the conotruncal ridges end ' +
            '0.68 away, because this model never wedges the outflow tract between the ' +
            'atrioventricular canal and the ventricles, so the conus stays on the embryonic loop ' +
            '0.84 to the right of the interventricular foramen\'s rim. That distance is reported ' +
            'as conalToMembranous and declared in the scene\'s gaps[] (review round 1, finding 2); ' +
            'it is NOT asserted closed, because closing it would mean drawing tissue through ' +
            'myocardium this model shows as solid.' },
    { id: 'W', says: 'the cushions APPROACH — they start as two separate swellings, they close ' +
            'monotonically, and they never come apart again',
      must: 'measured on emitted vertices at eleven days from 26.5 to 56: exactly two cushion ' +
            'masses exist on every one of them, and the normalised surface gap is non-increasing ' +
            'across the whole series. THIS ROW EXISTS BECAUSE C AND L DID NOT CATCH THE TRAJECTORY: ' +
            'both asserted single days, and a law that met at day 31 and came apart again by day 35 ' +
            'satisfied a day-28 gap and a day-35 closure while teaching the opposite in between. ' +
            'The gap is normalised because the canal itself widens ~8% over the period, so raw ' +
            'centre separation rises after fusion while the fused state does not change.' },
    { id: 'P', says: 'tetralogy is the SAME septum displaced ventrally, and three of the four follow',
      must: 'the displaced septum misses the muscular septum (a VSD), the pulmonary channel is ' +
            'narrower than the aortic by at least 20%, and the aortic channel straddles the IVS plane' },
  ],
};

function cushionGap(t, opts) {
  const h = (opts && opts.avsd) ? Math.min(g(t, 'cushions'), AVSD_ARREST) : g(t, 'cushions');
  return Math.max(0, 1 - 2 * h);          // 1 = wide apart, 0 = met in the middle
}

function measure() {
  const m = {};
  const W = twist();

  /* A, B — the order, and the empty start */
  m.dayCushionsFuse = SCHED.cushions[1];
  m.dayPrimumDone = SCHED.primum[1];
  m.dayMuscularStart = SCHED.muscular[0];
  m.dayRidgesStart = SCHED.ridges[0];
  m.dayMembranousDone = SCHED.membranous[1];
  m.orderOK = (SCHED.cushions[1] <= SCHED.primum[1] + 1) &&
              (SCHED.muscular[0] < SCHED.ridges[0]) &&
              (SCHED.membranous[1] >= Math.max(SCHED.secundum[1], SCHED.ridges[1]));
  m.atZero = Math.max(g(0, 'cushions'), g(0, 'primum'), g(0, 'ostium2'), g(0, 'secundum'),
                      g(0, 'muscular'), g(0, 'membranous'), g(0, 'ridges'));

  /* C, L, W — THE CUSHIONS, ON EMITTED VERTICES.
     REVIEW ROUND 2, R2-7. cushionGap() below is the SCHEDULE'S OWN ARITHMETIC, max(0, 1 - 2h). It
     reported 0 at day 35 ("met") and 0.4 under the avsd clamp ("a wide hole") while the emitted
     buffer said the two masses were 0.0966 apart and MOVING APART at day 35, and 0.0386 apart under
     the clamp — that is, CLOSER than the healthy heart. Both rows passed for two review rounds on a
     number that never touched the geometry. The analytic values are kept below as cushionGapSched*
     for comparison and are read by no predicate. */
  {
    const measureCushions = (tt, opts) => {
      const gr = new T.Group();
      buildCushions(gr, tt, opts || {});
      gr.updateMatrixWorld(true);
      const masses = [];
      gr.traverse(o => {
        if (!o.isMesh || !o.userData || o.userData.key !== 'av_cushions') return;
        if (o.userData.outline) return;
        const pos = o.geometry.attributes.position;
        if (!pos || !pos.count) return;
        const pts = [], cen = new T.Vector3(), v = new T.Vector3();
        for (let i = 0; i < pos.count; i++) {
          v.set(pos.getX(i), pos.getY(i), pos.getZ(i)).applyMatrix4(o.matrixWorld);
          pts.push(v.clone()); cen.add(v);
        }
        cen.multiplyScalar(1 / pos.count);
        masses.push({ pts: pts, cen: cen });
      });
      /* TWO MASSES OR THE MEASUREMENT IS MEANINGLESS. Returning null here is what makes the
         degenerate cases (nothing emitted, one mesh, coincident centres) fail test W rather than
         silently score zero — the shape of round 1's finding 1. */
      if (masses.length !== 2) return null;
      const axis = new T.Vector3().subVectors(masses[1].cen, masses[0].cen);
      const centreSep = axis.length();
      if (centreSep < 1e-9) return null;
      axis.normalize();
      const origin = masses[0].cen.clone().add(masses[1].cen).multiplyScalar(0.5);
      const span = mass => {
        let lo = Infinity, hi = -Infinity;
        for (let i = 0; i < mass.pts.length; i++) {
          const a = mass.pts[i].clone().sub(origin).dot(axis);
          if (a < lo) lo = a; if (a > hi) hi = a;
        }
        return [lo, hi];
      };
      let A = span(masses[0]), B = span(masses[1]);
      if (A[0] > B[0]) { const sw = A; A = B; B = sw; }
      const gap = B[0] - A[1];                                  // >0 apart, <0 interpenetrating
      const meanExt = 0.5 * ((A[1] - A[0]) + (B[1] - B[0]));
      return { centreSep: centreSep, gap: gap, meanExt: meanExt,
               gapFrac: meanExt > 1e-9 ? gap / meanExt : 0, unionExtent: B[1] - A[0] };
    };
    const DAYS = [26.5, 28, 29.7, 31.2, 32.8, 34, 35, 40, 44, 50, 56];
    const rows = [], fracs = [];
    for (const d of DAYS) {
      const r = measureCushions(tOfDay(d), {});
      rows.push(r ? [d, +r.centreSep.toFixed(4), +r.gap.toFixed(4), +r.gapFrac.toFixed(4),
                     +r.unionExtent.toFixed(4)] : [d, null, null, null, null]);
      fracs.push(r ? r.gapFrac : NaN);
    }
    m.cushionRows = rows;
    m.cushionMeshGapD28 = fracs[1];
    m.cushionMeshGapD35 = fracs[6];
    /* MONOTONE ON THE NORMALISED GAP, not on raw centre separation. The raw separation rises 4% after
       day 35 (0.0966 -> 0.1020) because the CANAL widens while the masses stay fused, and the
       normalised gap is exactly constant across those days, which is the claim being made. */
    m.cushionMeshMonotone = fracs.every((x, i) => i === 0 || (x === x && x <= fracs[i - 1] + 1e-6));
    m.cushionMeshTwoMasses = DAYS.every(d => measureCushions(tOfDay(d), {}) !== null);
    const av56 = measureCushions(1, { avsd: true }), nm56 = measureCushions(1, {});
    m.cushionMeshGapAVSD = av56 ? av56.gapFrac : null;
    m.cushionMeshGapNormal56 = nm56 ? nm56.gapFrac : null;
    m.cushionAVSDPolarity = (av56 && nm56) ? (av56.gapFrac - nm56.gapFrac) : null;
    /* the schedule's own numbers, kept visible and asserted by nothing */
    m.cushionGapSchedD28 = cushionGap(tOfDay(28), {});
    m.cushionGapSchedD35 = cushionGap(tOfDay(35), {});
    m.cushionGapSchedAVSD = cushionGap(1, { avsd: true });
  }

  /* D — the crossing is never interrupted */
  let dOpen = null, dClose = null;
  for (let d = 25; d <= 56; d += 0.02) {
    const tt = tOfDay(d);
    if (dOpen == null && os2Radius(tt, {}) > 1e-4) dOpen = d;
    if (dClose == null && primumDescent(tt) >= 0.999) dClose = d;
  }
  m.dayOstium2Opens = dOpen;
  m.dayOstium1Closes = dClose;

  /* E — the twist */
  const nA = new T.Vector3(), nC = new T.Vector3();
  septumNormal(W.it, {}, nA); septumNormal(W.ic, {}, nC);
  m.twistLocalDeg = W.localDeg;
  m.twistWorldDeg = W.worldDeg;
  m.twistEndErrArt = 1 - nA.dot(W.nArt);
  m.twistEndErrCon = 1 - nC.dot(W.nCon);
  m.twistMinimalBranch = Math.abs(W.delta) <= Math.PI + 1e-9;

  /* F, G, N, P — the channels */
  const V = ivsFrame(1);
  function channelSide(opts) {
    const a = channelCentre(UC + 0.006, 1, +1, opts, new T.Vector3());
    const p = channelCentre(UC + 0.006, 1, -1, opts, new T.Vector3());
    const ext = Math.abs(a.clone().sub(p).dot(V.nIVS)) + 2 * rIn(UC, 1);
    return { aorta: a.clone().sub(V.apex).dot(V.nIVS) / ext,
             pulm: p.clone().sub(V.apex).dot(V.nIVS) / ext, ext: ext, a: a, p: p };
  }
  void channelSide;
  /* WHICH VENTRICLE EACH HALF SITS OVER, as the direction cosine between the septum's normal at its
     conal foot and the interventricular septum's own normal. +1 means the aortic half is squarely
     over the left ventricle, -1 squarely over the right.

     TEST F IS TRUE BY CONSTRUCTION IN THE NORMAL BUILD and it is stated that way rather than
     dressed up: the conal boundary condition IS "the aortic half lies over the LV", so a normal
     build cannot fail it. What can fail is test N, the same measurement on the variant where that
     boundary condition is dropped, and test Q, the crossing angle, which no boundary condition
     prescribes. Those two are where this claim has teeth. */
  const nCon = new T.Vector3();
  septumNormal(iOf(UC), {}, nCon);
  m.aortaSide = nCon.dot(V.nIVS);
  m.pulmSide = -m.aortaSide;
  septumNormal(iOf(UC), { transposition: true }, nCon);
  m.tgaAortaSide = nCon.dot(V.nIVS);

  /* Q — THE CROSSING. The vector from the pulmonary channel to the aortic one, at the conal end and
     at the arterial end. The angle between those two world vectors is how far the pair has rotated
     about the outflow between the ventricles and the valves, and it is the whole content of "the
     vessels cross". Nothing prescribes it: it is the two boundary directions and the conus's own
     curvature, arriving as an angle. */
  function sepVec(u, opts2) {
    const a2 = channelCentre(u, 1, +1, opts2, new T.Vector3());
    const p2 = channelCentre(u, 1, -1, opts2, new T.Vector3());
    return a2.sub(p2).normalize();
  }
  const sCon = sepVec(UC + 0.004, {}), sArt = sepVec(0.995, {});
  m.crossingDeg = Math.acos(Math.max(-1, Math.min(1, sCon.dot(sArt)))) * 180 / Math.PI;
  const tCon = sepVec(UC + 0.004, { transposition: true }), tArt = sepVec(0.995, { transposition: true });
  m.crossingDegTGA = Math.acos(Math.max(-1, Math.min(1, tCon.dot(tArt)))) * 180 / Math.PI;

  const aArt = channelCentre(0.995, 1, +1, {}, new T.Vector3());
  const pArt = channelCentre(0.995, 1, -1, {}, new T.Vector3());
  const cal = 2 * rIn(0.995, 1);
  m.aortaDorsalOfPulm = (pArt.z - aArt.z) / cal;
  m.aortaRightOfPulm = (pArt.x - aArt.x) / cal;

  /* H, I — the atrial flap valve */
  m.limbus = limbus(1);
  m.overlap = overlapAt(1, {});
  m.overlapASD = overlapAt(1, { asd: true });
  {
    const tf = tOfDay(44), A = atrialFrame(tf, -SS_OFFSET);
    m.foramenAreaFrac = septalAreaBelow(A, m.limbus, 1, tf) / septalAreaBelow(A, 0, 1, tf);
  }

  /* J, K — the interventricular foramen */
  m.ivForamenD40 = ivForamen(tOfDay(40), {});
  m.ivForamenD44 = ivForamen(tOfDay(44), {});
  m.ivForamenD50 = ivForamen(tOfDay(50), {});
  m.ivForamenVSD = ivForamen(1, { vsd: true });
  m.membranousD44 = g(tOfDay(44), 'membranous');
  m.membranousD50 = g(tOfDay(50), 'membranous');

  /* O — persistent truncus */
  m.ridgeGapTruncus = 1 - 2 * ridgeHeight(1, { truncus_persistent: true });
  m.ridgeGapNormal = Math.max(0, 1 - 2 * ridgeHeight(1, {}));

  /* P — tetralogy */
  {
    const i = Math.round(iOf(UC + 0.006));
    const r = rIn(UC + 0.006, 1);
    const off = septumOffset(i, { fallot: true }) * r;
    // the displaced septum's foot misses the muscular septum by this much, in units of calibre
    m.fallotMiss = off / r;
    // the pulmonary half is narrowed by the same displacement
    m.fallotPulmFrac = (r - off) / (r + off);
    const aF = channelCentre(UC + 0.006, 1, +1, { fallot: true }, new T.Vector3());
    m.fallotOverride = Math.abs(aF.clone().sub(CP[i]).dot(V.nIVS)) / r;
  }
  /* S — THE SEPTUM IS A MESH, NOT A PARAMETER. Built with the real builder and counted. */
  {
    const days = [29, 32, 36, 40, 44];
    const hs = [], ns = [];
    for (const d of days) {
      const tt = tOfDay(d);
      const gr = new T.Group();
      buildVentricularSeptum(gr, tt, {});
      const V = ivsFrame(tt);
      let n = 0, hi = -Infinity;
      gr.traverse(o => {
        if (!o.isMesh || !o.userData || o.userData.key !== 'muscular_ivs') return;
        const pos = o.geometry.attributes.position;
        n += pos.count;
        const v = new T.Vector3();
        for (let i = 0; i < pos.count; i++) {
          v.set(pos.getX(i), pos.getY(i), pos.getZ(i)).sub(V.apex);
          const h = v.dot(V.up) / V.reach;
          if (h > hi) hi = h;
        }
      });
      ns.push(n); hs.push(n ? hi : 0);
    }
    m.ivsVertexCounts = ns;
    m.ivsHeights = hs;
    m.ivsHeightD40 = hs[3];
    m.ivsEmptyDays = ns.filter(x => x <= 0).length;
    m.ivsHeightRises = hs.every((h, i) => i === 0 || h > hs[i - 1] + 1e-6);
  }

  /* T — BOTH ATRIAL OPENINGS, ON THE MESH, AT THE SAME TIME. */
  {
    let open = 0, bestDay = null, bestMin = -1;
    const rows = [];
    for (let d = 30; d <= 38.0001; d += 1.0) {
      const tt = tOfDay(d);
      const A = atrialFrame(tt, 0);
      const span = A.roof.distanceTo(A.floor);
      const down = new T.Vector3().subVectors(A.floor, A.roof).normalize();
      const gr = new T.Group();
      buildCushions(gr, tt, {});
      buildAtrialSepta(gr, tt, {});
      let edge = -Infinity, cush = Infinity, sawPrimum = false;
      const v = new T.Vector3();
      gr.traverse(o => {
        if (!o.isMesh || !o.userData) return;
        const k = o.userData.key;
        if (k !== 'septum_primum' && k !== 'av_cushions') return;
        const pos = o.geometry.attributes.position;
        if (k === 'septum_primum' && pos.count) sawPrimum = true;
        for (let i = 0; i < pos.count; i++) {
          v.set(pos.getX(i), pos.getY(i), pos.getZ(i)).sub(A.roof);
          const sv = v.dot(down) / span;
          if (k === 'septum_primum') { if (sv > edge) edge = sv; }
          else if (sv < cush) cush = sv;
        }
      });
      const gap = sawPrimum && isFinite(cush) ? (cush - edge) : 0;
      const hole = os2Radius(tt, {});
      rows.push([d, gap, hole]);
      const both = Math.min(gap, hole);
      if (gap >= FLOORS.OPENING && hole >= FLOORS.OPENING) open += 1.0;
      if (both > bestMin) { bestMin = both; bestDay = d; }
    }
    m.bothOpeningsDays = open;
    m.bothOpeningsBestDay = bestDay;
    m.bothOpeningsBestMin = bestMin;
    m.atrialOpeningRows = rows;
  }

  /* U — THE SHUNT GOES THROUGH THE HOLE, NOT THROUGH THE SHEET. Emitted vertices, measured against
     the two sheets' own planes and thickness laws. */
  {
    const tt = 1;
    const A = atrialFrame(tt, 0), A2 = atrialFrame(tt, -SS_OFFSET);
    const span = A.roof.distanceTo(A.floor);
    const down = new T.Vector3().subVectors(A.floor, A.roof).normalize();
    const pD = primumDescent(tt), sD = secundumDescent(tt), os2r = os2Radius(tt, {});
    const gr = new T.Group();
    buildShunt(gr, tt, {});
    let bad = 0, through = 0, clear = Infinity, n = 0;
    const v = new T.Vector3();
    gr.traverse(o => {
      if (!o.isMesh || !o.userData || o.userData.key !== 'shunt') return;
      const pos = o.geometry.attributes.position;
      for (let i = 0; i < pos.count; i++) {
        n++;
        v.set(pos.getX(i), pos.getY(i), pos.getZ(i));
        const rel = new T.Vector3().subVectors(v, A.roof);
        const frac = rel.dot(down) / span, w = rel.dot(A.across);
        if (frac >= 0 && frac <= sD) {
          const d = Math.abs(v.x - A2.roof.x) - 0.5 * secundumThick(frac / sD);
          if (d < 0) bad++;
          if (d < clear) clear = d;
        }
        if (frac >= 0 && frac <= pD) {
          const d = Math.abs(v.x - A.roof.x) - 0.5 * primumThick(frac / pD);
          /* inside the ostium secundum's own aperture the sheet is NOT there, so being in the slab
             is the arrow coming through the hole — which is the thing being proved. */
          const hw = atrialHalf(A, frac, tt, w >= 0 ? 1 : -1);
          const wn = hw > 1e-6 ? w / hw : 9;
          const inHole = os2r > 1e-4 &&
            (wn / 0.62) * (wn / 0.62) + ((frac - OS2_S) / os2r) * ((frac - OS2_S) / os2r) < 1;
          if (d < 0 && !inHole) bad++;
          if (d < 0 && inHole) through++;
          if (!inHole && d < clear) clear = d;
        }
      }
    });
    m.shuntVertices = n;
    m.shuntInsideSeptum = bad;
    m.shuntThroughOstium = through;
    m.shuntClearance = isFinite(clear) ? clear : 0;
  }

  /* V — THE THREE-TISSUE CORNER, on emitted vertices. */
  {
    const gr = new T.Group();
    buildCushions(gr, 1, {});
    buildVentricularSeptum(gr, 1, {});
    buildOutflow(gr, 1, {});
    const bag = {};
    const v = new T.Vector3();
    gr.traverse(o => {
      if (!o.isMesh || !o.userData || !o.userData.key) return;
      const k = o.userData.key, pos = o.geometry.attributes.position;
      const a = bag[k] || (bag[k] = []);
      for (let i = 0; i < pos.count; i += 6) a.push(v.clone().set(pos.getX(i), pos.getY(i), pos.getZ(i)));
    });
    const near = (x, y) => {
      const A = bag[x] || [], B = bag[y] || [];
      let best = Infinity;
      for (let i = 0; i < A.length; i++) for (let j = 0; j < B.length; j++) {
        const d = A[i].distanceToSquared(B[j]);
        if (d < best) best = d;
      }
      return isFinite(best) ? Math.sqrt(best) : Infinity;
    };
    m.membranousToMuscular = near('membranous_ivs', 'muscular_ivs');
    m.membranousToCushions = near('membranous_ivs', 'av_cushions');
    m.conalToMembranous = near('spiral_septum', 'membranous_ivs');
  }

  /* R — the tube must not fold */
  let worstFold = 1e9, foldAt = 0, foldT = 0;
  for (const tt of [0, 0.25, 0.5, 0.75, 1]) {
    for (let i = 2; i <= NSEG - 2; i++) {
      const u = uOf(i);
      const ratio = curvatureRadius(u) / rOut(u, tt);
      if (ratio < worstFold) { worstFold = ratio; foldAt = u; foldT = tt; }
    }
  }
  m.foldRatio = worstFold; m.foldAt = foldAt; m.foldT = foldT;
  return m;
}

const PRED = {
  A: m => m.orderOK === true,
  B: m => m.atZero <= 1e-9,
  C: m => m.cushionMeshGapD28 >= FLOORS.GAP && m.cushionMeshGapD35 <= 0,
  D: m => m.dayOstium2Opens != null && m.dayOstium1Closes != null &&
          m.dayOstium2Opens < m.dayOstium1Closes,
  E: m => m.twistEndErrArt <= 1e-6 && m.twistEndErrCon <= 1e-6 && m.twistMinimalBranch === true &&
          Math.abs(m.twistLocalDeg) >= 45,
  F: m => m.aortaSide >= FLOORS.SIDE && m.pulmSide <= -FLOORS.SIDE,
  /* the RIGHT-of clause is SUSPENDED — see HELD. DORSAL holds on the mesh (aorta z -0.346
     against pulmonary z +0.628); RIGHT does not, and it is an outflow claim. */
  G: m => m.aortaDorsalOfPulm >= FLOORS.DORSAL,
  /* THE TWIST MUST DO MOST OF THE WORK. A curving tract rotates the pair on its own — the frame is
     parallel-transported, so even a septum held at a constant LOCAL angle comes out rotated in world
     space. Asserting "0 degrees without the twist" would be asserting something false. What the test
     asserts is that the rotation WITH the twist is large, and that it is at least twice what the
     tract produces by itself — so the twist is the cause rather than a passenger. */
  Q: m => m.crossingDeg >= 60,   /* the "twice the TGA rotation" clause is SUSPENDED — see HELD */
  H: m => m.overlap >= FLOORS.OVERLAP,
  I: m => Math.abs(m.foramenAreaFrac - SHUNT_AREA) <= 0.01,
  J: m => m.ivForamenD40 >= FLOORS.FORAMEN && m.ivForamenD44 >= FLOORS.FORAMEN &&
          m.ivForamenVSD >= FLOORS.FORAMEN,
  K: m => m.membranousD44 <= 1e-9 && m.membranousD50 >= 0.999 && m.ivForamenD50 <= 1e-9,
  L: m => m.cushionMeshGapAVSD >= FLOORS.GAP &&
          m.cushionAVSDPolarity >= FLOORS.GAP,
  M: m => m.overlapASD < 0,
  N: m => m.tgaAortaSide <= -FLOORS.SIDE && (m.aortaSide - m.tgaAortaSide) >= FLOORS.SWING,
  O: m => m.ridgeGapTruncus >= FLOORS.GAP && m.ridgeGapNormal <= 1e-9,
  P: m => m.fallotMiss >= 0.35 && m.fallotOverride >= 0.35,   /* the pulmonary-calibre clause is SUSPENDED — see HELD */
  R: m => m.foldRatio >= 1.05,
  S: m => m.ivsEmptyDays === 0 && m.ivsHeightRises === true && m.ivsHeightD40 >= FLOORS.SEPTUM,
  T: m => m.bothOpeningsDays >= FLOORS.WINDOW && m.bothOpeningsBestMin >= FLOORS.OPENING,
  U: m => m.shuntVertices > 0 && m.shuntInsideSeptum === 0 && m.shuntThroughOstium > 0 &&
          m.shuntClearance >= FLOORS.CLEAR,
  V: m => m.membranousToMuscular <= 0.02 && m.membranousToCushions <= 0.02,
  W: m => m.cushionMeshTwoMasses === true && m.cushionMeshMonotone === true,
};

/* the deliberately wrong input each test must reject */
const NEGATIVE = {
  A: m => Object.assign({}, m, { orderOK: false }),
  B: m => Object.assign({}, m, { atZero: 0.05 }),               // a septum already there at day 25
  C: m => Object.assign({}, m, { cushionMeshGapD28: 0.04 }),    // "growing towards" each other, touching
  D: m => Object.assign({}, m, { dayOstium2Opens: 40 }),        // the crossing interrupted
  E: m => Object.assign({}, m, { twistEndErrCon: 0.02 }),       // a septum that misses its own boundary
  F: m => Object.assign({}, m, { aortaSide: 0.03 }),             // "over the LV" by 3% of nothing
  G: m => Object.assign({}, m, { aortaDorsalOfPulm: 0.02 }),
  Q: m => Object.assign({}, m, { crossingDeg: 4 }),              // a "crossing" of four degrees
  H: m => Object.assign({}, m, { overlap: 0.004 }),             // an overlap nobody could see
  I: m => Object.assign({}, m, { foramenAreaFrac: 0.35 }),      // a hole that is not the solved one
  J: m => Object.assign({}, m, { ivForamenD44: 0.002 }),        // a foramen the size of a hairline
  K: m => Object.assign({}, m, { membranousD44: 0.4 }),         // closed before the cushions got there
  /* THE EXACT ROUND-2 DEFECT: an "AVSD" drawn MORE fused than the healthy heart. */
  L: m => Object.assign({}, m, { cushionMeshGapAVSD: -0.30, cushionAVSDPolarity: -0.09 }),
  M: m => Object.assign({}, m, { overlapASD: 0.2 }),            // an "ASD" that is still competent
  N: m => Object.assign({}, m, { tgaAortaSide: -0.02 }),        // a transposition nobody could see
  O: m => Object.assign({}, m, { ridgeGapTruncus: 0.03 }),
  P: m => Object.assign({}, m, { fallotMiss: 0.03 }),            // a "malalignment" of three per cent
  R: m => Object.assign({}, m, { foldRatio: 0.41 }),            // the tube folded, as it first did
  /* THE EXACT DEFECT THE REVIEW FOUND: a septum whose parameter says it is there and whose buffer
     is empty on the days view 5 is staged at. */
  S: m => Object.assign({}, m, { ivsEmptyDays: 3, ivsHeightD40: 0 }),
  T: m => Object.assign({}, m, { bothOpeningsDays: 0.5, bothOpeningsBestMin: 0.01 }),
  /* the arrow 0.0090 inside the sheet, which is what round 1 measured */
  U: m => Object.assign({}, m, { shuntInsideSeptum: 42, shuntClearance: -0.009 }),
  V: m => Object.assign({}, m, { membranousToCushions: 0.31 }),  // a "corner" with a hole in it
  /* cushions that meet and then come apart — the measured trajectory before R2-1 was fixed */
  W: m => Object.assign({}, m, { cushionMeshMonotone: false }),
};

/* ------------------------------------------------------------------- SUSPENDED ASSERTIONS

   REVIEW ROUND 2, R2-7, and FRANK'S RULING OF 2026-09-29. Three sub-claims of rows G, Q and P are
   about the OUTFLOW TRACT, which left this item on 2026-09-29 to become engine__conotruncal-wedging;
   views 6, 8, 9 and 10 are held with them. All three were asserted from SCHEDULE PARAMETERS and all
   three are FALSE on emitted mesh — the analytic row reported a number the buffer contradicts:

     row G  aortaRightOfPulm  said 0.2917   mesh: the aorta's arterial end is x +0.306 against the
                                            pulmonary's -0.253, and +x is LEFT in this file's own
                                            stated axes, so the aorta is 0.559 to the embryo's LEFT
     row Q  crossingDegTGA    said 3.36     mesh: the TGA channels cross exactly as the normal ones
                                            do; the flag's whole effect is 0.08 at the conal foot
     row P  fallotPulmFrac    said 0.2357   mesh: pulmonary calibre 0.0871 against the normal 0.0877
                                            — the flag divides the outflow EQUALLY

   They are neither asserted nor quietly deleted. A ROW THAT CANNOT BE EXPRESSED ON EMITTED GEOMETRY
   IS A NOTE, NOT A TEST — so the claim, the analytic value that lied and the mesh value that
   contradicts it are all stated here, they are excluded from allPass, and they come back as
   assertions on emitted vertices when the conotruncal item lands. Asserting them on the mesh today
   would fail three rows for a cause this item is no longer allowed to fix. */
const HELD = {
  G_right: { row: 'G',
    claim: 'at the valves the aortic channel lies to the RIGHT of the pulmonary channel',
    analytic: m => m.aortaRightOfPulm,
    why: 'outflow — moved to engine__conotruncal-wedging 2026-09-29. Round 2 measured the aorta ' +
         '0.559 to the embryo\'s LEFT on emitted vertices. The DORSAL half of row G is still ' +
         'asserted and still holds.' },
  Q_tga: { row: 'Q',
    claim: 'the crossing is at least twice the rotation the curving tract produces without the twist',
    analytic: m => m.crossingDegTGA,
    why: 'outflow — the transposition variant is the same picture as health at the arterial end ' +
         '(R2-3), so the comparison has nothing to compare against until the wedging is built. The ' +
         '60-degree floor on crossingDeg is still asserted.' },
  P_calibre: { row: 'P',
    claim: 'the tetralogy pulmonary channel is at least 20% narrower than the aortic',
    analytic: m => m.fallotPulmFrac,
    why: 'outflow — the fallot flag moves the spiral septum\'s centroid by 0.0316 and rebuilds ' +
         'nothing around it (R2-5). The malalignment and override clauses of row P are still ' +
         'asserted.' },
};

let _measured = null;
function acceptance(opts) {
  if (opts != null && typeof opts === 'number') {
    throw new Error('septation-of-heart acceptance() takes no t. Every test states the day it is ' +
      'evaluated at (see ACCEPTANCE). Call acceptance() with no argument. Got ' + opts + '.');
  }
  const m = _measured || (_measured = measure());
  const pass = {};
  for (const id in PRED) pass[id] = !!PRED[id](m);
  const held = {};
  for (const k in HELD) {
    held[k] = { row: HELD[k].row, claim: HELD[k].claim, why: HELD[k].why,
                analytic_value: HELD[k].analytic(m) };
  }
  return { measured: m, pass: pass, allPass: Object.keys(pass).every(k => pass[k]),
           held: held, spec: ACCEPTANCE, floors: FLOORS };
}
function negatives() {
  const m = _measured || (_measured = measure());
  const out = {};
  for (const id in PRED) {
    const wrong = NEGATIVE[id](m);
    out[id] = { rejectsWrongInput: !PRED[id](wrong), acceptsRealInput: !!PRED[id](m) };
  }
  return { cases: out, allGood: Object.keys(out).every(k => out[k].rejectsWrongInput) };
}
let _asserted = false;
function assertAcceptance() {
  if (_asserted) return;
  _asserted = true;
  /* OFF THE HOT PATH. measure() now BUILDS geometry — that is the point of tests S, T, U and V,
     which exist because round 1's tests read parameters while the buffers were empty — and it costs
     a few seconds. Running it inline would put that on the first frame a student waits for, so it is
     deferred to an idle turn and remains a warning, never a throw. */
  const run = () => {
  try {
    const r = acceptance();
    if (!r.allPass) {
      const bad = Object.keys(r.pass).filter(k => !r.pass[k]).join(', ');
      console.warn('[septation-of-heart] ACCEPTANCE FAILED for ' + bad +
        ' — the mechanism no longer produces the anatomy it was written against.', r.measured);
    }
  } catch (e) { /* never let a self-check break a render */ }
  };
  if (typeof setTimeout === 'function') setTimeout(run, 0); else run();
}

/* ------------------------------------------------------------------- building */

function add(gr, key, geo, opts) {
  if (!geo) return null;
  return K.addSolid(gr, key, geo, Object.assign({
    color: LAYERS[key].color, name: LAYERS[key].name,
  }, opts || {}));
}

/* the five segments of the looped tube, divided AT THE WAISTS (RENDER-STANDARD §3) */
const SEGS = [
  { key: 'sinus',     u0: 0.000, u1: 0.150 },
  { key: 'atrium',    u0: 0.150, u1: 0.465 },   // the atrioventricular canal is the waist at 0.465
  { key: 'ventricle', u0: 0.465, u1: 0.735 },
  { key: 'bulbus',    u0: 0.735, u1: 0.885 },   // the conoventricular junction is the waist at 0.885
  { key: 'truncus',   u0: 0.885, u1: 1.000 },
];
const OVERLAP = 0.004;

function wallGeom(t, a, b, cut) {
  return K.sweptShell({
    frame: FRAME, i0: iOf(a), i1: iOf(b), ring: NRING,
    outerR: i => rOut(uOf(i), t), innerR: i => rIn(uOf(i), t),
    flatten: 1, section: () => 1, window: cut,
  });
}

function buildWalls(gr, t, opts) {
  const ghost = !!opts.ghost;
  const gmat = ghost ? { transparent: true, opacity: 0.16, depthWrite: false, clearcoat: 0 } : null;
  for (const s of SEGS) {
    let a = Math.max(0, s.u0 - (s.u0 > 0 ? OVERLAP : 0));
    let b = Math.min(1, s.u1 + (s.u1 < 1 ? OVERLAP : 0));
    add(gr, s.key, wallGeom(t, a, b, null), {
      outline: ghost ? 0.020 : 0.028,
      matOver: gmat, renderOrder: ghost ? 14 : 0,
    });
  }
  for (const ch of CHAMBERS) {
    const A = chamberAxes(ch, t, false);
    const sg = new T.SphereGeometry(1, 40, 26);
    sg.scale(A[0], A[1], A[2]);
    sg.translate(ch.c[0], ch.c[1], ch.c[2]);
    add(gr, ch.key, sg, { outline: ghost ? 0.020 : 0.028,
      matOver: gmat, renderOrder: ghost ? 14 : 0 });
  }
  /* terminal ends are DOMED, never annular — RENDER-STANDARD: an annulus at an end with nothing
     behind it reads as an open pipe. */
  for (const [u, sign, key] of [[0, -1, 'sinus'], [1, +1, 'truncus']]) {
    add(gr, key, K.domeCap({ frame: FRAME, i: iOf(u), sign: sign, r: rOut(u, t),
                             ring: NRING, rows: 7, flatten: 1, section: () => 1 }), {
      outline: ghost ? 0.020 : 0.028,
      matOver: ghost ? { transparent: true, opacity: 0.17, depthWrite: false, clearcoat: 0 } : null,
      renderOrder: ghost ? 14 : 0,
    });
  }
}

/* ---- the atrioventricular cushions ----

   Two swellings of cardiac jelly in the ROOF and FLOOR of the atrioventricular canal, growing
   towards each other until they meet in the middle.

   REVIEW ROUND 2, R2-1 — THE LAW BELOW REPLACES ONE THAT REVERSED. The old offset was
       centreOff = r*(1 - 0.62) - h*r*(1 - 0.62)*2   ==   0.38r*(1 - 2h)
   which passes through ZERO at h = 0.5 and changes SIGN past it, so each cushion crossed the canal
   axis and kept going out the far side. Measured on emitted vertices, the two masses' centres were
   0.0928 apart at day 26.5, 0.0220 at day 31.2 (their closest) and 0.1020 apart again at day 56 —
   they met and then came apart, underneath a beat whose narration is "watch the two cushions meet".
   And the defect polarity was inverted: the avsd flag clamps h at AVSD_ARREST, which parked the pair
   0.0386 apart at day 56 against health's 0.1020, so the atrioventricular septal defect — whose
   entire definition is cushions that FAIL to fuse — was drawn two and a half times MORE fused than
   the normal heart. A student comparing the two learned the sign backwards.

   The replacement states the two things the tissue actually does, separately, each monotone in h:

     - EACH SWELLING IS ATTACHED TO ITS OWN WALL AND GROWS INWARD. Its outer edge is pinned to the
       lumen wall at every h — dCentre + semi == r exactly — and only its inner face advances. That
       is why the offset is derived from the calibre rather than tuned: the wall it sits on is
       rIn(AV_U, t), so the swelling follows the canal as the canal widens.
     - THE CENTRE DISTANCE FALLS AND NEVER CROSSES. dCentre runs 0.74r -> 0.38r and stays positive,
       so neither mass ever reaches the axis, let alone passes it.

   The two together fix the second half of the finding as well: the old law's masses OVERLAPPED at
   every single day (surface gap -0.061 at day 26.5), so they were never two visibly separate
   swellings either. Here the surface gap is 2r*(0.48 - 0.72h) — open at 1.85 of their own mean
   thickness when they appear, closing at h = 2/3 (day 32.0), and 0.48r of overlap by day 35, which
   is what fusion looks like.

   AT h = 1 semi IS 0.62r AND dCentre IS 0.38r — the old law's own magnitudes at h = 1, with the
   sign no longer flipped. Since the two ellipsoids are mirror images about the canal centre, the
   day-56 union is the SAME SET OF VERTICES it has always been, so every t = 1 assertion this file
   makes (test V's membranous<->cushions contact at 0.0017 among them) is preserved by construction
   rather than by hope. Under the avsd clamp of h = 0.30 the gap stands open at 0.717 of mean
   thickness where health is fused: a real hole, on the correct side of health. */
function buildCushions(gr, t, opts) {
  const h = (opts.avsd) ? Math.min(g(t, 'cushions'), AVSD_ARREST) : g(t, 'cushions');
  if (h <= 1e-6) return;
  const i = Math.round(iOf(AV_U));
  const c = CP[i];
  const r = rIn(AV_U, t) * 1.02;
  const across = new T.Vector3(0, 0, 1);
  across.addScaledVector(FRAME.D[i], -across.dot(FRAME.D[i])).normalize();  // dorsoventral, in-section
  const along = FRAME.D[i];
  const side = new T.Vector3().crossVectors(along, across).normalize();
  for (const sgn of [-1, +1]) {
    /* across the canal: the swelling's own half-thickness, growing 0.26r -> 0.62r.
       in the section plane: a mild growth so it reads as a swelling enlarging, reaching exactly
       0.86r at h = 1 so the fused state is unchanged. */
    const semi = r * (0.26 + 0.36 * h);
    const inPlane = r * 0.86 * (0.80 + 0.20 * h);
    const sg = new T.SphereGeometry(1, 26, 18);
    sg.scale(inPlane, semi, inPlane);
    /* A RIGHT-HANDED BASIS. makeBasis(side, across, along) with side = along x across has a
       NEGATIVE determinant, and a negative-determinant matrix reverses the winding of every
       triangle it is applied to — measured, 0.000 of the cushion triangles agreed with their own
       normals. A basis is right-handed exactly when its third axis IS the cross product of the
       first two, so (along, across, side) with side = along x across is the correct ordering; it
       keeps the squash on `across`, where the anatomy wants it, and restores the handedness rather
       than patching the symptom. Note that the first attempt at this fix, (along, across, -side),
       is ALSO left-handed — the probe said so, which is why the probe and not the reasoning is
       what settles a handedness question. */
    const M4 = new T.Matrix4().makeBasis(along, across, side);
    sg.applyMatrix4(M4);
    /* OUTER EDGE PINNED TO THE WALL: dCentre + semi == r at every h, so the swelling sits on its
       own wall and only its inner face advances. Monotone 0.74r -> 0.38r, never reaching zero. */
    const centreOff = r - semi;
    sg.translate(c.x + across.x * sgn * centreOff, c.y + across.y * sgn * centreOff,
                 c.z + across.z * sgn * centreOff);
    add(gr, 'av_cushions', sg, { outline: 0.020 });
  }
}

/* ---- the atrial septa ---- */
function buildAtrialSepta(gr, t, opts) {
  const L = limbus(t);

  if (g(t, 'primum') > 1e-6 || opts.always_primum) {
    const A = atrialFrame(t, 0);
    const s1 = primumDescent(t);
    const halfP = [], halfN = [];
    for (let k = 0; k <= 60; k++) {
      const s = k / 60;
      halfP.push(atrialHalf(A, s, t, 1));
      halfN.push(atrialHalf(A, s, t, -1));
    }
    const hAt = (arr, s) => {
      const x = clamp01(s) * 60, i0 = Math.floor(x), f = x - i0;
      return arr[i0] * (1 - f) + arr[Math.min(60, i0 + 1)] * f;
    };
    const os2r = os2Radius(t, opts);
    const pt = (s, w, out) => {
      const ss = s * s1;
      const o = new T.Vector3().copy(A.roof).lerp(A.floor, ss);
      const hw = w >= 0 ? hAt(halfP, ss) : hAt(halfN, ss);
      return out.copy(o).addScaledVector(A.across, w * hw);
    };
    const geo = sheetSolid({
      ns: 46, nw: 36, pt: pt,
      // A MEMBRANE TAPERS: septum primum is the thin one, and its free edge goes to nothing
      thick: primumThick,
      mask: (s, w) => {
        if (os2r <= 1e-4) return true;
        const ss = s * s1;
        const dy = (ss - OS2_S) / os2r;
        const dx = w / 0.62;
        return (dx * dx + dy * dy) > 1;        // the ostium secundum
      },
    });
    add(gr, 'septum_primum', geo, { outline: 0.012 });
  }

  if (g(t, 'secundum') > 1e-6) {
    const A = atrialFrame(t, -SS_OFFSET);
    const s2 = secundumDescent(t);
    const halfP = [], halfN = [];
    for (let k = 0; k <= 60; k++) {
      const s = k / 60;
      halfP.push(atrialHalf(A, s, t, 1));
      halfN.push(atrialHalf(A, s, t, -1));
    }
    const hAt = (arr, s) => {
      const x = clamp01(s) * 60, i0 = Math.floor(x), f = x - i0;
      return arr[i0] * (1 - f) + arr[Math.min(60, i0 + 1)] * f;
    };
    const pt = (s, w, out) => {
      const ss = s * s2;
      const o = new T.Vector3().copy(A.roof).lerp(A.floor, ss);
      const hw = w >= 0 ? hAt(halfP, ss) : hAt(halfN, ss);
      return out.copy(o).addScaledVector(A.across, w * hw);
    };
    const geo = sheetSolid({
      ns: 40, nw: 32, pt: pt,
      /* septum secundum is the THICK one — that is the whole distinction a student is asked for —
         and its free edge is the limbus, a rounded muscular rim rather than a taper to nothing. */
      thick: secundumThick,
    });
    add(gr, 'septum_secundum', geo, { outline: 0.016 });
  }
  void L;
}

/* ---- the fetal shunt ----

   The scene's gaps[] is explicit that an atrial frame without the shunt "is a picture of two
   crescents". Right to left, under the limbus, lifting the flap of septum primum off it. */
function buildShunt(gr, t, opts) {
  opts = opts || {};
  if (secundumDescent(t) < 0.2 * limbus(t)) return;
  const os2r = os2Radius(t, opts);
  if (os2r <= 1e-4) return;              // no ostium secundum yet: there is nothing to come out of
  const A = atrialFrame(t, 0);
  const L = limbus(t);

  /* REVIEW ROUND 1, FINDING 3 — WHAT THIS REPLACES. The first version laid one bowed arc from the
     right atrium to the left at a single atrial level, s = limbus + 0.10, lifted 0.16 world units in
     the middle. Measured, that arc crossed the median plane at s ~ 0.687 while the ostium secundum
     spans s in [0.065, 0.365] — so it crossed through SOLID septum primum, 0.0090 from the sheet's
     own surface, i.e. inside it. Direction and entry were right and the picture was wrong in the one
     way the beat cannot afford: view 4 narrates "the two gaps do not line up, so flow can only run
     right to left", and a straight crossing at one level teaches that they DO line up.
     THE PATH NOW GOES WHERE THE BLOOD GOES: low on the right, under the free edge of septum
     secundum (the limbus), CRANIALLY up the slit between the two sheets, and out to the left through
     the ostium secundum at its own centre. The offset stations are not decorative — they are the two
     sheets' own planes, and the slit's width is what the two thicknesses leave. */
  /* THE SLIT IS WHAT THE TWO SHEETS' OWN THICKNESSES LEAVE, measured rather than chosen: septum
     secundum's mid-plane is SS_OFFSET to the right of septum primum's, each sheet reaches half its
     own thickness towards the other, and the arrow runs down the middle of what is left. Its radius
     is half that clearance less a margin, so the channel cannot be drawn wider than it is. Both
     thicknesses are taken at the ostium's own level, which is where each sheet is thickest over the
     stretch the arrow travels. */
  const sS = clamp01(OS2_S / Math.max(1e-6, secundumDescent(t)));
  const sP = clamp01(OS2_S / Math.max(1e-6, primumDescent(t)));
  const hS = 0.5 * secundumThick(sS);
  const hP = 0.5 * primumThick(sP);
  const slitLo = -SS_OFFSET + hS, slitHi = -hP;
  const SLIT = 0.5 * (slitLo + slitHi);
  const R_SLIT = Math.max(0.005, 0.5 * (slitHi - slitLo) - 0.006);

  const at = (frac, x, w, out) => {
    out.copy(A.roof).lerp(A.floor, clamp01(frac));
    out.x += x;
    return out.addScaledVector(A.across, w);
  };
  const sUnder = Math.min(0.965, L + 0.10);          // just caudal to the limbus
  const KEY = [
    [0.00, sUnder,                    -0.340, 0.020, 0.030],   // right atrium
    [0.20, sUnder,                    -0.105, 0.008, 0.024],   // approaching the free edge
    [0.33, sUnder - 0.055,            SLIT,   0.000, R_SLIT],  // turned up, under the limbus
    [0.56, 0.5 * (sUnder + OS2_S),    SLIT,   0.000, R_SLIT],  // between the two sheets
    [0.74, OS2_S + 0.030,             SLIT,   0.000, R_SLIT],
    [0.85, OS2_S,                      0.014, 0.000, 0.022],   // through the ostium secundum
    [1.00, OS2_S - 0.070,              0.320, -0.020, 0.032],  // left atrium
  ];
  const N = 64, pts = [], rad = [];
  const tmp = new T.Vector3();
  for (let i = 0; i <= N; i++) {
    const f = i / N;
    let k = 0;
    while (k < KEY.length - 2 && f > KEY[k + 1][0]) k++;
    const a = KEY[k], b = KEY[k + 1];
    const z = clamp01((f - a[0]) / (b[0] - a[0])), e = smooth(z);
    pts.push(at(a[1] + (b[1] - a[1]) * e, a[2] + (b[2] - a[2]) * e,
                a[3] + (b[3] - a[3]) * e, new T.Vector3()));
    rad.push(a[4] + (b[4] - a[4]) * e);
  }
  /* round the corners without letting them drift into a sheet: the smoothing is applied to the
     polyline, and the clearance is then MEASURED (prover check 9), not assumed. */
  for (let pass = 0; pass < 6; pass++) {
    const next = pts.map(v => v.clone());
    for (let i = 1; i < N; i++) {
      next[i].copy(pts[i - 1]).add(pts[i + 1]).multiplyScalar(0.5).lerp(pts[i], 0.45);
    }
    for (let i = 0; i <= N; i++) pts[i].copy(next[i]);
  }
  add(gr, 'shunt', K.tubeAlong(pts, u => {
    const x = clamp01(u) * N, i0 = Math.floor(x), fr = x - i0;
    return rad[i0] * (1 - fr) + rad[Math.min(N, i0 + 1)] * fr;
  }, { ring: 10 }),
      { noOutline: true, matOver: { transparent: true, opacity: 0.92, roughness: 0.7 } });
  // the head, in the LEFT atrium and clear of the sheet it has just come through
  const head = new T.ConeGeometry(0.062, 0.17, 16);
  const dir = new T.Vector3().subVectors(pts[N], pts[N - 2]).normalize();
  const q = new T.Quaternion().setFromUnitVectors(new T.Vector3(0, 1, 0), dir);
  head.applyMatrix4(new T.Matrix4().makeRotationFromQuaternion(q));
  head.translate(pts[N].x, pts[N].y, pts[N].z);
  add(gr, 'shunt', head, { outline: 0.014 });
  void tmp;
}

/* ---- the ventricular septum ---- */
function buildVentricularSeptum(gr, t, opts) {
  const V = ivsFrame(t);
  const hM = (opts.fallot ? Math.min(muscularHeight(t), IVS_TOP) : muscularHeight(t));
  if (hM <= 1e-6) return;
  const halfP = [], halfN = [];
  for (let k = 0; k <= 60; k++) {
    halfP.push(ivsHalf(V, k / 60, t, 1));
    halfN.push(ivsHalf(V, k / 60, t, -1));
  }
  const hAt = (arr, s) => {
    const x = clamp01(s) * 60, i0 = Math.floor(x), f = x - i0;
    return arr[i0] * (1 - f) + arr[Math.min(60, i0 + 1)] * f;
  };
  const pt = (s, w, out) => {
    const ss = s * hM;
    const o = new T.Vector3().copy(V.apex).addScaledVector(V.up, ss * V.reach);
    const hw = w >= 0 ? hAt(halfP, ss) : hAt(halfN, ss);
    return out.copy(o).addScaledVector(V.across, w * hw);
  };
  add(gr, 'muscular_ivs', sheetSolid({
    ns: 40, nw: 32, pt: pt,
    // a muscular wall, thick at the apex and thinning towards its free edge
    thick: (s) => 0.115 * (0.35 + 0.65 * Math.pow(1 - s, 0.7)),
  }), { outline: 0.020 });

  /* ---- the membranous part: the corner where three tissues meet ----
     It closes the interventricular foramen from three directions and it closes LAST. Built as the
     patch between the muscular septum's free edge and the cushions above it. */
  const mm = opts.vsd ? 0 : g(t, 'membranous');
  if (mm > 1e-6) {
    const s0 = hM, s1 = 1.0;
    const pt2 = (s, w, out) => {
      const ss = s0 + (s1 - s0) * s * mm;
      const o = new T.Vector3().copy(V.apex).addScaledVector(V.up, ss * V.reach);
      const hw = w >= 0 ? hAt(halfP, ss) : hAt(halfN, ss);
      return out.copy(o).addScaledVector(V.across, w * hw * 0.94);
    };
    add(gr, 'membranous_ivs', sheetSolid({
      ns: 22, nw: 28, pt: pt2,
      thick: () => 0.034,
    }), { outline: 0.012 });
  }
}

/* ---- the outflow: two ridges, one spiral septum, two channels ---- */
function buildOutflow(gr, t, opts) {
  const h = ridgeHeight(t, opts);
  if (h <= 1e-6) return;
  const i0 = Math.round(iOf(UC)), i1 = Math.round(iOf(U_ART));
  const n = new T.Vector3();
  const fused = h >= 0.5 - 1e-9;

  /* THE SEPTUM IS A RULED SHEET, not a plane: its normal turns along the tract. The sheet kit takes
     its normal from a finite difference of this very point function, so the twist cannot disagree
     with the shading (RENDER-STANDARD rule 3). */
  const pt = (s, w, out) => {
    const u = UC + (U_ART - UC) * s;
    const i = iOf(u);
    const ii = Math.max(0, Math.min(NSEG, Math.round(i)));
    septumNormal(i, opts, n);
    const r = rIn(u, t);
    const tang = new T.Vector3().crossVectors(FRAME.D[ii], n).normalize();
    const off = septumOffset(i, opts) * r;
    const reach = fused ? 1 : Math.min(1, 2 * h);
    return out.copy(CP[ii]).addScaledVector(n, off).addScaledVector(tang, w * r * 0.985 * reach);
  };
  if (fused) {
    add(gr, 'spiral_septum', sheetSolid({
      ns: 54, nw: 30, pt: pt,
      thick: () => 0.062,
    }), { outline: 0.016 });
  } else {
    /* before fusion there are TWO ridges, one on each wall, with a gap between them */
    for (const sgn of [-1, +1]) {
      const ptR = (s, w, out) => {
        const ww = sgn * (1 - (1 - w) * 0.5 * Math.min(1, 2 * h));
        return pt(s, ww * (sgn > 0 ? 1 : 1), out);
      };
      add(gr, 'spiral_septum', sheetSolid({
        ns: 44, nw: 20,
        pt: (s, w, out) => {
          const u = UC + (U_ART - UC) * s;
          const i = iOf(u);
          const ii = Math.max(0, Math.min(NSEG, Math.round(i)));
          septumNormal(i, opts, n);
          const r = rIn(u, t);
          const tang = new T.Vector3().crossVectors(FRAME.D[ii], n).normalize();
          const wallW = sgn * r * 0.985;
          const innerW = sgn * r * 0.985 * (1 - 2 * h);
          const ww = wallW + (innerW - wallW) * (0.5 * (w + 1));
          return out.copy(CP[ii]).addScaledVector(tang, ww);
        },
        thick: (s, w) => 0.062 * (0.35 + 0.65 * (1 - 0.5 * (w + 1))),
      }), { outline: 0.016 });
      void ptR;
    }
  }

  /* the two channels, as the flow each half carries. They are what CROSS, and they are what the
     acceptance tests are measured on. Drawn translucent so they read as lumen rather than as pipes. */
  if (opts.channels) {
    for (const [sgn, key] of [[+1, 'aortic_channel'], [-1, 'pulmonary_channel']]) {
      const pts = [];
      for (let k = 0; k <= 34; k++) {
        const u = UC + (U_ART - UC) * (k / 34);
        pts.push(channelCentre(u, t, sgn, opts, new T.Vector3()));
      }
      /* continue past the arterial end so the crossing is visible outside the heart: the aorta
         arches dorsally and to the left, the pulmonary trunk runs ventrally and to the right. */
      const last = pts[pts.length - 1].clone();
      const dir = new T.Vector3().subVectors(pts[34], pts[32]).normalize();
      for (let k = 1; k <= 12; k++) {
        const f = k / 12;
        const p = last.clone().addScaledVector(dir, f * 0.55);
        p.z += (sgn > 0 ? -0.55 : 0.50) * f * f;
        p.x += (sgn > 0 ? 0.34 : -0.40) * f * f;
        p.y += 0.30 * f;
        pts.push(p);
      }
      add(gr, key, K.tubeAlong(pts, u => rIn(UC + (U_ART - UC) * Math.min(1, u * 1.4), t) * 0.48 + 0.02,
                               { ring: 16 }),
          { noOutline: true,
            matOver: { transparent: true, opacity: 0.55, depthWrite: false, roughness: 0.6 },
            renderOrder: 16 });
    }
  }
}

/* ---- the median plane reference ----
   A REFERENCE MUST SURVIVE THE VIEW THAT USES IT. Both edges are measured off THIS build. */
function buildMidline(gr, t) {
  let yLo = 1e9, yHi = -1e9, zF = -1e9, zB = 1e9;
  for (let i = 0; i <= NSEG; i++) {
    const r = rOut(uOf(i), t), p = CP[i];
    yLo = Math.min(yLo, p.y - r); yHi = Math.max(yHi, p.y + r);
    zF = Math.max(zF, p.z + r);  zB = Math.min(zB, p.z - r);
  }
  /* A REFERENCE MUST BE LEGIBLE AND MUST NOT OUTWEIGH THE ANATOMY. Measured with the differencing
     probe, a quad spanning the whole heart changed 90% of the subject's lit pixels — the mirror of
     the round-3 defect it exists to avoid. The quad is now confined to the ATRIAL span, which is
     the only place in this scene where the median plane is the thing being taught (both atrial
     septa are built in it), and the ventral rod that carries it for an anterior camera keeps its
     full height. */
  const iA0 = Math.round(iOf(0.15)), iA1 = Math.round(iOf(0.47));
  let ayLo = 1e9, ayHi = -1e9;
  for (let i = iA0; i <= iA1; i++) {
    const r = rOut(uOf(i), t);
    ayLo = Math.min(ayLo, CP[i].y - r); ayHi = Math.max(ayHi, CP[i].y + r);
  }
  yLo -= 0.18; yHi += 0.24; zF += 0.30; zB -= 0.26;
  const qyLo = ayLo - 0.14, qyHi = ayHi + 0.14;
  const E = K.emitter(), nx = new T.Vector3(1, 0, 0);
  const q1 = new T.Vector3(0, qyLo, zB * 0.75), q2 = new T.Vector3(0, qyHi, zB * 0.75),
        q3 = new T.Vector3(0, qyHi, zF * 0.75), q4 = new T.Vector3(0, qyLo, zF * 0.75);
  E.triN(q1, q2, q3, nx); E.triN(q1, q3, q4, nx);
  add(gr, 'midline', E.geometry(), { noOutline: true,
    matOver: { transparent: true, opacity: 0.10, side: T.DoubleSide, depthWrite: false,
               roughness: 0.95, clearcoat: 0 }, renderOrder: 17 });
  const rod = [];
  for (let i = 0; i <= 10; i++) rod.push(new T.Vector3(0, qyLo + (qyHi - qyLo) * (i / 10), zF * 0.85));
  add(gr, 'midline', K.tubeAlong(rod, () => 0.034, { ring: 10 }), { noOutline: true,
    matOver: { transparent: true, opacity: 0.88, roughness: 0.9 } });
  void yLo; void yHi;
}

/* ------------------------------------------------------------------- build */

function buildSeptation(t, opts) {
  opts = opts || {};
  t = Math.max(0, Math.min(1, t));
  assertAcceptance();
  const gr = new T.Group();

  if (opts.walls !== false) buildWalls(gr, t, opts);
  buildCushions(gr, t, opts);
  buildAtrialSepta(gr, t, opts);
  buildVentricularSeptum(gr, t, opts);
  buildOutflow(gr, t, opts);
  if (opts.shunt) buildShunt(gr, t, opts);
  if (opts.midline) buildMidline(gr, t);
  return gr;
}

/* --------------------------------------------------------- the provider contract */

window.MB3D_MODELS = window.MB3D_MODELS || {};
window.MB3D_MODELS['septation-of-heart'] = {
  LAYERS: LAYERS,
  build: buildSeptation,
  /* Every optional layer on. Without this the provider builds only the default layers and any
     structure behind a flag comes back reason:'none' — which the player shows a student as "there is
     no model of this structure", a confident lie about a model sitting right there. */
  FULL: { channels: true, shunt: true, midline: true, ghost: true, always_primum: true },
  VARIANTS: {
    ghost: 'the chamber walls translucent, so the four septa are visible inside them',
    channels: 'the aortic and pulmonary channels drawn as flow',
    avsd: 'the endocardial cushions arrested — atrioventricular septal defect',
    asd: 'the ostium secundum resorbed past the limbus — secundum atrial septal defect',
    vsd: 'the membranous part never closes — the commonest ventricular septal defect',
    transposition: 'the conal boundary condition dropped — the outflow septum does not spiral',
    truncus_persistent: 'the conotruncal ridges form and never fuse',
    fallot: 'the outflow septum displaced ventrally — three of the four features of tetralogy',
  },
  ACCEPTANCE: ACCEPTANCE,
  FLOORS: FLOORS,
  acceptance: acceptance,
  negatives: negatives,
  day: day,
  twist: twist,
  /* EXPOSED SO THE PROVER CAN TEST FOR A FOLDED TUBE. A swept tube whose radius exceeds the
     curvature radius of its own centreline turns itself inside out on the inside of the bend, and
     the tell is a winding fraction below 1 on the OUTER surface — which is how this was found. */
  probe: {
    rOut: rOut, rIn: rIn, centre: u => CP[Math.round(iOf(u))].clone(), NSEG: NSEG,
    curvatureRadius: curvatureRadius, chambers: CHAMBERS, chamberAxes: chamberAxes,
    ivsFrame: ivsFrame, atrialFrame: atrialFrame, inLumen: inLumen,
  },
  limbus: limbus,
  schedule: SCHED,
  /* ------------------------------------------------- THE BEAT-CLAIM VOCABULARY
     RENDER-STANDARD §3: a time-varying scene's narrated claims are written into the scene as
     claims[] and checked at each beat's own SET_STAGE t by viz-training/tools/check-beat-claims.mjs.
     That tool evaluates a model's OWN vocabulary through claimMeasure when the model has no at(t),
     and it runs in a sandbox with a stub THREE and no VizKit — so nothing here may build geometry.

     WHICH MEANS EVERY MEASURE HERE IS A CLOSED FORM, AND R2-7 IS THE REASON THAT NEEDS A WORD.
     R2-7's rule is that a row naming a structure must assert against that structure's EMITTED
     vertices, because five rows asserted from schedule parameters what the buffer contradicted.
     cushion.gapFrac below is a closed form of the emitted geometry rather than a proxy for it: the
     cushion law pins each mass's outer edge to the lumen wall, so dCentre + semi == r identically
     and the normalised gap (dCentre - semi) / semi is independent of r. It was checked against the
     mesh at eleven days from 26.5 to 56 and agrees to four decimal places at every one of them
     (1.7992 / 1.2741 / 0.5477 / 0.0761 / -0.2332 / -0.3543 / -0.3871 / -0.3871 / -0.3871 / -0.3871
     / -0.3871). THE MESH IS STILL WHAT RULES: measured rows C, L and W read the emitted buffer, and
     if a future change to the law breaks the identity they fail while this vocabulary would not. */
  claimMeasure: function (name, t) {
    const h = g(t, 'cushions');
    switch (name) {
      case 'day':                 return day(t);
      case 'cushion.h':           return h;
      /* the closed form of the emitted normalised surface gap; >0 apart, <=0 fused */
      case 'cushion.gapFrac':     return (0.48 - 0.72 * h) / (0.26 + 0.36 * h);
      case 'cushion.masses':      return h > 1e-6 ? 2 : 0;
      case 'primum.descent':      return primumDescent(t);
      case 'primum.frac':         return g(t, 'primum');
      case 'secundum.descent':    return secundumDescent(t);
      case 'secundum.frac':       return g(t, 'secundum');
      case 'ostium2.radius':      return os2Radius(t, {});
      case 'ostium2.frac':        return g(t, 'ostium2');
      case 'overlap':             return overlapAt(t, {});
      case 'muscular.frac':       return g(t, 'muscular');
      case 'muscular.height':     return muscularHeight(t);
      case 'membranous.frac':     return g(t, 'membranous');
      case 'ivForamen':           return ivForamen(t, {});
      case 'ridges.frac':         return g(t, 'ridges');
      case 'septaPresent':        return Math.max(h, g(t, 'primum'), g(t, 'ostium2'),
                                                  g(t, 'secundum'), g(t, 'muscular'),
                                                  g(t, 'membranous'), g(t, 'ridges'));
    }
    throw new Error('septation-of-heart claimMeasure: unknown measure ' + name);
  },
};

})();
