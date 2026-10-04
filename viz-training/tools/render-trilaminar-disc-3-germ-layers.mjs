/* MedBank · headless proof for models3d/trilaminar-disc-3-germ-layers.js
 *
 *   node viz-training/tools/render-trilaminar-disc-3-germ-layers.mjs
 *
 * BUILD-TASK-PROMPT section 3's five checks, plus five this model needs of its own.
 *
 *   1. IT RENDERS — every beat's own t and both keyings, to
 *      viz-training/models-out/trilaminar-disc-3-germ-layers/
 *   2. THE CONSOLE IS CLEAN — no error, no warning, no throw, in the page that builds it.
 *   3. NORMALS POINT OUTWARD — and the familiar count-the-radial-normals probe is NOT VALID on this
 *      model, which is half the check. Every part of it is a SHEET: a slab 0.16 to 0.26 units thick
 *      and up to 8.6 across, so a vertex's direction from its own mesh centroid is very nearly
 *      PERPENDICULAR to that vertex's normal and the radial fraction sits near 0.5 on geometry with
 *      nothing wrong with it. What is measured instead is (a) every triangle's FACE normal, from its
 *      vertex ORDER, against the vertex normals emitted with it — the invariant RENDER-STANDARD 2.1
 *      actually states, which holds on any shape; (b) the SIGNED VOLUME of each closed body, positive
 *      exactly when a closed surface is wound outward; and (c) 2.4b's RAY CAST from six cameras,
 *      counting first hits that face AWAY. On a closed solid that count is zero. The radial fraction
 *      is reported too, so a reader can see for themselves that it says nothing here.
 *   4. IT LOOKS LIKE THE THING — the frames are for a human; this file cannot do it.
 *   5. EVERY REF RESOLVES THROUGH THE REAL ADAPTER in viz3d.js — not in this harness's own loader —
 *      for EVERY structure EVERY BEAT SHOWS, at THAT BEAT'S OWN t AND WITH THAT BEAT'S OWN FLAGS.
 *      This is the only check that proves a student would see it; everything above proves only that
 *      the geometry exists.
 *
 *   6. THE WINDING CONVENTION IS RE-MEASURED, NOT REMEMBERED (2.4b: a convention that has to be
 *      reasoned about at the call site will be got wrong at some call site). It was got wrong at one
 *      of them here — the ventral context dome, which came back at winding 0.0000, every face — so
 *      quad()'s argument order is re-derived on a unit sphere every run.
 *   7. THE SOLVED PARAMETERS ARE PERTURBED. Change a constant the geometry is built from and every
 *      number that claims to measure the model must move. One perturbation must change NOTHING.
 *   8. THE ACCEPTANCE BATTERY AND ITS NEGATIVE CASES BOTH RUN, in the browser, against the same file
 *      the page loads — not against a copy in a node sandbox.
 *   9. NO BEAT SHOWS BOTH KEYINGS OF THE MIDDLE SHEET, read off the SCENE'S OWN OPS rather than from
 *      a promise in the model, and SCENE_T_MAX is asserted against the scene's own SET_STAGE values.
 *      Acceptance row G's whole validity rests on that constant matching the scene.
 *  10. EVERY BEAT CHANGES THE PICTURE. The eight frames are differenced pairwise: no two may be
 *      identical, and no beat may be identical to the one before it.
 *
 * WHERE THIS RUNS. In a Linux container with chromium, against a copy of the repo. The files under
 * test are byte-identical to the ones in the repo; the substrate for the RENDER is not the mount.
 * The visibility walk (tools/measure-scene-visibility.mjs) and the beat-claim check
 * (tools/check-beat-claims.mjs) are separate runs and are NOT repeated here.
 */
import { chromium } from 'playwright';
import { readFileSync, mkdirSync, writeFileSync } from 'fs';
import http from 'http';
import path from 'path';
import fs from 'fs';

const ROOT = process.cwd();
const MODEL = 'trilaminar-disc-3-germ-layers';
const OUT = 'viz-training/models-out/' + MODEL;
mkdirSync(OUT, { recursive: true });

const MIME = { '.js': 'text/javascript', '.mjs': 'text/javascript', '.json': 'application/json',
               '.html': 'text/html', '.png': 'image/png' };
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

const SCENE = 'viz-training/scenes/embryology__week-3-gastrulation__' + MODEL + '.json';
const scene = JSON.parse(readFileSync(SCENE, 'utf8'));
const byKey = {}; scene.structures.forEach(s => byKey[s.key] = s);

