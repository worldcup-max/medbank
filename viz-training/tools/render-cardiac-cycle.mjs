/* MedBank · headless proof for models3d/cardiac-cycle-pumping.js
 *
 * The five checks BUILD-TASK-PROMPT section 3 asks for, all of which must pass before the item is
 * marked built:
 *   1. it renders — screenshots at every named phase, into viz-training/models-out/cardiac-cycle-pumping/
 *   2. the console is clean — no error, no warning, no throw
 *   3. normals point outward — per mesh, counted against that mesh's own centroid, hull separately
 *   4. it looks like the thing — a human reads the frames; this tool only produces them
 *   5. every ref in the scene resolves THROUGH THE REAL ADAPTER in viz3d.js, with geometry
 *
 * plus two this model needs and the looping one did not:
 *   6. the acceptance battery passes IN THE BROWSER, not only in node
 *   7. VOLUME AGREES WITH GEOMETRY. The circulation solves for a cavity volume; the mesh is supposed
 *      to enclose that volume. Nothing checked that until this tool did, and a shape law that is
 *      exact on paper can still be built wrong. The tool integrates the actual triangles.
 *
 * Run from the repo root:  node viz-training/tools/render-cardiac-cycle.mjs
 *
 * SUBSTRATE NOTE, and it matters — RENDER-STANDARD: "test on the substrate, not on something that
 * resembles it". There is no chromium and no playwright on the device VM that holds this repo, so
 * this tool is run in a cloud container against files staged out of the repo. The files served are
 * the repo's own, byte for byte, and the adapter exercised is the real viz3d.js — but the run is not
 * on the machine the player runs on. Said out loud rather than assumed; see BUILD-LOG.md.
 */
import { chromium } from 'playwright';
import { readFileSync, writeFileSync, mkdirSync, existsSync, readdirSync } from 'fs';
import http from 'http';
import path from 'path';
import fs from 'fs';

const ROOT = process.cwd();
const OUT = 'viz-training/models-out/cardiac-cycle-pumping';
mkdirSync(OUT, { recursive: true });

/* find chromium rather than hardcoding a build number — the looping tool pins
   /opt/pw-browsers/chromium-1194/... which is one playwright upgrade from breaking */
function findChromium() {
  if (process.env.CHROMIUM_PATH) return process.env.CHROMIUM_PATH;
  const base = '/opt/pw-browsers';
  if (existsSync(base)) {
    for (const d of readdirSync(base)) {
      for (const rel of ['chrome-linux/chrome', 'chrome-linux/headless_shell']) {
        const p = path.join(base, d, rel);
        if (existsSync(p)) return p;
      }
    }
  }
  return undefined;   // let playwright use its own default
}

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

const SCENE_PATH = 'viz-training/scenes/gross__heart-pericardium__cardiac-cycle-pumping.json';
const scene = JSON.parse(readFileSync(SCENE_PATH, 'utf8'));
const REFS = scene.structures.map(s => ({ key: s.key, ref: s.refs && s.refs.procedural })).filter(r => r.ref);
/* every t the scene actually asks for, so the frames prove the scene and not a t nobody visits */
const SCENE_T = [...new Set(scene.views.flatMap(v =>
  v.ops.filter(o => o.op === 'SET_STAGE').map(o => o.t)))].sort((a, b) => a - b);

const W = 1100, H = 900;

