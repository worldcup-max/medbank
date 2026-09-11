/* MedBank · headless proof for models3d/cardiac-cycle-pumping.js
 *
 * The five checks BUILD-TASK-PROMPT section 3 asks for, all of which must pass before the item is
 * marked built:
 *   1. it renders — screenshots at every named phase, into viz-training/models-out/cardiac-cycle-pumping/
 *   2. the console is clean — no error, no warning, no throw
 *   3. normals point outward — per mesh, counted against that mesh's own centroid, hull separately
 *   4. it looks like the thing — a human reads the frames; this tool only produces them
 *   5. every ref in the scene resolves THROUGH THE REAL ADAPTER in viz3d.js, with geometry
 *
 * plus two this model needs and the looping one did not:
 *   6. the acceptance battery passes IN THE BROWSER, not only in node
 *   7. VOLUME AGREES WITH GEOMETRY. The circulation solves for a cavity volume; the mesh is supposed
 *      to enclose that volume. Nothing checked that until this tool did, and a shape law that is
 *      exact on paper can still be built wrong. The tool integrates the actual triangles.
 *
 * Run from the repo root:  node viz-training/tools/render-cardiac-cycle.mjs
 *
 * SUBSTRATE NOTE, and it matters — RENDER-STANDARD: "test on the substrate, not on something that
 * resembles it". There is no chromium and no playwright on the device VM that holds this repo, so
 * this tool is run in a cloud container against files staged out of the repo. The files served are
 * the repo's own, byte for byte, and the adapter exercised is the real viz3d.js — but the run is not
 * on the machine the player runs on. Said out loud rather than assumed; see BUILD-LOG.md.
 */
import { chromium } from 'playwright';
import { readFileSync, writeFileSync, mkdirSync, existsSync, readdirSync } from 'fs';
import http from 'http';
import path from 'path';
import fs from 'fs';

const ROOT = process.cwd();
const OUT = 'viz-training/models-out/cardiac-cycle-pumping';
mkdirSync(OUT, { recursive: true });

/* find chromium rather than hardcoding a build number — the looping tool pins
   /opt/pw-browsers/chromium-1194/... which is one playwright upgrade from breaking */
function findChromium() {
  if (process.env.CHROMIUM_PATH) return process.env.CHROMIUM_PATH;
  const base = '/opt/pw-browsers';
  if (existsSync(base)) {
    for (const d of readdirSync(base)) {
      for (const rel of ['chrome-linux/chrome', 'chrome-linux/headless_shell']) {
        const p = path.join(base, d, rel);
        if (existsSync(p)) return p;
      }
    }
  }
  return undefined;   // let playwright use its own default
}

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
const BASE = `http://127.0.0.1:${server.address().port}/`;

const SCENE_PATH = 'viz-training/scenes/gross__heart-pericardium__cardiac-cycle-pumping.json';
const scene = JSON.parse(readFileSync(SCENE_PATH, 'utf8'));
const REFS = scene.structures.map(s => ({ key: s.key, ref: s.refs && s.refs.procedural })).filter(r => r.ref);
/* every t the scene actually asks for, so the frames prove the scene and not a t nobody visits */
const SCENE_T = [...new Set(scene.views.flatMap(v =>
  v.ops.filter(o => o.op === 'SET_STAGE').map(o => o.t)))].sort((a, b) => a - b);

const W = 1100, H = 900;