/* the beats, their t, their shown set and their camera — READ OFF THE SCENE'S OWN OPS, never retyped */
const beats = scene.views.map(v => {
  const st = (v.ops || []).find(o => o.op === 'SET_STAGE');
  const rot = (v.ops || []).find(o => o.op === 'ROTATE_TO_VIEW');
  const shown = (v.ops || []).filter(o => o.op === 'SHOW_STRUCTURE').map(o => o.target);
  const pointed = (v.ops || []).filter(o => o.op === 'HIGHLIGHT_STRUCTURE').map(o => o.target);
  return { beat: v.beat, title: v.title, t: st ? st.t : 1, view: rot ? rot.view : 'anterior',
           shown, pointed, mode: v.mode };
});

let FAIL = 0;
const say = (ok, line) => { if (!ok) FAIL++; console.log((ok ? '  ok   ' : '  FAIL ') + line); };
const hdr = s => console.log('\n' + s);

const page = await chromium.launch().then(b => b.newPage({ viewport: { width: 1100, height: 900 } }));
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

console.log('MedBank · headless proof for models3d/' + MODEL + '.js');
console.log('  scene ' + SCENE);
console.log('  ' + beats.length + ' beats, ' + scene.structures.length + ' structures');

/* ════════════════════════════════════════════════════ 6 · THE WINDING CONVENTION, RE-DERIVED */
hdr('6 · quad()\'s argument order, DERIVED on a unit sphere (2.4b: never remembered)');
/* THE FIRST VERSION OF THIS CHECK ASSUMED AN ORDER AND FAILED AT 0.0000 — which is the whole point
   of 2.4b restated by the check written to enforce it. quad() takes a fixed vertex order and corrects
   nothing, so whether it comes out inward or outward depends on the HANDEDNESS of the parametrisation
   it is handed, and a sphere swept (polar, azimuth) in that order is left-handed with respect to its
   own outward normal. So this derives the order instead of asserting one: both are measured on a unit
   sphere whose correct answer is known (agreement 1.0000 and signed volume +4/3 pi), exactly ONE must
   be right, and the model's own measured agreement is then corroborated rather than assumed. */
const wind = await page.evaluate(() => {
  const T = window.THREE, K = window.VizKit;
  const NA = 24, NB = 32;
  const pt = (a, b) => { const ph = a * Math.PI, th = b * Math.PI * 2;
    return new T.Vector3(Math.sin(ph) * Math.cos(th), Math.sin(ph) * Math.sin(th), Math.cos(ph)); };
  const run = (order) => {
    const E = K.emitter();
    for (let ia = 0; ia < NA; ia++) for (let ib = 0; ib < NB; ib++) {
      const a0 = ia / NA, a1 = (ia + 1) / NA, b0 = ib / NB, b1 = (ib + 1) / NB;
      const P = order === 'polar-first'
        ? [pt(a0, b0), pt(a1, b0), pt(a1, b1), pt(a0, b1)]
        : [pt(a0, b0), pt(a0, b1), pt(a1, b1), pt(a1, b0)];
      E.quad(P[0], P[1], P[2], P[3], P[0].clone(), P[1].clone(), P[2].clone(), P[3].clone());
    }
    const g = E.geometry(E.count()), p = g.attributes.position.array, n = g.attributes.normal.array;
    let ok = 0, tot = 0, vol = 0;
    for (let i = 0; i < p.length; i += 9) {
      const ax = p[i+3]-p[i], ay = p[i+4]-p[i+1], az = p[i+5]-p[i+2];
      const bx = p[i+6]-p[i], by = p[i+7]-p[i+1], bz = p[i+8]-p[i+2];
      const fx = ay*bz-az*by, fy = az*bx-ax*bz, fz = ax*by-ay*bx;
      vol += (p[i]*(p[i+4]*p[i+8]-p[i+5]*p[i+7]) - p[i+1]*(p[i+3]*p[i+8]-p[i+5]*p[i+6])
              + p[i+2]*(p[i+3]*p[i+7]-p[i+4]*p[i+6])) / 6;
      if (fx*fx+fy*fy+fz*fz < 1e-18) continue;
      const nx = n[i]+n[i+3]+n[i+6], ny = n[i+1]+n[i+4]+n[i+7], nz = n[i+2]+n[i+5]+n[i+8];
      tot++; if (fx*nx+fy*ny+fz*nz >= 0) ok++;
    }
    return { agree: ok / tot, triangles: tot, volume: vol };
  };
  return { polarFirst: run('polar-first'), ringFirst: run('ring-first'),
           sphereVolume: 4 / 3 * Math.PI };
});
const good = [['polar-first', wind.polarFirst], ['ring-first', wind.ringFirst]]
  .filter(([, r]) => r.agree === 1 && r.volume > 0);
