/* MedBank · headless proof for models3d/neurulation-neural-plate-tube.js
 *
 *   node viz-training/tools/render-neurulation-neural-plate-tube.mjs
 *
 * BUILD-TASK-PROMPT section 3's five checks, plus seven this model needs of its own.
 *
 *   1. IT RENDERS — one frame per beat, at that beat's own t, with that beat's own shown list,
 *      per-structure opacity, variant flags and camera, plus five whole-model builds, to
 *      viz-training/models-out/neurulation-neural-plate-tube/
 *   2. THE CONSOLE IS CLEAN — no error, no warning, no throw.
 *   3. NORMALS POINT OUTWARD — and the familiar count-the-radial-normals probe IS NOT VALID on most of
 *      this model, which is half the check. Five of its keys are SHEETS: slabs 0.16 to 0.73 units thick
 *      and up to 14 across, so a vertex's direction from its own mesh centroid is very nearly
 *      PERPENDICULAR to that vertex's normal and the radial fraction sits near 0.5 on geometry with
 *      nothing wrong with it. What is measured instead is (a) every triangle's FACE normal, from its
 *      vertex ORDER, against the vertex normals emitted with it — the invariant RENDER-STANDARD 2.1
 *      actually states, which holds on any shape; (b) the SIGNED VOLUME of every closed body, positive
 *      exactly when a closed surface is wound outward; (c) ZERO UNPAIRED EDGES per body, welded with a
 *      tolerance rather than rounded to a grid; and (d) 2.4b's RAY CAST from six cameras, counting
 *      first hits that face AWAY. The radial fraction is reported too, so a reader can see for
 *      themselves that it says nothing here.
 *   4. IT LOOKS LIKE THE THING — the frames are for a human; this file cannot do it.
 *   5. EVERY REF RESOLVES THROUGH THE REAL ADAPTER in viz3d.js — not in this harness's own loader —
 *      for EVERY structure EVERY BEAT SHOWS, at THAT BEAT'S OWN t AND WITH THAT BEAT'S OWN FLAGS.
 *      This is the only check that proves a student would see it; everything above proves only that
 *      the geometry exists.
 *
 *   6. THE WINDING CONVENTION IS RE-MEASURED, NOT REMEMBERED (2.4b: a convention that has to be
 *      reasoned about at the call site will be got wrong at some call site). The kit's two emission
 *      orders are derived on a unit sphere every run, and the model decides between them per TRIANGLE
 *      from the geometry — see the note at emitTri.
 *   7. THE SOLVED PARAMETERS ARE PERTURBED. Change a constant the geometry is built from and every
 *      number that claims to measure the model must move — and the ones that claim NOT to depend on it
 *      must not. The separation is the model's central claim in one table: the zip is solved from the
 *      somite table and three taught days, the calibre from a conserved arc length, and neither knows
 *      about the other.
 *   8. THE ACCEPTANCE BATTERY AND ITS NEGATIVE CASES BOTH RUN, in the browser, against the same file
 *      the page loads — not against a copy in a node sandbox.
 *   9. NO BEAT MIXES VARIANTS, read off the SCENE'S OWN OPS rather than from a promise in the model:
 *      `sections`, `sbPanel` and `tail` are three different cuts and the two `open*` flags are lesions,
 *      and no beat may show two of them at once.
 *  10. EVERY BEAT CHANGES THE PICTURE. The nine frames are differenced pairwise: no two may be
 *      identical, and no beat may be identical to the one before it.
 *  11. THE TWO MODELS AGREE ON THE EMBRYO THEY DRAW — AND DISAGREE ON ONE THING, DELIBERATELY.
 *      models3d/notochord.js is loaded into the SAME PAGE and its constants() compared with this
 *      model's: the nine shared dimensions must agree EXACTLY, and SOMITE_PERIOD_H must DISAGREE,
 *      because this model uses the taught three-pairs-per-day and that file uses 4.5 hours. A comment
 *      claiming either would be checked by nothing. It also exercises the IIFE rule: two models in one
 *      page is exactly the case that kills a model written at top level.
 *  12. THE VISIBILITY WAIVERS ARE DEMONSTRATED, NOT ASSERTED. Two beats carry a waiver saying that the
 *      visibility walk's alpha-aware pass cannot see a cast through a translucent wall because its
 *      beauty pass leaves depthWrite on, while viz3d.js paint() sets depthWrite = opacity >= 0.98 and
 *      render-kit's tissueMaterial carries the same rule at the same threshold. That is a claim about
 *      the substrate, so it is MEASURED here: the same frame is rendered twice, once with depthWrite
 *      left on and once with viz3d's rule applied, and the cast's pixels are counted in both.
 *
 * WHERE THIS RUNS. In a Linux container with chromium, against a copy of the repo. The files under
 * test are byte-identical to the ones in the repo; the substrate for the RENDER is not the mount.
 * The visibility walk (tools/measure-scene-visibility.mjs), the fragment count
 * (tools/measure-fragments.mjs) and the beat-claim check (tools/check-beat-claims.mjs) are separate
 * runs and are NOT repeated here.
 */
import { chromium } from 'playwright';
import { readFileSync, mkdirSync, writeFileSync, existsSync, readdirSync } from 'fs';
import http from 'http';
import path from 'path';
import fs from 'fs';

const ROOT = process.cwd();
const MODEL = 'neurulation-neural-plate-tube';
const SIB = 'notochord';
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

/* the beats, their t, their shown set, what they point at, their flags and their camera — READ OFF
   THE SCENE'S OWN OPS, never retyped. Check 9's whole validity rests on that. */
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
await page.addScriptTag({ url: BASE + 'models3d/' + SIB + '.js' });

console.log('MedBank · headless proof for models3d/' + MODEL + '.js');
console.log('  scene ' + SCENE);
console.log('  ' + beats.length + ' beats, ' + scene.structures.length + ' structures, ' +
            scene.views.reduce((n, v) => n + (v.claims || []).length, 0) + ' claims');

