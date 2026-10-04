/* MedBank · RENDER-STANDARD §3.ab — A CONTINUOUS STRUCTURE IS MEASURED IN CONNECTED FRAGMENTS.
 *
 *   node viz-training/tools/measure-fragments.mjs <scene.json> [--beat N] [--key K] [--thr 40]
 *
 * WHY THIS EXISTS. §3.ab was written on 2026-10-02 from this scene's beat 6 and no tool implemented
 * it, so two review rounds counted the same beat by hand and got 1 and 3. Corollary 3 was then added
 * to say which frame and which threshold, and it is right that neither round was wrong about its own
 * arithmetic — they were measuring different pictures. A rule with no instrument gets re-derived by
 * every run that meets it, and each derivation is a chance to pick a different frame. This is the
 * instrument.
 *
 * WHAT IT MEASURES, exactly as corollary 3 specifies it:
 *   · THE PLAYER FRAME, never the harness frame — the beat composed the way viz3d composes it, with
 *     the view's ops applied, each structure's authored opacity applied, and the camera refitted to
 *     the subject. A harness frame has every layer at full opacity, so a fix made under corollary 1
 *     (dropping an occluder's opacity) is invisible to it and it will over-report for ever.
 *   · WITH AND WITHOUT the structure, differenced, at a threshold of 40/255 in any channel — the
 *     tool's own "clearly visible" floor, shared with measure-scene-visibility.mjs.
 *   · 4-CONNECTED COMPONENTS of the resulting mask.
 *   · AND THE HAIRLINE DISCOUNT of corollary 3: components separated by a gap narrower than about
 *     4 px are an artefact of the difference method, because an occluder's own rim edge is drawn
 *     ACROSS the structure and the difference scores that edge as absence. Mechanised as a
 *     morphological closing of radius 2, which bridges gaps up to 4 px. BOTH counts are reported
 *     and neither is hidden. Note the one clause this does NOT mechanise: corollary 3 says such a
 *     gap is an artefact when it "lies on an occluder's own edge", and the closing does not check
 *     where the gap lies. It is therefore the PERMISSIVE reading, which is why the raw count is
 *     reported beside it and a run that leans on the discounted number should say that it looked.
 *
 * IT REUSES THE WALK'S OWN PAGE, `_walk.html`, which measure-scene-visibility.mjs writes into its
 * out dir. That is deliberate and it is also this tool's one real limitation: run the walk first.
 * The alternative was to copy three hundred lines of mount/stateFor/parseRef machinery into a second
 * file, and two copies of the player's op semantics is exactly the drift RENDER-STANDARD §6 is about
 * — the walk's header already says that where it and viz3d disagree, viz3d is right, and a third
 * opinion would make that sentence meaningless.
 */
import { readFileSync, existsSync } from 'fs';
import http from 'http'; import path from 'path'; import fs from 'fs';
import { chromium } from 'playwright';

const ROOT = process.cwd();
const args = process.argv.slice(2);
const scenePath = args.find(a => !a.startsWith('--'));
const flag = (n, d) => { const i = args.indexOf('--' + n); return i < 0 ? d : args[i + 1]; };
const THR = +flag('thr', 40);
const onlyBeat = flag('beat', null) == null ? null : +flag('beat');
const onlyKey = flag('key', null);
if (!scenePath) { console.error('usage: measure-fragments.mjs <scene.json> [--beat N] [--key K]'); process.exit(2); }

const scene = JSON.parse(readFileSync(scenePath, 'utf8'));
const short = scene.id.split('__').pop();
const OUT = flag('out', 'viz-training/models-out/' + short + '/player');
const WALK = path.join(OUT, '_walk.html');
if (!existsSync(WALK)) {
  console.error('no ' + WALK + '\nRun measure-scene-visibility.mjs on this scene first — this tool\n' +
                'reuses the page that walk writes, so that the player semantics have ONE implementation.');
  process.exit(2);
}

const MIME = { '.html': 'text/html', '.js': 'text/javascript', '.json': 'application/json', '.png': 'image/png' };
const server = http.createServer((q, s) => {
  const f = path.join(ROOT, decodeURIComponent(q.url.split('?')[0]));
  if (!fs.existsSync(f) || fs.statSync(f).isDirectory()) { s.writeHead(404); return s.end('no'); }
  s.writeHead(200, { 'content-type': MIME[path.extname(f)] || 'application/octet-stream' });
  s.end(fs.readFileSync(f));
});
await new Promise(r => server.listen(0, r));
const BASE = `http://127.0.0.1:${server.address().port}/`;

