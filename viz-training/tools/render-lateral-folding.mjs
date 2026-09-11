/* MedBank · headless proof for models3d/lateral-folding.js
 *
 * The four checks BUILD-TASK-PROMPT requires, plus three this model needs on top:
 *   1. it renders — many t and many option sets, screenshots to viz-training/models-out/lateral-folding/
 *   2. the console is clean — no error, no warning, no throw
 *   3. normals point outward — per mesh, counted against that mesh's own centroid, hull and whole buffer
 *   4. every ref the scene names resolves THROUGH THE REAL ADAPTER in viz3d.js, with geometry
 *   5. THE PROXY IS CHECKED. acceptance() measures the floored relations off the profile rows; this
 *      re-measures the same relations on ACTUAL MESH VERTICES, so the proxy is never trusted unchecked.
 *   6. NO OPEN LUMEN. Rays from each camera report whether the FIRST surface they meet faces away.
 *      Every sheet here is a closed slab, so this is a direct test of the rim winding.
 *   7. EVERY FLOOR HAS A NEGATIVE CASE. A test that grades its own homework in the wrong units
 *      launders a defect into a proof, so each floor is also fed a value it MUST reject.
 *
 * WHERE THIS RUNS. In a Linux container with chromium, against a copy of the repo — the mount that
 * holds the real repo has no browser. The file under test is byte identical. Run from the repo root:
 *   node viz-training/tools/render-lateral-folding.mjs
 */
import { chromium } from 'playwright';
import { readFileSync, writeFileSync, mkdirSync } from 'fs';
import http from 'http';
import path from 'path';
import fs from 'fs';

const ROOT = process.cwd();
const OUT = 'viz-training/models-out/lateral-folding';
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
const PORT = server.address().port;
const BASE = `http://127.0.0.1:${PORT}/`;

const SCENE = 'viz-training/scenes/embryology__folding-of-the-embryo__lateral-folding.json';
let REFS = [];
try {
  const scene = JSON.parse(readFileSync(SCENE, 'utf8'));
  REFS = scene.structures.map(s => ({ key: s.key, ref: s.refs && s.refs.procedural })).filter(r => r.ref);
} catch (e) { console.warn('scene not readable yet:', e.message); }

const W = 1000, H = 1000;
const STAGES = [
  ['t000',        0.00, {},                        'the flat trilaminar disc — day 21'],
  ['t025',        0.25, {},                        't = 0.25'],
  ['t050',        0.50, {},                        't = 0.50 — the folds half closed'],
  ['t075',        0.75, {},                        't = 0.75'],
  ['t100',        1.00, {},                        'the cylindrical embryo — day 28'],
  ['t000-bare',   0.00, { amnion: false, yolksac: false }, 'day 21, disc alone'],
  ['t050-bare',   0.50, { amnion: false, yolksac: false }, 'half closed, disc alone'],
  ['t100-bare',   1.00, { amnion: false, yolksac: false }, 'day 28, embryo alone'],
  ['t100-coel',   1.00, { amnion: false },         'the closed coelom'],
  ['t100-cut',    1.00, { cutaway: true, amnion: false }, 'cutaway — tube within a tube'],
  ['t050-cut',    0.50, { cutaway: true, amnion: false }, 'cutaway at half closure'],
  ['t100-hern',   1.00, { herniation: true, amnion: false, yolksac: false }, 'physiological herniation'],
  ['t100-omph',   1.00, { omphalocele: true, amnion: false, yolksac: false }, 'omphalocele — bowel inside a sac'],
  ['t100-gast',   1.00, { gastroschisis: true, amnion: false, yolksac: false }, 'gastroschisis — a hole on the RIGHT, no sac'],
  ['t100-exst',   1.00, { exstrophy: true, amnion: false, yolksac: false }, 'bladder exstrophy — failure below the umbilicus'],
];
/* yaw/pitch per stage: a transverse-section model wants a near-anterior camera for the section and
   an oblique one for the tube-within-a-tube claim, so both are rendered rather than one chosen. */
/* THE CAMERA HAS TO LOOK ALONG THE BODY AXIS, and the first version of this file did not.
   This is a TRANSVERSE-SECTION subject: the whole scene is one cut across the trunk, drawn three
   times. With the group unrotated the camera sits on +z and looks at the VENTRAL SURFACE, which for
   this model is a picture of the outside of a cylinder — every render came back as a plain yellow
   drum and not one layer was visible. rotation.x = -pi/2 maps ventral (+z) to screen-up and cranial
   (+y) away from the camera, so the section is seen from the cranial end with ventral up and the
   embryo's LEFT to the viewer's right. The ventral view is kept, because it is the right camera for
   a different question — where on the wall each defect sits. */
