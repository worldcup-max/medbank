/* MedBank · lateral folding of the embryo — PRODUCTION procedural model.
 *
 * Registers MB3D_MODELS['lateral-folding']: LAYERS, build(t, opts) -> THREE.Group whose meshes
 * carry userData.key, and FULL so every benign optional layer is resolvable.
 *
 * WRAPPED IN AN IIFE. Only the registration escapes. RENDER-STANDARD: a model written at top level
 * puts T, K, C, LAYERS and every constant into global lexical scope and the NEXT model to load dies
 * on "Identifier 'T' has already been declared", taking the page with it.
 *
 * WHAT t MEANS. t = 0 is the FLAT TRILAMINAR DISC at the start of week 4 (about day 21), cut across
 * the trunk: amniotic cavity above, disc in the middle, yolk sac hanging below. t = 1 is the
 * CYLINDRICAL EMBRYO of about day 28 — an outer tube of body wall around an inner tube of gut, with
 * one hole left at the umbilicus. The scene's narration says "week 4" throughout and the two agree.
 *
 * AXES. +x = embryo's LEFT, -x = RIGHT, +y = CRANIAL, +z = VENTRAL.
 *
 *   THIS PARAGRAPH USED TO SAY THE CONVENTION WAS "measured from BodyParts3D right/left pairs (see
 *   cardiac-looping.js), not assumed here", AND THAT WAS FALSE. Nothing measured it. cardiac-looping
 *   is a procedural model in its own units that declares the same convention in the same way, so the
 *   citation pointed at a second comment; and acceptance row I, the only test in this file that
 *   touches a side, asserts the gastroschisis window lies at x < 0 — which is the SAME STATEMENT as
 *   the declaration rather than a check on it. Review round 2 measured the model voxel-wise and found
 *   every structure it draws mirror-symmetric in x apart from the lesions themselves: there was no
 *   left/right landmark in it at all, so flipping the sign here left all 15 acceptance rows passing
 *   and taught LEFT-sided gastroschisis, which a student IS marked wrong for. RENDER-STANDARD now
 *   carries the rule that finding produced: A DECLARED AXIS IS NOT A PROVED ONE, AND A SYMMETRIC
 *   MODEL CANNOT PROVE ITS OWN.
 *
 *   IT IS NOW PROVED, by that rule's route (b): viz-training/tools/prove-corpus-axes.mjs measures the
 *   handedness off the SCAN DATA — six BodyParts3D right/left pairs, from six regions, read through
 *   the same ids the bodyparts3d adapter resolves — and checks the AXES below against it. The step
 *   that makes it non-circular is that viz3d.js's adapter applies NO transform to a loaded STL, so
 *   the corpus frame IS the BodyParts3D frame and "which sign of x is the body's right" is a
 *   question about the files. Every one of the six answers -x, by 0.58 to 2.98 of the pair's own mean
 *   x extent. Flip the string below and that tool fails; it is run by render-lateral-folding.mjs and
 *   its result is reported there.
 *
 * THE MECHANISM, AND THE ONE THING THAT IS SOLVED RATHER THAN TUNED.
 *
 *   Lateral folding is a transverse story: two sheets, each of FIXED ARC LENGTH, curl ventrally
 *   until their free edges meet in the ventral midline. Nothing lengthens and nothing stretches —
 *   what changes is curvature. So the model carries the constraint (arc length is conserved) and
 *   SOLVES the curvature amplitude at every t and at every cranio-caudal station, by bisection,
 *   against the gap the schedule asks for. A tuned bend amplitude would drift out of agreement with
 *   the anatomy the moment anything else changed; a solved one cannot.
 *
 *   TWO constants are solved once, at module load, and they are the pair that decides the examinable
 *   relation — that the wall CLOSES and that it closes WITHOUT A CORNER:
 *
 *     lam*  the curvature amplitude at full closure, so the free edge lands exactly on the midline
 *     a*    how much of that curvature is concentrated at the lateral hinge, so the total turning is
 *           exactly pi and the two edges meet TANGENT TO ONE ANOTHER rather than at a kink
 *
 *   One parameter can satisfy x_end = 0 or theta_end = pi, not both; the shape of the hinge is the
 *   second unknown and it is what makes the linea alba a join rather than a crease. Both are solved
 *   numerically at load, printed by acceptance(), and re-measured on real mesh vertices by
 *   viz-training/tools/render-lateral-folding.mjs.
 *
 *   AND THE ANSWER IS a* = 0, WHICH IS A RESULT AND NOT A SETTING. The solver was written expecting
 *   to find a lateral hinge, because that is how the fold is drawn. It finds none: a sheet of fixed
 *   arc length that closes ON the midline TANGENT to its other half is a circle, so every unit of
 *   curvature moved out to the lateral edge is paid for with a crease at the linea alba. The hinge
 *   weight is therefore left at what the solve returns rather than at what the drawing suggested,
 *   and solveClosure() is kept — it costs one bisection at load — so that the claim is re-derived on
 *   every run instead of being a comment. Change HINGE_C, HINGE_W or the closure condition and it
 *   will say what the new a* is.
 *
 * WHAT IS *NOT* SOLVED, said here rather than left to be discovered:
 *   - the closure SCHEDULE (how much of the gap is shut at a given t) is prescribed and linear;
 *   - the amnion is a prescribed enclosing loop — extraembryonic context, not examinable geometry;
 *   - the yolk sac balloon is a prescribed ellipse. Its NECK is not: the neck width IS the gut's
 *     own solved free-edge gap, so "the wide connection narrows to the vitelline duct" is measured
 *     geometry and not a caption;
 *   - the dorsal mesentery's thinning schedule is prescribed; its TAPER to nothing at the gut is a
 *     RENDER-STANDARD requirement and is asserted.
 *
 * GEOMETRY NOTE. Every sheet is a CLOSED SOLID SLAB — outer face, inner face and a rim all round —
 * not a zero-thickness skin. That costs triangles and it means a cut end reads as a wall, an
 * outward-normal probe means something, and a ray cast into the umbilical ring meets the far wall's
 * inner surface facing it rather than a backface. Nothing in this model shares a surface with
 * anything else.
 */
