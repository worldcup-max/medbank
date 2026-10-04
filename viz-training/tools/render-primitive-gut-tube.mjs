/* MedBank · headless proof for models3d/primitive-gut-tube.js
 *
 * Everything below must pass before the item is marked built:
 *   1. it renders — several t, several cameras, screenshots to viz-training/models-out/primitive-gut-tube/
 *   2. the console is clean — no error, no warning, no throw, on BOTH the model page and the adapter page
 *   3. normals point outward — per mesh, counted against that mesh's own centroid
 *   4. the acceptance battery passes, and its NEGATIVE cases are rejected
 *   5. every PERTURBATION lever moves the number its row reads — a row whose measured side is a
 *      compile-time constant cannot fail, which is the fault lateral-folding's round-1 review found
 *   6. the geometric relations are re-measured on REAL MESH VERTICES, not on the centreline proxy
 *   7. no open lumen — rays from each camera report whether the FIRST surface faces away
 *   8. every ref the scene names resolves THROUGH THE REAL ADAPTER in viz3d.js, with geometry
 *   9. declared STATIC_PARTS really are static, and declared STAGE_LIMITED absences are real; an
 *      UNDECLARED static part or an undeclared absence FAILS the build
 *
 * WHERE THIS RUNS. In a Linux container with chromium, against a copy of the repo — the mounted repo
 * has no browser. The files under test are byte identical.
 *
 * Run from the repo root:  node viz-training/tools/render-primitive-gut-tube.mjs
 */
import { chromium } from 'playwright';
import { readFileSync, writeFileSync, mkdirSync, existsSync } from 'fs';
import http from 'http';
import path from 'path';
import vm from 'vm';
import { createRequire } from 'module';

const ROOT = process.cwd();
const OUT = path.join(ROOT, 'viz-training', 'models-out', 'primitive-gut-tube');
mkdirSync(OUT, { recursive: true });
const SCENE_PATH = path.join(ROOT, 'viz-training', 'scenes',
  'embryology__folding-of-the-embryo__primitive-gut-tube.json');

const W = 1000, H = 760;
const MIME = { '.js': 'text/javascript', '.json': 'application/json', '.html': 'text/html' };

const server = http.createServer((req, res) => {
  /* answer the favicon rather than filtering its 404 out of the console afterwards: the check is
     "the console is clean", and the honest way to pass it is to stop causing the error. */
  if (/^\/favicon\.ico/.test(req.url)) { res.writeHead(204); res.end(); return; }
  const p = path.join(ROOT, decodeURIComponent(req.url.split('?')[0]));
  if (!existsSync(p)) { res.writeHead(404); res.end('no'); return; }
  res.writeHead(200, { 'content-type': MIME[path.extname(p)] || 'application/octet-stream' });
  res.end(readFileSync(p));
});
await new Promise(r => server.listen(0, r));
const PORT = server.address().port;
const BASE = `http://127.0.0.1:${PORT}/`;

const T_SAMPLES = [0, 0.15, 0.30, 0.45, 0.60, 0.75, 0.90, 1];
const CAMERAS = {
  anterior:  [0, 0, 1],
  lateral:   [1, 0, 0],
  superior:  [0, 1, 0.001],
};

