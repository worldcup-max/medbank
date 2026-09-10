/* MedBank · viz-training · measure-view-framing
 *
 * Measures how much of the canvas the SUBJECT of each view actually fills — in the REAL player,
 * through MB3D.mountScene() and by clicking the view chips a student clicks, not in a bespoke
 * harness with its own camera. The harness in render-scene-views.mjs fits its own camera per view,
 * so it would have shown this bug as fixed while the player was still broken: test on the substrate.
 *
 * Pixels are read with gl.readPixels() straight after an explicit render, so no preserveDrawingBuffer
 * is needed and what is measured is what the student sees.
 *
 *   node viz-training/tools/measure-view-framing.mjs [--scene <id>] [--shots <dir>]
 */
import { chromium } from 'playwright';
import { readFileSync, writeFileSync, mkdirSync } from 'fs';
import http from 'http'; import path from 'path'; import fs from 'fs';

const ROOT = process.cwd();
const args = process.argv.slice(2);
const argOf = (n, d) => { const i = args.indexOf(n); return i >= 0 ? args[i + 1] : d; };
const SCENE_ID = argOf('--scene', 'embryology__cardiovascular-development__cardiac-looping');
const SHOTS = argOf('--shots', null);
if (SHOTS) mkdirSync(SHOTS, { recursive: true });

const MIME = { '.js': 'text/javascript', '.json': 'application/json', '.html': 'text/html', '.css': 'text/css' };
const server = http.createServer((req, res) => {
  const p = path.join(ROOT, decodeURIComponent(req.url.split('?')[0]));
  fs.readFile(p, (e, b) => {
    if (e) { res.writeHead(404); return res.end('no'); }
    res.writeHead(200, { 'content-type': MIME[path.extname(p)] || 'application/octet-stream' });
    res.end(b);
  });
});
await new Promise(r => server.listen(0, r));
const BASE = `http://127.0.0.1:${server.address().port}/`;
const scene = JSON.parse(readFileSync(`viz-training/scenes/${SCENE_ID}.json`, 'utf8'));

const W = 1280, H = 900;
const html = `<!doctype html><meta charset=utf8><link rel="icon" href="data:,">
<body style="margin:0;background:#0e1626">
<div id="host" style="position:absolute;inset:0"></div>
<script>window.MEDBANK_CONFIG = { MODEL_BASE: '${BASE}models3d/', MESH_BASE: '${BASE}viz-training/meshes-lite/', FEATURES: { MODEL3D: true } };<\/script>
<script src="${BASE}node_modules/three/build/three.js"><\/script>
<script src="${BASE}node_modules/three/examples/js/controls/TrackballControls.js"><\/script>
<script src="${BASE}node_modules/three/examples/js/controls/OrbitControls.js"><\/script>
<script src="${BASE}node_modules/three/examples/js/loaders/STLLoader.js"><\/script>
<script src="${BASE}models3d/render-kit.js"><\/script>
<script src="${BASE}viz3d.js"><\/script>
<script>
window.__scene = null;
window.mountIt = function (sc) { window.__scene = sc; return MB3D.mountScene(document.getElementById('host'), sc, {}).then(function(){ return true; }); };
/* Coverage of the SUBJECT as a student sees it: read the framebuffer after an explicit render and
   find the bounding box of everything that is not the background clear colour. */
window.measure = function () {
  var p = MB3D.player(); if (!p) return null;
  p.controls.autoRotate = false;
  p.renderer.render(p.object3d, p.camera);
  var gl = p.renderer.getContext();
  var w = gl.drawingBufferWidth, h = gl.drawingBufferHeight;
  var buf = new Uint8Array(w * h * 4);
  gl.readPixels(0, 0, w, h, gl.RGBA, gl.UNSIGNED_BYTE, buf);
  var br = buf[0], bg = buf[1], bb = buf[2];      // corner pixel IS the clear colour
  var minx = 1e9, maxx = -1e9, miny = 1e9, maxy = -1e9, lit = 0;
  for (var y = 0; y < h; y++) for (var x = 0; x < w; x++) {
    var i = (y * w + x) * 4;
    var d = Math.abs(buf[i] - br) + Math.abs(buf[i+1] - bg) + Math.abs(buf[i+2] - bb);
    if (d > 18) { lit++; if (x < minx) minx = x; if (x > maxx) maxx = x; if (y < miny) miny = y; if (y > maxy) maxy = y; }
  }
  if (lit === 0) return { lit: 0, wpct: 0, hpct: 0, areapct: 0, w: w, h: h };
  return {
    lit: lit, w: w, h: h,
    wpct: +(((maxx - minx + 1) / w) * 100).toFixed(1),
    hpct: +(((maxy - miny + 1) / h) * 100).toFixed(1),
    areapct: +((lit / (w * h)) * 100).toFixed(2)
  };
};
/* An INDEPENDENT read of the same question, geometric rather than photographic: project the corners
   of every SUBJECT mesh's world box and see what fraction of the frame they span. It does not consult
   the player's own framing state — a mesh at full opacity is the subject, one ghosted to 10% is
   context — so it cannot agree with frameView() by construction. The yaw argument spins the holder,
   is what the opening spin and every drag do, to check the fit survives the rotation it will get. */
window.extent = function (yaw) {
  var p = MB3D.player(); if (!p) return null;
  var y0 = p.holder.rotation.y;
  if (yaw) p.holder.rotation.y = y0 + yaw;
  p.holder.updateMatrixWorld(true);
  p.camera.updateMatrixWorld(true); p.camera.updateProjectionMatrix();
  var minx = 1e9, maxx = -1e9, miny = 1e9, maxy = -1e9, n = 0;
  Object.keys(p.meshes).forEach(function (k) {
    var m = p.meshes[k];
    if (!m || !m.visible || m.material.opacity < 0.5) return;   // ghosted context is not the subject
    if (!m.geometry.boundingBox) m.geometry.computeBoundingBox();
    var bb = m.geometry.boundingBox;
    for (var i = 0; i < 8; i++) {
      var v = new THREE.Vector3(i & 1 ? bb.max.x : bb.min.x, i & 2 ? bb.max.y : bb.min.y, i & 4 ? bb.max.z : bb.min.z);
      m.localToWorld(v); v.project(p.camera); n++;
      if (v.x < minx) minx = v.x; if (v.x > maxx) maxx = v.x;
      if (v.y < miny) miny = v.y; if (v.y > maxy) maxy = v.y;
    }
  });
  p.holder.rotation.y = y0; p.holder.updateMatrixWorld(true);
  if (!n) return null;
  return {
    fillW: +(((maxx - minx) / 2) * 100).toFixed(1),
    fillH: +(((maxy - miny) / 2) * 100).toFixed(1),
    clipped: (minx < -1 || maxx > 1 || miny < -1 || maxy > 1)
  };
};
window.chipCount = function () { return document.querySelectorAll('.mb3d-chip').length; };
window.clickChip = function (i) { var c = document.querySelectorAll('.mb3d-chip'); if (!c[i]) return false; c[i].click(); return true; };
<\/script>`;
mkdirSync('viz-training/models-out/_framing', { recursive: true });
writeFileSync('viz-training/models-out/_framing/_player.html', html);

