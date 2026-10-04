/* MedBank · viz-training · RENDER KIT
 *
 * The shared machinery every procedural 3D structure is built on. It exists because four bugs found
 * while building the cardiac-looping model turned out not to be cardiac-looping bugs at all — they
 * were in the rendering code, and they had been quietly degrading every model in the corpus,
 * neurulation included. Fixing them in one file was the only way to stop paying for them again.
 *
 * The four, and the rule each one leaves behind:
 *
 *  1. WINDING. Emitting a ring quad in the natural order a, b, c, d makes (b-a) x (c-a) point INTO
 *     the solid. On a DoubleSide material that hides itself perfectly — until the inverted-hull
 *     silhouette renders the NEAR half of the shell instead of the far half and sits a hair in front
 *     of the surface. It then shows only where the surface faces the camera head-on, because that is
 *     where polygonOffset has no depth slope to work with. It reads exactly like z-fighting and it is
 *     not. RULE: never write winding by hand. Emit through quad(), which orders it for you.
 *
 *  2. COLOUR SPACE. three r128 treats a Color built from a hex literal as ALREADY LINEAR, and the
 *     renderer encodes linear -> sRGB on the way out. Feed it an sRGB hex and every colour comes back
 *     lighter and less saturated. Months of "why does ours look pastel next to the reference" was
 *     this. RULE: every colour that reaches a material goes through C().
 *
 *  3. NORMALS. Assuming the normal of a swept surface points radially is wrong wherever the calibre
 *     changes fast — every sulcus, every ballooning chamber, every taper. It shades the form flat AND
 *     pushes the silhouette shell sideways instead of outwards. RULE: normals come from a finite
 *     difference of the same point function that produced the positions, so the two cannot disagree.
 *
 *  4. HULLS. Inflating a whole solid — inner wall, end caps, cutaway rims and all — tears the hull
 *     open at every seam where one position carries two different normals. RULE: only the outer
 *     surface may become a silhouette, and geometry records how much of its buffer that is.
 *
 * A fifth thing that is not a bug but is a standing decision: depth-rank polygonOffset is for
 * surfaces that genuinely share space (layered sheets in contact, as in neurulation). For separated
 * solids it does nothing but drag buried structures forward through the ones that contain them.
 * Do not apply it by default.
 */

