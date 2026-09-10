/* MedBank · neurulation — procedural embryo, v2 (organic)
 *
 * The whole embryo is a FUNCTION OF t: give it a number from 0 (flat neural plate) to 1 (closed
 * neural tube) and it returns the geometry for that instant. Seven "stages" are seven samples of one
 * continuous function, so they can never drift out of agreement with each other.
 *
 * THE FOLD. The neural plate is a strip of FIXED arc length L. Bending it is sweeping a circular arc
 * of half-angle phi = t*PI, radius R = L/(2*phi). At phi->0 it is flat; at phi=PI the arc has closed
 * into a circle of circumference L — the neural tube. Arc length is conserved, which is why it reads
 * as tissue folding rather than a shape being scaled.
 *
 * WHY NOTHING IS A BOX. v1 built every layer with ExtrudeGeometry from a rectangle, so each tissue
 * ended in a vertical cliff with right-angled corners — the one thing that instantly reads as CGI
 * rather than tissue. Every layer is now a LOFTED SHEET: a surface swept over the disc's elliptical
 * plan, whose thickness falls smoothly to nothing at the rim, so layers thin out and meet the way
 * real germ layers do. The single flat face is the cut at the front — that one is deliberate, because
 * this is a section, and a section has one honest flat face.
 */

const T = window.THREE;

const LAYERS = {
  amnion:   { color: 0x1e4f7d, name: 'Amniotic cavity' },
  surface:  { color: 0x1d6fbf, name: 'Surface ectoderm' },
  neuro:    { color: 0x6d28d9, name: 'Neural tissue' },
  crest:    { color: 0x2dd4bf, name: 'Neural crest cells' },
  meso:     { color: 0xcf3f3b, name: 'Mesoderm' },
  noto:     { color: 0xd4306f, name: 'Notochord' },
  endo:     { color: 0x5f9e2a, name: 'Endoderm' },
  yolk:     { color: 0xc47f18, name: 'Yolk sac' },
};

const W     = 3.2;    // disc half-width at its widest
const DEPTH = 3.6;    // cranio-caudal extent, from the cut face backwards
const L     = 2.95;    // neural plate arc length — CONSTANT, this is the whole trick

/* The disc is ONE LENS. Its total thickness tapers to nothing at the rim, and the three germ layers
   are fractions of that thickness — so they are always in contact and always thin out together,
   which is how a trilaminar disc actually behaves. Giving each layer its own fixed thickness made
   them float apart like separate leaves. */
const DISC_H = 1.30;
const F_ECTO = 0.00, F_MESO = 0.22, F_ENDO = 0.78, F_BASE = 1.00;
const TH_NEURO = 0.40;

function discH(x, z) {
  const a = Math.min(Math.abs(x) / W, 1);
  const b = Math.min(Math.abs(z) / DEPTH, 1);
  return DISC_H * (1 - Math.pow(a, 6)) * (0.60 + 0.40 * widthAt(b));
}

/* How wide the disc is at depth b (0 at the cut face, 1 at the far end).
   Rounded off at the far end so the embryo reads as a lens, never as a cut block. */
function widthAt(b) { return Math.sqrt(Math.max(1 - b * b * 0.86, 0.02)); }

/* Thickness falls to zero at the lateral rim: a^8 stays ~1 across the middle then drops fast,
   which is what gives a layer a soft feathered edge instead of a wall. */
function rimFalloff(a) { const k = 1 - Math.pow(Math.abs(a), 8); return Math.max(k, 0); }

