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
 *   8. EVERY MEASUREMENT IS PERTURBED. Added 2026-09-30, the rule review round 1 wrote into
 *      RENDER-STANDARD section 3 after finding two acceptance rows whose measured side was a
 *      compile-time constant: the constant the geometry is built from is changed in a copy of the
 *      model source, the model is re-evaluated, and the reported number MUST MOVE. A test that cannot
 *      fail is not evidence, however carefully its floor was chosen — and 6 and 7 above cannot see
 *      this class of fault, because a constant satisfies a magnitude floor and a predicate test
 *      perfectly. Run in node with vm, against the same file the page loads.
 *   9. TERMINAL ENDS, and 10. WHETHER THE DEFECT IS LEGIBLE IN THE VIEW THAT TEACHES IT.
 *
 * WHERE THIS RUNS. In a Linux container with chromium, against a copy of the repo — the mount that
 * holds the real repo has no browser. The file under test is byte identical. Run from the repo root:
 *   node viz-training/tools/render-lateral-folding.mjs
 */
import { chromium } from 'playwright';
import { readFileSync, writeFileSync, mkdirSync } from 'fs';
import http from 'http';
import { execFileSync } from 'node:child_process';
import path from 'path';
import fs from 'fs';
import vm from 'vm';
import { createRequire } from 'module';

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
  // H: the mesentery's taper, on real vertices. Sliced by z at the two ENDS of the sheet — the wall
  // end (zTop) and the gut end (zBot) — and the thickness is the x extent of each slice. Nothing here
  // knows the taper law; if the sheet were built from a different array this would say so.
  { const v = new THREE.Vector3(); const pts = [];
    g1.traverse(function(o){ if(!o.isMesh||!o.geometry||(o.userData&&o.userData.outline))return;
      if((o.userData&&o.userData.key)!=='mesentery')return;
      const p=o.geometry.attributes.position;
      for(let i=0;i<p.count;i++){v.fromBufferAttribute(p,i).applyMatrix4(o.matrixWorld); pts.push([v.x,v.z]);} });
    let zlo=1e9, zhi=-1e9; for(const q of pts){ if(q[1]<zlo)zlo=q[1]; if(q[1]>zhi)zhi=q[1]; }
    const band = 0.04*(zhi-zlo);
    const ext = zz => { let mn=1e9,mx=-1e9,n=0; for(const q of pts) if(Math.abs(q[1]-zz)<=band){ if(q[0]<mn)mn=q[0]; if(q[0]>mx)mx=q[0]; n++; }
                        return { w: n?mx-mn:null, n: n }; };
    /* WHICH END IS WHICH, and it is not the obvious way round. The sheet runs from the DORSAL body
       wall, zTop = 0.195, to the gut's dorsal surface at zBot = 0.478 — so the WALL end is the LOW z
       and the GUT end the high one. Written the other way first and the probe said 12.5 against a
       floor of 0.25, which is 1/0.08: the reciprocal, i.e. exactly the two ends swapped. */
    const atWall = ext(zlo), atGut = ext(zhi);
    R.H_wall = atWall.w; R.H_gut = atGut.w;
    R.H = (atWall.w && atWall.w > 1e-9) ? atGut.w/atWall.w : null;
    R.H_zSpan = [zlo, zhi]; R.H_counts = [atWall.n, atGut.n];
    R.H_note = 'zlo is the body-wall end, zhi the gut end';
  }

  // J / J-closed / K: the ventral gap AT EVERY STATION, on real vertices of the exstrophy build.
  // The station's gap is the widest empty x-interval on its ventral strip — the same construction D
  // uses at the umbilicus, run over the whole cranio-caudal axis instead of at one station.
  const ge = MOD.build(1, { exstrophy:true, amnion:false, yolksac:false, coelom:false });
  ge.updateMatrixWorld(true);
  { const EX = MOD.EXSTROPHY, NYs = EX.NY, dy = EX.YLEN/NYs;
    const v = new THREE.Vector3(); const buckets = [];
    for (let j=0;j<=NYs;j++) buckets.push([]);
    ge.traverse(function(o){ if(!o.isMesh||!o.geometry||(o.userData&&o.userData.outline))return;
      if((o.userData&&o.userData.key)!=='ectoderm')return;
      const p=o.geometry.attributes.position;
      for(let i=0;i<p.count;i++){ v.fromBufferAttribute(p,i).applyMatrix4(o.matrixWorld);
        const j = Math.round((v.y/EX.YLEN + 0.5)*NYs);
        if (j>=0 && j<=NYs && Math.abs(v.y - (j/NYs-0.5)*EX.YLEN) < dy*0.35) buckets[j].push([v.x, v.z]); } });
    let wallW = 0; for (const q of buckets[0]) wallW = Math.max(wallW, Math.abs(q[0])); wallW *= 2;
    const gaps = [], ys = [];
    for (let j=0;j<=NYs;j++){
      ys.push((j/NYs-0.5)*EX.YLEN);
      const b = buckets[j];
      if (b.length < 8) { gaps.push(0); continue; }
      let zv=-1e9; for(const q of b) zv=Math.max(zv,q[1]);
      const near = b.filter(q => q[1] > zv - 0.30).map(q=>q[0]);
      /* THE OPENING IS TWICE THE DISTANCE FROM THE MIDLINE TO THE NEAREST VERTEX, and it is that
         rather than "the widest empty x-interval" — which is what D uses at the single station where
         the wall is definitely open — because on a CLOSED station the widest empty interval is the
         sampling pitch, 0.0503 here, and 0.0503 is larger than FLOORS.CLOSE * wall width. Read that
         way every station in the block came back open and the whole measurement said one band. The
         distance to the midline has no such floor: 0.0026 closed, 0.322-0.714 open, and it tracks the
         rows' own gap to within the ectoderm's outward offset (0.6304 against 0.6000). */
      let minAbs = 1e9; for (const x of near) minAbs = Math.min(minAbs, Math.abs(x));
      gaps.push(2 * minAbs);
    }
    const thresh = F.CLOSE * wallW;
    const bandsOf = want => { const out=[]; let i=0;
      while(i<gaps.length){ const o1=gaps[i]>thresh; let k=i; while(k+1<gaps.length && (gaps[k+1]>thresh)===o1) k++;
        if(o1===want) out.push({lo:ys[i]-dy/2, hi:ys[k]+dy/2, j0:i, j1:k, extent:(ys[k]-ys[i])+dy}); i=k+1; } return out; };
    const open = bandsOf(true), shut = bandsOf(false);
    R.J_wallWidth = wallW; R.J_thresh = thresh;
    R.J_gapsByStation = gaps.map(x=>+x.toFixed(4));
    R.J_openBands = open.map(b=>[+b.lo.toFixed(4),+b.hi.toFixed(4)]);
    R.J_bandCount = open.length;
    if (open.length === 2) {
      const cd = open[0], cr = open[1];
      R.J = (cr.lo - cd.hi) / (0.5*(cr.extent + cd.extent));
      R.J_bridge = cr.lo - cd.hi;
      R.J_caudalBelowCranial = cd.hi <= cr.lo;
      const mid = shut.find(b => b.lo >= cd.hi - 1e-9 && b.hi <= cr.lo + 1e-9);
      let worst = 0; if (mid) for (let j=mid.j0;j<=mid.j1;j++) worst = Math.max(worst, gaps[j]);
      R['J-closed'] = mid ? worst/wallW : 1;
      R.J_bridgeStations = mid ? (mid.j1-mid.j0+1) : 0;
      let mny=1e9,mxy=-1e9;
      ge.traverse(function(o){ if(!o.isMesh||!o.geometry||(o.userData&&o.userData.outline))return;
        if((o.userData&&o.userData.key)!=='exstrophy')return;
        const p=o.geometry.attributes.position;
        for(let i=0;i<p.count;i++){v.fromBufferAttribute(p,i).applyMatrix4(o.matrixWorld);
          if(v.y<mny)mny=v.y; if(v.y>mxy)mxy=v.y;} });
      R.exstrophyY = { min: mny, max: mxy, extent: mxy-mny };
      R.K_caudalBand = [+cd.lo.toFixed(4), +cd.hi.toFixed(4)];
      /* the number the OLD row K reported, kept so a review can see what the replaced test would
         have said on this geometry: NEGATIVE, because the plate is now rooted in the wall either
         side of the hole instead of floating clear inside it. ACCEPTANCE K carries the argument. */
      R.K_clearance_was = (mxy>mny) ? Math.min(mny-cd.lo, cd.hi-mxy)/(mxy-mny) : -1;

      /* ---- K / P / P-gut ON THE MESH: A SECOND INSTRUMENT AND A SECOND APERTURE ----

         The model's own aperture field rasterises triangles over a screen grid and finds the aperture
         from the PROFILE ROWS. This re-measures the same three numbers by RAYCAST, over the aperture
         read from the ECTODERM'S OWN VERTEX BUCKETS (the per-station gaps[] above, the same ones J is
         re-measured from) - a different instrument on a different definition of the hole, which is
         the whole point of a mesh re-measurement. It is also the method review round 6 used to find
         the defect, so the before/after numbers are comparable with the queue's own findings.

         The composition is the beat's, resolved exactly as the player resolves it: every key in
         APERTURE_BEATS[8].shown through its own refs.procedural variant, via MOD.KEY_PART. */
      const SPEC = (MOD.APERTURE_BEATS || {})[8];
      if (SPEC) {
        const KP = MOD.KEY_PART || {};
        const meshesOf = key => {
          const part = KP[key] ? KP[key][0] : key, variant = KP[key] ? KP[key][1] : null;
          const o = Object.assign({}, MOD.FULL); if (variant) o[variant] = true;
          const gg = MOD.build(1, o); gg.updateMatrixWorld(true);
          const out = []; gg.traverse(function (m) {
            if (!m.isMesh || !m.geometry || (m.userData && m.userData.outline)) return;
            if ((m.userData || {}).key !== part) return;
            out.push(m); });
          return out;
        };
        const targets = [], ownerOf = new Map();
        const missing = [];
        for (const key of SPEC.shown) {
          const ms = meshesOf(key);
          if (!ms.length) { missing.push(key); continue; }
          for (const m of ms) { targets.push(m); ownerOf.set(m, key); }
        }
        R.P_missing_mesh = missing;
        /* the aperture, off the vertex buckets: half-gap as a function of y, linear between the
           stations, zero at and beyond the closed stations bounding the caudal band. */
        const jA = Math.max(0, cd.j0 - 1), jB = Math.min(gaps.length - 1, cd.j1 + 1);
        const halfAt = y => {
          if (y <= ys[jA] || y >= ys[jB]) return 0;
          const u = (y - ys[0]) / dy, i = Math.max(jA, Math.min(jB - 1, Math.floor(u))), f = u - i;
          return 0.5 * (gaps[i] * (1 - f) + gaps[i + 1] * f);
        };
        const rc = new THREE.Raycaster();
        const dir = new THREE.Vector3(0, 0, -1);
        const org = new THREE.Vector3();
        const firstKey = (x, y) => {
          org.set(x, y, 40);
          rc.set(org, dir);
          const h = rc.intersectObjects(targets, false)[0];
          return h ? (ownerOf.get(h.object) || 'other') : 'nothing';
        };
        const GUT = ['endoderm', 'vitelline'];
        /* 1. the aperture, decomposed */
        const NYr = 150, NXr = 80;
        const byKey = {}; let n = 0, plateN = 0, gutN = 0;
        for (let a = 0; a < NYr; a++) {
          const y = ys[jA] + (ys[jB] - ys[jA]) * (a + 0.5) / NYr;
          const h = halfAt(y);
          if (!(h > 1e-6)) continue;
          for (let b = 0; b < NXr; b++) {
            const x = -h + 2 * h * (b + 0.5) / NXr;
            const k = firstKey(x, y);
            byKey[k] = (byKey[k] || 0) + 1; n++;
            if (k === 'exstrophy_plate') plateN++;
            else if (GUT.indexOf(k) >= 0) gutN++;
          }
        }
        for (const k of Object.keys(byKey)) byKey[k] = +(byKey[k] / n).toFixed(4);
        R.P_rays = n; R.P_byKey_mesh = byKey;
        R.P = n ? plateN / n : 0;
        R['P-gut'] = n ? gutN / n : 1;
        /* 2. the plate's own visible footprint, and how much of it is inside the hole */
        let seen = 0, seenIn = 0;
        const px0 = -0.9, px1 = 0.9;
        const NYp = 180, NXp = 90;
        for (let a = 0; a < NYp; a++) {
          const y = mny + (mxy - mny) * (a + 0.5) / NYp;
          for (let b = 0; b < NXp; b++) {
            const x = px0 + (px1 - px0) * (b + 0.5) / NXp;
            if (firstKey(x, y) !== 'exstrophy_plate') continue;
            seen++;
            if (Math.abs(x) <= halfAt(y)) seenIn++;
          }
        }
        R.K_plateSeen = seen;
        R.K = seen ? seenIn / seen : 0;
      } else { R.P = 0; R['P-gut'] = 1; R.K = 0; }
      let rmn=1e9, rmx=-1e9, rn=0;
      ge.traverse(function(o){ if(!o.isMesh||!o.geometry||(o.userData&&o.userData.outline))return;
        if((o.userData&&o.userData.key)!=='umbilicalring')return;
        const p=o.geometry.attributes.position;
        for(let i=0;i<p.count;i++){v.fromBufferAttribute(p,i).applyMatrix4(o.matrixWorld);
          if(v.y<rmn)rmn=v.y; if(v.y>rmx)rmx=v.y; rn++;} });
      R.L_ringY = rn ? [+rmn.toFixed(4), +rmx.toFixed(4)] : null;
      R.L = rn ? Math.max(cr.lo - rmn, rmx - cr.hi)/cr.extent : 1;
      R.L_cranialBand = [+cr.lo.toFixed(4), +cr.hi.toFixed(4)];
    } else { R.J = 0; R['J-closed'] = 1; R.K = -1; R.L = 1; R.P = 0; R['P-gut'] = 1; }
  }
  /* M / M-solid / N / N-medial — THE MEMBRANE AND THE CORD, ON REAL MESH VERTICES.

     Added 2026-09-30 for review round 2, which found that beat 6's three claims were all about the
     gastroschisis side while the scene calls the MEMBRANE the diagnostic feature, and that no cord
     existed at all. Everything here is read off the built meshes rather than off the paths the model
     derives them from, so a cord or a sac drawn wider, shifted or not drawn is caught.

     THE PROJECTED COVERAGE IS RE-RASTERISED FROM THE MESH, not taken from the model: the sac's own
     vertices give the projected disc (centre and radius on the anterior screen plane) and the loop's
     vertices give the covered fraction, over the same grid the model uses. */
  {
    const v = new THREE.Vector3();
    const ptsOf = (g, key) => { const a = []; g.traverse(function (o) {
        if (!o.isMesh || !o.geometry || (o.userData && o.userData.outline)) return;
        if ((o.userData || {}).key !== key) return;
        const pa = o.geometry.attributes.position;
        for (let i = 0; i < pa.count; i++) { v.fromBufferAttribute(pa, i).applyMatrix4(o.matrixWorld); a.push([v.x, v.y, v.z]); } });
      return a; };
    const go = MOD.build(1, { omphalocele:true, amnion:false, yolksac:false, coelom:false });
    go.updateMatrixWorld(true);
    const gs = MOD.build(1, { gastroschisis:true, amnion:false, yolksac:false, coelom:false });
    gs.updateMatrixWorld(true);

    const sacV = ptsOf(go, 'sac'), omphV = ptsOf(go, 'herniation'), bareV = ptsOf(gs, 'gastroschisis');
    R.M_counts = { sac: sacV.length, omphalocele: omphV.length, bare: bareV.length, cord: 0 };
    if (sacV.length && omphV.length && bareV.length) {
      /* the sac's projected disc, from ITS OWN vertices: centre = mean of (x,y), radius = the
         furthest of them. VIEW_DIR.anterior is (0,0,1), so the screen plane is (x,y) — and it is
         taken from the model's copied table rather than written here, so if viz3d's camera ever
         moves this follows it. */
      const D = (MOD.VIEW_DIR && MOD.VIEW_DIR.anterior) || [0,0,1];
      const anterior = Math.abs(D[0]) < 1e-9 && Math.abs(D[1]) < 1e-9;
      const px = q => anterior ? [q[0], q[1]] : [q[0], q[1]];   // only the anterior camera is claimed
      let cx = 0, cy = 0; for (const q of sacV) { cx += q[0]; cy += q[1]; } cx /= sacV.length; cy /= sacV.length;
      let sr = 0; for (const q of sacV) sr = Math.max(sr, Math.hypot(q[0]-cx, q[1]-cy));
      R.M_sacDisc = { cx:+cx.toFixed(4), cy:+cy.toFixed(4), r:+sr.toFixed(4) };
      const cover = V => {
        let lo0=1e9,hi0=-1e9,lo1=1e9,hi1=-1e9;
        for (const q of V) { const a = px(q); lo0=Math.min(lo0,a[0]); hi0=Math.max(hi0,a[0]); lo1=Math.min(lo1,a[1]); hi1=Math.max(hi1,a[1]); }
        const N = 220, d0 = (hi0-lo0)/N, d1 = (hi1-lo1)/N;
        /* occupancy from the vertex cloud: a cell counts as loop if any vertex falls in it. The mesh
           is dense (ring 14-16 over 40+ stations), so this is the loop's own silhouette. */
        const occ = new Uint8Array(N*N);
        for (const q of V) { const a = px(q);
          let i = Math.floor((a[0]-lo0)/d0), j = Math.floor((a[1]-lo1)/d1);
          if (i>=N) i=N-1; if (i<0) i=0; if (j>=N) j=N-1; if (j<0) j=0; occ[j*N+i] = 1; }
        let inLoop=0, inBoth=0;
        for (let j=0;j<N;j++) for (let i=0;i<N;i++) { if (!occ[j*N+i]) continue; inLoop++;
          const x = lo0+(i+0.5)*d0, y = lo1+(j+0.5)*d1;
          if (Math.hypot(x-cx, y-cy) <= sr) inBoth++; }
        return inLoop ? inBoth/inLoop : 0; };
      R.M = cover(omphV);
      R.M_gastroschisis = cover(bareV);
      /* M-solid: the signed clearance in THREE dimensions, from the meshes. The coil's furthest
         vertex from the sac's centre, and the bare loop's nearest, both over the sac's radius. */
      let sc = [0,0,0]; for (const q of sacV) { sc[0]+=q[0]; sc[1]+=q[1]; sc[2]+=q[2]; }
      sc = sc.map(z => z/sacV.length);
      let R3 = 0; for (const q of sacV) R3 = Math.max(R3, Math.hypot(q[0]-sc[0], q[1]-sc[1], q[2]-sc[2]));
      /* the coil only — the herniation's intramural run crosses the wall and is never under a
         membrane that stands outside it. Taken as the vertices ventral to the ring's own aperture z,
         which is where the wall is, rather than by path index. */
      const ringZ = MOD.cordFrame({}).ring.z;
      let worstIn = -1e9, nCoil = 0;
      for (const q of omphV) { if (q[2] <= ringZ) continue; nCoil++;
        worstIn = Math.max(worstIn, (Math.hypot(q[0]-sc[0], q[1]-sc[1], q[2]-sc[2]) - R3) / R3); }
      let worstOut = 1e9;
      for (const q of bareV) worstOut = Math.min(worstOut, (Math.hypot(q[0]-sc[0], q[1]-sc[1], q[2]-sc[2]) - R3) / R3);
      R.M_coilInside = nCoil ? worstIn : null; R.M_coilVertices = nCoil;
      R['M-solid'] = worstOut; R.M_sacR3 = +R3.toFixed(4);
    }

    /* N — where the cord inserts, from the cord's OWN vertices: the vertex nearest the ring's
       aperture, over the sac's radius. On the omphalocele build the whole cord is out on the
       membrane; on the gastroschisis build its buried end is at the aperture. */
    const Fr = MOD.cordFrame({}), sacR = MOD.sacSphere().r;
    const nearestToRing = V => { let d = 1e9;
      for (const q of V) d = Math.min(d, Math.hypot(q[0]-Fr.ring.x, q[1]-Fr.ring.y, q[2]-Fr.ring.z));
      return V.length ? d/sacR : null; };
    const cordO = ptsOf(go, 'cord'), cordG = ptsOf(gs, 'cord');
    R.M_counts.cord = cordO.length + cordG.length;
    R.N = nearestToRing(cordO);
    R.N_gastroschisis = nearestToRing(cordG);
    R.N_sacRadius = +sacR.toFixed(4);
    /* O / O-two — the camera question, on the cords' OWN vertices. The projected extent of each cord
       along the screen plane of the named view, over its extent in space; and the clear gap between
       the two collinear cords, in cord diameters, from the vertex clouds rather than from the paths.
       The screen basis is rebuilt here from the model's copied VIEW_DIR, so if viz3d's table moves
       both the model and this probe move with it. */
    const basis = (dir) => { let [dx,dy,dz] = dir; const dl = Math.hypot(dx,dy,dz)||1; dx/=dl;dy/=dl;dz/=dl;
      const a = Math.abs(dz) < 0.9 ? [0,0,1] : [1,0,0];
      let ux = a[1]*dz - a[2]*dy, uy = a[2]*dx - a[0]*dz, uz = a[0]*dy - a[1]*dx;
      const ul = Math.hypot(ux,uy,uz)||1; ux/=ul;uy/=ul;uz/=ul;
      return { u:[ux,uy,uz], v:[dy*uz-dz*uy, dz*ux-dx*uz, dx*uy-dy*ux] }; };
    /* WHAT FRACTION OF THE CORD'S OWN LONG AXIS A CAMERA KEEPS.

       WRITTEN AS A BOUNDING-BOX RATIO FIRST, AND THAT WAS THE WRONG QUESTION. The projected
       bounding-box diagonal over the spatial one reported 0.5696 for the anterior camera against the
       model's 0.0000, and both numbers were right about different things: a cord seen exactly end-on
       still projects its own GIRTH, and a box diagonal cannot tell girth from length. The claim is
       about LENGTH — whether a student can see how far the cord reaches and therefore where it
       starts — so the measure is the foreshortening of the cord's long axis. Caught by the
       proxy-versus-mesh comparison this file exists to do, which is the argument for doing it.

       The axis is DERIVED FROM THE VERTICES rather than taken from the model: power iteration on the
       vertex cloud's covariance, which for a capped cylinder returns its own axis. So this still
       witnesses the built mesh — turn the cord in the model and this follows without being told. */
    const acrossOf = (V, dir) => { if (V.length < 8) return null;
      let c = [0,0,0]; for (const q of V) { c[0]+=q[0]; c[1]+=q[1]; c[2]+=q[2]; }
      c = c.map(z => z/V.length);
      let a = [1,1,1];
      for (let it = 0; it < 40; it++) {
        const n = [0,0,0];
        for (const q of V) { const dx=q[0]-c[0], dy=q[1]-c[1], dz=q[2]-c[2];
          const w = dx*a[0] + dy*a[1] + dz*a[2];
          n[0]+=dx*w; n[1]+=dy*w; n[2]+=dz*w; }
        const l = Math.hypot(n[0],n[1],n[2]); if (!(l > 0)) return null;
        a = [n[0]/l, n[1]/l, n[2]/l];
      }
      let [dx,dy,dz] = dir; const dl = Math.hypot(dx,dy,dz)||1; dx/=dl;dy/=dl;dz/=dl;
      const along = a[0]*dx + a[1]*dy + a[2]*dz;
      /* the part of the unit axis that survives in the screen plane */
      return Math.sqrt(Math.max(0, 1 - along*along)); };
    const VD = MOD.VIEW_DIR || { anterior:[0,0,1], lateral:[1,0,0] };
    R.O = acrossOf(cordG, VD.lateral);
    R.O_lateral_sac = acrossOf(cordO, VD.lateral);
    R.O_anterior = acrossOf(cordG, VD.anterior);
    /* the gap, SIGNED ALONG THE AXIS THEY SHARE and not as a distance: the sac-cord's nearest vertex
       minus the ring-cord's furthest, projected on the aperture's outward direction. Written as a
       nearest-vertex distance first, which reports an OVERLAP as a gap of the same size — the same
       fault the model's own cordGap() had, and both were found by the perturbation on the same run. */
    { let gMax = -1e9, oMin = 1e9;
      const proj = q => q[0]*Fr.ox + q[2]*Fr.oz;
      for (const a of cordG) gMax = Math.max(gMax, proj(a));
      for (const b of cordO) oMin = Math.min(oMin, proj(b));
      R['O-two'] = (cordG.length && cordO.length) ? (oMin - gMax) / (2 * Fr.r) : null; }

    /* N-medial: the whole gastroschisis cord between the midline and the window. The defect's medial
       edge is the one measured above, on real vertices, so this row and row I read the same number. */
    let cmax = 0; for (const q of cordG) cmax = Math.max(cmax, Math.abs(q[0]));
    R['N-medial'] = cordG.length ? cmax : null;
    R.N_defectMedialAbsX = R.I_defectMedialX != null ? Math.abs(R.I_defectMedialX) : null;
    R.N_medialOk = cordG.length > 0 && R.N_defectMedialAbsX != null && cmax <= R.N_defectMedialAbsX;
  }

  R.floors = F;
  return R;
};