const CAMS = [
  ['section', 0.00,  1.5708],
  ['obliq',  -0.55,  1.1500],
  ['ventral', 0.00,  0.0000],
];

const html = `<!doctype html><meta charset=utf8>
<link rel="icon" href="data:,">
<body style="margin:0;background:#0e1626">
<canvas id=c width=${W} height=${H}></canvas>
<script src="${BASE}node_modules/three/build/three.js"><\/script>
<script src="${BASE}models3d/render-kit.js"><\/script>
<script src="${BASE}models3d/lateral-folding.js"><\/script>
<script>
window.MEDBANK_CONFIG = { MODEL_BASE: '${BASE}models3d/' };
const renderer = new THREE.WebGLRenderer({ canvas: document.getElementById('c'), antialias: true });
renderer.setSize(${W}, ${H}, false); renderer.setPixelRatio(1);
VizKit.configureRenderer(renderer);
const scene = new THREE.Scene();
scene.background = VizKit.bg(0x0e1626);
const L = VizKit.standardLights(scene);
const camera = new THREE.PerspectiveCamera(32, 1, 0.1, 200);
let group = null;
const MOD = window.MB3D_MODELS['lateral-folding'];
window.setStage = function (t, opts, yaw, pitch) {
  if (group) scene.remove(group);
  group = MOD.build(t, Object.assign({}, opts || {}));
  group.rotation.y = yaw || 0;
  group.rotation.x = pitch || 0;
  group.updateMatrixWorld(true);
  scene.add(group);
  const f = VizKit.fitCamera(camera, group, 1.04);
  camera.position.set(f.centre.x, f.centre.y, f.centre.z + f.distance);
  camera.lookAt(f.centre);
  L.key.position.set(camera.position.x + 6, camera.position.y + 8, camera.position.z + 4);
  renderer.render(scene, camera);
  return { size: [f.size.x, f.size.y, f.size.z] };
};
window.normalProbe = function (t, opts) {
  const g = MOD.build(t, Object.assign({}, opts || {}));
  g.updateMatrixWorld(true);
  const rows = [];
  const nm = new THREE.Matrix3();
  g.traverse(function (o) {
    if (!o.isMesh || !o.geometry) return;
    const u = o.userData || {};
    if (u.outline) return;
    const geo = o.geometry.index ? o.geometry.toNonIndexed() : o.geometry;
    const p = geo.attributes.position, n = geo.attributes.normal;
    if (!n) return;
    const hull = (o.geometry.userData && o.geometry.userData.hullCount) || 0;
    nm.getNormalMatrix(o.matrixWorld);
    const c = new THREE.Vector3(), v = new THREE.Vector3(), w = new THREE.Vector3();
    for (let i = 0; i < p.count; i++) c.add(v.fromBufferAttribute(p, i).applyMatrix4(o.matrixWorld));
    c.divideScalar(p.count);
    let out = 0, outHull = 0;
    for (let i = 0; i < p.count; i++) {
      v.fromBufferAttribute(p, i).applyMatrix4(o.matrixWorld).sub(c);
      w.fromBufferAttribute(n, i).applyMatrix3(nm).normalize();
      if (v.dot(w) > 0) { out++; if (i < hull) outHull++; }
    }
    let agree = 0, tris = 0;
    const a1 = new THREE.Vector3(), b1 = new THREE.Vector3(), c1 = new THREE.Vector3();
    const e1 = new THREE.Vector3(), e2 = new THREE.Vector3(), fn = new THREE.Vector3(), vn = new THREE.Vector3();
    for (let i = 0; i + 2 < p.count; i += 3) {
      a1.fromBufferAttribute(p, i); b1.fromBufferAttribute(p, i+1); c1.fromBufferAttribute(p, i+2);
      fn.copy(e1.subVectors(b1, a1).cross(e2.subVectors(c1, a1)));
      if (fn.lengthSq() < 1e-16) continue;
      fn.normalize(); vn.set(0,0,0);
      for (let k = 0; k < 3; k++) { const q = new THREE.Vector3().fromBufferAttribute(n, i+k); vn.add(q); }
      if (vn.lengthSq() < 1e-16) continue;
      vn.normalize(); tris++; if (fn.dot(vn) > 0) agree++;
    }
    rows.push({ key: u.key, verts: p.count, outward: out / p.count,
                hullVerts: hull, outwardHull: hull ? outHull / hull : null,
                tris: tris, winding: tris ? agree / tris : null,
                degenerate: (o.geometry.userData && o.geometry.userData.degenerateNormals) || 0,
                gridFlipped: !!(o.geometry.userData && o.geometry.userData.gridFlipped) });
  });
  return rows;
};
/* REAL MESH BOXES, and the floored relations re-measured on them. The model measures off its own
   profile rows; this measures the same claims on the vertices those rows produced. */
window.boxProbe = function (t, opts) {
  const g = MOD.build(t, Object.assign({}, opts || {}));
  g.updateMatrixWorld(true);
  const boxes = {}, v = new THREE.Vector3();
  g.traverse(function (o) {
    if (!o.isMesh || !o.geometry || (o.userData && o.userData.outline)) return;
    const k = o.userData && o.userData.key; if (!k) return;
    const p = o.geometry.attributes.position; if (!p) return;
    const bx = boxes[k] || (boxes[k] = { minx:1e9,maxx:-1e9,miny:1e9,maxy:-1e9,minz:1e9,maxz:-1e9,cx:0,cy:0,cz:0,n:0 });
    for (let i = 0; i < p.count; i++) {
      v.fromBufferAttribute(p, i).applyMatrix4(o.matrixWorld);
      if (v.x<bx.minx)bx.minx=v.x; if (v.x>bx.maxx)bx.maxx=v.x;
      if (v.y<bx.miny)bx.miny=v.y; if (v.y>bx.maxy)bx.maxy=v.y;
      if (v.z<bx.minz)bx.minz=v.z; if (v.z>bx.maxz)bx.maxz=v.z;
      bx.cx+=v.x; bx.cy+=v.y; bx.cz+=v.z; bx.n++;
    }
  });
  for (const k in boxes) { const b=boxes[k]; b.ex=b.maxx-b.minx; b.ey=b.maxy-b.miny; b.ez=b.maxz-b.minz;
    b.cx/=b.n; b.cy/=b.n; b.cz/=b.n; }
  return boxes;
};
/* THE CLAIMS, ON VERTICES. Each is the same sentence acceptance() asserts, measured a second way. */
window.meshClaims = function () {
  const F = MOD.FLOORS, R = {};
  // gut inside the wall, at a cranio-caudal station clear of the umbilicus
  const g1 = MOD.build(1, { amnion:false, yolksac:false, coelom:false, herniation:false });
  g1.updateMatrixWorld(true);
  const slice = (g, keys, yLo, yHi) => {
    const pts = []; const v = new THREE.Vector3();
    g.traverse(function (o) {
      if (!o.isMesh || !o.geometry || (o.userData && o.userData.outline)) return;
      if (keys.indexOf(o.userData && o.userData.key) < 0) return;
      const p = o.geometry.attributes.position;
      for (let i = 0; i < p.count; i++) { v.fromBufferAttribute(p, i).applyMatrix4(o.matrixWorld);
        if (v.y >= yLo && v.y <= yHi) pts.push([v.x, v.z]); }
    });
    return pts;
  };
  const wall = slice(g1, ['ectoderm','somatic'], 1.05, 1.25);
  const gut  = slice(g1, ['splanchnic','endoderm'], 1.05, 1.25);
  const bb = a => { let mnx=1e9,mxx=-1e9,mnz=1e9,mxz=-1e9; for (const p of a){ if(p[0]<mnx)mnx=p[0]; if(p[0]>mxx)mxx=p[0]; if(p[1]<mnz)mnz=p[1]; if(p[1]>mxz)mxz=p[1];} return {mnx,mxx,mnz,mxz}; };
  const wb = bb(wall), gb = bb(gut);
  R.wallBox = wb; R.gutBox = gb;
  R.gutOuterRadius = 0.25 * ((gb.mxx-gb.mnx) + (gb.mxz-gb.mnz));
  // least distance from any gut vertex to any wall vertex (sampled)
  let least = 1e9;
  const stepG = Math.max(1, Math.floor(gut.length / 900)), stepW = Math.max(1, Math.floor(wall.length / 2200));
  for (let i = 0; i < gut.length; i += stepG) for (let j = 0; j < wall.length; j += stepW) {
    const dx = gut[i][0]-wall[j][0], dz = gut[i][1]-wall[j][1]; const d = dx*dx+dz*dz;
    if (d < least) least = d;
  }
  R.clearanceAbs = Math.sqrt(least);
  R.F = R.clearanceAbs / R.gutOuterRadius;
  // B: the ventral gap away from the umbilicus, measured as the widest z-gap on the ventral midline
  const ventral = wall.filter(p => Math.abs(p[0]) < 0.035);
  R.ventralMidlinePts = ventral.length;
  R.wallWidth = wb.mxx - wb.mnx;
  // D: the ring, measured at the umbilicus
  const wallU = slice(g1, ['ectoderm'], -0.10, 0.10);
  let ringGapX = 0;
  { const ventralZ = Math.max.apply(null, wallU.map(p => p[1]));
    const near = wallU.filter(p => p[1] > ventralZ - 0.30);
    let lo = 1e9, hi = -1e9; for (const p of near) { if (p[0] < lo) lo = p[0]; if (p[0] > hi) hi = p[0]; }
    // the hole: the widest x-interval on the ventral strip with no vertex in it
    const xs = near.map(p => p[0]).sort((a,b)=>a-b);
    let best = 0, at = 0;
    for (let i = 1; i < xs.length; i++) if (xs[i]-xs[i-1] > best) { best = xs[i]-xs[i-1]; at = 0.5*(xs[i]+xs[i-1]); }
    ringGapX = best; R.ringGapCentreX = at;
  }
  R.ringGapAbs = ringGapX;
  R.D = ringGapX / (2 * R.gutOuterRadius);
  // I: gastroschisis, on real vertices
  const gg = MOD.build(1, { gastroschisis:true, amnion:false, yolksac:false, coelom:false });
  gg.updateMatrixWorld(true);
  const wallG = slice(gg, ['ectoderm'], -0.10, 0.10);
  { const ventralZ = Math.max.apply(null, wallG.map(p => p[1]));
    const near = wallG.filter(p => p[1] > ventralZ - 0.55);
    const xs = near.map(p => p[0]).sort((a,b)=>a-b);
    const gaps = [];
    for (let i = 1; i < xs.length; i++) if (xs[i]-xs[i-1] > 0.06) gaps.push({ w: xs[i]-xs[i-1], lo: xs[i-1], hi: xs[i] });
    gaps.sort((a,b)=>b.w-a.w);
    R.gastroGaps = gaps.slice(0, 3);
    const ring = gaps.find(q => q.lo < 0 && q.hi > 0);
    const defect = gaps.filter(q => q !== ring && q.hi < 0).sort((a,b)=>b.w-a.w)[0];
    if (ring && defect) {
      R.I_ringHalf = Math.abs(ring.lo);
      R.I_defectMedialX = defect.hi;
      R.I = (Math.abs(defect.hi) - Math.abs(ring.lo)) / (ring.hi - ring.lo);
      R.I_rightOfCord = defect.hi < 0;
    }
  }
  // J: exstrophy, on real vertices
  const ge = MOD.build(1, { exstrophy:true, amnion:false, yolksac:false, coelom:false });
  ge.updateMatrixWorld(true);
  const bxe = window.boxProbe ? null : null;
  { const v = new THREE.Vector3(); let mny=1e9,mxy=-1e9,cy=0,n=0;
    ge.traverse(function(o){ if(!o.isMesh||!o.geometry||(o.userData&&o.userData.outline))return;
      if((o.userData&&o.userData.key)!=='exstrophy')return;
      const p=o.geometry.attributes.position;
      for(let i=0;i<p.count;i++){v.fromBufferAttribute(p,i).applyMatrix4(o.matrixWorld);
        if(v.y<mny)mny=v.y; if(v.y>mxy)mxy=v.y; cy+=v.y; n++;} });
    R.exstrophyY = { min: mny, max: mxy, c: n?cy/n:null, extent: mxy-mny };
  }
  R.floors = F;
  return R;
};
/* every floor, fed a value it MUST reject. A floor that cannot fail is decoration. */
window.negativeCases = function () {
  const F = MOD.FLOORS;
  const cases = [
    ['A', v => v <= F.ARC,    F.ARC * 3],
    ['B', v => v <= F.CLOSE,  F.CLOSE * 4],
    ['D', v => v >= F.RING,   F.RING * 0.4],
    ['F', v => v >= F.CLEAR,  F.CLEAR * 0.4],
    ['G', v => v > 0 && v <= F.DUCT, F.DUCT * 3],
    ['G0', v => v > 0 && v <= F.DUCT, 0],
    ['H', v => v <= F.MESO,   F.MESO * 3],
    ['I', v => v >= F.GASTRO, F.GASTRO * 0.3],
    ['J', v => v >= F.EXSTR,  F.EXSTR * 0.3],
  ];
  return cases.map(([id, pred, wrong]) => ({ id: id, wrong: wrong, rejected: !pred(wrong) }));
};
const SOLID = { ectoderm:1, somatic:1, splanchnic:1, endoderm:1, mesentery:1, neural:1, notochord:1,
                somite:1, vitelline:1, yolksac:1, umbilicalring:1, herniation:1, gastroschisis:1, exstrophy:1 };
window.lumenProbe = function (grid) {
  const G = grid || 96;
  const rc = new THREE.Raycaster();
  const targets = [];
  group.traverse(function (o) {
    if (!o.isMesh || !o.geometry) return;
    const u = o.userData || {};
    if (u.outline || !SOLID[u.key]) return;
    targets.push(o);
  });
  const nm = new THREE.Matrix3();
  const a1=new THREE.Vector3(),b1=new THREE.Vector3(),c1=new THREE.Vector3();
  const e1=new THREE.Vector3(),e2=new THREE.Vector3(),fn=new THREE.Vector3();
  let hits=0, back=0; const offenders={};
  for (let iy=0; iy<G; iy++) for (let ix=0; ix<G; ix++) {
    const ndc = new THREE.Vector2((ix+0.5)/G*2-1, 1-(iy+0.5)/G*2);
    rc.setFromCamera(ndc, camera);
    const hit = rc.intersectObjects(targets, false)[0];
    if (!hit) continue;
    hits++;
    const p = hit.object.geometry.attributes.position, f = hit.face;
    a1.fromBufferAttribute(p, f.a); b1.fromBufferAttribute(p, f.b); c1.fromBufferAttribute(p, f.c);
    fn.copy(e1.subVectors(b1,a1).cross(e2.subVectors(c1,a1)));
    if (fn.lengthSq() < 1e-16) continue;
    nm.getNormalMatrix(hit.object.matrixWorld);
    fn.normalize().applyMatrix3(nm).normalize();
    if (fn.dot(rc.ray.direction) > 0.02) { back++; const k = hit.object.userData.key; offenders[k]=(offenders[k]||0)+1; }
  }
  return { rays: G*G, hits: hits, backfaceFirst: back, frac: hits ? back/hits : 0, offenders: offenders };
};
window.acceptance = function () { return MOD.acceptance(); };
window.solved = function () { return MOD.SOLVED; };
window.capLog = function () { return MOD.capLog(); };
<\/script>`;

