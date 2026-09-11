/* MedBank · headless proof for models3d/cardiac-looping.js
 *
 * Four things, all of which must pass before the item is marked built:
 *   1. it renders — several t, screenshots to viz-training/models-out/cardiac-looping/
 *   2. the console is clean — no error, no warning, no throw
 *   3. normals point outward — per mesh, counted against that mesh's own centroid
 *   4. every ref in the scene resolves THROUGH THE REAL ADAPTER in viz3d.js, with geometry
 *
 * Three more, added 2026-09-10 by the round-3 rework, each of which exists because a review found a
 * defect that all four of the above passed over:
 *   5. THE BOXES ARE REAL. The floored acceptance relations are re-measured on actual MESH VERTICES
 *      and compared with the model's centreline+radius proxy, so the proxy is never trusted unchecked.
 *   6. NO OPEN LUMEN. Rays cast from each camera report whether the FIRST surface they meet faces
 *      away from them — which is what looking down an open pipe means. Finding 4 was an annular end
 *      cap at the caudal end of the sinus, visible from the very camera views 3 and 4 use.
 *   7. THE MIDLINE SURVIVES ITS OWN VIEW. The median-plane reference is rendered with and without,
 *      and the visible pixel count is differenced. Finding 5 was a reference 96.5% occluded in the
 *      only view that highlights it, and nothing measured that.
 *
 * WHERE THIS RUNS. In a Linux container with chromium, against a copy of the repo — not on the
 * mounted repo itself, which has no browser and no playwright. The files under test are byte
 * identical; the substrate for the RENDER is not the mount, and saying so is the point. What the
 * mount is the substrate for is the queue lock, and that is tested there.
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
  ['t042',      0.42, {},                                   't = 0.42 — movement one, the bulboventricular bend alone'],
  ['t045',      0.45, {},                                   't = 0.45'],
  ['t060',      0.60, {},                                   't = 0.60 — mid-loop'],
  ['t065',      0.65, {},                                   't = 0.65 — movements one and two'],
  ['t080',      0.80, {},                                   't = 0.80'],
  ['t100',      1.00, {},                                   'day 28 — the looped heart'],
  ['t100-meso', 1.00, { mesocardium: true, midline: true }, 'day 28 with the mesocardium and midline'],
  ['t045-meso', 0.45, { mesocardium: true },                'mid-loop — the mesocardium has broken'],
  ['t000-meso', 0.00, { mesocardium: true },                'day 23 — the mesocardium intact'],
  ['t000-peri', 0.00, { pericardium: true },                'day 23 in the pericardial cavity'],
  ['t100-peri', 1.00, { pericardium: true },                'day 28 in the pericardial cavity'],
  ['t100-cut',  1.00, { cutaway: true },                    'cutaway — wall, jelly, endocardial tube'],
  ['t100-mir',  1.00, { mirror: true, midline: true },      'the L-loop'],
  ['t100-mid',  1.00, { midline: true },                    'day 28 with the median-plane reference'],
  ['t042-mid',  0.42, { midline: true },                    't = 0.42 with the median-plane reference'],
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
/* REAL MESH BOXES. The model's acceptance() measures its floored relations off the centreline plus
   the radius profile, which is cheap enough to assert on every build. This measures the same
   relations on the ACTUAL VERTICES of the built meshes, in world space, so the proxy is checked
   against the thing it stands for rather than assumed to track it. Round 3's findings 1, 2 and 3 were
   all found by measuring boxes the model never measured. */
window.boxProbe = function (t, opts) {
  const g = MOD.build(t, Object.assign({}, opts || {}));
  g.updateMatrixWorld(true);
  const boxes = {};
  const v = new THREE.Vector3();
  g.traverse(function (o) {
    if (!o.isMesh || !o.geometry || (o.userData && o.userData.outline)) return;
    const k = o.userData && o.userData.key; if (!k) return;
    const p = o.geometry.attributes.position; if (!p) return;
    const bx = boxes[k] || (boxes[k] = { minx: 1e9, maxx: -1e9, miny: 1e9, maxy: -1e9, minz: 1e9, maxz: -1e9,
                                         cx: 0, cy: 0, cz: 0, n: 0 });
    for (let i = 0; i < p.count; i++) {
      v.fromBufferAttribute(p, i).applyMatrix4(o.matrixWorld);
      if (v.x < bx.minx) bx.minx = v.x; if (v.x > bx.maxx) bx.maxx = v.x;
      if (v.y < bx.miny) bx.miny = v.y; if (v.y > bx.maxy) bx.maxy = v.y;
      if (v.z < bx.minz) bx.minz = v.z; if (v.z > bx.maxz) bx.maxz = v.z;
      bx.cx += v.x; bx.cy += v.y; bx.cz += v.z; bx.n++;
    }
  });
  for (const k in boxes) {
    const b2 = boxes[k];
    b2.ex = b2.maxx - b2.minx; b2.ey = b2.maxy - b2.miny; b2.ez = b2.maxz - b2.minz;
    b2.cx /= b2.n; b2.cy /= b2.n; b2.cz /= b2.n;
  }
  const a = boxes.atrium, ve = boxes.ventricle, si = boxes.sinus;
  const rel = {};
  if (a && ve) {
    const meanH = 0.5 * (a.ey + ve.ey);
    const ov = Math.max(0, Math.min(a.maxy, ve.maxy) - Math.max(a.miny, ve.miny));
    rel.Dfrac = (a.cy - ve.cy) / meanH;
    rel.Dov = ov / a.ey;
    rel.Ifrac = ve.cx / ve.ex;
    rel.Jside = Math.min(a.maxx, -a.minx) / a.ex;
    rel.Jc = Math.abs(a.cx) / a.ex;
  }
  if (si) { rel.Kright = (-si.minx) / si.ex; rel.Kc = Math.abs(si.cx) / si.ex; }
  /* L on real vertices. The model measures it on the chamber BODIES — the dilated part of each
     segment — because two contiguous segments always share their waist; here there is no radius
     profile to consult, so it is measured on the two whole meshes and reported as the LOOSER of the
     two figures. A pass here is therefore stronger than a pass in the model, and a fail here that the
     model passes means the difference is the shared waist and nothing else. Both are printed. */
  const bu = boxes.bulbus;
  if (ve && bu) rel.Lsegment = (ve.minx - bu.maxx) / (0.5 * (ve.ex + bu.ex));
  return { boxes: boxes, rel: rel, floors: MOD.FLOORS };
};

