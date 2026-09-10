/* MedBank · headless proof for engine__mesh-resolution-by-role  (viz-training/tools/prove-mesh-tiers.mjs)
 *
 * WHAT IT PROVES, against the REAL adapter in viz3d.js and REAL BodyParts3D STLs at two real
 * resolutions (viz-training/meshes = source, viz-training/meshes-lite = decimated):
 *   1  baseline — with no MESH_TIERS in config.js every URL is byte-identical to the pre-change formula
 *   2  tier selection — role part/primary -> full, role context -> lite, mesh_tier overrides both
 *   3  it loads — all 48 refs of the vertebral column scene through adapter.load, and the triangle
 *      count that ARRIVES matches that tier's file on disk (this is the check that cannot be faked)
 *   4  an INCOMPLETE full tier falls back to lite instead of greying out the taught structure
 *   4b the tier tag does not pollute the scene structure object
 *   6  normals — signed volume per mesh, calibrated against a sphere and a torus
 *   7  it renders at both tier configs, with a clean console
 *
 * RUN IT:  node viz-training/tools/prove-mesh-tiers.mjs      (from the repo root)
 *
 * NEEDS playwright and three in node_modules. The 2026-09-10 build run could NOT run it on Frank's
 * machine — that repo has three but no playwright, and the device has no chromium — so it ran in the
 * cloud container against staged copies of viz3d.js, config.js, the scene and 96 STLs. Set MB_ROOT to
 * point at a staged copy if you have to do the same. That is a real limitation of that run and it is
 * recorded here rather than in a comment nobody reads: this harness has never executed on the device
 * the app is developed on.
 */
import { chromium } from 'playwright';
import { readFileSync, writeFileSync, mkdirSync, existsSync, readdirSync } from 'fs';
import http from 'http';
import path from 'path';
import fs from 'fs';

/* MB_ROOT lets this run against a staged copy; by default it is the repo it lives in. */
const UP = process.env.MB_ROOT || process.cwd();
const HARNESS = process.env.MB_HARNESS || (process.env.MB_ROOT ? process.cwd() : '.');
const OUT = 'viz-training/models-out/mesh-resolution-by-role';
mkdirSync(OUT, { recursive: true });

const SCENE = JSON.parse(readFileSync(UP + '/viz-training/scenes/gross__back-vertebral-column__vertebral-column.json', 'utf8'));
const REFS = SCENE.structures.filter(s => s.refs && s.refs.bodyparts3d);

/* triangle counts straight off the binary STL header — ground truth the browser must match */
const tris = (dir, id) => { const b = readFileSync(`${UP}/viz-training/${dir}/${id}.stl`); return b.readUInt32LE(80); };
const TRUTH = {};
for (const s of REFS) {
  const id = s.refs.bodyparts3d;
  TRUTH[id] = { lite: tris('meshes-lite', id), full: tris('meshes', id) };
}
/* the one id the "partial" tier deliberately does not have, to prove the fallback.
   A role=part structure, so the failure would otherwise hit a TAUGHT structure. */
const MISSING_FROM_PARTIAL = REFS.find(s => s.role === 'part').refs.bodyparts3d;

const MIME = { '.js': 'text/javascript', '.json': 'application/json', '.html': 'text/html', '.stl': 'model/stl' };
const server = http.createServer((req, res) => {
  const u = decodeURIComponent(req.url.split('?')[0]);
  let p = null;
  const m = u.match(/^\/tiers\/(lite|full|partial)\/(.+\.stl)$/);
  if (m) {
    const id = m[2].replace('.stl', '');
    if (m[1] === 'partial' && id === MISSING_FROM_PARTIAL) { res.writeHead(404); return res.end('not uploaded yet'); }
    p = `${UP}/viz-training/${m[1] === 'lite' ? 'meshes-lite' : 'meshes'}/${m[2]}`;
  } else if (u.startsWith('/node_modules/') || u === '/page.html') {
    p = HARNESS + u;
  } else {
    p = UP + u;
  }
  fs.readFile(p, (e, buf) => {
    if (e) { res.writeHead(404); return res.end('no'); }
    res.writeHead(200, { 'content-type': MIME[path.extname(p)] || 'application/octet-stream' });
    res.end(buf);
  });
});
await new Promise(r => server.listen(0, r));
const PORT = server.address().port;
const BASE = `http://127.0.0.1:${PORT}/`;

