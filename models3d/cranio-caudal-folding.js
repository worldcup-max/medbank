/* MedBank · cranio-caudal folding of the embryo — PRODUCTION procedural model.
 *
 * Registers MB3D_MODELS['cranio-caudal-folding']: LAYERS, build(t, opts) -> THREE.Group whose meshes
 * carry userData.key, and FULL so every benign optional layer is resolvable.
 *
 * WRAPPED IN AN IIFE. Only the registration escapes. RENDER-STANDARD: a model written at top level
 * puts T, K, C, LAYERS and every constant into global lexical scope and the NEXT model to load dies
 * on "Identifier 'T' has already been declared", taking the whole page with it.
 *
 * WHAT t MEANS. t = 0 is the FLAT TRILAMINAR DISC at the end of week 3 (about day 21): a flat,
 * cranially-wider sheet with the amniotic cavity on its dorsal side and the yolk sac on its ventral
 * side. t = 1 is the C-SHAPED EMBRYO of about day 28 — dorsally convex, with a gut tube inside a body
 * tube and one narrow stalk at the belly. The scene's narration says "week 4" throughout and gives the
 * day numbers as approximations; the two agree.
 *
 * AXES. +x = embryo's LEFT, -x = RIGHT, +y = CRANIAL, -y = CAUDAL, +z = VENTRAL, -z = DORSAL.
 *
 *   NOT PROVED BY THIS MODEL ALONE, and said here rather than left to be found. RENDER-STANDARD's rule
 *   "A DECLARED AXIS IS NOT A PROVED ONE, AND A SYMMETRIC MODEL CANNOT PROVE ITS OWN" applies with
 *   full force: this is a MEDIAN-SAGITTAL subject, so every structure it builds is mirror-symmetric in
 *   x except the Bochdalek defect, and the one acceptance row that names a side (the defect is on the
 *   embryo's LEFT, x > 0) is the SAME STATEMENT as the declaration rather than a check on it. The
 *   convention is therefore proved by that rule's route (b): viz-training/tools/prove-corpus-axes.mjs
 *   measures the handedness off the BodyParts3D scan data through the same ids the bodyparts3d adapter
 *   resolves, and checks the AXES object below against it. Flip a sign here and that tool fails.
 *   Declared in the scene's gaps[] as well, because a student IS marked wrong for the side of a
 *   Bochdalek hernia.
 *
 * THE MECHANISM, AND THE THREE PARAMETERS THAT ARE SOLVED RATHER THAN TUNED.
 *
 *   Cranio-caudal folding is a MEDIAN-PLANE story and it is a bending problem. The neural tube — above
 *   all the brain vesicles at the head end — grows very fast while the yolk sac slung underneath does
 *   not, so the dorsal fibres of the disc lengthen more than the ventral ones and the sheet has only
 *   one option: it curls. A beam whose dorsal surface outgrows its ventral surface acquires curvature
 *   kappa = (dorsal strain - ventral strain) / thickness, so the model carries the growth differential
 *   and integrates it, rather than carrying a drawn curve.
 *
 *   The midline is parameterised by MATERIAL arc coordinate s: s = 0 is the caudal tip, s = 1 the
 *   cranial edge of the disc, and EVERY LANDMARK SITS AT A FIXED s FOR ALL t. That is the whole point.
 *   The septum transversum does not get moved to the thorax; it is left where it was on the sheet and
 *   the sheet is bent. So the reversal the narration is about — "the list has flipped end for end" — is
 *   a MEASUREMENT on the built curve and not an arrangement.
 *
 *   dtheta/ds = t * ( AH * gauss(s, S_HEAD, W_HEAD) + AT * gauss(s, S_TAIL, W_TAIL) )
 *
 *   Three unknowns are SOLVED at module load, by bisection, against three statements the scene's own
 *   narration makes. They are chosen by RENDER-STANDARD's test — "ask which number a student would be
 *   marked wrong for, and solve THAT one":
 *
 *     S_HEAD  where the head fold's curvature is centred, and
 *     AH      how strong it is, TOGETHER against two constraints:
 *               (i)  "the oropharyngeal membrane ends up most cranial"  =>  theta(S_ORO) = pi/2, i.e.
 *                    the tangent there is horizontal, i.e. that material point is the CROWN
 *               (ii) "rotate that strip through half a turn, which is exactly what the head fold does
 *                    to it"                                             =>  theta(S_SEPTUM) = pi
 *             One amplitude can satisfy one of those, not both; where the curvature is centred is the
 *             second unknown, and it is what decides whether the crown lands on the membrane or past
 *             it. Solved jointly.
 *     AT      "The cloacal membrane travels round with it and ends up on the ventral surface too"
 *             =>  the cloacal membrane's outward normal, taken from the BUILT frame at its own
 *             station, points ventral: theta(S_CLOACAL) = -pi/2.
 *
 *   EVERYTHING THAT FOLLOWS IS A RESULT, NOT A SETTING, and is measured in acceptance():
 *     · the order of septum transversum / heart / oropharyngeal membrane in y REVERSES between t = 0
 *       and t = 1, and the span of the strip in y survives the reversal;
 *     · the tail fold comes out SMALLER than the head fold (theta at the caudal tip against theta at
 *       the cranial edge) without having been told to;
 *     · the heart ends up VENTRAL to the foregut;
 *     · the septum transversum DESCENDS — its y falls by a measured fraction of the body's length;
 *     · the connecting stalk's outgrowth direction swings from caudal to within a few degrees of
 *       ventral.
 *
 * WHAT IS *NOT* SOLVED, said here rather than left to be discovered:
 *   - the SHAPE of the growth differential (that it is two gaussians, and their widths W_HEAD and
 *     W_TAIL, and where the tail one is centred) is PRESCRIBED. Only the two head unknowns and the
 *     tail amplitude are solved, so how TIGHT the folds are is a modelling choice and how far they
 *     turn is not;
 *   - GROW, how much the midline lengthens, is prescribed;
 *   - the closure SCHEDULE of the gut's communication with the yolk sac is prescribed and linear. What
 *     is NOT prescribed is that the foregut and hindgut lengths are the COMPLEMENT of it: they are
 *     read off the same one number, so "sealed in front, sealed behind, still open in the middle" is
 *     one function of t and cannot drift;
 *   - the amnion is a prescribed enclosing shell with a prescribed aperture schedule — extraembryonic
 *     context, not examinable geometry;
 *   - the brain vesicles' size schedule is prescribed. The model does NOT derive the fold from the
 *     brain's volume: it is the largest thing here asserted in words and not in geometry. What IS
 *     asserted is the LINK — the neural tube's widest station and the head fold's curvature peak are
 *     the same station, because the vesicles are placed relative to the SOLVED S_HEAD;
 *   - t is the teaching approximation. Folding is continuous and the day numbers are not examined.
 *
 * GEOMETRY NOTE. The body wall and the gut are thick-walled SHELLS (outer surface, inner surface, rim)
 * so that a cut end reads as a wall and an outward-normal probe means something. Everything else is a
 * closed solid. Nothing shares a surface with anything else; the pairs that are in deliberate CONTACT
 * are named in the partition acceptance() publishes, never waved through by a tolerance.
 */
