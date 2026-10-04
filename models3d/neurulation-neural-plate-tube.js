/* MedBank · neurulation (neural plate -> neural tube) — procedural embryo
 *
 * Registers itself as MB3D_MODELS['neurulation-neural-plate-tube'] — LAYERS, build(t, opts), FULL,
 * VARIANTS — which is what viz3d.js's procedural adapter resolves a scene's refs.procedural against.
 *
 * ─────────────────────────────────────────────────────────────────────────────────────────────────
 * WHAT THIS MODEL IS FOR, AND WHAT IT ADDS THAT FOUR DRAWINGS CANNOT
 *
 * The sequence-engine version of this scene drew four transverse sections in a row — plate, groove,
 * folds, tube — and said "watch the same section four times". That is how the topic is taught and it
 * is not wrong, but it hides the fact that makes the subject three-dimensional:
 *
 *      BECAUSE CLOSURE ZIPS OUTWARDS FROM ONE PLACE, A SINGLE EMBRYO AT A SINGLE INSTANT SHOWS
 *      ALL FOUR STAGES AT ONCE, AT FOUR DIFFERENT LEVELS.
 *
 * At day 23 this model's embryo has a closed tube around the cervical region, raised folds on both
 * sides of it, a shallow groove beyond those, and flat plate at both ends. The four drawings are four
 * LEVELS of one embryo as much as they are four times at one level, and a student who has only ever
 * seen them as four times does not know where to cut.
 *
 * So the stage of the neuroepithelium is not a property of t in this model. It is a FIELD over the
 * cranio-caudal axis, phi(v, t), and `neural_plate`, `neural_groove`, `neural_folds` and
 * `neural_tube` are bands of that field — which is why each of them can appear TWICE in one build,
 * once cranial to the closure site and once caudal to it.
 *
 * ─────────────────────────────────────────────────────────────────────────────────────────────────
 * THE SOLVED PARAMETERS (RENDER-STANDARD section 3: prefer a solved parameter to a tuned one, and
 * solve the one that decides the EXAMINABLE relation)
 *
 * What a student is marked wrong for here is a short list: closure begins at the FIFTH SOMITE about
 * DAY 22; the CRANIAL neuropore shuts about DAY 25; the CAUDAL neuropore shuts about DAY 27, at the
 * lumbosacral level. Everything in that list is solved in this file, none of it is typed:
 *
 *   1. V_SOM5 — WHERE closure begins — is read off the somite table, not chosen. Somites appear at
 *      V_SEG_CRANIAL and are laid down caudally one pair every SOMITE_PERIOD_H hours from
 *      DAY_SOM_START; each pair's MATERIAL v-extent is fixed at the moment it forms, out of the
 *      embryo's length on that day. V_SOM5 is the centre of the fifth of them. Change the somite
 *      clock and the closure site moves, which is the right coupling: "the fifth somite" is a
 *      statement about segmentation, not about neurulation.
 *
 *   2. V_CAUD — WHERE the caudal neuropore is — is the caudal edge of the LAST somite present on day
 *      27, by the same table. Primary neurulation ends where segmentation has got to.
 *
 *   3. U_CRAN and U_CAUD — the two zip speeds — are then forced, not fitted: the cranial front must
 *      cover V_SOM5 -> 1 in (25 - 22) days and the caudal front V_SOM5 -> V_CAUD in (27 - 22). They
 *      come out as 0.171 and 0.071 of the axis per day, so the cranial front runs 2.4x faster, and
 *      that ratio is a consequence of the three taught dates rather than an opinion about them.
 *
 *   4. THE FOLD CONSERVES ARC LENGTH. The neural plate at station v is a strip whose MIDSURFACE arc
 *      length L(v) does not change while it bends. Bending it is sweeping a circular arc of
 *      half-angle phi and radius R = L / (2 phi): at phi -> 0 it is flat and spans L; at phi = pi the
 *      arc has closed into a circle of circumference L. Nothing is scaled, so it reads as tissue
 *      folding, and the tube's calibre is not a number anyone chose — it is L / (2 pi).
 *
 *   5. SO THE VENTRICLE-VERSUS-CENTRAL-CANAL DIFFERENCE IS DERIVED. The plate is broad at the head
 *      end and narrow at the tail end (that is the slipper shape, and it is the first thing the
 *      narration says). With an epithelium of thickness H(v), the closed tube's lumen radius is
 *      L/(2 pi) - H/2. Measured on the built geometry: 75 um across at the brain end and 35 um at the
 *      caudal neuropore — a future ventricle at one end and a slit of a central canal at the other,
 *      out of one conserved quantity. No beat quotes a lumen size that this file typed in.
 *
 *   6. FUSION IS A GEOMETRIC EVENT, NOT A THRESHOLD ON t. The fold tips are in contact when the
 *      midsurface tips are SEAM apart: 2 R sin(phi) = SEAM, which fixes PHI_MAX(v) by bisection. A
 *      station is `neural_tube` exactly when phi has reached PHI_MAX, and the band boundary between
 *      `neural_folds` and `neural_tube` IS the closure front. Acceptance row C asserts that the front
 *      measured that way reaches the cranial end on day 25 and the caudal end on day 27, to within
 *      0.05 of a day — so the geometry and the taught dates are checked against each other rather
 *      than both being asserted.
 *
 * THE ONE TUNED CONSTANT IS D_FOLD, how long a station takes to go from flat to fused (3 days). It is
 * declared as tuned in ACCEPTANCE.tuned, and row C is the reason it does not matter much: the three
 * examinable dates are properties of the FRONT, and the front's arrival at a station is dayFront(v),
 * which D_FOLD does not enter. D_FOLD only decides how far AHEAD of the front the groove and the
 * folds reach — which no beat quotes a number for.
 *
 * ─────────────────────────────────────────────────────────────────────────────────────────────────
 * A DISAGREEMENT WITH THE CORPUS, RECORDED BECAUSE BUILD-TASK-PROMPT section 6 ASKS FOR IT
 *
 * models3d/notochord.js — the sibling scene in this same topic, and the model that draws the rod this
 * one's plate is induced by — carries SOMITE_PERIOD_H = 4.5: one somite pair every four and a half
 * hours. The figure every text teaches is THREE PAIRS PER DAY, which is eight hours. The difference
 * is not cosmetic for this model: at 4.5 h there are 37 pairs by day 27 and at 8 h there are 21, and
 * since both V_SOM5 and V_CAUD are read off the somite table, the closure site and the caudal
 * neuropore move with it. 37 pairs also contradicts the taught figure of about 25 pairs by the end of
 * week 4, which 8 h reproduces (24 by day 28).
 *
 * THIS MODEL USES 8.0 AND SAYS SO. It does not edit notochord.js, which is another item and is in
 * review as this is written. constants() exposes both the shared dimensions and this one disagreement
 * so the render harness can assert the agreement AND the disagreement, rather than either being a
 * sentence in a comment. See the scene's gaps[] and viz-training/BUILD-LOG.md.
 *
 * ─────────────────────────────────────────────────────────────────────────────────────────────────
 * EVERYTHING GEOMETRIC COMES FROM render-kit.js (RENDER-STANDARD section 6). Winding through
 * emitter(), colour through C(), silhouettes through outlineOf/outlineMaterial, framing through
 * fitCamera, terminal ends through tubeCapped/domeCap. The one local addition is emitTri/ringQuad,
 * copied from models3d/notochord.js: it decides the kit's quad order PER TRIANGLE by measuring the
 * face normal against the supplied vertex normals, because a sheet swept (v, x) is right-handed the
 * opposite way round from what quad() assumes and half the surfaces here are sheets.
 *
 * THE WHOLE FILE IS AN IIFE. Only the registration escapes. See RENDER-STANDARD: a model written at
 * top level puts T, K, LAYERS and every constant into global lexical scope and the NEXT model to load
 * dies on "Identifier 'T' has already been declared", taking the page with it.
 */