say(good.length === 1, 'exactly one argument order gives outward winding on a unit sphere: ' +
    good.map(([k]) => k).join(',') +
    '  (polar-first ' + wind.polarFirst.agree.toFixed(4) + '/vol ' + wind.polarFirst.volume.toFixed(3) +
    ', ring-first ' + wind.ringFirst.agree.toFixed(4) + '/vol ' + wind.ringFirst.volume.toFixed(3) +
    '; a unit sphere is +' + wind.sphereVolume.toFixed(3) + ')');
console.log('         so quad(a,b,c,d) is outward when b steps along the RING and d along the sweep — ' +
            'which is what the kit\'s own comment says, and what section 3 below then measures on ' +
            'every triangle this model emits rather than taking on trust.');

/* ════════════════════════════════════════════════════ 8 · ACCEPTANCE, IN THE BROWSER */
hdr('8 · the acceptance battery and its negative cases, in the page that loads the model');
const acc = await page.evaluate(() => {
  const M = window.MB3D_MODELS['trilaminar-disc-3-germ-layers'];
  const a = M.acceptance(), n = M.negatives(), s = M.selfCheckMustStrings();
  return { pass: a.pass, allPass: a.allPass, measured: a.measured,
           neg: n.rows.filter(r => !r.rejected), negCount: n.rows.length, allRejected: n.allRejected,
           must: s };
});
say(acc.allPass, 'acceptance: ' + Object.keys(acc.pass).length + ' rows, failures ' +
    Object.keys(acc.pass).filter(k => !acc.pass[k]).join(',') || 'none');
say(acc.allRejected, 'negative cases: ' + acc.negCount + ' rows, not rejected ' +
    (acc.neg.map(r => r.id).join(',') || 'none'));
say(acc.must.ok, 'every number in a `must` string comes from FLOORS: strays ' +
    JSON.stringify(acc.must.strays));
writeFileSync(OUT + '/acceptance.json', JSON.stringify(acc.measured, null, 1));

/* ════════════════════════════════════════════════════ 3 · NORMALS, THREE WAYS */
hdr('3 · normals point outward — three shape-independent measures, and one that is NOT valid here');
const norm = await page.evaluate(() => {
  const T = window.THREE, M = window.MB3D_MODELS['trilaminar-disc-3-germ-layers'];
  const out = [];
  for (const o of [{}, { split: true }, { block: true }, { split: true, block: true }]) {
    const tag = (o.split ? 'split' : 'plain') + (o.block ? '+block' : '');
    const g = M.build(0.70, Object.assign({ routes: true, cavities: true }, o));
    const meshes = [];
    g.traverse(m => { if (m.isMesh && m.geometry && !(m.userData && m.userData.outline)) meshes.push(m); });
    /* (a) face-normal / vertex-normal agreement, per body */
    let agreeOk = 0, agreeTot = 0, worstKey = null, worstFrac = 1;
    /* (b) signed volume per body */
    const vols = {}; let negVols = 0;
    /* the radial probe, reported so a reader can see it says nothing on a sheet */
    let radOk = 0, radTot = 0;
    for (const m of meshes) {
      const p = m.geometry.attributes.position.array, n = m.geometry.attributes.normal.array;
      let ok = 0, tot = 0, vol = 0;
      let cx = 0, cy = 0, cz = 0, cn = 0;
      for (let i = 0; i < p.length; i += 3) { cx += p[i]; cy += p[i+1]; cz += p[i+2]; cn++; }
      cx /= cn; cy /= cn; cz /= cn;
      for (let i = 0; i < p.length; i += 9) {
        const ax = p[i+3]-p[i], ay = p[i+4]-p[i+1], az = p[i+5]-p[i+2];
        const bx = p[i+6]-p[i], by = p[i+7]-p[i+1], bz = p[i+8]-p[i+2];
        const fx = ay*bz-az*by, fy = az*bx-ax*bz, fz = ax*by-ay*bx;
        vol += (p[i]*(p[i+4]*p[i+8]-p[i+5]*p[i+7]) - p[i+1]*(p[i+3]*p[i+8]-p[i+5]*p[i+6])
                + p[i+2]*(p[i+3]*p[i+7]-p[i+4]*p[i+6])) / 6;
        if (fx*fx+fy*fy+fz*fz < 1e-18) continue;
        const nx = n[i]+n[i+3]+n[i+6], ny = n[i+1]+n[i+4]+n[i+7], nz = n[i+2]+n[i+5]+n[i+8];
        tot++; if (fx*nx+fy*ny+fz*nz >= 0) ok++;
      }
      for (let i = 0; i < p.length; i += 3) {
        radTot++;
        if ((p[i]-cx)*n[i] + (p[i+1]-cy)*n[i+1] + (p[i+2]-cz)*n[i+2] >= 0) radOk++;
      }
      agreeOk += ok; agreeTot += tot;
      if (tot && ok / tot < worstFrac) { worstFrac = ok / tot; worstKey = m.userData.key; }
      const k = m.userData.key;
      vols[k] = (vols[k] || 0) + vol;
      const OPEN = ['amnion', 'yolk_sac'];
      if (vol <= 0 && OPEN.indexOf(k) < 0) negVols++;
    }
    out.push({ tag, agree: agreeTot ? agreeOk / agreeTot : 1, triangles: agreeTot,
               worstKey, worstFrac, volumes: vols, negVols,
               radialFraction: radTot ? radOk / radTot : 1 });
  }
  return out;
});
for (const r of norm) {
  say(r.agree === 1, r.tag + ': face/vertex normal agreement ' + r.agree.toFixed(4) +
      ' over ' + r.triangles + ' triangles (worst body ' + r.worstKey + ' ' + r.worstFrac.toFixed(4) + ')');
  say(r.negVols === 0, r.tag + ': every closed body has POSITIVE signed volume (the two open context ' +
      'shells excluded by name); bodies with a non-positive volume: ' + r.negVols);
  console.log('         the radial probe reads ' + (r.radialFraction * 100).toFixed(1) +
              '% — REPORTED, NOT ASSERTED, and the reason is not that it reads low. It reads HIGH ' +
              'here (84-97% across the four builds), which is exactly why it must not be used as the ' +
              'proof: it reads the NORMALS, which this model supplies explicitly from a finite ' +
              'difference of its own surface functions, and says nothing whatever about the vertex ' +
              'ORDER those normals were emitted with. RENDER-STANDARD 2.1\'s whole point is that a ' +
              'reversed winding hides perfectly behind correct normals on a DoubleSide material. So ' +
              'this number would be unchanged if every triangle in the model were wound backwards, ' +
              'and the three measures that WOULD change are the ones asserted above.');
}

