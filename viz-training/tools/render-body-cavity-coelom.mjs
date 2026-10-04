/* MedBank · headless proof for models3d/body-cavity-coelom.js
 *
 * The five checks BUILD-TASK-PROMPT section 3 requires, plus four this model needs on top:
 *   1. it renders — many t and many option sets, screenshots to viz-training/models-out/body-cavity-coelom/
 *   2. the console is clean — no error, no warning, no throw, in the model page AND the adapter page
 *   3. normals point outward — per mesh, against that mesh's own centroid, hull and whole buffer, plus
 *      face-normal / vertex-normal agreement, which is the winding test
 *   4. every ref the scene names resolves THROUGH THE REAL ADAPTER in viz3d.js, with geometry; every
 *      unpinned ref FOLLOWS the view; and the model's STATIC_PARTS and STAGE_LIMITED declarations are
 *      asserted against what the adapter actually returns
 *   5. THE PROXY IS CHECKED. acceptance() takes some rows off the profile rows and the solve; this
 *      re-measures those same relations on ACTUAL MESH VERTICES, so a proxy is never trusted unchecked
 *   6. NO OPEN LUMEN. Rays from each camera report whether the FIRST surface they meet faces away
 *   7. EVERY FLOOR HAS A NEGATIVE CASE — each is fed a value it MUST reject
 *   8. EVERY MEASUREMENT IS PERTURBED. RENDER-STANDARD: "change the constant the geometry uses and the
 *      reported number must move". Run in node with vm, against the same file the page loads
 *   9. THE AXES ARE CHECKED AGAINST A MESH-ANCHORED MODEL (route b of RENDER-STANDARD's rule): this
 *      model's AXES object and ACCEPTANCE.axes string must agree with lateral-folding's, whose
 *      convention IS measured off BodyParts3D right/left pairs. prove-corpus-axes.mjs is also run when
 *      the STL corpus is reachable, and says so either way
 *  10. TERMINAL ENDS: every tube in this model is closed with K.domeCap, never a bare annulus
 *
 * WHERE THIS RUNS. In a Linux container with chromium, against a copy of the repo — the mount that
 * holds the real repo has no browser and no shell. The file under test is byte identical. Run from
 * the repo root:  node viz-training/tools/render-body-cavity-coelom.mjs
 */
import { chromium } from 'playwright';
import { readFileSync, writeFileSync, mkdirSync } from 'fs';
import http from 'http';
import { execFileSync } from 'node:child_process';
import path from 'path';
import fs from 'fs';
import vm from 'vm';
import { createRequire } from 'module';

const ROOT = process.cwd();
const OUT = 'viz-training/models-out/body-cavity-coelom';
mkdirSync(OUT, { recursive: true });

const MIME = { '.js': 'text/javascript', '.mjs': 'text/javascript', '.json': 'application/json', '.html': 'text/html' };
const server = http.createServer((req, res) => {
  const p = path.join(ROOT, decodeURIComponent(req.url.split('?')[0]));
  fs.readFile(p, (e, buf) => {
    if (e) { res.writeHead(404); return res.end('no'); }
    res.writeHead(200, { 'content-type': MIME[path.extname(p)] || 'application/octet-stream' });
    res.end(buf);
  });
});
await new Promise(r => server.listen(0, r));
const PORT = server.address().port;
const BASE = `http://127.0.0.1:${PORT}/`;

const SCENE = 'viz-training/scenes/embryology__folding-of-the-embryo__body-cavity-coelom.json';
let REFS = [];
try {
  const scene = JSON.parse(readFileSync(SCENE, 'utf8'));
  REFS = scene.structures.map(s => ({ key: s.key, ref: s.refs && s.refs.procedural })).filter(r => r.ref);
} catch (e) { console.warn('scene not readable yet:', e.message); }

const W = 1000, H = 1000;
const FULL = { linings: true, wall: true };
const STAGES = [
  ['t000',       0.00, {}, 'week 3 — one horseshoe coelom, open on both flanks'],
  ['t020',       0.20, {}, 'the folds have met; septum transversum in, both canals wide open'],
  ['t042',       0.42, {}, 'the lung buds are growing into the canals'],
  ['t052',       0.52, {}, 'the pleuropericardial membranes have fused — TWO cavities'],
  ['t077-right', 0.7658, {}, 'the RIGHT canal is shut and the left is not — THREE cavities'],
  ['t100',       1.00, {}, 'about week 8 — four cavities, diaphragm at L1'],
  ['t000-bare',  0.00, { wall: false, linings: false }, 'week 3, the cavity alone'],
  ['t100-bare',  1.00, { wall: false, linings: false }, 'week 8, the cavity alone'],
  ['t100-cav',   1.00, { wall: false }, 'the four casts and their two linings'],
  ['t100-boch',  1.00, { bochdalek: true, wall: false }, 'Bochdalek — the LEFT canal never closed'],
  ['t100-morg',  1.00, { morgagni: true, wall: false }, 'Morgagni — a gap at the ventral corner, on the RIGHT'],
  ['t100-event', 1.00, { eventration: true, wall: false }, 'eventration — complete, but thin and high'],
  ['t100-hiat',  1.00, { hiatus_wide: true, wall: false }, 'a congenitally wide oesophageal hiatus'],
  ['t100-ect',   1.00, { ectopia: true }, 'ectopia cordis — the ventral wall never closed'],
];
/* THE CAMERA HAS TO LOOK AT THE DIAPHRAGM FROM BELOW for half of these, because four of the ten beats
   rotate to `inferior` and the territory map is only legible from there. So each stage is rendered
   from three attitudes rather than one chosen: anterior, inferior-oblique, and left-lateral. */
const LEAF = ['septum_transversum', 'pleuroperitoneal', 'muscular_rim', 'crura',
              'bochdalek', 'morgagni', 'oesophagus'];
const VIEWS = [['ant', 0, 0, null], ['inf', 0.25, -1.05, LEAF], ['lat', 1.35, 0.12, null]];
/* `inf` is the only attitude given a subject list: it is the one the territory map is read from,
   and the one the 2026-10-01 review measured as loosely framed (finding 6). */