/* TERMINAL ENDS, MEASURED. Two questions per tube end, and the answers decide which end gets a dome:
   (1) is it BURIED — a hemisphere of rays from the terminal centre against every OTHER key; a buried
   end needs no dome and a dome there would only protrude through what is hiding it; (2) does the
   mid-air end actually CARRY one — the mesh's own extent beyond the last centreline point along the
   terminal direction, which is ~0 for sweptShell's flat annulus and ~r*bulge for domeCap. Both read
   off MOD.TERMINALS, so neither this probe nor the model keeps a second copy of the path. */
window.terminalProbe = function () {
  const out = [];
  for (const T0 of (MOD.TERMINALS || [])) {
    const g = MOD.build(1, Object.assign({ amnion:false, yolksac:false, coelom:false }, T0.opts));
    g.updateMatrixWorld(true);
    const others = [], mine = [];
    g.traverse(function (o) { if (!o.isMesh || !o.geometry || (o.userData&&o.userData.outline)) return;
      ((o.userData||{}).key === T0.key ? mine : others).push(o); });
    const P = T0.path();
    const rc = new THREE.Raycaster(); rc.near = 0.001; rc.far = 12;
    const v = new THREE.Vector3();
    for (const end of ['start','end']) {
      const i = end === 'start' ? 0 : P.length - 1;
      const iN = end === 'start' ? 1 : P.length - 2;
      const pt = P[i].clone();
      const d = new THREE.Vector3().subVectors(P[i], P[iN]).normalize();
      let hit = 0, n = 0;
      const basis = new THREE.Vector3(1,0,0); if (Math.abs(d.x) > 0.9) basis.set(0,1,0);
      const u1 = new THREE.Vector3().crossVectors(d, basis).normalize();
      const u2 = new THREE.Vector3().crossVectors(d, u1).normalize();
      for (let a=0;a<24;a++) for (let b=0;b<6;b++) {
        const th=a/24*Math.PI*2, ph=(b/6)*(Math.PI/2)*0.9;
        const dir = new THREE.Vector3().copy(d).multiplyScalar(Math.cos(ph))
          .addScaledVector(u1, Math.sin(ph)*Math.cos(th)).addScaledVector(u2, Math.sin(ph)*Math.sin(th)).normalize();
        rc.set(pt, dir); n++; if (rc.intersectObjects(others, false).length) hit++;
      }
      /* HOW FAR THE MESH REACHES PAST THE TERMINAL RING PLANE, along d — ~0 for sweptShell's flat
         annulus, ~r*bulge for domeCap. ONLY THE VERTICES AT THIS END COUNT: measured over the whole
         mesh it came back at 6.45 r on the herniation loop, because the loop spirals round and its far
         side projects further along d than any cap could. A probe that answers 6.45 to a question
         whose answer is between 0 and 1 is measuring something else. */
      let proj = -1e9, near = 0;
      for (const o of mine) { const pa = o.geometry.attributes.position;
        for (let k=0;k<pa.count;k++){ v.fromBufferAttribute(pa,k).applyMatrix4(o.matrixWorld);
          if (v.distanceTo(pt) > 2.2 * T0.r) continue;
          near++; proj = Math.max(proj, v.sub(pt).dot(d)); } }
      if (!near) proj = 0;
      out.push({ key: T0.key + (T0.variant ? '/' + T0.variant : ''), end: end, buried: hit/n, rays: n, beyondRing: proj, r: T0.r, nearVerts: near,
                 capped: T0.capped === 'both' || T0.capped === end,
                 domeFrac: proj / T0.r });
    }
  }
  return out;
};

