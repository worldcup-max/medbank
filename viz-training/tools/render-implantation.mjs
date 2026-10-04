/* MedBank · headless proof for models3d/implantation.js
 *
 *   node viz-training/tools/render-implantation.mjs
 *
 * The five checks BUILD-TASK-PROMPT section 3 requires, plus four this item needs of its own:
 *
 *   1. IT RENDERS — a stage walk written to viz-training/models-out/implantation/. The ten PLAYER
 *      frames, which are the pictures a student actually looks at, are written by
 *      measure-scene-visibility.mjs into .../implantation/player/ and are not duplicated here.
 *   2. THE CONSOLE IS CLEAN — no error, no warning, no throw, with ONE named and counted exclusion
 *      (swiftshader's own performance chatter on a machine with no GPU). An exact pattern, not a
 *      threshold: RENDER-STANDARD records that a warning which is a known false alarm trains every
 *      future run to ignore the channel it prints on, and it cost an unrelated item its console check.
 *   3a. THE FACET-QUANTA FLOOR IS 10 HERE AND 20 IN THE MODEL'S OWN ROW B, and the difference is the
 *      sample set rather than a softer standard. Row B measures days 6, 9 and 13; this walk measures
 *      sixteen t, and it therefore catches a transient part in its FIRST INSTANTS, which is the
 *      thinnest that part is ever drawn — the lacunar band at t = 0.3, a day after the first vacuoles
 *      appear, comes in at 13.0 quanta where the same band at day 13 is over 50. The floor's argument
 *      is unchanged: one reversed triangle moves the signed sum by about one quantum, so a part whose
 *      sign would survive ten reversed triangles out of ten thousand facets has not got that sign by
 *      accident. A part with no volume to speak of at all is reported and not scored, but is still
 *      required not to be negative.
 *   3. NORMALS POINT OUTWARD — three shape-independent measures, because a centroid count is NOT
 *      valid on this model: most of its parts are SHELLS, whose inner surface points inward by
 *      construction, and a radial count on the trophoblast would read ~50% with nothing wrong. What
 *      is measured is (a) every triangle's FACE normal, from its vertex ORDER, against the vertex
 *      normals supplied with it — RENDER-STANDARD 2.1's actual invariant, valid on any shape;
 *      (b) each part's enclosed signed volume, positive exactly when it is wound outward, floored in
 *      its own facet quanta; and (c) 2.4b's RAY CAST from five cameras, which is what decides it.
 *   4. IT LOOKS LIKE THE THING — the renders are for a human; this file cannot do it. The build run
 *      records in BUILD-LOG.md which frames it opened and what it changed as a result.
 *   5. EVERY REF RESOLVES THROUGH THE REAL ADAPTER in viz3d.js, with geometry — and this model's
 *      version of that check is STRONGER than the corpus standard, deliberately. See below.
 *
 *   6. THE t=1 MOUNT CHECK, WHICH IS THE ONE THIS ITEM EXISTS TO NOT FAIL. Filed the same morning as
 *      engine__procedural-ref-default-t: viz3d resolves an UNPINNED ref at t = 1 at mount, and a
 *      structure absent at t = 1 returns reason:'none' and is NEVER retried, so the player tells the
 *      student "no 3D model of this structure yet" about a structure the model builds. On the
 *      notochord that silently removed three of the four stages its scene teaches, and no existing
 *      check could see it, because the adapter-resolution pass asks at each beat's own t — which is
 *      the one path that works. So this file asks TWICE: every unpinned ref at t = 1 AND at all
 *      sixteen t of the stage walk, and every pinned ref at its own pin. Proposed for
 *      RENDER-STANDARD section 3.x in BUILD-LOG.md.
 *   7. THE SOLVED PARAMETERS ARE PERTURBED — AND AS OF 2026-10-03 THIS IS TRUE. "Change the constant
 *      the geometry uses and the reported number must move. If it does not, the test is not
 *      measuring the model." FIVE inputs are moved — the growth law, the lysed fraction, THE
 *      TESSELLATION ITSELF, the declared villus cover and the arterial mouth — by evaluating a
 *      second copy of the model's own source with one constant changed and its registry key renamed,
 *      and each row names both the measures that must move and the measures that must NOT. The grid
 *      one matters most: every volume here is the volume of the triangulated surface rather than of
 *      the smooth one, and the bulge amplitude is solved by bisection against an integral over that
 *      grid, so if moving the grid does not move the amplitude then the solve is not reading the
 *      geometry. BEFORE THIS DATE THIS CHECK DID NOTHING AT ALL: it read four values once at the
 *      unperturbed state, changed no constant, compared nothing, printed nothing, and was not in the
 *      allOK conjunction — review finding F2, and the code at section 7 carries the full account.
 *   8. THE MODEL'S OWN BATTERY AND ITS NEGATIVE CASES ARE RUN AND PRINTED, because build() asserts
 *      only the cheap half.
 *   9. "CARRIED ACROSS VERBATIM" IS RE-ASSERTED, NOT PROMISED. The scene was generated from the
 *      SVG-era file by a script; this re-checks that all 23 of that file's narrations appear in the
 *      converted scene byte for byte, against the original kept at the path below. A note in a file
 *      is a claim, including this one.
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
const OUT = 'viz-training/models-out/implantation';
mkdirSync(OUT, { recursive: true });
/* The pre-conversion scene is kept in the repo so check 9 can be re-run by anyone, including the
   review task. Without it "carried across verbatim" would be a sentence in a file rather than a
   check — RENDER-STANDARD section 6, applied to this run's own central claim. */
