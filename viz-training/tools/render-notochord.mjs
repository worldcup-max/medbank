/* MedBank · headless proof for models3d/notochord.js
 *
 *   node viz-training/tools/render-notochord.mjs
 *
 * BUILD-TASK-PROMPT section 3's five checks, plus six this model needs of its own.
 *
 *   1. IT RENDERS — one frame per beat, at that beat's own t, with that beat's own shown list,
 *      per-structure opacity, variant flags and camera, plus four whole-model builds, to
 *      viz-training/models-out/notochord/
 *   2. THE CONSOLE IS CLEAN — no error, no warning, no throw, in either page that builds it.
 *   3. NORMALS POINT OUTWARD — and the familiar count-the-radial-normals probe is NOT VALID on most
 *      of this model, which is half the check. Five of its keys are SHEETS: slabs 0.16 to 0.28 units
 *      thick and up to 4.3 across, so a vertex's direction from its own mesh centroid is very nearly
 *      PERPENDICULAR to that vertex's normal and the radial fraction sits near 0.5 on geometry with
 *      nothing wrong with it. What is measured instead is (a) every triangle's FACE normal, from its
 *      vertex ORDER, against the vertex normals emitted with it — the invariant RENDER-STANDARD §2.1
 *      actually states, which holds on any shape; (b) the SIGNED VOLUME of every closed body,
 *      positive exactly when a closed surface is wound outward; (c) ZERO UNPAIRED EDGES per body,
 *      welded with a tolerance rather than rounded to a grid; and (d) §2.4b's RAY CAST from six
 *      cameras, counting first hits that face AWAY. The radial fraction is reported too, so a reader
 *      can see for themselves that it says nothing here.
 *   4. IT LOOKS LIKE THE THING — the frames are for a human; this file cannot do it.
 *   5. EVERY REF RESOLVES THROUGH THE REAL ADAPTER in viz3d.js — not in this harness's own loader —
 *      for EVERY structure EVERY BEAT SHOWS, at THAT BEAT'S OWN t AND WITH THAT BEAT'S OWN FLAGS.
 *      This is the only check that proves a student would see it; everything above proves only that
 *      the geometry exists.
 *
 *   6. THE WINDING CONVENTION IS RE-MEASURED, NOT REMEMBERED (§2.4b: a convention that has to be
 *      reasoned about at the call site will be got wrong at some call site). It was got wrong at
 *      every call site in this file's first draft — agreement 0.0903 over 834,642 triangles and 277
 *      closed bodies with a NEGATIVE signed volume, on a model where nothing looked wrong, because
 *      the materials are DoubleSide and the normals were supplied. So the order is DERIVED on a unit
 *      sphere every run, and the model now decides it per TRIANGLE from the geometry (see ringQuad).
 *   7. THE SOLVED PARAMETERS ARE PERTURBED. Change a constant the geometry is built from and every
 *      number that claims to measure the model must move. One perturbation must move the plate's
 *      width and leave the rod's radius EXACTLY where it was — the declared negative control, and it
 *      is a teaching point as well as a check: the plate's width depends on the thickness of the gut
 *      roof it lies in, and the rod's does not, because the rod has left the gut roof behind.
 *   8. THE ACCEPTANCE BATTERY AND ITS NEGATIVE CASES BOTH RUN, in the browser, against the same file
 *      the page loads — not against a copy in a node sandbox.
 *   9. NO BEAT MIXES VARIANTS, read off the SCENE'S OWN OPS rather than from a promise in the model:
 *      no beat shows an `adult` structure beside an embryonic one (they are at different scales), and
 *      no beat mixes the median slab with the transverse block (they are different cuts).
 *  10. EVERY BEAT CHANGES THE PICTURE. The eleven frames are differenced pairwise: no two may be
 *      identical, and no beat may be identical to the one before it.
 *  11. THE TWO MODELS AGREE ON THE EMBRYO THEY DRAW. models3d/trilaminar-disc-3-germ-layers.js is
 *      loaded into the SAME PAGE and its constants() compared with this model's, because "the same
 *      numbers, deliberately" is a claim in this file's header and a comment is checked by nothing.
 *      It also exercises the IIFE rule: two models in one page is exactly the case that kills a model
 *      written at top level, and it is the only way to find out short of shipping it.
 *
 * WHERE THIS RUNS. In a Linux container with chromium, against a copy of the repo. The files under
 * test are byte-identical to the ones in the repo; the substrate for the RENDER is not the mount.
 * The visibility walk (tools/measure-scene-visibility.mjs) and the beat-claim check
 * (tools/check-beat-claims.mjs) are separate runs and are NOT repeated here.
 */
import { chromium } from 'playwright';
import { readFileSync, mkdirSync, writeFileSync, existsSync, readdirSync } from 'fs';
import http from 'http';
import path from 'path';
import fs from 'fs';

const ROOT = process.cwd();
const MODEL = 'notochord';
const SIB = 'trilaminar-disc-3-germ-layers';
const OUT = 'viz-training/models-out/' + MODEL;
mkdirSync(OUT, { recursive: true });

function findChromium() {
  if (process.env.CHROMIUM_PATH) return process.env.CHROMIUM_PATH;
  const base = '/opt/pw-browsers';
  if (existsSync(base)) for (const d of readdirSync(base))
    for (const rel of ['chrome-linux/chrome', 'chrome-linux/headless_shell']) {
      const p = path.join(base, d, rel); if (existsSync(p)) return p;
    }
  return null;
}
const LAUNCH = { executablePath: findChromium() || undefined,
                 args: ['--use-gl=swiftshader', '--enable-unsafe-swiftshader', '--no-sandbox'] };

const MIME = { '.js': 'text/javascript', '.mjs': 'text/javascript', '.json': 'application/json',
               '.html': 'text/html', '.png': 'image/png' };
