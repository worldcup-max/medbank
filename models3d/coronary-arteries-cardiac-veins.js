/* MedBank · coronary arteries & cardiac veins — PRODUCTION procedural model.
 *
 * Registers itself as MB3D_MODELS['coronary-arteries-cardiac-veins'], which is the whole contract the
 * procedural provider in viz3d.js depends on: a LAYERS palette, FULL, and build(t, opts) -> THREE.Group
 * whose meshes carry userData.key.
 *
 * WRAPPED IN AN IIFE. Only the registration escapes. RENDER-STANDARD: a model written at top level puts
 * T, K, LAYERS and every constant into global lexical scope, and the second model to load dies on
 * "Identifier 'T' has already been declared" and takes the page with it.
 *
 * ------------------------------------------------------------------------------------------------
 * WHY PROCEDURAL, when the catalog looks rich. CHECKED, NOT TRUSTED.
 *
 * The queue item says `candidate_meshes: 12`. That is very nearly right as a NAME match and very
 * wrong as an availability figure, and the difference is the whole decision:
 *
 *   name-matches in available-meshes.json (12, after discarding 2 supramarginal GYRI and the
 *   interventricular FORAMEN, which match on the word and not on the thing):
 *     FMA4685 stem of left coronary artery                    · STL PRESENT
 *     FMA3895 circumflex branch of left coronary artery        · STL PRESENT
 *     FMA3802 trunk of right coronary artery                   · STL PRESENT
 *     FMA3818 marginal branch of right coronary artery         · STL PRESENT
 *     FMA4706 coronary sinus                                   · STL PRESENT
 *     FMA4707 great cardiac vein                               · STL PRESENT
 *     FMA4713 middle cardiac vein                              · NO FILE
 *     FMA76994 right posterolateral branch of RCA              · NO FILE
 *     FMA71567 set of anterior cardiac veins                   · NO FILE
 *     FMA76751 set of posterior veins of left ventricle        · NO FILE
 *     FMA71669 set of IV septal branches of RCA                · NO FILE
 *     FMA71670 set of IV septal branches of LCA                · NO FILE
 *
 * Six of the twelve have never been ingested — `viz-training/meshes/` holds no such file, at any
 * tier. So the honest count is SIX, not twelve.
 *
 * And the catalog has no entry AT ALL, at any granularity, for:
 *     · the ANTERIOR INTERVENTRICULAR BRANCH (the LAD)
 *     · the POSTERIOR INTERVENTRICULAR BRANCH (the PDA)
 *     · the small cardiac vein, the oblique vein of the left atrium
 *     · the SA nodal and AV nodal branches
 *     · the left (obtuse) marginal and the diagonal branches
 *
 * The LAD is the single most examined artery in the body. A scene on coronary supply built from the
 * six meshes that exist would show a left main that stops dead where its principal branch should
 * begin, and a right coronary that ends in mid-air at the crux with no posterior descending. That is
 * not a reduced scene; it is a scene that teaches the wrong anatomy. RENDER-STANDARD §5: no mesh
 * means BUILD it — and §5's test, "would a student be marked wrong for the difference between our
 * version and the real one?", answers cleanly here. What is examined about a coronary artery is which
 * GROOVE it lies in, what it branches into, where it ends and what it supplies. Not its idiosyncratic
 * curvature. Every one of those is a relation, and a relation is exactly what procedural geometry can
 * carry and a disembodied scan mesh cannot.
 *
 * There is a second, decisive reason. These vessels are defined BY the sulci they lie in. A scan mesh
 * of the RCA comes from a different specimen than any heart form we could put it on, so "the right
 * coronary artery lies in the right atrioventricular groove" would be true only by luck, and would be
 * checked by nothing. Built on the same surface function that CUTS the groove, it is true by
 * construction and is asserted in acceptance(). The mesh route cannot make that claim at all.
 *
 * The honest limit, recorded rather than hidden: the exact branching pattern of a coronary tree is
 * more variable between people than almost anything else in gross anatomy. This model shows the
 * COMMON pattern and the one variation that is actually examined — dominance, as a flag, below.
 *
 * ------------------------------------------------------------------------------------------------
 * THE SHARED HEART FORM, AND A DUPLICATION DECLARED RATHER THAN HIDDEN.
 *
 * The surface machinery in section 2 below — prof / bulge / pinch / radOf / basePoint / baseNormal /
 * surfPoint, the frame, the two solves, and the theta-to-world-direction anchor table — is the same
 * form `models3d/heart-external.js` builds, and is copied from it. That is a real duplication and it
 * is stated here because a reviewer must be able to see it rather than discover it.
 *
 * Why it was copied rather than shared: the procedural provider maps a model id to a FILE and loads
 * exactly one file per id (viz3d.js: "a model registered inside another file can never be found").
 * There is no module mechanism for a third shared file, and a build() that reached for another
 * model's registration would depend on a load order the adapter does not guarantee — it would work
 * in testing and diverge silently in the field, which is the failure shape RENDER-STANDARD §6 is
 * about. Promoting the (zeta, theta) surface into render-kit.js is the right fix and is an ENGINE
 * item, not a scene item; heart-external.js proposed the same promotion for the same reason.
 *
 * What stops the two copies drifting is not discipline, it is that both SOLVE against the same
 * STATED landmarks (12.0 cm long axis, 8.5 cm greatest transverse, 2.0 cm right-of-median reach, apex
 * in the left 5th space 8.7 cm out) rather than carrying tuned constants. acceptance() re-measures
 * all four here. If someone changes a landmark in one file, this file's acceptance fails rather than
 * quietly rendering a different heart.
 *
 * ------------------------------------------------------------------------------------------------
 * WHAT t MEANS: NOTHING, AND IT IS DECLARED.
 *
 * The adult coronary tree is not a process, a series or a stage, so build(t) ignores t and returns
 * the same geometry at every t, exactly as heart-external.js does. This is the SECOND t-invariant
 * model in the corpus and a reviewer should decide the policy rather than inherit it: RENDER-STANDARD
 * §5 says procedural belongs where the form is a function of something. It is here because the
 * standing policy (no mesh means build it) and the absence of a mesh for the LAD leave no other way
 * to teach coronary supply at all. Logged in BUILD-LOG.md as a question for review.
 *
 * THE VARIATION THAT IS EXAMINED IS A FLAG, NOT A t. DOMINANCE — which artery reaches the crux and
 * gives the posterior interventricular branch — is the one coronary variation a student is marked on,
 * and it is a discrete alternative, not a point on a continuum. It is the adapter's `+left_dominant`
 * flag, and it is GEOMETRY rather than a label: in the default build the right coronary's course runs
 * all the way round to the crux and the circumflex stops short of it; with the flag the two swap, and
 * the posterior interventricular branch springs from whichever one arrives. acceptance() asserts the
 * relation on BOTH builds and requires it to REVERSE — the negative case for that test is the other
 * build, which is the only kind of negative case that cannot be satisfied by an accident.
 *
 * ------------------------------------------------------------------------------------------------
 * AXES, DECLARED AND PROVED. +x = patient's LEFT, +y = SUPERIOR, +z = ANTERIOR — the frame
 * heart-external.js and cardiac-looping.js use and the frame viz3d.js's VIEW_DIR assumes. Declared
 * machine-readably in AXES below and asserted in acceptance() against NAMED right and left vessels
 * with a magnitude floor, not against a comment. RENDER-STANDARD: "the cardiac-looping model's
 * comment had the sign backwards and nothing noticed, because a comment is not checked by anything."
 *
 * UNITS: centimetres, origin at the median plane at the level of the sternal angle.
 *
 * ------------------------------------------------------------------------------------------------
 * EVERY VESSEL IS PLACED BY A LANDMARK, NEVER BY AN ANGLE.
 *   · a vessel in a groove is placed by the SAME function that cuts the groove (thAIV, thPIV, Z_CS)
 *   · a vessel on a free wall is placed by the world direction that wall FACES, measured off the
 *     surface by thetaFacing() — the acute margin is where the form faces inferiorly, not theta 190
 *   · a vessel's DEPTH is a fraction of its own radius, so it sits nestled in its groove at any calibre
 * so nothing here drifts when the solve moves the form.
 *
 * SILHOUETTES, WINDING, COLOUR AND FRAMING ALL COME FROM render-kit.js. RENDER-STANDARD §6.
 */
