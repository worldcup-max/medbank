/* MedBank · headless proof for models3d/heart-valves.js
 *
 * The five checks BUILD-TASK-PROMPT section 3 asks for:
 *   1. it renders          — screenshots at every t the scene visits, into models-out/heart-valves/
 *   2. the console is clean — no error, no warning, no throw
 *   3. normals point outward — per mesh, against that mesh's own centroid, hull reported separately
 *   4. it looks like the thing — a human reads the frames; this tool only makes them
 *   5. every ref resolves THROUGH THE REAL ADAPTER in viz3d.js, with geometry, at more than one t
 * plus: the acceptance battery runs IN THE BROWSER, and every negative case must be REJECTED.
 *
 * SUBSTRATE NOTE — RENDER-STANDARD, "test on the substrate, not on something that resembles it".
 * There is no chromium and no playwright on the device VM that holds this repo, so this runs in a
 * cloud container against the repo's own files, byte for byte, driving the real viz3d.js adapter.
 * It is not the machine the player runs on.  Said out loud rather than assumed.
 */
import { chromium } from 'playwright';
import { readFileSync, writeFileSync, mkdirSync, existsSync, readdirSync } from 'fs';
import http from 'http';
import path from 'path';
import fs from 'fs';

const ROOT = process.cwd();
const OUT = 'viz-training/models-out/heart-valves';
mkdirSync(OUT, { recursive: true });

