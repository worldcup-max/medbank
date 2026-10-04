/* MedBank · DO TWO CAVITIES OCCUPY THE SAME SPACE? Parity ray-cast containment on the built mesh.
 *
 *   node viz-training/tools/measure-cavity-overlap.mjs <models3d/model.js> <keyA> <keyB> [t...]
 *
 * WHY THIS EXISTS, AND IT IS THE SAME REASON AS CHECK 8 IN render-cardiac-cycle.mjs. The
 * cardiac-cycle model's gaps[1] has said "interpenetration measured again afterwards: 0.0%" since
 * 2026-09-10. It was measured, once, by hand, by the run that built the wrapped-tube right
 * ventricle — and then the geometry moved three times and nothing re-measured it, because the
 * measurement lived in a sentence rather than in a tool. Round 4's R4-OPEN-1 is exactly that
 * failure in a different dimension: a number nobody asserts on is free to drift, and it drifts
 * inside the edit that fixes something else.
 *
 * Volume arithmetic cannot see this. Each chamber integrates to the right number on its own while
 * a fifth of the blood sits in both of them, which is what the first version of that model did.
 *
 * HOW IT COUNTS. Sample a regular grid over keyA's bounding box; keep the points inside keyA by
 * parity (an odd number of triangle crossings along a fixed ray means inside); of those, count the
 * ones also inside keyB. The answer is a FRACTION OF keyA, so it is asymmetric on purpose — 19.6%
 * of the left ventricle inside the right is a different statement from the reverse, and the smaller
 * chamber's figure flatters. Run both ways; the tool prints both.
 *
 * The ray direction is jittered per point rather than fixed, because a ray that runs exactly along
 * a coplanar strip of a swept shell counts a grazing pass as two crossings or none. Run from the
 * repo root. Exits non-zero if the overlap exceeds --max (default 1.0%).
 */
import { chromium } from 'playwright';
import { existsSync, readdirSync, writeFileSync, mkdirSync } from 'fs';
import http from 'http'; import path from 'path'; import fs from 'fs';

const ROOT = process.cwd();
const modelPath = process.argv[2] || 'models3d/cardiac-cycle-pumping.js';
const keyA = process.argv[3] || 'lv_blood';
const keyB = process.argv[4] || 'rv_blood';
const rest = process.argv.slice(5).filter(a => !a.startsWith('--'));
const TS = rest.length ? rest.map(Number) : [0.174, 0.419, 0.5476, 0.88];
const MAXPCT = Number((process.argv.find(a => a.startsWith('--max=')) || '--max=1.0').split('=')[1]);
const N = 56;   // grid points per axis over keyA's box

function findChromium() {
  if (process.env.CHROMIUM_PATH) return process.env.CHROMIUM_PATH;
  const base = '/opt/pw-browsers';
  if (existsSync(base)) for (const d of readdirSync(base))
    for (const rel of ['chrome-linux/chrome', 'chrome-linux/headless_shell']) {
      const p = path.join(base, d, rel); if (existsSync(p)) return p;
    }
  return null;
}
const MIME = { '.html': 'text/html', '.js': 'text/javascript', '.json': 'application/json' };
const server = http.createServer((q, s) => {
  const f = path.join(ROOT, decodeURIComponent(q.url.split('?')[0]));
  if (!fs.existsSync(f) || fs.statSync(f).isDirectory()) { s.writeHead(404); return s.end('no'); }
  s.writeHead(200, { 'content-type': MIME[path.extname(f)] || 'application/octet-stream' });
  s.end(fs.readFileSync(f));
});
await new Promise(r => server.listen(0, r));
const BASE = `http://127.0.0.1:${server.address().port}/`;
const OUT = 'viz-training/models-out/' + path.basename(modelPath, '.js');
mkdirSync(OUT, { recursive: true });