/* IS THE DEFECT LEGIBLE IN THE VIEW THAT TEACHES IT? RENDER-STANDARD's own prescribed method, the one
   that found the buried median-plane reference on cardiac-looping: render with and without, difference
   the frames, count. Here it is run twice over, because two different questions hide inside one
   picture — (a) with the lesion bowel taken out of the way, how many pixels of the frame does the
   FULL-THICKNESS WINDOW itself account for, against the intact wall; and (b) with the bowel back where
   the beat draws it, how many of those pixels a student can still see.
   THE CAMERA IS FITTED ONCE, to the defect build, and NOT refitted for the intact one. A refit between
   the two frames would move every pixel and the difference would measure the camera. */
window.legibility = function (cfg) {
  const cv = document.createElement('canvas'); cv.width = ${W}; cv.height = ${H};
  const ctx = cv.getContext('2d', { willReadFrequently: true });
  const snap = () => { renderer.render(scene, camera); ctx.drawImage(renderer.domElement, 0, 0);
                       return ctx.getImageData(0,0,cv.width,cv.height).data; };
  /* COMPOSE, because a beat is not one build. Each structure in a scene resolves through the adapter
     as its OWN build of this model - 'lateral-folding#ectoderm+gastroschisis' and
     'lateral-folding#somatic' are two groups, and the player draws them together. So a parts list of
     {opts, keys} is assembled into one THREE.Group, exactly the set of meshes the beat puts on screen.
     Built as one group per part rather than one build, this probe can see a beat drawing a HOLE in one
     layer and an INTACT sheet of another layer behind it, which is a defect no single-build render and
     no visibility walk can show. */
  const compose = (parts, drop) => {
    const root = new THREE.Group();
    for (const part of parts) {
      const g = MOD.build(cfg.t, part.opts);
      g.traverse(function (o) { if (!o.isMesh) return; const k = (o.userData||{}).key;
        if (!k || part.keys.indexOf(k) < 0) o.visible = false;
        if (drop && drop.indexOf(k) >= 0) o.visible = false; });
      root.add(g);
    }
    root.rotation.y = cfg.yaw || 0; root.rotation.x = cfg.pitch || 0;
    root.updateMatrixWorld(true);
    return root;
  };
  const put = g => { if (group) scene.remove(group); group = g; scene.add(g); };
  const drop = cfg.lesion ? [cfg.lesion] : null;
  /* A. the beat's own composition with the lesion bowel out of the way. The camera is fitted HERE and
        NOT refitted afterwards: a refit between two frames moves every pixel and the difference then
        measures the camera rather than the wall. */
  put(compose(cfg.defect, drop));
  const f = VizKit.fitCamera(camera, group, 1.04);
  camera.position.set(f.centre.x, f.centre.y, f.centre.z + f.distance);
  camera.lookAt(f.centre);
  L.key.position.set(camera.position.x + 6, camera.position.y + 8, camera.position.z + 4);
  const A = snap();
  // B. the same composition with no defect at all
  put(compose(cfg.plain, drop));
  const B = snap();
  // C. the beat as it is actually drawn, lesion included
  put(compose(cfg.defect, null));
  const C = snap();

  const bgR = 0x0e, bgG = 0x16, bgB = 0x26, TH = 12;
  let footprint = 0, stillVisible = 0, subject = 0;
  const mask = new Uint8Array(A.length / 4);
  for (let i = 0, k = 0; i < A.length; i += 4, k++) {
    if (Math.abs(B[i]-bgR) + Math.abs(B[i+1]-bgG) + Math.abs(B[i+2]-bgB) > 18) subject++;
    const d1 = Math.max(Math.abs(A[i]-B[i]), Math.abs(A[i+1]-B[i+1]), Math.abs(A[i+2]-B[i+2]));
    if (d1 > TH) { footprint++; mask[k] = 1; }
  }
  /* AND THE SECOND NUMBER IS AGAINST A, NOT AGAINST B. Written against B first, and it reported 100%
     surviving on every configuration — of course it did: a footprint pixel differs from the intact wall
     whether the window is showing through it or the bowel is painted over it. The question is whether
     the WINDOW is still what is on screen there, so the comparison is against the frame that had the
     window and no bowel. */
  for (let i = 0, k = 0; i < C.length; i += 4, k++) {
    if (!mask[k]) continue;
    const d2 = Math.max(Math.abs(C[i]-A[i]), Math.abs(C[i+1]-A[i+1]), Math.abs(C[i+2]-A[i+2]));
    if (d2 <= TH) stillVisible++;
  }

  /* IS THE WINDOW FULL THICKNESS, OR IS THE NEXT LAYER OF WALL SITTING IN IT? MEASURED AS DEPTH, and
     the first attempt at this was a pixel diff — take the wall's inner layer away and see whether the
     window's pixels change — which reported 81% "plugged" on a window that is demonstrably open through
     both layers. Of course it did: through an open window you can see the FAR side of the same inner
     layer, so removing it changes the window's pixels whether or not it was in the way. Depth cannot be
     fooled that way. A ray is cast through each window pixel into the defect composition and into the
     intact one; if the first surface it meets is at the same depth as the intact wall, the student is
     still looking at wall there, and if it is deeper (or there is nothing) the window is open. */
  let probed = 0, atWallDepth = 0;
  const firstKeys = {};
  if (mask.length) {
    const rc = new THREE.Raycaster();
    const tgt = g => { const a = []; g.traverse(function (o) {
        if (o.isMesh && o.visible && o.geometry && !(o.userData||{}).outline) a.push(o); }); return a; };
    const gD = compose(cfg.defect, drop), gP = compose(cfg.plain, drop);
    const tD = tgt(gD), tP = tgt(gP);
    const step = Math.max(1, Math.floor(Math.sqrt(footprint / 1500)));
    const ndc = new THREE.Vector2();
    for (let py = 0; py < cv.height; py += step) for (let px = 0; px < cv.width; px += step) {
      if (!mask[py * cv.width + px]) continue;
      ndc.set((px + 0.5) / cv.width * 2 - 1, 1 - (py + 0.5) / cv.height * 2);
      rc.setFromCamera(ndc, camera);
      const hP = rc.intersectObjects(tP, false)[0];
      const hD = rc.intersectObjects(tD, false)[0];
      if (!hP) continue;
      probed++;
      const k = hD && hD.object.userData ? hD.object.userData.key : 'nothing';
      firstKeys[k] = (firstKeys[k] || 0) + 1;
      if (hD && Math.abs(hD.distance - hP.distance) < 0.20) atWallDepth++;
    }
  }
  return { footprint: footprint, stillVisible: stillVisible, subject: subject,
           footprintOfSubject: subject ? footprint/subject : 0,
           survivingFraction: footprint ? stillVisible/footprint : 0,
           probed: probed, atWallDepth: atWallDepth, firstKeys: firstKeys,
           pluggedFraction: probed ? atWallDepth / probed : null,
           stillVisibleOfSubject: subject ? stillVisible/subject : 0 };
};
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
    ['J-closed', v => v <= F.CLOSE, F.CLOSE * 6],
    ['K', v => v >= F.PLATE, -0.05],
    ['L', v => v <= F.RINGY, F.RINGY * 5],
    ['C-tangent', v => v <= F.CREASE, F.CREASE * 8],
    /* the membrane and the cord, round 2. Each floor gets a value on the WRONG side of it. M and N
       are both two-sided — one claim measured on two builds with opposite floors — so each gets both
       halves fed a wrong number, because a discriminator that only rejects one of its two answers
       would pass a model in which the sac covered everything or nothing. */
    ['M',        v => v >= F.SAC,   F.SAC * 0.5],
    ['M-bare',   v => v <= F.BARE,  F.BARE * 4],
    ['M-solid',  v => v >= F.SACOUT, -0.20],
    ['M-inside', v => v <= F.SACIN,  0.30],
    ['N',        v => v >= F.CORDON, F.CORDON * 0.3],
    ['N-at',     v => v <= F.CORDAT, F.CORDAT * 6],
    ['N-medial', v => v <= 1.00,     1.40],
    /* O is the row whose second half IS the finding — that the anterior camera cannot show the
       insertion — so both halves get a wrong value, and so does the gap that makes two collinear
       cords read as two. */
    ['O',        v => v >= F.CORDSEE, F.CORDSEE * 0.2],
    ['O-front',  v => v <= F.CORDEND, 0.95],
    ['O-two',    v => v >= F.CORDGAP, F.CORDGAP * 0.2],
    /* M-seen, round 5. Both halves again: the membrane must be the nearest surface over nearly all of
       the covered loop, and over only a sliver of the bare one. */
    ['M-seen',      v => v >= F.SACSEEN,  F.SACSEEN * 0.5],
    ['M-seen-bare', v => v <= F.BARESEEN, F.BARESEEN * 4],
    /* K, P and P-gut, round 6. The aperture field: the plate must be nearly all of what is seen
       through the hole, bowel must be almost none of it, and the plate must be seen THROUGH the
       hole rather than lying across the wall. Three floors, three wrong numbers. */
    ['P',      v => v >= F.FIELD,    F.FIELD * 0.6],
    ['P-gut',  v => v <= F.FIELDGUT, F.FIELDGUT * 20],
    /* R, round 6's proposed row: the radial order of the two mesoderm layers. */
    ['R',      v => v >= F.RADIAL,   F.RADIAL * 0.2],
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