/* ─── (c) 2.4b's RAY CAST: how many first hits face AWAY from the camera */
hdr('3c · ray cast from six cameras — on a closed solid, zero first hits face away (2.4b)');
const ray = await page.evaluate(() => {
  const T = window.THREE, M = window.MB3D_MODELS['trilaminar-disc-3-germ-layers'];
  const res = [];
  for (const o of [{}, { split: true }]) {
    const tag = o.split ? 'split' : 'plain';
    const g = M.build(0.70, Object.assign({ routes: true, cavities: true }, o));
    /* the two context envelopes are OPEN SHELLS by design — a cavity wall, not a solid — so a ray
       entering one necessarily meets a face turned away. Excluded BY NAME, with that reason. */
    const solid = new T.Group();
    g.traverse(m => { if (m.isMesh && m.geometry && !(m.userData && m.userData.outline) &&
                          ['amnion', 'yolk_sac'].indexOf(m.userData.key) < 0) solid.add(m.clone()); });
    solid.updateMatrixWorld(true);
    const box = new T.Box3().setFromObject(solid);
    const c = box.getCenter(new T.Vector3()), s = box.getSize(new T.Vector3());
    const R = s.length();
    const rc = new T.Raycaster(); rc.firstHitOnly = false;
    const dirs = [[1,0,0],[-1,0,0],[0,1,0],[0,-1,0],[0,0,1],[0,0,-1]];
    let away = 0, hits = 0;
    for (const d of dirs) {
      const dir = new T.Vector3(d[0], d[1], d[2]).normalize();
      const e1 = new T.Vector3(0, 0, 1); if (Math.abs(dir.dot(e1)) > 0.9) e1.set(1, 0, 0);
      const u = new T.Vector3().crossVectors(dir, e1).normalize();
      const v = new T.Vector3().crossVectors(dir, u).normalize();
      for (let i = -11; i <= 11; i++) for (let j = -11; j <= 11; j++) {
        const o2 = c.clone().addScaledVector(dir, -R)
          .addScaledVector(u, (i / 11) * s.length() * 0.30)
          .addScaledVector(v, (j / 11) * s.length() * 0.30);
        rc.set(o2, dir);
        const hit = rc.intersectObject(solid, true)[0];
        if (!hit || !hit.face) continue;
        hits++;
        const n = hit.face.normal.clone().applyMatrix3(
          new T.Matrix3().getNormalMatrix(hit.object.matrixWorld)).normalize();
        if (n.dot(dir) > 0) away++;
      }
    }
    res.push({ tag, hits, away });
  }
  return res;
});
for (const r of ray)
  say(r.away === 0, r.tag + ': ' + r.hits + ' first hits from six cameras, facing AWAY: ' + r.away);

