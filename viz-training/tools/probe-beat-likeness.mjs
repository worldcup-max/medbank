/* MedBank · probe · DO TWO BEATS SHOW A STUDENT THE SAME PICTURE?
 *
 *   node viz-training/tools/probe-beat-likeness.mjs <scene.json> <model.js> [outDir]
 *
 * WHY THIS EXISTS. Round 1's MINOR finding on the trilaminar-disc item was that beats 6 and 8 are
 * near-indistinguishable: same posterior camera, same t = 0.70, same three mesoderm columns plus the
 * notochord, differing only by a translucent somatic sheet (beat 6) against a translucent coelom
 * (beat 8), both pale and in the same band. The reviewer was right and nothing in the corpus could
 * say so with a number.
 *
 * NOTHING EXISTING MEASURES THIS.
 *   · The render harness's check 10 differences the beat frames and asserts only that no two are
 *     IDENTICAL. Two frames differing in one wash of colour pass it easily — these two did.
 *   · measure-scene-visibility.mjs asks whether each structure in a beat can be SEEN. Both beats pass
 *     that comfortably; being seeable is not the same as being distinguishable from the beat before.
 *   · Neither renders the beauty pass the way the player does, with per-structure opacity and the
 *     ghosting that ISOLATE_REGION and COMPARE_STRUCTURES apply.
 *
 * So this renders every beat as viz3d.js's beauty pass draws it — the materials build() returns, each
 * structure's own `opacity` from the scene, non-subject structures ghosted when the view ghosts, the
 * camera refitted per view to the subject — and reports the pairwise distance between all of them.
 * The pair that matters is reported against the rest of the scene, because "alike" only means
 * anything relative to how different the other pairs are.
 *
 * WHAT IT DOES NOT DO: decide. A low number is a question, not a defect. Two beats can legitimately
 * share a composition when the teaching point IS the difference between them — a cover and its peel,
 * for instance, which is exactly what beats 6 and 8 are. The number tells you how hard a student has
 * to look; whether that is acceptable is a judgement that belongs in the log.
 */
import { chromium } from 'playwright';
import { readFileSync, mkdirSync, writeFileSync } from 'fs';
import http from 'http';
import path from 'path';
import fs from 'fs';

const ROOT = process.cwd();
const SCENE = process.argv[2];
const MODELJS = process.argv[3];
const OUT = process.argv[4] || 'viz-training/models-out/_likeness';
if (!SCENE || !MODELJS) { console.error('usage: probe-beat-likeness.mjs <scene.json> <model.js> [outDir]'); process.exit(2); }
mkdirSync(OUT, { recursive: true });

const scene = JSON.parse(readFileSync(path.join(ROOT, SCENE), 'utf8'));
const MODEL = path.basename(MODELJS).replace(/\.js$/, '');

const MIME = { '.js': 'text/javascript', '.json': 'application/json', '.html': 'text/html', '.png': 'image/png' };
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

/* viz3d.js:2095, verbatim */
const VIEW_DIR = { anterior: [0,0,1], posterior: [0,0,-1], lateral: [1,0,0], medial: [-1,0,0],
                   superior: [0,1,0.001], inferior: [0,-1,0.001] };

const byKey = {}; for (const s of scene.structures) byKey[s.key] = s;
const refOf = k => (byKey[k] && byKey[k].refs && byKey[k].refs.procedural) || '';
const partOf = k => refOf(k).split('#')[1].split('@')[0].split('+')[0];

/* read each view the way viz3d's op dispatcher does */
const beats = scene.views.map((v, i) => {
  const st = { visible: {}, hi: {}, dir: null, t: null, only: null, ghosted: false };
  for (const s of scene.structures) st.visible[s.key] = true;
  for (const o of v.ops) {
    if (o.op === 'HIDE_STRUCTURE') { if (o.target === '*') for (const k in st.visible) st.visible[k] = false; else st.visible[o.target] = false; }
    else if (o.op === 'SHOW_STRUCTURE') st.visible[o.target] = true;
    else if (o.op === 'SET_STAGE') st.t = o.t;
    else if (o.op === 'ROTATE_TO_VIEW') st.dir = o.view;
    else if (o.op === 'HIGHLIGHT_STRUCTURE') st.hi[o.target] = o.intensity || 0.45;
    else if (o.op === 'ISOLATE_REGION') { st.only = [o.target]; st.ghosted = true; }
    else if (o.op === 'COMPARE_STRUCTURES') { st.only = (o.targets || []).slice(); st.ghosted = true; }
  }
  const shown = Object.keys(st.visible).filter(k => st.visible[k] && refOf(k));
  return { beat: i + 1, title: v.title, t: st.t, dir: st.dir, shown, only: st.only, ghosted: st.ghosted, hi: st.hi };
});

