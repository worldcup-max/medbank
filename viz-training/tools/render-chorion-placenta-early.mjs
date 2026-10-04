/* MedBank · headless proof for models3d/chorion-placenta-early.js
 *
 * Built on the shape of tools/render-cardiac-looping.mjs (the reference harness) and its descendant
 * tools/render-bilaminar-embryonic-disc.mjs. Everything here must pass before the item is marked built:
 *   1. it renders — fourteen frames across nine days, written to viz-training/models-out/chorion-placenta-early/
 *   2. the console is clean — no error, no warning, no throw
 *   3. normals point outward — per mesh, counted against that mesh's own centroid
 *   4. the acceptance battery passes AND every negative case rejects
 *   5. every ref in the scene resolves THROUGH THE REAL ADAPTER in viz3d.js, with geometry, at the
 *      t of every beat that shows it — not only at the default t
 *
 * Plus the three probes this model needs that the five above cannot see:
 *   6. NO OPEN LUMEN / BACKFACE FIRST. A grid of rays from each of six cameras; for each, whether the
 *      FIRST surface met faces AWAY from the camera. revolve() decides which way is out from its
 *      profile's shoelace sign and then checks every quad's winding against the mean of its own four
 *      supplied normals, and this is the measurement that says whether that actually worked —
 *      RENDER-STANDARD 2.4b's ray-cast, the probe that caught the winding bug in the first place.
 *   7. WATERTIGHT. Every triangle edge, welded at 0.2 um, must be shared by exactly two triangles.
 *      This is what caught two emitter faults on the sibling item that no other check could see.
 *   8. THE SCENE'S OPS AGREE WITH WHAT THE MODEL BUILDS. For every beat, every key the beat leaves
 *      showing must build geometry at that beat's own t. A beat that shows a structure the model does
 *      not build at that t is a beat that tells a student the structure does not exist.
 *
 * WHERE THIS RUNS. In a Linux container with chromium, against a copy of the repo — not on the mounted
 * repo itself, which has no browser and no playwright. The files under test are byte identical; the
 * substrate for the RENDER is not the mount, and saying so is the point (RENDER-STANDARD: "TEST ON THE
 * SUBSTRATE, NOT ON SOMETHING THAT RESEMBLES IT" — what is being tested here is the geometry and the
 * adapter, both of which are pure javascript and identical on either side; what is NOT being tested
 * here is the mount, and nothing in this file claims otherwise).
 *
 * Run from the repo root:  node viz-training/tools/render-chorion-placenta-early.mjs
 */
import { chromium } from 'playwright';
import { readFileSync, writeFileSync, mkdirSync } from 'fs';
import http from 'http';
import path from 'path';
import fs from 'fs';

const ROOT = process.cwd();
const SHORT = 'chorion-placenta-early';
const OUT = `viz-training/models-out/${SHORT}`;
mkdirSync(OUT, { recursive: true });

const MIME = { '.js': 'text/javascript', '.json': 'application/json', '.html': 'text/html' };
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

const SCENE_PATH = `viz-training/scenes/embryology__weeks-1-2-implantation-bilaminar-disc__${SHORT}.json`;
const scene = JSON.parse(readFileSync(SCENE_PATH, 'utf8'));
const REFS = scene.structures.map(s => ({ key: s.key, ref: s.refs && s.refs.procedural })).filter(r => r.ref);

/* which keys each beat leaves showing, and at what t — read from the scene, so probe 8 cannot drift
   away from the ops the player will actually run */
const BEATS = scene.views.map(v => {
  const t = (v.ops || []).find(o => o.op === 'SET_STAGE');
  const vis = {};
  for (const s of scene.structures) vis[s.key] = true;
  for (const o of (v.ops || [])) {
    const keys = o.target === '*' ? Object.keys(vis) : (o.target ? [o.target] : []);
    if (o.op === 'SHOW_STRUCTURE') keys.forEach(k => { if (k in vis) vis[k] = true; });
    if (o.op === 'HIDE_STRUCTURE') keys.forEach(k => { if (k in vis) vis[k] = false; });
  }
  return { beat: v.beat, title: v.title, t: t ? t.t : 1, shown: Object.keys(vis).filter(k => vis[k]) };
});

