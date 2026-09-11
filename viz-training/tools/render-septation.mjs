/* MedBank · headless proof for models3d/septation-of-heart.js
 *
 * The five checks BUILD-TASK-PROMPT §3 requires before anything may be marked built:
 *   1. it renders — many values of t, screenshots to viz-training/models-out/septation-of-heart/
 *   2. the console is clean — no error, no warning, no throw
 *   3. normals point outward — per mesh, against that mesh's own centroid, plus the winding of every
 *      triangle against its own supplied normal, reported on the HULL portion separately
 *   4. it looks like the thing — the screenshots are for a human (and the review) to read
 *   5. every ref the scene names resolves THROUGH THE REAL ADAPTER in viz3d.js, with geometry
 *
 * Three more this model needs:
 *   6. NO OPEN LUMEN. Rays from each camera; the FIRST surface hit must not face away.
 *   7. THE BOXES ARE REAL. The floored relations acceptance() measures off the centreline are
 *      re-measured on actual mesh VERTICES — the crossing of the two channels above all, because
 *      that is the claim the whole outflow solve exists to deliver.
 *   8. THE NEGATIVE CASES BITE.
 *
 * WHERE THIS RUNS. In a Linux container with chromium, against a copy of the repo — the mounted repo
 * has no browser and no playwright. The files under test are byte identical.
 *
 * Run from the repo root:  node viz-training/tools/render-septation.mjs
 */
import { chromium } from 'playwright';
import { readFileSync, writeFileSync, mkdirSync, existsSync } from 'fs';
import http from 'http';
import path from 'path';
import fs from 'fs';

const ROOT = process.cwd();
const OUT = 'viz-training/models-out/septation-of-heart';
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

const SCENE = 'viz-training/scenes/embryology__cardiovascular-development__septation-of-heart.json';
const REFS = existsSync(SCENE)
  ? JSON.parse(readFileSync(SCENE, 'utf8')).structures
      .map(s => ({ key: s.key, ref: s.refs && s.refs.procedural })).filter(r => r.ref)
  : [];
const haveViz = existsSync('viz3d.js');

const W = 1020, H = 1120;
const G = { ghost: true };
const STAGES = [
  ['d25', 0.000, { ...G }, 'day 25 — one lumen, no septa'],
  ['d28', 0.097, { ...G }, 'day 28 — cushions appear, septum primum starts'],
  ['d31', 0.194, { ...G }, 'day 31 — ostium primum narrowing'],
  ['d34', 0.290, { ...G }, 'day 34 — ostium secundum open before the primum shuts'],
  ['d38', 0.419, { ...G }, 'day 38 — septum secundum descending'],
  ['d42', 0.548, { ...G }, 'day 42 — the outflow ridges'],
  ['d46', 0.677, { ...G }, 'day 46 — the interventricular foramen still open'],
  ['d50', 0.806, { ...G }, 'day 50 — the membranous part closes it'],
  ['d56', 1.000, { ...G }, 'day 56 — four chambers'],
  ['d56-solid', 1.000, {}, 'day 56, walls solid'],
  ['d25-solid', 0.000, {}, 'day 25, walls solid'],
  ['d56-chan', 1.000, { ...G, channels: true }, 'day 56 with the two channels'],
  ['d56-mid', 1.000, { ...G, midline: true }, 'day 56 with the median-plane reference'],
  ['d40-shunt', 0.484, { ...G, shunt: true }, 'the fetal right-to-left shunt'],
  ['v-avsd', 1.000, { ...G, avsd: true }, 'AVSD — the cushions never fused'],
  ['v-asd', 1.000, { ...G, asd: true }, 'secundum ASD — the overlap gone'],
  ['v-vsd', 1.000, { ...G, vsd: true }, 'membranous VSD'],
  ['v-tga', 1.000, { ...G, channels: true, transposition: true }, 'transposition — the twist dropped'],
  ['v-truncus', 1.000, { ...G, truncus_persistent: true }, 'persistent truncus arteriosus'],
  ['v-fallot', 1.000, { ...G, channels: true, fallot: true }, 'tetralogy — the septum displaced'],
];

