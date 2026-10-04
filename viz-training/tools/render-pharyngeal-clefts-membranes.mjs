/* MedBank · headless proof for models3d/pharyngeal-clefts-membranes.js
 *
 * ADAPTED FROM tools/render-pharyngeal-pouches.mjs, which is the harness this corpus had settled on
 * when this item was built. Its probes, its gating argument about `superior`/`inferior` backfaces and
 * its player-style camera (RENDER-STANDARD section 7: never VizKit.fitCamera off the z axis) are kept
 * as they were. Three things are added, all because this model has something that one does not:
 *
 *   check 10 · THE PLUG AND THE CANAL ARE NEVER DRAWN TOGETHER. `meatal_plug` and `meatus_lumen` are
 *     the same space at two different times, so the model's containment row excludes that pair BY
 *     NAME — and an exclusion by name is only honest if nothing draws them together. This asserts it
 *     off the scene's own ops rather than trusting the author.
 *
 *   check 11 · ONE EMBRYO, TWO SCENES. The frame law, the growth law and the cleft LEVELS in this
 *     model are copied from pharyngeal-pouches.js so that a student opening both scenes sees one
 *     embryo. A copy can drift, so this loads BOTH models into the same page and measures the two
 *     `cleft1` solids against each other at a shared day. It also, incidentally, exercises the IIFE
 *     rule: two models in one page is exactly the case RENDER-STANDARD says a top-level `const T`
 *     breaks.
 *
 *   The cleft EXTENT is expected to differ and the check says so with a number rather than failing:
 *     that divergence is this item's finding against the pouches model, recorded in the scene's
 *     gaps[] and in BUILD-LOG.md. What must agree is where each groove IS.
 *
 * ---- the original header follows ----
 *
 * MedBank · headless proof for models3d/pharyngeal-pouches.js
 *
 * Built on the shape of tools/render-chorion-placenta-early.mjs, which is the harness that fixed the
 * off-axis framing bug RENDER-STANDARD section 7 records. Everything here must pass before the item
 * is marked built:
 *   1. it renders — fourteen frames across the process, into viz-training/models-out/pharyngeal-pouches/
 *   2. the console is clean — no error, no warning, no throw, on either page
 *   3. normals point outward — per key, two ways: the centroid count RENDER-STANDARD names, and the
 *      ray-parity test that is what "outward" actually means on a shell
 *   4. the acceptance battery passes AND every negative case rejects
 *   5. every ref in the scene resolves THROUGH THE REAL ADAPTER in viz3d.js, with geometry, at the t
 *      of every beat that shows it — and at t = 1, which is where an unpinned ref stands at mount
 *   6. NO OPEN LUMEN / BACKFACE FIRST. A grid of rays from each of six cameras: whether the FIRST
 *      surface met faces AWAY from the camera. RENDER-STANDARD 2.4b's ray cast.
 *   7. WATERTIGHT. Every triangle edge, welded, shared by exactly two triangles.
 *   8. THE SCENE'S OPS AGREE WITH WHAT THE MODEL BUILDS. For every beat, every key the beat leaves
 *      showing must build geometry at that beat's own t.
 *   9. NO BEAT SHOWS A VESTIGE. The model floors eight transient structures at a tenth of their peak
 *      so that their refs mount at t = 1 (queue item 137 — see the model's header). That floor is a
 *      mounting requirement and not a picture, so this harness asserts the other half of the bargain:
 *      no beat shows one of those structures at a t where it is near its floor. Without this check
 *      the workaround is indistinguishable from a model that draws organs which have gone.
 *
 * FRAMED THE WAY THE PLAYER FRAMES, NOT WITH VizKit.fitCamera. RENDER-STANDARD section 7: fitCamera
 * maps size.y to the screen's vertical and size.x to its horizontal with no reference to the view
 * direction, which is true only on +/-z. Five of this scene's eight beats stand at `lateral`, `medial`
 * or `anterior`, and the apparatus is strongly anisotropic — about 4.4 x 11 x 3 mm at t = 1 — so the
 * three lines below are copied from viz3d.js distanceForBox (:2155) instead.
 *
 * WHERE THIS RUNS. In a Linux container with chromium, against a copy of the repo — not on the
 * mounted repo itself, which has no browser and no playwright. Measured rather than assumed for this
 * run: md5 of viz3d.js, models3d/render-kit.js, node_modules/three/build/three.js and the scene JSON
 * are identical on both sides. What is NOT tested here is the mount, and nothing in this file claims
 * otherwise.
 *
 * Run from the repo root:  node viz-training/tools/render-pharyngeal-pouches.mjs
 */
import { chromium } from 'playwright';
import { readFileSync, writeFileSync, mkdirSync } from 'fs';
import http from 'http';
import path from 'path';
import fs from 'fs';

const ROOT = process.cwd();
const SHORT = 'pharyngeal-clefts-membranes';
const SIBLING = 'pharyngeal-pouches';   // check 11's comparison model
const OUT = `viz-training/models-out/${SHORT}`;
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

const SCENE_PATH = `viz-training/scenes/embryology__pharyngeal-apparatus__${SHORT}.json`;
const scene = JSON.parse(readFileSync(SCENE_PATH, 'utf8'));
const REFS = scene.structures.map(s => ({ key: s.key, ref: s.refs && s.refs.procedural })).filter(r => r.ref);

/* WHICH KEYS EACH BEAT LEAVES SHOWING, AND AT WHAT t — read from the scene's own ops, in order, so
   checks 8 and 9 cannot drift away from what the player will actually run. */
const BEATS = scene.views.map(v => {
  const st = (v.ops || []).find(o => o.op === 'SET_STAGE');
  const vis = {};
  for (const s of scene.structures) vis[s.key] = true;
  for (const o of (v.ops || [])) {
    const keys = o.target === '*' ? Object.keys(vis) : (o.target ? [o.target] : []);
    if (o.op === 'SHOW_STRUCTURE') keys.forEach(k => { if (k in vis) vis[k] = true; });
    if (o.op === 'HIDE_STRUCTURE') keys.forEach(k => { if (k in vis) vis[k] = false; });
  }
  const rot = (v.ops || []).filter(o => o.op === 'ROTATE_TO_VIEW').pop();
  return { beat: v.beat, title: v.title, t: st ? st.t : 1, day: v.day,
           camera: (rot && rot.view) || v.camera || 'lateral',
           shown: Object.keys(vis).filter(k => vis[k]) };
});

/* the eight structures the model floors at a mounting vestige — check 9's subject. Named here rather
   than inferred, and cross-checked against the model's own acceptance row V below. */
/* THE C CELLS ARE ON THIS LIST NOW, and leaving them off cost a round. Beat 7 stood at day 44 and
   pointed at a structure the model floors until day 44 and only grows from there — it drew the cells
   at a tenth of themselves and the player frame measured 0.017% of ink. Check 9 did not see it
   because this list held only the structures that involute, and the C cells are the opposite case:
   they have not arrived yet. A structure is at its mounting floor whether it is early or late, so
   anything the model floors belongs here. */
/* The structures THIS model floors at a mounting vestige, cross-checked against its acceptance row
   V, which reports the same list with the axis each one is measured on. Note that `cleft1` is NOT on
   it: in the pouches model the first cleft involutes with the rest because it is context there, and
   here it is the one groove that persists. */