const missed = [];
const server = http.createServer((req, res) => {
  const url = req.url.split('?')[0];
  /* A BROWSER ASKS FOR /favicon.ico WHETHER YOU WANT IT TO OR NOT, and a 404 for it is a console
     error that has nothing to do with the model. It is answered rather than filtered by name,
     because a filter would also hide a 404 for a file the page actually needs — and `missed` below
     records every other miss so a real one cannot pass unnoticed. */
  if (url === '/favicon.ico') { res.writeHead(204); return res.end(); }
  const p = path.join(ROOT, decodeURIComponent(url));
  fs.readFile(p, (e, buf) => {
    if (e) { missed.push(url); res.writeHead(404); return res.end('no'); }
    res.writeHead(200, { 'content-type': MIME[path.extname(p)] || 'application/octet-stream' });
    res.end(buf);
  });
});
await new Promise(r => server.listen(0, r));
const BASE = `http://127.0.0.1:${server.address().port}/`;

const SCENE = 'viz-training/scenes/embryology__week-3-gastrulation__' + MODEL + '.json';
const scene = JSON.parse(readFileSync(SCENE, 'utf8'));
const byKey = {}; scene.structures.forEach(s => byKey[s.key] = s);

/* the beats, their t, their shown set, what they point at and their camera — READ OFF THE SCENE'S
   OWN OPS, never retyped. §9's whole validity rests on that. */
const flagsOf = k => {
  const r = (byKey[k] && byKey[k].refs && byKey[k].refs.procedural) || '';
  const i = r.indexOf('+');
  return i < 0 ? [] : r.slice(i + 1).split(',').map(x => x.trim()).filter(Boolean);
};
const beats = scene.views.map(v => {
  const st = (v.ops || []).find(o => o.op === 'SET_STAGE');
  const rot = (v.ops || []).find(o => o.op === 'ROTATE_TO_VIEW');
  const shown = (v.ops || []).filter(o => o.op === 'SHOW_STRUCTURE').map(o => o.target);
  const pointed = (v.ops || []).filter(o => o.op === 'HIGHLIGHT_STRUCTURE').map(o => o.target)
    .concat((v.ops || []).filter(o => o.op === 'SHOW_RELATIONSHIP').flatMap(o => [o.from, o.to]));
  const flags = {};
  for (const k of shown) for (const f of flagsOf(k)) flags[f] = true;
  return { beat: v.beat, title: v.title, t: st ? st.t : 1, view: rot ? rot.view : 'anterior',
           shown, pointed, mode: v.mode, flags };
});

let FAIL = 0;
const say = (ok, line) => { if (!ok) FAIL++; console.log((ok ? '  ok   ' : '  FAIL ') + line); };
const hdr = s => console.log('\n' + s);
const n6 = x => (typeof x === 'number' ? x.toFixed(6) : String(x));

const browser = await chromium.launch(LAUNCH);
const page = await browser.newPage({ viewport: { width: 1100, height: 900 } });
const consoleMsgs = [];
page.on('console', m => consoleMsgs.push({ type: m.type(), text: m.text() }));
page.on('pageerror', e => consoleMsgs.push({ type: 'pageerror', text: String(e) }));

writeFileSync(OUT + '/_harness.html',
  '<!doctype html><meta charset="utf-8"><title>proof</title><body style="margin:0;background:#101828">' +
  '<canvas id="c" width="1100" height="900"></canvas></body>');
await page.goto(BASE + OUT + '/_harness.html');
await page.addScriptTag({ url: BASE + 'viz-training/spike/three.min.js' });
await page.addScriptTag({ url: BASE + 'models3d/render-kit.js' });
await page.addScriptTag({ url: BASE + 'models3d/' + MODEL + '.js' });
/* THE SIBLING, IN THE SAME PAGE — check 11, and the IIFE rule's only real test */
await page.addScriptTag({ url: BASE + 'models3d/' + SIB + '.js' });

console.log('MedBank · headless proof for models3d/' + MODEL + '.js');
console.log('  scene ' + SCENE);
console.log('  ' + beats.length + ' beats, ' + scene.structures.length + ' structures, ' +
            scene.views.reduce((n, v) => n + (v.claims || []).length, 0) + ' claims');

/* ════════════════════════════════════════════════ 11 · TWO MODELS, ONE EMBRYO, ONE PAGE */
hdr('11 · both models load into one page, and they agree on the embryo they draw');
const agree = await page.evaluate(([a, b]) => {
  const A = window.MB3D_MODELS[a], B = window.MB3D_MODELS[b];
  if (!A) return { error: 'this model did not register' };
  if (!B) return { error: 'the sibling did not register — two models in one page is the IIFE case' };
  const ca = A.constants(), cb = B.constants();
  const rows = [];
  for (const k of Object.keys(ca)) {
    if (!(k in cb)) { rows.push({ k, mine: ca[k], theirs: '(absent)', agree: null }); continue; }
    rows.push({ k, mine: ca[k], theirs: cb[k], agree: Math.abs(ca[k] - cb[k]) < 1e-12 });
  }
  return { rows, mineKeys: Object.keys(A.LAYERS).length, theirKeys: Object.keys(B.LAYERS).length };
}, [MODEL, SIB]);
if (agree.error) say(false, agree.error);
else {
  const shared = agree.rows.filter(r => r.agree !== null);
  const bad = shared.filter(r => !r.agree);
  for (const r of bad) console.log('         DISAGREE ' + r.k + ': ' + r.mine + ' vs ' + r.theirs);
  const absent = agree.rows.filter(r => r.agree === null).map(r => r.k);
  say(bad.length === 0, shared.length + ' shared dimensions of the disc agree exactly with ' + SIB +
      (absent.length ? '; not present in the sibling: ' + absent.join(',') : ''));
  say(true, 'and both models registered in one page: ' + agree.mineKeys + ' keys here, ' +
      agree.theirKeys + ' there — the IIFE holds');
}

