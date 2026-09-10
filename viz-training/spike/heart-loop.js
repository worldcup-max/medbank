/* MedBank · cardiac looping — procedural heart tube, v1
 *
 * SECOND PROCEDURAL STRUCTURE. Built to answer one question: is procedural 3D hard in general, or
 * was NEURULATION hard because it is seven sheets in mutual contact? So this model is deliberately
 * the opposite kind of object — one tube, made of SEPARATED SOLIDS that meet only end-to-end at
 * narrow waists. If the hypothesis is right, this should come out clean without a fight.
 *
 * THE MECHANISM IS DIFFERENT ON PURPOSE TOO. Neurulation conserves arc length: a strip of fixed
 * length bends. Cardiac looping is the opposite — the tube GROWS about 50% longer while both poles
 * stay tethered (arterial pole to the aortic arches, venous pole to the septum transversum), so the
 * extra length has nowhere to go but sideways. Growth-driven buckling, not folding. If the same
 * parametric approach handles both mechanisms, the method generalises.
 *
 * WHAT t MEANS. t = 0 is the straight heart tube of day 21; t = 1 is the looped heart of day 28,
 * with the atrium moved dorsocranial and the ventricle ventrocaudal. Everything between is one
 * continuous function, so no two stages can disagree with each other.
 *
 * AXES. +x = embryo's RIGHT, +y = CRANIAL, +z = VENTRAL. The loop is dextral: the bulboventricular
 * portion swings ventrally and to the right, which is why this is called a D-loop.
 *
 * GEOMETRY NOTE. The myocardial tube is a THICK-WALLED shell — outer surface, inner surface, and
 * annular end caps — not a zero-thickness skin. That costs triangles but it means a cutaway shows a
 * wall, and it means the endocardial tube inside is separated from it by a real gap (the cardiac
 * jelly) instead of touching it. Nothing in this model shares a surface with anything else.
 */

const T = window.THREE;
const K = window.VizKit;   // render-kit.js must load first — it owns winding, normals and colour
const C = K.C;

const LAYERS = {
  pericardium: { color: 0x8fb8e8, name: 'Pericardial cavity' },
  mesocardium: { color: 0x7fc9b4, name: 'Dorsal mesocardium' },
  veins:       { color: 0x27497a, name: 'Vitelline & cardinal veins' },
  sinus:       { color: 0x5b49ad, name: 'Sinus venosus' },
  atrium:      { color: 0x1f7fc4, name: 'Primitive atrium' },
  ventricle:   { color: 0xc02a3a, name: 'Primitive ventricle' },
  bulbus:      { color: 0xd85c26, name: 'Bulbus cordis' },
  truncus:     { color: 0xcf9a1e, name: 'Truncus arteriosus' },
  arches:      { color: 0x8f2438, name: 'Aortic arches' },
  endocardium: { color: 0xe7aebe, name: 'Endocardial tube' },
};

/* draw order, outermost context first — used for polygonOffset ranking so nothing z-fights */
const DEPTH_ORDER = {
  veins: 0, sinus: 1, atrium: 2, ventricle: 3, bulbus: 4, truncus: 5, arches: 6,
  endocardium: 7, mesocardium: 8, pericardium: 9,
};

const L0    = 6.0;    // heart-tube arc length on day 21
const GROW  = 0.50;   // it lengthens by half again while the poles stay put — that is why it buckles
const NSEG  = 300;    // centreline samples
const NRING = 34;     // points around the tube
const WALL  = 0.095;  // myocardial wall thickness
const JELLY = 0.085;  // cardiac jelly: the GAP between myocardium and endocardium

function len(t) { return L0 * (1 + GROW * t); }

/* ---------------------------------------------------------------- the curve

   Curvature is prescribed as a function of position along the tube, and the centreline is obtained
   by integrating it. Two Gaussian bumps of opposite sign: a big positive one over the
   bulboventricular portion (the C of the C-loop) and a smaller negative one over the atrial end
   (which is what turns the C into an S and carries the atrium up behind the ventricle).           */

function gauss(u, c, w) { const z = (u - c) / w; return Math.exp(-z * z); }

