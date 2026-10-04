/* MedBank · bilaminar embryonic disc — PRODUCTION procedural model.
 *
 * Registers itself as MB3D_MODELS['bilaminar-embryonic-disc'], which is the whole contract the
 * procedural provider in viz3d.js depends on: a LAYERS palette and build(t, opts) -> THREE.Group
 * whose meshes carry userData.key.
 *
 * WRAPPED IN AN IIFE. Only the registration escapes. RENDER-STANDARD: a model written at top level
 * puts T, K, C, LAYERS and every constant into global lexical scope, and the second model to load —
 * written the obvious way, `const T = window.THREE` — dies on "Identifier 'T' has already been
 * declared" and takes the page with it.
 *
 * WHY PROCEDURAL, CHECKED RATHER THAN ASSUMED. available-meshes.json contains ZERO name matches for
 * epiblast, hypoblast, yolk sac, amnion, chorion, trophoblast, mesoderm, prechordal plate or embryo
 * (counted 2026-10-03). There is no mesh to wait for and there never will be: BodyParts3D is adult
 * scan data and this conceptus is a fifth of a millimetre across. RENDER-STANDARD section 5's test —
 * "would a student be marked wrong for the difference between our version and the real one?" — comes
 * out the right way here, because what is examined about the bilaminar disc is TOPOLOGY, not outline:
 * which layer is dorsal, which cavity each layer lines, which end the prechordal plate marks. Those
 * are exactly the relations a parametric model states exactly. It is not a plausible fake of an
 * irregular form; there is no irregular form in the subject.
 *
 * WHAT t MEANS. t = 0 is DAY 8 — the inner cell mass has just delaminated into two sheets and the
 * amniotic cavity is still a slit inside the epiblast. t = 1 is DAY 14 — prechordal plate present,
 * secondary yolk sac formed, chorionic cavity open, the embryo hanging on the connecting stalk.
 * So day = 8 + 6t, and the scene's beats quote the days its narration already quoted:
 *      day  8 -> t = 0        day 11 -> t = 0.500      day 13 -> t = 0.8333
 *      day  9 -> t = 0.1667   day 12 -> t = 0.6667     day 14 -> t = 1
 * Every stage is a sample of ONE function of t, so the stages cannot drift out of agreement.
 *
 * AXES, AND WHY THIS MODEL CANNOT WITNESS A SIDE. model3d-scene-spec-v2 says the LPS table does not
 * apply to a pre-folding embryo, "where the disc is flat and its cranio-caudal axis is not the mesh's
 * z", and that such scenes must state their axis in the beat. This model states:
 *
 *      +y = DORSAL   (the amniotic side)        -y = VENTRAL (the yolk-sac side)
 *      +z = CRANIAL  (the prechordal plate)     -z = CAUDAL  (the connecting stalk)
 *      +x / -x = the disc's left and right — AND THERE IS NO CONTENT ON THAT AXIS AT ALL.
 *
 * Everything this model builds is a solid of revolution about y, plus two features placed on the z
 * axis. It is therefore mirror-symmetric in x by construction, which acceptance row N measures rather
 * than asserts. RENDER-STANDARD's rule "A DECLARED AXIS IS NOT A PROVED ONE, AND A SYMMETRIC MODEL
 * CANNOT PROVE ITS OWN" applies in full: this model has no chiral content, so it cannot witness its
 * own handedness. The consequence is handled the way that rule requires — by making sure NO narration
 * claim in the scene names a side, and saying so in the scene's gaps[] — not by letting the comment
 * above stand as a proof. There is nothing lateral in week two to get wrong, which is why that is an
 * honest answer here rather than a dodge.
 *
 * UNITS. 1 unit = 100 micrometres, stated so the sheet thicknesses are a consequence of cell heights
 * rather than a look. Tall columnar epiblast is taken at 25 um and small cuboidal hypoblast at 10 um —
 * standard teaching figures — so the two sheets come out 0.25 and 0.10 units thick and the ratio a
 * student is examined on (the upper layer is VISIBLY taller) is derived, not dialled in. The disc
 * grows from 0.1 mm across on day 8 to 0.2 mm on day 14; the conceptus from about 0.18 mm to about
 * 0.9 mm. Those are the measured basis of every length below.
 *
 * THE SOLVED PARAMETER, AND WHY IT IS THIS ONE. RENDER-STANDARD: "Ask which number a student would be
 * marked wrong for, and solve THAT one against a stated constraint." The examinable fact in beat 4 is
 * that the extraembryonic mesoderm SPLITS — one tissue becomes a somatic sheet, a splanchnic sheet and
 * the cavity between them. A split conserves tissue. So the sheet thickness is not chosen: it is
 * solved by bisection, at every t, from the requirement that
 *
 *      V(somatic) + V(splanchnic)  ==  V(mesoderm as it stood before the cavity opened)
 *
 * and the volumes are read off the BUILT TRIANGLES by the divergence theorem, never from the
 * constants the triangles were built from (RENDER-STANDARD: AN ACCEPTANCE MEASUREMENT MUST BE A
 * FUNCTION OF THE BUILT GEOMETRY). Row H measures the residual and row H-perturb changes the shell
 * radius and requires the solved thickness to MOVE, which is the check that it is a solve and not an
 * arithmetic restatement.
 */
