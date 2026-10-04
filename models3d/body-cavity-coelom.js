/* MedBank · the body cavity (coelom) and its partitioning — PRODUCTION procedural model.
 *
 * Registers MB3D_MODELS['body-cavity-coelom']: LAYERS, build(t, opts) -> THREE.Group whose meshes
 * carry userData.key, and FULL so every benign optional layer is resolvable.
 *
 * WRAPPED IN AN IIFE. Only the registration escapes. RENDER-STANDARD: a model written at top level
 * puts T, K, C, LAYERS and every constant into global lexical scope and the NEXT model to load dies
 * on "Identifier 'T' has already been declared", taking the page with it.
 *
 * WHAT t MEANS. t = 0 is WEEK 3: one horseshoe-shaped intraembryonic coelom in the lateral plate
 * mesoderm, open on each side to the extraembryonic coelom, with no partition anywhere in it.
 * t = 1 is about WEEK 8: three separate serous cavities — one pericardial, two pleural that do not
 * communicate with each other, one peritoneal — closed off by four partitions, with the diaphragm
 * complete and descended to the first lumbar level. The scene's narration gives week 3, week 4,
 * week 5, "about week seven" and "by week eight", and the stage table below places each at its own t.
 *
 * AXES. +x = embryo's LEFT, -x = RIGHT, +y = CRANIAL, +z = VENTRAL.
 *
 *   PROVED BY ROUTE (b) OF RENDER-STANDARD'S "A DECLARED AXIS IS NOT A PROVED ONE". This model has
 *   genuine chiral content — the right pericardioperitoneal canal closes BEFORE the left, which is
 *   the whole reason the common congenital diaphragmatic hernia is left-sided — but that content is
 *   built FROM this declaration, so asserting it would be circular, exactly as acceptance row I was
 *   on lateral-folding. What is not circular is the corpus check: this AXES object and the prose
 *   string in ACCEPTANCE.axes are asserted, by the render harness, to agree with
 *   models3d/lateral-folding.js, whose convention IS measured off BodyParts3D right/left pairs by
 *   viz-training/tools/prove-corpus-axes.mjs. Flip a sign here and that comparison fails.
 *
 *   NOTE A STANDING CORPUS DISAGREEMENT, found this run and logged rather than silently picked.
 *   model3d-scene-spec-v2.md's CROSS_SECTION section states the corpus frame is LPS — "+X left,
 *   +Y posterior, +Z superior" — and gives axial = z. Every PROCEDURAL model in the corpus, and
 *   viz3d.js's own VIEW_DIR table (superior = [0, 1, 0.001]), instead treat +y as cranial and +z as
 *   ventral. The two agree only on +x = left. So in THIS model a transverse (axial) cut is normal to
 *   y, not to z, and every CROSS_SECTION beat says so in its narration, which is what the spec's own
 *   escape clause for a pre-folding embryo asks for. See the scene's gaps[] and BUILD-LOG.
 *
 * THE MECHANISM, AND WHAT IS SOLVED RATHER THAN TUNED.
 *
 *   The coelom is ONE cavity that becomes FOUR. Everything this scene teaches is a consequence of
 *   that one topological event happening in a particular order, so the model is built as four
 *   CAVITY CASTS lying along one continuous horseshoe path, which OVERLAP while their waist is open
 *   and are SEPARATED by a partition once it has closed. The named boundaries sit at the waists —
 *   RENDER-STANDARD, "SEGMENT BOUNDARIES BELONG AT THE WAISTS" — because the waists are where the
 *   partitions really insert: the pleuropericardial membranes at the cranial waist, the
 *   pleuroperitoneal membranes at the caudal one.
 *
 *   TWO THINGS ARE SOLVED, and they are the two a student is marked wrong for.
 *
 *   1. THE PLEUROPERITONEAL FLAP CLOSES ITS CANAL, AND FUSES WITHOUT A CREASE.  The membrane is not
 *      new tissue: it is body wall, peeled inward as the lung excavates behind it, so its ARC LENGTH
 *      IS FIXED and what changes is curvature. Two conditions have to hold at closure — the free
 *      edge must land exactly on the dorsal mesentery of the oesophagus, and the flap must leave the
 *      body wall TANGENTIALLY, because it is continuous with it and a crease at its root would read
 *      as a flap stuck on. Two conditions, two unknowns: the curvature amplitude lam* and the share
 *      of that curvature held at the hinge a*. Both are solved by bisection at module load, printed
 *      by acceptance(), and re-measured on real mesh vertices by the render harness. A tuned
 *      amplitude would drift out of agreement with the canal the moment the canal changed size; and
 *      the residual of this solve IS the defect size, which is why the Bochdalek variant is the same
 *      solve stopped short rather than a hole cut somewhere plausible.
 *
 *   2. THE PHRENIC NERVE'S PATH, AS A SHORTEST PATH FROM A FIXED ORIGIN TO A DESCENDING TARGET.
 *      The exam fact is "C3, C4 and C5 keep the diaphragm alive", and the reason is geometric: the
 *      nerve's ORIGIN never moves while its TARGET descends from the cervical region to L1. So the
 *      nerve is solved, not drawn: at every t it is the shortest path from the fixed C3-C5 roots to
 *      the central tendon that stays OUTSIDE the pericardial sac — which is why it ends up lying on
 *      the fibrous pericardium, which is why it is carried in the pleuropericardial membrane. Solved
 *      by relaxation with re-projection, to a reported residual. Its LENGTH is then a measured
 *      consequence of the descent rather than a number anybody chose, and acceptance asserts the
 *      lengthening against the descent itself.
 *
 * WHAT IS *NOT* SOLVED, said here rather than left to be discovered:
 *   - THE FOLDING. The head fold swings the pericardial cavity caudally and the lateral folds pinch
 *     the coelom off from the extraembryonic cavity; both are PRESCRIBED here. They have their own
 *     scenes (cranio-caudal-folding, lateral-folding), this scene's gaps[] has always said it starts
 *     from the sealed cavity, and covers[] claims neither. Beat 2 narrates folding as context.
 *   - the closure SCHEDULE — which t each partition closes at — is prescribed, from the weeks the
 *     narration gives. What is solved is the GEOMETRY of the closure, not its timetable. The one
 *     thing the schedule asserts is the ORDER, right before left, and that is measured as a
 *     component count and not as a caption.
 *   - the descent of the diaphragm is a prescribed ramp between two MEASURED levels (the C3-C5 band
 *     and L1, read off the model's own vertebral scale); the nerve's response to it is solved.
 *   - the viscera — heart, lungs, liver, gut, oesophagus — are prescribed context so that each
 *     cavity has something in it. They are not examinable geometry here and say so in gaps[].
 *
 * GEOMETRY NOTE. Every cavity cast is a CLOSED SOLID with rounded terminal ends (K.tubeCapped with
 * cap:'both'), because the central probe in this model is a parity test — is this voxel inside the
 * cast — and parity is only meaningful on a watertight solid. Parity is taken PER KEY and unioned
 * afterwards, never over all four at once: a point inside two overlapping casts has an even crossing
 * count and a single parity scan would read it as outside, which is the one voxel that decides
 * whether two cavities are reported as connected.
 */
