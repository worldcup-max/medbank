/* MedBank · WALK A SCENE IN THE REAL PLAYER
 *
 * Every measurement harness in this corpus so far has REIMPLEMENTED viz3d.js — its ops, its painting,
 * its framing — and every one of them has been found wrong by the next review round. Rounds 1, 2 and 3
 * of heart-external were each measured on a different picture the player never draws:
 *   round 1 on a bare shell no beat shows;
 *   round 2 on a cumulative replay (the player resets visibility per view);
 *   round 3 on a frame fitted by a formula that is not viz3d's distanceForBox (review round 3, finding 1).
 * Round 3's review proposed the rule "a harness that quotes a percentage must draw the player's frame,
 * and must obtain its camera from the player's own framing rather than reimplement it".
 *
 * THIS TOOL DOES NOT REIMPLEMENT ANY OF IT. It loads viz3d.js, mounts the scene with MB3D.mountScene,
 * and CLICKS THE VIEW CHIPS — the same DOM buttons a student presses. So the ops, the reset semantics,
 * the authored opacity, the ghosting, CROSS_SECTION, PEEL_LAYER and the per-view camera refit are the
 * player's own code by construction and cannot drift from it. There is nothing here to keep in sync.
 *
 * WHAT IT MEASURES, per beat:
 *  - the subject mask, against the background sampled from a frame with every structure hidden (the
 *    player clears to 0x141225, NOT the 0x0e1626 the round-3 harness assumed);
 *  - SUBJECT PIXELS TOUCHING THE FRAME BORDER — the assertion round 3's finding 1 asked for. THE
 *    SUBJECT IS NOT EVERYTHING LIT. viz3d's subjectBox() frames on state.only under ISOLATE_REGION and
 *    COMPARE_STRUCTURES, and its own comment says the ghosted context "is context, and it is allowed to
 *    run off the edges". Asserting on every lit pixel therefore reports a defect on every isolating
 *    beat, which is the player working as designed. So the subject is read out of the LIVE PLAYER: a
 *    visible structure whose applied material.opacity is below its authored opacity has been ghosted by
 *    the player and is context; everything else visible is subject. That is the player's own state, not
 *    a second opinion about it.
 *  - each structure's share by with/without difference, the method RENDER-STANDARD names. The structure
 *    is hidden through player.meshes[k].visible AFTER the beat's camera has settled, so the camera does
 *    not move between the two renders and the difference is the structure and nothing else.
 *
 * Exits non-zero if any beat clips, if the console is not clean, or if a beat's shares had to be
 * SUPPRESSED because the frame moved while they were being taken (see the stillness check below).
 * That last one is new on 2026-10-01 and it fires on every beat carrying TRACE_STRUCTURE, so a
 * scene that used to exit 0 may now exit 1 without having changed. The exit is deliberate: a beat
 * whose shares could not be measured is not a beat that measured fine, and the summary line alone
 * has proved too quiet a place to say so in this corpus. Nothing automated calls this tool — it is
 * run by hand by the build and review tasks — so no pipeline breaks on the change.
 * Usage: node viz-training/tools/walk-scene-in-player.mjs <scene-id-or-path> [--out DIR] [--beats 1,2]
 */
import { chromium } from 'playwright';
import { readFileSync, writeFileSync, mkdirSync, existsSync, readdirSync } from 'fs';
import http from 'http'; import path from 'path'; import fs from 'fs';
import { PNG } from 'pngjs';

const ROOT = process.cwd();
const args = process.argv.slice(2);
const argv = (f, d) => { const i = args.indexOf(f); return i >= 0 ? args[i + 1] : d; };
const who = args.find(a => !a.startsWith('--') && args[args.indexOf(a) - 1] !== '--out' && args[args.indexOf(a) - 1] !== '--beats');
if (!who) { console.error('usage: walk-scene-in-player.mjs <scene-id-or-path> [--out DIR] [--beats 1,2]'); process.exit(2); }
const SCENE_PATH = existsSync(who) ? who : `viz-training/scenes/${who}.json`;
if (!existsSync(SCENE_PATH)) { console.error('no such scene: ' + SCENE_PATH); process.exit(2); }
const scene = JSON.parse(readFileSync(SCENE_PATH, 'utf8'));
const OUT = argv('--out', `viz-training/models-out/${scene.id}/player-walk`);
mkdirSync(OUT, { recursive: true });
const wantBeats = (argv('--beats', '') || '').split(',').filter(Boolean).map(Number);

const W = 1040, H = 1040;

