/* MedBank · viz-training/tools/probe-transverse-slab.mjs
 *
 * WHAT THIS PROBE IS FOR, and why it is not one of the existing ones.
 *
 * Round 2's open finding on embryology__week-3-gastrulation__trilaminar-disc-3-germ-layers was that
 * beat 5 PROMISES A TRANSVERSE SECTION AND SHOWS A PLAN VIEW. The remedy it proposed, and this run
 * built, is a `slab` variant of the model: the same lens built only inside a cranio-caudal window at
 * full mediolateral extent. Whether that remedy WORKS is a framing question, and the only existing
 * tool that answers framing questions is measure-scene-visibility, which needs a finished scene.
 * This probe answers it on the MODEL alone, so the window could be chosen from a measurement rather
 * than from a guess and then confirmed end-to-end by the walk.
 *
 * It measures four things:
 *   1 · the SOLVED level and window at every sampled t, with the completeness score behind the choice
 *   2 · which of the four section keys the slab build actually emits, against the whole-disc build
 *   3 · viz3d's OWN framing arithmetic — distanceForBox, copied from viz3d.js:2155 and re-derived
 *       here against the same three.js, for the whole disc, the paramedian block and the slab, so the
 *       three can be compared in the units the player uses
 *   4 · the mirror symmetry of the slab in x, because a section that lost one side would be the first
 *       chiral thing in a model whose handedness is UNPROVED
 *
 * THE FRAMING NUMBER THIS PRINTS IS A PREDICTION, NOT THE MEASUREMENT. It is the subject's share of
 * the frame computed from the box and the camera formula; the real number is rendered pixels and comes
 * from measure-scene-visibility. The two are printed side by side in BUILD-LOG so a reviewer can see
 * that the prediction and the pixels agree, which is the only reason to trust this file at all.
 *
 *   node viz-training/tools/probe-transverse-slab.mjs
 */
import { chromium } from 'playwright';
import { readFileSync, existsSync, readdirSync } from 'fs';
import http from 'http'; import path from 'path'; import fs from 'fs';

const ROOT = process.cwd();
const MODEL = 'trilaminar-disc-3-germ-layers';
const MIME = { '.html': 'text/html', '.js': 'text/javascript', '.json': 'application/json' };
function findChromium() {
  if (process.env.CHROMIUM_PATH) return process.env.CHROMIUM_PATH;
  const base = '/opt/pw-browsers';
  if (existsSync(base)) for (const d of readdirSync(base))
    for (const rel of ['chrome-linux/chrome', 'chrome-linux/headless_shell']) {
      const q = path.join(base, d, rel); if (existsSync(q)) return q;
    }
  return null;
}
const server = http.createServer((q, s) => {
  const f = path.join(ROOT, decodeURIComponent(q.url.split('?')[0]));
  if (!fs.existsSync(f) || fs.statSync(f).isDirectory()) { s.writeHead(404); return s.end('no'); }
  s.writeHead(200, { 'content-type': MIME[path.extname(f)] || 'application/octet-stream' });
  s.end(fs.readFileSync(f));
});
await new Promise(r => server.listen(0, r));
const BASE = `http://127.0.0.1:${server.address().port}/`;

const browser = await chromium.launch({ executablePath: findChromium(),
  args: ['--use-gl=swiftshader', '--enable-unsafe-swiftshader', '--no-sandbox'] });
const page = await browser.newPage({ viewport: { width: 1100, height: 900 } });
const msgs = [];
page.on('console', m => msgs.push(m.type() + ': ' + m.text()));
page.on('pageerror', e => msgs.push('pageerror: ' + (e && e.message || e)));
await page.goto(BASE + 'viz-training/models-out/' + MODEL + '/_slabprobe.html').catch(() => {});
await page.setContent('<!doctype html><meta charset="utf-8"><body></body>');
await page.addScriptTag({ url: BASE + 'node_modules/three/build/three.js' });
await page.addScriptTag({ url: BASE + 'models3d/render-kit.js' });
await page.addScriptTag({ url: BASE + 'models3d/' + MODEL + '.js' });

