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
    return {
      tri,
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
      [[0, -1], [rows - 1, 1]].forEach(([k, sign]) => {
        const axis = new T.Vector3().copy(D[clamp(i0 + k)]).multiplyScalar(sign);
        cx.copy(P[clamp(i0 + k)]);
        for (let j = 0; j < ring; j++) {
          if (!keep(k, j) || !keep(k, j + 1)) continue;
          const a = at(k, j), d = at(k, j + 1);
          if (sign > 0) E.tri(cx, OP[d], OP[a], axis, axis, axis);
          else E.tri(cx, OP[a], OP[d], axis, axis, axis);
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

  function tissueMaterial(hex, over) {
    return new T.MeshPhysicalMaterial(Object.assign({
      color: C(hex),
      roughness: 0.54, metalness: 0.0,
      clearcoat: 0.15, clearcoatRoughness: 0.60,
      side: T.DoubleSide, flatShading: false,
    }, over || {}));
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
    C, bg, emitter, parallelFrame, sweptShell, tubeAlong,
    reflectX, reflectGroupX,
    outlineOf, outlineMaterial, tissueMaterial, addSolid,
    fitCamera, standardLights, configureRenderer,
    DEFAULT_SECTION,
  };
})(window);
