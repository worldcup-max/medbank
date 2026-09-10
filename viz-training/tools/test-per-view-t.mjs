/* MedBank · viz-training · test-per-view-t
 *
 * SET_STAGE (engine__per-view-t), exercised in the REAL player against the REAL procedural adapter and
 * the REAL cardiac-looping model: MB3D.mountScene(), and the view chips a student clicks.
 *
 * The whole point of the op is that the GEOMETRY changes, so every check here reads vertex data out of
 * the live scene. A test asserting `player.stageT === 0.65` would pass on a build that rebuilt nothing —
 * which is exactly the failure this op is most likely to have.
 *
 *   1  every ref in the fixture resolves through the real adapter, with geometry
 *   2  an UNPINNED structure genuinely changes shape between t = 0, 0.65 and 1
 *   3  a PINNED structure ("…@1") does not move when the view's stage does
 *   4  a view with no SET_STAGE renders t = 1 — the same rule a bare ref follows
 *   5  a restaged mesh is IDENTICAL, positions and normals, to the same part loaded fresh at that t
 *   6  flags survive the restage: "…#ventricle+mirror" still mirrors, and still follows the stage
 *   7  the mesh still carries the ORIGINAL structure object, so parts stay clickable
 *   8  revisiting a view gives the same geometry AND the same placement (see the fit() note below)
 *   9  eight chips hammered 60ms apart settle where the last one asked
 *  10  normals — see the block above check 10, which is where the real work of this file is
 *  11  the loop is alive and drawing, and the console is clean
 *
 * WHY THE FIXTURE IS NOT THE LIVE SCENE. The cardiac-looping scene in the corpus is authored the OLD
 * way: the ventricle declared three times, once per stage, each ref pinning its own @t. Every ref in it
 * is pinned, so SET_STAGE would correctly move nothing and this file would pass green against an engine
 * that does not work. The fixture is that scene re-authored the way the op is for. Nothing is written to
 * the corpus.
 *
 * Runs in the build task's container, like render-scene-views.mjs, and wants the same chromium.
 *   node viz-training/tools/test-per-view-t.mjs
 */
import { chromium } from 'playwright';
import http from 'http'; import path from 'path'; import fs from 'fs';

const ROOT = process.cwd();
const OUT = path.join(ROOT, 'viz-training/models-out/_per-view-t');
fs.mkdirSync(OUT, { recursive: true });
const MIME = { '.js': 'text/javascript', '.json': 'application/json', '.html': 'text/html' };

/* The page is SERVED, not set with page.setContent(). setContent injects the script tags through
   document.write, and chromium then logs a parser-blocking-script warning for every one of them —
   six lines of noise that a "the console is clean" check would have to filter, and a filter is how a
   real warning gets thrown away. Serve it and the console is clean because nothing wrote to it. */
let HTML = '';
const server = http.createServer((rq, rs) => {
  const u = rq.url.split('?')[0];
  if (u === '/page.html') { rs.writeHead(200, { 'content-type': 'text/html' }); return rs.end(HTML); }
  const p = path.join(ROOT, decodeURIComponent(u));
  fs.readFile(p, (e, b) => {
    if (e) { rs.writeHead(404); return rs.end('no'); }
    rs.writeHead(200, { 'content-type': MIME[path.extname(p)] || 'application/octet-stream' });
    rs.end(b);
  });
});
await new Promise(r => server.listen(0, r));
const BASE = `http://127.0.0.1:${server.address().port}/`;

/* The fixture's structure records carry the same fields the corpus scene's do — name, role, colour,
   terms. The first version left them off and the scene rendered as an untinted grey tube with an empty
   parts list, which is a perfectly good test of the geometry and a useless test of what a student sees.
   A fixture that does not look like the thing cannot answer "does it look like the thing". */
const COLOURS = { sinus: '#3f6ea8', atrium: '#2f8fd0', ventricle: '#d94f5c', bulbus: '#e07a3f',
                  truncus: '#d9b03c', ventricle_pinned: '#8b6fd0', ventricle_mirror: '#5fbfa8' };