/* ═════════════════════════════════════ 11 · TWO MODELS, ONE EMBRYO, ONE PAGE, ONE DISAGREEMENT */
hdr('11 · both models load into one page; nine dimensions agree and one is MEANT to differ');
const agree = await page.evaluate(([a, b]) => {
  const A = window.MB3D_MODELS[a], B = window.MB3D_MODELS[b];
  if (!A) return { error: 'this model did not register' };
  if (!B) return { error: 'the sibling did not register — two models in one page is the IIFE case' };
  const ca = A.constants(), cb = B.constants ? B.constants() : null;
  if (!cb) return { error: 'the sibling exposes no constants() to compare against' };
  const rows = [];
  for (const k of Object.keys(ca)) {
    if (!(k in cb)) { rows.push({ k, mine: ca[k], theirs: '(absent)', agree: null }); continue; }
    rows.push({ k, mine: ca[k], theirs: cb[k], agree: Math.abs(ca[k] - cb[k]) < 1e-12 });
  }
  return { rows, declared: Object.keys(A.CONSTANTS_DISAGREE || {}),
           mineKeys: Object.keys(A.LAYERS).length, theirKeys: Object.keys(B.LAYERS).length };
}, [MODEL, SIB]);
if (agree.error) say(false, agree.error);
else {
  const shared = agree.rows.filter(r => r.agree !== null);
  const bad = shared.filter(r => !r.agree && agree.declared.indexOf(r.k) < 0);
  const declaredDiff = shared.filter(r => !r.agree && agree.declared.indexOf(r.k) >= 0);
  const declaredSame = agree.declared.filter(k => {
    const r = shared.find(x => x.k === k); return r && r.agree;
  });
  for (const r of bad) console.log('         UNDECLARED DISAGREEMENT ' + r.k + ': ' + r.mine + ' vs ' + r.theirs);
  const absent = agree.rows.filter(r => r.agree === null).map(r => r.k);
  say(bad.length === 0, shared.length + ' shared dimensions, ' + (shared.length - declaredDiff.length) +
      ' agreeing exactly with ' + SIB + (absent.length ? '; not present there: ' + absent.join(',') : ''));
  for (const r of declaredDiff)
    console.log('         DECLARED DISAGREEMENT ' + r.k + ': ' + r.mine + ' here vs ' + r.theirs +
                ' there — see CONSTANTS_DISAGREE and the scene\'s gaps[]');
  say(declaredDiff.length === agree.declared.length && declaredSame.length === 0,
      'every disagreement this model DECLARES is real: ' + declaredDiff.length + ' of ' +
      agree.declared.length + ' declared, ' + declaredSame.length +
      ' declared-but-actually-equal (a stale note is a lie in the other direction)');
  say(true, 'and both models registered in one page: ' + agree.mineKeys + ' keys here, ' +
      agree.theirKeys + ' there — the IIFE holds');
}

/* ═════════════════════════════════════════ 6 · THE EMITTER'S ARGUMENT ORDER, RE-DERIVED */
hdr('6 · the kit\'s two emission orders, DERIVED on a unit sphere (2.4b: never remembered)');
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
      if (order === 'quad') E.quad(a, b, c, d, a, b, c, d); else E.quadFlip(a, b, c, d, a, b, c, d);
    }
    const g = E.geometry(E.count());
    const P = g.attributes.position.array, N = g.attributes.normal.array;
    let tot = 0, ok = 0, vol = 0;
    for (let i = 0; i < P.length; i += 9) {
      const e1 = [P[i+3]-P[i], P[i+4]-P[i+1], P[i+5]-P[i+2]];
      const e2 = [P[i+6]-P[i], P[i+7]-P[i+1], P[i+8]-P[i+2]];
      const f = [e1[1]*e2[2]-e1[2]*e2[1], e1[2]*e2[0]-e1[0]*e2[2], e1[0]*e2[1]-e1[1]*e2[0]];
      if (f[0]*f[0]+f[1]*f[1]+f[2]*f[2] < 1e-22) continue;
      const vn = [(N[i]+N[i+3]+N[i+6])/3, (N[i+1]+N[i+4]+N[i+7])/3, (N[i+2]+N[i+5]+N[i+8])/3];
      tot++; if (f[0]*vn[0]+f[1]*vn[1]+f[2]*vn[2] >= 0) ok++;
      vol += (P[i]*(P[i+4]*P[i+8]-P[i+5]*P[i+7]) + P[i+1]*(P[i+5]*P[i+6]-P[i+3]*P[i+8])
            + P[i+2]*(P[i+3]*P[i+7]-P[i+4]*P[i+6])) / 6;
    }
    return { tot, frac: ok / tot, vol };
  };
  return { quad: run('quad'), flip: run('quadFlip') };
});
say(true, 'on a sphere swept (polar, azimuth): quad agrees with its own normals on ' +
    n6(wind.quad.frac) + ' of ' + wind.quad.tot + ' triangles (volume ' + n6(wind.quad.vol) +
    '), quadFlip on ' + n6(wind.flip.frac) + ' (volume ' + n6(wind.flip.vol) + ')');
say(Math.abs(wind.quad.frac - 1) < 1e-9 || Math.abs(wind.flip.frac - 1) < 1e-9,
    'exactly one of the kit\'s two orders is right for this parametrisation, and it is ' +
    (Math.abs(wind.quad.frac - 1) < 1e-9 ? 'quad' : 'quadFlip') +
    ' — which is why this model measures the choice per triangle instead of taking it');