const ORIGINAL = process.env.IMPLANTATION_ORIGINAL || 'viz-training/_implantation-preconversion.json';

function findChromium() {
  if (process.env.CHROMIUM_PATH) return process.env.CHROMIUM_PATH;
  const base = '/opt/pw-browsers';
  if (existsSync(base)) for (const d of readdirSync(base))
    for (const rel of ['chrome-linux/chrome', 'chrome-linux/headless_shell']) {
      const p = path.join(base, d, rel); if (existsSync(p)) return p;
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

const fmt = v => (v == null ? 'null' : (typeof v === 'number' ? (Math.abs(v) >= 1000 ? v.toFixed(0) : v.toFixed(4)) : String(v)));

const SCENE = 'viz-training/scenes/embryology__weeks-1-2-implantation-bilaminar-disc__implantation.json';
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
const T_WALK = [0, 0.0714, 0.142857, 0.2, 0.257143, 0.3, 0.371429, 0.4, 0.45, 0.514286,
                0.6, 0.7143, 0.8, 0.857143, 0.93, 1.0];
{
  const missing = T_REQUIRED.filter(t => !T_WALK.some(w => Math.abs(w - t) < 1e-9));
  if (missing.length) {
    console.error('render-implantation: T_WALK does not cover the required grid, missing ' +
                  JSON.stringify(missing) + ' — see REVIEW-TASK-PROMPT section 2');
    process.exit(3);
  }
}

/* THE REFS. Three passes, and the second is the one that matters (header, check 6). */
const REFS = [];
const pinned = r => /@-?\d*\.?\d+(?=$|\+)/.test(r);
for (const s of scene.structures) {
  const ref = s.refs && s.refs.procedural; if (!ref) continue;
  const bs = beats.filter(b => b.shown.includes(s.key));
  if (!bs.length) { REFS.push({ key: s.key, ref, why: 'shown in no beat' }); continue; }
  for (const b of bs) {
    const plus = ref.indexOf('+');
    const at = (pinned(ref) || b.t == null) ? ref
      : (plus >= 0 ? ref.slice(0, plus) + '@' + b.t + ref.slice(plus) : ref + '@' + b.t);
    REFS.push({ key: s.key, ref: at, beat: b.beat, why: 'at its own beat t' });
  }
}
const MOUNT_REFS = [];
for (const s of scene.structures) {
  const ref = s.refs && s.refs.procedural; if (!ref) continue;
  if (pinned(ref)) { MOUNT_REFS.push({ key: s.key, ref, why: 'pinned — resolved at its pin' }); continue; }
  const plus = ref.indexOf('+');
  for (const t of T_WALK.concat([1])) {
    const at = plus >= 0 ? ref.slice(0, plus) + '@' + t + ref.slice(plus) : ref + '@' + t;
    MOUNT_REFS.push({ key: s.key, ref: at, why: t === 1 ? 'UNPINNED, AT THE MOUNT t' : 'unpinned, walk t' });
  }
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

/* MODEL_BASE MUST BE ABSOLUTE HERE. viz3d's procedural adapter resolves a model to
   MEDBANK_CONFIG.MODEL_BASE + '<name>.js', which defaults to './models3d/' — and this page is built
   with setContent, so its base URL is about:blank and every single ref came back reason:'failed'
   with "could not load ./models3d/implantation.js". That is the adapter working correctly against a
   harness that had not told it where the repo is, and it is worth recording because the failure
   LOOKS like a model fault: 529 console warnings and every ref dead, from one missing line. */
await page.setContent('<style>html,body{margin:0;background:#101418}</style><canvas id="c" width="1000" height="1000"></canvas>');

await page.addScriptTag({ url: BASE + 'viz-training/spike/three.min.js' });
await page.addScriptTag({ url: BASE + 'models3d/render-kit.js' });
/* blastocyst is loaded because acceptance row N measures OUR day-6 radius against ITS built
   trophoblast rather than against a constant copied out of it. */
await page.addScriptTag({ url: BASE + 'models3d/blastocyst.js' });
await page.addScriptTag({ url: BASE + 'models3d/implantation.js' });

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

/* ── 1 + 3 · the stage walk, the normals and the ray cast ─────────────────────────────────── */
const CAMS = [[0, 0, 1], [1, 0.3, 0.6], [-0.8, 0.5, 0.4], [0, 1, 0.15], [0.4, -0.7, 0.5]];
const frames = [];
for (const t of T_WALK) {
  const r = await page.evaluate(({ t, CAMS }) => {
    const T = THREE, K = window.VizKit, M = window.MB3D_MODELS['implantation'];
    window.__clear();
    const g = M.build(t, Object.assign({}, M.FULL));
    window.__scene.add(g);
    const S = M.keyStats(g);
    const rows = [];
    let wTot = 0, wAgree = 0, worstQ = Infinity, worstKey = null;
    for (const k in S) {
      wTot += S[k].windTot; wAgree += S[k].windTot * S[k].windAgree;
      const c = S[k].bb.getCenter(new T.Vector3());
      let abs = 0, sgn = 0, n = 0;
      for (const q of S[k].allT) {
        const a = q[0].clone().sub(c), b = q[1].clone().sub(c), d = q[2].clone().sub(c);
        const v = a.dot(new T.Vector3().crossVectors(b, d)) / 6; sgn += v; abs += Math.abs(v); n++;
      }
      /* A PART WITH NO VOLUME TO SPEAK OF IS REPORTED, NOT SCORED — but it is still required not to be
         INSIDE OUT. The decidua capsularis at day 7.8 is a one-cell-wide annulus at the rim of the
         conceptus's footprint, the first sliver of roof as the embryo sinks past the surface, and its
         enclosed volume is -0.0: a degenerate solid whose own rim walls cancel it. Scoring that in facet
         quanta says nothing about winding, so it is excluded by its VOLUME rather than by its facet count
         (the first guard counted facets, and this part has 2,000 of them). What is still asserted is the
         sign: a tiny part may be negligible, it may not be negative. */
      const scale = Math.max(1e-9, Math.abs(abs));
      const negligible = Math.abs(sgn) < 1e-6 * scale;
      const quanta = negligible ? null : sgn / (abs / n);
      if (quanta != null && quanta < worstQ) { worstQ = quanta; worstKey = k; }
      if (negligible) { rows.push({ key: k, verts: S[k].verts, negligibleVol: sgn });
                        if (sgn < -1e-9 * scale) rows.push({ key: k, INSIDE_OUT: sgn }); }
      rows.push({ key: k, verts: S[k].verts, wind: S[k].windAgree, quanta });
    }
    /* 2.4b's ray cast: from each camera, how many FIRST hits face away from it. Zero on closed solids. */
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
    return { t, rows, windAgree: wTot ? wAgree / wTot : 1, worstQ, worstKey,
             rayHits: hits, rayAway: away, parts: Object.keys(S).length,
             tris: Math.round(rows.reduce((a, r) => a + r.verts, 0) / 3) };
  }, { t, CAMS });
  frames.push(r);
  const buf = await page.locator('#c').screenshot();
  writeFileSync(path.join(OUT, 'walk_t' + String(t).replace('.', 'p') + '.png'), buf);
}

/* ── 5 + 6 · the adapter, twice ───────────────────────────────────────────────────────────── */
await page.addScriptTag({ url: BASE + 'config.js' }).catch(() => {});
/* MODEL_BASE IS SET AFTER config.js, NOT BEFORE IT. viz3d's procedural adapter resolves a model to
   MEDBANK_CONFIG.MODEL_BASE + '<name>.js', which defaults to './models3d/' — and this page is built with
   setContent, so its base URL is about:blank. Setting it before config.js is useless because config.js
   assigns MEDBANK_CONFIG wholesale and takes the override with it; the first version of this harness did
   exactly that and reported all 95 refs dead with "could not load ./models3d/implantation.js", which reads
   like a model fault and is a harness one. */
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
      if (!n) bad.push({ key: r.key, ref: r.ref, reason: (res && res.reason) || 'no mesh', why: r.why });
      else ok.push({ key: r.key, ref: r.ref, verts: n });
    }
    return { ok: ok.length, bad };
  }, list);
}
const beatRefs = await resolveAll(REFS);
const mountRefs = await resolveAll(MOUNT_REFS);

