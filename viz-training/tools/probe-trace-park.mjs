/* MedBank · PROBE: IS A TRACED BEAT'S PARKED CAMERA THE SAME ONE EVERY TIME?
 *
 * Written 2026-10-01 by the build run that fixed round-4 finding 3 on primitive-gut-tube, which was:
 * walk-scene-in-player reported beat 9 healthy on one run and CLIPPED on the next two, on identical
 * bytes. Every round of that item had quoted a single walk as proof. The review's own closing lesson
 * was "a single clean walk proves nothing here", and the fix it asked for -- run the walk three times
 * and require agreement -- costs about seven minutes a run because the walk measures a per-structure
 * share by rendering every beat twice per structure. That is the wrong instrument for the question.
 *
 * THIS PROBE ASKS ONLY THE CAMERA QUESTION, so it can ask it many times. It drives the SAME player
 * through the SAME DOM chips with the SAME waits as walk-scene-in-player -- nothing about ops,
 * painting or framing is reimplemented here either -- and then records, per beat:
 *   camera.position, controls.target, the viewing DIRECTION, the distance, and the subject's
 *   border-pixel count and span, using the walk's own definition of subject (a visible structure
 *   whose applied opacity is not below its authored opacity; anything ghosted by the player is
 *   context and is allowed off the edge).
 * It drops only the share loop. So its verdict on CLIPPED/span is the walk's verdict, and its verdict
 * on shares is nothing at all -- quote walk-scene-in-player for those, never this.
 *
 * WHY THE CAMERA IS THE RIGHT THING TO WATCH. viz3d skips frameView() entirely on a traced view
 * (applyView: `if (!traced) frameView(700)`), so a traced beat is framed by the trace's own last
 * flyTo and by nothing else. flyTo computes `to = pos + dir * dist` where `dir` is read from the
 * camera AT THE MOMENT THAT LEG STARTS and `dist` is frameDist(lastWaypointMesh) -- a size heuristic
 * on one mesh, not distanceForBox on the subject. The first leg fires synchronously inside runOps,
 * before the view's own ROTATE_TO_VIEW ease has moved anything, so `dir` is whatever direction the
 * PREVIOUS beat left the camera in; and every later leg inherits it. Hence: the parked frame is a
 * close-up of the last waypoint, aimed down the previous beat's axis. Run the beat alone and the
 * previous axis is the mount's; run it ninth and it is beat 8's, possibly mid-ease. That is the
 * nondeterminism, and the dir/dist columns below are what make it visible rather than inferred.
 *
 * Usage: node viz-training/tools/probe-trace-park.mjs <scene-id-or-path> [--runs 3] [--json OUT]
 * Exits non-zero if any beat's parked direction or span differs between runs, or if any beat clips.
 */
import { chromium } from 'playwright';
import { readFileSync, writeFileSync, mkdirSync, existsSync, readdirSync } from 'fs';
import http from 'http'; import path from 'path'; import fs from 'fs';
import { PNG } from 'pngjs';

const ROOT = process.cwd();
const args = process.argv.slice(2);
const argv = (f, d) => { const i = args.indexOf(f); return i >= 0 ? args[i + 1] : d; };
const who = args.find((a, i) => !a.startsWith('--') && !['--runs', '--json'].includes(args[i - 1]));
if (!who) { console.error('usage: probe-trace-park.mjs <scene-id-or-path> [--runs 3] [--json OUT]'); process.exit(2); }
const SCENE_PATH = existsSync(who) ? who : `viz-training/scenes/${who}.json`;
if (!existsSync(SCENE_PATH)) { console.error('no such scene: ' + SCENE_PATH); process.exit(2); }
const scene = JSON.parse(readFileSync(SCENE_PATH, 'utf8'));
const RUNS = Math.max(1, parseInt(argv('--runs', '3'), 10));
/* --idle MS: sit on each beat for this long BEFORE measuring it, to stand in for the time
   walk-scene-in-player spends in its per-structure share loop. The point is not realism for its own
   sake: the walk's verdict on these beats changes between runs and this probe's does not, and the
   share loop is the one thing the probe drops. If the clip reappears under --idle, the variable is
   how long the run takes and not anything in the scene. */
const IDLE = Math.max(0, parseInt(argv('--idle', '0'), 10));
const JSON_OUT = argv('--json', `viz-training/models-out/${scene.id}/trace-park.json`);
const W = 1040, H = 1040;
const MESH_DIR = 'viz-training/meshes';

const MIME = { '.js': 'text/javascript', '.json': 'application/json', '.html': 'text/html', '.stl': 'model/stl' };
const server = http.createServer((req, res) => {
  const p = path.join(ROOT, decodeURIComponent(req.url.split('?')[0]));
  fs.readFile(p, (e, buf) => {
    if (e) { res.writeHead(404); return res.end('no'); }
    res.writeHead(200, { 'content-type': MIME[path.extname(p)] || 'application/octet-stream' }); res.end(buf);
  });
});
await new Promise(r => server.listen(0, r));
const BASE = `http://127.0.0.1:${server.address().port}/`;

