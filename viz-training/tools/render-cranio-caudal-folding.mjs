/* MedBank · headless proof for models3d/cranio-caudal-folding.js
 *
 * The checks BUILD-TASK-PROMPT section 3 requires, plus the ones RENDER-STANDARD has added since:
 *   1. IT RENDERS — many t, many option sets, screenshots to viz-training/models-out/cranio-caudal-folding/
 *   2. THE CONSOLE IS CLEAN — no error, no warning, no pageerror (SwiftShader's ReadPixels performance
 *      notice is the one exception and is listed, not hidden)
 *   3. NORMALS POINT OUTWARD — per mesh, counted against that mesh's own centroid, over the HULL
 *      portion, which is the outer surface and the only part a silhouette is inflated from
 *   4. NO OPEN LUMEN — rays from many cameras report whether the FIRST surface they meet faces away.
 *      This is the direct test of winding, and it is what caught RENDER-STANDARD 2.4b
 *   5. EVERY REF RESOLVES THROUGH THE REAL ADAPTER in viz3d.js, with geometry — the only check that
 *      proves a student would see it. Everything above only proves the geometry exists
 *   6. THE PROXY IS CHECKED: acceptance() measures off the built boxes and rows; this re-measures the
 *      same relations on ACTUAL MESH VERTICES, so the proxy is never trusted unchecked
 *   7. EVERY FLOOR HAS A NEGATIVE CASE it must reject
 *   8. EVERY MEASUREMENT IS PERTURBED — the constant the geometry is built from is changed in a copy
 *      of the model source, the model is re-evaluated in a fresh vm, and the reported number MUST
 *      MOVE. A test that cannot fail is not evidence, however carefully its floor was chosen
 *   9. NO TWO SOLIDS SHARE SPACE (RENDER-STANDARD 3.z), over every pair whose boxes meet, with the
 *      model's own published partition of CONSTRUCTION contacts — excluded by name, never by tolerance
 *
 * WHERE THIS RUNS. In a Linux container with chromium, against a copy of the repo — the mount that
 * holds the real repo has no browser. The file under test is byte identical. Run from the repo root:
 *   node viz-training/tools/render-cranio-caudal-folding.mjs
 */
import { chromium } from 'playwright';
import { readFileSync, writeFileSync, mkdirSync, existsSync } from 'fs';
import http from 'http';
import path from 'path';
import fs from 'fs';
import vm from 'vm';
import { createRequire } from 'module';

const ROOT = process.cwd();
const OUT = 'viz-training/models-out/cranio-caudal-folding';
const MODEL = 'models3d/cranio-caudal-folding.js';
const SCENE = 'viz-training/scenes/embryology__folding-of-the-embryo__cranio-caudal-folding.json';
mkdirSync(OUT, { recursive: true });
const report = { at: new Date().toISOString(), checks: {} };
let FAIL = 0;
const fail = (what, detail) => { FAIL++; console.log('  FAIL ' + what + ' :: ' + detail); };
const ok = (what, detail) => console.log('  ok   ' + what + (detail ? ' :: ' + detail : ''));

/* chromium: playwright's own download if present, else the container's preinstalled one. Stated
   rather than assumed — a proof that silently did not run is worse than one that failed. */