/* ── 7 · perturbation ─────────────────────────────────────────────────────────────────────── */
/* REWRITTEN 2026-10-03 FROM REVIEW FINDING F2, AND THE OLD VERSION IS WORTH A PARAGRAPH BECAUSE IT
   PASSED. The header above has claimed since this file was written that "the solved parameters are
   perturbed ... three inputs are moved — the growth law, the lysed fraction, and THE TESSELLATION
   ITSELF — and the dependent measures must change", and called the grid one the one that matters
   most. What the code did was read M.constants.SINK_RATE, M.solveBulge(1).A and two wallIntegrals
   calls ONCE, at the unperturbed state. It changed no constant. It compared nothing against
   anything. It printed no line in the report. And `perturb` was not in the `allOK` conjunction, so
   the harness printed ALL CHECKS PASS with its own guard against RENDER-STANDARD section 3's "the
   measured side must be a function of the built geometry" doing nothing whatever. A check that
   cannot fail is not evidence however carefully its header is written — and this one did not even
   have a threshold to be careless with.

   HOW IT PERTURBS. The model is an IIFE whose only escape is its registration, so a SECOND copy of
   the same source with one constant changed and the registry key renamed can be evaluated in the
   same page and interrogated side by side. That is the method the review run used to establish that
   the model itself was fine, and it is the method here: nothing is mocked, nothing is re-implemented,
   and the perturbed model is the real model with one number different. Each row below names the
   constant it moves, the measures that must move with it, and the measures that must NOT — because
   "something changed" is a weaker claim than "the right things changed and the wrong things did
   not", and the growth-law row is the one that would catch a depth prediction quietly hard-wired. */
