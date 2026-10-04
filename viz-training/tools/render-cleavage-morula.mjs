/* MedBank · headless proof for models3d/cleavage-morula.js
 *
 *   node viz-training/tools/render-cleavage-morula.mjs
 *
 * The five checks BUILD-TASK-PROMPT section 3 requires, plus three this model needs of its own:
 *
 *   1. IT RENDERS — eleven t (one per beat), screenshots to viz-training/models-out/cleavage-morula/
 *   2. THE CONSOLE IS CLEAN — no error, no warning, no throw
 *   3. NORMALS POINT OUTWARD — three shape-independent measures, because the familiar centroid count
 *      is NOT valid on this model. Every blastomere is a rounded polyhedron, so on a flat facet the
 *      surface normal is the facet's and the radial direction near the facet's edge is nearly
 *      perpendicular to it: the radial count read 0.57 with no winding fault anywhere. What is
 *      measured instead is (a) every triangle's FACE normal, from its vertex ORDER, against the
 *      vertex normals supplied with it — which is the invariant RENDER-STANDARD section 2.1 actually
 *      states, and holds on any shape; (b) the hull portion's SIGNED VOLUME, positive exactly when a
 *      closed surface is wound outward; and (c) section 2.4b's RAY CAST, which is what decides it —
 *      cast a grid of rays from each camera and count how many FIRST HITS face away. On closed solids
 *      the answer is zero, and that is the same answer for a shell.
 *   4. IT LOOKS LIKE THE THING — the renders are for a human; this file cannot do it.
 *   5. EVERY REF RESOLVES THROUGH THE REAL ADAPTER in viz3d.js, with geometry, AT THE t ITS OWN BEAT
 *      USES. Section 3's wording is "for EVERY part the scene names"; `inner_cells` exists only after
 *      compaction, so asking at one t would either miss a defect or invent one.
 *
 *   6. THE WINDING CONVENTION IS RE-MEASURED, NOT REMEMBERED. This model has one ring-quad call site
 *      (uvSurface) and its argument order came from a probe, not from reasoning — RENDER-STANDARD
 *      2.4b: a convention that has to be reasoned about at the call site will be got wrong at some
 *      call site. The probe is re-run on a unit sphere every time, so if render-kit's emitter ever
 *      changes its order this file says so instead of every surface here quietly turning inside out.
 *   7. THE SOLVED PARAMETERS ARE PERTURBED. RENDER-STANDARD: "change the constant the geometry uses
 *      and the reported number must move. If it does not, the test is not measuring the model." Three
 *      inputs are moved and the dependent measures must change.
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
const OUT = 'viz-training/models-out/cleavage-morula';
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

const SCENE = 'viz-training/scenes/embryology__gametogenesis-fertilization__cleavage-morula.json';
const scene = JSON.parse(readFileSync(SCENE, 'utf8'));

/* THE REFS, AT THE t EACH ONE'S OWN BEAT USES. A structure shown in several beats is asked at each of
   them, because "it resolves" is a question about a picture a student looks at. */
const beatT = {};
for (const v of scene.views) {
  const st = (v.ops || []).find(o => o.op === 'SET_STAGE');
  if (st) beatT[v.beat] = st.t;
}
const byKey = {}; scene.structures.forEach(s => { byKey[s.key] = s; });
const shownIn = {};
for (const v of scene.views) {
  const vis = {}; Object.keys(byKey).forEach(k => { vis[k] = true; });
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
    const t = beatT[b];
    const at = (pinned || t == null) ? ref : ref + '@' + t;
    REFS.push({ key: s.key, ref: at, beat: b, pinned });
  }
}

const b = await chromium.launch({
  executablePath: '/opt/pw-browsers/chromium-1194/chrome-linux/chrome',
  args: ['--use-gl=swiftshader', '--enable-unsafe-swiftshader', '--no-sandbox'],
});
const page = await b.newPage({ viewport: { width: 900, height: 900 } });
/* THE CONSOLE, AND THE ONE NAMED EXCLUSION ON IT.
   swiftshader prints GL_CLOSE_PATH_NV performance messages about its own throughput on a machine with
   no graphics card; the model and the page emit nothing. The pattern is taken verbatim from
   viz-training/tools/render-fertilization.mjs so the two proofs filter the same thing, and
   RENDER-STANDARD's own warning is why it is an EXACT pattern that is counted and printed rather than
   a relaxed threshold: "a warning that is a known false alarm trains every future run to ignore the
   channel it prints on, and it did: it cost an unrelated item its console-clean check." Anything else
   on the channel still fails the run. */
