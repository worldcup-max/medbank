/* MedBank · headless proof for models3d/fetal-circulation.js
 *
 * The five checks BUILD-TASK-PROMPT §3 requires before anything may be marked built:
 *   1. it renders — many values of t, screenshots to viz-training/models-out/fetal-circulation/
 *   2. the console is clean — no error, no warning, no throw
 *   3. normals point outward — per mesh against its own centroid, plus the winding of every triangle
 *      against its own supplied normal, reported on the HULL portion separately
 *   4. it looks like the thing — the screenshots are for a human, and for the review, to read
 *   5. every ref the scene names resolves THROUGH THE REAL ADAPTER in viz3d.js, with geometry
 *
 * Four more this model needs:
 *   6. NO OPEN LUMEN. Rays from each camera; the FIRST surface hit must not face away.
 *   7. THE BOXES ARE REAL. The three spatial claims acceptance() measures off the LAYOUT TABLE are
 *      re-measured on the vertices actually drawn.
 *   8. THE PICTURE CARRIES THE CLAIM. The whole scene turns on the ascending aorta being better
 *      oxygenated than the descending one. acceptance() proves that of the NUMBERS. This renders each
 *      vessel alone and compares the LIT PIXELS, because a saturation a student cannot see is a
 *      saturation the model is not teaching. Same for the duct reversing: the arrows in it must
 *      actually point the other way, measured as the change in the rendered frame.
 *   9. THE NEGATIVE CASES BITE.
 *
 * WHERE THIS RUNS. In a Linux container with chromium, against a copy of the repo — the mounted repo
 * has no browser and no playwright. The files under test are byte identical.
 *
 * Run from the repo root:  node viz-training/tools/render-fetal-circulation.mjs
 */
import { chromium } from 'playwright';
import { readFileSync, writeFileSync, mkdirSync, existsSync } from 'fs';
import http from 'http';
import path from 'path';
import fs from 'fs';

const ROOT = process.cwd();
const OUT = 'viz-training/models-out/fetal-circulation';
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
const BASE = `http://127.0.0.1:${server.address().port}/`;

const SCENE = 'viz-training/scenes/embryology__cardiovascular-development__fetal-circulation.json';
const REFS = existsSync(SCENE)
  ? JSON.parse(readFileSync(SCENE, 'utf8')).structures
      .map(s => ({ key: s.key, ref: s.refs && s.refs.procedural })).filter(r => r.ref)
  : [];
const haveViz = existsSync('viz3d.js');

const W = 900, H = 1240;
const FL = { flow: true };
const STAGES = [
  ['fetal',        0.0000, { ...FL }, 'the fetal circulation, before the first breath'],
  ['fetal-plain',  0.0000, { ...FL, plain: true }, 'the same, in anatomical colours'],
  ['fetal-nomark', 0.0000, {}, 'the same, without the flow markers'],
  ['t-40s',        0.0500, { ...FL }, '40 seconds — the cord is clamped, the lung is opening'],
  ['t-1min',       0.0630, { ...FL }, 'one minute — the nadir, placenta gone and lung not yet up'],
  ['t-2min',       0.0998, { ...FL }, 'two minutes — the foramen is closing'],
  ['t-5min',       0.1627, { ...FL }, 'five minutes — the foramen is shut, the duct has reversed'],
  ['t-15min',      0.2500, { ...FL }, 'fifteen minutes — a transient left-to-right ductal shunt'],
  ['t-12h',        0.6014, { ...FL }, 'twelve hours — the duct constricting'],
  ['t-5d',         0.8067, { ...FL }, 'five days — the ductus venosus closing'],
  ['neonate',      1.0000, { ...FL }, 'six weeks — two circulations in series'],
  ['v-pda',        1.0000, { ...FL, pda: true }, 'persistent ductus arteriosus — the shunt reversed'],
  ['v-pfc',        1.0000, { ...FL, pfc: true }, 'persistent fetal circulation — still right to left'],
  ['midline',      0.0000, { ...FL, midline: true }, 'with the median-plane trace'],
];