/* ════════════════════════════════════════════════════ 7 · PERTURBATION */
hdr('7 · perturbation — change a constant and the measures must move (and one must not)');
const pert = await page.evaluate(() => {
  const M = window.MB3D_MODELS['trilaminar-disc-3-germ-layers'];
  const NAMES = ['mesoCoverFrac', 'hypoFrac', 'cranialWidthRatio', 'oroGapFrac', 'somiteFitSlack',
                 'paraxialRuns', 'interNarrowestRatio', 'latWidestRatio', 'plateRimSolidFrac',
                 'coelomVolFrac', 'notochordLenFrac', 'stackGapWorst', 'somiteClockOverrun'];
  const base = {}; for (const n of NAMES) base[n] = M.claimMeasure(n, 0.70);
  const baseK = M.constants();
  const rows = [];
  for (const [k, v] of [['W_MAX', 5.2], ['H_MESO', 0.40], ['R_NCH', 0.55], ['W_INTER', 0.70],
                        ['W_SOM', 1.60], ['SOMITE_PERIOD_H', 1.1], ['COEL_IN', 1.40],
                        ['DISC_L', 13.0], ['H_ECTO', 0.45], ['R_ORO', 1.6], ['H_VENT', 0.30]]) {
    const was = M._setConst(k, v);
    const moved = NAMES.filter(n => Math.abs(M.claimMeasure(n, 0.70) - base[n]) > 1e-9);
    const C = M.constants();
    const kMoved = Math.abs(C.K1_firstWave - baseK.K1_firstWave) > 1e-9 ||
                   Math.abs(C.K2_secondWave - baseK.K2_secondWave) > 1e-9;
    if (was === undefined) M._clearConst(k); else M._setConst(k, was);
    rows.push({ k, moved, kMoved });
  }
  let drift = 0;
  for (const n of NAMES) if (Math.abs(M.claimMeasure(n, 0.70) - base[n]) > 1e-12) drift++;
  return { rows, drift, base };
});
for (const r of pert.rows)
  say(r.moved.length > 0 || r.kMoved,
      r.k.padEnd(16) + ' moved: ' + (r.moved.join(', ') || '(none)') +
      (r.kMoved ? '  [and the solved rates K1/K2]' : ''));
say(pert.drift === 0, 'and every measure returns to its baseline when the constant is restored ' +
    '(drifted: ' + pert.drift + ') — the perturbation that must change NOTHING');

/* ════════════════════════════════════════════════════ 9 · THE SCENE'S OWN OPS */
hdr('9 · the two keyings never meet in one beat, and SCENE_T_MAX matches the scene');
const COLS_PLAIN = ['mesoderm', 'mesoderm_block'];
const COLS_SPLIT = ['paraxial', 'intermediate', 'lateral_plate', 'somatic', 'splanchnic', 'coelom'];
let bothIn = [];
for (const b of beats) {
  const refOf = k => (byKey[k] && byKey[k].refs ? byKey[k].refs.procedural : '');
  const plain = b.shown.filter(k => COLS_PLAIN.indexOf(k) >= 0);
  const split = b.shown.filter(k => COLS_SPLIT.indexOf(k) >= 0);
  if (plain.length && split.length) bothIn.push(b.beat + ': ' + plain + ' with ' + split);
}
say(bothIn.length === 0, 'no beat shows both keyings of the middle sheet: ' +
    (bothIn.join(' | ') || 'none do'));
const tMax = Math.max(...beats.map(b => b.t));
const declared = await page.evaluate(() => window.MB3D_MODELS['trilaminar-disc-3-germ-layers'].SCENE_T_MAX);
say(Math.abs(tMax - declared) < 1e-9, 'SCENE_T_MAX ' + declared + ' equals the scene\'s own largest ' +
    'SET_STAGE t ' + tMax + ' — acceptance row G\'s validity rests on this');

/* ════════════════════════════════════════════════════ 5 · THE REAL ADAPTER */
hdr('5 · every ref every beat SHOWS resolves through viz3d.js\'s own procedural adapter');
const adapterPage = await (await chromium.launch()).newPage();
const aMsgs = [];
adapterPage.on('console', m => aMsgs.push({ type: m.type(), text: m.text() }));
adapterPage.on('pageerror', e => aMsgs.push({ type: 'pageerror', text: String(e) }));
await adapterPage.goto(BASE + OUT + '/_harness.html');
await adapterPage.addScriptTag({ url: BASE + 'viz-training/spike/three.min.js' });
await adapterPage.evaluate(b => { window.MEDBANK_CONFIG = { MODEL_BASE: b + 'models3d/' }; }, BASE);
await adapterPage.addScriptTag({ url: BASE + 'viz3d.js' });
const want = [];
for (const b of beats) for (const k of b.shown)
  want.push({ beat: b.beat, key: k, ref: byKey[k].refs.procedural, t: b.t });