const html = `<!doctype html><meta charset=utf8>
<link rel="icon" href="data:,">
<body style="margin:0;background:#0e1626">
<canvas id=c width=${W} height=${H}></canvas>
<script src="${BASE}node_modules/three/build/three.js"><\/script>
<script src="${BASE}models3d/render-kit.js"><\/script>
<script src="${BASE}models3d/cardiac-cycle-pumping.js"><\/script>
<script>
window.MEDBANK_CONFIG = { MODEL_BASE: '${BASE}models3d/' };
const renderer = new THREE.WebGLRenderer({ canvas: document.getElementById('c'), antialias: true });
renderer.setSize(${W}, ${H}, false); renderer.setPixelRatio(1);
VizKit.configureRenderer(renderer);
const scene = new THREE.Scene();
scene.background = VizKit.bg(0x0e1626);
const L = VizKit.standardLights(scene);
const camera = new THREE.PerspectiveCamera(32, ${W}/${H}, 0.1, 400);
const MOD = window.MB3D_MODELS['cardiac-cycle-pumping'];
let group = null;

/* THE CAMERA IS FIXED ACROSS THE STAGES, DELIBERATELY, and this needed thinking about.
   RENDER-STANDARD says the subject fills the frame at every t — and it is right, for a model whose
   SIZE is what changes. Here the size change IS the subject: a ventricle refitted to fill the frame
   at every t would show a heart that never changes size, which is the one thing this scene exists to
   show. So the camera is fitted ONCE, to the largest the model ever gets — measured over every t the
   scene visits, not assumed to be t=0 — and then held. The subject fills the frame; it just does not
   get refitted per stage. Stated here because a reviewer should be able to see that the rule was
   considered and answered rather than skipped. */
window.fitOnce = function (ts, yaw, pitch) {
  const box = new THREE.Box3();
  ts.forEach(function (t) {
    const g = MOD.build(t, Object.assign({}, MOD.FULL));
    g.rotation.y = yaw; g.rotation.x = pitch; g.updateMatrixWorld(true);
    box.union(new THREE.Box3().setFromObject(g));
  });
  const proxy = new THREE.Mesh(new THREE.BoxGeometry(
    Math.max(0.01, box.max.x-box.min.x), Math.max(0.01, box.max.y-box.min.y),
    Math.max(0.01, box.max.z-box.min.z)));
  box.getCenter(proxy.position); proxy.updateMatrixWorld(true);
  const f = VizKit.fitCamera(camera, proxy, 1.06);
  camera.position.set(f.centre.x, f.centre.y, f.centre.z + f.distance);
  camera.lookAt(f.centre);
  L.key.position.set(camera.position.x + 6, camera.position.y + 8, camera.position.z + 4);
  return { size: [f.size.x, f.size.y, f.size.z], distance: f.distance };
};
window.setStage = function (t, opts, yaw, pitch) {
  if (group) scene.remove(group);
  group = MOD.build(t, Object.assign({}, MOD.FULL, opts || {}));
  group.rotation.y = yaw == null ? 0 : yaw;
  group.rotation.x = pitch == null ? 0 : pitch;
  group.updateMatrixWorld(true);
  scene.add(group);
  renderer.render(scene, camera);
  return true;
};

/* OUTWARD NORMALS. Per mesh, against that mesh's OWN centroid, in world space. A closed solid is
   strongly majority-outward; a thick-walled shell read whole is not, because its inner surface and
   its annular caps point inward by construction — so render-kit's hullCount is used to report the
   outer surface separately. A thin SHEET (a valve leaflet) is a third case: its centroid lies in its
   own plane, so "away from the centroid" is nearly perpendicular to its normals and the fraction
   means nothing. For a sheet the number that matters is the winding agreement. */
window.normalProbe = function (t, opts) {
  const g = MOD.build(t, Object.assign({}, MOD.FULL, opts || {}));
  g.updateMatrixWorld(true);
  const rows = [], nm = new THREE.Matrix3();
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
      for (let k = 0; k < 3; k++) vn.add(new THREE.Vector3().fromBufferAttribute(n, i+k));
      if (vn.lengthSq() < 1e-16) continue;
      vn.normalize(); tris++; if (fn.dot(vn) > 0) agree++;
    }
    rows.push({ key: u.key, verts: p.count, outward: out / p.count,
                hullVerts: hull, outwardHull: hull ? outHull / hull : null,
                tris: tris, winding: tris ? agree / tris : null });
  });
  return rows;
};

/* DOES THE MESH ENCLOSE THE VOLUME THE CIRCULATION SOLVED FOR?
   Signed volume by the divergence theorem, summed over the actual triangles of the blood solids —
   which is the only way to find out whether the shape law was IMPLEMENTED as well as derived. */
window.volumeProbe = function (t) {
  const g = MOD.build(t, Object.assign({}, MOD.FULL));
  g.updateMatrixWorld(true);
  const vol = {};
  g.traverse(function (o) {
    if (!o.isMesh || !o.geometry) return;
    const u = o.userData || {};
    if (u.outline || !/_blood$/.test(u.key || '')) return;
    const geo = o.geometry.index ? o.geometry.toNonIndexed() : o.geometry;
    const p = geo.attributes.position;
    const a = new THREE.Vector3(), b = new THREE.Vector3(), c = new THREE.Vector3();
    let s = 0;
    for (let i = 0; i + 2 < p.count; i += 3) {
      a.fromBufferAttribute(p, i).applyMatrix4(o.matrixWorld);
      b.fromBufferAttribute(p, i+1).applyMatrix4(o.matrixWorld);
      c.fromBufferAttribute(p, i+2).applyMatrix4(o.matrixWorld);
      s += a.dot(new THREE.Vector3().crossVectors(b, c)) / 6;
    }
    vol[u.key] = (vol[u.key] || 0) + Math.abs(s);   // cm^3 = ml
  });
  const at = MOD.at(t);
  return { t: t, mesh: vol,
           solved: { lv_blood: at.lv.volume, rv_blood: at.rv.volume,
                     la_blood: at.la.volume, ra_blood: at.ra.volume } };
};
/* CHECK 8 — HOW WIDE THE HEART ACTUALLY IS, ON THE TRIANGLES. Added 2026-09-30, round 5, in
   answer to R4-OPEN-1. The review found the four chamber walls spanning 13.55-14.66 cm in x where
   the scene's gaps[13] claimed 12.3, and the point of the finding was not the 2 cm: it was that
   NOTHING MEASURED IT, so the drift arrived inside the edit that closed two other findings and
   nobody was told. acceptance() can assert the BASE relations, because those are analytic; a
   chamber wall's extent is a property of the built mesh and belongs here, on the substrate.

   TWO NUMBERS, NOT ONE, and keeping them apart is half the repair. world_x is what round 4
   measured. transverse is the width across the left ventricle's own long axis, which is what
   the textbook 8.5 cm means — the heart lies obliquely, so the two differ by the 3.6 cm the long
   axis projects onto x. The model's own header quoted 8.5 and the review measured 14.3, and they
   were never measuring the same thing. */
window.spanProbe = function (t) {
  const g = MOD.build(t, Object.assign({}, MOD.FULL));
  g.updateMatrixWorld(true);
  const b = MOD.acceptance().geometry.base;
  const up = new THREE.Vector3().fromArray(b.long_axis).normalize();
  const e1 = new THREE.Vector3(1, 0, 0); e1.addScaledVector(up, -e1.dot(up)).normalize();
  const e2 = new THREE.Vector3().crossVectors(e1, up).normalize();
  const WALLS = ['lv', 'rv', 'la', 'ra'];
  const lim = { x: [Infinity, -Infinity], e1: [Infinity, -Infinity], e2: [Infinity, -Infinity] };
  const per = {};
  const v = new THREE.Vector3();
  g.traverse(function (o) {
    if (!o.isMesh || !o.geometry) return;
    const u = o.userData || {};
    if (u.outline || WALLS.indexOf(u.key) < 0) return;
    const pos = o.geometry.attributes.position;
    per[u.key] = per[u.key] || [Infinity, -Infinity];
    for (let i = 0; i < pos.count; i++) {
      v.fromBufferAttribute(pos, i); o.localToWorld(v);
      const s = { x: v.x, e1: v.dot(e1), e2: v.dot(e2) };
      for (const k of ['x', 'e1', 'e2']) {
        if (s[k] < lim[k][0]) lim[k][0] = s[k];
        if (s[k] > lim[k][1]) lim[k][1] = s[k];
      }
      if (v.x < per[u.key][0]) per[u.key][0] = v.x;
      if (v.x > per[u.key][1]) per[u.key][1] = v.x;
    }
  });
  /* the analytic standoff acceptance asserts on, re-measured off the BUILT right ventricle, so a
     path change cannot leave row Z7 grading a tube nobody drew. The tricuspid annulus centre is
     the inflow end of the path; its radial distance from the left ventricular axis is rho(0). */
  const apex = new THREE.Vector3().fromArray(b.apex);
  const tv = new THREE.Vector3().fromArray(b.tv);
  const rel = new THREE.Vector3().subVectors(tv, apex);
  rel.addScaledVector(up, -rel.dot(up));
  return { t: t,
           world_x: +(lim.x[1] - lim.x[0]).toFixed(3),
           transverse: +(lim.e1[1] - lim.e1[0]).toFixed(3),
           antero_posterior: +(lim.e2[1] - lim.e2[0]).toFixed(3),
           per: per,
           inflow_standoff_measured: +rel.length().toFixed(4),
           inflow_standoff_reported: +b.rv_inflow_standoff_cm.toFixed(4) };
};
/* THE NEGATIVE CASE FOR CHECK 8, because a width check that has never been made to fail is not
   evidence — RENDER-STANDARD, and the whole reason R4-OPEN-1 exists. Push the right atrium the
   1.78 cm further right that the round-4 geometry actually had it at, and the check must reject. */
window.spanNegative = function (t, shift) {
  const g = MOD.build(t, Object.assign({}, MOD.FULL));
  g.updateMatrixWorld(true);
  const b = MOD.acceptance().geometry.base;
  const up = new THREE.Vector3().fromArray(b.long_axis).normalize();
  const e1 = new THREE.Vector3(1, 0, 0); e1.addScaledVector(up, -e1.dot(up)).normalize();
  const WALLS = ['lv', 'rv', 'la', 'ra'];
  const lim = { x: [Infinity, -Infinity], e1: [Infinity, -Infinity] };
  const v = new THREE.Vector3();
  g.traverse(function (o) {
    if (!o.isMesh || !o.geometry) return;
    const u = o.userData || {};
    if (u.outline || WALLS.indexOf(u.key) < 0) return;
    const pos = o.geometry.attributes.position;
    for (let i = 0; i < pos.count; i++) {
      v.fromBufferAttribute(pos, i); o.localToWorld(v);
      if (u.key === 'ra') v.addScaledVector(e1, -shift);
      const s = { x: v.x, e1: v.dot(e1) };
      for (const k of ['x', 'e1']) {
        if (s[k] < lim[k][0]) lim[k][0] = s[k];
        if (s[k] > lim[k][1]) lim[k][1] = s[k];
      }
    }
  });
  return { world_x: +(lim.x[1] - lim.x[0]).toFixed(3),
           transverse: +(lim.e1[1] - lim.e1[0]).toFixed(3) };
};
/* CHECK 9 — THE SHAPE OF THE FOUR VALVE RINGS, ON THE BUILT TRIANGLES, EACH IN ITS OWN PLANE.
   Added 2026-09-30, round 6, for R5-OPEN-1 and the standards gap the same review proposed:

     "any structure the curriculum examines as a shape — an annulus, an orifice, a foramen, a canal
      — must be measured in its OWN best-fit plane and must export at least a major, a minor and an
      area; a single diameter for a non-circular structure is a convention, and a convention is not
      a measurement."

   Every geometric measure in this model was taken in the LEFT VENTRICLE'S frame, because that is
   the frame the model is built in, so a ring with a plane of its own was measured obliquely: the
   tricuspid reads 4.67 by 1.67 across the left ventricle's long axis and 4.92 by 1.61 in its own.
   And the one scalar that left the model per ring was the MEAN of two diameters, which a 2.8-to-1
   ellipse defeats — three rows and a beat claim all read it and all passed while the tricuspid was
   drawn as a slot.

   So: take every triangle carrying the valve's key, fit a plane to the cloud by its own covariance,
   and measure the extent along the two in-plane principal axes. Then require agreement with the
   ring_* shapes acceptance() now exports. This is the check that proves the exported numbers
   describe the ring a student is shown and not one like it.

   THE TOLERANCE, AND WHY IT IS NOT TIGHTER. A leaflet is a SHEET with thickness, and the extreme
   point of the cloud is the outside of that sheet, not the annulus curve: the mitral carries 0.55 mm
   of thickness, the tricuspid 0.40, the semilunars 0.36, and the belly and the semilunar crown
   displace the extreme a little further. So the built extent over-reads the analytic ring by up to
   about a sheet's thickness at each end. 8% covers that on every ring with room to spare and is far
   tighter than the 186% error this check exists to catch. The aspect ORDER is asserted exactly:
   whichever ring is the least circular on the triangles must be the one the export says it is. */
window.ringProbe = function (t) {
  const g = MOD.build(t, Object.assign({}, MOD.FULL));
  g.updateMatrixWorld(true);
  const KEYS = ['mitral', 'aortic', 'tricuspid', 'pulmonary'];
  const out = {};
  const v = new THREE.Vector3();
  for (const key of KEYS) {
    const pts = [];
    g.traverse(function (o) {
      if (!o.isMesh || !o.geometry) return;
      const u = o.userData || {};
      if (u.outline || u.key !== key) return;
      const pos = o.geometry.attributes.position;
      for (let i = 0; i < pos.count; i++) {
        v.fromBufferAttribute(pos, i); o.localToWorld(v);
        pts.push(v.clone());
      }
    });
    if (!pts.length) { out[key] = null; continue; }
    const c = new THREE.Vector3();
    for (const q of pts) c.add(q);
    c.multiplyScalar(1 / pts.length);
    /* the cloud's own covariance — no frame borrowed from the left ventricle */
    let M = [[0, 0, 0], [0, 0, 0], [0, 0, 0]];
    for (const q of pts) {
      const d = [q.x - c.x, q.y - c.y, q.z - c.z];
      for (let i = 0; i < 3; i++) for (let j = 0; j < 3; j++) M[i][j] += d[i] * d[j];
    }
    for (let i = 0; i < 3; i++) for (let j = 0; j < 3; j++) M[i][j] /= pts.length;
    /* Jacobi, symmetric 3x3: the smallest eigenvector is the plane normal, the other two are the
       ring's own in-plane axes */
    let A = M.map(function (r) { return r.slice(); });
    let V = [[1, 0, 0], [0, 1, 0], [0, 0, 1]];
    for (let sweep = 0; sweep < 100; sweep++) {
      let p1 = 0, q1 = 1, mx = Math.abs(A[0][1]);
      if (Math.abs(A[0][2]) > mx) { mx = Math.abs(A[0][2]); p1 = 0; q1 = 2; }
      if (Math.abs(A[1][2]) > mx) { mx = Math.abs(A[1][2]); p1 = 1; q1 = 2; }
      if (mx < 1e-14) break;
      const th = 0.5 * Math.atan2(2 * A[p1][q1], A[q1][q1] - A[p1][p1]);
      const cs = Math.cos(th), sn = Math.sin(th);
      const R = [[1, 0, 0], [0, 1, 0], [0, 0, 1]];
      R[p1][p1] = cs; R[q1][q1] = cs; R[p1][q1] = sn; R[q1][p1] = -sn;
      const t1 = [[0, 0, 0], [0, 0, 0], [0, 0, 0]];
      for (let i = 0; i < 3; i++) for (let j = 0; j < 3; j++) {
        let acc = 0; for (let k = 0; k < 3; k++) acc += R[k][i] * A[k][j]; t1[i][j] = acc;
      }
      const t2 = [[0, 0, 0], [0, 0, 0], [0, 0, 0]];
      for (let i = 0; i < 3; i++) for (let j = 0; j < 3; j++) {
        let acc = 0; for (let k = 0; k < 3; k++) acc += t1[i][k] * R[k][j]; t2[i][j] = acc;
      }
      A = t2;
      const v2 = [[0, 0, 0], [0, 0, 0], [0, 0, 0]];
      for (let i = 0; i < 3; i++) for (let j = 0; j < 3; j++) {
        let acc = 0; for (let k = 0; k < 3; k++) acc += V[i][k] * R[k][j]; v2[i][j] = acc;
      }
      V = v2;
    }
    const ev = [A[0][0], A[1][1], A[2][2]];
    const idx = [0, 1, 2].sort(function (i, j) { return ev[i] - ev[j]; });
    const u1 = new THREE.Vector3(V[0][idx[2]], V[1][idx[2]], V[2][idx[2]]).normalize();
    const u2 = new THREE.Vector3(V[0][idx[1]], V[1][idx[1]], V[2][idx[1]]).normalize();
    const nr = new THREE.Vector3(V[0][idx[0]], V[1][idx[0]], V[2][idx[0]]).normalize();
    let a1 = [Infinity, -Infinity], a2 = [Infinity, -Infinity];
    for (const q of pts) {
      const d = new THREE.Vector3().subVectors(q, c);
      const x1 = d.dot(u1), x2 = d.dot(u2);
      if (x1 < a1[0]) a1[0] = x1; if (x1 > a1[1]) a1[1] = x1;
      if (x2 < a2[0]) a2[0] = x2; if (x2 > a2[1]) a2[1] = x2;
    }
    /* the covariance's FIRST axis is the one with most variance, which for a near-circular ring is
       not reliably the longer EXTENT — so order the two extents rather than trusting the eigenvalue
       order, and an aspect is then always >= 1 as an annulus is quoted */
    const ex1 = a1[1] - a1[0], ex2 = a2[1] - a2[0];
    const major = Math.max(ex1, ex2), minor = Math.min(ex1, ex2);
    out[key] = { major: +major.toFixed(4), minor: +minor.toFixed(4),
                 aspect: +(major / minor).toFixed(4),
                 normal: [+nr.x.toFixed(3), +nr.y.toFixed(3), +nr.z.toFixed(3)],
                 points: pts.length };
  }
  return out;
};
window.acceptance = function () { return MOD.acceptance(); };
window.at = function (t) { return MOD.at(t); };
<\/script>`;