const W = 1000, H = 1000;
const SAC = { sections: false };          // the sac alone: the specimen strip is 90 mm away
const STRIP = { cavity: false, laminae: false, lake: false, villi: false, shell: false, laeve: false, decidua: false, vessels: false };
const tOf = d => (d - 9) / 61;
const STAGES = [
  ['d09-lacunae-open',   tOf(9),  SAC, 'lateral',  'day 9 — the first lacunae open in the syncytium'],
  ['d11-lacunae',        tOf(11), SAC, 'lateral',  'day 11 — separate lacunae, filled with maternal blood, no villus yet'],
  ['d13-three-layers',   tOf(13), SAC, 'lateral',  'day 13 — the chorion has its three layers; primary villi push out'],
  ['d16-secondary',      tOf(16), SAC, 'lateral',  'day 16 — mesoderm in the villous core'],
  ['d21-tertiary',       tOf(21), SAC, 'lateral',  'day 21 — three generations of branching, the lake continuous'],
  ['d25-bed',            tOf(25), SAC, 'lateral',  'day 25 — the placental bed'],
  ['d28-circulations',   tOf(28), SAC, 'lateral',  'day 28 — spiral arteries in, endometrial veins out'],
  ['d35-arteries',       tOf(35), SAC, 'lateral',  'day 35 — remodelled against unremodelled'],
  ['d56-villous',        tOf(56), SAC, 'lateral',  'day 56 — still villous nearly all over'],
  ['d70-discoid',        tOf(70), SAC, 'lateral',  'day 70 — frondosum against laeve: the placenta is a disc'],
  ['d70-anterior',       tOf(70), SAC, 'anterior', 'day 70, from the front'],
  ['d70-superior',       tOf(70), SAC, 'superior', 'day 70, from the abembryonic pole'],
  ['sections-strip',     tOf(21), STRIP, 'lateral', 'the four villus sections, x40, at one magnification'],
  ['whole-model',        tOf(21), {},   'lateral',  'everything the model builds at day 21'],
];