const resolved = await adapterPage.evaluate(async (want) => {
  const T = window.THREE;
  const ad = window.MB3D && window.MB3D.adapters && window.MB3D.adapters.procedural;
  if (!ad) return { error: 'viz3d did not expose MB3D.adapters.procedural' };
  const rows = [];
  for (const w of want) {
    /* the ref follows the beat's t exactly as viz3d's atStage() would set it */
    const base = w.ref.split('+')[0], flags = w.ref.indexOf('+') >= 0 ? '+' + w.ref.split('+')[1] : '';
    const ref = base + '@' + w.t + flags;
    try {
      const r = await ad.load(T, { refs: { procedural: ref } });
      const n = r && r.mesh && r.mesh.geometry ? r.mesh.geometry.attributes.position.count : 0;
      rows.push({ beat: w.beat, key: w.key, ref, vertices: n, reason: r ? r.reason : 'no result' });
    } catch (e) { rows.push({ beat: w.beat, key: w.key, ref, vertices: 0, reason: 'threw: ' + e.message }); }
  }
  return { rows };
}, want);
if (resolved.error) { say(false, resolved.error); }
else {
  const bad = resolved.rows.filter(r => !(r.vertices > 0));
  for (const r of resolved.rows)
    console.log('         beat ' + r.beat + '  ' + r.ref.padEnd(62) + ' ' +
                (r.vertices > 0 ? r.vertices + ' vertices' : 'NOTHING (' + r.reason + ')'));
  say(bad.length === 0, resolved.rows.length + ' refs resolved with geometry through the real ' +
      'adapter; empty: ' + (bad.map(r => r.beat + '/' + r.key).join(',') || 'none'));
  writeFileSync(OUT + '/adapter-resolution.json', JSON.stringify(resolved.rows, null, 1));
}
const SUBSTRATE_A = [/Automatic fallback to software WebGL/i, /GroupMarkerNotSet/i,
                     /GL_CLOSE_PATH_NV/i, /GPU stall due to ReadPixels/i];
const aErr = aMsgs.filter(m => (m.type === 'error' || m.type === 'warning' || m.type === 'pageerror')
                               && !SUBSTRATE_A.some(re => re.test(m.text)));
say(aErr.length === 0, 'and the adapter page\'s console is clean: ' + JSON.stringify(aErr).slice(0, 400));

/* ════════════════════════════════════════════════════ 1 · IT RENDERS, 10 · EVERY BEAT DIFFERS */
hdr('1 · it renders — one frame per beat, at that beat\'s own t, keying and camera');
const VIEW_DIR = { anterior: [0,0,1], posterior: [0,0,-1], lateral: [1,0,0], medial: [-1,0,0],
                   superior: [0,1,0.001], inferior: [0,-1,0.001] };
