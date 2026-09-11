/* MedBank · headless proof for models3d/heart-tube-formation.js
 *
 * The four checks BUILD-TASK-PROMPT §3 requires before anything may be marked built:
 *   1. it renders — many values of t, screenshots to viz-training/models-out/heart-tube-formation/
 *   2. the console is clean — no error, no warning, no throw
 *   3. normals point outward — per mesh, counted against that mesh's own centroid, plus the winding
 *      of every triangle against its own supplied normal
 *   4. every ref the scene names resolves THROUGH THE REAL ADAPTER in viz3d.js, with geometry
 *
 * Four more this model needs, each because RENDER-STANDARD records a defect that all four above
 * passed over:
 *   5. NO OPEN LUMEN. Rays from each camera; the FIRST surface hit must not face away. This model has
 *      more terminal ends than anything else in the corpus — while the tube is unfused there are five
 *      of them and three coats on each — so it is the model most exposed to the annulus bug.
 *   6. THE BOXES ARE REAL. Every floored relation acceptance() measures off the centreline is
 *      re-measured on actual mesh VERTICES, and the two columns are printed with their worst
 *      disagreement. Never read the proxy as the evidence.
 *   7. THE HANDOVER IS REAL. cardiac-looping is loaded into the same page and its day-23 tube is
 *      compared, box by box on real vertices, with this model's. This is the only check that proves
 *      the two scenes teach one tube rather than two similar ones.
 *   8. THE NEGATIVE CASES BITE. Every acceptance id is fed a deliberately wrong measurement and must
 *      reject it — otherwise a test is laundering a defect into a proof.
 *
 * WHERE THIS RUNS. In a Linux container with chromium, against a copy of the repo — the mounted repo
 * has no browser and no playwright. The files under test are byte identical; the substrate for the
 * RENDER is not the mount, and saying so is the point.
 *
 * Run from the repo root:  node viz-training/tools/render-heart-tube-formation.mjs
 */
import { chromium } from 'playwright';
import { readFileSync, writeFileSync, mkdirSync, existsSync } from 'fs';
import http from 'http';
import path from 'path';
import fs from 'fs';

const ROOT = process.cwd();
const OUT = 'viz-training/models-out/heart-tube-formation';
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

const SCENE = 'viz-training/scenes/embryology__cardiovascular-development__heart-tube-formation.json';
const haveScene = existsSync(SCENE);
const REFS = haveScene
  ? JSON.parse(readFileSync(SCENE, 'utf8')).structures
      .map(s => ({ key: s.key, ref: s.refs && s.refs.procedural })).filter(r => r.ref)
  : [];
const haveLoop = existsSync('models3d/cardiac-looping.js');
const haveViz = existsSync('viz3d.js');

const W = 1000, H = 1180;
/* THE STAGES. Two of them are the whole reason this model exists in 3D rather than as five panels:
   t = 0.76 is mid-zip, where the tube is single cranially and paired caudally in the SAME frame, and
   t = 0.35 is mid-head-fold, where the cardiogenic area is swinging ventrally under the head. */
const STAGES = [
  ['t000',        0.00, {},                                          'day 18 — the cardiogenic horseshoe'],
  ['t020',        0.20, {},                                          'day 19'],
  ['t035',        0.35, {},                                          'day 19.75 — mid head-fold'],
  ['t050',        0.50, {},                                          'day 20.5'],
  ['t065',        0.65, {},                                          'day 21.25 — the zip has just started'],
  ['t076',        0.76, {},                                          'day 21.8 — mid-zip'],
  ['t085',        0.85, {},                                          'day 22.25'],
  ['t100',        1.00, {},                                          'day 23 — one tube'],
  ['t000-full',   0.00, { pericardium: true, midline: true },        'day 18 in its cavity'],
  ['t076-full',   0.76, { pericardium: true, midline: true },        'mid-zip in its cavity'],
  ['t100-full',   1.00, { pericardium: true, midline: true },        'day 23 in its cavity — crowded'],
  ['t100-cut',    1.00, { cutaway: true },                           'the three coats and the lumen'],
  ['t090-meso',   0.90, { mesocardium: true },                       'the mesocardium, still whole'],
  ['t100-meso',   1.00, { mesocardium: true, midline: true },        'day 23 — the mesocardium has broken'],
  ['t100-bifida', 1.00, { bifida: true },                            'cardia bifida'],
  ['t100-mid',    1.00, { midline: true },                           'day 23 with the median-plane reference'],
  ['t000-mid',    0.00, { midline: true },                           'day 18 with the median-plane reference'],
];