const html = `<!doctype html><meta charset=utf8>
<link rel="icon" href="data:,">
<body style="margin:0;background:#0e1626">
<canvas id=c width=${W} height=${H}></canvas>
<script src="${BASE}node_modules/three/build/three.js"><\/script>
<script src="${BASE}models3d/render-kit.js"><\/script>
<script src="${BASE}models3d/${SHORT}.js"><\/script>
<script>
window.MEDBANK_CONFIG = { MODEL_BASE: '${BASE}models3d/' };
const renderer = new THREE.WebGLRenderer({ canvas: document.getElementById('c'), antialias: true });
renderer.setSize(${W}, ${H}, false); renderer.setPixelRatio(1);
VizKit.configureRenderer(renderer);
const scene = new THREE.Scene();
scene.background = VizKit.bg(0x0e1626);
VizKit.standardLights(scene);
const camera = new THREE.PerspectiveCamera(32, ${W}/${H}, 0.1, 4000);
let group = null;
const MOD = window.MB3D_MODELS['${SHORT}'];

/* VIEW_DIR IS COPIED FROM viz3d.js, NOT RESTATED. RENDER-STANDARD 3.y: "the model's VIEW_DIR table is
   COPIED from viz3d rather than restated, so the player's cameras and the probe's cannot drift apart."
   viz3d.js:2095. */
const VIEW_DIR = {
  anterior: [0, 0, 1], posterior: [0, 0, -1], lateral: [1, 0, 0], medial: [-1, 0, 0],
  superior: [0, 1, 0.001], inferior: [0, -1, 0.001]
};

window.setStage = function (t, opts, view) {
  if (group) { scene.remove(group); group.traverse(function (o) { if (o.geometry) o.geometry.dispose(); }); }
  const o = Object.assign({}, MOD.FULL);
  Object.keys(opts || {}).forEach(function (k) { o[k] = opts[k]; });
  group = MOD.build(t, o);
  scene.add(group);
  const dir = new THREE.Vector3().fromArray(VIEW_DIR[view || 'lateral']).normalize();
  /* FRAMED THE WAY THE PLAYER FRAMES, NOT THE WAY VizKit.fitCamera DOES, and this is a finding rather
     than a preference. fitCamera computes its distance as
         max( (size.y/2)/tan(vFov/2), (size.x/2)/tan(hFov/2) ) * margin + size.z/2
     — size.x for the screen's horizontal, size.z for depth — which is only correct for a camera on
     the +/-z axis. From the lateral camera at +x the screen's horizontal axis is z and the depth
     axis is x, so an anisotropic subject is cropped: this model's specimen strip is 33 mm along z and
     1.6 mm along x, and fitCamera framed TWO of its four sections. viz3d.js does not have the
     problem — its own distanceForBox (viz3d.js:2155) projects the box onto the camera's actual screen
     axes — and the three lines below are copied from it, which is also what RENDER-STANDARD 3.y asks
     for ("the model's VIEW_DIR table is COPIED from viz3d rather than restated, so the player's
     cameras and the probe's cannot drift apart"). fitCamera is still what the MODEL's own framing
     uses; what is wrong is using it for an off-axis camera. Logged in BUILD-LOG.md. */
  group.updateMatrixWorld(true);
  const box = new THREE.Box3().setFromObject(group);
  const centre = box.getCenter(new THREE.Vector3()), size = box.getSize(new THREE.Vector3());
  const vHalf = camera.fov * Math.PI / 360;
  const hHalf = Math.atan(Math.tan(vHalf) * (camera.aspect || 1));
  let up = Math.abs(dir.y) > 0.99 ? new THREE.Vector3(0, 0, -1) : new THREE.Vector3(0, 1, 0);
  const right = new THREE.Vector3().crossVectors(up, dir).normalize();
  up = new THREE.Vector3().crossVectors(dir, right).normalize();
  const hx = size.x / 2, hy = size.y / 2, hz = size.z / 2;
  const ext = a => Math.abs(a.x) * hx + Math.abs(a.y) * hy + Math.abs(a.z) * hz;
  const dist = Math.max(ext(up) / Math.tan(vHalf), ext(right) / Math.tan(hHalf)) * 1.06 + ext(dir);
  camera.near = Math.max(0.05, dist - size.length());
  camera.far = dist + size.length() * 3;
  camera.updateProjectionMatrix();
  camera.position.copy(centre).addScaledVector(dir, dist);
  camera.up.copy(up);
  camera.lookAt(centre);
  renderer.render(scene, camera);
  const fit = { centre, distance: dist, size };
  let tris = 0, meshes = 0;
  group.traverse(function (m) {
    if (m.isMesh && m.geometry && !(m.userData && m.userData.outline)) { meshes++; tris += m.geometry.attributes.position.count / 3; }
  });
  return { triangles: tris, meshes: meshes, distance: fit.distance,
           size: [fit.size.x, fit.size.y, fit.size.z], far: camera.far, near: camera.near };
};

/* ---- probe 3 · OUTWARD NORMALS, per mesh, against that mesh's OWN centroid ----
   A closed solid should be strongly majority-outward. A TUBE read at its own centreline will not be,
   and this model is full of tubes — so the probe reports per key and the harness reads the SHELLS and
   the CLOSED CASTS strictly and says so about the tubes rather than pretending one number fits both. */
window.normalProbe = function () {
  const byKey = {};
  group.traverse(function (m) {
    if (!m.isMesh || !m.geometry || (m.userData && m.userData.outline)) return;
    const pos = m.geometry.attributes.position.array, nml = m.geometry.attributes.normal.array;
    let cx = 0, cy = 0, cz = 0, n = pos.length / 3;
    for (let i = 0; i < pos.length; i += 3) { cx += pos[i]; cy += pos[i + 1]; cz += pos[i + 2]; }
    cx /= n; cy /= n; cz /= n;
    let out = 0;
    for (let i = 0; i < pos.length; i += 3) {
      const dx = pos[i] - cx, dy = pos[i + 1] - cy, dz = pos[i + 2] - cz;
      if (dx * nml[i] + dy * nml[i + 1] + dz * nml[i + 2] > 0) out++;
    }
    const k = m.userData.key || '?';
    if (!byKey[k]) byKey[k] = { out: 0, total: 0, meshes: 0 };
    byKey[k].out += out; byKey[k].total += n; byKey[k].meshes++;
  });
  const o = {};
  Object.keys(byKey).forEach(function (k) { o[k] = { frac: byKey[k].out / byKey[k].total, vertices: byKey[k].total, meshes: byKey[k].meshes }; });
  return o;
};

/* ---- probe 6 · BACKFACE FIRST. Cast a grid of rays from each camera and ask whether the FIRST
   surface met faces away from the viewer. On closed solids the answer is zero. ---- */
window.rayProbe = function (views) {
  const T = THREE;
  const targets = [];
  group.traverse(function (m) { if (m.isMesh && m.geometry && !(m.userData && m.userData.outline)) targets.push(m); });
  const box = new T.Box3().setFromObject(group);
  const c = box.getCenter(new T.Vector3()), s = box.getSize(new T.Vector3());
  const R = s.length();
  const rc = new T.Raycaster();
  rc.firstHitOnly = false;
  const out = {};
  for (const view of views) {
    const dir = new T.Vector3().fromArray(VIEW_DIR[view]).normalize();
    const eye = c.clone().addScaledVector(dir, R * 1.4);
    let up = Math.abs(dir.y) > 0.99 ? new T.Vector3(0, 0, -1) : new T.Vector3(0, 1, 0);
    const right = new T.Vector3().crossVectors(up, dir).normalize();
    up = new T.Vector3().crossVectors(dir, right).normalize();
    /* THE GRID IS SIZED TO THE BOX AS THAT CAMERA SEES IT, by the same screen-extent arithmetic
       viz3d's own framing uses (viz3d.js:2163) — not to the bounding-box DIAGONAL. Sized to the
       diagonal, with the specimen strip 92 mm away from the sac, the grid was four times the width of
       the subject and the lateral camera landed SEVEN rays of 2,304 on anything at all: a probe reporting zero
       backfaces out of seven hits is a probe reporting nothing. */
    const hx = s.x / 2, hy = s.y / 2, hz = s.z / 2;
    const ext = a => Math.abs(a.x) * hx + Math.abs(a.y) * hy + Math.abs(a.z) * hz;
    const eu = ext(right) * 1.02, ev = ext(up) * 1.02;
    let hits = 0, back = 0;
    const N = 48;
    for (let i = 0; i < N; i++) for (let j = 0; j < N; j++) {
      const u = (i / (N - 1) - 0.5) * 2 * eu, v = (j / (N - 1) - 0.5) * 2 * ev;
      const o2 = eye.clone().addScaledVector(right, u).addScaledVector(up, v);
      rc.set(o2, dir.clone().negate());
      const hs = rc.intersectObjects(targets, false);
      if (!hs.length) continue;
      hits++;
      const h = hs[0];
      /* the FACE normal of the triangle actually hit, in world space */
      const fn = h.face ? h.face.normal.clone().applyMatrix3(new T.Matrix3().getNormalMatrix(h.object.matrixWorld)).normalize() : null;
      if (fn && fn.dot(dir) < 0) back++;
    }
    out[view] = { rays: N * N, hits: hits, backfaceFirst: back };
  }
  return out;
};

/* ---- probe 7 · WATERTIGHT. Weld at 0.2 um and require every edge to be shared by exactly two
   triangles, per mesh. An unpaired edge is a hole, and a hole is what a student sees through. ---- */
window.edgeProbe = function () {
  const Q = 0.0002;                                   // 0.2 um, in units of 1 mm
  const res = {};
  group.traverse(function (m) {
    if (!m.isMesh || !m.geometry || (m.userData && m.userData.outline)) return;
    const p = m.geometry.attributes.position.array;
    const id = new Map(); const key = i => {
      const k = Math.round(p[i] / Q) + ',' + Math.round(p[i + 1] / Q) + ',' + Math.round(p[i + 2] / Q);
      if (!id.has(k)) id.set(k, id.size);
      return id.get(k);
    };
    const edges = new Map();
    for (let i = 0; i < p.length; i += 9) {
      const a = key(i), b = key(i + 3), c = key(i + 6);
      for (const [x, y] of [[a, b], [b, c], [c, a]]) {
        if (x === y) continue;
        const e = Math.min(x, y) + ':' + Math.max(x, y);
        edges.set(e, (edges.get(e) || 0) + 1);
      }
    }
    /* WHERE an unpaired edge is decides whether it is a hole. A revolved profile that TOUCHES the
       axis (r = 0) pinches to a single point there, and the zero-area quad spanning the two axis
       stations is skipped — which leaves one edge at each pole carrying one triangle instead of two.
       That is a point, not a hole: nothing can be seen through it. So the probe records each unpaired
       edge's own coordinates and reports whether every one of them lies ON the axis, and the harness
       gates on THAT rather than on the count. An unpaired edge anywhere else is a real hole. */
    const pos = new Map();
    id.forEach(function (v2, k2) { pos.set(v2, k2.split(',').map(Number).map(function (x) { return x * Q; })); });
    let bad = 0, offAxis = 0; const where = [];
    edges.forEach(function (n, e) {
      if (n === 2) return;
      bad++;
      const ab = e.split(':').map(Number);
      let on = true;
      for (const vi of ab) {
        const c2 = pos.get(vi);
        if (!c2 || Math.hypot(c2[0], c2[2]) > 0.001) on = false;      // 1 um of the local y axis
      }
      if (!on) offAxis++;
      if (where.length < 6) where.push({ edge: e, onAxis: on, a: pos.get(ab[0]), b: pos.get(ab[1]) });
    });
    const k = m.userData.key || '?';
    if (!res[k]) res[k] = { unpaired: 0, offAxis: 0, edges: 0, meshes: 0, where: [] };
    res[k].unpaired += bad; res[k].offAxis += offAxis; res[k].edges += edges.size; res[k].meshes++;
    if (res[k].where.length < 6) res[k].where = res[k].where.concat(where).slice(0, 6);
  });
  return res;
};

/* ---- probe 3b · OUTWARD NORMALS, THE WAY THE WORDS ACTUALLY MEAN IT ----
   The centroid probe above is the one RENDER-STANDARD names, and on a SHELL it cannot answer the
   question: a spherical shell's centroid is the sphere's centre, so its INNER surface's normals point
   towards the centroid by construction and the probe reads about 0.50 — which is the correct answer
   for a correct shell. Eleven of this model's nineteen keys are shells or annuli, so gating on that
   figure would either pass everything or fail everything.

   What "outward" means is: step a short way along the normal and you are OUTSIDE the solid. That is
   what this measures, per vertex, by ray parity against that key's OWN built triangles — and it
   checks the other side too, that stepping the other way lands INSIDE. A flipped normal fails both.
   Sampled rather than exhaustive (240 vertices a key) because the parity test is O(triangles); the
   centroid probe above is exhaustive, and the two together say more than either. */
window.outwardProbe = function (eps, sample) {
  const EPS = eps || 0.0005, S = sample || 60;
  /* PER SUB-MESH, NOT PER KEY, and the first version was confounded by its own subject. The villous
     tree is 310 separate tube segments all carrying the key 'floating_villus', and they deliberately
     OVERLAP at every branch point (the daughters start 0.45 r behind the parent's end, so the
     parent's flat terminal facet is buried rather than left showing). A vertex of one segment that
     lies inside its neighbour is inside the UNION, so stepping outward along its own normal kept it
     inside and the probe read 0.796 — a correct measurement of the wrong question. Each closed solid
     is now tested against its OWN triangles, which is the question: is this surface's normal the
     outward one for the solid it bounds. */
  const groups = [];
  group.traverse(function (m) {
    if (!m.isMesh || !m.geometry || (m.userData && m.userData.outline)) return;
    const p = m.geometry.attributes.position.array, nm = m.geometry.attributes.normal.array;
    const tris = [], verts = [];
    for (let i = 0; i < p.length; i += 9) tris.push([p[i],p[i+1],p[i+2],p[i+3],p[i+4],p[i+5],p[i+6],p[i+7],p[i+8]]);
    for (let i = 0; i < p.length; i += 3) verts.push([p[i],p[i+1],p[i+2],nm[i],nm[i+1],nm[i+2]]);
    groups.push({ key: m.userData.key || '?', tris: tris, verts: verts });
  });
  /* MOLLER-TRUMBORE along an arbitrary direction. THREE DIRECTIONS AND A MAJORITY VOTE, because one
     is not enough: a single axis-aligned ray cast from a vertex on a surface of revolution's own axis,
     or from a vertex whose neighbouring triangles the ray happens to graze edge-on, returns a parity
     that is right in principle and wrong in arithmetic. Measured: with one +x ray the four magnified
     sections read 0.976 to 0.987 while every other key read exactly 1, and the failing vertices were
     at the poles where the slab profile touches r = 0. Three skew directions and a majority is the
     standard fix for a degenerate ray and it costs three times nothing. RENDER-STANDARD: "A PROBE
     WITH A DEGENERATE CASE MUST REPORT THE DEGENERACY" — so the probe also counts how often the three
     disagreed, and the harness prints it. */
  const DIRS = [[1, 0.0371, 0.0177], [0.0213, 1, 0.0431], [0.0307, 0.0119, 1]];
  for (const d2 of DIRS) { const L2 = Math.hypot(d2[0], d2[1], d2[2]); d2[0] /= L2; d2[1] /= L2; d2[2] /= L2; }
  function crossings(ox, oy, oz, dx, dy, dz, tris) {
    let n = 0;
    for (let t2 = 0; t2 < tris.length; t2++) {
      const tr = tris[t2];
      const e1x = tr[3]-tr[0], e1y = tr[4]-tr[1], e1z = tr[5]-tr[2];
      const e2x = tr[6]-tr[0], e2y = tr[7]-tr[1], e2z = tr[8]-tr[2];
      const px = dy*e2z - dz*e2y, py = dz*e2x - dx*e2z, pz = dx*e2y - dy*e2x;
      const det = e1x*px + e1y*py + e1z*pz;
      if (Math.abs(det) < 1e-18) continue;
      const inv = 1/det, tx = ox-tr[0], ty = oy-tr[1], tz = oz-tr[2];
      const u = (tx*px + ty*py + tz*pz) * inv;
      if (u < 0 || u > 1) continue;
      const qx = ty*e1z - tz*e1y, qy = tz*e1x - tx*e1z, qz = tx*e1y - ty*e1x;
      const v = (dx*qx + dy*qy + dz*qz) * inv;
      if (v < 0 || u + v > 1) continue;
      const s2 = (e2x*qx + e2y*qy + e2z*qz) * inv;
      if (s2 > 1e-9) n++;
    }
    return n;
  }
  function isOutside(ox, oy, oz, tris) {
    let yes = 0, no = 0;
    for (const d2 of DIRS) { if (crossings(ox, oy, oz, d2[0], d2[1], d2[2], tris) % 2 === 0) yes++; else no++; }
    return { outside: yes > no, split: yes > 0 && no > 0 };
  }
  const acc = {};
  for (const B of groups) {
    const nv = B.verts.length, step = Math.max(1, Math.floor(nv / S));
    if (!acc[B.key]) acc[B.key] = { out: 0, inn: 0, split: 0, tested: 0, solids: 0, triangles: 0 };
    acc[B.key].solids++; acc[B.key].triangles += B.tris.length;
    for (let i = 0; i < nv; i += step) {
      const v = B.verts[i];
      const o1 = isOutside(v[0] + v[3]*EPS, v[1] + v[4]*EPS, v[2] + v[5]*EPS, B.tris);
      const i1 = isOutside(v[0] - v[3]*EPS, v[1] - v[4]*EPS, v[2] - v[5]*EPS, B.tris);
      acc[B.key].tested++;
      if (o1.outside) acc[B.key].out++;
      if (!i1.outside) acc[B.key].inn++;
      if (o1.split || i1.split) acc[B.key].split++;
    }
  }
  const out = {};
  Object.keys(acc).forEach(function (k) {
    const a = acc[k];
    out[k] = { frac_outside: a.tested ? a.out / a.tested : 0,
               frac_inside_behind: a.tested ? a.inn / a.tested : 0,
               rays_disagreed: a.split,
               tested: a.tested, solids: a.solids, triangles: a.triangles };
  });
  return out;
};

window.runAcceptance = function () { return MOD.acceptance(); };
window.keysAt = function (t, keys) {
  const o = Object.assign({}, MOD.FULL);
  const g = MOD.build(t, o);
  const have = {};
  g.traverse(function (m) { if (m.isMesh && m.userData && !m.userData.outline) have[m.userData.key] = (have[m.userData.key] || 0) + 1; });
  const missing = keys.filter(function (k) { return !have[k]; });
  return { missing: missing, built: Object.keys(have).length };
};
<\/script>`;
writeFileSync(`${OUT}/_harness.html`, html);