const html = `<!doctype html><meta charset=utf8>
<link rel="icon" href="data:,">
<body style="margin:0;background:#0e1626">
<canvas id=c width=${W} height=${H}></canvas>
<script src="${BASE}node_modules/three/build/three.js"><\/script>
<script src="${BASE}models3d/render-kit.js"><\/script>
<script src="${BASE}models3d/septation-of-heart.js"><\/script>
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
const MOD = window.MB3D_MODELS['septation-of-heart'];
window.setStage = function (t, opts, yaw, pitch, show) {
  if (group) scene.remove(group);
  const holder = new THREE.Group();
  holder.add(MOD.build(t, Object.assign({}, opts || {})));
  group = holder;
  /* A VIEW IS ALSO WHAT IT SHOWS. The first version of this prover ignored each view's SHOW_STRUCTURE
     list and rendered the whole model at the view's t — so two views differing only in what they
     reveal came out as the SAME FRAME, and the frame-difference check reported 0.0% between beats 6
     and 7 and could not tell a real duplicate from its own blindness. */
  if (show && show.length) {
    const keep = {};
    for (const k of show) keep[k] = 1;
    group.traverse(function (o) {
      if (!o.isMesh) return;
      const k = o.userData && o.userData.key;
      if (k && !keep[k]) o.visible = false;
    });
  }
  group.rotation.y = yaw == null ? -0.20 : yaw;
  group.rotation.x = pitch == null ? 0.05 : pitch;
  group.updateMatrixWorld(true);
  scene.add(group);
  const f = VizKit.fitCamera(camera, group, 1.05);
  camera.position.set(f.centre.x, f.centre.y, f.centre.z + f.distance);
  camera.lookAt(f.centre);
  L.key.position.set(camera.position.x + 6, camera.position.y + 8, camera.position.z + 4);
  renderer.render(scene, camera);
  return true;
};

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
    function wind(limit) {
      let agree = 0, tris = 0;
      const a1 = new THREE.Vector3(), b1 = new THREE.Vector3(), c1 = new THREE.Vector3();
      const e1 = new THREE.Vector3(), e2 = new THREE.Vector3(), fn = new THREE.Vector3(), vn = new THREE.Vector3();
      for (let i = 0; i + 2 < limit; i += 3) {
        a1.fromBufferAttribute(p, i); b1.fromBufferAttribute(p, i+1); c1.fromBufferAttribute(p, i+2);
        fn.copy(e1.subVectors(b1, a1).cross(e2.subVectors(c1, a1)));
        if (fn.lengthSq() < 1e-16) continue;
        fn.normalize(); vn.set(0,0,0);
        for (let k = 0; k < 3; k++) vn.add(new THREE.Vector3().fromBufferAttribute(n, i+k));
        if (vn.lengthSq() < 1e-16) continue;
        vn.normalize(); tris++; if (fn.dot(vn) > 0) agree++;
      }
      return { tris: tris, frac: tris ? agree / tris : null };
    }
    const wAll = wind(p.count), wHull = wind(hull || p.count);
    rows.push({ key: u.key, verts: p.count, outward: out / p.count,
                hullVerts: hull, outwardHull: hull ? outHull / hull : null,
                tris: wAll.tris, winding: wAll.frac,
                hullTris: wHull.tris, hullWinding: wHull.frac });
  });
  return rows;
};

/* THE CROSSING, ON REAL MESH VERTICES. acceptance() measures the two channels off their solved
   centrelines; this measures them off the vertices actually drawn, which is where the claim is
   capable of being wrong. */
window.channelProbe = function (t, opts) {
  const g = MOD.build(t, Object.assign({ channels: true }, opts || {}));
  g.updateMatrixWorld(true);
  const acc = {};
  const v = new THREE.Vector3();
  g.traverse(function (o) {
    if (!o.isMesh || !o.geometry || (o.userData && o.userData.outline)) return;
    const k = o.userData && o.userData.key;
    if (k !== 'aortic_channel' && k !== 'pulmonary_channel') return;
    const p = o.geometry.attributes.position; if (!p) return;
    const a = acc[k] || (acc[k] = { lowN: 0, lowX: 0, lowZ: 0, lowY: 1e9, n: 0,
                                    hiN: 0, hiX: 0, hiZ: 0, hiY: -1e9, m: 0, pts: [] });
    for (let i = 0; i < p.count; i++) {
      v.fromBufferAttribute(p, i).applyMatrix4(o.matrixWorld);
      a.pts.push([v.x, v.y, v.z]);
    }
  });
  return acc;
};

/* NO OPEN LUMEN. */
const SOLID_KEYS = { sinus:1, atrium:1, ventricle:1, bulbus:1, truncus:1, av_cushions:1,
                     septum_primum:1, septum_secundum:1, muscular_ivs:1, membranous_ivs:1,
                     spiral_septum:1 };
window.lumenProbe = function (grid) {
  const N = grid || 96;
  const rc = new THREE.Raycaster();
  const targets = [];
  group.traverse(function (o) {
    if (!o.isMesh || !o.geometry) return;
    const u = o.userData || {};
    if (u.outline || !SOLID_KEYS[u.key]) return;
    if (o.material && o.material.transparent) return;
    targets.push(o);
  });
  const nm = new THREE.Matrix3();
  const a1 = new THREE.Vector3(), b1 = new THREE.Vector3(), c1 = new THREE.Vector3();
  const e1 = new THREE.Vector3(), e2 = new THREE.Vector3(), fn = new THREE.Vector3();
  let hits = 0, back = 0; const offenders = {};
  for (let iy = 0; iy < N; iy++) for (let ix = 0; ix < N; ix++) {
    const ndc = new THREE.Vector2((ix + 0.5) / N * 2 - 1, 1 - (iy + 0.5) / N * 2);
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
  return { rays: N * N, hits: hits, backfaceFirst: back, frac: hits ? back / hits : 0, offenders: offenders };
};

function readPixels() {
  const gl = renderer.getContext();
  const w = renderer.domElement.width, h = renderer.domElement.height;
  const buf = new Uint8Array(w * h * 4);
  gl.readPixels(0, 0, w, h, gl.RGBA, gl.UNSIGNED_BYTE, buf);
  return buf;
}
/* EVERY VIEW MUST CHANGE THE PICTURE. */
window.frameDiff = function (a, b) {
  window.setStage(a.t, a.opts || {}, a.yaw, a.pitch, a.show);
  const pa = readPixels();
  window.setStage(b.t, b.opts || {}, b.yaw, b.pitch, b.show);
  const pb = readPixels();
  let d = 0, lit = 0;
  for (let i = 0; i < pa.length; i += 4) {
    const dr = Math.abs(pa[i] - pb[i]) + Math.abs(pa[i+1] - pb[i+1]) + Math.abs(pa[i+2] - pb[i+2]);
    if (dr > 16) d++;
    if (pa[i] + pa[i+1] + pa[i+2] > 90 || pb[i] + pb[i+1] + pb[i+2] > 90) lit++;
  }
  return { changed: d, lit: lit, frac: lit ? d / lit : 0 };
};
window.midlinePixels = function (t, opts, yaw, pitch) {
  window.setStage(t, Object.assign({}, opts || {}, { midline: true }), yaw, pitch);
  const withPix = readPixels();
  window.setStage(t, Object.assign({}, opts || {}, { midline: false }), yaw, pitch);
  const withoutPix = readPixels();
  let diff = 0, subject = 0;
  for (let i = 0; i < withPix.length; i += 4) {
    const dr = Math.abs(withPix[i] - withoutPix[i]) + Math.abs(withPix[i+1] - withoutPix[i+1]) +
               Math.abs(withPix[i+2] - withoutPix[i+2]);
    if (dr > 12) diff++;
    if (withoutPix[i] + withoutPix[i+1] + withoutPix[i+2] > 90) subject++;
  }
  return { visible: diff, subjectPixels: subject, fracOfSubject: subject ? diff / subject : 0 };
};
window.acceptance = function () { return MOD.acceptance(); };
window.negatives  = function () { return MOD.negatives(); };
window.twist      = function () { const w = MOD.twist();
  return { localDeg: w.localDeg, worldDeg: w.worldDeg }; };
window.keysBuilt = function (t, opts) {
  const g = MOD.build(t, Object.assign({}, opts || {}));
  const s = {};
  g.traverse(o => { if (o.isMesh && o.userData && o.userData.key && !o.userData.outline)
    s[o.userData.key] = (s[o.userData.key] || 0) + o.geometry.attributes.position.count / 3; });
  return s;
};
<\/script>`;

