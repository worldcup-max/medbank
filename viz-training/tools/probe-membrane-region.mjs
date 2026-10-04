/* MedBank · F1 POSITIVE CONTROL AND PROOF, for models3d/primitive-streak.js
 *
 * Round-1 review finding F1: the mesoderm-free zone at the two membranes was a single POINT and every
 * check that certified it sampled exactly that point. This probe reads the BUILT TRIANGLES over a grid
 * covering each membrane's footprint and reports the WORST point. Run it before the fix and it must
 * reproduce the review's independently measured numbers (worst mesoderm thickness about 0.2247 at the
 * oropharyngeal membrane, 0.2255 at the cloacal, against a flank thickness of 0.2600). Run it after
 * and both must be zero. A fix whose probe did not first fail is not evidence of anything.
 */
import { chromium } from 'playwright';
import http from 'http'; import fs from 'fs'; import path from 'path';
import { readdirSync, existsSync } from 'fs';
const PW_EXE = (function () {
  const base = '/opt/pw-browsers';
  for (const d of readdirSync(base))
    for (const rel of ['chrome-linux/chrome', 'chrome-linux/headless_shell']) {
      const q = path.join(base, d, rel); if (existsSync(q)) return q;
    }
  return undefined;
})();
const ROOT = process.cwd();
const MIME = { '.js': 'text/javascript', '.json': 'application/json', '.html': 'text/html' };
const server = http.createServer((req, res) => {
  const p = path.join(ROOT, decodeURIComponent(req.url.split('?')[0]));
  fs.readFile(p, (e, buf) => { if (e) { res.writeHead(404); return res.end('no'); }
    res.writeHead(200, { 'content-type': MIME[path.extname(p)] || 'application/octet-stream' }); res.end(buf); });
});
await new Promise(r => server.listen(0, r));
const BASE = `http://127.0.0.1:${server.address().port}/`;
const browser = await chromium.launch({ executablePath: PW_EXE,
  args: ['--use-gl=swiftshader', '--enable-unsafe-swiftshader', '--no-sandbox'] });
const page = await browser.newPage();
const msgs = [];
page.on('console', m => { if (m.type() === 'error' || m.type() === 'warning') msgs.push(m.type() + ': ' + m.text()); });
page.on('pageerror', e => msgs.push('pageerror: ' + e.message));
await page.setContent('<!doctype html><html><body></body></html>');
await page.addScriptTag({ url: BASE + 'viz-training/spike/three.min.js' });
await page.addScriptTag({ url: BASE + 'models3d/render-kit.js' });
await page.addScriptTag({ url: BASE + 'models3d/primitive-streak.js' });

const out = await page.evaluate(() => {
  const M = window.MB3D_MODELS['primitive-streak'];
  const TS = [0.44, 0.58, 0.70, 0.86, 1.0];
  const res = { byT: [], flank: null, noto: [] };
  for (const t of TS) {
    const o = M.membraneRegionReport(t, 'oro'), c = M.membraneRegionReport(t, 'clo');
    res.byT.push({ t,
      oro: { pts: o.onMemb, inFoot: o.inFoot, coverage: +o.coverage.toFixed(4),
             worstMeso: +o.worstMeso.toFixed(6), worstAt: o.worstAt.map(v => +v.toFixed(3)),
             worstGap: +o.worstGap.toFixed(6), layersMin: o.layersMin, layersMax: o.layersMax },
      clo: { pts: c.onMemb, inFoot: c.inFoot, coverage: +c.coverage.toFixed(4),
             worstMeso: +c.worstMeso.toFixed(6), worstAt: c.worstAt.map(v => +v.toFixed(3)),
             worstGap: +c.worstGap.toFixed(6), layersMin: c.layersMin, layersMax: c.layersMax } });
    const n = M.notoStripReport(t);
    res.noto.push({ t, pts: n.n, worstMeso: +n.worstMeso.toFixed(6), worstMesoEnds: +n.worstMesoEnds.toFixed(6) });
  }
  const f = M.flankRegionReport(1.0);
  res.flank = { pts: f.n, layersMin: f.layersMin, layersMax: f.layersMax, thinnestMeso: +f.thinnestMeso.toFixed(6) };
  res.constants = { H_MESO: M.constants().H_MESO };
  return res;
});
console.log(JSON.stringify(out, null, 1));
console.log('console events:', msgs.length, msgs.slice(0, 6));
await browser.close(); server.close();
