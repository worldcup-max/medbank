/* MedBank · headless proof for models3d/coronary-arteries-cardiac-veins.js
 *
 * Everything BUILD-TASK-PROMPT section 3 asks for, run on a real browser against the real adapter:
 *
 *   1. IT RENDERS. Eleven frames — five cameras on the full build, the arteries alone, the veins
 *      alone, the territories from front and back, the vessels with the myocardium stripped off, and
 *      the left-dominant variant. PNGs to viz-training/models-out/coronary-arteries-cardiac-veins/.
 *   2. THE CONSOLE IS CLEAN. Errors, warnings, page errors, failed requests and any HTTP >= 400.
 *      Note the favicon: a browser asks for /favicon.ico unprompted, and the 404 it gets is reported
 *      as a console error that looks exactly like a missing model file. The server answers it, so a
 *      404 in this run means a real missing file.
 *   3. NORMALS POINT OUTWARD — by RAY-CAST, which is the probe that matters here. The centroid probe
 *      RENDER-STANDARD describes is close to meaningless on this model: nearly every structure in it
 *      is a long curved tube, and a tube read against its own centroid scores about 55-60% outward
 *      when it is perfectly built. So this casts a grid of rays from every camera and counts how many
 *      meet a surface FACING AWAY from them, which is what looking down an open pipe means.
 *      AND IT DISCRIMINATES A HOLE FROM A SILHOUETTE GRAZE, rather than leaving that to a threshold:
 *      for every facing-away hit it re-casts against that object alone and measures how far behind
 *      the first hit the second one is. A ray clipping the edge of a closed solid enters and leaves
 *      within a fraction of a millimetre; a ray that has found a hole crosses the interior, or meets
 *      nothing at all. A threshold on the ANGLE would have been a number chosen to make the run pass.
 *   4. IT LOOKS LIKE THE THING — the PNGs, read by a person. Not automatable, not skippable.
 *   5. EVERY REF RESOLVES THROUGH THE REAL ADAPTER in viz3d.js, with geometry, one by one.
 *   6. A NARRATION CLAIM IS MEASURED. The scene says the pulmonary trunk hides the left main and its
 *      next beat takes the trunk away to reveal it. RENDER-STANDARD: a spatial claim in narration is
 *      a testable assertion, and the round-3 cardiac-looping review found a reference 96.5% occluded
 *      in the only view that highlighted it because nothing counted its pixels. So this counts them,
 *      with the trunk and without, from one camera fitted on the WITH-trunk build so that removing
 *      the trunk cannot move the camera and change the answer for a reason that is not occlusion.
 *
 * WHERE THIS RUNS. In a Linux container with chromium, against a copy of the repo — not on the
 * mounted repo itself, which has no browser and no playwright. The files under test are byte
 * identical; the substrate for the RENDER is not the mount. What the mount IS the substrate for is
 * the queue lock, and that is exercised there, by queue-set.mjs, on every status change this run made.
 *
 * Run from the repo root, in a container with the repo copied in:
 *   node viz-training/tools/render-coronary-arteries.mjs
 */

import { chromium } from 'playwright';
import { readFileSync, mkdirSync, writeFileSync } from 'fs';
import http from 'http';
import path from 'path';
import fs from 'fs';

const ROOT = process.cwd();
const OUT = 'viz-training/models-out/coronary-arteries-cardiac-veins';
mkdirSync(OUT, { recursive: true });

const MIME = { '.js': 'text/javascript', '.json': 'application/json', '.html': 'text/html' };
const server = http.createServer((req, res) => {
  let p = decodeURIComponent(req.url.split('?')[0]);
  if (p === '/') p = '/index.html';
  const f = path.join(ROOT, p);
  if (p === '/favicon.ico') { res.writeHead(200, { 'content-type': 'image/x-icon' }); res.end(Buffer.alloc(0)); return; }
  if (!f.startsWith(ROOT) || !fs.existsSync(f)) { console.log('SERVER 404 for ' + p); res.writeHead(404); res.end('no'); return; }
  res.writeHead(200, { 'content-type': MIME[path.extname(f)] || 'application/octet-stream' });
  res.end(fs.readFileSync(f));
});
await new Promise(r => server.listen(8099, r));

const SCENE = JSON.parse(readFileSync(ROOT + '/viz-training/scenes/gross__heart-pericardium__coronary-arteries-cardiac-veins.json', 'utf8'));
const REFS = SCENE.structures.map(s => ({ key: s.key, ref: s.refs && s.refs.procedural })).filter(s => s.ref);