const DRIVER_NOISE = /GL Driver Message \(OpenGL, Performance/;
const consoleEvents = [];
page.on('console', m => { if (m.type() === 'error' || m.type() === 'warning') consoleEvents.push(m.type() + ': ' + m.text()); });
page.on('pageerror', e => consoleEvents.push('pageerror: ' + e.message));

await page.setContent('<style>html,body{margin:0;background:#101418}</style><canvas id="c" width="900" height="900"></canvas>');
await page.addScriptTag({ url: BASE + 'viz-training/spike/three.min.js' });
await page.addScriptTag({ url: BASE + 'models3d/render-kit.js' });
await page.addScriptTag({ url: BASE + 'models3d/fertilization.js' });   // row Z measures against it
await page.addScriptTag({ url: BASE + 'models3d/cleavage-morula.js' });

await page.evaluate(() => {
  const K = window.VizKit;
  window.__renderer = K.configureRenderer(new THREE.WebGLRenderer({
    canvas: document.getElementById('c'), antialias: true }));
  window.__renderer.setClearColor(K.bg(0x101418), 1);
  window.__scene = new THREE.Scene();
  K.standardLights(window.__scene);
  window.__camera = new THREE.PerspectiveCamera(34, 1, 0.05, 400);
});

/* ── 1 · THE WINDING PROBE, re-measured on a unit sphere every run ───────────────────────────── */
const winding = await page.evaluate(() => {
  const T = THREE, K = window.VizKit, NU = 24, NV = 32;
  function build(order) {
    const E = K.emitter();
    const pt = (iu, iv) => { const a = (iu / NU) * Math.PI, t = (iv / NV) * Math.PI * 2;
      return new T.Vector3(Math.sin(a) * Math.cos(t), Math.cos(a), Math.sin(a) * Math.sin(t)); };
    for (let iu = 0; iu < NU; iu++) for (let iv = 0; iv < NV; iv++) {
      const P00 = pt(iu, iv), P10 = pt(iu + 1, iv), P11 = pt(iu + 1, iv + 1), P01 = pt(iu, iv + 1);
      const n = [P00, P10, P11, P01].map(p => p.clone().normalize());
      if (order === 'model') E.quad(P00, P10, P11, P01, n[0], n[1], n[2], n[3]);
      else                   E.quad(P00, P01, P11, P10, n[0], n[3], n[2], n[1]);
    }
    const g = E.geometry(E.count());
    const p = g.attributes.position;
    let agree = 0, tot = 0;
    const A = new T.Vector3(), B = new T.Vector3(), C = new T.Vector3(), e1 = new T.Vector3(),
          e2 = new T.Vector3(), fn = new T.Vector3();
    for (let i = 0; i + 2 < p.count; i += 3) {
      A.fromBufferAttribute(p, i); B.fromBufferAttribute(p, i + 1); C.fromBufferAttribute(p, i + 2);
      fn.copy(e1.subVectors(B, A).cross(e2.subVectors(C, A)));
      const centroid = A.clone().add(B).add(C).multiplyScalar(1 / 3);
      if (fn.lengthSq() < 1e-20) continue;
      tot++; if (fn.dot(centroid) > 0) agree++;
    }
    return { agree, tot };
  }
  return { model: build('model'), reversed: build('rev') };
});

/* ── 2 · NORMALS: centroid counts, and the ray cast that decides ─────────────────────────────── */
const CAMS = [[0, 0, 1], [1, 0.3, 0.6], [-0.8, 0.5, 0.4], [0, 1, 0.15], [0.4, -0.7, 0.5]];
const T_RENDER = [0, 0.175, 0.435, 0.520, 0.595, 0.700, 0.800, 0.880, 0.910, 0.940, 1.0];

const frames = [];
for (const t of T_RENDER) {
  const r = await page.evaluate(async ({ t, CAMS }) => {
    const T = THREE, K = window.VizKit, M = window.MB3D_MODELS['cleavage-morula'];
    const sc = window.__scene;
    for (let i = sc.children.length - 1; i >= 0; i--)
      if (sc.children[i].type === 'Group') sc.remove(sc.children[i]);
    const g = M.build(t, Object.assign({}, M.FULL));
    sc.add(g);

    /* 2a — FACE WINDING AGAINST THE SUPPLIED NORMALS, which is the invariant RENDER-STANDARD
       actually states, and the radial/centroid count is NOT valid here.

       Section 2.1's rule is that a triangle's FACE normal — the one its vertex ORDER implies — must
       agree with the vertex normals supplied alongside it. That is checkable on any shape. The
       familiar "do the normals point away from the centroid" count is a PROXY for it that only works
       on a star-shaped solid whose surface is roughly radial, and a compacted blastomere is neither:
       it is a rounded polyhedron, and on a flat facet the surface normal is the facet's normal while
       the radial direction to a point near the facet's edge is nearly perpendicular to it. So the
       dot product legitimately approaches zero and crosses it, with no winding fault anywhere.
       Measured: the radial count read 0.7137 on outer_cells and 0.5712 on inner_cells while the ray
       cast found 0 back faces first from 6,083 rays across five cameras and eleven stages. The proxy
       was wrong, not the geometry. render-kit's own note says the same thing about tubes — "a tube
       read at its own centreline will not be [majority-outward] — understand which you have before
       you accept a low number."

       Also reported: the SIGNED VOLUME of the hull portion, which is positive exactly when a closed
       surface is wound outward, and is the other shape-independent statement of the same invariant. */
    const rows = [];
    g.traverse(o => {
      if (!o.isMesh || o.userData.outline) return;
      const p = o.geometry.attributes.position, n = o.geometry.attributes.normal;
      const hull = o.geometry.userData.hullCount != null ? o.geometry.userData.hullCount : p.count;
      const A = new T.Vector3(), B = new T.Vector3(), Cv = new T.Vector3();
      const e1 = new T.Vector3(), e2 = new T.Vector3(), fn = new T.Vector3(), vn = new T.Vector3();
      let agree = 0, tris = 0, hullAgree = 0, hullTris = 0, vol = 0;
      for (let i = 0; i + 2 < p.count; i += 3) {
        A.set(p.getX(i), p.getY(i), p.getZ(i));
        B.set(p.getX(i + 1), p.getY(i + 1), p.getZ(i + 1));
        Cv.set(p.getX(i + 2), p.getY(i + 2), p.getZ(i + 2));
        fn.copy(e1.subVectors(B, A).cross(e2.subVectors(Cv, A)));
        if (fn.lengthSq() < 1e-20) continue;                 // degenerate: at a taper's point
        vn.set(n.getX(i) + n.getX(i + 1) + n.getX(i + 2),
               n.getY(i) + n.getY(i + 1) + n.getY(i + 2),
               n.getZ(i) + n.getZ(i + 1) + n.getZ(i + 2));
        const ok = fn.dot(vn) > 0;
        tris++; if (ok) agree++;
        if (i < hull) { hullTris++; if (ok) hullAgree++; vol += A.dot(e1.crossVectors(B, Cv)) / 6; }
      }
      rows.push({ key: o.userData.key, verts: p.count, hull,
                  windingAgree: tris ? agree / tris : null,
                  hullWindingAgree: hullTris ? hullAgree / hullTris : null,
                  hullSignedVolume: vol });
    });

    /* 2b — THE RAY CAST. What surface faces the camera FIRST, and does it face back? */
    const box = new T.Box3().setFromObject(g);
    const ctr = box.getCenter(new T.Vector3()), sz = box.getSize(new T.Vector3());
    const picks = [];
    g.traverse(o => { if (o.isMesh && !o.userData.outline) picks.push(o); });
    let first = 0, away = 0;
    for (const d0 of CAMS) {
      const d = new T.Vector3().fromArray(d0).normalize();
      const up = Math.abs(d.y) > 0.99 ? new T.Vector3(0, 0, 1) : new T.Vector3(0, 1, 0);
      const e1 = new T.Vector3().crossVectors(up, d).normalize();
      const e2 = new T.Vector3().crossVectors(d, e1).normalize();
      const rc = new T.Raycaster(); rc.firstHitOnly = true;
      const R = sz.length();
      const N = 22;
      for (let i = 0; i < N; i++) for (let j = 0; j < N; j++) {
        const a = ((i + 0.5) / N - 0.5) * sz.length() * 0.78;
        const bb = ((j + 0.5) / N - 0.5) * sz.length() * 0.78;
        const origin = ctr.clone().addScaledVector(d, R * 1.6)
          .addScaledVector(e1, a).addScaledVector(e2, bb);
        rc.set(origin, d.clone().negate());
        const hits = rc.intersectObjects(picks, false);
        if (!hits.length) continue;
        const h = hits[0];
        if (!h.face) continue;
        first++;
        const nn = h.face.normal.clone().applyMatrix3(
          new T.Matrix3().getNormalMatrix(h.object.matrixWorld)).normalize();
        if (nn.dot(d) < 0) away++;
      }
    }

    K.fitCamera(window.__camera, g, 1.08);
    const dir = new T.Vector3(0.45, 0.35, 1).normalize();
    const fit = K.fitCamera(window.__camera, g, 1.08);
    window.__camera.position.copy(fit.centre).addScaledVector(dir, fit.distance);
    window.__camera.lookAt(fit.centre);
    window.__renderer.render(window.__scene, window.__camera);
    return { t, rows, rayFirst: first, rayAway: away, state: g.userData.state,
             bbox: [sz.x, sz.y, sz.z] };
  }, { t, CAMS });
  const file = `${OUT}/t${String(t).replace('.', '_')}.png`;
  await page.locator('#c').screenshot({ path: file });
  r.file = file;
  frames.push(r);
}

/* ── TWO PASSES, AND THE SECOND IS THE ONE A HUMAN CAN JUDGE ─────────────────────────────────
   The pass above builds with FULL, which includes the uterine-tube schematic — and that schematic is
   at its OWN scale, deliberately (the tube is 10 cm and the embryo 0.12 mm). fitCamera then fits the
   whole group, so every proof frame above shows a 10 cm tube with a speck beside it, and the speck is
   the subject. That is RENDER-STANDARD 3.x arriving in its simplest form: the proof frames prove the
   geometry and prove nothing about the pictures a student looks at, because the player never composes
   this frame — beat 1 shows the journey and nothing else, and beats 2 to 11 hide it.
   So this pass composes each beat the way the scene's own ops do: only the structures that beat
   shows, camera fitted to those. These are the frames to judge "it looks like the thing" on. */
const beatShots = [];
for (const v of scene.views) {
  const stg = (v.ops || []).find(o => o.op === 'SET_STAGE');
  const shown = [];
  { const vis = {}; Object.keys(byKey).forEach(k => { vis[k] = true; });
    for (const o of v.ops || []) {
      const keys = (o.target === '*' || o.target == null) ? Object.keys(byKey)
        : (byKey[o.target] ? [o.target]
           : Object.keys(byKey).filter(k => byKey[k].group === o.target));
      if (o.op === 'SHOW_STRUCTURE') keys.forEach(k => { vis[k] = true; });
      else if (o.op === 'HIDE_STRUCTURE') keys.forEach(k => { vis[k] = false; });
    }
    for (const k of Object.keys(vis)) if (vis[k]) shown.push(k); }
  const shownOpacity = {};
  for (const k of shown) shownOpacity[k.replace(/_(cut|ghost)$/, '')] =
    (byKey[k] && byKey[k].opacity != null) ? byKey[k].opacity : 1;
  const info = await page.evaluate(({ t, shown, shownOpacity }) => {
    const T = THREE, K = window.VizKit, M = window.MB3D_MODELS['cleavage-morula'];
    const sc = window.__scene;
    for (let i = sc.children.length - 1; i >= 0; i--)
      if (sc.children[i].type === 'Group') sc.remove(sc.children[i]);
    const cut = shown.some(k => /_cut$/.test(k));
    /* A STRUCTURE KEY IS NOT A PART KEY. The scene names a part more than once when two beats need
       the same geometry drawn differently — `_cut` for a sectioned build, `_ghost` for a see-through
       one — so the suffix is stripped to get back to the part the model builds. */
    const want = new Set(shown.map(k => k.replace(/_(cut|ghost)$/, '')));
    const g = M.build(t == null ? 1 : t, {
      zona: want.has('zona'), nuclei: want.has('nuclei'), size_ref: want.has('size_ref'),
      journey: want.has('journey') || want.has('day_markers'), cut: cut });
    /* drop anything the beat does not show, exactly as the player's ops do */
    for (let i = g.children.length - 1; i >= 0; i--) {
      const k = g.children[i].userData.key;
      if (k && !want.has(k)) g.remove(g.children[i]);
    }
    /* AND APPLY EACH STRUCTURE'S OWN OPACITY, which this composer used to ignore entirely.
       RENDER-STANDARD 3.x: the player resets every structure to visible, applies the view's ops,
       applies each structure's own opacity and refits the camera. Two of those three were here and
       the third was not, so a beat whose whole point is a see-through layer composed as though it
       were solid — which is how beat 6 came back drawing nothing a student could use. */
    g.traverse(o => {
      if (!o.isMesh || !o.material) return;
      const k = o.userData && o.userData.key;
      const op = k != null ? shownOpacity[k] : undefined;
      if (op == null || op >= 1) return;
      const mats = Array.isArray(o.material) ? o.material : [o.material];
      for (const m of mats) { m.transparent = true; m.opacity = op; m.depthWrite = false; }
    });
    sc.add(g);
    const fit = K.fitCamera(window.__camera, g, 1.06);
    const dir = new T.Vector3(0.35, 0.28, 1).normalize();
    window.__camera.position.copy(fit.centre).addScaledVector(dir, fit.distance);
    window.__camera.lookAt(fit.centre);
    window.__renderer.render(window.__scene, window.__camera);
    const box = new T.Box3().setFromObject(g);
    const sz = box.getSize(new T.Vector3());
    return { drew: g.children.filter(c => !c.userData.outline).map(c => c.userData.key),
             size: [sz.x, sz.y, sz.z] };
  }, { t: stg ? stg.t : null, shown, shownOpacity });
  const file = `${OUT}/beat${String(v.beat).padStart(2, '0')}.png`;
  await page.locator('#c').screenshot({ path: file });
  beatShots.push({ beat: v.beat, t: stg ? stg.t : null, title: v.title, shown, file, info });
}

/* also render the CUT variant, which is beat 9's whole picture */
for (const t of [0.880]) {
  await page.evaluate(({ t }) => {
    const T = THREE, K = window.VizKit, M = window.MB3D_MODELS['cleavage-morula'];
    const sc = window.__scene;
    for (let i = sc.children.length - 1; i >= 0; i--)
      if (sc.children[i].type === 'Group') sc.remove(sc.children[i]);
    const g = M.build(t, Object.assign({}, M.FULL, { cut: true, journey: false, size_ref: false }));
    sc.add(g);
    const fit = K.fitCamera(window.__camera, g, 1.08);
    const dir = new T.Vector3(0.1, 0.25, 1).normalize();
    window.__camera.position.copy(fit.centre).addScaledVector(dir, fit.distance);
    window.__camera.lookAt(fit.centre);
    window.__renderer.render(window.__scene, window.__camera);
  }, { t });
  await page.locator('#c').screenshot({ path: `${OUT}/t0_880_cut.png` });
}

/* ── 3 · THE ADAPTER. Every ref, at its own beat's t, through viz3d.js itself ───────────────── */
await page.addScriptTag({ url: BASE + 'viz3d.js' });
const adapter = await page.evaluate(async ({ REFS, BASE }) => {
  window.MEDBANK_CONFIG = Object.assign({}, window.MEDBANK_CONFIG, { MODEL_BASE: BASE + 'models3d/' });
  const MB = window.MB3D;
  if (!MB || !MB.adapters || !MB.adapters.procedural) return { error: 'viz3d did not expose MB3D.adapters.procedural' };
  const ad = MB.adapters.procedural;
  const out = [];
  for (const r of REFS) {
    try {
      const res = await ad.load(window.THREE, { key: r.key, refs: { procedural: r.ref } });
      const mesh = res && (res.mesh || res.object || res);
      const geo = mesh && mesh.geometry;
      out.push({ key: r.key, beat: r.beat, ref: r.ref,
                 ok: !!(geo && geo.attributes && geo.attributes.position && geo.attributes.position.count > 0),
                 verts: geo && geo.attributes && geo.attributes.position ? geo.attributes.position.count : 0,
                 reason: res && res.reason });
    } catch (e) { out.push({ key: r.key, beat: r.beat, ref: r.ref, ok: false, error: String(e && e.message) }); }
  }
  return { rows: out };
}, { REFS, BASE });

/* ── 4 · PERTURBATION. Change an input; the dependent measures must move ─────────────────────── */
const perturb = await page.evaluate(() => {
  const M = window.MB3D_MODELS['cleavage-morula'];
  const base = { app: M.claimMeasure('apposedFrac', 0.800), inner: M.claimMeasure('innerCells', 1.0),
                 mass: M.claimMeasure('massRadius', 0.595), nc: M.claimMeasure('ncRatioRel', 1.0) };
  const res = [];
  const cases = [['K_FLAT', 0.30], ['K_ROUND', 0.30], ['SAMPLE', 0.60]];
  for (const [name, val] of cases) {
    const before = M._setConst(name, val);
    const after = { app: M.claimMeasure('apposedFrac', 0.800), inner: M.claimMeasure('innerCells', 1.0),
                    mass: M.claimMeasure('massRadius', 0.595), nc: M.claimMeasure('ncRatioRel', 1.0) };
    res.push({ name, val,
      movedApposed: Math.abs(after.app - base.app) > 1e-6,
      movedMass: Math.abs(after.mass - base.mass) > 1e-6,
      base: base.app, after: after.app, baseMass: base.mass, afterMass: after.mass });
    M._setConst(name, before[name]);
  }
  M._resetCaches();
  return res;
});

/* ── 5 · NO TWO SOLIDS SHARE SPACE (RENDER-STANDARD 3.z) ─────────────────────────────────────── */
const overlap = await page.evaluate(() => {
  const T = THREE, M = window.MB3D_MODELS['cleavage-morula'];
  /* CONSTRUCTION, EXCLUDED BY NAME rather than by a tolerance:
       zona      — a shell whose CAVITY is where every cell lives; it contains them by design
       size_ref  — a measuring outline at the zygote's radius; the cells are meant to fill it
       nuclei    — each nucleus is inside its own cell by construction, and row L asserts it is
       journey / day_markers — a schematic at a different scale, never in frame with the cells */
  const CONSTRUCTION = new Set(['zona', 'size_ref', 'nuclei', 'journey', 'day_markers']);
  const out = [];
  for (const t of [0.175, 0.595, 0.800, 1.0]) {
    const g = M.build(t, Object.assign({}, M.FULL, { journey: false }));
    const parts = [];
    g.traverse(o => {
      if (!o.isMesh || o.userData.outline) return;
      if (CONSTRUCTION.has(o.userData.key)) return;
      parts.push(o);
    });
    /* outer_cells and inner_cells are each ONE merged mesh of many cells, so a pair test over keys
       cannot see cell-against-cell. The containment question that matters here is whether the two
       FATE GROUPS interpenetrate, and it is asked by ray-cast containment: how many vertices of one
       lie inside the other. */
    let worst = 0, pair = null;
    for (let i = 0; i < parts.length; i++) for (let j = 0; j < parts.length; j++) {
      if (i === j) continue;
      const A = parts[i], B = parts[j];
      const bbA = new T.Box3().setFromObject(A), bbB = new T.Box3().setFromObject(B);
      if (!bbA.intersectsBox(bbB)) continue;
      /* THE TEST POINT IS STEPPED INTO A ALONG ITS OWN NORMAL, BY A MARGIN, and the first version
         was not — which made it meaningless on exactly the pair it was asked about.
         Cell-cell apposition in this model is EXACT: the quadratic smooth minimum equals the plain
         minimum away from an edge, so two neighbouring cells' facets coincide to floating point. That
         is the whole point of the construction (it is what makes a sealed cell sealed) and it means a
         parity ray cast from a vertex lying ON a shared facet is a coin flip. Measured: the first
         version reported 15.72% of inner_cells' vertices "inside" outer_cells at t = 1, and an inner
         cell has ~97.5% of its surface apposed — so the number was the coin flip, not an overlap.
         Stepping 0.05 units (0.5 µm) INWARD along the vertex normal moves a shared-facet point into A
         and out of B, so it is not counted, while a vertex genuinely buried in B by more than the
         margin still is. The margin is stated rather than tuned: it is a membrane-scale length, an
         order of magnitude above the quadrature's own resolution. */
      const MARGIN = 0.05;
      const rc = new T.Raycaster(); rc.firstHitOnly = false;
      const p = A.geometry.attributes.position, na = A.geometry.attributes.normal;
      let inside = 0, tested = 0;
      const step = Math.max(1, Math.floor(p.count / 500));
      const dir = new T.Vector3(0.5773, 0.5774, 0.5773);
      for (let k = 0; k < p.count; k += step) {
        const o = new T.Vector3(p.getX(k), p.getY(k), p.getZ(k));
        const nv = new T.Vector3(na.getX(k), na.getY(k), na.getZ(k));
        if (nv.lengthSq() < 1e-12) continue;
        o.addScaledVector(nv.normalize(), -MARGIN);          // inward, into A
        rc.set(o, dir);
        const hits = rc.intersectObject(B, false);
        tested++;
        if (hits.length % 2 === 1) inside++;
      }
      const frac = tested ? inside / tested : 0;
      if (frac > worst) { worst = frac; pair = A.userData.key + ' in ' + B.userData.key; }
    }
    out.push({ t, worstInsideFrac: worst, pair, parts: parts.map(p => p.userData.key) });
  }
  return out;
});

/* ── 6 · ACCEPTANCE, measured here as well as asserted at build time ────────────────────────── */
const acc = await page.evaluate(() => {
  const M = window.MB3D_MODELS['cleavage-morula'];
  M._resetCaches();
  const r = M.acceptance();
  const n = M.negatives();
  return { pass: r.pass, measured: JSON.parse(JSON.stringify(r.measured)), negatives: n,
           zonaProof: M.zonaProof(), ladder: M.ladderMeta() };
});

await b.close();
server.close();

/* ── report ─────────────────────────────────────────────────────────────────────────────────── */
const L = [];
const say = s => { L.push(s); console.log(s); };

say('MedBank · proof for models3d/cleavage-morula.js');
say('  scene  ' + SCENE);
say('  out    ' + OUT);
say('');

say('1 · WINDING PROBE on a unit sphere (render-kit emitter.quad)');
say(`    model order     ${winding.model.agree} of ${winding.model.tot} face normals agree with the outward radial`);
say(`    reversed order  ${winding.reversed.agree} of ${winding.reversed.tot}`);
const windingOK = winding.model.agree === winding.model.tot && winding.reversed.agree === 0;
say('    ' + (windingOK ? 'PASS — the convention this model was written against still holds'
                        : 'FAIL — render-kit\'s emitter order has changed; every surface here is inside out'));
say('');

say('2 · NORMALS');
let windWorst = 1, volBad = [], rayAwayTotal = 0, rayFirstTotal = 0;
for (const f of frames) {
  rayAwayTotal += f.rayAway; rayFirstTotal += f.rayFirst;
  for (const r of f.rows) {
    if (r.windingAgree != null) windWorst = Math.min(windWorst, r.windingAgree);
    if (r.hullSignedVolume != null && !(r.hullSignedVolume > 0)) volBad.push(`t=${f.t} ${r.key} ${r.hullSignedVolume}`);
  }
}
say(`    FACE WINDING vs supplied normals, worst over every mesh of every t: ${windWorst.toFixed(4)}`);
say(`    hull signed volume positive on every mesh of every t: ${volBad.length === 0 ? 'yes' : 'NO — ' + volBad.join('; ')}`);
say(`    RAY CAST, 5 cameras x 484 rays x ${frames.length} stages: ${rayAwayTotal} of ${rayFirstTotal} first hits face AWAY from the camera`);
say('    ' + (rayAwayTotal === 0 ? 'PASS — nothing shows a back face first' : 'FAIL — a back face is the nearest surface somewhere'));
say('    per-mesh detail at t = 1.0:');
for (const r of frames[frames.length - 1].rows)
  say(`      ${r.key.padEnd(14)} verts ${String(r.verts).padStart(7)}  hull ${String(r.hull).padStart(7)}  winding ${r.windingAgree.toFixed(4)}  hullWinding ${r.hullWindingAgree.toFixed(4)}  hullSignedVolume ${r.hullSignedVolume.toFixed(2)}`);
say('');

say('3 · IT RENDERS');
say('  3a · the stage walk, built with FULL — geometry proof only, NOT the pictures a student sees');
for (const f of frames)
  say(`    t=${String(f.t).padEnd(6)} cells ${String(f.state.cells).padStart(2)}  inner ${String(f.state.inner).padStart(2)}  massR ${f.state.massRadius.toFixed(4)}  bbox ${f.bbox.map(v => v.toFixed(2)).join(' x ')}  ${f.file}`);
say(`    ${OUT}/t0_880_cut.png   the cut variant, which is beat 9's picture`);
say('  3b · EACH BEAT COMPOSED AS THE SCENE COMPOSES IT — only what the beat shows, camera fitted to');
say('       that. These are the frames to judge "it looks like the thing" on.');
for (const b of beatShots)
  say(`    beat ${String(b.beat).padStart(2)}  t=${String(b.t).padEnd(6)} drew [${b.info.drew.join(', ')}]  extent ${b.info.size.map(v => v.toFixed(1)).join(' x ')}  ${b.file}`);
const beatEmpty = beatShots.filter(b => b.info.drew.length === 0);
if (beatEmpty.length) say('    FAIL — beats that drew NOTHING: ' + beatEmpty.map(b => b.beat).join(', '));
say('');

say('4 · THE ADAPTER — every ref the scene names, at its own beat\'s t');
const bad = (adapter.rows || []).filter(r => !r.ok);
for (const r of (adapter.rows || []))
  say(`    ${r.ok ? 'ok  ' : 'FAIL'} beat ${String(r.beat).padStart(2)}  ${r.ref.padEnd(46)} verts ${String(r.verts).padStart(7)}${r.reason ? '  reason=' + r.reason : ''}${r.error ? '  ' + r.error : ''}`);
say('    ' + (bad.length === 0 ? `PASS — ${adapter.rows.length} of ${adapter.rows.length} resolve with geometry` : `FAIL — ${bad.length} did not resolve`));
say('');

say('5 · PERTURBATION — change an input, the measures must move');
for (const p of perturb)
  say(`    ${p.name}=${p.val}  apposedFrac ${p.base.toFixed(4)} -> ${p.after.toFixed(4)} ${p.movedApposed ? 'MOVED' : 'DID NOT MOVE'}   massRadius ${p.baseMass.toFixed(4)} -> ${p.afterMass.toFixed(4)} ${p.movedMass ? 'MOVED' : 'DID NOT MOVE'}`);
const perturbOK = perturb.every(p => p.movedApposed || p.movedMass);
say('    ' + (perturbOK ? 'PASS — every perturbation moved a measure' : 'FAIL — a measure is not a function of the geometry'));
say('');

say('6 · NO TWO SOLIDS SHARE SPACE (3.z; construction excluded by name: zona, size_ref, nuclei, journey, day_markers;');
say('    tested 0.05 units INSIDE each vertex, because apposed cell facets coincide exactly by construction)');
for (const o of overlap)
  say(`    t=${String(o.t).padEnd(6)} worst vertices-inside-another-part ${(o.worstInsideFrac * 100).toFixed(2)}%  ${o.pair || '(no pair of boxes meets)'}  parts: ${o.parts.join(', ')}`);
const overlapOK = overlap.every(o => o.worstInsideFrac <= 0.01);
say('    ' + (overlapOK ? 'PASS' : 'FAIL — two parts interpenetrate'));
say('');

say('7 · ACCEPTANCE (' + Object.keys(acc.pass).length + ' rows) and its negative cases');
const accBad = Object.keys(acc.pass).filter(k => acc.pass[k] === false);
const negBad = Object.keys(acc.negatives).filter(k => !acc.negatives[k]);
say('    rows: ' + Object.keys(acc.pass).map(k => k + '=' + (acc.pass[k] === false ? 'FAIL' : 'pass')).join(' '));
say('    negative cases rejected: ' + (negBad.length === 0 ? 'all ' + Object.keys(acc.negatives).length : 'NOT ' + negBad.join(',')));
const m = acc.measured;
say(`    V  volume error, worst over the scene's own t and every settled stage: ${m.V_worst.toExponential(2)}`);
say(`    V2 worst shortfall anywhere in a 0.005 walk: ${(m.V2_worstShortfall * 100).toFixed(2)}% at t=${m.V2_worstAt}`);
say(`    B  mass-radius solve returned its bound at ${m.B_saturations} of 201 t, ${m.B_outsideWindows.length} of them OUTSIDE the declared windows ${JSON.stringify(m.B_windows)}`);
say(`    D  cell-mass diameter error, worst: ${(m.D_worst * 100).toFixed(2)}%  (zygote diameter ${m.D_zygote.toFixed(4)})`);
say(`    C  apposed fraction ${m.C_pre.toFixed(4)} -> ${m.C_post.toFixed(4)} = ${m.C_ratio.toFixed(3)}x across compaction`);
say(`    N  nucleus:cytoplasm ratio x${m.N_ratio.toFixed(2)} from 1 cell to 32, monotone ${m.N_monotone}`);
say(`    I  inner cells: ${m.I_inner_at_8} of ${m.I_cells_at_8} at eight cells, ${m.I_inner_at_32} of ${m.I_cells_at_32} at thirty-two; population separation ${m.I_separation == null ? 'n/a' : m.I_separation.toFixed(2) + 'x'}`);
say(`    S  worst cell-volume spread: ${(m.S_worst * 100).toFixed(1)}% of the mean`);
say(`    X  closest any two drawn surfaces come: ${m.X_minSeparation == null ? 'n/a' : m.X_minSeparation.toFixed(5)} at t=${m.X_at} (cells ${JSON.stringify(m.X_pair)}), floor ${m.X_floor.toFixed(5)} = ${(m.X_floor / m.X_epsMem).toFixed(2)} x EPS_MEM ${m.X_epsMem}`);
say(`    Z  zona vs models3d/fertilization.js's OWN built zona: inner err ${(acc.zonaProof.innerErr * 100).toFixed(3)}%, outer err ${(acc.zonaProof.outerErr * 100).toFixed(3)}%  [${acc.zonaProof.source}]`);
say(`    ZC zona radii identical across t: inner spread ${m.ZC_innerSpread.toExponential(1)}, outer ${m.ZC_outerSpread.toExponential(1)}`);
say(`    R  doubling the packing relaxation moves no centre by more than ${(m.R_worst * 100).toFixed(4)}% of a cell radius`);
say(`    K  worst single step in a 0.005 walk: ${(m.K_worstStep * 100).toFixed(1)}% of a cell radius at t=${m.K_worstAt}; cell count never decreases: ${!m.K_countDrop}`);
say(`    L  solved nuclear radius ${m.L_nuclearRadius.toFixed(4)} against the tightest cell inradius ${m.L_tightestInradius.toFixed(4)}`);
say(`    H  cleavage axes: first is the ${m.H_firstAxis}; ${m.H_fallbacks} of the later ones fell back to the perpendicular rule`);
say('');

say('8 · CONSOLE');
const driver = consoleEvents.filter(m => DRIVER_NOISE.test(m));
const noise = consoleEvents.filter(m => !DRIVER_NOISE.test(m));
if (driver.length) say('    ' + driver.length + ' swiftshader driver performance message(s), filtered '
  + 'by exact pattern and listed here so they are not hidden:\n      "' + driver[0].slice(0, 180) + '"');
if (noise.length) { say('    FAIL — ' + noise.length + ' error/warning:'); noise.forEach(n => say('      ' + n)); }
else say('    PASS — no error, no warning, no throw from the page or the model');
say('');

const allOK = windingOK && rayAwayTotal === 0 && bad.length === 0 && perturbOK && overlapOK
           && accBad.length === 0 && negBad.length === 0 && noise.length === 0
           && windWorst === 1 && volBad.length === 0 && beatEmpty.length === 0;
say(allOK ? 'ALL CHECKS PASS' : 'CHECKS FAILED');
say('');
say('4 · IT LOOKS LIKE THE THING — this file cannot answer that. The renders are in ' + OUT + '.');

writeFileSync(`${OUT}/proof.txt`, L.join('\n') + '\n');
process.exit(allOK ? 0 : 1);