const adapterHtml = `<!doctype html><meta charset=utf8>
<link rel="icon" href="data:,">
<body>
<script src="${BASE}node_modules/three/build/three.js"><\/script>
<script>window.MEDBANK_CONFIG = { MODEL_BASE: '${BASE}models3d/' };<\/script>
<script src="${BASE}viz3d.js"><\/script>
<script>
/* THE REAL ADAPTER, not a stand-in. This is the only check that proves a student would see the
   geometry: everything else proves the geometry exists. And it is run at the t of EVERY BEAT that
   shows the structure, not only at the default t — because a ref that resolves at t = 1 and comes
   back empty at t = 0.0328 is a beat that shows a student nothing and reports nothing. */
window.resolvePairs = function (pairs) {
  const ad = window.MB3D.adapters.procedural;
  return Promise.all(pairs.map(function (r) {
    return ad.load(window.THREE, { key: r.key, refs: { procedural: r.ref + '@' + r.t } })
      .then(function (res) {
        const m = res && res.mesh;
        return { key: r.key, t: r.t, beat: r.beat, reason: res && res.reason, hasMesh: !!m,
                 tris: m && m.geometry ? m.geometry.attributes.position.count / 3 : 0 };
      }, function (e) { return { key: r.key, t: r.t, beat: r.beat, error: String((e && e.message) || e) }; });
  }));
};
<\/script>`;
writeFileSync(`${OUT}/_adapter.html`, adapterHtml);

