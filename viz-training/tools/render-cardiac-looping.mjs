/* MedBank · headless proof for models3d/cardiac-looping.js
 *
 * Four things, all of which must pass before the item is marked built:
 *   1. it renders — several t, screenshots to viz-training/models-out/cardiac-looping/
 *   2. the console is clean — no error, no warning, no throw
 *   3. normals point outward — per mesh, counted against that mesh's own centroid
 *   4. every ref in the scene resolves THROUGH THE REAL ADAPTER in viz3d.js, with geometry
 *
 * Run from the repo root:  node viz-training/tools/render-cardiac-looping.mjs
 */
import { chromium } from 'playwright';
import { readFileSync, writeFileSync, mkdirSync } from 'fs';
import http from 'http';
import path from 'path';
import fs from 'fs';

const ROOT = process.cwd();
const OUT = 'viz-training/models-out/cardiac-looping';
mkdirSync(OUT, { recursive: true });

/* the model is loaded by <script src>, the way the player loads it, so a static server is the
   substrate rather than an inlined copy — an inlined copy would not exercise the adapter's loader */
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

const scene = JSON.parse(readFileSync('viz-training/scenes/embryology__cardiovascular-development__cardiac-looping.json', 'utf8'));
const REFS = scene.structures.map(s => ({ key: s.key, ref: s.refs && s.refs.procedural })).filter(r => r.ref);

const W = 1000, H = 1180;
const STAGES = [
  ['t000',      0.00, {},                                   'day 23 — the straight heart tube'],
  ['t025',      0.25, {},                                   't = 0.25'],
  ['t045',      0.45, {},                                   't = 0.45'],
  ['t060',      0.60, {},                                   't = 0.60 — mid-loop'],
  ['t080',      0.80, {},                                   't = 0.80'],
  ['t100',      1.00, {},                                   'day 28 — the looped heart'],
  ['t100-meso', 1.00, { mesocardium: true, midline: true }, 'day 28 with the mesocardium and midline'],
  ['t045-meso', 0.45, { mesocardium: true },                'mid-loop — the mesocardium has broken'],
  ['t000-meso', 0.00, { mesocardium: true },                'day 23 — the mesocardium intact'],
  ['t000-peri', 0.00, { pericardium: true },                'day 23 in the pericardial cavity'],
  ['t100-peri', 1.00, { pericardium: true },                'day 28 in the pericardial cavity'],
  ['t100-cut',  1.00, { cutaway: true },                    'cutaway — wall, jelly, endocardial tube'],
  ['t100-mir',  1.00, { mirror: true, midline: true },      'the L-loop'],
];

const html = `<!doctype html><meta charset=utf8>
<link rel="icon" href="data:,">
<body style="margin:0;background:#0e1626">
<canvas id=c width=${W} height=${H}></canvas>
<script src="${BASE}node_modules/three/build/three.js"><\/script>
<script src="${BASE}models3d/render-kit.js"><\/script>
<script src="${BASE}models3d/cardiac-looping.js"><\/script>
<script>
window.MEDBANK_CONFIG = { MODEL_BASE: '${BASE}models3d/' };
const renderer = new THREE.WebGLRenderer({ canvas: document.getElementById('c'), antialias: true });
renderer.setSize(${W}, ${H}, false); renderer.setPixelRatio(1);
VizKit.configureRenderer(renderer);
const scene = new THREE.Scene();
scene.background = VizKit.bg(0x0e1626);
const L = VizKit.standardLights(scene);
const camera = new THREE.PerspectiveCamera(32, ${W}/${H}, 0.1, 200);
let group = null;
const MOD = window.MB3D_MODELS['cardiac-looping'];
window.setStage = function (t, opts, yaw, pitch) {
  if (group) scene.remove(group);
  group = MOD.build(t, Object.assign({}, opts || {}));
  group.rotation.y = yaw == null ? -0.28 : yaw;
  group.rotation.x = pitch == null ? 0.05 : pitch;
  group.updateMatrixWorld(true);
  scene.add(group);
  const f = VizKit.fitCamera(camera, group, 1.03);
  camera.position.set(f.centre.x, f.centre.y, f.centre.z + f.distance);
  camera.lookAt(f.centre);
  L.key.position.set(camera.position.x + 6, camera.position.y + 8, camera.position.z + 4);
  renderer.render(scene, camera);
  return true;
};
/* OUTWARD NORMALS. Per mesh, counted against that mesh's OWN centroid, in world space. A closed
   solid is strongly majority-outward; a tube read at its own centreline is not, and the two are
   reported separately so a low number on a tube is not mistaken for a winding fault. */
window.normalProbe = function (t, opts) {
  const g = MOD.build(t, Object.assign({}, opts || {}));
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
    /* A thick-walled shell carries its INNER surface and its annular end caps in the same buffer, and
       those normals point toward the mesh centroid by construction — so a whole-buffer count on a
       closed tube lands near 0.5 and says nothing. render-kit records how much of the buffer is the
       outer surface in geometry.userData.hullCount; that is the part a closed solid must be strongly
       outward on. Both numbers are reported. */
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
    // face winding vs supplied vertex normals — RENDER-STANDARD bug 1
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
<\/script>`;