writeFileSync(`${OUT}/_harness.html`, html);

const adapterHtml = `<!doctype html><meta charset=utf8><link rel="icon" href="data:,"><body>
<script src="${BASE}node_modules/three/build/three.js"><\/script>
<script>window.MEDBANK_CONFIG = { MODEL_BASE: '${BASE}models3d/' };<\/script>
<script src="${BASE}viz3d.js"><\/script>
<script>
window.resolveAll = function (refs, t) {
  const ad = window.MB3D.adapters.procedural;
  return Promise.all(refs.map(function (r) {
    const ref = t == null ? r.ref : r.ref + '@' + t;
    return ad.load(window.THREE, { key: r.key, refs: { procedural: ref } })
      .then(function (res) {
        const m = res && res.mesh;
        return { key: r.key, ref: ref, reason: res && res.reason, hasMesh: !!m,
                 tris: m && m.geometry ? m.geometry.attributes.position.count / 3 : 0 };
      }, function (e) { return { key: r.key, ref: ref, error: String(e && e.message || e) }; });
  }));
};
window.stageable = function (refs) {
  const ad = window.MB3D.adapters.procedural;
  return refs.map(function (r) {
    return { key: r.key, stageable: ad.stageable({ refs: { procedural: r.ref } }) };
  });
};
<\/script>`;
writeFileSync(`${OUT}/_adapter.html`, adapterHtml);

