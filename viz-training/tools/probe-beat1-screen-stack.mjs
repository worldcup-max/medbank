/* MedBank · probe · WHAT ORDER DOES A STUDENT SEE THE GERM LAYERS IN, ON SCREEN?
 *
 *   node viz-training/tools/probe-beat1-screen-stack.mjs
 *
 * WHY THIS EXISTS. Round 1's blocking finding on
 * `embryology__week-3-gastrulation__trilaminar-disc-3-germ-layers` was that beat 1 draws the disc
 * VENTRAL-SIDE-UP: a student reads the three germ layers in inverted order under a title that says
 * "the right way up". Every existing check passed it. They passed it because every one of them
 * measures the model in WORLD space — `stackInverted` reads the dorso-ventral order of the bodies and
 * is correct — and the defect is not in the model at all. It is in the CAMERA: viz3d.js never assigns
 * `camera.up`, so it keeps THREE's default (0,1,0), and `VIEW_DIR.inferior` is [0,-1,0.001], very
 * nearly antiparallel to it. The up vector therefore falls out of the 0.001 tilt alone, and screen-up
 * lands on world +z, which this model declares to be VENTRAL.
 *
 * So this probe measures the one thing nothing else did: the order on the SCREEN, through the same
 * camera construction viz3d uses, plus what is actually VISIBLE once occlusion is accounted for.
 *
 * TWO MEASURES, because either alone can pass while the picture is wrong:
 *
 *   SCREEN ORDER — each shown part's centroid projected onto the camera's own screen-up axis, taken
 *   from the camera's world matrix AFTER lookAt rather than from algebra about what it ought to be.
 *   This is what catches the inversion.
 *
 *   VISIBLE PIXELS — the composition re-rendered with every mesh flat-shaded in a unique ID colour,
 *   counted per part. That is occlusion-aware: a part hidden behind another scores zero however
 *   correctly it is placed. This is what catches the OTHER half of the finding — that at t = 0.40 the
 *   view which fixes the order hides the middle sheet, because BLK_Y1 = 3.20 is cranial to the
 *   mesoderm front and the outer two sheets close over it at the block's cranial face.
 *
 * A candidate (view, t) is only a fix if it passes BOTH.
 */
import { chromium } from 'playwright';
import http from 'http';
import path from 'path';
import fs from 'fs';

const ROOT = process.cwd();
const MODEL = 'trilaminar-disc-3-germ-layers';
const MIME = { '.js': 'text/javascript', '.mjs': 'text/javascript', '.json': 'application/json', '.html': 'text/html' };
const server = http.createServer((req, res) => {
  const p = path.join(ROOT, decodeURIComponent(req.url.split('?')[0]));
  fs.readFile(p, (e, buf) => {
    if (e) { res.writeHead(404); res.end('no'); return; }
    res.writeHead(200, { 'Content-Type': MIME[path.extname(p)] || 'application/octet-stream' });
    res.end(buf);
  });
});
await new Promise(r => server.listen(0, r));
const BASE = 'http://127.0.0.1:' + server.address().port + '/';

const browser = await chromium.launch({ args: ['--use-gl=swiftshader', '--enable-unsafe-swiftshader'] });
const page = await browser.newPage();
const msgs = [];
page.on('console', m => msgs.push({ type: m.type(), text: m.text() }));
page.on('pageerror', e => msgs.push({ type: 'pageerror', text: String(e) }));
await page.setContent('<canvas id="c" width="1100" height="900"></canvas>');
await page.addScriptTag({ url: BASE + 'viz-training/spike/three.min.js' });
await page.addScriptTag({ url: BASE + 'models3d/render-kit.js' });
await page.addScriptTag({ url: BASE + 'models3d/' + MODEL + '.js' });

/* viz3d.js's own table, copied verbatim from viz3d.js:2095. The 0.001 is viz3d's, not this probe's. */
const VIEW_DIR = { anterior: [0,0,1], posterior: [0,0,-1], lateral: [1,0,0], medial: [-1,0,0],
                   superior: [0,1,0.001], inferior: [0,-1,0.001] };

/* beat 1's shown list, in the scene's own order. ectoderm is DORSAL, yolk_sac is VENTRAL. */
const KEYS = ['ectoderm', 'mesoderm', 'endoderm', 'amnion', 'yolk_sac'];
/* what "the right way up" means, dorsal first — the order the narration promises, top to bottom. */
const WANT = ['amnion', 'ectoderm', 'mesoderm', 'endoderm', 'yolk_sac'];