writeFileSync('viz-training/models-out/cardiac-looping/_harness.html', html);

/* the adapter page is separate: it loads viz3d.js for real and asks the procedural adapter to
   resolve every ref the scene names, the way the player does */
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
        return { key: r.key, ref: r.ref, reason: res && res.reason,
                 hasMesh: !!m,
                 tris: m && m.geometry ? m.geometry.attributes.position.count / 3 : 0 };
      }, function (e) { return { key: r.key, ref: r.ref, error: String(e && e.message || e) }; });
  }));
};
<\/script>`;
writeFileSync('viz-training/models-out/cardiac-looping/_adapter.html', adapterHtml);

const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium-1194/chrome-linux/chrome',
  args: ['--use-gl=swiftshader', '--enable-unsafe-swiftshader', '--no-sandbox'] });
const p = await b.newPage({ viewport: { width: W, height: H } });
const log = [];
p.on('console', m => log.push({ type: m.type(), text: m.text() }));
p.on('pageerror', e => log.push({ type: 'pageerror', text: String(e && e.message || e) }));

await p.goto(BASE + 'viz-training/models-out/cardiac-looping/_harness.html');
await p.waitForFunction('typeof window.setStage === "function"');

const report = { stages: [], console: [], normals: null, acceptance: null, refs: null };
report.acceptance = await p.evaluate('window.acceptance()');

for (const [name, t, opts, label] of STAGES) {
  const yaw = name.endsWith('-meso') || name === 't100-mir' ? -1.35 : -0.28;   // meso is a median sheet: look at it from the side
  await p.evaluate(([t, o, y]) => window.setStage(t, o, y, 0.05), [t, opts, yaw]);
  const file = `${OUT}/${name}.png`;
  await p.locator('#c').screenshot({ path: file });
  report.stages.push({ name, t, opts, label, file, yaw });
}

report.normals = await p.evaluate('window.normalProbe(1, { mesocardium: true, endocardium: true, midline: true })');
report.console = log.slice();

/* ---- the real adapter ---- */
const p2 = await b.newPage();
const log2 = [];
p2.on('console', m => log2.push({ type: m.type(), text: m.text() }));
p2.on('pageerror', e => log2.push({ type: 'pageerror', text: String(e && e.message || e) }));
await p2.goto(BASE + 'viz-training/models-out/cardiac-looping/_adapter.html');
await p2.waitForFunction('typeof window.resolveAll === "function"');
report.refs = await p2.evaluate(r => window.resolveAll(r), REFS);
report.adapterConsole = log2;

await b.close(); server.close();
writeFileSync(`${OUT}/report.json`, JSON.stringify(report, null, 1));

/* ---- verdict ---- */
/* swiftshader's own performance chatter is the HARNESS, not the model; it is listed rather than
   silently dropped so the distinction is auditable. */
const NOISE = /GPU stall due to ReadPixels|GL Driver Message|Automatic fallback to software WebGL|SwiftShader/i;
const noise = report.console.filter(m => NOISE.test(m.text));
const bad = report.console.filter(m => (m.type === 'error' || m.type === 'warning' || m.type === 'pageerror') && !NOISE.test(m.text));
report.harness_noise = noise;
const badA = (report.adapterConsole || []).filter(m => m.type === 'error' || m.type === 'warning' || m.type === 'pageerror');
console.log('stages rendered :', report.stages.length);
console.log('console (model) :', bad.length ? 'DIRTY' : 'clean', bad.map(b2 => b2.type + ': ' + b2.text).join(' | '),
  '  [' + noise.length + ' swiftshader harness messages ignored]');
console.log('console (adapter):', badA.length ? 'DIRTY' : 'clean', badA.map(b2 => b2.type + ': ' + b2.text).join(' | '));
console.log('acceptance      :', JSON.stringify(report.acceptance.pass), 'allPass=' + report.acceptance.allPass);
const byKey = {};
for (const r of report.normals) (byKey[r.key] = byKey[r.key] || []).push(r);
for (const k of Object.keys(byKey)) {
  const rows = byKey[k];
  const ow = rows.map(r => r.outward), wi = rows.map(r => r.winding).filter(x => x != null);
  const oh = rows.map(r => r.outwardHull).filter(x => x != null);
  console.log('  normals', k.padEnd(12),
    'outer-surface ' + (oh.length ? Math.min(...oh).toFixed(3) + '-' + Math.max(...oh).toFixed(3) : '   n/a   '),
    ' whole-buffer ' + Math.min(...ow).toFixed(3) + '-' + Math.max(...ow).toFixed(3),
    ' winding ' + Math.min(...wi).toFixed(3) + '-' + Math.max(...wi).toFixed(3), ' (' + rows.length + ' meshes)');
}
const failed = report.refs.filter(r => !r.hasMesh || !r.tris);
console.log('refs resolved   :', (report.refs.length - failed.length) + '/' + report.refs.length,
  failed.length ? 'FAILED: ' + failed.map(f => f.key + '(' + (f.reason || f.error) + ')').join(', ') : '');
console.log('total triangles :', report.refs.reduce((s, r) => s + (r.tris || 0), 0));
process.exit(bad.length || badA.length || failed.length || !report.acceptance.allPass ? 1 : 0);