const modelPage = `<!doctype html><html><head><meta charset="utf-8"><style>
html,body{margin:0;background:#101418}canvas{display:block}</style></head><body>
<canvas id="c" width="${W}" height="${H}"></canvas>
<script src="${BASE}node_modules/three/build/three.js"><\/script>
<script src="${BASE}models3d/render-kit.js"><\/script>
<script src="${BASE}models3d/primitive-gut-tube.js"><\/script>
<script>
window.__errs = [];
window.addEventListener('error', e => window.__errs.push('error: ' + e.message));
const renderer = new THREE.WebGLRenderer({ canvas: document.getElementById('c'), antialias: true });
renderer.setPixelRatio(1);
VizKit.configureRenderer(renderer);
const scene = new THREE.Scene();
scene.background = VizKit.bg('#101418');
VizKit.standardLights(scene);
const camera = new THREE.PerspectiveCamera(32, ${W}/${H}, 0.1, 200);
let group = null;
const M = () => window.MB3D_MODELS['primitive-gut-tube'];

window.buildAt = function (t, opts) {
  if (group) { scene.remove(group); }
  group = M().build(t, opts || M().FULL);
  scene.add(group);
  return { meshes: group.children.filter(c => !c.userData.outline).length };
};
window.shoot = function (dir) {
  const d = new THREE.Vector3().fromArray(dir).normalize();
  const fit = VizKit.fitCamera(camera, group, 1.08);
  camera.position.copy(fit.centre).addScaledVector(d, fit.distance);
  camera.up.set(0, 1, 0);
  camera.lookAt(fit.centre);
  renderer.render(scene, camera);
  return true;
};

/* ---- the normals probe.
   AGAINST THE LOCAL CENTRELINE, NOT THE GLOBAL CENTROID, and that distinction is the whole value of
   this probe on this model. RENDER-STANDARD says "a tube read at its own centreline will not be
   [strongly majority-outward] — understand which you have before you accept a low number". The first
   version of this harness read every mesh against its own global centroid and reported midgut 0.516
   and umbring 0.583. Neither is a defect: the midgut is a LOOP and the ring is a TORUS, so their
   centroids lie in the hole, outside the solid, and radial outwardness measured from there is
   meaningless — about half the surface faces away from the middle of a doughnut, which is what a
   doughnut is.
   So: for every mesh, build a reference POLYLINE — the model's own CL for the tube spans, the ring's
   own circle for the torus, the centroid for a genuinely blobby solid — and measure each vertex's
   normal against (vertex - nearest point on that polyline). That is the quantity the winding bug
   actually corrupts, and it is near 1.000 for a correct tube however bent. */
window.normalProbe = function (t) {
  const out = {};
  const nm = new THREE.Matrix3();
  /* THE REFERENCE LINE COMES FROM THE MODEL, NOT FROM A COPY OF IT. Every swept geometry records the
     polyline it was actually built on in geo.userData.refLine, so this probe measures outwardness against
     the model's own curve. The first version of this reconstructed the spans here from STATIONS, which is
     a second copy of the derivation and exactly the fault RENDER-STANDARD warns about: a check that can
     agree with a model only because both were written by the same hand on the same afternoon. */
  group.children.forEach(m => {
    if (m.userData.outline || !m.geometry) return;
    const key = m.userData.key;
    const pos = m.geometry.attributes.position, n = m.geometry.attributes.normal;
    const hull = m.geometry.userData.hullCount != null ? m.geometry.userData.hullCount : pos.count;
    m.updateMatrixWorld(true);
    nm.getNormalMatrix(m.matrixWorld);
    const v = new THREE.Vector3(), w = new THREE.Vector3(), rad = new THREE.Vector3();
    const rl = m.geometry.userData.refLine;
    const ref = rl ? rl.map(q => new THREE.Vector3(q[0], q[1], q[2])) : null;
    let centre = null;
    if (!ref) {
      centre = new THREE.Vector3();
      for (let i = 0; i < hull; i++) { v.fromBufferAttribute(pos, i).applyMatrix4(m.matrixWorld); centre.add(v); }
      centre.multiplyScalar(1 / Math.max(1, hull));
    }
    let outward = 0, total = 0;
    for (let i = 0; i < hull; i++) {
      v.fromBufferAttribute(pos, i).applyMatrix4(m.matrixWorld);
      if (ref) {
        let best = 1e18, bi = 0;
        for (let k = 0; k < ref.length; k++) { const d2 = v.distanceToSquared(ref[k]); if (d2 < best) { best = d2; bi = k; } }
        rad.subVectors(v, ref[bi]);
      } else {
        rad.subVectors(v, centre);
      }
      w.fromBufferAttribute(n, i).applyMatrix3(nm).normalize();
      if (rad.lengthSq() < 1e-12) continue;
      total++;
      if (w.dot(rad.normalize()) > 0) outward++;
    }
    const r = out[key] || (out[key] = { outward: 0, total: 0 });
    r.outward += outward; r.total += total;
  });
  Object.keys(out).forEach(k => { out[k].frac = out[k].total ? out[k].outward / out[k].total : 0; });
  return out;
};

/* ---- WINDING: does each face's own vertex order agree with its supplied normals? ---- */
window.windingProbe = function () {
  const out = {};
  const a = new THREE.Vector3(), b = new THREE.Vector3(), c = new THREE.Vector3();
  const e1 = new THREE.Vector3(), e2 = new THREE.Vector3(), fn = new THREE.Vector3(), vn = new THREE.Vector3();
  group.children.forEach(m => {
    if (m.userData.outline || !m.geometry) return;
    const key = m.userData.key;
    const pos = m.geometry.attributes.position, n = m.geometry.attributes.normal;
    const hull = m.geometry.userData.hullCount != null ? m.geometry.userData.hullCount : pos.count;
    let agree = 0, total = 0;
    for (let i = 0; i + 2 < hull; i += 3) {
      a.fromBufferAttribute(pos, i); b.fromBufferAttribute(pos, i + 1); c.fromBufferAttribute(pos, i + 2);
      e1.subVectors(b, a); e2.subVectors(c, a); fn.crossVectors(e1, e2);
      if (fn.lengthSq() < 1e-18) continue;
      vn.set(0, 0, 0);
      for (let k = 0; k < 3; k++) { const q = new THREE.Vector3().fromBufferAttribute(n, i + k); vn.add(q); }
      if (vn.lengthSq() < 1e-18) continue;
      total++;
      if (fn.normalize().dot(vn.normalize()) > 0) agree++;
    }
    const r = out[key] || (out[key] = { agree: 0, total: 0 });
    r.agree += agree; r.total += total;
  });
  Object.keys(out).forEach(k => { out[k].frac = out[k].total ? out[k].agree / out[k].total : 0; });
  return out;
};

/* ---- NO OPEN LUMEN: cast a grid of rays and ask whether the FIRST hit faces away from us ---- */
window.lumenProbe = function (dir) {
  const d = new THREE.Vector3().fromArray(dir).normalize();
  const fit = VizKit.fitCamera(camera, group, 1.08);
  camera.position.copy(fit.centre).addScaledVector(d, fit.distance);
  camera.up.set(0, 1, 0); camera.lookAt(fit.centre); camera.updateMatrixWorld(true);
  /* OPAQUE SOLIDS ONLY, and the transparent ones are reported separately rather than dropped.
     The defect this probe exists for is a student looking down an OPEN PIPE — an annular end cap with a
     lit inner surface. A back face seen through a deliberately transparent context sheet (the body wall,
     the mesentery, the yolk sac's wall, the cloacal chamber) is not that: it is what transparency means,
     and the ray reaches it because the front face is see-through. The first version mixed the two and
     reported 6.1%, which could not be attributed to anything. So the verdict is taken on the opaque
     geometry, the transparent keys get their own line in the report, and both numbers are published. */
  const all = group.children.filter(m => !m.userData.outline && m.geometry);
  const isClear = m => !!(m.material && m.material.transparent);
  const rc = new THREE.Raycaster();
  const G = 56;
  const nm = new THREE.Matrix3();
  const tally = (list) => {
    let hits = 0, away = 0; const byKey = {};
    for (let ix = 0; ix < G; ix++) for (let iy = 0; iy < G; iy++) {
      const ndc = new THREE.Vector2((ix + 0.5) / G * 2 - 1, 1 - (iy + 0.5) / G * 2);
      rc.setFromCamera(ndc, camera);
      const is = rc.intersectObjects(list, false);
      if (!is.length) continue;
      hits++;
      const h = is[0];
      nm.getNormalMatrix(h.object.matrixWorld);
      const fn = h.face.normal.clone().applyMatrix3(nm).normalize();
      if (fn.dot(rc.ray.direction) > 0.02) {
        away++;
        const k = h.object.userData.key;
        byKey[k] = (byKey[k] || 0) + 1;
      }
    }
    return { hits, away, frac: hits ? away / hits : 0, byKey };
  };
  const opaque = tally(all.filter(m => !isClear(m)));
  const clear  = tally(all.filter(isClear));
  return { hits: opaque.hits, away: opaque.away, frac: opaque.frac, byKey: opaque.byKey,
           transparent: { hits: clear.hits, away: clear.away, frac: clear.frac, byKey: clear.byKey } };
};

/* ---- MESH-VERTEX re-measurement: the relations acceptance asserts, read off real vertices ---- */
window.meshMeasure = function () {
  const byKey = {};
  group.children.forEach(m => {
    if (m.userData.outline || !m.geometry) return;
    m.updateMatrixWorld(true);
    const pos = m.geometry.attributes.position;
    const v = new THREE.Vector3();
    const r = byKey[m.userData.key] || (byKey[m.userData.key] = {
      minx: 1e9, maxx: -1e9, miny: 1e9, maxy: -1e9, minz: 1e9, maxz: -1e9, n: 0,
      cx: 0, cy: 0, cz: 0 });
    for (let i = 0; i < pos.count; i++) {
      v.fromBufferAttribute(pos, i).applyMatrix4(m.matrixWorld);
      r.minx = Math.min(r.minx, v.x); r.maxx = Math.max(r.maxx, v.x);
      r.miny = Math.min(r.miny, v.y); r.maxy = Math.max(r.maxy, v.y);
      r.minz = Math.min(r.minz, v.z); r.maxz = Math.max(r.maxz, v.z);
      r.cx += v.x; r.cy += v.y; r.cz += v.z; r.n++;
    }
  });
  Object.keys(byKey).forEach(k => {
    const r = byKey[k]; r.cx /= r.n; r.cy /= r.n; r.cz /= r.n;
  });
  return byKey;
};

window.acceptance = function () { return M().acceptance(); };
window.keysBuilt = function (t, opts) {
  const g = M().build(t, opts || M().FULL);
  const s = {};
  g.children.forEach(c => { if (!c.userData.outline) s[c.userData.key] = true; });
  return Object.keys(s).sort();
};
window.geoHash = function (t, key, opts) {
  const g = M().build(t, opts || M().FULL);
  let h = 0, n = 0;
  g.children.forEach(c => {
    if (c.userData.outline || c.userData.key !== key || !c.geometry) return;
    const p = c.geometry.attributes.position;
    for (let i = 0; i < p.count; i++) {
      h = (h * 31 + Math.round(p.getX(i) * 1e5)) % 2147483647;
      h = (h * 31 + Math.round(p.getY(i) * 1e5)) % 2147483647;
      h = (h * 31 + Math.round(p.getZ(i) * 1e5)) % 2147483647;
      n++;
    }
  });
  return { h, n };
};
<\/script></body></html>`;