const html = `<!doctype html><meta charset=utf8>
<link rel="icon" href="data:,">
<body style="margin:0;background:#0e1626">
<canvas id=c width=${W} height=${H}></canvas>
<script src="${BASE}node_modules/three/build/three.js"><\/script>
<script src="${BASE}models3d/render-kit.js"><\/script>
<script src="${BASE}models3d/body-cavity-coelom.js"><\/script>
<script>
window.MEDBANK_CONFIG = { MODEL_BASE: '${BASE}models3d/' };
const renderer = new THREE.WebGLRenderer({ canvas: document.getElementById('c'), antialias: true });
renderer.setSize(${W}, ${H}, false); renderer.setPixelRatio(1);
VizKit.configureRenderer(renderer);
const scene = new THREE.Scene();
scene.background = VizKit.bg(0x0e1626);
const L = VizKit.standardLights(scene);
const camera = new THREE.PerspectiveCamera(32, 1, 0.1, 200);
let group = null;
const MOD = window.MB3D_MODELS['body-cavity-coelom'];
const FULL = ${JSON.stringify(FULL)};
function opts(o) { return Object.assign({}, FULL, o || {}); }
window.setStage = function (t, o, yaw, pitch, fitKeys) {
  if (group) scene.remove(group);
  group = MOD.build(t, opts(o));
  group.rotation.y = yaw || 0;
  group.rotation.x = pitch || 0;
  group.updateMatrixWorld(true);
  scene.add(group);
  /* FIT TO THE SUBJECT, NOT TO THE BOUNDING BOX OF EVERYTHING. fitKeys is omitted by every
     probe, so their camera is bit-for-bit what it always was and their coverage is unchanged;
     only the screenshot pass passes it. A proxy group of geometry-sharing clones is used so the
     kit's own fitCamera does the arithmetic on exactly the subject's world bounds. */
  let fitTarget = group, fitN = 0, fitFellBack = false;
  if (fitKeys && fitKeys.length) {
    const proxy = new THREE.Group();
    group.traverse(function (ob) {
      if (ob.isMesh && ob.userData && fitKeys.indexOf(ob.userData.key) >= 0) {
        const c = new THREE.Mesh(ob.geometry, ob.material);
        c.applyMatrix4(ob.matrixWorld);
        proxy.add(c); fitN++;
      }
    });
    if (fitN) { proxy.updateMatrixWorld(true); fitTarget = proxy; }
    else fitFellBack = true;   /* e.g. t=0: there is no diaphragm yet. Reported, not hidden. */
  }
  function place(target) {
    const f = VizKit.fitCamera(camera, target, 1.04);
    camera.position.set(f.centre.x, f.centre.y, f.centre.z + f.distance);
    camera.lookAt(f.centre);
    L.key.position.set(camera.position.x + 6, camera.position.y + 8, camera.position.z + 4);
    renderer.render(scene, camera);
    return f;
  }
  let f = place(fitTarget);
  let fitUsed = (fitTarget === group) ? 'whole-model' : 'subject';
  /* OCCUPANCY, so "the subject fills the frame" is a number in report.json and not an opinion.
     Read off the canvas the screenshot is taken from, against the background the scene clears to. */
  const gl = renderer.getContext();
  function occupancy() {
    const px = new Uint8Array(${W} * ${H} * 4);
    gl.readPixels(0, 0, ${W}, ${H}, gl.RGBA, gl.UNSIGNED_BYTE, px);
    let lit = 0, x0 = 1e9, y0 = 1e9, x1 = -1, y1 = -1, border = 0;
    const bgc = [px[0], px[1], px[2]];
    for (let y = 0; y < ${H}; y++) for (let x = 0; x < ${W}; x++) {
      const i = (y * ${W} + x) * 4;
      if (Math.abs(px[i] - bgc[0]) > 3 || Math.abs(px[i+1] - bgc[1]) > 3 || Math.abs(px[i+2] - bgc[2]) > 3) {
        lit++; if (x < x0) x0 = x; if (x > x1) x1 = x; if (y < y0) y0 = y; if (y > y1) y1 = y;
        if (x === 0 || y === 0 || x === ${W} - 1 || y === ${H} - 1) border++;
      }
    }
    return { litFrac: lit / (${W} * ${H}), borderPx: border,
             spanW: lit ? (x1 - x0 + 1) / ${W} : 0, spanH: lit ? (y1 - y0 + 1) / ${H} : 0 };
  }
  let occ = occupancy();
  /* THE TIGHTER FIT ONLY IF IT HOLDS THE WHOLE PICTURE. A cropped proof frame is worse than a loose
     one: it hides geometry instead of merely shrinking it. */
  if (fitUsed === 'subject' && occ.borderPx > 0) {
    f = place(group); fitUsed = 'whole-model (subject fit cropped)'; occ = occupancy();
  }
  const px = new Uint8Array(${W} * ${H} * 4);
  gl.readPixels(0, 0, ${W}, ${H}, gl.RGBA, gl.UNSIGNED_BYTE, px);
  return { size: [f.size.x, f.size.y, f.size.z], fitN: fitN, fitFellBack: fitFellBack,
           fitUsed: fitUsed, litFrac: occ.litFrac, borderPx: occ.borderPx,
           spanW: occ.spanW, spanH: occ.spanH };
};
window.solved = function () { return MOD.solved(); };
window.acceptance = function () { return MOD.acceptance(); };
window.normalProbe = function (t, o) {
  const g = MOD.build(t, opts(o));
  g.updateMatrixWorld(true);
  const rows = [], nm = new THREE.Matrix3();
  g.traverse(function (ob) {
    if (!ob.isMesh || !ob.geometry) return;
    const u = ob.userData || {};
    if (u.outline) return;
    const geo = ob.geometry.index ? ob.geometry.toNonIndexed() : ob.geometry;
    const p = geo.attributes.position, n = geo.attributes.normal;
    if (!n) return;
    const hull = (ob.geometry.userData && ob.geometry.userData.hullCount) || 0;
    nm.getNormalMatrix(ob.matrixWorld);
    const c = new THREE.Vector3(), v = new THREE.Vector3(), w = new THREE.Vector3();
    for (let i = 0; i < p.count; i++) c.add(v.fromBufferAttribute(p, i).applyMatrix4(ob.matrixWorld));
    c.divideScalar(p.count);
    let out = 0, outHull = 0;
    for (let i = 0; i < p.count; i++) {
      v.fromBufferAttribute(p, i).applyMatrix4(ob.matrixWorld).sub(c);
      w.fromBufferAttribute(n, i).applyMatrix3(nm).normalize();
      if (v.dot(w) > 0) { out++; if (i < hull) outHull++; }
    }
    let agree = 0, tris = 0;
    const a1 = new THREE.Vector3(), b1 = new THREE.Vector3(), c1 = new THREE.Vector3();
    const e1 = new THREE.Vector3(), e2 = new THREE.Vector3(), fn = new THREE.Vector3(), vn = new THREE.Vector3();
    for (let i = 0; i + 2 < p.count; i += 3) {
      a1.fromBufferAttribute(p, i); b1.fromBufferAttribute(p, i + 1); c1.fromBufferAttribute(p, i + 2);
      fn.copy(e1.subVectors(b1, a1).cross(e2.subVectors(c1, a1)));
      if (fn.lengthSq() < 1e-16) continue;
      fn.normalize(); vn.set(0, 0, 0);
      for (let k = 0; k < 3; k++) vn.add(new THREE.Vector3().fromBufferAttribute(n, i + k));
      if (vn.lengthSq() < 1e-16) continue;
      vn.normalize(); tris++; if (fn.dot(vn) > 0) agree++;
    }
    rows.push({ key: u.key, verts: p.count, outward: out / p.count,
                hullVerts: hull, outwardHull: hull ? outHull / hull : null,
                tris: tris, winding: tris ? agree / tris : null,
                degenerate: (ob.geometry.userData && ob.geometry.userData.degenerateNormals) || 0,
                gridFlipped: !!(ob.geometry.userData && ob.geometry.userData.gridFlipped),
                gridSwapped: !!(ob.geometry.userData && ob.geometry.userData.gridSwapped) });
  });
  return rows;
};
/* 6 — NO OPEN LUMEN. A grid of rays from the current camera; the FIRST surface each one meets must
   face the camera. A cut end left as an annulus answers "the far one", which is the winding bug's
   own signature (RENDER-STANDARD 2.4b). */
window.lumenProbe = function (n) {
  const ray = new THREE.Raycaster();
  ray.firstHitOnly = false;
  const meshes = [];
  group.traverse(o => { if (o.isMesh && o.geometry && !(o.userData && o.userData.outline)) meshes.push(o); });
  let cast = 0, away = 0; const bad = [];
  for (let i = 0; i < n; i++) for (let j = 0; j < n; j++) {
    const x = (i + 0.5) / n * 2 - 1, y = (j + 0.5) / n * 2 - 1;
    ray.setFromCamera(new THREE.Vector2(x, y), camera);
    const hits = ray.intersectObjects(meshes, false);
    if (!hits.length) continue;
    cast++;
    const h = hits[0];
    if (!h.face) continue;
    const nrm = h.face.normal.clone().applyMatrix3(new THREE.Matrix3().getNormalMatrix(h.object.matrixWorld)).normalize();
    const toCam = new THREE.Vector3().subVectors(camera.position, h.point).normalize();
    if (nrm.dot(toCam) < -0.02) { away++; if (bad.length < 12) bad.push({ key: h.object.userData && h.object.userData.key, dot: +nrm.dot(toCam).toFixed(3) }); }
  }
  return { cast: cast, away: away, frac: cast ? away / cast : 0, bad: bad };
};
/* 5 — THE SAME RELATIONS, RE-MEASURED ON REAL MESH VERTICES. The model takes N off the profile rows
   and F off a transverse polyline; these read the vertices those rows and that polyline produced. */
window.meshClaims = function () {
  const MOD2 = MOD;
  const g1 = MOD2.build(1, opts({}));
  const g42 = MOD2.build(0.42, opts({}));
  const g0 = MOD2.build(0, opts({}));
  const by = (g, keys) => MOD2.trisByKey(g, keys);
  const box = (tris) => {
    const lo = [1e9, 1e9, 1e9], hi = [-1e9, -1e9, -1e9];
    for (const tri of tris) for (const p of tri) {
      for (let d = 0; d < 3; d++) { const v = [p.x, p.y, p.z][d]; if (v < lo[d]) lo[d] = v; if (v > hi[d]) hi[d] = v; }
    }
    return { lo, hi };
  };
  const nearest = (A, B) => {
    let m = 1e9;
    const sa = Math.max(1, Math.floor(A.length / 900)), sb = Math.max(1, Math.floor(B.length / 900));
    for (let i = 0; i < A.length; i += sa) for (let j = 0; j < B.length; j += sb)
      m = Math.min(m, A[i][0].distanceTo(B[j][0]));
    return m;
  };
  /* N ON THE MESH, ALONG THE PATH AND NOT IN y. The model's row-side number is the overlap of the
     pleural and peritoneal casts at the caudal waist, over the cast's own diameter there. The first
     version of this re-measurement took the overlap as a y-extent and divided by an x-extent, and
     read 0.189 against a proxy of 0.339 — a disagreement that was entirely the measure's, because
     the path at the waist is oblique and its diameter is not its x extent. So both are now taken in
     the waist's OWN FRAME, which the model publishes through waistAt(). */
  const WZ42 = MOD2.waistAt(0.42);
  const wd = new THREE.Vector3(WZ42.d.x, WZ42.d.y, WZ42.d.z).normalize();
  const wp = new THREE.Vector3(WZ42.p.x, WZ42.p.y, WZ42.p.z);
  const along = (tris) => {
    let lo = 1e9, hi = -1e9;
    for (const tri of tris) for (const q of tri) {
      const u = new THREE.Vector3().subVectors(q, wp).dot(wd);
      if (u < lo) lo = u; if (u > hi) hi = u;
    }
    return { lo, hi };
  };
  /* the cast's own calibre AT the waist: the greatest perpendicular distance among vertices within
     one waist-radius of the waist plane, and within three radii of the centreline so that a limb on
     the far side of the midline cannot inflate it. */
  const across = (tris) => {
    let m = 0;
    for (const tri of tris) for (const q of tri) {
      const d0 = new THREE.Vector3().subVectors(q, wp);
      const u = d0.dot(wd);
      if (Math.abs(u) > 0.025) continue;   // a THIN band: the radius varies fast at a waist
      const v = d0.clone().addScaledVector(wd, -u);
      const L = v.length();
      if (L > 3 * WZ42.r) continue;
      if (L > m) m = L;
    }
    return 2 * m;
  };
  /* THE LEFT LIMB, because waistAt() returns the waist at +S_PT, which is the LEFT one. Measured
     against pleural_r the perpendicular distances came out at 1.52 — the width of the embryo, not the
     calibre of a canal — because the frame was on the other side of the midline. Both canals are
     equally open at t = 0.42, so the side is free; getting it wrong is not. */
  const pl42 = by(g42, ['pleural_l']).pleural_l, pe42 = by(g42, ['peritoneal']).peritoneal;
  const apl = along(pl42), ape = along(pe42);
  /* the pleural cast runs toward +u from the waist, the peritoneal away from it, so their overlap is
     the peritoneal's top minus the pleural's bottom, measured along the waist's own direction */
  const overlapY = Math.min(apl.hi, ape.hi) - Math.max(apl.lo, ape.lo);
  const diam = across(pl42) || 1;
  /* H-band ON THE BUILT NERVE: the phrenic's most cranial vertex must sit at C3, read off the
     model's own vertebral table, within one rootlet radius. The row-side version of this claim is a
     TAUTOLOGY under a change of scale — the roots are placed AT LEV(n) and the band is read off the
     same table, so perturbing SEG moves both and the number stays 0. That is declared in the
     perturbation table, where the lever is the ROOT PLACEMENT instead. This measure reads vertices. */
  const ph = by(g1, ['phrenic']).phrenic || [];
  let phTop = -1e9;
  for (const tri of ph) for (const q of tri) phTop = Math.max(phTop, q.y);
  const rootC3 = MOD2.rootY()[0];
  /* F on the mesh: at t = 1, cast rays in the transverse plane from inside the flank of the
     peritoneal cast and ask whether any reaches outside the BUILT body wall's triangles. */
  const wall = by(g1, ['body_wall']).body_wall || [];
  const w0 = by(g0, ['body_wall']).body_wall || [];
  const flank = (g) => {
    const t = by(g, ['peritoneal']).peritoneal, b = box(t);
    return { x: (b.lo[0] + b.hi[0]) / 2 - 0.45 * (b.hi[0] - b.lo[0]), y: (b.lo[1] + b.hi[1]) / 2, z: (b.lo[2] + b.hi[2]) / 2 };
  };
  const escMesh = (tris, from, nRays) => {
    /* a 2D crossing count in the transverse plane y = from.y: every triangle that straddles that
       plane contributes a segment, and a ray escapes if it crosses no segment. */
    const segs = [];
    for (const tri of tris) {
      const ys = [tri[0].y, tri[1].y, tri[2].y];
      if (Math.min(...ys) > from.y || Math.max(...ys) < from.y) continue;
      const pts = [];
      for (let k = 0; k < 3; k++) {
        const a = tri[k], b = tri[(k + 1) % 3];
        if ((a.y - from.y) * (b.y - from.y) > 0) continue;
        const d = b.y - a.y;
        const u = Math.abs(d) < 1e-12 ? 0 : (from.y - a.y) / d;
        pts.push({ x: a.x + u * (b.x - a.x), z: a.z + u * (b.z - a.z) });
      }
      if (pts.length >= 2) segs.push([pts[0], pts[1]]);
    }
    let out = 0;
    for (let i = 0; i < nRays; i++) {
      const a = (i / nRays) * Math.PI * 2, dx = Math.cos(a), dz = Math.sin(a);
      let hit = false;
      for (const [p, q] of segs) {
        const bx = q.x - p.x, bz = q.z - p.z;
        const den = dx * bz - dz * bx;
        if (Math.abs(den) < 1e-12) continue;
        const s = ((p.x - from.x) * bz - (p.z - from.z) * bx) / den;
        const u = ((p.x - from.x) * dz - (p.z - from.z) * dx) / den;
        if (s > 1e-6 && u >= 0 && u <= 1) { hit = true; break; }
      }
      if (!hit) out++;
    }
    return { escapes: out, rays: nRays, segs: segs.length };
  };
  const f1 = escMesh(wall, flank(g1), 240);
  const f0 = escMesh(w0, flank(g0), 240);
  /* C on the mesh is already a mesh measure — re-run it here at a third resolution. */
  const c1 = MOD2.componentsOf(g1, 1, {}, 0.050);
  const c0 = MOD2.componentsOf(g0, 0, {}, 0.050);
  return {
    floors: MOD2.FLOORS,
    Hband: phTop - rootC3, Hband_top: phTop, Hband_c3: rootC3,
    N: diam > 0 ? overlapY / diam : null, N_overlapY: overlapY, N_diam: diam,
    F: f1.escapes, F_segs: f1.segs, F_neg: f0.escapes, F_negSegs: f0.segs,
    C1: c0.count, C4: c1.count, C_h: 0.050,
  };
};
/* 10 — TERMINAL ENDS. Every tube here is closed by K.domeCap through K.tubeCapped; a bare annulus
   would leave a ring of triangles whose normals lie IN the end plane. Counted per key. */
window.terminalProbe = function () {
  const g = MOD.build(1, opts({}));
  g.updateMatrixWorld(true);
  const rows = {};
  g.traverse(function (ob) {
    if (!ob.isMesh || !ob.geometry || (ob.userData && ob.userData.outline)) return;
    const k = ob.userData && ob.userData.key; if (!k) return;
    const p = ob.geometry.attributes.position, n = ob.geometry.attributes.normal;
    if (!p || !n) return;
    const r = rows[k] || (rows[k] = { tris: 0, flat: 0 });
    const a = new THREE.Vector3(), b = new THREE.Vector3(), c = new THREE.Vector3();
    const e1 = new THREE.Vector3(), e2 = new THREE.Vector3(), fn = new THREE.Vector3();
    const n0 = new THREE.Vector3(), n1 = new THREE.Vector3(), n2 = new THREE.Vector3();
    for (let i = 0; i + 2 < p.count; i += 3) {
      a.fromBufferAttribute(p, i); b.fromBufferAttribute(p, i + 1); c.fromBufferAttribute(p, i + 2);
      fn.copy(e1.subVectors(b, a).cross(e2.subVectors(c, a)));
      if (fn.lengthSq() < 1e-16) continue;
      r.tris++;
      n0.fromBufferAttribute(n, i); n1.fromBufferAttribute(n, i + 1); n2.fromBufferAttribute(n, i + 2);
      /* three vertex normals that are identical AND perpendicular to nothing in particular is a flat
         cap; what identifies an ANNULUS is identical normals over a ring of triangles at an extreme
         of the tube. Counted as "flat" and reported per key for a reader to judge. */
      if (n0.distanceToSquared(n1) < 1e-10 && n1.distanceToSquared(n2) < 1e-10) r.flat++;
    }
  });
  return rows;
};
<\/script>`;
writeFileSync(`${OUT}/_harness.html`, html);

