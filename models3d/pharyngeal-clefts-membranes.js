/* MedBank · pharyngeal clefts & membranes — PRODUCTION procedural model.
 *
 * Registers itself as MB3D_MODELS['pharyngeal-clefts-membranes'], which is the whole contract the
 * procedural provider in viz3d.js depends on: a LAYERS palette and build(t, opts) -> THREE.Group
 * whose meshes carry userData.key.
 *
 * WRAPPED IN AN IIFE. Only the registration escapes. RENDER-STANDARD: a model written at top level
 * puts T, K, C, LAYERS and every constant into global lexical scope, and the second model to load —
 * written the obvious way, `const T = window.THREE` — dies on "Identifier 'T' has already been
 * declared" and takes the page with it.
 *
 * CONVERTED FROM AN SVG SEQUENCE SCENE. The scene authored 2026-08-28 had fourteen structures[] that
 * were teaching BEATS, not anatomical parts — cleft_plan, cleft_fate_rule, membrane_plan,
 * cleft_vs_pouch, neck_lump_differential and cleft_summary have no geometry and never could. This
 * file builds the PARTS; the narration those six carried moved verbatim onto the views that replaced
 * them, or into scene.deferred_beats where no view could honestly carry it.
 *
 * ── ONE EMBRYO, TWO SCENES ───────────────────────────────────────────────────────────────────────
 *
 * The frame law below — DAY0/DAY1, CRL_ANCHORS, F_SPAN, F_WIDTH, NSEG, WALLF, FLAT_PH, TAPER, GEOM,
 * F_CLEFT and cleftPoint — is COPIED FROM models3d/pharyngeal-pouches.js DELIBERATELY AND
 * VERBATIM, not re-derived. The two files describe the same apparatus at the same days: pouches is
 * the inside of it and this is the outside. A student who opens both scenes in one sitting must see
 * ONE embryo, and two independently tuned frames would give them two. Row W asserts the agreement
 * rather than trusting this comment: the harness loads BOTH models and requires this model's cleft-1
 * floor to coincide with the pouches model's, at a shared day, to within a thousandth of an
 * intersegment. That check is new in this corpus and it is the reason the duplication is a copy
 * rather than a rewrite — a copy can be checked for drift, and a rewrite cannot.
 *
 * ── THE MECHANISM, AND THE NUMBER A STUDENT IS MARKED WRONG FOR ──────────────────────────────────
 *
 * The whole of cleft anatomy reduces to one rule: ONLY THE FIRST CLEFT PERSISTS. That is the fact an
 * exam asks for, so it is the fact this model must not be allowed to assume.
 *
 * THIS FILE CONTAINS NO STATEMENT THAT CLEFT 1 SURVIVES. It carries two independent anatomical
 * statements instead —
 *
 *      the four clefts sit at the internal divisions of five equal intersegments, so cleft 1 is the
 *        most CRANIAL of the four (the same construction rule the pouches model uses, row P);
 *      the operculum is a flap of the SECOND arch, hinged along that arch's own bar, which grows
 *        caudally until it meets the epipericardial ridge below arch 4
 *
 * — and then MEASURES, by ray cast against the built flap, which clefts end up buried under it, and
 * SOLVES the day each one is buried by bisection. Cleft 1 lies 0.5 of an intersegment CRANIAL of the
 * hinge, so the flap grows away from it and it is never covered: rows O-order and O-survivor read
 * that off the geometry. Row O-hinge is the perturbation that proves it is a measurement and not a
 * restatement — move the hinge up one intersegment, to arch 1, and cleft 1 IS buried and the
 * survivor row FAILS. The survivor's identity is a consequence of where the flap is hinged, which is
 * what the narration says it is.
 *
 * ── WHAT t MEANS, AND THE ONE PLACE THIS MODEL CANNOT FOLLOW ITS OWN NARRATION ───────────────────
 *
 * t = 0 is DAY 22, t = 1 is DAY 56 — the same window as the pouches model, which is the window the
 * apparatus exists in. Clefts form through weeks 4 and 5, the operculum fuses and the cervical sinus
 * is obliterated by about week 7, and all of that is inside it.
 *
 * THE MEATAL PLUG RECANALISES AT ABOUT WEEK 28, WHICH IS OUTSIDE IT, AND THIS MODEL DOES NOT
 * PRETEND OTHERWISE. Days 56 to 196 are not reachable by t and would need a fetal head this file
 * does not build; extending t to cover them would mean inventing 140 days of head and neck growth to
 * carry one topological change. So the plug and the patent canal are TWO KEYS rather than two
 * samples of one function — `meatal_plug`, a solid cord, and `meatus_lumen`, the canal that exists
 * after it breaks down — drawn at the same place and the same scale, which is what a textbook's
 * two-panel figure does. They occupy the same space by construction and are therefore excluded BY
 * NAME from row Z's containment partition, and the scene never shows both in one beat: the render
 * harness asserts that, because the exclusion is only honest if nothing draws them together. The
 * shortfall is stated in the scene's gaps[] in the terms a student could be misled by, which is
 * that the second panel is a LATER stage drawn at this stage's size and not a day-56 appearance.
 *
 * ── AXES ─────────────────────────────────────────────────────────────────────────────────────────
 *
 * +x = embryo's LEFT, -x = RIGHT, +y = CRANIAL, +z = VENTRAL. The corpus convention.
 *
 * THIS MODEL CANNOT WITNESS ITS OWN HANDEDNESS and says so rather than pretending. RENDER-STANDARD:
 * "A model with no chiral content cannot witness its own handedness, and an acceptance test written
 * in the same coordinates as the declaration is circular." Every structure here is built as a
 * mirror-symmetric PAIR about x = 0 — four PAIRS of clefts, and branchial anomalies that are
 * bilateral in about 10% of cases and have no preferred side — so flipping the sign of x in this
 * header would leave every acceptance row passing and change nothing visible. The model therefore
 * carries NO narration claim that names a side, row Y asserts the symmetry it does have rather than
 * a handedness it does not, and the scene's gaps[] records that any future side-naming claim here
 * would be UNPROVEN.
 *
 * ── UNITS ────────────────────────────────────────────────────────────────────────────────────────
 *
 * Millimetres at the embryo's own size, built at 30 units to the millimetre. The reason for the
 * build unit is a measured defect in render-kit.js's `triN` degeneracy guard, which is absolute
 * rather than relative to the triangle's own edges: models3d/pharyngeal-pouches.js documents it in
 * full and this file inherits both the problem and the 30x workaround. Row T-poles asserts the
 * margin rather than trusting it — a key's triangle count must be identical at every sampled day,
 * which is the signature a silently dropped dome-pole fan breaks.
 *
 * ── HARNESS NOTE ─────────────────────────────────────────────────────────────────────────────────
 *
 * RENDER-STANDARD section 7: VizKit.fitCamera is blind to the view direction and is 2.2x too close
 * from `lateral` on an anisotropic subject. Every beat in this scene stands at `lateral` or
 * `anterior`, so the harness copies viz3d.js's own distanceForBox and never calls fitCamera.
 */
