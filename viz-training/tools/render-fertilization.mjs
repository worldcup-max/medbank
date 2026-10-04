/* MedBank · headless proof for models3d/fertilization.js
 *
 *   node viz-training/tools/render-fertilization.mjs
 *
 * The five checks BUILD-TASK-PROMPT section 3 requires, plus three this model needs of its own:
 *
 *   1. IT RENDERS — nine t, screenshots to viz-training/models-out/fertilization/
 *   2. THE CONSOLE IS CLEAN — no error, no warning, no throw
 *   3. NORMALS POINT OUTWARD — per mesh, two ways. A centroid count, reported for the hull portion
 *      and for the whole buffer separately (a closed SHELL carries its inner surface in the same
 *      buffer and those normals point at the centroid by construction, so a whole-buffer count on
 *      the zona or the oolemma lands near 0.5 and says nothing); and the check that actually
 *      decides it, RENDER-STANDARD section 2.4b's RAY CAST — cast a grid of rays from each camera
 *      and count how many FIRST HITS face away. On closed solids the answer is zero, and that
 *      answer is the same for a shell.
 *   4. IT LOOKS LIKE THE THING — the renders are for a human to look at; this file cannot do it.
 *   5. EVERY REF RESOLVES THROUGH THE REAL ADAPTER in viz3d.js, with geometry — and at the t ITS
 *      OWN BEAT uses, which is stronger than resolving everything at one t. Section 3's wording is
 *      "for EVERY part the scene names"; a part that exists only between two stages would resolve
 *      at its beat and not at t = 1, so asking the question at one t would either miss a defect or
 *      invent one.
 *
 *   6. THE WINDING CONVENTION IS RE-MEASURED, NOT REMEMBERED. models3d/fertilization.js has exactly
 *      one ring-quad call site and its argument order was established by probe rather than by
 *      reasoning (RENDER-STANDARD section 2.4b: a convention that has to be reasoned about at the
 *      call site will be got wrong at some call site). This re-runs that probe on a unit sphere
 *      every time, so if render-kit's emitter ever changes its order this file says so instead of
 *      every surface in the model quietly turning inside out.
 *   7. THE SOLVED PARAMETERS ARE PERTURBED. RENDER-STANDARD: "change the constant the geometry uses
 *      and the reported number must move. If it does not, the test is not measuring the model."
 *      Both solves are re-run against a deliberately altered input and the results must differ.
 *   8. NO TWO SOLIDS SHARE SPACE except where the model says they must (RENDER-STANDARD 3.z).
 *
 * WHERE THIS RUNS. In a Linux container with chromium, against a copy of the repo. The files under
 * test are byte-identical to the ones in the repo; the substrate for the RENDER is not the mount.
 */
import { chromium } from 'playwright';
import { readFileSync, writeFileSync, mkdirSync } from 'fs';
import http from 'http';
import path from 'path';
import fs from 'fs';

const ROOT = process.cwd();
const OUT = 'viz-training/models-out/fertilization';
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

const SCENE = 'viz-training/scenes/embryology__gametogenesis-fertilization__fertilization.json';
const scene = JSON.parse(readFileSync(SCENE, 'utf8'));

/* THE REFS, AT THE t EACH ONE'S OWN BEAT USES. A structure shown in several beats is asked at each
   of them, because "it resolves" is a question about a picture a student looks at, not about the
   model in the abstract. */