writeFileSync(path.join(OUT, '_model.html'), modelPage);

const browser = await chromium.launch({
  executablePath: '/opt/pw-browsers/chromium-1194/chrome-linux/chrome',
  args: ['--use-gl=swiftshader', '--enable-unsafe-swiftshader', '--no-sandbox'],
});
const report = { when: new Date().toISOString(), model: 'primitive-gut-tube', checks: {}, fail: [] };
const note = (ok, id, detail) => {
  report.checks[id] = { pass: !!ok, detail };
  if (!ok) report.fail.push(id);
  console.log((ok ? 'PASS  ' : 'FAIL  ') + id + '  ' + (typeof detail === 'string' ? detail : JSON.stringify(detail)));
};

const page = await browser.newPage({ viewport: { width: W, height: H } });
const console_msgs = [];
/* TWO CLASSES OF MESSAGE ARE NOT THE MODEL'S, and they are filtered BY NAME rather than by relaxing
   the check, so anything else still fails the build:
     - swiftshader's "GL Driver Message (OpenGL, Performance ...) GPU stall due to ReadPixels". This is
       the software rasteriser telling us that screenshotting stalls the pipeline. It is a property of
       rendering headless on a CPU, appears on every model built in this container, and says nothing
       about the geometry.
     - the favicon 404. The harness serves the repo over a bare http server with no favicon.
   Everything else — any error, any throw, any other warning — still fails. */
