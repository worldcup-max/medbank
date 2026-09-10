import { chromium } from 'playwright';
import { readFileSync, writeFileSync, mkdirSync } from 'fs';

const three = readFileSync('node_modules/three/build/three.js', 'utf8');
const kit   = readFileSync('spike/render-kit.js', 'utf8');
const heart = readFileSync('spike/heart-loop.js', 'utf8');

const STAGES = [
  [0.00, {}, '1 — straight heart tube (day 21)'],
  [0.20, {}, '2 — the tube outgrows its cavity'],
  [0.40, {}, '3 — bulboventricular (C) loop, convex ventral and right'],
  [0.60, { pericardium: true }, '4 — dorsal mesocardium breaks down'],
  [0.80, {}, '5 — S-loop: atrium climbing dorsocranially'],
  [1.00, {}, '6 — looped heart (day 28)'],
  [1.00, { cutaway: true }, '7 — cutaway: myocardial wall, cardiac jelly, endocardial tube'],
];

const W = 1180, H = 1460;

const html = `<!doctype html><meta charset=utf8>
<body style="margin:0;background:#070d1a">
<canvas id=c width=${W} height=${H}></canvas>
<script>${three}<\/script>
<script>${kit}<\/script>
<script type="module">
${heart}

const renderer = new THREE.WebGLRenderer({ canvas: document.getElementById('c'), antialias: true });
renderer.setSize(${W}, ${H}, false);
renderer.setPixelRatio(1);
VizKit.configureRenderer(renderer);

const scene = new THREE.Scene();
scene.background = new THREE.Color(0x0e1626);
scene.fog = new THREE.Fog(0x0e1626, 30, 70);

const L = VizKit.standardLights(scene);
const key = L.key;

const camera = new THREE.PerspectiveCamera(32, ${W}/${H}, 0.1, 200);

let group = null;

/* THE SUBJECT FILLS THE FRAME. The loop changes size and position at every t, so the camera is
   fitted to the actual bounding box each time rather than parked at a distance that happened to
   work for one stage. Frames the whole model, including the vessels, with a fixed margin. */
window.setStage = function (t, opts) {
  if (group) scene.remove(group);
  group = buildHeart(t, opts || {});
  group.rotation.y = -0.28;
  group.rotation.x =  0.05;
  group.updateMatrixWorld(true);
  scene.add(group);
  const f = VizKit.fitCamera(camera, group, 1.03);
  camera.position.set(f.centre.x, f.centre.y, f.centre.z + f.distance);
  camera.lookAt(f.centre);
  key.position.set(camera.position.x + 6, camera.position.y + 8, camera.position.z + 4);
  renderer.render(scene, camera);
  return true;
};
window.__ready = true;
<\/script>`;

mkdirSync('spike/heart-out', { recursive: true });
writeFileSync('spike/heart-page.html', html);

const b = await chromium.launch({
  executablePath: '/opt/pw-browsers/chromium-1194/chrome-linux/chrome',
  args: ['--use-gl=swiftshader', '--enable-unsafe-swiftshader', '--disable-gpu-sandbox'],
});
const p = await b.newPage({ viewport: { width: W, height: H }, deviceScaleFactor: 2 });
p.on('console', m => { if (m.type() === 'error') console.log('PAGE ERR:', m.text().slice(0, 300)); });
p.on('pageerror', e => console.log('PAGE THROW:', String(e).slice(0, 400)));
await p.goto('file:///home/claude/work/spike/heart-page.html');
await p.waitForFunction('window.__ready === true', { timeout: 30000 });

let n = 0;
for (const [t, opts, label] of STAGES) {
  n++;
  await p.evaluate(([v, o]) => window.setStage(v, o), [t, opts]);
  await p.waitForTimeout(140);
  const name = `spike/heart-out/stage-${String(n)}.png`;
  await p.locator('#c').screenshot({ path: name });
  console.log('rendered', name, '·', label);
}

// diagnostic: same frame with the silhouette shells suppressed
await b.close();