const out = await page.evaluate(({ W, H }) => {
  const T = window.THREE, api = window.MB3D_MODELS['trilaminar-disc-3-germ-layers'];
  const KEYS = api.SLAB.keys;

  /* viz3d.js's own framing, copied verbatim in behaviour from viz3d.js distanceForBox/frameView, and
     with the same FRAME_PAD and the same 45-degree fov the player and the walk both use. */
  const FRAME_PAD = 1.05, FOV = 45;
  const VIEW_DIR = { anterior: [0,0,1], posterior: [0,0,-1], lateral: [1,0,0], medial: [-1,0,0],
                     superior: [0,1,0.001], inferior: [0,-1,0.001] };
  function frame(size, dirArr) {
    const dir = new T.Vector3().fromArray(dirArr).normalize();
    const vHalf = FOV * Math.PI / 360;
    const hHalf = Math.atan(Math.tan(vHalf) * (W / H));
    let up = Math.abs(dir.y) > 0.99 ? new T.Vector3(0,0,-1) : new T.Vector3(0,1,0);
    const right = new T.Vector3().crossVectors(up, dir).normalize();
    up = new T.Vector3().crossVectors(dir, right).normalize();
    const hx = size.x/2, hy = size.y/2, hz = size.z/2;
    const ext = a => Math.abs(a.x)*hx + Math.abs(a.y)*hy + Math.abs(a.z)*hz;
    const dist = Math.max(ext(up)/Math.tan(Math.max(0.05,vHalf)), ext(right)/Math.tan(Math.max(0.05,hHalf)))
                 * FRAME_PAD + ext(dir);
    const halfW = dist * Math.tan(hHalf), halfH = dist * Math.tan(vHalf);
    return { dist: +dist.toFixed(4), screenUp: [+up.x.toFixed(3), +up.y.toFixed(3), +up.z.toFixed(3)],
             frameWorld: [+(2*halfW).toFixed(3), +(2*halfH).toFixed(3)],
             subjectOfFrame_pct: +(100 * (ext(right)/halfW) * (ext(up)/halfH)).toFixed(2),
             nearFaceTerm: +ext(dir).toFixed(3) };
  }
  const boxOf = (g, keys) => {
    g.updateMatrixWorld(true);
    const b = new T.Box3(); let any = false;
    g.traverse(o => { if (o.isMesh && keys.indexOf(o.userData.key) >= 0) { b.expandByObject(o); any = true; } });
    return any ? b : null;
  };
  const sizeOf = (g, keys) => { const b = boxOf(g, keys); return b ? b.getSize(new T.Vector3()) : null; };
  const keysIn = g => { const s = {}; g.traverse(o => { if (o.isMesh) s[o.userData.key] =
      (s[o.userData.key] || 0) + (o.geometry.attributes.position.count); }); return s; };

  const res = { solved: {}, keys: {}, framing: {}, symmetry: {}, console: [] };
  for (const t of api.T_SAMPLE.concat([0.50])) {
    res.solved['t' + t] = { center: +api.SLAB.center(t).toFixed(4),
                            window: api.SLAB.window(t).map(v => +v.toFixed(4)),
                            completeness: +api.SLAB.completeness(t).toFixed(4) };
  }
  for (const t of [0.50]) {
    const gW = api.build(t, { split: true });
    const gS = api.build(t, { split: true, slab: true });
    const gB = api.build(t, { split: true, block: true });
    res.keys['wholeDisc'] = keysIn(gW); res.keys['slab'] = keysIn(gS); res.keys['block'] = keysIn(gB);
    for (const [tag, g] of [['wholeDisc', gW], ['slab', gS], ['block', gB]]) {
      const sz = sizeOf(g, KEYS.slice(0, 3).concat(['paraxial','intermediate','lateral_plate']));
      const szCmp = sizeOf(g, ['paraxial','intermediate','lateral_plate']);
      res.framing[tag] = szCmp ? {
        subjectBox: [+szCmp.x.toFixed(3), +szCmp.y.toFixed(3), +szCmp.z.toFixed(3)],
        superior: frame(szCmp, VIEW_DIR.superior),
        posterior: frame(szCmp, VIEW_DIR.posterior),
      } : 'the three columns are not all built in this variant';
      const b = boxOf(g, Object.keys(keysIn(g)));
      res.symmetry[tag] = b ? +Math.abs(b.min.x + b.max.x).toFixed(5) : null;
    }
  }
  return res;
}, { W: 1100, H: 900 });

console.log('MedBank · transverse slab probe for models3d/' + MODEL + '.js');
console.log('  viewport 1100x900, fov 45, FRAME_PAD 1.05 — the player\'s own numbers\n');
console.log('1 · THE SOLVED LEVEL AND WINDOW, per t');
for (const k in out.solved) console.log('   ' + k.padEnd(8), JSON.stringify(out.solved[k]));
console.log('\n2 · WHICH SECTION KEYS EACH VARIANT EMITS at t = 0.50 (vertex counts)');
for (const v of ['wholeDisc', 'slab', 'block']) {
  const K = out.keys[v] || {};
  const four = ['notochord','paraxial','intermediate','lateral_plate']
    .map(k => k + '=' + (K[k] || 0)).join('  ');
  console.log('   ' + v.padEnd(10) + four);
  console.log('   ' + ' '.repeat(10) + 'all keys: ' + Object.keys(K).sort().join(', '));
}
console.log('\n3 · FRAMING, viz3d\'s own arithmetic, subject = the three compared columns');
for (const v of ['wholeDisc', 'slab', 'block']) {
  const F = out.framing[v];
  if (typeof F === 'string') { console.log('   ' + v.padEnd(10) + F); continue; }
  console.log('   ' + v.padEnd(10) + 'box ' + JSON.stringify(F.subjectBox));
  for (const d of ['superior', 'posterior'])
    console.log('   ' + ' '.repeat(10) + d.padEnd(10) + 'dist ' + F[d].dist +
      '  near-face term ' + F[d].nearFaceTerm + '  screen-up ' + JSON.stringify(F[d].screenUp) +
      '  frame ' + JSON.stringify(F[d].frameWorld) + '  => subject ' + F[d].subjectOfFrame_pct + '% of frame');
}
console.log('\n4 · MIRROR SYMMETRY IN x, |min x + max x| over every key');
for (const v of ['wholeDisc', 'slab', 'block']) console.log('   ' + v.padEnd(10) + out.symmetry[v]);
console.log('\n5 · CONSOLE');
console.log(msgs.length ? msgs.map(m => '   ' + m).join('\n') : '   clean — no messages of any kind');

await browser.close(); server.close();