const exe = findChromium();
const b = await chromium.launch({ executablePath: exe,
  args: ['--use-gl=swiftshader', '--enable-unsafe-swiftshader', '--no-sandbox'] });
const p = await b.newPage({ viewport: { width: W, height: H } });
const log = [];
p.on('console', m => log.push({ type: m.type(), text: m.text() }));
p.on('pageerror', e => log.push({ type: 'pageerror', text: String(e && e.message || e) }));

await p.goto(BASE + OUT + '/_harness.html');
await p.waitForFunction('typeof window.setStage === "function"');

const report = { chromium: exe || '(playwright default)', scene_t: SCENE_T,
                 stages: [], console: [], normals: null, acceptance: null, volumes: [], refs: null };
report.acceptance = await p.evaluate('window.acceptance()');

/* THE FRAMES STAND WHERE THE PLAYER STANDS. This was a hardcoded -0.32 and the scene's own
   camera.initialYaw was a different number, so the proof frames were shot from a viewpoint no
   student ever sees — which matters now that the scene has moved to a left anterior oblique to look
   into the left ventricle's free-wall opening. Read it from the scene, so the two cannot drift. */
const YAW = (scene.camera && typeof scene.camera.initialYaw === 'number') ? scene.camera.initialYaw : -0.32;
const PITCH = 0.06;
report.fit = await p.evaluate(([ts, y, x]) => window.fitOnce(ts, y, x), [SCENE_T, YAW, PITCH]);