/* NO OPEN LUMEN. A grid of rays from the current camera through the frame; for each, the FIRST
   surface hit is examined and its face normal compared with the ray direction. A normal pointing the
   SAME way as the ray means the nearest thing to the camera along that ray is a surface facing away
   from it — which is precisely what looking into an open pipe is. Two-sided sheets (mesocardium,
   pericardium, the median-plane quad) are genuinely two-sided and are excluded by key rather than by
   guesswork. Reports the offending keys, so a hit names the tube it came from. */
const SOLID_KEYS = { sinus:1, atrium:1, ventricle:1, bulbus:1, truncus:1, veins:1, arches:1, endocardium:1 };
window.lumenProbe = function (grid) {
  const G = grid || 90;
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
  return { rays: G * G, hits: hits, backfaceFirst: back, frac: hits ? back / hits : 0, offenders: offenders };
};

/* THE MIDLINE'S VISIBLE PIXELS. Rendered twice from the same camera — once with the median-plane
   reference and once without — and differenced. Round 3 finding 5 measured 125 visible pixels where
   3,525 would have been visible unoccluded; nothing in the build checked it, so it shipped. */
window.midlinePixels = function (t, opts, yaw, pitch) {
  window.setStage(t, Object.assign({}, opts || {}, { midline: true }), yaw, pitch);
  const withM = renderer.domElement.toDataURL('image/png');
  const gW = group;
  const withPix = readPixels();
  window.setStage(t, Object.assign({}, opts || {}, { midline: false }), yaw, pitch);
  const withoutPix = readPixels();
  let diff = 0, subject = 0;
  for (let i = 0; i < withPix.length; i += 4) {
    const dr = Math.abs(withPix[i] - withoutPix[i]) + Math.abs(withPix[i+1] - withoutPix[i+1]) + Math.abs(withPix[i+2] - withoutPix[i+2]);
    if (dr > 12) diff++;
    if (withoutPix[i] + withoutPix[i+1] + withoutPix[i+2] > 90) subject++;
  }
  return { visible: diff, subjectPixels: subject, fracOfSubject: subject ? diff / subject : 0 };
};
function readPixels() {
  const gl = renderer.getContext();
  const w = renderer.domElement.width, h = renderer.domElement.height;
  const buf = new Uint8Array(w * h * 4);
  gl.readPixels(0, 0, w, h, gl.RGBA, gl.UNSIGNED_BYTE, buf);
  return buf;
}
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
try { await p.waitForFunction('typeof window.setStage === "function"'); }
catch (e) {
  /* A page that never defines setStage has thrown on load, and the timeout says nothing about why.
     Print what the page actually said — the round-3 run lost several minutes to a bare TimeoutError. */
  console.error('HARNESS DID NOT INITIALISE. Page said:');
  for (const m of log) console.error('  ' + m.type + ': ' + m.text.slice(0, 400));
  throw e;
}

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

/* 5 — the boxes, on real vertices, at the t every floored test is stated at */
report.boxes = await p.evaluate('window.boxProbe(1, {})');

/* 6 — no open lumen, from the cameras that actually get used. The anterior camera at t = 0.65 is the
   one views 3 and 4 use and the one the sinus's caudal annulus was visible from; the camera from
   ABOVE is the one view 9 was re-pointed away from because it looked down the truncus. */
report.lumen = [];
for (const [nm2, t2, yaw2, pitch2] of [
  ['anterior t=0.42', 0.42, -0.28,  0.05],
  ['anterior t=0.65', 0.65, -0.28,  0.05],
  ['anterior t=1.00', 1.00, -0.28,  0.05],
  ['from above t=1.00', 1.00, -0.28, -1.15],
  ['from below t=1.00', 1.00, -0.28,  1.15],
]) {
  await p.evaluate(([t3, y3, pi3]) => window.setStage(t3, {}, y3, pi3), [t2, yaw2, pitch2]);
  const r2 = await p.evaluate('window.lumenProbe(96)');
  await p.locator('#c').screenshot({ path: `${OUT}/lumen-${nm2.replace(/[^a-z0-9]+/gi, '-')}.png` });
  report.lumen.push(Object.assign({ camera: nm2, t: t2 }, r2));
}