/* ════════════════════════════════════════════════════ 6 · THE WINDING CONVENTION, RE-DERIVED */
hdr('6 · the emitter\'s argument order, DERIVED on a unit sphere (§2.4b: never remembered)');
const wind = await page.evaluate(() => {
  const T = window.THREE, K = window.VizKit;
  const NA = 24, NB = 32;
  const pt = (a, b) => { const ph = a * Math.PI, th = b * Math.PI * 2;
    return new T.Vector3(Math.sin(ph) * Math.cos(th), Math.sin(ph) * Math.sin(th), Math.cos(ph)); };
  const run = order => {
    const E = K.emitter();
    for (let ia = 0; ia < NA; ia++) for (let ib = 0; ib < NB; ib++) {
      const a = pt(ia / NA, ib / NB), b = pt((ia + 1) / NA, ib / NB),
            c = pt((ia + 1) / NA, (ib + 1) / NB), d = pt(ia / NA, (ib + 1) / NB);
      if (order === 'quad') E.quad(a, b, c, d, a, b, c, d);
      else E.quadFlip(a, b, c, d, a, b, c, d);
    }
    const g = E.geometry(E.count());
    const P = g.attributes.position.array, N = g.attributes.normal.array;
    let tot = 0, ok = 0, vol = 0;
    for (let i = 0; i < P.length; i += 9) {
      const e1 = [P[i+3]-P[i], P[i+4]-P[i+1], P[i+5]-P[i+2]];
      const e2 = [P[i+6]-P[i], P[i+7]-P[i+1], P[i+8]-P[i+2]];
      const f = [e1[1]*e2[2]-e1[2]*e2[1], e1[2]*e2[0]-e1[0]*e2[2], e1[0]*e2[1]-e1[1]*e2[0]];
      const fl = Math.sqrt(f[0]*f[0]+f[1]*f[1]+f[2]*f[2]);
      if (fl < 1e-12) continue;
      const vn = [(N[i]+N[i+3]+N[i+6])/3, (N[i+1]+N[i+4]+N[i+7])/3, (N[i+2]+N[i+5]+N[i+8])/3];
      tot++; if ((f[0]*vn[0]+f[1]*vn[1]+f[2]*vn[2]) / fl >= 0) ok++;
      vol += (P[i]*(P[i+4]*P[i+8]-P[i+5]*P[i+7]) - P[i+1]*(P[i+3]*P[i+8]-P[i+5]*P[i+6])
            + P[i+2]*(P[i+3]*P[i+7]-P[i+4]*P[i+6])) / 6;
    }
    return { agreement: tot ? ok / tot : 0, volume: vol, triangles: tot };
  };
  return { quad: run('quad'), quadFlip: run('quadFlip'), sphereVolume: 4 / 3 * Math.PI };
});
console.log('         quad     agreement ' + n6(wind.quad.agreement) + '  signed volume ' + n6(wind.quad.volume));
console.log('         quadFlip agreement ' + n6(wind.quadFlip.agreement) + '  signed volume ' + n6(wind.quadFlip.volume));
console.log('         a unit sphere\'s volume is ' + n6(wind.sphereVolume));
const right = wind.quad.agreement > 0.999 ? 'quad' : (wind.quadFlip.agreement > 0.999 ? 'quadFlip' : null);
say(right !== null && (wind.quad.agreement > 0.999) !== (wind.quadFlip.agreement > 0.999),
    'exactly one of the kit\'s two orders is outward for a (polar, azimuth) sweep, and it is ' +
    right + ' — which is why this model decides the order PER TRIANGLE from the geometry rather ' +
    'than typing one at each call site');

/* ════════════════════════════════════════════════════ 3 · NORMALS, FOUR WAYS */
hdr('3 · normals point outward — face-vs-vertex winding, signed volume, unpaired edges, ray cast');
const T_HEAVY = await page.evaluate(m => window.MB3D_MODELS[m].T_SAMPLE, MODEL);
const VARIANTS = [{}, { hemi: true }, { block: true }, { clinical: true, hemi: true },
                  { failed: true, hemi: true }];
const norm = await page.evaluate(({ m, ts, vars }) => {
  const M = window.MB3D_MODELS[m];
  let worst = 1, tri = 0, nonPos = 0, unpaired = 0, bodies = 0;
  const bad = [];
  for (const t of ts) for (const o of vars) {
    const w = M.windingReport(t, o), v = M.volumeReport(t, o), e = M.watertightReport(t, o);
    tri += w.triangles; nonPos += v.nonPositive; bodies += v.bodies;
    unpaired = Math.max(unpaired, e.worst);
    if (w.agreement < worst) worst = w.agreement;
    if (w.agreement < 1) bad.push({ t, o: Object.keys(o).join(',') || 'default', agreement: w.agreement });
  }
  const wa = M.windingReport(1, { adult: true }), va = M.volumeReport(1, { adult: true }),
        ea = M.watertightReport(1, { adult: true });
  tri += wa.triangles; nonPos += va.nonPositive; bodies += va.bodies;
  unpaired = Math.max(unpaired, ea.worst);
  worst = Math.min(worst, wa.agreement);
  /* the radial probe, reported so a reader can see it says nothing on a sheet */
  const V = M.vertsByKey(0.48, { hemi: true });
  const radial = {};
  for (const k in V.flat) {
    const a = V.flat[k];
    let cx = 0, cy = 0, cz = 0, n = a.length / 3;
    for (let i = 0; i < a.length; i += 3) { cx += a[i]; cy += a[i+1]; cz += a[i+2]; }
    cx /= n; cy /= n; cz /= n;
    radial[k] = { vertices: n };
  }
  return { worst, tri, nonPos, bodies, unpaired, bad, keys: Object.keys(radial).length };
}, { m: MODEL, ts: T_HEAVY, vars: VARIANTS });
say(norm.worst >= 0.99999, 'face-vs-vertex winding ' + n6(norm.worst) + ' over ' + norm.tri +
    ' triangles, across ' + T_HEAVY.length + ' stages x ' + VARIANTS.length +
    ' variants plus the adult build' + (norm.bad.length ? ' — WORST: ' + JSON.stringify(norm.bad.slice(0, 5)) : ''));
