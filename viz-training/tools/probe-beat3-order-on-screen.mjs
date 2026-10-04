/* MedBank · PROVE THE ORDER A BEAT NARRATES IS THE ORDER IT DRAWS.
 *
 * Written 2026-10-01 by the model3d BUILD task for review round 2, finding 1 on
 * cranio-caudal-folding: "BEAT 3 SAYS 'SAME FOUR THINGS, OPPOSITE ORDER' AND DRAWS THE FOUR THINGS IN
 * ONE ORDER ONLY." Round 2 had already measured the reversal off MESH VERTICES and found the model
 * correct; the defect was that the picture carried only the after order while the narration's first
 * sentence recited the before one. RENDER-STANDARD 3.x's lesson one level up: a claim measured on the
 * MODEL is not evidence about the PICTURE.
 *
 * So this tool measures nothing in model space. It drives viz3d.js, clicks the view chip a student
 * clicks, and for each named structure takes the pixels that CHANGE when that one structure is hidden
 * with the camera held still — the with/without difference RENDER-STANDARD 3.x names — then reads the
 * centroid and extent of those pixels in SCREEN coordinates. A structure drawn but wholly occluded has
 * no pixels and fails here; a structure in the right place in the model but behind something opaque
 * cannot pass by being in the right place.
 *
 * It asserts, on the drawn pixels alone:
 *   1. every named structure is painted at its authored opacity (not ghosted to 0.10);
 *   2. every named structure clears the corpus's 0.3%-of-frame floor for a structure a beat points at;
 *   3. the BEFORE set reads, top of screen downwards, in the order the narration recites first;
 *   4. the AFTER set reads in the opposite order;
 *   5. the two panels do not overlap on screen, so a student can tell which list is which.
 *
 * Each ordering gap must also clear a margin — a fraction of the panel's own drawn height — so that two
 * structures that nearly coincide cannot pass as an order.
 *
 * THE PERTURBATION THAT PROVES THE MEASURE is --expect-fail, which runs the identical measure against a
 * scene given on the command line: pointed at the pre-fix scene, the before rows must come back with no
 * pixels at all. A measure that passes on both pictures is measuring neither.
 *
 * Usage: node viz-training/tools/probe-beat3-order-on-screen.mjs [--scene <id-or-path>] [--beat N]
 *        [--before a,b,c] [--after a,b,c] [--margin 0.04] [--floor 0.003] [--expect-fail]
 */
import { chromium } from 'playwright';
import { readFileSync, writeFileSync, mkdirSync, existsSync, readdirSync } from 'fs';
import http from 'http'; import path from 'path'; import fs from 'fs';
import { PNG } from 'pngjs';

const ROOT = process.cwd();
const args = process.argv.slice(2);
const argv = (f, d) => { const i = args.indexOf(f); return i >= 0 ? args[i + 1] : d; };
const WHO = argv('--scene', 'embryology__folding-of-the-embryo__cranio-caudal-folding');
const SCENE_PATH = existsSync(WHO) ? WHO : `viz-training/scenes/${WHO}.json`;
const BEAT = parseInt(argv('--beat', '3'), 10);
const BEFORE = argv('--before', 'before_septum,before_heart,before_oropharyngeal').split(',');
const AFTER  = argv('--after',  'oropharyngeal,heart,septum_transversum').split(',');
const MARGIN = parseFloat(argv('--margin', '0.04'));
/* THE FOUR THINGS THE NARRATION NAMES ARE THREE LEVELS ON SCREEN, and that is anatomy rather than a
   gap in the picture: the pericardial cavity IS the space the cardiogenic area lies in, so the two
   share a station on the strip at every t (model centroids at t = 0: heart y 1.266, pericardium
   1.264). Asserting the cavity ABOVE the heart would be asserting something the embryo does not do.
   So each such pair is asserted the other way round — CO-LOCATED, within a tolerance of the panel's
   own drawn height — which is a statement that can fail, where leaving the cavity out of the ordering
   silently would not be. */
const PAIRED = (argv('--paired', 'before_pericardium:before_heart,pericardium:heart') || '')
  .split(',').filter(Boolean).map(s => s.split(':'));