const W = 900, H = 1100;
const page_html = `<!doctype html><meta charset="utf-8">
<style>html,body{margin:0;background:#0e1116}canvas{display:block}</style>
<canvas id="c" width="${W}" height="${H}"></canvas>
<script src="${BASE}node_modules/three/build/three.js"><\/script>
<script src="${BASE}node_modules/three/examples/js/loaders/STLLoader.js"><\/script>
<script src="${BASE}node_modules/three/examples/js/controls/OrbitControls.js"><\/script>
<script src="${BASE}config.js"><\/script>
<script src="${BASE}viz3d.js"><\/script>
<script>
window.__ready = !!(window.MB3D && window.MB3D.adapters && window.MB3D.adapters.bodyparts3d);

/* ---- render one set of meshes so a human can look at it (proof 1 and 7) ---- */
window.__render = function (meshes) {
  const cv = document.getElementById('c');
  const renderer = new THREE.WebGLRenderer({ canvas: cv, antialias: true });
  renderer.setPixelRatio(1);
  renderer.setSize(${W}, ${H}, false);
  renderer.setClearColor(new THREE.Color('#0e1116'));   // raw, NOT output-encoded (RENDER-STANDARD 2.2)
  const scene = new THREE.Scene();
  const holder = new THREE.Group();
  meshes.forEach(m => holder.add(m));
  scene.add(holder);
  scene.add(new THREE.HemisphereLight(0xffffff, 0x444455, 0.85));
  const d1 = new THREE.DirectionalLight(0xffffff, 0.75); d1.position.set(1, 1.2, 1.4); scene.add(d1);
  const d2 = new THREE.DirectionalLight(0xffffff, 0.35); d2.position.set(-1.2, -0.4, -1); scene.add(d2);
  const cam = new THREE.PerspectiveCamera(32, ${W}/${H}, 0.1, 20000);
  /* THE SUBJECT FILLS THE FRAME — fit to the actual bounding box, never a parked distance */
  const box = new THREE.Box3().setFromObject(holder);
  const c = box.getCenter(new THREE.Vector3()), sz = box.getSize(new THREE.Vector3());
  const radius = Math.max(sz.x, sz.y, sz.z) * 0.5;
  /* 1.18, not 0.62 — at 0.62 a single vertebra overflowed the frame and was cropped, which fails the
     RENDER-STANDARD rule in the other direction: the subject must FILL the frame, not burst it. */
  const dist = radius / Math.sin(THREE.MathUtils.degToRad(32) / 2) * 1.18;
  cam.position.set(c.x + dist * 0.55, c.y + dist * 0.10, c.z + dist * 0.82);
  cam.lookAt(c);
  renderer.render(scene, cam);
  return { box: box.min.toArray().concat(box.max.toArray()) };
};

/* ---- proof 6: normals outward ----
   TWO probes, because the centroid probe alone cannot tell a winding bug from a concave shape.
   A vertebra is a RING with processes: its centroid sits inside the vertebral foramen, so the inner
   wall of the canal, the concave facets and the gap between the laminae all legitimately face TOWARD
   the centroid. RENDER-STANDARD says to understand which you have before accepting a low number, so:
     · pctOut  — the cheap centroid probe, kept because it is what caught the original winding bug
     · signedVolume — sum of a·(b×c)/6 over triangles. For a closed surface this is POSITIVE when the
       winding faces outward and NEGATIVE when it is inverted, and it does not care how concave the
       shape is. This is the probe that actually answers the question for a vertebra.
   __calibrate() runs both on a sphere (closed convex) and a torus (closed, concave, hole through the
   middle) so the numbers below can be read against known-good shapes rather than against a guess. */
window.__calibrate = function () {
  const out = {};
  for (const [name, g] of [['sphere', new THREE.SphereGeometry(1, 32, 24)], ['torus', new THREE.TorusGeometry(1, 0.45, 24, 32)]]) {
    const geo = g.toNonIndexed(); geo.computeVertexNormals();
    out[name] = window.__normalProbe(new THREE.Mesh(geo, new THREE.MeshBasicMaterial()));
  }
  return out;
};
window.__normalProbe = function (mesh) {
  const g = mesh.geometry;
  const pos = g.getAttribute('position'), nrm = g.getAttribute('normal');
  if (!pos || !nrm) return null;
  const c = new THREE.Vector3();
  for (let i = 0; i < pos.count; i++) c.add(new THREE.Vector3().fromBufferAttribute(pos, i));
  c.divideScalar(pos.count);
  let out = 0, inn = 0, degenerate = 0;
  const v = new THREE.Vector3(), n = new THREE.Vector3();
  for (let i = 0; i < pos.count; i++) {
    v.fromBufferAttribute(pos, i).sub(c);
    n.fromBufferAttribute(nrm, i);
    if (n.lengthSq() < 1e-12 || v.lengthSq() < 1e-12) { degenerate++; continue; }
    (v.dot(n) > 0 ? out++ : inn++);
  }
  /* signed volume of the triangle soup — positive iff the winding faces outward */
  let vol = 0, agree = 0, disagree = 0;
  const a = new THREE.Vector3(), b = new THREE.Vector3(), d = new THREE.Vector3();
  const e1 = new THREE.Vector3(), e2 = new THREE.Vector3(), fn = new THREE.Vector3(), vn = new THREE.Vector3();
  for (let i = 0; i + 2 < pos.count; i += 3) {
    a.fromBufferAttribute(pos, i); b.fromBufferAttribute(pos, i + 1); d.fromBufferAttribute(pos, i + 2);
    vol += a.dot(new THREE.Vector3().crossVectors(b, d)) / 6;
    e1.subVectors(b, a); e2.subVectors(d, a); fn.crossVectors(e1, e2);
    vn.set(0, 0, 0);
    for (let k = 0; k < 3; k++) vn.add(new THREE.Vector3().fromBufferAttribute(nrm, i + k));
    if (fn.lengthSq() > 1e-20 && vn.lengthSq() > 1e-20) (fn.dot(vn) > 0 ? agree++ : disagree++);
  }
  return { verts: pos.count, out, inn, degenerate, pctOut: +(100 * out / Math.max(1, out + inn)).toFixed(1),
           signedVolume: vol, windingOutward: vol > 0,
           faceAgree: agree, faceDisagree: disagree };
};

window.__loadAll = function (structures, tiers) {
  window.MEDBANK_CONFIG.MESH_TIERS = tiers || undefined;
  if (!tiers) delete window.MEDBANK_CONFIG.MESH_TIERS;
  const ad = window.MB3D.adapters.bodyparts3d;
  return Promise.all(structures.map(s =>
    Promise.resolve(ad.load(window.THREE, s)).then(r => ({
      key: s.key, role: s.role, id: s.refs.bodyparts3d,
      reason: r.reason || null,
      tier: r.mesh ? r.mesh.__meshTier : null,
      triangles: r.mesh && r.mesh.geometry ? r.mesh.geometry.getAttribute('position').count / 3 : 0,
      hasGeometry: !!(r.mesh && r.mesh.geometry && r.mesh.geometry.getAttribute('position').count > 0),
      probe: r.mesh ? window.__normalProbe(r.mesh) : null,
      mesh: r.mesh || null
    }))
  ));
};
window.__resolveOnly = function (s, tiers) {
  window.MEDBANK_CONFIG.MESH_TIERS = tiers || undefined;
  if (!tiers) delete window.MEDBANK_CONFIG.MESH_TIERS;
  const ad = window.MB3D.adapters.bodyparts3d;
  return { url: ad.resolve(s), tierFor: ad.tierFor(s), tiers: ad.tiers() };
};
<\/script>`;

