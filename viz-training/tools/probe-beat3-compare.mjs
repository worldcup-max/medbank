/* MedBank · PROVE BEAT 3'S COMPARISON IS LIT IN THE REAL PLAYER.
 *
 * Written 2026-10-01 by the model3d BUILD task, to re-measure review round 1 finding 1 on the fixed
 * scene with the SAME measurement the finding was made with: viz3d.js driven directly, the view chip a
 * student clicks, and material.opacity sampled over time against the trace duration. Round 1 measured
 * head_order_before = 1.00 at every sample and head_order_after = 0.10 at every sample — the same 0.10
 * as the discarded context — because trace() opens each waypoint with `state.hi = {}` and
 * `state.only = [waypoint]`, which threw away what COMPARE_STRUCTURES had set two ops earlier.
 *
 * It is deliberately a SAMPLED read, not one read after settling: the round-1 failure could in principle
 * have been a mid-animation artefact, and the only way to rule that out is to watch.
 *
 * Usage: node viz-training/tools/probe-beat3-compare.mjs [--scene <id>] [--beat N] [--keys a,b,c]
 * Exits non-zero if any named key is not at full authored opacity at every sample.
 */
import { chromium } from 'playwright';
import { readFileSync, writeFileSync, mkdirSync, existsSync, readdirSync } from 'fs';
import http from 'http'; import path from 'path'; import fs from 'fs';

const ROOT = process.cwd();
const args = process.argv.slice(2);
const argv = (f, d) => { const i = args.indexOf(f); return i >= 0 ? args[i + 1] : d; };
const SCENE_ID = argv('--scene', 'embryology__folding-of-the-embryo__cranio-caudal-folding');
const BEAT = parseInt(argv('--beat', '3'), 10);
const KEYS = argv('--keys', 'head_order_before,head_fold,head_order_after').split(',');
const SAMPLES = (argv('--at', '0.5,1.5,3,5,7,9,12,16')).split(',').map(Number);
const scene = JSON.parse(readFileSync(`viz-training/scenes/${SCENE_ID}.json`, 'utf8'));
const OUT = `viz-training/models-out/${scene.id.split('__').pop()}/probe`;
mkdirSync(OUT, { recursive: true });

const MIME = { '.html': 'text/html', '.js': 'text/javascript', '.json': 'application/json', '.stl': 'model/stl' };
const server = http.createServer((req, res) => {
  const p = path.join(ROOT, decodeURIComponent(req.url.split('?')[0]));
  fs.readFile(p, (e, buf) => {
    if (e) { res.writeHead(404); return res.end('no'); }
    res.writeHead(200, { 'content-type': MIME[path.extname(p)] || 'application/octet-stream' }); res.end(buf);
  });
});
await new Promise(r => server.listen(0, r));
const BASE = `http://127.0.0.1:${server.address().port}/`;
const W = 1280, H = 900;
const html = `<!doctype html><meta charset=utf8><title>probe</title><link rel="icon" href="data:,">
<body style="margin:0;background:#141225"><div id="host" style="width:${W}px;height:${H}px"></div>
<script>window.MEDBANK_CONFIG={MODEL_BASE:'${BASE}models3d/',MESH_BASE:'${BASE}viz-meshes/',FEATURES:{MODEL3D:true}};
window.speechSynthesis={speak(){},cancel(){},getVoices(){return[];},addEventListener(){}};
window.SpeechSynthesisUtterance=function(){this.addEventListener=function(){};};<\/script>
<script src="${BASE}node_modules/three/build/three.js"><\/script>
<script src="${BASE}node_modules/three/examples/js/controls/TrackballControls.js"><\/script>
<script src="${BASE}node_modules/three/examples/js/controls/OrbitControls.js"><\/script>
<script src="${BASE}node_modules/three/examples/js/loaders/STLLoader.js"><\/script>
<script src="${BASE}viz3d.js"><\/script>`;
writeFileSync(`${OUT}/_probe.html`, html);