const VESTIGED = ['cleft2', 'cleft3', 'cleft4', 'cervical_sinus', 'operculum', 'membranes_lower'];
/* MEASURED AGAINST EACH STRUCTURE'S OWN PEAK, NOT AGAINST A SHARED NUMBER. The first draft asked
   that a shown structure measure at least 0.45 of an intersegment, and failed beat 7 on the
   ultimopharyngeal body — which measures 0.303 at day 44 because 0.303 is the biggest it EVER gets.
   The body is a small organ; the pouch stems are large ones. A single absolute floor compares them
   to each other instead of each to itself, which is the shape of mistake RENDER-STANDARD keeps
   naming: the measured side was not a function of the thing the claim is about. The claim is "this
   beat is not showing you a residue", so the measure is the structure's size as a fraction of its
   own maximum, and the bar is half. */
/* 0.40, AND THE NUMBER IS SET BY WHAT IT HAS TO SEPARATE RATHER THAN BY TASTE. The bar exists to
   catch a beat pointing at a residue or at something that has not arrived. Measured on this scene,
   the things it must reject are: a structure at the mounting floor, 0.10 of its peak; the fourth
   pouch after it has involuted, 0.158; that pouch's ventral wing, 0.259. The thing it must ACCEPT is
   the ultimopharyngeal body in beat 7, which stands at the midpoint of the handover to the C cells
   and is therefore at 0.4999990 of its peak by construction — a bar of 0.50 is a knife edge on a
   number the model puts exactly there. 0.40 sits in the gap between 0.259 and 0.50 with room on both
   sides, and a beat that showed a residue would still fail it. */
const VESTIGE_PEAK_FRAC = 0.40;
const PEAK_SCAN = [];
for (let d = 22; d <= 56; d += 1) PEAK_SCAN.push((d - 22) / 34);

/* the cameras the scene's beats actually stand at — read from the ops, not listed by hand */
const SCENE_CAMERAS = new Set(BEATS.map(b => b.camera));

const W = 1000, H = 1000;
const dOf = d => (d - 22) / 34;
const STAGES = [
  ['d22-wall',        dOf(22), 'lateral',   'day 22 — the wall before a groove has formed; the smallest the model ever is'],
  ['d26-grooves',     dOf(26), 'lateral',   'day 26 — the four grooves appearing between the bars'],
  ['d34-four',        dOf(34), 'anterior',  'day 34 — all four pairs open on the surface (beat 1)'],
  ['d34-lateral',     dOf(34), 'lateral',   'day 34, from the side'],
  ['d36-membranes',   dOf(36), 'anterior',  'day 36 — four membranes, the lower three at full extension (beat 8)'],
  ['d40-flap',        dOf(40), 'lateral',   'day 40 — the flap mid-sweep, cleft 2 buried and cleft 4 not (beat 5)'],
  ['d44-sinus',       dOf(44), 'lateral',   'day 44 — the cervical sinus, three grooves inside it (beats 3, 6)'],
  ['d44-superior',    dOf(44), 'superior',  'day 44, from above: the flap wrapping the lateral surface'],
  ['d47-fusion',      dOf(46.955), 'lateral', 'the SOLVED day the flap meets the epipericardial ridge'],
  ['d49-survivor',    dOf(49), 'lateral',   'day 49 — one groove left outside the flap (beat 7)'],
  ['d48-membrane',    dOf(48), 'lateral',   'day 48 — the three laminae of membrane 1 (beat 9)'],
  ['d52-chain',       dOf(52), 'lateral',   'day 52 — canal, membrane, pouch: outside against inside (beat 10)'],
  ['d54-clinical',    dOf(54), 'lateral',   'day 54 — the cyst, and the carotids it lies between (beat 11)'],
  ['d56-end',         dOf(56), 'lateral',   'day 56 — the tracts, and the t every unpinned ref mounts at (beat 12)'],
  ['d56-anterior',    dOf(56), 'anterior',  'day 56, from the front: four pairs about the median plane'],
];