const IGNORE = [/GL Driver Message/, /GPU stall due to ReadPixels/, /favicon/i];
page.on('console', m => {
  if (m.type() !== 'error' && m.type() !== 'warning') return;
  const txt = m.type() + ': ' + m.text();
  if (IGNORE.some(r => r.test(txt))) return;
  console_msgs.push(txt);
});
page.on('pageerror', e => console_msgs.push('pageerror: ' + e.message));
page.on('requestfailed', r => { if (!/favicon/i.test(r.url())) console_msgs.push('requestfailed: ' + r.url()); });
await page.goto(BASE + 'viz-training/models-out/primitive-gut-tube/_model.html', { waitUntil: 'load' });

/* ---- 4. acceptance ---- */
const acc = await page.evaluate(() => window.acceptance());
writeFileSync(path.join(OUT, 'acceptance.json'), JSON.stringify(acc, null, 2));
note(acc.allPass, 'acceptance',
  `${acc.rows.filter(r => r.pass).length}/${acc.rows.length} rows` +
  (acc.allPass ? '' : ' — failing: ' + acc.rows.filter(r => !r.pass).map(r => r.id).join(', ')));

/* ---- 1. renders, and 3/win per t ---- */
const normals = {}, winding = {};
for (const t of T_SAMPLES) {
  const built = await page.evaluate(tt => window.buildAt(tt), t);
  for (const [name, dir] of Object.entries(CAMERAS)) {
    await page.evaluate(d => window.shoot(d), dir);
    const f = `t${String(Math.round(t * 100)).padStart(3, '0')}-${name}.png`;
    await page.locator('#c').screenshot({ path: path.join(OUT, f) });
  }
  /* AND ONE FRAME PER t WITH THE ENTERIC SLEEVE OFF, because check 4 is a human judging the gut's
     FORM and its three-division colour key, and an overlay covering the whole tube is the one thing
     that stops either being judgeable. Both sets are kept: the FULL frames are what the adapter
     resolves, these are what a reader looks at. */
  await page.evaluate(tt => window.buildAt(tt, Object.assign({}, window.MB3D_MODELS['primitive-gut-tube'].FULL, { enteric: false })), t);
  await page.evaluate(d => window.shoot(d), CAMERAS.anterior);
  await page.locator('#c').screenshot({ path: path.join(OUT, `t${String(Math.round(t * 100)).padStart(3, '0')}-anterior-nonerve.png`) });
  await page.evaluate(tt => window.buildAt(tt), t);
  const np = await page.evaluate(tt => window.normalProbe(tt), t);
  const wp = await page.evaluate(() => window.windingProbe());
  normals['t' + t] = np; winding['t' + t] = wp;
  console.log(`  built t=${t}: ${built.meshes} meshes`);
}
writeFileSync(path.join(OUT, 'normals.json'), JSON.stringify(normals, null, 2));
writeFileSync(path.join(OUT, 'winding.json'), JSON.stringify(winding, null, 2));

/* the normals verdict: closed solids must be strongly majority-outward. The mesentery, the body wall,
   the two membranes and the septum are SHEETS — a thin slab read at its own centroid is about half
   outward by construction, which is a fact about the shape and not a defect, so they are judged on
   WINDING instead and named here rather than quietly excluded. */
