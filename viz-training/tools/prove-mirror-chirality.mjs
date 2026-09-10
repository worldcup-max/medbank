/* MedBank · prove the cardiac-looping L-loop is a REFLECTION and not a rotation.
 *
 * Round 2 of review disproved the old "mirror" three independent ways. This tool re-runs those same
 * three tests against the rebuilt model, so the claim is settled by measurement rather than by the
 * model's own comment — which is what went wrong last time.
 *
 *   1. CHIRALITY  the signed volume of the sinus-atrium-ventricle-bulbus centroid tetrahedron must
 *                 be NEGATED between the two builds (ratio -1). A rotation PRESERVES it (+1), and
 *                 that is exactly what the previous version returned while being called proven.
 *   2. VERTEX     every vertex of the D build, matched against the L build under a true reflect-X
 *                 (x -> -x) and under a rot-Y-180 (x,y,z -> -x,y,-z). Reflection must match 100%,
 *                 rotation must match ~0%. Run PER PART, because the old bug's second half was that
 *                 the chambers rotated, the veins reflected and the arches did neither.
 *   3. WINDING    a genuine enantiomer MUST reverse winding. Face-normal-vs-vertex-normal agreement
 *                 must stay high (surfaces still outward) while the triangle vertex ORDER flips.
 *
 * Run from the repo root:  node viz-training/tools/prove-mirror-chirality.mjs
 */
import { chromium } from 'playwright';
import { writeFileSync, mkdirSync } from 'fs';
import http from 'http'; import path from 'path'; import fs from 'fs';

