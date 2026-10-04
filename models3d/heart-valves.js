/* MedBank · heart valves — PRODUCTION procedural model.
 *
 * Registers itself as MB3D_MODELS['heart-valves'].  t is ONE CARDIAC CYCLE, 0 -> 1, 0.80 s, starting
 * at the P wave, so it shares its clock with models3d/cardiac-cycle-pumping.js and the two scenes
 * cannot drift out of agreement about when a valve is open.
 *
 * WHY PROCEDURAL, CHECKED RATHER THAN ASSUMED.  The queue item says "candidate_meshes: 1".  The
 * catalog actually name-matches SEVEN: mitral valve (FMA7235), tricuspid valve (FMA7234), pulmonary
 * valve (FMA7246) and four papillary muscles.  So the count in the queue is wrong, and it is wrong in
 * the direction that matters — it under-reports.  It is still not the answer.  Every one of those
 * meshes is a SCAN OF ONE INSTANT: a valve frozen in whatever configuration the cadaver was fixed in.
 * The curriculum entry for this structure reads "opening/closing during the cycle".  There is no scan
 * of an opening, and there is no aortic valve mesh in the catalog at all, so a mesh scene could not
 * even show the four valves side by side.  RENDER-STANDARD section 5: procedural belongs where the
 * form is a function of something, and here it is a function of time.
 *
 * ================================ WHAT IS SOLVED, AND WHY THAT ONE ============================
 *
 * RENDER-STANDARD: "ask which number a student would be marked wrong for, and solve THAT one against
 * a stated constraint."  For a valve that number is not a timing and it is not a diameter.  It is
 * COMPETENCE — whether the leaflets meet.  Every valve lesion in the syllabus is a failure of it:
 * chordae too long -> prolapse, chordae tethered -> restriction, annulus dilated -> the leaflets no
 * longer reach, cusp too short -> regurgitation.  So the geometry states the anatomy a textbook
 * states, and SOLVES the closure:
 *
 *   AV valves.  Stated: annulus radius, leaflet lengths, papillary tip position, marginal chordal
 *   length.  Solved by bisection: WHERE the leaflets meet — the coaptation point's depth below the
 *   annular plane and its offset across the annulus — from two conditions that are physics, not
 *   choice.  (1) the marginal chordae are exactly taut at closure, and (2) the two leaflets are
 *   equally taut, which is what puts the coaptation line where it is.  The depth and the offset are
 *   then PREDICTIONS: nothing aims at them, and they are checked against the textbook tenting depth
 *   and against the fact that the mitral coaptation line sits POSTERIOR to the annular centre.
 *
 *   Semilunar valves.  Stated: annulus radius, cusp crown height, nodule sag.  Solved: how far the
 *   cusp must stand PROUD of the annulus radius when it opens, from the one constraint a sheet of
 *   collagen cannot break — it does not stretch.  The answer is the radius the sinus of Valsalva has
 *   to have, and it is a prediction that can fail: a valve in a plain tube cannot open.
 *
 *   Both leaflets and cusps.  At EVERY t the surface's meridional length is re-solved by bisection so
 *   that it equals the stated anatomical length.  The leaflet does not stretch as it moves; it
 *   billows.  That is asserted at twelve values of t rather than assumed.
 *
 * ================================ AXES ========================================================
 *
 * Declared machine-readably in AXES below and asserted in acceptance().  RENDER-STANDARD: "a model
 * states its axis convention in a machine-readable field and the check asserts it, because a comment
 * is not checked by anything."   +x = patient's LEFT,  +y = CRANIAL,  +z = VENTRAL (anterior).
 * Units are CENTIMETRES, the same as cardiac-cycle-pumping.js.
 *
 * NOTE THE CONFLICT, because it is real and it is not this model's to fix.  model3d-scene-spec-v2.md
 * maps a named plane to a CROSS_SECTION axis from the BodyParts3D convention (LPS: +X left, +Y
 * POSTERIOR, +Z SUPERIOR).  The procedural corpus is not LPS — RENDER-STANDARD fixes +y cranial and
 * +z ventral — so on a procedural model an axial cut is normal to y and a coronal cut normal to z,
 * which is not what the spec's table says.  validate-scenes warns on the mismatch whenever a beat's
 * narration names a plane.  Recorded in BUILD-LOG.md; the scene avoids the plane words in the beats
 * that cut, rather than shipping a warning that a later run would learn to ignore.
 */