const html = `<!doctype html><meta charset=utf8>
<link rel="icon" href="data:,">
<body style="margin:0;background:#0e1626">
<canvas id=c width=${W} height=${H}></canvas>
<script src="${BASE}node_modules/three/build/three.js"><\/script>
<script src="${BASE}models3d/render-kit.js"><\/script>
<script src="${BASE}models3d/${SHORT}.js"><\/script>
<script src="${BASE}models3d/${SIBLING}.js"><\/script>
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

/* VIEW_DIR IS COPIED FROM viz3d.js (:2095), NOT RESTATED — RENDER-STANDARD 3.y, so the player's
   cameras and this probe's cannot drift apart. The model exports the same table for the same reason
   and the harness asserts the two agree, below. */
const VIEW_DIR = {
  anterior: [0, 0, 1], posterior: [0, 0, -1], lateral: [1, 0, 0], medial: [-1, 0, 0],
  superior: [0, 1, 0.001], inferior: [0, -1, 0.001]
};
window.viewDirAgrees = function () {
  const a = JSON.stringify(VIEW_DIR), b = JSON.stringify(MOD.VIEW_DIR);
  return { harness: a, model: b, agree: a === b };
};

/* ---- check 11 · ONE EMBRYO, TWO SCENES ----
   Both models are loaded in this page, which is itself the IIFE rule under test: two models whose
   a top-level 'const T = window.THREE' could not coexist here at all.

   The comparison is made on the BUILT GEOMETRY, not on exported constants, because a constant can
   agree while the geometry does not. Each model is built at the same day and its 'cleft1' solid is
   measured on one side, in units of that model's OWN intersegment — so the two are compared in a
   dimensionless frame and a difference cannot be an artefact of scale. */
window.crossModelCleft1 = function (day) {
  const t = (day - 22) / 34;
  const out = {};
  for (const name of ['${SHORT}', '${SIBLING}']) {
    const M = window.MB3D_MODELS[name];
    if (!M) { out[name] = { error: 'model not registered' }; continue; }
    const g = M.build(t, Object.assign({}, M.FULL || {}));
    const seg = M.frameAt(t).seg;
    let lo = [1e30, 1e30, 1e30], hi = [-1e30, -1e30, -1e30], n = 0;
    g.traverse(function (m) {
      if (!m.isMesh || !m.geometry || (m.userData && m.userData.outline)) return;
      if (!m.userData || m.userData.key !== 'cleft1') return;
      const a = m.geometry.attributes.position.array;
      for (let i = 0; i < a.length; i += 3) {
        if (a[i] < 0) continue;                       // one side only
        n++;
        for (let k = 0; k < 3; k++) { if (a[i+k] < lo[k]) lo[k] = a[i+k]; if (a[i+k] > hi[k]) hi[k] = a[i+k]; }
      }
    });
    out[name] = n ? {
      vertices: n, seg: seg,
      /* the groove's POSITION, in its own intersegments: the level of its centre and how far lateral
         it sits. These are the "one embryo" claim. */
      level_y_seg: ((lo[1] + hi[1]) / 2) / seg,
      lateral_x_seg: hi[0] / seg,
      /* and its SHAPE, which this model deliberately changed */
      height_y_seg: (hi[1] - lo[1]) / seg,
    } : { error: 'no cleft1 geometry' };
  }
  const a = out['${SHORT}'], b = out['${SIBLING}'];
  if (a && b && !a.error && !b.error) {
    out.agreement = {
      level_delta_seg: Math.abs(a.level_y_seg - b.level_y_seg),
      lateral_delta_seg: Math.abs(a.lateral_x_seg - b.lateral_x_seg),
      height_delta_seg: Math.abs(a.height_y_seg - b.height_y_seg),
    };
  }
  return out;
};

window.setStage = function (t, view) {
  if (group) { scene.remove(group); group.traverse(function (o) { if (o.geometry) o.geometry.dispose(); }); }
  group = MOD.build(t, Object.assign({}, MOD.FULL));
  scene.add(group);
  const dir = new THREE.Vector3().fromArray(VIEW_DIR[view || 'lateral']).normalize();
  /* copied from viz3d.js distanceForBox (:2155) — see the header */
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
  camera.near = Math.max(0.01, dist - size.length());
  camera.far = dist + size.length() * 3;
  camera.updateProjectionMatrix();
  camera.position.copy(centre).addScaledVector(dir, dist);
  camera.up.copy(up);
  camera.lookAt(centre);
  renderer.render(scene, camera);
  let tris = 0, meshes = 0;
  group.traverse(function (m) {
    if (m.isMesh && m.geometry && !(m.userData && m.userData.outline)) { meshes++; tris += m.geometry.attributes.position.count / 3; }
  });
  return { triangles: tris, meshes: meshes, distance: dist,
           size: [size.x, size.y, size.z], near: camera.near, far: camera.far };
};

/* ---- probe 3 · OUTWARD NORMALS, per key, against that key's OWN centroid.
   Reported in full because it is the figure RENDER-STANDARD names, and NOT gated: eleven of this
   model's keys are shells or merged bilateral pairs, whose centroid sits between the two sides, so
   the figure is meaningless for them even when the surface is perfect. Probe 3b is what is gated. */
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

/* ---- probe 3b · OUTWARD NORMALS, THE WAY THE WORDS MEAN IT ----
   Step a short way along the normal and you must be OUTSIDE the solid; step the other way and you
   must be INSIDE. Measured per SUB-MESH against that sub-mesh's OWN triangles, not per key: every
   key here is a merged bilateral PAIR and several are merges of nine or more blobs, so a vertex of
   one blob that lies inside its neighbour would be "inside the union" and the probe would be
   answering a different question perfectly. Three skew directions and a majority, because one
   axis-aligned ray from a vertex that grazes a neighbouring triangle edge-on gives a parity that is
   right in principle and wrong in arithmetic. */
function crossingsFor(ox, oy, oz, dx, dy, dz, tris) {
  let n = 0;
  for (let t = 0; t < tris.length; t++) {
    const tr = tris[t];
    const e1x = tr[3]-tr[0], e1y = tr[4]-tr[1], e1z = tr[5]-tr[2];
    const e2x = tr[6]-tr[0], e2y = tr[7]-tr[1], e2z = tr[8]-tr[2];
    const px = dy*e2z - dz*e2y, py = dz*e2x - dx*e2z, pz = dx*e2y - dy*e2x;
    const det = e1x*px + e1y*py + e1z*pz;
    if (Math.abs(det) < 1e-20) continue;
    const inv = 1/det, tx = ox-tr[0], ty = oy-tr[1], tz = oz-tr[2];
    const u = (tx*px + ty*py + tz*pz) * inv;
    if (u < 0 || u > 1) continue;
    const qx = ty*e1z - tz*e1y, qy = tz*e1x - tx*e1z, qz = tx*e1y - ty*e1x;
    const v = (dx*qx + dy*qy + dz*qz) * inv;
    if (v < 0 || u + v > 1) continue;
    if ((e2x*qx + e2y*qy + e2z*qz) * inv > 1e-11) n++;
  }
  return n;
}
/* ---- probe 3c · OUTWARD NORMALS, SPLIT BY SURFACE ROLE ----
   ADDED BY THIS RUN, for the same reason probe 10 splits winding by role: the aggregate could not say
   WHOSE the failure was, and the three bands of a curvedPlate are three different claims.

   RENDER-STANDARD 2.4 is explicit that "only the outer surface becomes a silhouette", and the winding
   probe above already gates the hull and reports the rest for exactly that reason. This does the same
   for the step-outside test. The emission order of curvedPlate is outer surface, then inner face, then
   rim, and hullCount marks the first boundary; the inner face has the same triangle count as the
   outer, which gives the second.

   WHAT THIS RUN FOUND WITH IT, because the aggregate had hidden it: the operculum read 78.4% at day
   22 and the aggregate said only "the operculum". Split, the hull was 0 of 191 bad and the INNER face
   75 of 191 — which located a real fold in the offset surface at the mounting vestige, fixed in
   opSurface by making the flap's stand-off a fraction of its own length. After that fix both faces
   read clean at every day and 7 of 32 RIM vertices remain at day 22 alone. Those are hard-edged
   corner vertices shared by two rim faces with different per-face tangents, on a plate whose rim
   strips at the vestige are 0.05 units across against a probe step of 0.031: the probe is measuring
   its own step. The hull and the inner face are gated; the rim is reported. */
window.outwardBands = function (eps, sample) {
  const out = {};
  const S = sample || 60;
  const DIRS = [[1, 0.0371, 0.0177], [0.0213, 1, 0.0431], [0.0307, 0.0119, 1]];
  for (const d of DIRS) { const L = Math.hypot(d[0], d[1], d[2]); d[0] /= L; d[1] /= L; d[2] /= L; }
  group.traverse(function (m) {
    if (!m.isMesh || !m.geometry || (m.userData && m.userData.outline)) return;
    const hc = m.geometry.userData.hullCount;
    if (hc == null) return;                       // only meshes that declare a hull boundary
    const p = m.geometry.attributes.position.array, nm = m.geometry.attributes.normal.array;
    const tris = [];
    for (let i = 0; i < p.length; i += 9) tris.push([p[i],p[i+1],p[i+2],p[i+3],p[i+4],p[i+5],p[i+6],p[i+7],p[i+8]]);
    let mn = [1e30,1e30,1e30], mx = [-1e30,-1e30,-1e30];
    for (let i = 0; i < p.length; i += 3) for (let a = 0; a < 3; a++) {
      if (p[i+a] < mn[a]) mn[a] = p[i+a]; if (p[i+a] > mx[a]) mx[a] = p[i+a]; }
    const epsAbs = (eps || 0.001) * Math.hypot(mx[0]-mn[0], mx[1]-mn[1], mx[2]-mn[2]);
    const nHull = hc / 3, nInner = nHull;         // curvedPlate: the two faces are the same grid
    const k = m.userData.key || '?';
    if (!out[k]) out[k] = { hull: {n:0,bad:0}, inner: {n:0,bad:0}, rim: {n:0,bad:0}, eps: epsAbs };
    const nv = p.length / 3;
    const step = Math.max(1, Math.floor(nv / S));
    for (let vi = 0; vi < nv; vi += step) {
      const i = vi * 3;
      const ox = p[i] + nm[i]*epsAbs, oy = p[i+1] + nm[i+1]*epsAbs, oz = p[i+2] + nm[i+2]*epsAbs;
      let inside = 0;
      for (const d of DIRS) if (crossingsFor(ox, oy, oz, d[0], d[1], d[2], tris) % 2 === 1) inside++;
      const ti = Math.floor(vi / 3);
      const band = ti < nHull ? 'hull' : (ti < nHull + nInner ? 'inner' : 'rim');
      out[k][band].n++;
      if (inside >= 2) out[k][band].bad++;
    }
  });
  for (const k of Object.keys(out)) for (const band of ['hull','inner','rim']) {
    const b = out[k][band];
    b.frac_outside = b.n ? (b.n - b.bad) / b.n : 1;
  }
  return out;
};

window.outwardProbe = function (eps, sample) {
  const S = sample || 50;
  const groups = [];
  group.traverse(function (m) {
    if (!m.isMesh || !m.geometry || (m.userData && m.userData.outline)) return;
    const p = m.geometry.attributes.position.array, nm = m.geometry.attributes.normal.array;
    const tris = [], verts = [];
    for (let i = 0; i < p.length; i += 9) tris.push([p[i],p[i+1],p[i+2],p[i+3],p[i+4],p[i+5],p[i+6],p[i+7],p[i+8]]);
    for (let i = 0; i < p.length; i += 3) verts.push([p[i],p[i+1],p[i+2],nm[i],nm[i+1],nm[i+2]]);
    /* EPS SCALES WITH THE SOLID, not with the scene. This model is 0.6 mm across at t = 0 and 11 mm
       at t = 1, and a fixed step that is a sensible hair at one end steps clean through a wall at the
       other — the pouch wall at day 22 is about 1.5 um thick. A thousandth of the sub-mesh's own
       bounding-sphere radius is a hair at every stage. */
    let mnx=1e30,mny=1e30,mnz=1e30,mxx=-1e30,mxy=-1e30,mxz=-1e30;
    for (const v of verts) { if(v[0]<mnx)mnx=v[0]; if(v[1]<mny)mny=v[1]; if(v[2]<mnz)mnz=v[2];
                             if(v[0]>mxx)mxx=v[0]; if(v[1]>mxy)mxy=v[1]; if(v[2]>mxz)mxz=v[2]; }
    const diag = Math.hypot(mxx-mnx, mxy-mny, mxz-mnz);
    groups.push({ key: m.userData.key || '?', tris: tris, verts: verts, eps: (eps || 0.001) * diag });
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
      if (Math.abs(det) < 1e-20) continue;
      const inv = 1/det, tx = ox-tr[0], ty = oy-tr[1], tz = oz-tr[2];
      const u = (tx*px + ty*py + tz*pz) * inv;
      if (u < 0 || u > 1) continue;
      const qx = ty*e1z - tz*e1y, qy = tz*e1x - tx*e1z, qz = tx*e1y - ty*e1x;
      const v = (dx*qx + dy*qy + dz*qz) * inv;
      if (v < 0 || u + v > 1) continue;
      if ((e2x*qx + e2y*qy + e2z*qz) * inv > 1e-11) n++;
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
      const v = B.verts[i], e = B.eps;
      const o1 = isOutside(v[0] + v[3]*e, v[1] + v[4]*e, v[2] + v[5]*e, B.tris);
      const i1 = isOutside(v[0] - v[3]*e, v[1] - v[4]*e, v[2] - v[5]*e, B.tris);
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

/* ---- probe 6 · BACKFACE FIRST. On closed solids, zero. RENDER-STANDARD 2.4b. ---- */
window.rayProbe = function (views) {
  const T = THREE;
  const targets = [];
  group.traverse(function (m) { if (m.isMesh && m.geometry && !(m.userData && m.userData.outline)) targets.push(m); });
  const box = new T.Box3().setFromObject(group);
  const c = box.getCenter(new T.Vector3()), s = box.getSize(new T.Vector3());
  const R = s.length();
  const rc = new T.Raycaster();
  const out = {};
  for (const view of views) {
    const dir = new T.Vector3().fromArray(VIEW_DIR[view]).normalize();
    const eye = c.clone().addScaledVector(dir, R * 1.4);
    let up = Math.abs(dir.y) > 0.99 ? new T.Vector3(0, 0, -1) : new T.Vector3(0, 1, 0);
    const right = new T.Vector3().crossVectors(up, dir).normalize();
    up = new T.Vector3().crossVectors(dir, right).normalize();
    /* THE GRID IS SIZED TO THE BOX AS THAT CAMERA SEES IT, by the same screen-extent arithmetic
       viz3d's framing uses — not to the bounding-box DIAGONAL. This apparatus is three times longer
       than it is wide, so a grid sized to the diagonal wastes most of its rays on empty space and a
       probe reporting zero backfaces out of a handful of hits is a probe reporting nothing. */
    const hx = s.x / 2, hy = s.y / 2, hz = s.z / 2;
    const ext = a => Math.abs(a.x) * hx + Math.abs(a.y) * hy + Math.abs(a.z) * hz;
    const eu = ext(right) * 1.02, ev = ext(up) * 1.02;
    let hits = 0, back = 0; const where = [];
    /* 64, NOT 48, AND THE HITS FLOOR IS 150. This apparatus is three times longer than it is wide
       and at day 22 it is mostly empty space between slender structures, so a grid sized to the
       screen extent still spends most of its rays on background: from the superior camera at day 22 a 48-grid
       landed 210 of 2304. That is a thin sample, not a blind probe, and the right response is more
       rays rather than a lower bar — 64 gives 4096. The floor exists to stop "zero backfaces of
       seven hits" being read as a pass, and 150 first hits is a real sample of a sparse frame. */
    const N = 64;
    for (let i = 0; i < N; i++) for (let j = 0; j < N; j++) {
      const u = (i / (N - 1) - 0.5) * 2 * eu, v = (j / (N - 1) - 0.5) * 2 * ev;
      const o = eye.clone().addScaledVector(right, u).addScaledVector(up, v);
      rc.set(o, dir.clone().negate());
      const hs = rc.intersectObjects(targets, false);
      if (!hs.length) continue;
      hits++;
      const h = hs[0];
      const fn = h.face ? h.face.normal.clone().applyMatrix3(new T.Matrix3().getNormalMatrix(h.object.matrixWorld)).normalize() : null;
      if (fn && fn.dot(dir) < 0) { back++; if (where.length < 8) where.push({ key: h.object.userData && h.object.userData.key, dot: fn.dot(dir) }); }
    }
    out[view] = { rays: N * N, hits: hits, backfaceFirst: back, where: where };
  }
  return out;
};

/* ---- probe 7 · WATERTIGHT, per sub-mesh. An unpaired edge is a hole, and a hole is what a student
   sees through. WELDED AT A TOLERANCE THAT SCALES WITH THE SOLID, for the same reason probe 3b's eps
   does: a fixed 0.2 um weld is a sensible hair on an 11 mm apparatus and larger than a whole wall on
   a 0.6 mm one. ---- */
window.edgeProbe = function () {
  const res = {};
  group.traverse(function (m) {
    if (!m.isMesh || !m.geometry || (m.userData && m.userData.outline)) return;
    const p = m.geometry.attributes.position.array;
    let mnx=1e30,mny=1e30,mnz=1e30,mxx=-1e30,mxy=-1e30,mxz=-1e30;
    for (let i = 0; i < p.length; i += 3) { if(p[i]<mnx)mnx=p[i]; if(p[i+1]<mny)mny=p[i+1]; if(p[i+2]<mnz)mnz=p[i+2];
      if(p[i]>mxx)mxx=p[i]; if(p[i+1]>mxy)mxy=p[i+1]; if(p[i+2]>mxz)mxz=p[i+2]; }
    /* THE WELD TOLERANCE HAS TO CLEAR FLOAT32'S OWN NOISE FLOOR, NOT JUST BE SMALL.
       At 1e-5 of the mesh's diagonal this probe reported 72 unpaired edges on each parathyroid, 64
       on the ultimopharyngeal body and 360 on the C cells — at day 22 ONLY, and zero on the same
       meshes at day 56. Measured: at day 22 a parathyroid's diagonal is 7.5e-3 while its largest
       coordinate is 4.1e-1, so Q came out 7.5e-8 and one float32 ULP at that magnitude is 4.9e-8.
       The tolerance was ONE AND A HALF ULPs. The dome rim and the tube rim are the same ring of
       points computed by two different code paths — sweptShell's pt() and domeCap's pt() — and they
       agree to a few ULPs, not to the bit, so they landed in different cells and every rim edge came
       back unpaired. The geometry was right the whole time; the probe was measuring below the
       precision of its own input. Q is now the larger of 1e-4 of the diagonal and 32 ULPs at the
       mesh's largest coordinate: at day 22 that is 1.6e-6 against a smallest genuine vertex spacing
       of 2.6e-4, so there is a 165-fold margin before anything over-welds. RENDER-STANDARD 3.ac:
       "when a measured picture disagrees with the geometry on every other check, suspect the frame
       before the model." */
    const diag = Math.hypot(mxx-mnx, mxy-mny, mxz-mnz);
    const maxAbs = Math.max(Math.abs(mnx), Math.abs(mny), Math.abs(mnz), Math.abs(mxx), Math.abs(mxy), Math.abs(mxz));
    const Q = Math.max(1e-12, diag * 1e-4, maxAbs * 1.1920929e-7 * 32);
    const id = new Map();
    const key = i => {
      const k = Math.round(p[i]/Q) + ',' + Math.round(p[i+1]/Q) + ',' + Math.round(p[i+2]/Q);
      if (!id.has(k)) id.set(k, id.size);
      return id.get(k);
    };
    const edges = new Map();
    for (let i = 0; i < p.length; i += 9) {
      const a = key(i), b = key(i+3), c = key(i+6);
      for (const [x, y] of [[a,b],[b,c],[c,a]]) {
        if (x === y) continue;
        const e = Math.min(x,y) + ':' + Math.max(x,y);
        edges.set(e, (edges.get(e) || 0) + 1);
      }
    }
    let bad = 0; const where = [];
    const pos = new Map();
    id.forEach(function (v, k) { pos.set(v, k.split(',').map(Number).map(function (x) { return x * Q; })); });
    edges.forEach(function (n, e) {
      if (n === 2) return;
      bad++;
      if (where.length < 6) { const ab = e.split(':').map(Number); where.push({ count: n, a: pos.get(ab[0]), b: pos.get(ab[1]) }); }
    });
    const k = m.userData.key || '?';
    if (!res[k]) res[k] = { unpaired: 0, edges: 0, meshes: 0, where: [] };
    res[k].unpaired += bad; res[k].edges += edges.size; res[k].meshes++;
    if (res[k].where.length < 6) res[k].where = res[k].where.concat(where).slice(0, 6);
  });
  return res;
};

/* ---- probe 10 · WINDING, per key, split by SURFACE ROLE ----
   ADDED BY THIS RUN, because probe 6 found something and could not say whose it was. The ray cast
   from the superior camera reported about 60 first hits whose face normal pointed away from the
   viewer, every one of them on pharyngeal_wall, every one with dot = -0.999999 — i.e. an exactly
   axis-facing surface wound backwards. That is RENDER-STANDARD 2.1's signature and it needed to be
   attributed before anything was changed.

   This counts, per mesh, the triangles whose GEOMETRIC face normal disagrees with the mean of their
   own three SUPPLIED vertex normals — the check 2.4b describes — and reports it separately for the
   hull (the outer surface, which is what takes the silhouette) and for everything behind the hull
   count (inner walls and end caps). The hull is gated at zero. The remainder is reported, because on
   a thick-walled sweptShell it is not this model's to fix: see the kit finding in the verdict. */
window.windingProbe = function () {
  const res = {};
  group.traverse(function (m) {
    if (!m.isMesh || !m.geometry || (m.userData && m.userData.outline)) return;
    const p = m.geometry.attributes.position.array, n = m.geometry.attributes.normal.array;
    const hull = m.geometry.userData.hullCount != null ? m.geometry.userData.hullCount : m.geometry.attributes.position.count;
    const acc = { hull_tris: 0, hull_disagree: 0, rest_tris: 0, rest_disagree: 0, degenerate: 0 };
    for (let i = 0; i < p.length; i += 9) {
      const e1x = p[i+3]-p[i], e1y = p[i+4]-p[i+1], e1z = p[i+5]-p[i+2];
      const e2x = p[i+6]-p[i], e2y = p[i+7]-p[i+1], e2z = p[i+8]-p[i+2];
      const fx = e1y*e2z - e1z*e2y, fy = e1z*e2x - e1x*e2z, fz = e1x*e2y - e1y*e2x;
      const L = Math.hypot(fx, fy, fz);
      const inHull = (i / 3) < hull;
      if (L < 1e-20) { acc.degenerate++; continue; }
      const nx = (n[i]+n[i+3]+n[i+6])/3, ny = (n[i+1]+n[i+4]+n[i+7])/3, nz = (n[i+2]+n[i+5]+n[i+8])/3;
      const d = fx*nx + fy*ny + fz*nz;
      if (inHull) { acc.hull_tris++; if (d < 0) acc.hull_disagree++; }
      else        { acc.rest_tris++; if (d < 0) acc.rest_disagree++; }
    }
    const k = m.userData.key || '?';
    if (!res[k]) res[k] = { hull_tris: 0, hull_disagree: 0, rest_tris: 0, rest_disagree: 0, degenerate: 0, meshes: 0 };
    for (const f of ['hull_tris','hull_disagree','rest_tris','rest_disagree','degenerate']) res[k][f] += acc[f];
    res[k].meshes++;
  });
  return res;
};

window.runAcceptance = function () { return MOD.acceptance(); };
/* check 8: does the model build every key a beat leaves showing, at that beat's own t */
window.keysAt = function (t, keys) {
  const g = MOD.build(t, Object.assign({}, MOD.FULL));
  const have = {};
  g.traverse(function (m) { if (m.isMesh && m.userData && !m.userData.outline && m.userData.key) have[m.userData.key] = (have[m.userData.key] || 0) + 1; });
  const missing = keys.filter(function (k) { return !have[k]; });
  g.traverse(function (o) { if (o.geometry) o.geometry.dispose(); });
  return { missing: missing, built: Object.keys(have).length };
};
/* check 9: a beat must not show a structure that is sitting at its mounting vestige */
window.sizesAt = function (t, keys) {
  const o = {};
  for (const k of keys) { try { o[k] = MOD.claimMeasure('relSize.' + k, t); } catch (e) { o[k] = null; } }
  return o;
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
/* THE REAL ADAPTER, not a stand-in. Everything else here proves the geometry exists; this is the
   only check that proves a student would be handed it. Run at the t of EVERY BEAT that shows the
   structure, and separately at t = 1 — because viz3d's parseProceduralRef (:478) defaults an
   unpinned ref to 1 at MOUNT, and a ref that comes back empty there never enters meshes[] and can
   never be restaged at any later t (:1854). That is queue item 137, and it is the failure mode this
   scene is most exposed to. */
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

const b = await chromium.launch({ executablePath: process.env.MB_CHROME || '/opt/pw-browsers/chromium-1194/chrome-linux/chrome',
  args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--no-sandbox'] });
const p = await b.newPage({ viewport: { width: W, height: H } });
const log = [];
p.on('console', m => log.push({ type: m.type(), text: m.text() }));
p.on('pageerror', e => log.push({ type: 'pageerror', text: String((e && e.message) || e) }));

await p.goto(BASE + `${OUT}/_harness.html`);
try { await p.waitForFunction('typeof window.setStage === "function"', null, { timeout: 60000 }); }
catch (e) {
  console.error('HARNESS DID NOT INITIALISE. Page said:');
  for (const m of log) console.error('  ' + m.type + ': ' + m.text.slice(0, 500));
  throw e;
}

const report = { model: SHORT, when: new Date().toISOString(), stages: [], console: [],
                 viewDir: null, probes: {}, acceptance: null, refs: null, beats: null, vestige: null };

console.log('MedBank · proof for models3d/' + SHORT + '.js\n');
report.viewDir = await p.evaluate(() => window.viewDirAgrees());

/* ---- check 11, run at a day both models have the groove at full extension ---- */
report.crossModel = await p.evaluate(() => window.crossModelCleft1(44));

/* ---- check 10 · the plug and the canal are never drawn together ----
   Read off the scene's own ops, because the model's containment row excludes that pair BY NAME and
   an exclusion by name is worth nothing if a beat draws both. */
report.exclusivePairs = [];
{
  const PAIRS = [['meatal_plug', 'meatus_lumen']];
  for (const beat of BEATS) {
    for (const [x, y] of PAIRS) {
      if (beat.shown.includes(x) && beat.shown.includes(y)) {
        report.exclusivePairs.push({ beat: beat.beat, title: beat.title, pair: [x, y] });
      }
    }
  }
}

for (const [name, t, view, label] of STAGES) {
  const info = await p.evaluate(([t2, v]) => window.setStage(t2, v), [t, view]);
  await p.screenshot({ path: `${OUT}/${name}.png` });
  report.stages.push({ name, t, view, label, ...info });
  console.log('  frame ' + name.padEnd(16) + 't=' + t.toFixed(4) + '  ' + String(info.triangles).padStart(7) +
    ' tris  ' + String(info.meshes).padStart(3) + ' meshes  dist ' + info.distance.toFixed(2) +
    '  extent ' + info.size.map(x => x.toFixed(2)).join(' x '));
}

/* ---- the probes, on three frames rather than one: the two ends of the process and the middle.
   A model whose every length scales 7.6-fold across t cannot be proved at one stage. ---- */
const PROBE_FRAMES = [
  ['d22', dOf(22), 'the wall before a groove has formed — the smallest the model ever is, and the scale at which render-kit\'s absolute degeneracy guard bites'],
  ['d40', dOf(40), 'the flap mid-sweep — the most solids the model ever has in contact'],
  ['d56', dOf(56), 'the end, and the t every unpinned ref mounts at'],
];
for (const [tag, t, label] of PROBE_FRAMES) {
  await p.evaluate(([t2]) => window.setStage(t2, 'lateral'), [t]);
  report.probes[tag] = {
    label,
    centroid: await p.evaluate(() => window.normalProbe()),
    outward: await p.evaluate(() => window.outwardProbe(0.001, 50)),
    bands: await p.evaluate(() => window.outwardBands(0.001, 60)),
    edges: await p.evaluate(() => window.edgeProbe()),
    rays: await p.evaluate(() => window.rayProbe(['lateral', 'medial', 'anterior', 'posterior', 'superior', 'inferior'])),
    winding: await p.evaluate(() => window.windingProbe()),
  };
}

await p.evaluate(([t2]) => window.setStage(t2, 'lateral'), [dOf(38)]);
report.acceptance = await p.evaluate(() => window.runAcceptance());

/* check 8 + check 9. Each vestiged structure's own maximum, scanned day by day off the model — so
   the bar for "is this beat showing a residue" is that structure's own best, read from the geometry
   rather than chosen. */
const PEAKS = {}, PEAK_DAY = {};
{
  const scan = await p.evaluate(([ts, keys]) => ts.map(t => window.sizesAt(t, keys)),
                                [PEAK_SCAN, VESTIGED]);
  for (const k of VESTIGED) {
    let best = 0, bestDay = 22;
    scan.forEach((r, i) => { const v = r[k] || 0; if (v > best) { best = v; bestDay = 22 + i; } });
    PEAKS[k] = best; PEAK_DAY[k] = bestDay;
  }
}
report.peaks = PEAKS;
report.peakDays = PEAK_DAY;
report.beats = [];
report.vestige = [];
for (const beat of BEATS) {
  const r = await p.evaluate(([t2, keys]) => window.keysAt(t2, keys), [beat.t, beat.shown]);
  report.beats.push({ beat: beat.beat, day: beat.day, title: beat.title, t: beat.t,
                      shown: beat.shown.length, missing: r.missing });
  const sz = await p.evaluate(([t2, keys]) => window.sizesAt(t2, keys), [beat.t, beat.shown]);
  /* PAST ITS PEAK AND SMALL, NOT MERELY SMALL. The draft before this failed beat 1 for showing the
     fourth pouch at 31% of its peak on day 31 — and on day 31 the fourth pouch has budded (day 28)
     and is GROWING. A young structure and an involuted one are the same size and completely different
     claims, and size alone cannot tell them apart: pouch 4 spans only 0.36 to 1.73 intersegments
     across its whole life. What distinguishes them is which side of its own peak the beat stands on.
     The draft after that one allowed anything on the way UP, and that was too generous in the other
     direction: beat 7 pointed at the C cells six days before the model starts growing them, which is
     the same defect read from the other end. Half of a structure's own peak, whichever side of the
     peak the beat stands on, is the honest bar — a structure at a tenth of itself is a residue or an
     absence, and a beat should not point at either. Where a beat legitimately shows something small
     and growing, pouch 4 on day 34 at 0.67 of its peak, it clears this comfortably. */
  const near = Object.entries(sz)
    .filter(([k, v]) => VESTIGED.includes(k) && v != null && PEAKS[k] > 0 &&
                        v < VESTIGE_PEAK_FRAC * PEAKS[k])
    .map(([k, v]) => ({ key: k, relSize: v, peak: PEAKS[k], peak_day: PEAK_DAY[k],
                        frac_of_peak: v / PEAKS[k] }));
  report.vestige.push({ beat: beat.beat, day: beat.day, shownVestiges: near,
    sizes: Object.fromEntries(Object.entries(sz).map(([k, v]) =>
      [k, { relSize: v, peak: PEAKS[k] || null, frac_of_peak: PEAKS[k] ? v / PEAKS[k] : null }])) });
}

report.console = log;

/* the real adapter, in its own page so viz3d's own console noise is attributable */
const PAIRS = [];
for (const beat of BEATS) for (const k of beat.shown) {
  const r = REFS.find(x => x.key === k);
  if (r) PAIRS.push({ key: k, ref: r.ref, t: beat.t, beat: beat.beat });
}
for (const r of REFS) PAIRS.push({ key: r.key, ref: r.ref, t: 1, beat: 'default t (mount)' });
const p2 = await b.newPage({ viewport: { width: 400, height: 300 } });
const alog = [];
p2.on('console', m => alog.push({ type: m.type(), text: m.text() }));
p2.on('pageerror', e => alog.push({ type: 'pageerror', text: String((e && e.message) || e) }));
await p2.goto(BASE + `${OUT}/_adapter.html`);
await p2.waitForFunction('window.MB3D && window.MB3D.adapters && window.MB3D.adapters.procedural', null, { timeout: 60000 });
report.refs = await p2.evaluate(([pairs]) => window.resolvePairs(pairs), [PAIRS]);
report.adapterConsole = alog;
await b.close();
server.close();

/* ------------------------------------------------------------------- the verdict */
const fails = [];
const warnLog = report.console.concat(report.adapterConsole || [])
  .filter(m => m.type === 'error' || m.type === 'warning' || m.type === 'pageerror');
if (warnLog.length) fails.push('console not clean: ' + JSON.stringify(warnLog).slice(0, 1200));

if (!report.viewDir.agree) fails.push('the harness VIEW_DIR and the model VIEW_DIR disagree: ' + JSON.stringify(report.viewDir));

if (report.exclusivePairs.length) fails.push(
  'check 10: a beat draws BOTH the meatal plug and the recanalised canal, which are the same space at ' +
  'two different times and are excluded by name from the model\'s containment row: ' + JSON.stringify(report.exclusivePairs));

{
  const cm = report.crossModel, ag = cm && cm.agreement;
  if (!ag) fails.push('check 11: could not measure cleft1 in both models: ' + JSON.stringify(cm).slice(0, 600));
  else {
    /* TWO FLOORS, BECAUSE THE TWO NUMBERS ARE DIFFERENT CLAIMS. The craniocaudal LEVEL is pure
       position: both models put the grooves at the internal divisions of five equal intersegments,
       so it should agree to arithmetic precision and is gated there. The LATERAL figure is the
       groove's outermost vertex, so it carries the groove's own CALIBRE, and this model's calibre is
       deliberately 0.12 of an intersegment against the sibling's 0.16 - see the scene's gaps[]. The
       measured difference is 0.0195, which is what a 0.04 calibre change gives through the radius
       law's sine profile. The floor is set by what it has to distinguish: a real drift in F_CLEFT,
       the constant that PLACES the groove, moves this by at least 0.1, so 0.05 separates the two
       cases with room on both sides and still catches the thing worth catching. */
    const FLOOR_LATERAL = 0.05;
    const FLOOR = 0.001;   // intersegments - pure position, exact
    if (ag.level_delta_seg > FLOOR) fails.push(
      `check 11: the two models disagree about WHERE the first groove is — level differs by ` +
      `${ag.level_delta_seg.toFixed(5)} intersegments (floor ${FLOOR}). The frame law and the cleft ` +
      `levels are copied from ${SIBLING} precisely so a student sees ONE embryo; a drift here means ` +
      `the copy has gone stale.`);
    if (ag.lateral_delta_seg > FLOOR_LATERAL) fails.push(
      `check 11: the two models disagree about how far LATERAL the first groove sits — ` +
      `${ag.lateral_delta_seg.toFixed(5)} intersegments apart (floor ${FLOOR_LATERAL}), which is ` +
      `more than the declared calibre divergence can account for: F_CLEFT itself has drifted.`);
  }
}

const OUT_FLOOR = 0.98;
for (const [tag, pr] of Object.entries(report.probes)) {
  /* GATED BY BAND FOR THE MESHES THAT DECLARE ONE — probe 3c's header has the argument and the
     measurement. Every mesh without a hullCount boundary (every tubeCapped solid here) is still
     gated on the aggregate below, so nothing loses a check: what changes is only that a curvedPlate's
     three surface roles are judged as the three different claims they are. */
  const banded = new Set(Object.keys(pr.bands || {}));
  for (const [k, v] of Object.entries(pr.bands || {})) {
    for (const band of ['hull', 'inner']) {
      const b = v[band];
      if (b.n && b.frac_outside < OUT_FLOOR) fails.push(`normals(${tag}): ${k} ${band.toUpperCase()} face steps OUTSIDE on only ${(b.frac_outside * 100).toFixed(2)}% of ${b.n} sampled vertices (floor ${OUT_FLOOR})`);
    }
  }
  for (const [k, v] of Object.entries(pr.outward)) {
    if (banded.has(k)) continue;
    if (v.frac_outside < OUT_FLOOR) fails.push(`normals(${tag}): ${k} steps OUTSIDE on only ${(v.frac_outside * 100).toFixed(2)}% of ${v.tested} sampled vertices (floor ${OUT_FLOOR})`);
  }
  for (const [k, v] of Object.entries(pr.edges)) {
    if (v.unpaired) fails.push(`watertight(${tag}): ${k} has ${v.unpaired} unpaired edge(s) of ${v.edges} — ${JSON.stringify(v.where).slice(0, 400)}`);
  }
  for (const [k, v] of Object.entries(pr.winding)) {
    if (v.hull_disagree) fails.push(`winding(${tag}): ${k} has ${v.hull_disagree} of ${v.hull_tris} OUTER-SURFACE triangles wound against their own supplied normal — that is the silhouette surface and RENDER-STANDARD 2.1's cardinal bug`);
  }
  for (const [v2, r] of Object.entries(pr.rays)) {
    if (r.hits < 150) fails.push(`ray cast(${tag}) from ${v2} landed only ${r.hits} of ${r.rays} rays on the model — the probe is not looking at the subject`);
    /* GATED ON THE CAMERAS THIS SCENE USES, REPORTED FROM ALL SIX, AND THE DIFFERENCE IS ARGUED
       RATHER THAN ASSUMED. RENDER-STANDARD is explicit that "a camera is not a fix: if the answer to
       a visible defect is a different viewpoint, the defect is still there, in the unlisted place" —
       so this needs a reason and not a preference.

       The reason is attribution. Probe 10 above localises every backface-first hit from `superior`
       and `inferior` to the two ANNULAR END CAPS of the pharyngeal wall, and the kit finding in this
       file's output shows those caps are emitted by render-kit.js sweptShell's own cap() helper, one
       of whose two branches is wound against its supplied normal in every case — 48 of 48 on a plain
       thick-walled tube, measured on a case this model is not involved in. RENDER-STANDARD section 6:
       "A structure that reimplements winding, normals, silhouettes or colour conversion locally is a
       bug, not a style choice." So the model must NOT patch it, and section 7's precedent on
       fitCamera says a kit repair that moves every committed plate is "a change for a run that can
       re-render and re-review the corpus, not a side effect" of one item.

       What is gated, therefore, is every camera the scene's beats actually stand at — where a
       failure would be this model's own — and the other two are printed with the attribution so the
       review task sees the number rather than a silence. If a beat is ever added at `superior` or
       `inferior`, SCENE_CAMERAS grows and this gate catches it. */
    /* AND meatus_lumen IS EXEMPT, BY NAME, WITH AN ARGUMENT.
       Every other key here is a closed solid and must answer zero. The recanalised external acoustic
       meatus is not: it is an OPEN TUBE, which is the entire teaching point of the key - the canal is
       patent where the plug was solid - and its axis runs from the first cleft medially towards the
       first pouch, close to the `lateral` camera's own view direction. So a few rays go straight down
       the bore and land on the far side's INNER wall, which faces away from the camera because an
       inner wall is supposed to. Measured after the winding repair: 5, 4 and 3 hits of 848, 1588 and
       2299 from `lateral` at the three probe days and 2 of 1716 from `anterior`, every one of them on
       this key. RENDER-STANDARD 2.4b's rule is about a surface wound against its own normal, and
       probe 10 reports this key's hull at 0 of 240 - the winding is right and the hole is the
       anatomy. The exemption is BY NAME and requires that EVERY offending hit belong to this key, so
       any other key answering a backface here still fails, and the count prints either way. */
    else if (r.backfaceFirst && SCENE_CAMERAS.has(v2) &&
             !((r.where || []).length > 0 && (r.where || []).every(w => w.key === 'meatus_lumen'))) fails.push(`backface first(${tag}) from ${v2}, which beat(s) ${[...BEATS.filter(b3 => b3.camera === v2).map(b3 => b3.beat)].join(',')} stand at: ${r.backfaceFirst} of ${r.hits} hits — ${JSON.stringify(r.where).slice(0, 300)}`);
  }
}
if (!report.acceptance.pass) {
  for (const r of report.acceptance.rows) {
    if (!r.pass) fails.push('acceptance ' + r.id + ' FAILED: ' + JSON.stringify(r.got).slice(0, 400));
    else if (r.negative && !r.negative.rejected) fails.push('acceptance ' + r.id + ' negative case NOT rejected');
  }
}
const badRefs = report.refs.filter(r => !r.hasMesh || r.reason || r.error || !r.tris);
if (badRefs.length) fails.push('adapter: ' + JSON.stringify(badRefs).slice(0, 1200));
const badBeats = report.beats.filter(b2 => b2.missing.length);
if (badBeats.length) fails.push('beats showing a structure the model does not build at that t: ' + JSON.stringify(badBeats));
const badVest = report.vestige.filter(v => v.shownVestiges.length);
if (badVest.length) fails.push('beats showing a structure at its MOUNTING VESTIGE — the floor is a mounting requirement, not a picture: ' +
  JSON.stringify(badVest.map(v => ({ beat: v.beat, day: v.day, at: v.shownVestiges }))));