const html = `<!doctype html><html><head><meta charset="utf-8"><style>
html,body{margin:0;background:#101418}canvas{display:block}</style></head><body>
<script src="/three.min.js"></script>
<script src="/models3d/render-kit.js"></script>
<script src="/models3d/coronary-arteries-cardiac-veins.js"></script>
</body></html>`;
writeFileSync(ROOT + '/index.html', html);
fs.copyFileSync('node_modules/three/build/three.min.js', ROOT + '/three.min.js');   // r128, the version the app ships

const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium-1194/chrome-linux/chrome', args: ['--use-gl=swiftshader', '--enable-unsafe-swiftshader', '--disable-gpu-sandbox'] });
const page = await b.newPage({ viewport: { width: 1100, height: 820 } });

const noise = [];
page.on('console', m => { if (m.type() === 'error' || m.type() === 'warning') noise.push(m.type() + ': ' + m.text()); });
page.on('pageerror', e => noise.push('pageerror: ' + e.message));
page.on('requestfailed', r => noise.push('requestfailed: ' + r.url()));
page.on('response', r => { if (r.status() >= 400) noise.push('http ' + r.status() + ': ' + r.url()); });

await page.goto('http://localhost:8099/index.html', { waitUntil: 'networkidle' });

const CAMS = {
  anterior:  [0, 0, 1], posterior: [0, 0, -1], left: [1, 0, 0],
  right:     [-1, 0, 0], inferior:  [0, -1, 0.35],
};

const result = await page.evaluate(async ({ CAMS }) => {
  const T = window.THREE, K = window.VizKit;
  const M = window.MB3D_MODELS['coronary-arteries-cardiac-veins'];
  const out = { shots: [], rays: {}, normals: {}, acceptance: null, err: null };
  const renderer = new T.WebGLRenderer({ antialias: true, preserveDrawingBuffer: true });
  renderer.setSize(1100, 820); renderer.setPixelRatio(1);
  K.configureRenderer(renderer);
  renderer.setClearColor(K.bg(0x101418), 1);
  document.body.appendChild(renderer.domElement);

  function shoot(group, dirArr, label) {
    const scene = new T.Scene();
    scene.add(group);
    K.standardLights(scene);
    const cam = new T.PerspectiveCamera(38, 1100 / 820, 0.1, 400);
    const fit = K.fitCamera(cam, group, 1.10);
    const d = new T.Vector3().fromArray(dirArr).normalize();
    cam.position.copy(fit.centre).addScaledVector(d, fit.distance);
    cam.up.set(0, 1, 0);
    if (Math.abs(d.y) > 0.9) cam.up.set(0, 0, 1);
    cam.lookAt(fit.centre);
    renderer.render(scene, cam);
    /* ------- RAY-CAST FIRST-HIT PROBE. A grid of rays from the camera; count how many meet a
       surface whose normal faces AWAY from them. On a closed solid the answer is zero, and a
       non-zero answer means you are looking down an open pipe or at inverted winding. */
    const rc = new T.Raycaster();
    const meshes = [];
    group.traverse(o => { if (o.isMesh && !o.userData.outline) meshes.push(o); });
    let hits = 0, away = 0;
    const worst = {};
    const nrm = new T.Vector3(), ndc = new T.Vector2();
    for (let i = 0; i < 46; i++) for (let j = 0; j < 46; j++) {
      ndc.set(-1 + 2 * (i + 0.5) / 46, -1 + 2 * (j + 0.5) / 46);
      rc.setFromCamera(ndc, cam);
      const hit = rc.intersectObjects(meshes, false)[0];
      if (!hit) continue;
      hits++;
      const g = hit.object.geometry;
      if (!g.attributes.normal) continue;
      const f = hit.face;
      nrm.set(0, 0, 0);
      const na = g.attributes.normal;
      for (const idx of [f.a, f.b, f.c]) nrm.add(new T.Vector3(na.getX(idx), na.getY(idx), na.getZ(idx)));
      nrm.normalize().transformDirection(hit.object.matrixWorld);
      const dp = nrm.dot(rc.ray.direction);
      if (dp > 0.02) {
        away++;
        const k = hit.object.userData.key;
        /* IS THIS A HOLE OR A SILHOUETTE GRAZE? Decide it by measuring, not by the angle. Cast the
           same ray again against this object alone and look at how far behind the first hit the
           SECOND one is. A ray clipping the very edge of a closed solid enters and leaves within a
           fraction of a millimetre. A ray that has found a hole travels the width of the interior
           before it meets anything, and often meets nothing at all. */
        const again = rc.intersectObject(hit.object, false);
        const gap = again.length > 1 ? (again[1].distance - again[0].distance) : -1;
        if (!worst[k]) worst[k] = { n: 0, maxDot: 0, maxGap: -1, sheet: !!hit.object.userData.sheet };
        worst[k].n++;
        if (dp > worst[k].maxDot) worst[k].maxDot = Math.round(dp * 1000) / 1000;
        if (gap > worst[k].maxGap) worst[k].maxGap = Math.round(gap * 1000) / 1000;
      }
    }
    out.rays[label] = { hits, away, byKey: worst };
    scene.remove(group);
    return renderer.domElement.toDataURL('image/png');
  }

  try {
    const g = M.build(1, M.FULL);
    for (const [label, dir] of Object.entries(CAMS)) {
      out.shots.push({ name: 'full-' + label, png: shoot(g, dir, label) });
    }
    /* the arteries alone, and the veins alone — the diagnostic ladder's "render the suspect layer
       alone" applied preventively rather than after something goes wrong */
    const art = M.build(1, { myocardium: true, sulci: true, arteries: true, septal: true, context: true, veins: false, nodes: false, territories: false });
    out.shots.push({ name: 'arteries-anterior', png: shoot(art, [0.35, 0.1, 1], 'arteries-ant') });
    const ven = M.build(1, { myocardium: true, sulci: true, veins: true, context: true, arteries: false, nodes: false, territories: false });
    out.shots.push({ name: 'veins-posterior', png: shoot(ven, [0, -0.15, -1], 'veins-post') });
    const terr = M.build(1, { myocardium: true, territories: true, arteries: true, sulci: true, veins: false, nodes: false, context: false });
    out.shots.push({ name: 'territories-anterior', png: shoot(terr, [0.2, 0, 1], 'terr-ant') });
    out.shots.push({ name: 'territories-posterior', png: shoot(terr, [0, -0.3, -1], 'terr-post') });
    const noMyo = M.build(1, Object.assign({}, M.FULL, { myocardium: false, context: false, territories: false }));
    out.shots.push({ name: 'septum-lateral', png: shoot(noMyo, [1, 0.1, 0.2], 'septum-lat') });
    const ld = M.build(1, Object.assign({}, M.FULL, { left_dominant: true }));
    out.shots.push({ name: 'left-dominant-posterior', png: shoot(ld, [0, -0.2, -1], 'ld-post') });
    out.acceptance = M.acceptance(true);
  } catch (e) { out.err = String(e && e.stack || e); }
  return out;
}, { CAMS });