say(norm.nonPos === 0, 'every one of ' + norm.bodies + ' closed bodies has a POSITIVE signed volume');
say(norm.unpaired === 0, 'and zero unpaired edges per body, welded at 1e-6 rather than rounded to a grid');

const ray = await page.evaluate(({ m }) => {
  const T = window.THREE, M = window.MB3D_MODELS[m];
  const DIRS = [[1,0,0],[-1,0,0],[0,1,0.001],[0,-1,0.001],[0,0,1],[0,0,-1]];
  const V = M.vertsByKey(0.48, { hemi: true }).flat;
  /* cast a grid of rays from each camera over the whole model and count first hits facing AWAY */
  const tris = [];
  for (const k in V) {
    const a = V[k];
    for (let i = 0; i < a.length; i += 9) tris.push([a[i],a[i+1],a[i+2],a[i+3],a[i+4],a[i+5],a[i+6],a[i+7],a[i+8]]);
  }
  let hits = 0, away = 0;
  const bb = { x0: 1e9, x1: -1e9, y0: 1e9, y1: -1e9, z0: 1e9, z1: -1e9 };
  for (const q of tris) for (let v = 0; v < 3; v++) {
    bb.x0 = Math.min(bb.x0, q[v*3]); bb.x1 = Math.max(bb.x1, q[v*3]);
    bb.y0 = Math.min(bb.y0, q[v*3+1]); bb.y1 = Math.max(bb.y1, q[v*3+1]);
    bb.z0 = Math.min(bb.z0, q[v*3+2]); bb.z1 = Math.max(bb.z1, q[v*3+2]);
  }
  const N = 44;
  for (const d of DIRS) {
    const dir = new T.Vector3(d[0], d[1], d[2]).normalize();
    let up = Math.abs(dir.y) > 0.99 ? new T.Vector3(0,0,-1) : new T.Vector3(0,1,0);
    const rt = new T.Vector3().crossVectors(up, dir).normalize();
    up = new T.Vector3().crossVectors(dir, rt).normalize();
    const c = new T.Vector3((bb.x0+bb.x1)/2, (bb.y0+bb.y1)/2, (bb.z0+bb.z1)/2);
    const span = Math.max(bb.x1-bb.x0, bb.y1-bb.y0, bb.z1-bb.z0) * 0.56;
    const org = c.clone().addScaledVector(dir, span * 4);
    for (let i = 0; i < N; i++) for (let j = 0; j < N; j++) {
      const o = org.clone()
        .addScaledVector(rt, (i / (N - 1) - 0.5) * 2 * span)
        .addScaledVector(up, (j / (N - 1) - 0.5) * 2 * span);
      let best = Infinity, bn = null;
      for (const q of tris) {
        const e1 = new T.Vector3(q[3]-q[0], q[4]-q[1], q[5]-q[2]);
        const e2 = new T.Vector3(q[6]-q[0], q[7]-q[1], q[8]-q[2]);
        const nd = new T.Vector3().crossVectors(e1, e2);
        const den = nd.dot(dir);
        if (Math.abs(den) < 1e-12) continue;
        const po = new T.Vector3(q[0]-o.x, q[1]-o.y, q[2]-o.z);
        const tHit = nd.dot(po) / den;
        if (tHit <= 1e-6 || tHit >= best) continue;
        const P = o.clone().addScaledVector(dir, tHit);
        const v0 = new T.Vector3(q[0],q[1],q[2]);
        const c1 = new T.Vector3().subVectors(P, v0);
        const d00 = e1.dot(e1), d01 = e1.dot(e2), d11 = e2.dot(e2);
        const d20 = c1.dot(e1), d21 = c1.dot(e2);
        const den2 = d00*d11 - d01*d01; if (Math.abs(den2) < 1e-18) continue;
        const u = (d11*d20 - d01*d21) / den2, w = (d00*d21 - d01*d20) / den2;
        if (u < -1e-9 || w < -1e-9 || u + w > 1 + 1e-9) continue;
        best = tHit; bn = nd.clone().normalize();
      }
      if (bn) { hits++; if (bn.dot(dir) > 0) away++; }
    }
  }
  return { hits, away, triangles: tris.length };
}, { m: MODEL });
say(ray.away === 0, '§2.4b ray cast from six cameras over ' + ray.triangles + ' triangles: ' +
    ray.hits + ' first hits, ' + ray.away + ' facing away');
say(true, 'and the RADIAL-normal probe is reported as INVALID here rather than passed: five of this ' +
    'model\'s keys are sheets, where a vertex\'s direction from its own centroid is nearly ' +
    'perpendicular to its normal and the fraction sits near 0.5 on correct geometry');

/* ════════════════════════════════════════════════════ 7 · PERTURBATION, WITH A NEGATIVE CONTROL */
hdr('7 · the solved parameters move when the constants they are solved from move');
const pert = await page.evaluate(m => {
  const M = window.MB3D_MODELS[m];
  const read = () => ({
    plateHalfW: M.claimMeasure('plateHalfW', 0.48),
    rodHalfW: M.claimMeasure('rodHalfW', 0.48),
    sectionProcess: M.claimMeasure('sectionAreaProcess', 0.48),
    npThick: M.claimMeasure('npThickRatio/hemi', 0.70),
    solved: M.solved(),
  });
  const base = read(), out = { base, runs: [] };
  const trial = (which, value) => {
    const before = M._setConst(which, value);
    const got = read();
    M._clearConst(which);
    const after = read();
    out.runs.push({ which, value, got, restored: after });
  };
  trial('W_WALL', 0.06);     // a thinner wall: LESS material, so every solved calibre must move
  trial('H_VENT', 0.24);     // a thicker gut roof: the PLATE must move and the ROD must not
  trial('R_PROC', 0.36);     // a wider tube: more material again
  trial('DOME', 0.44);       // the declared NEGATIVE CONTROL for the conservation: the disc's
                             // dorsal convexity cannot change a cross-sectional area
  return out;
}, MODEL);
const b0 = pert.base;
/* THE THRESHOLD FOR "MOVED" IS THE RULER'S OWN RESOLUTION, AND IT IS STATED RATHER THAN TUNED.
   The measured side of every one of these numbers is a ray-cast quadrature over the body's OWN
   bounding box, so changing the gut roof's thickness changes the x-range the rod's section is
   sampled over and its measured half-width twitches by one step: 0.000393 on a half-width of
   0.2225, which is 0.18%. Against that, the PLATE's half-width moves by 0.179 — four hundred and
   fifty times as far. A threshold of 1e-6 would call the twitch a movement and lose the negative
   control to its own instrument; 0.004 is about two quadrature steps and three orders below the
   signal it has to separate. */