const beatT = {};
for (const v of scene.views) {
  const st = (v.ops || []).find(o => o.op === 'SET_STAGE');
  if (st) beatT[v.beat] = st.t;
}
const byKey = {}; scene.structures.forEach(s => { byKey[s.key] = s; });
const shownIn = {};                                      // key -> [beat, ...]
for (const v of scene.views) {
  let vis = {}; Object.keys(byKey).forEach(k => { vis[k] = true; });
  for (const o of v.ops || []) {
    const keys = (o.target === '*' || o.target == null) ? Object.keys(byKey)
      : (byKey[o.target] ? [o.target]
         : Object.keys(byKey).filter(k => byKey[k].group === o.target));
    if (o.op === 'SHOW_STRUCTURE') keys.forEach(k => { vis[k] = true; });
    else if (o.op === 'HIDE_STRUCTURE') keys.forEach(k => { vis[k] = false; });
  }
  for (const k of Object.keys(vis)) if (vis[k]) (shownIn[k] = shownIn[k] || []).push(v.beat);
}
const REFS = [];
for (const s of scene.structures) {
  const ref = s.refs && s.refs.procedural; if (!ref) continue;
  const pinned = /@-?\d*\.?\d+(?=$|\+)/.test(ref);
  const beats = shownIn[s.key] || [];
  if (!beats.length) { REFS.push({ key: s.key, ref, beat: null, note: 'shown in no beat' }); continue; }
  for (const b of beats) {
    /* a pinned ref is loaded at its pin whatever the view's t — viz3d atStage() returns null for it */
    const at = pinned ? ref : ref + '@' + beatT[b];
    REFS.push({ key: s.key, ref: at, beat: b, pinned });
  }
}

const W = 1000, H = 1000;
const STAGES = [
  ['t002', 0.02, 'capacitated? not yet. the coat is still on, and it is outside the cumulus'],
  ['t008', 0.08, 'capacitation — the coat coming off, the tail hyperactivating'],
  ['t030', 0.30, 'through the corona, bound to ZP3 on the zona surface'],
  ['t040', 0.40, 'the acrosome reacting; the channel cut and deepening'],
  ['t047', 0.47, 'through the zona, apex emerging into the perivitelline space'],
  ['t052', 0.52, 'tipped over, lying flat on the oolemma — it cannot stand on end in a 2 um space'],
  ['t060', 0.60, 'the two blocks: depolarisation sweeping, granules emptying, a second sperm stopped'],
  ['t073', 0.73, 'meiosis II complete — the second polar body in the perivitelline space'],
  ['t082', 0.82, 'two pronuclei'],
  ['t100', 1.00, 'syngamy — one spindle, built on the paternal centriole'],
];