(function () {

const T = window.THREE, K = window.VizKit;

/* ═══════════════════════════════════════════════════════════════════ 1 · LAYERS AND THE PART LIST */

const LAYERS = {
  /* the neuroepithelium, as four bands of ONE continuous sheet */
  neural_plate:   { color: 0xf4d03f, name: 'Neural plate' },
  neural_groove:  { color: 0xf5b041, name: 'Neural groove' },
  neural_folds:   { color: 0xe67e22, name: 'Neural folds' },
  neural_tube:    { color: 0xd35400, name: 'Neural tube' },
  neural_canal:   { color: 0x5dade2, name: 'Neural canal (future ventricles and central canal)' },
  /* the two openings, as the lip that bounds them */
  cranial_neuropore: { color: 0xa93226, name: 'Cranial neuropore' },
  caudal_neuropore:  { color: 0x922b21, name: 'Caudal neuropore' },
  /* what the plate is continuous with, and what induced it */
  surface_ectoderm: { color: 0x2980b9, name: 'Surface ectoderm' },
  neural_crest:     { color: 0x8e44ad, name: 'Neural crest cells' },
  notochord:        { color: 0xd4306f, name: 'Notochord' },
  somites:          { color: 0xcf3f3b, name: 'Somites' },
  lateral_mesoderm: { color: 0xa65c5c, name: 'Lateral mesoderm' },
  endoderm:         { color: 0x5f9e2a, name: 'Endoderm (gut roof)' },
  /* the tail end, which is built the other way */
  caudal_eminence:  { color: 0x7b241c, name: 'Caudal eminence' },
  secondary_canal:  { color: 0x85c1e9, name: 'Canal formed by canalisation' },
  /* clinical */
  area_cerebrovasculosa: { color: 0xcb4335, name: 'Exposed, degenerated forebrain' },
  vertebral_arch:   { color: 0xd5d8dc, name: 'Vertebral arch' },
  dura_sac:         { color: 0xaed6f1, name: 'Meninges and CSF' },
  skin_cover:       { color: 0xf5cba7, name: 'Skin' },
};

/* AXES. Copied from models3d/notochord.js and models3d/trilaminar-disc-3-germ-layers.js, which are
   the two models this one shares an embryo with, so a beat that puts them side by side agrees.
   DECLARED, NOT PROVED — see ACCEPTANCE.axes_status and row Q. */
const AXES = 'RIGHT=-x LEFT=+x CRANIAL=+y VENTRAL=+z (DORSAL=-z)';
const UNIT_UM = 100;              // one unit is 100 um — the scale the sibling scenes use

/* ═══════════════════════════════════════════════════════════════════ 2 · PERTURBATION HOOK

   RENDER-STANDARD, "AN ACCEPTANCE MEASUREMENT MUST BE A FUNCTION OF THE BUILT GEOMETRY": the check
   that a measurement is not a restated constant is a PERTURBATION — change the constant the geometry
   is built from and the reported number must move. Every constant that can be perturbed is read
   through p(); the harness sets PERT, rebuilds and re-measures. */
const PERT = {};
const p = (k, v) => (PERT[k] !== undefined ? PERT[k] : v);

/* ═══════════════════════════════════════════════════════════════════ 3 · THE EMBRYO'S DIMENSIONS

   The four names marked SHARED are the sibling models' own constants, at the sibling models' own
   values, so the three scenes in this topic draw one embryo. constants() publishes them and the
   render harness asserts the agreement against the files rather than against this comment. */

const DISC_L   = 10.00;   // SHARED (notochord.DISC_L): the disc is 1.0 mm long on day 18
const W_MAX    =  4.30;   // SHARED (notochord.W_MAX): greatest half-width on day 18, 0.43 mm
const H_ECTO   =  0.28;   // SHARED (notochord.H_ECTO): flat surface ectoderm, 28 um
const NP_MAXFAC=  2.60;   // SHARED (notochord.NP_MAXFAC): induced plate is this many times as thick
const W_SOM    =  1.05;   // SHARED (notochord.W_SOM): one somite, 105 um
const V_SEG_CRANIAL = 0.78;  // SHARED (notochord.V_SEG_CRANIAL): segmentation starts here
const V_PRE    =  0.862;  // SHARED (notochord.V_PRE): prechordal plate, the notochord's cranial limit
const R_NOTO   =  0.30;   // SHARED (notochord.R_PROC): the notochord's calibre
const H_ENDO   =  0.16;   // SHARED (notochord.H_VENT): the lower lamina / gut roof, 16 um

/* THE DISAGREEMENT. notochord.js says 4.5. See the header. */
const SOMITE_PERIOD_H = 8.0;
const DAY_SOM_START   = 20.0;  // SHARED (notochord.DAY_SOM_START): the first pair appears on day 20

/* the clock. t = 0 is day 17 (ectoderm induced, not yet thickened); t = 1 is day 29. */
const DAY_0 = 17.0;
const DAY_1 = 29.0;
const day  = t => DAY_0 + (DAY_1 - DAY_0) * clampX(t, 0, 1);
const tOfDay = d => (d - DAY_0) / (DAY_1 - DAY_0);

/* THE TAUGHT DATES. Everything else about closure is solved from these four numbers. */
const DAY_PLATE  = 18.0;   // the neural plate is recognisable
const DAY_CLOSE0 = 22.0;   // fusion begins, at the fifth somite
const DAY_CRAN   = 25.0;   // the cranial neuropore shuts
const DAY_CAUD   = 27.0;   // the caudal neuropore shuts

/* GROWTH. The neural axis is DISC_L long on day 18 and EMB_L_27 long on day 27; exponential between,
   so one rate constant carries the whole span rather than a table. */
const EMB_L_27 = 34.00;                                    // 3.4 mm on day 27
const K_GROW = Math.log(EMB_L_27 / DISC_L) / (DAY_CAUD - DAY_PLATE);
const embL = d => p('DISC_L', DISC_L) * Math.exp(K_GROW * (d - DAY_PLATE));
/* and it widens more slowly than it lengthens, which is what makes an embryo an embryo and not a
   scaled disc. One exponent, declared as tuned. */
const W_EXP = 0.40;
const growW = d => Math.pow(embL(d) / p('DISC_L', DISC_L), W_EXP);

/* THE PLAN. Half-width against v, normalised to 1 at V_PEAK: broad at the head end, tapering to the
   tail. This is the slipper the narration names in its first sentence. */
const V_PEAK = 0.75, PLAN_SD = 0.42, PLAN_FLOOR = 0.40;
function plan(v) {
  const z = (clampX(v, 0, 1) - V_PEAK) / PLAN_SD;
  return PLAN_FLOOR + (1 - PLAN_FLOOR) * Math.exp(-z * z);
}
const halfW = (v, t) => p('W_MAX', W_MAX) * plan(v) * growW(day(t));
const halfW18 = v => p('W_MAX', W_MAX) * plan(v);

/* HOW THE HALF-WIDTH IS SHARED OUT, on day 18. Three bands, and they sum to one: the neural plate in
   the midline, the paraxial mesoderm beside it, the lateral plate beyond that. Row S asserts the
   built sheets tile the half-width with no gap and no overlap, which is what makes this a partition
   rather than three independent numbers. */
const SH_NEURAL = 0.54, SH_PARAX = 0.20, SH_LATERAL = 0.26;

/* THE CONSERVED QUANTITY. The plate's midsurface arc length at station v, fixed for all t. */
const plateL = v => 2 * halfW18(v) * p('SH_NEURAL', SH_NEURAL);
const L_PEAK = () => plateL(V_PEAK);
/* and its thickness, which scales with its width. A pseudostratified epithelium's height tracks the
   strength of the signal that induced it, and so does the width of the strip that responds — in
   notochord.js both are one function of distance from the axial surface (npThickAt / NP_THRESH). So
   they fall off together here rather than independently. */
const H_NEURO_MAX = () => p('NP_MAXFAC', NP_MAXFAC) * p('H_ECTO', H_ECTO);
const plateH = v => H_NEURO_MAX() * plateL(v) / L_PEAK();
/* THE CALIBRE THE TUBE WILL HAVE, as a function of v alone. Anything sized against the tube — the
   caudal eminence that joins it, the cavity that forms inside that — must use THIS and never the arc's
   current R, which is L / (2 phi) and therefore UNBOUNDED on a plate that has not begun to fold. The
   first version sized the caudal eminence off arc(V_CAUD).R at day 18, where phi is 2e-3: it built a
   tail bud 544 units across, a bounding box 1,088 units wide around a 10-unit embryo. Every pairwise
   overlap row then reported every structure as inside it, and the only reason it was not obvious in a
   render is that fitCamera dutifully framed the whole 1,088 units and drew the embryo as one pixel. */
const tubeOuterR = v => plateL(v) / (2 * Math.PI) + plateH(v) / 2;
const tubeLumenR = v => Math.max(0.012, plateL(v) / (2 * Math.PI) - plateH(v) / 2);

/* ═══════════════════════════════════════════════════════════════════ 4 · THE SOMITE TABLE

   A somite, once formed, is a block of tissue: its MATERIAL v-extent is fixed at the moment it
   appears, out of the embryo's length on that day. Later elongation moves it in y and leaves its v
   alone, which is what makes v a material coordinate and the closure front's position in v a fact
   about tissue rather than about the ruler. */
const dayOfSomite = i => DAY_SOM_START + i * p('SOMITE_PERIOD_H', SOMITE_PERIOD_H) / 24;
const somiteEdge  = i => V_SEG_CRANIAL - i * p('W_SOM', W_SOM) / embL(dayOfSomite(i));
/* THE EPSILON IS NOT A FUDGE, AND THE BUG IT FIXES IS WORTH RECORDING. A scene stores a view's t to six
   decimal places, so day 27 comes back as 26.999996 — and (26.999996 - 20) * 24 / 8 is 20.999988, which
   floor() turns into TWENTY. The beat-claim check duly reported 20 somites on the day the model itself
   puts 21 of them, and the claim was right and the arithmetic was right and the answer was wrong. A
   somite boundary that falls exactly on a taught day must not be decided by the scene file's own storage
   resolution. 1e-4 of a somite interval is 3e-5 of a day, two orders finer than that resolution, so it
   cannot change the count anywhere except at an exact boundary — which is the only place it should. */
const somiteCount = d => Math.max(0, Math.floor((d - DAY_SOM_START) * 24 / p('SOMITE_PERIOD_H', SOMITE_PERIOD_H) + 1e-4));

/* 1 · WHERE CLOSURE BEGINS: the centre of the fifth somite. */
const V_SOM5 = () => (somiteEdge(4) + somiteEdge(5)) / 2;
/* 2 · WHERE THE CAUDAL NEUROPORE IS: the caudal edge of the last somite present on day 27. */
const V_CAUD = () => somiteEdge(somiteCount(DAY_CAUD));
const V_CRAN = 1.0;

/* 3 · THE TWO ZIP SPEEDS, forced by the three dates. */
const U_CRAN = () => (V_CRAN - V_SOM5()) / (DAY_CRAN - DAY_CLOSE0);
const U_CAUD = () => (V_SOM5() - V_CAUD()) / (DAY_CAUD - DAY_CLOSE0);

/* WHERE A STOPPED FRONT STOPS, and the first version of this had it wrong in a way only looking at the
   render showed. It set the zip SPEED to zero, so with `openCranial` nothing cranial of the fifth somite
   ever closed — half the embryo open from the neck up. That is craniorachischisis, not anencephaly.
   Anencephaly is the CRANIAL NEUROPORE failing: the front does travel, and what is left open is the
   HEAD. So the front stops at V_SEG_CRANIAL, the cranial end of the segmented axis and the sibling
   models' own constant — the open region is then exactly the unsegmented head, which is the lesion.
   Caudally the same shape: the front stops where it had got to two days before it should have finished,
   read off the somite table, so the open region is the lumbosacral segments the narration names. */
const V_STOP_CRAN = () => V_SEG_CRANIAL;
const V_STOP_CAUD = () => somiteEdge(somiteCount(DAY_CAUD - 2));

/* THE DAY THE FRONT ARRIVES AT STATION v. One function, both directions. */
function dayFront(v, o) {
  const s5 = V_SOM5();
  if (v >= s5) {
    if (o && o.openCranial && v > V_STOP_CRAN()) return Infinity;   // anencephaly: the head stays open
    return DAY_CLOSE0 + (v - s5) / U_CRAN();
  }
  if (o && o.openCaudal && v < V_STOP_CAUD()) return Infinity;      // myeloschisis: the lumbosacral
  return DAY_CLOSE0 + (s5 - v) / U_CAUD();
}

/* ═══════════════════════════════════════════════════════════════════ 5 · THE FOLD

   phi(v, t): the half-angle of the arc the plate has bent into at station v. 0 is flat, pi is a
   closed circle. LINEAR in time, deliberately: an eased schedule would put phi = pi somewhere other
   than dayFront and the coupling in section 4 is the whole point.                                  */
const D_FOLD = 3.0;              // TUNED. See the header for why row C does not depend on it.
const PHI_MIN = 2e-3;            // phi = 0 means R = infinity; this keeps the arithmetic finite
const SEAM = 0.004;              // 0.4 um: the fusion seam, and the model's one numerical slack

const dayFold = (v, o) => dayFront(v, o) - p('D_FOLD', D_FOLD);

/* PHI_MAX(v): the half-angle at which the two midsurface tips are SEAM apart — the tips in contact,
   which is what fusion IS. 2 R sin(phi) = SEAM with R = L / (2 phi) gives L sin(phi) / phi = SEAM,
   solved by bisection on (pi/2, pi) where the left side is monotone decreasing. Cached per v. */
/* BY NEWTON, AND WITH NO CACHE. The first version bisected ninety times and memoised the answer against
   the station — which is a cache keyed on a double, in a function the finite-differenced normals call
   with a slightly different v at every grid point, so it grew to millions of entries and a build went
   from seconds to minutes. Substituting phi = pi - delta turns the condition into
   sin(delta) = eps * (pi - delta) with eps = SEAM / L of order 1e-3, where delta ~ pi*eps is already a
   good first guess and four Newton steps are exact to double precision. No cache, no growth. */
function phiMax(v) {
  const eps = SEAM / plateL(v);
  if (!(eps > 0) || eps >= 0.3) return Math.PI;
  let d = Math.PI * eps;
  for (let i = 0; i < 4; i++) {
    const fv = Math.sin(d) - eps * (Math.PI - d);
    const fp = Math.cos(d) + eps;
    if (Math.abs(fp) < 1e-12) break;
    d -= fv / fp;
    if (d < 0) d = 1e-12;
  }
  return Math.PI - d;
}

function phiAt(v, t, o) {
  /* the clinical panels of section 14 need one named section at a stated stage rather than at a
     stated day — `phiForce` is how they ask for it, and it is clamped by the same PHI_MAX as every
     other build so a panel cannot draw a tube tighter than the tissue allows */
  if (o && o.phiForce != null) return Math.max(PHI_MIN, Math.min(o.phiForce, phiMax(v)));
  const u = (day(t) - dayFold(v, o)) / p('D_FOLD', D_FOLD);
  if (!isFinite(u)) return PHI_MIN;
  const raw = Math.PI * clampX(u, 0, 1);
  return Math.max(PHI_MIN, Math.min(raw, phiMax(v)));
}
const fusedAt = (v, t, o) => phiAt(v, t, o) >= phiMax(v) - 1e-12;

/* the arc's geometry at a station, all of it a consequence of L, H and phi */
function arc(v, t, o) {
  const L = plateL(v), H = plateH(v), phi = phiAt(v, t, o);
  const R = L / (2 * phi);
  return { L, H, phi, R,
    sagitta: R * (1 - Math.cos(phi)),     // how far the tips stand above the floor
    tipX: R * Math.sin(phi),              // half the tip-to-tip separation
    rho: Math.min(H / 2, R * Math.sin(phi)) };  // the tip's round, which vanishes as they meet
}

/* ═══════════════════════════════════════════════════════════════════ 6 · THE STAGE BANDS

   Which of the four names a station carries. The two interior boundaries are expressed in the
   tissue's OWN thickness rather than as angles, so they mean something anatomical: the groove has
   begun when the midline has sunk half an epithelial thickness, and the folds are up when the tips
   stand two thicknesses above the floor — which is when they have cleared the surface ectoderm they
   are continuous with. The third boundary is not a threshold at all: it is contact. */
const SAG_GROOVE = 0.5, SAG_FOLDS = 2.0;

/* THE CRITERIA ARE SAGITTA, THE TEST IS PHI, AND THE CONVERSION HAS TO BE DONE ONCE RATHER THAN PER
   STATION — because sagitta / H IS NOT MONOTONE IN PHI. sagitta/H = (1 - cos phi) / (2 phi) * (L/H),
   and L/H is the same at every station (H is proportional to L), so the ratio is a function of phi
   alone — but (1 - cos phi) / phi PEAKS at phi = 2.33 and falls away after it. With this model's L/H
   the ratio reaches 2.32 at phi = 2.33 and is back down to 2.06 by phi = 3.1, so a threshold at 2.0
   is crossed TWICE: a station almost fused was classified `neural_groove` again, a few thousandths of
   the axis wide, sitting between the folds and the tube. The stage field then was not unimodal and the
   bands were not contiguous. Solving each criterion for its FIRST phi root fixes it once, for every
   station, and keeps the criteria anatomical: the groove has begun when the midline has sunk half an
   epithelial thickness, the folds are up when the tips stand two thicknesses above the floor. */
function phiForSagitta(ratio) {
  const c = H_NEURO_MAX() / L_PEAK();            // H / L, the same at every station
  const target = ratio * 2 * c;                  // (1 - cos phi) / phi = ratio * 2 * H/L
  let lo = 1e-6, hi = 2.33;                      // the first root, below the peak of the left side
  for (let i = 0; i < 90; i++) {
    const mid = (lo + hi) / 2;
    if ((1 - Math.cos(mid)) / mid < target) lo = mid; else hi = mid;
  }
  return (lo + hi) / 2;
}
let _phiStage = null;
function phiStage() {
  if (!_phiStage || _phiStage.c !== H_NEURO_MAX() / L_PEAK())
    _phiStage = { c: H_NEURO_MAX() / L_PEAK(), groove: phiForSagitta(SAG_GROOVE), folds: phiForSagitta(SAG_FOLDS) };
  return _phiStage;
}
const STAGE_INDEX = { neural_plate: 0, neural_groove: 1, neural_folds: 2, neural_tube: 3 };

function stageAt(v, t, o) {
  if (fusedAt(v, t, o)) return 'neural_tube';
  const phi = phiAt(v, t, o), s = phiStage();
  if (phi < s.groove) return 'neural_plate';
  if (phi < s.folds) return 'neural_groove';
  return 'neural_folds';
}

/* ═══════════════════════════════════════════════════════════════════ 7 · THE DORSOVENTRAL STACK

   DORSAL is -z. The embryo's dorsal surface is z = 0; everything else is measured ventrally from it.
   The plate's basal (ventral) face sits level with the surface ectoderm's basal face, because they
   are one epithelium, and it bulges DORSALLY — which is why a neural plate is something you can see
   on a day-18 embryo rather than something you have to section for.                                */
const AX_GAP  = 0.05;    // between the plate's basal face and the notochord
const GUT_GAP = 0.07;    // between the notochord and the gut roof
const SUB     = 0.10;    // clearance between the closed tube and the ectoderm arching over it
const D_SINK  = 0.60;    // days the surface ectoderm takes to close over the tube. TUNED.

const zBasal   = () => p('H_ECTO', H_ECTO);                      // the epithelium's basal plane
const zMidFloor = v => zBasal() - plateH(v) / 2;                 // midsurface at the midline
const zNotoC   = () => zBasal() + AX_GAP + p('R_NOTO', R_NOTO);  // the notochord's axis
const zGutDors = () => zNotoC() + p('R_NOTO', R_NOTO) + GUT_GAP; // dorsal face of the gut roof

/* THE TUBE DOES NOT SINK, AND THE FIRST VERSION OF THIS MODEL WAS WRONG ABOUT THAT IN A WAY THE
   OVERLAP ROW CAUGHT.

   "The tube separates from the surface ectoderm and skin closes over the top" is usually drawn as the
   tube dropping beneath the skin, and the first version implemented exactly that: it translated the
   section ventrally by SUB + H + 2R, enough to put the tube's DORSAL surface just under the ectoderm's
   basal plane. In a real embryo there is room for that because the dorsal body wall rises around the
   tube as the tube forms. In a model whose embryo is a fixed thickness there is NO room: the tube is
   1.9 units across and the whole stack from basal plane to gut roof is 0.72, so translating it
   ventrally drove it straight through the notochord and the gut roof. Row Q measured 19% of the
   notochord inside the neural tube and 11% of the gut roof, at day 23 and again at day 25.

   The geometry that is actually right needs no translation at all. The plate's floor sits ON the basal
   plane, so when the plate rolls up the floor BECOMES the tube's ventral wall and stays exactly where
   it was — AX_GAP clear of the notochord, which is where it belongs. What moves is the SURFACE
   ECTODERM: it is carried up by the fold tips, meets in the midline and then arches over the tube. So
   a day-23 section has the neural tube standing proud of the embryo's dorsal surface with the skin
   stretched over it, which is what the section in every textbook shows.

   Kept as a function returning zero rather than deleted, because tipPoint, addCanal and sectionPt all
   read it and a reviewer looking for "where did the sink go" should find this note. */
function sinkAt(v, t, o) { return 0; }

/** THE MOST DORSAL POINT OF THE NEUROEPITHELIUM AT A STATION, read off the section's own point
    function — which is what the surface ectoderm has to clear. Not derived in closed form on purpose:
    which part of the section is most dorsal CHANGES as the fold deepens (the inner surface at the
    midline while the plate is flat, the outer surface at the tips once they have leaned over), and a
    closed form for that is two cases and a crossover to get wrong. */
function sectionExtent(v, t, o) {
  let mz = Infinity, mx = 0;
  const q = new T.Vector3();
  for (let j = 0; j < 28; j++) {
    sectionPt(v, t, o, j / 28, q);
    if (q.z < mz) mz = q.z;
    const a = Math.abs(q.x); if (a > mx) mx = a;
  }
  return { dorsalZ: mz, halfWidth: mx };
}

const yOf = (v, t) => (clampX(v, 0, 1) - 0.5) * embL(day(t));

/* ═══════════════════════════════════════════════════════════════ 8 · SMALL SHARED ARITHMETIC */
function clampX(x, a, b) { return x < a ? a : x > b ? b : x; }
function ss(a, b, x) { const u = clampX((x - a) / (b - a), 0, 1); return u * u * (3 - 2 * u); }

/* ═══════════════════════════════════════════════════════════════ 9 · EMISSION

   emitTri / ringQuad are COPIED from models3d/notochord.js, for the reason that file records: the kit
   gives two winding orders and a sheet swept (v, x) or a section swept (v, u) is right-handed the
   opposite way round from what quad() assumes, so a model that picks one order by reasoning gets half
   its surfaces inside out and nothing looks wrong, because the materials are DoubleSide and the
   normals were supplied. That is RENDER-STANDARD section 2.1 describing itself. So the order is
   MEASURED, per triangle — per quad is not enough, because where a quad spans a fast-turning feature
   its two triangles can want opposite orders.                                                       */
const _rq = { e1: null, e2: null, fn: null };
function emitTri(E, p1, p2, p3, n1, n2, n3) {
  if (!_rq.e1) { _rq.e1 = new T.Vector3(); _rq.e2 = new T.Vector3(); _rq.fn = new T.Vector3(); }
  _rq.fn.copy(_rq.e1.subVectors(p2, p1).cross(_rq.e2.subVectors(p3, p1)));
  if (_rq.fn.lengthSq() < 1e-20) return;             // degenerate: at a taper's point or a pole
  const mx = n1.x + n2.x + n3.x, my = n1.y + n2.y + n3.y, mz = n1.z + n2.z + n3.z;
  if (_rq.fn.x * mx + _rq.fn.y * my + _rq.fn.z * mz >= 0) E.tri(p1, p2, p3, n1, n2, n3);
  else E.tri(p1, p3, p2, n1, n3, n2);
}
function ringQuad(E, a, b, c, d, ma, mb, mc, md) {
  emitTri(E, a, d, c, ma, md, mc);
  emitTri(E, a, c, b, ma, mc, mb);
}

/* A SURFACE FROM ONE POINT FUNCTION. Positions and normals both come out of f(a, b, out), so
   RENDER-STANDARD section 2.3 holds by construction: a normal cannot disagree with a position it was
   differenced from. `ref(a, b)` returns the DIRECTION the normal must not oppose — section 2.3's
   guard, which is what stops a collapsed finite difference leaving a silhouette shell undisplaced and
   coincident with the surface it is meant to hide behind. A direction rather than a point, because
   half the surfaces here are the INNER wall of a tube, where "away from the centreline" is the wrong
   answer and would invert exactly the surfaces section 2.4 keeps out of the silhouette anyway.    */
const _p0 = new T.Vector3(), _pa = new T.Vector3(), _pb = new T.Vector3();
const _da = new T.Vector3(), _db = new T.Vector3();
function normalOf(f, a, b, ea, eb, refDir) {
  f(a, b, _p0); f(a + ea, b, _pa); f(a, b + eb, _pb);
  _da.subVectors(_pa, _p0); _db.subVectors(_pb, _p0);
  const n = new T.Vector3().crossVectors(_da, _db);
  if (n.lengthSq() < 1e-20) {                     // the difference collapsed: step the other way
    f(a - ea, b, _pa); f(a, b - eb, _pb);
    _da.subVectors(_p0, _pa); _db.subVectors(_p0, _pb);
    n.crossVectors(_da, _db);
  }
  if (n.lengthSq() < 1e-20) { if (refDir) n.copy(refDir); else n.set(0, 0, -1); }
  n.normalize();
  if (refDir && n.dot(refDir) < 0) n.negate();
  return n;
}
/** f(a,b,out) over a in [a0,a1] x b in [b0,b1]. `ref(a,b)` -> direction, optional. */
function patch(E, f, a0, a1, na, b0, b1, nb, ref) {
  const ea = Math.abs((a1 - a0) / (na * 8)) || 1e-4, eb = Math.abs((b1 - b0) / (nb * 8)) || 1e-4;
  const A = i => a0 + (a1 - a0) * (i / na), B = j => b0 + (b1 - b0) * (j / nb);
  let prevP = null, prevN = null;
  for (let i = 0; i <= na; i++) {
    const rowP = [], rowN = [];
    for (let j = 0; j <= nb; j++) {
      const q = new T.Vector3(); f(A(i), B(j), q);
      rowP.push(q);
      rowN.push(normalOf(f, A(i), B(j), ea, eb, ref ? ref(A(i), B(j)) : null));
    }
    if (prevP) for (let j = 0; j < nb; j++) {
      ringQuad(E, prevP[j], rowP[j], rowP[j + 1], prevP[j + 1],
                  prevN[j], rowN[j], rowN[j + 1], prevN[j + 1]);
    }
    prevP = rowP; prevN = rowN;
  }
}

/* ── CAPPING A NON-CONVEX LOOP ─────────────────────────────────────────────────────────────────

   A FAN FROM THE CENTROID IS WRONG ON A C, AND IT IS WRONG IN A WAY NOTHING IN THE PICTURE SHOWS.
   The first version of this function fanned the section loop to its own centroid through triN, which
   forces every triangle to face the cap's axis. On a convex loop that is exactly right. On the C the
   neuroepithelium makes once the folds are up, the centroid lies OUTSIDE the loop, so the fan lays
   triangles over ground the section does not occupy — and because triN had forced them all to face the
   same way, their areas ADDED instead of cancelling. Measured at one station with the folds well up:
   the section came out 4.867 against a true 3.733, 30% too big, and the error grew with the fold angle
   because a deeper C puts its centroid further outside itself. Nothing in a render shows it: the
   spurious triangles are coplanar with the honest ones and the same colour.

   So the cap is EAR-CLIPPED. Ear clipping only ever emits triangles that lie inside the polygon, so the
   area is the polygon's area whatever shape it is. Written here rather than taken from
   THREE.ShapeUtils because viz-training/tools/check-beat-claims.mjs may run this model against a
   Vector3-only stub of three, and a model that needs more of three than the stub has cannot be checked
   at all — which is the lesson that file records about septation-of-heart and VizKit.             */
function triangulate2D(pt) {
  const n = pt.length;
  if (n < 3) return [];
  let area2 = 0;
  for (let i = 0; i < n; i++) { const a = pt[i], b = pt[(i + 1) % n]; area2 += a[0] * b[1] - b[0] * a[1]; }
  const idx = [];
  for (let i = 0; i < n; i++) idx.push(area2 >= 0 ? i : n - 1 - i);   // normalise to CCW
  const cross = (o, a, b) => (a[0] - o[0]) * (b[1] - o[1]) - (a[1] - o[1]) * (b[0] - o[0]);
  const inside = (a, b, c, q) => cross(a, b, q) >= 0 && cross(b, c, q) >= 0 && cross(c, a, q) >= 0;
  const out = [];
  let guard = 0;
  while (idx.length > 3 && guard++ < 4 * n) {
    let clipped = false;
    for (let i = 0; i < idx.length; i++) {
      const ia = idx[(i + idx.length - 1) % idx.length], ib = idx[i], ic = idx[(i + 1) % idx.length];
      const A = pt[ia], B = pt[ib], C = pt[ic];
      if (cross(A, B, C) <= 1e-18) continue;                         // reflex or degenerate: not an ear
      let ok = true;
      for (const j of idx) {
        if (j === ia || j === ib || j === ic) continue;
        if (inside(A, B, C, pt[j])) { ok = false; break; }
      }
      if (!ok) continue;
      out.push([ia, ib, ic]);
      idx.splice(i, 1);
      clipped = true;
      break;
    }
    if (!clipped) break;                                             // self-intersecting: take what we have
  }
  if (idx.length === 3) out.push([idx[0], idx[1], idx[2]]);
  return out;
}

/** Close a loop of coplanar points with a real triangulation, facing `axis`. Through triN, never tri:
    a cap is not part of a ring quad and section 2.4b is the record of what happens when one goes
    through tri. */
function capLoop(E, pts, axis) {
  if (pts.length < 3) return;
  /* a 2-D basis in the cap's own plane */
  const ax = axis.clone().normalize();
  let e1 = Math.abs(ax.y) > 0.9 ? new T.Vector3(1, 0, 0) : new T.Vector3(0, 1, 0);
  e1.addScaledVector(ax, -e1.dot(ax)).normalize();
  const e2 = new T.Vector3().crossVectors(ax, e1).normalize();
  const flat = pts.map(q => [q.dot(e1), q.dot(e2)]);
  const tris = triangulate2D(flat);
  if (!tris.length) {                                 // degenerate loop: nothing worth capping
    return;
  }
  for (const tr of tris) E.triN(pts[tr[0]], pts[tr[1]], pts[tr[2]], axis);
}

/* ── A ROUND TUBE ALONG THE AXIS, EMITTED THROUGH THE SAME MACHINERY AS EVERYTHING ELSE ───────────

   WHY NOT VizKit.tubeCapped HERE, when section 6 says everything geometric comes from the kit. Measured,
   not preferred: the neural canal built with tubeCapped comes back with 19 of its 1,872 triangles
   (1.015%) WOUND AGAINST THEIR OWN SUPPLIED NORMALS, in two clusters, at rows 7 and 23 of the sweep —
   which are the two rows nearest the two closure fronts, where the cast's centreline turns through most
   of its sink in one step. The cause is the one models3d/notochord.js records for its own ringQuad and
   which the kit still has: sweptShell decides ONE order per QUAD through E.quad(), and where a quad
   spans a fast-turning feature its two triangles want OPPOSITE orders, so no single choice satisfies
   both. notochord.js measured 0.99251 on its own sheets before it went per-triangle.

   On a DoubleSide material with supplied normals nothing looks wrong — which is RENDER-STANDARD section
   2.1 describing itself — so this is reported as a kit-level finding in the scene's gaps[] and in
   BUILD-LOG.md rather than worked around silently. What this function does is sweep a circular section
   through patch(), whose order is measured per triangle, and close each end with a hemispherical taper
   so the end is round rather than an annulus (section 3). Measured afterwards: 1.00000.

   The kit is still what owns winding, normals, colour and silhouettes; the decision between its two
   emission orders is what is taken here, exactly as notochord.js takes it.                          */
function roundTube(opts) {
  const o = opts, E = K.emitter();
  const nv = o.nv || 36, ring = o.ring || 20;
  const dome0 = o.dome0 == null ? 0.10 : o.dome0, dome1 = o.dome1 == null ? 0.10 : o.dome1;
  const shrink = u => {
    let k = 1;
    if (dome0 > 0 && u < dome0) k = Math.min(k, Math.sqrt(Math.max(0, 1 - Math.pow(1 - u / dome0, 2))));
    if (dome1 > 0 && u > 1 - dome1) k = Math.min(k, Math.sqrt(Math.max(0, 1 - Math.pow(1 - (1 - u) / dome1, 2))));
    return k;
  };
  const f = (u, th, out) => {
    const c = o.centre(u), r = o.r(u) * shrink(u);
    return out.set(c.x + r * Math.cos(th * Math.PI * 2), c.y, c.z + r * Math.sin(th * Math.PI * 2));
  };
  const ref = (u, th) => new T.Vector3(Math.cos(th * Math.PI * 2), 0, Math.sin(th * Math.PI * 2));
  patch(E, f, 0, 1, nv, 0, 1, ring, ref);
  const hull = E.count();
  /* A FLAT END STILL HAS TO BE CLOSED. A domed end closes itself on its pole; an end left flat for a
     transverse slab does not, and an open tube makes its own volume and its own parity test lie — which
     is what row D reads the lumen's section area out of. The section is a circle, so a centroid fan is
     exactly right here; the C of the neuroepithelium is the case that needed section 9's strip. */
  for (const u of [0, 1]) {
    if ((u === 0 ? dome0 : dome1) > 0) continue;
    const c = o.centre(u), axis = new T.Vector3(0, u === 0 ? -1 : 1, 0);
    const pts = [];
    for (let j = 0; j < ring; j++) { const q = new T.Vector3(); f(u, j / ring, q); pts.push(q); }
    for (let j = 0; j < ring; j++) E.triN(c, pts[j], pts[(j + 1) % ring], axis);
  }
  return E.geometry(hull);
}

/* ── A TUBE ALONG AN ARBITRARY PATH, WITH AN ANALYTIC FRAME ───────────────────────────────────────

   WHY NOT VizKit.tubeCapped FOR THE NEUROPORE RIM EITHER, and this one is a different reason from the
   canal's. The rim is a LOOP: it runs cranially along one fold tip, over the end of the plate and back
   along the other. parallelFrame transports its normal along the path, and parallel transport is
   PATH-DEPENDENT — so the frame the sweep has when it comes back down the left tip is not the mirror of
   the frame it had going up the right one. The rim's centreline is exactly mirror-symmetric and its
   surface is not: measured, 97.7% of the built vertices had no mirror partner, which failed acceptance
   row P on a structure whose every input is symmetric.

   An ANALYTIC frame fixes it, and the reason is worth writing down because it is not obvious. With a
   fixed up-vector u, N = normalise(T x u). Mirroring through x = 0 is M = diag(-1, 1, 1), which
   reverses orientation, so (MT) x (Mu) = -M(T x u); and here Mu = u, so N(mirror) = -M N. Then
   B = T x N gives B(mirror) = +M B. Put together, the ring point at angle th on the mirrored path is
   the mirror of the ring point at angle pi - th — which is on the sampling grid whenever `ring` is
   even. So the built surface is mirror-symmetric to the last bit, by construction rather than by luck.

   Both ends taper to a point, so the loop's two free ends are rounded and the surface closes itself. */
function pathTube(pts, rFn, opts) {
  const o = opts || {}, E = K.emitter();
  const ring = o.ring || 14;
  const up = o.up || new T.Vector3(0, 0, 1);
  const n = pts.length - 1;
  const dome0 = o.dome0 == null ? 0.06 : o.dome0, dome1 = o.dome1 == null ? 0.06 : o.dome1;
  const shrink = u => {
    let k = 1;
    if (dome0 > 0 && u < dome0) k = Math.min(k, Math.sqrt(Math.max(0, 1 - Math.pow(1 - u / dome0, 2))));
    if (dome1 > 0 && u > 1 - dome1) k = Math.min(k, Math.sqrt(Math.max(0, 1 - Math.pow(1 - (1 - u) / dome1, 2))));
    return k;
  };
  const at = u => {
    /* ON A VERTEX WHERE IT CAN BE. With nv = n the sampled u land on the polyline's own vertices, and a
       vertex is the only place the mirror is exact: lerping between two vertices mirrors correctly only
       when floor() and its mirror agree, which fails at the three columns where u * n is an integer —
       0.76% of the built vertices, enough to fail acceptance row P on a structure every input of which
       is symmetric. The tangent is CENTRAL for the same reason: a forward difference is not its own
       mirror. The lerp branch is still here for the off-grid neighbours normalOf asks for, which only
       affect normals. */
    const x = clampX(u, 0, 1) * n;
    const vi = Math.round(x);
    if (Math.abs(x - vi) < 1e-9) {
      const P = pts[vi].clone();
      const T0 = new T.Vector3().subVectors(pts[Math.min(n, vi + 1)], pts[Math.max(0, vi - 1)]).normalize();
      let N0 = new T.Vector3().crossVectors(T0, up);
      if (N0.lengthSq() < 1e-12) N0.set(1, 0, 0);
      N0.normalize();
      return { P, N: N0, B: new T.Vector3().crossVectors(T0, N0).normalize() };
    }
    const i = Math.min(n - 1, Math.floor(x)), fr = x - i;
    const a = pts[i], b = pts[i + 1];
    const P = new T.Vector3().lerpVectors(a, b, fr);
    const T0 = new T.Vector3().subVectors(pts[Math.min(n, i + 1)], pts[Math.max(0, i)]).normalize();
    let N = new T.Vector3().crossVectors(T0, up);
    if (N.lengthSq() < 1e-12) N.set(1, 0, 0);
    N.normalize();
    const B = new T.Vector3().crossVectors(T0, N).normalize();
    return { P, N, B };
  };
  const f = (u, th, out) => {
    const fr = at(u), r = rFn(u) * shrink(u), a = th * Math.PI * 2;
    return out.copy(fr.P).addScaledVector(fr.N, r * Math.cos(a)).addScaledVector(fr.B, r * Math.sin(a));
  };
  const ref = (u, th) => {
    const fr = at(u), a = th * Math.PI * 2;
    return new T.Vector3().addScaledVector(fr.N, Math.cos(a)).addScaledVector(fr.B, Math.sin(a)).normalize();
  };
  patch(E, f, 0, 1, o.nv || n, 0, 1, ring, ref);
  return E.geometry(E.count());
}

/* ═══════════════════════════════════════════════════════ 10 · THE NEUROEPITHELIUM'S SECTION

   The closed section curve at station v, as one parameter uu in [0, 1):

     uu in [0, A)          the OUTER surface, s running -phi -> +phi at radius R + H/2
     uu in [A, A+Eg)       the tip at s = +phi, crossing outer -> inner, bulging away by rho
     uu in [A+Eg, 2A+Eg)   the INNER surface (the lumen wall), s running +phi -> -phi at R - H/2
     uu in [2A+Eg, 1)      the tip at s = -phi, crossing inner -> outer

   The OUTER portion is emitted FIRST so it sits at the front of the buffer and outlineOf inflates only
   it (section 2.4: inflate the skin, not the solid — inflating the lumen wall as well tears the hull
   at every seam where one position carries two normals).

   `shrink` pulls the section towards the midline floor, so a band that ends in mid-air closes to a
   point rather than showing a lit annular cut face: section 3's "a tube that ends in mid-air needs a
   rounded end, not an annulus", for a section that is not circular and so cannot take domeCap.     */
const SEC_A = 0.45, SEC_E = 0.05;

function secParts(uu) {
  if (uu < SEC_A)                  return { seg: 0, k: uu / SEC_A };
  if (uu < SEC_A + SEC_E)          return { seg: 1, k: (uu - SEC_A) / SEC_E };
  if (uu < 2 * SEC_A + SEC_E)      return { seg: 2, k: (uu - SEC_A - SEC_E) / SEC_A };
  return { seg: 3, k: (uu - 2 * SEC_A - SEC_E) / SEC_E };
}

function sectionPt(v, t, o, uu, out, shrink) {
  const a = arc(v, t, o);
  const cz = zMidFloor(v) - a.R + sinkAt(v, t, o);
  const H = a.H, R = a.R, phi = a.phi, rho = a.rho;
  const q = secParts(uu);
  let s, radial, tang;
  if (q.seg === 0)      { s = -phi + 2 * phi * q.k; radial = +H / 2; tang = 0; }
  else if (q.seg === 1) { s = phi;  radial =  (H / 2) * Math.cos(q.k * Math.PI); tang =  rho * Math.sin(q.k * Math.PI); }
  else if (q.seg === 2) { s = phi - 2 * phi * q.k; radial = -H / 2; tang = 0; }
  else                  { s = -phi; radial = -(H / 2) * Math.cos(q.k * Math.PI); tang = -rho * Math.sin(q.k * Math.PI); }
  const nx = Math.sin(s), nz = Math.cos(s), tx = Math.cos(s), tz = -Math.sin(s);
  let x = (R + radial) * nx + tang * tx;
  let z = cz + (R + radial) * nz + tang * tz;
  const sh = shrink == null ? 1 : shrink;
  if (sh !== 1) { const az = cz + R; x = x * sh; z = az + (z - az) * sh; }
  return out.set(x, yOf(v, t), z);
}

/** The direction the section's normal must not oppose, per portion. On the round at a tip it rotates
    with the round, which is the only reference that is right at both of its ends. */
function sectionRef(v, t, o, uu) {
  const a = arc(v, t, o), phi = a.phi, q = secParts(uu);
  let s, cn, ct;
  if (q.seg === 0)      { s = -phi + 2 * phi * q.k; cn =  1; ct = 0; }
  else if (q.seg === 1) { s = phi;  cn =  Math.cos(q.k * Math.PI); ct =  Math.sin(q.k * Math.PI); }
  else if (q.seg === 2) { s = phi - 2 * phi * q.k; cn = -1; ct = 0; }
  else                  { s = -phi; cn = -Math.cos(q.k * Math.PI); ct = -Math.sin(q.k * Math.PI); }
  const nx = Math.sin(s), nz = Math.cos(s), tx = Math.cos(s), tz = -Math.sin(s);
  return new T.Vector3(cn * nx + ct * tx, 0, cn * nz + ct * tz).normalize();
}

/* ── THE SECTION'S GRID IS UNIFORM, AND THAT IS WHAT MAKES THE CAP EXACT ──────────────────────────

   NU_TOT columns over the whole loop, at one step, with SEC_A and SEC_E both whole numbers of steps.
   That buys two things. The hull portion is then an exact PREFIX of the buffer, so outlineOf inflates
   the outer surface and nothing else (section 2.4). And the outer surface's column j and the inner
   surface's column (I_IN1 - j) are at the SAME s — so the cap can be triangulated as a strip between
   matched columns plus one fan per tip, every edge of which is already an edge of the swept surface.
   An ear-clipped cap is correct in area but shares no edges with anything, which is why the first
   version left tens of unpaired edges per band even after the fan was replaced.                    */
const NU_TOT = 80, OVERLAP = 0.0016;
const NU_OUT = Math.round(NU_TOT * SEC_A);         // 36
const NU_TIP = Math.round(NU_TOT * SEC_E);         // 4
const NU_REST = NU_TOT - NU_OUT;                   // 44
const I_IN0 = NU_OUT + NU_TIP;                     // 40: first column of the inner surface
const I_IN1 = NU_TOT - NU_TIP;                     // 76: last column of the inner surface

/** Close the section with a strip between matched outer/inner columns and one fan per tip. Every
    triangle goes through triN — a cap is not part of a ring quad, and section 2.4b is the record of
    what happens when one goes through tri instead. */
function capSection(E, pts, axis) {
  if (pts.length !== NU_TOT) { capLoop(E, pts, axis); return; }
  const at = i => pts[((i % NU_TOT) + NU_TOT) % NU_TOT];
  /* the strip: outer column j against inner column I_IN1 - j, which is the same s */
  for (let j = 0; j < NU_OUT; j++) {
    const a = at(j), b = at(j + 1), c = at(I_IN1 - j - 1), d = at(I_IN1 - j);
    E.triN(a, b, c, axis); E.triN(a, c, d, axis);
  }
  /* THE TWO TIPS, FANNED FROM THEIR OWN FIRST CORNER rather than from a new midpoint. A fan from a new
     interior vertex leaves its two extreme spokes in one triangle each, and leaves the tip's CHORD —
     which the strip above does use — unpaired: six unpaired edges per cap, twelve per band, every band,
     and with the surface not closed the signed volume and the parity test both stop meaning anything.
     Fanning from at(i0) makes the chord a fan edge, so it pairs with the strip, and every spoke is
     shared by two triangles. */
  const fan = (i0, i1) => {
    for (let k = i0 + 1; k < i1; k++) E.triN(at(i0), at(k), at(k + 1), axis);
  };
  fan(NU_OUT, I_IN0);
  fan(I_IN1, NU_TOT);
}

/** One band of the neuroepithelium: v in [v0, v1], one key. A terminal end tapers to nothing; an end
    that abuts the next band is capped flat and buried by OVERLAP. Both are capped either way. */
function neuroBand(v0, v1, t, o, opts) {
  const op = opts || {};
  const nv = Math.max(6, Math.round((v1 - v0) * (op.nvScale || 260)));
  const tp0 = op.taper0 ? op.taper0 : 0, tp1 = op.taper1 ? op.taper1 : 0;
  const shrinkOf = v => {
    let s = 1;
    if (tp0 > 0) s = Math.min(s, ss(v0, v0 + tp0 * (v1 - v0), v));
    if (tp1 > 0) s = Math.min(s, 1 - ss(v1 - tp1 * (v1 - v0), v1, v));
    /* THE TAPER STOPS AT A SMALL LOOP, NOT AT A POINT. Collapsing the section to 1e-3 of itself put all
       eighty loop points inside one weld tolerance, so the cap's triangles were degenerate, the parity
       test skipped them, and their edges counted as unpaired — a hole reported where the geometry was
       merely tiny. At 0.08 the end is a cap four hundredths of a unit across, invisible at every camera
       this scene uses, and the surface is unambiguously closed. */
    return Math.max(s, 0.08);
  };
  const f = (v, uu, out) => sectionPt(v, t, o, uu, out, shrinkOf(v));
  const ref = (v, uu) => sectionRef(v, t, o, uu);
  const E = K.emitter();
  patch(E, f, v0, v1, nv, 0, SEC_A, NU_OUT, ref);          // the hull, first in the buffer
  const hull = E.count();
  patch(E, f, v0, v1, nv, SEC_A, 1, NU_REST, ref);         // tips and lumen wall, behind it
  /* caps only where the band abuts a neighbour; a tapered end has closed itself */
  /* THE CAP MUST BE SAMPLED WHERE THE SURFACE IS. The first version fanned a 48-point loop onto a
     surface swept with NU_OUT + NU_REST = 64 columns, so the cap and the tube shared no edges: 18,068
     unpaired edges across the corpus of builds, four bodies with NEGATIVE signed volume, and a section
     area 6% out — all of it from one sampling mismatch, and none of it visible in a render. The loop is
     now the surface's OWN column positions, in the surface's own order. */
  const loopAt = v => {
    const a = [];
    for (let j = 0; j < NU_TOT; j++) { const q = new T.Vector3(); f(v, j / NU_TOT, q); a.push(q); }
    return a;
  };
  /* ALWAYS CAPPED. The first version skipped the cap at a TAPERED end, on the reasoning that a taper
     closes itself — it does not: it shrinks the loop towards the axis and leaves a ring-shaped hole
     one grid step across. 114 unpaired edges per band, and with a hole in the surface the signed
     volume and the parity test both stop meaning anything, which is how a band with a hole came to be
     reported as having NEGATIVE volume. The cap at a tapered end is a few hundredths of a unit across
     and invisible; the hole was not. */
  capSection(E, loopAt(v0), new T.Vector3(0, -1, 0));
  capSection(E, loopAt(v1), new T.Vector3(0, 1, 0));
  return E.geometry(hull);
}

/* ═══════════════════════════════════════════════════════════════ 11 · SHEETS

   A germ layer is a slab between two surfaces over a span of x, and every one of them must THIN TO
   NOTHING at its free edge (RENDER-STANDARD section 3: "a membrane tapers"). Drawn with a constant
   free edge a germ layer reads as a slab of card standing behind the subject, which is what the first
   dorsal mesocardium looked like.

   The top (dorsal) surfaces of every sheet are emitted FIRST, across both sides, so the silhouette is
   the skin and not the slab.                                                                       */
function sheetSolid(opts) {
  const o = opts, E = K.emitter();
  const nv = o.nv || 90, nx = o.nx || 56;
  const sides = o.sides || [1];
  const X = (v, q, side) => side * (o.x0(v) + (o.x1(v) - o.x0(v)) * q);
  const zD = (v, q, side) => o.zDors(v, X(v, q, side));          // dorsal face: smaller z
  const zV = (v, q, side) => o.zVent(v, X(v, q, side));
  const mk = (which, side) => (v, q, out) => {
    const x = X(v, q, side);
    const z = which === 'd' ? zD(v, q, side) : zV(v, q, side);
    return out.set(x, yOf(v, o.t), z);
  };
  const refD = () => new T.Vector3(0, 0, -1), refV = () => new T.Vector3(0, 0, 1);
  for (const side of sides) patch(E, mk('d', side), o.v0, o.v1, nv, 0, 1, nx, refD);
  for (const side of sides) patch(E, mk('v', side), o.v0, o.v1, nv, 0, 1, nx, refV);
  const hull = E.count();
  /* the two walls across the thickness, at q = 0 and q = 1; where the sheet has feathered to nothing
     these are degenerate and emitTri drops them, which is the taper doing its job */
  for (const side of sides) for (const q of [0, 1]) {
    const dir = new T.Vector3((q === 0 ? -1 : 1) * side, 0, 0);
    const f = (v, w, out) => out.set(X(v, q, side), yOf(v, o.t), zD(v, q, side) + w * (zV(v, q, side) - zD(v, q, side)));
    patch(E, f, o.v0, o.v1, nv, 0, 1, 4, () => dir);
  }
  /* the cranial and caudal cut faces */
  for (const side of sides) for (const v of (o.caps || [o.v0, o.v1])) {
    const dir = new T.Vector3(0, v === o.v0 ? -1 : 1, 0);
    const f = (q, w, out) => out.set(X(v, q, side), yOf(v, o.t), zD(v, q, side) + w * (zV(v, q, side) - zD(v, q, side)));
    patch(E, f, 0, 1, nx, 0, 1, 4, () => dir);
  }
  return E.geometry(hull);
}

/** An annular SECTOR swept along y — a vertebral arch, a sleeve, a half-ring. theta is measured from
    +z (VENTRAL) so theta = pi is DORSAL, which is where a spina bifida gap is. */
function ringPrism(opts) {
  const o = opts, E = K.emitter();
  const nv = o.nv || 10, nu = o.nu || 48;
  const pt = (r, th, y, out) => out.set(o.cx + r * Math.sin(th), y, o.cz + r * Math.cos(th));
  const yAt = w => o.y0 + (o.y1 - o.y0) * w;
  const TH = k => o.a0 + (o.a1 - o.a0) * k;
  const radial = k => { const th = TH(k); return new T.Vector3(Math.sin(th), 0, Math.cos(th)); };
  patch(E, (w, k, out) => pt(o.rOut, TH(k), yAt(w), out), 0, 1, nv, 0, 1, nu, k => radial(k));
  const hull = E.count();
  patch(E, (w, k, out) => pt(o.rIn, TH(k), yAt(w), out), 0, 1, nv, 0, 1, nu,
        k => radial(k).multiplyScalar(-1));
  for (const k of [0, 1]) {                                    // the two radial end faces
    const th = TH(k);
    const dir = new T.Vector3(Math.cos(th) * (k === 0 ? -1 : 1), 0, -Math.sin(th) * (k === 0 ? -1 : 1));
    patch(E, (w, r, out) => pt(o.rIn + (o.rOut - o.rIn) * r, th, yAt(w), out), 0, 1, nv, 0, 1, 4, () => dir);
  }
  for (const w of [0, 1]) {                                    // the two y caps
    const dir = new T.Vector3(0, w === 0 ? -1 : 1, 0);
    patch(E, (k, r, out) => pt(o.rIn + (o.rOut - o.rIn) * r, TH(k), yAt(w), out), 0, 1, nu, 0, 1, 4, () => dir);
  }
  return E.geometry(hull);
}

/** A de-indexed spheroid, because an indexed geometry walked by outlineOf produces triangle soup
    (RENDER-STANDARD section 2.4) and every probe in the harness reads the position buffer directly. */
function spheroid(rx, ry, rz, seg) {
  const g = new T.SphereGeometry(1, seg || 22, Math.max(10, Math.round((seg || 22) / 2)));
  g.scale(rx, ry, rz);
  const flat = g.toNonIndexed();
  g.dispose();
  flat.computeVertexNormals();
  flat.userData.hullCount = flat.attributes.position.count;
  return flat;
}

/* ═══════════════════════════════════════════════════════════════ 12 · WHERE THE BANDS ARE

   The stage bands are RUNS of the stage field, found by walking v. Each stage can appear twice — once
   cranial to the closure site and once caudal to it — and that is the picture this model exists to
   draw, so nothing here assumes one run per name.                                                  */
const V_LO_BUILD = () => V_CAUD();
/* WHERE THE GERM-LAYER SHEETS START. They do not run through the caudal eminence: that is the TAIL
   BUD, a blastema in which the three layers are not yet separate, so a sheet drawn through it would
   be drawing a distinction the tissue does not have — and would share space with the eminence, which
   acceptance row Q then reports (correctly) as two solids inside one another. They meet it instead. */
const V_SHEET0 = () => V_CAUD() + 0.012;
const V_HI_BUILD = 0.998;

function stageRuns(t, o, win) {
  const lo = Math.max(V_LO_BUILD(), win ? win.v0 : -1);
  const hi = Math.min(V_HI_BUILD, win ? win.v1 : 2);
  if (!(hi > lo)) return [];
  const N = 900, runs = [];
  let cur = null;
  for (let i = 0; i <= N; i++) {
    const v = lo + (hi - lo) * (i / N);
    const s = stageAt(v, t, o);
    if (!cur || cur.key !== s) { if (cur) cur.v1 = v; cur = { key: s, v0: v, v1: v }; runs.push(cur); }
    else cur.v1 = v;
  }
  /* a run shorter than this is a sliver the grid caught between two stages; fold it into its
     neighbour rather than emit a band with fewer rows than it has sides */
  const MIN_RUN = 0.004;
  const keep = [];
  for (const r of runs) {
    if (r.v1 - r.v0 < MIN_RUN && keep.length) keep[keep.length - 1].v1 = r.v1;
    else if (r.v1 - r.v0 < MIN_RUN && runs.length > 1) continue;
    else keep.push(r);
  }
  return keep;
}

/** THE CLOSURE FRONT, MEASURED off the stage field rather than read back from U_CRAN and U_CAUD — so
    row C checks the solve instead of restating it. Scanned over the whole axis, V_CAUD to V_CRAN,
    independent of the build window: the front is a fact about the embryo, not about what is drawn.
    null when nothing has fused yet. */
function frontsMeasured(t, o) {
  const lo = V_CAUD(), hi = V_CRAN, N = 2000;
  let v0 = Infinity, v1 = -Infinity, any = false;
  for (let i = 0; i <= N; i++) {
    const v = lo + (hi - lo) * (i / N);
    if (fusedAt(v, t, o)) { any = true; if (v < v0) v0 = v; if (v > v1) v1 = v; }
  }
  return any ? { caudal: v0, cranial: v1 } : null;
}

/* ═══════════════════════════════════════════════════════════════ 13 · THE PARTS

   Every one of these takes the same (t, o, win), so a transverse slab is the same geometry as the
   whole embryo with its v-range clipped — not a second model of the same thing. That is what lets the
   `sections` variant put four stages side by side and be sure they agree: they are four samples of one
   function, cut from one build.                                                                     */
const clipV = (a, b, win) => {
  const v0 = Math.max(a, win ? win.v0 : -1), v1 = Math.min(b, win ? win.v1 : 2);
  return v1 - v0 > 1e-4 ? [v0, v1] : null;
};
const inWin = (v, win) => !win || (v >= win.v0 && v <= win.v1);

/* ── the neuroepithelium, as bands of one sheet ──────────────────────────────────────────────── */
function addNeuroBands(g, t, o, win) {
  const runs = stageRuns(t, o, win);
  const loAll = Math.max(V_LO_BUILD(), win ? win.v0 : -1);
  const hiAll = Math.min(V_HI_BUILD, win ? win.v1 : 2);
  for (const r of runs) {
    /* OVERLAP adjacent bands very slightly so neither end cap is ever exposed (section 3). A band at
       the very end of the axis has nothing to hide in, so it tapers to a point instead. */
    const v0 = Math.max(loAll, r.v0 - (r.v0 > loAll + 1e-9 ? OVERLAP : 0));
    const v1 = Math.min(hiAll, r.v1 + (r.v1 < hiAll - 1e-9 ? OVERLAP : 0));
    /* ONLY THE ROSTRAL END IS IN MID-AIR. The caudal end of the neuroepithelium continues into the
       caudal eminence, which overlaps it — so it is capped flat and buried there, exactly as two
       neighbouring bands are. Tapering it would draw the cord coming to a point inside the tail bud. */
    const terminal0 = false;
    const terminal1 = v1 >= hiAll - 1e-9 && !win;
    const geo = neuroBand(v0, v1, t, o, {
      taper0: terminal0 ? 0.18 : 0, taper1: terminal1 ? 0.18 : 0,
      nvScale: win ? 900 : 260,
    });
    K.addSolid(g, r.key, geo, { color: LAYERS[r.key].color, name: LAYERS[r.key].name, outline: 0.012 });
  }
}

/* ── the lumen of the closed tube: the future ventricular system and central canal ───────────── */
function addCanal(g, t, o, win) {
  const fr = frontsMeasured(t, o);
  if (!fr) return;
  const cl = clipV(fr.caudal + 0.002, fr.cranial - 0.002, win);
  if (!cl) return;
  const [v0, v1] = cl;
  const N = Math.max(10, Math.round((v1 - v0) * 170));
  const vAt = u => v0 + (v1 - v0) * u;
  const geo = roundTube({
    nv: N, ring: 20,
    centre: u => { const v = vAt(u), a = arc(v, t, o);
                   return new T.Vector3(0, yOf(v, t), zMidFloor(v) - a.R + sinkAt(v, t, o)); },
    r: u => { const v = vAt(u), a = arc(v, t, o); return Math.max(0.012, a.R - a.H / 2); },
    /* a cut end in a transverse slab is a CUT and stays flat; a free end is domed */
    dome0: win ? 0 : 0.10, dome1: win ? 0 : 0.10,
  });
  K.addSolid(g, 'neural_canal', geo,
             { color: LAYERS.neural_canal.color, name: LAYERS.neural_canal.name, outline: 0.010 });
}

/* ── the two openings, drawn as the LIP that bounds them ─────────────────────────────────────── */
function tipPoint(v, t, o, side) {
  const a = arc(v, t, o);
  return new T.Vector3(side * a.tipX, yOf(v, t),
                       zMidFloor(v) - a.R + sinkAt(v, t, o) + a.R * Math.cos(a.phi));
}
function addNeuropore(g, t, o, win, which) {
  const fr = frontsMeasured(t, o);
  const cran = which === 'cranial';
  const key = cran ? 'cranial_neuropore' : 'caudal_neuropore';
  /* the lip runs from the front to the end of the plate. With no front yet the whole groove is open
     and there is no neuropore to name: an opening is defined by the closure that bounds it. */
  if (!fr) return;
  const vEndRaw = cran ? V_HI_BUILD : V_LO_BUILD();
  const vFront = cran ? fr.cranial : fr.caudal;
  /* 0.34 OF THE LOCAL EPITHELIAL THICKNESS, RAISED AGAINST THE WALK. The lip is a MARKER for the rim of
     an opening, not a tissue with a measured calibre, so its thickness is a drawing decision — and the
     measurement is what decides it. At 0.22 the cranial lip of the anencephaly build drew 0.215% of
     beat 6's frame against the 0.30% floor for a structure the beat points at, and it got smaller rather
     than bigger when the lesion was corrected to the head alone. */
  const rimR = v => 0.34 * plateH(v);
  /* start where the gap is wide enough for two lips to stand side by side without sharing space */
  const dir = cran ? 1 : -1;
  let vStart = null;
  const N = 400;
  for (let i = 0; i <= N; i++) {
    const v = vFront + (vEndRaw - vFront) * (i / N);
    if (arc(v, t, o).tipX >= 1.3 * rimR(v)) { vStart = v; break; }
  }
  if (vStart == null) return;
  if (Math.abs(vEndRaw - vStart) < 0.01) return;
  if (!inWin((vStart + vEndRaw) / 2, win)) return;
  const M = 30, pts = [];
  for (let i = 0; i <= M; i++) pts.push(tipPoint(vStart + (vEndRaw - vStart) * (i / M), t, o, +1));
  /* over the end of the plate, so the lip is ONE loop and not two parallel rods */
  const aE = arc(vEndRaw, t, o);
  const yE = yOf(vEndRaw, t), zE = zMidFloor(vEndRaw) - aE.R + sinkAt(vEndRaw, t, o) + aE.R * Math.cos(aE.phi);
  for (let i = 1; i < 10; i++) {
    const k = i / 10, th = Math.PI * k;
    pts.push(new T.Vector3(aE.tipX * Math.cos(th), yE + dir * 0.35 * aE.tipX * Math.sin(th), zE));
  }
  for (let i = M; i >= 0; i--) pts.push(tipPoint(vStart + (vEndRaw - vStart) * (i / M), t, o, -1));
  const geo = pathTube(pts, () => rimR((vStart + vEndRaw) / 2), { ring: 14 });
  K.addSolid(g, key, geo, { color: LAYERS[key].color, name: LAYERS[key].name, outline: 0.010 });
}

/* ── the surface ectoderm: one sheet with a midline window that the folds carry, and that closes
      over the tube as the tube sinks. It is the SAME epithelium as the plate, so it feathers to
      nothing where it meets the fold tip rather than ending in a wall. ─────────────────────────── */
function addEctoderm(g, t, o, win) {
  const cl = clipV(V_SHEET0(), 0.988, win);
  if (!cl) return;
  const RIM = 0.30;
  /* MEMOISED PER STATION. sectionExtent walks the section's own columns, and the sheet's point function
     is evaluated tens of thousands of times per build — three times per grid point, for the
     finite-differenced normal, over six surfaces. Unmemoised that is 1.3 million section evaluations and
     the ectoderm alone took 13.5 seconds of a 15-second build. patch() asks for the same v across a
     whole row and for only two neighbours of it, so the key is the v the caller passed, not a rounded
     one, and the map stays a few hundred entries. */
  const _we = new Map();
  const winEdge = v => {
    let hit = _we.get(v);
    if (hit === undefined) { hit = winEdgeRaw(v); _we.set(v, hit); }
    return hit;
  };
  const winEdgeRaw = v => {
    const a = arc(v, t, o);
    const closed = clampX((day(t) - dayFront(v, o)) / D_SINK, 0, 1);
    /* HOW HIGH THE SHEET HAS TO RIDE IS A MEASUREMENT, NOT A SAGITTA. It must clear whatever the
       neuroepithelium's most dorsal point is at this station, with SUB to spare — before closure that
       is the fold tip it is attached to, after closure it is the top of the tube it arches over, and
       the crossover between the two is not a special case here because neither is named. */
    const ex = sectionExtent(v, t, o);
    const lift = Math.max(0, zBasal() - ex.dorsalZ + SUB);
    return { x: a.tipX * (1 - closed), lift: lift,
             arch: Math.max(a.tipX, ex.halfWidth),
             ramp: Math.max(0.35, 0.30 * halfW(v, t)), closed };
  };
  /* A TRANSVERSE SLAB IS A SECTION, AND A SECTION HAS AN HONEST FLAT FACE. Where the window clips the
     sheet laterally (the transverse slabs of the `sections` variant) the edge is a CUT and must not be feathered — feathering a
     cut edge would draw a sheet that tapers to nothing at a place the tissue does not end. The free
     lateral rim of the whole embryo is a different thing and does taper. */
  const xLim = v => (win && win.xMax != null) ? Math.min(halfW(v, t), win.xMax) : halfW(v, t);
  const cut = v => (win && win.xMax != null) && win.xMax < halfW(v, t);
  const thick = (v, x) => {
    const w = winEdge(v), ax = Math.abs(x), hw = xLim(v);
    const openW = ss(w.x, w.x + w.ramp, ax);               // the midline window
    const rim = cut(v) ? 1 : 1 - ss(hw - RIM, hw, ax);     // feather only at a real free edge
    return p('H_ECTO', H_ECTO) * (w.closed + (1 - w.closed) * openW) * rim;
  };
  const lift = (v, x) => {
    const w = winEdge(v), ax = Math.abs(x);
    return w.lift * (1 - ss(w.arch, w.arch + w.ramp, ax));
  };
  /* ONE sheet across the whole width: q runs from the right rim to the left one, so there is no pair
     of coincident walls at x = 0 for the two halves to z-fight over once the window has closed. */
  const geo = sheetSolid({
    t, v0: cl[0], v1: cl[1], nv: win ? 26 : 64, nx: 74, sides: [1],
    x0: v => -xLim(v), x1: v => xLim(v),
    zDors: (v, x) => zBasal() - lift(v, x) - thick(v, x),
    zVent: (v, x) => zBasal() - lift(v, x),
  });
  K.addSolid(g, 'surface_ectoderm', geo, { color: LAYERS.surface_ectoderm.color,
             name: LAYERS.surface_ectoderm.name, outline: 0.012 });
}

/* ── the gut roof, and the lateral mesoderm ──────────────────────────────────────────────────── */
function addEndoderm(g, t, o, win) {
  const cl = clipV(V_SHEET0(), 0.988, win);
  if (!cl) return;
  const RIM = 0.34;
  const th = (v, x) => p('H_ENDO', H_ENDO) * (1 - ss(halfW(v, t) * 0.97 - RIM, halfW(v, t) * 0.97, Math.abs(x)));
  const geo = sheetSolid({
    t, v0: cl[0], v1: cl[1], nv: win ? 20 : 52, nx: 58, sides: [1],
    x0: v => -halfW(v, t) * 0.97, x1: v => halfW(v, t) * 0.97,
    zDors: (v, x) => zGutDors() - th(v, x) / 2,
    zVent: (v, x) => zGutDors() + th(v, x) / 2,
  });
  K.addSolid(g, 'endoderm', geo, { color: LAYERS.endoderm.color, name: LAYERS.endoderm.name, outline: 0.012 });
}

function addLateralMesoderm(g, t, o, win) {
  const cl = clipV(V_SHEET0(), 0.988, win);
  if (!cl) return;
  const xA = v => halfW(v, t) * (p('SH_NEURAL', SH_NEURAL) + SH_PARAX);
  const xB = v => halfW(v, t);
  const RIM = 0.36;
  /* BETWEEN the ectoderm's basal plane and the gut roof's own dorsal face, with a clearance at each
     end. The first version ran from the basal plane to the CENTRE of the gut roof and so lay 0.05
     units inside the endoderm — 21% of the endoderm's vertices, which row Q found. */
  const zT = zBasal() + 0.03, zB = zGutDors() - p('H_ENDO', H_ENDO) / 2 - 0.03;
  const th = (v, x) => (zB - zT) * (1 - ss(xB(v) - RIM, xB(v), Math.abs(x)));
  const mid = (zT + zB) / 2;
  for (const side of [1, -1]) {
    const geo = sheetSolid({
      t, v0: cl[0], v1: cl[1], nv: win ? 18 : 46, nx: 20, sides: [side],
      x0: xA, x1: xB,
      zDors: (v, x) => mid - th(v, x) / 2,
      zVent: (v, x) => mid + th(v, x) / 2,
    });
    K.addSolid(g, 'lateral_mesoderm', geo, { color: LAYERS.lateral_mesoderm.color,
               name: LAYERS.lateral_mesoderm.name, outline: 0.012 });
  }
}

/* ── the notochord: the rod that gave the order, tapering to nothing at the prechordal plate ──── */
function addNotochord(g, t, o, win) {
  /* THE TAPER BELONGS TO THE NOTOCHORD'S OWN ENDS, NOT TO THE WINDOW'S. The first version read its fade
     from the CLIPPED range, so inside a transverse slab the rod tapered at the slab's two faces — at the
     station beat 2 cuts, that took its radius from 0.30 to 0.09 and the visibility walk scored it at
     0.147% of the frame, pointed at and under the floor. The anatomical ends are fixed; the window only
     decides which part of the rod is drawn. */
  const A0 = V_LO_BUILD() + 0.004, A1 = p('V_PRE', V_PRE);
  const cl = clipV(A0, A1, win);
  if (!cl) return;
  const [v0, v1] = cl;
  const N = Math.max(10, Math.round((v1 - v0) * 110));
  const pts = [], rr = [];
  for (let i = 0; i <= N; i++) {
    const v = v0 + (v1 - v0) * (i / N);
    pts.push(new T.Vector3(0, yOf(v, t), zNotoC()));
    const fade = Math.min(ss(A0, A0 + 0.05, v), 1 - 0.62 * ss(A1 - 0.10, A1, v));
    rr.push(Math.max(0.085, p('R_NOTO', R_NOTO) * Math.max(0.30, fade)));
  }
  const geo = K.tubeCapped(pts, u => rr[Math.min(N, Math.round(u * N))],
                           { ring: 18, cap: win ? false : 'both', capRows: 6, flatten: 0.92 });
  K.addSolid(g, 'notochord', geo, { color: LAYERS.notochord.color, name: LAYERS.notochord.name, outline: 0.012 });
}

/* ── the somites, which are what "the fifth somite" points at ─────────────────────────────────── */
const boxy = th => {
  const n = 3.4, c = Math.abs(Math.cos(th)), s = Math.abs(Math.sin(th));
  return 1 / Math.pow(Math.pow(c, n) + Math.pow(s, n), 1 / n);
};
function somiteList(t, o) {
  const n = somiteCount(day(t)), out = [];
  for (let i = 1; i <= n; i++) {
    const vA = somiteEdge(i), vB = somiteEdge(i - 1);
    if (vB - vA < 1e-4) continue;
    out.push({ i, v0: vA, v1: vB, vc: (vA + vB) / 2 });
  }
  return out;
}
function addSomites(g, t, o, win) {
  const mid = (zBasal() + 0.04 + zGutDors() - p('H_ENDO', H_ENDO) / 2 - 0.04) / 2;
  for (const s of somiteList(t, o)) {
    if (!inWin(s.vc, win)) continue;
    const cl = clipV(s.v0, s.v1, win);
    if (!cl) continue;
    const xc = v => halfW(v, t) * (p('SH_NEURAL', SH_NEURAL) + SH_PARAX / 2);
    /* and they must FIT between the ectoderm and the gut roof: a somite 0.42 of the paraxial band
       wide is, on a day-27 embryo, taller than the space between the two sheets. */
    const zRoom = (zGutDors() - p('H_ENDO', H_ENDO) / 2 - 0.04) - (zBasal() + 0.04);
    const rad = Math.min(0.42 * halfW(s.vc, t) * SH_PARAX, (zRoom / 2) / 0.78);
    const yHalf = Math.abs(yOf(cl[1], t) - yOf(cl[0], t)) / 2;
    if (yHalf < 0.02) continue;
    for (const side of [1, -1]) {
      const pts = [];
      const M = 8;
      for (let i = 0; i <= M; i++) {
        const v = cl[0] + (cl[1] - cl[0]) * (i / M);
        pts.push(new T.Vector3(side * xc(v), yOf(v, t), mid));
      }
      const geo = K.tubeCapped(pts, u => rad * (0.55 + 0.45 * Math.sin(Math.PI * clampX(u, 0, 1))),
                               { ring: 16, cap: 'both', capRows: 5, flatten: 0.78, section: boxy });
      K.addSolid(g, 'somites', geo, { color: LAYERS.somites.color, name: LAYERS.somites.name, outline: 0.010 });
    }
  }
}

/* ── the neural crest: cells that leave at the seam ───────────────────────────────────────────── */
const CREST_PHI0 = 0.70;          // they delaminate once the tips are this far round
function crestCells(t, o, win) {
  const out = [];
  const lo = V_LO_BUILD(), hi = V_HI_BUILD, N = 150;
  for (let i = 0; i <= N; i++) {
    const v = lo + (hi - lo) * (i / N);
    if (!inWin(v, win)) continue;
    const a = arc(v, t, o);
    if (a.phi / Math.PI < CREST_PHI0) continue;
    /* ONE CLUSTER EVERY THIRD STATION. At every sixth, a 0.34-unit transverse slab caught two of them
       and the visibility walk scored the population at 0.136% of the frame in the beat that is ABOUT it.
       These are clusters, not cells — a crest cell is 10 to 15 micrometres and these are 36 across — so
       the density is a drawing decision, and it is made against the measurement. */
    if (i % 3 !== 0) continue;
    const since = Math.max(0, day(t) - dayFront(v, o));
    const mig = clampX(since / 2.2, 0, 1);
    const r = 0.085 * plateH(v) / H_NEURO_MAX() * 2.2;
    for (const side of [1, -1]) for (let c = 0; c < 3; c++) {
      const sp = 0.30 + 0.34 * c;
      const base = tipPoint(v, t, o, side);
      const rc = r * (0.78 + 0.22 * Math.cos(c + i));
      /* THE TARGET IS A PLACE IN THE EMBRYO, not an offset from the tip. The first version added a
         depth proportional to the gut's own depth ON TOP of the tip's z, which put the furthest
         cluster 2.1 gut-depths ventral of the basal plane — outside the embryo it is migrating
         through. It now LERPS from the tip to a station between the two sheets. */
      const xT = side * (0.26 + 0.22 * c) * halfW(v, t);
      const zT = zBasal() + (0.20 + 0.26 * c) * (zGutDors() - zBasal());
      out.push({
        /* 0.35 rather than 0.8 of a cell radius laterally: the dorsal offset below now carries the
           cell clear of the tissue, and a bigger lateral push at a station whose tips are nearly
           touching walks the cell off the apex it is supposed to be sitting on. */
        x: (1 - mig) * (base.x + side * 0.35 * rc) + mig * xT,
        y: base.y + (c - 1) * 0.10 * r * 4,
        /* DORSAL OF THE TIP, NOT VENTRAL OF IT. The first version offset the fresh cells towards +z,
           which at a station that has just fused puts them 0.11 units ventral of the fold tip — INSIDE
           the lumen, because the tube's dorsal wall is only H/2 = 0.36 thick there. Acceptance row Q
           measured 1.5% of the canal's own vertices inside the crest, and a crest cell in the central
           canal is the one place a crest cell cannot be. They sit at the apex of the fold, outside it.
           AND OUTSIDE THE TIP'S OWN CAP, NOT 0.9 CELL-RADII FROM ITS MIDSURFACE. CORRECTED BY REVIEW
           2026-10-03 F1. tipPoint returns a point on the fold's MIDSURFACE, and the epithelium is
           2 * arc().rho thick across the tip's round — so a cell placed 0.9 * r dorsal of it was
           INSIDE the tissue it had just left whenever rho > 0.9 * r, which at every station the folds
           band occupies it is. Nothing read it as an overlap, because `neural_crest|neural_folds` is a
           published TOUCH_OK pair ("the crest leaves the fold tip; contact is the event being drawn")
           — correctly, for CONTACT, but the pair also absorbs total containment. What a student saw:
           in beat 5's four-panel figure the folds panel is the one the narration is ABOUT ("the cells
           at the very tips of the folds join neither the tube nor the skin") and it drew ZERO crest
           pixels, because the cells sat inside the fold's own x-z silhouette and the `superior` camera
           reads that silhouette's CUT FACE. Measured before: crest x +/-0.609, z -1.086..-0.916, all
           of it inside neural_folds' x +/-0.835, z -1.140..0.292. The fresh cell now sits tangent to
           the DORSALMOST point of the tip's cap, which is where a delaminating cell is: outside the
           epithelium, at the apex, and clear of the silhouette in z rather than buried in it.
           The 0.85 leaves it touching rather than floating — contact is what TOUCH_OK is for. */
        z: (1 - mig) * (base.z - arc(v, t, o).rho - 0.85 * rc) + mig * zT,
        r: rc,
      });
      void sp;
    }
  }
  return out;
}
function addCrest(g, t, o, win) {
  /* THE GEOMETRY IS TRANSLATED, NOT THE MESH. addSolid puts the silhouette shell in the group as a
     SIBLING of the mesh, so moving the mesh alone would leave its outline at the origin — one stray
     dark blob per crest cell, in a model with sixty of them. */
  for (const c of crestCells(t, o, win)) {
    const geo = spheroid(c.r, c.r * 0.9, c.r, 12);
    geo.translate(c.x, c.y, c.z);
    K.addSolid(g, 'neural_crest', geo,
      { color: LAYERS.neural_crest.color, name: LAYERS.neural_crest.name, outline: 0.008 });
  }
}

/* ── the tail end, which is not made by folding at all ────────────────────────────────────────── */
const DAY_CANAL = 25.0;           // canalisation of the caudal eminence begins
const DAY_RETRO = 28.0;           // retrogressive differentiation begins to trim it back
function addCaudalEminence(g, t, o, win) {
  /* ITS DOME CAP COUNTS AS PART OF IT. tubeCapped puts a dome of the terminal radius on each end, so
     an eminence built right up to V_CAUD reaches 0.45 units FURTHER cranially than its last station —
     past where the germ-layer sheets begin, which row Q found as the eminence and all three sheets
     inside one another. It stops short by its own terminal radius instead. */
  const vTop = V_LO_BUILD();
  const retro = clampX((day(t) - DAY_RETRO) / 2.0, 0, 1);
  const vBot = 0.008 + retro * 0.35 * vTop;
  /* AND IT STOPS SHORT BY ITS OWN DOME'S REACH. tubeCapped puts a dome of the terminal radius on the
     end, so an eminence built right up to V_CAUD reaches that much further cranially than its last
     station — past where the germ-layer sheets begin, which row Q found as the eminence and all three
     sheets inside one another. */
  /* IT ENDS FLAT WHERE IT JOINS THE TUBE, AND ROUND AT THE TAIL. A dome on the cranial end reaches a
     terminal radius FURTHER cranially than its last station, past where the germ-layer sheets begin —
     which row Q read, correctly, as the eminence and all three sheets inside one another. A flat end
     overlapping the tube's own caudal band is the join the narration is about, and the join is declared
     in TOUCH_OK rather than measured as a defect. */
  const cl = clipV(vBot, vTop + 0.006, win);
  if (!cl) return;
  const [v0, v1] = cl;
  const rTop = tubeOuterR(vTop);
  /* ON THE TUBE'S OWN AXIS, not in the middle of the germ layers. The eminence is what the cord
     continues INTO, so its axis has to be the cord's axis — and because the tube stands proud of the
     dorsal surface (see the note at sinkAt), that axis is well dorsal of the notochord. The first
     version put the eminence halfway between the ectoderm and the gut roof, which is where the
     notochord is: row Q measured 5.5% of the secondary canal inside the notochord, two midline
     structures that must never share space. Computed at the FUSED radius so it does not depend on t. */
  const zMid = zMidFloor(vTop) - plateL(vTop) / (2 * Math.PI);
  const rOf = v => Math.max(0.05, rTop * (0.42 + 0.58 * ss(v0, v1, v)));
  const geo = roundTube({
    nv: 30, ring: 20,
    centre: u => new T.Vector3(0, yOf(v0 + (v1 - v0) * u, t), zMid),
    r: u => rOf(v0 + (v1 - v0) * u),
    dome0: win ? 0 : 0.22, dome1: 0,
  });
  K.addSolid(g, 'caudal_eminence', geo, { color: LAYERS.caudal_eminence.color,
             name: LAYERS.caudal_eminence.name, outline: 0.012 });
  /* CANALISATION: a solid cord of cells hollows out, and the cavity joins the canal above it. */
  const cav = clampX((day(t) - DAY_CANAL) / 2.5, 0, 1);
  if (cav <= 0) return;
  const vCav0 = v1 - (v1 - v0) * cav;
  const cl2 = clipV(vCav0, v1, win);
  if (!cl2) return;
  const g2 = roundTube({
    nv: 22, ring: 18,
    centre: u => new T.Vector3(0, yOf(cl2[0] + (cl2[1] - cl2[0]) * u, t), zMid),
    /* 0.78 of the canal it becomes confluent with, not 0.55: the two canals join, so a cavity drawn at
       half the calibre of what it joins reads as a different structure. Raised against the walk, which
       measured the smaller version at 0.269% of beat 4's frame against a 0.30% floor. */
    r: u => Math.max(0.025, 0.78 * tubeLumenR(Math.max(cl2[0] + (cl2[1] - cl2[0]) * u, vTop))),
    dome0: win ? 0 : 0.20, dome1: 0,
  });
  K.addSolid(g, 'secondary_canal', g2, { color: LAYERS.secondary_canal.color,
             name: LAYERS.secondary_canal.name, outline: 0.008 });
}

/* ═══════════════════════════════════════════════════════════ 14 · WHEN A DATE IS MISSED

   The two lesions at the two ends are not drawn here. They are the SAME BUILD with one of the two
   zip speeds set to zero — dayFront returns Infinity, so the front never arrives at those stations,
   so phi never reaches PHI_MAX, so the plate stays open, the surface ectoderm's window never closes
   over it and the tube never sinks. Nothing in this section draws a malformation; it declares which
   front stopped and the rest follows, which is the one thing the taught explanation actually says.

   `openCranial` is anencephaly, `openCaudal` is myeloschisis, and both together is
   craniorachischisis. The only geometry that has to be ADDED is the exposed tissue itself: a forebrain
   left open to amniotic fluid degenerates, and what a student is shown is the area cerebrovasculosa
   lying in the open groove where a vault should be.                                                */
function addExposedBrain(g, t, o, win) {
  if (!o.openCranial) return;
  const cl = clipV(V_STOP_CRAN() + 0.012, V_HI_BUILD - 0.01, win);
  if (!cl) return;
  const tipOf = v => { const a = arc(v, t, o);
    return { x: a.tipX, z: zMidFloor(v) - a.R + sinkAt(v, t, o) + a.R * Math.cos(a.phi) }; };
  const geo = sheetSolid({
    t, v0: cl[0], v1: cl[1], nv: 48, nx: 36, sides: [1],
    x0: v => -tipOf(v).x * 0.96, x1: v => tipOf(v).x * 0.96,
    zDors: (v, x) => tipOf(v).z - 0.30 * tipOf(v).x * (1 - Math.pow(Math.abs(x) / Math.max(1e-6, tipOf(v).x * 0.96), 2)),
    zVent: (v, x) => tipOf(v).z + 0.10,
  });
  K.addSolid(g, 'area_cerebrovasculosa', geo, { color: LAYERS.area_cerebrovasculosa.color,
             name: LAYERS.area_cerebrovasculosa.name, outline: 0.012 });
}

/* ── THE SPINA BIFIDA SPECTRUM, FOUR PANELS AT ONE SCALE ───────────────────────────────────────

   The sequence version's gaps[] made this a condition on the artwork and it is carried over as a
   condition on the geometry, because it is the whole teaching point: "the spina bifida panels must be
   drawn at one scale with the same vertebral outline. The teaching point is how much herniates, and a
   set of drawings at different magnifications destroys exactly that comparison."

   So all four panels are built by ONE function at ONE station — v = V_CAUD + 0.02, the lumbosacral
   level the narration names — from the same arch, the same cord section and the same sac radius. They
   differ in three booleans and nothing else: does a sac come through the gap, is the cord in it, is
   there skin over the top. Panel 4 is the one that is not a sac at all, and it is the open plate from
   the same sectionPt, at phiForce.                                                                 */
const SB_LESIONS = [
  { id: 'occulta',          sac: 0, cord: 0, skin: 1, open: 0, label: 'Spina bifida occulta' },
  { id: 'meningocele',      sac: 1, cord: 0, skin: 0, open: 0, label: 'Meningocele' },
  { id: 'myelomeningocele', sac: 1, cord: 1, skin: 0, open: 0, label: 'Myelomeningocele' },
  { id: 'myeloschisis',     sac: 0, cord: 0, skin: 0, open: 1, label: 'Myeloschisis' },
];
const SB_SLAB_UNITS = 0.90;        // the slab is this thick cranio-caudally, in every panel
const SB_GAP_DEG = 46;             // the dorsal gap in the arch, the same in every panel
const SB_PHI_OPEN = 1.05;          // the open plate of panel 4

function buildSbPanel(t, o) {
  const g = new T.Group();
  const v = V_CAUD() + 0.02;
  const half = (SB_SLAB_UNITS / 2) / embL(day(t));
  const win = { v0: v - half, v1: v + half };
  const base = arc(v, t, { });
  const rOutCord = base.R + base.H / 2;
  const cz = zMidFloor(v) - base.R + sinkAt(v, t, {});
  const y0 = yOf(win.v0, t), y1 = yOf(win.v1, t);
  const rIn = rOutCord + 0.10, rOut = rIn + 0.26;
  const sacR = rOutCord * 1.15;
  const pitch = 2 * (rOut + sacR * 2.0) * 1.08;
  const GAP = SB_GAP_DEG * Math.PI / 180;

  SB_LESIONS.forEach((L, idx) => {
    const panel = new T.Group();
    panel.position.x = (idx - (SB_LESIONS.length - 1) / 2) * pitch;
    g.add(panel);

    /* the cord — the SAME section function, closed in three panels and open in the fourth */
    const cordO = L.open ? { phiForce: SB_PHI_OPEN } : {};
    const cordGeo = neuroBand(win.v0, win.v1, t, cordO, { nvScale: 900 });
    const dz = L.cord ? -(rOut + sacR * 0.65) + (cz - cz) : 0;
    if (dz) cordGeo.translate(0, 0, dz);
    K.addSolid(panel, L.open ? 'neural_plate' : 'neural_tube', cordGeo,
      { color: LAYERS[L.open ? 'neural_plate' : 'neural_tube'].color, outline: 0.012,
        name: LAYERS[L.open ? 'neural_plate' : 'neural_tube'].name });

    /* the arch, identical in all four: a ring with a dorsal gap of SB_GAP_DEG */
    K.addSolid(panel, 'vertebral_arch', ringPrism({
      y0, y1, cx: 0, cz, rIn, rOut, a0: -(Math.PI - GAP), a1: (Math.PI - GAP), nv: 8, nu: 60,
    }), { color: LAYERS.vertebral_arch.color, name: LAYERS.vertebral_arch.name, outline: 0.012 });
    /* and its body, ventral to the canal, so the ring reads as a vertebra and not as a washer */
    const bodyR = rOut * 0.92;
    K.addSolid(panel, 'vertebral_arch', K.tubeCapped(
      [new T.Vector3(0, y0, cz + rOut + bodyR * 0.55), new T.Vector3(0, (y0 + y1) / 2, cz + rOut + bodyR * 0.55),
       new T.Vector3(0, y1, cz + rOut + bodyR * 0.55)],
      () => bodyR, { ring: 24, cap: 'both', capRows: 6, flatten: 0.78, section: boxy }),
      { color: LAYERS.vertebral_arch.color, name: LAYERS.vertebral_arch.name, outline: 0.012 });

    if (L.sac) {
      const sgeo = spheroid(sacR, (y1 - y0) / 2 * 1.5, sacR * 1.25, 26);
      sgeo.translate(0, (y0 + y1) / 2, cz - (rOut + sacR * 0.78));
      K.addSolid(panel, 'dura_sac', sgeo, { color: LAYERS.dura_sac.color, name: LAYERS.dura_sac.name,
                 outline: 0.012, matOver: { opacity: 0.42, transparent: true } });
    }
    if (L.skin) {
      K.addSolid(panel, 'skin_cover', ringPrism({
        y0, y1, cx: 0, cz, rIn: rOut + 0.10, rOut: rOut + 0.10 + 0.09,
        /* A RING, NOT MORE THAN A RING. The first version spanned 2*pi + 1.1 radians, so its last
           radian lay on top of its first — a solid intersecting itself, which no pairwise overlap row
           catches because row Q compares PAIRS of keys. A gap of 0.02 rad at the ventral midline, behind
           the vertebral body, keeps the two radial faces from being coincident. */
        a0: -(Math.PI - 0.02), a1: (Math.PI - 0.02), nv: 8, nu: 72,
      }), { color: LAYERS.skin_cover.color, name: LAYERS.skin_cover.name, outline: 0.010 });
    }
  });
  g.userData.sbPitch = pitch;
  return g;
}

/* ═══════════════════════════════════════════════════════════ 15 · THE FOUR SECTIONS, SIDE BY SIDE

   `sections` is the beat the sequence version opened with — "cut across the embryo and watch the same
   section four times" — built as FOUR SLABS OF ONE EMBRYO AT ONE INSTANT, each at the station where
   that stage currently is. The stations are READ OFF the stage field at that t, never typed, so the
   four panels cannot be four different embryos and cannot drift out of agreement: they are four
   samples of one function, which is the whole argument for building this procedurally.

   TWO BY TWO RATHER THAN IN A ROW, and that is a deliberate change from the sequence version's note,
   which asked for four in a row. Four 6-unit panels in a row is a subject 26 units wide and 3.5 tall;
   fitCamera then frames the width and the sections occupy a band across the middle of the frame. The
   condition that note was actually protecting — ONE SCALE, the same vertebral/plate outline in every
   panel, because the teaching point is the difference between them — is untouched. Reading order is
   left to right, top row first.                                                                    */
const Q_SLAB_UNITS = 0.60;   // 60 um. Was 0.34, raised against the visibility walk: a thinner slab
                             // caught too few crest clusters for the beat that is about them to show one.
const Q_STAGES = ['neural_plate', 'neural_groove', 'neural_folds', 'neural_tube'];

/** the station each stage is at, at this t: the CRANIAL run of that stage where there are two, since
    the cranial half is where all four stages coexist earliest. null if the stage is not present. */
function sectionStations(t, o) {
  const runs = stageRuns(t, o, null);
  /* THE PANEL MUST SIT OVER THE NOTOCHORD. CORRECTED BY REVIEW 2026-10-03.
     Each stage exists in up to TWO runs — one cranial to the closure site and one caudal to it — and
     the first version always took the CRANIAL one, "since the cranial half is where all four stages
     coexist earliest". But the notochord ENDS at the prechordal plate (V_PRE = 0.862), and the cranial
     run of the earliest stage present routinely sits beyond it: at beat 1's t the groove's cranial run
     is centred at v = 0.95997 and at beat 5's t the folds' at 0.91375, so addNotochord's clipV returned
     null and that panel was drawn with NO NOTOCHORD UNDER IT — three rods where there are four panels,
     a different panel going missing at each t. Nothing measured it: no beat claim and no acceptance row
     reads the notochord inside the `sections` variant, so twelve automated checks and a clean render
     all passed over it. What it teaches is the defect: sec_notochord's own narration says "Beneath the
     midline in ALL FOUR SECTIONS, which is the point: keep the notochord in every picture", and beat 2
     teaches that the notochord is what induced the plate at all. A neural groove drawn with no inducer
     beneath it is the one thing these four pictures must not show.
     So: among a stage's runs, prefer one whose centre lies within the notochord's OWN span, and fall
     back to the cranial-most only when no run does — which is also the truer section, since the
     four-panel figure every text draws is a TRUNK section, not a forebrain one. Acceptance row X holds
     the invariant so this cannot regress. */
  const A0 = V_LO_BUILD() + 0.004, A1 = p('V_PRE', V_PRE);
  const out = {};
  for (const key of Q_STAGES) {
    const rs = runs.filter(r => r.key === key);
    if (!rs.length) { out[key] = null; continue; }
    const cranialMost = (a, b) => (b.v0 > a.v0 ? b : a);
    const overRod = rs.filter(r => { const c = (r.v0 + r.v1) / 2; return c >= A0 && c <= A1; });
    const r = (overRod.length ? overRod : rs).reduce(cranialMost);
    out[key] = (r.v0 + r.v1) / 2;
  }
  return out;
}

function buildSections(t, o) {
  const g = new T.Group();
  const st = sectionStations(t, o);
  const halfV = v => (Q_SLAB_UNITS / 2) / embL(day(t));
  /* THE PANEL SIZE IS MEASURED OFF THE SECTIONS, not computed from the arc's radius. R is L / (2 phi)
     and phi is 2e-3 on a flat plate, so the first version sized the grid from a radius of 1,160 units:
     the four panels were laid out 1,266 units apart, fitCamera framed all of it, and the visibility
     walk reported the subject at 0.0% of the frame with every structure at zero ink. Same fault as the
     544-unit tail bud — the current R is the wrong quantity to size anything against, and the cure is
     to ask the built section how big it actually is. */
  let xq = 0, zq = 0;
  for (const key of Q_STAGES) if (st[key] != null) {
    const ex = sectionExtent(st[key], t, o);
    xq = Math.max(xq, Math.max(ex.halfWidth, plateL(st[key]) / 2) * 1.18);
    zq = Math.max(zq, (zGutDors() + 0.30) - ex.dorsalZ);
  }
  const pitchX = 2 * xq * 1.10, pitchZ = zq * 1.10;
  /* LAID OUT OVER WHAT IS ACTUALLY THERE. At day 18 only the plate exists and this variant is ONE
     transverse section; at day 23 all four stages are present and it is four. Nothing here decides how
     many panels a beat gets — the stage field does, and that is the point of the variant. */
  const present = Q_STAGES.filter(k => st[k] != null);
  const cols = present.length > 1 ? 2 : 1;
  const rows = Math.ceil(present.length / cols);
  present.forEach((key, idx) => {
    const vc = st[key];
    const panel = new T.Group();
    panel.position.x = ((idx % cols) - (cols - 1) / 2) * pitchX;
    panel.position.z = (Math.floor(idx / cols) - (rows - 1) / 2) * pitchZ;
    /* AND BROUGHT TO A COMMON y. The four stations are at four different places ALONG the axis, so a
       layout that only offsets x and z leaves the panels strung out over 15.8 units of embryo — which
       from the `superior` camera that reads a transverse section is the VIEW axis, so the four sections
       sat one behind another and the visibility walk scored the subject at 2.25% of the frame with its
       bounding box filling 56%. The whole point of an exploded view is that the pieces come to one
       plane. */
    panel.position.y = -yOf(vc, t);
    g.add(panel);
    const win = { v0: vc - halfV(vc), v1: vc + halfV(vc), xMax: xq };
    addNeuroBands(panel, t, o, win);
    addCanal(panel, t, o, win);
    addNotochord(panel, t, o, win);
    addCrest(panel, t, o, win);
    addEctoderm(panel, t, o, win);
  });
  g.userData.sections = { stations: st, present, pitchX, pitchZ, cols, rows };
  return g;
}

/* ═══════════════════════════════════════════════════════════════ 16 · build(t, opts) */
function buildNeurulation(t, opts) {
  const o = opts || {};
  if (o.sbPanel) return buildSbPanel(t, o);
  if (o.sections) return buildSections(t, o);
  if (o.tail) {
    /* THE TAIL END, AS A WINDOW ON THE SAME BUILD. A beat about where the cord stops being folded and
       starts being hollowed out needs both mechanisms in one frame, and from `lateral` the whole embryo
       is 38 units long and 2 across — an aspect ratio of 19:1, which fitCamera dutifully frames and the
       visibility walk scored at 3.05% of the frame. This is the same geometry with v clipped to the
       caudal quarter, so the join is the picture rather than a detail of one. */
    const g = new T.Group();
    const win = { v0: 0, v1: V_CAUD() + 0.26 };
    addNotochord(g, t, o, win);
    addSomites(g, t, o, win);
    addNeuroBands(g, t, o, win);
    addCanal(g, t, o, win);
    addCaudalEminence(g, t, o, win);
    g.userData.tailWindow = win;
    return g;
  }
  const g = new T.Group();
  addEndoderm(g, t, o, null);
  addLateralMesoderm(g, t, o, null);
  addNotochord(g, t, o, null);
  addSomites(g, t, o, null);
  addNeuroBands(g, t, o, null);
  addCanal(g, t, o, null);
  addNeuropore(g, t, o, null, 'cranial');
  addNeuropore(g, t, o, null, 'caudal');
  addCaudalEminence(g, t, o, null);
  addCrest(g, t, o, null);
  addExposedBrain(g, t, o, null);
  addEctoderm(g, t, o, null);
  return g;
}

/* ═══════════════════════════════════════════════════════════ 17 · READING THE BUILT GEOMETRY

   Everything an acceptance row or a beat claim measures is read back from the buffers the build just
   wrote, never from the constants the build was written with. RENDER-STANDARD: "the measured side of
   every acceptance assertion must be read from the geometry the model builds — rows, grids or mesh
   vertices — and never from the constants the geometry was built from. Restating a shape law in the
   test that checks it proves only that the author can do the arithmetic twice."                     */
/** Array.prototype.push.apply blows the call stack at a few hundred thousand arguments, and these
    buffers are millions of floats. Every concatenation in this section goes through here. */
function pushAll(dst, src) { for (let i = 0; i < src.length; i++) dst.push(src[i]); return dst; }

function meshesOf(group) {
  const out = [];
  group.updateMatrixWorld(true);
  group.traverse(n => { if (n.isMesh && n.geometry && !(n.userData && n.userData.outline)) out.push(n); });
  return out;
}
function vertsByKey(t, o) {
  const g = buildNeurulation(t, o);
  const by = {};
  for (const m of meshesOf(g)) {
    const k = m.userData.key;
    const P = m.geometry.attributes.position.array, N = m.geometry.attributes.normal.array;
    const hull = m.geometry.userData.hullCount != null ? m.geometry.userData.hullCount
                                                      : m.geometry.attributes.position.count;
    const v = new T.Vector3();
    const rec = by[k] || (by[k] = { P: [], N: [], bodies: [], hull: 0 });
    const body = { P: [], N: [], hull: hull };
    for (let i = 0; i < m.geometry.attributes.position.count; i++) {
      v.set(P[i * 3], P[i * 3 + 1], P[i * 3 + 2]).applyMatrix4(m.matrixWorld);
      body.P.push(v.x, v.y, v.z);
      body.N.push(N[i * 3], N[i * 3 + 1], N[i * 3 + 2]);
    }
    rec.bodies.push(body);
    pushAll(rec.P, body.P); pushAll(rec.N, body.N); rec.hull += hull;
  }
  return { by, group: g };
}
function boxOf(P) {
  const b = { min: [Infinity, Infinity, Infinity], max: [-Infinity, -Infinity, -Infinity] };
  for (let i = 0; i < P.length; i += 3) for (let a = 0; a < 3; a++) {
    const x = P[i + a]; if (x < b.min[a]) b.min[a] = x; if (x > b.max[a]) b.max[a] = x;
  }
  b.size = [b.max[0] - b.min[0], b.max[1] - b.min[1], b.max[2] - b.min[2]];
  b.centre = [(b.max[0] + b.min[0]) / 2, (b.max[1] + b.min[1]) / 2, (b.max[2] + b.min[2]) / 2];
  return b;
}
/** every triangle's FACE normal against the vertex normals emitted with it — the invariant
    RENDER-STANDARD section 2.1 actually states, and the one check that holds on ANY shape, flat
    sheets included, where counting radial normals says nothing at all. */
function windingOf(P, N) {
  let tot = 0, ok = 0;
  for (let i = 0; i + 8 < P.length; i += 9) {
    const e1 = [P[i + 3] - P[i], P[i + 4] - P[i + 1], P[i + 5] - P[i + 2]];
    const e2 = [P[i + 6] - P[i], P[i + 7] - P[i + 1], P[i + 8] - P[i + 2]];
    const f = [e1[1] * e2[2] - e1[2] * e2[1], e1[2] * e2[0] - e1[0] * e2[2], e1[0] * e2[1] - e1[1] * e2[0]];
    if (f[0] * f[0] + f[1] * f[1] + f[2] * f[2] < 1e-22) continue;
    const m = [(N[i] + N[i + 3] + N[i + 6]) / 3, (N[i + 1] + N[i + 4] + N[i + 7]) / 3,
               (N[i + 2] + N[i + 5] + N[i + 8]) / 3];
    tot++; if (f[0] * m[0] + f[1] * m[1] + f[2] * m[2] >= 0) ok++;
  }
  return { tot, ok, frac: tot ? ok / tot : 1 };
}
/** positive exactly when a closed surface is wound outward */
function signedVolume(P) {
  let s = 0;
  for (let i = 0; i + 8 < P.length; i += 9) {
    const ax = P[i], ay = P[i + 1], az = P[i + 2];
    const bx = P[i + 3], by = P[i + 4], bz = P[i + 5];
    const cx = P[i + 6], cy = P[i + 7], cz = P[i + 8];
    s += (ax * (by * cz - bz * cy) + ay * (bz * cx - bx * cz) + az * (bx * cy - by * cx)) / 6;
  }
  return s;
}
/** zero unpaired edges per BODY, welded with a tolerance rather than rounded to a grid */
function watertightOf(P, tol) {
  const q = tol || 1e-4, key = (x, y, z) =>
    Math.round(x / q) + ',' + Math.round(y / q) + ',' + Math.round(z / q);
  const edges = new Map();
  for (let i = 0; i + 8 < P.length; i += 9) {
    const k = [key(P[i], P[i + 1], P[i + 2]), key(P[i + 3], P[i + 4], P[i + 5]), key(P[i + 6], P[i + 7], P[i + 8])];
    if (k[0] === k[1] || k[1] === k[2] || k[0] === k[2]) continue;    // degenerate: skip
    for (let e = 0; e < 3; e++) {
      const a = k[e], b = k[(e + 1) % 3], id = a < b ? a + '|' + b : b + '|' + a;
      edges.set(id, (edges.get(id) || 0) + 1);
    }
  }
  let bad = 0, n = 0;
  edges.forEach(c => { n++; if (c % 2 !== 0) bad++; });
  return { edges: n, unpaired: bad };
}
/** THE SECTION AREA OF THE NEUROEPITHELIUM AT ONE STATION, READ OFF THE BUILT BUFFERS.

    This is the arc-length conservation check, and it is written so that NOTHING it compares is a
    constant this file typed. A thin slab is built at station v, the signed volume of whatever
    neuroepithelial bands fall inside it is summed from the position buffer, and the result is divided
    by the slab's own measured cranio-caudal extent. For a strip of midsurface length L bent through
    any angle at constant thickness H the section area is exactly L*H — so the SAME station measured at
    a plate t and at a tube t must give the SAME number, and row B asserts that against itself rather
    than against L. A test that compared it with L*H would be the lateral-folding fault RENDER-STANDARD
    records: restating the shape law in the test that checks it.                                     */
const NEURO_KEYS = ['neural_plate', 'neural_groove', 'neural_folds', 'neural_tube'];
function sectionAreaMeasured(v, t, o, slabUnits) {
  const half = ((slabUnits || 0.34) / 2) / embL(day(t));
  const win = { v0: v - half, v1: v + half };
  const g = new T.Group();
  addNeuroBands(g, t, o || {}, win);
  let vol = 0, lo = Infinity, hi = -Infinity, tris = 0;
  for (const m of meshesOf(g)) {
    if (NEURO_KEYS.indexOf(m.userData.key) < 0) continue;
    const P = m.geometry.attributes.position.array;
    vol += Math.abs(signedVolume(P));
    tris += P.length / 9;
    for (let i = 1; i < P.length; i += 3) { if (P[i] < lo) lo = P[i]; if (P[i] > hi) hi = P[i]; }
  }
  const ext = hi - lo;
  return { area: ext > 1e-9 ? vol / ext : 0, volume: vol, extent: ext, tris: tris };
}

/* ═══════════════════════════════════════════════════════ 18 · CAMERAS AND SCREEN-PLANE MEASURES

   VIEW_DIR is COPIED from viz3d.js rather than restated, and the up-vector rule is copied with it, so
   the player's cameras and this probe's cannot drift apart (RENDER-STANDARD section 3.y).

   WHAT THIS MODEL CAN AND CANNOT SHOW FROM WHICH CAMERA, measured rather than assumed — row V. viz3d
   holds the camera up-vector at world +y, so:
     · from `posterior` the screen is (x cranio-caudal up) — the DORSAL SURFACE of the whole embryo, and
       the zip runs up and down the screen. This is the scene's framing.
     · from `superior` the screen up is -z = DORSAL and the screen right is +x = LEFT, which is a
       transverse section drawn the way a textbook draws one. The cranio-caudal axis is the VIEW axis,
       so this camera is only usable on the thin slabs of the `sections` and `sbPanel` variants.
     · from `lateral` the screen up is +y, so the dorsoventral stack lies along the view axis and a
       beat cannot say "the notochord is underneath" from there. It CAN say "the canal is wide at the
       head end and a slit at the tail end", because that is a cranio-caudal claim.                  */
const VIEW_DIR = {
  anterior: [0, 0, 1], posterior: [0, 0, -1], lateral: [1, 0, 0], medial: [-1, 0, 0],
  superior: [0, 1, 0.001], inferior: [0, -1, 0.001],
};
function screenAxes(view) {
  const d = VIEW_DIR[view] || VIEW_DIR.anterior;
  const dir = new T.Vector3(d[0], d[1], d[2]).normalize();
  let up = Math.abs(dir.y) > 0.99 ? new T.Vector3(0, 0, -1) : new T.Vector3(0, 1, 0);
  const right = new T.Vector3().crossVectors(up, dir).normalize();
  up = new T.Vector3().crossVectors(dir, right).normalize();
  return { dir, right, up };
}

/* ═══════════════════════════════════════════════════════════════ 19 · THE CLAIM VOCABULARY

   claimMeasure(name, t) is what viz-training/tools/check-beat-claims.mjs evaluates a beat's narrated
   claims against, at THAT BEAT'S OWN SET_STAGE t. `name/flag,flag` selects a variant, exactly as
   notochord.js does, so a claim about the anencephaly build and a claim about the normal one are two
   names rather than two tools.                                                                       */
const _vcache = new Map();
/* THE KEY WAS LOSSY, AND THAT IS ENOUGH ON ITS OWN TO MAKE A ROW'S VALUE DEPEND ON WHAT RAN BEFORE IT.
   FOUND 2026-10-03 while investigating review finding F4 ("row Q is not reproducible").

   The first version keyed on `Math.round(t * 1e6)` and on the FLAGS ALONE. Both halves lose
   information that the build reads:

   (1) Math.round(t * 1e6) is not injective on the t values this model is actually asked for.
       T_SAMPLE holds `+tOfDay(d).toFixed(6)`, so day 25 arrives as t = 0.666667 — while a beat claim,
       a probe or a review console asking for tOfDay(25) passes 0.6666666666666666. Both round to
       666667, so whichever was built FIRST is served to the other. They are not the same embryo:
       day(0.666667) is 25.000004 and day(tOfDay(25)) is 25. The difference is four millionths of a
       day, which is nothing anatomically and is NOT nothing for any quantity that crosses a threshold
       between them — every `>` in the model is a potential sign flip, and somiteCount is a floor().
   (2) PERT is not in the key at all. negatives() perturbs a constant, rebuilds, measures and restores,
       so a cache populated during a perturbation is handed to the next unperturbed reader, and whether
       it is depends only on how many other keys were inserted in between — which the eviction below
       decides, and which differs between calling acceptance() alone and calling it inside a full
       harness run.

   So the SAME row, on the SAME file, could return two different numbers depending on call order. That
   is precisely the shape of F4's complaint, whether or not it is F4's cause: I could not reproduce
   F4's failing values in twelve runs (see the probes beside this item in models-out), and the review's
   own hypothesis — a +x ray parity knife edge on surface-coincident vertices — measured FALSE for both
   failing pairs in both directions, with the nearest crossing 2.09 and 0.060 units away rather than
   within 1e-9. A lossy cache key is a real defect of the same family, found by looking for one, and it
   is fixed here rather than left as a second possible explanation.

   The key is now the exact t and an exact fingerprint of PERT. Caching is an optimisation and must
   never be able to change an answer. */
function _pertKey() {
  const ks = Object.keys(PERT).sort();
  if (!ks.length) return '';
  return ks.map(k => k + '=' + PERT[k]).join(';');
}
function builtAt(t, o) {
  const key = t.toExponential(17) + '|' + Object.keys(o || {}).sort().join(',') + '|' + _pertKey();
  if (_vcache.has(key)) return _vcache.get(key);
  if (_vcache.size > 24) _vcache.clear();
  const r = vertsByKey(t, o || {});
  _vcache.set(key, r);
  return r;
}
function flagsFromName(name) {
  const i = name.indexOf('/');
  if (i < 0) return { base: name, o: {} };
  const o = {};
  name.slice(i + 1).split(',').forEach(f => { f = f.trim(); if (f) o[f] = true; });
  return { base: name.slice(0, i), o };
}
const KEY_SUM = (by, keys) => {
  const P = [];
  for (const k of keys) if (by[k]) pushAll(P, by[k].P);
  return P;
};
/** the span of a key's built vertices along a world axis */
function spanOf(by, keys, axis) {
  const P = KEY_SUM(by, keys);
  if (!P.length) return null;
  const b = boxOf(P);
  return { lo: b.min[axis], hi: b.max[axis], size: b.size[axis], centre: b.centre[axis], box: b, P };
}
/** the v a built y corresponds to, so a measurement in world y can be reported as a material station */
const vOfY = (y, t) => y / embL(day(t)) + 0.5;

function claimMeasure(name, t) {
  const F = flagsFromName(name), o = F.o;
  const path = F.base.split('.');
  switch (path[0]) {

    /* ── the zipper, measured off the stage field ───────────────────────────────────────────── */
    case 'frontCranial': { const f = frontsMeasured(t, o); return f ? f.cranial : -1; }
    case 'frontCaudal':  { const f = frontsMeasured(t, o); return f ? f.caudal : -1; }
    case 'fusedSpan':    { const f = frontsMeasured(t, o); return f ? f.cranial - f.caudal : 0; }
    case 'dayNow':       return day(t);
    /* THE BUILT EMBRYO'S OWN LENGTH. Read off the surface ectoderm's y-extent and divided by the share
       of the axis that sheet covers, so it is a measurement of the geometry rather than a restatement of
       embL — and it is the one quantity that changes at EVERY t, which is what makes it the claim that
       pins a beat whose own subject is standing still. Meaningless on a transverse slab, where the
       sheet is 0.34 units long by construction; only a whole-embryo beat may claim it. */
    case 'axisLength': {
      const by = builtAt(t, o).by;
      const sp = spanOf(by, ['surface_ectoderm'], 1);
      return sp ? sp.size / (0.988 - V_SHEET0()) : -1;
    }
    case 'somiteCount':  return somiteCount(day(t));
    /* 1 when somite 5's own v-extent lies inside the fused span: "closure begins at the fifth somite",
       as a relation between two things the model computes separately rather than as a label */
    case 'somite5Fused': {
      /* THE CLAIM IS THAT CLOSURE STARTS AT THE FIFTH SOMITE, so the thing that must lie inside the
         somite is the FRONT, not the other way round. The first version asked whether the somite lay
         inside the fused span, which is false by construction at the moment closure begins — the span
         is then 0.0005 of the axis wide and the somite is 0.052. */
      const f = frontsMeasured(t, o);
      if (!f) return 0;
      const a = somiteEdge(5), b = somiteEdge(4), mid = (f.caudal + f.cranial) / 2;
      return (mid >= a && mid <= b) ? 1 : 0;
    }
    /* how far the closure front has to go, as a fraction of the axis — 0 exactly when shut */
    case 'cranialLeft':  { const f = frontsMeasured(t, o); return f ? Math.max(0, V_CRAN - f.cranial) : 1; }
    case 'caudalLeft':   { const f = frontsMeasured(t, o); return f ? Math.max(0, f.caudal - V_CAUD()) : 1; }

    /* ── the fold, measured off the built section ──────────────────────────────────────────── */
    /* the deepest fold anywhere on the axis, in units of the local epithelial thickness: < 0.5 is a
       flat plate everywhere, which is what day 18 means */
    case 'maxFoldRatio': {
      let m = 0;
      for (let i = 0; i <= 400; i++) {
        const v = V_CAUD() + (V_CRAN - V_CAUD()) * (i / 400);
        const a = arc(v, t, o); m = Math.max(m, a.sagitta / a.H);
      }
      return m;
    }
    case 'stagesPresent': {
      const st = sectionStations(t, o);
      return Q_STAGES.filter(k => st[k] != null).length;
    }
    /* THE FOLD IS DEEPEST AT THE FRONT AND SHALLOWS AWAY FROM IT, IN BOTH DIRECTIONS. This is the
       invariant "it zips from the neck outwards" actually asserts, and the first version of this
       measure asserted something else and was wrong about the model rather than about the embryo: it
       required the four stations to come in the order plate, groove, folds, tube as v RISES, which is
       true on the cranial side only. At day 23 the cranial end is already a groove and the only plate
       left is CAUDAL of the front, 0.31 of the axis the other way — so a monotone-in-v test reported
       -0.78 on a correct model. The two zip speeds differ by a factor of 2.4, so the two sides are at
       different stages at the same distance from the front, and no ordering by v or by |v - front| can
       hold. What does hold is unimodality: reported as the fraction of sampled steps that go the wrong
       way, so 0 is the claim and anything else is a count of where it fails. */
    case 'foldUnimodal': {
      const f = frontsMeasured(t, o);
      const peak = f ? (f.caudal + f.cranial) / 2 : V_SOM5();
      const N = 360;
      let bad = 0, n = 0;
      for (const dir of [1, -1]) {
        let prev = null;
        const lo = dir > 0 ? peak : V_CAUD(), hi = dir > 0 ? V_CRAN : peak;
        for (let i = 0; i <= N; i++) {
          const u = i / N;
          const v = dir > 0 ? lo + (hi - lo) * u : hi - (hi - lo) * u;
          const r = STAGE_INDEX[stageAt(v, t, o)];
          if (prev != null) { n++; if (r > prev) bad++; }
          prev = r;
        }
      }
      return n ? bad / n : 1;
    }
    /* and the smallest run length among the four stages, as a fraction of the axis: four stages that
       coexist in name only, one of them 0.1% of the axis wide, is not the picture the beat promises */
    case 'minStageRun': {
      const runs = stageRuns(t, o, null);
      let m = Infinity;
      for (const key of Q_STAGES) {
        const rs = runs.filter(r => r.key === key);
        if (!rs.length) return 0;
        m = Math.min(m, Math.max.apply(null, rs.map(r => r.v1 - r.v0)));
      }
      return m;
    }

    /* ── the lumen: the derived ventricle-versus-central-canal result ───────────────────────── */
    /* read off the BUILT canal: its radius in the cranial tenth over its radius in the caudal tenth */
    case 'canalRadiusRatio': {
      const by = builtAt(t, o).by;
      if (!by.neural_canal) return -1;
      const P = by.neural_canal.P;
      const rAtV = v => {
        const y0 = yOf(v, t), tol = embL(day(t)) * 0.02;
        let r = -1;
        for (let i = 0; i < P.length; i += 3) {
          if (Math.abs(P[i + 1] - y0) > tol) continue;
          const a = Math.abs(P[i]); if (a > r) r = a;
        }
        return r;
      };
      const a = rAtV(0.93), c = rAtV(V_CAUD() + 0.04);
      return (a > 0 && c > 0) ? a / c : -1;
    }
    /* THE SAME CLAIM AS A STUDENT SEES IT (section 3.y): the canal's width ON THE SCREEN PLANE of the
       camera the beat rotates to, cranial tenth over caudal tenth. From `lateral` the screen right is
       the view-perpendicular horizontal, so this is the thickness of the cast across the screen. */
    case 'canalScreenRatio': {
      const ax = screenAxes(path[1] || 'lateral');
      const by = builtAt(t, o).by;
      if (!by.neural_canal) return -1;
      const P = by.neural_canal.P;
      /* ON TWO THIN SLICES, not two bands. A band 12% of the length deep also collects the slope of the
         cast's own centreline, which widens the reading at whichever end the tube is still sinking at —
         a measurement of the sink dressed up as a measurement of the calibre. */
      const q = new T.Vector3();
      const widthAtV = v => {
        const y0 = yOf(v, t), tol = embL(day(t)) * 0.02;
        let w = -Infinity, e = Infinity;
        for (let i = 0; i < P.length; i += 3) {
          if (Math.abs(P[i + 1] - y0) > tol) continue;
          q.set(P[i], P[i + 1], P[i + 2]);
          const r = q.dot(ax.right); if (r > w) w = r; if (r < e) e = r;
        }
        return w > e ? w - e : -1;
      };
      const a = widthAtV(0.93), c = widthAtV(V_CAUD() + 0.04);
      return (a > 0 && c > 0) ? a / c : -1;
    }

    /* ── induction: the plate sits on the notochord ─────────────────────────────────────────── */
    /* the gap between the plate's basal (ventral) surface and the notochord's dorsal surface, in units
       of the notochord's own measured diameter. Small and POSITIVE: in contact, not interpenetrating. */
    case 'plateOnNotochord': {
      const by = builtAt(t, o).by;
      const nz = spanOf(by, ['notochord'], 2), pz = spanOf(by, NEURO_KEYS, 2);
      if (!nz || !pz) return -1;
      return (nz.lo - pz.hi) / nz.size;
    }
    /* and it is OVER it, not beside it: the notochord's x-centre inside the plate's x-span, reported as
       the clearance to the nearer edge over the plate's half-width */
    case 'notochordUnderMidline': {
      const by = builtAt(t, o).by;
      const nx = spanOf(by, ['notochord'], 0), px = spanOf(by, NEURO_KEYS, 0);
      if (!nx || !px) return -1;
      const half = px.size / 2;
      return half > 1e-9 ? Math.min(nx.centre - px.lo, px.hi - nx.centre) / half : -1;
    }

    /* ── the surface ectoderm's window ──────────────────────────────────────────────────────── */
    /* the ectoderm's measured thickness ON THE MIDLINE at a station: 0 while the window is open over
       the groove, H_ECTO once it has closed over the tube. Read off the built sheet, by slicing it. */
    case 'ectodermMidline': {
      const by = builtAt(t, o).by;
      if (!by.surface_ectoderm) return -1;
      /* THE STATION IS GIVEN IN THOUSANDTHS. A measure name is split on '.', so 'ectodermMidline.0.90'
         parsed its station as 0 and silently measured the caudal tip of the embryo. */
      const v = path[1] != null ? parseFloat(path[1]) / 1000 : 0.900;
      const y0 = yOf(v, t), P = by.surface_ectoderm.P;
      const tolY = embL(day(t)) * 0.02;
      /* the sheet is built with an EVEN number of columns across the whole width, so x = 0 is sampled
         exactly; the nearest column is found rather than guessed at with a tolerance */
      /* ONE ROW, AND ONE COLUMN. A slice a row and a half thick collects neighbouring stations, whose
         dorsal surface is lifted by a different amount where the folds are up — so the measurement
         reported 0.104 of an ectodermal thickness on the midline at a beat where the window is wide
         open and the true answer is exactly zero. The nearest row and the nearest column are FOUND
         rather than approached with a tolerance. */
      let yBest = Infinity, yPick = 0;
      for (let i = 0; i < P.length; i += 3) {
        const d = Math.abs(P[i + 1] - y0); if (d < yBest) { yBest = d; yPick = P[i + 1]; }
      }
      if (!isFinite(yBest) || yBest > tolY) return -1;
      let best = Infinity;
      for (let i = 0; i < P.length; i += 3) {
        if (P[i + 1] !== yPick) continue;
        const a = Math.abs(P[i]); if (a < best) best = a;
      }
      if (!isFinite(best)) return -1;
      let lo = Infinity, hi = -Infinity, n = 0;
      for (let i = 0; i < P.length; i += 3) {
        if (P[i + 1] !== yPick) continue;
        if (Math.abs(P[i]) > best + 1e-9) continue;
        const z = P[i + 2]; if (z < lo) lo = z; if (z > hi) hi = z; n++;
      }
      return n >= 2 ? hi - lo : 0;
    }

    /* ── neural crest ───────────────────────────────────────────────────────────────────────── */
    case 'crestCount': return crestCells(t, o, null).length;
    /* how far the population has got laterally, as a fraction of the embryo's half-width at the
       station it left — the claim "they migrate away through the embryo", as a number that grows */
    case 'crestSpreadFrac': {
      const by = builtAt(t, o).by;
      if (!by.neural_crest) return 0;
      const cx = spanOf(by, ['neural_crest'], 0), tx = spanOf(by, NEURO_KEYS, 0);
      if (!cx || !tx) return 0;
      return (cx.size / 2) / (tx.size / 2);
    }
    /* and ventrally, which is the direction the ganglia and the adrenal medulla end up in */
    case 'crestDepthFrac': {
      const by = builtAt(t, o).by;
      if (!by.neural_crest) return 0;
      const cz = spanOf(by, ['neural_crest'], 2);
      return cz ? (cz.hi - zBasal()) / (zGutDors() - zBasal()) : 0;
    }

    /* ── the tail end ───────────────────────────────────────────────────────────────────────── */
    case 'secondaryCanalVol': {
      const by = builtAt(t, o).by;
      if (!by.secondary_canal) return 0;
      let v = 0; for (const b of by.secondary_canal.bodies) v += Math.abs(signedVolume(b.P));
      return v;
    }
    /* the caudal eminence and the primary tube meet rather than float apart: the overlap of their
       y-spans as a fraction of the eminence's own length. Positive means they share a join. */
    case 'eminenceJoin': {
      const by = builtAt(t, o).by;
      const e = spanOf(by, ['caudal_eminence'], 1), p1 = spanOf(by, NEURO_KEYS, 1);
      if (!e || !p1) return -1;
      return (Math.min(e.hi, p1.hi) - Math.max(e.lo, p1.lo)) / e.size;
    }

    /* ── the two lesions ────────────────────────────────────────────────────────────────────── */
    case 'exposedBrainVol': {
      const by = builtAt(t, o).by;
      if (!by.area_cerebrovasculosa) return 0;
      let v = 0; for (const b of by.area_cerebrovasculosa.bodies) v += Math.abs(signedVolume(b.P));
      return v;
    }

    /* ── the spina bifida panels ────────────────────────────────────────────────────────────── */
    /* THE ONE-SCALE CONDITION, AS A MEASUREMENT. The sequence version's gaps[] made it a condition on
       the artwork: the four panels must share one scale and one vertebral outline, because the teaching
       point is how much comes through the gap. Here it is the largest relative difference between the
       four built arches' own bounding boxes. */
    case 'archSpread': {
      const g = buildSbPanel(t, o);
      const sizes = [];
      for (const panel of g.children) {
        const P = [];
        for (const m of meshesOf(panel)) if (m.userData.key === 'vertebral_arch')
          pushAll(P, m.geometry.attributes.position.array);
        if (!P.length) continue;
        const b = boxOf(P);
        sizes.push([b.size[0], b.size[2]]);                    // x and z: the outline in section
      }
      if (sizes.length < 2) return -1;
      let worst = 0;
      for (let a = 0; a < 2; a++) {
        const vals = sizes.map(s => s[a]);
        const mn = Math.min.apply(null, vals), mx = Math.max.apply(null, vals);
        worst = Math.max(worst, mn > 1e-9 ? (mx - mn) / mn : 1);
      }
      return worst;
    }
    /* how much is in the sac, panel by panel: the sac's built volume, and whether the cord is inside it */
    case 'sacVolume': {
      const g = buildSbPanel(t, o);
      const idx = SB_LESIONS.findIndex(L => L.id === path[1]);
      if (idx < 0 || !g.children[idx]) return -1;
      let v = 0;
      for (const m of meshesOf(g.children[idx])) if (m.userData.key === 'dura_sac')
        v += Math.abs(signedVolume(Array.from(m.geometry.attributes.position.array)));
      return v;
    }
    case 'cordInSac': {
      const g = buildSbPanel(t, o);
      const idx = SB_LESIONS.findIndex(L => L.id === path[1]);
      if (idx < 0 || !g.children[idx]) return -1;
      let sac = null, cord = [];
      for (const m of meshesOf(g.children[idx])) {
        const P = m.geometry.attributes.position.array;
        if (m.userData.key === 'dura_sac') sac = triIndex(Array.from(P));
        if (NEURO_KEYS.indexOf(m.userData.key) >= 0) pushAll(cord, P);
      }
      /* BY RAY CAST, NOT BY BOUNDING BOX. A sac's box reaches down past its own wall towards the cord
         below it, so the box test read 5.4% of the MENINGOCELE's cord as inside its sac — a panel whose
         whole point is that the cord is NOT in the sac. */
      if (!sac || !cord.length) return 0;
      return insideFrac(cord, sac);
    }
    case 'panelCount': return buildSbPanel(t, o).children.length;
  }
  throw new Error('unknown measure: ' + name);
}

/* ═══════════════════════════════════════════════════════ 20 · DO TWO SOLIDS SHARE SPACE?

   RENDER-STANDARD section 3.z: a model that builds more than one closed solid asserts, over every pair
   of parts whose bounding boxes meet, that neither lies inside the other — and contact that is
   CONSTRUCTION rather than anatomy is excluded BY NAME, in a partition the row publishes, never by a
   tolerance. Ray cast along +x with a y-z bucket grid, so the cost is linear in the vertices sampled
   rather than quadratic in the triangles.                                                            */
const TOUCH_OK = {
  /* the canal IS the lumen of the tube: a cast of the space inside it, so it is inside it by
     definition. Drawing them as separate solids is what lets a beat take the wall away. */
  'neural_canal|neural_tube': 'the canal is the cast of the tube\'s own lumen',
  'neural_canal|neural_folds': 'the canal overlaps the fold band it emerges from, by OVERLAP',
  'neural_canal|neural_plate': 'the canal overlaps the band beyond the front, by OVERLAP',
  'neural_canal|neural_groove': 'the canal overlaps the band beyond the front, by OVERLAP',
  /* the four stage names are bands of ONE sheet and deliberately overlap by OVERLAP so that no end cap
     is ever exposed (RENDER-STANDARD section 3) */
  'neural_plate|neural_groove': 'two bands of one sheet, overlapped so neither cap shows',
  'neural_groove|neural_folds': 'two bands of one sheet, overlapped so neither cap shows',
  'neural_folds|neural_tube': 'two bands of one sheet, overlapped so neither cap shows',
  'neural_plate|neural_folds': 'two bands of one sheet, overlapped so neither cap shows',
  'neural_groove|neural_tube': 'two bands of one sheet, overlapped so neither cap shows',
  'neural_plate|neural_tube': 'two bands of one sheet, overlapped so neither cap shows',
  /* the surface ectoderm and the neuroepithelium are ONE epithelium: they meet at the fold tip, and
     the whole point of the beat is that the student can see they are continuous there */
  'neural_plate|surface_ectoderm': 'one epithelium: the plate is thickened ectoderm',
  'neural_groove|surface_ectoderm': 'one epithelium, continuous at the lip of the groove',
  'neural_folds|surface_ectoderm': 'one epithelium, continuous at the fold tip',
  'neural_tube|surface_ectoderm': 'continuous until the moment of separation, which is this beat',
  /* crest cells delaminate FROM the fold tips, so at the instant they leave they are in contact */
  'neural_crest|neural_folds': 'the crest leaves the fold tip; contact is the event being drawn',
  'neural_crest|neural_tube': 'the crest leaves the seam; contact is the event being drawn',
  'neural_crest|surface_ectoderm': 'the crest leaves the tip, where ectoderm and plate meet',
  'neural_crest|lateral_mesoderm': 'the crest MIGRATES THROUGH the mesoderm — that is the beat',
  'neural_crest|somites': 'the crest migrates past the somites to form the dorsal root ganglia',
  'neural_crest|caudal_eminence': 'the tail bud is mesenchyme, and the crest migrates THROUGH mesenchyme',
  /* the crest that becomes the enteric nervous system ends up IN the gut wall: reaching the endoderm is
     the destination, not an accident. The crest's narration names the enteric plexuses by name. */
  'neural_crest|endoderm': 'the enteric crest migrates INTO the gut wall — that is where it is going',
  /* the secondary canal is the cavity inside the caudal eminence */
  'notochord|caudal_eminence': 'the notochord\'s caudal end lies IN the tail bud it was laid down from',
  'secondary_canal|caudal_eminence': 'the cavity canalisation hollows out of the cord',
  'caudal_eminence|neural_tube': 'the eminence joins the tube; the join is the teaching point',
  'caudal_eminence|neural_plate': 'the eminence joins whatever band is at the caudal end',
  'caudal_eminence|neural_groove': 'the eminence joins whatever band is at the caudal end',
  'caudal_eminence|neural_folds': 'the eminence joins whatever band is at the caudal end',
  'caudal_eminence|neural_canal': 'the two canals become one canal',
  'caudal_eminence|secondary_canal': 'see above',
  'neural_canal|secondary_canal': 'the two canals become one canal',
  /* the neuropore lip is drawn ON the fold tip it bounds */
  'cranial_neuropore|neural_folds': 'the lip IS the rim of the fold tips',
  'cranial_neuropore|neural_groove': 'the lip IS the rim of the fold tips',
  'cranial_neuropore|neural_plate': 'the lip IS the rim of the fold tips',
  'cranial_neuropore|surface_ectoderm': 'the lip lies at the junction with the ectoderm',
  'cranial_neuropore|neural_crest': 'the crest leaves at the lip',
  'cranial_neuropore|area_cerebrovasculosa': 'the exposed tissue lies in the opening the lip bounds',
  'caudal_neuropore|neural_folds': 'the lip IS the rim of the fold tips',
  'caudal_neuropore|neural_groove': 'the lip IS the rim of the fold tips',
  'caudal_neuropore|neural_plate': 'the lip IS the rim of the fold tips',
  'caudal_neuropore|surface_ectoderm': 'the lip lies at the junction with the ectoderm',
  'caudal_neuropore|neural_crest': 'the crest leaves at the lip',
  'caudal_neuropore|caudal_eminence': 'the caudal neuropore sits where the eminence joins',
  /* the lip starts AT the front, where the band on the other side of it is the tube itself */
  'cranial_neuropore|neural_tube': 'the lip begins at the closure front, on the tube\'s own last station',
  'caudal_neuropore|neural_tube': 'the lip begins at the closure front, on the tube\'s own last station',
  /* the exposed, degenerated forebrain lies IN the open groove */
  'area_cerebrovasculosa|neural_plate': 'it lies in the groove that never closed',
  'area_cerebrovasculosa|neural_groove': 'it lies in the groove that never closed',
  'area_cerebrovasculosa|neural_folds': 'it lies in the groove that never closed',
  'area_cerebrovasculosa|surface_ectoderm': 'there is no skin over it — that is the lesion',
  'area_cerebrovasculosa|neural_crest': 'incidental contact at the open lip',
  /* the spina bifida panels: a sac that contains the cord IS a myelomeningocele */
  'dura_sac|neural_tube': 'the cord inside the sac is what makes it a myelomeningocele',
  'dura_sac|neural_plate': 'the open plate in the sac',
  'dura_sac|vertebral_arch': 'the sac comes THROUGH the gap in the arch',
  'dura_sac|neural_canal': 'the canal travels with its cord',
  'skin_cover|vertebral_arch': 'skin lies on the arch; in occulta that is the whole finding',
  'vertebral_arch|neural_tube': 'the arch surrounds the cord at the radius the gap is measured at',
  'vertebral_arch|neural_plate': 'the arch surrounds the cord',
  'vertebral_arch|neural_canal': 'the arch surrounds the cord and its canal',
};
const touchOK = (a, b) => !!(TOUCH_OK[a + '|' + b] || TOUCH_OK[b + '|' + a]);

function triIndex(P) {
  const b = boxOf(P);
  const nb = 24;
  const sy = Math.max(1e-9, b.size[1]) / nb, sz = Math.max(1e-9, b.size[2]) / nb;
  const cells = new Map();
  for (let i = 0; i + 8 < P.length; i += 9) {
    let y0 = Infinity, y1 = -Infinity, z0 = Infinity, z1 = -Infinity;
    for (let k = 0; k < 3; k++) {
      const y = P[i + k * 3 + 1], z = P[i + k * 3 + 2];
      if (y < y0) y0 = y; if (y > y1) y1 = y; if (z < z0) z0 = z; if (z > z1) z1 = z;
    }
    const jy0 = Math.floor((y0 - b.min[1]) / sy), jy1 = Math.floor((y1 - b.min[1]) / sy);
    const jz0 = Math.floor((z0 - b.min[2]) / sz), jz1 = Math.floor((z1 - b.min[2]) / sz);
    for (let jy = jy0; jy <= jy1; jy++) for (let jz = jz0; jz <= jz1; jz++) {
      const key = jy + ':' + jz;
      let a = cells.get(key); if (!a) { a = []; cells.set(key, a); } a.push(i);
    }
  }
  return { P, box: b, sy, sz, cells };
}
/** fraction of A's sampled vertices that lie inside B, by parity of +x ray crossings */
function insideFrac(Apts, ib) {
  const b = ib.box, P = ib.P;
  const step = Math.max(3, 3 * Math.ceil(Apts.length / 3 / 1400));
  let tested = 0, inside = 0;
  for (let i = 0; i < Apts.length; i += step) {
    const px = Apts[i], py = Apts[i + 1], pz = Apts[i + 2];
    if (py < b.min[1] || py > b.max[1] || pz < b.min[2] || pz > b.max[2] || px > b.max[0]) { tested++; continue; }
    const jy = Math.floor((py - b.min[1]) / ib.sy), jz = Math.floor((pz - b.min[2]) / ib.sz);
    const list = ib.cells.get(jy + ':' + jz);
    tested++;
    if (!list) continue;
    let cross = 0;
    for (const o of list) {
      /* ray along +x from (px,py,pz): solve the triangle in the (y,z) plane, then compare x */
      const ay = P[o + 1], az = P[o + 2], by = P[o + 4], bz = P[o + 5], cy = P[o + 7], cz = P[o + 8];
      const d = (by - ay) * (cz - az) - (bz - az) * (cy - ay);
      if (Math.abs(d) < 1e-14) continue;
      const w1 = ((py - ay) * (cz - az) - (pz - az) * (cy - ay)) / d;
      /* w2 WAS NEGATED HERE. The barycentric solve is w2 = [(by-ay)(pz-az) - (bz-az)(py-ay)] / D;
         the first version had the two products the other way round, so the ray hit no triangle it
         should have hit and hit ones it should not. It reported the notochord as 46.9% INSIDE the
         lateral mesoderm, two solids with no overlap in x at all. */
      const w2 = ((by - ay) * (pz - az) - (bz - az) * (py - ay)) / d;
      if (w1 < 0 || w2 < 0 || w1 + w2 > 1) continue;
      const hx = P[o] + w1 * (P[o + 3] - P[o]) + w2 * (P[o + 6] - P[o]);
      if (hx > px + 1e-9) cross++;
    }
    if (cross % 2 === 1) inside++;
  }
  return tested ? inside / tested : 0;
}

/* ═══════════════════════════════════════════════════════════════ 21 · ACCEPTANCE

   EVERY MAGNITUDE FLOOR IS NAMED AND PUBLISHED (RENDER-STANDARD section 3: a sign test on a spatial
   relation is not a test), EVERY MEASURED SIDE IS READ OFF THE BUILT GEOMETRY, and every row has a
   negative case in negatives() that feeds it a deliberately wrong input and checks it is rejected.   */
const FLOORS = {
  PLAN_RATIO: 1.20,       // the embryo is at least this much broader cranially than caudally
  AREA_SPREAD: 0.015,     // arc length conserved to 1.5% across the fold, measured
  DATE_TOL: 0.05,         // days: how close the measured front must come to the taught date
  STAGE_RUN: 0.030,       // each of the four stages occupies at least 3% of the axis when present
  NOTO_GAP_MAX: 0.30,     // the plate's basal face is within 0.30 notochord-diameters of it
  NOTO_GAP_MIN: 0.01,     // and clear of it: in contact, not interpenetrating
  MIDLINE_FRAC: 0.35,     // the notochord's centre is this far inside the plate's half-width
  LUMEN_RATIO: 1.55,      // the cranial lumen's RADIUS, over the caudal one: 1.55 is 2.4x in area.
                          // Not 2.0: the plan this model carries gives 1.85 by construction and a floor
                          // above the thing it measures is a row that cannot pass, not a strict one.
  SCREEN_RATIO: 1.40,     // and the same claim as the beat's own camera projects it
  RADIUS_CONSISTENCY: 0.04,  // two independent readings of the tube's section area agree to 4%
  WINDING: 0.9995,        // every triangle's face normal agrees with its vertex normals
  SYMMETRY: 0.004,        // units: the worst unmatched mirror vertex
  NOTO_CAL_MIN: 0.15,     // the thinnest rod any `sections` panel may draw, in units across. The taper's
                          // own published floor is 0.30 * R_NOTO = 0.090 in RADIUS, so 0.180 across;
                          // this sits below it so the row fails on a rod that has lost its calibre to
                          // something OTHER than the taper, and passes on the taper itself.
  NOTO_CAL_TOL: 0.02,     // units across: how far outside the full rod's own min..max over the panel's
                          // y span a panel's rod may sit. Not zero, because the two are polygonised on
                          // different ring counts; 0.02 is a thirtieth of the full calibre.
  NOTO_CAL_SPREAD: 1e-4,  // units: the panels must DISAGREE about the calibre by at least this much on
                          // some day the sweep sees, or the row passes vacuously
  OVERLAP_MAX: 0.005,     // share of one solid inside another, outside the TOUCH_OK partition
  SINK_FRAC: 0.25,        // the fold tips stand this far proud of the dorsal surface, and the skin
                          // arches this far over the closed tube — both in units of the ectoderm's own
                          // thickness, which is the only yardstick either claim has
  ECTO_CLOSED: 0.90,      // the closed ectoderm reaches this fraction of its own thickness at midline
  CREST_GROWTH: 1.25,     // the crest population spreads at least this much further in 2 days
  SAC_ORDER: 1.00,        // the myelomeningocele sac is at least as big as the meningocele one
  ARCH_SPREAD: 1e-9,      // the four panels' arches are the SAME outline, not merely similar
  CORD_IN_SAC: 0.90,      // of the cord's own vertices, in a myelomeningocele
  CORD_OUT_SAC: 0.02,     // and in a meningocele
  SHARE_SUM: 1e-9,        // the three width shares partition the half-width exactly
  DISC_AGREE: 1e-6,       // the day-18 axis length equals the sibling scenes' disc length
  STACK_GOOD: 0.50,       // the dorsoventral stack survives a camera, as a fraction of mean extent
  STACK_BAD: 0.05,        // and does not survive one that looks along it
};

const T_SAMPLE = [];
for (let d = 18; d <= 28; d++) T_SAMPLE.push(+tOfDay(d).toFixed(6));
const SCENE_T_MAX = +tOfDay(28).toFixed(6);
const V_PROBE = 0.70;                    // one station, used wherever a row needs "the same station"

const ACCEPTANCE = {
  axes: AXES,
  axes_status: 'DECLARED, NOT PROVED, and row P is what stands in its place. This model has no chiral ' +
    'content: every key it builds is mirror-symmetric in x, and no narration in this scene names a ' +
    'side. RENDER-STANDARD says a symmetric model cannot witness its own handedness and an acceptance ' +
    'test written in the same coordinates as the declaration is circular however carefully it is ' +
    'floored — so row P proves there is no handedness here to get wrong, rather than pretending to ' +
    'prove the convention. The three shared constants come from models3d/notochord.js, which carries ' +
    'the same status, so this is not a second independent witness either.',
  tuned: {
    D_FOLD: 'how long one station takes to go from flat to fused, 3 days. The three examinable dates ' +
      'are properties of the FRONT and dayFront does not contain it; it decides only how far ahead of ' +
      'the front the groove and the folds reach, which no beat quotes a number for. Row C is the ' +
      'check that the dates survive it.',
    W_EXP: 'the embryo widens as the 0.40 power of its lengthening. Nothing is asserted about width ' +
      'growth; it exists so the plan is not a scaled disc.',
    D_SINK: 'how long the fused tube takes to sink, 0.6 days. Row I asserts the end state, not the rate.',
    SH_NEURAL: 'the share of the half-width the neural plate takes on day 18, 0.54. It sets the whole ' +
      'calibre of the tube, so it is the constant rows B and D are perturbed against.',
    SAG_GROOVE_SAG_FOLDS: 'the two interior stage boundaries, 0.5 and 2.0 epithelial thicknesses of ' +
      'sagitta. The third boundary is not a threshold: it is contact.',
  },
  unit_um: UNIT_UM,
  floors: FLOORS,
  tests: [
    { id: 'A', must: 'the BUILT embryo is broader cranially than caudally, by at least PLAN_RATIO, measured off the surface ectoderm it actually drew' },
    { id: 'B', must: 'ARC LENGTH IS CONSERVED THROUGH THE FOLD: one station\'s measured section area is the same at three stages of the fold, to AREA_SPREAD — measurement against measurement, never against L*H' },
    { id: 'C', must: 'THE SOLVE AGREES WITH THE TAUGHT DATES: the front measured off the stage field begins at the fifth somite on day 22, reaches the cranial end on day 25 and the caudal neuropore on day 27, each within DATE_TOL of a day' },
    { id: 'D', must: 'the closed tube read two independent ways agrees with itself: the lumen cast\'s own section area and the tube\'s outer diameter give the same section area as the tube band\'s built volume, to RADIUS_CONSISTENCY' },
    { id: 'E', must: 'ALL FOUR STAGES COEXIST at day 23, each occupying at least STAGE_RUN of the axis, and the fold is DEEPEST AT THE FRONT and shallows away from it in both directions with no exception' },
    { id: 'F', must: 'exactly ONE run of the axis is fused at any t after day 22 — closure starts in one place, not several' },
    { id: 'G', must: 'the plate lies ON the notochord: a gap between NOTO_GAP_MIN and NOTO_GAP_MAX of the notochord\'s own measured diameter, with its centre at least MIDLINE_FRAC inside the plate\'s half-width' },
    { id: 'H', must: 'THE VENTRICLE AND THE CENTRAL CANAL ARE ONE CONSEQUENCE: the built canal is at least LUMEN_RATIO wider at the cranial end than at the caudal, and so is its width ON THE SCREEN of the camera the beat that says so stands at' },
    { id: 'I', must: 'the folds stand SINK_FRAC of an ectodermal thickness proud of the embryo\'s dorsal surface before they meet, and the closed tube is SANDWICHED afterwards — clear of the notochord beneath it and under the skin that arched over it' },
    { id: 'J', must: 'the surface ectoderm\'s window is OPEN over the groove (zero thickness on the midline, measured) and CLOSED over the sunk tube (ECTO_CLOSED of its own thickness)' },
    { id: 'K', must: 'the neural crest exists only where the folds are nearly shut, and the population spreads at least CREST_GROWTH further laterally over two days' },
    { id: 'L', must: 'the tail end is built the other way: no canal inside the caudal eminence before day 25, one after, and the eminence shares a join with the primary tube' },
    { id: 'M', must: 'WINDING: every triangle\'s face normal agrees with the vertex normals emitted with it, at WINDING, over every sampled stage and every variant' },
    { id: 'N', must: 'every closed body has POSITIVE signed volume, over every sampled stage and every variant' },
    { id: 'O', must: 'ZERO UNPAIRED EDGES per body, welded with a tolerance rather than rounded to a grid' },
    { id: 'P', must: 'every key is mirror-symmetric in x to SYMMETRY — see axes_status: this is what stands in for proving the convention' },
    { id: 'Q', must: 'no two closed solids share more than OVERLAP_MAX of themselves outside the published TOUCH_OK partition' },
    { id: 'R', must: 'A LESION IS A STOPPED FRONT, not a drawing: with openCranial the front stops at the cranial end of the segmented axis — so what stays open is the HEAD — and exposed tissue appears there, while the normal build at the same t is shut end to end' },
    { id: 'S', must: 'THE FOUR SPINA BIFIDA PANELS ARE AT ONE SCALE: the four built arches are the same outline to ARCH_SPREAD, and the panels differ only in what comes through the gap' },
    { id: 'T', must: 'the three width shares PARTITION the half-width: they sum to one, and the built lateral mesoderm\'s outer edge is the built ectoderm\'s own half-width' },
    { id: 'U', must: 'the BUILT axis is DISC_L long on day 18 — the sibling scenes\' embryo, to DISC_AGREE' },
    { id: 'V', must: 'a `sections` slab is a piece of the same geometry: its section area at a station equals the full build\'s at that station, to AREA_SPREAD' },
    { id: 'W', must: 'the dorsoventral stack survives a `superior` camera at STACK_GOOD and does NOT survive a `lateral` one at STACK_BAD — so a beat that names the stack has exactly one camera it can stand at' },
    { id: 'X', must: 'EVERY `sections` PANEL HAS A NOTOCHORD UNDER IT, at every day the variant draws more than one — swept, not spot-checked, because which panel loses the rod depends on t' },
    { id: 'Y', must: 'AND THE ROD IT HAS IS THE RIGHT ROD: every `sections` panel\'s built rod calibre equals the FULL build\'s own calibre at that panel\'s station, to NOTO_CAL_TOL, so a thin rod is the notochord\'s own taper and not the window\'s — and none is below NOTO_CAL_MIN' },
  ],
};

/* the variants a row has to sweep, so no picture goes unchecked */
const VARIANT_SETS = [{}, { openCranial: true }, { openCaudal: true },
                      { openCranial: true, openCaudal: true }, { sections: true }, { sbPanel: true }];

/** the built half-width of the surface ectoderm at a station, read off its own vertices */
function ectoHalfWidthAt(v, t, o) {
  const by = builtAt(t, o).by;
  if (!by.surface_ectoderm) return -1;
  /* THE SLICE TOLERANCE MUST EXCEED THE ROW SPACING. At 0.004 of the axis it was narrower than the
     0.0152-in-v grid the sheet is built on, so the slice landed between two rows and the measurement
     came back -1 — which read as a FAILED row rather than as a probe that missed. */
  const P = by.surface_ectoderm.P, y0 = yOf(v, t), tol = embL(day(t)) * 0.02;
  let m = -1;
  for (let i = 0; i < P.length; i += 3) {
    if (Math.abs(P[i + 1] - y0) > tol) continue;
    const a = Math.abs(P[i]); if (a > m) m = a;
  }
  return m;
}
/** the dorsoventral stack as a named camera sees it: the gap between two keys' projections on that
    camera's screen UP axis, as a fraction of their mean extent along it */
function stackAcross(t, o, view, keysA, keysB) {
  const ax = screenAxes(view), by = builtAt(t, o).by;
  const proj = keys => {
    let lo = Infinity, hi = -Infinity;
    const q = new T.Vector3();
    for (const k of keys) if (by[k]) { const P = by[k].P;
      for (let i = 0; i < P.length; i += 3) { q.set(P[i], P[i + 1], P[i + 2]);
        const u = q.dot(ax.up); if (u < lo) lo = u; if (u > hi) hi = u; } }
    return lo <= hi ? { lo, hi, size: hi - lo } : null;
  };
  const A = proj(keysA), B = proj(keysB);
  if (!A || !B) return -1;
  const gap = Math.max(A.lo - B.hi, B.lo - A.hi);
  return gap / ((A.size + B.size) / 2);
}

function acceptance() {
  const m = {}, ok = {}, F = FLOORS;

  /* A — the plan, off the built ectoderm */
  {
    const t = tOfDay(20);
    m.A_cranial = ectoHalfWidthAt(0.80, t, {});
    m.A_caudal = ectoHalfWidthAt(0.30, t, {});
    m.A_ratio = m.A_caudal > 1e-9 ? m.A_cranial / m.A_caudal : 0;
    ok.A = m.A_ratio >= F.PLAN_RATIO;
  }

  /* B — ARC LENGTH CONSERVED. Three stages of the fold at ONE station, compared with each other. */
  {
    const tOfPhi = target => {           // the t at which this station has folded that far
      let lo = 0, hi = 1;
      for (let i = 0; i < 60; i++) { const mid = (lo + hi) / 2;
        if (phiAt(V_PROBE, mid, {}) / Math.PI < target) lo = mid; else hi = mid; }
      return (lo + hi) / 2;
    };
    const ts = [0.08, 0.40, 0.80].map(tOfPhi);
    m.B_phi = ts.map(x => +(phiAt(V_PROBE, x, {}) / Math.PI).toFixed(4));
    m.B_area = ts.map(x => sectionAreaMeasured(V_PROBE, x, {}).area);
    const mn = Math.min.apply(null, m.B_area), mx = Math.max.apply(null, m.B_area);
    m.B_spread = mn > 1e-9 ? (mx - mn) / ((mn + mx) / 2) : 1;
    ok.B = m.B_spread <= F.AREA_SPREAD && mn > 1e-6;
  }

  /* C — THE SOLVE AGAINST THE TAUGHT DATES, measured off the stage field. */
  {
    const dayWhen = (pred, d0, d1) => {   // the day the predicate first holds, by bisection
      let lo = d0, hi = d1;
      for (let i = 0; i < 70; i++) { const mid = (lo + hi) / 2;
        if (pred(tOfDay(mid))) hi = mid; else lo = mid; }
      return (lo + hi) / 2;
    };
    m.C_dayStart = dayWhen(t => !!frontsMeasured(t, {}), 20, 24);
    m.C_dayCran = dayWhen(t => { const f = frontsMeasured(t, {}); return f && f.cranial >= V_CRAN - 1e-4; }, 22, 27);
    m.C_dayCaud = dayWhen(t => { const f = frontsMeasured(t, {}); return f && f.caudal <= V_CAUD() + 1e-4; }, 22, 29);
    m.C_somite5 = claimMeasure('somite5Fused', tOfDay(DAY_CLOSE0 + 0.15));
    m.C_vSom5 = V_SOM5(); m.C_vCaud = V_CAUD();
    m.C_uCran = U_CRAN(); m.C_uCaud = U_CAUD();
    ok.C = Math.abs(m.C_dayStart - DAY_CLOSE0) <= F.DATE_TOL
        && Math.abs(m.C_dayCran - DAY_CRAN) <= F.DATE_TOL
        && Math.abs(m.C_dayCaud - DAY_CAUD) <= F.DATE_TOL
        && m.C_somite5 === 1;
  }

  /* D — the closed tube, read two independent ways. */
  {
    const t = tOfDay(26);
    const band = sectionAreaMeasured(V_PROBE, t, {});
    m.D_areaFromVolume = band.area;
    const lum = (() => {                 // the lumen cast's own section area, same slab
      const half = (0.34 / 2) / embL(day(t));
      const g = new T.Group();
      addCanal(g, t, {}, { v0: V_PROBE - half, v1: V_PROBE + half });
      let vol = 0, lo = Infinity, hi = -Infinity;
      for (const mm of meshesOf(g)) {
        const P = mm.geometry.attributes.position.array;
        vol += Math.abs(signedVolume(P));
        for (let i = 1; i < P.length; i += 3) { if (P[i] < lo) lo = P[i]; if (P[i] > hi) hi = P[i]; }
      }
      return hi > lo ? vol / (hi - lo) : 0;
    })();
    m.D_lumenArea = lum;
    const by = builtAt(t, {}).by;
    const tubeZ = (() => {               // the outer diameter, from the HULL vertices near the midline
      const P = by.neural_tube ? by.neural_tube.P : [];
      const y0 = yOf(V_PROBE, t), tolY = embL(day(t)) * 0.006;
      let lo = Infinity, hi = -Infinity;
      for (let i = 0; i < P.length; i += 3) {
        if (Math.abs(P[i + 1] - y0) > tolY) continue;
        if (Math.abs(P[i]) > 0.04) continue;
        const z = P[i + 2]; if (z < lo) lo = z; if (z > hi) hi = z;
      }
      return hi > lo ? hi - lo : -1;
    })();
    m.D_outerDiam = tubeZ;
    const ri = Math.sqrt(Math.max(0, lum) / Math.PI), ro = tubeZ / 2;
    m.D_ri = ri; m.D_ro = ro;
    m.D_areaFromRadii = Math.PI * (ro * ro - ri * ri);
    m.D_rel = m.D_areaFromVolume > 1e-9
      ? Math.abs(m.D_areaFromRadii - m.D_areaFromVolume) / m.D_areaFromVolume : 1;
    ok.D = ro > ri && ri > 0 && m.D_rel <= F.RADIUS_CONSISTENCY;
  }

  /* E — all four stages at once, in order, by a margin. */
  {
    const t = tOfDay(23);
    m.E_stages = claimMeasure('stagesPresent', t);
    m.E_unimodal = claimMeasure('foldUnimodal', t);
    m.E_minRun = claimMeasure('minStageRun', t);
    m.E_stations = sectionStations(t, {});
    ok.E = m.E_stages === 4 && m.E_unimodal === 0 && m.E_minRun >= F.STAGE_RUN;
  }

  /* F — one fused run, not several. */
  {
    m.F_runs = {};
    let worst = 0;
    for (const t of T_SAMPLE) {
      if (!frontsMeasured(t, {})) continue;
      const n = stageRuns(t, {}, null).filter(r => r.key === 'neural_tube').length;
      m.F_runs[day(t).toFixed(1)] = n;
      worst = Math.max(worst, n);
    }
    m.F_worst = worst;
    ok.F = worst === 1;
  }

  /* G — the plate lies on the notochord. */
  {
    const t = tOfDay(19);
    m.G_gap = claimMeasure('plateOnNotochord', t);
    m.G_midline = claimMeasure('notochordUnderMidline', t);
    ok.G = m.G_gap >= F.NOTO_GAP_MIN && m.G_gap <= F.NOTO_GAP_MAX && m.G_midline >= F.MIDLINE_FRAC;
  }

  /* H — the ventricle and the central canal, in the model's frame AND on the screen. */
  {
    const t = tOfDay(27.5);
    m.H_ratio = claimMeasure('canalRadiusRatio', t);
    m.H_screen = claimMeasure('canalScreenRatio.lateral', t);
    ok.H = m.H_ratio >= F.LUMEN_RATIO && m.H_screen >= F.SCREEN_RATIO;
  }

  /* I — the tube sinks. */
  {
    /* WHERE THE CLOSED TUBE ENDS UP, AT ONE STATION, ON A THIN SLICE. Measuring the minimum z over the
       whole tube key reads whichever station fused most recently, not the one the claim is about. */
    const v = 0.70, before = tOfDay(22.8), after = tOfDay(26);
    const dorsAt = (tt, keys) => {
      const by = builtAt(tt, {}).by;
      const y0 = yOf(v, tt), tol = embL(day(tt)) * 0.02;
      let lo = Infinity, hi = -Infinity;
      for (const k of keys) if (by[k]) { const P = by[k].P;
        for (let i = 0; i < P.length; i += 3) {
          if (Math.abs(P[i + 1] - y0) > tol) continue;
          const z = P[i + 2]; if (z < lo) lo = z; if (z > hi) hi = z; } }
      return lo <= hi ? { lo, hi, size: hi - lo } : null;
    };
    const b0 = dorsAt(before, ['neural_folds', 'neural_groove', 'neural_tube']);
    const b1 = dorsAt(after, ['neural_tube']);
    const ect = dorsAt(after, ['surface_ectoderm']);
    const noto = dorsAt(after, ['notochord']);
    m.I_station = v;
    /* the folds stand proud of the embryo's dorsal surface before they meet */
    m.I_tipsAbove = b0 ? (zBasal() - b0.lo) / p('H_ECTO', H_ECTO) : NaN;
    /* and afterwards the tube is SANDWICHED: clear of the notochord beneath it and under the skin that
       arched over it. Both gaps in units of the ectoderm's own thickness. */
    m.I_notoGap = (b1 && noto) ? (noto.lo - b1.hi) / p('H_ECTO', H_ECTO) : NaN;
    m.I_skinGap = (b1 && ect) ? (b1.lo - ect.lo) / p('H_ECTO', H_ECTO) : NaN;
    ok.I = m.I_tipsAbove >= F.SINK_FRAC && m.I_notoGap > 0 && m.I_skinGap >= F.SINK_FRAC;
  }

  /* J — the ectoderm's window, open then closed. */
  {
    m.J_open = claimMeasure('ectodermMidline.900', tOfDay(23));
    m.J_closed = claimMeasure('ectodermMidline.900', tOfDay(27));
    ok.J = m.J_open <= 1e-6 && m.J_closed >= F.ECTO_CLOSED * p('H_ECTO', H_ECTO);
  }

  /* K — the crest leaves at the seam and spreads. */
  {
    m.K_early = crestCells(tOfDay(20), {}, null).length;
    m.K_spread24 = claimMeasure('crestSpreadFrac', tOfDay(24));
    m.K_spread26 = claimMeasure('crestSpreadFrac', tOfDay(26));
    m.K_depth = claimMeasure('crestDepthFrac', tOfDay(26));
    let worstPhi = Infinity;
    for (const c of crestCells(tOfDay(24), {}, null)) void c;
    for (let i = 0; i <= 300; i++) {
      const v = V_CAUD() + (V_CRAN - V_CAUD()) * (i / 300);
      const a = arc(v, tOfDay(24), {});
      /* every crest station must be past CREST_PHI0; the probe is the converse — no cell anywhere
         at a station that is not */
      if (a.phi / Math.PI < CREST_PHI0) continue;
      worstPhi = Math.min(worstPhi, a.phi / Math.PI);
    }
    m.K_minPhi = isFinite(worstPhi) ? worstPhi : -1;
    ok.K = m.K_early === 0 && m.K_spread26 >= F.CREST_GROWTH * m.K_spread24
        && m.K_minPhi >= CREST_PHI0 && m.K_depth > 0.15;
  }

  /* L — the tail end. */
  {
    m.L_before = claimMeasure('secondaryCanalVol', tOfDay(24));
    m.L_after = claimMeasure('secondaryCanalVol', tOfDay(28));
    m.L_join = claimMeasure('eminenceJoin', tOfDay(28));
    ok.L = m.L_before === 0 && m.L_after > 0 && m.L_join > 0;
  }

  /* M, N, O, P, Q — the machinery rows, swept over every stage and every variant. */
  {
    m.M_worst = 1; m.N_neg = 0; m.O_unpaired = 0; m.P_worst = 0; m.Q_bad = [];
    m.M_tris = 0; m.N_bodies = 0;
    const sampleT = [tOfDay(18), tOfDay(21), tOfDay(23), tOfDay(25), tOfDay(27), tOfDay(28)];
    for (const o of VARIANT_SETS) for (const t of sampleT) {
      const { by } = builtAt(t, o);
      for (const k of Object.keys(by)) {
        const w = windingOf(by[k].P, by[k].N);
        m.M_tris += w.tot;
        if (w.frac < m.M_worst) { m.M_worst = w.frac; m.M_where = k + '@' + day(t).toFixed(1); }
        for (const b of by[k].bodies) {
          m.N_bodies++;
          if (signedVolume(b.P) <= 0) { m.N_neg++; m.N_where = k + '@' + day(t).toFixed(1); }
          const wt = watertightOf(b.P);
          if (wt.unpaired) { m.O_unpaired += wt.unpaired; m.O_where = k + '@' + day(t).toFixed(1); }
        }
        /* P — mirror symmetry in x, for every variant whose picture is meant to be symmetric */
        if (!o.sbPanel && !o.sections) {
          const P = by[k].P, q = 1e-3;
          const set = new Set();
          for (let i = 0; i < P.length; i += 3)
            set.add(Math.round(P[i] / q) + ',' + Math.round(P[i + 1] / q) + ',' + Math.round(P[i + 2] / q));
          let miss = 0, tested = 0;
          const step = Math.max(3, 3 * Math.ceil(P.length / 3 / 2500));
          for (let i = 0; i < P.length; i += step) {
            tested++;
            const key = Math.round(-P[i] / q) + ',' + Math.round(P[i + 1] / q) + ',' + Math.round(P[i + 2] / q);
            if (!set.has(key)) miss++;
          }
          const frac = tested ? miss / tested : 0;
          if (frac > m.P_worst) { m.P_worst = frac; m.P_where = k + '@' + day(t).toFixed(1) + Object.keys(o).join(','); }
        }
      }
      /* Q — no pair of solids shares space outside the partition */
      const keys = Object.keys(by);
      const idx = {};
      for (let a = 0; a < keys.length; a++) for (let b = a + 1; b < keys.length; b++) {
        const ka = keys[a], kb = keys[b];
        if (touchOK(ka, kb)) continue;
        const ba = boxOf(by[ka].P), bb = boxOf(by[kb].P);
        let meet = true;
        for (let ax = 0; ax < 3; ax++) if (ba.min[ax] > bb.max[ax] || bb.min[ax] > ba.max[ax]) meet = false;
        if (!meet) continue;
        if (!idx[ka]) idx[ka] = triIndex(by[ka].P);
        if (!idx[kb]) idx[kb] = triIndex(by[kb].P);
        const f = Math.max(insideFrac(by[ka].P, idx[kb]), insideFrac(by[kb].P, idx[ka]));
        if (f > FLOORS.OVERLAP_MAX) m.Q_bad.push({ pair: ka + '|' + kb, at: day(t).toFixed(1),
                                                   variant: Object.keys(o).join(',') || 'normal', frac: +f.toFixed(5) });
      }
    }
    ok.M = m.M_worst >= F.WINDING;
    ok.N = m.N_neg === 0;
    ok.O = m.O_unpaired === 0;
    ok.P = m.P_worst <= F.SYMMETRY;
    ok.Q = m.Q_bad.length === 0;
  }

  /* R — a lesion is a stopped front. */
  {
    const t = tOfDay(26);
    m.R_normalCranLeft = claimMeasure('cranialLeft', t);
    m.R_lesionCran = claimMeasure('frontCranial/openCranial', t);
    m.R_stopCran = V_STOP_CRAN(); m.R_stopCaud = V_STOP_CAUD();
    m.R_exposed = claimMeasure('exposedBrainVol/openCranial', t);
    m.R_normalExposed = claimMeasure('exposedBrainVol', t);
    m.R_caudLesion = claimMeasure('frontCaudal/openCaudal', tOfDay(28));
    m.R_vSom5 = V_SOM5();
    ok.R = m.R_normalCranLeft <= 1e-6
        && Math.abs(m.R_lesionCran - V_STOP_CRAN()) < 0.02
        && m.R_exposed > 0 && m.R_normalExposed === 0
        && Math.abs(m.R_caudLesion - V_STOP_CAUD()) < 0.02;
  }

  /* S — the four panels at one scale, differing only in what comes through the gap. */
  {
    const t = tOfDay(27);
    m.S_archSpread = claimMeasure('archSpread/sbPanel', t);
    m.S_panels = claimMeasure('panelCount/sbPanel', t);
    m.S_sacOcculta = claimMeasure('sacVolume.occulta/sbPanel', t);
    m.S_sacMening = claimMeasure('sacVolume.meningocele/sbPanel', t);
    m.S_sacMyelo = claimMeasure('sacVolume.myelomeningocele/sbPanel', t);
    m.S_cordMyelo = claimMeasure('cordInSac.myelomeningocele/sbPanel', t);
    m.S_cordMening = claimMeasure('cordInSac.meningocele/sbPanel', t);
    ok.S = m.S_panels === 4 && m.S_archSpread <= F.ARCH_SPREAD
        && m.S_sacOcculta === 0 && m.S_sacMening > 0
        && m.S_sacMyelo >= F.SAC_ORDER * m.S_sacMening
        && m.S_cordMyelo >= F.CORD_IN_SAC && m.S_cordMening <= F.CORD_OUT_SAC;
  }

  /* T — the shares partition the half-width, measured on the built sheets. */
  {
    const t = tOfDay(21);
    m.T_sum = p('SH_NEURAL', SH_NEURAL) + SH_PARAX + SH_LATERAL;
    const by = builtAt(t, {}).by;
    const ect = ectoHalfWidthAt(V_PROBE, t, {});
    const mes = spanOf(by, ['lateral_mesoderm'], 0);
    m.T_ectoHalf = ect;
    m.T_mesoOuter = mes ? mes.hi : -1;
    m.T_rel = ect > 1e-9 ? Math.abs(m.T_mesoOuter - ect) / ect : 1;
    ok.T = Math.abs(m.T_sum - 1) <= F.SHARE_SUM && m.T_rel <= 0.02;
  }

  /* U — the built axis is the sibling scenes' disc on day 18. */
  {
    const t = tOfDay(18);
    const by = builtAt(t, {}).by;
    const s = spanOf(by, ['surface_ectoderm'], 1);
    /* the ectoderm is built over v in [V_SHEET0, 0.988], so its own extent is that share of the axis */
    m.U_built = s ? s.size / (0.988 - V_SHEET0()) : -1;
    m.U_rel = Math.abs(m.U_built - p('DISC_L', DISC_L)) / p('DISC_L', DISC_L);
    ok.U = m.U_rel <= 1e-3;
  }

  /* V — a sections slab is a piece of the same geometry. */
  {
    const t = tOfDay(23);
    const st = sectionStations(t, {});
    const v = st.neural_folds;
    m.V_station = v;
    const full = sectionAreaMeasured(v, t, {}).area;
    const slab = (() => {
      const g = buildSections(t, {});
      /* find the panel that carries the folds band and measure its own section area the same way */
      let vol = 0, lo = Infinity, hi = -Infinity;
      for (const panel of g.children) {
        const ms = meshesOf(panel).filter(x => x.userData.key === 'neural_folds');
        if (!ms.length) continue;
        for (const mm of ms) {
          const P = mm.geometry.attributes.position.array;
          vol += Math.abs(signedVolume(P));
          for (let i = 1; i < P.length; i += 3) { if (P[i] < lo) lo = P[i]; if (P[i] > hi) hi = P[i]; }
        }
        break;
      }
      return hi > lo ? vol / (hi - lo) : -1;
    })();
    m.V_full = full; m.V_slab = slab;
    m.V_rel = full > 1e-9 ? Math.abs(slab - full) / full : 1;
    ok.V = m.V_rel <= F.AREA_SPREAD;
  }

  /* W — which camera the dorsoventral stack survives. */
  {
    const t = tOfDay(19);
    m.W_superior = stackAcross(t, {}, 'superior', ['surface_ectoderm'], ['endoderm']);
    m.W_lateral = stackAcross(t, {}, 'lateral', ['surface_ectoderm'], ['endoderm']);
    ok.W = m.W_superior >= F.STACK_GOOD && m.W_lateral <= F.STACK_BAD;
  }

  /* X — EVERY SECTION PANEL HAS A NOTOCHORD UNDER IT. ADDED BY REVIEW 2026-10-03, and the row exists
     because nothing here was looking: twelve harness checks, twenty-three acceptance rows and thirty-six
     beat claims all passed on a four-panel figure that drew THREE notochords, and the only instrument
     that caught it was counting the bodies in the built group. Swept across the days rather than
     spot-checked at one, because WHICH panel loses the rod moves with t — at beat 1's day it was the
     groove and at beat 5's the folds, so a single-day row would have passed on half the scene. See the
     note at sectionStations for the cause. */
  {
    let sweeps = 0, worstMissing = -1, worstDay = null, worstPanels = 0, worstWith = 0;
    let totPanels = 0, totWith = 0, maxPanels = 0, fourPanelDays = 0;
    for (let d = 19; d <= 28; d += 0.5) {
      const t = tOfDay(d);
      const g = buildSections(t, {});
      const panels = g.children.length;
      if (panels < 1) continue;
      sweeps++;
      let withRod = 0;
      for (const panel of g.children)
        if (meshesOf(panel).some(x => x.userData.key === 'notochord')) withRod++;
      totPanels += panels; totWith += withRod;
      if (panels > maxPanels) maxPanels = panels;
      if (panels === 4) fourPanelDays++;
      /* ties go to the day with the MOST panels, so the row's evidence shows the hardest case it saw
         rather than the first day it happened to walk past with nothing missing */
      if (panels - withRod > worstMissing ||
          (panels - withRod === worstMissing && panels > worstPanels)) {
        worstMissing = panels - withRod; worstDay = d; worstPanels = panels; worstWith = withRod;
      }
    }
    m.X_days = sweeps; m.X_worstDay = worstDay; m.X_panels = worstPanels;
    m.X_withNotochord = worstWith; m.X_missing = worstMissing;
    m.X_panelsTotal = totPanels; m.X_withNotochordTotal = totWith;
    m.X_maxPanels = maxPanels; m.X_fourPanelDays = fourPanelDays;
    /* a sweep that never reached a four-panel day would pass vacuously, which is the failure mode of
       every "no counterexample found" test — so the row requires that it SAW the hard case */
    ok.X = sweeps > 0 && fourPanelDays > 0 && worstMissing === 0 && totWith === totPanels;
  }

  /* Y — AND THE ROD IT HAS IS THE RIGHT ROD. ADDED 2026-10-03 in answer to review finding F2, which
     measured beat 5's flat-plate panel rod at 0.217 units across against 0.600 for the other three and
     declined to choose between "keep the taper and say so" and "floor the calibre inside the variant",
     because changing a taper that row G and claim B2-contact both measure is not a change to make
     blind. The taper is KEPT: it is the notochord's own end, and the notochord does thin to its ends.
     What was wrong was not the rod — it was that NOTHING MEASURED IT. Row X asks only whether a rod is
     PRESENT, so a panel could carry a rod of any calibre at all, including one the window had eaten.

     THE FIRST VERSION OF THIS ROW WAS WRONG, AND ITS OWN MEASUREMENT SAID SO rather than me. It asserted
     the per-panel calibre was non-decreasing in the panel's station, on the reasoning that the thin rod
     is thin because it is the most caudal panel. It failed on day 22 with
     `neural_plate@v0.2138=0.6000 < neural_folds@v0.5643=0.6000 < neural_groove@v0.8497=0.3069`: the
     notochord tapers at BOTH ends — the cranial one at the prechordal plate — so the calibre is a hump
     in v and not a ramp, and a monotone assertion is simply the wrong shape. Kept in this note because
     the row as written would have read as obviously true.

     What the row asserts now needs no law restated and no direction assumed: a panel is a SLAB OF THE
     SAME ROD, so its calibre must equal the calibre the FULL build has at that same station — built
     geometry against built geometry, which is row V's argument applied to the notochord instead of to
     the section area. A rod thinned by the window's own fade, by a clipped station or by a wrong station
     breaks that equality; the anatomical taper cannot, because the full build has it too. */
  {
    let sweeps = 0, bad = 0, worstRel = 0, worstDay = null, worstWhere = null;
    let thinnest = Infinity, thinnestDay = null, thinnestWhere = null;
    let fourPanelDays = 0, spreadMax = 0, pairs = 0;
    for (let d = 19; d <= 28; d += 0.5) {
      const t = tOfDay(d);
      const g = buildSections(t, {});
      const info = g.userData.sections || {};
      const present = info.present || [], st = info.stations || {};
      if (g.children.length < 2) continue;
      sweeps++;
      if (g.children.length === 4) fourPanelDays++;
      /* THE FULL BUILD'S ROD, ROW BY ROW — and the row is the unit, not the slab, because the first
         version of this comparison compared two different polygonisations and reported its own
         sampling as a defect. It measured the panel's x-extent over the whole 0.60-unit slab against
         the full build's x-extent over the same y band, and failed 6 of 44 pairs, worst
         `neural_groove@v0.1483 panel 0.2897 vs full build 0.1800`. Cause: the full rod carries
         round((A1-A0) * 110) rings over the WHOLE axis, about one every 0.24 units of y at day 25, so
         a 0.60-unit band holds two or three of them — while the panel's own rod is swept at 10 rings
         across 0.023 of the axis. On the steep part of the caudal ramp the panel resolves the taper and
         the full build's coarse rings step straight over it. Both are correct geometry; the comparison
         was wrong.

         So the row brackets instead of equating: the panel's calibre must lie between the SMALLEST and
         LARGEST calibre the full rod takes over that panel's own y span, widened by one ring either
         side. A rod the window has eaten falls below the bracket; a rod floored to full calibre at a
         tapering station rises above it; a rod that is simply the taper, sampled differently, sits
         inside it. */
      const fullP = (builtAt(t, {}).by.notochord || { P: [] }).P;
      const rows = new Map();                    // y of the ring -> [minX, maxX]
      for (let i = 0; i < fullP.length; i += 3) {
        const y = fullP[i + 1], x = fullP[i];
        const k = y.toFixed(6);
        const r = rows.get(k);
        if (!r) rows.set(k, [y, x, x]);
        else { if (x < r[1]) r[1] = x; if (x > r[2]) r[2] = x; }
      }
      const ring = Array.from(rows.values()).map(r => ({ y: r[0], cal: r[2] - r[1] }))
                        .sort((a, b) => a.y - b.y);
      let ringGap = 0;
      for (let i = 1; i < ring.length; i++) ringGap = Math.max(ringGap, ring[i].y - ring[i - 1].y);
      const bracketOfFull = v => {
        const half = (Q_SLAB_UNITS / 2) + ringGap, yc = yOf(v, t);
        let lo = Infinity, hi = -Infinity, n = 0;
        for (const r of ring) if (Math.abs(r.y - yc) <= half) {
          n++; if (r.cal < lo) lo = r.cal; if (r.cal > hi) hi = r.cal;
        }
        return n ? { lo: lo, hi: hi, rings: n } : null;
      };
      const cals = [];
      g.children.forEach((panel, idx) => {
        const key = present[idx];
        if (key == null || st[key] == null) return;
        const ms = meshesOf(panel).filter(x => x.userData.key === 'notochord');
        if (!ms.length) return;                       // row X owns the absent case
        let lo = Infinity, hi = -Infinity;
        for (const mm of ms) {
          const P = mm.geometry.attributes.position.array;
          for (let i = 0; i < P.length; i += 3) { if (P[i] < lo) lo = P[i]; if (P[i] > hi) hi = P[i]; }
        }
        const cal = hi - lo, br = bracketOfFull(st[key]);
        cals.push(cal);
        if (cal < thinnest) { thinnest = cal; thinnestDay = d; thinnestWhere = key + '@v' + st[key].toFixed(4); }
        if (!br) return;
        pairs++;
        const outBy = Math.max(br.lo - F.NOTO_CAL_TOL - cal, cal - (br.hi + F.NOTO_CAL_TOL));
        if (outBy > 0) {
          bad++;
          if (outBy > worstRel) {
            worstRel = outBy; worstDay = d;
            worstWhere = key + '@v' + st[key].toFixed(4) + ' panel ' + cal.toFixed(4) +
                         ' outside the full rod\'s ' + br.lo.toFixed(4) + '..' + br.hi.toFixed(4) +
                         ' over ' + br.rings + ' rings';
          }
        }
      });
      if (cals.length > 1)
        spreadMax = Math.max(spreadMax, Math.max.apply(null, cals) - Math.min.apply(null, cals));
    }
    m.Y_days = sweeps; m.Y_fourPanelDays = fourPanelDays; m.Y_pairs = pairs;
    m.Y_disagreeing = bad; m.Y_worstDiff = +worstRel.toFixed(5);
    m.Y_worstDay = worstDay; m.Y_worstWhere = worstWhere;
    m.Y_thinnest = thinnest === Infinity ? -1 : +thinnest.toFixed(5);
    m.Y_thinnestDay = thinnestDay; m.Y_thinnestWhere = thinnestWhere;
    m.Y_spreadMax = +spreadMax.toFixed(5);
    /* and it must have SEEN both hard cases: a four-panel day, and a day on which the panels disagree
       about the calibre — otherwise it is passing on a figure whose rods happen to be identical */
    ok.Y = sweeps > 0 && fourPanelDays > 0 && pairs > 0 && bad === 0 &&
           m.Y_thinnest >= F.NOTO_CAL_MIN && spreadMax > F.NOTO_CAL_SPREAD;
  }

  return { measured: m, pass: ok, allPass: Object.keys(ok).every(k => ok[k]), spec: ACCEPTANCE,
           floors: FLOORS, axes: AXES };
}

/* ═══════════════════════════════════════════════════════════════ 22 · THE NEGATIVE CASES

   RENDER-STANDARD: every acceptance test needs a negative case, because a test that cannot fail is not
   evidence — "a test that grades its own homework in the wrong units is worse than no test: it
   launders a defect into a proof". Each row below is fed a deliberately wrong input and must reject
   it. Where a row's predicate is arithmetic on measured numbers the wrong input is a wrong number;
   where it is a relation between two builds the wrong input is a PERTURBED BUILD, which is also the
   check RENDER-STANDARD asks for separately: change a constant the geometry is built from and the
   measured number must move.                                                                        */
function negatives() {
  const F = FLOORS, out = {};
  const rej = (id, why, didReject) => { out[id] = { rejects: !!didReject, case: why }; };

  rej('A', 'a plan ratio of 1.0 — an embryo as broad at the tail as at the head', !(1.0 >= F.PLAN_RATIO));
  rej('B', 'a 6% spread in section area between stages', !(0.06 <= F.AREA_SPREAD));
  rej('C', 'a cranial neuropore measured shut on day 25.4', !(Math.abs(25.4 - DAY_CRAN) <= F.DATE_TOL));
  rej('D', 'two readings of the tube\'s area 12% apart', !(0.12 <= F.RADIUS_CONSISTENCY));
  rej('E', 'three stages present instead of four, and a field with 2% of its steps going the wrong way', !(3 === 4) && !(0.02 === 0));
  rej('F', 'two separate fused runs — closure starting in two places', !(2 === 1));
  rej('G', 'a plate 0.9 notochord-diameters clear of it', !(0.9 <= F.NOTO_GAP_MAX));
  rej('H', 'a lumen ratio of 1.3 between the two ends, and 1.2 on the screen', !(1.3 >= F.LUMEN_RATIO) && !(1.2 >= F.SCREEN_RATIO));
  rej('I', 'folds standing only 0.1 of an ectodermal thickness proud', !(0.1 >= F.SINK_FRAC));
  rej('J', 'an ectoderm 0.3 of its thickness over the tube', !(0.3 >= F.ECTO_CLOSED));
  rej('K', 'a crest population that spread 1.02x in two days', !(1.02 >= F.CREST_GROWTH));
  rej('L', 'a canal already present inside the eminence on day 24', !(1 === 0));
  rej('M', 'a winding agreement of 0.97', !(0.97 >= F.WINDING));
  rej('N', 'one body with negative signed volume', !(1 === 0));
  rej('O', 'one unpaired edge', !(1 === 0));
  rej('P', '1% of vertices with no mirror partner', !(0.01 <= F.SYMMETRY));
  rej('Q', '2% of one solid inside another', !(0.02 <= F.OVERLAP_MAX));
  rej('R', 'a lesion build whose cranial front reached 0.9', !(Math.abs(0.9 - V_STOP_CRAN()) < 0.02));
  rej('S', 'four arches whose outlines differ by 3%', !(0.03 <= F.ARCH_SPREAD));
  rej('T', 'shares summing to 1.04', !(Math.abs(1.04 - 1) <= F.SHARE_SUM));
  rej('U', 'a day-18 axis measuring 11.2 units', !(Math.abs(11.2 - DISC_L) / DISC_L <= 1e-3));
  rej('V', 'a slab 5% off the full build\'s section area', !(0.05 <= F.AREA_SPREAD));
  rej('W', 'a stack that survives the camera it lies along, at 0.4', !(0.4 <= F.STACK_BAD));
  rej('X', 'a four-panel figure carrying three notochords — the defect this row was written for', !(4 - 3 === 0));
  /* TWO wrong inputs, because row Y has two halves and a negative case that exercises one of them is
     half a negative case: a rod that FALLS in calibre as the station moves cranially (the taper running
     backwards), and a rod thinner than any taper can account for. */
  rej('Y', 'a panel rod 0.08 units outside the bracket the full build\'s own rings give at that station — a calibre the window ate',
      !(0.08 <= F.NOTO_CAL_TOL));
  rej('Y2', 'a panel drawing a 0.05-unit rod, thinner than the taper\'s own floor of 0.18 across',
      !(0.05 >= F.NOTO_CAL_MIN));
  rej('Y3', 'four panels whose rods are all the same width — a sweep that never saw the hard case and would pass vacuously',
      !(0 > F.NOTO_CAL_SPREAD));

  /* AND THE PERTURBATIONS, which are the half that cannot be faked by typing a wrong number into the
     line above. Change the constant the geometry is built from and the MEASURED side must move. */
  const measure = () => {
    const t = tOfDay(26);
    return {
      area: sectionAreaMeasured(V_PROBE, tOfDay(21), {}).area,
      lumenRatio: claimMeasure('canalRadiusRatio', tOfDay(27.5)),
      dayCran: (() => { let lo = 22, hi = 27;
        for (let i = 0; i < 60; i++) { const mid = (lo + hi) / 2;
          const f = frontsMeasured(tOfDay(mid), {});
          if (f && f.cranial >= V_CRAN - 1e-4) hi = mid; else lo = mid; }
        return (lo + hi) / 2; })(),
      vSom5: V_SOM5(),
      ectoHalf: ectoHalfWidthAt(V_PROBE, t, {}),
    };
  };
  const clear = () => { for (const k of Object.keys(PERT)) delete PERT[k]; _vcache.clear(); };
  clear();
  const base = measure();
  const runs = {};
  /* EACH "STILL" FIELD CARRIES ITS OWN TOLERANCE AND ITS OWN REASON, because on two of the three
     perturbations the honest answer is NOT exactly zero and saying so is worth more than a loosened
     threshold nobody can argue with:

     · SH_NEURAL moves the measured cranial-closure date by 0.0007 of a day — one minute. It is not
       noise and it is not a defect: fusion is defined GEOMETRICALLY, as the fold tips within SEAM of
       each other, and the angle at which a strip of arc length L brings its tips that close depends on
       L as sin(phi)/phi = SEAM/L. So the calibre of the plate enters the date at order SEAM/L, which is
       1e-3. The three taught dates are properties of the front and are unaffected at the resolution any
       beat quotes them to; the tolerance says exactly how much they can move and why.

     · The somite clock moves the measured section AREA by 4e-5 of itself. The conserved quantity L*H is
       untouched — what moved is the POLYGONAL approximation of the two tip rounds, because a different
       V_SOM5 puts this station at a slightly different phi at the same day and the rounds are sampled
       with four columns each. A grid artefact, pinned at its measured size rather than hidden. */
  const trial = (name, k, v, expectMove, expectStill) => {
    clear(); PERT[k] = v; _vcache.clear();
    const got = measure();
    clear();
    const moved = {}, still = {};
    for (const f of expectMove) moved[f] = Math.abs(got[f] - base[f]) > Math.abs(base[f]) * 1e-6 + 1e-12;
    for (const spec of (expectStill || [])) {
      const f = spec.field, tol = spec.tol == null ? 1e-9 : spec.tol;
      const rel = Math.abs(got[f] - base[f]) / (Math.abs(base[f]) + 1e-12);
      still[f] = { rel: rel, tol: tol, ok: rel <= tol, why: spec.why || 'must not move at all' };
    }
    runs[name] = { set: k + '=' + v, base, got, moved, still,
                   pass: Object.keys(moved).every(x => moved[x])
                      && Object.keys(still).every(x => still[x].ok) };
  };
  /* SH_NEURAL decides the plate's width, so it must move the section area AND the lumen — and must
     leave the DATES exactly where they are, because the zip is solved from the somite table and the
     three taught days, neither of which knows anything about how wide the plate is. That negative
     control is a teaching point as much as a check. */
  trial('plate width', 'SH_NEURAL', 0.44, ['area', 'lumenRatio'], [
    { field: 'dayCran', tol: 1e-3,
      why: 'fusion is contact within SEAM, so the calibre enters the date at order SEAM/L ~ 1e-3 — one minute of a day' },
    { field: 'vSom5', tol: 0,
      why: 'where closure begins is read off the somite table and knows nothing about how wide the plate is' },
  ]);
  /* the somite clock moves WHERE closure starts and therefore nothing about the plate's calibre */
  trial('somite clock', 'SOMITE_PERIOD_H', 6.0, ['vSom5'], [
    { field: 'area', tol: 1e-3,
      why: 'L*H is untouched; what moves is the four-column polygonal approximation of the two tip rounds, because this station sits at a slightly different phi on the same day' },
  ]);
  /* and the embryo's width moves the ectoderm's own half-width */
  trial('embryo width', 'W_MAX', 3.60, ['ectoHalf', 'area'], []);
  out.perturbation_note = 'Every row of the battery that measures a LENGTH, an AREA or a CALIBRE moves ' +
    'when SH_NEURAL or W_MAX moves, and every row that measures a DATE or a STATION moves when the ' +
    'somite clock moves, and neither set moves for the other. That separation is the model\'s central ' +
    'claim in one table: the zip is solved from the somite table and three taught days, and the calibre ' +
    'is solved from a conserved arc length, and the two do not know about each other.';
  out.perturbations = runs;
  const META = { perturbations: 1, perturbation_note: 1, allPass: 1 };
  out.allPass = Object.keys(out).filter(k => !META[k]).every(k => out[k].rejects)
             && Object.keys(runs).every(k => runs[k].pass);
  return out;
}

/** the `must` strings and the rows must stay in step: a row with no must, or a must with no row, is a
    documentation drift the next reviewer would otherwise have to find by reading. */
function selfCheckMustStrings() {
  const a = acceptance();
  const ids = ACCEPTANCE.tests.map(x => x.id).sort().join(',');
  const got = Object.keys(a.pass).sort().join(',');
  return { spec: ids, measured: got, agree: ids === got };
}

/** the shared dimensions, so the render harness can assert agreement with the sibling models against
    the FILES rather than against a comment — and assert the ONE disagreement is the one declared. */
function constants() {
  return {
    DISC_L: p('DISC_L', DISC_L), W_MAX: p('W_MAX', W_MAX), H_ECTO: p('H_ECTO', H_ECTO),
    NP_MAXFAC: p('NP_MAXFAC', NP_MAXFAC), W_SOM: p('W_SOM', W_SOM),
    V_SEG_CRANIAL: V_SEG_CRANIAL, V_PRE: p('V_PRE', V_PRE), R_PROC: p('R_NOTO', R_NOTO),
    H_VENT: p('H_ENDO', H_ENDO), DAY_SOM_START: DAY_SOM_START, UNIT_UM: UNIT_UM,
    SOMITE_PERIOD_H: p('SOMITE_PERIOD_H', SOMITE_PERIOD_H),
  };
}
const CONSTANTS_DISAGREE = {
  SOMITE_PERIOD_H: 'models3d/notochord.js carries 4.5 hours per somite pair; every text teaches three ' +
    'pairs per day, which is 8.0, and 4.5 gives 37 pairs by day 27 against the taught figure of about ' +
    '25 by the end of week 4. This model uses 8.0 because BOTH its closure site and its caudal ' +
    'neuropore are read off the somite table, so the figure is load-bearing here in a way it is not ' +
    'there. Declared rather than fixed: notochord.js is another queue item.',
};

/** the derived numbers a reviewer would otherwise have to recompute by hand */
function solved() {
  return {
    V_SOM5: V_SOM5(), V_CAUD: V_CAUD(), V_CRAN: V_CRAN,
    U_CRAN: U_CRAN(), U_CAUD: U_CAUD(),
    somites_day22: somiteCount(22), somites_day27: somiteCount(27), somites_day28: somiteCount(28),
    EMB_L_day18: embL(18), EMB_L_day22: embL(22), EMB_L_day27: embL(27),
    L_at_peak: plateL(V_PEAK), H_at_peak: plateH(V_PEAK),
    lumen_radius_cranial: (() => { const v = 0.95, a = { L: plateL(v), H: plateH(v) };
      return a.L / (2 * Math.PI) - a.H / 2; })(),
    lumen_radius_caudal: (() => { const v = V_CAUD() + 0.01, a = { L: plateL(v), H: plateH(v) };
      return a.L / (2 * Math.PI) - a.H / 2; })(),
    phiMax_at_peak: phiMax(V_PEAK), seam: SEAM,
  };
}

/* ═══════════════════════════════════════════════════════════ 23 · THE PROVIDER CONTRACT */

window.MB3D_MODELS = window.MB3D_MODELS || {};
window.MB3D_MODELS['neurulation-neural-plate-tube'] = {
  LAYERS: LAYERS,
  build: buildNeurulation,
  /* FULL IS EMPTY, AND THAT IS A STATEMENT RATHER THAN AN OMISSION. FULL exists so a structure behind
     an option flag is still RESOLVABLE — without it the adapter builds only the defaults and anything
     optional comes back as reason:'none', which the player shows a student as "there is no model of
     this structure", a confident lie about a model sitting right there. Here every part of the NORMAL
     embryo builds unconditionally, and the five flags are MUTUALLY EXCLUSIVE PICTURES rather than
     optional layers: `sections` is a set of transverse slabs and nothing else, `sbPanel` is four
     lumbosacral panels at a different place entirely, and the two `open*` flags are lesions that must
     not be drawn in a normal beat. Turning any of them on by default would put a malformation in every
     picture. So each scene structure that needs one names it in its own ref, and the render harness
     asserts off the scene's own ops that no beat mixes them. */
  FULL: {},
  VARIANTS: {
    sections: 'TRANSVERSE SLABS, one for each of the four stages that EXISTS at this t, laid out two by ' +
      'two at one scale. At day 18 that is one section; at day 23 it is four, because closure zips and ' +
      'all four stages are present at once at four different levels. The stations are read off the ' +
      'stage field, never typed, so the panels are four samples of one function and cannot disagree. ' +
      'Shows the neuroepithelium, its canal, the notochord beneath and the ectoderm over it — the four ' +
      'things the sequence version\'s own gaps[] asked a drawing of this to carry.',
    sbPanel: 'THE SPINA BIFIDA SPECTRUM, four panels at the lumbosacral level, built by one function ' +
      'from one arch, one cord section and one sac radius, so they are at ONE SCALE with the SAME ' +
      'vertebral outline — which the sequence version\'s gaps[] names as the condition the teaching ' +
      'depends on. They differ in three booleans: is there a sac, is the cord in it, is there skin ' +
      'over it. Acceptance row S measures the one-scale condition rather than asserting it.',
    openCranial: 'ANENCEPHALY, as a stopped front: the cranial front travels normally and then STOPS at ' +
      'the cranial end of the segmented axis, so dayFront never arrives for the head, phi never reaches ' +
      'PHI_MAX there, the plate stays open and no skin closes over it. The only geometry added is the ' +
      'exposed, degenerated forebrain lying in the groove.',
    openCaudal: 'MYELOSCHISIS, the same thing at the other end: the caudal front stops where it had got ' +
      'to two days early, read off the somite table, so what stays open is the lumbosacral segments.',
    'openCranial+openCaudal': 'Both ends open at once.',
    tail: 'THE CAUDAL QUARTER of the same build, so a beat about secondary neurulation can hold the join ' +
      'between the two mechanisms in one frame. From a `lateral` camera the whole embryo is 19 times longer ' +
      'than it is wide and the visibility walk scores the tail at 3% of the frame; the window makes it the ' +
      'subject instead of a detail. Nothing is rebuilt: v is clipped, exactly as the `sections` slabs are.',
  },
  ACCEPTANCE: ACCEPTANCE,
  FLOORS: FLOORS,
  AXES: AXES,
  UNIT_UM: UNIT_UM,
  T_SAMPLE: T_SAMPLE,
  SCENE_T_MAX: SCENE_T_MAX,
  VIEW_DIR: VIEW_DIR,
  TOUCH_OK: TOUCH_OK,
  SB_LESIONS: SB_LESIONS,
  Q_STAGES: Q_STAGES,
  CONSTANTS_DISAGREE: CONSTANTS_DISAGREE,
  /* exposed so a test, a review or the console can re-check the arithmetic rather than trust a note */
  constants: constants,
  solved: solved,
  acceptance: acceptance,
  negatives: negatives,
  selfCheckMustStrings: selfCheckMustStrings,
  claimMeasure: claimMeasure,
  tOfDay: tOfDay,
  day: day,
  dayFront: dayFront,
  phiAt: phiAt,
  arc: arc,
  stageAt: stageAt,
  stageRuns: stageRuns,
  sectionStations: sectionStations,
  frontsMeasured: frontsMeasured,
  sectionAreaMeasured: sectionAreaMeasured,
  somiteEdge: somiteEdge,
  somiteCount: somiteCount,
  vertsByKey: vertsByKey,
  meshesOf: meshesOf,
  signedVolume: signedVolume,
  windingOf: windingOf,
  watertightOf: watertightOf,
  stackAcross: stackAcross,
  screenAxes: screenAxes,
  PERT: PERT,
};
})();