/* one frame per stage the scene visits, plus the two extremes and one intact view */
const STAGES = SCENE_T.map(t => [('t' + String(Math.round(t * 1000)).padStart(3, '0')), t, {}, YAW]);
STAGES.push(['t208-side', 0.208, {}, -1.45]);
STAGES.push(['t546-side', 0.546, {}, -1.45]);
STAGES.push(['t208-intact', 0.208, { intact: true }, YAW]);
STAGES.push(['t546-intact', 0.546, { intact: true }, YAW]);

for (const [name, t, opts, yaw] of STAGES) {
  await p.evaluate(([t2, o, y, x]) => window.setStage(t2, o, y, x), [t, opts, yaw, PITCH]);
  const at = await p.evaluate(t2 => window.at(t2), t);
  const file = `${OUT}/${name}.png`;
  await p.locator('#c').screenshot({ path: file });
  report.stages.push({ name, t, opts, yaw, file, phase: at.phase.name,
    lv_volume: at.lv.volume, valves: at.valves });
}

report.normals = await p.evaluate('window.normalProbe(0.33)');
for (const t of [0.208, 0.33, 0.546, 0.88]) {
  report.volumes.push(await p.evaluate(t2 => window.volumeProbe(t2), t));
}
/* check 8: the span at EVERY instant the scene stands on, plus the two extra stages, because the
   round-4 maximum was at a t nobody had measured */
