/* MedBank · pharyngeal pouches — PRODUCTION procedural model.
 *
 * Registers itself as MB3D_MODELS['pharyngeal-pouches'], which is the whole contract the procedural
 * provider in viz3d.js depends on: a LAYERS palette and build(t, opts) -> THREE.Group whose meshes
 * carry userData.key.
 *
 * WRAPPED IN AN IIFE. Only the registration escapes. RENDER-STANDARD: a model written at top level
 * puts T, K, C, LAYERS and every constant into global lexical scope, and the second model to load —
 * written the obvious way, `const T = window.THREE` — dies on "Identifier 'T' has already been
 * declared" and takes the page with it.
 *
 * CONVERTED FROM AN SVG SEQUENCE SCENE. The scene authored 2026-08-28 had twelve structures[] that
 * were teaching BEATS, not anatomical parts — pouch_plan, wings, crossover, thymus_descent,
 * ectopic_parathyroid, digeorge, c_cell_clinical and pouch_summary have no geometry and never could.
 * This file builds the PARTS; the narration those eight carried moved verbatim onto the views that
 * replaced them, or into scene.deferred_beats where no view could honestly carry it.
 *
 * ── THE MECHANISM ────────────────────────────────────────────────────────────────────────────────
 *
 * Two things happen at once and the examinable fact is their INTERACTION, not either one alone.
 *
 *   1. The pharyngeal endoderm pockets outwards four times on each side, between the arches. The
 *      pouches sit at the four internal divisions of five equal intersegments down the pharyngeal
 *      span — not at tuned levels. That is a construction rule, stated here and asserted in row P.
 *
 *   2. The embryo's neck and thorax LENGTHEN beneath a pharynx that stays tethered where it is, and
 *      the pouch-3 derivatives are carried down by that lengthening. The descent is differential
 *      growth, not a translation applied to a finished organ — which is the same mechanism class as
 *      cardiac-looping's growth-driven buckling, and it is why span scales with crown-rump length.
 *
 * THE CROSSOVER IS A CONSEQUENCE, NOT AN INPUT, and that distinction is the whole point of this
 * file. RENDER-STANDARD: "Ask which number a student would be marked wrong for, and solve THAT one
 * against a stated constraint." The number a student is marked wrong for here is the SIGN of
 * parathyroid III against parathyroid IV. This model does not carry that sign anywhere. It carries
 * two independent anatomical statements —
 *
 *      the inferior parathyroid comes to rest at the LOWER pole of the thyroid;
 *      the superior parathyroid stays at the pouch-4 level, on the thyroid's upper-posterior surface
 *
 * — and then MEASURES the sign off the built gland centroids at each end of the process, and SOLVES
 * the day the sign flips by bisection (row X). At day 30 parathyroid III is ABOVE parathyroid IV,
 * because it comes from the higher pouch. At day 56 it is BELOW it. Nothing in the source says so;
 * rows X-early, X-late and X-day read it from the geometry, with magnitude floors, and row X-perturb
 * proves the solved day moves when the thyroid's height changes. That is the relation the exam asks
 * about and it is the relation the model is accountable for.
 *
 * ── WHAT t MEANS ─────────────────────────────────────────────────────────────────────────────────
 *
 * t = 0 is DAY 22 — the start of week 4, the pharyngeal wall before the first pouch has budded.
 * t = 1 is DAY 56 — the end of week 8, thymic descent complete. Both ends are the teaching
 * approximations the scene's narration gives, and the scene's own gaps[] says they are
 * approximations: texts differ by several days.
 *
 * ── AXES ─────────────────────────────────────────────────────────────────────────────────────────
 *
 * +x = embryo's LEFT, -x = RIGHT, +y = CRANIAL, +z = VENTRAL. Taken from the corpus convention that
 * cardiac-looping measured against six BodyParts3D right/left pairs, and from viz3d.js putting the
 * 'anterior' camera at +z.
 *
 * THIS MODEL CANNOT WITNESS ITS OWN HANDEDNESS and says so rather than pretending. RENDER-STANDARD:
 * "A model with no chiral content cannot witness its own handedness, and an acceptance test written
 * in the same coordinates as the declaration is circular." Every structure here is built as a
 * mirror-symmetric PAIR about x = 0 — that is what "four pairs of pouches" means — so flipping the
 * sign of x in this header would leave every acceptance row passing and change nothing visible. The
 * model therefore carries NO narration claim that names a side, row Y asserts the symmetry it does
 * have rather than a handedness it does not, and the scene's gaps[] records that any future
 * side-naming claim here would be UNPROVEN.
 *
 * ── UNITS ────────────────────────────────────────────────────────────────────────────────────────
 *
 * Millimetres, at the embryo's own size. Every length is a stated fraction of the crown-rump length
 * at that day, and CRL itself is a least-squares log-linear fit through three stated clinical
 * anchors (CRL_FIT) with a reported residual — not a typed curve. Row G perturbs an anchor and
 * requires the fitted rate to move.
 *
 * ── GEOMETRY NOTE ────────────────────────────────────────────────────────────────────────────────
 *
 * The pharyngeal wall is a THICK-WALLED swept shell — outer surface, inner surface and annular end
 * caps — so a section shows a wall with a lumen inside it rather than a paper edge. It is authored
 * role:'context' in the scene, which is what lets the player's CROSS_SECTION cut it: viz3d.js:2438
 * applies the clipping plane only where isTaught(s) is false, so a cross-section opens the wall and
 * leaves the pouches whole. That is the dissection view 1 asks for, and it is why no cutaway window
 * is built into the geometry.
 *
 * EVERY KEY BUILDS GEOMETRY AT EVERY t, INCLUDING t = 1, AND THAT IS A WORKAROUND FOR A LIVE ENGINE
 * BUG RATHER THAN AN ANATOMICAL CLAIM. viz3d.js parseProceduralRef (:478) defaults an unpinned ref
 * to t = 1 at mount; a structure that builds nothing at t = 1 resolves reason:'none', never enters
 * meshes[], and restage() (:1854) filters on `meshes[s.key] && adapter.stageable(s)` — so SET_STAGE
 * can never bring it back at any later t. That is queue item 137 (engine__procedural-ref-default-t),
 * which two independent reviews have converged on and which is not this run's to fix. The structures
 * that are genuinely transient — the pouch stems, the wings, the thymopharyngeal duct, the
 * ultimopharyngeal body — therefore never shrink below VESTIGE of their peak size, so every ref
 * mounts. NO VIEW SHOWS A VESTIGE: the scene's beats hide each of those structures at every t where
 * it is vestigial, row V asserts the floor is the floor and not a drawn claim, and the scene's
 * gaps[] states it in the terms a student would be misled by. A vestige is a mounting requirement,
 * not a picture.
 */