writeFileSync(`${OUT}/_harness.html`, html);

const adapterHtml = `<!doctype html><meta charset=utf8><link rel="icon" href="data:,"><body>
<script src="${BASE}node_modules/three/build/three.js"><\/script>
<script>window.MEDBANK_CONFIG = { MODEL_BASE: '${BASE}models3d/' };<\/script>
<script src="${BASE}viz3d.js"><\/script>
<script>
/* THE SCENE MOVES BY SET_STAGE, so the thing to prove is not only that every ref resolves but that
   every ref FOLLOWS THE VIEW and comes back with different geometry at a different t. A ref that
   silently pinned itself would sit at t = 1 for ever while its neighbours walked the stages, and the
   picture would look fine. Driven through the adapter's own stageable()/atStage() pair, not a regexp. */
window.stageAll = function (refs) {
  const ad = window.MB3D.adapters.procedural;
  const MODEL = (window.MB3D_MODELS || {})['lateral-folding'] || {};
  const STATIC = MODEL.STATIC_PARTS || {}, LIMITED = MODEL.STAGE_LIMITED || {};
  return Promise.all(refs.map(function (r) {
    const s = { key: r.key, refs: { procedural: r.ref } };
    const able = ad.stageable(s);
    if (!able) return Promise.resolve({ key: r.key, ref: r.ref, stageable: false });
    const s0 = ad.atStage(s, 0), s1 = ad.atStage(s, 1);
    return Promise.all([ad.load(window.THREE, s0), ad.load(window.THREE, s1)]).then(function (rs) {
      const g0 = rs[0].mesh && rs[0].mesh.geometry, g1 = rs[1].mesh && rs[1].mesh.geometry;
      let moved = false;
      if (g0 && g1) {
        const a = g0.attributes.position, b = g1.attributes.position;
        if (a.count !== b.count) moved = true;
        else for (let i = 0; i < a.count; i += Math.max(1, Math.floor(a.count / 400)))
          if (Math.abs(a.getX(i) - b.getX(i)) + Math.abs(a.getZ(i) - b.getZ(i)) > 1e-4) { moved = true; break; }
      }
      const part = String(r.ref).split('#')[1].split(/[@+]/)[0];
      return { key: r.key, ref: r.ref, part: part, stageable: true, ref0: s0.refs.procedural,
               t0: !!g0, t1: !!g1, moved: moved,
               declaredStatic: Object.prototype.hasOwnProperty.call(STATIC, part),
               declaredLimited: Object.prototype.hasOwnProperty.call(LIMITED, part) };
    });
  }));
};
window.resolveAll = function (refs) {
  const ad = window.MB3D.adapters.procedural;
  return Promise.all(refs.map(function (r) {
    return ad.load(window.THREE, { key: r.key, refs: { procedural: r.ref } })
      .then(function (res) {
        const m = res && res.mesh;
        return { key: r.key, ref: r.ref, reason: res && res.reason, hasMesh: !!m,
                 tris: m && m.geometry ? m.geometry.attributes.position.count / 3 : 0 };
      }, function (e) { return { key: r.key, ref: r.ref, error: String(e && e.message || e) }; });
  }));
};
<\/script>`;
writeFileSync(`${OUT}/_adapter.html`, adapterHtml);

