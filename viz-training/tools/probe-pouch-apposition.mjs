/* MedBank · probe for the 2026-10-03 review findings F1/F4/F6 on pharyngeal-pouches.
 *
 * Independent re-measurement, in the real three.js, of:
 *   - nearest-vertex distance between named key pairs, as a fraction of ONE INTERSEGMENT
 *     and as a fraction of the MEAN OWN EXTENT of the two keys (the shape F2 asks for)
 *   - lateral (|x|) extents of wall / pouch / membrane / cleft, to see whether the radii reconcile
 *
 * Run from the repo root: node viz-training/tools/probe-pouch-apposition.mjs [days...]
 */
import { chromium } from 'playwright';
import http from 'http'; import path from 'path'; import fs from 'fs';

const ROOT = process.cwd(), SHORT = 'pharyngeal-pouches';
const MIME = { '.js': 'text/javascript', '.json': 'application/json', '.html': 'text/html' };
const server = http.createServer((req, res) => {
  const p = path.join(ROOT, decodeURIComponent(req.url.split('?')[0]));
  fs.readFile(p, (e, buf) => { if (e) { res.writeHead(404); return res.end('no'); }
    res.writeHead(200, { 'content-type': MIME[path.extname(p)] || 'application/octet-stream' }); res.end(buf); });
});
await new Promise(r => server.listen(0, r));
const BASE = `http://127.0.0.1:${server.address().port}/`;

const PAIRS = [
  ['pouch1', 'tympanic_membrane'], ['tympanic_membrane', 'cleft1'], ['pouch1', 'cleft1'],
  ['thymopharyngeal_duct', 'pouch3'], ['thymopharyngeal_duct', 'pouch3_ventral_wing'],
  ['pouch3_ventral_wing', 'pouch3'],
  ['palatine_tonsil', 'pouch2'], ['ultimopharyngeal_body', 'thyroid_gland'],
  ['inferior_parathyroid', 'thyroid_gland'], ['superior_parathyroid', 'thyroid_gland'],
  ['cleft1', 'surface_ectoderm'], ['clefts_lower', 'surface_ectoderm'],
  ['pouch1', 'arch_bars'], ['arch_bars', 'pharyngeal_wall'],
];
const EXTENT_KEYS = ['pharyngeal_wall', 'arch_bars', 'pouch1', 'pouch2', 'pouch3', 'pouch4',
                     'tympanic_membrane', 'cleft1', 'clefts_lower', 'surface_ectoderm'];

const html = `<!doctype html><meta charset=utf8><link rel="icon" href="data:,"><body>
<script src="${BASE}node_modules/three/build/three.js"><\/script>
<script src="${BASE}models3d/render-kit.js"><\/script>
<script src="${BASE}models3d/${SHORT}.js"><\/script>
<script>
const MOD = window.MB3D_MODELS['${SHORT}'];
function sideVerts(g, key, side) {
  const out = [];
  g.updateMatrixWorld(true);
  g.traverse(function (m) {
    if (!m.isMesh || !m.geometry || (m.userData && m.userData.outline)) return;
    if (!m.userData || m.userData.key !== key) return;
    const p = m.geometry.attributes.position;
    for (let i = 0; i < p.count; i++) {
      const v = new THREE.Vector3(p.getX(i), p.getY(i), p.getZ(i)).applyMatrix4(m.matrixWorld);
      if (side === 0 || Math.sign(v.x) === side || v.x === 0) out.push(v);
    }
  });
  return out;
}
function ownExtent(V) {
  if (!V.length) return 0;
  const b = new THREE.Box3(); for (const v of V) b.expandByPoint(v);
  const s = b.getSize(new THREE.Vector3()); return Math.max(s.x, s.y, s.z);
}
function nearest(A, B) {
  let best = Infinity;
  for (const a of A) for (const b of B) { const d = a.distanceToSquared(b); if (d < best) best = d; }
  return Math.sqrt(best);
}
window.probe = function (t, pairs, extentKeys) {
  const g = MOD.build(t, Object.assign({}, MOD.FULL));
  const F = MOD.frameAt(t);
  const out = { day: F.day, seg: F.seg, R0: F.R0, pairs: [], extents: {} };
  for (const k of extentKeys) {
    const V = sideVerts(g, k, 0);
    if (!V.length) { out.extents[k] = null; continue; }
    let lo = Infinity, hi = -Infinity;
    for (const v of V) { const a = Math.abs(v.x); if (a < lo) lo = a; if (a > hi) hi = a; }
    out.extents[k] = { absXmin: lo / F.seg, absXmax: hi / F.seg, verts: V.length };
  }
  for (const [a, b] of pairs) {
    const A = sideVerts(g, a, 1), B = sideVerts(g, b, 1);
    if (!A.length || !B.length) { out.pairs.push({ a, b, missing: !A.length ? a : b }); continue; }
    const d = nearest(A, B);
    const ea = ownExtent(A), eb = ownExtent(B);
    out.pairs.push({ a, b, dist: d, overSeg: d / F.seg, overMeanExtent: d / (0.5 * (ea + eb)),
                     extA: ea / F.seg, extB: eb / F.seg });
  }
  return out;
};
<\/script>`;

const days = process.argv.slice(2).map(Number);
const DAYS = days.length ? days : [26, 32, 38, 44, 48, 50, 54, 56];
const browser = await chromium.launch({ executablePath: process.env.MB_CHROME || '/opt/pw-browsers/chromium-1194/chrome-linux/chrome', args: ['--use-gl=swiftshader', '--enable-unsafe-swiftshader'] });
const page = await browser.newPage();
const msgs = [];
page.on('console', m => msgs.push(m.type() + ': ' + m.text()));
page.on('pageerror', e => msgs.push('pageerror: ' + e.message));
await page.setContent(html, { waitUntil: 'load' });

const tOf = d => (d - 22) / (56 - 22);
for (const d of DAYS) {
  const r = await page.evaluate(([t, p, e]) => window.probe(t, p, e), [tOf(d), PAIRS, EXTENT_KEYS]);
  console.log(`\n=== day ${r.day.toFixed(1)}  (t=${tOf(d).toFixed(6)})  seg=${r.seg.toFixed(3)} ===`);
  console.log('  |x| extents, in intersegments:');
  for (const k of EXTENT_KEYS) {
    const x = r.extents[k];
    console.log('   ', k.padEnd(24), x ? `${x.absXmin.toFixed(3)} .. ${x.absXmax.toFixed(3)}` : '(not built)');
  }
  console.log('  nearest-vertex gaps (right side):');
  for (const p of r.pairs) {
    if (p.missing) { console.log('   ', `${p.a} ~ ${p.b}`.padEnd(52), '(missing: ' + p.missing + ')'); continue; }
    console.log('   ', `${p.a} ~ ${p.b}`.padEnd(52),
      `d=${p.dist.toFixed(3)}  ${p.overSeg.toFixed(4)} seg  ${p.overMeanExtent.toFixed(4)} ownExt`);
  }
}
console.log('\nconsole:', msgs.length ? msgs : '(clean)');
await browser.close(); server.close();