/* ════════════════════════════════════════════════════════════ 3 · NORMALS, VOLUMES, EDGES */
hdr('3 · winding, signed volume, unpaired edges and a six-camera ray cast, per key per variant');
const geom = await page.evaluate(([mod]) => {
  const M = window.MB3D_MODELS[mod], T = window.THREE;
  const VARS = [{}, { openCranial: true }, { openCaudal: true }, { sections: true },
                { sbPanel: true }, { tail: true }];
  const DAYS = [18, 21, 23, 25, 27, 28];
  const out = { worstWind: 1, worstWhere: '', negVol: [], unpaired: [], radial: {}, ray: [], bodies: 0, tris: 0 };
  for (const o of VARS) for (const d of DAYS) {
    const t = M.tOfDay(d);
    const { by } = M.vertsByKey(t, o);
    const tag = (Object.keys(o).join(',') || 'normal') + '@' + d;
    for (const k of Object.keys(by)) {
      const w = M.windingOf(by[k].P, by[k].N);
      out.tris += w.tot;
      if (w.frac < out.worstWind) { out.worstWind = w.frac; out.worstWhere = k + ' ' + tag; }
      for (const b of by[k].bodies) {
        out.bodies++;
        if (M.signedVolume(b.P) <= 0) out.negVol.push(k + ' ' + tag);
        const wt = M.watertightOf(b.P);
        if (wt.unpaired) out.unpaired.push(k + ' ' + tag + ' x' + wt.unpaired);
      }
      /* the radial fraction, reported so a reader can see it says nothing on a sheet */
      if (!out.radial[k]) {
        const P = by[k].P, N = by[k].N;
        let cx = 0, cy = 0, cz = 0, n = 0;
        for (let i = 0; i < P.length; i += 3) { cx += P[i]; cy += P[i+1]; cz += P[i+2]; n++; }
        cx /= n; cy /= n; cz /= n;
        let away = 0;
        for (let i = 0; i < P.length; i += 3) {
          const dx = P[i]-cx, dy = P[i+1]-cy, dz = P[i+2]-cz;
          if (dx*N[i] + dy*N[i+1] + dz*N[i+2] > 0) away++;
        }
        out.radial[k] = away / n;
      }
    }
  }
  /* 2.4b's ray cast: from six cameras, how many FIRST hits face away from the camera */
  const g = M.build(M.tOfDay(27), {});
  g.updateMatrixWorld(true);
  const box = new T.Box3().setFromObject(g);
  const c = box.getCenter(new T.Vector3()), sz = box.getSize(new T.Vector3());
  const R = sz.length();
  const rc = new T.Raycaster();
  const DIRS = [[0,0,1],[0,0,-1],[1,0,0],[-1,0,0],[0,1,0.001],[0,-1,0.001]];
  const meshes = [];
  g.traverse(o2 => { if (o2.isMesh && !(o2.userData||{}).outline) meshes.push(o2); });
  for (const d of DIRS) {
    const dir = new T.Vector3(d[0], d[1], d[2]).normalize();
    const eye = c.clone().add(dir.clone().multiplyScalar(R));
    let up = Math.abs(dir.y) > 0.99 ? new T.Vector3(0,0,-1) : new T.Vector3(0,1,0);
    const right = new T.Vector3().crossVectors(up, dir).normalize();
    up = new T.Vector3().crossVectors(dir, right).normalize();
    let hits = 0, away = 0;
    const N = 26;
    for (let i = 0; i < N; i++) for (let j = 0; j < N; j++) {
      const u = (i / (N - 1) - 0.5) * sz.length() * 0.52, v = (j / (N - 1) - 0.5) * sz.length() * 0.52;
      const from = eye.clone().addScaledVector(right, u).addScaledVector(up, v);
      rc.set(from, dir.clone().multiplyScalar(-1));
      const h = rc.intersectObjects(meshes, false);
      if (!h.length) continue;
      hits++;
      const f = h[0].face;
      if (!f) continue;
      const nw = f.normal.clone().applyMatrix3(new T.Matrix3().getNormalMatrix(h[0].object.matrixWorld)).normalize();
      if (nw.dot(dir) < 0) away++;
    }
    out.ray.push({ dir: d.join(','), hits, away });
  }
  return out;
}, [MODEL]);
say(geom.worstWind >= 0.9995, 'every triangle\'s face normal agrees with its vertex normals: worst ' +
    n6(geom.worstWind) + (geom.worstWhere ? ' at ' + geom.worstWhere : '') +
    ' over ' + geom.tris + ' triangles, 6 variants x 6 stages');
say(geom.negVol.length === 0, geom.bodies + ' closed bodies, ' + geom.negVol.length +
    ' with negative signed volume' + (geom.negVol.length ? ': ' + geom.negVol.slice(0, 6).join('; ') : ''));
say(geom.unpaired.length === 0, 'unpaired edges per body: ' + geom.unpaired.length + ' bodies affected' +
    (geom.unpaired.length ? ': ' + geom.unpaired.slice(0, 6).join('; ') : ''));
const rayBad = geom.ray.filter(r => r.away > 0);
say(rayBad.length === 0, '2.4b ray cast from six cameras: ' +
    geom.ray.map(r => r.dir + ' ' + r.away + '/' + r.hits).join('  ') + ' first hits facing AWAY');
console.log('         the radial fraction, which says NOTHING here — a sheet\'s vertex direction from its');
console.log('         own centroid is nearly perpendicular to its normal, so 0.5 is what a correct sheet gives:');
for (const k of Object.keys(geom.radial).sort())
  console.log('           ' + k.padEnd(24) + n6(geom.radial[k]));

/* ═══════════════════════════════════════════════════════ 8 · ACCEPTANCE, IN THE BROWSER */
hdr('8 · the acceptance battery and its negative cases, in the page, against the file it loaded');
const acc = await page.evaluate(([mod]) => {
  const M = window.MB3D_MODELS[mod];
  const a = M.acceptance();
  const self = M.selfCheckMustStrings();
  return { pass: a.pass, allPass: a.allPass, measured: a.measured, self, floors: a.floors,
           tests: a.spec.tests.map(x => x.id) };
}, [MODEL]);
for (const id of acc.tests) say(acc.pass[id] === true, 'row ' + id + ' ' + (acc.pass[id] ? 'passes' : 'FAILS'));
say(acc.self.agree, 'the must-strings and the measured rows are in step (' + acc.self.spec + ')');
writeFileSync(OUT + '/_acceptance.json', JSON.stringify(acc, null, 1));

const neg = await page.evaluate(([mod]) => window.MB3D_MODELS[mod].negatives(), [MODEL]);
const negBad = Object.keys(neg).filter(k => k !== 'perturbations' && k !== 'allPass' &&
                                            k !== 'perturbation_note' && !neg[k].rejects);
say(negBad.length === 0, Object.keys(neg).length - 3 + ' negative cases, ' + negBad.length +
    ' that the row FAILED to reject' + (negBad.length ? ': ' + negBad.join(',') : ''));
writeFileSync(OUT + '/_negatives.json', JSON.stringify(neg, null, 1));

/* ═══════════════════════════════════════════════════════════════ 7 · THE PERTURBATIONS */
hdr('7 · perturb a constant the geometry is built from; the right numbers move and the rest do not');
for (const name of Object.keys(neg.perturbations)) {
  const r = neg.perturbations[name];
  const moved = Object.keys(r.moved).map(k => k + (r.moved[k] ? ' moved' : ' DID NOT MOVE'));
  const still = Object.keys(r.still).map(k => k + ' ' + (r.still[k].ok ? 'held' : 'MOVED TOO FAR') +
                ' (rel ' + r.still[k].rel.toExponential(2) + ' vs tol ' + r.still[k].tol + ')');
  say(r.pass, name + ' [' + r.set + ']: ' + moved.concat(still).join(', '));
  for (const k of Object.keys(r.still)) console.log('           ' + k + ': ' + r.still[k].why);
}
console.log('         ' + (neg.perturbation_note || ''));