const b = await chromium.launch({
  executablePath: '/opt/pw-browsers/chromium-1194/chrome-linux/chrome',
  args: ['--use-gl=swiftshader', '--enable-unsafe-swiftshader', '--no-sandbox']
});
const p = await b.newPage({ viewport: { width: W, height: H } });
const log = [];
p.on('console', m => log.push({ type: m.type(), text: m.text() }));
p.on('pageerror', e => log.push({ type: 'pageerror', text: String((e && e.message) || e) }));
p.on('requestfailed', r => log.push({ type: 'requestfailed', text: r.url() + ' — ' + (r.failure() || {}).errorText }));
p.on('response', r => { if (r.status() >= 400) log.push({ type: 'http' + r.status(), text: r.url() }); });
await p.goto(BASE + 'viz-training/models-out/_framing/_player.html');
await p.waitForFunction('typeof window.mountIt === "function"');
await p.evaluate(sc => window.mountIt(sc), scene);
await p.waitForTimeout(4000);            // the 3s opening spin, then settle

const n = await p.evaluate(() => window.chipCount());
const rows = [];
for (let i = 0; i < n; i++) {
  await p.evaluate(k => window.clickChip(k), i);
  await p.waitForTimeout(2200);          // any camera easing has landed
  const m = await p.evaluate(() => window.measure());
  const e = await p.evaluate(() => window.extent(0));
  const spun = [];
  for (const yaw of [0.9, 1.8, 2.7, 3.6, 4.5, 5.4]) spun.push(await p.evaluate(y => window.extent(y), yaw));
  rows.push({ view: i + 1, title: (scene.views[i] || {}).title || '', ...m,
              fillW: e && e.fillW, fillH: e && e.fillH,
              clippedAtRest: !!(e && e.clipped),
              clippedUnderSpin: spun.some(x => x && x.clipped),
              worstFillUnderSpin: Math.max(...spun.map(x => (x ? Math.max(x.fillW, x.fillH) : 0))) });
  if (SHOTS) await p.screenshot({ path: `${SHOTS}/view-${String(i + 1).padStart(2, '0')}.png` });
}
const noisy = log.filter(l => !/^warning$/.test(l.type) || !/GPU stall due to ReadPixels/.test(l.text));
console.log(JSON.stringify({ scene: SCENE_ID, canvas: rows[0] && { w: rows[0].w, h: rows[0].h }, views: rows, console: noisy }, null, 2));
await b.close(); server.close();