writeFileSync(HARNESS + '/page.html', page_html);

const browser = await chromium.launch({ args: ['--use-gl=swiftshader', '--enable-unsafe-swiftshader'] });
const page = await browser.newPage({ viewport: { width: W, height: H } });

/* Console noise is recorded with the phase that produced it, because two kinds of noise in this
   harness are the harness itself and saying "clean" without separating them would be a lie:
     · the fallback test DELIBERATELY 404s one mesh, and the adapter retries 3x — those 404s are the
       test working, and they are only accepted while that phase is running, for that exact URL
     · swiftshader (software GL, because a container has no GPU) emits GL_CLOSE_PATH_NV performance
       messages on every readPixels, i.e. on every screenshot. That is the substrate, not viz3d.js.
   Everything else must be empty. Both exclusions are printed, so what was excluded is visible. */
let phase = 'load';
const noise = [];
const rec = (kind, text) => noise.push({ phase, kind, text });
page.on('console', m => { if (['error', 'warning'].includes(m.type())) rec(m.type(), m.text()); });
page.on('pageerror', e => rec('pageerror', e.message));
page.on('requestfailed', r => rec('requestfailed', r.url() + ' ' + (r.failure() && r.failure().errorText)));
page.on('response', r => { if (r.status() >= 400) rec('http' + r.status(), r.url()); });