report.spans = [];
for (const t of [...SCENE_T, 0.208, 0.33, 0.546, 0.88].sort((a, b2) => a - b2)) {
  report.spans.push(await p.evaluate(t2 => window.spanProbe(t2), t));
}
/* the negative is run at the instant the heart is WIDEST across its long axis, not at a
   convenient one: at t=0.174 a 1.78 cm shift of the right atrium leaves transverse at 12.18, under
   the bound, because the right atrium is not the limiting structure there and the check would have
   rejected on world_x alone. Run where the bound actually binds, both measures reject. */
report.span_negative = await p.evaluate(([t, sh]) => window.spanNegative(t, sh), [0.48, 1.78]);
/* check 9: the four rings, each in its own plane, at end-diastole and at the two instants review
   round 5 measured them at — so the agreement is not a coincidence at one t */
report.rings = [];
for (const t of [0, 0.419, 0.601]) {
  report.rings.push({ t: t, measured: await p.evaluate(t2 => window.ringProbe(t2), t) });
}
report.console = log.slice();

/* ---- the real adapter, at three different stages ---- */
const p2 = await b.newPage();
const log2 = [];
p2.on('console', m => log2.push({ type: m.type(), text: m.text() }));
p2.on('pageerror', e => log2.push({ type: 'pageerror', text: String(e && e.message || e) }));
await p2.goto(BASE + OUT + '/_adapter.html');
await p2.waitForFunction('typeof window.resolveAll === "function"');
report.refs = await p2.evaluate(r => window.resolveAll(r), REFS);
report.refs_mid = await p2.evaluate(([r, t]) => window.resolveAll(r, t), [REFS, 0.33]);
report.stageable = await p2.evaluate(r => window.stageable(r), REFS);
report.adapterConsole = log2;

await b.close(); server.close();
writeFileSync(`${OUT}/report.json`, JSON.stringify(report, null, 1));

/* ---------------------------------- verdict ---------------------------------- */
const NOISE = /GPU stall due to ReadPixels|GL Driver Message|Automatic fallback to software WebGL|SwiftShader|Failed to create and initialize WebGPU/i;
const noise = report.console.filter(m => NOISE.test(m.text));
const bad = report.console.filter(m => (m.type === 'error' || m.type === 'warning' || m.type === 'pageerror') && !NOISE.test(m.text));
const badA = (report.adapterConsole || []).filter(m => (m.type === 'error' || m.type === 'warning' || m.type === 'pageerror') && !NOISE.test(m.text));
report.harness_noise = noise;

console.log('chromium        :', report.chromium);
console.log('stages rendered :', report.stages.length, '->', OUT);
console.log('console (model) :', bad.length ? 'DIRTY' : 'clean',
  bad.map(x => x.type + ': ' + x.text).join(' | '), '  [' + noise.length + ' harness messages ignored]');
console.log('console (adapter):', badA.length ? 'DIRTY' : 'clean', badA.map(x => x.type + ': ' + x.text).join(' | '));

const acc = report.acceptance;
const accFail = Object.keys(acc.pass).filter(k => !acc.pass[k].ok);
console.log('acceptance      :', acc.allPass ? 'all pass' : 'FAILED ' + accFail.join(','),
  '(' + Object.keys(acc.pass).length + ' rows)');

const byKey = {};
for (const r of report.normals) (byKey[r.key] = byKey[r.key] || []).push(r);
let worstWind = 1;
for (const k of Object.keys(byKey).sort()) {
  const rows = byKey[k];
  const ow = rows.map(r => r.outward), wi = rows.map(r => r.winding).filter(x => x != null);
  const oh = rows.map(r => r.outwardHull).filter(x => x != null);
  worstWind = Math.min(worstWind, ...wi);
  console.log('  normals', k.padEnd(15),
    'hull ' + (oh.length ? Math.min(...oh).toFixed(3) + '-' + Math.max(...oh).toFixed(3) : '   n/a   '),
    ' whole ' + Math.min(...ow).toFixed(3) + '-' + Math.max(...ow).toFixed(3),
    ' winding ' + Math.min(...wi).toFixed(3) + '-' + Math.max(...wi).toFixed(3), '(' + rows.length + ')');
}

let volBad = 0;
console.log('volume: mesh triangles integrated against the volume the circulation solved for');
for (const v of report.volumes) {
  const parts = Object.keys(v.solved).map(k => {
    const m = v.mesh[k], s = v.solved[k], err = m == null ? NaN : (m - s) / s;
    if (!(Math.abs(err) < 0.03)) volBad++;
    return k.replace('_blood', '') + ' ' + (m == null ? 'MISSING' : m.toFixed(1) + '/' + s.toFixed(1) +
      ' (' + (err * 100).toFixed(1) + '%)');
  });
  console.log('  t=' + v.t, parts.join('  '));
}