/* -------- a lofted sheet over the disc's plan, capped flat only at the cut face -------- */
function sheet(f0, f1, material, opts = {}) {
  const nu = opts.nu || 72, nv = opts.nv || 40;
  const halfW = opts.halfW || W;
  const pos = [], idx = [];
  const gridTop = [], gridBot = [];

  for (let j = 0; j <= nv; j++) {
    const b = j / nv, z = -b * DEPTH, wid = halfW * widthAt(b);
    const rowT = [], rowB = [];
    for (let i = 0; i <= nu; i++) {
      const a = -1 + (2 * i) / nu, x = a * wid;
      const H = discH(x, z);
      const k = opts.carve ? opts.carve(x) : 1;
      const yT = -H * f0, yB = -H * (f0 + (f1 - f0) * k);
      rowT.push([x, yT, z]);
      rowB.push([x, yB, z]);
    }
    gridTop.push(rowT); gridBot.push(rowB);
  }

  const push = p => { pos.push(p[0], p[1], p[2]); return pos.length / 3 - 1; };
  const idT = gridTop.map(r => r.map(push));
  const idB = gridBot.map(r => r.map(push));

  for (let j = 0; j < nv; j++) for (let i = 0; i < nu; i++) {
    idx.push(idT[j][i], idT[j + 1][i], idT[j][i + 1]);
    idx.push(idT[j][i + 1], idT[j + 1][i], idT[j + 1][i + 1]);
    idx.push(idB[j][i], idB[j][i + 1], idB[j + 1][i]);
    idx.push(idB[j][i + 1], idB[j + 1][i + 1], idB[j + 1][i]);
  }
  /* the cut face — the one flat face, and it is a cut, so it should be flat */
  for (let i = 0; i < nu; i++) {
    idx.push(idT[0][i], idT[0][i + 1], idB[0][i]);
    idx.push(idT[0][i + 1], idB[0][i + 1], idB[0][i]);
  }
  /* far rim, closed so the sheet is a solid */
  for (let i = 0; i < nu; i++) {
    idx.push(idT[nv][i + 1], idT[nv][i], idB[nv][i + 1]);
    idx.push(idT[nv][i], idB[nv][i], idB[nv][i + 1]);
  }

  /* WINDING. Every triangle above was wound so that (b-a) x (c-a) pointed INTO the solid, which
     computeVertexNormals then turns into inward-facing normals. On a DoubleSide material that hides
     itself — the shading still looks lit — but the back-face silhouette shell in the viewer then
     inflates INWARDS and renders the near half of itself a hair in front of the surface. That is what
     produced the torn dark patches on the layers. Measured, not guessed: a probe over every mesh
     found only 25-38% of vertex normals pointing away from the solid's centroid. Reversing every
     triangle once, here, is provably consistent — it cannot introduce a new mismatch the way
     rewriting six index loops by hand could. See viz-training/RENDER-STANDARD.md rule 1. */
  for (let i = 0; i < idx.length; i += 3) { const s2 = idx[i + 1]; idx[i + 1] = idx[i + 2]; idx[i + 2] = s2; }

  const geo = new T.BufferGeometry();
  geo.setAttribute('position', new T.Float32BufferAttribute(pos, 3));
  geo.setIndex(idx);
  geo.computeVertexNormals();
  const m = new T.Mesh(geo, material);
  m.castShadow = m.receiveShadow = true;
  return m;
}