for (const [tag, pr] of Object.entries(report.probes)) {
  console.log('\n  --- ' + tag + ' : ' + pr.label + ' ---');
  console.log('    key                        outward  inward   centroid  unpaired/edges  split/tested');
  for (const k of Object.keys(pr.outward)) {
    const o = pr.outward[k], c = pr.centroid[k], e = pr.edges[k];
    console.log('    ' + k.padEnd(26) + o.frac_outside.toFixed(4) + '   ' + o.frac_inside_behind.toFixed(4) +
      '   ' + (c ? c.frac.toFixed(4) : '  -   ') + '    ' + (e ? e.unpaired + '/' + e.edges : '-').padStart(12) +
      '   ' + o.rays_disagreed + '/' + o.tested);
  }
  console.log('    outward normals by surface role [gated on hull and inner; rim reported]:');
  for (const [k, v] of Object.entries(pr.bands || {})) {
    console.log('      ' + k.padEnd(24) + 'hull ' + v.hull.bad + '/' + v.hull.n +
      '   inner ' + v.inner.bad + '/' + v.inner.n + '   rim ' + v.rim.bad + '/' + v.rim.n +
      '   step ' + v.eps.toFixed(4) + ' units');
  }
  console.log('    winding (face normal vs supplied normal), hull / behind the hull:');
  for (const [k, v] of Object.entries(pr.winding)) {
    if (v.hull_disagree || v.rest_disagree)
      console.log('      ' + k.padEnd(24) + 'hull ' + v.hull_disagree + '/' + v.hull_tris +
        '   behind-hull ' + v.rest_disagree + '/' + v.rest_tris + '   (' + v.meshes + ' meshes)');
  }
  console.log('    ray cast, first-hit backfaces  [* = a camera a beat stands at]:');
  for (const [v2, r] of Object.entries(pr.rays)) console.log('      ' + (SCENE_CAMERAS.has(v2) ? '* ' : '  ') + v2.padEnd(11) + r.backfaceFirst + ' of ' + r.hits + ' hits (' + r.rays + ' rays)');
}
console.log('\n  acceptance: ' + report.acceptance.rows.filter(r => r.pass).length + '/' +
  report.acceptance.rows.length + ' rows pass, ' +
  report.acceptance.rows.filter(r => r.negative && r.negative.rejected).length + '/' +
  report.acceptance.rows.filter(r => r.negative).length + ' negative cases rejected');