const adapterHtml = `<!doctype html><meta charset=utf8><link rel="icon" href="data:,"><body>
<script src="${BASE}node_modules/three/build/three.js"><\/script>
<script>window.MEDBANK_CONFIG = { MODEL_BASE: '${BASE}models3d/' };<\/script>
<script src="${BASE}viz3d.js"><\/script>
<script>
window.resolveAll = function (refs) {
  const ad = window.MB3D.adapters.procedural;
  return Promise.all(refs.map(function (r) {
    return ad.load(window.THREE, { key: r.key, refs: { procedural: r.ref } })
      .then(function (res) {
        const m = res && res.mesh;
        return { key: r.key, ref: r.ref, reason: res && res.reason, hasMesh: !!m,
                 tris: m && m.geometry ? m.geometry.attributes.position.count / 3 : 0 };
      }, function (e) { return { key: r.key, ref: r.ref, error: String(e && e.message || e) }; });
  }));
};
/* THE SCENE MOVES BY SET_STAGE, so the thing to prove is not only that every ref resolves but that
   every unpinned ref FOLLOWS THE VIEW and comes back with different geometry at a different t. A ref
   that silently pinned itself would sit at t = 1 for ever while its neighbours walked the stages, and
   the picture would look entirely fine. Driven through the adapter's own stageable()/atStage() pair. */
window.stageAll = function (refs) {
  const ad = window.MB3D.adapters.procedural;
  const MODEL = (window.MB3D_MODELS || {})['body-cavity-coelom'] || {};
  const STATIC = MODEL.STATIC_PARTS || {}, FIRST = MODEL.STAGE_LIMITED || {};
  return Promise.all(refs.map(function (r) {
    const s = { key: r.key, refs: { procedural: r.ref } };
    const able = ad.stageable(s);
    const part = String(r.ref).split('#')[1].split(/[@+]/)[0];
    if (!able) return Promise.resolve({ key: r.key, ref: r.ref, part: part, stageable: false });
    const lo = FIRST[part] != null ? Math.min(1, FIRST[part] + 0.02) : 0;
    const s0 = ad.atStage(s, lo), s1 = ad.atStage(s, 1);
    const sAbsent = FIRST[part] != null ? ad.atStage(s, Math.max(0, FIRST[part] - 0.02)) : null;
    const jobs = [ad.load(window.THREE, s0), ad.load(window.THREE, s1)];
    if (sAbsent) jobs.push(ad.load(window.THREE, sAbsent));
    return Promise.all(jobs).then(function (rs) {
      const g0 = rs[0].mesh && rs[0].mesh.geometry, g1 = rs[1].mesh && rs[1].mesh.geometry;
      let moved = false;
      if (g0 && g1) {
        const a = g0.attributes.position, b = g1.attributes.position;
        if (a.count !== b.count) moved = true;
        else for (let i = 0; i < a.count; i += Math.max(1, Math.floor(a.count / 400)))
          if (Math.abs(a.getX(i) - b.getX(i)) + Math.abs(a.getY(i) - b.getY(i)) > 1e-4) { moved = true; break; }
      }
      return { key: r.key, ref: r.ref, part: part, stageable: true, loT: lo,
               t0: !!g0, t1: !!g1, moved: moved,
               declaredStatic: Object.prototype.hasOwnProperty.call(STATIC, part),
               declaredFirstT: FIRST[part] == null ? null : FIRST[part],
               absentBefore: sAbsent ? !(rs[2].mesh) : null };
    });
  }));
};
<\/script>`;
writeFileSync(`${OUT}/_adapter.html`, adapterHtml);