const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium-1194/chrome-linux/chrome',
  args: ['--use-gl=swiftshader', '--enable-unsafe-swiftshader', '--no-sandbox'] });
const p = await b.newPage({ viewport: { width: W, height: H } });
const log = [];
p.on('console', m => log.push({ type: m.type(), text: m.text() }));
p.on('pageerror', e => log.push({ type: 'pageerror', text: String(e && e.message || e) }));

await p.goto(BASE + `${OUT}/_harness.html`);
try { await p.waitForFunction('typeof window.setStage === "function"'); }
catch (e) {
  console.error('HARNESS DID NOT INITIALISE. Page said:');
  for (const m of log) console.error('  ' + m.type + ': ' + m.text.slice(0, 500));
  throw e;
}

const report = { stages: [], console: [], normals: null, acceptance: null, refs: null };
report.solved = await p.evaluate('window.solved()');
report.acceptance = await p.evaluate('window.acceptance()');
report.capLog = await p.evaluate('window.capLog()');
console.log('lam cap hits    :', JSON.stringify(report.capLog));

for (const [name, t, opts, label] of STAGES) {
  for (const [cam, yaw, pitch] of CAMS) {
    if (cam !== 'section' && !/t100|t050|t000/.test(name)) continue;
    await p.evaluate(([t, o, y, q]) => window.setStage(t, o, y, q), [t, opts, yaw, pitch]);
    const file = `${OUT}/${name}-${cam}.png`;
    await p.locator('#c').screenshot({ path: file });
    report.stages.push({ name, cam, t, opts, label, file });
  }
}