const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium-1194/chrome-linux/chrome',
  args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--no-sandbox'] });
const p = await b.newPage({ viewport: { width: W, height: H } });
const log = [];
p.on('console', m => log.push({ type: m.type(), text: m.text() }));
p.on('pageerror', e => log.push({ type: 'pageerror', text: String((e && e.message) || e) }));

await p.goto(BASE + `${OUT}/_harness.html`);
try { await p.waitForFunction('typeof window.setStage === "function"', null, { timeout: 30000 }); }
catch (e) {
  console.error('HARNESS DID NOT INITIALISE. Page said:');
  for (const m of log) console.error('  ' + m.type + ': ' + m.text.slice(0, 500));
  throw e;
}

const report = { model: SHORT, when: new Date().toISOString(), stages: [], console: [],
                 normals: null, edges: null, rays: null, acceptance: null, refs: null, beats: null };

console.log('MedBank · proof for models3d/' + SHORT + '.js\n');
for (const [name, t, opts, view, label] of STAGES) {
  const info = await p.evaluate(([t2, o, v]) => window.setStage(t2, o, v), [t, opts, view]);
  await p.screenshot({ path: `${OUT}/${name}.png` });
  report.stages.push({ name, t, view, label, ...info });
  console.log('  frame ' + name.padEnd(20) + 't=' + t.toFixed(4) + '  ' + String(info.triangles).padStart(7) +
    ' tris  ' + String(info.meshes).padStart(4) + ' meshes  dist ' + info.distance.toFixed(1) +
    '  extent ' + info.size.map(x => x.toFixed(1)).join(' x '));
}