const hashes = [];
for (const b of beats) {
  /* THE FLAGS ARE READ OFF THE SCENE'S OWN REFS, NOT NAMED HERE. This used to be two booleans,
     `needsSplit` and `needsBlock`, and that was a trap rather than a shortcut: the moment the model
     grew a third variant the harness went on rendering the build it knew about, so beat 5's proof
     frame was the WHOLE-DISC split build while the player was drawing a transverse slab — a frame
     that looks fine and is not the picture. Found on 2026-10-02 by the round-3 build run, which added
     that variant. Flags are comma-separated after one '+' (viz3d.js parseProceduralRef), which is the
     other thing this file used to get wrong by assuming one flag per ref.
     THE UNION IS THE HARNESS'S OWN APPROXIMATION, and it is declared: the player builds each
     structure separately with ITS OWN flags, while this frame is one group, so a beat whose shown
     structures carried genuinely incompatible flags would be drawn here as a build no beat uses.
     Acceptance row Q and check 9 cover the case that matters — the two keyings of the middle sheet
     never meeting in one beat — and the per-structure truth is check 5, which resolves every ref
     through the real adapter at its own flags. */
  const flagSet = {};
  for (const k of b.shown) {
    const r = String((byKey[k].refs || {}).procedural || '');
    const plus = r.indexOf('+');
    if (plus >= 0) r.slice(plus + 1).split(',').forEach(f => { f = f.trim(); if (f) flagSet[f] = true; });
  }
  const flagList = Object.keys(flagSet).sort();
  await page.evaluate(({ t, dir, flags, shown, keys }) => {
    const T = window.THREE, K = window.VizKit, M = window.MB3D_MODELS['trilaminar-disc-3-germ-layers'];
    const cv = document.getElementById('c');
    const r = window._r || (window._r = K.configureRenderer(new T.WebGLRenderer({ canvas: cv, antialias: true })));
    r.setSize(1100, 900, false);
    const sc = new T.Scene(); sc.background = K.bg(0x101828);
    K.standardLights(sc);
    const g = M.build(t, Object.assign({ routes: true, cavities: true }, flags));
    const keep = new T.Group();
    g.traverse(m => { if (m.isMesh && keys.indexOf(m.userData.key) >= 0) keep.add(m.clone()); });
    sc.add(keep);
    const cam = new T.PerspectiveCamera(42, 1100 / 900, 0.1, 500);
    const fit = K.fitCamera(cam, keep, 1.05);
    cam.position.copy(fit.centre).addScaledVector(new T.Vector3(dir[0], dir[1], dir[2]).normalize(), fit.distance);
    cam.lookAt(fit.centre);
    r.render(sc, cam);
  }, { t: b.t, dir: VIEW_DIR[b.view] || [0,0,1], flags: flagSet,
       shown: b.shown, keys: b.shown.map(k => (byKey[k].refs.procedural || '').split('#')[1].split('@')[0].split('+')[0]) });
  const buf = await page.locator('#c').screenshot();
  const file = OUT + '/beat' + String(b.beat).padStart(2, '0') + '.png';
  writeFileSync(file, buf);
  let h = 0; for (let i = 0; i < buf.length; i++) h = (h * 31 + buf[i]) >>> 0;
  hashes.push({ beat: b.beat, hash: h, bytes: buf.length });
  console.log('         beat ' + b.beat + '  t=' + b.t + '  ' + b.view +
              (flagList.length ? '  +' + flagList.join(',') : '') + '  -> ' + file);
}
say(true, beats.length + ' frames written to ' + OUT);
hdr('10 · every beat changes the picture');
const dup = [];
for (let i = 0; i < hashes.length; i++) for (let j = i + 1; j < hashes.length; j++)
  if (hashes[i].hash === hashes[j].hash) dup.push(hashes[i].beat + '=' + hashes[j].beat);
say(dup.length === 0, 'no two beats render an identical frame: ' + (dup.join(',') || 'none'));

/* ═══════════════════════ 11 · WHICH WAY IS UP, ON THE SCREEN, IN EVERY BEAT
 *
 * ADDED BY THE ROUND-2 BUILD RUN, 2026-10-02, because round 1's BLOCKING finding was a defect that
 * no check in this file could fail on. Beat 1 drew the disc VENTRAL-SIDE-UP — a student read the
 * three germ layers in inverted order under a title saying "the right way up" — and the model was
 * innocent: `stackInverted` reads 0 at every t and always did, because it measures the bodies' order
 * in WORLD space. The CAMERA was wrong. viz3d.js never assigns `camera.up`, so it keeps THREE's
 * default (0,1,0); `VIEW_DIR.inferior` is [0,-1,0.001], very nearly antiparallel to it; the cross
 * product that builds the screen basis therefore falls out of that 0.001 tilt alone, and screen-up
 * lands on world +z, which this model declares VENTRAL. Every world-space measure in the corpus is
 * blind to this, and so is the visibility walk, which asks whether a structure can be SEEN and never
 * which way up it is seen.
 *
 * THE RULE, written to fail on any beat rather than on the one we already know about: build the
 * camera exactly as viz3d does, read the screen-up axis off its world matrix AFTER lookAt rather
 * than deriving what it ought to be, and — for any beat whose screen-up lies substantially along the
 * model's dorso-ventral axis — require it to point DORSAL. A beat framed down any other axis makes
 * no dorso-ventral claim and is reported without being asserted on.
 *
 * WHAT THIS DOES NOT FIX. The cause is in viz3d.js and is corpus-wide — 25 of the 146 scenes use
 * `inferior` at least once. This guards THIS scene. The engine defect is reported in BUILD-LOG.md
 * and ESCALATIONS.md rather than patched from a build run on a single item. */