const K_LOOP = 1.90, K_ATRIAL = 0.85;

/* Only the SHAPE of the curvature is prescribed here. Its amplitude is not a tuned constant — it is
   solved for at every t, below, from the one real constraint: both poles are tethered, so the chord
   between them barely changes while the tube lengthens. The tube bends exactly as much as it must. */
function shapeK(u) {
  return K_LOOP * gauss(u, 0.605, 0.115)      // the hairpin, at the bulboventricular sulcus
       - K_ATRIAL * gauss(u, 0.235, 0.130)    // the atrial limb swinging back behind it
       + 0.40 * gauss(u, 0.900, 0.070);       // the outflow tract turning cranially again
}

/* The plane the bend happens in rotates as you travel along the tube. That rotation IS the torsion,
   and it is the whole reason the loop is a three-dimensional helix rather than a flat croissant. */
const PSI0 = 0.26, TAU = 1.60;
function psi(u, t) { return PSI0 + TAU * t * (u - 0.45); }

function integrate(lambda, t) {
  const L = len(t), ds = L / NSEG;
  const p = new T.Vector3(0, 0, 0);
  const d = new T.Vector3(0, 1, 0);
  const n = new T.Vector3(1, 0, 0);
  const P = [], D = [], N = [], B = [];
  for (let i = 0; i <= NSEG; i++) {
    const u = i / NSEG;
    const b = new T.Vector3().crossVectors(d, n).normalize();
    P.push(p.clone()); D.push(d.clone()); N.push(n.clone()); B.push(b.clone());
    if (i === NSEG) break;
    const a = psi(u, t);
    const axis = new T.Vector3()
      .addScaledVector(b, Math.cos(a))
      .addScaledVector(n, Math.sin(a))
      .normalize();
    const q = new T.Quaternion().setFromAxisAngle(axis, lambda * shapeK(u) * ds);
    d.applyQuaternion(q).normalize();
    n.applyQuaternion(q);
    n.addScaledVector(d, -n.dot(d)).normalize();
    p.addScaledVector(d, ds);
  }
  return { P, D, N, B, L };
}

const POLE = new T.Vector3(0, -L0 * 0.46, 0);   // the venous pole, fixed for every t

/* Rigid-body fit: rotate the solved curve so the line between its two poles is vertical again, then
   drop the venous pole back onto its fixed point. Nothing is scaled — the poles really are where the
   septum transversum and the aortic arches hold them, and the loop is what happens in between. */
function orient(cl) {
  const chord = new T.Vector3().subVectors(cl.P[NSEG], cl.P[0]).normalize();
  const q = new T.Quaternion().setFromUnitVectors(chord, new T.Vector3(0, 1, 0));
  for (const arr of [cl.D, cl.N, cl.B]) for (const v of arr) v.applyQuaternion(q);
  for (const v of cl.P) v.applyQuaternion(q);
  const shift = new T.Vector3().subVectors(POLE, cl.P[0]);
  for (const v of cl.P) v.add(shift);
  return cl;
}

function chordLen(cl) { return cl.P[NSEG].distanceTo(cl.P[0]); }

function centreline(t) {
  if (t <= 0.0001) return orient(integrate(0, t));
  const target = L0 * (1 - 0.26 * t);          // the poles converge only slightly as the heart compacts
  let lo = 0, hi = 3.2;
  if (chordLen(integrate(hi, t)) > target) return orient(integrate(hi, t));
  for (let k = 0; k < 34; k++) {
    const mid = (lo + hi) / 2;
    if (chordLen(integrate(mid, t)) > target) lo = mid; else hi = mid;
  }
  return orient(integrate((lo + hi) / 2, t));
}

/* ------------------------------------------------------------- the calibre

   A heart tube is not a pipe. It is a string of dilations separated by constrictions, and those
   constrictions are the landmarks students are examined on: the sinoatrial orifice, the
   atrioventricular canal, the bulboventricular sulcus. Putting the segment boundaries AT the waists
   means neighbouring segments meet where they are narrowest — which is both anatomically right and
   the reason this model has no broad shared surfaces to fight over.                                */