/* ---------------------------------------------------------------- the probes

   RUN ON THREE FRAMES, not one, and separately on the sac and the strip. They are 92 mm apart and a
   probe sized to the whole model's bounding box is sized to the gap between them: the first version
   of the ray cast landed 7 rays of 2,304 on anything at all, and reported zero backfaces out of
   seven hits as a pass. */
const PROBE_FRAMES = [
  ['sac-d21',   tOf(21), SAC,   'the sac and its bed at day 21'],
  ['sac-d70',   tOf(70), SAC,   'the sac and its bed at day 70, where the laeve exists'],
  ['strip-d21', tOf(21), STRIP, 'the four magnified sections'],
];
report.probes = {};
for (const [tag, t, opts, label] of PROBE_FRAMES) {
  await p.evaluate(([t2, o]) => window.setStage(t2, o, 'lateral'), [t, opts]);
  report.probes[tag] = {
    label,
    centroid: await p.evaluate(() => window.normalProbe()),
    outward: await p.evaluate(() => window.outwardProbe(0.0005, 60)),
    edges: await p.evaluate(() => window.edgeProbe()),
    rays: await p.evaluate(() => window.rayProbe(['lateral', 'medial', 'anterior', 'posterior', 'superior', 'inferior'])),
  };
}
report.normals = report.probes['sac-d21'].centroid;
report.edges = report.probes['sac-d21'].edges;
report.rays = report.probes['sac-d21'].rays;
await p.evaluate(([t2]) => window.setStage(t2, {}, 'lateral'), [tOf(21)]);
report.acceptance = await p.evaluate(() => window.runAcceptance());