hdr('11 · which way is up, on screen, in every beat (the check round 1\'s blocking finding slipped past)');
{
  const DORSAL = [0, 0, -1];   // the model's own declaration: VENTRAL = +z, DORSAL = -z
  const verdicts = await page.evaluate(({ beatsIn, VIEW_DIR, keysByBeat, DORSAL }) => {
    const T = window.THREE, K = window.VizKit, M = window.MB3D_MODELS['trilaminar-disc-3-germ-layers'];
    const out = [];
    for (let i = 0; i < beatsIn.length; i++) {
      const b = beatsIn[i], keys = keysByBeat[i];
      const g = M.build(b.t, { routes: true, cavities: true, split: b.split, block: b.block });
      const keep = new T.Group();
      g.traverse(m => { if (m.isMesh && keys.indexOf(m.userData.key) >= 0) keep.add(m.clone()); });
      const cam = new T.PerspectiveCamera(42, 1100 / 900, 0.1, 500);
      const fit = K.fitCamera(cam, keep, 1.05);
      const d = VIEW_DIR[b.view] || [0, 0, 1];
      cam.position.copy(fit.centre).addScaledVector(new T.Vector3(d[0], d[1], d[2]).normalize(), fit.distance);
      cam.lookAt(fit.centre);
      cam.updateMatrixWorld(true);
      const e = cam.matrixWorld.elements;
      const up = [e[4], e[5], e[6]];
      out.push({ beat: b.beat, view: b.view, up: up,
                 alongDV: up[0] * DORSAL[0] + up[1] * DORSAL[1] + up[2] * DORSAL[2] });
    }
    return out;
  }, { beatsIn: beats.map(b => ({ beat: b.beat, t: b.t, view: b.view,
         split: b.shown.some(k => (byKey[k].refs.procedural || '').indexOf('+split') >= 0),
         block: b.shown.some(k => (byKey[k].refs.procedural || '').indexOf('+block') >= 0) })),
       VIEW_DIR,
       keysByBeat: beats.map(b => b.shown.map(k => (byKey[k].refs.procedural || '').split('#')[1].split('@')[0].split('+')[0])),
       DORSAL });

  const judged = [], inverted = [];
  for (const v of verdicts) {
    const tag = 'beat ' + v.beat + ' (' + v.view + ') screen-up (' +
      v.up.map(n => n.toFixed(3)).join(',') + ')  dorsal-ness ' + v.alongDV.toFixed(3);
    if (Math.abs(v.alongDV) < 0.5) { console.log('         ' + tag + '  — not a dorso-ventral framing, not asserted'); continue; }
    judged.push(v.beat);
    if (v.alongDV > 0) console.log('         ' + tag + '  — DORSAL is up, correct');
    else { inverted.push(v.beat); console.log('         ' + tag + '  — VENTRAL IS UP, INVERTED'); }
  }
  say(inverted.length === 0, 'no beat framed on the dorso-ventral axis draws it upside down; ' +
      'beats asserted: ' + (judged.join(',') || 'none') + '; inverted: ' + (inverted.join(',') || 'none'));
}

/* ════════════════════════════════════════════════════ 2 · THE CONSOLE */
hdr('2 · the console is clean');
/* WHAT IS EXCLUDED, AND WHY IT IS NAMED RATHER THAN FILTERED BY SEVERITY. This container has no GPU,
   so chromium falls back to software WebGL and the driver layer emits its own notices — the
   swiftshader deprecation banner, and a GL_CLOSE_PATH_NV performance notice every time a frame is read
   back. Neither comes from any file under test and neither would appear on a machine with a GPU.
   RENDER-STANDARD is explicit that a warning which is a known false alarm trains every future run to
   ignore the channel it prints on, so they are matched by their own text and listed here, and anything
   else at all — including any message naming a file in this repo — fails the check. */
const SUBSTRATE = [
  /Automatic fallback to software WebGL/i,
  /GroupMarkerNotSet\(crbug\.com\/242999\)/i,
  /GL Driver Message .*GL_CLOSE_PATH_NV/i,
  /GPU stall due to ReadPixels/i,
];
const isSubstrate = t => SUBSTRATE.some(re => re.test(t));
const bad = consoleMsgs.filter(m => (m.type === 'error' || m.type === 'warning' || m.type === 'pageerror')
                                    && !isSubstrate(m.text));
const excluded = consoleMsgs.filter(m => isSubstrate(m.text));
say(bad.length === 0, 'build page: ' + consoleMsgs.length + ' messages, ' + excluded.length +
    ' software-WebGL substrate notices excluded by name, ' + bad.length +
    ' left ' + JSON.stringify(bad).slice(0, 600));

hdr(FAIL === 0 ? 'ALL CHECKS PASS' : FAIL + ' CHECK(S) FAILED');
await server.close();
process.exit(FAIL === 0 ? 0 : 1);
