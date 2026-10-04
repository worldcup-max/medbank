/* MedBank · headless proof for models3d/amniotic-cavity-yolk-sac.js
 *
 *   node viz-training/tools/render-amniotic-cavity-yolk-sac.mjs
 *
 * The five checks BUILD-TASK-PROMPT section 3 requires, plus five this item needs of its own.
 *
 *   1. IT RENDERS — a stage walk written to viz-training/models-out/amniotic-cavity-yolk-sac/. The
 *      eleven PLAYER frames, which are the pictures a student actually looks at, are written by
 *      measure-scene-visibility.mjs into .../player/ and are not duplicated here.
 *   2. THE CONSOLE IS CLEAN — no error, no warning, no throw, with ONE named and counted exclusion
 *      (swiftshader's own performance chatter on a machine with no GPU). An exact pattern, not a
 *      threshold: RENDER-STANDARD records that a warning which is a known false alarm trains every
 *      future run to ignore the channel it prints on, and it cost an unrelated item its console check.
 *   3. NORMALS POINT OUTWARD — three shape-independent measures, because a centroid count is NOT
 *      valid here: most parts are SHELLS, whose inner surface points inward by construction, and a
 *      radial count on the chorion would read ~50% with nothing wrong. What is measured is (a) every
 *      triangle's FACE normal, from its vertex ORDER, against the vertex normals supplied with it —
 *      RENDER-STANDARD 2.1's actual invariant, valid on any shape; (b) each part's enclosed signed
 *      volume, positive exactly when it is wound outward, floored in its own facet quanta; and
 *      (c) 2.4b's RAY CAST from five cameras, which is what decides it.
 *   4. IT LOOKS LIKE THE THING — the renders are for a human; this file cannot do it. The build run
 *      records in BUILD-LOG.md which frames it opened and what it changed as a result. On this item
 *      that list is not short: opening the frames is what found the transverse section rendering in
 *      white because a `_cutz` key missed the palette, a cyst sitting on top of the day-13 embryo,
 *      and a connecting stalk drawn as a 9 um thread.
 *   5. EVERY REF RESOLVES THROUGH THE REAL ADAPTER in viz3d.js, with geometry, at the t of every
 *      beat that shows it.
 *
 *   6. THE MOUNT CHECK, AND THIS MODEL'S RULE IS WEAKER THAN implantation.js's ON PURPOSE. viz3d
 *      resolves an UNPINNED ref at t = 1 at mount (viz3d.js:480) and restage() never recovers a
 *      structure that came back empty, so the player tells a student "no 3D model of this structure
 *      yet" about a structure the model builds — the notochord fault. implantation.js answers that
 *      by requiring every unpinned part to build at EVERY t, which it can: all thirteen of its parts
 *      span its whole week. This model spans ten weeks and some of its parts genuinely do not exist
 *      for most of it — there is no primary yolk sac on day 60 and no allantois on day 9, and drawing
 *      one would teach something false to make a loader happy. So the requirement here is the
 *      engine's actual one plus the beats': NON-EMPTY AT t = 1, and non-empty at the t of every beat
 *      that shows it. Both halves are asserted. The walk ALSO reports, for information, at which t
 *      each unpinned part is empty, so the stage limits are visible rather than implied.
 *   7. THE SOLVED PARAMETERS ARE PERTURBED. "Change the constant the geometry uses and the reported
 *      number must move. If it does not, the test is not measuring the model." THE TESSELLATION is
 *      the one that matters: the cyst radius is solved by bisection against an integral over the
 *      grid, so if moving the grid does not move the solved radius then the solve is reading a
 *      formula and not the geometry.
 *   8. THE MODEL'S OWN BATTERY AND ITS NEGATIVE CASES ARE RUN AND PRINTED, because build() asserts
 *      only the cheap half.
 *   9. "CARRIED ACROSS VERBATIM" IS RE-ASSERTED, NOT PROMISED. The scene was generated from the
 *      SVG-era file by a script; this re-checks that all 25 of that file's narrations appear in the
 *      converted scene byte for byte, against the original kept in the repo. A note in a file is a
 *      claim, including this one.
 *  10. THE SCENE'S CLOCK IS THE MODEL'S CLOCK. Every beat's SET_STAGE t was written as tOfDay(the
 *      day its narration names), by a generator that carries its OWN copy of the day anchors. Two
 *      copies of a table drift; this asserts that the scene's t values and the model's tOfDay() agree
 *      to 1e-9, so a day named in a beat's claim is the day the model is built at.
 *  11. THE GEOMETRY IS WATERTIGHT. Every edge of every part, in every build, shared by exactly two
 *      triangles in opposite directions. This is strictly stronger than the enclosed-volume sign and
 *      it is what found the two real emitter faults on this item: a cap fan that folded back on a
 *      non-convex meridional face, and a cap hint that went degenerate at a pole and silently dropped
 *      the triangles there.
 *
 * WHERE THIS RUNS. In a Linux container with chromium, against a copy of the repo staged out of
 * Frank's machine. The files under test are byte-identical to the ones committed back; the substrate
 * for the RENDER is not the mount, and that is stated rather than assumed.
 */