/* probe 8 · every key every beat leaves showing must build at that beat's own t */
report.beats = [];
for (const beat of BEATS) {
  const r = await p.evaluate(([t2, keys]) => window.keysAt(t2, keys), [beat.t, beat.shown]);
  report.beats.push({ beat: beat.beat, title: beat.title, t: beat.t, shown: beat.shown.length, missing: r.missing });
}

report.console = log;

/* the real adapter, in its own page so viz3d's own console noise is attributable.
   RESOLVED AT THE t OF EVERY BEAT THAT SHOWS THE STRUCTURE, plus every key at t = 1, which is where a
   ref with no @t stands when no view says otherwise (viz3d.js:478). Resolving every key at every
   beat's t instead reported anchoring_villus and floating_villus as reason:'none' at day 11 — which is
   true and is not a defect: no villus exists on day 11, and the beat at day 11 hides them. Probe 8
   above is what checks that claim about the ops; this is what checks the adapter. */
const PAIRS = [];
for (const beat of BEATS) for (const k of beat.shown) {
  const r = REFS.find(x => x.key === k);
  if (r) PAIRS.push({ key: k, ref: r.ref, t: beat.t, beat: beat.beat });
}
for (const r of REFS) PAIRS.push({ key: r.key, ref: r.ref, t: 1, beat: 'default t' });
const p2 = await b.newPage({ viewport: { width: 400, height: 300 } });
const alog = [];
p2.on('console', m => alog.push({ type: m.type(), text: m.text() }));
p2.on('pageerror', e => alog.push({ type: 'pageerror', text: String((e && e.message) || e) }));
await p2.goto(BASE + `${OUT}/_adapter.html`);
await p2.waitForFunction('window.MB3D && window.MB3D.adapters && window.MB3D.adapters.procedural', null, { timeout: 30000 });
report.refs = await p2.evaluate(([pairs]) => window.resolvePairs(pairs), [PAIRS]);
report.adapterConsole = alog;
await b.close();
server.close();

/* ------------------------------------------------------------------- the verdict */
const fails = [];
const warnLog = report.console.concat(report.adapterConsole || [])
  .filter(m => m.type === 'error' || m.type === 'warning' || m.type === 'pageerror');
if (warnLog.length) fails.push('console not clean: ' + JSON.stringify(warnLog).slice(0, 900));

/* WHAT IS GATED, AND WHY IT IS NOT THE CENTROID FIGURE. RENDER-STANDARD's normals probe counts vertex
   normals pointing away from the mesh's own centroid, and warns: "A tube read at its own centreline
   will not be — understand which you have before you accept a low number." Eleven of this model's
   nineteen keys are SHELLS or ANNULI, whose inner surface's normals point towards the centroid BY
   CONSTRUCTION, so that figure sits at about 0.50 on a perfectly correct shell. It is reported below
   in full, because it is the figure the standard names and a reviewer should see it.
   What is GATED is probe 3b: step along the normal and you must be OUTSIDE the solid, step the other
   way and you must be INSIDE it, tested by ray parity against that key's own built triangles. That is
   what the words mean, it is the same question for a shell as for a ball, and a flipped normal fails
   both halves of it. */