/* ═════════════════════════════════════════════ 9 · NO BEAT MIXES VARIANTS (off the scene's ops) */
hdr('9 · no beat mixes two cuts or draws a lesion beside a normal embryo');
const CUTS = ['sections', 'sbPanel', 'tail'];
const LESIONS = ['openCranial', 'openCaudal'];
for (const b of beats) {
  const f = Object.keys(b.flags);
  const cuts = f.filter(x => CUTS.indexOf(x) >= 0);
  const lesions = f.filter(x => LESIONS.indexOf(x) >= 0);
  const mixedFlagSets = new Set(b.shown.map(k => flagsOf(k).slice().sort().join(',')));
  say(cuts.length <= 1 && mixedFlagSets.size === 1,
      'beat ' + b.beat + ': flags [' + (f.join(',') || 'none') + '], ' + mixedFlagSets.size +
      ' distinct flag set(s) across the ' + b.shown.length + ' structures it shows' +
      (lesions.length ? ' (lesion: ' + lesions.join(',') + ')' : ''));
}

/* ════════════════════════════════════════ 5 · EVERY REF RESOLVES THROUGH THE REAL ADAPTER */
hdr('5 · every structure every beat shows, resolved through viz3d.js\'s own procedural adapter');
const page2 = await browser.newPage({ viewport: { width: 400, height: 300 } });
const c2 = [];
page2.on('console', m => c2.push({ type: m.type(), text: m.text() }));
page2.on('pageerror', e => c2.push({ type: 'pageerror', text: String(e) }));
writeFileSync(OUT + '/_adapter.html',
  '<!doctype html><meta charset="utf-8"><title>adapter</title>' +
  '<script>window.MEDBANK_CONFIG = { MODEL_BASE: "/models3d/" };</script>' +
  '<body><div id="host"></div></body>');
await page2.goto(BASE + OUT + '/_adapter.html');
await page2.addScriptTag({ url: BASE + 'viz-training/spike/three.min.js' });
await page2.addScriptTag({ url: BASE + 'viz3d.js' });
const resolved = await page2.evaluate(async (payload) => {
  const T = window.THREE;
  const MB = window.MB3D;
  if (!MB || !MB.adapters || !MB.adapters.procedural) return { error: 'viz3d did not expose MB3D.adapters.procedural' };
  const ad = MB.adapters.procedural;
  const out = [];
  for (const job of payload) {
    const s = { key: job.key, refs: { procedural: job.ref } };
    let r;
    try { r = await ad.load(T, s); } catch (e) { r = { mesh: null, reason: 'threw: ' + e.message }; }
    const g = r && r.mesh && r.mesh.geometry;
    out.push({ key: job.key, beat: job.beat, ref: job.ref,
               ok: !!(g && g.attributes && g.attributes.position && g.attributes.position.count > 0),
               reason: r ? r.reason : 'no result',
               verts: g && g.attributes && g.attributes.position ? g.attributes.position.count : 0 });
  }
  return { out };
}, beats.flatMap(b => b.shown.map(k => {
  const base = (byKey[k].refs.procedural || '').split('+')[0].split('@')[0];
  const f = flagsOf(k);
  return { key: k, beat: b.beat, ref: base + '@' + b.t + (f.length ? '+' + f.sort().join(',') : '') };
}))).catch(e => ({ error: String(e) }));
if (resolved.error) say(false, 'the adapter page failed: ' + resolved.error);
else {
  const bad = resolved.out.filter(r => !r.ok);
  for (const r of bad) console.log('         UNRESOLVED beat ' + r.beat + ' ' + r.key + ' -> ' +
                                   r.ref + ' reason:' + r.reason);
  say(bad.length === 0, resolved.out.length + ' (beat, structure) pairs resolved through the real ' +
      'adapter, ' + bad.length + ' unresolved; total vertices ' +
      resolved.out.reduce((n, r) => n + r.verts, 0));
}
const c2bad = c2.filter(m => m.type === 'error' || m.type === 'warning' || m.type === 'pageerror');
say(c2bad.length === 0, 'the adapter page\'s console: ' + c2bad.length + ' error/warning' +
    (c2bad.length ? ' — ' + c2bad.slice(0, 4).map(m => m.type + ': ' + m.text).join(' | ') : ''));
await page2.close();

/* ════════════════════════════════════════════════════════════════ 1 · IT RENDERS */
hdr('1 · one frame per beat, composed the way the player composes it, plus five whole-model builds');
const framed = await page.evaluate(([mod, jobs]) => {
  const T = window.THREE, K = window.VizKit, M = window.MB3D_MODELS[mod];
  const cv = document.getElementById('c');
  const renderer = new T.WebGLRenderer({ canvas: cv, antialias: true, preserveDrawingBuffer: true });
  renderer.setSize(1100, 900, false);
  K.configureRenderer(renderer);
  const VIEW_DIR = M.VIEW_DIR;
  const out = [];
  for (const job of jobs) {
    const scene = new T.Scene();
    scene.background = K.bg(0x101828);
    K.standardLights(scene);
    const opts = {}; (job.flags || []).forEach(f => opts[f] = true);
    const g = M.build(job.t, opts);
    /* THE PLAYER'S COMPOSITION, not the harness's: only the beat's own shown keys, each at its own
       authored opacity, with viz3d's depthWrite rule, and the camera fitted to what is left. */
    const keep = job.shown ? new Set(job.shown.map(s => s.part)) : null;
    const opOf = {}; (job.shown || []).forEach(s => { opOf[s.part] = s.opacity; });
    g.traverse(o => {
      if (!o.isMesh) return;
      const k = (o.userData || {}).key;
      if (keep && !keep.has(k)) { o.visible = false; return; }
      if (keep && o.material) {
        const op = opOf[k] == null ? 1 : opOf[k];
        /* EXACTLY viz3d.js's procedural adapter: transparent is ALWAYS true, and depthWrite is what
           carries the opacity rule. Setting transparent from the opacity instead looks equivalent and
           is not — it moves an opaque structure into the opaque render pass, where it is drawn BEFORE
           every translucent one and so can never be depth-rejected by one. That difference is the
           whole of check 12. */
        o.material.transparent = true; o.material.opacity = op;
        o.material.depthWrite = op >= 0.98;      // viz3d.js procedural adapter, load()
      }
    });
    scene.add(g);
    /* THE WORLD MATRICES FIRST. Box3.expandByObject on a MESH updates only that mesh's own world
       matrix from its parent's, and the parent here is a panel group carrying the layout offset — so
       without this the box is accumulated as if every panel sat at the origin, while the RENDER uses
       the real offsets. The sbPanel beat came out framed on one panel with the other three off the
       sides of the picture, and the only way that was found was by looking at the frame. */
    g.updateMatrixWorld(true);
    const cam = new T.PerspectiveCamera(42, 1100 / 900, 0.1, 500);
    const box = new T.Box3();
    g.traverse(o => { if (o.isMesh && o.visible && !(o.userData||{}).outline) box.expandByObject(o); });
    if (box.isEmpty()) { out.push({ name: job.name, error: 'nothing visible' }); continue; }
    const c = box.getCenter(new T.Vector3()), sz = box.getSize(new T.Vector3());
    const d = VIEW_DIR[job.view] || VIEW_DIR.posterior;
    const dir = new T.Vector3(d[0], d[1], d[2]).normalize();
    const vFov = cam.fov * Math.PI / 180, hFov = 2 * Math.atan(Math.tan(vFov / 2) * cam.aspect);
    const dist = Math.max((sz.y/2)/Math.tan(vFov/2), (sz.x/2)/Math.tan(hFov/2)) * 1.08 + sz.length()/2;
    cam.position.copy(c.clone().add(dir.clone().multiplyScalar(dist)));
    cam.up.set(0, Math.abs(dir.y) > 0.99 ? 0 : 1, Math.abs(dir.y) > 0.99 ? -1 : 0);
    cam.near = Math.max(0.05, dist - sz.length()); cam.far = dist + sz.length() * 3;
    cam.updateProjectionMatrix(); cam.lookAt(c);
    renderer.render(scene, cam);
    out.push({ name: job.name, png: cv.toDataURL('image/png'),
               box: [sz.x, sz.y, sz.z].map(x => +x.toFixed(3)) });
  }
  return out;
}, [MODEL, beats.map(b => ({
  name: 'beat' + String(b.beat).padStart(2, '0') + '-' + b.view, t: b.t, view: b.view,
  flags: Object.keys(b.flags),
  shown: b.shown.map(k => ({ part: (byKey[k].refs.procedural || '').split('#')[1].split('@')[0].split('+')[0],
                             opacity: byKey[k].opacity == null ? 1 : byKey[k].opacity })),
})).concat([18, 21, 23, 25, 27].map(d => ({
  name: 'whole-day' + d, t: +((d - 17) / 12).toFixed(6), view: 'posterior', flags: [], shown: null,
})))]);
let wrote = 0;
for (const f of framed) {
  if (f.error) { say(false, f.name + ': ' + f.error); continue; }
  writeFileSync(OUT + '/' + f.name + '.png', Buffer.from(f.png.split(',')[1], 'base64'));
  wrote++;
  console.log('         ' + f.name.padEnd(26) + ' subject box ' + f.box.join(' x '));
}
say(wrote === framed.length, wrote + ' of ' + framed.length + ' frames written to ' + OUT);

