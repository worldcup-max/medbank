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
 *   node viz-training/tools/measure-view-framing.mjs --all [--out <dir>] [--jobs 2] [--resume]
 *
 * --all IS A GATE. It walks every scene it can load, applies the thresholds in VERDICT below, prints
 * one summary, and EXITS NON-ZERO if any view fails. Added 2026-09-10 after review round 2: the item
 * this tool exists for claimed to repair 71 shipped scenes and had been measured on two of them, and
 * "which scenes did you sample" is not a question a proof should leave open. --resume + one JSON file
 * per scene under --out means a run that dies half way is continued rather than restarted, which is
 * what makes a corpus-wide pass affordable at ~70s a scene.
 *
 * THE THRESHOLDS (VERDICT):
 *   · clippedAtRest      — the subject must be inside the frustum with the scene at rest.
 *   · fillH/fillW < 100  — the subject must FIT. 100% of frame height is not "filling the frame",
 *                          it is the edge of running off it, and every failure found in round 2
 *                          landed at exactly 100.0.
 *   · lit > 0            — the student must be able to see something. Confirmed by a re-render before
 *                          it is believed (see BLANK READINGS).
 *
 * BLANK READINGS. Under CPU contention this tool has returned lit:0 for views that are fine. Every
 * blank is now re-read after a fresh render and a settle, and a view only reports lit:0 if the second
 * read agrees; `blankConfirmed` records that it did. A faint second threshold (litFaint, at a
 * difference of 4 rather than 18) separates "nothing was drawn" from "everything on screen is ghosted
 * to 10% and the strict threshold cannot see it" — a distinction the single threshold could not make.
 *
 * TWO DEFECTS FIXED HERE, both found by using the tool rather than by reading it:
 *  (a) the harness page was written to one fixed path, so two runs at once overwrote each other's
 *      MEDBANK_CONFIG, every mesh fetch failed CORS against the other run's port, and the scene
 *      reported 0 views and ~400 console errors — two false findings before anyone re-ran it serially.
 *      The page is now named per scene, which is also what makes --jobs safe.
 *  (b) extent() ignored every mesh below 0.5 opacity, so on a view where EVERYTHING ends up ghosted it
 *      returned null and clippedAtRest read false — blind, not clean, on 3 of intervertebral-disc's 7
 *      views and on kidney view 3. It now falls back to the visible set and says so in `subjectFrom`,
 *      because an unmeasured view must never score as a passing one.
 */
import { chromium } from 'playwright';
import { readFileSync, writeFileSync, mkdirSync, existsSync, readdirSync } from 'fs';
import http from 'http'; import path from 'path'; import fs from 'fs';

const ROOT = process.cwd();
const args = process.argv.slice(2);
const has = n => args.indexOf(n) >= 0;
const argOf = (n, d) => { const i = args.indexOf(n); return i >= 0 ? args[i + 1] : d; };
const ALL = has('--all');
const OUT = argOf('--out', 'viz-training/models-out/_framing/all');
const JOBS = Math.max(1, parseInt(argOf('--jobs', '1'), 10) || 1);
const RESUME = has('--resume');
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

const W = 1280, H = 900;