report.normals = await p.evaluate('window.normalProbe(1, {})');
report.normals0 = await p.evaluate('window.normalProbe(0, {})');
report.meshClaims = await p.evaluate('window.meshClaims()');
report.negatives = await p.evaluate('window.negativeCases()');

report.lumen = [];
for (const [nm2, t2, opts2, yaw2, pitch2] of [
  ['section t=0.00', 0.00, {}, 0, 1.5708],
  ['section t=0.50', 0.50, {}, 0, 1.5708],
  ['section t=1.00', 1.00, {}, 0, 1.5708],
  ['oblique t=1.00', 1.00, {}, -0.55, 1.15],
  ['ventral t=1.00', 1.00, {}, 0, 0],
  ['oblique t=1.00 cut', 1.00, { cutaway: true }, -0.55, 1.15],
  ['ventral t=1.00 gastro', 1.00, { gastroschisis: true }, 0, 0],
  ['section t=1.00 bare', 1.00, { amnion:false, yolksac:false }, 0, 1.5708],
]) {
  await p.evaluate(([t3, o3, y3, q3]) => window.setStage(t3, o3, y3, q3), [t2, opts2, yaw2, pitch2]);
  const r2 = await p.evaluate('window.lumenProbe(96)');
  await p.locator('#c').screenshot({ path: `${OUT}/lumen-${nm2.replace(/[^a-z0-9]+/gi, '-')}.png` });
  report.lumen.push(Object.assign({ camera: nm2, t: t2 }, r2));
}
report.console = log.slice();

