/* MedBank · heart-external · WHICH TUBE ENDS ARE EXPOSED, BEAT BY BEAT
 *
 * Round-2 finding 2: every tube in this model ends in a FLAT DISC, nineteen tubeAlong calls against
 * zero domeCap calls. Before capping them, ask which ends are actually in mid-air — a dome stands
 * 0.85 r proud of the disc and, at a join, can push back out through the solid that was hiding it.
 *
 * TWO METHODS WERE TRIED AND THE FIRST WAS WRONG, which is worth keeping on the record. Version one
 * counted ray crossings and called an odd count "inside". That is only valid against CLOSED solids,
 * and half this model is open shells — the chamber territories, the three surface patches and the
 * four borders are single-sided patches offset from the form. Each adds one crossing, so parity
 * flipped at random: the full build reported ends FREE that the vessels-only build had reported
 * buried 26 times out of 26. Adding parts cannot un-bury an end. That contradiction is what showed
 * the METHOD was wrong rather than the model, and it is the same shape as the root finding of both
 * review rounds — a number measured on something that resembles the subject.
 *
 * Version two, here, sums the GENERALISED WINDING NUMBER per mesh: the signed solid angle each
 * triangle subtends at the point, over 4*pi. It is ~1 inside a closed solid and ~0 outside, and an
 * open patch contributes a fraction, so a patch cannot masquerade as a wall.
 *
 * AND THE QUESTION IS PER BEAT, NOT PER BUILD. In the player every structure is built from FULL and
 * the scene's ops toggle VISIBILITY, so an end buried inside desc_aorta is only hidden in a beat
 * that SHOWS desc_aorta — which this scene does in beats 1 and 2 and nowhere else. That is round-2
 * finding 3 exactly, and it is why this probe reports the set of burying keys per end and then
 * intersects it with each beat's own visible set, rather than asking whether the end is buried "in
 * the model".
 */
import { chromium } from 'playwright';
import { writeFileSync, readFileSync, mkdirSync, existsSync, readdirSync } from 'fs';
import http from 'http'; import path from 'path'; import fs from 'fs';

const ROOT = process.cwd();
const OUT = 'viz-training/_build-2026-09-29';
mkdirSync(OUT, { recursive: true });
const MIME = { '.js': 'text/javascript', '.json': 'application/json', '.html': 'text/html' };
const server = http.createServer((req, res) => {
  const p = path.join(ROOT, decodeURIComponent(req.url.split('?')[0]));
  fs.readFile(p, (e, buf) => { if (e) { res.writeHead(404); return res.end('no'); }
    res.writeHead(200, { 'content-type': MIME[path.extname(p)] || 'application/octet-stream' }); res.end(buf); });
});
await new Promise(r => server.listen(0, r));
const BASE = `http://127.0.0.1:${server.address().port}/`;

const html = `<!doctype html><meta charset=utf8><link rel="icon" href="data:,"><body>
<script src="${BASE}node_modules/three/build/three.js"><\/script>
<script src="${BASE}models3d/render-kit.js"><\/script>
<script src="${BASE}models3d/heart-external.js"><\/script>
<script>
const MOD = window.MB3D_MODELS['heart-external'];
/* Van Oosterom & Strackee for one triangle's signed solid angle; no watertightness assumed. */
function windingAt(mesh, P) {
  const pos = mesh.geometry.attributes.position, M = mesh.matrixWorld;
  const a = new THREE.Vector3(), b = new THREE.Vector3(), c = new THREE.Vector3(), cr = new THREE.Vector3();
  let sum = 0;
  for (let i = 0; i + 2 < pos.count; i += 3) {
    a.fromBufferAttribute(pos, i).applyMatrix4(M).sub(P);
    b.fromBufferAttribute(pos, i + 1).applyMatrix4(M).sub(P);
    c.fromBufferAttribute(pos, i + 2).applyMatrix4(M).sub(P);
    const la = a.length(), lb = b.length(), lc = c.length();
    if (la < 1e-9 || lb < 1e-9 || lc < 1e-9) continue;
    sum += 2 * Math.atan2(cr.copy(a).cross(b).dot(c),
      la * lb * lc + a.dot(b) * lc + b.dot(c) * la + c.dot(a) * lb);
  }
  return sum / (4 * Math.PI);
}
window.probe = function () {
  const g = MOD.build(1, MOD.FULL);
  g.updateMatrixWorld(true);
  const ends = MOD.tubeEnds().map(e => Object.assign({}, e));
  const byKey = {};
  g.traverse(o => { if (o.isMesh && o.geometry && !(o.userData || {}).outline)
    (byKey[o.userData.key] = byKey[o.userData.key] || []).push(o); });
  const P = new THREE.Vector3(), A = new THREE.Vector3();
  const out = [];
  for (const e of ends) {
    P.fromArray(e.p);
    /* the dome's apex: 0.85 r along the outward axis, the far point of what capping would add */
    A.fromArray(e.p).addScaledVector(new THREE.Vector3().fromArray(e.d), 0.85 * e.r);
    const disc = {}, apex = {};
    for (const k of Object.keys(byKey)) {
      if (k === e.key) continue;
      let wd = 0, wa = 0;
      for (const m of byKey[k]) { wd = Math.max(wd, Math.abs(windingAt(m, P))); wa = Math.max(wa, Math.abs(windingAt(m, A))); }
      if (wd > 0.5) disc[k] = Math.round(wd * 100) / 100;
      if (wa > 0.5) apex[k] = Math.round(wa * 100) / 100;
    }
    out.push({ id: e.id, key: e.key, end: e.end, r: e.r, discInside: disc, apexInside: apex });
  }
  return out;
};
<\/script>`;
writeFileSync(`${OUT}/_probe.html`, html);

