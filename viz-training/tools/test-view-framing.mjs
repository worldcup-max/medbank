/* MedBank · viz-training · test-view-framing
 *
 * viz3d.js frames a view with its own distanceForBox(), and render-kit.js frames a model with
 * VizKit.fitCamera(). Two copies of the same geometry is exactly what RENDER-STANDARD §6 forbids —
 * so this asserts they are not two answers. For every world-axis viewing direction and a spread of
 * box shapes and aspect ratios, the player's distance must equal the kit's.
 *
 * The player cannot simply CALL VizKit.fitCamera: VizKit arrives with a procedural model, and a
 * BodyParts3D scene loads no model, so the call would frame the procedural scenes and throw on the
 * mesh ones. This test is what stands in for the call.
 *
 * It also checks the two properties the fix depends on and that no picture can show you:
 *   · the fitted subject is inside the frustum, with the margin actually left over;
 *   · the near-face term is real — a deep box fitted without it crops.
 *
 *   node viz-training/tools/test-view-framing.mjs
 */
import { chromium } from 'playwright';
import http from 'http'; import path from 'path'; import fs from 'fs';

const ROOT = process.cwd();
const MIME = { '.js': 'text/javascript', '.json': 'application/json', '.html': 'text/html' };
const server = http.createServer((req, res) => {
  const p = path.join(ROOT, decodeURIComponent(req.url.split('?')[0]));
  fs.readFile(p, (e, b) => { if (e) { res.writeHead(404); return res.end('no'); }
    res.writeHead(200, { 'content-type': MIME[path.extname(p)] || 'application/octet-stream' }); res.end(b); });
});
await new Promise(r => server.listen(0, r));
const BASE = `http://127.0.0.1:${server.address().port}/`;

const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium-1194/chrome-linux/chrome',
  args: ['--use-gl=swiftshader', '--enable-unsafe-swiftshader', '--no-sandbox'] });
const p = await b.newPage({ viewport: { width: 900, height: 700 } });
const errs = [];
p.on('pageerror', e => errs.push(String((e && e.message) || e)));
await p.setContent(`<!doctype html><meta charset=utf8><body>
<script src="${BASE}node_modules/three/build/three.js"><\/script>
<script src="${BASE}models3d/render-kit.js"><\/script>`, { waitUntil: 'load' });