/* ------------------------------------------------------------------ 8. PERTURBATION

   RENDER-STANDARD section 3, AN ACCEPTANCE MEASUREMENT MUST BE A FUNCTION OF THE BUILT GEOMETRY:
   "the check is a PERTURBATION — change the constant the geometry uses and the reported number must
   move." So for every row in the battery, one named constant that row's claim genuinely depends on is
   substituted in a COPY of the model source, the model is re-evaluated in a fresh vm context, and the
   row's number is required to move.

   PICKING THE LEVER IS THE WORK, and getting it wrong looks exactly like a failing test. Three tries
   were wrong before these settled, and each was informative rather than annoying:
     - J-closed did not move when R_EXST was widened. Correct: J-closed measures the gap in the BRIDGE,
       where both windows are zero, so a wider slot cannot reach it. BRIDGE_F is the lever.
     - I did not move when the gastroschisis window's LATERAL bound moved. Also correct, and it exposed
       something else: the two bounds had been named the wrong way round, in a test about which edge is
       nearer the cord. V_GAST_NEAR is the lever.
     - C-tangent cannot be moved by any geometric constant at all, because closure plus conserved arc
       length plus uniform curvature IS a circle, and a circle meets itself tangentially. The lever is
       the solved amplitude A_O: hold it at 0.90 instead of the solved 0 and the crease appears, while
       B — "the edges meet" — still passes at 5e-17. That is the whole argument for having C-tangent.
   A lever that turns out not to move a row is therefore a claim about the model to be explained, not a
   number to be forced. Each row below carries why this lever and not another. */
const PERTURBATIONS = [
  { id: 'A', why: 'arc length is conserved: stretch the integration step and it is not',
    from: 'const ds = S / n;', to: 'const ds = 1.14 * S / n;' },
  { id: 'B', why: 'the edges meet: open the ring window over the whole block and they do not',
    from: 'const YW_UMB   = 0.44;', to: 'const YW_UMB   = 2.40;' },
  { id: 'C-tangent', why: 'they meet tangentially BECAUSE a* solved to 0; hold a* off 0 and a crease appears',
    from: 'const A_O = CLOSE_O.a', to: 'const A_O = 0.90 + 0 * CLOSE_O.a' },
  { id: 'D', why: 'the ring is big enough for the midgut: shrink the residual gap',
    from: 'const R_RING   = 0.30;', to: 'const R_RING   = 0.12;' },
  { id: 'E', why: 'the cavity is sealed: leave the wall open everywhere and rays escape',
    from: 'const YW_UMB   = 0.44;', to: 'const YW_UMB   = 2.40;' },
  { id: 'F', why: 'the gut hangs clear inside the wall: change the gut arc and the clearance moves',
    from: 'const SG   = 0.95;', to: 'const SG   = 0.60;' },
  { id: 'G', why: 'the duct narrows: change the residual gut gap inside the duct window',
    from: 'const R_DUCT   = 0.085;', to: 'const R_DUCT   = 0.030;' },
  { id: 'H', why: 'the membrane tapers: weaken the taper the grid is built with',
    from: 'const TAPER = 0.92;', to: 'const TAPER = 0.20;' },
  { id: 'I', why: 'the defect is clear of the cord: move the bound NEAREST the cord',
    from: 'const V_GAST_NEAR = -0.90;', to: 'const V_GAST_NEAR = -0.99;' },
  { id: 'J', why: 'two holes, not one slot: collapse the derived bridge between them',
    from: 'const BRIDGE_F = 0.45;', to: 'const BRIDGE_F = 0.10;' },
  { id: 'J-closed', why: 'the bridge is shut: squeeze it until the two openings merge',
    from: 'const BRIDGE_F = 0.45;', to: 'const BRIDGE_F = 0.02;' },
  /* K's old lever is GONE with the geometry it pulled. It read
       from: 'const hy = YW_EXST - SOFT_EXST;'  to: 'const hy = YW_EXST + 0.20;'
     - the ellipsoid plate's prescribed half-height, made taller than the opening. The plate has no
     prescribed half-height any more (it follows the wall's own aperture), so that text no longer
     exists and the battery reported K as CONSTANT-VALUED on a missing lever rather than on a
     constant measure. The replacement is further down this list and pulls DEPTH instead, which is
     the half the row now measures. Left here as a note because a lever that silently stops matching
     is the same fault class as a measure that silently stops reading geometry. */
  /* L's lever is a BEHAVIOUR and not a constant, deliberately: it puts back the exact line whose
     absence made one tube ring two holes, and requires L to catch it. This is the only row here whose
     defect was found by looking at a render rather than by a number, so it is the row most worth
     proving can fail. */
  { id: 'L', why: 'one ring per hole: take the run-splitting away and the tube bridges both openings',
    from: 'js.length = 0; if (pick) for (const j of pick) js.push(j);', to: 'void pick;' },
  /* ROUND 2's rows. The same discipline: change a constant the GEOMETRY uses, and the number the
     acceptance row reports must move. M and N are both read as their omphalocele half, which is the
     value acceptance() publishes under the bare id. */
  { id: 'M', why: 'the membrane covers the loop: deflate its stand-off until it does not',
    from: 'const SAC_CLEAR = 0.20;', to: 'const SAC_CLEAR = -0.34;' },
  { id: 'M-solid', why: 'the bare loop is outside the sac: inflate the sac until it swallows it',
    from: 'const SAC_CLEAR = 0.20;', to: 'const SAC_CLEAR = 1.10;' },
  { id: 'N', why: 'the cord inserts on the sac: sink it so far in that it reaches the ring instead',
    from: 'const CORD_SINK  = 0.06;', to: 'const CORD_SINK  = 1.30;' },
  { id: 'N-medial', why: 'the cord is medial to the window: fatten it until it reaches across',
    from: 'const CORD_R_F   = 0.72;', to: 'const CORD_R_F   = 2.60;' },
  /* O's lever is GEOMETRIC and not a rewrite of the measure: swap the two components of the
     aperture's outward direction so the cord leaves the body sideways instead of ventrally. Then the
     lateral camera is the one looking down it, and the number collapses. */
  { id: 'O', why: 'a lateral camera keeps the cord\'s length: make the cord leave sideways instead',
    from: 'let ox = ax - cx, oz = az - cz;', to: 'let ox = az - cz, oz = ax - cx;' },
  { id: 'O-two', why: 'the two cords read as two: lengthen the stub until it closes the gap',
    from: 'const CORD_LEN_F = 3.2;', to: 'const CORD_LEN_F = 7.4;' },
  /* M-seen's lever is THE SHOWN LIST, and that is the whole point of it. Round 4's defect was a
     measure blind to what else the beat drew, so the perturbation that must move it is putting the
     occluder back: add omphalocele_cord to beat 6's list and the number has to fall. A measure that
     only looked at the loop and the sac would not budge, and would be caught here. */
  { id: 'M-seen', why: 'the measure sees the whole beat: put the cord back in beat 6\'s shown list and the coverage must fall',
    from: "'omphalocele_gut', 'omphalocele_sac', 'gastroschisis_bowel'] },",
    to:   "'omphalocele_gut', 'omphalocele_sac', 'gastroschisis_bowel', 'omphalocele_cord'] }," },
  /* and a GEOMETRIC lever on the same row, so it is not only the bookkeeping that is tested:
     deflate the membrane until it no longer stands in front of the loop it covers. */
  { id: 'M-seen', why: 'the membrane is what is in front: deflate it until it is not',
    from: 'const SAC_CLEAR = 0.20;', to: 'const SAC_CLEAR = -0.34;' },
  { id: 'M-seen_bare', why: '...and the bare loop is NOT fronted by it: inflate the membrane until it is',
    from: 'const SAC_CLEAR = 0.20;', to: 'const SAC_CLEAR = 1.10;' },
  /* ---- round 6, the aperture field. The lever for P and P-gut is the plate's ONE prescribed
     number, the overlap it reaches under the wall's lip with: drive it negative and the plate no
     longer reaches the lips, which is the geometry the old ellipsoid had (its half-width was
     R_EXST - 0.075, i.e. exactly PLATE_LAP = -0.075). At -0.20 the field reads plate 0.499 / gut
     0.388, which is the defect round 6 measured at 0.591 / 0.409 - so these rows do not merely
     move, they move to the defect. K's lever is DEPTH rather than size, because that is the half
     the old y-clearance row could not see: push the plate 0.30 proud of the wall it follows and
     its visible footprint stops being inside the hole. */
  { id: 'P', why: 'the plate must FILL the aperture: shrink it off the lips and the field stops being plate',
    from: 'const PLATE_LAP = OFF.ectoderm.h;', to: 'const PLATE_LAP = -0.20;' },
  { id: 'P-gut', why: '...and the same shrink must put BOWEL in the field, which is the wrong diagnosis',
    from: 'const PLATE_LAP = OFF.ectoderm.h;', to: 'const PLATE_LAP = -0.20;' },
  { id: 'K', why: 'the plate is seen THROUGH the hole: stand it 0.30 proud of the wall and it is seen ON it',
    from: 'pts.push(new T.Vector3(0, AP.y[j], AP.zc[j]));',
    to:   'pts.push(new T.Vector3(0, AP.y[j], AP.zc[j] + 0.30));' },
  { id: 'S', why: 'the mesentery is a SHEET with a dorso-ventral span: collapse that span to 0.02 ' +
         'and its share of beat 11\'s frame must collapse with it \u2014 note that H (its thickness ' +
         'at the wall, measured in x) does NOT move under this lever, which is exactly why S exists',
    from: 'const zTop = 0.195, zBot = z0G - (OFF.splanchnic.c + OFF.splanchnic.h / 2) - 0.004;',
    to:   'const zTop = 0.195, zBot = 0.215;' },
  { id: 'S-vis', why: 'and put something in front of it: CLOSE the cutaway this beat opens and the ' +
         'near body wall covers the sheet, so the unoccluded fraction must fall \u2014 measured ' +
         '1.0000 -> 0.0000 with ectoderm_open in front of 100% of it',
    from: 'return v > 0.30 && v < 1.0;', to: 'return v > 0.99 && v < 1.0;' },
  { id: 'R', why: 'somatic is OUTSIDE splanchnic: push the splanchnic sheet out past it and the ' +
         'separation must move \u2014 which is the swap no row and no claim could see before this one',
    from: 'splanchnic: { c:  0.058, h: 0.080 },', to: 'splanchnic: { c:  1.400, h: 0.080 },' },
];
const requireCjs = createRequire(import.meta.url);
const THREE_NODE = requireCjs(path.join(ROOT, 'node_modules/three/build/three.js'));
const KIT_SRC = readFileSync(path.join(ROOT, 'models3d/render-kit.js'), 'utf8');
const MODEL_SRC = readFileSync(path.join(ROOT, 'models3d/lateral-folding.js'), 'utf8');
function measuredWith(pairs) {
  const ctx = { THREE: THREE_NODE, console: { log(){}, warn(){}, error(){} },
                document: { createElement: () => ({ getContext: () => null, style: {} }) } };
  ctx.window = ctx; vm.createContext(ctx);
  vm.runInContext(KIT_SRC, ctx);
  let src = MODEL_SRC;
  for (const [from, to] of pairs) {
    const n = src.split(from).length - 1;
    if (n !== 1) throw new Error(`lever text appears ${n} times, must be exactly 1: ${from}`);
    src = src.split(from).join(to);
  }
  vm.runInContext(src, ctx);
  return ctx.MB3D_MODELS['lateral-folding'].acceptance().measured;
}
const perturbBase = measuredWith([]);
const perturbRows = [];
for (const P0 of PERTURBATIONS) {
  let after = null, err = null;
  try { after = measuredWith([[P0.from, P0.to]])[P0.id]; } catch (e) { err = String(e.message || e); }
  const before = perturbBase[P0.id];
  const moved = err ? false : Math.abs(after - before) > 1e-6 * Math.max(1e-3, Math.abs(before));
  perturbRows.push(Object.assign({ before, after, moved, err }, P0));
}
const perturbPass = perturbRows.every(r => r.moved);
console.log('perturbation     : ' + perturbRows.filter(r => r.moved).length + '/' + perturbRows.length +
  ' measurements move when the geometry\'s own constant moves' +
  (perturbPass ? '' : '   *** CONSTANT-VALUED: ' + perturbRows.filter(r => !r.moved).map(r => r.id).join(', ') + ' ***'));