const MODEL_SRC = readFileSync('models3d/implantation.js', 'utf8');

const PERTURBATIONS = [
  { id: 'LYS_FRAC', what: 'the lysed fraction 0.62 -> 0.50',
    find: 'const LYS_FRAC = 0.62;', repl: 'const LYS_FRAC = 0.50;',
    must: ['bulgeA', 'capsularisUm'], mustNot: ['sinkRate', 'triCount'] },
  { id: 'NR', what: 'THE TESSELLATION: the wall grid NR 22 -> 11',
    find: 'const NR  = 22, NTW = 48;', repl: 'const NR  = 11, NTW = 48;',
    must: ['bulgeA', 'triCount'], mustNot: ['sinkRate'] },
  { id: 'R_DAY13', what: 'the growth law R_DAY13 50.00 -> 40.00',
    find: 'const R_DAY13 = 50.00;', repl: 'const R_DAY13 = 40.00;',
    must: ['sinkRate', 'frontDepthDay13', 'bulgeA'], mustNot: [] },
  { id: 'VIL_COVER', what: 'the declared villus cover 0.25 -> 0.40',
    find: 'const VIL_COVER = 0.25;', repl: 'const VIL_COVER = 0.40;',
    must: ['villiLenUm', 'villiCoverFrac'], mustNot: ['sinkRate', 'bulgeA'] },
  { id: 'VESS_MOUTH_FRAC', what: 'the arterial mouth 0.42 -> 0.25',
    find: 'const VESS_MOUTH_FRAC = 0.42;', repl: 'const VESS_MOUTH_FRAC = 0.25;',
    must: ['mouthRadius'], mustNot: ['sinkRate', 'bulgeA', 'breachPh'] },
];

for (const P of PERTURBATIONS) {
  if (MODEL_SRC.indexOf(P.find) < 0) { P.applied = false; continue; }
  if (MODEL_SRC.split(P.find).length !== 2) { P.applied = false; P.ambiguous = true; continue; }
  P.applied = true;
  const src = MODEL_SRC.replace(P.find, P.repl)
    .replace("window.MB3D_MODELS['implantation'] =", "window.MB3D_MODELS['implantation__" + P.id + "'] =");
  await page.addScriptTag({ content: src });
}

