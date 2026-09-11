/* MedBank · headless proof for models3d/heart-external.js
 *
 * Five things, all of which must pass before the item is marked built (BUILD-TASK-PROMPT §3):
 *   1. it renders — several views and layer sets, screenshots to viz-training/models-out/heart-external/
 *   2. the console is clean — no error, no warning, no throw
 *   3. normals point outward — per mesh, counted against that mesh's own centroid, outer surface and
 *      whole buffer reported separately so a low number on a tube is not read as a winding fault
 *   4. it looks like the thing — a human opens the renders
 *   5. every ref the scene names resolves THROUGH THE REAL ADAPTER in viz3d.js, with geometry
 *
 * Modelled on render-cardiac-looping.mjs, which is the proven harness for this repo. The static
 * server is the substrate rather than an inlined copy, because an inlined copy would not exercise
 * the adapter's own loader.
 *
 * Run from the repo root:  node viz-training/tools/render-heart-external.mjs
 */
import { chromium } from 'playwright';
import { readFileSync, writeFileSync, mkdirSync, existsSync } from 'fs';
import http from 'http';
import path from 'path';
import fs from 'fs';

const ROOT = process.cwd();
const OUT = 'viz-training/models-out/heart-external';
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

const SCENE_PATH = 'viz-training/scenes/gross__heart-pericardium__heart-external.json';
let REFS = [];
if (existsSync(SCENE_PATH)) {
  const scene = JSON.parse(readFileSync(SCENE_PATH, 'utf8'));
  REFS = scene.structures.map(s => ({ key: s.key, ref: s.refs && s.refs.procedural })).filter(r => r.ref);
} else {
  console.log('NOTE: no scene yet at ' + SCENE_PATH + ' — the adapter stage will be skipped');
}

const W = 1040, H = 1040;

/* view direction, then which layers are on. Every frame changes the picture. */
const STAGES = [
  ['form-ant',      'anterior',  {}],
  ['form-lat-left', 'lateral',   {}],
  ['form-post',     'posterior', {}],
  ['form-inf',      'inferior',  {}],
  ['chambers-ant',  'anterior',  { chambers: true }],
  ['chambers-post', 'posterior', { chambers: true }],
  ['surfaces-ant',  'anterior',  { surfaces: true }],
  ['surfaces-inf',  'inferior',  { surfaces: true }],
  ['surfaces-lat',  'lateral',   { surfaces: true }],
  ['borders-ant',   'anterior',  { borders: true }],
  ['sulci-ant',     'anterior',  { sulci: true }],
  ['sulci-post',    'posterior', { sulci: true }],
  ['sulci-inf',     'inferior',  { sulci: true }],
  ['sulci-lat',     'lateral',   { sulci: true }],
  ['poles-lat',     'lateral',   { poles: true }],
  ['peri-ant',      'anterior',  { pericardium: true }],
  ['context-ant',   'anterior',  { context: true }],
  ['context-lat',   'lateral',   { context: true }],
  ['full-ant',      'anterior',  { chambers: true, surfaces: true, borders: true, sulci: true, poles: true, pericardium: true, context: true }],
];

