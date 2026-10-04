/* MedBank · does every ref this scene names resolve THROUGH THE REAL ADAPTER?
 *
 *   node viz-training/tools/check-scene-refs-primitive-gut-tube.mjs
 *
 * WHY THIS IS A SEPARATE FILE. BUILD-TASK-PROMPT section 3 check 5: "it resolves through the real
 * adapter, not just in your test harness ... this is the only check that proves a student would see
 * it; everything above only proves the geometry exists." render-primitive-gut-tube.mjs ADVERTISES
 * this as its check 8, and as the "adapter page" half of its check 2, in its own header — and does
 * neither: it declares SCENE_PATH at line 29 and never reads it. The run that wrote it had no scene
 * to check, said so plainly in BUILD-LOG, and left the header describing a check that does not exist.
 * A header is a claim; this file is the check.
 *
 * It loads viz3d.js the way the player does and calls MB3D.adapters.procedural.load for EVERY
 * structure in the scene, asserting a real Object3D carrying geometry comes back — and it asserts
 * that a VARIANT ref produces DIFFERENT geometry from the normal ref it is contrasted with, because
 * a variant that silently renders the normal case is how a scene shows a student two identical
 * pictures and calls one of them a disease. That is not hypothetical: it is what
 * "#enteric@1+entericStop" did until 2026-10-01.
 *
 * Run from the repo root. Exits non-zero on any failure.
 */
import { chromium } from 'playwright';
import { readFileSync, existsSync, writeFileSync, mkdirSync } from 'fs';
import http from 'http';
import path from 'path';

const ROOT = process.cwd();
const SHORT = 'primitive-gut-tube';
const OUT = path.join(ROOT, 'viz-training', 'models-out', SHORT);
mkdirSync(OUT, { recursive: true });
const SCENE = path.join(ROOT, 'viz-training', 'scenes',
  'embryology__folding-of-the-embryo__' + SHORT + '.json');
const scene = JSON.parse(readFileSync(SCENE, 'utf8'));

const MIME = { '.js': 'text/javascript', '.json': 'application/json', '.html': 'text/html' };
const server = http.createServer((req, res) => {
  if (/^\/favicon\.ico/.test(req.url)) { res.writeHead(204); res.end(); return; }
  const p = path.join(ROOT, decodeURIComponent(req.url.split('?')[0]));
  if (!existsSync(p)) { res.writeHead(404); res.end('no'); return; }
  res.writeHead(200, { 'content-type': MIME[path.extname(p)] || 'application/octet-stream' });
  res.end(readFileSync(p));
});
await new Promise(r => server.listen(0, r));
const BASE = `http://127.0.0.1:${server.address().port}/`;

const page = `<!doctype html><html><head><meta charset="utf-8"></head><body>
<script src="${BASE}node_modules/three/build/three.js"><\/script>
<script src="${BASE}viz3d.js"><\/script>
<script>
window.MEDBANK_CONFIG = window.MEDBANK_CONFIG || {};
window.MEDBANK_CONFIG.MODEL_BASE = '${BASE}models3d/';
if (window.MB3D && window.MB3D.base) window.MB3D.base('${BASE}');
<\/script></body></html>`;

const browser = await chromium.launch({
  executablePath: '/opt/pw-browsers/chromium-1194/chrome-linux/chrome',
  args: ['--use-gl=swiftshader', '--no-sandbox'],
});
const pg = await browser.newPage();
const consoleMsgs = [];
pg.on('console', m => { if (m.type() === 'error' || m.type() === 'warning') consoleMsgs.push(m.type() + ': ' + m.text()); });
pg.on('pageerror', e => consoleMsgs.push('pageerror: ' + e.message));
/* SERVED, NOT setContent. A page injected with setContent loads its scripts via document.write, and
   chromium warns about every parser-blocking cross-origin script — four warnings that have nothing to
   do with this repo and would fail a console-clean check that is supposed to be about viz3d.js.
   render-primitive-gut-tube.mjs writes its page to models-out and navigates to it for the same
   reason; this file now does too. */
writeFileSync(path.join(OUT, '_adapter.html'), page);
await pg.goto(BASE + 'viz-training/models-out/' + SHORT + '/_adapter.html', { waitUntil: 'load' });

/* WHICH t EACH REF MUST RESOLVE AT, which is the whole point and was nearly got wrong.
   The adapter defaults an unpinned ref to t = 1, so resolving every ref once, at the default, asks a
   question no beat asks. `buccoph` and `cloacalmem` are DECLARED STAGE_LIMITED — they rupture — so at
   t = 1 they correctly come back reason:'none', and a check that read that as a failure would have
   been reporting the model's honesty as a defect.
   The question a student's experience actually turns on is the other one: for every beat, does every
   structure THAT BEAT LEAVES SHOWING resolve at THAT BEAT'S OWN t? A beat that shows a structure
   whose stage has already passed puts "there is no model of this structure" on screen in the middle
   of a beat that is pointing at it. */