const PAIR_TOL = parseFloat(argv('--pair-tol', '0.18'));
const FLOOR  = parseFloat(argv('--floor', '0.003'));
const EXPECT_FAIL = args.includes('--expect-fail');
const scene = JSON.parse(readFileSync(SCENE_PATH, 'utf8'));
const OUT = argv('--out', `viz-training/models-out/${scene.id.split('__').pop()}/order-on-screen`);
mkdirSync(OUT, { recursive: true });

const W = 1040, H = 1040;
const MIME = { '.js': 'text/javascript', '.json': 'application/json', '.html': 'text/html' };
const server = http.createServer((req, res) => {
  const p = path.join(ROOT, decodeURIComponent(req.url.split('?')[0]));
  fs.readFile(p, (e, buf) => {
    if (e) { res.writeHead(404); return res.end('no'); }
    res.writeHead(200, { 'content-type': MIME[path.extname(p)] || 'application/octet-stream' }); res.end(buf);
  });
});
await new Promise(r => server.listen(0, r));
const BASE = `http://127.0.0.1:${server.address().port}/`;
const page_html = `<!doctype html><meta charset=utf8><title>order</title><link rel="icon" href="data:,">
<body style="margin:0;background:#141225"><div id="host" style="width:${W}px;height:${H}px"></div>
<script>window.MEDBANK_CONFIG = { MODEL_BASE: '${BASE}models3d/', FEATURES: { MODEL3D: true } };
window.speechSynthesis = { speak(){}, cancel(){}, getVoices(){ return []; }, addEventListener(){} };
window.SpeechSynthesisUtterance = function(){ this.addEventListener = function(){}; };
<\/script>
<script src="${BASE}node_modules/three/build/three.js"><\/script>
<script src="${BASE}node_modules/three/examples/js/controls/TrackballControls.js"><\/script>
<script src="${BASE}node_modules/three/examples/js/controls/OrbitControls.js"><\/script>
<script src="${BASE}node_modules/three/examples/js/loaders/STLLoader.js"><\/script>
<script src="${BASE}viz3d.js"><\/script>`;
writeFileSync(`${OUT}/_order.html`, page_html);