const S = (key, part, label) => ({
  key, name: label, label, role: 'part', group: 'Heart tube',
  color: COLOURS[key], refs: { procedural: part }, terms: [label.toLowerCase()]
});
const fx = {
  schema: 'model3d.v2', id: 'FIXTURE__per-view-t', mode: '3d_anatomy',
  course: 'embryology', topic: 'cardiovascular-development', structure: 'cardiac-looping',
  status: 'candidate', provider: { primary: 'procedural', fallbacks: [] },
  structures: [
    S('sinus',     'cardiac-looping#sinus',     'Sinus venosus'),
    S('atrium',    'cardiac-looping#atrium',    'Primitive atrium'),
    S('ventricle', 'cardiac-looping#ventricle', 'Primitive ventricle'),
    S('bulbus',    'cardiac-looping#bulbus',    'Bulbus cordis'),
    S('truncus',   'cardiac-looping#truncus',   'Truncus arteriosus'),
    S('ventricle_pinned', 'cardiac-looping#ventricle@1',    'Ventricle, pinned to the finished loop'),
    S('ventricle_mirror', 'cardiac-looping#ventricle+mirror', 'Ventricle, L-loop')
  ],
  views: [
    { title: 'Day 21 — straight tube', mode: 'process', narration: 'The tube is straight.',
      ops: [{ op: 'SET_STAGE', t: 0 }, { op: 'SHOW_STRUCTURE', target: '*' }] },
    { title: 'Mid-loop — the C', mode: 'process', narration: 'The bulbus swings right.',
      ops: [{ op: 'SET_STAGE', t: 0.65 }, { op: 'SHOW_STRUCTURE', target: '*' }] },
    { title: 'Loop complete', mode: 'process', narration: 'The loop is finished.',
      ops: [{ op: 'SET_STAGE', t: 1 }, { op: 'SHOW_STRUCTURE', target: '*' }] },
    { title: 'No SET_STAGE — must be t = 1', mode: 'process', narration: 'Nothing said, so the finished form.',
      ops: [{ op: 'SHOW_STRUCTURE', target: '*' }] },
    { title: 'Back to day 21', mode: 'process', narration: 'And back.',
      ops: [{ op: 'SET_STAGE', t: 0 }, { op: 'SHOW_STRUCTURE', target: '*' }] }
  ],
  gaps: []
};
const stageOf = i => { const o = (fx.views[i].ops || []).find(o => o.op === 'SET_STAGE'); return o ? o.t : 'none'; };