const byKey = Object.fromEntries((scene.structures || []).map(s => [s.key, s]));
const groupsOf = {};
for (const s of (scene.structures || [])) (groupsOf[s.group] = groupsOf[s.group] || []).push(s.key);
function visibleIn(v) {
  const vis = new Set();
  for (const o of (v.ops || [])) {
    const expand = t => (t === '*' ? Object.keys(byKey) : (groupsOf[t] || (byKey[t] ? [t] : [])));
    if (o.op === 'SHOW_STRUCTURE') expand(o.target).forEach(k => vis.add(k));
    else if (o.op === 'HIDE_STRUCTURE') expand(o.target).forEach(k => vis.delete(k));
    else if (o.op === 'ISOLATE_REGION') { const keep = new Set(expand(o.target));
      [...vis].forEach(k => { if (!keep.has(k)) vis.delete(k); }); }
  }
  return [...vis];
}
const refs = [];
for (const v of (scene.views || [])) {
  const st = (v.ops || []).find(o => o.op === 'SET_STAGE');
  const t = st ? st.t : 1;
  for (const k of visibleIn(v)) {
    const s2 = byKey[k];
    if (!s2 || !s2.refs || !s2.refs.procedural) continue;
    refs.push({ key: k, ref: s2.refs.procedural, name: s2.name, beat: v.beat, t: t });
  }
}
console.log('  ' + refs.length + ' (beat, structure) pairs to resolve across ' +
            (scene.views || []).length + ' views\n');

const results = await pg.evaluate(async (refs) => {
  const out = [];
  const ad = window.MB3D && window.MB3D.adapters && window.MB3D.adapters.procedural;
  if (!ad) return [{ key: '*', ref: '*', ok: false, why: 'MB3D.adapters.procedural is not exposed' }];
  for (const r of refs) {
    try {
      /* the beat's own t, exactly as the player applies it: an unpinned ref follows SET_STAGE */
      const pinned = /@-?\d*\.?\d+(?=$|\+)/.test(r.ref);
      const ref = pinned ? r.ref : r.ref.replace(/^([^#]+#[^@+]+)/, '$1@' + r.t);
      const got = await ad.load(window.THREE, { refs: { procedural: ref } });
      /* the adapter's contract is { mesh, reason } — viz3d.js:613. Reading `got` itself as the
         object is how the first version of this file reported 32 FAILs on a working adapter. */
      const obj = got && got.mesh;
      let tris = 0, meshes = 0, reason = (got && got.reason) || null;
      if (obj && obj.traverse) obj.traverse(n => {
        if (n.geometry && n.geometry.attributes && n.geometry.attributes.position) {
          meshes++; tris += n.geometry.attributes.position.count / 3;
        }
      });
      /* a stable fingerprint of the geometry, so a VARIANT can be proved different from the normal */
      let hash = 0;
      if (obj && obj.traverse) obj.traverse(n => {
        if (!n.geometry || !n.geometry.attributes || !n.geometry.attributes.position) return;
        const a = n.geometry.attributes.position.array;
        for (let i = 0; i < a.length; i += 17) { hash = (hash * 31 + Math.round(a[i] * 1e5)) | 0; }
      });
      out.push({ key: r.key, ref: ref, beat: r.beat, t: r.t, ok: meshes > 0 && tris > 0, meshes, tris, reason, hash });
    } catch (e) { out.push({ key: r.key, ref: r.ref, beat: r.beat, t: r.t, ok: false, why: e && e.message }); }
  }
  return out;
}, refs);

let fails = 0;
console.log('MedBank · scene refs through the REAL adapter (viz3d.js)\n  scene ' + SCENE +
            '\n  ' + results.filter(r => r.ok).length + '/' + results.length + ' (beat, structure) pairs resolve\n');
for (const r of results) {
  if (!r.ok) fails++;
  if (r.ok) continue;      // the per-pair PASS list is 170 lines of noise; the failures are the report
  console.log('  FAIL  beat ' + r.beat + '  ' + r.key.padEnd(16) + r.ref.padEnd(44) +
              (r.why || ('reason:' + r.reason)) +
              '  — this beat leaves it SHOWING at t=' + r.t + ' and the player would draw nothing');
}

/* THE VARIANT CONTRAST. A variant that resolves is not a variant that DIFFERS. */
const resByKey = {}; for (const r of results) if (!resByKey[r.key] || r.ok) resByKey[r.key] = r;
const CONTRASTS = [
  ['var_malrotation', 'midgut', 'the malrotation variant must not draw the normally rotated midgut'],
  ['var_hirschsprung', 'enteric', 'the aganglionic variant must not draw the normal crest front'],
  ['var_highARM', 'urorectal', 'the high ARM variant must not draw the normal urorectal septum'],
];
console.log('');
for (const [v, n, why] of CONTRASTS) {
  const a = resByKey[v], b = resByKey[n];
  if (!a || !b) { console.log('  SKIP  ' + v + ' / ' + n + ' — one of the pair is not in the scene'); continue; }
  const differs = a.ok && b.ok && a.hash !== b.hash;
  if (!differs) fails++;
  console.log('  ' + (differs ? 'PASS' : 'FAIL') + '  variant-differs  ' + v + ' vs ' + n +
              '  [' + a.hash + ' vs ' + b.hash + ']  ' + why);
}

console.log('');
if (consoleMsgs.length) { fails++; console.log('  FAIL  console-clean/adapter  ' + JSON.stringify(consoleMsgs.slice(0, 6))); }
else console.log('  PASS  console-clean/adapter  []');

writeFileSync(path.join(OUT, 'scene-refs.json'),
  JSON.stringify({ when: new Date().toISOString(), scene: path.relative(ROOT, SCENE),
                   results, console: consoleMsgs, fails }, null, 1));
console.log('\n' + (fails === 0 ? 'EVERY SCENE REF RESOLVES THROUGH THE REAL ADAPTER'
                                : 'ADAPTER CHECK FAILED (' + fails + ')'));
await browser.close(); server.close();
process.exit(fails === 0 ? 0 : 1);
