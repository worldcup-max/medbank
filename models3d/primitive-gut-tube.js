/* MedBank · models3d/primitive-gut-tube.js
 *
 * Registers MB3D_MODELS['primitive-gut-tube']: LAYERS, build(t, opts) -> THREE.Group whose meshes
 * carry userData.key, and FULL so every optional part stays resolvable through the adapter.
 *
 * THE ONE IDEA. The primitive gut is ONE endodermal tube from the buccopharyngeal membrane to the
 * cloacal membrane, and everything this scene teaches is a property of that single tube: the three
 * arterial divisions are two POINTS on it, the derivatives are segments of it, the midgut loop is an
 * excursion of its middle, and all six malformations are a named failure at a named station. So the
 * model is one centreline CL(s, t) with s the arc-length fraction from mouth to anus, and every part is
 * either a span of s or a structure positioned by one.
 *
 * WHAT IS SOLVED RATHER THAN TUNED (RENDER-STANDARD 3):
 *
 *  (a) THE HERNIATION EXTENT. The midgut herniates because it outgrows the cavity, so the amount
 *      outside the umbilical ring is not a setting: it is the EXCESS arc length, L_MG(t) - CAP(t), and
 *      the apex's distance beyond the ring is found by bisection on the condition that a loop of that
 *      excess length, leaving and re-entering through an aperture of radius R_RING, closes on itself.
 *      Arc length is conserved; the loop cannot stretch. Move the growth law or the cavity and the
 *      herniation follows. This is why the hernia is physiological and not a timetable.
 *
 *  (b) THE MESENTERIC ROOT, as a function of rotation angle. The narration asserts that 270 degrees
 *      lays the mesentery "along a broad oblique line" and that an incomplete turn leaves "a narrow
 *      base" that lets the midgut twist. Both halves of that are the SAME function evaluated at two
 *      angles, so the model computes root length R(theta) off the built attachment line and reads the
 *      normal and the malrotation case off it. The clinical point becomes a measured ratio instead of
 *      a sentence. R(270)/R(90) is reported, not chosen.
 *
 *  (c) THE VITELLINE DUCT'S CALIBRE. The duct is the residual communication between midgut and yolk
 *      sac, so its radius is the gut's own aperture at the apex station, narrowing as the tube closes
 *      — not an independently drawn thread. Its regression is therefore the same number that makes
 *      the gut a tube, which is the relationship the narration asserts.
 *
 *  (d) THE ENTERIC FRONT. Neural crest cells colonise cranio-caudally, so the colonised fraction is a
 *      monotone function of t that reaches s = 1 only at the end. Hirschsprung is that front stopping
 *      short, and "always involves the rectum, and extends proximally" is then a CONSEQUENCE of the
 *      direction of migration rather than a fact to remember. The aganglionic span is measured.
 *
 * WHAT IS PRESCRIBED, and declared in the scene's gaps[]: the rotation ANGLE schedule (only the total
 * and the order are examinable, and both are asserted); organ-level form inside each division (the
 * stomach is a fusiform dilatation, not a modelled stomach; the liver, pancreas and lung buds are
 * buds, not organs — each has its own curriculum entry); the vertebral LEVELS T12/L1/L3, which are
 * teaching conventions with no geometry in this model to anchor them to; and the cloacal partition's
 * timetable.
 *
 * AXES follow lateral-folding exactly, so prove-corpus-axes.mjs sees one convention in this corpus.
 */