for (const r of perturbRows) console.log('  ' + r.id.padEnd(10) + (r.to + '  ').padEnd(40) +
  fmtP(r.before) + ' -> ' + (r.err ? 'ERROR ' + r.err : fmtP(r.after)) + '  ' + (r.moved ? 'moved' : '*** DID NOT MOVE ***') +
  '\n      ' + r.why);
function fmtP(v) { return typeof v !== 'number' ? String(v) : (Math.abs(v) < 1e-4 && v !== 0 ? v.toExponential(3) : v.toFixed(5)); }

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
report.terminals = await p.evaluate('window.terminalProbe()');

/* THE LEGIBILITY DIFF, RUN OVER THE BEAT'S OWN COMPOSITION.

   Each entry is the set of structures the scene's beat actually shows, resolved the way the adapter
   resolves them: one build of the model per structure, with the variant flag its ref carries. The two
   rows labelled AS THE SCENE DREW IT are beat 6 and beat 7 exactly as they stood on disk when this run
   started — `gastroschisis_wall` is `ectoderm+gastroschisis`, so the ectoderm has the window, but the
   beat then also shows plain `somatic`, which is a DIFFERENT build with no window in it. The two rows
   labelled FIXED are the same beats with the somatopleure's other layer taken from the same build as
   its ectoderm. The pair is the evidence for the scene change this run makes; measured rather than
   argued, because "the bowel reads as a free red mass lying on an intact wall" is a statement about
   pixels and deserved to be answered in pixels.

   The camera is the ventral one for both, because that is what beat 6's and beat 7's
   ROTATE_TO_VIEW anterior resolves to, and the harness's own oblique is reported alongside. */
const W_G = { gastroschisis: true, amnion: false, yolksac: false, coelom: false };
const W_E = { exstrophy: true, amnion: false, yolksac: false, coelom: false };
const W_P = { amnion: false, yolksac: false, coelom: false };
const LEGIB = [
  { name: 'gastro b6 ventral AS DREW', gate: false, t: 1, yaw: 0, pitch: 0, lesion: 'gastroschisis',
    defect: [ { opts: W_G, keys: ['ectoderm', 'gastroschisis'] }, { opts: W_P, keys: ['somatic', 'umbilicalring'] } ],
    plain:  [ { opts: W_P, keys: ['ectoderm'] },                  { opts: W_P, keys: ['somatic', 'umbilicalring'] } ] },
  { name: 'gastro b6 ventral FIXED', gate: true, gatePlugged: true, t: 1, yaw: 0, pitch: 0, lesion: 'gastroschisis',
    defect: [ { opts: W_G, keys: ['ectoderm', 'somatic', 'gastroschisis'] }, { opts: W_P, keys: ['umbilicalring'] } ],
    plain:  [ { opts: W_P, keys: ['ectoderm', 'somatic', 'umbilicalring'] } ] },
  /* beat 7, NEW this run: the same wall with the bowel set aside. This is the view that carries "a
     student can see it IS a hole", so it is the one gated on survives; beat 6 is gated on the defect
     existing and being full thickness, and NOT on surviving the bowel, because a loop of bowel that has
     come through a hole covers the hole in a newborn too. That distinction is an argument, so it is
     written down here and in the scene's gaps[] rather than bought by lowering a number.

     `anterior`, not `medial`. Measured both: `medial` gives the defect 1.41% of the lit subject against
     1.36% from the front, so on the defect alone it is a wash — and the player's visibility walk then
     failed the beat, because beat 7 POINTS at the umbilical ring and from the embryo's right the ring
     is edge-on behind the wall at 0%. The bridge between ring and defect is the beat's whole claim, and
     it is a claim about the FRONT of the embryo. */
  { name: 'gastro b7 anterior NOBOWEL', gate: true, gateSurvive: true, t: 1, yaw: 0, pitch: 0,
    defect: [ { opts: W_G, keys: ['ectoderm', 'somatic'] }, { opts: W_P, keys: ['umbilicalring'] } ],
    plain:  [ { opts: W_P, keys: ['ectoderm', 'somatic', 'umbilicalring'] } ] },
  { name: 'exstrophy b8 ventral AS DREW', gate: false, t: 1, yaw: 0, pitch: 0, lesion: 'exstrophy',
    defect: [ { opts: W_E, keys: ['ectoderm', 'exstrophy'] }, { opts: W_P, keys: ['somatic', 'umbilicalring'] } ],
    plain:  [ { opts: W_P, keys: ['ectoderm'] },              { opts: W_P, keys: ['somatic', 'umbilicalring'] } ] },
  { name: 'exstrophy b8 ventral FIXED', gate: true, t: 1, yaw: 0, pitch: 0, lesion: 'exstrophy',
    defect: [ { opts: W_E, keys: ['ectoderm', 'somatic', 'exstrophy'] }, { opts: W_P, keys: ['umbilicalring'] } ],
    plain:  [ { opts: W_P, keys: ['ectoderm', 'somatic', 'umbilicalring'] } ] },
];
report.legibility = [];
for (const cfg of LEGIB) {
  const r = await p.evaluate(c => window.legibility(c), cfg);
  await p.locator('#c').screenshot({ path: `${OUT}/legib-${cfg.name.replace(/[^a-z0-9]+/gi, '-')}.png` });
  report.legibility.push(Object.assign({ name: cfg.name, gate: cfg.gate, gateSurvive: !!cfg.gateSurvive, gatePlugged: !!cfg.gatePlugged }, r));
}

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
row('H', MC.H, '<=', F.MESO, '   (mesentery x extent ' + (MC.H_wall != null ? MC.H_wall.toFixed(4) : '?') +
  ' at the wall, ' + (MC.H_gut != null ? MC.H_gut.toFixed(4) : '?') + ' at the gut)');
row('J', MC.J, '>=', F.EXSTR, '   (' + MC.J_bandCount + ' open bands ' + JSON.stringify(MC.J_openBands) +
  ', intact bridge ' + (MC.J_bridge != null ? MC.J_bridge.toFixed(3) : '?') + ' over ' + MC.J_bridgeStations + ' stations)');
row('J-closed', MC['J-closed'], '<=', F.CLOSE, '   (worst gap in the bridge, over wall width ' + MC.J_wallWidth.toFixed(3) + ')');
row('L', MC.L, '<=', F.RINGY, '   (ring y ' + JSON.stringify(MC.L_ringY) +
  ' inside the cranial opening ' + JSON.stringify(MC.L_cranialBand) + ')');
row('K', MC.K, '>=', F.PLATE, '   (of ' + MC.K_plateSeen + ' raycast cells where the plate is the ' +
  'nearest surface, the fraction inside the hole. Plate y ' +
  JSON.stringify(MC.exstrophyY ? [+MC.exstrophyY.min.toFixed(3), +MC.exstrophyY.max.toFixed(3)] : null) +
  ', caudal opening ' + JSON.stringify(MC.K_caudalBand) +
  '; the REPLACED row K, a y-clearance, would read ' +
  (MC.K_clearance_was != null ? MC.K_clearance_was.toFixed(4) : '?') + ' \u2014 see ACCEPTANCE K)');
row('P', MC.P, '>=', F.FIELD, '   (of ' + MC.P_rays + ' rays through the aperture, the fraction whose ' +
  'first hit is the bladder plate. Decomposed: ' + JSON.stringify(MC.P_byKey_mesh) +
  (MC.P_missing_mesh && MC.P_missing_mesh.length ? '   NO GEOMETRY: ' + MC.P_missing_mesh.join(',') : '') + ')');