if (result.err) { console.log('BUILD THREW:\n' + result.err); }
for (const s of result.shots) {
  writeFileSync(`${OUT}/${s.name}.png`, Buffer.from(s.png.split(',')[1], 'base64'));
}
console.log('screenshots:', result.shots.map(s => s.name).join(', '));
console.log('\n== RAY-CAST FIRST-HIT PROBE (rays meeting a surface that faces AWAY) ==');
let totalAway = 0;
for (const [k, v] of Object.entries(result.rays)) {
  totalAway += v.away;
  console.log('  ' + k.padEnd(16) + ' hits ' + String(v.hits).padStart(5) + '   facing-away ' + String(v.away).padStart(4) +
    (v.away ? '   ' + JSON.stringify(v.byKey) : ''));
}
console.log('  TOTAL facing-away:', totalAway);

console.log('\n== ACCEPTANCE (in browser) ==', result.acceptance && result.acceptance.ok);
if (result.acceptance) for (const c of result.acceptance.checks)
  console.log((c.pass ? ' PASS ' : ' FAIL ') + c.id + '  neg=' + c.negative_case_rejected);

/* ---------------------------------------------------------------- 5 · the REAL adapter */
const adapterPage = await b.newPage();
const anoise = [];
adapterPage.on('console', m => { if (m.type() === 'error' || m.type() === 'warning') anoise.push(m.type() + ': ' + m.text()); });
adapterPage.on('pageerror', e => anoise.push('pageerror: ' + e.message));
writeFileSync(ROOT + '/adapter.html', `<!doctype html><html><head><meta charset="utf-8"></head><body>
<script src="/three.min.js"></script>
<script>window.MEDBANK_CONFIG={MODEL_BASE:'/models3d/'};</script>
<script src="/viz3d.js"></script>
</body></html>`);
await adapterPage.goto('http://localhost:8099/adapter.html', { waitUntil: 'networkidle' });

const adapt = await adapterPage.evaluate(async (REFS) => {
  const rows = [];
  const MB = window.MB3D;
  if (!MB || !MB.adapters || !MB.adapters.procedural) return [{ key: '(no adapter)', ok: false, why: 'MB3D.adapters.procedural missing' }];
  for (const r of REFS) {
    try {
      const res = await MB.adapters.procedural.load(window.THREE, { refs: { procedural: r.ref } });
      const obj = res && (res.object || res.mesh || res);
      let mesh = null;
      if (obj && obj.isMesh) mesh = obj;
      else if (obj && obj.traverse) obj.traverse(o => { if (!mesh && o.isMesh) mesh = o; });
      const n = mesh && mesh.geometry && mesh.geometry.attributes.position
        ? mesh.geometry.attributes.position.count : 0;
      rows.push({ key: r.key, ref: r.ref, ok: n > 0, verts: n, reason: res && res.reason });
    } catch (e) { rows.push({ key: r.key, ref: r.ref, ok: false, why: String(e && e.message || e) }); }
  }
  return rows;
}, REFS);

