/* MedBank · headless proof for models3d/pharyngeal-arches.js
 *
 * Built on tools/render-chorion-placenta-early.mjs, which is the harness that frames the way the
 * PLAYER frames rather than the way VizKit.fitCamera does — see the framing note below, and
 * RENDER-STANDARD section 7. Everything here must pass before the item is marked built:
 *
 *   1. it renders — frames across the whole of weeks 4 to 8, written to
 *      viz-training/models-out/pharyngeal-arches/
 *   2. the console is clean — no error, no warning, no throw
 *   3. normals point outward — per mesh against its own centroid (the figure RENDER-STANDARD names),
 *      and per solid by ray parity (what the words actually mean), which is the one that is GATED
 *   4. the acceptance battery passes AND every negative case rejects
 *   5. every ref in the scene resolves THROUGH THE REAL ADAPTER in viz3d.js, with geometry, at the t
 *      of every beat that shows it — not only at the default t
 *
 * Plus four probes the five above cannot see:
 *   6. NO OPEN LUMEN / BACKFACE FIRST. A grid of rays from each of six cameras; for each, whether the
 *      FIRST surface met faces AWAY from the camera. RENDER-STANDARD 2.4b's ray cast — the probe that
 *      caught the winding bug in the first place.
 *   7. WATERTIGHT. Every triangle edge, welded at 0.2 um, shared by exactly two triangles.
 *   8. THE SCENE'S OPS AGREE WITH WHAT THE MODEL BUILDS. For every beat, every key the beat leaves
 *      showing must build geometry at that beat's own t.
 *   9. THE PERTURBATION. RENDER-STANDARD, "AN ACCEPTANCE MEASUREMENT MUST BE A FUNCTION OF THE BUILT
 *      GEOMETRY": the check the rule asks for is that changing the constant the geometry uses MOVES
 *      the reported number. Nine of this model's fourteen rows name a constant in
 *      ACCEPTANCE.perturb; probe 9 rebuilds with each one altered and requires the row's own measured
 *      value to change. A row whose number does not move is not measuring the model, and this is the
 *      only check that can tell the difference between a measurement and a restated constant.
 *
 * WHERE THIS RUNS. In a Linux container with chromium, against a copy of the repo — not on the
 * mounted repo itself, which has no browser and no playwright. The files under test are byte
 * identical; what is NOT being tested here is the mount, and nothing in this file claims otherwise.
 *
 * Run from the repo root:  node viz-training/tools/render-pharyngeal-arches.mjs
 */
import { chromium } from 'playwright';
import { readFileSync, writeFileSync, mkdirSync } from 'fs';
import http from 'http';
import path from 'path';
import fs from 'fs';

const ROOT = process.cwd();
const SHORT = 'pharyngeal-arches';
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

const SCENE_PATH = `viz-training/scenes/embryology__pharyngeal-apparatus__${SHORT}.json`;
const haveScene = fs.existsSync(SCENE_PATH);
const scene = haveScene ? JSON.parse(readFileSync(SCENE_PATH, 'utf8')) : { structures: [], views: [] };
const REFS = scene.structures.map(s => ({ key: s.key, ref: s.refs && s.refs.procedural })).filter(r => r.ref);

/* which keys each beat leaves showing, and at what t — READ FROM THE SCENE, so probe 8 cannot drift
   away from the ops the player will actually run */
const BEATS = scene.views.map(v => {
  const st = (v.ops || []).find(o => o.op === 'SET_STAGE');
  const groups = {};
  for (const s of scene.structures) { if (s.group) (groups[s.group] = groups[s.group] || []).push(s.key); }
  const vis = {};
  for (const s of scene.structures) vis[s.key] = true;
  const expand = tgt => {
    if (tgt === '*') return Object.keys(vis);
    if (groups[tgt]) return groups[tgt];
    return tgt ? [tgt] : [];
  };
  for (const o of (v.ops || [])) {
    if (o.op === 'SHOW_STRUCTURE') expand(o.target).forEach(k => { if (k in vis) vis[k] = true; });
    if (o.op === 'HIDE_STRUCTURE') expand(o.target).forEach(k => { if (k in vis) vis[k] = false; });
    if (o.op === 'ISOLATE_REGION') {
      const keep = new Set(expand(o.target));
      Object.keys(vis).forEach(k => { if (!keep.has(k)) vis[k] = false; });
    }
    if (o.op === 'PEEL_LAYER') {
      for (const s of scene.structures) if (s.layer === o.layer) vis[s.key] = false;
    }
  }
  return { beat: v.beat, title: v.title, t: st ? st.t : 1, shown: Object.keys(vis).filter(k => vis[k]) };
});

/* THE REF AT A BEAT'S t, AND WHY STRING CONCATENATION IS NOT IT.
 *
 * The harness this one was built from composes `r.ref + '@' + r.t`, which is right for a bare ref and
 * wrong for either of the two shapes this scene uses. A ref carrying FLAGS — the clinical variants
 * here are "pharyngeal-arches#branchial_cyst@0.6471+persistent_sinus" — comes out as
 * "...@0.6471+persistent_sinus@0.6471", and viz3d's parseProceduralRef splits the flags off FIRST, so
 * the flag's name becomes "persistent_sinus@0.6471": a flag that matches nothing, the variant never
 * builds, and the adapter answers reason:'none'. Which it did, for both of this scene's variant
 * structures, and the failure reads as "the model does not build this" rather than as "the harness
 * asked for it wrongly" — a measurement tool's defect presenting as a finding against the thing
 * measured, which is RENDER-STANDARD 3.ac's corollary arriving in a different file.
 *
 * And a ref that ALREADY pins its t must be left alone: appending a second @t changes nothing in
 * viz3d (it parses the first) but it would be luck rather than intent.
 */