/* The harness page. Named per scene — see defect (a) above. */
function pageFor(id) {
  return `<!doctype html><meta charset=utf8><link rel="icon" href="data:,">
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
   find the bounding box of everything that is not the background clear colour.

   TWO thresholds, not one. 18 is "solidly drawn". 4 also catches a frame where every structure is
   ghosted to 10% — which reads as an empty canvas at 18, and an empty canvas is reported very
   differently from a faint one. edgeTouch is the PHOTOGRAPHIC clip signal: lit pixels against the
   frame border. It is reported rather than asserted on, because ghosted CONTEXT is allowed to run off
   the edges by design — but when it disagrees with the geometric read, believe this one. */
window.measure = function () {
  var p = MB3D.player(); if (!p) return null;
  p.controls.autoRotate = false;
  p.renderer.render(p.object3d, p.camera);
  var gl = p.renderer.getContext();
  var w = gl.drawingBufferWidth, h = gl.drawingBufferHeight;
  var buf = new Uint8Array(w * h * 4);
  gl.readPixels(0, 0, w, h, gl.RGBA, gl.UNSIGNED_BYTE, buf);
  var br = buf[0], bg = buf[1], bb = buf[2];      // corner pixel IS the clear colour
  var minx = 1e9, maxx = -1e9, miny = 1e9, maxy = -1e9, lit = 0, faint = 0;
  for (var y = 0; y < h; y++) for (var x = 0; x < w; x++) {
    var i = (y * w + x) * 4;
    var d = Math.abs(buf[i] - br) + Math.abs(buf[i+1] - bg) + Math.abs(buf[i+2] - bb);
    if (d > 4) faint++;
    if (d > 18) { lit++; if (x < minx) minx = x; if (x > maxx) maxx = x; if (y < miny) miny = y; if (y > maxy) maxy = y; }
  }
  if (lit === 0) return { lit: 0, litFaint: faint, wpct: 0, hpct: 0, areapct: 0, edgeTouch: null, w: w, h: h };
  return {
    lit: lit, litFaint: faint, w: w, h: h,
    wpct: +(((maxx - minx + 1) / w) * 100).toFixed(1),
    hpct: +(((maxy - miny + 1) / h) * 100).toFixed(1),
    areapct: +((lit / (w * h)) * 100).toFixed(2),
    edgeTouch: (minx <= 0 || maxx >= w - 1 || miny <= 0 || maxy >= h - 1)
  };
};
/* An INDEPENDENT read of the same question, geometric rather than photographic: project the corners
   of every SUBJECT mesh's world box and see what fraction of the frame they span. It does not consult
   the player's own framing state — a mesh at full opacity is the subject, one ghosted to 10% is
   context — so it cannot agree with frameView() by construction. The yaw argument spins the holder,
   is what the opening spin and every drag do, to check the fit survives the rotation it will get.

   When NOTHING is at full opacity the opacity rule has no subject to offer, and returning null there
   scored an unmeasured view as an unclipped one. Fall back to the visible set and say which set was
   used, so a reader can tell a clean view from a blind one. */
window.extent = function (yaw) {
  var p = MB3D.player(); if (!p) return null;
  var y0 = p.holder.rotation.y;
  if (yaw) p.holder.rotation.y = y0 + yaw;
  p.holder.updateMatrixWorld(true);
  p.camera.updateMatrixWorld(true); p.camera.updateProjectionMatrix();
  function span(minOpacity) {
    var minx = 1e9, maxx = -1e9, miny = 1e9, maxy = -1e9, n = 0;
    Object.keys(p.meshes).forEach(function (k) {
      var m = p.meshes[k];
      if (!m || !m.visible) return;
      if (minOpacity != null && m.material.opacity < minOpacity) return;
      if (!m.geometry.boundingBox) m.geometry.computeBoundingBox();
      var bb = m.geometry.boundingBox;
      for (var i = 0; i < 8; i++) {
        var v = new THREE.Vector3(i & 1 ? bb.max.x : bb.min.x, i & 2 ? bb.max.y : bb.min.y, i & 4 ? bb.max.z : bb.min.z);
        m.localToWorld(v); v.project(p.camera); n++;
        if (v.x < minx) minx = v.x; if (v.x > maxx) maxx = v.x;
        if (v.y < miny) miny = v.y; if (v.y > maxy) maxy = v.y;
      }
    });
    if (!n) return null;
    return { minx: minx, maxx: maxx, miny: miny, maxy: maxy };
  }
  var from = 'opaque', s = span(0.5);
  if (!s) { s = span(null); from = 'visible'; }
  p.holder.rotation.y = y0; p.holder.updateMatrixWorld(true);
  if (!s) return null;
  return {
    subjectFrom: from,
    fillW: +(((s.maxx - s.minx) / 2) * 100).toFixed(1),
    fillH: +(((s.maxy - s.miny) / 2) * 100).toFixed(1),
    clipped: (s.minx < -1 || s.maxx > 1 || s.miny < -1 || s.maxy > 1)
  };
};
window.chipCount = function () { return document.querySelectorAll('.mb3d-chip').length; };
window.clickChip = function (i) { var c = document.querySelectorAll('.mb3d-chip'); if (!c[i]) return false; c[i].click(); return true; };
/* Where the camera is, and which way the model is facing. Polled, not slept on — see settle(). */
window.cam = function () { var p = MB3D.player(); if (!p) return null;
  return { pos: p.camera.position.toArray().map(function (n) { return +n.toFixed(4); }),
           tgt: (p.controls.target || new THREE.Vector3()).toArray().map(function (n) { return +n.toFixed(4); }),
           yaw: +p.holder.rotation.y.toFixed(4),
           dist: +p.camera.position.distanceTo(p.controls.target || new THREE.Vector3()).toFixed(4) }; };
<\/script>`;
}

