/* MedBank · models3d/primitive-streak.js
 *
 * THE PRIMITIVE STREAK — gastrulation in the dorsal embryonic disc, day 14 to day 27, as ONE
 * CONTINUOUS FUNCTION OF t.
 *
 * Registers itself as MB3D_MODELS['primitive-streak'], which is the whole contract the procedural
 * adapter in viz3d.js needs: LAYERS, build(t, opts), FULL.
 *
 * WHY THIS IS PROCEDURAL. RENDER-STANDARD §5: procedural belongs where the form is a function of
 * something. Gastrulation is that shape twice over — a line that lengthens and then shortens, and
 * two sheets that are built out of a third one cell at a time — so every stage is a sample of one
 * function and no two stages can drift out of agreement. There is also no mesh to have: the queue
 * item carries no bodyparts3d ref, and BodyParts3D is a gross-anatomy archive of adult scan data
 * which contains nothing whatever at the scale of a 1 mm embryonic disc. NO MESH MEANS BUILD IT.
 *
 * AND THE OTHER HALF OF THAT RULE — "build it, not fake it" — is why the irregular parts of this
 * subject are NOT drawn. See gaps[] in the scene: the disc's true outline at any given hour, the
 * real number and packing of ingressing cells, and the exact cytoarchitecture of the node are not
 * things a student is examined on recognising; the TOPOLOGY is. What is examined is: which layer the
 * streak forms in, which END it forms at, which door leads where, that the definitive endoderm
 * DISPLACES the hypoblast rather than being renamed from it, that mesoderm reaches everywhere except
 * two spots, and that the thing then regresses. Every one of those is a relation this geometry either
 * satisfies or does not, and each is an acceptance row below.
 *
 * SCALE. 1 unit = 100 µm. The disc is 10 units = 1.0 mm long. See gaps[] on the real growth of the
 * disc through week 3 and why this model holds its outline fixed.
 *
 * AXES, DECLARED — AND SEE THE WARNING BELOW. RIGHT = -x, LEFT = +x, CRANIAL = +y, VENTRAL = +z,
 * so DORSAL = -z and the `posterior` camera of viz3d (dir [0,0,-1]) looks down on the epiblast,
 * which is the dorsal view every textbook figure of this subject uses.
 *
 *   *** THE HANDEDNESS OF THIS MODEL IS DECLARED, NOT PROVED. *** RENDER-STANDARD, "A DECLARED AXIS
 *   IS NOT A PROVED ONE, AND A SYMMETRIC MODEL CANNOT PROVE ITS OWN": every structure this model
 *   builds is mirror-symmetric in x EXCEPT the leftward nodal flow arrow, and that arrow's direction
 *   is a constant in this file rather than a measurement against anything. So flipping the sign in
 *   this header would mirror the picture, teach a rightward nodal flow, and leave every row below
 *   passing. Acceptance row X asserts the arrow points to +x with a magnitude floor, which pins the
 *   arrow against the DECLARATION and is explicitly not a proof of the declaration. The scene says so
 *   in gaps[] and the laterality beat's narration is not allowed to lean on it. This is the exact
 *   condition the standard describes as UNPROVEN and it is recorded as such rather than papered over.
 *
 * THE PARAMETER THAT IS SOLVED, AND WHY IT IS THAT ONE. RENDER-STANDARD: "ask which number a student
 * would be marked wrong for, and solve THAT one against a stated constraint." The marks here are lost
 * on the sentence "the lower layer of the trilaminar disc is not the old hypoblast renamed — it is
 * epiblast that migrated down and evicted it". So the constraint is a CONSERVATION: every cubic micron
 * of definitive endoderm, of intraembryonic mesoderm and of notochordal process has to have come
 * through the groove or the pit, and nothing may appear that was not delivered. Three parameters are
 * therefore solved rather than typed:
 *
 *   K        the delivery rate per unit of groove length, solved in closed form from the MEASURED
 *            volumes of the three built layers at t = 1 against the measured time-integral of the
 *            groove's own length. Change the disc outline, a layer thickness or the streak's length
 *            law and K moves.
 *   dEndo(t) the radius of the definitive-endoderm front, SOLVED BY BISECTION at every t so that the
 *            built endoderm's measured volume equals the first wave's share of what has been
 *            delivered by then.
 *   dMeso(t) the same for the mesoderm front, against the remainder.
 *
 * Nothing about "one source, three layers" is asserted as a caption. It is the constraint the
 * geometry is built to satisfy, and acceptance row C reports the residual.
 *
 * ONE SURFACE, SPLIT INTO PARTS — not five solids pushed together. The epiblast, the streak, the
 * groove, the node and the pit are ALL the dorsal lamina: one height field over the disc, partitioned
 * into disjoint regions by where you are on it. That is why the groove and the pit share x = 0 to
 * floating point (row P), why the node is contiguous with the streak it caps, and why
 * RENDER-STANDARD 3.z is satisfied by construction for that whole family instead of by a tolerance.
 * ARTWORK-STANDARD's coincidence rule — "the neurenteric canal's x MUST equal the primitive pit's x,
 * they are one continuous channel, and the first draft drew them 49 units apart" — is the same point
 * arriving from the 2D side, and it is met here by there being only one channel to begin with.
 *
 * SEGMENT BOUNDARIES AT THE REAL LANDMARKS (RENDER-STANDARD §3). The partition's seams are: the
 * streak's caudal end, the node's caudal edge (where the groove ends and the pit begins), the pit's
 * rim, the prechordal plate (where the notochordal process stops) and the two membranes' rims. Every
 * one of them is a named thing a student can be asked about, so the geometry's joins and the
 * anatomy's joins are the same joins.
 */