function refAt(ref, t) {
  const plus = ref.indexOf('+');
  const base = plus >= 0 ? ref.slice(0, plus) : ref;
  const flags = plus >= 0 ? ref.slice(plus) : '';
  if (base.indexOf('@') >= 0) return base + flags;        // pinned: the pin is the answer
  return base + '@' + t + flags;
}
function partAndFlags(ref) {
  const plus = ref.indexOf('+');
  const base = plus >= 0 ? ref.slice(0, plus) : ref;
  const flags = plus >= 0 ? ref.slice(plus + 1).split(',').filter(Boolean) : [];
  const hash = base.split('@')[0].split('#');
  return { part: hash[1], flags: flags, pin: base.indexOf('@') >= 0 ? parseFloat(base.split('@')[1]) : null };
}

const W = 1100, H = 1100;
const EMBRYO = { section: false };          // the embryo alone: the section slab is parked far away
const SLAB = { pharynx: false, grooves: false, vessels: false, nerves: false, heart: false, sinus: false, embryo: false, section: true };

const STAGES = [
  ['d24-two-arches',    0.0588, EMBRYO, 'lateral',   'day 24 — arch 1 is up, arch 2 appearing'],
  ['d28-four-arches',   0.1765, EMBRYO, 'lateral',   'day 28 — arches 1 to 4, and 6 behind them'],
  ['d30-all-six',       0.2353, EMBRYO, 'lateral',   'day 30 — all six, the fifth there to be counted'],
  ['d30-all-six-ant',   0.2353, EMBRYO, 'anterior',  'day 30, from the front — the arteries paired'],
  ['d33-fifth-gone',    0.3235, EMBRYO, 'lateral',   'day 33 — the fifth has gone; 1 and 2 regressing'],
  ['d38-riding-up',     0.4706, EMBRYO, 'lateral',   'day 38 — the right sixth artery is going'],
  ['d38-riding-up-ant', 0.4706, EMBRYO, 'anterior',  'day 38, from the front — the right nerve rides up'],
  ['d44-descending',    0.6471, EMBRYO, 'lateral',   'day 44 — the heart is taking the left nerve down'],
  ['d56-final',         1.0,    EMBRYO, 'lateral',   'day 56 — the adult pattern'],
  ['d56-final-ant',     1.0,    EMBRYO, 'anterior',  'day 56, from the front — the two nerves, two courses'],
  ['d56-final-post',    1.0,    EMBRYO, 'posterior', 'day 56, from behind — the dorsal aortae'],
  ['section-slab',      0.2353, SLAB,   'lateral',   'the five ingredients of one arch, x12'],
  ['whole-model',       0.2353, {},     'lateral',   'everything the model builds at day 30'],
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

/* VIEW_DIR IS COPIED FROM viz3d.js:2095, NOT RESTATED — RENDER-STANDARD 3.y, "the model's VIEW_DIR
   table is COPIED from viz3d rather than restated, so the player's cameras and the probe's cannot
   drift apart". The model exposes the same table and probe 0 below asserts the two are identical. */
const VIEW_DIR = {
  anterior: [0, 0, 1], posterior: [0, 0, -1], lateral: [1, 0, 0], medial: [-1, 0, 0],
  superior: [0, 1, 0.001], inferior: [0, -1, 0.001]
};

/* FRAMED THE WAY THE PLAYER FRAMES, NOT THE WAY VizKit.fitCamera DOES. RENDER-STANDARD section 7:
   fitCamera computes its distance as
       max( (size.y/2)/tan(vFov/2), (size.x/2)/tan(hFov/2) ) * margin + size.z/2
   with no reference to the view direction, which is correct only for a camera on +/-z. From the
   LATERAL camera at +x the screen's horizontal axis is world z and the depth axis is world x, so the
   two terms are swapped and an anisotropic subject is framed at the wrong distance — measured on
   chorion-placenta-early at 2.20x too close, cropping two of four panels out of the plate.
   THIS MODEL IS SEEN LATERALLY IN NINE OF THIRTEEN FRAMES and is strongly anisotropic (it is tall in
   y and shallow in x), so it is exactly the case section 7 is about. The lines below are copied from
   viz3d.js distanceForBox (viz3d.js:2155), which builds the screen axes from 'dir' and is exact for
   any direction. Probe 0 reports both numbers side by side so the difference is on the record. */
function frameFor(box, dir) {
  const centre = box.getCenter(new THREE.Vector3()), size = box.getSize(new THREE.Vector3());
  const vHalf = camera.fov * Math.PI / 360;
  const hHalf = Math.atan(Math.tan(vHalf) * (camera.aspect || 1));
  let up = Math.abs(dir.y) > 0.99 ? new THREE.Vector3(0, 0, -1) : new THREE.Vector3(0, 1, 0);
  const right = new THREE.Vector3().crossVectors(up, dir).normalize();
  up = new THREE.Vector3().crossVectors(dir, right).normalize();
  const hx = size.x / 2, hy = size.y / 2, hz = size.z / 2;
  const ext = a => Math.abs(a.x) * hx + Math.abs(a.y) * hy + Math.abs(a.z) * hz;
  const dist = Math.max(ext(up) / Math.tan(vHalf), ext(right) / Math.tan(hHalf)) * 1.06 + ext(dir);
  /* what fitCamera WOULD have said, for the record */
  const kit = Math.max((size.y / 2) / Math.tan(vHalf), (size.x / 2) / Math.tan(hHalf)) * 1.05 + size.z / 2;
  return { centre, size, up, right, dist, kitDist: kit };
}

window.setStage = function (t, opts, view) {
  if (group) { scene.remove(group); group.traverse(function (o) { if (o.geometry) o.geometry.dispose(); }); }
  const o = Object.assign({}, MOD.FULL);
  Object.keys(opts || {}).forEach(function (k) { o[k] = opts[k]; });
  group = MOD.build(t, o);
  scene.add(group);
  group.updateMatrixWorld(true);
  const dir = new THREE.Vector3().fromArray(VIEW_DIR[view || 'lateral']).normalize();
  const box = new THREE.Box3().setFromObject(group);
  const f = frameFor(box, dir);
  camera.near = Math.max(0.02, f.dist - f.size.length());
  camera.far = f.dist + f.size.length() * 3;
  camera.updateProjectionMatrix();
  camera.position.copy(f.centre).addScaledVector(dir, f.dist);
  camera.up.copy(f.up);
  camera.lookAt(f.centre);
  renderer.render(scene, camera);
  let tris = 0, meshes = 0;
  group.traverse(function (m) {
    if (m.isMesh && m.geometry && !(m.userData && m.userData.outline)) { meshes++; tris += m.geometry.attributes.position.count / 3; }
  });
  return { triangles: tris, meshes: meshes, distance: f.dist, kitDistance: f.kitDist,
           size: [f.size.x, f.size.y, f.size.z], far: camera.far, near: camera.near,
           day: group.userData.day, clamped: group.userData.nerveClamped || null,
           hookR: group.userData.rln_r_hook || null, hookL: group.userData.rln_l_hook || null };
};

/* ---- probe 0 · the model's own VIEW_DIR table is the player's ---- */
window.viewDirAgrees = function () {
  const a = MOD.VIEW_DIR, out = {};
  for (const k in VIEW_DIR) {
    out[k] = !!(a[k] && a[k].length === 3 && a[k][0] === VIEW_DIR[k][0] &&
                a[k][1] === VIEW_DIR[k][1] && a[k][2] === VIEW_DIR[k][2]);
  }
  return out;
};

/* ---- probe 3 · OUTWARD NORMALS, per mesh, against that mesh's OWN centroid ----
   The figure RENDER-STANDARD names. It is REPORTED and not gated, for the reason that document
   itself gives: "A tube read at its own centreline will not be — understand which you have before you
   accept a low number." Almost every part of this model is a long curved TUBE, whose centroid sits
   off the tube entirely wherever the tube bends through more than a right angle — each arch sweeps
   through 307 degrees — so the figure is near 0.5 on a perfectly correct crescent. Probe 3b is what
   is gated. */
window.normalProbe = function () {
  const byKey = {};
  group.traverse(function (m) {
    if (!m.isMesh || !m.geometry || (m.userData && m.userData.outline)) return;
    const pos = m.geometry.attributes.position.array, nml = m.geometry.attributes.normal.array;
    let cx = 0, cy = 0, cz = 0; const n = pos.length / 3;
    for (let i = 0; i < pos.length; i += 3) { cx += pos[i]; cy += pos[i + 1]; cz += pos[i + 2]; }
    cx /= n; cy /= n; cz /= n;
    let out = 0;
    for (let i = 0; i < pos.length; i += 3) {
      const dx = pos[i] - cx, dy = pos[i + 1] - cy, dz = pos[i + 2] - cz;
      if (dx * nml[i] + dy * nml[i + 1] + dz * nml[i + 2] > 0) out++;
    }
    const k = (m.userData && m.userData.key) || '?';
    if (!byKey[k]) byKey[k] = { out: 0, total: 0, meshes: 0 };
    byKey[k].out += out; byKey[k].total += n; byKey[k].meshes++;
  });
  const o = {};
  Object.keys(byKey).forEach(function (k) {
    o[k] = { frac: byKey[k].out / byKey[k].total, vertices: byKey[k].total, meshes: byKey[k].meshes };
  });
  return o;
};

/* ---- probe 3b · OUTWARD NORMALS, THE WAY THE WORDS ACTUALLY MEAN IT ----
   Step a short way along the normal and you must be OUTSIDE the solid; step the other way and you
   must be INSIDE it. Tested per SUB-MESH against that sub-mesh's OWN triangles, because several keys
   here carry more than one solid (a bilateral nerve is two tubes under one key, the grooves are four
   collars) and a vertex of one that lies inside its neighbour is inside the UNION, which is a correct
   measurement of the wrong question. Three skew directions and a majority vote per vertex; the probe
   counts how often the three disagreed and the harness prints it. ---- */
window.outwardProbe = function (eps, sample) {
  const EPS = eps || 0.0004, S = sample || 70;
  const groups = [];
  group.traverse(function (m) {
    if (!m.isMesh || !m.geometry || (m.userData && m.userData.outline)) return;
    const p = m.geometry.attributes.position.array, nm = m.geometry.attributes.normal.array;
    const tris = [], verts = [];
    for (let i = 0; i < p.length; i += 9) tris.push([p[i],p[i+1],p[i+2],p[i+3],p[i+4],p[i+5],p[i+6],p[i+7],p[i+8]]);
    for (let i = 0; i < p.length; i += 3) verts.push([p[i],p[i+1],p[i+2],nm[i],nm[i+1],nm[i+2]]);
    groups.push({ key: (m.userData && m.userData.key) || '?', tris: tris, verts: verts });
  });
  const DIRS = [[1, 0.0371, 0.0177], [0.0213, 1, 0.0431], [0.0307, 0.0119, 1]];
  for (const d of DIRS) { const L = Math.hypot(d[0], d[1], d[2]); d[0] /= L; d[1] /= L; d[2] /= L; }
  function crossings(ox, oy, oz, dx, dy, dz, tris) {
    let n = 0;
    for (let t = 0; t < tris.length; t++) {
      const tr = tris[t];
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
      const s = (e2x*qx + e2y*qy + e2z*qz) * inv;
      if (s > 1e-9) n++;
    }
    return n;
  }
  function isOutside(ox, oy, oz, tris) {
    let yes = 0, no = 0;
    for (const d of DIRS) { if (crossings(ox, oy, oz, d[0], d[1], d[2], tris) % 2 === 0) yes++; else no++; }
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
               rays_disagreed: a.split, tested: a.tested, solids: a.solids, triangles: a.triangles };
  });
  return out;
};