row('P-gut', MC['P-gut'], '<=', F.FIELDGUT, '   (...and the fraction whose first hit is BOWEL. ' +
  'Bowel in the same open field is cloacal exstrophy, which beat 8 names as the severe form)');
row('M', MC.M, '>=', F.SAC, '   (the omphalocele loop under the sac, projected on the ANTERIOR screen plane;' +
  ' the BARE loop ' + (MC.M_gastroschisis != null ? (MC.M_gastroschisis * 100).toFixed(1) : '?') + '% <= ' +
  (F.BARE * 100).toFixed(0) + '% ' + (MC.M_gastroschisis != null && MC.M_gastroschisis <= F.BARE ? 'pass' : 'FAIL') + ')');
row('M-solid', MC['M-solid'], '>=', F.SACOUT, '   (the bare loop is wholly OUTSIDE the membrane; the coil is' +
  ' inside at ' + (MC.M_coilInside != null ? MC.M_coilInside.toFixed(4) : '?') + ' <= ' + F.SACIN.toFixed(3) + ' ' +
  (MC.M_coilInside != null && MC.M_coilInside <= F.SACIN ? 'pass' : 'FAIL') + ', over ' + MC.M_coilVertices + ' coil vertices)');
row('N', MC.N, '>=', F.CORDON, '   (the omphalocele cord out on the membrane; the GASTROSCHISIS cord at the ring, ' +
  (MC.N_gastroschisis != null ? MC.N_gastroschisis.toFixed(4) : '?') + ' <= ' + F.CORDAT.toFixed(3) + ' ' +
  (MC.N_gastroschisis != null && MC.N_gastroschisis <= F.CORDAT ? 'pass' : 'FAIL') + ')');
row('O', MC.O, '>=', F.CORDSEE, '   (of its own length that `lateral` keeps; `anterior` keeps ' +
  (MC.O_anterior != null ? MC.O_anterior.toFixed(4) : '?') + ' <= ' + F.CORDEND.toFixed(3) + ' ' +
  (MC.O_anterior != null && MC.O_anterior <= F.CORDEND ? 'pass — which is WHY beat 9 exists' : 'FAIL') + ')');
row('O-two', MC['O-two'], '>=', F.CORDGAP, '   (clear gap between the two collinear cords, in cord diameters)');
console.log('  N-medial mesh ' + (MC['N-medial'] == null ? ' n/a ' : MC['N-medial'].toFixed(4)) +
  '  <= defect medial |x| ' + (MC.N_defectMedialAbsX == null ? ' n/a ' : MC.N_defectMedialAbsX.toFixed(4)) +
  '  ' + (MC.N_medialOk ? 'pass' : 'FAIL') + '   (the whole cord between the midline and the window)');

const meshRows = [
  ['D', MC.D, '>=', F.RING], ['F', MC.F, '>=', F.CLEAR], ['I', MC.I, '>=', F.GASTRO],
  ['H', MC.H, '<=', F.MESO], ['J', MC.J, '>=', F.EXSTR], ['J-closed', MC['J-closed'], '<=', F.CLOSE],
  ['K', MC.K, '>=', F.PLATE], ['L', MC.L, '<=', F.RINGY],
  ['M', MC.M, '>=', F.SAC], ['M-bare', MC.M_gastroschisis, '<=', F.BARE],
  ['M-solid', MC['M-solid'], '>=', F.SACOUT], ['M-inside', MC.M_coilInside, '<=', F.SACIN],
  ['N', MC.N, '>=', F.CORDON], ['N-at', MC.N_gastroschisis, '<=', F.CORDAT],
  ['O', MC.O, '>=', F.CORDSEE], ['O-sac', MC.O_lateral_sac, '>=', F.CORDSEE],
  ['O-front', MC.O_anterior, '<=', F.CORDEND], ['O-two', MC['O-two'], '>=', F.CORDGAP],
];
const meshBad = meshRows.filter(([, v, c, l]) => v == null || !(c === '>=' ? v >= l : v <= l));
const meshPass = meshBad.length === 0 && MC.I_rightOfCord === true && MC.J_bandCount === 2 &&
                 MC.J_caudalBelowCranial === true && MC.N_medialOk === true;
if (meshBad.length) console.log('  *** MESH ROWS FAILED: ' + meshBad.map(r => r[0]).join(', '));
console.log('  gap by station  :', JSON.stringify(MC.J_gapsByStation));

/* TERMINAL ENDS. A buried end needs no dome; a mid-air end needs one and must be shown to have it. */
let termPass = true;
for (const t0 of report.terminals) {
  const midAir = t0.buried < 0.60;
  const hasDome = t0.domeFrac >= 0.50;
  const want = midAir;
  const okT = want ? hasDome : true;
  if (t0.capped !== want) { termPass = false; }
  if (!okT) termPass = false;
  console.log('terminal ' + (t0.key + ' ' + t0.end).padEnd(26) +
    'hemisphere blocked ' + (t0.buried * 100).toFixed(1) + '%  ' + (midAir ? 'MID-AIR' : 'buried ') +
    '   reaches ' + t0.beyondRing.toFixed(4) + ' past the ring = ' + t0.domeFrac.toFixed(2) + ' r' +
    '   capped=' + t0.capped + (okT && t0.capped === want ? '' : '   *** ' + (t0.capped !== want ? 'CAP DECISION WRONG' : 'NO DOME ON A MID-AIR END') + ' ***'));
}

/* LEGIBILITY. A hole that measures right and cannot be seen has not taught anybody anything. */
const LEGIB_FOOTPRINT = 0.008;   // the defect, lesion out of the way, as a fraction of the lit subject
const LEGIB_SURVIVE   = 0.150;   // how much of it survives the lesion the beat actually draws over it
const LEGIB_PLUGGED   = 0.250;   // how much of it is filled by the wall's OWN inner layer
let legibPass = true;
for (const l of report.legibility) {
  const okF = l.footprintOfSubject >= LEGIB_FOOTPRINT;
  const okS = !l.gateSurvive || l.survivingFraction >= LEGIB_SURVIVE;
  const okP = !l.gatePlugged || l.pluggedFraction == null || l.pluggedFraction <= LEGIB_PLUGGED;
  if (l.gate && (!okF || !okS || !okP)) legibPass = false;
  const why = [!okF && 'DEFECT TOO SMALL TO READ', !okS && 'OCCLUDED BY THE LESION',
               !okP && 'NOT FULL THICKNESS: THE INNER LAYER FILLS IT'].filter(Boolean).join(' + ');
  console.log('legible ' + l.name.padEnd(30) + 'defect ' + (l.footprintOfSubject * 100).toFixed(2) + '% of subject' +
    ' (' + l.footprint + ' px)   survives ' + (l.survivingFraction * 100).toFixed(1) + '%' +
    '   plugged ' + (l.pluggedFraction == null ? ' n/a ' : (l.pluggedFraction * 100).toFixed(1) + '%') +
    (!l.gate ? '   [baseline, not gated]' : (why ? '   *** ' + why + ' ***' : '')));
}

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

/* ------------------------------------------------------------- 11. THE AXES, PROVED NOT DECLARED

   RENDER-STANDARD section 3, "A DECLARED AXIS IS NOT A PROVED ONE, AND A SYMMETRIC MODEL CANNOT PROVE
   ITS OWN", route (b). This model is mirror-symmetric apart from its lesions, so it cannot witness its
   own handedness and row I — the defect is at x < 0 — restates the declaration rather than checking
   it. prove-corpus-axes.mjs measures the convention off BodyParts3D right/left pairs, which is scan
   data and not another comment, and checks this model's AXES against it. It is run HERE, as part of
   this model's proof, because a check that lives only in another file is a check nobody runs. */
let axesOut = '', axesPass = false;
try {
  axesOut = execFileSync(process.execPath, ['viz-training/tools/prove-corpus-axes.mjs'],
                         { cwd: ROOT, encoding: 'utf8' });
  axesPass = /\nPASS\s*$/.test(axesOut);
} catch (e) { axesOut = String((e.stdout || '') + (e.stderr || '') || e.message); axesPass = false; }
console.log('axes proved      : ' + (axesPass ? 'yes' : '*** NO ***') + '   (prove-corpus-axes.mjs, ' +
  'six BodyParts3D right/left pairs)');
for (const line of axesOut.trim().split('\n')) console.log('  | ' + line);
report.axes = { declared: (report.acceptance.spec && report.acceptance.spec.axes) || null,
                pass: axesPass, output: axesOut };

/* ------------------------------------- 12. CROSS-VARIANT CONTAINMENT, BEAT BY BEAT

   ADDED 2026-10-01, closing the one finding review round 3 left open. The defect: beats 6 and 9 drew
   two clinical variants in one frame, COMPARE_STRUCTURES does not translate them apart, and all 11
   points of the gastroschisis cord sat inside the omphalocele sac - a normally-inserted cord drawn
   wrapped in a membrane, which is the exact opposite of the discriminator beat 6 teaches. 38/38 beat
   claims, 21/21 acceptance rows and 9/9 visibility beats passed with that in the picture, because the
   only measure pointed at it (B9-two-cords) measured the AXIAL GAP between the two cords, and a gap
   along an axis is not a test of containment.

   WHY IT IS CHECKED HERE AND NOT AS A BEAT CLAIM. The containment is a true, permanent fact about the
   model's coordinates - cord.gastroschisis_inside_sac_frac is 1.0000 and cannot be driven to zero by
   any change to the geometry, because the sac must cover the bowel outward of the ring and the
   gastroschisis cord leaves the ring along that same outward direction (gaps[22] carries the
   derivation). It is only a DEFECT when one frame draws both variants. So the thing to check is the
   SCENE's composition, per beat, which no per-beat claim evaluated against the model can express.

   SCOPE, STATED. The sac is the only enclosing volume this model builds, so containment is tested
   against sacSphere(). If a later revision adds another enclosing structure - a second membrane, an
   amniotic sleeve around a cord - this check must be extended to it. That is a real limitation, not a
   safe default. It is also why this reads the SCENE rather than a list of beats written here: add a
   beat that draws both variants and this check sees it without being told.

   WHY IT MEASURES EXCESS OVER A BASELINE, AND NOT RAW CONTAINMENT. A raw floor of zero is wrong, and
   measuring it showed why rather than being argued: the sac's near pole is at z = 1.454 while the
   ventral wall is at z = 1.792, so the membrane overlaps the body wall at the ring - which is
   anatomically right, the sac IS continuous with the wall there. So the ectoderm reads 3.25% inside
   the sac and the somatic layer 2.67%, and those are the SAME numbers in the sac's own variant:
   omphalocele ectoderm 3.25%, omphalocele somatic 2.67%, identical to four figures. That overlap is
   not a cross-variant artifact and flooring it at zero would have failed a correct picture.

   So each foreign structure is compared with ITS OWN COUNTERPART - the same part key built in the
   omphalocele variant, where sharing coordinates with the sac is not a defect but the intended
   anatomy - and the excess is floored at zero EXACTLY. No threshold is chosen anywhere: the wall and
   the somatic layer cancel to 0.000000 because the baseline removes them, and the gastroschisis cord
   reaches 0.798777 of a sac radius deep against its own counterpart's 0.077560 (that 0.077560 being
   CORD_SINK, the omphalocele cord correctly inserting ON the membrane), an excess of 0.721217. A
   lowered threshold is not a waiver; a baseline that makes the legitimate case cancel to zero is a
   measurement. */