const html = `<!doctype html><meta charset=utf8>
<link rel="icon" href="data:,">
<body style="margin:0;background:#0e1626">
<canvas id=c width=${W} height=${H}></canvas>
<script src="${BASE}node_modules/three/build/three.js"><\/script>
<script src="${BASE}models3d/render-kit.js"><\/script>
<script src="${BASE}models3d/heart-external.js"><\/script>
<script>
window.MEDBANK_CONFIG = { MODEL_BASE: '${BASE}models3d/' };
const renderer = new THREE.WebGLRenderer({ canvas: document.getElementById('c'), antialias: true });
renderer.setSize(${W}, ${H}, false); renderer.setPixelRatio(1);
VizKit.configureRenderer(renderer);
const scene = new THREE.Scene();
scene.background = VizKit.bg(0x0e1626);
const L = VizKit.standardLights(scene);
const camera = new THREE.PerspectiveCamera(34, 1, 0.1, 400);
let group = null;
const MOD = window.MB3D_MODELS['heart-external'];
/* the same directions viz3d.js's VIEW_DIR uses, so what these frames show is what the player shows */
const VIEW_DIR = {
  anterior: [0,0,1], posterior: [0,0,-1], lateral: [1,0,0], medial: [-1,0,0],
  superior: [0,1,0.001], inferior: [0,-1,0.001]
};
window.setStage = function (view, opts) {
  if (group) scene.remove(group);
  group = MOD.build(1, Object.assign({}, opts || {}));
  group.updateMatrixWorld(true);
  scene.add(group);
  const f = VizKit.fitCamera(camera, group, 1.06);
  const d = new THREE.Vector3().fromArray(VIEW_DIR[view] || [0,0,1]).normalize();
  camera.position.copy(f.centre).addScaledVector(d, f.distance);
  camera.up.set(0, 1, 0);
  camera.lookAt(f.centre);
  L.key.position.copy(camera.position).add(new THREE.Vector3(3, 6, 2));
  renderer.render(scene, camera);
  return true;
};
/* OUTWARD NORMALS. Per mesh, against that mesh's OWN centroid, in world space, plus the face-winding
   agreement that caught RENDER-STANDARD bug 1. */
window.normalProbe = function (opts) {
  const g = MOD.build(1, Object.assign({}, opts || {}));
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
                tris: tris, winding: tris ? agree / tris : null });
  });
  return rows;
};
window.acceptance = function () { return MOD.acceptance(); };
window.modelKeys = function () { return Object.keys(MOD.LAYERS); };
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

/* CHROMIUM. render-cardiac-looping.mjs hardcodes /opt/pw-browsers/chromium-1194/..., which breaks the
   moment the playwright package in node_modules is a different build number from the browser on the
   box — it did, on this run. Scan for whatever is actually installed and fall back to playwright's
   own resolution, so the harness survives a version bump instead of reporting a launch failure as a
   model failure. */
function findChromium() {
  const roots = ['/opt/pw-browsers'];
  const cands = [];
  for (const root of roots) {
    if (!existsSync(root)) continue;
    for (const d of fs.readdirSync(root)) {
      for (const rel of ['chrome-linux/chrome', 'chrome-linux/headless_shell',
                         'chrome-headless-shell-linux64/chrome-headless-shell']) {
        const full = path.join(root, d, rel);
        if (existsSync(full)) cands.push(full);
      }
    }
  }
  cands.sort((a, b2) => (a.includes('chrome-linux/chrome') ? -1 : 1) - (b2.includes('chrome-linux/chrome') ? -1 : 1));
  return cands[0] || undefined;
}
const EXE = findChromium();
console.log('chromium         :', EXE || '(playwright default)');
const b = await chromium.launch({ executablePath: EXE,
  args: ['--use-gl=swiftshader', '--enable-unsafe-swiftshader', '--no-sandbox'] });
const p = await b.newPage({ viewport: { width: W, height: H } });
const log = [];
p.on('console', m => log.push({ type: m.type(), text: m.text() }));
p.on('pageerror', e => log.push({ type: 'pageerror', text: String(e && e.message || e) }));

await p.goto(BASE + OUT + '/_harness.html');
await p.waitForFunction('typeof window.setStage === "function"');

const report = { stages: [], console: [], normals: null, acceptance: null, refs: null };
report.acceptance = await p.evaluate('window.acceptance()');
report.modelKeys = await p.evaluate('window.modelKeys()');

for (const [name, view, opts] of STAGES) {
  await p.evaluate(([v, o]) => window.setStage(v, o), [view, opts]);
  const file = `${OUT}/${name}.png`;
  await p.locator('#c').screenshot({ path: file });
  report.stages.push({ name, view, opts, file });
}

report.normals = await p.evaluate('window.normalProbe({ chambers:true, surfaces:true, borders:true, sulci:true, poles:true, pericardium:true, context:true })');
report.console = log.slice();

let badA = [];
if (REFS.length) {
  const p2 = await b.newPage();
  const log2 = [];
  p2.on('console', m => log2.push({ type: m.type(), text: m.text() }));
  p2.on('pageerror', e => log2.push({ type: 'pageerror', text: String(e && e.message || e) }));
  await p2.goto(BASE + OUT + '/_adapter.html');
  await p2.waitForFunction('typeof window.resolveAll === "function"');
  report.refs = await p2.evaluate(r => window.resolveAll(r), REFS);
  report.adapterConsole = log2;
  badA = log2.filter(m => m.type === 'error' || m.type === 'warning' || m.type === 'pageerror');
}

await b.close(); server.close();
writeFileSync(`${OUT}/report.json`, JSON.stringify(report, null, 1));

/* ---- verdict ---- */
const NOISE = /GPU stall due to ReadPixels|GL Driver Message|Automatic fallback to software WebGL|SwiftShader/i;
const noise = report.console.filter(m => NOISE.test(m.text));
const bad = report.console.filter(m => (m.type === 'error' || m.type === 'warning' || m.type === 'pageerror') && !NOISE.test(m.text));
report.harness_noise = noise;
console.log('stages rendered  :', report.stages.length);
console.log('console (model)  :', bad.length ? 'DIRTY' : 'clean', bad.map(x => x.type + ': ' + x.text).join(' | '),
  '  [' + noise.length + ' swiftshader harness messages ignored]');
console.log('console (adapter):', REFS.length ? (badA.length ? 'DIRTY ' + badA.map(x => x.type + ': ' + x.text).join(' | ') : 'clean') : 'skipped — no scene');
const acc = report.acceptance;
console.log('acceptance       : allPass=' + acc.allPass);
for (const k of Object.keys(acc.pass)) if (!acc.pass[k]) console.log('   FAILED', k);
console.log('  solved          :', JSON.stringify(acc.solved));
console.log('  measured        :', JSON.stringify(acc.measured));
for (const k of Object.keys(acc.attribution || {})) console.log('  forms', k.padEnd(20), JSON.stringify(acc.attribution[k].fractions));

const byKey = {};
for (const r of report.normals) (byKey[r.key] = byKey[r.key] || []).push(r);
let worstHull = 1, worstWind = 1, worstKey = '', worstWindKey = '';
for (const k of Object.keys(byKey)) {
  const rows = byKey[k];
  const ow = rows.map(r => r.outward), wi = rows.map(r => r.winding).filter(x => x != null);
  const oh = rows.map(r => r.outwardHull).filter(x => x != null);
  const mh = oh.length ? Math.min(...oh) : null, mw = wi.length ? Math.min(...wi) : null;
  if (mh != null && mh < worstHull) { worstHull = mh; worstKey = k; }
  if (mw != null && mw < worstWind) { worstWind = mw; worstWindKey = k; }
  console.log('  normals', k.padEnd(30),
    'outer-surface ' + (oh.length ? Math.min(...oh).toFixed(3) + '-' + Math.max(...oh).toFixed(3) : '   n/a   '),
    ' whole-buffer ' + Math.min(...ow).toFixed(3) + '-' + Math.max(...ow).toFixed(3),
    ' winding ' + (wi.length ? Math.min(...wi).toFixed(3) : ' n/a '), ' (' + rows.length + ')');
}
console.log('worst outward (outer surface):', worstHull.toFixed(3), 'on', worstKey);
console.log('worst winding agreement      :', worstWind.toFixed(3), 'on', worstWindKey);
if (report.refs) {
  const failed = report.refs.filter(r => !r.hasMesh || !r.tris);
  console.log('refs resolved    :', (report.refs.length - failed.length) + '/' + report.refs.length,
    failed.length ? 'FAILED: ' + failed.map(f => f.key + '(' + (f.reason || f.error) + ')').join(', ') : '');
  console.log('total triangles  :', report.refs.reduce((s, r) => s + (r.tris || 0), 0));
  const unused = (report.modelKeys || []).filter(k => !report.refs.some(r => r.ref.indexOf('#' + k) >= 0));
  if (unused.length) console.log('model keys no scene structure names:', unused.join(', '));
}