writeFileSync(`${OUT}/_harness.html`, html);

const b = await chromium.launch({
  executablePath: process.env.PW_CHROME || '/opt/pw-browsers/chromium-1194/chrome-linux/chrome',
  args: ['--use-gl=swiftshader', '--enable-unsafe-swiftshader', '--no-sandbox'] });
const p = await b.newPage({ viewport: { width: W, height: H } });
const log = [];
p.on('console', m => log.push({ type: m.type(), text: m.text() }));
p.on('pageerror', e => log.push({ type: 'pageerror', text: String(e && e.message || e) }));

await p.goto(BASE + OUT + '/_harness.html');
try { await p.waitForFunction('typeof window.setStage === "function"'); }
catch (e) {
  console.error('HARNESS DID NOT INITIALISE. Page said:');
  for (const m of log) console.error('  ' + m.type + ': ' + m.text.slice(0, 500));
  throw e;
}

const report = {};
report.acceptance = await p.evaluate('window.acceptance()');
report.negatives = await p.evaluate('window.negatives()');
report.twist = await p.evaluate('window.twist()');
report.keysFull = await p.evaluate("window.keysBuilt(1, window.MB3D_MODELS['septation-of-heart'].FULL)");

report.stages = [];
for (const [name, t, opts, label] of STAGES) {
  await p.evaluate(([t2, o]) => window.setStage(t2, o, -0.20, 0.05), [t, opts]);
  const file = `${OUT}/${name}.png`;
  await p.locator('#c').screenshot({ path: file });
  report.stages.push({ name, t, label, file });
}