/* ------------------------------------------------------------------ 7. NEGATIVE CASES

   Every floor is fed a value it MUST reject. RENDER-STANDARD: "a test that grades its own homework in
   the wrong units is worse than no test — it launders a defect into a proof." This disciplines the
   PREDICATE and nothing else, which is exactly why check 8 below exists as well. */
function negativeCases(FL) {
  const cases = [
    ['A (flap residual)', 1e-4, v => v <= FL.FLAPRES],
    ['A-slack (too short)', 0.98, v => v >= FL.SLACKLO && v <= FL.SLACKHI],
    ['A-slack (absurdly long)', 3.0, v => v >= FL.SLACKLO && v <= FL.SLACKHI],
    ['B (no three-cavity window)', 0.0, v => v >= FL.WINDOW3],
    ['B (left shuts first)', -0.1, v => v >= FL.WINDOW3],
    ['C (five cavities)', 5, v => v === 4],
    ['C (two cavities at the end)', 2, v => v === 4],
    ['C1 (already divided in week 3)', 2, v => v === 1],
    ['C3 (not three at the right-before-left stage)', 4, v => v === 3],
    ['D (hernia does not reconnect)', 4, v => v === 3],
    ['D (hernia on the wrong side)', -0.5, v => v >= FL.SIDEX],
    ['D2 (Morgagni not ventral enough)', 0.1, v => v >= FL.SIDEZ],
    ['E (eventration changes the count)', 3, v => v === 4],
    ['F (not sealed)', 7, v => v === 0],
    ['F-neg (sealed in week 3)', 3, v => v >= FL.OPEN],
    ['F-ect (ectopia does not open it)', 10, v => v >= FL.OPEN],
    ['G (holes in the finished leaf)', 0.90, v => v >= FL.COVER],
    ['G-neg (a defect that is not a hole)', 0.001, v => v >= FL.DEFECT],
    ['H (the roots drift)', 0.01, v => v <= FL.ROOTFIX],
    ['H-band (a root outside C3-C5)', -0.2, v => v >= -1e-12],
    ['I (does not finish at L1)', 0.5, v => v <= FL.L1],
    ['J (the nerve barely grows)', 1.2, v => v >= FL.NERVEGROW],
    ['J-min (shorter than the straight line)', -0.01, v => v >= -1e-9],
    ['J-sac (no detour: it goes through the sac)', 0.001, v => v >= FL.NERVEDET],
    ['J-res (relaxation did not converge)', 1e-3, v => v <= FL.PHRES],
    ['K (the oesophagus fouls the crura)', 0.02, v => v >= FL.HIAT],
    ['K-wide (the wide hiatus is no wider)', 1.05, v => v >= FL.HIATW],
    ['L (splanchnic nearer the wall than somatic)', -0.1, v => v >= FL.LINING],
    ['L (the two layers indistinguishable)', 0.01, v => v >= FL.LINING],
    ['M (an unnamed pair shares space)', 0.25, v => v <= FL.SHARE],
    ['M (the probe is voting 2-1)', 0.4, v => v <= FL.SPLIT],
    ['N (the canal is a crack, not an opening)', 0.05, v => v >= FL.WAIST],
  ];
  const rows = cases.map(([id, val, pred]) => ({ id, fed: val, rejected: !pred(val) }));
  return { rows, allRejected: rows.every(r => r.rejected), n: rows.length };
}