const html = `<!doctype html><meta charset=utf8>
<link rel="icon" href="data:,">
<body style="margin:0;background:#0e1626">
<canvas id=c width=${W} height=${H}></canvas>
<script src="${BASE}node_modules/three/build/three.js"><\/script>
<script src="${BASE}models3d/render-kit.js"><\/script>
<script src="${BASE}models3d/fertilization.js"><\/script>
<script>
window.MEDBANK_CONFIG = { MODEL_BASE: '${BASE}models3d/' };
const renderer = new THREE.WebGLRenderer({ canvas: document.getElementById('c'), antialias: true });
renderer.setSize(${W}, ${H}, false); renderer.setPixelRatio(1);
VizKit.configureRenderer(renderer);
const scene = new THREE.Scene();
scene.background = VizKit.bg(0x0e1626);
const L = VizKit.standardLights(scene);
const camera = new THREE.PerspectiveCamera(34, 1, 0.05, 400);
let group = null;
const MOD = window.MB3D_MODELS['fertilization'];

window.setStage = function (t, opts, yaw) {
  if (group) scene.remove(group);
  group = MOD.build(t, Object.assign({}, MOD.FULL, opts || {}));
  group.rotation.y = yaw == null ? 0 : yaw;
  group.updateMatrixWorld(true);
  scene.add(group);
  const f = VizKit.fitCamera(camera, group, 1.04);
  camera.position.set(f.centre.x, f.centre.y, f.centre.z + f.distance);
  camera.lookAt(f.centre);
  L.key.position.set(camera.position.x + 6, camera.position.y + 8, camera.position.z + 4);
  renderer.render(scene, camera);
  return { size: [f.size.x, f.size.y, f.size.z], dist: f.distance };
};

/* 6 — THE WINDING CONVENTION, RE-MEASURED. a=(iu,iv) b=(iu+1,iv) c=(iu+1,iv+1) d=(iu,iv+1), iu the
   polar index from +y and iv the azimuth with (x,z)=(cos th, sin th). The model's one ring-quad call
   site passes them in that order; this asserts that order is the outward one, on a unit sphere. */
window.windingProbe = function () {
  const T = THREE, K = VizKit, NU = 24, NV = 32;
  const P = (iu, iv) => { const ph = (iu/NU)*Math.PI, th = (iv/NV)*2*Math.PI;
    return new T.Vector3(Math.sin(ph)*Math.cos(th), Math.cos(ph), Math.sin(ph)*Math.sin(th)); };
  const run = (flip) => {
    const E = K.emitter();
    for (let iu = 0; iu < NU; iu++) for (let iv = 0; iv < NV; iv++) {
      const a = P(iu,iv), b = P(iu+1,iv), c = P(iu+1,iv+1), d = P(iu,iv+1);
      const na=a.clone(), nb=b.clone(), nc=c.clone(), nd=d.clone();
      if (flip) E.quad(a,d,c,b,na,nd,nc,nb); else E.quad(a,b,c,d,na,nb,nc,nd);
    }
    const g = E.geometry(E.count()); const p = g.attributes.position.array;
    let agree = 0, tris = 0;
    for (let i = 0; i < p.length; i += 9) {
      const A=new T.Vector3(p[i],p[i+1],p[i+2]), B=new T.Vector3(p[i+3],p[i+4],p[i+5]),
            C=new T.Vector3(p[i+6],p[i+7],p[i+8]);
      const fn=new T.Vector3().subVectors(B,A).cross(new T.Vector3().subVectors(C,A));
      if (fn.lengthSq() < 1e-18) continue;
      const cen=A.clone().add(B).add(C).multiplyScalar(1/3);
      tris++; if (fn.dot(cen) > 0) agree++;
    }
    return { agree: agree, tris: tris };
  };
  return { asWritten: run(false), reversed: run(true) };
};

/* 3a — NORMALS. THREE MEASURES, AND ONLY TWO OF THEM DECIDE ANYTHING.

   The centroid count is the one BUILD-TASK-PROMPT section 3 names, and on this model it is the wrong
   instrument for most of the parts. Saying so is the point rather than quietly ignoring it. It counts
   vertex normals pointing away from the MESH's centroid, and that question only has a meaning for a
   single convex closed solid. The cumulus is 170 separate cells in one buffer, so a cell on the far
   side of the oocyte has half its normals pointing AT the mesh centroid and the count lands near
   0.52 on geometry that is perfectly wound. The zona, the oolemma and the perivitelline space are
   closed SHELLS whose inner surface points inward by construction, so their whole-buffer count sits
   at 0.5 by definition. The prompt itself says to expect this — "a tube read at its own centreline
   will not be; understand which you have before you accept a low number" — so the number is
   reported as a diagnostic and is NOT the verdict.

   What decides it:
   · SIGNED VOLUME from the winding: sum (a . (b x c))/6 over the emitted triangles. For a closed
     surface wound outward this is the enclosed volume, positive. For a UNION of closed surfaces it
     is the sum of their volumes, positive. For a shell it is V_outer - V_inner, positive. For an
     inverted surface it is negative. One number, no domain caveats on any shape this model builds,
     and it catches the section 2.1 bug this family of checks exists for.
   · AREA-WEIGHTED winding agreement against each face's own supplied normal. Unweighted, the tail
     reported 0.9913 and the maternal chromatin 0.9893, and ALL of the disagreement is in degenerate
     near-pole slivers: 15 of 1728 triangles carrying 7.7e-4 of the tail's surface area, 6 of 560
     carrying 9.4e-4 of the chromatin's. How much SURFACE is wound wrongly is the question the rule
     is asking, and the sliver count prints beside it so the slivers stay visible. */
window.normalProbe = function (t) {
  const g = MOD.build(t, Object.assign({}, MOD.FULL));
  g.updateMatrixWorld(true);
  const rows = []; const nm = new THREE.Matrix3();
  g.traverse(function (o) {
    if (!o.isMesh || !o.geometry) return;
    if (o.userData && o.userData.outline) return;
    const geo = o.geometry.index ? o.geometry.toNonIndexed() : o.geometry;
    const p = geo.attributes.position, n = geo.attributes.normal; if (!n) return;
    const hull = (o.geometry.userData && o.geometry.userData.hullCount != null)
      ? o.geometry.userData.hullCount : p.count;
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
    /* and the winding of every face against its own supplied vertex normal — RENDER-STANDARD 2.1 */
    let agree = 0, tris = 0, area = 0, badArea = 0, slivers = 0, vol = 0;
    const A = new THREE.Vector3(), B = new THREE.Vector3(), C = new THREE.Vector3();
    const e1 = new THREE.Vector3(), e2 = new THREE.Vector3(), fn = new THREE.Vector3(),
          vn = new THREE.Vector3(), cr = new THREE.Vector3();
    for (let i = 0; i + 2 < p.count; i += 3) {
      A.fromBufferAttribute(p, i); B.fromBufferAttribute(p, i+1); C.fromBufferAttribute(p, i+2);
      fn.copy(e1.subVectors(B, A).cross(e2.subVectors(C, A)));
      const a2 = fn.length() / 2;
      vol += A.dot(cr.crossVectors(B, C)) / 6;
      if (a2 < 1e-12) { slivers++; continue; }
      vn.fromBufferAttribute(n, i);
      tris++; area += a2;
      if (fn.dot(vn) >= 0) agree++; else badArea += a2;
    }
    rows.push({ key: (o.userData && o.userData.key) || '?', verts: p.count, hull: hull,
      outward_all: +(out / p.count).toFixed(4),
      outward_hull: +(outHull / Math.max(1, hull)).toFixed(4),
      winding_agree: tris ? +(agree / tris).toFixed(4) : null,
      winding_agree_by_area: area ? +(1 - badArea / area).toFixed(6) : null,
      bad_tris: tris - agree, slivers: slivers,
      signed_volume: +vol.toFixed(5), tris: tris });
  });
  return rows;
};

/* 3b — THE CHECK THAT DECIDES IT. Cast a grid of rays from a camera and count how many FIRST hits
   face AWAY from it. On a closed solid, and on a closed shell, the answer is zero: a face pointing
   away from you as the FIRST thing you meet is the inside of something, which is what looking down
   an open pipe or at an inverted surface means. RENDER-STANDARD 2.4b. */
window.lumenProbe = function (t, dir, n, skipKeys) {
  const skip = {}; (skipKeys || []).forEach(k => { skip[k] = true; });
  const g = MOD.build(t, Object.assign({}, MOD.FULL));
  /* the ampulla is a cavity drawn as a one-sided surface with its normals pointing INTO the lumen,
     on purpose — the student looks in through the cut window. A ray from outside meets its wall
     turned away because that is what looking into a cavity is. Excluded by name, with the reason,
     rather than by a tolerance. */
  g.traverse(o => { if (o.isMesh && o.userData && skip[o.userData.key]) o.visible = false; });
  g.updateMatrixWorld(true);
  /* THE RAY GRID IS FITTED TO WHAT IS BEING TESTED, not to the whole group. Box3.setFromObject
     ignores visibility, so the first version sized the grid to the ampulla's 60-unit lumen and
     then fired at a 15-unit oocyte: 43 of 1936 rays hit anything, and a probe that misses 98% of
     its shots is not a probe. The box is now taken over the meshes that are actually in play. */
  const box = new THREE.Box3();
  g.traverse(o => { if (o.isMesh && o.visible && !(o.userData && o.userData.outline))
                      box.expandByObject(o); });
  const c = box.getCenter(new THREE.Vector3()), sz = box.getSize(new THREE.Vector3());
  const d = new THREE.Vector3().fromArray(dir).normalize();
  const eye = c.clone().addScaledVector(d, sz.length());
  let up = Math.abs(d.y) > 0.99 ? new THREE.Vector3(0,0,1) : new THREE.Vector3(0,1,0);
  const e1 = new THREE.Vector3().crossVectors(up, d).normalize();
  const e2 = new THREE.Vector3().crossVectors(d, e1).normalize();
  const rc = new THREE.Raycaster(); rc.firstHitOnly = true;
  const half = sz.length() * 0.5;
  let hits = 0, away = 0; const offenders = {};
  for (let i = 0; i < n; i++) for (let j = 0; j < n; j++) {
    const u = (i / (n - 1) - 0.5) * 2 * half, v = (j / (n - 1) - 0.5) * 2 * half;
    const o = eye.clone().addScaledVector(e1, u).addScaledVector(e2, v);
    rc.set(o, d.clone().negate());
    const list = rc.intersectObject(g, true).filter(h =>
      !(h.object.userData && (h.object.userData.outline || skip[h.object.userData.key])));
    if (!list.length) continue;
    const h = list[0];
    hits++;
    if (!h.face) continue;
    const wn = h.face.normal.clone().applyMatrix3(
      new THREE.Matrix3().getNormalMatrix(h.object.matrixWorld)).normalize();
    if (wn.dot(d) < 0) { away++;
      const k = (h.object.userData && h.object.userData.key) || '?';
      offenders[k] = (offenders[k] || 0) + 1; }
  }
  return { dir: dir, rays: n * n, hits: hits, first_hits_facing_away: away, offenders: offenders };
};

/* 7 — THE PERTURBATION. Both solved parameters are re-derived with a deliberately altered input and
   the result must MOVE. A hand-typed constant would not. */
window.perturb = function () { return MOD.perturbationProof(); };

/* 8 — NO TWO SOLIDS SHARE SPACE, except where the model says they must (RENDER-STANDARD 3.z). */
window.overlapProbe = function (t) { return MOD.overlapProof(t); };

window.acceptance = function () { return MOD.acceptance(); };
<\/script>`;
writeFileSync(`${OUT}/_harness.html`, html);

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
        return { key: r.key, ref: r.ref, beat: r.beat, reason: res && res.reason, hasMesh: !!m,
                 tris: m && m.geometry ? m.geometry.attributes.position.count / 3 : 0 };
      }, function (e) { return { key: r.key, ref: r.ref, beat: r.beat,
                                 error: String(e && e.message || e) }; });
  }));
};
<\/script>`;
writeFileSync(`${OUT}/_adapter.html`, adapterHtml);

const b = await chromium.launch({
  executablePath: '/opt/pw-browsers/chromium-1194/chrome-linux/chrome',
  args: ['--use-gl=swiftshader', '--enable-unsafe-swiftshader', '--no-sandbox'] });
const p = await b.newPage({ viewport: { width: W, height: H } });
const log = [];
p.on('console', m => log.push({ type: m.type(), text: m.text() }));
p.on('pageerror', e => log.push({ type: 'pageerror', text: String(e && e.message || e) }));

await p.goto(BASE + `${OUT}/_harness.html`);
try { await p.waitForFunction('typeof window.setStage === "function"'); }
catch (e) {
  console.error('HARNESS DID NOT INITIALISE. Page said:');
  for (const m of log) console.error('  ' + m.type + ': ' + m.text.slice(0, 500));
  throw e;
}

const report = {};
report.winding = await p.evaluate('window.windingProbe()');
report.acceptance = await p.evaluate('window.acceptance()');
report.perturbation = await p.evaluate('window.perturb()');
report.overlap = await p.evaluate('window.overlapProbe(0.60)');

/* TWO PASSES, AND THE SECOND IS THE ONE A HUMAN CAN JUDGE. fitCamera fits the whole group, and the
   ampulla is a 600 um length of tube around a 120 um cell — so with it on, every proof frame is a
   picture of a tube with a speck in it, and check 4 ("would a student recognise it?") cannot be
   answered from it at all. The first pass keeps the ampulla, because beat 1 draws it and the scale
   contrast is itself the teaching; the second turns it off so the cell fills the frame. Both are
   written out and both are the same geometry. */
report.stages = [];
for (const [name, t, label] of STAGES) {
  const f = await p.evaluate(([t, y]) => window.setStage(t, {}, y), [t, 0.0]);
  const file = `${OUT}/${name}.png`;
  await p.locator('#c').screenshot({ path: file });
  report.stages.push({ name, t, label, file, ampulla: true, ...f });
}
for (const [name, t, label] of STAGES) {
  const f = await p.evaluate(([t, y]) => window.setStage(t, { ampulla: false }, y), [t, 0.0]);
  const file = `${OUT}/cell-${name}.png`;
  await p.locator('#c').screenshot({ path: file });
  report.stages.push({ name: 'cell-' + name, t, label, file, ampulla: false, ...f });
}
/* and one close-up pass on the entry point, which is 1/15th of the cell and the subject of beat 4 */
for (const [name, t] of [['entry-t040', 0.40], ['entry-t047', 0.47], ['entry-t052', 0.52]]) {
  const f = await p.evaluate(([t]) => window.setStage(t,
    { ampulla: false, cumulus: false, corona: false, ooplasm: false }, 0.0), [t]);
  const file = `${OUT}/${name}.png`;
  await p.locator('#c').screenshot({ path: file });
  report.stages.push({ name, t, label: 'the entry point, coats off', file, ...f });
}

report.normals = {};
for (const t of [0.02, 0.47, 0.60, 1.00]) report.normals[t] = await p.evaluate(tt => window.normalProbe(tt), t);

report.lumen = [];
for (const dir of [[0,0,1], [0,0,-1], [1,0,0], [0,1,0], [0.6,0.5,0.6]])
  for (const t of [0.47, 0.60, 1.00])
    report.lumen.push({ t, ...(await p.evaluate(([d, tt]) =>
      window.lumenProbe(tt, d, 44, ['ampulla']), [dir, t])) });

/* 5 — the real adapter, on a page that loads viz3d.js for real */
const p2 = await b.newPage();
const log2 = [];
p2.on('console', m => log2.push({ type: m.type(), text: m.text() }));
p2.on('pageerror', e => log2.push({ type: 'pageerror', text: String(e && e.message || e) }));
await p2.goto(BASE + `${OUT}/_adapter.html`);
await p2.waitForFunction('typeof window.resolveAll === "function" && window.MB3D && window.MB3D.adapters');
report.refs = await p2.evaluate(r => window.resolveAll(r), REFS);

report.console = log.concat(log2);
writeFileSync(`${OUT}/report.json`, JSON.stringify(report, null, 1));

/* ------------------------------------------------------------------ verdict */
const bad = [];

const wd = report.winding;
console.log('\n6 · WINDING, re-measured on a unit sphere through K.emitter().quad()');
console.log('    as the model writes it   ' + wd.asWritten.agree + '/' + wd.asWritten.tris + ' face normals outward');
console.log('    reversed                 ' + wd.reversed.agree + '/' + wd.reversed.tris);
if (wd.asWritten.agree !== wd.asWritten.tris || wd.reversed.agree !== 0)
  bad.push('the ring-quad order the model uses is no longer the outward one');

console.log('\n1 · RENDERS');
for (const s of report.stages)
  console.log('    ' + s.name + '  t=' + s.t.toFixed(2) + '  box ' +
    s.size.map(x => x.toFixed(2)).join(' x ') + '  -> ' + s.file);

/* ONE NAMED EXCEPTION, REPORTED RATHER THAN SWALLOWED. swiftshader — the software rasteriser this
   container has instead of a GPU — emits "GL Driver Message (OpenGL, Performance, ...): GPU stall
   due to ReadPixels" every time a frame is read back for a screenshot. It is the renderer talking
   about its own throughput on a machine with no graphics card; the model and the page emit nothing.
   RENDER-STANDARD's own warning applies here and is why this is a NAMED pattern rather than a
   relaxed threshold: "a warning that is a known false alarm trains every future run to ignore the
   channel it prints on, and it did: it cost an unrelated item its console-clean check." So the
   pattern is exact, the count is printed, and anything else on the channel still fails the run. */
const DRIVER_NOISE = /GL Driver Message \(OpenGL, Performance/;
console.log('\n2 · CONSOLE');
const all = report.console.filter(m => m.type !== 'log' && m.type !== 'info' && m.type !== 'debug');
const driver = all.filter(m => DRIVER_NOISE.test(m.text));
const noise = all.filter(m => !DRIVER_NOISE.test(m.text));
if (driver.length) console.log('    ' + driver.length + ' swiftshader driver performance ' +
  'message(s), filtered by exact pattern and listed here so they are not hidden:\n      "' +
  driver[0].text.slice(0, 200) + '"');
if (!noise.length) console.log('    clean — no error, no warning, no throw from the page or the ' +
  'model, across ' + report.console.length + ' console events');
else { for (const m of noise) console.log('    ' + m.type + ': ' + m.text.slice(0, 300));
       bad.push(noise.length + ' console error/warning(s)'); }
report.driverNoise = driver.length;

/* THE DOMAIN OF THE CLOSED-SURFACE MEASURES, DECLARED BY NAME.
   · the AMPULLA is a lumen the student looks INTO: its normals point inward deliberately, so its
     signed volume is negative and every ray from outside meets a face turned away. That is the
     intent, not a fault — a one-sided open surface standing for a cavity — and section 2.4b's "on
     closed solids the answer is zero" does not speak about it. Excluded, and the reason is here
     where a reviewer can disagree with it.
   · the OPEN SURFACES the MODEL declares (caps, bands, microtubules, the channel) have no inside,
     so a signed volume is meaningless for them. The list is read off the model rather than kept
     here, so the two cannot drift apart. */
const OPEN = await p.evaluate('Object.keys(window.MB3D_MODELS.fertilization.OPEN_SURFACES)');
const closedDomain = k => k !== 'ampulla' && OPEN.indexOf(k) < 0;
console.log('\n3a · NORMALS.  signed volume (DECIDES) | winding by area (DECIDES) | centroid-outward' +
            ' hull/all (diagnostic only — see the probe\'s note)');
console.log('    out of domain for the closed-surface measures, marked *: ampulla (a lumen, normals' +
            ' inward by design) and ' + OPEN.length + ' model-declared open surfaces — ' + OPEN.join(', '));
for (const t of Object.keys(report.normals)) {
  console.log('    t = ' + t);
  for (const r of report.normals[t]) {
    const dom = closedDomain(r.key);
    const volBad = dom && !(r.signed_volume > 0);
    const windBad = r.winding_agree_by_area != null && r.winding_agree_by_area < 0.999;
    console.log('      ' + (dom ? ' ' : '*') + r.key.padEnd(26) +
      String(r.signed_volume).padStart(13) + ' | ' +
      String(r.winding_agree_by_area).padStart(9) + ' | ' +
      String(r.outward_hull).padStart(7) + '/' + String(r.outward_all).padEnd(7) +
      ' (' + r.tris + ' tris, ' + r.bad_tris + ' wrong-wound, ' + r.slivers + ' slivers)' +
      (volBad || windBad ? '   <-- LOOK' : ''));
    if (volBad) bad.push('t=' + t + ' ' + r.key + ': signed volume ' + r.signed_volume +
      ' is not positive — the surface is wound inside out');
    if (windBad) bad.push('t=' + t + ' ' + r.key + ': only ' + r.winding_agree_by_area +
      ' of its SURFACE AREA is wound with its own normal');
  }
}

console.log('\n3b · RAY CAST — first hits facing AWAY from the camera (must be 0)');
for (const l of report.lumen) {
  console.log('    t=' + l.t.toFixed(2) + '  dir ' + JSON.stringify(l.dir).padEnd(16) +
    l.hits + ' hits, ' + l.first_hits_facing_away + ' facing away' +
    (l.first_hits_facing_away ? '  ' + JSON.stringify(l.offenders) : ''));
  if (l.first_hits_facing_away) bad.push('t=' + l.t + ' dir ' + JSON.stringify(l.dir) +
    ': ' + l.first_hits_facing_away + ' first hits face away — ' + JSON.stringify(l.offenders));
}

console.log('\n5 · THE REAL ADAPTER in viz3d.js, at the t each part\'s OWN BEAT uses');
const byK = {};
for (const r of report.refs) (byK[r.key] = byK[r.key] || []).push(r);
let resolved = 0, failed = 0;
for (const k of Object.keys(byK)) {
  const rs = byK[k];
  const ok = rs.filter(r => r.hasMesh && r.tris > 0);
  resolved += ok.length; failed += rs.length - ok.length;
  const line = rs.map(r => 'beat' + r.beat + ':' +
    (r.hasMesh && r.tris > 0 ? r.tris + 'tri' : (r.error || r.reason || 'NO MESH'))).join('  ');
  console.log('    ' + k.padEnd(26) + line);
  for (const r of rs) if (!(r.hasMesh && r.tris > 0))
    bad.push('adapter: ' + k + ' at ' + r.ref + ' (beat ' + r.beat + ') -> ' +
             (r.error || r.reason || 'no mesh'));
}
console.log('    ' + resolved + ' of ' + (resolved + failed) +
            ' (structure, beat) pairs resolve with geometry through the real adapter');

console.log('\n7 · PERTURBATION of the solved parameters');
for (const r of report.perturbation.rows) {
  console.log('    ' + r.id.padEnd(12) + r.what);
  console.log('                base ' + r.base + '   perturbed ' + r.perturbed +
              '   moved ' + r.moved + (r.pass ? '' : '   <-- DID NOT MOVE'));
  if (!r.pass) bad.push('perturbation ' + r.id + ' did not move: the solve is not reading the model');
}

console.log('\n8 · NO TWO SOLIDS SHARE SPACE (declared contacts excluded by name)');
for (const r of report.overlap.rows)
  console.log('    ' + (r.pass ? 'ok  ' : 'BAD ') + r.a + ' / ' + r.b + '  ' + r.note);
if (report.overlap.failures.length)
  bad.push('interpenetration: ' + report.overlap.failures.join(', '));
console.log('    pairs whose boxes meet: ' + report.overlap.rows.length +
            ', undeclared interpenetrations: ' + report.overlap.failures.length);

console.log('\nACCEPTANCE (' + report.acceptance.rows.length + ' rows)');
for (const r of report.acceptance.rows)
  console.log('    ' + (r.pass ? 'PASS' : 'FAIL') + '  ' + r.id.padEnd(4) +
    String(r.got).slice(0, 22).padEnd(24) + r.must.slice(0, 110));
if (report.acceptance.failures.length) bad.push('acceptance rows failed: ' + report.acceptance.failures.join(', '));
if (report.acceptance.negativesThatDidNotReject.length)
  bad.push('negative cases that did NOT reject: ' + report.acceptance.negativesThatDidNotReject.join(', '));
console.log('    failures ' + JSON.stringify(report.acceptance.failures) +
            ', negative cases that did not reject ' +
            JSON.stringify(report.acceptance.negativesThatDidNotReject));

console.log('\n' + (bad.length ? 'FAILED:\n  - ' + bad.join('\n  - ')
  : 'ALL PROOFS PASS. 4 (does it look like the thing) is for a human: ' + OUT));
writeFileSync(`${OUT}/verdict.json`, JSON.stringify({ failures: bad }, null, 1));
await b.close(); server.close();
process.exit(bad.length ? 1 : 0);