/* ══════════════════════════════════════════════════ 10 · EVERY BEAT CHANGES THE PICTURE */
hdr('10 · the nine beat frames, differenced pairwise');
const pngs = framed.filter(f => f.png && f.name.startsWith('beat')).map(f => ({ name: f.name, png: f.png }));
const same = [];
for (let i = 0; i < pngs.length; i++) for (let j = i + 1; j < pngs.length; j++)
  if (pngs[i].png === pngs[j].png) same.push(pngs[i].name + ' = ' + pngs[j].name);
say(same.length === 0, pngs.length + ' beat frames, ' + same.length + ' identical pairs' +
    (same.length ? ': ' + same.join('; ') : ''));

/* ═════════════════════ 12 · THE VISIBILITY WAIVERS, DEMONSTRATED RATHER THAN ASSERTED */
hdr('12 · the two waivers: can a cast be seen through a translucent wall, with and without depthWrite?');
const dw = await page.evaluate(([mod, jobs]) => {
  const T = window.THREE, K = window.VizKit, M = window.MB3D_MODELS[mod];
  const cv = document.getElementById('c');
  const renderer = new T.WebGLRenderer({ canvas: cv, antialias: false, preserveDrawingBuffer: true });
  renderer.setSize(560, 460, false);
  K.configureRenderer(renderer);
  const res = [];
  for (const job of jobs) {
    const row = { name: job.name, part: job.part };
    for (const mode of ['walkRule', 'viz3dRule']) {
      const counts = [];
      for (const withPart of [true, false]) {
        const scene = new T.Scene();
        scene.background = K.bg(0x000000);
        K.standardLights(scene);
        const opts = {}; (job.flags || []).forEach(f => opts[f] = true);
        const g = M.build(job.t, opts);
        const keep = new Set(job.shown.map(s => s.part));
        const opOf = {}; job.shown.forEach(s => { opOf[s.part] = s.opacity; });
        g.traverse(o => {
          if (!o.isMesh) return;
          const k = (o.userData || {}).key;
          if (!keep.has(k) || (!withPart && k === job.part)) { o.visible = false; return; }
          if (o.material) {
            const op = opOf[k] == null ? 1 : opOf[k];
            /* BOTH MODES SET transparent = true, because both the walk's beauty pass and viz3d do:
               the walk writes `o.material.transparent=true; o.material.opacity=s.opacity` for every
               structure whose scene record carries an opacity field AT ALL, which in this scene is all
               of them. The ONE thing that differs is depthWrite — the walk leaves three's default of
               true, viz3d sets it from the opacity. An earlier version of this check set transparent
               from the opacity and so could not reproduce the walk's reading at all: it reported the
               cast at 0.73% under both rules and FAILED its own assertion, which is how the real cause
               was found. Keep both lines as they are. */
            o.material.transparent = true; o.material.opacity = op;
            o.material.depthWrite = mode === 'walkRule' ? true : (op >= 0.98);
          }
        });
        scene.add(g);
        g.updateMatrixWorld(true);
        const cam = new T.PerspectiveCamera(42, 560 / 460, 0.1, 500);
        const box = new T.Box3();
        g.traverse(o => { if (o.isMesh && o.visible && !(o.userData||{}).outline) box.expandByObject(o); });
        const c = box.getCenter(new T.Vector3()), sz = box.getSize(new T.Vector3());
        const d = M.VIEW_DIR[job.view];
        const dir = new T.Vector3(d[0], d[1], d[2]).normalize();
        const vFov = cam.fov * Math.PI / 180, hFov = 2 * Math.atan(Math.tan(vFov/2) * cam.aspect);
        const dist = Math.max((sz.y/2)/Math.tan(vFov/2), (sz.x/2)/Math.tan(hFov/2)) * 1.08 + sz.length()/2;
        cam.position.copy(c.clone().add(dir.clone().multiplyScalar(dist)));
        cam.up.set(0, Math.abs(dir.y) > 0.99 ? 0 : 1, Math.abs(dir.y) > 0.99 ? -1 : 0);
        cam.updateProjectionMatrix(); cam.lookAt(c);
        renderer.render(scene, cam);
        const gl = renderer.getContext();
        const buf = new Uint8Array(560 * 460 * 4);
        gl.readPixels(0, 0, 560, 460, gl.RGBA, gl.UNSIGNED_BYTE, buf);
        counts.push(buf);
      }
      let changed = 0, peak = 0;
      for (let i = 0; i < counts[0].length; i += 4) {
        const dmax = Math.max(Math.abs(counts[0][i] - counts[1][i]),
                              Math.abs(counts[0][i+1] - counts[1][i+1]),
                              Math.abs(counts[0][i+2] - counts[1][i+2]));
        if (dmax > peak) peak = dmax;
        if (dmax >= 40) changed++;
      }
      row[mode] = { pct: +(100 * changed / (560 * 460)).toFixed(4), peak };
    }
    res.push(row);
  }
  return res;
}, [MODEL, (() => {
  const want = [{ beat: 4, part: 'neural_canal' }, { beat: 4, part: 'secondary_canal' },
                { beat: 9, part: 'neural_canal' }];
  return want.map(w => {
    const b = beats.find(x => x.beat === w.beat);
    return { name: 'beat' + w.beat + '/' + w.part, part: w.part, t: b.t, view: b.view,
             flags: Object.keys(b.flags),
             shown: b.shown.map(k => ({ part: (byKey[k].refs.procedural||'').split('#')[1].split('@')[0].split('+')[0],
                                        opacity: byKey[k].opacity == null ? 1 : byKey[k].opacity })) };
  });
})()]);
for (const r of dw) {
  const fixed = r.viz3dRule.pct >= 0.30 && r.walkRule.pct < 0.30;
  say(true, r.name.padEnd(28) + ' the walk\'s rule (depthWrite left on): ' + r.walkRule.pct +
      '% (peak ' + r.walkRule.peak + ')   viz3d\'s rule (depthWrite = opacity >= 0.98): ' +
      r.viz3dRule.pct + '% (peak ' + r.viz3dRule.peak + ')' +
      (fixed ? '   <-- the waiver is demonstrated' : ''));
}
say(dw.every(r => r.viz3dRule.pct > r.walkRule.pct + 0.1),
    'in every case the cast contributes MORE under viz3d\'s depthWrite rule than under the walk\'s, ' +
    'which is what the three waivers say and is why the walk under-reads it');