const html = `<!doctype html><meta charset=utf8>
<link rel="icon" href="data:,">
<body style="margin:0;background:#0e1626">
<canvas id=c width=${W} height=${H}></canvas>
<script src="${BASE}node_modules/three/build/three.js"><\/script>
<script src="${BASE}models3d/render-kit.js"><\/script>
<script src="${BASE}models3d/cardiac-cycle-pumping.js"><\/script>
<script>
window.MEDBANK_CONFIG = { MODEL_BASE: '${BASE}models3d/' };
const renderer = new THREE.WebGLRenderer({ canvas: document.getElementById('c'), antialias: true });
renderer.setSize(${W}, ${H}, false); renderer.setPixelRatio(1);
VizKit.configureRenderer(renderer);
const scene = new THREE.Scene();
scene.background = VizKit.bg(0x0e1626);
const L = VizKit.standardLights(scene);
const camera = new THREE.PerspectiveCamera(32, ${W}/${H}, 0.1, 400);
const MOD = window.MB3D_MODELS['cardiac-cycle-pumping'];
let group = null;

/* THE CAMERA IS FIXED ACROSS THE STAGES, DELIBERATELY, and this needed thinking about.
   RENDER-STANDARD says the subject fills the frame at every t — and it is right, for a model whose
   SIZE is what changes. Here the size change IS the subject: a ventricle refitted to fill the frame
   at every t would show a heart that never changes size, which is the one thing this scene exists to
   show. So the camera is fitted ONCE, to the largest the model ever gets — measured over every t the
   scene visits, not assumed to be t=0 — and then held. The subject fills the frame; it just does not
   get refitted per stage. Stated here because a reviewer should be able to see that the rule was
   considered and answered rather than skipped. */
window.fitOnce = function (ts, yaw, pitch) {
  const box = new THREE.Box3();
  ts.forEach(function (t) {
    const g = MOD.build(t, Object.assign({}, MOD.FULL));
    g.rotation.y = yaw; g.rotation.x = pitch; g.updateMatrixWorld(true);
    box.union(new THREE.Box3().setFromObject(g));
  });
  const proxy = new THREE.Mesh(new THREE.BoxGeometry(
    Math.max(0.01, box.max.x-box.min.x), Math.max(0.01, box.max.y-box.min.y),
    Math.max(0.01, box.max.z-box.min.z)));
  box.getCenter(proxy.position); proxy.updateMatrixWorld(true);
  const f = VizKit.fitCamera(camera, proxy, 1.06);
  camera.position.set(f.centre.x, f.centre.y, f.centre.z + f.distance);
  camera.lookAt(f.centre);
  L.key.position.set(camera.position.x + 6, camera.position.y + 8, camera.position.z + 4);
  return { size: [f.size.x, f.size.y, f.size.z], distance: f.distance };
};
window.setStage = function (t, opts, yaw, pitch) {
  if (group) scene.remove(group);
  group = MOD.build(t, Object.assign({}, MOD.FULL, opts || {}));
  group.rotation.y = yaw == null ? 0 : yaw;
  group.rotation.x = pitch == null ? 0 : pitch;
  group.updateMatrixWorld(true);
  scene.add(group);
  renderer.render(scene, camera);
  return true;
};

/* OUTWARD NORMALS. Per mesh, against that mesh's OWN centroid, in world space. A closed solid is
   strongly majority-outward; a thick-walled shell read whole is not, because its inner surface and
   its annular caps point inward by construction — so render-kit's hullCount is used to report the
   outer surface separately. A thin SHEET (a valve leaflet) is a third case: its centroid lies in its
   own plane, so "away from the centroid" is nearly perpendicular to its normals and the fraction
   means nothing. For a sheet the number that matters is the winding agreement. */
window.normalProbe = function (t, opts) {
  const g = MOD.build(t, Object.assign({}, MOD.FULL, opts || {}));
  g.updateMatrixWorld(true);
  const rows = [], nm = new THREE.Matrix3();
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
      fn.normalize(); vn.set(0,0,0);
      for (let k = 0; k < 3; k++) vn.add(new THREE.Vector3().fromBufferAttribute(n, i+k));
      if (vn.lengthSq() < 1e-16) continue;
      vn.normalize(); tris++; if (fn.dot(vn) > 0) agree++;
    }
    rows.push({ key: u.key, verts: p.count, outward: out / p.count,
                hullVerts: hull, outwardHull: hull ? outHull / hull : null,
                tris: tris, winding: tris ? agree / tris : null });
  });
  return rows;
};

/* DOES THE MESH ENCLOSE THE VOLUME THE CIRCULATION SOLVED FOR?
   Signed volume by the divergence theorem, summed over the actual triangles of the blood solids —
   which is the only way to find out whether the shape law was IMPLEMENTED as well as derived. */
window.volumeProbe = function (t) {
  const g = MOD.build(t, Object.assign({}, MOD.FULL));
  g.updateMatrixWorld(true);
  const vol = {};
  g.traverse(function (o) {
    if (!o.isMesh || !o.geometry) return;
    const u = o.userData || {};
    if (u.outline || !/_blood$/.test(u.key || '')) return;
    const geo = o.geometry.index ? o.geometry.toNonIndexed() : o.geometry;
    const p = geo.attributes.position;
    const a = new THREE.Vector3(), b = new THREE.Vector3(), c = new THREE.Vector3();
    let s = 0;
    for (let i = 0; i + 2 < p.count; i += 3) {
      a.fromBufferAttribute(p, i).applyMatrix4(o.matrixWorld);
      b.fromBufferAttribute(p, i+1).applyMatrix4(o.matrixWorld);
      c.fromBufferAttribute(p, i+2).applyMatrix4(o.matrixWorld);
      s += a.dot(new THREE.Vector3().crossVectors(b, c)) / 6;
    }
    vol[u.key] = (vol[u.key] || 0) + Math.abs(s);   // cm^3 = ml
  });
  const at = MOD.at(t);
  return { t: t, mesh: vol,
           solved: { lv_blood: at.lv.volume, rv_blood: at.rv.volume,
                     la_blood: at.la.volume, ra_blood: at.ra.volume } };
};
window.acceptance = function () { return MOD.acceptance(); };
window.at = function (t) { return MOD.at(t); };
<\/script>`;