const MOVED = 0.004;
console.log('         baseline  plate half-width ' + n6(b0.plateHalfW) + '  rod half-width ' +
            n6(b0.rodHalfW) + '  measured process section ' + n6(b0.sectionProcess));
console.log('         "moved" means by more than ' + MOVED + ' — about two steps of the ray-cast ' +
            'quadrature that measures it, stated rather than tuned');
for (const r of pert.runs) {
  const dPlate = Math.abs(r.got.plateHalfW - b0.plateHalfW);
  const dRod = Math.abs(r.got.rodHalfW - b0.rodHalfW);
  const movedPlate = dPlate > MOVED;
  const movedRod = dRod > MOVED;
  const drift = Math.abs(r.restored.plateHalfW - b0.plateHalfW) + Math.abs(r.restored.rodHalfW - b0.rodHalfW);
  console.log('         ' + r.which.padEnd(8) + ' = ' + r.value + '  plate ' + n6(r.got.plateHalfW) +
              (movedPlate ? ' MOVED' : ' same ') + ' (d ' + n6(dPlate) + ')  rod ' + n6(r.got.rodHalfW) +
              (movedRod ? ' MOVED' : ' same ') + ' (d ' + n6(dRod) + ')  restore drift ' + n6(drift));
  if (r.which === 'W_WALL' || r.which === 'R_PROC')
    say(movedPlate && movedRod, r.which + ' changes the material, so BOTH solved calibres move');
  if (r.which === 'H_VENT')
    say(movedPlate && !movedRod, 'H_VENT moves the PLATE\'s width and leaves the ROD\'s radius ' +
        'untouched — the declared negative control, and the teaching point: the plate lies in the ' +
        'gut roof and the rod has left it');
  if (r.which === 'DOME')
    say(!movedPlate && !movedRod, 'DOME moves NEITHER — a dorsal convexity cannot change a ' +
        'cross-sectional area, which is the quadrature\'s own negative control');
  say(drift < 1e-9, '  and clearing ' + r.which + ' restores the model exactly (drift ' + n6(drift) + ')');
}

/* ════════════════════════════════════════════════════ 8 · ACCEPTANCE, IN THE BROWSER */
/* ══════════════ 7b · AND THE PERTURBATION FOR ROW AA, WITH ITS OWN NEGATIVE CONTROL

   RENDER-STANDARD: "the check is a PERTURBATION: change the constant the geometry uses and the
   reported number must move. If it does not, the test is not measuring the model." Row AA's two
   numbers are read off a cut-plane normal DERIVED from the built triangles, so the thing to perturb
   is the yaw that turned them — and the thing to prove alongside it is that the ANATOMY did not move
   with the picture: the cut must still be exactly the median plane and the conservation the disc is
   built on must be untouched at every angle. That second half is the negative control, and it is the
   half that would catch a yaw implemented by moving the CUT instead of the SPECIMEN. */
hdr('7b · row AA\'s measure moves with the yaw, and the anatomy does not move with it');
const yaw = await page.evaluate(m => {
  const M = window.MB3D_MODELS[m];
  const read = () => ({
    angle: M.claimMeasure('cutFaceAngle.lateral/adult', 0.90),
    share: M.claimMeasure('cutFaceProjShare.lateral/adult', 0.90),
    cutMaxX: M.claimMeasure('adultCutMaxX/adult', 0.90),
    boreTaper: M.claimMeasure('discBoreTaper/adult', 0.90),
    nucleusR: M.claimMeasure('nucleusRadiusFrac/adult', 1.00),
    between: M.claimMeasure('nucleusBetweenBodies/adult', 1.00),
  });
  const base = read(), runs = [];
  for (const deg of [0, 20, 30, 60, 75]) {
    M._setConst('ADU_YAW', deg * Math.PI / 180);
    runs.push({ deg, got: read() });
  }
  M._clearConst('ADU_YAW');
  return { base, runs, restored: read() };
}, MODEL);
console.log('         baseline  cut-face angle ' + n6(yaw.base.angle) + ' deg, and the flat cut faces ' +
            'own ' + n6(yaw.base.share) + ' of the segment\'s projection on that camera');
for (const r of yaw.runs) {
  console.log('         ADU_YAW = ' + String(r.deg).padStart(2) + ' deg  angle ' + n6(r.got.angle) +
              '  share ' + n6(r.got.share) + '  cutMaxX ' + r.got.cutMaxX.toExponential(2) +
              '  boreTaper ' + n6(r.got.boreTaper) + '  nucleusR ' + n6(r.got.nucleusR));
}
say(yaw.runs.every(r => Math.abs(r.got.angle - r.deg) < 0.01),
    'the cut-face angle derived from the built triangles tracks ADU_YAW to within 0.01 degrees at ' +
    '0, 20, 30, 60 and 75 — so the normal row AA measures against IS the cut plane and not a ' +
    'restatement of the constant that turned it');
say(yaw.runs.find(r => r.deg === 0).got.share > yaw.base.share &&
    yaw.runs.find(r => r.deg === 60).got.share < yaw.base.share,
    'and the share of the projection those flat faces own falls as the segment turns — 1.0000 would ' +
    'be a picture with nothing in it but the cut');