/* SETTLE, DO NOT SLEEP. This tool used to wait a fixed 2200ms after clicking a chip and then read.
 * In headless chromium requestAnimationFrame is throttled unless something keeps talking to the page,
 * so a fixed wait is not a wait — it is a coin toss on whether the camera ease has advanced at all,
 * and under --jobs it is a worse one. Measured: with the fixed wait, the set of views reported as newly
 * clipped CHANGED between two runs of the same code on the same scenes — hip-joint views 7, 8 and 11
 * took turns. A gate whose answer moves between runs is not a gate.
 *
 * Each poll is a page.evaluate, which is what keeps rAF running, and nothing is read until the camera
 * has held still. `settleMs` and `settled` go into the row, so a view that never stops moving — a
 * traced view is supposed to keep moving — is visible as that rather than silently sampled mid-flight.
 */
async function settle(page, { quiet = 3, step = 150, max = 9000 } = {}) {
  const t0 = Date.now();
  let prev = null, same = 0, last = null;
  while (Date.now() - t0 < max) {
    const c = await page.evaluate(() => window.cam());
    last = c;
    const key = c ? c.pos.join() + '|' + c.tgt.join() + '|' + c.yaw : 'null';
    if (key === prev) { if (++same >= quiet) break; } else { same = 0; prev = key; }
    await page.waitForTimeout(step);
  }
  return { cam: last, settleMs: Date.now() - t0, settled: same >= quiet };
}

/* THE GATE. One place, so --all and a single --scene run agree about what "bad" means.
 *
 * THREE KINDS OF BAD, kept apart on purpose, because only the first one is a framing fault and lumping
 * them together is how a corpus bug gets filed against the engine (or an engine bug against a scene).
 *
 *  1 · FRAMING — the camera is in the wrong place. This is what the gate's EXIT CODE is about, so it
 *      stays usable as a regression gate for the thing it was built for.
 *  2 · THE VIEW HIDES ITS OWN SUBJECT — every structure the view singles out has been hidden by the
 *      view's own ops, almost always a PEEL_LAYER peeling the layer its subject lives in. kidney view 3
 *      "Coverings, then cortex to pelvis" peels layer "organ", which is where the kidneys are. No
 *      camera position can put a kidney back in that picture; it is a scene defect.
 *  3 · ISOLATE_REGION GHOSTS ITS OWN SUBJECT — the view's subject IS on screen, but nothing on screen
 *      is above 10% opacity, so the isolate changes nothing a student can see. paint() ghosts every
 *      structure that is not selected or highlighted, and ISOLATE_REGION sets state.only and
 *      state.ghosted but never state.hi — while COMPARE_STRUCTURES, two lines away, does set it. An
 *      engine defect, in paint() rather than in the framing, and NOT fixed in this item: see BUILD-LOG
 *      and REPAIR-BACKLOG.
 *
 * 2 and 3 are counted and named but do not set the exit code, because a gate that is red for a defect
 * it is not the gate for is a gate everybody learns to ignore.
 */
function verdict(row) {
  const framing = [], scene = [], engine = [];
  const subj = row.subject;
  /* "the view hid what it isolated" is asked of the ISOLATED set, not of the whole framing set: a view
     can peel its subject away and still leave the things it named afterwards on screen, which is
     kidney view 3 exactly. */
  const hidesOwnSubject = !!(subj && subj.only.length > 0 && subj.onlyVisible === 0)
                       || !!(subj && (subj.only.length + subj.named.length) > 0 && subj.visible === 0);
  if (hidesOwnSubject) scene.push('the view hides its own subject — all ' + subj.only.length + ' structure(s) it isolates are hidden by its own ops (check PEEL_LAYER)');
  else if (row.noOpaqueSubject) engine.push('nothing on screen is above 10% opacity — ISOLATE_REGION ghosts its own subject (paint(); only COMPARE_STRUCTURES sets state.hi)');

  if (row.clippedAtRest) framing.push('clipped at rest');
  if (row.fillH != null && row.fillH >= 100) framing.push('fillH ' + row.fillH + '% — subject does not fit');
  if (row.fillW != null && row.fillW >= 100) framing.push('fillW ' + row.fillW + '% — subject does not fit');
  if (row.lit === 0 && row.blankConfirmed) framing.push('nothing drawn (lit 0, litFaint ' + row.litFaint + ')');
  if (row.fillH == null && row.fillW == null) framing.push('unmeasurable — no visible geometry');

  /* A view with no subject left on screen measures as clipped and over-full BECAUSE it has no subject.
     Report the cause, not the symptom. */
  return { framing: hidesOwnSubject ? [] : framing, scene, engine,
           all: (hidesOwnSubject ? [] : framing).concat(scene, engine) };
}