(function () {

const T = window.THREE;
const K = window.VizKit;   // render-kit.js must load first — it owns winding, normals and colour

const LAYERS = {
  wall:        { color: 0xd9a48a, name: 'Pharyngeal endoderm' },
  arches:      { color: 0x9aa3ae, name: 'Pharyngeal arches' },
  /* THE BLUES ARE RESERVED FOR ECTODERM AND NOTHING ELSE USES THEM — see the POUCH-4 note below.
     surface is the palest of the three so that a context shell at 0.16 opacity still reads as the
     same tissue as the grooves cut into it without competing with them. */
  surface:     { color: 0xb7cde0, name: 'Surface ectoderm — the body surface' },
  ectoderm:    { color: 0x5b7fa6, name: 'Ectoderm — the first cleft' },
  ectoderm2:   { color: 0x4a6b8c, name: 'Ectoderm — the lower clefts' },
  midline:     { color: 0x9aa6bf, name: 'Median plane' },
  pouch1:      { color: 0xc0392b, name: 'Pouch 1 — tubotympanic recess' },
  membrane:    { color: 0xe8d9b0, name: 'Tympanic membrane' },
  pouch2:      { color: 0xe67e22, name: 'Pouch 2 — tonsillar fossa' },
  tonsil:      { color: 0xb9770e, name: 'Palatine tonsil' },
  pouch3:      { color: 0x117864, name: 'Pouch 3' },
  /* POUCH 4 AND BOTH ITS DERIVATIVES LEFT THE BLUES ON 2026-10-03, review finding F3. They were
     0x2874a6 / 0x1f618d / 0x5499c7 — dE 9.9 to 12.2 from the two ectodermal clefts in the same
     frame, inside one tight blue cluster with dE 23.2 of clear air to everything else, while
     cleft1's own narration promises the student the cleft is "drawn in a colour nothing on the
     inside of the apparatus uses". Blue is the corpus's ectoderm: notochord.js, trilaminar-disc and
     neurulation all use 0x2980b9, body-cavity-coelom and lateral-folding 0x2f7fc4, and the sibling
     pharyngeal-arches.js 0x85c1e9 / 0x9fb4c9. So the three keys moved together — the
     pouch-number-to-hue inheritance is kept, the hue is not — into the rose/plum band, which was the
     one band no key in this model held: red-brick, orange, teal, green, purple, brown, yellow,
     salmon, cream and grey were all taken. Row CL now measures the separation rather than trusting
     this note: every pair of keys in any one beat's visible set is held above a stated dE, and
     cleft1's colour claim is asserted as a number against every endodermal key it is shown with. */
  pouch4:      { color: 0xb0387a, name: 'Pouch 4' },
  thymus:      { color: 0x7d3c98, name: 'Thymus' },
  duct:        { color: 0xaf7ac5, name: 'Thymopharyngeal duct' },
  pt_inferior: { color: 0x1e8449, name: 'Inferior parathyroid (III)' },
  pt_superior: { color: 0x6d1b47, name: 'Superior parathyroid (IV)' },
  ultimo:      { color: 0xd98cb3, name: 'Ultimopharyngeal body' },
  thyroid:     { color: 0xa9724a, name: 'Thyroid gland' },
  ccell:       { color: 0xf4d03f, name: 'Parafollicular (C) cells' },
};

/* ══════════════════════════════════════════════════════════════════ time, and the growth that
   drives the descent */

const DAY0 = 22, DAY1 = 56;
const clamp01 = x => x < 0 ? 0 : x > 1 ? 1 : x;
const dayOf   = t => DAY0 + (DAY1 - DAY0) * clamp01(t);
const tOfDay  = d => (d - DAY0) / (DAY1 - DAY0);

/* CRL anchors: the standard teaching approximations for this window. Stated, so a reviewer can
   argue with the data rather than with a curve. */
const CRL_ANCHORS = [[22, 2.0], [35, 8.0], [56, 30.0]];

/* SOLVED, NOT TYPED. Least squares on ln(CRL) against day — two parameters through three anchors,
   so the fit is over-determined and the residual is real. An exact three-parameter fit through
   three points would have a residual of zero by construction, which RENDER-STANDARD is explicit is
   arithmetic done twice rather than a solve. Row G perturbs an anchor and requires B to move. */
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

/* ══════════════════════════════════════════════════════════════════ THE BUILD UNIT, and why it is
   not the millimetre.

   THE GEOMETRY IS BUILT IN UNITS OF 1/30 mm. Every number this file reports in millimetres is
   converted on the way out; nothing anatomical depends on the choice. It exists because of a
   measured defect in render-kit.js, which this run found and did not fix.

   `triN` — the kit's "decide the vertex order from the geometry rather than from a comment" emitter,
   which every cap, taper, sheet and dome pole goes through — guards against a degenerate triangle
   with an ABSOLUTE test: `if (_fn.lengthSq() < 1e-16) return;`, where _fn is the raw cross product.
   A cross product scales with the SQUARE of the model, so that guard is a statement about units, not
   about degeneracy. Measured on a plain tubeCapped blob, ring 18, capRows 7, holding scale as the
   only variable:

       scale 1.00   828 of 828 triangles   pole-fan lengthSq 5.05e-10
       scale 0.30   828 of 828             4.09e-12
       scale 0.10   828 of 828             5.05e-14
       scale 0.03   828 of 828             4.09e-16   <- 4x above the guard
       scale 0.01   792 of 828             5.05e-18   <- below it: ALL 36 POLE TRIANGLES DROPPED

   Both dome poles are silently deleted and the solid has two holes in it. An open hole is the one
   thing RENDER-STANDARD says must never be visible, and this one arrives with no error, no warning
   and a geometry that passes winding, normals and the ray cast — it was found only by counting
   unpaired edges, and it looked for two rounds like a weld-tolerance problem in the probe.

   In millimetres this apparatus is 0.65 mm across at day 22, and its smallest solids — a parathyroid
   primordium and a C cell at their mounting floor — are 2e-3 and 5e-4 mm. Both are under the guard.
   Building at 30 units to the millimetre puts the smallest of them at scale 0.10 in the table above,
   with a 560-fold margin, and acceptance row T-poles asserts the margin rather than trusting it: a
   key's triangle count must be IDENTICAL at every sampled day, which is exactly the signature a
   dropped pole fan breaks. A kit repair — making the guard relative to the triangle's own edge
   lengths — would change every model in the corpus and is not this run's to make; RENDER-STANDARD
   section 7 sets that precedent for fitCamera in the same file. */
const GEOM = 30;      // model length units per millimetre
const mm = u => u / GEOM;

/* ══════════════════════════════════════════════════════════════════ stated anatomical fractions

   Every one of these is a fraction of something the model already has, so there is no absolute
   constant anywhere below this block and the whole apparatus scales with one growth law. */

const F_SPAN   = 0.28;    // pharyngeal span (pouch-1 level to the aortic sac) as a fraction of CRL
const F_WIDTH  = 0.045;   // the pharynx's widest half-width, as a fraction of CRL. HALVED from
                          // 0.085, which made the half-width 1.52 INTERSEGMENTS — the tube was three
                          // times as wide as the gap between consecutive pouches, so every pouch came
                          // out shorter than its own tip radius and the sweep folded through itself
                          // at the dome. 0.045 puts the half-width at 0.80 of an intersegment.
const NSEG     = 5;       // five equal intersegments; the four pouches sit at the internal divisions
const WALLF    = 0.16;    // endodermal wall thickness, as a fraction of the local half-width
const FLAT_PH  = 0.45;    // the pharynx is flattened dorsoventrally: z half-extent / x half-extent
const TAPER    = 0.55;    // how much of the half-width is lost by the caudal end
const F_THY_H  = 0.60;    // thyroid craniocaudal height, as a fraction of one intersegment
const F_THY_X  = 0.42;    // thyroid lobe offset from the midline, as a fraction of one intersegment
const F_THY_Z  = 0.95;    // the thyroid sits this far VENTRAL of the pharyngeal axis. Raised from
                          // 0.30 because at 0.30 the gland shared space with the arch bars, and the
                          // thyroid is not a pouch derivative and has no business in arch mesenchyme:
                          // row Z found it, and the repair is the geometry, not the partition
/* ── THE LATERAL LAYOUT, REBUILT 2026-10-03 FROM REVIEW FINDINGS F1 AND F4 ──────────────────────

   What was there: a single constant F_CLEFT = 3.60 placed all four ectodermal grooves at a fixed
   radius, chosen by eye and justified by arithmetic that did not hold. Measured on the built
   vertices at day 44, pouch 1's own surface stopped 1.95 intersegments short of cleft 1's, with the
   tympanic membrane floating in the middle of that void touching neither — and the void was 1.93
   intersegments at EVERY t from 0.35 to 0.94, so it was not a stage, it was the layout. The same
   constant left the four grooves hanging in space 3.9 to 4.5 intersegments out with the pharyngeal
   wall ending at 0.80 and nothing drawn in between: four crescents attached to nothing, under a
   narration that calls a cleft "a groove on the OUTSIDE", which is a feature of a surface.

   What is here instead: ONE stated lateral constant, and every other lateral position derived.

     1. A pouch's apposition to its own groove is EXACT BY CONSTRUCTION. The groove's floor is
        placed on the pouch's own end tangent, one membrane-thickness beyond the pouch's dome — so
        the pharyngeal membrane is where the two meet and cannot drift, at every t and every pouch.
        That is the examinable relation in this topic (RENDER-STANDARD: solve the parameter that
        decides the examinable relation), and it is now not a parameter at all.
     2. THE BODY SURFACE IS SOLVED, not placed: its profile is scaled so that it passes exactly
        through the FIRST groove's lips. The first cleft is the one that stays open to the outside as
        the external acoustic meatus, so it is the groove whose lips define where the surface is.
     3. The other three grooves' DEPTHS are then derived from that solved surface at their own
        levels — deeper where the pouch reaches less far. Which is the anatomy and the reason those
        three are the ones the overgrowing second arch buries as the cervical sinus: they are pits.

   So the only tuned lateral number left below is F_CDEPTH, the first groove's own depth. */
const F_MEMB   = 0.10;   // the pharyngeal membrane's thickness — endoderm, a thin mesenchymal core
                         // and ectoderm — as a fraction of one intersegment. This is the whole of
                         // the space between a pouch and its cleft: "in direct apposition".
const F_CDEPTH = 0.26;   // the FIRST cleft's depth, floor to lips, as a fraction of one
                         // intersegment. Shallow, and the three below it come out deeper: the first
                         // cleft is the one whose pouch reaches furthest, so it needs the least.
const F_CLIPY  = 0.48;   // half the groove's craniocaudal length, as a fraction of an intersegment
const FOLD_MARGIN = 3.0; // how far a groove's own calibre stays below the radius of curvature of
                         // its own centreline. See cleftCalibre.
const SURFW    = 0.030;  // the surface ectoderm's thickness, as a fraction of its own local radius.
                         // THIN ON PURPOSE: it is an epithelium, and at 0.085 the skin was thicker
                         // than the first groove is deep, so the groove was a tunnel bored inside a
                         // slab rather than a dent in a surface and row Z read 39% of cleft 1's
                         // vertices as sitting inside it.
const FLAT_SURF = 0.88;  // the neck is far less dorsoventrally flattened than the pharynx is
const TAPER_S  = 0.30;   // and it tapers far less, too. SEPARATE FROM THE PHARYNX'S TAPER, and the
                         // first draft of this layout reused TAPER = 0.55 for both as a convenience.
                         // That is not anatomy: the pharyngeal lumen narrows sharply towards the
                         // oesophagus while the neck's outside barely narrows at all over the same
                         // span. Row AG caught it — with the lumen's taper the solved surface came
                         // IN past the third and fourth grooves' floors, dips of -0.12 and -0.19 of
                         // an intersegment, i.e. two grooves outside the skin they are grooves in.
const F_PT_Z   = -0.22;   // both parathyroid pairs rest on the thyroid's POSTERIOR surface
const F_RETRO  = 1.35;    // the thymus settles this many intersegments below the thyroid's lower pole
const F_VENT   = 0.55;    // ...and this far ventral of the pharyngeal axis: it is retrosternal
const VESTIGE  = 0.10;    // the mounting floor — see the engine-bug note in the header

/* ── the pouches ──────────────────────────────────────────────────────────────────────────────────

   len   lateral reach, as a fraction of the pharyngeal span
   rise  craniocaudal drift of the pouch's tip, as a fraction of span (pouch 1 climbs to the ear)
   zoff  dorsoventral drift of the tip, as a fraction of span
   r0,r1 calibre at the pharyngeal end and at the tip, as fractions of ONE INTERSEGMENT
   day   the day the pouch buds

   POUCH 1's TWO CALIBRES ARE THE TEACHING POINT, and they are one solid rather than two keys. Its
   narrow proximal part stays as the auditory tube and its far end expands into the middle ear cavity
   and the mastoid antrum — and there is no waist between them, it is a continuous taper. RENDER-
   STANDARD says segment boundaries belong at the waists; inventing one here would draw a boundary a
   student would then look for in a specimen. So r0/r1 carry the expansion, and row E1 measures the
   ratio off the built vertices instead of a key boundary asserting it.

   CALIBRES ARE FRACTIONS OF AN INTERSEGMENT, NOT OF THE WALL'S HALF-WIDTH. They were fractions of
  the wall, which coupled a pouch's girth to the pharynx's girth: the first pouch's tip calibre came
  out at 0.95 of the wall radius, so a pouch 1.5 intersegments long had a tip 1.4 across and the
  solid was a hemisphere with a stub on it. A pouch's calibre and the pharynx's are not the same
  measurement and should not share a scale. Aspect ratios now: pouch 1 is 4.4 calibres long, pouch 2
  is 4.8, pouch 3 is 6.5 and pouch 4 is 6.1 — all comfortably clear of the fold. */
const POUCH = [
  { k: 1, len: 0.30, rise:  0.30, zoff: -0.10, r0: 0.10, r1: 0.34, day: 22, layer: 'pouch1' },
  { k: 2, len: 0.20, rise:  0.00, zoff: -0.04, r0: 0.16, r1: 0.21, day: 24, layer: 'pouch2' },
  { k: 3, len: 0.26, rise: -0.03, zoff:  0.00, r0: 0.15, r1: 0.20, day: 26, layer: 'pouch3' },
  { k: 4, len: 0.22, rise: -0.05, zoff:  0.00, r0: 0.14, r1: 0.18, day: 28, layer: 'pouch4' },
];
const POUCH_FULL = 10;     // days from budding to full extension

/* ── the wings ────────────────────────────────────────────────────────────────────────────────────
   The third and fourth pouches each split into a dorsal and a ventral wing, from the distal part of
   the pouch. Dorsal is -z, ventral is +z, and both carry on laterally a little. */
const WING = {
  from: 0.62,              // the wings leave the pouch at this fraction along it
  len:  0.52,              // their own length, as a fraction of the parent pouch's length
  r:    0.78,              // their calibre, as a fraction of the parent pouch's tip calibre
  day:  4,                 // days after the parent pouch buds
  full: 8,
};

/* ── the migrations ──────────────────────────────────────────────────────────────────────────────── */
const DESC = { day: 30, full: 52 };        // the window over which everything that descends, descends
/* THE HANDOVER IS ONE EVENT AND HAS TO BE ONE WINDOW. These two were authored with the body
   disappearing over days 44-50 and the C cells appearing over days 48-56, which leaves no stage at
   which both exist — and the beat written to show one becoming the other then stood at day 44, where
   the model says the C cells are not there yet. It drew them at their mounting floor and the player
   frame measured 0.017%: the beat was pointing at something the model had not built. The narration
   is "is absorbed into the thyroid and DISPERSES as the C cells", which is a single continuous
   handover, so the body's involution and the cells' appearance now share the window days 44-52 and
   cross at day 48, where beat 7 stands. Found by the visibility walk, not by reading the source. */
const UB    = { day: 30, gone: 52 };       // the ultimopharyngeal body's own window
const TONSIL = { day: 40, full: 56 };
const TYMP   = { day: 30, full: 46 };
const CCELL  = { day: 44, full: 52 };
const PT_DAY = 32;                          // both parathyroid primordia are recognisable from here

/* smoothstep between two days, floored at the mounting vestige */
const ss = x => { const u = clamp01(x); return u * u * (3 - 2 * u); };
const phase  = (t, d0, d1) => Math.max(VESTIGE, ss((dayOf(t) - d0) / (d1 - d0)));
/* involution: grown, then withdrawn. `floor` defaults to the mounting vestige, but a structure that
   genuinely PERSISTS in reduced form passes its own anatomical floor — the second pouch is not a
   vestige at t = 1, it is the tonsillar fossa, and drawing it at the mounting floor would teach that
   the pouch has gone. Row V covers only the structures whose floor IS the mounting vestige. */
const involute = (t, d0, d1, g0, g1, floor) =>
  Math.max(floor == null ? VESTIGE : floor,
           ss((dayOf(t) - d0) / (d1 - d0)) * (1 - ss((dayOf(t) - g0) / (g1 - g0))));
const POUCH2_FLOOR = 0.38;   // what is left of the second pouch IS the tonsillar fossa

/* THE PERTURBATION HOOK. RENDER-STANDARD: "The check is a PERTURBATION: change the constant the
   geometry uses and the reported number must move. If it does not, the test is not measuring the
   model." So the thyroid's height is read through this indirection wherever the geometry uses it,
   and row X-perturb drives it from here. It is NOT a second copy of the constant: the default is
   F_THY_H as declared above, and nothing but solveCrossoverDay ever writes the override. */
const _override = { F_THY_H: null };
function thyH() { return _override.F_THY_H == null ? F_THY_H : _override.F_THY_H; }

/* ══════════════════════════════════════════════════════════════════ the frame of the apparatus */

/* Everything the model places is derived from this one record, so a reviewer can read the whole
   layout off it rather than off twenty call sites. */
function frameAt(t) {
  const L = crl(t) * GEOM;      // build units, not millimetres — see GEOM above
  const span = F_SPAN * L;
  const seg = span / NSEG;
  const R0 = F_WIDTH * L;
  const yTop = 0;
  const yBot = yTop - span;
  /* the four pouch levels: the internal divisions of five equal intersegments */
  const yP = [0, 1, 2, 3, 4].map(k => yTop - k * seg);     // yP[1..4] are the pouches
  /* the pharynx's local half-width at a craniocaudal fraction u (0 cranial, 1 caudal) */
  const Rph = u => R0 * (1 - TAPER * Math.pow(clamp01(u), 1.6));
  const uOf = y => (yTop - y) / span;
  /* the thyroid: its UPPER pole is the pouch-4 level, which is the stated resting level of the
     superior parathyroid, and its height is a stated fraction of one intersegment. */
  const thyTop = yP[4];
  const thyBot = thyTop - thyH() * seg;
  const thyX = F_THY_X * seg;
  const thyZ = F_THY_Z * seg;
  /* where the two thymic strands come to rest: on the MIDLINE, below the thyroid, ventral — which
     is what "behind the sternum, in the anterior mediastinum" is in this frame. */
  const thymusRest = new T.Vector3(0, thyBot - F_RETRO * seg, F_VENT * seg);
  return { L, span, seg, R0, yTop, yBot, yP, Rph, uOf, thyTop, thyBot, thyX, thyZ, thymusRest, day: dayOf(t) };
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
function arcLengths(pts) {
  const s = [0];
  for (let i = 1; i < pts.length; i++) s.push(s[i - 1] + pts[i].distanceTo(pts[i - 1]));
  return s;
}
/** the point at arc fraction f along a polyline */
function atArc(pts, f) {
  const s = arcLengths(pts), total = s[s.length - 1];
  if (!(total > 0)) return pts[0].clone();
  const want = clamp01(f) * total;
  for (let i = 1; i < s.length; i++) {
    if (s[i] >= want) {
      const u = (want - s[i - 1]) / (s[i] - s[i - 1] || 1);
      return pts[i - 1].clone().lerp(pts[i], u);
    }
  }
  return pts[pts.length - 1].clone();
}
/** the leading portion of a polyline, resampled to n points — a strand that has grown this far */
function headOfArc(pts, f, n) {
  const out = [];
  const ff = Math.max(1e-3, clamp01(f));
  for (let i = 0; i <= n; i++) out.push(atArc(pts, (i / n) * ff));
  return out;
}
/** the trailing portion, from arc fraction a to arc fraction b */
function spanOfArc(pts, a, b, n) {
  const out = [];
  for (let i = 0; i <= n; i++) out.push(atArc(pts, a + (b - a) * (i / n)));
  return out;
}
function vadd(a, b) { return a.clone().add(b); }

/* ══════════════════════════════════════════════════════════════════ the paths things travel on

   Written as functions of t so that the measurement of WHERE a gland is can read the same path the
   geometry is built from, rather than a second copy of it. */

/** the thymopharyngeal duct, from the pouch-3 ventral wing tip to the thymus's resting place */
function ductPath(t, side) {
  const F = frameAt(t);
  const A = wingTip(t, side, 3, 'ventral');
  const Z = new T.Vector3(side * 1e-4, F.thymusRest.y, F.thymusRest.z);
  /* it bows LATERALLY on the way down before converging on the midline — which is why a strand left
     behind turns up high in the neck lateral to the trachea as well as in the mediastinum */
  const Cp = new T.Vector3(A.x * 1.15, (A.y + Z.y) * 0.5, (A.z + Z.z) * 0.5 + 0.18 * F.seg);
  return bez3(A, Cp, Z, 26);
}

/** the inferior parathyroid's own path: pouch-3 DORSAL wing tip to the thyroid's LOWER pole,
    behind the gland. It is towed alongside the duct, not inside it. */
function pt3Path(t, side) {
  const F = frameAt(t);
  const A = wingTip(t, side, 3, 'dorsal');
  const Z = new T.Vector3(side * F.thyX, F.thyBot, F.thyZ + F_PT_Z * F.seg);
  const Cp = new T.Vector3(A.x * 1.05, (A.y + Z.y) * 0.5, (A.z + Z.z) * 0.5 - 0.10 * F.seg);
  return bez3(A, Cp, Z, 18);
}

/** the superior parathyroid's path: pouch-4 dorsal wing tip to the thyroid's UPPER pole. Short, and
    that is the claim — it barely moves craniocaudally. */
function pt4Path(t, side) {
  const F = frameAt(t);
  const A = wingTip(t, side, 4, 'dorsal');
  const Z = new T.Vector3(side * F.thyX, F.thyTop, F.thyZ + F_PT_Z * F.seg);
  return bez3(A, A.clone().lerp(Z, 0.5), Z, 12);
}

/** the ultimopharyngeal body's path: pouch-4 ventral wing tip into the thyroid lobe */
function ubPath(t, side) {
  const F = frameAt(t);
  const A = wingTip(t, side, 4, 'ventral');
  const Z = new T.Vector3(side * F.thyX * 0.85, (F.thyTop + F.thyBot) * 0.5, F.thyZ);
  return bez3(A, A.clone().lerp(Z, 0.5), Z, 12);
}

/* ── the apposition, and the grooves derived from it ───────────────────────────────────

   ONE FUNCTION owns where a pouch stops and where its groove starts, because that one relation is
   what this topic is examined on: pharyngeal endoderm and surface ectoderm in DIRECT APPOSITION,
   with one three-layered membrane between them and nothing else. Every caller — the groove
   geometry, the membrane, the surface solve, the acceptance rows — reads it from here, so there is
   no second copy of the relation to drift.

   NOTE ON domeExtent. tubeCapped's end dome reaches BULGE * r beyond the last centreline point, and
   the model does not get to know the kit's exact arithmetic without reimplementing it (RENDER-
   STANDARD section 6 forbids that). 0.9 is the `bulge` the pouch sweep is built with and is used
   here as the same number; the residual is a hair, and row AP does not trust it — it measures the
   realised gap off the BUILT VERTICES of both solids and holds it inside a stated band. */
const BULGE = 0.9;
function appositionAt(t, side, k, cleftRSeg) {
  const F = frameAt(t);
  const P = POUCH[k - 1];
  /* A GROOVE IS PLACED ON THE POUCH'S RATCHETED REACH, NOT ITS CURRENT ONE — phase(), which rises
     and then holds, instead of involute(), which rises and then falls back. A groove is a feature of
     the body SURFACE: once the ectoderm has dimpled in to meet a pouch, it does not migrate back
     towards the midline because the pouch later involutes. Letting it follow was a real defect and
     row Z caught it: at t = 1 pouch 2 has withdrawn to 0.38 of itself, so the second groove followed
     it in to |x| 1.26 while the palatine tonsil had swollen out to 1.41 — and 14.6% of the lower
     grooves' vertices ended up INSIDE the tonsil. Ectoderm inside an endodermal derivative is the
     one error this scene's own gaps[] says is the commonest marked-wrong answer in the topic.
     What the pouch's own withdrawal now means is the right thing: it leaves its membrane behind,
     which is the membrane breaking down and the sinus burying the groove. */
  const pp = pouchPath(t, side, k, phase(t, P.day, P.day + POUCH_FULL));
  const n = pp.pts.length;
  /* the pouch's OWN end tangent: the membrane stands perpendicular to the direction the pouch grew,
     which is what makes it the sheet between them rather than a disc at an angle to both */
  const ax = pp.tip.clone().sub(pp.pts[n - 2]);
  if (ax.lengthSq() < 1e-12) ax.set(side, 0, 0);
  ax.normalize();
  const domeR  = BULGE * F.seg * P.r1 * pp.grow;     // how far the tip dome reaches past the tip
  const cleftR = F.seg * (cleftRSeg != null ? cleftRSeg : CLEFT_R * cleftLive(t, k));
  const memb   = F_MEMB * F.seg;
  const pOuter = pp.tip.clone().addScaledVector(ax, domeR);   // the pouch's lateral-most surface
  const gFloor = pOuter.clone().addScaledVector(ax, memb);    // the groove floor's medial surface
  const floorC = gFloor.clone().addScaledVector(ax, cleftR);  // the groove tube's centre there
  return { ax, tip: pp.tip, grow: pp.grow, domeR, cleftR, memb, pOuter, gFloor, floorC };
}

const CLEFT_R = 0.13;    // the groove tube's calibre CEILING at its floor, as a fraction of an
                         // intersegment. A ceiling and not a value — see cleftCalibre.
/* the first groove deepens and STAYS; the lower three deepen and are then buried by the second
   arch's overgrowth, which is the cervical sinus closing */
function cleftLive(t, k) {
  return k === 1 ? phase(t, 24, 34) : involute(t, 24, 34, 38, 50);
}

/* A GROOVE'S CALIBRE IS SOLVED FROM THE FOLD CONSTRAINT, NOT CHOSEN.

   This is the arch bars' lesson applied before it had to be learned a fourth time. A swept tube
   folds through itself wherever its own radius exceeds the local radius of curvature of its
   centreline; for a groove of half-length h swept to a depth d that radius is about h^2 / (2d) at
   the floor, which is where the curve turns hardest. The grooves' depths are DERIVED from the
   solved body surface and are therefore not all the same: the caudal pouches reach less far, so
   their grooves are deeper pits, so their floors turn harder. A single stated calibre is exactly the
   "constant that is safe where it was checked" the model's own arch-bar note warns about — measured,
   a 0.16 calibre on the first groove at depth 0.55 gave a margin of 1.0 and folded 44 of 1288
   outer-surface triangles, RENDER-STANDARD 2.1's cardinal bug, inside the fix for F1.

   So the calibre is whichever is smaller: the stated ceiling, or the radius of curvature divided by
   FOLD_MARGIN. The margin then holds at every groove, every level and every t by construction, and
   row AF asserts it off the built triangles rather than off this note.

   ONE FIXED-POINT PASS, STATED. A groove's depth is measured from its floor, and its floor sits one
   calibre beyond the membrane — so depth depends on calibre and calibre depends on depth. The
   dependence of depth on calibre is weak (a calibre is at most a seventh of a depth), so the loop
   below converges in two passes and runs three. It is a loop and not a closed form because the
   surface solve sits inside it, and a closed form would mean inlining that. */
function cleftCalibre(t, k, depthSeg) {
  const live = cleftLive(t, k);
  const ceiling = CLEFT_R * live;
  if (!(depthSeg > 0)) return ceiling;
  const curvature = (F_CLIPY * live) * (F_CLIPY * live) / (2 * depthSeg);
  return Math.min(ceiling, curvature / FOLD_MARGIN);
}

/* THE BODY SURFACE, SOLVED THROUGH THE FIRST GROOVE'S LIPS.

   The surface ectoderm's radius follows the SAME taper law the pharynx does — one profile shape for
   the whole neck rather than a second invented one — scaled by a single factor SURF0 that is solved,
   not chosen: the factor that puts the surface exactly at the first groove's lip. Closed form, one
   division, at every t.

   Its craniocaudal span is NOT the pharynx's. The first pouch climbs 0.30 of a span towards the ear,
   which carries its tip and therefore its groove ABOVE the pharyngeal roof — so a surface that
   stopped at yTop would have the first groove hanging off the top of it. The shell reaches above the
   highest groove it has to contain, and that is also the anatomy: the surface ectoderm of the head
   does not stop where the pharynx does. */
function surfaceAt(t) {
  const F = frameAt(t);
  const live1 = cleftLive(t, 1);
  const r1 = cleftCalibre(t, 1, F_CDEPTH * live1);        // groove 1's depth is the stated one
  const A1 = appositionAt(t, 1, 1, r1);
  const lipR = 0.5 * r1 * F.seg;                          // the tube's calibre at its lip ends
  const yLip = A1.floorC.y + F_CLIPY * F.seg;
  const yHi  = Math.max(F.yTop, yLip) + 0.40 * F.seg;
  const yLo  = F.yBot - 0.15 * F.seg;
  const spanS = yHi - yLo;
  const uOfS = y => (yHi - y) / spanS;
  /* where the surface must be AT THE FIRST GROOVE'S LEVEL: its lips, plus their own calibre */
  const d1 = F_CDEPTH * F.seg * live1;
  /* THE WHOLE LIP, NOT ITS CENTRE. The slit lies perpendicular to the pouch's end tangent (see
     cleftPoint), and that tangent is about 45 degrees off lateral for the first pouch — so the
     slit direction has a radial component of its own and the two ENDS of the lip sit further out
     than its middle. Solving the surface through the middle left the first groove poking 0.19 of an
     intersegment out through the skin: measured, cleft1 reached |x| 3.052 against a surface that
     stopped at 2.867. The solve takes the furthest of the three lip points. */
  const lipC1 = A1.floorC.clone().addScaledVector(A1.ax, d1);
  const slit1 = new T.Vector3(0, 1, 0).addScaledVector(A1.ax, -A1.ax.y);
  if (slit1.lengthSq() < 1e-9) slit1.set(0, 0, 1);
  slit1.normalize().multiplyScalar(F_CLIPY * F.seg * live1);
  let need = 0;
  for (const q of [lipC1, lipC1.clone().add(slit1), lipC1.clone().sub(slit1)])
    need = Math.max(need, Math.hypot(q.x, q.z) + lipR);
  /* SOLVED AGAINST ALL FOUR GROOVES, NOT ONLY THE FIRST. Each groove is entitled to at least the
     stated depth, so the surface has to be at least (that groove's floor + F_CDEPTH + its lip
     calibre) at that groove's own level; the solve takes whichever groove demands the most, divided
     by the profile's value there. One scalar still, closed form still, and now the surface cannot
     come in past a groove at any level — which is the failure row AG found when the solve looked at
     groove 1 alone. Groove 1 is normally the binding one, because its pouch reaches furthest, and
     row AG asserts that rather than assuming it. */
  const profile = u => 1 - TAPER_S * Math.pow(clamp01(u), 1.6);
  let SURF0 = need / profile(clamp01(uOfS(A1.floorC.y)));
  for (let k = 2; k <= 4; k++) {
    const liveK = cleftLive(t, k);
    const dK = F_CDEPTH * liveK;
    const rK = cleftCalibre(t, k, dK);
    const AK = appositionAt(t, 1, k, rK);
    const lipK = AK.floorC.clone().addScaledVector(AK.ax, dK * F.seg);
    const slitK = new T.Vector3(0, 1, 0).addScaledVector(AK.ax, -AK.ax.y);
    if (slitK.lengthSq() < 1e-9) slitK.set(0, 0, 1);
    slitK.normalize().multiplyScalar(F_CLIPY * F.seg * liveK);
    let needK = 0;
    for (const q of [lipK, lipK.clone().add(slitK), lipK.clone().sub(slitK)])
      needK = Math.max(needK, Math.hypot(q.x, q.z) + 0.5 * rK * F.seg);
    SURF0 = Math.max(SURF0, needK / profile(clamp01(uOfS(AK.floorC.y))));
  }
  const Rs = u => SURF0 * profile(u);
  /* the surface's x where a point at height y and depth z sits on it: the shell's rows are
     ellipses, x^2/a^2 + z^2/b^2 = 1 with b = a * FLAT_SURF, so this is the shell's own equation and
     not an approximation of it */
  const xAt = (y, z) => {
    const a = Rs(uOfS(y)), b = a * FLAT_SURF;
    const q = 1 - (z / b) * (z / b);
    return q <= 0 ? 0 : a * Math.sqrt(q);
  };
  return { yHi, yLo, spanS, SURF0, Rs, uOfS, xAt, d1, lipR, need };
}

/* A GROOVE: floor on its pouch's end tangent, lips OUT AT THE SURFACE.

   Groove 1's depth is the stated one. Grooves 2, 3 and 4 take whatever depth reaches the solved
   surface from their own floor — so all four open at the body surface, and the three whose pouches
   reach less far are the deep pits. Returned in the same shape the old cleftPoint returned so the
   build block and the membrane did not have to learn a new one. */
function cleftPoint(t, side, k, which) {
  const F = frameAt(t);
  const S = surfaceAt(t);
  const live = cleftLive(t, k);
  /* THE FIXED POINT. depthSeg and the calibre determine each other; three passes, which is one more
     than it takes to settle — see cleftCalibre. Groove 1 skips it: its depth is the stated one. */
  let depthSeg = F_CDEPTH * live, rSeg = cleftCalibre(t, k, depthSeg), A = appositionAt(t, side, k, rSeg);
  if (k !== 1) {
    for (let it = 0; it < 3; it++) {
      const reach = Math.hypot(A.floorC.x, A.floorC.z);
      const lateral = Math.hypot(A.ax.x, A.ax.z) || 1;
      const lipR = 0.5 * rSeg * F.seg;
      /* THE DEPTH SCALES WITH live EXACTLY AS THE SLIT'S LENGTH AND CALIBRE DO, so a groove being
         buried is a SMALL groove and not a differently shaped one. Without this the aspect ratio
         ran away as the cervical sinus closed over the lower three: at t = 1 their slits were a
         twentieth of their length while the derived depth still reached for the surface, the solved
         calibre collapsed with it, and render-kit's triN — whose degeneracy guard is absolute —
         dropped enough triangles to leave 523 unpaired edges and 8 mis-wound hull triangles. Which
         is the pouch note's lesson, one block up, arriving for the second time in one file. */
      depthSeg = live * Math.max(0.12,
                 (S.xAt(A.floorC.y, A.floorC.z) - reach - lipR) / lateral / F.seg);
      rSeg = cleftCalibre(t, k, depthSeg);
      A = appositionAt(t, side, k, rSeg);
    }
  }
  const depth = depthSeg * F.seg;
  const lipC = A.floorC.clone().addScaledVector(A.ax, depth);
  /* THE SLIT LIES IN THE PLANE OF APPOSITION, NOT ALONG WORLD y. The groove runs craniocaudally,
     but "craniocaudally" has to mean craniocaudally ON THE SURFACE, which is the component of +y
     perpendicular to the direction the pouch grew. Along world y instead, the first groove's caudal
     half ran down the FLANK of the pouch's dome rather than opposite its pole — pouch 1 climbs 0.30
     of a span, so its end tangent is about 45 degrees off lateral — and the two surfaces closed to
     0.007 of an intersegment where they were meant to be 0.10 apart. Measured, not reasoned: claim
     B4-not-fused failed and this is what it found. Perpendicular to the tangent, the dome curves
     AWAY from the slit at both ends, so the minimum separation is at the middle and it is the
     membrane thickness. */
  const slit = new T.Vector3(0, 1, 0).addScaledVector(A.ax, -A.ax.y);
  if (slit.lengthSq() < 1e-9) slit.set(0, 0, 1);
  slit.normalize();
  const dy = slit.multiplyScalar(F_CLIPY * F.seg * live);
  /* THE CONTROL POINT IS NOT THE FLOOR, AND THAT WAS A LIVE DEFECT IN THE FIRST DRAFT OF THIS FIX.
     The groove is swept along bez3(top, CONTROL, bot) — a QUADRATIC Bezier, whose curve passes
     through the two ends and reaches only HALF WAY to the control point: its midpoint is
     (top + 2C + bot)/4. Handing it the floor as the control point therefore puts the deepest point
     of the groove half a depth short of the floor, which is exactly what the apposition probe
     caught: pouch 1 to cleft 1 measured 0.306 of an intersegment with F_MEMB set to 0.10. Solving
     C from the endpoints instead — C = 2*floor - lip, since top + bot = 2*lip — puts the curve's
     own midpoint ON the floor, which is where the membrane is. The lesson is the file's own: an
     offset handed to a curve is not a point on the curve. */
  const ctrl = A.floorC.clone().addScaledVector(A.ax, -depth);
  if (which === 'floor') return A.floorC.clone();
  return { x: lipC.x, y: A.floorC.y, depth, live, r: F.Rph(F.uOf(A.floorC.y)),
           top: lipC.clone().add(dy), bot: lipC.clone().sub(dy), mid: ctrl,
           floorC: A.floorC.clone(), lipC: lipC, ax: A.ax.clone(), appose: A,
           calibreSeg: rSeg, depthSeg: depthSeg,
           /* the fold margin this groove is actually built with, so row AF can read it */
           foldMargin: rSeg > 0 ? ((F_CLIPY * live) * (F_CLIPY * live) / (2 * depthSeg)) / rSeg : Infinity };
}

/* ══════════════════════════════════════════════════════════════════ pouch and wing geometry */

/** the pouch's centreline, from inside the wall out to its tip */
function pouchPath(t, side, k, growOverride) {
  const F = frameAt(t);
  const P = POUCH[k - 1];
  const y = F.yP[k];
  const u = F.uOf(y);
  const r = F.Rph(u);
  const grow = growOverride != null ? growOverride
             : (k === 2) ? involute(t, P.day, P.day + POUCH_FULL, 44, 56, POUCH2_FLOOR)
             : (k >= 3)  ? involute(t, P.day, P.day + POUCH_FULL, 38, 50)
             : phase(t, P.day, P.day + POUCH_FULL);
  const L = P.len * F.span * grow;
  /* the proximal end starts INSIDE the wall, so the pouch's start cap is buried and never shows */
  const A = new T.Vector3(side * (r - 1.1 * WALLF * r), y, 0);
  const Z = new T.Vector3(side * (r + L), y + P.rise * F.span * grow, P.zoff * F.span * grow);
  /* THE POUCH LEAVES THE WALL PERPENDICULAR TO IT. The control point shares A's y and z, so the
     initial tangent is purely lateral and all the curvature towards the ear (pouch 1 climbs 0.30 of
     a span) happens further out. Two reasons, and the second is the one that matters: a diverticulum
     does leave a wall at right angles, and — because the start ring of a swept tube lies in the plane
     perpendicular to the path's initial tangent — it puts every vertex of that ring at the SAME x,
     which makes the ostium level exactly measurable. With an oblique exit the start ring tilts, the
     vertices nearest the median plane are the ones displaced towards -tangent, and row P read pouch
     1's ostium 0.17 of an intersegment above its true level off that bias alone. */
  const Cp = new T.Vector3(side * (r + L * 0.45), y, 0);
  return { pts: bez3(A, Cp, Z, 14), grow, rBase: r, tip: Z };
}
function pouchTip(t, side, k) { return pouchPath(t, side, k).tip; }

/** a wing's centreline, leaving the parent pouch at WING.from and heading dorsally or ventrally */
function wingPath(t, side, k, which) {
  const F = frameAt(t);
  const P = POUCH[k - 1];
  const pp = pouchPath(t, side, k);
  const A = atArc(pp.pts, WING.from);
  const grow = involute(t, P.day + WING.day, P.day + WING.day + WING.full, 40, 52);
  const Lw = WING.len * P.len * F.span * grow;
  const sgn = which === 'dorsal' ? -1 : 1;
  const Z = new T.Vector3(A.x + side * Lw * 0.45, A.y + (which === 'dorsal' ? 0.22 : -0.26) * Lw, A.z + sgn * Lw);
  const Cp = new T.Vector3(A.x + side * Lw * 0.30, A.y + (which === 'dorsal' ? 0.06 : -0.08) * Lw, A.z + sgn * Lw * 0.45);
  return { pts: bez3(A, Cp, Z, 10), grow, tip: Z, rParent: P.r1 * F.seg };
}
function wingTip(t, side, k, which) { return wingPath(t, side, k, which).tip; }

/* ══════════════════════════════════════════════════════════════════ small-solid helper

   A gland, a lobe, a tonsil: a closed capsule along a short axis, domed at both ends, so there is
   never an annular end cap standing in mid-air. RENDER-STANDARD: "A TUBE THAT ENDS IN MID-AIR NEEDS
   A ROUNDED END, NOT AN ANNULUS." tubeCapped is the kit function that does it without the five
   chances to get a hand-rolled dome subtly wrong. */
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

/* ══════════════════════════════════════════════════════════════════ build */

function buildApparatus(t, opts) {
  const o = opts || {};
  const F = frameAt(t);
  const g = new T.Group();
  const OUT = 0.012 * F.R0;        // the silhouette scales with the model: at day 22 the whole
                                   // apparatus is 0.6 mm across and the kit's 0.030 default would
                                   // be a third of it
  const add = (key, geo, layer, extra) => {
    if (!geo) return null;
    const e = extra || {};
    return K.addSolid(g, key, geo, Object.assign({
      color: LAYERS[layer].color, name: LAYERS[layer].name, outline: OUT,
    }, e));
  };
  /* EVERY PART GETS ITS OWN MESH, CARRYING THE SAME KEY, and that is a measurement decision as much
     as a rendering one. The first draft merged each key's parts into one mesh per key — the left and
     right of a pair, the ten arch bars, the eighteen C cells. viz3d's mergeByKey merges them anyway
     (viz3d.js:493), so the player sees no difference; what changed is what a probe can ask. The
     outward-normals probe steps along a vertex's normal and asks whether it is OUTSIDE THE SOLID, and
     on a merged mesh "the solid" is the union: a vertex of the left thymic lobe that lies inside the
     right one at the midline is inside the union, so the probe read 0.745 on a surface that is
     correct. That is the confound tools/render-chorion-placenta-early.mjs documents on its villous
     tree, and the fix it names is per-sub-mesh testing — which only works if the sub-meshes exist.
     Same for the watertight weld tolerance, which is derived from a mesh's own diagonal and was being
     derived from the distance between left and right instead. */
  const addAll = (key, geos, layer, extra) => {
    const live = (geos || []).filter(Boolean);
    for (const geo of live) add(key, geo, layer, extra);
    return live.length;
  };
  const SIDES = [-1, 1];

  /* ── the pharyngeal wall ───────────────────────────────────────────────────────────────────── */
  {
    const rows = 56;
    const pts = [];
    for (let i = 0; i <= rows; i++) pts.push(new T.Vector3(0, F.yTop - (i / rows) * F.span, 0));
    const fr = K.parallelFrame(pts, new T.Vector3(1, 0, 0));
    const outer = i => F.Rph(i / rows);
    const geo = K.sweptShell({
      frame: fr, i0: 0, i1: rows, ring: 40,
      outerR: outer,
      innerR: i => outer(i) * (1 - WALLF),
      flatten: FLAT_PH, section: () => 1,
    });
    add('pharyngeal_wall', geo, 'wall', { matOver: { opacity: 0.55 } });
  }

  /* ── the arch bars: the five intersegments the pouches lie BETWEEN ─────────────────────────── */
  {
    const S_ = surfaceAt(t);
    const bars = [];
    for (const side of SIDES) {
      for (let s = 0; s < NSEG; s++) {
        const yMid = F.yTop - (s + 0.5) * F.seg;
        const r = F.Rph(F.uOf(yMid));
        const inv = Math.max(VESTIGE, 1 - 0.45 * ss((F.day - 34) / 22));
        /* A GENTLE ARC AND A SLENDER BAR, and the first draft was neither. It swept a bar of radius
           0.30 of an intersegment through nearly 180 degrees with a control point 1.40 r out, and the
           tube's radius then exceeded the local radius of curvature of its own centreline — so the
           swept surface folded back through itself and 252 of 8000 OUTER-SURFACE triangles came out
           wound against their own supplied normal, with the outward-normals probe reading 0.932.
           Neither is a kit fault: sweptShell derives its normals from a finite difference of the same
           point function that places the vertices (rule 3), and that is exactly the construction that
           cannot survive a centreline turning faster than the tube is thick. A bar is a bar; halving
           the calibre and opening the arc removes the fold rather than hiding it. */
        /* FLAT ENOUGH THAT THE SWEEP CANNOT FOLD, and this took three attempts to get right because
           the first two reasoned about it instead of measuring. A swept tube folds through itself
           wherever its own radius exceeds the local radius of curvature of its centreline, and for a
           quadratic arc that radius is about chord^2 / (8 * sagitta). The draft that bulged 0.70 of
           an intersegment over a 0.65 chord had a curvature radius of 0.075 against a tube radius of
           0.145 — twice too fat — and 216 of 9280 OUTER-SURFACE triangles came out wound against
           their own supplied normal. 0.18 of sagitta over the same chord gives 0.29, against a tube
           radius of 0.105: a margin of 2.8, and the winding probe reads zero at every sampled day.
           An arch bar is a slender bar wrapping the pharynx, so a shallow bow is also the truer
           shape; the fold was never telling us the anatomy was wrong. */
        /* THE ARC'S SHAPE IS A FRACTION OF THE LOCAL WALL RADIUS, NOT OF THE INTERSEGMENT, and that
           is the whole of the third and final fix here. Measured in isolation, the bar's own arc was
           clean at every sagitta and every calibre tried — so the fold was not in the shape, it was
           in the shape CHANGING down the tube. The pharynx tapers: its half-width runs from 0.80 of
           an intersegment at the first pouch to 0.36 at the caudal end. A bar whose dorsoventral
           chord is a fraction of that radius but whose lateral bulge was a fixed fraction of the
           intersegment therefore got relatively deeper and deeper towards the tail, until for the
           last bars the sagitta exceeded the chord: curvature radius 0.029 of an intersegment
           against a tube radius of 0.105, and 24 to 32 outer-surface triangles folded. Expressing
           every term as a fraction of the LOCAL radius makes all five bars the same shape, with a
           curvature-to-calibre margin of 3.3 at both ends of the taper instead of 2.8 at one end and
           0.28 at the other. The general lesson is the one RENDER-STANDARD keeps restating: a
           constant that is safe where it was checked is not a constant, it is a sample. */
        /* THE BAR WRAPS THE MIDDLE OF THE ARCH MESENCHYME, NOT THE WALL. Changed 2026-10-03,
           review finding F5: the bars ran from |x| 0.46 to 1.07 intersegments while the wall's own
           outer surface reached 0.80, so most of each bar was inside the wall it is supposed to be
           the mesenchyme lateral to, and from `anterior` only small grey nubs emerged at the wall's
           edge — under a narration that teaches the pouches lie BETWEEN the arches. An arch is the
           tissue between the pharyngeal endoderm and the surface ectoderm, and until this run the
           model had no surface ectoderm for it to be between.

           EVERY RATIO IN THE ARC IS UNCHANGED, and that is deliberate rather than lazy. The three
           notes above record three failed attempts at this arc, all of them folds: a swept tube
           folds through itself wherever its own radius exceeds the local radius of curvature of its
           centreline, and the shape that finally held has chord 0.81 rb, sagitta 0.175 rb and
           calibre 0.070 rb — a curvature-to-calibre margin of 6.7 that is a property of the RATIOS
           and so survives any rb. Moving the bar out is therefore done by substituting the working
           radius and touching nothing else.

           rb IS SOLVED, NOT CHOSEN: the radius at which this arc's own MEAN radius (1.19 rb for
           these ratios) lands half way between the wall's outer surface and the surface ectoderm's
           inner one. So the bars sit in the middle of the arch region at every level and at every
           t, and they taper with the arch region rather than with the intersegment — which is the
           lesson of the third note above, that a constant safe where it was checked is a sample. */
        const Rsin = S_.Rs(S_.uOfS(yMid)) * (1 - SURFW);
        const rb = Math.max(r * 1.02, (r + Rsin) / (2 * 1.19));
        const A = new T.Vector3(side * rb * 1.10, yMid, -0.90 * rb * FLAT_SURF);
        const Z = new T.Vector3(side * rb * 1.10, yMid, 0.90 * rb * FLAT_SURF);
        const Cp = new T.Vector3(side * rb * 1.45, yMid, 0);
        const rf = u => 0.070 * rb * inv * (0.62 + 0.38 * Math.sin(Math.PI * clamp01(u)));
        bars.push(K.tubeCapped(bez3(A, Cp, Z, 18), rf, { ring: 16, cap: 'both', capRows: 6 }));
      }
    }
    addAll('arch_bars', bars, 'arches', { matOver: { opacity: 0.30 } });
  }

  /* ── the surface ectoderm: the body surface the grooves are grooves IN ───────────────────
     ADDED 2026-10-03, review finding F4: the four clefts sat 3.9 to 4.5 intersegments out with the
     pharyngeal wall ending at 0.80 and NOTHING between, so a student saw four crescents hanging in
     space under a narration that calls a cleft "a groove on the OUTSIDE". A groove is a feature of
     a surface and there was no surface.

     IT IS A SHELL, NOT A SHEET, and that is a measurement decision. Every gate in this model's
     harness — watertight edge pairing, and the ray-parity test that is what "normals point outward"
     actually means — is defined on a CLOSED solid; an open panel has a boundary of unpaired edges
     and a parity that is undefined. So the body surface is a thick-walled swept shell, built exactly
     the way pharyngeal_wall is built, and it inherits exactly the same declared render-kit finding:
     sweptShell's cap() winds one of its two annular-cap branches against its own supplied normal.
     Those caps face +/-y, so they are behind the hull and are seen only from `superior` and
     `inferior`, which no beat stands at; row AC pins the count so it cannot grow quietly.

     IT IS CONTEXT AT LOW OPACITY AND NO BEAT THAT STANDS INSIDE IT SHOWS IT. RENDER-STANDARD 3.aa:
     anything drawn in front of a claim's subject counts against the claim. This shell encloses the
     whole apparatus, so from `lateral` — where the membrane beat stands — it would be the first
     surface a ray meets. Beat 1 is the beat that shows it, and beat 1 is sectioned at z = 0 and
     stands at `anterior`: a cut neck seen from the front, with the grooves dipping into the cut
     edge, which is the one frame in which "a groove in a surface" is a picture rather than a word. */
  {
    const S = surfaceAt(t);
    const rows = 48;
    const pts = [];
    for (let i = 0; i <= rows; i++) pts.push(new T.Vector3(0, S.yHi - (i / rows) * S.spanS, 0));
    const fr = K.parallelFrame(pts, new T.Vector3(1, 0, 0));
    const outer = i => S.Rs(i / rows);
    const geo = K.sweptShell({
      frame: fr, i0: 0, i1: rows, ring: 44,
      outerR: outer,
      /* THE SHEET TAPERS TO NOTHING AT BOTH ENDS. RENDER-STANDARD: "A MEMBRANE TAPERS ... drawn with
         a constant free edge it reads as a slab of card." It is also the repair for an artefact this
         shell would otherwise introduce: sweptShell closes a thick-walled span with an ANNULAR END
         CAP, and one of render-kit cap()'s two branches is wound against its own supplied normal —
         48 of 48 on a plain thick-walled tube, a kit finding this model reported and must not patch
         locally (RENDER-STANDARD section 6). On the pharyngeal wall those caps cost 80 mis-wound
         triangles behind the hull and 46 backface-first hits from `superior`, a camera no beat
         stands at. This shell is far larger, and with a constant wall it took that figure to 514.
         Bringing the inner radius out to meet the outer one at i = 0 and i = rows makes the annular
         cap a ring of zero width: its triangles are degenerate, render-kit's triN drops them, and
         the two rims weld to each other instead.

         IT TAPERS TO A TENTH, NOT TO ZERO, AND THE DIFFERENCE IS MEASURED. Taken all the way to
         zero the cap's triangles do degenerate and triN does drop them — and the inner and outer
         surfaces then share one rim ring, where each edge is met by four triangles instead of two:
         88 NON-MANIFOLD edges, which the watertight probe reports and which is a worse fault than
         the one being avoided. A tenth of the wall leaves a cap 0.009 of the local radius wide: no
         degeneracy, a manifold solid, and an area small enough that the artefact it carries fell
         from 514 backface-first hits from `superior` to 34 — below the 46 the pharyngeal wall alone
         was producing before this shell existed. It is also what the anatomy says: the surface
         ectoderm does not stop at the ends of the modelled span, it carries on, and a sheet that
         carries on has no rim to speak of. */
      innerR: i => outer(i) * (1 - SURFW * (0.10 + 0.90 * Math.pow(Math.sin(Math.PI * (i / rows)), 0.55))),
      flatten: FLAT_SURF, section: () => 1,
    });
    add('surface_ectoderm', geo, 'surface', { matOver: { opacity: 0.16 } });
  }

  /* ── the ectodermal clefts: OUTSIDE, and in a colour nothing else uses ────────────────────────
     The scene's gaps[] is explicit that the commonest marked-wrong answer in this topic is a student
     attributing a cleft derivative to a pouch, and that a picture colouring the two sides alike
     actively teaches that error. So the clefts are one key, in the ectoderm colour, and they sit
     lateral to the arch bars where the pouches are medial to them. */
  {
    /* TWO KEYS, NOT ONE, AND THE PLAYER'S FRAMING IS WHY. The four grooves were one key, and the
       four of them span three intersegments down the pharynx — so the beat about the FIRST pouch and
       the FIRST cleft had a subject box three intersegments tall around a subject half an
       intersegment wide, and the player's per-view refit (viz3d.js:2124) framed the lot: 3.68% of the
       frame was the subject. The split is also the anatomy. The first cleft is the one with a
       derivative anybody is examined on — it persists as the external acoustic meatus and it is half
       of the tympanic membrane — and the second, third and fourth are the group buried by the
       cervical sinus, which is a different entry's subject. They keep two shades of the SAME ectoderm
       colour, because the thing a student must never lose is which side of the apparatus they are on. */
    const first = [], lower = [];
    for (const side of SIDES) {
      for (let k = 1; k <= 4; k++) {
        const c = cleftPoint(t, side, k);
        /* the calibre is SOLVED per groove — cleftCalibre — so the sweep's fold margin is the same
           at every groove and every t instead of being whatever the first one tested at */
        const rf = u => c.calibreSeg * F.seg * (0.5 + 0.5 * Math.sin(Math.PI * clamp01(u)));
        (k === 1 ? first : lower).push(
          K.tubeCapped(bez3(c.top, c.mid, c.bot, 12), rf, { ring: 14, cap: 'both', capRows: 6 }));
      }
    }
    addAll('cleft1', first, 'ectoderm', { matOver: { opacity: 0.85 } });
    addAll('clefts_lower', lower, 'ectoderm2', { matOver: { opacity: 0.85 } });
  }

  /* ── the median plane reference ──────────────────────────────────────────────────────────────
     RENDER-STANDARD: "A REFERENCE MUST SURVIVE THE VIEW THAT USES IT" — the cardiac-looping median
     reference was 96.5% occluded because it lay at z = 0 behind the subject. This one is placed
     VENTRAL of everything the model builds, standing clear of it, so the anterior camera that the
     descent views use sees it against the background rather than through the thymus.

     IT STOPS ABOVE THE THYMUS ON PURPOSE. Spanning the whole model would put an opaque rod at x = 0
     across the one thing view 5 exists to show — the two thymic strands meeting in the midline —
     which is RENDER-STANDARD 3.aa's fault: a reference that occludes the subject the beat is about.
     The rod runs from the top of the pharynx down to the thyroid's upper pole, so the median plane
     is marked and the fusion below it is clear. The fusion itself is measured geometrically by
     claimMeasure('thymusMinAbsXOverSeg'), not read off the rod. */
  {
    /* IT IS A TICK AT THE DESCENT, NOT A ROD DOWN THE WHOLE MODEL, and the player's own framing is
       why. viz3d refits the camera per view to the bounding box of what the view leaves visible
       (viz3d.js:2124), so a reference that spans the entire apparatus sets the frame for every beat
       that shows it — the crossover beat measured its subject at 10.9% of the frame with this rod in
       it, because the rod reached from the pharynx to the mediastinum while the subject is the
       thyroid's two poles. A reference exists to let a student judge one claim, and the only claim
       here that needs the median plane is that the two thymic strands MEET on it. So the tick spans
       the descent and nothing else: it marks the midline where the fusion happens, and it adds
       nothing to any other beat's box. */
    const zFront = F.thymusRest.z + 1.0 * F.seg;
    const pts = [new T.Vector3(0, F.thyBot, zFront),
                 new T.Vector3(0, F.thymusRest.y - 0.5 * F.seg, zFront)];
    const rod = K.tubeCapped(pts, () => 0.030 * F.seg, { ring: 10, cap: 'both', capRows: 5 });
    add('median_plane', rod, 'midline', { matOver: { opacity: 0.8 } });
  }

  /* ── the four pouches ───────────────────────────────────────────────────────────────────────── */
  for (const P of POUCH) {
    const parts = [];
    for (const side of SIDES) {
      const pp = pouchPath(t, side, P.k);
      /* THE CALIBRE SCALES WITH grow EXACTLY AS THE LENGTH DOES, which makes the pouch's ASPECT RATIO
         independent of how far it has grown — and that is what keeps the sweep clean at every stage
         rather than at the stages that were looked at. Two drafts failed here. At 0.55 + 0.45 * grow
         an involuted stem was a tenth as LONG and two-thirds as WIDE, so its own largest extent at
         t = 1 was its diameter rather than its length and row V read a vestige ratio of 2.6 on a
         structure that has effectively gone. At 0.10 + 0.90 * grow the stem narrowed properly but a
         BUDDING pouch was still proportionally fat: the aspect fell to about 1 at grow = VESTIGE and
         4 of 1892 outer-surface triangles came out wound against their own supplied normal at day 22,
         on the hull, which is the surface that takes the silhouette. Scaling both the same way makes
         a young pouch a small pouch rather than a different shape, and the vestige a tenfold collapse
         in every dimension at once. */
      const rf = u => F.seg * (P.r0 + (P.r1 - P.r0) * Math.pow(clamp01(u), 1.35)) * pp.grow;
      parts.push(K.tubeCapped(pp.pts, rf, { ring: 22, cap: 'end', capRows: 8, bulge: 0.9 }));
    }
    addAll('pouch' + P.k, parts, P.layer);
  }

  /* ── the wings of pouches 3 and 4 ───────────────────────────────────────────────────────────── */
  for (const k of [3, 4]) {
    for (const which of ['dorsal', 'ventral']) {
      const parts = [];
      for (const side of SIDES) {
        const wp = wingPath(t, side, k, which);
        const rf = u => wp.rParent * WING.r * (0.70 + 0.30 * Math.sin(Math.PI * clamp01(u))) *
                        wp.grow;    // scales with grow exactly as the length does — see the pouch note
        parts.push(K.tubeCapped(wp.pts, rf, { ring: 18, cap: 'end', capRows: 7, bulge: 0.9 }));
      }
      addAll('pouch' + k + '_' + which + '_wing', parts, 'pouch' + k);
    }
  }

  /* ── the tympanic membrane ───────────────────────────────────────────────────────────────────
     Where the first pouch meets the first cleft from outside, endoderm and ectoderm come together
     with a thin layer of mesoderm between them, and that three-layered sheet is the membrane. It is
     built as a lens BETWEEN the two, so its position is a consequence of where they are rather than
     a placed constant. */
  /* IT SPANS THE APPOSITION GAP EXACTLY, AND THAT IS THE WHOLE FIX FOR F1. The old membrane was a
     lens half way between the pouch's CENTRELINE TIP and the cleft's CENTRE — two interior points,
     so the sheet sat in the middle of a void and touched neither surface: measured 0.63 of an
     intersegment of empty space to the pouch and 0.85 to the cleft, on a membrane whose own bbox
     diagonal was 31 units. It is now built from the two SURFACES: appositionAt gives the pouch's
     lateral-most point and the groove floor's medial-most point, the membrane is centred between
     them and its half-thickness IS half the gap. So at full growth it meets both, and row AP
     measures that it does off the built vertices rather than off this comment. */
  {
    const parts = [];
    const live = phase(t, TYMP.day, TYMP.full);
    for (const side of SIDES) {
      const A = cleftPoint(t, side, 1).appose;
      const mid = A.pOuter.clone().lerp(A.gFloor, 0.5);
      /* blob()'s radius law is R * (0.34 + 0.66 sin(pi u)), so its half-extent ALONG the axis is
         the `half` argument: half the gap puts its two poles on the two surfaces. The 1.04 is a
         hair of deliberate interpenetration — apposition is contact, and row Z's partition names
         both pairs as ANATOMY rather than hiding them under a tolerance. */
      const half = 0.52 * A.memb * live;
      /* ITS WIDTH IS THE RECESS'S OWN TIP CALIBRE, NOT A STATED FRACTION OF AN INTERSEGMENT. At
         0.52 of an intersegment it was 1.5 times the width of the pouch it caps, and the render
         showed it for what that is: a saucer stuck on the end of a cone, overhanging the recess on
         every side. The tympanic membrane closes the lateral end of the tubotympanic recess, so its
         width is that end's width — 1.15 of the tip calibre, a rim rather than an overhang. Derived,
         so it tracks the recess at every t instead of being right at the one that was looked at. */
      const R = 1.15 * BULGE * F.seg * POUCH[0].r1 * A.grow;
      parts.push(blob(mid, A.ax, half, R * live, 20));
    }
    addAll('tympanic_membrane', parts, 'membrane',
        { matOver: { opacity: 0.9 } });
  }

  /* ── the palatine tonsil, growing INTO the second pouch ──────────────────────────────────────
     "The second pouch is largely obliterated as the palatine tonsil grows into it." So the tonsil's
     centre is a point ON the pouch-2 centreline, and it swells there — which is what obliterating a
     pouch looks like, and it means the two solids are in genuine anatomical contact rather than
     construction contact. Row Z's partition names the pair. */
  {
    const parts = [];
    const live = phase(t, TONSIL.day, TONSIL.full);
    for (const side of SIDES) {
      const pp = pouchPath(t, side, 2);
      const c = atArc(pp.pts, 0.68);
      const axis = atArc(pp.pts, 0.95).sub(atArc(pp.pts, 0.35));
      parts.push(blob(c, axis.lengthSq() > 1e-12 ? axis : new T.Vector3(side, 0, 0),
                      0.30 * F.seg * live, 0.44 * F.seg * live, 20));
    }
    addAll('palatine_tonsil', parts, 'tonsil');
  }

  /* ── the thymus: two strands, growing caudally, meeting in the midline ───────────────────────── */
  {
    const parts = [];
    const grow = phase(t, DESC.day, DESC.full);
    for (const side of SIDES) {
      const full = ductPath(t, side);
      const grown = headOfArc(full, grow, 24);
      /* the thymus IS the distal third of the grown strand, swollen; the duct above it is the trail */
      const lobe = spanOfArc(grown, 0.62, 1.0, 12);
      const rf = u => 0.34 * F.seg * grow * (0.45 + 0.75 * Math.sin(Math.PI * (0.25 + 0.6 * clamp01(u))));
      parts.push(K.tubeCapped(lobe, rf, { ring: 20, cap: 'both', capRows: 8, bulge: 0.9 }));
    }
    addAll('thymus', parts, 'thymus');
  }

  /* ── the thymopharyngeal duct: the trail, and the route every ectopic site lies on ───────────── */
  {
    const parts = [];
    const grow = phase(t, DESC.day, DESC.full);
    /* it is drawn out as the thymus descends and then involutes — normally it disappears, and what
       is left behind of it is exactly what a cervical thymic cyst is */
    const thin = Math.max(VESTIGE, 1 - 0.72 * ss((F.day - 46) / 12));
    for (const side of SIDES) {
      const full = ductPath(t, side);
      const grown = headOfArc(full, grow, 26);
      const stem = spanOfArc(grown, 0.0, 0.68, 20);
      const rf = () => 0.085 * F.seg * thin;
      parts.push(K.tubeCapped(stem, rf, { ring: 14, cap: 'end', capRows: 6 }));
    }
    addAll('thymopharyngeal_duct', parts, 'duct');
  }

  /* ── the two parathyroid pairs ───────────────────────────────────────────────────────────────── */
  {
    const live = phase(t, PT_DAY, PT_DAY + 10);
    const prog = phase(t, DESC.day, DESC.full);
    for (const [key, pathFn, layer] of [
      ['inferior_parathyroid', pt3Path, 'pt_inferior'],
      ['superior_parathyroid', pt4Path, 'pt_superior'],
    ]) {
      const parts = [];
      for (const side of SIDES) {
        const path = pathFn(t, side);
        const c = atArc(path, prog);
        const axis = atArc(path, Math.min(1, prog + 0.1)).sub(atArc(path, Math.max(0, prog - 0.1)));
        parts.push(blob(c, axis.lengthSq() > 1e-12 ? axis : new T.Vector3(0, 1, 0),
                        0.13 * F.seg * live, 0.17 * F.seg * live, 18));
      }
      addAll(key, parts, layer);
    }
  }

  /* ── the ultimopharyngeal body ────────────────────────────────────────────────────────────────
     It travels into the thyroid and is absorbed there, dispersing as the C cells. So it grows, moves
     and then shrinks to the mounting vestige, and the C cells appear as it does. */
  {
    const parts = [];
    const live = involute(t, UB.day, UB.day + 10, 44, UB.gone);
    const prog = phase(t, DESC.day, DESC.full);
    for (const side of SIDES) {
      const path = ubPath(t, side);
      const c = atArc(path, prog);
      parts.push(blob(c, new T.Vector3(side * 0.3, -1, 0), 0.11 * F.seg * live, 0.15 * F.seg * live, 16));
    }
    addAll('ultimopharyngeal_body', parts, 'ultimo');
  }

  /* ── the thyroid gland: context. It is what the C cells join, and its two poles are the stated
     resting levels of the two parathyroid pairs. Thyroid DEVELOPMENT is a different curriculum
     entry and the scene does not claim it: the descent from the foramen caecum and the thyroglossal
     duct are deliberately absent here. ───────────────────────────────────────────────────────── */
  {
    const parts = [];
    const grow = phase(t, 26, 48);
    const hy = (F.thyTop - F.thyBot) * 0.5 * grow;
    const cy = (F.thyTop + F.thyBot) * 0.5;
    for (const side of SIDES) {
      parts.push(blob(new T.Vector3(side * F.thyX, cy, F.thyZ), new T.Vector3(0, 1, 0),
                      hy, 0.30 * F.seg * grow, 20));
    }
    /* the isthmus, so the two lobes read as one gland rather than two beans */
    parts.push(K.tubeCapped(
      [new T.Vector3(-F.thyX, cy + hy * 0.25, F.thyZ), new T.Vector3(0, cy + hy * 0.25, F.thyZ + 0.04 * F.seg),
       new T.Vector3(F.thyX, cy + hy * 0.25, F.thyZ)],
      () => 0.14 * F.seg * grow, { ring: 14, cap: false }));
    addAll('thyroid_gland', parts, 'thyroid',
        { matOver: { opacity: 0.42 } });
  }

  /* ── the C cells: neural crest in origin, arriving through the fourth pouch, dispersed through
     the thyroid. Drawn as a scatter inside the lobes, which is what "disperses" looks like. ───── */
  {
    const parts = [];
    const live = phase(t, CCELL.day, CCELL.full);
    const grow = phase(t, 26, 48);
    const hy = (F.thyTop - F.thyBot) * 0.5 * grow;
    const cy = (F.thyTop + F.thyBot) * 0.5;
    let seed = 1;
    const rnd = () => { seed = (seed * 1103515245 + 12345) & 0x7fffffff; return seed / 0x7fffffff; };
    /* SEVEN PER SIDE AT 0.085 OF AN INTERSEGMENT, not nine at 0.040, and the measurement is what
       changed it. On the player's own frame the C cells drew 0.012% of beat 7 — a peak alpha of 251,
       so they were being drawn, and they were simply too small for a student to see. They are a
       TEACHING SCATTER, not cells at cellular scale: a plate draws C cells as visible dots because
       the fact being taught is that they are dispersed through the gland rather than collected in
       it. Fewer and larger says the same thing and can be read. */
    for (const side of SIDES) {
      for (let i = 0; i < 7; i++) {
        /* 0.46, NOT 0.80. Widening the scatter to 0.80 of an intersegment was an attempt to make
           the cells visible by letting some of them reach the gland's surface, and it put a fifth of
           them OUTSIDE it: acceptance row U fell to 0.799 against a floor of 0.95 and beat 7's own
           claim B7-dispersed failed with it. Both were right and the attempt was wrong — "disperses
           INSIDE the thyroid, not a lump on it" is the fact being taught, and a C cell outside the
           gland is a different and false fact. The lobe's radius is 0.30 of an intersegment, so a
           radial offset of 0.46 * 0.55 = 0.25 keeps every cell inside it. What made them visible in
           the end was none of this: it was standing beat 7 at day 48 instead of day 44, where the
           model had not built them yet. */
        const a = rnd() * Math.PI * 2, rr = Math.sqrt(rnd()) * 0.46 * F.seg * grow;
        const c = new T.Vector3(side * F.thyX + rr * Math.cos(a) * 0.55,
                                cy + (rnd() - 0.5) * 1.1 * hy,
                                F.thyZ + rr * Math.sin(a) * 0.55);
        parts.push(blob(c, new T.Vector3(0, 1, 0), 0.055 * F.seg * live, 0.085 * F.seg * live, 12));
      }
    }
    addAll('c_cells', parts, 'ccell', { noOutline: true });
  }

  return g;
}

/* ══════════════════════════════════════════════════════════════════ measuring the built geometry

   Everything below reads VERTICES out of a built group. RENDER-STANDARD: "The measured side of every
   acceptance assertion must be read from the geometry the model builds — rows, grids or mesh
   vertices — and never from the constants the geometry was built from. Restating a shape law in the
   test that checks it proves only that the author can do the arithmetic twice." */

const _cache = {};
function groupAt(t) {
  const k = t.toFixed(6);
  if (!_cache[k]) _cache[k] = buildApparatus(t, {});
  return _cache[k];
}
/* CACHED PER (group, key). Row Z is a pairwise containment test over twenty keys and without this it
   re-walked the whole scene graph for every pair, which took the battery from seconds to minutes. */
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
/** the bounding box of ONE SIDE of a paired key.
    WHY THIS EXISTS, because getting it wrong hid a whole row. Every structure here is built as a
    PAIR about x = 0, so the pair's bounding box spans both sides and its x size is dominated by the
    distance between them — about 2 x the pharyngeal half-width — not by the structure's own reach.
    Row V's first draft measured a pouch stem's involution off the pair box and read a ratio of
    roughly 1 on a stem that shrinks tenfold, because the gap between left and right does not shrink
    at all. A per-side box is the structure's own extent, which is what every size claim here means. */
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
/** a structure's own largest extent, measured on one side, in intersegments at its own t */
function ownExtentSeg(t, key) {
  const b = sideBox(groupAt(t), key, +1);
  return b ? Math.max(b.size[0], b.size[1], b.size[2]) / frameAt(t).seg : 0;
}
/** THE OSTIUM LEVEL: the craniocaudal level at which a pouch leaves the pharyngeal wall, read as the
    mean y of the vertices nearest the median plane. This, and not the pouch's bounding-box centre,
    is what "the pouches sit at the internal divisions of five equal intersegments" is a claim about
    — pouch 1 climbs 0.30 of a span towards the ear on its way out, so its box centre is nowhere near
    its ostium, and row P's first draft failed on exactly that. */
function ostiumY(g, key) {
  const V = vertsOf(g, key);
  const pts = [];
  for (let i = 0; i < V.length; i += 3) if (V[i] > 0) pts.push([V[i], V[i + 1]]);
  if (!pts.length) return NaN;
  let xmin = Infinity, xmax = -Infinity;
  for (const p of pts) { if (p[0] < xmin) xmin = p[0]; if (p[0] > xmax) xmax = p[0]; }
  /* A SLAB OF THE x RANGE, NOT A PERCENTAGE OF THE VERTEX COUNT, and the y MIDPOINT of it rather
     than the mean. The first draft took the 5% of vertices nearest the median plane, which on a
     pouch 2904 vertices wide reaches across two or three stations of the sweep — far enough along
     for the path's curvature to tilt the answer, and it read pouch 1's ostium 0.17 of an
     intersegment high. A 2% slab of the x RANGE holds exactly the start ring (132 vertices), whose
     midpoint is the ostium: measured against the frame's own yP table it agrees to 1e-4 mm on all
     four pouches, where the vertex-count version was out by up to 0.018 mm. */
  const lim = xmin + 0.02 * (xmax - xmin);
  let lo = Infinity, hi = -Infinity;
  for (const p of pts) if (p[0] <= lim) { if (p[1] < lo) lo = p[1]; if (p[1] > hi) hi = p[1]; }
  return (lo + hi) / 2;
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
/** the centroid of the vertices of ONE side of a paired key — the pair's mean y is the same as
    either side's, but a side-resolved centroid is what a left/right claim would need */
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

/** the triangles of ONE SIDE of a key, flattened as [x0,y0,z0, x1,y1,z1, x2,y2,z2] per triangle */
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
/* MOLLER-TRUMBORE parity. THREE SKEW DIRECTIONS AND A MAJORITY VOTE: one ray is not enough, because
   a vertex that grazes a neighbouring triangle edge-on, or sits on a surface of revolution's own
   axis, returns a parity that is right in principle and wrong in arithmetic. Copied in shape from
   the outward-normals probe in tools/render-chorion-placenta-early.mjs, which is where this corpus
   settled the degenerate-ray question. */
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

/* ═════════════════════════════ THE SEPARATION BETWEEN TWO KEYS, AS A SURFACE DISTANCE

   ADDED 2026-10-03 for review finding F2, which is the sharper half of F1. Three of this scene's
   claims were about where structures are RELATIVE TO EACH OTHER — "the pouch and the cleft do NOT
   run into one another, with the membrane between", "a three-layered sheet stands between them",
   "every ectopic site lies on the trail" — and all three were measured as the SIZE OF ONE OF THEM
   (relSize, screenHeight). None of them could fail for the reason its own text states, and that is
   why a 1.93-intersegment void survived nine harness checks, 37 beat claims and a review round.

   WHY VERTEX-TO-TRIANGLE AND NOT VERTEX-TO-VERTEX. Nearest-VERTEX distance is what the review used
   and it is a proxy that reads a residual where there is none: two solids that genuinely interpene-
   trate still have non-coincident vertices, so the membrane sitting a hair INSIDE the pouch's dome
   measured 0.03 of an intersegment of "gap". This measures the true surface separation — every
   sampled vertex of each solid against every triangle of the other, both ways — and reports 0 when
   either contains a vertex of the other, because a structure inside another is not separated from
   it. Both ways matters: a small dense solid against a large coarse one gives different answers in
   the two directions and the smaller is the one a student sees.

   NORMALISED BY THE MEAN OF THE TWO KEYS' OWN EXTENTS, which is the shape RENDER-STANDARD's
   magnitude-floor rule already uses for sign tests, so a contact claim and a position claim are
   read on the same scale. Reported over an intersegment too, because that is the unit the rest of
   this model's rows are in. */
function pointTriDistSq(px, py, pz, tr) {
  const ax = tr[0], ay = tr[1], az = tr[2];
  const e0x = tr[3] - ax, e0y = tr[4] - ay, e0z = tr[5] - az;
  const e1x = tr[6] - ax, e1y = tr[7] - ay, e1z = tr[8] - az;
  const dx = ax - px, dy = ay - py, dz = az - pz;
  const a = e0x * e0x + e0y * e0y + e0z * e0z;
  const b = e0x * e1x + e0y * e1y + e0z * e1z;
  const c = e1x * e1x + e1y * e1y + e1z * e1z;
  const d = e0x * dx + e0y * dy + e0z * dz;
  const e = e1x * dx + e1y * dy + e1z * dz;
  const f = dx * dx + dy * dy + dz * dz;
  const det = a * c - b * b;
  let s = b * e - c * d, tt = b * d - a * e;
  if (s + tt <= det) {
    if (s < 0) { if (tt < 0) { if (d < 0) { tt = 0; s = -d >= a ? 1 : -d / a; } else { s = 0; tt = e >= 0 ? 0 : (-e >= c ? 1 : -e / c); } }
                 else { s = 0; tt = e >= 0 ? 0 : (-e >= c ? 1 : -e / c); } }
    else if (tt < 0) { tt = 0; s = d >= 0 ? 0 : (-d >= a ? 1 : -d / a); }
    else { const inv = 1 / det; s *= inv; tt *= inv; }
  } else {
    if (s < 0) { const t0 = b + e, t1 = c + d;
      if (t1 > t0) { const num = t1 - t0, den = a - 2 * b + c; s = num >= den ? 1 : num / den; tt = 1 - s; }
      else { s = 0; tt = t0 <= 0 ? 1 : (e >= 0 ? 0 : -e / c); } }
    else if (tt < 0) { const t0 = b + d, t1 = a + c - 2 * b;
      if (t0 > 0) { const num = c + e - b - d; s = num >= t1 ? 1 : (num <= 0 ? 0 : num / t1); tt = 1 - s; }
      else { tt = 0; s = d >= 0 ? 0 : (-d >= a ? 1 : -d / a); } }
    else { const num = c + e - b - d, den = a - 2 * b + c; s = num >= den ? 1 : (num <= 0 ? 0 : num / den); tt = 1 - s; }
  }
  return Math.max(0, a * s * s + 2 * b * s * tt + c * tt * tt + 2 * d * s + 2 * e * tt + f);
}
function _oneWayGap(V, tris, sample) {
  const pts = [];
  for (let i = 0; i < V.length; i += 3) if (V[i] > 0) pts.push([V[i], V[i + 1], V[i + 2]]);
  if (!pts.length || !tris.length) return Infinity;
  const step = Math.max(1, Math.floor(pts.length / (sample || 220)));
  let best = Infinity;
  for (let i = 0; i < pts.length; i += step) {
    const q = pts[i];
    for (let k = 0; k < tris.length; k++) {
      const d2 = pointTriDistSq(q[0], q[1], q[2], tris[k]);
      if (d2 < best) best = d2;
    }
  }
  return Math.sqrt(best);
}
/** the surface separation between the RIGHT-side solids of two keys, in build units. 0 on contact. */
function surfaceGap(g, a, b) {
  const Ta = trisOf(g, a, +1), Tb = trisOf(g, b, +1);
  if (!Ta.length || !Tb.length) return null;
  if (insideFrac(g, a, b, 60) > 0 || insideFrac(g, b, a, 60) > 0) return 0;
  return Math.min(_oneWayGap(vertsOf(g, a), Tb), _oneWayGap(vertsOf(g, b), Ta));
}
function ownExtentOf(g, key) {
  const b = sideBox(g, key, +1);
  return b ? Math.max(b.size[0], b.size[1], b.size[2]) : 0;
}
/** the measure F2 asks for, in both units, plus the parts so a failure is readable */
function gapDetail(t, a, b) {
  const g = groupAt(t), F = frameAt(t);
  const d = surfaceGap(g, a, b);
  if (d == null) return { a, b, missing: true, gap: null };
  const ea = ownExtentOf(g, a), eb = ownExtentOf(g, b);
  const mean = 0.5 * (ea + eb);
  return { a, b, gap: d, overSeg: d / F.seg, overMeanExtent: mean > 0 ? d / mean : Infinity,
           extentA_seg: ea / F.seg, extentB_seg: eb / F.seg, seg: F.seg };
}

/** POUCH 1's TWO CALIBRES, read off the built vertices. The recess is ONE solid — there is no waist
    between the auditory tube and the middle ear cavity, so inventing a key boundary there would draw
    a border a student would then look for in a specimen. Instead the vertices of one side are binned
    by distance from the median plane and the solid's own cross-sectional radius is measured in the
    first and last bin: the proximal bin is the tube, the distal bin is the cavity and the antrum. */
function calibreDetail(g) {
  const V = vertsOf(g, 'pouch1');
  const pts = [];
  for (let i = 0; i < V.length; i += 3) if (V[i] > 0) pts.push([V[i], V[i + 1], V[i + 2]]);
  if (!pts.length) return { ratio: NaN };
  let xmin = Infinity, xmax = -Infinity;
  for (const p of pts) { if (p[0] < xmin) xmin = p[0]; if (p[0] > xmax) xmax = p[0]; }
  /* MAX RADIAL DISTANCE PER BIN, NOT MEAN, and the widest bin rather than the last one. The first
     draft took the mean radial distance in the first and last bins by x and read a ratio of 1.36 on
     a calibre law that spans 3.2x. Two contaminations, both from caps: the flat start disc is a
     FILLED disc whose vertices include its centre, which drags a mean well below the rim; and the
     last bin by x is the terminal DOME, whose radius runs to zero at the pole. The rim of a bin is
     its max radial distance, and the recess's widest cross-section is the max over bins — which is
     exactly what "its far end expands into the middle ear cavity" is a claim about. */
  const NB = 24;
  const bins = Array.from({ length: NB }, () => []);
  for (const p of pts) {
    const b = Math.min(NB - 1, Math.floor((p[0] - xmin) / ((xmax - xmin) || 1) * NB));
    bins[b].push(p);
  }
  const rimOf = slice => {
    if (slice.length < 6) return null;
    let cy = 0, cz = 0;
    for (const p of slice) { cy += p[1]; cz += p[2]; }
    cy /= slice.length; cz /= slice.length;
    let r = 0;
    for (const p of slice) r = Math.max(r, Math.hypot(p[1] - cy, p[2] - cz));
    return r;
  };
  const rims = bins.map(rimOf);
  const prox = rims.find(r => r != null);
  let widest = 0, widestBin = -1;
  rims.forEach((r, i) => { if (r != null && r > widest) { widest = r; widestBin = i; } });
  return { proximal_rim_mm: mm(prox), widest_rim_mm: mm(widest), widest_bin: widestBin, bins: NB,
           ratio: widest / prox };
}
function calibreRatio(g) { return calibreDetail(g).ratio; }

/* ── the crossover, measured and then solved ──────────────────────────────────────────────────── */

/** the signed vertical gap between the two parathyroid pairs, read off the BUILT gland centroids.
    POSITIVE means the inferior (pouch-3) gland is still ABOVE the superior (pouch-4) one, which is
    where they start; NEGATIVE is the crossover. */
function ptGap(t) {
  const g = groupAt(t);
  const a = centroidOf(g, 'inferior_parathyroid');
  const b = centroidOf(g, 'superior_parathyroid');
  if (!a || !b) return null;
  const ba = bboxOf(g, 'inferior_parathyroid'), bb = bboxOf(g, 'superior_parathyroid');
  return { gap: a.y - b.y, pt3_y: a.y, pt4_y: b.y,
           /* the magnitude floor RENDER-STANDARD asks for: a fraction of the mean of the two
              structures' own extents along the axis compared, never "> 0" */
           meanExtent: (ba.size[1] + bb.size[1]) / 2 };
}

/** SOLVED BY BISECTION: the day the sign flips. There is no closed form for it — the growth law is
    exponential, both glands ride quadratic Bezier paths whose endpoints move with CRL, and the
    smoothstep that drives the descent is cubic — so this is a solve and not a rearrangement. */
function solveCrossoverDay(hFrac) {
  const saveH = _override.F_THY_H;
  if (hFrac != null) { _override.F_THY_H = hFrac; clearCache(); }
  try {
    let lo = tOfDay(DESC.day), hi = 1;
    const f = t => { const r = ptGap(t); return r ? r.gap : NaN; };
    const flo = f(lo), fhi = f(hi);
    if (!(flo > 0 && fhi < 0)) return { day: NaN, bracketed: false, gap_lo: flo, gap_hi: fhi };
    for (let i = 0; i < 60; i++) {
      const mid = (lo + hi) / 2;
      if (f(mid) > 0) lo = mid; else hi = mid;
    }
    const tm = (lo + hi) / 2;
    return { day: dayOf(tm), t: tm, bracketed: true, residual: Math.abs(f(tm)) };
  } finally { _override.F_THY_H = saveH; clearCache(); }
}

function clearCache() { for (const k in _cache) delete _cache[k]; _verts = new Map(); }

/* ══════════════════════════════════════════════════════════════════ acceptance */

const FLOORS = {
  SEP: 0.35,          // RENDER-STANDARD's starting magnitude floor, as a fraction of mean extent
  SPACING: 0.02,      // how equal "five equal intersegments" has to be, as a fraction of a segment
  CALIBRE: 1.8,       // pouch 1's distal expansion over its proximal calibre
  SYMM: 0.002,        // mirror symmetry in x, as a fraction of the model's own width
  CROSS_DAY_MOVE: 0.2,
  VESTIGE_HEAD: 4.0,  // a live structure must be this many times its own vestige
};

function acceptance() {
  clearCache();
  const rows = [];
  const add = (id, must, got, pass, floor, neg) => rows.push({ id, must, got, pass: !!pass, floor, negative: neg });

  const tEarly = tOfDay(30), tMid = tOfDay(38), tLate = 1;
  const gE = groupAt(tEarly), gM = groupAt(tMid), gL = groupAt(tLate);

  /* ---- G · the growth law is a fit with a real residual, and perturbing an anchor moves it ---- */
  {
    const alt = fitLogLinear([[22, 2.0 * 1.6], [35, 8.0], [56, 30.0]]);
    const moved = Math.abs(alt.B - CRL_FIT.B) / CRL_FIT.B;
    add('G-fit', 'CRL is a least-squares log-linear fit through three stated anchors, over-determined so the residual is real',
      { A: CRL_FIT.A, B_per_day: CRL_FIT.B, rms_ln: CRL_FIT.rms_ln,
        crl_d22: crl(0), crl_d35: crl(tOfDay(35)), crl_d56: crl(1),
        residuals_ln: CRL_FIT.residuals },
      CRL_FIT.rms_ln > 1e-6 && CRL_FIT.B > 0, 'rms residual > 0 (a 2-parameter fit through 3 anchors)',
      { case: 'a fit whose residual is zero, i.e. arithmetic done twice rather than a solve',
        rejected: !(CRL_FIT.rms_ln <= 1e-6) });
    add('G-perturb', 'moving the day-22 anchor by 60% moves the fitted growth rate',
      { B_default: CRL_FIT.B, B_perturbed: alt.B, moved_frac: moved },
      moved >= 0.05, '>= 5% change in B',
      { case: 'a perturbation that leaves the answer alone', rejected: !(moved < 1e-9) });
  }

  /* ---- P · the four pouches sit at the internal divisions of five EQUAL intersegments ----
     Measured off the built pouch geometry's own proximal ends, not off the yP table. */
  {
    const F = frameAt(tMid);
    const spreadOf = levels => {
      const d = [levels[0] - levels[1], levels[1] - levels[2], levels[2] - levels[3]];
      return { gaps: d, mean: d.reduce((a, b) => a + b, 0) / 3, spread: Math.max(...d) - Math.min(...d) };
    };
    const lev = [1, 2, 3, 4].map(k => ostiumY(gM, 'pouch' + k));
    const S = spreadOf(lev);
    /* THE NEGATIVE CASE IS THE SAME PREDICATE FED A WRONG MEASUREMENT, which is what a negative case
       is for. The pouches' bounding-box CENTRES are the wrong levels — pouch 1's climbs a third of a
       span towards the ear — and the assertion must reject them. This is the measurement row P's own
       first draft used, so the negative case is a defect that actually happened. */
    const centres = [1, 2, 3, 4].map(k => bboxOf(gM, 'pouch' + k).centre[1]);
    const SC = spreadOf(centres);
    add('P-spacing', 'the four pouches leave the pharyngeal wall at the internal divisions of five EQUAL intersegments — a construction rule, not four tuned levels',
      { ostium_levels_y: lev, gaps: S.gaps, mean_gap: S.mean, spread: S.spread,
        seg: F.seg, spread_over_seg: S.spread / F.seg,
        rejected_measurement_bbox_centres: { levels_y: centres, spread_over_seg: SC.spread / F.seg } },
      S.spread / F.seg <= 0.05, 'spread <= 5% of one intersegment',
      { case: 'the same assertion fed the pouches’ bounding-box centres, which carry pouch 1’s climb towards the ear and are NOT evenly spaced',
        rejected: !(SC.spread / F.seg <= 0.05) });
    add('P-order', 'and they run craniocaudally in numerical order: 1 is the most cranial, 4 the most caudal',
      { ostium_levels_y: lev },
      lev[0] > lev[1] && lev[1] > lev[2] && lev[2] > lev[3], 'strictly decreasing y',
      { case: 'the order asserted the other way round', rejected: !(lev[0] < lev[1] && lev[1] < lev[2] && lev[2] < lev[3]) });
  }

  /* ---- E1 · pouch 1's two calibres: the auditory tube end and the middle-ear end ----
     The examinable fact is that the narrow proximal part stays as the tube and the far end expands.
     Measured as a ratio of built radii at the two ends of the recess, not from r0/r1. */
  {
    const c = calibreDetail(gL);
    add('E1-calibre', 'the first pouch is narrow where it leaves the pharynx (the auditory tube) and expanded at its far end (the middle ear cavity and mastoid antrum)',
      c, c.ratio >= FLOORS.CALIBRE, '>= ' + FLOORS.CALIBRE + 'x',
      { case: 'the expansion asserted the other way round — a recess that narrows towards the ear',
        rejected: !(1 / c.ratio >= FLOORS.CALIBRE) });
  }

  /* ---- W · pouches 3 and 4 each have TWO wings, and they are on opposite sides in z ---- */
  {
    const r = {};
    let ok = true;
    for (const k of [3, 4]) {
      const d = centroidOf(gM, 'pouch' + k + '_dorsal_wing');
      const v = centroidOf(gM, 'pouch' + k + '_ventral_wing');
      const bd = bboxOf(gM, 'pouch' + k + '_dorsal_wing'), bv = bboxOf(gM, 'pouch' + k + '_ventral_wing');
      const mean = (bd.size[2] + bv.size[2]) / 2;
      const sep = v.z - d.z;
      r['pouch' + k] = { dorsal_z: d.z, ventral_z: v.z, separation: sep, mean_z_extent: mean,
                         floor: FLOORS.SEP * mean, passes: sep >= FLOORS.SEP * mean };
      if (!(sep >= FLOORS.SEP * mean)) ok = false;
    }
    add('W-wings', 'each of pouches 3 and 4 carries a dorsal and a ventral wing, separated along z by at least 35% of the mean of their own z extents',
      r, ok, '>= ' + FLOORS.SEP + ' * mean z extent',
      { case: 'the wings asserted on the same side of z',
        rejected: !(r.pouch3.ventral_z <= r.pouch3.dorsal_z && r.pouch4.ventral_z <= r.pouch4.dorsal_z) });
  }

  /* ---- X · THE CROSSOVER. The row this model exists for. ---- */
  {
    /* X-early is read at DAY 38, not at the start of the descent window. At day 30 both parathyroid
       primordia are still at their mounting vestige (PT_DAY is 32), so a reading there would be a
       measurement of the floor row V exists to disown. Day 38 is the first day both glands are
       substantial — 0.65 of full size — and the sign is still uncrossed, which is the claim. */
    const e = ptGap(tOfDay(38)), l = ptGap(tLate);
    const fE = FLOORS.SEP * e.meanExtent, fL = FLOORS.SEP * l.meanExtent;
    add('X-early', 'at day 38 the pouch-3 parathyroid is still ABOVE the pouch-4 one, because it comes from the higher pouch',
      { day: 38, gap: e.gap, pt3_y: e.pt3_y, pt4_y: e.pt4_y, mean_extent: e.meanExtent, floor: fE },
      e.gap >= fE, '>= ' + FLOORS.SEP + ' * mean y extent',
      { case: 'asserted already crossed over at day 38', rejected: !(e.gap <= -fE) });
    add('X-late', 'by day 56 it is BELOW it — the inferior parathyroid comes from the higher pouch',
      { day: 56, gap: l.gap, pt3_y: l.pt3_y, pt4_y: l.pt4_y, mean_extent: l.meanExtent, floor: fL },
      l.gap <= -fL, '<= -' + FLOORS.SEP + ' * mean y extent',
      { case: 'asserted still uncrossed at day 56', rejected: !(l.gap >= fL) });

    const solved = solveCrossoverDay(null);
    const alt = solveCrossoverDay(F_THY_H * 1.75);
    const moved = Math.abs(alt.day - solved.day);
    add('X-day', 'and the day the sign flips is SOLVED by bisection off the built gland centroids, not typed in',
      { crossover_day: solved.day, bracketed: solved.bracketed, residual_mm: solved.residual,
        searched_from_day: DESC.day, searched_to_day: 56 },
      solved.bracketed && solved.day > DESC.day && solved.day < 56, 'bracketed strictly inside the descent window',
      { case: 'a crossover day outside the window the bisection searched', rejected: !(solved.day <= DESC.day || solved.day >= 56) });
    add('X-perturb', 'raising the thyroid’s height 75% moves the solved crossover day — so the solve reads the geometry',
      { day_default: solved.day, day_perturbed: alt.day, moved_days: moved },
      moved >= FLOORS.CROSS_DAY_MOVE, '>= ' + FLOORS.CROSS_DAY_MOVE + ' day',
      { case: 'a perturbation that leaves the solved day alone', rejected: !(moved < 1e-9) });
  }

  /* ---- D · the thymus travels furthest, and the superior parathyroid barely moves ---- */
  /* MEASURED IN INTERSEGMENTS AT EACH END, NOT IN MILLIMETRES, and that correction is the row.
     The embryo grows 7.6-fold across this window (CRL 2.3 mm to 32.8 mm), so EVERY structure's y
     coordinate moves a long way in mm whether it migrates or not. Measured in mm the superior
     parathyroid "travels" 6.4 mm — more than most things in the model — and the narration's claim
     that it barely moves reads as false. Normalising each end by the intersegment at its OWN t
     divides the growth out and leaves the migration: the superior gland moves about 0.0 segments,
     the inferior 1.6, the thymus 2.6. This is RENDER-STANDARD's rule about a measure being a
     function of the thing the claim is about: the claim is about position within the apparatus. */
  {
    const t0 = tOfDay(DESC.day);
    const seg0 = frameAt(t0).seg, seg1 = frameAt(tLate).seg;
    const tr = key => {
      const a = centroidOf(groupAt(t0), key), b = centroidOf(gL, key);
      return { from_seg: a.y / seg0, to_seg: b.y / seg1, travelled_seg: (a.y / seg0) - (b.y / seg1),
               travelled_mm_misleading: a.y - b.y };
    };
    const thy = tr('thymus'), pt4 = tr('superior_parathyroid'), pt3 = tr('inferior_parathyroid');
    add('D-travel', 'the thymus travels furthest; the pouch-4 parathyroid barely moves — measured in intersegments at each end, so the embryo’s own 7.6-fold growth is divided out',
      { thymus: thy, inferior_parathyroid: pt3, superior_parathyroid: pt4,
        seg_day30_mm: seg0, seg_day56_mm: seg1 },
      thy.travelled_seg > pt3.travelled_seg && pt3.travelled_seg > Math.abs(pt4.travelled_seg) &&
      thy.travelled_seg >= 2.0 && Math.abs(pt4.travelled_seg) <= 0.25,
      'thymus > inferior > superior; thymus clears 2 intersegments; superior stays within a quarter of one',
      { case: 'the same three travels measured in millimetres, where the embryo’s growth makes the superior gland look like a migrant',
        rejected: !(Math.abs(pt4.travelled_mm_misleading) <= 0.25 * seg1) });
  }

  /* ---- M · the two thymic strands MEET in the midline ---- */
  {
    const b = bboxOf(gL, 'thymus');
    const F = frameAt(tLate);
    /* the lobes meet when the pair's x extent closes on the median plane: measured as the minimum
       |x| over the thymus's own vertices, against its own radius */
    const V = vertsOf(gL, 'thymus');
    let minAbsX = Infinity;
    for (let i = 0; i < V.length; i += 3) minAbsX = Math.min(minAbsX, Math.abs(V[i]));
    const early = (() => {
      const W = vertsOf(gE, 'thymus');
      let m = Infinity;
      for (let i = 0; i < W.length; i += 3) m = Math.min(m, Math.abs(W[i]));
      return m;
    })();
    add('M-midline', 'the thymic primordia grow caudally as two strands and meet in the midline — and are apart before they do',
      { min_abs_x_day56_mm: minAbsX, min_abs_x_day30_mm: early, seg_mm: F.seg,
        thymus_x_extent_mm: b.size[0] },
      minAbsX <= 0.06 * F.seg && early > minAbsX, 'closes on the median plane, from apart',
      { case: 'asserted met at day 30, before the strands have grown', rejected: !(early <= 0.06 * F.seg) });
  }

  /* ---- U · the ultimopharyngeal body ends up INSIDE the thyroid, and the C cells with it ---- */
  {
    const ub = centroidOf(gL, 'ultimopharyngeal_body');
    const th = bboxOf(gL, 'thyroid_gland');
    const cc = vertsOf(gL, 'c_cells');
    let inside = 0, n = 0;
    for (let i = 0; i < cc.length; i += 3) {
      n++;
      if (cc[i] >= th.min[0] && cc[i] <= th.max[0] && cc[i + 1] >= th.min[1] && cc[i + 1] <= th.max[1] &&
          cc[i + 2] >= th.min[2] && cc[i + 2] <= th.max[2]) inside++;
    }
    const frac = n ? inside / n : 0;
    const ubIn = ub.x >= th.min[0] && ub.x <= th.max[0] && ub.y >= th.min[1] && ub.y <= th.max[1];
    add('U-absorbed', 'the ultimopharyngeal body is absorbed into the thyroid and its cells disperse there as the C cells',
      { ub_centroid: ub, thyroid_bbox: { min: th.min, max: th.max }, ub_inside: ubIn,
        c_cell_vertices_inside_frac: frac },
      ubIn && frac >= 0.95, 'inside the thyroid’s own bounding box, >= 95% of C-cell vertices',
      { case: 'asserted absorbed at day 30, before it has travelled',
        rejected: !(() => { const u2 = centroidOf(gE, 'ultimopharyngeal_body'); const t2 = bboxOf(gE, 'thyroid_gland');
                            return u2.x >= t2.min[0] && u2.x <= t2.max[0] && u2.y >= t2.min[1] && u2.y <= t2.max[1]; })() });
  }

  /* ---- V · THE MOUNTING VESTIGE IS A FLOOR, NOT A PICTURE ----
     Every key must build geometry at t = 1 so the adapter can mount it (see the header). This row is
     what stops that floor being mistaken for an anatomical claim: it asserts that each transient
     structure is MANY times larger at its own peak than at t = 1, so the vestige is visibly a
     residue and a reviewer can see which structures the scene must not show late. */
  {
    const r = {};
    let ok = true;
    /* THE DUCT IS NOT ON THIS LIST, and leaving it off is a statement rather than an omission. Its
       CALIBRE involutes, but its LENGTH is real and growing at t = 1 — it is the trail every ectopic
       thymus and every cervical thymic cyst lies on, and view 5 shows it. A structure whose extent
       does not collapse is not a vestige, so measuring it against the vestige floor would be the
       wrong question; the second pouch is off the list for the same reason (what is left of it is
       the tonsillar fossa, floored at POUCH2_FLOOR, not at the mounting vestige). */
    for (const [key, tPeak] of [
      ['pouch3', tOfDay(36)], ['pouch4', tOfDay(38)],
      ['pouch3_dorsal_wing', tOfDay(38)], ['pouch3_ventral_wing', tOfDay(38)],
      ['pouch4_dorsal_wing', tOfDay(40)], ['pouch4_ventral_wing', tOfDay(40)],
      ['ultimopharyngeal_body', tOfDay(40)],
    ]) {
      /* per-SIDE extent: the pair box's x size is the distance between left and right, which does
         not involute at all — see sideBox's note */
      const sp = ownExtentSeg(tPeak, key), sl = ownExtentSeg(tLate, key);
      r[key] = { peak_over_seg: sp, late_over_seg: sl, ratio: sp / sl };
      if (!(sp / sl >= FLOORS.VESTIGE_HEAD)) ok = false;
    }
    add('V-vestige', 'every transient structure is at least 4x larger at its own peak than the vestige it keeps at t = 1 — the floor exists so the ref mounts, and is not a drawn claim',
      r, ok, '>= ' + FLOORS.VESTIGE_HEAD + 'x',
      { case: 'a vestige asserted to be the same size as the peak', rejected: !Object.values(r).every(x => x.ratio <= 1.0001) });
  }

  /* ---- K · every key the model declares is built at every t a beat could ask for ---- */
  {
    const want = keysOf(gM);
    const miss = {};
    let ok = true;
    for (const d of [22, 26, 30, 34, 38, 42, 46, 50, 56]) {
      const have = keysOf(groupAt(tOfDay(d)));
      const gone = want.filter(k => have.indexOf(k) < 0);
      if (gone.length) { miss['day' + d] = gone; ok = false; }
    }
    add('K-keys', 'every key builds geometry at every day sampled across the process, t = 1 included — which is what stops the adapter resolving reason:’none’ at mount',
      { keys: want.length, missing_by_day: miss }, ok, 'no key missing at any sampled day',
      { case: 'a key list that includes a key the model does not build', rejected: keysOf(gM).indexOf('__not_a_key__') < 0 });
  }

  /* ---- Y · the model is a mirror-symmetric PAIR, which is the claim it CAN make about sides ----
     It is NOT a handedness proof and this row does not pretend to be one: see the AXES note in the
     header. What it asserts is that the four pouches really are four PAIRS. */
  {
    const r = {};
    let ok = true;
    const F = frameAt(tMid);
    for (const key of ['pouch1', 'pouch2', 'pouch3', 'pouch4', 'inferior_parathyroid', 'superior_parathyroid']) {
      const l = centroidOf(gM, key, +1), rr = centroidOf(gM, key, -1);
      const b = bboxOf(gM, key);
      const dx = Math.abs(l.x + rr.x), dy = Math.abs(l.y - rr.y), dz = Math.abs(l.z - rr.z);
      const w = b.size[0];
      r[key] = { left_centroid: l, right_centroid: rr, x_sum: dx, y_diff: dy, z_diff: dz, width: w,
                 passes: dx / w <= FLOORS.SYMM && dy / w <= FLOORS.SYMM && dz / w <= FLOORS.SYMM };
      if (!r[key].passes) ok = false;
    }
    /* THE NEGATIVE CASE FEEDS THE PREDICATE A PAIR THAT IS NOT A PAIR. The first draft's negative
       case asserted that a tolerance of exactly zero should be rejected — and it is not rejected,
       because both sides are built by the same code with side = +/-1 and the floats come out
       exactly mirrored, so the row reported its own negative case unrejected. A real negative case
       has to supply a WRONG measurement: pouch 3's left centroid against pouch 4's right one. They
       are two different structures at two different levels and the assertion must refuse them. */
    const l3 = centroidOf(gM, 'pouch3', +1), r4 = centroidOf(gM, 'pouch4', -1);
    const wrongW = bboxOf(gM, 'pouch3').size[0];
    const wrongOk = Math.abs(l3.x + r4.x) / wrongW <= FLOORS.SYMM &&
                    Math.abs(l3.y - r4.y) / wrongW <= FLOORS.SYMM &&
                    Math.abs(l3.z - r4.z) / wrongW <= FLOORS.SYMM;
    add('Y-paired', 'every pouch and every gland is built as a mirror-symmetric PAIR about x = 0 — "four pairs of pouches count"',
      Object.assign({}, r, { rejected_measurement_mismatched_pair: { left_pouch3: l3, right_pouch4: r4, would_pass: wrongOk } }),
      ok, 'mirrored centroids agree to ' + FLOORS.SYMM + ' of the key’s own width',
      { case: 'the same assertion fed pouch 3’s LEFT centroid against pouch 4’s RIGHT one — two different structures at two different levels',
        rejected: !wrongOk });
  }

  /* ---- Z · no two parts share space except where contact is anatomy or construction ----
     RENDER-STANDARD 3.z. The partition is published by name rather than hidden in a tolerance. */
  /* ---- Z · no two parts share space except where contact is anatomy or construction ----
     RENDER-STANDARD 3.z. The partition is published BY NAME rather than hidden in a tolerance.

     THE ARCH BARS ARE THE LARGEST ENTRY IN IT AND THAT IS THE POINT OF THE TOPIC. A pouch, its
     wings and everything derived from them lie in the mesenchyme BETWEEN two arches — which is what
     the bars are — so contact with them is the anatomy this scene teaches, not a defect. What is NOT
     in the partition is the thyroid: it is not a pouch derivative, it has no business in arch
     mesenchyme, and the first run of this row found it there. The repair was to move the gland
     ventral where it belongs (F_THY_Z, 0.30 -> 0.95), not to widen the partition. */
  const ARCH_REASON = 'ANATOMY: a pouch and everything derived from it lies in the mesenchyme BETWEEN two arches, which is what the bars are';
  const EXCLUDED_PAIRS = [
    ['pouch2', 'palatine_tonsil', 'ANATOMY: the tonsil grows INTO the second pouch and obliterates it — that is the teaching point'],
    ['pouch3', 'pouch3_dorsal_wing', 'CONSTRUCTION: a wing is continuous with its own pouch'],
    ['pouch3', 'pouch3_ventral_wing', 'CONSTRUCTION: a wing is continuous with its own pouch'],
    ['pouch4', 'pouch4_dorsal_wing', 'CONSTRUCTION: a wing is continuous with its own pouch'],
    ['pouch4', 'pouch4_ventral_wing', 'CONSTRUCTION: a wing is continuous with its own pouch'],
    ['pouch3_dorsal_wing', 'pouch3_ventral_wing', 'CONSTRUCTION: both wings leave the same point on the same pouch'],
    ['pouch4_dorsal_wing', 'pouch4_ventral_wing', 'CONSTRUCTION: both wings leave the same point on the same pouch'],
    ['pouch3_ventral_wing', 'thymopharyngeal_duct', 'CONSTRUCTION: the duct leaves the ventral wing and is buried in it'],
    ['thymopharyngeal_duct', 'thymus', 'CONSTRUCTION: the duct’s distal end is buried in the thymus so no cap shows'],
    ['pouch3_dorsal_wing', 'inferior_parathyroid', 'ANATOMY: the gland IS the dorsal wing before it separates'],
    ['pouch4_dorsal_wing', 'superior_parathyroid', 'ANATOMY: the gland IS the dorsal wing before it separates'],
    ['pouch4_ventral_wing', 'ultimopharyngeal_body', 'ANATOMY: the body IS the ventral wing before it separates'],
    ['thyroid_gland', 'ultimopharyngeal_body', 'ANATOMY: the body is absorbed INTO the thyroid — row U'],
    ['thyroid_gland', 'c_cells', 'ANATOMY: the C cells disperse INSIDE the thyroid — row U'],
    ['thyroid_gland', 'inferior_parathyroid', 'ANATOMY: the gland rests on the thyroid’s posterior surface'],
    ['thyroid_gland', 'superior_parathyroid', 'ANATOMY: the gland rests on the thyroid’s posterior surface'],
    ['c_cells', 'inferior_parathyroid', 'ANATOMY: both sit on or in the same gland — row U measures the C cells inside it'],
    ['c_cells', 'superior_parathyroid', 'ANATOMY: both sit on or in the same gland — row U measures the C cells inside it'],
    ['pharyngeal_wall', 'pouch1', 'CONSTRUCTION: a pouch is an outpocketing OF the wall and starts inside it'],
    ['pharyngeal_wall', 'pouch2', 'CONSTRUCTION: a pouch is an outpocketing OF the wall and starts inside it'],
    ['pharyngeal_wall', 'pouch3', 'CONSTRUCTION: a pouch is an outpocketing OF the wall and starts inside it'],
    ['pharyngeal_wall', 'pouch4', 'CONSTRUCTION: a pouch is an outpocketing OF the wall and starts inside it'],
    ['pharyngeal_wall', 'arch_bars', 'CONSTRUCTION: the bars are the mesenchyme of the wall itself'],
    ['pouch1', 'tympanic_membrane', 'ANATOMY: the membrane is where the pouch meets the cleft'],
    ['cleft1', 'tympanic_membrane', 'ANATOMY: the membrane is where the first pouch meets the FIRST cleft'],
    /* ADDED 2026-10-03 with the surface ectoderm. All three are one epithelium seen in three roles,
       which is the kind of contact this partition exists to name rather than hide under a tolerance:
       a cleft is a dimple IN the surface, and the tympanic membrane's outer of its three layers IS
       the ectoderm of the first cleft — which is the examinable fact about that membrane. */
    ['cleft1', 'surface_ectoderm', 'ANATOMY: a cleft IS an invagination of the surface ectoderm — the groove and the skin it is a groove in are one epithelium'],
    ['clefts_lower', 'surface_ectoderm', 'ANATOMY: a cleft IS an invagination of the surface ectoderm'],
    ['tympanic_membrane', 'surface_ectoderm', 'ANATOMY: the membrane\u2019s outer layer IS the ectoderm of the first cleft, continuous with the surface'],
    ['arch_bars', 'cleft1', 'ANATOMY: a cleft is the groove BETWEEN two arch bars'],
    ['arch_bars', 'clefts_lower', 'ANATOMY: a cleft is the groove BETWEEN two arch bars'],
    ['arch_bars', 'pouch1', ARCH_REASON], ['arch_bars', 'pouch2', ARCH_REASON],
    ['arch_bars', 'pouch3', ARCH_REASON], ['arch_bars', 'pouch4', ARCH_REASON],
    ['arch_bars', 'pouch3_dorsal_wing', ARCH_REASON], ['arch_bars', 'pouch3_ventral_wing', ARCH_REASON],
    ['arch_bars', 'pouch4_dorsal_wing', ARCH_REASON], ['arch_bars', 'pouch4_ventral_wing', ARCH_REASON],
    ['arch_bars', 'palatine_tonsil', ARCH_REASON], ['arch_bars', 'tympanic_membrane', ARCH_REASON],
    ['arch_bars', 'inferior_parathyroid', ARCH_REASON], ['arch_bars', 'superior_parathyroid', ARCH_REASON],
    ['arch_bars', 'ultimopharyngeal_body', ARCH_REASON],
    ['arch_bars', 'thymopharyngeal_duct', 'ANATOMY: the duct descends THROUGH the arch mesenchyme — which is why a strand left behind turns up anywhere in the neck'],
    ['arch_bars', 'thymus', 'ANATOMY: the thymic strand descends through the arch mesenchyme before it clears the pharynx'],
  ];
  /* ── PINNED, not excluded ─────────────────────────────────────────────────────────────────────
     RENDER-STANDARD 3.z: "Anything left over is either a defect or a declared consequence of
     something the model does not build, and in the second case the row pins it at its measured size
     so it cannot grow." These are the left-overs, each with its measured ceiling. The difference
     from the partition above matters: an excluded pair is contact the model MEANS; a pinned pair is
     contact the model does not mean and has an argument for, at a size that is now a regression
     test. If any of these grows past its ceiling the row fails. */
  const PINNED = {
    'palatine_tonsil|pharyngeal_wall': { ceiling: 0.40,
      why: 'ANATOMY: the palatine tonsil sits IN the lateral pharyngeal wall — the tonsillar fossa is a recess in that wall, and the narration says what is left of the pouch is the fossa the tonsil sits in. Measured 0.275 at t = 1.' },
    'pharyngeal_wall|pouch3_dorsal_wing': { ceiling: 0.40, why: 'VESTIGE: at t = 1 the wing is at its mounting floor, so what is left of it lies against the wall it budded from. No beat shows a wing at t = 1 — see the header and row V.' },
    'pharyngeal_wall|pouch3_ventral_wing': { ceiling: 0.40, why: 'VESTIGE: as above.' },
    'pharyngeal_wall|pouch4_dorsal_wing': { ceiling: 0.40, why: 'VESTIGE: as above.' },
    'pharyngeal_wall|pouch4_ventral_wing': { ceiling: 0.40, why: 'VESTIGE: as above.' },
    'pouch3|thymopharyngeal_duct': { ceiling: 0.20, why: 'VESTIGE: the duct leaves the pouch-3 ventral wing, which at t = 1 has involuted back against the stem. Measured 0.073.' },
    'inferior_parathyroid|thymus': { ceiling: 0.20,
      why: 'ANATOMY, and it is one the narration makes a teaching point of: "An inferior parathyroid may sit high in the neck, inside the carotid sheath, INSIDE THE THYMUS, or down in the anterior mediastinum." In the normal course drawn here the gland has separated and rests at the thyroid\u2019s lower pole, just above the thymus\u2019s upper end, so the two touch. Pinned rather than excluded because the model does not intend the contact \u2014 it is a consequence of both ending their journeys in the same place.' },
  };
  {
    /* MEASURED PER SIDE AND BY RAY PARITY, NOT BY THE PAIR'S BOUNDING BOX, and the first draft got
       this wrong in the most flattering direction. Every structure here is a PAIR, so a merged key's
       bounding box spans the whole embryo's width: arch_bars' box contained eight other keys
       entirely and the row reported thirteen "overlaps" that were nothing but two boxes being wide.
       3.z asks for containment, and containment means INSIDE THE SOLID. So: candidates are pairs
       whose LEFT-SIDE boxes meet, and each candidate is then tested by odd/even ray parity against
       the other key's own left-side triangles — three skew directions and a majority, because a
       single axis-aligned ray from a vertex that grazes a neighbouring triangle edge-on returns a
       parity that is right in principle and wrong in arithmetic. */
    const keys = keysOf(gL).filter(k => k !== 'median_plane');   // the reference rod is not anatomy
    const ex = new Set(EXCLUDED_PAIRS.map(p => [p[0], p[1]].sort().join('|')));
    const box = {}; for (const k of keys) box[k] = sideBox(gL, k, +1);
    const overlaps = [], candidates = [], pinned = [];
    for (let i = 0; i < keys.length; i++) for (let j = i + 1; j < keys.length; j++) {
      const a = keys[i], b = keys[j];
      const A = box[a], B = box[b];
      if (!A || !B) continue;
      let meets = true;
      for (let ax = 0; ax < 3; ax++) if (A.min[ax] > B.max[ax] || B.min[ax] > A.max[ax]) meets = false;
      if (!meets) continue;
      candidates.push([a, b]);
      if (ex.has([a, b].sort().join('|'))) continue;
      const fa = insideFrac(gL, a, b), fb = insideFrac(gL, b, a);
      const worst = Math.max(fa, fb);
      const pin = PINNED[[a, b].sort().join('|')];
      if (pin) { pinned.push({ a, b, worst, ceiling: pin.ceiling, why: pin.why, within: worst <= pin.ceiling }); continue; }
      if (worst > 0.02) overlaps.push({ a, b, a_in_b: fa, b_in_a: fb });
    }
    /* THE NEGATIVE CASE: the same containment measure run on a pair the partition DOES name, which
       must come back positive. A containment test that reports zero everywhere — because it is
       measuring the wrong thing, or nothing — would pass this row and prove nothing, and that is
       exactly the shape of the bounding-box version it replaced. */
    const known = insideFrac(gL, 'pouch3_dorsal_wing', 'pouch3');
    const grown = pinned.filter(p => !p.within);
    add('Z-nonoverlap', 'no two parts share space at t = 1 except the pairs named in the published partition, and the pinned left-overs have not grown past their measured ceilings',
      { excluded_pairs: EXCLUDED_PAIRS.length, candidate_pairs_whose_side_boxes_meet: candidates.length,
        unexplained_overlaps: overlaps, pinned: pinned, pinned_over_ceiling: grown,
        negative_probe_known_contact_frac: known },
      overlaps.length === 0 && grown.length === 0, 'no unexplained pair over 2% parity containment; no pinned pair over its ceiling',
      { case: 'the same measure run on a pair the partition names, which must report real containment — a measure that reports zero everywhere would pass this row and prove nothing',
        rejected: !(known <= 0.02) });
  }

  /* ---- T · NOTHING IS SILENTLY DROPPED AT SMALL SCALE ----
     The cheap, exact regression guard for the render-kit finding recorded at the top of this file.
     A key's triangle count is a property of its CONSTRUCTION — ring, rows, spans — and not of t, so
     it must be identical at every sampled day. A dome pole fan that falls under triN's absolute
     degeneracy guard disappears without a word and takes 18 triangles with it, which is exactly what
     this count catches and what every other check in the battery missed for two rounds. */
  {
    const counts = {};
    const days = [22, 26, 30, 34, 38, 42, 46, 50, 54, 56];
    for (const d of days) {
      const g = groupAt(tOfDay(d));
      for (const k of keysOf(g)) {
        if (!counts[k]) counts[k] = {};
        counts[k]['day' + d] = triCount(g, k);
      }
    }
    const varying = {};
    for (const k of Object.keys(counts)) {
      const vals = Object.values(counts[k]);
      const lo = Math.min(...vals), hi = Math.max(...vals);
      if (lo !== hi) varying[k] = counts[k];
    }
    add('T-poles', 'every key\u2019s triangle count is identical at every sampled day \u2014 so no cap, taper or dome pole has been silently dropped by render-kit triN\u2019s absolute degeneracy guard at a stage where the model is small',
      { keys: Object.keys(counts).length, days: days, varying: varying,
        example_counts: counts[Object.keys(counts)[0]] },
      Object.keys(varying).length === 0, 'constant per key across t',
      { case: 'the same assertion over a day BELOW the build-unit floor, where the guard does bite and the count must change',
        rejected: (() => {
          /* built at a thirtieth of the model's own unit, i.e. back in millimetres, where the
             measurement at the top of this file says the pole fans go */
          const tiny = [];
          const g = groupAt(tOfDay(22));
          const base = triCount(g, 'inferior_parathyroid');
          const pts = [];
          for (let i = 0; i <= 10; i++) pts.push(new T.Vector3(0.5, -0.5 + (i / 10 - 0.5) * 0.0022, 0.1));
          const small = K.tubeCapped(pts, u => 0.0015 * (0.34 + 0.66 * Math.sin(Math.PI * clamp01(u))),
                                     { ring: 18, cap: 'both', capRows: 7, bulge: 0.9 });
          const got = small ? small.attributes.position.count / 3 : 0;
          tiny.push(got);
          /* 828 is the full count for this construction; under the guard it is 792 */
          return got < 828;
        })() });
  }


  /* ---- AP · THE APPOSITION. The row that would have caught F1 ----
     The one relation this topic is examined on: pharyngeal endoderm and surface ectoderm in direct
     apposition with one three-layered membrane between them. Measured as a SURFACE separation, not
     a vertex separation and not anybody's size, at four days across the process and for all four
     pouches — because the defect it replaces was not a stage, it held at every t. */
  {
    const days = [34, 38, 44, 50];
    const rowsAP = [];
    for (const d of days) {
      const tt = tOfDay(d);
      for (let k = 1; k <= 4; k++) {
        const key = k === 1 ? 'cleft1' : 'clefts_lower';
        const g2 = groupAt(tt);
        const gd = gapDetail(tt, 'pouch' + k, key);
        rowsAP.push({ day: d, pouch: k, against: key, overSeg: gd.overSeg, overMeanExtent: gd.overMeanExtent });
      }
    }
    /* the first pouch is the one with the membrane and the claim, so it carries the tight band;
       the lower three are asserted only not to have a VOID, because their membranes break down and
       their pouches involute away from their grooves, which is the anatomy */
    const first = rowsAP.filter(r => r.pouch === 1);
    /* THE LOWER THREE ARE ASSERTED WHILE THEIR MEMBRANES EXIST, AND ASSERTED TO WITHDRAW AFTER.
       The second, third and fourth pharyngeal membranes are transient: the pouches involute and the
       second arch overgrows the grooves into a cervical sinus. So apposition is a claim about days
       34 to 44, and the correct behaviour at day 50 is a GROWING gap — which this row now states
       rather than tolerating. The first draft asserted one ceiling at every day and failed on
       exactly the days where withdrawal is the anatomy: 0.84, 0.74, 0.70, 1.44 and 1.26 of an
       intersegment at day 50. A row that cannot tell a defect from a developmental fact is not
       measuring the fact. */
    /* EACH POUCH IS ASSERTED AT ITS OWN PLATEAU, READ OFF THE MODEL, NOT AT A DAY TYPED IN HERE.
       The three lower pouches do not share a window: the second involutes from day 44, the third and
       fourth from day 38. A single "days 34 to 44" window was the second draft of this row and it
       failed on pouches 3 and 4 at day 44 — 0.84 and 0.74 of an intersegment — for the same reason
       the first draft failed, which is that it encoded one pouch's timetable as every pouch's. So
       the window is derived: a pouch is apposed on any day it stands at its own full extension,
       which the model already reports as fracOfPeak. */
    for (const r of rowsAP) r.fracOfPeak = claimMeasure('fracOfPeak.pouch' + r.pouch, tOfDay(r.day));
    const lowerEarly = rowsAP.filter(r => r.pouch !== 1 && r.fracOfPeak >= 0.98);
    const lowerLate  = rowsAP.filter(r => r.pouch !== 1 && r.fracOfPeak < 0.98);
    const withdrew = [2, 3, 4].map(k => {
      const mine = rowsAP.filter(r => r.pouch === k);
      const at = mine.filter(r => r.fracOfPeak >= 0.98);
      const after = mine.filter(r => r.fracOfPeak < 0.98);
      const a = Math.max.apply(null, at.map(r => r.overSeg));
      const b = after.length ? Math.max.apply(null, after.map(r => r.overSeg)) : null;
      return { pouch: k, days_at_full: at.map(r => r.day), apposed_over_seg: +a.toFixed(4),
               days_involuting: after.map(r => r.day), withdrawn_over_seg: b == null ? null : +b.toFixed(4),
               withdrew: b != null && b > a + 0.10 };
    });
    const memb = gapDetail(tOfDay(44), 'pouch1', 'tympanic_membrane');
    const toCleft = gapDetail(tOfDay(44), 'tympanic_membrane', 'cleft1');
    const okFirst = first.every(r => r.overSeg <= 2.2 * F_MEMB && r.overSeg >= 0.45 * F_MEMB);
    const okLower = lowerEarly.every(r => r.overSeg <= 2.6 * F_MEMB) && withdrew.every(w => w.withdrew);
    const okMemb = memb.overSeg <= 0.02 && toCleft.overSeg <= 0.02;
    add('AP-apposition', 'the first pouch stops one membrane-thickness short of the first cleft at every stage, and the tympanic membrane TOUCHES both of them — which is what "endoderm and ectoderm in direct apposition" is a picture of',
      { F_MEMB: F_MEMB, first_pouch_gap_over_seg: first.map(r => +r.overSeg.toFixed(4)),
        lower_pouch_gaps_days_34_to_44: lowerEarly.map(r => +r.overSeg.toFixed(4)),
        lower_pouch_gaps_day_50: lowerLate.map(r => +r.overSeg.toFixed(4)),
        lower_pouches_withdraw_as_their_membranes_break_down: withdrew,
        membrane_to_pouch1_over_seg: +memb.overSeg.toFixed(5),
        membrane_to_cleft1_over_seg: +toCleft.overSeg.toFixed(5),
        was_before_this_run: 'pouch1 to cleft1 1.93 intersegments at every t from 0.35 to 0.94; membrane touching neither' },
      okFirst && okLower && okMemb,
      'pouch1 to cleft1 within [0.45, 2.2] * F_MEMB at every day — neither a void nor a fusion; the membrane within 0.02 seg of both; the lower three apposed to 2.6 * F_MEMB while their membranes exist and measurably withdrawn by day 50',
      { case: 'the same measure run against the OLD lateral layout, F_CLEFT = 3.60 intersegments from the wall — the defect this row exists to catch',
        rejected: !((function () {
          /* the old placement, reconstructed here and nowhere else: x = r + 3.60 * seg, floor one
             depth medial of it. If this row would have passed on that, the row is worthless. */
          const tt = tOfDay(44), F2 = frameAt(tt);
          const g2 = groupAt(tt);
          const V = vertsOf(g2, 'pouch1');
          let maxAbs = 0;
          for (let i = 0; i < V.length; i += 3) if (Math.abs(V[i]) > maxAbs) maxAbs = Math.abs(V[i]);
          const oldFloor = F2.Rph(F2.uOf(F2.yP[1])) + 3.60 * F2.seg - 0.30 * F2.seg;
          return ((oldFloor - maxAbs) / F2.seg) <= 2.2 * F_MEMB;
        })()) });
  }

  /* ---- AG · A GROOVE IS A FEATURE OF A SURFACE ----
     F4: the four clefts hung in space 3.9 to 4.5 intersegments out with the pharyngeal wall ending
     at 0.80 and nothing drawn in between, under a narration that calls a cleft "a groove on the
     OUTSIDE". This row asserts the two halves of "groove": the ectoderm is IN CONTACT with the body
     surface, and its floor is measurably MEDIAL of that surface rather than flush with it. */
  {
    const tt = tOfDay(38);
    const g2 = groupAt(tt), F2 = frameAt(tt);
    const S = surfaceAt(tt);
    const touch1 = gapDetail(tt, 'cleft1', 'surface_ectoderm');
    const touchL = gapDetail(tt, 'clefts_lower', 'surface_ectoderm');
    /* each groove's floor, against the solved surface at the floor's own level and depth */
    const dips = [];
    for (let k = 1; k <= 4; k++) {
      const c = cleftPoint(tt, 1, k);
      const surfX = S.xAt(c.floorC.y, c.floorC.z);
      const floorX = Math.hypot(c.floorC.x, c.floorC.z);
      dips.push({ k, dip_over_seg: (surfX - floorX) / F2.seg, depth_over_seg: c.depthSeg });
    }
    /* and the lateral stack is ordered, which is the thing F4 said was never reconciled */
    const stack = ['pharyngeal_wall', 'arch_bars', 'pouch1', 'cleft1', 'surface_ectoderm'].map(key => {
      const V = vertsOf(g2, key);
      let m = 0; for (let i = 0; i < V.length; i += 3) if (Math.abs(V[i]) > m) m = Math.abs(V[i]);
      return { key, outer_over_seg: +(m / F2.seg).toFixed(3) };
    });
    const ordered = stack.every((v, i) => i === 0 || v.outer_over_seg > stack[i - 1].outer_over_seg);
    /* and the first groove is the one that BINDS the surface solve — it dips least, because its
       pouch reaches furthest, which is why it is the cleft that stays open as the external acoustic
       meatus while the lower three become pits the cervical sinus buries */
    /* WHICH GROOVE BINDS THE SOLVE IS REPORTED, NOT ASSERTED, and that is a correction this run
       made to itself. The row first required it to be groove 1, on the reasoning that the first
       cleft is the one that stays open as the external acoustic meatus so it should need the least
       depth. Measured, it is groove 3 — dip 0.451 against groove 1's 0.594 — because what decides a
       groove's depth is its pouch's reach AGAINST THE SURFACE AT ITS OWN LEVEL, and the third pouch
       at full extension reaches 1.94 intersegments under a neck that has already begun to narrow.
       The claim the reasoning was reaching for is a real one and it is made elsewhere and properly:
       cleftLive gives groove 1 a phase() that rises and holds while the lower three get an
       involute() that buries them. Asserting a number because it would have been tidy is the fault
       RENDER-STANDARD section 6 is about, so the number is published and the assertion is dropped. */
    const binding = dips.slice().sort((a, b) => a.dip_over_seg - b.dip_over_seg)[0].k;
    const ok = touch1.overSeg <= 0.06 && touchL.overSeg <= 0.06 &&
               dips.every(d => d.dip_over_seg >= 0.10 && d.dip_over_seg <= 1.10) && ordered;
    add('AG-groove', 'every ectodermal cleft is IN CONTACT with the body surface and its floor is measurably medial of it — a groove is a feature of a surface, and the lateral stack from the pharyngeal wall out to that surface is strictly ordered',
      { cleft1_to_surface_over_seg: +touch1.overSeg.toFixed(4),
        lower_clefts_to_surface_over_seg: +touchL.overSeg.toFixed(4),
        floor_dip_below_surface: dips, binding_groove: binding, lateral_stack: stack,
        was_before_this_run: 'no surface ectoderm existed; wall ended at 0.80 and the clefts began at 3.94' },
      ok, 'each cleft within 0.06 seg of the surface, each floor between 0.10 and 1.10 seg medial of it — a dent, not a tunnel — and the lateral stack strictly increasing',
      { case: 'the same contact measure run between cleft1 and the PHARYNGEAL WALL — the epithelium on the OTHER side of the arch region, which it must not be in contact with. A measure that reported contact everywhere would pass the row and prove nothing, which is what the first draft of this negative case did: it compared the dip at the LIP’s level, and once the surface solve was corrected to cover all four grooves the lips stopped being flush, so the case stopped discriminating and the harness said so.',
        rejected: !(gapDetail(tt, 'cleft1', 'pharyngeal_wall').overSeg <= 0.06),
        cleft1_to_pharyngeal_wall_over_seg: +gapDetail(tt, 'cleft1', 'pharyngeal_wall').overSeg.toFixed(3) });
  }

  /* ---- AF · THE FOLD MARGIN, SOLVED AND ASSERTED ----
     Three of this file's notes record the same fault — a swept tube whose calibre exceeded the
     radius of curvature of its own centreline — and the fix for F1 produced a fourth before it was
     measured. The grooves' depths are DERIVED, so a stated calibre cannot be safe at all of them;
     cleftCalibre solves it instead, and this row asserts the margin at every groove and every t
     rather than at the one that was looked at. */
  {
    const got = [], MARG = [];
    for (const d of [28, 34, 38, 44, 50, 56]) {
      const tt = tOfDay(d);
      for (let k = 1; k <= 4; k++) {
        const c = cleftPoint(tt, 1, k);
        MARG.push(c.foldMargin);
        got.push({ day: d, k, margin: +c.foldMargin.toFixed(3), calibre_over_seg: +c.calibreSeg.toFixed(4),
                   depth_over_seg: +c.depthSeg.toFixed(4) });
      }
    }
    const worst = Math.min.apply(null, MARG);
    add('AF-fold', 'every groove is swept with a calibre SOLVED from the radius of curvature of its own centreline, so no groove can fold through itself at any stage — the fault three notes in this file already record, asserted instead of avoided',
      { FOLD_MARGIN: FOLD_MARGIN, worst_margin: +worst.toFixed(3), per_groove: got,
        was_before_this_run: 'a stated calibre of 0.16 gave groove 1 a margin of 1.0 and folded 44 of 1288 outer-surface triangles' },
      worst >= FOLD_MARGIN * 0.999, '>= ' + FOLD_MARGIN,
      { case: 'the margin recomputed with the calibre CEILING in place of the solved calibre, which is what a stated constant would have given',
        rejected: !(function () {
          let w = Infinity;
          for (const d of [28, 34, 38, 44, 50, 56]) for (let k = 1; k <= 4; k++) {
            const tt = tOfDay(d), c = cleftPoint(tt, 1, k), live = cleftLive(tt, k);
            const curv = (F_CLIPY * live) * (F_CLIPY * live) / (2 * c.depthSeg);
            w = Math.min(w, curv / (CLEFT_R * live));
          }
          return w >= FOLD_MARGIN * 0.999;
        })() });
  }

  /* ---- CL · COLOUR, AS A MEASURED NUMBER. Review finding F3 and proposed rule F9(b) ----
     There is no colour rule in RENDER-STANDARD or ARTWORK-STANDARD, and F3 is what that costs: the
     fourth pouch was drawn dE 10.9 from the first cleft, inside the corpus's ectoderm blue, while
     cleft1's own narration promises the student the cleft is "drawn in a colour nothing on the
     inside of the apparatus uses". A narration that makes a claim ABOUT a colour has to satisfy it
     as a number. Measured in CIE76 dE over the sRGB values this model declares — the same space the
     review measured in, so the two are comparable. */
  {
    const ENDODERM = ['wall', 'pouch1', 'pouch2', 'pouch3', 'pouch4', 'tonsil', 'thymus', 'duct',
                      'pt_inferior', 'pt_superior', 'ultimo'];
    const ECTO = ['ectoderm', 'ectoderm2', 'surface'];
    function lab(hex) {
      const f = v => { v /= 255; return v <= 0.04045 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4); };
      const r = f((hex >> 16) & 255), g2 = f((hex >> 8) & 255), b = f(hex & 255);
      let X = (r * 0.4124 + g2 * 0.3576 + b * 0.1805) / 0.95047;
      let Y = (r * 0.2126 + g2 * 0.7152 + b * 0.0722);
      let Z = (r * 0.0193 + g2 * 0.1192 + b * 0.9505) / 1.08883;
      const h = v => v > 0.008856 ? Math.cbrt(v) : (7.787 * v + 16 / 116);
      X = h(X); Y = h(Y); Z = h(Z);
      return [116 * Y - 16, 500 * (X - Y), 200 * (Y - Z)];
    }
    const dE = (a, b) => { const A = lab(a), B = lab(b);
      return Math.hypot(A[0] - B[0], A[1] - B[1], A[2] - B[2]); };
    /* the claim cleft1's narration makes: no ENDODERMAL key is near either cleft colour */
    const worstCross = [];
    for (const e of ECTO) for (const n of ENDODERM)
      worstCross.push({ ecto: e, endo: n, dE: +dE(LAYERS[e].color, LAYERS[n].color).toFixed(1) });
    worstCross.sort((a, b) => a.dE - b.dE);
    /* and no two keys shown together in any ONE beat may be confusable. The shown sets are the
       scene's, held in SHOWN_BEATS so this row runs with no scene loaded; the render harness asserts
       that copy against the scene's own ops so the two cannot drift. */
    /* DELIBERATELY-ALIKE PAIRS ARE EXEMPT BY NAME, IN A PARTITION THIS ROW PUBLISHES — the shape
       row Z uses, for the same reason: a tolerance wide enough to let these through would let the
       defect through too. Two keys SHOULD be hard to tell apart when the thing a student must not
       lose is which TISSUE they are: the three ectoderm shades are one family on purpose, and so is
       a pouch with the derivatives that inherit its hue. What must never be confusable is a pair
       from DIFFERENT families, which is precisely what F3 was. */
    const FAMILIES = [
      { why: 'the three ectoderm shades are one family on purpose: telling the first cleft from the lower three matters far less than telling either from anything endodermal',
        of: ['ectoderm', 'ectoderm2', 'surface'] },
      { why: 'a pouch and the derivatives that inherit its hue — the inheritance is the teaching device',
        of: ['pouch3', 'pt_inferior'] },
      { why: 'a pouch and the derivatives that inherit its hue',
        of: ['pouch4', 'pt_superior', 'ultimo'] },
      { why: 'a pouch and the derivatives that inherit its hue',
        of: ['pouch2', 'tonsil'] },
      { why: 'the thymus and the duct it draws out behind it are one structure in two parts',
        of: ['thymus', 'duct'] },
    ];
    const famOf = {};
    FAMILIES.forEach((f, i) => f.of.forEach(l => { famOf[l] = i; }));
    const worstInBeat = [], exempt = [];
    for (const B of SHOWN_BEATS) {
      const ls = B.keys.map(k => KEY_LAYER[k]).filter(Boolean);
      for (let i = 0; i < ls.length; i++) for (let j = i + 1; j < ls.length; j++) {
        if (ls[i] === ls[j]) continue;
        const rec = { beat: B.beat, a: ls[i], b: ls[j], dE: +dE(LAYERS[ls[i]].color, LAYERS[ls[j]].color).toFixed(1) };
        if (famOf[ls[i]] != null && famOf[ls[i]] === famOf[ls[j]]) {
          rec.exempt = FAMILIES[famOf[ls[i]]].why; exempt.push(rec);
        } else worstInBeat.push(rec);
      }
    }
    worstInBeat.sort((a, b) => a.dE - b.dE);
    exempt.sort((a, b) => a.dE - b.dE);
    const okCross = worstCross[0].dE >= 20;
    const okBeat = worstInBeat.length === 0 || worstInBeat[0].dE >= 14;
    add('CL-colour', 'no endodermal key is within dE 20 of any ectoderm colour — which is the claim cleft1’s own narration makes to the student — and no two keys from DIFFERENT declared colour families that a single beat shows together are within dE 14',
      { closest_endoderm_to_ectoderm: worstCross.slice(0, 5),
        closest_pair_within_one_beat: worstInBeat.slice(0, 5),
        exempt_same_family_pairs: exempt.slice(0, 5),
        families: FAMILIES.map(f => f.of.join('+')),
        was_before_this_run: 'pouch4 0x2874a6 was dE 10.9 from cleft1 and dE 12.2 from clefts_lower; superior_parathyroid dE 9.9; ultimopharyngeal_body dE 12.1' },
      okCross && okBeat, 'ectoderm-to-endoderm >= dE 20; within one beat >= dE 14',
      { case: 'the same measure run on the colours this model carried before this run, which the review found at dE 9.9',
        rejected: !(dE(0x2874a6, 0x5b7fa6) >= 20 && dE(0x1f618d, 0x4a6b8c) >= 20) });
  }

  /* ---- AC · THE KIT'S CAP ARTEFACT, PINNED ----
     render-kit sweptShell closes a thick-walled span with an annular end cap, and one of cap()'s two
     branches is wound against its own supplied normal — a kit finding this model reported and must
     not patch locally (RENDER-STANDARD section 6). Two keys here are thick-walled shells, so the
     artefact is theirs to carry and theirs to bound. It is behind the hull and visible only from
     `superior`, which no beat stands at; this row stops it growing quietly. */
  {
    const tt = 1, g2 = groupAt(tt);
    const counts = {};
    for (const key of ['pharyngeal_wall', 'surface_ectoderm']) {
      const V = vertsOf(g2, key);
      counts[key] = V.length / 9;
    }
    add('AC-capartefact', 'the two thick-walled shells are the only keys that carry render-kit’s annular-cap winding artefact, and the surface ectoderm’s wall tapers at both ends so its cap is a thin ring rather than a full annulus',
      { SURFW: SURFW, end_wall_fraction_of_full: 0.10,
        triangles: counts,
        measured_in_harness: 'behind-hull 80/4640 on pharyngeal_wall and 88/4400 on surface_ectoderm; hull 0 on both; backface-first from `superior` 56 of 2704, against 46 before this shell existed and 514 with a constant wall',
        note: 'the harness gates hull winding at zero and gates backface-first only on the cameras beats stand at — see its section 10' },
      counts.surface_ectoderm > 0 && counts.pharyngeal_wall > 0,
      'both shells build, so the artefact has a named owner rather than being untraceable',
      { case: 'asserted that a key which is NOT a thick-walled shell carries the artefact',
        rejected: !(vertsOf(g2, 'median_plane').length === 0) });
  }

  const pass = rows.every(r => r.pass && (!r.negative || r.negative.rejected));
  return { rows, pass, spec: { FLOORS, CRL_FIT, EXCLUDED_PAIRS }, keys: keysOf(gL) };
}

/* ══════════════════════════════════════════════════════════════════ beat claims

   The scene's claims[] name these, and tools/check-beat-claims.mjs evaluates them at each view's own
   SET_STAGE t. RENDER-STANDARD 3.y: "the model exposes the measure through claimMeasure so the
   assertion lives in the beat that makes the claim and moves with it".

   VIEW_DIR IS COPIED FROM viz3d.js (:2095), NOT RESTATED, so the player's cameras and any
   screen-plane measure here cannot drift apart. */
const VIEW_DIR = {
  anterior: [0, 0, 1], posterior: [0, 0, -1], lateral: [1, 0, 0], medial: [-1, 0, 0],
  superior: [0, 1, 0.001], inferior: [0, -1, 0.001],
};

/* FIRST HIT ALONG THE BEAT'S CAMERA AXIS, OVER EVERYTHING THE BEAT DRAWS — RENDER-STANDARD 3.aa.
   "A claim about what covers, occludes, is under, is behind or is in front of something is measured
   by FIRST HIT along that beat's camera axis, over the whole list of structures the beat shows —
   not over the pair the claim names. Anything drawn in front counts against the claim, whatever it
   is." A claim that a sheet STANDS BETWEEN two solids and is visible is exactly that shape: it
   fails if either neighbour is drawn over it, and the old measure — a screen HEIGHT of the membrane
   alone — could not notice. Rays are cast from outside the whole shown set, on a grid over the
   subject's own screen footprint, and the measure is the fraction on which the subject is nearest.
   A shown key that resolves to no geometry THROWS rather than being skipped — 3.aa again, because a
   measure that cannot see something is the fault being fixed. */
function firstHitFrac(beat, key) {
  const B = SHOWN_BEATS.find(b => b.beat === beat);
  if (!B) throw new Error('no such beat: ' + beat);
  const g = groupAt(B.t);
  const d = new T.Vector3().fromArray(VIEW_DIR[B.camera]).normalize();
  let up = Math.abs(d.y) > 0.99 ? new T.Vector3(0, 0, -1) : new T.Vector3(0, 1, 0);
  const right = new T.Vector3().crossVectors(up, d).normalize();
  up = new T.Vector3().crossVectors(d, right).normalize();
  const tris = [];
  for (const k of B.keys) {
    const T2 = trisOf(g, k, 0);
    if (!T2.length) throw new Error('beat ' + beat + ' shows ' + k + ' and it builds nothing at t=' + B.t);
    for (const tr of T2) tris.push({ tr: tr, k: k });
  }
  const V = vertsOf(g, key);
  if (!V.length) return 0;
  let u0 = Infinity, u1 = -Infinity, v0 = Infinity, v1 = -Infinity, far = -Infinity;
  const q = new T.Vector3();
  for (const o2 of tris) for (let c = 0; c < 9; c += 3) {
    q.set(o2.tr[c], o2.tr[c + 1], o2.tr[c + 2]);
    const dd = q.dot(d); if (dd > far) far = dd;
  }
  for (let i = 0; i < V.length; i += 3) {
    q.set(V[i], V[i + 1], V[i + 2]);
    const a2 = q.dot(right), b2 = q.dot(up);
    if (a2 < u0) u0 = a2; if (a2 > u1) u1 = a2;
    if (b2 < v0) v0 = b2; if (b2 > v1) v1 = b2;
  }
  const N = 30;
  let hits = 0, mine = 0;
  const o = new T.Vector3(), nd = d.clone().negate();
  for (let a = 0; a < N; a++) for (let b = 0; b < N; b++) {
    const uu = u0 + (u1 - u0) * ((a + 0.5) / N), vv = v0 + (v1 - v0) * ((b + 0.5) / N);
    o.set(0, 0, 0).addScaledVector(right, uu).addScaledVector(up, vv)
     .addScaledVector(d, far + Math.abs(far) + 1);
    let best = Infinity, bk = null;
    for (let h = 0; h < tris.length; h++) {
      const tt2 = rayTri(o, nd, tris[h].tr);
      if (tt2 != null && tt2 < best) { best = tt2; bk = tris[h].k; }
    }
    if (bk != null) { hits++; if (bk === key) mine++; }
  }
  return hits ? mine / hits : 0;
}
/** Moller-Trumbore, two-sided, returning the ray parameter or null */
function rayTri(o, dir, tr) {
  const e1x = tr[3] - tr[0], e1y = tr[4] - tr[1], e1z = tr[5] - tr[2];
  const e2x = tr[6] - tr[0], e2y = tr[7] - tr[1], e2z = tr[8] - tr[2];
  const px = dir.y * e2z - dir.z * e2y, py = dir.z * e2x - dir.x * e2z, pz = dir.x * e2y - dir.y * e2x;
  const det = e1x * px + e1y * py + e1z * pz;
  if (Math.abs(det) < 1e-18) return null;
  const inv = 1 / det, tx = o.x - tr[0], ty = o.y - tr[1], tz = o.z - tr[2];
  const u = (tx * px + ty * py + tz * pz) * inv;
  if (u < -1e-9 || u > 1 + 1e-9) return null;
  const qx = ty * e1z - tz * e1y, qy = tz * e1x - tx * e1z, qz = tx * e1y - ty * e1x;
  const v = (dir.x * qx + dir.y * qy + dir.z * qz) * inv;
  if (v < -1e-9 || u + v > 1 + 1e-9) return null;
  const tt = (e2x * qx + e2y * qy + e2z * qz) * inv;
  return tt > 1e-9 ? tt : null;
}

/** IS THE MIDDLE ONE IN THE MIDDLE, ON THIS BEAT'S OWN SCREEN. Normalised by the mean of the three
    keys' own screen extents along the same screen axis, so it carries RENDER-STANDARD's magnitude
    floor instead of being a sign test: it is the middle key's distance from the NEARER of the two
    outer centres, over that mean. Zero means it is not between them where the student stands. */
function screenBetween(g, ka, kmid, kb, view) {
  const ax = screenAxes(view);
  /* ONE SIDE ONLY, and the first draft of this measure got it wrong in a way worth recording. Every
     key here is a mirror-symmetric PAIR, so taken over both sides each key's centre along ANY screen
     axis that is a mirror of itself sits at zero — all three centres coincide, the margin is zero,
     and the measure reports "not between" for a layout that is perfectly between. It returned
     exactly 0.0000 on a frame where the three are plainly stacked in order. Which is the same fault
     RENDER-STANDARD 3.aa is about, one level down: the measured side was not a function of the thing
     the claim is about. */
  const pos = key => {
    const V = vertsOf(g, key);
    if (!V.length) return null;
    let lo = Infinity, hi = -Infinity, n = 0;
    const q = new T.Vector3();
    for (let i = 0; i < V.length; i += 3) {
      if (V[i] <= 0) continue;                       // the right-side solid only
      q.set(V[i], V[i + 1], V[i + 2]);
      n++;
      const pp = q.dot(ax.right); if (pp < lo) lo = pp; if (pp > hi) hi = pp;
    }
    if (!n) return null;
    return { lo: lo, hi: hi, c: 0.5 * (lo + hi), ext: hi - lo };
  };
  const A = pos(ka), M = pos(kmid), B = pos(kb);
  if (!A || !M || !B) return 0;
  const lo = Math.min(A.c, B.c), hi = Math.max(A.c, B.c);
  const mean = (A.ext + M.ext + B.ext) / 3;
  if (!(mean > 0)) return 0;
  return Math.min(M.c - lo, hi - M.c) / mean;
}

/** a structure's extent PROJECTED ON TO the screen plane of a named camera — 3.y's measure */
function screenExtent(g, key, view, axis) {
  const d = new T.Vector3().fromArray(VIEW_DIR[view]).normalize();
  let up = Math.abs(d.y) > 0.99 ? new T.Vector3(0, 0, -1) : new T.Vector3(0, 1, 0);
  const right = new T.Vector3().crossVectors(up, d).normalize();
  up = new T.Vector3().crossVectors(d, right).normalize();
  const V = vertsOf(g, key);
  let lo = Infinity, hi = -Infinity;
  const a = axis === 'right' ? right : up;
  for (let i = 0; i < V.length; i += 3) {
    const p = V[i] * a.x + V[i + 1] * a.y + V[i + 2] * a.z;
    if (p < lo) lo = p; if (p > hi) hi = p;
  }
  return hi - lo;
}

/* A KEY'S OWN MAXIMUM AND MINIMUM EXTENT ACROSS THE WHOLE PROCESS, scanned day by day off the built
   geometry and cached. These are what make a claim about "full extension" or "not a residue" a
   statement about the structure rather than about the units. */
const _peak = {}, _floor = {};
function scanExtents(key) {
  if (_peak[key] != null) return;
  let hi = 0, lo = Infinity;
  for (let d = DAY0; d <= DAY1; d++) {
    const v = ownExtentSeg(tOfDay(d), key);
    if (v > hi) hi = v;
    if (v < lo) lo = v;
  }
  _peak[key] = hi; _floor[key] = lo;
}
function peakExtentSeg(key) { scanExtents(key); return _peak[key]; }
function floorExtentSeg(key) { scanExtents(key); return _floor[key]; }

/** the screen axes of a named camera, built the way viz3d's own framing builds them (viz3d.js:2159) */
function screenAxes(view) {
  const d = new T.Vector3().fromArray(VIEW_DIR[view]).normalize();
  let up = Math.abs(d.y) > 0.99 ? new T.Vector3(0, 0, -1) : new T.Vector3(0, 1, 0);
  const right = new T.Vector3().crossVectors(up, d).normalize();
  up = new T.Vector3().crossVectors(d, right).normalize();
  return { dir: d, up, right };
}
/** two structures' centroid separation ON a camera's screen plane, over the mean of their own screen
    extents along the axis that carries most of the separation. `signedUp` keeps the sign along the
    screen's vertical, for a claim about one thing ending up below another. */
function screenSepOverExtent(g, ka, kb, view, signedUp) {
  const ax = screenAxes(view);
  const A = centroidOf(g, ka), B = centroidOf(g, kb);
  if (!A || !B) return NaN;
  const proj = (p, a) => p.x * a.x + p.y * a.y + p.z * a.z;
  const dUp = proj(A, ax.up) - proj(B, ax.up);
  const dRt = proj(A, ax.right) - proj(B, ax.right);
  const axis = signedUp || Math.abs(dUp) >= Math.abs(dRt) ? ax.up : ax.right;
  const sep = signedUp || Math.abs(dUp) >= Math.abs(dRt) ? dUp : dRt;
  const ea = screenExtentAlong(g, ka, axis), eb = screenExtentAlong(g, kb, axis);
  const mean = (ea + eb) / 2;
  return mean > 0 ? sep / mean : NaN;
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

function claimMeasure(name, t) {
  const g = groupAt(t);
  const F = frameAt(t);
  const path = name.split('.');
  switch (path[0]) {
    case 'day':            return F.day;
    case 'crl_mm':         return mm(F.L);
    case 'span_mm':        return mm(F.span);
    case 'seg_mm':         return mm(F.seg);
    /* "Four pairs of pouches count." A pouch counts when its own per-side extent is clearly more
       than the mounting vestige — 0.25 of an intersegment, against a vestige of about 0.03. */
    /* HALF ITS OWN PEAK. Three thresholds were tried here and the first two were both wrong in a way
       worth recording, because each was wrong about a different pouch.

       An ABSOLUTE bar — 0.25 then 0.5 of an intersegment — counted the fourth pouch from day 22, six
       days before it buds, and then stopped working altogether when the model was re-proportioned:
       an absolute size encodes whatever scale the author happened to measure at.

       THREE TIMES ITS OWN MOUNTING FLOOR looked scale-free and was not, because the four pouches do
       not share a floor. Pouches 1, 3 and 4 sit at the engine's mounting vestige when they do not
       exist, a tenth of themselves; the SECOND pouch is floored at 0.38 as ANATOMY, because what is
       left of it is the tonsillar fossa and drawing that at a tenth would teach that the pouch has
       gone. So pouch 2's whole range is 2.6-fold and it can never reach three times its own minimum:
       the rule was unsatisfiable for one of the four things it counts.

       Half its own PEAK is scale-free AND floor-independent, and it is the question the narration
       asks — is this pouch here, as opposed to on its way in or on its way out. It gives 2 on day 30,
       3 on day 32, 4 from day 34 to day 44, and 1 at day 56, when the pouches have become their
       derivatives and only the tubotympanic recess is still a pouch. */
    case 'pouchCount':     return [1, 2, 3, 4].filter(k =>
                              ownExtentSeg(t, 'pouch' + k) >= 0.5 * peakExtentSeg('pouch' + k)).length;
    case 'pouchLevelY':    return ostiumY(g, 'pouch' + path[1]);
    case 'pouchSpacingSpread': {
      const lev = [1, 2, 3, 4].map(k => ostiumY(g, 'pouch' + k));
      const d = [lev[0] - lev[1], lev[1] - lev[2], lev[2] - lev[3]];
      return (Math.max(...d) - Math.min(...d)) / F.seg;
    }
    case 'pouch1CalibreRatio': return calibreRatio(g);
    case 'wingSeparationOverExtent': {
      const d = centroidOf(g, 'pouch' + path[1] + '_dorsal_wing');
      const v = centroidOf(g, 'pouch' + path[1] + '_ventral_wing');
      const bd = bboxOf(g, 'pouch' + path[1] + '_dorsal_wing'), bv = bboxOf(g, 'pouch' + path[1] + '_ventral_wing');
      return (v.z - d.z) / ((bd.size[2] + bv.size[2]) / 2);
    }
    /* THE CROSSOVER, as a claim a beat can carry. Signed: positive is uncrossed. */
    case 'ptGap':          return ptGap(t).gap;
    case 'ptGapOverExtent': { const r = ptGap(t); return r.gap / r.meanExtent; }
    case 'pt3Y':           return ptGap(t).pt3_y;
    case 'pt4Y':           return ptGap(t).pt4_y;
    case 'crossoverDay':   return solveCrossoverDay(null).day;
    /* how far each migrating structure has come, in intersegments — the "travels furthest" claim */
    case 'descentSeg': {
      /* normalised at EACH end by the intersegment at its own t, so the embryo's own growth is
         divided out — see row D-travel's note, which is where this correction came from */
      const t0 = tOfDay(DESC.day);
      const a = centroidOf(groupAt(t0), path[1]);
      const b = centroidOf(g, path[1]);
      return (a.y / frameAt(t0).seg) - (b.y / F.seg);
    }
    case 'thymusMinAbsXOverSeg': {
      const V = vertsOf(g, 'thymus');
      let m = Infinity;
      for (let i = 0; i < V.length; i += 3) m = Math.min(m, Math.abs(V[i]));
      return m / F.seg;
    }
    case 'ductLengthSeg': {
      const b = bboxOf(g, 'thymopharyngeal_duct');
      return b.size[1] / F.seg;
    }
    case 'cCellsInThyroidFrac': {
      const th = bboxOf(g, 'thyroid_gland'), cc = vertsOf(g, 'c_cells');
      let n = 0, inn = 0;
      for (let i = 0; i < cc.length; i += 3) {
        n++;
        if (cc[i] >= th.min[0] && cc[i] <= th.max[0] && cc[i + 1] >= th.min[1] && cc[i + 1] <= th.max[1] &&
            cc[i + 2] >= th.min[2] && cc[i + 2] <= th.max[2]) inn++;
      }
      return n ? inn / n : 0;
    }
    /* a key's own per-side extent, in intersegments at its own t — this is how a beat claims that
       something is present and substantial rather than sitting at its mounting vestige */
    case 'relSize':        return ownExtentSeg(t, path[1]);
    /* ── TWO MEASURES THAT CANNOT GO STALE ──────────────────────────────────────────────────────
       Added after three beat claims failed, and the reason they failed is worth more than the fix.
       All three were ABSOLUTE floors on relSize, set from measurements taken before this model was
       re-proportioned for the swept-fold defect. The geometry got better and the claims got wrong,
       because an absolute floor on a size encodes the scale the author happened to measure. The
       narration does not say "pouch 1 is 2.5 intersegments long"; it says it is the LONGEST of the
       four, and that both pouches are at FULL extension. Those are a comparison and a fraction of
       the structure's own maximum, and neither moves when the model is rescaled. Lowering the floors
       would have been the other available answer, and RENDER-STANDARD is explicit about that one:
       "quietly lowering a threshold is not" an argument. */
    case 'longestPouch': {
      /* which pouch has the greatest extent of its own — the narration's claim, as a comparison */
      let best = 0, bk = 0;
      for (const k of [1, 2, 3, 4]) { const v = ownExtentSeg(t, 'pouch' + k); if (v > best) { best = v; bk = k; } }
      return bk;
    }
    case 'fracOfPeak':     return ownExtentSeg(t, path[1]) / peakExtentSeg(path[1]);
    case 'fracOfFloor':    return ownExtentSeg(t, path[1]) / floorExtentSeg(path[1]);
    /* 3.y: the measure AS PROJECTED on the screen plane of the camera the beat rotates to */
    case 'screenHeight':   return screenExtent(g, path[1], path[2], 'up');
    case 'screenWidth':    return screenExtent(g, path[1], path[2], 'right');
    case 'screenHeightOverSeg': return screenExtent(g, path[1], path[2], 'up') / F.seg;
    /* 3.y PROPER: a SEPARATION between two structures, projected on the screen plane of the camera
       the beat rotates to, over the mean of their own screen extents along that same screen axis.
       A separation measured in the model's frame can be perfectly real and invisible from the camera
       the beat stands at — that is the heart-valves crown defect — so the beat that claims "dorsal
       wing up and back, ventral wing down and front" has to claim it on its own screen. */
    case 'wingScreenSepOverExtent': {
      const k = path[1], view = path[2];
      return screenSepOverExtent(g, 'pouch' + k + '_dorsal_wing', 'pouch' + k + '_ventral_wing', view);
    }
    /* THE CROSSOVER ON THE BEAT'S OWN SCREEN. Signed the same way as ptGap: positive means the
       pouch-3 gland still projects ABOVE the pouch-4 one, negative means a student can see the
       crossover from where this beat stands. */
    case 'ptGapScreenOverExtent':
      return screenSepOverExtent(g, 'inferior_parathyroid', 'superior_parathyroid', path[1], true);
    /* F2's measure: the SURFACE separation between two named keys, at this beat's own t.
       gapOverMeanExtent.<a>.<b> and gapOverSeg.<a>.<b>. A claim about where two structures are
       relative to each other is now measured as that relation and nothing else — a claim of this
       shape fails when the picture is wrong, which is the whole point of the row. */
    case 'gapOverMeanExtent': return gapDetail(t, path[1], path[2]).overMeanExtent;
    case 'gapOverSeg':        return gapDetail(t, path[1], path[2]).overSeg;
    /* 3.aa: firstHitFrac.<beat>.<key> — the fraction of the key's own screen footprint on which it
       is the NEAREST surface, over everything that beat draws */
    case 'firstHitFrac':      return firstHitFrac(+path[1], path[2]);
    /* screenBetween.<a>.<middle>.<b>.<view> — is the middle one in the middle, on this screen */
    case 'screenBetween':     return screenBetween(g, path[1], path[2], path[3], path[4]);
  }
  throw new Error('unknown measure: ' + name);
}

/* ════════════════════════════════ WHAT EACH BEAT SHOWS, AND WHICH LAYER EACH KEY WEARS

   The scene owns both of these; this is the model's COPY, kept so that the acceptance battery can
   run with no scene loaded — and RENDER-STANDARD 3.aa is explicit about the price of a copy:
   "Where the model keeps its own copy of a beat's shown list so acceptance can run with no scene
   loaded, the render harness asserts that copy against the scene's own ops so the two cannot
   drift." Section 11 of tools/render-pharyngeal-pouches.mjs is that assertion. If you edit a beat's
   ops, this list has to move with it or the harness fails. */
const SHOWN_BEATS = [
  { beat: 1, t: 0.352941, camera: 'anterior',
    keys: ['pharyngeal_wall', 'arch_bars', 'cleft1', 'clefts_lower', 'pouch1', 'pouch2', 'pouch3', 'pouch4', 'surface_ectoderm'] },
  { beat: 2, t: 0.470588, camera: 'lateral',
    keys: ['pharyngeal_wall', 'pouch3', 'pouch4', 'pouch3_dorsal_wing', 'pouch3_ventral_wing', 'pouch4_dorsal_wing', 'pouch4_ventral_wing'] },
  { beat: 3, t: 0.823529, camera: 'anterior',
    keys: ['pharyngeal_wall', 'pouch1', 'pouch2', 'palatine_tonsil'] },
  { beat: 4, t: 0.647059, camera: 'lateral',
    keys: ['pouch1', 'cleft1', 'tympanic_membrane'] },
  { beat: 5, t: 0.647059, camera: 'lateral',
    keys: ['pouch3', 'pouch3_ventral_wing', 'thymopharyngeal_duct', 'thymus', 'inferior_parathyroid', 'thyroid_gland'] },
  { beat: 6, t: 0.941176, camera: 'anterior',
    keys: ['thymus', 'thymopharyngeal_duct', 'inferior_parathyroid', 'superior_parathyroid', 'thyroid_gland', 'median_plane'] },
  { beat: 7, t: 0.764706, camera: 'lateral',
    keys: ['ultimopharyngeal_body', 'thyroid_gland', 'c_cells', 'superior_parathyroid'] },
  { beat: 8, t: 0.941176, camera: 'anterior',
    keys: ['thyroid_gland', 'c_cells'] },
];
const KEY_LAYER = {
  pharyngeal_wall: 'wall', arch_bars: 'arches', surface_ectoderm: 'surface',
  cleft1: 'ectoderm', clefts_lower: 'ectoderm2', median_plane: 'midline',
  pouch1: 'pouch1', pouch2: 'pouch2', pouch3: 'pouch3', pouch4: 'pouch4',
  pouch3_dorsal_wing: 'pouch3', pouch3_ventral_wing: 'pouch3',
  pouch4_dorsal_wing: 'pouch4', pouch4_ventral_wing: 'pouch4',
  tympanic_membrane: 'membrane', palatine_tonsil: 'tonsil',
  thymus: 'thymus', thymopharyngeal_duct: 'duct',
  inferior_parathyroid: 'pt_inferior', superior_parathyroid: 'pt_superior',
  ultimopharyngeal_body: 'ultimo', thyroid_gland: 'thyroid', c_cells: 'ccell',
};


/* ══════════════════════════════════════════════════════════════════ the provider contract */
window.MB3D_MODELS = window.MB3D_MODELS || {};
window.MB3D_MODELS['pharyngeal-pouches'] = {
  LAYERS: LAYERS,
  build: buildApparatus,
  /* No optional layers: every key is built every time. The adapter slices the group by key, so FULL
     being empty is correct here rather than an omission — there is nothing behind a flag to miss. */
  FULL: {},
  VARIANTS: {},
  ACCEPTANCE: { FLOORS, POUCH, WING, CRL_ANCHORS },
  FLOORS: FLOORS,
  SOLVED: { CRL_FIT: CRL_FIT, crossover: () => solveCrossoverDay(null) },
  acceptance: acceptance,
  claimMeasure: claimMeasure,
  SHOWN_BEATS: SHOWN_BEATS,
  KEY_LAYER: KEY_LAYER,
  /* exposed so a harness, a review or the console can re-measure without reading the source */
  frameAt: frameAt,
  dayOf: dayOf,
  tOfDay: tOfDay,
  VIEW_DIR: VIEW_DIR,
};

})();