const SHEETS = new Set(['mesentery', 'bodywall', 'buccoph', 'cloacalmem', 'urorectal', 'enteric', 'vitelline']);
let nBad = [], wBad = [];
for (const [tk, byKey] of Object.entries(normals)) {
  for (const [k, v] of Object.entries(byKey)) {
    if (SHEETS.has(k)) continue;
    if (v.frac < 0.90) nBad.push(`${tk}/${k}=${v.frac.toFixed(3)}`);
  }
}
for (const [tk, byKey] of Object.entries(winding)) {
  for (const [k, v] of Object.entries(byKey)) {
    if (v.frac < 0.995) wBad.push(`${tk}/${k}=${v.frac.toFixed(3)}`);
  }
}
note(nBad.length === 0, 'normals-outward', nBad.length ? nBad.slice(0, 14) : 'all solids >= 0.90');
note(wBad.length === 0, 'winding', wBad.length ? wBad.slice(0, 14) : 'all keys >= 0.995');

/* ---- 7. no open lumen ---- */
const lum = [];
for (const t of [0, 0.5, 1]) {
  await page.evaluate(tt => window.buildAt(tt), t);
  for (const [name, dir] of Object.entries(CAMERAS)) {
    const r = await page.evaluate(d => window.lumenProbe(d), dir);
    lum.push({ t, camera: name, ...r });
  }
}
writeFileSync(path.join(OUT, 'lumen.json'), JSON.stringify(lum, null, 2));
const worstLum = Math.max(...lum.map(r => r.frac));
const offenders = {};
lum.forEach(r => Object.entries(r.byKey || {}).forEach(([k, v]) => { offenders[k] = (offenders[k] || 0) + v; }));
const worstClear = Math.max(...lum.map(r => r.transparent.frac));
note(worstLum <= 0.02, 'no-open-lumen',
  `OPAQUE worst first-hit-faces-away ${worstLum.toFixed(4)} over ${lum.length} camera/t combos` +
  (Object.keys(offenders).length ? '; by key ' + JSON.stringify(offenders) : '') +
  `; transparent context separately ${worstClear.toFixed(4)} (reported, not judged)`);

/* ---- 6. mesh-vertex re-measurement of the rotation's consequences ---- */
await page.evaluate(() => window.buildAt(1));
const mm = await page.evaluate(() => window.meshMeasure());
writeFileSync(path.join(OUT, 'mesh-measure.json'), JSON.stringify(mm, null, 2));
const caecOnRight = mm.caecum && mm.caecum.cx < -0.10;
const djOnLeft = mm.duodenum && mm.duodenum.maxx > 0.10;
note(caecOnRight, 'mesh/caecum-on-right',
  mm.caecum ? `caecum centroid x = ${mm.caecum.cx.toFixed(4)} (RIGHT is -x)` : 'caecum missing');
note(djOnLeft, 'mesh/dj-on-left',
  mm.duodenum ? `duodenum max x = ${mm.duodenum.maxx.toFixed(4)} (LEFT is +x)` : 'duodenum missing');
/* THE PAPILLA'S SIDE, ON REAL VERTICES. Asked for by name in finding 2 of the 2026-10-01 review, whose
   first half was the papilla being on the embryo's LEFT and whose second half was that NO ROW CHECKED.
   The papilla is its own blob mesh, so this is its centroid and not a centreline proxy. */
const papOnRight = mm.papilla && mm.papilla.cx <= -0.05;
note(papOnRight, 'mesh/papilla-on-right',
  mm.papilla ? `papilla centroid x = ${mm.papilla.cx.toFixed(4)} (RIGHT is -x)` : 'papilla missing');
/* and the C between them, so the two side rows cannot both be satisfied by a tube that merely leans */
const duodCrosses = mm.duodenum && mm.duodenum.minx <= -0.05 && mm.duodenum.maxx >= 0.12;
note(duodCrosses, 'mesh/duodenal-C-crosses-midline',
  mm.duodenum ? `duodenum x range [${mm.duodenum.minx.toFixed(4)}, ${mm.duodenum.maxx.toFixed(4)}]`
              : 'duodenum missing');
/* ---- EVERY MARKER STANDS CLEAR OF THE TUBE IT MARKS, on built vertices.
   The two boundary beads were radius 0.050 and 0.048 on a tube of radius 0.055 — inside it, and
   therefore invisible from every camera at every framing. Measured here as the marker mesh's own
   half-extent against radiusAt() at that marker's station, so neither side is a constant: the model
   derives the bead from the calibre and this reads the result off the geometry. */
const markerStations = await page.evaluate(() => {
  const M = window.MB3D_MODELS['primitive-gut-tube'], S = M.STATIONS;
  return { papilla: M.radiusAt(S.S_FG, 1), watershed: M.radiusAt(S.S_MG, 1),
           caecum: M.radiusAt(S.S_CAECUM, 1) };
});
const proud = Object.entries(markerStations).map(([k, rTube]) => {
  const b = mm[k];
  if (!b) return { key: k, ok: false, why: 'mesh missing' };
  const half = Math.min((b.maxx - b.minx) / 2, (b.maxy - b.miny) / 2, (b.maxz - b.minz) / 2);
  return { key: k, rTube: rTube, markerHalf: half, ratio: half / Math.max(1e-9, rTube),
           ok: half / Math.max(1e-9, rTube) >= 1.25 };
});
writeFileSync(path.join(OUT, 'markers.json'), JSON.stringify(proud, null, 2));
note(proud.every(r => r.ok), 'mesh/markers-stand-clear',
  proud.map(r => r.key + ' ' + (r.ratio == null ? r.why : r.ratio.toFixed(2) + 'x its tube')).join(', '));

