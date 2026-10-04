/* MedBank · id-pick visibility probe for models3d/heart-external.js
 *
 * RENDER-STANDARD: "A REFERENCE MUST SURVIVE THE VIEW THAT USES IT — render with and without,
 * difference the frames, count." Review findings 6, 9 and 12 are all the same shape: a structure the
 * narration points at that occupies a fraction of a per cent of the frame it is drawn in. None of
 * them could have been caught by an area integral over the surface, because the question is not how
 * much surface a thing has, it is how many pixels of it a student can SEE once everything in front
 * of it has been drawn.
 *
 * So this renders each beat's layer set with every mesh flat-shaded in a unique colour keyed to its
 * userData.key, reads the pixels back and counts them. Occlusion is the renderer's own depth buffer,
 * which is the only honest source for it.
 *
 * Run from the repo root:  node viz-training/tools/measure-heart-external-visibility.mjs
 */
import { chromium } from 'playwright';
import http from 'http'; import path from 'path'; import fs from 'fs';

const ROOT = process.cwd();
const MIME = { '.js': 'text/javascript', '.json': 'application/json', '.html': 'text/html' };
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

const VIEWS = { anterior: [0, 0, 1], posterior: [0, 0, -1], inferior: [0, -1, 0], lateral: [1, 0, 0],
                superior: [0, 1, 0], ant_superior: [0, 0.7, 0.7] };

/* the beats whose visibility the review challenged, by the layer set each one mounts */
const CASES = [
  ['beat9_borders',          'anterior', { borders: true }],
  ['beat10_coronary_sulcus', 'anterior', { sulci: true }],
  ['auricles',               'anterior', { auricles: true }],
  ['beat11a_apex',           'lateral',  { poles: true }],
  ['beat11b_base',           'posterior',{ poles: true }],
  ['sulci_inferior',         'inferior', { sulci: true }],
  /* the review's own basis: borders on the bare shell, no great vessels in front of them, so this
     run's numbers can be compared with the 5.2% it reported rather than to a different frame */
  ['beat9_borders_bare',     'anterior', { borders: true, vessels: false }],
  ['beat10_sulcus_bare',     'anterior', { sulci: true, vessels: false }],
  ['superior_border_from_above', 'superior', { borders: true, vessels: false }],
  ['superior_border_oblique',    'ant_superior', { borders: true, vessels: false }],
];

const html = `<!doctype html><meta charset=utf8><link rel="icon" href="data:,">
<body style="margin:0;background:#000"><canvas id=c width=900 height=900></canvas>
<script src="${BASE}node_modules/three/build/three.js"><\/script>
<script src="${BASE}models3d/render-kit.js"><\/script>
<script src="${BASE}models3d/heart-external.js"><\/script>`;

/* the same executable the render harness finds — a bare chromium.launch() picks a headless-shell
   build that is not installed here and dies with "Executable doesn't exist" */
function findChromium() {
  const roots = [process.env.PLAYWRIGHT_BROWSERS_PATH || '/opt/pw-browsers'];
  const out = [];
  for (const r of roots) {
    if (!fs.existsSync(r)) continue;
    for (const d of fs.readdirSync(r)) {
      const p1 = path.join(r, d, 'chrome-linux', 'chrome');
      if (fs.existsSync(p1)) out.push(p1);
    }
  }
  return out[0];
}
const browser = await chromium.launch({ executablePath: findChromium(),
  args: ['--use-gl=swiftshader', '--enable-unsafe-swiftshader', '--no-sandbox'] });
const page = await browser.newPage({ viewport: { width: 900, height: 900 } });
await page.setContent(html);
await page.waitForFunction('window.MB3D_MODELS && window.MB3D_MODELS["heart-external"]');

const out = await page.evaluate(({ CASES, VIEWS }) => {
  const T = window.THREE, M = window.MB3D_MODELS['heart-external'];
  const cv = document.getElementById('c');
  const renderer = new T.WebGLRenderer({ canvas: cv, antialias: false, preserveDrawingBuffer: true });
  renderer.setClearColor(0x000000, 1);
  const res = {};
  for (const [name, view, opts] of CASES) {
    /* the heart shell is always mounted: a border drawn against nothing is not the beat */
    const g = M.build(1, Object.assign({}, opts));
    const keys = [];
    g.traverse(o => { if (o.isMesh && o.userData.key && keys.indexOf(o.userData.key) < 0) keys.push(o.userData.key); });
    g.traverse(o => {
      if (!o.isMesh) return;
      const i = keys.indexOf(o.userData.key) + 1;
      o.material = new T.MeshBasicMaterial({ color: new T.Color(((i * 37) % 256) / 255, ((i * 91) % 256) / 255, ((i * 173) % 256) / 255), side: T.DoubleSide });
      o.material.userData = { idx: i };
    });
    const scene = new T.Scene(); scene.add(g);
    const box = new T.Box3().setFromObject(g), c = box.getCenter(new T.Vector3()), s = box.getSize(new T.Vector3());
    const cam = new T.PerspectiveCamera(32, 1, 0.1, 400);
    const d = VIEWS[view], r = Math.max(s.x, s.y, s.z) * 1.9;
    cam.position.set(c.x + d[0] * r, c.y + d[1] * r, c.z + d[2] * r);
    cam.up.set(0, 1, 0); cam.lookAt(c); cam.updateProjectionMatrix();
    renderer.render(scene, cam);
    const gl = renderer.getContext();
    const px = new Uint8Array(900 * 900 * 4);
    gl.readPixels(0, 0, 900, 900, gl.RGBA, gl.UNSIGNED_BYTE, px);
    const counts = {}; let lit = 0;
    for (let i = 0; i < px.length; i += 4) {
      const r8 = px[i], g8 = px[i + 1], b8 = px[i + 2];
      if (r8 === 0 && g8 === 0 && b8 === 0) continue;
      lit++;
      let bestK = null;
      for (let k = 0; k < keys.length; k++) {
        const idx = k + 1;
        if (Math.abs(r8 - ((idx * 37) % 256)) <= 1 && Math.abs(g8 - ((idx * 91) % 256)) <= 1 && Math.abs(b8 - ((idx * 173) % 256)) <= 1) { bestK = keys[k]; break; }
      }
      if (bestK) counts[bestK] = (counts[bestK] || 0) + 1;
    }
    const frac = {};
    Object.keys(counts).sort((a, b) => counts[b] - counts[a]).forEach(k => { frac[k] = Math.round(10000 * counts[k] / lit) / 100; });
    res[name] = { view: view, lit_pixels: lit, percent_of_lit_frame: frac };
  }
  return res;
}, { CASES, VIEWS });

console.log(JSON.stringify(out, null, 1));
await browser.close(); server.close();