(function () {

const T = window.THREE;
const K = window.VizKit;   // render-kit.js must load first — it owns winding, normals and colour

/* ══════════════════════════════════════════════════════════════════ palette

   ECTODERM AND ENDODERM CARRY THE TWO FILLS THE POUCHES SCENE USES, AND THE MESODERM A THIRD, and
   that is a requirement rather than taste. The scene's own gaps[] says it: "the whole teaching value
   of the tympanic membrane panel is that a student can count three fills in one structure; a drawing
   that colours it uniformly teaches nothing that the sentence did not already say." So the membrane
   is three keys in three colours, and each one is the colour of the germ layer it came from —
   ectoderm blue like the clefts, endoderm pink like the pharyngeal wall, mesoderm its own cream. */
const LAYERS = {
  wall:        { color: 0xd9a48a, name: 'Pharyngeal endoderm' },
  arches:      { color: 0x9aa3ae, name: 'Pharyngeal arches' },
  ectoderm:    { color: 0x5b7fa6, name: 'Ectoderm — the first cleft' },
  ectoderm2:   { color: 0x4a6b8c, name: 'Ectoderm — the lower clefts' },
  midline:     { color: 0x9aa6bf, name: 'Median plane' },
  operculum:   { color: 0x2874a6, name: 'Operculum — the second arch flap' },
  ridge:       { color: 0x7f8c8d, name: 'Epipericardial ridge' },
  sinus:       { color: 0x117864, name: 'Cervical sinus' },
  plug:        { color: 0xd98880, name: 'Meatal plug' },
  lumen:       { color: 0xf2d7d5, name: 'External acoustic meatus — recanalised' },
  hillock:     { color: 0xe59866, name: 'Auricular hillocks' },
  pouch1:      { color: 0xc0392b, name: 'Pouch 1 — tubotympanic recess' },
  pouch2:      { color: 0xe67e22, name: 'Pouch 2 — tonsillar fossa' },
  tm_ecto:     { color: 0x5b7fa6, name: 'Tympanic membrane — outer, ectoderm' },
  tm_meso:     { color: 0xe8d9b0, name: 'Tympanic membrane — middle, fibrous (mesoderm)' },
  tm_endo:     { color: 0xd9a48a, name: 'Tympanic membrane — inner, mucosa (endoderm)' },
  memb_lower:  { color: 0xbfa98a, name: 'Membranes 2–4 — they break up' },
  cyst:        { color: 0xcb4335, name: 'Branchial cyst' },
  tract:       { color: 0xe74c3c, name: 'Branchial sinus' },
  fistula:     { color: 0xf1948a, name: 'Branchial fistula' },
  carotid_i:   { color: 0x884ea0, name: 'Internal carotid artery' },
  carotid_e:   { color: 0xaf7ac5, name: 'External carotid artery' },
};

/* ══════════════════════════════════════════════════════════════════ time and growth
   COPIED FROM pharyngeal-pouches.js — see "ONE EMBRYO, TWO SCENES" above. Row W checks the copy. */

const DAY0 = 22, DAY1 = 56;
const clamp01 = x => x < 0 ? 0 : x > 1 ? 1 : x;
const dayOf   = t => DAY0 + (DAY1 - DAY0) * clamp01(t);
const tOfDay  = d => (d - DAY0) / (DAY1 - DAY0);

const CRL_ANCHORS = [[22, 2.0], [35, 8.0], [56, 30.0]];

function fitLogLinear(anchors) {
  const n = anchors.length;
  let sx = 0, sy = 0;
  for (const [d, c] of anchors) { sx += d - DAY0; sy += Math.log(c); }
  const mx = sx / n, my = sy / n;
  let sxx = 0, sxy = 0;
  for (const [d, c] of anchors) { const x = (d - DAY0) - mx; sxx += x * x; sxy += x * (Math.log(c) - my); }
  const B = sxy / sxx, A = my - B * mx;
  const resid = anchors.map(([d, c]) => Math.log(c) - (A + B * (d - DAY0)));
  const rms = Math.sqrt(resid.reduce((s, r) => s + r * r, 0) / n);
  return { A, B, residuals: resid, rms_ln: rms };
}
const CRL_FIT = fitLogLinear(CRL_ANCHORS);
const crl = t => Math.exp(CRL_FIT.A + CRL_FIT.B * (dayOf(t) - DAY0));

const GEOM = 30;      // model length units per millimetre — see the UNITS note in the header
const mm = u => u / GEOM;

/* ══════════════════════════════════════════════════════════════════ stated anatomical fractions */

const F_SPAN   = 0.28;    // pharyngeal span as a fraction of CRL
const F_WIDTH  = 0.045;   // the pharynx's widest half-width, as a fraction of CRL
const NSEG     = 5;       // five equal intersegments; the four clefts sit at the internal divisions
const WALLF    = 0.16;    // endodermal wall thickness, as a fraction of the local half-width
const FLAT_PH  = 0.45;    // the pharynx is flattened dorsoventrally
const TAPER    = 0.55;    // how much of the half-width is lost by the caudal end
const VESTIGE  = 0.10;    // the mounting floor — see the engine-bug note below

/* ── THE ENGINE BUG THE VESTIGE FLOOR EXISTS FOR ─────────────────────────────────────────────────
   viz3d.js parseProceduralRef (:478) defaults an unpinned ref to t = 1 at mount; a structure that
   builds nothing at t = 1 resolves reason:'none', never enters meshes[], and restage() (:1854)
   filters on `meshes[s.key] && adapter.stageable(s)` — so SET_STAGE can never bring it back at any
   later t. That is queue item engine__procedural-ref-default-t, which is not this run's to fix.
   The structures that are genuinely transient here — clefts 2, 3 and 4, the cervical sinus, the
   lower membranes — therefore never shrink below VESTIGE of their peak, so every ref mounts. NO
   VIEW SHOWS A VESTIGE: the scene hides each of them at every t where it is vestigial, row V
   asserts the floor is the floor and not a drawn claim, and the harness fails the run if any beat
   shows one. A vestige is a mounting requirement, not a picture. */

/* ── the operculum ────────────────────────────────────────────────────────────────────────────────

   OP_HINGE IS THE WHOLE MECHANISM AND IT IS READ THROUGH AN INDIRECTION ON PURPOSE. 1.5
   intersegments below the cranial end of the span is the CENTRE OF THE SECOND ARCH'S BAR: the bars
   sit at (s + 0.5) intersegments for s = 0..4, so s = 1 is arch 2. The flap is hinged there because
   it is a flap OF that arch. Cleft 1 is at 1.0 — half an intersegment cranial of the hinge — and
   clefts 2, 3 and 4 are at 2.0, 3.0 and 4.0, all caudal of it. Nothing below says which clefts get
   buried; that falls out of this one number, and row O-hinge drives it from the override to prove
   so. */
const OP_HINGE_DEFAULT = 1.5;
const _override = { OP_HINGE: null, RIDGE_R: null, P1_RISE: null };
function opHinge()  { return _override.OP_HINGE == null ? OP_HINGE_DEFAULT : _override.OP_HINGE; }
/* the first pouch's climb towards the ear, read through an indirection so row M-nearest can perturb
   it and require the membrane's station to move — the station is supposed to be a function of the
   pouch's built shape, and a number that does not move when that shape changes is not one */
function p1Rise() { return _override.P1_RISE == null ? POUCH[0].rise : _override.P1_RISE; }

const OP      = { day: 28, full: 52 };   // the window the flap grows over
const OP_TO   = 4.95;   // how far caudal the free edge travels, in intersegments from the cranial end
const OP_TH   = 0.30;   // the flap's thickness at the hinge, as a fraction of one intersegment
const OP_PHI  = 0.52;   /* the flap's half-arc about the lateral direction, in radians (~30 deg).
                           NARROWED FROM 0.88 BY PROOF 4 — the one check that is a person looking at
                           the picture. At 0.88 rad on a radius of 4.2 intersegments the flap's chord
                           was 7.7 intersegments, nearly five times the width of the whole pharynx it
                           is supposed to be covering: from the lateral camera every beat that showed
                           it was a featureless translucent slab filling the frame, with the pharynx
                           reduced to a stick down the middle. Every numeric check passed on that
                           picture, which is exactly why RENDER-STANDARD keeps proof 4 as a separate
                           proof. The operculum covers the ARCHES, which lie within about 30 degrees
                           of the lateral direction, so a half-arc of 0.52 is also the truer figure.
                           See the scene's gaps[] for the proportion finding this sits inside. */
const OP_GAP  = 0.62;   // the flap stands this many intersegments LATERAL of the clefts' outer face
const OP_BULGE = 0.10;  // the flap's mid-span stand-off, as a fraction of ITS OWN LENGTH - see opSurface

const RIDGE_AT = 4.75;  // the epipericardial ridge, in intersegments from the cranial end: caudal of
                        // the last arch bar, which is at 4.5, and above the aortic sac. MOVED FROM
                        // 4.50 by row Z, which found 35% of the fourth cleft inside the ridge's own
                        // solid when the two shared that level — the ridge is adjacent to the caudal
                        // arches and is not one of them, so a third of a groove inside it is a
                        // defect and not contact. 4.75 leaves 0.11 of an intersegment between the
                        // groove's caudal dome and the ridge's cranial face.
const RIDGE_R_DEFAULT = 0.26;   // the ridge's own calibre, as a fraction of one intersegment
function ridgeR() { return _override.RIDGE_R == null ? RIDGE_R_DEFAULT : _override.RIDGE_R; }

/* ── the clefts ───────────────────────────────────────────────────────────────────────────────────
   F_CLEFT AND cleftPoint ARE COPIED FROM pharyngeal-pouches.js VERBATIM. That file's comment records
   why 3.60 and not 1.30: at 1.30 intersegments the clefts sat INSIDE the reach of pouch 1 — 14.6% of
   the cleft's vertices were inside the pouch's solid — so ectoderm and endoderm shared space, which
   is the error this topic's gaps[] calls the commonest marked-wrong answer. Row Z here re-measures
   it from this model's own geometry rather than inheriting the claim. */
const F_CLEFT = 3.60;
const CLEFT_D = { day: 24, full: 34, go0: 38, go1: 50 };

/* ── A GROOVE FITS BETWEEN ITS OWN TWO BARS, AND IN pharyngeal-pouches.js IT DOES NOT ─────────────
   THIS IS WHERE THIS MODEL DELIBERATELY DIVERGES FROM THE ONE IT COPIED, and the divergence is a
   FINDING against that file rather than a style choice here. Reported in the build log; that model
   is `built` and awaiting review, so this run does not touch it.

   The arch bars sit at 0.5, 1.5, 2.5, 3.5 and 4.5 intersegments and the clefts at 1, 2, 3 and 4, so
   each groove has exactly 0.5 of an intersegment of room on either side before it reaches the CENTRE
   of a neighbouring bar. The copied law gives a groove a craniocaudal half-height of 0.42 plus a
   terminal dome of 0.16 — 0.58 — so every cleft in that model reaches 0.08 of an intersegment PAST
   the middle of both bars it is supposed to lie between.

   In that model nothing could see it: the clefts are context there, and no measurement asks where a
   groove ends. Here it is load-bearing. The operculum is hinged on arch 2's bar at 1.5, and the
   whole survivor claim is that cleft 1, centred at 1.0, is CRANIAL of that hinge — so a groove whose
   caudal dome reaches 1.58 has 23 to 31% of its own surface lying under the flap, and row O-survivor
   measured exactly that and failed. The measurement was right and the geometry was wrong.

   0.26 plus a 0.12 dome is 0.38, which leaves 0.12 of an intersegment between the groove's end and
   the bar's centre, and the same between its caudal end and the flap's hinge. The groove is still
   most of the gap between its bars, which is what a groove between two bars looks like. */
const CLEFT_HALF = 0.26;   // craniocaudal half-height of a groove, in intersegments
const CLEFT_R    = 0.12;   // and its calibre, likewise

/* ── cleft 1's derivatives ─────────────────────────────────────────────────────────────────────── */
const PLUG    = { day: 30, full: 42 };   // the solid ectodermal cord fills the floor of the cleft
const PLUG_R  = 0.17;   // the canal's calibre, as a fraction of one intersegment
const CANAL_CLEAR = 0.03;  // the declared clearance between the canal's surface and the membrane's
const HILL    = { day: 32, full: 44 };   // six auricular hillocks on arches 1 and 2
const N_HILL  = 6;

/* ── the membranes ─────────────────────────────────────────────────────────────────────────────── */
const TYMP    = { day: 30, full: 46 };   // the same window the pouches model uses for membrane 1
const MEMB_L  = { day: 26, full: 34, go0: 38, go1: 48 };
/* THE THREE LAMINAE, as fractions of the membrane's own total thickness. They are stated here as a
   TRIPLE rather than as three separate constants so the order is a property of one list that row M
   reads off the built centroids — and so row M's negative case can feed the predicate the list
   reversed. Outer to inner: ectoderm (from the cleft), mesoderm (fibrous), endoderm (mucosa). */
const TM_LAMINAE = [
  { key: 'tm_ectoderm', layer: 'tm_ecto', frac: 0.30 },
  { key: 'tm_mesoderm', layer: 'tm_meso', frac: 0.40 },
  { key: 'tm_endoderm', layer: 'tm_endo', frac: 0.30 },
];
const TM_TH   = 0.26;   // the membrane's total thickness, as a fraction of one intersegment
const TM_R    = 0.34;   // and its radius, likewise — a disc, which is what an eardrum is. 0.52 was
                        // too wide and row Z found why: the first pouch rises 1.5 intersegments
                        // towards the ear on its way out, so the cleft-to-pouch axis is steeply
                        // tilted and a disc perpendicular to it put its own rim back into the
                        // pouch's shaft — 13% of the mesoderm lamina inside pouch 1. An eardrum is
                        // about as wide as the neck of the cavity behind it, which is what the
                        // pouch's own tip calibre is, so this is now of that order rather than
                        // half again as big.

/* ── the first two pouches, as the endodermal side of the picture ─────────────────────────────── */
const POUCH = [
  { k: 1, len: 0.30, rise:  0.30, zoff: -0.10, r0: 0.10, r1: 0.34, day: 22, layer: 'pouch1' },
  { k: 2, len: 0.20, rise:  0.00, zoff: -0.04, r0: 0.16, r1: 0.21, day: 24, layer: 'pouch2' },
];
const POUCH_FULL = 10;
const POUCH2_FLOOR = 0.38;   // what is left of the second pouch IS the tonsillar fossa

/* ── the clinical remnants, and the vessels that make one of them an operation ─────────────────── */
const CLIN    = { day: 40, full: 52 };   // when a persistent remnant is recognisable as one
const CAROTID = { day: 32, full: 48 };   // the third-arch artery and its branches
const F_CAR_X = 1.05;   // the carotids' distance from the median plane, in intersegments
const F_CAR_DZ = 0.90;  // the external carotid sits this far VENTRAL of the internal one. RAISED
                        // from 0.70 by row F-between once the tract was moved dorsal to clear the
                        // fourth groove's vestige (row Z): at 0.70 the tract then sat 0.319 of the
                        // way across the gap from the internal carotid, under the 0.35 floor. The
                        // two rows pull in opposite directions and the geometry has to satisfy both,
                        // which is what a floor is for. The fistula
                        // runs BETWEEN them, so this separation is what makes that claim measurable
                        // at all — row F-between reads the tract's own position against both.

const ss = x => { const u = clamp01(x); return u * u * (3 - 2 * u); };
const phase = (t, d0, d1) => Math.max(VESTIGE, ss((dayOf(t) - d0) / (d1 - d0)));
const involute = (t, d0, d1, g0, g1, floor) =>
  Math.max(floor == null ? VESTIGE : floor,
           ss((dayOf(t) - d0) / (d1 - d0)) * (1 - ss((dayOf(t) - g0) / (g1 - g0))));

/* ══════════════════════════════════════════════════════════════════ the frame of the apparatus */

function frameAt(t) {
  const L = crl(t) * GEOM;
  const span = F_SPAN * L;
  const seg = span / NSEG;
  const R0 = F_WIDTH * L;
  const yTop = 0;
  const yBot = yTop - span;
  const yP = [0, 1, 2, 3, 4].map(k => yTop - k * seg);     // yP[1..4] are the cleft levels
  const Rph = u => R0 * (1 - TAPER * Math.pow(clamp01(u), 1.6));
  const uOf = y => (yTop - y) / span;
  /* the flap's hinge and its free edge, in world y. The edge is the only one that moves with t. */
  const yHinge = yTop - opHinge() * seg;
  /* THE FLAP'S ADVANCE IS FLOORED AT THE MOUNTING VESTIGE, AND NOT ONLY SO THE REF MOUNTS. Before
     day 28 the raw smoothstep is zero, which puts the free margin exactly on the hinge — so the
     plate and the sinus cast underneath it both become surfaces of ZERO craniocaudal extent, every
     row of the patch coincident with every other. That is not a small flap, it is a degenerate one:
     its quads still emit, with zero area, invisible to the eye and to the triangle count but not to
     an outward-normals probe, which has no surface to take a normal from. Arch 2 has a caudal margin
     from the moment it exists; the flap is short, not absent. The scene shows the operculum only in
     the beats where it is substantial, and row V covers the structures whose floor IS this floor. */
  const opGrow = Math.max(VESTIGE, ss((dayOf(t) - OP.day) / (OP.full - OP.day)));
  const yEdge  = yTop - (opHinge() + (OP_TO - opHinge()) * opGrow) * seg;
  const yRidge = yTop - RIDGE_AT * seg;
  /* the flap's radius from the pharyngeal axis at a given y: LATERAL of the clefts' outer face, by a
     stated clearance. A consequence of where the clefts are, not a placed constant. */
  const Rflap = y => Rph(uOf(y)) + (F_CLEFT + OP_GAP) * seg;
  const Rcleft = y => Rph(uOf(y)) + F_CLEFT * seg;
  return { L, span, seg, R0, yTop, yBot, yP, Rph, uOf, yHinge, yEdge, yRidge, Rflap, Rcleft,
           opGrow, day: dayOf(t) };
}

/* ══════════════════════════════════════════════════════════════════ polyline helpers */

function bez3(p0, p1, p2, n) {
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

/** a lens / disc solid: the idiom pharyngeal-pouches.js uses for the tympanic membrane and the
    tonsil, kept identical so the two models' sheets read the same way. */
function blob(centre, axis, half, R, ring) {
  const a = axis.clone().normalize();
  const pts = [];
  const n = 10;
  for (let i = 0; i <= n; i++) pts.push(centre.clone().addScaledVector(a, (i / n - 0.5) * 2 * half));
  /* the radius law never reaches zero: tubeCapped skips a dome whose radius is not > 1e-6, which
     would leave the flat disc it had just stripped off and a hole where the dome should be */
  const rf = u => R * (0.34 + 0.66 * Math.sin(Math.PI * clamp01(u)));
  return K.tubeCapped(pts, rf, { ring: ring || 18, cap: 'both', capRows: 7, bulge: 0.9 });
}

/** A LAMINA: a flat-faced disc, which is what a layer of a laminated sheet is — and the reason it is
    not a `blob`.

    blob() is the kit's lens idiom and it is right for a tonsil or a cyst, but its terminal DOMES
    reach about 0.9 x their own rim radius PAST the end of the centreline they were asked for. On a
    disc as wide as it is thin that is a rounding; on three stacked laminae 0.078, 0.104 and 0.078 of
    an intersegment thick it is a 0.10 overhang on each face — larger than the laminae themselves.
    Measured: the three layers interpenetrated one another, and the innermost one's dome punched
    0.104 of an intersegment THROUGH the first pouch's wall, which row Z reported as 10% of the
    mesoderm lamina inside the pouch. The number was right and so was the row; the shape was wrong.

    Three germ layers a few cells thick, in contact, with flat faces is also simply the truer
    picture: the thing a student has to be able to do here is count three fills across one sheet.
    sweptShell writes a solid tube's terminal discs through `triN`, so the flat faces are the kit's
    own and the winding is decided from the geometry (RENDER-STANDARD 2.4b). The rim keeps a slight
    bevel from the radius law so the sheet does not read as a machined washer. */
function lamina(centre, axis, half, R, ring) {
  const a = axis.clone().normalize();
  const pts = [];
  const n = 6;
  for (let i = 0; i <= n; i++) pts.push(centre.clone().addScaledVector(a, (i / n - 0.5) * 2 * half));
  const rf = u => R * (0.82 + 0.18 * Math.sin(Math.PI * clamp01(u)));
  return K.tubeCapped(pts, rf, { ring: ring || 18, cap: null });
}

/* ══════════════════════════════════════════════════════════════════ the curved plate

   A FLAP IS NOT A TUBE AND NOT A LENS, so neither sweptShell nor blob builds one. The operculum is a
   plate of body wall wrapping the lateral surface, with an attached cranial edge, a free caudal
   margin and two real faces; the cervical sinus is the CAST of the space under it, which is the same
   patch made thick. One function builds both, which is also why the sinus's position cannot drift
   away from the flap's: the cast's outer surface IS the flap's inner surface, by construction.

   IT GOES THROUGH K.emitter(), WHICH IS THE KIT'S PRIMITIVE FOR EXACTLY THIS. RENDER-STANDARD 2.4b:
   "Any triangle that is not part of a ring quad — a cap, a taper, a sheet, a dome pole — goes
   through emitter().triN, which decides the vertex order from the geometry rather than from a
   comment." Ring quads here go through quad()/quadFlip() for the same reason. Nothing about winding,
   normals or colour is reimplemented.

   NORMALS COME FROM A FINITE DIFFERENCE OF THE SAME POINT FUNCTION THAT PLACES THE VERTICES —
   RENDER-STANDARD rule 3 — so the two cannot disagree, and the guard matters: three's normalize()
   returns (0,0,0) for a zero vector without complaining, which would leave the silhouette shell
   undisplaced and coincident with the surface it exists to hide behind. The fallback is the radial
   direction from the pharyngeal axis, forced to point away from it.

   OUTER SURFACE FIRST, AND ONLY IT BECOMES THE HULL — rule 2.4. The rim and the inner face are
   emitted after hullCount is taken, so inflating the silhouette cannot tear the plate open along its
   own free margin.

     mid(u, v)  -> Vector3   the mid-surface: u runs cranial(0) to caudal(1), v across the arc
     thick(u, v) -> number   total thickness at that point; taper it to nothing at a free margin
     taper       boolean     true closes the caudal margin to a knife edge instead of a rim      */
function curvedPlate(mid, thick, rows, cols, axisOf) {
  const E = K.emitter();
  const eps = 1e-3;
  const OP = [], ON = [], IP = [], IN = [];
  const nrm = (u, v) => {
    const a = mid(Math.min(1, u + eps), v), b = mid(Math.max(0, u - eps), v);
    const c = mid(u, Math.min(1, v + eps)), d = mid(u, Math.max(0, v - eps));
    const du = a.clone().sub(b), dv = c.clone().sub(d);
    const n = new T.Vector3().crossVectors(dv, du);
    const P = mid(u, v);
    /* the radial direction from the pharyngeal axis, which is the y axis: this is the fallback AND
       the orientation reference, so an outward normal is outward in the anatomical sense */
    const rad = new T.Vector3(P.x, 0, P.z);
    if (rad.lengthSq() < 1e-12) rad.set(axisOf ? axisOf(u, v) : 1, 0, 0);
    rad.normalize();
    if (n.lengthSq() < 1e-14) return rad;
    n.normalize();
    if (n.dot(rad) < 0) n.negate();
    return n;
  };
  for (let i = 0; i <= rows; i++) {
    for (let j = 0; j <= cols; j++) {
      const u = i / rows, v = j / cols;
      const P = mid(u, v), n = nrm(u, v), h = thick(u, v) / 2;
      OP.push(P.clone().addScaledVector(n, h)); ON.push(n.clone());
      IP.push(P.clone().addScaledVector(n, -h)); IN.push(n.clone().negate());
    }
  }
  const at = (i, j) => i * (cols + 1) + j;
  /* the patch's own centre, used to orient each rim face outward from the geometry */
  const centre = new T.Vector3();
  for (const q of OP) centre.add(q);
  for (const q of IP) centre.add(q);
  centre.multiplyScalar(1 / Math.max(1, OP.length + IP.length));

  /* ── THE PATCH'S HANDEDNESS IS MEASURED, NOT ASSUMED, AND THE FIRST DRAFT ASSUMED IT ────────────
     `K.emitter().quad(a,b,c,d, …)` does NOT correct winding. Its own doc line says "normals must
     point out of the solid" and its body is a fixed pair of `tri` calls: the CALLER owns the
     handedness of the (i, j) grid it hands over. RENDER-STANDARD section 2.1 describes quad as
     ordering "the triangles so the face normal agrees with the supplied vertex normals" — that is
     true of `triN` and is NOT true of `quad`, and the difference is this defect. Logged as a
     documentation finding; the kit is not changed here.

     Every structure in this model is built as a PAIR, and the mid-surface for the right side is the
     left side's mirrored in x — so its (u, v) grid has the OPPOSITE handedness and every quad on it
     comes out wound against its own normal. Measured by probe 10 at three days: 1144 of 2288
     outer-surface triangles on the operculum and 880 of 1760 on the cervical sinus, i.e. exactly one
     side of each pair, and 428 of 1716 first-hit backfaces from the anterior camera that two beats
     stand at. This is RENDER-STANDARD 2.1's cardinal bug, arriving in a sheet helper written to
     avoid it, and it is the kit's own domeCap note repeating itself: "the (m, j) parametrisation has
     the opposite handedness ... reversing the ring direction restores the handedness rather than
     patching the symptom."

     So the patch asks the GEOMETRY which way round it is: one quad's face normal against its own
     supplied normal, once, before anything is emitted. A future caller with any other
     parametrisation gets the same answer for free, which a comment could not have given it. */
  let flip = false;
  {
    for (let i = 0; i < rows && !flip; i++) for (let j = 0; j < cols; j++) {
      const a = at(i, j), c = at(i + 1, j + 1), d = at(i, j + 1);
      const e1 = new T.Vector3().subVectors(OP[d], OP[a]);
      const e2 = new T.Vector3().subVectors(OP[c], OP[a]);
      const fn = new T.Vector3().crossVectors(e1, e2);
      if (fn.lengthSq() < 1e-20) continue;        // degenerate quad: ask the next one
      flip = fn.dot(ON[a]) < 0;
      break;
    }
  }
  /* quadFlip ON THE SAME CORNERS is the reverse orientation; quadFlip on REORDERED corners is not.
     The first attempt at this fix passed (a, d, c, b) to quadFlip, which emits tri(a,d,c) and
     tri(a,c,b) - byte for byte what quad(a,b,c,d) emits. The probe reported the identical 1144 of
     2288 afterwards, which is the only reason it was caught: a fix that changes nothing and a fix
     that works look the same in the source and completely different in the measurement. */
  const outer = (a, b, c, d) => flip
    ? E.quadFlip(OP[a], OP[b], OP[c], OP[d], ON[a], ON[b], ON[c], ON[d])
    : E.quad(OP[a], OP[b], OP[c], OP[d], ON[a], ON[b], ON[c], ON[d]);
  const inner = (a, b, c, d) => flip
    ? E.quad(IP[a], IP[b], IP[c], IP[d], IN[a], IN[b], IN[c], IN[d])
    : E.quadFlip(IP[a], IP[b], IP[c], IP[d], IN[a], IN[b], IN[c], IN[d]);

  // outer surface FIRST — this, and only this, becomes the silhouette hull
  for (let i = 0; i < rows; i++) for (let j = 0; j < cols; j++) {
    outer(at(i, j), at(i + 1, j), at(i + 1, j + 1), at(i, j + 1));
  }
  const hullCount = E.count();
  // inner face
  for (let i = 0; i < rows; i++) for (let j = 0; j < cols; j++) {
    inner(at(i, j), at(i + 1, j), at(i + 1, j + 1), at(i, j + 1));
  }
  /* the rim, all four edges, so a free margin reads as a margin and not as a paper edge. IT GOES
     THROUGH triN, which IS the kit's self-correcting primitive — RENDER-STANDARD 2.4b: "Any triangle
     that is not part of a ring quad — a cap, a taper, a sheet, a dome pole — goes through
     emitter().triN, which decides the vertex order from the geometry rather than from a comment."
     The rim is exactly that case, and a rim wound by hand would have the same mirror problem the
     surface just had.

     THE DEGENERACY GUARD IS RELATIVE, AND THE FIRST DRAFT'S WAS NOT — which is the same defect, in
     the same shape, as the one RENDER-STANDARD's UNITS note records in render-kit's own `triN`.
     Written as `if (tg.lengthSq() < 1e-16) return;` on the RAW cross product, it is a statement
     about units rather than about degeneracy: a cross product scales with the square of the model,
     so the test tightens as the embryo shrinks. Measured: the cervical sinus cast came out with
     3,680 triangles at days 22 to 26 and 3,856 from day 30 — 176 rim quads silently dropped at the
     small end of the growth law, which is 176 holes in the free margin of a cast whose whole job is
     to read as an enclosed space. Nothing errored; acceptance row T-poles caught it, which is the
     row's entire reason for existing. Crossing the UNIT vectors instead tests the only thing a
     degeneracy guard should test — whether the edge and the thickness direction are parallel — and
     is scale-free by construction. The kit's own guard is NOT fixed here: it is called by every
     model in the corpus and changing it is a change for a run that can re-prove all of them. */
  const rim = (a, b) => {
    const e = new T.Vector3().subVectors(OP[b], OP[a]);
    const h = new T.Vector3().subVectors(IP[a], OP[a]);
    if (e.lengthSq() < 1e-30 || h.lengthSq() < 1e-30) return;
    const tg = new T.Vector3().crossVectors(e.normalize(), h.normalize());
    if (tg.lengthSq() < 1e-8) return;      // unit vectors: this is an ANGLE test, not a size test
    tg.normalize();
    /* the tangent must point AWAY from the patch, so take it from the geometry too: the rim's
       outward direction is the one that leads away from the patch's own mid-surface centre */
    const mid = new T.Vector3().addVectors(OP[a], IP[a]).multiplyScalar(0.5);
    if (tg.dot(new T.Vector3().subVectors(mid, centre)) < 0) tg.negate();
    E.triN(OP[a], OP[b], IP[b], tg);
    E.triN(OP[a], IP[b], IP[a], tg);
  };
  for (let j = 0; j < cols; j++) { rim(at(0, j + 1), at(0, j)); rim(at(rows, j), at(rows, j + 1)); }
  for (let i = 0; i < rows; i++) { rim(at(i, 0), at(i + 1, 0)); rim(at(i + 1, cols), at(i, cols)); }
  return E.geometry(hullCount);
}

/** the operculum's mid-surface for one side, at t */
function opSurface(t, side) {
  const F = frameAt(t);
  return {
    mid: (u, v) => {
      const y = F.yHinge + u * (F.yEdge - F.yHinge);
      const R = F.Rflap(y);
      const phi = (v - 0.5) * 2 * OP_PHI;
      /* THE FLAP BULGES AWAY FROM THE WALL AS IT GROWS, which is what makes the space underneath it a
         space. A plate lying flat on the clefts would enclose nothing, and the cervical sinus is the
         one thing this scene exists to show as an enclosed cavity. The bulge is a half-sine along u,
         zero at the hinge and zero at the free margin where the flap meets the ridge — so the
         enclosed space is widest in the middle, which is where the remnant that becomes a cyst is.

         THE STAND-OFF IS A FRACTION OF THE FLAP'S OWN LENGTH, NOT OF ITS RADIUS, and the first draft
         had it the other way round: `1 + 0.16 * sin(pi u)` on a radius of 19.4 units put a 3.1-unit
         bulge on a plate that, at its mounting vestige, is only 1.33 units long. Sagitta 3.1 over
         chord 1.33 is a local curvature radius of about 0.07 units against a plate half-thickness of
         0.58 — so the inward offset surface folded straight through itself, and the outward-normals
         probe read 75 of 191 sampled INNER-face vertices as lying inside the solid at day 22 while
         the hull read a clean 0 of 191. The hull was never wrong, which is why nothing else saw it.

         This is render-kit's own arch-bar lesson arriving in a different helper: "a swept tube folds
         through itself wherever its own radius exceeds the local radius of curvature of its
         centreline", and its general form, which that comment also states, is the one that matters —
         "a constant that is safe where it was checked is not a constant, it is a sample". Expressed
         as a fraction of the span the flap has actually covered, the bulge is 1.33 units at full
         growth and 0.13 at the vestige, which gives a curvature radius of 1.7 against a half
         thickness of 0.58: a margin of 2.9 at the stage that used to fail, and the picture at full
         growth is unchanged to the eye. */
      const stand = OP_BULGE * Math.abs(F.yHinge - F.yEdge) * Math.sin(Math.PI * u);
      return new T.Vector3(side * (R + stand) * Math.cos(phi), y, (R + stand) * Math.sin(phi));
    },
    /* A MEMBRANE TAPERS — RENDER-STANDARD. The flap is thickest where it is continuous with arch 2
       and thins towards its free margin and towards both its dorsal and ventral edges, so it reads
       as a flap of wall rather than as a slab of card standing behind the subject. */
    thick: (u, v) => OP_TH * frameAt(t).seg * (1 - 0.70 * u) *
                     (0.35 + 0.65 * Math.sin(Math.PI * clamp01(v))),
  };
}

/* ══════════════════════════════════════════════════════════════════ cleft geometry
   COPIED FROM pharyngeal-pouches.js. One function, called by the cleft geometry, by the meatal plug,
   by the membranes and by the operculum's clearance, because every one of those is defined in terms
   of where the cleft is and a second copy of the law would let them drift. */
function cleftPoint(t, side, k, which) {
  const F = frameAt(t);
  const y = F.yP[k];
  const r = F.Rph(F.uOf(y));
  const live = k === 1 ? phase(t, CLEFT_D.day, CLEFT_D.full)
                       : involute(t, CLEFT_D.day, CLEFT_D.full, CLEFT_D.go0, CLEFT_D.go1);
  const depth = 0.30 * F.seg * live;
  const x = side * (r + F_CLEFT * F.seg);
  if (which === 'floor') return new T.Vector3(x - side * depth, y, 0.9 * depth);
  return { x, y, depth, live, r,
           top: new T.Vector3(x, y + CLEFT_HALF * F.seg, -0.5 * depth),
           bot: new T.Vector3(x, y - CLEFT_HALF * F.seg, -0.5 * depth),
           mid: new T.Vector3(x - side * depth, y, 0.9 * depth) };
}

/* ══════════════════════════════════════════════════════════════════ pouch geometry
   The first two pouches only, and as CONTEXT rather than as subject: the first because the tympanic
   membrane needs both sides of the apparatus to exist, the second because a complete fistula opens
   into the tonsillar fossa. The pouch derivative list belongs to the pouches entry and is
   deliberately absent — the scene's gaps[] says so. The law is pharyngeal-pouches.js's. */
function pouchPath(t, side, k) {
  const F = frameAt(t);
  const P = POUCH.find(p => p.k === k);
  const y = F.yP[k];
  const r = F.Rph(F.uOf(y));
  const floor = k === 2 ? POUCH2_FLOOR : VESTIGE;
  const grow = Math.max(floor, ss((F.day - P.day) / POUCH_FULL));
  const L = P.len * F.span * grow;
  const rise = k === 1 ? p1Rise() : P.rise;
  const A = new T.Vector3(side * (r - 1.1 * WALLF * r), y, 0);
  const Z = new T.Vector3(side * (r + L), y + rise * F.span * grow, P.zoff * F.span * grow);
  const C = new T.Vector3(side * (r + L * 0.55), y + rise * F.span * grow * 0.35,
                          P.zoff * F.span * grow * 0.4);
  return { pts: bez3(A, C, Z, 16), grow, tip: Z, r };
}
function pouchTip(t, side, k) { return pouchPath(t, side, k).tip; }

/* ══════════════════════════════════════════════════════════════════ the meatus and the membrane

   ONE FUNCTION, called by the meatal plug, by the recanalised canal and by the three laminae of the
   membrane, because all four are defined in terms of the same line — the first cleft deepening
   medially until it meets the first pouch — and a second copy of that line would let them drift.

   EVERY DISTANCE HERE IS READ OFF THE POUCH'S OWN BUILT PROPORTIONS. `pouchFace` is the pouch's
   lateral surface along the axis, so the membrane fills exactly the clearance outside it and the
   canal stops exactly where the membrane starts. Change the pouch's length or its tip calibre and
   all three move together, which is what RENDER-STANDARD means by a measurement being a function of
   the built geometry rather than of the constants it was built from. */
function meatusAxis(t, side) {
  const F = frameAt(t);
  const live = phase(t, TYMP.day, TYMP.full);
  const lateral = cleftPoint(t, side, 1).mid;        // the floor of the groove, at the surface

  /* ── THE MEMBRANE GOES WHERE THE TWO SURFACES ARE NEAREST, WHICH IS ITS DEFINITION ─────────────
     "At the bottom of each cleft the ectoderm comes FACE TO FACE with the endoderm of the matching
     pouch." That is a statement about closest approach, so this walks the first pouch's own
     centreline and its own calibre law and finds the station whose SURFACE is nearest the floor of
     the first cleft. Both the position and the orientation come out of it.

     THE FIRST TWO DRAFTS USED THE POUCH'S TIP AND BOTH WERE WRONG, for the same underlying reason.
     The first pouch rises 0.30 of a span — 1.5 intersegments — towards the ear as it grows, which it
     should: it is becoming the middle ear. So its TIP is 1.5 intersegments CRANIAL of the first
     cleft and 1.8 away along the axis, and a membrane hung between the cleft floor and that tip is a
     disc on a long diagonal: draft 1 put it at the midpoint and it touched neither surface (0.81 and
     0.61 of an intersegment of clear mesenchyme, row M-contact), and draft 2 pinned it to the tip's
     own face, where a disc perpendicular to that diagonal put its rim back into the pouch's shaft
     (10% of the mesoderm lamina inside pouch 1, row Z). Neither was a membrane.

     Nearest-surface fixes both at once, because the pouch's lateral wall at the FIRST CLEFT'S OWN
     LEVEL is what the meatus actually faces, and a disc placed there is tangential to the pouch
     rather than driven into it. Nothing is tuned: change the pouch's length, rise or calibre and the
     station moves with them. */
  const pp = pouchPath(t, side, 1);
  const P = POUCH.find(p => p.k === 1);
  const rAt = u => F.seg * (P.r0 + (P.r1 - P.r0) * Math.pow(clamp01(u), 1.35)) * pp.grow;
  const last = pp.pts.length - 1;
  /* THE RADIAL DIRECTION, WITH THE AXIAL COMPONENT PROJECTED OUT — and the draft that skipped this
     step is why row Z was still finding the membrane inside the pouch after the station was right.
     A swept tube's radius is measured PERPENDICULAR to its own centreline, so a point at distance r
     from a station along any direction that is not perpendicular to the tangent there is INSIDE the
     solid, by exactly the axial component. The cleft-to-station direction is nowhere near
     perpendicular here, because the pouch climbs towards the ear while the cleft stays put: the
     laminae were pushed a quarter of the way into the pouch's wall and the endoderm lamina read 25%
     contained, which is excluded by name and so said nothing, while the MESODERM behind it read 10%
     and is excluded by nothing. The surface point is found per station and the nearest is taken on
     the full 3-D distance, so the disc ends up tangential to the pouch rather than driven into it. */
  let bestD = Infinity, bestP = null, bestR = 0, bestRad = null;
  for (let i = 0; i <= last; i++) {
    const u = i / last;
    const r = rAt(u);
    const tg = pp.pts[Math.min(last, i + 1)].clone().sub(pp.pts[Math.max(0, i - 1)]);
    if (tg.lengthSq() < 1e-16) continue;
    tg.normalize();
    const v = lateral.clone().sub(pp.pts[i]);
    const vPerp = v.clone().addScaledVector(tg, -v.dot(tg));   // perpendicular to the tube's axis
    if (vPerp.lengthSq() < 1e-16) continue;
    const rad = vPerp.clone().normalize();
    const surf = pp.pts[i].clone().addScaledVector(rad, r);    // ON the tube's surface
    const d = surf.distanceTo(lateral);
    if (d < bestD) { bestD = d; bestP = pp.pts[i]; bestR = r; bestRad = rad; }
  }
  const dir = bestRad.clone().negate();              // the medial direction: cleft -> pouch surface
  const pouchR = bestR;
  const pouchFace = bestP.clone().addScaledVector(bestRad, pouchR);
  const memTh = TM_TH * F.seg * live;
  const memCentre = pouchFace.clone().addScaledVector(dir, -memTh / 2);
  /* WHERE THE CANAL STOPS, AND IT IS THE SURFACE THAT HAS TO STOP THERE RATHER THAN THE PATH.
     The plug is a tubeCapped solid, so its terminal DOME reaches about bulge x its own radius past
     the end of its centreline — 0.17 of an intersegment on a membrane only 0.26 thick. The first
     draft stopped the centreline at the membrane's outer face and the dome went straight through all
     three laminae: row Z measured 48% of the mesoderm and 25% of the endoderm inside the plug. The
     recanalised canal has flat annular caps and ends at its path, so the two need different
     setbacks, and both get the same small declared clearance on top — enough that the join measures
     as contact under row M-contact's floor without the two solids sharing space. */
  const canalR = PLUG_R * F.seg * live;
  const clear = CANAL_CLEAR * F.seg;
  const medialPlug  = pouchFace.clone().addScaledVector(dir, -(memTh + clear + 0.55 * canalR));
  const medialLumen = pouchFace.clone().addScaledVector(dir, -(memTh + clear));
  return { lateral, medialPlug, medialLumen, dir, pouchFace, pouchR, canalR,
           memTh, memCentre, clear, live,
           /* reported by row M-nearest so the station is auditable from outside the model */
           station: bestP, surface_gap: bestD, radial: bestRad };
}

/* ══════════════════════════════════════════════════════════════════ build */

function buildClefts(t, opts) {
  const o = opts || {};
  const F = frameAt(t);
  const g = new T.Group();
  /* the silhouette scales with the model: at day 22 the whole apparatus is well under a millimetre
     across and the kit's 0.030 default would be a large fraction of it */
  const OUT = 0.012 * F.R0;
  const add = (key, geo, layer, extra) => {
    if (!geo) return null;
    return K.addSolid(g, key, geo, Object.assign({
      color: LAYERS[layer].color, name: LAYERS[layer].name, outline: OUT,
    }, extra || {}));
  };
  /* EVERY PART GETS ITS OWN MESH, CARRYING THE SAME KEY. viz3d's mergeByKey merges them for the
     player anyway (viz3d.js:493), so this changes nothing a student sees; what it changes is what a
     probe can ask. The outward-normals probe steps along a vertex's normal and asks whether it is
     outside THE SOLID, and on a merged left+right pair "the solid" is the union — so a vertex of the
     left cleft that lies inside the right one at the midline reads as inside a surface that is
     correct. pharyngeal-pouches.js records that confound and the per-sub-mesh fix; the fix only
     works if the sub-meshes exist. Same for the watertight weld tolerance, which is derived from a
     mesh's own diagonal and would otherwise be derived from the gap between left and right. */
  const addAll = (key, geos, layer, extra) => {
    const live = (geos || []).filter(Boolean);
    for (const geo of live) add(key, geo, layer, extra);
    return live.length;
  };
  const SIDES = [-1, 1];

  /* ── the pharyngeal wall: a THICK-WALLED shell, so a section shows a wall with a lumen inside it
     rather than a paper edge. Authored role:'context' in the scene, which is what lets the player's
     CROSS_SECTION cut it — viz3d.js:2438 applies the clipping plane only where isTaught(s) is
     false, so a cross-section opens the wall and leaves the clefts and the membrane whole. ── */
  {
    const rows = 56;
    const pts = [];
    for (let i = 0; i <= rows; i++) pts.push(new T.Vector3(0, F.yTop - (i / rows) * F.span, 0));
    const fr = K.parallelFrame(pts, new T.Vector3(1, 0, 0));
    const outer = i => F.Rph(i / rows);
    add('pharyngeal_wall', K.sweptShell({
      frame: fr, i0: 0, i1: rows, ring: 40,
      outerR: outer, innerR: i => outer(i) * (1 - WALLF),
      flatten: FLAT_PH, section: () => 1,
    }), 'wall', { matOver: { opacity: 0.55 } });
  }

  /* ── the arch bars: the bars the clefts lie BETWEEN ───────────────────────────────────────────
     The shape law is pharyngeal-pouches.js's, including the three fixes its comment records — the
     arc's chord, sagitta and calibre are all fractions of the LOCAL wall radius, because a bar whose
     bulge was a fixed fraction of the intersegment got relatively deeper down the taper until the
     swept surface folded through itself. */
  {
    const bars = [];
    for (const side of SIDES) {
      for (let s = 0; s < NSEG; s++) {
        const yMid = F.yTop - (s + 0.5) * F.seg;
        const r = F.Rph(F.uOf(yMid));
        const inv = Math.max(VESTIGE, 1 - 0.45 * ss((F.day - 34) / 22));
        const A = new T.Vector3(side * r * 1.10, yMid, -0.90 * r * FLAT_PH);
        const Z = new T.Vector3(side * r * 1.10, yMid, 0.90 * r * FLAT_PH);
        const Cp = new T.Vector3(side * r * 1.45, yMid, 0);
        const rf = u => 0.070 * r * inv * (0.62 + 0.38 * Math.sin(Math.PI * clamp01(u)));
        bars.push(K.tubeCapped(bez3(A, Cp, Z, 18), rf, { ring: 16, cap: 'both', capRows: 6 }));
      }
    }
    addAll('arch_bars', bars, 'arches', { matOver: { opacity: 0.30 } });
  }

  /* ── the four ectodermal clefts, as FOUR KEYS ─────────────────────────────────────────────────
     FOUR KEYS AND NOT TWO, AND THAT IS A DIFFERENCE FROM pharyngeal-pouches.js ON PURPOSE. That
     model keeps `cleft1` and `clefts_lower`, because there the clefts are context and a key per
     groove would have set the camera for beats about the pouches. Here the clefts ARE the subject
     and the scene's learning goal is "say which cleft survives": a student has to be able to count
     them, watch three of them disappear one after another, and see the one that does not. Rows
     O-order and O-survivor are per-cleft measurements and they need per-cleft geometry. The two
     models still agree on where each groove IS — row W. */
  {
    for (let k = 1; k <= 4; k++) {
      const parts = [];
      for (const side of SIDES) {
        const c = cleftPoint(t, side, k);
        const rf = u => CLEFT_R * F.seg * c.live * (0.5 + 0.5 * Math.sin(Math.PI * clamp01(u)));
        parts.push(K.tubeCapped(bez3(c.top, c.mid, c.bot, 12), rf,
                                { ring: 14, cap: 'both', capRows: 6 }));
      }
      addAll('cleft' + k, parts, k === 1 ? 'ectoderm' : 'ectoderm2', { matOver: { opacity: 0.85 } });
    }
  }

  /* ── the operculum: the second arch's flap ────────────────────────────────────────────────────
     Hinged on arch 2's own bar and growing caudally. THE FLAP IS THE WHOLE MECHANISM — everything
     the lower three clefts do, they do because of where this plate starts and how far it reaches. */
  {
    const parts = [];
    for (const side of SIDES) {
      const S = opSurface(t, side);
      parts.push(curvedPlate(S.mid, S.thick, 26, 22, () => side));
    }
    addAll('operculum', parts, 'operculum', { matOver: { opacity: 0.72 } });
  }

  /* ── the epipericardial ridge, which is what the flap fuses WITH ──────────────────────────────
     Not decoration: the fusion is what turns a space under a flap into an enclosed sinus, and row
     O-fuse SOLVES the day the two surfaces meet by bisecting the gap between them. A ridge with no
     geometry would leave that day a typed constant. */
  {
    const bars = [];
    for (const side of SIDES) {
      const y = F.yRidge;
      const R = F.Rflap(y);
      const A = new T.Vector3(side * R * Math.cos(-OP_PHI * 1.05), y, R * Math.sin(-OP_PHI * 1.05));
      const Z = new T.Vector3(side * R * Math.cos(OP_PHI * 1.05), y, R * Math.sin(OP_PHI * 1.05));
      const Cp = new T.Vector3(side * R * 1.16, y, 0);
      const rf = u => ridgeR() * F.seg * (0.60 + 0.40 * Math.sin(Math.PI * clamp01(u)));
      bars.push(K.tubeCapped(bez3(A, Cp, Z, 18), rf, { ring: 16, cap: 'both', capRows: 6 }));
    }
    addAll('epipericardial_ridge', bars, 'ridge', { matOver: { opacity: 0.55 } });
  }

  /* ── the cervical sinus: the CAST of the space under the flap ─────────────────────────────────
     Its outer face is the flap's inner face and its inner face is the embryo's original surface, so
     its position is a consequence of where those two are rather than a placed constant — which is
     the point, because the narration's claim is exactly that it is "simply the space left underneath
     that flap". It grows as the flap advances and is then obliterated; it never falls below the
     mounting vestige, and no view shows it there. */
  {
    const parts = [];
    const live = involute(t, 30, 40, 44, 52);
    for (const side of SIDES) {
      const yA = F.yHinge, yB = F.yEdge;
      const mid = (u, v) => {
        const y = yA + u * (yB - yA);
        const R = F.Rcleft(y) + 0.33 * F.seg;
        const phi = (v - 0.5) * 2 * OP_PHI * 0.86;
        return new T.Vector3(side * R * Math.cos(phi), y, R * Math.sin(phi));
      };
      /* A SLIT, NOT A BALLOON. The cervical sinus is a slit-like space between two apposed
         ectodermal surfaces, and a cast drawn as thick as the whole subflap volume would teach a
         cavity a student would then look for. It is thickest in the middle of the flap's reach,
         which is also where the remnant that becomes a cyst sits — and the cyst's own position is
         read off this surface rather than placed beside it. */
      const thick = (u, v) => 0.30 * F.seg * live *
                              (0.30 + 0.70 * Math.sin(Math.PI * clamp01(u))) *
                              (0.40 + 0.60 * Math.sin(Math.PI * clamp01(v)));
      parts.push(curvedPlate(mid, thick, 22, 20, () => side));
    }
    addAll('cervical_sinus', parts, 'sinus', { matOver: { opacity: 0.66 } });
  }

  /* ── the first two pouches, as the endodermal side of the picture ─────────────────────────── */
  for (const P of POUCH) {
    const parts = [];
    for (const side of SIDES) {
      const pp = pouchPath(t, side, P.k);
      const rf = u => F.seg * (P.r0 + (P.r1 - P.r0) * Math.pow(clamp01(u), 1.35)) * pp.grow;
      parts.push(K.tubeCapped(pp.pts, rf, { ring: 22, cap: 'end', capRows: 8, bulge: 0.9 }));
    }
    addAll('pouch' + P.k, parts, P.layer, { matOver: { opacity: 0.80 } });
  }

  /* ── the tympanic membrane, as THREE LAMINAE ──────────────────────────────────────────────────
     Where the first pouch meets the first cleft from outside, ectoderm and endoderm come face to
     face with a thin sheet of mesoderm between them. Three stacked discs rather than one, because
     the scene's gaps[] requires that a student can count three fills in one structure, and row M
     reads the ORDER of the three off their built centroids projected on the cleft-to-pouch axis — so
     the laminae could not be stacked the wrong way round without the row failing.

     IT IS NOT AT THE MIDPOINT BETWEEN THE CLEFT AND THE POUCH, AND THE FIRST DRAFT PUT IT THERE.
     pharyngeal-pouches.js places its membrane at `pouchTip.lerp(cleft, 0.5)` and claims only that it
     is of a substantial size; row M-contact here asked the question that claim does not, which is
     whether the thing touches either of the two surfaces it is supposed to be the boundary between.
     It did not: measured, the gap from the membrane to the first cleft was 0.81 of an intersegment
     and to the first pouch 0.61, on a structure the narration calls "the only thing that belongs to
     BOTH". A membrane floating in the middle of 1.8 intersegments of mesenchyme is a disc in space.

     The repair is the anatomy rather than a bigger disc. The first cleft does not stop at the
     surface — it DEEPENS INTO A FUNNEL, the external acoustic meatus, which runs medially until it
     meets the pouch. So the ectodermal chain is cleft, then canal, then membrane, then pouch, and
     the membrane belongs at the MEDIAL END of the canal. Everything below is derived from the
     pouch's own built position: the pouch's lateral face along the axis, the membrane filling
     exactly the clearance outside it, and the canal stopping exactly where the membrane starts.
     Nothing is placed by eye, and rows M-contact and M-chain assert each link. */
  {
    const live = phase(t, TYMP.day, TYMP.full);
    const geos = { tm_ectoderm: [], tm_mesoderm: [], tm_endoderm: [] };
    for (const side of SIDES) {
      const M = meatusAxis(t, side);
      let acc = -M.memTh / 2;
      for (const L of TM_LAMINAE) {
        const h = M.memTh * L.frac;
        const c = M.memCentre.clone().addScaledVector(M.dir, acc + h / 2);
        geos[L.key].push(lamina(c, M.dir, h / 2, TM_R * F.seg * live, 22));
        acc += h;
      }
    }
    for (const L of TM_LAMINAE) addAll(L.key, geos[L.key], L.layer, { matOver: { opacity: 0.94 } });
  }

  /* ── membranes 2, 3 and 4, which break up ─────────────────────────────────────────────────────
     At the floor of each lower cleft, where its ectoderm faces the endoderm of the matching pouch.
     Pouches 3 and 4 are NOT built here — they belong to the pouches entry and the scene's gaps[]
     says so — so each lower membrane is placed just medial to its own cleft floor, which is where
     the membrane is whether or not the pouch behind it is drawn. */
  {
    const parts = [];
    const live = involute(t, MEMB_L.day, MEMB_L.full, MEMB_L.go0, MEMB_L.go1);
    for (const side of SIDES) {
      for (let k = 2; k <= 4; k++) {
        const c = cleftPoint(t, side, k);
        const axis = new T.Vector3(-side, 0, 0);
        const centre = new T.Vector3(c.mid.x - side * 0.14 * F.seg, c.mid.y, c.mid.z * 0.6);
        parts.push(blob(centre, axis, 0.07 * F.seg * live, 0.30 * F.seg * live, 16));
      }
    }
    addAll('membranes_lower', parts, 'memb_lower', { matOver: { opacity: 0.88 } });
  }

  /* ── the meatal plug: the first cleft's floor fills in SOLID before it opens ──────────────────
     A cord of ectodermal cells running from the floor of the first cleft medially, as far as the
     developing tympanic cavity. It does not break down until late in fetal life, which is outside
     this model's t window — see the header. */
  {
    const parts = [];
    const live = phase(t, PLUG.day, PLUG.full);
    for (const side of SIDES) {
      const M = meatusAxis(t, side);
      const rf = u => PLUG_R * F.seg * live * (0.55 + 0.45 * Math.sin(Math.PI * clamp01(u)));
      parts.push(K.tubeCapped([M.lateral, M.lateral.clone().lerp(M.medialPlug, 0.5), M.medialPlug],
                              rf, { ring: 16, cap: 'both', capRows: 6 }));
    }
    addAll('meatal_plug', parts, 'plug');
  }

  /* ── the external acoustic meatus, recanalised ────────────────────────────────────────────────
     THE SAME SPACE, LATER. A hollow tube along the plug's own path, so the two are the same canal in
     its two states and the only difference a student has to see is solid against patent. The pair is
     excluded by name from row Z's containment partition and the harness asserts that no beat draws
     them together, because that exclusion is only honest if nothing does. The annular end caps are
     correct here and not the defect RENDER-STANDARD warns about: a patent canal IS open at both
     ends, and that is the entire teaching point of this key. */
  {
    const parts = [];
    for (const side of SIDES) {
      const M = meatusAxis(t, side);
      const c = M.lateral, stop = M.medialLumen;
      const pts = [c, c.clone().lerp(stop, 0.34), c.clone().lerp(stop, 0.68), stop];
      const fr = K.parallelFrame(pts, new T.Vector3(0, 1, 0));
      const outer = i => 1.24 * PLUG_R * F.seg * (0.80 + 0.20 * Math.sin(Math.PI * (i / 3)));
      parts.push(K.sweptShell({
        frame: fr, i0: 0, i1: 3, ring: 20,
        outerR: outer, innerR: i => outer(i) * 0.52,
        flatten: 1, section: () => 1,
      }));
    }
    addAll('meatus_lumen', parts, 'lumen', { matOver: { opacity: 0.92 } });
  }

  /* ── the auricular hillocks ───────────────────────────────────────────────────────────────────
     Six swellings around the mouth of the first cleft, three on arch 1 and three on arch 2. They are
     here for one reason and the narration says it: first cleft anomalies present AT THE EAR and not
     down the neck, because the cleft and the hillocks are the same neighbourhood. A student who can
     see them sitting around the first groove has the explanation rather than the fact. */
  {
    const parts = [];
    const live = phase(t, HILL.day, HILL.full);
    for (const side of SIDES) {
      const c = cleftPoint(t, side, 1);
      const R = F.Rcleft(c.y) * 1.02;
      for (let i = 0; i < N_HILL; i++) {
        /* three cranial of the groove (arch 1) and three caudal of it (arch 2), fanned in z */
        const arch1 = i < 3;
        const j = i % 3;
        /* 0.40 AND 0.13, NOT 0.46 AND 0.15 — row Z. At the larger figures the caudal three hillocks
           reached 1.61 intersegments down, and the branchial cyst's cranial pole is at 1.60: the two
           grazed, and one of 36 sampled cyst vertices read as inside a hillock. That is a real
           contact between the ear and a neck remnant that have no business touching, and the honest
           repair is the geometry rather than a bigger sample. */
        const dy = (arch1 ? 0.34 : -0.34) * F.seg;
        /* A TIGHT FAN, AND THE PLAYER'S FRAMING IS WHY — as well as the anatomy. At (j-1) * 0.46 rad
           on a radius of 4.1 intersegments the six hillocks stood 1.84 intersegments apart in z,
           wider in the screen's horizontal axis than everything else in the scene put together: the
           visibility walk measured every beat that showed them at 2.0 to 2.3% of the frame against
           an 8% floor, and the SAME beat without them at 9.3%. They were setting the frame for the
           ear. Six hillocks cluster closely round the mouth of one groove, so 0.16 rad is also the
           truer spacing; the wide fan was never the anatomy. */
        const phi = (j - 1) * 0.16;
        const centre = new T.Vector3(side * R * Math.cos(phi), c.y + dy, R * Math.sin(phi));
        const axis = new T.Vector3(side * Math.cos(phi), 0, Math.sin(phi));
        parts.push(blob(centre, axis, 0.11 * F.seg * live, 0.12 * F.seg * live, 14));
      }
    }
    addAll('auricular_hillocks', parts, 'hillock');
  }

  /* ── the carotids: what makes a second-cleft fistula an operation ─────────────────────────────
     The internal carotid runs DORSAL and the external VENTRAL of the tract, which is the classical
     description the narration gives as the reason for complete excision. Both are here so that
     "between the internal and external carotid arteries" is a picture a student can read rather than
     a caption, and so row F-between can measure it off the built geometry. */
  {
    const inner = [], outer = [];
    const live = phase(t, CAROTID.day, CAROTID.full);
    for (const side of SIDES) {
      for (const which of ['i', 'e']) {
        const dz = (which === 'e' ? 1 : -1) * F_CAR_DZ * F.seg;
        const x = side * F_CAR_X * F.seg;
        const A = new T.Vector3(x, F.yP[1] + 0.40 * F.seg, dz * 0.72);
        const Z = new T.Vector3(x * 0.88, F.yRidge - 0.30 * F.seg, dz * 0.30);
        const Cp = new T.Vector3(x * 1.04, (A.y + Z.y) / 2, dz);
        const rf = () => (which === 'i' ? 0.115 : 0.095) * F.seg * live;
        (which === 'i' ? inner : outer).push(
          K.tubeCapped(bez3(A, Cp, Z, 20), rf, { ring: 14, cap: 'both', capRows: 6 }));
      }
    }
    addAll('carotid_internal', inner, 'carotid_i', { matOver: { opacity: 0.9 } });
    addAll('carotid_external', outer, 'carotid_e', { matOver: { opacity: 0.9 } });
  }

  /* ── a branchial cyst: a piece of the cervical sinus with no opening ──────────────────────────
     ITS POSITION IS READ OFF THE SINUS, NOT PLACED BESIDE IT. The centre sits on the sinus cast's
     own mid-surface at the level of the SECOND cleft, which is the cranial part of the sinus — and
     that is what "the upper third of the neck" is in this frame. Row C-level asserts it is cranial
     of the sinus tract's external opening, with a magnitude floor, because "upper third" against
     "lower third" is the discriminator a student is examined on. */
  {
    const parts = [];
    const live = phase(t, CLIN.day, CLIN.full);
    for (const side of SIDES) {
      const y = F.yP[2];
      const R = F.Rcleft(y) + 0.33 * F.seg;
      const centre = new T.Vector3(side * R, y, 0);
      /* A DISTENDED SAC, NOT A THREAD. 0.34 of an intersegment was the first figure and the
         visibility walk is what argued it up: a cyst that "fills with fluid", is "painless, smooth
         and fluctuant" and can be aspirated is a distended sac, and at 0.34 it drew 1.1% of its own
         beat's frame. The three clinical remnants were all drawn at the calibre of the duct they
         came from rather than at the calibre they present with. */
      parts.push(blob(centre, new T.Vector3(0, 1, 0), 0.46 * F.seg * live, 0.44 * F.seg * live, 20));
    }
    addAll('branchial_cyst', parts, 'cyst');
  }

  /* ── a branchial sinus: the same remnant, but it keeps an opening to the skin ──────────────────
     It runs from the CAUDAL part of the sinus out through the body wall to the surface, which is low
     on the neck. It necessarily pierces the operculum — that is what an external opening IS — so
     that pair is excluded by name from row Z, as the anomaly rather than as construction. */
  {
    const parts = [];
    const live = phase(t, CLIN.day, CLIN.full);
    for (const side of SIDES) {
      const y = F.yP[4] + 0.10 * F.seg;
      const R0i = F.Rcleft(y) + 0.33 * F.seg;
      const A = new T.Vector3(side * R0i, y, 0.10 * F.seg);
      const Z = new T.Vector3(side * F.Rflap(y) * 1.16, y - 0.26 * F.seg, 0.18 * F.seg);
      const Cp = new T.Vector3(side * (R0i + F.Rflap(y)) * 0.56, y - 0.12 * F.seg, 0.16 * F.seg);
      const rf = u => 0.17 * F.seg * live * (0.70 + 0.55 * clamp01(u));   // see the cyst's note
      parts.push(K.tubeCapped(bez3(A, Cp, Z, 16), rf, { ring: 14, cap: 'both', capRows: 6 }));
    }
    addAll('branchial_sinus_tract', parts, 'tract');
  }

  /* ── a complete branchial fistula: open at BOTH ends ──────────────────────────────────────────
     External opening at the surface, low on the neck; the tract runs cranially and medially,
     BETWEEN the two carotids; internal opening at the second pouch — the tonsillar fossa. The
     narration's own line is that the internal opening is at a POUCH derivative and the external at a
     CLEFT derivative, "not a fact to memorise; it is the definition of a fistula in this region" —
     so both ends are measured against the structures they are claimed to be at, rows F-internal and
     F-external, and the crossing is measured against both carotids, row F-between. */
  {
    const parts = [];
    const live = phase(t, CLIN.day, CLIN.full);
    for (const side of SIDES) {
      /* CAUDAL OF THE FOURTH CLEFT, NOT AT IT — row Z. With the tract at its presenting calibre its
         external end ran through the fourth groove: 43% of cleft 4's sampled surface was inside the
         fistula's solid. A complete branchial fistula is a SECOND cleft anomaly whose external
         opening is low on the anterior border of sternocleidomastoid, not a fourth-cleft groove, so
         a tract that passes through cleft 4 draws the wrong embryological claim. */
      const yLow = F.yP[4] - 0.45 * F.seg;
      /* AND IT LEAVES DORSAL OF THE GROOVE LINE, which is the other half of the same row-Z repair.
         Caudal of cleft 4 was not enough on its own: at day 56 that groove is a mounting vestige
         0.012 of an intersegment across, sitting at z ~ 0 on the same line the tract was rising
         along, and a tract 0.19 across swallowed a third of it. A fistula tract runs deep to the
         deep fascia before it turns up between the carotids, so starting it 0.55 of an intersegment
         dorsal is the truer course as well as the clear one. */
      const ext = new T.Vector3(side * F.Rflap(yLow) * 1.16, yLow - 0.26 * F.seg, -0.55 * F.seg);
      /* the internal end is the second pouch's own tip, read from the pouch rather than typed */
      const int = pouchTip(t, side, 2);
      /* the control point carries the tract between the carotids: at their level it sits at z ~ 0,
         which is the gap between the ventral external and the dorsal internal */
      const Cp = new T.Vector3(side * F_CAR_X * F.seg * 1.02, (ext.y + int.y) / 2 - 0.18 * F.seg,
                               0.10 * F.seg);   // see F_CAR_DZ: the tract comes back towards the gap's middle
      const rf = u => 0.155 * F.seg * live * (0.78 + 0.44 * Math.sin(Math.PI * clamp01(u)));  // see the cyst's note
      parts.push(K.tubeCapped(bez3(ext, Cp, int, 22), rf, { ring: 14, cap: 'both', capRows: 6 }));
    }
    addAll('branchial_fistula', parts, 'fistula');
  }

  /* ── the median plane reference ───────────────────────────────────────────────────────────────
     RENDER-STANDARD: "A REFERENCE MUST SURVIVE THE VIEW THAT USES IT" — the cardiac-looping median
     reference was 96.5% occluded because it lay at z = 0 behind the subject, and the lesson from the
     pouches model is the second half of it: a reference spanning the whole apparatus sets the frame
     for every beat that shows it. This one is a TICK at the clefts' own levels, standing VENTRAL of
     everything else so the anterior camera sees it against the background, and it is shown only by
     the beats that make a left/right or a midline claim. */
  {
    const zFront = F.Rcleft(F.yP[2]) * 0.42;
    const pts = [new T.Vector3(0, F.yP[1] + 0.3 * F.seg, zFront),
                 new T.Vector3(0, F.yP[3] - 0.3 * F.seg, zFront)];
    add('median_plane', K.tubeCapped(pts, () => 0.030 * F.seg, { ring: 10, cap: 'both', capRows: 5 }),
        'midline', { matOver: { opacity: 0.8 } });
  }

  return g;
}

/* ══════════════════════════════════════════════════════════════════ measurement
   The helper block below is pharyngeal-pouches.js's, copied with its reasons intact rather than
   rewritten, for the same argument the frame law is copied: a copy can be checked for drift. */

const _cache = {};
function groupAt(t) {
  const k = t.toFixed(6);
  if (!_cache[k]) _cache[k] = buildClefts(t, {});
  return _cache[k];
}
function clearCache() { for (const k in _cache) delete _cache[k]; _verts = new Map(); }

let _verts = new Map();
function vertsOf(g, key) {
  let byKey = _verts.get(g);
  if (!byKey) { byKey = new Map(); _verts.set(g, byKey); }
  if (byKey.has(key)) return byKey.get(key);
  const out = [];
  g.traverse(m => {
    if (!m.isMesh || !m.geometry || (m.userData && m.userData.outline)) return;
    if (!m.userData || m.userData.key !== key) return;
    const p = m.geometry.attributes.position.array;
    for (let i = 0; i < p.length; i++) out.push(p[i]);
  });
  byKey.set(key, out);
  return out;
}
/** the bounding box of ONE SIDE of a paired key. Every structure here is built as a PAIR about
    x = 0, so the pair's box x size is dominated by the distance between left and right rather than
    by the structure's own reach — which is not what any size claim here means. */
function sideBox(g, key, side) {
  const V = vertsOf(g, key);
  const b = { min: [Infinity, Infinity, Infinity], max: [-Infinity, -Infinity, -Infinity] };
  let n = 0;
  for (let i = 0; i < V.length; i += 3) {
    if (side && !(side > 0 ? V[i] >= 0 : V[i] <= 0)) continue;
    n++;
    for (let a = 0; a < 3; a++) {
      if (V[i + a] < b.min[a]) b.min[a] = V[i + a];
      if (V[i + a] > b.max[a]) b.max[a] = V[i + a];
    }
  }
  if (!n) return null;
  b.size = [b.max[0] - b.min[0], b.max[1] - b.min[1], b.max[2] - b.min[2]];
  b.n = n;
  return b;
}
/* ── WHICH AXIS A STRUCTURE'S "OWN EXTENT" MEANS, AND WHY IT IS NOT ALWAYS THE LARGEST ───────────
   pharyngeal-pouches.js records this confound on its pouch stems: a structure whose largest
   dimension is NOT the dimension that grows reads as substantial at its own mounting vestige, and
   row V then passes on something that has effectively gone. Three keys here are that shape and each
   for its own reason, so the axis is declared per key rather than guessed:

     cleft2/3/4   a groove's craniocaudal LIP LENGTH is fixed at +/- 0.42 of an intersegment at every
                  stage; what involutes is its DEPTH and calibre, which are x.
     operculum    the flap's arc across the body wall does not change as it grows; what grows is how
                  far CAUDALLY its free margin has reached, which is y.
     cervical_sinus  likewise — the cast's arc is set by the flap's arc, and what opens and closes is
                  its craniocaudal reach, y.

   Everything else grows in every dimension at once and takes the largest. Row V reports the axis it
   used beside each number, so a reviewer can disagree with the choice rather than having to find
   it. */
const VEST_AXIS = {
  cleft2: 'x', cleft3: 'x', cleft4: 'x',
  operculum: 'y', cervical_sinus: 'y',
};
/* MEASURED PER SUB-MESH AND NOT OVER THE KEY'S BOX, which is the other half of the same confound.
   `membranes_lower` is THREE discs under one key, one at each of clefts 2, 3 and 4, so the key's box
   spans two whole intersegments however small each disc becomes: row V read a head of 1.26 over the
   largest dimension and 2.22 over x, on a structure that involutes tenfold. Neither number was about
   a membrane. The largest SINGLE sub-mesh is the structure's own extent; for a key with one part per
   side this is identical to the box, so nothing else moves. */
function ownExtentSeg(t, key) {
  const g = groupAt(t);
  const ax = VEST_AXIS[key];
  let best = 0;
  g.traverse(m => {
    if (!m.isMesh || !m.geometry || (m.userData && m.userData.outline)) return;
    if (!m.userData || m.userData.key !== key) return;
    const p = m.geometry.attributes.position.array;
    const lo = [Infinity, Infinity, Infinity], hi = [-Infinity, -Infinity, -Infinity];
    let n = 0;
    for (let i = 0; i < p.length; i += 3) {
      if (p[i] < 0) continue;                        // one side only — see sideBox
      n++;
      for (let a = 0; a < 3; a++) { if (p[i + a] < lo[a]) lo[a] = p[i + a]; if (p[i + a] > hi[a]) hi[a] = p[i + a]; }
    }
    if (!n) return;
    const sz = [hi[0] - lo[0], hi[1] - lo[1], hi[2] - lo[2]];
    const v = ax === 'x' ? sz[0] : ax === 'y' ? sz[1] : ax === 'z' ? sz[2] : Math.max(sz[0], sz[1], sz[2]);
    if (v > best) best = v;
  });
  return best / frameAt(t).seg;
}
function bboxOf(g, key) {
  const V = vertsOf(g, key);
  if (!V.length) return null;
  const b = { min: [Infinity, Infinity, Infinity], max: [-Infinity, -Infinity, -Infinity] };
  for (let i = 0; i < V.length; i += 3) for (let a = 0; a < 3; a++) {
    if (V[i + a] < b.min[a]) b.min[a] = V[i + a];
    if (V[i + a] > b.max[a]) b.max[a] = V[i + a];
  }
  b.size = [b.max[0] - b.min[0], b.max[1] - b.min[1], b.max[2] - b.min[2]];
  b.centre = [(b.min[0] + b.max[0]) / 2, (b.min[1] + b.max[1]) / 2, (b.min[2] + b.max[2]) / 2];
  return b;
}
function centroidOf(g, key, sideSign) {
  const V = vertsOf(g, key);
  let n = 0, sx = 0, sy = 0, sz = 0;
  for (let i = 0; i < V.length; i += 3) {
    if (sideSign && Math.sign(V[i]) !== Math.sign(sideSign)) continue;
    sx += V[i]; sy += V[i + 1]; sz += V[i + 2]; n++;
  }
  return n ? { x: sx / n, y: sy / n, z: sz / n, n } : null;
}
function triCount(g, key) {
  let n = 0;
  g.traverse(m => {
    if (!m.isMesh || !m.geometry || (m.userData && m.userData.outline)) return;
    if (key && (!m.userData || m.userData.key !== key)) return;
    n += m.geometry.attributes.position.count / 3;
  });
  return n;
}
function keysOf(g) {
  const s = {};
  g.traverse(m => { if (m.isMesh && m.userData && !m.userData.outline && m.userData.key) s[m.userData.key] = true; });
  return Object.keys(s).sort();
}
function trisOf(g, key, side) {
  const V = vertsOf(g, key);
  const out = [];
  for (let i = 0; i + 8 < V.length; i += 9) {
    if (side) {
      const cx = (V[i] + V[i + 3] + V[i + 6]) / 3;
      if (side > 0 ? cx < 0 : cx > 0) continue;
    }
    out.push(V.slice(i, i + 9));
  }
  return out;
}
/* MOLLER-TRUMBORE. Three skew directions and a majority vote: one ray is not enough, because a
   vertex that grazes a neighbouring triangle edge-on, or sits on a surface of revolution's own axis,
   returns a parity that is right in principle and wrong in arithmetic. */
const PARITY_DIRS = (() => {
  const D = [[1, 0.0371, 0.0177], [0.0213, 1, 0.0431], [0.0307, 0.0119, 1]];
  for (const d of D) { const L = Math.hypot(d[0], d[1], d[2]); d[0] /= L; d[1] /= L; d[2] /= L; }
  return D;
})();
function crossings(ox, oy, oz, dx, dy, dz, tris) {
  let n = 0;
  for (let k = 0; k < tris.length; k++) {
    const tr = tris[k];
    const e1x = tr[3] - tr[0], e1y = tr[4] - tr[1], e1z = tr[5] - tr[2];
    const e2x = tr[6] - tr[0], e2y = tr[7] - tr[1], e2z = tr[8] - tr[2];
    const px = dy * e2z - dz * e2y, py = dz * e2x - dx * e2z, pz = dx * e2y - dy * e2x;
    const det = e1x * px + e1y * py + e1z * pz;
    if (Math.abs(det) < 1e-18) continue;
    const inv = 1 / det, tx = ox - tr[0], ty = oy - tr[1], tz = oz - tr[2];
    const u = (tx * px + ty * py + tz * pz) * inv;
    if (u < 0 || u > 1) continue;
    const qx = ty * e1z - tz * e1y, qy = tz * e1x - tx * e1z, qz = tx * e1y - ty * e1x;
    const v = (dx * qx + dy * qy + dz * qz) * inv;
    if (v < 0 || u + v > 1) continue;
    if ((e2x * qx + e2y * qy + e2z * qz) * inv > 1e-9) n++;
  }
  return n;
}
/** the fraction of key A's sampled left-side vertices that lie INSIDE key B's left-side solid */
function insideFrac(g, a, b, sample) {
  const S = sample || 40;
  const tris = trisOf(g, b, +1);
  if (!tris.length) return 0;
  const V = vertsOf(g, a);
  const pts = [];
  for (let i = 0; i < V.length; i += 3) if (V[i] >= 0) pts.push([V[i], V[i + 1], V[i + 2]]);
  if (!pts.length) return 0;
  const step = Math.max(1, Math.floor(pts.length / S));
  let inn = 0, n = 0;
  for (let i = 0; i < pts.length; i += step) {
    n++;
    let yes = 0;
    for (const d of PARITY_DIRS) if (crossings(pts[i][0], pts[i][1], pts[i][2], d[0], d[1], d[2], tris) % 2 === 1) yes++;
    if (yes >= 2) inn++;
  }
  return n ? inn / n : 0;
}
/** the smallest distance from any sampled vertex of A to any vertex of B, in intersegments — used to
    assert CONTACT, which is the claim "the membrane belongs to both sides" actually makes */
function minGapSeg(g, a, b, t, sample) {
  const S = sample || 160;
  const VA = vertsOf(g, a), VB = vertsOf(g, b);
  const pick = V => {
    const out = [];
    for (let i = 0; i < V.length; i += 3) if (V[i] >= 0) out.push([V[i], V[i + 1], V[i + 2]]);
    const st = Math.max(1, Math.floor(out.length / S));
    return out.filter((_, i) => i % st === 0);
  };
  const A = pick(VA), B = pick(VB);
  if (!A.length || !B.length) return Infinity;
  let best = Infinity;
  for (const p of A) for (const q of B) {
    const d = (p[0] - q[0]) ** 2 + (p[1] - q[1]) ** 2 + (p[2] - q[2]) ** 2;
    if (d < best) best = d;
  }
  return Math.sqrt(best) / frameAt(t).seg;
}

/* ══════════════════════════════════════════════════════════════════ THE MECHANISM, MEASURED

   WHICH CLEFTS ARE BURIED, read by ray cast against the built flap and not asserted anywhere.

   The anatomical definition of "buried" is that the groove no longer opens to the outside — a ray
   leaving it laterally runs into the operculum instead of into free space. So that is literally what
   this measures: for each sampled vertex of the cleft on the left side, a ray along the LOCAL
   OUTWARD RADIAL direction from the pharyngeal axis, and a count of how many of them hit the flap.

   RADIAL AND NOT +x, which matters: the flap wraps an arc, so a cleft vertex at the dorsal or
   ventral end of the groove is covered by a part of the plate that is nowhere near the +x direction,
   and a straight +x cast would read those as open. The radial direction is the one a surface groove
   actually opens along. */
function coveredFrac(t, key, sample) {
  const g = groupAt(t);
  const tris = trisOf(g, 'operculum', +1);
  if (!tris.length) return 0;
  const V = vertsOf(g, key);
  const pts = [];
  for (let i = 0; i < V.length; i += 3) if (V[i] >= 0) pts.push([V[i], V[i + 1], V[i + 2]]);
  if (!pts.length) return 0;
  const S = sample || 60;
  const step = Math.max(1, Math.floor(pts.length / S));
  let hit = 0, n = 0;
  for (let i = 0; i < pts.length; i += step) {
    const p = pts[i];
    const rl = Math.hypot(p[0], p[2]);
    if (rl < 1e-9) continue;
    n++;
    if (crossings(p[0], p[1], p[2], p[0] / rl, 0, p[2] / rl, tris) > 0) hit++;
  }
  return n ? hit / n : 0;
}

/** SOLVED BY BISECTION: the day a cleft becomes buried, i.e. the day its covered fraction crosses
    one half. There is no closed form — the flap's edge rides a smoothstep, its radius rides the
    exponential growth law, the cleft's own depth involutes on a third curve, and the measure is a
    ray cast against a triangulated plate. Returns bracketed:false where no such day exists, which is
    the answer for the cleft that survives. */
function solveBuryDay(key) {
  let lo = tOfDay(OP.day), hi = 1;
  const f = tv => coveredFrac(tv, key, 60) - 0.5;
  const flo = f(lo), fhi = f(hi);
  if (!(flo < 0 && fhi > 0)) {
    return { day: NaN, bracketed: false, covered_at_start: flo + 0.5, covered_at_end: fhi + 0.5 };
  }
  for (let i = 0; i < 26; i++) {
    const mid = (lo + hi) / 2;
    if (f(mid) < 0) lo = mid; else hi = mid;
  }
  const tm = (lo + hi) / 2;
  return { day: dayOf(tm), t: tm, bracketed: true, covered: coveredFrac(tm, key, 60) };
}

/** SOLVED BY BISECTION: the day the flap's free margin MEETS the epipericardial ridge — measured as
    the gap between the two built solids crossing zero, not as the end of the growth window. The two
    are different numbers because the flap's edge reaches the ridge's SURFACE before it reaches the
    ridge's level, by an amount that depends on both calibres: row O-fuse reports the difference, and
    row O-fuse-perturb changes the ridge's calibre and requires the solved day to move. */
function solveFusionDay(ridgeFrac) {
  const save = _override.RIDGE_R;
  if (ridgeFrac != null) { _override.RIDGE_R = ridgeFrac; clearCache(); }
  try {
    let lo = tOfDay(OP.day), hi = 1;
    const thr = FLOORS.FUSE * ridgeR();
    const f = tv => minGapSeg(groupAt(tv), 'operculum', 'epipericardial_ridge', tv, 320) - thr;
    const flo = f(lo), fhi = f(hi);
    if (!(flo > 0 && fhi < 0)) {
      return { day: NaN, bracketed: false, threshold_seg: thr,
               gap_lo_seg: flo + thr, gap_hi_seg: fhi + thr };
    }
    for (let i = 0; i < 22; i++) {
      const mid = (lo + hi) / 2;
      if (f(mid) > 0) lo = mid; else hi = mid;
    }
    const tm = (lo + hi) / 2;
    return { day: dayOf(tm), t: tm, bracketed: true, threshold_seg: thr,
             ridge_calibre_seg: ridgeR(),
             gap_at_solution_seg: minGapSeg(groupAt(tm), 'operculum', 'epipericardial_ridge', tm, 320) };
  } finally { _override.RIDGE_R = save; clearCache(); }
}

/** the three laminae of the membrane, projected on the cleft-to-pouch axis and read off their built
    centroids. The ORDER is the claim; the offsets are reported so a reviewer can argue with them. */
function laminaOrder(t) {
  const g = groupAt(t);
  const side = +1;
  const cleft = cleftPoint(t, side, 1).mid;
  const pt = pouchTip(t, side, 1);
  const axis = pt.clone().sub(cleft);
  if (axis.lengthSq() < 1e-12) return null;
  axis.normalize();
  const origin = pt.clone().lerp(cleft, 0.5);
  const proj = key => {
    const c = centroidOf(g, key, side);
    if (!c) return NaN;
    return (c.x - origin.x) * axis.x + (c.y - origin.y) * axis.y + (c.z - origin.z) * axis.z;
  };
  const o = TM_LAMINAE.map(L => ({ key: L.key, along: proj(L.key) }));
  const thick = Math.abs(o[2].along - o[0].along);
  return { offsets: o, spread: thick, seg: frameAt(t).seg,
           axis: [axis.x, axis.y, axis.z] };
}

/* ══════════════════════════════════════════════════════════════════ acceptance */

const FLOORS = {
  SEP: 0.35,          // RENDER-STANDARD's starting magnitude floor, as a fraction of mean extent
  SPACING: 0.05,      // how equal "five equal intersegments" has to be, as a fraction of a segment
  BURIED: 0.80,       // a cleft the model calls buried must be this covered
  OPEN: 0.08,         // ...and one it calls open must be no more covered than this
  SYMM: 0.002,        // mirror symmetry in x, as a fraction of the model's own width
  VESTIGE_HEAD: 4.0,  // a live structure must be this many times its own vestige
  CONTACT: 0.12,      // "belongs to both" — a gap under this many intersegments is contact
  SHARE: 0.02,        // the containment ceiling for a pair that must NOT share space
  CROSS_MOVE: 0.05,   // how far a perturbation has to move a solved day, as a fraction
  LAMINA: 0.22,       // lamina separation, as a fraction of the membrane's own total spread
  WFIT: 0.001,        // cross-model agreement, in intersegments
  /* CONTACT BETWEEN THE FLAP AND THE RIDGE, AS A FRACTION OF THE RIDGE'S OWN CALIBRE and not as an
     absolute gap. The first draft used a flat 0.02 of an intersegment and the solve came back
     unbracketed: the closest the two sampled surfaces ever get is 0.187, which is not a failure to
     fuse, it is a vertex-sampled measure of two curved surfaces that are in contact. A threshold
     expressed in the structure's own size is also the only form in which row O-fuse-perturb means
     anything — a fatter ridge is met EARLIER, and a threshold that did not move with the calibre
     would be measuring the sampling and not the anatomy. */
  FUSE: 0.42,         // fraction of the ridge's calibre: surfaces this close are touching
};

/* ── ROW Z's PARTITION, PUBLISHED RATHER THAN APPLIED AS A TOLERANCE ──────────────────────────────
   RENDER-STANDARD 3.z: "Contact that is CONSTRUCTION rather than anatomy is excluded BY NAME, in a
   partition the row publishes, never by a tolerance. Anything left over is either a defect or a
   declared consequence of something the model does not build." Each entry is an argument; a reviewer
   can disagree with any of them and the row will still tell them the number. */
const Z_EXCLUDE = [
  ['meatal_plug', 'meatus_lumen', 'THE SAME SPACE AT TWO DIFFERENT TIMES. The plug is the canal before it recanalises and the lumen is the canal after; they are one structure in two states, drawn at one scale because the second state is at about week 28 and outside this model\'s t window. NO BEAT DRAWS BOTH — the render harness asserts that, because this exclusion is only honest if nothing does.'],
  ['meatal_plug', 'cleft1', 'ANATOMY: the plug IS the floor of the first cleft filling in with ectodermal cells. Continuity with the groove it fills is the fact, not an artefact.'],
  ['meatus_lumen', 'cleft1', 'ANATOMY: the canal IS the first cleft, deepened. Same reason as the plug.'],
  ['meatal_plug', 'tm_ectoderm', 'ANATOMY: the plug reaches as far as the developing tympanic cavity, so its medial end abuts the membrane\'s outer layer. Both are ectoderm of the first cleft.'],
  ['meatus_lumen', 'tm_ectoderm', 'ANATOMY: as the plug — the canal\'s medial end IS the outer surface of the eardrum.'],
  ['tm_ectoderm', 'tm_mesoderm', 'A LAMINATED SHEET: each layer\'s face is its neighbour\'s face. Three germ layers a few cells thick in one structure is the teaching point, and laminae in contact is what that means.'],
  ['tm_mesoderm', 'tm_endoderm', 'As above — the laminated sheet.'],
  ['tm_ectoderm', 'tm_endoderm', 'As above. They are the two outer faces of one sheet and their boxes meet across the mesoderm between them.'],
  ['tm_endoderm', 'pouch1', 'ANATOMY: the membrane\'s inner layer IS the endoderm of the first pouch. Continuity is the claim.'],
  ['cleft1', 'auricular_hillocks', 'ANATOMY: the hillocks appear around the MOUTH of the first cleft, on arches 1 and 2. That they are the same neighbourhood is the reason they are in this scene at all.'],
  ['arch_bars', 'auricular_hillocks', 'ANATOMY: the hillocks are swellings ON arches 1 and 2.'],
  ['arch_bars', 'cleft1', 'ANATOMY: a cleft is the groove BETWEEN two arch bars.'],
  ['arch_bars', 'cleft2', 'ANATOMY: as cleft 1.'],
  ['arch_bars', 'cleft3', 'ANATOMY: as cleft 1.'],
  ['arch_bars', 'cleft4', 'ANATOMY: as cleft 1.'],
  ['arch_bars', 'operculum', 'ANATOMY: the operculum IS the second arch, grown caudally. It leaves that bar.'],
  ['arch_bars', 'epipericardial_ridge', 'ANATOMY: the ridge lies against the caudal arches, which is what the flap fuses to it across.'],
  ['arch_bars', 'pouch1', 'ANATOMY: a pouch is the pocket BETWEEN two arch bars, as a cleft is the groove between them.'],
  ['arch_bars', 'pouch2', 'ANATOMY: as pouch 1.'],
  ['arch_bars', 'pharyngeal_wall', 'ANATOMY: the bars wrap the wall.'],
  ['pharyngeal_wall', 'pouch1', 'ANATOMY: a pouch is an outpocketing OF the wall; its proximal end is the wall.'],
  ['pharyngeal_wall', 'pouch2', 'ANATOMY: as pouch 1.'],
  ['pharyngeal_wall', 'membranes_lower', 'DECLARED CONSEQUENCE of something this model does not build. Pouches 3 and 4 belong to the pharyngeal-pouches entry and are deliberately absent here, so membranes 3 and 4 are placed just medial to their own cleft floors with the wall as their medial reference. The scene\'s gaps[] states it.'],
  ['cervical_sinus', 'cleft2', 'ANATOMY: the lower clefts OPEN INTO the cervical sinus — their ectoderm is its lining. "Their ectoderm-lined spaces run together into one cavity" is the narration.'],
  ['cervical_sinus', 'cleft3', 'ANATOMY: as cleft 2.'],
  ['cervical_sinus', 'cleft4', 'ANATOMY: as cleft 2.'],
  ['cervical_sinus', 'operculum', 'ANATOMY: the sinus is the space UNDER the flap. Its outer face is the flap\'s inner face by construction, which is the whole reason it is built from the same surface.'],
  ['cervical_sinus', 'branchial_cyst', 'ANATOMY: a branchial cyst IS a piece of the cervical sinus that failed to obliterate. Its centre is read off the sinus\'s own mid-surface.'],
  ['branchial_cyst', 'cleft2', 'ANATOMY: a branchial cyst is a SECOND cleft anomaly, which the narration states outright — "Because it is a remnant of the second cleft, its tract runs between the internal and external carotid arteries." Continuity with cleft 2 is the fact the viva point rests on.'],
  ['cervical_sinus', 'epipericardial_ridge', 'ANATOMY: the ridge is what the flap fuses WITH, so it is the sinus\'s caudal boundary. The cast ending against it is the closure.'],
  ['cervical_sinus', 'branchial_sinus_tract', 'ANATOMY: the tract leaves the sinus. Same structure, continued.'],
  ['cervical_sinus', 'branchial_fistula', 'ANATOMY: the fistula is the sinus open at both ends.'],
  ['branchial_cyst', 'operculum', 'ANATOMY: a branchial cyst is a remnant of the cervical sinus, and the cervical sinus is the space UNDER the flap. A cyst in the neck lies deep to the body wall the second arch has become \u2014 that is why it presents as a swelling rather than as a visible pit. Appeared when the flap\'s stand-off was corrected to a fraction of its own length (opSurface), which brought the plate radially closer to the surface it covers; it is contact in the right place and the row reports the figure so it cannot grow.'],
  ['epipericardial_ridge', 'operculum', 'ANATOMY, AND IT IS THE MECHANISM. The flap FUSES with the ridge \u2014 "the second arch enlarges and grows downwards like a flap over the third and fourth arches, and fuses with the ridge below them". Two surfaces that fuse are in contact by definition, and row O-fuse SOLVES the day they meet by bisecting the measured gap between exactly these two solids: the containment reported here IS that contact, after it has happened. Appeared when the flap\'s half-arc was narrowed from 0.88 to 0.52 radians by proof 4, which changed how much of the ridge the plate overlaps rather than whether it reaches it.'],
  ['branchial_fistula', 'epipericardial_ridge', 'THE ANOMALY, NOT CONSTRUCTION. A complete fistula\'s external opening is low on the neck, caudal of the fourth groove, and to reach the skin from the cervical sinus the tract must cross the body wall at the level the ridge occupies. A tract that stopped short of it would have no external opening, which is the difference between a fistula and a cyst.'],
  ['operculum', 'branchial_sinus_tract', 'THE ANOMALY, NOT CONSTRUCTION. An external opening is by definition a tract that pierces the body wall the flap has become. A tract that did not cross the operculum would not be a sinus.'],
  ['operculum', 'branchial_fistula', 'As the sinus tract — the external opening pierces the wall.'],
  ['branchial_cyst', 'branchial_sinus_tract', 'THREE PRESENTATIONS OF ONE REMNANT, never drawn together as three coexisting structures in one patient. The scene shows them in one beat to be compared, which is what the narration does: closed, open to skin, open at both ends.'],
  ['branchial_cyst', 'branchial_fistula', 'As above.'],
  ['branchial_sinus_tract', 'branchial_fistula', 'As above — the same remnant with one more opening.'],
  ['branchial_fistula', 'pouch2', 'ANATOMY: the internal opening IS at the second pouch. Row F-internal asserts the contact deliberately.'],
  ['branchial_fistula', 'carotid_internal', 'DECLARED: the tract runs BETWEEN the two carotids and their bounding boxes necessarily interleave. Row F-between measures the SIGNED position against both rather than relying on boxes, and row Z reports the containment figure here so it cannot grow unnoticed.'],
  ['branchial_fistula', 'carotid_external', 'As the internal carotid.'],
  ['carotid_internal', 'carotid_external', 'ANATOMY: the external carotid arises FROM the common carotid alongside the internal. Their proximal ends are continuous.'],
];

/** the y level at which a cleft meets the SURFACE — the midpoint of the vertices in the outermost
    slab of the groove's own x range. That, and not the groove's bounding-box centre, is what "the
    clefts sit at the internal divisions of five equal intersegments" is a claim about: the groove is
    a dip inward from the surface, and its lip is where a student counts it. A slab of the x RANGE
    rather than a percentage of the vertex count, for the reason pharyngeal-pouches.js records on the
    equivalent measure — a 5%-of-vertices slice reaches across several stations of the sweep. */
function lipY(g, key) {
  const V = vertsOf(g, key);
  const pts = [];
  for (let i = 0; i < V.length; i += 3) if (V[i] > 0) pts.push([V[i], V[i + 1]]);
  if (!pts.length) return NaN;
  let xmin = Infinity, xmax = -Infinity;
  for (const p of pts) { if (p[0] < xmin) xmin = p[0]; if (p[0] > xmax) xmax = p[0]; }
  const lim = xmax - 0.02 * (xmax - xmin);
  let lo = Infinity, hi = -Infinity;
  for (const p of pts) if (p[0] >= lim) { if (p[1] < lo) lo = p[1]; if (p[1] > hi) hi = p[1]; }
  return (lo + hi) / 2;
}

/* peak and floor extents, scanned day by day off the model rather than taken from the growth laws */
const _peak = {}, _floor = {}, _peakDay = {};
function scanExtents(key) {
  if (_peak[key] != null) return;
  let best = -1, worst = Infinity, bd = NaN;
  for (let d = DAY0; d <= DAY1 + 1e-9; d += 1) {
    const v = ownExtentSeg(tOfDay(d), key);
    if (v > best) { best = v; bd = d; }
    if (v < worst) worst = v;
  }
  _peak[key] = best; _floor[key] = worst; _peakDay[key] = bd;
}
function peakExtentSeg(key) { scanExtents(key); return _peak[key]; }
function floorExtentSeg(key) { scanExtents(key); return _floor[key]; }
function peakDay(key) { scanExtents(key); return _peakDay[key]; }

const VESTIGED = ['cleft2', 'cleft3', 'cleft4', 'cervical_sinus', 'membranes_lower', 'operculum'];

function acceptance() {
  clearCache();
  const rows = [];
  const add = (id, must, got, pass, floor, neg) => rows.push({ id, must, got, pass: !!pass, floor, negative: neg });

  const tEarly = tOfDay(30), tMid = tOfDay(40), tLate = 1;
  const gE = groupAt(tEarly), gM = groupAt(tMid), gL = groupAt(tLate);

  /* ---- G · the growth law is a fit with a real residual, and perturbing an anchor moves it ---- */
  {
    const alt = fitLogLinear([[22, 2.0 * 1.6], [35, 8.0], [56, 30.0]]);
    const moved = Math.abs(alt.B - CRL_FIT.B) / CRL_FIT.B;
    add('G-fit', 'CRL is a least-squares log-linear fit through three stated anchors, over-determined so the residual is real',
      { A: CRL_FIT.A, B_per_day: CRL_FIT.B, rms_ln: CRL_FIT.rms_ln, residuals_ln: CRL_FIT.residuals,
        crl_d22_mm: crl(0), crl_d56_mm: crl(1) },
      CRL_FIT.rms_ln > 1e-6 && CRL_FIT.B > 0, 'rms residual > 0 (a 2-parameter fit through 3 anchors)',
      { case: 'a fit whose residual is zero, i.e. arithmetic done twice rather than a solve',
        rejected: !(CRL_FIT.rms_ln <= 1e-6) });
    add('G-perturb', 'moving the day-22 anchor by 60% moves the fitted growth rate',
      { B_default: CRL_FIT.B, B_perturbed: alt.B, moved_frac: moved },
      moved >= FLOORS.CROSS_MOVE, '>= 5% change in B',
      { case: 'a perturbation that leaves the answer alone', rejected: !(moved < 1e-9) });
  }

  /* ---- P · the four clefts sit at the internal divisions of five EQUAL intersegments ----
     Measured off each groove's own lip on the surface, not off the frame's yP table. */
  {
    const F = frameAt(tMid);
    const spreadOf = lev => {
      const d = [lev[0] - lev[1], lev[1] - lev[2], lev[2] - lev[3]];
      return { gaps: d, mean: d.reduce((a, b) => a + b, 0) / 3, spread: Math.max(...d) - Math.min(...d) };
    };
    const lev = [1, 2, 3, 4].map(k => lipY(gM, 'cleft' + k));
    const S = spreadOf(lev);
    /* THE NEGATIVE CASE IS A MISTAKE A TEXT INVITES. The scene's own gaps[] records that texts differ
       on how completely the fourth cleft is formed, and some describe three well-defined clefts with
       a rudimentary fourth. A student who counted the epipericardial RIDGE as the fourth groove would
       get the set below — and it is not equally spaced, because the ridge is at 4.5 intersegments and
       a cleft would be at 4.0. The predicate must reject it. */
    const wrong = [lev[0], lev[1], lev[2], bboxOf(gM, 'epipericardial_ridge').centre[1]];
    const SW = spreadOf(wrong);
    add('P-spacing', 'the four clefts dip into the surface at the internal divisions of five EQUAL intersegments — a construction rule, not four tuned levels',
      { lip_levels_y: lev, gaps: S.gaps, mean_gap: S.mean, spread: S.spread,
        seg: F.seg, spread_over_seg: S.spread / F.seg,
        rejected_measurement_ridge_as_cleft4: { levels_y: wrong, spread_over_seg: SW.spread / F.seg } },
      S.spread / F.seg <= FLOORS.SPACING, 'spread <= 5% of one intersegment',
      { case: 'the same assertion fed the epipericardial ridge as if it were the fourth cleft, which is 4.5 intersegments down rather than 4.0',
        rejected: !(SW.spread / F.seg <= FLOORS.SPACING) });
    add('P-order', 'and they run craniocaudally in numerical order: cleft 1 is the most CRANIAL, cleft 4 the most caudal',
      { lip_levels_y: lev },
      lev[0] > lev[1] && lev[1] > lev[2] && lev[2] > lev[3], 'strictly decreasing y',
      { case: 'the order asserted the other way round', rejected: !(lev[0] < lev[1] && lev[1] < lev[2] && lev[2] < lev[3]) });
  }

  /* ---- O · THE MECHANISM. Which clefts the flap buries, measured and then solved. ----
     This is the block the whole file exists for. Nothing above or below states that the first cleft
     persists; these rows read it off the geometry. */
  {
    const bury = {};
    for (let k = 1; k <= 4; k++) bury['cleft' + k] = solveBuryDay('cleft' + k);
    const lower = [2, 3, 4].map(k => bury['cleft' + k]);
    const c1 = bury.cleft1;

    /* the first cleft's covered fraction at every sampled day — the survivor claim is about the
       whole window, not about one stage */
    const c1Scan = [];
    for (let d = OP.day; d <= DAY1 + 1e-9; d += 2) c1Scan.push({ day: d, covered: coveredFrac(tOfDay(d), 'cleft1', 60) });
    const c1Max = Math.max(...c1Scan.map(r => r.covered));

    /* THE PERTURBATION, AND IT IS THE POINT OF THE ROW RATHER THAN A FORMALITY. Hinge the flap on
       arch 1 instead of arch 2 — one number, read through opHinge() everywhere the geometry uses it
       — and the first cleft IS buried. So the survivor's identity is a consequence of where the flap
       starts, which is what the narration says, and not something this file asserts. */
    const savedHinge = _override.OP_HINGE;
    _override.OP_HINGE = 0.5; clearCache();
    let c1MaxMoved = NaN, c1BuriedMoved = null;
    try {
      let m = 0;
      for (let d = OP.day; d <= DAY1 + 1e-9; d += 2) m = Math.max(m, coveredFrac(tOfDay(d), 'cleft1', 60));
      c1MaxMoved = m;
      c1BuriedMoved = solveBuryDay('cleft1');
    } finally { _override.OP_HINGE = savedHinge; clearCache(); }

    add('O-survivor', 'ONLY THE FIRST CLEFT PERSISTS — and this file never says so. The flap is hinged on arch 2 and cleft 1 lies half an intersegment CRANIAL of that hinge, so the flap grows away from it: measured by ray cast along each groove\'s own outward radial, cleft 1 is never buried at any day in the window',
      { hinge_intersegments: OP_HINGE_DEFAULT, cleft1_level_intersegments: 1.0,
        cleft1_covered_max: c1Max, cleft1_covered_by_day: c1Scan,
        bisection: c1 },
      c1Max <= FLOORS.OPEN && !c1.bracketed, 'covered fraction <= 0.08 at every sampled day, and no burial day exists',
      { case: 'the SAME measurement with the flap hinged on arch 1 instead of arch 2 — one number, moved through the same indirection the geometry reads. Cleft 1 is then buried and this row must fail.',
        got: { hinge_intersegments: 0.5, cleft1_covered_max: c1MaxMoved, bisection: c1BuriedMoved },
        rejected: !(c1MaxMoved <= FLOORS.OPEN && !(c1BuriedMoved && c1BuriedMoved.bracketed)) });

    add('O-buried', 'clefts 2, 3 and 4 ARE buried, each at a day solved by bisection on its own covered fraction',
      { bury_days: { cleft2: lower[0], cleft3: lower[1], cleft4: lower[2] } },
      lower.every(r => r.bracketed && isFinite(r.day)), 'a burial day exists for each of the three',
      { case: 'the same solve asked of the cleft that survives, which must come back unbracketed rather than returning a day',
        got: { cleft1: c1 },
        rejected: !c1.bracketed });

    add('O-order', 'and they are buried in order, cranial first: the flap sweeps caudally, so cleft 2 goes before cleft 3 and cleft 3 before cleft 4',
      { days: lower.map(r => r.day),
        gaps_days: [lower[1].day - lower[0].day, lower[2].day - lower[1].day] },
      lower[0].day < lower[1].day && lower[1].day < lower[2].day, 'strictly increasing days',
      { case: 'the order asserted the other way round, which is what a flap growing cranially would give',
        rejected: !(lower[0].day > lower[1].day && lower[1].day > lower[2].day) });

    /* ---- O-fuse · the day the flap MEETS the ridge, solved on the gap between two solids ---- */
    const fuse = solveFusionDay(null);
    const fuseAlt = solveFusionDay(RIDGE_R_DEFAULT * 2.2);
    const moved = (isFinite(fuse.day) && isFinite(fuseAlt.day)) ?
      Math.abs(fuseAlt.day - fuse.day) / Math.abs(fuse.day - OP.day) : 0;
    add('O-fuse', 'the flap FUSES with the epipericardial ridge, and the day it does is solved by bisecting the measured gap between the two built solids rather than read off the growth window',
      { solved: fuse, growth_window_ends_day: OP.full,
        earlier_than_window_end_by_days: isFinite(fuse.day) ? OP.full - fuse.day : null },
      fuse.bracketed && fuse.day > OP.day && fuse.day < OP.full,
      'a day strictly inside the growth window — the surfaces meet before the parametric sweep ends',
      { case: 'the same solve on a ridge thinned fiftyfold, whose surface the flap never reaches: it must come back UNBRACKETED rather than returning the window end',
        got: { thin_ridge: solveFusionDay(RIDGE_R_DEFAULT * 0.02) },
        rejected: solveFusionDay(RIDGE_R_DEFAULT * 0.02).bracketed === false });
    add('O-fuse-perturb', 'and that day is a function of the built geometry: more than doubling the ridge\'s calibre moves it',
      { ridge_r_default: RIDGE_R_DEFAULT, ridge_r_perturbed: RIDGE_R_DEFAULT * 2.2,
        day_default: fuse.day, day_perturbed: fuseAlt.day, moved_frac_of_window: moved },
      moved >= FLOORS.CROSS_MOVE, '>= 5% of the window',
      { case: 'a perturbation that leaves the answer alone', rejected: !(moved < 1e-9) });
  }

  /* ---- M · the membrane: three layers, in the right order, belonging to both sides ---- */
  {
    const o = laminaOrder(tLate);
    const along = o.offsets.map(r => r.along);
    const sep = [along[1] - along[0], along[2] - along[1]];
    const minSep = Math.min(...sep) / (o.spread || 1);
    /* the ORDER is read off the built centroids; the negative case feeds the predicate the same
       three numbers in the order a model that stacked them backwards would produce */
    const rev = along.slice().reverse();
    add('M-order', 'the tympanic membrane is three layers and they are in the anatomical order: ectoderm OUTSIDE (from the first cleft), fibrous mesoderm in the MIDDLE, mucosa INSIDE (from the first pouch) — read off the three built centroids projected on the cleft-to-pouch axis',
      { axis_cleft_to_pouch: o.axis, offsets_along_axis: o.offsets,
        total_spread_units: o.spread, total_spread_mm: mm(o.spread),
        min_separation_over_spread: minSep },
      along[0] < along[1] && along[1] < along[2] && minSep >= FLOORS.LAMINA,
      'strictly increasing along the cleft-to-pouch axis, each gap >= 22% of the total spread',
      { case: 'the same predicate fed the three offsets reversed, which is what a model that stacked mucosa outermost would measure',
        rejected: !(rev[0] < rev[1] && rev[1] < rev[2]) });

    /* THE CHAIN, LINK BY LINK, because "belongs to both" is a claim about a continuous path from the
       outside of the embryo to the inside of the pharynx and a single gap measurement cannot say
       that. Outside the eardrum is cleft; inside the eardrum is pouch — and between the groove at
       the surface and the membrane at depth lies the canal the groove deepens into. Each of the
       three joins is measured; the membrane-to-cleft1 straight-line distance is reported too,
       because it is NOT small and a reviewer should see the number rather than discover it. */
    const gPlugCleft = minGapSeg(gL, 'meatal_plug', 'cleft1', tLate, 240);
    const gEctoPlug  = minGapSeg(gL, 'tm_ectoderm', 'meatal_plug', tLate, 240);
    const gEn        = minGapSeg(gL, 'tm_endoderm', 'pouch1', tLate, 240);
    const gDirect    = minGapSeg(gL, 'tm_ectoderm', 'cleft1', tLate, 240);
    const chain = [gPlugCleft, gEctoPlug, gEn];
    add('M-contact', 'and it belongs to BOTH sides of the apparatus — "the only thing that belongs to both, which is exactly why it is the boundary between the external and the middle ear". Measured as an unbroken chain: the first cleft joins the canal it deepens into, the canal joins the membrane\'s OUTER layer, and the membrane\'s INNER layer joins the first pouch.',
      { link_cleft1_to_canal_seg: gPlugCleft, link_canal_to_tm_ectoderm_seg: gEctoPlug,
        link_tm_endoderm_to_pouch1_seg: gEn,
        straight_line_tm_ectoderm_to_cleft1_seg: gDirect,
        why_the_straight_line_is_not_small: 'the first cleft deepens into the external acoustic meatus before it reaches the pouch, so the membrane sits at the canal\'s medial end and not at the groove',
        floor: FLOORS.CONTACT },
      chain.every(v => v <= FLOORS.CONTACT), 'every link <= 0.12 of an intersegment',
      { case: 'the same predicate fed the gap from the membrane to the FOURTH cleft, which it has no business touching',
        got: { gap_to_cleft4_seg: minGapSeg(gL, 'tm_ectoderm', 'cleft4', tLate, 240) },
        rejected: !(minGapSeg(gL, 'tm_ectoderm', 'cleft4', tLate, 240) <= FLOORS.CONTACT) });

    /* THE ERROR THIS SCENE EXISTS TO PREVENT, measured. The narration's own line: "a student who
       mixes these two sides loses marks in every question in this topic." A model in which the cleft
       and the pouch share space teaches that error harder than a colour could. */
    /* ---- M-nearest · the membrane's station is a FUNCTION of the pouch's built shape ---- */
    {
      const A0 = meatusAxis(tLate, +1);
      const saved = _override.P1_RISE;
      _override.P1_RISE = POUCH[0].rise * 0.4; clearCache();
      let A1 = null;
      try { A1 = meatusAxis(tLate, +1); } finally { _override.P1_RISE = saved; clearCache(); }
      const F = frameAt(tLate);
      const moved = A0.station.distanceTo(A1.station) / F.seg;
      add('M-nearest', 'the membrane is placed where the two SURFACES are nearest — "at the bottom of each cleft the ectoderm comes FACE TO FACE with the endoderm of the matching pouch" — found by walking the first pouch\'s own centreline and calibre law, not by taking its tip',
        { station_seg: A0.station.toArray().map(v => v / F.seg),
          radial_unit: A0.radial.toArray(),
          pouch_calibre_there_seg: A0.pouchR / F.seg,
          surface_to_cleft_floor_seg: A0.surface_gap / F.seg,
          membrane_thickness_seg: A0.memTh / F.seg,
          perturbed_p1_rise: { from: POUCH[0].rise, to: POUCH[0].rise * 0.4,
                               station_moved_seg: moved } },
        moved >= 0.10, 'the station moves at least 0.10 of an intersegment when the pouch\'s climb is cut to 40%',
        { case: 'a perturbation that leaves the station alone, which is what a tuned position would do',
          rejected: !(moved < 1e-9) });
    }

    const a = insideFrac(gL, 'cleft1', 'pouch1', 60), b = insideFrac(gL, 'pouch1', 'cleft1', 60);
    add('M-apart', 'the first cleft and the first pouch APPROACH AND STOP — ectoderm and endoderm never share space, with the three-layered membrane between them. This is the commonest marked-wrong answer in the topic and it is measured rather than coloured.',
      { cleft1_inside_pouch1: a, pouch1_inside_cleft1: b, ceiling: FLOORS.SHARE,
        clearance_F_CLEFT_intersegments: F_CLEFT },
      a <= FLOORS.SHARE && b <= FLOORS.SHARE, 'containment both ways <= 2%',
      { case: 'the same predicate fed a containment of 0.5, which is what the pouches model measured at F_CLEFT = 1.30 before that defect was found',
        rejected: !(0.5 <= FLOORS.SHARE) });
  }

  /* ---- F · the fistula: both ends at the structures the narration names, and the course between
     the carotids that makes excision an operation ---- */
  {
    const gapIn = minGapSeg(gL, 'branchial_fistula', 'pouch2', tLate, 140);
    add('F-internal', 'a complete fistula\'s INTERNAL opening is at a POUCH derivative — the tonsillar fossa, the second pouch. The tract\'s cranial end is read from the pouch\'s own tip rather than placed.',
      { gap_to_pouch2_seg: gapIn, floor: FLOORS.CONTACT },
      gapIn <= FLOORS.CONTACT, 'gap <= 0.12 of an intersegment',
      { case: 'the same predicate fed the gap to the FIRST pouch, which is the middle ear and not the tonsillar fossa',
        got: { gap_to_pouch1_seg: minGapSeg(gL, 'branchial_fistula', 'pouch1', tLate, 140) },
        rejected: !(minGapSeg(gL, 'branchial_fistula', 'pouch1', tLate, 140) <= FLOORS.CONTACT) });

    const F = frameAt(tLate);
    const bf = sideBox(gL, 'branchial_fistula', +1);
    const surfaceAt = F.Rflap(F.yP[4]);
    add('F-external', '...and its EXTERNAL opening is at a CLEFT derivative, on the surface — the tract reaches beyond the body wall the operculum has become',
      { fistula_max_x: bf.max[0], body_surface_x_at_that_level: surfaceAt,
        beyond_surface_seg: (bf.max[0] - surfaceAt) / F.seg },
      bf.max[0] > surfaceAt, 'the tract reaches past the flap\'s own radius',
      { case: 'the same predicate fed the fistula\'s most MEDIAL x, which is at the pouch end and is nowhere near the surface',
        rejected: !(bf.min[0] > surfaceAt) });

    /* BETWEEN THE CAROTIDS, measured in z at the level where the tract crosses them. The internal
       carotid is the dorsal (-z) one and the external the ventral (+z) one, which is the classical
       description the narration gives as the reason for complete excision. */
    const ci = centroidOf(gL, 'carotid_internal', +1), ce = centroidOf(gL, 'carotid_external', +1);
    const yCross = (ci.y + ce.y) / 2;
    /* the tract's z where it passes the carotids' own level, read off its vertices in a slab */
    const V = vertsOf(gL, 'branchial_fistula');
    let sz = 0, n = 0;
    const slab = 0.45 * F.seg;
    for (let i = 0; i < V.length; i += 3) {
      if (V[i] <= 0) continue;
      if (Math.abs(V[i + 1] - yCross) > slab) continue;
      sz += V[i + 2]; n++;
    }
    const zT = n ? sz / n : NaN;
    const spread = Math.abs(ce.z - ci.z);
    const mi = (zT - ci.z) / spread, me = (ce.z - zT) / spread;
    add('F-between', 'and the tract runs BETWEEN the internal and external carotid arteries — which is why treatment is complete excision rather than drainage. Measured in z at the carotids\' own level, with a magnitude floor on each side rather than a sign test.',
      { carotid_internal_z: ci.z, carotid_external_z: ce.z, separation: spread,
        tract_z_at_that_level: zT, slab_half_height_seg: slab / F.seg, vertices_in_slab: n,
        frac_of_gap_from_internal: mi, frac_of_gap_from_external: me },
      mi >= FLOORS.SEP && me >= FLOORS.SEP, 'at least 35% of the carotid separation clear of each',
      { case: 'the same predicate with the two carotids swapped — the internal taken as the ventral vessel — which must reject, because a tract between two vessels is only between them in one order',
        got: { frac_from_swapped_internal: (zT - ce.z) / spread, frac_from_swapped_external: (ci.z - zT) / spread },
        rejected: !(((zT - ce.z) / spread) >= FLOORS.SEP && ((ci.z - zT) / spread) >= FLOORS.SEP) });
  }

  /* ---- C · the addresses: a cyst is HIGH on the neck and a sinus opens LOW ---- */
  {
    const F = frameAt(tLate);
    const cy = centroidOf(gL, 'branchial_cyst', +1);
    const bt = sideBox(gL, 'branchial_sinus_tract', +1);
    const ec = cy.y, et = bt.min[1];
    const meanExtent = (sideBox(gL, 'branchial_cyst', +1).size[1] + bt.size[1]) / 2;
    add('C-level', 'a branchial cyst sits in the UPPER part of the remnant and a branchial sinus opens LOW — "the upper third of the neck" against "the lower anterior border of sternocleidomastoid". That difference is the discriminator a student is examined on, so it carries a magnitude floor rather than a sign.',
      { cyst_centroid_y: ec, sinus_external_opening_y: et, separation: ec - et,
        mean_extent: meanExtent, separation_over_mean_extent: (ec - et) / meanExtent },
      (ec - et) / meanExtent >= FLOORS.SEP, '>= 35% of the mean of the two extents',
      { case: 'the same predicate asserted the other way round', rejected: !((et - ec) / meanExtent >= FLOORS.SEP) });
  }

  /* ---- V · a live structure is far clear of its mounting vestige ---- */
  {
    const detail = VESTIGED.map(k => ({
      key: k, axis: VEST_AXIS[k] || 'largest',
      peak_seg: peakExtentSeg(k), floor_seg: floorExtentSeg(k), peak_day: peakDay(k),
      head: floorExtentSeg(k) > 0 ? peakExtentSeg(k) / floorExtentSeg(k) : Infinity,
    }));
    add('V-vestige', 'the structures floored at a mounting vestige are far clear of that floor when they are alive, so a beat can never be showing one by accident — the floor is a mounting requirement and never a drawn claim',
      { floor_constant: VESTIGE, detail },
      detail.every(d => d.head >= FLOORS.VESTIGE_HEAD), 'peak >= 4x floor for every one of them',
      { case: 'the same predicate fed a structure whose peak equals its floor, i.e. one that never grows',
        rejected: !(1 >= FLOORS.VESTIGE_HEAD) });
  }

  /* ---- Y · the symmetry the model HAS, asserted instead of a handedness it does not ---- */
  {
    const F = frameAt(tMid);
    const bad = [];
    for (const k of keysOf(gM)) {
      const l = sideBox(gM, k, +1), r = sideBox(gM, k, -1);
      if (!l || !r) { if (k !== 'median_plane' && k !== 'pharyngeal_wall') bad.push({ key: k, reason: 'one side only' }); continue; }
      const d = Math.abs(l.max[0] + r.min[0]) / (2 * l.max[0] || 1);
      if (d > FLOORS.SYMM) bad.push({ key: k, asymmetry: d });
    }
    add('Y-symmetry', 'every paired structure is a mirror image about x = 0, which is what "four PAIRS of clefts" means — and the reason this model carries NO narration claim that names a side: with no chiral content it cannot witness its own handedness, and a test written in the same coordinates as the declaration would be circular',
      { keys_checked: keysOf(gM).length, asymmetric: bad, floor: FLOORS.SYMM },
      bad.length === 0, 'every key symmetric to 0.2% of its own reach',
      { case: 'the same predicate fed an asymmetry of 0.5', rejected: !(0.5 <= FLOORS.SYMM) });
  }

  /* ---- T · no dome-pole fan is silently dropped ----
     render-kit's triN degeneracy guard is absolute rather than relative to the triangle's own edges,
     so at a small enough build scale it deletes both poles of a dome and leaves two holes that pass
     winding, normals and the ray cast. A key's triangle count being IDENTICAL at every sampled day
     is the signature that breaks. */
  {
    const days = [22, 30, 38, 46, 56];
    const counts = {};
    let bad = [];
    for (const k of keysOf(gL)) {
      const seen = days.map(d => triCount(groupAt(tOfDay(d)), k));
      counts[k] = seen;
      if (new Set(seen).size !== 1) bad.push({ key: k, counts: seen });
    }
    add('T-poles', 'every key\'s triangle count is identical at every sampled day, which is what a silently dropped dome-pole fan breaks — the build unit is 30 units to the millimetre precisely to keep every solid clear of render-kit\'s absolute degeneracy guard',
      { geom_units_per_mm: GEOM, days, counts, varying: bad },
      bad.length === 0, 'no key varies',
      { case: 'the same predicate fed a key whose count changes between days', rejected: !(new Set([10, 12]).size === 1) });
  }

  /* ---- Z · no two solids share space, over a PUBLISHED partition ---- */
  {
    const keys = keysOf(gL);
    const ex = new Set(Z_EXCLUDE.map(e => [e[0], e[1]].sort().join('|')));
    const overlaps = [], declared = [];
    const boxes = {};
    for (const k of keys) boxes[k] = bboxOf(gL, k);
    for (let i = 0; i < keys.length; i++) for (let j = i + 1; j < keys.length; j++) {
      const a = keys[i], b = keys[j];
      const ba = boxes[a], bb = boxes[b];
      let meet = true;
      for (let d = 0; d < 3; d++) if (ba.min[d] > bb.max[d] || bb.min[d] > ba.max[d]) meet = false;
      if (!meet) continue;
      const pair = [a, b].sort().join('|');
      const fa = insideFrac(gL, a, b, 60), fb = insideFrac(gL, b, a, 60);
      const worst = Math.max(fa, fb);
      if (ex.has(pair)) { if (worst > FLOORS.SHARE) declared.push({ pair, inside: worst }); continue; }
      if (worst > FLOORS.SHARE) overlaps.push({ pair, a_in_b: fa, b_in_a: fb });
    }
    add('Z-space', 'no two solids this model builds share space, over every pair whose bounding boxes meet, with construction and anatomical contact excluded BY NAME in a published partition rather than by a tolerance',
      { keys: keys.length, excluded_pairs: Z_EXCLUDE.length,
        unexcluded_overlaps: overlaps,
        declared_pairs_over_the_ceiling: declared, ceiling: FLOORS.SHARE },
      overlaps.length === 0, 'no unexcluded pair over 2% containment',
      { case: 'the same predicate fed a containment of 0.5 on a pair that is not in the partition',
        rejected: !(0.5 <= FLOORS.SHARE) });
  }

  clearCache();
  /* { pass, rows } AND NOT A BARE ARRAY, because that is the contract the harnesses in this corpus
     already read — tools/render-pharyngeal-pouches.mjs gates on `report.acceptance.pass` and
     iterates `report.acceptance.rows`. A model that returns the array instead fails the harness with
     "rows is not iterable" AFTER every frame has been rendered, which looks like a render fault and
     is not one. `pass` requires every row to pass AND every negative case to be rejected: a row that
     passes while its negative case does not is a test that cannot fail, which RENDER-STANDARD says
     is not evidence. */
  const pass = rows.every(r => r.pass && (!r.negative || r.negative.rejected));
  return { pass, rows };
}

/* ══════════════════════════════════════════════════════════════════ per-beat claims

   RENDER-STANDARD: "Every view of a time-varying scene carries its narrated claims as
   machine-checkable claims[], evaluated against the model at THAT VIEW'S OWN SET_STAGE t." And 3.y:
   a beat that narrates a SHAPE asserts it AS PROJECTED on the screen plane of the camera that beat
   rotates to, not in the model's own frame.

   VIEW_DIR IS COPIED FROM viz3d.js (:2095), NOT RESTATED, so the player's cameras and any probe's
   cannot drift apart. The harness asserts the two tables agree. */
const VIEW_DIR = {
  anterior: [0, 0, 1], posterior: [0, 0, -1], lateral: [1, 0, 0], medial: [-1, 0, 0],
  superior: [0, 1, 0.001], inferior: [0, -1, 0.001],
};
function screenAxes(view) {
  const d = new T.Vector3().fromArray(VIEW_DIR[view]).normalize();
  let up = Math.abs(d.y) > 0.99 ? new T.Vector3(0, 0, -1) : new T.Vector3(0, 1, 0);
  const right = new T.Vector3().crossVectors(up, d).normalize();
  up = new T.Vector3().crossVectors(d, right).normalize();
  return { dir: d, up, right };
}
function screenExtentAlong(g, key, a) {
  const V = vertsOf(g, key);
  let lo = Infinity, hi = -Infinity;
  for (let i = 0; i < V.length; i += 3) {
    const p = V[i] * a.x + V[i + 1] * a.y + V[i + 2] * a.z;
    if (p < lo) lo = p; if (p > hi) hi = p;
  }
  return hi - lo;
}
function screenSepOverExtent(g, ka, kb, view, signedUp) {
  const ax = screenAxes(view);
  const A = centroidOf(g, ka, +1), B = centroidOf(g, kb, +1);
  if (!A || !B) return NaN;
  const proj = (p, a) => p.x * a.x + p.y * a.y + p.z * a.z;
  const dUp = proj(A, ax.up) - proj(B, ax.up);
  const dRt = proj(A, ax.right) - proj(B, ax.right);
  const useUp = signedUp || Math.abs(dUp) >= Math.abs(dRt);
  const axis = useUp ? ax.up : ax.right;
  const sep = useUp ? dUp : dRt;
  const ea = screenExtentAlong(g, ka, axis), eb = screenExtentAlong(g, kb, axis);
  const mean = (ea + eb) / 2;
  return mean > 0 ? sep / mean : NaN;
}

function claimMeasure(name, t) {
  const path = String(name).split('.');
  const g = groupAt(t);
  const F = frameAt(t);
  switch (path[0]) {
    case 'day': return dayOf(t);
    /* THE MECHANISM, AT THIS BEAT'S OWN t. A beat that says a cleft is buried, or that one is not,
       is making exactly this measurement and it should be held to it. */
    case 'coveredFrac': return coveredFrac(t, path[1], 60);
    case 'buryDay': { const r = solveBuryDay(path[1]); return r.bracketed ? r.day : NaN; }
    case 'buryBracketed': { const r = solveBuryDay(path[1]); return r.bracketed ? 1 : 0; }
    case 'fusionDay': { const r = solveFusionDay(null); return r.bracketed ? r.day : NaN; }
    /* how far caudal the flap's free margin has reached, in intersegments from the cranial end of the
       span — the one number the overgrowth beat is about, read off the frame the geometry uses */
    case 'opReachSeg': return (F.yTop - F.yEdge) / F.seg;
    /* a key's own extent at its own t, in intersegments: how a beat claims that something is present
       and substantial rather than sitting at its mounting vestige */
    case 'relSize': return ownExtentSeg(t, path[1]);
    case 'fracOfPeak': return ownExtentSeg(t, path[1]) / peakExtentSeg(path[1]);
    case 'fracOfFloor': return ownExtentSeg(t, path[1]) / floorExtentSeg(path[1]);
    /* how many of the four grooves are still substantial — the beat that says "the lower three have
       gone and one remains" is a COUNT, so it is measured as one */
    case 'cleftsAlive': {
      let n = 0;
      for (let k = 1; k <= 4; k++) if (ownExtentSeg(t, 'cleft' + k) / peakExtentSeg('cleft' + k) >= 0.45) n++;
      return n;
    }
    /* THE THREE LAYERS, AS A COUNT AND AS A SEPARATION. The scene's gaps[] requires that a student
       can count three fills in one structure, so the beat that teaches it claims the count. */
    case 'laminaCount': {
      let n = 0;
      for (const L of TM_LAMINAE) if (vertsOf(g, L.key).length > 0) n++;
      return n;
    }
    case 'laminaMinSepOverSpread': {
      const o = laminaOrder(t);
      if (!o) return NaN;
      const a = o.offsets.map(r => r.along);
      return Math.min(a[1] - a[0], a[2] - a[1]) / (o.spread || 1);
    }
    case 'laminaOrdered': {
      const o = laminaOrder(t);
      if (!o) return 0;
      const a = o.offsets.map(r => r.along);
      return (a[0] < a[1] && a[1] < a[2]) ? 1 : 0;
    }
    /* contact and separation, in intersegments — "belongs to both" and "approach and stop" */
    case 'gapSeg': return minGapSeg(g, path[1], path[2], t, 140);
    case 'insideFrac': return insideFrac(g, path[1], path[2], 60);
    /* the fistula's course between the carotids, as the smaller of the two clearances */
    case 'fistulaBetween': {
      const ci = centroidOf(g, 'carotid_internal', +1), ce = centroidOf(g, 'carotid_external', +1);
      if (!ci || !ce) return NaN;
      const yCross = (ci.y + ce.y) / 2, slab = 0.45 * F.seg;
      const V = vertsOf(g, 'branchial_fistula');
      let sz = 0, n = 0;
      for (let i = 0; i < V.length; i += 3) {
        if (V[i] <= 0 || Math.abs(V[i + 1] - yCross) > slab) continue;
        sz += V[i + 2]; n++;
      }
      if (!n) return NaN;
      const zT = sz / n, spread = Math.abs(ce.z - ci.z);
      return Math.min((zT - ci.z) / spread, (ce.z - zT) / spread);
    }
    /* 3.y: measures AS PROJECTED on the screen plane of the camera the beat rotates to */
    case 'screenHeightOverSeg': return screenExtentAlong(g, path[1], screenAxes(path[2]).up) / F.seg;
    case 'screenWidthOverSeg':  return screenExtentAlong(g, path[1], screenAxes(path[2]).right) / F.seg;
    case 'screenSepOverExtent': return screenSepOverExtent(g, path[1], path[2], path[3], true);
  }
  throw new Error('unknown measure: ' + name);
}

/* ══════════════════════════════════════════════════════════════════ the provider contract */
window.MB3D_MODELS = window.MB3D_MODELS || {};
window.MB3D_MODELS['pharyngeal-clefts-membranes'] = {
  LAYERS: LAYERS,
  build: buildClefts,
  /* No optional layers: every key is built every time, so the adapter slicing the group by key
     cannot come back reason:'none' for anything the scene names. FULL being empty is correct here
     rather than an omission — there is nothing behind a flag to miss. */
  FULL: {},
  VARIANTS: {},
  ACCEPTANCE: { FLOORS, TM_LAMINAE, CRL_ANCHORS, Z_EXCLUDE,
                OP_HINGE: OP_HINGE_DEFAULT, OP, OP_TO, RIDGE_AT, F_CLEFT },
  FLOORS: FLOORS,
  SOLVED: {
    CRL_FIT: CRL_FIT,
    buryDays: () => ({ cleft1: solveBuryDay('cleft1'), cleft2: solveBuryDay('cleft2'),
                       cleft3: solveBuryDay('cleft3'), cleft4: solveBuryDay('cleft4') }),
    fusion: () => solveFusionDay(null),
  },
  acceptance: acceptance,
  claimMeasure: claimMeasure,
  /* exposed so a harness, a review or the console can re-measure without reading the source — and
     so the cross-model agreement check (row W, in the harness) can ask BOTH models the same
     question in the same units */
  frameAt: frameAt,
  cleftPoint: cleftPoint,
  dayOf: dayOf,
  tOfDay: tOfDay,
  coveredFrac: coveredFrac,
  meatusAxis: meatusAxis,
  VIEW_DIR: VIEW_DIR,
};

})();