/* ---- check 8: the width of the heart, on the built triangles ----

   THE BOUNDS AND WHERE THEY COME FROM. `transverse` is the width across the left ventricle's long
   axis, the dimension the textbook 8.5 cm names; this model measures 10.4-12.2 cm, so the bound is
   12.5 — 0.3 cm of headroom over what the construction supports, and the 2-3 cm it is still over
   anatomy is DECLARED in the scene's gaps[13] rather than buried in a wide bound. `world_x` is the
   number round 4 measured, 13.55-14.66 before the rvPath re-derivation and 12.5-13.5 after; the
   bound is 13.8. Neither is a target the geometry was tuned against — the tube's standoff was
   re-derived from what is actually in its way and these fell out — and both reject the round-4
   geometry, which the negative below demonstrates rather than asserts. */
const SPAN_MAX_TRANSVERSE = 12.5, SPAN_MAX_WORLD_X = 13.8;
let spanBad = 0, standBad = 0;
const worstSpan = report.spans.reduce((m, s2) => (s2.transverse > m.transverse ? s2 : m), report.spans[0]);
const worstX = report.spans.reduce((m, s2) => (s2.world_x > m.world_x ? s2 : m), report.spans[0]);
for (const s2 of report.spans) {
  if (s2.transverse > SPAN_MAX_TRANSVERSE || s2.world_x > SPAN_MAX_WORLD_X) spanBad++;
  /* the analytic standoff row Z7 asserts on must be the one the mesh was built from */
  if (Math.abs(s2.inflow_standoff_measured - s2.inflow_standoff_reported) > 0.02) standBad++;
}
const negRejects = report.span_negative.transverse > SPAN_MAX_TRANSVERSE ||
                   report.span_negative.world_x > SPAN_MAX_WORLD_X;
console.log('width (4 chamber walls, built triangles), bounds transverse <= ' + SPAN_MAX_TRANSVERSE +
            ' cm, world x <= ' + SPAN_MAX_WORLD_X + ' cm');
console.log('  widest transverse ' + worstSpan.transverse + ' cm at t=' + worstSpan.t +
            ';  widest in x ' + worstX.world_x + ' cm at t=' + worstX.t +
            (spanBad ? '   <-- ' + spanBad + ' INSTANT(S) TOO WIDE' : ''));
console.log('  rho(0) reported by acceptance ' + report.spans[0].inflow_standoff_reported +
            ' cm, measured on the built tricuspid annulus ' + report.spans[0].inflow_standoff_measured +
            ' cm' + (standBad ? '   <-- THE ROW IS GRADING A DIFFERENT TUBE' : ''));
console.log('  negative (right atrium pushed 1.78 cm further right, the round-4 geometry): ' +
            'transverse ' + report.span_negative.transverse + ', x ' + report.span_negative.world_x +
            ' -> ' + (negRejects ? 'rejected' : 'NOT REJECTED — the check cannot fail'));

/* ---- check 9: the SHAPE of the four rings, measured in each ring's own plane ----

   R5-OPEN-1 and the standards gap that review proposed. Until round 6 one scalar per ring left this
   model — the MEAN of its two diameters — and the tricuspid was a 2.8-to-1 slot behind a mean that
   read like a ring. acceptance() now exports a major, a minor, an aspect and an orifice area for
   each of the four; this block measures the same four on the BUILT triangles, each in its OWN
   best-fit plane, and requires them to agree.

   WHICH NUMBER IS GRADED AT WHICH INSTANT, and getting this wrong is how the first version of this
   check failed. acceptance() reports the rings at END-DIASTOLE, because that is the instant every
   other figure in GEOM_REPORT is quoted at — and the annuli are not rigid: buildCycle scales each
   with its own cavity radius to the power 0.4, so by t=0.601 the built mitral ring is 2.42 cm where
   the end-diastolic export says 2.80. Comparing those two is comparing two instants, and the first
   run of this check flagged three rings for it. So the DIAMETERS are graded at end-diastole, where
   the export is defined, and the ASPECT — which is scale-free, and is the thing R5-OPEN-1 was
   actually about — is graded at EVERY instant. That is the stronger statement of the two: a ring
   may shrink with its chamber, but it may not change shape while doing it.

   THE TOLERANCES. 8% on a diameter is a sheet's thickness, not slack: a leaflet's extreme point is
   the outside of a surface 0.36-0.55 mm thick, plus the belly's sag and the semilunar crown, so the
   built extent over-reads the analytic ring slightly at both ends. 6% on an aspect covers the same
   thickness acting unequally on a major and a minor axis. The error this check exists to catch was
   186%. */
const RING_TOL = 0.08, RING_ASPECT_TOL = 0.06, RING_DIAM_T = 0;
const RING_KEYS = { mitral: 'ring_mv', aortic: 'ring_av', tricuspid: 'ring_tv', pulmonary: 'ring_pv' };
let ringBad = 0, ringOrderBad = 0;
console.log('ring shape (4 valve rings, built triangles, each in its OWN best-fit plane), tol ' +
            (RING_TOL * 100).toFixed(0) + '% per diameter at end-diastole, ' +
            (RING_ASPECT_TOL * 100).toFixed(0) + '% per aspect at every t');