function radius(u, t) {
  const grow = 0.45 + 0.75 * t;
  let r = 0.285;
  r += 0.155 * gauss(u, 0.055, 0.075) * (0.7 + 0.3 * t);  // sinus horns
  r += 0.300 * gauss(u, 0.280, 0.110) * grow;             // atrium ballooning
  r += 0.335 * gauss(u, 0.530, 0.120) * grow;             // ventricle ballooning
  r += 0.170 * gauss(u, 0.755, 0.090) * (0.6 + 0.4 * t);  // bulbus cordis
  r -= 0.075 * gauss(u, 0.165, 0.055);                    // sinoatrial constriction
  r -= 0.105 * gauss(u, 0.400, 0.050);                    // atrioventricular canal
  r -= 0.072 * gauss(u, 0.660, 0.048);                    // bulboventricular sulcus
  r -= 0.042 * gauss(u, 0.870, 0.045);                    // bulbotruncal junction
  return Math.max(r, 0.125);
}

/* Geometry, silhouettes, materials and camera fitting all live in render-kit.js. Everything this
   file still owns is anatomy: where the tube runs, how thick it is, and what changes as t advances.
   That split is deliberate — the four rendering bugs that cost this model six passes were all in the
   machinery, and the machinery is now in one place where fixing it fixes every structure at once. */

function heartShell(cl, u0, u1, t, cut) {
  return K.sweptShell({
    frame: cl, i0: u0 * NSEG, i1: u1 * NSEG, ring: NRING,
    outerR: i => radius(i / NSEG, t),
    innerR: i => Math.max(radius(i / NSEG, t) - WALL, 0.045),
    window: cut,
  });
}

function add(group, key, geo, opts = {}) {
  return K.addSolid(group, key, geo, Object.assign({
    color: LAYERS[key].color, name: LAYERS[key].name,
  }, opts));
}

/* ------------------------------------------------------------------ segments */

const SEGS = [
  { key: 'sinus',     u0: 0.000, u1: 0.165 },
  { key: 'atrium',    u0: 0.165, u1: 0.400 },
  { key: 'ventricle', u0: 0.400, u1: 0.660 },
  { key: 'bulbus',    u0: 0.660, u1: 0.870 },
  { key: 'truncus',   u0: 0.870, u1: 1.000 },
];
const OVERLAP = 0.006;   // segments interpenetrate slightly at each waist, so no cap is ever visible

function sampleAt(cl, u) {
  const i = Math.max(0, Math.min(NSEG, Math.round(u * NSEG)));
  return { p: cl.P[i], d: cl.D[i], n: cl.N[i], b: cl.B[i] };
}

/* ------------------------------------------------------------------- build */

