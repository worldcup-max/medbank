/* Render every view of the cardiac-looping scene THE WAY THE PLAYER BUILDS IT: through viz3d.js's
   own procedural adapter, one merged mesh per structure, with the view's SHOW/HIDE/ROTATE ops
   applied. This is the "would a student recognise it" check, and it is also the only check that
   proves two consecutive views do not render the same frame. */
import { chromium } from 'playwright';
import { readFileSync, writeFileSync, mkdirSync } from 'fs';
import http from 'http'; import path from 'path'; import fs from 'fs';
import crypto from 'crypto';

const ROOT = process.cwd();
const OUT = 'viz-training/models-out/cardiac-looping/views';
mkdirSync(OUT, { recursive: true });
const MIME = { '.js':'text/javascript', '.json':'application/json', '.html':'text/html' };
const server = http.createServer((req,res)=>{ const p=path.join(ROOT, decodeURIComponent(req.url.split('?')[0]));
  fs.readFile(p,(e,b)=>{ if(e){res.writeHead(404);return res.end('no');} res.writeHead(200,{'content-type':MIME[path.extname(p)]||'application/octet-stream'}); res.end(b); }); });
await new Promise(r=>server.listen(0,r));
const BASE = `http://127.0.0.1:${server.address().port}/`;
const scene = JSON.parse(readFileSync('viz-training/scenes/embryology__cardiovascular-development__cardiac-looping.json','utf8'));

const W = 900, H = 1050;
const html = `<!doctype html><meta charset=utf8><link rel="icon" href="data:,"><body style="margin:0;background:#0e1626">
<canvas id=c width=${W} height=${H}></canvas>
<script src="${BASE}node_modules/three/build/three.js"><\/script>
<script>window.MEDBANK_CONFIG = { MODEL_BASE: '${BASE}models3d/' };<\/script>
<script src="${BASE}models3d/render-kit.js"><\/script>
<script src="${BASE}viz3d.js"><\/script>
<script>
const renderer = new THREE.WebGLRenderer({ canvas: document.getElementById('c'), antialias: true });
renderer.setSize(${W}, ${H}, false); renderer.setPixelRatio(1);
VizKit.configureRenderer(renderer);
const scene3 = new THREE.Scene(); scene3.background = VizKit.bg(0x0e1626);
const L = VizKit.standardLights(scene3);
const camera = new THREE.PerspectiveCamera(32, ${W}/${H}, 0.1, 400);
const MESHES = {};
window.loadAll = function (structures) {
  const ad = window.MB3D.adapters.procedural;
  return Promise.all(structures.map(function (s) {
    return ad.load(window.THREE, s).then(function (r) {
      if (r && r.mesh) { MESHES[s.key] = r.mesh; r.mesh.visible = false; scene3.add(r.mesh); }
      return { key: s.key, ok: !!(r && r.mesh) };
    });
  }));
};
const DIR = { anterior:[0,0,1], posterior:[0,0,-1], lateral:[1,0,0], medial:[-1,0,0], superior:[0,1,0.001], inferior:[0,-1,0.001] };
window.renderView = function (shown, viewName, highlight) {
  Object.keys(MESHES).forEach(function (k) {
    const m = MESHES[k];
    m.visible = shown.indexOf(k) >= 0;
    m.material.emissive = new THREE.Color(0x000000);
    if (highlight && highlight.indexOf(k) >= 0) m.material.emissive = m.material.color.clone().multiplyScalar(0.35);
  });
  const box = new THREE.Box3();
  shown.forEach(function (k) { if (MESHES[k]) box.expandByObject(MESHES[k]); });
  const c = box.getCenter(new THREE.Vector3()), sz = box.getSize(new THREE.Vector3());
  const r = Math.max(sz.x, sz.y, sz.z) * 0.5 || 1;
  const d = DIR[viewName] || DIR.anterior;
  const dist = r / Math.tan(32 * Math.PI / 360) * 1.35;
  camera.position.set(c.x + d[0]*dist, c.y + d[1]*dist, c.z + d[2]*dist);
  camera.up.set(0, viewName === 'superior' || viewName === 'inferior' ? 0 : 1, viewName === 'superior' || viewName === 'inferior' ? -1 : 0);
  camera.lookAt(c);
  L.key.position.set(camera.position.x + 6, camera.position.y + 8, camera.position.z + 4);
  renderer.render(scene3, camera);
  return true;
};
<\/script>`;
writeFileSync(OUT + '/_scene.html', html);

const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium-1194/chrome-linux/chrome',
  args: ['--use-gl=swiftshader','--enable-unsafe-swiftshader','--no-sandbox'] });
const p = await b.newPage({ viewport: { width: W, height: H } });
const log = [];
p.on('console', m => log.push({ type: m.type(), text: m.text() }));
p.on('pageerror', e => log.push({ type: 'pageerror', text: String(e && e.message || e) }));
await p.goto(BASE + OUT + '/_scene.html');
await p.waitForFunction('typeof window.loadAll === "function"');
const loaded = await p.evaluate(st => window.loadAll(st), scene.structures);
const missing = loaded.filter(r => !r.ok);

const hashes = [];
for (const v of scene.views) {
  const shown = v.ops.filter(o => o.op === 'SHOW_STRUCTURE').map(o => o.target);
  const rot = (v.ops.find(o => o.op === 'ROTATE_TO_VIEW') || {}).view || 'anterior';
  const hi = v.ops.filter(o => o.op === 'HIGHLIGHT_STRUCTURE').map(o => o.target);
  await p.evaluate(([s2, r2, h2]) => window.renderView(s2, r2, h2), [shown, rot, hi]);
  const file = `${OUT}/view-${String(v.beat).padStart(2,'0')}.png`;
  await p.locator('#c').screenshot({ path: file });
  hashes.push({ beat: v.beat, title: v.title, rot, shown: shown.length,
    hash: crypto.createHash('sha1').update(readFileSync(file)).digest('hex').slice(0, 12) });
}
await b.close(); server.close();

const NOISE = /GPU stall due to ReadPixels|GL Driver Message|SwiftShader/i;
const bad = log.filter(m => (m.type==='error'||m.type==='warning'||m.type==='pageerror') && !NOISE.test(m.text));
console.log('structures loaded:', loaded.length - missing.length + '/' + loaded.length, missing.length ? 'MISSING ' + missing.map(m=>m.key).join(',') : '');
console.log('console:', bad.length ? 'DIRTY ' + bad.map(x=>x.type+': '+x.text).join(' | ') : 'clean');
const seen = {};
for (const h of hashes) {
  const dup = seen[h.hash];
  console.log('  view', String(h.beat).padStart(2), h.rot.padEnd(9), h.shown + ' parts', h.hash, dup ? '<<< IDENTICAL TO VIEW ' + dup : '', '|', h.title);
  seen[h.hash] = h.beat;
}
const dups = hashes.length - new Set(hashes.map(h=>h.hash)).size;
console.log('pixel-identical view pairs:', dups);
writeFileSync(OUT + '/frames.json', JSON.stringify({ hashes, missing, console: bad }, null, 1));
process.exit(bad.length || missing.length || dups ? 1 : 0);
