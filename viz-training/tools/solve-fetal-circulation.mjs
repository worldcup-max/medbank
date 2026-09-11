/* MedBank · the calibration behind models3d/fetal-circulation.js
 *
 * The model owns the network; this owns the SEARCH. It loads the model in headless chromium and
 * drives MB3D_MODELS['fetal-circulation'].calibrate(), which bisects six conductances until the
 * t = 0 network reproduces the five standard fetal flows and the t = 1 network reproduces the
 * neonatal pulmonary-to-systemic pressure ratio.
 *
 * WHY THE SEARCH IS HERE AND THE NETWORK IS NOT. tools/solve-cardiac-torsion.mjs carries its own copy
 * of the curvature it solves, which is 50 KB of code that can drift away from the model it calibrates
 * without anything noticing. This one cannot drift: there is exactly one implementation of the
 * network, in the model, and this file only turns the knobs.
 *
 * Run from the repo root:  node viz-training/tools/solve-fetal-circulation.mjs
 * Paste what it prints into SOLVED in models3d/fetal-circulation.js, then re-run the render prover.
 */
import { chromium } from 'playwright';
import { writeFileSync, mkdirSync } from 'fs';
import http from 'http';
import path from 'path';
import fs from 'fs';

const ROOT = process.cwd();
const OUT = 'viz-training/models-out/fetal-circulation';
mkdirSync(OUT, { recursive: true });
const MIME = { '.js': 'text/javascript', '.json': 'application/json', '.html': 'text/html' };
const server = http.createServer((req, res) => {
  const p = path.join(ROOT, decodeURIComponent(req.url.split('?')[0]));
  fs.readFile(p, (e, buf) => {
    if (e) { res.writeHead(404); return res.end('no'); }
    res.writeHead(200, { 'content-type': MIME[path.extname(p)] || 'application/octet-stream' });
    res.end(buf);
  });
});
await new Promise(r => server.listen(0, r));
const BASE = `http://127.0.0.1:${server.address().port}/`;

const html = `<!doctype html><meta charset=utf8><link rel="icon" href="data:,"><body>
<script src="${BASE}node_modules/three/build/three.js"><\/script>
<script src="${BASE}models3d/render-kit.js"><\/script>
<script src="${BASE}models3d/fetal-circulation.js"><\/script>`;
writeFileSync(`${OUT}/_solver.html`, html);

const b = await chromium.launch({
  executablePath: process.env.PW_CHROME || '/opt/pw-browsers/chromium-1194/chrome-linux/chrome',
  args: ['--use-gl=swiftshader', '--enable-unsafe-swiftshader', '--no-sandbox'] });
const p = await b.newPage();
const log = [];
p.on('console', m => log.push(m.type() + ': ' + m.text()));
p.on('pageerror', e => log.push('pageerror: ' + (e && e.message)));
await p.goto(BASE + OUT + '/_solver.html');
await p.waitForFunction("window.MB3D_MODELS && window.MB3D_MODELS['fetal-circulation']");

const r = await p.evaluate(() => window.MB3D_MODELS['fetal-circulation'].calibrate(80));
const mix = await p.evaluate(() => window.MB3D_MODELS['fetal-circulation'].mixing());
await b.close(); server.close();

console.log('targets   :', JSON.stringify(r.targets));
console.log('achieved  :', JSON.stringify(r.achieved));
console.log('PREDICTED (never calibrated to):', JSON.stringify(r.predicted));
console.log('residual  :', r.residual);
console.log('mixing    :', JSON.stringify(mix));
console.log('\npaste into SOLVED:');
for (const k of Object.keys(r.params)) console.log(`  ${k}: ${r.params[k].toFixed(6)},`);
if (log.length) console.log('\nconsole:', log.join(' | '));
writeFileSync(`${OUT}/calibration.json`, JSON.stringify({ ...r, mixing: mix }, null, 1));