function findChromium() {
  const roots = [process.env.PLAYWRIGHT_BROWSERS_PATH, '/opt/pw-browsers'].filter(Boolean); const c = [];
  for (const root of roots) if (existsSync(root)) for (const d of readdirSync(root))
    for (const rel of ['chrome-linux/chrome', 'chrome-linux/headless_shell']) {
      const f = path.join(root, d, rel); if (existsSync(f)) c.push(f);
    }
  c.sort(a => (a.includes('chrome-linux/chrome') ? -1 : 1));
  return c[0];
}
const browser = await chromium.launch({ executablePath: findChromium(),
  args: ['--use-gl=swiftshader', '--enable-unsafe-swiftshader', '--no-sandbox'] });
const page = await browser.newPage({ viewport: { width: W + 40, height: H + 260 } });
const log = [], offsite = [];
page.on('console', m => { if (m.type() === 'error' || m.type() === 'warning') log.push(m.type() + ': ' + m.text()); });
page.on('pageerror', e => log.push('pageerror: ' + e.message));
await page.route('**/*', r => {
  const u = r.request().url();
  if (u.startsWith(BASE) || u.startsWith('data:') || u.startsWith('blob:')) return r.continue();
  offsite.push(u); return r.abort();
});
await page.goto(`${BASE}${OUT}/_probe.html`);
await page.waitForFunction('window.MB3D && window.MB3D.mountScene');
await page.evaluate(async (s) => {
  window.__p = await window.MB3D.mountScene(document.getElementById('host'), s, { via: 'probe' });
}, scene);
await page.waitForFunction('window.__p && window.__p.alive()', null, { timeout: 60000 });
const chips = await page.evaluate(() => document.querySelectorAll('#host .mb3d-chip').length);
if (chips !== scene.views.length) { console.error(`chips ${chips} != views ${scene.views.length}`); process.exit(2); }

const authored = {};
for (const st of scene.structures || []) authored[st.key] = (typeof st.opacity === 'number') ? st.opacity : 1;

await page.evaluate(n => document.querySelectorAll('#host .mb3d-chip')[n - 1].click(), BEAT);
const rows = [];
let prev = 0;
for (const at of SAMPLES) {
  await page.waitForTimeout(Math.max(0, at * 1000 - prev * 1000)); prev = at;
  const got = await page.evaluate(ks => {
    const out = {};
    for (const k of ks) { const m = window.__p.meshes[k]; out[k] = m ? +m.material.opacity.toFixed(4) : null; }
    return out;
  }, KEYS);
  rows.push({ at, ...got });
}
/* every key that is visible but NOT in our list, so "the discarded context" has a number too */
const ctx = await page.evaluate(ks => {
  const out = {};
  for (const k of Object.keys(window.__p.meshes)) {
    if (ks.indexOf(k) >= 0) continue;
    const m = window.__p.meshes[k]; if (m && m.visible) out[k] = +m.material.opacity.toFixed(4);
  }
  return out;
}, KEYS);

console.log(`\nscene ${scene.id}\nbeat ${BEAT} · "${scene.views[BEAT - 1].title}"\n`);
console.log('  t(s)  ' + KEYS.map(k => k.padEnd(20)).join(''));
for (const r of rows) console.log('  ' + String(r.at).padEnd(6) + KEYS.map(k => String(r[k]).padEnd(20)).join(''));
console.log('\n  ghosted context at the last sample: ' +
  Object.keys(ctx).map(k => k + '=' + ctx[k]).join(', '));
let bad = [];
for (const r of rows) for (const k of KEYS) if (!(r[k] >= (authored[k] || 1) - 1e-6)) bad.push(`${k}@${r.at}s=${r[k]} (authored ${authored[k]})`);
console.log('\nconsole: ' + (log.length ? log.join(' | ') : 'clean'));
console.log('offsite requests refused: ' + (offsite.length ? offsite.join(', ') : 'none'));
writeFileSync(`${OUT}/beat${BEAT}-compare-opacity.json`,
  JSON.stringify({ scene: scene.id, beat: BEAT, keys: KEYS, authored, samples: rows, context: ctx, console: log }, null, 2));
await browser.close(); server.close();
if (bad.length) { console.log('\nNOT LIT TOGETHER: ' + bad.join('; ')); process.exit(1); }
console.log(`\nALL ${KEYS.length} COMPARED STRUCTURES AT FULL AUTHORED OPACITY AT EVERY ONE OF ${rows.length} SAMPLES.`);