/* ---- MESH SCENES. Added 2026-10-01, and the reason is the whole gross-anatomy half of this corpus.
 *
 * This harness was believed to be procedural-only. It is not, and never was: it drives viz3d through
 * mountScene and the view chips, so the provider is whatever the scene declares. What stopped it on a
 * `bodyparts3d` scene was ONE MISSING CONFIG LINE. The page below set MODEL_BASE and not MESH_BASE, so
 * the bodyparts3d adapter fell back to `stlBase` — the live Supabase bucket — and the offsite guard
 * further down (correctly) aborted every STL. viz3d then took its `if (!loadedKeys.length)` branch,
 * which returns BEFORE buildChips(), so the walk died on `.mb3d-chip`[0] being undefined with
 * "Cannot read properties of undefined (reading 'click')" — an error that names the DOM and says
 * nothing about meshes. MEASURED here on gross__pelvis-perineum__bony-pelvis before the fix: 16 of 16
 * STLs aborted, 0 chips, that exact crash.
 *
 * So the gap the 2026-09-30 review called "a bigger hole than anything else on this list" — that no
 * tool walks a MESH scene the way the player draws it — was never a missing tool. Self-hosting is a
 * config line, not a code change: viz3d's own resolve() says so in those words. Nothing is
 * reimplemented here; MESH_BASE simply points at the repo's own meshes/ over the harness's own server,
 * which is also what keeps the run offline.
 *
 * TIER FIDELITY. The adapter resolves role 'part' to tier 'full' and 'context' to 'lite', but with no
 * MESH_TIERS both tiers return MESH_BASE — and config.js ships with MESH_TIERS commented out. So one
 * base directory is what a student gets today, and pinning MESH_TIERS here would measure a corpus
 * nobody is served. Left alone deliberately. */
const MESH_DIR = 'viz-training/meshes';
const MIME = { '.js': 'text/javascript', '.json': 'application/json', '.html': 'text/html',
               '.stl': 'model/stl' };
const server = http.createServer((req, res) => {
  const p = path.join(ROOT, decodeURIComponent(req.url.split('?')[0]));
  fs.readFile(p, (e, buf) => {
    if (e) { res.writeHead(404); return res.end('no'); }
    res.writeHead(200, { 'content-type': MIME[path.extname(p)] || 'application/octet-stream' }); res.end(buf);
  });
});
await new Promise(r => server.listen(0, r));
const BASE = `http://127.0.0.1:${server.address().port}/`;

/* ---- PREFLIGHT, AND IT IS NOT BOOKKEEPING ----
 * viz3d opens a scene on whichever comes first, every mesh or an 8-second deadline, and folds stragglers
 * in afterwards. That is right for a student on bad mobile data and WRONG for a measuring harness: a
 * walk that quietly reports shares for a scene drawing 3 of its 20 bones has measured a picture nobody
 * will ever see, and every percentage in it is fiction. The failure is silent by construction, because
 * the player is designed not to make a fuss.
 * So the mesh files are checked on disk BEFORE the browser starts — a missing STL is a fact about the
 * repo, available instantly, and worth more as an error than as a 404 ten seconds later. */
const meshRefs = (scene.structures || [])
  .filter(st => st.refs && st.refs.bodyparts3d)
  .map(st => ({ key: st.key, id: st.refs.bodyparts3d, role: st.role }));
if (meshRefs.length) {
  const missing = meshRefs.filter(r => !existsSync(path.join(ROOT, MESH_DIR, r.id + '.stl')));
  console.log(`mesh scene: ${meshRefs.length} bodyparts3d refs, served from ${MESH_DIR}/`);
  if (missing.length) {
    console.error(`\nCANNOT WALK THIS SCENE: ${missing.length} of ${meshRefs.length} meshes are not in ${MESH_DIR}/`);
    for (const m of missing) console.error(`  ${m.key.padEnd(28)} ${m.id}.stl`);
    console.error('\nStage them before walking. A partial scene measures a picture no student is shown.');
    server.close(); process.exit(2);
  }
}

/* three and its three example scripts are served from node_modules, at the version package.json pins.
   viz3d.js's loadThree() short-circuits when THREE, STLLoader and a controls class are already present,
   so it never reaches its CDN list — and the request interception below would refuse it if it tried. */