await page.goto(BASE + 'page.html', { waitUntil: 'load' });
await page.waitForFunction('window.__ready === true', { timeout: 30000 });

const results = { checks: [], scene: SCENE.id || 'vertebral-column' };
const ok = (name, pass, detail) => { results.checks.push({ name, pass, detail }); console.log((pass ? 'PASS  ' : 'FAIL  ') + name + (detail ? '  — ' + detail : '')); };

const CDN = 'https://tytbrhuzikqkscxdnkmr.supabase.co/storage/v1/object/public/viz-meshes/';
const TIERS = { lite: BASE + 'tiers/lite/', full: BASE + 'tiers/full/' };
const PARTIAL = { lite: BASE + 'tiers/lite/', full: BASE + 'tiers/partial/' };

phase = 'baseline';
/* ---------- 1  baseline: no MESH_TIERS is byte-identical to the old formula ---------- */
{
  const part = REFS.find(s => s.role === 'part'), ctx = REFS.find(s => s.role === 'context');
  const a = await page.evaluate(([s]) => window.__resolveOnly(s, null), [part]);
  const b = await page.evaluate(([s]) => window.__resolveOnly(s, null), [ctx]);
  const wantA = CDN + part.refs.bodyparts3d + '.stl', wantB = CDN + ctx.refs.bodyparts3d + '.stl';
  ok('baseline: role=part URL unchanged with no MESH_TIERS', a.url === wantA, a.url);
  ok('baseline: role=context URL unchanged with no MESH_TIERS', b.url === wantB, b.url);
  ok('baseline: both tiers collapse to MESH_BASE', a.tiers.lite === CDN && a.tiers.full === CDN, JSON.stringify(a.tiers));
}

phase = 'tier-selection';
/* ---------- 2  tier selection by role ---------- */
{
  const part = REFS.find(s => s.role === 'part'), ctx = REFS.find(s => s.role === 'context');
  const a = await page.evaluate(([s, t]) => window.__resolveOnly(s, t), [part, TIERS]);
  const b = await page.evaluate(([s, t]) => window.__resolveOnly(s, t), [ctx, TIERS]);
  ok('role=part -> full tier', a.tierFor === 'full' && a.url.includes('/tiers/full/'), a.url);
  ok('role=context -> lite tier', b.tierFor === 'lite' && b.url.includes('/tiers/lite/'), b.url);
  const prim = await page.evaluate(([s, t]) => window.__resolveOnly(s, t), [{ key: 'x', role: 'primary', refs: { bodyparts3d: 'FMA13073' } }, TIERS]);
  ok("role=primary -> full tier (taught, not scaffolding)", prim.tierFor === 'full', prim.url);
  const pin = await page.evaluate(([s, t]) => window.__resolveOnly(s, t), [{ key: 'x', role: 'context', mesh_tier: 'full', refs: { bodyparts3d: 'FMA13073' } }, TIERS]);
  ok('mesh_tier on the structure overrides role', pin.tierFor === 'full' && pin.url.includes('/tiers/full/'), pin.url);
}