/* ------------------------------------------------------------------ 8. PERTURBATION

   RENDER-STANDARD section 3, AN ACCEPTANCE MEASUREMENT MUST BE A FUNCTION OF THE BUILT GEOMETRY:
   "the check is a PERTURBATION — change the constant the geometry uses and the reported number must
   move." A magnitude floor disciplines the comparison and a negative case disciplines the predicate;
   neither says one word about where the measured number came from, so a compile-time constant
   satisfies both perfectly. That is how lateral-folding shipped two rows whose measured side was
   arithmetic typed in by hand.

   PICKING THE LEVER IS THE WORK. Each row below names a constant its claim genuinely depends on; the
   constant is substituted in a COPY of the model source, the model is re-evaluated in a fresh vm
   context, and the row's number must MOVE. Two were wrong on the first attempt and both were
   informative: perturbing PART_GAP does not move the component counts (the casts separate either
   way, just by more or less), and perturbing R_OES does not move row K's RATIO (K-wide is a ratio of
   two clearances and the oesophagus cancels). The levers below are the ones that do move. */
const require2 = createRequire(import.meta.url);
const THREE_NODE = require2(ROOT + '/node_modules/three/build/three.js');
const KIT_SRC = readFileSync('models3d/render-kit.js', 'utf8');
const MODEL_SRC = readFileSync('models3d/body-cavity-coelom.js', 'utf8');

function evalModel(src) {
  const sandbox = {
    window: { THREE: THREE_NODE }, console: { log() {}, warn() {}, error() {} },
    Math, isFinite, isNaN, Number, Float32Array, Float64Array, Int8Array, Int16Array, Int32Array,
    Uint8Array, Uint8ClampedArray, Uint16Array, Uint32Array, ArrayBuffer, DataView,
    Array, Set, Map, WeakMap, WeakSet, Date, JSON, parseFloat, parseInt, String, Object, Error,
    Boolean, Function, Symbol, Promise, RegExp, TypeError, RangeError, performance: { now: () => Date.now() },
  };
  sandbox.globalThis = sandbox;
  vm.createContext(sandbox);
  vm.runInContext(KIT_SRC, sandbox, { filename: 'render-kit.js' });
  vm.runInContext(src, sandbox, { filename: 'model.js' });
  /* RETURN WHATEVER THE FILE REGISTERED, not a hardcoded id. The first version asked for
     MB3D_MODELS['body-cavity-coelom'] whatever file it had just evaluated, so every corpus
     comparison and the whole axes anchor came back undefined and reported "not in this container"
     about files sitting right there. A probe that cannot tell "absent" from "I asked the wrong
     question" is the degeneracy RENDER-STANDARD says must be reported rather than inferred. */
  const reg = sandbox.window.MB3D_MODELS || {};
  const ids = Object.keys(reg);
  if (!ids.length) throw new Error('that file registered no model');
  return reg[ids[0]];
}
function sub(src, from, to) {
  if (src.indexOf(from) < 0) throw new Error('perturbation lever not found: ' + from);
  return src.replace(from, to);
}
const LEVERS = [
  ['A',         'const HINGE_W = 0.22;', 'const HINGE_W = 0.40;', m => m.solved().flap.a],
  ['A-slack',   'const TG = { x: -0.12, z: -0.47 };', 'const TG = { x: -0.34, z: -0.47 };', m => m.solved().flap.slack],
  ['B',         'const T_PT_L   = [0.54, 1.00];', 'const T_PT_L   = [0.54, 0.84];', m => m.acceptance({ light: true }).measured.B],
  ['N',         'const OVERLAP = 0.11;', 'const OVERLAP = 0.20;', m => m.acceptance({ light: true }).measured.N],
  ['F-neg',     'const slotHalf = t => 0.52', 'const slotHalf = t => 0.28', m => m.acceptance({ light: true }).measured['F-neg']],
  ['F-ect',     'const ECTOPIA_HALF = 0.68;', 'const ECTOPIA_HALF = 0.40;', m => m.acceptance({ light: true }).measured['F-ect']],
  /* H-band's LEVER IS THE ROOT PLACEMENT, NOT THE SCALE, and that is a finding rather than a
     convenience. Perturbing SEG does not move this number at all: the roots are placed at LEV(n) and
     the band is read off the same table, so a change of scale moves both sides together and the
     clearance stays exactly 0. The claim the row makes — "the roots lie at C3, C4 and C5 on whatever
     scale this model uses" — is broken by MOVING THE ROOTS, so that is the lever. The mesh
     re-measurement (meshClaims.Hband) reads the built nerve's own top vertex against the table,
     which the row-side version does not. */
  ['H-band',    "const roots = ['C3', 'C4', 'C5'].map(n => new T.Vector3(sg * 0.26, LEV(n), -0.26));",
                "const roots = ['C3', 'C4', 'C5'].map(n => new T.Vector3(sg * 0.26, LEV(n) + 0.5, -0.26));",
                m => m.acceptance({ light: true }).measured['H-band']],
  ['I',         'const Y_DIA1 = LEV(\'L1\');', 'const Y_DIA1 = LEV(\'L2\');', m => m.acceptance({ light: true }).measured.I],
  ['J',         'const PHR_N = 34,', 'const PHR_N = 14,', m => m.acceptance({ light: true }).measured.J],
  ['J-sac',     'PHR_MARGIN = 0.035,', 'PHR_MARGIN = 0.260,', m => m.acceptance({ light: true }).measured['J-sac']],
  /* C4's lever has to be one that leaves a canal OPEN at t = 1. Scaling RHO_CANAL does not: it moves
     canalOpen's threshold, so the canal reads partly open — but e(w) is still negative there, the
     casts are still held apart, and the count is still 4. Correct behaviour, wrong lever. Stretching
     the left closure past t = 1 is the lever that makes the left canal genuinely never shut. */
  ['C4',        'const T_PT_L   = [0.54, 1.00];', 'const T_PT_L   = [0.54, 1.60];', m => m.acceptance().measured.C4],
  /* G's lever likewise. RHO_M only decides where the muscular rim's inner edge sits in the leaf
     sectors, and the rim is STACKED on the leaf there rather than filling a gap in it, so moving it
     opens no hole and coverage does not budge. Taking the membrane's thickness to zero does: the
     leaf then builds no geometry at all and the leaf sectors are bare. */
  ['G',         'const TH_MEMB = 0.055;', 'const TH_MEMB = 0.0;', m => m.acceptance().measured.G],
  ['K',         'const HIATUS_HALF = 0.30;', 'const HIATUS_HALF = 0.17;', m => m.acceptance().measured.K],
  ['K-wide',    'const HIATUS_HALF = 0.30;', 'const HIATUS_HALF = 0.46;', m => m.acceptance().measured['K-wide']],
  ['L',         'const OFF_SOM = 0.040, OFF_SPL = 0.040,', 'const OFF_SOM = 0.040, OFF_SPL = 0.240,', m => m.acceptance().measured.L],
  ['M-pin',     'new T.Vector3(0, yw - 0.36, 0.36),', 'new T.Vector3(0, yw - 0.36, 0.86),',
                m => { const r = m.acceptance().measured['M-pin']; return r.length ? r[r.length - 1][1] : null; }],
  ['D_x',       'const BOCH_SHORT = 0.11;', 'const BOCH_SHORT = 0.28;', m => m.acceptance().measured.G_neg_unused === undefined ? m.acceptance().measured['G-neg'] : null],
];
function perturbAll(base) {
  const rows = [];
  for (const [id, from, to, read] of LEVERS) {
    let got = null, err = null;
    try { got = read(evalModel(sub(MODEL_SRC, from, to))); }
    catch (e) { err = String(e && e.message || e); }
    const was = base[id];
    const moved = (err == null) && was != null && got != null &&
      (typeof was === 'number' ? Math.abs(got - was) > Math.max(1e-9, Math.abs(was) * 1e-6) : got !== was);
    rows.push({ id, lever: from.trim().slice(0, 48), was, got, moved, err });
  }
  return { rows, allMoved: rows.every(r => r.moved), n: rows.length };
}

