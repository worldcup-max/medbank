/* MedBank · heart-external · WHAT EACH BEAT ACTUALLY PUTS ON SCREEN
 *
 * Both review rounds asked for numbers taken on the beat's OWN composition rather than on a bare
 * shell, and both took them from a replay that carried visibility from one beat to the next. The
 * player does not: viz3d.js runOps() resets every structure to visible before applying a view's ops.
 * This harness replays the way the player does — reset per beat, '*' and group names through
 * keysFor, PEEL_LAYER by layer — and then paints with the player's own rules from viz3d.js paint():
 * ghosting to 0.10 under ISOLATE_REGION / COMPARE_STRUCTURES unless the part is highlighted, the
 * structure's authored `opacity` as a ceiling, and depthWrite only at >= 0.98 opacity.
 *
 * HOW A STRUCTURE'S SHARE IS MEASURED. Not by an id-pick: an id-pick renders flat, opaque colours and
 * answers "which surface is nearest", which is the wrong question wherever anything is translucent —
 * it reports a structure behind a 32%-opaque lung as ZERO when a student can see it perfectly well.
 * RENDER-STANDARD names the right method for exactly this: render with and without, difference the
 * frames, count. A structure's share is the number of pixels that CHANGE when it is removed from its
 * own beat, over the lit subject, which is what a student can see of it and nothing else.
 *
 * THE CAMERA IS THE PLAYER'S, LIFTED, NOT REIMPLEMENTED — round-3 finding 1, fixed 2026-09-29.
 * This harness used to compute its own distance as radius/sin(fov/2) with radius = half the box's
 * LONGEST SIDE. viz3d.js distanceForBox() instead takes the box's exact half-extent along each
 * SCREEN axis, fits both half-angles, and adds the near-face term. The harness therefore under-scaled
 * by up to the ratio of the box's diagonal to its longest side and omitted the near-face term
 * altogether, and the subject was CUT OFF in 10 of 16 beats. Every share it quoted was a ratio
 * against a truncated denominator, which is not a measurement of what the player draws — three rounds
 * were each measured on a different wrong picture.
 *
 * So the camera code below is not written here. It is EXTRACTED FROM viz3d.js AT RUN TIME by
 * playerCameraSource() and injected verbatim, which is the only version of "obtain the camera from
 * the player's own framing" that cannot drift: if viz3d.js changes, this harness changes with it, and
 * if the extraction ever fails to find the function the harness refuses to run rather than falling
 * back to a formula of its own. Reimplementing kit geometry is what RENDER-STANDARD section 6 forbids,
 * and this harness had done it for the camera.
 *
 * AND IT ASSERTS THE FRAME. Before any share is reported, every beat is checked for subject pixels
 * ON THE FRAME BORDER. A share measured on a clipped frame is measured against a denominator that is
 * not the subject, so a clipped beat is a hard failure (exit 1) and not a warning.
 *
 * Usage: node viz-training/_build-2026-09-29/measure-beats.mjs [beat ...] [--only key,key]
 */
import { chromium } from 'playwright';
import { readFileSync, writeFileSync, mkdirSync, existsSync, readdirSync } from 'fs';
import http from 'http'; import path from 'path'; import fs from 'fs';
import { PNG } from 'pngjs';

const ROOT = process.cwd();
const OUT = 'viz-training/_build-2026-09-29/beats';
mkdirSync(OUT, { recursive: true });
const SCENE = 'viz-training/scenes/gross__heart-pericardium__heart-external.json';
const scene = JSON.parse(readFileSync(SCENE, 'utf8'));

/* THE PLAYER'S OWN FRAMING, TAKEN OUT OF THE PLAYER. Pulls `var FRAME_PAD`, `var VIEW_DIR` and the
   whole of `function distanceForBox` straight out of viz3d.js by brace-matching, so what runs in this
   harness IS what runs in the player, character for character. Refuses loudly: a harness that
   silently fell back to its own formula is the defect this function exists to end. */
