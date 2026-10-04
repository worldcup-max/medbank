/* MedBank · headless proof for models3d/bilaminar-embryonic-disc.js
 *
 * Built on the shape of tools/render-cardiac-looping.mjs, which is the reference harness.
 * Five things, all of which must pass before the item is marked built:
 *   1. it renders — several t, screenshots to viz-training/models-out/bilaminar-embryonic-disc/
 *   2. the console is clean — no error, no warning, no throw
 *   3. normals point outward — per mesh, counted against that mesh's own centroid, hull separately
 *   4. the acceptance battery passes AND every negative case rejects
 *   5. every ref in the scene resolves THROUGH THE REAL ADAPTER in viz3d.js, with geometry
 *
 * Plus the two probes this model needs that the four above cannot see:
 *   6. NO OPEN LUMEN / BACKFACE FIRST. A grid of rays from each camera; for each, whether the FIRST
 *      surface met faces AWAY from the camera. revolve() decides which way is out from the profile's
 *      shoelace sign rather than from a comment, and this is the measurement that says whether that
 *      actually worked — RENDER-STANDARD 2.4b's ray-cast, the probe that caught the winding bug.
 *   7. THE DISC SURVIVES ITS OWN VIEW. The disc is two sheets 0.35 units thick inside a conceptus
 *      9.2 units across at t=1, so the beats that are ABOUT the disc must not be drawn with the
 *      trophoblast on. Rendered with and without each shell and the visible pixels differenced.
 *
 * WHERE THIS RUNS. In a Linux container with chromium, against a copy of the repo — not on the
 * mounted repo itself, which has no browser and no playwright. The files under test are byte
 * identical; the substrate for the RENDER is not the mount, and saying so is the point.
 *
 * Run from the repo root:  node viz-training/tools/render-bilaminar-embryonic-disc.mjs
 */
import { chromium } from 'playwright';
import { readFileSync, writeFileSync, mkdirSync } from 'fs';
import http from 'http';
import path from 'path';
import fs from 'fs';

const ROOT = process.cwd();
const SHORT = 'bilaminar-embryonic-disc';
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