const OUT = `viz-training/models-out/${scene.id}/trace-park`;
mkdirSync(OUT, { recursive: true });
const page_html = `<!doctype html><meta charset=utf8><title>park</title><link rel="icon" href="data:,">
<body style="margin:0;background:#141225">
<div id="host" style="width:${W}px;height:${H}px"></div>
<script>window.MEDBANK_CONFIG = { MODEL_BASE: '${BASE}models3d/', MESH_BASE: '${BASE}${MESH_DIR}/', FEATURES: { MODEL3D: true } };
window.speechSynthesis = { speak(){}, cancel(){}, getVoices(){ return []; }, addEventListener(){} };
window.SpeechSynthesisUtterance = function(){ this.addEventListener = function(){}; };
<\/script>
<script src="${BASE}node_modules/three/build/three.js"><\/script>
<script src="${BASE}node_modules/three/examples/js/controls/TrackballControls.js"><\/script>
<script src="${BASE}node_modules/three/examples/js/controls/OrbitControls.js"><\/script>
<script src="${BASE}node_modules/three/examples/js/loaders/STLLoader.js"><\/script>
<script src="${BASE}viz3d.js"><\/script>`;
writeFileSync(`${OUT}/_park.html`, page_html);

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

const AUTHORED = {};
for (const st of scene.structures) AUTHORED[st.key] = (typeof st.opacity === 'number') ? Math.max(0.02, Math.min(1, st.opacity)) : 1;
const TRACED = new Set(scene.views.filter(v => (v.ops || []).some(o => o.op === 'TRACE_STRUCTURE')).map(v => v.beat));
const TH = 3;
function masks(img, BG) {
  let lit = 0, border = 0; let x0 = 1e9, y0 = 1e9, x1 = -1, y1 = -1;
  const w = img.width, h = img.height;
  for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
    const i = (y * w + x) * 4;
    if (Math.abs(img.data[i] - BG[0]) > TH || Math.abs(img.data[i+1] - BG[1]) > TH || Math.abs(img.data[i+2] - BG[2]) > TH) {
      lit++;
      if (x === 0 || y === 0 || x === w - 1 || y === h - 1) border++;
      if (x < x0) x0 = x; if (x > x1) x1 = x; if (y < y0) y0 = y; if (y > y1) y1 = y;
    }
  }
  return { lit, border, span: lit ? { w: (x1 - x0 + 1) / w, h: (y1 - y0 + 1) / h } : { w: 0, h: 0 }, px: w * h };
}