function buildHeart(t, opts = {}) {
  const g = new T.Group();
  const cl = centreline(t);

  // the myocardial tube, five segments meeting at their waists
  const heartOnly = new T.Group();
  for (const s of SEGS) {
    const cut = (opts.cutaway && s.key === 'ventricle')
      ? { i0: 0.420 * NSEG, i1: 0.640 * NSEG, dir: new T.Vector3(0.42, 0.10, 1).normalize(), half: 1.02 } : null;
    const geo = heartShell(cl, Math.max(0, s.u0 - OVERLAP), Math.min(1, s.u1 + OVERLAP), t, cut);
    const mesh = add(g, s.key, geo, { outline: 0.034 });
    if (mesh) heartOnly.add(mesh.clone());
  }

  // endocardial tube, floating inside with the cardiac jelly as a real gap
  if (opts.endocardium || opts.cutaway) {
    const path = [], rr = [];
    for (let i = 0; i <= NSEG; i += 2) { path.push(cl.P[i]); rr.push(Math.max(radius(i / NSEG, t) - WALL - JELLY, 0.035)); }
    const geo = K.tubeAlong(path, u => rr[Math.min(rr.length - 1, Math.round(u * (rr.length - 1)))], { ring: 20 });
    add(g, 'endocardium', geo, { outline: 0.014 });
  }

  // venous pole: the tube is tethered here, and the veins do not move while the tube grows
  {
    const a = sampleAt(cl, 0.0);
    const bez = (p0, p1, p2, n) => {
      const out = [];
      for (let i = 0; i <= n; i++) {
        const u = i / n, v = 1 - u;
        out.push(new T.Vector3(
          v * v * p0.x + 2 * v * u * p1.x + u * u * p2.x,
          v * v * p0.y + 2 * v * u * p1.y + u * u * p2.y,
          v * v * p0.z + 2 * v * u * p1.z + u * u * p2.z));
      }
      return out;
    };
    for (const side of [1, -1]) {
      // common cardinal vein, descending into the horn from above and behind
      const horn = new T.Vector3(a.p.x + side * 0.16, a.p.y + 0.05, a.p.z - 0.05);
      const ccv = bez(horn,
        new T.Vector3(side * 1.05, a.p.y + 0.28, -0.55),
        new T.Vector3(side * 1.10, a.p.y + 0.72, -1.00), 14);
      add(g, 'veins', K.tubeAlong(ccv, u => 0.155 - 0.030 * u, { ring: 16 }), { outline: 0.020 });

      // vitelline vein, climbing from the yolk stalk below
      const vit = bez(horn,
        new T.Vector3(side * 0.62, a.p.y - 0.72, 0.18),
        new T.Vector3(side * 0.70, a.p.y - 1.15, 0.38), 14);
      add(g, 'veins', K.tubeAlong(vit, u => 0.145 - 0.025 * u, { ring: 16 }), { outline: 0.020 });
    }
  }

  // arterial pole: aortic sac, the arches sweeping dorsally round the pharynx, paired dorsal aortae
  {
    const a = sampleAt(cl, 1.0);
    const sac = a.p.clone().addScaledVector(a.d, 0.09);
    const bez3 = (p0, p1, p2, p3, n) => {
      const out = [];
      for (let i = 0; i <= n; i++) {
        const u = i / n, v = 1 - u;
        const w0 = v * v * v, w1 = 3 * v * v * u, w2 = 3 * v * u * u, w3 = u * u * u;
        out.push(new T.Vector3(
          w0 * p0.x + w1 * p1.x + w2 * p2.x + w3 * p3.x,
          w0 * p0.y + w1 * p1.y + w2 * p2.y + w3 * p3.y,
          w0 * p0.z + w1 * p1.z + w2 * p2.z + w3 * p3.z));
      }
      return out;
    };
    const DA_X = 0.44, DA_Z = -1.35;   // where the dorsal aortae run, behind the pharynx
    for (const side of [1, -1]) {
      // three arches (3rd, 4th, 6th), nested cranial to caudal. Each is ONE arc from the aortic
      // sac, bulging laterally, onto the dorsal aorta — arcs at different heights, so they never
      // cross. The first attempt raised the lateral control point as the end point fell, which
      // braided them into a pretzel.
      for (let k = 0; k < 2; k++) {
        const yEnd = sac.y + 1.10 - k * 0.52;
        const end = new T.Vector3(side * DA_X, yEnd, DA_Z);
        const path = bez3(sac,
          new T.Vector3(sac.x + side * (0.80 - k * 0.06), sac.y + (yEnd - sac.y) * 0.42, sac.z - 0.05),
          new T.Vector3(side * (1.02 - k * 0.06), yEnd + (yEnd - sac.y) * 0.16, DA_Z * 0.55),
          end, 22);
        add(g, 'arches', K.tubeAlong(path, () => 0.088, { ring: 14 }), { outline: 0.018 });
      }
      // the dorsal aorta itself, running caudally down the back of the embryo
      const da = [];
      for (let i = 0; i <= 12; i++) {
        const u = i / 12;
        da.push(new T.Vector3(side * DA_X * (1 - 0.28 * u * u), sac.y + 1.22 - u * 1.55, DA_Z + 0.12 * u));
      }
      add(g, 'arches', K.tubeAlong(da, u => 0.086 * (1 - 0.55 * u * u), { ring: 12 }), { outline: 0.016 });
    }
    {
      const sg = new T.SphereGeometry(1, 26, 18);
      sg.scale(0.36, 0.27, 0.33);
      sg.translate(sac.x, sac.y + 0.03, sac.z);
      add(g, 'arches', sg, { outline: 0.024 });
    }
  }

  // dorsal mesocardium — one isolated sheet, and it BREAKS DOWN, which is the point of showing it
  const mesoAlpha = t < 0.34 ? 1 : Math.max(0, 1 - (t - 0.34) / 0.24);
  if (mesoAlpha > 0.02 && opts.mesocardium !== false) {
    /* A mesentery is not a cut rectangle. Its free edge tapers to nothing where it meets the tube at
       each end, so the membrane reads as something suspending the heart rather than a sheet of card
       standing behind it. The first version drew the far edge at a constant depth and it looked
       exactly like what it was: a slab. */
    const pos = [], nml = [];
    const u0 = 0.30, u1 = 0.84, steps = 34;
    const A = new T.Vector3(), Bv = new T.Vector3(), C2 = new T.Vector3(), D2 = new T.Vector3();
    const n1 = new T.Vector3(), e1 = new T.Vector3(), e2 = new T.Vector3();
    const back = (u, out) => {
      const sm = sampleAt(cl, u);
      const taper = Math.pow(Math.sin(Math.PI * (u - u0) / (u1 - u0)), 0.75);
      return out.copy(sm.p).addScaledVector(sm.b, radius(u, t) * 0.80 + 1.35 * taper);
    };
    const front = (u, out) => {
      const sm = sampleAt(cl, u);
      return out.copy(sm.p).addScaledVector(sm.b, radius(u, t) * 0.80);
    };
    for (let i = 0; i < steps; i++) {
      const ua = u0 + (u1 - u0) * (i / steps), ub = u0 + (u1 - u0) * ((i + 1) / steps);
      front(ua, A); front(ub, Bv); back(ub, C2); back(ua, D2);
      n1.copy(e1.subVectors(Bv, A).cross(e2.subVectors(D2, A))).normalize();
      for (const v of [A, Bv, C2, A, C2, D2]) { pos.push(v.x, v.y, v.z); nml.push(n1.x, n1.y, n1.z); }
    }
    const geo = new T.BufferGeometry();
    geo.setAttribute('position', new T.Float32BufferAttribute(pos, 3));
    geo.setAttribute('normal', new T.Float32BufferAttribute(nml, 3));
    add(g, 'mesocardium', geo, {
      noOutline: true,
      matOver: { transparent: true, opacity: 0.40 * mesoAlpha, side: T.DoubleSide, depthWrite: false, roughness: 0.95, clearcoat: 0 },
      renderOrder: 18,
    });
  }

  // pericardial cavity — a CLOSED shell drawn from the inside, so rotating never has it swallow the
  // heart. Sized from the heart it actually contains, so it hugs the loop instead of framing it.
  if (opts.pericardium) {
    const box = new T.Box3().setFromObject(heartOnly);
    const c = box.getCenter(new T.Vector3()), sz = box.getSize(new T.Vector3());
    const geo = new T.SphereGeometry(1, 48, 32);
    geo.scale(sz.x * 0.40 + 0.85, sz.y * 0.38 + 0.60, sz.z * 0.45 + 1.05);
    geo.translate(c.x * 0.5, c.y * 0.75, c.z * 0.5 + 0.15);
    const m = new T.Mesh(geo, new T.MeshBasicMaterial({
      color: C(LAYERS.pericardium.color), transparent: true, opacity: 0.022,
      side: T.BackSide, depthWrite: false,
    }));
    m.renderOrder = 20; m.userData.key = 'pericardium'; m.name = LAYERS.pericardium.name;
    g.add(m);
    // a second, front-facing copy at a whisper of alpha gives the bubble an edge you can see
    const rim = new T.Mesh(geo.clone(), new T.MeshBasicMaterial({
      color: C(0xbfd8ff), transparent: true, opacity: 0.028,
      side: T.FrontSide, depthWrite: false, blending: T.AdditiveBlending,
    }));
    rim.renderOrder = 21; rim.userData.key = 'pericardium';
    g.add(rim);
  }

  return g;
}

window.LAYERS = LAYERS;
window.buildHeart = buildHeart;