const perturb = await page.evaluate((PS) => {
  /* every measure the rows below read, off the BUILT geometry of whichever copy it is handed */
  function probe(key) {
    const M = window.MB3D_MODELS[key];
    if (!M) return null;
    const g = M.build(1, Object.assign({}, M.FULL));
    const S = M.keyStats(g);
    let tri = 0; for (const k in S) tri += S[k].allT.length;
    const st = M.stateAt(1);
    const br = M.breachSolve ? M.breachSolve(1) : null;
    return {
      sinkRate: M.constants.SINK_RATE,
      bulgeA: M.solveBulge(1).A,
      capsularisUm: st.capsularis * 10,
      frontDepthDay13: st.front,
      triCount: tri,
      villiLenUm: M.builtVilliLenUm ? M.builtVilliLenUm(g, st) : null,
      villiCoverFrac: M.villiCoverFrac ? M.villiCoverFrac(S, st, 1) : null,
      mouthRadius: br ? br.rMouth : null,
      breachPh: br ? br.ph : null,
    };
  }
  const base = probe('implantation');
  const rows = [];
  const REL = 1e-3;              // a move has to be a move, not a rounding wobble
  for (const P of PS) {
    if (!P.applied) { rows.push({ id: P.id, what: P.what, ok: false, why: P.ambiguous ? 'the constant appears more than once in the source' : 'the constant was not found in the source' }); continue; }
    const after = probe('implantation__' + P.id);
    if (!after) { rows.push({ id: P.id, what: P.what, ok: false, why: 'the perturbed copy did not register' }); continue; }
    const rel = n => {
      const a = base[n], b = after[n];
      if (a == null || b == null) return null;
      return Math.abs(b - a) / Math.max(1e-12, Math.abs(a));
    };
    const moved = {}, held = {};
    let ok = true;
    for (const n of P.must) { const r = rel(n); moved[n] = { from: base[n], to: after[n], rel: r }; if (!(r > REL)) ok = false; }
    for (const n of P.mustNot) { const r = rel(n); held[n] = { value: base[n], rel: r }; if (!(r != null && r <= REL)) ok = false; }
    rows.push({ id: P.id, what: P.what, ok, moved, held });
  }
  return { base, rows, allOK: rows.every(r => r.ok) };
}, PERTURBATIONS.map(P => ({ id: P.id, what: P.what, must: P.must, mustNot: P.mustNot, applied: !!P.applied, ambiguous: !!P.ambiguous })));

/* ── 8 · the battery ──────────────────────────────────────────────────────────────────────── */
const battery = await page.evaluate(() => {
  const M = window.MB3D_MODELS['implantation'];
  const A = M.acceptance(), N = M.negatives();
  return { allPass: A.allPass, pass: A.pass, measured: A.measured, negatives: N };
});

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

await browser.close(); server.close();

/* ── the report ───────────────────────────────────────────────────────────────────────────── */
const windOK = frames.every(f => f.windAgree >= 1 - 1e-12);
const QUANTA_FLOOR = 10;   // see the note at check 3 below
const quantaOK = frames.every(f => f.worstQ >= QUANTA_FLOOR) &&
                 !frames.some(f => f.rows.some(r => r.INSIDE_OUT !== undefined));
const rayOK = frames.every(f => f.rayAway === 0);
const consoleOK = consoleEvents.length === 0;
const refsOK = !beatRefs.fatal && beatRefs.bad.length === 0;
const mountOK = !mountRefs.fatal && mountRefs.bad.length === 0;
const verbOK = !verbatim.checked || verbatim.missing.length === 0;
const perturbOK = perturb.allOK;

console.log('MedBank · implantation proof');
console.log('  substrate: headless chromium ' + (findChromium() || '(default)') + ', swiftshader');
console.log('  frames:    ' + OUT + '/walk_t*.png  (player frames: ' + OUT + '/player/)');
console.log('');
console.log('1 IT RENDERS        ' + frames.length + ' stage frames written, ' +
            frames[frames.length - 1].parts + ' parts, ' + frames[frames.length - 1].tris + ' triangles at t=1');