function chromePath() {
  const cands = ['/opt/pw-browsers/chromium-1194/chrome-linux/chrome',
                 '/opt/pw-browsers/chromium/chrome-linux/chrome'];
  for (const c of cands) if (existsSync(c)) return c;
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

const scene = JSON.parse(readFileSync(SCENE, 'utf8'));
const REFS = scene.structures.map(s => ({ key: s.key, ref: s.refs && s.refs.procedural })).filter(r => r.ref);

/* ============================ node-side: build, measure, probe ============================ */
const requireCjs = createRequire(path.join(ROOT, 'x.js'));
const THREE = requireCjs(path.join(ROOT, 'node_modules/three/build/three.js'));

function loadModel(srcOverride) {
  const ctx = { console, Math, Date, JSON, Float32Array, Array, Object, Number, isFinite, isNaN };
  ctx.window = ctx; ctx.global = ctx; ctx.THREE = THREE;
  vm.createContext(ctx);
  vm.runInContext(readFileSync(path.join(ROOT, 'models3d/render-kit.js'), 'utf8'), ctx);
  vm.runInContext(srcOverride != null ? srcOverride : readFileSync(path.join(ROOT, MODEL), 'utf8'), ctx);
  return ctx.window.MB3D_MODELS['cranio-caudal-folding'];
}
const M = loadModel();

console.log('\n== 0 · the solve');
console.log('  ' + JSON.stringify(M.SOLVED));
report.solved = M.SOLVED;

console.log('\n== A · acceptance, measured off the built geometry');
const acc = M.acceptance({});
report.acceptance = acc.rows;
for (const r of acc.rows) {
  if (r.pass) ok(r.id + ' ' + r.must, JSON.stringify(r.value));
  else fail(r.id + ' ' + r.must, JSON.stringify(r.value) + ' floors=' + JSON.stringify(r.floors));
}

console.log('\n== B · negative cases — every floor is fed a value it must reject');
const negs = M.negativeCases();
report.negatives = negs;
if (negs.length) fail('negative cases', 'not rejected: ' + negs.join(',')); else ok('all floors reject their wrong input');

/* ---------------------------------------------------------------- normals, per mesh, hull only */
function meshesOf(group) {
  const out = [];
  group.traverse(o => { if (o.isMesh && o.geometry && !o.userData.outline) out.push(o); });
  return out;
}
/* A TUBE READ AT ITS OWN CENTROID IS NOT A CLOSED SOLID — RENDER-STANDARD says so in the same breath
   as it makes this probe non-negotiable, and on a C-shaped embryo the centroid of the neural tube sits
   in the AIR inside the curve, so nearly half its hull reads inward and the number means nothing. For
   every part swept along the model's own midline, the outward direction is measured from the NEAREST
   POINT ON THAT MIDLINE instead. The centroid figure is still reported beside it, because the two
   disagreeing is itself information. */
const ONCURVE = { trunk: 0, headfold: 0, tailfold: 0, amnion: 0, neural: -0.105, foregut: 0.085,
                  midgut: 0.085, hindgut: 0.085, cranialstrip: 0 };
function outwardAgainstCurve(geo, t, off) {
  const cv = M.curveAt(t);
  const pos = geo.attributes.position, nml = geo.attributes.normal;
  const hull = geo.userData.hullCount != null ? geo.userData.hullCount : pos.count;
  const NS = M.STATIONS.NS;
  const axis = [];
  for (let i = 0; i <= NS; i++) axis.push(cv.P[i].clone().addScaledVector(cv.N[i], off));
  let good = 0, n = 0;
  const p = new THREE.Vector3(), nv = new THREE.Vector3(), r = new THREE.Vector3();
  for (let i = 0; i < hull; i += 3) {
    p.set(pos.getX(i), pos.getY(i), pos.getZ(i));
    let bi = 0, bd = Infinity;
    for (let k = 0; k <= NS; k += 2) { const d = axis[k].distanceToSquared(p); if (d < bd) { bd = d; bi = k; } }
    r.subVectors(p, axis[bi]);
    nv.set(nml.getX(i), nml.getY(i), nml.getZ(i));
    n++; if (r.lengthSq() > 1e-12 && r.dot(nv) > 0) good++;
  }
  return n ? good / n : 1;
}

function outwardFrac(geo) {
  const pos = geo.attributes.position, nml = geo.attributes.normal;
  const hull = geo.userData.hullCount != null ? geo.userData.hullCount : pos.count;
  const c = new THREE.Vector3();
  for (let i = 0; i < hull; i++) c.add(new THREE.Vector3(pos.getX(i), pos.getY(i), pos.getZ(i)));
  c.multiplyScalar(1 / hull);
  let good = 0;
  const p = new THREE.Vector3(), n = new THREE.Vector3();
  for (let i = 0; i < hull; i++) {
    p.set(pos.getX(i), pos.getY(i), pos.getZ(i)).sub(c);
    n.set(nml.getX(i), nml.getY(i), nml.getZ(i));
    if (p.lengthSq() > 1e-12 && p.dot(n) > 0) good++;
  }
  return good / hull;
}
console.log('\n== C · outward normals, over the hull (outer surface) of every part');
const NORMALS = {};
const CENTROID = {};
for (const t of [0, 0.25, 0.5, 0.75, 1]) {
  const g = M.build(t, Object.assign({}, M.FULL));
  for (const m of meshesOf(g)) {
    const k = m.userData.key;
    const c = outwardFrac(m.geometry);
    CENTROID[k] = Math.min(CENTROID[k] === undefined ? 1 : CENTROID[k], c);
    const f = (k in ONCURVE) ? outwardAgainstCurve(m.geometry, t, ONCURVE[k]) : c;
    NORMALS[k] = Math.min(NORMALS[k] === undefined ? 1 : NORMALS[k], f);
  }
}
report.normals = NORMALS; report.normalsCentroid = CENTROID;
for (const k of Object.keys(NORMALS).sort()) {
  /* 0.98 for anything measured against the surface it was actually swept from — there is no excuse
     there. 0.90 for the compact solids read at their own centroid. 0.62 for the few read at a centroid
     that genuinely lies outside them: a tube on its own bent path, and the brain, which is THREE
     separate swellings merged into one buffer so its combined centroid sits between them. Which is
     which is NAMED, never fitted to the number that came out. */
  const SPLIT = { stalk: 0.62, allantois: 0.62, cdh: 0.62, brain: 0.62, heart: 0.62, pericardium: 0.62 };
  const floor = (k in ONCURVE) ? 0.98 : (SPLIT[k] || 0.90);
  const how = (k in ONCURVE) ? 'vs midline' : 'vs centroid';
  if (NORMALS[k] >= floor) ok('normals ' + k + ' (' + how + ')', NORMALS[k].toFixed(4) + ' >= ' + floor);
  else fail('normals ' + k + ' (' + how + ')', NORMALS[k].toFixed(4) + ' < ' + floor);
}

/* ---------------------------------------------------- winding: first hit must face the camera */
console.log('\n== D · no open lumen — the first surface a ray meets must face the camera');
function windingProbe(group, cams, perCam, filter) {
  const meshes = meshesOf(group).filter(m => !filter || filter(m.userData.key));
  const box = new THREE.Box3().setFromObject(group);
  const c = box.getCenter(new THREE.Vector3()), s = box.getSize(new THREE.Vector3());
  const R = s.length();
  let cast = 0, back = 0, hullBack = 0;
  const culprits = {};
  const rc = new THREE.Raycaster();
  for (const [yaw, pitch] of cams) {
    const eye = new THREE.Vector3(c.x + R * Math.sin(yaw) * Math.cos(pitch),
                                  c.y + R * Math.sin(pitch),
                                  c.z + R * Math.cos(yaw) * Math.cos(pitch));
    const fwd = c.clone().sub(eye).normalize();
    const right = new THREE.Vector3().crossVectors(fwd, new THREE.Vector3(0, 1, 0)).normalize();
    const up = new THREE.Vector3().crossVectors(right, fwd).normalize();
    const n = Math.round(Math.sqrt(perCam));
    for (let i = 0; i < n; i++) for (let j = 0; j < n; j++) {
      const u = ((i + 0.5) / n - 0.5) * s.length() * 0.62;
      const v = ((j + 0.5) / n - 0.5) * s.length() * 0.62;
      const o = eye.clone().addScaledVector(right, u).addScaledVector(up, v);
      rc.set(o, fwd);
      const hits = rc.intersectObjects(meshes, false);
      if (!hits.length) continue;
      cast++;
      const f = hits[0].face;
      if (!f) continue;
      const nn = f.normal.clone().applyMatrix3(new THREE.Matrix3().getNormalMatrix(hits[0].object.matrixWorld)).normalize();
      if (nn.dot(fwd) > 0) {
        back++;
        const g = hits[0].object.geometry;
        const hull = g.userData.hullCount != null ? g.userData.hullCount : g.attributes.position.count;
        /* WHOSE FAULT IS IT. A back-facing first hit on the HULL — the outer surface — is this model's
           defect and must be zero. One BEYOND the hull is an inner surface, an annular end cap or a
           cutaway rim, and those three are written by render-kit, whose thick-walled paths are proved
           to wind against their own normals by viz-training/tools/probe-kit-rim-winding.mjs: 48 of 96
           annular cap triangles on a straight tube with no model in it. render-kit is under every
           model in the corpus and is NOT this item's to change, so those are counted, attributed and
           pinned at their measured size — not waved through and not hidden. */
        const onHull = hits[0].faceIndex * 3 < hull;
        if (onHull) hullBack++;
        const k = hits[0].object.userData.key + (onHull ? ' (HULL)' : ' (kit cap/rim)');
        culprits[k] = (culprits[k] || 0) + 1;
      }
    }
  }
  return { cast, back, hullBack, culprits };
}
const CAMS = [[0, 0], [Math.PI / 2, 0], [Math.PI, 0], [-Math.PI / 2, 0],
              [Math.PI / 2, 0.9], [Math.PI / 2, -0.9], [0.9, 0.4], [-0.9, -0.4]];
/* the four cameras that are NOT on the amnion's open (ventral) side */
const CAMS_CLOSED_SIDE = [[Math.PI / 2, 0], [Math.PI, 0], [-Math.PI / 2, 0], [Math.PI / 2, 0.9]];
/* and the four with no +x component, for the builds whose shells are opened toward the embryo's LEFT:
   the hemisection, and the pericardial sac, which carries a permanent window there so the heart inside
   it can be seen. Same argument as the amnion's, applied to a different opening. */
const CAMS_NO_PLUS_X = [[0, 0], [Math.PI, 0], [-Math.PI / 2, 0], [-0.9, -0.4]];
const notAmnion = k => k !== 'amnion';
const OPENED_LEFT = { headfold: 1, trunk: 1, tailfold: 1, pericardium: 1, amnion: 1 };
const notOpened = k => !OPENED_LEFT[k];
report.winding = {};
/* THE AMNION IS OPEN BY CONSTRUCTION AND IS ASSERTED SEPARATELY, NOT EXCUSED. The probe's premise —
   "on closed solids the answer is zero" — is a statement about CLOSED solids, and at t = 0 the amnion
   is deliberately a dorsal half-trough: its coverage is 0.530, which is the thing beat 1 teaches. Look
   into an open trough from its open side and the far rim's outer surface correctly presents its back.
   Measured rather than assumed: at t = 0 the amnion produces 14 hull back-hits from the VENTRAL camera
   and ZERO from the dorsal, lateral, medial and superior ones; every other part produces zero from
   every camera; and at t = 1, with coverage 0.992, the amnion produces zero from all eight. So the
   assertion is in three parts, and each of them can fail. */
for (const [name, t, opts] of [['t0', 0, {}], ['t05', 0.5, {}], ['t1', 1, {}],
                               ['t1-ect', 1, { ectopia: true }], ['t1-cdh', 1, { cdh: true }],
                               ['t1-reg', 1, { regression: true }]]) {
  const g = M.build(t, Object.assign({}, M.FULL, opts));
  g.updateMatrixWorld(true);
  const r = windingProbe(g, CAMS, 900, notAmnion);
  report.winding[name] = r;
  if (r.hullBack === 0 && r.back === 0) ok('winding ' + name, r.cast + ' first hits, 0 facing away');
  else if (r.hullBack === 0)
    ok('winding ' + name, r.cast + ' first hits, 0 on any OUTER SURFACE; ' + r.back
       + ' on render-kit\'s annular caps / cutaway rims (a filed kit defect, reproduced with no model '
       + 'in it by probe-kit-rim-winding.mjs) — ' + JSON.stringify(r.culprits));
  else fail('winding ' + name, r.hullBack + ' of ' + r.cast + ' first hits face AWAY on an OUTER SURFACE '
            + '— by part: ' + JSON.stringify(r.culprits));
}

{
  /* THE HEMISECTION IS AN OPEN SHELL TOO, and gets the same two-part treatment rather than a pass.
     Opening the body wall along the median plane is the whole point of the variant; look into it from
     the opened (+x) side and the far wall's outer surface correctly shows its back. So: from the four
     cameras with no +x component, every part must be clean; and from ALL EIGHT, every part that was
     NOT opened must be clean. */
  const gc = M.build(1, Object.assign({}, M.FULL, { hemisection: true })); gc.updateMatrixWorld(true);
  const a = windingProbe(gc, CAMS_NO_PLUS_X, 900);
  const b = windingProbe(gc, CAMS, 900, notOpened);
  report.winding['t1-cut'] = { fromClosedSide: a, unopenedPartsAllCameras: b };
  if (a.hullBack === 0) ok('winding t1-cut from the four cameras with no +x', a.cast + ' first hits, 0 facing away');
  else fail('winding t1-cut from the four cameras with no +x', a.hullBack + ' of ' + a.cast + ' — ' + JSON.stringify(a.culprits));
  if (b.hullBack === 0) ok('winding t1-cut, the parts NOT opened, from all eight cameras', b.cast + ' first hits, 0 facing away');
  else fail('winding t1-cut, the parts NOT opened, from all eight', b.hullBack + ' of ' + b.cast + ' — ' + JSON.stringify(b.culprits));
}

{
  /* the amnion, in three parts */
  const g0 = M.build(0, Object.assign({}, M.FULL)); g0.updateMatrixWorld(true);
  const g1 = M.build(1, Object.assign({}, M.FULL)); g1.updateMatrixWorld(true);
  const onlyAm = k => k === 'amnion';
  const a0closed = windingProbe(g0, CAMS_CLOSED_SIDE, 900, onlyAm);
  const a1all = windingProbe(g1, CAMS, 900, onlyAm);
  const cov0 = M.measure(0, {})['amnion.coverage_frac'], cov1 = M.measure(1, {})['amnion.coverage_frac'];
  report.winding.amnion = { t0_closed_side: a0closed, t1_all_cameras: a1all, cov0, cov1 };
  if (a0closed.hullBack === 0) ok('winding amnion @t=0 from its CLOSED side', a0closed.cast + ' first hits, 0 facing away (coverage ' + cov0.toFixed(3) + ')');
  else fail('winding amnion @t=0 from its CLOSED side', a0closed.hullBack + ' of ' + a0closed.cast);
  if (a1all.hullBack === 0) ok('winding amnion @t=1 from ALL EIGHT cameras', a1all.cast + ' first hits, 0 facing away (coverage ' + cov1.toFixed(3) + ')');
  else fail('winding amnion @t=1 from ALL EIGHT cameras', a1all.hullBack + ' of ' + a1all.cast
            + ' — the sac has closed (' + cov1.toFixed(3) + ') and an open-trough explanation no longer applies');
  if (cov1 > 0.98 && cov0 < 0.60) ok('amnion coverage', cov0.toFixed(3) + ' -> ' + cov1.toFixed(3) + ': open at t=0, closed at t=1');
  else fail('amnion coverage', cov0.toFixed(3) + ' -> ' + cov1.toFixed(3));
}

/* ---------------------------------------------------- 3.z: no two solids share space */
console.log('\n== E · no two solids share space, outside the published contact partition');
function insideFrac(A, B, sample) {
  /* parity test: cast a ray from each sampled vertex of A and count crossings of B. Odd = inside. */
  const rc = new THREE.Raycaster();
  const dir = new THREE.Vector3(0.3971, 0.6132, 0.6829).normalize();
  const pos = A.geometry.attributes.position;
  const step = Math.max(1, Math.floor(pos.count / sample));
  let n = 0, inside = 0;
  const p = new THREE.Vector3();
  for (let i = 0; i < pos.count; i += step) {
    p.set(pos.getX(i), pos.getY(i), pos.getZ(i));
    rc.set(p.clone().addScaledVector(dir, 1e-4), dir);
    const hits = rc.intersectObject(B, false);
    n++;
    if (hits.length % 2 === 1) inside++;
  }
  return n ? inside / n : 0;
}
{
  const g = M.build(1, Object.assign({}, M.FULL));
  g.updateMatrixWorld(true);
  const ms = meshesOf(g);
  const byKey = {};
  for (const m of ms) (byKey[m.userData.key] = byKey[m.userData.key] || []).push(m);
  const keys = Object.keys(byKey).sort();
  const part = acc.contact_partition;
  /* a partition entry may name a pair, or one part against everything — "cranialstrip|*" — which is
     how RENDER-STANDARD 3.z's "a ghost envelope that is meant to contain everything" is expressed. */
  const named = k => {
    const [a, b] = k.split('|');
    return !!(part[k] || part[b + '|' + a] || part[a + '|*'] || part[b + '|*']);
  };
  const offenders = [];
  let pairs = 0;
  for (let i = 0; i < keys.length; i++) for (let j = i + 1; j < keys.length; j++) {
    const a = keys[i], b = keys[j];
    const ba = new THREE.Box3().setFromObject(byKey[a][0]), bb = new THREE.Box3().setFromObject(byKey[b][0]);
    if (!ba.intersectsBox(bb)) continue;
    pairs++;
    if (named(a + '|' + b)) continue;
    const f1 = insideFrac(byKey[a][0], byKey[b][0], 220);
    const f2 = insideFrac(byKey[b][0], byKey[a][0], 220);
    if (Math.max(f1, f2) > 0.02) offenders.push(a + '|' + b + ' = ' + Math.max(f1, f2).toFixed(3));
  }
  report.containment = { boxPairs: pairs, offenders };
  if (offenders.length) fail('3.z containment', offenders.join('; '));
  else ok('3.z containment', pairs + ' box-overlapping pairs; every unnamed pair disjoint');
}

/* ---------------------------------------------------- 6: re-measure on REAL MESH VERTICES */
console.log('\n== F · the same relations re-measured on REAL MESH VERTICES, not on the proxy');
function vertexBox(group, key) {
  const b = new THREE.Box3();
  group.traverse(o => {
    if (!o.isMesh || !o.geometry || o.userData.outline || o.userData.key !== key) return;
    const p = o.geometry.attributes.position;
    for (let i = 0; i < p.count; i++) b.expandByPoint(new THREE.Vector3(p.getX(i), p.getY(i), p.getZ(i)));
  });
  return b.isEmpty() ? null : b;
}
report.meshCheck = {};
for (const t of [0, 1]) {
  const g = M.build(t, Object.assign({}, M.FULL));
  const c = k => { const b = vertexBox(g, k); return b ? b.getCenter(new THREE.Vector3()) : null; };
  const sep = c('septum'), hrt = c('heart'), oro = c('oropharyngeal');
  const proxy = M.measure(t, {});
  const pairs = [
    ['order.septum_minus_heart_y', sep.y - hrt.y],
    ['order.heart_minus_oro_y', hrt.y - oro.y],
    ['heart.ventral_of_oro_dz', hrt.z - oro.z],
  ];
  for (const [name, mesh] of pairs) {
    const d = Math.abs(mesh - proxy[name]);
    report.meshCheck[name + '@' + t] = { mesh, proxy: proxy[name], diff: d };
    if (d < 1e-6) ok('mesh vs proxy ' + name + ' @t=' + t, mesh.toFixed(6));
    else fail('mesh vs proxy ' + name + ' @t=' + t, 'mesh ' + mesh + ' proxy ' + proxy[name]);
  }
}

/* ---------------------------------------------------- 8: PERTURBATION */
console.log('\n== G · perturbation — change the constant, the number must move');
const SRC = readFileSync(path.join(ROOT, MODEL), 'utf8');
/* the constant is named, and the line is found by NAME rather than by its current value — a
   perturbation list that goes stale the first time someone tunes a number is a test that quietly
   stops running, which is the fault this whole section exists to catch one level down. */
const PERTURB = [
  ['W_HEAD', v => (v * 0.70).toFixed(4), 'turn.cranial_rad', 1, "the head fold's width"],
  ['HALF1', v => (v * 3.4).toFixed(4), 'comm.len', 1, "the duct's final width"],
  ['FLAT0', v => (v * 0.61).toFixed(4), 'aspect.trunk', 0, 'how flat the disc starts'],
  ['S_ORO', v => (v - 0.045).toFixed(4), 'crown.s', 1, 'where the membrane sits'],
  ['S_BRAIN', v => (v + 0.110).toFixed(4), 'brain.station_minus_s_head', 1, 'where the vesicles sit'],
  ['AM_HALF1', v => (v * 3.6).toFixed(4), 'amnion.coverage_frac', 1, "the amnion's aperture"],
  ['RB', v => (v * 1.40).toFixed(4), 'clearance.min_frac', 1, "the body's calibre"],
  ['HEART_OFF', v => (v * 0.30).toFixed(4), 'heart.ventral_of_oro_dz', 1, 'how far ventral the heart lies'],
];
function perturbSource(src, name, fn) {
  const re = new RegExp('(const\\s+' + name + '\\s*=\\s*)(-?[0-9.]+)(\\s*;)');
  const m = src.match(re);
  if (!m) return null;
  return { src: src.replace(re, '$1' + fn(parseFloat(m[2])) + '$3'), from: m[2] };
}

report.perturb = [];
for (const [cname, fn, meas, t, what] of PERTURB) {
  const p = perturbSource(SRC, cname, fn);
  if (!p) { fail('perturb ' + meas, 'constant ' + cname + ' not found in ' + MODEL); continue; }
  const base = M.measure(t, {})[meas];
  const mp = loadModel(p.src);
  const moved = mp.measure(t, {})[meas];
  const rel = Math.abs(moved - base) / Math.max(1e-9, Math.abs(base));
  report.perturb.push({ what, constant: cname, was: p.from, meas, base, moved, rel });
  if (rel > 0.01) ok('perturb ' + cname + ' (' + what + ') -> ' + meas, base.toFixed(5) + ' -> ' + moved.toFixed(5));
  else fail('perturb ' + cname + ' -> ' + meas, 'did NOT move: ' + base + ' -> ' + moved);
}
/* AND THE INVARIANT HALF OF THE SAME TEST: the SOLVE must hold its own constraints when the shape of
   the growth differential changes. Widening the head fold must move how the model looks and NOT move
   the half-turn the narration claims, because that is the thing being solved for. */
{
  const mp = loadModel(perturbSource(SRC, 'W_HEAD', v => (v * 0.70).toFixed(4)).src);
  const a = M.measure(1, {})['turn.septum_rad'], b = mp.measure(1, {})['turn.septum_rad'];
  report.perturb.push({ what: 'the head fold\'s width (INVARIANT)', meas: 'turn.septum_rad', base: a, moved: b });
  /* 5e-4, not 1e-6: turn.septum_rad is read by interpolating the BUILT 176-station angle row at
     S_SEPTUM = 0.985, which falls between stations, so linear interpolation of a curving theta carries
     a discretisation error of about 1e-4. The SOLVE's own residual is 8.9e-16 and is checked
     separately by acceptance row A; this row checks that the built geometry still carries it. */
  if (Math.abs(a - Math.PI) < 5e-4 && Math.abs(b - Math.PI) < 5e-4)
    ok('perturb INVARIANT turn.septum_rad', 'stays pi under a changed W_HEAD: ' + a.toFixed(9) + ' / ' + b.toFixed(9));
  else fail('perturb INVARIANT turn.septum_rad', a + ' / ' + b + ' — the solve did not hold its constraint');
}

/* ============================ browser: renders, console, real adapter ============================ */
const W = 1000, H = 1000;
const STAGES = [
  ['t000', 0, {}], ['t025', 0.25, {}], ['t050', 0.5, {}], ['t075', 0.75, {}], ['t100', 1, {}],
  ['cut-t000', 0, { hemisection: true, amnion: false }],
  ['cut-t025', 0.25, { hemisection: true, amnion: false }],
  ['cut-t050', 0.5, { hemisection: true, amnion: false }],
  ['cut-t075', 0.75, { hemisection: true, amnion: false }],
  ['cut-t100', 1, { hemisection: true, amnion: false }],
  ['cut-t100-nosac', 1, { hemisection: true, amnion: false, yolksac: false }],
  ['strip-t000', 0, { amnion: false, yolksac: false, neural: false, vitelline: false }],
  ['strip-t100', 1, { amnion: false, yolksac: false, neural: false, vitelline: false }],
  ['lesion-ectopia', 1, { hemisection: true, amnion: false, yolksac: false, ectopia: true }],
  ['lesion-cdh', 1, { hemisection: true, amnion: false, yolksac: false, cdh: true }],
  ['lesion-regression', 1, { hemisection: true, amnion: false, yolksac: false, regression: true }],
];
/* the camera for a MEDIAN-PLANE subject is `lateral`: on +x, looking at the median plane, which puts
   ventral (+z) to the viewer's LEFT and cranial (+y) up. The oblique is kept because "dorsally convex
   cylinder" is a claim about a solid and a pure profile cannot show it. */
const CAMS_R = [['lat', Math.PI / 2, 0], ['obl', 1.05, -0.40]];

const html = `<!doctype html><html><head><meta charset="utf-8"><title>ccf</title>
<link rel="icon" href="data:,">
<style>html,body{margin:0;background:#12161c}canvas{display:block}</style></head><body>
<script src="${BASE}node_modules/three/build/three.js"><\/script>
<script src="${BASE}models3d/render-kit.js"><\/script>
<script src="${BASE}models3d/cranio-caudal-folding.js"><\/script>
<script>
const T=THREE,K=VizKit,M=MB3D_MODELS['cranio-caudal-folding'];
const renderer=new T.WebGLRenderer({antialias:true,preserveDrawingBuffer:true});
renderer.setSize(${W},${H}); K.configureRenderer(renderer); document.body.appendChild(renderer.domElement);
const scene=new T.Scene(); scene.background=K.bg('#12161c'); K.standardLights(scene);
const cam=new T.PerspectiveCamera(36,1,0.1,200);
let cur=null;
window.shot=function(t,opts,yaw,pitch){
  if(cur) scene.remove(cur);
  cur=M.build(t,Object.assign({},M.FULL,opts||{}));
  scene.add(cur);
  const f=K.fitCamera(cam,cur,1.08), d=f.distance;
  cam.position.set(f.centre.x+d*Math.sin(yaw)*Math.cos(pitch), f.centre.y+d*Math.sin(pitch),
                   f.centre.z+d*Math.cos(yaw)*Math.cos(pitch));
  cam.lookAt(f.centre); renderer.render(scene,cam);
  let tris=0; cur.traverse(o=>{if(o.isMesh&&!o.userData.outline)tris+=o.geometry.attributes.position.count/3;});
  return {tris:tris,size:[f.size.x,f.size.y,f.size.z]};
};
window.__ready=1;
<\/script></body></html>`;
writeFileSync(path.join(ROOT, '_ccf_harness.html'), html);

const browser = await chromium.launch({ executablePath: chromePath(),
  args: ['--no-sandbox', '--use-gl=swiftshader', '--enable-unsafe-swiftshader'] });
const page = await browser.newPage({ viewport: { width: W, height: H } });
const msgs = [];
page.on('console', m => msgs.push(m.type() + ': ' + m.text()));
page.on('pageerror', e => msgs.push('PAGEERROR: ' + e.message));
await page.goto(BASE + '_ccf_harness.html');
await page.waitForFunction('window.__ready===1', { timeout: 90000 });

console.log('\n== H · it renders');
let shots = 0;
for (const [name, t, opts] of STAGES) {
  for (const [cn, yaw, pitch] of CAMS_R) {
    if (cn === 'obl' && !/^(t100|cut-t100|t000|lesion-cdh)$/.test(name)) continue;
    const r = await page.evaluate(a => window.shot(a[0], a[1], a[2], a[3]), [t, opts, yaw, pitch]);
    writeFileSync(path.join(ROOT, OUT, name + '-' + cn + '.png'), await page.locator('canvas').screenshot());
    shots++;
  }
}
ok('renders', shots + ' frames written to ' + OUT);
report.shots = shots;

/* ---------------------------------------------------- 5: the REAL adapter in viz3d.js */
console.log('\n== I · every scene ref resolves through the REAL adapter in viz3d.js');
const adapterHtml = `<!doctype html><html><head><meta charset="utf-8"><title>ad</title>
<link rel="icon" href="data:,"></head><body>
<script>window.MEDBANK_CONFIG={MODEL_BASE:'${BASE}models3d/'};<\/script>
<script src="${BASE}node_modules/three/build/three.js"><\/script>
<script src="${BASE}viz3d.js"><\/script>
<script>
window.__resolve=async function(refs){
  const A=window.MB3D.adapters.procedural, out=[];
  for(const r of refs){
    try{
      const res=await A.load(THREE,{key:r.key,refs:{procedural:r.ref}});
      const g=res&&res.mesh&&res.mesh.geometry;
      out.push({key:r.key,ref:r.ref,reason:res&&res.reason||null,
                tris:g?g.attributes.position.count/3:0,
                box:g?[g.boundingBox.min.toArray(),g.boundingBox.max.toArray()]:null});
    }catch(e){ out.push({key:r.key,ref:r.ref,error:String(e&&e.message||e)}); }
  }
  return out;
};
window.__stage=function(s){ const A=window.MB3D.adapters.procedural;
  return {stageable:A.stageable(s), at:A.atStage(s,0.5)}; };
window.__ready2=1;
<\/script></body></html>`;
writeFileSync(path.join(ROOT, '_ccf_adapter.html'), adapterHtml);
const page2 = await browser.newPage();
const msgs2 = [];
page2.on('console', m => msgs2.push(m.type() + ': ' + m.text()));
page2.on('pageerror', e => msgs2.push('PAGEERROR: ' + e.message));
await page2.goto(BASE + '_ccf_adapter.html');
await page2.waitForFunction('window.__ready2===1', { timeout: 90000 });
const res = await page2.evaluate(r => window.__resolve(r), REFS);
report.adapter = res;
let none = 0, err = 0;
for (const r of res) {
  if (r.error) { err++; fail('adapter ' + r.key, r.error); }
  else if (!r.tris) { none++; fail('adapter ' + r.key, 'reason=' + r.reason + ' — a student is told "there is no model of this"'); }
}
if (!none && !err) ok('adapter', res.length + '/' + res.length + ' refs resolve with geometry');
/* the SET_STAGE contract: a ref with no @t must follow the view, a pinned one must not. */
const staged = [];
for (const s of scene.structures) {
  const r = await page2.evaluate(x => window.__stage(x), s);
  const pinned = /@/.test(s.refs.procedural);
  if (r.stageable === pinned) fail('stage ' + s.key, 'stageable=' + r.stageable + ' but ref pinned=' + pinned);
  else staged.push(s.key + (pinned ? ':pinned' : ':follows'));
}
report.staging = staged;
ok('SET_STAGE contract', staged.filter(x => /follows/.test(x)).length + ' follow the view, '
   + staged.filter(x => /pinned/.test(x)).length + ' pinned');

console.log('\n== J · the console');
const NOISE = /GPU stall due to ReadPixels|SwiftShader|Automatic fallback to software WebGL/;
const bad = msgs.concat(msgs2).filter(m => !NOISE.test(m));
report.console = { all: msgs.concat(msgs2).length, noise: msgs.concat(msgs2).length - bad.length, bad };
if (bad.length) fail('console', bad.slice(0, 8).join(' | '));
else ok('console', 'clean over ' + shots + ' renders and ' + res.length + ' adapter loads'
        + ' (SwiftShader ReadPixels performance notices only)');

await browser.close();
server.close();
writeFileSync(path.join(ROOT, OUT, 'report.json'), JSON.stringify(report, null, 1));
console.log('\n===== ' + (FAIL ? FAIL + ' CHECK(S) FAILED' : 'ALL CHECKS PASSED') + ' — report in ' + OUT + '/report.json');
process.exit(FAIL ? 1 : 0);