HTML = `<!doctype html><meta charset=utf8><title>per-view-t</title><link rel="icon" href="data:,">
<body style="margin:0;background:#0e1626"><div id="host" style="position:absolute;inset:0"></div>
<script src="${BASE}node_modules/three/build/three.js"></script>
<script src="${BASE}node_modules/three/examples/js/controls/TrackballControls.js"></script>
<script src="${BASE}node_modules/three/examples/js/controls/OrbitControls.js"></script>
<script src="${BASE}node_modules/three/examples/js/loaders/STLLoader.js"></script>
<script src="${BASE}models3d/render-kit.js"></script>
<script src="${BASE}models3d/cardiac-looping.js"></script>
<script src="${BASE}viz3d.js"></script>
<script>
window.MEDBANK_CONFIG = { MODEL_BASE: '${BASE}models3d/', FEATURES: { MODEL3D: true } };
window.mountIt = function (sc) { return MB3D.mountScene(document.getElementById('host'), sc, {}).then(function () { return true; }); };

/* What is on screen for one key. Positions AND normals are summed, so "identical" here means the
   restage produced the same surface AND the same shading, not merely the same silhouette. Local
   space only: a world-space figure moves whenever fit() renormalises the scene, which is legitimate
   and would make every check below noise. */
window.fp = function (key) {
  var p = MB3D.player(), m = p && p.meshes[key];
  if (!m || !m.geometry) return null;
  var P = m.geometry.getAttribute('position'), N = m.geometry.getAttribute('normal');
  if (!P) return null;
  var i, sx = 0, sy = 0, sz = 0, nx = 0, ny = 0, nz = 0;
  for (i = 0; i < P.count; i++) { sx += P.getX(i); sy += P.getY(i); sz += P.getZ(i); }
  if (N) for (i = 0; i < N.count; i++) { nx += N.getX(i); ny += N.getY(i); nz += N.getZ(i); }
  m.geometry.computeBoundingBox();
  var b = m.geometry.boundingBox, r = function (n) { return Math.round(n * 1e4) / 1e4; };
  return { n: P.count, pos: [r(sx), r(sy), r(sz)], nrm: [r(nx), r(ny), r(nz)],
           box: [r(b.min.x), r(b.min.y), r(b.min.z), r(b.max.x), r(b.max.y), r(b.max.z)],
           cx: r((b.min.x + b.max.x) / 2) };      // model-space centre x — which side of the midline
};
window.fpAll = function () { var o = {}, p = MB3D.player(); Object.keys(p.meshes).forEach(function (k) { o[k] = window.fp(k); }); return o; };
/* Where the model was put and how big it was made — fit()'s output. Two visits to one view must agree. */
window.placement = function () {
  var p = MB3D.player(), m = p.meshes.ventricle, r = function (n) { return Math.round(n * 1e4) / 1e4; };
  return { scale: r(p.holder.scale.x), pos: m ? m.position.toArray().map(r) : null };
};
window.identity = function () {
  var p = MB3D.player(), bad = [];
  Object.keys(p.meshes).forEach(function (k) {
    var u = p.meshes[k] && p.meshes[k].userData;
    if (!u || u.render === 'anchor') return;
    if (p.scene.structures.indexOf(u) < 0) bad.push(k);
  });
  return bad;
};

/* ---- normals, on the model's own group, where the information needed to read them still exists ----
   The adapter merges every mesh carrying a key into one buffer and builds a fresh BufferGeometry, which
   does not carry geometry.userData.hullCount. That matters, because a chamber here is a HOLLOW WALL: an
   outer surface and an inner lumen surface whose normals point inward on purpose, in roughly equal
   numbers. A centroid probe over the whole part therefore reads about 50% outward BY CONSTRUCTION, and
   would read about 50% on a correctly wound model and on an inverted one alike. So this probes the two
   things that can actually be wrong:
     hullOut — outwardness over the outer surface ONLY, the first hullCount vertices, which is the half
               VizKit.outlineOf inflates into the silhouette. This is the number RENDER-STANDARD's
               "strongly majority-outward" is about.
     wind    — does the face normal implied by the vertex ORDER agree with the supplied vertex normals?
               That is the invariant emitter().quad() exists to keep, it is what the inverted-hull
               silhouette depends on, and unlike any centroid test it is independent of the shape. */
window.probeNormals = function (t) {
  var g = window.MB3D_MODELS['cardiac-looping'].build(t, { endocardium: true, pericardium: true, mesocardium: true, midline: true });
  var res = {};
  g.traverse(function (o) {
    if (!o.isMesh || !o.geometry) return;
    var u = o.userData || {}; if (u.outline || !u.key) return;
    var P = o.geometry.getAttribute('position'), N = o.geometry.getAttribute('normal'); if (!P || !N) return;
    var r = res[u.key] = res[u.key] || { tris: 0, agree: 0, degen: 0, hull: 0, hout: 0, verts: 0 };
    var i;
    for (i = 0; i < P.count; i += 3) {
      var ax = P.getX(i), ay = P.getY(i), az = P.getZ(i);
      var ux = P.getX(i + 1) - ax, uy = P.getY(i + 1) - ay, uz = P.getZ(i + 1) - az;
      var vx = P.getX(i + 2) - ax, vy = P.getY(i + 2) - ay, vz = P.getZ(i + 2) - az;
      var fx = uy * vz - uz * vy, fy = uz * vx - ux * vz, fz = ux * vy - uy * vx;
      r.tris++;
      if (Math.sqrt(fx * fx + fy * fy + fz * fz) < 1e-12) { r.degen++; continue; }
      var mx = (N.getX(i) + N.getX(i + 1) + N.getX(i + 2)) / 3;
      var my = (N.getY(i) + N.getY(i + 1) + N.getY(i + 2)) / 3;
      var mz = (N.getZ(i) + N.getZ(i + 1) + N.getZ(i + 2)) / 3;
      if (fx * mx + fy * my + fz * mz > 0) r.agree++;
    }
    var hc = (o.geometry.userData && o.geometry.userData.hullCount) || 0;
    r.verts += P.count; r.hull += hc;
    if (hc > 0) {
      var j, hx = 0, hy = 0, hz = 0;
      for (j = 0; j < hc; j++) { hx += P.getX(j); hy += P.getY(j); hz += P.getZ(j); }
      hx /= hc; hy /= hc; hz /= hc;
      for (j = 0; j < hc; j++) {
        var dx = P.getX(j) - hx, dy = P.getY(j) - hy, dz = P.getZ(j) - hz;
        if (dx * N.getX(j) + dy * N.getY(j) + dz * N.getZ(j) > 0) r.hout++;
      }
    }
  });
  Object.keys(res).forEach(function (k) {
    var r = res[k];
    r.wind = +(r.agree / Math.max(1, r.tris - r.degen)).toFixed(4);
    r.hullOut = r.hull ? +(r.hout / r.hull).toFixed(4) : null;
  });
  return res;
};
window.chip = function (i) { document.querySelectorAll('.mb3d-chip')[i].click(); };
window.health = function () { var p = MB3D.player(); return { alive: p.alive(), frames: p.frames(), err: String(p.lastError() || '') }; };
</script>`;