const page_html = `<!doctype html><meta charset=utf8><title>walk</title><link rel="icon" href="data:,">
<body style="margin:0;background:#141225">
<div id="host" style="width:${W}px;height:${H}px"></div>
<script>window.MEDBANK_CONFIG = { MODEL_BASE: '${BASE}models3d/', MESH_BASE: '${BASE}${MESH_DIR}/', FEATURES: { MODEL3D: true } };
/* No voice in a headless container: speech is not what is under test and a pending utterance keeps
   the player's Play sequence waiting. Stubbed BEFORE viz3d.js so nothing reaches for a real one. */
window.speechSynthesis = { speak(){}, cancel(){}, getVoices(){ return []; }, addEventListener(){} };
window.SpeechSynthesisUtterance = function(){ this.addEventListener = function(){}; };
<\/script>
<script src="${BASE}node_modules/three/build/three.js"><\/script>
<script src="${BASE}node_modules/three/examples/js/controls/TrackballControls.js"><\/script>
<script src="${BASE}node_modules/three/examples/js/controls/OrbitControls.js"><\/script>
<script src="${BASE}node_modules/three/examples/js/loaders/STLLoader.js"><\/script>
<script src="${BASE}viz3d.js"><\/script>`;
writeFileSync(`${OUT}/_walk.html`, page_html);

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
const page = await browser.newPage({ viewport: { width: W + 40, height: H + 260 } });
const log = [], offsite = [];
page.on('console', m => { if (m.type() === 'error' || m.type() === 'warning') log.push(m.type() + ': ' + m.text()); });
page.on('pageerror', e => log.push('pageerror: ' + e.message));
/* Nothing may leave 127.0.0.1. A CDN fetch is a RENDER-STANDARD violation and it would also mean the
   version under test is not the version package.json pins. */
await page.route('**/*', r => {
  const u = r.request().url();
  if (u.startsWith(BASE) || u.startsWith('data:') || u.startsWith('blob:')) return r.continue();
  offsite.push(u); return r.abort();
});
await page.goto(`${BASE}${OUT}/_walk.html`);
await page.waitForFunction('window.MB3D && window.MB3D.mountScene');

await page.evaluate(async (s) => {
  window.__p = await window.MB3D.mountScene(document.getElementById('host'), s, { via: 'harness' });
}, scene);
await page.waitForFunction('window.__p && window.__p.alive()', null, { timeout: 60000 });

/* The files existed; that is not the same as the player holding them. Checked against the player's own
   `meshes` map, which is only written on a successful load, so this catches a decode failure or a load
   that lost a race as well as a fetch that never arrived. Chips are the other half of the same question:
   viz3d's `if (!loadedKeys.length)` branch returns before buildChips(), so no chips means no meshes, and
   clicking chip[0] would otherwise throw a TypeError about the DOM. */
if (meshRefs.length) {
  const held = await page.evaluate(ks => ks.filter(k => !window.__p.meshes[k]),
    meshRefs.map(r => r.key));
  const chips = await page.evaluate(() => document.querySelectorAll('#host .mb3d-chip').length);
  console.log(`player holds ${meshRefs.length - held.length}/${meshRefs.length} mesh structures; ${chips} view chips built`);
  if (held.length || chips !== scene.views.length) {
    console.error(`\nMOUNT INCOMPLETE — not measuring.`);
    if (held.length) console.error('  missing from player.meshes: ' + held.join(', '));
    if (chips !== scene.views.length) console.error(`  chips ${chips}, views ${scene.views.length}`);
    await browser.close(); server.close(); process.exit(2);
  }
}

/* ---- STOP THE OPENING GLANCE, AND PUT THE MODEL BACK AT THE YAW THE SCENE AUTHORED ----
   mount() calls startSpin(), and the loop then does `holder.rotation.y += dt * 0.55` for three
   seconds. NOTHING RESETS IT. So a viewer who lets the glance finish is left with the model yawed,
   and every later ROTATE_TO_VIEW moves the CAMERA to a world axis — it does not turn the model back —
   so the named views are measured, and seen, through that leftover yaw. MEASURED in this container:
   0.0825 rad at ready, 0.4400 rad (25.2 deg) five seconds later, still spinning. `dt` is capped at
   0.05 s a frame, so the total is FRAME-RATE DEPENDENT: about 0.55 rad/s of wall time on a machine
   fast enough to keep up, i.e. ~1.65 rad (94 deg) over the full three seconds, and less on a slow one.
   That is a viz3d behaviour, not a heart-external one, and viz3d is shared — so it is reported, not
   changed here. See the run's reply and BUILD-LOG.

   The harness stops the spin the documented way, which is also the way a student stops it: a
   pointerdown on the canvas, which viz3d binds stopSpin to. Then the holder is set back to the scene's
   authored initialYaw, because that is the only orientation the named views are defined against, and
   measuring "anterior" at an arbitrary yaw measures nothing. Both are declared here rather than done
   quietly: everything else in this walk is the player's own code. */