for (const r of report.rings) {
  const parts = [];
  let worstKey = null, worstAsp = -Infinity;
  const gradeDiam = r.t === RING_DIAM_T;
  for (const key of Object.keys(RING_KEYS)) {
    const m = r.measured[key];
    const e = acc.geometry.base[RING_KEYS[key]];
    if (!m || !e) { ringBad++; parts.push(key + ' MISSING'); continue; }
    const dMaj = Math.abs(m.major - e.major_cm) / e.major_cm;
    const dMin = Math.abs(m.minor - e.minor_cm) / e.minor_cm;
    const dAsp = Math.abs(m.aspect - e.aspect) / e.aspect;
    const badD = gradeDiam && (dMaj > RING_TOL || dMin > RING_TOL);
    const badA2 = dAsp > RING_ASPECT_TOL;
    if (badD || badA2) ringBad++;
    if (m.aspect > worstAsp) { worstAsp = m.aspect; worstKey = key; }
    parts.push(key.slice(0, 4) + ' ' + m.major.toFixed(2) + 'x' + m.minor.toFixed(2) +
               ' asp ' + m.aspect.toFixed(2) + ' vs exported asp ' + e.aspect.toFixed(2) +
               ' (off ' + (100 * dAsp).toFixed(1) + '%)' +
               (gradeDiam ? '; diam exported ' + e.major_cm.toFixed(2) + 'x' + e.minor_cm.toFixed(2) +
                            ', off ' + (100 * Math.max(dMaj, dMin)).toFixed(1) + '%' : '') +
               (badA2 ? ' <-- SHAPE DISAGREES' : '') + (badD ? ' <-- DIAMETER DISAGREES' : ''));
  }
  /* the least circular ring on the triangles must be the one the export says is least circular —
     asserted exactly, because THAT is the relation a convention can hide */
  let expWorst = null, expAsp = -Infinity;
  for (const key of Object.keys(RING_KEYS)) {
    const a2 = acc.geometry.base[RING_KEYS[key]].aspect;
    if (a2 > expAsp) { expAsp = a2; expWorst = key; }
  }
  if (worstKey !== expWorst) ringOrderBad++;
  console.log('  t=' + r.t + (gradeDiam ? ' (end-diastole: diameters AND shape graded)'
                                     : ' (shape graded; diameters scale with the chamber)'));
  console.log('            ' + parts.join('\n            '));
  console.log('            least circular on the mesh: ' + worstKey + ' (' + worstAsp.toFixed(2) +
              ':1); exported says ' + expWorst + ' (' + expAsp.toFixed(2) + ':1)' +
              (worstKey !== expWorst ? '   <-- THE EXPORT NAMES THE WRONG RING' : ''));
}

/* THE NEGATIVE FOR CHECK 9, and it is the defect itself rather than a nudge — RENDER-STANDARD, and
   the reason is that this exact comparison is what five review rounds did not make. Before round 6
   the only thing this model exported about the tricuspid was annulus_tv_cm = 3.304, a MEAN of two
   diameters, and every row and beat claim that read it behaved as though the ring were a circle of
   that size. So: compare the ring actually built against a CIRCLE of the mean diameter it reported,
   which is the claim the old export amounted to. Check 9 must reject it. If it does not, the check
   is not measuring shape and would have passed the thing it was written for. */
const tvM = report.rings[0].measured.tricuspid;
const meanD = acc.geometry.base.annulus_tv_cm;
const negAsp = Math.abs(tvM.aspect - 1) / 1;
const negMaj = Math.abs(tvM.major - meanD) / meanD;
const ring9NegRejects = negAsp > RING_ASPECT_TOL || negMaj > RING_TOL;
console.log('  negative (the pre-round-6 export: a CIRCLE of the reported mean diameter ' +
            meanD.toFixed(3) + ' cm, which is all annulus_tv_cm ever claimed): built ring is ' +
            tvM.major.toFixed(2) + 'x' + tvM.minor.toFixed(2) + ', aspect off ' +
            (100 * negAsp).toFixed(0) + '%, major off ' + (100 * negMaj).toFixed(0) + '% -> ' +
            (ring9NegRejects ? 'rejected' : 'NOT REJECTED — check 9 cannot see a slot'));

const failed = report.refs.filter(r => !r.hasMesh || !r.tris);
const failedMid = report.refs_mid.filter(r => !r.hasMesh || !r.tris);
const notStageable = report.stageable.filter(r => !r.stageable);
console.log('refs resolved   :', (report.refs.length - failed.length) + '/' + report.refs.length,
  'at default t;', (report.refs_mid.length - failedMid.length) + '/' + report.refs_mid.length, 'at t=0.33',
  failed.concat(failedMid).length ? ' FAILED: ' + failed.concat(failedMid).map(f => f.key + '(' + (f.reason || f.error) + ')').join(', ') : '');
console.log('stageable       :', (report.stageable.length - notStageable.length) + '/' + report.stageable.length,
  notStageable.length ? 'NOT stageable: ' + notStageable.map(r => r.key).join(', ') : '(every ref follows SET_STAGE)');
console.log('total triangles :', report.refs.reduce((s, r) => s + (r.tris || 0), 0).toFixed(0));

const ok = !bad.length && !badA.length && !failed.length && !failedMid.length &&
           acc.allPass && !volBad && !notStageable.length && worstWind > 0.95 &&
           !spanBad && !standBad && negRejects && !ringBad && !ringOrderBad &&
           ring9NegRejects;
console.log('\nVERDICT:', ok ? 'PASS' : 'FAIL');
process.exit(ok ? 0 : 1);