const VARIANT_OF = (k) => {
  for (const v of ['omphalocele', 'gastroschisis', 'exstrophy']) if (k.indexOf(v) === 0) return v;
  return null;                       // shared anatomy, present in every variant
};
function shownKeysOf(view) {
  const shown = new Set();
  for (const o of view.ops || []) {
    if (o.op === 'SHOW_STRUCTURE' && o.target && o.target !== '*') shown.add(o.target);
    else if (o.op === 'HIDE_STRUCTURE') { if (o.target === '*') shown.clear(); else shown.delete(o.target); }
  }
  return [...shown];
}
function freshModel() {
  const ctx = { THREE: THREE_NODE, console: { log(){}, warn(){}, error(){} },
                document: { createElement: () => ({ getContext: () => null, style: {} }) } };
  ctx.window = ctx; vm.createContext(ctx);
  vm.runInContext(KIT_SRC, ctx); vm.runInContext(MODEL_SRC, ctx);
  return ctx.MB3D_MODELS['lateral-folding'];
}
/* MEMOISED per (variant, key): a full build costs seconds and the beat loop asks for the same
   variant's vertices repeatedly, once per beat that draws it plus once more for every baseline. */
const _vvCache = new Map();
function variantVerts(variant, key) {
  const ck = variant + '#' + key;
  if (_vvCache.has(ck)) return _vvCache.get(ck);
  const out = variantVertsUncached(variant, key);
  _vvCache.set(ck, out);
  return out;
}
function variantVertsUncached(variant, key) {
  const M = freshModel(), opts = {}; opts[variant] = true;
  const g = M.build(1, opts); g.updateMatrixWorld(true);
  const out = [], v = new THREE_NODE.Vector3();
  g.traverse(function (o) {
    if (!o.isMesh || !o.geometry || !o.geometry.attributes || !o.geometry.attributes.position) return;
    if (o.userData && o.userData.outline) return;
    if (!o.userData || o.userData.key !== key) return;
    const pos = o.geometry.attributes.position;
    for (let i = 0; i < pos.count; i++) { v.fromBufferAttribute(pos, i).applyMatrix4(o.matrixWorld); out.push({ x: v.x, y: v.y, z: v.z }); }
  });
  return out;
}
const scnContain = JSON.parse(readFileSync(SCENE, 'utf8'));
const KEY_TO_PART = {};
for (const st of scnContain.structures || []) {
  const r = st.refs && st.refs.procedural; if (!r) continue;
  KEY_TO_PART[st.key] = String(r).split('#')[1].split('@')[0].split('+')[0];
}
const SAC = freshModel().sacSphere();
/* DEEPEST PENETRATION, as a fraction of the sac's radius - not a fraction of vertices. The first
   version of this check counted vertices inside the sphere, and the wall then failed by 0.01 of a
   point: the gastroschisis variant's sheets have the window's quads dropped out, so they carry 96
   fewer vertices than the omphalocele variant's and the two averages differ in the fourth decimal
   over identical geometry. A sampling artifact must not be able to fail a correct picture, and
   loosening the floor to hide it would have been the "lowered threshold" the standard forbids. Depth
   is a geometric extremum instead: it does not care how many vertices sample the surface, and
   removing material can only ever reduce it. The legitimate sac-meets-wall overlap now cancels to
   0.000000 exactly - ectoderm 0.446916 in both variants, somatic 0.349046 in both - and the
   gastroschisis cord stands out at 0.798777 against its own counterpart's 0.077560. */
const sacDepth = (vs) => { let d = 0; for (const q of vs) {
  const e = SAC.r - Math.hypot(q.x - SAC.c.x, q.y - SAC.c.y, q.z - SAC.c.z); if (e > d) d = e; }
  return d / SAC.r; };
const containRows = [];
for (const view of scnContain.views || []) {
  const shown = shownKeysOf(view);
  const variants = [...new Set(shown.map(VARIANT_OF).filter(Boolean))];
  if (shown.indexOf('omphalocele_sac') < 0) {
    containRows.push({ beat: view.beat, variants, tested: 0, worst: null, frac: 0, ok: true,
                       why: 'this beat draws no sac, so there is no enclosing volume to be inside of' });
    continue;
  }
  const foreign = shown.filter(k => { const v = VARIANT_OF(k); return v && v !== 'omphalocele'; });
  let worst = null, worstEx = 0, worstRaw = 0, worstBase = 0, tested = 0;
  for (const k of foreign) {
    const part = KEY_TO_PART[k]; if (!part) continue;
    let verts = [], base = [];
    try { verts = variantVerts(VARIANT_OF(k), part); base = variantVerts('omphalocele', part); } catch (e) { continue; }
    if (!verts.length) continue;
    tested++;
    const raw = sacDepth(verts), bf = base.length ? sacDepth(base) : 0;
    const ex = raw - bf;
    if (ex > worstEx) { worstEx = ex; worst = k; worstRaw = raw; worstBase = bf; }
  }
  containRows.push({ beat: view.beat, variants, tested, worst, excess: worstEx, raw: worstRaw, baseline: worstBase,
    ok: worstEx <= 0,
    why: worstEx <= 0 ? 'no foreign structure reaches deeper into the sac than its own counterpart does'
                      : worst + ' reaches ' + worstRaw.toFixed(6) + ' of a sac radius deep against its own counterpart\'s ' +
                        worstBase.toFixed(6) + ' - an excess of ' + worstEx.toFixed(6) });
}
const containPass = containRows.every(r => r.ok);
console.log('cross-variant    : ' + (containPass
  ? 'clean - no beat draws a structure of one variant inside another'
  : '*** ' + containRows.filter(r => !r.ok).length + ' BEAT(S) DRAW A FOREIGN VARIANT INSIDE THE OMPHALOCELE SAC ***'));
for (const r of containRows) console.log('  beat ' + String(r.beat).padEnd(3) +
  ' [' + (r.variants.join('+') || 'shared') + ']  tested ' + r.tested + '  ' +
  (r.ok ? 'ok  ' : '*** excess ' + r.excess.toFixed(6) + ' of a sac radius *** ') + r.why);
report.crossVariant = { rows: containRows, pass: containPass, sac: SAC,
  modelLevelFact: freshModel().claimMeasure('cord.gastroschisis_inside_sac_frac', 1) };
console.log('  model-level fact : cord.gastroschisis_inside_sac_frac = ' +
  report.crossVariant.modelLevelFact.toFixed(4) +
  '  (true in shared coordinates by construction; a defect only if one beat draws both)');

/* ------------------------------------- 13. THE SHOWN-LIST THE MEASURE USES IS THE ONE THE BEAT DRAWS
   Added 2026-10-01, review round 5. models3d/lateral-folding.js keeps SEEN_BEATS — the shown list
   each coverage claim is measured over — so that acceptance() stays a property of the model and runs
   with no scene loaded. That is a SECOND COPY of something the scene already says in its ops, and a
   second copy is exactly how round 4's defect survived: a number that describes a frame nobody
   checked it against. So this check reads the beat's ops and requires the two to be the same set.
   If the scene gains or loses a SHOW_STRUCTURE in a beat that carries a coverage claim and the model
   is not updated to match, the number goes on being true of a picture that no longer exists — and
   this fails instead. */
const seenModel = freshModel();
const seenRows = [];
const COVERAGE_MEASURES = ['sac.covers_omphalocele_seen', 'sac.covers_gastroschisis_seen'];
for (const [beatStr, spec] of Object.entries(seenModel.SEEN_BEATS || {})) {
  const beat = Number(beatStr);
  const view = (scnContain.views || []).find(v => v.beat === beat);
  if (!view) { seenRows.push({ beat, ok: false, why: 'the scene has no beat ' + beat }); continue; }
  const sceneShown = shownKeysOf(view).slice().sort();
  const modelShown = (spec.shown || []).slice().sort();
  const rot = (view.ops || []).filter(o => o.op === 'ROTATE_TO_VIEW').map(o => o.view).pop() || 'anterior';
  const missingFromModel = sceneShown.filter(k => modelShown.indexOf(k) < 0);
  const extraInModel     = modelShown.filter(k => sceneShown.indexOf(k) < 0);
  const camOk = rot === spec.view;
  const claims = (view.claims || []).filter(c => COVERAGE_MEASURES.indexOf(c.measure) >= 0);
  const r = seenModel.sacSeen('omphalocele', spec.view, spec.shown);
  const rb = seenModel.sacSeen('gastroschisis', spec.view, spec.shown);
  seenRows.push({ beat, camera: rot, modelCamera: spec.view, camOk,
    missingFromModel, extraInModel, claims: claims.map(c => c.id + ' ' + c.measure + ' ' + c.op + ' ' + c.value),
    covered: r.frac, bare: rb.frac, pixels: r.pixels, inFront: r.inFront,
    missingGeom: r.missing.concat(rb.missing),
    ok: camOk && !missingFromModel.length && !extraInModel.length && !r.missing.length && !rb.missing.length });
}
const seenPass = seenRows.every(x => x.ok);
console.log('beat shown-list : ' + (seenPass
  ? 'the coverage measure is computed over exactly what the beat draws'
  : '*** THE MEASURE AND THE BEAT DISAGREE ABOUT WHAT IS DRAWN ***'));
for (const r of seenRows) {
  console.log('  beat ' + String(r.beat).padEnd(3) + ' camera ' + String(r.camera).padEnd(10) +
    (r.ok ? 'ok   ' : '*** ') +
    'covered ' + (r.covered === undefined ? '-' : r.covered.toFixed(4)) +
    '  bare ' + (r.bare === undefined ? '-' : r.bare.toFixed(4)) +
    '  over ' + r.pixels + ' px' +
    (r.missingFromModel && r.missingFromModel.length ? '   DRAWN BUT NOT MEASURED OVER: ' + r.missingFromModel.join(',') : '') +
    (r.extraInModel && r.extraInModel.length ? '   MEASURED BUT NOT DRAWN: ' + r.extraInModel.join(',') : '') +
    (r.camOk === false ? '   CAMERA MISMATCH: scene ' + r.camera + ' vs model ' + r.modelCamera : '') +
    (r.missingGeom && r.missingGeom.length ? '   NO GEOMETRY: ' + r.missingGeom.join(',') : ''));
  const inf = Object.entries(r.inFront || {});
  if (inf.length) for (const [k, v] of inf) console.log('      in front of the loop: ' + k + '  ' + (100 * v).toFixed(2) + '%');
  else console.log('      in front of the loop: nothing');
  for (const c of r.claims || []) console.log('      claim ' + c);
}
report.seenBeats = { rows: seenRows, pass: seenPass };

/* --------------------------------- 13b. AND THE SAME, FOR THE APERTURE FIELD
   Added 2026-10-01, review round 6's finding. APERTURE_BEATS is the model's own copy of beat 8's
   shown list, for the same reason SEEN_BEATS is, and it is checked against the scene's ops the same
   way. The decomposition is PRINTED here and not only gated: round 6's point was that the harness
   already had a number for how much of that window was plugged and nothing asked WHICH STRUCTURE
   was doing the plugging, so the whole first-hit breakdown goes in the log where the next review
   can read it without re-deriving it. */
const apModel = freshModel();
const APERTURE_MEASURES = ['exstrophy.field_plate_frac', 'exstrophy.field_gut_frac',
                           'exstrophy.plate_seen_in_aperture'];