phase = 'load-all';
/* ---------- 3  every ref loads, at the tier its role asks for, with the right triangle count ---------- */
const loaded = await page.evaluate(([ss, t]) => window.__loadAll(ss, t).then(rs => rs.map(r => { const { mesh, ...rest } = r; return rest; })), [REFS, TIERS]);
{
  const bad = loaded.filter(r => !r.hasGeometry);
  ok(`all ${REFS.length} refs resolve through the real adapter with geometry`, bad.length === 0, bad.length ? bad.map(b => b.key + ':' + b.reason).join(',') : `${loaded.length}/${REFS.length}`);
  const wrong = loaded.filter(r => {
    const want = TRUTH[r.id][r.role === 'part' || r.role === 'primary' ? 'full' : 'lite'];
    return r.triangles !== want;
  });
  ok('every mesh arrived at the resolution its role asks for', wrong.length === 0,
    wrong.length ? wrong.slice(0, 4).map(w => `${w.key} got ${w.triangles} want ${TRUTH[w.id][w.role === 'part' ? 'full' : 'lite']}`).join('; ')
                 : loaded.filter(r => r.role === 'part').length + ' part at full, ' + loaded.filter(r => r.role === 'context').length + ' context at lite');
  const l2 = loaded.find(r => r.id === 'FMA13073');
  ok('L2 (FMA13073) — the mesh Frank called incomplete — arrives at 6946 triangles, not 3000',
    l2 && l2.triangles === 6946, l2 ? `${l2.key} role=${l2.role} tris=${l2.triangles} tier=${l2.tier}` : 'not in scene');
}

phase = 'normals';
/* ---------- 6  normals outward ---------- */
{
  const cal = await page.evaluate(() => window.__calibrate());
  results.calibration = cal;
  console.log(`      calibration — sphere (closed convex): ${cal.sphere.pctOut}% outward, signedVolume ${cal.sphere.signedVolume.toFixed(2)}`);
  console.log(`      calibration — torus  (closed, holed): ${cal.torus.pctOut}% outward, signedVolume ${cal.torus.signedVolume.toFixed(2)}`);
  ok('probe calibration: a known-good closed convex solid reads ~100% outward', cal.sphere.pctOut > 99, cal.sphere.pctOut + '%');
  ok('probe calibration: a known-good HOLED solid reads far lower, so a low pctOut is not by itself a bug',
    cal.torus.pctOut < 90 && cal.torus.signedVolume > 0, `torus ${cal.torus.pctOut}% outward but signedVolume ${cal.torus.signedVolume.toFixed(2)} > 0`);

  const probes = loaded.filter(r => r.probe).map(r => ({ key: r.key, ...r.probe }));
  const inverted = probes.filter(p => !p.windingOutward);
  const disagreeing = probes.filter(p => p.faceDisagree > 0);
  const degen = probes.filter(p => p.degenerate > 0);
  const minPct = Math.min(...probes.map(p => p.pctOut));
  const maxPct = Math.max(...probes.map(p => p.pctOut));

  ok('winding faces outward on every mesh (signed volume > 0)', inverted.length === 0,
    inverted.length ? inverted.slice(0, 5).map(p => p.key + ' vol=' + p.signedVolume.toFixed(1)).join(', ')
                    : `all ${probes.length} meshes positive`);
  ok('face normal agrees with vertex normals on every triangle (the winding bug of RENDER-STANDARD 2.1)',
    disagreeing.length === 0, disagreeing.length ? disagreeing.slice(0, 5).map(p => p.key + ':' + p.faceDisagree).join(',') : 'no disagreement');
  ok('no degenerate/zero normals', degen.length === 0, degen.length ? degen.slice(0, 5).map(d => d.key + ':' + d.degenerate).join(',') : 'none');
  console.log(`      centroid probe spread across ${probes.length} meshes: ${minPct}%–${maxPct}% outward`);
  console.log(`      lowest: ${probes.slice().sort((a,b)=>a.pctOut-b.pctOut).slice(0,5).map(p=>p.key+' '+p.pctOut+'%').join(', ')}`);
  results.normals = { minPct, maxPct, count: probes.length, invertedCount: inverted.length };
}