async function measureScene(browser, id, shotsDir) {
  const scene = JSON.parse(readFileSync(`viz-training/scenes/${id}.json`, 'utf8'));
  const dir = 'viz-training/models-out/_framing';
  mkdirSync(dir, { recursive: true });
  const pageFile = `${dir}/_player-${id}.html`;
  writeFileSync(pageFile, pageFor(id));

  const p = await browser.newPage({ viewport: { width: W, height: H } });
  const log = [];
  p.on('console', m => log.push({ type: m.type(), text: m.text() }));
  p.on('pageerror', e => log.push({ type: 'pageerror', text: String((e && e.message) || e) }));
  p.on('requestfailed', r => log.push({ type: 'requestfailed', text: r.url() + ' — ' + (r.failure() || {}).errorText }));
  p.on('response', r => { if (r.status() >= 400) log.push({ type: 'http' + r.status(), text: r.url() }); });
  await p.goto(BASE + pageFile);
  await p.waitForFunction('typeof window.mountIt === "function"');
  await p.evaluate(sc => window.mountIt(sc), scene);
  await settle(p, { max: 15000 });         // the 3s opening spin, then held still

  const n = await p.evaluate(() => window.chipCount());
  const rows = [];
  for (let i = 0; i < n; i++) {
    await p.evaluate(k => window.clickChip(k), i);
    const st = await settle(p);            // the camera has stopped, not merely been waited on
    let m = await p.evaluate(() => window.measure());
    let blankConfirmed = false;
    if (m && m.lit === 0) {                // never believe a blank on one read — see BLANK READINGS
      await settle(p, { max: 3000 });
      const again = await p.evaluate(() => window.measure());
      blankConfirmed = !!(again && again.lit === 0);
      if (again && again.lit > 0) m = again;
    }
    const e = await p.evaluate(() => window.extent(0));
    const spun = [];
    for (const yaw of [0.9, 1.8, 2.7, 3.6, 4.5, 5.4]) spun.push(await p.evaluate(y => window.extent(y), yaw));
    /* viewSubject() is the player's own account of what it was asked to frame. Guarded, because this
       same tool has to be able to measure a build of viz3d.js that predates it — that is the whole
       point of a before/after. */
    const subj = await p.evaluate(() => { try { var pl = MB3D.player(); return pl.viewSubject ? pl.viewSubject() : null; } catch (e) { return null; } });
    const row = { view: i + 1, title: (scene.views[i] || {}).title || '', ...m,
                  fillW: e && e.fillW, fillH: e && e.fillH,
                  subjectFrom: e && e.subjectFrom,
                  noOpaqueSubject: !!(e && e.subjectFrom === 'visible'),
                  subject: subj && { only: subj.only, named: subj.named, onlyVisible: subj.onlyVisible,
                                    visible: subj.visibleKeys.length, size: subj.size },
                  blankConfirmed,
                  settled: st.settled, settleMs: st.settleMs,
                  yaw: st.cam && st.cam.yaw, dist: st.cam && st.cam.dist,
                  clippedAtRest: !!(e && e.clipped),
                  clippedUnderSpin: spun.some(x => x && x.clipped),
                  worstFillUnderSpin: Math.max(...spun.map(x => (x ? Math.max(x.fillW, x.fillH) : 0))) };
    const vd = verdict(row);
    row.fails = vd.all; row.framingFails = vd.framing; row.sceneFails = vd.scene; row.engineFails = vd.engine;
    rows.push(row);
    if (shotsDir) {
      mkdirSync(shotsDir, { recursive: true });
      await p.screenshot({ path: `${shotsDir}/view-${String(i + 1).padStart(2, '0')}.png` });
    }
  }
  const noisy = log.filter(l => !/^warning$/.test(l.type) || !/GPU stall due to ReadPixels/.test(l.text));
  await p.close();
  return { scene: id, canvas: rows[0] && { w: rows[0].w, h: rows[0].h }, views: rows, console: noisy,
           failingViews: rows.filter(r => r.framingFails.length).length,
           sceneDefectViews: rows.filter(r => r.sceneFails.length).length,
           engineDefectViews: rows.filter(r => r.engineFails.length).length };
}

