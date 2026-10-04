/* MedBank · heart tube formation — PRODUCTION procedural model.
 *
 * Registers itself as MB3D_MODELS['heart-tube-formation'], which is the whole contract the procedural
 * provider in viz3d.js depends on: a LAYERS palette and build(t, opts) -> THREE.Group whose meshes
 * carry userData.key.
 *
 * WRAPPED IN AN IIFE. Only the registration escapes. RENDER-STANDARD: a model written at top level
 * puts T, K, C, LAYERS and every constant into global lexical scope, and the next model to load —
 * written the obvious way, `const T = window.THREE` — dies on "Identifier 'T' has already been
 * declared" and takes the page with it.
 *
 * ------------------------------------------------------------------------------------------------
 * WHAT t MEANS.  t = 0 is DAY 18: a cardiogenic horseshoe in front of the buccopharyngeal membrane,
 * two separate endocardial tubes, the disc still flat.  t = 1 is DAY 23: one straight heart tube,
 * five segments, hanging in the pericardial cavity on a dorsal mesocardium that has broken down in
 * the middle — which is EXACTLY the state models3d/cardiac-looping.js starts from at ITS t = 0.
 *
 *     day(t) = 18 + 5t
 *
 * THE HANDOVER IS THE POINT.  The queue item for this scene says "reuses the heart-loop centreline at
 * t < 0", and that is the strongest constraint available here: this model's day-23 tube must BE
 * cardiac-looping's day-23 tube, not merely resemble it. So L0, POLE, the calibre profile, the wall
 * thickness, the four waists, the segment boundaries, the overlap and the day-23 mesocardial gap are
 * all the same numbers, and `continuity()` on the registration MEASURES the agreement against the
 * other model's real built vertices rather than asserting it from a comment. Two scenes, one tube.
 *
 * ------------------------------------------------------------------------------------------------
 * THE MECHANISM, AND WHAT IS SOLVED RATHER THAN TUNED.
 *
 * RENDER-STANDARD §3 asks which number a student would be marked wrong for, and demands that THAT
 * number be solved against a stated constraint. Here it is not the fold amplitude — it is WHERE THE
 * TWO TUBES HAVE FUSED AT A GIVEN MOMENT, because the examinable claim is that fusion runs CRANIAL TO
 * CAUDAL ("they zip together from the cranial end backwards"). A hand-written fusion schedule would
 * assert that direction; it would not demonstrate it.
 *
 * So nothing here schedules the fusion front. One thing is prescribed — THE FOLD ANGLE IS t:
 *
 *     lateral fold   phi(t)   = (pi/2) · t        the folds swing the tubes medially
 *     head fold      theta(t) = pi · (1 - t)      the cardiogenic area swings under the head
 *
 * Both are linear in t and both complete at t = 1, so there is not a single tuned rate constant in
 * either folding. The narration says the two happen at once; here they are literally the same clock.
 *
 * Everything else follows. The half-separation of the two tubes is h(u,t) = HS · spread(u) · cos phi,
 * where spread(u) is the horseshoe's own shape — narrow at the cranial confluence, wide at the caudal
 * opening. THE TUBES FUSE WHERE THEY TOUCH: solve h(u,t) = rLimb(u,t) by bisection. Because the
 * horseshoe is narrower cranially, the contact point appears at the cranial end first and marches
 * caudally, and the cranial-to-caudal zip is a RESULT rather than an assumption. The dates fall out
 * of it too and are not chosen: fusion begins about day 21.2 and completes about day 22.4, against a
 * narration that says "one tube by about day twenty-two". Test D asserts that window; if the
 * horseshoe's shape ever changes, the dates move and the test says so — which is how the horseshoe's
 * own three constants came to be pinned rather than picked. See the note on HS below.
 *
 * TWO TUBES MAKE ONE TUBE OF THE SAME CALIBRE, and that is area conservation, not a fudge: each
 * unfused limb has radius r/sqrt(2), so the two of them carry exactly the cross-section the single
 * fused tube carries. Take that away and the tube would either double in calibre at fusion or the
 * limbs would have to be given a radius by hand.
 *
 * FUSION IS IRREVERSIBLE. The front is the running minimum of the contact solution over t, because
 * tissue that has fused does not come apart when a calibre changes underneath it. Without that the
 * front could creep back up by a hair where a growing constriction outruns the closing fold, and a
 * front that moves backwards is not a zip.
 *
 * ------------------------------------------------------------------------------------------------
 * AXES. +x = embryo's LEFT, -x = RIGHT, +y = CRANIAL, +z = VENTRAL. The same convention
 * cardiac-looping states and measures — six BodyParts3D right/left pairs put RIGHT at negative x, and
 * viz3d.js puts the 'anterior' camera at +z. Declared here so the checks can assert it rather than a
 * comment claiming it (RENDER-STANDARD: "declare the axes and prove them").
 *
 * A NOTE ON THE PRE-FOLDING DISC, because model3d-scene-spec-v2 flags exactly this case: before the
 * head fold the disc is flat and its cranio-caudal axis is NOT the definitive +y. This model builds
 * everything in the DEFINITIVE frame and applies the head fold as one rigid rotation of the whole
 * cardiogenic assembly about a hinge at the arterial pole, so at t = 0 the assembly is simply the
 * day-23 arrangement turned through 180 degrees — which is what the head fold is. The order of
 * septum transversum, heart and buccopharyngeal membrane along the axis therefore INVERTS as a
 * consequence of that one rotation, rather than by moving three things separately. Tests E and F
 * measure it at both ends.
 *
 * GEOMETRY NOTE. The tube is THREE CONCENTRIC COATS with real thickness — myocardium, cardiac jelly,
 * endocardium — not two solids with a gap between them. The scene's cross-section beat teaches the
 * jelly as a layer with a future ("it is where the endocardial cushions will form"), so it is built
 * as a layer. cardiac-looping models the jelly as an empty gap of 0.085 between the myocardial inner
 * wall and the endocardial tube; this model spends that same 0.085 on a 0.069 jelly shell with a
 * 0.008 clearance either side, so the endocardial OUTER surface still lands at r - 0.18 and the
 * handover holds. Nothing shares a surface with anything else.
 */