function findChromium() {
  const root = '/opt/pw-browsers'; const c = [];
  if (existsSync(root)) for (const d of readdirSync(root))
    for (const rel of ['chrome-linux/chrome', 'chrome-linux/headless_shell', 'chrome-headless-shell-linux64/chrome-headless-shell']) {
      const f = path.join(root, d, rel); if (existsSync(f)) c.push(f); }
  c.sort((a, b) => (a.includes('chrome-linux/chrome') ? -1 : 1) - (b.includes('chrome-linux/chrome') ? -1 : 1));
  return c[0];
}
const b = await chromium.launch({ executablePath: findChromium(), args: ['--use-gl=swiftshader', '--enable-unsafe-swiftshader', '--no-sandbox'] });
const p = await b.newPage();
const log = [];
p.on('console', m => log.push(m.type() + ': ' + m.text()));
p.on('pageerror', e => log.push('pageerror: ' + e.message));
await p.goto(BASE + OUT + '/_probe.html');
await p.waitForFunction('typeof window.probe === "function"');
const ends = await p.evaluate('window.probe()');
await b.close(); server.close();

/* replay the scene's ops to get each beat's visible set */
const scene = JSON.parse(readFileSync('viz-training/scenes/gross__heart-pericardium__heart-external.json', 'utf8'));
const KEYS = scene.structures.map(s => s.key);
const GROUP = {};
for (const s of scene.structures) (GROUP[s.group] = GROUP[s.group] || []).push(s.key);
const LAYER = {};
for (const s of scene.structures) (LAYER[s.layer] = LAYER[s.layer] || []).push(s.key);
/* keysFor, exactly as viz3d.js has it: '*' is every structure, a group name is its members. The
   first version of this replay compared o.target against the key list only, so every HIDE aimed at
   a group silently did nothing and beat 8 came out with 17 structures on instead of 7. */
const keysFor = t => (!t || t === '*') ? KEYS.slice() : (KEYS.includes(t) ? [t] : (GROUP[t] || []));
/* AND EACH BEAT STARTS FROM ALL-VISIBLE — viz3d.js runOps() calls resetState() first. */
const beats = scene.views.map(v => {
  const vis = new Set(KEYS);
  for (const o of v.ops) {
    if (o.op === 'HIDE_STRUCTURE') keysFor(o.target).forEach(k => vis.delete(k));
    else if (o.op === 'SHOW_STRUCTURE') keysFor(o.target).forEach(k => vis.add(k));
    else if (o.op === 'PEEL_LAYER') (LAYER[o.layer] || []).forEach(k => vis.delete(k));
  }
  return { beat: v.beat, vis };
});

console.log('console:', log.filter(l => !/no cap decision/.test(l)).join(' | ') || 'clean');
console.log('(cap-decision warnings: ' + log.filter(l => /no cap decision/.test(l)).length + ' — expected while CAPS is empty)\n');

const rows = [];
for (const e of ends) {
  const exposedIn = [], hiddenBy = new Set();
  for (const bt of beats) {
    if (!bt.vis.has(e.key)) continue;                       // the tube itself is not on screen
    const cover = Object.keys(e.discInside).filter(k => bt.vis.has(k));
    if (cover.length) cover.forEach(k => hiddenBy.add(k)); else exposedIn.push(bt.beat);
  }
  const apexOut = Object.keys(e.discInside).length && !Object.keys(e.apexInside).length;
  rows.push({ ...e, exposedIn, hiddenBy: [...hiddenBy], apexProtrudes: apexOut });
}
writeFileSync(`${OUT}/free-ends.json`, JSON.stringify(rows, null, 1));

console.log('end'.padEnd(24), 'exposed in beats'.padEnd(34), 'else hidden by'.padEnd(26), 'dome apex');
for (const r of rows) {
  console.log(r.id.padEnd(16) + ':' + r.end.padEnd(7),
    (r.exposedIn.length ? r.exposedIn.join(',') : '— never').padEnd(34),
    (r.hiddenBy.join(',') || '—').slice(0, 25).padEnd(26),
    r.exposedIn.length ? '' : (r.apexProtrudes ? 'PROTRUDES — leave uncapped' : 'stays inside'));
}
const caps = {};
for (const r of rows) {
  const need = r.exposedIn.length > 0 || !r.apexProtrudes;   // cap unless the dome would break out
  const t = caps[r.id] || { start: false, end: false };
  t[r.end] = need; caps[r.id] = t;
}
const out = {};
for (const [id, e] of Object.entries(caps))
  out[id] = e.start && e.end ? 'both' : e.start ? 'start' : e.end ? 'end' : false;
console.log('\nCAPS = ' + JSON.stringify(out, null, 2));