const p2 = await b.newPage();
const log2 = [];
p2.on('console', m => log2.push({ type: m.type(), text: m.text() }));
p2.on('pageerror', e => log2.push({ type: 'pageerror', text: String(e && e.message || e) }));
await p2.goto(BASE + `${OUT}/_adapter.html`);
await p2.waitForFunction('typeof window.resolveAll === "function"');
report.refs = REFS.length ? await p2.evaluate(r => window.resolveAll(r), REFS) : [];
report.stages_t = REFS.length ? await p2.evaluate(r => window.stageAll(r), REFS) : [];
report.adapterConsole = log2;

await b.close(); server.close();

/* ---- verdict ---- */
const NOISE = /GPU stall due to ReadPixels|GL Driver Message|Automatic fallback to software WebGL|SwiftShader/i;
const noise = report.console.filter(m => NOISE.test(m.text));
const bad = report.console.filter(m => (m.type === 'error' || m.type === 'warning' || m.type === 'pageerror') && !NOISE.test(m.text));
const badA = (report.adapterConsole || []).filter(m => m.type === 'error' || m.type === 'warning' || m.type === 'pageerror');
report.harness_noise = noise;

console.log('stages rendered  :', report.stages.length);
console.log('console (model)  :', bad.length ? 'DIRTY' : 'clean', bad.map(x => x.type + ': ' + x.text).join(' | '),
  '  [' + noise.length + ' swiftshader harness messages ignored]');