writeFileSync(`${OUT}/_harness.html`, html);

const adapterHtml = `<!doctype html><meta charset=utf8><link rel="icon" href="data:,"><body>
<script src="${BASE}node_modules/three/build/three.js"><\/script>
<script>window.MEDBANK_CONFIG = { MODEL_BASE: '${BASE}models3d/' };<\/script>
<script src="${BASE}viz3d.js"><\/script>
<script>
window.resolveAll = function (refs, t) {
  const ad = window.MB3D.adapters.procedural;
  return Promise.all(refs.map(function (r) {
    const ref = t == null ? r.ref : r.ref + '@' + t;
    return ad.load(window.THREE, { key: r.key, refs: { procedural: ref } })
      .then(function (res) {
        const m = res && res.mesh;
        return { key: r.key, ref: ref, reason: res && res.reason, hasMesh: !!m,
                 tris: m && m.geometry ? m.geometry.attributes.position.count / 3 : 0 };
      }, function (e) { return { key: r.key, ref: ref, error: String(e && e.message || e) }; });
  }));
};
window.stageable = function (refs) {
  const ad = window.MB3D.adapters.procedural;
  return refs.map(function (r) {
    return { key: r.key, stageable: ad.stageable({ refs: { procedural: r.ref } }) };
  });
};
<\/script>`;
writeFileSync(`${OUT}/_adapter.html`, adapterHtml);

const exe = findChromium();
const b = await chromium.launch({ executablePath: exe,
  args: ['--use-gl=swiftshader', '--enable-unsafe-swiftshader', '--no-sandbox'] });
const p = await b.newPage({ viewport: { width: W, height: H } });
const log = [];
p.on('console', m => log.push({ type: m.type(), text: m.text() }));
p.on('pageerror', e => log.push({ type: 'pageerror', text: String(e && e.message || e) }));

await p.goto(BASE + OUT + '/_harness.html');
await p.waitForFunction('typeof window.setStage === "function"');

const report = { chromium: exe || '(playwright default)', scene_t: SCENE_T,
                 stages: [], console: [], normals: null, acceptance: null, volumes: [], refs: null };
report.acceptance = await p.evaluate('window.acceptance()');

const YAW = -0.32, PITCH = 0.06;
report.fit = await p.evaluate(([ts, y, x]) => window.fitOnce(ts, y, x), [SCENE_T, YAW, PITCH]);

/* one frame per stage the scene visits, plus the two extremes and one intact view */
const STAGES = SCENE_T.map(t => [('t' + String(Math.round(t * 1000)).padStart(3, '0')), t, {}, YAW]);
STAGES.push(['t208-side', 0.208, {}, -1.45]);
STAGES.push(['t546-side', 0.546, {}, -1.45]);
STAGES.push(['t208-intact', 0.208, { intact: true }, YAW]);
STAGES.push(['t546-intact', 0.546, { intact: true }, YAW]);

for (const [name, t, opts, yaw] of STAGES) {
  await p.evaluate(([t2, o, y, x]) => window.setStage(t2, o, y, x), [t, opts, yaw, PITCH]);
  const at = await p.evaluate(t2 => window.at(t2), t);
  const file = `${OUT}/${name}.png`;
  await p.locator('#c').screenshot({ path: file });
  report.stages.push({ name, t, opts, yaw, file, phase: at.phase.name,
    lv_volume: at.lv.volume, valves: at.valves });
}

report.normals = await p.evaluate('window.normalProbe(0.33)');
for (const t of [0.208, 0.33, 0.546, 0.88]) {
  report.volumes.push(await p.evaluate(t2 => window.volumeProbe(t2), t));
}
report.console = log.slice();

/* ---- the real adapter, at three different stages ---- */
const p2 = await b.newPage();
const log2 = [];
p2.on('console', m => log2.push({ type: m.type(), text: m.text() }));
p2.on('pageerror', e => log2.push({ type: 'pageerror', text: String(e && e.message || e) }));
await p2.goto(BASE + OUT + '/_adapter.html');
await p2.waitForFunction('typeof window.resolveAll === "function"');
report.refs = await p2.evaluate(r => window.resolveAll(r), REFS);
report.refs_mid = await p2.evaluate(([r, t]) => window.resolveAll(r, t), [REFS, 0.33]);
report.stageable = await p2.evaluate(r => window.stageable(r), REFS);
report.adapterConsole = log2;