report.normals1 = await p.evaluate("window.normalProbe(1, Object.assign({ghost:false}, window.MB3D_MODELS['septation-of-heart'].FULL))");
report.normals0 = await p.evaluate('window.normalProbe(0.30, {})');

report.lumen = [];
for (const [nm2, t2, o2, yaw, pitch] of [
  ['anterior day 25',  0.00, {}, -0.20, 0.05],
  ['anterior day 40',  0.484, {}, -0.20, 0.05],
  ['anterior day 56',  1.00, {}, -0.20, 0.05],
  ['left lateral',     1.00, {}, -1.50, 0.05],
  ['right lateral',    1.00, {},  1.50, 0.05],
  ['from above',       1.00, {}, -0.20, -1.15],
  ['from below',       1.00, {}, -0.20, 1.15],
  ['from behind',      1.00, {},  2.95, 0.05],
]) {
  await p.evaluate(([t3, o3, y3, pi3]) => window.setStage(t3, o3, y3, pi3), [t2, o2, yaw, pitch]);
  const r2 = await p.evaluate('window.lumenProbe(96)');
  await p.locator('#c').screenshot({ path: `${OUT}/lumen-${nm2.replace(/[^a-z0-9]+/gi, '-')}.png` });
  report.lumen.push(Object.assign({ camera: nm2, t: t2 }, r2));
}

/* the crossing, on real vertices */
const chan = await p.evaluate('window.channelProbe(1, {})');
const chanT = await p.evaluate('window.channelProbe(1, { transposition: true })');
function boxOf(pts) {
  const b2 = { minx:1e9,maxx:-1e9,miny:1e9,maxy:-1e9,minz:1e9,maxz:-1e9,cx:0,cy:0,cz:0,n:0 };
  for (const [x,y,z] of pts) {
    b2.minx=Math.min(b2.minx,x); b2.maxx=Math.max(b2.maxx,x);
    b2.miny=Math.min(b2.miny,y); b2.maxy=Math.max(b2.maxy,y);
    b2.minz=Math.min(b2.minz,z); b2.maxz=Math.max(b2.maxz,z);
    b2.cx+=x;b2.cy+=y;b2.cz+=z;b2.n++;
  }
  b2.cx/=b2.n;b2.cy/=b2.n;b2.cz/=b2.n; return b2;
}
/* the PROXIMAL fifth of each channel is the part that sits over a ventricle; the DISTAL fifth is
   the part whose dorsoventral order is the arterial claim. Split by y, since the outflow runs
   cranially. */
function split(pts) {
  const ys = pts.map(q => q[1]).sort((a2,b2)=>a2-b2);
  const lo = ys[Math.floor(ys.length*0.18)], hi = ys[Math.floor(ys.length*0.62)];
  return { prox: boxOf(pts.filter(q => q[1] <= lo)), dist: boxOf(pts.filter(q => q[1] >= hi)) };
}
report.crossing = {};
for (const [tag, data] of [['normal', chan], ['transposition', chanT]]) {
  const A = split(data.aortic_channel.pts), P2 = split(data.pulmonary_channel.pts);
  const extX = 0.5 * ((A.prox.maxx - A.prox.minx) + (P2.prox.maxx - P2.prox.minx));
  const extZ = 0.5 * ((A.dist.maxz - A.dist.minz) + (P2.dist.maxz - P2.dist.minz));
  report.crossing[tag] = {
    proxAortaX: A.prox.cx, proxPulmX: P2.prox.cx,
    proxSepX: (A.prox.cx - P2.prox.cx), proxSepFrac: (A.prox.cx - P2.prox.cx) / extX,
    distAortaZ: A.dist.cz, distPulmZ: P2.dist.cz,
    distSepZ: (P2.dist.cz - A.dist.cz), distSepFrac: (P2.dist.cz - A.dist.cz) / extZ,
  };
}