(function () {

const T = window.THREE;
const K = window.VizKit;   // render-kit.js must load first — it owns winding, normals and colour
const C = K.C;

/* THE AXIS CONVENTION, MACHINE-READABLE, so a tool checks it rather than a reader.
   prove-corpus-axes.mjs reads BOTH this object and the prose string in ACCEPTANCE.axes and requires
   them to agree with each other AND with the meshes; two forms that can disagree is precisely the
   failure it exists to catch. */
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
  amnion:       { color: 0x9fb9d8, name: 'Amnion' },
  ectoderm:     { color: 0x2f7fc4, name: 'Ectoderm' },
  somatic:      { color: 0x2f5f9e, name: 'Somatic (parietal) mesoderm' },
  coelom:       { color: 0xe0873a, name: 'Intraembryonic coelom' },
  splanchnic:   { color: 0x179473, name: 'Splanchnic (visceral) mesoderm' },
  endoderm:     { color: 0xb8b33c, name: 'Endoderm' },
  mesentery:    { color: 0x14a08b, name: 'Dorsal mesentery' },
  neural:       { color: 0x7e57c2, name: 'Neural tube' },
  notochord:    { color: 0xd0c8b0, name: 'Notochord' },
  somite:       { color: 0x6b4fa8, name: 'Somite' },
  vitelline:    { color: 0xc9a227, name: 'Vitelline duct' },
  yolksac:      { color: 0xd8c86a, name: 'Yolk sac' },
  umbilicalring:{ color: 0x8e44ad, name: 'Umbilical ring' },
  herniation:   { color: 0xc0563a, name: 'Herniated midgut' },
  sac:          { color: 0xe8d9c0, name: 'Covering sac (amnion + peritoneum)' },
  gastroschisis:{ color: 0xd63a2f, name: 'Gastroschisis — bowel with no sac' },
  exstrophy:    { color: 0xe07a86, name: 'Exstrophic bladder plate' },
  cord:         { color: 0xc8a08a, name: 'Umbilical cord (stub)' },
};

/* ------------------------------------------------------------------ constants

   The two sheets are the somatopleure (ectoderm + somatic mesoderm) and the splanchnopleure
   (splanchnic mesoderm + endoderm). SO and SG are their HALF arc lengths — dorsal midline out to the
   ventral free edge — and they are the quantities that are conserved. Everything else is derived. */

const SO   = 3.05;    // half arc length of the embryonic somatopleure. CONSERVED.
const SG   = 0.95;    // half arc length of the gut wall at full closure
const z0O  = -0.30;   // z of the somatopleure's mid-surface at the dorsal midline (-z = DORSAL)
const z0G  =  0.58;   // z of the splanchnopleure's mid-surface at the dorsal midline

const YLEN = 3.20;    // cranio-caudal extent of the block
const NY   = 26;      // cranio-caudal stations
const NSH  = 60;      // arc samples per HALF profile (outer); 2*NSH+1 points across
const NSG  = 24;      // arc samples per half profile (gut)

/* the one hole that is left: the umbilical ring, and the vitelline duct inside it */
const Y_UMB    = 0.00;   // cranio-caudal centre of the ring
const YW_UMB   = 0.44;   // half width of the ring in y
const R_RING   = 0.30;   // residual HALF gap at the ventral midline inside the ring, at t = 1
const YW_DUCT  = 0.20;   // half width in y of the vitelline duct's passage
const R_DUCT   = 0.085;  // residual half gap of the GUT at t = 1, inside the duct window

/* ---- the SECOND hole, in the exstrophy build, and the bridge of wall between them ----

   WHAT WENT WRONG HERE, because the shape of it matters more than the numbers. The window was
   written as `0.34 * win(y, Y_UMB - 0.72, 0.62, 0.16)` — a centre and a half-width picked to look
   right — and its half-width, 0.62, is WIDER than the distance from its own centre to the umbilicus.
   So the two openings overlapped: max(ring, exstrophy) never returned to zero anywhere between
   y = +0.44 and y = -1.34, the wall carried ONE continuous ventral slot 1.78 long, and the
   umbilicalring tube — derived from the free edges wherever the target is non-zero — was stretched
   around the whole of it. That picture is cloacal exstrophy / OEIS, and beat 7 teaches the ladder
   omphalocele / gastroschisis / bladder exstrophy / cloacal exstrophy BY LEVEL, so the frame
   contradicted the scene's own narration. Found by review round 1; the acceptance test that was
   supposed to catch it could not, because its measured side was a compile-time constant (see J).

   THE BRIDGE IS THE DIAGNOSIS, exactly as the bridge of intact wall beside the cord is the diagnosis
   in gastroschisis (see dropGastro, which records the same mistake made the same way). So the
   window's centre is no longer placed: it is DERIVED from the bridge the diagnosis requires. Given
   the ring's own half-width and this opening's, Y_EXST is wherever it has to be for the intact band
   between the two to be BRIDGE_F of their mean cranio-caudal extent. Move any of the three and the
   centre follows; there is no independent number left to get wrong.

   BRIDGE_F is set well above FLOORS.EXSTR rather than at it, because the floor is what J MEASURES on
   the built rows and a target equal to the floor leaves a check with no room to detect anything. */
const YW_EXST  = 0.30;   // half width in y of the exstrophic opening: the bladder plate is smaller than the ring
const SOFT_EXST= 0.12;   // its shoulder
const R_EXST   = 0.34;   // residual HALF gap at the ventral midline inside it, at t = 1
const BRIDGE_F = 0.45;   // intact bridge / mean y extent of the two openings. J's floor is 0.35.
const Y_EXST   = Y_UMB - (YW_UMB + YW_EXST + BRIDGE_F * (YW_UMB + YW_EXST));

/* ---- the gastroschisis window, in ONE place ----

   THE BRIDGE OF INTACT WALL IS THE DIAGNOSIS, here too. The first window ran from v = -0.78 to -0.98,
   which reaches the ventral midline: the defect and the umbilical ring merged into one opening, and
   what the model drew was not gastroschisis but a single huge ventral defect with the cord in it. Test
   I measured the separation and failed at 0.11 against a floor of 0.35 — which is what a magnitude
   floor is for, because the sign test "the defect is at x < 0" passed the whole time. Moved lateral so
   a bridge of closed wall separates the two.

   WHY THESE THREE ARE NOW NAMED CONSTANTS AND THE PREDICATE IS SHARED. Found by THIS run, while
   perturbation-testing what review round 1 had said about H and J: test I computed its sample indices
   as `Math.round((1 - 0.74) / 2 * ns)` — the window's own bounds, typed a second time, in the test
   that checks where the window is. So moving dropGastro's window left I reporting the old place and
   still passing: 0.46102796 before and after, to eight figures, with the hole somewhere else
   entirely. Not the same fault as H and J — I's number does come off the rows — but the same FAMILY,
   and the perturbation rule those two prompted is what caught it. The window now has one definition;
   the predicate buildFold drops cells with is the predicate I measures through. */
/* AND THE NAMES ARE THE OTHER WAY ROUND FROM THE ONES THE OLD TEST USED. v runs from -1 at the RIGHT
   free edge — which is ON the ventral midline — to 0 at the dorsal midline, so arc distance from the
   midline is (1 - |v|) * SO and the bound NEARER the cord is the one nearer -1. The old test called
   -0.74 `iMed` with a comment reading "the defect's LATERAL edge" and -0.90 `iLat` commented "its
   MEDIAL edge": the variables and their own comments disagreed, in a test whose whole subject is which
   edge is nearer the cord. It happened to take the right one. Named by arc distance here so the
   question cannot come up again. */
const V_GAST_NEAR = -0.90;   // the edge NEARER the ventral midline and the cord: 0.33 of arc from it
const V_GAST_FAR  = -0.74;   // the lateral edge: 0.79 of arc from the midline
const YW_GAST     =  0.17;   // its half extent in y
function gastroDrop(ns) {
  return (i, j) => {
    const v = frac(i + 0.5, ns);                     // negative = the embryo's RIGHT
    const y = yOf(j + 0.5);
    return v < V_GAST_FAR && v > V_GAST_NEAR && Math.abs(y - Y_UMB) < YW_GAST;
  };
}

/* layer offsets from each mid-surface, outward positive */
const OFF = {
  ectoderm:   { c:  0.085, h: 0.070 },
  somatic:    { c: -0.055, h: 0.100 },
  splanchnic: { c:  0.058, h: 0.080 },
  endoderm:   { c: -0.038, h: 0.056 },
};
const S_SOM = 0.62;   // the somatic sheet stops this far from the dorsal midline: the somites are there
const S_SPL = 0.10;   // the splanchnic sheet stops this far from it: the mesenteric root is there

function clamp(v, a, b) { return v < a ? a : (v > b ? b : v); }
function smoothstep(e0, e1, x) { const u = clamp((x - e0) / (e1 - e0), 0, 1); return u * u * (3 - 2 * u); }
function gauss(u, c, w) { const z = (u - c) / w; return Math.exp(-z * z); }

/* a smooth window in y: 1 inside the half-width, 0 outside, with a soft shoulder */
function win(y, centre, half, soft) {
  const d = Math.abs(y - centre);
  return 1 - smoothstep(half - (soft || 0.10), half, d);
}

/* ------------------------------------------------------- the transverse curve

   ONE point function for the profile, integrated as a plane curve of PRESCRIBED ARC LENGTH. The
   curvature is kappa(u) = lam * W(u, a); the arc length S never appears as a free parameter, so a
   sheet cannot stretch however hard the solver pushes. That is the whole mechanism: the disc does
   not grow into a cylinder, it curls into one.

   W(u, a) = 1 + a * gauss(u; HINGE_C, HINGE_W). The uniform part would give a circular arc, which
   closes at exactly theta = pi — right, but it bends the paravertebral wall as hard as the lateral
   edge, which is not what the fold looks like at half closure. The hinge term puts the extra
   curvature where the fold actually is. `a` is then no longer free: it is what buys theta_end = pi
   back, and it is SOLVED for that below.                                                          */

const HINGE_C = 0.62, HINGE_W = 0.26;
function Wshape(u, a) { return 1 + a * gauss(u, HINGE_C, HINGE_W); }

/* Integrate from the dorsal midline outward. th is the heading: d = (cos th, sin th) in (x, z).
   sgn = +1 walks toward the embryo's LEFT (+x), -1 toward its RIGHT. Midpoint rule; the turn per
   step is kappa * ds either way, so the two sides are the same function with one sign changed. */
function arc(S, n, lam, a, sgn, x0, z0) {
  const ds = S / n;
  const X = new Float64Array(n + 1), Z = new Float64Array(n + 1), TH = new Float64Array(n + 1);
  let x = x0, z = z0, th = sgn > 0 ? 0 : Math.PI;
  X[0] = x; Z[0] = z; TH[0] = th;
  for (let k = 1; k <= n; k++) {
    const um = (k - 0.5) / n;
    const dth = sgn * lam * Wshape(um, a) * ds;
    const thm = th + dth * 0.5;
    x += Math.cos(thm) * ds;
    z += Math.sin(thm) * ds;
    th += dth;
    X[k] = x; Z[k] = z; TH[k] = th;
  }
  return { X: X, Z: Z, TH: TH, n: n };
}

/* Bisect lam so the free edge lands on xTarget. x_end is monotone DECREASING in lam on the left
   (and increasing on the right, which is the same statement mirrored), for as long as theta stays
   below about 1.3 pi — which the cap below enforces. A solver that runs off the end of its own
   monotone range is how cardiac-looping sat on a bifurcation and inverted between two integration
   densities, so the bracket is checked rather than assumed. */
/* THE CAP IS ON THE TOTAL TURNING, NOT ON lam, AND THAT IS THE WHOLE POINT.

   x_end(lam) is monotone decreasing only while the sheet has turned less than about pi. Past that
   the curve SPIRALS and x_end oscillates back through zero at theta = 3pi, 5pi, ... — a bisection
   run against a fixed numeric cap happily converges on one of those, and what it returns is a sheet
   rolled up two and a half times, which closes on the midline and passes every check that only asks
   where the edge ended. Measured while writing this: with a flat cap of lam = 3.0 the solver
   returned theta_end = 15.7 for three different hinge weights and reported success each time. This
   is RENDER-STANDARD's bifurcation warning arriving in a different model, so the cap is expressed in
   the quantity that actually decides monotonicity — total turning — and scales with arc length and
   with the hinge weight on its own. */
const TURN_CAP = 1.15 * Math.PI;
function meanW(a) { let s = 0; const N = 400; for (let k = 0; k < N; k++) s += Wshape((k + 0.5) / N, a); return s / N; }
function lamCap(S, a) { const m = meanW(a); return m > 1e-6 ? TURN_CAP / (S * m) : 1e3; }

let _lamCapHit = 0;
const _capLog = [];
function solveLam(S, n, a, sgn, xTarget, x0, z0) {
  const f = l => (arc(S, n, l, a, sgn, x0, z0).X[n] - xTarget) * sgn;   // decreasing in l, both sides
  if (f(0) <= 0) return 0;                        // already at or past the target: flat
  let lo = 0, hi = lamCap(S, a);
  if (f(hi) > 0) {                                // cannot reach it inside the cap — counted, not hidden
    _lamCapHit++;
    if (_capLog.length < 12) _capLog.push({ S: S, a: a, sgn: sgn, xTarget: xTarget, reach: arc(S, n, hi, a, sgn, x0, z0).X[n] });
    return hi;
  }
  for (let i = 0; i < 54; i++) { const m = 0.5 * (lo + hi); if (f(m) > 0) lo = m; else hi = m; }
  return 0.5 * (lo + hi);
}

/* ------------------------------------------- the two constants that are solved once

   At full closure the free edge must land on the midline (x_end = 0) AND the wall must be
   CONTINUOUS there (theta_end = pi), or the two halves meet at a crease instead of fusing. Two
   conditions, two unknowns: lam and the hinge weight a. Nested: for each a, lam is bisected for
   x_end = 0; the outer bisection then drives theta_end to pi. theta_end is monotone in a at fixed
   closure because concentrating curvature laterally buys turning without buying displacement.     */
function solveClosure(S, n, z0) {
  const g = a => { const l = solveLam(S, n, a, +1, 0, 0, z0); return { a: a, lam: l, th: arc(S, n, l, a, +1, 0, z0).TH[n] }; };
  let lo = -0.90, hi = 1.60;
  const flo = g(lo).th - Math.PI, fhi = g(hi).th - Math.PI;
  let res;
  if (flo * fhi > 0) {                              // no bracket: report it, take the better end
    res = Math.abs(flo) < Math.abs(fhi) ? g(lo) : g(hi);
    res.bracketed = false;
  } else {
    for (let i = 0; i < 46; i++) {
      const m = 0.5 * (lo + hi);
      if ((g(m).th - Math.PI) * flo > 0) lo = m; else hi = m;
    }
    res = g(0.5 * (lo + hi));
    res.bracketed = true;
  }
  res.thetaErr = res.th - Math.PI;
  return res;
}

const CLOSE_O = solveClosure(SO, NSH, z0O);    // the somatopleure
const CLOSE_G = solveClosure(SG, NSG, z0G);    // the gut wall
const A_O = CLOSE_O.a, A_G = CLOSE_G.a;

/* What the solve implies, recorded as numbers rather than as prose, because a review should be able
   to check the arithmetic and not only the conclusion. With a* = 0 the closed section is a circle of
   radius S/pi: the body wall closes at radius SO/pi = 0.971 and the gut at SG/pi = 0.302, so the gut
   tube is 31% of the body's calibre — which is where "tube within a tube" gets its proportions from,
   and it was not chosen. Both are re-measured on real mesh vertices by the render tool. */
const R_WALL = SO / Math.PI, R_GUT = SG / Math.PI;

/* ----------------------------------------------------------- schedules in t and y

   The gap the solver is asked to shut. At t = 0 it is the full half-width of the flat disc, so the
   solved amplitude is exactly zero and the disc is exactly flat — not nearly flat. At t = 1 it is
   whatever the umbilical ring leaves open at that cranio-caudal station, which is zero everywhere
   except at the umbilicus. That is the entire difference between a body wall and a body wall with a
   hole in it, and it is one number.                                                               */

function ringGap(y, opts) {
  let g = R_RING * win(y, Y_UMB, YW_UMB, 0.14);
  if (opts && opts.exstrophy) {
    /* FAILURE OF CLOSURE BELOW THE UMBILICUS. Not a second lesion bolted on: the same residual gap,
       carried caudally — and SEPARATED from the ring by wall that closes, which is what makes it
       bladder exstrophy and not OEIS. The separation is in Y_EXST, derived above. */
    g = Math.max(g, R_EXST * win(y, Y_EXST, YW_EXST, SOFT_EXST));
  }
  return g;
}

/* THE VENTRAL GAP AT EVERY STATION, OFF THE BUILT ROWS. Not ringGap() again: the two free edges of
   the profile the geometry is actually made of, which is what a student sees as a hole. J, J-closed
   and K are all read off this, and the render tool re-reads the same quantity from mesh vertices.
   A station is OPEN if its gap exceeds the same fraction of the wall's width that test B calls
   closed, so "open" and "closed" mean one thing in this file. */
function ventralGaps(t, opts) {
  const O = outerRows(t, opts);
  const g = new Array(NY + 1), y = new Array(NY + 1);
  for (let j = 0; j <= NY; j++) {
    g[j] = Math.abs(O.rows[j][O.ns].x - O.rows[j][0].x);
    y[j] = yOf(j);
  }
  let wide = 0;
  for (const p of O.rows[0]) wide = Math.max(wide, Math.abs(p.x));
  return { gap: g, y: y, wallWidth: 2 * wide, dy: YLEN / NY, ns: O.ns, rows: O.rows };
}

/* the maximal runs of stations that are open / closed, as y intervals half a station wide at each
   end — the same quantisation on both, so a ratio of two of them is stable. */
function bands(gap, y, dy, thresh, want) {
  const out = [];
  let i = 0;
  while (i < gap.length) {
    const isOpen = gap[i] > thresh;
    let k = i;
    while (k + 1 < gap.length && (gap[k + 1] > thresh) === isOpen) k++;
    if (isOpen === want) out.push({ lo: y[i] - dy / 2, hi: y[k] + dy / 2, j0: i, j1: k, extent: (y[k] - y[i]) + dy });
    i = k + 1;
  }
  return out;
}
/* ---------------------------------------------- THE CAUDAL APERTURE, ONE DEFINITION

   The hole the bladder plate is shown through, read off the SAME free edges and the SAME
   open/closed predicate J is read off — so the plate that fills it, the measure that asks what is
   seen through it and the test that counts the openings cannot drift apart about where it is.

   Returns the caudal open band's stations plus the two CLOSED stations either side of it (jA, jB):
   the aperture is the interpolated sheet between them, so the wall is still open an interval short
   of jA and past jB, and anything that has to cover the aperture has to reach those stations. The
   caudal band is open[0] because bands() walks j upward and -y is caudal.

   gap/y/zc are per station: the full ventral gap, the station's y, and the mean z of its two free
   edges, which is where the open wall actually is at this t.                                      */
function apertureCaudal(O, ns) {
  const gap = [], y = [], zc = [];
  let wide = 0;
  for (const p of O.rows[0]) wide = Math.max(wide, Math.abs(p.x));
  for (let j = 0; j <= NY; j++) {
    const R = O.rows[j];
    gap.push(Math.abs(R[ns].x - R[0].x));
    y.push(yOf(j));
    zc.push(0.5 * (R[0].z + R[ns].z));
  }
  const wallWidth = 2 * wide;
  const open = bands(gap, y, YLEN / NY, FLOORS.CLOSE * wallWidth, true);
  if (!open.length) return null;
  const cd = open[0];
  return { j0: cd.j0, j1: cd.j1, jA: Math.max(0, cd.j0 - 1), jB: Math.min(NY, cd.j1 + 1),
           gap: gap, y: y, zc: zc, wallWidth: wallWidth, band: cd };
}

/* HOW FAR THE PLATE REACHES UNDER THE WALL'S LIP, and the only prescribed number left in it. The
   ectoderm's own half-thickness: the smallest overlap that cannot show a seam at the margin, taken
   from the sheet the plate is continuous with rather than chosen. It is also the plate's thickness
   at its widest station, via flatten, so one number does both and neither can be tuned alone. */
const PLATE_LAP = OFF.ectoderm.h;

function ductGap(y) { return R_DUCT * win(y, Y_UMB, YW_DUCT, 0.08); }

function outerTarget(y, t, opts) { return SO * (1 - t) + t * ringGap(y, opts); }
function gutArc(t)               { return SO * (1 - t) + t * SG; }
function gutTarget(y, t)         { return SO * (1 - t) + t * Math.max(ductGap(y), 0.012); }

/* -------------------------------------------------------------- profile assembly

   The full transverse profile, traversed ONCE from the RIGHT free edge, over the dorsal midline, to
   the LEFT free edge. Built as two integrations from the midline and concatenated, so the curve is
   smooth at the midline by construction and there is no mirrored half anywhere — which is the point.
   RENDER-STANDARD is explicit that a reflection has to reverse winding; the way not to pay for that
   is not to reflect. Left and right carry their OWN solved amplitude, so an asymmetric defect
   (gastroschisis) is a different number on one side and not a different construction. */
function profileRow(S, n, a, z0, targetL, targetR) {
  const lamL = solveLam(S, n, a, +1, targetL, 0, z0);
  const lamR = solveLam(S, n, a, -1, -targetR, 0, z0);
  const L = arc(S, n, lamL, a, +1, 0, z0);
  const R = arc(S, n, lamR, a, -1, 0, z0);
  const m = 2 * n;
  const P = new Array(m + 1);
  for (let k = 0; k <= n; k++) P[n - k] = { x: R.X[k], z: R.Z[k] };   // right, reversed
  for (let k = 1; k <= n; k++) P[n + k] = { x: L.X[k], z: L.Z[k] };
  return { P: P, lamL: lamL, lamR: lamR, thL: L.TH[n], thR: R.TH[n], n: m };
}

/* -------------------------------------------------------------- the thick sheet

   EVERY STRUCTURE IN THIS MODEL IS A SHEET, and a sheet is the one shape render-kit does not
   already build: sweptShell sweeps a CLOSED ring along a frame, and a folding germ layer is an OPEN
   arc. So this is the missing primitive — and it is built OUT OF the kit rather than beside it:
   winding through emitter().quad / quadFlip / triN, nothing hand-ordered, no local normal
   convention, no local colour conversion. RENDER-STANDARD SS6 forbids reimplementing those four; it
   does not forbid composing them, and a sheet builder that the corpus will need again for the
   mesenteries, the pleura and neurulation is a kit candidate rather than a model detail. It is kept
   local to this file for now ONLY because render-kit.js is shared with nine models that are built
   and not yet reviewed, and a shared-file change is not this run's to make. Said in BUILD-LOG too.

   THE INDEX CONVENTION, stated because getting it wrong is silent. i runs along the transverse
   profile, j along the cranio-caudal axis. emitter().quad(a,b,c,d) with a=(i,j) emits a face normal
   of -(di x dj) = dj x di = yhat x T_s — and yhat x T_s at the dorsal midline, where T_s = +x, is
   -z, which is dorsal, which is OUTWARD. So gridA must be handed in as the face on the yhat x T_s
   side. Checked at run time against the actual vertex data rather than trusted: see `flipped` below.

   gridA  outer face, (ns+1)*(ny+1) Vector3, index i*(ny+1)+j
   gridB  inner face, same shape
   keep   optional (i,j) -> bool over CELLS, for a hole; a rim is emitted round whatever it keeps  */

function grid3(ns, ny) { const a = new Array((ns + 1) * (ny + 1)); return a; }
const GI = (ny, i, j) => i * (ny + 1) + j;

function slab(gridA, gridB, ns, ny, keep) {
  const E = K.emitter();
  const cl = (v, a, b) => (v < a ? a : (v > b ? b : v));

  /* normals by central difference OF THE GRID ITSELF, so positions and normals come from the same
     point function and cannot disagree — RENDER-STANDARD rule 3. The difference can collapse at a
     taper; three's normalize() returns (0,0,0) there without complaining, which would leave a
     silhouette shell coincident with the surface it is meant to hide behind, so it is guarded. */
  function normalsOf(g, sign) {
    const N = new Array((ns + 1) * (ny + 1));
    const du = new T.Vector3(), dv = new T.Vector3(), out = new T.Vector3();
    let bad = 0;
    for (let i = 0; i <= ns; i++) for (let j = 0; j <= ny; j++) {
      const i0 = cl(i - 1, 0, ns), i1 = cl(i + 1, 0, ns);
      const j0 = cl(j - 1, 0, ny), j1 = cl(j + 1, 0, ny);
      du.subVectors(g[GI(ny, i1, j)], g[GI(ny, i0, j)]);            // along the profile
      dv.subVectors(g[GI(ny, i, j1)], g[GI(ny, i, j0)]);            // along y
      out.crossVectors(dv, du);                                      // yhat x T_s
      if (out.lengthSq() < 1e-18) { out.copy(dv).cross(du); bad++; }
      if (out.lengthSq() < 1e-18) out.set(0, 0, -1);
      out.normalize().multiplyScalar(sign);
      N[GI(ny, i, j)] = out.clone();
    }
    N.degenerate = bad;
    return N;
  }

  const NA = normalsOf(gridA, 1);
  /* IS gridA REALLY THE OUTER FACE? Measured, at the middle of the sheet, from the two grids
     themselves. A model that hands them the wrong way round would render inside-out with every
     normal self-consistent — which is exactly the class of fault that stayed invisible for weeks. */
  const mi = Math.round(ns / 2), mj = Math.round(ny / 2);
  const sep = new T.Vector3().subVectors(gridA[GI(ny, mi, mj)], gridB[GI(ny, mi, mj)]);
  const flipped = sep.lengthSq() > 1e-14 && sep.dot(NA[GI(ny, mi, mj)]) < 0;
  if (flipped) console.warn('[lateral-folding] slab(): gridA is not the outer face — check the caller');
  const NB = normalsOf(gridB, -1);

  const cell = (i, j) => (keep ? !!keep(i, j) : true);

  // OUTER FACE FIRST — rule 4: this, and only this, becomes the silhouette hull
  for (let i = 0; i < ns; i++) for (let j = 0; j < ny; j++) {
    if (!cell(i, j)) continue;
    const a = GI(ny, i, j), b = GI(ny, i + 1, j), c = GI(ny, i + 1, j + 1), d = GI(ny, i, j + 1);
    E.quad(gridA[a], gridA[b], gridA[c], gridA[d], NA[a], NA[b], NA[c], NA[d]);
  }
  const hullCount = E.count();

  // inner face: same index order, the other way round
  for (let i = 0; i < ns; i++) for (let j = 0; j < ny; j++) {
    if (!cell(i, j)) continue;
    const a = GI(ny, i, j), b = GI(ny, i + 1, j), c = GI(ny, i + 1, j + 1), d = GI(ny, i, j + 1);
    E.quadFlip(gridB[a], gridB[b], gridB[c], gridB[d], NB[a], NB[b], NB[c], NB[d]);
  }

  /* THE RIM, ALL ROUND WHATEVER SURVIVED. Through triN, never tri: a rim triangle is not part of a
     ring quad, and RENDER-STANDARD SS2.4b is explicit that a winding convention reasoned about at the
     call site will be got wrong at some call site. triN decides the order from the geometry. */
  const nrm = new T.Vector3(), e1 = new T.Vector3(), e2 = new T.Vector3();
  function rim(iA, jA, iB, jB, outward) {
    const a = GI(ny, iA, jA), b = GI(ny, iB, jB);
    E.triN(gridA[a], gridA[b], gridB[b], outward);
    E.triN(gridA[a], gridB[b], gridB[a], outward);
  }
  for (let i = 0; i < ns; i++) for (let j = 0; j < ny; j++) {
    if (!cell(i, j)) continue;
    if (!cell(i - 1, j) || i === 0) {                     // the -i edge
      nrm.subVectors(gridA[GI(ny, i, j)], gridA[GI(ny, i + 1, j)]).normalize();
      rim(i, j, i, j + 1, nrm.clone());
    }
    if (!cell(i + 1, j) || i === ns - 1) {                // the +i edge
      nrm.subVectors(gridA[GI(ny, i + 1, j)], gridA[GI(ny, i, j)]).normalize();
      rim(i + 1, j, i + 1, j + 1, nrm.clone());
    }
    if (!cell(i, j - 1) || j === 0) {                     // the caudal cut end
      nrm.subVectors(gridA[GI(ny, i, j)], gridA[GI(ny, i, j + 1)]).normalize();
      rim(i, j, i + 1, j, nrm.clone());
    }
    if (!cell(i, j + 1) || j === ny - 1) {                // the cranial cut end
      nrm.subVectors(gridA[GI(ny, i, j + 1)], gridA[GI(ny, i, j)]).normalize();
      rim(i, j + 1, i + 1, j + 1, nrm.clone());
    }
  }
  if (!E.count()) return null;
  const g = E.geometry(hullCount);
  g.userData.degenerateNormals = (NA.degenerate || 0) + (NB.degenerate || 0);
  g.userData.gridFlipped = flipped;
  return g;
}

/* Offset two faces off a mid-surface. rows[j] is an array of (ns+1) {x,z}; y comes from yOf(j).
   The in-plane outward direction is yhat x T, computed from the row itself — same point function,
   again — and cOff/hFn are measured along it. hFn(i, j) lets a membrane TAPER, which
   RENDER-STANDARD requires of any sheet that suspends something. */
function gridsFromRows(rows, ns, ny, yOf, cOff, hFn) {
  const A = grid3(ns, ny), B = grid3(ns, ny);
  for (let j = 0; j <= ny; j++) {
    const R = rows[j], y = yOf(j);
    for (let i = 0; i <= ns; i++) {
      const i0 = i > 0 ? i - 1 : 0, i1 = i < ns ? i + 1 : ns;
      let tx = R[i1].x - R[i0].x, tz = R[i1].z - R[i0].z;
      const L = Math.hypot(tx, tz) || 1; tx /= L; tz /= L;
      const nx = tz, nz = -tx;                                  // yhat x T
      const c = (typeof cOff === 'function') ? cOff(i, j) : cOff;
      const h = (typeof hFn === 'function') ? hFn(i, j) : hFn;
      A[GI(ny, i, j)] = new T.Vector3(R[i].x + (c + h / 2) * nx, y, R[i].z + (c + h / 2) * nz);
      B[GI(ny, i, j)] = new T.Vector3(R[i].x + (c - h / 2) * nx, y, R[i].z + (c - h / 2) * nz);
    }
  }
  return { A: A, B: B };
}

function addSheet(group, key, gA, gB, ns, ny, keep, opt) {
  const geo = slab(gA, gB, ns, ny, keep);
  if (!geo) return null;
  return K.addSolid(group, key, geo, Object.assign({
    color: LAYERS[key].color, name: LAYERS[key].name, outline: 0.022,
  }, opt || {}));
}

/* ------------------------------------------------------------------ the rows

   One profile per cranio-caudal station. The umbilical ring is not a second mechanism: it is the
   SAME solve with a different target at the stations that pass through the umbilicus, so the wall
   that closes and the wall that does not are one continuous surface and not two models. */

function yOf(j) { return (j / NY - 0.5) * YLEN; }

function outerRows(t, opts) {
  const rows = new Array(NY + 1), meta = new Array(NY + 1);
  for (let j = 0; j <= NY; j++) {
    const y = yOf(j), g = outerTarget(y, t, opts);
    const r = profileRow(SO, NSH, A_O, z0O, g, g);
    rows[j] = r.P; meta[j] = r;
  }
  return { rows: rows, meta: meta, ns: 2 * NSH };
}
function gutRows(t) {
  const S = gutArc(t);
  const rows = new Array(NY + 1), meta = new Array(NY + 1);
  for (let j = 0; j <= NY; j++) {
    const y = yOf(j), g = Math.min(gutTarget(y, t), S * 0.999);
    const r = profileRow(S, NSG, A_G, z0G, g, g);
    rows[j] = r.P; meta[j] = r;
  }
  return { rows: rows, meta: meta, ns: 2 * NSG, S: S };
}

/* the signed arc fraction of a profile index: -1 at the right free edge, 0 at the dorsal midline,
   +1 at the left free edge. Every keep() and every pairing below is written in this one coordinate,
   so a window means the same thing on both sheets and at every t. */
const frac = (i, ns) => (i - ns / 2) / (ns / 2);

/* THE MESENTERY'S GRIDS, BUILT ONCE AND MEASURED FROM. Factored out of buildFold for one reason:
   acceptance() test H used to RESTATE the taper law — `m.H = (1 - 0.92 * 1 * 1) / (1 - 0)`, the law
   evaluated by hand at v = 1 and typed in as a literal. It touched no vertex, so it would have
   reported 0.080 and passed if the sheet had been built from a different array, given a different
   exponent, or never tapered at all. Review round 1 called it, and RENDER-STANDARD section 3 now
   carries the rule it prompted: AN ACCEPTANCE MEASUREMENT MUST BE A FUNCTION OF THE BUILT GEOMETRY.
   H now reads its thickness off THESE arrays — the same ones the mesh is emitted from. */
function mesenteryGrids(t) {
  const NM = 14;
  const zTop = 0.195, zBot = z0G - (OFF.splanchnic.c + OFF.splanchnic.h / 2) - 0.004;
  const wide = 0.50 * (1 - t) + 0.085 * t;
  const TAPER = 0.92;                                  // the fraction of its width the sheet loses at the gut
  const A = grid3(NM, NY), B = grid3(NM, NY);
  for (let j = 0; j <= NY; j++) {
    const y = yOf(j);
    for (let i = 0; i <= NM; i++) {
      const v = i / NM;
      const z = zTop + (zBot - zTop) * v;
      const w = wide * (1 - TAPER * v * v);
      A[GI(NY, i, j)] = new T.Vector3(+w / 2, y, z);
      B[GI(NY, i, j)] = new T.Vector3(-w / 2, y, z);
    }
  }
  return { A: A, B: B, NM: NM };
}

/* ---- the two bowel loops, at module scope ----

   Hoisted out of buildFold so the render tool can assert their TERMINALS rather than re-typing the
   paths: which end is buried, which ends in mid-air, and that the mid-air one carries a dome and not
   a flat annulus. A probe that keeps its own copy of the path is a probe that can go on passing after
   the path moves — the same fault test I had, one level up. */
const hernPath = () => {
  const p = [];
  for (let k = 0; k <= 8; k++) { const u = k / 8; p.push(new T.Vector3(0.05 * Math.sin(u * 3), -0.06 + 0.10 * u, 0.86 + (1.82 - 0.86) * u)); }
  for (let k = 1; k <= 44; k++) {
    const u = k / 44, a = u * Math.PI * 3.1, R = 0.30 + 0.11 * Math.sin(a * 1.6);
    p.push(new T.Vector3(R * Math.sin(a), 0.26 * Math.cos(a * 0.75), 2.02 + 0.34 * (0.5 - 0.5 * Math.cos(u * Math.PI)) + 0.17 * Math.sin(a)));
  }
  return p;
};
/* AND THIS PATH COMES OUT THROUGH THE WINDOW, which is not where it used to start.

   FOUND THIS RUN, and it is the answer to review round 1's fifth finding — "the bowel reads as a free
   red mass lying on an intact wall". The proximal end was the literal (-0.52, 0.02, 1.30). The window
   at that station runs from x = -1.028 to x = -0.641 on the ectoderm's outer face, so -0.52 is MEDIAL
   to the defect's medial edge: the loop did not pass through the hole at all, it passed through intact
   wall a tenth of a unit away from the hole, and the probe that casts rays at its proximal end reported
   it 98.6% enclosed for exactly that reason. The coil beyond it was over the window, which is why this
   looked right in a render and why no measurement caught it: nothing asserted that the thing coming out
   of the hole comes out of the hole.

   So the emergence point is now DERIVED: the mid-surface point at the centre of the dropped run of
   cells, and the outward in-plane normal there built the same way gridsFromRows builds it. The path
   starts INSIDE the cavity, crosses the wall along that normal, and only then picks up the coil. Move
   the window and the bowel follows it; there is no independent number left to disagree.

   READ AT t = 1 and declared static, as before — the lesion is read at the finished wall. */
const gastroPath = () => {
  const O = outerRows(1, {});
  const drop = gastroDrop(O.ns);
  const j = Math.round(NY / 2);
  let i0 = -1, i1 = -1;
  for (let i = 0; i < O.ns; i++) if (drop(i, j)) { if (i0 < 0) i0 = i; i1 = i; }
  const iC = i0 < 0 ? Math.round(0.05 * O.ns) : Math.round((i0 + i1 + 1) / 2);
  const R = O.rows[j], y0 = yOf(j);
  const ia = Math.max(0, iC - 1), ib = Math.min(O.ns, iC + 1);
  let tx = R[ib].x - R[ia].x, tz = R[ib].z - R[ia].z;
  const L = Math.hypot(tx, tz) || 1; tx /= L; tz /= L;
  const nx = tz, nz = -tx;                                  // yhat x T: outward, as everywhere else here
  const cx = R[iC].x, cz = R[iC].z;
  const at = d => new T.Vector3(cx + nx * d, y0, cz + nz * d);
  const IN = 0.42, OUT = 0.34;                              // inside the coelom; clear of the outer face
  const p = [];
  for (let k = 0; k <= 7; k++) { const u = k / 7; p.push(at(-IN + (IN + OUT) * u)); }
  const base = at(OUT + 0.26);
  for (let k = 1; k <= 34; k++) {
    const u = k / 34, a = u * Math.PI * 2.6, Rr = 0.22 + 0.08 * Math.sin(a * 1.7);
    p.push(new T.Vector3(base.x + Rr * Math.sin(a) + nx * 0.34 * u,
                         y0 + 0.20 * Math.cos(a * 0.8),
                         base.z + nz * 0.34 * u + 0.13 * Math.sin(a)));
  }
  return p;
};
/* ---- the covering sac, and the umbilical cord ------------------------------------------------

   BOTH ARE DERIVED FROM THINGS ALREADY SOLVED, which is the only reason they can be added without
   adding a dial. The sac encloses the herniated coil; the cord's calibre and direction come off the
   ring's own aperture; and WHICH of the two the cord inserts on is the whole content of beat 6's
   third check.

   WHY THE CORD EXISTS AT ALL, since the model went three review rounds without one. The scene names
   the cord 21 times. Beat 6 ends "Membrane, midline, cord insertion - three checks, in that order",
   describes omphalocele as "covered by amnion and peritoneum, with the cord inserting on the sac"
   and gastroschisis as "usually to the right of a normal cord"; beat 7 turns on it entirely - "That
   bridge is why the cord still inserts normally in gastroschisis". None of that was in the geometry,
   so the student was told to make three checks from a picture that supported two. Review round 2.

   IT IS A STUB AND IT IS SAID SO. A real cord is a long spiralled vessel-carrying structure running
   to the placenta, and none of that is taught here or drawn here: what beat 6 asks is WHERE IT
   INSERTS, and a stub answers that. The scene's gaps[] carries the shortfall. */

const SAC_CLEAR = 0.20;    // how far the membrane stands off the bowel it covers

function sacSphere() {
  /* the sac is what it covers, inflated. Its centre is the mean of the herniated COIL - the path
     from index 9 on, i.e. past the run that crosses the wall - and its radius reaches the furthest
     of those points plus a clearance. buildFold now calls this rather than keeping a second copy,
     so the drawn membrane and every measure of it cannot drift apart. */
  const P = hernPath(), n = P.length, k0 = 9, m = n - k0;
  let cx = 0, cy = 0, cz = 0;
  for (let k = k0; k < n; k++) { cx += P[k].x; cy += P[k].y; cz += P[k].z; }
  cx /= m; cy /= m; cz /= m;
  let r = 0;
  for (let k = k0; k < n; k++) r = Math.max(r, Math.hypot(P[k].x - cx, P[k].y - cy, P[k].z - cz));
  return { c: { x: cx, y: cy, z: cz }, r: r + SAC_CLEAR };
}

const CORD_R_F   = 0.72;   // the cord's calibre, as a fraction of the ring's own half-aperture
const CORD_LEN_F = 3.2;    // its length, in units of its own radius. A STUB, deliberately
const CORD_SINK  = 0.06;   // how far the buried end is sunk into whatever it inserts on

/* THE RING'S APERTURE, at the finished wall: where a normal cord inserts, and in which direction it
   leaves. Nothing here is chosen - the aperture centre is the midpoint of the wall's own two free
   edges at the umbilical station, and "outward" is the direction from that station's own centroid to
   it, built the way every other outward normal in this file is. Move the ring and the cord follows. */
function cordFrame(opts) {
  const O = outerRows(1, opts || {});
  const jU = Math.round(NY / 2), RU = O.rows[jU], ns = O.ns;
  const ax = 0.5 * (RU[0].x + RU[ns].x), az = 0.5 * (RU[0].z + RU[ns].z);
  let cx = 0, cz = 0;
  for (let i = 0; i <= ns; i++) { cx += RU[i].x; cz += RU[i].z; }
  cx /= (ns + 1); cz /= (ns + 1);
  let ox = ax - cx, oz = az - cz;
  const L = Math.hypot(ox, oz) || 1; ox /= L; oz /= L;
  const half = 0.5 * Math.abs(RU[ns].x - RU[0].x);
  return { ring: { x: ax, y: Y_UMB, z: az }, ox: ox, oz: oz, half: half, r: CORD_R_F * half };
}

/* THE CORD, for one variant. 'omphalocele' inserts on the SAC - its buried end sits just inside the
   membrane's surface, along the same outward direction - and 'gastroschisis' inserts on the intact
   wall AT the ring, which is medial to the window (the window is at x < 0, the aperture at x ~ 0),
   and is what "a normal cord" means in the narration.

   READ AT t = 1 and declared static, like the lesions it belongs to: this is the finished wall. */
function cordPath(which) {
  const F = cordFrame(which === 'gastroschisis' ? { gastroschisis: true } : {});
  let bx, by, bz;
  if (which === 'omphalocele') {
    const S = sacSphere();
    const d = S.r - CORD_SINK;
    bx = S.c.x + F.ox * d; by = S.c.y; bz = S.c.z + F.oz * d;
  } else {
    bx = F.ring.x - F.ox * CORD_SINK; by = F.ring.y; bz = F.ring.z - F.oz * CORD_SINK;
  }
  const LEN = CORD_LEN_F * F.r, p = [];
  for (let k = 0; k <= 10; k++) {
    const u = k / 10;
    p.push(new T.Vector3(bx + F.ox * LEN * u, by, bz + F.oz * LEN * u));
  }
  return p;
}
const cordPathOmphalocele = () => cordPath('omphalocele');
const cordPathGastro      = () => cordPath('gastroschisis');
/* the cord's calibre, once, DERIVED rather than restated — the ring's own half-aperture at the
   finished wall times CORD_R_F. It is read at module load so TERMINALS can carry a number for the
   terminal probe; restating it as CORD_R_F * R_RING would be a second copy of the derivation, which
   is exactly the fault H and J were found guilty of. */
const CORD_R = cordFrame({}).r;

/* WHERE IT INSERTS, AS A NUMBER. The distance from the cord's buried end to the ring's aperture -
   where a normal cord inserts - over the sac's own radius, which is the scale on which the two
   answers differ. On the gastroschisis build the cord IS at the aperture, so this is CORD_SINK over
   the sac radius and comes out near zero; on the omphalocele build the cord is out on the membrane,
   so it is at least a sac radius away. One measure, two variants, opposite floors: that is the
   discriminator beat 6 asks the student to make, in the geometry. */
function cordStandoff(which) {
  const F = cordFrame(which === 'gastroschisis' ? { gastroschisis: true } : {});
  const P = cordPath(which), b = P[0], S = sacSphere();
  return Math.hypot(b.x - F.ring.x, b.y - F.ring.y, b.z - F.ring.z) / S.r;
}

/* HOW MUCH OF THE CORD A CAMERA KEEPS — RENDER-STANDARD 3.y, and it was needed.

   FOUND BY LOOKING AT THE RENDER, this run, after the cord had been built and all four of its new
   acceptance rows passed. The cord leaves the umbilicus VENTRALLY, which is +z; beat 6 and beat 7
   both rotate to `anterior`, whose view direction is (0,0,1). Those are the same axis. So from the
   camera those beats stand at, the cord is seen exactly END-ON and draws a flesh-coloured disc - its
   dome cap - and nothing about its LENGTH or its insertion is on screen. Both variants' cords look
   the same from there. This is 3.y's own worked example arriving again: the crown that rises along
   the ring's axis and is seen from a superior camera down that very axis, and a model that was right
   pointed at a camera that could not show it. Rows N and N-medial measure the model's frame and
   could not have caught it, exactly as the standard says.

   So the foreshortening is now a measure, and the scene answers it with a BEAT rather than a hope:
   beat 6 keeps `anterior` because its other two claims are about which SIDE the defect is on, and a
   new closing beat rotates to `lateral`, where the cord's length survives, to show the two insertions
   in profile. "Where two claims want incompatible cameras, that is two beats." */
function cordAcross(which, view) {
  const B = screenBasis(view || 'anterior');
  const P = cordPath(which), a = P[0], b = P[P.length - 1];
  const dx = b.x - a.x, dy = b.y - a.y, dz = b.z - a.z;
  const len = Math.hypot(dx, dy, dz) || 1;
  const u = dx * B.u[0] + dy * B.u[1] + dz * B.u[2];
  const v = dx * B.v[0] + dy * B.v[1] + dz * B.v[2];
  return Math.hypot(u, v) / len;
}

/* AND WHETHER THE TWO CORDS READ AS TWO — the second thing the render showed and no number knew.

   Both cords leave the umbilicus VENTRALLY, because that is where a cord leaves from, so in this
   model they are COLLINEAR: one short stub on the body wall at the ring, one long one out on the
   membrane, on the same axis. No camera separates two collinear rods, so beat 9 cannot be saved by
   pointing it somewhere else — what separates them is the GAP between them, with the herniated bowel
   and the membrane's near wall filling it. So the gap is measured, in cord DIAMETERS, and floored:
   the tip of the one at the ring to the insertion of the one on the sac. Fall the sac back towards
   the wall and this closes, and the picture becomes one rod passing through a bubble. */
function cordGap() {
  /* SIGNED, ALONG THE AXIS THEY BOTH LIE ON, and the first version was not — it was a distance, so
     an OVERLAP came back as a positive gap of the same size. Caught by its own perturbation on
     2026-09-30: lengthening the stub from 3.2 to 7.4 radii drives the two cords 0.39 INTO each other
     and the unsigned form reported 0.914 diameters of clear space, which passed its floor. That is
     the exact shape of fault RENDER-STANDARD's "a sign test on a spatial relation is not a test" is
     about, arriving inside the measure written to answer it — and the PERTURBATION is what found it,
     which is the argument for that rule in one line. */
  const F = cordFrame({});
  const G = cordPath('gastroschisis'), O = cordPath('omphalocele');
  const gTip = G[G.length - 1], oBase = O[0];
  const along = (oBase.x - gTip.x) * F.ox + (oBase.z - gTip.z) * F.oz;
  return along / (2 * F.r);
}

/* ---- CROSS-VARIANT CONTAINMENT: the thing cordGap() could not see ------------------------------

   ADDED 2026-10-01, review round 3. cordGap() above measures the gap between the two cords ALONG
   the axis they both lie on, and reported 1.197 diameters of clear space while all eleven points of
   the gastroschisis cord sat INSIDE the omphalocele sac. A gap measured along an axis is not a test
   of containment: the two cords are end to end on the +z axis AND both are within one sphere, and
   those statements are not in conflict. 38/38 beat claims, 21/21 acceptance rows and 9/9 visibility
   beats all passed with a normally-inserted cord drawn inside a membrane — which is the picture that
   contradicts beat 6's own discriminator.

   WHY THIS IS NOT FIXED IN THE GEOMETRY, measured and not reasoned. The ring is at z = 1.792 and its
   outward direction is +z. The sac must cover the herniated coil, which lies outward of the ring, so
   the sac necessarily occupies the +z space in front of the ring: it spans z 1.454..3.001, and the
   omphalocele cord's base sits on its surface at z = 2.941. The gastroschisis cord is rooted AT the
   ring and leaves along the SAME outward direction, spanning z 1.732..2.424 on the same axis. Any
   sac that covers the bowel swallows a 0.691-long stub rooted at the ring. Rooting the sac at the
   ring does not help — it moves the membrane further outward, over MORE of the cord. The two variants
   share one coordinate frame and are separate clinical pictures; the defect is not in either
   variant's geometry, it is in drawing them in one frame. So the fix is compositional (the scene no
   longer draws two variants together) and this measure is the guard that keeps it that way.

   A FRACTION OF LENGTH, not a point count: a cord half-swallowed is still wrong, and 11 sampled
   vertices cannot say half. Floored at 0 — exact, because any containment at all is the defect. */
function cordInsideOtherSac(which) {
  const P = cordPath(which), S = sacSphere(), N = 400;
  let inside = 0, total = 0;
  for (let k = 0; k < N; k++) {
    const f = ((k + 0.5) / N) * (P.length - 1);
    const i = Math.min(P.length - 2, Math.floor(f)), w = f - i;
    const x = P[i].x + (P[i + 1].x - P[i].x) * w;
    const y = P[i].y + (P[i + 1].y - P[i].y) * w;
    const z = P[i].z + (P[i + 1].z - P[i].z) * w;
    const seg = Math.hypot(P[i + 1].x - P[i].x, P[i + 1].y - P[i].y, P[i + 1].z - P[i].z) / 1;
    total += seg;
    if (Math.hypot(x - S.c.x, y - S.c.y, z - S.c.z) < S.r) inside += seg;
  }
  return total > 0 ? inside / total : 0;
}

/* ---- the membrane, measured on the picture beat 6 actually draws -------------------------------

   RENDER-STANDARD 3.y: a beat that narrates a SHAPE asserts it as PROJECTED ON TO THE SCREEN PLANE
   OF THE CAMERA THAT BEAT ROTATES TO. Beat 6's shape claim is "is there a membrane?", and the answer
   a student reads off the screen is whether the loop is UNDER the sac or beside it. So this projects
   both loops and the sac on to the anterior camera's screen plane and reports what fraction of each
   loop's projected area falls inside the sac's.

   MEASURED OVER THE WHOLE MODELLED LOOP, intramural stub included. It was expected that the eight
   stations running inside the wall would hold the omphalocele figure below 1, and they do not: a
   silhouette has no depth, the sac's projected disc is larger than the whole loop's, and the measured
   coverage is 1.0000. The floor is therefore 0.95 and not the 0.80 this comment first guessed - the
   number was measured before the floor was written, which is the only order that works.

   AND THE GASTROSCHISIS FIGURE IS NOT ZERO. It is 0.149: from `anterior` the sac's projected disc
   spans x -0.72..0.83 and the bare loop spans -1.65..-0.47, so a quarter of a unit of the loop is
   drawn across the membrane's silhouette, at 0.30 opacity. In THREE dimensions they are well apart -
   the nearest point of the bare loop is 1.040 from the sac's centre against a radius of 0.774, a
   clearance of 0.171 - so this is an overlap of silhouettes and not of solids, and beat 6 draws it
   because COMPARE_STRUCTURES ghosts the rest of the model and moves NOTHING (viz3d.js line ~1913;
   the 'side-by-side' layout it is given is not implemented as a translation). So the floor below is
   0.20: the measured 0.149 pinned with a little headroom, so it cannot grow unnoticed, rather than a
   zero the picture does not deliver. Declared in the scene's gaps[] as well, because a student
   comparing the two loops sees it.

   It rasterises rather than integrating in closed form, because a union of fifty overlapping discs
   has no closed form worth writing. The grid is over the loop's own projected bounding box, so the
   resolution follows the subject. */
function screenBasis(view) {
  const d = VIEW_DIR[view] || VIEW_DIR.anterior;
  let dx = d[0], dy = d[1], dz = d[2];
  const dl = Math.hypot(dx, dy, dz) || 1; dx /= dl; dy /= dl; dz /= dl;
  const ax = Math.abs(dz) < 0.9 ? [0, 0, 1] : [1, 0, 0];
  let ux = ax[1] * dz - ax[2] * dy, uy = ax[2] * dx - ax[0] * dz, uz = ax[0] * dy - ax[1] * dx;
  const ul = Math.hypot(ux, uy, uz) || 1; ux /= ul; uy /= ul; uz /= ul;
  const vx = dy * uz - dz * uy, vy = dz * ux - dx * uz, vz = dx * uy - dy * ux;
  return { u: [ux, uy, uz], v: [vx, vy, vz] };
}
const SAC_GRID = 220;
function sacCoverage(which, view) {
  const B = screenBasis(view || 'anterior');
  const P = which === 'gastroschisis' ? gastroPath() : hernPath();
  const r = which === 'gastroschisis' ? 0.095 : 0.115;
  const S = sacSphere();
  const pr = q => [q.x * B.u[0] + q.y * B.u[1] + q.z * B.u[2], q.x * B.v[0] + q.y * B.v[1] + q.z * B.v[2]];
  const pts = P.map(pr), sc = pr(S.c);
  let lo0 = 1e9, hi0 = -1e9, lo1 = 1e9, hi1 = -1e9;
  for (const q of pts) { lo0 = Math.min(lo0, q[0] - r); hi0 = Math.max(hi0, q[0] + r);
                         lo1 = Math.min(lo1, q[1] - r); hi1 = Math.max(hi1, q[1] + r); }
  const N = SAC_GRID, d0 = (hi0 - lo0) / N, d1 = (hi1 - lo1) / N;
  let inLoop = 0, inBoth = 0, r2 = r * r, sr2 = S.r * S.r;
  for (let i = 0; i < N; i++) {
    const x = lo0 + (i + 0.5) * d0;
    for (let j = 0; j < N; j++) {
      const y = lo1 + (j + 0.5) * d1;
      let hit = false;
      for (let k = 0; k < pts.length; k++) {
        const ddx = x - pts[k][0], ddy = y - pts[k][1];
        if (ddx * ddx + ddy * ddy <= r2) { hit = true; break; }
      }
      if (!hit) continue;
      inLoop++;
      const sx = x - sc[0], sy = y - sc[1];
      if (sx * sx + sy * sy <= sr2) inBoth++;
    }
  }
  return inLoop ? inBoth / inLoop : 0;
}

/* AND THE SHARPER HALF OF THE SAME QUESTION, in three dimensions rather than on the screen.

   The screen measure above is what RENDER-STANDARD 3.y asks for — it is the picture a student reads —
   but a silhouette cannot tell "under the membrane" from "behind it", and the 0.149 above is exactly
   that ambiguity showing up. This one cannot be fooled: the signed clearance between each loop and
   the sac's surface, over the sac's radius. The herniated COIL (from index 9, i.e. past the run that
   crosses the wall) must be INSIDE, every station of it; the bare loop must be OUTSIDE, every station
   of it, by a floor. Together the two measures say: it looks covered AND it is covered. */
/* ---- AND THE SAME QUESTION ASKED OF THE WHOLE FRAME ------------------------------------------

   ADDED 2026-10-01, review round 4, and it is the fifth instance of ONE fault in this scene: a
   measure that certifies a picture it cannot see. sacCoverage() above projects exactly TWO things —
   the loop's own path dilated by its tube radius, and the sac's centre and radius. Every other
   structure beat 6 draws is outside its arithmetic, so it would still have read 1.0000 with the loop
   entirely hidden, and that is not hypothetical: measured on the built meshes in beat 6's own camera,
   the omphalocele CORD is the structure nearest the viewer in that beat (max depth 3.816, against the
   sac's 3.001 and the loop's 2.616) and it fronts 32.8% of the loop. A third of the thing B6-membrane
   certified as "drawn under the sac" was drawn under a flesh-coloured rod, in the beat whose whole
   job is "is there a membrane?".

   The lineage, because it is the argument for the rule: J certified a claim about geometry it never
   read; H restated its own law; B9-two-cords measured a gap ALONG an axis and was blind to being
   INSIDE; the pixel version of "plugged" counted the far side of the same layer. Every time, the
   measured side was not a function of the thing the claim is about.

   SO THIS ONE IS COMPUTED OVER THE STRUCTURES THE BEAT ACTUALLY DRAWS, ON THEIR REAL TRIANGLES.
   Of the subject loop's projected footprint on that beat's own screen plane, the fraction whose
   NEAREST surface — first hit along the camera axis, depth-buffered over every structure in the
   beat's shown list — is the sac. Anything drawn in front counts against the loop being under the
   membrane, whatever it is.

   NO PROXY, DELIBERATELY. The first version of this measure stood the sheets and tubes in as unions
   of spheres so it could run without building anything, and that was the fault again one level down:
   the sheets' thickness is offset along each row's own in-plane normal and their windows are dropped
   quads, so a sphere cloud would have occluded through the gastroschisis hole it is supposed to show.
   This rasterises what buildFold emits. acceptance() already builds groups for N-medial, so the cost
   is a kind already paid; the builds are memoised per variant.

   IT CANNOT GO BLIND QUIETLY, which is the other half of the lesson. Each shown key resolves to a
   part of a variant build; any key that yields no triangles comes back in `missing`, and the
   acceptance row FAILS on a non-empty list rather than quietly measuring the rest. A measure that
   silently ignores an occluder is the fault being fixed, so not knowing has to be a failure. */

/* EVERY OPTIONAL LAYER ON. One copy, read by the registration's FULL (so the player can resolve a
   part behind a flag) and by variantTris (so a screen-plane measure can too). Two copies is how the
   second one came to be missing the yolk sac. */
const FULL_OPTS = { amnion: true, yolksac: true, coelom: true, mesentery: true, neural: true,
                    notochord: true, somite: true, umbilicalring: true };

const SEEN_GRID = 220;

/* WHICH VARIANT A SCENE KEY BELONGS TO, and which model part it is — the same split the scene's own
   refs.procedural carries ("lateral-folding#cord+omphalocele"), so a beat's shown list can be handed
   in as scene keys and resolved here rather than restated anywhere. The render harness checks this
   table against the scene's own refs, so the two cannot drift. */
const KEY_PART = {
  omphalocele_gut:  ['herniation', 'omphalocele'],  omphalocele_sac:  ['sac', 'omphalocele'],
  omphalocele_cord: ['cord', 'omphalocele'],        gastroschisis_bowel: ['gastroschisis', 'gastroschisis'],
  gastroschisis_wall: ['ectoderm', 'gastroschisis'], gastroschisis_somatic: ['somatic', 'gastroschisis'],
  gastroschisis_cord: ['cord', 'gastroschisis'],    exstrophy_wall: ['ectoderm', 'exstrophy'],
  exstrophy_somatic: ['somatic', 'exstrophy'],      exstrophy_plate: ['exstrophy', 'exstrophy'],
  herniation: ['herniation', 'herniation'],         ectoderm_open: ['ectoderm', 'cutaway'],
  somatic_open: ['somatic', 'cutaway'],
};
function partOfKey(key) {
  return KEY_PART[key] ? { part: KEY_PART[key][0], variant: KEY_PART[key][1] }
                       : { part: key, variant: null };
}

/* one build per variant, world-space triangles bucketed by part key. Memoised: beat 6 asks for two
   variants and several parts of each, and a build is not cheap. */
const _seenTris = {};
function variantTris(variant) {
  const ck = variant || '_';
  if (_seenTris[ck]) return _seenTris[ck];
  /* EVERY OPTIONAL LAYER ON, which is what FULL is for. This used to pass
     { amnion: false, yolksac: false } — the two heaviest parts, switched off because no beat that
     carried a screen-plane claim drew either of them. That is the measure going blind by
     construction: `vitelline` is built INSIDE the yolk-sac block, so the first beat to put the
     vitelline duct in a shown list (beat 8, the aperture field) got it back in `missing`. A part
     behind a flag has to be RESOLVABLE here for the same reason the player needs FULL — and
     turning the flags on cannot change a number, because only the keys in a beat's own shown list
     are ever depth-buffered. Found 2026-10-01 while adding the aperture field; the row would have
     failed on `missing` rather than passing quietly, which is the design working. */
  const o = Object.assign({}, FULL_OPTS);
  if (variant) o[variant] = true;
  const g = buildFold(1, o);
  g.updateMatrixWorld(true);
  const byKey = {};
  const a = new T.Vector3(), b = new T.Vector3(), c = new T.Vector3();
  g.traverse(function (m) {
    if (!m.isMesh || !m.geometry || !m.geometry.attributes || !m.geometry.attributes.position) return;
    if (m.userData && m.userData.outline) return;
    const key = m.userData && m.userData.key;
    if (!key) return;
    const geo = m.geometry.index ? m.geometry.toNonIndexed() : m.geometry;
    const pos = geo.attributes.position;
    const out = byKey[key] || (byKey[key] = []);
    for (let i = 0; i + 2 < pos.count; i += 3) {
      a.fromBufferAttribute(pos, i).applyMatrix4(m.matrixWorld);
      b.fromBufferAttribute(pos, i + 1).applyMatrix4(m.matrixWorld);
      c.fromBufferAttribute(pos, i + 2).applyMatrix4(m.matrixWorld);
      out.push([a.x, a.y, a.z, b.x, b.y, b.z, c.x, c.y, c.z]);
    }
  });
  _seenTris[ck] = byKey;
  return byKey;
}
function trisOfKey(key) {
  const pk = partOfKey(key);
  const t = variantTris(pk.variant)[pk.part];
  return t && t.length ? t : null;
}

function viewAxis(view) {
  const B = screenBasis(view);
  const d = VIEW_DIR[view] || VIEW_DIR.anterior;
  const L = Math.hypot(d[0], d[1], d[2]) || 1;
  return { u: B.u, v: B.v, d: [d[0] / L, d[1] / L, d[2] / L] };
}

/* a depth buffer of one part, over a fixed screen-plane box. Max along the camera axis = the surface
   nearest the viewer, because VIEW_DIR points from the subject TOWARDS the camera. */
function depthBuffer(tris, B, box, N) {
  const buf = new Float64Array(N * N).fill(-Infinity);
  const sx = N / (box.hi0 - box.lo0), sy = N / (box.hi1 - box.lo1);
  const px = [0, 0, 0], py = [0, 0, 0], pz = [0, 0, 0];
  for (let q = 0; q < tris.length; q++) {
    const T3 = tris[q];
    for (let k = 0; k < 3; k++) {
      const x = T3[k * 3], y = T3[k * 3 + 1], z = T3[k * 3 + 2];
      px[k] = (x * B.u[0] + y * B.u[1] + z * B.u[2] - box.lo0) * sx;
      py[k] = (x * B.v[0] + y * B.v[1] + z * B.v[2] - box.lo1) * sy;
      pz[k] = x * B.d[0] + y * B.d[1] + z * B.d[2];
    }
    const det = (px[1] - px[0]) * (py[2] - py[0]) - (px[2] - px[0]) * (py[1] - py[0]);
    if (!(Math.abs(det) > 1e-12)) continue;
    const i0 = Math.max(0, Math.floor(Math.min(px[0], px[1], px[2])));
    const i1 = Math.min(N - 1, Math.ceil(Math.max(px[0], px[1], px[2])));
    const j0 = Math.max(0, Math.floor(Math.min(py[0], py[1], py[2])));
    const j1 = Math.min(N - 1, Math.ceil(Math.max(py[0], py[1], py[2])));
    for (let i = i0; i <= i1; i++) {
      const x = i + 0.5;
      for (let j = j0; j <= j1; j++) {
        const y = j + 0.5;
        const w1 = ((x - px[0]) * (py[2] - py[0]) - (px[2] - px[0]) * (y - py[0])) / det;
        if (w1 < -1e-9) continue;
        const w2 = ((px[1] - px[0]) * (y - py[0]) - (x - px[0]) * (py[1] - py[0])) / det;
        if (w2 < -1e-9 || w1 + w2 > 1 + 1e-9) continue;
        const z = pz[0] + w1 * (pz[1] - pz[0]) + w2 * (pz[2] - pz[0]);
        const idx = j * N + i;
        if (z > buf[idx]) buf[idx] = z;
      }
    }
  }
  return buf;
}

/* of the subject loop's footprint, the fraction the SAC is in front of — in the beat's own camera,
   over the beat's own shown list. Returns the fraction, what was in front INSTEAD and by how much of
   the loop, and any key that produced no geometry; the caller asserts all three. */
function sacSeen(which, view, shownKeys) {
  const B = viewAxis(view || 'anterior');
  const subjKey = which === 'gastroschisis' ? 'gastroschisis_bowel' : 'omphalocele_gut';
  const subject = trisOfKey(subjKey);
  if (!subject) return { frac: 0, inFront: {}, missing: [subjKey], pixels: 0 };
  let lo0 = 1e9, hi0 = -1e9, lo1 = 1e9, hi1 = -1e9;
  for (let q = 0; q < subject.length; q++) { const T3 = subject[q];
    for (let k = 0; k < 3; k++) { const x = T3[k*3], y = T3[k*3+1], z = T3[k*3+2];
      const a = x*B.u[0] + y*B.u[1] + z*B.u[2], b = x*B.v[0] + y*B.v[1] + z*B.v[2];
      if (a < lo0) lo0 = a; if (a > hi0) hi0 = a; if (b < lo1) lo1 = b; if (b > hi1) hi1 = b; } }
  const pad = 0.02 * ((hi0 - lo0) + (hi1 - lo1));
  const box = { lo0: lo0 - pad, hi0: hi0 + pad, lo1: lo1 - pad, hi1: hi1 + pad };
  const N = SEEN_GRID;
  const sub = depthBuffer(subject, B, box, N);
  const missing = [], others = [];
  let sacBuf = null;
  for (const key of (shownKeys || [])) {
    if (key === subjKey) continue;                       // the subject is not its own occluder
    const tris = trisOfKey(key);
    if (!tris) { missing.push(key); continue; }
    const buf = depthBuffer(tris, B, box, N);
    if (partOfKey(key).part === 'sac') sacBuf = buf; else others.push({ key: key, buf: buf });
  }
  let n = 0, covered = 0; const inFront = {};
  for (let k = 0; k < N * N; k++) {
    if (sub[k] === -Infinity) continue;
    n++;
    let bestZ = sub[k], bestKey = null;
    if (sacBuf && sacBuf[k] > bestZ + 1e-9) { bestZ = sacBuf[k]; bestKey = '@sac'; }
    for (let o = 0; o < others.length; o++) {
      const z = others[o].buf[k];
      if (z > bestZ + 1e-9) { bestZ = z; bestKey = others[o].key; }
    }
    if (bestKey === '@sac') covered++;
    else if (bestKey) inFront[bestKey] = (inFront[bestKey] || 0) + 1;
  }
  for (const k of Object.keys(inFront)) inFront[k] = inFront[k] / n;
  return { frac: n ? covered / n : 0, inFront: inFront, missing: missing, pixels: n };
}

/* THE BEATS THAT CARRY A SCREEN-PLANE COVERAGE CLAIM, and what each one draws. Kept HERE rather than
   read from the scene so acceptance() stays a property of the MODEL and runs with no scene loaded;
   the render harness checks these lists against the scene's own ops, so the two cannot drift
   unnoticed. Beat 6 no longer draws omphalocele_cord — see the scene's provenance for round 5. */
const SEEN_BEATS = {
  6: { view: 'anterior',
       shown: ['gastroschisis_wall', 'gastroschisis_somatic', 'umbilicalring',
               'omphalocele_gut', 'omphalocele_sac', 'gastroschisis_bowel'] },
};
let _seenCache = {};
function seenAt(beat, which) {
  const ck = beat + '/' + which;
  if (_seenCache[ck]) return _seenCache[ck];
  const S = SEEN_BEATS[beat];
  if (!S) throw new Error('no shown-list recorded for beat ' + beat);
  const r = sacSeen(which, S.view, S.shown);
  _seenCache[ck] = r;
  return r;
}

/* ------------------------------------- HOW MUCH OF THE PICTURE A STRUCTURE ACTUALLY IS

   Review round 7's finding, and the FOURTH instance of this item's one recurring shape: a measure
   that certifies a picture it cannot see. B3-meso reads mesentery.wall_thickness — 0.085 at t=1, a
   true fact about the built sheet, and a fact it would report unchanged with the sheet entirely
   invisible. Which is what it did: the dorsal mesentery is named by beat 3's and beat 4's narration
   and drew 0.676% and 0.000% of subject, and "dorsal versus ventral mesentery" is examinable.

   sacSeen() above answers "is the sac the thing in front of the loop". That is a question about a
   PAIR. The mesentery needed a different question — "how much of this frame is this structure, and
   is anything in front of it" — so this is not sacSeen generalised, it is the other half of it.

   TWO NUMBERS, because either one alone is passed by a wrong picture:

     visible  of the structure's OWN footprint, the fraction whose nearest surface is the structure
              itself. Catches occlusion. It is ~1 for the mesentery in beat 3 — nothing hides it
              there, it is simply edge-on — so this number alone would have certified the defect.
     share    the structure's visible pixels over every pixel ANY shown structure covers: the
              orthographic analogue of what the player walk calls "% of subject", and the number
              that separates an edge-on sliver from a sheet seen face-on. This is the one that
              fails on beat 3 and passes on a profile camera.

   THE BOX IS THE UNION of every shown structure's footprint, not the subject's own bounding box, so
   `share` is a share of the frame the beat draws. A shown key that resolves to no geometry goes in
   `missing` and FAILS the row rather than being skipped, for the same reason it does in sacSeen: a
   measure that cannot see a structure must not pass.                                              */
function shareSeen(subjectKey, view, shownKeys) {
  const B = viewAxis(view || 'anterior');
  const keys = (shownKeys || []).slice();
  if (keys.indexOf(subjectKey) < 0) keys.push(subjectKey);
  const missing = [], tris = {};
  let lo0 = 1e9, hi0 = -1e9, lo1 = 1e9, hi1 = -1e9;
  for (const key of keys) {
    const t3 = trisOfKey(key);
    if (!t3) { missing.push(key); continue; }
    tris[key] = t3;
    for (let q = 0; q < t3.length; q++) { const T3 = t3[q];
      for (let k = 0; k < 3; k++) { const x = T3[k*3], y = T3[k*3+1], z = T3[k*3+2];
        const a = x*B.u[0] + y*B.u[1] + z*B.u[2], b = x*B.v[0] + y*B.v[1] + z*B.v[2];
        if (a < lo0) lo0 = a; if (a > hi0) hi0 = a; if (b < lo1) lo1 = b; if (b > hi1) hi1 = b; } }
  }
  if (!tris[subjectKey] || !(hi0 > lo0))
    return { share: 0, visible: 0, inFront: {}, missing: missing, pixels: 0, framePixels: 0 };
  const pad = 0.02 * ((hi0 - lo0) + (hi1 - lo1));
  const box = { lo0: lo0 - pad, hi0: hi0 + pad, lo1: lo1 - pad, hi1: hi1 + pad };
  const N = SEEN_GRID, bufs = [];
  for (const key of Object.keys(tris)) bufs.push({ key: key, buf: depthBuffer(tris[key], B, box, N) });
  let subBuf = null;
  for (const b of bufs) if (b.key === subjectKey) subBuf = b.buf;
  let framePixels = 0, own = 0, subjPixels = 0; const inFront = {};
  for (let k = 0; k < N * N; k++) {
    let bestZ = -Infinity, bestKey = null;
    for (let o = 0; o < bufs.length; o++) {
      const z = bufs[o].buf[k];
      if (z === -Infinity) continue;
      if (z > bestZ + 1e-9) { bestZ = z; bestKey = bufs[o].key; }
    }
    if (bestKey !== null) framePixels++;
    if (subBuf[k] === -Infinity) continue;
    subjPixels++;
    if (bestKey === subjectKey) own++;
    else if (bestKey) inFront[bestKey] = (inFront[bestKey] || 0) + 1;
  }
  for (const k of Object.keys(inFront)) inFront[k] = inFront[k] / subjPixels;
  return { share: framePixels ? own / framePixels : 0,
           visible: subjPixels ? own / subjPixels : 0,
           inFront: inFront, missing: missing, pixels: subjPixels, framePixels: framePixels };
}

/* THE BEATS THAT CARRY A FRAME-SHARE CLAIM, and what each one draws — the same second copy as
   SEEN_BEATS and checked against the scene's ops by the render harness for the same reason. */
const SHARE_BEATS = {
  11: { view: 'lateral', subject: 'mesentery',
        shown: ['ectoderm_open', 'somatic_open', 'splanchnic', 'endoderm', 'mesentery'] },
};
let _shareCache = {};
function shareAt(beat) {
  const ck = String(beat);
  if (_shareCache[ck]) return _shareCache[ck];
  const S = SHARE_BEATS[beat];
  if (!S) throw new Error('no shown-list recorded for beat ' + beat);
  const r = shareSeen(S.subject, S.view, S.shown);
  _shareCache[ck] = r;
  return r;
}

/* ------------------------------------- WHAT IS SEEN THROUGH THE HOLE, BY STRUCTURE

   RENDER-STANDARD 3.aa, applied to an APERTURE instead of to a membrane — and it is the measure
   whose absence let the same wrong diagnosis back in through a second door.

   Beat 8's three claims (B8-two, B8-bridge, B8-duct) all measure THE WALL: how many openings there
   are, how much intact wall lies between them, how wide the duct is. Nothing measured WHAT IS
   VISIBLE THROUGH an opening. So the wall could be exactly right — two holes, an intact bridge,
   bladder exstrophy and not OEIS — while the picture inside the caudal hole showed the gut tube
   beside the bladder plate, which is the scene's own stated discriminator for the SEVERE form:
   "The more severe cloacal exstrophy adds bowel to the same open field." Round 1 found this beat
   drawing cloacal exstrophy and the round-2 fix answered it ON THE WALL; round 6 found it again,
   through the field. Measured then: plate 0.591, gut 0.409 of everything exposed.

   THE REGION IS THE WALL'S, NOT THE PLATE'S, which is what keeps this from being circular. The
   aperture is rasterised as its own quad strip between the free edges apertureCaudal() reports —
   the hole, as the sheet leaves it. The HITS are first-hit depth over the beat's whole shown list,
   on built triangles, so anything drawn in the window counts for whatever it is.

   THREE NUMBERS COME OUT and all three are gated:
     plate   of the aperture, the fraction whose nearest surface is the bladder plate
     gut     of the aperture, the fraction whose nearest surface is bowel — the one that names
             the lesion wrongly, so it carries a ceiling and not a floor
     seenIn  of the PLATE's own visible footprint, the fraction lying inside the aperture: the
             plate is seen THROUGH the hole, not lying across the wall beside it. This is the claim
             the old row K made with a y-clearance proxy; see ACCEPTANCE K for why it moved here.

   A shown key that resolves to no geometry goes in `missing` and FAILS the row rather than being
   skipped — a measure that cannot see an occluder is the fault being fixed.                      */

const APERTURE_GRID = 240;
const GUT_KEYS = ['endoderm', 'vitelline'];

let _apCache = {};
function apertureField(view, shownKeys) {
  const ck = (view || 'anterior') + '|' + (shownKeys || []).join(',');
  if (_apCache[ck]) return _apCache[ck];
  const B = viewAxis(view || 'anterior');
  const O = outerRows(1, { exstrophy: true });
  const AP = apertureCaudal(O, O.ns);
  const res = { plate: 0, gut: 0, seenIn: 0, byKey: {}, cells: 0, plateCells: 0, missing: [] };
  if (!AP) { res.missing.push('@aperture'); return (_apCache[ck] = res); }

  const ns = O.ns, apTris = [];
  for (let j = AP.jA; j < AP.jB; j++) {
    const R0 = O.rows[j], R1 = O.rows[j + 1], y0 = AP.y[j], y1 = AP.y[j + 1];
    const a = [R0[0].x, y0, R0[0].z], b = [R0[ns].x, y0, R0[ns].z];
    const c = [R1[ns].x, y1, R1[ns].z], d = [R1[0].x, y1, R1[0].z];
    apTris.push([a[0], a[1], a[2], b[0], b[1], b[2], c[0], c[1], c[2]]);
    apTris.push([a[0], a[1], a[2], c[0], c[1], c[2], d[0], d[1], d[2]]);
  }
  const plateTris = trisOfKey('exstrophy_plate');
  if (!plateTris) res.missing.push('exstrophy_plate');

  let lo0 = 1e9, hi0 = -1e9, lo1 = 1e9, hi1 = -1e9;
  const take = T3 => { for (let k = 0; k < 3; k++) {
    const x = T3[k * 3], y = T3[k * 3 + 1], z = T3[k * 3 + 2];
    const a = x * B.u[0] + y * B.u[1] + z * B.u[2], b = x * B.v[0] + y * B.v[1] + z * B.v[2];
    if (a < lo0) lo0 = a; if (a > hi0) hi0 = a; if (b < lo1) lo1 = b; if (b > hi1) hi1 = b; } };
  for (const T3 of apTris) take(T3);
  if (plateTris) for (const T3 of plateTris) take(T3);
  if (!(hi0 > lo0 && hi1 > lo1)) { res.missing.push('@box'); return (_apCache[ck] = res); }
  const pad = 0.02 * ((hi0 - lo0) + (hi1 - lo1));
  const box = { lo0: lo0 - pad, hi0: hi0 + pad, lo1: lo1 - pad, hi1: hi1 + pad };
  const N = APERTURE_GRID;

  const apBuf = depthBuffer(apTris, B, box, N);
  const bufs = [];
  for (const key of (shownKeys || [])) {
    const tris = trisOfKey(key);
    if (!tris) { res.missing.push(key); continue; }
    bufs.push({ key: key, buf: depthBuffer(tris, B, box, N) });
  }

  let cells = 0, plateIn = 0, gutIn = 0, plateCells = 0, plateSeenIn = 0;
  const byKey = {};
  for (let k = 0; k < N * N; k++) {
    let bestZ = -Infinity, bestKey = null;
    for (let o = 0; o < bufs.length; o++) {
      const z = bufs[o].buf[k];
      if (z > bestZ + 1e-9) { bestZ = z; bestKey = bufs[o].key; }
    }
    const inAp = apBuf[k] > -Infinity;
    if (bestKey === 'exstrophy_plate') { plateCells++; if (inAp) plateSeenIn++; }
    if (!inAp) continue;
    cells++;
    const kk = bestKey || 'nothing';
    byKey[kk] = (byKey[kk] || 0) + 1;
    if (kk === 'exstrophy_plate') plateIn++;
    else if (GUT_KEYS.indexOf(kk) >= 0) gutIn++;
  }
  for (const k of Object.keys(byKey)) byKey[k] = byKey[k] / cells;
  res.cells = cells; res.plateCells = plateCells; res.byKey = byKey;
  res.plate = cells ? plateIn / cells : 0;
  res.gut = cells ? gutIn / cells : 1;
  res.seenIn = plateCells ? plateSeenIn / plateCells : 0;
  return (_apCache[ck] = res);
}

/* THE BEATS THAT CARRY AN APERTURE-FIELD CLAIM, and what each one draws — the same arrangement as
   SEEN_BEATS and for the same reason: acceptance() stays a property of the MODEL and runs with no
   scene loaded, and the render harness asserts this list against the scene's own ops so the two
   cannot drift. */
const APERTURE_BEATS = {
  8: { view: 'anterior',
       shown: ['exstrophy_wall', 'exstrophy_somatic', 'umbilicalring',
               'exstrophy_plate', 'endoderm', 'vitelline'] },
};
function fieldAt(beat) {
  const S = APERTURE_BEATS[beat];
  if (!S) throw new Error('no aperture shown-list recorded for beat ' + beat);
  return apertureField(S.view, S.shown);
}

function sacClearance(which) {
  const S = sacSphere();
  const P = which === 'gastroschisis' ? gastroPath() : hernPath();
  const r = which === 'gastroschisis' ? 0.095 : 0.115;
  const k0 = which === 'gastroschisis' ? 0 : 9;
  let worstIn = -1e9, worstOut = 1e9;
  for (let k = k0; k < P.length; k++) {
    const d = Math.hypot(P[k].x - S.c.x, P[k].y - S.c.y, P[k].z - S.c.z);
    worstIn = Math.max(worstIn, (d + r - S.r) / S.r);      // <= 0 everywhere means wholly inside
    worstOut = Math.min(worstOut, (d - r - S.r) / S.r);    // >  0 everywhere means wholly outside
  }
  return which === 'gastroschisis' ? worstOut : worstIn;
}

const TERMINALS = [
  { key: 'herniation',    opts: { herniation: true },    path: hernPath,   r: 0.115, capped: 'end' },
  { key: 'gastroschisis', opts: { gastroschisis: true }, path: gastroPath, r: 0.095, capped: 'end' },
  /* the cord stubs. Free end in mid-air at the far end, buried end sunk into the sac or into the
     wall at the ring, so both take exactly one dome and the render tool re-measures which end. */
  { key: 'cord', variant: 'omphalocele',   opts: { omphalocele: true },   path: cordPathOmphalocele, r: CORD_R, capped: 'end' },
  { key: 'cord', variant: 'gastroschisis', opts: { gastroschisis: true }, path: cordPathGastro,      r: CORD_R, capped: 'end' },
];

/* ------------------------------------------------------------------- build */

function buildFold(t, opts) {
  opts = opts || {};
  t = clamp(t, 0, 1);
  const g = new T.Group();

  const O = outerRows(t, opts);
  const G = gutRows(t);
  const nsO = O.ns, nsG = G.ns;

  /* ---- the somatopleure: ectoderm outside, somatic mesoderm inside ---- */
  const dropGastro = (i, j) => opts.gastroschisis ? gastroDrop(nsO)(i, j) : false;
  const dropCut = (i, j) => {
    if (!opts.cutaway) return false;
    const v = frac(i + 0.5, nsO);
    return v > 0.30 && v < 1.0;                      // the embryo's LEFT half, opened
  };
  {
    const ec = gridsFromRows(O.rows, nsO, NY, yOf, OFF.ectoderm.c, OFF.ectoderm.h);
    addSheet(g, 'ectoderm', ec.A, ec.B, nsO, NY, (i, j) => !dropGastro(i, j) && !dropCut(i, j));
    const so = gridsFromRows(O.rows, nsO, NY, yOf, OFF.somatic.c, OFF.somatic.h);
    addSheet(g, 'somatic', so.A, so.B, nsO, NY, (i, j) => {
      if (dropGastro(i, j) || dropCut(i, j)) return false;
      return Math.abs(frac(i + 0.5, nsO)) * SO >= S_SOM;   // the somites occupy the paraxial station
    });
  }

  /* ---- the splanchnopleure: splanchnic mesoderm outside, endoderm lining ---- */
  {
    const sp = gridsFromRows(G.rows, nsG, NY, yOf, OFF.splanchnic.c, OFF.splanchnic.h);
    addSheet(g, 'splanchnic', sp.A, sp.B, nsG, NY,
      (i) => Math.abs(frac(i + 0.5, nsG)) * G.S >= S_SPL);   // the mesenteric root attaches here
    const en = gridsFromRows(G.rows, nsG, NY, yOf, OFF.endoderm.c, OFF.endoderm.h);
    addSheet(g, 'endoderm', en.A, en.B, nsG, NY, null);
  }

  /* ---- the intraembryonic coelom ----

     A RULED FILL between the somatic mesoderm's inner face and the splanchnic mesoderm's outer face,
     paired by SIGNED ARC FRACTION. That pairing is the honest one and it is honest for a reason
     worth stating: at t = 0 the two sheets have the SAME arc length, so equal fractions are equal
     distances and the cavity comes out as the thin flat slit it really is; at t = 1 the gut's arc is
     shorter, so the same pairing fans out and fills the annulus the peritoneal cavity really is. The
     medial cut-off travels from the lateral plate's own edge to the mesenteric root as the folds
     close, which is prescribed and not solved.

     What it is NOT: the fill has a rim in the median plane ventral to the gut, where in life the two
     sides of the cavity are simply continuous. That rim is a drawing convention, it is declared in
     the scene's gaps[], and it is why the coelom is rendered translucent rather than as a solid. */
  if (opts.coelom !== false) {
    const uc = 0.22 * (1 - t) + 0.045 * t;
    const A = grid3(nsO, NY), B = grid3(nsO, NY);
    for (let j = 0; j <= NY; j++) {
      const y = yOf(j), RO = O.rows[j], RG = G.rows[j];
      const offO = OFF.somatic.c - OFF.somatic.h / 2 - 0.008;
      const offG = OFF.splanchnic.c + OFF.splanchnic.h / 2 + 0.008;
      for (let i = 0; i <= nsO; i++) {
        const v = frac(i, nsO);
        // outer boundary
        const i0 = i > 0 ? i - 1 : 0, i1 = i < nsO ? i + 1 : nsO;
        let tx = RO[i1].x - RO[i0].x, tz = RO[i1].z - RO[i0].z;
        let L = Math.hypot(tx, tz) || 1; tx /= L; tz /= L;
        A[GI(NY, i, j)] = new T.Vector3(RO[i].x + offO * tz, y, RO[i].z - offO * tx);
        // inner boundary: the SAME signed arc fraction on the gut
        const kf = (clamp(v, -1, 1) * 0.5 + 0.5) * nsG;
        const k = clamp(Math.round(kf), 0, nsG);
        const k0 = k > 0 ? k - 1 : 0, k1 = k < nsG ? k + 1 : nsG;
        let gx = RG[k1].x - RG[k0].x, gz = RG[k1].z - RG[k0].z;
        L = Math.hypot(gx, gz) || 1; gx /= L; gz /= L;
        B[GI(NY, i, j)] = new T.Vector3(RG[k].x + offG * gz, y, RG[k].z - offG * gx);
      }
    }
    addSheet(g, 'coelom', A, B, nsO, NY,
      (i) => Math.abs(frac(i + 0.5, nsO)) >= uc,
      { noOutline: true, matOver: { transparent: true, opacity: 0.20, depthWrite: false, roughness: 0.9 }, renderOrder: 6 });
  }

  /* ---- the dorsal mesentery ----

     A MEMBRANE TAPERS (RENDER-STANDARD). It is drawn from the dorsal body wall, ventral to the
     notochord, down to the gut's dorsal surface, and its transverse thickness narrows to nothing
     where it meets what it suspends — drawn with a constant free edge it reads as a slab of card
     standing behind the subject, which is precisely the defect that rule was written for. Its
     THINNING WITH t — from a broad block of mesoderm to a double leaf of peritoneum — is prescribed
     rather than solved, and is the model's largest declared approximation after the amnion. */
  if (opts.mesentery !== false) {
    const M = mesenteryGrids(t);
    addSheet(g, 'mesentery', M.A, M.B, M.NM, NY, null, { outline: 0.014 });
  }

  /* ---- the dorsal midline: neural tube, notochord, somites ----
     Context, and the motor of the fold: the narration says the somites grow and push the edges of
     the disc down and in, so they have to be on screen for that sentence to mean anything. Through
     the kit's own tube builder — a model that rolls its own sweep is a bug, not a style choice. */
  const yPath = (n) => { const p = []; for (let k = 0; k <= n; k++) p.push(new T.Vector3(0, yOf(k / n * NY), 0)); return p; };
  if (opts.neural !== false) {
    /* PLACED AGAINST THE WALL THAT CONTAINS THEM, not at a comfortable z. At the first placement the
       neural tube and both somite rows stood 0.06-0.10 PROUD of the closed body wall at t = 1 — they
       were positioned in the flat disc, where there is no wall to be outside of, and nothing checked
       them once the wall came round. Every dorsal-midline structure is now inside the ring's inner
       radius with clearance, and the render's caudal camera is the view that shows it. */
    const pts = []; for (let k = 0; k <= 24; k++) pts.push(new T.Vector3(0, -YLEN / 2 + YLEN * k / 24, -0.03));
    K.addSolid(g, 'neural', K.tubeAlong(pts, () => 0.110, { ring: 20, seed: new T.Vector3(1, 0, 0) }),
      { color: LAYERS.neural.color, name: LAYERS.neural.name, outline: 0.018 });
  }
  if (opts.notochord !== false) {
    const pts = []; for (let k = 0; k <= 24; k++) pts.push(new T.Vector3(0, -YLEN / 2 + YLEN * k / 24, 0.140));
    K.addSolid(g, 'notochord', K.tubeAlong(pts, () => 0.040, { ring: 14, seed: new T.Vector3(1, 0, 0) }),
      { color: LAYERS.notochord.color, name: LAYERS.notochord.name, outline: 0.012 });
  }
  if (opts.somite !== false) {
    /* SEGMENTED, because that is what a somite is. The calibre pinches on a fixed pitch along y, so
       the pair reads as a row of blocks rather than as two rods. */
    const PITCH = 0.40;
    for (const sgn of [+1, -1]) {
      const pts = []; for (let k = 0; k <= 60; k++) pts.push(new T.Vector3(sgn * 0.30, -YLEN / 2 + YLEN * k / 60, 0.05));
      const geo = K.tubeAlong(pts, u => {
        const yy = -YLEN / 2 + YLEN * u;
        const ph = Math.abs(((yy / PITCH) % 1 + 1) % 1 - 0.5) * 2;   // 0 at a boundary, 1 mid-somite
        return 0.070 + 0.075 * Math.pow(ph, 0.7);
      }, { ring: 16, seed: new T.Vector3(0, 0, 1) });
      K.addSolid(g, 'somite', geo, { color: LAYERS.somite.color, name: LAYERS.somite.name, outline: 0.016 });
    }
  }

  /* ---- the vitelline duct and the yolk sac ----

     THE NECK IS NOT DRAWN, IT IS MEASURED. The duct's calibre at every station is the gut sheet's
     own solved free-edge gap — the same number the gut's closure was solved for — so "the wide
     connection between midgut and yolk sac narrows to a thin vitelline duct" is geometry and not a
     caption, and it narrows in BOTH directions: across the midline because the gut closes, and along
     the body because the ring's window in y closes around it.

     The BALLOON is a prescribed ellipse and is declared as such here and in the scene's gaps[]. It is
     extraembryonic context; nothing examinable rests on its shape, and the thing that does rest on
     geometry — the neck — is derived. Its cranio-caudal taper is ramped by t so that at t = 0 it is
     a cut surface continuing beyond the block, which is what a section of a wide yolk sac is, and at
     t = 1 it is a closed sac hanging in the cord. */
  /* THE SAC AND THE DUCT NARROW ON DIFFERENT SCHEDULES, and conflating them made the yolk sac a
     flat lens 0.6 deep: the sac's cranio-caudal extent had been tied to the DUCT's window in y,
     which is 0.2 wide because it has to fit in the cord. The duct's y extent is the gut's own
     solved gap; the sac's is its own. */
  const yolkHalf = (YLEN / 2) * (1 - t) + 0.78 * t;
  if (opts.yolksac !== false) {
    const RxY = 3.15 * (1 - t) + 0.78 * t, RzY = 1.25 * (1 - t) + 0.70 * t;
    const Ldur = 0.06 + 1.42 * t;
    const NE = 56, ND = Math.max(2, Math.round(Ldur / 0.10));
    const nsY = ND + NE + ND;
    const A = grid3(nsY, NY), B = grid3(nsY, NY);
    const TH = 0.055;
    const pushRow = (j) => {
      const y = yOf(j);
      const fy = clamp(1 - t * (1 - Math.sqrt(Math.max(0, 1 - Math.pow(y / yolkHalf, 2)))), 0.16, 1);
      const R = G.rows[j];
      const zEdge = R[nsG].z;                                  // the gut's own free-edge station
      const gx = Math.max(0.004, Math.abs(R[nsG].x) * fy);
      const rx = Math.max(gx * 1.02, RxY * fy), rz = Math.max(0.10, RzY * fy);
      const zd = zEdge + Ldur * fy;
      const cs = clamp(gx / rx, 0, 0.999);
      const zc = zd + rz * Math.sqrt(1 - cs * cs);
      const phiN = Math.asin(cs);                              // neck angle, measured from the ventral pole
      const pts = new Array(nsY + 1);
      for (let k = 0; k <= ND; k++) {                          // LEFT duct wall, gut edge -> neck
        const u = k / ND;
        pts[k] = { x: gx, z: zEdge + (zd - zEdge) * u };
      }
      /* phi is measured from the ellipse's DORSAL extreme, which is where the neck is: at phi = phiN
         the point is exactly (gx, zd), the bottom of the duct. Walking phi UPWARD from +phiN to
         2pi - phiN goes left side -> ventral pole -> right side, which is the direction that keeps
         yhat x T pointing out of the sac. Written the other way round first, and the probes said so
         before any render did: the outward-normal fraction on the sac's own hull came back 0.318 and
         four rays out of 2900 met a backface. A traversal direction is a winding decision wearing a
         different hat. */
      for (let k = 1; k <= NE; k++) {
        const phi = phiN + (k / NE) * (2 * Math.PI - 2 * phiN);
        pts[ND + k] = { x: rx * Math.sin(phi), z: zc - rz * Math.cos(phi) };
      }
      for (let k = 1; k <= ND; k++) {                          // RIGHT duct wall, neck -> gut edge
        const u = 1 - k / ND;
        pts[ND + NE + k] = { x: -gx, z: zEdge + (zd - zEdge) * u };
      }
      return pts;
    };
    const rows = new Array(NY + 1), hasDuct = new Array(NY + 1);
    for (let j = 0; j <= NY; j++) {
      rows[j] = pushRow(j);
      hasDuct[j] = Math.abs(rows[j][0].x) > 0.020;
    }
    const gr = gridsFromRows(rows, nsY, NY, yOf, 0, TH);
    /* The duct is its OWN key: a student is asked about the vitelline duct, not about the sac. And
       it exists only where there is a duct to have — where the gut's solved gap has closed, the two
       duct walls have collapsed onto each other and the ellipse closes on itself, so the cells are
       dropped rather than emitted as a degenerate sliver. That is also why gx is allowed to reach
       zero now instead of being clamped off it. */
    addSheet(g, 'vitelline', gr.A, gr.B, nsY, NY,
      (i, j) => ((i < ND) || (i >= ND + NE)) && hasDuct[j] && hasDuct[j + 1], { outline: 0.014 });
    addSheet(g, 'yolksac', gr.A, gr.B, nsY, NY, (i) => (i >= ND - 1) && (i < ND + NE + 1), { outline: 0.018 });
  }

  /* ---- the amnion ----
     PRESCRIBED, and labelled so. An enclosing loop that begins as a dome over the dorsal surface of
     the disc and ends as a sac around the whole embryo, notched at the umbilicus where it becomes
     continuous with the cord. Extraembryonic context: it carries no examinable relation, and its
     continuity with the ectoderm at the ring is drawn rather than derived. */
  if (opts.amnion !== false) {
    const zc = z0O * (1 - t) + 0.671 * t;
    const rx = 3.35 * (1 - t) + 1.62 * t, rz = 1.55 * (1 - t) + 1.66 * t;
    const phi0 = (Math.PI / 2) * (1 - t) + 0.20 * t;
    const nsA = 84;
    const rows = new Array(NY + 1);
    for (let j = 0; j <= NY; j++) {
      const p = new Array(nsA + 1);
      for (let i = 0; i <= nsA; i++) {
        const phi = (2 * Math.PI - phi0) - (i / nsA) * (2 * Math.PI - 2 * phi0);
        p[i] = { x: rx * Math.sin(phi), z: zc + rz * Math.cos(phi) };
      }
      rows[j] = p;
    }
    const gr = gridsFromRows(rows, nsA, NY, yOf, 0, 0.040);
    addSheet(g, 'amnion', gr.A, gr.B, nsA, NY, null,
      { noOutline: true, matOver: { transparent: true, opacity: 0.16, depthWrite: false }, renderOrder: 4 });
  }

  /* ---- the umbilical ring ----
     DERIVED FROM THE HOLE, not drawn beside it: the path is the body wall's own free edges at the
     stations where the closure target is not zero, so if the ring ever stopped being a hole the ring
     would stop being a ring. */
  if (opts.umbilicalring !== false) {
    const js = [];
    /* A RING IS A HOLE IN SOMETHING. At half closure the free edges are 1.5 apart and the path
       through them is not a ring, it is the whole open front of the embryo — drawn anyway by the
       first version, as a purple bar across the top of every mid-stage render. The ring appears only
       where the wall around it has actually come together. */
    for (let j = 0; j <= NY; j++) {
      const y = yOf(j), rg = ringGap(y, opts);
      if (rg > 0.02 && outerTarget(y, t, opts) <= rg * 1.35 + 0.02) js.push(j);
    }
    /* ONE RING PER HOLE, AND THIS ONE IS THE UMBILICAL RING.

       FOUND THIS RUN BY LOOKING AT THE RENDER, after the exstrophy window had been separated from the
       ring and every number said so. js is every station where the wall has a gap; walking up all the
       left lips and back down all the right lips makes ONE closed loop, which was right while there was
       one hole and became wrong the moment there were two: the tube ran round the umbilicus, sent two
       struts down across the bridge of intact wall this run had just built, and ran round the bladder
       plate as well. The geometry was correct, the acceptance battery was correct, the visibility walk
       passed, and the picture still said the two openings were one — the same sentence the old window
       said, in a different structure. So: split js into contiguous runs and keep the run that contains
       the umbilicus. A ring is a hole in something, and it is a hole in ONE thing. The exstrophic
       opening's own rim is not drawn, because nothing names it; acceptance row L asserts that whatever
       IS drawn stays inside the cranial opening. */
    const runs = [];
    for (const j of js) {
      const last = runs[runs.length - 1];
      if (last && j === last[last.length - 1] + 1) last.push(j); else runs.push([j]);
    }
    const jUmb = Math.round((Y_UMB / YLEN + 0.5) * NY);
    let pick = null, bestD = 1e9;
    for (const r of runs) { const d = Math.min(Math.abs(r[0] - jUmb), Math.abs(r[r.length - 1] - jUmb));
                            if (d < bestD) { bestD = d; pick = r; } }
    js.length = 0; if (pick) for (const j of pick) js.push(j);
    if (js.length > 2) {
      const path = [], off = 0.075;
      const edge = (j, idx) => {
        const R = O.rows[j], p = R[idx];
        const q = R[idx === 0 ? 1 : nsO - 1];
        let tx = p.x - q.x, tz = p.z - q.z; const L = Math.hypot(tx, tz) || 1;
        return new T.Vector3(p.x + off * tx / L, yOf(j), p.z + off * tz / L);
      };
      for (const j of js) path.push(edge(j, nsO));                       // up the LEFT lip
      for (let k = js.length - 1; k >= 0; k--) path.push(edge(js[k], 0)); // back down the RIGHT lip
      path.push(path[0].clone());
      K.addSolid(g, 'umbilicalring', K.tubeAlong(path, () => 0.045, { ring: 14 }),
        { color: LAYERS.umbilicalring.color, name: LAYERS.umbilicalring.name, outline: 0.016 });
    }
  }

  /* ---- what comes through the hole ----

     THE LESIONS ARE THE SAME FUNCTION, NOT FOUR MORE MODELS. Exstrophy is ringGap() carried
     caudally — one line, above. Gastroschisis is a window dropped out of the somatopleure on the
     embryo's RIGHT, with the ventral midline left to close normally, which is why the cord inserts
     normally in it and on the sac in omphalocele. Herniation and omphalocele share their bowel: the
     difference between a normal week-six hernia and a lesion is the SAC, so the sac is its own key
     and the scene can show the bowel with it and without it. */
  /* BOTH OF THESE END IN MID-AIR AT ONE END AND ARE BURIED AT THE OTHER, so both get exactly one
     dome. RENDER-STANDARD section 3: a tube that ends in mid-air needs a rounded end, not an annulus —
     sweptShell's flat terminal disc reads as an open pipe with a lit inner surface, which is the one
     thing that document says must never be visible, and the flat cut end was plainly visible in
     t100-gast-ventral.png. domeCap had been called ZERO times in this file; K.tubeCapped is the kit's
     own tubeAlong-plus-dome, so the frame, the station index, the sign and the radius are not
     re-derived at the call site.

     WHICH END, MEASURED AND NOT REASONED, the way heart-external.js does it: a hemisphere of rays is
     cast from each terminal centre against the rest of the model. The cranial/proximal ends came back
     144/144 and 142/144 blocked — they are inside the body wall, where a dome would only protrude
     through the neighbour it is hiding in — and the distal ends 36/144 and 14/144, i.e. open space.
     So `cap: 'end'`, on both, and the render tool re-runs that probe and asserts the split. */
  if (opts.herniation || opts.omphalocele) {
    K.addSolid(g, 'herniation', K.tubeCapped(hernPath(), () => 0.115, { ring: 16, cap: 'end' }),
      { color: LAYERS.herniation.color, name: LAYERS.herniation.name, outline: 0.020 });
  }
  if (opts.omphalocele) {
    /* THE MEMBRANE IS THE DIAGNOSTIC FEATURE, so it is a structure and not a shading effect — and
       since review round 2 it is also a MEASURED one: sacSphere() below is the single derivation,
       called both here and by sac.covers_* , so the membrane a student sees and the number that
       certifies it cannot be two different spheres. It used to be derived inline, here only. */
    const S = sacSphere();
    const c = new T.Vector3(S.c.x, S.c.y, S.c.z);
    const geo = new T.SphereGeometry(S.r, 40, 28);
    geo.translate(c.x, c.y, c.z);
    K.addSolid(g, 'sac', geo, {
      color: LAYERS.sac.color, name: LAYERS.sac.name, noOutline: true,
      matOver: { transparent: true, opacity: 0.30, depthWrite: false }, renderOrder: 8,
    });
  }
  if (opts.gastroschisis) {
    const p = gastroPath();
    K.addSolid(g, 'gastroschisis', K.tubeCapped(p, () => 0.095, { ring: 14, cap: 'end' }),
      { color: LAYERS.gastroschisis.color, name: LAYERS.gastroschisis.name, outline: 0.018 });
  }
  /* ---- the cord, and the check it lets a student make ----

     Built in the two variants beat 6 compares, and in no others. In 'omphalocele' it inserts ON THE
     SAC; in 'gastroschisis' it inserts on the intact wall at the ring, medial to the window. That is
     the third of beat 6's three checks, and until this run the picture could not support it.

     NOT BUILT in the normal-herniation variant, deliberately and declared: in life the physiological
     hernia lies INSIDE the proximal cord, so an honest cord there is a sleeve around the loop rather
     than a stub beside it, and a stub drawn at the ring would pass through the very bowel the beat is
     about. Beat 5 draws no cord and the scene's gaps[] says why. */
  if (opts.omphalocele || opts.gastroschisis) {
    const which = opts.omphalocele ? 'omphalocele' : 'gastroschisis';
    const F = cordFrame(opts.omphalocele ? {} : { gastroschisis: true });
    K.addSolid(g, 'cord', K.tubeCapped(cordPath(which), () => F.r, { ring: 18, cap: 'end' }),
      { color: LAYERS.cord.color, name: LAYERS.cord.name, outline: 0.020 });
  }
  if (opts.exstrophy) {
    /* ---- THE PLATE IS THE APERTURE'S OWN SHAPE, STATION BY STATION ----

       WHAT THIS REPLACES, AND WHY, because the shape of the mistake is the point again. The plate
       was an ellipsoid with THREE prescribed numbers — a half-height, a half-width and a depth —
       sized to sit INSIDE the slot with a margin all round, and its z was read at ONE station, the
       one nearest the window's centre. Both of those are why review round 6 found bowel in the
       bladder-exstrophy window. An ellipsoid 0.265 half-wide inside a slot 0.340 half-wide leaves
       0.075 of open aperture down each side; one 0.180 half-high in an aperture 0.369 half-high
       leaves the whole of both ends open; and through that rim the ENDODERM is the next surface, so
       the frame added bowel to the open field, which is the scene's own definition of the SEVERE
       form the narration contrasts it with. Measured at the time: 59.1% of the aperture was plate
       and 40.9% was gut.

       The plate is now READ OFF THE SAME FREE EDGES THE HOLE IS MADE OF, at EVERY station:

         half-width   the wall's own ventral half-gap at that station, plus PLATE_LAP
         centre z     that station's own mean ventral edge z — so the plate follows the wall's
                      surface instead of standing proud of it where the wall has closed, which is
                      how the old fixed-z plate came to be drawn lying across intact wall
         thickness    PLATE_LAP at the widest station and tapering with the width, so the plate
                      narrows to nothing where it meets the wall (RENDER-STANDARD, A MEMBRANE
                      TAPERS) rather than ending in a blade

       NOTHING HERE IS SIZED. Move YW_EXST, R_EXST, SOFT_EXST, BRIDGE_F or t and the plate follows,
       because none of them is named below: the aperture is found by the same ventral-gap/bands()
       predicate acceptance() reads J off, and the plate is that aperture with one overlap added.
       The two closed stations bounding the aperture are included so the plate is ROOTED in wall —
       which is also what the real posterior bladder wall is, continuous with the abdominal wall at
       the margin of the defect, not a disc floating in a hole. That contact is construction, not
       anatomy-by-accident, and it is declared by name in the scene's gaps[] per RENDER-STANDARD 3.z.

       WHAT IS STILL PRESCRIBED, in one place: PLATE_LAP. Declared in gaps[]. */
    const AP = apertureCaudal(O, nsO);
    if (AP) {
      const pts = [], hw = [];
      for (let j = AP.jA; j <= AP.jB; j++) {
        pts.push(new T.Vector3(0, AP.y[j], AP.zc[j]));
        hw.push(0.5 * AP.gap[j] + PLATE_LAP);
      }
      const n = pts.length - 1;
      const widest = Math.max.apply(null, hw);
      const rAt = u => {
        const x = clamp(u, 0, 1) * n, i = Math.min(n - 1, Math.floor(x)), f = x - i;
        return hw[i] * (1 - f) + hw[i + 1] * f;
      };
      const geo = K.tubeCapped(pts, rAt, { ring: 30, flatten: PLATE_LAP / widest,
                                           cap: 'both', capRows: 8, bulge: 0.85,
                                           seed: new T.Vector3(1, 0, 0) });
      if (geo) K.addSolid(g, 'exstrophy', geo,
        { color: LAYERS.exstrophy.color, name: LAYERS.exstrophy.name, outline: 0.018 });
    }
  }

  return g;
}

/* ------------------------------------------- measuring the fold, not looking at it

   Every number acceptance() reports is taken off the same profile rows the geometry is built from,
   and every one of them is re-measured on REAL MESH VERTICES by
   viz-training/tools/render-lateral-folding.mjs. A proxy that is never checked against the thing it
   stands for is a claim, not a measurement. */

function rowArcLength(P) { let L = 0; for (let i = 1; i < P.length; i++) L += Math.hypot(P[i].x - P[i - 1].x, P[i].z - P[i - 1].z); return L; }

function segHit(px, pz, dx, dz, P) {
  /* does a ray leaving (px,pz) cross the wall polyline? Exact, in the transverse plane. */
  for (let i = 1; i < P.length; i++) {
    const ax = P[i - 1].x, az = P[i - 1].z, bx = P[i].x - ax, bz = P[i].z - az;
    const den = dx * bz - dz * bx;
    if (Math.abs(den) < 1e-12) continue;
    const s = ((ax - px) * bz - (az - pz) * bx) / den;
    const u = ((ax - px) * dz - (az - pz) * dx) / den;
    if (s > 1e-6 && u >= 0 && u <= 1) return true;
  }
  return false;
}

/* how many of N transverse rays leaving the coelom reach the outside. The topological claim the
   narration makes — "folding pinches those two openings shut" — as a number. */
function escapes(t, j, opts) {
  const O = outerRows(t, opts), G = gutRows(t);
  const RO = O.rows[j], RG = G.rows[j];
  const iw = Math.round(0.82 * O.ns), ig = Math.round(0.82 * G.ns);
  const px = 0.5 * (RO[iw].x + RG[ig].x), pz = 0.5 * (RO[iw].z + RG[ig].z);
  let out = 0;
  const N = 240;
  for (let k = 0; k < N; k++) {
    const a = (k / N) * Math.PI * 2;
    if (!segHit(px, pz, Math.cos(a), Math.sin(a), RO)) out++;
  }
  return { escapes: out, rays: N, from: { x: px, z: pz } };
}

/* THE MAGNITUDE FLOORS, in one place so the model, the prover and any review cannot drift apart
   about what passing means. RENDER-STANDARD: every assertion of the form "A is inside / beside /
   below B" carries a floor expressed as a fraction of the extent the claim is legible against, and
   a sign test written as "> 0" is UNPROVEN however true it is. */
const FLOORS = {
  ARC:    0.005,   // the somatopleure's transverse arc length may drift this fraction from 2*SO
  CLOSE:  0.020,   // residual ventral gap at t=1 away from the umbilicus, over the wall's width
  RING:   0.350,   // the ring's opening, over the gut's outer DIAMETER — bowel has to fit through it
  CLEAR:  0.350,   // least gut-to-wall clearance, over the gut's own outer radius
  DUCT:   0.250,   // the vitelline duct's calibre at t=1, over the gut's outer diameter
  MESO:   0.250,   // mesentery thickness where it meets the gut, over its thickness at the wall
  GASTRO: 0.350,   // defect-to-ring separation in x, over the ring's own width
  EXSTR:  0.350,   // the INTACT BRIDGE between ring and exstrophy in y, over their mean y extent
  PLATE:  0.900,   // of the plate's OWN VISIBLE footprint, the part lying inside the aperture.
                   // WAS 0.060, a y-CLEARANCE inside the caudal open band, and the plate it was
                   // written against could satisfy it while standing proud of the wall beside the
                   // hole - see ACCEPTANCE K. Measured 0.946; a plate pushed 0.30 proud reads
                   // 0.735 and one rooted only in open stations 0.643, so the floor separates
                   // them with room rather than sitting just under the measurement.
  FIELD:  0.950,   // of the wall's own caudal APERTURE, the part whose nearest surface is the plate
  FIELDGUT: 0.020, // ...and the part that is BOWEL, which is the ceiling that names the lesion
  RADIAL: 0.350,   // somatic mean radius - splanchnic mean radius, over the mean of the two
  CREASE: 1.500,   // the crease angle at the linea alba, in units of ONE profile sample's turning
  RINGY:  0.150,   // how far the ring tube may reach past the cranial opening, over that band's extent
  SAC:    0.950,   // of the omphalocele loop's projected area that the membrane must cover
  SACSEEN:0.950,   // ...of it whose NEAREST surface is the membrane, over the whole beat. Measured 1.000
  BARESEEN:0.200,  // ...and of the bare loop's, that the membrane may front. Measured 0.138
  BARE:   0.200,   // ...and of the gastroschisis loop's, that it must NOT. Measured 0.149
  MESOSHARE: 0.080, // of the frame beat 11 draws, the share the DORSAL MESENTERY must be. Measured
                    // 0.126 from `lateral`. The cameras this replaces read 0.003 (beat 3's own set
                    // from `superior`) and 0.000 (beat 4, from `anterior`, wholly behind the gut),
                    // so the floor sits 1.6x under the measurement and 28x over the failing case.
  MESOVIS: 0.950,   // ...and of its OWN footprint, the share whose nearest surface is itself.
                    // Measured 1.000. This is 1.000 in beat 3 TOO — nothing hides the sheet there,
                    // it is edge-on — which is why it is not enough alone and why MESOSHARE is
                    // floored beside it.
  SACIN: -0.050,   // the herniated coil's worst clearance INSIDE the sac, over its radius
  SACOUT: 0.100,   // the bare loop's least clearance OUTSIDE it, over the same radius
  CORDON: 1.000,   // the omphalocele cord's insertion, out on the membrane, over the sac's radius
  CORDAT: 0.150,   // the gastroschisis cord's insertion, at the ring, over the same radius
  CORDSEE:0.900,   // of its own length that a camera must keep, for a beat to SHOW the insertion
  CORDEND:0.100,   // ...and what `anterior` keeps, which is why that is not that beat
  CORDGAP:0.500,   // clear space between the two collinear cords, in cord DIAMETERS
};

const ACCEPTANCE = {
  axes: '+x = embryo LEFT, -x = RIGHT, +y = CRANIAL, +z = VENTRAL',
  t_meaning: 't = 0 flat trilaminar disc (about day 21); t = 1 cylindrical embryo (about day 28)',
  tests: [
    { id: 'A', says: 'the sheets curl, they do not stretch: transverse arc length is conserved',
      must: 'max |arc(t) - 2*SO| / (2*SO) <= FLOORS.ARC over t in 0..1' },
    { id: 'B', says: 'the two somatopleuric edges MEET in the ventral midline',
      must: 'residual gap at t=1, away from the umbilicus, <= FLOORS.CLOSE * wall width' },
    { id: 'C', says: 'and they do not meet at a crease — the wall is continuous at the linea alba',
      must: 'theta_end at full closure = pi within 1e-6 (this is what a* is solved for). SOLVER ' +
            'RESIDUAL, not a measurement of the built wall: see C-tangent, which is' },
    { id: 'C-tangent', says: '...and the built wall really is continuous there, not merely solved to be',
      must: 'BUILT rows, at a closed station: the angle between the two free-edge tangents ' +
            '<= FLOORS.CREASE * one profile sample\'s turning (pi / NSH)' },
    { id: 'D', says: 'one hole is left, and it is big enough for the midgut to herniate through',
      must: 'ring opening at t=1 >= FLOORS.RING * gut outer diameter' },
    { id: 'E', says: 'the body cavity is SEALED OFF from the outside',
      must: '0 of 240 transverse rays leaving the coelom escape at t=1 away from the umbilicus' },
    { id: 'E-neg', says: '...and was not sealed before folding — the negative case for E',
      must: '>= 60 of the same 240 rays escape at t=0' },
    { id: 'F', says: 'a tube within a tube: the gut hangs clear inside the body wall',
      must: 'least clearance at t=1 >= FLOORS.CLEAR * gut outer radius' },
    { id: 'G', says: 'the wide connection to the yolk sac narrows to the vitelline duct',
      must: '0 < duct calibre at t=1 <= FLOORS.DUCT * gut outer diameter' },
    { id: 'H', says: 'the dorsal mesentery TAPERS to nothing where it meets what it suspends',
      must: 'BUILT mesentery grid: its x extent at the gut row <= FLOORS.MESO * its x extent at the wall row' },
    { id: 'I', says: 'gastroschisis is to the embryo\'s RIGHT of a normally inserted cord',
      must: 'BUILT grid, through the SAME predicate that drops the cells: the defect entirely at ' +
            'x < 0, and its edge nearest the cord clear of the ring by >= FLOORS.GASTRO * ring width' },
    { id: 'J', says: 'exstrophy is a SECOND hole below the umbilicus, not one long slot — bladder exstrophy, not OEIS',
      must: 'BUILT rows: exactly two open bands in y, the caudal one wholly below the cranial one, ' +
            'and the INTACT BRIDGE between them >= FLOORS.EXSTR * their mean y extent' },
    { id: 'J-closed', says: '...and the wall in that bridge really is shut, as it is away from the ring',
      must: 'BUILT rows: max ventral gap over the bridge stations <= FLOORS.CLOSE * wall width' },
    { id: 'L', says: 'the umbilical ring rings the UMBILICUS, and does not bridge the two openings',
      must: 'BUILT ring vertices confined to the cranial open band in y, within FLOORS.RINGY * that ' +
            'band\'s extent of it at each end' },
    { id: 'K', says: 'the bladder plate is seen THROUGH the caudal opening, not lying across closed wall',
      must: 'of the plate\'s OWN VISIBLE footprint - first hit in beat 8\'s camera over beat 8\'s ' +
            'whole shown list - the fraction inside the wall\'s own aperture >= FLOORS.PLATE',
      was: 'a y-CLEARANCE: built plate vertices inside the caudal OPEN BAND, clear of both edges by ' +
           '>= 0.060 of the plate\'s y extent. It passed at 0.258 on a plate whose z was read at ONE ' +
           'station, so over the closed wall either side of the hole that plate stood 0.165 PROUD of ' +
           'a wall surface that had moved - which is how it came to be drawn across intact wall in ' +
           'the first place, and the clearance test could not see it because clearance in y says ' +
           'nothing about depth in z. The plate now follows the wall station by station and is ROOTED ' +
           'in the two closed stations either side, so it NO LONGER HAS a y-clearance inside the band ' +
           'and the old row cannot be kept: it would fail by construction on the correct geometry. ' +
           'Replaced rather than re-floored, and the old numbers are still published as K_plateY / ' +
           'K_caudalBand / K_clearance_was for a review to check that judgement.' },
    { id: 'P', says: 'the bladder plate FILLS the hole it is shown through \u2014 what a student sees in ' +
                     'the infra-umbilical window is bladder, which is what bladder exstrophy is',
      must: 'of the wall\'s own caudal aperture (its free edges, same predicate as J), the fraction ' +
            'whose NEAREST surface over beat 8\'s shown list is the plate >= FLOORS.FIELD' },
    { id: 'R', says: 'the layer against the ectoderm is SOMATIC and the layer against the endoderm ' +
                     'is SPLANCHNIC \u2014 beat 1\'s single most examinable sentence',
      must: 'BUILT grids at the flank station: somatic mean radius about the gut\'s own transverse ' +
            'centroid minus splanchnic mean radius, over the mean of the two, >= FLOORS.RADIAL',
      why: 'PROPOSED BY REVIEW ROUND 6, which measured the order, found it CORRECT, and found it ' +
           'asserted by NOTHING \u2014 no acceptance row and no beat claim \u2014 so a swap of the two ' +
           'offsets would have gone through. Round 6 did not count it as an open finding because ' +
           'there was nothing to repair, and recorded in the queue that the next run counting it as ' +
           'open would flip the convergence trigger. Closed here rather than argued about: the row ' +
           'is one line and the ambiguity cost more than it does.' },
    { id: 'P-gut', says: '...and NO BOWEL is in that field. Bowel in the same open field is the ' +
                         'scene\'s own discriminator for CLOACAL exstrophy, which the narration ' +
                         'lists as the severe form this beat is contrasting it with',
      must: 'of the same aperture, the fraction whose nearest surface is endoderm or vitelline ' +
            '<= FLOORS.FIELDGUT' },
    { id: 'M', says: 'the MEMBRANE is the diagnostic feature: the omphalocele loop is under the sac ' +
                     'and the gastroschisis loop beside it is bare — in beat 6\'s own camera',
      must: 'projected on the ANTERIOR screen plane (VIEW_DIR, copied from viz3d): the omphalocele ' +
            'loop\'s covered area fraction >= FLOORS.SAC and the gastroschisis loop\'s <= FLOORS.BARE' },
    { id: 'M-solid', says: '...and it really is covered, not merely drawn in front of: the herniated ' +
                           'coil is INSIDE the membrane and the bare loop is wholly OUTSIDE it',
      must: 'signed clearance over the sac radius: coil worst <= FLOORS.SACIN, bare loop least >= FLOORS.SACOUT' },
    { id: 'M-seen', says: 'and the MEMBRANE is what is actually in front of it — measured over ' +
                          'everything beat 6 draws, not over the loop-and-sac pair the claim is about',
      must: 'first hit along `anterior` for every pixel of the loop\'s footprint, depth-buffered over ' +
            'the beat\'s whole shown list: the sac is nearest over >= FLOORS.SACSEEN of it, fronts ' +
            '<= FLOORS.BARESEEN of the bare loop, and NO shown key may fail to produce geometry' },
    { id: 'S', says: 'the DORSAL MESENTERY is a sheet a student can SEE: of everything beat 11 ' +
                     'draws it is FLOORS.MESOSHARE of the frame — the sheet beats 3 and 4 name in ' +
                     'their narration and draw at 0.3% and 0.0%',
      must: 'first hit along `lateral` over beat 11\'s whole shown list, on built triangles: the ' +
            'mesentery\'s own visible pixels over every pixel any shown structure covers' },
    { id: 'S-vis', says: '...and NOTHING IS IN FRONT OF IT — the other half, and the half that was ' +
                         'already true in beat 3, because a sheet can be unhidden and still be a ' +
                         'sliver. Neither number is dropped for that reason',
      must: 'of the mesentery\'s OWN footprint, the fraction whose nearest surface is the ' +
            'mesentery: >= FLOORS.MESOVIS, and NO shown key may fail to produce geometry' },
    { id: 'N', says: 'the cord inserts ON THE SAC in omphalocele and at the RING in gastroschisis — ' +
                     'beat 6\'s third check, and why beat 7 says the cord still inserts normally',
      must: 'BUILT cord paths: insertion-to-aperture distance over the sac radius >= FLOORS.CORDON ' +
            'on the omphalocele build and <= FLOORS.CORDAT on the gastroschisis one' },
    { id: 'N-medial', says: '...and the gastroschisis cord is MEDIAL to the window, which is what ' +
                            '"to the right of a NORMAL cord" means',
      must: 'BUILT cord vertices: max |x| over the cord <= the defect\'s medial edge |x|, i.e. the ' +
            'whole cord lies between the midline and the window' },
    { id: 'O', says: 'a camera that is asked to SHOW the insertion keeps the cord\'s length: `lateral` ' +
                     'does and `anterior` does not, which is why the scene uses two beats and not one',
      must: 'projected length over true length: >= FLOORS.CORDSEE from `lateral` on BOTH variants, ' +
            'and <= FLOORS.CORDEND from `anterior` — the second half is the finding, asserted' },
    { id: 'O-two', says: '...and the two cords read as TWO: they are collinear, so what separates ' +
                         'them on any camera is the gap between them',
      must: 'BUILT paths: ring-cord tip to sac-cord insertion >= FLOORS.CORDGAP cord diameters' },
  ],
};

let _capAtAcceptance = 0;
function acceptance(opts) {
  opts = opts || {};
  const m = {}, ok = {};

  /* A — arc length, the constraint the whole model is built on */
  let worst = 0;
  for (const tt of [0, 0.15, 0.3, 0.45, 0.6, 0.75, 0.9, 1]) {
    const O = outerRows(tt, {});
    for (let j = 0; j <= NY; j += 6) worst = Math.max(worst, Math.abs(rowArcLength(O.rows[j]) - 2 * SO) / (2 * SO));
  }
  m.A = worst; ok.A = worst <= FLOORS.ARC;

  const O1 = outerRows(1, {}), G1 = gutRows(1);
  const jEdge = 2, jMid = Math.round(NY / 2);          // a station clear of the ring, and the umbilicus
  const wallW = (() => { let mx = 0; for (const p of O1.rows[jEdge]) mx = Math.max(mx, Math.abs(p.x)); return 2 * mx; })();
  const gutOutR = R_GUT + OFF.splanchnic.c + OFF.splanchnic.h / 2;
  const gutOutD = 2 * gutOutR;

  /* B — the edges meet */
  m.B = Math.abs(O1.rows[jEdge][O1.ns].x - O1.rows[jEdge][0].x) / wallW;
  ok.B = m.B <= FLOORS.CLOSE;

  /* C — and meet tangentially. This is the number a* was solved for.

     C IS THE ONE ROW IN THIS BATTERY THAT IS NOT A MEASUREMENT OF THE BUILT GEOMETRY, and it is
     declared so rather than dressed up as one. It is the bisection's own residual: solved to zero, so
     it reports zero, and a perturbation of any geometric constant leaves it at zero because the
     solver simply re-converges. That is the right thing for a convergence check to do and the wrong
     thing for a claim about the wall a student sees, so the claim itself is measured separately.

     C-tangent DOES measure it, off the rows the mesh is emitted from: the angle between the profile's
     tangent at its two free edges, at a station where the wall has closed. It is normalised by ONE
     SAMPLE'S TURNING (pi / NSH) rather than by an absolute angle, because a polyline of NSH segments
     turning through pi cannot report better than that and a floor in radians would quietly become a
     resolution test. It comes out at 1.000 of a sample at t = 1 — the discretisation and nothing else
     — against 11.96 at t = 0.9, where the wall is still 0.61 open. */
  m.C = CLOSE_O.thetaErr; m.C_a = A_O; m.C_lam = CLOSE_O.lam; m.C_bracketed = !!CLOSE_O.bracketed;
  ok.C = Math.abs(CLOSE_O.thetaErr) < 1e-6 && CLOSE_O.bracketed !== false;
  {
    const V = ventralGaps(1, {});
    const step = Math.PI / NSH;
    let worst = 0, atJ = -1;
    for (let j = 0; j <= NY; j++) {
      if (V.gap[j] > FLOORS.CLOSE * V.wallWidth) continue;        // only where the wall has closed
      const P = V.rows[j], ns = V.ns;
      const a = Math.atan2(P[1].z - P[0].z, P[1].x - P[0].x);
      const b = Math.atan2(P[ns].z - P[ns - 1].z, P[ns].x - P[ns - 1].x);
      let d = Math.abs(a - b); while (d > Math.PI) d = 2 * Math.PI - d;
      if (d / step > worst) { worst = d / step; atJ = j; }
    }
    m['C-tangent'] = atJ < 0 ? 1e9 : worst; m.C_tangent_atStation = atJ; m.C_tangent_sampleTurn = step;
    ok['C-tangent'] = atJ >= 0 && worst <= FLOORS.CREASE;
  }

  /* D — the hole is big enough to herniate through */
  m.D = Math.abs(O1.rows[jMid][O1.ns].x - O1.rows[jMid][0].x) / gutOutD;
  ok.D = m.D >= FLOORS.RING;

  /* E — the cavity is closed, and E-neg: it was open before */
  const e1 = escapes(1, jEdge, {}), e0 = escapes(0, jEdge, {});
  m.E = e1.escapes; m.E_neg = e0.escapes;
  ok.E = e1.escapes === 0;
  ok['E-neg'] = e0.escapes >= 60;

  /* F — least clearance between the gut's outer surface and the wall's inner surface */
  {
    const RO = O1.rows[jEdge], RG = G1.rows[jEdge];
    const inR = -(OFF.somatic.c - OFF.somatic.h / 2);         // how far the wall's inner face sits inside
    let least = 1e9;
    for (let k = 0; k <= G1.ns; k++) {
      const gx = RG[k].x, gz = RG[k].z;
      let d = 1e9;
      for (let i = 0; i <= O1.ns; i++) d = Math.min(d, Math.hypot(RO[i].x - gx, RO[i].z - gz));
      least = Math.min(least, d - inR - (OFF.splanchnic.c + OFF.splanchnic.h / 2));
    }
    m.F = least / gutOutR; m.F_abs = least;
    ok.F = m.F >= FLOORS.CLEAR;
  }

  /* G — the duct */
  m.G = 2 * Math.abs(G1.rows[jMid][G1.ns].x) / gutOutD;
  ok.G = m.G > 0 && m.G <= FLOORS.DUCT;

  /* H — the membrane tapers. OFF THE BUILT GRID, at every cranio-caudal station rather than at one:
     the thickness is |A.x - B.x| on the arrays addSheet is handed, at the wall row (i = 0) and at the
     gut row (i = NM), and the worst ratio over j is what is reported. Perturb TAPER in
     mesenteryGrids and this number moves; that is the whole point of it. */
  {
    const M = mesenteryGrids(1);
    let worstH = 0, wallT = 0, gutT = 0;
    for (let j = 0; j <= NY; j++) {
      const w0 = Math.abs(M.A[GI(NY, 0, j)].x - M.B[GI(NY, 0, j)].x);
      const w1 = Math.abs(M.A[GI(NY, M.NM, j)].x - M.B[GI(NY, M.NM, j)].x);
      if (w0 <= 1e-12) continue;
      if (w1 / w0 > worstH) { worstH = w1 / w0; wallT = w0; gutT = w1; }
    }
    m.H = worstH; m.H_wallThickness = wallT; m.H_gutThickness = gutT;
    ok.H = m.H <= FLOORS.MESO;
  }

  /* I — gastroschisis is on the RIGHT and clear of the ring.

     OFF THE GRID THE MESH IS EMITTED FROM, and through the SAME predicate that drops the cells: the
     dropped run of i is found by asking gastroDrop, and its x bounds are read from the ectoderm grid
     gridsFromRows builds — the identical arrays addSheet is handed. Perturb V_GAST_MED/V_GAST_LAT and
     this number moves, which is what the old form did not do. */
  {
    const ec = gridsFromRows(O1.rows, O1.ns, NY, yOf, OFF.ectoderm.c, OFF.ectoderm.h);
    const drop = gastroDrop(O1.ns);
    let i0 = -1, i1 = -1;
    for (let i = 0; i < O1.ns; i++) if (drop(i, jMid)) { if (i0 < 0) i0 = i; i1 = i; }
    if (i0 < 0) { m.I = -1; ok.I = false; m.I_defect_x = null; }
    else {
      /* the edge nearer the cord is the one with the SMALLER |x| — the ring's lips sit at |x| = ring
         half-width and the wall bulges laterally away from them. max() of two negative numbers. */
      const xs = [ec.A[GI(NY, i0, jMid)].x, ec.A[GI(NY, i1 + 1, jMid)].x];
      const medX = Math.max(xs[0], xs[1]), latX = Math.min(xs[0], xs[1]);
      const ringHalf = Math.abs(O1.rows[jMid][0].x);
      m.I_defect_x = [latX, medX];
      m.I_defect_cells = [i0, i1];
      m.I = (Math.abs(medX) - ringHalf) / (2 * ringHalf);
      ok.I = medX < 0 && m.I >= FLOORS.GASTRO;
    }
  }

  /* J, J-closed and K — the exstrophy build has TWO holes with wall between them.

     WHAT THIS REPLACES, because the replacement only makes sense next to it: J used to be
     `Math.abs((Y_UMB - 0.72) - Y_UMB)`, in which Y_UMB cancels, over a mean built the same way — a
     compile-time constant, 0.679 on every build, independent of every vertex in the model. It carried
     a magnitude floor and it had a negative case, and it passed while certifying a claim that was
     FALSE in the geometry. Everything below is read off the free edges of the rows the wall is
     emitted from, through the same ventralGaps()/bands() the render tool re-measures on mesh
     vertices, and the render tool also PERTURBS YW_EXST and requires these numbers to move. */
  {
    const V = ventralGaps(1, { exstrophy: true });
    const thresh = FLOORS.CLOSE * V.wallWidth;
    const open = bands(V.gap, V.y, V.dy, thresh, true);
    const shut = bands(V.gap, V.y, V.dy, thresh, false);
    m.J_openBands = open.map(b => [+b.lo.toFixed(4), +b.hi.toFixed(4)]);
    m.J_bandCount = open.length;
    if (open.length === 2) {
      const cr = open[1], cd = open[0];                 // bands() walks j upward, i.e. caudal first
      const bridge = cr.lo - cd.hi;
      const mean = 0.5 * (cr.extent + cd.extent);
      m.J = bridge / mean;
      m.J_bridge = bridge; m.J_meanExtent = mean;
      m.J_caudalBelowCranial = cd.hi <= cr.lo;
      ok.J = open.length === 2 && m.J_caudalBelowCranial && m.J >= FLOORS.EXSTR;

      /* J-closed — the bridge is shut, not merely narrow */
      const mid = shut.find(b => b.lo >= cd.hi - 1e-9 && b.hi <= cr.lo + 1e-9);
      let worst = 0;
      if (mid) for (let j = mid.j0; j <= mid.j1; j++) worst = Math.max(worst, V.gap[j]);
      m['J-closed'] = mid ? worst / V.wallWidth : 1;
      m.J_bridgeStations = mid ? (mid.j1 - mid.j0 + 1) : 0;
      ok['J-closed'] = !!mid && m['J-closed'] <= FLOORS.CLOSE;

      /* K — the plate is inside the caudal opening */
      const g = buildFold(1, { exstrophy: true, amnion: false, yolksac: false, coelom: false });
      g.updateMatrixWorld(true);
      let mny = 1e9, mxy = -1e9;
      g.traverse(function (o) {
        if (!o.isMesh || !o.geometry || (o.userData && o.userData.outline)) return;
        if (!o.userData || o.userData.key !== 'exstrophy') return;
        const pa = o.geometry.attributes.position, v = new T.Vector3();
        for (let i = 0; i < pa.count; i++) { v.fromBufferAttribute(pa, i).applyMatrix4(o.matrixWorld);
          if (v.y < mny) mny = v.y; if (v.y > mxy) mxy = v.y; }
      });
      /* L — the ring, off the same build's vertices */
      let rmn = 1e9, rmx = -1e9, rn = 0;
      g.traverse(function (o) {
        if (!o.isMesh || !o.geometry || (o.userData && o.userData.outline)) return;
        if (!o.userData || o.userData.key !== 'umbilicalring') return;
        const pa = o.geometry.attributes.position, v = new T.Vector3();
        for (let i = 0; i < pa.count; i++) { v.fromBufferAttribute(pa, i).applyMatrix4(o.matrixWorld);
          if (v.y < rmn) rmn = v.y; if (v.y > rmx) rmx = v.y; rn++; }
      });
      m.L_ringY = rn ? [+rmn.toFixed(4), +rmx.toFixed(4)] : null;
      m.L_cranialBand = [+cr.lo.toFixed(4), +cr.hi.toFixed(4)];
      m.L = rn ? Math.max(cr.lo - rmn, rmx - cr.hi) / cr.extent : 1;
      ok.L = rn > 0 && m.L <= FLOORS.RINGY;

      /* K, P and P-gut - THE PLATE AND THE FIELD, measured through beat 8's own camera.

         The old K's numbers are still reported (K_plateY, K_caudalBand, K_clearance_was) because a
         review should be able to see what the replaced row would have said: it now reads NEGATIVE,
         which is the correct reading of a plate that is rooted in the wall either side of the hole
         rather than floating clear inside it. ACCEPTANCE K carries the whole argument. */
      const ext = mxy - mny;
      m.K_plateY = [+mny.toFixed(4), +mxy.toFixed(4)]; m.K_plateExtent = ext;
      m.K_caudalBand = [+cd.lo.toFixed(4), +cd.hi.toFixed(4)];
      m.K_clearance_was = ext > 0 ? Math.min(mny - cd.lo, cd.hi - mxy) / ext : -1;

      const F8 = fieldAt(8);
      m.K = F8.seenIn;
      m.P = F8.plate;
      m['P-gut'] = F8.gut;
      m.P_cells = F8.cells; m.P_plateCells = F8.plateCells;
      m.P_byKey = F8.byKey; m.P_missing = F8.missing;
      ok.K = F8.missing.length === 0 && m.K >= FLOORS.PLATE;
      ok.P = F8.missing.length === 0 && F8.cells > 0 && m.P >= FLOORS.FIELD;
      ok['P-gut'] = F8.missing.length === 0 && F8.cells > 0 && m['P-gut'] <= FLOORS.FIELDGUT;
    } else {
      m.J = 0; m['J-closed'] = 1; m.K = -1; m.L = 1; m.P = 0; m['P-gut'] = 1;
      ok.J = false; ok['J-closed'] = false; ok.K = false; ok.L = false;
      ok.P = false; ok['P-gut'] = false;
    }
  }

  /* M — the membrane covers one loop and not the other, in beat 6's own camera.

     RENDER-STANDARD 3.y. The claim beat 6 is built around is "is there a membrane?", and what a
     student answers it from is the SCREEN: whether the loop is under the sac or beside it. So this
     is projected on to the anterior camera's screen plane — VIEW_DIR is copied from viz3d, not
     restated, so the player's camera and this probe cannot drift apart — and both loops are measured
     against the SAME sphere, the one buildFold draws. Perturb SAC_CLEAR, the hernPath coil or the
     gastroPath emergence and these numbers move; that is the check RENDER-STANDARD asks for. */
  {
    m.M_omphalocele = sacCoverage('omphalocele', 'anterior');
    m.M_gastroschisis = sacCoverage('gastroschisis', 'anterior');
    m.M = m.M_omphalocele;
    ok.M = m.M_omphalocele >= FLOORS.SAC && m.M_gastroschisis <= FLOORS.BARE;
    m.M_coilInside = sacClearance('omphalocele');
    m.M_bareOutside = sacClearance('gastroschisis');
    m['M-solid'] = m.M_bareOutside;
    ok['M-solid'] = m.M_coilInside <= FLOORS.SACIN && m.M_bareOutside >= FLOORS.SACOUT;
  }

  /* M-seen — the same claim, asked of the whole frame. Review round 4.

     M above projects the loop and the sac and nothing else, so it read 1.0000 while the omphalocele
     cord fronted a third of the loop in beat 6's own camera. This re-asks it over every structure the
     beat draws, on their real triangles, by first hit along the camera axis. The two numbers are both
     kept: M says the silhouettes nest, M-seen says nothing else is in the way, and the second is the
     one a student is actually looking at.

     A KEY THAT PRODUCES NO GEOMETRY FAILS THIS ROW. That is the point of it — the fault was a measure
     that could not see an occluder, so a measure that cannot see a structure must not pass. */
  {
    const so = seenAt(6, 'omphalocele'), sg = seenAt(6, 'gastroschisis');
    m['M-seen'] = so.frac;
    m['M-seen_bare'] = sg.frac;
    m['M-seen_pixels'] = so.pixels;
    m['M-seen_inFront'] = so.inFront;
    m['M-seen_missing'] = so.missing.concat(sg.missing);
    ok['M-seen'] = so.frac >= FLOORS.SACSEEN && sg.frac <= FLOORS.BARESEEN &&
                   so.pixels > 0 && m['M-seen_missing'].length === 0;
  }

  /* S and S-vis — the dorsal mesentery, measured on the frame beat 11 draws. Review round 7.

     The fault these answer is the one this item keeps producing: B3-meso reads
     mesentery.wall_thickness, which is a true fact about the built sheet and is the SAME fact when
     the sheet cannot be seen. Beat 4 drew it at 0.000 and beat 3 at 0.003 of frame while that claim
     read 0.085 and passed. These two rows are computed by first hit along beat 11's own camera over
     beat 11's own shown list, so they cannot report a sheet the beat does not show.

     BOTH ARE KEPT, and S-vis is deliberately the weaker of the two: it reads 1.000 in beat 3 as
     well, because nothing hides the sheet there — it is simply edge-on. A pair where one number is
     true of the defect is not redundancy, it is what tells occlusion and foreshortening apart.

     A KEY THAT PRODUCES NO GEOMETRY FAILS THESE ROWS, as in M-seen, for the same reason. */
  {
    const sh = shareAt(11);
    m.S = sh.share;
    m['S-vis'] = sh.visible;
    m.S_pixels = sh.pixels;
    m.S_framePixels = sh.framePixels;
    m.S_inFront = sh.inFront;
    m.S_missing = sh.missing;
    ok.S = sh.share >= FLOORS.MESOSHARE && sh.pixels > 0 && sh.missing.length === 0;
    ok['S-vis'] = sh.visible >= FLOORS.MESOVIS && sh.pixels > 0 && sh.missing.length === 0;
  }

  /* N and N-medial — where the cord inserts, and that it is medial to the window.

     N is one measure evaluated on two builds with opposite floors, which is the shape the
     discriminator has: the same question, two answers. N-medial reads the cord's own vertices off
     the built group rather than its path, so a cord that was drawn wider than its path is caught. */
  {
    m.N_omphalocele = cordStandoff('omphalocele');
    m.N_gastroschisis = cordStandoff('gastroschisis');
    m.N_sacRadius = sacSphere().r;
    m.N = m.N_omphalocele;
    ok.N = m.N_omphalocele >= FLOORS.CORDON && m.N_gastroschisis <= FLOORS.CORDAT;

    const gg = buildFold(1, { gastroschisis: true, amnion: false, yolksac: false, coelom: false });
    gg.updateMatrixWorld(true);
    let cmax = 0, cn = 0;
    gg.traverse(function (o) {
      if (!o.isMesh || !o.geometry || (o.userData && o.userData.outline)) return;
      if (!o.userData || o.userData.key !== 'cord') return;
      const pa = o.geometry.attributes.position, v = new T.Vector3();
      for (let i = 0; i < pa.count; i++) { v.fromBufferAttribute(pa, i).applyMatrix4(o.matrixWorld);
        if (Math.abs(v.x) > cmax) cmax = Math.abs(v.x); cn++; }
    });
    const medX = m.I_defect_x ? Math.abs(m.I_defect_x[1]) : 0;
    m['N-medial'] = cn ? cmax : -1; m.N_defect_medial_absx = medX; m.N_cordVertices = cn;
    ok['N-medial'] = cn > 0 && medX > 0 && cmax <= medX;
  }

  /* O — which camera can show the insertion. Both halves are asserted, because the half that says
     `anterior` CANNOT is the finding, and a finding left out of the battery is a finding that comes
     back. If a future change makes the cord visible from anterior this row FAILS, and it should:
     the scene would then be carrying a beat it no longer needs. */
  {
    m.O_lateral_gastro = cordAcross('gastroschisis', 'lateral');
    m.O_lateral_sac = cordAcross('omphalocele', 'lateral');
    m.O_anterior = cordAcross('gastroschisis', 'anterior');
    m.O = m.O_lateral_gastro;
    ok.O = m.O_lateral_gastro >= FLOORS.CORDSEE && m.O_lateral_sac >= FLOORS.CORDSEE &&
           m.O_anterior <= FLOORS.CORDEND;
    m['O-two'] = cordGap();
    ok['O-two'] = m['O-two'] >= FLOORS.CORDGAP;
  }

  /* TWO CAP HITS ARE EXPECTED AND THEY ARE NOT IN THE GEOMETRY. Both come from solveClosure()'s own
     bracket probe at a = 1.60, where the hinge is so concentrated that the sheet cannot close inside
     1.15 pi of turning — which is the information the bracket exists to get. No build of any row at
     any t hits the cap; capLog() prints what did, so a reviewer can check that rather than take this
     sentence for it. A third hit would mean something real. */
  /* R — THE RADIAL ORDER OF THE TWO MESODERM LAYERS, off the same grids the sheets are emitted
     from. The axis is the GUT's own centroid in the transverse plane at that station rather than a
     chosen point, so moving the gut moves the measurement with it. Read at a FLANK station clear of
     the umbilical ring, as the wall measures are. */
  {
    const jR = 2;
    const O1 = outerRows(1, {}), G1 = gutRows(1);
    const so = gridsFromRows(O1.rows, O1.ns, NY, yOf, OFF.somatic.c, OFF.somatic.h);
    const sp = gridsFromRows(G1.rows, G1.ns, NY, yOf, OFF.splanchnic.c, OFF.splanchnic.h);
    let cx = 0, cz = 0, nc = 0;
    for (let i = 0; i <= G1.ns; i++) { const q = G1.rows[jR][i]; cx += q.x; cz += q.z; nc++; }
    cx /= nc; cz /= nc;
    const meanR = (grid, ns) => {
      let acc = 0, n = 0;
      for (let i = 0; i <= ns; i++) { const q = grid[GI(NY, i, jR)];
        acc += Math.hypot(q.x - cx, q.z - cz); n++; }
      return n ? acc / n : 0;
    };
    const rSo = meanR(so.A, O1.ns), rSp = meanR(sp.A, G1.ns);
    m.R_gutAxis = [+cx.toFixed(4), +cz.toFixed(4)];
    m.R_somaticMeanR = +rSo.toFixed(4); m.R_splanchnicMeanR = +rSp.toFixed(4);
    m.R = (rSo + rSp) > 1e-12 ? (rSo - rSp) / (0.5 * (rSo + rSp)) : 0;
    ok.R = m.R >= FLOORS.RADIAL;
  }

  m.lamCapHits = _lamCapHit - _capAtAcceptance;
  _capAtAcceptance = _lamCapHit;
  m.R_WALL = R_WALL; m.R_GUT = R_GUT; m.gutOuterRadius = gutOutR; m.wallWidth = wallW;
  return { measured: m, pass: ok, allPass: Object.keys(ok).every(k => ok[k]), spec: ACCEPTANCE, floors: FLOORS };
}

/* ------------------------------------------------- the scene's claims, as functions of t

   RENDER-STANDARD section 3, A TIME-VARYING SCENE CHECKS ITS OWN NARRATION AGAINST THE MODEL, BEAT BY
   BEAT. That rule and viz-training/tools/check-beat-claims.mjs both postdate this model — it was built
   on 2026-09-11, the rule landed on 2026-09-29 — so running the tool on this scene printed "model
   exposes neither at(t) nor claimMeasure(name, t)" and every beat was unchecked. Not one of review
   round 1's findings, and it is the check that would catch the class of defect none of the others can:
   a correct model with a beat pointed at the wrong instant.

   ONE VOCABULARY, and every entry is a pure function of t read off the same rows, grids and probes the
   geometry is built from — never a constant restated (the lesson of H and J, one section up). The tool
   evaluates each beat's claims at its own SET_STAGE t and then DISPLACES the beat and requires at least
   one claim to break, so a measure that barely moves with t is no use here however true it is: that is
   why the wall's TURNING is in this list and its arc length, which is conserved by construction and
   therefore constant, is not.

   IT RUNS IN A SANDBOX WITH A Vector3-ONLY THREE, so nothing here may build geometry. acceptance() now
   does — row K walks the plate's vertices — which is exactly why check-beat-claims does not call
   acceptance() on this route. Everything below stops at the rows and grids. */
function claimMeasure(name, t) {
  const J_FLANK = 2, J_UMB = Math.round(NY / 2);
  const O = outerRows(t, {}), G = gutRows(t);
  const wide = (() => { let m = 0; for (const p of O.rows[J_FLANK]) m = Math.max(m, Math.abs(p.x)); return 2 * m; })();
  const gutOutD = 2 * (R_GUT + OFF.splanchnic.c + OFF.splanchnic.h / 2);
  const gapAt = (rows, ns, j) => Math.abs(rows[j][ns].x - rows[j][0].x);
  const turnAt = (j) => {
    const P = O.rows[j]; let tot = 0;
    for (let i = 1; i < O.ns; i++) {
      const a1 = Math.atan2(P[i].z - P[i - 1].z, P[i].x - P[i - 1].x);
      const a2 = Math.atan2(P[i + 1].z - P[i].z, P[i + 1].x - P[i].x);
      let d = Math.abs(a1 - a2); while (d > Math.PI) d = 2 * Math.PI - d; tot += d;
    }
    return tot * 180 / Math.PI;
  };
  switch (name) {
    case 'wall.turn_deg':          return turnAt(J_FLANK);
    case 'wall.gap_at_flank_frac': return gapAt(O.rows, O.ns, J_FLANK) / wide;
    case 'wall.ring_over_gut_d':   return gapAt(O.rows, O.ns, J_UMB) / gutOutD;
    case 'wall.arc_frac':          return rowArcLength(O.rows[J_FLANK]) / (2 * SO);
    case 'gut.gap_at_flank_frac':  return gapAt(G.rows, G.ns, J_FLANK) / gutOutD;
    case 'gut.duct_over_gut_d':    return gapAt(G.rows, G.ns, J_UMB) / gutOutD;
    case 'coelom.escapes_at_flank': return escapes(t, J_FLANK, {}).escapes;
    case 'mesentery.taper': {
      const M = mesenteryGrids(t);
      const w0 = Math.abs(M.A[GI(NY, 0, J_UMB)].x - M.B[GI(NY, 0, J_UMB)].x);
      const w1 = Math.abs(M.A[GI(NY, M.NM, J_UMB)].x - M.B[GI(NY, M.NM, J_UMB)].x);
      return w0 > 1e-12 ? w1 / w0 : 1;
    }
    case 'mesentery.wall_thickness': {
      const M = mesenteryGrids(t);
      return Math.abs(M.A[GI(NY, 0, J_UMB)].x - M.B[GI(NY, 0, J_UMB)].x);
    }
    case 'ring.built': {
      /* the SAME condition buildFold uses to decide whether there is a ring to draw */
      let n = 0;
      for (let j = 0; j <= NY; j++) {
        const y = yOf(j), rg = ringGap(y, {});
        if (rg > 0.02 && outerTarget(y, t, {}) <= rg * 1.35 + 0.02) n++;
      }
      return n > 2;
    }
    case 'exstrophy.open_bands': {
      const V = ventralGaps(t, { exstrophy: true });
      return bands(V.gap, V.y, V.dy, FLOORS.CLOSE * V.wallWidth, true).length;
    }
    case 'exstrophy.bridge_frac': {
      const V = ventralGaps(t, { exstrophy: true });
      const open = bands(V.gap, V.y, V.dy, FLOORS.CLOSE * V.wallWidth, true);
      if (open.length !== 2) return 0;
      return (open[1].lo - open[0].hi) / (0.5 * (open[0].extent + open[1].extent));
    }
    case 'gastro.clear_of_ring_frac': {
      const ec = gridsFromRows(O.rows, O.ns, NY, yOf, OFF.ectoderm.c, OFF.ectoderm.h);
      const drop = gastroDrop(O.ns);
      let i0 = -1, i1 = -1;
      for (let i = 0; i < O.ns; i++) if (drop(i, J_UMB)) { if (i0 < 0) i0 = i; i1 = i; }
      if (i0 < 0) return -1;
      const xs = [ec.A[GI(NY, i0, J_UMB)].x, ec.A[GI(NY, i1 + 1, J_UMB)].x];
      const medX = Math.max(xs[0], xs[1]);
      const ringHalf = Math.abs(O.rows[J_UMB][0].x);
      return (Math.abs(medX) - ringHalf) / (2 * ringHalf);
    }
    case 'gastro.defect_medial_x': {
      const ec = gridsFromRows(O.rows, O.ns, NY, yOf, OFF.ectoderm.c, OFF.ectoderm.h);
      const drop = gastroDrop(O.ns);
      let i0 = -1, i1 = -1;
      for (let i = 0; i < O.ns; i++) if (drop(i, J_UMB)) { if (i0 < 0) i0 = i; i1 = i; }
      if (i0 < 0) return 0;
      return Math.max(ec.A[GI(NY, i0, J_UMB)].x, ec.A[GI(NY, i1 + 1, J_UMB)].x);
    }
    case 'yolk.half_extent':       return (YLEN / 2) * (1 - t) + 0.78 * t;

    /* ---- WHAT IS SEEN THROUGH THE INFRA-UMBILICAL HOLE: beat 8's missing check -------------
       Added 2026-10-01, review round 6. Beat 8's three existing claims all measure THE WALL and
       none of them measures what is VISIBLE THROUGH an opening, so the beat could draw bowel in
       the bladder-exstrophy window - the scene's own definition of the severe form it is being
       contrasted with - with every number passing. Read at the FINISHED wall like every other
       lesion measure here, so constant in t by construction; the beat's other three claims are
       the ones that pin it to its own instant. See apertureField(). */
    case 'exstrophy.field_plate_frac': return fieldAt(8).plate;
    case 'exstrophy.field_gut_frac':   return fieldAt(8).gut;
    case 'exstrophy.plate_seen_in_aperture': return fieldAt(8).seenIn;

    /* ---- the membrane and the cord: beat 6's first and third checks --------------------------

       ADDED 2026-09-30, review round 2. Beat 6 carried three claims and all three were about the
       GASTROSCHISIS side, while the scene says of the omphalocele sac "The membrane is the
       diagnostic feature" and nothing measured that a sac existed, covered the loop, or could be
       told from the bare loop beside it; and nothing measured the cord at all. These four are read
       at the FINISHED WALL rather than at t, like every other lesion measure here — the lesions are
       static parts — so they are constant in t by construction and cannot pin a beat to its own
       instant. The beat's OTHER claims do that (ring.built and wall.gap_at_flank_frac both move),
       which is why these are added ALONGSIDE them and not instead of them. */
    case 'sac.covers_omphalocele_frac':   return sacCoverage('omphalocele', 'anterior');
    case 'sac.covers_gastroschisis_frac': return sacCoverage('gastroschisis', 'anterior');
    /* round 4: the same two questions, over everything the beat draws. See sacSeen(). */
    /* round 7: the dorsal mesentery, asked of the frame rather than of the sheet. See shareSeen().
       B3-meso (mesentery.wall_thickness) is a true fact about the built sheet that reads the same
       when the sheet is invisible, which is what it was doing. These two see beat 11's camera. */
    case 'mesentery.seen_share':          return shareAt(11).share;
    case 'mesentery.seen_visible':        return shareAt(11).visible;
    case 'sac.covers_omphalocele_seen':   return seenAt(6, 'omphalocele').frac;
    case 'sac.covers_gastroschisis_seen': return seenAt(6, 'gastroschisis').frac;
    case 'cord.omphalocele_standoff':     return cordStandoff('omphalocele');
    case 'cord.gastroschisis_standoff':   return cordStandoff('gastroschisis');
    case 'sac.coil_inside_frac':          return sacClearance('omphalocele');
    case 'sac.bare_outside_frac':         return sacClearance('gastroschisis');
    case 'cord.across_anterior':          return cordAcross('gastroschisis', 'anterior');
    case 'cord.across_lateral':           return cordAcross('gastroschisis', 'lateral');
    case 'cord.across_lateral_sac':       return cordAcross('omphalocele', 'lateral');
    case 'cord.gap_between_diam':         return cordGap();
    case 'cord.gastroschisis_inside_sac_frac': return cordInsideOtherSac('gastroschisis');
    case 'cord.omphalocele_inside_sac_frac':   return cordInsideOtherSac('omphalocele');
  }
  throw new Error('unknown measure: ' + name);
}

let _asserted = false;
function assertAcceptance() {
  if (_asserted) return;
  _asserted = true;
  try {
    const r = acceptance();
    if (!r.allPass) {
      const bad = Object.keys(r.pass).filter(k => !r.pass[k]).join(', ');
      console.warn('[lateral-folding] ACCEPTANCE FAILED for ' + bad +
        ' — the solved fold no longer satisfies the anatomy it was solved against.', r.measured);
    }
  } catch (e) { /* never let a self-check break a render */ }
}

function build(t, opts) { assertAcceptance(); return buildFold(t, opts); }

/* the provider contract */
window.MB3D_MODELS = window.MB3D_MODELS || {};
window.MB3D_MODELS['lateral-folding'] = {
  LAYERS: LAYERS,
  build: build,
  /* Every BENIGN optional layer on, so a structure behind a flag is still resolvable and the player
     never tells a student "there is no model of this" about a model sitting right there. The four
     lesions are deliberately NOT here: the adapter builds FULL and then slices by key, so a defect
     in FULL would punch a hole in the ectoderm of every view in the corpus. They are VARIANTS, asked
     for in the ref — "lateral-folding#gastroschisis@1+gastroschisis" — exactly as cardiac-looping
     asks for its mirror. */
  FULL: FULL_OPTS,
  VARIANTS: {
    herniation:    'the NORMAL physiological midgut herniation of about week 6, returning by week 10',
    omphalocele:   'herniation that never returned, inside its covering sac of amnion and peritoneum',
    gastroschisis: 'a full-thickness defect of the wall itself, on the embryo\'s RIGHT, with no sac',
    exstrophy:     'failure of closure BELOW the umbilicus, with the bladder plate open on the wall',
    cutaway:       'the left half of the body wall opened, so the cavity and the gut can be seen',
  },
  /* WHICH VARIANTS CARRY A CORD, said here because an absence is a fact a scene author needs and a
     render will not show. omphalocele and gastroschisis do — they are the pair beat 6 compares, and
     the insertion is its third check. herniation does NOT: the physiological hernia lies INSIDE the
     proximal cord, so an honest cord there is a sleeve and not a stub, and a stub at the ring would
     run through the loop the beat is about. Declared in the scene's gaps[] too. */
  CORD_IN: { omphalocele: true, gastroschisis: true, herniation: false, exstrophy: false },
  /* WHICH PARTS DO NOT MOVE WITH t, AND WHICH ONES ARE NOT THERE AT EVERY t.

     Declared here rather than discovered, because both are things a scene author and a review need to
     know and neither shows in a render. A part that quietly built the same geometry at every t would
     sit still while its neighbours walked the stages and the picture would look entirely fine; a part
     that quietly built NOTHING at t = 0 would reach a student as "there is no model of this
     structure", which is a fact about the corpus and not about this moment in development. The render
     tool asserts both lists against the real adapter: an undeclared static part, or an undeclared
     absence, FAILS the build. */
  STATIC_PARTS: {
    neural:        'the dorsal midline is the hinge of the fold and does not move; the wall comes round IT',
    notochord:     'as above',
    somite:        'drawn at constant calibre. The somites drive the fold in the narration and their growth ' +
                   'is NOT modelled — the largest thing in this model that is asserted in words and not in geometry',
    herniation:    'a fixed path through the ring; the herniation is a week-6 event, past the end of this model\'s t',
    sac:           'as above',
    gastroschisis: 'a path DERIVED from the defect at t = 1 and then held there; the lesion is read at ' +
                   'the finished wall, not developed. It follows the window, but not t',
    cord:          'derived at t = 1 from the ring\'s own aperture (and, in omphalocele, from the sac) ' +
                   'and then held there, for the same reason as the lesions it is drawn beside. It ' +
                   'follows the ring and the membrane, but not t',
  },
  /* exstrophy WAS declared static here and is not any more. Its z used to be the literal 1.60, right
     only at t = 1; it is now the mean ventral z of the wall's own free edges at the window's station,
     so the plate travels with the wall as it closes. The render tool noticed before this comment did:
     the plate dropped out of its "declared static and confirmed still" list the moment that changed. */
  STAGE_LIMITED: {
    umbilicalring: 'a ring is a hole in something. It is built only where the wall around it has closed, ' +
                   'so before about t = 0.85 there is nothing to build and the part resolves to no geometry. ' +
                   'No view in the scene asks for it before then.',
    vitelline:     'built only where the gut\'s solved gap is still open — inside the duct window in y. ' +
                   'At t = 0 the whole endodermal margin is that gap, so it exists; it is listed because ' +
                   'its extent is a function of the solve rather than a constant.',
  },
  ACCEPTANCE: ACCEPTANCE,
  FLOORS: FLOORS,
  SOLVED: {
    note: 'a* is SOLVED and comes out 0: a sheet of fixed arc length that closes on the midline ' +
          'tangentially is a circle. lam* is the curvature at full closure, pi/S.',
    outer: { a: CLOSE_O.a, lam: CLOSE_O.lam, thetaEnd: CLOSE_O.th, bracketed: CLOSE_O.bracketed },
    gut:   { a: CLOSE_G.a, lam: CLOSE_G.lam, thetaEnd: CLOSE_G.th, bracketed: CLOSE_G.bracketed },
    SO: SO, SG: SG, R_WALL: R_WALL, R_GUT: R_GUT,
  },
  acceptance: acceptance,
  claimMeasure: claimMeasure,
  escapes: escapes,
  ventralGaps: ventralGaps,
  TERMINALS: TERMINALS,
  bands: bands,
  mesenteryGrids: mesenteryGrids,
  /* exported so the render tool re-measures them on REAL MESH VERTICES and PERTURBS the constants
     they read, rather than keeping its own copy of the derivation — the fault test I had, one level
     up, and the fault H and J had before review round 1. */
  AXES: AXES,
  VIEW_DIR: VIEW_DIR,
  sacSphere: sacSphere,
  cordFrame: cordFrame,
  cordPath: cordPath,
  cordStandoff: cordStandoff,
  sacCoverage: sacCoverage,
  sacSeen: sacSeen,
  seenAt: seenAt,
  SEEN_BEATS: SEEN_BEATS,
  shareSeen: shareSeen,
  shareAt: shareAt,
  SHARE_BEATS: SHARE_BEATS,
  apertureField: apertureField,
  fieldAt: fieldAt,
  APERTURE_BEATS: APERTURE_BEATS,
  apertureCaudal: apertureCaudal,
  PLATE_LAP: PLATE_LAP,
  KEY_PART: KEY_PART,
  sacClearance: sacClearance,
  cordAcross: cordAcross,
  cordInsideOtherSac: cordInsideOtherSac,
  cordGap: cordGap,
  EXSTROPHY: { Y_EXST: Y_EXST, YW_EXST: YW_EXST, SOFT_EXST: SOFT_EXST, R_EXST: R_EXST, BRIDGE_F: BRIDGE_F,
               Y_UMB: Y_UMB, YW_UMB: YW_UMB, R_RING: R_RING, YLEN: YLEN, NY: NY },
  capLog: function () { return { hits: _lamCapHit, log: _capLog.slice() }; },
};

})();