const page = `<!doctype html><meta charset=utf8><link rel="icon" href="data:,">
<script src="${BASE}node_modules/three/build/three.js"><\/script>
<script src="${BASE}models3d/render-kit.js"><\/script>
<script src="${BASE}${modelPath}"><\/script>
<script>
const MOD = window.MB3D_MODELS[Object.keys(window.MB3D_MODELS)[0]];
/* THE THREE.JS VERSION GOES IN THE REPORT. Round 4's review nearly wrote up a tool's own
   environment as a finding in the work: r160 in one container against the 0.128.0 the lockfile
   pins changed every rendered number. Nothing here reads pixels, but the rule is cheap to keep. */
window.threeVersion = THREE.REVISION;
function trisOf(key, t){
  const g = MOD.build(t, Object.assign({}, MOD.FULL));
  g.updateMatrixWorld(true);
  const out = [];
  g.traverse(function(o){
    if(!o.isMesh || !o.geometry) return;
    const u = o.userData || {};
    if(u.outline || u.key !== key) return;
    const geo = o.geometry.index ? o.geometry.toNonIndexed() : o.geometry;
    const p = geo.attributes.position;
    const v = new THREE.Vector3();
    for(let i=0;i+2<p.count;i+=3){
      const tri=[];
      for(let k=0;k<3;k++){ v.fromBufferAttribute(p,i+k); o.localToWorld(v); tri.push(v.clone()); }
      out.push(tri);
    }
  });
  return out;
}
/* Moller-Trumbore, counting only forward hits */
function hits(o, d, tris){
  let n=0; const e1=new THREE.Vector3(), e2=new THREE.Vector3(), pv=new THREE.Vector3(),
            tv=new THREE.Vector3(), qv=new THREE.Vector3();
  for(const T of tris){
    e1.subVectors(T[1],T[0]); e2.subVectors(T[2],T[0]);
    pv.crossVectors(d,e2); const det=e1.dot(pv);
    if(Math.abs(det)<1e-12) continue;
    const inv=1/det; tv.subVectors(o,T[0]);
    const u=tv.dot(pv)*inv; if(u<0||u>1) continue;
    qv.crossVectors(tv,e1);
    const vv=d.dot(qv)*inv; if(vv<0||u+vv>1) continue;
    const s=e2.dot(qv)*inv; if(s>1e-9) n++;
  }
  return n;
}
window.overlap = function(keyA, keyB, t, N){
  const A = trisOf(keyA,t), B = trisOf(keyB,t);
  if(!A.length || !B.length) return { error:'no triangles for '+(A.length?keyB:keyA) };
  const box = new THREE.Box3();
  for(const T of A) for(const p of T) box.expandByPoint(p);
  const mn=box.min, sz=box.getSize(new THREE.Vector3());
  let inA=0, inBoth=0;
  const o=new THREE.Vector3(), d=new THREE.Vector3();
  let seed=12345; const rnd=()=>{ seed=(seed*1103515245+12345)&0x7fffffff; return seed/0x7fffffff; };
  for(let i=0;i<N;i++) for(let j=0;j<N;j++) for(let k=0;k<N;k++){
    o.set(mn.x+sz.x*(i+0.5)/N, mn.y+sz.y*(j+0.5)/N, mn.z+sz.z*(k+0.5)/N);
    /* jittered ray: a fixed axis-aligned one grazes coplanar strips of a swept shell */
    d.set(rnd()-0.5, rnd()-0.5, rnd()-0.5).normalize();
    if(hits(o,d,A)%2===0) continue;
    inA++;
    const d2=new THREE.Vector3(rnd()-0.5,rnd()-0.5,rnd()-0.5).normalize();
    if(hits(o,d2,B)%2===1) inBoth++;
  }
  const cell = (sz.x/N)*(sz.y/N)*(sz.z/N);
  return { t:t, a:keyA, b:keyB, samples_in_a:inA, samples_in_both:inBoth,
           pct_of_a_inside_b: inA? +(100*inBoth/inA).toFixed(3) : null,
           volume_a_ml: +(inA*cell).toFixed(2), volume_both_ml: +(inBoth*cell).toFixed(3) };
};
window.__ready = true;
<\/script>`;
writeFileSync(`${OUT}/_overlap.html`, page);

const browser = await chromium.launch({ executablePath: findChromium(),
  args: ['--use-gl=swiftshader', '--enable-unsafe-swiftshader', '--no-sandbox'] });
const p = await browser.newPage();
const errs = [];
p.on('pageerror', e => errs.push(String(e && e.message || e)));
await p.goto(BASE + OUT + '/_overlap.html');
await p.waitForFunction('window.__ready === true', { timeout: 60000 });
const three = await p.evaluate('window.threeVersion');
console.log('MedBank · cavity overlap\n  model ' + modelPath + '\n  three.js r' + three +
            '\n  ' + keyA + ' against ' + keyB + ', grid ' + N + '^3 over ' + keyA +
            "'s box, bound " + MAXPCT + '%\n');
const report = []; let worst = 0;
for (const t of TS) {
  const ab = await p.evaluate(([a, b, t2, n]) => window.overlap(a, b, t2, n), [keyA, keyB, t, N]);
  const ba = await p.evaluate(([a, b, t2, n]) => window.overlap(a, b, t2, n), [keyB, keyA, t, N]);
  if (ab.error || ba.error) { console.log('  t=' + t + '  ' + (ab.error || ba.error)); worst = 1e9; continue; }
  worst = Math.max(worst, ab.pct_of_a_inside_b, ba.pct_of_a_inside_b);
  console.log('  t=' + t +
    '  ' + keyA + ' inside ' + keyB + ' ' + ab.pct_of_a_inside_b + '% (' + ab.volume_both_ml + ' ml of ' + ab.volume_a_ml + ')' +
    '  |  ' + keyB + ' inside ' + keyA + ' ' + ba.pct_of_a_inside_b + '% (' + ba.volume_both_ml + ' ml of ' + ba.volume_a_ml + ')');
  report.push({ ab, ba });
}
writeFileSync(`${OUT}/overlap.json`, JSON.stringify({ three: three, max_pct: MAXPCT, report }, null, 1));
if (errs.length) console.log('\npage errors: ' + errs.join(' | '));
const ok = worst <= MAXPCT && !errs.length;
console.log('\nworst overlap ' + (worst === 1e9 ? 'n/a' : worst.toFixed(3) + '%') + ' -> ' + (ok ? 'PASS' : 'FAIL'));
await browser.close(); server.close();
process.exit(ok ? 0 : 1);