function findChromium() {
  if (process.env.CHROMIUM_PATH) return process.env.CHROMIUM_PATH;
  const base = '/opt/pw-browsers';
  if (fs.existsSync(base)) for (const d of fs.readdirSync(base))
    for (const rel of ['chrome-linux/chrome', 'chrome-linux/headless_shell']) {
      const p = path.join(base, d, rel); if (fs.existsSync(p)) return p;
    }
  return null;
}
const browser = await chromium.launch({ executablePath: findChromium() || undefined });
const page = await browser.newPage();
const log = [];
page.on('console', m => { if (m.type() === 'error') log.push(m.text()); });
page.on('pageerror', e => log.push('PAGEERROR ' + e.message));
/* _walk.html embeds the ABSOLUTE urls of the walk's own throwaway http server, whose port died with
   it, so the page is served here with those rewritten onto this run's port. Loading it as it sits on
   disk times out thirty seconds later with nothing in the error naming the cause. */
const walkHtml = readFileSync(WALK, 'utf8').replace(/http:\/\/127\.0\.0\.1:\d+\//g, BASE);
await page.route('**/__frag.html', r => r.fulfill({ contentType: 'text/html', body: walkHtml }));
await page.goto(BASE + '__frag.html', { waitUntil: 'load' });
await page.waitForFunction('window.diffKey && window.count');

/* the mask of pixels this structure is responsible for, on the player frame — diffKey's own render
   pair, returned as a mask instead of as a count. mount() is called once, so the camera is fitted
   WITH the structure present and does not move between the two shots. */
const maskOf = (scn, view, key, thr) => page.evaluate(([scn, view, key, thr]) => {
  const shot = () => { scene.background = VizKit.bg(0x0e1626); renderer.render(scene, camera);
    const gl = renderer.getContext(), px = new Uint8Array(W * H * 4);
    gl.readPixels(0, 0, W, H, gl.RGBA, gl.UNSIGNED_BYTE, px); return px; };
  const r = mount(scn, view, false); if (!r) return null;
  const a = shot();
  let hid = 0;
  holder.traverse(o => { if (o.isMesh && window.__owner.get(o) === key) { o.visible = false; hid++; } });
  if (!hid) return { error: 'no mesh owned by ' + key };
  const b = shot();
  const m = new Uint8Array(W * H);
  for (let i = 0; i < W * H; i++) {
    const d = Math.max(Math.abs(a[i * 4] - b[i * 4]), Math.abs(a[i * 4 + 1] - b[i * 4 + 1]),
                       Math.abs(a[i * 4 + 2] - b[i * 4 + 2]));
    if (d > thr) m[i] = 1;
  }
  return { W, H, mask: Array.from(m), t: r.t, dir: r.dir };
}, [scn, view, key, thr]);

/* 4-connected components, iterative so a 1100x900 mask cannot blow the stack */
function components(mask, W, H) {
  const lab = new Int32Array(W * H).fill(0); let n = 0; const out = [];
  const st = new Int32Array(W * H);
  for (let i = 0; i < W * H; i++) {
    if (!mask[i] || lab[i]) continue;
    n++; let sp = 0; st[sp++] = i; lab[i] = n;
    let px = 0, x0 = 1e9, x1 = -1, y0 = 1e9, y1 = -1;
    while (sp) {
      const j = st[--sp]; px++;
      const x = j % W, y = (j - x) / W;
      if (x < x0) x0 = x; if (x > x1) x1 = x; if (y < y0) y0 = y; if (y > y1) y1 = y;
      if (x > 0     && mask[j - 1] && !lab[j - 1]) { lab[j - 1] = n; st[sp++] = j - 1; }
      if (x < W - 1 && mask[j + 1] && !lab[j + 1]) { lab[j + 1] = n; st[sp++] = j + 1; }
      if (y > 0     && mask[j - W] && !lab[j - W]) { lab[j - W] = n; st[sp++] = j - W; }
      if (y < H - 1 && mask[j + W] && !lab[j + W]) { lab[j + W] = n; st[sp++] = j + W; }
    }
    out.push({ px, box: [x0, y0, x1, y1] });
  }
  out.sort((a, b) => b.px - a.px);
  return out;
}
/* corollary 3's hairline discount: a closing of radius R bridges gaps up to 2R px */
function close(mask, W, H, R) {
  const dil = (src) => { const d = new Uint8Array(W * H);
    for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
      if (!src[y * W + x]) continue;
      for (let dy = -R; dy <= R; dy++) for (let dx = -R; dx <= R; dx++) {
        const nx = x + dx, ny = y + dy;
        if (nx >= 0 && nx < W && ny >= 0 && ny < H) d[ny * W + nx] = 1;
      }
    } return d; };
  const ero = (src) => { const e = new Uint8Array(W * H);
    for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
      let all = 1;
      for (let dy = -R; dy <= R && all; dy++) for (let dx = -R; dx <= R && all; dx++) {
        const nx = x + dx, ny = y + dy;
        if (nx < 0 || nx >= W || ny < 0 || ny >= H || !src[ny * W + nx]) all = 0;
      }
      e[y * W + x] = all;
    } return e; };
  return ero(dil(mask));
}