const browser = await chromium.launch({ args: ['--use-gl=swiftshader', '--enable-unsafe-swiftshader', '--disable-gpu-sandbox'] });
const page = await browser.newPage({ viewport: { width: 1000, height: 720 } });
const noise = [];
page.on('console', m => { if (m.type() === 'error' || m.type() === 'warning') noise.push(m.type() + ': ' + m.text()); });
page.on('pageerror', e => noise.push('pageerror: ' + e.message));
await page.goto(BASE + 'page.html', { waitUntil: 'networkidle' });
await page.evaluate(sc => window.mountIt(sc), fx);
await page.waitForTimeout(1200);

const fails = [], notes = [];
const ok = (c, m) => { (c ? notes : fails).push((c ? 'PASS  ' : 'FAIL  ') + m); };
const same = (a, b) => JSON.stringify(a) === JSON.stringify(b);
const settle = () => page.waitForTimeout(900);

/* 1 */
const first = await page.evaluate(() => window.fpAll());
for (const s of fx.structures) ok(first[s.key] && first[s.key].n > 0,
  `[1] ${s.key} resolved through the real adapter with ${first[s.key] ? first[s.key].n : 0} vertices`);

/* walk the stages */
const seen = {}, place = {};
for (let i = 0; i < fx.views.length; i++) {
  await page.evaluate(k => window.chip(k), i); await settle();
  seen[i] = await page.evaluate(() => window.fpAll());
  place[i] = await page.evaluate(() => window.placement());
  await page.screenshot({ path: path.join(OUT, `view-${i}-t${stageOf(i)}.png`) });
}
const CHAMBERS = ['sinus', 'atrium', 'ventricle', 'bulbus', 'truncus'];

/* 2 */
for (const k of CHAMBERS) {
  ok(!same(seen[0][k], seen[1][k]), `[2] ${k} differs between t=0 and t=0.65`);
  ok(!same(seen[1][k], seen[2][k]), `[2] ${k} differs between t=0.65 and t=1`);
}
/* 3 */
ok(same(seen[0].ventricle_pinned, seen[1].ventricle_pinned) && same(seen[0].ventricle_pinned, seen[2].ventricle_pinned),
  '[3] a pinned ref ("…@1") is unchanged at t=0, 0.65 and 1');
ok(!same(seen[0].ventricle, seen[0].ventricle_pinned),
  '[3] and it is pinned to something real — at t=0 it differs from the ventricle that follows the view');
/* 4 */
for (const k of CHAMBERS) ok(same(seen[2][k], seen[3][k]), `[4] ${k}: a view with no SET_STAGE renders t=1`);
/* 5 — restaged geometry is bit-identical to a fresh pinned load of the same t, normals included */
ok(same(seen[2].ventricle, seen[2].ventricle_pinned),
  '[5] the ventricle restaged to t=1 is identical, positions and normals, to the ventricle loaded fresh at @1');