(function () {
const T = window.THREE, K = window.VizKit;

/* ─────────────────────────────────────────────────────────────── layers and palette */

const LAYERS = {
  epiblast:            { color: 0x9fb6c9, name: 'Epiblast — the only source of all three layers' },
  streak:              { color: 0xc0392b, name: 'Primitive streak' },
  groove:              { color: 0xe74c3c, name: 'Primitive groove' },
  node:                { color: 0x8e44ad, name: "Primitive node (Hensen's node)" },
  pit:                 { color: 0xa569bd, name: 'Primitive pit' },
  hypoblast:           { color: 0x95a5a6, name: 'Hypoblast — the layer that is evicted' },
  endoderm:            { color: 0xf1c40f, name: 'Definitive endoderm — the first wave' },
  mesoderm:            { color: 0x27ae60, name: 'Intraembryonic mesoderm — the second wave' },
  notochordal_process: { color: 0x16a085, name: 'Notochordal process — the midline route through the pit' },
  membranes:           { color: 0xd35400, name: 'Oropharyngeal and cloacal membranes — two layers, no mesoderm' },
  ingression:          { color: 0xe67e22, name: 'Ingressing cells — epithelial to mesenchymal transition' },
  endoderm_route:      { color: 0xf5b041, name: 'First wave — down to the lower layer' },
  mesoderm_route:      { color: 0x52be80, name: 'Second wave — into the middle' },
  axes:                { color: 0x2980b9, name: 'The three axes the streak defines' },
  laterality:          { color: 0x5dade2, name: 'Nodal cilia and the leftward flow' },
  streak_max:          { color: 0x7f8c8d, name: 'How far the streak reached — the regression reference' },
  teratoma:            { color: 0xaf7ac5, name: 'Sacrococcygeal teratoma — a streak remnant' },
  caudal_deficit:      { color: 0xcd6155, name: 'Caudal dysgenesis — the zone left short of mesoderm' },
};

const AXES = 'RIGHT=-x LEFT=+x CRANIAL=+y VENTRAL=+z (DORSAL=-z)';

/* ─────────────────────────────────────────── dimensions, in units of 100 µm

   Every length here is a length, and none of them is a fitted coefficient. The three numbers that
   WOULD have been fitted — the delivery rate and the two spreading fronts — are solved further down
   against the measured geometry instead. */

const DISC_L   = 10.00;   // cranio-caudal length of the disc, 1.0 mm
const W_MAX    =  3.40;   // scaling of the half-width profile below
const DOME     =  0.26;   // the disc is gently convex dorsally; it is not a flat card

const H_EPI    =  0.28;   // epiblast: tall columnar, 28 µm
const H_VENT   =  0.16;   // the ventral lamina: cuboidal to squamous, 16 µm
const H_MESO   =  0.26;   // intraembryonic mesoderm at full thickness, 26 µm

const STK_H    =  0.34;   // the streak is a THICKENED band: +30 µm over plain epiblast
const GRV_D    =  0.26;   // the groove is a furrow IN that thickening, never through it
const SU       =  0.58;   // streak band half-width
const GU       =  0.22;   // groove half-width

const NOD_RX   =  0.80;   // the node is a swelling WIDER than the band it caps
const NOD_RY   =  0.62;
/* THE NODE IS NOT A FIXED LUMP. It swells as the streak elongates and goes with it as the streak
   regresses — "by about day twenty-six it has all but gone" is a statement about the node too, and a
   constant-sized node left sitting on a vestigial streak would be a 1.24-unit object representing
   something that is no longer there. One factor, applied to both the node's radii and the pit's, so
   the dimple stays a dimple in a mound and the channel stays continuous. */
const NOD_H    =  0.26;
const PIT_RX   =  0.30;
const PIT_RY   =  NOD_RY; // the pit spans the node's whole length in the midline, so that the groove
                          // runs into it without a step: ONE channel (row P)
const PIT_D    =  0.22;

const R_NCH    =  0.30;   // notochordal process
const NCH_CLR  =  0.10;   // clearance between the rod and each lamina

const R_ORO    =  0.62;   // oropharyngeal membrane footprint
const R_CLO    =  0.52;   // cloacal membrane footprint

/* landmarks as fractions v of the disc's length, caudal v = 0 to cranial v = 1 */
const V_CAUD_S = 0.135;   // the streak's caudal end — clear of the cloacal membrane
const V_TIP_MAX= 0.550;   // the node's most cranial station: the MIDDLE of the disc, never past it
/* V_PRE IS BOUNDED BY THE MEMBRANE IN FRONT OF IT, not chosen for roundness. The oropharyngeal
   membrane is centred at V_ORO with a footprint of R_ORO, so its caudal rim is at
   V_ORO - R_ORO/DISC_L = 0.853; inside that footprint the two laminae are in CONTACT and there is no
   space for a rod. At 0.865 the notochordal process ran into it and the 3.z pair test measured a
   quarter of the rod inside the definitive endoderm. 0.81 leaves the rod's cranial dome cap 0.22
   clear of the membrane's rim, which is also the anatomy: the prechordal plate lies between the
   notochord's tip and the membrane, not under it. */
const V_PRE    = 0.810;   // prechordal plate: where the notochordal process stops
const V_ORO    = 0.915;   // oropharyngeal membrane, at the prechordal plate
const V_CLO    = 0.055;   // cloacal membrane, caudal to the streak

/* the clock */
const T_APPEAR = 0.06;    // day 15: the streak appears
const T_PEAK   = 0.44;    // day 16-17: maximum extent
const T_REG0   = 0.62;    // regression begins
const REG_DEEP = 0.92;    // how much of the streak is gone by t = 1

/* the notochordal process' own window */
const T_NCH0   = 0.42;
const T_NCH1   = 0.86;

/* first-wave saturation. The endoderm takes a declining share of each new arrival and is complete
   when FRAC x its own volume has been delivered; the remainder goes to mesoderm. FRAC is above 1
   because the two waves overlap — and it is bounded BELOW by monotonicity, not chosen for looks: the
   mesoderm's share is available*(1) - Vfull*ss'(s), and ss' peaks at 1.5, so FRAC <= 1.5 would make
   the mesoderm momentarily SHRINK. Row M asserts both fronts are monotone, which is what pins it. */
const FIRST_WAVE_FRAC = 1.70;

/* grids. NV rows along the disc; NS samples across each lane of each region. */
const NV = 56;
const NS = 10;
const LANE_OVERLAP = 0.004;   // §3: overlap adjacent parts slightly so no internal wall is exposed

/* cells */
const CELL_N  = 26;
/* A CELL IS THE SIZE OF A CELL. The first version used 0.30 — a 60 um blob, wider than the whole
   three-layered disc is thick — and the transverse section showed it: the cells hung below the
   ventral lamina like beads on a string, because a 16 um layer cannot contain a 60 um cell. An
   epiblast cell is columnar and roughly 10-12 um across, so 0.11 is 22 um on the diameter, which
   fits inside the 28 um epiblast it leaves and bulges a little out of the 16 um layer it joins,
   which is what a cell joining a squamous sheet does. Found by LOOKING at the render, which is what
   BUILD-TASK-PROMPT's fourth check is for; no measure in this file would have caught it, because
   every one of them was about where the cells are and none about how big. */
const R_CELL  = 0.11;
const CELL_DUR = 0.26;        // how long one cell takes to cross, in t
/* A SECTION HAS THICKNESS, and that is why the transverse variant shows any cells at all.
   The first version removed every cell cranial of the cut plane, on the reasoning that the plane
   removes everything cranial of it — and the visibility walk then measured the ingressing cells at
   0.000% of the frame on the one beat whose entire subject is an ingressing cell, because every
   surviving cell sat BEHIND an opaque cut face. A real transverse section through the streak is a
   slab tens of microns thick and the cells it shows are the cells inside it, half-cut, standing
   proud of the face. So the cells kept are the cells the plane passes through, and the plane itself
   is placed where the ingression actually is — at the median y of the cells in transit at that t,
   measured, rather than at a nominal mid-streak station. */
const CELL_SECTION = 0.45;    // half-thickness of the transverse section, 45 um — a thick slab,
                              // and thick on purpose: see the scene's gaps[]

const OUTLINE = 0.022;

/* THE THREE INPUTS THE PROOF PERTURBS. RENDER-STANDARD: "change the constant the geometry uses and
   the reported number must move. If it does not, the test is not measuring the model." These are
   multipliers on the three lengths every solved parameter depends on, read through a function at
   every use site so that nothing can hold a stale copy. _setConst moves them and clears the caches. */
const PERT = { hVent: 1, hMeso: 1, wMax: 1, dome: 1 };
function hVent() { return H_VENT * PERT.hVent; }
function hMeso() { return H_MESO * PERT.hMeso; }
function wMax()  { return W_MAX  * PERT.wMax; }
/* `dome` is the NEGATIVE control of the perturbation set, and it is here on purpose. The quadrature
   this model solves against is declared PLANAR — dx dy on the midsurface's projection — so moving
   the disc's dorsal convexity must change the picture and must NOT change any solved volume. A
   perturbation that moves everything proves the measure is live; one that moves nothing proves the
   measure's stated domain is the domain it actually has. */
function domeH() { return DOME * PERT.dome; }

/* ───────────────────────────────────────────────────────────────── small smooth functions */

const clamp01 = x => x < 0 ? 0 : (x > 1 ? 1 : x);
function ss(a, b, x) { const s = clamp01((x - a) / (b - a)); return s * s * (3 - 2 * s); }
/** 1 at r = 0, 0 at r >= 1, C1 at both ends. The only bump shape this file uses. */
function bump(r) { const a = Math.abs(r); return a >= 1 ? 0 : Math.cos(a * Math.PI / 2) ** 2; }
/** a smooth window over [a,b] with shoulders of width w inside each end */
function win(x, a, b, w) { return Math.min(ss(a, a + w, x), ss(b, b - w, x)); }

/* ───────────────────────────────────────────────────────── the disc's own outline

   A piriform disc, broader cranially — and the shape is not decoration. The scene's first beat says
   "the disc is broader at the cranial end than the caudal end, so the shape itself tells you which
   way round it is", which makes the ratio a testable claim (row W). */
function halfWidth(v) {
  const e = 1 - (2 * v - 1) ** 2;
  if (e <= 0) return 0;
  return wMax() * Math.sqrt(e) * (0.72 + 0.46 * v);
}
const yOf = v => DISC_L * (v - 0.5);
const vOf = y => y / DISC_L + 0.5;

/** the disc's gentle dorsal convexity */
function zBase(x, y) {
  const v = vOf(y), W = halfWidth(v);
  if (W <= 1e-9) return 0;
  const rx = clamp01(Math.abs(x) / W);
  return -domeH() * (1 - rx * rx) * Math.sin(Math.PI * clamp01(v));
}

/* ──────────────────────────────────────────────────────────────── the clock, read once per t */

function clockAt(t) {
  const grow = ss(T_APPEAR, T_PEAK, t);
  const reg  = ss(T_REG0, 1.0, t);
  /* the streak's CAUDAL end never moves; its cranial tip advances and then retreats, which is what
     regression is — the node travelling back the way it came */
  const vTip = V_CAUD_S + (V_TIP_MAX - V_CAUD_S) * grow * (1 - REG_DEEP * reg);
  /* the maximum reached SO FAR. The endoderm and mesoderm already laid down do not retreat with the
     node, so the front they spread from is the streak at its own high-water mark. */
  const growMax = ss(T_APPEAR, T_PEAK, Math.max(t, 0) );
  const vTipMax = V_CAUD_S + (V_TIP_MAX - V_CAUD_S) * growMax;
  /* the notochordal process runs cranially from the pit, and lengthens at BOTH ends during
     regression: cranially as prenotochordal cells advance, caudally as the node retreats */
  const nch = ss(T_NCH0, T_NCH1, t);
  const vNchCr = vTip + (V_PRE - vTip) * nch;
  const nodeScale = (0.30 + 0.70 * grow) * (1 - 0.70 * reg);
  return { t, grow, reg, vTip, vTipMax, nch, vNchCr, nodeScale,
           nodRx: NOD_RX * nodeScale, nodRy: NOD_RY * nodeScale,
           pitRx: PIT_RX * nodeScale, pitRy: PIT_RY * nodeScale,
           yTip: yOf(vTip), yTipMax: yOf(vTipMax), yNchCr: yOf(vNchCr),
           yCaudS: yOf(V_CAUD_S) };
}

/* ─────────────────────────────────────────── the dorsal lamina's height field

   ONE function. Positions and normals both come from it, so rule 3 holds by construction. H is the
   lamina's THICKNESS at (x,y); the free dorsal surface is zBase - H and the basal surface is zBase. */
function dorsalH(x, y, C) {
  let H = H_EPI;
  const wStreak = win(y, C.yCaudS, C.yTip, 0.30);
  if (wStreak > 0) {
    H += STK_H * bump(x / SU) * wStreak;            // a thickened band
    H -= GRV_D * bump(x / GU) * wStreak;            // with a furrow down it, never through it
  }
  const dy = (y - C.yTip) / C.nodRy, dx = x / C.nodRx;
  const rn = Math.sqrt(dx * dx + dy * dy);
  if (rn < 1) {
    H += NOD_H * bump(rn);                                                   // the mound
    const rp = Math.sqrt((x / C.pitRx) ** 2 + ((y - C.yTip) / C.pitRy) ** 2);
    H -= PIT_D * bump(rp);                                                   // the dimple in it
  }
  return Math.max(0.06, H);
}

/* ───────────────────────────────── where the two laminae are held apart, and by what

   sep(x,y,t) is the SPACE between the laminae. It is a single continuous field, and that matters:
   the mesoderm MESH is excluded from the midline where the notochord lies, but the SPACE is not —
   it is simply occupied by something else there. An earlier draft made the separation follow the
   mesoderm's own region and the ventral lamina then stepped vertically at the notochord's edge. */
/* THE MASK IS FLAT-TOPPED OVER THE WHOLE DRAWN FOOTPRINT, AND THAT IS ROUND-1 FINDING F1.
   It used to be max(bump(o), bump(c)) — a cos-squared CONE, 1 at the centre and 0 at the rim — while
   membraneExtent() below built the same membrane's own geometry as a HARD ellipse. Two definitions of
   one object, and the soft one sat in the single place that decided the examinable fact: the mesoderm
   is excluded in proportion to (1 - mask), so it was kept out at exactly one POINT and admitted at
   86-99% of full thickness over the rest of the footprint. Measured on the built triangles over a
   27 x 27 grid before the fix: worst mesoderm thickness 0.2584 of 0.2600 inside the oropharyngeal
   footprint and 0.2594 inside the cloacal, three laminae at EVERY sampled point of both, and the two
   laminae held 0.69 apart where this file's own build comment says "sepAt() returns 0 inside the
   footprint, so the two pieces touch". The scene narrates "the oropharyngeal membrane and the cloacal
   membrane stay two-layered" and the model's header lists it among the six things the scene is
   examined on.

   WHERE THIS DEPARTS FROM THE FIX AS THE REVIEW WROTE IT, because that disagreement is itself a
   finding (BUILD-TASK-PROMPT §6). The review prescribed "mask = 1 for r <= r0, falling smoothly to 0
   at r = 1, with r0 about 0.7-0.8". Its PRINCIPLE — "so the exclusion is the footprint the membrane is
   actually drawn with" — is right and is what is implemented here, but its CONSTANT does not deliver
   it: the drawn footprint IS r = 1, because membraneExtent(y) returns R*sqrt(1-(dy/R)^2), the circle
   of radius R, which in these normalised coordinates is exactly r = 1. An r0 of 0.75 would have left
   the outer 44% of each membrane's AREA three-layered — a smaller version of the same defect, and one
   that would have passed a grid sampled over the footprint. So the plateau covers r <= 1 and the taper
   is moved OUTSIDE the rim, over MEMB_FADE, where it is the mesoderm sheet thinning to a free edge as
   it approaches a membrane it never enters. That also satisfies §3's "A MEMBRANE TAPERS" in the only
   place it can be satisfied without re-admitting mesoderm into the island.

   Both ends are C1: cos^2 has zero derivative at 0 and at 1, so the plateau joins the fade smoothly at
   r = 1 and the fade reaches 0 flat at r = 1 + MEMB_FADE. A step here would put a vertical wall in the
   mesoderm slab; a cone put the defect in the middle of it. */
const MEMB_FADE = 0.30;        // the mesoderm's free edge thins over 30% of R outside each rim
function membFade(r) {
  const a = Math.abs(r);
  if (a <= 1) return 1;
  if (a >= 1 + MEMB_FADE) return 0;
  return bump((a - 1) / MEMB_FADE);
}
function membraneMask(x, y) {
  const o = Math.sqrt((x / R_ORO) ** 2 + ((y - yOf(V_ORO)) / R_ORO) ** 2);
  const c = Math.sqrt((x / R_CLO) ** 2 + ((y - yOf(V_CLO)) / R_CLO) ** 2);
  return Math.max(membFade(o), membFade(c));
}
function mesoTaperAt(x, y, dMeso, C) {
  if (!(dMeso > 0)) return 0;
  const d = distToAxis(x, y, C);
  const TAPER = 0.55;                      // a spreading sheet THINS at its advancing edge (§3)
  return clamp01((dMeso - d) / TAPER) ** 0.85;
}
function sepAt(x, y, dMeso, C) {
  const base = hMeso() * mesoTaperAt(x, y, dMeso, C);
  let s = base;
  /* THE WINDOW'S SHOULDERS SIT OUTSIDE THE ROD, NOT UNDER ITS ENDS.
     They used to run from yTip to yNchCr with a 0.25 shoulder — which is exactly the span the rod
     itself occupies, so the separation COLLAPSED under the rod's own two ends and the centreline
     dived 0.22 units over one station. A bend that tight against a 0.30 radius folds the swept
     surface, and row N measured it: 23 of the rod's 1,332 triangles wound against their own normals,
     all of them at the two ends. The kit was not at fault — tubeCapped on a straight line measures
     1.0000 — the centreline was. */
  if (y >= C.yTip - 1.3 && y <= C.yNchCr + 1.3 && C.yNchCr > C.yTip) {
    /* THE POCKET IS THE SHAPE OF THE ROD, not a cosine bump that happens to be deep enough in the
       middle. A cos-squared profile of depth 0.80 and half-width 0.40 is NARROWER than a 0.30-radius
       cylinder everywhere off the midline — at |x| = 0.25 it is 0.62 deep where the rod needs 0.57,
       and by |x| = 0.30 it has closed to 0.12 while the rod is still there — so the ventral lamina
       rose through the rod's flanks and 3.z measured 26% of its vertices inside the definitive
       endoderm. The profile is now a CIRCLE of radius R_NCH + NCH_CLR: the smallest pocket that
       contains the rod with its stated clearance at every x, and still exactly zero at
       |x| = R_NCH + NCH_CLR, which is the same line the mesoderm's medial edge stops at. That
       coincidence is load-bearing — it is what keeps the built mesoderm slab's thickness equal to the
       thickness the conservation solve integrates. The y window's flat part covers the rod's dome
       caps as well as its shaft. */
    const wy = win(y, C.yTip - 0.75, C.yNchCr + 0.75, 0.50);
    const rr = R_NCH + NCH_CLR;
    const need = 2 * Math.sqrt(Math.max(0, rr * rr - x * x)) * wy;
    if (need > s) s = need;
  }
  /* at the two membranes the layers stay in contact — that is what a two-layered island IS */
  return s * (1 - membraneMask(x, y));
}

/** distance from (x,y) to the streak's axis at its high-water mark: the median segment
    x = 0, y in [yCaudS, yTipMax]. Monotone in |x| for fixed y, which is what makes every region in
    this file an INTERVAL in x and therefore watertight to build. */
function distToAxis(x, y, C) {
  const ax = Math.abs(x);
  if (y >= C.yCaudS && y <= C.yTipMax) return ax;
  const dy = y < C.yCaudS ? (C.yCaudS - y) : (y - C.yTipMax);
  return Math.sqrt(ax * ax + dy * dy);
}
/** the inverse: the half-extent in x of {dist <= d} on the row at y, or -1 if the row is not reached */
function xExtentForDist(d, y, C) {
  if (!(d > 0)) return -1;
  if (y >= C.yCaudS && y <= C.yTipMax) return d;
  const dy = y < C.yCaudS ? (C.yCaudS - y) : (y - C.yTipMax);
  if (d <= dy) return -1;
  return Math.sqrt(d * d - dy * dy);
}
/** the half-extent of whichever membrane this row passes through, 0 if none */
function membraneExtent(y) {
  const dyo = Math.abs(y - yOf(V_ORO)), dyc = Math.abs(y - yOf(V_CLO));
  if (dyo < R_ORO) return R_ORO * Math.sqrt(1 - (dyo / R_ORO) ** 2);
  if (dyc < R_CLO) return R_CLO * Math.sqrt(1 - (dyc / R_CLO) ** 2);
  return 0;
}
function membraneWhich(y) {
  if (Math.abs(y - yOf(V_ORO)) < R_ORO) return 'oro';
  if (Math.abs(y - yOf(V_CLO)) < R_CLO) return 'clo';
  return null;
}

/* ══════════════════════════════════════════════════════════ 1 · THE PARTITION
 *
 * Every region this model draws is, on any one row of the grid, an INTERVAL in x — because every
 * boundary is either the disc's own margin, a distance from the median axis, or an ellipse centred
 * on the midline, and all three are monotone in |x|. That is not a coincidence, it is the reason the
 * construction works: an interval per row can be swept into a watertight slab, and two regions whose
 * intervals do not overlap cannot share space.
 *
 * Each region returns exactly TWO lanes, split at x = 0, always in the same order (lane 0 is the
 * RIGHT side of the embryo, -x; lane 1 is the LEFT, +x). A fixed lane count is what makes a
 * contiguous run of rows well defined, and therefore what makes the end caps land in the right
 * place. Where two lanes meet at the midline they are given a hair of overlap so that neither
 * medial wall is ever exposed (§3).
 */

function lanesMid(inner, outer) {
  /* a region occupying inner <= |x| <= outer */
  if (!(outer > 0) || outer <= inner) return [null, null];
  if (inner <= 0) return [[-outer, LANE_OVERLAP], [-LANE_OVERLAP, outer]];
  return [[-outer, -inner], [inner, outer]];
}

function dorsalCentralExtent(y, C) {
  let xc = membraneExtent(y);
  if (y >= C.yCaudS && y <= C.yTip) xc = Math.max(xc, SU);
  const dy = Math.abs(y - C.yTip);
  if (dy < C.nodRy) xc = Math.max(xc, C.nodRx * Math.sqrt(1 - (dy / C.nodRy) ** 2));
  return xc;
}

function regionsAt(y, C, st, opts) {
  const v = vOf(y), W = halfWidth(v);
  const out = {};
  if (W <= 1e-6) return out;

  /* ---- the dorsal lamina, one surface in five named pieces ---- */
  const dy = y - C.yTip;
  const xn = Math.abs(dy) < C.nodRy ? C.nodRx * Math.sqrt(1 - (dy / C.nodRy) ** 2) : 0;
  const xp = Math.abs(dy) < C.pitRy ? C.pitRx * Math.sqrt(1 - (dy / C.pitRy) ** 2) : 0;
  const inStreakY = (y >= C.yCaudS && y <= C.yTip);
  const yNodeCaud = C.yTip - C.nodRy;

  out.pit    = lanesMid(0, Math.min(xp, W));
  out.node   = lanesMid(xp, Math.min(xn, W));
  const grooveHere = (inStreakY && y <= yNodeCaud);
  out.groove = grooveHere ? lanesMid(0, Math.min(GU, W)) : [null, null];
  /* THE BAND'S INNER EDGE IS THE GROOVE WHERE THERE IS A GROOVE, AND THE NODE WHERE THERE IS NOT.
     Taking max(GU, xn) unconditionally left the strip between a narrow node's rim and the groove's
     own half-width claimed by nobody: on the rows just caudal of the node's tip, xn is below GU, and
     the partition audit measured a 0.228-unit hole on exactly those rows. Cranial of the groove's
     end the band runs right up to the node's rim, which is what the anatomy says too — the groove
     stops at the node and the pit carries the channel on. */
  out.streak = inStreakY ? lanesMid(grooveHere ? GU : xn, Math.min(SU, W)) : [null, null];

  const xm = Math.min(membraneExtent(y), W);
  out.membranes_d = lanesMid(0, xm);
  out.membranes_v = out.membranes_d;

  const xc = Math.min(dorsalCentralExtent(y, C), W);
  out.epiblast = lanesMid(xc, W);

  /* ---- the ventral lamina: definitive endoderm where the first wave has reached, hypoblast where
          it has not, and the two membranes which belong to neither ---- */
  const xeRaw = xExtentForDist(st.dEndo, y, C);
  const xe = xeRaw < 0 ? 0 : Math.min(xeRaw, W);
  out.endoderm  = lanesMid(xm, xe);
  out.hypoblast = lanesMid(Math.max(xe, xm), W);

  /* ---- the middle layer ---- */
  const xMraw = xExtentForDist(st.dMeso, y, C);
  let xM = xMraw < 0 ? 0 : Math.min(xMraw, W);
  const inNch = (C.yNchCr > C.yTip && y >= C.yTip && y <= C.yNchCr);
  const mN = inNch ? Math.min(R_NCH + NCH_CLR, W) : 0;
  if (opts && opts.dysgenesis && y < st.yDys) xM = 0;    // the variant: too little caudal mesoderm
  /* AND THE MEMBRANES' FOOTPRINT IS NOT THE MESODERM'S GROUND EITHER — F1 again, in the REGION rather
     than in the thickness. out.endoderm above has read its inner edge off membraneExtent since the
     first draft; the mesoderm did not, and relied on the mask alone to keep itself out. Now that the
     mask is a plateau over the whole footprint, relying on it alone would sweep a slab of ZERO
     thickness right across each island — a wide degenerate band of coincident top and bottom faces,
     which is the one thing §2.4b says must never be built. So the lane starts at the rim, where the
     thickness the mask returns is already exactly zero, and the slab tapers to a knife edge there
     exactly as it already does at its own advancing front. */
  out.mesoderm = lanesMid(Math.max(mN, xm), xM);

  return out;
}

/* ══════════════════════════════════════════════════════ 2 · MEASURED VOLUMES
 *
 * RENDER-STANDARD, "AN ACCEPTANCE MEASUREMENT MUST BE A FUNCTION OF THE BUILT GEOMETRY": every
 * volume below is a quadrature over the SAME row-and-lane structure the meshes are built from, with
 * the SAME thickness fields. Change a thickness, the disc outline or a landmark and every number
 * here moves. Nothing is a shape law restated.
 *
 * The quadrature is planar — dx dy on the midsurface's projection, ignoring the disc's 0.26-unit
 * dorsal convexity, which inflates the true surface area by about 0.2%. That is a consistent measure
 * used for every layer and for the delivery, so the conservation it is used to enforce is exact in
 * the measure it is stated in; the scene's gaps[] records the figure.
 */

const DY = DISC_L / NV;
const rowY = j => -DISC_L / 2 + (j + 0.5) * DY;

function laneIntegral(y, lane, thick) {
  if (!lane) return 0;
  const a = lane[0], b = lane[1];
  if (!(b > a)) return 0;
  const w = (b - a) / NS;
  let s = 0;
  for (let i = 0; i < NS; i++) s += thick(a + (i + 0.5) * w, y);
  return s * w * DY;
}

function discArea() {
  let A = 0;
  for (let j = 0; j < NV; j++) A += 2 * halfWidth(vOf(rowY(j))) * DY;
  return A;
}
function membraneArea() {
  let A = 0;
  for (let j = 0; j < NV; j++) {
    const y = rowY(j), W = halfWidth(vOf(y));
    A += 2 * Math.min(membraneExtent(y), W) * DY;
  }
  return A;
}

function endoVolumeFor(d, C) {
  let V = 0;
  for (let j = 0; j < NV; j++) {
    const y = rowY(j), W = halfWidth(vOf(y));
    if (W <= 1e-6) continue;
    const xm = Math.min(membraneExtent(y), W);
    const xeRaw = xExtentForDist(d, y, C);
    const xe = xeRaw < 0 ? 0 : Math.min(xeRaw, W);
    if (xe <= xm) continue;
    V += 2 * (xe - xm) * hVent() * DY;
  }
  return V;
}

function hypoVolumeFor(dEndo, C) {
  let V = 0;
  for (let j = 0; j < NV; j++) {
    const y = rowY(j), W = halfWidth(vOf(y));
    if (W <= 1e-6) continue;
    const xm = Math.min(membraneExtent(y), W);
    const xeRaw = xExtentForDist(dEndo, y, C);
    const xe = xeRaw < 0 ? 0 : Math.min(xeRaw, W);
    const inner = Math.max(xe, xm);
    if (inner >= W) continue;
    V += 2 * (W - inner) * hVent() * DY;
  }
  return V;
}

function mesoVolumeFor(d, C, opts, yDys) {
  let V = 0;
  for (let j = 0; j < NV; j++) {
    const y = rowY(j), W = halfWidth(vOf(y));
    if (W <= 1e-6) continue;
    const xMraw = xExtentForDist(d, y, C);
    let xM = xMraw < 0 ? 0 : Math.min(xMraw, W);
    const inNch = (C.yNchCr > C.yTip && y >= C.yTip && y <= C.yNchCr);
    const mN = inNch ? Math.min(R_NCH + NCH_CLR, W) : 0;
    const xm = Math.min(membraneExtent(y), W);
    if (opts && opts.dysgenesis && y < yDys) xM = 0;
    /* THE SAME INNER EDGE regionsAt() GIVES THE SWEEP. With the mask a plateau the integrand is zero
       inside the footprint either way, so this does not change the volume — it changes where the NS
       samples of the lane are SPENT, and keeping the two definitions identical is what makes the
       conservation this solves the conservation the model builds. A quadrature over a lane the sweep
       does not have is the fault RENDER-STANDARD's "an acceptance measurement must be a function of
       the built geometry" is about, one level down. */
    const inner = Math.max(mN, xm);
    if (xM <= inner) continue;
    const th = x => hMeso() * mesoTaperAt(x, y, d, C) * (1 - membraneMask(x, y));
    V += laneIntegral(y, [inner, xM], th) + laneIntegral(y, [-xM, -inner], th);
  }
  return V;
}

function notoVolume(C) {
  const L = Math.max(0, C.yNchCr - C.yTip);
  if (L <= 0) return 0;
  return Math.PI * R_NCH * R_NCH * L + 2 * (2 / 3) * Math.PI * R_NCH ** 3 * 0.85;
}

/* ═════════════════════════════════════ 3 · THE DELIVERY, AND THE THREE SOLVED PARAMETERS */


/* the time-integral of the groove's own length, as a cumulative table on a fine grid */
const NI = 600;
const DELIV = (function () {
  const cum = new Float64Array(NI + 1);
  let acc = 0;
  for (let i = 1; i <= NI; i++) {
    const t0 = (i - 1) / NI, t1 = i / NI;
    /* THE DELIVERY RATE IS THE GROOVE'S OWN LENGTH, and nothing else. An earlier draft multiplied it
       by (1 - reg) to "switch the streak off" during regression, which was both a second free
       constant and wrong: the groove's length ALREADY falls to near zero as the streak regresses, so
       the factor was counting the same thing twice — and it drove the delivered total to a plateau
       while the notochordal process was still lengthening, so the mesoderm's own share FELL. Row M
       caught it as a front that retreats. */
    const f = tt => Math.max(0, clockAt(tt).yTip - clockAt(tt).yCaudS);
    acc += (f(t0) + 4 * f((t0 + t1) / 2) + f(t1)) / 6 * (t1 - t0);   // Simpson
    cum[i] = acc;
  }
  return cum;
})();
function delivIntegral(t) {
  const x = clamp01(t) * NI, i = Math.floor(x), fr = x - i;
  if (i >= NI) return DELIV[NI];
  return DELIV[i] + (DELIV[i + 1] - DELIV[i]) * fr;
}

/* THE DERIVED CONSTANTS ARE LAZY, and that is not an optimisation: they are functions of the three
   perturbable lengths, so holding them as module-scope constants would let a perturbation move the
   geometry while every target volume it is solved against stayed at its old value — a perturbation
   test that passes for the wrong reason. consts() recomputes them and _resetCaches() drops them.
   K is SOLVED, in closed form, from the MEASURED volumes of the three built layers at t = 1 against
   the MEASURED time-integral of the groove's own length. */
let _CONSTS = null;
function consts() {
  if (_CONSTS) return _CONSTS;
  const discA = discArea(), membA = membraneArea();
  const vEndoFull = hVent() * (discA - membA);
  const cEnd = clockAt(1);
  const vMesoFull = mesoVolumeFor(1e4, cEnd, null, -1e9);
  const vNotoEnd = notoVolume(cEnd);
  _CONSTS = { discArea: discA, membArea: membA, vEndoFull, vMesoFull, vNotoEnd,
              k: (vNotoEnd + vEndoFull + vMesoFull) / delivIntegral(1) };
  return _CONSTS;
}

const DMAX = Math.sqrt(DISC_L * DISC_L + W_MAX * W_MAX * 4) + 1;   // generous enough to stay valid under perturbation

/* THE TARGET SATURATES, AND THE BISECTION HAS TO SAY SO RATHER THAN LAND ANYWHERE.
   Past the point where a front has covered everything it can reach, the measured volume is FLAT in d
   — so every d above that satisfies the target equally and a plain bisection returns whichever side
   of the interval it happened to be on. Measured: dMeso alternated between 4.86 and 11.56 over the
   last four stages, which row M read as a front that retreats. The saturated case is now answered
   explicitly with hi. */
function bisect(f, target, lo, hi, iters) {
  if (target >= f(hi) * (1 - 1e-12)) return hi;
  if (f(lo) > target) return lo;
  for (let i = 0; i < (iters || 30); i++) {
    const m = (lo + hi) / 2;
    if (f(m) < target) lo = m; else hi = m;
  }
  return (lo + hi) / 2;
}

/* the dysgenesis variant's own landmark: the caudal zone a failing streak leaves short. Measured as
   the share of the disc's length caudal of the streak's own mid-point at maximum extent — the part
   of the body the LAST cells through the streak would have built. */
const Y_DYS = (yOf(V_CAUD_S) + yOf(V_TIP_MAX)) / 2;

const _stateCache = {};
function stateAt(t, opts) {
  const dys = !!(opts && opts.dysgenesis);
  const key = t.toFixed(6) + (dys ? '|d' : '');
  if (_stateCache[key]) return _stateCache[key];
  const C = clockAt(t);
  const vNoto = notoVolume(C);
  const vIn = consts().k * delivIntegral(t);
  const avail = Math.max(0, vIn - vNoto);
  /* THE FIRST WAVE TAKES EVERYTHING IT CAN, AND FINISHES EXACTLY.
     h(s) = 1 - (1-s)^F with s = avail/(F x Vfull) and F = FIRST_WAVE_FRAC. Three properties are
     needed and this is the simplest function that has all three: h'(0) = F, so d(endoderm)/d(avail)
     starts at exactly 1 and the FIRST cells through go all the way down, which is the sentence the
     scene says students lose marks on; h(1) = 1 EXACTLY, so the hypoblast reaches zero rather than
     approaching it, which row D1 asserts as an equality; and h' <= F everywhere, so the mesoderm's
     share never decreases. A smoothstep was tried first and fails the first of those — it is
     quadratic at the origin, so the earliest material went to the SECOND wave. */
  const sv = clamp01(avail / (FIRST_WAVE_FRAC * consts().vEndoFull));
  const vEndo = consts().vEndoFull * (1 - Math.pow(1 - sv, FIRST_WAVE_FRAC));
  const vMesoWant = Math.max(0, avail - vEndo);
  const dEndo = bisect(d => endoVolumeFor(d, C), vEndo, 0, DMAX, 30);
  const yDys = Y_DYS;
  const dMeso = bisect(d => mesoVolumeFor(d, C, dys ? { dysgenesis: true } : null, yDys),
                       vMesoWant, 0, DMAX, 30);
  const st = {
    t, C, dEndo, dMeso, yDys,
    vIn, vNoto, vEndo, vMesoWant,
    vEndoBuilt: endoVolumeFor(dEndo, C),
    vMesoBuilt: mesoVolumeFor(dMeso, C, dys ? { dysgenesis: true } : null, yDys),
    /* THE HYPOBLAST'S SHARE IS READ OFF THE HYPOBLAST'S OWN REGION, not as one-minus-the-endoderm's.
       The two differ in exactly the case row D1 asserts: when the endoderm front has passed every
       row, 1 - V/Vfull lands on 4.4e-16 and the equality fails for a reason that has nothing to do
       with the anatomy, while the region itself is genuinely EMPTY and integrates to 0. */
    hypoFrac: hypoVolumeFor(dEndo, C) / consts().vEndoFull,
  };
  _stateCache[key] = st;
  return st;
}

/* ═══════════════════════════════════════════════════ 4 · SWEEPING A REGION INTO A SOLID
 *
 * One builder for every sheet in this model. It takes a region's per-row interval, finds the
 * contiguous runs of rows where that interval exists, and sweeps each run into a closed solid:
 * a dorsal surface, a ventral surface, two side walls and two end caps.
 *
 * NORMALS COME FROM THE SAME FUNCTION AS THE POSITIONS (rule 3). For a height surface z = f(x,y) the
 * outward normal on the dorsal side is (f_x, f_y, -1) normalised, and f_x and f_y are central
 * differences of the very f that placed the vertex, so the two cannot disagree. The walls take the
 * cross product of their own two tangents rather than a fixed +/- x: a lane's edge MOVES from row to
 * row (that is what a spreading front is), so a wall at "constant x" is not at constant x and an
 * axis-aligned normal would be wrong by the front's own slope.
 *
 * WINDING IS NOT REASONED ABOUT AT THE CALL SITE (rule 1, and 2.4b's warning that a convention which
 * has to be reasoned about will be got wrong somewhere). Every face goes through emitter().quad()
 * with its vertices in one fixed order, and acceptance row N measures the face-normal/vertex-normal
 * agreement over every triangle this file emits. If an order here is wrong, that row reads less than
 * 1.000 and says which part.
 */

const EPS = 1e-3;
function surfNormalDorsal(f, x, y, out) {
  const fx = (f(x + EPS, y) - f(x - EPS, y)) / (2 * EPS);
  const fy = (f(x, y + EPS) - f(x, y - EPS)) / (2 * EPS);
  return out.set(fx, fy, -1).normalize();
}
function surfNormalVentral(f, x, y, out) {
  const fx = (f(x + EPS, y) - f(x - EPS, y)) / (2 * EPS);
  const fy = (f(x, y + EPS) - f(x, y - EPS)) / (2 * EPS);
  return out.set(-fx, -fy, 1).normalize();
}

/* ═══════ WHERE A PART STARTS AND STOPS ALONG y — ROUND-3 FINDING F3, AND WHAT IT ACTUALLY WAS ═════
 *
 * F3: a hole in the DORSAL SURFACE on the midline just cranial of the node — 925 px of background
 * through the epiblast in beat 8, on the beat that teaches a dorsal surface. Two more like it, found
 * here and at every t: one where the groove hands the midline over to the pit (y -0.27..-0.09 at
 * t = 0.44) and one at the cloacal membrane's cranial rim.
 *
 * ROUND 3 PROPOSED MOVING THE MEDIAL LANE BOUNDARIES IN regionsAt(). MEASURED HERE, THAT IS NOT WHERE
 * IT LIVES. The partition is exact AT EVERY ROW CENTRE — the per-row audit (row P1) passes on the
 * unfixed file, and a lane-by-lane sweep of all 56 rows at nine values of t reports not one uncovered
 * micron. The hole is BETWEEN row centres, and no choice of boundary in regionsAt() can close it,
 * because regionsAt() is only ever asked about a row centre. What was wrong is this function.
 *
 * The sweep took a region's lane AT EACH ROW CENTRE and ran from the first row of a contiguous run to
 * the last. So wherever the part that owns a column CHANGES from one row to the next — groove to pit,
 * pit to epiblast, membrane to epiblast — the outgoing part's mesh stopped at its own last row centre
 * and the incoming part's began at its first, and the row-wide strip between them belonged to nobody.
 * The y-boundaries of this model's parts are ELLIPSE RIMS AND NAMED LANDMARKS — the node's rim, the
 * streak's caudal end, each membrane's rim — and not one of them lands on a row centre.
 *
 * THE FIX IS A SHARED STATION SET. The sweep no longer samples only row centres: a family of regions
 * that share one surface is swept over the SAME list of y stations, and that list carries, besides
 * every row centre, a station either side of every y at which any member of the family appears or
 * disappears — each found by BISECTING THE LANE ITSELF rather than from a list of landmarks that
 * could fall out of date with the partition. Then at every station the family tiles the disc's width
 * exactly (that is regionsAt()'s own invariant, now sampled where the boundaries are), and between
 * two stations every lane edge is a straight line between two tiling values, so the tiling holds
 * there too. A part that fades out does so at a station where its own width is ~0, with its
 * neighbours' edges already arrived; a part that stops ABRUPTLY, like the groove at the node's caudal
 * edge, does it across the 2e-5-unit pair of stations around that landmark, which is a wall rather
 * than a gap. The residue is 2e-5 units = 0.002 um, against a 0.18-unit hole.
 *
 * Two things improve with it rather than being argued about. Every sheet now reaches the disc's TRUE
 * outline instead of stopping at the outermost row centre 0.09 short of it, because the margin is
 * exactly such a transition; and a transverse section's face lands ON the cut plane for the same
 * reason, instead of up to a row behind it.
 *
 * WHAT THIS DOES NOT FIX, stated because it is the same shape one size down: a lane that exists only
 * BETWEEN two row centres and at neither is still invisible to the run finder, so a front in its
 * first few microns is found a row late. It is bounded by one row of the front's own leading edge and
 * declared in the scene's gaps[]; closing it needs a finer row grid, which is the quadrature's grid
 * and therefore a change to every solved volume.
 */

/* The two y values either side of a landmark are evaluated this far from it. It only has to be
   larger than the bisection's own error (~1e-14) and small enough that a smooth edge moves
   negligibly across it. */
const STA_TINY = 1e-6;
/* How much a lane edge must move ACROSS a landmark to count as a step rather than a smooth rim.
   The separation is wide: at an ellipse rim the edge has infinite slope, so a genuinely smooth
   boundary still moves about 0.002 across STA_TINY, while the smallest real step in this partition is
   the groove's own half-width, 0.22. */
const STA_JUMP = 0.02;

/** the lane of one region on one side, as a function of y, with the cuts applied — the function the
 *  station finder bisects and the sweep samples. */
function laneEval(key, lane, C, st, opts, cutY, cutX) {
  return function (y) {
    if (cutY != null && y > cutY) return null;
    const R = regionsAt(y, C, st, opts);
    let L = R[key] && R[key][lane];
    if (!L) return null;
    if (cutX) {
      if (lane === 1) return null;                     // the LEFT half is taken away
      L = [L[0], Math.min(L[1], 0)];
      if (!(L[1] > L[0])) return null;
    }
    return L;
  };
}

/** the y at which laneAt flips between yNull (where it is absent) and yGood (where it is present) */
function laneEdge(laneAt, yNull, yGood) {
  let a = yNull, b = yGood;
  for (let i = 0; i < 44; i++) {
    const m = 0.5 * (a + b);
    if (laneAt(m)) b = m; else a = m;
  }
  return 0.5 * (a + b);
}

/** The station set a family of regions sharing one surface is swept over: every row centre, plus a
 *  LANDMARK station at every y where any member of the family appears or disappears. */
function familyStations(laneAts) {
  const marks = [];
  for (const laneAt of laneAts) {
    const on = [];
    for (let j = 0; j < NV; j++) on.push(!!laneAt(rowY(j)));
    for (let j = 0; j < NV; j++) {
      if (!on[j]) continue;
      if (j === 0 || !on[j - 1])
        marks.push(laneEdge(laneAt, j === 0 ? rowY(0) - DY : rowY(j - 1), rowY(j)));
      if (j === NV - 1 || !on[j + 1])
        marks.push(laneEdge(laneAt, j === NV - 1 ? rowY(NV - 1) + DY : rowY(j + 1), rowY(j)));
    }
  }
  const all = [];
  for (let j = 0; j < NV; j++) all.push({ y: rowY(j), brk: false });
  for (const y of marks) all.push({ y, brk: true });
  all.sort((a, b) => a.y - b.y);
  const out = [];
  for (const st of all) {
    const last = out[out.length - 1];
    if (last && Math.abs(st.y - last.y) < 1e-5) { last.brk = last.brk || st.brk; continue; }
    out.push(st);
  }
  return out;
}

/** the station set a family keeps when it is swept the way every model in this corpus was swept
 *  before F3: one station per quadrature row, and nothing on the landmarks between them. */
function rowStations() {
  const out = [];
  for (let j = 0; j < NV; j++) out.push({ y: rowY(j), brk: false });
  return out;
}

/** one lane's value at every station of its family, as the pair of one-sided limits at a landmark */
function laneSequence(STY, laneAt) {
  return STY.map(s => {
    if (!s.brk) { const v = laneAt(s.y); return { y: s.y, Lm: v, Lp: v }; }
    return { y: s.y, Lm: laneAt(s.y - STA_TINY), Lp: laneAt(s.y + STA_TINY) };
  });
}

/* ── A STEP IS A RUN BOUNDARY, NOT A THIN SWEPT BAND ──────────────────────────────────────────────
 * The first version of this fix put two stations 2e-5 apart around each landmark and swept across
 * them. It closed every hole and FAILED the winding row at 0.940, which is the right outcome and
 * worth leaving written down: where the groove ends, the streak's inner edge moves 0.22 in x across
 * that 2e-5 of y, so the quads bridging the two stations are long thin parallelograms whose two edge
 * vectors are nearly parallel — their face normal is the cross product of those edges and is
 * numerically meaningless, which is exactly what row N measures. A step in a swept surface is not a
 * very short sweep; it is the end of one run and the start of another, with their end caps coincident
 * in the same plane. That is what this does, and it leaves no sliver to be ill-conditioned and no
 * crack between the caps, because the two caps are AT the landmark rather than either side of it.
 */
function sweepLane(E, STY, laneAt, zOut, zIn) {
  const seq = laneSequence(STY, laneAt);
  let run = [];
  const flush = () => {
    /* ── A RUN THAT BEGINS AT A STEP DOES NOT SWEEP ITS FIRST INTERVAL ─────────────────────────
     * At the node's caudal edge the groove stops and the node, the pit and a narrower streak band all
     * begin — three lanes opening from an ellipse that has just started to widen. Give that station
     * the lanes it has AT the step and the first interval has to carry the rim's whole opening: at
     * t = 0.95, with the node down to a 53 um mound, the streak's inner edge travels 0.158 in x across
     * 0.040 in y, and the quad at the lane's inner end is then nowhere near the tangent plane its
     * corners are handed. Row N read 0.9961 on it, twice. Subdividing cannot fix it — a rim is exactly
     * perpendicular to the sweep where it closes, and solving xn(y) = y - yStep for this ellipse puts
     * the crossing 0.69 beyond the interval, i.e. the rim is faster than the sweep over the whole of
     * it, at every t.
     * So the run's first station is given the lane of the station ABOVE it, and the first interval is
     * a prism: nothing sweeps, so nothing shears. What it costs is that the node's caudal rim starts
     * blunt instead of as a point, over 0.031 of y at t = 0.44 and 0.040 at t = 0.95 — 3 to 4 um of a
     * 1 mm disc. What it buys is that the partition still tiles EXACTLY at both ends of that interval,
     * because both ends now carry the SAME partition, the one regionsAt() returns at the station above
     * — and a prism cannot open a gap that its own two faces do not have. */
    if (stepStart && run.length >= 2) run[0] = { y: run[0].y, L: run[1].L };
    stepStart = false;
    if (run.length >= 2) sweepRun(E, run, zOut, zIn);
    else if (run.length === 1) _droppedRuns++;
    run = [];
  };
  let stepStart = false;
  for (const e of seq) {
    const stepped = (!e.Lm !== !e.Lp) ||
      (e.Lm && e.Lp && (Math.abs(e.Lm[0] - e.Lp[0]) > STA_JUMP || Math.abs(e.Lm[1] - e.Lp[1]) > STA_JUMP));
    if (!stepped) {
      /* THE SMOOTH SIDE OF A LANDMARK TAKES THE LIMIT FROM ABOVE, AND THE DIRECTION OF THAT BIAS IS
         THE WHOLE POINT. At an ellipse rim the boundary has INFINITE slope in y, so the two one-sided
         limits differ by ~0.0014 however small STA_TINY is. Giving the continuing neighbour the
         RECEDED value (the limit from above) and the vanishing part its fuller one (its own stepped
         branch, below) makes the pair overlap by that much instead of leaving a 0.0022-wide crack on
         the midline just past the node's rim — which is what the first version of this did, and the
         ray probe found it at x = 0 at four values of t. An overlap of two ten-thousandths of the
         disc's width is the same trade LANE_OVERLAP already makes across the midline, for the same
         reason: §3 says never expose an internal wall. */
      if (e.Lp) run.push({ y: e.y, L: e.Lp }); else flush();
      continue;
    }
    if (e.Lm) run.push({ y: e.y, L: e.Lm });
    flush();
    if (e.Lp) { run.push({ y: e.y, L: e.Lp }); stepStart = true; }
  }
  flush();
}

/** sweep one lane of one region over a station list it shares with the rest of its family */
function sweepLaneAt(E, STY, laneAt, zOut, zIn) {
  sweepLane(E, STY, laneAt, zOut, zIn);
}

/** rowsLane[j] = [x0,x1] or null, for j in 0..NV-1 (already clipped by any cut). Kept for the parts
 *  that are FLOATING REFERENCES rather than pieces of a shared surface — the regression rails and
 *  the deficiency plate — where nothing abuts them and a row centre is as good a station as any. */
function sweepRegion(E, rowsLane, zOut, zIn) {
  let j = 0;
  while (j < NV) {
    if (!rowsLane[j]) { j++; continue; }
    let j1 = j;
    while (j1 + 1 < NV && rowsLane[j1 + 1]) j1++;
    const run = [];
    for (let k = j; k <= j1; k++) run.push({ y: rowY(k), L: rowsLane[k] });
    if (run.length >= 2) sweepRun(E, run, zOut, zIn); else _droppedRuns++;
    j = j1 + 1;
  }
}

/* A SHEET THAT RUNS OUT TAPERS TO A POINT, NOT TO A HAIR. With the sweep now reaching the true y
   boundary of every lane (F3), a run's end station can be where the lane's width has gone to almost
   nothing — the disc's own margin, or an ellipse rim closing. A lane 0.005 wide, sampled across NS,
   emits quads 5e-4 by 0.09 whose two edge vectors are nearly parallel: the face normal is the cross
   product of those edges, so it is numerically meaningless, and row N read 0.9882 on exactly those
   triangles (2 of the endoderm's 5,272 at t = 0.58, 11 of the mesoderm's at t = 0.70, every one of
   them at y = -5.0000, the caudal tip). A tip narrower than a micron is COLLAPSED to a single point,
   which is what the thing it represents actually is — the margin of the disc, the closing of a rim.
   The quads at a collapsed tip are then EXACTLY degenerate rather than nearly so, and exactly
   degenerate is a case every count in this file and in the kit already handles by name. */
const MIN_TIP = 0.002;
/* 0.002 AND NOT 0.01, MEASURED. A collapse throws away the boundary the lane SHARED with its
   neighbour, so whatever it collapses it also leaves uncovered — and when several lanes of one family
   begin at the same landmark, as the pit, the node and the streak all do at the node's caudal edge,
   collapsing two of them loses two boundaries at once and the loss opens out over the interval above.
   At 0.01 that measured as a lens 0.04 by 0.013 units at t = 0.86, which the ray probe found; at 0.002
   the residue is below a fifth of a micron and the degenerate-sliver triangles it exists to prevent
   (lane widths of 0.0005 at the disc's own margin) are still collapsed. The bound is the point: a
   collapse can never cost more than MIN_TIP of width.


/** ST = [{y, L:[x0,x1]}, ...], at least two stations, in increasing y */
function sweepRun(E, ST, zOut, zIn) {
  for (const k of [0, ST.length - 1]) {
    const L = ST[k].L;
    if (L[1] - L[0] < MIN_TIP) { const m = 0.5 * (L[0] + L[1]); ST[k] = { y: ST[k].y, L: [m, m] }; }
  }
  const KN = ST.length - 1;
  const PO = [], PI = [], NO = [], NI_ = [];
  for (let k = 0; k <= KN; k++) {
    const y = ST[k].y, a = ST[k].L[0], b = ST[k].L[1];
    const po = [], pi = [], no = [], ni = [];
    for (let i = 0; i <= NS; i++) {
      const x = a + (b - a) * (i / NS);
      const zo = zOut(x, y), zi = zIn(x, y);
      po.push(new T.Vector3(x, y, zo));
      pi.push(new T.Vector3(x, y, zi));
      no.push(surfNormalDorsal(zOut, x, y, new T.Vector3()));
      ni.push(surfNormalVentral(zIn, x, y, new T.Vector3()));
    }
    PO.push(po); PI.push(pi); NO.push(no); NI_.push(ni);
  }

  /* the two broad surfaces */
  for (let k = 0; k < KN; k++) for (let i = 0; i < NS; i++) {
    E.quad(PO[k][i], PO[k][i + 1], PO[k + 1][i + 1], PO[k + 1][i],
           NO[k][i], NO[k][i + 1], NO[k + 1][i + 1], NO[k + 1][i]);
    E.quadFlip(PI[k][i], PI[k][i + 1], PI[k + 1][i + 1], PI[k + 1][i],
               NI_[k][i], NI_[k][i + 1], NI_[k + 1][i + 1], NI_[k + 1][i]);
  }

  /* the two side walls — normal from the wall's own tangents, sign-fixed outward in x */
  const _t1 = new T.Vector3(), _t2 = new T.Vector3(), _n = new T.Vector3();
  for (const side of [0, NS]) {
    const sgn = side === 0 ? -1 : 1;
    for (let k = 0; k < KN; k++) {
      _t1.subVectors(PO[k + 1][side], PO[k][side]);              // along the run
      _t2.subVectors(PI[k][side], PO[k][side]);                  // across the thickness
      _n.crossVectors(_t1, _t2).normalize();
      if (_n.lengthSq() < 0.5) _n.set(sgn, 0, 0);
      if (_n.x * sgn < 0) _n.negate();
      const n = _n.clone();
      if (side === 0)
        E.quad(PO[k][side], PO[k + 1][side], PI[k + 1][side], PI[k][side], n, n, n, n);
      else
        E.quadFlip(PO[k][side], PO[k + 1][side], PI[k + 1][side], PI[k][side], n, n, n, n);
    }
  }

  /* the two end caps — outward in -y at the caudal end, +y at the cranial end */
  for (const endK of [0, KN]) {
    const sgn = endK === 0 ? -1 : 1;
    for (let i = 0; i < NS; i++) {
      _t1.subVectors(PO[endK][i + 1], PO[endK][i]);
      _t2.subVectors(PI[endK][i], PO[endK][i]);
      _n.crossVectors(_t1, _t2).normalize();
      if (_n.lengthSq() < 0.5) _n.set(0, sgn, 0);
      if (_n.y * sgn < 0) _n.negate();
      const n = _n.clone();
      if (endK === 0)
        E.quad(PO[endK][i], PI[endK][i], PI[endK][i + 1], PO[endK][i + 1], n, n, n, n);
      else
        E.quadFlip(PO[endK][i], PI[endK][i], PI[endK][i + 1], PO[endK][i + 1], n, n, n, n);
    }
  }
}
let _droppedRuns = 0;

/* ══════════════════════════════════════════════ 5 · A BLOB OF REVOLUTION, FOR THE CELLS
 *
 * A single cell, as a surface of revolution about its own long axis, with the profile morphing from
 * a sphere to a FLASK as the cell crosses the epithelium. The flask shape is not ornament: it is
 * what the histology shows and what the word "flask-shaped" in every textbook account refers to, so
 * a model that drew every ingressing cell as a ball would be dropping the one feature a student is
 * told to look for. Normals by central difference of the same point function (rule 3); the two poles
 * are closed with triN because the difference is degenerate there. */
function revolveBlob(E, centre, axis, r, flask, NA, NB) {
  const up = Math.abs(axis.z) > 0.9 ? new T.Vector3(1, 0, 0) : new T.Vector3(0, 0, 1);
  const e1 = new T.Vector3().crossVectors(up, axis).normalize();
  const e2 = new T.Vector3().crossVectors(axis, e1).normalize();
  /* a = 0 at the trailing (apical) pole, 1 at the leading (basal) pole */
  const prof = a => {
    const ph = a * Math.PI;
    const neck = flask * ss(0.42, 1.0, 1 - a);          // narrows towards the apical pole
    return r * Math.sin(ph) * (1 - 0.78 * neck);
  };
  const along = a => -Math.cos(a * Math.PI) * r * (1 + 0.85 * flask);
  const pt = (a, b, out) => {
    const rr = prof(clamp01(a)), th = b * Math.PI * 2;
    return out.set(0, 0, 0)
      .addScaledVector(e1, rr * Math.cos(th))
      .addScaledVector(e2, rr * Math.sin(th))
      .addScaledVector(axis, along(clamp01(a)))
      .add(centre);
  };
  const _a = new T.Vector3(), _b = new T.Vector3(), _d1 = new T.Vector3(), _d2 = new T.Vector3();
  const _rad = new T.Vector3();
  const nrm = (a, b, out) => {
    const h = 0.5 / NA, g = 0.5 / NB;
    pt(a + h, b, _a); pt(a - h, b, _b); _d1.subVectors(_a, _b);
    pt(a, b + g, _a); pt(a, b - g, _b); _d2.subVectors(_a, _b);
    out.crossVectors(_d2, _d1);
    const th = b * Math.PI * 2;
    _rad.set(0, 0, 0).addScaledVector(e1, Math.cos(th)).addScaledVector(e2, Math.sin(th)).normalize();
    if (out.lengthSq() < 1e-14) out.copy(_rad);
    out.normalize();
    if (out.dot(_rad) < 0) out.negate();
    return out;
  };
  const P00 = new T.Vector3(), P10 = new T.Vector3(), P11 = new T.Vector3(), P01 = new T.Vector3();
  const N00 = new T.Vector3(), N10 = new T.Vector3(), N11 = new T.Vector3(), N01 = new T.Vector3();
  for (let ia = 0; ia < NA; ia++) for (let ib = 0; ib < NB; ib++) {
    const a0 = ia / NA, a1 = (ia + 1) / NA, b0 = ib / NB, b1 = (ib + 1) / NB;
    pt(a0, b0, P00); pt(a0, b1, P01); pt(a1, b1, P11); pt(a1, b0, P10);
    /* THE POLE BANDS ARE WOUND BY THE SAME CONVENTION AS EVERY OTHER BAND, not by triN.
       triN picks its vertex order from the geometry, which is the right tool where a caller has not
       already thought about winding — and the wrong one here, because it can choose the opposite
       order from the band below and break the surface's EDGE topology while leaving every normal
       correct. Measured: the teratoma came back with 4 unbalanced half-edges, one per lobe, with
       winding agreement still 1.0000. A pole band is just the degenerate case of the quad above: one
       of its two triangles collapses and the other keeps the quad's own order, so it is written that
       way instead. */
    if (ia === 0) {                                  // apical pole: P00 and P01 coincide
      nrm(a1, b0, N10); nrm(a1, b1, N11);
      const nPole = axis.clone().negate().lerp(N10, 0.5).normalize();
      E.tri(P00, P11, P10, nPole, N11, N10);
      continue;
    }
    if (ia === NA - 1) {                             // basal pole: P11 and P10 coincide
      nrm(a0, b0, N00); nrm(a0, b1, N01);
      const nPole = axis.clone().lerp(N00, 0.5).normalize();
      E.tri(P00, P01, P11, N00, N01, nPole);
      continue;
    }
    nrm(a0, b0, N00); nrm(a0, b1, N01); nrm(a1, b1, N11); nrm(a1, b0, N10);
    /* THE ORDER HERE WAS MEASURED, NOT REASONED ABOUT (2.4b). quad() takes a fixed vertex order and
       corrects nothing, so the face normal it produces is (d - a) x (b - a); with b stepping around
       the ring and d along the axis that comes out pointing INTO the blob, and row N read 0.0909 —
       exactly the 36 pole triangles triN had fixed out of 396. Stepping `b` along the AXIS and `d`
       around the ring is the same surface with the handedness the kit expects. */
    E.quad(P00, P10, P11, P01, N00, N10, N11, N01);
  }
}

/* ════════════════════════════════════════════ 6 · THE ROUTE A CELL TAKES, AS ONE FUNCTION
 *
 * The scene teaches three destinations and two doors: groove to the lower layer (first wave), groove
 * to the middle (second wave), pit to the midline. Those are not three drawings — they are three
 * branches of one path function, sampled either by a CELL (a blob at one phase) or by a ROUTE (the
 * whole path, as a tube with an arrow on it). That is deliberate: the arrow a student follows and
 * the cells they watch travel cannot disagree about where the road goes, because there is one road.
 */

const ROUTE_R = 0.085;

function keyPoints(route, side, fr, C, st) {
  const yEntry = route === 'noto'
    ? C.yTip
    : C.yCaudS + fr * (Math.max(C.yCaudS + 0.2, Math.min(C.yTip, C.yTip - C.nodRy)) - C.yCaudS);
  const zb = x => zBase(x, yEntry);
  const sep = x => sepAt(x, yEntry, st.dMeso, C);
  const surfMid = x => zb(x) - dorsalH(x, yEntry, C) / 2;

  const x0 = side * (GU + 1.05), x1 = side * GU * 0.55, x2 = side * GU * 0.22;
  const spread = 1.35 + 1.75 * fr;
  const P = [];
  P.push(new T.Vector3(x0, yEntry, surfMid(x0)));                       // on the surface, lateral
  P.push(new T.Vector3(x1, yEntry, surfMid(x1)));                       // reaching the groove
  P.push(new T.Vector3(x2, yEntry, zb(x2) + 0.06));                     // dropping out of the sheet
  if (route === 'endo') {
    P.push(new T.Vector3(side * 0.45, yEntry + 0.10, zb(0) + sep(0) + hVent() * 0.5));
    P.push(new T.Vector3(side * spread, yEntry + 0.55, zb(side * spread) + sep(side * spread) + hVent() * 0.5));
  } else if (route === 'meso') {
    P.push(new T.Vector3(side * 0.50, yEntry + 0.14, zb(0) + sep(0) * 0.5));
    P.push(new T.Vector3(side * spread, yEntry + 1.15, zb(side * spread) + Math.max(0.10, sep(side * spread) * 0.5)));
  } else {
    const yEnd = Math.max(C.yTip + 0.35, C.yNchCr - 0.25);
    P.push(new T.Vector3(0, C.yTip + 0.25, zb(0) + sep(0) * 0.5));
    P.push(new T.Vector3(0, yEnd, zBase(0, yEnd) + sepAt(0, yEnd, st.dMeso, C) * 0.5));
  }
  return P;
}

/** the raw path: piecewise smoothstep between the key points */
function pathAt(P, p) {
  const n = P.length - 1, x = clamp01(p) * n;
  const i = Math.min(n - 1, Math.floor(x));
  const s = x - i, w = s * s * (3 - 2 * s);
  return new T.Vector3().copy(P[i]).lerp(P[i + 1], w);
}

/* THE PATH A TUBE IS SWEPT ALONG HAS TO BE SMOOTHER THAN THE TUBE IS THICK.
   The raw path above has zero derivative at every key point (that is what makes it C1), so uniform
   sampling of it crowds points together at each corner — measured minimum spacing 0.043 against a
   tube radius of 0.105 — and the corner where a cell turns down into the groove is very nearly a
   right angle. A sweep whose radius of curvature is smaller than its own radius FOLDS, and row N
   read it as 16 of 528 triangles wound inside out. So the polyline is rounded by repeated
   neighbour-averaging and then RESAMPLED BY ARC LENGTH, which fixes both the corner and the
   crowding. The cells ride the same resampled polyline as the arrow, so the picture a student
   follows and the cells they watch cannot take different roads. */
function smoothPoly(P, nSub, passes, nOut) {
  let pts = [];
  for (let i = 0; i <= nSub; i++) pts.push(pathAt(P, i / nSub));
  for (let k = 0; k < passes; k++) {
    const q = [pts[0]];
    for (let i = 1; i < pts.length - 1; i++)
      q.push(pts[i - 1].clone().add(pts[i]).add(pts[i]).add(pts[i + 1]).multiplyScalar(0.25));
    q.push(pts[pts.length - 1]);
    pts = q;
  }
  /* arc-length resample */
  const cum = [0];
  for (let i = 1; i < pts.length; i++) cum.push(cum[i - 1] + pts[i].distanceTo(pts[i - 1]));
  const L = cum[cum.length - 1];
  const out = [];
  for (let i = 0; i <= nOut; i++) {
    const s = (L * i) / nOut;
    let j = 1; while (j < cum.length - 1 && cum[j] < s) j++;
    const f = cum[j] > cum[j - 1] ? (s - cum[j - 1]) / (cum[j] - cum[j - 1]) : 0;
    out.push(pts[j - 1].clone().lerp(pts[j], f));
  }
  return out;
}
function polyAt(poly, p) {
  const x = clamp01(p) * (poly.length - 1), i = Math.min(poly.length - 2, Math.floor(x));
  return poly[i].clone().lerp(poly[i + 1], x - i);
}
function polyTangent(poly, p) {
  const h = 1 / (poly.length - 1);
  const a = polyAt(poly, Math.max(0, p - h)), b = polyAt(poly, Math.min(1, p + h));
  const d = new T.Vector3().subVectors(b, a);
  if (d.lengthSq() < 1e-12) d.set(0, 0, 1);
  return d.normalize();
}
const _polyCache = {};
function routePoly(route, side, fr, C, st) {
  const key = route + '|' + side + '|' + fr.toFixed(4) + '|' + C.t.toFixed(5);
  if (_polyCache[key]) return _polyCache[key];
  if (Object.keys(_polyCache).length > 400) for (const k in _polyCache) delete _polyCache[k];
  const poly = smoothPoly(keyPoints(route, side, fr, C, st), 64, 16, 30);
  _polyCache[key] = poly;
  return poly;
}

function cellSpec(i) {
  const g = (i * 0.6180339887) % 1;
  const side = (i % 2 === 0) ? -1 : 1;
  const route = (i % 7 === 0) ? 'noto' : (g < 0.46 ? 'endo' : 'meso');
  const birth = T_APPEAR + (T_REG0 + 0.14 - T_APPEAR) * g;
  const fr = ((i * 0.3819660113) % 1) * 0.92 + 0.04;
  return { side, route, birth, fr };
}

function liveCells(t, C, st) {
  const out = [];
  for (let i = 0; i < CELL_N; i++) {
    const c = cellSpec(i);
    const p = (t - c.birth) / CELL_DUR;
    if (!(p > 0 && p < 1)) continue;
    if (c.route !== 'noto' && C.yTip - C.nodRy <= C.yCaudS + 0.2) continue;   // no groove yet
    const poly = routePoly(c.route, c.side, c.fr, C, st);
    const pos = polyAt(poly, p);
    const r = R_CELL * ss(0, 0.10, p) * ss(0, 0.10, 1 - p);
    if (!(r > 1e-3)) continue;
    out.push({ i, spec: c, p, pos, r, flask: bump((p - 0.36) / 0.26),
               axis: polyTangent(poly, p) });
  }
  return out;
}

/* ════════════════════════════════════════════════════════════════ 7 · BUILD */

function addTube(E, pts, rFn, ring, cap) {
  const g = K.tubeCapped(pts, rFn, { ring: ring || 14, cap: cap === undefined ? 'both' : cap });
  if (!g) return;
  const p = g.attributes.position, n = g.attributes.normal;
  const A = new T.Vector3(), B = new T.Vector3(), Cv = new T.Vector3();
  const na = new T.Vector3(), nb = new T.Vector3(), nc = new T.Vector3();
  for (let i = 0; i + 2 < p.count; i += 3) {
    A.set(p.getX(i), p.getY(i), p.getZ(i));
    B.set(p.getX(i + 1), p.getY(i + 1), p.getZ(i + 1));
    Cv.set(p.getX(i + 2), p.getY(i + 2), p.getZ(i + 2));
    na.set(n.getX(i), n.getY(i), n.getZ(i));
    nb.set(n.getX(i + 1), n.getY(i + 1), n.getZ(i + 1));
    nc.set(n.getX(i + 2), n.getY(i + 2), n.getZ(i + 2));
    E.tri(A, B, Cv, na, nb, nc);     // already wound by the kit's own sweptShell
  }
}

/* AN ARROWHEAD'S TIP IS BLUNTED BY SIX PER CENT, AND THAT IS A WORKAROUND FOR A RENDER-KIT BUG.
   A kit tube whose radius function reaches EXACTLY zero at one end, capped at the other, comes back
   non-manifold at the capped rim: three triangles on every rim edge instead of two. Localised on the
   kit alone (section 10b of viz-training/tools/render-primitive-streak.mjs reproduces it in five
   lines with no model code), and the mechanism is specific. sweptShell writes a solid tube's two flat
   end discs through triN, which DROPS a degenerate triangle — so at a zero-radius end no disc is
   written at all. stripFlatCap then asserts `pos.count === hull + 6 * ring` before it strips
   anything, that assertion fails, and it returns the geometry UNTOUCHED: the start's flat disc stays
   in place and the start's dome is laid over it, coincident. That is exactly the defect tubeCapped
   was written to remove — the kit's own comment calls it "a one-pixel dark ellipse round every capped
   end, which is the hard rim this whole change exists to remove" — reappearing wherever a tube comes
   to a point. Every arrowhead in this corpus has that shape.
   The fix belongs in render-kit and NOT in a build run: it would change every model at once. So this
   model stays off the shape instead, and 0.06 is measured rather than guessed — the kit probe reads 0
   unbalanced half-edges at 0.1 of the radius and 12 at 0.0. Six per cent of an arrowhead's own radius
   is 0.013 units, which is 1.3 um and below a pixel at every camera in this scene. */
const TIP = 0.94;              // how much of an arrowhead's radius is taken off at its point

function arrowTube(E, poly, p0, p1, r) {
  const shaft = [], head = [];
  const pEnd = p1 - 0.16 * (p1 - p0);
  for (let i = 0; i <= 20; i++) shaft.push(polyAt(poly, p0 + (pEnd - p0) * (i / 20)));
  for (let i = 0; i <= 6; i++) head.push(polyAt(poly, pEnd + (p1 - pEnd) * (i / 6)));
  addTube(E, shaft, () => r, 12, 'start');
  addTube(E, head, u => r * 2.5 * (1 - TIP * u), 12, 'start');
}

function buildStraightArrow(E, from, to, r, doubleEnded) {
  const d = new T.Vector3().subVectors(to, from);
  const len = d.length(); d.normalize();
  const headL = Math.min(0.55, len * 0.30);
  const a0 = from.clone().addScaledVector(d, doubleEnded ? headL : 0);
  const a1 = to.clone().addScaledVector(d, -headL);
  addTube(E, [a0, a1], () => r, 12, doubleEnded ? false : 'start');
  const h1 = [], N = 5;
  for (let i = 0; i <= N; i++) h1.push(a1.clone().addScaledVector(d, headL * (i / N)));
  addTube(E, h1, u => r * 2.6 * (1 - TIP * u), 12, 'start');
  if (doubleEnded) {
    const h0 = [];
    for (let i = 0; i <= N; i++) h0.push(a0.clone().addScaledVector(d, -headL * (i / N)));
    addTube(E, h0, u => r * 2.6 * (1 - TIP * u), 12, 'start');
  }
}

function buildGroup(t, opts) {
  _droppedRuns = 0;
  const C = clockAt(t);
  const st = stateAt(t, opts);
  const g = new T.Group();
  const cells = liveCells(t, C, st);
  /* THE TRANSVERSE PLANE IS PLACED WHERE THE INGRESSION IS, measured off the cells in transit at
     this t rather than nominated as "mid-streak". Falls back to the streak's own midpoint when no
     cell is in transit, which is every t outside the active window. */
  let cutY = null;
  if (opts.cuty) {
    /* and the plane is placed on the cells that are MID-INGRESSION, not on every cell in transit.
       The beat this variant exists for is about a cell leaving the sheet, so a section placed on the
       median of all live cells — most of which have finished and are spreading laterally — can show
       six cells and not one of them flask-shaped. The window is the phase over which the flask
       profile is above half, which is the same number the flask itself is built from. */
    const ing = cells.filter(c => c.flask > 0.5);
    const src = ing.length ? ing : cells;
    const ys = src.map(c => c.pos.y).sort((a, b) => a - b);
    cutY = ys.length ? ys[Math.floor(ys.length / 2)] : (C.yCaudS + C.yTip) / 2;
    cutY = Math.max(C.yCaudS + 0.3, Math.min(C.yTip - 0.1, cutY));
  }
  const cutX = !!opts.cutx;

  /* ---- the sheets ---- */
  /* the per-row partition is no longer what the sheets are swept from — see F3 above and laneEval()/
     familyStations() — so the row table and its lane accessor are gone with it. Nothing else read
     them; the quadrature in §2 has always walked its own rows. */

  const zDorsalOut = (x, y) => zBase(x, y) - dorsalH(x, y, C);
  const zDorsalIn  = (x, y) => zBase(x, y);
  const zMesoOut   = (x, y) => zBase(x, y);
  const zMesoIn    = (x, y) => zBase(x, y) + sepAt(x, y, st.dMeso, C);
  const zVentOut   = (x, y) => zBase(x, y) + sepAt(x, y, st.dMeso, C);
  const zVentIn    = (x, y) => zBase(x, y) + sepAt(x, y, st.dMeso, C) + hVent();

  /* ── THE THREE FAMILIES, AND WHY THEY ARE SWEPT SEPARATELY (F3) ──────────────────────────────
     A station set has to be SHARED by every region that abuts another, because a shared station is
     what makes two neighbouring lane edges straight lines between the same pair of y values — and
     that is what makes the tiling hold between stations and not only at them. Regions that do not
     share a surface do not need to share stations, so the families are exactly the surfaces: the
     dorsal lamina (epiblast, streak, groove, node, pit and the membranes' dorsal half), the ventral
     lamina (definitive endoderm, hypoblast and the membranes' ventral half), and the middle layer,
     which abuts nothing in its own plane. Keeping them separate holds the station count — and the
     triangle count — to what each surface's own boundaries require. */
  /* ── AND WHY ONLY THE DORSAL FAMILY GETS LANDMARK STATIONS IN THIS ROUND ──────────────────────
   * F3 was reported on the dorsal lamina and that is where the fix is applied and proved. The ventral
   * lamina and the middle layer have the SAME DEFECT — the same measurement finds it, and the numbers
   * are in the scene's gaps[] — but the fix does not survive there yet, for a reason worth the next
   * round's attention rather than a tolerance:
   *
   * each membrane's footprint is a CIRCLE, so at its cranial and caudal rims the boundary runs
   * ACROSS the sweep. Put a station on such a rim and the interval below it carries the whole
   * closure: the endoderm's inner edge travels 0.213 in x over 0.038 in y, and those quads span a
   * quarter of the disc's width. On the DORSAL side the height field is smooth there, so they stay
   * within the winding row's tolerance of zero. On the VENTRAL side the mesoderm's fade ramp meets
   * that same rim — sepAt rises 0.26 over 0.19 units radially — and 2 of the endoderm's 5,288
   * triangles at t = 0.98 then wind against the vertex normals they were emitted with. Row N read
   * 0.99962, and row N is the row that caught the original winding bug, so it is not getting a
   * threshold.
   * Three ways out were tried and measured here before scoping this back: SUBDIVIDING the interval
   * makes it WORSE (the boundary is exactly perpendicular at the rim, so the last sliver's shear
   * grows without bound — 44 offending triangles at 7 passes, and the endoderm's count tripled);
   * taking the normal's slope along y from the mesh's own secant made it worse again, 15 offenders,
   * because the normals were never the faulty half (the parametric normal of this sweep works out to
   * exactly the height field's (fx, fy, -1), shear and all); and truncating the footprint to turn the
   * rim into a clean step needs the truncation to reach 0.163 of the radius before the shear is
   * bounded, which flattens a membrane a beat points at and re-opens F1's own complaint that the
   * footprint and the mask are two definitions of one object.
   * What it needs is a sweeper that lets two adjacent stations carry DIFFERENT numbers of samples
   * across the lane, so a boundary running across the sweep is met by a fan of triangles rather than
   * by shearing every quad in the row. That is a change to the sweeper for every model and it is not
   * a build run's to make unannounced. */
  const FAMILIES = [
    /* THE DORSAL LAMINA'S CENTRAL HANDOVERS, which is exactly what F3 is about and exactly as far as
       this goes. The station set is generated from the four central lanes — the streak band, the
       groove, the node and the pit — and shared with the epiblast, which is the surface they hand the
       midline to and from. Nothing else in the model changes station set, so every other part is built
       as it was: the membranes keep ONE footprint for both their halves, the middle layer keeps its
       medial edge exactly where each membrane's rim leaves it, and the ventral lamina is untouched.
       That restraint is not tidiness. Each time this was widened, something measurable broke and said
       so: the membranes on landmark stations while the mesoderm was on rows put MESODERM INSIDE A
       FOOTPRINT (row L2, three laminae where it asserts two); moving the mesoderm with them opened
       0.031 of empty space inside a membrane (row L1) and pushed the triangulation's own first-moment
       asymmetry past its floor (row J4); and the ventral lamina cannot take them at all until the
       sweeper can fan (row N, and the note below). The holes those would have closed are REAL and
       MEASURED and are in the scene's gaps[] with their sizes, which is the honest place for a defect
       a run has found and not fixed. */
    { name: 'dorsal', landmarks: true,
      regions: ['epiblast', 'streak', 'groove', 'node', 'pit'],
      markFrom: ['streak', 'groove', 'node', 'pit'] },
    { name: 'membranes', landmarks: false, regions: ['membranes_d', 'membranes_v'] },
    { name: 'ventral', landmarks: false, regions: ['endoderm', 'hypoblast'] },
    { name: 'middle',  landmarks: false, regions: ['mesoderm'] },
  ];
  const Z_OF = {
    epiblast:  [zDorsalOut, zDorsalIn], streak:   [zDorsalOut, zDorsalIn],
    groove:    [zDorsalOut, zDorsalIn], node:     [zDorsalOut, zDorsalIn],
    pit:       [zDorsalOut, zDorsalIn], membranes_d: [zDorsalOut, zDorsalIn],
    endoderm:  [zVentOut,   zVentIn],   hypoblast: [zVentOut,  zVentIn],
    membranes_v: [zVentOut, zVentIn],   mesoderm:  [zMesoOut,  zMesoIn],
  };
  const LANE_AT = {}, STATIONS = {};
  for (const fam of FAMILIES) {
    const fns = [];
    for (const region of fam.regions) for (const lane of [0, 1]) {
      const f = laneEval(region, lane, C, st, opts, cutY, cutX);
      LANE_AT[region + '|' + lane] = f;
      if (!fam.markFrom || fam.markFrom.indexOf(region) >= 0) fns.push(f);
    }
    const STY = fam.landmarks ? familyStations(fns) : rowStations();
    for (const region of fam.regions) STATIONS[region] = STY;
  }
  const sweepRegionAt = (E, region) => {
    const [zo, zi] = Z_OF[region];
    sweepLaneAt(E, STATIONS[region], LANE_AT[region + '|0'], zo, zi);
    sweepLaneAt(E, STATIONS[region], LANE_AT[region + '|1'], zo, zi);
  };

  const SHEETS = ['epiblast', 'streak', 'groove', 'node', 'pit', 'mesoderm', 'endoderm', 'hypoblast'];
  const emitted = {};
  for (const key of SHEETS) {
    const E = K.emitter();
    sweepRegionAt(E, key);
    if (E.count() > 0) {
      const geo = E.geometry(E.count());
      K.addSolid(g, key, geo, { color: LAYERS[key].color, name: LAYERS[key].name, outline: OUTLINE });
      emitted[key] = E.count();
    }
  }
  /* the two membranes own BOTH laminae over their own footprint, because that is what a two-layered
     island is: ectoderm and endoderm in contact with no mesoderm between them. They are not a third
     object laid on top of the layers — they ARE the layers, at a place where the layers never
     separated. sepAt() returns 0 inside the footprint, so the two pieces touch. */
  {
    const E = K.emitter();
    sweepRegionAt(E, 'membranes_d');
    sweepRegionAt(E, 'membranes_v');
    if (E.count() > 0) {
      K.addSolid(g, 'membranes', E.geometry(E.count()),
        { color: LAYERS.membranes.color, name: LAYERS.membranes.name, outline: OUTLINE });
      emitted.membranes = E.count();
    }
  }

  /* ---- the notochordal process: a median rod between the layers ---- */
  if (C.yNchCr > C.yTip + 0.25 && cutY == null) {
    const E = K.emitter();
    const pts = [];
    const N = 22;
    for (let i = 0; i <= N; i++) {
      const y = C.yTip + (C.yNchCr - C.yTip) * (i / N);
      /* the rod's centreline sits at the pocket's own centre — R_NCH + NCH_CLR above the epiblast's
         basal face — rather than at half of whatever sepAt happens to return, so the clearance is a
         stated length and not a consequence of the mesoderm's current thickness */
      pts.push(new T.Vector3(0, y, zBase(0, y) + (R_NCH + NCH_CLR)));
    }
    addTube(E, pts, u => R_NCH * (0.70 + 0.30 * Math.sin(Math.PI * clamp01(0.15 + 0.85 * u))), 18, 'both');
    K.addSolid(g, 'notochordal_process', E.geometry(E.count()),
      { color: LAYERS.notochordal_process.color, name: LAYERS.notochordal_process.name, outline: OUTLINE });
    emitted.notochordal_process = E.count();
  }

  /* ---- the cells in transit ---- */
  if (opts.cells !== false) {
    const E = K.emitter();
    let n = 0;
    for (const c of cells) {
      if (cutY != null && Math.abs(c.pos.y - cutY) > CELL_SECTION) continue;
      if (cutX && c.pos.x > 0.02) continue;
      revolveBlob(E, c.pos, c.axis, c.r, c.flask, 10, 14);
      n++;
    }
    if (n > 0) {
      K.addSolid(g, 'ingression', E.geometry(E.count()),
        { color: LAYERS.ingression.color, name: LAYERS.ingression.name, outline: 0.014 });
      emitted.ingression = E.count();
    }
  }

  /* ---- the two routes, as arrows on the very path the cells walk ---- */
  if (opts.routes) {
    for (const [key, route] of [['endoderm_route', 'endo'], ['mesoderm_route', 'meso']]) {
      const E = K.emitter();
      let any = false;
      for (const side of [-1, 1]) {
        if (cutX && side > 0) continue;
        if (C.yTip - C.nodRy <= C.yCaudS + 0.2) continue;
        const poly = routePoly(route, side, 0.5, C, st);
        if (cutY != null && poly[0].y > cutY) continue;
        arrowTube(E, poly, 0.02, 1.0, ROUTE_R);
        any = true;
      }
      if (any && E.count() > 0) {
        K.addSolid(g, key, E.geometry(E.count()),
          { color: LAYERS[key].color, name: LAYERS[key].name, outline: 0.014 });
        emitted[key] = E.count();
      }
    }
  }

  /* ---- the three axes ---- */
  if (opts.axes) {
    const E = K.emitter();
    const o = new T.Vector3(4.80, 1.60, -1.30);
    buildStraightArrow(E, o.clone().add(new T.Vector3(0, -2.10, 0)), o.clone().add(new T.Vector3(0, 2.10, 0)), 0.085, true);
    buildStraightArrow(E, o.clone().add(new T.Vector3(-1.65, 0, 0)), o.clone().add(new T.Vector3(1.65, 0, 0)), 0.085, true);
    buildStraightArrow(E, o.clone().add(new T.Vector3(0, 0, -1.55)), o.clone().add(new T.Vector3(0, 0, 1.55)), 0.085, true);
    K.addSolid(g, 'axes', E.geometry(E.count()),
      { color: LAYERS.axes.color, name: LAYERS.axes.name, outline: 0.016 });
    emitted.axes = E.count();
  }

  /* ---- nodal cilia and the leftward flow. THE ONLY CHIRAL THING IN THIS MODEL ---- */
  if (opts.laterality && C.grow > 0.02) {
    const E = K.emitter();
    const yN = C.yTip;
    for (let i = 0; i < 9; i++) {
      const fx = (i / 8 - 0.5) * 2 * 0.62 * C.nodRx;
      const fy = yN + ((i % 3) - 1) * 0.20;
      const zs = zBase(fx, fy) - dorsalH(fx, fy, C);
      const root = new T.Vector3(fx, fy, zs + 0.02);
      const tip = new T.Vector3(fx + 0.46, fy + 0.05, zs - 0.30);
      addTube(E, [root, root.clone().lerp(tip, 0.5), tip], u => 0.052 * (1 - 0.55 * u), 10, 'end');
    }
    /* the sweep: RIGHT (-x) to LEFT (+x), arrowhead at the LEFT. See the handedness warning above. */
    const zs0 = zBase(0, yN) - dorsalH(0, yN, C);
    const arc = [];
    for (let i = 0; i <= 16; i++) {
      const u = i / 16, x = -1.95 + 3.90 * u;
      arc.push(new T.Vector3(x, yN + 0.30, zs0 - 0.78 - 0.34 * Math.sin(Math.PI * u)));
    }
    const shaft = arc.slice(0, 14), head = arc.slice(13);
    addTube(E, shaft, () => 0.090, 12, 'start');
    addTube(E, head, u => 0.090 * 2.6 * (1 - TIP * u), 12, 'start');
    K.addSolid(g, 'laterality', E.geometry(E.count()),
      { color: LAYERS.laterality.color, name: LAYERS.laterality.name, outline: 0.014 });
    emitted.laterality = E.count();
  }

  /* ---- how far it reached: two rails and a cross-bar at the streak's high-water mark ---- */
  if (opts.streak_max) {
    const E = K.emitter();
    /* THE RAILS FLOAT WELL CLEAR OF EVERY OTHER PART, and the height is measured rather than
       chosen by eye: the dorsal lamina reaches 0.48 at the node's shoulders, the deficiency plate
       sits at 0.86-0.94 and the nodal flow arc at 1.10-1.44, so the rails go above all three. At
       0.76 they intersected the cilia and the arc, which the 3.z pair test reported at 5.8%. */
    const zo = (x, y) => zBase(x, y) - 2.05, zi = (x, y) => zBase(x, y) - 1.95;
    const yA = yOf(V_CAUD_S), yB = yOf(V_TIP_MAX) + NOD_RY;
    const rail = (xc) => {
      const L = new Array(NV).fill(null);
      for (let j = 0; j < NV; j++) {
        const y = rowY(j);
        if (y < yA || y > yB) continue;
        if (cutY != null && y > cutY) continue;
        if (cutX && xc > 0) continue;
        L[j] = [xc - 0.075, xc + 0.075];
      }
      sweepRegion(E, L, zo, zi);
    };
    rail(-SU); rail(SU);
    /* the cross-bar at the cranial end, which is the number the reference exists to show */
    const bar = new Array(NV).fill(null);
    for (let j = 0; j < NV; j++) {
      const y = rowY(j);
      if (Math.abs(y - yB) > 0.16) continue;
      if (cutY != null && y > cutY) continue;
      bar[j] = cutX ? [-SU - 0.075, 0] : [-SU - 0.075, SU + 0.075];
    }
    sweepRegion(E, bar, zo, zi);
    if (E.count() > 0) {
      K.addSolid(g, 'streak_max', E.geometry(E.count()),
        { color: LAYERS.streak_max.color, name: LAYERS.streak_max.name, outline: 0.014 });
      emitted.streak_max = E.count();
    }
  }

  /* ---- the two things a streak that does not disappear properly leaves behind ---- */
  if (opts.clinical) {
    const E = K.emitter();
    const base = new T.Vector3(0, -DISC_L / 2 - 1.55, 1.05);
    const lobes = [[0, 0, 0, 0.98], [0.72, -0.48, 0.30, 0.66], [-0.66, -0.40, 0.22, 0.56],
                   [0.12, -0.92, -0.26, 0.46]];
    for (const [dx, dy, dz, r] of lobes) {
      if (cutX && dx > 0.02) continue;
      const ctr = base.clone().add(new T.Vector3(dx, dy, dz));
      if (cutY != null && ctr.y > cutY) continue;
      revolveBlob(E, ctr, new T.Vector3(0, 1, 0), r, 0, 12, 18);
    }
    if (E.count() > 0) {
      K.addSolid(g, 'teratoma', E.geometry(E.count()),
        { color: LAYERS.teratoma.color, name: LAYERS.teratoma.name, outline: 0.020 });
      emitted.teratoma = E.count();
    }
    const E2 = K.emitter();
    const zo = (x, y) => zBase(x, y) - 0.94, zi = (x, y) => zBase(x, y) - 0.86;
    for (const lane of [0, 1]) {
      const L = new Array(NV).fill(null);
      for (let j = 0; j < NV; j++) {
        const y = rowY(j);
        if (y >= st.yDys) continue;
        if (cutY != null && y > cutY) continue;
        const W = halfWidth(vOf(y));
        if (W <= 0.08) continue;
        if (cutX && lane === 1) continue;
        L[j] = lane === 0 ? [-W, cutX ? 0 : LANE_OVERLAP] : [-LANE_OVERLAP, W];
      }
      sweepRegion(E2, L, zo, zi);
    }
    if (E2.count() > 0) {
      K.addSolid(g, 'caudal_deficit', E2.geometry(E2.count()),
        { color: LAYERS.caudal_deficit.color, name: LAYERS.caudal_deficit.name, outline: 0.016 });
      emitted.caudal_deficit = E2.count();
    }
  }

  g.userData.state = {
    t, dEndo: st.dEndo, dMeso: st.dMeso, hypoFrac: st.hypoFrac,
    vIn: st.vIn, vEndo: st.vEndoBuilt, vMeso: st.vMesoBuilt, vNoto: st.vNoto,
    cells: cells.length, cutY, cutX, droppedRuns: _droppedRuns, emitted, axes: AXES,
  };
  return g;
}

/* ══════════════════════════════════ 8 · MEASURES, READ OFF THE GEOMETRY THIS FILE BUILDS
 *
 * RENDER-STANDARD, "AN ACCEPTANCE MEASUREMENT MUST BE A FUNCTION OF THE BUILT GEOMETRY": every
 * measure below either reads vertices out of a built group or integrates the very thickness fields
 * the sweeps use. None of them restates a constant. Row Y perturbs three inputs and requires the
 * dependent numbers to move, which is the only way to know that.
 *
 * The screen-plane measures exist because of RENDER-STANDARD 3.y. A mound is a rise ALONG the
 * dorsal axis, and the dorsal view is a camera looking down that axis — so the one beat that most
 * wants to say "a mound at its cranial end" is the one beat whose camera cannot show it. The
 * VIEW_DIR table is COPIED from viz3d.js rather than restated so the player's cameras and these
 * measures cannot drift apart. */

const VIEW_DIR = { anterior: [0, 0, 1], posterior: [0, 0, -1], lateral: [1, 0, 0],
                   medial: [-1, 0, 0], superior: [0, 1, 0.001], inferior: [0, -1, 0.001] };

function acrossScreen(vec, viewName) {
  const d0 = VIEW_DIR[viewName];
  if (!d0) throw new Error('primitive-streak: unknown view ' + viewName);
  const d = new T.Vector3().fromArray(d0).normalize();
  const v = new T.Vector3().fromArray(vec);
  const along = v.dot(d);
  return Math.sqrt(Math.max(0, v.lengthSq() - along * along));
}

const MEAS_OPTS = () => ({ routes: true, axes: true, laterality: true, streak_max: true,
                           cells: true, clinical: true });
const _grpCache = {};
function builtGroup(t, extra) {
  const key = t.toFixed(6) + '|' + JSON.stringify(extra || {});
  if (_grpCache[key]) return _grpCache[key];
  const o = Object.assign(MEAS_OPTS(), extra || {});
  const g = buildGroup(clamp01(t), o);
  if (Object.keys(_grpCache).length > 40) for (const k in _grpCache) delete _grpCache[k];
  _grpCache[key] = g;
  return g;
}
function partBox(t, keys, extra) {
  const g = builtGroup(t, extra);
  const set = new Set(Array.isArray(keys) ? keys : [keys]);
  const box = new T.Box3(); let any = false;
  g.traverse(o => {
    if (!o.isMesh || o.userData.outline) return;
    if (!set.has(o.userData.key)) return;
    const p = o.geometry.attributes.position;
    for (let i = 0; i < p.count; i++) { box.expandByPoint(new T.Vector3(p.getX(i), p.getY(i), p.getZ(i))); any = true; }
  });
  return any ? box : null;
}
function partVertexMean(t, key, axis, extra) {
  const g = builtGroup(t, extra);
  let s = 0, n = 0;
  g.traverse(o => {
    if (!o.isMesh || o.userData.outline || o.userData.key !== key) return;
    const p = o.geometry.attributes.position;
    for (let i = 0; i < p.count; i++) { s += (axis === 'x' ? p.getX(i) : axis === 'y' ? p.getY(i) : p.getZ(i)); n++; }
  });
  return n ? s / n : NaN;
}

/* ═══════════════════════ REGION-SAMPLED MEASURES, READ OFF THE BUILT TRIANGLES
 *
 * ROUND-1 REVIEW FINDING F1, 2026-10-02, and the rule it proposed. A claim about a REGION — "the
 * membrane is two-layered", "there is no mesoderm here" — was tested at ONE point, the centre of the
 * membrane, and the field it tested was correct at exactly that point and wrong over three quarters
 * of the area around it. The membrane's own geometry was built as a HARD ellipse by membraneExtent()
 * while the only thing keeping mesoderm out of it, membraneMask(), was a soft cone: two definitions
 * of one object, with the soft one sitting in the single place that decided the examinable fact.
 * Worse, the measure recomputed the thickness law ANALYTICALLY from the constants the geometry was
 * built from, which RENDER-STANDARD's "AN ACCEPTANCE MEASUREMENT MUST BE A FUNCTION OF THE BUILT
 * GEOMETRY" forbids in those words.
 *
 * So everything below reads TRIANGLES. A vertical line is dropped through every point of a grid
 * covering the region; the z-crossings of each named part are collected; a part's thickness in that
 * column is the span of its own crossings, and the layer count is how many laminae the column passes
 * through. THE REPORTED NUMBER IS THE WORST POINT OVER THE GRID, never a point of the author's
 * choosing, and the grid's own size is reported alongside it so a reader can see the claim was not
 * tested on three points.
 *
 * Silhouette shells are excluded (userData.outline). Including them reads the outline's own 0.022
 * offset as tissue and makes every column measure about 0.22 whatever the model does — which is the
 * trap the round-1 review walked into on its first pass and wrote down for this run.
 */

const REG_DORSAL  = ['epiblast', 'streak', 'groove', 'node', 'pit'];
const REG_VENTRAL = ['endoderm', 'hypoblast'];

/** every non-outline triangle of the built group, bucketed by key, each carrying its own xy box */
const _triCache = {};
function triIndex(t, extra) {
  const ck = t.toFixed(6) + '|' + JSON.stringify(extra || {});
  if (_triCache[ck]) return _triCache[ck];
  const g = builtGroup(t, extra);
  const out = {};
  g.traverse(o => {
    if (!o.isMesh || o.userData.outline) return;
    const key = o.userData.key; if (!key) return;
    const p = o.geometry.attributes.position, idx = o.geometry.index;
    const n = idx ? idx.count : p.count;
    const arr = out[key] || (out[key] = []);
    for (let i = 0; i + 2 < n; i += 3) {
      const a = idx ? idx.getX(i) : i, b = idx ? idx.getX(i + 1) : i + 1, c = idx ? idx.getX(i + 2) : i + 2;
      const ax = p.getX(a), ay = p.getY(a), bx = p.getX(b), by = p.getY(b), cx = p.getX(c), cy = p.getY(c);
      /* THE WINDING-DERIVED NORMAL'S z-SIGN, AT INDEX 13. columnGap() needs to know whether a crossing
         is an entry or an exit, and the only honest source for that is the triangle's own vertex
         ORDER — the invariant RENDER-STANDARD 2.1 states and this harness re-measures on a unit
         sphere every run. Reading the emitted vertex normals instead would make the probe believe
         whatever the normals claim, which is the thing under test elsewhere in this file. */
      const nz = (bx - ax) * (cy - ay) - (by - ay) * (cx - ax);
      arr.push([ax, ay, p.getZ(a), bx, by, p.getZ(b), cx, cy, p.getZ(c),
                Math.min(ax, bx, cx), Math.max(ax, bx, cx), Math.min(ay, by, cy), Math.max(ay, by, cy),
                nz]);
    }
  });
  if (Object.keys(_triCache).length > 12) for (const k in _triCache) delete _triCache[k];
  _triCache[ck] = out;
  return out;
}
function gather(TI, keys) { let a = []; for (const k of keys) if (TI[k]) a = a.concat(TI[k]); return a; }

/** the z-span of these triangles in the vertical column at (x,y), and how many crossings there were */
function spanAt(tris, x, y) {
  if (!tris || !tris.length) return { n: 0, span: 0 };
  let lo = Infinity, hi = -Infinity, n = 0;
  for (let k = 0; k < tris.length; k++) {
    const R3 = tris[k];
    if (x < R3[9] || x > R3[10] || y < R3[11] || y > R3[12]) continue;
    const x1 = R3[0], y1 = R3[1], z1 = R3[2], x2 = R3[3], y2 = R3[4], z2 = R3[5],
          x3 = R3[6], y3 = R3[7], z3 = R3[8];
    const d = (y2 - y3) * (x1 - x3) + (x3 - x2) * (y1 - y3);
    if (Math.abs(d) < 1e-15) continue;                       // a degenerate triangle crosses nothing
    const l1 = ((y2 - y3) * (x - x3) + (x3 - x2) * (y - y3)) / d;
    const l2 = ((y3 - y1) * (x - x3) + (x1 - x3) * (y - y3)) / d;
    const l3 = 1 - l1 - l2;
    if (l1 < -1e-9 || l2 < -1e-9 || l3 < -1e-9) continue;
    const z = l1 * z1 + l2 * z2 + l3 * z3;
    if (z < lo) lo = z;
    if (z > hi) hi = z;
    n++;
  }
  return { n, span: n >= 2 ? hi - lo : 0 };
}

/** the sorted z-crossings of these triangles in the column at (x,y), each with its entry/exit sign */
function crossingsAt(tris, x, y) {
  const zs = [];
  if (!tris) return zs;
  for (let k = 0; k < tris.length; k++) {
    const R3 = tris[k];
    if (x < R3[9] || x > R3[10] || y < R3[11] || y > R3[12]) continue;
    const x1 = R3[0], y1 = R3[1], z1 = R3[2], x2 = R3[3], y2 = R3[4], z2 = R3[5],
          x3 = R3[6], y3 = R3[7], z3 = R3[8];
    const d = (y2 - y3) * (x1 - x3) + (x3 - x2) * (y1 - y3);
    if (Math.abs(d) < 1e-15) continue;
    const l1 = ((y2 - y3) * (x - x3) + (x3 - x2) * (y - y3)) / d;
    const l2 = ((y3 - y1) * (x - x3) + (x1 - x3) * (y - y3)) / d;
    const l3 = 1 - l1 - l2;
    if (l1 < -1e-9 || l2 < -1e-9 || l3 < -1e-9) continue;
    /* +1 entering the solid, -1 leaving it. A column is swept in +z, so a face whose outward normal
       points -z is an entry. A face exactly edge-on (nz == 0) is tangent to the column and is not a
       crossing of its interior. */
    if (R3[13] === 0) continue;
    zs.push([l1 * z1 + l2 * z2 + l3 * z3, R3[13] < 0 ? 1 : -1]);
  }
  zs.sort((u, v) => u[0] - v[0]);
  return zs;
}

/* HOW MUCH EMPTY SPACE A COLUMN PASSES THROUGH INSIDE ONE PART. Crossings are paired into solid
   intervals, the intervals are merged, and the gap is the part of the column's own span that no
   interval covers. Inside a membrane's footprint the two laminae are IN CONTACT — that is what a
   two-layered island is — so this must be zero; before F1 was fixed the soft cone held them apart
   over most of the footprint and nothing measured it, because the only check sat at the one point
   where the cone bottomed out. Merging rather than subtracting pairwise matters: the midline
   LANE_OVERLAP hair makes a column near x = 0 cross both lanes, and a pairwise sum would read the
   double-covered interval as negative gap. */
function columnGap(tris, x, y) {
  const zs = crossingsAt(tris, x, y);
  if (zs.length < 2) return { span: 0, gap: 0, n: zs.length };
  /* A WINDING SCAN, NOT A PARITY PAIRING, AND THE FIRST VERSION OF THIS MEASURE GOT IT WRONG IN A WAY
     WORTH RECORDING. Pairing sorted crossings two by two assumes the column passes through ONE solid.
     Every region in this model is swept as two lanes split at x = 0 with a LANE_OVERLAP hair between
     them (§3), so a column at x = 0 crosses BOTH lanes at the same four heights, the parity pairing
     then matched each height with its own duplicate, every interval came out zero-length, and the
     probe reported the membrane's whole 0.44 thickness as empty space. It said 0.69 before the mask
     fix and 0.44 after — a number that moved, looked like a measurement, and was measuring the
     midline bookkeeping. Accumulating the winding instead is indifferent to how many lanes overlap. */
  let depth = 0, filled = 0, last = zs[0][0];
  for (let i = 0; i < zs.length; i++) {
    if (depth > 0) filled += zs[i][0] - last;
    last = zs[i][0];
    depth += zs[i][1];
  }
  const span = zs[zs.length - 1][0] - zs[0][0];
  return { span, gap: Math.max(0, span - filled), n: zs.length, netWinding: depth };
}

/* MEMB_RMAX STOPS SHORT OF THE RIM FOR A STATED REASON, not to flatter the number. Adjacent lanes are
   given a LANE_OVERLAP hair (0.004) so that no internal wall is ever exposed (§3), so a column placed
   exactly on the membrane's rim legitimately hits the epiblast's lane as well and would read three
   laminae on geometry with no fault in it. 0.97 of R_CLO is 0.0156 of clearance, four times the hair.
   The outer 3% is not thereby exempt: the SWEPT footprint is a polygon inscribed in the ellipse, so
   the honest region is where the membrane is ACTUALLY BUILT, and coverage below reports what fraction
   of the footprint that came to — the claim is void if it is not nearly all of it. */
const MEMB_RMAX = 0.97;
const MEMB_GRID = 26;

const _membCache = {};
function membraneRegionReport(t, which, extra) {
  const ck = t.toFixed(6) + '|' + which + '|' + JSON.stringify(extra || {});
  if (_membCache[ck]) return _membCache[ck];
  const R  = which === 'oro' ? R_ORO : R_CLO;
  const yc = yOf(which === 'oro' ? V_ORO : V_CLO);
  const TI = triIndex(t, extra);
  const memb = TI.membranes || [], meso = TI.mesoderm || [];
  const dors = gather(TI, REG_DORSAL), vent = gather(TI, REG_VENTRAL);
  let inFoot = 0, onMemb = 0, worstMeso = 0, layMax = 0, layMin = 99, worstGap = 0;
  let wx = NaN, wy = NaN, gx = NaN, gy = NaN;
  for (let i = 0; i <= MEMB_GRID; i++) {
    for (let j = 0; j <= MEMB_GRID; j++) {
      const x = -R + 2 * R * (i / MEMB_GRID);
      const y = (yc - R) + 2 * R * (j / MEMB_GRID);
      if (Math.sqrt((x / R) ** 2 + ((y - yc) / R) ** 2) > MEMB_RMAX) continue;
      const W = halfWidth(vOf(y));
      if (!(W > 1e-6) || Math.abs(x) > W * 0.995) continue;      // outside the disc: no tissue at all
      inFoot++;
      const mb = spanAt(memb, x, y);
      if (mb.n < 2) continue;                      // not a column the membrane was actually built in
      onMemb++;
      const ms = spanAt(meso, x, y);
      if (ms.span > worstMeso) { worstMeso = ms.span; wx = x; wy = y; }
      const cg = columnGap(memb, x, y);
      if (cg.gap > worstGap) { worstGap = cg.gap; gx = x; gy = y; }
      const lay = 2 + (ms.n >= 2 ? 1 : 0)
                    + (spanAt(dors, x, y).n >= 2 ? 1 : 0)
                    + (spanAt(vent, x, y).n >= 2 ? 1 : 0);
      if (lay > layMax) layMax = lay;
      if (lay < layMin) layMin = lay;
    }
  }
  const out = { inFoot, onMemb, coverage: inFoot ? onMemb / inFoot : 0, worstMeso, worstGap,
                layersMax: layMax, layersMin: layMin === 99 ? 0 : layMin,
                worstAt: [wx, wy], worstGapAt: [gx, gy] };
  if (Object.keys(_membCache).length > 24) for (const k in _membCache) delete _membCache[k];
  _membCache[ck] = out;
  return out;
}

/* ── CONTIGUITY ALONG THE SWEEP, which is the row round 3 asked for with F3 ───────────────────────
 *
 * Row P1 asserts that on every row the named pieces cover the disc's full width with no gap left over,
 * and it has always passed — including on the file F3 was found in. It is a statement about each row
 * ACROSS x. F3 was consecutive rows MISSING along y: the same defect rotated ninety degrees, and
 * nothing in this file ever looked along the sweep. This is that measurement.
 *
 * It is read off the BUILT TRIANGLES, by a vertical scan in a column, so it tests the mesh a student is
 * shown rather than the partition the mesh was meant to come from — which is the whole point, because
 * the partition was right at every row centre all along and P1 says so.
 *
 * TWO NUMBERS, AND THE SECOND IS A DECLARED GAP RATHER THAN A WAIVER. Away from the two membranes'
 * rims the count must be ZERO. Within one quadrature row of a rim it is COUNTED AND REPORTED in the
 * same row, because that is where this run's fix stops: the membranes are still swept on row stations
 * (see FAMILIES in buildGroup), so a handover from a membrane to the epiblast still spreads over a
 * whole row. Reporting it in the row rather than in a comment is what keeps it from being forgotten —
 * the number moves if it gets worse, and it is in the proof file on every run.
 */
const _contigCache = {};
const CONTIG_XS = 0.08, CONTIG_YS = 0.05, CONTIG_XMAX = 1.20;
function dorsalContiguityReport(t, extra) {
  const ck = t.toFixed(6) + '|' + JSON.stringify(extra || {});
  if (_contigCache[ck]) return _contigCache[ck];
  const TI = triIndex(t, extra);
  const dors = gather(TI, REG_DORSAL.concat(['membranes']));
  let tested = 0, openAway = 0, openNearRim = 0, wx = NaN, wy = NaN;
  for (let x = -CONTIG_XMAX; x <= CONTIG_XMAX + 1e-9; x += CONTIG_XS) {
    for (let y = -DISC_L / 2 + CONTIG_YS; y < DISC_L / 2; y += CONTIG_YS) {
      const W = halfWidth(vOf(y));
      if (!(W > 1e-6) || Math.abs(x) > W * 0.98) continue;
      tested++;
      if (spanAt(dors, x, y).n >= 2) continue;
      const dOro = Math.abs(Math.abs(y - yOf(V_ORO)) - R_ORO);
      const dClo = Math.abs(Math.abs(y - yOf(V_CLO)) - R_CLO);
      /* AND THE DISC'S OWN TWO TIPS, which belong in the declared bucket for a DIFFERENT reason worth
         separating: every sheet in this model still ends at the outermost ROW CENTRE, so the disc is
         built 9.82 long against the 10.00 its own outline declares — half a row blunt at each end.
         That is not a handover between parts and F3's fix does not touch it; it is in the scene's
         gaps[] with the figure, and it is counted here rather than skipped. */
      const dTip = DISC_L / 2 - Math.abs(y);
      if (Math.min(dOro, dClo, dTip) <= DY) openNearRim++;
      else { openAway++; if (isNaN(wx)) { wx = x; wy = y; } }
    }
  }
  const out = { tested, openAway, openNearRim, worstAt: [wx, wy] };
  if (Object.keys(_contigCache).length > 16) for (const k in _contigCache) delete _contigCache[k];
  _contigCache[ck] = out;
  return out;
}

/** the three-layered flank, over a REGION of established ground rather than at one convenient point */
const _flankCache = {};
function flankRegionReport(t, extra) {
  const ck = t.toFixed(6) + '|' + JSON.stringify(extra || {});
  if (_flankCache[ck]) return _flankCache[ck];
  const TI = triIndex(t, extra);
  const memb = TI.membranes || [], meso = TI.mesoderm || [];
  const dors = gather(TI, REG_DORSAL), vent = gather(TI, REG_VENTRAL);
  let n = 0, layMin = 99, layMax = 0, thinnest = Infinity;
  for (let i = 0; i <= 22; i++) {
    const v = 0.25 + (0.70 - 0.25) * (i / 22);
    const y = yOf(v), W = halfWidth(v);
    for (let j = 0; j <= 14; j++) {
      const inner = SU + 0.20, outer = W * 0.90;
      if (!(outer > inner)) continue;
      for (const sgn of [-1, 1]) {
        const x = sgn * (inner + (outer - inner) * (j / 14));
        if (spanAt(memb, x, y).n >= 2) continue;              // not the membranes' own ground
        const lay = (spanAt(meso, x, y).n >= 2 ? 1 : 0)
                  + (spanAt(dors, x, y).n >= 2 ? 1 : 0)
                  + (spanAt(vent, x, y).n >= 2 ? 1 : 0);
        n++;
        if (lay < layMin) layMin = lay;
        if (lay > layMax) layMax = lay;
        const sp = spanAt(meso, x, y).span;
        if (sp < thinnest) thinnest = sp;
      }
    }
  }
  const out = { n, layersMin: layMin === 99 ? 0 : layMin, layersMax: layMax,
                thinnestMeso: thinnest === Infinity ? 0 : thinnest };
  if (Object.keys(_flankCache).length > 12) for (const k in _flankCache) delete _flankCache[k];
  _flankCache[ck] = out;
  return out;
}

/* THE PARAXIAL BAND: the ground immediately lateral to the streak, where the mesoderm arrives FIRST.
 *
 * Beat 7 draws t = 0.58, and at that instant the mesoderm front stands 1.632 from the streak's axis
 * and has reached 41% of its ground — so "the flank of the same disc is three-layered" cannot be
 * asserted over the WHOLE flank there, and flankRegionReport's wide region correctly reads two
 * laminae at its lateral edge. The honest region for that beat is this band, and its bounds are stated
 * from the anatomy rather than from the measurement: inner edge just outside the streak band itself
 * (SU + 0.12), outer edge 1.40, which is inside the front at every t from 0.56 on. Choosing the region
 * by where the mesoderm happens to be would make the claim circular, which is the trap on the other
 * side of F1 — so the band is fixed, and the row that uses it says which t it holds from.
 */
const PARA_X0 = SU + 0.12, PARA_X1 = 1.40, PARA_V0 = 0.24, PARA_V1 = 0.46;
const _paraCache = {};
function paraxialRegionReport(t, extra) {
  const ck = t.toFixed(6) + '|' + JSON.stringify(extra || {});
  if (_paraCache[ck]) return _paraCache[ck];
  const TI = triIndex(t, extra);
  const memb = TI.membranes || [], meso = TI.mesoderm || [];
  const dors = gather(TI, REG_DORSAL), vent = gather(TI, REG_VENTRAL);
  let n = 0, layMin = 99, layMax = 0, thinnest = Infinity;
  for (let i = 0; i <= 20; i++) {
    const v = PARA_V0 + (PARA_V1 - PARA_V0) * (i / 20);
    const y = yOf(v), W = halfWidth(v);
    for (let j = 0; j <= 12; j++) {
      for (const sgn of [-1, 1]) {
        const x = sgn * (PARA_X0 + (PARA_X1 - PARA_X0) * (j / 12));
        if (Math.abs(x) > W * 0.98) continue;
        if (spanAt(memb, x, y).n >= 2) continue;
        const lay = (spanAt(meso, x, y).n >= 2 ? 1 : 0)
                  + (spanAt(dors, x, y).n >= 2 ? 1 : 0)
                  + (spanAt(vent, x, y).n >= 2 ? 1 : 0);
        n++;
        if (lay < layMin) layMin = lay;
        if (lay > layMax) layMax = lay;
        const sp = spanAt(meso, x, y).span;
        if (sp < thinnest) thinnest = sp;
      }
    }
  }
  const out = { n, layersMin: layMin === 99 ? 0 : layMin, layersMax: layMax,
                thinnestMeso: thinnest === Infinity ? 0 : thinnest };
  if (Object.keys(_paraCache).length > 12) for (const k in _paraCache) delete _paraCache[k];
  _paraCache[ck] = out;
  return out;
}

/** MESODERM IS PARAXIAL: the median strip the rod occupies carries none of it, ALONG ITS WHOLE LENGTH.
    Row S used to ask this at the rod's mid-station only — the same point-sample fault as F1, in the
    one place where a median claim is most certainly true. */
const _notoCache = {};
function notoStripReport(t, extra) {
  const ck = t.toFixed(6) + '|' + JSON.stringify(extra || {});
  if (_notoCache[ck]) return _notoCache[ck];
  const C = clockAt(t), TI = triIndex(t, extra);
  const meso = TI.mesoderm || [];
  let n = 0, worst = 0, wx = NaN, wy = NaN, ends = 0;
  /* THE SPAN IS INSET BY ONE QUADRATURE ROW AT EACH END, AND THE ENDS ARE REPORTED SEPARATELY RATHER
     THAN DROPPED. regionsAt() decides the mesoderm's inner edge row by row, so the rod's two ends fall
     between rows: on the last row before yTip there is no rod and the mesoderm legitimately reaches the
     midline, and the swept slab between that row and the first row inside the span therefore crosses
     it. Measured un-inset the strip reads 0.72 at t = 1 — which is NOT a mesoderm-over-notochord
     overlap (row 3.z measures the pair at 0.009 of the rod) but the one-row transition at the rod's
     caudal end. Insetting hides nothing: worstMesoEnds carries the boundary rows' own number so a
     reviewer can argue with the choice instead of discovering it. */
  if (C.yNchCr > C.yTip) {
    const half = (R_NCH + NCH_CLR) * 0.96;
    const y0 = C.yTip + DY, y1 = C.yNchCr - DY;
    for (let j = 0; j <= 12; j++) {
      const x = -half + 2 * half * (j / 12);
      ends = Math.max(ends, spanAt(meso, x, C.yTip).span, spanAt(meso, x, C.yNchCr).span);
    }
    if (y1 > y0) for (let i = 0; i <= 28; i++) {
      const y = y0 + (y1 - y0) * (i / 28);
      for (let j = 0; j <= 12; j++) {
        const x = -half + 2 * half * (j / 12);
        const sp = spanAt(meso, x, y).span;
        n++;
        if (sp > worst) { worst = sp; wx = x; wy = y; }
      }
    }
  }
  const out = { n, worstMeso: worst, worstMesoEnds: ends, worstAt: [wx, wy] };
  if (Object.keys(_notoCache).length > 12) for (const k in _notoCache) delete _notoCache[k];
  _notoCache[ck] = out;
  return out;
}

/** the mesoderm's own thickness field, exactly as the sweep uses it */
function mesoThicknessAt(x, y, t) {
  const C = clockAt(t), st = stateAt(t, null);
  const inNch = (C.yNchCr > C.yTip && y >= C.yTip && y <= C.yNchCr);
  if (inNch && Math.abs(x) < R_NCH + NCH_CLR) return 0;         // the midline belongs to the rod
  return hMeso() * mesoTaperAt(x, y, st.dMeso, C) * (1 - membraneMask(x, y));
}
function layersAt(x, y, t) {
  return 2 + (mesoThicknessAt(x, y, t) > 0.01 ? 1 : 0);
}
/** the mesoderm's FOOTPRINT as a share of the disc outside the two membranes */
function mesoCoverFrac(t, extra) {
  const C = clockAt(t), st = stateAt(t, extra);
  let cov = 0, tot = 0;
  for (let j = 0; j < NV; j++) {
    const y = rowY(j), W = halfWidth(vOf(y));
    if (W <= 1e-6) continue;
    const xm = Math.min(membraneExtent(y), W);
    const inNch = (C.yNchCr > C.yTip && y >= C.yTip && y <= C.yNchCr);
    const mN = inNch ? Math.min(R_NCH + NCH_CLR, W) : 0;
    /* THE DENOMINATOR IS THE GROUND MESODERM CAN ACTUALLY REACH. It excludes the two membranes,
       where the layers never separate, and the median strip the notochordal process occupies —
       mesoderm is PARAXIAL, so counting the midline against it would cap the measure at 0.891 and
       make "covers everything except two spots" unassertable even when it is exactly true. The
       share of the whole disc is reported separately as mesoCoverFracOfDisc. */
    tot += 2 * Math.max(0, W - Math.max(xm, mN)) * DY;
    const xMraw = xExtentForDist(st.dMeso, y, C);
    let xM = xMraw < 0 ? 0 : Math.min(xMraw, W);
    if (extra && extra.dysgenesis && y < st.yDys) xM = 0;
    if (xM > Math.max(mN, xm)) cov += 2 * (xM - Math.max(mN, xm)) * DY;
  }
  return tot > 0 ? cov / tot : 0;
}
/** THE PARTITION AUDIT, and the first version of it measured the wrong thing.
    It summed the lanes' widths and subtracted a hand-counted allowance for the hair of midline
    overlap, which made the audit a test of the overlap bookkeeping rather than of the partition: it
    reported a residual of exactly 2 x LANE_OVERLAP on a row that was perfectly covered. What matters
    is two separate questions, so they are asked separately: does the UNION of the named pieces cover
    the disc's full width (no gap), and does any pair of DIFFERENT pieces overlap (no double claim).
    The midline hair is within one piece's own two lanes, so neither question sees it. */
function mergeLen(ivs) {
  const a = ivs.filter(Boolean).map(v => [v[0], v[1]]).sort((p, q) => p[0] - q[0]);
  let len = 0, cur = null;
  for (const v of a) {
    if (!cur) { cur = v.slice(); continue; }
    if (v[0] <= cur[1]) cur[1] = Math.max(cur[1], v[1]);
    else { len += cur[1] - cur[0]; cur = v.slice(); }
  }
  if (cur) len += cur[1] - cur[0];
  return len;
}
function crossOverlap(groups) {
  let worst = 0;
  const keys = Object.keys(groups);
  for (let a = 0; a < keys.length; a++) for (let b = a + 1; b < keys.length; b++) {
    for (const u of groups[keys[a]]) for (const v of groups[keys[b]]) {
      if (!u || !v) continue;
      worst = Math.max(worst, Math.min(u[1], v[1]) - Math.max(u[0], v[0]));
    }
  }
  return worst;
}
function partitionAudit(t) {
  const C = clockAt(t), st = stateAt(t, null);
  let gap = 0, dbl = 0;
  for (let j = 0; j < NV; j++) {
    const y = rowY(j), W = halfWidth(vOf(y));
    if (W <= 1e-6) continue;
    const R = regionsAt(y, C, st, null);
    const dor = { epiblast: R.epiblast, streak: R.streak, groove: R.groove, node: R.node,
                  pit: R.pit, membranes: R.membranes_d };
    const ven = { endoderm: R.endoderm, hypoblast: R.hypoblast, membranes: R.membranes_v };
    const flat = o => [].concat.apply([], Object.keys(o).map(k => o[k]));
    gap = Math.max(gap, Math.abs(mergeLen(flat(dor)) - 2 * W), Math.abs(mergeLen(flat(ven)) - 2 * W));
    dbl = Math.max(dbl, crossOverlap(dor), crossOverlap(ven));
  }
  return { gap, doubleClaim: dbl };
}

/** how many of a part's distinct vertex positions have no mirror image in x. Zero means the SURFACE
    is symmetric, whatever the triangulation's first moment says. */
function mirrorUnmatched(t, key) {
  const g = builtGroup(t);
  const S = new Set();
  g.traverse(o => {
    if (!o.isMesh || o.userData.outline || o.userData.key !== key) return;
    const p = o.geometry.attributes.position;
    for (let i = 0; i < p.count; i++)
      S.add(p.getX(i).toFixed(5) + ',' + p.getY(i).toFixed(5) + ',' + p.getZ(i).toFixed(5));
  });
  let miss = 0;
  for (const k of S) {
    const a = k.split(',');
    if (!S.has((-parseFloat(a[0])).toFixed(5) + ',' + a[1] + ',' + a[2])) miss++;
  }
  return miss;
}

/** face-normal / vertex-normal agreement over every triangle this file emits (rule 1) */
function windingReport(t, extra) {
  const g = builtGroup(t, extra);
  const rows = [];
  const A = new T.Vector3(), B = new T.Vector3(), Cv = new T.Vector3();
  const e1 = new T.Vector3(), e2 = new T.Vector3(), fn = new T.Vector3(), vn = new T.Vector3();
  g.traverse(o => {
    if (!o.isMesh || o.userData.outline) return;
    const p = o.geometry.attributes.position, n = o.geometry.attributes.normal;
    let agree = 0, tris = 0;
    for (let i = 0; i + 2 < p.count; i += 3) {
      A.set(p.getX(i), p.getY(i), p.getZ(i));
      B.set(p.getX(i + 1), p.getY(i + 1), p.getZ(i + 1));
      Cv.set(p.getX(i + 2), p.getY(i + 2), p.getZ(i + 2));
      fn.copy(e1.subVectors(B, A).cross(e2.subVectors(Cv, A)));
      if (fn.lengthSq() < 1e-18) continue;
      vn.set(n.getX(i) + n.getX(i + 1) + n.getX(i + 2),
             n.getY(i) + n.getY(i + 1) + n.getY(i + 2),
             n.getZ(i) + n.getZ(i + 1) + n.getZ(i + 2));
      tris++; if (fn.dot(vn) > 0) agree++;
    }
    if (tris) rows.push({ key: o.userData.key, tris, agree: agree / tris });
  });
  let worst = 1, worstKey = null;
  for (const r of rows) if (r.agree < worst) { worst = r.agree; worstKey = r.key; }
  return { rows, worst, worstKey };
}

/* ───────────────────────────────────────────── the model's own vocabulary for beat claims */

function claimMeasure(name, t) {
  const tt = clamp01(t == null ? 1 : +t);
  const C = clockAt(tt), st = stateAt(tt, null);
  const path = String(name).split('.');
  switch (path[0]) {
    case 'cells':          return liveCells(tt, C, st).length;
    case 'flaskMax': {
      const cs = liveCells(tt, C, st);
      return cs.length ? Math.max.apply(null, cs.map(c => c.flask)) : 0;
    }
    case 'cellsInSection': {
      /* how many cells the TRANSVERSE SECTION actually draws — the number the beat's picture
         depends on, which is not the same as the number in transit anywhere on the streak */
      const g = builtGroup(tt, { cuty: true });
      return (g.userData.state.emitted.ingression || 0) > 0
        ? liveCells(tt, C, st).filter(c => Math.abs(c.pos.y - g.userData.state.cutY) <= CELL_SECTION).length
        : 0;
    }
    case 'flaskMaxInSection': {
      const g = builtGroup(tt, { cuty: true });
      const cy = g.userData.state.cutY;
      const inSec = liveCells(tt, C, st).filter(c => Math.abs(c.pos.y - cy) <= CELL_SECTION);
      return inSec.length ? Math.max.apply(null, inSec.map(c => c.flask)) : 0;
    }
    case 'cellRadiusMax':  return R_CELL;
    case 'cellFitsEpiblast': return (2 * R_CELL) / H_EPI;
    case 'cellsBelowBasal': {
      /* how many live cells have their centre VENTRAL of the epiblast's basal surface: the ones that
         have actually left the sheet, which is what "drops out of the sheet" means */
      const cs = liveCells(tt, C, st);
      return cs.filter(c => c.pos.z > zBase(c.pos.x, c.pos.y)).length;
    }
    case 'streakTipFrac': {
      const b = partBox(tt, ['streak', 'groove', 'node', 'pit']);
      return b ? vOf(b.max.y) : 0;
    }
    case 'streakCaudFrac': {
      const b = partBox(tt, ['streak', 'groove', 'node', 'pit']);
      return b ? vOf(b.min.y) : 1;
    }
    case 'streakLength': {
      const b = partBox(tt, ['streak', 'groove', 'node', 'pit']);
      return b ? (b.max.y - b.min.y) : 0;
    }
    case 'nodeTipFrac': { const b = partBox(tt, 'node'); return b ? vOf(b.max.y) : 0; }
    case 'hypoFrac':       return st.hypoFrac;
    case 'endoFrac':       return 1 - st.hypoFrac;
    case 'balance':        return st.vIn > 0 ? (st.vEndoBuilt + st.vMesoBuilt + st.vNoto) / st.vIn : 1;
    case 'mesoCoverFrac':  return mesoCoverFrac(tt, null);
    case 'mesoCoverFracOfDisc': {
      const stt = stateAt(tt, null); let cov = 0, tot = 0;
      for (let j = 0; j < NV; j++) {
        const y = rowY(j), W = halfWidth(vOf(y)); if (W <= 1e-6) continue;
        tot += 2 * W * DY;
        const xm = Math.min(membraneExtent(y), W);
        const inN = (C.yNchCr > C.yTip && y >= C.yTip && y <= C.yNchCr);
        const mN = inN ? Math.min(R_NCH + NCH_CLR, W) : 0;
        const xr = xExtentForDist(stt.dMeso, y, C);
        const xM = xr < 0 ? 0 : Math.min(xr, W);
        if (xM > Math.max(mN, xm)) cov += 2 * (xM - Math.max(mN, xm)) * DY;
      }
      return tot > 0 ? cov / tot : 0;
    }
    case 'mesoCoverFracDys': return mesoCoverFrac(tt, { dysgenesis: true });
    case 'dEndo':          return st.dEndo;
    case 'dMeso':          return st.dMeso;
    case 'vEndoBuilt':     return st.vEndoBuilt;
    case 'vMesoBuilt':     return st.vMesoBuilt;
    case 'vMesoFracOfEnd': return st.vMesoBuilt / consts().vMesoFull;
    case 'notoLength':     return Math.max(0, C.yNchCr - C.yTip);
    case 'notoCranialFrac': {
      const b = partBox(tt, 'notochordal_process');
      return b ? vOf(b.max.y) : 0;
    }
    /* F1, ROUND 1. THE EIGHT POINT SAMPLES THAT USED TO LIVE HERE ARE GONE, NOT RENAMED.
       mesoAtOro/mesoAtClo/mesoAtNotoMid/layersAtOro/layersAtClo/layersAtFlank/sepAtOro/sepAtClo each
       evaluated an analytic field at ONE convenient coordinate. Deleting them rather than leaving
       them beside the new ones is deliberate: claimMeasure THROWS on an unknown measure, so any beat
       or row still reaching for a point sample now fails loudly instead of passing quietly. */
    case 'mesoWorstOro':   return membraneRegionReport(tt, 'oro').worstMeso;
    case 'mesoWorstClo':   return membraneRegionReport(tt, 'clo').worstMeso;
    case 'layersMaxOro':   return membraneRegionReport(tt, 'oro').layersMax;
    case 'layersMinOro':   return membraneRegionReport(tt, 'oro').layersMin;
    case 'layersMaxClo':   return membraneRegionReport(tt, 'clo').layersMax;
    case 'layersMinClo':   return membraneRegionReport(tt, 'clo').layersMin;
    case 'membGapOro':     return membraneRegionReport(tt, 'oro').worstGap;
    case 'membGapClo':     return membraneRegionReport(tt, 'clo').worstGap;
    case 'membCoverOro':   return membraneRegionReport(tt, 'oro').coverage;
    case 'membCoverClo':   return membraneRegionReport(tt, 'clo').coverage;
    case 'membPointsOro':  return membraneRegionReport(tt, 'oro').onMemb;
    case 'membPointsClo':  return membraneRegionReport(tt, 'clo').onMemb;
    case 'contigAway':     return dorsalContiguityReport(tt).openAway;
    case 'contigNearRim':  return dorsalContiguityReport(tt).openNearRim;
    case 'contigTested':   return dorsalContiguityReport(tt).tested;
    case 'layersMinFlank': return flankRegionReport(tt).layersMin;
    case 'layersMinPara':  return paraxialRegionReport(tt).layersMin;
    case 'layersMaxPara':  return paraxialRegionReport(tt).layersMax;
    case 'paraPoints':     return paraxialRegionReport(tt).n;
    case 'layersMaxFlank': return flankRegionReport(tt).layersMax;
    case 'flankPoints':    return flankRegionReport(tt).n;
    case 'mesoWorstNotoStrip': return notoStripReport(tt).worstMeso;
    case 'mesoWorstNotoEnds':  return notoStripReport(tt).worstMesoEnds;
    case 'notoStripPoints':    return notoStripReport(tt).n;
    case 'grooveFloorH':   return dorsalH(0, (C.yCaudS + Math.min(C.yTip, C.yTip - C.nodRy)) / 2, C);
    /* the band's crest is the SHOULDER beside the groove, at |x| = GU, which is where the groove's
       own profile has just returned to zero. Measuring it further out reads the band's taper rather
       than its crest and understates the furrow by a factor of four. */
    case 'bandCrestH':     return dorsalH(GU, (C.yCaudS + Math.min(C.yTip, C.yTip - C.nodRy)) / 2, C);
    case 'grooveDepth':    return claimMeasure('bandCrestH', tt) - claimMeasure('grooveFloorH', tt);
    case 'nodeCrestH':     return dorsalH(C.pitRx * 1.25, C.yTip, C);
    case 'pitFloorH':      return dorsalH(0, C.yTip, C);
    case 'nodeRise':       return claimMeasure('nodeCrestH', tt) - H_EPI;
    case 'pitDepth':       return claimMeasure('nodeCrestH', tt) - claimMeasure('pitFloorH', tt);
    /* ONE CONTINUOUS CHANNEL, asked three ways. ARTWORK-STANDARD's coincidence rule is that the
       groove and the pit must SHARE a coordinate, because they are one channel and the first draft
       of the 2D plate drew them 49 units apart. The honest measure of that is the bbox centre,
       which is exact here (every part's min.x is the bit-exact negation of its max.x); the first
       MOMENT of the vertices is not, and the difference is worth writing down because it looked like
       a geometry fault and is not. Measured: every part's set of unique vertex positions is exactly
       mirror-symmetric in x — zero unmirrored vertices across all nine sheets — while the vertex
       first moment carries up to 9e-4 of its own scale, because a vertex's MULTIPLICITY depends on
       how many triangles share it and the wall and end-cap emission order is not itself mirrored.
       That is a triangulation detail and changes no surface, so it is pinned (row J3) rather than
       chased. */
    case 'pitXCentre':     { const b = partBox(tt, 'pit'); return b ? (b.min.x + b.max.x) / 2 : NaN; }
    case 'grooveXCentre':  { const b = partBox(tt, 'groove'); return b ? (b.min.x + b.max.x) / 2 : NaN; }
    case 'channelCentreGap': return Math.abs(claimMeasure('pitXCentre', tt) - claimMeasure('grooveXCentre', tt));
    case 'channelMeetGap': {
      const gb = partBox(tt, 'groove'), pb = partBox(tt, 'pit');
      return (gb && pb) ? Math.abs(pb.min.y - gb.max.y) : NaN;
    }
    case 'mirrorUnmatched': return mirrorUnmatched(tt, path[1]);
    case 'firstMomentResidual': {
      const g = builtGroup(tt); let sx = 0, ax = 0;
      g.traverse(o => {
        if (!o.isMesh || o.userData.outline || o.userData.key !== path[1]) return;
        const pp = o.geometry.attributes.position;
        for (let i = 0; i < pp.count; i++) { sx += pp.getX(i); ax += Math.abs(pp.getX(i)); }
      });
      return ax > 0 ? Math.abs(sx) / ax : 0;
    }
    case 'cranialWidthRatio': return halfWidth(0.75) / halfWidth(0.25);
    case 'discLength':     { const b = partBox(tt, ['epiblast']); return b ? b.max.y - b.min.y : 0; }
    case 'flowTipX':       { const b = partBox(tt, 'laterality'); return b ? b.max.x : 0; }
    case 'flowSpanX':      { const b = partBox(tt, 'laterality'); return b ? b.max.x - b.min.x : 0; }
    case 'flowAcross':     return acrossScreen([claimMeasure('flowSpanX', tt), 0, 0], path[1]);
    case 'nodeRiseAcross': return acrossScreen([0, 0, claimMeasure('nodeRise', tt)], path[1]);
    case 'grooveDepthAcross': return acrossScreen([0, 0, claimMeasure('grooveDepth', tt)], path[1]);
    case 'streakAxisAcross':  return acrossScreen([0, claimMeasure('streakLength', tt), 0], path[1]);
    case 'notoAcross':        return acrossScreen([0, claimMeasure('notoLength', tt), 0], path[1]);
    case 'teratomaCaudalGap': {
      const d = partBox(tt, ['epiblast', 'hypoblast', 'endoderm']);
      const m = partBox(tt, 'teratoma');
      return (d && m) ? (d.min.y - m.max.y) : NaN;
    }
    case 'teratomaMidlineOffset': { const m = partBox(tt, 'teratoma'); return m ? Math.abs((m.min.x + m.max.x) / 2) : NaN; }
    case 'deficitAreaFrac': {
      let a = 0, tot = 0;
      for (let j = 0; j < NV; j++) {
        const y = rowY(j), W = halfWidth(vOf(y));
        tot += 2 * W * DY; if (y < st.yDys) a += 2 * W * DY;
      }
      return tot > 0 ? a / tot : 0;
    }
    case 'streakMaxReachFrac': { const b = partBox(tt, 'streak_max'); return b ? vOf(b.max.y) : 0; }
    case 'partitionGap':      return partitionAudit(tt).gap;
    case 'partitionDouble':   return partitionAudit(tt).doubleClaim;
    case 'windingWorst':      return windingReport(tt).worst;
    case 'partPresent':       return (builtGroup(tt).userData.state.emitted[path[1]] || 0) > 0 ? 1 : 0;
    case 'droppedRuns':       return builtGroup(tt).userData.state.droppedRuns;
    case 'notoClearDorsal': {
      /* THE ROD MUST NOT TOUCH EITHER LAMINA, AT ANY STATION ALONG IT — not just at its middle.
         The first version of this measure read the mid-station only, where the clearance is at its
         most generous by construction, and it reported 0.100 while the rod's own dome caps were a
         quarter buried in the lower layer at both ends. A measure that cannot see the place a fault
         would occur is the fault RENDER-STANDARD 3.aa is about. The scan covers the caps' reach. */
      if (!(C.yNchCr > C.yTip + 0.25)) return 99;
      let worst = 99;
      const reach = R_NCH * 0.9;                 // how far a dome cap bulges past its terminal ring
      for (let i = 0; i <= 40; i++) {
        const y = (C.yTip - reach) + (C.yNchCr + reach - (C.yTip - reach)) * (i / 40);
        /* and ACROSS the rod as well as along it: the first version asked only at x = 0, which is
           the one station where a cosine pocket was deep enough */
        for (let j = 0; j <= 10; j++) {
          const x = (R_NCH * 0.995) * (j / 10);
          const half = Math.sqrt(Math.max(0, R_NCH * R_NCH - x * x));
          const sp = sepAt(x, y, st.dMeso, C);
          const zc = zBase(0, y) + (R_NCH + NCH_CLR);
          worst = Math.min(worst, (zc - half) - zBase(x, y), (zBase(x, y) + sp) - (zc + half));
        }
      }
      return worst;
    }
  }
  throw new Error('primitive-streak: unknown measure ' + name);
}

/* ══════════════════════════════════════════════════════ 9 · ACCEPTANCE
 *
 * Every row states what it asserts in words, measures it off the built geometry, and carries a
 * MAGNITUDE FLOOR wherever it compares two things (RENDER-STANDARD: "a sign test on a spatial
 * relation is not a test"). Every row also carries a deliberately wrong input it must REJECT —
 * negatives() runs them, because a test that cannot fail is not evidence.
 */

const TS = [0, 0.10, 0.18, 0.26, 0.34, 0.44, 0.52, 0.60, 0.68, 0.76, 0.86, 0.94, 1.0];

function acceptance() {
  const rows = [], m = {};
  const add = (id, must, v, pred, bad) => {
    rows.push({ id, must, value: v, pass: !!pred(v), pred, bad });
    return v;
  };

  /* A · the disc's own shape tells you which end is cranial */
  m.cranialWidthRatio = claimMeasure('cranialWidthRatio', 1);
  add('A', 'the disc is at least 15% broader at v=0.75 than at v=0.25, so the outline alone gives the axis',
      m.cranialWidthRatio, v => v >= 1.15, 1.02);

  /* B · the streak forms CAUDALLY. Floored as a fraction of the disc's own length. */
  m.earlyTipFrac = claimMeasure('streakTipFrac', 0.16);
  add('B1', 'soon after it appears the whole streak lies in the caudal 40% of the disc',
      m.earlyTipFrac, v => v > 0 && v <= 0.40, 0.62);
  m.caudFrac = claimMeasure('streakCaudFrac', 0.44);
  add('B2', "the streak's caudal end sits within the caudal 20% of the disc at every stage",
      m.caudFrac, v => v > 0 && v <= 0.20, 0.44);

  /* C · CONSERVATION — the row this model exists for */
  let worstBal = 0;
  for (const t of TS) if (t > 0.08) worstBal = Math.max(worstBal, Math.abs(claimMeasure('balance', t) - 1));
  m.worstBalanceResidual = worstBal;
  add('C', 'at every stage the volume of endoderm + mesoderm + notochordal process equals the volume delivered through the streak, to within 2%',
      worstBal, v => v <= 0.02, 0.09);

  /* D · the hypoblast is DISPLACED, not renamed */
  m.hypoFracEnd = claimMeasure('hypoFrac', 1);
  add('D1', 'by the end not one cubic micron of hypoblast is left in the lower layer',
      m.hypoFracEnd, v => v === 0, 0.05);
  let hypoMono = true, prev = 2;
  for (let i = 0; i <= 120; i++) { const h = claimMeasure('hypoFrac', i / 120); if (h > prev + 1e-9) hypoMono = false; prev = h; }
  m.hypoMonotone = hypoMono;
  add('D2', 'the hypoblast only ever shrinks — it is never re-made', hypoMono, v => v === true, false);

  /* E · it reaches the middle of the disc and stops there */
  let maxTip = 0;
  for (const t of TS) maxTip = Math.max(maxTip, claimMeasure('streakTipFrac', t));
  m.maxTipFrac = maxTip;
  add('E1', "the streak's most cranial extreme never passes 0.66 of the disc's length — it reaches the middle, not the head",
      maxTip, v => v <= 0.66, 0.80);
  m.peakTipFrac = claimMeasure('streakTipFrac', T_PEAK);
  add('E2', 'and at its peak it does reach the middle third', m.peakTipFrac, v => v >= 0.52, 0.30);

  /* F · regression */
  m.lenPeak = claimMeasure('streakLength', T_PEAK);
  m.lenEnd = claimMeasure('streakLength', 1);
  add('F', 'by the end the streak is at most 15% of the length it reached',
      m.lenEnd / m.lenPeak, v => v <= 0.15, 0.55);

  /* G · the groove is a furrow IN the thickened band, never a hole through it */
  let worstFloor = 9;
  for (const t of [0.26, 0.34, 0.44, 0.52]) worstFloor = Math.min(worstFloor, claimMeasure('grooveFloorH', t));
  m.grooveFloorH = worstFloor;
  add('G1', 'the floor of the groove is still thicker than plain epiblast — the furrow never perforates the band',
      worstFloor, v => v > H_EPI * 1.05, H_EPI * 0.8);
  m.grooveDepth = claimMeasure('grooveDepth', T_PEAK);
  add('G2', 'and the furrow is at least 25% of the band\'s own crest thickness deep, so it reads as a doorway',
      m.grooveDepth / claimMeasure('bandCrestH', T_PEAK), v => v >= 0.25, 0.04);

  /* H, I · the node stands proud and the pit is a dimple in it */
  m.nodeRise = claimMeasure('nodeRise', T_PEAK);
  add('H', 'the node stands at least 35% of plain epiblast thickness proud of plain epiblast',
      m.nodeRise / H_EPI, v => v >= 0.35, 0.05);
  m.pitDepth = claimMeasure('pitDepth', T_PEAK);
  add('I1', 'the pit is a dimple at least 30% of the node\'s own rise deep',
      m.pitDepth / m.nodeRise, v => v >= 0.30, 0.05);
  m.pitFloorH = claimMeasure('pitFloorH', T_PEAK);
  add('I2', 'but the pit floor is still thicker than plain epiblast: the pit is a dimple, not a hole',
      m.pitFloorH, v => v > H_EPI, H_EPI * 0.7);

  /* J · ONE CHANNEL. ARTWORK-STANDARD's coincidence rule, met by construction and asked three ways. */
  m.channelCentreGap = claimMeasure('channelCentreGap', T_PEAK);
  add('J1', 'the groove and the pit share the midline exactly: both centred on x = 0, to the bit',
      [claimMeasure('pitXCentre', T_PEAK), claimMeasure('grooveXCentre', T_PEAK), m.channelCentreGap],
      v => v[0] === 0 && v[1] === 0 && v[2] === 0, [0, 0.08, 0.08]);
  m.channelMeetGap = claimMeasure('channelMeetGap', T_PEAK);
  add('J2', "and they MEET: the pit's caudal rim is the groove's cranial end, within one grid row",
      m.channelMeetGap, v => v <= DY * 1.01, DY * 5);
  m.mirrorUnmatchedWorst = Math.max.apply(null, ['pit', 'groove', 'node', 'streak', 'epiblast',
    'mesoderm', 'endoderm', 'hypoblast', 'membranes'].map(k => claimMeasure('mirrorUnmatched.' + k, T_PEAK)));
  add('J3', 'and every sheet is a genuine mirror in x: not one vertex position lacks its reflection',
      m.mirrorUnmatchedWorst, v => v === 0, 3);
  m.firstMomentWorst = Math.max.apply(null, ['pit', 'node', 'membranes']
    .map(k => claimMeasure('firstMomentResidual.' + k, T_PEAK)));
  add('J4', "the triangulation's own first-moment asymmetry is pinned at under 0.1% of its scale — a multiplicity artefact, not a surface one",
      m.firstMomentWorst, v => v < 1e-3, 0.02);

  /* K, L · mesoderm everywhere except two spots, which stay two-layered */
  m.mesoCoverEnd = claimMeasure('mesoCoverFrac', 1);
  add('K1', 'by the end the mesoderm covers at least 98% of the disc outside the two membranes',
      m.mesoCoverEnd, v => v >= 0.98, 0.70);
  /* K2 … L4 ARE SAMPLED OVER THE REGION THEY ARE ABOUT, AND EVERY NUMBER IS READ OFF THE BUILT
     TRIANGLES. Round-1 finding F1: these rows used to evaluate an analytic field at the single point
     at the centre of each membrane — the one point where the old cone mask bottomed out — and so
     passed on a construction that was three-layered at every other point of both footprints. The
     rows below report the WORST point of a 27 x 27 lattice over each footprint, at the three stages a
     beat of this scene actually draws a membrane, and K5 states how much of the footprint the lattice
     reached so that "worst over the region" cannot quietly become "worst over four points". */
  const MEMB_TS = [0.44, 0.58, 1];
  m.mesoWorstOro = Math.max.apply(null, MEMB_TS.map(t => claimMeasure('mesoWorstOro', t)));
  m.mesoWorstClo = Math.max.apply(null, MEMB_TS.map(t => claimMeasure('mesoWorstClo', t)));
  add('K2', 'nowhere inside the oropharyngeal membrane\'s footprint is there any mesoderm at all — the worst point of a lattice over the whole footprint, read off the built triangles, at every stage a beat draws it',
      m.mesoWorstOro, v => v === 0, 0.05);
  add('K3', 'and nowhere inside the cloacal membrane\'s footprint either, measured the same way',
      m.mesoWorstClo, v => v === 0, 0.05);
  m.membGapWorst = Math.max.apply(null, MEMB_TS.map(t =>
    Math.max(claimMeasure('membGapOro', t), claimMeasure('membGapClo', t))));
  /* FLOORED RATHER THAN EXACT, because this one is a SUM. K2/K3 can assert exact zero honestly — there
     is no mesoderm triangle over the footprint at all, so the span is zero by absence. L1 accumulates
     signed differences of interpolated z values down each column, so the empty space inside a contact
     comes back as 1.1e-16 rather than 0.0: that is 2.5e-16 of the membrane's own 0.44 thickness, and
     writing `=== 0` here would make the row fail on arithmetic rather than on anatomy. The floor is
     eight orders of magnitude below anything a student could see and the negative case is a real 0.04
     gap, a tenth of the membrane, which it rejects. */
  add('L1', 'and the two laminae are in CONTACT across both footprints: a winding scan down every column finds no empty space inside the membrane — under 1e-9, a billionth of its own thickness',
      m.membGapWorst, v => v <= 1e-9, 0.04);
  m.layersMaxMemb = Math.max.apply(null, MEMB_TS.map(t =>
    Math.max(claimMeasure('layersMaxOro', t), claimMeasure('layersMaxClo', t))));
  m.layersMinMemb = Math.min.apply(null, MEMB_TS.map(t =>
    Math.min(claimMeasure('layersMinOro', t), claimMeasure('layersMinClo', t))));
  m.layersMinFlank = claimMeasure('layersMinFlank', 1);
  m.layersMaxFlank = claimMeasure('layersMaxFlank', 1);
  add('L2', 'exactly two laminae everywhere inside both membranes, and exactly three everywhere on the flank of the same disc at the same instant — both as worst cases over their regions, neither at a chosen point',
      [m.layersMaxMemb, m.layersMinMemb, m.layersMaxFlank, m.layersMinFlank],
      v => v[0] === 2 && v[1] === 2 && v[2] === 3 && v[3] === 3, [3, 2, 3, 3]);
  m.layersMinPara58 = claimMeasure('layersMinPara', 0.58);
  m.layersMaxPara58 = claimMeasure('layersMaxPara', 0.58);
  m.paraPoints58 = claimMeasure('paraPoints', 0.58);
  add('L3', 'and at the instant beat 7 draws — when the mesoderm has reached only 41% of its ground — the band immediately lateral to the streak is three-layered at EVERY column of it, so the beat\'s own contrast is true at its own t and not only at the end',
      [m.layersMinPara58, m.layersMaxPara58, m.paraPoints58],
      v => v[0] === 3 && v[1] === 3 && v[2] >= 300, [2, 3, 400]);
  m.membPointsWorst = Math.min.apply(null, MEMB_TS.map(t =>
    Math.min(claimMeasure('membPointsOro', t), claimMeasure('membPointsClo', t))));
  m.membCoverWorst = Math.min.apply(null, MEMB_TS.map(t =>
    Math.min(claimMeasure('membCoverOro', t), claimMeasure('membCoverClo', t))));
  m.flankPoints = claimMeasure('flankPoints', 1);
  add('K5', 'and the lattice those rows report is a region and not a handful of points: at least 300 columns land on each membrane as built, covering at least 90% of its analytic footprint, and at least 300 on the flank',
      [m.membPointsWorst, m.membCoverWorst, m.flankPoints],
      v => v[0] >= 300 && v[1] >= 0.90 && v[2] >= 300, [12, 0.9, 400]);

  /* M · NOTHING ALREADY LAID DOWN IS UN-MADE — and the thing to assert that of is the VOLUME, not
     the solved front.
     The first version of this row asserted the two FRONTS were monotone and failed, at exactly one
     place: t = 0.1067, where dMeso fell from 0.0137 to 0.0098. That is not a defect in the
     geometry, and chasing it as one would have been wrong. The streak at that stage is 0.13 units
     long — SHORTER THAN ONE QUADRATURE ROW (0.179) — so which row centres happen to fall inside its
     span changes as it grows, the volume per unit of front radius therefore rises in a step, and the
     radius needed to hold a monotone volume genuinely falls. The mesoderm at that instant is 5e-7 of
     its final volume: invisible, and no beat in the scene goes near it. So the row asserts the
     monotone thing (volume) exactly, and the front's monotonicity only where the front is larger
     than the grid that measures it. */
  let volMono = true, pve = -1, pvm = -1;
  for (let i = 0; i <= 300; i++) {
    const t = i / 300;
    const ve = claimMeasure('vEndoBuilt', t), vm2 = claimMeasure('vMesoBuilt', t);
    if (ve < pve - 1e-9 || vm2 < pvm - 1e-9) volMono = false;
    pve = ve; pvm = vm2;
  }
  m.volumesMonotone = volMono;
  add('M1', 'the built volume of endoderm and of mesoderm never decreases, at any stage',
      volMono, v => v === true, false);
  let frontMono = true, worstT = null, pe = -1, pm = -1;
  for (let i = 0; i <= 300; i++) {
    const t = i / 300, de = claimMeasure('dEndo', t), dm = claimMeasure('dMeso', t);
    if (t >= 0.15 && (de < pe - 1e-6 || dm < pm - 1e-6)) { frontMono = false; if (worstT == null) worstT = t; }
    pe = de; pm = dm;
  }
  m.frontsMonotoneAbove015 = frontMono; m.frontFirstViolation = worstT;
  add('M2', 'and both solved fronts are monotone from t = 0.15 on, which is every stage at which the front is bigger than the row that measures it',
      frontMono, v => v === true, false);
  m.mesoFracAt014 = claimMeasure('vMesoFracOfEnd', 0.14);
  add('M3', 'below that the mesoderm is under one ten-thousandth of its final volume, which is what makes the sub-row regime a measurement artefact rather than a picture',
      m.mesoFracAt014, v => v <= 1e-4, 0.02);

  /* N · WINDING, over every triangle this file emits, at four stages */
  let worstW = 1, worstK = null;
  for (const t of [0.2, 0.44, 0.7, 1.0]) {
    const r = windingReport(t);
    if (r.worst < worstW) { worstW = r.worst; worstK = r.worstKey; }
  }
  m.windingWorst = worstW; m.windingWorstKey = worstK;
  add('N', 'every triangle\'s face normal agrees with the vertex normals supplied with it (rule 1)',
      worstW, v => v >= 0.9999, 0.93);

  /* O, Q · the notochordal process */
  m.notoCranialFrac = claimMeasure('notoCranialFrac', 1);
  add('O1', 'the notochordal process stops at the prechordal plate and does not run past it',
      Math.abs(m.notoCranialFrac - V_PRE), v => v <= 0.02, 0.09);
  m.notoLength = claimMeasure('notoLength', 1);
  add('O2', 'and by the end it spans at least 60% of the disc\'s length',
      m.notoLength / DISC_L, v => v >= 0.60, 0.20);
  m.notoClear = claimMeasure('notoClearDorsal', 0.8);
  add('O3', 'the rod lies clear of both laminae by at least half the stated clearance',
      m.notoClear, v => v >= NCH_CLR * 0.5, 0.0);
  /* ROW Q WAS THE SAME FAULT AS F1 IN A SECOND PLACE, and the round-1 review did not reach it. It
     asked mesoThicknessAt(0, (yTip+yNchCr)/2) — the rod's MID-STATION, analytically, where a median
     claim is most certainly true. Sampled down the rod's whole length off the triangles it reads 0,
     but the two boundary rows read 0.72, because regionsAt() decides the mesoderm's inner edge row by
     row and the rod's ends fall between rows. That is a transition and not an overlap — 3.z measures
     the mesoderm/notochord pair at 0.009 — so the row is stated over the span inset by one quadrature
     row and Q2 pins the ends' own number rather than letting it go unmentioned. */
  m.mesoWorstNotoStrip = Math.max.apply(null, [0.58, 0.70, 0.86, 1].map(t => claimMeasure('mesoWorstNotoStrip', t)));
  m.notoStripPoints = claimMeasure('notoStripPoints', 1);
  m.mesoWorstNotoEnds = Math.max.apply(null, [0.58, 0.70, 0.86, 1].map(t => claimMeasure('mesoWorstNotoEnds', t)));
  add('Q', 'mesoderm never crosses the midline anywhere along the notochordal process — the worst point of a lattice down the rod\'s whole length, read off the built triangles, not its mid-station',
      m.mesoWorstNotoStrip, v => v === 0, 0.06);
  add('Q2', 'and that lattice is a region too: at least 300 columns down the rod',
      m.notoStripPoints, v => v >= 300, 20);
  add('Q3', 'the one-row transition at each end of the rod is DECLARED, not discovered: it is under one full mesoderm thickness plus a tolerance, and the scene\'s gaps[] carries the figure',
      m.mesoWorstNotoEnds, v => v > 0 && v <= 1.0, 1.4);

  /* P · the partition is exact, asked as two questions rather than one */
  let worstGap = 0, worstDbl = 0;
  for (const t of TS) { const a = partitionAudit(t); worstGap = Math.max(worstGap, a.gap); worstDbl = Math.max(worstDbl, a.doubleClaim); }
  m.partitionGap = worstGap; m.partitionDouble = worstDbl;
  add('P1', 'on every row the named pieces cover the disc\'s full width with no gap left over',
      worstGap, v => v < 1e-9, 0.02);
  add('P2', 'and no two different pieces ever claim the same strip of a row',
      worstDbl, v => v <= 1e-9, 0.02);
  /* P3 · AND THE SAME QUESTION ALONG THE SWEEP, which is what F3 was and what P1 and P2 cannot see.
     Both of those walk the partition ROW BY ROW; this one walks the BUILT MESH COLUMN BY COLUMN and
     asks whether the dorsal lamina is there at all. The value is [uncovered away from the membranes'
     rims, uncovered within one row of a rim, columns tested]: the first must be zero, the second is
     this run's declared remaining gap and is reported so it cannot be mislaid, the third is there so
     the row cannot pass by testing nothing — F1's lesson, that a claim about a region has to say how
     much of the region it looked at. */
  const CONTIG_TS = [0.33, 0.44, 0.70, 0.98];
  m.contigAway = Math.max.apply(null, CONTIG_TS.map(t => claimMeasure('contigAway', t)));
  m.contigNearRim = Math.max.apply(null, CONTIG_TS.map(t => claimMeasure('contigNearRim', t)));
  m.contigTested = Math.min.apply(null, CONTIG_TS.map(t => claimMeasure('contigTested', t)));
  add('P3', 'the dorsal lamina is CONTIGUOUS ALONG THE SWEEP, not only across each row: a column-by-column scan of the built triangles over the central 2.4 units of the disc finds no column without dorsal lamina, at four values of t, outside the one row either side of a membrane\'s rim and of the disc\'s own two tips, where this run\'s fix stops and whose count is reported here with it',
      [m.contigAway, m.contigNearRim, m.contigTested],
      v => v[0] === 0 && v[2] >= 1500, [8, 0, 2000]);

  /* R · cells are in transit whenever the groove is open */
  let minCells = 999;
  for (const t of [0.24, 0.32, 0.40, 0.48, 0.56]) minCells = Math.min(minCells, claimMeasure('cells', t));
  m.minCellsActive = minCells;
  add('R1', 'at least three cells are mid-ingression at every active stage', minCells, v => v >= 3, 1);
  m.cellsBelowBasal = claimMeasure('cellsBelowBasal', 0.44);
  add('R2', 'and some of them have already left the sheet — the path goes through, not along',
      m.cellsBelowBasal, v => v >= 2, 0);

  /* S · every part the model advertises is actually built at some stage in the scene's own range */
  const want = ['epiblast', 'streak', 'groove', 'node', 'pit', 'hypoblast', 'endoderm', 'mesoderm',
                'notochordal_process', 'membranes', 'ingression', 'endoderm_route', 'mesoderm_route',
                'axes', 'laterality', 'streak_max', 'teratoma', 'caudal_deficit'];
  const missing = want.filter(k => !TS.some(t => claimMeasure('partPresent.' + k, t) === 1));
  m.partsMissing = missing;
  add('S', 'every part key the model advertises is built by some stage a beat can ask for',
      missing.length, v => v === 0, 2);

  /* T, U · THE CAMERA. 3.y: a shape claim is measured on the screen plane of the beat's own camera. */
  m.nodeRiseAcrossPosterior = claimMeasure('nodeRiseAcross.posterior', T_PEAK);
  m.nodeRiseAcrossLateral = claimMeasure('nodeRiseAcross.lateral', T_PEAK);
  add('T', 'the node\'s rise is INVISIBLE from the dorsal camera and nearly whole from the lateral one — so the mound is claimed in the beat that can show it, not the beat that names it',
      [m.nodeRiseAcrossPosterior, m.nodeRiseAcrossLateral],
      v => v[0] <= 1e-6 && v[1] >= 0.95 * m.nodeRise, [m.nodeRise, m.nodeRise]);
  m.flowAcrossPosterior = claimMeasure('flowAcross.posterior', T_PEAK);
  m.flowAcrossLateral = claimMeasure('flowAcross.lateral', T_PEAK);
  add('U', 'the leftward sweep keeps its whole span on the dorsal camera\'s screen plane and none of it on the lateral one',
      [m.flowAcrossPosterior, m.flowAcrossLateral],
      v => v[0] >= 3.0 && v[1] <= 0.05, [0.1, 3.5]);

  /* X · the flow arrow points to +x. THIS PINS THE ARROW AGAINST THE DECLARATION IN THE HEADER AND
     IS NOT A PROOF OF THE DECLARATION. See the handedness warning at the top of this file. */
  m.flowTipX = claimMeasure('flowTipX', T_PEAK);
  m.flowSpanX = claimMeasure('flowSpanX', T_PEAK);
  add('X', 'the sweep terminates on the +x side by at least 35% of its own span (declared handedness, NOT proved)',
      m.flowTipX / m.flowSpanX, v => v >= 0.35, -0.40);

  /* V, W · the two clinical outcomes */
  m.teratomaCaudalGap = claimMeasure('teratomaCaudalGap', 1);
  add('V1', 'the teratoma sits clear caudal of the disc\'s own caudal margin, by at least 2% of the disc\'s length',
      m.teratomaCaudalGap / DISC_L, v => v >= 0.02, -0.05);
  m.teratomaMidlineOffset = claimMeasure('teratomaMidlineOffset', 1);
  add('V2', 'and on the midline, where a streak remnant would be', m.teratomaMidlineOffset, v => v <= 0.25, 1.4);
  m.deficitAreaFrac = claimMeasure('deficitAreaFrac', 1);
  add('W1', 'the caudal zone the deficiency marks is between a fifth and two fifths of the disc',
      m.deficitAreaFrac, v => v >= 0.18 && v <= 0.42, 0.62);
  m.mesoCoverDys = claimMeasure('mesoCoverFracDys', 1);
  add('W2', 'and with the dysgenesis variant on, the mesoderm\'s coverage falls well below its normal value',
      m.mesoCoverEnd - m.mesoCoverDys, v => v >= 0.15, 0.01);

  /* Z · no run of the sweep was silently dropped */
  let dropped = 0;
  for (const t of TS) dropped = Math.max(dropped, claimMeasure('droppedRuns', t));
  m.droppedRuns = dropped;
  add('Z', 'no region was dropped as a single-row sliver at any stage a beat uses',
      dropped, v => v <= 2, 9);

  const fails = rows.filter(r => !r.pass);
  return { pass: fails.length === 0, fails: fails.map(r => r.id), rows, measured: m };
}

/** every row's predicate, fed a deliberately wrong value it must reject */
function negatives() {
  const r = acceptance().rows, out = [];
  for (const row of r) {
    let rejected = false;
    try { rejected = !row.pred(row.bad); } catch (e) { rejected = true; }
    out.push({ id: row.id, bad: row.bad, rejected });
  }
  return { pass: out.every(o => o.rejected), rows: out };
}

/* ═══════════════════════════════════════════════════════════════ 10 · THE CONTRACT */

function build(t, opts) {
  const o = Object.assign({ routes: false, axes: false, laterality: false, streak_max: false,
                            cells: true, clinical: false, cuty: false, cutx: false,
                            dysgenesis: false }, opts || {});
  /* the two sections are PICTURES, not layers: a sectioned disc is a different drawing, and a scene
     asks for it by name. Both are therefore absent from FULL and declared in VARIANTS. */
  if (o.cuty && o.cutx) o.cutx = false;      // two cuts at once is not a figure anyone draws
  return buildGroup(clamp01(t == null ? 1 : +t), o);
}

window.MB3D_MODELS = window.MB3D_MODELS || {};
window.MB3D_MODELS['primitive-streak'] = {
  LAYERS: LAYERS,
  build: build,
  /* every optional LAYER on, so a part behind a flag is still resolvable and the provider can slice
     the group by key. The two sections and the dysgenesis variant are NOT here — each changes the
     picture rather than adding to it, and a FULL build carrying the dysgenesis flag would hand every
     beat in the scene a deliberately deficient mesoderm. */
  FULL: { routes: true, axes: true, laterality: true, streak_max: true, cells: true, clinical: true },
  VARIANTS: {
    cuty: 'the cranial half taken away, leaving a transverse face through the middle of the streak — the section a student is shown for ingression, viewed from `superior`',
    cutx: 'the left half taken away, leaving the median face — the section that shows the groove in profile, the pit, the notochordal process and the two membranes, viewed from `lateral`',
    dysgenesis: 'too little caudal mesoderm, which is caudal dysgenesis; it CHANGES the mesoderm rather than adding a layer, so it is a variant and never part of FULL',
  },
  AXES: AXES,
  axesProved: false,          // see the handedness warning in this file's header, and row X
  claimMeasure: claimMeasure,
  /* the three region reports, exposed so the proof harness can print the grid size and the worst
     point's coordinates rather than only the verdict (F1: a reader must be able to see that the
     claim was sampled over an area) */
  membraneRegionReport: membraneRegionReport,
  flankRegionReport: flankRegionReport,
  paraxialRegionReport: paraxialRegionReport,
  notoStripReport: notoStripReport,
  acceptance: acceptance,
  negatives: negatives,
  windingReport: windingReport,
  constants: function () {
    return { DISC_L, W_MAX: wMax(), H_EPI, H_VENT: hVent(), H_MESO: hMeso(), SU, GU, NOD_RX, NOD_RY,
             PIT_RX, PIT_RY, R_NCH, V_CAUD_S, V_TIP_MAX, V_PRE, V_ORO, V_CLO,
             DISC_AREA: consts().discArea, MEMB_AREA: consts().membArea,
             V_ENDO_FULL: consts().vEndoFull, V_MESO_FULL: consts().vMesoFull,
             K_DELIVERY: consts().k, NV, NS, FIRST_WAVE_FRAC };
  },
  /* THE PERTURBATION HOOK. RENDER-STANDARD: "change the constant the geometry uses and the reported
     number must move. If it does not, the test is not measuring the model." */
  _setConst: function (which, value) {
    const before = PERT[which];
    if (before === undefined) throw new Error('primitive-streak._setConst: unknown ' + which);
    PERT[which] = value;
    this._resetCaches();
    return before;
  },
  _resetCaches: function () {
    for (const k in _stateCache) delete _stateCache[k];
    for (const k in _grpCache) delete _grpCache[k];
    /* AND THE FOUR REGION CACHES. Leaving them out is how a perturbation check silently passes: row Y
       moves a constant and then reads a number that was computed before the move. */
    for (const k in _triCache) delete _triCache[k];
    for (const k in _membCache) delete _membCache[k];
    for (const k in _flankCache) delete _flankCache[k];
    for (const k in _paraCache) delete _paraCache[k];
    for (const k in _notoCache) delete _notoCache[k];
    _CONSTS = null;
  },
};

})();