report.midline = [];
for (const [nm2, t2] of [['anterior day 56', 1.00], ['anterior day 34', 0.29]]) {
  const r2 = await p.evaluate(t3 => window.midlinePixels(t3, { ghost: true }, -0.20, 0.05), t2);
  report.midline.push(Object.assign({ camera: nm2, t: t2 }, r2));
}

/* EVERY VIEW MUST CHANGE THE PICTURE — and it must be the SCENE'S OWN views, at the t each of them
   names, not a list of frames the prover made up. The first version of this file measured nine
   frames of its own choosing and the build log nearly reported that number as if it were the scene's.
   The t comes from each view's SET_STAGE op; the options come from what the view SHOWs, so a view
   that shows the channels is rendered with them. */
function viewFramesFromScene() {
  if (!existsSync(SCENE)) return null;
  const sc = JSON.parse(readFileSync(SCENE, 'utf8'));
  const keysOf = v => new Set(v.ops.filter(o => o.op === 'SHOW_STRUCTURE').map(o => o.target));
  return sc.views.map(v => {
    const st = v.ops.find(o => o.op === 'SET_STAGE');
    const k = keysOf(v);
    const rot = v.ops.filter(o => o.op === 'ROTATE_TO_VIEW').pop();
    const opts = { ghost: true };
    if (k.has('aortic_channel') || k.has('pulmonary_channel') || k.has('tga') ||
        k.has('fallot') || k.has('truncus_persistent')) opts.channels = true;
    if (k.has('shunt')) opts.shunt = true;
    if (k.has('midline')) opts.midline = true;
    if (k.has('avsd')) opts.avsd = true;
    if (k.has('vsd')) opts.vsd = true;
    if (k.has('fallot')) opts.fallot = true;
    return { name: v.beat + ' ' + v.title, t: st ? st.t : 1, opts: opts,
             show: Array.from(k),
             yaw: (rot && rot.view === 'lateral') ? -1.50 : -0.20, pitch: 0.05 };
  });
}
const VIEW_FRAMES = viewFramesFromScene() || [
  { name: '1 one lumen',     t: 0.000, opts: { ghost: true, midline: true }, yaw: -0.20 },
  { name: '2 cushions',      t: 0.323, opts: { ghost: true }, yaw: -0.20, pitch: 0.55 },
  { name: '3 atrial septa',  t: 0.484, opts: { ghost: true, shunt: true }, yaw: -1.50 },
  { name: '4 flap valve',    t: 0.800, opts: { ghost: true, shunt: true }, yaw: -1.50 },
  { name: '5 ivs',           t: 0.613, opts: { ghost: true }, yaw: -0.20 },
  { name: '6 membranous',    t: 0.871, opts: { ghost: true }, yaw: -0.20 },
  { name: '7 spiral',        t: 1.000, opts: { ghost: true, channels: true }, yaw: -0.20 },
  { name: '8 crossing',      t: 1.000, opts: { ghost: true, channels: true }, yaw: -1.50 },
  { name: '9 defects',       t: 1.000, opts: { ghost: true, channels: true, fallot: true }, yaw: -0.20 },
];
report.viewDiffs = [];
for (let i = 1; i < VIEW_FRAMES.length; i++) {
  const d = await p.evaluate(([a, c]) => window.frameDiff(a, c), [VIEW_FRAMES[i - 1], VIEW_FRAMES[i]]);
  report.viewDiffs.push({ from: VIEW_FRAMES[i - 1].name, to: VIEW_FRAMES[i].name, ...d });
}
for (const v of VIEW_FRAMES) {
  await p.evaluate(a => window.setStage(a.t, a.opts, a.yaw, a.pitch, a.show), v);
  await p.locator('#c').screenshot({ path: `${OUT}/view-${v.name.replace(/[^a-z0-9]+/gi, '-')}.png` });
}

report.console = log.slice();

/* ---- the real adapter ---- */
if (haveViz && REFS.length) {
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
  const p2 = await b.newPage();
  const log2 = [];
  p2.on('console', m => log2.push({ type: m.type(), text: m.text() }));
  p2.on('pageerror', e => log2.push({ type: 'pageerror', text: String(e && e.message || e) }));
  await p2.goto(BASE + OUT + '/_adapter.html');
  await p2.waitForFunction('typeof window.resolveAll === "function"');
  report.refs = await p2.evaluate(r => window.resolveAll(r), REFS);
  report.adapterConsole = log2;
} else {
  report.refs = null; report.adapterConsole = [];
  report.adapterSkipped = haveViz ? 'the scene names no procedural refs' : 'viz3d.js not present';
}