(function () {
  const T = window.THREE, K = window.VizKit;

  const AXES = { right: '-x', left: '+x', cranial: '+y', caudal: '-y', ventral: '+z', dorsal: '-z',
                 units: 'cm', t: 'one cardiac cycle, 0.80 s, t=0 at the P wave' };

  /* ============================================================ 1 · STATED ANATOMY

     Everything in this block is a textbook number a student is examined on.  Nothing below it is a
     dial: every other length in the file is derived from these.                                   */

  const CYCLE_S = 0.80;

  const STATED = {
    /* Annulus radii, cm.  The ORDER is the examinable fact — tricuspid > mitral > pulmonary > aortic
       — and acceptance asserts the order, not just the numbers. */
    annulus: { tricuspid: 1.75, mitral: 1.50, pulmonary: 1.25, aortic: 1.15 },

    mitral: {
      /* radial length, annulus to free edge, at the middle of each leaflet */
      lenAnterior: 2.30, lenPosterior: 1.30,
      /* the anterior leaflet takes about a third of the annular circumference; the commissures sit at
         the ends of that arc, and the papillary muscles sit beneath the commissures */
      anteriorArcDeg: 120,
      papDepth: 2.10,        // annular plane to papillary tip, at closure
      papRadius: 0.85,       // papillary tip distance from the valve axis
      chordaeMarginal: 1.85, // marginal chordal length, mid-leaflet
      areaOpen: 5.00         // mitral valve area, cm^2
    },

    tricuspid: {
      lenAnterior: 2.30, lenPosterior: 2.05, lenSeptal: 1.85,
      /* THE SEPTAL LEAFLET HINGES LOWER THAN THE MITRAL'S ANTERIOR LEAFLET.  This offset is why the
         two AV valves are not at the same level; losing it is an atrioventricular septal defect and
         exaggerating it is Ebstein's anomaly.  Stated here in cm below the tricuspid annular plane. */
      septalOffset: 0.50,
      arcDeg: { septal: 110, anterior: 130, posterior: 120 },
      papDepth: 2.10, papRadius: 0.95,
      papDepthSeptal: 1.10,  // the septal papillary muscle (of Lancisi) is short and arises high
      chordaeMarginal: 1.55,
      areaOpen: 7.00
    },

    /* Semilunar valves.  `crown` is the height of the hinge line's dip from commissure to nadir —
       the attachment is a crown, not a ring, and that is examined.  `sag` is how far the nodule of
       Arantius sits below the commissural (sinotubular) plane at closure. */
    aortic:    { crown: 1.30, sag: 0.48, areaOpen: 3.80 },
    pulmonary: { crown: 1.35, sag: 0.50, areaOpen: 4.20 },

    /* Valve events, as fractions of the cycle.  Textbook durations for a 0.80 s cycle; the RIGHT-SIDED
       valve leads on opening and lags on closing, which is the whole of S1 and S2 splitting and is
       examined every year. */
    events: {
      mitralClose: 0.210, tricuspidClose: 0.235,       // M1 then T1  -> S1
      pulmonaryOpen: 0.262, aorticOpen: 0.270,
      aorticClose: 0.550, pulmonaryClose: 0.5875,      // A2 then P2  -> S2
      tricuspidOpen: 0.616, mitralOpen: 0.635
    },
    /* How long a leaflet takes to travel from fully open to fully shut, seconds.
       0.035 first, and acceptance row W refused it: the RIGHT heart's isovolumetric contraction is
       genuinely short — the right ventricle only has to beat 10 mmHg, not 80 — so at 0.035 s the
       tricuspid was still travelling when the pulmonary valve began to crack, and for about 20 ms the
       right atrium and the pulmonary trunk were open to each other through a chamber.  That is a
       shunt, not a heart.  20 ms is also the better number: a leaflet crosses in about that. */
    excursion_s: 0.020
  };

  /* ============================================================ 2 · THE CLOCK */

  const wrap01 = x => x - Math.floor(x);
  const smooth = x => (x <= 0 ? 0 : x >= 1 ? 1 : x * x * (3 - 2 * x));
  const EX = STATED.excursion_s / CYCLE_S;   // excursion, in units of t

  /** Closure fraction of one valve at t: 0 = fully open, 1 = fully shut.
      A valve is shut over the wrapped interval [close, open) and open over [open, close). */
  function closure(closeT, openT, t) {
    const x = wrap01(t);
    /* how far past the close event, and how far past the open event, both wrapped forward */
    const sinceClose = wrap01(x - closeT), sinceOpen = wrap01(x - openT);
    const shutSpan = wrap01(openT - closeT);
    if (sinceClose < shutSpan) return smooth(sinceClose / EX);           // shut, or shutting
    return 1 - smooth(sinceOpen / EX);                                   // open, or opening
  }

  const E = STATED.events;
  function valveState(t) {
    return {
      mitral:    closure(E.mitralClose,    E.mitralOpen,    t),
      tricuspid: closure(E.tricuspidClose, E.tricuspidOpen, t),
      /* SAME ARGUMENT ORDER AS THE AV VALVES, and it took a picture to settle that.
         The two were first swapped here, on the reasoning that a semilunar valve's shut interval wraps
         through t = 0 and therefore "needed" the other order.  It does wrap, and `closure` already
         handles the wrap — every interval in it is taken modulo the cycle — so the swap simply ran the
         right ventricle's outflow backwards: the aortic valve stood shut through ejection and open
         through diastole, which is aortic regurgitation drawn as normal anatomy.  Every check in this
         file passed on it.  What caught it was rendering the aortic valve from above at mid-ejection
         and seeing the closed Mercedes star that should only exist in diastole; acceptance row V now
         asserts the four valves' states at two instants, so it cannot come back silently. */
      aortic:    closure(E.aorticClose,    E.aorticOpen,    t),
      pulmonary: closure(E.pulmonaryClose, E.pulmonaryOpen, t)
    };
  }

  /** Which named phase of the cycle t falls in, derived from the same events. */
  const ATRIAL_END = 0.125, DIASTASIS_START = 0.80;
  function phaseOf(t) {
    const x = wrap01(t), inSpan = (a, b) => wrap01(x - a) < wrap01(b - a);
    if (inSpan(E.mitralClose, E.aorticOpen)) return { name: 'isovolumetric contraction', short: 'IVC' };
    if (inSpan(E.aorticOpen, E.aorticClose)) return { name: 'ventricular ejection', short: 'ejection' };
    if (inSpan(E.aorticClose, E.mitralOpen)) return { name: 'isovolumetric relaxation', short: 'IVR' };
    /* diastole, with the AV valves open.  t = 0 is the P wave, so atrial systole starts THERE and does
       not wrap backwards into the previous cycle — which is what it used to do, reporting t = 0.9 as
       atrial systole a tenth of a cycle before the atria had been told to contract. */
    if (inSpan(E.mitralOpen, DIASTASIS_START)) return { name: 'rapid ventricular filling', short: 'filling' };
    if (inSpan(DIASTASIS_START, 0)) return { name: 'diastasis', short: 'diastasis' };
    if (inSpan(0, ATRIAL_END)) return { name: 'atrial systole', short: 'atrial systole' };
    return { name: 'end-diastole', short: 'end-diastole' };
  }

  /* ============================================================ 3 · SMALL SOLVERS

     One bisection, used everywhere.  A solved parameter cannot drift out of agreement with the
     anatomy the way a tuned constant does — RENDER-STANDARD section 3.                            */

  function bisect(f, lo, hi, iters) {
    let a = lo, b = hi, fa = f(a);
    for (let i = 0; i < (iters || 60); i++) {
      const m = 0.5 * (a + b), fm = f(m);
      if ((fa < 0) === (fm < 0)) { a = m; fa = fm; } else b = m;
    }
    return 0.5 * (a + b);
  }

  /* cubic Bezier, and its length by sampling.  The leaflet surface is built from these, so the length
     the solver measures is the length the geometry has — the two cannot disagree. */
  function bezier(p0, p1, p2, p3, s, out) {
    const q = 1 - s, a = q * q * q, b = 3 * q * q * s, c = 3 * q * s * s, d = s * s * s;
    return out.set(p0.x * a + p1.x * b + p2.x * c + p3.x * d,
                   p0.y * a + p1.y * b + p2.y * c + p3.y * d,
                   p0.z * a + p1.z * b + p2.z * c + p3.z * d);
  }
  const BZN = 24;
  function bezierLength(p0, p1, p2, p3) {
    let L = 0;
    const prev = new T.Vector3().copy(p0), cur = new T.Vector3();
    for (let i = 1; i <= BZN; i++) { bezier(p0, p1, p2, p3, i / BZN, cur); L += cur.distanceTo(prev); prev.copy(cur); }
    return L;
  }

  /** THE INEXTENSIBILITY SOLVE, and it is the heart of this model.
      A leaflet or cusp runs from a fixed hinge A, leaving it along T0, to a free edge at E, arriving
      along T1.  Its LENGTH is anatomy and does not change.  So the only freedom is how much it bows,
      and that is solved — by bisection on the Bezier handle — at every t.  A leaflet that moved by
      pivoting rigidly would have to stretch, and a leaflet drawn with a tuned bow would stretch
      silently, which is the failure this replaces. */
  function solveProfile(A, T0, Efree, T1, wantLen) {
    const chord = A.distanceTo(Efree);
    const p1 = new T.Vector3(), p2 = new T.Vector3();
    const len = k => {
      p1.copy(A).addScaledVector(T0, k);
      p2.copy(Efree).addScaledVector(T1, -k);
      return bezierLength(A, p1, p2, Efree);
    };
    if (!(wantLen > chord)) return { k: 0, chord: chord, reach: false, slack: wantLen - chord };
    const hi = 3.0 * wantLen;
    if (len(hi) < wantLen) return { k: hi, chord: chord, reach: true, slack: wantLen - chord };
    const k = bisect(k2 => len(k2) - wantLen, 0, hi, 46);
    return { k: k, chord: chord, reach: true, slack: wantLen - chord };
  }

  /* ============================================================ 4 · CLOSURE, SOLVED

     ---- ATRIOVENTRICULAR ----

     Work in the valve's own frame: origin at the centre of the annulus, `a1` across the annulus from
     the posterior leaflet towards the anterior one, `a2` towards one commissure, and depth measured
     DOWN into the ventricle.  Two unknowns — where across the annulus the leaflets meet (xc) and how
     far below its plane (hc) — and two conditions:

       (1) the marginal chordae are exactly taut at closure.  A chord cannot stretch, so this is the
           condition that stops the leaflet, and it is why a long chord prolapses and a short one
           tethers.  The papillary tips sit beneath the COMMISSURES, so both muscles pull on the
           middle of both leaflets — which is why one ruptured papillary muscle floods the atrium
           rather than leaking a little.
       (2) the two leaflets are equally taut.  A long anterior leaflet and a short posterior one
           cannot meet in the middle; they meet where each has used the same fraction of itself.

     Nothing here aims at the coaptation depth.  It falls out, and acceptance checks it against the
     tenting depth a textbook gives.                                                               */

  function solveMitralClosure() {
    const s = STATED.mitral, R = STATED.annulus.mitral;
    const halfArc = (s.anteriorArcDeg / 2) * Math.PI / 180;      // commissure azimuth, from a1
    const px = s.papRadius * Math.cos(halfArc), py = s.papRadius * Math.sin(halfArc);

    /* depth at which the chord is exactly taut, for a given offset across the annulus */
    const depthFor = x => {
      const d2 = s.chordaeMarginal * s.chordaeMarginal - (x - px) * (x - px) - py * py;
      return d2 <= 0 ? NaN : s.papDepth - Math.sqrt(d2);
    };
    /* equal tautness: |E-Aant|/Lant - |E-Apost|/Lpost */
    const imbalance = x => {
      const h = depthFor(x);
      if (!isFinite(h)) return 1e3;
      const da = Math.hypot(R - x, h) / s.lenAnterior;
      const dp = Math.hypot(R + x, h) / s.lenPosterior;
      return da - dp;
    };
    const xc = bisect(imbalance, -R * 0.95, R * 0.95, 70);
    const hc = depthFor(xc);
    const reachA = Math.hypot(R - xc, hc), reachP = Math.hypot(R + xc, hc);
    return {
      xc: xc, hc: hc,
      chordA: reachA, chordP: reachP,
      reserveA: 1 - reachA / s.lenAnterior, reserveP: 1 - reachP / s.lenPosterior,
      commissureDeg: s.anteriorArcDeg / 2,
      papAzimuth: halfArc
    };
  }

  function solveTricuspidClosure() {
    const s = STATED.tricuspid, R = STATED.annulus.tricuspid;
    /* Three leaflets meet on the axis, so the offset is zero by symmetry and only the depth is
       unknown.  It is set by the ANTERIOR papillary muscle, which is the large one and carries the
       chordae that actually stop the valve. */
    const d2 = s.chordaeMarginal * s.chordaeMarginal - s.papRadius * s.papRadius;
    const hc = d2 <= 0 ? NaN : s.papDepth - Math.sqrt(d2);
    const reach = hinge => Math.hypot(R, hc - hinge);
    const rA = reach(0), rP = reach(0), rS = reach(s.septalOffset);
    return {
      xc: 0, hc: hc,
      reserveA: 1 - rA / s.lenAnterior,
      reserveP: 1 - rP / s.lenPosterior,
      reserveS: 1 - rS / s.lenSeptal,
      chordA: rA, chordP: rP, chordS: rS
    };
  }

  /* ---- SEMILUNAR ----

     A cusp is a sheet with a fixed meridional length, hinged on a crown and free at its edge.  Closed,
     it runs from the crown in to the nodule on the axis.  Open, it must lie back — and the same length
     of sheet, now spanning a shorter straight distance, has to go somewhere.  It bows outward, and how
     far it bows is the radius the sinus must have.  Solved, not chosen.                             */

  function solveSemilunar(which) {
    const s = STATED[which], R = STATED.annulus[which];
    /* the nadir meridian, closed: crown nadir (radius R, depth crown) to the nodule (axis, depth sag) */
    const mClosed = Math.hypot(R, s.crown - s.sag);
    /* open: the same meridian runs from the crown nadir up to the free edge at the sinotubular plane */
    const chordOpen = s.crown;
    /* a circular arc of length mClosed on a chord of chordOpen stands proud by this much */
    const sag = bisect(x => {
      /* arc length of a circular segment with chord c and sagitta x */
      const c = chordOpen;
      if (x < 1e-6) return c - mClosed;
      const r = (c * c / 4 + x * x) / (2 * x);
      const th = 2 * Math.asin(Math.min(1, c / (2 * r)));
      return r * th - mClosed;
    }, 0, chordOpen, 60);
    return {
      annulus: R, meridianClosed: mClosed, chordOpen: chordOpen,
      standProud: sag,
      sinusRadius: R + sag,
      sinusRatio: (R + sag) / R,
      freeEdgeLength: 2 * Math.hypot(R, s.sag),
      annularArcShare: (2 * Math.PI * R) / 3
    };
  }

  const MC = solveMitralClosure(), TC = solveTricuspidClosure();
  const AO = solveSemilunar('aortic'), PU = solveSemilunar('pulmonary');

  /* ============================================================ 5 · GEOMETRY HELPERS

     Everything geometric goes through render-kit — winding through emitter().quad / triN, colour
     through C(), silhouettes through outlineOf, framing through fitCamera.  RENDER-STANDARD section 6:
     a model that reimplements any of those locally is a bug, not a style choice.                   */

  const V = (x, y, z) => new T.Vector3(x, y, z);
  /** the component of `v` across `ax`, or null if there is essentially none of it.
      A sheet whose v-direction runs ALONG its own u-direction has no surface there: the quad
      degenerates and its face normal takes whichever sign the rounding gives it. */
  function orth(v, ax) {
    const o = v.clone().addScaledVector(ax, -v.dot(ax));
    return o.lengthSq() < 0.06 ? null : o.normalize();
  }
  const _t1 = new T.Vector3(), _t2 = new T.Vector3(), _t3 = new T.Vector3();

  /** A parametric surface, emitted with normals from a FINITE DIFFERENCE OF THE SAME POINT FUNCTION
      that placed the vertices, so the two cannot disagree (RENDER-STANDARD 2.3).  `flip` reverses the
      surface's outward sense.  Returns the sampled grid so a caller can build the other face and the
      rim from exactly the same points. */
  function sampleSurface(P, nu, nv, flip, closedU) {
    const pos = [], nrm = [];
    /* THE DIFFERENCE IS A GRID STEP, NOT AN EPSILON, and that turned out to matter.  An epsilon-step
       difference measures the normal of the SMOOTH surface; the triangles are chords of it, and where
       the two curve away from each other fast — the last column of a cusp beside its commissure, the
       free-edge corner of a leaflet — the smooth normal and the chord's own face normal end up on
       opposite sides.  emitter().quad does not reorder against the normals it is given (only triN
       does), so a smooth-surface normal is the wrong thing to hand it.  sweptShell in the kit
       differences by i+/-1 and j+/-1 for exactly this reason.  Measured: on this model the change
       alone moved the leaflets from 0.991 to 0.995 and left the cusps at 0.963, which is how the
       REAL cause of the cusp figure was found — see the tangent orthogonalisation in cuspAt. */
    const h = 1 / Math.max(nu, 1), hv = 1 / Math.max(nv, 1);
    /* a surface closed in u must sample its neighbours by WRAPPING, not by clamping: a one-sided
       difference at u = 0 and u = 1 gives the seam two different normals for one position, which is
       a visible crease all the way up the aortic root and, under outlineOf, a torn hull. */
    const wu = closedU ? (x => x - Math.floor(x)) : (x => Math.max(0, Math.min(1, x)));
    const a = new T.Vector3(), b = new T.Vector3(), du = new T.Vector3(), dv = new T.Vector3();
    for (let i = 0; i <= nu; i++) {
      for (let j = 0; j <= nv; j++) {
        const u = i / nu, v = j / nv;
        pos.push(P(closedU ? wu(u) : u, v, new T.Vector3()));
        P(wu(u + h), v, a); P(wu(u - h), v, b); du.subVectors(a, b);
        /* v is NOT clamped.  Every surface in this file is a polynomial in v, so it evaluates
           perfectly well just outside [0,1], and a one-sided difference at the first and last row is
           how the hinge row of a cusp ended up with a normal that disagreed with its own quads. */
        P(closedU ? wu(u) : u, v + hv, a); P(closedU ? wu(u) : u, v - hv, b); dv.subVectors(a, b);
        /* dv x du, NOT du x dv.  emitter().quad(a,b,c,d) emits (a,d,c) and (a,c,b), whose face
           normal is (d-a) x (c-a) ~ dv x du — so a normal built the other way round disagrees with
           every triangle on the surface.  Written du x dv first, and measured at winding 0.045 on
           every leaflet and 0.026 on the roots: RENDER-STANDARD 2.1's cardinal bug, arriving at a new
           call site exactly as 2.4b predicts it will ("a winding convention that has to be reasoned
           about at the call site will be got wrong at some call site").  sweptShell in the kit does
           crossVectors(_dv, _du) for the same reason. */
        const n = new T.Vector3().crossVectors(dv, du);
        /* the difference can collapse at a taper or a pole; three's normalize() would return (0,0,0)
           and leave a silhouette shell coincident with its surface — the bug RENDER-STANDARD 2.3 is
           written about.  Fall back to a neighbouring row's normal rather than to zero. */
        if (n.lengthSq() < 1e-14) {
          const v2 = v < 0.5 ? v + 3 * hv : v - 3 * hv;
          P(wu(u + h), v2, a); P(wu(u - h), v2, b); du.subVectors(a, b);
          P(closedU ? wu(u) : u, v2 + hv, a); P(closedU ? wu(u) : u, v2 - hv, b); dv.subVectors(a, b);
          n.crossVectors(dv, du);
          if (n.lengthSq() < 1e-14) n.set(0, 1, 0);
        }
        n.normalize(); if (flip) n.negate();
        nrm.push(n);
      }
    }
    return { pos: pos, nrm: nrm, nu: nu, nv: nv, at: (i, j) => i * (nv + 1) + j };
  }

  /** A THIN SHEET AS A CLOSED SOLID — the shape a leaflet and a cusp both are.
      Two faces offset either side of the mid-surface plus a rim all the way round, so it is closed and
      the outward-normal probe means something on it.  Only the two FACES go into the hull: the rim
      carries a second normal at every position it shares with a face, and inflating across that seam
      is what tears a silhouette open (RENDER-STANDARD 2.4). */
  /** `thickness` may be a number or a function of (u, v).
      A LEAFLET TAPERS, AND THAT IS NOT DECORATION.  A sheet thickened by a constant amount has an
      offset surface that self-intersects wherever the mid-surface curves tighter than the half
      thickness — at a free-edge corner, at a commissure — and a self-intersecting offset is a solid
      whose quads face into themselves.  It is also simply wrong: a valve leaflet is thick in its
      basal third and thins to a fine free edge, and a cusp thins to nothing at its commissures.  So
      the taper fixes the geometry and the anatomy at the same time, which is RENDER-STANDARD's
      "A MEMBRANE TAPERS" arriving from the other direction. */
  function sheetSolid(P, nu, nv, thickness, closedU) {
    const thAt = typeof thickness === 'function' ? thickness : (() => thickness);
    const hu = 1 / nu, hv = 1 / nv;
    const wu = closedU ? (x => x - Math.floor(x)) : (x => Math.max(0, Math.min(1, x)));
    const _sa = new T.Vector3(), _sb = new T.Vector3(), _sdu = new T.Vector3(), _sdv = new T.Vector3();
    const _sn = new T.Vector3();
    function midN(u, v, out) {
      P(wu(u + hu), v, _sa); P(wu(u - hu), v, _sb); _sdu.subVectors(_sa, _sb);
      P(wu(u), v + hv, _sa); P(wu(u), v - hv, _sb); _sdv.subVectors(_sa, _sb);
      out.crossVectors(_sdv, _sdu);
      if (out.lengthSq() < 1e-14) {
        const v2 = v < 0.5 ? v + 3 * hv : v - 3 * hv;
        P(wu(u + hu), v2, _sa); P(wu(u - hu), v2, _sb); _sdu.subVectors(_sa, _sb);
        P(wu(u), v2 + hv, _sa); P(wu(u), v2 - hv, _sb); _sdv.subVectors(_sa, _sb);
        out.crossVectors(_sdv, _sdu);
        if (out.lengthSq() < 1e-14) out.set(0, 1, 0);
      }
      return out.normalize();
    }
    /* THE TWO FACES ARE SURFACES IN THEIR OWN RIGHT, AND CARRY THEIR OWN NORMALS.
       They were first given the MID-surface's normal, which is the same mistake RENDER-STANDARD 2.3
       is written about, one level up: a surface shaded and wound by a normal that belongs to a
       different surface.  An offset surface's normal is not its parent's wherever the parent curves,
       and where the two disagreed enough the quad came out wound against the normal it was handed —
       measured at winding 0.93 on all six semilunar cusps, unmoved by three earlier fixes, and shown
       to be the offset rather than the mid-surface by rebuilding at a thickness of one micron, where
       every quad agreed.  Both faces are now sampled as surfaces, so positions and normals come from
       the same function again. */
    const offset = sgn => (u, v, out) => {
      P(wu(u), v, out); midN(u, v, _sn);
      return out.addScaledVector(_sn, sgn * 0.5 * thAt(Math.max(0, Math.min(1, u)), Math.max(0, Math.min(1, v))));
    };
    const TOP = sampleSurface(offset(+1), nu, nv, false, closedU);
    const BOT = sampleSurface(offset(-1), nu, nv, true, closedU);
    const E = K.emitter(), at = TOP.at;
    /* A HANDFUL OF QUADS ARE NOT RING QUADS, AND THE KIT ALREADY SAYS WHAT TO DO WITH THOSE.
       After the offset surfaces were given their own normals the sheets read winding 0.986-0.996 —
       six to eleven triangles per cusp, isolated, at the hinge row and at one mid-height column, where
       the patch is small and twisted enough that the chord through four samples faces the other way
       from the normals at its corners.  `quad` cannot help there: it orders by convention and the
       convention is what has broken.  RENDER-STANDARD 2.4b names this case exactly — "any triangle
       that is not part of a ring quad ... goes through emitter().triN", and lists a sheet — so those
       quads, and only those, are emitted as two triN triangles, which decide their order from the
       geometry.  The cost is flat shading on about one per cent of a leaflet; the alternative is the
       corpus's cardinal bug surviving in the file at a size small enough to argue about. */
    const _fa = new T.Vector3(), _fb = new T.Vector3(), _fn2 = new T.Vector3(), _av = new T.Vector3();
    const avg3 = (x, y, z, out) => out.copy(x).add(y).add(z).normalize();
    const _n1 = new T.Vector3(), _n2 = new T.Vector3();
    let recovered = 0;
    /* the test is PER TRIANGLE, not per quad.  Checked on the four corners at once first, and it left
       a residue: a quad can agree on the average of its four normals while one of its two triangles
       disagrees on the average of its own three.  The average of a thing is not the thing. */
    const triAgrees = (p, n, i1, i2, i3) => {
      _fn2.crossVectors(_fa.subVectors(p[i2], p[i1]), _fb.subVectors(p[i3], p[i1]));
      if (_fn2.lengthSq() < 1e-20) return true;                       // degenerate: triN drops it anyway
      _av.copy(n[i1]).add(n[i2]).add(n[i3]);
      return _fn2.dot(_av) > 0;
    };
    const emitQuad = (p, n, a, b, c, d, flipped) => {
      const ok = flipped ? (triAgrees(p, n, a, b, c) && triAgrees(p, n, a, c, d))
                         : (triAgrees(p, n, a, d, c) && triAgrees(p, n, a, c, b));
      if (ok) {
        if (flipped) E.quadFlip(p[a], p[b], p[c], p[d], n[a], n[b], n[c], n[d]);
        else E.quad(p[a], p[b], p[c], p[d], n[a], n[b], n[c], n[d]);
        return;
      }
      recovered++;
      if (flipped) {
        E.triN(p[a], p[b], p[c], avg3(n[a], n[b], n[c], _n1));
        E.triN(p[a], p[c], p[d], avg3(n[a], n[c], n[d], _n2));
      } else {
        E.triN(p[a], p[d], p[c], avg3(n[a], n[d], n[c], _n1));
        E.triN(p[a], p[c], p[b], avg3(n[a], n[c], n[b], _n2));
      }
    };
    for (let i = 0; i < nu; i++) for (let j = 0; j < nv; j++) {
      const a = at(i, j), b = at(i + 1, j), c = at(i + 1, j + 1), d = at(i, j + 1);
      emitQuad(TOP.pos, TOP.nrm, a, b, c, d, false);
      emitQuad(BOT.pos, BOT.nrm, a, b, c, d, true);
    }
    const hullCount = E.count();
    /* THE RIM, AND THE SIGN THAT HAS TO GO WITH IT.  `quad` does NOT reorder against the normals it is
       handed — only `triN` does — so a rim strip whose outward direction is the OPPOSITE way round the
       ring has to be emitted with `quadFlip`, not with `quad` and a negated normal.  Written the second
       way first, and measured: winding 0.956 on the leaflets, 0.898 on the cusps, 0.974 on the roots,
       with the disagreeing triangles counting out to exactly the two strips that carry sign -1. */
    const _rp = [null, null, null, null], _rn = [null, null, null, null];
    const rim = (i0, j0, i1, j1, n) => {
      const a = at(i0, j0), b = at(i1, j1);
      const e = _t1.subVectors(TOP.pos[b], TOP.pos[a]);
      const nn = _t2.crossVectors(e, TOP.nrm[a]).normalize().multiplyScalar(n);
      if (nn.lengthSq() < 0.5) return;
      const q = nn.clone();
      /* through the same per-triangle check as the faces: a rim strip round a tapering sheet has its
         own twisted quads, and they were the whole of the residue once the faces read 1.000 */
      _rp[0] = TOP.pos[a]; _rp[1] = TOP.pos[b]; _rp[2] = BOT.pos[b]; _rp[3] = BOT.pos[a];
      _rn[0] = _rn[1] = _rn[2] = _rn[3] = q;
      emitQuad(_rp, _rn, 0, 1, 2, 3, n <= 0);
    };
    for (let i = 0; i < nu; i++) { rim(i, nv, i + 1, nv, 1); rim(i, 0, i + 1, 0, -1); }
    /* a surface closed in u has no side edges to rim — the two would be coincident, facing opposite
       ways, and would show as a doubled interior wall */
    if (!closedU) for (let j = 0; j < nv; j++) { rim(nu, j, nu, j + 1, -1); rim(0, j, 0, j + 1, 1); }
    const geo = E.geometry(hullCount);
    geo.userData.triNRecovered = recovered;
    return geo;
  }

  /** A closed tube along a polyline, rounded at both ends — papillary muscles, chordae, annulus
      segments.  sweptShell for the barrel, domeCap for the ends, because a tube that stops in mid-air
      closed with an annulus reads as an open pipe (RENDER-STANDARD, added by the round-3 build run). */
  function rod(points, rFn, opts) {
    opts = opts || {};
    const F = K.parallelFrame(points, opts.seed);
    const steps = points.length - 1;
    const rAt = i => rFn(i / steps);
    const parts = [K.sweptShell({ frame: F, i0: 0, i1: steps, ring: opts.ring || 14,
      outerR: rAt, flatten: 1, section: () => 1 })];
    if (!opts.openEnds) {
      parts.push(K.domeCap({ frame: F, i: steps, sign: 1, r: rAt(steps), ring: opts.ring || 14,
        rows: 5, bulge: opts.bulge != null ? opts.bulge : 0.9, flatten: 1, section: () => 1 }));
      parts.push(K.domeCap({ frame: F, i: 0, sign: -1, r: rAt(0), ring: opts.ring || 14,
        rows: 5, bulge: opts.bulge != null ? opts.bulge : 0.9, flatten: 1, section: () => 1 }));
    }
    return mergeGeos(parts.filter(Boolean));
  }

  /** Concatenate geometries, keeping the hull portion of each FIRST so outlineOf still inflates only
      outer surface.  Written out rather than using a helper from three, because the hull bookkeeping
      is the whole point and a generic merge would drop it. */
  function mergeGeos(list) {
    list = list.filter(g => g && g.attributes && g.attributes.position.count);
    if (!list.length) return null;
    if (list.length === 1) return list[0];
    let hull = 0, total = 0;
    for (const g of list) {
      const n = g.attributes.position.count;
      hull += (g.userData.hullCount != null ? g.userData.hullCount : n);
      total += n;
    }
    const pos = new Float32Array(total * 3), nrm = new Float32Array(total * 3);
    let ho = 0, to = hull;      // hull vertices pack to the front, the rest after them
    for (const g of list) {
      const n = g.attributes.position.count;
      const hc = g.userData.hullCount != null ? g.userData.hullCount : n;
      const p = g.attributes.position.array, q = g.attributes.normal.array;
      pos.set(p.subarray(0, hc * 3), ho * 3); nrm.set(q.subarray(0, hc * 3), ho * 3); ho += hc;
      if (n > hc) { pos.set(p.subarray(hc * 3), to * 3); nrm.set(q.subarray(hc * 3), to * 3); to += n - hc; }
    }
    const out = new T.BufferGeometry();
    out.setAttribute('position', new T.Float32BufferAttribute(pos, 3));
    out.setAttribute('normal', new T.Float32BufferAttribute(nrm, 3));
    out.userData.hullCount = hull;
    return out;
  }

  /** A closed ring — an annulus.  Built as a sweep that overruns its own start, so the seam sits
      inside the overlap and no end cap is ever exposed. */
  function ringOf(pointAt, tubeR, n) {
    const pts = [];
    const over = 3;
    for (let i = -over; i <= n + over; i++) pts.push(pointAt(((i % n) + n) % n, i / n));
    return rod(pts, () => tubeR, { ring: 10, openEnds: true });
  }

  /** A chord of FIXED length between two points.  If the ends are closer than the chord is long it
      sags, by the sagitta a circular arc of that length needs — so the chordae are visibly slack in
      diastole and visibly straight the instant the valve shuts.  That is the thing this scene is
      about, and drawing it as a straight line at every t would have hidden it. */
  function chordPath(from, to, restLen, sagDir, n) {
    const c = from.distanceTo(to);
    const pts = [];
    if (!(restLen > c * 1.0005)) {
      for (let i = 0; i <= n; i++) pts.push(from.clone().lerp(to, i / n));
      return { pts: pts, taut: true, stretch: c - restLen, sagitta: 0 };
    }
    const sag = bisect(x => {
      if (x < 1e-6) return c - restLen;
      const r = (c * c / 4 + x * x) / (2 * x);
      return r * 2 * Math.asin(Math.min(1, c / (2 * r))) - restLen;
    }, 0, restLen, 50);
    for (let i = 0; i <= n; i++) {
      const s = i / n;
      pts.push(from.clone().lerp(to, s).addScaledVector(sagDir, sag * Math.sin(Math.PI * s)));
    }
    return { pts: pts, taut: false, stretch: c - restLen, sagitta: sag };
  }

  /* ============================================================ 6 · WHERE THE FOUR VALVES SIT

     The base of the heart, seen from above, is the image this scene exists to teach.  Positions are
     in the ANNULAR PLANE — the plane of the fibrous skeleton — which is oblique: it faces up and a
     little forward.  The relations encoded here are the examinable ones and acceptance asserts every
     one of them with a magnitude floor rather than a sign:

        the pulmonary valve is the most ANTERIOR and the most SUPERIOR
        the mitral valve is the most POSTERIOR
        the tricuspid valve is the most to the patient's RIGHT
        the aortic valve is CENTRAL — wedged between the other three, which is why aortic root
        surgery threatens all of them and why aortic valve endocarditis tracks into the septum      */

  const UP = V(0, 1, 0.22).normalize();                    // normal of the annular plane
  const PE1 = V(1, 0, 0).addScaledVector(UP, -UP.x).normalize();   // in-plane, patient's left
  const PE2 = new T.Vector3().crossVectors(PE1, UP).normalize();   // in-plane, anterior

  /** a point in the annular plane: `a` to the patient's left, `b` anterior, `h` above the plane */
  const plane = (a, b, h) => new T.Vector3().addScaledVector(PE1, a).addScaledVector(PE2, b).addScaledVector(UP, h);

  const SITE = {
    aortic:    { c: plane(0.00,  0.00, 0.35), axis: V(-0.10, 1, -0.06) },
    pulmonary: { c: plane(0.55,  2.55, 1.75), axis: V(-0.06, 1, -0.30) },
    mitral:    { c: plane(2.68, -1.15, 0.00), axis: V(-0.30, -1, -0.20) },
    tricuspid: { c: plane(-2.95, -0.15, -0.15), axis: V(0.22, -1, -0.26) }
  };
  Object.keys(SITE).forEach(k => SITE[k].axis.normalize());

  /** Local frame for one valve.  `n` is the OUTFLOW/INFLOW axis (up for a semilunar valve, down into
      the ventricle for an atrioventricular one).  `a1` points at the aortic valve — the septal side
      for the tricuspid, the aortic side for the mitral — because that is the direction anatomy names
      things from, and putting it anywhere else would make every azimuth in this file arbitrary. */
  function frameFor(key) {
    const s = SITE[key], n = s.axis.clone();
    let ref = key === 'aortic' ? PE2.clone()
            : new T.Vector3().subVectors(SITE.aortic.c, s.c);
    ref.addScaledVector(n, -ref.dot(n));
    if (ref.lengthSq() < 1e-6) ref = PE1.clone().addScaledVector(n, -PE1.dot(n));
    const a1 = ref.normalize();
    const a2 = new T.Vector3().crossVectors(n, a1).normalize();
    return { c: s.c.clone(), n: n, a1: a1, a2: a2 };
  }
  const FR = { aortic: frameFor('aortic'), pulmonary: frameFor('pulmonary'),
               mitral: frameFor('mitral'), tricuspid: frameFor('tricuspid') };

  /** point at azimuth th, radius r, and `d` along the frame's axis, in valve-local terms */
  function at(F, r, th, d, out) {
    return (out || new T.Vector3()).copy(F.c)
      .addScaledVector(F.a1, r * Math.cos(th)).addScaledVector(F.a2, r * Math.sin(th))
      .addScaledVector(F.n, d);
  }
  const radial = (F, th, out) => (out || new T.Vector3())
    .set(0, 0, 0).addScaledVector(F.a1, Math.cos(th)).addScaledVector(F.a2, Math.sin(th));

  /* ============================================================ 7 · ATRIOVENTRICULAR VALVES */

  const DEG = Math.PI / 180;
  const OPEN_R = {
    mitral: Math.sqrt(STATED.mitral.areaOpen / Math.PI),
    tricuspid: Math.sqrt(STATED.tricuspid.areaOpen / Math.PI)
  };
  const FLARE_OPEN = 5 * DEG, FLARE_SHUT = 22 * DEG;

  /* leaflet layout: azimuth spans and which commissures bound each leaflet */
  const MITRAL_HALF = (STATED.mitral.anteriorArcDeg / 2) * DEG;
  const AV_LEAFLETS = {
    mitral: [
      { key: 'mitral_anterior',  th0: -MITRAL_HALF, th1: MITRAL_HALF, len: STATED.mitral.lenAnterior, hinge: 0, scallops: 0 },
      { key: 'mitral_posterior', th0: MITRAL_HALF, th1: 2 * Math.PI - MITRAL_HALF, len: STATED.mitral.lenPosterior, hinge: 0, scallops: 3 }
    ],
    tricuspid: (function () {
      const a = STATED.tricuspid.arcDeg;
      const s0 = -a.septal / 2 * DEG, s1 = a.septal / 2 * DEG;
      const a1 = s1, a2 = s1 + a.anterior * DEG;
      const p1 = a2, p2 = a2 + a.posterior * DEG;
      return [
        { key: 'tricuspid_septal',    th0: s0, th1: s1, len: STATED.tricuspid.lenSeptal,    hinge: STATED.tricuspid.septalOffset, scallops: 0 },
        { key: 'tricuspid_anterior',  th0: a1, th1: a2, len: STATED.tricuspid.lenAnterior,  hinge: 0, scallops: 0 },
        { key: 'tricuspid_posterior', th0: p1, th1: p2, len: STATED.tricuspid.lenPosterior, hinge: 0, scallops: 2 }
      ];
    })()
  };

  /** hinge depth at azimuth th — flat except where the tricuspid's septal leaflet steps down */
  function hingeDepth(which, th) {
    if (which !== 'tricuspid') return 0;
    const half = STATED.tricuspid.arcDeg.septal / 2 * DEG;
    let d = Math.atan2(Math.sin(th), Math.cos(th));           // wrap to -pi..pi
    const x = Math.abs(d) / (half * 1.45);
    return x >= 1 ? 0 : STATED.tricuspid.septalOffset * (1 - x) * (1 - x) * (3 - 2 * (1 - x)) / 1;
  }

  /** THE COAPTATION LOCUS — where the free edges meet when the valve is shut.
      Mitral: a curve from commissure to commissure, deepest in the middle, offset to the POSTERIOR
      by the amount the solver found.  Tricuspid: three arms meeting on the axis. */
  function coaptation(which, lf, u, out) {
    const F = FR[which];
    if (which === 'mitral') {
      const w = (lf.key === 'mitral_anterior') ? (2 * u - 1) : (1 - 2 * u);
      const rc = Math.cos(MITRAL_HALF) * STATED.annulus.mitral;
      const w2 = w * w;
      return (out || new T.Vector3()).copy(F.c)
        .addScaledVector(F.a1, MC.xc + (rc - MC.xc) * w2)
        .addScaledVector(F.a2, w * Math.sin(MITRAL_HALF) * STATED.annulus.mitral)
        /* exponent 1, not 0.55: (1 - w^2)^0.55 has an infinite slope where the curve meets the
           annulus at the commissures, and a boundary curve with an infinite slope is a crease */
        .addScaledVector(F.n, MC.hc * (1 - w2));
    }
    /* the three arms of the tricuspid's Y meet on the axis, and a leaflet's free edge turns through
       that meeting point — smoothed for the same reason as the semilunar nodule above */
    const R3 = STATED.annulus.tricuspid;
    const lo = new T.Vector3().copy(F.c).addScaledVector(F.a1, R3 * Math.cos(lf.th0)).addScaledVector(F.a2, R3 * Math.sin(lf.th0));
    const hi = new T.Vector3().copy(F.c).addScaledVector(F.a1, R3 * Math.cos(lf.th1)).addScaledVector(F.a2, R3 * Math.sin(lf.th1));
    const N3 = new T.Vector3().copy(F.c).addScaledVector(F.n, TC.hc);
    const P3 = N3.clone().multiplyScalar(2).addScaledVector(lo, -0.5).addScaledVector(hi, -0.5);
    const q3 = 1 - u;
    return (out || new T.Vector3()).set(0, 0, 0)
      .addScaledVector(lo, q3 * q3).addScaledVector(P3, 2 * q3 * u).addScaledVector(hi, u * u);
  }

  /* papillary tips, cached: the excursion clamp asks for them inside every leaflet station of every
     rebuild, and rebuilding two Vector3s per query is the kind of cost that quietly triples a model. */
  const _tips = {};
  function papTips(which) {
    if (!_tips[which]) _tips[which] = papillaries(which).map(p => papTip(which, p));
    return _tips[which];
  }

  /** How far towards its fully-open position a leaflet station may travel before one of its chordae
      goes taut.  Scanned then bisected rather than solved in closed form, because the distance to a
      papillary tip is not monotonic along the path — the free edge swings past some muscles and away
      from others — and a bisection alone would happily jump over the first violation. */
  function clampByChordae(which, A, Ec, Eraw) {
    const tips = papTips(which);
    const rest = tips.map(tp => Ec.distanceTo(tp));
    const probe = new T.Vector3();
    const okAt = e => {
      probe.copy(Ec).lerp(Eraw, e);
      for (let i = 0; i < tips.length; i++) if (probe.distanceTo(tips[i]) > rest[i] + 1e-9) return false;
      return true;
    };
    const N = 24;
    let good = 0;
    for (let i = 1; i <= N; i++) { const e = i / N; if (!okAt(e)) break; good = e; }
    if (good >= 1) return Eraw.clone();
    let lo = good, hi = Math.min(1, good + 1 / N);
    for (let i = 0; i < 26; i++) { const m = (lo + hi) / 2; if (okAt(m)) lo = m; else hi = m; }
    return Ec.clone().lerp(Eraw, lo);
  }

  /** Everything about one leaflet at one closure fraction: the hinge, the free edge, the tangents and
      the solved bow — so the surface, the chordae and the acceptance probes all read the SAME
      geometry rather than three descriptions of it that can drift apart. */
  function leafletAt(which, lf, phi, u) {
    const F = FR[which], R = STATED.annulus[which];
    const th = lf.th0 + (lf.th1 - lf.th0) * u;
    const hz = hingeDepth(which, th);
    const A = at(F, R, th, hz);
    const rHat = radial(F, th);

    const Ec = coaptation(which, lf, u, new T.Vector3());
    const reserve = which === 'mitral' ? MC.reserveA
      : (lf.key === 'tricuspid_anterior' ? TC.reserveA : lf.key === 'tricuspid_posterior' ? TC.reserveP : TC.reserveS);
    /* Leaflet length is UNIFORM TAUTNESS across the whole leaflet: the middle uses the stated length
       by construction, and every other station uses whatever reaches its own point on the coaptation
       curve with the same fraction spare.  A leaflet given a constant length instead would be slack
       at the commissures, where the curve rises to meet the annulus. */
    let L = A.distanceTo(Ec) / (1 - reserve);
    if (lf.scallops) L *= 1 + 0.045 * Math.pow(Math.sin(lf.scallops * Math.PI * u), 2);
    /* COMMISSURAL TISSUE.  The coaptation curve meets the annulus at the commissures, so the formula
       above sends the leaflet's length to zero there and the surface patch collapses to a point — which
       has no normal, and produced quads wound against their own supplied normals at exactly those
       columns.  A real valve has a small commissural leaflet there, so the floor is anatomy as well as
       arithmetic. */
    L = Math.max(0.24, L);

    const rOpen = OPEN_R[which];
    const sinG = Math.min(0.9, (R - rOpen) / (L * 0.985));
    const cosG = Math.sqrt(1 - sinG * sinG);
    const Eraw = A.clone().addScaledVector(F.n, L * 0.985 * cosG).addScaledVector(rHat, -L * 0.985 * sinG);

    /* THE CHORDAE LIMIT OPENING, NOT ONLY CLOSING — and this was found by measurement, not foreseen.
       The free edge was first swung to wherever a stated orifice area put it, and the probe reported a
       chord stretched 1.43 cm past its own length: a cord cannot do that, and the leaflet that needed
       it was the SHORT posterior one, whose free edge would have had to travel further from the
       papillary muscles than the coaptation point it is tethered to.  So the excursion is now clamped
       by the cords themselves — the leaflet opens until its first chord goes taut and no further, which
       is what a real posterior leaflet does and is why it barely moves while the anterior leaflet
       swings into the outflow tract.  The consequence is worth stating: the ORIFICE AREA is no longer
       an input.  It is predicted, and acceptance checks it against the textbook figure. */
    const Eo = clampByChordae(which, A, Ec, Eraw);

    const Efree = Eo.clone().lerp(Ec, phi);
    const flare = FLARE_OPEN + (FLARE_SHUT - FLARE_OPEN) * phi;
    /* the hinge line's own direction: the leaflet must run ACROSS it, not along it */
    const hAx = new T.Vector3().addScaledVector(F.a1, -Math.sin(th)).addScaledVector(F.a2, Math.cos(th)).normalize();
    let T0 = new T.Vector3().addScaledVector(F.n, Math.cos(flare)).addScaledVector(rHat, Math.sin(flare)).normalize();
    T0 = orth(T0, hAx) || T0;
    const dirOpen = new T.Vector3().subVectors(Eo, A).normalize();
    /* HOW THE PROFILE ARRIVES AT THE FREE EDGE.  Straight down is right in the middle of the leaflet,
       where the two free edges appose along the coaptation axis, and WRONG at the commissures, where
       the coaptation curve has risen to meet the annulus: a downward arrival tangent there puts the
       Bezier's second handle ABOVE the annular plane and bows the leaflet up through it.  Measured as
       48 microns of prolapse before this scaling was added — small, and prolapse is the one thing this
       model exists to be able to rule out, so a floor of "about zero" is not good enough. */
    const depthE = _t3.subVectors(Efree, F.c).dot(F.n);
    const hcv = which === 'mitral' ? MC.hc : TC.hc;
    const wDepth = Math.max(0, Math.min(1, depthE / Math.max(1e-6, hcv)));
    let T1 = new T.Vector3().subVectors(Efree, A).normalize().addScaledVector(F.n, 0.9 * phi * wDepth).normalize();
    T1 = orth(T1, hAx) || T1;
    const prof = solveProfile(A, T0, Efree, T1, L);
    return { A: A, E: Efree, T0: T0, T1: T1, k: prof.k, L: L, reach: prof.reach,
             chord: prof.chord, th: th, rHat: rHat, Ec: Ec, Eo: Eo };
  }

  /** One leaflet, or any CONTIGUOUS PART of one, as a closed slab.
      `u0..u1` is the span of the leaflet's own azimuth this patch covers.  It exists because section
      10a has to build half a leaflet, and building half of it by cutting the whole one afterwards
      would have meant clipping triangles — a second way of making geometry, with its own winding to
      get wrong.  A half built from the same point function as the whole is the same surface, sampled
      over a shorter interval, and `leafletSurface` below is now literally the u0=0,u1=1 case, so the
      two cannot disagree about where a leaflet is. */
  function leafletSurfaceRange(which, lf, phi, u0, u1, nu, nv) {
    const cache = [];
    const uOwn = u => u0 + (u1 - u0) * u;
    for (let i = 0; i <= nu; i++) cache.push(leafletAt(which, lf, phi, uOwn(i / nu)));
    const p1 = new T.Vector3(), p2 = new T.Vector3();
    return sheetSolid(function (u, v, out) {
      const i = Math.max(0, Math.min(nu, Math.round(u * nu)));
      const fr = u * nu - i;
      const g = cache[i];
      /* between rows, interpolate the CONTROL POINTS rather than the surface, so the finite-difference
         normal stays smooth across a row boundary */
      let A = g.A, E = g.E, k = g.k, T0 = g.T0, T1 = g.T1;
      if (Math.abs(fr) > 1e-9) {
        const j = Math.max(0, Math.min(nu, i + (fr > 0 ? 1 : -1))), s = Math.abs(fr), h2 = cache[j];
        A = g.A.clone().lerp(h2.A, s); E = g.E.clone().lerp(h2.E, s);
        k = g.k + (h2.k - g.k) * s;
        T0 = g.T0.clone().lerp(h2.T0, s).normalize(); T1 = g.T1.clone().lerp(h2.T1, s).normalize();
      }
      p1.copy(A).addScaledVector(T0, k);
      p2.copy(E).addScaledVector(T1, -k);
      return bezier(A, p1, p2, E, v, out);
    }, nu, nv, function (u, v) {
      /* thick through the basal two thirds, thinning to a fine free edge, and to nothing at the
         commissures where the leaflet runs out into the annulus.
         THE TAPER IS A PROPERTY OF THE LEAFLET, NOT OF THE PATCH.  Read off the patch's own u, a
         half-leaflet cut through its middle would thin to nothing AT THE CUT — which is the one place
         the tissue is thickest, and would have made the section's cut face a knife edge. */
      const g = uOwn(Math.max(0, Math.min(1, u)));
      return 0.070 * Math.pow(Math.sin(Math.PI * g), 0.45) * (1 - 0.72 * v * v);
    });
  }

  function leafletSurface(which, lf, phi) { return leafletSurfaceRange(which, lf, phi, 0, 1, 30, 12); }

  /* ---- papillary muscles and chordae ---- */

  function papillaries(which) {
    const F = FR[which], s = STATED[which];
    if (which === 'mitral') {
      /* CORRECTED 2026-09-22 (review): these two were the wrong way round, and it is the kind of
         error a student is marked wrong for rather than a blemish.  `a1` points at the AORTIC valve,
         so it is medial-and-anterior, and `a2 = n x a1` with `n` pointing DOWN into the ventricle
         comes out POSTERIOR.  Therefore th = +MITRAL_HALF is the postero-medial commissure and
         th = -MITRAL_HALF is the antero-lateral one — measured, not argued: at th=+MITRAL_HALF the
         tip lands 0.47 cm POSTERIOR of the annular centre, at th=-MITRAL_HALF 0.88 cm ANTERIOR of it.
         The file had 'anterolateral' on the posterior one.  This matters clinically as well as in a
         viva: the POSTEROMEDIAL muscle is the one with a single blood supply and the one that
         ruptures after an inferior infarct, so which of the two is which is the examinable fact.
         (The three right-ventricular muscles below were checked at the same time and are correct.) */
      return [
        { name: 'anterolateral', th: -MITRAL_HALF, r: s.papRadius, d: s.papDepth, big: 1.0 },
        { name: 'posteromedial', th: MITRAL_HALF, r: s.papRadius, d: s.papDepth, big: 0.92 }
      ];
    }
    const lf = AV_LEAFLETS.tricuspid;
    return [
      { name: 'anterior', th: lf[2].th0, r: s.papRadius, d: s.papDepth, big: 1.0 },
      { name: 'posterior', th: lf[2].th1, r: s.papRadius, d: s.papDepth * 0.95, big: 0.8 },
      { name: 'septal', th: lf[1].th0, r: s.papRadius * 0.75, d: s.papDepthSeptal, big: 0.5 }
    ];
  }
  const papTip = (which, p) => at(FR[which], p.r, p.th, p.d);

  /* Every papillary muscle sends chordae to BOTH (all) leaflets, which is why one ruptured muscle
     makes the whole valve incompetent rather than half of it.  Drawn, not narrated. */
  /* WHICH CORDS GO WHERE.  Every papillary muscle sends chordae to BOTH (all) leaflets — that is the
     examinable fact, and it is why one ruptured muscle floods the atrium instead of leaking half of
     it — but it sends them to the HALF of each leaflet nearest itself, not across the orifice.  So the
     attachment stations are chosen by angular proximity to the muscle rather than spread evenly, which
     is both the anatomy and the difference between a cord of a credible length and one of 3 cm. */
  function chordStations(lf, papTh) {
    let best = 0.5, bd = 1e9;
    for (let i = 0; i <= 40; i++) {
      const u = i / 40, th = lf.th0 + (lf.th1 - lf.th0) * u;
      let d = th - papTh; while (d > Math.PI) d -= 2 * Math.PI; while (d < -Math.PI) d += 2 * Math.PI;
      if (Math.abs(d) < bd) { bd = Math.abs(d); best = u; }
    }
    const clamp = u => Math.max(0.09, Math.min(0.91, u));
    return [clamp(best - 0.26), clamp(best - 0.13), clamp(best), clamp(best + 0.13), clamp(best + 0.26)];
  }
  function chordSet(which) {
    const out = [];
    for (const p of papillaries(which)) {
      const tip = papTip(which, p);
      for (const lf of AV_LEAFLETS[which]) {
        for (const u of chordStations(lf, p.th)) {
          const shut = leafletAt(which, lf, 1, u);
          out.push({ pap: p, tip: tip, lf: lf, u: u, rest: tip.distanceTo(shut.E) });
        }
      }
    }
    return out;
  }
  const CHORDS = { mitral: chordSet('mitral'), tricuspid: chordSet('tricuspid') };

  /* ============================================================ 8 · SEMILUNAR VALVES

     Three cusps, hinged on a CROWN rather than a ring — low at the nadir of each cusp, high at the
     commissures — which is the first thing a student is asked about them and the reason "annulus" is
     a convenient lie.  Closed, the three free edges meet on the axis at the nodules of Arantius.
     Open, the same three inextensible sheets have to go somewhere, and where they go is the sinus of
     Valsalva.  How far out they must go is SOLVED above, not chosen; the coronary ostia are drawn in
     the two sinuses that have them, so it is visible that an open cusp does not cover its own ostium. */

  const SL = {
    aortic: { sol: AO, cusps: [
      { key: 'aortic_right',       th: 0 },
      { key: 'aortic_left',        th: 120 * DEG },
      { key: 'aortic_noncoronary', th: 240 * DEG }] },
    pulmonary: { sol: PU, cusps: [
      { key: 'pulmonary_anterior', th: 180 * DEG },
      { key: 'pulmonary_right',    th: 60 * DEG },
      { key: 'pulmonary_left',     th: 300 * DEG }] }
  };
  const CUSP_HALF = 60 * DEG;

  /** local origin at the COMMISSURAL (sinotubular) plane; the site sits at the crown nadir */
  const slOrigin = which => new T.Vector3().copy(FR[which].c).addScaledVector(FR[which].n, STATED[which].crown);

  function cuspHinge(which, thk, u, out) {
    const F = FR[which], R = STATED.annulus[which], s = STATED[which];
    const th = thk + (2 * u - 1) * CUSP_HALF;
    const co = Math.cos(1.5 * (th - thk));
    const z = -s.crown * co * co;
    return (out || new T.Vector3()).copy(slOrigin(which))
      .addScaledVector(F.a1, R * Math.cos(th)).addScaledVector(F.a2, R * Math.sin(th))
      .addScaledVector(F.n, z);
  }
  function cuspFreeClosed(which, thk, u, out) {
    const F = FR[which], R = STATED.annulus[which], s = STATED[which];
    const O = slOrigin(which);
    const lo = new T.Vector3().copy(O).addScaledVector(F.a1, R * Math.cos(thk - CUSP_HALF))
                                     .addScaledVector(F.a2, R * Math.sin(thk - CUSP_HALF));
    const hi = new T.Vector3().copy(O).addScaledVector(F.a1, R * Math.cos(thk + CUSP_HALF))
                                     .addScaledVector(F.a2, R * Math.sin(thk + CUSP_HALF));
    const N = new T.Vector3().copy(O).addScaledVector(F.a1, 0.055 * R * Math.cos(thk))
                                     .addScaledVector(F.a2, 0.055 * R * Math.sin(thk))
                                     .addScaledVector(F.n, -s.sag);
    /* A QUADRATIC THROUGH THE NODULE, NOT TWO STRAIGHT SEGMENTS.  Drawn as a V — commissure, nodule,
       commissure — the free edge has a KINK at the nodule, and a kink in the boundary of a sheet is a
       crease in the sheet: the column of quads either side of it disagreed with their own normals, at
       winding 0.933 on all six cusps in DIASTOLE only, which is the only time the shut edge exists.
       The control point is placed so the curve still passes exactly through the nodule, so nothing the
       solver was told about closure changes — only the crease goes. */
    out = out || new T.Vector3();
    const P = N.clone().multiplyScalar(2).addScaledVector(lo, -0.5).addScaledVector(hi, -0.5);
    const q = 1 - u;
    return out.set(0, 0, 0).addScaledVector(lo, q * q).addScaledVector(P, 2 * q * u).addScaledVector(hi, u * u);
  }
  /* how far the OPEN free edge must stand proud of the annulus, solved so its length is the length it
     has when shut.  A separate number from the sinus radius, which is set by the cusp's MERIDIAN. */
  const PROUD_EDGE = {};
  (function () {
    for (const which of ['aortic', 'pulmonary']) {
      const R = STATED.annulus[which];
      /* measured off the curve the model actually draws, rather than off the straight-line idealisation
         in solveSemilunar — the two differ by a couple of per cent since the edge was smoothed, and an
         inextensibility constraint fed the wrong length is not a constraint */
      let want = 0;
      { const a = new T.Vector3(), b2 = new T.Vector3();
        for (let i = 0; i <= 80; i++) { cuspFreeClosed(which, SL[which].cusps[0].th, i / 80, b2);
          if (i) want += b2.distanceTo(a); a.copy(b2); } }
      SL[which].sol.freeEdgeLengthDrawn = want;
      const lenOf = d => {
        let L = 0; const p = new T.Vector3(), q = new T.Vector3();
        for (let i = 0; i <= 40; i++) {
          const u = i / 40, th = (2 * u - 1) * CUSP_HALF, r = R + d * Math.sin(Math.PI * u);
          q.set(r * Math.cos(th), r * Math.sin(th), 0);
          if (i) L += q.distanceTo(p);
          p.copy(q);
        }
        return L;
      };
      PROUD_EDGE[which] = bisect(d => lenOf(d) - want, 0, R, 50);
    }
  })();

  function cuspFreeOpen(which, thk, u, out) {
    const F = FR[which], R = STATED.annulus[which];
    const th = thk + (2 * u - 1) * CUSP_HALF;
    const r = R + PROUD_EDGE[which] * Math.sin(Math.PI * u);
    return (out || new T.Vector3()).copy(slOrigin(which))
      .addScaledVector(F.a1, r * Math.cos(th)).addScaledVector(F.a2, r * Math.sin(th));
  }

  const CUSP_BILLOW = 1.02;        // a shut cusp is under tension and very nearly flat
  function cuspAt(which, thk, phi, u) {
    const F = FR[which];
    const A = cuspHinge(which, thk, u);
    const Ec = cuspFreeClosed(which, thk, u);
    const Eo = cuspFreeOpen(which, thk, u);
    /* a cusp tapers to nothing at its commissures; the floor keeps the patch from collapsing to a
       point, where a surface has no normal and no reliable orientation */
    const mm = Math.max(0.20, A.distanceTo(Ec) * CUSP_BILLOW);
    const Efree = Eo.clone().lerp(Ec, phi);
    const th = thk + (2 * u - 1) * CUSP_HALF;
    const rHat = radial(F, th);
    /* WHERE THE CUSP LEAVES ITS CROWN, AND WHY IT IS NOT SIMPLY "UPWARDS".
       Beside a commissure the crown itself rises almost vertically — that is what a crown IS — so a
       cusp told to leave it "up and 20 degrees out" leaves it ALONG its own attachment line.  The
       surface has no width there, the quad is a crease, and its face normal takes whichever sign the
       arithmetic happens to give: measured as winding 0.963 on all six cusps, entirely in the hinge
       row, entirely in the columns either side of the middle, and unmoved by two earlier fixes aimed
       at the winding itself.  The cusp must leave its crown ACROSS the crown.  This is 2.3's rule
       reaching further than 2.3 states it: a normal is only as good as the surface under it. */
    const dth = 0.03;
    const cAx = new T.Vector3().subVectors(cuspHinge(which, thk, Math.min(1, u + dth)),
                                           cuspHinge(which, thk, Math.max(0, u - dth))).normalize();
    let T0 = new T.Vector3().addScaledVector(F.n, Math.cos(20 * DEG)).addScaledVector(rHat, Math.sin(20 * DEG)).normalize();
    T0 = orth(T0, cAx) || orth(new T.Vector3().subVectors(Efree, A), cAx) || T0;
    let T1 = new T.Vector3().subVectors(Efree, A).normalize().addScaledVector(F.n, 0.30).normalize();
    T1 = orth(T1, cAx) || T1;
    const prof = solveProfile(A, T0, Efree, T1, mm);
    return { A: A, E: Efree, T0: T0, T1: T1, k: prof.k, L: mm, reach: prof.reach, chord: prof.chord };
  }

  function cuspSurface(which, thk, phi) {
    const nu = 22, nv = 10, pad = 0.030;
    const cache = [];
    for (let i = 0; i <= nu; i++) cache.push(cuspAt(which, thk, phi, pad + (1 - 2 * pad) * i / nu));
    const p1 = new T.Vector3(), p2 = new T.Vector3();
    return sheetSolid(function (u, v, out) {
      const x = u * nu, i = Math.max(0, Math.min(nu, Math.floor(x))), s = Math.min(1, x - i);
      const g = cache[i], h2 = cache[Math.min(nu, i + 1)];
      const A = g.A.clone().lerp(h2.A, s), E = g.E.clone().lerp(h2.E, s);
      const k = g.k + (h2.k - g.k) * s;
      const T0 = g.T0.clone().lerp(h2.T0, s).normalize(), T1 = g.T1.clone().lerp(h2.T1, s).normalize();
      p1.copy(A).addScaledVector(T0, k);
      p2.copy(E).addScaledVector(T1, -k);
      return bezier(A, p1, p2, E, v, out);
    }, nu, nv, function (u, v) {
      return 0.056 * Math.pow(Math.sin(Math.PI * u), 0.45) * (1 - 0.72 * v * v);
    });
  }

  /** The root: three sinuses of Valsalva between the crown and the sinotubular junction, then a short
      length of plain artery above it.  The bulge is the SOLVED stand-proud distance, so the sinus is
      the size the cusp needs rather than the size that looked right. */
  function rootShell(which) {
    const F = FR[which], R = STATED.annulus[which], s = STATED[which], sol = SL[which].sol;
    const O = slOrigin(which), above = 1.05;
    const zTop = above, zBot = -s.crown, span = zTop - zBot;
    const sSTJ = s.crown / span;
    const lobe = th => {
      let best = 0;
      for (const c of SL[which].cusps) {
        let d = th - c.th; while (d > Math.PI) d -= 2 * Math.PI; while (d < -Math.PI) d += 2 * Math.PI;
        if (Math.abs(d) <= CUSP_HALF) best = Math.max(best, Math.cos(1.5 * d) * Math.cos(1.5 * d));
      }
      return best;
    };
    const wall = 0.085;
    const mid = (u, v, out) => {
      const th = u * 2 * Math.PI, z = zBot + v * span;
      const bulge = v < sSTJ ? Math.sin(Math.PI * v / sSTJ) : 0;
      const r = R + sol.standProud * lobe(th) * bulge + wall / 2;
      return out.copy(O).addScaledVector(F.a1, r * Math.cos(th))
                        .addScaledVector(F.a2, r * Math.sin(th)).addScaledVector(F.n, z);
    };
    return sheetSolid(mid, 60, 18, wall, true);
  }

  /* ============================================================ 9 · THE FIBROUS SKELETON */

  /** WHERE THE RING ACTUALLY RUNS — the curve the ring's tube is swept along, WITHOUT the tube.
      Pulled out of annulusRing 2026-09-29 (round 3) so the screen-plane probe in section 12a can
      measure the drawn ring rather than a second description of it: annulusRing sweeps exactly this
      function, so a measurement here cannot drift away from the geometry a student sees. */
  function annulusPointAt(which, n) {
    const F = FR[which], R = STATED.annulus[which];
    if (which === 'aortic' || which === 'pulmonary') {
      /* the semilunar "annulus" is the crown itself — drawn as the crown, because drawing it as a
         ring is the misconception beat 10 exists to correct */
      return i => {
        const th = (i / n) * 2 * Math.PI;
        let best = 0;
        for (const c of SL[which].cusps) {
          let d = th - c.th; while (d > Math.PI) d -= 2 * Math.PI; while (d < -Math.PI) d += 2 * Math.PI;
          if (Math.abs(d) <= CUSP_HALF) best = Math.max(best, Math.cos(1.5 * d) * Math.cos(1.5 * d));
        }
        return new T.Vector3().copy(slOrigin(which))
          .addScaledVector(F.a1, R * Math.cos(th)).addScaledVector(F.a2, R * Math.sin(th))
          .addScaledVector(F.n, -STATED[which].crown * best);
      };
    }
    return i => {
      const th = (i / n) * 2 * Math.PI;
      return at(F, R, th, hingeDepth(which, th));
    };
  }

  /** the ring's centreline, sampled — the same curve, at whatever resolution a probe wants */
  function annulusCentreline(which, n) {
    const N = n || 256, f = annulusPointAt(which, N), pts = [];
    for (let i = 0; i < N; i++) pts.push(f(i));
    return pts;
  }

  function annulusRing(which) {
    const n = 64;
    const tubeR = (which === 'aortic' || which === 'pulmonary') ? 0.085 : 0.095;
    return ringOf(annulusPointAt(which, n), tubeR, n);
  }

  /** Right and left fibrous trigones plus the aortomitral curtain — the block of collagen that ties
      the aortic root to the mitral annulus and carries the conducting bundle through it. */
  function trigones() {
    const A = FR.aortic, M = FR.mitral, Tv = FR.tricuspid;
    const aPt = th => at(A, STATED.annulus.aortic, th, -STATED.aortic.crown * 0.4);
    const mPt = th => at(M, STATED.annulus.mitral, th, 0);
    const tPt = th => at(Tv, STATED.annulus.tricuspid, th, 0);
    const bridge = (p, q, r) => rod([p, p.clone().lerp(q, 0.35).addScaledVector(UP, -0.10),
                                     p.clone().lerp(q, 0.65).addScaledVector(UP, -0.10), q],
                                    () => r, { ring: 10 });
    const near = (F, other) => {
      let best = 0, bd = 1e9;
      for (let i = 0; i < 72; i++) {
        const th = i / 72 * 2 * Math.PI, d = at(F, STATED.annulus[F === FR.aortic ? 'aortic' : 'mitral'], th, 0).distanceTo(other);
        if (d < bd) { bd = d; best = th; }
      }
      return best;
    };
    const thA = near(A, M.c), thM = near(M, A.c);
    const parts = [];
    for (const s of [-0.55, 0.55]) {
      parts.push(bridge(aPt(thA + s), mPt(thM + s * 0.8), 0.12));
    }
    parts.push(bridge(aPt(thA), mPt(thM), 0.15));                    // aortomitral continuity
    /* the right fibrous trigone continues into the central fibrous body, between the aortic root and
       the tricuspid annulus — the block the atrioventricular bundle pierces */
    let thAT = 0, bd = 1e9;
    for (let i = 0; i < 72; i++) {
      const th = i / 72 * 2 * Math.PI, d = aPt(th).distanceTo(Tv.c);
      if (d < bd) { bd = d; thAT = th; }
    }
    let thTA = 0; bd = 1e9;
    for (let i = 0; i < 72; i++) {
      const th = i / 72 * 2 * Math.PI, d = tPt(th).distanceTo(A.c);
      if (d < bd) { bd = d; thTA = th; }
    }
    parts.push(bridge(aPt(thAT), tPt(thTA), 0.13));
    return mergeGeos(parts.filter(Boolean));
  }

  /* ============================================================ 10 · MUSCLE, CHORDAE, CONTEXT */

  function papillaryGeo(which, p) {
    const F = FR[which];
    const tip = papTip(which, p);
    const baseR = p.r * 1.55, base = at(F, baseR, p.th, p.d + 2.05 * p.big);
    const mid = at(F, p.r * 1.25, p.th, p.d + 1.0 * p.big);
    return rod([base, mid, tip.clone().addScaledVector(F.n, 0.18), tip],
      s => (0.52 * p.big) * Math.pow(1 - s, 0.55) + 0.055, { ring: 16, bulge: 0.7 });
  }

  function chordaeGeo(which, phi, keep) {
    const F = FR[which];
    const parts = [];
    for (const c of CHORDS[which]) {
      if (keep && !keep(c)) continue;
      const g = leafletAt(which, c.lf, phi, c.u);
      /* a slack chord sags AWAY from the valve axis and downwards — it is floating in the inflow,
         not hanging in still air */
      const sagDir = new T.Vector3().addScaledVector(F.n, 0.75).addScaledVector(g.rHat, 0.65).normalize();
      const path = chordPath(c.tip, g.E, c.rest, sagDir, 7);
      parts.push(rod(path.pts, s => 0.030 - 0.008 * s, { ring: 6, bulge: 0.6 }));
    }
    return mergeGeos(parts.filter(Boolean));
  }

  /* ====================================== 10a · THE LONG-AXIS SECTION THROUGH THE MITRAL VALVE

     WHY THIS EXISTS.  Review round 1 found that beat 5 narrates two measurements — the coaptation
     line sitting a few millimetres BELOW the annular plane, and sitting POSTERIOR of the annular
     centre — which this model PREDICTS correctly (acceptance rows A and B) and which NO camera in
     the scene could show.  That was re-measured before anything was written here rather than taken
     on trust: the shut valve was rendered from all six of the player's view directions and it is a
     closed dome from every one of them, with the line where the two leaflets meet inside it.  The
     player cannot cut a leaflet either — CROSS_SECTION clips only structures whose role is
     'context' — so the cut has to be GEOMETRY, and geometry is this file's job.

     WHERE THE CUT IS.  Through the mitral annular centre, normal to the COMMISSURE-TO-COMMISSURE
     axis.  That is not a convenient plane, it is the plane the measurement is defined in.  The
     commissures sit at th = +/- MITRAL_HALF, so the chord between them is exactly 2 sin(MITRAL_HALF)
     times the frame's a2; the plane normal to a2 through the centre therefore contains the valve
     axis and the antero-posterior in-plane axis, and cuts BOTH leaflets through their middles — A2
     and P2, which is the echocardiographic long axis and the view in which coaptation depth is
     actually measured in a patient.  The deepest point of the solved coaptation curve lies in this
     plane by construction (`coaptation` puts it at w = 0), so the cut goes through the very point
     the beat is about rather than near it.

     WHICH HALF SURVIVES IS DERIVED, NOT PICKED.  The camera for this beat looks from ventral (+z) —
     the player's `anterior`, and the closest of its six fixed directions to the commissural axis, at
     28.7 degrees off it.  The half that survives is the one the camera is NOT on, so what the camera
     sees is the cut face.  Written as a computation rather than a sign, so that re-siting the valve
     moves the cut instead of silently inverting the picture.                                       */

  const SECTION = (function () {
    const F = FR.mitral;
    const ventral = V(0, 0, 1);                       // AXES.ventral — where the `anterior` camera sits
    const d = F.a2.dot(ventral);
    return {
      origin: F.c.clone(), normal: F.a2.clone(),
      keep: d > 0 ? -1 : +1,
      /* how far the `anterior` camera is from looking straight down the cut plane's normal.  Reported
         so a reviewer can see the number rather than the adjective, and asserted in acceptance. */
      obliquityDeg: Math.acos(Math.min(1, Math.abs(d))) * 180 / Math.PI
    };
  })();

  /** Where along a leaflet's azimuth the cut plane crosses it.  SOLVED rather than assumed to be the
      middle: it IS the middle for both mitral leaflets as they are laid out today, and a later change
      to either span would move it.  Throws rather than guessing if a leaflet does not cross once. */
  function sectionSplitU(lf) {
    const f = u => Math.sin(lf.th0 + (lf.th1 - lf.th0) * u);
    if (f(0) === 0 || f(1) === 0 || (f(0) < 0) === (f(1) < 0))
      throw new Error('heart-valves: ' + lf.key + ' does not cross the long-axis section plane exactly once');
    return bisect(f, 0, 1, 60);
  }

  /** the u-range of the half of `lf` that survives the cut */
  function sectionRange(lf) {
    const us = sectionSplitU(lf);
    const endSide = Math.sin(lf.th1) > 0 ? 1 : -1;
    return endSide === SECTION.keep ? [us, 1] : [0, us];
  }

  function sectionLeaflet(lfKey, phi) {
    const lf = AV_LEAFLETS.mitral.filter(l => l.key === lfKey)[0];
    const r = sectionRange(lf);
    return leafletSurfaceRange('mitral', lf, phi, r[0], r[1], 18, 12);
  }

  /** The surviving half of the annular ring, as an open arc from one crossing of the cut plane to
      the other — so the near half of the ring is not standing in front of the cut face. */
  function sectionAnnulus() {
    const F = FR.mitral, R = STATED.annulus.mitral, n = 40;
    const th0 = SECTION.keep > 0 ? 0 : Math.PI;
    const pts = [];
    for (let i = 0; i <= n; i++) {
      const th = th0 + Math.PI * (i / n);
      pts.push(at(F, R, th, hingeDepth('mitral', th)));
    }
    return rod(pts, () => 0.095, { ring: 12 });
  }

  /** THE ANNULAR PLANE, AS A LINE.  Seen in the long axis the annulus is two points, and the
      clinical measurement is the perpendicular from the line joining them down to the point where
      the leaflets meet.  Drawing that line is what turns "a few millimetres below the annulus" from
      a sentence into a distance on the screen — and it is also the line a dilated ventricle drags
      the leaflets away from, which is the pathology the beat goes on to name. */
  function sectionAnnularLine() {
    const F = FR.mitral, R = STATED.annulus.mitral;
    const A = at(F, R, 0, hingeDepth('mitral', 0));
    const P = at(F, R, Math.PI, hingeDepth('mitral', Math.PI));
    return rod([A, A.clone().lerp(P, 0.5), P], () => 0.042, { ring: 10 });
  }

  /** A cord is kept only if BOTH its ends are in the surviving half.  One that crossed the cut would
      hang in the space the removed half used to occupy, which is worse than its absence. */
  function sectionKeepsChord(c) {
    const th = c.lf.th0 + (c.lf.th1 - c.lf.th0) * c.u;
    return (Math.sin(th) > 0 ? 1 : -1) === SECTION.keep
        && (Math.sin(c.pap.th) > 0 ? 1 : -1) === SECTION.keep;
  }

  /** Translucent ventricular walls, so the valves have somewhere to be.  Behind a flag and OFF by
      default — it is scaffolding, and every beat that is about the valves themselves turns it off. */
  function chamberGhost() {
    const parts = [];
    const mk = (which, len, r0, r1) => {
      const F = FR[which];
      const pts = [];
      for (let i = 0; i <= 8; i++) {
        const s = i / 8;
        pts.push(at(F, 0, 0, 0.12 + s * len).addScaledVector(F.a1, -0.35 * s * s));
      }
      return rod(pts, s => r0 + (r1 - r0) * Math.pow(s, 0.75), { ring: 20 });
    };
    parts.push(mk('mitral', 6.6, 1.95, 0.42));
    parts.push(mk('tricuspid', 5.6, 2.05, 0.40));
    return mergeGeos(parts.filter(Boolean));
  }

  function ostium(which, thk, name) {
    const F = FR[which], R = STATED.annulus[which], sol = SL[which].sol;
    const s = STATED[which], span = 1.05 + s.crown, sSTJ = s.crown / span;
    const v = sSTJ * 0.78, z = -s.crown + v * span;
    const bulge = Math.sin(Math.PI * v / sSTJ);
    const r = R + sol.standProud * bulge;
    const O = slOrigin(which), rHat = radial(F, thk);
    const p0 = new T.Vector3().copy(O).addScaledVector(rHat, r - 0.06).addScaledVector(F.n, z);
    const p1 = new T.Vector3().copy(O).addScaledVector(rHat, r + 0.34).addScaledVector(F.n, z + 0.10);
    return rod([p0, p1], () => 0.115, { ring: 12, bulge: 0.5 });
  }

  /* ============================================================ 11 · LAYERS AND BUILD */

  const LAYERS = {
    mitral_anterior:     { color: 0xefe6d2, name: 'Anterior (aortic) leaflet of mitral valve' },
    mitral_posterior:    { color: 0xe7dcc2, name: 'Posterior (mural) leaflet of mitral valve' },
    tricuspid_anterior:  { color: 0xe9dfc8, name: 'Anterior leaflet of tricuspid valve' },
    tricuspid_posterior: { color: 0xded2b6, name: 'Posterior leaflet of tricuspid valve' },
    tricuspid_septal:    { color: 0xf1e8d4, name: 'Septal leaflet of tricuspid valve' },
    aortic_right:        { color: 0xf4eede, name: 'Right coronary cusp of aortic valve' },
    aortic_left:         { color: 0xeae2ce, name: 'Left coronary cusp of aortic valve' },
    aortic_noncoronary:  { color: 0xdfd6bd, name: 'Non-coronary cusp of aortic valve' },
    pulmonary_anterior:  { color: 0xeee7d6, name: 'Anterior cusp of pulmonary valve' },
    pulmonary_right:     { color: 0xe3dac4, name: 'Right cusp of pulmonary valve' },
    pulmonary_left:      { color: 0xd9d0b8, name: 'Left cusp of pulmonary valve' },
    annulus_mitral:      { color: 0xd8c893, name: 'Mitral annulus' },
    annulus_tricuspid:   { color: 0xcfbe86, name: 'Tricuspid annulus' },
    annulus_aortic:      { color: 0xe2d29c, name: 'Aortic annulus (the crown)' },
    annulus_pulmonary:   { color: 0xd3c48f, name: 'Pulmonary annulus (the crown)' },
    trigones:            { color: 0xc9b878, name: 'Fibrous trigones & central fibrous body' },
    chordae_mitral:      { color: 0xf3edda, name: 'Chordae tendineae of mitral valve' },
    chordae_tricuspid:   { color: 0xece5d0, name: 'Chordae tendineae of tricuspid valve' },
    pap_anterolateral:   { color: 0x9c2731, name: 'Anterolateral papillary muscle' },
    pap_posteromedial:   { color: 0x8a1f28, name: 'Posteromedial papillary muscle' },
    papillary_rv:        { color: 0x93242e, name: 'Papillary muscles of the right ventricle' },
    aortic_root:         { color: 0xb0342f, name: 'Aortic root & sinuses of Valsalva' },
    pulmonary_root:      { color: 0x35659f, name: 'Pulmonary root & sinuses' },
    ostium_left:         { color: 0xd8452f, name: 'Left coronary ostium' },
    ostium_right:        { color: 0xd8452f, name: 'Right coronary ostium' },
    chamber_ghost:       { color: 0x7c3b44, name: 'Ventricular walls (context)' },
    /* the long-axis section, section 10a.  Same colours as the whole leaflets they are halves of:
       they are the same tissue, and a student should not have to learn a second palette to read a
       cut through something they have already met. */
    mitral_anterior_cut:  { color: 0xefe6d2, name: 'Anterior mitral leaflet, in long-axis section' },
    mitral_posterior_cut: { color: 0xe7dcc2, name: 'Posterior mitral leaflet, in long-axis section' },
    annulus_mitral_cut:   { color: 0xd8c893, name: 'Mitral annulus, sectioned half' },
    chordae_mitral_cut:   { color: 0xf3edda, name: 'Chordae tendineae, sectioned half' },
    annular_plane_line:   { color: 0xffcf5c, name: 'The annular plane, seen edge-on' }
  };

  const DEFAULTS = { ghost: false, roots: true, chordae: true, papillary: true, skeleton: true };
  const FULL = { ghost: true, roots: true, chordae: true, papillary: true, skeleton: true };

  function build(t, opts) {
    const o = Object.assign({}, DEFAULTS, opts || {});
    const tt = (typeof t === 'number' && isFinite(t)) ? t : 1;
    const phi = valveState(tt);
    const g = new T.Group();
    g.userData.model = 'heart-valves';
    g.userData.t = tt;
    g.userData.axes = AXES;

    const add = (key, geo, over) => {
      if (!geo) return null;
      const l = LAYERS[key] || {};
      return K.addSolid(g, key, geo, Object.assign({ color: l.color, name: l.name, outline: 0.020 }, over || {}));
    };

    /* --- atrioventricular leaflets --- */
    for (const which of ['mitral', 'tricuspid']) {
      for (const lf of AV_LEAFLETS[which]) add(lf.key, leafletSurface(which, lf, phi[which]));
    }
    /* --- semilunar cusps --- */
    for (const which of ['aortic', 'pulmonary']) {
      for (const c of SL[which].cusps) add(c.key, cuspSurface(which, c.th, phi[which]));
    }
    /* --- fibrous skeleton --- */
    if (o.skeleton) {
      add('annulus_mitral', annulusRing('mitral'));
      add('annulus_tricuspid', annulusRing('tricuspid'));
      add('annulus_aortic', annulusRing('aortic'));
      add('annulus_pulmonary', annulusRing('pulmonary'));
      add('trigones', trigones());
    }
    /* --- muscle and cord --- */
    if (o.papillary) {
      const mp = papillaries('mitral');
      add('pap_anterolateral', papillaryGeo('mitral', mp[0]));
      add('pap_posteromedial', papillaryGeo('mitral', mp[1]));
      add('papillary_rv', mergeGeos(papillaries('tricuspid').map(p => papillaryGeo('tricuspid', p)).filter(Boolean)));
    }
    if (o.chordae) {
      add('chordae_mitral', chordaeGeo('mitral', phi.mitral), { outline: 0.010 });
      add('chordae_tricuspid', chordaeGeo('tricuspid', phi.tricuspid), { outline: 0.010 });
    }
    /* --- roots --- */
    if (o.roots) {
      add('aortic_root', rootShell('aortic'), { matOver: { transparent: true, opacity: 0.42 }, outline: 0.016 });
      add('pulmonary_root', rootShell('pulmonary'), { matOver: { transparent: true, opacity: 0.42 }, outline: 0.016 });
      add('ostium_left', ostium('aortic', SL.aortic.cusps[1].th));
      add('ostium_right', ostium('aortic', SL.aortic.cusps[0].th));
    }
    if (o.ghost) add('chamber_ghost', chamberGhost(), { matOver: { transparent: true, opacity: 0.16 }, noOutline: true });
    /* --- the long-axis section (10a) ---
       Built ALWAYS, not behind a flag.  A flag would have to be turned on from the scene, and the
       only way a scene can do that is the ref's `+flag` suffix, which decides whether the geometry
       EXISTS and not whether a beat shows it — so the flag would buy nothing and would give a ref
       written without it a silent `reason:'none'`, which the player shows a student as "there is no
       model of this".  These five parts cost about a tenth of the model's triangles. */
    add('mitral_anterior_cut', sectionLeaflet('mitral_anterior', phi.mitral));
    add('mitral_posterior_cut', sectionLeaflet('mitral_posterior', phi.mitral));
    if (o.skeleton) {
      add('annulus_mitral_cut', sectionAnnulus());
      add('annular_plane_line', sectionAnnularLine(), { outline: 0.012 });
    }
    if (o.chordae) add('chordae_mitral_cut', chordaeGeo('mitral', phi.mitral, sectionKeepsChord), { outline: 0.010 });
    return g;
  }

  /** Everything a narration or a probe might want to say about the model at t, from the same numbers
      the geometry is built from. */
  function atT(t) {
    const phi = valveState(t);
    return { t: t, phase: phaseOf(t), closure: phi,
             open: { mitral: 1 - phi.mitral, tricuspid: 1 - phi.tricuspid,
                     aortic: 1 - phi.aortic, pulmonary: 1 - phi.pulmonary } };
  }

  /* ============================================================ 12 · ACCEPTANCE

     Three things this block is built to obey, all of them written into RENDER-STANDARD by earlier
     review rounds that were burned by their absence:

       · EVERY SPATIAL CLAIM CARRIES A MAGNITUDE FLOOR, expressed as a fraction of the extent of the
         structures compared.  `> 0` is not a test: a review found "ventricle centroid x > 0" passing
         at five per cent of the chamber's own width.
       · EVERY ROW HAS A NEGATIVE CASE — a deliberately wrong value the same predicate must REJECT.
         A test that grades in the wrong units launders a defect into a proof.
       · PREDICTED rows are kept apart from STATED and STRUCTURAL ones.  Nothing in the solve aims at
         a predicted row, so it is the only kind that can actually fail.                             */

  function probeInextensible() {
    let worst = 0, where = '';
    const ts = [0, 0.09, 0.18, 0.215, 0.25, 0.30, 0.42, 0.54, 0.56, 0.62, 0.70, 0.90];
    const p1 = new T.Vector3(), p2 = new T.Vector3();
    const measure = (g) => {
      p1.copy(g.A).addScaledVector(g.T0, g.k);
      p2.copy(g.E).addScaledVector(g.T1, -g.k);
      return bezierLength(g.A, p1, p2, g.E);
    };
    for (const t of ts) {
      const phi = valveState(t);
      for (const which of ['mitral', 'tricuspid']) {
        for (const lf of AV_LEAFLETS[which]) for (const u of [0.15, 0.35, 0.5, 0.65, 0.85]) {
          const g = leafletAt(which, lf, phi[which], u);
          const d = Math.abs(measure(g) - g.L) / g.L;
          if (d > worst) { worst = d; where = lf.key + '@u' + u + ',t' + t; }
        }
      }
      for (const which of ['aortic', 'pulmonary']) {
        for (const c of SL[which].cusps) for (const u of [0.25, 0.5, 0.75]) {
          const g = cuspAt(which, c.th, phi[which], u);
          const d = Math.abs(measure(g) - g.L) / g.L;
          if (d > worst) { worst = d; where = c.key + '@u' + u + ',t' + t; }
        }
      }
    }
    return { worst: worst, where: where };
  }

  function probeChordae() {
    let stretch = -1e9, shutSag = 0, openSag = 0;
    for (const which of ['mitral', 'tricuspid']) {
      for (const t of [0, 0.1, 0.21, 0.235, 0.3, 0.35, 0.45, 0.55, 0.62, 0.7, 0.8, 0.95]) {
        const phi = valveState(t)[which];
        for (const c of CHORDS[which]) {
          const g = leafletAt(which, c.lf, phi, c.u);
          const d = c.tip.distanceTo(g.E) - c.rest;
          if (d > stretch) stretch = d;
          const path = chordPath(c.tip, g.E, c.rest, new T.Vector3(0, -1, 0), 3);
          /* shut: EVERY cord must be straight, so take the worst sag.  open: it is enough — and it is
             the truth — that SOME cords are visibly slack, so take the best.  Asking every cord to be
             slack in diastole would fail on the one that is holding the leaflet back, which is the
             cord doing the work. */
          if (t >= 0.30 && t <= 0.45) shutSag = Math.max(shutSag, path.sagitta);
          if (t >= 0.78 && t <= 0.90) openSag = Math.max(openSag, path.sagitta);
        }
      }
    }
    return { maxStretch: stretch, sagShut: shutSag, sagOpen: openSag };
  }

  /** NO PROLAPSE: with the valve shut, not one point of the leaflet MID-SURFACE stands above the plane
      its own hinge sits in.  Measured on the mid-surface rather than the thickened solid, so the
      number is about the anatomy and not about how thick the sheet is drawn. */
  function probeProlapse() {
    let worst = -1e9, where = '';
    const p1 = new T.Vector3(), p2 = new T.Vector3(), q = new T.Vector3(), d = new T.Vector3();
    for (const which of ['mitral', 'tricuspid']) {
      const F = FR[which];
      for (const lf of AV_LEAFLETS[which]) {
        for (let i = 0; i <= 20; i++) {
          const g = leafletAt(which, lf, 1, i / 20);
          p1.copy(g.A).addScaledVector(g.T0, g.k);
          p2.copy(g.E).addScaledVector(g.T1, -g.k);
          for (let j = 0; j <= 12; j++) {
            bezier(g.A, p1, p2, g.E, j / 12, q);
            const above = -d.subVectors(q, F.c).dot(F.n);        // F.n points DOWN into the ventricle
            if (above > worst) { worst = above; where = lf.key; }
          }
        }
      }
    }
    return { maxAbovePlane: worst, where: where };
  }

  /** THE SECTION, MEASURED ON THE MESH IT ACTUALLY BUILDS.
      Rows A and B say the SOLVER puts the coaptation line 0.40-1.00 cm below the annular plane and
      well posterior of its centre.  They were both passing throughout the round in which the review
      found that nobody could SEE either fact, which is exactly why these rows exist separately: they
      measure the two distances on the vertices of the sectioned leaflets, against the annular line
      the same build draws, in the plane the student is looking at.  A model whose solver was right
      and whose picture was wrong would pass A and B and fail these. */
  /** The same two distances read off the section's MID-SURFACE, with no geometry built.
      Two reasons it exists beside the mesh probe.  It is what `claimMeasure` can use — the beat-claim
      checker runs the model in a bare sandbox with no VizKit, so anything that calls build() is out
      of reach there.  And the two are cross-checked against each other in acceptance, so the cheap
      one cannot quietly stop describing the expensive one. */
  function sectionProfile(t) {
    const phi = valveState(t), F = FR.mitral, R = STATED.annulus.mitral;
    const A = at(F, R, 0, hingeDepth('mitral', 0));
    const P = at(F, R, Math.PI, hingeDepth('mitral', Math.PI));
    const mid = A.clone().lerp(P, 0.5);
    const axis = new T.Vector3().subVectors(P, A).normalize();
    const p1 = new T.Vector3(), p2 = new T.Vector3(), q = new T.Vector3(), d = new T.Vector3();
    let deepest = -1e9, post = 0;
    for (const lf of AV_LEAFLETS.mitral) {
      const r = sectionRange(lf);
      for (let i = 0; i <= 24; i++) {
        const g = leafletAt('mitral', lf, phi.mitral, r[0] + (r[1] - r[0]) * (i / 24));
        p1.copy(g.A).addScaledVector(g.T0, g.k);
        p2.copy(g.E).addScaledVector(g.T1, -g.k);
        for (let j = 0; j <= 12; j++) {
          bezier(g.A, p1, p2, g.E, j / 12, q);
          const depth = d.subVectors(q, F.c).dot(F.n);        // F.n points DOWN into the ventricle
          if (depth > deepest) { deepest = depth; post = q.clone().sub(mid).dot(axis); }
        }
      }
    }
    return { deepest: deepest, posteriorOfCentre: post, annularLine_cm: A.distanceTo(P),
             solvedDepth: MC.hc, solvedPosterior: -MC.xc };
  }

  function probeSection(t) {
    const g = build(t, FULL);
    g.updateMatrixWorld(true);
    const F = FR.mitral, R = STATED.annulus.mitral;
    const A = at(F, R, 0, hingeDepth('mitral', 0));          // anterior hinge, in the cut plane
    const P = at(F, R, Math.PI, hingeDepth('mitral', Math.PI));  // posterior hinge, in the cut plane
    const mid = A.clone().lerp(P, 0.5);
    const axis = new T.Vector3().subVectors(P, A).normalize();   // anterior -> posterior, along the line
    const out = { deepest: -1e9, posteriorOfCentre: 0, worstSide: 1e9, verts: 0, keys: 0 };
    const v = new T.Vector3(), d = new T.Vector3(), w = new T.Vector3();
    g.traverse(o => {
      if (!o.isMesh || (o.userData || {}).outline) return;
      const k = o.userData.key;
      if (k !== 'mitral_anterior_cut' && k !== 'mitral_posterior_cut') return;
      out.keys++;
      const p = o.geometry.attributes.position;
      for (let i = 0; i < p.count; i++) {
        v.fromBufferAttribute(p, i).applyMatrix4(o.matrixWorld);
        out.verts++;
        d.subVectors(v, F.c);
        /* every vertex is on the surviving side of the cut, give or take the sheet's own half
           thickness — the slab straddles the mid-surface and the mid-surface is the cut */
        const side = d.dot(SECTION.normal) * SECTION.keep;
        if (side < out.worstSide) out.worstSide = side;
        const depth = d.dot(F.n);                             // F.n points DOWN into the ventricle
        if (depth > out.deepest) {
          out.deepest = depth;
          out.posteriorOfCentre = w.subVectors(v, mid).dot(axis);
        }
      }
    });
    out.annularLine_cm = A.distanceTo(P);
    out.solvedDepth = MC.hc;
    out.solvedPosterior = -MC.xc;
    out.profile = sectionProfile(t);
    /* the mesh is a SLAB straddling the mid-surface, so its deepest vertex stands below the
       mid-surface's deepest point by up to half the free edge's thickness — about 0.01 cm here */
    out.meshMinusProfile = out.deepest - out.profile.deepest;
    return out;
  }

  /* ====================================== 12a · CAN THE CAMERA THE BEAT USES SEE THE SHAPE?
     ------------------------------------------------------------------------------------------------
     Added 2026-09-29, round 3, against the review's section-4 proposal, and it is the SECOND time the
     same defect has been found here.  Round 1: beat 5 narrated a coaptation depth of 0.685 cm below
     the annular plane and a posterior offset of 0.34 R, both of which the model PREDICTED correctly
     and no camera in the scene could show, because a shut mitral valve is a closed dome and the
     coaptation line is inside it.  Round 2: beat 9 narrated the aortic and pulmonary annuli as
     CROWNS "dipping to the floor of each sinus and rising to each commissure" from a superior camera
     — and the whole crown excursion is 1.72 cm along the annular axis, which from above IS the view
     axis, so a crown and a flat ring are the same picture.

     Both models were right.  Every check in this file asks the MODEL a question; none asked the
     PICTURE one.  So: a beat that narrates a SHAPE must assert that the property varies ACROSS the
     screen plane of the camera that beat uses, and not down its view axis.  Row AB already did
     exactly this for the section's cut plane, so the machinery existed and was simply never applied
     to a shape claim.  These two measures are the general form of it, reachable from the scene
     through claimMeasure, so the assertion lives in the beat that makes the claim.                */

  /* viz3d.js's VIEW_DIR, COPIED EXACTLY (viz3d:2095).  If the player's cameras ever move, a probe
     that carried its own prettier directions would keep passing while the pictures changed. */
  const VIEW_DIR = { anterior: [0, 0, 1], posterior: [0, 0, -1], lateral: [1, 0, 0],
                     medial: [-1, 0, 0], superior: [0, 1, 0.001], inferior: [0, -1, 0.001] };
  /* built with the constructor rather than fromArray(): this model is also loaded by
     check-beat-claims.mjs against a deliberately minimal Vector3 stub, and a probe that needs a
     method the stub does not have would take the whole beat-claim check down at load time. */
  function viewAxis(view) {
    const d = VIEW_DIR[view];
    if (!d) throw new Error('heart-valves: no such player view direction: ' + view);
    return new T.Vector3(d[0], d[1], d[2]).normalize();
  }

  /** how much of a vector survives on screen once the view axis is taken out of it, cm */
  function acrossScreen(v, dir) {
    return new T.Vector3().copy(v).addScaledVector(dir, -v.dot(dir)).length();
  }

  /** THE CROWN EXCURSION: how far a semilunar annulus rises from the floor of a sinus to a
      commissure, measured ALONG THE RING'S OWN AXIS and on the curve the ring is swept along, cm.
      The axis matters and the straight line between the two points does not: the low and high
      points sit at different azimuths, so a lowest-to-highest VECTOR is mostly ring diameter and
      is nearly as long from above as from in front — which is the very confusion this probe
      exists to settle.  The crown IS the axial rise and fall; that is what a camera must show. */
  function crownExcursion(which) {
    const pts = annulusCentreline(which), n = FR[which].n;
    let dlo = Infinity, dhi = -Infinity;
    for (const p of pts) { const d = p.dot(n); if (d < dlo) dlo = d; if (d > dhi) dhi = d; }
    return dhi - dlo;
  }

  /** that same excursion as the SCREEN sees it: the rise is along the ring's axis, so what survives
      is the excursion times the sine of the angle between that axis and the view direction.  Down
      the axis (a superior camera on the aortic crown) a crown and a flat ring are the same picture,
      and this number says so in centimetres. */
  function crownAcrossScreen(which, dir) {
    const n = FR[which].n;
    return crownExcursion(which) * acrossScreen(n, dir);   // |n| is 1, so this is excursion * sin
  }

  /** the area a ring's centreline encloses once projected on to the screen plane of `view`, cm^2.
      A ring seen face-on gives its true area; the same ring seen edge-on gives nearly nothing, and
      "four sizes, compare them" is a claim about the first case only. */
  function ringScreenArea(which, dir) {
    const pts = annulusCentreline(which);
    let up = Math.abs(dir.y) > 0.99 ? new T.Vector3(0, 0, -1) : new T.Vector3(0, 1, 0);
    const right = new T.Vector3().crossVectors(up, dir).normalize();
    up = new T.Vector3().crossVectors(dir, right).normalize();
    let a = 0;
    for (let i = 0; i < pts.length; i++) {
      const p = pts[i], q = pts[(i + 1) % pts.length];
      a += p.dot(right) * q.dot(up) - q.dot(right) * p.dot(up);
    }
    return Math.abs(a) / 2;
  }

  /* ====================================== 12b · DO ANY TWO BUILT SOLIDS OCCUPY THE SAME SPACE?
     ------------------------------------------------------------------------------------------------
     The review's section-4 proposal (2), 2026-09-29: the sibling cardiac-cycle-pumping model proves
     its LV and RV casts do not interpenetrate and this model, with 31 parts, had no such row.  The
     review had already MEASURED one overlap by hand — the aortic and pulmonary roots share up to
     0.97 mm — and written it into gaps[13].  A hand measurement in a note is a claim; this makes it
     a row, so the known contact is pinned at its measured size and any NEW one fails.

     Parity ray-cast, five directions, majority of five — one direction alone is decided by a single
     grazing hit on a tangent.  Sampled rather than exhaustive (stride to at most SAMPLE vertices a
     part) because the point is to catch a solid inside another solid, not to chase one vertex; the
     sample size is reported so a reader can judge the resolution rather than guess it.             */
  const PENETRATION_SAMPLE = 260;
  const PEN_DIRS = [[1, 0.13, 0.07], [-0.11, 1, 0.09], [0.08, -0.12, 1],
                    [-1, 0.21, -0.17], [0.31, -1, 0.23]].map(d => new T.Vector3(d[0], d[1], d[2]).normalize());

  function probeInterpenetration(t) {
    const g = build(typeof t === 'number' ? t : 0.40, FULL);
    g.updateMatrixWorld(true);
    const parts = [];
    g.traverse(o => {
      if (!o.isMesh || !o.geometry) return;
      const u = o.userData || {};
      if (!u.key || u.outline) return;
      o.geometry.computeBoundingBox();
      const box = o.geometry.boundingBox.clone().applyMatrix4(o.matrixWorld);
      const pos = o.geometry.attributes.position;
      const stride = Math.max(1, Math.ceil(pos.count / PENETRATION_SAMPLE));
      const pts = [];
      for (let i = 0; i < pos.count; i += stride)
        pts.push(new T.Vector3().fromBufferAttribute(pos, i).applyMatrix4(o.matrixWorld));
      parts.push({ key: u.key, obj: o, box: box, pts: pts });
    });

    const rc = new T.Raycaster();
    rc.far = 1e4;
    const insideCount = (pt, target) => {
      let votes = 0;
      for (const d of PEN_DIRS) {
        rc.set(pt, d);
        const hits = rc.intersectObject(target, false);
        let n = 0;
        for (let i = 0; i < hits.length; i++) if (hits[i].distance > 1e-5) n++;
        if (n % 2 === 1) votes++;
      }
      return votes >= 3;
    };
    const depthInto = (pt, target) => {
      /* how far in it is: the shortest run to a surface along any of the five rays, both ways */
      let best = Infinity;
      for (const d of PEN_DIRS) {
        for (const sgn of [1, -1]) {
          rc.set(pt, new T.Vector3().copy(d).multiplyScalar(sgn));
          const hits = rc.intersectObject(target, false);
          for (let i = 0; i < hits.length; i++)
            if (hits[i].distance > 1e-5) { if (hits[i].distance < best) best = hits[i].distance; break; }
        }
      }
      return isFinite(best) ? best : 0;
    };

    const pairs = [];
    for (let i = 0; i < parts.length; i++) for (let j = i + 1; j < parts.length; j++) {
      const A = parts[i], B = parts[j];
      if (!A.box.intersectsBox(B.box)) continue;
      let inAB = 0, inBA = 0, depth = 0;
      for (const pt of A.pts) if (insideCount(pt, B.obj)) { inAB++; depth = Math.max(depth, depthInto(pt, B.obj)); }
      for (const pt of B.pts) if (insideCount(pt, A.obj)) { inBA++; depth = Math.max(depth, depthInto(pt, A.obj)); }
      if (!inAB && !inBA) continue;
      pairs.push({ a: A.key, b: B.key,
                   frac: Math.max(inAB / A.pts.length, inBA / B.pts.length),
                   sampled: [A.pts.length, B.pts.length], depth_cm: depth });
    }
    pairs.sort((x, y) => y.frac - x.frac);
    return { parts: parts.length, sample: PENETRATION_SAMPLE, pairs: pairs,
             worstFrac: pairs.length ? pairs[0].frac : 0,
             worstDepth: pairs.reduce((m, p) => Math.max(m, p.depth_cm), 0) };
  }

  function centres() {
    const out = {};
    for (const k of ['mitral', 'tricuspid', 'aortic', 'pulmonary']) {
      out[k] = { x: FR[k].c.x, y: FR[k].c.y, z: FR[k].c.z, r: STATED.annulus[k] };
    }
    return out;
  }

  function builtKeys() {
    const g = build(1, FULL), seen = {};
    g.traverse(o => { if (o.isMesh && o.userData && o.userData.key && !o.userData.outline) seen[o.userData.key] = true; });
    return Object.keys(seen).sort();
  }

  function acceptance() {
    const C = centres(), inx = probeInextensible(), ch = probeChordae(), pr = probeProlapse();
    /* measured at the t beat 5 stands at, because that is the beat the section is drawn for */
    const sec = probeSection(0.35);
    const keys = builtKeys(), want = Object.keys(LAYERS).sort();
    const missing = want.filter(k => keys.indexOf(k) < 0);

    const ev = STATED.events, S = CYCLE_S;
    const systole = (ev.aorticClose - ev.mitralClose) * S;
    const ivc = (ev.aorticOpen - ev.mitralClose) * S;
    const ivr = (ev.mitralOpen - ev.aorticClose) * S;

    /* magnitude floors, each a fraction of the extent of the two things compared */
    const floor = (a, b, ea, eb) => 0.35 * (ea + eb) / 2;
    const sepRL = C.mitral.x - C.tricuspid.x;                       // left valve minus right valve
    const floorRL = floor(0, 0, 2 * C.mitral.r, 2 * C.tricuspid.r);
    const sepAP = C.pulmonary.z - C.mitral.z;                       // most ventral minus most dorsal
    const floorAP = floor(0, 0, 2 * C.pulmonary.r, 2 * C.mitral.r);
    const sepSI = C.pulmonary.y - C.tricuspid.y;
    const floorSI = floor(0, 0, 2 * C.pulmonary.r, 2 * C.tricuspid.r);
    const ann = STATED.annulus;

    /* ---- WHICH MITRAL PAPILLARY MUSCLE IS WHICH, PINNED.  Added by review round 2, 2026-09-29.
            Review round 1 found these two TRANSPOSED and corrected it by swapping two `th` values.
            Nothing asserted the result: all 27 rows passed before that correction and all 27 passed
            after it, so a later edit could swap them back and no check in this file would notice.
            Which muscle is which is examinable rather than decorative - the POSTEROMEDIAL one has a
            single blood supply and is the one that ruptures after an inferior infarct - so the
            corrected fact now has a row of its own.  Measured on the TIPS, in the annular plane's
            own frame, which is where the correcting comment quoted its numbers. ---- */
    const _mp = papillaries('mitral');
    const _dAL = new T.Vector3().subVectors(papTip('mitral', _mp[0]), FR.mitral.c);
    const _dPM = new T.Vector3().subVectors(papTip('mitral', _mp[1]), FR.mitral.c);
    const papAP = [_dAL.dot(PE2), _dPM.dot(PE2)];       // + is anterior
    const papML = [_dAL.dot(PE1), _dPM.dot(PE1)];       // + is the patient's left, i.e. lateral for the LV

    /* ---- WHAT THE CAMERA CAN SEE OF A SHAPE (section 12a), and WHAT SHARES SPACE WITH WHAT
            (section 12b).  Both added 2026-09-29, round 3, against the review's section-4 proposals. ---- */
    const ORDER = ['tricuspid', 'mitral', 'pulmonary', 'aortic'];
    const dSup = viewAxis('superior'), dAnt = viewAxis('anterior');
    const areaSup = ORDER.map(w => ringScreenArea(w, dSup));
    const areaAnt = ORDER.map(w => ringScreenArea(w, dAnt));
    const areaTrue = ORDER.map(w => Math.PI * ann[w] * ann[w]);
    const ratios = a => [a[0] / a[1], a[1] / a[2], a[2] / a[3]];
    const crownEx = { aortic: crownExcursion('aortic'), pulmonary: crownExcursion('pulmonary') };
    const crownSup = { aortic: crownAcrossScreen('aortic', dSup), pulmonary: crownAcrossScreen('pulmonary', dSup) };
    const crownAnt = { aortic: crownAcrossScreen('aortic', dAnt), pulmonary: crownAcrossScreen('pulmonary', dAnt) };

    /* WHICH APPARATUS EACH PART BELONGS TO.  The question row AE asks is not "does anything touch
       anything" — a leaflet is continuous with its own annulus and its own cords, and every part of
       the model sits inside the ventricular ghost, which is what a ghost is for.  It is whether TWO
       DIFFERENT VALVES occupy the same space, which is a thing a student could be marked wrong for. */
    const APPARATUS = {
      mitral: ['mitral_anterior', 'mitral_posterior', 'annulus_mitral', 'chordae_mitral',
               'pap_anterolateral', 'pap_posteromedial', 'mitral_anterior_cut', 'mitral_posterior_cut',
               'annulus_mitral_cut', 'chordae_mitral_cut', 'annular_plane_line'],
      tricuspid: ['tricuspid_anterior', 'tricuspid_posterior', 'tricuspid_septal', 'annulus_tricuspid',
                  'chordae_tricuspid', 'papillary_rv'],
      aortic: ['aortic_right', 'aortic_left', 'aortic_noncoronary', 'annulus_aortic', 'aortic_root',
               'ostium_left', 'ostium_right'],
      pulmonary: ['pulmonary_anterior', 'pulmonary_right', 'pulmonary_left', 'annulus_pulmonary',
                  'pulmonary_root'],
      /* the trigones TIE the four together and the ghost CONTAINS them: both are meant to meet
         everything, so both are named here rather than quietly dropped from the pair list */
      shared: ['trigones', 'chamber_ghost']
    };
    const APPARATUS_OF = {};
    for (const g of Object.keys(APPARATUS)) for (const k of APPARATUS[g]) APPARATUS_OF[k] = g;
    const pen = probeInterpenetration(0.40);
    const unmapped = pen.pairs.reduce((a, q) => a.concat([q.a, q.b]), [])
                              .filter(k => !APPARATUS_OF[k]);
    const crossPairs = pen.pairs.filter(q =>
      APPARATUS_OF[q.a] && APPARATUS_OF[q.b] &&
      APPARATUS_OF[q.a] !== APPARATUS_OF[q.b] &&
      APPARATUS_OF[q.a] !== 'shared' && APPARATUS_OF[q.b] !== 'shared');
    /* the two the un-modelled subpulmonary infundibulum costs us, gaps[13] — named, measured, and
       therefore unable to grow without failing */
    const KNOWN_CROSS = [['aortic_root', 'pulmonary_root'], ['annulus_pulmonary', 'ostium_right']];
    const isKnown = q => KNOWN_CROSS.some(k => (k[0] === q.a && k[1] === q.b) || (k[0] === q.b && k[1] === q.a));
    const crossNew = crossPairs.filter(q => !isKnown(q));
    const crossKnownWorst = crossPairs.filter(isKnown)
      .reduce((m, q) => [Math.max(m[0], q.frac), Math.max(m[1], q.depth_cm)], [0, 0]);

    const between = (a, b) => (v => typeof v === 'number' && isFinite(v) && v >= a && v <= b);
    const rows = [
      ['A', 'predicted', 'mitral coaptation depth below the annular plane, 0.40-1.00 cm (tenting)',
        MC.hc, between(0.40, 1.00), 1.55],
      ['B', 'predicted', 'the mitral coaptation line lies POSTERIOR of the annular centre by >= 0.25 of the annulus radius',
        -MC.xc / ann.mitral, between(0.25, 0.80), 0.06],
      ['C', 'predicted', 'mitral leaflet reserve (spare length at closure) 0.03-0.30 of leaflet length',
        MC.reserveA, between(0.03, 0.30), -0.02],
      ['D', 'predicted', 'tricuspid coaptation depth 0.40-1.00 cm',
        TC.hc, between(0.40, 1.00), 1.40],
      ['E', 'predicted', 'all three tricuspid leaflets reach the coaptation point with spare length',
        Math.min(TC.reserveA, TC.reserveP, TC.reserveS), between(0.005, 0.40), -0.01],
      ['F', 'predicted', 'the aortic cusp needs a sinus 1.15-1.40 x the annulus radius to open into',
        AO.sinusRatio, between(1.15, 1.40), 1.02],
      ['G', 'predicted', 'the pulmonary cusp needs a sinus 1.15-1.40 x the annulus radius',
        PU.sinusRatio, between(1.15, 1.40), 1.02],
      ['H', 'predicted', 'derived chordal reach 1.0-2.5 cm on both AV valves',
        [MC.chordA, MC.chordP, TC.chordA, TC.chordS],
        v => Array.isArray(v) && v.every(x => x >= 1.0 && x <= 2.5), [2.9, 0.5, 2.0, 2.0]],
      ['I', 'stated', 'annulus size order: tricuspid > mitral > pulmonary > aortic, each by >= 8%',
        [ann.tricuspid / ann.mitral, ann.mitral / ann.pulmonary, ann.pulmonary / ann.aortic],
        v => Array.isArray(v) && v.every(x => x >= 1.08), [1.16, 1.20, 1.02]],
      ['J', 'stated', 'systole 0.26-0.32 s, isovolumetric contraction 0.03-0.09 s, relaxation 0.04-0.10 s',
        [systole, ivc, ivr],
        v => v[0] >= 0.26 && v[0] <= 0.32 && v[1] >= 0.03 && v[1] <= 0.09 && v[2] >= 0.04 && v[2] <= 0.10,
        [0.40, 0.02, 0.02]],
      ['K', 'stated', 'S1 splits (tricuspid shuts 10-40 ms after mitral) and S2 splits (pulmonary 20-50 ms after aortic)',
        [(ev.tricuspidClose - ev.mitralClose) * S, (ev.pulmonaryClose - ev.aorticClose) * S],
        v => v[0] >= 0.010 && v[0] <= 0.040 && v[1] >= 0.020 && v[1] <= 0.050, [0.0, 0.0]],
      ['L', 'structural', 'every leaflet and cusp keeps its own length at every t (inextensible, <1e-4 relative)',
        inx.worst, v => typeof v === 'number' && v < 1e-4, 3e-3],
      ['M', 'structural', 'no chord is ever stretched past its rest length',
        ch.maxStretch, v => typeof v === 'number' && v <= 1e-6, 0.04],
      ['N', 'structural', 'chordae are taut when the valve is shut (<0.02 cm sag) and slack when it is open (>0.10 cm)',
        [ch.sagShut, ch.sagOpen], v => v[0] < 0.02 && v[1] > 0.10, [0.30, 0.01]],
      ['O', 'structural', 'NO PROLAPSE: with the valve shut no point of a leaflet stands above its own annular plane',
        pr.maxAbovePlane, v => typeof v === 'number' && v <= 1e-9, 0.15],
      ['P', 'structural', 'AXES, measured not commented: the right-sided (tricuspid) valve sits at lower x than the left-sided (mitral) one, by >= 0.35 of their mean width',
        [sepRL, floorRL], v => v[0] >= v[1], [0.4, floorRL]],
      ['Q', 'structural', 'the pulmonary valve is the most VENTRAL (+z) of the four, by >= 0.35 of the mean annulus width',
        [sepAP, floorAP], v => v[0] >= v[1], [0.2, floorAP]],
      ['R', 'structural', 'the pulmonary valve is the most CRANIAL (+y) of the four, by >= 0.35 of the mean annulus width',
        [sepSI, floorSI], v => v[0] >= v[1], [0.1, floorSI]],
      ['S', 'structural', 'every part key the model declares is actually built by build(1, FULL)',
        missing, v => Array.isArray(v) && v.length === 0, ['mitral_anterior']],
      ['V', 'structural', 'the four valves are in the right STATE at the right time: at mid-ejection the semilunar valves are open and the AV valves shut, and at mid-diastole the reverse',
        (function () { const a = valveState(0.40), b2 = valveState(0.80);
          return [a.aortic, a.pulmonary, a.mitral, a.tricuspid, b2.aortic, b2.pulmonary, b2.mitral, b2.tricuspid]; })(),
        v => v[0] < 0.02 && v[1] < 0.02 && v[2] > 0.98 && v[3] > 0.98
          && v[4] > 0.98 && v[5] > 0.98 && v[6] < 0.02 && v[7] < 0.02,
        [1, 1, 0, 0, 0, 0, 1, 1]],
      ['W', 'structural', 'no side of the heart is ever open at both ends at once — an inflow and an outflow valve open together is a shunt, not a heart',
        (function () { let worst = 0;
          for (let i = 0; i < 400; i++) { const c = valveState(i / 400);
            worst = Math.max(worst, Math.min(1 - c.mitral, 1 - c.aortic), Math.min(1 - c.tricuspid, 1 - c.pulmonary)); }
          return worst; })(),
        v => typeof v === 'number' && v < 0.02, 0.9],
      ['U', 'structural', 'every solved quantity is finite — an infeasible stated set must not build silently',
        [MC.xc, MC.hc, MC.reserveA, TC.hc, AO.standProud, PU.standProud],
        v => v.every(x => typeof x === 'number' && isFinite(x)), [NaN, 1, 1, 1, 1, 1]],
      /* ---- the long-axis section: the four rows that say the PICTURE carries beat 5's two numbers.
              Added 2026-09-29 against review round 1, OPEN 1. ---- */
      ['X', 'structural', 'SECTION: both sectioned leaflets are built, and every one of their vertices lies on the surviving side of the cut, to within the leaflet half-thickness (0.05 cm)',
        [sec.keys, sec.verts, sec.worstSide],
        v => v[0] === 2 && v[1] > 500 && v[2] >= -0.05, [2, 600, -0.4]],
      ['Y', 'predicted', 'SECTION, MEASURED ON THE MESH: the deepest point of the sectioned leaflets sits 0.40-1.00 cm below the annular plane, and within 0.06 cm of the depth the solver predicted (row A)',
        [sec.deepest, Math.abs(sec.deepest - sec.solvedDepth)],
        v => v[0] >= 0.40 && v[0] <= 1.00 && v[1] <= 0.06, [1.4, 0.5]],
      ['Z', 'predicted', 'SECTION, MEASURED ON THE MESH: that same deepest point lies POSTERIOR of the annular centre by >= 0.25 of the annulus radius, along the annular line the build draws',
        [sec.posteriorOfCentre, ann.mitral],
        v => v[0] >= 0.25 * v[1], [0.05, ann.mitral]],
      ['AB', 'structural', 'SECTION: the camera beat 5 uses (the player\'s `anterior`, +z) is within 45 degrees of looking straight down the cut plane\'s normal — a cut face seen edge-on shows nothing',
        SECTION.obliquityDeg, v => typeof v === 'number' && v >= 0 && v < 45, 67.5],
      ['AC', 'structural', 'SECTION: the mid-surface profile the beat-claim vocabulary reports agrees with the built mesh to within half the free edge\'s own thickness (0.04 cm)',
        sec.meshMinusProfile, v => typeof v === 'number' && v >= 0 && v <= 0.04, 0.2],
      ['AD', 'structural', 'PAPILLARY IDENTITY: the muscle named anterolateral has its tip ANTERIOR of the mitral annular centre, the one named posteromedial POSTERIOR of it, and the anterolateral is the more LATERAL of the two - the transposition review round 1 corrected, pinned so it cannot silently come back',
        [papAP[0], papAP[1], papML[0], papML[1]],
        v => v[0] > 0 && v[1] < 0 && (v[0] - v[1]) >= 0.60 && (v[2] - v[3]) >= 0.25,
        [-0.470, 0.880, -1.254, -0.691]],
      /* ---- THE PICTURE, NOT THE MODEL.  Three rows added 2026-09-29 (round 3) against the review's
              two section-4 proposals.  AE and AF ask whether the camera a beat uses can see the shape
              that beat narrates - the defect found twice, on beat 5 in round 1 and beat 9 in round 2,
              by two models that were both correct.  AG asks the question the sibling
              cardiac-cycle-pumping model has a row for and this one did not. ---- */
      ['AE', 'structural', 'SHAPE vs CAMERA: the semilunar crown rises 1.0-1.6 cm along its OWN axis; an ANTERIOR camera keeps >= 0.90 of that rise across the screen and a SUPERIOR one - looking down that axis - keeps <= 0.50, which is where a crown and a flat ring stop being distinguishable. Both valves. This is the row that stops the crown claim being moved back on to the superior beat',
        [crownEx.aortic, crownSup.aortic / crownEx.aortic, crownAnt.aortic / crownEx.aortic,
         crownEx.pulmonary, crownSup.pulmonary / crownEx.pulmonary, crownAnt.pulmonary / crownEx.pulmonary],
        v => v[0] >= 1.0 && v[0] <= 1.6 && v[1] <= 0.50 && v[2] >= 0.90
          && v[3] >= 1.0 && v[3] <= 1.6 && v[4] <= 0.50 && v[5] >= 0.90,
        [1.30, 0.80, 0.80, 1.35, 0.80, 0.80]],
      ['AF', 'structural', 'FOUR SIZES vs CAMERA: projected on to the SUPERIOR screen plane each annulus keeps >= 0.90 of the area it truly encloses and the stated size order survives with >= 8% between neighbours - and projected ANTERIOR the order does NOT survive, so the beat that compares the four has exactly one camera it can stand at',
        [Math.min.apply(null, areaSup.map((a, i) => a / areaTrue[i])),
         Math.min.apply(null, ratios(areaSup)),
         Math.min.apply(null, ratios(areaAnt))],
        v => v[0] >= 0.90 && v[1] >= 1.08 && v[2] < 1.0,
        [0.50, 1.00, 1.50]],
      ['AG', 'structural', 'NO TWO SEPARATE VALVES SHARE SPACE: parity ray-cast from five directions over every pair of built parts whose boxes meet. Contact WITHIN one apparatus (a leaflet and its own cords), and anything against the trigones or the ventricular ghost, is construction and is excluded by name. Across apparatuses only the two the un-modelled subpulmonary infundibulum costs us are allowed - gaps[13] - and each is pinned at its measured size',
        [crossNew.length, crossKnownWorst[0], crossKnownWorst[1], unmapped.length],
        v => v[0] === 0 && v[1] <= 0.25 && v[2] <= 0.10 && v[3] === 0,
        [1, 0.5, 0.5, 0]]
    ];

    const pass = {}; let allPass = true, negOK = true;
    for (const [id, kind, what, value, ok, bad] of rows) {
      const good = !!ok(value);
      /* THE NEGATIVE CASE. A predicate that accepts its own deliberately wrong input is not measuring
         what its `what` string says, and would launder the next defect into a proof. */
      let rejects = true;
      try { rejects = !ok(bad); } catch (e) { rejects = true; }
      pass[id] = { kind: kind, what: what, ok: good, value: value, negativeRejected: rejects };
      if (!good) allPass = false;
      if (!rejects) negOK = false;
    }
    return {
      pass: pass, allPass: allPass && negOK, negativesAllRejected: negOK,
      axes: AXES,
      solved: { mitral: MC, tricuspid: TC, aortic: AO, pulmonary: PU, proudEdge: PROUD_EDGE },
      probes: { inextensible: inx, chordae: ch, prolapse: pr, section: sec, interpenetration: pen },
      screen: { order: ORDER, ringArea_superior: areaSup, ringArea_anterior: areaAnt,
                ringArea_true: areaTrue, crown_excursion: crownEx,
                crown_across_superior: crownSup, crown_across_anterior: crownAnt },
      interpenetration: { crossApparatus: crossPairs, unexpected: crossNew, unmapped: unmapped,
                          pairs: pen.pairs.length, sample: pen.sample },
      section: { plane: { origin: SECTION.origin.toArray(), normal: SECTION.normal.toArray(),
                          keptSide: SECTION.keep, obliquityDeg: SECTION.obliquityDeg },
                 measured: sec },
      centres: C, keys: keys,
      timing: { cycle_s: CYCLE_S, systole_s: systole, diastole_s: CYCLE_S - systole,
                ivc_s: ivc, ivr_s: ivr, events: STATED.events }
    };
  }

  /* ============================================================ 13 · THE BEAT-CLAIM VOCABULARY

     `viz-training/tools/check-beat-claims.mjs` evaluates a scene's narrated claims at each beat's own
     SET_STAGE t.  Its measure vocabulary was written for cardiac-cycle-pumping and asks that model
     for pressures, volumes and flows through `M.cycle()`, none of which exist here — this model
     solves GEOMETRY, and its only function of t is which valves are shut.  Rather than teach the tool
     a second model, the model brings its own vocabulary and the tool uses it when it finds one.

     Every measure below is a pure function of t and is read from the SAME functions the geometry is
     built from, so a claim cannot agree with a description of the model while disagreeing with the
     model.  `section.*` goes further and measures the built mesh, because beat 5's whole difficulty
     was a claim that was true of the solve and invisible in the picture.                            */
  function claimMeasure(name, t) {
    const p = name.split('.');
    const phi = valveState(t);
    switch (p[0]) {
      case 'closure': return phi[p[1]];                    // 0 fully open .. 1 fully shut
      case 'open':    return 1 - phi[p[1]];
      case 'phase':   return phaseOf(t).short;
      case 'sag': {
        /* chordal sag in cm: how far the slackest (or, with `.min`, the tightest) cord bows away
           from the straight line between its papillary tip and its leaflet station */
        const which = p[1];
        let mx = 0, mn = 1e9;
        for (const c of CHORDS[which]) {
          const g = leafletAt(which, c.lf, phi[which], c.u);
          const s = chordPath(c.tip, g.E, c.rest, new T.Vector3(0, -1, 0), 3).sagitta;
          if (s > mx) mx = s;
          if (s < mn) mn = s;
        }
        return p[2] === 'min' ? mn : mx;
      }
      case 'travel': {
        /* how far the middle of a named leaflet's free edge stands from where it sits when shut, cm —
           the measure behind "the long anterior leaflet does nearly all of the movement" */
        const which = p[1], lf = AV_LEAFLETS[which].filter(l => l.key === p[2])[0];
        if (!lf) throw new Error('heart-valves: no leaflet ' + p[2]);
        return leafletAt(which, lf, phi[which], 0.5).E
          .distanceTo(leafletAt(which, lf, 1, 0.5).E);
      }
      case 'section': {
        const s = sectionProfile(t);
        if (p[1] === 'depth_cm') return s.deepest;
        if (p[1] === 'posterior_cm') return s.posteriorOfCentre;
        if (p[1] === 'posterior_frac') return s.posteriorOfCentre / STATED.annulus.mitral;
        break;
      }
      case 'sinus': return (p[1] === 'aortic' ? AO : PU).sinusRatio;
      case 'annulus': return STATED.annulus[p[1]];
      /* ---- THE SHAPE-AGAINST-ITS-CAMERA MEASURES (section 12a).  A beat that narrates a shape
              asserts it here against the camera THAT BEAT rotates to, so the claim fails if the
              beat is ever re-pointed at a camera the shape does not survive. ---- */
      case 'crown':       return crownExcursion(p[1]);                             // crown.<which>, cm
      case 'crownAcross': return crownAcrossScreen(p[1], viewAxis(p[2]));          // crownAcross.<which>.<view>
      case 'ringArea':    return ringScreenArea(p[1], viewAxis(p[2]));             // ringArea.<which>.<view>, cm^2
      case 'ringAreaRatio': {                                                     // ringAreaRatio.<a>.<b>.<view>
        const d = viewAxis(p[3]);
        return ringScreenArea(p[1], d) / ringScreenArea(p[2], d);
      }
    }
    throw new Error('heart-valves: unknown claim measure ' + name);
  }

  window.MB3D_MODELS = window.MB3D_MODELS || {};
  window.MB3D_MODELS['heart-valves'] = {
    LAYERS: LAYERS,
    build: build,
    FULL: FULL,
    AXES: AXES,
    at: atT,
    acceptance: acceptance,
    claimMeasure: claimMeasure,
    interpenetration: probeInterpenetration,
    cycle_s: CYCLE_S,
    STATED: STATED
  };
})();