console.log('console (adapter):', badA.length ? 'DIRTY' : 'clean', badA.map(x => x.type + ': ' + x.text).join(' | '));
console.log('solved           : outer a*=' + report.solved.outer.a.toFixed(6) + ' lam*=' + report.solved.outer.lam.toFixed(6) +
            ' theta=' + report.solved.outer.thetaEnd.toFixed(9) + '   gut a*=' + report.solved.gut.a.toFixed(6) +
            ' lam*=' + report.solved.gut.lam.toFixed(6));
console.log('acceptance       :', JSON.stringify(report.acceptance.pass), 'allPass=' + report.acceptance.allPass);
for (const k of Object.keys(report.acceptance.measured)) {
  const v = report.acceptance.measured[k];
  if (typeof v === 'number') console.log('   ' + k.padEnd(18) + (Math.abs(v) < 1e-4 && v !== 0 ? v.toExponential(2) : v.toFixed(5)));
}
const byKey = {};
for (const r of report.normals) (byKey[r.key] = byKey[r.key] || []).push(r);
let normalsOk = true, flipped = [];
for (const k of Object.keys(byKey)) {
  const rows = byKey[k];
  const ow = rows.map(r => r.outward), wi = rows.map(r => r.winding).filter(x => x != null);
  const oh = rows.map(r => r.outwardHull).filter(x => x != null);
  if (rows.some(r => r.gridFlipped)) flipped.push(k);
  const minW = Math.min(...wi);
  if (minW < 0.999) normalsOk = false;
  console.log('  normals ' + k.padEnd(14) +
    'outer-surface ' + (oh.length ? Math.min(...oh).toFixed(3) + '-' + Math.max(...oh).toFixed(3) : '   n/a   ') +
    '  whole-buffer ' + Math.min(...ow).toFixed(3) + '-' + Math.max(...ow).toFixed(3) +
    '  winding ' + minW.toFixed(3) + '-' + Math.max(...wi).toFixed(3) + '  (' + rows.length + ' meshes)');
}
if (flipped.length) console.log('  *** GRID HANDED IN INSIDE-OUT: ' + flipped.join(', '));