await page.evaluate(() => {
  window.__p.renderer.domElement.dispatchEvent(new PointerEvent('pointerdown', { bubbles: true }));
});
const yawBefore = await page.evaluate(() => window.__p.holder.rotation.y);
await page.evaluate(y => { window.__p.holder.rotation.y = y; window.__p.holder.updateMatrixWorld(true); },
  (scene.camera && scene.camera.initialYaw) || 0);
await page.waitForTimeout(300);
const yawAfter = await page.evaluate(() => window.__p.holder.rotation.y);
console.log(`opening spin stopped at yaw ${yawBefore.toFixed(4)} rad (${(yawBefore * 180 / Math.PI).toFixed(1)} deg);` +
            ` model set back to the authored initialYaw ${yawAfter.toFixed(4)}`);

/* READ THE PLAYER'S OWN FRAMEBUFFER. Playwright's element screenshot goes through the browser's
   capture path and cost 5-10 s a frame under swiftshader — with ~20 structures a beat and two renders
   each, a 16-beat walk did not finish. Re-issuing the player's OWN draw call and reading the canvas in
   the same JS turn is the same framebuffer, and it does not depend on preserveDrawingBuffer because
   nothing composites in between. This is the player's scene and the player's camera; the harness only
   asks for the pixels. */
const shot = async () => {
  const url = await page.evaluate(() => {
    const p = window.__p;
    p.renderer.render(p.object3d, p.camera);
    return p.renderer.domElement.toDataURL('image/png');
  });
  return PNG.sync.read(Buffer.from(url.slice(url.indexOf(',') + 1), 'base64'));
};
/* the render loop is still running and still owns the camera; this only waits for it to have drawn */
async function settleFrames() {
  const a = await page.evaluate(() => window.__p.frames());
  await page.waitForFunction(f => window.__p.frames() > f + 1, a, { timeout: 15000 }).catch(() => {});
}

/* ---- background, measured rather than assumed ---- */
const allKeys = await page.evaluate(() => Object.keys(window.__p.meshes));
await page.evaluate(() => { for (const k of Object.keys(window.__p.meshes)) window.__p.meshes[k].visible = false; });
await settleFrames();
const bgPng = await shot();
const BG = [bgPng.data[0], bgPng.data[1], bgPng.data[2]];
writeFileSync(`${OUT}/_background.png`, PNG.sync.write(bgPng));

/* authored opacity, from the scene JSON — the ceiling the player paints against */
const AUTHORED = {};
for (const st of scene.structures) AUTHORED[st.key] = (typeof st.opacity === 'number') ? Math.max(0.02, Math.min(1, st.opacity)) : 1;

const TH = 3;
function masks(img, ref) {
  let lit = 0, diff = 0, border = 0;
  let x0 = 1e9, y0 = 1e9, x1 = -1, y1 = -1;
  const w = img.width, h = img.height;
  for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
    const i = (y * w + x) * 4;
    const isLit = Math.abs(img.data[i] - BG[0]) > TH || Math.abs(img.data[i+1] - BG[1]) > TH || Math.abs(img.data[i+2] - BG[2]) > TH;
    if (isLit) {
      lit++;
      if (x === 0 || y === 0 || x === w - 1 || y === h - 1) border++;
      if (x < x0) x0 = x; if (x > x1) x1 = x; if (y < y0) y0 = y; if (y > y1) y1 = y;
    }
    if (ref && (Math.abs(img.data[i] - ref.data[i]) > TH || Math.abs(img.data[i+1] - ref.data[i+1]) > TH
             || Math.abs(img.data[i+2] - ref.data[i+2]) > TH)) diff++;
  }
  /* THE SILHOUETTE'S EXTENT, not just its area. A sparse subject legitimately lights few pixels; a subject
     the camera stood too far back from lights few pixels AND spans a small part of the frame. Only the
     second is a framing fault, and area alone cannot tell them apart. */
  const span = lit ? { w: (x1 - x0 + 1) / w, h: (y1 - y0 + 1) / h } : { w: 0, h: 0 };
  return { lit, diff, border, span, px: w * h };
}