/* ---- probe 6 · BACKFACE FIRST. Cast a grid of rays from each camera and ask whether the FIRST
   surface met faces away from the viewer. On closed solids the answer is zero. The grid is sized to
   the box AS THAT CAMERA SEES IT, by the same screen-extent arithmetic the framing uses — sized to
   the bounding-box diagonal instead, a grid can be far wider than the subject and land almost no
   rays on it, and a probe reporting zero backfaces out of seven hits reports nothing. ---- */
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
    const hx = s.x / 2, hy = s.y / 2, hz = s.z / 2;
    const ext = a => Math.abs(a.x) * hx + Math.abs(a.y) * hy + Math.abs(a.z) * hz;
    const eu = ext(right) * 1.02, ev = ext(up) * 1.02;
    let hits = 0, back = 0; const where = [];
    const N = 52;
    for (let i = 0; i < N; i++) for (let j = 0; j < N; j++) {
      const u = (i / (N - 1) - 0.5) * 2 * eu, v = (j / (N - 1) - 0.5) * 2 * ev;
      const o = eye.clone().addScaledVector(right, u).addScaledVector(up, v);
      rc.set(o, dir.clone().negate());
      const hs = rc.intersectObjects(targets, false);
      if (!hs.length) continue;
      hits++;
      const h = hs[0];
      const fn = h.face ? h.face.normal.clone().applyMatrix3(new T.Matrix3().getNormalMatrix(h.object.matrixWorld)).normalize() : null;
      if (fn && fn.dot(dir) < 0) {
        back++;
        if (where.length < 5) where.push({ key: (h.object.userData && h.object.userData.key) || '?',
                                           at: [+h.point.x.toFixed(3), +h.point.y.toFixed(3), +h.point.z.toFixed(3)] });
      }
    }
    out[view] = { rays: N * N, hits: hits, backfaceFirst: back, where: where };
  }
  return out;
};