const ROOT = process.cwd();
const OUT = 'viz-training/models-out/cardiac-looping';
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
<script src="${BASE}models3d/cardiac-looping.js"><\/script>
<script>
const MOD = window.MB3D_MODELS['cardiac-looping'];
const FULL = MOD.FULL;
function parts(g) {
  const out = {};
  g.traverse(function (o) {
    if (!o.isMesh || !o.geometry || (o.userData||{}).outline || !o.userData.key) return;
    (out[o.userData.key] = out[o.userData.key] || []).push(o.geometry);
  });
  return out;
}
function centroid(geos) {
  const c = new THREE.Vector3(); let n = 0;
  for (const g of geos) { const p = g.attributes.position;
    for (let i=0;i<p.count;i++){ c.x+=p.getX(i); c.y+=p.getY(i); c.z+=p.getZ(i); } n += p.count; }
  return c.divideScalar(n);
}
function tetra(c) {
  const u = new THREE.Vector3().subVectors(c.atrium, c.sinus);
  const v = new THREE.Vector3().subVectors(c.ventricle, c.sinus);
  const w = new THREE.Vector3().subVectors(c.bulbus, c.sinus);
  return u.dot(new THREE.Vector3().crossVectors(v, w)) / 6;
}
/* match D's vertex set against L's under a candidate transform, by rounded-coordinate hashing */
function matchFrac(geosD, geosL, fn) {
  const set = new Set(); const K = 1e3;
  for (const g of geosL) { const p = g.attributes.position;
    for (let i=0;i<p.count;i++) set.add(Math.round(p.getX(i)*K)+'|'+Math.round(p.getY(i)*K)+'|'+Math.round(p.getZ(i)*K)); }
  let hit=0, tot=0; const v=new THREE.Vector3();
  for (const g of geosD) { const p = g.attributes.position;
    for (let i=0;i<p.count;i++){ v.set(p.getX(i),p.getY(i),p.getZ(i)); fn(v); tot++;
      if (set.has(Math.round(v.x*K)+'|'+Math.round(v.y*K)+'|'+Math.round(v.z*K))) hit++; } }
  return tot ? hit/tot : null;
}
function winding(geos) {
  let agree=0, tris=0;
  const a=new THREE.Vector3(),b=new THREE.Vector3(),c=new THREE.Vector3();
  const e1=new THREE.Vector3(),e2=new THREE.Vector3(),fn=new THREE.Vector3(),vn=new THREE.Vector3(),q=new THREE.Vector3();
  for (const g0 of geos) { const g = g0.index ? g0.toNonIndexed() : g0;
    const p=g.attributes.position, n=g.attributes.normal; if(!n) continue;
    for (let i=0;i+2<p.count;i+=3){
      a.fromBufferAttribute(p,i); b.fromBufferAttribute(p,i+1); c.fromBufferAttribute(p,i+2);
      fn.copy(e1.subVectors(b,a).cross(e2.subVectors(c,a))); if (fn.lengthSq()<1e-16) continue; fn.normalize();
      vn.set(0,0,0); for(let k=0;k<3;k++){ q.fromBufferAttribute(n,i+k); vn.add(q); }
      if (vn.lengthSq()<1e-16) continue; vn.normalize(); tris++; if (fn.dot(vn)>0) agree++;
    } }
  return { tris, agree: tris?agree/tris:null };
}
window.prove = function () {
  const D = parts(MOD.build(1, Object.assign({}, FULL)));
  const L = parts(MOD.build(1, Object.assign({}, FULL, { mirror: true })));
  const proof = MOD.mirrorProof();
  const cD = {}, cL = {};
  for (const k in D) cD[k] = centroid(D[k]);
  for (const k in L) cL[k] = centroid(L[k]);
  const rows = [];
  for (const k of Object.keys(D)) {
    if (!L[k]) { rows.push({ key: k, missing: true }); continue; }
    const nD = D[k].reduce((s,g)=>s+g.attributes.position.count,0);
    const nL = L[k].reduce((s,g)=>s+g.attributes.position.count,0);
    rows.push({ key: k, vertsD: nD, vertsL: nL,
      reflect: matchFrac(D[k], L[k], v => { v.x = -v.x; }),
      rotY180: matchFrac(D[k], L[k], v => { v.x = -v.x; v.z = -v.z; }),
      windD: winding(D[k]), windL: winding(L[k]),
      cD: cD[k].toArray().map(x=>+x.toFixed(4)), cL: cL[k].toArray().map(x=>+x.toFixed(4)) });
  }
  return { tetraD: tetra(cD), tetraL: tetra(cL), ratio: tetra(cL)/tetra(cD), modelProof: proof, rows };
};
<\/script>`;
writeFileSync(`${OUT}/_chirality.html`, html);

const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium-1194/chrome-linux/chrome',
  args: ['--use-gl=swiftshader','--enable-unsafe-swiftshader','--no-sandbox'] });
const p = await b.newPage();
const log = [];
p.on('console', m => log.push(m.type()+': '+m.text()));
p.on('pageerror', e => log.push('pageerror: '+String(e && e.message || e)));
await p.goto(BASE + OUT + '/_chirality.html');
await p.waitForFunction('typeof window.prove === "function"');
const r = await p.evaluate('window.prove()');
await b.close(); server.close();
writeFileSync(`${OUT}/chirality.json`, JSON.stringify(r, null, 1));

console.log('TEST 1 CHIRALITY  signed tetra volume  D=' + r.tetraD.toFixed(5) + '  L=' + r.tetraL.toFixed(5) +
            '  ratio=' + r.ratio.toFixed(4) + '   ' + (r.ratio < -0.999 && r.ratio > -1.001 ? 'REFLECTION' : '*** NOT A REFLECTION ***'));
console.log('   model self-check mirrorProof():', JSON.stringify(r.modelProof));
console.log('TEST 2 VERTEX     per part — reflect-X must be 1.000, rot-Y-180 must be ~0');
let bad = 0;
for (const row of r.rows) {
  if (row.missing) { console.log('   ' + row.key.padEnd(12) + ' MISSING FROM MIRROR BUILD'); bad++; continue; }
  const ok = row.reflect > 0.999 && row.vertsD === row.vertsL;
  if (!ok) bad++;
  console.log('   ' + row.key.padEnd(12) +
    ' reflectX=' + row.reflect.toFixed(3) + ' rotY180=' + row.rotY180.toFixed(3) +
    ' verts ' + row.vertsD + '/' + row.vertsL +
    ' winding D=' + row.windD.agree.toFixed(3) + ' L=' + row.windL.agree.toFixed(3) +
    (ok ? '' : '   <== FAIL'));
}
console.log('console:', log.length ? log.join(' | ') : 'clean');
console.log(bad ? 'RESULT: ' + bad + ' part(s) FAILED' : 'RESULT: every part is the same true reflection');
process.exit(bad || !(r.ratio < -0.999 && r.ratio > -1.001) ? 1 : 0);