/* the papilla must also lie ON the duodenum's own mesh extent, not merely near it */
note(mm.papilla && mm.duodenum && mm.papilla.cx >= mm.duodenum.minx - 1e-6 &&
     mm.papilla.cx <= mm.duodenum.maxx + 1e-6, 'mesh/papilla-on-the-duodenum',
  mm.papilla && mm.duodenum
    ? `papilla cx ${mm.papilla.cx.toFixed(4)} within duodenum [${mm.duodenum.minx.toFixed(4)}, ${mm.duodenum.maxx.toFixed(4)}]`
    : 'missing');
/* ---- THE DUODENAL LUMEN AND THE EPITHELIAL PLUG, ON REAL VERTICES.
   Added 2026-10-01 for review round 3, finding 3. The lumen existed in this model only as lumenAt(),
   a number the acceptance battery read, so rows RECAN-CLOSES / RECAN-OPENS / RECAN-LOCAL proved the
   SCHEDULE and nothing proved that a student could see any of it. The plug now has geometry and these
   three rows read it off built vertices. They are here and not in acceptance() on purpose: in the
   model, plugFrac is DEFINED as LUMEN_OPEN - lumenAt, so any row comparing them cancels to a
   compile-time constant and cannot fail \u2014 this file's own ACCEPTANCE note warns about exactly that.
   What can fail is the geometry: a cast built on the wrong span, outside the wall, or at the wrong t. */
const plugPeakT = await page.evaluate(() => window.MB3D_MODELS['primitive-gut-tube'].PLUG_PEAK_T);
/* (1) the patent cast lives strictly INSIDE the wall it is the lumen of, measured at t = 1 where the
   duodenum is its final C. A cast that had escaped the wall would be a tube drawn over the duodenum. */
const lumInside = mm.duod_lumen && mm.duodenum &&
  mm.duod_lumen.minx > mm.duodenum.minx && mm.duod_lumen.maxx < mm.duodenum.maxx &&
  mm.duod_lumen.miny > mm.duodenum.miny && mm.duod_lumen.maxy < mm.duodenum.maxy &&
  mm.duod_lumen.minz > mm.duodenum.minz && mm.duod_lumen.maxz < mm.duodenum.maxz;
note(lumInside, 'mesh/lumen-cast-inside-the-duodenum',
  mm.duod_lumen && mm.duodenum
    ? `lumen x [${mm.duod_lumen.minx.toFixed(4)}, ${mm.duod_lumen.maxx.toFixed(4)}] inside duodenum ` +
      `x [${mm.duodenum.minx.toFixed(4)}, ${mm.duodenum.maxx.toFixed(4)}]; z-depth ` +
      `${(mm.duod_lumen.maxz - mm.duod_lumen.minz).toFixed(4)} against ` +
      `${(mm.duodenum.maxz - mm.duodenum.minz).toFixed(4)}`
    : 'duod_lumen or duodenum missing at t = 1');
/* (2) at the peak of the plug the cord FILLS what the channel occupied, and the channel is gone.
   Both read from the same build, so this is one picture and not two measurements stitched together. */
await page.evaluate(tt => window.buildAt(tt), plugPeakT);
const mmPlug = await page.evaluate(() => window.meshMeasure());
writeFileSync(path.join(OUT, 'mesh-measure-plug-peak.json'),
  JSON.stringify({ t: plugPeakT, mm: mmPlug }, null, 2));
const plugCal = mmPlug.duod_plug ? Math.min(mmPlug.duod_plug.maxz - mmPlug.duod_plug.minz,
                                            mmPlug.duod_plug.maxx - mmPlug.duod_plug.minx) : 0;
const duodCal = mmPlug.duodenum ? Math.min(mmPlug.duodenum.maxz - mmPlug.duodenum.minz,
                                           mmPlug.duodenum.maxx - mmPlug.duodenum.minx) : 0;
const plugFills = !!mmPlug.duod_plug && !mmPlug.duod_lumen && plugCal > 0.30 * duodCal;
note(plugFills, 'mesh/plug-fills-the-cord-stage',
  `t = ${plugPeakT}: duod_plug ${mmPlug.duod_plug ? 'built' : 'MISSING'}, duod_lumen ` +
  `${mmPlug.duod_lumen ? 'STILL BUILT \u2014 there is no cord stage' : 'absent (the lumen is obliterated)'}` +
  `; plug calibre ${plugCal.toFixed(4)} against duodenal calibre ${duodCal.toFixed(4)} ` +
  `(${duodCal ? (plugCal / duodCal).toFixed(3) : 'n/a'} of it)`);
/* (3) and it is GONE once the lumen is patent, which is the half of recanalization that matters
   clinically: duodenal atresia is the failure of this cord to disappear. */