function playerCameraSource() {
  const src = readFileSync('viz3d.js', 'utf8');
  const grab = (needle, kind) => {
    const i = src.indexOf(needle);
    if (i < 0) throw new Error('measure-beats: could not find ' + kind + ' (' + needle.trim() +
      ') in viz3d.js. The player changed; fix the extraction rather than guessing a camera.');
    if (kind === 'statement') { const j = src.indexOf(';', i); return src.slice(i, j + 1); }
    let depth = 0, j = src.indexOf('{', i);
    for (let k = j; k < src.length; k++) {
      if (src[k] === '{') depth++;
      else if (src[k] === '}') { depth--; if (depth === 0) return src.slice(i, k + 1); }
    }
    throw new Error('measure-beats: unbalanced braces reading ' + kind + ' from viz3d.js');
  };
  const framePad = grab('var FRAME_PAD = ', 'statement');
  const viewDir  = grab('var VIEW_DIR = {', 'object');
  const distFn   = grab('function distanceForBox(size, dir) {', 'function');
  /* viz3d.js writes THREE as `T`; give its code the name it expects and nothing else. */
  return '/* ---- lifted verbatim from viz3d.js ---- */\nvar T = THREE;\n' +
         framePad + '\n' + viewDir + '\n' + distFn + '\n/* ---- end lifted ---- */';
}
const PLAYER_CAMERA = playerCameraSource();

const args = process.argv.slice(2);
const onlyArg = (() => { const i = args.indexOf('--only'); return i >= 0 ? args[i + 1].split(',') : null; })();
const wantBeats = args.filter(a => /^\d+$/.test(a)).map(Number);

const MIME = { '.js': 'text/javascript', '.json': 'application/json', '.html': 'text/html' };
const server = http.createServer((req, res) => {
  const p = path.join(ROOT, decodeURIComponent(req.url.split('?')[0]));
  fs.readFile(p, (e, buf) => { if (e) { res.writeHead(404); return res.end('no'); }
    res.writeHead(200, { 'content-type': MIME[path.extname(p)] || 'application/octet-stream' }); res.end(buf); });
});
await new Promise(r => server.listen(0, r));
const BASE = `http://127.0.0.1:${server.address().port}/`;
const W = 1040, H = 1040;