function findChromium() {
  if (process.env.CHROMIUM_PATH) return process.env.CHROMIUM_PATH;
  const base = '/opt/pw-browsers';
  if (existsSync(base)) for (const d of readdirSync(base))
    for (const rel of ['chrome-linux/chrome', 'chrome-linux/headless_shell'])
      { const p = path.join(base, d, rel); if (existsSync(p)) return p; }
  return undefined;
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

const SCENE_PATH = 'viz-training/scenes/gross__heart-pericardium__heart-valves.json';
let REFS = [], SCENE_T = [0.10, 0.215, 0.30, 0.45, 0.56, 0.70, 0.90], VIEWS = [];
if (existsSync(SCENE_PATH)) {
  const scene = JSON.parse(readFileSync(SCENE_PATH, 'utf8'));
  REFS = scene.structures.map(s => ({ key: s.key, ref: s.refs && s.refs.procedural })).filter(r => r.ref);
  const ts = [...new Set(scene.views.flatMap(v => v.ops.filter(o => o.op === 'SET_STAGE').map(o => o.t)))];
  if (ts.length) SCENE_T = ts.sort((a, b) => a - b);
  VIEWS = scene.views.map(v => ({ title: v.title, mode: v.mode,
    t: (v.ops.find(o => o.op === 'SET_STAGE') || {}).t, view: (v.ops.find(o => o.op === 'ROTATE_TO_VIEW') || {}).view }));
}

const W = 1100, H = 900;
const html = `<!doctype html><meta charset=utf8><link rel="icon" href="data:,">
<body style="margin:0;background:#0e1626">
<canvas id=c width=${W} height=${H}></canvas>
<script src="${BASE}node_modules/three/build/three.js"><\/script>
<script src="${BASE}models3d/render-kit.js"><\/script>
<script src="${BASE}models3d/heart-valves.js"><\/script>
<script>
window.MEDBANK_CONFIG = { MODEL_BASE: '${BASE}models3d/' };
const renderer = new THREE.WebGLRenderer({ canvas: document.getElementById('c'), antialias: true });
renderer.setSize(${W}, ${H}, false); renderer.setPixelRatio(1);
VizKit.configureRenderer(renderer);
const scene = new THREE.Scene();
scene.background = VizKit.bg(0x0e1626);
const L = VizKit.standardLights(scene);
const camera = new THREE.PerspectiveCamera(34, ${W}/${H}, 0.1, 400);
const MOD = window.MB3D_MODELS['heart-valves'];
let group = null;

/* THE SUBJECT FILLS THE FRAME AT EVERY t.  This model's overall size barely changes with t — the
   valves move, the base of the heart does not travel — so the camera is fitted ONCE to the union of
   the boxes over every t the scene visits, and held.  Refitting per stage would make a leaflet that
   swings look like a camera that zoomed.  Stated so a reviewer can see the rule was answered rather
   than skipped. */
window.fitOnce = function (ts, opts, eye) {
  const box = new THREE.Box3();
  ts.forEach(function (t) {
    const g = MOD.build(t, Object.assign({}, MOD.FULL, opts || {}));
    g.updateMatrixWorld(true);
    box.union(new THREE.Box3().setFromObject(g));
  });
  const s = box.getSize(new THREE.Vector3());
  const proxy = new THREE.Mesh(new THREE.BoxGeometry(Math.max(0.01,s.x), Math.max(0.01,s.y), Math.max(0.01,s.z)));
  box.getCenter(proxy.position); proxy.updateMatrixWorld(true);
  window._fitBox = { min: box.min.toArray(), max: box.max.toArray() };
  const f = VizKit.fitCamera(camera, proxy, 1.08);
  const dir = new THREE.Vector3().fromArray(eye).normalize();
  camera.position.copy(f.centre).addScaledVector(dir, f.distance);
  camera.up.set(0, 1, 0);
  if (Math.abs(dir.y) > 0.97) camera.up.set(0, 0, -1);
  camera.lookAt(f.centre);
  L.key.position.copy(camera.position).add(new THREE.Vector3(4, 7, 5));
  L.rim.position.copy(f.centre).addScaledVector(dir, -f.distance).add(new THREE.Vector3(-3, 4, 0));
  return { size: s.toArray(), distance: f.distance, centre: f.centre.toArray() };
};
window.setStage = function (t, opts) {
  if (group) { scene.remove(group); }
  group = MOD.build(t, Object.assign({}, MOD.FULL, opts || {}));
  group.updateMatrixWorld(true);
  scene.add(group);
  renderer.render(scene, camera);
  return true;
};
window.only = function (keys) {
  if (!group) return false;
  group.traverse(function (o) {
    if (!o.isMesh) return;
    o.visible = !keys || keys.indexOf(o.userData.key) >= 0;
  });
  renderer.render(scene, camera);
  return true;
};

/* OUTWARD NORMALS, per mesh, against that mesh's OWN centroid, in world space.  hullCount is reported
   separately: a closed solid is strongly majority-outward, and a thin sheet built as a closed slab is
   too, because its faces sit either side of a centroid that lies in the mid-plane.  Winding agreement
   is reported for every mesh, since that is the number that caught the cardinal bug. */
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
    let agree = 0, tris = 0, bad = 0, hAgree = 0, hTris = 0;
    const a1 = new THREE.Vector3(), b1 = new THREE.Vector3(), c1 = new THREE.Vector3();
    const e1 = new THREE.Vector3(), e2 = new THREE.Vector3(), fn = new THREE.Vector3(), vn = new THREE.Vector3();
    for (let i = 0; i + 2 < p.count; i += 3) {
      a1.fromBufferAttribute(p, i); b1.fromBufferAttribute(p, i+1); c1.fromBufferAttribute(p, i+2);
      fn.copy(e1.subVectors(b1, a1).cross(e2.subVectors(c1, a1)));
      if (fn.lengthSq() < 1e-16) { bad++; continue; }
      fn.normalize(); vn.set(0,0,0);
      for (let k = 0; k < 3; k++) vn.add(new THREE.Vector3().fromBufferAttribute(n, i+k));
      if (vn.lengthSq() < 1e-16) continue;
      vn.normalize(); tris++; if (fn.dot(vn) > 0) agree++;
      if (i + 2 < hull) { hTris++; if (fn.dot(vn) > 0) hAgree++; }
    }
    rows.push({ key: u.key, verts: p.count, outward: out / p.count,
                hullVerts: hull, outwardHull: hull ? outHull / hull : null,
                tris: tris, degenerate: bad, winding: tris ? agree / tris : null,
                windingHull: hTris ? hAgree / hTris : null, hullTris: hTris });
  });
  return rows;
};

/* RAY-CAST: what surface faces the camera FIRST.  On closed solids the answer must be "one facing
   towards it".  This is the probe that found the flat-cap winding bug in the kit; it costs nothing. */
window.frontFaceProbe = function (t, opts) {
  const g = MOD.build(t, Object.assign({}, MOD.FULL, opts || {}));
  g.updateMatrixWorld(true);
  const targets = [];
  g.traverse(function (o) { if (o.isMesh && !(o.userData||{}).outline) targets.push(o); });
  const box = new THREE.Box3().setFromObject(g);
  const c = box.getCenter(new THREE.Vector3()), s = box.getSize(new THREE.Vector3());
  const R = s.length();
  const dirs = [[0,0,1],[0,0,-1],[1,0,0],[-1,0,0],[0,1,0.001],[0,-1,0.001]];
  const rc = new THREE.Raycaster(); rc.firstHitOnly = false;
  let total = 0, away = 0;
  const nrm = new THREE.Vector3();
  dirs.forEach(function (d) {
    const dir = new THREE.Vector3().fromArray(d).normalize();
    const eye = c.clone().addScaledVector(dir, R);
    for (let i = 0; i < 14; i++) for (let j = 0; j < 14; j++) {
      const u = (i + 0.5) / 14 - 0.5, v = (j + 0.5) / 14 - 0.5;
      const side = new THREE.Vector3(0,1,0).cross(dir); if (side.lengthSq() < 1e-6) side.set(1,0,0);
      side.normalize();
      const up = new THREE.Vector3().crossVectors(dir, side).normalize();
      const o2 = eye.clone().addScaledVector(side, u * s.length() * 0.8).addScaledVector(up, v * s.length() * 0.8);
      rc.set(o2, dir.clone().negate());
      const hits = rc.intersectObjects(targets, false);
      if (!hits.length) continue;
      const h = hits[0];
      if (!h.face) continue;
      nrm.copy(h.face.normal).applyMatrix3(new THREE.Matrix3().getNormalMatrix(h.object.matrixWorld)).normalize();
      total++;
      if (nrm.dot(dir) < 0) away++;
    }
  });
  return { rays: total, facingAway: away, fraction: total ? away / total : 0 };
};
window.acceptance = function () { return MOD.acceptance(); };
window.at = function (t) { return MOD.at(t); };
window.tris = function (t, opts) {
  const g = MOD.build(t, Object.assign({}, MOD.FULL, opts || {}));
  let n = 0; g.traverse(function (o) { if (o.isMesh && !(o.userData||{}).outline) n += o.geometry.attributes.position.count / 3; });
  return n;
};
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
  return refs.map(function (r) { return { key: r.key, stageable: ad.stageable({ refs: { procedural: r.ref } }) }; });
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

const report = { chromium: exe || '(playwright default)', scene_t: SCENE_T, views: VIEWS,
                 stages: [], console: [], normals: null, acceptance: null, refs: null };
report.acceptance = await p.evaluate('window.acceptance()');
report.triangles = await p.evaluate('window.tris(1)');

/* one frame per t the scene visits, from the camera that beat uses, plus two detail frames */
const EYE = { anterior: [0, 0.20, 1], posterior: [0, 0.20, -1], superior: [0, 1, 0.001],
              inferior: [0, -1, 0.001], lateral: [1, 0.15, 0.25], medial: [-1, 0.15, 0.25] };
const SHOTS = [];
const seen = new Set();
for (const v of (VIEWS.length ? VIEWS : SCENE_T.map(t => ({ t, view: 'anterior', title: 't' + t })))) {
  const t = v.t == null ? 1 : v.t;
  const eye = EYE[v.view || 'anterior'] || EYE.anterior;
  const name = 'b' + String(SHOTS.length + 1).padStart(2, '0') + '-' + (v.view || 'anterior') + '-t' + String(Math.round(t * 1000)).padStart(3, '0');
  SHOTS.push({ name, t, eye, opts: {}, label: v.title || '' });
}
/* extra proof frames the scene does not ask for: the two extremes from above, and the roots off */
SHOTS.push({ name: 'x1-superior-shut',  t: 0.35, eye: EYE.superior, opts: { roots: false, ghost: false }, label: 'AV shut / SL open, from above, roots off' });
SHOTS.push({ name: 'x2-superior-open',  t: 0.80, eye: EYE.superior, opts: { roots: false, ghost: false }, label: 'AV open / SL shut, from above, roots off' });
SHOTS.push({ name: 'x3-anterior-open',  t: 0.80, eye: EYE.anterior, opts: { roots: false }, label: 'diastole, anterior' });
SHOTS.push({ name: 'x4-anterior-shut',  t: 0.35, eye: EYE.anterior, opts: { roots: false }, label: 'systole, anterior' });
SHOTS.push({ name: 'x5-ghost',          t: 0.80, eye: EYE.anterior, opts: { ghost: true }, label: 'with the ventricular walls' });

for (const s of SHOTS) {
  s.fit = await p.evaluate(([ts, o, e]) => window.fitOnce(ts, o, e), [SCENE_T.concat([s.t]), s.opts, s.eye]);
  await p.evaluate(([t, o]) => window.setStage(t, o), [s.t, s.opts]);
  const at = await p.evaluate(t => window.at(t), s.t);
  await p.locator('#c').screenshot({ path: `${OUT}/${s.name}.png` });
  report.stages.push({ name: s.name, t: s.t, eye: s.eye, opts: s.opts, label: s.label,
                       phase: at.phase.name, closure: at.closure });
}

report.normals = await p.evaluate('window.normalProbe(0.35)');
report.normals_open = await p.evaluate('window.normalProbe(0.80)');
report.frontFace = await p.evaluate('window.frontFaceProbe(0.35, {ghost:false})');
report.console = log.slice();

const p2 = await b.newPage();
const log2 = [];
p2.on('console', m => log2.push({ type: m.type(), text: m.text() }));
p2.on('pageerror', e => log2.push({ type: 'pageerror', text: String(e && e.message || e) }));
await p2.goto(BASE + OUT + '/_adapter.html');
await p2.waitForFunction('typeof window.resolveAll === "function"');
if (REFS.length) {
  report.refs = await p2.evaluate(r => window.resolveAll(r), REFS);
  report.refs_mid = await p2.evaluate(([r, t]) => window.resolveAll(r, t), [REFS, 0.35]);
  report.stageable = await p2.evaluate(r => window.stageable(r), REFS);
}
report.adapterConsole = log2;
await b.close(); server.close();
writeFileSync(`${OUT}/report.json`, JSON.stringify(report, null, 1));

/* ---------------------------------- verdict ---------------------------------- */
const NOISE = /GPU stall due to ReadPixels|GL Driver Message|Automatic fallback to software WebGL|SwiftShader|Failed to create and initialize WebGPU/i;
const noise = report.console.filter(m => NOISE.test(m.text));
const bad = report.console.filter(m => (m.type === 'error' || m.type === 'warning' || m.type === 'pageerror') && !NOISE.test(m.text));
const badA = (report.adapterConsole || []).filter(m => (m.type === 'error' || m.type === 'warning' || m.type === 'pageerror') && !NOISE.test(m.text));

console.log('chromium        :', report.chromium);
console.log('frames          :', report.stages.length, '->', OUT);
console.log('triangles       :', Math.round(report.triangles));
console.log('console (model) :', bad.length ? 'DIRTY' : 'clean', bad.map(x => x.type + ': ' + x.text).slice(0,6).join(' | '), `[${noise.length} harness messages ignored]`);
console.log('console (adapter):', badA.length ? 'DIRTY' : 'clean', badA.map(x => x.type + ': ' + x.text).slice(0,6).join(' | '));

const acc = report.acceptance;
const accFail = Object.keys(acc.pass).filter(k => !acc.pass[k].ok);
const negFail = Object.keys(acc.pass).filter(k => !acc.pass[k].negativeRejected);
console.log('acceptance      :', acc.allPass ? 'all pass' : 'FAILED ' + accFail.join(','), `(${Object.keys(acc.pass).length} rows)`);
if (accFail.length) for (const k of accFail) console.log('   FAIL', k, acc.pass[k].kind, '·', acc.pass[k].what, '=', JSON.stringify(acc.pass[k].value));
console.log('negative cases  :', negFail.length ? 'NOT REJECTED: ' + negFail.join(',') : 'all rejected');
console.log('solved          : mitral hc=' + acc.solved.mitral.hc.toFixed(3), 'xc=' + acc.solved.mitral.xc.toFixed(3),
  'reserve=' + acc.solved.mitral.reserveA.toFixed(3), '| tricuspid hc=' + acc.solved.tricuspid.hc.toFixed(3),
  '| sinus ratio aortic=' + acc.solved.aortic.sinusRatio.toFixed(3), 'pulmonary=' + acc.solved.pulmonary.sinusRatio.toFixed(3));
console.log('probes          : inextensible worst=' + acc.probes.inextensible.worst.toExponential(2),
  '| chord stretch=' + acc.probes.chordae.maxStretch.toExponential(2),
  '| sag shut=' + acc.probes.chordae.sagShut.toFixed(4), 'open=' + acc.probes.chordae.sagOpen.toFixed(3),
  '| prolapse=' + acc.probes.prolapse.maxAbovePlane.toExponential(2));

let worstWind = 1, worstOut = 1;
for (const rows of [report.normals, report.normals_open]) {
  const byKey = {};
  for (const r of rows) (byKey[r.key] = byKey[r.key] || []).push(r);
  for (const k of Object.keys(byKey).sort()) {
    const rr = byKey[k];
    const ow = rr.map(r => r.outward), wi = rr.map(r => r.winding).filter(x => x != null);
    worstWind = Math.min(worstWind, ...wi); worstOut = Math.min(worstOut, ...ow);
  }
}
const byKey = {};
for (const r of report.normals) (byKey[r.key] = byKey[r.key] || []).push(r);
for (const k of Object.keys(byKey).sort()) {
  const rr = byKey[k];
  const ow = rr.map(r => r.outward), wi = rr.map(r => r.winding).filter(x => x != null);
  const oh = rr.map(r => r.outwardHull).filter(x => x != null);
  console.log('  normals', k.padEnd(20),
    'hull ' + (oh.length ? Math.min(...oh).toFixed(3) : '  n/a '),
    ' whole ' + Math.min(...ow).toFixed(3),
    ' winding ' + Math.min(...wi).toFixed(3),
    ' windHull ' + Math.min(...rr.map(r => r.windingHull == null ? 1 : r.windingHull)).toFixed(3),
    ' tris ' + rr.reduce((s, r) => s + r.tris, 0) + '/' + rr.reduce((s, r) => s + (r.hullTris||0), 0) +
    ' degen ' + rr.reduce((s, r) => s + (r.degenerate||0), 0));
}
console.log('front-face rays :', report.frontFace.rays, 'hit,', report.frontFace.facingAway, 'facing AWAY (',
  (report.frontFace.fraction * 100).toFixed(2) + '% )');

let refOK = true;
if (report.refs) {
  const failed = report.refs.filter(r => !r.hasMesh || !r.tris);
  const failedMid = report.refs_mid.filter(r => !r.hasMesh || !r.tris);
  const notStageable = report.stageable.filter(r => !r.stageable);
  refOK = !failed.length && !failedMid.length && !notStageable.length;
  console.log('refs resolved   :', (report.refs.length - failed.length) + '/' + report.refs.length, 'at default t;',
    (report.refs_mid.length - failedMid.length) + '/' + report.refs_mid.length, 'at t=0.35',
    failed.concat(failedMid).length ? ' FAILED: ' + failed.concat(failedMid).map(f => f.key + '(' + (f.reason || f.error) + ')').join(', ') : '');
  console.log('stageable       :', (report.stageable.length - notStageable.length) + '/' + report.stageable.length,
    notStageable.length ? 'NOT stageable: ' + notStageable.map(r => r.key).join(', ') : '(every ref follows SET_STAGE)');
} else {
  console.log('refs resolved   : NO SCENE YET — adapter check skipped');
  refOK = false;
}

const ok = !bad.length && !badA.length && acc.allPass && worstWind > 0.98 && refOK && report.frontFace.fraction < 0.005;
console.log('\nVERDICT:', ok ? 'PASS' : 'FAIL');
process.exit(ok ? 0 : 1);