/* ---------------------------------------------- 9. THE AXES, AGAINST A MESH-ANCHORED MODEL

   RENDER-STANDARD: "A DECLARED AXIS IS NOT A PROVED ONE, AND A SYMMETRIC MODEL CANNOT PROVE ITS OWN",
   route (b): have the declared `axes` string checked, by a corpus-level test, against a model that IS
   mesh-anchored. lateral-folding is that model — its convention is measured off six BodyParts3D
   right/left pairs by tools/prove-corpus-axes.mjs — so the check is that this model's AXES object and
   its ACCEPTANCE.axes prose agree with lateral-folding's, in both forms, and that neither has been
   quietly reworded. Route (a) is NOT available here: this model has real chiral content (the right
   canal closes first) but that content is BUILT FROM the declaration, so asserting it would be
   circular in exactly the way acceptance row I on lateral-folding was. */
function axesCheck() {
  const mine = evalModel(MODEL_SRC);
  let lfErr = null;
  const lf = (() => {
    try {
      const src = readFileSync('models3d/lateral-folding.js', 'utf8');
      return evalModel(src);
    } catch (e) { lfErr = String(e && e.message || e); return null; }
  })();
  const out = { mine: mine.AXES, mineProse: mine.ACCEPTANCE.axes, anchored: null, anchoredProse: null, anchorError: lfErr };
  if (!lf) { out.verdict = 'NO ANCHOR: could not evaluate models3d/lateral-folding.js — ' + lfErr; return out; }
  out.anchored = lf.AXES; out.anchoredProse = lf.ACCEPTANCE.axes;
  const keys = ['right', 'left', 'cranial', 'caudal', 'ventral', 'dorsal'];
  const bad = keys.filter(k => mine.AXES[k] !== lf.AXES[k]);
  const norm = s => String(s).replace(/\s+/g, ' ').trim();
  const proseOk = norm(mine.ACCEPTANCE.axes) === norm(lf.ACCEPTANCE.axes);
  out.disagree = bad; out.proseAgrees = proseOk;
  out.verdict = (bad.length === 0 && proseOk) ? 'AGREES with the mesh-anchored model, in both forms'
    : 'DISAGREES: ' + (bad.join(', ') || '') + (proseOk ? '' : ' (and the prose strings differ)');
  return out;
}
/* AND WHAT prove-corpus-axes SAYS WHEN IT HAS NOTHING TO MEASURE, which is a finding about the tool
   and is reported as one rather than as a result about this model.

   With the STL corpus absent — viz-training/meshes-lite is not in this container and the queue has no
   item to put it there — all six of its right/left pairs return ok:false, so `agree` is 0. The tool
   reads `agree === 0` as "all six pairs say +x = RIGHT", prints "convention: +x = RIGHT, -x = LEFT" as
   a MEASURED convention, and then FAILS every model in models3d/ that declares -x = RIGHT. That is all
   three of them, including lateral-folding, which is the very model it is supposed to anchor. A run
   that trusted that output would flip the sign in three models and mirror every scene in the corpus.

   The one-line fix is to require allPairsOk BEFORE deriving measuredRight, so that no measurement
   yields null (INCONSISTENT) rather than the opposite of the truth. Not made here: it is another
   item's tool, not this model. Reported in BUILD-LOG and in the scene's gaps[]. */
function proveCorpusAxes() {
  let out, failed = false;
  try { out = execFileSync('node', ['viz-training/tools/prove-corpus-axes.mjs'], { encoding: 'utf8', timeout: 180000 }); }
  catch (e) { out = String((e && (e.stdout || e.message)) || e); failed = true; }
  const txt = String(out || '');
  const missing = (txt.match(/mesh file missing/g) || []).length;
  const conv = (/convention:\s*(.+)/.exec(txt) || [, '?'])[1].trim();
  return {
    ran: true, pass: !failed && /PASS/.test(txt),
    meshesMissing: missing, printedConvention: conv,
    degenerate: missing > 0,
    note: missing > 0
      ? 'CANNOT MEASURE: ' + missing + ' of its right/left pairs have no mesh file in this container, so it ' +
        'measured nothing — and still printed "' + conv + '" and failed all three models that declare -x = RIGHT. ' +
        'Its verdict is unusable here and is NOT evidence either way about the axes. See the note above this function.'
      : 'measured against the scan data',
    tail: txt.trim().split('\n').slice(-8).join(' | '),
  };
}

/* ======================================================================== RUN */

/* WHICH CHROMIUM DREW THESE FRAMES, resolved rather than assumed, and recorded in the report.
   The container this ran in has a preinstalled chromium under PLAYWRIGHT_BROWSERS_PATH whose build
   number does not match the playwright in node_modules, so the default executablePath points at a
   directory that does not exist and launch() fails with "please run npx playwright install" — which
   is misleading, because the browser is right there. A proof that cannot say WHICH binary rendered it
   is worth less than one that can, so the path is reported either way. */
function findChromium() {
  if (process.env.MEDBANK_CHROMIUM) return process.env.MEDBANK_CHROMIUM;
  try { const d = chromium.executablePath(); if (fs.existsSync(d)) return d; } catch (e) { /* fall through */ }
  const root = process.env.PLAYWRIGHT_BROWSERS_PATH || '/opt/pw-browsers';
  try {
    for (const dir of fs.readdirSync(root)) {
      if (!/^chromium(_headless_shell)?-/.test(dir)) continue;
      for (const sub of ['chrome-linux/chrome', 'chrome-linux64/chrome', 'chrome-linux/headless_shell',
                         'chrome-headless-shell-linux64/chrome-headless-shell']) {
        const c = path.join(root, dir, sub);
        if (fs.existsSync(c)) return c;
      }
    }
  } catch (e) { /* no such root */ }
  return null;
}
const CHROME = findChromium();
console.log('chromium         : ' + (CHROME || 'playwright default'));
const b = await chromium.launch({ args: ['--no-sandbox', '--enable-unsafe-swiftshader'],
                                  executablePath: CHROME || undefined });
const p = await b.newPage({ viewport: { width: W, height: H } });
const log = [];
p.on('console', m => log.push({ type: m.type(), text: m.text() }));
p.on('pageerror', e => log.push({ type: 'pageerror', text: String(e && e.message || e) }));
await p.goto(BASE + `${OUT}/_harness.html`);
await p.waitForFunction('typeof window.setStage === "function"');

const report = { when: new Date().toISOString(), chromium: CHROME, stages: [], console: [] };
report.solved = await p.evaluate('window.solved()');

for (const [name, t, opts, note] of STAGES) {
  for (const [vn, yaw, pitch, fitKeys] of VIEWS) {
    const r = await p.evaluate(([a, bb, c, d, e]) => window.setStage(a, bb, c, d, e),
                               [t, opts, yaw, pitch, fitKeys]);
    const file = `${OUT}/${name}-${vn}.png`;
    await p.screenshot({ path: file });
    report.stages.push({ name, view: vn, t, opts, note, size: r.size, file,
                         fitKeys: fitKeys ? fitKeys.length : 0, fitN: r.fitN,
                         fitFellBack: r.fitFellBack, fitUsed: r.fitUsed, litFrac: r.litFrac,
                         spanW: r.spanW, spanH: r.spanH, borderPx: r.borderPx });
  }
}
report.acceptance = await p.evaluate('window.acceptance()');
report.normals = await p.evaluate('window.normalProbe(1, {})');
report.normals0 = await p.evaluate('window.normalProbe(0, {})');
report.meshClaims = await p.evaluate('window.meshClaims()');
report.terminals = await p.evaluate('window.terminalProbe()');
report.windingStats = await p.evaluate('window.MB3D_MODELS["body-cavity-coelom"].windingStats()');

/* the lumen probe, from each attitude, at the two ends of t and on the two lesion builds */
report.lumen = [];
for (const [name, t, opts] of [['t000', 0, {}], ['t100', 1, {}], ['t100-boch', 1, { bochdalek: true }], ['t100-ect', 1, { ectopia: true }]]) {
  for (const [vn, yaw, pitch] of VIEWS) {
    await p.evaluate(([a, bb, c, d]) => window.setStage(a, bb, c, d), [t, opts, yaw, pitch]);
    const r = await p.evaluate('window.lumenProbe(64)');
    report.lumen.push({ name, view: vn, ...r });
  }
}
report.console = log;