async function probe(view, t) {
  return await page.evaluate(({ view, t, dir, keys }) => {
    const T = window.THREE, K = window.VizKit, M = window.MB3D_MODELS['trilaminar-disc-3-germ-layers'];
    const cv = document.getElementById('c');
    const r = window._r || (window._r = K.configureRenderer(new T.WebGLRenderer({ canvas: cv, antialias: false })));
    r.setSize(1100, 900, false);
    const W = 1100, H = 900;

    const g = M.build(t, { routes: true, cavities: true, split: false, block: true });
    const keep = new T.Group();
    g.traverse(m => { if (m.isMesh && keys.indexOf(m.userData.key) >= 0) keep.add(m.clone()); });

    const cam = new T.PerspectiveCamera(42, W / H, 0.1, 500);
    const fit = K.fitCamera(cam, keep, 1.05);
    cam.position.copy(fit.centre).addScaledVector(new T.Vector3(dir[0], dir[1], dir[2]).normalize(), fit.distance);
    cam.lookAt(fit.centre);
    cam.updateMatrixWorld(true);

    /* the camera's REAL screen axes, read off its world matrix after lookAt — not assumed */
    const e = cam.matrixWorld.elements;
    const screenUp = { x: e[4], y: e[5], z: e[6] };

    /* ---- measure 1: centroid order along screen-up ---- */
    const sy = {};
    for (const m of keep.children) {
      const p = m.geometry.attributes.position;
      let cx = 0, cy = 0, cz = 0;
      for (let i = 0; i < p.count; i++) { cx += p.getX(i); cy += p.getY(i); cz += p.getZ(i); }
      const c = new T.Vector3(cx / p.count, cy / p.count, cz / p.count);
      m.localToWorld(c);
      sy[m.userData.key] = c.x * screenUp.x + c.y * screenUp.y + c.z * screenUp.z;
    }

    /* ---- measure 2: visible pixels, occlusion-aware, by flat ID colour ---- */
    const idScene = new T.Scene(); idScene.background = new T.Color(0x000000);
    const idOf = {}; let n = 1;
    for (const m of keep.children) {
      if (idOf[m.userData.key] == null) idOf[m.userData.key] = n++;
      const id = idOf[m.userData.key];
      const c2 = m.clone();
      c2.material = new T.MeshBasicMaterial({ color: new T.Color(id / 255, 0, 0), side: T.DoubleSide });
      idScene.add(c2);
    }
    const rt = new T.WebGLRenderTarget(W, H);
    r.setRenderTarget(rt); r.render(idScene, cam);
    const px = new Uint8Array(W * H * 4);
    r.readRenderTargetPixels(rt, 0, 0, W, H, px);
    r.setRenderTarget(null);
    const count = {}; let lit = 0;
    for (let i = 0; i < W * H; i++) {
      const v = px[i * 4];
      if (v === 0) continue;
      lit++;
      const id = Math.round(v);
      count[id] = (count[id] || 0) + 1;
    }
    const pix = {};
    for (const k in idOf) pix[k] = count[idOf[k]] || 0;
    rt.dispose();

    return { screenUp, sy, pix, lit };
  }, { view, t, dir: VIEW_DIR[view], keys: KEYS });
}

const CANDIDATES = [];
for (const view of ['inferior', 'superior'])
  for (const t of [0.40, 0.45, 0.50, 0.55, 0.60, 0.65, 0.70])
    CANDIDATES.push([view, t]);

console.log('MedBank · beat 1 screen-order + visible-pixel probe');
console.log('want, top to bottom: ' + WANT.join(' > '));
console.log('');
const rows = [];
for (const [view, t] of CANDIDATES) {
  const r = await probe(view, t);
  const order = Object.keys(r.sy).sort((a, b) => r.sy[b] - r.sy[a]);
  const ok = order.join(',') === WANT.join(',');
  const three = ['ectoderm', 'mesoderm', 'endoderm'].map(k => r.pix[k] || 0);
  const minThree = Math.min(...three);
  rows.push({ view, t, ok, order, pix: r.pix, minThree, lit: r.lit, up: r.screenUp });
  console.log(
    (ok ? 'ORDER ok  ' : 'ORDER BAD ') + view.padEnd(9) + ' t=' + t.toFixed(2) +
    '  screen-up=(' + r.screenUp.x.toFixed(3) + ',' + r.screenUp.y.toFixed(3) + ',' + r.screenUp.z.toFixed(3) + ')' +
    '  top->bottom: ' + order.join(' > '));
  console.log('              px  ecto ' + String(r.pix.ectoderm || 0).padStart(6) +
              '  meso ' + String(r.pix.mesoderm || 0).padStart(6) +
              '  endo ' + String(r.pix.endoderm || 0).padStart(6) +
              '  amnion ' + String(r.pix.amnion || 0).padStart(6) +
              '  yolk ' + String(r.pix.yolk_sac || 0).padStart(6) +
              '   | min of the three sheets: ' + minThree);
}

console.log('');
console.log('VERDICT — a candidate must get the order right AND draw all three sheets:');
for (const r of rows.filter(r => r.ok && r.minThree > 2000))
  console.log('   PASSES  ' + r.view + ' t=' + r.t.toFixed(2) + '  min sheet px ' + r.minThree);
console.log('');
const badMsgs = msgs.filter(m => (m.type === 'error' || m.type === 'warning' || m.type === 'pageerror')
  && !/software WebGL|GroupMarkerNotSet|GL_CLOSE_PATH_NV|ReadPixels|SwiftShader|Automatic fallback/i.test(m.text));
console.log('console: ' + msgs.length + ' messages, ' + badMsgs.length + ' not substrate noise ' + JSON.stringify(badMsgs).slice(0, 400));

await browser.close();
await server.close();