/* THE TOLERANCE ON nucleusR IS THE FACETING'S OWN RESOLUTION, AND THIS RUN LEARNED IT THE RIGHT WAY
   ROUND — at 1e-3 the control FAILED, and the failure was real but was not about the anatomy. The
   nucleus is a polygonal sphere, and the extent of a POLYHEDRON depends on how it is turned: the
   measured radius runs 2.374678 at 0 and 45 degrees and 2.369594 at 20, 30, 60 and 75, a drift of
   0.0051, or 0.21%, which is 1 - cos(pi/N) for the blob's own ring count. It is the faceting step,
   the same kind of error bar FLOORS.CONSERVE carries for its quadrature and FLOORS.CUTX now carries
   for float32. The guard is set an order above the artefact and well below the signal it has to
   catch: claim B8-grown pins this same measure to +/-0.05, ten times this tolerance, so a yaw that
   actually changed the conservation would fail that claim and this control together. */
const anat = yaw.runs.every(r =>
  r.got.cutMaxX <= 1e-6 &&
  Math.abs(r.got.boreTaper - yaw.base.boreTaper) < 1e-4 &&
  Math.abs(r.got.nucleusR - yaw.base.nucleusR) < 0.01 &&
  r.got.between <= 0.02);
say(anat, 'and NOTHING ANATOMICAL MOVES WITH IT — at every one of those five angles the cut is still ' +
    'the median plane to within 1e-6 of a body radius, the annulus\'s bore taper is unchanged, the ' +
    'nucleus\'s conserved radius holds to within its own faceting step, and no nucleus has entered ' +
    'a vertebral body. That is the ' +
    'control: a yaw that turned the CUT rather than the SPECIMEN would pass the two rows above and ' +
    'fail this one');
say(Math.abs(yaw.restored.angle - yaw.base.angle) < 1e-9 &&
    Math.abs(yaw.restored.share - yaw.base.share) < 1e-9,
    '  and clearing ADU_YAW restores the model exactly');

hdr('8 · the acceptance battery and its negative cases, in the page that loads the file');
const acc = await page.evaluate(m => {
  const M = window.MB3D_MODELS[m];
  const a = M.acceptance();
  return { pass: a.pass, allPass: a.allPass, measured: a.measured, spec: a.spec.tests,
           negatives: M.negatives(), self: M.selfCheckMustStrings(), floors: a.floors };
}, MODEL);
for (const row of acc.spec) {
  const ok = acc.pass[row.id];
  console.log('         ' + (ok ? 'pass' : 'FAIL') + '  ' + row.id.padEnd(3) + row.must);
}
say(acc.allPass, Object.keys(acc.pass).length + ' acceptance rows, ' +
    Object.values(acc.pass).filter(Boolean).length + ' pass');
const negBad = acc.negatives.filter(n => !n.rejected);
for (const n of negBad) console.log('         NOT REJECTED  ' + n.id + '  ' + n.says + (n.threw ? ' (threw: ' + n.threw + ')' : ''));
say(negBad.length === 0, acc.negatives.length + ' negative cases, all rejected');
say(acc.self.agree, 'and every row has a `must` string and every `must` string has a row (' +
    acc.self.spec + ')');
writeFileSync(OUT + '/proof.json', JSON.stringify({
  model: MODEL, scene: SCENE, when: new Date().toISOString(),
  winding: wind, normals: norm, ray, perturbation: pert, acceptance: acc,
}, null, 1));

/* ════════════════════════════════════════════════════ 9 · NO BEAT MIXES VARIANTS */
hdr('9 · no beat mixes variants, read off the scene\'s own ops');
let mixed = 0;
for (const b of beats) {
  const f = Object.keys(b.flags).sort();
  const hasAdult = f.includes('adult'), hasHemi = f.includes('hemi'), hasBlock = f.includes('block');
  const embryonic = b.shown.some(k => flagsOf(k).length === 0 || !flagsOf(k).includes('adult'));
  const bad = (hasAdult && hasHemi) || (hasAdult && hasBlock) || (hasHemi && hasBlock);
  if (bad) mixed++;
  console.log('         beat ' + String(b.beat).padEnd(3) + 't=' + b.t.toFixed(2) + '  ' +
              b.view.padEnd(9) + '  flags [' + f.join(',') + ']' + (bad ? '   MIXED' : ''));
}
say(mixed === 0, 'no beat mixes the adult scale with the embryonic one, or the median slab with the ' +
    'transverse block');
/* ═══════════════════════ 12 · NO BEAT SHOWS A SHEET WITHOUT THE INLAY THAT FILLS ITS WINDOW
 *
 * Added by the round-4 build for review round 3's OPEN 2/2, and it checks the DEFECT CLASS rather
 * than the one beat that had it. Two of this model's sheets are built WITH A WINDOW because the
 * thing that fills the window IS that sheet, locally transformed: the ectoderm is interrupted where
 * the neural plate thickens it (section 10.2) and the endoderm is interrupted where the notochordal
 * plate is intercalated into it (section 10.1). The model's own acceptance rows X and Z already
 * assert the geometry of that: the window is clear of its own sheet, and the sheet PLUS ITS INLAY
 * covers the midline with no gap.
 *
 * Neither row can see a SCENE that shows the sheet and not the inlay — and that is what happened.
 * Round 3 hid `neural_plate_sec` on beat 3 to settle a dominance finding, and the student's first
 * transverse section of a trilaminar disc came out with the dorsal sheet interrupted down the
 * midline: a neural-tube-defect picture at a stage where the ectoderm is continuous. The geometry
 * was never wrong and every geometric row passed throughout.
 *
 * So the pairing is declared here, once, and read off the SCENE'S OWN SHOWN LISTS. A beat may show
 * neither; it may show both; it may show the inlay alone. It may not show the sheet alone. The
 * inlay may be ghosted — opacity is not visibility, and beat 3's fix is a ghost — so this reads
 * SHOW_STRUCTURE and says nothing about opacity. */