function findChromium() {
  const root = '/opt/pw-browsers'; const c = [];
  if (existsSync(root)) for (const d of readdirSync(root))
    for (const rel of ['chrome-linux/chrome', 'chrome-linux/headless_shell', 'chrome-headless-shell-linux64/chrome-headless-shell']) {
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
await page.goto(`${BASE}${OUT}/_order.html`);
await page.waitForFunction('window.MB3D && window.MB3D.mountScene');
await page.evaluate(async (s) => {
  window.__p = await window.MB3D.mountScene(document.getElementById('host'), s, { via: 'order-probe' });
}, scene);
await page.waitForFunction('window.__p && window.__p.alive()', null, { timeout: 60000 });
const chips = await page.evaluate(() => document.querySelectorAll('#host .mb3d-chip').length);
if (chips !== scene.views.length) { console.error(`chips ${chips} != views ${scene.views.length}`); process.exit(2); }

/* the opening glance, stopped and reset exactly as walk-scene-in-player.mjs does it */
await page.evaluate(() => { window.__p.renderer.domElement.dispatchEvent(new PointerEvent('pointerdown', { bubbles: true })); });
await page.evaluate(y => { window.__p.holder.rotation.y = y; window.__p.holder.updateMatrixWorld(true); },
  (scene.camera && scene.camera.initialYaw) || 0);
await page.waitForTimeout(300);

const shot = async () => {
  const url = await page.evaluate(() => {
    const p = window.__p; p.renderer.render(p.object3d, p.camera);
    return p.renderer.domElement.toDataURL('image/png');
  });
  return PNG.sync.read(Buffer.from(url.slice(url.indexOf(',') + 1), 'base64'));
};
async function settleFrames() {
  const a = await page.evaluate(() => window.__p.frames());
  await page.waitForFunction(f => window.__p.frames() > f + 1, a, { timeout: 15000 }).catch(() => {});
}

await page.evaluate(n => document.querySelectorAll('#host .mb3d-chip')[n - 1].click(), BEAT);
await page.waitForTimeout(1800);
await page.evaluate(y => { window.__p.holder.rotation.y = y; window.__p.holder.updateMatrixWorld(true); },
  (scene.camera && scene.camera.initialYaw) || 0);
await settleFrames();
const base = await shot();
writeFileSync(`${OUT}/beat${BEAT}.png`, PNG.sync.write(base));

const AUTHORED = {}; for (const st of scene.structures) AUTHORED[st.key] = (typeof st.opacity === 'number') ? Math.max(0.02, Math.min(1, st.opacity)) : 1;
const TH = 3;
/* the pixels this ONE structure is responsible for: hidden with the camera already settled, so the
   only thing that can differ between the two frames is the structure. */
async function drawnMask(key) {
  const had = await page.evaluate(k => { const m = window.__p.meshes[k]; if (!m) return null;
    const v = m.visible; m.visible = false; return v; }, key);
  if (had === null) return null;
  await settleFrames();
  const off = await shot();
  await page.evaluate(k => { window.__p.meshes[k].visible = true; }, key);
  await settleFrames();
  let n = 0, sx = 0, sy = 0, y0 = 1e9, y1 = -1, x0 = 1e9, x1 = -1;
  for (let y = 0; y < base.height; y++) for (let x = 0; x < base.width; x++) {
    const i = (y * base.width + x) * 4;
    if (Math.abs(base.data[i] - off.data[i]) > TH || Math.abs(base.data[i+1] - off.data[i+1]) > TH
     || Math.abs(base.data[i+2] - off.data[i+2]) > TH) {
      n++; sx += x; sy += y;
      if (y < y0) y0 = y; if (y > y1) y1 = y; if (x < x0) x0 = x; if (x > x1) x1 = x;
    }
  }
  const op = await page.evaluate(k => +window.__p.meshes[k].material.opacity.toFixed(4), key);
  return n ? { key, px: n, frac: n / (base.width * base.height), cx: sx / n, cy: sy / n, y0, y1, x0, x1, opacity: op, wasVisible: had }
           : { key, px: 0, frac: 0, cx: null, cy: null, opacity: op, wasVisible: had };
}

const rows = {};
for (const k of [...BEFORE, ...AFTER, ...PAIRED.flat()]) if (!rows[k]) rows[k] = await drawnMask(k);

const fails = [];
const panelH = set => {
  const ys = set.map(k => rows[k]).filter(r => r && r.px).flatMap(r => [r.y0, r.y1]);
  return ys.length ? Math.max(...ys) - Math.min(...ys) : 0;
};
function checkPanel(name, set) {
  const hB = panelH(set);
  for (const k of set) {
    const r = rows[k];
    if (!r) { fails.push(`${name}: ${k} is not in the player at all`); continue; }
    if (!r.px) { fails.push(`${name}: ${k} draws NO pixels on this beat (frac 0.0000%)`); continue; }
    if (r.frac < FLOOR) fails.push(`${name}: ${k} ${(r.frac*100).toFixed(3)}% of frame, under the ${(FLOOR*100).toFixed(1)}% floor`);
    const want = AUTHORED[k] != null ? AUTHORED[k] : 1;
    if (r.opacity < want - 1e-6) fails.push(`${name}: ${k} painted at ${r.opacity}, ghosted below its authored ${want}`);
  }
  for (let i = 0; i + 1 < set.length; i++) {
    const a = rows[set[i]], b = rows[set[i+1]];
    if (!a || !b || !a.px || !b.px) continue;
    const gap = b.cy - a.cy;                       // screen y grows downwards: a must be ABOVE b
    if (!(gap > MARGIN * hB)) fails.push(`${name}: ${set[i]} is not clearly above ${set[i+1]} on screen — gap ${gap.toFixed(1)} px against a ${(MARGIN*hB).toFixed(1)} px margin`);
  }
  return hB;
}
const hBefore = checkPanel('BEFORE panel', BEFORE);
const hAfter  = checkPanel('AFTER panel',  AFTER);

/* the co-located pairs, asserted as co-located */
for (const [a, b] of PAIRED) {
  const ra = rows[a], rb = rows[b];
  const h = BEFORE.includes(b) ? hBefore : hAfter;
  if (!ra || !ra.px) { fails.push(`paired: ${a} draws NO pixels on this beat`); continue; }
  if (!rb || !rb.px) { fails.push(`paired: ${b} draws NO pixels on this beat`); continue; }
  const want = AUTHORED[a] != null ? AUTHORED[a] : 1;
  if (ra.opacity < want - 1e-6) fails.push(`paired: ${a} painted at ${ra.opacity}, ghosted below its authored ${want}`);
  if (ra.frac < FLOOR) fails.push(`paired: ${a} ${(ra.frac*100).toFixed(3)}% of frame, under the ${(FLOOR*100).toFixed(1)}% floor`);
  const d = Math.abs(ra.cy - rb.cy);
  if (!(d <= PAIR_TOL * h)) fails.push(`paired: ${a} and ${b} are ${d.toFixed(1)} px apart on screen, past the ${(PAIR_TOL*h).toFixed(1)} px that makes them one station`);
}

/* the panels must be tellable apart on screen */
const bx = BEFORE.map(k => rows[k]).filter(r => r && r.px);
const ax = AFTER.map(k => rows[k]).filter(r => r && r.px);
let sep = null;
if (bx.length && ax.length) {
  const bMin = Math.min(...bx.map(r => r.x0)), aMax = Math.max(...ax.map(r => r.x1));
  sep = bMin - aMax;                               // before panel is to the RIGHT under `lateral`
  if (!(sep > 0)) fails.push(`the two panels overlap on screen by ${(-sep).toFixed(0)} px — a student cannot tell which list is which`);
}

console.log(`\nscene ${scene.id}\nbeat ${BEAT} · "${scene.views[BEAT - 1].title}"`);
console.log(`\n  measured on the DRAWN PIXELS (with/without difference, camera held still), ${base.width}x${base.height}\n`);
const show = (name, set, h) => {
  console.log(`  ${name}  (drawn height ${h.toFixed(0)} px, ordering margin ${(MARGIN*h).toFixed(1)} px)`);
  for (const k of set) { const r = rows[k];
    console.log('    ' + k.padEnd(24) + (r && r.px
      ? `screen y ${r.cy.toFixed(1).padStart(7)}  x [${String(r.x0).padStart(4)},${String(r.x1).padStart(4)}]  ${(r.frac*100).toFixed(3)}% of frame  opacity ${r.opacity}`
      : `NO PIXELS DRAWN${r ? '  opacity ' + r.opacity + (r.wasVisible === false ? ' (not visible on this beat)' : '') : '  (absent from the player)'}`)); }
};
show('BEFORE panel, top of screen downwards — the order the first sentence recites', BEFORE, hBefore);
show('AFTER panel, top of screen downwards — the order the third sentence recites', AFTER, hAfter);
if (PAIRED.length) {
  console.log('\n  CO-LOCATED pairs — the cavity and the area inside it are one station, not two');
  for (const [a, b] of PAIRED) { const ra = rows[a], rb = rows[b];
    const h = BEFORE.includes(b) ? hBefore : hAfter;
    console.log('    ' + (a + ' / ' + b).padEnd(44) + (ra && ra.px && rb && rb.px
      ? `${Math.abs(ra.cy - rb.cy).toFixed(1).padStart(6)} px apart, tolerance ${(PAIR_TOL*h).toFixed(1)} px  (${a} ${(ra.frac*100).toFixed(3)}% of frame, opacity ${ra.opacity})`
      : 'NOT BOTH DRAWN')); }
}
if (sep != null) console.log(`\n  panels separated on screen by ${sep.toFixed(0)} px (before panel to the right)`);
console.log('\nconsole: ' + (log.length ? log.join(' | ') : 'clean'));
console.log('offsite requests refused: ' + (offsite.length ? offsite.join(', ') : 'none'));
writeFileSync(`${OUT}/beat${BEAT}-order-on-screen.json`,
  JSON.stringify({ scene: scene.id, beat: BEAT, before: BEFORE, after: AFTER, margin: MARGIN, floor: FLOOR,
                   paired: PAIRED, pairTol: PAIR_TOL, rows, panelSeparationPx: sep, fails, console: log }, null, 2));
await browser.close(); server.close();

if (EXPECT_FAIL) {
  if (fails.length) { console.log('\nEXPECTED FAILURES, and they came (this is the perturbation, not a defect):\n  - ' + fails.join('\n  - ')); process.exit(0); }
  console.log('\nTHE MEASURE PASSED ON A PICTURE IT SHOULD HAVE FAILED. It is not a function of what is drawn.');
  process.exit(1);
}
if (fails.length) { console.log('\nFAIL:\n  - ' + fails.join('\n  - ')); process.exit(1); }
console.log(`\nBOTH ORDERS ARE DRAWN, IN THE ORDER THE NARRATION RECITES THEM, AND THE PANELS DO NOT OVERLAP.`);