(function (global) {
  const T = global.THREE;

  /* ------------------------------------------------------------------ colour */

  /** Every colour destined for a material goes through here. See rule 2. */
  function C(hex) { return new T.Color(hex).convertSRGBToLinear(); }

  /** A background colour does NOT: the clear colour is written raw, not output-encoded. */
  function bg(hex) { return new T.Color(hex); }

  /* ------------------------------------------------------------- geometry emit

     One emitter, one winding convention, no opportunity to get it wrong. Callers pass a ring quad in
     natural order (a, b along the sweep; c, d back around the ring) and the emitter orders the
     triangles so the face normal points the way the supplied vertex normals do.                   */

  function emitter() {
    const pos = [], nml = [];
    function tri(p1, p2, p3, m1, m2, m3) {
      pos.push(p1.x, p1.y, p1.z, p2.x, p2.y, p2.z, p3.x, p3.y, p3.z);
      nml.push(m1.x, m1.y, m1.z, m2.x, m2.y, m2.z, m3.x, m3.y, m3.z);
    }
    const _e1 = new T.Vector3(), _e2 = new T.Vector3(), _fn = new T.Vector3();
    return {
      tri,
      /** ONE triangle, ordered so its FACE normal agrees with the normal you give it.
          `tri` above pushes vertices in the order handed to it and corrects nothing — which is fine
          for a caller that has already thought about winding and a trap for one that has not. Use
          this wherever a triangle is not part of a ring quad: caps, tapers, sheets, dome poles.
          ADDED 2026-09-10, because the flat end caps sweptShell writes for a SOLID tube were going
          through `tri` and every one of them was wound against its own normal — measured, 24 of 24
          on a plain tubeAlong. That is RENDER-STANDARD's cardinal bug living inside the file that
          exists to prevent it, on every vein, artery, rod and tick in the corpus. */
      triN(p1, p2, p3, n) {
        _fn.copy(_e1.subVectors(p2, p1).cross(_e2.subVectors(p3, p1)));
        if (_fn.lengthSq() < 1e-16) return;                 // degenerate: at a taper's point
        if (_fn.dot(n) >= 0) tri(p1, p2, p3, n, n, n);
        else                 tri(p1, p3, p2, n, n, n);
      },
      /** a=(i,j) b=(i+1,j) c=(i+1,j+1) d=(i,j+1); normals must point out of the solid. */
      quad(a, b, c, d, ma, mb, mc, md) { tri(a, d, c, ma, md, mc); tri(a, c, b, ma, mc, mb); },
      /** same corners, face the other way — for an inner wall or a reversed cap. */
      quadFlip(a, b, c, d, ma, mb, mc, md) { tri(a, b, c, ma, mb, mc); tri(a, c, d, ma, mc, md); },
      count() { return pos.length / 3; },
      geometry(hullCount) {
        const g = new T.BufferGeometry();
        g.setAttribute('position', new T.Float32BufferAttribute(pos, 3));
        g.setAttribute('normal', new T.Float32BufferAttribute(nml, 3));
        if (hullCount != null) g.userData.hullCount = hullCount;
        return g;
      },
    };
  }

  /* -------------------------------------------------------------------- frames

     A parallel-transported frame down a polyline: no twisting artefacts, and it survives a curve
     that doubles back on itself, which a Frenet frame does not.                                    */

  function parallelFrame(points, seed) {
    const n = points.length - 1;
    const P = points.map(p => p.clone()), D = [], N = [], B = [];
    let nv = null;
    for (let i = 0; i <= n; i++) {
      const d = new T.Vector3()
        .subVectors(points[Math.min(i + 1, n)], points[Math.max(i - 1, 0)])
        .normalize();
      if (!nv) {
        nv = (seed ? seed.clone() : new T.Vector3(1, 0, 0));
        if (Math.abs(nv.dot(d)) > 0.9) nv.set(0, 0, 1);
      }
      nv.addScaledVector(d, -nv.dot(d)).normalize();
      D.push(d.clone()); N.push(nv.clone());
      B.push(new T.Vector3().crossVectors(d, nv).normalize());
    }
    return { P, D, N, B };
  }

  /* -------------------------------------------------------------- swept shells

     A thick-walled tube swept along a frame: outer surface, inner surface, annular end caps, and an
     optional angular window that cuts a real hole with a real wall in its rim. This is the workhorse
     — a heart tube, a neural tube, a gut tube, a bronchus and a great vessel are all this shape.

     opts:
       frame     {P,D,N,B}                 the centreline and its transported frame
       i0, i1    indices into the frame     the span to build
       ring      integer                    points around the circumference
       outerR    (i) => number              outer radius at frame index i
       innerR    (i) => number              inner radius; omit for a single-surface tube
       section   (theta) => number          optional profile modulation, default a slight ovoid
       flatten   number                     binormal squash, 1 = circular
       window    {i0,i1,dir,half}           optional cutaway aimed at a WORLD direction              */

  const DEFAULT_SECTION = th => 1 + 0.055 * Math.cos(2 * th) - 0.030 * Math.cos(th);

  function sweptShell(opts) {
    const F = opts.frame, P = F.P, N = F.N, B = F.B, D = F.D;
    const last = P.length - 1;
    const i0 = Math.max(0, Math.round(opts.i0));
    const i1 = Math.min(last, Math.round(opts.i1));
    if (i1 - i0 < 1) return null;
    const ring = opts.ring || 32;
    const flat = opts.flatten != null ? opts.flatten : 0.90;
    const section = opts.section || DEFAULT_SECTION;
    const solid = !opts.innerR;
    const outerR = opts.outerR;
    const innerR = opts.innerR || (() => 0);

    const TH = j => (j / ring) * Math.PI * 2;
    const clamp = i => Math.max(0, Math.min(last, i));

    /* ONE point function. Positions and normals are both derived from it, so rule 3 holds by
       construction rather than by anybody remembering it. */
    function pt(i, j, rf, out) {
      const ii = clamp(i), th = TH(j);
      const rr = rf(ii) * section(th);
      return out.set(0, 0, 0)
        .addScaledVector(N[ii], rr * Math.cos(th))
        .addScaledVector(B[ii], rr * Math.sin(th) * flat)
        .add(P[ii]);
    }

    const _a = new T.Vector3(), _b = new T.Vector3(), _du = new T.Vector3(), _dv = new T.Vector3();
    const _rad = new T.Vector3();
    function nrm(i, j, rf, out) {
      pt(i + 1, j, rf, _a); pt(i - 1, j, rf, _b); _du.subVectors(_a, _b);
      pt(i, j + 1, rf, _a); pt(i, j - 1, rf, _b); _dv.subVectors(_a, _b);
      out.crossVectors(_dv, _du);
      const ii = clamp(i), th = TH(j);
      _rad.set(0, 0, 0).addScaledVector(N[ii], Math.cos(th)).addScaledVector(B[ii], Math.sin(th)).normalize();
      // a finite difference can collapse; three's normalize() then returns (0,0,0) without complaint,
      // which would leave the silhouette shell undisplaced and coincident with the surface
      if (out.lengthSq() < 1e-12) out.copy(_rad);
      out.normalize();
      if (out.dot(_rad) < 0) out.negate();
      return out;
    }

    const rows = i1 - i0 + 1;
    const OP = [], ON = [], IP = [], IN = [];
    for (let k = 0; k < rows; k++) {
      for (let j = 0; j < ring; j++) {
        const i = i0 + k;
        OP.push(pt(i, j, outerR, new T.Vector3()));
        ON.push(nrm(i, j, outerR, new T.Vector3()));
        if (!solid) {
          IP.push(pt(i, j, innerR, new T.Vector3()));
          IN.push(nrm(i, j, innerR, new T.Vector3()).negate());
        }
      }
    }
    const at = (k, j) => k * ring + ((j % ring) + ring) % ring;

    const win = opts.window || null;
    const winTh = [];
    if (win) {
      for (let k = 0; k < rows; k++) {
        const i = clamp(i0 + k);
        winTh.push(Math.atan2(win.dir.dot(B[i]) / flat, win.dir.dot(N[i])));
      }
    }
    /* A cutaway aimed at a fixed theta wanders, because the frame twists along the sweep. Aim it at a
       world direction and resolve the angle per row. */
    const keep = (k, j) => {
      if (!win) return true;
      const i = i0 + k;
      if (!(i > win.i0 && i < win.i1)) return true;
      let da = TH(j) - winTh[k];
      while (da > Math.PI) da -= 2 * Math.PI;
      while (da < -Math.PI) da += 2 * Math.PI;
      return Math.abs(da) >= win.half;
    };

    const E = emitter();

    // outer surface FIRST — rule 4: this, and only this, becomes the silhouette hull
    for (let k = 0; k < rows - 1; k++) {
      for (let j = 0; j < ring; j++) {
        if (!keep(k, j) || !keep(k + 1, j) || !keep(k, j + 1) || !keep(k + 1, j + 1)) continue;
        const a = at(k, j), b = at(k + 1, j), c = at(k + 1, j + 1), d = at(k, j + 1);
        E.quad(OP[a], OP[b], OP[c], OP[d], ON[a], ON[b], ON[c], ON[d]);
      }
    }
    const hullCount = E.count();

    if (solid) {
      // caps closing a single-surface tube
      const cx = new T.Vector3();
      /* THROUGH triN, NOT tri. Both branches below used to hand `tri` a vertex order chosen by
         reasoning about which way the ring runs, and both got it backwards: 24 of 24 cap triangles on
         a plain tubeAlong were wound against their supplied normal. It never showed, because these
         caps are inside the hull count and the materials are DoubleSide — until a ray-cast probe
         asked what surface faces the camera first and found the caps of every vein and dorsal aorta
         answering "the far one". triN decides the order from the geometry instead of from a comment. */
      [[0, -1], [rows - 1, 1]].forEach(([k, sign]) => {
        const axis = new T.Vector3().copy(D[clamp(i0 + k)]).multiplyScalar(sign);
        cx.copy(P[clamp(i0 + k)]);
        for (let j = 0; j < ring; j++) {
          if (!keep(k, j) || !keep(k, j + 1)) continue;
          const a = at(k, j), d = at(k, j + 1);
          E.triN(cx, OP[a], OP[d], axis);
        }
      });
      return E.geometry(hullCount);
    }

    // inner wall
    for (let k = 0; k < rows - 1; k++) {
      for (let j = 0; j < ring; j++) {
        if (!keep(k, j) || !keep(k + 1, j) || !keep(k, j + 1) || !keep(k + 1, j + 1)) continue;
        const a = at(k, j), b = at(k + 1, j), c = at(k + 1, j + 1), d = at(k, j + 1);
        E.quadFlip(IP[a], IP[b], IP[c], IP[d], IN[a], IN[b], IN[c], IN[d]);
      }
    }

    // annular end caps
    const cap = (k, sign) => {
      const axis = new T.Vector3().copy(D[clamp(i0 + k)]).multiplyScalar(sign);
      for (let j = 0; j < ring; j++) {
        if (!keep(k, j) || !keep(k, j + 1)) continue;
        const a = at(k, j), d = at(k, j + 1);
        if (sign > 0) E.quadFlip(OP[a], OP[d], IP[d], IP[a], axis, axis, axis, axis);
        else E.quad(OP[a], IP[a], IP[d], OP[d], axis, axis, axis, axis);
      }
    };
    cap(rows - 1, 1); cap(0, -1);

    // rim faces around a cutaway, so a cut wall reads as a wall and not as a paper edge
    if (win) {
      for (let k = 0; k < rows - 1; k++) {
        for (let j = 0; j < ring; j++) {
          const here = keep(k, j) && keep(k + 1, j);
          if (here === (keep(k, j + 1) && keep(k + 1, j + 1))) continue;
          const jj = here ? j + 1 : j;
          const a = at(k, jj), b = at(k + 1, jj);
          const tg = new T.Vector3().crossVectors(D[clamp(i0 + k)], ON[a])
            .multiplyScalar(here ? 1 : -1).normalize();
          if (here) E.quadFlip(OP[a], OP[b], IP[b], IP[a], tg, tg, tg, tg);
          else E.quad(OP[a], IP[a], IP[b], OP[b], tg, tg, tg, tg);
        }
      }
      for (let j = 0; j < ring; j++) {
        for (let k = 0; k < rows - 1; k++) {
          const here = keep(k, j), next = keep(k + 1, j);
          if (here === next) continue;
          const kk = here ? k + 1 : k;
          const axis = new T.Vector3().copy(D[clamp(i0 + kk)]).multiplyScalar(here ? 1 : -1);
          const a = at(kk, j), d = at(kk, j + 1);
          if (here) E.quadFlip(OP[a], OP[d], IP[d], IP[a], axis, axis, axis, axis);
          else E.quad(OP[a], IP[a], IP[d], OP[d], axis, axis, axis, axis);
        }
      }
    }
    return E.geometry(hullCount);
  }

  /** A plain closed tube along an arbitrary polyline — vessels, nerves, ducts. */
  function tubeAlong(points, radiusFn, opts = {}) {
    const F = parallelFrame(points, opts.seed);
    const steps = points.length - 1;
    return sweptShell({
      frame: F, i0: 0, i1: steps, ring: opts.ring || 18,
      outerR: i => radiusFn(i / steps),
      flatten: opts.flatten != null ? opts.flatten : 1,
      section: opts.section || (() => 1),
    });
  }

  /* ------------------------------------------------------------- terminal ends

     A ROUNDED TERMINAL END, and why an annulus is not one.

     sweptShell closes every span with an ANNULAR end cap — outer rim to inner rim, a flat ring. That
     is right wherever a neighbouring segment overlaps it, which is every internal waist, and it is
     why segments are built with a small OVERLAP in the first place. It is wrong at a tube's TERMINAL
     end, where there is nothing behind it to hide in: the annulus reads as an OPEN PIPE — a wall ring
     with a lit inner surface — and RENDER-STANDARD is explicit that an open lumen is the one thing
     that must never be visible.

     ADDED 2026-09-10 after the cardiac-looping round-3 review found exactly this at the caudal end of
     the sinus venosus, plainly visible from the anterior camera in the two views that use it. The
     same defect at the CRANIAL end of the same tube had been found a round earlier and worked around
     by choosing a camera that did not look down it. That is what makes this a kit-level rule rather
     than a model-level fix: a camera does not close a hole, it only moves the unlisted place, and
     every swept tube in this corpus that ends in mid-air has the same two holes.

     domeCap closes a terminal ring with a rounded dome that shares the tube's EXACT cross-section —
     same N and B, same section profile, same flatten — so its rim coincides with the tube's rim
     instead of approximating it. Normals come from a finite difference of the same point function
     that placed the vertices (rule 3), with the pole handled explicitly because the difference is
     degenerate there and a guard that silently returns (0,0,0) is how rule 3 got written. The result
     is all outer surface, so all of it takes a silhouette.

       frame, i     the frame and the station index of the terminal ring
       sign         +1 to bulge along D (a cranial end), -1 to bulge against it (a caudal end)
       r            the tube's OUTER radius at that station
       ring, rows   circumferential and polar resolution
       bulge        how far the dome stands proud, as a multiple of r; 1 is a hemisphere            */
  function domeCap(opts) {
    const F = opts.frame;
    const last = F.P.length - 1;
    const i = Math.max(0, Math.min(last, Math.round(opts.i)));
    const sign = opts.sign < 0 ? -1 : 1;
    const ring = opts.ring || 32, rows = opts.rows || 8;
    const r = opts.r;
    const bulge = opts.bulge != null ? opts.bulge : 0.85;
    const flat = opts.flatten != null ? opts.flatten : 0.90;
    const section = opts.section || DEFAULT_SECTION;
    const Nv = F.N[i], Bv = F.B[i], Pv = F.P[i];
    const axis = new T.Vector3().copy(F.D[i]).multiplyScalar(sign);
    /* THE RING RUNS THE OTHER WAY AT A CAUDAL END. Increasing m walks along `axis`, which is -D there,
       so the (m, j) parametrisation has the opposite handedness to the tube's own (i, j) and every
       quad comes out wound backwards — measured as winding 0.000 on the first caudal dome built, i.e.
       every single face. Reversing the ring direction restores the handedness rather than patching the
       symptom, so quad() keeps meaning what it means everywhere else in this file. */
    const jd = sign > 0 ? 1 : -1;
    const TH = j => ((jd * j) / ring) * Math.PI * 2;

    /* m IS NOT CLAMPED AT THE LOW END, and that is the difference between a dome and a dome with a
       crease round it. nrm() below takes a central difference, so at the rim it asks for m = -1; a
       clamp there made it one-sided, which tilts the rim normal towards the axis by half a row. The
       tube's own terminal ring normal is radial, so the two disagreed and every capped end wore a
       thin dark ellipse — the outline shell cracking open along the same seam. Negative m is exactly
       the reflection of the dome through the rim plane (cos is even, sin is odd), so letting the
       difference run past the rim makes the rim normal come out radial, which is what it is. */
    function pt(m, j, out) {
      const phi = (Math.min(rows, m) / rows) * (Math.PI / 2), th = TH(j);
      const rr = r * section(th) * Math.cos(phi);
      return out.set(0, 0, 0)
        .addScaledVector(Nv, rr * Math.cos(th))
        .addScaledVector(Bv, rr * Math.sin(th) * flat)
        .addScaledVector(axis, r * bulge * Math.sin(phi))
        .add(Pv);
    }
    const _a = new T.Vector3(), _b = new T.Vector3(), _du = new T.Vector3(), _dv = new T.Vector3();
    const _rad = new T.Vector3();
    function nrm(m, j, out) {
      if (m >= rows) return out.copy(axis);          // the pole: the difference is degenerate here
      pt(m + 1, j, _a); pt(m - 1, j, _b); _du.subVectors(_a, _b);
      pt(m, j + 1, _a); pt(m, j - 1, _b); _dv.subVectors(_a, _b);
      out.crossVectors(_du, _dv);
      const th = TH(j), phi = (m / rows) * (Math.PI / 2);
      _rad.set(0, 0, 0)
        .addScaledVector(Nv, Math.cos(phi) * Math.cos(th))
        .addScaledVector(Bv, Math.cos(phi) * Math.sin(th))
        .addScaledVector(axis, Math.sin(phi))
        .normalize();
      if (out.lengthSq() < 1e-12) out.copy(_rad);
      out.normalize();
      if (out.dot(_rad) < 0) out.negate();
      return out;
    }

    const E = emitter();
    const P00 = new T.Vector3(), P10 = new T.Vector3(), P11 = new T.Vector3(), P01 = new T.Vector3();
    const N00 = new T.Vector3(), N10 = new T.Vector3(), N11 = new T.Vector3(), N01 = new T.Vector3();
    for (let m = 0; m < rows; m++) {
      for (let j = 0; j < ring; j++) {
        pt(m, j, P00); pt(m + 1, j, P10); pt(m + 1, j + 1, P11); pt(m, j + 1, P01);
        nrm(m, j, N00); nrm(m + 1, j, N10); nrm(m + 1, j + 1, N11); nrm(m, j + 1, N01);
        if (m === rows - 1) {
          // the last band closes on the pole: one triangle, not a quad with a degenerate edge
          E.triN(P00, P10, P01, N00);
        } else {
          E.quad(P00, P10, P11, P01, N00, N10, N11, N01);
        }
      }
    }
    return E.geometry(E.count());
  }

  /* ------------------------------------------------- a tube that ends in mid-air

     THE GAP domeCap LEFT OPEN. domeCap has existed since 2026-09-10 and, as of 2026-09-29, had been
     called ZERO times in this corpus against nineteen tubeAlong calls in heart-external.js alone. A
     kit function nobody calls prevents nothing. The reason it went uncalled is mechanical rather
     than careless: tubeAlong builds its frame INTERNALLY and throws it away, so a caller who wants a
     dome has to rebuild parallelFrame itself, re-derive the terminal station index, the sign and the
     radius, and then merge two geometries while keeping the outer surface contiguous at the front of
     the buffer so outlineOf still finds the hull. Five chances to get it subtly wrong, at every call
     site, which is precisely the kind of thing that belongs in the kit once.

     tubeCapped is tubeAlong plus that. `cap` is 'end' (default), 'start', 'both' or false, and the
     dome inherits the tube's OWN ring, flatten and section, so its rim coincides with the tube's rim
     rather than approximating it. The flat disc sweptShell already wrote at that station stays in the
     buffer, harmlessly, inside the dome — removing it would mean reaching into sweptShell, and it
     costs `ring` triangles.

     WHICH ENDS. Cap the ends that end in mid-air. An end buried inside a neighbouring solid needs no
     dome and is better left alone: the burial rule and the dome rule solve the same problem in two
     different places, and stacking both on one join only risks the dome protruding through the
     neighbour it is hiding in. Measure which is which — heart-external.js raycasts every terminal
     centre against the rest of the model rather than reasoning about it.                           */
  function tubeCapped(points, radiusFn, opts = {}) {
    const F = parallelFrame(points, opts.seed);
    const steps = points.length - 1;
    const ring = opts.ring || 18;
    const flatten = opts.flatten != null ? opts.flatten : 1;
    const section = opts.section || (() => 1);
    const tube = sweptShell({
      frame: F, i0: 0, i1: steps, ring,
      outerR: i => radiusFn(i / steps), flatten, section,
    });
    if (!tube) return null;
    const cap = opts.cap === undefined ? 'end' : opts.cap;
    const want = cap === 'both' ? ['start', 'end'] : (cap ? [cap] : []);
    const domes = [];
    /* AND THE FLAT DISC UNDERNEATH HAS TO GO. Leaving it in seemed harmless — the dome covers it —
       but the dome's rim and the disc's rim are the SAME ring of points, so the two surfaces are
       exactly coincident there and z-fight: a one-pixel dark ellipse round every capped end, which
       is the hard rim this whole change exists to remove, arrived at by a different route. Stripping
       it needs sweptShell's emission order for a solid tube, which is hull, then the start cap's
       `ring` triangles, then the end cap's: asserted below rather than assumed, and if the buffer is
       not that shape the disc is left alone and the dome still goes on. */
    const base = want.length ? stripFlatCap(tube, ring, want) : tube;
    for (const w of want) {
      const start = w === 'start';
      const r = radiusFn(start ? 0 : 1);
      if (!(r > 1e-6)) continue;
      domes.push(domeCap({
        frame: F, i: start ? 0 : steps, sign: start ? -1 : 1, r,
        ring, rows: opts.capRows || 8,
        bulge: opts.bulge != null ? opts.bulge : 0.85,
        flatten, section,
      }));
    }
    return domes.length ? mergeHullFirst(base, domes) : tube;
  }

  /** Remove the flat terminal disc(s) sweptShell wrote for a solid tube, keeping the hull intact. */
  function stripFlatCap(geo, ring, which) {
    const pos = geo.attributes.position, nml = geo.attributes.normal;
    const hull = geo.userData.hullCount != null ? geo.userData.hullCount : pos.count;
    if (pos.count !== hull + 6 * ring) return geo;    // a window was cut, or the layout changed: leave it
    const dropStart = which.indexOf('start') >= 0, dropEnd = which.indexOf('end') >= 0;
    const keep = [[0, hull]];
    if (!dropStart) keep.push([hull, hull + 3 * ring]);
    if (!dropEnd) keep.push([hull + 3 * ring, hull + 6 * ring]);
    let n = 0; for (const [a, b] of keep) n += b - a;
    const P = new Float32Array(n * 3), N = new Float32Array(n * 3);
    let o = 0;
    for (const [a, b] of keep) {
      P.set(pos.array.subarray(a * 3, b * 3), o); N.set(nml.array.subarray(a * 3, b * 3), o);
      o += (b - a) * 3;
    }
    const g = new T.BufferGeometry();
    g.setAttribute('position', new T.Float32BufferAttribute(P, 3));
    g.setAttribute('normal', new T.Float32BufferAttribute(N, 3));
    g.userData.hullCount = hull;
    return g;
  }

  /** Concatenate geometries so the combined OUTER SURFACE stays contiguous at the front of the
      buffer — which is the only thing outlineOf and the normal probe rely on. Anything the base
      geometry kept behind its hullCount (flat caps, inner walls) is pushed after the additions and
      stays out of the silhouette, where it belongs. */
  function mergeHullFirst(base, extras) {
    const parts = (extras || []).filter(Boolean);
    if (!parts.length) return base;
    const bp = base.attributes.position.array, bn = base.attributes.normal.array;
    const baseCount = base.attributes.position.count;
    const hull = base.userData.hullCount != null ? base.userData.hullCount : baseCount;
    const h3 = hull * 3;
    let add = 0;
    for (const e of parts) add += e.attributes.position.count;
    const total = baseCount + add;
    const pos = new Float32Array(total * 3), nml = new Float32Array(total * 3);
    pos.set(bp.subarray(0, h3), 0); nml.set(bn.subarray(0, h3), 0);
    let o = h3;
    for (const e of parts) {
      pos.set(e.attributes.position.array, o);
      nml.set(e.attributes.normal.array, o);
      o += e.attributes.position.count * 3;
    }
    pos.set(bp.subarray(h3), o); nml.set(bn.subarray(h3), o);
    const g = new T.BufferGeometry();
    g.setAttribute('position', new T.Float32BufferAttribute(pos, 3));
    g.setAttribute('normal', new T.Float32BufferAttribute(nml, 3));
    g.userData.hullCount = hull + add;
    return g;
  }

  /* --------------------------------------------------------------- silhouettes */

  /** Inflate ONLY the hull portion. See rule 4. Handles an indexed geometry by de-indexing first. */
  function outlineOf(src, thickness) {
    const geo = src.index ? src.toNonIndexed() : src;
    const sp = geo.attributes.position.array, sn = geo.attributes.normal.array;
    const count = (src.userData.hullCount != null) ? src.userData.hullCount : geo.attributes.position.count;
    const out = new Float32Array(count * 3);
    for (let i = 0; i < count * 3; i += 3) {
      out[i] = sp[i] + sn[i] * thickness;
      out[i + 1] = sp[i + 1] + sn[i + 1] * thickness;
      out[i + 2] = sp[i + 2] + sn[i + 2] * thickness;
    }
    const g = new T.BufferGeometry();
    g.setAttribute('position', new T.BufferAttribute(out, 3));
    return g;
  }

  /* --------------------------------------------------------------- reflection

     A MIRRORED VARIANT MUST ACTUALLY BE A REFLECTION. Added 2026-09-10 after a review found that the
     cardiac-looping L-loop was a 180-degree ROTATION wearing a mirror's clothes: the model seeded its
     transported frame with n = -x, which negates BOTH n and b (b is derived as d x n) and so turns
     the solid about its own long axis instead of reflecting it. The two builds had the SAME
     handedness, so no camera angle could ever have made one the enantiomer of the other.

     It survived because every check that was run passes on a rotation: identical triangle count,
     identical outward-normal fraction, negated mean x, and — the tell that was mistaken for the
     proof — UNTOUCHED WINDING. A genuine enantiomer must REVERSE winding. Rule 1 above makes
     reversed winding the cardinal sin, which is precisely what pushes an author towards the
     construction trick; so the reflection lives here, once, done right, rather than being
     hand-rolled per model as rule 1 warns against.

     Positions and normals negate x; every triangle's winding reverses, which keeps faces pointing
     outward after the handedness flip. Vertex attributes are permuted together, so uv and anything
     else stays with its vertex. An indexed geometry reverses its index instead.                    */

  function reflectX(geo, seen) {
    if (!geo || (seen && seen.has(geo))) return geo;
    if (seen) seen.add(geo);
    const attrs = [];
    for (const name in geo.attributes) attrs.push(geo.attributes[name]);
    // negate x on positions and normals (the only attributes with a direction in model space)
    for (const name of ['position', 'normal']) {
      const a = geo.attributes[name];
      if (!a) continue;
      for (let i = 0; i < a.count; i++) a.array[i * a.itemSize] = -a.array[i * a.itemSize];
      a.needsUpdate = true;
    }
    if (geo.index) {
      const ix = geo.index.array;
      for (let t = 0; t + 2 < ix.length; t += 3) { const s1 = ix[t + 1]; ix[t + 1] = ix[t + 2]; ix[t + 2] = s1; }
      geo.index.needsUpdate = true;
    } else {
      // swap vertices 1 and 2 of every triangle, across EVERY attribute, so nothing desynchronises
      for (const a of attrs) {
        const n = a.itemSize, arr = a.array;
        for (let t = 0; t + 2 < a.count; t += 3) {
          const i1 = (t + 1) * n, i2 = (t + 2) * n;
          for (let c = 0; c < n; c++) { const tmp = arr[i1 + c]; arr[i1 + c] = arr[i2 + c]; arr[i2 + c] = tmp; }
        }
        a.needsUpdate = true;
      }
    }
    geo.boundingBox = null; geo.boundingSphere = null;
    return geo;
  }

  /** Reflect every mesh in a group, each geometry exactly once even if two meshes share one. */
  function reflectGroupX(group) {
    const seen = new Set();
    group.traverse(o => { if (o.isMesh && o.geometry) reflectX(o.geometry, seen); });
    return group;
  }

  /* ---------------------------------------------------------------- materials */

  const _outlineCache = {};
  /** A near-black silhouette disappears against a dark ground. A deep tint of the structure's own
      colour reads as a drawn edge at every background value. */
  function outlineMaterial(hex) {
    if (!_outlineCache[hex]) {
      _outlineCache[hex] = new T.MeshBasicMaterial({
        color: new T.Color(hex).multiplyScalar(0.26).convertSRGBToLinear(),
        side: T.BackSide,
        polygonOffset: true, polygonOffsetFactor: 6, polygonOffsetUnits: 6,
      });
    }
    return _outlineCache[hex];
  }

  /* A TRANSLUCENT PART MUST NOT WRITE DEPTH, and until 2026-09-29 every one in this corpus did.
     three's default is depthWrite: true whatever the opacity, so a lung authored at 0.32 filled the
     depth buffer and discarded the fragments of everything behind it — the left atrium, the left
     pulmonary surface, the heart inside the pericardial sac. The picture showed a see-through lung
     with nothing to see through it to.

     It never showed up as a model bug because viz3d.js paint() sets `depthWrite = opacity >= 0.98`
     on every mesh it paints, so the PLAYER was right and the MODEL was wrong, and every harness that
     renders the model directly — which is every proof any build or review run has ever taken — was
     measuring the wrong picture. That is how a review came to report the left atrium at ZERO pixels
     in a beat where a student would see it. Same rule, same threshold, in the kit, so the two agree.
     An explicit depthWrite in `over` still wins. */
  function tissueMaterial(hex, over) {
    const o = Object.assign({}, over || {});
    if (o.depthWrite === undefined && o.opacity !== undefined && o.opacity < 0.98) o.depthWrite = false;
    return new T.MeshPhysicalMaterial(Object.assign({
      color: C(hex),
      roughness: 0.54, metalness: 0.0,
      clearcoat: 0.15, clearcoatRoughness: 0.60,
      side: T.DoubleSide, flatShading: false,
    }, o));
  }

  /**
   * Add one solid, with its silhouette, to a group.
   * opts: { color, name, outline, material, matOver, noOutline, renderOrder }
   */
  function addSolid(group, key, geo, opts = {}) {
    if (!geo) return null;
    const hex = opts.color != null ? opts.color : 0xcccccc;
    const m = new T.Mesh(geo, opts.material || tissueMaterial(hex, opts.matOver));
    m.userData.key = key;
    if (opts.name) m.name = opts.name;
    if (opts.renderOrder != null) m.renderOrder = opts.renderOrder;
    group.add(m);
    if (!opts.noOutline) {
      const o = new T.Mesh(outlineOf(geo, opts.outline || 0.030), outlineMaterial(hex));
      o.renderOrder = (m.renderOrder || 0) - 0.5;
      o.userData.key = key; o.userData.outline = true;
      group.add(o);
    }
    return m;
  }

  /* -------------------------------------------------------------- presentation */

  /** THE SUBJECT FILLS THE FRAME — at every t, not only at the one that was tuned. */
  function fitCamera(cam, obj, margin) {
    obj.updateMatrixWorld(true);
    const box = new T.Box3().setFromObject(obj);
    const c = box.getCenter(new T.Vector3());
    const s = box.getSize(new T.Vector3());
    const vFov = cam.fov * Math.PI / 180;
    const hFov = 2 * Math.atan(Math.tan(vFov / 2) * cam.aspect);
    const dist = Math.max((s.y / 2) / Math.tan(vFov / 2), (s.x / 2) / Math.tan(hFov / 2))
      * (margin || 1.05) + s.z / 2;
    cam.near = Math.max(0.05, dist - s.length());
    cam.far = dist + s.length() * 3;
    cam.updateProjectionMatrix();
    return { centre: c, distance: dist, size: s };
  }

  function standardLights(scene) {
    const key = new T.DirectionalLight(0xfff6ec, 1.35); key.position.set(5.0, 7.5, 7.0);
    const fill = new T.DirectionalLight(0xffc98a, 0.30); fill.position.set(-6, -4, 3);
    const rim = new T.DirectionalLight(0x8ec3ff, 0.85); rim.position.set(-4, 3, -8);
    scene.add(key, fill, rim);
    scene.add(new T.HemisphereLight(0x9fc6ff, 0x2a1a10, 0.20));
    scene.add(new T.AmbientLight(0xffffff, 0.05));
    return { key, fill, rim };
  }

  function configureRenderer(renderer) {
    renderer.outputEncoding = T.sRGBEncoding;
    renderer.toneMapping = T.LinearToneMapping;   // ACES bleaches flat teaching colours to pastel
    renderer.toneMappingExposure = 0.98;
    renderer.shadowMap.enabled = false;           // no ground plane to catch them; only acne
    return renderer;
  }

  global.VizKit = {
    C, bg, emitter, parallelFrame, sweptShell, tubeAlong, domeCap, tubeCapped, mergeHullFirst, stripFlatCap,
    reflectX, reflectGroupX,
    outlineOf, outlineMaterial, tissueMaterial, addSolid,
    fitCamera, standardLights, configureRenderer,
    DEFAULT_SECTION,
  };
})(window);