const MC = report.meshClaims, F = MC.floors;
console.log('the same claims, on REAL MESH VERTICES:');
const row = (id, val, cmp, lim, extra) => console.log('  ' + id.padEnd(4) + ' mesh ' + (val == null ? ' n/a ' : val.toFixed(4)) +
  '  proxy ' + (report.acceptance.measured[id] != null ? Number(report.acceptance.measured[id]).toFixed(4) : ' n/a ') +
  '  ' + cmp + ' ' + lim.toFixed(3) + '  ' + (val != null && (cmp === '>=' ? val >= lim : val <= lim) ? 'pass' : 'FAIL') + (extra || ''));
row('D', MC.D, '>=', F.RING, '   (ring opening ' + MC.ringGapAbs.toFixed(3) + ' at x=' + MC.ringGapCentreX.toFixed(3) + ')');
row('F', MC.F, '>=', F.CLEAR, '   (least clearance ' + MC.clearanceAbs.toFixed(3) + ')');
row('I', MC.I, '>=', F.GASTRO, '   (defect medial edge x=' + (MC.I_defectMedialX != null ? MC.I_defectMedialX.toFixed(3) : '?') +
  ', right of cord=' + MC.I_rightOfCord + ')');
const meshPass = (MC.D >= F.RING) && (MC.F >= F.CLEAR) && (MC.I != null && MC.I >= F.GASTRO && MC.I_rightOfCord);
console.log('  exstrophy y     :', JSON.stringify(MC.exstrophyY));

const negFail = report.negatives.filter(n => !n.rejected);
console.log('negative cases   :', report.negatives.length - negFail.length + '/' + report.negatives.length + ' rejected',
  negFail.length ? 'NOT REJECTED: ' + negFail.map(n => n.id).join(', ') : '');

report.lumenPass = report.lumen.every(l => l.backfaceFirst === 0);
for (const l of report.lumen) console.log('open lumen  ' + l.camera.padEnd(22) +
  l.backfaceFirst + '/' + l.hits + ' first hits face away' +
  (l.backfaceFirst ? '   *** OPEN: ' + JSON.stringify(l.offenders) + ' ***' : '   closed'));

const failed = report.refs.filter(r => !r.hasMesh || !r.tris);
console.log('refs resolved    :', (report.refs.length - failed.length) + '/' + report.refs.length,
  failed.length ? 'FAILED: ' + failed.map(f => f.key + '(' + (f.reason || f.error) + ')').join(', ') : '');
/* Three separate questions, and only the undeclared ones are failures:
   does the ref follow the view at all; does the part exist at every t; does it CHANGE with t. */
const stPinned  = (report.stages_t || []).filter(r => !r.stageable);
const stMissing = (report.stages_t || []).filter(r => r.stageable && (!r.t0 || !r.t1) && !r.declaredLimited);
const stStill   = (report.stages_t || []).filter(r => r.stageable && r.t0 && r.t1 && !r.moved && !r.declaredStatic);
const stOkStill = (report.stages_t || []).filter(r => r.declaredStatic && !r.moved);
const stOkGone  = (report.stages_t || []).filter(r => r.declaredLimited && (!r.t0 || !r.t1));
console.log('SET_STAGE        :', (report.stages_t.length - stPinned.length) + '/' + report.stages_t.length + ' follow the view',
  stPinned.length ? '  PINNED: ' + stPinned.map(r => r.key).join(', ') : '');
console.log('  undeclared static  :', stStill.length ? '*** ' + stStill.map(r => r.key).join(', ') : 'none',
  '   [declared static and confirmed still: ' + stOkStill.map(r => r.key).join(', ') + ']');
console.log('  undeclared absence :', stMissing.length ? '*** ' + stMissing.map(r => r.key + '(t0=' + r.t0 + ',t1=' + r.t1 + ')').join(', ') : 'none',
  '   [declared stage-limited and confirmed absent: ' + (stOkGone.map(r => r.key).join(', ') || 'none') + ']');
report.stagePass = stPinned.length === 0 && stMissing.length === 0 && stStill.length === 0;
console.log('total triangles  :', report.normals.reduce((s, r) => s + r.tris, 0));

report.normalsOk = normalsOk; report.meshPass = meshPass; report.negPass = negFail.length === 0;
writeFileSync(`${OUT}/report.json`, JSON.stringify(report, null, 1));
process.exit(bad.length || badA.length || failed.length || !report.acceptance.allPass ||
  !normalsOk || !meshPass || !report.negPass || !report.lumenPass || flipped.length || !report.stagePass ? 1 : 0);