const W = 1000, H = 1000;
const DISC_ONLY = { trophoblast: false, mesoderm: false, yolk: true, amnion: true, cavities: true };
const STAGES = [
  ['t000-day8',       0.0000, { trophoblast: false }, 'day 8 — two sheets, the amniotic cavity still a slit'],
  ['t017-day9',       1 / 6,  { trophoblast: false }, "day 9 — Heuser's membrane and the primary yolk sac"],
  ['t050-day11',      0.5000, { trophoblast: false }, 'day 11 — extraembryonic mesoderm fills the gap'],
  ['t067-day12',      2 / 3,  { trophoblast: false }, 'day 12 — the cavity has opened, the second sac pinches off'],
  ['t083-day13',      5 / 6,  { trophoblast: false }, 'day 13 — secondary sac, cysts, the stalk'],
  ['t100-day14',      1.0000, { trophoblast: false }, 'day 14 — the prechordal plate marks the cranial end'],
  ['t100-whole',      1.0000, {},                    'day 14, the whole conceptus including the trophoblast'],
  ['t050-whole',      0.5000, {},                    'day 11, the whole conceptus'],
  ['t000-disc',       0.0000, DISC_ONLY,             'day 8 — the disc alone'],
  ['t100-disc',       1.0000, DISC_ONLY,             'day 14 — the disc alone, with the prechordal plate'],
  ['t100-disconly',   1.0000, { trophoblast: false, mesoderm: false, yolk: false, cavities: false, amnion: false },
                                                     'day 14 — the two sheets and the plate, nothing else'],
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
const L = VizKit.standardLights(scene);
const camera = new THREE.PerspectiveCamera(32, ${W}/${H}, 0.1, 400);
let group = null;
const MOD = window.MB3D_MODELS['${SHORT}'];

/* THE CAMERA THIS MODEL IS LOOKED AT FROM. viz3d's VIEW_DIR puts 'lateral' at +x, and this model
   declares x as the disc's left/right axis — which is the axis a MEDIAN SECTION is cut normal to.
   So the lateral camera is the one that shows the two sheets stacked, and it is the default here.
   The table is COPIED from viz3d.js rather than restated, per RENDER-STANDARD 3.y, so the player's
   cameras and the probe's cannot drift apart. */
const VIEW_DIR = {
  anterior: [0, 0, 1], posterior: [0, 0, -1], lateral: [1, 0, 0], medial: [-1, 0, 0],
  superior: [0, 1, 0.001], inferior: [0, -1, 0.001]
};
window.VIEW_DIR = VIEW_DIR;

window.setStage = function (t, opts, view) {
  if (group) scene.remove(group);
  group = MOD.build(t, Object.assign({}, MOD.FULL, opts || {}));
  group.updateMatrixWorld(true);
  scene.add(group);
  const f = VizKit.fitCamera(camera, group, 1.06);
  const d = new THREE.Vector3().fromArray(VIEW_DIR[view || 'lateral']).normalize();
  camera.position.copy(f.centre).add(d.multiplyScalar(f.distance));
  camera.up.set(0, 1, 0);
  camera.lookAt(f.centre);
  L.key.position.set(camera.position.x + 6, camera.position.y + 8, camera.position.z + 4);
  renderer.render(scene, camera);
  return { centre: f.centre.toArray(), distance: f.distance, size: f.size.toArray() };
};

/* OUTWARD NORMALS. Per mesh, against that mesh's OWN centroid, in world space. revolve() emits all
   outer surface, so hullCount is the whole buffer and the two figures should agree — a disagreement
   is itself a finding. A thin SHELL read at its own centroid is the case to be careful with: a
   spherical shell's inner surface points at the centroid by construction, so a whole-buffer count on
   one lands near 0.5 and says nothing about winding. Winding-vs-supplied-normal is the figure that
   does not have that weakness, and it is reported for every mesh. */
window.normalProbe = function (t, opts) {
  const g = MOD.build(t, Object.assign({}, MOD.FULL, opts || {}));
  g.updateMatrixWorld(true);
  const rows = [];
  const nm = new THREE.Matrix3();
  g.traverse(function (o) {
    if (!o.isMesh || !o.geometry) return;
    const u = o.userData || {};
    if (u.outline) return;
    const geo = o.geometry.index ? o.geometry.toNonIndexed() : o.geometry;
    const p = geo.attributes.position, n = geo.attributes.normal;
    if (!n) return;
    const hull = (o.geometry.userData && o.geometry.userData.hullCount) || 0;
    nm.getNormalMatrix(o.matrixWorld);
    const c = new THREE.Vector3(), v = new THREE.Vector3(), w = new THREE.Vector3();
    for (let i = 0; i < p.count; i++) c.add(v.fromBufferAttribute(p, i).applyMatrix4(o.matrixWorld));
    c.divideScalar(p.count);
    let out = 0, outHull = 0;
    for (let i = 0; i < p.count; i++) {
      v.fromBufferAttribute(p, i).applyMatrix4(o.matrixWorld).sub(c);
      w.fromBufferAttribute(n, i).applyMatrix3(nm).normalize();
      if (v.dot(w) > 0) { out++; if (i < hull) outHull++; }
    }
    let agree = 0, tris = 0;
    const a1 = new THREE.Vector3(), b1 = new THREE.Vector3(), c1 = new THREE.Vector3();
    const e1 = new THREE.Vector3(), e2 = new THREE.Vector3(), fn = new THREE.Vector3(), vn = new THREE.Vector3();
    for (let i = 0; i + 2 < p.count; i += 3) {
      a1.fromBufferAttribute(p, i); b1.fromBufferAttribute(p, i+1); c1.fromBufferAttribute(p, i+2);
      fn.copy(e1.subVectors(b1, a1).cross(e2.subVectors(c1, a1)));
      if (fn.lengthSq() < 1e-16) continue;
      fn.normalize();
      vn.set(0,0,0);
      for (let k = 0; k < 3; k++) { const q = new THREE.Vector3().fromBufferAttribute(n, i+k); vn.add(q); }
      if (vn.lengthSq() < 1e-16) continue;
      vn.normalize(); tris++; if (fn.dot(vn) > 0) agree++;
    }
    rows.push({ key: u.key, verts: p.count, outward: out / p.count,
                hullVerts: hull, outwardHull: hull ? outHull / hull : null,
                tris: tris, winding: tris ? agree / tris : null,
                volume: MOD.volumeOf(geo) });
  });
  return rows;
};

/* BACKFACE FIRST — the ray-cast of RENDER-STANDARD 2.4b. Closed solids only; the membranes and the
   cavity casts are genuinely two-sided or genuinely seen from inside, and are excluded BY KEY rather
   than by guesswork. */
const SOLID_KEYS = { epiblast:1, hypoblast:1, prechordal_plate:1, connecting_stalk:1,
                     exocoelomic_cysts:1, somatic_mesoderm:1, splanchnic_mesoderm:1,
                     extraembryonic_mesoderm:1, amnion:1, heuser:1 };
window.lumenProbe = function (grid) {
  const G = grid || 96;
  const rc = new THREE.Raycaster();
  const targets = [];
  group.traverse(function (o) {
    if (!o.isMesh || !o.geometry) return;
    const u = o.userData || {};
    if (u.outline || !SOLID_KEYS[u.key]) return;
    targets.push(o);
  });
  const nm = new THREE.Matrix3();
  const a1 = new THREE.Vector3(), b1 = new THREE.Vector3(), c1 = new THREE.Vector3();
  const e1 = new THREE.Vector3(), e2 = new THREE.Vector3(), fn = new THREE.Vector3();
  let hits = 0, back = 0; const offenders = {};
  for (let iy = 0; iy < G; iy++) for (let ix = 0; ix < G; ix++) {
    const ndc = new THREE.Vector2((ix + 0.5) / G * 2 - 1, 1 - (iy + 0.5) / G * 2);
    rc.setFromCamera(ndc, camera);
    const hit = rc.intersectObjects(targets, false)[0];
    if (!hit) continue;
    hits++;
    const p = hit.object.geometry.attributes.position, f = hit.face;
    a1.fromBufferAttribute(p, f.a); b1.fromBufferAttribute(p, f.b); c1.fromBufferAttribute(p, f.c);
    fn.copy(e1.subVectors(b1, a1).cross(e2.subVectors(c1, a1)));
    if (fn.lengthSq() < 1e-16) continue;
    nm.getNormalMatrix(hit.object.matrixWorld);
    fn.normalize().applyMatrix3(nm).normalize();
    if (fn.dot(rc.ray.direction) > 0.02) {
      back++;
      const k = hit.object.userData.key;
      offenders[k] = (offenders[k] || 0) + 1;
    }
  }
  return { rays: G * G, hits, backfaceFirst: back, frac: hits ? back / hits : 0, offenders };
};

function readPixels() {
  const gl = renderer.getContext();
  const w = renderer.domElement.width, h = renderer.domElement.height;
  const buf = new Uint8Array(w * h * 4);
  gl.readPixels(0, 0, w, h, gl.RGBA, gl.UNSIGNED_BYTE, buf);
  return buf;
}

/* HOW MUCH OF THE FRAME ONE KEY IS RESPONSIBLE FOR, with and without it, from the same camera and
   WITHOUT refitting between the two — a refit between the frames would move everything and the
   difference would measure the camera, not the structure. */
window.keyPixels = function (t, opts, view, dropKey) {
  window.setStage(t, opts, view);
  const camPos = camera.position.clone(), camQ = camera.quaternion.clone();
  const nearF = camera.near, farF = camera.far;
  const withPix = readPixels();
  if (group) scene.remove(group);
  const g2 = MOD.build(t, Object.assign({}, MOD.FULL, opts || {}));
  g2.traverse(function (o) { if (o.isMesh && o.userData && o.userData.key === dropKey) o.visible = false; });
  group = g2; scene.add(g2);
  camera.position.copy(camPos); camera.quaternion.copy(camQ);
  camera.near = nearF; camera.far = farF; camera.updateProjectionMatrix();
  renderer.render(scene, camera);
  const withoutPix = readPixels();
  let diff = 0, lit = 0;
  for (let i = 0; i < withPix.length; i += 4) {
    const d = Math.abs(withPix[i] - withoutPix[i]) + Math.abs(withPix[i+1] - withoutPix[i+1]) +
              Math.abs(withPix[i+2] - withoutPix[i+2]);
    if (d > 40) diff++;                                  // the tool's own "clearly visible" floor
    if (withPix[i] + withPix[i+1] + withPix[i+2] > 90) lit++;
  }
  const total = withPix.length / 4;
  return { key: dropKey, visiblePixels: diff, fracOfFrame: diff / total,
           fracOfSubject: lit ? diff / lit : 0 };
};

/* ---------------------------------------------------------------- HIGHLIGHT DELTA
   REVIEW ROUND 1, FINDING 4, implemented here rather than in the shared walk. The finding is that
   measure-scene-visibility passed beat 10 by crediting amniotic_cavity as "seen through translucent
   material" (alpha-aware 11.065%, peak 140) while its id-pick share was 0.036% — and that "some of
   this structure's colour reaches the camera" is the wrong question for a beat that HIGHLIGHTS the
   structure. The right question is the one a student would ask: does the highlight change the
   picture. So this renders the beat composed THE WAY THE PLAYER COMPOSES IT, twice, with and without
   that beat's own HIGHLIGHT_STRUCTURE applied, and counts the pixels that move.

   WHY IT IS HERE AND NOT IN measure-scene-visibility.mjs. That tool runs on all 146 scenes and exits
   non-zero. Adding an assertion to it would re-grade every other item in the corpus in a run that
   was asked to fix one, which is the "silent re-grading of another item's verdict" its own header
   warns about. The rule belongs there and the review should put it there; what a build run can
   honestly do is prove ITS OWN scene against the rule. Reported per beat, and asserted by row S.

   THE HIGHLIGHT IS COPIED FROM viz3d.js:2402-2434, not approximated: isHi sets
   material.emissive to the structure's own colour and material.emissiveIntensity to the op's
   intensity, and a highlighted structure is held at its authored opacity rather than ghosted. */
window.beatHighlight = function (spec) {
  /* spec: { t, visible:[key], hi:{key:intensity}, dir, structures:{key:{color,opacity}} } */
  if (group) scene.remove(group);
  const g = MOD.build(spec.t, Object.assign({}, MOD.FULL));
  group = g; scene.add(g);
  const touched = [];
  g.traverse(function (o) {
    if (!o.isMesh || !o.userData) return;
    const k = o.userData.key;
    if (o.userData.outline) { o.visible = false; return; }   // silhouettes are presentation
    const vis = spec.visible.indexOf(k) >= 0;
    o.visible = vis;
    if (!vis) return;
    const st = spec.structures[k] || {};
    const op = (typeof st.opacity === 'number') ? Math.max(0.02, Math.min(1, st.opacity)) : 1;
    o.material.transparent = op < 1;
    o.material.opacity = op;
    o.material.depthWrite = op >= 0.98;
    touched.push(o);
  });
  /* frame it on the visible set, which is what viz3d's subjectBox does */
  const box = new THREE.Box3();
  touched.forEach(function (o) { box.expandByObject(o); });
  if (box.isEmpty()) return { error: 'nothing visible' };
  const ctr = box.getCenter(new THREE.Vector3()), size = box.getSize(new THREE.Vector3());
  const d = VIEW_DIR[spec.dir || 'lateral'] || VIEW_DIR.lateral;
  const dir = new THREE.Vector3(d[0], d[1], d[2]).normalize();
  const radius = Math.max(size.x, size.y, size.z) * 0.5 || 1;
  const dist = radius / Math.tan(camera.fov * Math.PI / 360) * 1.35 + radius;
  camera.position.copy(ctr).addScaledVector(dir, dist);
  camera.up.set(0, 1, 0);
  camera.lookAt(ctr);
  camera.near = Math.max(0.01, dist - radius * 4); camera.far = dist + radius * 6;
  camera.updateProjectionMatrix();

  /* frame A — no highlight anywhere */
  touched.forEach(function (o) {
    o.material.emissive.setHex(0x000000); o.material.emissiveIntensity = 0; o.material.needsUpdate = true;
  });
  renderer.render(scene, camera);
  const A = readPixels();

  /* frame B — this beat's own highlight, exactly as viz3d applies it */
  touched.forEach(function (o) {
    const k = o.userData.key;
    const inten = spec.hi[k];
    if (inten == null) return;
    const col = (spec.structures[k] && spec.structures[k].color) || '#7c5cff';
    o.material.emissive.copy(VizKit.C(col));
    o.material.emissiveIntensity = inten;
    o.material.needsUpdate = true;
  });
  renderer.render(scene, camera);
  const B = readPixels();

  let moved = 0, lit = 0;
  for (let i = 0; i < A.length; i += 4) {
    const dd = Math.abs(A[i] - B[i]) + Math.abs(A[i+1] - B[i+1]) + Math.abs(A[i+2] - B[i+2]);
    if (dd > 40) moved++;                                  // the same "clearly visible" floor
    if (A[i] + A[i+1] + A[i+2] > 90) lit++;
  }
  const total = A.length / 4;
  return { moved: moved, fracOfFrame: moved / total, fracOfSubject: lit ? moved / lit : 0,
           subjectPixels: lit, highlighted: Object.keys(spec.hi) };
};

window.acceptance = function () { return MOD.acceptance(); };
window.boxes = function (t, o) { return MOD.boxes(t, o); };
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
<\/script>`;
writeFileSync(`${OUT}/_adapter.html`, adapterHtml);

const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium-1194/chrome-linux/chrome',
  args: ['--use-gl=swiftshader', '--enable-unsafe-swiftshader', '--no-sandbox'] });
const p = await b.newPage({ viewport: { width: W, height: H } });
const log = [];
p.on('console', m => log.push({ type: m.type(), text: m.text() }));
p.on('pageerror', e => log.push({ type: 'pageerror', text: String(e && e.message || e) }));

await p.goto(BASE + `${OUT}/_harness.html`);
try { await p.waitForFunction('typeof window.setStage === "function"', null, { timeout: 20000 }); }
catch (e) {
  console.error('HARNESS DID NOT INITIALISE. Page said:');
  for (const m of log) console.error('  ' + m.type + ': ' + m.text.slice(0, 500));
  throw e;
}

const report = { model: SHORT, stages: [], console: [], normals: null, acceptance: null, refs: null };

for (const [name, t, opts, label] of STAGES) {
  const fit = await p.evaluate(([t2, o]) => window.setStage(t2, o, 'lateral'), [t, opts]);
  await p.locator('#c').screenshot({ path: `${OUT}/${name}.png` });
  report.stages.push({ name, t, opts, label, view: 'lateral', fit, file: `${OUT}/${name}.png` });
}
/* and one from each of the other cameras at t=1, because "the subject fills the frame at every t"
   is not the same statement as "from every camera" */
for (const view of ['anterior', 'superior', 'inferior']) {
  await p.evaluate(([v]) => window.setStage(1, { trophoblast: false }, v), [view]);
  await p.locator('#c').screenshot({ path: `${OUT}/t100-${view}.png` });
  report.stages.push({ name: 't100-' + view, t: 1, opts: { trophoblast: false }, view, label: 'day 14 from ' + view });
}

report.acceptance = await p.evaluate('window.acceptance()');
report.normals = await p.evaluate('window.normalProbe(1, {})');
report.normals_day11 = await p.evaluate('window.normalProbe(0.5, {})');
report.normals_day8 = await p.evaluate('window.normalProbe(0, {})');

report.lumen = [];
for (const [nm2, t2, view, opts] of [
  ['lateral day 8',  0.0,    'lateral',  { trophoblast: false }],
  ['lateral day 11', 0.5,    'lateral',  { trophoblast: false }],
  ['lateral day 14', 1.0,    'lateral',  { trophoblast: false }],
  ['anterior day 14',1.0,    'anterior', { trophoblast: false }],
  ['superior day 14',1.0,    'superior', { trophoblast: false }],
  ['inferior day 14',1.0,    'inferior', { trophoblast: false }],
  ['lateral disc only', 1.0, 'lateral',  { trophoblast: false, mesoderm: false, yolk: false }],
]) {
  await p.evaluate(([t3, o, v]) => window.setStage(t3, o, v), [t2, opts, view]);
  const r2 = await p.evaluate('window.lumenProbe(96)');
  report.lumen.push(Object.assign({ camera: nm2, t: t2, view }, r2));
}

/* 7 — the disc has to survive the view it is the subject of */
report.pixels = [];
for (const [nm2, t2, opts, view, key] of [
  ['epiblast, disc beat',          1.0, { trophoblast: false, mesoderm: false, yolk: false }, 'lateral', 'epiblast'],
  ['hypoblast, disc beat',         1.0, { trophoblast: false, mesoderm: false, yolk: false }, 'lateral', 'hypoblast'],
  ['prechordal_plate, disc beat',  1.0, { trophoblast: false, mesoderm: false, yolk: false }, 'lateral', 'prechordal_plate'],
  ['epiblast, whole conceptus',    1.0, {},                                                   'lateral', 'epiblast'],
  ['hypoblast, whole conceptus',   1.0, {},                                                   'lateral', 'hypoblast'],
  ['connecting_stalk, day 14',     1.0, { trophoblast: false },                               'lateral', 'connecting_stalk'],
  ['secondary_yolk_sac, day 14',   1.0, { trophoblast: false },                               'lateral', 'secondary_yolk_sac'],
  ['amniotic_cavity, day 14',      1.0, { trophoblast: false },                               'lateral', 'amniotic_cavity'],
  ['primary_yolk_sac, day 9',      1/6, { trophoblast: false },                               'lateral', 'primary_yolk_sac'],
  ['extraembryonic_mesoderm, d11', 0.5, { trophoblast: false },                               'lateral', 'extraembryonic_mesoderm'],
  ['chorionic_cavity, day 14',     1.0, { trophoblast: false },                               'lateral', 'chorionic_cavity'],
]) {
  const r2 = await p.evaluate(([t3, o, v, k]) => window.keyPixels(t3, o, v, k), [t2, opts, view, key]);
  report.pixels.push(Object.assign({ label: nm2, t: t2, view, opts }, r2));
}

report.console = log.slice();

/* ---- the real adapter ---- */
const p2 = await b.newPage();
const log2 = [];
p2.on('console', m => log2.push({ type: m.type(), text: m.text() }));
p2.on('pageerror', e => log2.push({ type: 'pageerror', text: String(e && e.message || e) }));
await p2.goto(BASE + `${OUT}/_adapter.html`);
await p2.waitForFunction('typeof window.resolveAll === "function"', null, { timeout: 20000 });
report.refs = await p2.evaluate(r => window.resolveAll(r), REFS);

/* EVERY REF, AT THE t THE PLAYER WILL ACTUALLY BUILD IT AT. The bare walk above resolves at the
   adapter's default t = 1, and on a STAGED scene that is the wrong question: the primary yolk sac and
   the single undivided extraembryonic mesoderm do not exist on day 14, so both came back
   reason:'none' — "the corpus has no model of this structure" — on a first run of this harness. They
   are not missing; they are over. What the player does is apply the first view's ops, SET_STAGE
   included, so what has to resolve is each structure a beat SHOWS, at THAT BEAT'S t. That is the walk
   below, and it is strictly stronger than the default-t one, which is kept and reported beside it. */
const groupsOf = {};
for (const st of scene.structures) (groupsOf[st.group] = groupsOf[st.group] || []).push(st.key);
const allKeys = scene.structures.map(st => st.key);
const keysFor = tg => (tg === '*' || tg == null) ? allKeys : (groupsOf[tg] ? groupsOf[tg] : [tg]);
report.refsPerBeat = [];
for (const v of scene.views) {
  const st = (v.ops || []).find(o => o.op === 'SET_STAGE');
  if (!st) continue;
  const vis = {}; for (const k of allKeys) vis[k] = true;
  for (const o of v.ops) {
    if (o.op === 'SHOW_STRUCTURE') keysFor(o.target).forEach(k => { vis[k] = true; });
    else if (o.op === 'HIDE_STRUCTURE') keysFor(o.target).forEach(k => { vis[k] = false; });
    else if (o.op === 'ISOLATE_REGION') { const keep = new Set(keysFor(o.target));
      Object.keys(vis).forEach(k => { vis[k] = keep.has(k); }); }
  }
  const shown = allKeys.filter(k => vis[k]);
  const refs = shown.map(k => ({ key: k, ref: 'bilaminar-embryonic-disc#' + k + '@' + st.t }));
  const res = await p2.evaluate(r => window.resolveAll(r), refs);
  report.refsPerBeat.push({ beat: v.beat, t: st.t, shown: shown.length, refs: res });
}
report.adapterConsole = log2;

/* ---- HIGHLIGHT DELTA, per beat: review round 1 finding 4's rule, on this scene ---- */
const STRUCT = {};
for (const st of scene.structures) STRUCT[st.key] = { color: st.color, opacity: st.opacity };
report.highlight = [];
for (let i = 0; i < scene.views.length; i++) {
  const v = scene.views[i];
  const sst = (v.ops || []).find(o => o.op === 'SET_STAGE');
  if (!sst) continue;
  const vis = {}; for (const k of allKeys) vis[k] = true;
  const hi = {}; let dir = 'lateral';
  for (const o of v.ops) {
    if (o.op === 'SHOW_STRUCTURE') keysFor(o.target).forEach(k => { vis[k] = true; });
    else if (o.op === 'HIDE_STRUCTURE') keysFor(o.target).forEach(k => { vis[k] = false; });
    else if (o.op === 'ISOLATE_REGION') { const keep = new Set(keysFor(o.target));
      Object.keys(vis).forEach(k => { vis[k] = keep.has(k); }); }
    else if (o.op === 'HIGHLIGHT_STRUCTURE') keysFor(o.target).forEach(k => {
      if (STRUCT[k]) hi[k] = o.intensity || 0.45; });
    else if (o.op === 'ROTATE_TO_VIEW') dir = o.view;
  }
  const visible = allKeys.filter(k => vis[k]);
  if (!Object.keys(hi).length) { report.highlight.push({ beat: (v.beat || i + 1), t: sst.t, hi: [], note: 'no highlight' }); continue; }
  /* each highlighted key measured ON ITS OWN, so one bright structure cannot carry another */
  const per = {};
  for (const k of Object.keys(hi)) {
    const one = {}; one[k] = hi[k];
    per[k] = await p.evaluate(sp => window.beatHighlight(sp),
      { t: sst.t, visible, hi: one, dir, structures: STRUCT });
  }
  report.highlight.push({ beat: (v.beat || i + 1), t: sst.t, dir, hi: Object.keys(hi), per });
}


await b.close(); server.close();
writeFileSync(`${OUT}/report.json`, JSON.stringify(report, null, 1));

/* ---- verdict ---- */
const NOISE = /GPU stall due to ReadPixels|GL Driver Message|Automatic fallback to software WebGL|SwiftShader|Passthrough is not supported/i;
const noise = report.console.filter(m => NOISE.test(m.text));
const bad = report.console.filter(m => (m.type === 'error' || m.type === 'warning' || m.type === 'pageerror') && !NOISE.test(m.text));
const badA = (report.adapterConsole || []).filter(m => (m.type === 'error' || m.type === 'warning' || m.type === 'pageerror') && !NOISE.test(m.text));
report.harness_noise = noise;

console.log('stages rendered  :', report.stages.length);
console.log('console (model)  :', bad.length ? 'DIRTY' : 'clean',
  bad.map(x => x.type + ': ' + x.text).join(' | '), ' [' + noise.length + ' swiftshader messages ignored]');
console.log('console (adapter):', badA.length ? 'DIRTY' : 'clean', badA.map(x => x.type + ': ' + x.text).join(' | '));
const A = report.acceptance;
console.log('acceptance       : allPass=' + A.allPass + '  allNegativesReject=' + A.allNegativesReject);
for (const k of Object.keys(A.pass)) {
  console.log('   ' + (A.pass[k] ? 'PASS' : 'FAIL') + '  ' + k.padEnd(38),
    'value=' + JSON.stringify(A.values[k]), ' neg=' + (A.negatives[k] ? 'rejects' : 'ACCEPTS-WRONG'));
}
console.log('envelope (solved): rEmb=' + A.envelope.rEmb.toFixed(5) + ' maxRadius=' +
  A.envelope.maxRadius.toFixed(5) + ' over ' + A.envelope.verts + ' vertices;  diagnostic ' +
  JSON.stringify({ protrusion: A.envelopeDiagnostic.worstProtrusionFrac,
                   slack: A.envelopeDiagnostic.worstSlackFrac, at: A.envelopeDiagnostic.at }));
console.log('gap partition    :', JSON.stringify(A.volumes));
console.log('mirror residual  :', A.mirror.residual.toExponential(2), '(' + A.mirror.samples + ' samples)');
for (const tag of ['normals_day8', 'normals_day11', 'normals']) {
  const rows = report[tag];
  const worstW = Math.min(...rows.map(r => r.winding == null ? 1 : r.winding));
  const worstO = Math.min(...rows.map(r => r.outward));
  console.log(tag.padEnd(13), 'meshes=' + rows.length, 'worst winding=' + worstW.toFixed(4),
    'worst outward(whole-buffer)=' + worstO.toFixed(4));
  for (const r of rows) {
    if ((r.winding != null && r.winding < 0.999) || r.outward < 0.90) {
      console.log('     note', r.key.padEnd(24), 'winding=' + (r.winding == null ? 'n/a' : r.winding.toFixed(4)),
        'outward=' + r.outward.toFixed(4), 'verts=' + r.verts, 'vol=' + r.volume.toFixed(5));
    }
  }
}
/* finding 4's rule, reported per beat: a beat that points at a structure must CHANGE when it does */
const HI_FLOOR = 0.002;        // 0.2% of the subject's own lit pixels
const hiBad = [];
for (const h of report.highlight) {
  if (!h.per) { continue; }
  for (const k of Object.keys(h.per)) {
    const r = h.per[k];
    const ok = r && r.fracOfSubject >= HI_FLOOR;
    if (!ok) hiBad.push('beat ' + h.beat + ' ' + k + ' ' + (r ? (r.fracOfSubject * 100).toFixed(3) + '%' : 'ERROR'));
    console.log('highlight delta  : beat ' + String(h.beat).padStart(2) + ' ' + k.padEnd(24),
      (ok ? 'PASS ' : 'FAIL '), 'moved=' + (r ? r.moved : '?'),
      'ofSubject=' + (r ? (r.fracOfSubject * 100).toFixed(3) + '%' : '?'),
      'ofFrame=' + (r ? (r.fracOfFrame * 100).toFixed(3) + '%' : '?'));
  }
}
console.log('highlight delta  : S_every_pointed_at_structure_changes_the_picture',
  hiBad.length ? 'FAIL -> ' + hiBad.join('; ') : 'PASS (floor ' + (HI_FLOOR * 100) + '% of subject)');
report.highlightVerdict = { floor: HI_FLOOR, failures: hiBad };

for (const l of report.lumen) {
  console.log('lumen', l.camera.padEnd(20), 'hits=' + l.hits, 'backfaceFirst=' + l.backfaceFirst,
    'frac=' + l.frac.toFixed(4), JSON.stringify(l.offenders));
}
for (const px of report.pixels) {
  console.log('pixels', px.label.padEnd(32), 'visible=' + px.visiblePixels,
    'frameFrac=' + (px.fracOfFrame * 100).toFixed(3) + '%',
    'subjectFrac=' + (px.fracOfSubject * 100).toFixed(3) + '%');
}
console.log('refs at default t:', report.refs.length, 'refs;',
  report.refs.filter(r => r.hasMesh).length, 'resolved with geometry at the adapter default t = 1');
for (const r of report.refs) {
  if (!r.hasMesh) console.log('   none at t=1 (expected for a structure that is over by day 14):', r.key);
}
let beatRefs = 0, beatBad = 0;
for (const b of report.refsPerBeat) {
  const bad = b.refs.filter(r => !r.hasMesh);
  beatRefs += b.refs.length; beatBad += bad.length;
  console.log('refs beat ' + String(b.beat).padStart(2) + ' t=' + b.t.toFixed(4),
    b.refs.length + ' shown, ' + (b.refs.length - bad.length) + ' resolved' +
    (bad.length ? '   UNRESOLVED: ' + bad.map(r => r.key + ' (' + (r.reason || r.error) + ')').join(', ') : ''));
}
console.log('refs per beat    :', beatRefs, 'structure-beats shown;', beatRefs - beatBad,
  'resolved through the real adapter at their own beat\'s t;', beatBad, 'unresolved');