/* ---- probe 7 · WATERTIGHT. Weld at 0.2 um and require every edge to be shared by exactly two
   triangles, per sub-mesh. An unpaired edge is a hole, and a hole is what a student sees through.
   WHERE an unpaired edge is decides whether it is a hole: domeCap closes on a POLE, where the band
   of quads becomes a fan of triangles, and the two quad edges meeting the pole are each carried by
   one triangle. That is a point, not a hole. So the probe records each unpaired edge's coordinates
   and reports whether every one of them is within a dome's pole radius of a mesh extremity, and the
   harness gates on THAT rather than on the count. ---- */
window.edgeProbe = function () {
  const Q = 0.0002;
  const res = {};
  group.traverse(function (m) {
    if (!m.isMesh || !m.geometry || (m.userData && m.userData.outline)) return;
    const p = m.geometry.attributes.position.array;
    const id = new Map();
    const key = i => {
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
    const pos = new Map();
    id.forEach(function (v, k) { pos.set(v, k.split(',').map(Number).map(function (x) { return x * Q; })); });
    let bad = 0; const where = [];
    edges.forEach(function (n, e) {
      if (n === 2) return;
      bad++;
      const ab = e.split(':').map(Number);
      if (where.length < 8) where.push({ a: pos.get(ab[0]), b: pos.get(ab[1]), count: n });
    });
    const k = (m.userData && m.userData.key) || '?';
    if (!res[k]) res[k] = { unpaired: 0, edges: 0, meshes: 0, where: [] };
    res[k].unpaired += bad; res[k].edges += edges.size; res[k].meshes++;
    if (res[k].where.length < 8) res[k].where = res[k].where.concat(where).slice(0, 8);
  });
  return res;
};

window.runAcceptance = function () { return MOD.acceptance(); };
/* PROBE 8 BUILDS WHAT THE ADAPTER WOULD BUILD: one group per distinct (t, flag set), with the flags
   merged over FULL exactly as viz3d's load() merges them, and each entry checked for ITS OWN part at
   ITS OWN t. The first version built a single group from FULL at the beat's t and looked for the
   scene's KEYS in it, which is wrong twice over for a scene with variants: a variant structure's key
   (arch1_hypoplastic) is not the model part it refers to (arch1), and a variant only exists when its
   flag is set, which FULL deliberately does not set. */
window.keysAt = function (t, entries) {
  const cache = {};
  const groupFor = function (tt, flags) {
    const key = tt + '|' + flags.slice().sort().join(',');
    if (!cache[key]) {
      const o = Object.assign({}, MOD.FULL);
      flags.forEach(function (f) { o[f] = true; });
      cache[key] = MOD.build(tt, o);
    }
    return cache[key];
  };
  const missing = [];
  entries.forEach(function (e) {
    const g = groupFor(e.pin == null ? t : e.pin, e.flags || []);
    let found = false;
    g.traverse(function (m) {
      if (m.isMesh && m.userData && !m.userData.outline && m.userData.key === e.part) found = true;
    });
    if (!found) missing.push(e.key + ' (part ' + e.part + (e.flags.length ? ' +' + e.flags.join(',') : '') +
                             ' at t=' + (e.pin == null ? t : e.pin) + ')');
  });
  return { missing: missing };
};
window.claimAt = function (t, name, view) {
  const g = MOD.build(t, Object.assign({}, MOD.FULL));
  return MOD.claimMeasure(g, name, view);
};
window.hooksOverT = function (days) {
  return days.map(function (d) {
    const t = MOD.dayT(d);
    const R = MOD.solveHook(-1, t), L = MOD.solveHook(1, t);
    return { day: d, rightUnder: R.under, rightY: +R.point[1].toFixed(4), rightW: +R.weight.toFixed(3),
             leftUnder: L.under, leftY: +L.point[1].toFixed(4), leftW: +L.weight.toFixed(3),
             keep6r: +MOD.archArteryKeep(6, -1, t).toFixed(4), keep6l: +MOD.archArteryKeep(6, 1, t).toFixed(4) };
  });
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
   geometry; everything else proves the geometry exists. Run at the t of EVERY BEAT that shows the
   structure, not only at the default t — a ref that resolves at t = 1 and comes back empty at the t
   of the beat that shows it is a beat that shows a student nothing and reports nothing. */
window.resolvePairs = function (pairs) {
  const ad = window.MB3D.adapters.procedural;
  return Promise.all(pairs.map(function (r) {
    return ad.load(window.THREE, { key: r.key, refs: { procedural: r.at } })
      .then(function (res) {
        const m = res && res.mesh;
        return { key: r.key, t: r.t, at: r.at, beat: r.beat, reason: res && res.reason, hasMesh: !!m,
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
  for (const m of log) console.error('  ' + m.type + ': ' + m.text.slice(0, 600));
  throw e;
}

const report = { model: SHORT, when: new Date().toISOString(), sceneFound: haveScene,
                 stages: [], console: [], probes: {}, acceptance: null, refs: null, beats: null,
                 viewDir: null, hooks: null, perturb: null };

console.log('MedBank · proof for models3d/' + SHORT + '.js\n');
report.viewDir = await p.evaluate(() => window.viewDirAgrees());

for (const [name, t, opts, view, label] of STAGES) {
  const info = await p.evaluate(([t2, o, v]) => window.setStage(t2, o, v), [t, opts, view]);
  await p.screenshot({ path: `${OUT}/${name}.png` });
  report.stages.push({ name, t, view, label, ...info });
  console.log('  frame ' + name.padEnd(20) + 'day ' + String(info.day.toFixed(1)).padStart(5) +
    '  ' + String(info.triangles).padStart(7) + ' tris  ' + String(info.meshes).padStart(3) +
    ' meshes  dist ' + info.distance.toFixed(2) + ' (kit would say ' + info.kitDistance.toFixed(2) + ')' +
    '  extent ' + info.size.map(x => x.toFixed(2)).join(' x '));
}

report.hooks = await p.evaluate(() => window.hooksOverT([24,28,30,32,34,35,36,37,38,40,44,48,52,56]));

/* the probes, on the embryo and on the slab separately — they are parked far apart and a probe sized
   to the whole model's bounding box is sized to the gap between them */
const PROBE_FRAMES = [
  ['embryo-d30', 0.2353, EMBRYO, 'the embryo at day 30, all six arches'],
  ['embryo-d56', 1.0,    EMBRYO, 'the embryo at day 56, after the regression and the descent'],
  ['slab-d30',   0.2353, SLAB,   'the magnified transverse section'],
];
for (const [tag, t, opts, label] of PROBE_FRAMES) {
  await p.evaluate(([t2, o]) => window.setStage(t2, o, 'lateral'), [t, opts]);
  report.probes[tag] = {
    label,
    centroid: await p.evaluate(() => window.normalProbe()),
    outward: await p.evaluate(() => window.outwardProbe(0.0004, 70)),
    edges: await p.evaluate(() => window.edgeProbe()),
    rays: await p.evaluate(() => window.rayProbe(['lateral', 'medial', 'anterior', 'posterior', 'superior', 'inferior'])),
  };
}

await p.evaluate(() => window.setStage(1.0, { section: true }, 'lateral'));
report.acceptance = await p.evaluate(() => window.runAcceptance());

/* probe 8 · every key every beat leaves showing must build at that beat's own t */
report.beats = [];
for (const beat of BEATS) {
  const entries = beat.shown.map(k => {
    const rr = REFS.find(x => x.key === k);
    if (!rr) return null;
    const pf = partAndFlags(rr.ref);
    return { key: k, part: pf.part, flags: pf.flags, pin: pf.pin };
  }).filter(Boolean);
  const r = await p.evaluate(([t2, es]) => window.keysAt(t2, es), [beat.t, entries]);
  report.beats.push({ beat: beat.beat, title: beat.title, t: beat.t, shown: beat.shown.length, missing: r.missing });
}

report.console = log;

/* the real adapter, in its own page so viz3d's own console noise is attributable */
const PAIRS = [];
for (const beat of BEATS) for (const k of beat.shown) {
  const r = REFS.find(x => x.key === k);
  if (r) PAIRS.push({ key: k, ref: r.ref, at: refAt(r.ref, beat.t), t: beat.t, beat: beat.beat });
}
for (const r of REFS) PAIRS.push({ key: r.key, ref: r.ref, at: refAt(r.ref, 1), t: 1, beat: 'default t' });
if (PAIRS.length) {
  const p2 = await b.newPage({ viewport: { width: 400, height: 300 } });
  const alog = [];
  p2.on('console', m => alog.push({ type: m.type(), text: m.text() }));
  p2.on('pageerror', e => alog.push({ type: 'pageerror', text: String((e && e.message) || e) }));
  await p2.goto(BASE + `${OUT}/_adapter.html`);
  await p2.waitForFunction('window.MB3D && window.MB3D.adapters && window.MB3D.adapters.procedural', null, { timeout: 30000 });
  report.refs = await p2.evaluate(([pairs]) => window.resolvePairs(pairs), [PAIRS]);
  report.adapterConsole = alog;
} else {
  report.refs = []; report.adapterConsole = [];
}
await b.close();
server.close();

/* ------------------------------------------------------------------- probe 9 · THE PERTURBATION

   RENDER-STANDARD: "The check is a PERTURBATION: change the constant the geometry uses and the
   reported number must move. If it does not, the test is not measuring the model, and a test that
   cannot fail is not evidence, however carefully its floor was chosen."

   Run OUTSIDE the browser, in a fresh vm context per perturbation, by rewriting one literal in the
   model source and re-running acceptance. That is the only way to do it honestly: patching a value on
   the loaded module would not change the geometry, which is the whole thing being tested. */
const { default: vm } = await import('node:vm');
function runModel(src) {
  const sb = { console: { log(){}, warn(){}, error(){} }, Math, Date, Object, Array, Number, String,
    Boolean, JSON, Float32Array, Uint16Array, Uint32Array, Int32Array, Map, Set, Error, isFinite,
    parseFloat, parseInt, Infinity, NaN, ArrayBuffer, Symbol, Promise, TypeError, RangeError, Function,
    Reflect, Proxy, WeakMap, Int8Array, Uint8Array, Int16Array, Float64Array, DataView };
  sb.window = sb; sb.self = sb; sb.globalThis = sb;
  vm.createContext(sb);
  vm.runInContext(readFileSync('node_modules/three/build/three.js', 'utf8'), sb, { filename: 'three.js' });
  vm.runInContext(readFileSync('models3d/render-kit.js', 'utf8'), sb, { filename: 'render-kit.js' });
  vm.runInContext(src, sb, { filename: 'model.js' });
  return sb.MB3D_MODELS[SHORT].acceptance();
}
const MODEL_SRC = readFileSync(`models3d/${SHORT}.js`, 'utf8');
/* each: the row it defends, a literal to rewrite, and what to rewrite it to */
const PERTURBATIONS = [
  { rows: ['C', 'E'], what: 'ARCHES[3].v (arch 4 moved cranially)',
    from: "{ n: 4, v: 0.423, stand: 0.058,", to: "{ n: 4, v: 0.530, stand: 0.058," },
  { rows: ['D'], what: 'ARCHES[1].rad (arch 2 made thicker)',
    from: "{ n: 2, v: 0.660, stand: 0.088, rad: 0.205,", to: "{ n: 2, v: 0.660, stand: 0.088, rad: 0.380," },
  { rows: ['H', 'L'], what: 'archArteryKeep(6, right) — the right sixth artery no longer regresses',
    from: "if (n === 6) return side < 0 ? 1 - 0.58 * ramp(t, 32, 38) : 1;",
    to:   "if (n === 6) return 1;" },
  /* ROW K NEEDS ITS OWN PERTURBATION, and finding that out was the point of running probe 9.
     K asserts that the two hooks are LEVEL before the regression, so it was first defended by the
     same perturbation as H and L — stopping the right sixth artery regressing at all. Its number
     correctly did NOT move: K is measured at day 30, and at day 30 that artery has not begun to
     regress in EITHER version, so the two builds are identical at the t K looks at. The probe
     reported "row K's measured value did not move", which is exactly what it is for, and the fault
     was in the mapping rather than in the row. What moves K is making the regression happen EARLY
     enough to have already occurred by day 30 — then the right nerve has ridden up before K measures
     and the asymmetry it is asserting the absence of is there. */
  { rows: ['K'], what: 'archArteryKeep(6, right) regresses on days 24-28, before row K measures',
    from: "if (n === 6) return side < 0 ? 1 - 0.58 * ramp(t, 32, 38) : 1;",
    to:   "if (n === 6) return side < 0 ? 1 - 0.58 * ramp(t, 24, 28) : 1;" },
  { rows: ['J', 'I'], what: 'ARTERY_DESCENT[6].l (the ductus stops being towed down)',
    from: "6: { r: 0.80, l: 0.95 },", to: "6: { r: 0.80, l: 0.02 }," },
  { rows: ['F'], what: 'ARCH5_FLOOR (arch 5 leaves a full-size residue)',
    from: "const ARCH5_FLOOR = 0.085;", to: "const ARCH5_FLOOR = 0.92;" },
  { rows: ['M'], what: 'CARTS[2].frac (the arch 3 cartilage spans the whole arch)',
    from: "{ n: 3, frac: 0.62, day: 28.0 }", to: "{ n: 3, frac: 0.99, day: 28.0 }" },
  /* Q IS DEFENDED BY THE SMOOTHING BUDGET, not by a calibre. The first perturbation made the arch
     arteries four times fatter and row Q did not move — correctly: arteryRadius() clamps at 0.021, so
     the geometry was unchanged, and probe 9 said so, which is what probe 9 is for. Taking the budget
     to zero leaves every centreline exactly as the Catmull-Rom laid it down, which is the state row Q
     exists to reject. */
  { rows: ['Q'], what: 'SWEEP_BUDGET = 0 (no centreline is smoothed into sweepability)',
    from: "const SWEEP_BUDGET = 260;", to: "const SWEEP_BUDGET = 0;" },
  { rows: ['N'], what: 'SEC.protrude (the core inclusions stop protruding)',
    from: "protrude: 1.25,", to: "protrude: 1.0," },
  { rows: ['A'], what: 'SAC_HALF_X (the two sides stop being separated at the sac)',
    from: "const SAC_HALF_X = 0.052;", to: "const SAC_HALF_X = 0.0;" },
  { rows: ['P'], what: 'archArteryKeep(5) — the fifth arch artery never forms',
    from: "if (n === 5) return 1 - 0.94 * ramp(t, 29.6, 31);", to: "if (n === 5) return 0.02;" },
];
const baseAcc = runModel(MODEL_SRC);
const baseByRow = {}; for (const r of baseAcc.rows) baseByRow[r.id] = JSON.stringify(r.got);
report.perturb = [];
for (const P of PERTURBATIONS) {
  if (MODEL_SRC.indexOf(P.from) < 0) {
    report.perturb.push({ ...P, applied: false, why: 'literal not found in source — the perturbation is stale' });
    continue;
  }
  let acc = null, err = null;
  try { acc = runModel(MODEL_SRC.replace(P.from, P.to)); } catch (e) { err = String(e && e.message || e); }
  const moved = {}, failed = {};
  if (acc) {
    const by = {}; for (const r of acc.rows) by[r.id] = r;
    for (const id of P.rows) {
      moved[id] = by[id] ? (JSON.stringify(by[id].got) !== baseByRow[id]) : null;
      failed[id] = by[id] ? !by[id].pass : null;
    }
  }
  report.perturb.push({ rows: P.rows, what: P.what, applied: true, error: err, moved, nowFails: failed });
}

/* ------------------------------------------------------------------- the verdict */
const fails = [];
const warnLog = report.console.concat(report.adapterConsole || [])
  .filter(m => m.type === 'error' || m.type === 'warning' || m.type === 'pageerror');
if (warnLog.length) fails.push('console not clean: ' + JSON.stringify(warnLog).slice(0, 1200));

for (const [k, ok] of Object.entries(report.viewDir)) {
  if (!ok) fails.push(`VIEW_DIR disagrees with viz3d for "${k}" — the model's camera table has drifted from the player's`);
}

/* WHAT IS GATED, AND WHY IT IS NOT THE CENTROID FIGURE — see the note on probe 3. */
const OUT_FLOOR = 0.98;
for (const [tag, pr] of Object.entries(report.probes)) {
  for (const [k, v] of Object.entries(pr.outward)) {
    if (v.frac_outside < OUT_FLOOR) {
      fails.push(`normals(${tag}): ${k} steps OUTSIDE on only ${(v.frac_outside * 100).toFixed(2)}% of ${v.tested} sampled vertices (floor ${OUT_FLOOR})`);
    }
  }
  for (const [k, v] of Object.entries(pr.edges)) {
    if (v.unpaired) fails.push(`watertight(${tag}): ${k} has ${v.unpaired} unpaired edge(s) — ${JSON.stringify(v.where).slice(0, 400)}`);
  }
  for (const [v, r] of Object.entries(pr.rays)) {
    if (r.hits < 250) fails.push(`ray cast(${tag}) from ${v} landed only ${r.hits} of ${r.rays} rays on the model — the probe is not looking at the subject`);
    else if (r.backfaceFirst) fails.push(`backface first(${tag}) from ${v}: ${r.backfaceFirst} of ${r.hits} hits — ${JSON.stringify(r.where)}`);
  }
}
if (!report.acceptance.pass) {
  for (const r of report.acceptance.rows) {
    if (!r.pass) fails.push('acceptance ' + r.id + ' FAILED: ' + JSON.stringify(r.got).slice(0, 500));
    else if (r.negative && !r.negative.rejected) fails.push('acceptance ' + r.id + ' negative case NOT rejected');
  }
}
for (const P of report.perturb) {
  if (!P.applied) { fails.push('perturbation stale: ' + P.what + ' — ' + P.why); continue; }
  if (P.error) { fails.push('perturbation threw: ' + P.what + ' — ' + P.error); continue; }
  for (const id of P.rows) {
    if (P.moved[id] === false) {
      fails.push(`PERTURBATION: row ${id}'s measured value did NOT move when ${P.what} changed — ` +
        `that row is not a function of the built geometry`);
    }
  }
}
if (haveScene) {
  const badRefs = (report.refs || []).filter(r => !r.hasMesh || r.reason || r.error || !r.tris);
  if (badRefs.length) fails.push('adapter: ' + JSON.stringify(badRefs).slice(0, 1200));
  const badBeats = (report.beats || []).filter(b2 => b2.missing.length);
  if (badBeats.length) fails.push('beats showing a structure the model does not build at that t: ' + JSON.stringify(badBeats));
  if (!REFS.length) fails.push('the scene declares no procedural refs — it has not been wired');
} else {
  fails.push('scene file not found at ' + SCENE_PATH + ' — the model is not reachable by anything');
}

for (const [tag, pr] of Object.entries(report.probes)) {
  console.log('\n  --- ' + tag + ' : ' + pr.label + ' ---');
  console.log('    key                      outward  inward   centroid  unpaired  raysDisagree');
  for (const k of Object.keys(pr.outward)) {
    const o = pr.outward[k], c = pr.centroid[k], e = pr.edges[k];
    console.log('    ' + k.padEnd(24) + o.frac_outside.toFixed(4) + '   ' + o.frac_inside_behind.toFixed(4) +
      '   ' + (c ? c.frac.toFixed(4) : '  -   ') + '    ' + String(e ? e.unpaired : '-').padStart(4) +
      '      ' + o.rays_disagreed + '/' + o.tested + '  (' + o.solids + ' solid' + (o.solids > 1 ? 's' : '') + ')');
  }
  console.log('    ray cast, first-hit backfaces:');
  for (const [v, r] of Object.entries(pr.rays)) console.log('      ' + v.padEnd(11) + r.backfaceFirst + ' of ' + r.hits + ' hits (' + r.rays + ' rays)');
}

console.log('\n  the solved hooks over t:');
console.log('    day   keep6R  keep6L   right: under  y        left: under  y');
for (const h of report.hooks) {
  console.log('    ' + String(h.day).padStart(3) + '   ' + h.keep6r.toFixed(3) + '   ' + h.keep6l.toFixed(3) +
    '      arch ' + h.rightUnder + '   ' + String(h.rightY.toFixed(3)).padStart(7) +
    '        arch ' + h.leftUnder + '   ' + String(h.leftY.toFixed(3)).padStart(7));
}

console.log('\n  acceptance: ' + report.acceptance.rows.filter(r => r.pass).length + '/' +
  report.acceptance.rows.length + ' rows pass, ' +
  report.acceptance.rows.filter(r => r.negative && r.negative.rejected).length + ' negative cases rejected');
console.log('  perturbation: ' + report.perturb.filter(P => P.applied && !P.error &&
  P.rows.every(id => P.moved[id])).length + '/' + report.perturb.length + ' moved the rows they defend');
for (const P of report.perturb) {
  console.log('    ' + P.rows.join(',').padEnd(8) + (P.applied ? '' : 'STALE ') +
    P.rows.map(id => id + ':' + (P.moved && P.moved[id] ? 'moved' : 'STILL') +
      (P.nowFails && P.nowFails[id] ? '/fails' : '/passes')).join(' ') + '   ' + P.what);
}
console.log('  adapter: ' + (report.refs || []).filter(r => r.hasMesh && r.tris).length + '/' +
  (report.refs || []).length + ' (key, t) pairs resolved with geometry');
console.log('  beats: ' + (report.beats || []).filter(b2 => !b2.missing.length).length + '/' +
  (report.beats || []).length + ' show only structures the model builds at their own t');
console.log('  console: ' + report.console.length + ' message(s) from the harness page, ' +
  (report.adapterConsole || []).length + ' from the adapter page');

writeFileSync(`${OUT}/report.json`, JSON.stringify(report, null, 1));
if (fails.length) {
  console.error('\nPROOF FAILED:');
  for (const f of fails) console.error('  · ' + f);
  process.exit(1);
}
console.log('\nALL CHECKS AND ALL PROBES PASS. Frames in ' + OUT);