writeFileSync(OUT + '/_depthwrite.json', JSON.stringify(dw, null, 1));

/* ══════════════ 13 · EVERY PANEL OF A MULTI-PANEL VARIANT IS COUNTED ON ITS OWN

   ADOPTED 2026-10-03 from review finding F7, which is a gap in the standard and not in one model, and
   written here because a rule needs an instrument before it is a rule. F7's argument, in its own terms:
   the mechanical review asks that every scene key resolve to something the model builds, and that is
   per-MODEL; the visibility walk asks that each structure be visible in a beat's frame, and that is
   per-BEAT. Nothing anywhere asks a question per PANEL. So in `sections` or `sbPanel` a structure can
   be built, resolvable, and plainly present in the frame as a whole while being ABSENT FROM ONE PANEL,
   and no instrument looks.

   Two defects of exactly that shape have now been found by hand on this one model — three notochords
   under four panels (fixed by the review, row X), and beat 5's folds panel drawing ZERO crest pixels in
   the beat whose entire subject is the cells at the fold tips (F1). Both passed twelve harness checks.

   WHAT THIS MEASURES. For each beat whose variant lays out more than one panel: render the beat the way
   the player composes it, then ask of EVERY (panel, structure) pair whether that structure changes that
   panel's pixels. A panel-id pass assigns every pixel to the panel that owns it, so the question is
   asked inside the panel's own screen footprint rather than over the whole frame. Then:

     - geometry present in a panel and contributing no ink there is a FAILURE — that is F1's defect,
       and it is the one the per-beat walk cannot see;
     - geometry ABSENT from a panel is reported, and must be declared, either by the variant's own
       design (the four stage bands exist in one panel each BY CONSTRUCTION — that is what the four
       panels are) or in scene.panel_waivers.

   THE FLOOR IS 0.10% OF THE PANEL'S OWN FOOTPRINT, not of the frame. A four-panel figure gives each
   panel about a quarter of the picture, so the walk's 0.30%-of-frame floor is ~1.2% of a panel and
   would reject structures that are correctly small — the notochord is a 0.6-unit rod in a 5.5-unit
   panel. 0.10% of a panel's footprint is about 170 pixels at this frame size, which is a thing a reader
   can see. It is a floor on a MEASURED fraction, not a lowered threshold standing in for an argument. */