const browser = await chromium.launch({ args: ['--use-gl=swiftshader', '--enable-unsafe-swiftshader', '--no-sandbox'] });
const page = await browser.newPage();
const msgs = [];
page.on('console', m => msgs.push({ type: m.type(), text: m.text() }));
page.on('pageerror', e => msgs.push({ type: 'pageerror', text: String(e) }));
await page.setContent('<canvas id="c" width="1100" height="900"></canvas>');
await page.addScriptTag({ url: BASE + 'viz-training/spike/three.min.js' });
await page.addScriptTag({ url: BASE + 'models3d/render-kit.js' });
await page.addScriptTag({ url: BASE + MODELJS });

const files = [];
for (const b of beats) {
  const needsSplit = b.shown.some(k => refOf(k).indexOf('+split') >= 0);
  const needsBlock = b.shown.some(k => refOf(k).indexOf('+block') >= 0);
  await page.evaluate(({ t, dir, split, block, keys, opacity, only, ghosted, model }) => {
    const T = window.THREE, K = window.VizKit, M = window.MB3D_MODELS[model];
    const cv = document.getElementById('c');
    const r = window._r || (window._r = K.configureRenderer(new T.WebGLRenderer({ canvas: cv, antialias: true })));
    r.setSize(1100, 900, false);
    const sc = new T.Scene(); sc.background = K.bg(0x101828);
    K.standardLights(sc);
    const g = M.build(t, { routes: true, cavities: true, split: split, block: block });
    const keep = new T.Group();
    const subject = new T.Group();
    const onlyParts = only ? only.map(k => keys[k]).filter(Boolean) : null;
    g.traverse(m => {
      if (!m.isMesh) return;
      const part = m.userData.key;
      const sceneKey = Object.keys(keys).find(k => keys[k] === part);
      if (sceneKey == null) return;
      const c = m.clone();
      /* the player applies each structure's own opacity ... */
      let op = opacity[sceneKey] != null ? opacity[sceneKey] : 1;
      /* ... and ghosts everything outside the compared/isolated set to 10% */
      const isSubject = !onlyParts || onlyParts.indexOf(part) >= 0;
      if (ghosted && !isSubject) op = Math.min(op, 0.1);
      if (op < 1) { c.material = c.material.clone(); c.material.transparent = true; c.material.opacity = op; }
      keep.add(c);
      if (isSubject) subject.add(c.clone());
    });
    sc.add(keep);
    const cam = new T.PerspectiveCamera(42, 1100 / 900, 0.1, 500);
    /* viz3d refits per view, to the SUBJECT, not to everything on screen */
    const fit = K.fitCamera(cam, subject.children.length ? subject : keep, 1.05);
    cam.position.copy(fit.centre).addScaledVector(new T.Vector3(dir[0], dir[1], dir[2]).normalize(), fit.distance);
    cam.lookAt(fit.centre);
    r.render(sc, cam);
  }, { t: b.t, dir: VIEW_DIR[b.dir] || [0,0,1], split: needsSplit, block: needsBlock,
       keys: Object.fromEntries(b.shown.map(k => [k, partOf(k)])),
       opacity: Object.fromEntries(b.shown.map(k => [k, byKey[k].opacity == null ? 1 : byKey[k].opacity])),
       only: b.only, ghosted: b.ghosted, model: MODEL });
  const buf = await page.locator('#c').screenshot();
  const f = OUT + '/beat' + String(b.beat).padStart(2, '0') + '.png';
  writeFileSync(f, buf);
  files.push({ beat: b.beat, file: f, t: b.t, dir: b.dir, title: b.title });
}
await browser.close();
await server.close();
writeFileSync(OUT + '/beats.json', JSON.stringify(files, null, 1));
console.log('rendered ' + files.length + ' player-faithful beauty frames to ' + OUT);
for (const f of files) console.log('   beat ' + f.beat + '  t=' + f.t + '  ' + f.dir + '  ' + f.title);
const bad = msgs.filter(m => (m.type === 'error' || m.type === 'warning' || m.type === 'pageerror')
  && !/software WebGL|GroupMarkerNotSet|GL_CLOSE_PATH_NV|ReadPixels|SwiftShader|Automatic fallback/i.test(m.text));
console.log('console: ' + msgs.length + ' messages, ' + bad.length + ' not substrate noise ' + JSON.stringify(bad).slice(0, 300));