(function () {

const T = window.THREE;
const K = window.VizKit;   // render-kit.js must load first — it owns winding, normals and colour
const C = K.C;

/* THE FIVE SEGMENT KEYS AND COLOURS ARE cardiac-looping's, UNCHANGED. The scene's own gaps[] entry
   makes this a requirement rather than a nicety: "the five-segment colour key must be identical in
   every panel and must be reused unchanged in the cardiac looping and septation scenes. The whole
   point of the segment list is that it survives looping — the same colours moving into new positions
   is the teaching, and re-colouring between scenes destroys it." */
const LAYERS = {
  sinus:      { color: 0x5b49ad, name: 'Sinus venosus' },
  atrium:     { color: 0x1f7fc4, name: 'Primitive atrium' },
  ventricle:  { color: 0xc02a3a, name: 'Primitive ventricle' },
  bulbus:     { color: 0xd85c26, name: 'Bulbus cordis' },
  truncus:    { color: 0xcf9a1e, name: 'Truncus arteriosus' },
  endocardium:{ color: 0xe7aebe, name: 'Endocardial tube' },
  /* THE LUMEN IS A DRAWN PART, and it has to be, which is finding 6 and not a decoration. The review
     found the tube reading as "a solid pink core" in every sectioned view while beat 7 traces blood
     through it, and diagnosed it as the endocardium rendering DoubleSide so the far wall shows
     through. The material is NOT the model's to fix: viz3d.js's procedural adapter builds its own
     MeshStandardMaterial for every part with `side: T.DoubleSide` hard-coded (viz3d.js, the load()
     in register('procedural')) and never looks at the material the model attached. A model-side
     FrontSide would have changed the harness frames and nothing a student sees. What DOES read as a
     cavity is a cast of it in a colour that is not the endocardium's, so the lumen is built. */
  lumen:      { color: 0x7d1a2b, name: 'Lumen of the heart tube' },
  jelly:      { color: 0x6fc9bb, name: 'Cardiac jelly' },
  mesocardium:{ color: 0x7fc9b4, name: 'Dorsal mesocardium' },
  pericardium:{ color: 0x8fb8e8, name: 'Pericardial cavity' },
  veins:      { color: 0x27497a, name: 'Vitelline, umbilical & common cardinal veins' },
  arches:     { color: 0x8f2438, name: 'Aortic sac & aortic arches' },
  septum:     { color: 0xa8794a, name: 'Septum transversum' },
  membrane:   { color: 0xb9c6a3, name: 'Buccopharyngeal membrane' },
  midline:    { color: 0x9aa6bf, name: 'Median plane' },
};

/* ------------------------------------------------------------------ constants

   The first block is cardiac-looping's, character for character, because the two models have to hand
   over. Change one of these and continuity() will say so on the next render. */
const L0      = 6.0;      // heart-tube arc length on day 23
const POLE_Y  = -L0 * 0.46;   // the venous pole at day 23 — cardiac-looping's POLE
const HINGE_Y = L0 * 0.54;    // the arterial pole at day 23; also the head-fold hinge
/* WALL + JELLY IS cardiac-looping's 0.180 AND MUST STAY SO — that sum is what puts the endocardial
   OUTER surface at r - 0.180 in both models, and it is the handover. HOW THE 0.180 IS SPENT was
   re-split on 2026-09-30 by review finding 7: the jelly was drawn THINNER than the myocardium
   (0.069 against 0.095, a ratio of 0.73) while every line of the narration that names it calls it
   "a thick layer of extracellular matrix". RENDER-STANDARD is explicit that a teaching sentence is
   not edited to agree with an approximate model, so the model moved: the jelly is now 0.090 against
   a 0.074 myocardium, a ratio of 1.22, which is the way an atlas draws day 23 — a thin myocardial
   mantle over a deep acellular cushion. Test H now asserts the ratio, not merely the shares.

   THIS DIVERGES FROM cardiac-looping, DELIBERATELY AND VISIBLY. That model's WALL is still 0.095, so
   its myocardial INNER surface now sits 0.021 inside this one's at day 23. continuity() measures the
   difference and reports it rather than asserting a pass, because cardiac-looping is `escalated` and
   the queue says in terms that neither task touches it: "Apply when and if this item is reopened."
   The ENDOCARDIAL surface — the one a student sees through the cutaway, and the one the handover is
   about — is unchanged in both. See the scene's gaps[] entry on the two declared divergences. */
const WALL    = 0.074;    // myocardial wall thickness at day 23 (was 0.095; finding 7)
const JELLY   = 0.106;    // the whole myocardium-to-endocardium depth at day 23 (WALL + JELLY = 0.180)
const OVERLAP = 0.006;    // segments interpenetrate at each waist, so no cap is ever exposed
const MESO_GAP_D23 = 0.055;   // the mesocardial gap ALREADY present at day 23 (cardiac-looping GAP_0)

/* This model's own. */
const NSEG  = 200;        // centreline samples across the whole tube
const NRING = 32;         // points around the myocardium
const NRING_IN = 22;      // ...and around the two inner coats
const LEN0  = 0.55;       // the tube's length at day 18, as a fraction of its day-23 length
/* THE HORSESHOE'S SHAPE, AND WHAT SET IT.

   These three are the only free numbers in the mechanism, and they are not free in the way they look:
   HS x SPREAD_MIN is pinned at 0.379 by the day the zip STARTS, and HS alone sets the day it FINISHES,
   so only SPREAD_Q is left to shape the curve between. It was chosen against a measurement the first
   version failed. At HS = 1.05, SPREAD_MIN = 0.36, SPREAD_Q = 1.15, every acceptance test passed and
   the mid-zip render was still wrong: the prover's pairProbe, reading REAL SINUS VERTICES, measured
   the two unfused tubes 0.113 apart on a 0.44 tube — 20% of a diameter, where the model's own
   centreline proxy read 48%. The proxy was not lying; it was measuring the venous pole while the
   narrowest point of the sinus segment is at its cranial end. The picture the zip view exists to show
   — one tube cranially, two tubes caudally, in the same frame — was not legibly there.

   A wider horseshoe alone does not fix it: widening delays completion, and pushing HS past about 1.6
   carries the day the tubes fuse past day 22.5, which is outside what the narration teaches. What
   fixes it is CURVATURE: raising SPREAD_Q makes the horseshoe open faster toward its caudal end, so
   the caudal tubes stay wide apart while the cranial half has already come together. Measured across
   the grid: SPREAD_Q 1.15 -> 2.0 at HS 1.30 takes the mid-zip sinus gap from 0.26 to 0.82 of a
   diameter with the completion date moving only from day 22.35 to day 22.42.

   The model was enriched rather than the test weakened. That direction is the review's standing
   instruction on the same shape of finding in cardiac-looping. */
const HS    = 1.30;       // the horseshoe's half-span at its caudal opening, day 18
const SPREAD_MIN = 0.292; // ...and at its cranial confluence, as a fraction of that
const SPREAD_Q   = 2.00;  // how fast the horseshoe opens caudally
const COAT_GAP   = 0.008; // clearance between coats — nothing shares a surface
const CONF_SWELL = 0.32;  // the confluence where two tubes run into one is wider than either
const CONF_W     = 0.050;
const CONF_GATE  = 0.15;  // ...and the swell has nowhere to be once the front reaches the caudal end

/* The t the zip view is drawn at. Named here rather than in the scene because acceptance test C is
   evaluated AT IT: RENDER-STANDARD requires a spatial claim to be checked at the t the view actually
   renders, not only at the end of the process. If the scene moves that view, this moves with it. */
const ZIP_T = 0.76;

const DAY0 = 18, DAY1 = 23;
function day(t) { return DAY0 + (DAY1 - DAY0) * t; }

function gauss(u, c, w) { const z = (u - c) / w; return Math.exp(-z * z); }
function smooth(s) { const x = Math.max(0, Math.min(1, s)); return x * x * (3 - 2 * x); }

/* differentiation — the tube is a plain cylinder when it forms and a string of dilations separated by
   named constrictions by day 23. Separate from the folding clock, because they are separate
   processes: a tube can fuse without ballooning and does. */
function diff(t) { return smooth(t); }

function len(t) { return L0 * (LEN0 + (1 - LEN0) * t); }

/* the definitive-frame centreline: a straight tube whose ARTERIAL pole is pinned at the hinge and
   which lengthens caudally, because the outflow is tethered to the pharyngeal region while the
   secondary heart field adds cells at both poles and the venous end reaches down to the septum
   transversum. At t = 1 this is exactly cardiac-looping's day-23 tube: POLE_Y to HINGE_Y. */
function axisY(u, t) { return HINGE_Y - len(t) * (1 - u); }

/* ------------------------------------------------------------------- calibre

   THE SAME PROFILE cardiac-looping USES AT ITS t = 0, ramped in by diff(t). Every dilation and every
   constriction is one of the landmarks a student is examined on, and the segment boundaries below are
   the four constrictions. At t = 1 this function equals cardiac-looping's radius(u, 0) term for term. */
function radius(u, t) {
  const w = diff(t);
  let r = 0.285;
  r += w * 0.155 * gauss(u, 0.055, 0.075) * 0.7;   // sinus horns
  r += w * 0.300 * gauss(u, 0.280, 0.110) * 0.45;  // atrium ballooning
  r += w * 0.335 * gauss(u, 0.530, 0.120) * 0.45;  // ventricle ballooning
  r += w * 0.170 * gauss(u, 0.755, 0.090) * 0.6;   // bulbus cordis
  r -= w * 0.075 * gauss(u, 0.165, 0.055);         // sinoatrial constriction
  r -= w * 0.105 * gauss(u, 0.400, 0.050);         // atrioventricular canal
  r -= w * 0.072 * gauss(u, 0.660, 0.048);         // bulboventricular sulcus
  r -= w * 0.042 * gauss(u, 0.870, 0.045);         // bulbotruncal junction
  return Math.max(r, 0.125);
}

/* THE COATS. Absolute thicknesses at day 23, scaled together for an unfused limb so a thin tube never
   drives an inner coat to nothing. `scale` is 1 for the fused tube and 1/sqrt(2) for a limb. */
function wallAt(t)  { return 0.030 + (WALL - 0.030) * diff(t); }
function jellyAt(t) { return 0.020 + ((JELLY - 2 * COAT_GAP) - 0.020) * diff(t); }
function endoAt(t)  { return 0.038 + 0.010 * diff(t); }

/* radial stack, outermost first. Returned in one call so the ordering can never be written twice. */
function coats(u, t, scale) {
  const s = scale || 1;
  const rM = radius(u, t);
  const mIn = Math.max(rM - wallAt(t), 0.045);
  const jOut = Math.max(mIn - COAT_GAP, 0.038);
  const jIn = Math.max(jOut - jellyAt(t), 0.030);
  const eOut = Math.max(jIn - COAT_GAP, 0.024);
  const eIn = Math.max(eOut - endoAt(t), 0.016);
  return { mOut: rM * s, mIn: mIn * s, jOut: jOut * s, jIn: jIn * s, eOut: eOut * s, eIn: eIn * s };
}

/* --------------------------------------------------------- the two foldings

   ONE CLOCK. phi is the lateral fold, theta the head fold, and t is the angle of both. */
function phi(t)   { return (Math.PI / 2) * Math.max(0, Math.min(1, t)); }
/* NEGATIVE, and that is the whole difference between a head fold and a tail fold. The two endpoints
   are the same either way — a rotation of +pi and one of -pi land in the same place — so nothing at
   t = 0 or t = 1 can tell them apart, and every test in ACCEPTANCE is stated at one of those two.
   What separates them is the PATH: the cardiogenic area is carried forward and UNDER the head, so it
   passes VENTRAL to the hinge (+z). Built with +pi it passed dorsally instead, swinging the heart out
   behind the embryo through every intermediate stage — wrong in exactly the frames the folding view
   exists to show, and invisible at both ends. Caught by reading the bounding box at t = 0.35, which
   reached z = -5.12. */
function theta(t) { return -Math.PI * (1 - Math.max(0, Math.min(1, t))); }

/* the horseshoe: narrow at the cranial confluence, wide at the caudal opening */
function spread(u) { return SPREAD_MIN + (1 - SPREAD_MIN) * Math.pow(Math.max(0, 1 - u), SPREAD_Q); }

/* half the distance between the two endocardial tubes at station u */
function halfSep(u, t) { return HS * spread(u) * Math.cos(phi(t)); }

/* AREA CONSERVATION. Two limbs of radius r/sqrt(2) carry the cross-section of one tube of radius r. */
const LIMB_SCALE = 1 / Math.SQRT2;
function limbRadius(u, t) { return radius(u, t) * LIMB_SCALE; }

/* ---------------------------------------------------- where the tubes have fused

   THE ONE SOLVED PARAMETER. Fusion has reached station u when the two tubes are in contact there:
   halfSep(u,t) = limbRadius(u,t). Bisected, not scheduled — see the header. */
function contactFront(t) {
  const F = u => halfSep(u, t) - limbRadius(u, t);
  /* SCANNED FROM THE CRANIAL END, NOT BISECTED, and the difference is not cosmetic. The tube's
     calibre rises and falls four times, so F can have THREE roots at once: a stretch over a dilated
     chamber can be in contact while a constriction cranial to it is still apart. Bisection returns
     whichever root it happens to converge on, and as t advances it hops between roots on OPPOSITE
     sides of a waist — the front then appears to jump caudally and back. A fusion front is by
     definition CONTIGUOUS with the tissue already fused, so the front is the most cranial station
     that has NOT yet touched, found by walking caudally from the arterial pole. An island of contact
     behind an unfused constriction is not fusion; it is two tubes leaning on each other. */
  const M = 600;
  if (F(1) > 0) return 1;                       // nothing has touched yet
  for (let i = 1; i <= M; i++) {
    const u = 1 - i / M;
    if (F(u) > 0) {
      let lo = u, hi = u + 1 / M;               // lo apart, hi in contact
      for (let k = 0; k < 24; k++) {
        const mid = (lo + hi) / 2;
        if (F(mid) > 0) lo = mid; else hi = mid;
      }
      return (lo + hi) / 2;
    }
  }
  return 0;                                     // in contact all the way to the venous pole
}

/* FUSION IS IRREVERSIBLE — the front is the running minimum of the contact solution. */
const FRONT_STEPS = 400;
let _frontTab = null;
function frontTable() {
  if (_frontTab) return _frontTab;
  const tab = new Float64Array(FRONT_STEPS + 1);
  let run = 1;
  for (let i = 0; i <= FRONT_STEPS; i++) {
    run = Math.min(run, contactFront(i / FRONT_STEPS));
    tab[i] = run;
  }
  _frontTab = tab;
  return tab;
}
function fusionFront(t) {
  const tab = frontTable();
  const x = Math.max(0, Math.min(1, t)) * FRONT_STEPS;
  const i = Math.min(FRONT_STEPS - 1, Math.floor(x)), f = x - i;
  return tab[i] * (1 - f) + tab[i + 1] * f;
}
/* the two dates the mechanism produces rather than receives */
function fusionDates() {
  const tab = frontTable();
  let tStart = null, tEnd = null;
  for (let i = 0; i <= FRONT_STEPS; i++) {
    if (tStart === null && tab[i] < 1 - 1e-6) tStart = i / FRONT_STEPS;
    if (tEnd === null && tab[i] <= 1e-6) tEnd = i / FRONT_STEPS;
  }
  return { tStart: tStart, tEnd: tEnd, dayStart: tStart == null ? null : day(tStart),
           dayEnd: tEnd == null ? null : day(tEnd) };
}

/* the confluence is wider than either tube running into it, and has nowhere to be once fusion is
   complete — which is what keeps the day-23 calibre EXACTLY cardiac-looping's */
function fusedScale(u, t) {
  const uF = fusionFront(t);
  if (uF <= 1e-6) return 1;
  return 1 + CONF_SWELL * gauss(u, uF, CONF_W) * Math.min(1, uF / CONF_GATE);
}

/* ------------------------------------------------------------------ segments
   The boundaries ARE the four named waists, and they are cardiac-looping's. */
const SEGS_U = {
  sinus:     [0.000, 0.165],
  atrium:    [0.165, 0.400],
  ventricle: [0.400, 0.660],
  bulbus:    [0.660, 0.870],
  truncus:   [0.870, 1.000],
};
const SEGS = Object.keys(SEGS_U).map(k => ({ key: k, u0: SEGS_U[k][0], u1: SEGS_U[k][1] }));

/* ------------------------------------------------------- the fixed landmarks

   Neither is anatomy this model claims to draw properly: they are REFERENCES, there so the head
   fold's one real consequence — the reversal of the order along the axis — is something you can see
   rather than something the narration asserts. Both ride the same rigid rotation as the heart. */
/* CLEAR OF THE ARTERIAL POLE, and that is a rendering fact rather than an anatomical one. At 0.55
   cranial of the hinge the membrane sat inside the aortic sac and behind the arches and was not
   visible in any stage render — a reference nothing can see is the round-3 defect in a different
   costume, and tests E and F would have gone on passing on a landmark no student could find. */
const BPM_A = 0.95;    // the buccopharyngeal membrane sits this far cranial of the hinge
const BPM_Z = -0.62;
const ST_A  = 0.62;    // the septum transversum this far caudal of the venous pole
const ST_Z  = 0.18;

function bpmCentre(t) { return new T.Vector3(0, HINGE_Y + BPM_A, BPM_Z); }
function stCentre(t)  { return new T.Vector3(0, axisY(0, t) - ST_A, ST_Z); }

/* the head fold, as one rotation about the hinge */
function foldPoint(v, t) {
  const th = theta(t), c = Math.cos(th), s = Math.sin(th);
  const dy = v.y - HINGE_Y, dz = v.z;
  return new T.Vector3(v.x, HINGE_Y + dy * c - dz * s, dy * s + dz * c);
}

/* ------------------------------------------------- measuring it, not looking at it

   Volume-weighted proxies off the centreline and the calibre profile, so acceptance() is cheap enough
   to assert on every build. It is a PROXY for the real mesh; the proof is boxProbe in
   viz-training/tools/render-heart-tube-formation.mjs, which measures the same relations on the actual
   vertices and prints both columns. Never read the proxy as the evidence. */
function tubeCentroidY(t) {
  let sy = 0, w = 0;
  for (let i = 0; i <= NSEG; i++) {
    const u = i / NSEG, r = radius(u, t), ww = r * r;
    sy += axisY(u, t) * ww; w += ww;
  }
  return sy / w;
}
function tubeExtentY(t) { return len(t) + radius(0, t) + radius(1, t); }

/* the whole assembly's transverse half-width at t, measured off the geometry it is built from.
   INCLUDING THE SECTION PEAK: sweptShell modulates every radius by DEFAULT_SECTION, which reaches
   1.085, and a sac sized from the bare radius clips the tube it is supposed to contain. */
const SECTION_PEAK = 1 + 0.055 + 0.030;
/* THE TUBE'S DRAWN DORSAL SURFACE, AND WHY IT IS NOT radius().

   Added 2026-09-30 by the round-3 build run, and it is the arithmetic the dorsal mesocardium had
   wrong. sweptShell places a ring point at

       P + N * r * section(th) * cos th  +  B * r * section(th) * sin th * flatten

   with flatten defaulting to 0.90 (render-kit sweptShell, `const flat = opts.flatten != null ? ... :
   0.90`). The DORSAL extreme is th = 3pi/2, where DEFAULT_SECTION is 1 - 0.055 = 0.945, so the
   surface a camera sees sits at 0.945 x 0.90 = 0.8505 of radius(u, t) — not at radius(u, t).

   The mesocardium's attachment was radius(u, t) * MESO_ON_TUBE with MESO_ON_TUBE = 0.92, and its
   comment said that put the sheet "on the tube's dorsal surface", bought because "the tube hides
   everything inside its own silhouette". 0.8505 IS the silhouette. So 0.92 sat 0.069 of a radius
   OUTSIDE the tube: measured on the day-23 build, the sheet's ventral edge stood in 0.019 to 0.030
   units of clear air at EVERY station, and the membrane never touched the thing it suspends. The
   move from 0.80 to 0.92 that was made to buy visibility had in fact detached it, and bought nothing,
   because the whole sheet was already outside the silhouette and therefore already drawn.

   FLATTEN IS COPIED FROM THE KIT AND ASSERTED AGAINST BUILT VERTICES — acceptance row S. A constant
   copied out of another file is exactly the kind of claim RENDER-STANDARD says must be checked rather
   than commented, and this one is now load-bearing for where a membrane attaches. */
const KIT_FLATTEN = 0.90;   // render-kit sweptShell's own default; row S proves it against vertices
function dorsalSurface(u, t) {
  return radius(u, t) * K.DEFAULT_SECTION(3 * Math.PI / 2) * KIT_FLATTEN;
}
function tubeHalfWidth(t) {
  const uF = fusionFront(t);
  let hw = 0;
  for (let i = 0; i <= NSEG; i++) {
    const u = i / NSEG;
    hw = Math.max(hw, u >= uF ? radius(u, t) * fusedScale(u, t) * SECTION_PEAK
                              : halfSep(u, t) + limbRadius(u, t) * SECTION_PEAK);
  }
  return hw;
}

/* THE PERICARDIAL SAC, AND WHY ITS SIZE IS NOT A CLEARANCE.

   The obvious way to draw a cavity the tube outgrows is to give it a clearance that shrinks with t.
   That is a tautology: the crowding is then true by construction and test K could never fail, which
   RENDER-STANDARD names as the third defect of three rounds — a test satisfiable without the picture
   changing. So the cavity is sized the way cardiac-looping sizes its own: its HEIGHT spans the two
   tethered poles, and its WIDTH runs on a schedule of its OWN, from the room a day-18 horseshoe has
   around it to just containing the day-23 tube. The clearance is then DERIVED, and test K measures it. */
const CAV_R0 = 2.35;          // the room the day-18 horseshoe (half-width about 1.52) has at its sides
let _cavR1 = null;
function cavityRadiusAtT1() {
  if (_cavR1 == null) _cavR1 = tubeHalfWidth(1) * 1.06;
  return _cavR1;
}
function cavity(t) {
  const halfY = 0.5 * len(t) + 0.55 + 0.62 * (1 - t);
  const rXZ = CAV_R0 + (cavityRadiusAtT1() - CAV_R0) * t;
  return { halfY: halfY, rXZ: rXZ, cy: 0.5 * (axisY(0, t) + axisY(1, t)) };
}
function clearanceFraction(t) { return 1 - tubeHalfWidth(t) / cavity(t).rXZ; }

/* ----------------------------------------------------------------- ACCEPTANCE

   Stated as measurements so a review can re-check the arithmetic rather than the conclusion.
   EVERY SPATIAL TEST CARRIES A MAGNITUDE FLOOR, expressed as a fraction of the extent the claim
   should be legible against (RENDER-STANDARD: "a sign test on a spatial relation is not a test").
   EVERY TEST HAS A NEGATIVE CASE — see negatives() — because a test that grades its own homework in
   the wrong units launders a defect into a proof. */
const FLOORS = {
  ORDER:   0.35,   // an inverted order must be visible, not merely signed
  GAP:     0.35,   // ...and so must the gap between two tubes that have not fused
  STRADDLE:0.45,   // the fused tube puts this much of its width on each side of the median plane
  CENTRED: 0.03,   // ...and its centre sits within this fraction of its width of that plane
  COAT:    0.18,   // each of the three coats is at least this share of the whole wall depth
  WAIST:   0.015,  // a segment boundary sits this close to a real local minimum of the calibre
  CLEAR0:  0.30,   // the day-18 tube has at least this much clearance inside its cavity
  CLEAR1:  0.14,   // ...and the day-23 tube no more than this
  /* added 2026-09-30 with Frank's mesocardium ruling and findings 6 and 7 */
  JELLY_WALL: 1.10,   // the jelly is at least this many times the myocardium's thickness
  POLE_REACH: 0.08,   // at most this share of the tube's length hangs free at EACH pole
  SINUS:      0.06,   // the transverse sinus is at least this share of the mesocardium's own length
  NOSINUS:    0.04,   // ...and before it opens, the largest gap is row spacing, no more than this
  SINUS_MID:  0.22,   // the opening sits at least this far in from either end of the sheet
  LUMEN_CLEAR:0.04,   // the lumen stands this far inside the endocardium, as a share of its radius
  LUMEN_SPAN: 0.90,   // ...and runs this share of the tube's length
  MESO_PROUD: 0.08,   // each REMNANT reaches at least this depth somewhere along it, in model units
  /* added 2026-09-30, round 3, replacing the two global comparisons the round-2 review rejected */
  MESO_FILL:  0.70,   // the sheet takes this share of the dorsal space available at its own station
  MESO_SPACE: 0.02,   // ...at any station where that much space exists at all
  MESO_SAC_TOL: 0.002,  // how far a sheet vertex may sit outside the sac's own fitted wall
  MESO_FREE_VENOUS_PIN: 0.095,  // the caudal run the SAC takes from the sheet — declared, not chosen
  CROSS_FLAT: 1e-6,   // the crosscut face is planar to this, in model units
  CROSS_GAP:  0.002,  // ...and consecutive rings on it clear each other by at least this
  CROSS_DOT:  0.90,   // ...and the beat's camera looks this near along the face's own normal
  SURFACE_TOL: 1e-5,  // dorsalSurface() agrees with the built tube's dorsal vertices to this
};

const ACCEPTANCE = {
  axes: '+x = embryo LEFT, -x = RIGHT, +y = CRANIAL, +z = VENTRAL',
  t_means: 'day 18 at t = 0, day 23 at t = 1; day(t) = 18 + 5t',
  handover: "at t = 1 this model's tube IS cardiac-looping's tube at ITS t = 0 — measured by continuity()",
  tests: [
    { id: 'A', says: 'fusion runs CRANIAL to CAUDAL and never runs backwards',
      must: 'the fusion front is 1 at t = 0, 0 at t = 1, and non-increasing at every step between' },
    { id: 'B', says: 'the front is SOLVED from contact, not scheduled',
      must: 'at the front the two tubes touch to within 1e-3 of their own radius' },
    { id: 'C', says: 'mid-zip the picture shows BOTH states at once — one tube cranially, two caudally',
      must: 'at t = 0.76, the t the zip view is drawn at: the tube is single over at least 40% of its ' +
            "length, and at the venous end the two tubes' surfaces are at least 35% of a diameter apart" },
    { id: 'D', says: 'the dates are a RESULT of the horseshoe, and they land where the narration says',
      must: 'fusion begins after day 20.5 and is complete between day 21.5 and day 22.5' },
    { id: 'E', says: 'the head fold INVERTS the order — the septum transversum crosses the heart',
      must: 'at day 18 the septum transversum is cranial to the heart, at day 23 caudal, each by at ' +
            'least 35% of their mean cranio-caudal extent' },
    { id: 'F', says: 'and the buccopharyngeal membrane crosses it the other way',
      must: 'at day 18 the heart lies cranial to the membrane, at day 23 caudal, by the same floor' },
    { id: 'G', says: 'two tubes at day 18, ONE tube straddling the median plane at day 23',
      must: 'at t = 0 the two tubes are disjoint in x by at least 35% of their mean width; at t = 1 ' +
            'the tube puts at least 45% of its width on each side of x = 0 and is centred within 3%' },
    { id: 'H', says: 'three coats, in order, each of them legible, and the JELLY IS THE THICK ONE',
      must: 'myocardium, jelly and endocardium each occupy at least 18% of the wall depth at the ' +
            'ventricle body at day 23, no two of them share a surface, and the jelly is at least ' +
            '1.10x the myocardium\'s thickness — MEASURED ON BUILT VERTICES at the ventricle body, ' +
            'not from the constants the radii were built from' },
    { id: 'I', says: 'the segment boundaries sit at the named WAISTS',
      must: 'each of the four internal boundaries is within 0.015 of a local minimum of the day-23 calibre' },
    { id: 'J', says: 'the dorsal mesocardium is intact while the tube is still fusing, and by day 23 ' +
            'carries ONE opening — the transverse pericardial sinus — between the poles',
      must: 'READ OFF THE BUILT SHEET, not off MESO_GAP_D23 — the constant the old row compared with ' +
            'itself. At t = 0.5 there is NO sheet, because there is no midline tube to suspend; at ' +
            't = 0.82, with fusion begun and not finished, the sheet exists and the largest gap ' +
            'between consecutive vertex rows is row spacing (<= 4% of it); at t = 1 there is a single ' +
            'opening of at least 6% of the sheet, and its centre lies at least 22% in from either end' },
    { id: 'M', says: 'the mesocardium reaches both poles IN INK — Frank\'s ruling of 2026-09-29, ' +
            'measured as what a camera is given rather than as where vertices are',
      must: 'REBUILT PER STATION 2026-09-30 after the round-2 review. The old row compared the sheet\'s ' +
            'vertex SPAN with the tube\'s and passed at 0.045 and 0.037 while the sheet drew nothing at ' +
            'either pole. Now: at day 23 no more than 8% of the tube\'s extent carries no sheet at the ' +
            'ARTERIAL pole; at the VENOUS pole the sheet stops 0.083 short and that run is DECLARED, ' +
            'because the sac has closed onto the tube there — the row\'s second half requires the ' +
            'sheet\'s first inked station to be within one band of the first station where the sac ' +
            'leaves any dorsal room at all, so a sheet that went missing where there IS room fails ' +
            'however generous the pin. Both span numbers are still reported beside the ink ones' },
    { id: 'N', says: 'the lumen is a real cavity, strictly inside the endocardium, running the tube',
      must: 'the lumen cast stands at least 4% of the endocardial inner radius clear of it in every ' +
            'one of 60 bands, compared MIN-RADIUS TO MIN-RADIUS so the section shape divides out, ' +
            'and spans at least 90% of the tube. THE PARTITION §3.z ASKS FOR: the ' +
            'lumen inside the endocardium, the three coats nested in each other, and the pericardial ' +
            'sac around everything are CONSTRUCTION, not two solids sharing space; they are excluded ' +
            'by name here and this row pins the lumen clearance so it cannot close' },
    { id: 'P', says: 'the mesocardium is ATTACHED to the tube and INSIDE the sac at every station, and ' +
            'each of its two remnants is a legible sheet rather than one deep band',
      must: 'REBUILT PER STATION 2026-09-30. The old row reduced the sheet to ONE global pair of ' +
            'minima — sheet minimum z against sac minimum z, and tube minimum z against sheet minimum ' +
            'z — and passed on its single deepest band, 0.0907, while the sheet was DETACHED from the ' +
            'tube at every station (0.019-0.030 units of air) and hung OUTSIDE the sac over the caudal ' +
            '7%. A global extreme cannot see either. Now, in 60 bands at t = 1: every band carrying ' +
            'sheet has its ventral edge INSIDE the tube\'s drawn dorsal surface; every sheet vertex ' +
            'is inside the sac\'s ellipsoid FITTED FROM THE SAC\'S OWN VERTICES, to 0.002; at every ' +
            'station that has dorsal room and is not inside a declared taper run, the sheet takes at ' +
            'least 70% of that room; the sheet is exactly TWO remnants and EACH reaches 0.08 of depth ' +
            'somewhere along it, which the old row could satisfy on the deeper one alone; and each ' +
            'taper is monotone to its own edge. The old global numbers are still reported' },
    { id: 'K', says: 'the tube outgrows the cavity that holds it',
      must: 'the clearance around the tube falls from at least 30% at day 18 to at most 14% at day 23, ' +
            'and never rises once fusion is complete. It DOES rise once, by about 0.08, at the moment ' +
            'fusion completes: two tubes side by side are wider than the one tube they become' },
    { id: 'Q', says: 'the crosscut variant builds a TRANSVERSE face at the ventricle body, and beat 4 ' +
            'has exactly one camera that can see it',
      must: 'ADDED 2026-09-30 for round-2 finding 2. Read off the face\'s own vertices: it is planar to ' +
            '1e-6, it sits at the ventricle body (y = 0.420, the station rows H and Q share), FOUR keys ' +
            'reach it — myocardium, jelly, endocardium and the lumen disc — and along the theta = 0 ray ' +
            'their radii nest in that order with at least 0.002 of clearance between consecutive rings. ' +
            'AND THE CAMERA (RENDER-STANDARD 3.y): the face\'s normal is the tube\'s axis, so with ' +
            'viz3d\'s own VIEW_DIR table the superior camera gives |axis . dir| = 1.000 and the ' +
            'ANTERIOR camera — the one the beat carried through two review rounds — gives 0.000. A ring ' +
            'seen edge-on is a line, which is why this beat cannot be fixed by geometry alone' },
    { id: 'S', says: 'the two render-kit constants this model copied still describe the tube it draws',
      must: 'ADDED 2026-09-30, because the mesocardium\'s attachment now rests on them. sweptShell puts ' +
            'a ring point at P + N r section(th) cos th + B r section(th) sin th flatten, with flatten ' +
            'defaulting to 0.90 and DEFAULT_SECTION(3pi/2) = 0.945, so the DRAWN dorsal surface is ' +
            '0.8505 of radius(u, t). dorsalSurface() is asserted against the built tube\'s x = 0 ring ' +
            'vertices at six stations, to 1e-5. The defect this row exists to prevent recurring is the ' +
            'one it was written beside: MESO_ON_TUBE was 0.92 OF THE RADIUS and a comment claimed that ' +
            'put the sheet on the tube\'s surface. It put it 0.069 of a radius outside' },
    { id: 'L', says: 'cardia bifida is an ARREST of this mechanism, not a different drawing',
      must: 'with the lateral folds arrested the front never leaves the cranial end and the two tubes ' +
            'stay disjoint by at least 35% of their mean width at day 23' },
  ],
};

/* ---------------------------------------------- READING THE BUILT GEOMETRY, NOT THE CONSTANTS

   RENDER-STANDARD, 2026-09-23: "the measured side of every acceptance assertion must be read from
   the geometry the model builds — rows, grids or mesh vertices — and never from the constants the
   geometry was built from. The check is a PERTURBATION: change the constant the geometry uses and the
   reported number must move." Test J used to fail that exactly: it read mesoHalfGap(1), which IS
   MESO_GAP_D23, and compared it to MESO_GAP_D23. It could not fail, and it did not notice that the
   sheet reached neither pole. The three rows Frank's ruling and findings 6 and 7 touch now read
   vertices.

   POSITIONS ARE READ IN THE MODEL'S OWN FRAME, deliberately. The head fold is applied as a rotation
   of the whole group, so a world-space read would have +y meaning the tube's axis only at t = 1. The
   builders write their vertices in the definitive frame and every mesh is added with an identity
   transform, so the raw position attribute IS the definitive frame at every t — which is what an
   axis-parameter measurement needs.

   IT REPORTS ITS OWN DEGENERACY rather than warning about it (RENDER-STANDARD, round 3): when THREE
   or the kit is not present — check-beat-claims runs a model in a sandbox with a stub Vector3 and no
   kit at all — this returns null, and the rows that need it say UNMEASURED instead of passing. */
const SEG_KEYS = Object.keys(SEGS_U);
let _probe = null;
function probe() {
  if (_probe) return _probe;
  if (!T || typeof T.Group !== 'function' || !K || typeof K.sweptShell !== 'function') return null;
  const read = (t) => {
    const g = buildHeartTube(t, { endocardium: true, jelly: true, lumen: true, mesocardium: true,
                                  pericardium: true, midline: false, landmarks: false });
    const by = {};
    g.traverse(o => {
      if (!o.isMesh || !o.geometry) return;
      const u = o.userData || {};
      if (u.outline || !u.key) return;
      const pa = o.geometry.attributes && o.geometry.attributes.position;
      if (!pa) return;
      const b = by[u.key] || (by[u.key] = { n: 0, minY: 1e9, maxY: -1e9, minZ: 1e9, maxZ: -1e9,
                                            ys: [], rows: [], ray: [] });
      for (let i = 0; i < pa.count; i++) {
        const x = pa.getX(i), y = pa.getY(i), z = pa.getZ(i);
        b.n++;
        if (y < b.minY) b.minY = y;
        if (y > b.maxY) b.maxY = y;
        if (z < b.minZ) b.minZ = z;
        if (z > b.maxZ) b.maxZ = z;
        b.ys.push(y);
        b.rows.push(y, Math.sqrt(x * x + z * z));
        /* THE THETA = 0 RAY, KEPT APART, and it is the only place a THICKNESS can honestly be read.
           sweptShell puts every ring point at r * section(th), with the B component additionally
           scaled by `flatten`, so a radius taken anywhere else mixes the wall's depth with the
           section's own shape: the first version of row H measured maxR - minR over a y-band and got
           0.167 for a 0.074 wall, because the largest outer radius and the smallest inner radius sit
           at different angles. At th = 0 the point is P + N * r * section(0) exactly — z is zero, the
           flattening does not apply, and both surfaces of a shell carry a vertex there because every
           ring starts at j = 0. maxR - minR along this ray IS the wall. */
        if (Math.abs(z) < 1e-9 && x > 0) b.ray.push(y, x);
      }
    });
    return by;
  };
  /* the largest gap between consecutive vertex ROWS of a sheet, and where its centre sits — the two
     numbers that say whether there is an opening and whether it is in the middle */
  const gapOf = (b) => {
    if (!b || b.n < 8) return null;
    const ys = b.ys.slice().sort((p, q) => p - q);
    const ext = ys[ys.length - 1] - ys[0];
    if (!(ext > 1e-9)) return null;
    let g = 0, at = 0;
    for (let i = 1; i < ys.length; i++) {
      const d = ys[i] - ys[i - 1];
      if (d > g) { g = d; at = (ys[i] + ys[i - 1]) / 2; }
    }
    return { frac: g / ext, midFrac: (at - ys[0]) / ext, extent: ext, lo: ys[0], hi: ys[ys.length - 1] };
  };
  /* radial band statistics in a y-window, so one key's surfaces can be compared with another's at
     the same station rather than over the whole tube */
  /* the wall thickness along the th = 0 ray, PAIRED WITHIN ONE RING ROW.
     Taking max minus min over a whole y-window mixes the wall's depth with the calibre's change along
     the axis — it read 0.0785 for a 0.074 wall, which is a 6% error smuggled in by the ventricle's
     own taper. A ring row has exactly one outer and one inner vertex on this ray, so grouping by y
     first and differencing within the row gives the wall and nothing else. The row nearest the
     window's centre is the one reported; the spread across rows is reported beside it so a reader can
     see how much the calibre moves over the window rather than having it folded into the answer. */
  const ray = (b, y0, y1) => {
    if (!b) return null;
    const rowsAt = new Map();
    for (let i = 0; i < b.ray.length; i += 2) {
      const y = b.ray[i]; if (y < y0 || y > y1) continue;
      const key = y.toFixed(6);
      const e = rowsAt.get(key) || { y: y, mn: 1e9, mx: -1e9, n: 0 };
      const r = b.ray[i + 1];
      if (r < e.mn) e.mn = r; if (r > e.mx) e.mx = r; e.n++;
      rowsAt.set(key, e);
    }
    const rws = [...rowsAt.values()].filter(e => e.n >= 2);
    if (!rws.length) return null;
    const mid = (y0 + y1) / 2;
    rws.sort((a, b2) => Math.abs(a.y - mid) - Math.abs(b2.y - mid));
    const pick = rws[0];
    let tmin = 1e9, tmax = -1e9;
    for (const e of rws) { const th2 = e.mx - e.mn; if (th2 < tmin) tmin = th2; if (th2 > tmax) tmax = th2; }
    return { rows: rws.length, atY: pick.y, minR: pick.mn, maxR: pick.mx,
             thickness: pick.mx - pick.mn, spread: [tmin, tmax] };
  };
  const band = (b, y0, y1) => {
    if (!b) return null;
    let mn = 1e9, mx = -1e9, n = 0;
    for (let i = 0; i < b.rows.length; i += 2) {
      const y = b.rows[i]; if (y < y0 || y > y1) continue;
      const r = b.rows[i + 1]; n++;
      if (r < mn) mn = r; if (r > mx) mx = r;
    }
    return n ? { n: n, minR: mn, maxR: mx } : null;
  };
  const unionY = (by, keys) => {
    let lo = 1e9, hi = -1e9;
    for (const k of keys) if (by[k]) { lo = Math.min(lo, by[k].minY); hi = Math.max(hi, by[k].maxY); }
    return { lo: lo, hi: hi, extent: hi - lo };
  };
  /* THREE STATES, AND EACH IS THERE FOR A REASON.
       t = 1     day 23: the sheet at its full span with the sinus open
       t = 0.82  fusion has begun (day 21.2) but not finished (day 22.4), so there IS a sheet and it
                 is INTACT — the state the old J test thought it was reading at t = 0.5
       t = 0.5   no sheet at all, because there is no midline tube to suspend yet. Asserted as such
                 rather than read as "a sheet with no gap", which is what the first version of this
                 probe did: mesoSpan(0.5) is null, gapOf() returned null, and J failed on the null
                 instead of on the anatomy. */
  const T_INTACT = 0.82;
  const at1 = read(1), at05 = read(0.5), atIntact = read(T_INTACT);
  const out = { at1: at1, at05: at05, atIntact: atIntact, tIntact: T_INTACT,
                gapOf: gapOf, band: band, ray: ray, unionY: unionY };
  _probe = out;
  return out;
}

/* =============================== THE SHEET AS A CAMERA SEES IT, STATION BY STATION ==============

   ROUND-2 FINDING 1, and why the two rows it names had to be rebuilt rather than retuned.

   Row M read the sheet's vertex SPAN against the tube's and reported 0.045 free at the venous pole and
   0.037 at the arterial one — both true, and both about vertices rather than ink. Row P reduced the
   whole sheet to ONE global pair of minima and passed on its single deepest band, 0.0907, while about
   40 per cent of the sheet's length lay inside the tube's own outline and drew nothing. A student saw a
   mesentery attached over the MIDDLE and free at the ends: round 1's wrong picture, produced the second
   time by tapering instead of by span.

   THE REVIEW'S PRESCRIBED FIX WAS FOR A DIFFERENT DEFECT, AND THIS RUN DID NOT BUILD IT. It asked for
   the near half of the tube to be taken away so the sheet could be seen "against the cavity instead of
   behind the tube". Measured first, as RENDER-STANDARD s6 requires of a note in a file: THE TUBE IS NOT
   THE OCCLUDER. sweptShell draws the tube's dorsal surface at radius x section(3pi/2) x flatten =
   0.8505 of radius(u, t), and the sheet's attachment was at 0.92 of radius — so the whole sheet already
   stood OUTSIDE the tube's silhouette, in 0.019 to 0.030 units of clear air, at every station of the
   day-23 build. A hemisection would have removed geometry that was hiding nothing. What the review had
   measured as "dorsal reach beyond the tube's silhouette" is, to within 0.004, the sheet's OWN DEPTH:
   the finding was right about the picture and wrong about the cause, and the cause is three things,
   each of them measured here and each fixed in this run:

     (i)   the sheet never touched the tube  — dorsalSurface(), above
     (ii)  it hung OUTSIDE the sac at the venous pole, and row P's global comparison could not see it,
           because a reach floor of 0.02 overrode a cavity that had closed in  — mesoReach(), above
     (iii) both taper runs were tuned to a fifth of the tube's LENGTH, nine times the sheet's greatest
           depth, so the sinus was a fade and the poles were slivers  — mesoRun(), above

   WHAT THIS MEASURES. Bands along the tube's own cranio-caudal extent. Per band, from built vertices:
   the sheet's dorsal and ventral edges, the tube's drawn dorsal surface (the ring vertices at x = 0,
   where z is the full dorsal reach and the flattening does not mix in), and the pericardial sac's wall.

   THE SAC IS TESTED AGAINST ITS OWN FITTED SURFACE, NOT ITS FACETS. Its mesh is a 48 x 32 sphere
   scaled, so between rings the drawn surface is a chord lying inside the true ellipsoid, and near the
   poles that chord cuts up to 0.015 inside. Comparing a smooth sheet against a faceted neighbour
   would report faceting as an anatomical error, so the three numbers of the ellipsoid — centre, semi
   axis, equatorial radius — are FITTED FROM THE SAC'S OWN VERTICES and the sheet is tested against
   that. The faceted excursion is reported beside it so the rendering consequence is visible too. */
const SHEET_BANDS = 60;
let _sheet = null;
function sheetProbe() {
  if (_sheet !== null) return _sheet;
  if (!T || typeof T.Group !== 'function' || !K || typeof K.sweptShell !== 'function') return (_sheet = false);
  const SEG = {}; SEG_KEYS.forEach(k => { SEG[k] = 1; });
  const g = buildHeartTube(1, { endocardium: true, jelly: true, lumen: true, mesocardium: true,
                                pericardium: true, midline: false, landmarks: false });
  const sheet = [], dorsal = [], sac = [];
  let tLo = 1e9, tHi = -1e9;
  g.traverse(o => {
    if (!o.isMesh || !o.geometry) return;
    const u = o.userData || {};
    if (u.outline || !u.key) return;
    const pa = o.geometry.attributes && o.geometry.attributes.position;
    if (!pa) return;
    for (let i = 0; i < pa.count; i++) {
      const x = pa.getX(i), y = pa.getY(i), z = pa.getZ(i);
      if (u.key === 'mesocardium') sheet.push(y, z);
      else if (SEG[u.key]) {
        if (y < tLo) tLo = y; if (y > tHi) tHi = y;
        /* x = 0 is theta = 3pi/2 exactly, where the point is P - B * r * section(3pi/2) * flatten and
           -z IS the drawn dorsal reach. Anywhere else mixes the section's shape into the number. */
        if (Math.abs(x) < 1e-7 && z < 0) dorsal.push(y, -z);
      } else if (u.key === 'pericardium') sac.push(y, z, x);
    }
  });
  if (!sheet.length || !(tHi > tLo) || !dorsal.length || !sac.length) return (_sheet = false);

  /* the sac's ellipsoid, fitted from its own vertices */
  let sLoY = 1e9, sHiY = -1e9, sR = 0;
  for (let i = 0; i < sac.length; i += 3) {
    if (sac[i] < sLoY) sLoY = sac[i]; if (sac[i] > sHiY) sHiY = sac[i];
    const r = Math.sqrt(sac[i + 1] * sac[i + 1] + sac[i + 2] * sac[i + 2]);
    if (r > sR) sR = r;
  }
  const sacCy = 0.5 * (sLoY + sHiY), sacHy = 0.5 * (sHiY - sLoY);
  const sacWall = y => { const d = (y - sacCy) / sacHy; return sR * Math.sqrt(Math.max(0, 1 - d * d)); };

  const ext = tHi - tLo;
  /* THE SHEET'S DOMAIN IS THE CENTRELINE, NOT THE TUBE'S VERTEX EXTENT. Beyond the two poles the tube
     is DOME, which tapers to a point — its dorsal surface there is small and the sac still has room
     behind it, so a band over a dome reports space the mesocardium could never occupy: there is no
     centreline left to hang from. The first version of the accounting half of row M read `firstRoomBand`
     as band 0 for exactly that reason. Both the room search and the fill check are restricted to bands
     whose centre lies between the two poles, and the tube's dorsal profile is read only there. */
  const axLo = axisY(0, 1), axHi = axisY(1, 1);
  const bOf = y => Math.max(0, Math.min(SHEET_BANDS - 1, Math.floor((y - tLo) / ext * SHEET_BANDS)));
  const dLo = new Array(SHEET_BANDS).fill(Infinity), dHi = new Array(SHEET_BANDS).fill(-Infinity);
  const tub = new Array(SHEET_BANDS).fill(-Infinity);
  for (let i = 0; i < sheet.length; i += 2) {
    const b = bOf(sheet[i]), d = -sheet[i + 1];
    if (d > dHi[b]) dHi[b] = d;            // dorsal-most  (largest distance behind the axis)
    if (d < dLo[b]) dLo[b] = d;            // ventral edge (the attachment)
  }
  for (let i = 0; i < dorsal.length; i += 2) {
    if (dorsal[i] < axLo || dorsal[i] > axHi) continue;
    const b = bOf(dorsal[i]); if (dorsal[i + 1] > tub[b]) tub[b] = dorsal[i + 1];
  }
  const bandY = b => tLo + ext * (b + 0.5) / SHEET_BANDS;
  const rows = [];
  for (let b = 0; b < SHEET_BANDS; b++) {
    const y = bandY(b), has = dHi[b] > -Infinity;
    const space = tub[b] > -Infinity ? sacWall(y) - tub[b] : null;
    rows.push({
      b: b, u: (b + 0.5) / SHEET_BANDS, y: y, has: has, inAxis: y >= axLo && y <= axHi,
      depth: has ? dHi[b] - dLo[b] : null,
      /* > 0 means the sheet's ventral edge is INSIDE the tube it suspends, which is what attachment is */
      into: (has && tub[b] > -Infinity) ? tub[b] - dLo[b] : null,
      space: space,
      fill: (has && space != null && space > 1e-6) ? (dHi[b] - dLo[b]) / space : null,
    });
  }
  /* every sheet vertex against the fitted sac, and against the drawn facets */
  let outFit = 0, worstFit = -1e9, outFacet = 0, worstFacet = -1e9;
  const ringOf = {};
  for (let i = 0; i < sac.length; i += 3) {
    const k = sac[i].toFixed(4), d = -sac[i + 1];
    if (!(k in ringOf) || d > ringOf[k]) ringOf[k] = d;
  }
  const ringYs = Object.keys(ringOf).map(Number);
  for (let i = 0; i < sheet.length; i += 2) {
    const y = sheet[i], d = -sheet[i + 1];
    const e = d - sacWall(y);
    if (e > worstFit) worstFit = e; if (e > 0) outFit++;
    let best = ringYs[0], bd = 1e9;
    for (const ry of ringYs) { const dd = Math.abs(ry - y); if (dd < bd) { bd = dd; best = ry; } }
    const e2 = d - ringOf[best.toFixed(4)];
    if (e2 > worstFacet) worstFacet = e2; if (e2 > 0) outFacet++;
  }
  /* the remnants: contiguous runs of bands carrying sheet */
  const runs = [];
  for (const r of rows) {
    if (!r.has) { if (runs.length && runs[runs.length - 1].open) runs[runs.length - 1].open = false; continue; }
    if (!runs.length || !runs[runs.length - 1].open) runs.push({ open: true, b0: r.b, b1: r.b, max: r.depth });
    else { const q = runs[runs.length - 1]; q.b1 = r.b; q.max = Math.max(q.max, r.depth); }
  }
  const withSheet = rows.filter(r => r.has);
  const first = withSheet.length ? withSheet[0] : null;
  const last = withSheet.length ? withSheet[withSheet.length - 1] : null;
  /* the declared partition: a band is a TAPER band if it lies within the run solved for the nearer
     edge of its own remnant, and the sinus bands carry no sheet at all. Published here rather than
     absorbed into a tolerance (RENDER-STANDARD 3.z). */
  const mark = r => {
    const q = runs.find(x => r.b >= x.b0 && r.b <= x.b1);
    if (!q) return false;
    const u0 = (q.b0 + 0.5) / SHEET_BANDS, u1 = (q.b1 + 0.5) / SHEET_BANDS;
    const w0 = mesoRun(u0, 1, u0 <= 0.5 / SHEET_BANDS + 1e-9 || q.b0 === 0), w1 = mesoRun(u1, 1, q.b1 === SHEET_BANDS - 1);
    return (r.u - u0) <= w0 * 1.5 || (u1 - r.u) <= w1 * 1.5;
  };
  for (const r of rows) r.taper = r.has ? mark(r) : false;
  const bad = rows.filter(r => r.has && r.inAxis && !r.taper && r.space != null &&
                               r.space >= FLOORS.MESO_SPACE && r.fill != null && r.fill < FLOORS.MESO_FILL);
  /* WHERE THE SHEET IS ABSENT AT THE VENOUS POLE, IS IT ABSENT BECAUSE THERE IS NO ROOM? This is the
     half of row M that makes the pinned 0.095 an argument rather than a tolerance: every band caudal of
     the sheet's first must have NO dorsal space at all. If the sheet ever goes missing where there IS
     room, this fails however generous the pin. */
  let worstSpaceBelow = -1e9, bSpace = null;
  for (const r of rows) {
    if (r.space == null || !r.inAxis) continue;
    if (bSpace == null && r.space > 0) bSpace = r.b;
    if (first && r.b < first.b && r.space > worstSpaceBelow) worstSpaceBelow = r.space;
  }
  /* THE SHEET STARTS WHERE THE ROOM STARTS, to within one band. Stated this way rather than as "no
     band below the sheet has more than X of space", because the reach crosses zero INSIDE a band and a
     threshold on the band's own number is then a statement about the banding. One band of slack and no
     more: if the sheet stopped two bands short of the room, this fails. */
  const accounted = !!(first && bSpace != null && Math.abs(first.b - bSpace) <= 1);
  /* a taper must be MONOTONE toward its own edge — what makes it a taper rather than a gap */
  let monotone = true;
  for (const q of runs) {
    let prev = null;
    for (let b = q.b0; b <= q.b1 && b <= q.b0 + 3; b++) { const d = rows[b].depth; if (prev != null && d < prev - 1e-6) monotone = false; prev = d; }
    prev = null;
    for (let b = q.b1; b >= q.b0 && b >= q.b1 - 3; b--) { const d = rows[b].depth; if (prev != null && d < prev - 1e-6) monotone = false; prev = d; }
  }
  return (_sheet = {
    bands: SHEET_BANDS, tubeY: [tLo, tHi], extent: ext,
    sac: { cy: sacCy, halfY: sacHy, rXZ: sR, fitted_from: 'the sac mesh vertices, not cavity()' },
    axis: [+axLo.toFixed(3), +axHi.toFixed(3)],
    rows: rows.map(r => ({ u: +r.u.toFixed(4), has: r.has, taper: r.taper, inAxis: r.inAxis,
      depth: r.depth == null ? null : +r.depth.toFixed(4),
      into: r.into == null ? null : +r.into.toFixed(4),
      space: r.space == null ? null : +r.space.toFixed(4),
      fill: r.fill == null ? null : +r.fill.toFixed(3) })),
    remnants: runs.map(q => ({ u0: +((q.b0 + 0.5) / SHEET_BANDS).toFixed(3),
                               u1: +((q.b1 + 0.5) / SHEET_BANDS).toFixed(3), maxDepth: +q.max.toFixed(4) })),
    inkFreeVenous: first ? (first.y - ext * 0.5 / SHEET_BANDS - tLo) / ext : 1,
    inkFreeArterial: last ? (tHi - (last.y + ext * 0.5 / SHEET_BANDS)) / ext : 1,
    detachedBands: rows.filter(r => r.has && r.into != null && r.into <= 0).length,
    worstInto: withSheet.reduce((a, r) => r.into == null ? a : Math.min(a, r.into), 1e9),
    fillBad: bad.map(r => ({ u: +r.u.toFixed(3), fill: +r.fill.toFixed(3), space: +r.space.toFixed(4) })),
    taperMonotone: monotone,
    venousAccounted: accounted, firstInkBand: first ? first.b : null, firstRoomBand: bSpace,
    worstSpaceBelowSheet: worstSpaceBelow === -1e9 ? null : +worstSpaceBelow.toFixed(4),
    outsideFitted: outFit, worstOutsideFitted: +worstFit.toFixed(5),
    outsideFacets: outFacet, worstOutsideFacet: +worstFacet.toFixed(5),
    sheetVerts: sheet.length / 2,
  });
}

/* ================================ THE CROSSCUT FACE, READ OFF ITS OWN VERTICES =================
   Row Q. The variant's whole claim is that the annular caps at the ventricle body ARE a transverse
   section, so the face is measured rather than described: is it planar, is it where the beat says, do
   four keys reach it, and do their radii nest with real clearance. THE RADII ARE TAKEN ALONG THE
   THETA = 0 RAY, for the reason row H takes its wall there — elsewhere a radius is the radius times
   section(theta), and comparing one key's radius at one angle with another's at a different angle is
   the mistake row H's first version made. */
let _face = null;
function faceProbe() {
  if (_face !== null) return _face;
  if (!T || typeof T.Group !== 'function' || !K || typeof K.sweptShell !== 'function') return (_face = false);
  const g = buildHeartTube(1, { endocardium: true, jelly: true, lumen: true, mesocardium: false,
                                pericardium: false, midline: false, landmarks: false, crosscut: true });
  const KEYS = ['ventricle', 'jelly', 'endocardium', 'lumen'];
  const by = {};
  let top = -Infinity;
  const all = [];
  g.traverse(o => {
    if (!o.isMesh || !o.geometry) return;
    const u = o.userData || {};
    if (u.outline || !u.key || KEYS.indexOf(u.key) < 0) return;
    const pa = o.geometry.attributes && o.geometry.attributes.position;
    if (!pa) return;
    for (let i = 0; i < pa.count; i++) {
      const x = pa.getX(i), y = pa.getY(i), z = pa.getZ(i);
      all.push(u.key, x, y, z);
      if (y > top) top = y;
    }
  });
  if (!all.length) return (_face = false);
  const EPS = 1e-4;
  let spread = 0;
  for (let i = 0; i < all.length; i += 4) {
    const k = all[i], x = all[i + 1], y = all[i + 2], z = all[i + 3];
    if (top - y > EPS) continue;
    spread = Math.max(spread, top - y);
    const e = by[k] || (by[k] = { n: 0, rMin: Infinity, rMax: -Infinity, rayMin: Infinity, rayMax: -Infinity });
    e.n++;
    const r = Math.sqrt(x * x + z * z);
    if (r < e.rMin) e.rMin = r; if (r > e.rMax) e.rMax = r;
    if (Math.abs(z) < 1e-7 && x > 0) { if (x < e.rayMin) e.rayMin = x; if (x > e.rayMax) e.rayMax = x; }
  }
  const order = ['lumen', 'endocardium', 'jelly', 'ventricle'];
  let worstGap = 1e9;
  for (let i = 0; i + 1 < order.length; i++) {
    const a = by[order[i]], b = by[order[i + 1]];
    if (!a || !b || a.rayMax === -Infinity || b.rayMin === Infinity) { worstGap = -1; break; }
    worstGap = Math.min(worstGap, b.rayMin - a.rayMax);
  }
  const dotOf = view => {
    const d = VIEW_DIR[view];
    const n = Math.sqrt(d[0] * d[0] + d[1] * d[1] + d[2] * d[2]);
    return Math.abs(d[1] / n);      // the face's normal is the tube's axis, +y
  };
  return (_face = {
    faceY: +top.toFixed(6), wantY: +axisY(CROSSCUT_U, 1).toFixed(6),
    flatness: +spread.toFixed(9),
    keys: order.filter(k => by[k] && by[k].n > 0),
    rays: order.reduce((o, k) => { if (by[k]) o[k] = [+by[k].rayMin.toFixed(4), +by[k].rayMax.toFixed(4)]; return o; }, {}),
    worstRingGap: worstGap === 1e9 ? null : +worstGap.toFixed(5),
    dot: { superior: +dotOf('superior').toFixed(4), anterior: +dotOf('anterior').toFixed(4),
           lateral: +dotOf('lateral').toFixed(4) },
    note: 'the face normal is the tube axis, +y; the dots are |axis . VIEW_DIR| copied from viz3d',
  });
}

/* ============= dorsalSurface() AGAINST THE BUILT TUBE, so a copied constant cannot drift ========
   Row S. KIT_FLATTEN and the section's dorsal value are read out of render-kit by hand; the whole
   mesocardium attachment now rests on them. So they are asserted, at six stations, against the ring
   vertices at x = 0 of the day-23 build. If sweptShell's flatten default or DEFAULT_SECTION ever
   moves, this row fails instead of the membrane quietly floating off the tube again. */
function surfaceProbe() {
  const sp = sheetProbe();
  if (!sp) return null;
  const g = buildHeartTube(1, { endocardium: false, jelly: false, lumen: false, mesocardium: false,
                                pericardium: false, midline: false, landmarks: false });
  const SEG = {}; SEG_KEYS.forEach(k => { SEG[k] = 1; });
  const pts = [];
  g.traverse(o => {
    if (!o.isMesh || !o.geometry) return;
    const u = o.userData || {};
    if (u.outline || !u.key || !SEG[u.key]) return;
    const pa = o.geometry.attributes && o.geometry.attributes.position;
    if (!pa) return;
    for (let i = 0; i < pa.count; i++) {
      if (Math.abs(pa.getX(i)) < 1e-7 && pa.getZ(i) < 0) pts.push(pa.getY(i), -pa.getZ(i));
    }
  });
  let worst = 0, at = null;
  const checked = [];
  for (const u of [0.15, 0.30, 0.45, 0.53, 0.70, 0.85]) {
    const y = axisY(u, 1), want = dorsalSurface(u, 1);
    let got = null, bd = 1e9;
    for (let i = 0; i < pts.length; i += 2) { const d = Math.abs(pts[i] - y); if (d < bd) { bd = d; got = pts[i + 1]; } }
    if (got == null) continue;
    const e = Math.abs(got - want);
    checked.push({ u: u, want: +want.toFixed(6), got: +got.toFixed(6), err: +e.toFixed(8), dy: +bd.toFixed(5) });
    if (e > worst) { worst = e; at = u; }
  }
  return { stations: checked, worstErr: +worst.toFixed(8), worstAt: at,
           flatten: KIT_FLATTEN, sectionDorsal: +K.DEFAULT_SECTION(3 * Math.PI / 2).toFixed(6) };
}

function measure() {
  const m = {};
  const tab = frontTable();

  /* A */
  m.frontAt0 = tab[0];
  m.frontAt1 = tab[FRONT_STEPS];
  let worstRise = 0, worstStep = 0, stepAt = 0;
  for (let i = 1; i <= FRONT_STEPS; i++) {
    worstRise = Math.max(worstRise, tab[i] - tab[i - 1]);
    if (tab[i - 1] - tab[i] > worstStep) { worstStep = tab[i - 1] - tab[i]; stepAt = i / FRONT_STEPS; }
  }
  m.frontWorstRise = worstRise;
  /* REPORTED, NOT ASSERTED, and it is the most interesting thing the solver produced.

     THE ZIP IS STEPWISE, CHAMBER BY CHAMBER, and nothing put it there. The front creeps while it is
     sitting on a CONSTRICTION — the narrowest part of the tube is the last part to touch — and then
     crosses it and runs on to the shoulder of the next one. Measured, the four stalls are at
     u = 0.878, 0.663, 0.400 and 0.158, and the four named waists this tube is divided at are 0.870,
     0.660, 0.400 and 0.165. The tube fuses one chamber at a time and pauses at every landmark a
     student is examined on, and that fell out of "the tubes fuse where they touch" applied to a
     calibre profile written for an entirely different reason.

     The practical consequence, which matters for choosing a view's t: the front is nearly flat for
     long stretches and moves by about 0.19 in a single step at each crossing. ZIP_T is set in the
     middle of the longest plateau, not next to a step, so the zip view's picture is stable against a
     small change anywhere in the model. */
  m.frontWorstStep = worstStep;
  m.frontWorstStepAt = stepAt;

  /* B — at the front, the surfaces touch */
  let contactErr = 0;
  for (const t of [0.70, 0.75, 0.80, 0.85]) {
    const uF = contactFront(t);
    if (uF <= 0 || uF >= 1) continue;
    contactErr = Math.max(contactErr, Math.abs(halfSep(uF, t) - limbRadius(uF, t)) / limbRadius(uF, t));
  }
  m.contactErr = contactErr;

  /* C — MID-ZIP THE PICTURE SHOWS BOTH STATES AT ONCE, and it is measured at ZIP_T, the t the zip
     view is actually drawn at, not at whatever t happens to flatter it. The first version of this
     test measured the gap a fixed 0.15 of arc behind the front and read 0.14 of a diameter — which is
     not a defect, it is what "just behind the point where two tubes touch" must look like for any
     curve. Measuring it there conflated how FAST the gap opens with whether the gap is VISIBLE. What
     a student has to see is the two states side by side: one tube cranially, two tubes at the venous
     end. */
  const uZ = fusionFront(ZIP_T), rZ = limbRadius(0, ZIP_T);
  m.zipFront = uZ;
  m.zipSingleFraction = 1 - uZ;
  m.zipGapAtVenous = (2 * halfSep(0, ZIP_T) - 2 * rZ) / (2 * rZ);

  /* E, F — the order along the cranio-caudal axis, at both ends of the process */
  /* ONE EXPRESSION, TWO CALLERS: orderRatio() is what the scene's beat claims read too, so an
     acceptance row and a narrated claim can never drift into measuring the order two ways. */
  for (const [tag, t] of [['0', 0], ['1', 1]]) {
    m['stMinusHeart' + tag] = orderRatio('st', t);
    m['heartMinusBpm' + tag] = orderRatio('bpm', t);
  }

  /* G — PAIRED AT DAY 18, ONE TUBE AT DAY 23.

     Only the day-18 half is a measurement the model can make about itself. "The day-23 tube straddles
     the median plane" is TRUE BY CONSTRUCTION here — the fused tube is a solid of revolution about
     x = 0 — so asserting it in acceptance() would be a test that cannot fail, which is exactly what
     RENDER-STANDARD forbids. What the model CAN assert is the two facts the construction rests on:
     the front has reached the venous pole, and the lateral offset is gone. The straddle itself is
     measured on real mesh vertices by boxProbe in the prover, where it is capable of being wrong. */
  const uMid0 = 0.5;
  const h0 = halfSep(uMid0, 0), r0 = limbRadius(uMid0, 0);
  m.pairGap0 = (2 * h0 - 2 * r0) / (2 * r0);
  m.front1 = fusionFront(1);
  m.offset1 = Math.max(halfSep(0, 1), halfSep(0.5, 1), halfSep(1, 1));

  /* H — the three coats at the ventricle body */
  const c = coats(0.530, 1, 1);
  const depth = c.mOut - c.eIn;
  m.coatMyo = (c.mOut - c.mIn) / depth;
  m.coatJelly = (c.jOut - c.jIn) / depth;
  m.coatEndo = (c.eOut - c.eIn) / depth;
  /* the clearance between coats, scanned across the WHOLE tube and BOTH scales rather than read at
     the one station the shares are quoted at — the radii are clamped at the thin end, and a clamp
     that bites would put two coats on the same surface somewhere this station never looks. */
  m.coatClearMin = 1e9;
  for (let i = 0; i <= NSEG; i++) {
    for (const sc of [1, LIMB_SCALE]) {
      for (const tt2 of [0, 0.5, 1]) {
        const cc = coats(i / NSEG, tt2, sc);
        m.coatClearMin = Math.min(m.coatClearMin, cc.mOut - cc.mIn, cc.mIn - cc.jOut,
                                  cc.jOut - cc.jIn, cc.jIn - cc.eOut, cc.eOut - cc.eIn);
      }
    }
  }
  m.endoOuterAt1 = c.eOut;
  m.endoOuterWanted = radius(0.530, 1) - WALL - JELLY;

  /* I — boundaries at waists */
  let worstWaist = 0;
  for (const u of [0.165, 0.400, 0.660, 0.870]) {
    let best = 1e9, bestU = u;
    for (let x = u - 0.06; x <= u + 0.06; x += 0.001) {
      const r = radius(x, 1);
      if (r < best) { best = r; bestU = x; }
    }
    worstWaist = Math.max(worstWaist, Math.abs(bestU - u));
  }
  m.worstWaist = worstWaist;

  /* J, M, N — everything read off the BUILT geometry. mesoHalfGap(1) is still reported, because it
     is worth being able to see the constant next to the sheet it produced, but nothing asserts it
     against itself any more. */
  m.mesoHalfGapConstant = mesoHalfGap(1);
  m.mesoGapBeforeFusionConstant = mesoHalfGap(0.5);
  const PB = probe();
  m.probed = !!PB;
  if (PB) {
    const g1 = PB.gapOf(PB.at1['mesocardium']), gI = PB.gapOf(PB.atIntact['mesocardium']);
    m.mesoGap1Frac = g1 ? g1.frac : null;
    m.mesoGap1MidFrac = g1 ? g1.midFrac : null;
    m.mesoGapIntactFrac = gI ? gI.frac : null;
    m.mesoIntactT = PB.tIntact;
    /* before there is a midline tube there is no sheet, and that is an ASSERTION not a null */
    m.mesoAbsentAt05 = !PB.at05['mesocardium'];

    /* M — both poles. THE ROW NOW HANGS ON INK, NOT ON SPAN. The two span numbers below are kept and
       reported because they are what the row used to assert and what the round-2 review rejected: a
       reader should be able to see the old measurement and the new one side by side rather than take
       it on trust that the row changed. See sheetProbe() for the three defects behind the change. */
    const tube1 = PB.unionY(PB.at1, SEG_KEYS);
    const meso1 = PB.at1['mesocardium'];
    m.tubeExtent1 = tube1.extent;
    m.mesoSpanFreeVenous = meso1 ? (meso1.minY - tube1.lo) / tube1.extent : null;
    m.mesoSpanFreeArterial = meso1 ? (tube1.hi - meso1.maxY) / tube1.extent : null;

    /* N — the lumen inside the endocardium.
       SCANNED OVER THE SHELL, NOT THE DOMES, and the exclusion is reported rather than assumed away.
       Both keys close to a point at a terminal dome, at slightly different y, so a band that straddles
       one compares a dome tip with a shell and the ratio is meaningless there — the degenerate case
       this probe has to name (RENDER-STANDARD, round 3). The scan therefore runs between the axis
       stations u = 0.03 and u = 0.97 and says so. */
    const uLo = 0.03, uHi = 0.97;
    m.lumenScan = { u0: uLo, u1: uHi, yLo: axisY(uLo, 1), yHi: axisY(uHi, 1),
                    excluded: 'the six terminal domes, where both surfaces close to a point' };
    /* MIN AGAINST MIN, AND WHY THAT IS THE CONTAINMENT PROOF AND NOT A WEAKER ONE.
       The lumen and the endocardium's inner surface are the SAME unit shape scaled by two radii —
       same frame, same ring count, same section(), same flatten — so a point on either is
       R * shape(th) and the ratio of their radii at any matched angle is the ratio of their R. Taking
       the SMALLEST radius of each in a band therefore divides out shape(th) exactly, and a ratio
       below 1 means the lumen lies strictly inside at every angle, not only at the one measured.
       The first version compared the lumen's LARGEST radius with the endocardium's smallest, which
       compares th = 0 against th = pi/2 and reported -0.788 on a cast that is nowhere near its wall.
       The max-to-max ratio is also reported: it lands against the endocardium's OUTER surface and so
       is a weaker statement, kept because a reader should be able to see both. */
    let worst = 1e9, worstOuter = 1e9, bands = 0;
    const BANDS = 60;
    for (let i = 0; i < BANDS; i++) {
      const y0 = m.lumenScan.yLo + (m.lumenScan.yHi - m.lumenScan.yLo) * (i / BANDS);
      const y1 = m.lumenScan.yLo + (m.lumenScan.yHi - m.lumenScan.yLo) * ((i + 1) / BANDS);
      const L = PB.band(PB.at1['lumen'], y0, y1), E = PB.band(PB.at1['endocardium'], y0, y1);
      if (!L || !E || E.minR <= 1e-6 || E.maxR <= 1e-6) continue;
      bands++;
      worst = Math.min(worst, 1 - L.minR / E.minR);
      worstOuter = Math.min(worstOuter, 1 - L.maxR / E.maxR);
    }
    m.lumenClearMin = bands ? worst : null;
    m.lumenClearVsOuter = bands ? worstOuter : null;
    m.lumenBandsScanned = bands;
    m.lumenHomothetic = 'lumen and endocardium share frame, ring count, section() and flatten, so ' +
      'a radius ratio is angle-independent — that is what makes min-against-min a containment proof';
    const lum = PB.at1['lumen'];
    m.lumenSpanFrac = lum ? (lum.maxY - lum.minY) / tube1.extent : null;

    /* P — THE SHEET STATION BY STATION. The two global comparisons that used to live here are kept as
       `mesoGlobal` and reported, because they PASSED while the picture was wrong and a reader should be
       able to see how: one pair of extreme minima cannot tell a sheet that fills its space from one
       that has a single deep band. */
    m.mesoGlobal = {};
    for (const [tag, set] of [['t1', PB.at1], ['tIntact', PB.atIntact]]) {
      const ms = set['mesocardium'], sac = set['pericardium'];
      const tubeZ = SEG_KEYS.reduce((a, k) => set[k] ? Math.min(a, set[k].minZ) : a, 1e9);
      m.mesoGlobal[tag] = (ms && sac && tubeZ < 1e8) ? {
        meso_minZ: ms.minZ, sac_minZ: sac.minZ, tube_minZ: tubeZ,
        insideSacGlobally: ms.minZ >= sac.minZ, proudOfTube: tubeZ - ms.minZ,
      } : null;
    }
    m.mesoProudMinGlobal = ['t1', 'tIntact'].reduce((a, k) =>
      m.mesoGlobal[k] ? Math.min(a, m.mesoGlobal[k].proudOfTube) : a, 1e9);

    /* H, the thickness ratio — read along the th = 0 ray at the ventricle body, where a radius is
       the radius and not the radius times the section's shape. See the note in probe(). */
    const yV = axisY(0.530, 1), hw = 0.10;
    const rMyo = PB.ray(PB.at1['ventricle'], yV - hw, yV + hw);
    const rJel = PB.ray(PB.at1['jelly'], yV - hw, yV + hw);
    m.builtWall = rMyo ? rMyo.thickness : null;
    m.builtJelly = rJel ? rJel.thickness : null;
    m.builtRayRows = { myocardium: rMyo ? rMyo.rows : 0, jelly: rJel ? rJel.rows : 0,
                       atY: rMyo ? rMyo.atY : null,
                       wall_spread: rMyo ? rMyo.spread : null, jelly_spread: rJel ? rJel.spread : null };
    m.builtJellyOverWall = (m.builtWall && m.builtJelly) ? m.builtJelly / m.builtWall : null;
  }

  /* K — THE CAVITY, AND THE ONE PLACE THE CLEARANCE GOES BACK UP.

     The first version of this test asserted the clearance falls monotonically and it does not: it
     rises by 0.084 at the moment fusion completes. That is not a defect and it is not noise — two
     tubes lying side by side are wider than the single tube they fuse into, so the assembly NARROWS
     when the zip finishes. Asserting monotonicity would have meant either hiding a real feature or
     removing it. So the test asserts what is true: the two endpoints, and monotone crowding from
     fusion onwards, with the step itself measured and reported rather than smoothed away. */
  m.clear0 = clearanceFraction(0);
  m.clear1 = clearanceFraction(1);
  const tEnd = fusionDates().tEnd;
  let riseAfter = 0, riseAny = 0, prev = clearanceFraction(0);
  for (let i = 1; i <= 400; i++) {
    const tt3 = i / 400, cf = clearanceFraction(tt3);
    riseAny = Math.max(riseAny, cf - prev);
    if (tEnd != null && tt3 > tEnd) riseAfter = Math.max(riseAfter, cf - prev);
    prev = cf;
  }
  m.clearRiseAfterFusion = riseAfter;
  m.clearStepAtFusion = riseAny;

  /* L — cardia bifida */
  const uFb = BIFIDA_FRONT;
  const hb = halfSep(0.5, BIFIDA_T), rb = limbRadius(0.5, 1);
  m.bifidaFront = uFb;
  m.bifidaGap = (2 * hb - 2 * rb) / (2 * rb);

  /* ---- M, P, Q and S: the per-station sheet, the crosscut face, and the copied kit constants ---- */
  const SH = sheetProbe();
  m.sheet = SH || null;
  if (SH) {
    m.mesoInkFreeVenous   = +SH.inkFreeVenous.toFixed(4);
    m.mesoInkFreeArterial = +SH.inkFreeArterial.toFixed(4);
    m.mesoVenousAccounted = SH.venousAccounted;
    m.mesoWorstSpaceBelowSheet = SH.worstSpaceBelowSheet;
    m.mesoFirstInkBand = SH.firstInkBand; m.mesoFirstRoomBand = SH.firstRoomBand;
    m.mesoDetachedBands  = SH.detachedBands;
    m.mesoWorstInto      = +SH.worstInto.toFixed(4);
    m.mesoFillBad        = SH.fillBad;
    m.mesoTaperMonotone  = SH.taperMonotone;
    m.mesoRemnants       = SH.remnants;
    m.mesoOutsideSacVerts = SH.outsideFitted;
    m.mesoWorstOutsideSac = SH.worstOutsideFitted;
    m.mesoFacetExcursion = { verts: SH.outsideFacets, worst: SH.worstOutsideFacet,
      why: 'the sac is a 48x32 sphere, so between rings its DRAWN surface is a chord inside the true ' +
           'ellipsoid; this is the rendering consequence and not an anatomical error. The row asserts ' +
           'against the ellipsoid FITTED FROM THE SAC\'S OWN VERTICES.' };
  }
  const FA = faceProbe();
  m.face = FA || null;
  if (FA) {
    m.crossFaceErr   = Math.abs(FA.faceY - FA.wantY);
    m.crossFlatness  = FA.flatness;
    m.crossKeys      = FA.keys.length;
    m.crossRingGap   = FA.worstRingGap;
    m.crossDotSuperior = FA.dot.superior;
    m.crossDotAnterior = FA.dot.anterior;
  }
  const SU = surfaceProbe();
  m.surface = SU || null;
  m.surfaceWorstErr = SU ? SU.worstErr : null;

  m.dates = fusionDates();
  return m;
}

/* THE PREDICATES LIVE APART FROM THE MEASUREMENT, so negatives() can feed each one a deliberately
   wrong number and check that it is rejected. RENDER-STANDARD: every id in an ACCEPTANCE block gets a
   negative case, the way validate-scenes negative-tests its own checks. */
const PRED = {
  A: m => m.frontAt0 >= 1 - 1e-9 && m.frontAt1 <= 1e-9 && m.frontWorstRise <= 1e-9,
  B: m => m.contactErr <= 1e-3,
  C: m => m.zipSingleFraction >= 0.40 && m.zipGapAtVenous >= FLOORS.GAP,
  D: m => m.dates.dayStart != null && m.dates.dayEnd != null &&
          m.dates.dayStart >= 20.5 && m.dates.dayEnd >= 21.5 && m.dates.dayEnd <= 22.5,
  E: m => m.stMinusHeart0 >= FLOORS.ORDER && -m.stMinusHeart1 >= FLOORS.ORDER,
  F: m => m.heartMinusBpm0 >= FLOORS.ORDER && -m.heartMinusBpm1 >= FLOORS.ORDER,
  G: m => m.pairGap0 >= FLOORS.GAP && m.front1 <= 1e-9 && m.offset1 <= 1e-12,
  H: m => m.coatMyo >= FLOORS.COAT && m.coatJelly >= FLOORS.COAT && m.coatEndo >= FLOORS.COAT &&
          m.coatClearMin > 0 && Math.abs(m.endoOuterAt1 - m.endoOuterWanted) <= 1e-9 &&
          m.builtJellyOverWall != null && m.builtJellyOverWall >= FLOORS.JELLY_WALL,
  I: m => m.worstWaist <= FLOORS.WAIST,
  J: m => m.mesoAbsentAt05 === true &&
          m.mesoGapIntactFrac != null && m.mesoGap1Frac != null && m.mesoGap1MidFrac != null &&
          m.mesoGapIntactFrac <= FLOORS.NOSINUS && m.mesoGap1Frac >= FLOORS.SINUS &&
          m.mesoGap1MidFrac >= FLOORS.SINUS_MID && m.mesoGap1MidFrac <= 1 - FLOORS.SINUS_MID,
  K: m => m.clear0 >= FLOORS.CLEAR0 && m.clear1 <= FLOORS.CLEAR1 && m.clearRiseAfterFusion <= 1e-9,
  L: m => m.bifidaFront >= 1 - 1e-9 && m.bifidaGap >= FLOORS.GAP,
  /* M — the sheet reaches both poles IN INK, and where it does not, the SAC has taken the room.
     Two halves, and the second is what makes the venous pin an argument: if the sheet ever goes
     missing at a station where dorsal space exists, `mesoVenousAccounted` is false and the row fails
     however generous the pin. */
  M: m => m.mesoInkFreeVenous != null && m.mesoInkFreeArterial != null &&
          m.mesoInkFreeArterial <= FLOORS.POLE_REACH &&
          m.mesoInkFreeVenous <= FLOORS.MESO_FREE_VENOUS_PIN &&
          m.mesoVenousAccounted === true,
  N: m => m.lumenClearMin != null && m.lumenBandsScanned >= 40 &&
          m.lumenClearMin >= FLOORS.LUMEN_CLEAR &&
          m.lumenSpanFrac != null && m.lumenSpanFrac >= FLOORS.LUMEN_SPAN,
  /* P — PER STATION, four statements, none of them satisfiable by one good band:
       the sheet is attached to the tube at every station it exists at;
       it stays inside the sac's own fitted wall at every vertex;
       wherever dorsal space exists and the station is not inside a declared taper run, the sheet
         takes at least MESO_FILL of that space;
       the sheet is TWO remnants and EACH of them is legible somewhere along it — the old row could
         pass on the deeper remnant alone;
       and every taper runs monotonically to its own edge, which is what makes it a taper. */
  P: m => m.sheet != null &&
          m.mesoDetachedBands === 0 && m.mesoWorstInto > 0 &&
          m.mesoWorstOutsideSac <= FLOORS.MESO_SAC_TOL &&
          m.mesoFillBad != null && m.mesoFillBad.length === 0 &&
          m.mesoRemnants != null && m.mesoRemnants.length === 2 &&
          m.mesoRemnants.every(r => r.maxDepth >= FLOORS.MESO_PROUD) &&
          m.mesoTaperMonotone === true,
  /* Q — the crosscut face IS a transverse section, read off its own vertices */
  Q: m => m.face != null && m.crossFaceErr <= 1e-4 && m.crossFlatness <= FLOORS.CROSS_FLAT &&
          m.crossKeys === 4 && m.crossRingGap != null && m.crossRingGap >= FLOORS.CROSS_GAP &&
          m.crossDotSuperior >= FLOORS.CROSS_DOT && m.crossDotAnterior <= 0.10,
  /* S — the two constants copied out of render-kit still describe the tube it draws */
  S: m => m.surface != null && m.surfaceWorstErr != null && m.surfaceWorstErr <= FLOORS.SURFACE_TOL,
};

/* the deliberately wrong input each test must reject */
const NEGATIVE = {
  A: m => Object.assign({}, m, { frontWorstRise: 0.02 }),          // a front that creeps backwards
  B: m => Object.assign({}, m, { contactErr: 0.20 }),              // fusing where nothing touches
  C: m => Object.assign({}, m, { zipGapAtVenous: 0.05 }),          // apart in the arithmetic, not in the picture
  D: m => Object.assign({}, m, { dates: { dayStart: 18.2, dayEnd: 19.0 } }),   // fused before it formed
  E: m => Object.assign({}, m, { stMinusHeart1: -0.02 }),          // an inversion nobody could see
  F: m => Object.assign({}, m, { heartMinusBpm0: 0.01 }),
  G: m => Object.assign({}, m, { pairGap0: 0.04 }),                // two "separate" tubes in contact
  H: m => Object.assign({}, m, { builtJellyOverWall: 0.73 }),      // the ratio finding 7 reported
  I: m => Object.assign({}, m, { worstWaist: 0.09 }),              // a boundary on the side of a bulge
  J: m => Object.assign({}, m, { mesoGap1Frac: 0.01 }),            // never broke down
  K: m => Object.assign({}, m, { clear1: 0.31 }),                  // a cavity that grew with the tube
  L: m => Object.assign({}, m, { bifidaGap: 0.04 }),               // "bifid" tubes touching each other
  /* FED THE MEASURED SHAPE OF THE REAL DEFECT rather than a typed-in number: a sheet that stops short
     of the venous pole at a station where the sac still leaves room is exactly what the pin must not
     be able to excuse. */
  M: m => Object.assign({}, m, { mesoVenousAccounted: false, mesoWorstSpaceBelowSheet: 0.13 }),
  N: m => Object.assign({}, m, { lumenClearMin: -0.01 }),          // a cast through its own endocardium
  /* the profile the round-2 review measured: one deep band and 40% of the length showing nothing.
     The old row passed on it; this one must not. */
  P: m => Object.assign({}, m, { mesoFillBad: [{ u: 0.09, fill: 0.12, space: 0.13 }] }),
  Q: m => Object.assign({}, m, { crossDotSuperior: 0.001, crossDotAnterior: 0.999 }),  // the camera beat 4 had
  S: m => Object.assign({}, m, { surfaceWorstErr: 0.026 }),        // the gap MESO_ON_TUBE = 0.92 left
};

let _measured = null;
function acceptance(opts) {
  if (opts != null && typeof opts === 'number') {
    /* The same trap cardiac-looping's acceptance() had to grow a guard for: a reviewer reading the
       notes naturally calls acceptance(1) or acceptance(0.65). There is no numeric argument here —
       every test states its own t — so say so instead of returning confident nonsense. */
    throw new Error('heart-tube-formation acceptance() takes no t. Every test states the t it is ' +
      'evaluated at (see ACCEPTANCE). Call acceptance() with no argument. Got ' + opts + '.');
  }
  const m = _measured || (_measured = measure());
  const pass = {};
  for (const id in PRED) pass[id] = !!PRED[id](m);
  return { measured: m, pass: pass, allPass: Object.keys(pass).every(k => pass[k]), spec: ACCEPTANCE,
           floors: FLOORS };
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
  try {
    const r = acceptance();
    if (!r.allPass) {
      const bad = Object.keys(r.pass).filter(k => !r.pass[k]).join(', ');
      console.warn('[heart-tube-formation] ACCEPTANCE FAILED for ' + bad +
        ' — the mechanism no longer produces the anatomy it was written against.', r.measured);
    }
  } catch (e) { /* never let a self-check break a render */ }
}

/* ------------------------------------------------------- the dorsal mesocardium

   RULED BY FRANK, 2026-09-29: "extend the dorsal mesocardium to BOTH poles with the transverse sinus
   as the opening between the two remnants". Before this it spanned u 0.30..0.84 of a tube spanning
   0..1, so 30 per cent of the tube hung free at the venous pole and 16 per cent at the arterial one
   while beat 5's own narration says the breakdown leaves the tube "attached only at its two ends and
   free in between". The picture was the exact inverse of the sentence. It now runs pole to pole and
   the ONLY hole in it is the one the narration names.

   SO THE TAPER IS ASYMMETRIC, and that is the whole geometry of the fix rather than a detail. Each
   remnant has two edges and they are different things:

     · at a POLE the sheet is continuous with the pericardial reflection around the great vessels or
       the veins. It is not a free edge, so it does not taper away — it is rounded off over a short
       fillet, just enough that it does not end in the slab of card RENDER-STANDARD §3 warns about.
     · at the SINUS the sheet has TORN. A torn edge is a free edge and must narrow to nothing, drawn
       out over a long run, so the transverse sinus reads as an opening bounded by two thinning
       tongues instead of a rectangle punched out of a wall.

   AND THE DORSAL REACH IS SOLVED, NOT TUNED (RENDER-STANDARD §3). It used to be the constant 1.15,
   which is a number that happens to look right at one t and at one station. A mesentery reaches from
   the thing it suspends to the wall it hangs from, so the reach is READ OFF THE CAVITY at that
   station's own y: the dorsal wall of the pericardial sac, less the tube's own dorsal surface. It
   therefore narrows toward the poles by itself, because the sac closes there, and it cannot drift out
   of agreement with a cavity that changes size with t.

   It still cannot exist before there is a midline tube to suspend, so ahead of the fusion front there
   is no sheet — and that leading edge is a free edge too, so it tapers like a torn one. Its central
   breakdown opens after fusion completes and reaches cardiac-looping's own day-23 gap at t = 1, which
   is what makes that scene's view 2 — "the dorsal mesocardium has already broken down" — true at the
   moment it is drawn. */
const MESO_U1 = 1.0, MESO_MID = 0.575, MESO_U0_MIN = 0.0;
/* THE TWO TAPER RUNS ARE SOLVED FROM THE SHEET'S OWN DEPTH, NOT TUNED — round-3 build run, 2026-09-30,
   and this is the fix for the round-2 finding that the ruling was "in the vertices and not in the
   picture". They used to be 0.085 and 0.22 of the tube's LENGTH: 0.56 and 1.44 units, on a sheet whose
   greatest depth anywhere is 0.163. A tear that draws out over nine times the depth of the membrane it
   is in is not an opening between two tongues, it is a fade — which is exactly what a student saw, and
   why the sheet read as attached over the middle and free at the ends for a second round running,
   "produced now by tapering instead of by span". A torn edge in a membrane draws out over a distance of
   the order of its own DEPTH, so that is what sets the run, and it moves with the depth instead of
   disagreeing with it. RENDER-STANDARD: prefer a solved parameter to a tuned one, and solve the one
   that decides the examinable relation — here, whether the transverse sinus reads as a hole. */
const MESO_TORN_ASPECT = 1.6;     // a torn free edge draws out over about 1.6x the sheet's own depth
const MESO_POLE_ASPECT = 0.8;     // a reflection edge rounds off over a shorter run than it is deep
const MESO_RUN_MIN     = 0.010;   // ...floored, so a run is never thinner than the panel's row spacing
const MESO_RUN_MAX     = 0.10;    // ...and capped, so a deep sheet cannot taper over the whole remnant
/* WHERE THE SHEET ATTACHES, now as a fraction of the DRAWN dorsal surface rather than of radius().
   Slightly under 1, so the ventral edge sinks into the tube and no edge of the sheet is ever exposed —
   the same reason the segments are built with OVERLAP. See dorsalSurface() for what was wrong before. */
const MESO_ON_TUBE     = 0.97;
const MESO_TO_WALL     = 0.98;    // how near the sac's dorsal wall the free edge reaches
const MESO_POLE_POW    = 0.45, MESO_TORN_POW = 1.15;
function mesoSpan(t) {
  const uf = fusionFront(t);
  const u0 = uf <= 1e-6 ? MESO_U0_MIN : Math.max(MESO_U0_MIN, uf + 0.03);
  return u0 >= MESO_U1 - 0.06 ? null : [u0, MESO_U1];
}
function mesoHalfGap(t) {
  const d = fusionDates();
  if (d.tEnd == null || t <= d.tEnd) return 0;
  return MESO_GAP_D23 * smooth((t - d.tEnd) / (1 - d.tEnd));
}
/* the reach available at station u: dorsal pericardial wall, less the tube's own drawn dorsal surface.
   The sac is the ellipsoid cavity() builds, so this is the same surface the drawn sac has.

   THE FLOOR IS 0 AND USED TO BE 0.02, WHICH IS THE SECOND DEFECT THIS RUN MEASURED. Where the sac has
   closed in on the tube — which it does at both poles, because the tube outgrows its cavity and that
   is acceptance K and beat 8's whole point — `wall * 0.98 - anchor` goes NEGATIVE, and a floor of 0.02
   answered that by putting the sheet OUTSIDE the cavity it suspends the tube inside. Measured on the
   day-23 build: over the caudal 7% of the tube the sheet's free edge stood 0.021 to 0.051 units dorsal
   of the sac's own dorsal wall. Row P claims in terms that "every mesocardial vertex is ... ventral of
   the sac's own dorsal wall" and passed throughout, because it compared the sheet's GLOBAL minimum z
   (-0.462) with the sac's GLOBAL minimum z (-0.502) — the same global-versus-per-station fault the
   round-2 review named in the other half of that row. gap 19's "so it lands inside by construction"
   was true at the equator and false at the poles.

   WITH THE FLOOR AT 0 THE SHEET HAS NO DEPTH WHERE THE SAC TOUCHES THE TUBE, and that is the anatomy
   rather than a shortfall: at the poles the pericardium reflects around the vessels, and a reflection
   is a LINE. The sheet still spans pole to pole, which is what Frank ruled; row M now measures the
   span and the INK separately and pins the difference. */
function mesoReach(u, t) {
  const cav = cavity(t);
  const dy = (axisY(u, t) - cav.cy) / cav.halfY;
  const wall = cav.rXZ * Math.sqrt(Math.max(0, 1 - dy * dy));
  return Math.max(0, wall * MESO_TO_WALL - dorsalSurface(u, t) * MESO_ON_TUBE);
}
/* how far, in u, one edge of a panel draws out — SOLVED from the reach at that edge's own station.
   'pole' picks the short rounded reflection edge over the longer torn one. */
function mesoRun(u, t, pole) {
  const asp = pole ? MESO_POLE_ASPECT : MESO_TORN_ASPECT;
  return Math.max(MESO_RUN_MIN, Math.min(MESO_RUN_MAX, asp * mesoReach(u, t) / len(t)));
}
/* one edge's profile: d is the distance in u from that edge, w the run solved for it. Multiplied
   together the two edges give the panel's taper. */
function mesoEdge(d, w, pole) {
  const k = Math.max(0, Math.min(1, d / Math.max(1e-6, w)));
  return Math.pow(k, pole ? MESO_POLE_POW : MESO_TORN_POW);
}

/* ---------------------------------------------------------------- cardia bifida

   NOT A DIFFERENT DRAWING. The lateral folds fail, so phi stops; everything else — elongation,
   the ballooning of the chambers, the head fold — carries on. That is the malformation: two hearts,
   each of them otherwise normal, which is why it is described as two beating tubes rather than as an
   absence. Implemented as a clamp on the fold angle and nothing else. */
const BIFIDA_T = 0.30;               // the fold angle the lateral folds never get past
const BIFIDA_FRONT = 1;              // ...so the front never leaves the cranial end

/* ------------------------------------------------- the crosscut, and why it is BUILT and not clipped

   ROUND-2 FINDING 2, 2026-09-30. Beat 4 is titled "Cut the tube across" and its narration opens "Cut
   across the new tube", and what the player drew was the pre-built LONGITUDINAL cutaway window in the
   ventricle: three nested tubes in long section, no rings. The round-1 finding had been that the beat
   sectioned along the tube instead of across it; it still did, by a different route.

   THE ENGINE CANNOT CUT IT. viz3d.js sets
       m.material.clippingPlanes = (clipping && !isTaught(s)) ? [clipPlane] : null
   and isTaught is `role !== 'context'`, so CROSS_SECTION never clips a structure with role 'part' or
   'primary' — a scene cannot section its own subject. Every coat in this beat is role 'part'. That is
   also why round 1's advice to "revert the cut_* refs to plain refs" would have left three intact
   nested tubes with nothing opened at all.

   SO THE SECTION IS BUILT, AND IT COSTS NO NEW GEOMETRY. sweptShell already closes the end of every
   span with an ANNULAR cap, outer rim to inner rim; that ring IS the figure. The variant stops the
   fused tube at the ventricle body and skips the cranial dome, so the caps that were always there
   become the picture, and the lumen's own solid cap — a centre fan — is the disc inside them. Three
   concentric rings and a disc, from ROTATE_TO_VIEW superior. Acceptance row Q reads the face's own
   vertices: that it is planar, that it is normal to the tube's axis, that four keys reach it, and that
   their radii nest in the right order with real clearances. */
const CROSSCUT_U = 0.530;   // the ventricle body — the same station rows H and Q read

/* viz3d's camera table, COPIED rather than restated, so the player's cameras and this model's own
   assertions about them cannot drift apart (RENDER-STANDARD 3.y). Row Q uses it to assert that the
   camera beat 4 rotates to looks ALONG the cut face's normal, and that the anterior one does not. */
const VIEW_DIR = {
  anterior: [0, 0, 1], posterior: [0, 0, -1], lateral: [1, 0, 0], medial: [-1, 0, 0],
  superior: [0, 1, 0.001], inferior: [0, -1, 0.001],
};

/* ------------------------------------------------------------------- building */

function add(g, key, geo, opts) {
  if (!geo) return null;
  return K.addSolid(g, key, geo, Object.assign({
    color: LAYERS[key].color, name: LAYERS[key].name,
  }, opts || {}));
}

function idxOf(F, u) { return (u - F.u0) / (F.u1 - F.u0) * F.n; }
function uOf(F, i) { return F.u0 + (F.u1 - F.u0) * (i / F.n); }

/* one coat of one span. `which` picks the pair of radii; `scale` is 1 for the fused tube and
   1/sqrt(2) for a limb; `swell` is the confluence widening, which only the fused tube carries. */
function coatShell(F, t, a, b, which, scale, swell, ring, cut) {
  const outer = i => {
    const u = uOf(F, i), c = coats(u, t, scale);
    return c[which[0]] * (swell ? fusedScale(u, t) : 1);
  };
  const inner = i => {
    const u = uOf(F, i), c = coats(u, t, scale);
    return c[which[1]] * (swell ? fusedScale(u, t) : 1);
  };
  return K.sweptShell({
    frame: F.frame, i0: idxOf(F, a), i1: idxOf(F, b), ring: ring,
    outerR: outer, innerR: inner, window: cut,
  });
}

/* THE THREE COATS, OUTERMOST FIRST — and `cut` is the angular half-width of the window each one gets
   when a cutaway is asked for. THEY ARE NOT THE SAME. Opened by an identical wedge the three coats
   nest exactly and read as one striped surface; opened in decreasing steps they read as a dissection,
   each layer turned back to show the next, which is how every atlas draws this and how a student is
   expected to be able to redraw it. */
/* `ringFine` is the crosscut's own ring count, and it is a variant-local change rather than a
   corpus-wide one on purpose. At 32 and 22 sides these coats are smooth at the size the tube is
   normally drawn; the crosscut face fills 70% of beat 4's frame, where 22 sides read as a polygon. The
   plain build's ring counts are untouched, because they are part of what continuity() compares against
   cardiac-looping and nothing hands over from a truncated variant. */
const COAT_SPEC = [
  { key: null,          which: ['mOut', 'mIn'], ring: NRING,    ringFine: 72, outline: 0.032, cut: 1.18 },
  { key: 'jelly',       which: ['jOut', 'jIn'], ring: NRING_IN, ringFine: 60, outline: 0.012, cut: 0.94 },
  { key: 'endocardium', which: ['eOut', 'eIn'], ring: NRING_IN, ringFine: 60, outline: 0.014, cut: 0.70 },
];
const LUMEN_RING_FINE = 60;

/* ------------------------------------------------------------------------ the lumen

   A SOLID CAST OF THE BLOOD SPACE, strictly inside the endocardium's inner surface. Finding 6: the
   tube read as a solid pink core in every sectioned view because the endocardium's far inner wall is
   the same colour as its near outer wall, and the player forces `side: DoubleSide` on every part it
   builds, so no material the model attaches can change that. A cast in a different colour can.

   LUMEN_FILL LEAVES A REAL CLEARANCE rather than meeting the endocardium's inner surface. Nothing in
   this model shares a surface with anything else (test H scans for it), and RENDER-STANDARD §3.z asks
   a model that builds more than one solid to prove no pair interpenetrates — the lumen is INSIDE the
   endocardium by construction, which is contact that is construction rather than anatomy, so it is
   excluded by name in row N's partition and row N pins the clearance instead. */
const LUMEN_FILL = 0.92;
function lumenR(u, t, scale, swell) {
  const c = coats(u, t, scale);
  return Math.max(0.012, c.eIn * LUMEN_FILL) * (swell ? fusedScale(u, t) : 1);
}
function lumenSpan(g, F, t, a, b, scale, swell, ring) {
  const geo = K.sweptShell({
    frame: F.frame, i0: idxOf(F, a), i1: idxOf(F, b), ring: ring || NRING_IN,
    outerR: i => lumenR(uOf(F, i), t, scale, swell),
  });
  add(g, 'lumen', geo, { outline: 0.008 });
}
function lumenDome(g, F, t, u, sign, scale, swell) {
  add(g, 'lumen', K.domeCap({ frame: F.frame, i: idxOf(F, u), sign: sign,
      r: lumenR(u, t, scale, swell), ring: NRING_IN, rows: 6 }), { outline: 0.008 });
}

/* Every terminal end is DOMED. RENDER-STANDARD: sweptShell closes a span with an ANNULUS, which is
   right at an internal waist where the neighbour overlaps it and wrong at an end with nothing behind
   it — a wall ring with a lit inner surface is an open pipe, the one thing that must never show. This
   tube has more terminal ends than any other in the corpus: while it is unfused there are five (two
   limb tails, two limb heads, one fused tail) and three coats on each of them. */
function domeAt(g, F, t, u, sign, key, scale, swell, spec) {
  const i = idxOf(F, u);
  const c = coats(u, t, scale);
  const r = c[spec.which[0]] * (swell ? fusedScale(u, t) : 1);
  add(g, key, K.domeCap({ frame: F.frame, i: i, sign: sign, r: r, ring: spec.ring, rows: 7 }),
      { outline: spec.outline });
}

function buildTube(g, t, opts) {
  const sepT = opts.bifida ? BIFIDA_T : t;
  const uF = fusionFront(sepT);

  /* the limb offset has to come from the ARRESTED fold when bifida is on, while everything else keeps
     running — so halfSep is read at sepT and the calibre at t. One clamp, nothing else. */
  const sep = (u) => halfSep(u, sepT);

  const wantInner = !!(opts.endocardium || opts.jelly || opts.cutaway || opts.crosscut);
  /* the lumen comes with the cutaway whether or not it was asked for: opening the wall and showing
     nothing inside is the defect finding 6 reported, not a lighter version of the fix */
  const wantLumen = !!(opts.lumen || opts.cutaway || opts.crosscut);

  const cut = opts.cutaway ? { dir: new T.Vector3(0.40, 0.08, 1).normalize() } : null;
  /* where the fused tube STOPS. 1 normally; at the ventricle body for the crosscut, so the annular
     caps at that station are the rings the beat is about. */
  const uTop = opts.crosscut ? CROSSCUT_U : 1;

  /* ---- the fused midline tube, from the front to the arterial pole ---- */
  if (uF < uTop - 1e-6) {
    const n = Math.max(24, Math.round(NSEG * (uTop - uF)));
    const F = frameOverSep(uF, uTop, t, 0, n, sep);
    for (const s of SEGS) {
      let a = Math.max(uF, s.u0), b = Math.min(uTop, s.u1);
      if (b - a < 0.012) continue;
      /* OVERLAP at an internal waist so no annular cap is ever exposed; never past a terminal end,
         which is closed by a dome instead — nor past the crosscut face, which IS an exposed annulus
         on purpose. */
      if (s.u0 > uF) a = Math.max(uF, a - OVERLAP);
      if (s.u1 < uTop) b = Math.min(uTop, b + OVERLAP);
      for (const spec of COAT_SPEC) {
        if (spec.key && !wantInner) continue;
        const key = spec.key || s.key;
        const win = cut && s.key === 'ventricle'
          ? { i0: idxOf(F, 0.415), i1: idxOf(F, 0.645), dir: cut.dir, half: spec.cut } : null;
        add(g, key, coatShell(F, t, a, b, spec.which, 1, true,
                              opts.crosscut ? spec.ringFine : spec.ring, win),
            { outline: spec.outline });
      }
    }
    for (const spec of COAT_SPEC) {
      if (spec.key && !wantInner) continue;
      const cranialKey = spec.key || segAt(uTop);
      const caudalKey = spec.key || (uF <= 1e-6 ? 'sinus' : segAt(uF));
      /* NO CRANIAL DOME ON THE CROSSCUT. The annulus sweptShell just emitted at uTop is the ring the
         beat exists to show, and a dome over it would hide it — which is the one case where leaving a
         terminal annulus exposed is the point rather than the defect RENDER-STANDARD warns about. */
      if (!opts.crosscut) domeAt(g, F, t, uTop, +1, cranialKey, 1, true, spec);
      domeAt(g, F, t, uF, -1, caudalKey, 1, true, spec);
    }
    /* THE LUMEN IS ONE CAST OVER THE WHOLE FUSED RUN, not one per segment. It is a single continuous
       blood space — the segments are dilations of the same tube, not compartments — and casting it in
       pieces would put an internal annulus inside a solid where two pieces met. */
    if (wantLumen) {
      lumenSpan(g, F, t, uF, uTop, 1, true, opts.crosscut ? LUMEN_RING_FINE : NRING_IN);
      /* the lumen's own cast is a SOLID sweptShell, so its end is already closed by a centre fan —
         that fan is the disc in the middle of the crosscut figure, and a dome over it would hide it */
      if (!opts.crosscut) lumenDome(g, F, t, uTop, +1, 1, true);
      lumenDome(g, F, t, uF, -1, 1, true);
    }
  }

  /* ---- the two unfused limbs, from the venous end up to the front ---- */
  /* clamped to uTop too, so `crosscut` means the same thing at every t and not only where the tube has
     already fused — it is pinned at t = 1 by the scene, but a variant that quietly built the whole
     cranial half at some other t would be a trap for the next run. */
  const uLimb = Math.min(uF, uTop);
  if (uLimb > 1e-6) {
    for (const side of [-1, +1]) {
      const n = Math.max(24, Math.round(NSEG * uLimb));
      const F = frameOverSep(0, uLimb, t, side, n, sep);
      for (const s of SEGS) {
        let a = Math.max(0, s.u0), b = Math.min(uLimb, s.u1);
        if (b - a < 0.012) continue;
        if (s.u0 > 0) a = Math.max(0, a - OVERLAP);
        if (s.u1 < uLimb) b = Math.min(uLimb, b + OVERLAP);
        for (const spec of COAT_SPEC) {
          if (spec.key && !wantInner) continue;
          add(g, spec.key || s.key,
              coatShell(F, t, a, b, spec.which, LIMB_SCALE, false, spec.ring, null),
              { outline: spec.outline });
        }
      }
      for (const spec of COAT_SPEC) {
        if (spec.key && !wantInner) continue;
        domeAt(g, F, t, 0, -1, spec.key || 'sinus', LIMB_SCALE, false, spec);
        if (!(opts.crosscut && uLimb >= uTop - 1e-9)) {
          domeAt(g, F, t, uLimb, +1, spec.key || segAt(uLimb), LIMB_SCALE, false, spec);
        }
      }
      if (wantLumen) {
        lumenSpan(g, F, t, 0, uLimb, LIMB_SCALE, false);
        lumenDome(g, F, t, 0, -1, LIMB_SCALE, false);
        if (!(opts.crosscut && uLimb >= uTop - 1e-9)) lumenDome(g, F, t, uLimb, +1, LIMB_SCALE, false);
      }
    }
  }
  return uF;
}

/* a frame that takes its lateral offset from a supplied separation function, so cardia bifida can
   arrest the fold without a second copy of the builder */
function frameOverSep(u0, u1, t, side, n, sepFn) {
  const pts = [];
  for (let i = 0; i <= n; i++) {
    const u = u0 + (u1 - u0) * (i / n);
    pts.push(new T.Vector3(side ? side * sepFn(u) : 0, axisY(u, t), 0));
  }
  return { frame: K.parallelFrame(pts, new T.Vector3(1, 0, 0)), u0: u0, u1: u1, n: n };
}

function segAt(u) {
  for (const s of SEGS) if (u >= s.u0 && u <= s.u1) return s.key;
  return u < 0.5 ? 'sinus' : 'truncus';
}

function bez(p0, p1, p2, n) {
  const out = [];
  for (let i = 0; i <= n; i++) {
    const u = i / n, v = 1 - u;
    out.push(new T.Vector3(
      v * v * p0.x + 2 * v * u * p1.x + u * u * p2.x,
      v * v * p0.y + 2 * v * u * p1.y + u * u * p2.y,
      v * v * p0.z + 2 * v * u * p1.z + u * u * p2.z));
  }
  return out;
}
function bez3(p0, p1, p2, p3, n) {
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
}

/* ------------------------------------------------------------------- build */

function buildHeartTube(t, opts) {
  opts = opts || {};
  t = Math.max(0, Math.min(1, t));
  assertAcceptance();

  const g = new T.Group();
  const sepT = opts.bifida ? BIFIDA_T : t;
  const uF = fusionFront(sepT);
  const sep = u => halfSep(u, sepT);

  buildTube(g, t, opts);

  /* ---- venous pole: the three pairs of veins, on each tube that still has a caudal end ---- */
  {
    const yV = axisY(0, t);
    const ends = uF > 1e-6 ? [-1, +1] : [0];
    for (const e of ends) {
      const x0 = e === 0 ? 0 : e * sep(0);
      const root = new T.Vector3(x0, yV + 0.04, 0);
      for (const side of (e === 0 ? [-1, +1] : [e])) {
        // common cardinal vein, descending from above and behind
        add(g, 'veins', K.tubeAlong(bez(root,
          new T.Vector3(x0 + side * 0.85, yV + 0.30, -0.55),
          new T.Vector3(x0 + side * 0.95, yV + 0.80, -1.00), 14), u => 0.130 - 0.025 * u, { ring: 14 }),
          { outline: 0.018 });
        // vitelline vein, climbing from the yolk stalk
        add(g, 'veins', K.tubeAlong(bez(root,
          new T.Vector3(x0 + side * 0.44, yV - 0.62, 0.26),
          new T.Vector3(x0 + side * 0.50, yV - 1.05, 0.50), 14), u => 0.120 - 0.020 * u, { ring: 14 }),
          { outline: 0.018 });
        // umbilical vein, from the placenta, entering more laterally and ventrally
        add(g, 'veins', K.tubeAlong(bez(root,
          new T.Vector3(x0 + side * 0.80, yV - 0.48, 0.46),
          new T.Vector3(x0 + side * 1.05, yV - 0.98, 0.80), 14), u => 0.112 - 0.020 * u, { ring: 14 }),
          { outline: 0.018 });
      }
    }
  }

  /* ---- arterial pole: the aortic sac, the arches, the paired dorsal aortae ----

     THIS IS WHAT CLOSES THE HORSESHOE. At day 18 the two endocardial tubes are separate along their
     whole length, and what makes the picture a horseshoe rather than two parallel rods is that both
     run cranially into a common sac continuous with the paired dorsal aortae. So the sac is built at
     the midline at every t and each tube's cranial end is joined to it — two connectors while the
     tubes are apart, one once they have fused. */
  {
    const yA = axisY(1, t);
    const sac = new T.Vector3(0, yA + 0.30, 0);
    if (uF > 1e-6) {
      for (const side of [-1, +1]) {
        const head = new T.Vector3(side * sep(1), yA, 0);
        add(g, 'arches', K.tubeAlong(bez(head,
          new T.Vector3(side * sep(1) * 0.75, yA + 0.20, 0), sac, 12), () => 0.105, { ring: 14 }),
          { outline: 0.018 });
      }
    }
    const DA_X = 0.44, DA_Z = -1.30;
    for (const side of [-1, +1]) {
      for (let k = 0; k < 2; k++) {
        const yEnd = sac.y + 0.95 - k * 0.46;
        const end = new T.Vector3(side * DA_X, yEnd, DA_Z);
        add(g, 'arches', K.tubeAlong(bez3(sac,
          new T.Vector3(sac.x + side * (0.72 - k * 0.06), sac.y + (yEnd - sac.y) * 0.42, sac.z - 0.05),
          new T.Vector3(side * (0.94 - k * 0.06), yEnd + (yEnd - sac.y) * 0.16, DA_Z * 0.55),
          end, 20), () => 0.082, { ring: 12 }), { outline: 0.016 });
      }
      const da = [];
      for (let i = 0; i <= 12; i++) {
        const u = i / 12;
        da.push(new T.Vector3(side * DA_X * (1 - 0.26 * u * u), sac.y + 1.05 - u * 1.42, DA_Z + 0.10 * u));
      }
      add(g, 'arches', K.tubeAlong(da, u => 0.080 * (1 - 0.5 * u * u), { ring: 12 }), { outline: 0.016 });
    }
    {
      const sg = new T.SphereGeometry(1, 26, 18);
      sg.scale(0.34, 0.25, 0.31);
      sg.translate(sac.x, sac.y, sac.z);
      add(g, 'arches', sg, { outline: 0.022 });
    }
  }

  /* ---- the two landmarks whose ORDER the head fold reverses ---- */
  if (opts.landmarks !== false) {
    {
      // septum transversum: a thick transverse bar of mesoderm below the venous end
      const c = stCentre(t);
      const sg = new T.SphereGeometry(1, 30, 18);
      sg.scale(1.15, 0.23, 0.55);
      sg.translate(c.x, c.y, c.z);
      add(g, 'septum', sg, { outline: 0.026 });
    }
    {
      // buccopharyngeal membrane: a MEMBRANE, so it tapers to its rim rather than ending in a slab
      const c = bpmCentre(t);
      const sg = new T.SphereGeometry(1, 28, 16);
      sg.scale(0.60, 0.085, 0.48);
      sg.translate(c.x, c.y, c.z);
      add(g, 'membrane', sg, { outline: 0.020 });
    }
  }

  /* ---- the dorsal mesocardium ----

     A MEMBRANE TAPERS (RENDER-STANDARD §3): every free edge narrows to nothing where it meets the
     tube it suspends, including the two torn edges once the middle has given way. Drawn with a
     constant free edge it reads as a slab of card standing behind the subject. */
  if (opts.mesocardium) {
    const span = mesoSpan(t);
    if (span) {
      const half = mesoHalfGap(t);
      /* A PANEL CARRIES WHAT EACH OF ITS EDGES IS, not just where it is. `pole0`/`pole1` say whether
         that end is a continuation of the pericardial reflection (a pole) or a free edge — torn at the
         sinus, or the growing edge that sits on the fusion front. mesoEdge() then gives each edge its
         own profile. Getting this wrong in either direction is visible: taper a pole and the heart
         hangs from nothing at its ends; square off a torn edge and the transverse sinus becomes a
         rectangular hole in a wall. */
      const atVenousPole = span[0] <= MESO_U0_MIN + 1e-9;
      const panels = half > 0
        ? [{ u0: span[0], u1: MESO_MID - half, pole0: atVenousPole, pole1: false },
           { u0: MESO_MID + half, u1: span[1], pole0: false,        pole1: true }]
        : [{ u0: span[0], u1: span[1], pole0: atVenousPole, pole1: true }];
      for (const panel of panels) {
        const pu0 = panel.u0, pu1 = panel.u1;
        if (pu1 - pu0 < 0.02) continue;
        const E = K.emitter(), steps = 44;
        const A = new T.Vector3(), Bv = new T.Vector3(), C2 = new T.Vector3(), D2 = new T.Vector3();
        const n1 = new T.Vector3();
        /* dorsal is a WORLD direction, -z. The tube is straight here so the frame does not twist, but
           resolving it from the world rather than from a frame axis is the rule and costs nothing. */
        const DORSAL = new T.Vector3(0, 0, -1);
        /* THE ATTACHMENT SITS ON THE TUBE'S DRAWN DORSAL SURFACE — dorsalSurface(u, t), which is
           0.8505 of radius(u, t) and not radius(u, t) itself. The version of this comment that stood
           here until 2026-09-30 said the attachment was on that surface "at 0.92 of its radius", and
           that the 0.92 bought visibility because "the tube hides everything inside its own
           silhouette". Both halves were wrong in the same direction: 0.8505 of the radius IS the
           silhouette, so the whole sheet was always outside it and always drawn, and 0.92 put the
           attachment 0.069 of a radius clear of the tube — 0.019 to 0.030 units of air, measured at
           every station of the day-23 build, between a membrane and the tube it suspends. It is now
           0.97 of the drawn surface, which sinks it in, for the reason the segments carry OVERLAP. */
        const at = (u, reach, out) => out.set(0, axisY(u, t), -(dorsalSurface(u, t) * MESO_ON_TUBE + reach));
        /* each edge's run, solved ONCE at that edge's own station rather than per sample, so the
           profile is a function of two numbers a reviewer can read off the panel */
        const w0 = mesoRun(pu0, t, panel.pole0), w1 = mesoRun(pu1, t, panel.pole1);
        const back = (u, out) => {
          const taper = mesoEdge(u - pu0, w0, panel.pole0) * mesoEdge(pu1 - u, w1, panel.pole1);
          return at(u, mesoReach(u, t) * taper, out);
        };
        const front = (u, out) => at(u, 0, out);
        for (let i = 0; i < steps; i++) {
          const ua = pu0 + (pu1 - pu0) * (i / steps), ub = pu0 + (pu1 - pu0) * ((i + 1) / steps);
          front(ua, A); front(ub, Bv); back(ub, C2); back(ua, D2);
          n1.set(1, 0, 0);          // the sheet lies in the median plane: tangent +y crossed with -z
          E.triN(A, Bv, C2, n1);
          E.triN(A, C2, D2, n1);
        }
        add(g, 'mesocardium', E.geometry(), {
          noOutline: true,
          matOver: { transparent: true, opacity: 0.46, side: T.DoubleSide, depthWrite: false,
                     roughness: 0.95, clearcoat: 0 },
          renderOrder: 18,
        });
      }
    }
  }

  /* ---- the median plane reference ----

     A REFERENCE MUST SURVIVE THE VIEW THAT USES IT (RENDER-STANDARD, round 3). The plane itself is a
     translucent quad, which is what carries it in oblique and lateral views; from an ANTERIOR camera
     the median plane contains the view direction and a quad in it is seen exactly edge-on, so its
     VENTRAL EDGE is drawn as a solid rod standing clear in FRONT of the subject. Both are at x = 0.
     The forward reach is measured off this build, not assumed, because the tube's ventral extent
     changes with t and a reference tuned at one t is buried at another. */
  if (opts.midline) {
    /* MEASURED OFF THIS BUILD, AND NOT ONLY FOR THE FORWARD REACH. The first version took its dorsal
       edge from the mesocardium's reach (a constant 1.35) and its height from the day-23 tube, and at
       day 18 — where the tube is 3.3 long and the reference was 5.1 by 2.6 — the differencing probe
       measured the reference covering 112% of the subject's own lit pixels. A reference that outweighs
       the anatomy is the mirror of the round-3 defect it exists to avoid: legible is the floor, not
       the target. Both edges now come from the tube's own extent at this t. */
    const yLo = axisY(0, t) - 0.30, yHi = axisY(1, t) + 0.40;
    let rMax = 0;
    for (let i = 0; i <= NSEG; i++) rMax = Math.max(rMax, radius(i / NSEG, t));
    /* the dorsal edge clears whatever the mesocardium actually reaches at this t, which is now solved
       off the cavity rather than a constant — so it is read from the same function the sheet uses
       instead of from a number that agreed with it once. */
    let mReach = 0;
    if (opts.mesocardium) for (let i = 0; i <= 40; i++) mReach = Math.max(mReach, mesoReach(i / 40, t));
    let zF = rMax + 0.34, zB = -(rMax + (opts.mesocardium ? mReach + 0.30 : 0.42));
    {
      const E = K.emitter(), nx = new T.Vector3(1, 0, 0);
      const q1 = new T.Vector3(0, yLo, zB), q2 = new T.Vector3(0, yHi, zB),
            q3 = new T.Vector3(0, yHi, zF), q4 = new T.Vector3(0, yLo, zF);
      E.triN(q1, q2, q3, nx); E.triN(q1, q3, q4, nx);
      add(g, 'midline', E.geometry(), { noOutline: true,
        matOver: { transparent: true, opacity: 0.13, side: T.DoubleSide, depthWrite: false,
                   roughness: 0.95, clearcoat: 0 }, renderOrder: 17 });
    }
    {
      const rod = [];
      for (let i = 0; i <= 10; i++) rod.push(new T.Vector3(0, yLo + (yHi - yLo) * (i / 10), zF));
      add(g, 'midline', K.tubeAlong(rod, () => 0.048, { ring: 10 }), { noOutline: true,
        matOver: { transparent: true, opacity: 0.92, roughness: 0.9 } });
    }
    for (const f of [0.22, 0.5, 0.78]) {
      const yy = yLo + (yHi - yLo) * f;
      const tick = [];
      for (let i = 0; i <= 6; i++) tick.push(new T.Vector3(0, yy, zF - 0.62 * (i / 6)));
      add(g, 'midline', K.tubeAlong(tick, u => 0.034 * (1 - 0.55 * u), { ring: 8 }), { noOutline: true,
        matOver: { transparent: true, opacity: 0.70, roughness: 0.9 } });
    }
  }

  /* ---- the pericardial cavity ---- */
  if (opts.pericardium) {
    const cav = cavity(t);
    const geo = new T.SphereGeometry(1, 48, 32);
    geo.scale(cav.rXZ, cav.halfY, cav.rXZ);
    geo.translate(0, cav.cy, 0);
    const m = new T.Mesh(geo, new T.MeshBasicMaterial({
      color: C(LAYERS.pericardium.color), transparent: true, opacity: 0.10,
      side: T.BackSide, depthWrite: false,
    }));
    m.renderOrder = 20; m.userData.key = 'pericardium'; m.name = LAYERS.pericardium.name;
    g.add(m);
    const rim = new T.Mesh(geo.clone(), new T.MeshBasicMaterial({
      color: C(0xbfd8ff), transparent: true, opacity: 0.075,
      side: T.FrontSide, depthWrite: false, blending: T.AdditiveBlending,
    }));
    rim.renderOrder = 21; rim.userData.key = 'pericardium'; rim.name = LAYERS.pericardium.name;
    g.add(rim);
  }

  /* ---- THE HEAD FOLD, as one rigid rotation of the whole assembly about the hinge ----

     Everything above is built in the DEFINITIVE frame — day 23, the arrangement cardiac-looping
     inherits. The head fold is then the single transform that turns that arrangement back into the
     day-18 one, which is why the order of septum transversum, heart and buccopharyngeal membrane
     inverts as a CONSEQUENCE of one movement rather than by moving three things separately. */
  const th = theta(t);
  if (Math.abs(th) > 1e-9) {
    g.rotation.x = th;
    g.position.set(0, HINGE_Y - HINGE_Y * Math.cos(th), -HINGE_Y * Math.sin(th));
    g.updateMatrixWorld(true);
  }

  return g;
}

/* ------------------------------------------------- proving the handover, not claiming it

   THE ONE CHECK NEITHER MODEL CAN DO ALONE. This model's whole reason for existing in 3D is that it
   hands a tube to cardiac-looping; a comment saying the constants match is a claim, and RENDER-
   STANDARD is explicit that a note in a file is a claim including one's own. So: build BOTH models —
   this one at t = 1, cardiac-looping at t = 0 — and compare the real vertices of the five shared
   segment keys, box by box. Returns null when cardiac-looping is not loaded, which is not a failure,
   and says so rather than warning: a warning that is a known false alarm trains a reader to ignore
   the channel it prints on. */
function continuity() {
  const other = window.MB3D_MODELS && window.MB3D_MODELS['cardiac-looping'];
  if (!other || typeof other.build !== 'function') {
    return { measurable: false, note: 'cardiac-looping is not loaded in this page — nothing to compare against' };
  }
  const boxesOf = (grp) => {
    grp.updateMatrixWorld(true);
    const out = {};
    const v = new T.Vector3();
    grp.traverse(o => {
      if (!o.isMesh || !o.geometry || (o.userData && o.userData.outline)) return;
      const k = o.userData && o.userData.key;
      /* the two extra keys are here for the divergence report below; `pass` still reads only SEGS_U */
      if (!k || (!SEGS_U[k] && k !== 'endocardium' && k !== 'mesocardium')) return;
      const p = o.geometry.attributes.position; if (!p) return;
      const b = out[k] || (out[k] = { minx: 1e9, maxx: -1e9, miny: 1e9, maxy: -1e9, minz: 1e9, maxz: -1e9 });
      for (let i = 0; i < p.count; i++) {
        v.fromBufferAttribute(p, i).applyMatrix4(o.matrixWorld);
        if (v.x < b.minx) b.minx = v.x; if (v.x > b.maxx) b.maxx = v.x;
        if (v.y < b.miny) b.miny = v.y; if (v.y > b.maxy) b.maxy = v.y;
        if (v.z < b.minz) b.minz = v.z; if (v.z > b.maxz) b.maxz = v.z;
      }
    });
    return out;
  };
  /* BOTH MODELS BUILT WITH THEIR OWN FULL SET. The first version passed {} to each, so neither built
     its endocardium or its mesocardium — the two keys the divergence report is about — and the report
     would have said "one of the two models does not build this key" about keys both of them build. */
  const fullOf = (mod) => {
    const o = {}; const b = (mod && mod.FULL) || {};
    for (const k in b) if (Object.prototype.hasOwnProperty.call(b, k)) o[k] = b[k];
    return o;
  };
  const mine = boxesOf(buildHeartTube(1, fullOf(window.MB3D_MODELS['heart-tube-formation'])));
  const theirs = boxesOf(other.build(0, fullOf(other)));
  const per = {}; let worst = 0;
  for (const k in SEGS_U) {
    if (!mine[k] || !theirs[k]) { per[k] = { missing: true }; worst = Infinity; continue; }
    let d = 0;
    for (const f of ['minx', 'maxx', 'miny', 'maxy', 'minz', 'maxz'])
      d = Math.max(d, Math.abs(mine[k][f] - theirs[k][f]));
    per[k] = { worst: d, mine: mine[k], theirs: theirs[k] };
    worst = Math.max(worst, d);
  }

  /* --------------------------------------------------------------- WHAT THIS CHECK COULD NOT SEE

     Added 2026-09-30, and it is the more useful half now. The loop above compares the BOUNDING BOXES
     of the five segment keys, which are dominated by the myocardium's OUTER radius — so it passed at
     0.0100 against a 0.02 tolerance while the two models disagreed about the myocardial wall
     thickness, the jelly, and how far the dorsal mesocardium reaches. Two of the three rulings on
     this item land on exactly those surfaces. A check that cannot see the thing being ruled on is
     not evidence about it, and saying "two scenes, one tube" on the strength of it would be the
     claim-in-a-file failure RENDER-STANDARD §6 is about.

     SO THE DIVERGENCES ARE MEASURED AND REPORTED, NOT ASSERTED. cardiac-looping is `escalated`; the
     queue's note on it says in terms that neither task touches it — "Apply when and if this item is
     reopened" — so this model moved alone and the numbers below are what the reopening has to close.
     They are deliberately NOT folded into `pass`: a divergence Frank has ruled on is not a failure of
     this model, and turning it red here would only teach the next run to ignore the field. */
  const radial = (b) => ({ lo: Math.min(Math.abs(b.minx), Math.abs(b.maxx)),
                           hi: Math.max(Math.abs(b.minx), Math.abs(b.maxx)) });
  const extra = {};
  for (const k of ['endocardium', 'mesocardium']) {
    if (!mine[k] || !theirs[k]) { extra[k] = { note: 'one of the two models does not build this key' }; continue; }
    extra[k] = {
      mine_y: [mine[k].miny, mine[k].maxy], theirs_y: [theirs[k].miny, theirs[k].maxy],
      worst_y: Math.max(Math.abs(mine[k].miny - theirs[k].miny), Math.abs(mine[k].maxy - theirs[k].maxy)),
      mine_halfwidth_x: radial(mine[k]).hi, theirs_halfwidth_x: radial(theirs[k]).hi,
    };
  }
  const declared = [
    'MYOCARDIAL WALL: this model spends cardiac-looping\'s 0.180 as 0.074 wall + 0.106 jelly, that ' +
    'model still as 0.095 + 0.085. Review finding 7, 2026-09-21: the jelly was drawn thinner than ' +
    'the myocardium while every line of narration calls it a thick layer. The ENDOCARDIAL surface — ' +
    'the one the handover is about and the one a student sees — is r - 0.180 in both, unchanged.',
    'DORSAL MESOCARDIUM: Frank\'s ruling of 2026-09-29 extends it to BOTH poles with the transverse ' +
    'sinus as the opening between the remnants, in this scene AND in cardiac-looping. Only this one ' +
    'could be edited. cardiac-looping still spans u 0.30..0.84; this model now spans 0.00..1.00. The ' +
    'measured y-extents above are the size of that difference.',
  ];
  return { measurable: true, worst: worst, per: per, tolerance: 0.02, pass: worst <= 0.02,
           segment_keys_only: true,
           not_covered_by_pass: extra, declared_divergences: declared };
}

/* -------------------------------------------- what a BEAT may claim, and where it is evaluated

   RENDER-STANDARD, 2026-09-29: "every view of a time-varying scene carries its narrated claims as
   machine-checkable claims[], evaluated against the model at THAT VIEW'S OWN SET_STAGE t". The scene
   had none, and this model is a process with nine beats, so it needs the vocabulary.

   at(t) EXISTS BECAUSE THE TOOL REQUIRES IT. check-beat-claims.mjs guards on `!M.at` BEFORE it looks
   for claimMeasure, so a model with a vocabulary and no at() exits 2 without reading a claim. It is a
   plain state record, and it is the same numbers claimMeasure serves — one place, two callers.

   NOTHING HERE BUILDS GEOMETRY, and that is a constraint rather than a preference: the tool evaluates
   a model in a sandbox whose THREE is a stub Vector3 and whose VizKit is {}. Every measure below is
   arithmetic over the functions the geometry is built FROM, so the claims check the SCENE against the
   MODEL — which is what the rule is for. The rows that must check the model against its own VERTICES
   are the acceptance battery's job and live in probe(). */
function at(t) {
  const span = mesoSpan(t);
  return {
    t: t,
    day: day(t),
    front: fusionFront(t),
    fused_fraction: 1 - fusionFront(t),
    phi_deg: phi(t) * 180 / Math.PI,
    theta_deg: theta(t) * 180 / Math.PI,
    length: len(t),
    meso: { halfGap: mesoHalfGap(t), u0: span ? span[0] : null, u1: span ? span[1] : null },
    coats: { wall: wallAt(t), jelly: jellyAt(t), endo: endoAt(t) },
    clearance: clearanceFraction(t),
    dates: fusionDates(),
  };
}

/* the two cranio-caudal orders, in the folded frame, as a fraction of the mean extent compared */
function orderRatio(which, t) {
  const heartY = foldPoint(new T.Vector3(0, tubeCentroidY(t), 0), t).y;
  const hEx = tubeExtentY(t);
  if (which === 'st') return (foldPoint(stCentre(t), t).y - heartY) / (0.5 * (hEx + 0.46));
  return (heartY - foldPoint(bpmCentre(t), t).y) / (0.5 * (hEx + 0.30));
}

function claimMeasure(name, t) {
  const a = at(t);
  const path = name.split('.');
  switch (path[0]) {
    case 'day':            return a.day;
    /* 1 while the two tubes are wholly separate, 0 once they are one tube */
    case 'front':          return a.front;
    case 'fused_fraction': return a.fused_fraction;
    /* the two foldings, in degrees, because that is how the narration quotes them */
    case 'fold':           return path[1] === 'phi_deg' ? a.phi_deg : a.theta_deg;
    case 'length':         return a.length;
    case 'meso':
      if (path[1] === 'half_gap') return a.meso.halfGap;
      if (path[1] === 'u0') return a.meso.u0;
      if (path[1] === 'u1') return a.meso.u1;
      /* the sheet's span as a fraction of the tube's, from the constants the sheet is drawn over —
         the VERTEX version of this is acceptance row M */
      if (path[1] === 'span_fraction') return a.meso.u1 == null ? 0 : a.meso.u1 - a.meso.u0;
      break;
    /* THE CROSSCUT FACE, for beat 4. Arithmetic only, because check-beat-claims evaluates a model in a
       sandbox with a stub Vector3 and no kit — the VERTEX assertions about this face are acceptance row
       Q's job. `face_y` moves with t (the tube lengthens), which is what pins the beat to its instant;
       `face_dot.<view>` is the camera assertion RENDER-STANDARD 3.y asks the beat itself to carry, and
       it reads viz3d's own VIEW_DIR table rather than restating a direction. */
    case 'xs':
      if (path[1] === 'face_y') return axisY(CROSSCUT_U, t);
      if (path[1] === 'face_dot') {
        const d = VIEW_DIR[path[2]];
        if (!d) throw new Error('heart-tube-formation: no such viz3d view "' + path[2] + '"');
        /* the face is normal to the tube's axis, which is +y in the model's own frame */
        return Math.abs(d[1] / Math.sqrt(d[0] * d[0] + d[1] * d[1] + d[2] * d[2]));
      }
      break;
    case 'coat':
      if (path[1] === 'jelly_over_wall') return a.coats.jelly / a.coats.wall;
      if (path[1] === 'wall') return a.coats.wall;
      if (path[1] === 'jelly') return a.coats.jelly;
      break;
    /* the order along the cranio-caudal axis — POSITIVE means the first named is the more cranial,
       and the value is a SEPARATION AS A FRACTION of the mean extent of the two things compared, so
       a beat asserts a visible order rather than a sign (RENDER-STANDARD: "a sign test on a spatial
       relation is not a test"). THE HEAD FOLD IS APPLIED. Everything this model builds lives in the
       definitive frame and is turned into place by one rotation, so the definitive-frame y of the
       septum transversum is caudal to the heart at EVERY t and reading it raw would make beat 2's
       "the order is turned over" false at both ends. These are the same two expressions measure()
       uses for acceptance rows E and F, written once here and called from there. */
    case 'order': {
      if (path[1] === 'septum_minus_heart') return orderRatio('st', t);
      if (path[1] === 'heart_minus_bpm') return orderRatio('bpm', t);
      break;
    }
    /* how far apart the two unfused tubes are at the venous end, as a share of one tube's diameter */
    case 'pair_gap':       return (2 * halfSep(0, t) - 2 * limbRadius(0, t)) / (2 * limbRadius(0, t));
    /* the bifida variant, whose geometry is an ARREST of this mechanism rather than a second drawing.
       Its two numbers do not move with t by construction — the fold angle is clamped — so a beat that
       shows it is pinned to its instant by the claims that DO move (the stage it sets for the
       structures it does not pin), and these two say what the variant is. */
    case 'bifida':
      if (path[1] === 'front') return BIFIDA_FRONT;
      if (path[1] === 'gap') return (2 * halfSep(0.5, BIFIDA_T) - 2 * limbRadius(0.5, t)) /
                                    (2 * limbRadius(0.5, t));
      break;
    case 'clearance':      return a.clearance;
    case 'radius':         return radius(path[1] === 'ventricle' ? 0.530 : Number(path[1]), t);
    case 'segment_order': {
      /* the five segments' axial centres, cranial-positive, so a beat can assert the order it names
         WITHOUT the head fold: read in the model's own frame, where +y is always cranial. */
      const ks = Object.keys(SEGS_U);
      const y = k => axisY((SEGS_U[k][0] + SEGS_U[k][1]) / 2, t);
      if (path[1] === 'truncus_minus_sinus') return y('truncus') - y('sinus');
      const mm = path[1] && path[1].match(/^(\w+)_minus_(\w+)$/);
      if (mm && SEGS_U[mm[1]] && SEGS_U[mm[2]]) return y(mm[1]) - y(mm[2]);
      if (path[1] === 'count') return ks.length;
      break;
    }
  }
  throw new Error('heart-tube-formation: unknown claim measure "' + name + '"');
}

/* --------------------------------------------------------- the provider contract */

window.MB3D_MODELS = window.MB3D_MODELS || {};
window.MB3D_MODELS['heart-tube-formation'] = {
  LAYERS: LAYERS,
  build: buildHeartTube,
  /* Every optional layer on. Without this the provider builds only the default layers and any
     structure behind a flag comes back reason:'none' — which the player shows a student as "there is
     no model of this structure", a confident lie about a model sitting right there. */
  FULL: { endocardium: true, jelly: true, lumen: true, mesocardium: true, pericardium: true,
          midline: true, landmarks: true },
  VARIANTS: {
    cutaway: 'the ventricle opened along its length, so the three coats and the lumen are visible',
    crosscut: 'the tube stopped at the ventricle body, so its annular caps ARE a transverse section — ' +
              'three concentric rings and the lumen disc, from a superior camera',
    bifida: 'cardia bifida — the lateral folds arrested, so the two tubes never meet',
  },
  ACCEPTANCE: ACCEPTANCE,
  FLOORS: FLOORS,
  acceptance: acceptance,
  negatives: negatives,
  continuity: continuity,
  at: at,
  claimMeasure: claimMeasure,
  fusionFront: fusionFront,
  fusionDates: fusionDates,
  day: day,
};

})();