const report = []; let clipped = 0, unstable = 0;
const views = scene.views.filter(v => !wantBeats.length || wantBeats.includes(v.beat));
for (const v of views) {
  const i = scene.views.indexOf(v);
  await page.evaluate(k => { document.querySelectorAll('#host .mb3d-chip')[k].click(); }, i);
  await page.waitForTimeout(1500);           // easeCamera is 700ms; restage may rebuild geometry first
  /* hold the authored yaw: restage() and a late mesh both re-enter fit(), which restores whatever
     rotation the holder had, and a stray spin tick would otherwise creep back in between beats */
  await page.evaluate(y => { window.__p.holder.rotation.y = y; window.__p.holder.updateMatrixWorld(true); },
    (scene.camera && scene.camera.initialYaw) || 0);
  await settleFrames();
  await settleFrames();
  /* ---- IS THIS BEAT HOLDING STILL? ----
   *
   * Every `share` below is a difference between two renders taken about a second apart: the beat as
   * composed, then the beat with one structure's `visible` set to false. That is a measurement of the
   * structure only if nothing else moved in between.
   *
   * WHAT WENT WRONG, because the first fix for it was wrong and the second would not exist without
   * that. `gross__pelvis-perineum__bony-pelvis` beat 2 reported TWELVE structures at ~97.3% of subject
   * each, among them `bladder`, `rectum` and `right_coccygeus`. Obviously false. First hypothesis: the
   * frame is animating, so render the same state twice and see. MEASURED: the two renders differed by
   * ZERO pixels. The hypothesis was wrong and the check that tested it would have passed the beat.
   *
   * The cause is in viz3d's `trace()`, and it is not continuous animation. A trace advances in DISCRETE
   * steps of `max(1600, duration*1000/path.length)` ms, and each step does three things: it resets
   * `state.hi` to one waypoint, it re-ghosts with `state.only = [k]`, and it calls `flyTo(..., 900)` —
   * it MOVES THE CAMERA. Between waypoints the frame is perfectly still, which is why two back-to-back
   * renders agreed; across a waypoint boundary almost every pixel changes. The share loop runs about a
   * second per structure, so it straddles boundary after boundary, and what it recorded was the camera
   * flight attributed to whichever structure happened to be hidden at the time.
   *
   * SO: wait the trace out, then check stillness over the interval that actually matters. The wait is
   * computed from the ops the same way `trace()` computes it. The check is at the END of the share
   * loop, comparing against the reference frame — if those two disagree, something moved during the
   * measurement and no share from this beat is quotable, whatever caused it. The end-of-loop form is
   * the general one and would have caught this; the instantaneous form did not, and is gone. */
  let traceWaitMs = 0;
  for (const o of (v.ops || [])) {
    if (o.op !== 'TRACE_STRUCTURE') continue;
    const n = Math.max(1, (o.path || []).length);
    traceWaitMs = Math.max(traceWaitMs, n * Math.max(1600, ((o.duration || 6) * 1000) / n) + 900 + 600);
  }
  if (traceWaitMs) {
    console.log(`beat ${String(v.beat).padStart(2)}  TRACE_STRUCTURE — waiting ${(traceWaitMs / 1000).toFixed(1)}s for the walk ` +
                `to finish before measuring; the frame measured is the trace's last waypoint, which is where the player parks it.`);
    await page.waitForTimeout(traceWaitMs);
    await page.evaluate(y => { window.__p.holder.rotation.y = y; window.__p.holder.updateMatrixWorld(true); },
      (scene.camera && scene.camera.initialYaw) || 0);
    await settleFrames(); await settleFrames();
  }

  const full = await shot();
  const m0 = masks(full, null);
  const FRAME_PX = m0.px;
  writeFileSync(`${OUT}/beat-${String(v.beat).padStart(2, '0')}.png`, PNG.sync.write(full));

  /* what the player itself considers visible right now, and at what opacity — its state, not a replay */
  const painted = await page.evaluate(() => {
    const o = {};
    for (const k of Object.keys(window.__p.meshes)) {
      const m = window.__p.meshes[k];
      if (!m.visible) continue;
      let op = null;
      m.traverse(n => { if (n.isMesh && op === null && !(n.userData && n.userData.outline)) op = n.material.opacity; });
      o[k] = op == null ? (m.material ? m.material.opacity : 1) : op;
    }
    return o;
  });
  const vis = Object.keys(painted);
  const subjectKeys = vis.filter(k => painted[k] >= (AUTHORED[k] == null ? 1 : AUTHORED[k]) - 1e-6);
  const ghosted = vis.filter(k => subjectKeys.indexOf(k) < 0);
  /* the SUBJECT mask: the same camera, with the player's ghosted context hidden */
  let mS = m0;
  if (ghosted.length) {
    await page.evaluate(ks => { for (const k of ks) window.__p.meshes[k].visible = false; }, ghosted);
    await settleFrames();
    const subjOnly = await shot();
    writeFileSync(`${OUT}/beat-${String(v.beat).padStart(2, '0')}-subject.png`, PNG.sync.write(subjOnly));
    mS = masks(subjOnly, null);
    await page.evaluate(ks => { for (const k of ks) window.__p.meshes[k].visible = true; }, ghosted);
    await settleFrames();
  }

  const row = { beat: v.beat, title: v.title, lit: m0.lit, litOfFrame: m0.lit / FRAME_PX,
                framePx: FRAME_PX, spanW: m0.span.w, spanH: m0.span.h,
                litAll: m0.lit, borderAllPx: m0.border,
                subjectKeys, ghostedKeys: ghosted,
                subjectLit: mS.lit, subjectSpanW: mS.span.w, subjectSpanH: mS.span.h,
                borderPx: mS.border, visible: vis.length, shares: [] };
  if (mS.border > 0) {
    clipped++;
    row.clipped = true;
    console.log(`\nbeat ${String(v.beat).padStart(2)}  CLIPPED — ${mS.border} SUBJECT px on the frame border (subject = ${subjectKeys.length} of ${vis.length} visible). No share reported.  ${v.title}`);
  } else {
    for (const k of vis) {
      await page.evaluate(key => { window.__p.meshes[key].visible = false; }, k);
      await settleFrames();
      const without = await shot();
      const { diff } = masks(without, full);
      await page.evaluate(key => { window.__p.meshes[key].visible = true; }, k);
      row.shares.push({ key: k, px: diff, ofSubject: m0.lit ? diff / m0.lit : 0, ofFrame: diff / FRAME_PX });
    }
    row.shares.sort((a, b) => b.px - a.px);

    /* STILLNESS, OVER THE INTERVAL THAT WAS ACTUALLY MEASURED. The loop above restored every structure
       it hid, so the scene is back in the state `full` was taken in. Any difference now is something
       that moved on its own while the shares were being taken, and it invalidates all of them —
       the loop cannot say which pixels were the structure and which were the movement. Checked here
       rather than instantaneously because the fault this exists for (viz3d's trace flying the camera
       between discrete waypoints) is invisible to two back-to-back renders and obvious to this. */
    await settleFrames(); await settleFrames();
    const again = await shot();
    const loopDrift = masks(again, full).diff;
    row.loopDriftPx = loopDrift;
    row.loopDriftOfLit = m0.lit ? loopDrift / m0.lit : 0;
    row.sharesUnreliable = row.loopDriftOfLit > 0.01;

    console.log(`\nbeat ${String(v.beat).padStart(2)}  lit ${(100 * m0.lit / FRAME_PX).toFixed(1)}% of frame; SUBJECT (${subjectKeys.length}/${vis.length}) spans ${(100*mS.span.w).toFixed(0)}%x${(100*mS.span.h).toFixed(0)}%, ${ghosted.length} ghosted   ${v.title}`);
    if (row.sharesUnreliable) {
      unstable++;
      console.log(`     SHARES SUPPRESSED — the frame moved during the measurement: ${loopDrift} px ` +
        `(${(100 * row.loopDriftOfLit).toFixed(1)}% of lit) differ between the reference frame and the same ` +
        `state re-rendered after the loop. Nothing below is quotable, so nothing below is printed.`);
      row.shares = [];
    } else {
      console.log(`     frame still over the measurement: ${loopDrift} px drift`);
      for (const s of row.shares) console.log('     ' + s.key.padEnd(30) +
        (100 * s.ofSubject).toFixed(3).padStart(8) + '% of subject' + (100 * s.ofFrame).toFixed(3).padStart(8) + '% of frame');
    }
  }
  report.push(row);
  await settleFrames();
}

await browser.close(); server.close();
writeFileSync(`${OUT}/shares.json`, JSON.stringify({ scene: scene.id, background: BG, report }, null, 1));
console.log('\nbackground sampled:', BG.join(','));
console.log('console:', log.length ? log.join(' | ') : 'clean');
console.log('offsite requests refused:', offsite.length ? offsite.join(' | ') : 'none');
console.log(`beats walked: ${report.length}, clipped: ${clipped}, shares suppressed as unstable: ${unstable}`);
if (clipped || unstable || log.length || offsite.length) process.exit(1);