const scripts = [
  `<script src="${BASE}node_modules/three/build/three.js"><\/script>`,
  `<script src="${BASE}models3d/render-kit.js"><\/script>`,
  haveLoop ? `<script src="${BASE}models3d/cardiac-looping.js"><\/script>` : '',
  `<script src="${BASE}models3d/heart-tube-formation.js"><\/script>`,
].join('\n');

const html = `<!doctype html><meta charset=utf8>
<link rel="icon" href="data:,">
<body style="margin:0;background:#0e1626">
<canvas id=c width=${W} height=${H}></canvas>
${scripts}
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
const MOD = window.MB3D_MODELS['heart-tube-formation'];
window.setStage = function (t, opts, yaw, pitch) {
  if (group) scene.remove(group);
  const holder = new THREE.Group();
  holder.add(MOD.build(t, Object.assign({}, opts || {})));
  group = holder;
  group.rotation.y = yaw == null ? -0.26 : yaw;
  group.rotation.x = pitch == null ? 0.04 : pitch;
  group.updateMatrixWorld(true);
  scene.add(group);
  /* THE SUBJECT FILLS THE FRAME AT EVERY t. This model changes size by a factor of three between
     day 18 and day 23 and swings through 180 degrees on the way, so a camera parked at one distance
     would crop half the stages. */
  const f = VizKit.fitCamera(camera, group, 1.04);
  camera.position.set(f.centre.x, f.centre.y, f.centre.z + f.distance);
  camera.lookAt(f.centre);
  L.key.position.set(camera.position.x + 6, camera.position.y + 8, camera.position.z + 4);
  renderer.render(scene, camera);
  return true;
};

/* OUTWARD NORMALS + WINDING. Per mesh, against that mesh's own centroid, in world space. A closed
   solid is strongly majority-outward on its HULL portion; the inner wall and the annular caps of a
   thick shell point inward by construction, so the whole-buffer number on a three-coat tube lands
   near 0.5 and says nothing. Both are reported, and so is the winding of every triangle against its
   own supplied normal — the check that caught RENDER-STANDARD's cardinal bug. */
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
    /* WINDING ON THE HULL PORTION ALONE. The whole-buffer figure mixes the outer surface with the
       inner wall and the annular caps, and RENDER-STANDARD's winding bug is specifically about the
       surface a SILHOUETTE is inflated from — which render-kit records as hullCount. A shell can read
       0.98 over its whole buffer and still be perfect where it matters, or the reverse. */
    let hAgree = 0, hTris = 0;
    for (let i = 0; i + 2 < hull; i += 3) {
      a1.fromBufferAttribute(p, i); b1.fromBufferAttribute(p, i+1); c1.fromBufferAttribute(p, i+2);
      fn.copy(e1.subVectors(b1, a1).cross(e2.subVectors(c1, a1)));
      if (fn.lengthSq() < 1e-16) continue;
      fn.normalize(); vn.set(0,0,0);
      for (let k = 0; k < 3; k++) vn.add(new THREE.Vector3().fromBufferAttribute(n, i+k));
      if (vn.lengthSq() < 1e-16) continue;
      vn.normalize(); hTris++; if (fn.dot(vn) > 0) hAgree++;
    }
    rows.push({ key: u.key, verts: p.count, outward: out / p.count,
                hullVerts: hull, outwardHull: hull ? outHull / hull : null,
                tris: tris, winding: tris ? agree / tris : null,
                hullTris: hTris, hullWinding: hTris ? hAgree / hTris : null });
  });
  return rows;
};

/* REAL MESH BOXES. acceptance() measures its floored relations off the centreline and the calibre
   profile, which is cheap enough to assert on every build. This measures them on the ACTUAL
   VERTICES, so the proxy is checked against the thing it stands for. It also measures the one claim
   acceptance() deliberately refuses to make about itself — that the day-23 tube STRADDLES the median
   plane — because on real vertices that claim is capable of being wrong. */
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
    const b = boxes[k];
    b.ex = b.maxx - b.minx; b.ey = b.maxy - b.miny; b.ez = b.maxz - b.minz;
    b.cx /= b.n; b.cy /= b.n; b.cz /= b.n;
  }
  /* the whole myocardial tube, as one body */
  const SEG = ['sinus','atrium','ventricle','bulbus','truncus'];
  const tube = { minx: 1e9, maxx: -1e9, miny: 1e9, maxy: -1e9, cx: 0, n: 0 };
  for (const k of SEG) { const b = boxes[k]; if (!b) continue;
    tube.minx = Math.min(tube.minx, b.minx); tube.maxx = Math.max(tube.maxx, b.maxx);
    tube.miny = Math.min(tube.miny, b.miny); tube.maxy = Math.max(tube.maxy, b.maxy);
    tube.cx += b.cx * b.n; tube.n += b.n; }
  tube.cx /= Math.max(1, tube.n); tube.ex = tube.maxx - tube.minx; tube.ey = tube.maxy - tube.miny;
  const rel = {
    straddleSide: Math.min(tube.maxx, -tube.minx) / tube.ex,   // >= 0.45 at day 23
    straddleCentre: Math.abs(tube.cx) / tube.ex,               // <= 0.03 at day 23
    tubeCy: (tube.miny + tube.maxy) / 2,
  };
  if (boxes.septum) rel.stMinusHeart = (boxes.septum.cy - (tube.miny + tube.maxy) / 2) /
                                       (0.5 * (tube.ey + boxes.septum.ey));
  if (boxes.membrane) rel.heartMinusBpm = ((tube.miny + tube.maxy) / 2 - boxes.membrane.cy) /
                                          (0.5 * (tube.ey + boxes.membrane.ey));
  return { boxes: boxes, tube: tube, rel: rel };
};

/* THE TWO TUBES ARE APART, MEASURED ON MESH VERTICES AND NOT ON THE CENTRELINE.

   ON THE SINUS, not on the whole tube, and that is the point rather than a convenience. Mid-zip the
   tube is single cranially and paired caudally IN THE SAME FRAME, so a split test over all five
   segments answers "no" — the cranial half straddles x = 0 — and says nothing about the caudal half.
   The first version of this probe did exactly that and reported the mid-zip stage as fused. The sinus
   venosus is the most caudal segment and therefore the last to fuse, so it is where the question
   "have they met yet" is actually being asked. */
window.pairProbe = function (t, opts) {
  const g = MOD.build(t, Object.assign({}, opts || {}));
  g.updateMatrixWorld(true);
  const SEG = { sinus:1 };
  let lMin = 1e9, lMax = -1e9, rMin = 1e9, rMax = -1e9, nL = 0, nR = 0;
  const v = new THREE.Vector3();
  g.traverse(function (o) {
    if (!o.isMesh || !o.geometry || (o.userData && o.userData.outline)) return;
    if (!SEG[o.userData && o.userData.key]) return;
    const p = o.geometry.attributes.position; if (!p) return;
    for (let i = 0; i < p.count; i++) {
      v.fromBufferAttribute(p, i).applyMatrix4(o.matrixWorld);
      if (v.x >= 0) { nR++; rMin = Math.min(rMin, v.x); rMax = Math.max(rMax, v.x); }
      else          { nL++; lMin = Math.min(lMin, v.x); lMax = Math.max(lMax, v.x); }
    }
  });
  if (!nL || !nR) return { split: false };
  const gap = rMin - lMax;                    // > 0 only if the two bodies are genuinely disjoint
  const meanW = 0.5 * ((rMax - rMin) + (lMax - lMin));
  return { split: true, gap: gap, meanWidth: meanW, gapFrac: gap / meanW,
           left: [lMin, lMax], right: [rMin, rMax], nL: nL, nR: nR };
};

/* NO OPEN LUMEN. A grid of rays from the current camera; for each, the FIRST surface hit is examined
   and its face normal compared with the ray direction. A normal pointing the SAME way as the ray
   means the nearest thing to the camera is a surface facing away — which is what looking into an open
   pipe is. Genuinely two-sided sheets are excluded by key, not by guesswork. */
const SOLID_KEYS = { sinus:1, atrium:1, ventricle:1, bulbus:1, truncus:1, veins:1, arches:1,
                     endocardium:1, jelly:1, septum:1, membrane:1 };
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
  return { rays: G * G, hits: hits, backfaceFirst: back, frac: hits ? back / hits : 0, offenders: offenders };
};

function readPixels() {
  const gl = renderer.getContext();
  const w = renderer.domElement.width, h = renderer.domElement.height;
  const buf = new Uint8Array(w * h * 4);
  gl.readPixels(0, 0, w, h, gl.RGBA, gl.UNSIGNED_BYTE, buf);
  return buf;
}
/* THE MEDIAN PLANE MUST SURVIVE THE VIEW THAT USES IT. Rendered with and without, differenced. */
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

/* EVERY VIEW MUST CHANGE THE PICTURE. Renders the t and options each view of the scene uses and
   differences consecutive frames, so "this beat is text, not a view" is measured rather than judged. */
window.frameDiff = function (a, b) {
  window.setStage(a.t, a.opts || {}, a.yaw, a.pitch);
  const pa = readPixels();
  window.setStage(b.t, b.opts || {}, b.yaw, b.pitch);
  const pb = readPixels();
  let d = 0, lit = 0;
  for (let i = 0; i < pa.length; i += 4) {
    const dr = Math.abs(pa[i] - pb[i]) + Math.abs(pa[i+1] - pb[i+1]) + Math.abs(pa[i+2] - pb[i+2]);
    if (dr > 16) d++;
    if (pa[i] + pa[i+1] + pa[i+2] > 90 || pb[i] + pb[i+1] + pb[i+2] > 90) lit++;
  }
  return { changed: d, lit: lit, frac: lit ? d / lit : 0 };
};

window.acceptance = function () { return MOD.acceptance(); };
window.negatives  = function () { return MOD.negatives(); };
window.continuity = function () { return MOD.continuity(); };
window.fusionTable = function () {
  const out = [];
  for (let i = 0; i <= 40; i++) { const t = i / 40; out.push([t, MOD.fusionFront(t)]); }
  return { table: out, dates: MOD.fusionDates() };
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
  for (const m of log) console.error('  ' + m.type + ': ' + m.text.slice(0, 400));
  throw e;
}

const report = { stages: [], console: [] };
report.acceptance = await p.evaluate('window.acceptance()');
report.negatives  = await p.evaluate('window.negatives()');
report.fusion     = await p.evaluate('window.fusionTable()');
report.continuity = haveLoop ? await p.evaluate('window.continuity()')
                             : { measurable: false, note: 'cardiac-looping.js not present in this copy' };

for (const [name, t, opts, label] of STAGES) {
  const yaw = name.endsWith('-meso') ? -1.35 : -0.26;   // the mesocardium is a median sheet: view it from the side
  await p.evaluate(([t2, o, y]) => window.setStage(t2, o, y, 0.04), [t, opts, yaw]);
  const file = `${OUT}/${name}.png`;
  await p.locator('#c').screenshot({ path: file });
  report.stages.push({ name, t, opts, label, file, yaw });
}

report.normals = await p.evaluate('window.normalProbe(1, { endocardium: true, jelly: true, mesocardium: true, midline: true })');
report.normals0 = await p.evaluate('window.normalProbe(0, { endocardium: true, jelly: true })');
report.boxes1 = await p.evaluate('window.boxProbe(1, {})');
report.boxes0 = await p.evaluate('window.boxProbe(0, {})');
report.pair0 = await p.evaluate('window.pairProbe(0, {})');
report.pair76 = await p.evaluate('window.pairProbe(0.76, {})');
report.pairBifida = await p.evaluate('window.pairProbe(1, { bifida: true })');
report.pair1 = await p.evaluate('window.pairProbe(1, {})');

report.lumen = [];
for (const [nm2, t2, opts2, yaw2, pitch2] of [
  ['anterior day 18',   0.00, {}, -0.26,  0.04],
  ['anterior mid-fold', 0.35, {}, -0.26,  0.04],
  ['anterior mid-zip',  0.76, {}, -0.26,  0.04],
  ['anterior day 23',   1.00, {}, -0.26,  0.04],
  ['from above day 23', 1.00, {}, -0.26, -1.15],
  ['from below day 23', 1.00, {}, -0.26,  1.15],
  ['from below mid-zip',0.76, {}, -0.26,  1.15],
  ['lateral day 23',    1.00, {}, -1.45,  0.04],
  ['cutaway day 23',    1.00, { cutaway: true }, -0.26, 0.04],
  ['cutaway from behind', 1.00, { cutaway: true }, 2.88, 0.04],
  ['bifida day 23',     1.00, { bifida: true }, -0.26, 0.04],
]) {
  await p.evaluate(([t3, o3, y3, pi3]) => window.setStage(t3, o3, y3, pi3), [t2, opts2, yaw2, pitch2]);
  const r2 = await p.evaluate('window.lumenProbe(96)');
  await p.locator('#c').screenshot({ path: `${OUT}/lumen-${nm2.replace(/[^a-z0-9]+/gi, '-')}.png` });
  report.lumen.push(Object.assign({ camera: nm2, t: t2 }, r2));
}

report.midline = [];
for (const [nm2, t2, yaw2] of [['anterior day 23', 1.00, -0.26], ['anterior day 18', 0.00, -0.26],
                               ['anterior mid-zip', 0.76, -0.26]]) {
  const r2 = await p.evaluate(([t3, y3]) => window.midlinePixels(t3, {}, y3, 0.04), [t2, yaw2]);
  report.midline.push(Object.assign({ camera: nm2, t: t2 }, r2));
}

/* EVERY VIEW MUST CHANGE THE PICTURE — the scene's own views, in order */
const VIEW_FRAMES = [
  { name: '1 horseshoe',   t: 0.00, opts: { midline: true }, yaw: -0.26 },
  { name: '2 head fold',   t: 0.35, opts: {},                yaw: -1.35 },
  { name: '3 the zip',     t: 0.76, opts: { midline: true }, yaw: -0.26 },
  { name: '4 one tube',    t: 1.00, opts: {},                yaw: -0.26 },
  { name: '5 three coats', t: 1.00, opts: { cutaway: true, endocardium: true, jelly: true }, yaw: -0.55 },
  { name: '6 mesocardium', t: 1.00, opts: { mesocardium: true }, yaw: -1.35 },
  { name: '7 five segments', t: 1.00, opts: {},              yaw: -0.90 },
  { name: '8 the tethers', t: 1.00, opts: { pericardium: true }, yaw: -0.26, pitch: 0.30 },
  { name: '9 cardia bifida', t: 1.00, opts: { bifida: true }, yaw: -0.26 },
];
report.viewDiffs = [];
for (let i = 1; i < VIEW_FRAMES.length; i++) {
  const d = await p.evaluate(([a, c]) => window.frameDiff(a, c), [VIEW_FRAMES[i - 1], VIEW_FRAMES[i]]);
  report.viewDiffs.push({ from: VIEW_FRAMES[i - 1].name, to: VIEW_FRAMES[i].name, ...d });
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
  report.refs = null;
  report.adapterConsole = [];
  report.adapterSkipped = haveViz ? 'the scene names no procedural refs' : 'viz3d.js not present in this copy';
}

await b.close(); server.close();

/* ---------------------------------------------------------------- verdict */
const NOISE = /GPU stall due to ReadPixels|GL Driver Message|Automatic fallback to software WebGL|SwiftShader/i;
const noise = report.console.filter(m => NOISE.test(m.text));
const bad = report.console.filter(m => (m.type === 'error' || m.type === 'warning' || m.type === 'pageerror') && !NOISE.test(m.text));
report.harness_noise = noise;
const badA = (report.adapterConsole || []).filter(m => m.type === 'error' || m.type === 'warning' || m.type === 'pageerror');

console.log('stages rendered  :', report.stages.length);
console.log('console (model)  :', bad.length ? 'DIRTY' : 'clean',
  bad.map(x => x.type + ': ' + x.text).join(' | '), '  [' + noise.length + ' swiftshader messages ignored]');
console.log('console (adapter):', report.refs ? (badA.length ? 'DIRTY' : 'clean') : 'skipped — ' + report.adapterSkipped,
  badA.map(x => x.type + ': ' + x.text).join(' | '));

console.log('acceptance       :', JSON.stringify(report.acceptance.pass), 'allPass=' + report.acceptance.allPass);
console.log('negative cases   :', report.negatives.allGood ? 'every test rejects its wrong input' : 'A TEST DID NOT BITE: ' + JSON.stringify(report.negatives.cases));
console.log('fusion           : starts day ' + report.fusion.dates.dayStart.toFixed(2) +
            ', complete day ' + report.fusion.dates.dayEnd.toFixed(2));
console.log('   front:', report.fusion.table.filter((_, i) => i % 4 === 0)
  .map(([t, u]) => t.toFixed(2) + ':' + u.toFixed(2)).join('  '));

for (const [tag, rows] of [['day 23', report.normals], ['day 18', report.normals0]]) {
  const byKey = {};
  for (const r of rows) (byKey[r.key] = byKey[r.key] || []).push(r);
  console.log('normals ' + tag + ':');
  for (const k of Object.keys(byKey)) {
    const rs = byKey[k];
    const ow = rs.map(r => r.outward), wi = rs.map(r => r.winding).filter(x => x != null);
    const oh = rs.map(r => r.outwardHull).filter(x => x != null);
    const hw = rs.map(r => r.hullWinding).filter(x => x != null);
    console.log('   ' + k.padEnd(12),
      'outward(hull) ' + (oh.length ? Math.min(...oh).toFixed(3) + '-' + Math.max(...oh).toFixed(3) : '   n/a   '),
      ' winding(hull) ' + (hw.length ? Math.min(...hw).toFixed(3) + '-' + Math.max(...hw).toFixed(3) : '  n/a  '),
      ' whole-buffer out ' + Math.min(...ow).toFixed(3) + '-' + Math.max(...ow).toFixed(3),
      ' wind ' + (wi.length ? Math.min(...wi).toFixed(3) + '-' + Math.max(...wi).toFixed(3) : 'n/a'),
      ' (' + rs.length + ')');
  }
}

{
  const R = report.boxes1.rel, P = report.acceptance.measured;
  console.log('floored relations, on REAL MESH VERTICES:');
  console.log('   straddleSide  day 23  ' + R.straddleSide.toFixed(3) + '  >= 0.45  ' + (R.straddleSide >= 0.45 ? 'pass' : 'FAIL'));
  console.log('   straddleCentre day 23 ' + R.straddleCentre.toFixed(3) + '  <= 0.03  ' + (R.straddleCentre <= 0.03 ? 'pass' : 'FAIL'));
  const rows = [
    ['stMinusHeart  day 18', report.boxes0.rel.stMinusHeart, P.stMinusHeart0, '>=',  0.35],
    ['stMinusHeart  day 23', -report.boxes1.rel.stMinusHeart, -P.stMinusHeart1, '>=', 0.35],
    ['heartMinusBpm day 18', report.boxes0.rel.heartMinusBpm, P.heartMinusBpm0, '>=', 0.35],
    ['heartMinusBpm day 23', -report.boxes1.rel.heartMinusBpm, -P.heartMinusBpm1, '>=', 0.35],
  ];
  let worstDrift = 0;
  for (const [nm3, mesh, proxy, cmp, lim] of rows) {
    worstDrift = Math.max(worstDrift, Math.abs(mesh - proxy));
    console.log('   ' + nm3.padEnd(22) + ' mesh ' + mesh.toFixed(3) + '  proxy ' + proxy.toFixed(3) +
      '  ' + cmp + ' ' + lim.toFixed(2) + '  ' + (mesh >= lim ? 'pass' : 'FAIL'));
  }
  console.log('   proxy-vs-mesh worst disagreement: ' + worstDrift.toFixed(3));
  report.flooredPass = R.straddleSide >= 0.45 && R.straddleCentre <= 0.03 &&
    rows.every(([, mesh, , , lim]) => mesh >= lim);
  report.proxyDrift = worstDrift;
}

{
  const rows = [['day 18', report.pair0, true], ['mid-zip', report.pair76, true],
                ['bifida day 23', report.pairBifida, true], ['day 23', report.pair1, false]];
  console.log('two tubes or one, on real SINUS vertices:');
  for (const [nm3, r, wantApart] of rows) {
    const ok = wantApart ? (r.split && r.gap > 0 && r.gapFrac >= 0.35) : !(r.split && r.gap > 0.02);
    console.log('   ' + nm3.padEnd(14) + (r.split ? ('gap ' + r.gap.toFixed(3) + '  = ' +
      (r.gapFrac * 100).toFixed(1) + '% of mean width') : 'not split at x = 0') +
      '   want ' + (wantApart ? 'APART' : 'ONE TUBE') + '  ' + (ok ? 'pass' : 'FAIL'));
    if (!ok) report.pairPass = false;
  }
  if (report.pairPass !== false) report.pairPass = true;
}

/* A CUTAWAY IS A HOLE ON PURPOSE, AND THAT IS THE ONLY EXEMPTION. Looking INTO an opened window you
   are meant to see the far inner wall and the cut rim — that is what the beat exists to show — so the
   camera aimed at the window is reported but not required to be closed. The same build viewed from
   BEHIND has no window facing it, so it must be closed like any other, and it is that camera which
   proves the cutaway did not tear anything open elsewhere. Every non-cutaway camera must be zero. */
const LUMEN_EXEMPT = { 'cutaway day 23': true };
report.lumenPass = report.lumen.every(l => LUMEN_EXEMPT[l.camera] || l.backfaceFirst === 0);
for (const l of report.lumen) console.log('open lumen  ' + l.camera.padEnd(20) +
  l.backfaceFirst + '/' + l.hits + ' first hits face away' +
  (l.backfaceFirst ? '   *** OPEN: ' + JSON.stringify(l.offenders) + ' ***' : '   closed'));

/* LEGIBLE IS A FLOOR AND A CEILING. cardiac-looping's round-3 defect was a reference 96.5% occluded,
   so the floor is the lesson there. The ceiling is this model's own: sized from a constant reach, the
   same reference covered 112% of the subject's lit pixels at day 18 — a reference outweighing the
   anatomy is the same failure from the other side, and nothing would have measured it either. */
const midOk = m => m.visible >= 900 && m.fracOfSubject >= 0.010 && m.fracOfSubject <= 0.60;
report.midlinePass = report.midline.every(midOk);
for (const m of report.midline) console.log('midline     ' + m.camera.padEnd(20) +
  m.visible + ' px visible, ' + (m.fracOfSubject * 100).toFixed(2) + '% of the subject' +
  (midOk(m) ? '   legible' : (m.fracOfSubject > 0.60 ? '   *** DOMINATES ***' : '   *** OCCLUDED ***')));

report.viewsChange = report.viewDiffs.every(d => d.frac >= 0.05);
console.log('every view changes the picture:');
for (const d of report.viewDiffs)
  console.log('   ' + (d.from + ' -> ' + d.to).padEnd(34) + (d.frac * 100).toFixed(1) + '% of lit pixels differ' +
    (d.frac >= 0.05 ? '' : '   *** SAME PICTURE ***'));

if (report.continuity.measurable) {
  console.log('handover to cardiac-looping: worst box disagreement ' + report.continuity.worst.toFixed(4) +
    '  (tolerance ' + report.continuity.tolerance + ')  ' + (report.continuity.pass ? 'pass' : 'FAIL'));
  for (const k in report.continuity.per)
    console.log('   ' + k.padEnd(12) + (report.continuity.per[k].missing ? 'MISSING' : report.continuity.per[k].worst.toFixed(4)));
} else {
  console.log('handover to cardiac-looping: NOT MEASURED — ' + report.continuity.note);
}

let failed = [];
if (report.refs) {
  failed = report.refs.filter(r => !r.hasMesh || !r.tris);
  console.log('refs resolved    :', (report.refs.length - failed.length) + '/' + report.refs.length,
    failed.length ? 'FAILED: ' + failed.map(f => f.key + '(' + (f.reason || f.error) + ')').join(', ') : '');
  console.log('total triangles  :', report.refs.reduce((s, r) => s + (r.tris || 0), 0));
}

writeFileSync(`${OUT}/report.json`, JSON.stringify(report, null, 1));

const hardFail = bad.length || badA.length || failed.length || !report.acceptance.allPass ||
  !report.negatives.allGood || !report.flooredPass || !report.pairPass || !report.lumenPass ||
  !report.midlinePass || !report.viewsChange ||
  (report.continuity.measurable && !report.continuity.pass) ||
  !report.refs || !report.continuity.measurable;
console.log('\nVERDICT:', hardFail ? 'NOT PROVEN' : 'PROVEN');
process.exit(hardFail ? 1 : 0);