const p2 = await b.newPage();
const log2 = [];
p2.on('console', m => log2.push({ type: m.type(), text: m.text() }));
p2.on('pageerror', e => log2.push({ type: 'pageerror', text: String(e && e.message || e) }));
await p2.goto(BASE + `${OUT}/_adapter.html`);
await p2.waitForFunction('typeof window.resolveAll === "function"');
report.refs = REFS.length ? await p2.evaluate(r => window.resolveAll(r), REFS) : [];
report.stages_t = REFS.length ? await p2.evaluate(r => window.stageAll(r), REFS) : [];
report.adapterConsole = log2;
await b.close(); server.close();

const FL = report.acceptance.measured ? (await (async () => evalModel(MODEL_SRC).FLOORS)()) : {};
report.negatives = negativeCases(FL);
const base = {};
for (const [id] of LEVERS) base[id] = undefined;
const M0 = evalModel(MODEL_SRC);
const acc0light = M0.acceptance({ light: true }).measured, acc0 = M0.acceptance().measured;
base['A'] = M0.solved().flap.a; base['A-slack'] = M0.solved().flap.slack;
for (const k of ['B', 'N', 'F-neg', 'F-ect', 'H-band', 'I', 'J', 'J-sac']) base[k] = acc0light[k];
base['C4'] = acc0.C4; base['G'] = acc0.G; base['K'] = acc0.K; base['K-wide'] = acc0['K-wide'];
base['L'] = acc0.L; base['D_x'] = acc0['G-neg'];
base['M-pin'] = acc0['M-pin'].length ? acc0['M-pin'][acc0['M-pin'].length - 1][1] : null;
report.perturbation = perturbAll(base);
report.axes = axesCheck();
report.proveCorpusAxes = proveCorpusAxes();

/* ---- verdict ---- */
const NOISE = /GPU stall due to ReadPixels|GL Driver Message|Automatic fallback to software WebGL|SwiftShader|Fallback to SwiftShader/i;
const noise = report.console.filter(m => NOISE.test(m.text));
const bad = report.console.filter(m => (m.type === 'error' || m.type === 'warning' || m.type === 'pageerror') && !NOISE.test(m.text));
const badA = (report.adapterConsole || []).filter(m => (m.type === 'error' || m.type === 'warning' || m.type === 'pageerror') && !NOISE.test(m.text));
report.harness_noise = noise;

console.log('frames rendered  :', report.stages.length);
console.log('console (model)  :', bad.length ? 'DIRTY' : 'clean', bad.map(x => x.type + ': ' + x.text).join(' | '),
  '  [' + noise.length + ' swiftshader harness messages ignored]');
console.log('console (adapter):', badA.length ? 'DIRTY' : 'clean', badA.map(x => x.type + ': ' + x.text).join(' | '));
const S = report.solved;
console.log('SOLVED flap      : lam*=' + S.flap.lam.toFixed(6) + '  a*=' + S.flap.a.toFixed(5) +
  '  L*=' + S.flap.L.toFixed(6) + '  slack=' + S.flap.slack.toFixed(5) +
  '  |F|=' + S.flap.resid.toExponential(2) + '  iters=' + S.flap.iters +
  '  seeds ' + S.flap.seedsConverged + '/' + S.flap.seedsTried);
console.log('SOLVED phrenic   : len(0)=' + S.phrenic0.length.toFixed(4) + '  len(1)=' + S.phrenic1.length.toFixed(4) +
  '  resid=' + Math.max(S.phrenic0.resid, S.phrenic1.resid).toExponential(2) + '  descent=' + S.descent.toFixed(4));
console.log('rho_canal        : ' + S.rhoCanal.toFixed(5) + '   levels ' + JSON.stringify(S.levels));
console.log('acceptance       :', JSON.stringify(report.acceptance.pass), 'allPass=' + report.acceptance.allPass);
for (const k of Object.keys(report.acceptance.measured)) {
  const v = report.acceptance.measured[k];
  if (typeof v === 'number') console.log('   ' + k.padEnd(20) + (Math.abs(v) < 1e-4 && v !== 0 ? v.toExponential(2) : v.toFixed(5)));
}

const byKey = {};
for (const r of report.normals.concat(report.normals0)) (byKey[r.key] = byKey[r.key] || []).push(r);
let normalsOk = true; const flipped = [], swapped = [];
for (const k of Object.keys(byKey)) {
  const rows = byKey[k];
  const ow = rows.map(r => r.outward), wi = rows.map(r => r.winding).filter(x => x != null);
  const oh = rows.map(r => r.outwardHull).filter(x => x != null);
  if (rows.some(r => r.gridFlipped)) flipped.push(k);
  if (rows.some(r => r.gridSwapped)) swapped.push(k);
  const minW = Math.min(...wi);
  if (minW < 0.999) normalsOk = false;
  console.log('  normals ' + k.padEnd(20) +
    'outer-surface ' + (oh.length ? Math.min(...oh).toFixed(3) + '-' + Math.max(...oh).toFixed(3) : '   n/a   ') +
    '  whole-buffer ' + Math.min(...ow).toFixed(3) + '-' + Math.max(...ow).toFixed(3) +
    '  winding ' + minW.toFixed(3) + '-' + Math.max(...wi).toFixed(3) + '  (' + rows.length + ' meshes)');
}
if (flipped.length) console.log('  *** GRID HANDED IN INSIDE-OUT AND NOT CORRECTED: ' + flipped.join(', '));
console.log('  winding corrected locally: ' + report.windingStats.fixed + ' of ' + report.windingStats.seen +
  ' triangles (' + (100 * report.windingStats.fixed / Math.max(1, report.windingStats.seen)).toFixed(1) +
  '%) — see fixWinding() in the model, and the corpus comparison below');
/* THE CORPUS COMPARISON, run here so the kit finding carries numbers rather than an assertion.
   sweptShell's ring quads are emitted through a FIXED vertex order against normals nrm() may have
   negated, so every swept tube in the corpus can disagree with its own normals. This model corrects
   itself locally; the two models that cannot are measured for the record. */
report.corpusWinding = {};
for (const f of ['models3d/cardiac-looping.js', 'models3d/lateral-folding.js']) {
  try {
    const m = evalModel(readFileSync(f, 'utf8'));
    const g = m.build(1, Object.assign({}, m.FULL || {}));
    const w = {};
    g.traverse(o => {
      if (!o.isMesh || !o.geometry || (o.userData && o.userData.outline)) return;
      const k = o.userData && o.userData.key; if (!k) return;
      const pp = o.geometry.attributes.position, nn = o.geometry.attributes.normal;
      if (!pp || !nn) return;
      let agree = 0, tris = 0;
      const A3 = new THREE_NODE.Vector3(), B3 = new THREE_NODE.Vector3(), C3 = new THREE_NODE.Vector3();
      const FN = new THREE_NODE.Vector3(), VN = new THREE_NODE.Vector3(), Q = new THREE_NODE.Vector3();
      for (let i = 0; i + 2 < pp.count; i += 3) {
        A3.fromBufferAttribute(pp, i); B3.fromBufferAttribute(pp, i + 1); C3.fromBufferAttribute(pp, i + 2);
        FN.copy(B3).sub(A3).cross(Q.copy(C3).sub(A3));
        if (FN.lengthSq() < 1e-16) continue;
        FN.normalize(); VN.set(0, 0, 0);
        for (let z = 0; z < 3; z++) VN.add(Q.fromBufferAttribute(nn, i + z));
        if (VN.lengthSq() < 1e-16) continue;
        VN.normalize(); tris++; if (FN.dot(VN) > 0) agree++;
      }
      if (tris) { w[k] = Math.min(w[k] == null ? 1 : w[k], agree / tris); }
    });
    const below = Object.entries(w).filter(([, v]) => v < 0.999).sort((x, y) => x[1] - y[1]);
    report.corpusWinding[f] = { keys: Object.keys(w).length, below: below.map(([k, v]) => [k, +v.toFixed(4)]) };
  } catch (e) { report.corpusWinding[f] = { error: String(e && e.message || e).slice(0, 160) }; }
}
for (const [f, r] of Object.entries(report.corpusWinding)) {
  console.log('  corpus winding ' + f.replace('models3d/', '').padEnd(22) +
    (r.error ? 'could not evaluate: ' + r.error
             : r.below.length + ' of ' + r.keys + ' keys below 0.999' +
               (r.below.length ? ' — ' + r.below.slice(0, 6).map(([k, v]) => k + '=' + v).join(' ') : '')));
}
console.log('  grids swapped by the declared outward direction (expected, recorded): ' + (swapped.join(', ') || 'none'));