(function () {

const T = window.THREE;
const K = window.VizKit;   // render-kit.js must load first — it owns winding, normals and colour
const C = K.C;

/* ------------------------------------------------------------------- palette */

const LAYERS = {
  epiblast:               { color: 0xc0392b, name: 'Epiblast' },
  hypoblast:              { color: 0xf39c12, name: 'Hypoblast' },
  prechordal_plate:       { color: 0xe59866, name: 'Prechordal plate' },
  amnion:                 { color: 0x7fb3d5, name: 'Amnion (amnioblasts)' },
  amniotic_cavity:        { color: 0x5dade2, name: 'Amniotic cavity' },
  heuser:                 { color: 0xd6bf6a, name: "Exocoelomic (Heuser's) membrane" },
  primary_yolk_sac:       { color: 0xf7dc6f, name: 'Primary yolk sac' },
  secondary_yolk_sac:     { color: 0xf4d03f, name: 'Secondary yolk sac' },
  exocoelomic_cysts:      { color: 0xd4ac0d, name: 'Exocoelomic cysts' },
  extraembryonic_mesoderm:{ color: 0xa9dfbf, name: 'Extraembryonic mesoderm' },
  somatic_mesoderm:       { color: 0x7dcea0, name: 'Extraembryonic somatic mesoderm' },
  splanchnic_mesoderm:    { color: 0x52be80, name: 'Extraembryonic splanchnic mesoderm' },
  chorionic_cavity:       { color: 0x48c9b0, name: 'Chorionic cavity (extraembryonic coelom)' },
  connecting_stalk:       { color: 0x45b39d, name: 'Connecting stalk' },
  cytotrophoblast:        { color: 0xbfc9d4, name: 'Cytotrophoblast' },
  syncytiotrophoblast:    { color: 0x8e9bab, name: 'Syncytiotrophoblast' },
};

/* -------------------------------------------------------------- measured basis
   Everything with a length is here, in units of 100 um, with the figure it came from. */

const UM = 0.01;             // 1 um, in model units (1 unit = 100 um)

/* MUTABLE ON PURPOSE. Every length that comes from a cell height lives here and is read through a
   function, never captured in a const at load time. That is what lets acceptance row H3 change one
   of these figures, rebuild, and require the measured answer to MOVE — RENDER-STANDARD's
   perturbation check, which is the only thing that distinguishes a measurement of the geometry from
   an author doing the same arithmetic twice. A const captured at load would have made that row
   impossible to write, and the row would have been quietly dropped. */
const CELL = {
  epiblast_um:  25,          // tall columnar
  hypoblast_um: 10,          // small cuboidal
  amnioblast_um: 4,          // the amniotic roof is thin — a squamous sheet
  heuser_um:     3,          // the exocoelomic membrane is thinner still
  mesoSheet_um: 15,          // a somatic or splanchnic sheet, a few cells of loose mesothelium
};

const hEpi = () => CELL.epiblast_um   * UM;    // 0.25
const hHyp = () => CELL.hypoblast_um  * UM;    // 0.10
const hAmn = () => CELL.amnioblast_um * UM;    // 0.04
const hHeu = () => CELL.heuser_um     * UM;    // 0.03
const hMeso = () => CELL.mesoSheet_um * UM;    // 0.15

/* disc radius: 0.1 mm across on day 8 -> 0.2 mm on day 14 */
const RD0 = 0.5, RD1 = 1.0;
/* conceptus outer radius (outside of the syncytiotrophoblast): about 0.18 mm -> about 0.9 mm across */
const RC0 = 0.9, RC1 = 4.6;

const NTHETA = 48;           // points around a solid of revolution
const NPROF  = 1;            // profile subdivision is per-segment, set where each profile is built

/* the days each event happens on, as t. Narrated as approximations in the scene, which is why they
   are here once rather than inline: a reviewer can move a date in one place. */
const WHEN = {
  amnion_opens:     0.0,       // day 8  — a slit within the epiblast
  heuser:           0.12,      // from ~day 8.7, so the sac EXISTS on day 9 — which is what the
                               // narration asserts. Set to 1/6 (day 9 exactly) the ramp was still
                               // at zero ON day 9 and acceptance row R caught it.
  mesoderm:         0.45,      // ~day 10.7, fully filled by day 11.2 — "around day eleven"
  cavity_opens:     0.6,       // ~day 11.6 — the chorionic cavity starts to open inside it
  secondary:        2 / 3,     // day 12 — the second wave pinches off a smaller sac
  cysts:            0.78,      // ~day 12.7 — scraps of the primary sac left behind
  primary_gone:     0.95,      // the primary sac is finished by day 13.7
  prechordal:       0.86,      // ~day 13.2, tall columnar by day 14
};

/* smoothstep ramps, so nothing pops into existence with a hard edge in t */
function ramp(t, a, b) {
  if (b <= a) return t >= b ? 1 : 0;
  const u = Math.max(0, Math.min(1, (t - a) / (b - a)));
  return u * u * (3 - 2 * u);
}
const lerp = (a, b, u) => a + (b - a) * u;

/* ------------------------------------------------------------- the dimensions
   One function of t, consulted by every part, so no two parts can disagree about the stage. */

function dims(t) {
  const rDisc = lerp(RD0, RD1, t);
  const rConc = lerp(RC0, RC1, t);                       // outer face of syncytiotrophoblast
  const hSyn  = 0.10 + 0.22 * t;                         // syncytial rind thickens as it invades
  const hCyto = 0.07 + 0.13 * t;
  const rCytoIn = rConc - hSyn - hCyto;                  // inner face of the cytotrophoblast

  /* amniotic cavity: a slit inside the epiblast on day 8, a dome by day 14 */
  const amnR = rDisc * lerp(0.46, 1.0, ramp(t, 0, 0.75));
  const amnH = lerp(0.055, 1.35, ramp(t, 0, 1));

  /* primary yolk sac: appears day 9, large, then is replaced */
  const primLive = ramp(t, WHEN.heuser, WHEN.heuser + 0.10) * (1 - ramp(t, WHEN.secondary, WHEN.primary_gone));
  const primR = lerp(0.95, 2.05, ramp(t, WHEN.heuser, WHEN.secondary));

  /* secondary yolk sac: pinched off from day 12, smaller than the primary it replaces */
  const secLive = ramp(t, WHEN.secondary, WHEN.secondary + 0.12);
  const secR = lerp(0.70, 1.15, ramp(t, WHEN.secondary, 1));

  const cystLive = ramp(t, WHEN.cysts, WHEN.cysts + 0.12);
  const mesoLive = ramp(t, WHEN.mesoderm, WHEN.mesoderm + 0.08);
  const cavLive  = ramp(t, WHEN.cavity_opens, 0.80);
  const stalkLive = ramp(t, WHEN.cavity_opens, WHEN.secondary + 0.08);
  const plateLive = ramp(t, WHEN.prechordal, 1);

  return { t, day: 8 + 6 * t, rDisc, rConc, hSyn, hCyto, rCytoIn,
           amnR, amnH, primLive, primR, secLive, secR,
           cystLive, mesoLive, cavLive, stalkLive, plateLive };
}

/* =============================================================== the revolver

   WHY THIS EXISTS AND WHY IT IS NOT A RENDER-STANDARD VIOLATION. Section 6 forbids a model
   reimplementing WINDING, NORMALS, SILHOUETTES or COLOUR locally. This reimplements none of them:
   every triangle goes through K.emitter()'s quad/triN, every colour through C(), every silhouette
   through K.addSolid -> K.outlineOf. What it adds is a surface GENERATOR for a shape sweptShell
   cannot make — a closed solid of revolution, which is what a flat sheet, a cavity cast and a
   spherical shell all are. cardiac-looping does the same thing with its own centreline.

   A closed profile in the (r, y) half-plane, revolved about the y axis:

       P(u, th) = ( R(u) cos th,  Y(u),  R(u) sin th )

   NORMALS come from a finite difference of THAT SAME point function (rule 3), never from a radial
   assumption — which matters here because these profiles have corners and a flat top, where the
   radial direction is simply wrong. The difference is guarded: at a pole R -> 0 and the th-derivative
   collapses, and three's normalize() returns (0,0,0) for a zero vector without complaining, which is
   how rule 3 came to be written. There the normal is taken from the profile tangent alone.

   WHICH WAY IS OUT IS SOLVED, NOT GUESSED. The sign is taken from the SHOELACE AREA of the profile:
   a profile traced counter-clockwise in (r, y) has its interior to the left of the tangent, so
   outward is to the right of it, and vice versa. That means a caller can hand profiles in either
   direction and the solid is still outward-facing — which is the whole point of RENDER-STANDARD
   2.4b's corollary, that "a winding convention that has to be reasoned about at the call site will be
   got wrong at some call site". Nothing here is reasoned about at the call site. The outward-normals
   probe in the render harness then measures it rather than taking this paragraph's word for it.      */

/* A PARTIAL SWEEP, AND WHY THE SHELLS NEED ONE. th0/th1 sweep only part of the circle, leaving the
   solid open, and `pairCap` closes the two cut faces. Added after the scene visibility walk measured
   what a closed nested shell does to the pictures a student looks at: in beat 5 the
   syncytiotrophoblast was the first solid surface over 32.5% of the frame and ALL EIGHT structures
   inside it — the two mesoderm sheets and the chorionic cavity among them — measured 0% on the
   id-pick. The camera is inside those shells, so no viewpoint fixes it; RENDER-STANDARD says a
   camera is not a fix, and here it provably is not. CROSS_SECTION does not help either: the player
   cuts SHEETS, not closed solids, so the op changed the measured frame by nothing at all.
   The shells are therefore built sectioned. The cut keeps th in [pi, 2pi], which is the CAUDAL half
   (z <= 0) rather than a left or right half, and that choice is not cosmetic: the map th -> pi - th
   is the mirror in x, and it maps [pi, 2pi] onto itself, so a caudal cut leaves the model
   mirror-symmetric in x and acceptance row N keeps meaning what it says. A left-right cut would have
   given this model a handedness it has no anatomical basis for, and row N would have failed — which
   is the row doing its job rather than an inconvenience. */
function revolve(profile, opts) {
  opts = opts || {};
  const nth0 = opts.ntheta || NTHETA;
  const cx = opts.cx || 0, cz = opts.cz || 0, cy = opts.cy || 0;
  /* SEVERAL SPANS IN ONE GEOMETRY. Added 2026-10-03 by the rework run. A cutaway used to be one
     span (th0..th1) and therefore one window, and a single window cannot be both x-mirror-symmetric
     and aimed at the lateral camera: mirroring x maps theta -> pi - theta, whose fixed directions
     are +z and -z, so any single symmetric window faces anterior or posterior and leaves the wall
     standing in front of the lateral camera. TWO windows, on +x and -x, are symmetric AND aimed at
     the camera eight of this scene's ten beats use. Measured the hard way first: cutting the
     membranes with the old single caudal-half span fixed beat 10's cavity (0.036% -> 5.663%) and
     broke beats 4 and 5, whose camera is ANTERIOR and which then saw the window instead of the
     wall and read heuser 0.000%. Spans are swept into the SAME emitter, so every call site still
     gets one geometry and hullCount still covers the whole buffer. */
  const spans = opts.spans ? opts.spans.map(s2 => s2.slice()) :
    [[opts.th0 == null ? 0 : opts.th0, opts.th1 == null ? Math.PI * 2 : opts.th1]];
  const totalW = spans.reduce((a, s2) => a + Math.abs(s2[1] - s2[0]), 0);
  const n = profile.length;
  if (n < 3) return null;

  /* shoelace in (r, y): positive = counter-clockwise = interior on the left of the tangent */
  let area2 = 0;
  for (let i = 0; i < n; i++) {
    const a = profile[i], b = profile[(i + 1) % n];
    area2 += a.r * b.y - b.r * a.y;
  }
  if (Math.abs(area2) < 1e-12) return null;              // degenerate profile: no solid
  const sgn = area2 > 0 ? 1 : -1;

  /* the span being swept, and its own theta count — set per span in the loop below. nth is
     apportioned by span width against the TOTAL swept angle, so splitting one span into two does
     not change the triangle count. */
  let th0 = 0, th1 = Math.PI * 2, nth = nth0, partial = false;
  const TH = j => th0 + (j / nth) * (th1 - th0);

  function pt(i, j, out) {
    const p = profile[((i % n) + n) % n], th = TH(j);
    return out.set(cx + p.r * Math.cos(th), cy + p.y, cz + p.r * Math.sin(th));
  }

  /* the profile tangent at station i, central-differenced on the closed ring */
  const tang = [];
  for (let i = 0; i < n; i++) {
    const a = profile[(i - 1 + n) % n], b = profile[(i + 1) % n];
    let dr = b.r - a.r, dy = b.y - a.y;
    const L = Math.hypot(dr, dy);
    if (L < 1e-12) { dr = 0; dy = 1; } else { dr /= L; dy /= L; }
    tang.push({ dr, dy });
  }

  /* outward 2D normal = tangent turned to the RIGHT when the interior is on the left. */
  function nrm(i, j, out) {
    const p = profile[((i % n) + n) % n], g = tang[((i % n) + n) % n], th = TH(j);
    const nr = sgn * g.dy, ny = -sgn * g.dr;
    if (p.r < 1e-9) {
      /* ON THE AXIS the ring collapses and there is no circumferential direction at all; the normal
         is the profile normal pushed along y only. Taking it from a cross product here is the
         zero-vector case rule 3 is about. */
      out.set(0, ny >= 0 ? 1 : -1, 0);
      return out.normalize();
    }
    out.set(nr * Math.cos(th), ny, nr * Math.sin(th));
    return out.normalize();
  }

  const E = K.emitter();
  const pa = new T.Vector3(), pb = new T.Vector3(), pc = new T.Vector3(), pd = new T.Vector3();
  const na = new T.Vector3(), nb = new T.Vector3(), nc = new T.Vector3(), nd = new T.Vector3();
  const _e1 = new T.Vector3(), _e2 = new T.Vector3(), _fn = new T.Vector3(), _mn = new T.Vector3();

  /* WHETHER quad OR quadFlip IS RIGHT IS DECIDED FROM THE GEOMETRY, PER QUAD, AND NEVER REASONED ABOUT.
     This is the second time the cardinal bug of RENDER-STANDARD 2.1 was written into this file, and
     the first version of this loop is how. The supplied vertex normals were correct — derived from
     the profile's own shoelace sign, and the probe confirms the sheets are outward — but
     emitter().quad() emits a FIXED order, tri(a,d,c) then tri(a,c,b), whose face normal for this
     parametrisation works out proportional to (-Y' cos th, R', -Y' sin th): the exact NEGATIVE of
     the outward normal being supplied alongside it. So every quad was wound against its own normal.
     Measured, before the fix: winding agreement 0.14 on the sheets, 0.04 on the shells, 0.025 on the
     caps, signed volumes NEGATIVE throughout, and the ray-cast reporting 99-100% of first hits as
     backfaces from every camera. Nothing LOOKED wrong, because the materials are DoubleSide and the
     shading follows the supplied normals — which is 2.1's description of itself, arriving again.

     The lesson 2.4b states is the fix: "a winding convention that has to be reasoned about at the
     call site will be got wrong at some call site." So the call site stops reasoning. The face
     normal of the quad as quad() would emit it is computed and compared with the supplied normal,
     and quadFlip is used when they disagree. Cost is one cross product per quad. */
  for (const span of spans) {
  th0 = span[0]; th1 = span[1];
  partial = Math.abs((th1 - th0) - Math.PI * 2) > 1e-9;
  nth = Math.max(4, Math.round(nth0 * Math.abs(th1 - th0) / totalW));
  for (let i = 0; i < n; i++) {
    for (let j = 0; j < nth; j++) {
      pt(i, j, pa);     pt(i + 1, j, pb);     pt(i + 1, j + 1, pc);     pt(i, j + 1, pd);
      nrm(i, j, na);    nrm(i + 1, j, nb);    nrm(i + 1, j + 1, nc);    nrm(i, j + 1, nd);
      const ra = profile[i].r, rb = profile[(i + 1) % n].r;
      if (ra < 1e-9 && rb < 1e-9) continue;              // both on the axis: no area
      if (ra < 1e-9 || rb < 1e-9) {
        /* a POLE: the quad degenerates to a triangle. triN orders it from the geometry rather than
           from a comment — RENDER-STANDARD 2.4b, the rule that exists because every flat cap in the
           corpus had been wound by reasoning at the call site and every one was backwards. */
        if (ra < 1e-9) E.triN(pa, pb, pc, nc);
        else           E.triN(pa, pc, pd, na);
        continue;
      }
      /* the face normal quad() would produce: its first triangle is tri(a, d, c). Compared against
         the MEAN of the four supplied normals, not against na alone — near a dome's pole the four
         corners' normals fan apart and one corner is not representative of the face, which left the
         day-8 amniotic cavity (a very flat dome, 5.5 um tall) with 7% of its triangles wound against
         themselves while every other mesh measured 1.0000. A one-corner test on a quad whose corners
         disagree is the same class of mistake as reasoning about winding at the call site. */
      _fn.copy(_e1.subVectors(pd, pa).cross(_e2.subVectors(pc, pa)));
      _mn.copy(na).add(nb).add(nc).add(nd);
      if (_fn.lengthSq() > 1e-22 && _mn.lengthSq() > 1e-18 && _fn.dot(_mn) < 0)
        E.quadFlip(pa, pb, pc, pd, na, nb, nc, nd);
      else
        E.quad(pa, pb, pc, pd, na, nb, nc, nd);
    }
  }
  /* THE TWO CUT FACES. Only for a partial sweep, and only where the caller says how the profile
     pairs up: shellProfile traces the outer arc out and the inner arc back, so outer station i is
     opposite inner station (2m+1-i) and the face is a quad strip between them. triN decides each
     triangle's order from the geometry rather than from a comment, which is RENDER-STANDARD 2.4b's
     rule and the reason the first version of this whole file had its winding backwards. */
  /* CUT FACES FOR A SOLID. pairCap above closes an out-and-back SHELL profile, where outer station
     i is opposite inner station 2m+1-i. A solid's meridional section is the whole profile polygon,
     so the cut face is that polygon triangulated — fanned from its own centroid, which is safe here
     because every profile that asks for this is convex in (r, y). (The sibling model found a
     centroid fan folding back on a NON-convex meridional profile; the guard against inheriting that
     is that this is opt-in per call site, not a default.) Added 2026-10-03 so the primary yolk sac
     can be cut away over the secondary sac forming inside it, which is beat 6's whole subject and
     which the walk measured at id-pick 0.000%. */
  if (partial && opts.fanCap) {
    const axis = new T.Vector3();
    const ctr = new T.Vector3();
    for (const [j, sign] of [[0, -1], [nth, 1]]) {
      const th = TH(j);
      axis.set(-Math.sin(th) * sign, 0, Math.cos(th) * sign).normalize();
      ctr.set(0, 0, 0);
      for (let i = 0; i < n; i++) { pt(i, j, pa); ctr.add(pa); }
      ctr.multiplyScalar(1 / n);
      for (let i = 0; i < n; i++) {
        pt(i, j, pa); pt(i + 1, j, pb);
        if (pa.distanceToSquared(pb) < 1e-18) continue;
        E.triN(ctr, pa, pb, axis);
      }
    }
  }
  if (partial && opts.pairCap != null) {
    const m = opts.pairCap;
    const axis = new T.Vector3();
    for (const [j, sign] of [[0, -1], [nth, 1]]) {
      const th = TH(j);
      /* the cut face's own normal: along +/- the circumferential direction at that theta */
      axis.set(-Math.sin(th) * sign, 0, Math.cos(th) * sign).normalize();
      for (let i = 0; i < m; i++) {
        const oa = i, ob = i + 1, ia = 2 * m + 1 - i, ib = 2 * m - i;
        pt(oa, j, pa); pt(ob, j, pb); pt(ia, j, pc); pt(ib, j, pd);
        E.triN(pa, pb, pd, axis);
        E.triN(pa, pd, pc, axis);
      }
    }
  }
  }
  const g = E.geometry(E.count());                        // all outer surface -> all of it takes a hull
  return g;
}

/* a closed profile for a SLAB: a flat annulus/disc from r=0 (or rIn) to rOut, between y0 and y1,
   with an optional rim bevel so the edge is not a hard right angle. Traced counter-clockwise. */
function slabProfile(rOut, y0, y1, opts) {
  opts = opts || {};
  const bev = opts.bevel != null ? opts.bevel : Math.min(0.35 * (y1 - y0), 0.10 * rOut);
  const rIn = opts.rIn || 0;
  const P = [];
  const nb = 6;
  P.push({ r: rIn, y: y0 });
  P.push({ r: rOut - bev, y: y0 });
  for (let i = 1; i < nb; i++) {                          // rounded rim, outward
    const a = (i / nb) * Math.PI;
    P.push({ r: rOut - bev + bev * Math.sin(a), y: y0 + (y1 - y0) * (0.5 - 0.5 * Math.cos(a)) });
  }
  P.push({ r: rOut - bev, y: y1 });
  P.push({ r: rIn, y: y1 });
  return P;
}

/* a closed profile for a DOME CAVITY CAST sitting on a flat floor at y0, rising to y0+h over radius
   rOut — the shape of the amniotic cavity, and of the chorionic cavity's upper reach. */
function domeProfile(rOut, y0, h, rows) {
  const N = rows || 14;
  const P = [{ r: 0, y: y0 }, { r: rOut, y: y0 }];
  for (let i = 1; i <= N; i++) {
    const a = (i / N) * (Math.PI / 2);
    P.push({ r: rOut * Math.cos(a), y: y0 + h * Math.sin(a) });
  }
  return P;
}

/* a closed profile for a SPHERE of radius R, flattened by `flat` in y — a yolk-sac cast */
function sphereProfile(R, flat, rows) {
  const N = rows || 20;
  const P = [];
  for (let i = 0; i <= N; i++) {                          // from south pole up the +r side
    const a = -Math.PI / 2 + (i / N) * Math.PI;
    P.push({ r: R * Math.cos(a), y: R * (flat == null ? 1 : flat) * Math.sin(a) });
  }
  return P;
}

/* a closed profile for a SPHERICAL SHELL between radii rIn and rOut, over a polar span. Used for the
   trophoblast layers, the mesoderm and its two sheets: outer surface out, inner surface back. */
function shellProfile(rIn, rOut, flat, rows, a0, a1) {
  const N = rows || 22;
  /* the caller passes `pairCap: N` alongside this profile when it cuts the sweep: station i on the
     outer arc is opposite station (2N+1-i) on the inner one, which is what closes the cut face. */
  const f = flat == null ? 1 : flat;
  const lo = a0 == null ? -Math.PI / 2 : a0, hi = a1 == null ? Math.PI / 2 : a1;
  const P = [];
  for (let i = 0; i <= N; i++) {
    const a = lo + (i / N) * (hi - lo);
    P.push({ r: rOut * Math.cos(a), y: rOut * f * Math.sin(a) });
  }
  for (let i = N; i >= 0; i--) {
    const a = lo + (i / N) * (hi - lo);
    P.push({ r: rIn * Math.cos(a), y: rIn * f * Math.sin(a) });
  }
  return P;
}

/* =================================================== volume, on built triangles

   The divergence theorem over an outward-oriented closed triangle soup:  V = 1/6 sum p0.(p1 x p2).
   This is the ONLY way volume is measured anywhere in this file. RENDER-STANDARD: "the measured side
   of every acceptance assertion must be read from the geometry the model builds — rows, grids or mesh
   vertices — and never from the constants the geometry was built from. Restating a shape law in the
   test that checks it proves only that the author can do the arithmetic twice." So the mesoderm
   conservation below is solved against volumes of REAL BUILT SHELLS, not against 4/3 pi r^3. The
   immediate consequence is that the solve absorbs the polygonal discretisation instead of fighting it,
   which is why row H's residual is at machine precision rather than at the 1.5% a sphere of 48
   segments loses — and why row H-perturb, not row H, is the row with teeth. */

function meshVolume(geo) {
  if (!geo) return 0;
  const p = geo.attributes.position;
  let v6 = 0;
  const a = new T.Vector3(), b = new T.Vector3(), c = new T.Vector3(), x = new T.Vector3();
  for (let i = 0; i + 2 < p.count; i += 3) {
    a.fromBufferAttribute(p, i); b.fromBufferAttribute(p, i + 1); c.fromBufferAttribute(p, i + 2);
    v6 += a.dot(x.crossVectors(b, c));
  }
  return v6 / 6;
}

/* ------------------------------------------------- the shapes, and the envelope

   WHAT THE FIRST VERSION OF THIS SECTION GOT WRONG, KEPT HERE BECAUSE THE MISTAKE IS INSTRUCTIVE.

   It solved the sheet thickness by bisection against conservation of tissue across the split:
   V(somatic) + V(splanchnic) == V(mesoderm before the cavity opened). The bisection converged
   beautifully — residual 9e-10 over thirty iterations — and the answer was h = 1.294, a splanchnic
   sheet 130 um thick wrapped on a yolk sac 105 um in radius. Acceptance row P then found what that
   meant: 67.5% of the amniotic cavity's vertices were INSIDE the splanchnic sheet. The solve had
   swallowed the embryo.

   The solve was not buggy. The CONSTRAINT was false. Extraembryonic mesoderm is loose reticular
   tissue that is mostly extracellular space, and the chorionic cavity forms by those spaces becoming
   confluent — so the gap between the embryo and the trophoblast was never solid tissue and there is
   no solid volume to conserve into two sheets. A constraint stated confidently enough to bisect
   against is still a false constraint, and a residual of 1e-9 against a false constraint is a
   precisely wrong answer.

   RENDER-STANDARD also says the parameter to solve is the one "a student would be marked wrong for",
   and it was not this one: nobody is examined on the thickness of the somatic sheet. Solving it was
   solving the half that does not matter, which is the exact fault that document records about
   cardiac-looping's torsion.

   So the sheet thickness is now a STATED cell figure like every other thickness in this file
   (CELL.mesoSheet_um), and the thing that is genuinely solved is the one the defect was about:

       rEmb(t) — THE SMALLEST RADIUS THAT ENCLOSES THE WHOLE EMBRYO COMPLEX.

   The mesoderm, the chorionic cavity and both sheets all begin at rEmb, so if rEmb is wrong the
   mesoderm passes through the disc, the amnion or the yolk sac. It is solved by BUILDING the embryo
   complex at that t and measuring the furthest vertex from the origin — never from the constants the
   complex was built from — and row H1 asserts the result is both sufficient (nothing sticks out) and
   TIGHT (not a safe huge number, which would pass a one-sided test while pushing the chorion out to
   nowhere). Row H3 perturbs a cell height and requires rEmb to follow.                            */

/* THE CUTAWAY. Two 90-degree windows, on +x and -x, leaving the two quarter-shells that face +z and
   -z. Was `{ th0: Math.PI, th1: Math.PI * 2 }` — the caudal half — until 2026-10-03, when review
   round 1's finding 3 forced the membranes to be cut too and that exposed what the single span
   could not do. Three properties, and the cut is chosen for all three rather than for the first:
     · AIMED AT THE CAMERA. The removed window is centred on theta = 0, which viz3d's VIEW_DIR puts
       at 'lateral' — the camera eight of this scene's ten beats rotate to. A lumen inside a wall is
       now in DIRECT view from there, not credited through a translucent film.
     · THE WALL SURVIVES THE OTHER CAMERA. The kept quarters are centred on +z and -z, so the
       anterior and posterior beats (4 and 5) still see wall rather than through it. The single
       caudal-half span failed exactly here, measured: heuser 0.000% in both.
     · x-MIRROR-SYMMETRIC, which is what keeps row N honest. Mirroring x maps theta -> pi - theta;
       (45,135) maps to itself and (225,315) maps to itself, so the pair is invariant. A single
       window centred on +x is z-symmetric, NOT x-symmetric, and would have broken row N.
   The swept angle is still pi in total, so every volume this model solves against is unchanged and
   rows H1, H2 and H3 are comparing the same numbers they were. */
/* THE OUTER SHELLS' CUTAWAY: the caudal half. Unchanged, and the note is here because the rework
   run of 2026-10-03 TRIED TO CHANGE IT AND THE MEASUREMENT SAID NO — which is worth more than the
   change would have been.
   The aim was beat 7, where the chorionic cavity stands between the lateral camera and the
   connecting stalk that beat HIGHLIGHTS at intensity 0.95: id-pick 0.018%. A three-window variant
   (60 degrees each on +x, +z and -x, still 180 degrees in total so row H2's tiling held, still
   x-symmetric so row N held) was built and walked. IT MADE THE STALK WORSE, 0.018% -> 0.004%, and
   the chorionic cavity's OWN share rose 18.1% -> 29.0%.
   WHY, and this is the general lesson: the chorionic cavity is a THICK shell, and a radial window
   in a thick shell does not reveal what is inside it — it reveals that shell's own INNER WALL,
   which carries the same key. Cutting a wrapper only helps when the wrapper is thin enough that a
   sightline through the window misses both of its surfaces, which is true of the membranes
   (MEMBRANE_CUT, below) and false of a shell spanning rEmb+h to rCytoIn-h. Worse, the stalk runs
   along the -z axis and spans the shell RADIALLY, so a sightline to it from +x crosses the shell at
   theta near 270 almost whatever the window layout is; the only window that would open it is one
   centred on -z, and that one puts kept wall back in front of the central structures beat 7 also
   shows. There is no single span that serves both.
   What beat 7 rests on instead is the alpha-aware measure, and for a 0.14-opacity GHOST ENVELOPE
   that is the case RENDER-STANDARD 3.x names in as many words: "a valve seen through a 0.38-opacity
   blood cast is exactly what a teaching diagram draws, and the id-pick alone reads it as
   invisible." The stalk's alpha-aware peak is 233 of 255 against a floor of 40. Row S below is the
   check that this is a real picture and not a credit: it measures the HIGHLIGHT DELTA, which is
   finding 4's proposed rule. */
const SHELL_CUT = { th0: Math.PI, th1: Math.PI * 2 };

/* THE MEMBRANE CUTAWAY, and why it is a DIFFERENT cut from SHELL_CUT rather than the same one.
   The two cuts have opposite jobs, and that is measurable rather than a matter of taste:
     · SHELL_CUT, above, is on the OUTER shells — trophoblast, mesoderm, its two sheets, the
       chorionic cavity. Its window is the cranial half, which contains +z, so the ANTERIOR camera
       of beats 4 and 5 looks through it into the gap those beats are about.
     · MEMBRANE_CUT is on the walls that wrap a LUMEN THE SCENE POINTS AT — the amnion over the
       amniotic cavity, Heuser's membrane over the primary sac, and the primary sac over the
       secondary one during the replacement window. Its windows are on +-x, which is where viz3d
       puts 'lateral', the camera eight of this scene's ten beats rotate to. So a lumen is in direct
       view from there, and NOT credited through a translucent film, which is what review round 1's
       finding 4 says a highlight must never rest on.
   GIVING THE MEMBRANES SHELL_CUT INSTEAD WAS TRIED FIRST AND MEASURED: it fixed beat 10's cavity
   (0.036% -> 5.663%) and broke beats 4 and 5, which saw the window where the wall should be and
   read heuser 0.000%. Giving EVERYTHING MEMBRANE_CUT was tried second and was worse: from the
   anterior camera the kept quarter at +z is unbroken wall, so beat 5 read seven of its eight
   structures at 0.000% behind the syncytiotrophoblast. Two roles, two cuts.
   Both are x-mirror-symmetric, which is the constraint row N enforces: mirroring x maps
   theta -> pi - theta, so (45,135) and (225,315) each map to themselves. A SINGLE window centred on
   +x would be z-symmetric, not x-symmetric, and would have broken that row. Both sweep pi in total,
   so no volume this model solves against moves. */
const MEMBRANE_CUT = { spans: [[Math.PI / 4, Math.PI * 3 / 4], [Math.PI * 5 / 4, Math.PI * 7 / 4]] };

const EMB_MARGIN = 1.04;      // the mesoderm stands this much clear of the embryo's own envelope

/* the parts that make up "the embryo complex" — what the mesoderm must not pass through */
const EMB_KEYS = { epiblast: 1, hypoblast: 1, prechordal_plate: 1, amnion: 1, amniotic_cavity: 1,
                   heuser: 1, primary_yolk_sac: 1, secondary_yolk_sac: 1 };

const _embCache = {};
function embEnvelope(D) {
  const key = D.t.toFixed(6);
  if (_embCache[key] != null) return _embCache[key];
  const out = embEnvelopeAt(D);
  _embCache[key] = out;
  return out;
}
/* uncached, so the perturbation row can re-run it on an altered D or altered cell heights */
function embEnvelopeAt(D) {
  const g = new T.Group();
  buildEmbryoComplex(g, D);
  g.updateMatrixWorld(true);
  let worst = 0, n = 0;
  const v = new T.Vector3();
  g.traverse(function (o) {
    if (!o.isMesh || !o.geometry || (o.userData && o.userData.outline)) return;
    const p = o.geometry.attributes.position; if (!p) return;
    for (let i = 0; i < p.count; i++) {
      v.fromBufferAttribute(p, i).applyMatrix4(o.matrixWorld);
      const d = v.length();
      if (d > worst) worst = d;
      n++;
    }
  });
  return { maxRadius: worst, rEmb: worst * EMB_MARGIN, verts: n, margin: EMB_MARGIN };
}

/* ---- the three concentric regions, which TILE the gap [rEmb, rCytoIn] exactly ----
   somatic  = the outer lining of the cytotrophoblast, PLUS a dorsal cap over the amnion
   splanchnic = a ventral cap over the yolk sac
   cavity   = everything between the caps and the lining
   The dorsal/ventral split of the inner cap is the anatomy beat 4 narrates: the somatic layer covers
   the amnion (which is dorsal) and the splanchnic layer covers the yolk sac (which is ventral). */
function somaticLiningGeo(D, h) {
  if (!(D.rCytoIn > h)) return null;
  return revolve(shellProfile(D.rCytoIn - h, D.rCytoIn, 1, 26),
    Object.assign({ ntheta: 44, pairCap: 26 }, SHELL_CUT));
}
function somaticCapGeo(D, h, rEmb) {
  return revolve(shellProfile(rEmb, rEmb + h, 1, 20, 0, Math.PI / 2),
    Object.assign({ ntheta: 40, pairCap: 20 }, SHELL_CUT));
}
function splanchnicCapGeo(D, h, rEmb) {
  return revolve(shellProfile(rEmb, rEmb + h, 1, 20, -Math.PI / 2, 0),
    Object.assign({ ntheta: 40, pairCap: 20 }, SHELL_CUT));
}
function chorionicCavityGeo(D, h, rEmb) {
  const rIn = rEmb + h, rOut = D.rCytoIn - h;
  if (!(rOut > rIn + 0.02)) return null;
  return revolve(shellProfile(rIn, rOut, 1, 24), Object.assign({ ntheta: 40, pairCap: 24 }, SHELL_CUT));
}
/* the loose tissue of day 11, before the cavity opens inside it: the whole gap, one shell */
function mesodermFullGeo(D, rEmb) {
  if (!(D.rCytoIn > rEmb + 0.02)) return null;
  return revolve(shellProfile(rEmb, D.rCytoIn, 1, 26),
    Object.assign({ ntheta: 44, pairCap: 26 }, SHELL_CUT));
}

/* ================================================================== the build */

function add(g, key, geo, over) {
  if (!geo) return null;
  const pal = LAYERS[key] || { color: 0xcccccc, name: key };
  const o = Object.assign({ color: pal.color, name: pal.name, outline: 0.012 }, over || {});
  return K.addSolid(g, key, geo, o);
}

/* THE EMBRYO COMPLEX — the disc, the prechordal plate, both cavities and their membranes. Factored
   out of buildDisc so that embEnvelopeAt() can build EXACTLY what the mesoderm must clear, rather
   than a separate approximation of it that could drift. One function, two callers. */
function buildEmbryoComplex(g, D, opts) {
  opts = opts || {};
  /* ---------------------------------------------------------------- the disc
     THE ONE THING THAT MUST NEVER MOVE. The scene's own gaps[] says it: "The drawing must keep the
     disc the same way up in every panel, epiblast uppermost. Reversing it between the day 9 and day
     13 panels for layout convenience would teach the opposite of beat 1." Here that is structural
     rather than a note to a draughtsman — the epiblast occupies y in [0, hEpi()] and the hypoblast
     y in [-hHyp(), 0] at EVERY t, and acceptance rows A, C and D re-measure it at 21 values of t.
     The two sheets ABUT at y = 0; they do not overlap. That shared plane is the interface beat 1 is
     about, and it is the one place in this model where two parts touch by anatomy rather than by
     construction. */
  add(g, 'epiblast',  revolve(slabProfile(D.rDisc, 0, hEpi())));
  add(g, 'hypoblast', revolve(slabProfile(D.rDisc, -hHyp(), 0)));

  /* THE PRECHORDAL PLATE — a patch of hypoblast at the CRANIAL end that becomes tall columnar and
     adheres to the epiblast above it. Placed on the +z axis, which this file declares as cranial.
     It is built as its own solid rising from the hypoblast's own floor to meet the epiblast, so
     "adheres to the epiblast" is a geometric fact (row L) and not a caption. */
  if (D.plateLive > 0.02) {
    const rP = 0.26 * D.rDisc;
    const zP = 0.64 * D.rDisc;     // so the patch spans 0.38R to 0.90R: the cranial margin, inside the disc
    const hP = lerp(hHyp(), CELL.epiblast_um * UM * 1.05, D.plateLive);   // becomes tall columnar
    /* IT BULGES VENTRALLY, AND THAT IS NOT A DETAIL. The first version grew the patch UPWARD from the
       hypoblast's own floor, which put 0.16 units of it THROUGH the epiblast — acceptance row L
       measured 2.625 where 1.0 is "just touching" and caught it. The plate's dorsal face is held
       against the epiblast (that adhesion is what beat 7 narrates as the future mouth), so the extra
       height of a cell that becomes tall columnar has nowhere to go but into the roof of the yolk
       sac. Spanning [-hP, 0] makes "adheres to the epiblast" exact — row L now reads 1.000 — and
       makes the bulge into the yolk sac an excused pair in row P's published partition rather than a
       silent overlap with the sheet above it. */
    add(g, 'prechordal_plate', revolve(slabProfile(rP, -hP, 0, { bevel: 0.055 }),
      { cz: zP, ntheta: 32 }));
  }

  /* ------------------------------------------------------- the two cavities */
  if (opts.cavities !== false) {
    /* the amniotic cavity, DORSAL, floored by the epiblast it opened inside */
    add(g, 'amniotic_cavity', revolve(domeProfile(D.amnR, hEpi(), D.amnH), { ntheta: 40 }),
      { matOver: { transparent: true, opacity: 0.34, roughness: 0.85 }, noOutline: true });
  }
  if (opts.amnion !== false) {
    /* AND ITS ROOF. A MEMBRANE TAPERS (RENDER-STANDARD): the amnioblast sheet thins to nothing where
       it meets the epiblast at the disc rim, so it does not read as a slab of card standing behind
       the subject — which is exactly what the first dorsal mesocardium looked like. */
    const N = 36, P = [];
    for (let i = 0; i <= N; i++) {
      const a = (i / N) * (Math.PI / 2);
      /* A MEMBRANE TAPERS (RENDER-STANDARD) — BUT NOT TO EXACTLY ZERO. Tapering the last station to
         0 makes the outer and inner surfaces COINCIDENT at the rim, and two coincident surfaces are
         the one thing this standard spends section 2.1 on: beat 1's render came back with a
         stair-stepped sawtooth down the right edge of the amniotic dome, which is the classic
         z-fighting signature. The taper is what the rule asks for; the zero is not. A floor of 8% of
         full thickness keeps the wedge reading as a wedge and keeps the two surfaces apart. */
      const th = hAmn() * (0.08 + 0.92 * Math.sin(a) ** 0.55);
      P.push({ r: (D.amnR + th) * Math.cos(a), y: hEpi() + (D.amnH + th) * Math.sin(a) });
    }
    for (let i = N; i >= 0; i--) {
      const a = (i / N) * (Math.PI / 2);
      P.push({ r: D.amnR * Math.cos(a), y: hEpi() + D.amnH * Math.sin(a) });
    }
/* NO SILHOUETTE ON A TWO-SURFACED SHELL. RENDER-STANDARD 2.4: "Inflating a whole solid — outer
   surface, inner wall, end caps, cutaway rims — tears the hull open at every seam where one position
   carries two different normals, and the torn interior shows through." revolve() marks its WHOLE
   buffer as hull, which is right for a slab (every triangle of a closed slab IS outer surface) and
   wrong for a shell, where half the buffer is the inner wall. Inflating that inner wall by the
   outline thickness pushes it OUTWARD, straight through the outer surface it is supposed to sit
   behind — and on a membrane 0.04 units thick inflated by 0.012 it pushes through by a third of the
   membrane's own thickness. It showed as a stair-stepped sawtooth down the right edge of the
   amniotic dome in beat 1, which is 2.1's description of itself almost word for word, and it
   survived a first fix aimed at the wrong cause (the taper). Thin translucent films gain nothing
   from a silhouette anyway, so every shell-built part takes noOutline. The slabs — epiblast,
   hypoblast, prechordal plate — and the closed cavity casts keep theirs, because for those the whole
   buffer really is the outer surface. */
/* THE CUTAWAY, AND WHY A WALL THAT WRAPS A LUMEN MUST HAVE ONE. Added 2026-10-03 by the rework run
   against review round 1, finding 3. The amnion is a shell from amnR to amnR+th; the amniotic cavity
   is a cast of 0..amnR sitting immediately inside it, 0.009 units clear radially. So the membrane
   enclosed the cast completely, and the cast contributed NOTHING a student could see: measured on
   beat 10 composed the way the player composes it, amniotic_cavity's id-pick share was 0.036% while
   the amnion's was 11.679%, and applying beat 10's own HIGHLIGHT_STRUCTURE to the cavity at
   intensity 0.85 moved 45 pixels of a million. A beat that highlights a structure and changes
   nothing on screen is a beat that teaches nothing, and the walk had been passing it on alpha-aware
   credit — "some of this structure's colour reaches the camera" — which is the wrong question for a
   highlight and is finding 4's standards point.
   The fix is the one an anatomical plate has always used: cut the wall away over a sector so the
   lumen inside is DIRECTLY in view. SHELL_CUT is this model's existing cutaway convention — already
   carried by both trophoblast layers, the mesoderm, both its sheets and the chorionic cavity — so
   the membranes now take the same one rather than a second convention invented here. It is
   x-mirror-symmetric by construction, which is what keeps row N meaning what it says. */
    add(g, 'amnion', revolve(P, Object.assign({ ntheta: 72, pairCap: N }, MEMBRANE_CUT)),
      { matOver: { transparent: true, opacity: 0.62 }, noOutline: true });
  }

  if (opts.yolk !== false) {
    /* HEUSER'S MEMBRANE — hypoblast cells crawl out from day 9 and line the blastocyst cavity. Also a
       membrane, so also tapered where it meets the hypoblast at the disc rim.

       IT LINES THE PRIMARY SAC, AND ONLY THE PRIMARY SAC. Corrected 2026-10-03 by the rework run,
       against review round 1's first finding. This used to be gated on `primLive > 0.02 ||
       secLive > 0.02` with `rY = max(primR, secR)`, so once the primary was gone (primLive 0 at
       t >= ~0.924) the membrane was REBUILT at the secondary sac's radius and drawn as the
       secondary sac's own wall — measured at t=1, heuser maxR_xz 1.155 wrapping
       secondary_yolk_sac 1.150 over an identical y-range. That is a teaching error a student
       would be marked wrong for: the exocoelomic (Heuser's) membrane lines the PRIMARY yolk sac
       and bounds the exocoelomic cavity. The SECONDARY sac is lined by a second wave of
       hypoblast-derived extraembryonic endoderm, and what is left of the primary and its membrane
       is pinched off as the exocoelomic cysts — which is what `exocoelomic_cysts` is for and what
       its own partition entry ("a cyst left behind by the primary sac may still lie against its
       old wall") already said. The file contradicted itself about this: the partition asserted
       "the membrane is the secondary sac's own wall" twenty lines from a note saying a cyst lies
       against "its OLD wall". The partition entry is deleted, not reworded — see row P's note.
       Consequence the scene had to absorb: the membrane no longer exists at t=1, so beat 10 can
       no longer SHOW it. It does not, and the scene records why in gaps[]. */
    if (D.primLive > 0.02) {
      const rY = D.primR;
      const N = 18, P = [];
      for (let i = 0; i <= N; i++) {                          // outer face, south half
        const a = -(i / N) * (Math.PI / 2);
        const th = hHeu() * (0.08 + 0.92 * Math.sin(-a) ** 0.55);   // see the amnion's note above
        P.push({ r: (rY + th) * Math.cos(a), y: -hHyp() + (rY + th) * Math.sin(a) });
      }
      for (let i = N; i >= 0; i--) {
        const a = -(i / N) * (Math.PI / 2);
        P.push({ r: rY * Math.cos(a), y: -hHyp() + rY * Math.sin(a) });
      }
      /* cut away like the amnion, and for the same reason: it is a wall wrapping a lumen the scene
         points at. Beat 3's primary_yolk_sac read id-pick 0 under this membrane. */
      add(g, 'heuser', revolve(P, Object.assign({ ntheta: 40, pairCap: N }, MEMBRANE_CUT)),
        { matOver: { transparent: true, opacity: 0.55 }, noOutline: true });   // a shell: see the amnion's note
    }

    /* the PRIMARY yolk sac — ventral, roofed by the hypoblast, large, and then replaced */
    if (D.primLive > 0.02) {
      const R = D.primR;
      const P = [{ r: 0, y: -hHyp() }, { r: R, y: -hHyp() }];
      const N = 18;
      for (let i = 1; i <= N; i++) {
        const a = (i / N) * (Math.PI / 2);
        P.push({ r: R * Math.cos(a), y: -hHyp() - R * Math.sin(a) });
      }
      /* CUT AWAY ONCE THE SECOND SAC IS INSIDE IT. Review round 1, finding 3: beat 6 is about the
         secondary sac forming inside the primary — the partition entry for that pair says so in
         terms — and the walk measured the secondary at id-pick 0.000%, completely enclosed by this
         cast. A solid cast needs fanCap rather than pairCap to close its cut faces. The cut is
         applied only while there is something inside to see: before the second sac exists the
         primary is a plain closed sac, which is what beats 1 and 3 teach, and cutting it there
         would open a window on nothing. */
      const primCut = D.secLive > 0.02 ? Object.assign({ fanCap: true }, MEMBRANE_CUT) : {};
      add(g, 'primary_yolk_sac', revolve(P, Object.assign({ ntheta: 40 }, primCut)),
        { matOver: { transparent: true, opacity: 0.30 + 0.22 * D.primLive }, noOutline: true });
    }

    /* the SECONDARY yolk sac — smaller, pinched off from day 12, and the one that matters */
    if (D.secLive > 0.02) {
      const R = D.secR;
      const P = [{ r: 0, y: -hHyp() }, { r: R, y: -hHyp() }];
      const N = 18;
      for (let i = 1; i <= N; i++) {
        const a = (i / N) * (Math.PI / 2);
        P.push({ r: R * Math.cos(a), y: -hHyp() - R * Math.sin(a) });
      }
      add(g, 'secondary_yolk_sac', revolve(P, { ntheta: 40 }),
        { matOver: { transparent: true, opacity: 0.52 }, noOutline: true });
    }

  }

  return g;
}

function buildOutsideEmbryo(g, D, opts) {
  opts = opts || {};
  /* ------------------------------------- extraembryonic mesoderm, and its split
     Everything here begins at rEmb — the SOLVED envelope of the embryo complex above — so the
     mesoderm cannot pass through the disc, the amnion or the yolk sac. That it once did, and by
     130 um, is the whole story in the note above the solve. */
  if (opts.mesoderm !== false && D.mesoLive > 0.02) {
    const h = hMeso();
    const rEmb = embEnvelope(D).rEmb;
    if (D.cavLive <= 0.02) {
      /* day 11 — ONE loose tissue filling the gap */
      add(g, 'extraembryonic_mesoderm', mesodermFullGeo(D, rEmb),
        { matOver: { transparent: true, opacity: 0.40 }, noOutline: true });
    } else {
      /* day 12 on — SOMATIC lining the trophoblast and capping the amnion, SPLANCHNIC over the yolk
         sac, chorionic cavity between. The three tile [rEmb, rCytoIn]; row H2 measures that they do. */
      add(g, 'somatic_mesoderm', somaticLiningGeo(D, h),
        { matOver: { transparent: true, opacity: 0.44 }, noOutline: true });
      add(g, 'somatic_mesoderm', somaticCapGeo(D, h, rEmb),
        { matOver: { transparent: true, opacity: 0.52 }, noOutline: true });    // shells: see the amnion's note
      add(g, 'splanchnic_mesoderm', splanchnicCapGeo(D, h, rEmb),
        { matOver: { transparent: true, opacity: 0.56 }, noOutline: true });
      add(g, 'chorionic_cavity', chorionicCavityGeo(D, h, rEmb),
        { matOver: { transparent: true, opacity: 0.14, roughness: 0.9 }, noOutline: true });

      /* the CONNECTING STALK — the bridge of mesoderm the cavity did NOT open through, at the CAUDAL
         end. Both ends are buried in the tissue it is continuous with, which is construction contact
         and is excluded by name in row P's partition; it is not a tube ending in mid-air, so it needs
         no dome cap. */
      if (D.stalkLive > 0.02) {
        const z0 = -(rEmb + h * 0.5), z1 = -(D.rCytoIn - h * 0.5);
        const pts = [];
        const NS = 16;
        for (let i = 0; i <= NS; i++) {
          const u = i / NS;
          pts.push(new T.Vector3(0, -hHyp() - 0.12 * Math.sin(Math.PI * u), lerp(z0, z1, u)));
        }
        const rad = u => (0.18 + 0.12 * Math.sin(Math.PI * u)) * D.stalkLive * (0.7 + 0.5 * D.t);
        add(g, 'connecting_stalk', K.tubeAlong(pts, rad, { ring: 20 }));
      }
    }
  }

  /* EXOCOELOMIC CYSTS. Built OUT HERE, not with the embryo complex, for two reasons that turned out
     to be the same reason: a cyst is a scrap adrift in the chorionic cavity and is not part of the
     embryo, so including it would have inflated the solved envelope rEmb by its own distance from
     the origin — and because the cyst placement CONSULTS rEmb, building it inside the complex made
     embEnvelope() call buildEmbryoComplex() call embEnvelope(), which is where the first run of this
     file died with a stack overflow. The recursion was the design error announcing itself.

     Placed in MIRROR PAIRS in x, so the model stays mirror-symmetric in x and row N keeps meaning
     what it says: this model carries no left/right content and therefore witnesses no handedness.
     Scattering them freely would have given it a fake chirality nothing in the anatomy supports. */
  if (opts.yolk !== false && D.cystLive > 0.02) {
      const base = D.secR * 0.30 * D.cystLive;
      const spots = [
        [ 1.00, -0.55, 0.00, 1.00], [-1.00, -0.55, 0.00, 1.00],
        [ 0.62, -0.95, 0.55, 0.78], [-0.62, -0.95, 0.55, 0.78],
        [ 0.62, -0.95,-0.55, 0.66], [-0.62, -0.95,-0.55, 0.66],
      ];
      for (const [fx, fy, fz, fr] of spots) {
        const rr = base * fr;
        if (!(rr > 0.01)) continue;
        /* clear of the splanchnic cap, so a cyst sits IN the cavity rather than in a sheet */
        const d2 = Math.max(D.secR + rr + 0.16, embEnvelope(D).rEmb + hMeso() + rr + 0.12);
        add(g, 'exocoelomic_cysts', revolve(sphereProfile(rr, 0.82, 12),
          { cx: fx * d2 * 0.72, cy: -hHyp() + fy * d2 * 0.42, cz: fz * d2 * 0.72, ntheta: 16 }),
          { outline: 0.008 });
      }
  }

  /* ------------------------------------------------------- trophoblast layers
     Here only because the chorion's three-layer definition — somatic mesoderm, cytotrophoblast,
     syncytiotrophoblast — is the line beat 5 asks a student to memorise, and it cannot be shown with
     two of its three layers missing. They are taught as regions in the implantation scene; this model
     builds them so that claim is visible, and the scene says so in gaps[]. */
  if (opts.trophoblast !== false) {
    const rSynOut = D.rConc, rSynIn = D.rConc - D.hSyn;
    add(g, 'syncytiotrophoblast', revolve(shellProfile(rSynIn, rSynOut, 1, 26),
      Object.assign({ ntheta: 44, pairCap: 26 }, SHELL_CUT)),
      { matOver: { transparent: true, opacity: 0.26 }, noOutline: true });
    add(g, 'cytotrophoblast', revolve(shellProfile(D.rCytoIn, rSynIn, 1, 26),
      Object.assign({ ntheta: 44, pairCap: 26 }, SHELL_CUT)),
      { matOver: { transparent: true, opacity: 0.30 }, noOutline: true });
  }

  return g;
}

/* THE WHOLE MODEL: the embryo complex, then everything outside it. */
function buildDisc(t, opts) {
  opts = opts || {};
  t = Math.max(0, Math.min(1, +t || 0));
  const D = dims(t);
  const g = new T.Group();
  g.userData.model = 'bilaminar-embryonic-disc';
  g.userData.t = t;
  g.userData.day = D.day;
  buildEmbryoComplex(g, D, opts);
  buildOutsideEmbryo(g, D, opts);
  return g;
}


/* ============================================================ the acceptance battery

   Every row below obeys the three rules RENDER-STANDARD section 3 spent three review rounds learning:

   1. A MAGNITUDE FLOOR, never `> 0`. "A SIGN TEST ON A SPATIAL RELATION IS NOT A TEST": a round-3
      finding was a test that asserted the right relation and was satisfied by a value five per cent
      of the structure's own width. Every floor here is a fraction of the relevant extent of the
      structures compared, and separations are measured on the BOUNDING BOX where the claim is about
      edges, on the centroid where it is about position.
   2. A NEGATIVE CASE. Each predicate is fed a deliberately wrong value and must reject it, so a row
      that is satisfiable by anything is caught here rather than by a reviewer.
   3. THE MEASURED SIDE IS READ OFF BUILT GEOMETRY. Boxes come from the real vertices of the real
      meshes; volumes from meshVolume() over the real triangles. No row restates a constant from the
      top of this file. Row H-perturb proves that by changing one and requiring the answer to move.  */

const FLOORS = {
  A_dorsal:        0.35,   // epiblast above hypoblast, as a fraction of the mean y-extent
  B_taller:        2.00,   // epiblast y-extent / hypoblast y-extent (stated cells give 2.5)
  C_amnion_dorsal: 0.35,   // amniotic cavity above the epiblast
  D_yolk_ventral:  0.35,   // yolk sac below the hypoblast
  H_resid:         0.010,  // the three concentric regions must tile the gap to this fraction
  H_move:          0.020,  // a perturbed cell height must move the solved envelope by this fraction
  H1_slack:        0.060,  // rEmb may stand at most this far clear of its own measured envelope
  J_plate_cranial: 0.35,   // prechordal plate's own box, clear of the disc centre, toward +z
  K_stalk_caudal:  0.35,   // connecting stalk's own box, toward -z
  L_plate_reach:   0.90,   // the plate reaches this fraction of the way to the epiblast's floor
  M_plate_taller:  1.60,   // plate y-extent / hypoblast y-extent
  N_mirror:        0.002,  // mirror-symmetry residual in x, as a fraction of the model's x-extent
  CD_edge:         0.002,  // how far a cavity floor may depart from the sheet that forms it, in units of 100 um
  Q_smaller_at_most: 0.60, // the secondary sac, as a fraction of the primary it replaces
  Q_smaller_at_least:0.05, // ...and not vanishing, which would be a different error
  Q_cyst_frag:     0.25,   // the biggest cyst, as a fraction of the secondary sac
};

/* boxes and centroids per key, on the REAL vertices of the REAL meshes, in world space */
function boxesOf(g) {
  g.updateMatrixWorld(true);
  const B = {};
  const v = new T.Vector3();
  g.traverse(function (o) {
    if (!o.isMesh || !o.geometry || (o.userData && o.userData.outline)) return;
    const k = o.userData && o.userData.key; if (!k) return;
    const p = o.geometry.attributes.position; if (!p) return;
    const b = B[k] || (B[k] = { minx: Infinity, maxx: -Infinity, miny: Infinity, maxy: -Infinity,
                                minz: Infinity, maxz: -Infinity, cx: 0, cy: 0, cz: 0, n: 0, vol: 0 });
    for (let i = 0; i < p.count; i++) {
      v.fromBufferAttribute(p, i).applyMatrix4(o.matrixWorld);
      if (v.x < b.minx) b.minx = v.x; if (v.x > b.maxx) b.maxx = v.x;
      if (v.y < b.miny) b.miny = v.y; if (v.y > b.maxy) b.maxy = v.y;
      if (v.z < b.minz) b.minz = v.z; if (v.z > b.maxz) b.maxz = v.z;
      b.cx += v.x; b.cy += v.y; b.cz += v.z; b.n++;
    }
    b.vol += Math.abs(meshVolume(o.geometry));
  });
  for (const k in B) {
    const b = B[k];
    b.ex = b.maxx - b.minx; b.ey = b.maxy - b.miny; b.ez = b.maxz - b.minz;
    b.cx /= b.n; b.cy /= b.n; b.cz /= b.n;
  }
  return B;
}

/* mirror-symmetry residual in x, measured on the vertex cloud rather than asserted from the fact that
   revolve() revolves. For every vertex, the distance to the nearest vertex of the x-negated cloud,
   bucketed so the comparison is O(n): a model with no chiral content must come out at essentially
   zero, and if it does not, something has been placed off-axis and row N must fail. */
function mirrorResidual(g) {
  g.updateMatrixWorld(true);
  const pts = [];
  const v = new T.Vector3();
  /* THE HASH IS BUILT FROM EVERY VERTEX; only the QUERY is subsampled. The first version
     subsampled both, and reported a residual of 0.0606 on a model that is mirror-symmetric by
     construction — because a sample of every n-th vertex is not itself a mirror-symmetric set, so a
     queried point's mirror partner was simply not in the set to be found. The measure was reporting
     its own sampling, which is exactly the "test that cannot measure what it claims" this standard
     is about. */
  const all = [];
  g.traverse(function (o) {
    if (!o.isMesh || !o.geometry || (o.userData && o.userData.outline)) return;
    const p = o.geometry.attributes.position; if (!p) return;
    for (let i = 0; i < p.count; i++) {
      v.fromBufferAttribute(p, i).applyMatrix4(o.matrixWorld);
      all.push([v.x, v.y, v.z]);
    }
  });
  const qstep = Math.max(1, Math.floor(all.length / 4000));
  for (let i = 0; i < all.length; i += qstep) pts.push(all[i]);
  if (!pts.length) return { residual: 0, samples: 0, extent: 0 };
  let minx = Infinity, maxx = -Infinity;
  for (const q of all) { if (q[0] < minx) minx = q[0]; if (q[0] > maxx) maxx = q[0]; }
  const extent = Math.max(1e-9, maxx - minx);
  const CELLSZ = extent / 40;
  const grid = {};
  const kf = (a, b, c) => Math.round(a / CELLSZ) + ':' + Math.round(b / CELLSZ) + ':' + Math.round(c / CELLSZ);
  for (const q of all) { const k = kf(q[0], q[1], q[2]); (grid[k] = grid[k] || []).push(q); }
  let worst = 0;
  for (const q of pts) {
    const m = [-q[0], q[1], q[2]];
    let best = Infinity;
    for (let dx = -1; dx <= 1; dx++) for (let dy = -1; dy <= 1; dy++) for (let dz = -1; dz <= 1; dz++) {
      const cell = grid[kf(m[0] + dx * CELLSZ, m[1] + dy * CELLSZ, m[2] + dz * CELLSZ)];
      if (!cell) continue;
      for (const r of cell) {
        const d = (r[0] - m[0]) ** 2 + (r[1] - m[1]) ** 2 + (r[2] - m[2]) ** 2;
        if (d < best) best = d;
      }
    }
    if (best < Infinity) { const d = Math.sqrt(best); if (d > worst) worst = d; }
  }
  return { residual: worst / extent, worstAbs: worst, samples: pts.length,
           hashed: all.length, extent };
}

/* pairwise containment, RENDER-STANDARD 3.z. Over every pair whose boxes meet, the fraction of A's
   sampled vertices that fall inside B's convex-ish envelope is estimated by ray-cast parity. The
   PARTITION of pairs excluded as construction rather than anatomy is PUBLISHED here, by name. */
const CONTACT_PARTITION = {
  'epiblast|hypoblast': 'apposed sheets sharing one interface plane at y = 0 — this is the relation ' +
    'beat 1 teaches, and the two solids abut rather than overlap',
  'hypoblast|prechordal_plate': 'the plate IS thickened hypoblast and rises out of it; continuous tissue',
  'epiblast|prechordal_plate': 'the plate adheres to the epiblast — that adhesion is what row L measures ' +
    'and what beat 7 narrates as the future mouth',
  'amnion|amniotic_cavity': 'the amnion is the cavity cast\'s own roof',
  'amnion|epiblast': 'the amniotic roof is continuous with the epiblast at the disc rim, where it tapers to nothing',
  'heuser|hypoblast': "Heuser's membrane is hypoblast that crawled out; continuous tissue at the disc rim",
  'heuser|primary_yolk_sac': "the membrane is the primary sac's own wall",
  /* 'heuser|secondary_yolk_sac' WAS HERE AND IS DELETED, NOT REWORDED. Review round 1, finding 2:
     the entry read "the membrane is the secondary sac's own wall", which is anatomically false (see
     the membrane's own note above), and because row P consults this table BY NAME that one line was
     the thing stopping row P from failing on the defect finding 1 is about. A row built to catch two
     structures occupying one space was being quieted by a false excuse. With the membrane now gated
     on the primary sac alone the two are never alive at the same t, so there is no pair left to
     excuse: row P re-reads 0, and it reads 0 because the overlap is gone rather than because it was
     declared away. Deleting rather than rewording is the point — a reworded entry would have kept
     the row quiet for the next run too. */
  'primary_yolk_sac|secondary_yolk_sac': 'during the pinch the second sac is forming INSIDE the first — ' +
    'that overlap is the event beat 5 is about, and it exists only across the replacement window',
  'chorionic_cavity|*': 'the chorionic cavity is a GHOST ENVELOPE meant to contain everything: the disc, ' +
    'both cavities, the yolk sac and the stalk all hang inside it, which is beat 6',
  'cytotrophoblast|*': 'the cytotrophoblast is the conceptus WALL; every structure this model builds ' +
    'lies inside it by definition — RENDER-STANDARD 3.z\'s "ghost envelope that is meant to contain ' +
    'everything", excluded by name rather than by a tolerance',
  'syncytiotrophoblast|*': 'the outermost shell of the conceptus; same reason as the cytotrophoblast',
  'prechordal_plate|primary_yolk_sac': 'the plate is a thickened patch of hypoblast whose dorsal face is ' +
    'held against the epiblast, so its extra height bulges VENTRALLY into the roof of the yolk sac — ' +
    'which is where a tall columnar cell in that position must go',
  'prechordal_plate|secondary_yolk_sac': 'as for the primary sac: the plate bulges into the sac roof',
  'heuser|prechordal_plate': "the plate bulges into the yolk sac through the membrane that is its own roof",
  'exocoelomic_cysts|chorionic_cavity': 'the cysts lie adrift IN the chorionic cavity',
  'exocoelomic_cysts|splanchnic_mesoderm': 'a cyst may lie against the sheet that bounds the cavity it is in',
  'exocoelomic_cysts|somatic_mesoderm': 'a cyst may lie against the sheet that bounds the cavity it is in',
  'exocoelomic_cysts|heuser': 'a cyst left behind by the primary sac may still lie against its old wall',
  'somatic_mesoderm|cytotrophoblast': 'the somatic sheet lines the cytotrophoblast — the first two of the ' +
    "chorion's three layers, apposed by definition",
  'somatic_mesoderm|amnion': 'the somatic sheet covers the amnion; apposed by definition',
  'somatic_mesoderm|amniotic_cavity': 'the sheet lies over the amnion, which is the cavity cast\'s roof',
  'splanchnic_mesoderm|heuser': 'the splanchnic sheet covers the yolk sac wall; apposed by definition',
  'splanchnic_mesoderm|primary_yolk_sac': 'the sheet covers the sac it is wrapped on',
  'splanchnic_mesoderm|secondary_yolk_sac': 'the sheet covers the sac it is wrapped on',
  'connecting_stalk|splanchnic_mesoderm': 'the stalk is continuous with the splanchnic sheet at its ' +
    'embryonic end — a bridge has to be attached at both ends to be a bridge',
  'connecting_stalk|somatic_mesoderm': 'the stalk is continuous with the somatic sheet at its chorionic end',
  'somatic_mesoderm|splanchnic_mesoderm': 'the two caps are ONE sheet split along the equator at y = 0, ' +
    'so they meet along that seam and share no volume — the overlap the probe sees there is surface ' +
    'coincidence, which insideFrac() classifies as contact and reports separately',
  'cytotrophoblast|syncytiotrophoblast': 'apposed trophoblast layers — the outer two of the three the ' +
    'chorion is defined by',
  'extraembryonic_mesoderm|heuser': 'the mesoderm fills the gap OUTSIDE the membrane and is apposed to it',
  'extraembryonic_mesoderm|cytotrophoblast': 'the mesoderm fills the gap up to the cytotrophoblast',
  'extraembryonic_mesoderm|primary_yolk_sac': 'apposed across the membrane',
};
/* THE TABLE IS NORMALISED AT LOAD, NOT TRUSTED TO BE HAND-SORTED. The lookup sorts the pair, so a
   key written the other way round — 'splanchnic_mesoderm|heuser' rather than
   'heuser|splanchnic_mesoderm' — silently excused NOTHING. Six of the entries above were written
   that way and row P reported every one of those pairs as a defect. The row failing loudly was the
   good outcome; the bad one is a reviewer reading the table and believing a pair is declared when
   the code cannot find it. So the normalisation happens once, here, and a wildcard entry keeps its
   shape. */
const _PARTITION = (function () {
  const out = {};
  for (const k in CONTACT_PARTITION) {
    if (k.indexOf('|*') >= 0) { out[k] = CONTACT_PARTITION[k]; continue; }
    out[k.split('|').sort().join('|')] = CONTACT_PARTITION[k];
  }
  return out;
})();
function excused(a, b) {
  const pair = [a, b].sort().join('|');
  if (_PARTITION[pair]) return _PARTITION[pair];
  if (_PARTITION[a + '|*']) return _PARTITION[a + '|*'];
  if (_PARTITION[b + '|*']) return _PARTITION[b + '|*'];
  return null;
}

/* ---------------------------------------------------------------- predicates
   Named, so each can be fed a wrong value for its negative case. */
const PRED = {
  atLeast: (v, f) => v != null && isFinite(v) && v >= f,
  atMost:  (v, f) => v != null && isFinite(v) && v <= f,
  isZero:  (v) => v != null && isFinite(v) && Math.abs(v) < 1e-9,
  positive:(v) => v != null && isFinite(v) && v > 0,
};

function acceptance() {
  const rows = {}, vals = {}, negs = {};
  const row = (id, ok, value, negOk, note) => {
    rows[id] = !!ok; vals[id] = value; negs[id] = !!negOk;
    if (note) (vals[id + '_note'] = note);
  };

  /* --- A, B, C, D, measured at 21 values of t, because the claim is "at EVERY t" --------------- */
  const TS = [];
  for (let i = 0; i <= 20; i++) TS.push(i / 20);
  let aWorst = Infinity, bWorst = Infinity, cWorst = Infinity, dWorst = Infinity;
  let aAt = null, bAt = null, cAt = null, dAt = null;
  let c2Worst = -Infinity, d2Worst = -Infinity;
  const perT = [];
  for (const tt of TS) {
    const g = buildDisc(tt, FULLOPTS());
    const B = boxesOf(g);
    const e = B.epiblast, h = B.hypoblast;
    let aF = null, bF = null, cF = null, dF = null;
    if (e && h) {
      aF = (e.cy - h.cy) / (0.5 * (e.ey + h.ey));
      bF = e.ey / h.ey;
    }
    /* WHICH SIDE A CAVITY IS ON IS A CENTROID CLAIM; WHERE ITS FLOOR SITS IS AN EDGE CLAIM, and the
       first version of these two rows conflated them. It measured (cavity floor - epiblast floor)
       over the MEAN of the two y-extents, so the bigger the amniotic cavity grew the smaller the
       answer got — 1.64 on day 8 and 0.31 on day 14, falling below its own floor exactly as the
       relation it tests became more obvious. Normalising a "which side" claim by the extent of the
       thing making the claim is backwards. So: C is the centroid separation over the mean extent,
       and C2 is the edge statement on its own — the cavity's floor never dips below the epiblast's
       dorsal surface — with a tolerance rather than a floor, because the two surfaces are meant to
       coincide exactly. */
    const ac = B.amniotic_cavity;
    if (ac && e) { cF = (ac.cy - e.cy) / (0.5 * (ac.ey + e.ey));
                   const dip = e.maxy - ac.miny; if (dip > c2Worst) c2Worst = dip; }
    const ys = B.secondary_yolk_sac || B.primary_yolk_sac;
    if (ys && h) { dF = (h.cy - ys.cy) / (0.5 * (ys.ey + h.ey));
                   const rise = ys.maxy - h.miny; if (rise > d2Worst) d2Worst = rise; }
    if (aF != null && aF < aWorst) { aWorst = aF; aAt = tt; }
    if (bF != null && bF < bWorst) { bWorst = bF; bAt = tt; }
    if (cF != null && cF < cWorst) { cWorst = cF; cAt = tt; }
    if (dF != null && dF < dWorst) { dWorst = dF; dAt = tt; }
    perT.push({ t: tt, A: aF, B: bF, C: cF, D: dF });
  }
  row('A_epiblast_is_dorsal', PRED.atLeast(aWorst, FLOORS.A_dorsal), aWorst,
      !PRED.atLeast(0.07, FLOORS.A_dorsal), 'worst over 21 t, at t=' + aAt);
  row('B_epiblast_is_taller', PRED.atLeast(bWorst, FLOORS.B_taller), bWorst,
      !PRED.atLeast(1.05, FLOORS.B_taller), 'worst over 21 t, at t=' + bAt +
      '; derived from ' + CELL.epiblast_um + ' um columnar vs ' + CELL.hypoblast_um + ' um cuboidal');
  row('C_amniotic_cavity_is_dorsal', PRED.atLeast(cWorst, FLOORS.C_amnion_dorsal), cWorst,
      !PRED.atLeast(0.10, FLOORS.C_amnion_dorsal), 'worst over 21 t, at t=' + cAt);
  row('D_yolk_sac_is_ventral', PRED.atLeast(dWorst, FLOORS.D_yolk_ventral), dWorst,
      !PRED.atLeast(0.12, FLOORS.D_yolk_ventral), 'worst over 21 t, at t=' + dAt);
  row('C2_amniotic_floor_never_dips_into_epiblast', PRED.atMost(c2Worst, FLOORS.CD_edge), c2Worst,
      !PRED.atMost(0.05, FLOORS.CD_edge),
      'worst (epiblast max y - cavity min y) over 21 t, in units of 100 um — the cavity FLOOR is the ' +
      'epiblast\'s dorsal surface, so this is meant to be zero');
  row('D2_yolk_roof_never_rises_into_hypoblast', PRED.atMost(d2Worst, FLOORS.CD_edge), d2Worst,
      !PRED.atMost(0.05, FLOORS.CD_edge),
      'worst (yolk sac max y - hypoblast min y) over 21 t — the sac ROOF is the hypoblast\'s ventral surface');

  /* --- H1: the solved envelope clears the embryo, AND is tight -------------------------------
     Two-sided on purpose. A one-sided "nothing sticks out" test is passed by any large enough
     number, and a safe huge rEmb would push the chorion out to nowhere while the row stayed green.
     Checked over 21 t, because the amnion grows and the yolk sac is replaced, so which part is the
     furthest-out one CHANGES as t advances. */
  let h1Short = -Infinity, h1Slack = -Infinity, h1At = null;
  for (const tt of TS) {
    const Dt = dims(tt);
    const E = embEnvelopeAt(Dt);
    if (!(E.maxRadius > 0)) continue;
    const short = (E.maxRadius - E.rEmb) / E.maxRadius;              // >0 means something sticks out
    const slack = (E.rEmb - E.maxRadius) / E.maxRadius;              // how much clearance, as a fraction
    if (short > h1Short) { h1Short = short; h1At = tt; }
    if (slack > h1Slack) h1Slack = slack;
  }
  /* H1 IS REPORTED, NOT ASSERTED, AND THAT IS THE HONEST TREATMENT. It was first written as a row:
     "nothing of the embryo complex lies outside rEmb, and rEmb is tight". Both halves are true and
     NEITHER CAN FAIL, because rEmb is defined as 1.04 x this very measurement — the row would have
     been checking its own definition, which is exactly the "test that cannot fail is not evidence"
     RENDER-STANDARD spends a whole rule on. Rather than dress it up with a floor, it is published
     here as a diagnostic and the weight is carried by the two rows that are not circular: row P,
     which measures the embryo's parts against the mesoderm AS BUILT and would catch a part the
     envelope failed to account for, and row H3, which perturbs a cell height and requires rEmb to
     follow. */
  const envelopeDiagnostic = { worstProtrusionFrac: h1Short, worstSlackFrac: h1Slack, at: h1At,
    reported_not_asserted: 'rEmb is defined as EMB_MARGIN x this measurement, so asserting it would ' +
      'be circular; rows P and H3 are what make it checkable' };

  /* --- H2: the three regions TILE the gap — no tissue double-counted, none lost ---------------- */
  const D1 = dims(1);
  const E1 = embEnvelopeAt(D1), h1 = hMeso();
  const vLin = Math.abs(meshVolume(somaticLiningGeo(D1, h1)));
  const vCap = Math.abs(meshVolume(somaticCapGeo(D1, h1, E1.rEmb)));
  const vSpl = Math.abs(meshVolume(splanchnicCapGeo(D1, h1, E1.rEmb)));
  const vCav = Math.abs(meshVolume(chorionicCavityGeo(D1, h1, E1.rEmb)));
  const vGap = Math.abs(meshVolume(mesodermFullGeo(D1, E1.rEmb)));
  const tileResid = vGap > 0 ? Math.abs((vLin + vCap + vSpl + vCav) - vGap) / vGap : null;
  row('H2_gap_is_fully_partitioned', PRED.atMost(tileResid, FLOORS.H_resid), tileResid,
      !PRED.atMost(0.30, FLOORS.H_resid),
      'V(lining)+V(somatic cap)+V(splanchnic cap)+V(cavity) = ' +
      (vLin + vCap + vSpl + vCav).toFixed(4) + ' against V(whole gap) = ' + vGap.toFixed(4) +
      ' — a CONSTRUCTION closure check, not a biological conservation claim');

  /* --- H3: the perturbation. Change a cell height and require the SOLVED envelope to move. ------
     This is the row that proves the measured side is a function of the built geometry rather than
     of the constants above: the amniotic roof's own thickness is altered, the complex is rebuilt,
     and rEmb must follow. If it did not, every row here would be measuring arithmetic. */
  const beforeUm = CELL.amnioblast_um;
  const rBefore = embEnvelopeAt(dims(1)).rEmb;
  CELL.amnioblast_um = beforeUm + 25;
  const rAfter = embEnvelopeAt(dims(1)).rEmb;
  CELL.amnioblast_um = beforeUm;
  const rRestored = embEnvelopeAt(dims(1)).rEmb;
  const moved = rBefore > 0 ? Math.abs(rAfter - rBefore) / rBefore : null;
  row('H3_perturb_envelope_responds',
      PRED.atLeast(moved, FLOORS.H_move) && Math.abs(rRestored - rBefore) < 1e-12, moved,
      !PRED.atLeast(0.0001, FLOORS.H_move),
      'amnioblast_um ' + beforeUm + ' -> ' + (beforeUm + 25) + ' moves rEmb ' + rBefore.toFixed(5) +
      ' -> ' + rAfter.toFixed(5) + ', and restores exactly');

  /* --- J, K: the cranio-caudal axis exists, and the two features sit at opposite ends ---------- */
  const g1 = buildDisc(1, FULLOPTS());
  const B1 = boxesOf(g1);
  const pl = B1.prechordal_plate, st = B1.connecting_stalk, di = B1.epiblast;
  let jF = null, kF = null, jkF = null;
  /* BOX, not centroid: the claim is about an EDGE — how far toward the cranial margin the patch
     sits. Normalised by the disc's RADIUS, not its diameter: the first version divided by the full
     z-extent, which halves every answer and made a patch sitting squarely in the cranial third read
     as 0.14. The relevant extent for "how far out toward the edge" is the distance to that edge. */
  if (pl && di) jF = pl.minz / (0.5 * di.ez);
  if (st && di) kF = (-st.maxz) / (0.5 * di.ez);
  if (pl && st) jkF = (pl.cz - st.cz) / (0.5 * (pl.ez + st.ez));
  row('J_prechordal_plate_is_cranial', PRED.atLeast(jF, FLOORS.J_plate_cranial), jF,
      !PRED.atLeast(0.05, FLOORS.J_plate_cranial), 'plate box min z, over the disc RADIUS');
  row('K_connecting_stalk_is_caudal', PRED.atLeast(kF, FLOORS.K_stalk_caudal), kF,
      !PRED.atLeast(0.05, FLOORS.K_stalk_caudal), 'stalk box max z, over the disc RADIUS');
  row('K2_plate_and_stalk_are_opposite_ends', PRED.atLeast(jkF, 1.0), jkF,
      !PRED.atLeast(0.20, 1.0), 'separation over mean z-extent — they must not merely differ, they must be apart');

  /* --- L, M: the plate reaches the epiblast and is taller than ordinary hypoblast -------------- */
  let lF = null, mF = null;
  if (pl && B1.hypoblast && B1.epiblast) {
    const floorY = B1.hypoblast.miny, epiFloor = B1.epiblast.miny;
    lF = (pl.maxy - floorY) / (epiFloor - floorY);
    mF = pl.ey / B1.hypoblast.ey;
  }
  row('L_plate_adheres_to_epiblast', PRED.atLeast(lF, FLOORS.L_plate_reach), lF,
      !PRED.atLeast(0.40, FLOORS.L_plate_reach), 'plate box max y as a fraction of the gap up to the epiblast floor');
  row('M_plate_is_tall_columnar', PRED.atLeast(mF, FLOORS.M_plate_taller), mF,
      !PRED.atLeast(1.10, FLOORS.M_plate_taller), 'plate y-extent over hypoblast y-extent');

  /* --- N: this model has NO chiral content, so it cannot witness a side -------------------------
     The row does not prove the declared axes. It proves the OPPOSITE, and that is the honest
     measurement available: the vertex cloud is its own mirror image in x to within the floor, so
     flipping the declared sign of x would change no picture and no row. RENDER-STANDARD requires
     that consequence to be carried in the scene's gaps[] rather than left to a comment, and it is:
     no narration claim in this scene names a side. */
  const mir = mirrorResidual(g1);
  row('N_model_is_mirror_symmetric_in_x', PRED.atMost(mir.residual, FLOORS.N_mirror), mir.residual,
      !PRED.atMost(0.25, FLOORS.N_mirror),
      'worst nearest-neighbour distance to the x-negated cloud over ' + mir.samples +
      ' samples, as a fraction of the x-extent — so NO narration claim may name a side');

  /* --- P: no two solids share space, excluding the published partition -------------------------
     MEASURED BY RAY PARITY, NOT BY BOX OVERLAP. The first version of this row compared bounding
     boxes and reported 37 offending pairs on a model with (as it turned out) none: every part here
     is a solid of revolution, and a spherical SHELL's bounding box is the whole sphere's, so the
     cytotrophoblast's box contains every structure in the conceptus while its wall contains nothing
     at all. A box test on nested shells does not measure containment, it measures nesting. So each
     part's own vertices are cast against the other part's triangles and counted odd/even, which is
     the question 3.z actually asks: does a vertex of A lie INSIDE the solid B. */
  const pPairs = [];
  const keys = Object.keys(B1);
  const meshesByKey = {};
  g1.traverse(function (o) {
    if (!o.isMesh || !o.geometry || (o.userData && o.userData.outline)) return;
    const k = o.userData && o.userData.key; if (!k) return;
    (meshesByKey[k] = meshesByKey[k] || []).push(o);
  });
  const _rc = new T.Raycaster();
  _rc.firstHitOnly = false;
  const DIRS = [new T.Vector3(0.4472, 0.7746, 0.4472), new T.Vector3(-0.8018, 0.2673, 0.5345)];
  function insideFrac(aKey, bKey) {
    const av = [];
    const v = new T.Vector3();
    for (const o of (meshesByKey[aKey] || [])) {
      const p = o.geometry.attributes.position;
      const step = Math.max(1, Math.floor(p.count / 40));
      for (let i = 0; i < p.count; i += step) av.push(v.fromBufferAttribute(p, i).applyMatrix4(o.matrixWorld).clone());
    }
    const bt = meshesByKey[bKey] || [];
    if (!av.length || !bt.length) return 0;
    let inside = 0, onSurface = 0;
    const EPS = 0.004;                 // 0.4 um — well under any sheet in this model
    for (const q of av) {
      /* A VERTEX LYING ON B'S SURFACE IS CONTACT, NOT CONTAINMENT, and ray parity cannot tell the
         two apart — which is RENDER-STANDARD's "A PROBE WITH A DEGENERATE CASE MUST REPORT THE
         DEGENERACY" arriving in this row. Three surfaces in this model coincide exactly by
         construction: the hypoblast's ventral face IS the yolk sac's roof, the amniotic cavity's
         floor IS the epiblast's dorsal face, and the somatic and splanchnic caps meet along the
         equator at y = 0. Parity at such a point is a coin toss, and it reported 9.8% of the
         hypoblast as inside the yolk sac. So a point within EPS of B's surface is counted as ON it
         and reported separately; it is never counted as inside.
         Two ray directions, and a point counts as inside only if BOTH agree: one ray grazing an
         edge gives an odd count on a surface it never entered. */
      let votes = 0, grazed = false;
      for (const d of DIRS) {
        _rc.set(q, d);
        const hits = _rc.intersectObjects(bt, false);
        if (hits.length && hits[0].distance < EPS) { grazed = true; break; }
        if (hits.length % 2 === 1) votes++;
      }
      if (grazed) { onSurface++; continue; }
      if (votes === DIRS.length) inside++;
    }
    return { inside: inside / av.length, onSurface: onSurface / av.length, samples: av.length };
  }
  for (let i = 0; i < keys.length; i++) for (let j = i + 1; j < keys.length; j++) {
    const a = keys[i], b = keys[j], A = B1[a], Bb = B1[b];
    const meet = A.minx <= Bb.maxx && A.maxx >= Bb.minx && A.miny <= Bb.maxy && A.maxy >= Bb.miny &&
                 A.minz <= Bb.maxz && A.maxz >= Bb.minz;
    if (!meet) continue;
    const why = excused(a, b);
    if (why) { pPairs.push({ a, b, excused: true, why, measured: false }); continue; }
    const fab = insideFrac(a, b), fba = insideFrac(b, a);
    pPairs.push({ a, b, excused: false, why: null, measured: true,
                  aInsideB: fab.inside, bInsideA: fba.inside,
                  aOnSurfaceOfB: fab.onSurface, bOnSurfaceOfA: fba.onSurface,
                  worst: Math.max(fab.inside, fba.inside) });
  }
  const unexcused = pPairs.filter(q => q.measured && q.worst > 0.02);
  /* the predicate is "the count is zero"; its negative case feeds it a count of ONE and requires
     rejection, which is what stops a row that would pass on anything. */
  const pPred = n => n === 0;
  row('P_no_unexcused_shared_space', pPred(unexcused.length), unexcused.length, !pPred(1),
      unexcused.length ? JSON.stringify(unexcused.slice(0, 6)) : 'all overlapping pairs are in the published partition');

  /* --- O: EVERY SOLID'S SIGNED VOLUME IS POSITIVE ---------------------------------------------
     The row that would have caught the winding inversion above, and did not exist when the
     inversion was written. Every volume this file measures went through Math.abs(), so a globally
     inward-wound model produced identical numbers to a correct one and rows H2 and Q passed on it.
     abs() was hiding the cardinal bug from the battery built to find it. The divergence theorem's
     sign IS the orientation, so it is asserted here, unsigned, over every mesh at four values of t. */
  let oWorst = Infinity, oWorstKey = null, oWorstAt = null, oCount = 0;
  for (const tt of [0, 0.5, 2 / 3, 1]) {
    const gg = buildDisc(tt, FULLOPTS());
    gg.traverse(function (o) {
      if (!o.isMesh || !o.geometry || (o.userData && o.userData.outline)) return;
      const geo = o.geometry.index ? o.geometry.toNonIndexed() : o.geometry;
      const vv = meshVolume(geo);
      oCount++;
      if (vv < oWorst) { oWorst = vv; oWorstKey = o.userData.key; oWorstAt = tt; }
    });
  }
  row('O_signed_volumes_are_positive', PRED.atLeast(oWorst, 0), oWorst,
      !PRED.atLeast(-0.001, 0),
      'least signed volume over ' + oCount + ' meshes at four t is ' + oWorst.toExponential(3) +
      ' (' + oWorstKey + ' at t=' + oWorstAt + '); a NEGATIVE value means the mesh is wound inward');

  /* --- Q: the primary sac's tissue is accounted for, not vanished ------------------------------ */
  const gq = buildDisc(0.90, FULLOPTS());
  const Bq = boxesOf(gq);
  const gp = buildDisc((12 - 8) / 6, FULLOPTS());   // the pinch, on day 12
  const Bp = boxesOf(gp);
  const vPrim = Bp.primary_yolk_sac ? Bp.primary_yolk_sac.vol : 0;
  const vSec = Bq.secondary_yolk_sac ? Bq.secondary_yolk_sac.vol : 0;
  const vCy = Bq.exocoelomic_cysts ? Bq.exocoelomic_cysts.vol : 0;
  /* WHAT THIS ROW USED TO CLAIM, AND WHY IT WAS WITHDRAWN. It first asserted a volume BUDGET —
     V(secondary) + V(cysts) >= 0.45 x V(primary) — on the reasoning that the primary sac's tissue
     should be accounted for rather than vanish. Measured, it came out at 0.154, and the right
     response was not to lower the floor: the claim is false. The primary yolk sac is largely SHED,
     not redistributed, and the narration says only that "fragments of the primary sac are left as
     exocoelomic cysts". A conservation row here would have been a false biological claim dressed up
     as a solve, which is precisely what RENDER-STANDARD's "AN ACCEPTANCE MEASUREMENT MUST BE A
     FUNCTION OF THE BUILT GEOMETRY" note warns a floor and a negative case cannot protect against.
     The mesoderm split IS a split and IS conserved (row H); this is not, and now says so.
     What is left is what is both true and examinable: the replacement sac is substantially smaller
     than the sac it replaces, and the cysts are fragments rather than sacs. */
  const qF = vPrim > 0 ? vSec / vPrim : null;
  row('Q_secondary_sac_is_smaller_than_the_primary',
      PRED.atMost(qF, FLOORS.Q_smaller_at_most) && PRED.atLeast(qF, FLOORS.Q_smaller_at_least), qF,
      !PRED.atMost(0.90, FLOORS.Q_smaller_at_most),
      'V(secondary at t=0.90) / V(primary at the pinch) = ' + vSec.toFixed(4) + ' / ' + vPrim.toFixed(4) +
      ' — must be well under 1 (it replaces a bigger sac) and not vanishing');
  /* the cysts are FRAGMENTS: several of them, each small beside the sac that replaced the primary */
  let cystN = 0, cystBiggest = 0;
  gq.traverse(function (o) {
    if (!o.isMesh || !o.userData || o.userData.key !== 'exocoelomic_cysts' || o.userData.outline) return;
    cystN++;
    const vv = Math.abs(meshVolume(o.geometry.index ? o.geometry.toNonIndexed() : o.geometry));
    if (vv > cystBiggest) cystBiggest = vv;
  });
  const qc = vSec > 0 ? cystBiggest / vSec : null;
  row('Q2_cysts_are_fragments', cystN >= 2 && PRED.atMost(qc, FLOORS.Q_cyst_frag), qc,
      !PRED.atMost(0.80, FLOORS.Q_cyst_frag),
      cystN + ' cysts; the largest is ' + (qc == null ? 'n/a' : (qc * 100).toFixed(2) + '%') +
      ' of the secondary sac by volume — a scrap, not a sac');

  /* --- R: the staging is real — things are absent before their day and present after ----------- */
  const stages = {};
  /* EACH NAMED DAY IS BUILT AT ITS OWN DAY. The first version used the WHEN.* ramp STARTS as the t
     for each day — so "day 11" was built at t = WHEN.mesoderm, the instant the mesoderm ramp begins
     and is therefore still zero, and the row reported that the mesoderm does not appear on day 11 on
     a model that builds it there perfectly well. The row was measuring the ramp's own start, not the
     day. tOfDay is the only thing that should turn a narrated day into a t. */
  const tOf = d => (d - 8) / 6;
  for (const [nm, tt] of [['day8', tOf(8)], ['day9', tOf(9)], ['day11', tOf(11)],
                          ['day12', tOf(12)], ['day14', tOf(14)]]) {
    const B = boxesOf(buildDisc(tt, FULLOPTS()));
    stages[nm] = Object.keys(B).sort();
  }
  const R1 = stages.day8.indexOf('primary_yolk_sac') < 0 && stages.day9.indexOf('primary_yolk_sac') >= 0;
  const R2 = stages.day9.indexOf('extraembryonic_mesoderm') < 0 &&
             (stages.day11.indexOf('extraembryonic_mesoderm') >= 0 || stages.day11.indexOf('somatic_mesoderm') >= 0);
  const R3 = stages.day11.indexOf('secondary_yolk_sac') < 0 && stages.day14.indexOf('secondary_yolk_sac') >= 0;
  const R4 = stages.day12.indexOf('prechordal_plate') < 0 && stages.day14.indexOf('prechordal_plate') >= 0;
  const R5 = stages.day14.indexOf('primary_yolk_sac') < 0;
  const R6 = stages.day9.indexOf('chorionic_cavity') < 0 && stages.day14.indexOf('chorionic_cavity') >= 0;
  const rPred = cl => cl.every(Boolean);
  row('R_staging_is_real', rPred([R1, R2, R3, R4, R5, R6]),
      { primary_appears_day9: R1, mesoderm_appears_day11: R2, secondary_appears_after_day11: R3,
        plate_appears_after_day12: R4, primary_gone_by_day14: R5, chorionic_cavity_opens: R6 },
      !rPred([R1, R2, R3, R4, R5, false]),
      'each clause is an absence BEFORE and a presence AFTER, so a part that is always on fails it');

  const allPass = Object.keys(rows).every(k => rows[k]);
  const allNeg = Object.keys(negs).every(k => negs[k]);
  return { pass: rows, values: vals, negatives: negs, allPass, allNegativesReject: allNeg,
           perT, pairs: pPairs, envelope: E1, envelopeDiagnostic, mirror: mir, stages,
           volumes: { lining: vLin, somaticCap: vCap, splanchnicCap: vSpl, cavity: vCav, gap: vGap },
           floors: FLOORS, units: '1 unit = 100 um', cells: CELL,
           axes: '+y dorsal, -y ventral, +z cranial, -z caudal, x = left/right WITH NO CONTENT' };
}

function FULLOPTS() {
  return { amnion: true, cavities: true, yolk: true, mesoderm: true, trophoblast: true };
}

/* ===================================== the beat-claim vocabulary (claimMeasure)

   RENDER-STANDARD: "A TIME-VARYING SCENE CHECKS ITS OWN NARRATION AGAINST THE MODEL, BEAT BY BEAT."
   tools/check-beat-claims.mjs asks a model for a named measure as a pure function of t, evaluates
   each view's claims at THAT VIEW'S OWN SET_STAGE t, then displaces the beat and requires at least
   one claim to stop being true. Every measure below is read off BUILT GEOMETRY — boxes from real
   vertices, volumes from real triangles — never from the constants above, so a claim cannot be
   satisfied by the author doing the arithmetic twice.

   Memoised per t because the tool evaluates five displacements per beat and each build is real. */

const _boxCache = {};
function boxesAt(t) {
  const key = (+t).toFixed(6);
  if (!_boxCache[key]) _boxCache[key] = boxesOf(buildDisc(+t, FULLOPTS()));
  return _boxCache[key];
}

const MESO_SHEETS = ['somatic_mesoderm', 'splanchnic_mesoderm'];

function claimMeasure(name, t) {
  const B = boxesAt(t);
  const path = name.split('.');
  const head = path[0], key = path[1];
  const b = key ? B[key] : null;
  switch (head) {
    case 'day':    return 8 + 6 * (+t);
    /* 1 when the model builds that part at this t, 0 when it does not. This is the measure that pins
       a staged beat: a part that is absent before its day and present after it cannot be true at two
       displaced instants as well as its own. */
    case 'exists': return b ? 1 : 0;
    case 'vol':    return b ? b.vol : 0;
    case 'ex':     return b ? b.ex : 0;
    case 'ey':     return b ? b.ey : 0;
    case 'ez':     return b ? b.ez : 0;
    case 'cx':     return b ? b.cx : NaN;
    case 'cy':     return b ? b.cy : NaN;
    case 'cz':     return b ? b.cz : NaN;
    case 'miny':   return b ? b.miny : NaN;
    case 'maxy':   return b ? b.maxy : NaN;
    case 'minz':   return b ? b.minz : NaN;
    case 'maxz':   return b ? b.maxz : NaN;
    /* the disc's width across, in MILLIMETRES, measured on the epiblast's own vertices. 1 unit is
       100 um, so this is the figure the narration quotes, and because the disc grows monotonically
       it is also what pins a beat that is otherwise about a relation rather than an instant. */
    case 'discWidth_mm': return B.epiblast ? B.epiblast.ex * 0.1 : NaN;
    case 'conceptusWidth_mm': return B.syncytiotrophoblast ? B.syncytiotrophoblast.ex * 0.1 : NaN;
    case 'ratio': {
      /* HOW BIG THE CHORIONIC CAVITY IS BESIDE THE THING HANGING IN IT. Beat 7's claim first said
         this as an absolute volume with a floor of 100 model units, and when the shells were built
         sectioned the cavity cast halved and the claim failed at 67.4 — correctly, because an
         absolute number in model units was never what "a cavity big enough to hang in" means. It is
         a RELATION, so it is measured as one, against the volume of the embryo complex that hangs
         inside it. That is also section-proof in the way that matters: cut or whole, the cavity
         stays an order of magnitude bigger than its occupant. */
      if (key === 'cavity_over_embryo') {
        const cav = B.chorionic_cavity ? B.chorionic_cavity.vol : 0;
        let emb = 0;
        for (const k of ['epiblast', 'hypoblast', 'prechordal_plate', 'amniotic_cavity',
                         'primary_yolk_sac', 'secondary_yolk_sac']) if (B[k]) emb += B[k].vol;
        return emb > 0 ? cav / emb : NaN;
      }
      if (key === 'epiblast_over_hypoblast')
        return (B.epiblast && B.hypoblast) ? B.epiblast.ey / B.hypoblast.ey : NaN;
      if (key === 'plate_over_hypoblast')
        return (B.prechordal_plate && B.hypoblast) ? B.prechordal_plate.ey / B.hypoblast.ey : NaN;
      if (key === 'secondary_over_primary')
        return (B.secondary_yolk_sac && B.primary_yolk_sac)
          ? B.secondary_yolk_sac.vol / B.primary_yolk_sac.vol : NaN;
      break;
    }
    case 'frac': {
      if (key === 'epiblast_above_hypoblast')
        return (B.epiblast && B.hypoblast)
          ? (B.epiblast.cy - B.hypoblast.cy) / (0.5 * (B.epiblast.ey + B.hypoblast.ey)) : NaN;
      if (key === 'amnioticCavity_above_epiblast')
        return (B.amniotic_cavity && B.epiblast)
          ? (B.amniotic_cavity.miny - B.epiblast.miny) / (0.5 * (B.amniotic_cavity.ey + B.epiblast.ey)) : NaN;
      if (key === 'yolkSac_below_hypoblast') {
        const ys = B.secondary_yolk_sac || B.primary_yolk_sac;
        return (ys && B.hypoblast)
          ? (B.hypoblast.cy - ys.cy) / (0.5 * (ys.ey + B.hypoblast.ey)) : NaN;
      }
      if (key === 'plate_reaches_epiblast')
        return (B.prechordal_plate && B.hypoblast && B.epiblast)
          ? (B.prechordal_plate.maxy - B.hypoblast.miny) / (B.epiblast.miny - B.hypoblast.miny) : NaN;
      break;
    }
    /* HOW MANY DISTINCT MESODERM SHEETS THE MODEL BUILDS AT THIS t. 0 before day 11, 1 while it is
       one loose tissue filling the gap, 2 once it has split into somatic and splanchnic. This is the
       measure beat 5's narration is actually about, and it is counted off the built group rather than
       inferred from a date. */
    case 'sheets': {
      if (key === 'count') {
        let n = 0;
        for (const k of MESO_SHEETS) if (B[k]) n++;
        if (n === 0 && B.extraembryonic_mesoderm) n = 1;
        return n;
      }
      break;
    }
    /* the SOLVED envelope of the embryo complex, so a beat can claim the mesoderm stands clear of
       the embryo and have it checked rather than asserted */
    case 'envelope': {
      const E = embEnvelopeAt(dims(+t));
      if (key === 'rEmb') return E.rEmb;
      if (key === 'maxRadius') return E.maxRadius;
      if (key === 'clearance') return E.rEmb - E.maxRadius;
      break;
    }
    /* how many separate cyst solids are built — a count off the group, not off the spots table */
    case 'cystCount': {
      let n = 0;
      const g = buildDisc(+t, FULLOPTS());
      g.traverse(function (o) {
        if (o.isMesh && o.userData && o.userData.key === 'exocoelomic_cysts' && !o.userData.outline) n++;
      });
      return n;
    }
  }
  throw new Error('unknown measure: ' + name);
}

/* ------------------------------------------------------------ the provider contract */
window.MB3D_MODELS = window.MB3D_MODELS || {};
window.MB3D_MODELS['bilaminar-embryonic-disc'] = {
  LAYERS: LAYERS,
  build: buildDisc,
  /* Every optional layer on. Without this the provider builds only the defaults and any structure
     behind a flag comes back as reason:'none' — which the player shows a student as "there is no
     model of this structure", a confident lie about a model sitting right there. */
  FULL: FULLOPTS(),
  VARIANTS: {},
  ACCEPTANCE: FLOORS,
  FLOORS: FLOORS,
  WHEN: WHEN,
  CELL: CELL,
  acceptance: acceptance,
  claimMeasure: claimMeasure,
  dims: dims,
  envelope: function (t) { return embEnvelopeAt(dims(t)); },
  boxes: function (t, opts) { return boxesOf(buildDisc(t, Object.assign(FULLOPTS(), opts || {}))); },
  volumeOf: meshVolume,
  CONTACT_PARTITION: CONTACT_PARTITION,
  /* t <-> day, exposed so the scene's beats and this model cannot drift apart about what day a t is */
  dayOf: function (t) { return 8 + 6 * t; },
  tOfDay: function (d) { return (d - 8) / 6; },
};

})();