/* -------- the neural plate: an arc swept back, with ROUNDED free edges -------- */
function neuralSheet(t, material) {
  const phi = Math.max(t * Math.PI, 1e-3);
  const R = L / (2 * phi);
  const nu = 96, nv = 34, half = TH_NEURO / 2;
  const pos = [], idx = [];
  const ring = [];

  for (let j = 0; j <= nv; j++) {
    const b = j / nv, z = -b * DEPTH;
    /* the plate narrows and thins toward the far end, so it never ends in a slab */
    const shrink = 0.62 + 0.38 * widthAt(b);
    const row = [];
    /* walk the arc, then back along the other face, rounding the two free ends */
    for (let i = 0; i <= nu; i++) {
      const u = i / nu;
      let s, off;
      if (u < 0.45) {                       // outer (dorsal) face
        s = -phi + (2 * phi) * (u / 0.45); off = +half;
      } else if (u < 0.5) {                 // rounded tip at the caudal-lateral free edge
        const k = (u - 0.45) / 0.05; s = phi; off = half * Math.cos(k * Math.PI);
      } else if (u < 0.95) {                // inner (ventral) face, coming back
        s = phi - (2 * phi) * ((u - 0.5) / 0.45); off = -half;
      } else {                              // rounded tip at the other free edge
        const k = (u - 0.95) / 0.05; s = -phi; off = -half * Math.cos(k * Math.PI);
      }
      /* thin toward the free edges so the plate is a lens in section, not a slab with square
         corners — at the tips it is ~40% of its midline thickness and meets the ectoderm */
      const lat = 1 - 0.60 * Math.pow(Math.min(Math.abs(s) / phi, 1), 2.5);
      const cx = R * Math.sin(s), cy = R * (Math.cos(phi) - Math.cos(s));
      const nx = Math.sin(s), ny = -Math.cos(s);       // outward normal of the arc
      row.push([(cx + nx * off * lat) * shrink, (cy + ny * off * lat) * shrink * 0.94, z]);
    }
    ring.push(row);
  }

  const ids = ring.map(r => r.map(p => { pos.push(p[0], p[1], p[2]); return pos.length / 3 - 1; }));
  for (let j = 0; j < nv; j++) for (let i = 0; i < nu; i++) {
    idx.push(ids[j][i], ids[j + 1][i], ids[j][i + 1]);
    idx.push(ids[j][i + 1], ids[j + 1][i], ids[j + 1][i + 1]);
  }
  /* cap the cut face at z = 0 with a fan, and round the far end shut */
  const cx0 = pos.length / 3; pos.push(0, 0, 0);
  for (let i = 0; i < nu; i++) idx.push(cx0, ids[0][i + 1], ids[0][i]);
  const cx1 = pos.length / 3; pos.push(0, 0, -DEPTH);
  for (let i = 0; i < nu; i++) idx.push(cx1, ids[nv][i], ids[nv][i + 1]);

  const geo = new T.BufferGeometry();
  geo.setAttribute('position', new T.Float32BufferAttribute(pos, 3));
  geo.setIndex(idx);
  geo.computeVertexNormals();
  const m = new T.Mesh(geo, material);
  m.castShadow = m.receiveShadow = true;
  return m;
}

/* -------- a cavity: a dome over the disc, open at the cut face, thin-walled -------- */
function dome(sign, yBase, height, material) {
  const nu = 80, nv = 40, pos = [], idx = [];
  const rows = [];
  for (let j = 0; j <= nv; j++) {
    const b = j / nv, z = -b * DEPTH, wid = W * 0.92 * widthAt(b);
    const row = [];
    for (let i = 0; i <= nu; i++) {
      const a = -1 + (2 * i) / nu;
      const rise = Math.cos((a * Math.PI) / 2);          // dome falls to the rim
      const y = yBase + sign * height * Math.pow(rise, 1.35) * (0.35 + 0.65 * widthAt(b));
      row.push([a * wid, y, z]);
    }
    rows.push(row);
  }
  const ids = rows.map(r => r.map(p => { pos.push(p[0], p[1], p[2]); return pos.length / 3 - 1; }));
  for (let j = 0; j < nv; j++) for (let i = 0; i < nu; i++) {
    idx.push(ids[j][i], ids[j + 1][i], ids[j][i + 1]);
    idx.push(ids[j][i + 1], ids[j + 1][i], ids[j + 1][i + 1]);
  }
  /* `sign` mirrors the dome through the disc, and a mirror reverses handedness — so the amnion and
     the yolk sac were wound opposite ways and only one of them could be right. The probe put the
     amnion at 1.7% of normals facing outward against the yolk sac's 98.3%. Reverse the mirrored one
     and both cavities agree. */
  if (sign > 0) for (let i = 0; i < idx.length; i += 3) { const s2 = idx[i + 1]; idx[i + 1] = idx[i + 2]; idx[i + 2] = s2; }

  const geo = new T.BufferGeometry();
  geo.setAttribute('position', new T.Float32BufferAttribute(pos, 3));
  geo.setIndex(idx);
  geo.computeVertexNormals();
  return new T.Mesh(geo, material);
}

/* COLOUR SPACE. three treats a Color built from a hex literal as ALREADY LINEAR and the renderer
   encodes linear -> sRGB on output, so every layer colour was arriving lighter and less saturated
   than the hex says. This is the ONE place a material is made from a hex in this file, so converting
   here fixes the whole model — and the viewer reads the colour back off the material with getHex(),
   which is already linear, so it must not convert a second time. RENDER-STANDARD.md rule 2. */
function mat(hex, rough) {
  return new T.MeshStandardMaterial({ color: new T.Color(hex).convertSRGBToLinear(),
                                      roughness: rough === undefined ? 0.62 : rough,
                                      metalness: 0, side: T.DoubleSide });
}