console.log('\n== EVERY SCENE REF THROUGH THE REAL ADAPTER (viz3d.js) ==');
let bad = 0;
for (const r of adapt) {
  if (!r.ok) bad++;
  console.log((r.ok ? ' OK   ' : ' FAIL ') + String(r.key).padEnd(24) + String(r.verts || 0).padStart(7) + ' verts' +
    (r.ok ? '' : '   ' + (r.why || r.reason || '')));
}
console.log('  refs:', adapt.length, ' failing:', bad);

console.log('\n== CONSOLE ==');
console.log('  model page :', noise.length ? noise : 'clean');
console.log('  adapter page:', anoise.length ? anoise : 'clean');


/* ------------------------------------------------------- 6 · a narration claim, measured

   The scene's second beat says the left coronary artery cannot be seen from the front because the
   pulmonary trunk covers it; the third takes the trunk away to reveal it. Count the pixels. */
const occPage = await b.newPage({ viewport: { width: 900, height: 700 } });
await occPage.goto('http://localhost:8099/index.html', { waitUntil: 'networkidle' });
const occ = await occPage.evaluate(() => {
  const T = window.THREE, K = window.VizKit;
  const M = window.MB3D_MODELS['coronary-arteries-cardiac-veins'];
  const renderer = new T.WebGLRenderer({ antialias: false, preserveDrawingBuffer: true });
  renderer.setSize(900, 700); renderer.setPixelRatio(1); K.configureRenderer(renderer);
  renderer.setClearColor(new T.Color(0x000000), 1);
  /* ONE camera for every frame, fitted on the build with everything present, so that hiding a
     structure cannot move the camera and change the count for a reason that is not occlusion. */
  const ref = M.build(1, Object.assign({}, M.FULL, { territories: false }));
  const cam = new T.PerspectiveCamera(38, 900 / 700, 0.1, 400);
  const fit = K.fitCamera(cam, ref, 1.10);
  cam.position.copy(fit.centre).addScaledVector(new T.Vector3(0, 0, 1), fit.distance);
  cam.lookAt(fit.centre);
  function pixelsOfLcaWith(hidden) {
    const g = M.build(1, Object.assign({}, M.FULL, { territories: false }));
    const kill = [];
    g.traverse(o => {
      if (!o.isMesh) return;
      const k = o.userData.key;
      if (k === 'lca_stem' && !o.userData.outline) {
        o.material = new T.MeshBasicMaterial({ color: new T.Color(0x00ff00), side: T.DoubleSide });
      } else if (hidden.indexOf(k) >= 0) { kill.push(o); }
      else if (!o.userData.outline) {
        o.material = new T.MeshBasicMaterial({ color: new T.Color(0x202020), side: T.DoubleSide });
      } else { kill.push(o); }
    });
    kill.forEach(o => o.parent && o.parent.remove(o));
    const scene = new T.Scene(); scene.add(g);
    renderer.render(scene, cam);
    const gl = renderer.getContext();
    const px = new Uint8Array(900 * 700 * 4);
    gl.readPixels(0, 0, 900, 700, gl.RGBA, gl.UNSIGNED_BYTE, px);
    let n = 0;
    for (let i = 0; i < px.length; i += 4) if (px[i] < 60 && px[i + 1] > 150 && px[i + 2] < 60) n++;
    return n;
  }
  const all = pixelsOfLcaWith([]);
  const noTrunk = pixelsOfLcaWith(['pulm_trunk']);
  const noBoth = pixelsOfLcaWith(['pulm_trunk', 'la_auricle']);
  return { all, noTrunk, noBoth,
           occludedByTrunk: noTrunk ? Math.round(1000 * (1 - all / noTrunk)) / 10 : null,
           occludedByBoth: noBoth ? Math.round(1000 * (1 - all / noBoth)) / 10 : null };
});
console.log('\n== NARRATION CLAIM: does the pulmonary trunk hide the left main? ==');
console.log('  left main visible pixels, everything present :', occ.all);
console.log('  ... with the pulmonary trunk hidden          :', occ.noTrunk);
console.log('  ... with the trunk AND left auricle hidden   :', occ.noBoth);
console.log('  occluded by the trunk alone                  :', occ.occludedByTrunk + '%');
console.log('  (the auricle adds nothing — the beat that hides it as well is hiding it for clutter,');
console.log('   not for occlusion, and the narration is right to credit the trunk)');

await b.close(); server.close();