const html = `<!doctype html><meta charset=utf8>
<link rel="icon" href="data:,">
<body style="margin:0;background:#0e1626">
<canvas id=c width=${W} height=${H}></canvas>
<script src="${BASE}node_modules/three/build/three.js"><\/script>
<script src="${BASE}models3d/render-kit.js"><\/script>
<script src="${BASE}models3d/fetal-circulation.js"><\/script>
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
const MOD = window.MB3D_MODELS['fetal-circulation'];

window.setStage = function (t, opts, yaw, pitch, show) {
  if (group) scene.remove(group);
  const holder = new THREE.Group();
  holder.add(MOD.build(t, Object.assign({}, opts || {})));
  group = holder;
  /* A VIEW IS ALSO WHAT IT SHOWS. Ignoring each view's SHOW_STRUCTURE list would make two views that
     differ only in what they reveal come out as the SAME FRAME, and the frame-difference check could
     then not tell a real duplicate from its own blindness. */
  if (show && show.length) {
    const keep = {};
    for (const k of show) keep[k] = 1;
    group.traverse(function (o) {
      if (!o.isMesh) return;
      const k = o.userData && o.userData.key;
      if (k && !keep[k]) o.visible = false;
    });
  }
  group.rotation.y = yaw == null ? -0.18 : yaw;
  group.rotation.x = pitch == null ? 0.04 : pitch;
  group.updateMatrixWorld(true);
  scene.add(group);
  const f = VizKit.fitCamera(camera, group, 1.05);
  camera.position.set(f.centre.x, f.centre.y, f.centre.z + f.distance);
  camera.lookAt(f.centre);
  L.key.position.set(camera.position.x + 6, camera.position.y + 9, camera.position.z + 5);
  renderer.render(scene, camera);
  return { size: f.size.toArray(), distance: f.distance };
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

/* NO OPEN LUMEN — every closed solid in the model; the transparent lungs and the tiny flow cones
   are excluded, the lungs because they are deliberately see-through. */
const SKIP = { flow: 1, lungs: 1, midline: 1 };
window.lumenProbe = function (grid) {
  const N = grid || 88;
  const rc = new THREE.Raycaster();
  const targets = [];
  group.traverse(function (o) {
    if (!o.isMesh || !o.geometry) return;
    const u = o.userData || {};
    if (u.outline || SKIP[u.key] || !o.visible) return;
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

/* THE BOXES ARE REAL — the spatial claims re-measured on the vertices actually drawn */
window.boxProbe = function (t, opts) {
  const g = MOD.build(t, Object.assign({}, opts || {}));
  g.updateMatrixWorld(true);
  const acc = {};
  const v = new THREE.Vector3();
  g.traverse(function (o) {
    if (!o.isMesh || !o.geometry || (o.userData && o.userData.outline)) return;
    const k = o.userData && o.userData.key; if (!k) return;
    const p = o.geometry.attributes.position; if (!p) return;
    const a = acc[k] || (acc[k] = { minx:1e9,maxx:-1e9,miny:1e9,maxy:-1e9,minz:1e9,maxz:-1e9,cx:0,cy:0,cz:0,n:0 });
    for (let i = 0; i < p.count; i++) {
      v.fromBufferAttribute(p, i).applyMatrix4(o.matrixWorld);
      a.minx=Math.min(a.minx,v.x); a.maxx=Math.max(a.maxx,v.x);
      a.miny=Math.min(a.miny,v.y); a.maxy=Math.max(a.maxy,v.y);
      a.minz=Math.min(a.minz,v.z); a.maxz=Math.max(a.maxz,v.z);
      a.cx+=v.x; a.cy+=v.y; a.cz+=v.z; a.n++;
    }
  });
  for (const k of Object.keys(acc)) { const a=acc[k]; a.cx/=a.n; a.cy/=a.n; a.cz/=a.n; }
  return acc;
};

function readPixels() {
  const gl = renderer.getContext();
  const w = renderer.domElement.width, h = renderer.domElement.height;
  const buf = new Uint8Array(w * h * 4);
  gl.readPixels(0, 0, w, h, gl.RGBA, gl.UNSIGNED_BYTE, buf);
  return buf;
}
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

/* THE PICTURE CARRIES THE CLAIM. Render one key alone and average the colour of its lit pixels.
   A saturation ordering that does not survive to the screen is not being taught. */
window.litColour = function (t, opts, key) {
  window.setStage(t, opts || {}, -0.18, 0.04, [key]);
  const px = readPixels();
  let r = 0, g2 = 0, b = 0, n = 0;
  for (let i = 0; i < px.length; i += 4) {
    if (px[i] + px[i+1] + px[i+2] < 110) continue;
    r += px[i]; g2 += px[i+1]; b += px[i+2]; n++;
  }
  return n ? { r: r/n, g: g2/n, b: b/n, pixels: n, warmth: (r/n - b/n) } : { pixels: 0, warmth: null };
};
window.acceptance = function () { return MOD.acceptance(); };
window.negatives  = function () { return MOD.negatives(); };
window.physiology = function (t, o) { const s = MOD.physiology(t, o);
  return { flow: { fo: s.flow.fo, da: s.flow.da, lung: s.flow.lung, plac: s.flow.plac,
                   rv: s.flow.rv, lv: s.flow.lv, residual: s.flow.residual },
           sat: s.sat, flap: s.flow.dPatria }; };
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
report.negatives  = await p.evaluate('window.negatives()');
report.keysFull   = await p.evaluate("window.keysBuilt(0, window.MB3D_MODELS['fetal-circulation'].FULL)");

report.stages = [];
for (const [name, t, opts, label] of STAGES) {
  await p.evaluate(([t2, o]) => window.setStage(t2, o, -0.18, 0.04), [t, opts]);
  await p.locator('#c').screenshot({ path: `${OUT}/${name}.png` });
  report.stages.push({ name, t, label });
}

report.normals0 = await p.evaluate("window.normalProbe(0, window.MB3D_MODELS['fetal-circulation'].FULL)");
report.normals1 = await p.evaluate("window.normalProbe(1, window.MB3D_MODELS['fetal-circulation'].FULL)");

report.lumen = [];
for (const [nm2, t2, o2, yaw, pitch] of [
  ['anterior fetal',  0.00, { flow: true }, -0.18, 0.04],
  ['anterior neonate',1.00, { flow: true }, -0.18, 0.04],
  ['left lateral',    0.00, { flow: true }, -1.50, 0.04],
  ['right lateral',   0.00, { flow: true },  1.50, 0.04],
  ['from above',      0.00, { flow: true }, -0.18, -1.15],
  ['from below',      0.00, { flow: true }, -0.18, 1.15],
  ['from behind',     0.00, { flow: true },  2.96, 0.04],
]) {
  await p.evaluate(([t3, o3, y3, pi3]) => window.setStage(t3, o3, y3, pi3), [t2, o2, yaw, pitch]);
  const r2 = await p.evaluate('window.lumenProbe(88)');
  await p.locator('#c').screenshot({ path: `${OUT}/lumen-${nm2.replace(/[^a-z0-9]+/gi, '-')}.png` });
  report.lumen.push(Object.assign({ camera: nm2, t: t2 }, r2));
}

/* the spatial claims, on real vertices */
const boxes = await p.evaluate("window.boxProbe(0, window.MB3D_MODELS['fetal-circulation'].FULL)");
const mean = (a, b2) => 0.5 * (a + b2);
report.boxes = {
  chambers: {
    ra_cx: boxes.right_atrium.cx, la_cx: boxes.left_atrium.cx,
    separation: boxes.left_atrium.cx - boxes.right_atrium.cx,
    floor: 0.35 * mean(boxes.right_atrium.maxx - boxes.right_atrium.minx,
                       boxes.left_atrium.maxx - boxes.left_atrium.minx),
  },
  duct_below_branches: {
    duct_min_y: boxes.ductus_arteriosus.miny,
    branch_min_y: boxes.head_neck_vessels.miny,
    separation: boxes.head_neck_vessels.miny - boxes.ductus_arteriosus.miny,
    floor: 0.35 * mean(boxes.aortic_arch.maxy - boxes.aortic_arch.miny,
                       boxes.head_neck_vessels.maxy - boxes.head_neck_vessels.miny),
  },
  uv_ventral_to_ivc: {
    uv_cz: boxes.umbilical_vein.cz, ivc_cz: boxes.ivc.cz,
    separation: boxes.umbilical_vein.cz - boxes.ivc.cz,
    floor: 0.35 * mean(boxes.umbilical_vein.maxz - boxes.umbilical_vein.minz,
                       boxes.ivc.maxz - boxes.ivc.minz),
  },
};

/* THE PICTURE CARRIES THE CLAIM */
report.colour = {};
for (const k of ['umbilical_vein', 'ivc', 'svc', 'ascending_aorta', 'descending_aorta',
                 'umbilical_arteries', 'pulmonary_trunk'])
  report.colour[k] = await p.evaluate(([t2, k2]) => window.litColour(t2, {}, k2), [0, k]);
report.colourNeonate = {};
for (const k of ['ascending_aorta', 'descending_aorta'])
  report.colourNeonate[k] = await p.evaluate(([t2, k2]) => window.litColour(t2, {}, k2), [1, k]);

/* the duct's arrows must actually turn round */
report.ductFrames = await p.evaluate(() => window.frameDiff(
  { t: 0, opts: { flow: true }, show: ['ductus_arteriosus', 'flow'] },
  { t: 1, opts: { flow: true, pda: true }, show: ['ductus_arteriosus', 'flow'] }));

/* EVERY VIEW MUST CHANGE THE PICTURE — the SCENE'S OWN views, at the t each of them names */
function viewFramesFromScene() {
  if (!existsSync(SCENE)) return null;
  const sc = JSON.parse(readFileSync(SCENE, 'utf8'));
  return sc.views.map(v => {
    const st = v.ops.find(o => o.op === 'SET_STAGE');
    const keys = new Set(v.ops.filter(o => o.op === 'SHOW_STRUCTURE').map(o => o.target));
    const rot = v.ops.filter(o => o.op === 'ROTATE_TO_VIEW').pop();
    const opts = { flow: true };
    if (keys.has('midline')) opts.midline = true;
    if (keys.has('pda') || (v.title || '').toLowerCase().includes('persistent duct')) opts.pda = true;
    if ((v.title || '').toLowerCase().includes('persistent fetal')) opts.pfc = true;
    const yaw = rot && rot.view === 'lateral' ? -1.50 : (rot && rot.view === 'posterior' ? 2.96 : -0.18);
    return { name: v.beat + ' ' + v.title, t: st ? st.t : 1, opts: opts,
             show: keys.has('*') ? null : Array.from(keys), yaw: yaw, pitch: 0.04 };
  });
}
const VIEW_FRAMES = viewFramesFromScene();
report.viewDiffs = [];
if (VIEW_FRAMES) {
  for (let i = 1; i < VIEW_FRAMES.length; i++) {
    const d = await p.evaluate(([a, c]) => window.frameDiff(a, c), [VIEW_FRAMES[i - 1], VIEW_FRAMES[i]]);
    report.viewDiffs.push({ from: VIEW_FRAMES[i - 1].name, to: VIEW_FRAMES[i].name, ...d });
  }
  for (const v of VIEW_FRAMES) {
    await p.evaluate(a => window.setStage(a.t, a.opts, a.yaw, a.pitch, a.show), v);
    await p.locator('#c').screenshot({ path: `${OUT}/view-${v.name.replace(/[^a-z0-9]+/gi, '-')}.png` });
  }
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
console.log('keys built (FULL):', Object.keys(report.keysFull).length,
  Object.entries(report.keysFull).map(([k,v]) => k+':'+v).join(' '));

for (const [tag, rows] of [['fetal', report.normals0], ['neonate', report.normals1]]) {
  const byKey = {};
  for (const r of rows) (byKey[r.key] = byKey[r.key] || []).push(r);
  console.log('normals ' + tag + ':');
  for (const k of Object.keys(byKey)) {
    const rs = byKey[k];
    const oh = rs.map(r => r.outwardHull).filter(x => x != null);
    const hw = rs.map(r => r.hullWinding).filter(x => x != null);
    const ow = rs.map(r => r.outward);
    console.log('   ' + String(k).padEnd(20),
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
console.log('spatial, on real vertices:');
for (const k of Object.keys(report.boxes)) {
  const c = report.boxes[k];
  console.log('   ' + k.padEnd(22), 'separation ' + c.separation.toFixed(3) + '  floor ' + c.floor.toFixed(3),
    c.separation >= c.floor ? 'OK' : '*** BELOW FLOOR ***');
}
console.log('rendered colour (warmth = red minus blue, higher = better oxygenated):');
for (const k of Object.keys(report.colour)) {
  const c = report.colour[k];
  console.log('   ' + k.padEnd(20), c.pixels ? ('warmth ' + c.warmth.toFixed(1) + '  over ' + c.pixels + ' px') : 'NOT VISIBLE');
}
const asc = report.colour.ascending_aorta, desc = report.colour.descending_aorta;
console.log('   ascending minus descending warmth =',
  (asc.warmth != null && desc.warmth != null) ? (asc.warmth - desc.warmth).toFixed(1) : 'n/a',
  '   (neonate:', (report.colourNeonate.ascending_aorta.warmth - report.colourNeonate.descending_aorta.warmth).toFixed(1) + ')');
console.log('duct reversal, on screen:', (report.ductFrames.frac * 100).toFixed(1) + '% of lit pixels changed');
console.log('view diffs       :', VIEW_FRAMES ? '' : '(no scene views yet)');
for (const d of report.viewDiffs) console.log('   ' + d.from + ' -> ' + d.to, (d.frac * 100).toFixed(1) + '%');
console.log('refs             :', report.refs ? report.refs.map(r => r.key + '=' + (r.hasMesh ? r.tris + ' tris' : (r.reason || r.error))).join(', ') : 'skipped');

writeFileSync(`${OUT}/report.json`, JSON.stringify(report, null, 1));
console.log('\nreport written to ' + OUT + '/report.json');