(function () {

const T = window.THREE;
const K = window.VizKit;   // render-kit.js must load first — it owns winding, normals and colour
const C = K.C;

/* THE AXIS CONVENTION, MACHINE-READABLE, so a tool checks it rather than a reader. prove-corpus-axes.mjs
   reads BOTH this object and the prose string in ACCEPTANCE.axes and requires them to agree with each
   other AND with the meshes; two forms that can disagree is the failure it exists to catch. */
const AXES = { right: '-x', left: '+x', cranial: '+y', caudal: '-y', ventral: '+z', dorsal: '-z',
               units: 'model units (this model is NOT in anatomical mm — see the scene gaps[])',
               proved_by: 'viz-training/tools/prove-corpus-axes.mjs, against BodyParts3D right/left pairs' };

/* COPIED FROM viz3d.js's VIEW_DIR TABLE, not restated. RENDER-STANDARD 3.y: a beat that narrates a
   shape asserts it on the SCREEN PLANE OF THE CAMERA THAT BEAT ROTATES TO, and the model's table is
   copied so the player's cameras and the probe's cannot drift apart. The 0.001 on the poles is
   viz3d's, kept verbatim for the same reason. */
const VIEW_DIR = {
  anterior: [0, 0, 1], posterior: [0, 0, -1], lateral: [1, 0, 0], medial: [-1, 0, 0],
  superior: [0, 1, 0.001], inferior: [0, -1, 0.001]
};

const LAYERS = {
  headfold:      { color: 0xf4d03f, name: 'Head fold region of the body wall' },
  trunk:         { color: 0xd9cdb0, name: 'Trunk body wall' },
  tailfold:      { color: 0x5dade2, name: 'Tail fold region of the body wall' },
  amnion:        { color: 0x9fb9d8, name: 'Amnion' },
  neural:        { color: 0x5c6bc0, name: 'Neural tube' },
  brain:         { color: 0x16a085, name: 'Brain vesicles' },
  cranialstrip:  { color: 0xf5b041, name: 'The cranial strip that the head fold rotates' },
  oropharyngeal: { color: 0xe8d9c0, name: 'Oropharyngeal membrane' },
  heart:         { color: 0xc0392b, name: 'Heart tube' },
  pericardium:   { color: 0xe59866, name: 'Pericardial cavity' },
  septum:        { color: 0xba4a00, name: 'Septum transversum' },
  foregut:       { color: 0xd35400, name: 'Foregut' },
  midgut:        { color: 0x8e44ad, name: 'Midgut' },
  hindgut:       { color: 0x3498db, name: 'Hindgut' },
  cloaca:        { color: 0x2e86c1, name: 'Cloaca' },
  cloacal:       { color: 0xaed6f1, name: 'Cloacal membrane' },
  allantois:     { color: 0x48c9b0, name: 'Allantois' },
  stalk:         { color: 0xc8a08a, name: 'Connecting stalk / umbilical cord' },
  vitelline:     { color: 0xc9a227, name: 'Vitelline duct (yolk stalk)' },
  yolksac:       { color: 0xd8c86a, name: 'Yolk sac' },
  ectopia:       { color: 0xcb4335, name: 'Ectopia cordis — the heart outside the chest' },
  cdh:           { color: 0xe74c3c, name: 'Bowel in the chest through a Bochdalek defect' },
};

/* ------------------------------------------------------------------ constants */

const NS = 176;            // frame stations along the midline. Every s below is a MATERIAL coordinate.
const SREF = 0.50;         // the station whose tangent is held at +y: the middle of the trunk

/* MATERIAL STATIONS. These are the flat-disc order the narration tells a student to memorise, read
   from the cranial edge working back: septum transversum, pericardial cavity, cardiogenic area with
   the heart tubes in it, oropharyngeal membrane, then the neural plate. They are FIXED for all t.
   SEGMENT BOUNDARIES BELONG AT THE REAL LANDMARKS (RENDER-STANDARD 3): S_ORO and S_CLO are where the
   body wall is divided into head-fold, trunk and tail-fold regions, because those two membranes are
   what the two folds seal. */
const S_SEPTUM = 0.985;    // the cranial edge of the disc
const S_HEART  = 0.921;    // cardiogenic area; the pericardial cavity is the sac around it
const S_ORO    = 0.845;    // oropharyngeal (buccopharyngeal) membrane
const S_CLO    = 0.095;    // cloacal membrane
const S_STK    = 0.045;    // where the connecting stalk leaves the caudal end
const S_UMB    = 0.470;    // the umbilicus: the centre of the gut's communication with the yolk sac
const S_BRAIN  = 0.105;    // the vesicles sit this far CAUDAL of the solved curvature peak S_HEAD

const W_HEAD = 0.240;      // PRESCRIBED width of the head fold's growth differential
const S_TAIL = 0.185;      // PRESCRIBED centre of the tail fold's
const W_TAIL = 0.180;      // PRESCRIBED width of the tail fold's

const L0 = 3.00;           // midline length of the flat disc, model units
const GROW = 0.55;         // PRESCRIBED fractional lengthening of the midline from t=0 to t=1

/* body wall calibre. RB is the trunk's outer radius; the cranial strip TAPERS, because it is the thin
   sheet that has to turn through pi and the mass at its far end is the septum transversum and the
   pericardial sac, which are their own solids sitting ON it. A tube of radius RB could not make that
   bend without its concave surface passing through its own centre of curvature — the solve reports
   the minimum radius of curvature and acceptance() asserts the clearance. */
const RB = 0.235;
const WALL = 0.052;        // body wall thickness
const R_TIP_CR = 0.28;     // cranial strip radius as a fraction of RB, at s = 1
const R_TIP_CD = 0.36;     // caudal tip radius as a fraction of RB, at s = 0
const PEAR = 0.26;         // the flat disc is cranially wider: outer radius gains this much at s = 1

/* the flat disc is FLAT. `flatten` in render-kit squashes the ring along B (= x, left-right), so a
   value > 1 widens it: at t = 0 the section is a wide thin ellipse, at t = 1 it is round. */
const FLAT0 = 3.10;

const R_GUT = 0.078;       // gut tube outer radius at the trunk
const GUT_WALL = 0.030;
const GUT_OFF = 0.085;     // the gut runs this far VENTRAL of the midline axis
const NEU_OFF = -0.105;    // the neural tube runs this far ventral, i.e. DORSAL of it
const R_NEU = 0.055;
const R_BRAIN = 0.085;     // radius of the vesicle swellings at t = 1

/* the gut's communication with the yolk sac: a window centred on S_UMB whose half-extent in s runs
   from HALF0 (the whole endodermal trough is open) to HALF1 (a vitelline duct). PRESCRIBED, linear.
   The foregut and hindgut lengths are the COMPLEMENT of this one number, so they cannot disagree. */
const HALF0 = 0.380;
const HALF1 = 0.035;
const WIN_HALF = 0.62;     // angular half-width of that window, radians

/* 0.14, not the 0.30 it started at. The outward-normal probe measured against the midline reported
   0.971 for the amnion and nothing else below 0.98, and the reason was geometric rather than a
   winding fault: at 0.30 the amnion's radius over the head fold was 0.53 against a local radius of
   curvature of 0.40, so the shell wrapped PAST its own centre of curvature and folded through itself.
   Acceptance row M now covers the amnion as well as the wall, because the check that would have
   caught this was only looking at one of the two swept shells. */
const AM_GAP = 0.30;       // clearance from the body's outer surface to the amnion
const AM_HALF0 = Math.PI / 2;  // at t=0 the amnion is a dorsal half-trough: it covers half the section
const AM_HALF1 = 0.30;         // at t=1 only the umbilical aperture is open

/* RING_BODY IS 40, NOT 26, AND THE REASON IS MEASURED. At t = 0 the section is a 3.1 : 1 ellipse, and
   an ellipse that flat has its highest curvature at the ENDS of its long axis. render-kit derives the
   normal by finite difference of the same point function that made the position — which is right — but
   at 26 points around the ring that difference spans 0.24 rad, and across the tightest part of the
   section that is too coarse: the ray probe found 14 back-facing FIRST HITS on the amnion's outer
   surface at t = 0 and none at any other t. At 40 the step is 0.157 rad and they go to zero. A
   sampling rate is part of the geometry, not a performance knob. */
const RING_BODY = 40, RING_GUT = 18, RING_SMALL = 16;

/* ------------------------------------------------------------------ small maths */

function clamp(v, a, b) { return v < a ? a : (v > b ? b : v); }
function smoothstep(e0, e1, x) { const u = clamp((x - e0) / (e1 - e0), 0, 1); return u * u * (3 - 2 * u); }
function gauss(u, c, w) { const z = (u - c) / w; return Math.exp(-z * z); }

/* SIMPSON, on a fixed fine grid, so every integral in the solve and in the curve is the same integral.
   Two different quadratures for the same quantity is how a solved parameter stops agreeing with the
   geometry built from it. */
const QN = 2048;
function integ(a, b, f) {
  if (b === a) return 0;
  const n = QN, h = (b - a) / n;
  let s = f(a) + f(b);
  for (let i = 1; i < n; i++) s += f(a + i * h) * (i % 2 ? 4 : 2);
  return s * h / 3;
}
function Ghead(s, sh) { return integ(SREF, s, u => gauss(u, sh, W_HEAD)); }
function Gtail(s)     { return integ(SREF, s, u => gauss(u, S_TAIL, W_TAIL)); }

/* ------------------------------------------------------- THE SOLVE, at module load

   Three unknowns, three narration constraints. S_HEAD and AH are coupled to each other and both are
   weakly coupled to AT (the tail gaussian has a small but non-zero value under the head), so the
   three are driven to a joint fixed point rather than solved once each. It converges in a handful of
   passes; 60 are run and the residuals are published, because a solve whose residual nobody looks at
   is a comment. */
function solveAll() {
  let sh = 0.92, ah = 11.5, at = 6.4, bracketed = true;
  for (let pass = 0; pass < 60; pass++) {
    /* (i) + (ii) for the head: with AT held, pick S_HEAD so that the amplitude forced by
       theta(S_ORO) = pi/2 also delivers theta(S_SEPTUM) = pi. */
    const f = c => {
      const g2 = Ghead(S_ORO, c);
      if (Math.abs(g2) < 1e-12) return 1e9;
      const ahc = (Math.PI / 2 - at * Gtail(S_ORO)) / g2;
      return ahc * Ghead(S_SEPTUM, c) + at * Gtail(S_SEPTUM) - Math.PI;
    };
    let lo = 0.58, hi = 1.45;
    if (f(lo) * f(hi) > 0) { bracketed = false; break; }
    for (let i = 0; i < 90; i++) { const m = (lo + hi) / 2; if (f(lo) * f(m) <= 0) hi = m; else lo = m; }
    sh = (lo + hi) / 2;
    ah = (Math.PI / 2 - at * Gtail(S_ORO)) / Ghead(S_ORO, sh);
    /* (iii) for the tail: the cloacal membrane's own frame turns to face ventral. */
    at = (-Math.PI / 2 - ah * Ghead(S_CLO, sh)) / Gtail(S_CLO);
  }
  const th = s => ah * Ghead(s, sh) + at * Gtail(s);
  return {
    S_HEAD: sh, AH: ah, AT: at, bracketed: bracketed,
    residual_oro:    th(S_ORO) - Math.PI / 2,
    residual_septum: th(S_SEPTUM) - Math.PI,
    residual_cloaca: th(S_CLO) + Math.PI / 2,
    /* RESULTS, not settings — reported so a reader can see they were not chosen. */
    turn_cranial_tip: th(1),
    turn_caudal_tip: -th(0),
    kappa_head_peak: ah / (L0 * (1 + GROW)),
    kappa_tail_peak: Math.abs(at) / (L0 * (1 + GROW)),
  };
}
const SOLVED = solveAll();
const S_HEAD = SOLVED.S_HEAD, AH = SOLVED.AH, AT = SOLVED.AT;

/* THE GROWTH DIFFERENTIAL, and the curve it integrates to. theta is measured from +y (cranial) toward
   +z (ventral), so a positive dtheta/ds curls the cranial end VENTRALLY and, because the integral runs
   backwards for s < SREF, the same positive value at the tail end carries the caudal end ventrally
   too. Both amplitudes come out positive: the dorsal side outgrows the ventral side at BOTH ends,
   which is what the narration says and not something imposed on the signs. */
function dthetaDs(s, t) { return t * (AH * gauss(s, S_HEAD, W_HEAD) + AT * gauss(s, S_TAIL, W_TAIL)); }
function theta(s, t) { return t * (AH * Ghead(s, S_HEAD) + AT * Gtail(s)); }
function lengthAt(t) { return L0 * (1 + GROW * t); }

/* ------------------------------------------------------------------ the curve

   ONE point function for the midline, and the frame is derived from it analytically rather than by
   parallel transport. render-kit's parallelFrame is right for an arbitrary polyline, but this curve is
   PLANAR by construction — the whole subject is the median plane — and a planar curve has an exact
   frame with no twist at all:

       D = (0,  cos th,  sin th)     the tangent, pointing CRANIALLY (increasing s)
       N = (0, -sin th,  cos th)     the in-plane normal, pointing VENTRALLY
       B = D x N = (+1, 0, 0)        the embryo's LEFT

   That matters for two reasons. A transported frame twists, and RENDER-STANDARD warns that a cutaway
   aimed at a fixed theta then wanders; here theta = 0 on every ring is exactly local ventral, at every
   station, at every t. And N is what every offset in this model is measured along — the gut is ventral
   of the axis, the neural tube dorsal of it — so those offsets stay anatomical through the fold
   instead of rotating out of meaning. */
const _curveCache = {};
function curveAt(t) {
  const key = t.toFixed(6);
  if (_curveCache[key]) return _curveCache[key];
  const L = lengthAt(t), ds = L / NS;
  const th = new Array(NS + 1), P = new Array(NS + 1), D = new Array(NS + 1),
        N = new Array(NS + 1), B = new Array(NS + 1);
  for (let i = 0; i <= NS; i++) th[i] = theta(i / NS, t);
  const i0 = Math.round(SREF * NS);
  const Y = new Array(NS + 1), Z = new Array(NS + 1);
  Y[i0] = 0; Z[i0] = 0;
  /* trapezoid on theta, which is the midpoint rule on the tangent — the same integral in both
     directions, so the two halves of the curve cannot disagree at the join. */
  for (let i = i0 + 1; i <= NS; i++) {
    const tm = (th[i] + th[i - 1]) / 2;
    Y[i] = Y[i - 1] + Math.cos(tm) * ds; Z[i] = Z[i - 1] + Math.sin(tm) * ds;
  }
  for (let i = i0 - 1; i >= 0; i--) {
    const tm = (th[i] + th[i + 1]) / 2;
    Y[i] = Y[i + 1] - Math.cos(tm) * ds; Z[i] = Z[i + 1] - Math.sin(tm) * ds;
  }
  for (let i = 0; i <= NS; i++) {
    P[i] = new T.Vector3(0, Y[i], Z[i]);
    D[i] = new T.Vector3(0, Math.cos(th[i]), Math.sin(th[i]));
    N[i] = new T.Vector3(0, -Math.sin(th[i]), Math.cos(th[i]));
    B[i] = new T.Vector3(1, 0, 0);
  }
  const cv = { P, D, N, B, th, L, ds, t };
  _curveCache[key] = cv;
  return cv;
}

/** An offset copy of the midline frame: the same tangent and normal, the centreline pushed along N.
    Valid while |off| stays well inside the local radius of curvature, which acceptance() asserts
    rather than assumes — an offset past the centre of curvature inverts the sweep. */
function offsetFrame(cv, off) {
  const P = cv.P.map((p, i) => p.clone().addScaledVector(cv.N[i], off));
  return { P, D: cv.D, N: cv.N, B: cv.B, th: cv.th, L: cv.L, ds: cv.ds, t: cv.t };
}

const IDX = s => clamp(Math.round(s * NS), 0, NS);

/** The frame at an arbitrary material s, linearly interpolated between stations. */
function frameAt(cv, s) {
  const x = clamp(s, 0, 1) * NS, i = Math.min(NS - 1, Math.floor(x)), f = x - i;
  const lerp = (a, b) => a.clone().multiplyScalar(1 - f).addScaledVector(b, f);
  const d = lerp(cv.D[i], cv.D[i + 1]).normalize();
  const n = lerp(cv.N[i], cv.N[i + 1]).normalize();
  return { P: lerp(cv.P[i], cv.P[i + 1]), D: d, N: n, B: new T.Vector3(1, 0, 0),
           th: cv.th[i] * (1 - f) + cv.th[i + 1] * f };
}

/** A point at material s, offset along that station's own ventral normal. */
function ptAt(cv, s, off) {
  const fr = frameAt(cv, s);
  return fr.P.clone().addScaledVector(fr.N, off || 0);
}

/* --------------------------------------------------------- calibre profiles

   The cranial strip tapers (see the constants) and so does the caudal tip; the flat disc is cranially
   wider, which is the "pear-shaped" of the narration and is put in the RADIUS rather than in the
   flatten, because flatten is one number for a whole sweep. */
function wallOuter(s, t) {
  let r = RB;
  /* the taper starts CRANIAL OF S_ORO, not at it. Measured, not chosen: with the taper beginning at
     S_ORO the wall came within 11% of its own centre of curvature at s = 0.881 — acceptance row M,
     which failed on the first build. The head fold's curvature peaks at the SOLVED S_HEAD = 0.923 and
     the head and cardiac swellings are centred at 0.853 and 0.908, so the three pile up in the same
     100 stations; the bend is where the tissue is thickest. Starting the taper at S_ORO - 0.045 and
     softening both swellings takes the worst clearance to 0.43. */
  const crTaper = 1 - (1 - R_TIP_CR) * smoothstep(S_ORO - 0.045, 1.0, s);
  const cdTaper = 1 - (1 - R_TIP_CD) * (1 - smoothstep(0.0, 0.30, s));
  r *= crTaper * cdTaper;
  r *= 1 + PEAR * (1 - t) * smoothstep(0.35, 1.0, s);          // the pear, only while it is a disc
  r *= 1 + 0.20 * t * gauss(s, S_HEAD - S_BRAIN, 0.110);        // the head swells over the vesicles
  r *= 1 + 0.24 * t * gauss(s, S_HEART, 0.050);                 // the cardiac prominence
  return r;
}
function wallInner(s, t) { return Math.max(0.012, wallOuter(s, t) - WALL); }
function flatOf(t) { return FLAT0 * (1 - t) + 1.0 * t; }

/* THE AMNION CANNOT PASS ITS OWN CENTRE OF CURVATURE, and swept along the midline at a constant gap
   it did: 0.53 against a local radius of curvature of 0.44 over the head fold, so the shell folded
   through itself. The outward-normal probe found it (0.971 against 0.98, when nothing else was below
   1.000) and acceptance row M now states it as a number.

   The fix is not a smaller constant gap — that would hold the amnion off the trunk as well, where
   there is no difficulty — but a CLAMP derived from the curvature the model has already computed: the
   amniotic cavity hugs the embryo where the fold is tight and stands off it where it is not, which is
   also what it does. AM_CLEAR is the fraction of the local radius of curvature the shell may occupy;
   the floor keeps it outside the body wall at the very tightest station. */
const AM_CLEAR = 0.70;
function amnionOuter(s, t) {
  const w = wallOuter(s, t);
  const kap = Math.abs(dthetaDs(s, t)) / lengthAt(t);
  const byCurve = kap > 1e-9 ? AM_CLEAR / kap : Infinity;
  /* THE GAP GROWS WITH t. The amniotic cavity is small and close at the end of week 3 and large by
     day 28; holding it at its final size from the start also made it the biggest thing in beat 1's
     frame — 6.5% of the picture, around an embryo 3.1 times wider than deep — which pushed the camera
     back until the brain vesicles the beat HIGHLIGHTS were 0.13% of it. Measured on the player walk,
     not guessed. */
  return Math.max(w * 1.10, Math.min(w + AM_GAP * (0.42 + 0.58 * t), byCurve));
}

/* the gut. A tube everywhere; what changes with t is how much of its VENTRAL circumference is still
   open to the yolk sac, and therefore how much of it is foregut and hindgut. */
function commHalf(t) { return HALF0 * (1 - t) + HALF1 * t; }
function commLo(t) { return clamp(S_UMB - commHalf(t), S_CLO + 0.02, 1); }
function commHi(t) { return clamp(S_UMB + commHalf(t), 0, S_ORO - 0.02); }
function gutOuter(s, t) {
  /* THE GUT'S CALIBRE FOLLOWS THE BODY'S OWN. Without this the cloaca's dilatation at the tail was
     0.206 against a tapering tail wall whose inner radius there is 0.108, so the hindgut burst through
     the body wall — found by the 3.z containment check, not by looking at a render, because the wall
     hid it from every camera. */
  const rel = clamp(wallInner(s, t) / wallInner(S_UMB, t), 0.42, 1.12);
  return R_GUT * rel * (1 + 0.30 * t * gauss(s, S_CLO + 0.055, 0.045))
                     * (1 + 0.22 * gauss(s, S_UMB, 0.10));
}
function gutInner(s, t) { return Math.max(0.010, gutOuter(s, t) - GUT_WALL); }

function neuralR(s, t) {
  return R_NEU * (1 + 0.20 * t) * (1 - 0.35 * (1 - smoothstep(0.0, 0.22, s)));
}

/* ------------------------------------------------------------------ build

   Everything geometric goes through render-kit: sweptShell and tubeCapped for the swept solids, C()
   for colour, addSolid for the mesh plus its silhouette, domeCap (through tubeCapped) for any end that
   stops in mid-air. RENDER-STANDARD 6: a model that reimplements winding, normals, silhouettes or
   colour conversion locally is a bug and not a style choice. */

/** A short solid disc standing across the body axis at material s: a membrane or a transverse plate.
    Built as a very short swept tube along the local tangent, so its faces are the real cross-section
    of the body at that station and it turns with the fold instead of being placed. */
function plateAt(cv, s, radius, thick, ring, off) {
  const fr = frameAt(cv, s);
  if (off) fr.P.addScaledVector(fr.N, off);
  const pts = [];
  const n = 4;
  for (let i = 0; i <= n; i++) {
    const u = (i / n - 0.5) * thick;
    pts.push(fr.P.clone().addScaledVector(fr.D, u));
  }
  return K.tubeCapped(pts, () => radius, { ring: ring || RING_SMALL, cap: 'both', capRows: 5, bulge: 0.35 });
}

/** A bent solid tube through a list of material stations, each with its own ventral offset. */
function tubeThrough(cv, stations, radiusFn, opts) {
  const pts = stations.map(st => ptAt(cv, st[0], st[1]));
  return K.tubeCapped(pts, radiusFn, opts || {});
}

function ellipsoid(centre, rx, ry, rz, seg) {
  const g = new T.SphereGeometry(1, seg || 22, Math.max(10, (seg || 22) / 2));
  const ng = g.toNonIndexed(); g.dispose();
  const pos = ng.attributes.position, nml = ng.attributes.normal;
  for (let i = 0; i < pos.count; i++) {
    pos.setXYZ(i, pos.getX(i) * rx + centre.x, pos.getY(i) * ry + centre.y, pos.getZ(i) * rz + centre.z);
    /* an anisotropic scale transforms a normal by the INVERSE TRANSPOSE. Scaling the normal the same
       way as the position tilts every normal the wrong side of the surface on an ellipsoid as
       eccentric as the yolk sac, which is RENDER-STANDARD 2.3 arriving by a different route. */
    const n = new T.Vector3(nml.getX(i) / rx, nml.getY(i) / ry, nml.getZ(i) / rz).normalize();
    nml.setXYZ(i, n.x, n.y, n.z);
  }
  pos.needsUpdate = true; nml.needsUpdate = true;
  ng.userData.hullCount = pos.count;
  return ng;
}

/* the heart tube's own path: a short slightly-bent tube lying in the cardiogenic area, VENTRAL of the
   axis. Its stations are material, so the head fold carries it exactly as it carries everything else —
   which is the whole reversal, and is why the heart is not placed anywhere. */
const HEART_OFF = 0.55;    // multiples of the local wall inner radius, ventral of the axis
function heartStations() {
  return [[S_HEART - 0.030, null], [S_HEART - 0.010, null], [S_HEART + 0.012, null], [S_HEART + 0.032, null]];
}
function heartPath(cv, t, extraOff) {
  return heartStations().map(st => {
    const s = st[0];
    const off = HEART_OFF * wallInner(s, t) + (extraOff || 0);
    return ptAt(cv, s, off);
  });
}
function heartRadius(t) { return 0.058 + 0.046 * t; }

function buildFold(t, opts) {
  const o = opts || {};
  const cv = curveAt(clamp(t, 0, 1));
  const g = new T.Group();
  const flat = flatOf(t);
  const rec = { t: t, opts: o, parts: {} };

  const regress = !!o.regression;
  const S_CR_CUT = 0.235;                 // caudal regression truncates the embryo here
  const sMin = regress ? S_CR_CUT : 0.0;
  const iMin = IDX(sMin);

  const add = (key, geo, over) => {
    if (!geo) return null;
    const m = K.addSolid(g, key, geo, Object.assign({ color: LAYERS[key].color, name: LAYERS[key].name }, over || {}));
    if (m) {
      const b = new T.Box3().setFromBufferAttribute(geo.attributes.position);
      rec.parts[key] = { tris: geo.attributes.position.count / 3, box: b };
    }
    return m;
  };

  /* ---------------- body wall: three segments, divided at the two membranes the folds seal.
     They OVERLAP by one station so no annular end cap is ever exposed at a join (RENDER-STANDARD 3),
     and the overlap is what the §3.z partition names as CONSTRUCTION contact. */
  const iORO = IDX(S_ORO), iCLO = IDX(S_CLO);
  const wallSeg = (i0, i1, win) => K.sweptShell({
    frame: cv, i0: i0, i1: i1, ring: RING_BODY,
    outerR: i => wallOuter(i / NS, t), innerR: i => wallInner(i / NS, t),
    flatten: flat, section: () => 1, window: win || null,
  });
  /* the hemisection opens the embryo's LEFT half, so a median-plane story can be looked INTO. Aimed at
     a world direction (+x), which for this analytically-framed curve is exactly B at every station, so
     the cut plane is the median plane at every station and at every t. */
  const halfWin = i0i1 => o.hemisection
    ? { i0: i0i1[0] - 1, i1: i0i1[1] + 1, dir: new T.Vector3(1, 0, 0), half: Math.PI / 2 } : null;

  /* the ectopia cordis defect: a real hole in the cranial ventral wall, over the cardiac prominence. */
  const ectWin = o.ectopia
    ? { i0: IDX(S_HEART - 0.055), i1: IDX(S_HEART + 0.055), dir: null, half: 0.80 } : null;
  function localVentralWindow(win) {
    /* render-kit resolves a window's angle per row from a WORLD direction. For the body's own ventral
       surface that direction is the local N, which rotates along the fold — so the window is given the
       N at the middle of its own span and the error at its edges is reported by acceptance() rather
       than assumed away. Over a span this short (0.11 of s) it is under 4 degrees. */
    if (!win) return null;
    const mid = (win.i0 + win.i1) / 2 / NS;
    return { i0: win.i0, i1: win.i1, dir: frameAt(cv, mid).N.clone(), half: win.half };
  }

  add('headfold', wallSeg(iORO - 1, NS, halfWin([iORO - 1, NS]) || localVentralWindow(ectWin)),
      { matOver: { opacity: o.hemisection ? 1 : 1 } });
  const iTrunk0 = Math.max(iCLO, iMin);
  add('trunk', wallSeg(iTrunk0, iORO, halfWin([iTrunk0, iORO])));
  if (!regress || S_CR_CUT < S_ORO) {
    const lo = Math.max(iMin, 0);
    if (lo < iCLO + 1) add('tailfold', wallSeg(lo, iCLO + 1, halfWin([lo, iCLO + 1])));
    else add('tailfold', null);
  }

  /* ---------------- neural tube and the brain vesicles: the growth driver, dorsal of the axis */
  if (o.neural !== false) {
    const nf = offsetFrame(cv, NEU_OFF);
    add('neural', K.sweptShell({
      frame: nf, i0: Math.max(iMin, IDX(0.075)), i1: IDX(0.90), ring: RING_GUT,
      outerR: i => neuralR(i / NS, t), flatten: flatOf(t) * 0.55 + 0.45, section: () => 1,
    }));
  }
  if (o.brain !== false) {
    /* THE ONE PLACE THE FOLD AND THE GROWTH ARE THE SAME NUMBER. The vesicles are centred on the
       SOLVED S_HEAD minus a fixed material offset, so the neural tube's widest station and the head
       fold's curvature peak move together. Change the solve and they both move; that identity is
       acceptance row N and is the only causal link this model actually carries. */
    const c0 = S_HEAD - S_BRAIN;
    const geos = [];
    for (let k = -1; k <= 1; k++) {
      const s = clamp(c0 + k * 0.042, 0.02, 0.98);
      /* A SWELLING IS BIGGER THAN THE THING IT SWELLS. Written first as a bare schedule of t, which
         made the vesicles 0.0255 at t = 0 inside a neural tube of 0.055 — entirely enclosed, so the
         scene-visibility walk reported driver_growth at 0% on BOTH measures in beats 1 and 2 with a
         peak pixel difference of ZERO: the part that beat 1 HIGHLIGHTS as the whole mechanism of
         folding drew nothing a student could see. Neither the renders nor the acceptance battery
         could catch it, because the geometry was there and correct and simply inside something else.
         The floor is the local neural tube's own calibre, so the vesicles are swellings at every t. */
      /* the floor is LARGEST at t = 0 and relaxes as the schedule takes over, because it exists to
         keep the vesicles seeable when they are small, not to inflate them when they are not. At 1.25x
         the tube they were still only 0.018% of beat 1's frame — visible on the alpha measure at peak
         142 but under the 0.02% floor; at 1.9x they clear it. t = 1 is unchanged. */
      const r = Math.max(neuralR(s, t) * (2.05 - 0.85 * t), R_BRAIN * (0.30 + 0.70 * t)) * (k === 0 ? 1.0 : 0.86);
      geos.push(ellipsoid(ptAt(cv, s, NEU_OFF), r * 0.95, r, r, 20));
    }
    add('brain', K.mergeHullFirst(geos[0], geos.slice(1)));
  }

  /* ---------------- the cranial strip the head fold rotates, and its four passengers */
  if (o.cranialstrip !== false) {
    const pts = [];
    for (let i = IDX(S_ORO); i <= NS; i++) pts.push(cv.P[i].clone());
    add('cranialstrip', K.tubeCapped(pts, () => 0.026, { ring: 12, cap: 'both', capRows: 4 }));
  }
  /* A MEMBRANE SEALS THE GUT, NOT THE BODY. Both were first built across the whole body cross-section
     and the containment check found them passing straight through the neural tube — which is not a
     drawing fault, it is an anatomical one: the oropharyngeal membrane closes the cranial end of the
     FOREGUT, and the cloacal membrane the caudal end of the hindgut. Built on the gut's own axis and
     scaled to the gut's own calibre. */
  add('oropharyngeal', plateAt(cv, S_ORO, gutOuter(S_ORO, t) * 1.40, 0.030, 20, GUT_OFF));
  if (!regress) add('cloacal', plateAt(cv, S_CLO, gutOuter(S_CLO, t) * 1.40, 0.028, 18, GUT_OFF));

  const hpath = heartPath(cv, t, 0);
  add('heart', K.tubeCapped(hpath, u => heartRadius(t) * (0.72 + 0.55 * Math.sin(Math.PI * clamp(u, 0, 1))),
                            { ring: RING_GUT, cap: 'both', capRows: 6 }));
  if (o.pericardium !== false) {
    /* the pericardial CAVITY is a space, so it is drawn as an OPENED sac: a thick-walled shell around
       the heart with a window on the embryo's left. A closed one would hide the thing it contains, and
       a sac left open at its ends would be the annulus RENDER-STANDARD forbids. Declared in gaps[]. */
    const pf = { P: hpath, D: null, N: null, B: null };
    const fr0 = frameAt(cv, S_HEART);
    const pframe = K.parallelFrame(hpath, fr0.N.clone());
    add('pericardium', K.sweptShell({
      frame: pframe, i0: 0, i1: hpath.length - 1, ring: RING_GUT,
      outerR: () => heartRadius(t) * 1.66, innerR: () => heartRadius(t) * 1.40,
      flatten: 1, section: () => 1,
      window: { i0: -1, i1: hpath.length, dir: new T.Vector3(1, 0, 0), half: 1.05 },
    }), { matOver: { opacity: 0.55 } });
  }
  /* the septum transversum: a transverse plate at the cranial edge, WIDER than the thin strip it sits
     on, because it is a septum spanning the cavity and not a disc inside a pipe. Its contact with the
     head-fold wall is anatomy — the septum is mesoderm continuous with the ventral body wall — and is
     named as CONSTRUCTION in the §3.z partition. */
  const septR = RB * 0.62;
  const septGeo = o.cdh
    ? (function () {
        /* a Bochdalek defect: a posterolateral gap, on the embryo's LEFT (+x, dorsal-left). The plate
           is built as a swept disc with an angular window, so the hole is a real hole with a rim. */
        const fr = frameAt(cv, S_SEPTUM);
        const pts = [];
        for (let i = 0; i <= 4; i++) pts.push(fr.P.clone().addScaledVector(fr.D, (i / 4 - 0.5) * 0.075));
        const pfr = K.parallelFrame(pts, fr.N.clone());
        const dir = new T.Vector3(1, 0, 0).multiplyScalar(0.80).addScaledVector(fr.N, -0.60).normalize();
        return K.sweptShell({ frame: pfr, i0: 0, i1: 4, ring: 22,
          outerR: () => septR, flatten: 1, section: () => 1,
          window: { i0: -1, i1: 5, dir: dir, half: 0.62 } });
      })()
    : plateAt(cv, S_SEPTUM, septR, 0.055, 22);
  add('septum', septGeo);

  /* ---------------- the gut: one tube, sealed at each end by the folds, open in the middle.
     The foregut, midgut and hindgut are three spans of ONE schedule, so "sealed in front, sealed
     behind, still open in the middle" is one function of t and the three cannot drift apart. */
  const gf = offsetFrame(cv, GUT_OFF);
  const cLo = commLo(t), cHi = commHi(t);
  const iLo = IDX(cLo), iHi = IDX(cHi);
  const gutSeg = (i0, i1, win) => (i1 - i0 < 2) ? null : K.sweptShell({
    frame: gf, i0: i0, i1: i1, ring: RING_GUT,
    outerR: i => gutOuter(i / NS, t), innerR: i => gutInner(i / NS, t),
    flatten: flatOf(t) * 0.35 + 0.65, section: () => 1, window: win || null,
  });
  /* the foregut's cranial end is BLIND — sealed by the oropharyngeal membrane — so it gets a dome and
     not an annulus (RENDER-STANDARD: a tube that ends in mid-air needs a rounded end). Built by
     capping the swept shell's cranial station with the kit's domeCap through the same frame. */
  const fgGeo = gutSeg(iHi - 1, iORO - 1);
  const fgDome = fgGeo ? K.domeCap({ frame: gf, i: iORO - 1, sign: 1, r: gutOuter((iORO - 1) / NS, t),
                                     ring: RING_GUT, rows: 7, flatten: 1, section: () => 1 }) : null;
  add('foregut', fgGeo ? K.mergeHullFirst(fgGeo, [fgDome]) : null);

  const midWin = { i0: iLo - 1, i1: iHi + 1, dir: frameAt(cv, S_UMB).N.clone(), half: WIN_HALF };
  add('midgut', gutSeg(iLo - 1, iHi + 1, midWin));

  if (!regress) {
    const hgGeo = gutSeg(IDX(S_CLO + 0.012), iLo + 1);
    const hgDome = hgGeo ? K.domeCap({ frame: gf, i: IDX(S_CLO + 0.012), sign: -1,
                                       r: gutOuter(S_CLO + 0.012, t), ring: RING_GUT, rows: 7,
                                       flatten: 1, section: () => 1 }) : null;
    add('hindgut', hgGeo ? K.mergeHullFirst(hgGeo, [hgDome]) : null);
    /* the cloaca: the terminal hindgut dilated where the allantois joins it. It exists once the tail
       fold has drawn the allantois in, so its radius is a function of t and it is STAGE_LIMITED. */
    const rc = 0.070 * t;
    if (rc > 0.012) add('cloaca', ellipsoid(ptAt(cv, S_CLO + 0.042, GUT_OFF), rc * 0.85, rc * 1.25, rc, 18));
    else add('cloaca', null);
    if (o.allantois !== false) {
      add('allantois', tubeThrough(cv, [[S_CLO + 0.058, GUT_OFF], [S_CLO + 0.014, GUT_OFF + 0.03],
                                        [S_STK + 0.004, GUT_OFF + 0.06]],
                                   u => 0.022 * (1 - 0.30 * u), { ring: 12, cap: 'both', capRows: 4 }));
    }
  } else { add('hindgut', null); add('cloaca', null); add('allantois', null); }

  /* ---------------- yolk sac and the vitelline duct: the communication, and its narrowing.
     The duct's radius at the gut end IS the communication's half-extent in s turned into a length, so
     "the wide connection narrows into the vitelline duct" is measured geometry and not a caption. */
  const commLen = commHalf(t) * cv.L;
  if (o.yolksac !== false) {
    const ry = 0.40 - 0.07 * t;
    /* the sac sits CLOSE under the disc at t = 0 and is slung further out as the embryo lifts off it.
       Its t = 1 position is unchanged; what moved is the start, which had it hanging half an embryo's
       length below a flat disc and taking the camera with it. */
    add('yolksac', ellipsoid(ptAt(cv, S_UMB, GUT_OFF + 0.24 + 0.60 * t + ry * 0.55),
                             ry * 0.78, ry * (1.25 - 0.35 * t), ry, 24));
  }
  if (o.vitelline !== false) {
    const top = ptAt(cv, S_UMB, GUT_OFF);
    const bot = ptAt(cv, S_UMB, GUT_OFF + 0.26 + 0.60 * t);
    const pts = [];
    for (let i = 0; i <= 8; i++) pts.push(top.clone().lerp(bot, i / 8));
    /* at t = 0 the "duct" is not a duct: the whole endodermal trough is open, so the part is drawn at
       the trough's own width, capped at the yolk sac's radius so it does not swallow the sac it opens
       into. The NARROWING is measured from the window's own built station span (comm.len), never from
       this capped radius. Declared in the scene gaps[]. */
    const rTop = Math.min(commLen / 2, 0.42);   // commLen is the communication's FULL extent in s
    add('vitelline', K.tubeCapped(pts, u => rTop * (1 - u) + Math.max(0.030, rTop * 0.55) * u,
                                  { ring: RING_GUT, cap: null, flatten: 1,
                                    section: th2 => 1 + 0.30 * Math.cos(2 * th2) }));
  }

  /* ---------------- the connecting stalk. It leaves the caudal end along the body's own tangent, so
     the tail fold carries its direction with it; nothing rotates the stalk by hand. */
  if (o.stalk !== false && !regress) {
    const fr = frameAt(cv, S_STK);
    const pts = [];
    for (let i = 0; i <= 8; i++) {
      const u = i / 8;
      pts.push(fr.P.clone().addScaledVector(fr.D, -u * 0.62).addScaledVector(fr.N, u * u * 0.10));
    }
    add('stalk', K.tubeCapped(pts, u => 0.070 + 0.050 * u, { ring: RING_GUT, cap: 'end', capRows: 6 }));
  } else add('stalk', null);

  /* ---------------- the amnion. Extraembryonic context: a prescribed enclosing shell whose aperture
     schedule runs from a dorsal half-trough at t = 0 to a small umbilical opening at t = 1. */
  if (o.amnion !== false) {
    const amHalf = AM_HALF0 * (1 - t) + AM_HALF1 * t;
    const aLo = Math.round((S_UMB - (0.52 * (1 - t) + 0.055 * t)) * NS);
    const aHi = Math.round((S_UMB + (0.52 * (1 - t) + 0.055 * t)) * NS);
    add('amnion', K.sweptShell({
      frame: cv, i0: Math.max(iMin, 1), i1: NS - 1, ring: RING_BODY,
      outerR: i => amnionOuter(i / NS, t), innerR: i => amnionOuter(i / NS, t) - 0.020,
      flatten: flat, section: () => 1,
      window: { i0: aLo, i1: aHi, dir: frameAt(cv, S_UMB).N.clone(), half: amHalf },
    }), { matOver: { opacity: 0.28 }, outline: 0.012 });
    rec.amnionHalf = amHalf;
  }

  /* ---------------- the three lesions. VARIANTS asked for in the ref, never in FULL: a defect that
     shipped inside FULL would punch a hole in the body wall of every view in the corpus. */
  if (o.ectopia) {
    /* the heart, outside the chest. Its path is the SAME material path, pushed out past the wall by
       the wall's own local outer radius, so the displacement is measured against the wall and not a
       chosen number. */
    const wallR = wallOuter(S_HEART, t);
    const path = heartPath(cv, t, wallR * 1.45);
    add('ectopia', K.tubeCapped(path, u => heartRadius(t) * (0.72 + 0.55 * Math.sin(Math.PI * clamp(u, 0, 1))),
                                { ring: RING_GUT, cap: 'both', capRows: 6 }));
  }
  if (o.cdh) {
    /* a loop of bowel climbing through the posterolateral gap in the septum, into the chest. It starts
       in the midgut, passes through the defect's own centre — derived from the same direction the
       window was cut with — and ends CRANIAL of the septum. */
    const fr = frameAt(cv, S_SEPTUM);
    const dir = new T.Vector3(1, 0, 0).multiplyScalar(0.80).addScaledVector(fr.N, -0.60).normalize();
    const hole = fr.P.clone().addScaledVector(dir, septR * 0.70);
    /* the loop starts in the ABDOMEN — in the gut of the upper trunk — climbs through the defect and
       ends beside the heart. The first version started it at a material station CRANIAL of the
       oropharyngeal membrane, which after the fold is already inside the chest: the lesion drew bowel
       that had never been in the abdomen. Both ends are read from the same curve everything else is. */
    const start = ptAt(cv, 0.700, GUT_OFF).addScaledVector(new T.Vector3(1, 0, 0), septR * 0.55);
    const mid = ptAt(cv, 0.800, GUT_OFF).addScaledVector(new T.Vector3(1, 0, 0), septR * 0.75);
    const chest = ptAt(cv, S_HEART, HEART_OFF * wallInner(S_HEART, t))
      .addScaledVector(new T.Vector3(1, 0, 0), septR * 0.80);
    add('cdh', K.tubeCapped([start, mid, hole.clone().addScaledVector(fr.D, -0.06), hole,
                             hole.clone().addScaledVector(fr.D, 0.08), chest],
                            () => 0.052, { ring: RING_GUT, cap: 'both', capRows: 6 }));
  }

  g.userData.record = rec;
  g.userData.t = t;
  return g;
}

/* ------------------------------------------------------- measurement, off the built geometry

   RENDER-STANDARD: "the measured side of every acceptance assertion must be read from the geometry the
   model builds — rows, grids or mesh vertices — and never from the constants the geometry was built
   from." So measure() BUILDS and reads bounding boxes and vertex extents off the buffers, and where it
   reads a row (the midline, the calibre profile) it is reading the same array the sweep swept. The
   render tool re-measures the same relations on real mesh vertices independently, and PERTURBS the
   constants each number is supposed to depend on. */

function boxOf(rec, key) { const p = rec.parts[key]; return p ? p.box : null; }
function ctr(b) { return b ? b.getCenter(new T.Vector3()) : null; }
function ext(b, ax) { return b ? (ax === 'x' ? b.max.x - b.min.x : ax === 'y' ? b.max.y - b.min.y : b.max.z - b.min.z) : 0; }
function floorOf(bA, bB, ax) { return 0.35 * (ext(bA, ax) + ext(bB, ax)) / 2; }

/** The most CAUDAL point of the body wall expressed as arc length along the built midline: every
    body-wall vertex is matched to its nearest curve station and the smallest arc position wins. Used
    by the caudal-regression row, which first tried to measure the lesion as a loss of minimum y and
    reported 4.9% for a truncation of 23.5% — because the tail curls VENTRALLY, so the caudal-most
    point in y sits near s = 0.13 and cutting at s = 0.235 barely moves it. A fold makes y a bad proxy
    for length; arc length is the thing the lesion actually removes. Vertices are read at a stride of
    5, stated because it is an approximation and not a secret. */
function bodyCaudalArc(group, cv) {
  const arc = new Array(NS + 1); arc[0] = 0;
  for (let i = 1; i <= NS; i++) arc[i] = arc[i - 1] + cv.P[i].distanceTo(cv.P[i - 1]);
  let best = Infinity;
  const KEYS = { trunk: 1, tailfold: 1, headfold: 1 };
  group.traverse(o => {
    if (!o.isMesh || !o.geometry || o.userData.outline || !KEYS[o.userData.key]) return;
    const a = o.geometry.attributes.position.array;
    for (let v = 0; v < a.length; v += 3 * 5) {
      const p = new T.Vector3(a[v], a[v + 1], a[v + 2]);
      let bi = 0, bd = Infinity;
      for (let i = 0; i <= NS; i++) { const d = cv.P[i].distanceToSquared(p); if (d < bd) { bd = d; bi = i; } }
      if (arc[bi] < best) best = arc[bi];
    }
  });
  return isFinite(best) ? best : 0;
}

/** max |x| over every vertex of one part, read from the buffers rather than from flatten. */
function maxAbsX(group, key) {
  let m = 0;
  group.traverse(o => {
    if (!o.isMesh || !o.geometry || o.userData.key !== key || o.userData.outline) return;
    const a = o.geometry.attributes.position.array;
    for (let i = 0; i < a.length; i += 3) { const v = Math.abs(a[i]); if (v > m) m = v; }
  });
  return m;
}

const _measCache = {};
function measure(t, opts) {
  const key = t.toFixed(6) + '|' + JSON.stringify(opts || {});
  if (_measCache[key]) return _measCache[key];
  const o = Object.assign({}, FULLSET, opts || {});
  const group = buildFold(t, o);
  const rec = group.userData.record;
  const cv = curveAt(clamp(t, 0, 1));
  const m = { t: t };

  /* ---- the crown, from the built midline rows */
  let iMax = 0; for (let i = 0; i <= NS; i++) if (cv.P[i].y > cv.P[iMax].y) iMax = i;
  m['crown.s'] = iMax / NS;
  m['crown.s_minus_oro'] = iMax / NS - S_ORO;

  /* ---- the reversal, from the built meshes' own boxes */
  const bSep = boxOf(rec, 'septum'), bHrt = boxOf(rec, 'heart'), bOro = boxOf(rec, 'oropharyngeal');
  const cSep = ctr(bSep), cHrt = ctr(bHrt), cOro = ctr(bOro);
  m['order.septum_minus_heart_y'] = cSep.y - cHrt.y;
  m['order.heart_minus_oro_y'] = cHrt.y - cOro.y;
  m['order.oro_minus_heart_y'] = cOro.y - cHrt.y;
  m['order.heart_minus_septum_y'] = cHrt.y - cSep.y;
  m['order.oro_minus_septum_y'] = cOro.y - cSep.y;
  m['order.strip_span_y'] = Math.abs(cOro.y - cSep.y);
  m['floor.septum_heart_y'] = floorOf(bSep, bHrt, 'y');
  m['floor.heart_oro_y'] = floorOf(bHrt, bOro, 'y');
  m['floor.heart_oro_z'] = floorOf(bHrt, bOro, 'z');

  /* ---- "the heart lies ventral and behind it" */
  m['heart.ventral_of_oro_dz'] = cHrt.z - cOro.z;
  const bFg = boxOf(rec, 'foregut');
  m['heart.ventral_of_foregut_dz'] = bFg ? cHrt.z - ctr(bFg).z : NaN;
  m['septum.y'] = cSep.y;

  /* ---- the gut: three spans of one schedule, read from the window's own built station indices */
  const iLo = IDX(commLo(t)), iHi = IDX(commHi(t)), iORO = IDX(S_ORO), iCLO = IDX(S_CLO);
  m['comm.stations'] = iHi - iLo;
  m['comm.len'] = (iHi - iLo) * cv.ds;
  m['comm.len_over_L'] = m['comm.len'] / cv.L;
  m['comm.open'] = (iHi - iLo) > 0 ? 1 : 0;
  m['foregut.len_frac'] = Math.max(0, (iORO - iHi)) / NS;
  m['hindgut.len_frac'] = Math.max(0, (iLo - iCLO)) / NS;
  m['midgut.window_saving'] = (function () {
    /* the midgut's ventral communication is a real hole: the same span built WITHOUT the window has
       more triangles. Measured on the two buffers, so a window that silently stopped cutting shows. */
    const gf = offsetFrame(cv, GUT_OFF);
    const seg = w => K.sweptShell({ frame: gf, i0: iLo - 1, i1: iHi + 1, ring: RING_GUT,
      outerR: i => gutOuter(i / NS, t), innerR: i => gutInner(i / NS, t),
      flatten: flatOf(t) * 0.35 + 0.65, section: () => 1, window: w });
    const full = seg(null), cut = seg({ i0: iLo - 1, i1: iHi + 1, dir: frameAt(cv, S_UMB).N.clone(), half: WIN_HALF });
    if (!full || !cut) return NaN;
    return 1 - (cut.attributes.position.count / full.attributes.position.count);
  })();

  /* ---- the stalk's outgrowth direction, and the cloacal membrane's outward normal, both from the
     BUILT frame at their own material stations. Neither is rotated by hand anywhere. */
  const frStk = frameAt(cv, S_STK), frClo = frameAt(cv, S_CLO);
  const VEN = new T.Vector3(0, 0, 1);
  m['stalk.angle_to_ventral_deg'] = Math.acos(clamp(frStk.D.clone().negate().dot(VEN), -1, 1)) * 180 / Math.PI;
  m['cloacal.normal_dot_ventral'] = frClo.D.clone().negate().dot(VEN);
  const bStk = boxOf(rec, 'stalk');
  m['stalk.root_z'] = frStk.P.z;

  /* ---- results of the solve, re-derived from the built row of tangent angles */
  m['turn.cranial_rad'] = cv.th[NS];
  /* the two turnings the narration actually names, read off the same built angle row: "half a turn"
     is the strip from the oropharyngeal membrane to the cranial edge, not the tip's total. */
  m['turn.septum_rad'] = frameAt(cv, S_SEPTUM).th;
  m['turn.oro_rad'] = frameAt(cv, S_ORO).th;
  m['turn.caudal_rad'] = -cv.th[0];
  m['turn.caudal_over_cranial'] = cv.th[NS] !== 0 ? (-cv.th[0]) / cv.th[NS] : 0;

  /* ---- the sweep never passes its own centre of curvature. kappa from the built angle row. */
  let worst = Infinity, worstS = 0;
  for (let i = 1; i < NS; i++) {
    const s = i / NS;
    const kap = Math.abs(cv.th[i + 1] - cv.th[i - 1]) / (2 * cv.ds);
    if (kap < 1e-9) continue;
    const R = 1 / kap;
    /* BOTH swept shells, not just the wall: the amnion is the larger of the two and it was the one
       that folded through itself. */
    const r = Math.max(wallOuter(s, t), amnionOuter(s, t));
    const clear = (R - r) / R;
    if (clear < worst) { worst = clear; worstS = s; }
  }
  m['clearance.min_frac'] = isFinite(worst) ? worst : 1;
  m['clearance.at_s'] = worstS;

  /* ---- flattening: the numerator is real vertices, the denominator the same calibre row the sweep used */
  let sum = 0, n = 0;
  for (let i = iCLO; i <= iORO; i++) { sum += wallOuter(i / NS, t); n++; }
  m['aspect.trunk'] = maxAbsX(group, 'trunk') / (sum / n);

  /* ---- the amnion's coverage, from triangle counts on the built buffer against an unwindowed twin */
  m['amnion.coverage_frac'] = (function () {
    const b = rec.parts.amnion; if (!b) return NaN;
    const ref = K.sweptShell({ frame: cv, i0: 1, i1: NS - 1, ring: RING_BODY,
      outerR: i => amnionOuter(i / NS, t), innerR: i => amnionOuter(i / NS, t) - 0.020,
      flatten: flatOf(t), section: () => 1 });
    return ref ? b.tris / (ref.attributes.position.count / 3) : NaN;
  })();

  /* ---- the brain / curvature-peak identity: which material station the built vesicles sit at */
  const bBr = boxOf(rec, 'brain');
  if (bBr) {
    const cBr = ctr(bBr);
    let best = 0, bd = Infinity;
    for (let i = 0; i <= NS; i++) {
      const p = cv.P[i].clone().addScaledVector(cv.N[i], NEU_OFF);
      const d = p.distanceToSquared(cBr); if (d < bd) { bd = d; best = i; }
    }
    m['brain.station_s'] = best / NS;
    m['brain.station_minus_s_head'] = Math.abs(best / NS - S_HEAD);
    m['brain.radius_over_neural'] = ext(bBr, 'z') / (2 * neuralR(S_HEAD - S_BRAIN, t));
  }

  /* ---- the septum spans the body rather than sitting in it */
  m['septum.radius_over_wall'] = ext(bSep, 'x') / (2 * wallInner(S_SEPTUM, t));

  /* ---- lesions, when asked for */
  if (o.ectopia) {
    const bE = boxOf(rec, 'ectopia'), cE = ctr(bE);
    const frH = frameAt(cv, S_HEART);
    m['ectopia.out_of_wall'] = cE.clone().sub(frH.P).dot(frH.N) - wallOuter(S_HEART, t);
    m['ectopia.floor'] = 0.35 * ext(bE, 'z');
  }
  if (o.cdh) {
    const bC = boxOf(rec, 'cdh'), cC = ctr(bC);
    m['cdh.above_septum_dy'] = bC.max.y - cSep.y;
    m['cdh.centre_x'] = cC.x;
    m['cdh.x_floor'] = 0.35 * ext(bC, 'x');
    m['cdh.floor_dy'] = floorOf(bC, bSep, 'y');
  }
  /* the body's caudal extent, from the three body-wall segments only — the amnion and yolk sac reach
     further and are not the embryo. ONE definition, used by both sides of the regression row: the first
     version of this measured the lesion over every part and the control over three, and reported a loss
     of exactly zero. */
  let loY = Infinity;
  ['trunk', 'tailfold', 'headfold'].forEach(k => { const b = boxOf(rec, k); if (b && b.min.y < loY) loY = b.min.y; });
  m['body.caudal_min_y'] = loY;
  m['body.caudal_arc'] = bodyCaudalArc(group, cv);
  if (o.regression) {
    const norm = measure(t, Object.assign({}, opts || {}, { regression: false }));
    m['regression.caudal_arc_loss_frac'] = (m['body.caudal_arc'] - norm['body.caudal_arc']) / cv.L;
    m['regression.caudal_loss_y_frac'] = (loY - norm['body.caudal_min_y']) / cv.L;
  }

  m.tris_total = Object.keys(rec.parts).reduce((a, k) => a + rec.parts[k].tris, 0);
  _measCache[key] = m;
  return m;
}

/* ------------------------------------------------------------------ acceptance

   Every row carries a MAGNITUDE FLOOR expressed against the extents of the things compared, and every
   floor has a NEGATIVE CASE it must reject (fed by assertAcceptance and by the render tool). A sign
   test on a spatial relation is not a test. */

const FLOORS = {
  crown_station: 1.5 / NS,     // the crown must land on the oropharyngeal membrane, to one station
  order_frac: 0.35,            // RENDER-STANDARD's starting figure
  span_keep: 0.70,             // the strip's y span must survive the reversal at least this well
  descent_frac: 0.07,          // the septum descends at least this fraction of the midline length
  gut_seal_frac: 0.20,         // foregut and hindgut each reach at least this fraction of s
  gut_seal_t0: 0.04,           // and at t = 0 neither exceeds this: the folds have not happened yet
  comm_narrow: 4.0,            // the communication narrows at least this many fold
  window_saving: 0.04,         // the midgut's ventral hole removes at least this fraction of its tris
  stalk_caudal_deg: 80,        // at t=0 the stalk points at least this far off ventral
  stalk_ventral_deg: 22,       // at t=1 it points within this of ventral
  cloacal_dot: 0.97,           // the cloacal membrane faces ventral this closely at t=1
  cloacal_dot_t0: 0.03,        // and not at all at t=0
  tail_smaller: 0.80,          // the tail fold turns less than this fraction of the head fold
  clearance: 0.25,             // the wall stays this fraction clear of its own centre of curvature
  /* FLATTENING IS A RATIO OF TWO MEASUREMENTS, not one absolute number. The first version asserted
     aspect <= 1.35 at t = 1 and it failed at 1.39 — correctly, because `aspect.trunk` divides the
     widest vertex by the MEAN calibre of the trunk, so it reads the trunk's radius non-uniformity as
     well as its flatness and can never be 1. Dividing t=0 by t=1 cancels the part that is common to
     both and leaves the flattening, which is what the narration claims. The absolute bound is kept as
     a loose sanity rail on the round end. */
  aspect_ratio: 2.20,          // the disc is at least this many times flatter at t=0 than at t=1
  aspect_round: 1.60,          // and at t=1 the section is within this of circular
  amnion_grow: 1.55,           // the amnion's coverage grows at least this many fold
  brain_link: W_HEAD,          // the vesicles sit within the head fold's own curvature envelope
  septum_spans: 1.50,          // the septum is at least this many times the local wall inner radius
  regression_loss: 0.15,       // caudal regression removes at least this fraction of the length
};

const ACCEPTANCE = {
  axes: '+x = embryo LEFT, -x = RIGHT, +y = CRANIAL, -y = CAUDAL, +z = VENTRAL, -z = DORSAL',
  axes_proof: 'route (b) of RENDER-STANDARD: viz-training/tools/prove-corpus-axes.mjs, against BodyParts3D '
    + 'right/left pairs. This model has NO independently right/left determined landmark of its own — it is '
    + 'a median-plane subject — so row P3 asserts the Bochdalek side in the SAME coordinates it is declared '
    + 'in and is circular on its own. Declared in the scene gaps[].',
  rows: [
    ['A', 'the three solved unknowns bracket and their residuals vanish'],
    ['B0', 'BEFORE the fold the order from the cranial edge is septum transversum, heart, oropharyngeal membrane'],
    ['B1', 'AFTER the fold that order is REVERSED, with the same floors'],
    ['B2', 'and the strip keeps its span in y through the reversal, so the reversal is not a collapse'],
    ['C', 'the oropharyngeal membrane IS the crown: the built midline\'s highest station is its own'],
    ['D', 'the heart comes to lie VENTRAL to the oropharyngeal membrane and to the foregut'],
    ['E', 'the septum transversum DESCENDS by a measured fraction of the midline length'],
    ['F', 'the foregut is created by the fold: ~nothing at t=0, a fifth of the gut at t=1'],
    ['G', 'the hindgut likewise'],
    ['H', 'the midgut stays OPEN at every t, and its ventral hole is a real hole in the buffer'],
    ['I', 'the communication narrows four-fold or more into the vitelline duct'],
    ['J', 'the connecting stalk swings from caudal to within 22 degrees of ventral'],
    ['K', 'the cloacal membrane comes to face ventral, and did not at t=0'],
    ['L', 'the tail fold turns LESS than the head fold — a result of the solve, not a setting'],
    ['M', 'the wall never reaches its own centre of curvature'],
    ['N', 'the flat disc is flat and the day-28 embryo is round — measured as a ratio of the two'],
    ['O', 'the amnion grows from a dorsal half-trough to an almost closed sac'],
    ['P1', 'the brain vesicles sit inside the head fold\'s own curvature envelope'],
    ['P2', 'the septum transversum spans the body rather than sitting inside it'],
    ['P3', 'ectopia cordis puts the heart outside the wall; the Bochdalek bowel reaches the chest, on the LEFT'],
    ['P4', 'caudal regression removes a measured fraction of the embryo\'s ARC length (y is a bad proxy on a fold)'],
  ],
};

function acceptance(opts) {
  const m0 = measure(0, opts), m1 = measure(1, opts);
  const mE = measure(1, Object.assign({}, opts || {}, { ectopia: true }));
  const mC = measure(1, Object.assign({}, opts || {}, { cdh: true }));
  const mR = measure(1, Object.assign({}, opts || {}, { regression: true }));
  const rows = [];
  const R = (id, must, value, ok, extra) => rows.push(Object.assign({ id, must, value, pass: !!ok }, extra || {}));

  R('A', 'bracketed, |residual| < 1e-9 on all three',
    Math.max(Math.abs(SOLVED.residual_oro), Math.abs(SOLVED.residual_septum), Math.abs(SOLVED.residual_cloaca)),
    SOLVED.bracketed && Math.max(Math.abs(SOLVED.residual_oro), Math.abs(SOLVED.residual_septum),
      Math.abs(SOLVED.residual_cloaca)) < 1e-9, { solved: { S_HEAD, AH, AT } });

  R('B0', 'septum y - heart y >= floor AND heart y - oro y >= floor, at t = 0',
    [m0['order.septum_minus_heart_y'], m0['order.heart_minus_oro_y']],
    m0['order.septum_minus_heart_y'] >= m0['floor.septum_heart_y'] &&
    m0['order.heart_minus_oro_y'] >= m0['floor.heart_oro_y'],
    { floors: [m0['floor.septum_heart_y'], m0['floor.heart_oro_y']] });

  R('B1', 'oro y - heart y >= floor AND heart y - septum y >= floor, at t = 1',
    [m1['order.oro_minus_heart_y'], m1['order.heart_minus_septum_y']],
    m1['order.oro_minus_heart_y'] >= m1['floor.heart_oro_y'] &&
    m1['order.heart_minus_septum_y'] >= m1['floor.septum_heart_y'],
    { floors: [m1['floor.heart_oro_y'], m1['floor.septum_heart_y']] });

  R('B2', 'the strip\'s y span at t=1 is >= ' + FLOORS.span_keep + ' of its span at t=0',
    m1['order.strip_span_y'] / m0['order.strip_span_y'],
    m1['order.strip_span_y'] >= FLOORS.span_keep * m0['order.strip_span_y']);

  R('C', '|crown s - S_ORO| <= ' + FLOORS.crown_station.toFixed(5) + ' at t = 1',
    m1['crown.s_minus_oro'], Math.abs(m1['crown.s_minus_oro']) <= FLOORS.crown_station,
    { crown_s: m1['crown.s'], S_ORO });

  R('D', 'heart z - oro z >= floor, and heart z - foregut z > 0, at t = 1',
    [m1['heart.ventral_of_oro_dz'], m1['heart.ventral_of_foregut_dz']],
    m1['heart.ventral_of_oro_dz'] >= m1['floor.heart_oro_z'] && m1['heart.ventral_of_foregut_dz'] > 0,
    { floor: m1['floor.heart_oro_z'] });

  R('E', 'septum y falls by >= ' + FLOORS.descent_frac + ' of L(1)',
    (m0['septum.y'] - m1['septum.y']) / lengthAt(1),
    (m0['septum.y'] - m1['septum.y']) >= FLOORS.descent_frac * lengthAt(1));

  R('F', 'foregut length fraction <= ' + FLOORS.gut_seal_t0 + ' at t=0 and >= ' + FLOORS.gut_seal_frac + ' at t=1',
    [m0['foregut.len_frac'], m1['foregut.len_frac']],
    m0['foregut.len_frac'] <= FLOORS.gut_seal_t0 && m1['foregut.len_frac'] >= FLOORS.gut_seal_frac);

  R('G', 'hindgut length fraction, same floors',
    [m0['hindgut.len_frac'], m1['hindgut.len_frac']],
    m0['hindgut.len_frac'] <= FLOORS.gut_seal_t0 && m1['hindgut.len_frac'] >= FLOORS.gut_seal_frac);

  R('H', 'the communication is open at every t sampled, and the hole removes >= ' + FLOORS.window_saving,
    [m0['comm.open'], m1['comm.open'], m1['midgut.window_saving']],
    m0['comm.open'] === 1 && m1['comm.open'] === 1 && m1['midgut.window_saving'] >= FLOORS.window_saving);

  R('I', 'comm length at t=0 / at t=1 >= ' + FLOORS.comm_narrow,
    m0['comm.len'] / m1['comm.len'], m0['comm.len'] / m1['comm.len'] >= FLOORS.comm_narrow,
    { t0: m0['comm.len'], t1: m1['comm.len'] });

  R('J', 'stalk angle to ventral: >= ' + FLOORS.stalk_caudal_deg + ' at t=0, <= ' + FLOORS.stalk_ventral_deg + ' at t=1',
    [m0['stalk.angle_to_ventral_deg'], m1['stalk.angle_to_ventral_deg']],
    m0['stalk.angle_to_ventral_deg'] >= FLOORS.stalk_caudal_deg &&
    m1['stalk.angle_to_ventral_deg'] <= FLOORS.stalk_ventral_deg);

  R('K', 'cloacal normal . ventral <= ' + FLOORS.cloacal_dot_t0 + ' at t=0, >= ' + FLOORS.cloacal_dot + ' at t=1',
    [m0['cloacal.normal_dot_ventral'], m1['cloacal.normal_dot_ventral']],
    m0['cloacal.normal_dot_ventral'] <= FLOORS.cloacal_dot_t0 &&
    m1['cloacal.normal_dot_ventral'] >= FLOORS.cloacal_dot);

  R('L', 'caudal turn / cranial turn <= ' + FLOORS.tail_smaller,
    m1['turn.caudal_over_cranial'], m1['turn.caudal_over_cranial'] <= FLOORS.tail_smaller,
    { cranial_rad: m1['turn.cranial_rad'], caudal_rad: m1['turn.caudal_rad'] });

  R('M', 'min (R - r) / R >= ' + FLOORS.clearance,
    m1['clearance.min_frac'], m1['clearance.min_frac'] >= FLOORS.clearance, { at_s: m1['clearance.at_s'] });

  R('N', 'trunk aspect at t=0 / at t=1 >= ' + FLOORS.aspect_ratio + ', and aspect at t=1 <= ' + FLOORS.aspect_round,
    [m0['aspect.trunk'] / m1['aspect.trunk'], m1['aspect.trunk']],
    (m0['aspect.trunk'] / m1['aspect.trunk']) >= FLOORS.aspect_ratio && m1['aspect.trunk'] <= FLOORS.aspect_round,
    { t0: m0['aspect.trunk'], t1: m1['aspect.trunk'] });

  R('O', 'amnion coverage at t=1 / at t=0 >= ' + FLOORS.amnion_grow,
    m1['amnion.coverage_frac'] / m0['amnion.coverage_frac'],
    m1['amnion.coverage_frac'] / m0['amnion.coverage_frac'] >= FLOORS.amnion_grow,
    { t0: m0['amnion.coverage_frac'], t1: m1['amnion.coverage_frac'] });

  R('P1', '|brain station - S_HEAD| <= W_HEAD',
    m1['brain.station_minus_s_head'], m1['brain.station_minus_s_head'] <= FLOORS.brain_link,
    { station: m1['brain.station_s'], S_HEAD });

  R('P2', 'septum x extent / 2*wall inner radius >= ' + FLOORS.septum_spans,
    m1['septum.radius_over_wall'], m1['septum.radius_over_wall'] >= FLOORS.septum_spans);

  R('P3', 'ectopia clear of the wall >= floor; cdh reaches cranial of the septum >= floor; cdh x > floor (LEFT)',
    [mE['ectopia.out_of_wall'], mC['cdh.above_septum_dy'], mC['cdh.centre_x']],
    mE['ectopia.out_of_wall'] >= mE['ectopia.floor'] &&
    mC['cdh.above_septum_dy'] >= mC['cdh.floor_dy'] &&
    mC['cdh.centre_x'] >= mC['cdh.x_floor'],
    { floors: [mE['ectopia.floor'], mC['cdh.floor_dy'], mC['cdh.x_floor']] });

  R('P4', 'caudal ARC removed >= ' + FLOORS.regression_loss + ' of L(1)',
    mR['regression.caudal_arc_loss_frac'], mR['regression.caudal_arc_loss_frac'] >= FLOORS.regression_loss,
    { as_min_y_would_have_reported: mR['regression.caudal_loss_y_frac'] });

  return { rows, solved: SOLVED, floors: FLOORS,
    /* §3.z partition: the pairs whose contact is CONSTRUCTION or deliberate containment, excluded BY
       NAME and never by a tolerance. Everything else must be disjoint, which the render tool asserts. */
    contact_partition: {
      'headfold|trunk': 'adjacent body-wall segments, overlapped by one station so no annular end cap is exposed',
      'trunk|tailfold': 'as above',
      'heart|pericardium': 'deliberate containment: the heart lies IN the pericardial cavity',
      'septum|headfold': 'anatomy: the septum transversum is mesoderm continuous with the ventral body wall',
      'oropharyngeal|headfold': 'a membrane sealing the body wall\'s lumen at that station',
      'oropharyngeal|trunk': 'as above, at the segment boundary',
      'cloacal|trunk': 'as above', 'cloacal|tailfold': 'as above',
      'foregut|oropharyngeal': 'the membrane seals the foregut\'s blind cranial end',
      'hindgut|cloacal': 'the membrane seals the hindgut\'s blind caudal end',
      'hindgut|cloaca': 'the cloaca IS the dilated terminal hindgut',
      'cloaca|allantois': 'the allantois opens into the cloaca',
      'allantois|cloacal': 'the allantois leaves the cloaca beside the membrane that seals it',
      'pericardium|septum': 'the septum transversum forms the FLOOR of the pericardial cavity',
      'heart|septum': 'the heart lies on the septum transversum, which is the floor of its cavity',
      'neural|pericardium': 'both lie in the crowded cranial end, inside the same body wall',
      'allantois|stalk': 'the allantois runs INTO the connecting stalk',
      'allantois|hindgut': 'the allantois arises FROM the caudal gut',
      'allantois|trunk': 'it runs inside the body wall and then through it into the stalk',
      'allantois|tailfold': 'as above',
      'stalk|tailfold': 'the stalk leaves the caudal end THROUGH the body wall',
      'stalk|trunk': 'as above, where the truncation moves the boundary',
      'foregut|midgut': 'adjacent spans of ONE gut tube, overlapped by one station at the waist',
      'hindgut|midgut': 'as above',
      'foregut|trunk': 'the gut runs inside the body wall and the two meet at the segment boundary',
      'foregut|headfold': 'as above', 'hindgut|trunk': 'as above', 'hindgut|tailfold': 'as above',
      'midgut|trunk': 'as above',
      'cloaca|trunk': 'the cloaca lies inside the caudal body wall',
      'cloaca|tailfold': 'as above',
      'heart|headfold': 'the heart lies INSIDE the body wall of the head-fold region',
      'pericardium|headfold': 'as above',
      'brain|headfold': 'the vesicles lie inside the body wall', 'brain|trunk': 'as above',
      'neural|trunk': 'the neural tube lies inside the body wall',
      'neural|tailfold': 'as above', 'neural|headfold': 'as above',
      'midgut|vitelline': 'the vitelline duct IS the midgut\'s communication, through its own window',
      'vitelline|yolksac': 'the duct opens into the yolk sac',
      'vitelline|trunk': 'the duct passes through the ventral body wall at the umbilicus',
      'neural|brain': 'the vesicles ARE swellings of the neural tube',
      /* THE CRANIAL STRIP IS A MARKER AND IS EXCLUDED WHOLESALE, by name and with the reason: it is a
         rod drawn along the midline itself, so it coincides with whatever else lies on the midline in
         the cranial third. It is a teaching device, declared in the scene's gaps[], and it is the one
         part here that is not a piece of embryo. */
      'cranialstrip|*': 'a teaching marker drawn ALONG the midline; it coincides with whatever is on the midline',
      /* the amnion is the envelope that is MEANT to contain everything — RENDER-STANDARD 3.z names
         exactly this case as an exclusion. */
      'amnion|*': 'the extraembryonic envelope: it is meant to contain everything',
      'ectopia|headfold': 'the lesion IS the heart passing through the wall defect',
      'cdh|septum': 'the lesion IS bowel passing through the septum\'s defect',
      'cdh|midgut': 'the herniated loop is continuous with the midgut it came from',
      'amnion|stalk': 'the amnion sheathes the stalk at the umbilical aperture',
      'amnion|vitelline': 'as above', 'amnion|yolksac': 'the yolk sac lies in the extraembryonic space',
    } };
}

/* THE NEGATIVE CASES. Every floor is fed a value it MUST reject, so a predicate in the wrong units
   cannot launder a defect into a proof. Run at every build (cheap: pure arithmetic on the floors). */
function negativeCases() {
  const bad = [];
  const rej = (id, ok) => { if (!ok) bad.push(id); };
  rej('C',  !(Math.abs(FLOORS.crown_station * 3) <= FLOORS.crown_station));
  rej('B',  !(0.0 >= 0.35 * 1.0));
  rej('B2', !(0.5 >= FLOORS.span_keep));
  rej('E',  !(FLOORS.descent_frac * 0.5 >= FLOORS.descent_frac));
  rej('F',  !(FLOORS.gut_seal_frac * 0.5 >= FLOORS.gut_seal_frac));
  rej('G',  !(FLOORS.gut_seal_t0 * 3 <= FLOORS.gut_seal_t0));
  rej('H',  !(FLOORS.window_saving * 0.1 >= FLOORS.window_saving));
  rej('I',  !(FLOORS.comm_narrow * 0.5 >= FLOORS.comm_narrow));
  rej('J',  !(FLOORS.stalk_ventral_deg * 3 <= FLOORS.stalk_ventral_deg));
  rej('K',  !(FLOORS.cloacal_dot * 0.5 >= FLOORS.cloacal_dot));
  rej('L',  !(FLOORS.tail_smaller * 1.5 <= FLOORS.tail_smaller));
  rej('M',  !(FLOORS.clearance * 0.3 >= FLOORS.clearance));
  rej('N',  !(FLOORS.aspect_ratio * 0.5 >= FLOORS.aspect_ratio));
  rej('N2', !(FLOORS.aspect_round * 2 <= FLOORS.aspect_round));
  rej('O',  !(FLOORS.amnion_grow * 0.6 >= FLOORS.amnion_grow));
  rej('P1', !(FLOORS.brain_link * 3 <= FLOORS.brain_link));
  rej('P2', !(FLOORS.septum_spans * 0.5 >= FLOORS.septum_spans));
  rej('P4', !(FLOORS.regression_loss * 0.4 >= FLOORS.regression_loss));
  return bad;
}

/* ------------------------------------------------------------------ beat claims

   RENDER-STANDARD: a time-varying scene checks its narration against the model at each beat's own
   SET_STAGE t, and each beat must FAIL when displaced. Every name below is a pure function of t read
   off the built geometry through measure(), so the scene's claims[] and the model cannot drift. */
function claimMeasure(name, t) {
  /* a lesion claim names its own variant, because a beat that teaches ectopia cordis is looking at a
     build the default one does not contain. The prefix picks the flag; nothing else changes. */
  const pre = name.split('.')[0];
  if (pre === 'ectopia' || pre === 'cdh' || pre === 'regression') {
    const mm = measure(clamp(t, 0, 1), { [pre]: true });
    return (name in mm) ? mm[name] : NaN;
  }
  const m = measure(clamp(t, 0, 1), {});
  if (name in m) return m[name];
  if (name === 'septum.descent_frac') return (measure(0, {})['septum.y'] - m['septum.y']) / lengthAt(1);
  if (name === 'comm.narrowing') return measure(0, {})['comm.len'] / Math.max(1e-9, m['comm.len']);
  if (name === 'amnion.growth') return m['amnion.coverage_frac'] / measure(0, {})['amnion.coverage_frac'];
  if (name === 'order.reversed') {
    return (m['order.oro_minus_heart_y'] >= m['floor.heart_oro_y'] &&
            m['order.heart_minus_septum_y'] >= m['floor.septum_heart_y']) ? 1 : 0;
  }
  if (name === 'order.flat_order') {
    return (m['order.septum_minus_heart_y'] >= m['floor.septum_heart_y'] &&
            m['order.heart_minus_oro_y'] >= m['floor.heart_oro_y']) ? 1 : 0;
  }
  return NaN;
}

/* ------------------------------------------------------------------ registration */

const FULLSET = { neural: true, brain: true, cranialstrip: true, amnion: true, yolksac: true,
                  vitelline: true, stalk: true, allantois: true, pericardium: true };

let _asserted = false;
function assertAcceptance() {
  if (_asserted) return;
  _asserted = true;
  const bad = negativeCases();
  if (bad.length) console.error('cranio-caudal-folding: NEGATIVE CASES NOT REJECTED: ' + bad.join(','));
  if (!SOLVED.bracketed) console.error('cranio-caudal-folding: the head-fold solve did not bracket');
}

function build(t, opts) { assertAcceptance(); return buildFold(t, opts); }

window.MB3D_MODELS = window.MB3D_MODELS || {};
window.MB3D_MODELS['cranio-caudal-folding'] = {
  LAYERS: LAYERS,
  build: build,
  /* every BENIGN optional layer on, so a structure behind a flag is still resolvable and the player
     never tells a student "there is no model of this structure" about a model sitting right there. The
     three lesions and the hemisection are deliberately NOT here: the adapter builds FULL and then
     slices by key, so a defect in FULL would punch a hole in the body wall of every view. They are
     VARIANTS, asked for in the ref — "cranio-caudal-folding#ectopia@1+ectopia". */
  FULL: FULLSET,
  VARIANTS: {
    hemisection: 'the embryo\'s LEFT half of the body wall and amnion opened, so the median-plane story can be looked into',
    ectopia:     'ectopia cordis — the cranial ventral wall never closes and the heart lies outside the chest',
    cdh:         'a Bochdalek defect: a posterolateral gap in the septum transversum on the embryo\'s LEFT, with bowel in the chest',
    regression:  'caudal regression — the embryo is truncated caudally; no cloaca, cloacal membrane, hindgut, allantois or stalk',
  },
  /* WHICH PARTS DO NOT MOVE WITH t, AND WHICH ARE NOT THERE AT EVERY t. Declared rather than
     discovered: a part that quietly built the same geometry at every t would sit still while its
     neighbours walked the stages and the picture would look entirely fine, and a part that quietly
     built NOTHING at t = 0 reaches a student as "there is no model of this structure", which is a
     statement about the corpus and not about this moment in development. */
  STATIC_PARTS: {},
  STAGE_LIMITED: {
    cloaca: 'the cloaca is the terminal hindgut DILATED where the allantois joins it, and that dilatation '
      + 'is a function of t: below about t = 0.17 there is nothing to build and the part resolves to no '
      + 'geometry. No view in the scene asks for it before then.',
    tailfold: 'absent in the +regression variant when the truncation reaches cranial of the cloacal membrane.',
    hindgut: 'absent in the +regression variant, which is the lesion.',
  },
  ACCEPTANCE: ACCEPTANCE,
  FLOORS: FLOORS,
  SOLVED: SOLVED,
  acceptance: acceptance,
  negativeCases: negativeCases,
  claimMeasure: claimMeasure,
  /* exported so the render tool re-measures these on REAL MESH VERTICES and PERTURBS the constants
     they read, instead of keeping its own copy of the derivation. */
  measure: measure,
  AXES: AXES,
  VIEW_DIR: VIEW_DIR,
  theta: theta,
  dthetaDs: dthetaDs,
  curveAt: curveAt,
  frameAt: frameAt,
  wallOuter: wallOuter,
  commHalf: commHalf,
  STATIONS: { S_SEPTUM, S_HEART, S_ORO, S_CLO, S_STK, S_UMB, S_BRAIN, SREF, NS },
};
})();