/* corollary 2: run it over EVERY beat's subject before trusting it, so it cannot cry wolf */
const subjectsOf = v => {
  const s = new Set();
  for (const o of v.ops || []) {
    if (o.op === 'HIGHLIGHT_STRUCTURE' && o.target && o.target !== '*') s.add(o.target);
    if (o.op === 'SHOW_RELATIONSHIP') { if (o.from) s.add(o.from); if (o.to) s.add(o.to); }
  }
  return [...s];
};

console.log('RENDER-STANDARD 3.ab · connected fragments, PLAYER frame, threshold ' + THR + '/255');
console.log('scene ' + scene.id + '\n');
let findings = 0;
for (let i = 0; i < scene.views.length; i++) {
  const v = scene.views[i], beat = i + 1;
  if (onlyBeat != null && beat !== onlyBeat) continue;
  for (const key of subjectsOf(v)) {
    if (onlyKey && key !== onlyKey) continue;
    const r = await maskOf(scene, v, key, THR);
    if (!r || r.error) { console.log('beat ' + beat + '  ' + key + '  -- ' + ((r && r.error) || 'not mounted')); continue; }
    const raw = components(r.mask, r.W, r.H);
    const cl = components(close(Uint8Array.from(r.mask), r.W, r.H, 2), r.W, r.H);
    const ink = raw.reduce((a, c) => a + c.px, 0);
    const flagIt = cl.length > 1;
    if (flagIt) findings++;
    /* THE NUMBER THAT ACTUALLY ANSWERS THE QUESTION, reported beside the counts and never thresholded
       here: how much of the structure's ink is in its LARGEST piece. A count alone cannot tell a rod
       broken into four beads (shares near a quarter each) from a rod with three stray antialiased
       specks beside it (share 0.998), and both arrive as "4". A one-pixel component survives the
       closing — dilate then erode returns it unchanged — which is correct for a measure of CONNECTION
       and useless as a measure of what a student sees. No floor is applied, because picking one is
       picking an answer; read the share. */
    const biggest = raw.length ? raw[0].px / ink : 1;
    console.log((flagIt ? 'LOOK  ' : '      ') + 'beat ' + beat + '  ' + key +
      '  fragments ' + raw.length + ' raw, ' + cl.length + ' after the sub-4px hairline discount' +
      '   largest piece holds ' + (100 * biggest).toFixed(1) + '% of its ink' +
      '   ink ' + (100 * ink / (r.W * r.H)).toFixed(3) + '% of frame, camera ' + r.dir + ' at t=' + r.t);
    if (raw.length > 1) console.log('            raw pieces, largest first: ' +
      raw.slice(0, 8).map(c => c.px + 'px y' + c.box[1] + '-' + c.box[3]).join(', ') +
      (raw.length > 8 ? ', ...' : ''));
  }
}
console.log('\n' + findings + ' structure-beats have more than one component after the discount. ' +
  'More than one IS A QUESTION TO ANSWER, not an automatic defect: four intervertebral nuclei are ' +
  'four components and that is correct. The rule is about structures a narration calls CONTINUOUS.');
if (log.length) console.log('\nconsole: ' + log.length + ' error(s): ' + log.slice(0, 5).join(' | '));
await browser.close(); server.close();