const html = `<!doctype html><meta charset=utf8><link rel="icon" href="data:,">
<body style="margin:0;background:#0e1626"><canvas id=c width=${W} height=${H}></canvas>
<script src="${BASE}node_modules/three/build/three.js"><\/script>
<script src="${BASE}models3d/render-kit.js"><\/script>
<script src="${BASE}models3d/heart-external.js"><\/script>
<script>
const MOD = window.MB3D_MODELS['heart-external'];
const renderer = new THREE.WebGLRenderer({ canvas: document.getElementById('c'), antialias: true });
renderer.setSize(${W}, ${H}, false); renderer.setPixelRatio(1);
VizKit.configureRenderer(renderer);
const scene3 = new THREE.Scene();
scene3.background = VizKit.bg(0x0e1626);
const L = VizKit.standardLights(scene3);
const camera = new THREE.PerspectiveCamera(34, 1, 0.1, 400);
${PLAYER_CAMERA}

/* ONE build, as the player has it: every structure resolved from FULL, then shown or hidden. */
const group = MOD.build(1, MOD.FULL);
group.updateMatrixWorld(true);
scene3.add(group);
const byKey = {};
group.traverse(o => { if (o.isMesh) (byKey[o.userData.key] = byKey[o.userData.key] || []).push(o); });
const BASE_OPACITY = {}, BASE_TRANSPARENT = {};
for (const k of Object.keys(byKey)) for (const m of byKey[k]) {
  BASE_OPACITY[m.uuid] = m.material.opacity; BASE_TRANSPARENT[m.uuid] = m.material.transparent;
}

/* viz3d.js paint(), restricted to what changes pixels: visibility, ghosting, authored opacity. */
/* THE CAMERA MUST NOT MOVE BETWEEN THE TWO RENDERS. subjectBox() is computed from what is visible,
   so hiding the structure under test reframed the whole picture and the difference came out as
   "every pixel changed" — 129% of a subject that cannot exceed 100%. The frame is set from the
   beat's OWN composition and then held while the structure is removed. */
window.compose = function (st, drop, keep) {
  for (const k of Object.keys(byKey)) {
    let visible = st.visible[k] !== false;
    if (st.only && st.only.indexOf(k) < 0 && !st.ghosted) visible = false;
    const isHi = st.hi[k] != null;
    const authored = st.opacity[k] != null ? Math.max(0.02, Math.min(1, st.opacity[k])) : 1;
    const op = isHi ? authored : (st.ghosted ? Math.min(0.10, authored) : authored);
    for (const m of byKey[k]) {
      m.visible = visible;
      if (m.userData.outline) continue;
      m.material.opacity = Math.min(op, BASE_OPACITY[m.uuid] != null ? 1 : 1) * op / op * op;
      m.material.opacity = op;
      m.material.transparent = op < 0.999;
      m.material.depthWrite = op >= 0.98;
      m.material.needsUpdate = true;
    }
  }
  /* subjectBox, as the player computes it */
  const keys = (st.only && st.only.length) ? st.only
             : Object.keys(byKey).filter(k => st.visible[k] !== false);
  const box = new THREE.Box3(); let any = false;
  for (const k of keys) for (const m of byKey[k]) { if (!m.visible || m.userData.outline) continue; box.expandByObject(m); any = true; }
  if (!any) return false;
  const c = box.getCenter(new THREE.Vector3()), sz = box.getSize(new THREE.Vector3());
  /* frameView(), as viz3d.js does it: the lifted distanceForBox, and the same minDistance floor the
     player applies (controls.minDistance || 1.2) so a view naming one small part cannot dive inside it. */
  const d = new THREE.Vector3().fromArray(VIEW_DIR[st.dir] || [0,0,1]).normalize();
  const dist = Math.max(distanceForBox(sz, d), 1.2);
  camera.position.copy(c).addScaledVector(d, dist);
  camera.up.set(0, 1, 0); camera.lookAt(c);
  L.key.position.copy(camera.position).add(new THREE.Vector3(3, 6, 2));
  if (drop) for (const m of (byKey[drop] || [])) m.visible = false;   // after the framing, never before
  /* SUBJECT-ONLY PASS. viz3d.js subjectBox() frames on state.only when a view isolates or compares,
     and its own comment says ghosted context "is context, and it is allowed to run off the edges".
     So the border assertion must be made on THE SUBJECT, not on every lit pixel — counting the
     ghosted spill would fail beats the player draws exactly as intended. Hidden AFTER the framing,
     the same way drop is, so the camera is the beat's own. */
  if (keep) for (const k of Object.keys(byKey)) if (keep.indexOf(k) < 0)
    for (const m of byKey[k]) m.visible = false;
  renderer.render(scene3, camera);
  return true;
};
window.keysWithGeometry = () => Object.keys(byKey);
<\/script>`;
writeFileSync(`${OUT}/_beats.html`, html);