(function () {

const T = window.THREE;
const K = window.VizKit;   // render-kit.js must load first — it owns winding, normals and colour
const C = K.C;

/* THE AXIS CONVENTION, MACHINE-READABLE, so a tool checks it rather than a reader. The harness
   requires this object AND the prose in ACCEPTANCE.axes to agree with each other and with
   lateral-folding's, which is the mesh-anchored one. Two forms that can disagree is the failure. */
const AXES = { right: '-x', left: '+x', cranial: '+y', caudal: '-y', ventral: '+z', dorsal: '-z',
               units: 'model units on a vertebral scale (SEG per segment) — NOT anatomical mm',
               proved_by: 'corpus check against models3d/lateral-folding.js (route b), which is ' +
                          'proved against BodyParts3D right/left pairs by tools/prove-corpus-axes.mjs' };

/* COPIED FROM viz3d.js's VIEW_DIR TABLE, not restated. RENDER-STANDARD 3.y: a beat that narrates a
   shape asserts it on the SCREEN PLANE OF THE CAMERA THAT BEAT ROTATES TO, and the model's table is
   copied so the player's cameras and the probe's cannot drift apart. The 0.001 on the poles is
   viz3d's, kept verbatim for the same reason. */
const VIEW_DIR = {
  anterior: [0, 0, 1], posterior: [0, 0, -1], lateral: [1, 0, 0], medial: [-1, 0, 0],
  superior: [0, 1, 0.001], inferior: [0, -1, 0.001]
};

const LAYERS = {
  /* the cavity itself — the subject of this scene */
  pericardial:  { color: 0x2874a6, name: 'Pericardial cavity' },
  pleural_r:    { color: 0x117864, name: 'Right pleural cavity (pericardioperitoneal canal)' },
  pleural_l:    { color: 0x14a085, name: 'Left pleural cavity (pericardioperitoneal canal)' },
  peritoneal:   { color: 0x7d3c98, name: 'Peritoneal cavity' },
  /* the two linings every serous cavity has, because the cavity was carved out of one split sheet */
  somatic:      { color: 0x2f5f9e, name: 'Somatic (parietal) mesoderm — parietal layer' },
  splanchnic:   { color: 0x179473, name: 'Splanchnic (visceral) mesoderm — visceral layer' },
  ectoderm:     { color: 0x2f7fc4, name: 'Ectoderm' },
  endoderm:     { color: 0xb8b33c, name: 'Endoderm' },
  body_wall:    { color: 0x9aa7b4, name: 'Body wall' },
  /* The partitioning of the coelom, in the order it happens, AND the diaphragm's four sources.
     These are two different quartets and the scene used to call both of them 'four' (review
     finding 3, 2026-10-01). Partitions of the coelom: septum transversum, pleuropericardial,
     pleuroperitoneal. Sources of the DIAPHRAGM, which is what the scene now numbers 1-4 and
     what the four hernias map onto: septum transversum (central tendon), pleuroperitoneal,
     crura, muscular rim. The pleuropericardial membrane is in the first list and not the
     second -- it becomes the fibrous pericardium and gives the diaphragm nothing. */
  septum_transversum: { color: 0xc0392b, name: 'Septum transversum → central tendon' },
  pleuropericardial:  { color: 0xe74c3c, name: 'Pleuropericardial membrane → fibrous pericardium' },
  pleuroperitoneal:   { color: 0xec7063, name: 'Pleuroperitoneal membrane' },
  muscular_rim:       { color: 0xf5b041, name: 'Muscular rim from the body wall' },
  crura:              { color: 0xe59866, name: 'Crura, from the dorsal mesentery of the oesophagus' },
  /* the nerve, and the landmark that fixes its origin */
  phrenic:      { color: 0xf4d03f, name: 'Phrenic nerve' },
  cardinal:     { color: 0x5499c7, name: 'Common cardinal vein' },
  somites:      { color: 0x6b4fa8, name: 'Cervical somites C3–C5' },
  /* context: something for each cavity to contain */
  heart:        { color: 0xb03a2e, name: 'Heart' },
  lung_r:       { color: 0xd98880, name: 'Right lung bud' },
  lung_l:       { color: 0xd98880, name: 'Left lung bud' },
  liver:        { color: 0x8e5b3a, name: 'Liver' },
  gut:          { color: 0xc49a6c, name: 'Gut tube' },
  oesophagus:   { color: 0xcbb17a, name: 'Oesophagus' },
  dorsal_mesentery: { color: 0x9b8ec4, name: 'Dorsal mesentery' },
  ventral_mesentery:{ color: 0xaf7ac5, name: 'Ventral mesentery' },
  /* the lesions: VARIANTS, never in FULL */
  bochdalek:    { color: 0xcb4335, name: 'Bochdalek hernia — posterolateral, left' },
  morgagni:     { color: 0xe74c3c, name: 'Morgagni hernia — retrosternal, right' },
};

/* ------------------------------------------------------------------ the scale

   A VERTEBRAL SCALE, so "C3, C4 and C5" and "the first lumbar vertebra" are MEASURED positions and
   not captions. One segment is SEG model units; C1 sits at Y_C1 and every segment below it is one
   SEG lower. The model is NOT in anatomical mm and says so in AXES.units and in the scene's gaps[],
   but it IS internally consistent, which is what the two claims need: acceptance asserts that the
   septum transversum starts inside the C3-C5 band and finishes at L1, by reading this table rather
   than by trusting the ramp's endpoints. */
const SEG = 0.22, Y_C1 = 3.20;
const SPINE = (() => {
  const names = [], y = {};
  for (let i = 1; i <= 7; i++) names.push('C' + i);
  for (let i = 1; i <= 12; i++) names.push('T' + i);
  for (let i = 1; i <= 5; i++) names.push('L' + i);
  names.forEach((n, i) => { y[n] = Y_C1 - SEG * i; });
  return { names, y };
})();
const LEV = n => SPINE.y[n];

/* ------------------------------------------------------------------ constants */

const XL    = 0.68;    // how far from the midline each limb of the horseshoe runs
const R_PERI0 = 0.26, R_PERI1 = 0.44;   // the pericardial cavity's calibre, week 3 -> week 8
const R_PLEU0 = 0.19, R_PLEU1 = 0.46;   // the canal's calibre -> the pleural cavity's, as the lung grows
const R_PERIT0= 0.22, R_PERIT1= 0.40;   // the peritoneal cavity's
const Z_PERI0 = 0.46, Z_PERI1 = 0.30;   // the bend's ventral offset
const Z_LIMB  = -0.30;                  // the limbs run DORSOLATERAL: that is where the canals are
const Z_CAUD  = 0.52;                   // ...and cross back ventrally, in front of the gut
const XPERIT  = 0.86;                   // the peritoneal cavity is the widest part of the coelom

const Y_PERI0 = 3.02, Y_PERI1 =  0.34;  // the bend's y: cranial to the head at week 3, mid-thorax later
const Y_CAUD  = -1.96;                  // the caudal end of the limbs
const T_CROSS = 0.14;                   // when the two limbs become confluent ventral to the gut

/* the waists, as positions along the horseshoe's own arc length, measured from the cranial midline */
const S_PP = 0.195, S_PT = 0.495;       // in |v|, converted to arc length at build time
const OVERLAP = 0.11;                   // how far two casts overlap while their waist is OPEN
const PART_GAP = 0.15;                  // ...and how far apart they sit once the partition has closed

/* the closure timetable. PRESCRIBED, from the weeks the narration gives; what it asserts is the
   ORDER, and the order is measured as a component count. */
const T_SEAL   = [0.00, 0.16];          // the lateral openings to the extraembryonic coelom
const T_PP     = [0.26, 0.50];          // pleuropericardial membranes -> pericardium walled off
const T_PT_R   = [0.54, 0.80];          // right pleuroperitoneal membrane  (closes FIRST)
const T_PT_L   = [0.54, 1.00];          // left pleuroperitoneal membrane   (closes LAST)

/* when each structure first exists. DECLARED, because an absence is a fact a scene author needs and
   a render will not show: a part that quietly built nothing reaches a student through the adapter as
   "there is no model of this structure", which is a lie about the corpus rather than about the week.
   The harness asserts this table against the real adapter. */
const FIRST_T = {
  septum_transversum: 0.10, pleuropericardial: 0.26, pleuroperitoneal: 0.54,
  muscular_rim: 0.70, crura: 0.70, phrenic: 0.10, cardinal: 0.26,
  lung_r: 0.30, lung_l: 0.30, liver: 0.18,
  dorsal_mesentery: 0.14, ventral_mesentery: 0.14,
};

const Y_DIA0 = 0.5 * (LEV('C3') + LEV('C5'));   // the septum transversum forms opposite C3-C5
const Y_DIA1 = LEV('L1');                        // and ends up at L1
const DESCENT = Y_DIA0 - Y_DIA1;

const WX = 1.38, WZ = 1.10;   // the body wall's transverse half-width and half-depth
const WALL_H = 0.090;         // ...and its thickness

/* THE DOME'S RIM IS THE WALL'S INNER FACE, to the wall's own half-thickness, because the diaphragm
   is ATTACHED to the body wall round its whole costal margin — that contact is the anatomy and the
   muscular rim grows in from exactly there. The first version had the dome WIDER than the wall's
   inner face and the diaphragm's rim passed through the body wall; the 3.z containment audit is what
   said so, on a pair nobody would have thought to look at. */
const A_DIA = WX - WALL_H / 2, B_DIA = WZ - WALL_H / 2, H_DIA = 0.50;
const TH_SEPT = 0.17, TH_TENDON = 0.075;         // the septum transversum is THICK; the tendon is not
const TH_MEMB = 0.055;                           // a membrane
const RHO_CT = 0.46;                             // the central tendon's share of the dome radius
const RHO_M  = 0.80;                             // the costal muscle's inward front
/* WHERE THE CANAL CROSSES THE DIAPHRAGM, derived from the horseshoe rather than chosen: the limb's
   own (x, z) at the caudal waist, converted to the dome's radial coordinate. Both have to be read
   from the same two constants or the cast would pass through solid membrane. */
const RHO_CANAL = Math.hypot(XL / A_DIA, Z_LIMB / B_DIA);
const TH_LEAF_SECTOR = 0.68;                     // each pleuroperitoneal leaf's angular half-span, rad
const PHI_CR = 0.55;                             // the crura's angular half-width, dorsal median
const R_OES  = 0.13;                             // the oesophagus
/* THE HIATUS IS WIDER THAN THE OESOPHAGUS, and the first version's was not: at a half-angle of 0.17
   the gap between the crura was 0.22 across and the oesophagus 0.30, so 9.5% of the crura's vertices
   were INSIDE it. Row K measured a positive surface-to-surface clearance at the same time, because it
   samples pairs of vertices and the crossing was between samples — which is the lesson: a minimum
   distance taken over a subsample is an upper bound on nothing. The containment probe found it. */
const HIATUS_HALF = 0.30;                        // the gap left between the two crura, as a half-angle

/* ---------------------------------------------------------------- small helpers */
const cl01 = v => (v < 0 ? 0 : (v > 1 ? 1 : v));
const ease = v => { const u = cl01(v); return u * u * (3 - 2 * u); };
const lerp = (a, b, u) => a + (b - a) * u;
/** a schedule that is 1 before `from`, 0 after `to`, smooth between: an OPENING closing. */
const openFrac = (t, span) => 1 - ease((t - span[0]) / (span[1] - span[0]));

/* ------------------------------------------------------- the horseshoe, as one path

   v runs from -1 (the caudal midline, approached up the RIGHT limb) through 0 (the cranial midline,
   in the middle of the bend) to +1 (the caudal midline again, from the LEFT). s = |v| is therefore
   distance-along-the-horseshoe from the bend, and sg = sign(v) is the SIDE: sg < 0 is the embryo's
   right. Every cast, every waist and every partition is placed on this one parameter, which is what
   makes the four cavities four samples of one shape rather than four drawings.

   AT s = 1 THE TWO LIMBS MEET, or do not. The last term puts each limb's caudal end at x = -sg*hx:
   with hx > 0 each end crosses the midline and the two limbs OVERLAP by 2*hx, which is the ventral
   confluence that makes the peritoneal cavity ONE cavity; with hx < 0 they stop short of each other
   and the horseshoe is still an open U, which is what it is in week 3. hx is a function of t and
   nothing else, so the confluence appears smoothly and the model never jumps between two shapes. */

const Y_PERI = t => lerp(Y_PERI0, Y_PERI1, ease(t));
const R_PERI = t => lerp(R_PERI0, R_PERI1, ease(t));
const R_PLEU = t => lerp(R_PLEU0, R_PLEU1, ease(Math.max(0, (t - 0.22) / 0.78)));
const R_PERIT = t => lerp(R_PERIT0, R_PERIT1, ease(t));
const Z_PERI = t => lerp(Z_PERI0, Z_PERI1, ease(t));
const CROSS_GAP = 0.22;
/** how far each caudal limb-end crosses (+) or falls short of (-) the midline */
const crossHalf = t => 0.5 * (OVERLAP * ease((t - 0.02) / (T_CROSS - 0.02)) -
                              CROSS_GAP * (1 - ease((t - 0.02) / (T_CROSS - 0.02))));

function pathAt(v, t) {
  const s = Math.abs(v), sg = v < 0 ? -1 : 1;
  const caudal = ease((s - 0.70) / 0.30);
  const hx = crossHalf(t);
  const xm = XL * ease(s / 0.30) + (XPERIT - XL) * ease((s - 0.52) / 0.24);
  const x = sg * xm * (1 - caudal) - sg * hx * caudal;
  /* THE CAUDAL WAIST SITS ON THE DIAPHRAGM, to the last digit, because that is what makes the
     pericardioperitoneal canal a hole THROUGH the partition rather than a tube near it. y is
     therefore ramped in two pieces pinned at Y_WAIST, which is read off the dome's own surface at
     the canal's own radius — the same two constants that gave RHO_CANAL. */
  const yw = Y_DIA(t) + H_DIA * (1 - RHO_CANAL * RHO_CANAL);
  /* THE RAMPS MUST NOT BOTH FLATTEN AT THE JOIN, and the first version's did.
     With ease() on both pieces, dy/ds is zero AT s = S_PT — and dx/ds and dz/ds are zero there too,
     because both have already saturated — so the centreline STALLED at the caudal waist. Nothing
     looked wrong: the path was smooth and monotone. What broke was everything measured through it,
     because a world-unit offset converted to a v-offset by dividing through |dP/ds| became a
     division by ~0, the cast boundaries landed on the far side of the embryo, and the peritoneal
     cast collapsed to a disc. So: E1 is flat at its START (the pericardial bend is a plateau) and
     steep at its end; E2 is steep at its start and flat at its end. Slopes at the join: -5.39
     against -4.89, a 10% kink at a waist that is pinched anyway. And the arc-length conversion
     below no longer divides by anything. */
  const E1 = u => { const c = cl01(u); return c * c; };
  const E2 = u => { const c = cl01(u); return 1 - (1 - c) * (1 - c); };
  const y = s <= S_PT ? lerp(Y_PERI(t), yw, E1((s - 0.10) / (S_PT - 0.10)))
                      : lerp(yw, Y_CAUD, E2((s - S_PT) / (1 - S_PT)));
  const z = lerp(Z_PERI(t), Z_LIMB, ease(s / 0.40)) + (Z_CAUD - Z_LIMB) * caudal;
  return new T.Vector3(x, y, z);
}

/** |dP/ds|, measured from the path itself. Kept for reporting; NOT used to place anything — see
    arcOffset, and the note in pathAt about why dividing by this was a bug. */
function speedAt(v, t) {
  const h = 0.01, a = pathAt(v - h, t), b = pathAt(v + h, t);
  return a.distanceTo(b) / (2 * h);
}

/** THE SIGNED v-OFFSET THAT WALKS `e` WORLD UNITS ALONG THE PATH FROM s = sw, on the +s side.
    e > 0 walks away from the bend, e < 0 back toward it. Integrated step by step rather than divided
    through a derivative, so a place where the centreline momentarily stalls costs accuracy and
    never correctness. */
function arcOffset(sw, e, t) {
  if (Math.abs(e) < 1e-12) return 0;
  const dir = e > 0 ? 1 : -1, want = Math.abs(e), dv = 0.0015;
  let v = sw, acc = 0, prev = pathAt(v, t);
  for (let i = 0; i < 2000; i++) {
    const nv = v + dir * dv;
    if (nv < -1.3 || nv > 1.3) break;
    const p = pathAt(nv, t), d = prev.distanceTo(p);
    if (acc + d >= want) return (nv - sw) - dir * dv * (acc + d - want) / Math.max(d, 1e-12);
    acc += d; v = nv; prev = p;
  }
  return v - sw;
}

/** the calibre along the horseshoe: three segments with a WAIST between each pair. The waists are
    where the partitions insert, which is why the cast boundaries are there too — RENDER-STANDARD,
    "SEGMENT BOUNDARIES BELONG AT THE WAISTS". */
/* THE WAIST IS NOT A CREASE. At a half-width of 0.045 in s the calibre halved between adjacent
   rings of a 40-step tube, and the swept surface's FACE normals disagreed with its own VERTEX
   normals on 6% of its triangles - the winding check reported 0.939 where it wants 0.999. Nothing
   looked wrong; the surface is smooth and its normals are self-consistent. What was wrong was the
   sampling, and the fix is to make the waist a waist rather than a step. */
const WAIST_F = 0.62, WAIST_W = 0.090;
function pinch(s, c, w, f) { const u = (s - c) / w; return 1 - (1 - f) * Math.exp(-u * u); }
function rOf(v, t) {
  const s = Math.abs(v);
  const base = R_PERI(t)
    + (R_PLEU(t) - R_PERI(t)) * ease((s - (S_PP - 0.07)) / 0.14)
    + (R_PERIT(t) - R_PLEU(t)) * ease((s - (S_PT - 0.07)) / 0.14);
  return base * pinch(s, S_PP, WAIST_W, WAIST_F) * pinch(s, S_PT, WAIST_W, WAIST_F);
}

/* ------------------------------------------------- where each cast begins and ends

   A waist that is OPEN lets the two casts either side of it overlap by OVERLAP; a waist that has
   CLOSED holds them PART_GAP apart, and the partition sits in the gap. One signed number does both,
   so there is no branch and no discontinuity: e > 0 is an overlap, e < 0 is a gap. Converted from
   world units to v at the waist's own speed. */
function edges(t) {
  /* the CRANIAL waist is closed by the pleuropericardial membranes on a prescribed schedule — they
     fuse in the midline and nothing in this model solves that. The two CAUDAL waists are closed by
     the SOLVED pleuroperitoneal flap: canalOpen() reads the free edge's radius off the solve. */
  const wPP = openFrac(t, T_PP), wR = canalOpen('r', t), wL = canalOpen('l', t);
  const e = w => 0.5 * (OVERLAP * w - PART_GAP * (1 - w));
  /* the dome cap stands CAP_BULGE * r proud of the ring, so the ring retreats by that much and the
     TIP lands where e() says. See castOf's note. */
  const rPP = rOf(S_PP, t), rPT = rOf(S_PT, t);
  /* THE CAP IS PROUD BY bulge * r AT ITS OWN RING, AND THE TWO CASTS EITHER SIDE OF A WAIST HAVE
     THEIR RINGS AT DIFFERENT RADII. Taking one radius for both left the tips unequal: the pleural
     cast's landed exactly where the schedule said and the peritoneal cast's 0.016 short, because the
     calibre grows across the caudal waist (R_PLEU 0.234 to R_PERIT 0.290 at t = 0.42) and the
     peritoneal cast's ring sits on the SMALLER side of it. So each side settles against the radius at
     its OWN ring. The whole chain was found by one number: row N measured on the mesh read 0.289
     against the schedule's 0.339, and the 15% was entirely this.

     `up` is the cast whose ring lies at larger s, `dn` the one at smaller s. A positive e is an
     overlap and a negative one a gap, for both. */
  const settle = (sw, ew, sign) => {
    let v = arcOffset(sw, sign * (ew - CAP_BULGE * rOf(sw, t)), t);
    for (let k = 0; k < 4; k++) v = arcOffset(sw, sign * (ew - CAP_BULGE * rOf(sw + v, t)), t);
    return v;
  };
  const vPPup = settle(S_PP, e(wPP), +1), vPPdn = settle(S_PP, e(wPP), -1);
  const vRup = settle(S_PT, e(wR), +1), vRdn = settle(S_PT, e(wR), -1);
  const vLup = settle(S_PT, e(wL), +1), vLdn = settle(S_PT, e(wL), -1);
  return { wPP, wR, wL, ePP: e(wPP), eR: e(wR), eL: e(wL),
           vPPup, vPPdn, vRup, vRdn, vLup, vLdn, rPP, rPT };
}

/** sample the path over a v-range into the point array a tube wants */
function samples(v0, v1, t, n) {
  const P = [];
  for (let i = 0; i <= n; i++) P.push(pathAt(lerp(v0, v1, i / n), t));
  return P;
}

/** a closed cavity cast over a v-range: rounded at BOTH ends, because an annular cut end reads as an
    open pipe and RENDER-STANDARD says that is the one thing that must never be visible — and because
    the parity probe this model turns on is only meaningful on a watertight solid.

    THE BULGE IS SMALL, AND THE REASON IS A BUG THIS FOUND. domeCap stands `bulge * r` PROUD of the
    terminal ring, so a cast whose ring is PART_GAP/2 short of a closed waist still reaches 0.26 past
    it at r = 0.33 — and the first run of the component probe reported ONE cavity at every t, because
    every pair of domes met in the gap the partition was supposed to occupy. The geometry was right
    and the thing being measured was not the thing the offsets described. So the bulge is 0.22 and
    edges() subtracts `bulge * r` from every waist offset: what the schedule names is where the TIP
    lands, which is the surface the probe meets. */
const CAP_BULGE = 0.22;
function castOf(v0, v1, t, n, ring) {
  const P = samples(v0, v1, t, n || 56);
  const geo = K.tubeCapped(P, u => rOf(lerp(v0, v1, u), t), {
    ring: ring || 24, cap: 'both', flatten: 0.94, capRows: 6, bulge: CAP_BULGE,
  });
  return geo;
}

/* ===================================================================== THE SOLVE 1
   THE PLEUROPERITONEAL FLAP.

   The membrane is body wall, peeled inward as the lung excavates behind it, so it is a strip of
   FIXED ARC LENGTH whose curvature is what changes. Three things have to be true of it and they are
   exactly three scalars, so there are exactly three unknowns:

     lam   the curvature amplitude
     a     how much of that curvature is held at the HINGE, where the flap leaves the body wall
     L     the flap's own arc length — how much body wall has to be peeled in

   conditions, all at the free edge, in the transverse plane at the canal's own station:
     (1,2) the free edge REACHES the dorsal mesentery of the oesophagus — both coordinates
     (3)   and arrives TANGENT to the septum transversum it fuses with, so the fusion is a join and
           not a crease. The septum's own tangent at the median plane is pure +x by symmetry
           (d/dtheta of the dome at theta = 270 deg is (A*rho, 0, 0)), so the target angle is 0 and
           is derived rather than chosen.

   The flap starts with the BODY WALL'S OWN TANGENT at the root, so there is no crease there by
   construction; that is why the third condition is spent on the far end instead.

   WHAT THE SOLVE IS FOR, since a reader could reasonably ask why a membrane needs one. The answer is
   the examinable relation: the free edge's RADIAL position on the diaphragm decides when the
   pericardioperitoneal canal is shut, and the canal shutting on the right before the left is the
   whole reason the common congenital diaphragmatic hernia is left-sided. That timing comes out of
   the flap's shape — it is markedly non-linear in the sweep — and a tuned schedule would have made
   the left-sidedness a decision rather than a consequence.                                        */

/* the flap is hinged on the body wall at the CANAL'S OWN BEARING, read off the horseshoe, so the
   solve and the geometry it drives cannot point at different places. */
const BETA0 = Math.PI - Math.atan2(Z_LIMB / B_DIA, XL / A_DIA);
const TG = { x: -0.12, z: -0.47 };      // the dorsal mesentery of the oesophagus, right edge
const ALPHA_TG = 0;                     // the septum's tangent at the median plane: pure +x
const HINGE_W = 0.22;                   // the hinge's width, as a fraction of L
const FLAP_STEPS = 220;

const ROOT = { x: WX * Math.cos(BETA0), z: WZ * Math.sin(BETA0) };
const ALPHA0 = Math.atan2(WZ * Math.cos(BETA0), -WX * Math.sin(BETA0));
const CHORD = Math.hypot(TG.x - ROOT.x, TG.z - ROOT.z);
const CHAT = { x: (TG.x - ROOT.x) / CHORD, z: (TG.z - ROOT.z) / CHORD };
const NHAT = { x: -CHAT.z, z: CHAT.x };

/** integrate the flap from its root to arc length `upto`, returning the polyline and the end state */
function flapCurve(lam, a, L, upto) {
  const end = upto == null ? L : Math.min(L, Math.max(0, upto));
  const n = Math.max(2, Math.round(FLAP_STEPS * (end / L || 1)));
  const h = end / n;
  let al = ALPHA0, x = ROOT.x, z = ROOT.z;
  const P = [{ x, z }];
  const hw = HINGE_W * L;
  for (let i = 0; i < n; i++) {
    /* midpoint rule on both the angle and the position, so the end state is second order in h and
       the Jacobian the Newton step reads is not dominated by discretisation */
    const s0 = i * h, sm = s0 + h / 2;
    const kap = s => lam * (1 + a * Math.exp(-(s / hw) * (s / hw)));
    const alm = al + kap(s0) * (h / 2);
    x += Math.cos(alm) * h; z += Math.sin(alm) * h;
    al += kap(sm) * h;
    P.push({ x, z });
  }
  return { P, x, z, alpha: al };
}

function flapResidual(v) {
  const e = flapCurve(v[0], v[1], v[2], null);
  const dx = e.x - TG.x, dz = e.z - TG.z;
  return [dx * CHAT.x + dz * CHAT.z, dx * NHAT.x + dz * NHAT.z, e.alpha - ALPHA_TG];
}

/** damped Newton with a numerical Jacobian, from a SEED LIST, reporting its own residual and
    whether it converged — RENDER-STANDARD, "A PROBE WITH A DEGENERATE CASE MUST REPORT THE
    DEGENERACY": a solve that quietly returns its starting guess is worse than one that says it
    failed, and this one HAS a wrong basin to fall into.

    WHY A SEED LIST AND NOT A GUESS. The obvious seed — constant curvature, enough of it to turn
    from the wall's tangent to the septum's — has no solution near it, and Newton from there walks
    to lam -> 0 with a -> +500, which is a pure hinge spike followed by a straight line and leaves a
    residual of 0.3 that no damping reduces. The reason is geometric and worth recording, because it
    is the shape of the answer: the flap leaves the body wall heading DORSALLY, at -54.5 deg, and has
    to arrive on a chord that is nearly horizontal, so its z must come back UP — which means alpha
    must overshoot above the target and return, which means the curvature must CHANGE SIGN. With
    kappa = lam * (1 + a * hinge) that needs lam < 0 and a < -1, and no seed with lam > 0 can reach
    it. Searched over 90 seeds: 71 of them converge, all to ONE point, so the root is unique and the
    basin is wide once it is entered from the right side. */
const FLAP_SEEDS = (() => {
  const out = [];
  for (const lam of [-0.25, -0.6, -1.0, -2.0]) for (const a of [-2, -5, -9, -26])
    for (const sl of [1.03, 1.2, 1.45]) out.push([lam, a, CHORD * sl]);
  return out;
})();
function solveFlapFrom(v0) {
  let v = v0.slice();
  let F = flapResidual(v), it = 0, best = null;
  const norm = f => Math.max(Math.abs(f[0]), Math.abs(f[1]), Math.abs(f[2]));
  for (it = 0; it < 80; it++) {
    const n0 = norm(F);
    if (best == null || n0 < best.n) best = { v: v.slice(), n: n0 };
    if (n0 < 1e-11) break;
    const J = [[0, 0, 0], [0, 0, 0], [0, 0, 0]];
    for (let c = 0; c < 3; c++) {
      const hh = Math.max(1e-6, Math.abs(v[c]) * 1e-6);
      const vp = v.slice(); vp[c] += hh;
      const Fp = flapResidual(vp);
      for (let r = 0; r < 3; r++) J[r][c] = (Fp[r] - F[r]) / hh;
    }
    const d = det3(J);
    if (!isFinite(d) || Math.abs(d) < 1e-18) break;
    const step = solve3(J, [-F[0], -F[1], -F[2]], d);
    let damp = 1, moved = false;
    for (let k = 0; k < 24; k++) {
      const vn = [v[0] + damp * step[0], v[1] + damp * step[1], v[2] + damp * step[2]];
      if (vn[2] > CHORD * 0.6 && vn[2] < CHORD * 3.0) {
        const Fn = flapResidual(vn);
        if (norm(Fn) < n0) { v = vn; F = Fn; moved = true; break; }
      }
      damp *= 0.5;
    }
    if (!moved) break;
  }
  if (best && norm(F) > best.n) v = best.v, F = flapResidual(v);
  return { lam: v[0], a: v[1], L: v[2], resid: norm(F), iters: it,
           converged: norm(F) < 1e-8, slack: v[2] / CHORD, chord: CHORD,
           alphaEnd: flapCurve(v[0], v[1], v[2], null).alpha };
}
function solveFlap() {
  let best = null, tried = 0, hit = 0;
  for (const sd of FLAP_SEEDS) {
    const r = solveFlapFrom(sd); tried++;
    if (r.converged) hit++;
    if (!best || r.resid < best.resid) best = r;
  }
  best.seedsTried = tried; best.seedsConverged = hit;
  return best;
}
function det3(M) {
  return M[0][0] * (M[1][1] * M[2][2] - M[1][2] * M[2][1])
       - M[0][1] * (M[1][0] * M[2][2] - M[1][2] * M[2][0])
       + M[0][2] * (M[1][0] * M[2][1] - M[1][1] * M[2][0]);
}
function solve3(M, b, d) {
  const col = (j) => M.map(r => r.slice()).map((r, i) => { r[j] = b[i]; return r; });
  return [det3(col(0)) / d, det3(col(1)) / d, det3(col(2)) / d];
}

const FLAP = solveFlap();

/* WHERE THE FREE EDGE IS, as a radius on the diaphragm, at sweep fraction `prog`.

   THE SHAPE OF THIS CURVE IS THE SOLVE'S OUTPUT; ITS TWO ENDPOINTS ARE PINNED, AND THAT IS DECLARED
   RATHER THAN HIDDEN. The flap is integrated to prog*L and its endpoint converted to the dome's own
   radial coordinate; that conversion is then rescaled affinely so prog = 0 reads exactly 1.0 (the
   body wall) and prog = 1 reads exactly RHO_CT (the septum's edge). The rescaling exists because the
   diaphragm has to be WATERTIGHT: the membrane's territory and the septum's must share a boundary to
   the last digit or the parity probe finds a 0.03-wide annular slot and reports the pericardial and
   peritoneal cavities as one. What the solve contributes — and what a prescribed ramp could not — is
   everything BETWEEN the endpoints: the edge crosses the canal's own radius at 0.7-odd of the sweep
   rather than at 0.5, and that non-linearity is what sets the closure order. */
const RHO_FLAP = (() => {
  const N = 48, tab = [];
  for (let i = 0; i <= N; i++) {
    const e = flapCurve(FLAP.lam, FLAP.a, FLAP.L, (i / N) * FLAP.L);
    tab.push(Math.hypot(e.x / A_DIA, e.z / B_DIA));
  }
  /* A RUNNING MINIMUM, because what the diaphragm cares about is the membrane's COVERAGE and tissue
     does not retreat. The raw curve dips inside its own target and comes back out — the flap curls
     past the mesentery and settles on it — so the radius it has REACHED is monotone while the radius
     it is AT is not, and an edge that moved back out would reopen a canal that had shut. */
  for (let i = 1; i <= N; i++) tab[i] = Math.min(tab[i], tab[i - 1]);
  const r0 = tab[0], r1 = tab[N];
  return tab.map(r => 1.0 + (r - r0) * (RHO_CT - 1.0) / (r1 - r0));
})();
function edgeRhoAt(prog) {
  const u = cl01(prog) * (RHO_FLAP.length - 1), i = Math.floor(u), f = u - i;
  return i >= RHO_FLAP.length - 1 ? RHO_FLAP[RHO_FLAP.length - 1] : lerp(RHO_FLAP[i], RHO_FLAP[i + 1], f);
}

/* ------------------------------------------------------- the diaphragm, as a dome

   One surface, four territories on it, and the hernia sites are the TRIPLE POINTS where three
   territories meet rather than holes cut somewhere plausible. rho is the fraction of the way from
   the dome's apex to its rim; theta is measured from +x (the embryo's LEFT) in the (x, z) plane, so
   theta = 90 deg is ventral and theta = 270 deg is dorsal.                                         */

const Y_DIA = t => lerp(Y_DIA0, Y_DIA1, ease(t));
const muscleProg = t => ease((t - 0.70) / 0.30);

const TH_CAN_L = Math.atan2(Z_LIMB / B_DIA, XL / A_DIA);          // the left canal's bearing
const TH_CAN_R = Math.PI - TH_CAN_L;                               // ...and the right's
const norm2pi = a => { let x = a % (2 * Math.PI); if (x < 0) x += 2 * Math.PI; return x; };
const angDiff = (a, b) => { let d = norm2pi(a - b); if (d > Math.PI) d -= 2 * Math.PI; return d; };

/** is this bearing inside one of the two pleuroperitoneal leaves' sectors? */
function leafSide(th) {
  if (Math.abs(angDiff(th, TH_CAN_L)) <= TH_LEAF_SECTOR) return 'l';
  if (Math.abs(angDiff(th, TH_CAN_R)) <= TH_LEAF_SECTOR) return 'r';
  return null;
}
const TH_CRURA = 1.5 * Math.PI;                                    // dorsal median
const inCrura = th => Math.abs(angDiff(th, TH_CRURA)) <= PHI_CR;

function domePt(rho, th, t, lift) {
  const r = Math.max(0, rho);
  return new T.Vector3(A_DIA * r * Math.cos(th),
                       Y_DIA(t) + H_DIA * (1 - r * r) + (lift || 0),
                       B_DIA * r * Math.sin(th));
}
/** the dome's own normal, pointing CRANIALLY, from the same point function that places the surface */
function domeN(rho, th) {
  const r = Math.max(1e-4, rho);
  const n = new T.Vector3(2 * H_DIA * B_DIA * r * r * Math.cos(th),
                          A_DIA * B_DIA * r,
                          2 * H_DIA * A_DIA * r * r * Math.sin(th));
  if (n.lengthSq() < 1e-16) return new T.Vector3(0, 1, 0);
  return n.normalize();
}

/* how far the septum transversum reaches, and where the membrane's free edge is, at this t */
const septOuter = (th, t) => leafSide(th) ? RHO_CT : lerp(1.0, RHO_CT, muscleProg(t));
const flapProg = (side, t) => {
  const span = side === 'r' ? T_PT_R : T_PT_L;
  return ease((t - span[0]) / (span[1] - span[0]));
};
const edgeRho = (side, t) => edgeRhoAt(flapProg(side, t));
const rimInner = (th, t) => lerp(1.0, leafSide(th) ? RHO_M : RHO_CT, muscleProg(t));

/* THE CANAL'S OPEN FRACTION IS READ OFF THE SOLVED MEMBRANE, NOT PRESCRIBED. The canal is shut when
   the free edge has swept past the canal's own radius; the soft band is one membrane thickness'
   worth of radius, so the cast's separation and the membrane's arrival are the same event. This is
   the line that makes "the right canal closes before the left" — and therefore the left-sidedness of
   the common congenital diaphragmatic hernia — a consequence of the solve rather than a caption. */
const ROPEN = 0.13;
const canalOpen = (side, t) => cl01((edgeRho(side, t) - RHO_CANAL) / ROPEN);

/* THE TWO HERNIA SITES, DERIVED FROM THE TERRITORY MAP AND NOT PLACED.

   Bochdalek sits where the LEFT pleuroperitoneal leaf fails to reach the septum's edge — that is,
   AT the canal, on the canal's own bearing — so its site is RHO_CANAL and TH_CAN_L and there is no
   third constant to get wrong. Morgagni sits at the other triple point the map has: just OUTSIDE
   the RIGHT leaf's ventral edge, where the central tendon, the costal rim and the ventral wall meet.
   The model has no sternum, so "retrosternal" is narrated and what is MEASURED is the relation the
   exam actually asks for — Morgagni ventral and on the RIGHT, Bochdalek dorsal and on the LEFT.
   Declared in the scene's gaps[]. */
const BOCH_SHORT = 0.11;
const TH_MORG = TH_CAN_R - TH_LEAF_SECTOR - 0.06;
const RHO_MORG = RHO_CT + 0.05;

/* ===================================================================== THE SOLVE 2
   THE PHRENIC NERVE.

   "C3, C4 and C5 keep the diaphragm alive" is a geometric fact: the roots never move and the muscle
   they supply travels the length of the trunk. So the nerve is SOLVED, not drawn — at every t it is
   the shortest path from the fixed cervical roots to the central tendon that stays OUTSIDE the
   pericardial sac. Solved by relaxation: shorten each interior point toward the midpoint of its
   neighbours, then push anything that has fallen inside the sac back out to its surface, and repeat
   until nothing moves. The residual is reported, because a relaxation that has not converged and a
   relaxation that has look identical from the outside.

   ITS LENGTH IS THEN A MEASURED CONSEQUENCE OF THE DESCENT and not a number anybody chose, which is
   what acceptance row P asserts: the nerve lengthens by AT LEAST the descent (it cannot do less, it
   is tethered at both ends) and not much more (it is a shortest path, not a drawn curve). And
   because the shortest path outside the sac lies ON the sac, the nerve ends up on the surface that
   becomes the fibrous pericardium — which is why beat 3 can say the membrane carries it.           */

/** the pericardial sac, as the ellipsoid that contains the pericardial cast at this t */
function sacAt(t) {
  const E = edges(t);
  const vEnd = S_PP + E.vPPup;
  const pm = pathAt(0, t), pe = pathAt(vEnd, t);
  const r = R_PERI(t);
  return { c: new T.Vector3(0, 0.5 * (pm.y + pe.y), 0.5 * (pm.z + pe.z) + 0.02),
           a: Math.abs(pe.x) + r * 1.04, b: Math.abs(pm.y - pe.y) / 2 + r * 1.10,
           cz: Math.abs(pm.z - pe.z) / 2 + r * 1.06 };
}
function sacScale(S, p) {
  return Math.hypot((p.x - S.c.x) / S.a, (p.y - S.c.y) / S.b, (p.z - S.c.z) / S.cz);
}
function pushOutOfSac(S, p, margin) {
  const u = sacScale(S, p), want = 1 + (margin || 0);
  if (u >= want || u < 1e-9) return false;
  const k = want / u;
  p.set(S.c.x + (p.x - S.c.x) * k, S.c.y + (p.y - S.c.y) * k, S.c.z + (p.z - S.c.z) * k);
  return true;
}

const PHR_N = 34, PHR_MARGIN = 0.035, PHR_ITERS = 4000;
/* WHEN THE NERVE STARTS ONLY GETTING LONGER, DERIVED RATHER THAN CHOSEN.

   At t = 0 the septum transversum is level with C3-C5 — that is the exam fact — so the nerve is at
   its SHORTEST there, and as the diaphragm descends past the level at which the three roots join,
   the path shortens slightly before it begins to grow. The minimum is geometrically inevitable and
   teaches nothing, so the growth claim is made from the t at which the target passes the junction
   (plus a margin), and that t is found by scanning rather than typed in: a typed 0.25 would silently
   stop meaning what it says the moment Y_DIA's ramp or the junction moved. */
const T_MONO = (() => {
  const jy = LEV('C5') - 0.20;
  for (let i = 0; i <= 200; i++) {
    const t = i / 200;
    if (Y_DIA(t) + H_DIA * (1 - 0.32 * 0.32) < jy) return Math.min(1, t + 0.05);
  }
  return 0.5;
})();
/** the lung bud, as the second obstacle the nerve has to pass medial to. The phrenic runs BETWEEN
    the fibrous pericardium and the pleura, so "outside the sac" is only half the constraint; without
    this the solved path grazed the lung (3.z: 'phrenic in lung_r' at 0.030). */
function lungObstacle(side, t) {
  if (t < FIRST_T.lung_r) return null;
  const sg = side === 'r' ? -1 : 1;
  const V = visceraPaths(t), L = V.lung(sg);
  const c = new T.Vector3();
  for (const p of L.P) c.add(p);
  c.divideScalar(L.P.length);
  const halfY = 0.5 * Math.abs(L.P[L.P.length - 1].y - L.P[0].y) + L.r;
  return { c: c, a: L.r * 1.18, b: halfY, cz: L.r * 1.18 };
}
function phrenicPath(side, t) {
  const sg = side === 'r' ? -1 : 1;
  const S = sacAt(t);
  const LU = lungObstacle(side, t);
  /* the three roots never move: that IS the exam fact, so they are read off the vertebral table */
  const roots = ['C3', 'C4', 'C5'].map(n => new T.Vector3(sg * 0.26, LEV(n), -0.26));
  const junction = new T.Vector3(sg * 0.40, LEV('C5') - 0.20, -0.14);
  const ins = domePt(0.32, sg > 0 ? 0.30 : Math.PI - 0.30, t, 0.02);
  const P = [];
  for (let i = 0; i <= PHR_N; i++) P.push(junction.clone().lerp(ins, i / PHR_N));
  let resid = 0;
  const mid = new T.Vector3();
  for (let it = 0; it < PHR_ITERS; it++) {
    resid = 0;
    for (let i = 1; i < PHR_N; i++) {
      mid.addVectors(P[i - 1], P[i + 1]).multiplyScalar(0.5);
      const before = P[i].clone();
      P[i].lerp(mid, 0.9);
      pushOutOfSac(S, P[i], PHR_MARGIN);
      if (LU) pushOutOfSac(LU, P[i], PHR_MARGIN);
      resid = Math.max(resid, before.distanceTo(P[i]));
    }
    if (resid < 1e-9) break;
  }
  let L = 0;
  for (let i = 1; i <= PHR_N; i++) L += P[i - 1].distanceTo(P[i]);
  /* HOW MUCH OF IT LIES ON THE SAC, which is why beat 3 can say the pleuropericardial membrane
     carries it: a shortest path round a convex body hugs that body wherever the straight line would
     have cut it. Counted as the fraction of the path's own length whose points sit within one
     margin of the sac's surface. */
  let onSac = 0;
  for (let i = 1; i <= PHR_N; i++) {
    const u = 0.5 * (sacScale(S, P[i - 1]) + sacScale(S, P[i]));
    if (u <= 1 + 3 * PHR_MARGIN) onSac += P[i - 1].distanceTo(P[i]);
  }
  /* and the straight line it cannot be shorter than */
  const straight = junction.distanceTo(ins);
  return { roots, junction, P, insertion: ins, length: L, resid: resid, sac: S,
           onSacFrac: L > 0 ? onSac / L : 0, straight: straight,
           detour: straight > 1e-9 ? (L - straight) / straight : 0,
           totalFromC4: roots[1].distanceTo(junction) + L };
}

/* -------------------------------------------------------------- the thick sheet

   THE SAME MISSING PRIMITIVE lateral-folding needed, and for the same reason: sweptShell sweeps a
   CLOSED ring along a frame, and a partition is an OPEN sheet. It is built OUT OF the kit — winding
   through emitter().quad / quadFlip / triN, normals by finite difference of the grid itself, colour
   through C(), silhouette through outlineOf — never beside it; RENDER-STANDARD section 6 forbids
   reimplementing those, not composing them.

   THIS IS THE SECOND MODEL TO NEED IT AND THE CODE IS THE SAME CODE. That is a kit-level finding
   rather than a model detail and it is in BUILD-LOG as one: `slab` belongs in render-kit.js. It is
   still local here for the same reason lateral-folding gives — render-kit.js is shared with ten
   models that are built and not all reviewed, and a shared-file change is not this run's to make.

   THE INDEX CONVENTION: i runs across the sheet, j along it. emitter().quad(a,b,c,d) with a=(i,j)
   emits a face normal of dj x di, so gridA must be handed in as the face lying on that side. It is
   not trusted — `flipped` below measures it off the two grids and warns.                           */

function grid3(ns, ny) { return new Array((ns + 1) * (ny + 1)); }
const GI = (ny, i, j) => i * (ny + 1) + j;

/* THE CALLER DECLARES WHICH WAY IS OUT, AND slab DECIDES THE ORDER.

   lateral-folding's version of this primitive takes gridA as "the outer face" and WARNS if the
   caller got it the wrong way round, which puts the author back in the business of reasoning about
   winding at the call site — and RENDER-STANDARD section 2.4b is explicit that "a winding convention
   that has to be reasoned about at the call site will be got wrong at some call site". It was got
   wrong at four of them here, and the fourth took an hour: the lining shell of the one cast that
   crosses the midline came out inside-out while the other four were right, because the grid's own
   dv x du stops meaning "radially outward" wherever the shell's angular reference swings faster
   along the path than the transported frame does.

   So this version takes an optional outwardAt(i, j) — the direction the caller knows is OUT, as a
   fact about the anatomy rather than about the loop order — and swaps the two grids if the surface's
   own normal disagrees with it. That is not papering over a caller error: it is deciding the order
   FROM THE GEOMETRY, which is what the kit does everywhere else. The swap is recorded in
   userData.gridSwapped so a review can see it happened, and a caller that passes no outwardAt still
   gets the warning. A kit-level finding; it is in BUILD-LOG with the slab-belongs-in-render-kit one. */
function slab(gridA, gridB, ns, ny, keep, label, outwardAt) {
  const E = K.emitter();
  const cl = (v, a, b) => (v < a ? a : (v > b ? b : v));
  function normalsOf(g, sign) {
    const N = new Array((ns + 1) * (ny + 1));
    const du = new T.Vector3(), dv = new T.Vector3(), out = new T.Vector3();
    let bad = 0;
    for (let i = 0; i <= ns; i++) for (let j = 0; j <= ny; j++) {
      const i0 = cl(i - 1, 0, ns), i1 = cl(i + 1, 0, ns);
      const j0 = cl(j - 1, 0, ny), j1 = cl(j + 1, 0, ny);
      du.subVectors(g[GI(ny, i1, j)], g[GI(ny, i0, j)]);
      dv.subVectors(g[GI(ny, i, j1)], g[GI(ny, i, j0)]);
      out.crossVectors(dv, du);
      if (out.lengthSq() < 1e-18) {
        /* a pole, or a column of zero width. Fall back to the i-direction difference crossed with
           the next j over, and only then to a constant: three's normalize() returns (0,0,0) for a
           zero vector without complaining, and an undisplaced silhouette shell is how RENDER-STANDARD
           rule 3 came to be written. */
        dv.subVectors(g[GI(ny, i, cl(j + 2, 0, ny))], g[GI(ny, i, j)]);
        out.crossVectors(dv, du); bad++;
      }
      if (out.lengthSq() < 1e-18) out.set(0, 1, 0);
      out.normalize().multiplyScalar(sign);
      N[GI(ny, i, j)] = out.clone();
    }
    N.degenerate = bad;
    return N;
  }
  const mi = Math.round(ns / 2), mj = Math.round(ny / 2);
  let NA = normalsOf(gridA, 1), swapped = false;
  if (outwardAt) {
    const want = outwardAt(mi, mj);
    if (want && want.lengthSq() > 1e-14 && NA[GI(ny, mi, mj)].dot(want) < 0) {
      const tmp = gridA; gridA = gridB; gridB = tmp;
      NA = normalsOf(gridA, 1); swapped = true;
    }
  }
  const sep = new T.Vector3().subVectors(gridA[GI(ny, mi, mj)], gridB[GI(ny, mi, mj)]);
  const flipped = !outwardAt && sep.lengthSq() > 1e-14 && sep.dot(NA[GI(ny, mi, mj)]) < 0;
  if (flipped) console.warn('[body-cavity-coelom] slab(' + (label || '?') +
    '): gridA is not the outer face and no outwardAt was given — check the caller');
  const NB = normalsOf(gridB, -1);
  const cell = (i, j) => (keep ? !!keep(i, j) : true);

  for (let i = 0; i < ns; i++) for (let j = 0; j < ny; j++) {
    if (!cell(i, j)) continue;
    const a = GI(ny, i, j), b = GI(ny, i + 1, j), c = GI(ny, i + 1, j + 1), d = GI(ny, i, j + 1);
    E.quad(gridA[a], gridA[b], gridA[c], gridA[d], NA[a], NA[b], NA[c], NA[d]);
  }
  const hullCount = E.count();
  for (let i = 0; i < ns; i++) for (let j = 0; j < ny; j++) {
    if (!cell(i, j)) continue;
    const a = GI(ny, i, j), b = GI(ny, i + 1, j), c = GI(ny, i + 1, j + 1), d = GI(ny, i, j + 1);
    E.quadFlip(gridB[a], gridB[b], gridB[c], gridB[d], NB[a], NB[b], NB[c], NB[d]);
  }
  /* THE RIM, ALL ROUND WHATEVER SURVIVED, through triN and never tri. */
  const nrm = new T.Vector3();
  function rim(iA, jA, iB, jB, outward) {
    const a = GI(ny, iA, jA), b = GI(ny, iB, jB);
    E.triN(gridA[a], gridA[b], gridB[b], outward);
    E.triN(gridA[a], gridB[b], gridB[a], outward);
  }
  for (let i = 0; i < ns; i++) for (let j = 0; j < ny; j++) {
    if (!cell(i, j)) continue;
    if (!cell(i - 1, j) || i === 0) {
      nrm.subVectors(gridA[GI(ny, i, j)], gridA[GI(ny, i + 1, j)]);
      if (nrm.lengthSq() > 1e-18) rim(i, j, i, j + 1, nrm.clone().normalize());
    }
    if (!cell(i + 1, j) || i === ns - 1) {
      nrm.subVectors(gridA[GI(ny, i + 1, j)], gridA[GI(ny, i, j)]);
      if (nrm.lengthSq() > 1e-18) rim(i + 1, j, i + 1, j + 1, nrm.clone().normalize());
    }
    if (!cell(i, j - 1) || j === 0) {
      nrm.subVectors(gridA[GI(ny, i, j)], gridA[GI(ny, i, j + 1)]);
      if (nrm.lengthSq() > 1e-18) rim(i, j, i + 1, j, nrm.clone().normalize());
    }
    if (!cell(i, j + 1) || j === ny - 1) {
      nrm.subVectors(gridA[GI(ny, i, j + 1)], gridA[GI(ny, i, j)]);
      if (nrm.lengthSq() > 1e-18) rim(i, j + 1, i + 1, j + 1, nrm.clone().normalize());
    }
  }
  if (!E.count()) return null;
  const g = E.geometry(hullCount);
  g.userData.degenerateNormals = (NA.degenerate || 0) + (NB.degenerate || 0);
  g.userData.gridFlipped = flipped;
  g.userData.gridSwapped = swapped;
  return g;
}

/* --------------------------------------------- a territory of the diaphragm, as a slab

   i runs radially (rho0 -> rho1, both functions of theta so a territory can have a curved inner or
   outer boundary), j runs round the sector with theta ASCENDING so that dj x di comes out along the
   dome's own cranial normal and gridA is the thoracic face. `lift` offsets the whole territory along the dome's
   own normal, which is how the muscular rim is stacked on the abdominal side of the membrane it
   reinforces without the two sharing any space.                                                   */
function domeTerritory(t, th0, th1, rho0Fn, rho1Fn, thickFn, lift, nr, nt, keep, label) {
  const NR = nr || 10, NT = nt || 24;
  const A = grid3(NR, NT), B = grid3(NR, NT);
  const at = (i, j) => {
    /* ASCENDING theta. dv x du = d/dtheta x d/drho, which is exactly domeN — measured in the header
       and verified by slab()'s own flipped check, which is how the first version (descending) was
       caught: every dome territory warned. */
    const th = lerp(th0, th1, j / NT);
    const r0 = rho0Fn(th), r1 = rho1Fn(th);
    const rho = lerp(r0, r1, i / NR);
    return { rho, th };
  };
  let any = false;
  for (let i = 0; i <= NR; i++) for (let j = 0; j <= NT; j++) {
    const q = at(i, j);
    const n = domeN(q.rho, q.th);
    const h = thickFn(q.rho, q.th) / 2;
    const base = domePt(q.rho, q.th, t, 0).addScaledVector(n, lift || 0);
    A[GI(NT, i, j)] = base.clone().addScaledVector(n, h);
    B[GI(NT, i, j)] = base.clone().addScaledVector(n, -h);
    if (h > 1e-6) any = true;
  }
  if (!any) return null;
  const keepCell = keep ? (i, j) => { const q = at(i, j); return keep(q.rho, q.th, i, j); } : null;
  return slab(A, B, NR, NT, keepCell, label, (i, j) => { const q = at(i, j); return domeN(q.rho, q.th); });
}

/* ------------------------------------------------------- the body wall, and its slot

   A closed elliptical tube along y, EXCEPT for a slot on each flank that closes as the lateral folds
   meet. The slot is the coelom's communication with the extraembryonic cavity, and closing it is
   what beat 2's "the lateral folds pinch both openings shut" means. It is measured: escapes() casts
   rays out of the cavity in the transverse plane and counts how many get past this profile.         */

const Y_WALL_TOP = 3.30, Y_WALL_BOT = -2.30;
const ECTOPIA_HALF = 0.68;   // the ventral gap in ectopia cordis, as a half-angle of the wall
const slotHalf = t => 0.52 * (1 - ease((t - T_SEAL[0]) / (T_SEAL[1] - T_SEAL[0])));
const wallR = th => ({ x: WX * Math.cos(th), z: WZ * Math.sin(th) });
/** the wall's transverse profile as a polyline, with the slot(s) left out — what rays are cast at */
function wallProfile(t, opts) {
  const o = opts || {}, sh = slotHalf(t), segs = [];
  const N = 120;
  let run = [];
  for (let i = 0; i <= N; i++) {
    const th = (i / N) * 2 * Math.PI;
    const open = (sh > 1e-4 && (Math.abs(angDiff(th, 0)) < sh || Math.abs(angDiff(th, Math.PI)) < sh))
      || (o.ectopia && Math.abs(angDiff(th, Math.PI / 2)) < ECTOPIA_HALF);
    if (open) { if (run.length > 1) segs.push(run); run = []; }
    else run.push(wallR(th));
  }
  if (run.length > 1) segs.push(run);
  return segs;
}
/** does a ray leaving (px,pz) in direction (dx,dz) cross the wall? Exact, in the transverse plane. */
function segHit(px, pz, dx, dz, segs) {
  for (const P of segs) for (let i = 1; i < P.length; i++) {
    const ax = P[i - 1].x, az = P[i - 1].z, bx = P[i].x - ax, bz = P[i].z - az;
    const den = dx * bz - dz * bx;
    if (Math.abs(den) < 1e-12) continue;
    const s = ((ax - px) * bz - (az - pz) * bx) / den;
    const u = ((ax - px) * dz - (az - pz) * dx) / den;
    if (s > 1e-6 && u >= 0 && u <= 1) return true;
  }
  return false;
}
/** how many of N transverse rays leaving a point inside the coelom reach the outside */
function escapes(t, from, opts) {
  const segs = wallProfile(t, opts || {});
  let out = 0; const N = 240;
  for (let k = 0; k < N; k++) {
    const a = (k / N) * 2 * Math.PI;
    if (!segHit(from.x, from.z, Math.cos(a), Math.sin(a), segs)) out++;
  }
  return { escapes: out, rays: N, from: from };
}

/* --------------------------------------------------------------------- viscera

   PRESCRIBED CONTEXT, not examinable geometry: every cavity needs something in it or "the heart sits
   in the pericardial cavity" is a sentence with no picture behind it. Said in the scene's gaps[]. */

function visceraPaths(t) {
  const yw = Y_DIA(t) + H_DIA * (1 - RHO_CANAL * RHO_CANAL);
  const yPeri = Y_PERI(t), zPeri = Z_PERI(t);
  const rp = R_PERI(t);
  return {
    heart: { P: [new T.Vector3(-0.26, yPeri + 0.08, zPeri - 0.03),
                 new T.Vector3(-0.04, yPeri + 0.02, zPeri + 0.02),
                 new T.Vector3(0.18, yPeri - 0.10, zPeri + 0.00),
                 new T.Vector3(0.26, yPeri - 0.20, zPeri - 0.06)], r: rp * 0.50 },
/* THE LUNG BUD STOPS SHORT OF THE DIAPHRAGM, and it did not before. It grows INTO the
       pericardioperitoneal canal — that is the mechanism the whole scene turns on — but drawn down to
       0.84 of the way to the canal it passed THROUGH the pleuroperitoneal membrane (0.26 of its
       vertices inside it) and on into the peritoneal cast below. The mechanism is in the solve and in
       the narration; what the picture owes is a lung in the pleural cavity, above its floor. */
    lung: sg => ({ P: [new T.Vector3(sg * XL * 0.86, lerp(yPeri, yw, 0.12), Z_LIMB + 0.06),
                       new T.Vector3(sg * XL * 1.00, lerp(yPeri, yw, 0.38), Z_LIMB),
                       new T.Vector3(sg * XL * 1.02, lerp(yPeri, yw, 0.60), Z_LIMB - 0.04)],
                   r: 0.18 + 0.13 * ease((t - 0.30) / 0.70) }),
    liver: { P: [new T.Vector3(-0.74, yw - 0.44, 0.26), new T.Vector3(0, yw - 0.36, 0.36),
                 new T.Vector3(0.62, yw - 0.46, 0.24)], r: 0.28 },
    gut: { P: [new T.Vector3(0, yw - 0.26, -0.20), new T.Vector3(0, Y_CAUD + 0.52, -0.20),
               new T.Vector3(0, Y_CAUD + 0.18, -0.08)], r: 0.21 },
/* THE OESOPHAGUS HAS TO SIT IN THE HIATUS BAND, not inboard of it. At z = -0.46 its dome radius is
       0.436, which is INSIDE RHO_CT — so it pierced the central tendon rather than passing between the
       crura, and the hiatus hole in the septum was cut somewhere it never went. Found by the 3.z audit
       as 'oesophagus in septum_transversum'. */
    oes: { P: [new T.Vector3(0, yw + 1.10, -0.60), new T.Vector3(0, yw + 0.10, -0.60),
               new T.Vector3(0, yw - 0.34, -0.54)], r: R_OES },
  };
}

/* ---------------------------------------------------- a hollow lining round a cast

   WHY THE TWO LININGS ARE TWO HALVES OF ONE SHELL, which is the whole of beat 1 and half of beat 5.
   The coelom was carved out of ONE sheet that split in two, so its lining is one continuous
   mesothelium: the half against the body wall is SOMATIC and becomes every parietal layer, the half
   against the viscera is SPLANCHNIC and becomes every visceral layer, and they are continuous with
   each other at the two reflection lines — which is why a mesentery has a root. So they are built as
   the two halves of a single annular shell around the cast, divided at the outward direction, and
   the reflection line is where they meet rather than a gap somebody left.                          */

function castFrame(v0, v1, t, n) {
  const P = samples(v0, v1, t, n);
  return { P, F: K.parallelFrame(P, null) };
}
/** which tube angle faces AWAY from the trunk's axis, per row — measured, not assumed */
function outwardTh(F, i) {
  const p = F.P[i];
  const axis = new T.Vector3(0, p.y, Z_LIMB);
  const o = new T.Vector3().subVectors(p, axis);
  o.addScaledVector(F.D[i], -o.dot(F.D[i]));
  if (o.lengthSq() < 1e-12) return 0;
  return Math.atan2(o.dot(F.B[i]), o.dot(F.N[i]));
}
function liningSlab(v0, v1, t, half, off, thick, ns, nt, tag) {
  const fr = castFrame(v0, v1, t, ns);
  const NS = nt, NY = ns;
  const A = grid3(NS, NY), B = grid3(NS, NY);
  /* ONE REFLECTION LINE PER CAVITY, NOT A ROLLING ONE. outwardTh is measured per row; using it per
     row makes the grid's j-lines SPIRAL round the tube wherever the outward direction swings faster
     along the path than the transported frame does, and the shell's two halves then stop being "the
     body-wall half" and "the visceral half" in any stable sense. So the split is taken ONCE, as the
     mean outward bearing over this part's own rows, unwrapped so the mean is not an average of 0 and
     2*pi. For a limb that mean IS the outward direction to within a few degrees; for the pericardial
     cast, the only one that crosses the midline, it is the ventral direction — which is the right
     answer anyway, because the parietal layer of the pericardium faces the body wall and the
     visceral layer faces the heart. */
  let acc = 0, prevTh = null;
  for (let j = 0; j <= NY; j++) {
    let th = outwardTh(fr.F, j);
    if (prevTh != null) { while (th - prevTh > Math.PI) th -= 2 * Math.PI; while (prevTh - th > Math.PI) th += 2 * Math.PI; }
    prevTh = th; acc += th;
  }
  const TH0 = acc / (NY + 1);
  const radAt = (i, j) => {
    const span = Math.PI, frac = i / NS;
    const th = TH0 + (half > 0 ? (Math.PI / 2 - span * frac) : (1.5 * Math.PI - span * frac));
    const jj = Math.max(0, Math.min(NY, j));
    return new T.Vector3().copy(fr.F.N[jj]).multiplyScalar(Math.cos(th))
      .addScaledVector(fr.F.B[jj], Math.sin(th));
  };
  for (let j = 0; j <= NY; j++) {
    const u = j / NY, v = lerp(v0, v1, u);
    const r = rOf(v, t), th0 = TH0;
    for (let i = 0; i <= NS; i++) {
      /* half = +1 the body-wall side, -1 the visceral side, and BOTH run theta DESCENDING in i.
         render-kit's parallelFrame sets B = D x N, so D = N x B and D x d(theta) = -rad: the outward
         face only comes out outward if i runs the other way. The first version ran the two halves in
         opposite directions, which made one of them inside-out with every normal self-consistent —
         the exact class of fault RENDER-STANDARD section 2.1 is about, caught by slab()'s own
         flipped check rather than by looking at a picture. */
      /* A SEAM AT EACH REFLECTION LINE. Built as two exact halves, the somatic and splanchnic rims
         are COPLANAR and coincident, and the lumen probe found the far one winning: 2 of 1538 first
         hits faced AWAY, on the one camera that looks in through the ectopia defect, at dot -0.68 -
         not a grazing artefact. A reflection line is a line, so a gap of REFLECT_GAP radians either
         side of it is also the truer picture. */
      const span = Math.PI - 2 * REFLECT_GAP, frac = i / NS;
      const th = th0 + (half > 0 ? (Math.PI / 2 - REFLECT_GAP - span * frac)
                                 : (1.5 * Math.PI - REFLECT_GAP - span * frac));
      const rad = new T.Vector3().copy(fr.F.N[j]).multiplyScalar(Math.cos(th))
        .addScaledVector(fr.F.B[j], Math.sin(th));
      const base = new T.Vector3().copy(fr.F.P[j]).addScaledVector(rad, r + off);
      A[GI(NY, i, j)] = base.clone().addScaledVector(rad, thick / 2);
      B[GI(NY, i, j)] = base.clone().addScaledVector(rad, -thick / 2);
    }
  }
  return slab(A, B, NS, NY, null, 'lining/' + (half > 0 ? 'somatic' : 'splanchnic') + '/' + (tag == null ? '?' : tag), radAt);
}

/* ------------------------------------------------------------------- build */

/* BOTH LININGS SIT JUST OUTSIDE THE CAST, on opposite halves of it, and meet at the two reflection
   lines. The first version put the splanchnic one INSIDE, which is the cavity's lumen and is where
   the fluid is, not where the mesothelium is. Which layer is which is then a fact about WHICH HALF
   each occupies — the somatic half faces the body wall — and that is what row L measures. */
const OFF_SOM = 0.040, OFF_SPL = 0.040, TH_LINING = 0.050;
const REFLECT_GAP = 0.055;   // the seam at each reflection line, in radians
/* three ignores `opacity` unless `transparent` is set, and the kit's tissueMaterial does not set it
   for you — it only guards depthWrite. So every translucent part in this model declares all three
   together, through one helper, and the scene declares the SAME numbers because viz3d's procedural
   adapter reads opacity off the SCENE and defaults a silent one to 1 (viz3d.js ~line 605). */
const TRANSP = o => ({ transparent: true, opacity: o, depthWrite: o >= 0.98 });
const TH_MUSC = 0.105, TH_CRUS = 0.120;

/* ============ THE WINDING OF EVERY RING QUAD IN THIS CORPUS, AND WHY THIS FUNCTION EXISTS ============

   RENDER-STANDARD section 2.4b fixed `tri` -> `triN` for CAPS, after finding 24 of 24 cap triangles on
   a plain tubeAlong wound against their own supplied normal. The RING QUADS were left alone, because
   `emitter().quad` takes corners "in natural ring order" and was believed safe. It is safe only when
   the normals handed to it are the ones the ring order implies — and in `sweptShell` they are not.
   `nrm()` ends with `if (out.dot(_rad) < 0) out.negate();`, the guard rule 3 asks for, which forces
   every normal to point away from the centreline. Wherever that guard fires — 19,561 times across one
   build of this model, at a pre-negation dot of -0.98 — the vertex normals are flipped and the quad's
   FIXED vertex order is not, so the face winding and the supplied normals disagree.

   MEASURED ACROSS THE CORPUS, with the same probe, on the FULL build at t = 1:
     cardiac-looping    7 of 11 keys below 0.999 — pericardium 0.515, arches 0.529, sinus 0.950,
                        atrium 0.958, ventricle 0.974. THIS MODEL IS MARKED `done` IN THE QUEUE.
     lateral-folding    0 of 13. It has no swept tubes of any size: every structure in it is a slab,
                        whose normals come from the grid and are never negated. That is why its
                        harness can assert 0.999 and pass, and why this has stayed invisible.
     body-cavity-coelom 6 of 25 before this fix — pleural_l 0.958, pleural_r 0.960, peritoneal 0.966.

   THE REAL FIX IS ONE LINE IN render-kit.js: sweptShell's outer-surface loop should emit through a
   winding-correcting quad, exactly as its caps now go through triN. That file is shared with ten
   models that are built and not all reviewed, and a shared-file change is not this run's to make —
   the same reason lateral-folding gives for keeping `slab` local. It is in BUILD-LOG as the run's
   headline finding, with these numbers.

   SO THIS MODEL CORRECTS ITS OWN GEOMETRY, LOCALLY AND FROM THE GEOMETRY. Every triangle whose face
   normal disagrees with its own vertex normals has vertices 1 and 2 swapped, with their normals, which
   is precisely what triN does — decide the order from the geometry rather than from a comment. It
   permutes attributes together so nothing desynchronises, and it leaves hullCount alone because the
   vertex count and the group order are unchanged. Every geometry this model adds goes through it, so
   the winding claim the harness makes is about the geometry a student is actually shown. */
let _windingFixed = 0, _windingSeen = 0;
function fixWinding(geo) {
  const p = geo.attributes.position, n = geo.attributes.normal;
  if (!p || !n || geo.index) return geo;
  const P = p.array, N = n.array;
  const a = new T.Vector3(), b = new T.Vector3(), c = new T.Vector3();
  const e1 = new T.Vector3(), e2 = new T.Vector3(), fn = new T.Vector3(), vn = new T.Vector3();
  for (let i = 0; i + 2 < p.count; i += 3) {
    a.set(P[i * 3], P[i * 3 + 1], P[i * 3 + 2]);
    b.set(P[i * 3 + 3], P[i * 3 + 4], P[i * 3 + 5]);
    c.set(P[i * 3 + 6], P[i * 3 + 7], P[i * 3 + 8]);
    fn.copy(e1.subVectors(b, a).cross(e2.subVectors(c, a)));
    if (fn.lengthSq() < 1e-18) continue;
    vn.set(N[i * 3] + N[i * 3 + 3] + N[i * 3 + 6],
           N[i * 3 + 1] + N[i * 3 + 4] + N[i * 3 + 7],
           N[i * 3 + 2] + N[i * 3 + 5] + N[i * 3 + 8]);
    if (vn.lengthSq() < 1e-18) continue;
    _windingSeen++;
    if (fn.dot(vn) >= 0) continue;
    _windingFixed++;
    for (let k = 0; k < 3; k++) {
      const i1 = (i + 1) * 3 + k, i2 = (i + 2) * 3 + k;
      let t1 = P[i1]; P[i1] = P[i2]; P[i2] = t1;
      t1 = N[i1]; N[i1] = N[i2]; N[i2] = t1;
    }
  }
  p.needsUpdate = true; n.needsUpdate = true;
  return geo;
}

function addS(group, key, geo, opt) {
  if (!geo) return null;
  fixWinding(geo);
  return K.addSolid(group, key, geo, Object.assign({
    color: LAYERS[key].color, name: LAYERS[key].name, outline: 0.020,
  }, opt || {}));
}
function tube(key, P, rFn, opts) {
  return K.tubeCapped(P, rFn, Object.assign({ ring: 20, cap: 'both', capRows: 6, bulge: 0.85 }, opts || {}));
}

function buildCoelom(t, opts) {
  const o = opts || {};
  const g = new T.Group();
  g.name = 'body-cavity-coelom@' + t;
  const E = edges(t);
  const yw = Y_DIA(t) + H_DIA * (1 - RHO_CANAL * RHO_CANAL);

  /* ---- the four cavity casts, on one horseshoe ---- */
  /* EACH BOUNDARY FROM THE OFFSET SETTLED FOR THE CAST THAT OWNS IT. A cast whose TIP must land at
     +e past a waist has its ring at +e - bulge*r — the `up` offset; one whose tip must land at -e has
     its ring at -e + bulge*r, the `dn` one. The pericardial cast reaches UP the horseshoe toward the
     waist, so it takes `up`; the pleural cast starts beyond it and takes `dn`. */
  const vPPo = S_PP + E.vPPup, vPPi = S_PP + E.vPPdn;
  const vPTr = S_PT + E.vRup, vPTl = S_PT + E.vLup;
  const vPEr = S_PT + E.vRdn, vPEl = S_PT + E.vLdn;

  /* TRANSPARENT, NOT JUST LOW-OPACITY. three ignores `opacity` unless `transparent` is set, so the
     first version's matOver did nothing at all in the harness — the body wall rendered as a solid
     blue cylinder and hid the entire subject, while the same scene rendered correctly in the player
     because viz3d's adapter sets transparent itself. A model whose own frames do not show what the
     player shows is the whole of RENDER-STANDARD 3.x in miniature, arrived at from the other side.
     depthWrite follows the kit's own threshold; renderOrder puts the casts behind their contents. */
  addS(g, 'pericardial', castOf(-vPPo, vPPo, t, 84, 28), { matOver: TRANSP(0.30), noOutline: false, renderOrder: 6 });
  addS(g, 'pleural_r', castOf(-vPTr, -vPPi, t, 72, 26), { matOver: TRANSP(0.30), renderOrder: 6 });
  addS(g, 'pleural_l', castOf(vPPi, vPTl, t, 72, 26), { matOver: TRANSP(0.30), renderOrder: 6 });
  /* the peritoneal cavity as TWO limbs whose caudal ends cross the midline once the ventral
     confluence has formed, so that it is ONE cavity afterwards and an open U before. Two meshes,
     one key: the adapter merges by key and the parity probe unions them. */
  addS(g, 'peritoneal', castOf(-1, -vPEr, t, 76, 26), { matOver: TRANSP(0.26), renderOrder: 6 });
  addS(g, 'peritoneal', castOf(vPEl, 1, t, 76, 26), { matOver: TRANSP(0.26), renderOrder: 6 });

  /* ---- the two linings, which is why every serous cavity has two layers ---- */
  if (o.linings !== false) {
    const parts = [[-vPPo, vPPo, 26], [-vPTr, -vPPi, 20], [vPPi, vPTl, 20], [-1, -vPEr, 22], [vPEl, 1, 22]];
    for (let pi = 0; pi < parts.length; pi++) {
      const [a, b, n] = parts[pi];
      addS(g, 'somatic', liningSlab(a, b, t, +1, OFF_SOM, TH_LINING, n, 12, pi), { matOver: TRANSP(0.50), renderOrder: 5 });
      addS(g, 'splanchnic', liningSlab(a, b, t, -1, OFF_SPL, TH_LINING, n, 12, pi), { matOver: TRANSP(0.50), renderOrder: 5 });
    }
  }

  /* ---- the body wall, with its flank slot ---- */
  if (o.wall !== false) {
    const NW = 72, NJ = 14, sh = slotHalf(t);
    const A = grid3(NW, NJ), B = grid3(NW, NJ);
    for (let i = 0; i <= NW; i++) for (let j = 0; j <= NJ; j++) {
      const th = -(i / NW) * 2 * Math.PI;                       // DESCENDING: gridA outside
      const y = lerp(Y_WALL_TOP, Y_WALL_BOT, j / NJ);
      const rad = new T.Vector3(Math.cos(th) / WX, 0, Math.sin(th) / WZ).normalize();
      const base = new T.Vector3(WX * Math.cos(th), y, WZ * Math.sin(th));
      A[GI(NJ, i, j)] = base.clone().addScaledVector(rad, WALL_H / 2);
      B[GI(NJ, i, j)] = base.clone().addScaledVector(rad, -WALL_H / 2);
    }
    const keepW = (i) => {
      const th = -((i + 0.5) / NW) * 2 * Math.PI;
      if (sh > 1e-4 && (Math.abs(angDiff(th, 0)) < sh || Math.abs(angDiff(th, Math.PI)) < sh)) return false;
      if (o.ectopia && Math.abs(angDiff(th, Math.PI / 2)) < ECTOPIA_HALF) return false;
      return true;
    };
    addS(g, 'body_wall', slab(A, B, NW, NJ, (i) => keepW(i), 'body_wall',
      (i) => { const th = -(i / NW) * 2 * Math.PI; return new T.Vector3(Math.cos(th) / WX, 0, Math.sin(th) / WZ).normalize(); }),
      { matOver: TRANSP(0.14), noOutline: true, renderOrder: 2 });
    /* the ectoderm as a thin outer lamina on the same profile: beat 1 names four layers and this is
       the outermost of them. */
    const A2 = grid3(NW, NJ), B2 = grid3(NW, NJ);
    for (let i = 0; i <= NW; i++) for (let j = 0; j <= NJ; j++) {
      const th = -(i / NW) * 2 * Math.PI;
      const y = lerp(Y_WALL_TOP, Y_WALL_BOT, j / NJ);
      const rad = new T.Vector3(Math.cos(th) / WX, 0, Math.sin(th) / WZ).normalize();
      const base = new T.Vector3(WX * Math.cos(th), y, WZ * Math.sin(th)).addScaledVector(rad, 0.072);
      A2[GI(NJ, i, j)] = base.clone().addScaledVector(rad, 0.022);
      B2[GI(NJ, i, j)] = base.clone().addScaledVector(rad, -0.022);
    }
    addS(g, 'ectoderm', slab(A2, B2, NW, NJ, (i) => keepW(i), 'ectoderm',
      (i) => { const th = -(i / NW) * 2 * Math.PI; return new T.Vector3(Math.cos(th) / WX, 0, Math.sin(th) / WZ).normalize(); }),
      { matOver: TRANSP(0.18), noOutline: true, renderOrder: 1 });
  }

  /* ---- PARTITION 1: the septum transversum, becoming the central tendon ---- */
  if (t >= FIRST_T.septum_transversum) {
    const thick = (rho) => lerp(TH_SEPT, TH_TENDON, muscleProg(t)) * (0.72 + 0.28 * (1 - rho * rho));
    const hiatusW = (o.hiatus_wide ? 1.75 : 1) * HIATUS_HALF;
    const keep = (rho, th) => !(Math.abs(angDiff(th, TH_CRURA)) < hiatusW &&
                                rho > RHO_CT - 0.14 && rho < RHO_CT + (o.hiatus_wide ? 0.34 : 0.24));
    const sb = [];
    for (const th of [TH_CAN_R - TH_LEAF_SECTOR, TH_CAN_R + TH_LEAF_SECTOR,
                      TH_CAN_L - TH_LEAF_SECTOR, TH_CAN_L + TH_LEAF_SECTOR]) sb.push(norm2pi(th));
    sb.sort((p, q) => p - q); sb.push(sb[0] + 2 * Math.PI);
    for (let k = 0; k + 1 < sb.length; k++) {
      const a = sb[k], b = sb[k + 1];
      if (b - a < 1e-6) continue;
      const nt = Math.max(8, Math.round((b - a) / 0.07));
      addS(g, 'septum_transversum',
        domeTerritory(t, a, b, () => 0, (th) => septOuter(th, t), thick, 0, 9, nt, keep, 'septum'));
    }
  }

  /* ---- PARTITION 2: the pleuropericardial membranes, plugging the CRANIAL waist ---- */
  if (t >= FIRST_T.pleuropericardial) {
    for (const sg of [-1, 1]) {
      const vW = sg * S_PP;
      const fr = castFrame(vW - 0.02, vW + 0.02, t, 2);       // ALWAYS increasing v: see below
      const Pc = fr.F.P[1], Nv = fr.F.N[1], Bv = fr.F.B[1];
      /* THE COLLAR STOPS SHORT OF THE MIDLINE. Drawn at 1.9 radii plus 0.30 it reached x = -0.38 from
         a centre at x = +0.49 — straight across the median plane and through the oesophagus, which the
         3.z audit reported as 'pleuropericardial in oesophagus'. So the outer edge is clipped to just
         inside the midline. What the picture then shows is a collar PLUGGING the canal rather than the
         full parasagittal sheet the real membrane is; declared in the scene's gaps[]. */
      const rIn = rOf(vW, t) * E.wPP;
      const rOut = rOf(vW, t) * 1.9 + 0.34;
      if (rOut - rIn < 0.01) continue;
      const NR = 7, NT = 26, A = grid3(NR, NT), Bg = grid3(NR, NT);
      /* (-d(theta)) x d(r) = N x B = D, so gridA is the face on the +D side and the offset must be
         +D for both sides. Multiplying by sg, as the first version did, made the right-hand plate
         inside-out and slab()'s flipped check said so. */
      const nrm = new T.Vector3().copy(fr.F.D[1]);
      for (let i = 0; i <= NR; i++) for (let j = 0; j <= NT; j++) {
        const th = -(j / NT) * 2 * Math.PI, rr = lerp(rIn, rOut, i / NR);
        const base = new T.Vector3().copy(Pc)
          .addScaledVector(Nv, rr * Math.cos(th)).addScaledVector(Bv, rr * Math.sin(th));
        A[GI(NT, i, j)] = base.clone().addScaledVector(nrm, TH_MEMB / 2);
        Bg[GI(NT, i, j)] = base.clone().addScaledVector(nrm, -TH_MEMB / 2);
      }
      /* CLIPPED AT THE MIDLINE BY A keep(), not by a radius cap. Capping the radius at |Pc.x| left a
         band only 0.07 wide for the vein to sit in, and the guard keeping the vein out of the cast's
         own cross-section then dropped the vein entirely - the adapter returned reason:'none' for
         `cardinal`, which is the player telling a student "there is no model of this structure" about
         one the scene names five times. Found by the adapter check and by nothing else. */
      /* CLAMPED, because slab() asks keep() about the cells one OUTSIDE the grid on every edge —
         that is how it decides where to put a rim — and an unclamped lookup there reads undefined
         and throws inside the render. */
      /* THE MIDLINE SLOT HAS TO CLEAR THE OESOPHAGUS, not just the median plane. Clipped at 0.08 the
         collar still crossed the oesophagus (3.z: 'oesophagus in pleuropericardial' at 0.132), which
         has radius R_OES about the midline. A slot of R_OES + 0.07 is also the right anatomy: the two
         membranes grow medially and fuse with the mesenchyme AROUND the oesophagus, so what belongs
         between them is the oesophagus and the mediastinum, not membrane. */
      const slot = R_OES + 0.07;
      const keepPlate = (i, j) => {
        const ii = i < 0 ? 0 : (i > NR ? NR : i), jj = j < 0 ? 0 : (j > NT ? NT : j);
        const x = Math.abs(A[GI(NT, ii, jj)].x);
        return x >= slot && x <= WX - WALL_H;
      };
      addS(g, 'pleuropericardial', slab(A, Bg, NR, NT, keepPlate, 'pleuropericardial', () => nrm.clone()));
      /* the common cardinal vein, which is WHY the fold is where it is, and the phrenic rides it */
      /* KEPT INSIDE THE MEMBRANE IT RIDES IN, which is the point of it: the pleuropericardial fold is
         where it is BECAUSE the common cardinal vein runs there. Drawn out to 0.86 of the plate's own
         radius it ran out through the body wall (0.25 of its vertices inside it) and in far enough to
         reach the oesophagus; both were found by the 3.z audit and neither by looking. */
      /* ...and it runs in the part of the collar that is OUTSIDE the canal, which is where a vein in
         a body-wall fold actually is. Drawn in from 0.62 of the collar's radius it crossed the
         pleural cast's own cross-section at the waist (3.z: 'cardinal in pleural_r'). */
      /* THE VEIN RUNS LATERALLY IN THE COLLAR, outside the canal's own calibre: a vein in a body-wall
         fold is in the wall, not across the opening. The lateral direction is MEASURED in the
         collar's own plane rather than assumed to be +N, because which of N and B points away from
         the midline depends on the transported frame. */
      const lat = new T.Vector3(Pc.x < 0 ? -1 : 1, 0, 0);
      lat.addScaledVector(nrm, -lat.dot(nrm));
      if (lat.lengthSq() < 1e-8) lat.copy(Nv); else lat.normalize();
      const tang = new T.Vector3().crossVectors(nrm, lat).normalize();
      const rVein = rOf(vW, t) + 0.10;
      if (rOut > rVein + 0.06) addS(g, 'cardinal', tube('cardinal', [
        new T.Vector3().copy(Pc).addScaledVector(lat, rOut * 0.92).addScaledVector(tang, 0.07),
        new T.Vector3().copy(Pc).addScaledVector(lat, 0.5 * (rOut + rVein)).addScaledVector(tang, -0.02),
        new T.Vector3().copy(Pc).addScaledVector(lat, rVein).addScaledVector(tang, -0.10),
      ], () => 0.048, { ring: 12 }));
    }
  }

  /* ---- PARTITION 3: the pleuroperitoneal membranes, closing the two canals ---- */
  if (t >= FIRST_T.pleuroperitoneal) {
    for (const side of ['r', 'l']) {
      const thC = side === 'r' ? TH_CAN_R : TH_CAN_L;
      let er = edgeRho(side, t);
      /* BOCHDALEK IS THIS SOLVE STOPPED SHORT. The free edge is held OUTSIDE the canal's own
         radius, so ROPEN never lets canalOpen() reach zero on this side and the canal stays open —
         which is the lesion, and it is the same arithmetic that closes it on the other side rather
         than a hole cut in a finished diaphragm. */
      if (o.bochdalek && side === 'l') er = Math.max(er, RHO_CANAL + BOCH_SHORT);
      addS(g, 'pleuroperitoneal',
        domeTerritory(t, thC - TH_LEAF_SECTOR, thC + TH_LEAF_SECTOR,
          () => er, () => 1.0, () => TH_MEMB, 0, 8, 20, null, 'leaf/' + side));
    }
  }

  /* ---- PARTITION 4: the muscular rim, and the crura ---- */
  if (t >= FIRST_T.muscular_rim) {
    const thick = (o.eventration ? 0.26 : 1) * TH_MUSC;
    const lift = (th) => leafSide(th) ? -(TH_MEMB + thick) / 2 - 0.005 : 0;
    /* THE RIM'S SECTORS ARE CUT AT THE TERRITORY BOUNDARIES, not at eight even steps. With even
       steps a sector straddles the edge of a leaf — so its LIFT, which is a per-slab scalar, is
       wrong over part of it — and skipping a whole sector because its midpoint fell in the crura
       left two 13.5-degree wedges covered by nothing at all. Coverage reported 0.974 against a floor
       of 0.980 and that is what found it; the wedges are invisible in any render, because they are
       narrow and the cavity casts do not pass through them. */
    const bounds = [];
    for (const th of [TH_CAN_R - TH_LEAF_SECTOR, TH_CAN_R + TH_LEAF_SECTOR,
                      TH_CAN_L - TH_LEAF_SECTOR, TH_CAN_L + TH_LEAF_SECTOR,
                      TH_CRURA - PHI_CR, TH_CRURA + PHI_CR]) bounds.push(norm2pi(th));
    bounds.sort((p, q) => p - q);
    bounds.push(bounds[0] + 2 * Math.PI);
    for (let k = 0; k + 1 < bounds.length; k++) {
      let a = bounds[k], b = bounds[k + 1];
      if (b - a < 1e-6) continue;
      const thm = 0.5 * (a + b);
      if (inCrura(thm)) continue;
      const keepRim = o.morgagni ? (rho, th) =>
        !(Math.abs(angDiff(th, TH_MORG)) < 0.21 && Math.abs(rho - RHO_MORG) < 0.13) : null;
      const nt = Math.max(6, Math.round((b - a) / 0.09));
      addS(g, 'muscular_rim',
        domeTerritory(t, a, b, (th) => rimInner(th, t), () => 1.0, () => thick, lift(thm), 6, nt, keepRim, 'rim'));
    }
    /* ONE CRURAL MASS WITH A HOLE IN IT, not two separate crura. Built as two slabs either side of
       the hiatus, the dorsal sector beyond the hiatus band was covered by nothing — the muscular rim
       skips the crural sectors, so a 0.30-radian wedge from rho 0.84 out to the rim was simply
       missing, and coverage reported 0.976 against a floor of 0.980. It is also the better anatomy:
       the crura arch OVER the oesophagus and decussate above it, so the hiatus is a hole in a
       continuous mass rather than a gap between two slips. */
    const hiatusW = (o.hiatus_wide ? 1.75 : 1) * HIATUS_HALF;
    const keepCr = (rho, th) => !(Math.abs(angDiff(th, TH_CRURA)) < hiatusW &&
                                  rho < RHO_CT + (o.hiatus_wide ? 0.34 : 0.24));
    addS(g, 'crura', domeTerritory(t, TH_CRURA - PHI_CR, TH_CRURA + PHI_CR,
      () => RHO_CT, () => 1.0, () => TH_CRUS, 0, 8, 16, keepCr, 'crura'));
  }

  /* ---- the phrenic nerve, solved, and the roots that never move ---- */
  if (t >= FIRST_T.phrenic) {
    for (const side of ['r', 'l']) {
      const ph = phrenicPath(side, t);
      for (const rt of ph.roots) {
        addS(g, 'phrenic', tube('phrenic', [rt, rt.clone().lerp(ph.junction, 0.55), ph.junction],
          () => 0.030, { ring: 10 }));
      }
      addS(g, 'phrenic', tube('phrenic', ph.P, () => 0.040, { ring: 12 }));
    }
    for (const sg of [-1, 1]) for (const n of ['C3', 'C4', 'C5']) {
      addS(g, 'somites', tube('somites', [
        new T.Vector3(sg * 0.14, LEV(n), -0.34), new T.Vector3(sg * 0.30, LEV(n), -0.30),
      ], () => 0.085, { ring: 12 }));
    }
  }

  /* ---- the viscera, so each cavity has something in it ---- */
  const V = visceraPaths(t);
  addS(g, 'heart', tube('heart', V.heart.P, u => V.heart.r * (0.78 + 0.34 * Math.sin(Math.PI * u))));
  if (t >= FIRST_T.lung_r) for (const sg of [-1, 1]) {
    const L = V.lung(sg);
    addS(g, sg < 0 ? 'lung_r' : 'lung_l', tube('lung', L.P, u => L.r * (0.70 + 0.44 * u)));
  }
  if (t >= FIRST_T.liver) addS(g, 'liver', tube('liver', V.liver.P, u => V.liver.r * (0.74 + 0.40 * Math.sin(Math.PI * u))));
  addS(g, 'gut', tube('gut', V.gut.P, () => V.gut.r, { ring: 16 }));
  addS(g, 'oesophagus', tube('oesophagus', V.oes.P, () => V.oes.r, { ring: 14 }));
  addS(g, 'endoderm', tube('endoderm', V.gut.P, () => V.gut.r * 0.72, { ring: 14 }));

  /* ---- the mesenteries. A MEMBRANE TAPERS where it meets what it suspends ---- */
  if (t >= FIRST_T.dorsal_mesentery) {
    const yTop = yw - 0.30, yBot = Y_CAUD + 0.34, NI = 8, NJ = 12;
    const mk = (ventral) => {
      const A = grid3(NI, NJ), B = grid3(NI, NJ);
      for (let i = 0; i <= NI; i++) for (let j = 0; j <= NJ; j++) {
        const u = i / NI, y = lerp(ventral ? yTop : yTop, ventral ? yTop - 0.72 : yBot, j / NJ);
        const zRoot = ventral ? 0.46 : -0.78;
        const z = lerp(zRoot, -0.20 + (ventral ? V.gut.r : -V.gut.r), u);
        const h = 0.055 * (1 - 0.90 * u * u);                 // tapers to nothing at the gut
        /* (-yhat) x (dz/di) is -xhat when z INCREASES with i (the dorsal sheet, root at z = -0.78)
           and +xhat when it decreases (the ventral sheet). So which side gridA is on is a property
           of the sheet, not a constant — the first version used +h/2 for both and the dorsal
           mesentery came out inside-out, with every normal self-consistent. */
        const sideA = ventral ? +1 : -1;
        A[GI(NJ, i, j)] = new T.Vector3(sideA * h / 2, y, z);
        B[GI(NJ, i, j)] = new T.Vector3(-sideA * h / 2, y, z);
      }
      const sA = ventral ? +1 : -1;
      return slab(A, B, NI, NJ, null, ventral ? 'ventral_mesentery' : 'dorsal_mesentery',
        () => new T.Vector3(sA, 0, 0));
    };
    addS(g, 'dorsal_mesentery', mk(false), { matOver: TRANSP(0.80), renderOrder: 5 });
    addS(g, 'ventral_mesentery', mk(true), { matOver: TRANSP(0.80), renderOrder: 5 });
  }

  /* ---- THE LESIONS. Each one's SITE is a triple point of the territory map, not a hole cut
          somewhere plausible, and each is a VARIANT asked for in the ref, never part of FULL.

          bochdalek  the pleuroperitoneal leaf stops short on the LEFT, so the canal never shuts.
                     The leaf above is built with its free edge held OUTSIDE the canal's own radius,
                     which is the same solve stopped short; the channel below is the hernia, and it
                     makes the left pleural and peritoneal cavities ONE cavity, which the component
                     probe counts. The site is where the leaf meets the costal rim posterolaterally
                     — the lumbocostal triangle — and it is read off RHO_M and the leaf's bearing.
          morgagni   a gap where the septum transversum meets the ventral body wall on the RIGHT:
                     the triple point of central tendon, costal rim and sternum, read off RHO_CT. */
  if (o.bochdalek) {
    const a = domePt(RHO_CANAL, TH_CAN_L, t, 0.34), b = domePt(RHO_CANAL, TH_CAN_L, t, -0.38);
    addS(g, 'bochdalek', tube('b', [a, domePt(RHO_CANAL, TH_CAN_L, t, 0), b], () => 0.17, { ring: 16 }));
  }
  if (o.morgagni) {
    const a = domePt(RHO_MORG, TH_MORG, t, 0.34), b = domePt(RHO_MORG, TH_MORG, t, -0.40);
    addS(g, 'morgagni', tube('m', [a, domePt(RHO_MORG, TH_MORG, t, 0), b], () => 0.14, { ring: 16 }));
  }
  return g;
}

/* ============================================================ MEASURING THE CAVITY

   THE CENTRAL PROBE IN THIS MODEL IS A COMPONENT COUNT, and it is taken off the BUILT TRIANGLES.
   Everything this scene teaches is one topological event in a particular order, so the honest
   measurement is: how many separate cavities are there? One at week 3, two once the pericardium is
   walled off, THREE while the right canal is shut and the left is not, four at the end — and three
   again with a Bochdalek hernia, because that is what the lesion IS.

   HOW. Voxels, with inside-ness by ray parity along +x against each key's own triangles, and the
   parity taken PER KEY and unioned afterwards. Per key matters: a point inside two overlapping casts
   has an EVEN crossing count, so one parity scan over all of them at once would read exactly the
   overlap — the voxel that decides whether two cavities are connected — as empty. Crossings are
   bucketed by the (y, z) line the ray runs along, so each triangle is touched once per grid line it
   covers rather than once per voxel.                                                               */

const CAVITY_KEYS = ['pericardial', 'pleural_r', 'pleural_l', 'peritoneal', 'bochdalek', 'morgagni'];

function trisByKey(group, keys) {
  const want = keys ? new Set(keys) : null, out = {};
  group.updateMatrixWorld(true);
  const v = new T.Vector3();
  group.traverse(o => {
    if (!o.isMesh || !o.geometry) return;
    const u = o.userData || {};
    if (u.outline || !u.key) return;
    if (want && !want.has(u.key)) return;
    const p = o.geometry.attributes.position;
    const arr = out[u.key] || (out[u.key] = []);
    for (let i = 0; i + 2 < p.count; i += 3) {
      const tri = [];
      for (let k = 0; k < 3; k++) { v.fromBufferAttribute(p, i + k).applyMatrix4(o.matrixWorld); tri.push(v.clone()); }
      arr.push(tri);
    }
  });
  return out;
}

function voxelise(byKey, keys, h) {
  let lo = [1e9, 1e9, 1e9], hi = [-1e9, -1e9, -1e9];
  for (const k of keys) for (const tri of (byKey[k] || [])) for (const p of tri) {
    lo[0] = Math.min(lo[0], p.x); hi[0] = Math.max(hi[0], p.x);
    lo[1] = Math.min(lo[1], p.y); hi[1] = Math.max(hi[1], p.y);
    lo[2] = Math.min(lo[2], p.z); hi[2] = Math.max(hi[2], p.z);
  }
  if (hi[0] < lo[0]) return null;
  for (let d = 0; d < 3; d++) { lo[d] -= 2 * h; hi[d] += 2 * h; }
  const n = [0, 1, 2].map(d => Math.max(2, Math.ceil((hi[d] - lo[d]) / h)));
  const [NX, NY, NZ] = n;
  const inside = new Uint8Array(NX * NY * NZ);
  const idx = (i, j, k) => (k * NY + j) * NX + i;
  for (const key of keys) {
    const tris = byKey[key] || []; if (!tris.length) continue;
    const lines = new Array(NY * NZ);
    for (const tri of tris) {
      const [a, b, c] = tri;
      const y0 = Math.min(a.y, b.y, c.y), y1 = Math.max(a.y, b.y, c.y);
      const z0 = Math.min(a.z, b.z, c.z), z1 = Math.max(a.z, b.z, c.z);
      const j0 = Math.max(0, Math.floor((y0 - lo[1]) / h)), j1 = Math.min(NY - 1, Math.ceil((y1 - lo[1]) / h));
      const k0 = Math.max(0, Math.floor((z0 - lo[2]) / h)), k1 = Math.min(NZ - 1, Math.ceil((z1 - lo[2]) / h));
      const d00 = b.y - a.y, d01 = b.z - a.z, d10 = c.y - a.y, d11 = c.z - a.z;
      const den = d00 * d11 - d10 * d01;
      if (Math.abs(den) < 1e-14) continue;                 // seen edge-on: contributes no crossing
      for (let j = j0; j <= j1; j++) for (let k = k0; k <= k1; k++) {
        const py = lo[1] + (j + 0.5) * h, pz = lo[2] + (k + 0.5) * h;
        const ry = py - a.y, rz = pz - a.z;
        const w1 = (ry * d11 - d10 * rz) / den, w2 = (d00 * rz - ry * d01) / den;
        if (w1 < 0 || w2 < 0 || w1 + w2 > 1) continue;
        const x = a.x + w1 * (b.x - a.x) + w2 * (c.x - a.x);
        const L = lines[k * NY + j] || (lines[k * NY + j] = []);
        L.push(x);
      }
    }
    for (let k = 0; k < NZ; k++) for (let j = 0; j < NY; j++) {
      const L = lines[k * NY + j]; if (!L || !L.length) continue;
      L.sort((p, q) => p - q);
      for (let i = 0; i < NX; i++) {
        const px = lo[0] + (i + 0.5) * h;
        let cross = 0;
        for (let m = L.length - 1; m >= 0; m--) { if (L[m] > px) cross++; else break; }
        if (cross & 1) inside[idx(i, j, k)] = 1;
      }
    }
  }
  return { inside, NX, NY, NZ, lo, h, idx };
}

/** 6-connected components of the inside set, biggest first. Fragments below `minVox` are reported
    separately rather than silently dropped: a stray island is a defect, not a rounding choice. */
function componentsOf(group, t, opts, h, minVox) {
  const byKey = trisByKey(group, CAVITY_KEYS);
  const V = voxelise(byKey, CAVITY_KEYS, h || 0.045);
  if (!V) return { count: 0, sizes: [], islands: 0, voxels: 0 };
  const { inside, NX, NY, NZ, idx } = V;
  const seen = new Uint8Array(inside.length);
  const sizes = [], stack = [];
  let total = 0;
  for (let i = 0; i < inside.length; i++) if (inside[i]) total++;
  for (let k = 0; k < NZ; k++) for (let j = 0; j < NY; j++) for (let i = 0; i < NX; i++) {
    const s = idx(i, j, k);
    if (!inside[s] || seen[s]) continue;
    let n = 0; stack.length = 0; stack.push([i, j, k]); seen[s] = 1;
    while (stack.length) {
      const [a, b, c] = stack.pop(); n++;
      const nb = [[a + 1, b, c], [a - 1, b, c], [a, b + 1, c], [a, b - 1, c], [a, b, c + 1], [a, b, c - 1]];
      for (const [x, y, z] of nb) {
        if (x < 0 || y < 0 || z < 0 || x >= NX || y >= NY || z >= NZ) continue;
        const q = idx(x, y, z);
        if (inside[q] && !seen[q]) { seen[q] = 1; stack.push([x, y, z]); }
      }
    }
    sizes.push(n);
  }
  sizes.sort((a, b) => b - a);
  const floor = minVox || Math.max(30, Math.round(0.004 * total));
  const big = sizes.filter(s => s >= floor);
  return { count: big.length, sizes: big, islands: sizes.length - big.length,
           islandSizes: sizes.filter(x => x < floor), floor: floor, voxels: total, h: V.h };
}

/** is every vertex of `a` inside `b`? Parity again, so it reads the built triangles and not a box.

    THE JITTER IS NOT COSMETIC, and leaving it out produced a false finding that cost a pass to run
    down. Row M reported 'lung_r in lung_l' at 0.825 on a model whose two lungs are 1.4 apart and on
    opposite sides of the midline. The cause: the two lungs are MIRROR IMAGES, so every vertex of one
    has exactly the same (y, z) as a vertex of the other, and a +x ray cast from a vertex of lung_r
    passes exactly through a VERTEX of lung_l — where it is counted once for each of the seven
    triangles meeting there. Seven is odd, so the parity said "inside".

    Any corpus full of bilaterally symmetric anatomy will hit this, so the fix is three rays at
    mutually irrational offsets with a majority vote, and the DISAGREEMENT RATE IS RETURNED rather
    than swallowed: RENDER-STANDARD, "A PROBE WITH A DEGENERATE CASE MUST REPORT THE DEGENERACY". A
    probe that silently votes 2-1 on every sample is measuring noise, and the caller can see that. */
const JITTER = [[0, 0], [7.13e-4, 3.17e-4], [-4.41e-4, 8.09e-4]];
function boxOf(tris) {
  const lo = [1e9, 1e9, 1e9], hi = [-1e9, -1e9, -1e9];
  for (const tri of tris) for (const p of tri) {
    if (p.x < lo[0]) lo[0] = p.x; if (p.x > hi[0]) hi[0] = p.x;
    if (p.y < lo[1]) lo[1] = p.y; if (p.y > hi[1]) hi[1] = p.y;
    if (p.z < lo[2]) lo[2] = p.z; if (p.z > hi[2]) hi[2] = p.z;
  }
  return { lo, hi };
}
function boxesMeet(p, q) {
  for (let d = 0; d < 3; d++) if (p.lo[d] > q.hi[d] + 1e-9 || q.lo[d] > p.hi[d] + 1e-9) return false;
  return true;
}
const _boxCache = new Map();
function cachedBox(byKey, k) {
  if (!_boxCache.has(byKey)) _boxCache.set(byKey, {});
  const c = _boxCache.get(byKey);
  if (!c[k]) c[k] = boxOf(byKey[k] || []);
  return c[k];
}
function insideFrac(byKey, a, b) {
  const A = byKey[a] || [], B = byKey[b] || [];
  if (!A.length || !B.length) return { frac: 0, split: 0, samples: 0 };
  /* THE BOUNDING-BOX PREFILTER IS WHAT MAKES ROW M AFFORDABLE: 3.z only asks about pairs whose boxes
     meet, and on 25 keys that is a handful of the 600 ordered pairs. It is a prefilter and not a
     test — a pair whose boxes meet still gets the full parity measurement. */
  if (!boxesMeet(cachedBox(byKey, a), cachedBox(byKey, b))) return { frac: 0, split: 0, samples: 0, skipped: true };
  let tot = 0, hit = 0, split = 0;
  const step = Math.max(1, Math.floor(A.length / 260));
  for (let i = 0; i < A.length; i += step) {
    const p = A[i][0]; tot++;
    let votes = 0;
    for (const [jy, jz] of JITTER) {
      const py = p.y + jy, pz = p.z + jz;
      let cross = 0;
      for (const tri of B) {
        const [u, v, w] = tri;
        const d00 = v.y - u.y, d01 = v.z - u.z, d10 = w.y - u.y, d11 = w.z - u.z;
        const den = d00 * d11 - d10 * d01;
        if (Math.abs(den) < 1e-14) continue;
        const ry = py - u.y, rz = pz - u.z;
        const w1 = (ry * d11 - d10 * rz) / den, w2 = (d00 * rz - ry * d01) / den;
        if (w1 < 0 || w2 < 0 || w1 + w2 > 1) continue;
        if (u.x + w1 * (v.x - u.x) + w2 * (w.x - u.x) > p.x) cross++;
      }
      if (cross & 1) votes++;
    }
    if (votes >= 2) hit++;
    if (votes === 1 || votes === 2) split++;
  }
  return { frac: tot ? hit / tot : 0, split: tot ? split / tot : 0, samples: tot };
}

/* 3.z — A MODEL THAT BUILDS MORE THAN ONE SOLID PROVES THEY DO NOT SHARE SPACE, and the exceptions
   are named rather than bought with a tolerance. Two kinds are CONSTRUCTION here and both are
   consequences of one declared approximation: THE CAST IS THE CAVITY'S EXTENT, NOT THE FILM. A real
   serous cavity is a potential space a few cells thick wrapped round a viscus; drawn that way it
   would be invisible, and no voxel probe at any resolution a browser can afford could count its
   components. So the cast is drawn as the solid volume the cavity occupies, the viscus it contains
   lies inside it by construction, and the two lie-detectors that matter are kept: no cast overlaps
   another cast except at an OPEN waist, and nothing outside this partition overlaps anything. */
/* THE PARTITION, PUBLISHED. 3.z: "Contact that is CONSTRUCTION rather than anatomy ... is excluded
   BY NAME, in a partition the row publishes, never by a tolerance. Anything left over is either a
   defect or a declared consequence of something the model does not build, and in the second case the
   row pins it at its measured size so it cannot grow."

   So there are two lists and no tolerances. CONTACT_OK is construction or anatomy that is MEANT to
   touch, grouped by the reason it touches. CONTACT_PINNED is the second case — real interpenetration
   that follows from an approximation this model makes on purpose — and each entry carries the
   measured ceiling it may not exceed.

   WHAT THE AUDIT ACTUALLY FOUND, recorded because the list below otherwise reads as if it had been
   written first: on its first run row M reported SIX genuine defects that no render and no other
   check had shown. The cavity casts and the diaphragm's own rim passed THROUGH the body wall, because
   the dome was wider than the wall's inner face. The lung bud ran through the pleuroperitoneal
   membrane and on into the peritoneal cavity. The common cardinal vein came out through the body wall
   at one end and reached the oesophagus at the other. All six are fixed in the geometry above, and
   they are the reason this row is worth its running cost. */
const G_CASTS = ['pericardial', 'pleural_r', 'pleural_l', 'peritoneal'];
const G_DIA = ['septum_transversum', 'pleuropericardial', 'pleuroperitoneal', 'muscular_rim', 'crura'];
const G_LIN = ['somatic', 'splanchnic'];
const G_VISC = ['heart', 'lung_r', 'lung_l', 'liver', 'gut', 'oesophagus', 'endoderm'];
const G_MESO = ['dorsal_mesentery', 'ventral_mesentery'];
const G_WALL = ['body_wall', 'ectoderm'];
const G_LES = ['bochdalek', 'morgagni'];

const CONTACT_RULES = [
  { a: G_CASTS, b: G_CASTS, why: 'two cavities either side of a waist, while that waist is OPEN — and the ' +
    'two peritoneal limbs once the ventral confluence has formed. This is the one pair the component ' +
    'probe exists to watch, and it is watched there rather than here' },
  { a: G_CASTS, b: G_DIA, why: 'a partition is the cavity\'s own floor or roof: the cast abuts it, and must' },
  { a: G_DIA, b: G_DIA, why: 'adjacent territories of ONE dome share a boundary face. A vertex on the shared ' +
    'boundary is inside its neighbour by definition, which is also why these are the pairs where the three ' +
    'jittered rays disagree most' },
  { a: G_DIA, b: G_WALL, why: 'the diaphragm is ATTACHED to the body wall round its whole costal margin, and ' +
    'the muscular rim grows in from exactly there' },
  { a: G_LIN, b: G_CASTS.concat(G_LIN, G_WALL, G_VISC, G_MESO, G_DIA),
    why: 'the mesothelium is a film on everything its cavity touches, and the two layers are CONTINUOUS with ' +
    'each other at the two reflection lines — which is why a mesentery has a root. It is drawn with ' +
    'thickness so a student can see it, and a film with thickness touches what it lines' },
  { a: G_CASTS, b: G_VISC, why: 'the viscus inside its cavity. THE CAST IS THE CAVITY\'S EXTENT, NOT THE ' +
    'FILM — the one approximation this model makes on purpose, and the one that makes a component count ' +
    'affordable at all' },
  { a: ['oesophagus'], b: ['gut', 'endoderm'], why: 'the oesophagus IS the gut tube\'s cranial continuation. ' +
    'They are one tube drawn as two keys so the hiatus has something to be measured against' },
  { a: ['endoderm'], b: ['gut'], why: 'the gut\'s own lining, inside its own wall' },
  { a: ['liver'], b: ['gut', 'endoderm'], why: 'the hepatic bud arises FROM the gut endoderm' },
  { a: G_MESO, b: G_CASTS.concat(['gut', 'endoderm', 'oesophagus'], G_DIA, G_MESO),
    why: 'a mesentery crosses the cavity it suspends its organ in, and is rooted on the partition above it' },
  { a: ['cardinal'], b: ['pleuropericardial'], why: 'the vein is CARRIED IN the membrane. That is why the fold ' +
    'is where it is, and beat 3 says so' },
  { a: ['pleuropericardial'], b: ['oesophagus'], why: 'the scene\'s own words: the pleuropericardial folds ' +
    '"fuse with the mesenchyme around the oesophagus". Contact at the fusion line IS the anatomy, and the ' +
    'collar is already cut back to a midline slot of R_OES + 0.07 so that it meets the oesophagus rather ' +
    'than engulfing it — before that slot existed this pair measured 0.132 and it is now 0.027' },
  { a: ['pleuroperitoneal'], b: ['oesophagus', 'dorsal_mesentery'], why: 'the same, one level down: the ' +
    'pleuroperitoneal membranes "fuse with the dorsal mesentery of the oesophagus" behind' },
  { a: ['phrenic'], b: ['pleuropericardial', 'septum_transversum', 'muscular_rim', 'somites', 'pericardial',
    'pleural_r', 'pleural_l', 'cardinal'],
    why: 'the nerve is carried on the membrane, runs on the pericardium between it and the pleura, inserts ' +
    'into the diaphragm, and its three roots emerge at their own somites. Every one of those is a contact ' +
    'the scene teaches' },
  { a: G_LES, b: G_CASTS.concat(G_DIA), why: 'a hernia IS a communication through a partition. That is the lesion' },
];
const CONTACT_OK = (() => {
  const out = [];
  for (const r of CONTACT_RULES) for (const a of r.a) for (const b of r.b) out.push([a, b, r.why]);
  return out;
})();
const CONTACT_PINNED = [
  ['ventral_mesentery', 'liver', 0.62,
   'THE LIVER DEVELOPS WITHIN THE VENTRAL MESENTERY — that is where the lesser omentum and the falciform ' +
   'ligament come from, and beat 5 narrates it. So the sheet really does pass through the organ, and the ' +
   'model does not build the liver as two lobes with the mesentery reflected over them. Pinned at its ' +
   'measured size rather than named away, because if it GROWS something else has moved'],
];
function contactAllowed(a, b) {
  return CONTACT_OK.some(r => (r[0] === a && r[1] === b) || (r[0] === b && r[1] === a));
}
function pinnedCeiling(a, b) {
  const r = CONTACT_PINNED.find(x => (x[0] === a && x[1] === b) || (x[0] === b && x[1] === a));
  return r ? r[2] : null;
}

/** is the diaphragm SOLID at this (rho, theta)? Tested along the dome's own normal, over a band, so
    that a territory which is deliberately stacked off the mid-surface (the muscular rim, lifted to
    the abdominal side of the membrane it reinforces) still counts as covering. */
const DIA_KEYS = ['septum_transversum', 'pleuroperitoneal', 'muscular_rim', 'crura'];
function diaphragmCoverage(group, t, opts) {
  const o = opts || {};
  const byKey = trisByKey(group, DIA_KEYS);
  const V = voxelise(byKey, DIA_KEYS, 0.042);
  if (!V) return { covered: 0, open: 1, samples: 0 };
  const { inside, NX, NY, NZ, lo, h, idx } = V;
  const at = p => {
    const i = Math.floor((p.x - lo[0]) / h), j = Math.floor((p.y - lo[1]) / h), k = Math.floor((p.z - lo[2]) / h);
    if (i < 0 || j < 0 || k < 0 || i >= NX || j >= NY || k >= NZ) return 0;
    return inside[idx(i, j, k)];
  };
  const hiatusW = (o.hiatus_wide ? 1.75 : 1) * HIATUS_HALF;
  const NRs = 16, NTs = 72;
  let wTot = 0, wCov = 0;
  for (let ir = 1; ir <= NRs; ir++) for (let it = 0; it < NTs; it++) {
    const rho = 0.04 + (0.94 - 0.04) * (ir - 0.5) / NRs, th = (it + 0.5) / NTs * 2 * Math.PI;
    /* the oesophageal hiatus is a hole BY DESIGN, so it is out of the denominator rather than
       quietly counted as a defect. It is measured on its own, by row K. */
    if (Math.abs(angDiff(th, TH_CRURA)) < hiatusW && rho > RHO_CT - 0.16 && rho < RHO_CT + 0.38) continue;
    const n = domeN(rho, th), base = domePt(rho, th, t, 0);
    let hit = 0;
    for (let m = -6; m <= 6; m++) {
      const p = base.clone().addScaledVector(n, m * 0.042);
      if (at(p)) { hit = 1; break; }
    }
    wTot += rho; wCov += rho * hit;
  }
  return { covered: wTot ? wCov / wTot : 0, open: wTot ? 1 - wCov / wTot : 1, samples: NRs * NTs };
}

/** the two linings, and WHICH SIDE each is on — the whole of "parietal outside, visceral inside" */
function liningSides(group) {
  const byKey = trisByKey(group, ['somatic', 'splanchnic']);
  const d = k => {
    const tris = byKey[k] || []; let s = 0, n = 0;
    for (const tri of tris) for (const p of tri) { s += 1 - Math.hypot(p.x / WX, p.z / WZ); n++; }
    return n ? s / n : null;
  };
  const som = d('somatic'), spl = d('splanchnic');
  return { somatic: som, splanchnic: spl, gap: (som == null || spl == null) ? null : spl - som,
           somaticTris: (byKey.somatic || []).length, splanchnicTris: (byKey.splanchnic || []).length };
}

/** the oesophagus's clearance in the hiatus, on the BUILT crura, over its own radius */
function hiatusClearance(group, t) {
  const byKey = trisByKey(group, ['crura', 'oesophagus']);
  const cr = byKey.crura || [], oe = byKey.oesophagus || [];
  if (!cr.length || !oe.length) return null;
  let best = 1e9;
  const step = Math.max(1, Math.floor(cr.length / 900));
  for (let i = 0; i < cr.length; i += step) {
    const p = cr[i][0];
    for (let j = 0; j < oe.length; j += Math.max(1, Math.floor(oe.length / 220))) {
      best = Math.min(best, p.distanceTo(oe[j][0]));
    }
  }
  return best / R_OES;
}

/** the centroid of a built key, from its own vertices */
function centroidOf(group, key) {
  const tris = (trisByKey(group, [key])[key]) || [];
  if (!tris.length) return null;
  const c = new T.Vector3(); let n = 0;
  for (const tri of tris) for (const p of tri) { c.add(p); n++; }
  return n ? c.divideScalar(n) : null;
}

/* ------------------------------------------------------------------- the floors

   IN ONE PLACE so the model, the harness and any review cannot drift apart about what passing
   means. RENDER-STANDARD: every assertion of the form "A is inside / beside / below B" carries a
   magnitude floor expressed as a fraction of the extent the claim is legible against, and a sign
   test written as "> 0" is UNPROVEN however true it is.                                            */
const FLOORS = {
  FLAPRES: 1e-8,   // the flap solve's own residual
  SLACKLO: 1.005, SLACKHI: 1.500, // the solved arc length over the chord it closes
  PHRES:  1e-5,    // the nerve relaxation's residual
  NERVEGROW: 2.00, // how many times its own length the nerve must grow as the diaphragm descends
  NERVEDET: 0.020, // ...and how far round the pericardial sac it must detour to do it
  WINDOW3: 0.030,  // how much of the process the THREE-cavity stage must last
  ROOTFIX: 1e-9,   // how far the cervical roots may move across all of t
  LEVBAND: 0.20,   // the septum's clearance inside the C3-C5 band, over that band's extent
  L1:     0.02,    // ...and how close it finishes to L1, over one segment
  COVER:  0.980,   // of the diaphragm that is solid at t = 1, away from the hiatus
  DEFECT: 0.020,   // ...and how much of it a lesion must leave open
  OPEN:   60,      // of 240 transverse rays that must escape before the folds meet
  HIAT:   0.12,    // the oesophagus's clearance in the hiatus, over its own radius
  HIATW:  1.60,    // ...and how much more the wide-hiatus variant must have
  LINING: 0.060,   // somatic nearer the body wall than splanchnic, in normalised radial units
  SIDEX:  0.300,   // a lesion's centroid |x|, over the dome's own half-width
  SIDEZ:  0.250,   // Morgagni ventral of Bochdalek, over the dome's half-depth
  SHARE:  0.020,   // the worst UNNAMED pair overlap, as a fraction of vertices
  SPLIT:  0.050,   // ...and how often the three jittered rays may disagree before the probe is noise
  CRES:   0,       // the component count must not change with the voxel size
  WAIST:  0.300,   // the canal's clear opening while open, over the cast's own diameter there
};

/* THE STAGES, AND WHY TWO OF THEM ARE DERIVED RATHER THAN CHOSEN.

   `rightShut` is the t at which there are THREE cavities: the right canal closed, the left not. It
   cannot be a constant, because when each canal closes is an output of the flap solve — so it is
   read off canalOpen(), as the midpoint of the interval between the two closures. If the solve ever
   changed, a hand-written 0.78 would quietly start pointing at a two- or a four-cavity moment and
   acceptance row C3 would fail for a reason that had nothing to do with the defect it exists to
   catch. `window3` is that interval's width, and row B floors it. */
const T_SHUT = (() => {
  const first = side => {
    let lo = 0, hi = 1;
    if (canalOpen(side, 1) > 0) return 1.01;
    for (let i = 0; i < 60; i++) { const mid = 0.5 * (lo + hi); if (canalOpen(side, mid) > 0) lo = mid; else hi = mid; }
    return hi;
  };
  const r = first('r'), l = first('l');
  return { r, l, window3: l - r, mid: 0.5 * (r + l) };
})();
const T_STAGE = {
  week3:    0.00,          // one horseshoe, open on both flanks
  sealed:   0.20,          // folding has sealed it; septum transversum in; two canals wide open
  lungs:    0.42,          // the lung buds are growing into the canals
  pericard: 0.52,          // the pleuropericardial membranes have fused — two cavities
  rightShut: T_SHUT.mid,   // DERIVED: the RIGHT canal closed and the LEFT not — three cavities
  bothShut: Math.min(1, T_SHUT.l + 0.02),
  week8:    1.00,          // muscle in, crura in, diaphragm at L1
};

const ACCEPTANCE = {
  axes: '+x = embryo LEFT, -x = RIGHT, +y = CRANIAL, +z = VENTRAL',
  t_meaning: 't = 0 one horseshoe coelom in week 3; t = 1 three serous cavities, diaphragm at L1, about week 8',
  tests: [
    { id: 'A', says: 'the pleuroperitoneal flap solve converged: the free edge reaches the oesophageal ' +
                     'mesentery AND arrives tangent to the septum it fuses with',
      must: '|residual| <= FLOORS.FLAPRES on all three conditions at once' },
    { id: 'A-slack', says: '...and the answer is that the membrane is LONGER than the gap it closes, ' +
                           'which is what the lung has to peel in',
      must: 'FLOORS.SLACKLO <= L*/chord <= FLOORS.SLACKHI — SOLVED, not chosen' },
    { id: 'B', says: 'the RIGHT canal closes BEFORE the left, which is why the common congenital ' +
                     'diaphragmatic hernia is left-sided',
      must: 'read off the solve: the interval in t during which the right canal is shut and the left ' +
            'is not is at least FLOORS.WINDOW3 of the whole process' },
    { id: 'C1', says: 'week 3: the coelom is ONE cavity',
      must: 'BUILT geometry, voxel parity per key then unioned: exactly 1 component at t = 0' },
    { id: 'C2', says: '...TWO once the pleuropericardial membranes have fused',
      must: 'exactly 2 components at t = T_STAGE.pericard' },
    { id: 'C3', says: '...THREE while the right canal is shut and the left is not. THIS ROW IS THE ' +
                      'RIGHT-BEFORE-LEFT CLAIM, and it is a count and not a caption',
      must: 'exactly 3 components at t = T_STAGE.rightShut' },
    { id: 'C4', says: '...and FOUR at the end: one pericardial, two pleural that do not communicate ' +
                      'with each other, one peritoneal',
      must: 'exactly 4 components at t = 1' },
    { id: 'D', says: 'a Bochdalek hernia is the LEFT canal never closing, so the left pleural and the ' +
                     'peritoneal cavity are ONE cavity',
      must: '3 components with {bochdalek:true} at t = 1, and the channel\'s centroid at x > 0 ' +
            '(the embryo\'s LEFT) by >= FLOORS.SIDEX of the dome\'s half-width' },
    { id: 'D2', says: 'a Morgagni hernia is on the RIGHT and VENTRAL — the relation the exam asks for',
      must: '3 components with {morgagni:true} at t = 1; its centroid at x < 0 by >= FLOORS.SIDEX, ' +
            'and ventral of the Bochdalek site by >= FLOORS.SIDEZ of the dome\'s half-depth' },
    { id: 'E', says: 'EVENTRATION IS THE DISCRIMINATOR: a diaphragm that is complete but thin and high, ' +
                     'so the cavity count does NOT change',
      must: 'still exactly 4 components with {eventration:true} at t = 1, and the muscular rim built ' +
            'thinner than it is without the flag' },
    { id: 'F', says: 'the body cavity is SEALED from the outside once the lateral folds have met',
      must: '0 of 240 transverse rays leaving the flank escape at t = 1' },
    { id: 'F-neg', says: '...and was not sealed in week 3 — the negative case for F',
      must: '>= FLOORS.OPEN of the same 240 rays escape at t = 0' },
    { id: 'F-ect', says: '...and ectopia cordis opens it again, over the pericardium',
      must: '>= FLOORS.OPEN rays escape from the PERICARDIAL station at t = 1 with {ectopia:true}' },
    { id: 'G', says: 'the finished diaphragm is SOLID, away from the oesophageal hiatus',
      must: 'BUILT territories, voxelised, sampled along the dome normal: covered >= FLOORS.COVER' },
    { id: 'G-neg', says: '...and a Bochdalek defect really is a hole in it — the negative case for G',
      must: 'open fraction with {bochdalek:true} >= FLOORS.DEFECT' },
    { id: 'H', says: 'the phrenic\'s roots NEVER MOVE. That is why C3, C4 and C5 keep the diaphragm alive',
      must: 'max |root(t) - root(0)| <= FLOORS.ROOTFIX over t in 0..1' },
    { id: 'H-band', says: '...and they lie inside the C3-C5 band, read off the model\'s own vertebral table',
      must: 'every root y inside [LEV(C5), LEV(C3)] with >= FLOORS.LEVBAND clearance of that band\'s extent' },
    { id: 'I', says: 'the septum transversum starts opposite C3-C5 and finishes at L1',
      must: 'Y_DIA(0) inside the C3-C5 band; |Y_DIA(1) - LEV(L1)| <= FLOORS.L1 * SEG' },
    { id: 'J', says: 'the nerve is STRETCHED DOWN BY THE DESCENT: it is tethered at a root that never ' +
                     'moves and at a target that travels the length of the trunk, so it grows, and ' +
                     'ends up several times its original length',
      must: 'len(t) non-decreasing for t >= T_MONO, and len(1)/len(0) >= FLOORS.NERVEGROW. The dip ' +
            'before T_MONO is real — the diaphragm starts level with the roots — and is published ' +
            'as J_dip rather than smoothed away' },
    { id: 'J-min', says: '...and it is never shorter than the straight line between its two ends, ' +
                         'which is the one thing a shortest path cannot be',
      must: 'len(t) >= |C4 root - insertion(t)| - 1e-9 at every t sampled' },
    { id: 'J-sac', says: '...and the SAC is what shapes it, which is why the pleuropericardial membrane ' +
                         'carries it and why it ends up on the fibrous pericardium',
      must: 'the solved path is longer than the straight line between its ends by >= FLOORS.NERVEDET, ' +
            'as a fraction of that line — i.e. the sac really is in the way and the nerve really does ' +
            'go round it. The fraction lying ON the surface is published alongside as J-sac_on' },
    { id: 'J-res', says: '...and the shortest-path relaxation converged, rather than returning its guess',
      must: 'residual <= FLOORS.PHRES at t = 0 and t = 1' },
    { id: 'K', says: 'the oesophagus passes through the hiatus, between the crura, with clearance',
      must: 'BUILT crura against BUILT oesophagus: least distance >= FLOORS.HIAT * R_OES' },
    { id: 'K-wide', says: '...and a congenitally WIDE hiatus has measurably more of it',
      must: 'clearance with {hiatus_wide:true} >= FLOORS.HIATW * the clearance without it' },
    { id: 'L', says: 'every serous cavity is lined the same way, and the SOMATIC layer is the one ' +
                     'against the body wall',
      must: 'BUILT linings: both present on all four casts, and mean normalised radial gap ' +
            '(splanchnic - somatic) >= FLOORS.LINING' },
    { id: 'M', says: 'no two solids share space except the pairs the model NAMES (3.z)',
      must: 'worst UNNAMED pairwise inside-fraction <= FLOORS.SHARE over the published partition, AND ' +
            'the three jittered rays disagree on at most FLOORS.SPLIT of samples — a probe that is ' +
            'voting 2-1 everywhere is measuring noise, not containment. Every offending pair is ' +
            'published in M_offenders, not just the worst one' },
    { id: 'M-pin', says: '...and every pair in CONTACT_PINNED — real interpenetration that follows from a ' +
                         'declared approximation — is still no bigger than the size it was pinned at',
      must: 'each pinned pair\'s measured inside-fraction <= its published ceiling' },
    { id: 'C-res', says: 'and the component count is a fact about the geometry, not about the voxel ' +
                         'size the probe happened to use',
      must: 'the counts at t = 1, and with {bochdalek:true}, are unchanged at a second resolution' },
    { id: 'N', says: 'the canal is a real opening while it is open, not a crack',
      must: 'the cast overlap at the caudal waist at t = T_STAGE.lungs >= FLOORS.WAIST * the cast\'s ' +
            'own diameter there' },
  ],
};

let _inAcceptance = false;
function acceptance(opts) {
  const o = opts || {}, light = !!o.light;
  const m = {}, ok = {};
  const was = _inAcceptance; _inAcceptance = true;
  try {
    /* ---- A: the flap solve ---- */
    m.A = FLAP.resid; m.A_lam = FLAP.lam; m.A_a = FLAP.a; m.A_L = FLAP.L; m.A_iters = FLAP.iters;
    m.A_alphaEnd = FLAP.alphaEnd; m.A_chord = FLAP.chord;
    ok.A = FLAP.resid <= FLOORS.FLAPRES;
    m['A-slack'] = FLAP.slack;
    ok['A-slack'] = FLAP.slack >= FLOORS.SLACKLO && FLAP.slack <= FLOORS.SLACKHI;

    /* ---- B: right before left, read off the solve ---- */
    const firstZero = side => {
      for (let i = 0; i <= 400; i++) { const tt = i / 400; if (canalOpen(side, tt) <= 1e-9) return tt; }
      return 1.01;
    };
    m.B_rightShutAt = T_SHUT.r; m.B_leftShutAt = T_SHUT.l;
    m.B_scanRight = firstZero('r'); m.B_scanLeft = firstZero('l');
    m.B = T_SHUT.window3;
    ok.B = m.B >= FLOORS.WINDOW3 && T_SHUT.l <= 1.0 && T_SHUT.r < T_SHUT.l;

    /* ---- N: the canal is a real opening while it is open (off the rows, not the mesh) ---- */
    const En = edges(T_STAGE.lungs);
    m.N = (2 * En.eR) / (2 * rOf(S_PT, T_STAGE.lungs));
    ok.N = m.N >= FLOORS.WAIST;

    /* ---- H, I, J: the nerve and the descent ---- */
    let rootMove = 0;
    const r0 = phrenicPath('r', 0).roots;
    for (let i = 0; i <= 10; i++) {
      const rs = phrenicPath('r', i / 10).roots;
      for (let k = 0; k < rs.length; k++) rootMove = Math.max(rootMove, rs[k].distanceTo(r0[k]));
    }
    m.H = rootMove; ok.H = rootMove <= FLOORS.ROOTFIX;
    const bandLo = LEV('C5'), bandHi = LEV('C3'), bandExt = bandHi - bandLo;
    let worstClear = 1e9;
    for (const rt of r0) worstClear = Math.min(worstClear, (rt.y - bandLo) / bandExt, (bandHi - rt.y) / bandExt);
    m['H-band'] = worstClear; ok['H-band'] = worstClear >= -1e-12;
    m.I_y0 = Y_DIA0; m.I_y1 = Y_DIA1; m.I_L1 = LEV('L1');
    m.I = Math.abs(Y_DIA1 - LEV('L1')) / SEG;
    ok.I = m.I <= FLOORS.L1 && Y_DIA0 >= bandLo - 1e-12 && Y_DIA0 <= bandHi + 1e-12;
    const p0 = phrenicPath('r', 0), p1 = phrenicPath('r', 1);
    m.J_len0 = p0.length; m.J_len1 = p1.length; m.J_descent = DESCENT;
    m.J = p1.length / p0.length;
    /* MONOTONE FROM T_MONO ON, and the early dip is reported rather than smoothed away. At t = 0
       the septum transversum is AT the level of the nerve's own roots, so the nerve is at its
       shortest; as the diaphragm descends past that level the path shortens very slightly before it
       starts to grow. That is a true consequence of the geometry, not a defect, so the claim is
       made where it is true and the dip is published as J_dip. */
    let mono = true, worstShort = 1e9, prev = -1, maxDip = 0, l0 = null;
    for (let i = 0; i <= 24; i++) {
      const tt = i / 24, pp = phrenicPath('r', tt);
      if (l0 == null) l0 = pp.length;
      if (tt >= T_MONO) { if (pp.length < prev - 1e-9) mono = false; prev = pp.length; }
      if ((l0 - pp.length) / l0 > maxDip) { maxDip = (l0 - pp.length) / l0; m.J_minAt = tt; m.J_minLen = pp.length; }
      worstShort = Math.min(worstShort, pp.length - pp.straight);
    }
    m.J_monotone = mono; m.J_dip = maxDip; m.J_monoFrom = T_MONO;
    m.J_detour1 = p1.detour;
    ok.J = m.J >= FLOORS.NERVEGROW && mono;
    m['J-min'] = worstShort; ok['J-min'] = worstShort >= -1e-9;
    m['J-sac'] = p1.detour; m['J-sac_on'] = p1.onSacFrac;
    ok['J-sac'] = p1.detour >= FLOORS.NERVEDET;
    m['J-res'] = Math.max(p0.resid, p1.resid); ok['J-res'] = m['J-res'] <= FLOORS.PHRES;

    /* ---- F: sealed, and the two negative cases ---- */
    const flankAt = t => { const p = pathAt(-0.70, t); return { x: p.x, z: p.z }; };
    const periAt = t => { const p = pathAt(0, t); return { x: p.x, z: p.z }; };
    m.F = escapes(1, flankAt(1), {}).escapes; ok.F = m.F === 0;
    m['F-neg'] = escapes(0, flankAt(0), {}).escapes; ok['F-neg'] = m['F-neg'] >= FLOORS.OPEN;
    m['F-ect'] = escapes(1, periAt(1), { ectopia: true }).escapes;
    m['F-ect'] = Math.max(m['F-ect'], escapes(1, periAt(1), { ectopia: true }).escapes);
    ok['F-ect'] = m['F-ect'] >= FLOORS.OPEN;
    m.F_periSealed = escapes(1, periAt(1), {}).escapes;
    ok.F_periSealed = m.F_periSealed === 0;

    if (light) { _inAcceptance = was; return { measured: m, pass: ok, allPass: Object.keys(ok).every(k => ok[k]), light: true }; }

    /* ---- C, D, E: the component counts. THE CENTRAL PROOF. ---- */
    const comp = (t, fl) => componentsOf(buildCoelom(t, Object.assign({}, FULL_SET, fl || {})), t, fl, 0.045);
    const c1 = comp(0), c2 = comp(T_STAGE.pericard), c3 = comp(T_STAGE.rightShut), c4 = comp(1);
    m.C1 = c1.count; m.C2 = c2.count; m.C3 = c3.count; m.C4 = c4.count;
    m.C_sizes = { t0: c1.sizes, pericard: c2.sizes, rightShut: c3.sizes, week8: c4.sizes };
    m.C_islands = { t0: c1.islands, pericard: c2.islands, rightShut: c3.islands, week8: c4.islands };
    ok.C1 = c1.count === 1; ok.C2 = c2.count === 2; ok.C3 = c3.count === 3; ok.C4 = c4.count === 4;

    const gB = buildCoelom(1, Object.assign({}, FULL_SET, { bochdalek: true }));
    const gM = buildCoelom(1, Object.assign({}, FULL_SET, { morgagni: true }));
    const gE = buildCoelom(1, Object.assign({}, FULL_SET, { eventration: true }));
    const dB = componentsOf(gB, 1, { bochdalek: true }, 0.045);
    const dM = componentsOf(gM, 1, { morgagni: true }, 0.045);
    const dE = componentsOf(gE, 1, { eventration: true }, 0.045);
    const cB = centroidOf(gB, 'bochdalek'), cM = centroidOf(gM, 'morgagni');
    m.D = dB.count; m.D_x = cB ? cB.x / A_DIA : null; m.D_z = cB ? cB.z : null;
    ok.D = dB.count === 3 && cB != null && (cB.x / A_DIA) >= FLOORS.SIDEX;
    m.D2 = dM.count; m.D2_x = cM ? cM.x / A_DIA : null;
    m.D2_dz = (cM && cB) ? (cM.z - cB.z) / B_DIA : null;
    ok.D2 = dM.count === 3 && cM != null && (-cM.x / A_DIA) >= FLOORS.SIDEX &&
            m.D2_dz != null && m.D2_dz >= FLOORS.SIDEZ;
    m.E = dE.count;
    const rimTris = g => ((trisByKey(g, ['muscular_rim']).muscular_rim) || []).length;
    const gN = buildCoelom(1, FULL_SET);
    m.E_rimThinner = true;
    {
      const box = k => {
        const tris = (trisByKey(k === 'e' ? gE : gN, ['muscular_rim']).muscular_rim) || [];
        let lo = 1e9, hi = -1e9;
        for (const tri of tris) for (const p of tri) { lo = Math.min(lo, p.y); hi = Math.max(hi, p.y); }
        return hi - lo;
      };
      m.E_rimY_normal = box('n'); m.E_rimY_event = box('e');
      m.E_rimTris = { normal: rimTris(gN), eventration: rimTris(gE) };
      m.E_rimThinner = m.E_rimY_event < m.E_rimY_normal;
    }
    ok.E = dE.count === 4 && m.E_rimThinner;

    /* ---- G: the diaphragm is solid ---- */
    const cov = diaphragmCoverage(gN, 1, {});
    const covB = diaphragmCoverage(gB, 1, { bochdalek: true });
    m.G = cov.covered; ok.G = cov.covered >= FLOORS.COVER;
    m['G-neg'] = covB.open; ok['G-neg'] = covB.open >= FLOORS.DEFECT;

    /* ---- K: the hiatus ---- */
    const gW = buildCoelom(1, Object.assign({}, FULL_SET, { hiatus_wide: true }));
    m.K = hiatusClearance(gN, 1); m.K_wide = hiatusClearance(gW, 1);
    ok.K = m.K != null && m.K >= FLOORS.HIAT;
    m['K-wide'] = (m.K && m.K_wide) ? m.K_wide / m.K : null;
    ok['K-wide'] = m['K-wide'] != null && m['K-wide'] >= FLOORS.HIATW;

    /* ---- L: the two linings ---- */
    const ls = liningSides(gN);
    m.L = ls.gap; m.L_somatic = ls.somatic; m.L_splanchnic = ls.splanchnic;
    m.L_tris = { somatic: ls.somaticTris, splanchnic: ls.splanchnicTris };
    ok.L = ls.gap != null && ls.gap >= FLOORS.LINING && ls.somaticTris > 0 && ls.splanchnicTris > 0;

    /* ---- M: 3.z, no unnamed pair shares space ---- */
    const allKeys = Object.keys(trisByKey(gN, null));
    const byAll = trisByKey(gN, null);
    let worst = 0, worstPair = null, worstSplit = 0, worstSplitAny = 0;
    const offenders = [], pinRows = [], pinBad = [];
    for (let i = 0; i < allKeys.length; i++) for (let j = 0; j < allKeys.length; j++) {
      if (i === j) continue;
      const a = allKeys[i], b = allKeys[j];
      if (contactAllowed(a, b)) continue;
      const f = insideFrac(byAll, a, b);
      if (f.skipped) continue;
      const cap = pinnedCeiling(a, b);
      if (cap != null) {
        pinRows.push([a + ' in ' + b, +f.frac.toFixed(4), cap]);
        if (f.frac > cap) pinBad.push(a + ' in ' + b + ' = ' + f.frac.toFixed(4) + ' > ' + cap);
        continue;
      }
      if (f.frac > worst) { worst = f.frac; worstPair = a + ' in ' + b; worstSplit = f.split; }
      if (f.frac > FLOORS.SHARE) offenders.push([a + ' in ' + b, +f.frac.toFixed(4), +f.split.toFixed(4)]);
      worstSplitAny = Math.max(worstSplitAny, f.split);
    }
    offenders.sort((x, y) => y[1] - x[1]);
    m.M = worst; m.M_pair = worstPair; m.M_split = worstSplit; m.M_worstSplitAny = worstSplitAny;
    m.M_offenders = offenders.slice(0, 24); m.M_offenderCount = offenders.length;
    ok.M = worst <= FLOORS.SHARE && worstSplitAny <= FLOORS.SPLIT;
    m['M-pin'] = pinRows; m['M-pin_bad'] = pinBad; ok['M-pin'] = pinBad.length === 0;

    /* ---- C-res: the count is a fact about the geometry, not about the voxel size ---- */
    const c4b = componentsOf(gN, 1, {}, 0.038);
    const dBb = componentsOf(gB, 1, { bochdalek: true }, 0.038);
    m['C-res'] = [c4b.count, dBb.count]; m['C-res_h'] = [0.045, 0.038];
    ok['C-res'] = c4b.count === m.C4 && dBb.count === m.D;
  } finally { _inAcceptance = was; }
  return { measured: m, pass: ok, allPass: Object.keys(ok).every(k => ok[k]) };
}

/* ------------------------------------------- the scene's claims, as functions of t

   ONE VOCABULARY, and every entry is a pure function of t read off the same path, solve and profile
   the geometry is built from — never a constant restated. RENDER-STANDARD section 3: the tool
   evaluates each beat's claims at its own SET_STAGE t and then DISPLACES the beat and requires at
   least one to break, so a measure that barely moves with t is no use here however true it is.

   NOTHING HERE BUILDS GEOMETRY. check-beat-claims runs this in a vm sandbox; the rows that read the
   built meshes live in acceptance() instead, which is where the harness calls them.                */
function claimMeasure(name, t) {
  const E = edges(t);
  switch (name) {
    case 'coelom.canal_open_r':      return canalOpen('r', t);
    case 'coelom.canal_open_l':      return canalOpen('l', t);
    case 'coelom.pp_open':           return openFrac(t, T_PP);
    case 'coelom.waist_gap_r':       return E.eR;
    case 'coelom.waist_gap_l':       return E.eL;
    case 'coelom.waist_gap_pp':      return E.ePP;
    case 'coelom.cross_half':        return crossHalf(t);
    case 'coelom.escapes_at_flank': {
      const p = pathAt(-0.70, t); return escapes(t, { x: p.x, z: p.z }, {}).escapes;
    }
    case 'coelom.escapes_at_pericardium': {
      const p = pathAt(0, t); return escapes(t, { x: p.x, z: p.z }, {}).escapes;
    }
    /* THE VARIANT HAS ITS OWN MEASURE, because a claim about what the ectopia-cordis build shows
       cannot be certified by a number taken off the normal one. Written this way after noticing that
       the obvious phrasing — "with the wall open, rays escape" measured against escapes_at_pericardium
       — reads 0 and PASSES an atMost claim while saying the opposite of what it measures. That is the
       shape of defect RENDER-STANDARD 3.aa is about, arrived at from the scene side. */
    case 'coelom.escapes_at_pericardium_ectopia': {
      const p = pathAt(0, t); return escapes(t, { x: p.x, z: p.z }, { ectopia: true }).escapes;
    }
    case 'wall.slot_half_rad':       return slotHalf(t);
    case 'dia.y':                    return Y_DIA(t);
    case 'dia.descent_frac':         return (Y_DIA0 - Y_DIA(t)) / DESCENT;
    case 'dia.segments_below_c4':    return (Y_DIA0 - Y_DIA(t)) / SEG;
    case 'dia.muscle_progress':      return muscleProg(t);
    case 'dia.septum_outer_rho_ventral': return septOuter(Math.PI / 2, t);
    case 'leaf.edge_rho_r':          return edgeRho('r', t);
    case 'leaf.edge_rho_l':          return edgeRho('l', t);
    case 'phrenic.length':           return phrenicPath('r', t).length;
    case 'phrenic.growth_over_start':  return phrenicPath('r', t).length / phrenicPath('r', 0).length;
    case 'phrenic.on_sac_frac':        return phrenicPath('r', t).onSacFrac;
    case 'phrenic.sac_detour':         return phrenicPath('r', t).detour;
    case 'cavity.pericardial_r':     return R_PERI(t);
    case 'cavity.pleural_r':         return R_PLEU(t);
    case 'cavity.peritoneal_r':      return R_PERIT(t);
  }
  throw new Error('unknown measure: ' + name);
}

/* --------------------------------------------------------- the provider contract */

const FULL_SET = { linings: true, wall: true };
/* how much correcting fixWinding() had to do, so the kit finding has a number attached to it in the
   report rather than only in a comment */
function windingStats() { return { seen: _windingSeen, fixed: _windingFixed }; }

let _asserted = false;
function assertAcceptance() {
  if (_asserted || _inAcceptance) return;
  _asserted = true;
  try {
    const r = acceptance({ light: true });
    if (!r.allPass) {
      const bad = Object.keys(r.pass).filter(k => !r.pass[k]).join(', ');
      console.warn('[body-cavity-coelom] ACCEPTANCE FAILED for ' + bad +
        ' — the solved partitioning no longer satisfies the anatomy it was solved against.', r.measured);
    }
  } catch (e) { /* never let a self-check break a render */ }
}

function build(t, opts) { assertAcceptance(); return buildCoelom(t, opts); }

window.MB3D_MODELS = window.MB3D_MODELS || {};
window.MB3D_MODELS['body-cavity-coelom'] = {
  LAYERS: LAYERS,
  build: build,
  /* Every BENIGN optional layer on, so a structure behind a flag is still resolvable and the player
     never tells a student "there is no model of this" about a model sitting right there. The
     LESIONS are deliberately not here: the adapter builds FULL once and slices by key, so a defect
     in FULL would punch a hole in the diaphragm of every view in the corpus. They are VARIANTS,
     asked for in the ref — "body-cavity-coelom#bochdalek@1+bochdalek". */
  FULL: { linings: true, wall: true },
  VARIANTS: {
    bochdalek:    'the LEFT pleuroperitoneal membrane never closes its canal: the commonest congenital ' +
                  'diaphragmatic hernia, posterolateral and left',
    morgagni:     'a gap where the central tendon meets the costal rim on the RIGHT, ventrally: ' +
                  'retrosternal, right, often silent for years',
    eventration:  'the muscle never grows in: a diaphragm that is COMPLETE but thin and high, which ' +
                  'is why it does not change the cavity count',
    hiatus_wide:  'a congenitally wide oesophageal hiatus',
    ectopia:      'the ventral body wall never closes over the pericardium — ectopia cordis',
  },
  /* WHICH PARTS DO NOT MOVE WITH t, AND WHICH ARE NOT THERE AT EVERY t. Declared rather than
     discovered: a part that quietly built the same geometry at every t would sit still while its
     neighbours walked the stages and the picture would look fine, and a part that quietly built
     NOTHING would reach a student through the adapter as "there is no model of this structure",
     which is a fact about the corpus and not about the week. The harness asserts both against the
     real adapter: an undeclared static part, or an undeclared absence, FAILS the build. */
  /* ONLY THE SOMITES STAND STILL, and the first version of this list said the gut, the oesophagus
     and the endoderm did too. They do not: all three hang off the diaphragm's own level, so they
     DESCEND with it, which is right - the gut does not stay in the neck. The adapter check is what
     said so, by loading each ref at two values of t and comparing the vertices against this list. */
  STATIC_PARTS: {
    somites: 'the C3-C5 somites are the LANDMARK the nerve\'s fixed origin is read against, so they ' +
             'must not move: that they do not IS acceptance row H',
  },
  STAGE_LIMITED: FIRST_T,
  AXES: AXES,
  VIEW_DIR: VIEW_DIR,
  FLOORS: FLOORS,
  T_STAGE: T_STAGE,
  ACCEPTANCE: ACCEPTANCE,
  acceptance: acceptance,
  claimMeasure: claimMeasure,
  /* the caudal waist's point, direction and calibre, so the harness can re-measure the canal's
     opening ALONG THE PATH on real mesh vertices instead of in y - not the same thing when the path
     is oblique. The first mesh re-measurement of row N read 0.189 against a proxy of 0.339 for
     exactly that reason, and the PROXY was the one that was right. */
  waistAt: (t) => {
    const h = 0.004, a = pathAt(S_PT - h, t), b = pathAt(S_PT + h, t);
    const d = new T.Vector3().subVectors(b, a).normalize();
    return { p: { x: pathAt(S_PT, t).x, y: pathAt(S_PT, t).y, z: pathAt(S_PT, t).z },
             d: { x: d.x, y: d.y, z: d.z }, r: rOf(S_PT, t) };
  },
  rootY: () => ['C3', 'C4', 'C5'].map(n => LEV(n)),
  solved: () => ({ flap: FLAP, rhoCanal: RHO_CANAL, rhoFlapTable: RHO_FLAP,
                   phrenic0: (() => { const p = phrenicPath('r', 0); return { length: p.length, resid: p.resid }; })(),
                   phrenic1: (() => { const p = phrenicPath('r', 1); return { length: p.length, resid: p.resid }; })(),
                   descent: DESCENT, levels: { C3: LEV('C3'), C4: LEV('C4'), C5: LEV('C5'), L1: LEV('L1') } }),
  CONTACT_OK: CONTACT_OK,
  CAVITY_KEYS: CAVITY_KEYS,
  componentsOf: componentsOf,
  windingStats: windingStats,
  diaphragmCoverage: diaphragmCoverage,
  trisByKey: trisByKey,
  insideFrac: insideFrac,
  contactAllowed: contactAllowed,
};
})();