const browser = await chromium.launch({
  executablePath: '/opt/pw-browsers/chromium-1194/chrome-linux/chrome',
  args: ['--use-gl=swiftshader', '--enable-unsafe-swiftshader', '--no-sandbox']
});

if (!ALL) {
  const out = await measureScene(browser, SCENE_ID, SHOTS);
  console.log(JSON.stringify(out, null, 2));
  await browser.close(); server.close();
  process.exit(out.failingViews ? 1 : 0);
} else {
  mkdirSync(OUT, { recursive: true });
  const ids = readdirSync('viz-training/scenes')
    .filter(f => f.endsWith('.json') && f !== 'index.json')
    .map(f => f.replace(/\.json$/, ''))
    .filter(id => {
      /* A scene whose meshes are not present here would measure an empty stage and report it as a
         framing failure, which is a lie about the scene. Skip it and SAY SO in the summary. */
      const sc = JSON.parse(readFileSync(`viz-training/scenes/${id}.json`, 'utf8'));
      const refs = (sc.structures || []).map(s => (s.refs || {}).bodyparts3d).filter(Boolean);
      return refs.every(r => existsSync(`viz-training/meshes-lite/${r}.stl`));
    });
  const skipped = readdirSync('viz-training/scenes').filter(f => f.endsWith('.json') && f !== 'index.json').length - ids.length;

  const todo = ids.filter(id => !(RESUME && existsSync(`${OUT}/${id}.json`)));
  console.error(`[framing] ${ids.length} measurable scenes, ${skipped} skipped for missing meshes, ${todo.length} to run, jobs=${JOBS}`);
  let next = 0, done = 0;
  async function worker() {
    for (;;) {
      const i = next++; if (i >= todo.length) return;
      const id = todo[i];
      try {
        const r = await measureScene(browser, id, null);
        writeFileSync(`${OUT}/${id}.json`, JSON.stringify(r, null, 2));
        console.error(`[framing] ${++done}/${todo.length} ${id} — ${r.failingViews} failing of ${r.views.length}`);
      } catch (err) {
        writeFileSync(`${OUT}/${id}.json`, JSON.stringify({ scene: id, error: String(err && err.message || err) }, null, 2));
        console.error(`[framing] ${++done}/${todo.length} ${id} — ERROR ${err && err.message}`);
      }
    }
  }
  await Promise.all(Array.from({ length: JOBS }, worker));

  const all = ids.map(id => existsSync(`${OUT}/${id}.json`) ? JSON.parse(readFileSync(`${OUT}/${id}.json`, 'utf8')) : null).filter(Boolean);
  const framingFailures = [], sceneDefects = [], engineDefects = [];
  let views = 0, errs = 0;
  for (const s of all) {
    if (s.error) { errs++; framingFailures.push({ scene: s.scene, view: null, why: ['tool error: ' + s.error] }); continue; }
    for (const v of s.views) {
      views++;
      if (v.framingFails.length) framingFailures.push({ scene: s.scene, view: v.view, title: v.title, why: v.framingFails });
      if (v.sceneFails.length) sceneDefects.push({ scene: s.scene, view: v.view, title: v.title, why: v.sceneFails });
      if ((v.engineFails || []).length) engineDefects.push({ scene: s.scene, view: v.view, title: v.title, why: v.engineFails });
    }
  }
  console.log(JSON.stringify({
    measured: all.length, scenesSkippedForMissingMeshes: skipped, views, toolErrors: errs,
    framingFailures: framingFailures.length,
    sceneDefects: sceneDefects.length, engineDefectsNotThisItem: engineDefects.length,
    failures: framingFailures, sceneDefectViews: sceneDefects, engineDefectViews: engineDefects
  }, null, 2));
  await browser.close(); server.close();
  /* Only framing sets the exit code — see THE GATE. */
  process.exit(framingFailures.length ? 1 : 0);
}