import { chromium } from 'playwright';
import { readFileSync, mkdirSync, writeFileSync, existsSync, readdirSync } from 'fs';
import http from 'http';
import path from 'path';
import fs from 'fs';

const ROOT = process.cwd();
const NAME = 'amniotic-cavity-yolk-sac';
const OUT = 'viz-training/models-out/' + NAME;
mkdirSync(OUT, { recursive: true });
const ORIGINAL = process.env.AYC_ORIGINAL || 'viz-training/_amniotic-cavity-yolk-sac-preconversion.json';

/* THE HEADLESS SHELL IS PREFERRED, AND THAT IS NOT A PREFERENCE. The chromium build in this image
   rejects --headless=old, which is what this playwright passes to a full chrome binary; the launch
   dies with "Old Headless mode has been removed from the Chrome binary" and the error reads like a
   harness bug rather than a browser one. chrome-headless-shell is the standalone implementation of
   the mode playwright asks for, so it is tried first and the full binary second. */
function findChromium() {
  if (process.env.CHROMIUM_PATH) return process.env.CHROMIUM_PATH;
  const base = '/opt/pw-browsers';
  if (existsSync(base)) {
    const dirs = readdirSync(base);
    for (const rel of ['chrome-linux/headless_shell', 'chrome-linux/chrome'])
      for (const d of dirs) {
        const p = path.join(base, d, rel);
        if (existsSync(p)) return p;
      }
  }
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

const SCENE = 'viz-training/scenes/embryology__weeks-1-2-implantation-bilaminar-disc__' + NAME + '.json';
const scene = JSON.parse(readFileSync(SCENE, 'utf8'));
const byKey = {}; scene.structures.forEach(s => { byKey[s.key] = s; });

function shownOf(v) {
  const vis = {}; Object.keys(byKey).forEach(k => { vis[k] = true; });
  for (const o of v.ops || []) {
    const keys = (o.target === '*' || o.target == null) ? Object.keys(byKey)
      : (byKey[o.target] ? [o.target]
         : Object.keys(byKey).filter(k => byKey[k].group === o.target));
    if (o.op === 'SHOW_STRUCTURE') keys.forEach(k => { vis[k] = true; });
    else if (o.op === 'HIDE_STRUCTURE') keys.forEach(k => { vis[k] = false; });
  }
  return Object.keys(vis).filter(k => vis[k]);
}
const beats = scene.views.map(v => {
  const st = (v.ops || []).find(o => o.op === 'SET_STAGE');
  return { beat: v.beat, t: st ? st.t : null, title: v.title, shown: shownOf(v) };
});

const T_REQUIRED = [0, 0.2, 0.4, 0.6, 0.8, 1.0];
const T_WALK = [0, 0.05, 0.1, 0.15, 0.17, 0.2, 0.24, 0.34, 0.4, 0.48, 0.58, 0.6, 0.67, 0.75,
                0.8, 0.82, 0.88, 0.93, 1.0];
{
  const missing = T_REQUIRED.filter(t => !T_WALK.some(w => Math.abs(w - t) < 1e-9));
  if (missing.length) {
    console.error('render-' + NAME + ': T_WALK does not cover the required grid, missing ' +
                  JSON.stringify(missing) + ' — see REVIEW-TASK-PROMPT section 2');
    process.exit(3);
  }
}

const pinned = r => /@-?\d*\.?\d+(?=$|\+)/.test(r);
const withT = (ref, t) => {
  const plus = ref.indexOf('+');
  return plus >= 0 ? ref.slice(0, plus) + '@' + t + ref.slice(plus) : ref + '@' + t;
};
/* ── 5 · the refs, at the t of every beat that shows them ─────────────────────────────────── */
const REFS = [];
for (const s of scene.structures) {
  const ref = s.refs && s.refs.procedural; if (!ref) continue;
  const bs = beats.filter(b => b.shown.includes(s.key));
  if (!bs.length) { REFS.push({ key: s.key, ref, why: 'shown in no beat' }); continue; }
  for (const b of bs) {
    const at = (pinned(ref) || b.t == null) ? ref : withT(ref, b.t);
    REFS.push({ key: s.key, ref: at, beat: b.beat, why: 'at its own beat t' });
  }
}
/* ── 6 · the mount: every unpinned ref at t = 1, every pinned ref at its pin ──────────────── */
const MOUNT_REFS = [];
for (const s of scene.structures) {
  const ref = s.refs && s.refs.procedural; if (!ref) continue;
  if (pinned(ref)) { MOUNT_REFS.push({ key: s.key, ref, why: 'pinned — resolved at its pin' }); continue; }
  MOUNT_REFS.push({ key: s.key, ref: withT(ref, 1), why: 'UNPINNED, AT THE MOUNT t' });
}
/* and, for information only, where each unpinned part is empty across the walk */
const STAGE_REFS = [];
for (const s of scene.structures) {
  const ref = s.refs && s.refs.procedural; if (!ref || pinned(ref)) continue;
  for (const t of T_WALK) STAGE_REFS.push({ key: s.key, ref: withT(ref, t), t });
}

const browser = await chromium.launch({
  executablePath: findChromium(),
  args: ['--use-gl=swiftshader', '--enable-unsafe-swiftshader', '--no-sandbox'],
});
const page = await browser.newPage({ viewport: { width: 1000, height: 1000 } });
const DRIVER_NOISE = /GL Driver Message \(OpenGL, Performance/;
const consoleEvents = []; let driverNoise = 0;
page.on('console', m => {
  if (m.type() !== 'error' && m.type() !== 'warning') return;
  if (DRIVER_NOISE.test(m.text())) { driverNoise++; return; }
  consoleEvents.push(m.type() + ': ' + m.text());
});
page.on('pageerror', e => consoleEvents.push('pageerror: ' + e.message));

await page.setContent('<style>html,body{margin:0;background:#101418}</style><canvas id="c" width="1000" height="1000"></canvas>');
await page.addScriptTag({ url: BASE + 'viz-training/spike/three.min.js' });
await page.addScriptTag({ url: BASE + 'models3d/render-kit.js' });
/* implantation.js is loaded because acceptance row N measures OUR two inherited radii against ITS
   built syncytiotrophoblast rather than against a constant copied out of it. */
await page.addScriptTag({ url: BASE + 'models3d/implantation.js' });
await page.addScriptTag({ url: BASE + 'models3d/' + NAME + '.js' });

await page.evaluate(() => {
  const K = window.VizKit;
  window.__renderer = K.configureRenderer(new THREE.WebGLRenderer({
    canvas: document.getElementById('c'), antialias: true }));
  window.__renderer.setClearColor(K.bg(0x101418), 1);
  window.__scene = new THREE.Scene();
  K.standardLights(window.__scene);
  window.__camera = new THREE.PerspectiveCamera(34, 1, 0.05, 4000);
  window.__clear = () => { const sc = window.__scene;
    for (let i = sc.children.length - 1; i >= 0; i--)
      if (sc.children[i].type === 'Group') sc.remove(sc.children[i]); };
});

/* ── 1 + 3 + 11 · the stage walk, the normals, the ray cast and watertightness ────────────── */
const CAMS = [[0, 0, 1], [1, 0.3, 0.6], [-0.8, 0.5, 0.4], [0, 1, 0.15], [0.4, -0.7, 0.5]];
const frames = [];
for (const t of T_WALK) {
  const r = await page.evaluate(({ t, CAMS, NAME }) => {
    const T = THREE, K = window.VizKit, M = window.MB3D_MODELS[NAME];
    window.__clear();
    const g = M.build(t, Object.assign({}, M.FULL));
    window.__scene.add(g);
    const S = M.keyStats(g);
    const rows = [];
    let wTot = 0, wAgree = 0, worstQ = Infinity, worstKey = null, unpaired = 0, unpairedKeys = [];
    const q = x => Math.round(x * 1e4) / 1e4;
    for (const k in S) {
      wTot += S[k].windTot; wAgree += S[k].windTot * S[k].windAgree;
      /* THE VOLUMES ARE TAKEN ABOUT THE PART'S OWN CENTRE, NOT ABOUT THE WORLD ORIGIN, and that is
         not a detail. A triangle's signed volume about a point scales with its distance from it, so
         for a part placed far from the origin every |v| is enormous while the SUM is still only the
         part's own volume — the facet-quanta ratio collapses and reports an inside-out solid that is
         nothing of the kind. Measured here: the yolk sac remnant sits about 1,100 units out along
         the cord and came back at 7.6 quanta against a floor of 10, with winding 1.000000, zero
         unpaired edges and a positive volume. implantation.js's harness subtracts the key's bounding
         box centre for exactly this reason; this file did not, and the floor caught the omission. */
      const c = S[k].bb.getCenter(new T.Vector3());
      let abs = 0, sgn = 0, n = 0;
      for (const tri of S[k].allT) {
        const a = tri[0].clone().sub(c), b = tri[1].clone().sub(c), d = tri[2].clone().sub(c);
        const v = a.dot(new T.Vector3().crossVectors(b, d)) / 6;
        sgn += v; abs += Math.abs(v); n++;
      }
      const scale = Math.max(1e-9, Math.abs(abs));
      const negligible = Math.abs(sgn) < 1e-6 * scale;
      const quanta = negligible ? null : sgn / (abs / n);
      if (quanta != null && quanta < worstQ) { worstQ = quanta; worstKey = k; }
      if (negligible && sgn < -1e-9 * scale) rows.push({ key: k, INSIDE_OUT: sgn });
      /* 11 · every edge shared by exactly two triangles, in opposite directions */
      const map = new Map();
      for (const tri of S[k].allT) {
        const v = tri.map(p => q(p.x) + ',' + q(p.y) + ',' + q(p.z));
        for (let j = 0; j < 3; j++) {
          const a = v[j], b = v[(j + 1) % 3], kr = b + '|' + a;
          if (map.get(kr)) { map.set(kr, map.get(kr) - 1); if (!map.get(kr)) map.delete(kr); }
          else map.set(a + '|' + b, (map.get(a + '|' + b) || 0) + 1);
        }
      }
      let u = 0; for (const c of map.values()) u += c;
      if (u) { unpaired += u; unpairedKeys.push(k + ':' + u); }
      rows.push({ key: k, verts: S[k].verts, wind: S[k].windAgree, quanta, unpaired: u });
    }
    const ray = new T.Raycaster();
    const meshes = [];
    g.traverse(o => { if (o.isMesh && !(o.userData && o.userData.outline)) meshes.push(o); });
    const box = new T.Box3().setFromObject(g);
    const ctr = box.getCenter(new T.Vector3()), size = box.getSize(new T.Vector3());
    const rad = size.length();
    let away = 0, hits = 0;
    for (const c of CAMS) {
      const dir = new T.Vector3(c[0], c[1], c[2]).normalize();
      const eye = ctr.clone().addScaledVector(dir, rad * 1.6);
      const u = new T.Vector3(0, 1, 0).cross(dir).normalize();
      if (u.lengthSq() < 1e-6) u.set(1, 0, 0);
      const v = dir.clone().cross(u).normalize();
      for (let i = -7; i <= 7; i++) for (let j = -7; j <= 7; j++) {
        const o = eye.clone().addScaledVector(u, (i / 7) * rad * 0.42)
                             .addScaledVector(v, (j / 7) * rad * 0.42);
        ray.set(o, dir.clone().negate());
        const h = ray.intersectObjects(meshes, false);
        if (!h.length || !h[0].face) continue;
        hits++;
        const nrm = h[0].face.normal.clone().applyMatrix3(
          new T.Matrix3().getNormalMatrix(h[0].object.matrixWorld)).normalize();
        if (nrm.dot(dir) < 0) away++;
      }
    }
    K.fitCamera(window.__camera, g, 1.06);
    const d = new T.Vector3(0.45, 0.35, 1).normalize();
    window.__camera.position.copy(ctr).addScaledVector(d, rad * 1.35);
    window.__camera.lookAt(ctr);
    window.__renderer.render(window.__scene, window.__camera);
    return { t, day: g.userData.state.day, rows, windAgree: wTot ? wAgree / wTot : 1, worstQ, worstKey,
             unpaired, unpairedKeys, rayHits: hits, rayAway: away, parts: Object.keys(S).length,
             worldSpan: Math.max(size.x, size.y, size.z),
             tris: Math.round(rows.reduce((a, r) => a + (r.verts || 0), 0) / 3) };
  }, { t, CAMS, NAME });
  frames.push(r);
  const buf = await page.locator('#c').screenshot();
  writeFileSync(path.join(OUT, 'walk_t' + String(t).replace('.', 'p') + '.png'), buf);
}
/* the two section compositions get a frame each as well */
for (const [flag, tag] of [['cut', 'section_median_day13'], ['cutz', 'section_transverse_day28']]) {
  await page.evaluate(({ flag, NAME }) => {
    const T = THREE, K = window.VizKit, M = window.MB3D_MODELS[NAME];
    window.__clear();
    const o = Object.assign({}, M.FULL); o[flag] = true;
    const g = M.build(M.tOfDay(flag === 'cut' ? 13 : 28), o);
    window.__scene.add(g);
    const box = new T.Box3().setFromObject(g);
    const ctr = box.getCenter(new T.Vector3()), rad = box.getSize(new T.Vector3()).length();
    K.fitCamera(window.__camera, g, 1.06);
    const d = flag === 'cut' ? new T.Vector3(1, 0.12, 0.10) : new T.Vector3(0.10, 0.12, 1);
    window.__camera.position.copy(ctr).addScaledVector(d.normalize(), rad * 1.3);
    window.__camera.lookAt(ctr);
    window.__renderer.render(window.__scene, window.__camera);
  }, { flag, NAME });
  writeFileSync(path.join(OUT, tag + '.png'), await page.locator('#c').screenshot());
}

/* ── 5 + 6 · the adapter ──────────────────────────────────────────────────────────────────── */
await page.addScriptTag({ url: BASE + 'config.js' }).catch(() => {});
await page.evaluate((base) => {
  window.MEDBANK_CONFIG = window.MEDBANK_CONFIG || {};
  window.MEDBANK_CONFIG.MODEL_BASE = base + 'models3d/';
}, BASE);
await page.addScriptTag({ url: BASE + 'viz3d.js' });
await page.evaluate((base) => { window.MEDBANK_CONFIG.MODEL_BASE = base + 'models3d/'; }, BASE);
async function resolveAll(list) {
  return page.evaluate(async (L) => {
    const ad = window.MB3D && window.MB3D.adapters && window.MB3D.adapters.procedural;
    if (!ad) return { fatal: 'viz3d exposes no procedural adapter' };
    const bad = [], ok = [];
    for (const r of L) {
      const res = await ad.load(window.THREE, { key: r.key, refs: { procedural: r.ref } });
      const n = res && res.mesh && res.mesh.geometry
        ? res.mesh.geometry.attributes.position.count : 0;
      if (!n) bad.push({ key: r.key, ref: r.ref, reason: (res && res.reason) || 'no mesh', why: r.why, t: r.t });
      else ok.push({ key: r.key, ref: r.ref, verts: n, t: r.t });
    }
    return { ok: ok.length, bad, okList: ok };
  }, list);
}
const beatRefs = await resolveAll(REFS);
const mountRefs = await resolveAll(MOUNT_REFS);
const stageRefs = await resolveAll(STAGE_REFS);

/* ── 7 · perturbation ─────────────────────────────────────────────────────────────────────── */
const perturb = await page.evaluate((NAME) => {
  const M = window.MB3D_MODELS[NAME];
  const before = { grid: M.grid(), cystR: M.cystSolve().r, residual: M.cystSolve().residual };
  M.setGrid(34, 60, 22, 30);
  const after = { grid: M.grid(), cystR: M.cystSolve().r, residual: M.cystSolve().residual };
  M.setGrid(before.grid.PH_N, before.grid.TH_N, before.grid.PH_S, before.grid.TH_S);
  const restored = { grid: M.grid(), cystR: M.cystSolve().r };
  return { before, after, restored,
           moved: Math.abs(after.cystR - before.cystR) / before.cystR,
           restoredOK: Math.abs(restored.cystR - before.cystR) < 1e-12 };
}, NAME);

/* ── 8 · the battery ──────────────────────────────────────────────────────────────────────── */
const battery = await page.evaluate((NAME) => {
  const M = window.MB3D_MODELS[NAME];
  const A = M.acceptance(), N = M.negatives();
  return { allPass: A.allPass, pass: A.pass, measured: A.measured, negatives: N,
           fit: M.AMN_FIT, cyst: M.cystSolve() };
}, NAME);

/* ── 10 · the scene's clock is the model's clock ──────────────────────────────────────────── */
const clock = await page.evaluate(({ beats, NAME }) => {
  const M = window.MB3D_MODELS[NAME];
  const bad = [];
  for (const b of beats) {
    if (b.t == null) continue;
    const day = M.dayAt(b.t);
    const back = M.tOfDay(day);
    if (Math.abs(back - b.t) > 1e-9) bad.push({ beat: b.beat, t: b.t, day, back });
  }
  return { checked: beats.filter(b => b.t != null).length, bad };
}, { beats, NAME });

await browser.close(); server.close();

/* ── 9 · verbatim ─────────────────────────────────────────────────────────────────────────── */
let verbatim = { checked: false };
if (ORIGINAL && existsSync(ORIGINAL)) {
  const old = JSON.parse(readFileSync(ORIGINAL, 'utf8'));
  const blob = JSON.stringify(scene);
  const missing = [];
  for (const s of old.structures) if (!blob.includes(s.narration)) missing.push('structure ' + s.key);
  for (const v of old.views) if (!blob.includes(v.narration)) missing.push('view beat ' + v.beat);
  verbatim = { checked: true, total: old.structures.length + old.views.length, missing };
}

/* ── the report ───────────────────────────────────────────────────────────────────────────── */
const windOK = frames.every(f => f.windAgree >= 1 - 1e-12);
const QUANTA_FLOOR = 10;
const quantaOK = frames.every(f => f.worstQ >= QUANTA_FLOOR) &&
                 !frames.some(f => f.rows.some(r => r.INSIDE_OUT !== undefined));
const tightOK = frames.every(f => f.unpaired === 0);
const rayOK = frames.every(f => f.rayAway === 0);
const consoleOK = consoleEvents.length === 0;
const refsOK = !beatRefs.fatal && beatRefs.bad.length === 0;
const mountOK = !mountRefs.fatal && mountRefs.bad.length === 0;
const perturbOK = perturb.moved > 1e-4 && perturb.restoredOK;
const clockOK = clock.bad.length === 0;
const verbOK = !verbatim.checked || verbatim.missing.length === 0;

console.log('MedBank · amniotic-cavity-yolk-sac proof');
console.log('  substrate: headless chromium ' + (findChromium() || '(default)') + ', swiftshader');
console.log('  frames:    ' + OUT + '/walk_t*.png  (player frames: ' + OUT + '/player/)');
console.log('');
console.log('1  IT RENDERS        ' + frames.length + ' stage frames + 2 section frames, ' +
            frames[frames.length - 1].parts + ' parts, ' + frames[frames.length - 1].tris +
            ' triangles at t=1');
console.log('   drawn extent      ' + Math.min(...frames.map(f => f.worldSpan)).toFixed(1) + ' to ' +
            Math.max(...frames.map(f => f.worldSpan)).toFixed(1) +
            ' world units over the walk (viz3d\'s camera far plane is 4000)');
console.log('2  CONSOLE CLEAN     ' + (consoleOK ? 'yes' : 'NO — ' + consoleEvents.length + ' events') +
            '   (swiftshader perf chatter excluded by exact pattern, ' + driverNoise + ' seen)');
if (!consoleOK) consoleEvents.slice(0, 12).forEach(e => console.log('     ' + e));
console.log('3  NORMALS           face-vs-vertex agreement ' +
            Math.min(...frames.map(f => f.windAgree)).toFixed(12) + ' (min over the walk) ' +
            (windOK ? 'OK' : 'FAIL'));
{
  const w = frames.reduce((a, f) => (f.worstQ < a.worstQ ? f : a), frames[0]);
  console.log('                     worst enclosed volume ' + w.worstQ.toFixed(1) + ' facet quanta (' +
              w.worstKey + ' at t=' + w.t + ') ' + (quantaOK ? 'OK' : 'FAIL') + ' (floor ' + QUANTA_FLOOR + ')');
}
console.log('                     ray cast, 5 cameras x 225 rays per t: ' +
            frames.reduce((a, f) => a + f.rayAway, 0) + ' first hits facing away of ' +
            frames.reduce((a, f) => a + f.rayHits, 0) + ' ' + (rayOK ? 'OK' : 'FAIL'));
console.log('11 WATERTIGHT        ' + frames.reduce((a, f) => a + f.unpaired, 0) +
            ' unpaired edges over ' + frames.reduce((a, f) => a + f.tris, 0) + ' triangles ' +
            (tightOK ? 'OK' : 'FAIL'));
if (!tightOK) frames.filter(f => f.unpaired).forEach(f =>
  console.log('     t=' + f.t + ' ' + f.unpairedKeys.join(' ')));
console.log('4  LOOKS LIKE IT     a human has to do this one — see BUILD-LOG.md');
console.log('5  ADAPTER, PER BEAT ' + beatRefs.ok + ' refs resolved with geometry, ' +
            (beatRefs.bad || []).length + ' failed ' + (refsOK ? 'OK' : 'FAIL'));
(beatRefs.bad || []).forEach(b => console.log('     ' + b.key + ' ' + b.ref + ' -> ' + b.reason));
console.log('6  ADAPTER, AT MOUNT ' + mountRefs.ok + ' resolutions (every unpinned ref at t=1, every ' +
            'pinned ref at its pin), ' + (mountRefs.bad || []).length + ' failed ' + (mountOK ? 'OK' : 'FAIL'));
(mountRefs.bad || []).forEach(b => console.log('     ' + b.key + ' ' + b.ref + ' -> ' + b.reason + '  [' + b.why + ']'));
{
  const empty = {};
  (stageRefs.bad || []).forEach(b => { (empty[b.key] = empty[b.key] || []).push(b.ref.split('@')[1]); });
  const names = Object.keys(empty);
  console.log('   stage limits      ' + (names.length
    ? names.map(k => k + ' empty at t ' + empty[k].join(',')).join('; ')
    : 'every unpinned part builds at every walk t'));
  console.log('                     (reported, not failed — see this file\'s header, check 6)');
}
console.log('7  PERTURBATION      grid ' + JSON.stringify(perturb.before.grid) + ' -> ' +
            JSON.stringify(perturb.after.grid) + ': solved cyst radius ' +
            perturb.before.cystR.toFixed(6) + ' -> ' + perturb.after.cystR.toFixed(6) +
            ' (' + (perturb.moved * 100).toFixed(3) + '% move) ' + (perturbOK ? 'OK' : 'FAIL'));
console.log('8  BATTERY           ' + (battery.allPass ? 'all rows pass' : 'ROWS FAILED: ' +
            Object.keys(battery.pass).filter(k => battery.pass[k] === false).join(', ')) +
            '; negatives all rejected: ' + battery.negatives.allRejected +
            ' (' + battery.negatives.count + ' cases)');
console.log('   the solve         amniotic fraction law p=' + battery.fit.p.toFixed(4) +
            ', obliteration day ' + battery.fit.D_OBL.toFixed(2) + ' = post-fertilisation week ' +
            (battery.fit.D_OBL / 7).toFixed(2) + ', fit rms ' + battery.fit.rms.toFixed(5));
console.log('   held out          day-35 ratio predicted ' + battery.fit.predicted35.toFixed(4) +
            ' against a published 0.3478 the fit never saw');
console.log('9  VERBATIM          ' + (verbatim.checked
            ? (verbatim.total - verbatim.missing.length) + ' of ' + verbatim.total +
              ' SVG-era narrations present byte for byte' + (verbatim.missing.length ? ' — MISSING ' + verbatim.missing.join(', ') : '')
            : 'not checked (set AYC_ORIGINAL to the pre-conversion scene)'));
console.log('10 CLOCK             ' + clock.checked + ' beats; the scene\'s t and the model\'s ' +
            'tOfDay() agree to 1e-9 ' + (clockOK ? 'OK' : 'FAIL ' + JSON.stringify(clock.bad)));

const allOK = windOK && quantaOK && tightOK && rayOK && consoleOK && refsOK && mountOK &&
              perturbOK && clockOK && battery.allPass && battery.negatives.allRejected && verbOK;
writeFileSync(path.join(OUT, 'proof.json'), JSON.stringify(
  { frames, consoleEvents, driverNoise, beatRefs, mountRefs, stageRefs, battery, verbatim, perturb,
    clock, allOK }, null, 1));
console.log('\n' + (allOK ? 'ALL CHECKS PASS' : 'PROOF FAILED'));
process.exit(allOK ? 0 : 1);