const runs = [];
for (let r = 1; r <= RUNS; r++) {
  const page = await browser.newPage({ viewport: { width: W + 40, height: H + 260 } });
  const log = [];
  page.on('console', m => { if (m.type() === 'error' || m.type() === 'warning') log.push(m.type() + ': ' + m.text()); });
  page.on('pageerror', e => log.push('pageerror: ' + e.message));
  await page.route('**/*', q => (q.request().url().startsWith(BASE) || q.request().url().startsWith('data:')
    || q.request().url().startsWith('blob:')) ? q.continue() : q.abort());
  await page.goto(`${BASE}${OUT}/_park.html`);
  await page.waitForFunction('window.MB3D && window.MB3D.mountScene');
  await page.evaluate(async (s) => {
    window.__p = await window.MB3D.mountScene(document.getElementById('host'), s, { via: 'probe' });
  }, scene);
  await page.waitForFunction('window.__p && window.__p.alive()', null, { timeout: 60000 });
  await page.evaluate(() => { window.__p.renderer.domElement
    .dispatchEvent(new PointerEvent('pointerdown', { bubbles: true })); });
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
  await page.evaluate(() => { for (const k of Object.keys(window.__p.meshes)) window.__p.meshes[k].visible = false; });
  await settleFrames();
  const bgPng = await shot();
  const BG = [bgPng.data[0], bgPng.data[1], bgPng.data[2]];

  const beats = [];
  for (let i = 0; i < scene.views.length; i++) {
    const v = scene.views[i];
    await page.evaluate(k => { document.querySelectorAll('#host .mb3d-chip')[k].click(); }, i);
    await page.waitForTimeout(1500);
    await page.evaluate(y => { window.__p.holder.rotation.y = y; window.__p.holder.updateMatrixWorld(true); },
      (scene.camera && scene.camera.initialYaw) || 0);
    await settleFrames(); await settleFrames();
    if (IDLE) { for (let q = 0; q < Math.ceil(IDLE / 1000); q++) { await page.waitForTimeout(1000); await settleFrames(); } }
    let traceWaitMs = 0;
    for (const o of (v.ops || [])) {
      if (o.op !== 'TRACE_STRUCTURE') continue;
      const n = Math.max(1, (o.path || []).length);
      traceWaitMs = Math.max(traceWaitMs, n * Math.max(1600, ((o.duration || 6) * 1000) / n) + 900 + 600);
    }
    if (traceWaitMs) {
      await page.waitForTimeout(traceWaitMs);
      await page.evaluate(y => { window.__p.holder.rotation.y = y; window.__p.holder.updateMatrixWorld(true); },
        (scene.camera && scene.camera.initialYaw) || 0);
      await settleFrames(); await settleFrames();
    }
    const cam = await page.evaluate(() => {
      const p = window.__p, c = p.camera.position, t = p.controls.target || { x: 0, y: 0, z: 0 };
      const d = { x: c.x - t.x, y: c.y - t.y, z: c.z - t.z };
      const L = Math.hypot(d.x, d.y, d.z) || 1;
      const painted = {};
      for (const k of Object.keys(p.meshes)) {
        const m = p.meshes[k]; if (!m.visible) continue;
        let op = null; m.traverse(n => { if (n.isMesh && op === null && !(n.userData && n.userData.outline)) op = n.material.opacity; });
        painted[k] = op == null ? (m.material ? m.material.opacity : 1) : op;
      }
      return { pos: [c.x, c.y, c.z], tgt: [t.x, t.y, t.z], dir: [d.x / L, d.y / L, d.z / L], dist: L, painted };
    });
    const vis = Object.keys(cam.painted);
    const ghosted = vis.filter(k => cam.painted[k] < (AUTHORED[k] == null ? 1 : AUTHORED[k]) - 1e-6);
    if (ghosted.length) await page.evaluate(ks => { for (const k of ks) window.__p.meshes[k].visible = false; }, ghosted);
    await settleFrames();
    const m = masks(await shot(), BG);
    if (ghosted.length) {
      await page.evaluate(ks => { for (const k of ks) window.__p.meshes[k].visible = true; }, ghosted);
      await settleFrames();
    }
    beats.push({ beat: v.beat, traced: TRACED.has(v.beat), title: v.title,
      dir: cam.dir.map(n => +n.toFixed(4)), dist: +cam.dist.toFixed(4),
      tgt: cam.tgt.map(n => +n.toFixed(4)),
      border: m.border, spanW: +m.span.w.toFixed(4), spanH: +m.span.h.toFixed(4),
      subject: vis.length - ghosted.length, visible: vis.length });
  }
  runs.push({ run: r, idleMs: IDLE, beats, console: log.filter(l => !/GPU stall due to ReadPixels/.test(l)) });
  console.log(`run ${r}:`);
  for (const b of beats) console.log(`  beat ${String(b.beat).padStart(2)} ${b.traced ? 'TRACED' : '      '} ` +
    `dir [${b.dir.join(', ')}] dist ${b.dist.toFixed(3)}  span ${(b.spanW*100).toFixed(0)}%x${(b.spanH*100).toFixed(0)}%  ` +
    `border ${b.border}${b.border ? '  <<< CLIPPED' : ''}`);
  await page.close();
}
await browser.close(); server.close();

/* ---- the verdict: does every beat land in the same place every run, and does any of them clip? ---- */
let bad = 0;
console.log(`\nAGREEMENT ACROSS ${RUNS} RUNS`);
for (let i = 0; i < scene.views.length; i++) {
  const col = runs.map(r => r.beats[i]);
  const dirs = [...new Set(col.map(b => b.dir.join(',')))];
  const spans = [...new Set(col.map(b => `${b.spanW}x${b.spanH}`))];
  const borders = [...new Set(col.map(b => b.border))];
  const stable = dirs.length === 1 && spans.length === 1 && borders.length === 1;
  const clips = col.some(b => b.border > 0);
  if (!stable || clips) bad++;
  console.log(`  beat ${String(col[0].beat).padStart(2)} ${col[0].traced ? 'TRACED' : '      '} ` +
    `${stable ? 'STABLE  ' : 'VARIES  '}${clips ? 'CLIPS   ' : 'in frame'}  ` +
    `dirs ${dirs.length} spans ${spans.length} borders [${borders.join('|')}]`);
}
const dirtyConsole = runs.filter(r => r.console.length);
mkdirSync(path.dirname(JSON_OUT), { recursive: true });
writeFileSync(JSON_OUT, JSON.stringify({ scene: scene.id, runs: RUNS, at: new Date().toISOString(), detail: runs }, null, 1));
console.log(`\n${bad === 0 ? 'EVERY BEAT PARKS IN THE SAME PLACE EVERY RUN AND NOTHING CLIPS'
  : bad + ' beat(s) either moved between runs or clipped'}`);
if (dirtyConsole.length) console.log(`console not clean on ${dirtyConsole.length} run(s): ` +
  dirtyConsole.map(r => r.console[0]).join(' | '));
console.log(`written ${JSON_OUT}`);
process.exit(bad === 0 && !dirtyConsole.length ? 0 : 1);