const apRows = [];
for (const [beatStr, spec] of Object.entries(apModel.APERTURE_BEATS || {})) {
  const beat = Number(beatStr);
  const view = (scnContain.views || []).find(v => v.beat === beat);
  if (!view) { apRows.push({ beat, ok: false, why: 'the scene has no beat ' + beat }); continue; }
  const sceneShown = shownKeysOf(view).slice().sort();
  const modelShown = (spec.shown || []).slice().sort();
  const rot = (view.ops || []).filter(o => o.op === 'ROTATE_TO_VIEW').map(o => o.view).pop() || 'anterior';
  const missingFromModel = sceneShown.filter(k => modelShown.indexOf(k) < 0);
  const extraInModel     = modelShown.filter(k => sceneShown.indexOf(k) < 0);
  const camOk = rot === spec.view;
  const claims = (view.claims || []).filter(c => APERTURE_MEASURES.indexOf(c.measure) >= 0);
  const f = apModel.apertureField(spec.view, spec.shown);
  apRows.push({ beat, camera: rot, modelCamera: spec.view, camOk, missingFromModel, extraInModel,
    claims: claims.map(c => c.id + ' ' + c.measure + ' ' + c.op + ' ' + c.value),
    plate: f.plate, gut: f.gut, seenIn: f.seenIn, cells: f.cells, plateCells: f.plateCells,
    byKey: f.byKey, missingGeom: f.missing,
    ok: camOk && !missingFromModel.length && !extraInModel.length && !f.missing.length && f.cells > 0 });
}
const apPass = apRows.every(x => x.ok);
console.log('aperture field  : ' + (apPass
  ? 'the field measure is computed over exactly what the beat draws'
  : '*** THE APERTURE MEASURE AND THE BEAT DISAGREE ABOUT WHAT IS DRAWN ***'));
for (const r of apRows) {
  console.log('  beat ' + String(r.beat).padEnd(3) + ' camera ' + String(r.camera).padEnd(10) +
    (r.ok ? 'ok   ' : '*** ') +
    'plate ' + (r.plate === undefined ? '-' : r.plate.toFixed(4)) +
    '  gut ' + (r.gut === undefined ? '-' : r.gut.toFixed(4)) +
    '  plate seen in hole ' + (r.seenIn === undefined ? '-' : r.seenIn.toFixed(4)) +
    '  over ' + r.cells + ' aperture cells' +
    (r.missingFromModel && r.missingFromModel.length ? '   DRAWN BUT NOT MEASURED OVER: ' + r.missingFromModel.join(',') : '') +
    (r.extraInModel && r.extraInModel.length ? '   MEASURED BUT NOT DRAWN: ' + r.extraInModel.join(',') : '') +
    (r.camOk === false ? '   CAMERA MISMATCH: scene ' + r.camera + ' vs model ' + r.modelCamera : '') +
    (r.missingGeom && r.missingGeom.length ? '   NO GEOMETRY: ' + r.missingGeom.join(',') : ''));
  for (const [k, v] of Object.entries(r.byKey || {}))
    console.log('      first hit in the window: ' + k.padEnd(20) + (100 * v).toFixed(2) + '%');
  for (const c of r.claims || []) console.log('      claim ' + c);
}
report.apertureBeats = { rows: apRows, pass: apPass };

/* --------------------------------- 13c. AND THE SAME, FOR THE FRAME SHARE
   Added 2026-10-01, review round 7's finding. SHARE_BEATS is the model's third copy of a beat's shown
   list and is checked against the scene's ops for the third time for the same reason: the fault being
   fixed is a number that describes a frame nobody checked it against, so a number measured over a
   list that has drifted from the beat's ops is the same fault wearing the fix's clothes. */
const shModel = freshModel();
const SHARE_MEASURES = ['mesentery.seen_share', 'mesentery.seen_visible'];
const shRows = [];
for (const [beatStr, spec] of Object.entries(shModel.SHARE_BEATS || {})) {
  const beat = Number(beatStr);
  const view = (scnContain.views || []).find(v => v.beat === beat);
  if (!view) { shRows.push({ beat, ok: false, why: 'the scene has no beat ' + beat }); continue; }
  const sceneShown = shownKeysOf(view).slice().sort();
  const modelShown = (spec.shown || []).slice().sort();
  const rot = (view.ops || []).filter(o => o.op === 'ROTATE_TO_VIEW').map(o => o.view).pop() || 'anterior';
  const missingFromModel = sceneShown.filter(k => modelShown.indexOf(k) < 0);
  const extraInModel     = modelShown.filter(k => sceneShown.indexOf(k) < 0);
  const camOk = rot === spec.view;
  const hiliteOk = (view.ops || []).some(o => o.op === 'HIGHLIGHT_STRUCTURE' && o.target === spec.subject);
  const claims = (view.claims || []).filter(c => SHARE_MEASURES.indexOf(c.measure) >= 0);
  const r = shModel.shareSeen(spec.subject, spec.view, spec.shown);
  /* EVERY structure the beat draws, not only the subject — round 7's own method, and it is how the
     0.000% on endoderm is a number in the log rather than something a later round rediscovers. */
  const byKey = {};
  for (const k of spec.shown) byKey[k] = shModel.shareSeen(k, spec.view, spec.shown).share;
  shRows.push({ beat, subject: spec.subject, camera: rot, modelCamera: spec.view, camOk, hiliteOk,
    missingFromModel, extraInModel, byKey,
    claims: claims.map(c => c.id + ' ' + c.measure + ' ' + c.op + ' ' + c.value),
    share: r.share, visible: r.visible, pixels: r.pixels, framePixels: r.framePixels,
    inFront: r.inFront, missingGeom: r.missing,
    ok: camOk && hiliteOk && !missingFromModel.length && !extraInModel.length && !r.missing.length &&
        r.pixels > 0 && claims.length > 0 });
}
const shPass = shRows.every(x => x.ok);
console.log('beat frame share : ' + (shPass
  ? 'the share measure is computed over exactly what the beat draws, and the beat highlights its subject'
  : '*** THE MEASURE AND THE BEAT DISAGREE ABOUT WHAT IS DRAWN ***'));
for (const r of shRows) {
  console.log('  beat ' + String(r.beat).padEnd(3) + ' ' + String(r.subject).padEnd(12) +
    'camera ' + String(r.camera).padEnd(10) + (r.ok ? 'ok   ' : '*** ') +
    'share ' + (r.share === undefined ? '-' : (100 * r.share).toFixed(3) + '%') +
    '  unoccluded ' + (r.visible === undefined ? '-' : r.visible.toFixed(4)) +
    '  over ' + r.pixels + ' own px of ' + r.framePixels + ' frame px' +
    (r.missingFromModel && r.missingFromModel.length ? '   DRAWN BUT NOT MEASURED OVER: ' + r.missingFromModel.join(',') : '') +
    (r.extraInModel && r.extraInModel.length ? '   MEASURED BUT NOT DRAWN: ' + r.extraInModel.join(',') : '') +
    (r.camOk === false ? '   CAMERA MISMATCH: scene ' + r.camera + ' vs model ' + r.modelCamera : '') +
    (r.hiliteOk === false ? '   THE BEAT DOES NOT HIGHLIGHT ' + r.subject : '') +
    (r.claims && !r.claims.length ? '   NO CLAIM IN THE SCENE READS THIS MEASURE' : '') +
    (r.missingGeom && r.missingGeom.length ? '   NO GEOMETRY: ' + r.missingGeom.join(',') : ''));
  for (const [k, v] of Object.entries(r.byKey || {}))
    console.log('      share of the frame: ' + k.padEnd(16) + (100 * v).toFixed(3) + '%' +
      (v === 0 ? '   <- draws NOTHING in this beat; the scene must waive it' : ''));
  const inf = Object.entries(r.inFront || {});
  if (inf.length) for (const [k, v] of inf) console.log('      in front of the subject: ' + k + '  ' + (100 * v).toFixed(2) + '%');
  else console.log('      in front of the subject: nothing');
  for (const c of r.claims || []) console.log('      claim ' + c);
}
report.shareBeats = { rows: shRows, pass: shPass };

/* --------------------------------- 14. THE PLAYER EVIDENCE MUST NOT BE OLDER THAN THE GEOMETRY
   Round 5 asked for this and round 7 found the same thing again one round later: the item was set
   `built` on player frames 96 minutes, and then 3 hours 42 minutes, older than the model they were
   supposed to certify. Both times the geometry turned out clean, so nothing hid behind the stale
   evidence — but "built" means "a model exists and RENDERED CLEAN", and evidence older than the thing
   it certifies does not establish that. Asking twice did not work, so it is a stat() call now.

   WHAT THIS MEANS FOR A RUN'S ORDER, said plainly because the first run to hit it will think it is a
   bug: this harness builds the model's own frames, and walk-scene-in-player.mjs builds the player's.
   The walk is a separate tool and runs after this one. So on a run that has just changed the model or
   the scene, THIS CHECK IS SUPPOSED TO FAIL THE FIRST TIME. Run the walk, then run this again. The
   second pass is the one whose report.json may be quoted, and that is the whole point: there is now no
   order of operations in which a build can reach `built` without a walk younger than its geometry. */
/* THE FILE THE CURRENT WALK ACTUALLY WRITES IS shares.json, NOT visibility.json — and this guard was
   pointed at the wrong one when it was first written, from a review note's wording rather than from
   walk-scene-in-player.mjs's own writeFileSync. The guard then failed and said why, which is the only
   reason it was caught. `visibility.json` is the OUTPUT OF A TOOL THAT NO LONGER RUNS: round 5 found
   the copy in the repo was written by a different schema from the current walk (no borderPx, no
   shares, no clipped), so a stale visibility.json may still sit beside shares.json and must NOT be
   what this stats — it would pass this check while being months of geometry out of date. Do not
   "correct" this back. */
const PLAYER_EVIDENCE = `${OUT}/player/shares.json`;
const freshRows = [];
let playerFresh = true;
{
  const mtime = (f) => { try { return fs.statSync(f).mtimeMs; } catch { return null; } };
  const ev = mtime(PLAYER_EVIDENCE);
  const against = [['models3d/lateral-folding.js', mtime('models3d/lateral-folding.js')],
                   [SCENE, mtime(SCENE)],
                   ['models3d/render-kit.js', mtime('models3d/render-kit.js')]];
  if (ev === null) {
    playerFresh = false;
    freshRows.push({ file: PLAYER_EVIDENCE, ok: false, why: 'does not exist — the player walk has never run against this model' });
  } else for (const [f, m] of against) {
    const ok = m === null ? false : ev >= m;
    if (!ok) playerFresh = false;
    freshRows.push({ file: f, ok, evidenceMs: ev, sourceMs: m,
      why: m === null ? 'cannot stat ' + f
         : ok ? 'player evidence is ' + Math.round((ev - m) / 1000) + 's newer'
              : 'PLAYER EVIDENCE IS ' + Math.round((m - ev) / 1000) + 's OLDER THAN ' + f });
  }
}
console.log('player evidence  : ' + (playerFresh
  ? 'younger than the model, the scene and the kit'
  : '*** STALE OR ABSENT — re-run walk-scene-in-player.mjs, then re-run this ***'));
for (const r of freshRows) console.log('  ' + (r.ok ? 'ok   ' : '*** ') + (r.file + ' ').padEnd(53) + r.why);
report.playerEvidence = { rows: freshRows, pass: playerFresh, file: PLAYER_EVIDENCE };

report.perturbations = perturbRows;
report.normalsOk = normalsOk; report.meshPass = meshPass; report.negPass = negFail.length === 0;
report.termPass = termPass; report.legibPass = legibPass; report.perturbPass = perturbPass;
report.axesPass = axesPass; report.containPass = containPass; report.seenPass = seenPass;
report.apPass = apPass; report.shPass = shPass; report.playerFresh = playerFresh;
writeFileSync(`${OUT}/report.json`, JSON.stringify(report, null, 1));
process.exit(bad.length || badA.length || failed.length || !report.acceptance.allPass ||
  !normalsOk || !meshPass || !report.negPass || !report.lumenPass || flipped.length || !report.stagePass ||
  !termPass || !legibPass || !perturbPass || !axesPass || !containPass || !seenPass ||
  !apPass || !shPass || !playerFresh ? 1 : 0);