/* ---- the replay, in node, exactly as viz3d.js runOps does it ---- */
const KEYS = scene.structures.map(s => s.key);
const GROUP = {}, LAYER = {}, OPACITY = {};
for (const s of scene.structures) {
  (GROUP[s.group] = GROUP[s.group] || []).push(s.key);
  (LAYER[s.layer] = LAYER[s.layer] || []).push(s.key);
  if (typeof s.opacity === 'number') OPACITY[s.key] = s.opacity;
}
const keysFor = t => (!t || t === '*') ? KEYS.slice() : (KEYS.includes(t) ? [t] : (GROUP[t] || []));
function runOps(ops) {
  const st = { visible: {}, hi: {}, ghosted: false, only: null, dir: null, opacity: OPACITY };
  KEYS.forEach(k => { st.visible[k] = true; });
  for (const o of ops) {
    switch (o.op) {
      case 'SHOW_STRUCTURE': keysFor(o.target).forEach(k => { st.visible[k] = true; }); break;
      case 'HIDE_STRUCTURE': keysFor(o.target).forEach(k => { st.visible[k] = false; }); break;
      case 'HIGHLIGHT_STRUCTURE': keysFor(o.target).forEach(k => { st.hi[k] = o.intensity || 0.45; }); break;
      case 'ISOLATE_REGION': st.only = keysFor(o.target); st.ghosted = true; break;
      case 'COMPARE_STRUCTURES':
        st.only = (o.targets || []).reduce((a, t) => a.concat(keysFor(t)), []);
        st.ghosted = true; st.only.forEach(k => { st.hi[k] = 0.5; }); break;
      case 'SHOW_RELATIONSHIP': st.hi[o.from] = 0.5; st.hi[o.to] = 0.5; break;
      case 'ROTATE_TO_VIEW': st.dir = o.view; break;
      case 'PEEL_LAYER': (LAYER[o.layer] || []).forEach(k => { st.visible[k] = false; }); break;
    }
  }
  return st;
}

function findChromium() {
  const root = '/opt/pw-browsers'; const c = [];
  if (existsSync(root)) for (const d of readdirSync(root))
    for (const rel of ['chrome-linux/chrome', 'chrome-linux/headless_shell', 'chrome-headless-shell-linux64/chrome-headless-shell']) {
      const f = path.join(root, d, rel); if (existsSync(f)) c.push(f); }
  c.sort((a, b) => (a.includes('chrome-linux/chrome') ? -1 : 1) - (b.includes('chrome-linux/chrome') ? -1 : 1));
  return c[0];
}
const b = await chromium.launch({ executablePath: findChromium(), args: ['--use-gl=swiftshader', '--enable-unsafe-swiftshader', '--no-sandbox'] });
const p = await b.newPage({ viewport: { width: W, height: H } });
const log = [];
p.on('console', m => log.push(m.type() + ': ' + m.text()));
p.on('pageerror', e => log.push('pageerror: ' + e.message));
await p.goto(BASE + OUT + '/_beats.html');
await p.waitForFunction('typeof window.compose === "function"');
const built = new Set(await p.evaluate('window.keysWithGeometry()'));

const BG = [14, 22, 38];
function decode(buf) { return PNG.sync.read(buf); }
/* THE TWO THRESHOLDS HAVE TO BE THE SAME ONE. The first version called a pixel "lit" if it differed
   from the background by more than 6 and "changed" if it differed from the reference by more than 3,
   so the faint tint a 32%-opaque lung lays over the background counted as changed but not as lit —
   and removing that lung came out at 129% of the subject. A share of the picture cannot exceed the
   picture. One threshold, used for both. */
const TH = 3;
/* SUBJECT PIXELS ON THE FRAME BORDER. The assertion round-3 finding 1 asked for: a share is a ratio
   against the subject, so if the subject runs off the edge the denominator is not the subject and no
   number below it means anything. Counted per side, so the report says WHICH way it is cut. */
function borderBleed(a) {
  const lit = (i) => !(Math.abs(a.data[i] - BG[0]) <= TH && Math.abs(a.data[i+1] - BG[1]) <= TH
                    && Math.abs(a.data[i+2] - BG[2]) <= TH);
  const at = (x, y) => 4 * (y * a.width + x);
  let top = 0, bottom = 0, left = 0, right = 0;
  for (let x = 0; x < a.width; x++) { if (lit(at(x, 0))) top++; if (lit(at(x, a.height - 1))) bottom++; }
  for (let y = 0; y < a.height; y++) { if (lit(at(0, y))) left++; if (lit(at(a.width - 1, y))) right++; }
  return { top, bottom, left, right, total: top + bottom + left + right };
}