const MC = report.meshClaims, F = MC.floors;
console.log('the same claims, on REAL MESH VERTICES:');
const row = (id, val, cmp, lim, extra) => {
  const ok = val != null && (cmp === '>=' ? val >= lim : (cmp === '<=' ? val <= lim : val === lim));
  console.log('  ' + id.padEnd(5) + ' mesh ' + (val == null ? ' n/a ' : String(typeof val === 'number' ? val.toFixed(4) : val)) +
    '  proxy ' + (report.acceptance.measured[id] != null ? String(report.acceptance.measured[id]) : ' n/a ') +
    '  ' + cmp + ' ' + lim + '  ' + (ok ? 'pass' : 'FAIL') + (extra || ''));
  return ok;
};
let meshPass = true;
meshPass = (MC.Hband != null && Math.abs(MC.Hband) <= 0.050) && meshPass;
console.log('  Hband mesh ' + (MC.Hband == null ? ' n/a ' : MC.Hband.toFixed(4)) +
  '  (the built nerve\'s top vertex, ' + (MC.Hband_top || 0).toFixed(4) + ', against C3 at ' +
  (MC.Hband_c3 || 0).toFixed(4) + ')  <= 0.050  ' + (MC.Hband != null && Math.abs(MC.Hband) <= 0.050 ? 'pass' : 'FAIL'));
meshPass = row('N', MC.N, '>=', F.WAIST, '   (pleural/peritoneal overlap ' + MC.N_overlapY.toFixed(3) + ' over cast width ' + MC.N_diam.toFixed(3) + ', at t=0.42)') && meshPass;
meshPass = row('F', MC.F, '===', 0, '   (rays escaping the BUILT wall at t=1, over ' + MC.F_segs + ' wall segments)') && meshPass;
meshPass = row('F-neg', MC.F_neg, '>=', F.OPEN, '   (and at t=0, over ' + MC.F_negSegs + ' segments)') && meshPass;
meshPass = row('C1', MC.C1, '===', 1, '   (components at t=0, voxel h=' + MC.C_h + ' — a THIRD resolution)') && meshPass;
meshPass = row('C4', MC.C4, '===', 4, '   (components at t=1, same resolution)') && meshPass;

console.log('negative cases   : ' + report.negatives.rows.filter(r => r.rejected).length + '/' + report.negatives.n + ' rejected');
for (const r of report.negatives.rows) if (!r.rejected) console.log('   *** ACCEPTED A WRONG VALUE: ' + r.id + ' fed ' + r.fed);
console.log('perturbation     : ' + report.perturbation.rows.filter(r => r.moved).length + '/' + report.perturbation.n + ' moved');
for (const r of report.perturbation.rows) {
  console.log('   ' + (r.moved ? 'moved  ' : '*** STUCK ') + r.id.padEnd(9) +
    String(r.was).slice(0, 12).padEnd(13) + ' -> ' + String(r.got).slice(0, 12) + (r.err ? '   ERR ' + r.err : '') +
    '    [' + r.lever + ']');
}
console.log('axes             : ' + report.axes.verdict);
console.log('prove-corpus-axes: ' + (report.proveCorpusAxes.degenerate ? 'DEGENERATE' : (report.proveCorpusAxes.pass ? 'PASS' : 'FAILED')));
console.log('                   ' + report.proveCorpusAxes.note);

let lumenPass = true;
for (const l of report.lumen) {
  if (l.frac > 0.001) { lumenPass = false; console.log('  *** OPEN LUMEN ' + l.name + '/' + l.view + ': ' + l.away + ' of ' + l.cast + ' first hits face away ' + JSON.stringify(l.bad)); }
}
console.log('open lumen       : ' + (lumenPass ? 'none, over ' + report.lumen.length + ' camera/stage combinations' : 'FOUND'));

let refsPass = report.refs.length > 0 && report.refs.every(r => r.hasMesh && r.tris > 0 && !r.error);
for (const r of report.refs) if (!r.hasMesh || r.error) console.log('  *** REF DOES NOT RESOLVE: ' + r.key + ' ' + r.ref + ' reason=' + r.reason + (r.error ? ' err=' + r.error : ''));
console.log('adapter refs     : ' + report.refs.filter(r => r.hasMesh).length + '/' + report.refs.length + ' resolve with geometry through viz3d.js');
let stagePass = true;
for (const s of report.stages_t) {
  if (!s.stageable) { console.log('  pinned  ' + s.key.padEnd(20) + s.ref); continue; }
  const want = !s.declaredStatic;
  if (s.moved !== want) { stagePass = false;
    console.log('  *** ' + (want ? 'DID NOT MOVE with t and is not declared static: ' : 'MOVED with t but IS declared static: ') + s.key + ' (' + s.part + ')'); }
  if (s.declaredFirstT != null && s.absentBefore !== true) { stagePass = false;
    console.log('  *** DECLARED ABSENT before t=' + s.declaredFirstT + ' but the adapter returned a mesh there: ' + s.key); }
  if (s.declaredFirstT == null && s.absentBefore === true) { stagePass = false;
    console.log('  *** ABSENT at low t but NOT declared in STAGE_LIMITED: ' + s.key); }
}
console.log('staging          : ' + (stagePass ? 'every unpinned ref follows the view, and every declared absence is real' : 'FAILED'));

/* 10 — TERMINAL ENDS, and the heuristic that did not work. The first version counted triangles whose
   three vertex normals are identical and called a key suspect above a third of them. On a SHEET that
   is 93% of the triangles by construction — both faces are planar — so it reported the
   pleuropericardial collar and said nothing about any tube. The rule is about a TUBE ending in
   mid-air, so the check is now two things that do bear on it: every tube in the source goes through
   K.tubeCapped (which calls K.domeCap) and none through bare K.tubeAlong, asserted by reading the
   file; and the behavioural test is check 6, the lumen probe, because RENDER-STANDARD's own
   description of the defect is that "the annulus reads as an OPEN PIPE — a wall ring with a lit inner
   surface", which is precisely a first hit that faces away. */
const srcForTerm = readFileSync('models3d/body-cavity-coelom.js', 'utf8');
const tubeCapped = (srcForTerm.match(/K\.tubeCapped\(/g) || []).length;
const tubeAlong = (srcForTerm.match(/K\.tubeAlong\(/g) || []).length;
const termBad = tubeAlong > 0 || tubeCapped < 1;
report.terminalSource = { tubeCapped, tubeAlong };
console.log('terminal ends    : ' + (termBad ? '*** ' + tubeAlong + ' bare K.tubeAlong call(s) — a tube ending in mid-air needs K.domeCap'
  : tubeCapped + ' tube builder(s), all through K.tubeCapped/domeCap, 0 bare K.tubeAlong; the behavioural test is the lumen probe above'));

report.verdict = {
  frames: report.stages.length,
  consoleClean: bad.length === 0 && badA.length === 0,
  acceptance: report.acceptance.allPass,
  normalsOk, gridFlipped: flipped, meshPass,
  negPass: report.negatives.allRejected, perturbPass: report.perturbation.allMoved,
  axesAgree: !!(report.axes.disagree && report.axes.disagree.length === 0 && report.axes.proseAgrees),
  lumenPass, refsPass, stagePass, terminalsOk: !termBad,
};
writeFileSync(`${OUT}/report.json`, JSON.stringify(report, null, 1));
const allOk = Object.values(report.verdict).every(v => v === true || typeof v === 'number' || (Array.isArray(v) && v.length === 0));
console.log('\nVERDICT: ' + JSON.stringify(report.verdict));
console.log(allOk ? 'ALL CHECKS PASS' : 'SOMETHING FAILED — see above');
process.exit(allOk ? 0 : 1);