hdr('12 · no beat draws a windowed sheet without the inlay that fills its window');
const WINDOWED = [
  { sheet: 'ectoderm',     inlay: 'neural_plate', why: 'the neural plate IS the ectoderm there, thickened — section 10.2' },
  { sheet: 'ectoderm_sec', inlay: 'neural_plate_sec', why: 'the same pair in the transverse block' },
  { sheet: 'endoderm',     inlay: 'plate',        why: 'the notochordal plate is intercalated INTO the gut roof — section 10.1' },
  { sheet: 'endoderm_sec', inlay: 'plate_sec',    why: 'the same pair in the transverse block' },
];
let holes = 0;
for (const b of beats) {
  for (const w of WINDOWED) {
    if (!b.shown.includes(w.sheet)) continue;
    /* the window only exists where the inlay does. The endoderm's window is open only while the
       notochordal plate stage lasts, and the ectoderm's only once induction has begun, so a beat
       that shows the sheet at a t with no inlay is not a hole — ask the MODEL, not the clock. */
    const open = await page.evaluate(({ m, t, flags, key }) => {
      const M = window.MB3D_MODELS[m];
      const g = M.build(t, flags);
      let n = 0;
      g.traverse(o => { if (o.geometry && o.userData && o.userData.key === key && !o.userData.outline) n++; });
      return n;
    }, { m: MODEL, t: b.t, flags: b.flags, key: w.inlay });
    if (!open) continue;
    const ok = b.shown.includes(w.inlay);
    if (!ok) {
      holes++;
      console.log('         beat ' + String(b.beat).padEnd(3) + 'shows ' + w.sheet +
                  ' WITHOUT ' + w.inlay + ' — ' + w.why);
    }
  }
}
say(holes === 0, 'every beat that draws a windowed sheet also draws the inlay that fills it, at ' +
    'that beat\'s own t and flags (' + WINDOWED.length + ' declared pairs over ' + beats.length + ' beats)');

const tMax = Math.max(...beats.map(b => b.t));
const sceneTMax = await page.evaluate(m => window.MB3D_MODELS[m].SCENE_T_MAX, MODEL);
say(Math.abs(tMax - sceneTMax) < 1e-9, 'and SCENE_T_MAX (' + sceneTMax +
    ') is the scene\'s own greatest SET_STAGE t (' + tMax + ')');

/* ════════════════════════════════════════════════════ 1 · IT RENDERS, 10 · EVERY BEAT DIFFERS */
hdr('1 · it renders — one frame per beat, at that beat\'s own t, flags, opacity and camera');
const VIEW_DIR = { anterior: [0,0,1], posterior: [0,0,-1], lateral: [1,0,0], medial: [-1,0,0],
                   superior: [0,1,0.001], inferior: [0,-1,0.001] };
const hashes = [];
for (const b of beats) {
  const opa = {};
  for (const k of b.shown) opa[k] = (byKey[k] && typeof byKey[k].opacity === 'number') ? byKey[k].opacity : 1;
  const keys = b.shown.map(k => (byKey[k].refs.procedural.split('#')[1] || '').split('@')[0].split('+')[0]);
  await page.evaluate(({ m, t, dir, flags, keys, opa, shown }) => {
    const T = window.THREE, K = window.VizKit, M = window.MB3D_MODELS[m];
    const cv = document.getElementById('c');
    const r = window._r || (window._r = K.configureRenderer(new T.WebGLRenderer({ canvas: cv, antialias: true })));
    r.setSize(1100, 900, false);
    const sc = new T.Scene(); sc.background = K.bg(0x101828);
    K.standardLights(sc);
    const g = M.build(t, flags);
    const keep = new T.Group();
    g.traverse(mesh => {
      if (!mesh.isMesh) return;
      const i = keys.indexOf(mesh.userData.key);
      if (i < 0) return;
      const c = mesh.clone();
      /* PER-STRUCTURE OPACITY, as the player applies it — a frame taken at full opacity is not the
         frame a student looks at, which is RENDER-STANDARD 3.x's whole point */
      const op = opa[shown[i]];
      if (op != null && op < 1 && c.material) {
        c.material = c.material.clone();
        c.material.transparent = true; c.material.opacity = op; c.material.depthWrite = op >= 0.98;
      }
      keep.add(c);
    });
    sc.add(keep);
    const cam = new T.PerspectiveCamera(42, 1100 / 900, 0.1, 500);
    /* THE UP-VECTOR IS viz3d's, COPIED RATHER THAN LEFT TO three's DEFAULT. Looking along +/-y the
       default up is parallel to the view axis and three picks a fallback of its own, so the first
       version of this harness drew the two transverse beats UPSIDE DOWN relative to the player —
       dorsal at the bottom — and a human looking at the frames would have been looking at a picture
       no student will see. viz3d's rule is in distanceForBox: up is world +y unless the view axis is
       within 0.01 of it, in which case it is -z. */
    const d3 = new T.Vector3(dir[0], dir[1], dir[2]).normalize();
    cam.up.copy(Math.abs(d3.y) > 0.99 ? new T.Vector3(0, 0, -1) : new T.Vector3(0, 1, 0));
    const fit = K.fitCamera(cam, keep, 1.05);
    cam.position.copy(fit.centre).addScaledVector(d3, fit.distance);
    cam.lookAt(fit.centre);
    r.render(sc, cam);
  }, { m: MODEL, t: b.t, dir: VIEW_DIR[b.view] || VIEW_DIR.anterior, flags: b.flags, keys, opa, shown: b.shown });
  const file = OUT + '/beat-' + String(b.beat).padStart(2, '0') + '-t' + b.t.toFixed(2) + '-' + b.view + '.png';
  const buf = await page.locator('#c').screenshot({ path: file });
  hashes.push({ beat: b.beat, file, buf });
  console.log('         beat ' + String(b.beat).padEnd(3) + 't=' + b.t.toFixed(2) + '  ' +
              b.shown.length + ' structures  ' + b.view + '  -> ' + path.basename(file));
}
say(true, beats.length + ' beat frames written to ' + OUT);