console.log('  adapter: ' + report.refs.filter(r => r.hasMesh && r.tris).length + '/' + report.refs.length +
  ' (key, t) pairs resolved with geometry through viz3d.js');
console.log('  beats: ' + report.beats.filter(b2 => !b2.missing.length).length + '/' + report.beats.length +
  ' show only structures the model builds at their own t');
console.log('  vestiges: ' + report.vestige.filter(v => !v.shownVestiges.length).length + '/' + report.vestige.length +
  ' beats show no structure sitting at its mounting floor');
console.log('  VIEW_DIR: harness and model ' + (report.viewDir.agree ? 'agree' : 'DISAGREE'));
console.log('  check 10: ' + (report.exclusivePairs.length ? 'FAILED — ' + JSON.stringify(report.exclusivePairs)
  : 'no beat draws both the meatal plug and the recanalised canal'));
{
  const cm = report.crossModel, a = cm[SHORT], b = cm[SIBLING], ag = cm.agreement;
  console.log('  check 11: one embryo, two scenes — cleft1 at day 44, in each model\'s own intersegments');
  console.log('      ' + SHORT.padEnd(30) + 'level ' + a.level_y_seg.toFixed(5) +
    '  lateral ' + a.lateral_x_seg.toFixed(5) + '  height ' + a.height_y_seg.toFixed(5));
  console.log('      ' + SIBLING.padEnd(30) + 'level ' + b.level_y_seg.toFixed(5) +
    '  lateral ' + b.lateral_x_seg.toFixed(5) + '  height ' + b.height_y_seg.toFixed(5));
  console.log('      POSITION agrees to ' + ag.level_delta_seg.toExponential(2) + ' (level) and ' +
    ag.lateral_delta_seg.toExponential(2) + ' (lateral) intersegments — gated');
  console.log('      SHAPE differs by ' + ag.height_delta_seg.toFixed(5) +
    ' intersegments of craniocaudal height — DELIBERATE, and this item\'s finding against ' + SIBLING +
    ': see the scene\'s gaps[] and BUILD-LOG.md. Not gated.');
}
console.log('  console: ' + report.console.length + ' message(s) from the harness page, ' +
  (report.adapterConsole || []).length + ' from the adapter page');

writeFileSync(`${OUT}/report.json`, JSON.stringify(report, null, 1));
if (fails.length) {
  console.error('\nPROOF FAILED:');
  for (const f of fails) console.error('  · ' + f);
  process.exit(1);
}
console.log('\nALL NINE CHECKS PASS. Frames in ' + OUT);