console.log('2 CONSOLE CLEAN     ' + (consoleOK ? 'yes' : 'NO — ' + consoleEvents.length + ' events') +
            '   (swiftshader perf chatter excluded by exact pattern, ' + driverNoise + ' seen)');
if (!consoleOK) consoleEvents.slice(0, 12).forEach(e => console.log('     ' + e));
console.log('3 NORMALS           face-vs-vertex agreement ' +
            Math.min(...frames.map(f => f.windAgree)).toFixed(12) + ' (min over the walk) ' + (windOK ? 'OK' : 'FAIL'));
{
  const w = frames.reduce((a, f) => (f.worstQ < a.worstQ ? f : a), frames[0]);
  console.log('                    worst enclosed volume ' + w.worstQ.toFixed(1) + ' facet quanta (' +
              w.worstKey + ' at t=' + w.t + ') ' + (quantaOK ? 'OK' : 'FAIL') + ' (floor ' + QUANTA_FLOOR + ')');
}
console.log('                    ray cast, 5 cameras x 225 rays per t: ' +
            frames.reduce((a, f) => a + f.rayAway, 0) + ' first hits facing away of ' +
            frames.reduce((a, f) => a + f.rayHits, 0) + ' ' + (rayOK ? 'OK' : 'FAIL'));
console.log('4 LOOKS LIKE IT     a human has to do this one — see BUILD-LOG.md');
console.log('5 ADAPTER, PER BEAT ' + beatRefs.ok + ' refs resolved with geometry, ' +
            (beatRefs.bad || []).length + ' failed ' + (refsOK ? 'OK' : 'FAIL'));
(beatRefs.bad || []).forEach(b => console.log('     ' + b.key + ' ' + b.ref + ' -> ' + b.reason));
console.log('6 ADAPTER, AT MOUNT ' + mountRefs.ok + ' resolutions (every unpinned ref at all ' +
            T_WALK.length + ' walk t AND at t=1; every pinned ref at its pin), ' +
            (mountRefs.bad || []).length + ' failed ' + (mountOK ? 'OK' : 'FAIL'));
(mountRefs.bad || []).forEach(b => console.log('     ' + b.key + ' ' + b.ref + ' -> ' + b.reason + '  [' + b.why + ']'));
console.log('7 PERTURBATION      ' + (perturbOK ? 'all ' + perturb.rows.length + ' perturbations behave'
            : 'FAILED: ' + perturb.rows.filter(r => !r.ok).map(r => r.id).join(', ')));
for (const r of perturb.rows) {
  const mv = Object.keys(r.moved || {}).map(k => k + ' ' + fmt(r.moved[k].from) + ' -> ' + fmt(r.moved[k].to)).join(', ');
  const hl = Object.keys(r.held || {}).map(k => k).join(', ');
  console.log('     ' + (r.ok ? 'ok  ' : 'FAIL') + ' ' + r.id + ': ' + r.what +
              (mv ? '  moved: ' + mv : '') + (hl ? '  held: ' + hl : '') + (r.why ? '  — ' + r.why : ''));
}
console.log('8 BATTERY           ' + (battery.allPass ? 'all rows pass' : 'ROWS FAILED: ' +
            Object.keys(battery.pass).filter(k => !battery.pass[k]).join(', ')) +
            '; negatives all rejected: ' + battery.negatives.allRejected);
console.log('9 VERBATIM          ' + (verbatim.checked
            ? (verbatim.total - verbatim.missing.length) + ' of ' + verbatim.total +
              ' SVG-era narrations present byte for byte' + (verbatim.missing.length ? ' — MISSING ' + verbatim.missing.join(', ') : '')
            : 'not checked (set IMPLANTATION_ORIGINAL to the pre-conversion scene)'));

/* `perturbOK` IS IN THIS CONJUNCTION, which is the other half of finding F2: the old check 7 was
   absent from it, so a guard against an unfalsifiable test was itself unfalsifiable. */
const allOK = windOK && quantaOK && rayOK && consoleOK && refsOK && mountOK && battery.allPass &&
              battery.negatives.allRejected && verbOK && perturbOK;
writeFileSync(path.join(OUT, 'proof.json'), JSON.stringify(
  { frames, consoleEvents, driverNoise, beatRefs, mountRefs, battery, verbatim, perturb, allOK }, null, 1));
console.log('\n' + (allOK ? 'ALL CHECKS PASS' : 'PROOF FAILED'));
process.exit(allOK ? 0 : 1);