(function () {

const T = window.THREE;
const K = window.VizKit;   // render-kit.js must load first — it owns winding, colour and silhouettes
const D2R = Math.PI / 180;

/* DECLARE THE AXES — RENDER-STANDARD, and asserted in acceptance() against named right and left
   vessels rather than believed from this line. A comment is not checked by anything. */
const AXES = { right: '-x', left: '+x', cranial: '+y', ventral: '+z', units: 'cm' };

/* ============================================================ 1 · the palette

   Arteries red, veins blue — the one convention every student already has. The cardiac veins carry
   deoxygenated blood and are drawn blue for that reason and not as a diagram convention, which is
   worth saying because the coronary SINUS is drawn largest of all: it is a centimetre across, wider
   than any coronary artery, and a student who has only seen a diagram is routinely surprised by it. */

const LAYERS = {
  /* the form the vessels lie on */
  heart:                  { color: 0x9c6a68, name: 'Myocardium (external form)' },
  coronary_sulcus:        { color: 0xe0c060, name: 'Coronary (atrioventricular) sulcus' },
  ant_iv_sulcus:          { color: 0xe8a13c, name: 'Anterior interventricular sulcus' },
  post_iv_sulcus:         { color: 0xd98a2a, name: 'Posterior interventricular sulcus' },
  crux:                   { color: 0xffd24a, name: 'Crux of the heart' },

  /* context, all of it load-bearing for a relation this scene teaches */
  asc_aorta:              { color: 0xb02a2a, name: 'Ascending aorta' },
  pulm_trunk:             { color: 0x2f5fa8, name: 'Pulmonary trunk' },
  ra_auricle:             { color: 0x2a6299, name: 'Right auricle' },
  la_auricle:             { color: 0x9e2b33, name: 'Left auricle' },
  svc:                    { color: 0x1f4272, name: 'Superior vena cava' },
  ivc:                    { color: 0x1a3a66, name: 'Inferior vena cava' },

  /* arteries */
  lca_stem:               { color: 0xd23b2f, name: 'Left coronary artery (stem)' },
  lad:                    { color: 0xe4482c, name: 'Anterior interventricular branch (LAD)' },
  diagonal:               { color: 0xef6a3e, name: 'Diagonal branches' },
  septal_branches:        { color: 0xf28a5a, name: 'Interventricular septal branches' },
  circumflex:             { color: 0xc0392b, name: 'Circumflex branch' },
  left_marginal:          { color: 0xd9553e, name: 'Left (obtuse) marginal branch' },
  rca:                    { color: 0xa8201a, name: 'Right coronary artery' },
  right_marginal:         { color: 0xc4402c, name: 'Right (acute) marginal branch' },
  pda:                    { color: 0xb52f22, name: 'Posterior interventricular branch (PDA)' },
  posterolateral:         { color: 0xcf5340, name: 'Right posterolateral branch' },
  sa_nodal:               { color: 0xe8734c, name: 'Sinuatrial nodal branch' },
  av_nodal:               { color: 0xe8734c, name: 'Atrioventricular nodal branch' },

  /* veins */
  coronary_sinus:         { color: 0x2b4c86, name: 'Coronary sinus' },
  great_cardiac_vein:     { color: 0x3a63a8, name: 'Great cardiac vein' },
  middle_cardiac_vein:    { color: 0x3557a0, name: 'Middle cardiac vein' },
  small_cardiac_vein:     { color: 0x4a76bd, name: 'Small cardiac vein' },
  post_veins_lv:          { color: 0x4169b0, name: 'Posterior veins of the left ventricle' },
  oblique_vein_la:        { color: 0x53508f, name: 'Oblique vein of the left atrium' },
  anterior_cardiac_veins: { color: 0x6a8fd0, name: 'Anterior cardiac veins' },

  /* the conducting nodes the two nodal branches exist to supply */
  sa_node:                { color: 0xf0d24a, name: 'Sinuatrial node' },
  av_node:                { color: 0xe8bb32, name: 'Atrioventricular node' },

  /* Myocardial territories — the answer to "supply of the myocardium".

     THREE DISTINCT HUES, NOT THREE REDS, and this was a defect before it was a decision. The first
     build gave each territory its own artery's colour, which is the obvious choice and is useless:
     rendered, the three territories were three shades of the same red and could not be told from one
     another, and the anterior interventricular branch DISAPPEARED against the territory named after
     it. A figure whose whole job is "which artery supplies which muscle" cannot be built out of
     colours a reader has to compare side by side to separate.

     So the territories are amber, violet and green — far apart in hue, and far from both the arterial
     reds and the venous blues, so a vessel always reads against the wash it lies on. They are also
     translucent, so the grooves that FORM their boundaries stay visible underneath instead of being
     painted over by the thing they define. The artery-to-territory link is carried by the label and
     by the scene's COMPARE_STRUCTURES beat, which is where it survives being looked at. */
  terr_lad:               { color: 0xe8963a, name: 'Territory of the anterior interventricular branch' },
  terr_cx:                { color: 0x9c5fb5, name: 'Territory of the circumflex branch' },
  terr_rca:               { color: 0x4f9e5f, name: 'Territory of the right coronary artery' },
};

/* ============================ 2 · the heart form — COPIED from heart-external.js, see the header.
   Everything from here to the end of section 2 is that file's surface machinery, unchanged. It is
   duplicated, not shared, because the provider loads one file per model id; the two copies are held
   together by solving against the same STATED landmarks rather than by anyone remembering. */

const Y_BASE   = -2.2;   // 3rd costal cartilage, below the sternal angle
const Y_APEX   = -7.3;   // left 5th intercostal space
const X_APEX   =  8.7;   // left midclavicular line
const Z_APEX   =  9.5;   // the apex lies just deep to the anterior chest wall
const LONG     = 12.0;   // base to apex
const SPEC_W   =  8.5;   // greatest transverse diameter, perpendicular to the long axis
const SPEC_AP  =  6.0;   // antero-posterior thickness
const RIGHT_REACH = 2.0; // the heart reaches this far right of the median plane
const AP = SPEC_AP / SPEC_W;

const Z_CS = 0.30;       // where the coronary sulcus crosses the long axis

function prof(z) {
  if (z <= 0 || z >= 1) return 0;
  if (z < Z_CS) { const s = z / Z_CS; return Math.sqrt(Math.max(0, 2 * s - s * s)); }
  const s = (z - Z_CS) / (1 - Z_CS);
  return Math.pow(Math.max(0, 1 - Math.pow(s, 3.2)), 0.95);
}

/* theta: 0 = patient's LEFT, 90 = ANTERIOR, 180 = RIGHT, 270 = POSTERIOR, in the plane
   perpendicular to the long axis. NOTE these are the RAW angles; the direction the surface actually
   FACES at a given theta is measured by thetaFacing() below and is not the same number. */
const TH_RV = 135 * D2R, TH_LA = 270 * D2R, TH_RA = 165 * D2R;

function smoothstep(a, b, x) { const u = Math.max(0, Math.min(1, (x - a) / (b - a))); return u * u * (3 - 2 * u); }
function lobe(th, c, amp, sharp) { const d = Math.cos(th - c); return d > 0 ? amp * Math.pow(d, sharp) : 0; }
function angGauss(th, c, w) {
  let d = ((th - c) % (Math.PI * 2) + Math.PI * 3) % (Math.PI * 2) - Math.PI;
  return Math.exp(-(d / w) * (d / w));
}
function bulge(z, th) {
  const ven = smoothstep(Z_CS - 0.02, Z_CS + 0.16, z);
  const atr = 1 - smoothstep(Z_CS - 0.16, Z_CS + 0.02, z);
  return 1 + ven * lobe(th, TH_RV, 0.11, 1.4)
           + atr * (lobe(th, TH_LA, 0.11, 1.5) + lobe(th, TH_RA, 0.075, 2.0));
}

const TH_AIV0 = 68 * D2R,  TH_AIV1 = 108 * D2R;
const TH_PIV0 = 250 * D2R, TH_PIV1 = 266 * D2R;
const CS_DEPTH = 0.085, CS_W = 0.026;
const IV_DEPTH = 0.050, IV_HALF = 8 * D2R;

function ivFrac(z) { return smoothstep(Z_CS - 0.01, Z_CS + 0.06, z) * (1 - smoothstep(0.93, 0.995, z)); }
function thAIV(z) { const u = Math.max(0, Math.min(1, (z - Z_CS) / (0.95 - Z_CS))); return TH_AIV0 + (TH_AIV1 - TH_AIV0) * u; }
function thPIV(z) { const u = Math.max(0, Math.min(1, (z - Z_CS) / (0.95 - Z_CS))); return TH_PIV0 + (TH_PIV1 - TH_PIV0) * u; }

function pinch(z, th) {
  const antGap = 1 - 0.88 * angGauss(th, 89 * D2R, 15 * D2R);
  let f = 1 - CS_DEPTH * antGap * Math.exp(-Math.pow((z - Z_CS) / CS_W, 2));
  const iv = ivFrac(z);
  if (iv > 0) {
    f *= 1 - IV_DEPTH * iv * angGauss(th, thAIV(z), IV_HALF);
    f *= 1 - IV_DEPTH * iv * angGauss(th, thPIV(z), IV_HALF);
  }
  return f;
}

let W = SPEC_W / 2, X_BASE = -1.6, Z_BASE = 6.0;
let B = new T.Vector3(), A = new T.Vector3();
let eL = new T.Vector3(), eAnt = new T.Vector3(), eLft = new T.Vector3();

function setFrame(xBase) {
  const dx = X_APEX - xBase, dy = Y_APEX - Y_BASE;
  const rad2 = LONG * LONG - dx * dx - dy * dy;
  if (!(rad2 > 0)) {
    throw new Error('[coronary] the stated landmarks are inconsistent: an apex ' + dx.toFixed(2) +
      ' cm left and ' + (-dy).toFixed(2) + ' cm below a base ' + (-xBase).toFixed(2) +
      ' cm right of the median plane cannot be ' + LONG + ' cm from it. Fix the landmarks, not the length.');
  }
  X_BASE = xBase;
  Z_BASE = Z_APEX - Math.sqrt(rad2);
  B.set(X_BASE, Y_BASE, Z_BASE);
  A.set(X_APEX, Y_APEX, Z_APEX);
  eL.subVectors(A, B).normalize();
  eAnt.set(0, 0, 1).addScaledVector(eL, -eL.z).normalize();
  eLft.crossVectors(eAnt, eL).normalize();
  if (eLft.x < 0) eLft.negate();
}

function radOf(z, th) { return W * prof(z) * bulge(z, th) * pinch(z, th); }

const _c = new T.Vector3();
function axisPoint(z, out) { return (out || new T.Vector3()).copy(B).addScaledVector(eL, LONG * z); }
function basePoint(z, th, out) {
  const r = radOf(z, th);
  const p = axisPoint(z, out || new T.Vector3());
  return p.addScaledVector(eLft, r * Math.cos(th)).addScaledVector(eAnt, r * AP * Math.sin(th));
}

const _p1 = new T.Vector3(), _p2 = new T.Vector3(), _q1 = new T.Vector3(), _q2 = new T.Vector3();
const _dz = new T.Vector3(), _dt = new T.Vector3(), _rv = new T.Vector3();
function baseNormal(z, th, out) {
  const n = out || new T.Vector3();
  const hz = 0.0012, ht = 0.0030;
  basePoint(Math.max(1e-5, z - hz), th, _p1);
  basePoint(Math.min(1 - 1e-5, z + hz), th, _p2);
  basePoint(z, th - ht, _q1);
  basePoint(z, th + ht, _q2);
  _dz.subVectors(_p2, _p1);
  _dt.subVectors(_q2, _q1);
  n.crossVectors(_dt, _dz);
  if (n.lengthSq() < 1e-14) {
    n.set(0, 0, 0).addScaledVector(eLft, Math.cos(th)).addScaledVector(eAnt, AP * Math.sin(th));
    if (n.lengthSq() < 1e-14) n.copy(eAnt);
  }
  n.normalize();
  basePoint(z, th, _rv).sub(axisPoint(z, _c));
  if (n.dot(_rv) < 0) n.negate();
  return n;
}

function surfPoint(z, th, off, out) {
  const p = basePoint(z, th, out || new T.Vector3());
  if (off) p.addScaledVector(baseNormal(z, th, new T.Vector3()), off);
  return p;
}

function measure() {
  let maxW = 0, maxAP = 0, minX = Infinity, maxX = -Infinity;
  const NZ = 96, NT = 120;
  const p = new T.Vector3();
  for (let i = 1; i < NZ; i++) {
    const z = i / NZ;
    let lo = Infinity, hi = -Infinity, lo2 = Infinity, hi2 = -Infinity;
    for (let j = 0; j < NT; j++) {
      const th = (j / NT) * Math.PI * 2;
      basePoint(z, th, p);
      if (p.x < minX) minX = p.x;
      if (p.x > maxX) maxX = p.x;
      _rv.copy(p).sub(axisPoint(z, _c));
      const a = _rv.dot(eLft), b = _rv.dot(eAnt);
      if (a < lo) lo = a; if (a > hi) hi = a;
      if (b < lo2) lo2 = b; if (b > hi2) hi2 = b;
    }
    if (hi - lo > maxW) maxW = hi - lo;
    if (hi2 - lo2 > maxAP) maxAP = hi2 - lo2;
  }
  return { width: maxW, thickness: maxAP, minX: minX, maxX: maxX };
}

function bisect(fn, lo, hi, target, iters) {
  let a = lo, b = hi;
  for (let i = 0; i < (iters || 46); i++) {
    const m = 0.5 * (a + b);
    if (fn(m) < target) a = m; else b = m;
  }
  return 0.5 * (a + b);
}

const SOLVED = { W: null, X_BASE: null, Z_BASE: null, iterations: 0, residual: null };
function solve() {
  setFrame(-1.6);
  let prevW = 0, prevX = 0, it = 0;
  for (; it < 24; it++) {
    W = bisect(w => { W = w; return measure().width; }, 1.0, 12.0, SPEC_W);
    const xb = bisect(x => { setFrame(x); return measure().minX; }, -2.10, 3.0, -RIGHT_REACH);
    setFrame(xb);
    if (Math.abs(W - prevW) < 1e-4 && Math.abs(X_BASE - prevX) < 1e-4) { it++; break; }
    prevW = W; prevX = X_BASE;
  }
  const m = measure();
  SOLVED.W = W; SOLVED.X_BASE = X_BASE; SOLVED.Z_BASE = Z_BASE; SOLVED.iterations = it;
  SOLVED.residual = { width: m.width - SPEC_W, rightReach: (-m.minX) - RIGHT_REACH };
  if (Math.abs(SOLVED.residual.width) > 0.01 || Math.abs(SOLVED.residual.rightReach) > 0.01) {
    console.warn('[coronary] the two solves did not converge together', SOLVED);
  }
}
solve();

/* theta-to-world-direction, MEASURED off the solved surface. A vessel on a free wall is placed by
   the direction that wall faces — the acute margin is where the form faces inferiorly, whatever
   theta that turns out to be — so nothing here moves if the solve moves the frame.

   MEASURED ON THE FORM WITHOUT ITS GROOVES, and this is a DIVERGENCE from heart-external.js, made
   deliberately and reported to review rather than smuggled in.

   The reason is a defect found while placing the coronary origins, which are the first things this
   corpus has ever had to place AT the coronary sulcus. `pinch()` cuts a furrow up to 8.5% deep and
   a few per cent of a turn wide, and inside a furrow the surface normal is dominated by the furrow
   wall, not by the chamber. thetaFacing then answers with whichever wall of the groove happens to
   face the query direction. Measured on the shared form, the same table reads:

       zeta      ant     right    supright
       0.25     106.2    103.1      33.1
       0.30      66.8    101.8      76.7      <- inside the coronary sulcus
       0.35      74.9    153.7      31.2

   `right` swings 50 degrees and `supright` 45 across a 0.05 step, and the value AT the sulcus is not
   between its neighbours. That is not the heart changing shape; it is the probe reading the groove.
   A root placed with it would be put wherever the furrow's wall pointed, and nothing downstream
   would notice, because a placement is not checked by anything either.

   So the anchors are measured on radSmooth — profile and chamber bulges, no sulcal pinch — which is
   also the honest definition: the direction a part of the heart FACES is a property of the chamber,
   not of the groove cut into it. The rendered surface is unchanged; only the measurement is.

   NOTE FOR REVIEW, because it is not this item's file to change: heart-external.js places the
   ascending aorta (zeta 0.27) and the pulmonary trunk (zeta 0.32) through the pinched table, and its
   anchor grid samples at 0.2563 and 0.2970 — the second of which sits in the furrow. Those two roots
   are therefore placed off a distorted reading in that file too. It is a small displacement and it
   may not matter; it should be looked at rather than inherited. Logged in BUILD-LOG.md. */
function radSmooth(z, th) { return W * prof(z) * bulge(z, th); }
const _sp1 = new T.Vector3(), _sp2 = new T.Vector3(), _sq1 = new T.Vector3(), _sq2 = new T.Vector3();
const _sdz = new T.Vector3(), _sdt = new T.Vector3(), _srv = new T.Vector3(), _sc = new T.Vector3();
function smoothPoint(z, th, out) {
  const r = radSmooth(z, th);
  const p = axisPoint(z, out || new T.Vector3());
  return p.addScaledVector(eLft, r * Math.cos(th)).addScaledVector(eAnt, r * AP * Math.sin(th));
}
function smoothNormal(z, th, out) {
  const n = out || new T.Vector3();
  const hz = 0.0012, ht = 0.0030;
  smoothPoint(Math.max(1e-5, z - hz), th, _sp1);
  smoothPoint(Math.min(1 - 1e-5, z + hz), th, _sp2);
  smoothPoint(z, th - ht, _sq1);
  smoothPoint(z, th + ht, _sq2);
  _sdz.subVectors(_sp2, _sp1);
  _sdt.subVectors(_sq2, _sq1);
  n.crossVectors(_sdt, _sdz);
  if (n.lengthSq() < 1e-14) {
    n.set(0, 0, 0).addScaledVector(eLft, Math.cos(th)).addScaledVector(eAnt, AP * Math.sin(th));
    if (n.lengthSq() < 1e-14) n.copy(eAnt);
  }
  n.normalize();
  smoothPoint(z, th, _srv).sub(axisPoint(z, _sc));
  if (n.dot(_srv) < 0) n.negate();
  return n;
}
const _nT = new T.Vector3();
function thetaFacing(z, dir) {
  let best = -2, bestTh = 0;
  const NS = 288;
  for (let j = 0; j < NS; j++) {
    const th = (j / NS) * Math.PI * 2;
    const d = smoothNormal(z, th, _nT).dot(dir);
    if (d > best) { best = d; bestTh = th; }
  }
  let lo = bestTh - Math.PI * 2 / NS, hi = bestTh + Math.PI * 2 / NS;
  for (let k = 0; k < 22; k++) {
    const m1 = lo + (hi - lo) / 3, m2 = hi - (hi - lo) / 3;
    const d1 = smoothNormal(z, m1, _nT).dot(dir), d2 = smoothNormal(z, m2, _nT).dot(dir);
    if (d1 < d2) lo = m1; else hi = m2;
  }
  return 0.5 * (lo + hi);
}

const ANCHOR_DIRS = {
  ant:      new T.Vector3(0, 0, 1),
  post:     new T.Vector3(0, 0, -1),
  right:    new T.Vector3(-1, 0, 0),
  left:     new T.Vector3(1, 0, 0),
  inf:      new T.Vector3(0, -1, 0),
  sup:      new T.Vector3(0, 1, 0),
  diaph:    new T.Vector3(0, -0.92, -0.39).normalize(),
  antright: new T.Vector3(-0.55, -0.10, 0.83).normalize(),
  antleft:  new T.Vector3(0.52, -0.10, 0.85).normalize(),
  supright: new T.Vector3(-0.45, 0.86, 0.24).normalize(),
  supleft:  new T.Vector3(0.50, 0.84, 0.20).normalize(),
};
const ANCHOR_Z = [], ANCHORS = {};
(function buildAnchors() {
  const N = 24;
  for (let i = 0; i <= N; i++) ANCHOR_Z.push(0.012 + (0.988 - 0.012) * i / N);
  for (const name of Object.keys(ANCHOR_DIRS)) {
    const row = [];
    for (let i = 0; i < ANCHOR_Z.length; i++) {
      let th = thetaFacing(ANCHOR_Z[i], ANCHOR_DIRS[name]);
      if (i) { while (th - row[i - 1] > Math.PI) th -= Math.PI * 2; while (row[i - 1] - th > Math.PI) th += Math.PI * 2; }
      row.push(th);
    }
    ANCHORS[name] = row;
  }
})();
function anch(name, z) {
  const row = ANCHORS[name];
  if (!row) throw new Error('[coronary] no such anchor direction: ' + name);
  if (z <= ANCHOR_Z[0]) return row[0];
  if (z >= ANCHOR_Z[ANCHOR_Z.length - 1]) return row[row.length - 1];
  let k = 0;
  while (k + 1 < ANCHOR_Z.length && ANCHOR_Z[k + 1] < z) k++;
  const u = (z - ANCHOR_Z[k]) / (ANCHOR_Z[k + 1] - ANCHOR_Z[k]);
  return row[k] + (row[k + 1] - row[k]) * u;
}
function facingPointOff(z, dirName, degOffset, frac) {
  const th = anch(dirName, z) + (degOffset || 0) * D2R;
  const p = surfPoint(z, th, 0, new T.Vector3());
  if (frac == null || frac >= 1) return p;
  const c = axisPoint(z, new T.Vector3());
  return c.addScaledVector(p.sub(c), frac);
}

/* ================================================== 3 · surface builders (patch, band, emitQuad) */

const _e1 = new T.Vector3(), _e2 = new T.Vector3(), _fn = new T.Vector3();
function emitQuad(E, a, b, c, d, na, nb, nc, nd) {
  _fn.crossVectors(_e1.subVectors(d, a), _e2.subVectors(c, a));
  if (_fn.lengthSq() < 1e-18) return;
  if (_fn.dot(na) >= 0) E.quad(a, b, c, d, na, nb, nc, nd);
  else E.quadFlip(a, b, c, d, na, nb, nc, nd);
}
function zetaRows(z0, z1, n) {
  const out = [];
  for (let i = 0; i <= n; i++) out.push(z0 + (z1 - z0) * (0.5 - 0.5 * Math.cos(Math.PI * i / n)));
  return out;
}
const ZEPS = 0.0008;

/** The closed outer form: a ring grid plus a fan cap at each pole.

    WHY THE POLES NEED CAPPING. The surface is sampled from zeta = ZEPS to 1 - ZEPS, never 0 to 1,
    because the radius function and its normal are both degenerate at the poles. That leaves a ring
    of open surface at each end. At the apex it is negligible — prof(1 - ZEPS) puts it at a radius of
    0.02 cm. At the BASE it is not: prof rises as a square root, so the first row already stands at a
    radius of 0.30 cm, and uncapped the form ends in a six-millimetre hole looking straight into its
    own inner surface.

    AND A CORRECTION, KEPT RATHER THAN TIDIED AWAY, because it is the more useful half. The first
    draft of this file reconstructed solidForm from the part of heart-external.js that had been read
    and left the caps out. The ray-cast probe caught it at once — two rays out of 447 from the
    right-hand camera meeting a surface facing away at dot 0.59, nowhere near a silhouette graze —
    and the obvious inference was that the shared form had a hole in it and the live heart-external
    scene had it too. That inference was written down as a finding, and it was WRONG.
    heart-external.js caps both poles, in a function called capAt, and a probe fired along the long
    axis at the base pole of BOTH shells returns 841 hits and zero facing-away on each. The hole was
    mine. RENDER-STANDARD section 6 says a note in a file is a claim and not a fact, INCLUDING YOUR
    OWN; a finding inferred from a file you have only partly read is exactly that, and the measurement
    is what settled it. Logged in BUILD-LOG.md as a near miss rather than a defect.

    The fan goes through triN, so the winding is decided by the geometry rather than by reasoning
    about which way the ring runs (RENDER-STANDARD 2.4b). heart-external does the same thing by
    testing the cross product against the pole normal before calling tri; the two are equivalent, and
    triN is the kit's own name for it. */
function solidForm(nz, nt, off) {
  const rows = zetaRows(ZEPS, 1 - ZEPS, nz);
  const P = [], N = [];
  for (let i = 0; i < rows.length; i++) {
    const pr = [], nr = [];
    for (let j = 0; j < nt; j++) {
      const th = (j / nt) * Math.PI * 2;
      nr.push(baseNormal(rows[i], th, new T.Vector3()));
      pr.push(surfPoint(rows[i], th, off, new T.Vector3()));
    }
    P.push(pr); N.push(nr);
  }
  const E = K.emitter();
  for (let i = 0; i + 1 < rows.length; i++) for (let j = 0; j < nt; j++) {
    const j2 = (j + 1) % nt;
    emitQuad(E, P[i][j], P[i + 1][j], P[i + 1][j2], P[i][j2], N[i][j], N[i + 1][j], N[i + 1][j2], N[i][j2]);
  }
  /* the two poles */
  const capPole = (row, zPole, sign) => {
    const centre = axisPoint(zPole, new T.Vector3());
    const axis = new T.Vector3().copy(eL).multiplyScalar(sign);
    if (off) centre.addScaledVector(axis, off);
    for (let j = 0; j < nt; j++) {
      const j2 = (j + 1) % nt;
      E.triN(centre, row[j], row[j2], axis);
    }
  };
  capPole(P[0], 0, -1);
  capPole(P[P.length - 1], 1, 1);
  return E.geometry(E.count());
}

/** A rectangular patch of the surface, offset outward along its own normal. */
function patch(z0, z1, t0, t1, nz, nt, off) {
  /* t0/t1 may be a NUMBER or a FUNCTION OF ZETA. A territory boundary that follows a sulcus has to
     move with it: the anterior interventricular sulcus swings 40 degrees from base to apex, so a
     fixed angular edge that is a 12-degree strip of right ventricle at the apex is a 52-degree slab
     of it at the base. Added at review, 2026-09-20 — see the corrected_at note in the scene. */
  const TH0 = (typeof t0 === 'function') ? t0 : function () { return t0; };
  const TH1 = (typeof t1 === 'function') ? t1 : function () { return t1; };
  /* UNIFORM rows, not the cosine clustering solidForm uses. The clustering exists to put samples
     where the profile turns fastest, which is at the poles of the WHOLE form; applied to an
     arbitrary patch it clusters at that patch's own edges instead and thins the middle, which is
     where a territory is actually read. Matches heart-external.js, whose patch() is uniform for the
     same reason; the first draft of this file used zetaRows here and that was a divergence, not a
     choice. */
  const rows = [];
  for (let i = 0; i <= nz; i++) rows.push(z0 + (z1 - z0) * i / nz);
  const P = [], N = [];
  for (let i = 0; i < rows.length; i++) {
    const pr = [], nr = [];
    for (let j = 0; j <= nt; j++) {
      const a = TH0(rows[i]), b = TH1(rows[i]);
      const th = a + (b - a) * j / nt;
      nr.push(baseNormal(rows[i], th, new T.Vector3()));
      pr.push(surfPoint(rows[i], th, off, new T.Vector3()));
    }
    P.push(pr); N.push(nr);
  }
  const E = K.emitter();
  for (let i = 0; i + 1 < rows.length; i++) for (let j = 0; j + 1 <= nt; j++) {
    emitQuad(E, P[i][j], P[i + 1][j], P[i + 1][j + 1], P[i][j + 1],
                N[i][j], N[i + 1][j], N[i + 1][j + 1], N[i][j + 1]);
  }
  return E.geometry(E.count());
}

/** A narrow band whose angular centre is a function of zeta — a sulcus in its furrow. */
function band(zList, thetaFn, halfWidth, off, nt) {
  const nn = nt || 6;
  const P = [], N = [];
  for (let i = 0; i < zList.length; i++) {
    const z = zList[i], tc = thetaFn(z);
    const pr = [], nr = [];
    for (let j = 0; j <= nn; j++) {
      const th = tc - halfWidth + (2 * halfWidth) * j / nn;
      nr.push(baseNormal(z, th, new T.Vector3()));
      pr.push(surfPoint(z, th, off, new T.Vector3()));
    }
    P.push(pr); N.push(nr);
  }
  const E = K.emitter();
  for (let i = 0; i + 1 < zList.length; i++) for (let j = 0; j < nn; j++) {
    emitQuad(E, P[i][j], P[i + 1][j], P[i + 1][j + 1], P[i][j + 1],
                N[i][j], N[i + 1][j], N[i + 1][j + 1], N[i][j + 1]);
  }
  return E.geometry(E.count());
}

/* ==================================================================== 4 · the vessel builder

   A coronary vessel is a tube along a curve that lies IN or ON the heart's surface. Both ends get a
   rounded cap unless they are buried in something — RENDER-STANDARD: "a tube that ends in mid-air
   needs a rounded end, not an annulus", and equally not a flat disc, which is what sweptShell writes
   for a solid tube and which reads as a cut pipe from any oblique angle.

   The tube itself, its winding, its normals and its silhouette all come from the kit. */

const V = (x, y, z) => new T.Vector3(x, y, z);

/* BOTH ENDS ARE DOMED, ALWAYS, and the reason is worth recording because the first build got it
   wrong in a way only one render caught.

   A vessel whose root is buried inside the aorta does not need a rounded end there — nothing can see
   it. So the first build left those ends flat, on the grounds that they were hidden. They are hidden
   in the DEFAULT build. The scene's fifth beat hides the myocardium and the great vessels to show the
   septal perforators, and in that beat every buried root became a flat cut cylinder face hanging in
   space — three arteries and the coronary sinus, all reading as open pipes, in a view the scene
   itself asks for. RENDER-STANDARD says a camera is not a fix; the corollary here is that "it is
   hidden" is a claim about ONE build of a model whose whole point is that layers come off.

   A dome on a buried end costs six rows of triangles and is invisible. A flat face on an exposed end
   is the one thing the standard says must never be visible. There is no version of that trade worth
   taking, so `vesselPieces` no longer accepts a way to skip a cap. */
function vesselPieces(points, rFn, opts) {
  opts = opts || {};
  const ring = opts.ring || 14;
  const out = [];
  /* drop any duplicated station: a zero-length segment makes the transported frame's direction
     vector NaN, and three's normalize() hands back (0,0,0) without complaining */
  const pts = [];
  for (const p of points) {
    if (!pts.length || p.distanceToSquared(pts[pts.length - 1]) > 1e-8) pts.push(p);
  }
  if (pts.length < 2) return out;
  const F = K.parallelFrame(pts, opts.seed);
  const steps = pts.length - 1;
  const tube = K.sweptShell({
    frame: F, i0: 0, i1: steps, ring: ring,
    outerR: i => rFn(i / steps), flatten: 1, section: () => 1,
  });
  if (tube) out.push(tube);
  const dome = (i, sign, r) => K.domeCap({
    frame: F, i: i, sign: sign, r: r, ring: ring, rows: 6,
    flatten: 1, section: () => 1, bulge: 0.92,
  });
  out.push(dome(0, -1, rFn(0)));
  out.push(dome(steps, 1, rFn(1)));
  return out.filter(Boolean);
}

function add(g, key, geo, opts) {
  if (!geo) return null;
  const L = LAYERS[key];
  if (!L) { console.warn('[coronary] no palette entry for ' + key); return null; }
  return K.addSolid(g, key, geo, Object.assign({ color: L.color, name: L.name }, opts || {}));
}

function addVessel(g, key, points, rFn, opts) {
  opts = opts || {};
  const r0 = rFn(0), r1 = rFn(1);
  const outline = Math.max(0.008, 0.16 * Math.min(r0, r1));
  for (const geo of vesselPieces(points, rFn, opts)) add(g, key, geo, { outline: outline });
}

/* ============================================================= 5 · the courses

   Every course is written as a function of one parameter u in [0,1] over (zeta, theta), and turned
   into world points by surfPoint. DEPTH is a fraction of the vessel's own radius, so a vessel sits
   nestled in its groove whatever its calibre: at NESTLE = 0.62 the tube's centre stands 0.62 of a
   radius proud of the groove floor, which leaves its lower third buried in myocardium and its crown
   about level with the surrounding surface — which is what an epicardial vessel in a sulcus looks
   like, and what makes "it lies IN the groove" a thing a student can see rather than read. */

const NESTLE = 0.62;

function lerp(a, b, u) { return a + (b - a) * u; }
/** interpolate an angle the short way round, so a course never takes the long way by accident */
function lerpAng(a, b, u) {
  let d = b - a;
  while (d > Math.PI) d -= Math.PI * 2;
  while (d < -Math.PI) d += Math.PI * 2;
  return a + d * u;
}
/** Sample a (zeta, theta) course into world points at a given normal offset. */
function course(n, zFn, thFn, offFn) {
  const pts = [];
  for (let i = 0; i <= n; i++) {
    const u = i / n;
    pts.push(surfPoint(zFn(u), thFn(u), offFn(u), new T.Vector3()));
  }
  return pts;
}

/* HOW FAR APART TWO VESSELS IN ONE GROOVE SIT IS SOLVED, NOT PICKED. A companion vein lies beside its
   artery, touching it, in the same groove. Written as an ANGLE that separation drifts with the
   calibre of the form — the same 9 degrees is a comfortable gap on the atria and an overlap at the
   apex. So the angle is derived at every station from the arc length actually wanted: the two
   centrelines are set (r_artery + r_vein) * COMPANION apart along the surface, and the angle that
   delivers that is read off the surface itself. RENDER-STANDARD: prefer a solved parameter to a
   tuned one, and solve the one that decides the examinable relation — here, that the vein runs WITH
   the artery and is not the artery. */
const COMPANION = 1.55;
const _aA = new T.Vector3(), _aB = new T.Vector3();
function angleForArc(z, thc, arc) {
  basePoint(z, thc - 0.01, _aA);
  basePoint(z, thc + 0.01, _aB);
  const perRad = _aA.distanceTo(_aB) / 0.02;
  return arc / Math.max(1e-6, perRad);
}
function companionAngle(z, thc, rA, rB) { return angleForArc(z, thc, COMPANION * (rA + rB)); }

function polylineLength(pts) {
  let L = 0;
  for (let i = 1; i < pts.length; i++) L += pts[i].distanceTo(pts[i - 1]);
  return L;
}
function axisExtent(pts, axis) {
  let lo = Infinity, hi = -Infinity;
  for (const p of pts) { const v = p[axis]; if (v < lo) lo = v; if (v > hi) hi = v; }
  return hi - lo;
}
function axisMean(pts, axis) {
  let s = 0;
  for (const p of pts) s += p[axis];
  return s / pts.length;
}

/* --- landmark thetas, resolved on the solved form ------------------------------------------- */

const TH_CRUX = thPIV(Z_CS);                 // the crux: where the coronary and posterior IV sulci meet
const TH_AIV_TOP = thAIV(Z_CS);              // the top of the anterior interventricular sulcus
/* the right coronary emerges between the RIGHT AURICLE and the PULMONARY TRUNK: just to the right of
   where the form faces anteriorly, on the atrioventricular groove */
const TH_RCA_ORIGIN = anch('ant', Z_CS) + 21 * D2R;
/* the left coronary emerges between the LEFT AURICLE and the PULMONARY TRUNK, at the top of the
   anterior interventricular sulcus */
const TH_LCA_EMERGE = TH_AIV_TOP - 4 * D2R;

/* The two arteries run round the coronary groove in OPPOSITE directions from a common anterior
   starting region, and dominance is the question of which of them gets to the crux. Theta increases
   the RCA's way and decreases the circumflex's, so the crux is TH_CRUX to one and TH_CRUX - 2*pi to
   the other; the non-dominant vessel stops SHORT_OF short of it. Written this way, dominance is a
   fact about two courses rather than a label on a vessel — which is what lets acceptance() prove it
   by measurement and what makes the left_dominant build a genuine alternative rather than a rename. */
const SHORT_OF = 62 * D2R;               // how far short of the crux the non-dominant artery stops
const RCA_TH0 = TH_RCA_ORIGIN, RCA_TH1 = TH_CRUX;
const CX_TH0  = TH_LCA_EMERGE, CX_TH1 = TH_CRUX - Math.PI * 2;

/* Radii, in centimetres, from stated calibres: LCA stem 4.5 mm, LAD 3.6 mm, circumflex 3.4 mm,
   RCA 3.9 mm, marginals about 1.7 mm, nodal branches about 1.1 mm; coronary sinus about 1 cm ACROSS,
   which is why it is drawn wider than any artery here. */
const R = {
  lca_stem: 0.225,
  lad0: 0.185, lad1: 0.062,
  cx0: 0.170, cx1: 0.082,
  rca0: 0.195, rca1: 0.098,
  diag0: 0.080, diag1: 0.038,
  septal0: 0.055, septal1: 0.026,
  lmarg0: 0.090, lmarg1: 0.046,
  rmarg0: 0.085, rmarg1: 0.043,
  pda0: 0.115, pda1: 0.052,
  plat0: 0.080, plat1: 0.043,
  sanod0: 0.062, sanod1: 0.038,
  avnod: 0.050,
  cs0: 0.420, cs1: 0.520,
  gcv0: 0.098, gcv1: 0.240,
  mcv0: 0.072, mcv1: 0.170,
  scv0: 0.052, scv1: 0.108,
  pvlv0: 0.058, pvlv1: 0.100,
  ovla: 0.055,
  acv0: 0.050, acv1: 0.084,
};

/* -------------------------------------------------------------------------- arterial courses */

/** RIGHT CORONARY ARTERY. Right aortic sinus -> right atrioventricular groove -> acute border ->
    diaphragmatic surface -> the crux. In a LEFT-dominant heart it stops short of the crux. */
function rcaPath(leftDominant) {
  const th1 = leftDominant ? RCA_TH1 - SHORT_OF : RCA_TH1;
  const N = 44;
  const pts = [];
  /* the ostium sits INSIDE the aortic root: the first station is under the surface so the tube's
     start cap is buried in the root rather than showing as a rim on it */
  pts.push(facingPointOff(0.268, 'antright', -10, 0.70));
  pts.push(surfPoint(0.283, anch('antright', 0.283) - 4 * D2R, 0.06, new T.Vector3()));
  for (let i = 0; i <= N; i++) {
    const u = i / N;
    const th = lerp(RCA_TH0, th1, u);
    const z = Z_CS + 0.012 * Math.sin(Math.PI * u);   // the groove sags a little onto the ventricle
    pts.push(surfPoint(z, th, NESTLE * lerp(R.rca0, R.rca1, u), new T.Vector3()));
  }
  return pts;
}
function rcaR(u) { return lerp(R.rca0, R.rca1, Math.max(0, (u - 0.05) / 0.95)); }

/** LEFT CORONARY ARTERY, the stem. From the left aortic sinus, BEHIND the pulmonary trunk, to the
    top of the anterior interventricular sulcus. Short — a centimetre or two — and hidden until the
    pulmonary trunk is taken away, which is why the scene has a view that does exactly that. */
function lcaStemPath() {
  return [
    facingPointOff(0.262, 'antleft', -34, 0.66),
    facingPointOff(0.276, 'antleft', -26, 0.80),
    surfPoint(0.290, TH_LCA_EMERGE + 9 * D2R, 0.02, new T.Vector3()),
    surfPoint(Z_CS, TH_LCA_EMERGE, NESTLE * R.lca_stem, new T.Vector3()),
  ];
}

/** ANTERIOR INTERVENTRICULAR BRANCH (LAD). Down the anterior interventricular sulcus, then round the
    apical notch into the lower part of the posterior sulcus — which about four hearts in five do, and
    which is why an anterior infarct can take the apex and a strip of the inferior wall with it. */
const LAD_Z_END = 0.952;
function ladPath() {
  const pts = [];
  const N = 34;
  for (let i = 0; i <= N; i++) {
    const u = i / N;
    const z = lerp(Z_CS, LAD_Z_END, u);
    pts.push(surfPoint(z, thAIV(z), NESTLE * lerp(R.lad0, R.lad1, u), new T.Vector3()));
  }
  /* round the apex. Through the RIGHT side (theta increasing) because the apical notch lies just to
     the right of the apex, which is the side the vessel actually turns. */
  const M = 12;
  const thA = thAIV(LAD_Z_END), thP = thPIV(0.930);
  for (let i = 1; i <= M; i++) {
    const u = i / M;
    const z = lerp(LAD_Z_END, 0.930, u) + 0.020 * Math.sin(Math.PI * u);
    const th = lerp(thA, thP, u);
    pts.push(surfPoint(z, th, NESTLE * R.lad1, new T.Vector3()));
  }
  return pts;
}
function ladR(u) { return u < 0.74 ? lerp(R.lad0, R.lad1, u / 0.74) : R.lad1; }

/** CIRCUMFLEX BRANCH. Left in the coronary sulcus, round the obtuse margin onto the back. Reaches
    the crux ONLY in a left-dominant heart. */
function circumflexPath(leftDominant) {
  const N = 40;
  const pts = [];
  const th1 = leftDominant ? CX_TH1 : CX_TH1 + SHORT_OF;
  for (let i = 0; i <= N; i++) {
    const u = i / N;
    const th = lerp(CX_TH0, th1, u);
    const z = Z_CS + 0.010 * Math.sin(Math.PI * u);
    pts.push(surfPoint(z, th, NESTLE * lerp(R.cx0, R.cx1, u), new T.Vector3()));
  }
  return pts;
}

/** POSTERIOR INTERVENTRICULAR BRANCH (PDA). Down the posterior interventricular sulcus from the
    crux. Its PARENT is whichever artery got there — that is what dominance means, and it is settled
    here by geometry, by starting the vessel at the crux where both candidate courses end. */
function pdaPath() {
  const N = 26;
  const pts = [];
  for (let i = 0; i <= N; i++) {
    const u = i / N;
    const z = lerp(Z_CS - 0.008, 0.930, u);
    pts.push(surfPoint(Math.max(Z_CS, z), thPIV(Math.max(Z_CS, z)), NESTLE * lerp(R.pda0, R.pda1, u), new T.Vector3()));
  }
  return pts;
}

/** RIGHT (ACUTE) MARGINAL BRANCH — along the acute border towards the apex. Placed by the direction
    the form FACES (inferiorly), not by an angle: the acute margin is the inferior border. */
const RM_Z0 = Z_CS + 0.015, RM_Z1 = 0.845;
/** the acute margin, as a function of zeta: where the form FACES inferiorly, drifting a little
    anteriorly as it runs down to the apex. Measured, not an angle. */
function thAcuteMargin(z) {
  const u = Math.max(0, Math.min(1, (z - RM_Z0) / (RM_Z1 - RM_Z0)));
  return anch('inf', z) - lerp(2, 12, u) * D2R;
}
function rightMarginalPath() {
  const N = 20;
  const pts = [];
  for (let i = 0; i <= N; i++) {
    const u = i / N;
    const z = lerp(RM_Z0, RM_Z1, u);
    pts.push(surfPoint(z, thAcuteMargin(z), NESTLE * lerp(R.rmarg0, R.rmarg1, u), new T.Vector3()));
  }
  return pts;
}

/** LEFT (OBTUSE) MARGINAL BRANCH — down the obtuse margin, the left border of the heart. */
function leftMarginalPath() {
  const N = 20;
  const pts = [];
  for (let i = 0; i <= N; i++) {
    const u = i / N;
    const z = lerp(Z_CS + 0.015, 0.790, u);
    const th = anch('left', z) + lerp(4, 16, u) * D2R;
    pts.push(surfPoint(z, th, NESTLE * lerp(R.lmarg0, R.lmarg1, u), new T.Vector3()));
  }
  return pts;
}

/** DIAGONAL BRANCHES — off the LAD onto the anterior wall of the left ventricle. */
function diagonalPaths() {
  return [[0.44, 0.20, 46], [0.61, 0.16, 38]].map(([z0, dz, dth]) => {
    const N = 14;
    const pts = [];
    for (let i = 0; i <= N; i++) {
      const u = i / N;
      const z = z0 + dz * u;
      const th = thAIV(z0) - dth * D2R * u;
      pts.push(surfPoint(z, th, NESTLE * lerp(R.diag0, R.diag1, u), new T.Vector3()));
    }
    return pts;
  });
}

/** INTERVENTRICULAR SEPTAL BRANCHES — the perforators. They leave the LAD at a right angle and dive
    INTO the septum, and they reach the ANTERIOR TWO THIRDS of it. That fraction is the examined
    fact, so it is built as a fraction of the chord from the anterior sulcus floor to the posterior
    one — which is the septum — and asserted in acceptance(), not written in a caption. */
const SEPTAL_FRACTION = 2 / 3;
function septalPaths(fraction) {
  const f = fraction == null ? SEPTAL_FRACTION : fraction;
  return [0.40, 0.52, 0.65, 0.78].map(z => {
    const a = surfPoint(z, thAIV(z), 0, new T.Vector3());
    const b = surfPoint(z, thPIV(z), 0, new T.Vector3());
    const N = 8;
    const pts = [];
    for (let i = 0; i <= N; i++) {
      const u = i / N;
      pts.push(new T.Vector3().lerpVectors(a, b, f * u));
    }
    return pts;
  });
}

/** SINUATRIAL NODAL BRANCH — up the anterior wall of the right atrium to the node, at the junction
    of the superior vena cava with the atrium. From the RIGHT coronary in about 60% of hearts, which
    is the arrangement drawn. */
const SA_NODE_Z = 0.088, SA_NODE_DEG = 34;
function saNodeCentre() { return surfPoint(SA_NODE_Z, anch('supright', SA_NODE_Z) + SA_NODE_DEG * D2R, -0.10, new T.Vector3()); }
function saNodalPath() {
  const p0 = surfPoint(Z_CS, TH_RCA_ORIGIN + 5 * D2R, NESTLE * R.sanod0, new T.Vector3());
  const N = 16;
  const pts = [];
  for (let i = 0; i <= N; i++) {
    const u = i / N;
    const z = lerp(Z_CS - 0.004, SA_NODE_Z, u);
    const th = lerpAng(TH_RCA_ORIGIN + 5 * D2R, anch('supright', SA_NODE_Z) + SA_NODE_DEG * D2R, u);
    pts.push(surfPoint(z, th, lerp(NESTLE * R.sanod0, -0.06, u), new T.Vector3()));
  }
  pts[0] = p0;
  return pts;
}

/** ATRIOVENTRICULAR NODAL BRANCH — a short twig turning in at the crux, towards the node in the
    interatrial septum. Which is why the crux matters clinically and not only descriptively. */
function avNodeCentre() { return facingPointOff(Z_CS - 0.055, 'post', -14, 0.62); }
function avNodalPath() {
  const a = surfPoint(Z_CS, TH_CRUX, NESTLE * R.avnod, new T.Vector3());
  const b = avNodeCentre();
  const N = 8;
  const pts = [];
  for (let i = 0; i <= N; i++) pts.push(new T.Vector3().lerpVectors(a, b, i / N));
  return pts;
}

/** RIGHT POSTEROLATERAL BRANCH — beyond the crux, onto the diaphragmatic surface of the LEFT
    ventricle. In a right-dominant heart the right coronary supplies part of the left ventricle, and
    this is the branch that does it. */
function posterolateralPath() {
  const N = 16;
  const pts = [];
  for (let i = 0; i <= N; i++) {
    const u = i / N;
    const z = lerp(Z_CS + 0.010, 0.600, u);
    const th = lerp(TH_CRUX + 6 * D2R, TH_CRUX + 40 * D2R, u);
    pts.push(surfPoint(z, th, NESTLE * lerp(R.plat0, R.plat1, u), new T.Vector3()));
  }
  return pts;
}

/* ----------------------------------------------------------------------------- venous courses */

/* The venous half is drawn on the ATRIAL side of the coronary groove (zeta a little less than Z_CS)
   and the arterial half on the VENTRICULAR side, so the two never occupy the same line. That is a
   simplification of a real groove, where the two lie in fat at slightly different depths, and it is
   recorded in the scene's gaps[]. */
const V_SIDE = -0.016;

const TH_CS_START = TH_CRUX + 52 * D2R;    // where the great cardiac vein becomes the coronary sinus
const TH_CS_END   = TH_CRUX - 18 * D2R;    // the ostium, in the right atrium beyond the crux

/** GREAT CARDIAC VEIN. Begins at the apex, ascends the ANTERIOR interventricular sulcus beside the
    LAD — on the left ventricular side of it — then turns left in the coronary sulcus and runs round
    the back. It is the LAD's companion, and that pairing is the recognition cue. */
function gcvPath() {
  const pts = [];
  const N = 26;
  for (let i = 0; i <= N; i++) {                       // up the anterior sulcus, apex to the groove
    const u = i / N;
    const z = lerp(0.900, Z_CS, u);
    const rv = lerp(R.gcv0, R.gcv1, u), ra = ladR(1 - u * 0.74);
    /* MINUS the companion angle: the vein lies on the LEFT VENTRICULAR side of the artery, which is
       the side a student is shown it on and the side it has to be on to reach the obtuse margin */
    const th = thAIV(z) - companionAngle(z, thAIV(z), ra, rv);
    pts.push(surfPoint(z, th, NESTLE * rv, new T.Vector3()));
  }
  const M = 22;
  const thJoin = pts[pts.length - 1] ? thAIV(Z_CS) - companionAngle(Z_CS, thAIV(Z_CS), R.lad0, R.gcv1) : thAIV(Z_CS);
  for (let i = 1; i <= M; i++) {                       // then left, round into the coronary groove
    const u = i / M;
    const th = lerp(thJoin, TH_CS_START - Math.PI * 2, u);
    pts.push(surfPoint(Z_CS + V_SIDE * u, th, NESTLE * R.gcv1, new T.Vector3()));
  }
  return pts;
}
function gcvR(u) { return u < 0.55 ? lerp(R.gcv0, R.gcv1, u / 0.55) : R.gcv1; }

/** CORONARY SINUS. The posterior part of the coronary sulcus, and the single widest vessel on the
    heart. Ends by opening into the RIGHT ATRIUM — the last station is pulled INSIDE the atrium, so
    the ostium is a hole in a wall rather than a tube stopping in mid-air. */
function coronarySinusPath() {
  const N = 24;
  const pts = [];
  for (let i = 0; i <= N; i++) {
    const u = i / N;
    const th = lerp(TH_CS_START, TH_CS_END, u);
    pts.push(surfPoint(Z_CS + V_SIDE, th, NESTLE * lerp(R.cs0, R.cs1, u), new T.Vector3()));
  }
  /* THE OSTIUM, ENTERED GRADUALLY. The sinus is the widest vessel on the heart — a centimetre across
     — and a tube that wide cannot be turned in one step. The first version put a single station
     inside the atrial wall, which asked the sweep to turn most of a right angle over about a
     centimetre: the inside of the bend folded through itself and the ray-cast probe caught the
     result as a first hit facing away, from three separate cameras. The radius of curvature of a
     swept tube's path has to stay comfortably larger than the tube's own radius, so the entry is
     spread over four stations instead of one. */
  const last = pts[pts.length - 1];
  const inner = facingPointOff(Z_CS - 0.030, 'post', -26, 0.66);   // through the wall, into the atrium
  for (let i = 1; i <= CS_OSTIUM_STATIONS; i++) {
    const u = i / CS_OSTIUM_STATIONS;
    pts.push(new T.Vector3().lerpVectors(last, inner, u * u * (3 - 2 * u)));
  }
  return pts;
}
/* how many stations of the sinus are INSIDE the atrial wall. Named rather than written as a literal
   in two places, because acceptance() has to exempt exactly these from the epicardial test and a
   second hand-counted copy of the number would go stale the moment the entry is re-shaped. */
const CS_OSTIUM_STATIONS = 4;

/** MIDDLE CARDIAC VEIN — the posterior interventricular sulcus, beside the PDA, into the coronary
    sinus near the crux. */
function mcvPath() {
  const N = 22;
  const pts = [];
  for (let i = 0; i <= N; i++) {
    const u = i / N;
    const z = lerp(0.895, Z_CS, u);
    const rv = lerp(R.mcv0, R.mcv1, u), ra = lerp(R.pda1, R.pda0, u);
    pts.push(surfPoint(z, thPIV(z) + companionAngle(z, thPIV(z), ra, rv), NESTLE * rv, new T.Vector3()));
  }
  pts.push(surfPoint(Z_CS + V_SIDE, TH_CRUX + 4 * D2R, NESTLE * R.mcv1, new T.Vector3()));
  return pts;
}

/** SMALL CARDIAC VEIN — along the acute border with the right marginal artery, then back along the
    right coronary groove to the right end of the coronary sinus. */
function scvPath() {
  const N = 18;
  const pts = [];
  for (let i = 0; i <= N; i++) {
    const u = i / N;
    const z = lerp(0.760, Z_CS + 0.02, u);
    const rv = lerp(R.scv0, R.scv1, u), ra = lerp(R.rmarg1, R.rmarg0, u);
    const th = thAcuteMargin(z) + companionAngle(z, thAcuteMargin(z), ra, rv);
    pts.push(surfPoint(z, th, NESTLE * rv, new T.Vector3()));
  }
  const M = 12;
  const thStart = thAcuteMargin(Z_CS + 0.02) + companionAngle(Z_CS + 0.02, thAcuteMargin(Z_CS + 0.02), R.rmarg0, R.scv1);
  for (let i = 1; i <= M; i++) {
    const u = i / M;
    pts.push(surfPoint(Z_CS + V_SIDE * u, lerp(thStart, TH_CS_END + 6 * D2R, u), NESTLE * R.scv1, new T.Vector3()));
  }
  return pts;
}

/** POSTERIOR VEINS OF THE LEFT VENTRICLE — up the diaphragmatic surface into the coronary sinus. */
function postVeinPaths() {
  return [[0.740, 292], [0.660, 312]].map(([z0, thDeg]) => {
    const N = 12;
    const pts = [];
    for (let i = 0; i <= N; i++) {
      const u = i / N;
      const z = lerp(z0, Z_CS + V_SIDE, u);
      const th = lerp(thDeg * D2R, thDeg * D2R + 6 * D2R, u);
      pts.push(surfPoint(z, th, NESTLE * lerp(R.pvlv0, R.pvlv1, u), new T.Vector3()));
    }
    return pts;
  });
}

/** OBLIQUE VEIN OF THE LEFT ATRIUM — down the back of the left atrium to the point where the great
    cardiac vein becomes the coronary sinus. That junction is what DEFINES the sinus's beginning. */
function obliqueVeinPath() {
  const N = 10;
  const pts = [];
  for (let i = 0; i <= N; i++) {
    const u = i / N;
    const z = lerp(0.140, Z_CS + V_SIDE, u);
    const th = lerp(TH_CS_START - 6 * D2R, TH_CS_START, u);
    pts.push(surfPoint(z, th, NESTLE * R.ovla, new T.Vector3()));
  }
  return pts;
}

/** ANTERIOR CARDIAC VEINS — up the front of the RIGHT ventricle, ACROSS the coronary sulcus, and
    straight into the right atrium. They do NOT join the coronary sinus, and that is the point of
    drawing them: the coronary sinus is the main venous route, not the only one. */
function anteriorCardiacVeinPaths() {
  return [[0.560, 118], [0.510, 136], [0.470, 152]].map(([z0, thDeg]) => {
    const N = 12;
    const pts = [];
    for (let i = 0; i <= N; i++) {
      const u = i / N;
      const z = lerp(z0, 0.185, u);
      const th = lerp(thDeg * D2R, (thDeg + 9) * D2R, u);
      pts.push(surfPoint(z, th, NESTLE * lerp(R.acv0, R.acv1, u), new T.Vector3()));
    }
    /* the last station is pulled into the atrial wall — these veins END in the right atrium */
    pts.push(surfPoint(0.170, (thDeg + 10) * D2R, -0.10, new T.Vector3()));
    return pts;
  });
}

/* =========================================================== 6 · myocardial territories

   The three territories partition the VENTRICULAR mass between them, which is the examinable fact:
   every part of the ventricular wall is supplied by one of the three, and an occlusion takes that
   part. Boundaries are the two interventricular sulci and the obtuse margin, so they are read off the
   same functions that cut the grooves and cannot drift away from the vessel lying in them.

   Drawn for the RIGHT-DOMINANT arrangement — the inferior wall and the posterior third of the septum
   go to the right coronary. In a left-dominant heart that territory belongs to the circumflex, and
   the flag swaps the two patches as well as the artery, because a picture in which the vessel moved
   and its territory did not would teach the wrong thing more convincingly than no picture at all. */

/* THE LAD'S TERRITORY STRADDLES ITS OWN GROOVE, and the first version did not. The anterior
   interventricular sulcus runs from theta 68 to 108, and the territory was written 30 to 112 — which
   put the artery at the very edge of the territory named after it and gave it four degrees of right
   ventricle. But this artery supplies the anterior wall of BOTH ventricles: it lies in the groove
   between them and feeds each side of it. Extended to 120 so there is a real strip of right ventricle
   in it. Anything much wider would take the crest of the right ventricular bulge at 135, which
   belongs to the right coronary. */
/* CORRECTED AT REVIEW, 2026-09-20. The boundary was a FIXED 120 degrees while the sulcus it is
   meant to parallel runs from 68 at the coronary sulcus to 108 at the apex. Measured on the build as
   it stood: the right ventricular strip inside the LAD's territory was 52 degrees at the base and 12
   at the apex, and 59% of the ANTERIOR-FACING right ventricle — the aspect beat 9 is shown from —
   was painted as LAD territory. Beat 9's own narration says "the right coronary the right ventricle",
   and Moore is "the RCA supplies most of the right ventricle"; a student reading that figure would
   answer LAD. The boundary now TRACKS the sulcus at a constant offset, and the offset is the 12
   degrees this file already produced at the apex — inside the bracket the note below states (more
   than the 4 degrees that was too little, well clear of the right ventricular crest at 135). */
const STRIP_RV = 12 * D2R;
function thLadEdge(z) { return thAIV(z) + STRIP_RV; }
const TERR = {
  lad: { t0: 30 * D2R,  t1: thLadEdge, z0: Z_CS, z1: 0.994 },
  rca: { t0: thLadEdge, t1: TH_CRUX + 5 * D2R, z0: Z_CS, z1: 0.945 },
  cx:  { t0: TH_CRUX + 5 * D2R, t1: 30 * D2R + Math.PI * 2, z0: Z_CS, z1: 0.945 },
};
const OFF_TERRITORY = 0.055, OFF_SULCUS = 0.012;

/* ==================================================================== 7 · acceptance

   Every assertion carries a MAGNITUDE FLOOR expressed as a fraction of a relevant extent, and every
   one carries a NEGATIVE CASE — a deliberately wrong input it must reject. RENDER-STANDARD: a sign
   test that can be satisfied without the picture changing is not measuring what the narration claims,
   and a test that grades its own homework in the wrong units launders a defect into a proof. */

function meanPoint(pts) {
  const m = new T.Vector3();
  pts.forEach(p => m.add(p));
  return m.multiplyScalar(1 / pts.length);
}
function minDist(p, pts) {
  let d = Infinity;
  for (const q of pts) { const e = p.distanceTo(q); if (e < d) d = e; }
  return d;
}
function minDistIdx(p, pts) {
  let d = Infinity, k = -1;
  for (let i = 0; i < pts.length; i++) { const e = p.distanceTo(pts[i]); if (e < d) { d = e; k = i; } }
  return { d: d, i: k };
}
function sulcusFloor(thFn, z0, z1, n) {
  const out = [];
  for (let i = 0; i <= n; i++) { const z = lerp(z0, z1, i / n); out.push(surfPoint(z, thFn(z), 0, new T.Vector3())); }
  return out;
}
/** the extent of the built form along a world axis, for expressing a floor as a fraction of it */
function formExtent() {
  const m = measure();
  return { transverse: m.maxX - m.minX, long: LONG };
}

/** the chord each septal perforator runs along: anterior sulcus floor to posterior sulcus floor at
    the same station. THE chord, recovered exactly, rather than the nearest sampled point to it. */
function septalChords() {
  return [0.40, 0.52, 0.65, 0.78].map(z => ({
    z: z,
    a: surfPoint(z, thAIV(z), 0, new T.Vector3()),
    b: surfPoint(z, thPIV(z), 0, new T.Vector3()),
  }));
}
/** the cardiac end of the superior vena cava — the landmark the sinuatrial node is defined against */
function svcJunction() { return facingPointOff(0.09, 'supright', 40, 0.74); }
/** the coronary sulcus ring, as points, for measuring "how far above the groove" something is */
function coronarySulcusRing(n) {
  const out = [];
  for (let i = 0; i <= (n || 96); i++) out.push(surfPoint(Z_CS, (i / (n || 96)) * Math.PI * 2, 0, new T.Vector3()));
  return out;
}

function collectData(leftDominant) {
  const aiv = sulcusFloor(thAIV, Z_CS, 0.945, 60);
  const piv = sulcusFloor(thPIV, Z_CS, 0.945, 60);
  return {
    leftDominant: !!leftDominant,
    aiv: aiv, piv: piv,
    lad: ladPath(), gcv: gcvPath(), rca: rcaPath(leftDominant), cx: circumflexPath(leftDominant),
    pda: pdaPath(), cs: coronarySinusPath(), acv: anteriorCardiacVeinPaths(),
    septal: septalPaths(), chords: septalChords(),
    saNodal: saNodalPath(), saNode: saNodeCentre(), svcJn: svcJunction(), csRing: coronarySulcusRing(96),
    /* ADDED AT REVIEW 2026-09-20: the remaining epicardial vessels, so that the check whose `must`
       says EVERY epicardial vessel actually reads every one of them. It read seven of sixteen. */
    diag: diagonalPaths(), rmarg: rightMarginalPath(), lmarg: leftMarginalPath(),
    plat: posterolateralPath(), mcv: mcvPath(), scv: scvPath(),
    pvlv: postVeinPaths(), ovla: obliqueVeinPath(),
    extent: formExtent(),
  };
}

const CHECKS = [
  {
    id: 'lad_lies_in_the_anterior_interventricular_sulcus',
    must: 'every station of the anterior interventricular branch is at least 4x closer to the ' +
          'anterior interventricular sulcus floor than to the posterior one',
    run(D) {
      let worst = 0, worstAt = null;
      const n = Math.floor(D.lad.length * 0.74);          // the sulcal part, before the apical wrap
      for (let i = 0; i < n; i++) {
        const a = minDist(D.lad[i], D.aiv), b = minDist(D.lad[i], D.piv);
        const ratio = a / Math.max(1e-6, b);
        if (ratio > worst) { worst = ratio; worstAt = i; }
      }
      return { pass: worst <= 0.25, value: worst, floor: 0.25, at: worstAt };
    },
    negative(D) { return Object.assign({}, D, { lad: D.piv.slice() }); },   // a LAD in the WRONG sulcus
  },
  {
    id: 'great_cardiac_vein_accompanies_the_lad_without_fusing_with_it',
    must: 'in the anterior sulcus the two centrelines are separated by between 1.0 and 3.5 times ' +
          'the sum of their radii — touching but not the same vessel',
    /* The radii are taken at the MATCHED stations — the artery's at its own parameter and the vein's
       at the parameter of the nearest vein sample. An earlier version of this check used the vein's
       maximum radius everywhere, which inflated the denominator by up to 40% at mid-course and
       reported a correctly-built pair as fused. A test that grades in the wrong units is worse than
       no test; this one now measures the thing its own `must` string claims. */
    run(D) {
      let lo = Infinity, hi = 0;
      for (let i = 4; i < 24; i++) {
        const u = i / (D.lad.length - 1);
        const m = minDistIdx(D.lad[i], D.gcv);
        const vu = m.i / (D.gcv.length - 1);
        const rr = ladR(u) + gcvR(vu);
        lo = Math.min(lo, m.d / rr); hi = Math.max(hi, m.d / rr);
      }
      return { pass: lo >= 1.0 && hi <= 3.5, value: { lo: lo, hi: hi }, floor: '1.0 .. 3.5' };
    },
    negative(D) { return Object.assign({}, D, { gcv: D.lad.slice() }); },   // fused with the artery
  },
  {
    id: 'the_coronary_sinus_is_wider_than_any_coronary_artery',
    must: 'the coronary sinus radius is at least twice the proximal right coronary radius',
    run() {
      const ratio = R.cs1 / Math.max(R.rca0, R.cx0, R.lad0, R.lca_stem);
      return { pass: ratio >= 2.0, value: ratio, floor: 2.0 };
    },
    negative() { return null; },        // exercised by REVERSED below
    reversed() {
      const ratio = (R.rca0 * 0.5) / Math.max(R.rca0, R.cx0);
      return ratio >= 2.0;              // must be false
    },
  },
  {
    id: 'anterior_cardiac_veins_bypass_the_coronary_sinus',
    /* The claim is antero-posterior — these veins are on the FRONT and the sinus is on the BACK — so
       the floor is a fraction of the two structures' own extents ALONG THAT AXIS, per
       RENDER-STANDARD, and not of some other axis that happens to be bigger. The second half is a
       non-contact test: even a near miss would render as a junction. */
    must: 'the anterior cardiac veins end anterior to the coronary sinus by at least 35% of the mean ' +
          'antero-posterior extent of the two, and no terminus comes within 2 sinus radii of it',
    run(D) {
      const ends = D.acv.map(v => v[v.length - 1]);
      const meanExtent = 0.5 * (axisExtent(ends.concat(...D.acv), 'z') + axisExtent(D.cs, 'z'));
      const floor = 0.35 * meanExtent;
      const sep = axisMean(ends, 'z') - axisMean(D.cs, 'z');
      let nearest = Infinity;
      for (const e of ends) nearest = Math.min(nearest, minDist(e, D.cs));
      return { pass: sep >= floor && nearest >= 2 * R.cs1,
               value: { anteriorBy: sep, nearest: nearest }, floor: floor };
    },
    negative(D) {
      const acv = D.acv.map(v => v.slice(0, -1).concat([D.cs[8].clone()]));   // draining INTO the sinus
      return Object.assign({}, D, { acv: acv });
    },
  },
  {
    id: 'septal_branches_reach_the_anterior_two_thirds_of_the_septum',
    must: 'each perforator tip lies between 0.60 and 0.72 of the way along the chord from the ' +
          'anterior interventricular sulcus floor to the posterior one — the septum itself',
    run(D) {
      let lo = Infinity, hi = 0;
      for (let i = 0; i < D.septal.length; i++) {
        const s = D.septal[i], ch = D.chords[i];
        if (!ch) return { pass: false, value: 'no chord for perforator ' + i };
        const tip = s[s.length - 1];
        const total = ch.a.distanceTo(ch.b), got = ch.a.distanceTo(tip);
        const f = got / Math.max(1e-6, total);
        lo = Math.min(lo, f); hi = Math.max(hi, f);
      }
      return { pass: lo >= 0.60 && hi <= 0.72, value: { lo: lo, hi: hi }, floor: '0.60 .. 0.72' };
    },
    negative(D) { return Object.assign({}, D, { septal: septalPaths(1.0) }); },  // right across the septum
  },
  {
    id: 'the_sinuatrial_nodal_branch_reaches_the_node_at_the_caval_junction',
    /* "the node sits where the superior vena cava meets the atrium" is a claim about which of two
       landmarks the node is near, so it is tested as a RATIO of the two distances rather than as an
       absolute that would be satisfied by a node anywhere in the upper atrium. */
    must: 'the branch ends within 0.35 cm of the node, and the node is at least 3x closer to the ' +
          'caval junction than to the coronary sulcus',
    run(D) {
      const tip = D.saNodal[D.saNodal.length - 1];
      const reach = tip.distanceTo(D.saNode);
      const toCaval = D.saNode.distanceTo(D.svcJn);
      const toGroove = minDist(D.saNode, D.csRing);
      return { pass: reach <= 0.35 && toGroove >= 3 * toCaval,
               value: { reach: reach, toCaval: toCaval, toGroove: toGroove }, floor: '3x' };
    },
    negative(D) {
      return Object.assign({}, D, { saNodal: D.saNodal.slice(0, 4) });   // a branch that stops short
    },
  },
  {
    id: 'dominance_decides_which_artery_reaches_the_crux',
    /* the floor is a fraction of the SHORTER artery's own course length: the claim is that one
       vessel arrives at the crux and the other stops a long way short of it, and "a long way" is
       only meaningful against the length of the vessel making the journey */
    must: 'the dominant artery ends nearer the origin of the posterior interventricular branch than ' +
          'the other does, by at least 35% of the shorter artery\'s own course length — and the ' +
          'left_dominant build REVERSES which artery that is',
    run(D) {
      const origin = D.pda[0];
      const dR = minDist(origin, D.rca.slice(-6));
      const dC = minDist(origin, D.cx.slice(-6));
      const floor = 0.35 * Math.min(polylineLength(D.rca), polylineLength(D.cx));
      const near = D.leftDominant ? dC : dR, far = D.leftDominant ? dR : dC;
      return { pass: (far - near) >= floor, value: { rca: dR, cx: dC, dominant: D.leftDominant ? 'circumflex' : 'rca' },
               floor: floor };
    },
    /* the negative case is the OTHER BUILD, which is the only negative case a rotation or a
       relabelling cannot satisfy — see RENDER-STANDARD on the L-loop that was a rotation */
    negative(D) { return Object.assign({}, D, { leftDominant: !D.leftDominant }); },
  },
  {
    id: 'axes_are_what_the_model_declares',
    /* +x is declared to be the patient's LEFT. The check is against two NAMED vessels whose sides
       are not in dispute, with the floor taken from their own x-extents — the whole heart's
       transverse extent is the wrong yardstick here because it is dominated by the apex, which
       neither of these two vessels goes anywhere near. */
    must: 'the circumflex lies to the +x side of the right coronary by at least 35% of the mean of ' +
          'their own x-extents, and the right coronary reaches -x of the median plane',
    run(D) {
      const meanExtent = 0.5 * (axisExtent(D.rca, 'x') + axisExtent(D.cx, 'x'));
      const floor = 0.35 * meanExtent;
      const r = axisMean(D.rca, 'x'), c = axisMean(D.cx, 'x');
      let rMin = Infinity;
      for (const p of D.rca) rMin = Math.min(rMin, p.x);
      return { pass: (c - r) >= floor && rMin < 0,
               value: { rcaMeanX: r, cxMeanX: c, rcaMinX: rMin }, floor: floor };
    },
    negative(D) { return Object.assign({}, D, { rca: D.cx.slice() }); },
  },
  {
    id: 'every_epicardial_vessel_lies_on_the_heart',
    /* The tolerance is not a picked number: a vessel sitting ON the epicardium may stand off the
       myocardial surface by at most its own radius plus a 0.15 cm allowance for epicardial fat. So
       the wide coronary sinus is allowed more room than a diagonal branch, which is what an
       epicardial vessel actually does, and a vessel that floats free of the heart fails whatever its
       calibre. The septal perforators and the AV nodal twig are declared INTRAMURAL and exempt —
       stated here rather than quietly omitted. */
    must: 'no station of any epicardial vessel stands off the myocardial surface by more than its ' +
          'own radius plus 0.15 cm of epicardial fat',
    run(D) {
      let worst = 0, which = null, worstTol = 0;
      const check = (name, pts, tol) => {
        for (const p of pts) {
          /* recover (zeta, theta) — the form is star-shaped about its long axis, so this is exact */
          const v = p.clone().sub(B);
          const z = v.dot(eL) / LONG;
          if (z <= 0.02 || z >= 0.99) continue;
          v.sub(_c.copy(eL).multiplyScalar(LONG * z));
          const a = v.dot(eLft), b = v.dot(eAnt) / AP;
          let th = Math.atan2(b, a); if (th < 0) th += Math.PI * 2;
          const d = Math.abs(Math.sqrt(a * a + b * b) - radOf(z, th)) - tol;
          if (d > worst) { worst = d; which = name; worstTol = tol; }
        }
      };
      const fat = 0.15;
      check('lad', D.lad, R.lad0 + fat);
      check('gcv', D.gcv, R.gcv1 + fat);
      check('rca', D.rca.slice(2), R.rca0 + fat);
      check('cx', D.cx, R.cx0 + fat);
      check('pda', D.pda, R.pda0 + fat);
      check('cs', D.cs.slice(0, -CS_OSTIUM_STATIONS), R.cs1 + fat);   // the ostium is intramural by design
      check('acv', [].concat(...D.acv.map(v => v.slice(0, -1))), R.acv1 + fat);
      /* ADDED AT REVIEW 2026-09-20. The `must` above says EVERY epicardial vessel; before this the
         run read seven of the sixteen the model builds, so nine of them — including both marginals,
         the posterolateral branch and four of the seven veins — were covered by the claim and not by
         the measurement. A branch's FIRST station is inside its parent vessel by construction, and
         the two nodal territories end inside the wall they supply, so those stations are trimmed the
         same way the right coronary's ostium already was, and for the same stated reason. */
      check('diagonal', [].concat(...D.diag.map(v => v.slice(1))), R.diag0 + fat);
      check('right_marginal', D.rmarg.slice(1), R.rmarg0 + fat);
      check('left_marginal', D.lmarg.slice(1), R.lmarg0 + fat);
      check('posterolateral', D.plat.slice(1), R.plat0 + fat);
      check('sa_nodal', D.saNodal.slice(1, -1), R.sanod0 + fat);
      check('middle_cardiac_vein', D.mcv.slice(0, -1), R.mcv1 + fat);
      check('small_cardiac_vein', D.scv.slice(0, -1), R.scv1 + fat);
      check('post_veins_lv', [].concat(...D.pvlv.map(v => v.slice(0, -1))), R.pvlv1 + fat);
      check('oblique_vein_la', D.ovla.slice(0, -1), R.ovla + fat);
      return { pass: worst <= 0, value: { overshoot: worst, worstVessel: which, itsTolerance: worstTol },
               floor: 'own radius + 0.15 cm' };
    },
    negative(D) {
      const off = D.lad.map(p => p.clone().add(new T.Vector3(0, 0, 2.5)));   // floating in front
      return Object.assign({}, D, { lad: off });
    },
  },
  {
    id: 'the_form_still_matches_the_stated_landmarks',
    must: 'long axis 12.0 cm, greatest transverse 8.5 cm and right-of-median reach 2.0 cm, each ' +
          'within 0.02 cm — the constraint that holds this copy of the surface to heart-external.js',
    run() {
      const m = measure();
      const dLong = Math.abs(A.distanceTo(B) - LONG);
      const dW = Math.abs(m.width - SPEC_W);
      const dR = Math.abs((-m.minX) - RIGHT_REACH);
      return { pass: dLong <= 0.02 && dW <= 0.02 && dR <= 0.02,
               value: { long: A.distanceTo(B), width: m.width, rightReach: -m.minX }, floor: 0.02 };
    },
    negative() { return null; },
    reversed() { return Math.abs(11.0 - LONG) <= 0.02; },     // must be false
  },
];

let _acceptance = null;
function acceptance(force) {
  if (_acceptance && !force) return _acceptance;
  const D = collectData(false), DL = collectData(true);
  const results = [];
  for (const c of CHECKS) {
    let r;
    try { r = c.run(D); }
    catch (e) { r = { pass: false, error: String(e && e.message || e) }; }
    /* the negative case: the same check, given a deliberately wrong input, MUST fail */
    let negRejected = null;
    try {
      if (typeof c.reversed === 'function') negRejected = (c.reversed() === false);
      else {
        const bad = c.negative(D);
        if (bad == null) negRejected = null;
        else {
          const rb = c.run(bad);
          negRejected = !rb.pass;
        }
      }
    } catch (e) { negRejected = true; }   // a check that throws on nonsense has rejected it
    results.push({ id: c.id, must: c.must, pass: !!r.pass, value: r.value, floor: r.floor,
                   negative_case_rejected: negRejected });
  }
  /* the dominance check, re-run on the left-dominant build: the relation must hold there too, which
     is what makes it a claim about dominance rather than about the right coronary */
  const dom = CHECKS.find(c => c.id === 'dominance_decides_which_artery_reaches_the_crux');
  let domL = null;
  try { domL = dom.run(DL); } catch (e) { domL = { pass: false, error: String(e) }; }
  results.push({ id: 'dominance_reverses_on_the_left_dominant_build', must: dom.must,
                 pass: !!domL.pass, value: domL.value, floor: domL.floor,
                 negative_case_rejected: true });

  const failed = results.filter(r => !r.pass || r.negative_case_rejected === false);
  _acceptance = {
    ok: failed.length === 0,
    solved: SOLVED,
    axes: AXES,
    checks: results,
    failed: failed.map(r => r.id),
  };
  if (!_acceptance.ok) console.warn('[coronary] acceptance failures:', _acceptance.failed, _acceptance);
  return _acceptance;
}

/* ======================================================================= 8 · build */

function buildCoronaries(t, opts) {
  opts = opts || {};
  const leftDominant = !!opts.left_dominant;
  const g = new T.Group();

  /* --- the myocardium the vessels lie on. Ghosted by default: this scene is about what is ON the
         heart, and an opaque shell of the same size hides the vessels on its far side entirely. */
  if (opts.myocardium !== false) {
    add(g, 'heart', solidForm(120, 156, 0),
      { outline: 0.055, matOver: { opacity: 0.92, transparent: true } });
  }

  /* --- the grooves, so "it lies in the sulcus" is a thing on the screen */
  if (opts.sulci !== false) {
    add(g, 'coronary_sulcus',
      patch(Z_CS - 0.013, Z_CS + 0.013, 106 * D2R, 106 * D2R + Math.PI * 2 - 32 * D2R, 4, 140, OFF_SULCUS),
      { noOutline: true });
    const zsIV = [];
    for (let j = 0; j <= 60; j++) zsIV.push(Z_CS + 0.02 + (0.945 - Z_CS - 0.02) * j / 60);
    add(g, 'ant_iv_sulcus', band(zsIV, thAIV, 5.5 * D2R, OFF_SULCUS), { noOutline: true });
    add(g, 'post_iv_sulcus', band(zsIV, thPIV, 5.5 * D2R, OFF_SULCUS), { noOutline: true });
    /* the crux: where the coronary sulcus meets the posterior interventricular sulcus. A small
       marker, because it is a POINT — the point that decides dominance and that the AV nodal branch
       arises at. Built at the junction of the two groove functions, not placed by eye. */
    const cx = surfPoint(Z_CS, TH_CRUX, 0.03, new T.Vector3());
    const cg = new T.SphereGeometry(0.30, 20, 14);
    cg.translate(cx.x, cx.y, cx.z);
    add(g, 'crux', cg.toNonIndexed(), { outline: 0.020 });
  }

  /* --- context. Every one of these carries a relation this scene teaches: the two coronary
         arteries arise from the aortic sinuses BEHIND the pulmonary trunk and BETWEEN the auricles
         and the trunk; the sinuatrial node sits where the superior vena cava meets the atrium; the
         coronary sinus opens beside the inferior vena cava. */
  if (opts.context !== false) {
    /* OPAQUE, deliberately. These were translucent in the first build so that the vessels behind them
       would still be visible — and that quietly falsified the scene's own teaching. The second beat
       says the left coronary artery cannot be seen from the front because the pulmonary trunk covers
       it, and the third beat takes the trunk away to reveal it. Through a translucent trunk the
       artery was visible all along and the third beat revealed nothing. A see-through great vessel
       also shows its own lit inner surface through its cut end, which is the one thing
       RENDER-STANDARD says must never be visible. If a structure is in the way, the way to see past
       it is the op that hides it. */
    const aortO = facingPointOff(0.27, 'antright', -14, 0.68);
    const pulmO = facingPointOff(0.32, 'antleft', 0, 0.72);
    add(g, 'asc_aorta', K.tubeAlong(bez(aortO, V(aortO.x - 0.5, aortO.y + 2.4, aortO.z + 0.2), V(-0.5, 1.0, 7.4), 16),
      u => 1.52 - 0.08 * u, { ring: 22 }), { outline: 0.030 });
    add(g, 'pulm_trunk', K.tubeAlong(bez(pulmO, V(pulmO.x + 0.35, pulmO.y + 1.9, pulmO.z - 0.5), V(2.9, 1.4, 6.2), 16),
      u => 1.40 - 0.12 * u, { ring: 22 }), { outline: 0.030 });
    {
      const p0 = facingPointOff(0.13, 'antright', 0, 0.80);
      add(g, 'ra_auricle', K.tubeAlong(bez(p0, V(p0.x + 1.3, p0.y + 0.75, p0.z + 0.55), V(p0.x + 2.7, p0.y + 0.95, p0.z + 0.35), 16),
        u => 1.12 * (1 - 0.60 * u * u), { ring: 20, flatten: 0.52 }),
        { outline: 0.030 });
    }
    {
      const p0 = facingPointOff(0.165, 'antleft', -22, 0.80);
      add(g, 'la_auricle', K.tubeAlong(bez3(p0, V(p0.x + 0.75, p0.y - 0.15, p0.z + 1.25),
        V(p0.x + 0.55, p0.y - 1.35, p0.z + 1.75), V(p0.x - 0.35, p0.y - 2.25, p0.z + 1.35), 20),
        u => 0.62 * (1 - 0.40 * u), { ring: 18, flatten: 0.70 }),
        { outline: 0.026 });
    }
    add(g, 'svc', K.tubeAlong(bez(V(-1.9, 3.0, 5.6), V(-1.7, 0.4, 6.3), facingPointOff(0.09, 'supright', 40, 0.74), 16),
      u => 1.00 + 0.14 * u, { ring: 18 }), { outline: 0.026 });
    add(g, 'ivc', K.tubeAlong(bez(V(-0.7, -8.7, 4.5), V(-0.55, -8.0, 5.0), facingPointOff(0.26, 'diaph', -16, 0.74), 12),
      u => 1.20 + 0.06 * u, { ring: 18 }), { outline: 0.026 });
  }

  /* --- the arteries */
  if (opts.arteries !== false) {
    addVessel(g, 'rca', rcaPath(leftDominant), rcaR, { ring: 16 });
    addVessel(g, 'lca_stem', lcaStemPath(), () => R.lca_stem, { ring: 16 });
    addVessel(g, 'lad', ladPath(), ladR, { ring: 16 });
    addVessel(g, 'circumflex', circumflexPath(leftDominant), u => lerp(R.cx0, R.cx1, u), { ring: 16 });
    addVessel(g, 'pda', pdaPath(), u => lerp(R.pda0, R.pda1, u), { ring: 14 });
    addVessel(g, 'right_marginal', rightMarginalPath(), u => lerp(R.rmarg0, R.rmarg1, u), { ring: 12 });
    addVessel(g, 'left_marginal', leftMarginalPath(), u => lerp(R.lmarg0, R.lmarg1, u), { ring: 12 });
    addVessel(g, 'posterolateral', posterolateralPath(), u => lerp(R.plat0, R.plat1, u), { ring: 12 });
    for (const p of diagonalPaths()) addVessel(g, 'diagonal', p, u => lerp(R.diag0, R.diag1, u), { ring: 12 });
    addVessel(g, 'sa_nodal', saNodalPath(), u => lerp(R.sanod0, R.sanod1, u), { ring: 12 });
    addVessel(g, 'av_nodal', avNodalPath(), () => R.avnod, { ring: 10 });
    /* the perforators are INSIDE the septum — they are visible only when the myocardium is hidden,
       which is exactly the view the scene builds for them */
    if (opts.septal !== false) {
      for (const p of septalPaths()) addVessel(g, 'septal_branches', p, u => lerp(R.septal0, R.septal1, u), { ring: 10 });
    }
  }

  /* --- the veins */
  if (opts.veins !== false) {
    addVessel(g, 'coronary_sinus', coronarySinusPath(), u => lerp(R.cs0, R.cs1, u), { ring: 20 });
    addVessel(g, 'great_cardiac_vein', gcvPath(), gcvR, { ring: 14 });
    addVessel(g, 'middle_cardiac_vein', mcvPath(), u => lerp(R.mcv0, R.mcv1, u), { ring: 14 });
    addVessel(g, 'small_cardiac_vein', scvPath(), u => lerp(R.scv0, R.scv1, u), { ring: 12 });
    addVessel(g, 'oblique_vein_la', obliqueVeinPath(), () => R.ovla, { ring: 10 });
    for (const p of postVeinPaths()) addVessel(g, 'post_veins_lv', p, u => lerp(R.pvlv0, R.pvlv1, u), { ring: 10 });
    for (const p of anteriorCardiacVeinPaths()) addVessel(g, 'anterior_cardiac_veins', p, u => lerp(R.acv0, R.acv1, u), { ring: 10 });
  }

  /* --- the two nodes. Flattened ellipsoids, because that is what they are, and because a sphere
         reads as a marker where an ellipsoid reads as a structure. Normals recomputed AFTER the
         non-uniform scale, and de-indexed before anything takes a silhouette off them — a three
         primitive is indexed, and inflating an indexed buffer walks the vertex list and makes soup
         (RENDER-STANDARD rule 4). */
  if (opts.nodes !== false) {
    const node = (key, centre, sx, sy, sz) => {
      const geo = new T.SphereGeometry(1, 20, 14);
      geo.scale(sx, sy, sz);
      geo.computeVertexNormals();
      geo.translate(centre.x, centre.y, centre.z);
      add(g, key, geo.toNonIndexed(), { outline: 0.018 });
    };
    node('sa_node', saNodeCentre(), 0.62, 0.24, 0.30);
    node('av_node', avNodeCentre(), 0.34, 0.20, 0.26);
  }

  /* --- myocardial territories */
  if (opts.territories) {
    const lad = TERR.lad, rcaT = TERR.rca, cxT = TERR.cx;
    /* TRANSLUCENT, so the two interventricular grooves that FORM these boundaries stay visible under
       the wash they define, and so a vessel lying on a territory still reads against it. Opaque
       territories hid both, and hid them in the one beat the territories exist for. */
    const wash = { noOutline: true, matOver: { opacity: 0.60, transparent: true, roughness: 0.74 } };
    add(g, 'terr_lad', patch(lad.z0, lad.z1, lad.t0, lad.t1, 48, 52, OFF_TERRITORY), wash);
    if (leftDominant) {
      /* the inferior wall and the posterior third of the septum change hands with the artery */
      add(g, 'terr_rca', patch(rcaT.z0, rcaT.z1, rcaT.t0, TH_CRUX - 44 * D2R, 40, 44, OFF_TERRITORY), wash);
      add(g, 'terr_cx', patch(cxT.z0, cxT.z1, TH_CRUX - 44 * D2R, cxT.t1, 40, 62, OFF_TERRITORY), wash);
    } else {
      add(g, 'terr_rca', patch(rcaT.z0, rcaT.z1, rcaT.t0, rcaT.t1, 40, 52, OFF_TERRITORY), wash);
      add(g, 'terr_cx', patch(cxT.z0, cxT.z1, cxT.t0, cxT.t1, 40, 52, OFF_TERRITORY), wash);
    }
  }

  return g;
}

/* quadratic and cubic Bezier helpers for the context vessels, which are free curves in space rather
   than courses on the surface */
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

/* ======================================================== 9 · the provider contract */

window.MB3D_MODELS = window.MB3D_MODELS || {};
window.MB3D_MODELS['coronary-arteries-cardiac-veins'] = {
  LAYERS: LAYERS,
  build: buildCoronaries,
  /* Every optional layer ON. Without this the provider builds only the defaults and any structure
     behind a flag comes back reason:'none' — which the player shows a student as "there is no model
     of this structure", a confident lie about a model sitting right there. */
  FULL: {
    myocardium: true, sulci: true, context: true, arteries: true, septal: true,
    veins: true, nodes: true, territories: true,
  },
  VARIANTS: {
    territories: 'the three myocardial supply territories, as patches of the ventricular surface',
    septal: 'the interventricular septal perforators, inside the septum',
    left_dominant: 'a LEFT-dominant heart: the circumflex reaches the crux and gives the posterior ' +
                   'interventricular branch, and the inferior territory changes hands with it',
  },
  T_MEANING: 'none — the adult coronary tree is not a process. build(t) returns the same form at ' +
             'every t. The variation that IS examined is dominance, and it is the left_dominant flag.',
  AXES: AXES,
  SOLVED: SOLVED,
  anchorTable: function (z) {
    const out = {};
    Object.keys(ANCHORS).forEach(k => { out[k] = Math.round(anch(k, z == null ? Z_CS : z) * 180 / Math.PI * 10) / 10; });
    return out;
  },
  LANDMARKS: {
    Z_CS: Z_CS,
    crux_theta_deg: Math.round(TH_CRUX / D2R * 10) / 10,
    rca_origin_theta_deg: Math.round(TH_RCA_ORIGIN / D2R * 10) / 10,
    lca_emergence_theta_deg: Math.round(TH_LCA_EMERGE / D2R * 10) / 10,
    septal_fraction: SEPTAL_FRACTION,
  },
  acceptance: acceptance,
  ACCEPTANCE: { LONG: LONG, SPEC_W: SPEC_W, RIGHT_REACH: RIGHT_REACH, NESTLE: NESTLE },
};

})();