/* ================================ the embryo at time t ================================ */
function buildEmbryo(t) {
  const g = new T.Group();
  const phi = Math.max(t * Math.PI, 1e-3);
  const R = L / (2 * phi);
  const tipX = Math.abs(R * Math.sin(phi));
  const fused = t > 0.86;
  const drop = fused ? -0.34 * ((t - 0.86) / 0.14) : 0;
  const gap = fused ? 0 : Math.max(tipX, 0.04);

  /* surface ectoderm: thins to nothing where the neural plate takes over, so the two are
     continuous tissue rather than a plate sitting in a slot cut out of a slab */
  const ecto = sheet(F_ECTO, F_MESO, mat(LAYERS.surface.color, 0.5), {
    /* thins to nothing where the neural plate takes over, so the two read as continuous tissue */
    carve: (x) => gap > 0.05 ? Math.min(Math.max((Math.abs(x) - gap) / 0.55, 0), 1) : 1
  });
  ecto.userData.key = 'surface'; g.add(ecto);

  const neuro = neuralSheet(t, mat(LAYERS.neuro.color, 0.46));
  neuro.position.y = drop - TH_NEURO / 2;
  neuro.userData.key = 'neuro'; g.add(neuro);

  /* mesoderm: parts around the midline, thickest laterally — it does not run under the notochord */
  const meso = sheet(F_MESO, F_ENDO, mat(LAYERS.meso.color, 0.72), {
    /* parts around the midline — mesoderm does not run under the notochord */
    carve: (x) => Math.min(Math.max((Math.abs(x) - 0.40) / 0.48, 0), 1)
  });
  meso.userData.key = 'meso'; g.add(meso);

  const endo = sheet(F_ENDO, F_BASE, mat(LAYERS.endo.color, 0.66));
  endo.userData.key = 'endo'; g.add(endo);

  /* notochord: a rod with rounded ends, in the midline under the plate */
  const noto = new T.Group();
  const rod = new T.Mesh(new T.CylinderGeometry(0.19, 0.19, DEPTH, 26, 1), mat(LAYERS.noto.color, 0.4));
  rod.rotation.x = Math.PI / 2; rod.position.z = -DEPTH / 2; noto.add(rod);
  const capEnd = new T.Mesh(new T.SphereGeometry(0.19, 24, 18), mat(LAYERS.noto.color, 0.4));
  capEnd.position.z = -DEPTH; noto.add(capEnd);
  noto.position.y = -DISC_H * 0.50;
  noto.traverse(n => { if (n.isMesh) { n.castShadow = true; n.userData.key = 'noto'; } });
  noto.userData.key = 'noto'; g.add(noto);

  /* neural crest: rounded cells at the fold tips, migrating laterally once the tube has closed */
  if (t > 0.62) {
    const appear = Math.min((t - 0.62) / 0.2, 1);
    const migrate = Math.max(0, (t - 0.9) / 0.1);
    for (const s of [-1, 1]) for (let i = 0; i < 6; i++) {
      const sp = new T.Mesh(new T.SphereGeometry(0.085 * appear, 20, 16), mat(LAYERS.crest.color, 0.34));
      sp.position.set(
        s * (Math.max(tipX, 0.14) + 0.12 + migrate * (0.34 + i * 0.28)),
        drop - 0.06 - migrate * (0.14 + i * 0.05),
        -0.35 - i * 0.52
      );
      sp.castShadow = true; sp.userData.key = 'crest'; g.add(sp);
    }
  }

  const faint = (hex) => {
    const m = mat(hex, 0.45);
    m.transparent = true; m.opacity = 0.20; m.depthWrite = false;
    return m;
  };
  const amn = dome(+1, 0.02, 0.62, faint(LAYERS.amnion.color));
  amn.userData.key = 'amnion'; amn.renderOrder = -2; amn.castShadow = amn.receiveShadow = false;
  g.add(amn);
  const yolk = dome(-1, -DISC_H - 0.02, 0.74, faint(LAYERS.yolk.color));
  yolk.userData.key = 'yolk'; yolk.renderOrder = -2; yolk.castShadow = yolk.receiveShadow = false;
  g.add(yolk);

  return g;
}

window.LAYERS = LAYERS;
window.buildEmbryo = buildEmbryo;