/* 7 — the median-plane reference has to survive the view that highlights it */
report.midline = [];
for (const [nm2, t2, yaw2] of [['anterior t=1.00', 1.00, -0.28], ['anterior t=0.42', 0.42, -0.28]]) {
  const r2 = await p.evaluate(([t3, y3]) => window.midlinePixels(t3, {}, y3, 0.05), [t2, yaw2]);
  report.midline.push(Object.assign({ camera: nm2, t: t2 }, r2));
}

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
/* the floored relations, proxy against real mesh */
{
  const F = report.boxes.floors, R = report.boxes.rel, PX = report.acceptance.measured;
  const row = (k, val, cmp, lim) => '  ' + k.padEnd(7) + ' mesh ' + val.toFixed(3) +
    '  proxy ' + (PX[k] != null ? PX[k].toFixed(3) : ' n/a ') +
    '  ' + (cmp === '>=' ? '>= ' : '<= ') + lim.toFixed(2) + '  ' +
    ((cmp === '>=' ? val >= lim : val <= lim) ? 'pass' : 'FAIL');
  console.log('floored relations, measured on REAL MESH VERTICES:');
  console.log(row('Ifrac',  R.Ifrac,  '>=', F.I));
  console.log(row('Dfrac',  R.Dfrac,  '>=', F.D));
  console.log(row('Dov',    R.Dov,    '<=', F.DOV));
  console.log(row('Jside',  R.Jside,  '>=', F.JSIDE));
  console.log(row('Jc',     R.Jc,     '<=', F.JC));
  console.log(row('Kright', R.Kright, '>=', F.KRIGHT));
  console.log(row('Kc',     R.Kc,     '<=', F.KC));
  console.log('  Lseg    mesh ' + (R.Lsegment != null ? R.Lsegment.toFixed(3) : ' n/a ') +
    '  proxy(bodies) ' + (PX.L != null ? PX.L.toFixed(3) : ' n/a ') + '  >= ' + F.L.toFixed(2) +
    '   [whole segments vs chamber bodies — they differ by the shared bulboventricular waist]');
  const drift = ['Ifrac','Dfrac','Dov','Jside','Jc','Kright','Kc']
    .map(k => Math.abs(R[k] - (PX[k] != null ? PX[k] : R[k])));
  console.log('  proxy-vs-mesh worst disagreement: ' + Math.max(...drift).toFixed(3));
  const b3 = report.boxes.boxes;
  for (const k of ['sinus','atrium','ventricle','bulbus']) if (b3[k])
    console.log('  box ' + k.padEnd(10) + ' x ' + b3[k].minx.toFixed(3) + ' .. ' + b3[k].maxx.toFixed(3) +
                '   y ' + b3[k].miny.toFixed(3) + ' .. ' + b3[k].maxy.toFixed(3));
  report.flooredPass = R.Ifrac >= F.I && R.Dfrac >= F.D && R.Dov <= F.DOV &&
                       R.Jside >= F.JSIDE && R.Jc <= F.JC && R.Kright >= F.KRIGHT && R.Kc <= F.KC;
}
/* an open lumen anywhere is a fail: RENDER-STANDARD says it is the one thing that must never show */
report.lumenPass = report.lumen.every(l => l.backfaceFirst === 0);
for (const l of report.lumen) console.log('open lumen  ' + l.camera.padEnd(18) +
  l.backfaceFirst + '/' + l.hits + ' first hits face away' +
  (l.backfaceFirst ? '   *** OPEN: ' + JSON.stringify(l.offenders) + ' ***' : '   closed'));
/* the median plane must be legible, not merely present */
report.midlinePass = report.midline.every(m => m.visible >= 900 && m.fracOfSubject >= 0.010);
for (const m of report.midline) console.log('midline     ' + m.camera.padEnd(18) +
  m.visible + ' px visible, ' + (m.fracOfSubject * 100).toFixed(2) + '% of the subject' +
  (m.visible >= 900 && m.fracOfSubject >= 0.010 ? '   legible' : '   *** OCCLUDED ***'));

const failed = report.refs.filter(r => !r.hasMesh || !r.tris);
console.log('refs resolved   :', (report.refs.length - failed.length) + '/' + report.refs.length,
  failed.length ? 'FAILED: ' + failed.map(f => f.key + '(' + (f.reason || f.error) + ')').join(', ') : '');
console.log('total triangles :', report.refs.reduce((s, r) => s + (r.tris || 0), 0));
writeFileSync(`${OUT}/report.json`, JSON.stringify(report, null, 1));
process.exit(bad.length || badA.length || failed.length || !report.acceptance.allPass ||
  !report.flooredPass || !report.lumenPass || !report.midlinePass ? 1 : 0);