(function () {

const T = window.THREE;
const K = window.VizKit;   // render-kit.js must load first — it owns winding, normals and colour

/* THE AXIS CONVENTION, MACHINE-READABLE, so a tool checks it rather than a reader. Identical to
   models3d/lateral-folding.js and models3d/body-cavity-coelom.js; prove-corpus-axes.mjs reads this
   object AND the prose in ACCEPTANCE.axes and requires the two to agree. */
const AXES = { right: '-x', left: '+x', cranial: '+y', caudal: '-y', ventral: '+z', dorsal: '-z',
               units: 'model units (this model is NOT in anatomical mm — see the scene gaps[])',
               proved_by: 'viz-training/tools/prove-corpus-axes.mjs, against BodyParts3D right/left pairs' };

/* COPIED FROM viz3d.js's VIEW_DIR TABLE, not restated, so the player's cameras and this model's own
   on-screen assertions cannot drift apart. The 0.001 on the poles is viz3d's, kept verbatim. */
const VIEW_DIR = {
  anterior: [0, 0, 1], posterior: [0, 0, -1], lateral: [1, 0, 0], medial: [-1, 0, 0],
  superior: [0, 1, 0.001], inferior: [0, -1, 0.001]
};

/* ANTICLOCKWISE IS ONLY ANTICLOCKWISE FROM THE FRONT, and the scene's own gaps[] calls getting this
   backwards "the single commonest way students learn the direction backwards". So it is derived here
   rather than asserted, and the derivation is checked in acceptance row ROT-SENSE.

   The anterior camera sits at +z looking down -z with up = +y. Screen-right is cross(up, backward) =
   (0,1,0) x (0,0,1) = (+1,0,0) = +x, which is the embryo's LEFT — correct for an anterior view, where
   the subject's left hand is on the viewer's right. Anticlockwise on that screen carries screen-right
   towards screen-up, i.e. +x towards +y, which by the right-hand rule is a POSITIVE rotation about
   +z. +z is VENTRAL, and the superior mesenteric artery runs ventrally from the aorta to the midgut
   apex, so the rotation axis is the artery itself — which is what the narration says it is. */
const ROT_AXIS = new T.Vector3(0, 0, 1);          // +z, ventral: the SMA's own direction
const ROT_SIGN = +1;                              // positive about ROT_AXIS == anticlockwise from anterior

const LAYERS = {
  foregut:      { color: 0x2874a6, name: 'Foregut' },
  midgut:       { color: 0x117864, name: 'Midgut' },
  hindgut:      { color: 0x7d3c98, name: 'Hindgut' },
  stomach:      { color: 0x3a8fc4, name: 'Stomach (fusiform dilatation)' },
  duodenum:     { color: 0x5dade2, name: 'Duodenum — spans the foregut/midgut boundary' },
  duod_lumen:   { color: 0xaed6f1, name: 'Duodenal lumen — the patent channel' },
  duod_plug:    { color: 0xf2f3f4, name: 'Proliferating epithelium — the solid-cord duodenum' },
  papilla:      { color: 0xe67e22, name: 'Major duodenal papilla (foregut/midgut boundary)' },
  watershed:    { color: 0xd35400, name: 'Transverse colon 2/3 point (midgut/hindgut boundary)' },
  caecum:       { color: 0x16a085, name: 'Caecal bud' },
  appendix:     { color: 0x0e6251, name: 'Appendix' },
  vitelline:    { color: 0xc9a227, name: 'Vitelline (omphalomesenteric) duct' },
  yolksac:      { color: 0xd8c86a, name: 'Yolk sac' },
  buccoph:      { color: 0xf4d03f, name: 'Buccopharyngeal membrane' },
  cloacalmem:   { color: 0xf5b041, name: 'Cloacal membrane' },
  cloaca:       { color: 0x8e44ad, name: 'Cloaca' },
  urorectal:    { color: 0xaf7ac5, name: 'Urorectal septum' },
  anorectal:    { color: 0x76448a, name: 'Anorectal canal' },
  urogenital:   { color: 0xc39bd3, name: 'Urogenital sinus' },
  aorta:        { color: 0x922b21, name: 'Dorsal aorta' },
  coeliac:      { color: 0xc0392b, name: 'Coeliac trunk (T12) — foregut' },
  sma:          { color: 0xe74c3c, name: 'Superior mesenteric artery (L1) — midgut' },
  ima:          { color: 0xcb4335, name: 'Inferior mesenteric artery (L3) — hindgut' },
  mesentery:    { color: 0x14a08b, name: 'Dorsal mesentery' },
  hepatic:      { color: 0x935116, name: 'Hepatic diverticulum (liver, biliary tree)' },
  panc_dorsal:  { color: 0xb9770e, name: 'Dorsal pancreatic bud' },
  panc_ventral: { color: 0xd4ac0d, name: 'Ventral pancreatic bud' },
  respir:       { color: 0x5499c7, name: 'Respiratory diverticulum (trachea, lung buds)' },
  enteric:      { color: 0x7e57c2, name: 'Enteric nervous system — neural crest colonisation' },
  bodywall:     { color: 0xaeb6bf, name: 'Ventral body wall' },
  umbring:      { color: 0x6c3483, name: 'Umbilical ring' },
};

/* ------------------------------------------------------------------- constants

   ARC-LENGTH FRACTIONS AT t = 1, and why the midgut is the big one. These are the proportions the
   divisions actually have, and the reason the midgut is the only one that herniates is that the
   small intestine is most of the length of the gut. So the fractions are not cosmetic: (a) reads the
   midgut's share directly, and if these three were equal there would be no hernia to explain. */
const S_FG = 0.200;      // foregut: buccopharyngeal membrane -> major duodenal papilla
const S_MG = 0.780;      // midgut:  papilla -> 2/3 along the transverse colon
                         // hindgut: S_MG -> 1.0, the cloacal membrane

/* The midgut APEX — where the tube still communicates with the yolk sac, and the station the
   vitelline duct hangs from. It is the midpoint of the midgut by arc length, which is what makes the
   cranial and caudal limbs of the loop comparable, and the caecal bud sits on the CAUDAL limb. */
const S_APEX   = S_FG + 0.5 * (S_MG - S_FG);
const S_CAECUM = S_FG + 0.74 * (S_MG - S_FG);    // on the caudal limb, proximal to the ascending colon

/* THE DUODENUM, as the span of s that STRADDLES the papilla — the examinable fact being that the
   foregut/midgut boundary runs through the middle of it, which is why it has a double blood supply.
   Declared here rather than beside the lumen plug (its only previous consumer) because the ROTATION
   COLLAR is now defined to BE this span: see thetaAt. */
const S_DUOD_A = S_FG - 0.035, S_DUOD_B = S_FG + 0.045;

/* THE DUODENOJEJUNAL FLEXURE: the DISTAL end of the duodenum, which is the first station carrying the
   rotation in full. Every row that reads "the DJ flexure" reads it here.

   IT USED TO BE PROBED 0.02 PAST THE PAPILLA, and that was half of finding 2 of the 2026-10-01
   review: that station is still INSIDE the duodenum, so "the papilla" and "the DJ flexure" were two
   points 0.02 apart in a span where the rotation was constant — whatever side one of them was on, the
   other was on it too, and the battery could not tell the two apart. They are the two ends of the
   duodenal C and they belong on OPPOSITE sides of the midline. */
const S_DJ = S_DUOD_B;

/* geometry of the embryo block this tube lives in */
const Y_CRANIAL = 1.60;   // y of the buccopharyngeal membrane (+y = CRANIAL)
const Y_CAUDAL  = -1.60;  // y of the cloacal membrane
const Z_DORSAL  = -0.42;  // z of the dorsal aorta (-z = DORSAL)
const Z_TUBE_0  = 0.10;   // z of the tube's mid-course at t = 0, just ventral of the notochord

/* the umbilical ring: the aperture the midgut herniates through. It is the umbilicus, so it is the
   origin of y, and every other cranio-caudal landmark below is stated relative to it. */
const Y_RING = 0.00;
const R_RING = 0.26;                       // aperture radius in the ventral body wall
const Z_WALL = 0.74;                       // z of the ventral body wall

/* THE MIDGUT IS COILED, AND THAT IS WHY y IS NOT LINEAR IN s.

   The first version of this model ran y linearly from the buccopharyngeal membrane to the cloacal
   membrane, so the midgut — 58% of the gut by ARC LENGTH — was spread over 58% of the embryo's
   cranio-caudal extent. That is false, and expensively so: it put the midgut's cranial base 0.93 units
   from the rotation axis, and a rigid 270-degree turn applied there has to be unwound over the collar,
   which gave |dC/ds| of 113 — a corkscrew kink on the duodenum. Widening the collar only spread the
   kink; row SMOOTH kept failing, correctly.

   The actual anatomy is the fix. The midgut is the small intestine and the proximal colon: most of the
   gut's LENGTH inside a small part of its cranio-caudal EXTENT, because it is coiled. Its two ends —
   the major duodenal papilla at about L1-L2 and the transverse colon's watershed in mid-abdomen — are
   both close to the superior mesenteric artery's own level, which is L1. So both limb bases sit NEAR
   the rotation axis, the turn barely moves them, and the collar has almost nothing to unwind.

   The oesophagus and the hindgut are the opposite case: little length, a lot of cranio-caudal travel.

   So the breakpoints below are anatomical levels, and the disagreement between arc length and extent
   is the point rather than an inconvenience. */
/* THE LEVELS, as a table, because the ratio of arc length to cranio-caudal travel is different in
   every segment and that ratio is what decides whether the rotation can be handed back smoothly.

   Read it as anatomy: the OESOPHAGUS spends a tenth of the gut's length crossing a third of the
   embryo, so its ratio is steep. The STOMACH AND PROXIMAL DUODENUM are compact — a tenth of the length
   over a quarter of that travel — and that gentle stretch is where the rotation collar lives, which is
   why the collar can be handed back without a kink. The MIDGUT is the extreme case in the other
   direction: 58% of the length inside half a unit of travel, because it is coiled. Then the DESCENDING
   COLON is gentle again and the SIGMOID AND RECTUM steep.

   The two caudal breakpoints exist for exactly the same reason as the two cranial ones: with the
   hindgut leaving the watershed at the sigmoid's own steep ratio, the caudal collar's lever arm reached
   0.78 and row SMOOTH measured |dC/ds| = 62 there. Giving the descending colon its own gentle segment
   brought it to 38. Both collars now sit in a gentle segment, and that is the whole trick.

   S_FG and S_MG ARE breakpoints by construction, so the two boundary stations this scene exists to
   locate are levels in this table rather than interpolated between other people's levels. */
const Y_LEVELS = [
  [0.00, +1.60],   // buccopharyngeal membrane
  [0.10, +0.55],   // cardia — the oesophagus is long and nearly all travel
  [S_FG, +0.30],   // MAJOR DUODENAL PAPILLA: stomach and proximal duodenum are compact
  [S_MG, -0.22],   // TRANSVERSE COLON WATERSHED: the midgut between them is coiled
  [0.88, -0.52],   // the descending colon, gentle again
  [1.00, -1.60],   // cloacal membrane — sigmoid and rectum, steep
];

function yAnat(s) {
  s = clamp(s, 0, 1);
  for (let i = 1; i < Y_LEVELS.length; i++) {
    if (s <= Y_LEVELS[i][0] + 1e-12) {
      const a = Y_LEVELS[i - 1], b = Y_LEVELS[i];
      return lerp(a[1], b[1], (s - a[0]) / (b[0] - a[0]));
    }
  }
  return Y_LEVELS[Y_LEVELS.length - 1][1];
}

/* HOW FAR PROUD OF ITS OWN TUBE A MARKER HAS TO STAND. Not a style number: below 1 the marker is
   inside the tube and invisible from every camera, which is what both boundary beads were. */
const BEAD_PROUD    = 1.90;
const CAECUM_PROUD  = 1.55;

/* calibre */
const R_GUT     = 0.055;   // the tube's radius over most of its course at t = 1
const R_GUT_0   = 0.045;   // at t = 0: narrower, and the lumen is not yet everywhere patent
const R_STOMACH = 0.125;   // the fusiform dilatation
const R_CLOACA  = 0.115;   // the common chamber

/* growth. The midgut grows fastest — that is the whole mechanism — and CAP is what the cavity can
   hold. Both are smooth in t so the hernia has no seam, and the CROSSING is what (a) solves for.

   THE TWO CURVES HAVE DIFFERENT SHAPES, and that is the entire content of "physiological". The gut
   grows EARLY and saturates (it has most of its length by the time it returns); the cavity grows LATE
   and overtakes. So the excess is positive only over a WINDOW in the middle, and both the opening and
   the closing are consequences of the two shapes rather than dates. Nothing below says when the
   hernia starts or ends — HERNIA_WINDOW reads both off the crossing. */
const MG_LEN_0  = 0.62;    // midgut arc length before growth begins, in model units
const MG_LEN_1  = 2.34;    // its saturated length
const GUT_T0    = 0.12;    // the midgut's growth spurt starts here
const GUT_T1    = 0.67;    // and has saturated by here
const CAP_0     = 0.70;    // the cavity can hold more than the midgut needs, at t = 0
const CAP_1     = 3.24;    // and far more by the end, after the abdomen has grown

/* the cloacal partition: the urorectal septum descends between t=P0 and t=P1 */
const P0 = 0.46, P1 = 0.82;

/* the enteric front: neural crest colonisation, cranio-caudal, complete only at the end */
const ENT_START = 0.22;    // t at which the front enters the foregut
const ENT_END   = 0.96;    // t at which it reaches s = 1

/* ------------------------------------------------------------------ small maths */

function clamp(v, a, b) { return v < a ? a : (v > b ? b : v); }
function smooth(x) { x = clamp(x, 0, 1); return x * x * (3 - 2 * x); }
/* a window in s or y: 1 in the middle, falling smoothly to 0 over `soft` at each shoulder */
function win(u, centre, half, soft) {
  const d = Math.abs(u - centre);
  if (d <= half) return 1;
  if (d >= half + soft) return 0;
  return 1 - smooth((d - half) / soft);
}
function lerp(a, b, u) { return a + (b - a) * u; }

/* ------------------------------------------------- (a) THE HERNIATION, SOLVED

   L_MG(t) is the midgut's arc length; CAP(t) is what the cavity can accommodate. The EXCESS is what
   has to go somewhere, and the only way out is the umbilical ring.

   The herniated part BULGES THROUGH THE APERTURE AS A CIRCULAR ARC. That is not a drawing choice: a
   flexible tube of fixed length, pinned at the two rim points and otherwise unconstrained, takes the
   shape of constant curvature — the same argument lateral-folding makes for its sheets ("a sheet of
   fixed arc length that closes on the midline tangentially is a circle"). So for a bulge of chord
   c = 2*R_RING and sagitta h,

       Rc  = (h^2 + (c/2)^2) / (2h)            the arc's radius
       th  = asin((c/2)/Rc), or pi - that      the half-angle; the second branch once h > c/2
       arc = 2 * Rc * th

   and the EXCESS the bulge accommodates is arc - c, which goes to ZERO as h goes to zero. That last
   property is what the first attempt at this got wrong: it modelled the bulge as two straight limbs
   plus a half-turn, whose length at h = 0 is R_RING*(2+pi) = 1.34 model units, so a hernia could not
   begin until the excess exceeded 1.34 and the window never opened at all. Acceptance row HERNIA-OPEN
   caught it before anything was rendered. A minimum that large was never physical: an arc with no
   height has no length beyond its chord.

   arcLen is monotone increasing in h, so bisection has exactly one root and no seed problem, and
   d = h is SOLVED at every t. Nothing here is a tuned amplitude.

   WHY A CLOSED FORM IS NOT USED even though this one inverts by hand: the bisection is what the
   acceptance battery perturbs. Invert it algebraically and the test can only check arithmetic it was
   given; solve it and the test can move R_RING or the growth law and require d to follow. */

/* the gut's own growth spurt: early, and saturating */
function mgLen(t) {
  return lerp(MG_LEN_0, MG_LEN_1, smooth(clamp((t - GUT_T0) / (GUT_T1 - GUT_T0), 0, 1)));
}
/* the cavity grows LATER — a convex power of t against the gut's early smoothstep — which is what
   opens the window in the middle of development and closes it again before the end. The exponent is
   the one shape parameter here and it is declared, not hidden: it sets WHEN the hernia happens, and
   HERNIA-OPEN and HERNIA-RETURN require the window to be non-empty and to close. */
const CAP_EXP = 2.2;
function capLen(t) { return lerp(CAP_0, CAP_1, Math.pow(clamp(t, 0, 1), CAP_EXP)); }
function excess(t) { return Math.max(0, mgLen(t) - capLen(t)); }

/* arc length of a circular bulge of chord c and sagitta h */
function arcOfBulge(h) {
  const c = 2 * R_RING;
  if (h <= 1e-12) return c;
  const Rc = (h * h + (c / 2) * (c / 2)) / (2 * h);
  const sn = clamp((c / 2) / Rc, -1, 1);
  const th = h > c / 2 ? Math.PI - Math.asin(sn) : Math.asin(sn);
  return 2 * Rc * th;
}
function loopLen(h) { return arcOfBulge(h); }     // kept as the name the battery perturbs

/* solve arcOfBulge(h) - c = e for h >= 0. Monotone, so bisection is exact and unconditional. */
function solveHernia(e) {
  const c = 2 * R_RING;
  if (!(e > 1e-9)) return { d: 0, iters: 0, residual: 0, herniated: false };
  let lo = 0, hi = 1e-3;
  while (arcOfBulge(hi) - c < e && hi < 1e4) hi *= 2;   // bracket outward; always closes
  let d = 0, i = 0;
  for (; i < 90; i++) {
    d = 0.5 * (lo + hi);
    if (arcOfBulge(d) - c < e) lo = d; else hi = d;
    if (hi - lo < 1e-13) break;
  }
  return { d: d, iters: i, residual: Math.abs(arcOfBulge(d) - c - e), herniated: true };
}
function herniaAt(t) { return solveHernia(excess(t)); }

/* THE WINDOW, read off the solve rather than declared: the first and last t at which anything is
   outside the ring. Computed once, at module scope, so acceptance can assert it is non-empty AND
   that it closes before t = 1 — "it returns by about week ten" is then a measured property. */
const HERNIA_WINDOW = (function () {
  const N = 2001; let first = null, last = null;
  for (let i = 0; i < N; i++) {
    const t = i / (N - 1);
    if (herniaAt(t).herniated) { if (first === null) first = t; last = t; }
  }
  return { first: first, last: last, open: first !== null,
           closes: last !== null && last < 1 - 1e-9 };
})();
/* the t of maximum herniation, for the beat that shows the loop at full extent */
const HERNIA_PEAK = (function () {
  let best = 0, bd = -1;
  for (let i = 0; i <= 2000; i++) { const t = i / 2000, d = herniaAt(t).d; if (d > bd) { bd = d; best = t; } }
  return { t: best, d: bd };
})();

/* ------------------------------------------------------ (b) ROTATION, and its consequence

   theta(t): 0 through the first 90 degrees while the loop is OUT, then a further 180 on the way back,
   total 270. The schedule is prescribed (declared above and in the scene's gaps[]); what is MEASURED
   is where it puts things, which is the examinable part. */
const ROT_TOTAL = 270 * Math.PI / 180;
function theta(t) {
  const w = HERNIA_WINDOW;
  if (!w.open) return ROT_TOTAL * smooth(t);
  const a = w.first, b = w.last;
  if (t <= a) return 0;
  if (t >= b) return ROT_TOTAL;
  /* first third of the window buys the first 90, the rest the remaining 180 — the loop turns 90 on
     the way out and 180 on the way back, which is the order the narration gives. */
  const u = (t - a) / (b - a), knee = 0.42;
  return u < knee
    ? (Math.PI / 2) * smooth(u / knee)
    : (Math.PI / 2) + Math.PI * smooth((u - knee) / (1 - knee));
}


/* =============================================================== THE CENTRELINE

   CL(s, t) for s in [0,1] from buccopharyngeal membrane (s=0, cranial) to cloacal membrane (s=1).
   One function. Every part of this model is a span of s or a structure positioned by one, which is
   what makes "it is all one tube" a property of the geometry rather than a sentence in the narration.

   The midgut is built in its OWN frame — a loop in the median plane x = 0, pushed ventrally through
   the umbilical ring by the SOLVED distance d(t) — and then RIGIDLY ROTATED about the superior
   mesenteric artery by theta(t). The adult arrangement is therefore a CONSEQUENCE of the rotation and
   not a drawing of it: nothing below places the caecum on the right or the duodenojejunal flexure on
   the left, and acceptance rows CAEC-R and DJ-L measure where the rotation actually put them. */

const PIVOT = new T.Vector3(0, Y_RING, 0);   // the SMA's line: x=0, y=Y_RING, running along +z

/* the unrotated course, in the median plane. A gentle ventral convexity, with the midgut's excess
   length taken up as a loop that leaves the ring. */
function rawPoint(s, t, out) {
  const y = yAnat(s);
  let x = 0, z = Z_TUBE_0;

  /* the whole tube drifts slightly ventrally as the body wall closes around it */
  z += 0.10 * smooth(t) * Math.sin(Math.PI * s);

  if (s < S_FG) {
    /* FOREGUT. The stomach dilatation swings to the embryo's LEFT (+x) as it grows — the rotation of
       the stomach itself is another entry's subject and is NOT modelled; this is the lateral
       displacement only, declared in the scene's gaps[]. */
    const u = s / S_FG;
    const st = win(u, 0.62, 0.10, 0.16);
    x += 0.17 * smooth(t) * st;
    z += 0.05 * smooth(t) * st;
  } else if (s <= S_MG) {
    /* MIDGUT, in the loop's own frame. u runs 0 at the papilla to 1 at the watershed, and 0.5 is the
       apex, where the vitelline duct hangs and where the ring is.

       The loop's ventral excursion is the SOLVED d(t): zero until the midgut outgrows the cavity,
       then the distance beyond the wall at which a loop of exactly the excess arc length closes. The
       profile across the window is a half-cosine so the two limbs leave the ring tangentially rather
       than at a crease — the limbs ARE the loop, not two lines with a cap drawn on. */
    const u = (s - S_FG) / (S_MG - S_FG);
    const d = herniaAt(t).d;
    const lobe = Math.sin(Math.PI * u);          // 0 at both ends, 1 at the apex
    z += (Z_WALL - Z_TUBE_0 + d) * lobe * lobe;
    /* THE TWO LIMBS SEPARATE AT THE RING AND MEET AT THE APEX, which is what a loop is. The first
       version of this line had it exactly backwards — separation MAXIMAL at the apex with the sign
       flipping there — which put a 2*sep = 0.45 unit JUMP in the middle of the midgut: the tube was
       torn in half at precisely the station the vitelline duct hangs from. Acceptance row CONT found
       it, which is why that row samples 600 stations at 21 values of t rather than eyeballing a
       render; the gap was invisible from the anterior camera because the two cut ends overlapped on
       screen.

       THE SECOND VERSION WAS ALSO WRONG, and CONT caught that too: cos(pi*u) is continuous in the
       middle but stands at +0.224 at u = 0 and -0.224 at u = 1, which tore the tube at the PAPILLA and
       at the WATERSHED instead — the two stations this scene exists to locate exactly. The separation
       must vanish at BOTH ends, where the midgut is continuous with the foregut and the hindgut in the
       median plane, and vanish again at the apex, where the two limbs meet at the turn. sin(2*pi*u) is
       zero at all three and opposite on the two limbs, which is what a loop is. Two wrong versions of
       one line, both found by the same row and neither visible in a render, is the argument for the
       row. */
    const sep = R_RING * 0.86 * Math.sin(2 * Math.PI * u);
    out = out || new T.Vector3();
    return out.set(x, y + sep, z);
  } else {
    /* HINDGUT. Descends in the median plane to the cloaca, swinging slightly dorsally as the
       urorectal septum comes down in front of it. */
    const u = (s - S_MG) / (1 - S_MG);
    z -= 0.12 * smooth(t) * smooth(u);
  }
  out = out || new T.Vector3();
  return out.set(x, y, z);
}

/* the rigid rotation, applied only to the midgut span, about the SMA */
const _rq = new T.Quaternion(), _rv = new T.Vector3();
function rotateAboutSMA(p, th) {
  _rq.setFromAxisAngle(ROT_AXIS, ROT_SIGN * th);
  _rv.copy(p).sub(PIVOT).applyQuaternion(_rq).add(PIVOT);
  return p.copy(_rv);
}

/* the rotation TAPERS OFF outside the midgut rather than stopping at a step. A rigid rotation applied
   to the midgut alone and not to its neighbours would tear the tube open at the papilla and at the
   watershed — the two stations whose exact position this scene exists to teach. So the rotation angle
   carried by a station is theta(t) across the midgut and falls to zero over a short collar on each
   side, which keeps the tube continuous THROUGH both boundaries. The collar is declared, and
   acceptance row CONT measures the largest gap between consecutive stations at every t. */
/* THE COLLAR IS THE DUODENUM, and that is not a coincidence dressed up as one. The rotation has to
   be handed back to the unrotated foregut somewhere, and anatomically that somewhere is the duodenum:
   it is the segment that takes up the transition, loses its mesentery and becomes retroperitoneal, and
   the duodenojejunal flexure is where the rotated gut begins. So the collar's width is the duodenum's
   own span rather than a number chosen to look smooth.

   The width that matters is not this number but the LEVER ARM it has to unwind, and that is fixed by
   yAnat: see the long note there, which is where the corkscrew on the duodenum was actually solved.
   With the midgut's bases close to the artery's level this collar has almost nothing left to do. */
const COLLAR = 0.09;        // the CAUDAL collar only — the cranial one is the duodenum, below

/* THE CRANIAL COLLAR IS LITERALLY [S_DUOD_A, S_DJ], AND THAT IS THIS ROUND'S FIX.

   The note above has said "THE COLLAR IS THE DUODENUM" since the first version, and the code did not
   do it: the hand-back ran over the span PROXIMAL to the papilla, so the rotation reached its full
   value AT the papilla and everything distal to it — the whole rest of the duodenum — was swung with
   the midgut. Finding 2 of the 2026-10-01 review measured the consequence on mesh vertices: the major
   duodenal papilla ended up at x = +0.271, the embryo's LEFT, level with the splenic flexure. The
   papilla lies in the second part of the duodenum and is RIGHT of the midline. A student who learns it
   from that picture loses the mark.

   The anatomy is also the fix, and it needs no new numbers. The duodenum is where the rotation is
   handed back: it loses its mesentery, becomes retroperitoneal, and THE DUODENOJEJUNAL FLEXURE IS
   WHERE THE ROTATED GUT BEGINS. So the angle a station carries is zero at and proximal to the pylorus
   (S_DUOD_A), rises across the duodenum, and is only full at the DJ flexure (S_DJ).

   WHAT THAT BUYS, and none of it is written down anywhere below — it is the rotation's consequence,
   which is the whole method of this model. A station at (x=0, y) carried through an angle phi about
   the SMA lands at x = -y*sin(phi). Across the collar phi runs 0 -> 270 degrees, so sin(phi) is
   POSITIVE over the first two thirds of the duodenum and NEGATIVE at its end: the duodenum leaves the
   pylorus on the midline, swings to the embryo's RIGHT (-x), carries the papilla near its rightmost
   extent, and crosses back to the LEFT only at the DJ flexure. That is a C open to the left with the
   pancreatic head in its concavity, which is what the duodenum is — and it is now a C because the
   rotation says so, not because an x-offset was written for it.

   The hand-back profile is smooth() rather than win(): smooth is C1 at both ends, so no kink is handed
   to the unrotated foregut. Rows CONT, REFINE and SMOOTH measure that, and the collar still sits in
   the gentle stretch of yAnat that the long note there exists to provide. */
/* rotCap: the maximum rotation this build is allowed to reach. ROT_TOTAL normally; pi/2 for the
   malrotation variant, which is how the narrow mesenteric base is produced by the model's OWN
   schedule rather than by a second set of numbers written beside it. */
function thetaAt(s, t, rotCap) {
  const th = Math.min(theta(t), rotCap == null ? ROT_TOTAL : rotCap);
  if (s >= S_DJ && s <= S_MG) return th;
  if (s < S_DJ) {
    if (s <= S_DUOD_A) return 0;
    return th * smooth((s - S_DUOD_A) / (S_DJ - S_DUOD_A));
  }
  return th * win(s, S_MG, 0, COLLAR);
}

/* CL = the rotated course, PLUS the fixation displacement once the turn has completed. Section (b2)
   below is the whole of the second term and says why it exists: the rotation alone leaves the midgut
   flat in the plane y = Y_RING, which is not a gut. fixAt() gates it, so the malrotation variant —
   where fixAt is zero for ever — keeps the unfixed arrangement, which is the point of the lesion. */
function CL(s, t, out, rotCap) {
  const p = rotPoint(s, t, out || new T.Vector3(), rotCap);
  const f = fixAt(t, rotCap);
  if (f > 1e-9) p.add(fixDisp(s, t, rotCap, _fd2).multiplyScalar(f));
  return p;
}

/* radius along the tube: the stomach dilatation, the cloaca, and the recanalization pinch */
function radiusAt(s, t) {
  const base = lerp(R_GUT_0, R_GUT, smooth(t));
  let r = base;
  /* the stomach */
  const u = s / S_FG;
  if (s < S_FG) r = lerp(base, R_STOMACH, smooth(t) * win(u, 0.62, 0.10, 0.18));
  /* the caecal bud, on the caudal limb */
  r = Math.max(r, lerp(base, base * 1.25, smooth(t) * win(s, S_CAECUM, 0.012, 0.030)));
  /* the cloaca */
  if (s > S_MG) {
    const v = (s - S_MG) / (1 - S_MG);
    r = lerp(r, R_CLOACA, smooth(t) * win(v, 0.93, 0.07, 0.22));
  }
  /* RECANALIZATION. Around t = 0.42-0.62 the proliferating epithelium plugs the duodenal lumen, so
     the tube's wall is drawn at its narrowest there and reopens after. This is a solid cord stage,
     which is why it is modelled as the LUMEN closing rather than the wall thinning — see lumenAt. */
  return r;
}

/* THE LUMEN, separately, because the examinable mechanism is that the duodenum is solid for a while
   and must reopen. lumenAt returns the inner radius as a fraction of the wall radius; it goes to 0
   across the duodenum in the plug window and comes back. Acceptance row RECAN requires it to reach 0
   and to return to patency before t = 1. */
const PLUG_T0 = 0.40, PLUG_T1 = 0.64;
/* S_DUOD_A / S_DUOD_B are declared up with the other stations now, because the ROTATION COLLAR is
   defined from them — see thetaAt. They were declared here when the duodenal span was only the
   lumen plug's business. */
function plugDepth(t) {
  if (t <= PLUG_T0 || t >= PLUG_T1) return 0;
  const u = (t - PLUG_T0) / (PLUG_T1 - PLUG_T0);
  return Math.sin(Math.PI * u);
}
/* LUMEN_OPEN WAS A LOCAL `const open = 0.55` INSIDE lumenAt UNTIL 2026-10-01, AND IT IS HOISTED
   BECAUSE THE PLUG NOW HAS GEOMETRY. Review round 3, finding 3: the solid-cord stage was narrated by
   two beats and shown by none, because the lumen existed in this model only as a NUMBER that the
   acceptance battery read — the gut was drawn as a wall and nothing else, so a student saw the same
   opaque tube whether the lumen was obliterated or patent. The plug is therefore drawn, and its
   radius is the lumen's COMPLEMENT rather than a second number: plugFrac + lumenAt === LUMEN_OPEN at
   every s and every t, BY CONSTRUCTION. That identity is deliberately NOT an acceptance row — this
   file's own ACCEPTANCE note warns that a row whose measured side cancels to a compile-time constant
   cannot fail, and this one would. What IS checked is the GEOMETRY: rows mesh/lumen-cast-inside-the-
   duodenum, mesh/plug-fills-the-cord-stage and mesh/plug-absent-once-patent in the render harness,
   which read real vertices. */
const LUMEN_OPEN = 0.55;                              // patent lumen, as a fraction of wall radius
function inDuodWin(s) {
  return win(s, 0.5 * (S_DUOD_A + S_DUOD_B), 0.5 * (S_DUOD_B - S_DUOD_A), 0.02);
}
function lumenAt(s, t) { return LUMEN_OPEN * (1 - plugDepth(t) * inDuodWin(s)); }
/* the epithelial plug, as the fraction of the wall radius the lumen is NOT: it is what fills the
   channel, so the two together always occupy exactly the inner calibre LUMEN_OPEN. */
function plugFrac(s, t) { return LUMEN_OPEN - lumenAt(s, t); }

/* ------------------------------------------------- (c) THE VITELLINE DUCT'S CALIBRE, DERIVED

   The duct is the residual communication between the midgut and the yolk sac, so its radius is the
   gut's own unclosed aperture at the apex — large at t = 0 when the midgut is still open to the sac,
   narrowing to a thread as folding completes. It is NOT an independently chosen thickness: it is
   R_GUT scaled by the aperture fraction, and the aperture fraction is what makes the gut a tube. */
const AP_0 = 1.00;     // at t = 0 the communication is as wide as the gut
const AP_1 = 0.085;    // at t = 1 a thread, which should then regress entirely
function apertureFrac(t) { return lerp(AP_0, AP_1, smooth(t)); }
function vitellineR(t) { return radiusAt(S_APEX, t) * apertureFrac(t); }

/* THE AGANGLIONIC STOP, AND A DEFECT IN HOW IT WAS REACHED. The procedural adapter's ref flags are
   BOOLEANS by design — viz3d.js says so, and says anything needing a value belongs in the model — so
   the ref "primitive-gut-tube#enteric@1+entericStop" can only ever set opts.entericStop = true. It
   reached frontAt as Math.min(f, true), which is Math.min(f, 1), which is the NORMAL front: the
   Hirschsprung ref drew the healthy gut, while this model's own VARIANTS text told the next reader
   that "opts.entericStop = 0.86 is Hirschsprung of the rectosigmoid". A scene comparing the two would
   have shown a student two identical pictures and called one of them a disease.
   Found 2026-10-01 while wiring the scene's clinical beat to the real adapter. The fix is to give the
   boolean form a declared meaning rather than to leave it meaning nothing. */
const ENTERIC_STOP_DEFAULT = 0.86;      // the rectosigmoid stop: the commonest Hirschsprung segment
function entericStopOf(v) {
  if (v === true) return ENTERIC_STOP_DEFAULT;
  return typeof v === 'number' ? v : null;
}

/* ------------------------------------------- (d) THE ENTERIC FRONT, cranio-caudal

   Neural crest cells colonise from the top down, so the front is a single monotone function of t and
   "Hirschsprung always involves the rectum and extends proximally" is a CONSEQUENCE of that direction
   rather than a fact to be remembered. frontAt(t) is the most caudal s colonised. */
function frontAt(t, stopAt) {
  const u = clamp((t - ENT_START) / (ENT_END - ENT_START), 0, 1);
  const f = smooth(u);
  return stopAt != null ? Math.min(f, stopAt) : f;
}

/* ------------------------------- (b) THE MESENTERIC ROOT — MEASURED, WITH A PRESCRIBED GATE
                                       AND THE FIRST VERSION OF THIS WAS WRONG

   WHAT I CLAIMED FIRST, AND WHY IT WAS FALSE. This section was written as a SOLVE: the root's length
   was to be a consequence of the rotation angle, so that "270 degrees gives a broad oblique base and
   90 leaves a narrow one" would be measured rather than asserted. It cannot be, and the reason is
   worth keeping in the file because it is a fact about the whole model:

     A RIGID ROTATION PRESERVES DISTANCES. The duodenojejunal flexure and the ileocaecal junction are
     two points on the loop, so the distance between them is EXACTLY the same at 90 degrees as at 270.
     Rotation about the superior mesenteric artery is a rotation about +z, and it does not change z
     either, so the gut's distance to the posterior wall — which is what fixation depends on — is also
     rotation-invariant. Neither the span of the base nor the opportunity to fuse can come out of the
     rotation angle in this parameterisation.

   My first implementation hid that behind a factor f = theta/ROT_TOTAL multiplying the whole root, so
   root length came out as exactly f times a constant and the "measured" ratio was identically 3.0 —
   a compile-time constant wearing a measurement's clothes, which is the precise fault lateral-folding's
   round-1 review found in its own battery. Acceptance row ROOT-NARROW failed and that is what sent me
   back to it; the row would have passed on a kinder floor and the defect would have shipped.

   WHAT IS ACTUALLY TRUE. The broad oblique root is the product of rotation AND FIXATION, and fixation
   is a SEPARATE event: once the loop has returned and come to rest, the ascending and descending colon
   and the duodenum are pressed against the posterior wall and their mesenteries fuse with it, leaving
   the root as the line bounding what stays free. So:

     - FIXATION IS PRESCRIBED, and gated on the rotation COMPLETING. That gate is the honest statement
       of the causal claim: an incomplete rotation does not present the segments to the wall, so
       fixation does not follow. It is declared here and in the scene's gaps[] as prescribed.
     - THE ROOT'S LENGTH IS MEASURED on the built line, at both ends of the comparison, with the
       malrotation case produced by the model's OWN variant rather than by a second set of numbers.

   So ROOT_RATIO is a real measurement of the model's geometry, and the thing it does NOT prove is the
   causal link. That distinction is the whole of what a reviewer should check here, and it is why the
   row is named ROOT-BROAD rather than ROOT-SOLVED.

   THE PEDICLE. At fix = 0 the root is not a point but the artery's own short vertical extent on the
   wall — which IS the anatomy of malrotation: a narrow pedicle the whole midgut can twist on. */
const PEDICLE = 0.20;                                   // the unfixed root's extent, in model units
const O_ROOT = new T.Vector3(0, Y_RING, Z_DORSAL + 0.02);

/* the fixation fraction. 0 until the rotation has completed, then rising over what is left of t. */
function fixAt(t, rotCap) {
  const cap = rotCap == null ? ROT_TOTAL : rotCap;
  if (cap < ROT_TOTAL - 1e-9) return 0;                 // an incomplete turn never fixes
  const done = T_ROT270;
  if (t <= done) return 0;
  return smooth((t - done) / Math.max(1e-6, 1 - done));
}

/* ------------------------- (b2) COLONIC ELONGATION AND FIXATION — WHY THE TURN IS NOT THE END

   THE DEFECT THIS SECTION EXISTS TO FIX, recorded because the picture was wrong while every number
   was green. A rigid rotation about +z does not change z, and the midgut leaves rawPoint as a loop in
   the median plane x = 0 whose only spread is in y. So the turn MAPS THE LEVEL ONTO THE SIDE: after
   the full 270 degrees the entire midgut lies in the plane y = Y_RING. Measured on the centreline at
   t = 1, its y extent was 1.4e-16 against an x extent of 0.738 — a flat pinwheel. The chirality was
   right and measured, and the acceptance battery, the winding, the normals and the open-lumen probe
   were all green on it, because not one of them asked whether the thing had the SHAPE of a gut.
   RENDER-STANDARD's fourth check — it looks like the thing — is what found it.

   WHAT THE ROTATION IS FOR, AND WHAT IT IS NOT FOR. The turn decides which SIDE each segment ends up
   on: that is the examinable consequence and rows CAEC-R and DJ-L measure it. The anatomical LEVEL of
   a station is yAnat's job. The defect is that the rotation overwrote the second with the first. So
   fixation restores the level while KEEPING the side the rotation earned: the caecum's x is the
   rotation's own consequence, read off the rotated course and not written down here.

   AND FIXATION IS NOT AN ISOMETRY, which is the thing I got wrong first. I built this section as an
   arc-length-preserving map — the tube has the length it has, fixation only re-routes it — and solved
   the frame's width by bisection on `perimeter = colon arc length`. It has no root. This model's
   colon measures 1.313 units between the ileocaecal junction and the sigmoid, and the shortest frame
   that reaches around the cavity is 2.29, so the solve drove the gutters to their lower bound and the
   frame collapsed onto the midline. The section's own title is the answer: this is COLONIC
   ELONGATION. The colon does not keep its length through this period, it roughly doubles. So the
   frame's perimeter is NOT constrained to the colon's arc, and the ratio between them is a
   MEASUREMENT — row COLON-ELONGATES asserts it exceeds 1, i.e. that the colon lengthens rather than
   being asked to shrink onto the frame, and reports the factor (about 1.75 at t = 1).

   WHAT IS STILL SOLVED, and it is the one that carries a teaching claim. The small bowel does NOT
   elongate onto its course — it is already far too long for the straight line between the
   duodenojejunal flexure and the ileocaecal junction, and that is WHY it coils. So its coil amplitude
   is solved by bisection on `coiled arc length = the small bowel's own arc length`. A longer small
   bowel gives a tighter, deeper coil, and no amplitude is written down.

   WHAT IS PRESCRIBED AND SAYS SO: the transverse colon's level, the depth at which the colon lies
   against the wall and the depth of the jejunoileal mass ventral to it, the number of coils, and the
   statement that the two paracolic gutters are SYMMETRIC about the midline — which is what makes the
   left gutter's position follow from the caecum's rather than being a second number. Each is declared
   in the scene's gaps[].

   THE GATE IS THE ONE FIXATION ALREADY HAD. fixAt() is zero until the turn completes and zero for
   ever in the malrotation variant, so the malrotation build keeps the unfixed arrangement — which is
   the honest form of the clinical claim: an incomplete turn never presents the segments to the wall,
   so none of this follows. The cost is that ROT-RIGID can no longer be read at t = 1, because
   fixation is not a rigid motion; it is read at T_ROT270, where fixation is exactly zero. That is the
   truer form of the same statement, which is why the row was rewritten rather than deleted. */

const S_DESC = 0.88;      // a Y_LEVELS breakpoint already: the end of the descending colon
const S_SIG  = 0.945;     // by here the sigmoid has returned to the midline

/* PRESCRIBED, and declared in the scene's gaps[]. Note what is NOT here: no gutter width and no
   caecal level. Both are read off the rotated course, because both are the turn's own consequence. */
const Y_TRANS  = +0.16;   // the transverse colon's level, between the papilla and the umbilical ring
/* THE CAECAL LEVEL IS PRESCRIBED, and it has to be, for a reason worth stating. The caecum's SIDE is
   the turn's consequence and is read off the rotated course below. Its LEVEL is not: the descent of
   the caecum from its subhepatic position into the right iliac fossa is a separate event after the
   return, and this model does not carry it. The first version of this frame tried to take the level
   from yAnat(S_CAECUM) and that is wrong twice over — yAnat there is -0.085, far too cranial for an
   iliac fossa, and the caecum's RAW y offset (-0.308, yAnat plus the loop's limb separation) is
   EXACTLY the number the rotation turns into its x, so using it as the level too would have been one
   measurement doing duty as two. */
const Y_ILIAC  = -0.52;   // where the caecum comes to rest. PRESCRIBED: the caecal descent
const Z_COLON  = -0.06;   // the colon lies against the posterior wall, dorsal of the small bowel
const Z_SB     = +0.10;   // and the jejunoileal mass is ventral to it
const SB_TURNS = 3.0;     // the number of jejunoileal coils
const DJ_FRAC  = 0.88;    // the duodenojejunal flexure, just medial to the splenic flexure
const DJ_DROP  = 0.10;    // and a little caudal of it

/* THE HEAD OF THE PANCREAS, as a radius, because TWO things read it and they must not drift apart:
   the dorsal pancreatic bud is drawn with it, and the duodenal C's depth is derived from it below.
   It was a literal in the bud call only. */
const R_PANC_HEAD = 0.044;
const SB_DEPTH = 0.62;    // the coil's depth as a fraction of its width: a coil, not a flat zigzag

/* the rotated-but-unfixed course: everything up to the end of the turn. CL used to BE this. */
function rotPoint(s, t, out, rotCap) {
  const p = rawPoint(s, t, out || new T.Vector3());
  const th = thetaAt(s, t, rotCap);
  if (Math.abs(th) > 1e-9) rotateAboutSMA(p, th);
  return p;
}

/* cumulative arc length along the tube, as a table, so a station's arc FRACTION is read off the
   geometry rather than assumed proportional to s — s is not arc length anywhere in this model, and
   assuming it was is how the midgut got spread over the whole embryo in version one.

   MEASURED ON rawPoint, NOT ON THE ROTATED COURSE, and the difference is not a detail. The rotation
   is rigid across the midgut but the COLLAR is a differential rotation — a shear — and a sheared
   curve is longer than the one it came from. Measured on the rotated course the hindgut span came out
   2.33 units against a straight-line distance of 0.89, nearly all of it the collar unwinding, and a
   frame parameterised by that put the transverse colon's watershed down on the ASCENDING limb. The
   tube's own length is a property of the tube, and that is what rawPoint measures. */
function arcTable(a, b, t, n) {
  n = n || 220;
  const ss = new Float64Array(n + 1), cum = new Float64Array(n + 1);
  const p = rawPoint(a, t, new T.Vector3()), q = new T.Vector3();
  ss[0] = a; cum[0] = 0;
  for (let i = 1; i <= n; i++) {
    const s = a + (b - a) * (i / n);
    rawPoint(s, t, q);
    cum[i] = cum[i - 1] + p.distanceTo(q);
    ss[i] = s; p.copy(q);
  }
  return { ss: ss, cum: cum, total: cum[n], n: n };
}
/* absolute cumulative arc at station s, and its inverse */
function arcAt(tab, s) {
  const n = tab.n, a = tab.ss[0], b = tab.ss[n];
  if (s <= a) return 0;
  if (s >= b) return tab.total;
  let i = Math.floor((s - a) / (b - a) * n);
  if (i < 0) i = 0; if (i > n - 1) i = n - 1;
  const u = (s - tab.ss[i]) / Math.max(1e-15, tab.ss[i + 1] - tab.ss[i]);
  return lerp(tab.cum[i], tab.cum[i + 1], u);
}
function stationAtArc(tab, L) {
  const n = tab.n;
  if (L <= 0) return tab.ss[0];
  if (L >= tab.total) return tab.ss[n];
  let lo = 0, hi = n;
  while (hi - lo > 1) { const mid = (lo + hi) >> 1; if (tab.cum[mid] <= L) lo = mid; else hi = mid; }
  const u = (L - tab.cum[lo]) / Math.max(1e-15, tab.cum[lo + 1] - tab.cum[lo]);
  return lerp(tab.ss[lo], tab.ss[lo + 1], u);
}
function arcFrac(tab, s) {
  if (tab.total <= 1e-12) return 0;
  const n = tab.n, a = tab.ss[0], b = tab.ss[n];
  if (s <= a) return 0;
  if (s >= b) return 1;
  let i = Math.floor((s - a) / (b - a) * n);
  if (i < 0) i = 0; if (i > n - 1) i = n - 1;
  const u = (s - tab.ss[i]) / Math.max(1e-15, tab.ss[i + 1] - tab.ss[i]);
  return lerp(tab.cum[i], tab.cum[i + 1], u) / tab.total;
}

/* ---- WHERE THE TWO COLONIC FLEXURES ARE, SOLVED RATHER THAN PRESCRIBED.

   The first version of this map walked the whole colon onto the frame at ONE uniform stretch, so
   each limb got the share of frame its own share of arc bought it. That is a defensible map and it
   puts the midgut/hindgut watershed in the wrong place: measured, it landed 0.415 of the way across
   the transverse limb, and when the frame was enlarged to abdominal proportions it slid to 0.246.
   The watershed is the single most examinable station in this scene — it is WHY the transverse colon
   has two blood supplies — and this model names it "2/3 along the transverse colon" in its own layer
   table. A boundary drawn a quarter of the way across is a defect, not a roundable difference.

   The cause is that the frame's limb lengths come from the cavity and the tube's limb arcs come from
   the s-table, and nothing was reconciling them. So reconcile them: let each limb have its OWN
   stretch, which is anatomically the truer statement anyway — the transverse colon is the mobile
   mesenteric segment and does not elongate at the same rate as the retroperitoneal ascending and
   descending colon. Then the two flexure stations follow from two conditions:

     (i)  the watershed lies 2/3 along the TRANSVERSE limb by arc length, and
     (ii) the ascending and descending limbs carry EQUAL arc.

   With A_tot the colon's arc from the ileocaecal junction to the foot of the descending colon and
   A_ws the arc to the watershed, those give the ascending arc in closed form:

       a = 2*A_tot - 3*A_ws        m (the transverse arc) = 6*A_ws - 3*A_tot

   and the flexure STATIONS are then read off the arc table by inversion. Both must come out
   positive, and that is NOT a formality: a > 0 requires A_ws < (2/3)A_tot and m > 0 requires
   A_ws > A_tot/2, so the s-table has to allot the caecum-to-watershed stretch between a half and
   two-thirds of the colon for a transverse limb bounded by two flexures to exist at all. It allots
   0.413 of 0.724 — 57%, inside the window with room on both sides. Row COLON-LIMBS-FEASIBLE asserts
   it, and that row IS independent of the construction: it asks whether the s-table and the 2/3
   convention can both be true, and it would fail on an s-table that could not support them.

   WHAT IS AND IS NOT PROVED BY THIS. Row WATERSHED-ON-TRANSVERSE now measures where the watershed
   lands on the BUILT line, and it lands at 2/3 BY CONSTRUCTION, so that row checks the construction
   and not the anatomy. It is kept because a mapping bug is exactly the kind of thing it catches, and
   its `why` says plainly that the 2/3 itself is an input, declared in the scene's gaps[]. */
function colonLimbs(t) {
  const tab = arcTable(S_CAECUM, S_SIG, t, 320);
  const Atot = arcAt(tab, S_DESC);
  const Aws  = arcAt(tab, S_MG);
  const a = 2 * Atot - 3 * Aws;          // the ascending limb's arc
  const m = 6 * Aws - 3 * Atot;          // the transverse limb's arc
  const feasible = a > 1e-6 && m > 1e-6 && (a + m) < Atot + 1e-9;
  return { tab: tab, Atot: Atot, Aws: Aws, a: a, m: m, feasible: feasible,
           sHep: stationAtArc(tab, a), sSpl: stationAtArc(tab, a + m),
           wsFracOfColon: Aws / Math.max(1e-9, Atot) };
}

/* ---- THE COLONIC FRAME. Its right limb stands where the rotation put the caecum; its left limb
       mirrors it, because the two paracolic gutters are symmetric about the midline. Its top is the
       transverse colon's prescribed level and its foot is where yAnat already has the descending
       colon ending, so the frame cannot drift away from the levels the rest of the model uses. */
function framePoints(t, rotCap) {
  const xR = rotPoint(S_CAECUM, t, new T.Vector3(), rotCap).x;   // EARNED: the turn put it there
  const xL = -xR;                                                // the gutters are symmetric
  const sig = rawPoint(S_SIG, t, new T.Vector3());               // unrotated: the collar has expired
  return [
    new T.Vector3(xR, Y_ILIAC,         Z_COLON),   // caecum, in the right iliac fossa
    new T.Vector3(xR, Y_TRANS,         Z_COLON),   // hepatic flexure
    new T.Vector3(xL, Y_TRANS,         Z_COLON),   // splenic flexure
    new T.Vector3(xL, yAnat(S_DESC),   Z_COLON),   // the descending colon's foot
    sig,                                           // the sigmoid, back on the midline
  ];
}
function polyLen(pts) {
  let L = 0; for (let i = 1; i < pts.length; i++) L += pts[i - 1].distanceTo(pts[i]);
  return L;
}
/* walk a polyline by arc-length fraction */
function alongPoly(pts, f, out) {
  out = out || new T.Vector3();
  const L = polyLen(pts);
  if (L <= 1e-12) return out.copy(pts[0]);
  let want = clamp(f, 0, 1) * L;
  for (let i = 1; i < pts.length; i++) {
    const d = pts[i - 1].distanceTo(pts[i]);
    if (want <= d || i === pts.length - 1) {
      return out.copy(pts[i - 1]).lerp(pts[i], d > 1e-12 ? clamp(want / d, 0, 1) : 0);
    }
    want -= d;
  }
  return out.copy(pts[pts.length - 1]);
}

/* ---- THE JEJUNOILEAL COIL, whose amplitude IS solved: the small bowel is far longer than the line
       between its two ends, and the coil is what absorbs the difference. Monotone increasing in A,
       so bisection has exactly one root and no seed problem — the same shape as the hernia solve. */
function djPoint(xL, out) {
  return (out || new T.Vector3()).set(DJ_FRAC * xL, Y_TRANS - DJ_DROP, Z_SB);
}

/* ---- THE DUODENAL C, AND WHY IT HAS TO BE FIXATION'S BUSINESS RATHER THAN THE ROTATION'S.

   FINDING 2 OF THE 2026-10-01 REVIEW, at its root. fixTarget used to hand EVERY station from the
   papilla to the caecum to sbPoint — the jejunoileal coil — so the small bowel's parameterisation
   began at the papilla and its first point, which is pinned to the duodenojejunal flexure beside the
   SPLENIC FLEXURE, was where the papilla got put. That is how the papilla came to be measured at
   x = +0.271, the embryo's LEFT, level with the splenic flexure: not a collar unwinding too far, as
   the old gap 6 guessed, but the coil claiming the duodenum. The duodenum is not part of the coiled
   mass — it loses its mesentery and goes retroperitoneal — so it needs its own target, and the small
   bowel's own span starts where it actually starts, at S_DJ.

   THE DEPTH OF THE C IS DERIVED, not chosen. The descending duodenum lies against the HEAD OF THE
   PANCREAS, which this model builds as a bud on the midline; so the duodenum's centreline clears the
   head by the head's own radius plus its own. Change R_PANC_HEAD and this moves, which is the test
   for whether a number is a measurement or a decoration.

   THE LEVEL OF THE INFERIOR PART IS ALSO DERIVED, and from the structure that makes it examinable:
   THE SUPERIOR MESENTERIC ARTERY CROSSES THE THIRD PART OF THE DUODENUM. The artery is at Y_RING in
   this model, so that is the level the C turns at. (It is why SMA syndrome compresses D3 and nothing
   else, and it is the reason the number is not free to be chosen.)

   The curve is a quadratic Bezier whose control point is placed so the curve PASSES THROUGH that
   station at its own midpoint — C = 2*D2 - (P0+P2)/2 — rather than merely being pulled towards it, so
   "the C reaches one pancreatic head right of the midline" is true of the drawn curve and not only of
   a control point. P0 is the UNFIXED pylorus, so fixation's displacement vanishes at S_DUOD_A by
   construction, exactly as it already vanished at S_SIG where the frame's last point is the unrotated
   sigmoid. That symmetry is why the cranial taper this function used to carry is gone. */
function duodStations(t, rotCap, dj, vPap) {
  const P0 = rotPoint(S_DUOD_A, t, new T.Vector3(), rotCap);     // the pylorus, where fixation is nil
  const D2 = new T.Vector3(-(R_PANC_HEAD + radiusAt(S_FG, t)),   // RIGHT of the midline: -x
                           Y_RING,                               // the level the SMA crosses D3
                           Z_COLON);                             // retroperitoneal, on the back wall
  const P2 = dj.clone();
  /* THE CURVE PASSES THROUGH D2 AT THE PAPILLA'S OWN ARC FRACTION, which is the anatomical statement
     rather than a convenience: the major duodenal papilla lies in the MIDDLE OF THE SECOND PART, and
     the middle of the second part is the most lateral point of the C. Putting the pass-through at the
     curve's midpoint instead left the papilla past the turn and only 0.057 right of the midline — true
     but by a whisker, and for no reason anyone could state.
     Solved rather than written: C is whatever makes B(u) = D2, and u is moved until the point at
     Bezier parameter u is also the point at ARC fraction vPap, since arc length is how the station is
     read back. Six iterations of a monotone correction; the residual is reported in fixSolve. */
  let u = clamp(vPap == null ? 0.5 : vPap, 0.12, 0.88), C = null, resid = 1;
  const ctrlFor = uu => {
    const w = 1 - uu;
    return D2.clone()
      .addScaledVector(P0, -(w * w))
      .addScaledVector(P2, -(uu * uu))
      .multiplyScalar(1 / Math.max(1e-9, 2 * uu * w));
  };
  const bez = (uu, cc) => { const w = 1 - uu; return new T.Vector3()
      .addScaledVector(P0, w * w).addScaledVector(cc, 2 * uu * w).addScaledVector(P2, uu * uu); };
  for (let it = 0; it < 6; it++) {
    C = ctrlFor(u);
    /* arc fraction of B(u) along the curve, by sampling */
    let L = 0, Lu = 0; const q0 = bez(0, C); let prev = q0;
    const NS = 160;
    for (let i = 1; i <= NS; i++) {
      const uu = i / NS, q = bez(uu, C), d = prev.distanceTo(q);
      L += d; if (uu <= u) Lu = L; prev = q;
    }
    const f = L > 1e-12 ? Lu / L : u;
    resid = Math.abs(f - (vPap == null ? 0.5 : vPap));
    if (resid < 1e-6) break;
    u = clamp(u + ((vPap == null ? 0.5 : vPap) - f), 0.05, 0.95);
  }
  /* SAMPLED INTO A POLYLINE AND WALKED BY ARC LENGTH, not evaluated at the Bezier's own parameter,
     and that was worth a failing row to learn. A quadratic Bezier's speed is 2|C-P0| at its start and
     2|P2-C| at its end, and this control point is thrown well clear of the curve to make it pass
     through D2 — so reading it at u = (the tube's arc fraction) gave the duodenum a start speed of
     1.5 units per unit u where its neighbours run at 10 per unit s. Row SMOOTH measured |dC/ds| = 64
     against a ceiling of 48, all of it in the first 0.001 of s at S_DUOD_A. Walking the sampled
     polyline by arc-length fraction makes the speed uniform along the C, which is what the tube's own
     parameterisation does everywhere else. */
  const n = 96, pts = [];
  for (let i = 0; i <= n; i++) {
    const u = i / n, w = 1 - u;
    pts.push(new T.Vector3()
      .addScaledVector(P0, w * w)
      .addScaledVector(C, 2 * u * w)
      .addScaledVector(P2, u * u));
  }
  return { P0: P0, D2: D2, P2: P2, C: C, pts: pts, len: polyLen(pts),
           uPap: u, papResid: resid };
}
function duodPoint(v, st, out) { return alongPoly(st.pts, v, out); }
function sbPoint(v, A, dj, ic, out) {
  out = out || new T.Vector3();
  out.copy(dj).lerp(ic, clamp(v, 0, 1));
  const env = Math.sin(Math.PI * clamp(v, 0, 1));        // zero at both ends: the ends are pinned
  const ph  = 2 * Math.PI * SB_TURNS * v;
  out.x += A * env * Math.sin(ph);
  out.z += A * SB_DEPTH * env * Math.cos(ph);
  return out;
}
function sbLen(A, dj, ic, n) {
  n = n || 480;
  let L = 0; const p = sbPoint(0, A, dj, ic, new T.Vector3()), q = new T.Vector3();
  for (let i = 1; i <= n; i++) { sbPoint(i / n, A, dj, ic, q); L += p.distanceTo(q); p.copy(q); }
  return L;
}
function solveCoil(Lsb, dj, ic) {
  let lo = 0, hi = 0.02, A = 0, i = 0;
  if (sbLen(0, dj, ic) >= Lsb) return { A: 0, iters: 0, residual: 0, slack: false };
  while (sbLen(hi, dj, ic) < Lsb && hi < 10) hi *= 2;    // bracket outward; always closes
  for (; i < 90; i++) {
    A = 0.5 * (lo + hi);
    if (sbLen(A, dj, ic) < Lsb) lo = A; else hi = A;
    if (hi - lo < 1e-14) break;
  }
  return { A: A, iters: i, residual: Math.abs(sbLen(A, dj, ic) - Lsb), slack: true };
}

/* the whole arrangement, solved once per (t, rotCap) and cached — CL is called several hundred
   thousand times by the continuity row alone, so this cannot be solved per station. */
const _fixCache = new Map();
function fixSolve(t, rotCap) {
  const cap = rotCap == null ? ROT_TOTAL : rotCap;
  const key = t.toFixed(7) + ':' + cap.toFixed(7);
  let e = _fixCache.get(key);
  if (e) return e;
  if (_fixCache.size > 96) _fixCache.clear();
  const lb = colonLimbs(t);
  const colonTab = lb.tab;
  const sbTab    = arcTable(S_DJ, S_CAECUM, t, 220);   // the SMALL BOWEL, which begins at the DJ flexure
  const duodTab  = arcTable(S_DUOD_A, S_DJ, t, 120);   // and the duodenum, which has its own course
  const pts = framePoints(t, cap);
  const perim = polyLen(pts);
  /* the four colonic segments, each mapped onto its own frame limb at its own stretch */
  const segs = [
    { a0: 0,            a1: lb.a,            p0: pts[0], p1: pts[1] },   // ascending
    { a0: lb.a,         a1: lb.a + lb.m,     p0: pts[1], p1: pts[2] },   // transverse
    { a0: lb.a + lb.m,  a1: lb.Atot,         p0: pts[2], p1: pts[3] },   // descending
    { a0: lb.Atot,      a1: colonTab.total,  p0: pts[3], p1: pts[4] },   // sigmoid
  ];
  for (const g of segs) g.stretch = g.p0.distanceTo(g.p1) / Math.max(1e-9, g.a1 - g.a0);
  const dj = djPoint(pts[2].x);
  const ic = pts[0].clone();
  const co = solveCoil(sbTab.total, dj, ic);
  const duod = duodStations(t, cap, dj, arcFrac(duodTab, S_FG));
  e = { pts: pts, perim: perim, dj: dj, ic: ic, coil: co, limbs: lb, segs: segs,
        colonTab: colonTab, sbTab: sbTab, duodTab: duodTab, duod: duod,
        Lcolon: colonTab.total, Lsb: sbTab.total,
        elong: perim / Math.max(1e-9, colonTab.total),
        xR: pts[0].x, xL: pts[2].x };
  _fixCache.set(key, e);
  return e;
}

/* where station s is carried to, once fixation is complete */
function fixTarget(s, t, rotCap, out) {
  out = out || new T.Vector3();
  const e = fixSolve(t, rotCap);
  /* the duodenum first: its own C, and the papilla rides it at its own arc fraction */
  if (s <= S_DJ) return duodPoint(arcFrac(e.duodTab, s), e.duod, out);
  if (s <= S_CAECUM) return sbPoint(arcFrac(e.sbTab, s), e.coil.A, e.dj, e.ic, out);
  const L = arcAt(e.colonTab, s);
  const segs = e.segs;
  for (let i = 0; i < segs.length; i++) {
    const g = segs[i];
    if (L <= g.a1 || i === segs.length - 1) {
      const u = clamp((L - g.a0) / Math.max(1e-12, g.a1 - g.a0), 0, 1);
      return out.copy(g.p0).lerp(g.p1, u);
    }
  }
  return out.copy(e.pts[e.pts.length - 1]);
}

/* the displacement fixation adds. IT NEEDS NO TAPER AT EITHER END ANY MORE: the frame's first point
   is the unfixed pylorus and its last is the unrotated sigmoid, so the displacement is zero at
   S_DUOD_A and at S_SIG by construction rather than by a window. The cranial taper this function used
   to carry existed because fixation's first target was the DJ flexure standing in for the papilla —
   the defect finding 2 identified — and a displacement that large had to be faded in from somewhere. */
const _fd1 = new T.Vector3(), _fd2 = new T.Vector3();
function fixDisp(s, t, rotCap, out) {
  out = (out || new T.Vector3()).set(0, 0, 0);
  if (s > S_SIG || s < S_DUOD_A) return out;
  fixTarget(s, t, rotCap, out);
  return out.sub(rotPoint(s, t, _fd1, rotCap));
}

/* the station at which the midgut/hindgut watershed lands on the frame, as a fraction ACROSS the
   transverse limb measured from the hepatic flexure. Nothing places it: it falls where its own arc
   fraction puts it, and row WATERSHED-ON-TRANSVERSE asks whether that is on the transverse limb at
   all. The number it comes out at is reported rather than asserted — see the note in measure(). */
function watershedOnTransverse(t, rotCap) {
  const e = fixSolve(t, rotCap);
  const P1 = e.pts[1], P2 = e.pts[2];                    // hepatic and splenic flexures
  const w = fixTarget(S_MG, t, rotCap, new T.Vector3()); // where the BUILT line puts it
  const span = new T.Vector3().subVectors(P2, P1);
  const len = span.length();
  const across = len > 1e-9 ? new T.Vector3().subVectors(w, P1).dot(span) / (len * len) : 0;
  const perp = new T.Vector3().subVectors(w, P1).addScaledVector(span, -across).length();
  return { across: across, offLimb: perp, onTransverse: across > 0 && across < 1 && perp < 1e-6,
           hep: e.limbs.sHep, spl: e.limbs.sSpl, feasible: e.limbs.feasible,
           ascArc: e.limbs.a, transArc: e.limbs.m, totArc: e.limbs.Atot };
}

function rootPoint(s, t, out, rotCap) {
  out = out || new T.Vector3();
  const g = CL(s, t, new T.Vector3(), rotCap);
  const f = fixAt(t, rotCap);
  const u = (s - S_FG) / (S_MG - S_FG) - 0.5;           // -0.5 .. +0.5 across the midgut
  const pedY = O_ROOT.y + PEDICLE * u;
  out.set(lerp(O_ROOT.x, g.x, f), lerp(pedY, g.y, f), O_ROOT.z);
  return out;
}

/* root length over the midgut span. Sampled on the built line, not derived. */
function rootLength(t, rotCap, n) {
  n = n || 240;
  let L = 0; const a = new T.Vector3(), b = new T.Vector3();
  for (let i = 0; i < n; i++) {
    const s0 = S_FG + (S_MG - S_FG) * (i / n), s1 = S_FG + (S_MG - S_FG) * ((i + 1) / n);
    rootPoint(s0, t, a, rotCap); rootPoint(s1, t, b, rotCap);
    L += a.distanceTo(b);
  }
  return L;
}

/* the t at which the rotation is 90 degrees and at which it completes — read off theta(t), so the
   malrotation comparison uses the model's own schedule rather than a second copy of it. */
function tAtTheta(target) {
  let lo = 0, hi = 1;
  for (let i = 0; i < 70; i++) { const m = 0.5 * (lo + hi); if (theta(m) < target) lo = m; else hi = m; }
  return 0.5 * (lo + hi);
}
const T_ROT90  = tAtTheta(Math.PI / 2);
const T_ROT270 = tAtTheta(ROT_TOTAL - 1e-6);
const ROT_CAP_MALROT = Math.PI / 2;                     // the malrotation variant: 90 degrees only

/* THE NUMBER THE CLINICAL BEAT RESTS ON. Both ends are rootLength on the built line, at t = 1: the
   normal case with the full turn and fixation, and the malrotation variant produced by the model's own
   rotation cap. Neither side is a constant in the source. */
const ROOT_NORMAL = rootLength(1, ROT_TOTAL);
const ROOT_MALROT = rootLength(1, ROT_CAP_MALROT);
const ROOT_RATIO  = ROOT_NORMAL / Math.max(1e-9, ROOT_MALROT);

/* ================================================================== primitives

   A THIN CLOSED SLAB between two polylines — the dorsal mesentery, the urorectal septum, the two
   terminal membranes and the body wall are all this shape. It is closed (both faces plus the four
   rims) so the normals probe reads it as a solid, and the face order is decided FROM THE GEOMETRY
   rather than by the caller remembering a winding: `outward` says which way is out as a fact about
   the anatomy, and the builder swaps the two grids if the surface's own normal disagrees.

   This is body-cavity-coelom's `outwardAt` idea, which that model's log says belongs in render-kit.
   It still does. It is local here for the same reason it was local there — render-kit.js is shared
   with eleven models and a shared-file change is not this run's — and that duplication is now TWO
   models' worth and is logged again, with a queue item asked for in BUILD-LOG. */
function slab(edgeA, edgeB, thickness, outward) {
  const n = Math.min(edgeA.length, edgeB.length);
  if (n < 2) return null;
  const E = K.emitter();
  const nrm = [], top = [], bot = [];
  const u = new T.Vector3(), v = new T.Vector3(), w = new T.Vector3();
  for (let i = 0; i < n; i++) {
    const i0 = Math.max(0, i - 1), i1 = Math.min(n - 1, i + 1);
    u.subVectors(edgeA[i1], edgeA[i0]);              // along the sheet
    v.subVectors(edgeB[i], edgeA[i]);                // across it
    w.crossVectors(u, v);
    if (w.lengthSq() < 1e-14) w.copy(outward);
    w.normalize();
    if (w.dot(outward) < 0) w.negate();              // the geometry decides, the caller only declares
    nrm.push(w.clone());
  }
  const h = 0.5 * thickness;
  for (let i = 0; i < n; i++) {
    top.push([edgeA[i].clone().addScaledVector(nrm[i], h), edgeB[i].clone().addScaledVector(nrm[i], h)]);
    bot.push([edgeA[i].clone().addScaledVector(nrm[i], -h), edgeB[i].clone().addScaledVector(nrm[i], -h)]);
  }
  /* ONE QUAD, AS TWO WINDING-CORRECTED TRIANGLES sharing one outward normal.
     This used E.quad, whose vertex order is FIXED and which corrects nothing, and the winding probe
     read the mesentery at 0.421 — more than half its faces wound against their own supplied normals.
     render-kit's own comment on triN says to use it "wherever a triangle is not part of a ring quad:
     caps, tapers, SHEETS", and every face in a slab is exactly that. Same defect body-cavity-coelom
     logged against sweptShell's ring quads, reached from the other direction: a caller that had not
     thought about winding, using a primitive that assumes it had. */
  const qN = (a, b, c, d, nn) => { E.triN(a, b, c, nn); E.triN(a, c, d, nn); };
  for (let i = 0; i < n - 1; i++) {
    qN(top[i][0], top[i][1], top[i + 1][1], top[i + 1][0], nrm[i]);
    qN(bot[i][0], bot[i + 1][0], bot[i + 1][1], bot[i][1], nrm[i].clone().negate());
    /* the two long rims */
    const ra = new T.Vector3().subVectors(edgeA[i], edgeB[i]).normalize();
    const rb = ra.clone().negate();
    qN(top[i][0], top[i + 1][0], bot[i + 1][0], bot[i][0], ra);
    qN(top[i][1], bot[i][1], bot[i + 1][1], top[i + 1][1], rb);
  }
  /* the two short ends */
  const e0 = new T.Vector3().subVectors(edgeA[0], edgeA[1]).normalize();
  const e1 = new T.Vector3().subVectors(edgeA[n - 1], edgeA[n - 2]).normalize();
  qN(top[0][0], bot[0][0], bot[0][1], top[0][1], e0);
  qN(top[n - 1][0], top[n - 1][1], bot[n - 1][1], bot[n - 1][0], e1);
  return E.geometry(E.count());
}

/* ======================= fixWinding — AND IT BELONGS IN render-kit.js

   EVERY SWEPT TUBE IN THIS CORPUS CAN DISAGREE WITH ITS OWN NORMALS, and this model is the THIRD to
   measure it. render-kit's `sweptShell` emits its ring quads through `emitter().quad`, whose vertex
   order is FIXED and which corrects nothing, against normals that its `nrm()` ends by NEGATING whenever
   they point inward. Wherever that guard fires, face winding and supplied normals disagree.

   body-cavity-coelom logged this on 2026-10-01 with the measurement and the one-line fix — "sweptShell's
   outer-surface loop should emit through a winding-correcting quad" — and declined to make it because
   render-kit.js is shared with eleven models. It also measured cardiac-looping at 7 of 11 keys below
   0.999 WHILE THE QUEUE MARKS THAT ITEM `done`. lateral-folding did not hit it only because it has no
   swept tubes: every structure there is a slab.

   This model is nearly all swept tubes, so it hits it hard: the winding probe read foregut 0.970,
   stomach 0.943, duodenum 0.954, hindgut 0.988, enteric 0.960 before this pass. So, exactly as
   body-cavity-coelom did, it corrects its OWN geometry here rather than editing the shared file, and
   logs the duplication again. Two models carrying the same workaround was an argument; three is a case.

   The correction is local and total: for every triangle, if its face normal disagrees with the mean of
   its three supplied vertex normals, swap two vertices. Position and normal values are untouched — only
   the ORDER changes — so nothing about the surface moves. */
function fixWinding(geo) {
  if (!geo) return geo;
  const pos = geo.attributes.position, nml = geo.attributes.normal;
  const P = pos.array, N = nml.array;
  const a = new T.Vector3(), b = new T.Vector3(), c = new T.Vector3();
  const e1 = new T.Vector3(), e2 = new T.Vector3(), fn = new T.Vector3(), vn = new T.Vector3();
  let swapped = 0;
  for (let i = 0; i + 2 < pos.count; i += 3) {
    a.fromArray(P, i * 3); b.fromArray(P, (i + 1) * 3); c.fromArray(P, (i + 2) * 3);
    e1.subVectors(b, a); e2.subVectors(c, a); fn.crossVectors(e1, e2);
    if (fn.lengthSq() < 1e-18) continue;
    vn.set(0, 0, 0);
    for (let k = 0; k < 3; k++) vn.add(new T.Vector3().fromArray(N, (i + k) * 3));
    if (vn.lengthSq() < 1e-18) continue;
    if (fn.dot(vn) >= 0) continue;
    for (let k = 0; k < 3; k++) {
      const t1 = P[(i + 1) * 3 + k]; P[(i + 1) * 3 + k] = P[(i + 2) * 3 + k]; P[(i + 2) * 3 + k] = t1;
      const t2 = N[(i + 1) * 3 + k]; N[(i + 1) * 3 + k] = N[(i + 2) * 3 + k]; N[(i + 2) * 3 + k] = t2;
    }
    swapped++;
  }
  pos.needsUpdate = true; nml.needsUpdate = true;
  geo.userData.windingSwapped = swapped;
  _windingSwapTotal += swapped;
  return geo;
}
let _windingSwapTotal = 0;

/* a span of the tube, sampled on CL, as a capped solid */
function tubeSpan(s0, s1, t, n, rScale, RC) {
  n = n || 90;
  const pts = [];
  for (let i = 0; i <= n; i++) pts.push(CL(s0 + (s1 - s0) * (i / n), t, new T.Vector3(), RC));
  /* rScale is a NUMBER (a multiple of the wall calibre, the original signature) or a FUNCTION of s
     returning the radius outright. The function form was added 2026-10-01 for the duodenal lumen cast
     and the epithelial plug, whose radii are not multiples of the wall but derived from lumenAt. */
  const rf = (typeof rScale === 'function') ? rScale
           : (ss => radiusAt(ss, t) * (rScale || 1));
  const rs = [];
  for (let i = 0; i <= n; i++) rs.push(rf(s0 + (s1 - s0) * (i / n)));
  const geo = K.tubeCapped(pts, uu => {
    const k = clamp(Math.round(uu * n), 0, n);
    return rs[k];
  }, { ring: 24, cap: 'both', capRows: 7, bulge: 0.80 });
  if (geo) geo.userData.refLine = pts.map(q => [q.x, q.y, q.z]);
  return fixWinding(geo);
}

/* an ellipsoid, for the yolk sac and the cloacal chamber */
function blob(centre, rx, ry, rz, ring, rows) {
  ring = ring || 28; rows = rows || 18;
  const E = K.emitter();
  const P = (i, j, o) => {
    const ph = (i / rows) * Math.PI, th = (j / ring) * Math.PI * 2;
    return o.set(centre.x + rx * Math.sin(ph) * Math.cos(th),
                 centre.y + ry * Math.cos(ph),
                 centre.z + rz * Math.sin(ph) * Math.sin(th));
  };
  const N = (i, j, o) => {
    const ph = (i / rows) * Math.PI, th = (j / ring) * Math.PI * 2;
    return o.set(Math.sin(ph) * Math.cos(th) / rx, Math.cos(ph) / ry, Math.sin(ph) * Math.sin(th) / rz).normalize();
  };
  const a = new T.Vector3(), b = new T.Vector3(), c = new T.Vector3(), d = new T.Vector3();
  const na = new T.Vector3(), nb = new T.Vector3(), nc = new T.Vector3(), nd = new T.Vector3();
  for (let i = 0; i < rows; i++) for (let j = 0; j < ring; j++) {
    P(i, j, a); P(i + 1, j, b); P(i + 1, j + 1, c); P(i, j + 1, d);
    N(i, j, na); N(i + 1, j, nb); N(i + 1, j + 1, nc); N(i, j + 1, nd);
    /* triN for the same reason slab uses it: at the two poles one corner of the quad is degenerate
       and the fixed order in `quad` cannot know which way the surviving triangle faces. */
    E.triN(a, b, c, na); E.triN(a, c, d, na);
  }
  return E.geometry(E.count());
}

/* a short bud off the tube at station s, pointing along `dir` */
function bud(s, t, dir, len, r, RC) {
  const p0 = CL(s, t, new T.Vector3(), RC);
  const d = dir.clone().normalize();
  const pts = [];
  const n = 14;
  for (let i = 0; i <= n; i++) pts.push(p0.clone().addScaledVector(d, len * (i / n)));
  const geo = K.tubeCapped(pts, uu => r * (1 - 0.45 * uu), { ring: 16, cap: 'both', capRows: 6 });
  if (geo) geo.userData.refLine = pts.map(q => [q.x, q.y, q.z]);
  return fixWinding(geo);
}

/* ==================================================================== the build */

const FULL_OPTS = {
  arteries: true, mesentery: true, buds: true, yolk: true, enteric: true,
  wall: true, cloacaDetail: true, lumen: true,
};

function buildGut(t, opts) {
  opts = Object.assign({}, FULL_OPTS, opts || {});
  t = clamp(t == null ? 1 : t, 0, 1);
  const g = new T.Group();
  const L = LAYERS;
  /* THE VARIANT IS A ROTATION CAP, not a separate geometry. malrotation builds the same tube with the
     turn stopped at 90 degrees, so the narrow mesenteric base, the reversed limbs and the caecum in
     the wrong quadrant all come out of the one schedule. Nothing about the lesion is drawn. */
  const RC = opts.malrotation ? ROT_CAP_MALROT : ROT_TOTAL;
  const th = Math.min(theta(t), RC);

  /* ---- the three divisions of the one tube. Three parts, ONE centreline: the seams fall exactly at
     the two boundaries the scene exists to teach, which is why they are drawn as separate spans. */
  const fg = tubeSpan(0, S_FG, t, 70, 1, RC);
  const mg = tubeSpan(S_FG, S_MG, t, 150, 1, RC);
  const hg = tubeSpan(S_MG, 1, t, 70, 1, RC);
  if (fg) K.addSolid(g, 'foregut', fg, { color: L.foregut.color, name: L.foregut.name });
  if (mg) K.addSolid(g, 'midgut',  mg, { color: L.midgut.color,  name: L.midgut.name });
  if (hg) K.addSolid(g, 'hindgut', hg, { color: L.hindgut.color, name: L.hindgut.name });

  /* ---- the stomach, as the dilated span it is, drawn over the foregut so a beat can name it */
  const stom = tubeSpan(S_FG * 0.46, S_FG * 0.82, t, 36, 1.02, RC);
  if (stom) K.addSolid(g, 'stomach', stom, { color: L.stomach.color, name: L.stomach.name });

  /* ---- THE DUODENUM, drawn as the span that STRADDLES the papilla, because that is the examinable
     fact: the boundary runs through the middle of it, which is why it has a double blood supply. */
  const duod = tubeSpan(S_DUOD_A, S_DUOD_B, t, 40, 1.04, RC);
  if (duod) K.addSolid(g, 'duodenum', duod, { color: L.duodenum.color, name: L.duodenum.name });

  /* ---- THE LUMEN INSIDE IT, AND THE SOLID CORD THAT OBLITERATES IT.
     `lumen` has been in FULL_OPTS since this model was written and NOTHING READ IT — a declared layer
     flag with no consumer, which is the same class of claim-without-a-fact this file's section 6 note
     is about, and it is logged rather than quietly deleted. It now has its consumer.

     Two complementary casts over the duodenum's own span, both strictly inside the wall (the wall is
     drawn at 1.04 x calibre and LUMEN_OPEN is 0.55 of it):
       duod_lumen — the patent channel, radius = calibre x lumenAt(s, t)
       duod_plug  — the proliferating epithelium, radius = calibre x plugFrac(s, t)
     At the peak of the plug the lumen radius reaches zero across the duodenum, so the cast is NOT
     BUILT at that instant: there is no lumen, which is the teaching, and drawing a degenerate tube
     would say the opposite while also handing the winding probe zero-area triangles. Outside the
     recanalization window plugFrac is zero everywhere and the plug is not built. Both absences are
     declared in STAGE_LIMITED. */
  if (opts.lumen) {
    const sMidDuod = 0.5 * (S_DUOD_A + S_DUOD_B);
    if (lumenAt(sMidDuod, t) > 0) {
      const lumCast = tubeSpan(S_DUOD_A, S_DUOD_B, t, 40, ss => radiusAt(ss, t) * lumenAt(ss, t), RC);
      if (lumCast) K.addSolid(g, 'duod_lumen', lumCast,
                              { color: L.duod_lumen.color, name: L.duod_lumen.name });
    }
    if (plugDepth(t) > 0) {
      const plugCast = tubeSpan(S_DUOD_A, S_DUOD_B, t, 40, ss => radiusAt(ss, t) * plugFrac(ss, t), RC);
      if (plugCast) K.addSolid(g, 'duod_plug', plugCast,
                               { color: L.duod_plug.color, name: L.duod_plug.name });
    }
  }

  /* ---- the two boundary markers, each a bead ON the tube at its exact station.

     THE BEADS WERE SMALLER THAN THE TUBE THEY MARK, AND THEREFORE INSIDE IT. Radius 0.050 and 0.048
     against a gut radius of 0.055 at t = 1: geometrically interior, so no camera could ever see either
     one. That is the cause of a large part of finding 3 of the 2026-10-01 review — the two stations the
     narration calls "the two sentences to memorise verbatim" measured 0.038% and 0.021% of the frame,
     and would have measured about that in ANY framing, because the thing was buried rather than far
     away. Fifteen of the twenty-one visibility waivers were arguing about camera distance for
     structures that were not on screen at all.
     A marker bead's whole job is to be proud of its tube, so its radius is now DERIVED FROM the tube's
     radius at its own station rather than written down beside it, and it cannot silently go back inside
     when a calibre changes. Row BEADS-PROUD measures the ratio. */
  const beadR = st => BEAD_PROUD * radiusAt(st, t);
  const pap = CL(S_FG, t, new T.Vector3(), RC);
  const papR = beadR(S_FG);
  K.addSolid(g, 'papilla', blob(pap, papR, papR, papR, 20, 12),
             { color: L.papilla.color, name: L.papilla.name });
  const wsh = CL(S_MG, t, new T.Vector3(), RC);
  const wshR = beadR(S_MG);
  K.addSolid(g, 'watershed', blob(wsh, wshR, wshR, wshR, 20, 12),
             { color: L.watershed.color, name: L.watershed.name });

  /* ---- the caecal bud and its appendix, on the CAUDAL limb, carried by the rotation */
  const cae = CL(S_CAECUM, t, new T.Vector3(), RC);
  /* THE CAECUM WAS DRAWN TWICE — once as this blob and once as a swelling in radiusAt — and the
     swelling was the bigger of the two, so the named structure a beat highlights was inside the
     unnamed one. Measured 0.102% of the frame in the beat that points at it. The tube's bump is now a
     shoulder (1.25) rather than a sac (2.05) and the blob is proud of it, so the caecum is drawn once,
     as the thing that carries its name. */
  const caeR = CAECUM_PROUD * radiusAt(S_CAECUM, t);
  K.addSolid(g, 'caecum', blob(cae, caeR * 1.235, caeR, caeR, 22, 14),
             { color: L.caecum.color, name: L.caecum.name });
  /* THE APPENDIX IS A LATE STRUCTURE, AND ITS LENGTH WAS ZERO AT t = 0.
     The first version built it at every t with length 0.085 + 0.14*smooth(t), so at t = 0 all thirteen
     polyline points coincided: a zero-length tube whose every face is degenerate, which the winding
     probe read as 0.000 — not "wound backwards" but "no face with a meaningful normal at all". A render
     showed nothing wrong because there was nothing there to see. The appendix becomes a distinct
     diverticulum of the caecum in about week 6, so the fix is the one the anatomy asks for: it is
     STAGE_LIMITED and is not built before then. */
  const APPENDIX_T = 0.34;
  if (t >= APPENDIX_T) {
    const capp = CL(S_CAECUM + 0.016, t, new T.Vector3(), RC);
    /* IT CAME OFF THE CAECUM ALONG THE COLON'S OWN AXIS, SO IT WAS INSIDE THE COLON. appDir was the
       tube's forward tangent, which is the direction the ascending colon leaves in — a 0.022-radius
       tube drawn up the middle of a 0.069-radius one. Measured on mesh vertices at t = 1 the appendix
       occupied y [-0.454, -0.216] with the ascending colon over all of it, and it reported 0.000% of
       the frame in every beat that showed it, including a beat framed on the caecum itself.
       The anatomy says where it goes instead: the appendix arises at the CAECUM'S BLIND END, where the
       three taeniae converge — the pole AWAY from the colon — and points inferomedially. So the
       direction is the backward tangent with a medial component, and medial for a structure the
       rotation has put on the embryo's right (-x) is +x. Nothing here chooses a side: the sign comes
       off the caecum's own x, so a build that put the caecum on the left would tilt the appendix the
       other way and still have it leave the blind end. */
    const tangent = new T.Vector3().subVectors(capp, cae).normalize();
    const medial = new T.Vector3(cae.x < 0 ? 1 : -1, 0, 0);
    const appDir = tangent.clone().multiplyScalar(-1).addScaledVector(medial, 0.55).normalize();
    const grow = smooth((t - APPENDIX_T) / (1 - APPENDIX_T));
    const appPts = [];
    for (let i = 0; i <= 12; i++) {
      /* START AT THE CAECUM'S SURFACE, not inside it. The base was 0.085 from the blob's centre
         against semi-axes of 0.085, so the appendix left the sac exactly at its skin and the first
         third of it was buried; it measured 0% of the frame in every beat that showed it. */
      appPts.push(cae.clone().addScaledVector(appDir, caeR * 1.08 + (0.06 + 0.14 * grow) * (i / 12)));
    }
    const app = K.tubeCapped(appPts, () => 0.022 * lerp(0.6, 1, grow),
                             { ring: 12, cap: 'both', capRows: 5 });
    if (app) { app.userData.refLine = appPts.map(q => [q.x, q.y, q.z]); fixWinding(app);
               K.addSolid(g, 'appendix', app, { color: L.appendix.color, name: L.appendix.name }); }
  }

  /* ---- the yolk sac and the vitelline duct. The duct's radius is DERIVED (see vitellineR). */
  if (opts.yolk) {
    const apex = CL(S_APEX, t, new T.Vector3(), RC);
    const sacR = lerp(0.30, 0.10, smooth(t));
    const sacC = apex.clone().addScaledVector(new T.Vector3(0, 0, 1), lerp(0.46, 0.30, smooth(t)) + sacR);
    /* noOutline, and 0.32 rather than 0.82. The silhouette shell addSolid adds is OPAQUE, so a
       transparent structure wearing one is not transparent at all — the sac was a solid yellow ball
       sitting over the midgut in every anterior frame. Same cause as the body wall above. */
    K.addSolid(g, 'yolksac', blob(sacC, sacR, sacR * 0.86, sacR, 26, 16),
               { color: L.yolksac.color, name: L.yolksac.name, noOutline: true,
                 matOver: { opacity: 0.32, transparent: true } });
    const dp = [];
    for (let i = 0; i <= 16; i++) dp.push(apex.clone().lerp(sacC, (i / 16) * 0.92));
    /* CAPPED AT BOTH ENDS. 'none' is not a value tubeCapped understands — it is truthy, so it took the
       single-end branch — and an UNCAPPED end is an annular ring with a lit inner surface, which
       RENDER-STANDARD names as the one thing that must never be visible. Both of this duct's ends are
       buried, in the gut and in the sac, so capping costs nothing. */
    const vd = K.tubeCapped(dp, () => vitellineR(t), { ring: 14, cap: 'both', capRows: 5 });
    if (vd) { vd.userData.refLine = dp.map(q => [q.x, q.y, q.z]); fixWinding(vd);
              K.addSolid(g, 'vitelline', vd, { color: L.vitelline.color, name: L.vitelline.name }); }
  }

  /* ---- the two terminal membranes. Ectoderm meets endoderm with no mesoderm between, so each is a
     thin disc ACROSS the tube's end, and each RUPTURES — the buccopharyngeal in week 4, the cloacal
     in week 7 — which is modelled as the disc disappearing, not thinning. */
  const BUCCO_T = 0.30, CLOACAL_T = 0.74;
  if (t < BUCCO_T) {
    const p = CL(0, t, new T.Vector3(), RC), q = CL(0.02, t, new T.Vector3(), RC);
    const ax = new T.Vector3().subVectors(p, q).normalize();
    /* 1.45, NOT 1.25, and the reason is the silhouette rather than a threshold. A membrane CLOSES the
       tube, so it has to be wider than the tube's outer WALL — and addSolid gives that wall an opaque
       outline shell, so at 1.25 the disc sat flush inside the shell and the only part of it a camera
       could see was its 0.018 thickness, edge-on in any view that runs along the tube. It measured
       0.017% of the frame in the beat whose narration names it, against a 0.02% floor. */
    const r = radiusAt(0, t) * 1.45;
    const a = [], b = [];
    for (let i = 0; i <= 18; i++) {
      const u = -1 + 2 * (i / 18);
      const perp = new T.Vector3(1, 0, 0).sub(ax.clone().multiplyScalar(ax.x)).normalize();
      const sideway = new T.Vector3().crossVectors(ax, perp).normalize();
      const hw = r * Math.sqrt(Math.max(0, 1 - u * u));
      a.push(p.clone().addScaledVector(perp, r * u).addScaledVector(sideway, -hw));
      b.push(p.clone().addScaledVector(perp, r * u).addScaledVector(sideway, +hw));
    }
    const m = slab(a, b, 0.018, ax);
    if (m) K.addSolid(g, 'buccoph', m, { color: L.buccoph.color, name: L.buccoph.name });
  }
  if (t < CLOACAL_T) {
    const p = CL(1, t, new T.Vector3(), RC), q = CL(0.98, t, new T.Vector3(), RC);
    const ax = new T.Vector3().subVectors(p, q).normalize();
    const r = R_CLOACA * 1.15;
    const a = [], b = [];
    for (let i = 0; i <= 18; i++) {
      const u = -1 + 2 * (i / 18);
      const perp = new T.Vector3(1, 0, 0);
      const sideway = new T.Vector3().crossVectors(ax, perp).normalize();
      const hw = r * Math.sqrt(Math.max(0, 1 - u * u));
      a.push(p.clone().addScaledVector(perp, r * u).addScaledVector(sideway, -hw));
      b.push(p.clone().addScaledVector(perp, r * u).addScaledVector(sideway, +hw));
    }
    const m = slab(a, b, 0.018, ax);
    if (m) K.addSolid(g, 'cloacalmem', m, { color: L.cloacalmem.color, name: L.cloacalmem.name });
  }

  /* ---- THE CLOACA AND ITS PARTITION. One chamber, split by a wedge of mesoderm descending between
     t = P0 and t = P1 into an anorectal canal DORSALLY and a urogenital sinus VENTRALLY. The septum's
     free edge reaches the cloacal membrane at P1, which is what makes the perineal body; stopping it
     short is the high anorectal malformation, and that is the `highARM` variant. */
  if (opts.cloacaDetail) {
    const cl = CL(0.985, t, new T.Vector3(), RC);
    K.addSolid(g, 'cloaca', blob(cl, R_CLOACA, R_CLOACA * 1.25, R_CLOACA, 24, 14),
               { color: L.cloaca.color, name: L.cloaca.name, noOutline: true,
                 matOver: { opacity: 0.42, transparent: true } });
    const descent = clamp((t - P0) / (P1 - P0), 0, 1) * (opts.highARM ? 0.55 : 1);
    if (descent > 0.01) {
      /* the septum: a wedge in the median plane, coming down from cranial, its free edge advancing */
      const topY = cl.y + R_CLOACA * 1.15, reach = 2 * R_CLOACA * 1.15 * descent;
      const a = [], b = [];
      const nseg = 16;
      for (let i = 0; i <= nseg; i++) {
        const u = i / nseg, yy = topY - reach * u;
        const hw = R_CLOACA * 0.96 * (1 - 0.55 * u);      // A MEMBRANE TAPERS where it meets what it suspends
        a.push(new T.Vector3(cl.x - hw, yy, cl.z - R_CLOACA * 0.10));
        b.push(new T.Vector3(cl.x + hw, yy, cl.z - R_CLOACA * 0.10));
      }
      const sep = slab(a, b, 0.020, new T.Vector3(0, 0, 1));
      if (sep) K.addSolid(g, 'urorectal', sep, { color: L.urorectal.color, name: L.urorectal.name });
      /* the two channels, present only once the septum has made them */
      if (descent > 0.45) {
        const ar = blob(cl.clone().add(new T.Vector3(0, 0, -R_CLOACA * 0.46)),
                        R_CLOACA * 0.62, R_CLOACA * 1.05, R_CLOACA * 0.46, 20, 12);
        K.addSolid(g, 'anorectal', ar, { color: L.anorectal.color, name: L.anorectal.name });
        const ug = blob(cl.clone().add(new T.Vector3(0, 0, +R_CLOACA * 0.46)),
                        R_CLOACA * 0.62, R_CLOACA * 1.05, R_CLOACA * 0.46, 20, 12);
        K.addSolid(g, 'urogenital', ug, { color: L.urogenital.color, name: L.urogenital.name });
      }
    }
  }

  /* ---- THE THREE ARTERIES, each from the dorsal aorta to the division it defines. These are what
     the divisions ARE — the boundaries are where one territory hands over — so each artery ends ON
     the tube at the station that bounds its own territory, and the two boundary beads sit between
     consecutive arteries by construction rather than by placement. */
  if (opts.arteries) {
    const ao = [];
    for (let i = 0; i <= 24; i++) ao.push(new T.Vector3(0, lerp(Y_CRANIAL * 0.92, Y_CAUDAL * 0.92, i / 24), Z_DORSAL));
    const aog = K.tubeCapped(ao, () => 0.040, { ring: 16, cap: 'both', capRows: 5 });
    if (aog) { aog.userData.refLine = ao.map(q => [q.x, q.y, q.z]); fixWinding(aog);
               K.addSolid(g, 'aorta', aog, { color: L.aorta.color, name: L.aorta.name }); }

    const artery = (key, sTarget, yOrigin, col, name) => {
      const tgt = CL(sTarget, t, new T.Vector3(), RC);
      const org = new T.Vector3(0, yOrigin, Z_DORSAL);
      const pts = [];
      for (let i = 0; i <= 20; i++) {
        const u = i / 20;
        const p = org.clone().lerp(tgt, u);
        p.z += 0.10 * Math.sin(Math.PI * u);         // the vessel bows ventrally in its mesentery
        pts.push(p);
      }
      const geo = K.tubeCapped(pts, uu => lerp(0.030, 0.016, uu), { ring: 14, cap: 'both', capRows: 5 });
      if (geo) { geo.userData.refLine = pts.map(q => [q.x, q.y, q.z]); fixWinding(geo);
                 K.addSolid(g, key, geo, { color: col, name: name }); }
    };
    /* the three origins descend the aorta in order, which is the T12 / L1 / L3 fact — the LEVELS
       themselves have no vertebra in this model to anchor to and are declared in the scene's gaps[] */
    artery('coeliac', S_FG * 0.70,            yAnat(S_FG) + 0.30, L.coeliac.color, L.coeliac.name);
    artery('sma',     S_APEX,                 Y_RING,            L.sma.color,     L.sma.name);
    artery('ima',     S_MG + 0.42 * (1 - S_MG), yAnat(S_MG) - 0.34, L.ima.color,     L.ima.name);
  }

  /* ---- THE DORSAL MESENTERY, hung between the gut and its root. The root is rootPoint, whose length
     is the measured quantity (b) is about. */
  if (opts.mesentery) {
    const n = 110, free = [], root = [];
    for (let i = 0; i <= n; i++) {
      const s = S_FG + (S_MG - S_FG) * (i / n);
      free.push(CL(s, t, new T.Vector3(), RC));
      root.push(rootPoint(s, t, new T.Vector3(), RC));
    }
    const sheet = slab(free, root, 0.016, new T.Vector3(1, 0, 0));
    if (sheet) K.addSolid(g, 'mesentery', sheet,
      { color: L.mesentery.color, name: L.mesentery.name, noOutline: true,
        matOver: { opacity: 0.50, transparent: true } });
  }

  /* ---- the buds off the foregut: liver/biliary, the two pancreatic buds, and the respiratory
     diverticulum. Buds, not organs — each has its own curriculum entry, declared in gaps[]. */
  if (opts.buds) {
    const vent = new T.Vector3(0, 0.25, 1), dors = new T.Vector3(0, 0.1, -1);
    const hb = bud(S_FG - 0.012, t, vent, lerp(0.05, 0.30, smooth(t)), 0.055, RC);
    if (hb) K.addSolid(g, 'hepatic', hb, { color: L.hepatic.color, name: L.hepatic.name });
    const pd = bud(S_FG - 0.004, t, dors, lerp(0.04, 0.21, smooth(t)), R_PANC_HEAD, RC);
    if (pd) K.addSolid(g, 'panc_dorsal', pd, { color: L.panc_dorsal.color, name: L.panc_dorsal.name });
    const pv = bud(S_FG - 0.018, t, new T.Vector3(0, -0.2, 1), lerp(0.03, 0.15, smooth(t)), 0.038, RC);
    if (pv) K.addSolid(g, 'panc_ventral', pv, { color: L.panc_ventral.color, name: L.panc_ventral.name });
    /* the respiratory diverticulum, high in the foregut, separated by the tracheo-oesophageal septum */
    const rd = bud(S_FG * 0.26, t, new T.Vector3(0, -0.35, 1), lerp(0.05, 0.34, smooth(t)), 0.050, RC);
    if (rd) K.addSolid(g, 'respir', rd, { color: L.respir.color, name: L.respir.name });
  }

  /* ---- THE ENTERIC FRONT, as the colonised span of the tube. Drawn as a sleeve over the gut from
     s = 0 to the front, so a beat can SEE how far the crest has got and Hirschsprung is the sleeve
     stopping short of s = 1 with the rectum left bare. */
  if (opts.enteric) {
    const f = frontAt(t, entericStopOf(opts.entericStop));
    if (f > 0.02) {
      const n = Math.max(8, Math.round(140 * f));
      const pts = [];
      for (let i = 0; i <= n; i++) pts.push(CL(f * (i / n), t, new T.Vector3(), RC));
      /* 1.07, not 1.16, and 0.22 opacity rather than 0.38. THE SLEEVE WAS MASKING THE COLOUR KEY.
         The scene's own gaps[] say the three divisions must carry ONE colour across every panel, because
         "arterial territory, derivative list, referred pain level and malformation all belong to the same
         three blocks". A violet sleeve at 0.38 covering the whole tube by t = 1 turned foregut blue,
         midgut teal and hindgut purple into one periwinkle spiral — the model was right and the picture
         destroyed the thing the picture is for. It now tints rather than covers.
         It stays in FULL so the key still resolves through the adapter; which BEATS draw it is the
         scene's business, and measure-scene-visibility is what will check that per beat. */
      const sl = K.tubeCapped(pts, uu => radiusAt(f * uu, t) * 1.07,
                              { ring: 18, cap: 'both', capRows: 5 });
      if (sl) { sl.userData.refLine = pts.map(q => [q.x, q.y, q.z]); fixWinding(sl); }
      if (sl) K.addSolid(g, 'enteric', sl,
        { color: L.enteric.color, name: L.enteric.name, noOutline: true,
          matOver: { opacity: 0.22, transparent: true } });
    }
  }

  /* ---- the ventral body wall and the umbilical ring the midgut herniates through. Context, so the
     hernia is visibly OUTSIDE something; declared in gaps[] as a plane, not a modelled wall. */
  if (opts.wall) {
    /* A FRAME, NOT A SHEET — and this is the defect that every numeric check passed over.

       The wall was a full slab across the embryo at z = +0.74, which is BETWEEN the anterior camera and
       the whole gut. At 0.22 opacity that would still have been a veil; what actually happened is worse,
       because addSolid gives every solid an OPAQUE silhouette shell, and the shell of a large flat slab
       is a large flat opaque rectangle. So the anterior view — the camera four of the six beats use —
       was a grey panel with the yolk sac in front of it and NOT ONE MILLIMETRE OF GUT VISIBLE, at every
       t. Acceptance passed 23/23, winding 1.000, normals 1.000, no open lumen, console clean. Every
       check in this harness was green on a picture that showed nothing the scene is about.
       That is RENDER-STANDARD's fourth check — "it looks like the thing" — doing the only job no
       measurement here can do, and it is why that check is a human looking at the render.

       The wall's job in this scene is to be the thing the hernia is OUTSIDE OF. A frame does that: the
       plane is legible from its border and the umbilical ring marks the aperture, and nothing is hidden.
       Declared in the scene's gaps[] as a frame rather than a wall. */
    const corners = [
      new T.Vector3(-0.92, Y_CRANIAL, Z_WALL), new T.Vector3(+0.92, Y_CRANIAL, Z_WALL),
      new T.Vector3(+0.92, Y_CAUDAL,  Z_WALL), new T.Vector3(-0.92, Y_CAUDAL,  Z_WALL),
      new T.Vector3(-0.92, Y_CRANIAL, Z_WALL),
    ];
    const fr = [];
    for (let i = 0; i < 4; i++) for (let k = 0; k <= 10; k++) {
      if (i > 0 && k === 0) continue;
      fr.push(corners[i].clone().lerp(corners[i + 1], k / 10));
    }
    const w = K.tubeAlong(fr, () => 0.022, { ring: 10 });
    if (w) { w.userData.refLine = fr.map(q => [q.x, q.y, q.z]); fixWinding(w);
      K.addSolid(g, 'bodywall', w,
        { color: L.bodywall.color, name: L.bodywall.name, matOver: { opacity: 0.55, transparent: true },
          noOutline: true }); }
    /* the ring: a torus of the aperture's own radius, so the hernia's solve and the drawn hole agree */
    const rp = [];
    for (let i = 0; i <= 40; i++) {
      const a2 = (i / 40) * Math.PI * 2;
      rp.push(new T.Vector3(R_RING * Math.cos(a2), Y_RING + R_RING * Math.sin(a2), Z_WALL));
    }
    const rg = K.tubeAlong(rp, () => 0.030, { ring: 12 });
    if (rg) { rg.userData.refLine = rp.map(q => [q.x, q.y, q.z]); fixWinding(rg);
              K.addSolid(g, 'umbring', rg, { color: L.umbring.color, name: L.umbring.name }); }
  }

  g.userData.t = t;
  g.userData.theta = th;
  g.userData.hernia = herniaAt(t);
  g.userData.rootLength = rootLength(t, RC);
  g.userData.malrotation = !!opts.malrotation;
  g.userData.windingSwapped = _windingSwapTotal;
  return g;
}

/* ============================================================ ACCEPTANCE

   Every row is a MEASUREMENT on this model's own functions or on its built geometry, against a floor
   or a ceiling. The render harness re-measures the geometric ones on REAL MESH VERTICES, PERTURBS the
   constants each row reads and requires the row's number to move, and runs the negative cases. A row
   whose measured side is a compile-time constant cannot fail, which is the fault lateral-folding's
   review round 1 found in its own battery; so each row below closes over a function call, not a
   value, and `perturb` names what moves it. */

const FLOORS = {
  ROOT_RATIO:   1.80,    // 270 degrees must give a markedly broader base than 90 does
  ROOT_90_MAX:  0.46,    // and the 90-degree base must actually be narrow, in model units
  REFINE_MAX:   0.40,    // max-gap(2400 stations) / max-gap(600): ~0.25 if continuous, ~1 at a jump
  SLOPE_MAX:    48.0,    // max |dC/ds| in model units per unit s, any t
  VIT_NARROW:   6.0,     // vitelline duct radius at t=0 over its radius at t=1
  CAEC_X_MAX:  -0.12,    // caecum must be on the embryo's RIGHT (-x) at t=1, by this margin
  DJ_X_MIN:     0.12,    // duodenojejunal flexure on the LEFT (+x) at t=1, by this margin
  /* THE PAPILLA'S FLOOR IS SMALLER THAN THE DJ FLEXURE'S, AND DELIBERATELY SO. The abdominal cavity
     in this frame is 0.616 units wide between the two colic gutters, so a unit is about 48 cm of
     abdomen; the papilla sits 2-3 cm right of the midline, which is 0.05-0.07 units. Demanding the
     0.12 that DJ-L demands would be demanding anatomically WRONG geometry — the papilla is only
     modestly right of the midline, and it is the DJ flexure that swings wide. The row still catches
     the defect it was written for by a factor of five: the review measured +0.271. */
  PAP_X_MAX:   -0.05,    // and the major duodenal papilla on the RIGHT (-x), by its own margin
  HERNIA_D_MIN: 0.18,    // the hernia must actually stand proud of the wall at its peak
  /* THE ROW THE WHOLE OF (b2) EXISTS FOR. The rotation maps the midgut's LEVEL onto its SIDE, so
     without fixation the y extent is zero to machine precision against an x extent of 0.738. A
     fraction, not an absolute, because it has to stay meaningful if the model is rescaled. */
  FLAT_RATIO_MIN: 0.55,  // midgut y extent / x extent at t = 1: below this it is a pinwheel
  MALROT_FLAT_MAX: 0.10, // and the UNFIXED variant must still BE flat, or the row proves nothing
  FIX_BREAKS_MIN: 0.015, // fixation must move the DJ-to-ileocaecal span by at least this much
  COLON_SIDE_MIN: 0.12,  // the ascending limb right of, and the descending left of, the midline
  ELONG_MIN:      1.15,  // the colon must LENGTHEN onto the frame, not be shrunk onto it
};

function measure() {
  const m = {};

  /* (a) the hernia: the window opens, the solve closes, and it returns before the end */
  m.hernia_window_open   = HERNIA_WINDOW.open;
  m.hernia_window_closes = HERNIA_WINDOW.closes;
  m.hernia_first = HERNIA_WINDOW.first;
  m.hernia_last  = HERNIA_WINDOW.last;
  m.hernia_peak_t = HERNIA_PEAK.t;
  m.hernia_peak_d = HERNIA_PEAK.d;
  const hp = herniaAt(HERNIA_PEAK.t);
  m.hernia_residual = hp.residual;
  m.hernia_iters = hp.iters;
  /* the solve is checked against its own condition, not against a remembered answer */
  m.hernia_closes_identity = Math.abs(arcOfBulge(hp.d) - 2 * R_RING - excess(HERNIA_PEAK.t));
  m.excess_peak = excess(HERNIA_PEAK.t);
  m.mg_len_1 = mgLen(1); m.cap_len_1 = capLen(1);

  /* (b) the mesenteric root, at t = 1, normal against the model's own malrotation variant */
  m.root_normal = ROOT_NORMAL;
  m.root_malrot = ROOT_MALROT;
  m.root_ratio  = ROOT_RATIO;
  m.pedicle     = PEDICLE;
  m.t_rot90 = T_ROT90; m.t_rot270 = T_ROT270;
  m.fix_at_1_normal = fixAt(1, ROT_TOTAL);
  m.fix_at_1_malrot = fixAt(1, ROT_CAP_MALROT);
  /* THE INVARIANCE THAT BROKE THE FIRST VERSION, measured so nobody has to rediscover it: the
     distance between the duodenojejunal flexure and the ileocaecal junction is identical at 90 and at
     270 degrees, because a rigid rotation preserves distances. Row ROT-RIGID asserts it. */
/* READ AT T_ROT270, NOT AT t = 1, and the change is section (b2)'s doing. Until (b2) existed, CL
     was the rotation and nothing else, so the invariance held at every t and was read at the end.
     Fixation is not a rigid motion, so at t = 1 the two spans now differ — correctly. T_ROT270 is
     the instant the turn completes and the instant fixAt() switches on, so it is the last t at which
     the question "what does the ROTATION alone do to this distance" is even well posed. The answer
     is still: nothing, and that is still the thing a future run must not try to derive a broad
     mesenteric root from. Row FIX-BREAKS-RIGID carries the other half. */
  const tR = T_ROT270;
  const djA = CL(S_DJ, tR, new T.Vector3(), ROT_CAP_MALROT);
  const icA = CL(S_CAECUM, tR, new T.Vector3(), ROT_CAP_MALROT);
  const djB = CL(S_DJ, tR, new T.Vector3(), ROT_TOTAL);
  const icB = CL(S_CAECUM, tR, new T.Vector3(), ROT_TOTAL);
  m.span_at_90  = djA.distanceTo(icA);
  m.span_at_270 = djB.distanceTo(icB);
  m.span_invariance = Math.abs(m.span_at_90 - m.span_at_270);
  m.span_invariance_t = tR;
  /* and the same two points at t = 1, where fixation HAS run: the span must now have moved */
  const dj1 = CL(S_DJ, 1, new T.Vector3(), ROT_TOTAL);
  const ic1 = CL(S_CAECUM, 1, new T.Vector3(), ROT_TOTAL);
  const djM = CL(S_DJ, 1, new T.Vector3(), ROT_CAP_MALROT);
  const icM = CL(S_CAECUM, 1, new T.Vector3(), ROT_CAP_MALROT);
  m.span_fixed_at_1   = dj1.distanceTo(ic1);
  m.span_unfixed_at_1 = djM.distanceTo(icM);
  m.fix_breaks_rigid  = Math.abs(m.span_fixed_at_1 - m.span_unfixed_at_1);
  /* and the malrotation variant's caecum is NOT in the right iliac fossa, which is the sign */
  m.caecum_x_malrot = icM.x;

  /* ---- (b2) THE ARRANGEMENT AFTER FIXATION. Every number here is read off the built centreline or
     off the solve, never off the constants the frame was built from. */
  const extentOf = (a, b, t, cap, n) => {
    n = n || 2400;
    const lo = [1e9, 1e9, 1e9], hi = [-1e9, -1e9, -1e9], v = new T.Vector3();
    for (let i = 0; i <= n; i++) {
      CL(a + (b - a) * (i / n), t, v, cap);
      const q = [v.x, v.y, v.z];
      for (let j = 0; j < 3; j++) { if (q[j] < lo[j]) lo[j] = q[j]; if (q[j] > hi[j]) hi[j] = q[j]; }
    }
    return { lo: lo, hi: hi, ext: [hi[0] - lo[0], hi[1] - lo[1], hi[2] - lo[2]] };
  };
  /* READ FROM S_DJ, NOT S_FG, and that is finding 2's doing rather than a loosened row. The pair of
     rows asks what the RIGID rotation does to the midgut's level, and the duodenum is the span over
     which the rotation is handed back — a differential rotation, a shear, which keeps some of its y by
     construction. Including it diluted both sides of the comparison with a span that is not rigidly
     rotated at all. The rigidly rotated midgut is [S_DJ, S_MG] and that is what these two measure. */
  const mgB  = extentOf(S_DJ, S_MG, 1, ROT_TOTAL);
  const mgBm = extentOf(S_DJ, S_MG, 1, ROT_CAP_MALROT);
  const sbB  = extentOf(S_DJ, S_CAECUM, 1, ROT_TOTAL);
  const coB  = extentOf(S_CAECUM, S_SIG, 1, ROT_TOTAL);
  m.midgut_ext_x = mgB.ext[0]; m.midgut_ext_y = mgB.ext[1]; m.midgut_ext_z = mgB.ext[2];
  /* THE DEFECT, AS ONE NUMBER. It was 1.9e-16 before (b2) existed. */
  m.midgut_flat_ratio = mgB.ext[1] / Math.max(1e-12, mgB.ext[0]);
  m.midgut_flat_ratio_malrot = mgBm.ext[1] / Math.max(1e-12, mgBm.ext[0]);

  const fx = fixSolve(1, ROT_TOTAL);
  m.frame_perimeter = fx.perim;
  m.colon_arc       = fx.Lcolon;
  m.colon_elongation = fx.elong;
  m.smallbowel_arc  = fx.Lsb;
  m.coil_amplitude  = fx.coil.A;
  m.coil_residual   = fx.coil.residual;
  m.coil_needed_slack = fx.coil.slack === true && fx.coil.A > 1e-6;
  m.frame_x_right = fx.xR; m.frame_x_left = fx.xL;
  /* the ascending and descending limbs, measured on the BUILT line rather than on the frame's
     corners — the corners are what the map aims at, the line is what a student sees */
  const ascMid = CL(S_CAECUM + 0.25 * (S_MG - S_CAECUM), 1, new T.Vector3(), ROT_TOTAL);
  const descMid = CL(0.5 * (S_DESC + S_SIG), 1, new T.Vector3(), ROT_TOTAL);
  m.ascending_x = ascMid.x; m.descending_x = descMid.x;
  m.colon_crosses_midline = coB.lo[0] < -FLOORS.COLON_SIDE_MIN && coB.hi[0] > FLOORS.COLON_SIDE_MIN;
  /* the coils lie within the frame, which is what "the colon frames the small bowel" MEANS */
  m.sb_within_frame = (sbB.lo[0] >= coB.lo[0] - R_GUT) && (sbB.hi[0] <= coB.hi[0] + R_GUT);
  m.sb_ext = sbB.ext; m.colon_ext = coB.ext;
  /* WHERE THE WATERSHED LANDS. Nothing places it. See the row's `why` for the disagreement this
     measurement exposes, which is declared in the scene's gaps[] rather than tuned away. */
  const ws = watershedOnTransverse(1, ROT_TOTAL);
  m.watershed_on_transverse = ws.onTransverse;
  m.watershed_across_transverse = ws.across;
  m.watershed_off_limb = ws.offLimb;
  m.colon_limbs_feasible = ws.feasible;
  m.s_hepatic_flexure = ws.hep;
  m.s_splenic_flexure = ws.spl;
  m.colon_asc_arc = ws.ascArc; m.colon_trans_arc = ws.transArc; m.colon_tot_arc = ws.totArc;
  /* the two inequalities the closed form needs, stated as the fractions a reviewer can check:
     the caecum-to-watershed stretch must be between a half and two-thirds of the colon */
  m.ws_frac_of_colon = ws.totArc > 0 ? ws.ascArc * 0 + (ws.ascArc + (2 / 3) * ws.transArc) / ws.totArc : 0;
  const fxs = fixSolve(1, ROT_TOTAL);
  m.limb_stretch = fxs.segs.map(g => g.stretch);

  /* the rotation's CONSEQUENCES, measured on C at t = 1 */
  const cae = CL(S_CAECUM, 1, new T.Vector3());
  const dj  = CL(S_DJ, 1, new T.Vector3());
  m.caecum_x = cae.x; m.caecum_y = cae.y;
  m.dj_x = dj.x;
  /* THE PAPILLA'S SIDE, which had no row at all until the 2026-10-01 review measured it on mesh
     vertices and found it on the wrong one. Its absence was half of finding 2: the battery carried a
     row for the caecum and a row for the DJ flexure — the two stations its author was already
     thinking about — and the station BETWEEN them, which the scene's narration calls one of "the two
     sentences to memorise verbatim", was unchecked. It is the duodenal C's other end, so it must come
     out on the OPPOSITE side of the midline to the DJ flexure, and both are the rotation's doing. */
  const pap = CL(S_FG, 1, new T.Vector3());
  m.papilla_x = pap.x;
  m.papilla_dj_opposite_sides = (m.papilla_x < 0) !== (m.dj_x < 0);
  /* the duodenal C, measured as the span of x its own centreline covers: a C that genuinely crosses
     the midline has both signs in it, which is a stronger statement than either end alone. */
  let dLo = 1e9, dHi = -1e9;
  for (let i = 0; i <= 80; i++) {
    const x = CL(S_DUOD_A + (S_DJ - S_DUOD_A) * (i / 80), 1, new T.Vector3()).x;
    dLo = Math.min(dLo, x); dHi = Math.max(dHi, x);
  }
  m.duod_x_lo = dLo; m.duod_x_hi = dHi;
  m.theta_final_deg = theta(1) * 180 / Math.PI;

  /* ROT-SENSE, derived rather than asserted: build the anterior camera's screen-right the way viz3d
     does and require that a positive rotation about ROT_AXIS carries screen-right towards screen-up. */
  const up = new T.Vector3(0, 1, 0);
  const backward = new T.Vector3().fromArray(VIEW_DIR.anterior).normalize();
  const screenRight = new T.Vector3().crossVectors(up, backward).normalize();
  const probe = screenRight.clone();
  const q = new T.Quaternion().setFromAxisAngle(ROT_AXIS, ROT_SIGN * 0.20);
  probe.applyQuaternion(q);
  m.rot_sense_dot_up = probe.dot(up);                 // > 0 means anticlockwise on that screen
  m.screen_right_is_left_side = screenRight.x;        // +x, and +x is the embryo's LEFT

  /* CONTINUITY OF THE ONE TUBE THROUGH BOTH BOUNDARIES — and this row is the second version.

     The first version just took the largest distance between consecutive sampled stations and put a
     ceiling on it. That conflates two different things: a genuine TEAR, and a stretch of curve that is
     merely steep. It did catch two real tears (see the note on `sep`), but it then failed on a collar
     that was continuous and only abrupt, and I went looking for a discontinuity that did not exist.

     The distinction is mechanical, so the row now makes it: REFINE THE SAMPLING. Quadruple the station
     count and a continuous curve's largest gap falls by about four; a real jump does not move at all.
     So the test is the RATIO, not the gap, and it cannot be passed by choosing a kinder ceiling.
     Steepness is then a separate question with its own row, SMOOTH, which bounds |dC/ds| — because a
     tube that turns 270 degrees over 5% of its length is continuous and still wrong. */
  const maxGap = (tt, n) => {
    let w = 0, prev = CL(0, tt, new T.Vector3());
    for (let i = 1; i <= n; i++) {
      const p = CL(i / n, tt, new T.Vector3());
      const d = p.distanceTo(prev);
      if (d > w) w = d;
      prev = p;
    }
    return w;
  };
  let worstRatio = 0, worstRatioT = 0, worstSlope = 0, worstSlopeT = 0, worstSlopeS = 0;
  for (let k = 0; k <= 20; k++) {
    const tt = k / 20;
    const g1 = maxGap(tt, 600), g4 = maxGap(tt, 2400);
    const ratio = g1 > 1e-12 ? g4 / g1 : 0;
    if (ratio > worstRatio) { worstRatio = ratio; worstRatioT = tt; }
    /* |dC/ds| on the fine sampling */
    const n = 2400; let prev = CL(0, tt, new T.Vector3());
    for (let i = 1; i <= n; i++) {
      const ss = i / n, p = CL(ss, tt, new T.Vector3());
      const slope = p.distanceTo(prev) * n;
      if (slope > worstSlope) { worstSlope = slope; worstSlopeT = tt; worstSlopeS = ss; }
      prev = p;
    }
  }
  m.cont_refine_ratio = worstRatio;      // ~0.25 for a continuous curve, ~1.0 at a jump
  m.cont_refine_ratio_t = worstRatioT;
  m.slope_max = worstSlope; m.slope_max_t = worstSlopeT; m.slope_max_s = worstSlopeS;

  /* recanalization: the lumen closes in the duodenum and reopens */
  const sMid = 0.5 * (S_DUOD_A + S_DUOD_B);
  let minL = 1e9, minT = 0;
  for (let k = 0; k <= 400; k++) { const tt = k / 400, v = lumenAt(sMid, tt); if (v < minL) { minL = v; minT = tt; } }
  m.lumen_min = minL; m.lumen_min_t = minT;
  m.lumen_final = lumenAt(sMid, 1);
  m.lumen_elsewhere_during_plug = lumenAt(0.60, minT);   // the plug is LOCAL to the duodenum

  /* the vitelline duct narrows */
  m.vitelline_r0 = vitellineR(0); m.vitelline_r1 = vitellineR(1);
  m.vitelline_narrow = vitellineR(0) / Math.max(1e-9, vitellineR(1));

  /* the enteric front: cranio-caudal, complete only at the end; and the aganglionic span when it stops */
  m.front_mid = frontAt(0.5);
  m.front_end = frontAt(1);
  const stop = 0.86;
  m.agang_from = frontAt(1, stop);
  m.agang_includes_rectum = frontAt(1, stop) < 1 - 1e-9;   // s = 1 left bare: the rectum

  /* the boundary bead lies strictly inside the duodenum's own span */
  m.papilla_inside_duodenum = (S_FG > S_DUOD_A + 1e-6) && (S_FG < S_DUOD_B - 1e-6);
  /* THE MARKERS-STAND-CLEAR CHECK IS NOT HERE, AND THE FIRST VERSION OF IT WAS — as
     BEAD_PROUD * radiusAt(st) / radiusAt(st), which is BEAD_PROUD. A row whose measured side cancels
     to a compile-time constant cannot fail, which is the exact fault lateral-folding's round-1 review
     found and this file's own ACCEPTANCE note warns about; I wrote it anyway. It belongs where the
     built vertices are, so it is row mesh/markers-stand-clear in the render harness, which reads each
     marker's own bbox against radiusAt at its station. */

  /* the arterial origins descend in order */
  m.artery_order_ok = (yAnat(S_FG) + 0.30) > Y_RING && Y_RING > (yAnat(S_MG) - 0.34);

  /* the midgut is the longest division by arc length — the reason it is the one that herniates */
  m.frac_foregut = S_FG; m.frac_midgut = S_MG - S_FG; m.frac_hindgut = 1 - S_MG;
  m.midgut_is_longest = (S_MG - S_FG) > S_FG && (S_MG - S_FG) > (1 - S_MG);

  return m;
}

const ROWS = [
  { id: 'HERNIA-OPEN',  pass: m => m.hernia_window_open === true,
    why: 'the midgut must outgrow the cavity at some t, or there is no hernia to teach',
    perturb: ['MG_LEN_1', 'CAP_0', 'CAP_EXP'] },
  { id: 'HERNIA-RETURN', pass: m => m.hernia_window_closes === true,
    why: '"it returns by about week ten" — the window must CLOSE before t = 1',
    perturb: ['CAP_1', 'CAP_EXP'] },
  { id: 'HERNIA-SOLVE', pass: m => m.hernia_closes_identity < 1e-9,
    why: 'the solved d must satisfy loopLen(d) = excess to machine precision, not approximately',
    perturb: ['R_RING'] },
  { id: 'HERNIA-PROUD', pass: m => m.hernia_peak_d >= FLOORS.HERNIA_D_MIN,
    why: 'at its peak the loop must stand clear of the wall, or the beat shows nothing',
    perturb: ['MG_LEN_1', 'R_RING'] },
  { id: 'ROT-TOTAL',    pass: m => Math.abs(m.theta_final_deg - 270) < 1e-6,
    why: 'the total rotation is 270 degrees and it is examined as that number',
    perturb: ['ROT_TOTAL'] },
  { id: 'ROT-SENSE',    pass: m => m.rot_sense_dot_up > 0 && m.screen_right_is_left_side > 0,
    why: 'anticlockwise FROM THE FRONT must be a positive rotation about +z, DERIVED from viz3d\'s ' +
         'own anterior camera — the scene gaps[] call getting this backwards the commonest error here',
    perturb: ['ROT_SIGN'] },
  { id: 'CAEC-R',       pass: m => m.caecum_x <= FLOORS.CAEC_X_MAX,
    why: 'the 270 degrees must land the caecum on the embryo\'s RIGHT (-x): the right iliac fossa. ' +
         'Nothing places it there — the rotation does, and this row is the only thing that knows',
    perturb: ['ROT_SIGN', 'ROT_TOTAL', 'S_CAECUM'] },
  { id: 'DJ-L',         pass: m => m.dj_x >= FLOORS.DJ_X_MIN,
    why: 'and the duodenojejunal flexure on the LEFT (+x), by the same rotation. READ AT S_DJ, the ' +
         'DISTAL end of the duodenum: it was read 0.02 past the papilla until 2026-10-01, which is ' +
         'inside the duodenum, so this row and PAP-R were measuring effectively the same point',
    perturb: ['ROT_SIGN', 'ROT_TOTAL'] },
  { id: 'PAP-R',        pass: m => m.papilla_x <= FLOORS.PAP_X_MAX,
    why: 'THE MAJOR DUODENAL PAPILLA ON THE EMBRYO\'S RIGHT (-x) at t = 1. The papilla lies in the ' +
         'second, descending part of the duodenum, which is right of the midline; only the DJ flexure ' +
         'crosses over. This row did not exist until the 2026-10-01 review measured the papilla at ' +
         'x = +0.271 — the embryo\'s LEFT, level with the splenic flexure — and the scene\'s own ' +
         'narration had been written to agree with the wrong picture. Nothing places it: the rotation ' +
         'collar does, and this row and DJ-L together are the only things that know',
    perturb: ['ROT_SIGN', 'ROT_TOTAL', 'S_DUOD_A', 'S_DUOD_B'] },
  { id: 'DUOD-C',       pass: m => m.papilla_dj_opposite_sides === true &&
                                   m.duod_x_lo <= FLOORS.PAP_X_MAX && m.duod_x_hi >= FLOORS.DJ_X_MIN,
    why: 'and the duodenum between them is a C that CROSSES the midline — its centreline reaches both ' +
         'sides, so the two ends are not merely labelled right and left but separated by the sweep ' +
         'that carries one to each. PAP-R and DJ-L can both pass on a tube that happens to span the ' +
         'midline once; this row requires the C, and it is what would have failed loudest on the ' +
         'geometry the review rejected, where papilla and DJ flexure were both on the left',
    perturb: ['ROT_SIGN', 'ROT_TOTAL', 'S_DUOD_A', 'S_DUOD_B'] },
  { id: 'ROOT-BROAD',   pass: m => m.root_ratio >= FLOORS.ROOT_RATIO,
    why: 'the fixed root must be markedly broader than the unfixed pedicle. MEASURED on the built ' +
         'line at both ends, the malrotation side from the model\'s own variant. What this does NOT ' +
         'prove is the causal link: fixation is PRESCRIBED and gated on the turn completing — see the ' +
         'long note at (b), which records that the first version of this row was a constant',
    perturb: ['PEDICLE', 'S_FG', 'S_MG'] },
  { id: 'ROOT-NARROW',  pass: m => m.root_malrot <= FLOORS.ROOT_90_MAX,
    why: 'and the malrotation case must be narrow in ABSOLUTE terms, not merely narrower — a pivot',
    perturb: ['PEDICLE'] },
  { id: 'ROT-RIGID',    pass: m => m.span_invariance < 1e-9,
    why: 'the duodenojejunal-to-ileocaecal span is IDENTICAL at 90 and 270 degrees, because a rigid ' +
         'rotation preserves distances. This row exists to keep the next run from re-deriving the ' +
         'broad base from the rotation angle: it cannot be done, and this is the proof. READ AT ' +
         'T_ROT270, not at t = 1: section (b2) added a fixation term that is deliberately NOT rigid, ' +
         'so t = 1 no longer answers the question this row asks. T_ROT270 is the instant the turn ' +
         'completes and fixAt() switches on — the last t at which the rotation is the only thing ' +
         'that has happened. Row FIX-BREAKS-RIGID carries the other half, and the two together say ' +
         'what one row used to: the rotation cannot produce the broad root, and fixation can',
    perturb: ['ROT_TOTAL'] },
  { id: 'FIX-BREAKS-RIGID', pass: m => m.fix_breaks_rigid >= FLOORS.FIX_BREAKS_MIN,
    why: 'and at t = 1, where fixation HAS run, that same span must have MOVED. Without this row ' +
         'ROT-RIGID could be satisfied by a fixation term that does nothing at all, which is exactly ' +
         'the state this model was in before (b2): invariance everywhere, and a flat pinwheel',
    perturb: ['Y_ILIAC', 'Y_TRANS', 'SB_TURNS'] },
  { id: 'MIDGUT-NOT-FLAT', pass: m => m.midgut_flat_ratio >= FLOORS.FLAT_RATIO_MIN,
    why: 'THE ROW THIS WHOLE SECTION EXISTS FOR. A rigid rotation about +z maps the midgut\'s LEVEL ' +
         'onto its SIDE, so before fixation the midgut\'s y extent was 1.9e-16 against an x extent ' +
         'of 0.738 — a flat pinwheel that passed 23 acceptance rows, winding 1.000, normals 1.000, ' +
         'a clean console and an open-lumen probe, because not one of them asked whether the thing ' +
         'had the SHAPE of a gut. Expressed as a RATIO so it survives a rescale',
    perturb: ['Y_ILIAC', 'Y_TRANS'] },
  { id: 'MALROT-FLAT', pass: m => m.midgut_flat_ratio_malrot <= FLOORS.MALROT_FLAT_MAX,
    why: 'and the NEGATIVE CASE for it, which is what makes the row above evidence rather than a ' +
         'number that happens to be large: the malrotation variant never completes the turn, so ' +
         'fixAt() is zero for ever and its midgut must still BE flat. If this row ever passes at the ' +
         'same time as MIDGUT-NOT-FLAT fails, the fixation term is drawing the frame unconditionally',
    perturb: ['ROT_CAP_MALROT'] },
  { id: 'COLON-FRAME',  pass: m => m.ascending_x <= -FLOORS.COLON_SIDE_MIN &&
                                   m.descending_x >= FLOORS.COLON_SIDE_MIN &&
                                   m.colon_crosses_midline === true,
    why: 'the picture itself: the ascending colon runs up the embryo\'s RIGHT, the descending down ' +
         'its LEFT, and the transverse crosses between them. Measured on the built centreline at ' +
         'three places, with a magnitude floor on each side rather than a sign test — a sign test ' +
         'here would be satisfied by a frame one gut-radius wide',
    perturb: ['ROT_SIGN', 'Y_TRANS'] },
  { id: 'COLON-ELONGATES', pass: m => m.colon_elongation >= FLOORS.ELONG_MIN,
    why: 'the frame is LONGER than the colon that was asked to lie on it, which is why this section ' +
         'is called elongation. I first built it as an isometry and solved the gutter width by ' +
         'bisection on perimeter = colon arc; that equation has no root in this model (colon 1.313, ' +
         'shortest reaching frame 2.29), the solve drove the gutters to their lower bound and the ' +
         'frame collapsed onto the midline. The ratio is REPORTED, not fitted: about 1.83 at t = 1',
    perturb: ['Y_ILIAC', 'Y_TRANS', 'S_CAECUM'] },
  { id: 'COIL-SOLVED', pass: m => m.coil_residual < 1e-9 && m.coil_needed_slack === true,
    why: 'and the one thing here that IS solved: the jejunoileal coil\'s amplitude satisfies ' +
         '`coiled arc length = the small bowel\'s own arc length` to machine precision. The second ' +
         'half of the test matters as much as the first — the solve must have had slack to absorb, ' +
         'or the bowel was not too long for its course and the coil is decoration',
    perturb: ['SB_TURNS', 'MG_LEN_1'] },
  { id: 'SB-IN-FRAME', pass: m => m.sb_within_frame === true,
    why: 'the coils lie WITHIN the colonic frame, which is what "the colon frames the small bowel" ' +
         'means and is the single thing that makes the picture readable as an abdomen',
    perturb: ['SB_TURNS'] },
  { id: 'COLON-LIMBS-FEASIBLE', pass: m => m.colon_limbs_feasible === true &&
                                             m.ws_frac_of_colon > 0.5 && m.ws_frac_of_colon < 2 / 3,
    why: 'THE NON-CIRCULAR HALF of the watershed work, and the row to read first. The two flexure ' +
         'stations are solved from "the watershed lies 2/3 along the transverse" plus "the ascending ' +
         'and descending limbs carry equal arc", which in closed form needs the caecum-to-watershed ' +
         'stretch to be between a HALF and TWO-THIRDS of the colon\'s arc — below a half the ' +
         'transverse limb has negative length, above two-thirds the ascending limb does. Neither is ' +
         'something this model was built to guarantee: it is a question about whether the s-table and ' +
         'the 2/3 convention can both be true, and an s-table that moved S_CAECUM or S_MG far enough ' +
         'would fail it. Measured: 0.570, inside the window with room on both sides',
    perturb: ['S_CAECUM', 'S_MG', 'S_DESC'] },
  { id: 'WATERSHED-ON-TRANSVERSE', pass: m => m.watershed_on_transverse === true &&
                                              Math.abs(m.watershed_across_transverse - 2 / 3) < 1e-6 &&
                                              m.watershed_off_limb < 1e-6,
    why: 'the watershed lands on the transverse limb, 2/3 across it from the hepatic flexure, and ' +
         'exactly ON the limb rather than near it (off-limb distance < 1e-6). READ THIS ROW WITH ITS ' +
         'LIMITS IN VIEW: since the flexure stations are SOLVED from that 2/3, this row checks the ' +
         'CONSTRUCTION and not the anatomy — the 2/3 is an input, declared in the scene gaps[], and ' +
         'COLON-LIMBS-FEASIBLE above is the half of the pair that can fail on the geometry. It is ' +
         'kept because a mapping bug is exactly what it catches: under the first version of the map, ' +
         'one uniform stretch for the whole colon, this measured 0.415 and then 0.246 when the frame ' +
         'was enlarged — a quarter of the way across, for the boundary that explains why the ' +
         'transverse colon has two blood supplies',
    perturb: ['S_MG', 'S_CAECUM'] },
  { id: 'MALROT-CAEC',  pass: m => m.caecum_x_malrot > FLOORS.CAEC_X_MAX,
    why: 'and the malrotation variant must NOT put the caecum in the right iliac fossa — otherwise ' +
         'the lesion and the normal case render the same picture',
    perturb: ['ROT_CAP_MALROT'] },
  { id: 'CONT',         pass: m => m.cont_refine_ratio <= FLOORS.REFINE_MAX,
    why: 'ONE tube: the rigid midgut rotation must not tear it open at the papilla or the watershed. ' +
         'Tested by REFINEMENT — quadrupling the sampling must shrink the largest gap by about four, ' +
         'which a genuine jump does not do. Two real tears were found by the first version of this ' +
         'row and a third thing it reported was not a tear at all; the ratio test tells them apart',
    perturb: ['COLLAR', 'ROT_TOTAL', 'R_RING'] },
  { id: 'SMOOTH',       pass: m => m.slope_max <= FLOORS.SLOPE_MAX,
    why: 'and the turn must be spread over a real anatomical span, not crammed into a kink. The ' +
         'collar IS the duodenum, which is the segment that anatomically takes up the transition',
    perturb: ['COLLAR'] },
  { id: 'RECAN-CLOSES', pass: m => m.lumen_min < 1e-9,
    why: 'the duodenal lumen is obliterated — a SOLID CORD stage, so the lumen reaches zero',
    perturb: ['PLUG_T0', 'PLUG_T1'] },
  { id: 'RECAN-OPENS',  pass: m => m.lumen_final > 0.5,
    why: 'and it must recanalize: patent by t = 1, or every student sees an atresia',
    perturb: ['PLUG_T1'] },
  { id: 'RECAN-LOCAL',  pass: m => m.lumen_elsewhere_during_plug > 0.5,
    why: 'the plug is LOCAL to the duodenum — duodenal atresia is a recanalization failure and ' +
         'jejunal/ileal atresia is not, which is the distinction the beat turns on',
    perturb: ['S_DUOD_A', 'S_DUOD_B'] },
  { id: 'VIT-NARROW',   pass: m => m.vitelline_narrow >= FLOORS.VIT_NARROW,
    why: 'the vitelline duct narrows to a thread, and its calibre is DERIVED from the gut aperture',
    perturb: ['AP_1'] },
  { id: 'ENT-CAUDAL',   pass: m => m.front_mid < m.front_end && m.front_end > 0.999,
    why: 'neural crest colonisation is cranio-caudal and complete only at the end',
    perturb: ['ENT_START', 'ENT_END'] },
  { id: 'ENT-RECTUM',   pass: m => m.agang_includes_rectum === true,
    why: 'so a front that stops short ALWAYS leaves the rectum bare — Hirschsprung involving the ' +
         'rectum is a consequence of the direction of migration, not a fact to memorise',
    perturb: ['ENT_END'] },
  { id: 'PAP-IN-DUOD',  pass: m => m.papilla_inside_duodenum === true,
    why: 'the foregut/midgut boundary runs THROUGH the duodenum — that is why it has a double supply',
    perturb: ['S_DUOD_A', 'S_DUOD_B', 'S_FG'] },
  { id: 'ART-ORDER',    pass: m => m.artery_order_ok === true,
    why: 'coeliac, superior mesenteric, inferior mesenteric descend the aorta in that order (T12/L1/L3)',
    perturb: ['S_FG', 'S_MG'] },
  { id: 'MG-LONGEST',   pass: m => m.midgut_is_longest === true,
    why: 'the midgut is the longest division, which is WHY it is the one that outgrows the cavity. ' +
         'If these three were comparable there would be no hernia to explain',
    perturb: ['S_FG', 'S_MG'] },
];

/* ============================================ THE CLAIM VOCABULARY, for check-beat-claims.mjs

   RENDER-STANDARD: "a time-varying scene checks its own narration against the model, beat by beat".
   The tool evaluates each view's claims[] at that view's own SET_STAGE t, then DISPLACES the beat and
   requires at least one claim to stop being true — so a measure is only worth writing here if it
   MOVES with t. Every name below is a pure function of t reading the same functions the geometry is
   built from; nothing restates a constant.

   The vocabulary lives in the model, beside the functions it reads, rather than in the tool — which
   is what `claimMeasure` is for. A model without it takes the tool's cardiac-cycle path. */
function claimMeasure(name, t) {
  const V = () => new T.Vector3();
  switch (name) {
    /* the rotation */
    case 'theta_deg':        return theta(t) * 180 / Math.PI;
    /* the hernia, read off the solve */
    case 'hernia_d':         return herniaAt(t).d;
    case 'herniated':        return herniaAt(t).herniated === true;
    case 'excess':           return excess(t);
    case 'midgut_len':       return mgLen(t);
    case 'cavity_len':       return capLen(t);
    /* fixation, and the arrangement it produces */
    case 'fix':              return fixAt(t, ROT_TOTAL);
    case 'colon_elongation': return fixSolve(t, ROT_TOTAL).elong;
    case 'coil_amplitude':   return fixSolve(t, ROT_TOTAL).coil.A;
    case 'watershed_across': return watershedOnTransverse(t, ROT_TOTAL).across;
    /* where named stations actually are, at this t */
    case 'caecum.x':         return CL(S_CAECUM, t, V()).x;
    case 'caecum.y':         return CL(S_CAECUM, t, V()).y;
    case 'dj.x':             return CL(S_DJ, t, V()).x;
    /* THE PAPILLA'S SIDE, AS A CLAIM A BEAT CAN BE HELD TO. Finding 2 of the 2026-10-01 review ended
       "never the words before the geometry"; this is what lets the words be checked against the
       geometry at the beat's own instant, so a narration that says "on the right" fails the moment a
       future change carries the papilla back across the midline. */
    case 'papilla.x':        return CL(S_FG, t, V()).x;
    case 'duodenum.x_lo':
    case 'duodenum.x_hi': {
      let lo = 1e9, hi = -1e9;
      for (let i = 0; i <= 120; i++) {
        const x = CL(S_DUOD_A + (S_DJ - S_DUOD_A) * (i / 120), t, V()).x;
        if (x < lo) lo = x; if (x > hi) hi = x;
      }
      return name === 'duodenum.x_lo' ? lo : hi;
    }
    case 'apex.z':           return CL(S_APEX, t, V()).z;
    /* THE SHAPE OF THE MIDGUT, as one number — the defect section (b2) exists for. It is 0 at every
       t before the turn completes and must be substantial after it. */
    case 'midgut_flat_ratio': {
      const lo = [1e9, 1e9], hi = [-1e9, -1e9], v = V();
      /* S_DJ, matching measure() — see the note there: the duodenum is the hand-back span and is not
         rigidly rotated, so including it dilutes what this ratio is asking. */
      for (let i = 0; i <= 900; i++) {
        CL(S_DJ + (S_MG - S_DJ) * (i / 900), t, v);
        if (v.x < lo[0]) lo[0] = v.x; if (v.x > hi[0]) hi[0] = v.x;
        if (v.y < lo[1]) lo[1] = v.y; if (v.y > hi[1]) hi[1] = v.y;
      }
      return (hi[1] - lo[1]) / Math.max(1e-12, hi[0] - lo[0]);
    }
    /* the other schedules a beat narrates */
    case 'duodenal_lumen':   return lumenAt(0.5 * (S_DUOD_A + S_DUOD_B), t);
    /* the SOLID CORD as its own measure, so a beat can pin a claim to the plug being there (or gone)
       rather than only to the channel being narrow. Added 2026-10-01 with the plug's geometry. */
    case 'duodenal_plug':    return plugFrac(0.5 * (S_DUOD_A + S_DUOD_B), t);
    case 'jejunal_lumen':    return lumenAt(0.60, t);
    case 'enteric_front':    return frontAt(t);
    case 'vitelline_r':      return vitellineR(t);
    case 'septum_descent':   return clamp((t - P0) / (P1 - P0), 0, 1);
  }
  throw new Error('primitive-gut-tube: unknown claim measure: ' + name);
}

let _acc = null;
function acceptance() {
  if (_acc) return _acc;
  const m = measure();
  const rows = ROWS.map(r => {
    let ok = false, err = null;
    try { ok = !!r.pass(m); } catch (e) { err = e && e.message; }
    return { id: r.id, pass: ok, why: r.why, perturb: r.perturb, error: err };
  });
  _acc = {
    allPass: rows.every(r => r.pass),
    rows: rows,
    measured: m,
    floors: FLOORS,
    axes: 'The embryo\'s RIGHT is -x and its LEFT is +x; CRANIAL is +y and CAUDAL is -y; VENTRAL is ' +
          '+z and DORSAL is -z. Units are model units, not anatomical millimetres.',
  };
  return _acc;
}

let _asserted = false;
function assertAcceptance() {
  if (_asserted) return;
  _asserted = true;
  const a = acceptance();
  if (!a.allPass) {
    const bad = a.rows.filter(r => !r.pass).map(r => r.id).join(', ');
    /* THROW, do not warn. A model that fails its own battery and renders anyway is the thing that
       reaches a student as a confident wrong picture. */
    throw new Error('primitive-gut-tube: acceptance FAILED: ' + bad);
  }
}

function build(t, opts) { assertAcceptance(); return buildGut(t, opts); }

/* ========================================================== the provider contract */

window.MB3D_MODELS = window.MB3D_MODELS || {};
window.MB3D_MODELS['primitive-gut-tube'] = {
  LAYERS: LAYERS,
  build: build,
  /* every BENIGN optional part on, so a structure behind a flag is still resolvable and the player
     never tells a student "there is no model of this structure" about a model sitting right there.
     The malformations are NOT here: they are VARIANTS asked for in the ref, exactly as
     lateral-folding's four lesions are, because a defect baked into FULL would punch a hole in every
     view in the corpus that resolves through it. */
  FULL: FULL_OPTS,
  VARIANTS: {
    malrotation: 'the turn stopped at 90 degrees. Everything follows from that one cap: the limbs are ' +
                 'reversed, the caecum is not in the right iliac fossa, fixation never starts and the ' +
                 'mesenteric root stays the narrow pedicle the midgut can twist on. Ask for it as ' +
                 '"primitive-gut-tube#mesentery@1+malrotation"',
    highARM:     'a urorectal septum that stops short of the cloacal membrane — the HIGH anorectal ' +
                 'malformation, with the rectum left communicating ventrally. Ask for it as ' +
                 '"primitive-gut-tube#urorectal@1+highARM"',
    entericStop: 'the s at which the neural crest front stops. The adapter\'s ref flags are booleans, ' +
                 'so "...#enteric@1+entericStop" means the DECLARED rectosigmoid stop, s = ' +
                 ENTERIC_STOP_DEFAULT + '; passing opts.entericStop as a number overrides it. Until ' +
                 '2026-10-01 the boolean form reached frontAt as Math.min(f, true) and drew the ' +
                 'NORMAL front, so the ref named a disease and rendered a healthy gut. The ' +
                 'aganglionic segment always reaches s = 1 by construction',
  },
  /* WHICH PARTS DO NOT MOVE WITH t, declared rather than discovered, because a part that quietly
     built the same geometry at every t would sit still while its neighbours walked the stages and the
     picture would look entirely fine. The harness asserts this list against the real adapter. */
  STATIC_PARTS: {
    aorta:    'a straight dorsal vessel at fixed y extent; the aorta\'s own development is not this ' +
              'model\'s subject and is prescribed',
    bodywall: 'a plane at fixed z. The closure of the ventral wall is lateral-folding\'s subject and ' +
              'is NOT modelled here — this wall is the thing the hernia is outside of, nothing more',
    umbring:  'a torus of the aperture radius at a fixed station. It is the HOLE the solve uses, so ' +
              'it must not move independently of R_RING, and it does not',
  },
  /* WHICH PARTS ARE NOT THERE AT EVERY t. An undeclared absence reaches a student as "there is no
     model of this structure", which is a fact about the corpus and not about development. */
  STAGE_LIMITED: {
    buccoph:    'ruptures in week 4: absent for t >= 0.30',
    cloacalmem: 'ruptures in week 7: absent for t >= 0.74',
    urorectal:  'the septum does not exist before the descent begins: absent for t < ' + P0,
    anorectal:  'exists only once the septum has divided the cloaca: absent until the descent passes 0.45',
    urogenital: 'as anorectal',
    enteric:    'the crest has not entered the gut before t = ' + ENT_START,
    appendix:   'a distinct caecal diverticulum from about week 6: absent for t < 0.34. It was ' +
                'previously built at EVERY t and had zero length at t = 0 — see the note at its builder',
    duod_lumen: 'the channel is OBLITERATED at the peak of the epithelial plug, so there is no lumen ' +
                'to cast at t = ' + (0.5 * (PLUG_T0 + PLUG_T1)) + ' — the absence IS the solid-cord ' +
                'stage. It is thin either side of that instant and full calibre away from the window',
    duod_plug:  'the proliferating epithelium exists only in the recanalization window: absent for ' +
                't <= ' + PLUG_T0 + ' and t >= ' + PLUG_T1,
  },
  /* exported so the render harness re-measures these on REAL MESH VERTICES and PERTURBS the constants
     each row reads, rather than keeping its own copy of the derivation */
  AXES: AXES,
  VIEW_DIR: VIEW_DIR,
  acceptance: acceptance,
  measure: measure,
  claimMeasure: claimMeasure,
  ROWS: ROWS,
  FLOORS: FLOORS,
  CL: CL,
  radiusAt: radiusAt,
  lumenAt: lumenAt,
  plugFrac: plugFrac,
  LUMEN_OPEN: LUMEN_OPEN,
  inDuodWin: inDuodWin,
  rootPoint: rootPoint,
  rootLength: rootLength,
  theta: theta,
  thetaAt: thetaAt,
  herniaAt: herniaAt,
  solveHernia: solveHernia,
  loopLen: loopLen,
  excess: excess,
  mgLen: mgLen,
  capLen: capLen,
  frontAt: frontAt,
  entericStopOf: entericStopOf,
  ENTERIC_STOP_DEFAULT: ENTERIC_STOP_DEFAULT,
  vitellineR: vitellineR,
  apertureFrac: apertureFrac,
  HERNIA_WINDOW: HERNIA_WINDOW,
  HERNIA_PEAK: HERNIA_PEAK,
  ROOT_RATIO: ROOT_RATIO,
  ROOT_NORMAL: ROOT_NORMAL,
  ROOT_MALROT: ROOT_MALROT,
  PEDICLE: PEDICLE,
  fixAt: fixAt,
  /* the fixation arrangement, exported so the harness re-measures the two solves and perturbs the
     constants they read rather than keeping a second copy of the derivation */
  fixSolve: fixSolve,
  fixTarget: fixTarget,
  fixDisp: fixDisp,
  rotPoint: rotPoint,
  solveCoil: solveCoil,
  watershedOnTransverse: watershedOnTransverse,
  arcOfBulge: arcOfBulge,
  ROT_CAP_MALROT: ROT_CAP_MALROT,
  ROT_TOTAL_FOR_PROBE: ROT_TOTAL,
  windingSwapTotal: function () { return _windingSwapTotal; },
  T_ROT90: T_ROT90,
  T_ROT270: T_ROT270,
  STATIONS: { S_FG: S_FG, S_MG: S_MG, S_APEX: S_APEX, S_CAECUM: S_CAECUM,
              S_DUOD_A: S_DUOD_A, S_DUOD_B: S_DUOD_B, S_DESC: S_DESC, S_SIG: S_SIG },
  FIXGEOM: { Y_TRANS: Y_TRANS, Y_ILIAC: Y_ILIAC, Z_COLON: Z_COLON, Z_SB: Z_SB, SB_TURNS: SB_TURNS,
             DJ_FRAC: DJ_FRAC, DJ_DROP: DJ_DROP, SB_DEPTH: SB_DEPTH },
  GEOM: { Y_CRANIAL: Y_CRANIAL, Y_CAUDAL: Y_CAUDAL, Z_DORSAL: Z_DORSAL, Z_WALL: Z_WALL,
          Y_RING: Y_RING, R_RING: R_RING, R_GUT: R_GUT, R_STOMACH: R_STOMACH, R_CLOACA: R_CLOACA },
  MARKERS: { BEAD_PROUD: BEAD_PROUD, CAECUM_PROUD: CAECUM_PROUD },
  PLUG_PEAK_T: 0.5 * (PLUG_T0 + PLUG_T1),
  SCHEDULE: { P0: P0, P1: P1, PLUG_T0: PLUG_T0, PLUG_T1: PLUG_T1,
              ENT_START: ENT_START, ENT_END: ENT_END, CAP_EXP: CAP_EXP, COLLAR: COLLAR },
};

})();