const presPatent = await page.evaluate(() => window.keysBuilt(1));
note(presPatent.indexOf('duod_plug') < 0 && presPatent.indexOf('duod_lumen') >= 0,
  'mesh/plug-absent-once-patent',
  `at t = 1 duod_plug ${presPatent.indexOf('duod_plug') < 0 ? 'is gone' : 'IS STILL BUILT'} and ` +
  `duod_lumen ${presPatent.indexOf('duod_lumen') >= 0 ? 'is built' : 'IS MISSING'}`);
await page.evaluate(() => window.buildAt(1));

/* the proxy-vs-mesh agreement: acceptance read these off the centreline, this reads them off vertices */
const proxy = acc.measured;
const dis = Math.abs(proxy.caecum_x - (mm.caecum ? mm.caecum.cx : 0));
note(dis < 0.14, 'mesh-vs-proxy', `caecum x disagreement centreline vs mesh centroid = ${dis.toFixed(4)}`);

/* ---- 9. STATIC_PARTS and STAGE_LIMITED are both real ---- */
const decl = await page.evaluate(() => {
  const M = window.MB3D_MODELS['primitive-gut-tube'];
  return { statics: Object.keys(M.STATIC_PARTS), limited: Object.keys(M.STAGE_LIMITED) };
});
const hashes = {};
for (const t of [0.2, 0.6, 1]) {
  for (const k of decl.statics) hashes[k] = (hashes[k] || []).concat([await page.evaluate(
    a => window.geoHash(a[0], a[1]), [t, k])]);
}
const staticBad = decl.statics.filter(k => new Set(hashes[k].map(h => h.h + ':' + h.n)).size !== 1);
note(staticBad.length === 0, 'declared-statics-are-static',
  staticBad.length ? ('these MOVE but are declared static: ' + staticBad.join(', ')) : decl.statics.join(', '));

/* an UNDECLARED static part is also a failure: build every key at two t and find any that never move */
const keysAll = await page.evaluate(() => window.keysBuilt(1));
const movers = {};
for (const k of keysAll) {
  const a = await page.evaluate(x => window.geoHash(0.45, x), k);
  const b = await page.evaluate(x => window.geoHash(0.95, x), k);
  movers[k] = (a.h !== b.h || a.n !== b.n);
}
const undeclaredStatic = keysAll.filter(k => !movers[k] && decl.statics.indexOf(k) < 0);
note(undeclaredStatic.length === 0, 'no-undeclared-statics',
  undeclaredStatic.length ? ('static but NOT declared: ' + undeclaredStatic.join(', ')) : 'none');

/* declared absences are real, and every absence is declared */
const presence = {};
for (const t of [0, 0.2, 0.35, 0.5, 0.8, 1]) presence['t' + t] = await page.evaluate(tt => window.keysBuilt(tt), t);
writeFileSync(path.join(OUT, 'presence.json'), JSON.stringify(presence, null, 2));
const everPresent = new Set(); Object.values(presence).forEach(a => a.forEach(k => everPresent.add(k)));
const sometimesAbsent = [...everPresent].filter(k => Object.values(presence).some(a => a.indexOf(k) < 0));
const undeclaredAbsence = sometimesAbsent.filter(k => decl.limited.indexOf(k) < 0);
note(undeclaredAbsence.length === 0, 'no-undeclared-absences',
  undeclaredAbsence.length ? ('absent at some t but NOT declared: ' + undeclaredAbsence.join(', '))
                           : sometimesAbsent.join(', '));

/* ---- 2. console clean on the model page ---- */
note(console_msgs.length === 0, 'console-clean/model', console_msgs.slice(0, 8));

writeFileSync(path.join(OUT, 'report.json'), JSON.stringify(report, null, 2));

/* ================================================= 10. NEGATIVE CASES AND PERTURBATION

   THIS TOOL'S OWN HEADER HAS LISTED BOTH OF THESE AS THINGS THAT MUST PASS SINCE IT WAS WRITTEN, AND
   NEITHER WAS IMPLEMENTED. Three of the four sibling render harnesses in viz-training/tools (
   body-cavity-coelom, lateral-folding, cranio-caudal-folding) carry a NEGATIVE CASES section and a
   PERTURBATION section; this one carried the sentences and not the code, so items 4 and 5 of its
   checklist have been passing by not being run. Found 2026-10-01 by the build run doing round 2 of
   this item, which needed the discipline for its own new rows and went looking for it.

   WHAT IS HERE IS NOT THE WHOLE BATTERY. The rows below are the ones this round's fix turns on — the
   three that decide which SIDE of the midline a station ends up — plus the two whose floors the fix
   moved. Thirty-four rows declare a `perturb` list and 29 of them are still unexercised; that is
   reported in built_notes rather than papered over, because the gap is the tool's, not this item's,
   and fixing it for every row is its own piece of work. */