const out = await p.evaluate(() => {
  const T = window.THREE, K = window.VizKit;
  const FRAME_PAD = 1.05;
  /* the function under test, copied from viz3d.js verbatim except for the camera it reads */
  function distanceForBox(camera, size, dir) {
    const vHalf = camera.fov * Math.PI / 360;
    const hHalf = Math.atan(Math.tan(vHalf) * (camera.aspect || 1));
    let up = Math.abs(dir.y) > 0.99 ? new T.Vector3(0, 0, -1) : new T.Vector3(0, 1, 0);
    const right = new T.Vector3().crossVectors(up, dir).normalize();
    up = new T.Vector3().crossVectors(dir, right).normalize();
    const hx = size.x / 2, hy = size.y / 2, hz = size.z / 2;
    const ext = a => Math.abs(a.x) * hx + Math.abs(a.y) * hy + Math.abs(a.z) * hz;
    return Math.max(ext(up) / Math.tan(Math.max(0.05, vHalf)),
                    ext(right) / Math.tan(Math.max(0.05, hHalf))) * FRAME_PAD + ext(dir);
  }
  const boxes = [[1,1,1],[0.4,2.2,0.7],[3.1,0.6,0.9],[0.2,0.2,4],[2,2,0.1],[0.05,1.7,0.05],[1.3,0.9,2.6]];
  const aspects = [2.29, 1.6, 1.0, 0.55];
  const rows = [];
  /* AGREEMENT with the kit. fitCamera assumes the camera looks down +z, so that is the direction
     compared; the generalisation is what is being checked against it, not a different formula. */
  for (const a of aspects) for (const [sx, sy, sz] of boxes) {
    const cam = new T.PerspectiveCamera(45, a, 0.01, 4000);
    const g = new T.Mesh(new T.BoxGeometry(sx, sy, sz), new T.MeshBasicMaterial());
    const kit = K.fitCamera(cam, g, FRAME_PAD).distance;
    const mine = distanceForBox(cam, new T.Vector3(sx, sy, sz), new T.Vector3(0, 0, 1));
    rows.push({ test: 'agrees-with-kit', aspect: a, box: [sx, sy, sz], kit: +kit.toFixed(6), player: +mine.toFixed(6),
                ok: Math.abs(kit - mine) < 1e-6 });
  }
  /* CONTAINMENT, in every direction the ops can ask for, including from directly above. Project the
     box corners and require them inside the NDC cube — and report the margin that is left. */
  const DIRS = { anterior:[0,0,1], posterior:[0,0,-1], lateral:[1,0,0], medial:[-1,0,0], superior:[0,1,0.001], inferior:[0,-1,0.001] };
  for (const a of aspects) for (const [sx, sy, sz] of boxes) for (const name of Object.keys(DIRS)) {
    const cam = new T.PerspectiveCamera(45, a, 0.01, 4000);
    const dir = new T.Vector3().fromArray(DIRS[name]).normalize();
    const d = distanceForBox(cam, new T.Vector3(sx, sy, sz), dir);
    cam.position.copy(dir.clone().multiplyScalar(d));
    cam.up.set(0, Math.abs(dir.y) > 0.99 ? 0 : 1, Math.abs(dir.y) > 0.99 ? -1 : 0);
    cam.lookAt(0, 0, 0); cam.updateMatrixWorld(true); cam.updateProjectionMatrix();
    let mx = 0, my = 0;
    for (let i = 0; i < 8; i++) {
      const v = new T.Vector3(i & 1 ? sx / 2 : -sx / 2, i & 2 ? sy / 2 : -sy / 2, i & 4 ? sz / 2 : -sz / 2).project(cam);
      mx = Math.max(mx, Math.abs(v.x)); my = Math.max(my, Math.abs(v.y));
    }
    const fill = Math.max(mx, my);
    rows.push({ test: 'contains', aspect: a, box: [sx, sy, sz], dir: name,
                fillPct: +(fill * 100).toFixed(1), ok: fill <= 1.0 && fill > 0.55 });
  }
  /* THE NEAR-FACE TERM IS DOING WORK. Drop it and a deep box must crop — otherwise it is decoration
     and the next person to tidy it away would never find out. */
  {
    const cam = new T.PerspectiveCamera(45, 1.6, 0.01, 4000);
    const size = new T.Vector3(1, 1, 2);
    const dir = new T.Vector3(0, 0, 1);
    const d = distanceForBox(cam, size, dir) - size.z / 2;     // the fit WITHOUT the near-face term
    cam.position.set(0, 0, d); cam.lookAt(0, 0, 0); cam.updateMatrixWorld(true); cam.updateProjectionMatrix();
    const v = new T.Vector3(0.5, 0.5, 1).project(cam);          // the near-top-right corner
    rows.push({ test: 'near-face-term-matters', crops_without_it: Math.max(Math.abs(v.x), Math.abs(v.y)) > 1,
                ok: Math.max(Math.abs(v.x), Math.abs(v.y)) > 1 });
  }
  return rows;
});
const bad = out.filter(r => !r.ok);
console.log(JSON.stringify({ checks: out.length, failed: bad.length, failures: bad,
  fillRange: (() => { const f = out.filter(r => r.test === 'contains').map(r => r.fillPct); return [Math.min(...f), Math.max(...f)]; })(),
  pageErrors: errs }, null, 2));
await b.close(); server.close();
process.exit(bad.length || errs.length ? 1 : 0);