hdr('13 · every panel of a multi-panel variant, counted on its own (review F7)');
const PANEL_FLOOR = 0.10;
const multiBeats = [];
for (const b of beats) {
  if (!(b.flags.sections || b.flags.sbPanel)) continue;
  multiBeats.push(b);
}
const panelRes = await page.evaluate(([mod, jobs, FLOOR]) => {
  const T = window.THREE, K = window.VizKit, M = window.MB3D_MODELS[mod];
  const W = 760, H = 620;
  const cv = document.getElementById('c');
  const renderer = new T.WebGLRenderer({ canvas: cv, antialias: false, preserveDrawingBuffer: true });
  renderer.setSize(W, H, false);
  K.configureRenderer(renderer);
  const gl = renderer.getContext();
  const read = () => { const b = new Uint8Array(W * H * 4);
                       gl.readPixels(0, 0, W, H, gl.RGBA, gl.UNSIGNED_BYTE, b); return b; };
  const out = [];
  for (const job of jobs) {
    const opts = {}; (job.flags || []).forEach(f => opts[f] = true);
    const keep = new Set(job.shown.map(s => s.part));
    const opOf = {}; job.shown.forEach(s => { opOf[s.part] = s.opacity; });

    /* one build, reused for every pass, so the panels cannot move between the id pass and the
       beauty pass — which is the whole basis for attributing a changed pixel to a panel */
    const g = M.build(job.t, opts);
    const panels = g.children.filter(c => c.isObject3D);
    /* WHICH KEYS EACH PANEL ACTUALLY BUILDS, read off the group and not assumed from the scene */
    const presentIn = panels.map(panel => {
      const set = new Set();
      panel.traverse(o => { if (o.isMesh && o.userData && o.userData.key && !o.userData.outline)
                              set.add(o.userData.key); });
      return set;
    });
    const compose = (hideKey, flat) => {
      g.traverse(o => {
        if (!o.isMesh) return;
        const k = (o.userData || {}).key;
        o.visible = keep.has(k) && k !== hideKey;
        if (!o.visible || !o.material) return;
        const op = opOf[k] == null ? 1 : opOf[k];
        o.material.transparent = true; o.material.opacity = flat ? 1 : op;
        o.material.depthWrite = flat ? true : (op >= 0.98);   // viz3d.js's own rule
      });
    };
    /* the camera is fitted ONCE, to the beat as the player composes it, and then held for every pass —
       a camera refitted after hiding a structure would move the panels and make the diff meaningless */
    compose(null, false);
    g.updateMatrixWorld(true);
    const scene = new T.Scene();
    scene.background = K.bg(0x000000);
    K.standardLights(scene);
    scene.add(g);
    const cam = new T.PerspectiveCamera(42, W / H, 0.1, 500);
    const box = new T.Box3();
    g.traverse(o => { if (o.isMesh && o.visible && !(o.userData||{}).outline) box.expandByObject(o); });
    if (box.isEmpty()) { out.push({ beat: job.beat, error: 'nothing visible' }); continue; }
    const c = box.getCenter(new T.Vector3()), sz = box.getSize(new T.Vector3());
    const d = M.VIEW_DIR[job.view] || M.VIEW_DIR.posterior;
    const dir = new T.Vector3(d[0], d[1], d[2]).normalize();
    const vFov = cam.fov * Math.PI / 180, hFov = 2 * Math.atan(Math.tan(vFov / 2) * cam.aspect);
    const dist = Math.max((sz.y/2)/Math.tan(vFov/2), (sz.x/2)/Math.tan(hFov/2)) * 1.08 + sz.length()/2;
    cam.position.copy(c.clone().add(dir.clone().multiplyScalar(dist)));
    cam.up.set(0, Math.abs(dir.y) > 0.99 ? 0 : 1, Math.abs(dir.y) > 0.99 ? -1 : 0);
    cam.near = Math.max(0.05, dist - sz.length()); cam.far = dist + sz.length() * 3;
    cam.updateProjectionMatrix(); cam.lookAt(c);

    /* ── WHICH PIXELS BELONG TO WHICH PANEL: ONE RENDER PER PANEL, NOT ONE FLAT-COLOUR PASS.
       THE FIRST VERSION OF THIS FLOODED EACH PANEL WITH A FLAT COLOUR — red = (i+1)*50 — AND DECODED
       THE RED CHANNEL WITH A +/-12 TOLERANCE. It reported nonsense and said so loudly enough to be
       caught: beat 1's four panels came back with footprints 695/696/235/9555 px on a 2x2 layout of
       equal panels, `sec_plate` was credited with 15.8% of a panel its own geometry is not in, and
       `sec_groove` with 0% of the one panel it IS in. The cause is that a flat colour written into a
       material is not the number that comes back out of readPixels: configureRenderer sets the
       renderer's output encoding, so 50/255 linear leaves as ~124/255 encoded, and the decode matched
       almost nothing except the brightest panel, which then swallowed every pixel that happened to
       land near 200. A check whose own instrument needs the colour pipeline to be the identity is a
       check that will lie whenever the pipeline changes.
       So ownership is measured the way that cannot be encoded wrongly: render ONE PANEL AT A TIME, with
       the beat's own keep-set, and call every non-background pixel that panel's. Four extra renders,
       no colour arithmetic, and the overlap between panels is counted and reported rather than assumed
       to be zero. */
    const owner = new Int8Array(W * H).fill(-1);
    const foot = panels.map(() => 0);
    let overlap = 0;
    for (let k = 0; k < panels.length; k++) {
      compose(null, false);
      panels.forEach((pn, j) => { if (j !== k) pn.traverse(o => { if (o.isMesh) o.visible = false; }); });
      renderer.render(scene, cam);
      const buf = read();
      for (let i = 0, px = 0; i < buf.length; i += 4, px++) {
        if (buf[i] < 6 && buf[i + 1] < 6 && buf[i + 2] < 6) continue;   // background is pure black
        if (owner[px] >= 0) { overlap++; continue; }                     // first panel keeps it
        owner[px] = k; foot[k]++;
      }
    }

    /* ── THE BEAUTY PASS, then one pass per structure with that structure hidden. */
    compose(null, false);
    renderer.render(scene, cam);
    const base = read();
    const rows = [];
    for (const sh of job.shown) {
      compose(sh.part, false);
      renderer.render(scene, cam);
      const off = read();
      const per = panels.map(() => 0);
      for (let i = 0, px = 0; i < base.length; i += 4, px++) {
        const w = owner[px];
        if (w < 0) continue;
        const dmax = Math.max(Math.abs(base[i] - off[i]), Math.abs(base[i+1] - off[i+1]),
                              Math.abs(base[i+2] - off[i+2]));
        if (dmax >= 40) per[w]++;
      }
      rows.push({ key: sh.key, part: sh.part,
                  panels: panels.map((_, k) => ({
                    built: presentIn[k].has(sh.part),
                    px: per[k],
                    pct: foot[k] ? +(100 * per[k] / foot[k]).toFixed(4) : 0,
                  })) });
      compose(null, false);
    }
    out.push({ beat: job.beat, title: job.title, nPanels: panels.length,
               stations: (g.userData.sections || {}).present || null,
               footprints: foot, overlapPx: overlap, rows: rows, floor: FLOOR });
  }
  return out;
}, [MODEL, multiBeats.map(b => ({
  beat: b.beat, title: b.title, t: b.t, view: b.view, flags: Object.keys(b.flags),
  shown: b.shown.map(k => ({ key: k,
    part: (byKey[k].refs.procedural || '').split('#')[1].split('@')[0].split('+')[0],
    opacity: byKey[k].opacity == null ? 1 : byKey[k].opacity })),
})), PANEL_FLOOR]);

const panelWaivers = scene.panel_waivers || [];
const waived = (beat, key, panel) => panelWaivers.some(w =>
  w.view === beat && w.key === key && (w.panel == null || w.panel === panel));