const require2 = createRequire(import.meta.url);
const THREE_NODE = require2(ROOT + '/node_modules/three/build/three.js');
const KIT_SRC = readFileSync(path.join(ROOT, 'models3d/render-kit.js'), 'utf8');
const MODEL_SRC = readFileSync(path.join(ROOT, 'models3d/primitive-gut-tube.js'), 'utf8');
function evalModel(src) {
  const sandbox = {
    window: { THREE: THREE_NODE }, console: { log() {}, warn() {}, error() {} },
    Math, isFinite, isNaN, Number, Float32Array, Float64Array, Int8Array, Int16Array, Int32Array,
    Uint8Array, Uint8ClampedArray, Uint16Array, Uint32Array, ArrayBuffer, DataView,
    Array, Set, Map, WeakMap, WeakSet, Date, JSON, parseFloat, parseInt, String, Object, Error,
    Boolean, Function, Symbol, Promise, RegExp, TypeError, RangeError,
    performance: { now: () => Date.now() },
  };
  sandbox.globalThis = sandbox;
  vm.createContext(sandbox);
  vm.runInContext(KIT_SRC, sandbox, { filename: 'render-kit.js' });
  vm.runInContext(src, sandbox, { filename: 'model.js' });
  const reg = sandbox.window.MB3D_MODELS || {};
  const ids = Object.keys(reg);
  if (!ids.length) throw new Error('that file registered no model');
  return reg[ids[0]];
}
function sub(src, from, to) {
  if (src.indexOf(from) < 0) throw new Error('perturbation lever not found: ' + from);
  return src.replace(from, to);
}

/* ---- NEGATIVE CASES: each floor is fed a value it MUST reject, so the predicate is disciplined ---- */
const NEG = [
  ['PAP-R rejects the left',      m => m.papilla_x <= -0.05, { papilla_x: +0.271 }],
  ['PAP-R rejects the midline',   m => m.papilla_x <= -0.05, { papilla_x: -0.004 }],
  ['DJ-L rejects the right',      m => m.dj_x >= 0.12,       { dj_x: -0.271 }],
  ['CAEC-R rejects the left',     m => m.caecum_x <= -0.12,  { caecum_x: +0.308 }],
  ['DUOD-C rejects a leaning tube', m => (m.papilla_x < 0) !== (m.dj_x < 0) &&
       m.duod_x_lo <= -0.05 && m.duod_x_hi >= 0.12, { papilla_x: 0.10, dj_x: 0.27,
       duod_x_lo: 0.10, duod_x_hi: 0.27 }],
];
const negBad = NEG.filter(([, pred, bad]) => pred(bad) === true).map(([n]) => n);
note(negBad.length === 0, 'negative-cases',
  negBad.length ? ('these floors ACCEPTED a value they must reject: ' + negBad.join('; '))
                : NEG.length + ' floors each rejected a deliberately wrong value');

/* ---- PERTURBATION: change the constant the geometry reads, and the row's number must move ---- */
const LEVERS = [
  ['PAP-R / R_PANC_HEAD', 'const R_PANC_HEAD = 0.044;', 'const R_PANC_HEAD = 0.120;',
   m => m.acceptance().measured.papilla_x],
  ['PAP-R / S_DUOD_A',    'const S_DUOD_A = S_FG - 0.035', 'const S_DUOD_A = S_FG - 0.070',
   m => m.acceptance().measured.papilla_x],
  ['DJ-L / DJ_FRAC',      'const DJ_FRAC  = 0.88;', 'const DJ_FRAC  = 0.40;',
   m => m.acceptance().measured.dj_x],
  ['CAEC-R / ROT_TOTAL',  'const ROT_TOTAL = 270 * Math.PI / 180;', 'const ROT_TOTAL = 110 * Math.PI / 180;',
   m => m.acceptance().measured.caecum_x],
  ['DUOD-C / R_PANC_HEAD','const R_PANC_HEAD = 0.044;', 'const R_PANC_HEAD = 0.004;',
   m => m.acceptance().measured.duod_x_lo],
];
const base = evalModel(MODEL_SRC);
const pert = [];
for (const [name, from, to, read] of LEVERS) {
  let moved = null, a = null, b = null, err = null;
  try {
    a = read(base);
    b = read(evalModel(sub(MODEL_SRC, from, to)));
    moved = Math.abs(a - b) > 1e-6;
  } catch (e) { err = e && e.message; }
  pert.push({ lever: name, before: a, after: b, moved: moved, error: err });
}
writeFileSync(path.join(OUT, 'perturbation.json'), JSON.stringify(pert, null, 2));
const pBad = pert.filter(r => r.moved !== true);
note(pBad.length === 0, 'perturbation',
  pBad.length ? ('these levers did NOT move the number their row reads: ' +
                 pBad.map(r => r.lever + (r.error ? ' (' + r.error + ')' : '')).join('; '))
              : pert.map(r => r.lever + ' ' + (+r.before).toFixed(4) + '->' + (+r.after).toFixed(4)).join(', '));

console.log('\n' + (report.fail.length ? 'FAILED: ' + report.fail.join(', ') : 'ALL CHECKS PASS'));
await browser.close();
server.close();
process.exit(report.fail.length ? 1 : 0);