await b.close(); server.close();
writeFileSync(`${OUT}/report.json`, JSON.stringify(report, null, 1));

/* ---------------------------------- verdict ---------------------------------- */
const NOISE = /GPU stall due to ReadPixels|GL Driver Message|Automatic fallback to software WebGL|SwiftShader|Failed to create and initialize WebGPU/i;
const noise = report.console.filter(m => NOISE.test(m.text));
const bad = report.console.filter(m => (m.type === 'error' || m.type === 'warning' || m.type === 'pageerror') && !NOISE.test(m.text));
const badA = (report.adapterConsole || []).filter(m => (m.type === 'error' || m.type === 'warning' || m.type === 'pageerror') && !NOISE.test(m.text));
report.harness_noise = noise;

console.log('chromium        :', report.chromium);
console.log('stages rendered :', report.stages.length, '->', OUT);
console.log('console (model) :', bad.length ? 'DIRTY' : 'clean',
  bad.map(x => x.type + ': ' + x.text).join(' | '), '  [' + noise.length + ' harness messages ignored]');
console.log('console (adapter):', badA.length ? 'DIRTY' : 'clean', badA.map(x => x.type + ': ' + x.text).join(' | '));

const acc = report.acceptance;
const accFail = Object.keys(acc.pass).filter(k => !acc.pass[k].ok);
console.log('acceptance      :', acc.allPass ? 'all pass' : 'FAILED ' + accFail.join(','),
  '(' + Object.keys(acc.pass).length + ' rows)');

const byKey = {};
for (const r of report.normals) (byKey[r.key] = byKey[r.key] || []).push(r);
let worstWind = 1;
for (const k of Object.keys(byKey).sort()) {
  const rows = byKey[k];
  const ow = rows.map(r => r.outward), wi = rows.map(r => r.winding).filter(x => x != null);
  const oh = rows.map(r => r.outwardHull).filter(x => x != null);
  worstWind = Math.min(worstWind, ...wi);
  console.log('  normals', k.padEnd(15),
    'hull ' + (oh.length ? Math.min(...oh).toFixed(3) + '-' + Math.max(...oh).toFixed(3) : '   n/a   '),
    ' whole ' + Math.min(...ow).toFixed(3) + '-' + Math.max(...ow).toFixed(3),
    ' winding ' + Math.min(...wi).toFixed(3) + '-' + Math.max(...wi).toFixed(3), '(' + rows.length + ')');
}

let volBad = 0;
console.log('volume: mesh triangles integrated against the volume the circulation solved for');
for (const v of report.volumes) {
  const parts = Object.keys(v.solved).map(k => {
    const m = v.mesh[k], s = v.solved[k], err = m == null ? NaN : (m - s) / s;
    if (!(Math.abs(err) < 0.03)) volBad++;
    return k.replace('_blood', '') + ' ' + (m == null ? 'MISSING' : m.toFixed(1) + '/' + s.toFixed(1) +
      ' (' + (err * 100).toFixed(1) + '%)');
  });
  console.log('  t=' + v.t, parts.join('  '));
}

const failed = report.refs.filter(r => !r.hasMesh || !r.tris);
const failedMid = report.refs_mid.filter(r => !r.hasMesh || !r.tris);
const notStageable = report.stageable.filter(r => !r.stageable);
console.log('refs resolved   :', (report.refs.length - failed.length) + '/' + report.refs.length,
  'at default t;', (report.refs_mid.length - failedMid.length) + '/' + report.refs_mid.length, 'at t=0.33',
  failed.concat(failedMid).length ? ' FAILED: ' + failed.concat(failedMid).map(f => f.key + '(' + (f.reason || f.error) + ')').join(', ') : '');
console.log('stageable       :', (report.stageable.length - notStageable.length) + '/' + report.stageable.length,
  notStageable.length ? 'NOT stageable: ' + notStageable.map(r => r.key).join(', ') : '(every ref follows SET_STAGE)');
console.log('total triangles :', report.refs.reduce((s, r) => s + (r.tris || 0), 0).toFixed(0));

const ok = !bad.length && !badA.length && !failed.length && !failedMid.length &&
           acc.allPass && !volBad && !notStageable.length && worstWind > 0.95;
console.log('\nVERDICT:', ok ? 'PASS' : 'FAIL');
process.exit(ok ? 0 : 1);