let panelFails = 0, panelChecked = 0, absences = 0;
for (const r of panelRes) {
  if (r.error) { say(false, 'beat ' + r.beat + ': ' + r.error); continue; }
  console.log('         beat ' + r.beat + ' — ' + r.nPanels + ' panels' +
              (r.stations ? ' (' + r.stations.join(', ') + ')' : '') +
              ', footprints ' + r.footprints.join('/') + ' px, panels overlapping on screen ' +
              r.overlapPx + ' px');
  for (const row of r.rows) {
    const marks = row.panels.map((p, i) => (p.built ? '' : '~') + p.pct + '%').join('  ');
    const dark = row.panels.map((p, i) => ({ p, i })).filter(x => x.p.built && x.p.pct < r.floor);
    const miss = row.panels.map((p, i) => ({ p, i })).filter(x => !x.p.built);
    panelChecked += row.panels.filter(p => p.built).length;
    absences += miss.length;
    const unwaived = dark.filter(x => !waived(r.beat, row.key, x.i));
    if (unwaived.length) panelFails++;
    say(unwaived.length === 0,
        '  beat ' + r.beat + ' ' + row.key.padEnd(14) + ' per panel: ' + marks +
        (unwaived.length ? '   <-- BUILT IN PANEL ' + unwaived.map(x => x.i).join(',') +
                           ' AND DRAWS NOTHING THERE' : '') +
        (miss.length ? '   (~ = not built in that panel: ' + miss.map(x => x.i).join(',') + ')' : ''));
  }
}
say(panelFails === 0, panelChecked + ' (panel, structure) pairs where the geometry IS in the panel, ' +
    panelFails + ' structures dark in a panel that builds them; ' + absences +
    ' declared absences (a stage band exists in one panel by construction — that is the variant)');
writeFileSync(OUT + '/_panels.json', JSON.stringify(panelRes, null, 1));

/* ═══════ 14 · THE BATTERY GIVES THE SAME ANSWER TWICE, AND AFTER THE PERTURBATIONS HAVE RUN

   ADDED 2026-10-03 in answer to review finding F4: "row Q is not reproducible, and that undermines
   every 'all rows pass' in this item's history" — seven identical harness runs in one sitting, six
   passing row Q and one failing it on lateral_mesoderm|notochord and lateral_mesoderm|somites.

   The review offered a mechanism and said plainly it had not proved it: insideFrac decides containment
   by +x ray parity, which is a knife edge for a vertex lying ON a shared surface. THAT MECHANISM WAS
   MEASURED HERE AND DOES NOT HOLD on this file. tools/probe-insidefrac-knife.mjs instruments the same
   parity test and reports, for both named pairs in BOTH directions at day 25: zero sampled vertices
   within 1e-2 of a crossing, the nearest crossing 2.09 and 0.060 units away, and frac 0.00000 against
   the 0.005 floor. A knife edge needs vertices on the edge and there are none. So insideFrac's geometry
   test is deliberately NOT changed — altering a shared measurement across every row on an unproven
   diagnosis would buy churn, not confidence.

   What WAS found, by looking for a defect of the same family, is real: builtAt()'s cache key was lossy
   in two ways at once, so the same row could return two different numbers depending on what had been
   built before it in the same page. See the note at builtAt. It is fixed.

   And because a run that cannot reproduce a reported flake must not therefore declare it absent, the
   reproducibility is now a CHECK rather than a sitting at a keyboard. The battery runs three times in
   one page — twice back to back, and once after negatives() has run the perturbations, which is the
   call order most likely to leave state behind — and every row's pass/fail AND every scalar it
   measured must come back identical. */
hdr('14 · the battery, run three times in one page, must give identical answers (review F4)');
const repro = await page.evaluate(([mod]) => {
  const M = window.MB3D_MODELS[mod];
  const snap = () => {
    const a = M.acceptance();
    const m = {};
    for (const k of Object.keys(a.measured)) {
      const v = a.measured[k];
      if (typeof v === 'number' || typeof v === 'string' || v == null) m[k] = v;
      else m[k] = JSON.stringify(v);
    }
    return { pass: a.pass, m: m };
  };
  const one = snap();
  const two = snap();
  const nPert = Object.keys(M.negatives().perturbations || {}).length;
  const three = snap();
  const diff = (a, b, label) => {
    const o = [];
    for (const k of Object.keys(a.pass)) if (a.pass[k] !== b.pass[k])
      o.push(label + ' row ' + k + ': ' + a.pass[k] + ' -> ' + b.pass[k]);
    for (const k of Object.keys(a.m)) if (a.m[k] !== b.m[k])
      o.push(label + ' ' + k + ': ' + a.m[k] + ' -> ' + b.m[k]);
    return o;
  };
  return { rows: Object.keys(one.pass).length, scalars: Object.keys(one.m).length, nPert: nPert,
           d12: diff(one, two, 'run1->run2'), d13: diff(one, three, 'run1->run3(after perturbations)'),
           pertLeft: JSON.stringify(M.PERT || {}) };
}, [MODEL]);
say(repro.d12.length === 0, repro.rows + ' rows and ' + repro.scalars +
    ' measured scalars identical between two back-to-back runs' +
    (repro.d12.length ? ' — DRIFTED: ' + repro.d12.slice(0, 8).join(' | ') : ''));
say(repro.d13.length === 0, 'and identical again after negatives() ran its ' + repro.nPert +
    ' perturbations in the same page' +
    (repro.d13.length ? ' — DRIFTED: ' + repro.d13.slice(0, 8).join(' | ') : ''));
say(repro.pertLeft === '{}', 'and the perturbations restored every constant they touched: PERT = ' +
    repro.pertLeft);

/* ═══════════════════════════════════════════════════════════════ 2 · THE CONSOLE */
hdr('2 · the console');
/* THE ONE EXCLUSION, BY NAME AND WITH A REASON. swiftshader emits a GL Driver Message of severity
   Performance every time readPixels stalls the software pipeline — four of them, then it says it will
   stop repeating. It is a note about this container's renderer, not about the model, and it appears
   only in the checks that read pixels back. Excluded by matching BOTH 'GL Driver Message' and
   'Performance', so an actual GL error still counts; RENDER-STANDARD's note about a known false alarm
   training a run to ignore the channel is the reason this is a named exception rather than a filter on
   the word 'warning'. */
const driverNoise = m => m.type === 'warning' && /GL Driver Message/.test(m.text) && /Performance/.test(m.text);
const noise = consoleMsgs.filter(driverNoise).length;
const bad = consoleMsgs.filter(m => (m.type === 'error' || m.type === 'warning' || m.type === 'pageerror')
                                 && !driverNoise(m));
for (const m of bad.slice(0, 10)) console.log('         ' + m.type + ': ' + m.text);
say(bad.length === 0, consoleMsgs.length + ' console messages, ' + bad.length +
    ' error/warning/throw, plus ' + noise + ' GL-driver performance notices excluded by name');
say(missed.length === 0, 'server 404s: ' + missed.length + (missed.length ? ' — ' + missed.join(',') : ''));

await browser.close();
server.close();
console.log('\n' + (FAIL === 0 ? 'ALL CHECKS PASS' : FAIL + ' CHECKS FAILED'));
process.exit(FAIL === 0 ? 0 : 1);