await b.close(); server.close();

const NOISE = /GPU stall due to ReadPixels|GL Driver Message|Automatic fallback to software WebGL|SwiftShader/i;
const noise = report.console.filter(m => NOISE.test(m.text));
const bad = report.console.filter(m => (m.type === 'error' || m.type === 'warning' || m.type === 'pageerror') && !NOISE.test(m.text));
const badA = (report.adapterConsole || []).filter(m => m.type === 'error' || m.type === 'warning' || m.type === 'pageerror');

console.log('stages rendered  :', report.stages.length);
console.log('console (model)  :', bad.length ? 'DIRTY' : 'clean',
  bad.map(x => x.type + ': ' + x.text.slice(0, 300)).join(' | '), '  [' + noise.length + ' swiftshader messages ignored]');
console.log('console (adapter):', report.refs ? (badA.length ? 'DIRTY' : 'clean') : 'skipped — ' + report.adapterSkipped,
  badA.map(x => x.type + ': ' + x.text.slice(0, 300)).join(' | '));
console.log('acceptance       :', JSON.stringify(report.acceptance.pass), 'allPass=' + report.acceptance.allPass);
console.log('negative cases   :', report.negatives.allGood ? 'every test rejects its wrong input'
  : 'A TEST DID NOT BITE: ' + JSON.stringify(report.negatives.cases));
console.log('twist            : local ' + report.twist.localDeg.toFixed(1) + ' deg, world ' + report.twist.worldDeg.toFixed(1) + ' deg');
console.log('keys built (FULL):', Object.keys(report.keysFull).length, JSON.stringify(report.keysFull));

for (const [tag, rows] of [['day 56', report.normals1], ['day 34', report.normals0]]) {
  const byKey = {};
  for (const r of rows) (byKey[r.key] = byKey[r.key] || []).push(r);
  console.log('normals ' + tag + ':');
  for (const k of Object.keys(byKey)) {
    const rs = byKey[k];
    const oh = rs.map(r => r.outwardHull).filter(x => x != null);
    const hw = rs.map(r => r.hullWinding).filter(x => x != null);
    const ow = rs.map(r => r.outward);
    console.log('   ' + String(k).padEnd(18),
      'outward(hull) ' + (oh.length ? Math.min(...oh).toFixed(3) + '-' + Math.max(...oh).toFixed(3) : '  n/a  '),
      ' winding(hull) ' + (hw.length ? Math.min(...hw).toFixed(3) + '-' + Math.max(...hw).toFixed(3) : ' n/a '),
      ' whole-buffer out ' + Math.min(...ow).toFixed(3) + '-' + Math.max(...ow).toFixed(3),
      ' (' + rs.length + ')');
  }
}
console.log('open lumen       :');
for (const r of report.lumen) console.log('   ' + r.camera.padEnd(20),
  'hits ' + String(r.hits).padStart(5), ' backface-first ' + String(r.backfaceFirst).padStart(4),
  ' = ' + (r.frac * 100).toFixed(2) + '%', JSON.stringify(r.offenders));
console.log('crossing (real vertices):');
for (const k of Object.keys(report.crossing)) {
  const c = report.crossing[k];
  console.log('   ' + k.padEnd(14), 'proximal aorta-minus-pulm x = ' + c.proxSepX.toFixed(3) +
    ' (' + c.proxSepFrac.toFixed(2) + ' of extent)', ' distal pulm-minus-aorta z = ' +
    c.distSepZ.toFixed(3) + ' (' + c.distSepFrac.toFixed(2) + ')');
}
console.log('median plane     :', report.midline.map(m => m.camera + ' ' + (m.fracOfSubject * 100).toFixed(1) + '% of subject').join(' | '));
console.log('view diffs       :');
for (const d of report.viewDiffs) console.log('   ' + d.from + ' -> ' + d.to, (d.frac * 100).toFixed(1) + '% of lit pixels changed');
console.log('refs             :', report.refs ? report.refs.map(r => r.key + '=' + (r.hasMesh ? r.tris + ' tris' : (r.reason || r.error))).join(', ') : 'skipped');

writeFileSync(`${OUT}/report.json`, JSON.stringify(report, null, 1));
console.log('\nreport written to ' + OUT + '/report.json');