/* 6 */
for (const i of [1, 2]) {
  const a = seen[i].ventricle, b = seen[i].ventricle_mirror;
  ok(a && b && a.cx !== 0 && Math.sign(a.cx) === -Math.sign(b.cx),
    `[6] at t=${stageOf(i)} the +mirror ventricle is on the opposite side of the midline (x ${a && a.cx} vs ${b && b.cx})`);
}
/* At t=0 the tube is straight and on the midline, so an L-loop and a D-loop ARE the same picture —
   that is the anatomy, not a bug, and asserting a side here would be asserting a falsehood. */
ok(Math.abs(seen[0].ventricle.cx - seen[0].ventricle_mirror.cx) < Math.abs(seen[2].ventricle.cx - seen[2].ventricle_mirror.cx) / 4,
  '[6] at t=0 the mirror and the original are near-coincident — a straight tube has no handedness yet');
ok(!same(seen[0].ventricle_mirror, seen[2].ventricle_mirror),
  '[6] the flagged ref still FOLLOWS the stage rather than being frozen by its flag');
/* 7 */
const bad = await page.evaluate(() => window.identity());
ok(bad.length === 0, `[7] every mesh still carries its own structure object (${bad.length} broken)`);
/* 8 — same geometry AND same placement on the second visit.
   The placement half is not padding: fit() measured a WORLD box and subtracted its centre from LOCAL
   positions, so once the holder had any yaw on it, revisiting a view put the model somewhere else.
   Same height, different place — see the note in fit(). */
for (const k of CHAMBERS) ok(same(seen[0][k], seen[4][k]), `[8] ${k} at t=0 is identical on the second visit`);
ok(same(place[0], place[4]), `[8] and it is in the same place, at the same size (${JSON.stringify(place[0])} vs ${JSON.stringify(place[4])})`);
/* 9 */
for (const i of [0, 2, 1, 3, 0, 2, 1, 0]) { await page.evaluate(k => window.chip(k), i); await page.waitForTimeout(60); }
await page.waitForTimeout(2500);
const settled = await page.evaluate(() => window.fpAll());
for (const k of ['sinus', 'ventricle', 'truncus']) ok(same(settled[k], seen[0][k]), `[9] after eight chips 60ms apart, ${k} is what view 0 asks for`);
await page.screenshot({ path: path.join(OUT, 'after-chip-mash.png') });
/* 10 — normals */
const report = {};
for (const t of [0, 0.65, 1]) {
  const r = await page.evaluate(tt => window.probeNormals(tt), t);
  report['t=' + t] = r;
  for (const k of CHAMBERS) {
    ok(r[k].hullOut > 0.95, `[10] t=${t} ${k}: ${(r[k].hullOut * 100).toFixed(1)}% of OUTER-surface normals point outward (hull ${r[k].hull} of ${r[k].verts} verts)`);
    ok(r[k].wind > 0.98, `[10] t=${t} ${k}: ${(r[k].wind * 100).toFixed(1)}% of faces wind in agreement with their vertex normals`);
  }
}
/* 11 */
const h = await page.evaluate(() => window.health());
ok(h.alive && h.frames > 30, `[11] the loop is alive and has drawn ${h.frames} frames`);
ok(!h.err, `[11] no loop error (${h.err || 'none'})`);
const real = noise.filter(n => !/GPU stall due to ReadPixels/.test(n));
ok(real.length === 0, `[11] console is clean${real.length ? ' — ' + real.join(' | ') : ''}`);

fs.writeFileSync(path.join(OUT, 'normals.json'), JSON.stringify(report, null, 1));
await browser.close(); server.close();
notes.forEach(n => console.log(n));
if (fails.length) { console.log(''); fails.forEach(f => console.log(f)); }
console.log(`\n${notes.length} passed, ${fails.length} failed · screenshots + normals.json in viz-training/models-out/_per-view-t/`);
process.exit(fails.length ? 1 : 0);