const OUT_FLOOR = 0.98;
for (const [tag, pr] of Object.entries(report.probes)) {
  for (const [k, v] of Object.entries(pr.outward)) {
    if (v.frac_outside < OUT_FLOOR) fails.push(`normals(${tag}): ${k} steps OUTSIDE on only ${(v.frac_outside * 100).toFixed(2)}% of ${v.tested} sampled vertices (floor ${OUT_FLOOR})`);
  }
  /* THE INWARD HALF IS REPORTED AND NOT GATED, and that is a judgement a reviewer should be able to
     argue with. Stepping INWARD and asking for parity-odd is the same test run the other way, and it
     is unreliable exactly where this model is interesting: at a SHARED EDGE — a slab's rim, a cut
     face meeting the surface it was cut from, the pole where a revolved profile pinches to a point —
     the vertex carries one face's normal, and a step inward along it from a corner can leave the
     solid through the neighbouring face. It reads 0.80 to 0.97 here with every other check clean, and
     a floor set to pass that would be a floor set to pass anything. The OUTWARD half is the one the
     words mean, it is gated at 0.98, and the ray cast below is the measurement that settles the
     question from the camera's side — which is the side a student is on. */
  /* WATERTIGHT, GATED ON WHERE RATHER THAN ON HOW MANY. A revolved profile that touches the axis
     pinches to a point there and leaves one edge at each pole carrying a single triangle. That is a
     point, not a hole — nothing can be seen through it — and the probe reports each unpaired edge's
     own coordinates so the gate can be the honest one: no unpaired edge anywhere but the axis. */
  for (const [k, v] of Object.entries(pr.edges)) {
    if (v.offAxis) fails.push(`watertight(${tag}): ${k} has ${v.offAxis} unpaired edge(s) NOT on the axis — ${JSON.stringify(v.where).slice(0, 300)}`);
  }
  for (const [v2, r] of Object.entries(pr.rays)) {
    if (r.hits < 200) fails.push(`ray cast(${tag}) from ${v2} landed only ${r.hits} of ${r.rays} rays on the model — the probe is not looking at the subject`);
    else if (r.backfaceFirst) fails.push(`backface first(${tag}) from ${v2}: ${r.backfaceFirst} of ${r.hits} hits`);
  }
}
if (!report.acceptance.pass) {
  for (const r of report.acceptance.rows) {
    if (!r.pass) fails.push('acceptance ' + r.id + ' FAILED: ' + JSON.stringify(r.got).slice(0, 300));
    else if (r.negative && !r.negative.rejected) fails.push('acceptance ' + r.id + ' negative case NOT rejected');
  }
}
const badRefs = report.refs.filter(r => !r.hasMesh || r.reason || r.error || !r.tris);
if (badRefs.length) fails.push('adapter: ' + JSON.stringify(badRefs).slice(0, 900));
const badBeats = report.beats.filter(b2 => b2.missing.length);
if (badBeats.length) fails.push('beats showing a structure the model does not build at that t: ' + JSON.stringify(badBeats));

for (const [tag, pr] of Object.entries(report.probes)) {
  console.log('\n  --- ' + tag + ' : ' + pr.label + ' ---');
  console.log('    key                        outward  inward   centroid   unpaired(offAxis)');
  const keys = Object.keys(pr.outward);
  for (const k of keys) {
    const o = pr.outward[k], c = pr.centroid[k], e = pr.edges[k];
    console.log('    ' + k.padEnd(26) + o.frac_outside.toFixed(4) + '   ' + o.frac_inside_behind.toFixed(4) +
      '   ' + (c ? c.frac.toFixed(4) : '  -   ') + '     ' + (e ? e.unpaired + '(' + e.offAxis + ')' : '-') +
      '      ' + o.rays_disagreed + '/' + o.tested);
  }
  console.log('    ray cast, first-hit backfaces:');
  for (const [v2, r] of Object.entries(pr.rays)) console.log('      ' + v2.padEnd(11) + r.backfaceFirst + ' of ' + r.hits + ' hits (' + r.rays + ' rays)');
}
console.log('\n  acceptance: ' + report.acceptance.rows.filter(r => r.pass).length + '/' +
  report.acceptance.rows.length + ' rows pass, ' +
  report.acceptance.rows.filter(r => r.negative && r.negative.rejected).length + ' negative cases rejected');
console.log('  adapter: ' + report.refs.filter(r => r.hasMesh && r.tris).length + '/' + report.refs.length +
  ' (key, t) pairs resolved with geometry');
console.log('  beats: ' + report.beats.filter(b2 => !b2.missing.length).length + '/' + report.beats.length +
  ' show only structures the model builds at their own t');
console.log('  console: ' + report.console.length + ' message(s) from the harness page, ' +
  (report.adapterConsole || []).length + ' from the adapter page');

writeFileSync(`${OUT}/report.json`, JSON.stringify(report, null, 1));
if (fails.length) {
  console.error('\nPROOF FAILED:');
  for (const f2 of fails) console.error('  \u00b7 ' + f2);
  process.exit(1);
}
console.log('\nALL FIVE CHECKS AND ALL FOUR PROBES PASS. Frames in ' + OUT);