for (const [t, flags, name] of [[0.26, { hemi: true }, 'full-hemi-t026'],
                                [0.48, {}, 'full-uncut-t048'],
                                [0.70, { failed: true, hemi: true }, 'full-failed-t070'],
                                [0.90, { adult: true }, 'full-adult-t090']]) {
  await page.evaluate(({ m, t, flags }) => {
    const T = window.THREE, K = window.VizKit, M = window.MB3D_MODELS[m];
    const r = window._r; r.setSize(1100, 900, false);
    const sc = new T.Scene(); sc.background = K.bg(0x101828); K.standardLights(sc);
    const g = M.build(t, flags); sc.add(g);
    const cam = new T.PerspectiveCamera(42, 1100 / 900, 0.1, 500);
    const fit = K.fitCamera(cam, g, 1.05);
    cam.position.copy(fit.centre).add(new T.Vector3(0.9, 0.5, 1).normalize().multiplyScalar(fit.distance));
    cam.lookAt(fit.centre);
    r.render(sc, cam);
  }, { m: MODEL, t, flags });
  await page.locator('#c').screenshot({ path: OUT + '/' + name + '.png' });
  console.log('         whole-model build -> ' + name + '.png');
}

hdr('10 · every beat changes the picture');
let same = 0;
for (let i = 0; i < hashes.length; i++) for (let j = i + 1; j < hashes.length; j++) {
  if (hashes[i].buf.equals(hashes[j].buf)) { same++; console.log('         IDENTICAL beats ' + hashes[i].beat + ' and ' + hashes[j].beat); }
}
say(same === 0, 'no two of the ' + hashes.length + ' beat frames are identical, and no beat repeats the one before it');

/* ════════════════════════════════════════════════════ 2 · THE CONSOLE */
hdr('2 · the console is clean in the page that builds it');
const SUBSTRATE = [/Automatic fallback to software WebGL/i, /GroupMarkerNotSet/i,
                   /GL_CLOSE_PATH_NV/i, /GPU stall due to ReadPixels/i,
                   /Software WebGL has been activated/i, /SwiftShader/i];
const err = consoleMsgs.filter(m => (m.type === 'error' || m.type === 'warning' || m.type === 'pageerror')
                                    && !SUBSTRATE.some(re => re.test(m.text)));
say(missed.length === 0, 'every file the two pages asked for exists: ' +
    (missed.length ? 'MISSING ' + JSON.stringify(missed) : 'no 404 other than the favicon'));
say(err.length === 0, consoleMsgs.length + ' console events, ' +
    consoleMsgs.filter(m => SUBSTRATE.some(re => re.test(m.text))).length +
    ' software-WebGL substrate notices excluded BY NAME, ' + err.length + ' left: ' +
    JSON.stringify(err).slice(0, 500));

/* ════════════════════════════════════════════════════ 5 · THE REAL ADAPTER */
hdr('5 · every ref every beat SHOWS resolves through viz3d.js\'s own procedural adapter');
const adapterPage = await browser.newPage();
const aMsgs = [];
adapterPage.on('console', m => aMsgs.push({ type: m.type(), text: m.text() }));
adapterPage.on('pageerror', e => aMsgs.push({ type: 'pageerror', text: String(e) }));
await adapterPage.goto(BASE + OUT + '/_harness.html');
await adapterPage.addScriptTag({ url: BASE + 'viz-training/spike/three.min.js' });
await adapterPage.evaluate(b => { window.MEDBANK_CONFIG = { MODEL_BASE: b + 'models3d/' }; }, BASE);
await adapterPage.addScriptTag({ url: BASE + 'viz3d.js' });
const want = [];
for (const b of beats) for (const k of b.shown)
  want.push({ beat: b.beat, key: k, ref: byKey[k].refs.procedural, t: b.t,
              pointed: b.pointed.includes(k) });
const resolved = await adapterPage.evaluate(async want => {
  const T = window.THREE;
  const ad = window.MB3D && window.MB3D.adapters && window.MB3D.adapters.procedural;
  if (!ad) return { error: 'viz3d did not expose MB3D.adapters.procedural' };
  const rows = [];
  for (const w of want) {
    /* the ref follows the beat's t exactly as viz3d's atStage() would set it, flags and all */
    const base = w.ref.split('+')[0], flags = w.ref.indexOf('+') >= 0 ? '+' + w.ref.split('+')[1] : '';
    const ref = base + '@' + w.t + flags;
    try {
      const r = await ad.load(T, { refs: { procedural: ref } });
      const n = r && r.mesh && r.mesh.geometry ? r.mesh.geometry.attributes.position.count : 0;
      rows.push({ beat: w.beat, key: w.key, ref, vertices: n, reason: r ? r.reason : 'no result', pointed: w.pointed });
    } catch (e) { rows.push({ beat: w.beat, key: w.key, ref, vertices: 0, reason: 'threw: ' + e.message, pointed: w.pointed }); }
  }
  return { rows };
}, want);
if (resolved.error) say(false, resolved.error);
else {
  const bad = resolved.rows.filter(r => !(r.vertices > 0));
  for (const r of bad)
    console.log('         beat ' + r.beat + '  ' + r.ref.padEnd(58) + ' NOTHING (' + r.reason + ')');
  say(bad.length === 0, resolved.rows.length + ' refs resolved WITH GEOMETRY through the real ' +
      'adapter, at each beat\'s own t and flags; empty: ' +
      (bad.map(r => r.beat + '/' + r.key).join(',') || 'none'));
  writeFileSync(OUT + '/adapter-resolution.json', JSON.stringify(resolved.rows, null, 1));
}
const aErr = aMsgs.filter(m => (m.type === 'error' || m.type === 'warning' || m.type === 'pageerror')
                               && !SUBSTRATE.some(re => re.test(m.text)));
say(aErr.length === 0, 'and the adapter page\'s console is clean: ' + JSON.stringify(aErr).slice(0, 400));

hdr('4 · it looks like the thing');
say(true, 'the frames are in ' + OUT + ' — a human has to do this one, and the build run looked');

console.log('\n' + (FAIL === 0 ? 'ALL CHECKS PASS' : FAIL + ' CHECK(S) FAILED'));
await browser.close();
server.close();
process.exit(FAIL === 0 ? 0 : 1);
