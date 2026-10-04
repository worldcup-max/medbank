/* MedBank · probe · WHEN DOES THE MESODERM FRONT CLEAR THE BLOCK'S CRANIAL FACE?
 *
 *   node viz-training/tools/probe-meso-front-vs-block.mjs
 *
 * Round 1's blocking finding has two halves. The first is the camera (see
 * probe-beat1-screen-stack.mjs). The second is that the view which fixes the camera — `superior`,
 * which looks at the block's CRANIAL face — shows only two sheets at beat 1's stage of t = 0.40,
 * because the middle sheet has not yet spread that far cranially. BLK_Y1 = 3.20 and the review
 * measured the mesoderm front at y = 3.036 there, so the outer two sheets close over the gap.
 *
 * Picking the new stage off the pixel curve alone would be tuning to a number. This measures the
 * MECHANISM instead: the cranial-most y the middle sheet reaches INSIDE the block's x window, against
 * the block's own cranial limit, as a function of t. The stage to put beat 1 at is one where the
 * front is clear of that face by a margin, chosen from where the curve is FLAT rather than from where
 * it first crosses — a beat perched one step past a cliff is a beat that falls off it the next time
 * anything upstream moves.
 */
import { chromium } from 'playwright';
import http from 'http';
import path from 'path';
import fs from 'fs';

const ROOT = process.cwd();
const MIME = { '.js': 'text/javascript', '.json': 'application/json', '.html': 'text/html' };
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
await page.setContent('<canvas id="c" width="64" height="64"></canvas>');
await page.addScriptTag({ url: BASE + 'viz-training/spike/three.min.js' });
await page.addScriptTag({ url: BASE + 'models3d/render-kit.js' });
await page.addScriptTag({ url: BASE + 'models3d/trilaminar-disc-3-germ-layers.js' });

const out = await page.evaluate(() => {
  const M = window.MB3D_MODELS['trilaminar-disc-3-germ-layers'];
  const BLOCK = M.BLOCK || null;
  const rows = [];
  for (let i = 0; i <= 30; i++) {
    const t = i / 30;
    const g = M.build(t, { routes: true, cavities: true, split: false, block: true });
    let maxY = -Infinity, n = 0;
    let ectoMaxY = -Infinity, endoMaxY = -Infinity;
    g.traverse(m => {
      if (!m.isMesh) return;
      const k = m.userData.key;
      if (k !== 'mesoderm' && k !== 'ectoderm' && k !== 'endoderm') return;
      const p = m.geometry.attributes.position;
      for (let v = 0; v < p.count; v++) {
        const y = p.getY(v);
        if (k === 'mesoderm') { if (y > maxY) maxY = y; n++; }
        else if (k === 'ectoderm') { if (y > ectoMaxY) ectoMaxY = y; }
        else { if (y > endoMaxY) endoMaxY = y; }
      }
    });
    rows.push({ t, mesoMaxY: n ? maxY : null, ectoMaxY, endoMaxY, mesoVerts: n });
  }
  return { BLOCK, rows };
});

console.log('MedBank · mesoderm front vs the block\'s cranial face');
console.log('model BLOCK window: ' + JSON.stringify(out.BLOCK));
const BLK_Y1 = out.BLOCK && out.BLOCK.y ? out.BLOCK.y[1] : 3.20;
console.log('BLK_Y1 = ' + BLK_Y1 + '   (the face a `superior` camera looks straight at)');
console.log('');
console.log('   t      meso front y   clearance vs BLK_Y1   ecto front   endo front');
for (const r of out.rows) {
  const cl = r.mesoMaxY == null ? null : r.mesoMaxY - BLK_Y1;
  console.log('  ' + r.t.toFixed(3).padStart(5) + '   ' +
    (r.mesoMaxY == null ? '    (none)' : r.mesoMaxY.toFixed(4).padStart(10)) + '   ' +
    (cl == null ? '        —' : (cl >= 0 ? '+' : '') + cl.toFixed(4).padStart(8)) +
    (cl != null && cl >= 0 ? '  CLEARS' : '  under ') + '   ' +
    r.ectoMaxY.toFixed(4).padStart(9) + '   ' + r.endoMaxY.toFixed(4).padStart(9));
}
const first = out.rows.find(r => r.mesoMaxY != null && r.mesoMaxY >= BLK_Y1);
console.log('');
console.log('FIRST t at which the middle sheet reaches the block\'s cranial face: ' +
            (first ? first.t.toFixed(3) : 'never'));
await browser.close();
await server.close();