phase = 'fallback-404-EXPECTED';
/* ---------- 4b  the scene structure object must not be polluted by the tier tag ---------- */
{
  const polluted = await page.evaluate(([ss]) => ss.filter(s => '__meshTier' in s).map(s => s.key), [REFS]);
  ok('the tier tag lives on the mesh, not on the scene structure (userData is the structure by reference)',
    polluted.length === 0, polluted.length ? 'polluted: ' + polluted.slice(0,5).join(',') : 'no structure carries __meshTier');
}

/* ---------- 4  an incomplete full tier falls back to lite ---------- */
{
  const victim = REFS.find(s => s.refs.bodyparts3d === MISSING_FROM_PARTIAL);
  const r = await page.evaluate(([ss, t]) => window.__loadAll(ss, t).then(rs => rs.map(x => { const { mesh, ...rest } = x; return rest; })), [[victim], PARTIAL]);
  const got = r[0];
  ok('a 404 in a partly-uploaded full tier falls back to lite, not reason:failed',
    got.hasGeometry && got.tier === 'lite' && got.triangles === TRUTH[victim.refs.bodyparts3d].lite,
    `${got.key} role=${got.role} reason=${got.reason} tier=${got.tier} tris=${got.triangles}`);
  results.fallback = got;
}

phase = 'render';
/* ---------- 7  it renders, at both tiers ---------- */
for (const [label, tiers] of [['lite-all', { lite: BASE + 'tiers/lite/', full: BASE + 'tiers/lite/' }], ['by-role', TIERS]]) {
  const info = await page.evaluate(([ss, t]) => window.__loadAll(ss, t).then(rs => window.__render(rs.filter(r => r.mesh).map(r => r.mesh))), [REFS, tiers]);
  await page.screenshot({ path: `${OUT}/vertebral-column__${label}.png` });
  ok(`renders at tier config "${label}"`, !!info, `bbox ${info.box.map(n => n.toFixed(0)).join(',')}`);
}
/* an isolated L2 at each resolution, so the difference is visible rather than asserted */
for (const [label, tier] of [['L2-lite-3000', 'lite'], ['L2-full-6946', 'full']]) {
  const s = REFS.find(x => x.refs.bodyparts3d === 'FMA13073');
  await page.evaluate(([one, t]) => window.__loadAll([one], t).then(rs => window.__render(rs.filter(r => r.mesh).map(r => r.mesh))),
    [{ ...s, mesh_tier: tier }, TIERS]);
  await page.screenshot({ path: `${OUT}/${label}.png` });
}
ok('isolated L2 rendered at both resolutions for visual comparison', true, 'L2-lite-3000.png / L2-full-6946.png');

/* ---------- clean console ---------- */
phase = 'verdict';
const isIntended404 = n => n.phase === 'fallback-404-EXPECTED' &&
  (n.text.includes('/tiers/partial/' + MISSING_FROM_PARTIAL + '.stl') || n.text.includes('Failed to load resource'));
const isSwiftshader = n => /GL Driver Message|GL_CLOSE_PATH_NV|SwiftShader|GPU stall/i.test(n.text);
const excluded = noise.filter(n => isIntended404(n) || isSwiftshader(n));
const appNoise = noise.filter(n => !isIntended404(n) && !isSwiftshader(n));
console.log(`      excluded ${excluded.length} harness-caused message(s):`);
console.log(`        intended 404s from the fallback test: ${excluded.filter(isIntended404).length}`);
console.log(`        swiftshader software-GL perf messages: ${excluded.filter(isSwiftshader).length}`);
ok('console clean — no application errors, warnings or throws',
  appNoise.length === 0, appNoise.length ? appNoise.slice(0, 6).map(n => `[${n.phase}] ${n.kind}: ${n.text.slice(0, 110)}`).join(' | ') : 'clean');

results.noise = { appNoise, excludedIntended404: excluded.filter(isIntended404).length, excludedSwiftshader: excluded.filter(isSwiftshader).length };
results.loaded = loaded;
results.passed = results.checks.filter(c => c.pass).length;
results.failed = results.checks.filter(c => !c.pass).length;
writeFileSync(OUT + '/proof.json', JSON.stringify(results, null, 2));

console.log('\n' + results.passed + ' passed, ' + results.failed + ' failed');
console.log('screenshots + proof.json in ' + OUT);

await browser.close();
server.close();
process.exit(results.failed ? 1 : 0);