function litAndDiff(a, ref) {
  let lit = 0, diff = 0;
  for (let i = 0; i < a.data.length; i += 4) {
    const near = Math.abs(a.data[i] - BG[0]) <= TH && Math.abs(a.data[i+1] - BG[1]) <= TH && Math.abs(a.data[i+2] - BG[2]) <= TH;
    if (!near) lit++;
    if (ref && (Math.abs(a.data[i] - ref.data[i]) > TH || Math.abs(a.data[i+1] - ref.data[i+1]) > TH
             || Math.abs(a.data[i+2] - ref.data[i+2]) > TH)) diff++;
  }
  return { lit, diff };
}

const report = [], clipped = [];
for (const v of scene.views) {
  if (wantBeats.length && !wantBeats.includes(v.beat)) continue;
  const st = runOps(v.ops);
  const ok = await p.evaluate(s => window.compose(s, null), st);
  if (!ok) { console.log('beat', v.beat, 'NOTHING VISIBLE'); continue; }
  const full = decode(await p.locator('#c').screenshot());
  writeFileSync(`${OUT}/beat-${String(v.beat).padStart(2, '0')}.png`, PNG.sync.write(full));
  const { lit } = litAndDiff(full, null);
  /* the subject, as subjectBox() defines it: state.only when the view compares or isolates, else
     everything it left showing */
  const subjectKeys = (st.only && st.only.length) ? st.only.slice()
                    : KEYS.filter(k => st.visible[k] !== false);
  await p.evaluate(([a, b, c]) => window.compose(a, b, c), [st, null, subjectKeys]);
  const subjOnly = decode(await p.locator('#c').screenshot());
  const bleed = borderBleed(subjOnly);
  if (bleed.total) clipped.push({ beat: v.beat, title: v.title, dir: st.dir, bleed });
  await p.evaluate(s2 => window.compose(s2, null), st);   // back to the beat's own composition
  const visible = KEYS.filter(k => st.visible[k] !== false && built.has(k)
    && !(st.only && st.only.indexOf(k) < 0 && !st.ghosted));
  const targets = onlyArg ? visible.filter(k => onlyArg.includes(k)) : visible;
  const shares = [];
  for (const k of targets) {
    await p.evaluate(([s, d]) => window.compose(s, d, null), [st, k]);
    const without = decode(await p.locator('#c').screenshot());
    const { diff } = litAndDiff(without, full);
    shares.push({ key: k, px: diff, ofSubject: lit ? diff / lit : 0, ofFrame: diff / (W * H) });
  }
  shares.sort((a, c) => c.px - a.px);
  report.push({ beat: v.beat, title: v.title, dir: st.dir, lit, litOfFrame: lit / (W * H),
                borderBleed: bleed, shares });
  console.log('\nbeat ' + String(v.beat).padStart(2) + '  ' + (st.dir || '-').padEnd(10) +
    '  subject ' + (100 * lit / (W * H)).toFixed(1) + '% of frame   ' + v.title);
  for (const s of shares) console.log('     ' + s.key.padEnd(30) +
    (100 * s.ofSubject).toFixed(2).padStart(7) + '% of subject ' + (100 * s.ofFrame).toFixed(2).padStart(7) + '% of frame');
}
await b.close(); server.close();
writeFileSync('viz-training/_build-2026-09-29/beat-shares.json', JSON.stringify(report, null, 1));
console.log('\nconsole:', log.join(' | ') || 'clean');

if (clipped.length) {
  console.log('\nCLIPPED — SUBJECT pixels on the frame border (ghosted context is not counted: the player');
  console.log('lets it run off). Every share above these beats is a ratio against a truncated subject:');
  for (const c of clipped) console.log('  beat ' + String(c.beat).padStart(2) + '  ' +
    ['top','bottom','left','right'].filter(k => c.bleed[k]).map(k => k + ' ' + c.bleed[k] + 'px').join(', ') +
    '   ' + c.title);
  process.exit(1);
}
console.log('FRAMING: no subject pixel touches the frame border in any of the ' + report.length + ' beats measured.');
