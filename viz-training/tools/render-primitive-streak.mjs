/* MedBank · headless proof for models3d/primitive-streak.js
 *
 *   node viz-training/tools/render-primitive-streak.mjs
 *
 * BUILD-TASK-PROMPT section 3's five checks, plus five this model needs of its own.
 *
 *   1. IT RENDERS — every beat's own t, plus the two section variants, to
 *      viz-training/models-out/primitive-streak/
 *   2. THE CONSOLE IS CLEAN — no error, no warning, no throw
 *   3. NORMALS POINT OUTWARD — three shape-independent measures, because the familiar
 *      count-the-radial-normals probe is NOT valid on this model and saying so is half the check.
 *      Nine of its parts are SHEETS: slabs a quarter of a unit thick and ten units across, so a
 *      vertex's direction from its own mesh centroid is very nearly PERPENDICULAR to that vertex's
 *      normal, and the radial fraction sits near 0.5 on geometry with no fault in it at all. What is
 *      measured instead is (a) every triangle's FACE normal, from its vertex ORDER, against the
 *      vertex normals emitted with it — the invariant RENDER-STANDARD 2.1 actually states, which
 *      holds on any shape; (b) the SIGNED VOLUME of each closed part, positive exactly when a closed
 *      surface is wound outward; and (c) 2.4b's RAY CAST from five cameras, counting first hits that
 *      face away. On a closed solid that count is zero.
 *   4. IT LOOKS LIKE THE THING — the frames are for a human; this file cannot do it.
 *   5. EVERY REF RESOLVES THROUGH THE REAL ADAPTER in viz3d.js, with geometry, AT THE t ITS OWN BEAT
 *      DRAWS AND WITH THAT BEAT'S OWN FLAGS. Thirty refs across ten beats, including both section
 *      variants, because "it resolves" is a question about a picture a student looks at.
 *
 *   6. THE WINDING CONVENTION IS RE-MEASURED, NOT REMEMBERED. 2.4b: a convention that has to be
 *      reasoned about at the call site will be got wrong at some call site. It was got wrong at two
 *      of them here — the cell blobs, and (via a folded sweep) the routes — so the quad() argument
 *      order is re-derived on a unit sphere every run.
 *   7. THE SOLVED PARAMETERS ARE PERTURBED, including one perturbation that must change NOTHING.
 *   8. NO TWO PARTS SHARE SPACE except where the model says they must (3.z), with the construction
 *      contacts excluded BY NAME in a partition this file prints.
 *   9. EVERY BEAT CHANGES THE PICTURE. The ten frames the player walk composed are differenced
 *      pairwise: no two may be identical, and no beat may be identical to the one before it.
 *  11. THE REGION CHECKS CATCH THE DEFECT THEY WERE WRITTEN FOR. Round 1's finding F1 was that a claim
 *      about an AREA was tested at one point. The rows that replaced those point samples (K2, K3, L1,
 *      L2, L3, K5, Q, Q2) are only worth something if they FAIL on the construction round 1 found, so
 *      this file rebuilds that construction FROM THE MODEL'S OWN CURRENT SOURCE — two text
 *      substitutions, the cone mask and the old mesoderm lane edge — loads it, and requires those rows
 *      to fail. It also builds the fix EXACTLY AS THE REVIEW WORDED IT (a plateau to r0 = 0.75 rather
 *      than to the rim) and requires that to fail too, because it would have left the outer 44% of each
 *      membrane's area three-layered. Generating the controls from the live file rather than keeping a
 *      copy is the point: a stored control drifts out of agreement with the model and then proves
 *      nothing about it.
 *
 *  10. THE SHEETS ARE WATERTIGHT. Every slab this model sweeps is a closed surface, so every edge
 *      must be shared by exactly two triangles. An unpaired edge is a hole, and a hole is how a
 *      silhouette shell leaks.
 *
 * WHERE THIS RUNS. In a Linux container with chromium, against a copy of the repo. The files under
 * test are byte-identical to the ones in the repo; the substrate for the RENDER is not the mount.
 */
import { chromium } from 'playwright';
import { readFileSync, writeFileSync, mkdirSync, readdirSync, existsSync } from 'fs';
import http from 'http';
import path from 'path';
import fs from 'fs';

const ROOT = process.cwd();
const OUT = 'viz-training/models-out/primitive-streak';
mkdirSync(OUT, { recursive: true });

const MIME = { '.js': 'text/javascript', '.json': 'application/json', '.html': 'text/html', '.png': 'image/png' };
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

const SCENE = 'viz-training/scenes/embryology__week-3-gastrulation__primitive-streak.json';
const scene = JSON.parse(readFileSync(SCENE, 'utf8'));
const byKey = {}; scene.structures.forEach(s => byKey[s.key] = s);

/* the beats, their t, their shown set and their camera — read off the scene's own ops, never retyped */
const beats = scene.views.map(v => {
  const st = (v.ops || []).find(o => o.op === 'SET_STAGE');
  const rot = (v.ops || []).find(o => o.op === 'ROTATE_TO_VIEW');
  const vis = {}; Object.keys(byKey).forEach(k => vis[k] = true);
  const keysFor = t => (t === '*' || t == null) ? Object.keys(byKey)
    : (byKey[t] ? [t] : Object.keys(byKey).filter(k => byKey[k].group === t));
  for (const o of v.ops || []) {
    if (o.op === 'SHOW_STRUCTURE') keysFor(o.target).forEach(k => vis[k] = true);
    else if (o.op === 'HIDE_STRUCTURE') keysFor(o.target).forEach(k => vis[k] = false);
  }
  /* AND WHAT THE CAMERA IS FRAMED ON, which is not the same as what is shown. viz3d's subjectBox()
     frames an ISOLATE_REGION / COMPARE_STRUCTURES beat on state.only and everything visible
     otherwise, so a harness that always fits to the shown set draws a picture the player never
     draws — and on beat 2 that difference is the whole frame: the player is tight on the streak and
     this file was showing the entire disc. */
  const iso = (v.ops || []).find(o => o.op === 'ISOLATE_REGION');
  const cmp = (v.ops || []).find(o => o.op === 'COMPARE_STRUCTURES');
  const only = iso ? keysFor(iso.target)
             : (cmp ? (cmp.targets || []).reduce((a, x) => a.concat(keysFor(x)), []) : null);
  return { beat: v.beat, title: v.title, t: st ? st.t : 1, cam: rot ? rot.view : 'posterior',
           shown: Object.keys(vis).filter(k => vis[k]),
           only: only && only.length ? only : null };
});

/* the refs, at the t each one's own beat draws and with that beat's own flags */
const REFS = [];
for (const b of beats) for (const k of b.shown) {
  const ref = byKey[k].refs && byKey[k].refs.procedural; if (!ref) continue;
  const plus = ref.indexOf('+');
  const at = plus >= 0 ? ref.slice(0, plus) + '@' + b.t + ref.slice(plus) : ref + '@' + b.t;
  REFS.push({ key: k, beat: b.beat, ref: at });
}
const unshown = scene.structures.filter(s => !beats.some(b => b.shown.indexOf(s.key) >= 0)).map(s => s.key);

const browser = await chromium.launch({
  executablePath: (function () {
    const base = '/opt/pw-browsers';
    for (const d of readdirSync(base))
      for (const rel of ['chrome-linux/chrome', 'chrome-linux/headless_shell']) {
        const p = path.join(base, d, rel); if (existsSync(p)) return p;
      }
    return undefined;
  })(),
  args: ['--use-gl=swiftshader', '--enable-unsafe-swiftshader', '--no-sandbox'],
});
const page = await browser.newPage({ viewport: { width: 900, height: 900 } });
/* THE CONSOLE, AND THE ONE NAMED EXCLUSION ON IT. swiftshader prints GL_CLOSE_PATH_NV performance
   messages about its own throughput on a machine with no graphics card. The pattern is taken verbatim
   from render-cleavage-morula.mjs so the two proofs filter the same thing, and it is an EXACT pattern
   that is counted and printed rather than a relaxed threshold, for the reason RENDER-STANDARD gives:
   a warning that is a known false alarm trains every future run to ignore the channel it prints on. */
const DRIVER_NOISE = /GL Driver Message \(OpenGL, Performance/;
const consoleEvents = [];
page.on('console', m => { if (m.type() === 'error' || m.type() === 'warning') consoleEvents.push(m.type() + ': ' + m.text()); });
page.on('pageerror', e => consoleEvents.push('pageerror: ' + e.message));

await page.setContent('<style>html,body{margin:0;background:#0e1626}</style><canvas id="c" width="900" height="900"></canvas>');
await page.addScriptTag({ url: BASE + 'viz-training/spike/three.min.js' });
await page.addScriptTag({ url: BASE + 'models3d/render-kit.js' });
await page.addScriptTag({ url: BASE + 'models3d/primitive-streak.js' });
await page.evaluate(() => {
  const K = window.VizKit;
  window.__renderer = K.configureRenderer(new THREE.WebGLRenderer({
    canvas: document.getElementById('c'), antialias: true }));
  window.__renderer.setClearColor(K.bg(0x0e1626), 1);
  window.__scene = new THREE.Scene();
  K.standardLights(window.__scene);
  window.__camera = new THREE.PerspectiveCamera(38, 1, 0.05, 500);
  /* viz3d.js VIEW_DIR, copied so the framing is the player's and not a second opinion */
  window.__VIEW_DIR = { anterior:[0,0,1], posterior:[0,0,-1], lateral:[1,0,0],
                        medial:[-1,0,0], superior:[0,1,0.001], inferior:[0,-1,0.001] };
  window.__clear = () => { const sc = window.__scene;
    for (let i = sc.children.length - 1; i >= 0; i--) if (sc.children[i].type === 'Group') sc.remove(sc.children[i]); };
});

/* ── 6 · THE WINDING PROBE, re-measured on a unit sphere every run ───────────────────────────── */
const winding = await page.evaluate(() => {
  const T = THREE, K = window.VizKit, NU = 24, NV = 32;
  function build(order) {
    const E = K.emitter();
    const pt = (iu, iv) => { const a = (iu / NU) * Math.PI, t = (iv / NV) * Math.PI * 2;
      return new T.Vector3(Math.sin(a) * Math.cos(t), Math.cos(a), Math.sin(a) * Math.sin(t)); };
    for (let iu = 0; iu < NU; iu++) for (let iv = 0; iv < NV; iv++) {
      const P00 = pt(iu, iv), P10 = pt(iu + 1, iv), P11 = pt(iu + 1, iv + 1), P01 = pt(iu, iv + 1);
      const n = [P00, P10, P11, P01].map(p => p.clone().normalize());
      if (order === 'a_then_u') E.quad(P00, P10, P11, P01, n[0], n[1], n[2], n[3]);
      else                     E.quad(P00, P01, P11, P10, n[0], n[3], n[2], n[1]);
    }
    const g = E.geometry(E.count());
    const p = g.attributes.position;
    let agree = 0, tot = 0;
    const A = new T.Vector3(), B = new T.Vector3(), C = new T.Vector3(),
          e1 = new T.Vector3(), e2 = new T.Vector3(), fn = new T.Vector3();
    for (let i = 0; i + 2 < p.count; i += 3) {
      A.fromBufferAttribute(p, i); B.fromBufferAttribute(p, i + 1); C.fromBufferAttribute(p, i + 2);
      fn.copy(e1.subVectors(B, A).cross(e2.subVectors(C, A)));
      if (fn.lengthSq() < 1e-20) continue;
      const centroid = A.clone().add(B).add(C).multiplyScalar(1 / 3);
      tot++; if (fn.dot(centroid) > 0) agree++;
    }
    return { agree, tot, frac: agree / tot };
  }
  return { a_then_u: build('a_then_u').frac, u_then_a: build('u_then_a').frac };
});

/* ── 2/3/10 · PER-PART GEOMETRY: winding, signed volume, watertightness, ray cast ────────────── */
const CAMS = [[0,0,1],[0,0,-1],[1,0.25,0.5],[-0.7,0.4,0.6],[0.2,-0.8,0.5]];
const geom = [];
for (const flags of [{}, { cutx: true }, { cuty: true }]) {
  for (const t of [0.20, 0.33, 0.44, 0.58, 0.70, 0.90, 0.98]) {
    const r = await page.evaluate(({ t, flags, CAMS }) => {
      const T = THREE, K = window.VizKit, M = window.MB3D_MODELS['primitive-streak'];
      window.__clear();
      const g = M.build(t, Object.assign({}, M.FULL, flags));
      window.__scene.add(g);
      const rows = [];
      const A = new T.Vector3(), B = new T.Vector3(), Cv = new T.Vector3();
      const e1 = new T.Vector3(), e2 = new T.Vector3(), fn = new T.Vector3(), vn = new T.Vector3();
      g.traverse(o => {
        if (!o.isMesh || o.userData.outline) return;
        const p = o.geometry.attributes.position, n = o.geometry.attributes.normal;
        let agree = 0, tris = 0, vol = 0;
        /* THE EDGE CENSUS, AND THE TWO THINGS THE FIRST VERSION GOT WRONG.
           (a) It took the census only over NON-degenerate triangles, so wherever a sweep collapses
               to a point — every arrowhead, every tube whose radius runs to zero — the edges that
               bordered the skipped triangles came back unpaired and the part was reported leaky. 72
               of the axes triad's edges, 24 of each route's, all of them at a collapsed ring. The
               census now runs over every triangle and skips only ZERO-LENGTH edges, which are the
               degeneracy itself rather than evidence of one.
           (b) It demanded a count of exactly 2. A part whose key merges two slabs that touch face to
               face — the two membranes are the dorsal lamina AND the ventral lamina over one
               footprint, with no separation between them by definition — has coincident surfaces, so
               those edges are shared by four triangles, two from each. That is not a hole. 722 of the
               membranes' 2,662 edges read as leaks on that count alone.
           What a hole actually is: an ODD count. An edge bordered by one triangle is an open boundary
           and that is what lets a silhouette shell leak. */
        /* HALF-EDGES, WHICH IS THE TEST THE SHAPE ACTUALLY SATISFIES. Two earlier versions of this
           census both measured something other than a hole:
             · counting undirected edges over NON-degenerate triangles only reported 24 leaks per
               route arrow and 72 on the axes triad, all of them at a ring that collapses to a point
               (an arrowhead's tip). The edges were there; the triangles bordering them had been
               skipped.
             · counting undirected edges over ALL triangles then reported ODD counts at the same
               places, because a degenerate triangle with two coincident vertices contributes the
               SAME edge twice, and 1 + 2 = 3.
           A closed, consistently wound surface has every edge exactly once in each DIRECTION, and
           that statement survives both of those: degenerate triangles are skipped (they bound no
           area, so they are not part of the surface) and a part whose key merges two slabs that touch
           face to face — the two membranes are the dorsal lamina AND the ventral lamina over one
           footprint — still balances, two each way. An unbalanced edge is an open boundary, and an
           open boundary is what lets a silhouette shell leak. */
        const half = new Map();
        /* THE SIGN OF A VANISHING COORDINATE WAS THE WHOLE OF WHAT THIS CENSUS CALLED A HOLE.
           At a surface of revolution's pole the profile radius is sin(pi) = 1.22e-16 rather than 0,
           so the pole's x and z come out at plus or minus 1e-16 depending on which cos(theta)
           produced them — and (-1.2e-16).toFixed(4) is the string "-0.0000" while (1.2e-16).toFixed(4)
           is "0.0000". One point, two hash keys, and every edge through it reported unbalanced: 4 per
           revolved blob and a dozen per capped tube rim, all of them exactly on an axis. Rounding
           BEFORE formatting, and folding the resulting negative zero onto zero, is the fix. Worth
           recording because the first two readings of this probe were taken as a geometry fault and
           one of them was nearly written up as a render-kit finding. */
        const nz = v => { const r = Math.round(v * 1e4) / 1e4; return (r === 0 ? 0 : r).toFixed(4); };
        const vid = i => nz(p.getX(i)) + ',' + nz(p.getY(i)) + ',' + nz(p.getZ(i));
        for (let i = 0; i + 2 < p.count; i += 3) {
          A.set(p.getX(i), p.getY(i), p.getZ(i));
          B.set(p.getX(i+1), p.getY(i+1), p.getZ(i+1));
          Cv.set(p.getX(i+2), p.getY(i+2), p.getZ(i+2));
          fn.copy(e1.subVectors(B, A).cross(e2.subVectors(Cv, A)));
          if (fn.lengthSq() < 1e-20) continue;
          const a = vid(i), b = vid(i+1), c = vid(i+2);
          for (const [u, v] of [[a,b],[b,c],[c,a]])
            half.set(u + '>' + v, (half.get(u + '>' + v) || 0) + 1);
          vn.set(n.getX(i)+n.getX(i+1)+n.getX(i+2), n.getY(i)+n.getY(i+1)+n.getY(i+2),
                 n.getZ(i)+n.getZ(i+1)+n.getZ(i+2));
          tris++; if (fn.dot(vn) > 0) agree++;
          vol += A.dot(e1.crossVectors(B, Cv)) / 6;
        }
        let odd = 0, quad4 = 0, seen = new Set();
        for (const k of half.keys()) {
          if (seen.has(k)) continue;
          const [u, v] = k.split('>');
          const back = v + '>' + u;
          seen.add(k); seen.add(back);
          const f = half.get(k) || 0, r2 = half.get(back) || 0;
          if (f !== r2) odd++; else if (f > 1) quad4++;
        }
        rows.push({ key: o.userData.key, tris, windingAgree: tris ? agree / tris : null,
                    signedVolume: vol, unpairedEdges: odd, coincidentEdges: quad4, edges: half.size });
      });
      /* the ray cast — what faces the camera FIRST, and does it face back */
      const box = new T.Box3().setFromObject(g);
      const ctr = box.getCenter(new T.Vector3()), sz = box.getSize(new T.Vector3());
      const picks = []; g.traverse(o => { if (o.isMesh && !o.userData.outline) picks.push(o); });
      let first = 0, away = 0;
      for (const d0 of CAMS) {
        const d = new T.Vector3().fromArray(d0).normalize();
        const up = Math.abs(d.y) > 0.99 ? new T.Vector3(0,0,1) : new T.Vector3(0,1,0);
        const e1b = new T.Vector3().crossVectors(up, d).normalize();
        const e2b = new T.Vector3().crossVectors(d, e1b).normalize();
        const rc = new T.Raycaster(); rc.firstHitOnly = true;
        const R = sz.length(), N = 26;
        for (let i = 0; i < N; i++) for (let j = 0; j < N; j++) {
          const a = ((i + 0.5) / N - 0.5) * R * 0.85, b = ((j + 0.5) / N - 0.5) * R * 0.85;
          rc.set(ctr.clone().addScaledVector(d, R * 1.8).addScaledVector(e1b, a).addScaledVector(e2b, b),
                 d.clone().negate());
          const hits = rc.intersectObjects(picks, false);
          if (!hits.length || !hits[0].face) continue;
          first++;
          const nn = hits[0].face.normal.clone()
            .applyMatrix3(new T.Matrix3().getNormalMatrix(hits[0].object.matrixWorld)).normalize();
          if (nn.dot(d) < 0) away++;
        }
      }
      return { t, flags, rows, rayFirst: first, rayAway: away, state: g.userData.state };
    }, { t, flags, CAMS });
    geom.push(r);
  }
}

/* ── 1 · THE FRAMES, composed the way the player composes them ───────────────────────────────── */
const shots = [];
for (const b of beats) {
  const info = await page.evaluate(({ t, shown, cam, only }) => {
    const T = THREE, K = window.VizKit, M = window.MB3D_MODELS['primitive-streak'];
    window.__clear();
    /* a structure key is not a part key: the section variants name the same part under a flag */
    const groups = {};
    const want = [];
    for (const s of shown) {
      const ref = s.ref, plus = ref.indexOf('+');
      const flags = plus >= 0 ? ref.slice(plus + 1).split(',') : [];
      const part = ref.slice(ref.indexOf('#') + 1, plus >= 0 ? plus : undefined);
      const gk = flags.slice().sort().join(',');
      if (!groups[gk]) {
        const opts = Object.assign({}, M.FULL); flags.forEach(f => opts[f] = true);
        groups[gk] = M.build(t, opts);
      }
      want.push({ key: s.key, part, gk, opacity: s.opacity });
    }
    const holder = new T.Group();
    for (const w of want) {
      groups[w.gk].traverse(o => {
        if (!o.isMesh || o.userData.key !== w.part) return;
        const m = o.clone();
        if (w.opacity != null && w.opacity < 1) {
          m.material = m.material.clone();
          m.material.transparent = true; m.material.opacity = w.opacity; m.material.depthWrite = false;
        }
        holder.add(m);
      });
    }
    window.__scene.add(holder);
    /* the camera frames the SUBJECT box, which is state.only where the beat isolates */
    let subject = holder;
    if (only && only.length) {
      const parts = new Set(want.filter(w => only.indexOf(w.key) >= 0).map(w => w.part));
      const sg = new T.Group();
      holder.children.forEach(m => { if (parts.has(m.userData.key)) sg.add(m.clone()); });
      if (sg.children.length) { window.__scene.add(sg); sg.visible = false; subject = sg; }
    }
    const fit = K.fitCamera(window.__camera, subject, 1.06);
    const d = new T.Vector3().fromArray(window.__VIEW_DIR[cam]).normalize();
    window.__camera.position.copy(fit.centre).addScaledVector(d, fit.distance);
    window.__camera.lookAt(fit.centre);
    window.__renderer.render(window.__scene, window.__camera);
    const bb = new T.Box3().setFromObject(holder), sz = bb.getSize(new T.Vector3());
    return { meshes: holder.children.length, size: [sz.x, sz.y, sz.z] };
  }, { t: b.t, cam: b.cam, only: b.only,
       shown: b.shown.map(k => ({ key: k, ref: byKey[k].refs.procedural, opacity: byKey[k].opacity })) });
  const file = `${OUT}/beat${String(b.beat).padStart(2,'0')}_${b.cam}.png`;
  await page.locator('#c').screenshot({ path: file });
  shots.push({ beat: b.beat, t: b.t, cam: b.cam, title: b.title, file, info, shown: b.shown });
}

/* also a plain FULL build at several t, for a human to judge the whole object */
for (const t of [0.20, 0.44, 0.70, 1.0]) {
  await page.evaluate(({ t }) => {
    const T = THREE, K = window.VizKit, M = window.MB3D_MODELS['primitive-streak'];
    window.__clear();
    const g = M.build(t, Object.assign({}, M.FULL));
    window.__scene.add(g);
    const fit = K.fitCamera(window.__camera, g, 1.06);
    const d = new T.Vector3(0.30, 0.42, -1).normalize();
    window.__camera.position.copy(fit.centre).addScaledVector(d, fit.distance);
    window.__camera.lookAt(fit.centre);
    window.__renderer.render(window.__scene, window.__camera);
  }, { t });
  await page.locator('#c').screenshot({ path: `${OUT}/full_t${String(t).replace('.','_')}.png` });
}

/* ── 5 · THE ADAPTER. Every ref, at its own beat's t and flags, through viz3d.js itself ──────── */
await page.addScriptTag({ url: BASE + 'viz3d.js' });
const adapter = await page.evaluate(async ({ REFS, BASE }) => {
  window.MEDBANK_CONFIG = Object.assign({}, window.MEDBANK_CONFIG, { MODEL_BASE: BASE + 'models3d/' });
  const MB = window.MB3D;
  if (!MB || !MB.adapters || !MB.adapters.procedural) return { error: 'viz3d did not expose MB3D.adapters.procedural' };
  const ad = MB.adapters.procedural, out = [];
  for (const r of REFS) {
    try {
      const res = await ad.load(window.THREE, { key: r.key, refs: { procedural: r.ref } });
      const mesh = res && (res.mesh || res.object || res);
      const geo = mesh && mesh.geometry;
      out.push({ key: r.key, beat: r.beat, ref: r.ref, reason: res && res.reason,
                 ok: !!(geo && geo.attributes && geo.attributes.position && geo.attributes.position.count > 0),
                 verts: geo && geo.attributes && geo.attributes.position ? geo.attributes.position.count : 0 });
    } catch (e) { out.push({ key: r.key, beat: r.beat, ref: r.ref, ok: false, error: String(e && e.message) }); }
  }
  return { rows: out };
}, { REFS, BASE });

/* ── 7 · PERTURBATION, including one that must change nothing ────────────────────────────────── */
const perturb = await page.evaluate(() => {
  const M = window.MB3D_MODELS['primitive-streak'];
  const read = () => ({ dMeso: M.claimMeasure('dMeso', 0.5), dEndo: M.claimMeasure('dEndo', 0.5),
                        k: M.constants().K_DELIVERY, balance: M.claimMeasure('balance', 0.5),
                        cover: M.claimMeasure('mesoCoverFrac', 0.7) });
  const base = read(), out = [];
  for (const [name, val, mustMove] of [['hVent', 1.6, true], ['hMeso', 0.6, true],
                                       ['wMax', 1.25, true], ['dome', 2.4, false]]) {
    const before = M._setConst(name, val);
    const a = read();
    const moved = Math.abs(a.dMeso - base.dMeso) > 1e-6 || Math.abs(a.dEndo - base.dEndo) > 1e-6
               || Math.abs(a.k - base.k) > 1e-6;
    out.push({ name, val, mustMove, moved, ok: moved === mustMove,
               base: { dMeso: base.dMeso, dEndo: base.dEndo, k: base.k },
               after: { dMeso: a.dMeso, dEndo: a.dEndo, k: a.k },
               balanceStillHolds: Math.abs(a.balance - 1) < 0.02 });
    M._setConst(name, before);
  }
  M._resetCaches();
  return { rows: out, restored: read() };
});

/* ── 8 · NO TWO PARTS SHARE SPACE (3.z) ──────────────────────────────────────────────────────── */
const overlap = await page.evaluate(() => {
  const T = THREE, M = window.MB3D_MODELS['primitive-streak'];
  /* THE PARTITION, PUBLISHED BY NAME rather than hidden in a tolerance. Each entry is a pair that
     is in CONTACT by construction, with the construction named. */
  const CONSTRUCTION = [
    ['epiblast','streak','two regions of ONE dorsal lamina surface, meeting edge to edge'],
    ['epiblast','groove','ditto'], ['epiblast','node','ditto'], ['epiblast','pit','ditto'],
    ['epiblast','membranes','ditto — the membrane owns its own footprint of both laminae'],
    ['streak','groove','ditto'], ['streak','node','ditto'], ['streak','pit','ditto'],
    ['groove','node','ditto'], ['groove','pit','the same channel, groove into pit'],
    ['node','pit','the pit is the dimple in the node'],
    ['endoderm','hypoblast','two complementary patches of ONE ventral lamina, meeting at the replacement front'],
    ['endoderm','membranes','ditto'], ['hypoblast','membranes','ditto'],
    ['mesoderm','endoderm','the middle layer lies ON the lower one: its ventral face IS that layer’s dorsal face'],
    ['mesoderm','hypoblast','ditto'],
    ['mesoderm','epiblast','and its dorsal face IS the epiblast’s basal face'],
    ['mesoderm','streak','ditto'], ['mesoderm','groove','ditto'], ['mesoderm','node','ditto'],
    ['mesoderm','pit','ditto'], ['mesoderm','membranes','ditto'],
    ['ingression','epiblast','a cell mid-ingression is INSIDE the sheet it is leaving — that is what ingression is'],
    ['ingression','streak','ditto'], ['ingression','groove','ditto'], ['ingression','node','ditto'],
    ['ingression','pit','ditto'], ['ingression','mesoderm','and inside the layer it joins'],
    ['ingression','endoderm','ditto'], ['ingression','hypoblast','ditto'],
    ['endoderm_route','epiblast','an arrow drawn along the road a cell takes, through the tissue it passes'],
    ['endoderm_route','streak','ditto'], ['endoderm_route','groove','ditto'],
    ['endoderm_route','mesoderm','ditto'], ['endoderm_route','endoderm','ditto'],
    ['endoderm_route','hypoblast','ditto'], ['endoderm_route','ingression','the arrow and the cells share one path function'],
    ['mesoderm_route','epiblast','ditto'], ['mesoderm_route','streak','ditto'],
    ['mesoderm_route','groove','ditto'], ['mesoderm_route','mesoderm','ditto'],
    ['mesoderm_route','endoderm','ditto'], ['mesoderm_route','hypoblast','ditto'],
    ['mesoderm_route','ingression','ditto'], ['endoderm_route','mesoderm_route','the two roads share their first leg'],
    ['laterality','node','cilia are rooted ON the node'], ['laterality','pit','ditto'],
    ['laterality','epiblast','ditto'], ['laterality','streak','ditto'],
    /* ADDED 2026-10-02, and it is a contact that only became REACHABLE this round. The groove's last
       remnant at t = 0.98 used to be a single-row run and was dropped unbuilt; with F3's station fix it
       is built (256 triangles), and by t = 0.98 the node has regressed back onto it, so the cilia
       rooted on the node now sit in the groove as well. The pair test reported 0.1875 of the groove's
       16 sampled vertices inside the laterality group and nothing else moved. It is the same
       construction as laterality/streak and laterality/pit, which have always been named: the cilia
       are rooted on the node wherever the node has got to. */
    ['laterality','groove','ditto — at t = 0.98 the node has regressed onto the groove\'s last remnant'],
    ['notochordal_process','mesoderm','the rod lies in the space between the laminae, which the mesoderm also occupies lateral to it'],
    ['notochordal_process','ingression','the cells that enter at the pit ARE the notochordal process: a cell on that route is inside the rod it is building'],
  ];
  /* AND THE CONTACT THE FIRST VERSION OF THIS PARTITION MISSED. Outside the mesoderm's own front —
     and at the two membranes, where there is no front at all — the dorsal lamina's basal face and the
     ventral lamina's dorsal face are THE SAME SURFACE. That is what a bilaminar disc is, and it is
     the whole subject of beat 1. So every dorsal piece is in contact with every ventral piece, by
     construction, over the part of the disc gastrulation has not reached yet. The pair test reported
     4.2% on epiblast/hypoblast, which is the margin step at a coincident facet, not an overlap. */
  const DORSAL = ['epiblast','streak','groove','node','pit','membranes'];
  const VENTRAL = ['endoderm','hypoblast','membranes'];
  for (const a of DORSAL) for (const b of VENTRAL)
    if (a !== b) CONSTRUCTION.push([a, b, 'the two laminae are in contact wherever no mesoderm separates them']);
  const named = new Set();
  for (const [a, b] of CONSTRUCTION) { named.add(a + '|' + b); named.add(b + '|' + a); }
  const out = [];
  for (const t of [0.33, 0.52, 0.70, 0.98]) {
    const g = M.build(t, Object.assign({}, M.FULL));
    const parts = [];
    g.traverse(o => { if (o.isMesh && !o.userData.outline) parts.push(o); });
    const rows = [];
    for (let i = 0; i < parts.length; i++) for (let j = 0; j < parts.length; j++) {
      if (i === j) continue;
      const A = parts[i], B = parts[j];
      if (named.has(A.userData.key + '|' + B.userData.key)) continue;
      const bbA = new T.Box3().setFromObject(A), bbB = new T.Box3().setFromObject(B);
      if (!bbA.intersectsBox(bbB)) continue;
      /* ray-cast containment, with the test point stepped INTO A along its own normal by a margin,
         so a shared facet is not a coin flip */
      const MARGIN = 0.02;
      const rc = new T.Raycaster(); rc.firstHitOnly = false;
      const p = A.geometry.attributes.position, na = A.geometry.attributes.normal;
      const step = Math.max(1, Math.floor(p.count / 420));
      const dir = new T.Vector3(0.5773, 0.5774, 0.5773);
      let inside = 0, tested = 0;
      for (let k = 0; k < p.count; k += step) {
        const o = new T.Vector3(p.getX(k), p.getY(k), p.getZ(k));
        const nv = new T.Vector3(na.getX(k), na.getY(k), na.getZ(k));
        if (nv.lengthSq() < 1e-12) continue;
        o.addScaledVector(nv.normalize(), -MARGIN);
        rc.set(o, dir);
        tested++;
        if (rc.intersectObject(B, false).length % 2 === 1) inside++;
      }
      if (tested) rows.push({ pair: A.userData.key + ' in ' + B.userData.key, frac: inside / tested });
    }
    rows.sort((a, b) => b.frac - a.frac);
    out.push({ t, worst: rows.length ? rows[0] : null, checked: rows.length, top: rows.slice(0, 5) });
  }
  return { partition: CONSTRUCTION.length, rows: out };
});

/* ── 10b · WHERE THE REMAINING EDGE IMBALANCE COMES FROM, localised on the KIT, not on this model.
 *
 * RENDER-STANDARD section 6 / BUILD-TASK-PROMPT section 6: a note in a file is a claim, and a
 * disagreement between what a file says and what the repo does is the finding. This probe is four
 * calls to render-kit on a straight line with no model code anywhere near it, so whatever it reports
 * belongs to the kit. It is here rather than in a side script because a finding nobody can re-run is
 * a claim. */
const kitEdges = await page.evaluate(() => {
  const T = THREE, K = window.VizKit;
  const balance = geo => {
    const p = geo.attributes.position, half = new Map();
    const nz = v => { const r = Math.round(v * 1e4) / 1e4; return (r === 0 ? 0 : r).toFixed(4); };
    const vid = i => nz(p.getX(i)) + ',' + nz(p.getY(i)) + ',' + nz(p.getZ(i));
    let tris = 0;
    for (let i = 0; i + 2 < p.count; i += 3) {
      const A = new T.Vector3(p.getX(i), p.getY(i), p.getZ(i));
      const B = new T.Vector3(p.getX(i+1), p.getY(i+1), p.getZ(i+1));
      const C = new T.Vector3(p.getX(i+2), p.getY(i+2), p.getZ(i+2));
      const fn = new T.Vector3().subVectors(B, A).cross(new T.Vector3().subVectors(C, A));
      if (fn.lengthSq() < 1e-20) continue;
      tris++;
      const a = vid(i), b = vid(i+1), c = vid(i+2);
      for (const [u, v] of [[a,b],[b,c],[c,a]]) half.set(u + '>' + v, (half.get(u + '>' + v) || 0) + 1);
    }
    let bad = 0; const seen = new Set();
    for (const k of half.keys()) {
      if (seen.has(k)) continue;
      const [u, v] = k.split('>'); const bk = v + '>' + u;
      seen.add(k); seen.add(bk);
      if ((half.get(k) || 0) !== (half.get(bk) || 0)) bad++;
    }
    return { tris, unbalanced: bad };
  };
  const pts = []; for (let i = 0; i <= 20; i++) pts.push(new T.Vector3(0, i * 0.5, 0));
  const tip = []; for (let i = 0; i <= 6; i++) tip.push(new T.Vector3(0, i * 0.1, 0));
  const F = K.parallelFrame(pts);
  return {
    tubeAlong:            balance(K.tubeAlong(pts, () => 0.3, { ring: 12 })),
    tubeCapped_false:     balance(K.tubeCapped(pts, () => 0.3, { ring: 12, cap: false })),
    tubeCapped_end:       balance(K.tubeCapped(pts, () => 0.3, { ring: 12, cap: 'end' })),
    tubeCapped_start:     balance(K.tubeCapped(pts, () => 0.3, { ring: 12, cap: 'start' })),
    tubeCapped_both:      balance(K.tubeCapped(pts, () => 0.3, { ring: 12, cap: 'both' })),
    /* a bare dome is an open hemisphere, so its rim SHOULD be unbalanced by exactly `ring`. It is
       here as the probe's own positive control: a census that reported 0 for this would be measuring
       nothing. */
    domeCap_alone_expect12: balance(K.domeCap({ frame: F, i: 20, sign: 1, r: 0.3, ring: 12, rows: 8, flatten: 1, section: () => 1 })),
    /* ── THE FINDING. A tube whose radius reaches EXACTLY zero at one end, capped at the other, is
       non-manifold at the capped rim: three triangles on every rim edge. sweptShell writes a solid
       tube's flat end discs through triN, which drops a degenerate triangle, so a zero-radius end
       gets no disc; stripFlatCap then fails its own `pos.count === hull + 6 * ring` assertion and
       returns the geometry UNSTRIPPED, leaving the start's flat disc coincident under the start's
       dome. That is the defect tubeCapped exists to remove, reappearing wherever a tube comes to a
       point — every arrowhead in this corpus. Reported, not fixed: render-kit is shared by every
       model and this is a review's call. The same tube with its tip blunted to a tenth of its radius
       is clean, which is the workaround this model takes. */
    tipZero_capStart_FINDING:   balance(K.tubeCapped(tip, u => 0.21 * (1 - u), { ring: 12, cap: 'start' })),
    tipZero_capFalse_clean:     balance(K.tubeCapped(tip, u => 0.21 * (1 - u), { ring: 12, cap: false })),
    tipBlunt10pc_capStart_clean: balance(K.tubeCapped(tip, u => 0.21 * (1 - 0.9 * u), { ring: 12, cap: 'start' })),
  };
});

/* ── 9 · EVERY BEAT CHANGES THE PICTURE ──────────────────────────────────────────────────────── */
const PNG = {};
for (const s of shots) PNG[s.beat] = readFileSync(s.file);
const sameAsPrev = [], identicalPairs = [];
for (let i = 1; i < shots.length; i++)
  if (PNG[shots[i].beat].equals(PNG[shots[i-1].beat])) sameAsPrev.push(shots[i].beat);
for (let i = 0; i < shots.length; i++) for (let j = i + 1; j < shots.length; j++)
  if (PNG[shots[i].beat].equals(PNG[shots[j].beat])) identicalPairs.push([shots[i].beat, shots[j].beat]);

/* ── the model's own battery, run here as well as at build time ──────────────────────────────── */
const acc = await page.evaluate(() => {
  const M = window.MB3D_MODELS['primitive-streak'];
  M._resetCaches();
  const a = M.acceptance(), n = M.negatives();
  return { pass: a.pass, fails: a.fails, measured: JSON.parse(JSON.stringify(a.measured)),
           rows: a.rows.map(r => ({ id: r.id, pass: r.pass, value: r.value, must: r.must })),
           negatives: { pass: n.pass, rejected: n.rows.filter(x => x.rejected).length, of: n.rows.length,
                        notRejected: n.rows.filter(x => !x.rejected).map(x => x.id) },
           constants: M.constants(), axes: M.AXES, axesProved: M.axesProved };
});

/* ───────────────────────────── 11 · THE REGION ROWS MUST FAIL ON THE DEFECT THEY REPLACED
 *
 * The controls are generated from models3d/primitive-streak.js AS IT STANDS, by the two substitutions
 * that undo the F1 fix, so they cannot drift out of agreement with the file under test. If either
 * substitution stops matching, that is reported as a failure rather than skipped — a control that
 * silently did not apply is a green light bought for nothing.
 */
const REGION_ROWS = ['K2', 'K3', 'L1', 'L2'];
const CTRL_DIR = path.join(ROOT, 'viz-training', 'models-out', 'primitive-streak', '_controls');
mkdirSync(CTRL_DIR, { recursive: true });
const liveSrc = readFileSync('models3d/primitive-streak.js', 'utf8');
const SUBS = {
  mask: [`function membFade(r) {
  const a = Math.abs(r);
  if (a <= 1) return 1;
  if (a >= 1 + MEMB_FADE) return 0;
  return bump((a - 1) / MEMB_FADE);
}`, 'function membFade(r) { return bump(r); }'],
  maskR075: [`function membFade(r) {
  const a = Math.abs(r);
  if (a <= 1) return 1;
  if (a >= 1 + MEMB_FADE) return 0;
  return bump((a - 1) / MEMB_FADE);
}`, `function membFade(r) {
  const a = Math.abs(r), r0 = 0.75;
  if (a <= r0) return 1;
  if (a >= 1) return 0;
  return bump((a - r0) / (1 - r0));
}`],
  region: ['  out.mesoderm = lanesMid(Math.max(mN, xm), xM);', '  out.mesoderm = lanesMid(mN, xM);'],
  quad:   ['    const inner = Math.max(mN, xm);', '    const inner = mN;'],
  /* ── AND THE ONE THAT UNDOES F3, 2026-10-02 ──────────────────────────────────────────────────────
   * One substitution: the dorsal lamina goes back to being swept over ROW CENTRES ONLY, which is how
   * every sheet in this corpus was swept before this round and is the construction F3 was found in.
   * Row P3 is only worth having if it FAILS on that, so this control requires it to. Generated from
   * the live file for the same reason as the others — a stored copy of the old construction would
   * drift out of agreement with the model and then prove nothing about it. */
  rowStationsOnly: ['    const STY = fam.landmarks ? familyStations(fns) : rowStations();',
                    '    const STY = rowStations();'],
};
const controls = [
  { name: 'prefix', label: 'the construction round 1 found: cone mask AND the old mesoderm lane edge',
    subs: ['mask', 'region', 'quad'], mustFail: REGION_ROWS },
  { name: 'r075', label: "the fix exactly as the review worded it: a plateau to r0 = 0.75, not to the rim",
    subs: ['maskR075'], mustFail: ['L1'] },
  { name: 'rowsOnly', label: 'the construction round 3 found F3 in: the dorsal lamina swept over row centres only',
    subs: ['rowStationsOnly'], mustFail: ['P3'] },
];
const controlRows = [];
for (const c of controls) {
  let src = liveSrc, applied = true;
  for (const k of c.subs) {
    const [from, to] = SUBS[k];
    const n = src.split(from).length - 1;
    if (n !== 1) { applied = false; controlRows.push({ name: c.name, error: 'substitution ' + k + ' matched ' + n + ' times, expected 1' }); break; }
    src = src.replace(from, to);
  }
  if (!applied) continue;
  const rel = 'viz-training/models-out/primitive-streak/_controls/ps-' + c.name + '.js';
  writeFileSync(path.join(ROOT, rel), src);
  const pg = await browser.newPage();
  const cerr = [];
  pg.on('pageerror', e => cerr.push(e.message));
  await pg.setContent('<!doctype html><html><body></body></html>');
  await pg.addScriptTag({ url: BASE + 'viz-training/spike/three.min.js' });
  await pg.addScriptTag({ url: BASE + 'models3d/render-kit.js' });
  await pg.addScriptTag({ url: BASE + rel });
  const r = await pg.evaluate(() => {
    const M = window.MB3D_MODELS['primitive-streak'];
    const a = M.acceptance();
    const o = M.membraneRegionReport(1, 'oro'), cl = M.membraneRegionReport(1, 'clo');
    return { fails: a.fails, worstMesoOro: +o.worstMeso.toFixed(5), worstMesoClo: +cl.worstMeso.toFixed(5),
             gapOro: +o.worstGap.toFixed(5), layersOro: [o.layersMin, o.layersMax] };
  });
  await pg.close();
  const missed = c.mustFail.filter(id => r.fails.indexOf(id) < 0);
  controlRows.push({ name: c.name, label: c.label, fails: r.fails, mustFail: c.mustFail, missed,
                     worstMesoOro: r.worstMesoOro, worstMesoClo: r.worstMesoClo,
                     gapOro: r.gapOro, layersOro: r.layersOro, pageErrors: cerr.length });
}

await browser.close(); server.close();

/* ─────────────────────────────────────── report ─────────────────────────────────────── */
const noise = consoleEvents.filter(e => DRIVER_NOISE.test(e));
const real = consoleEvents.filter(e => !DRIVER_NOISE.test(e));
const worstWinding = Math.min.apply(null, geom.flatMap(g => g.rows.map(r => r.windingAgree)));
const negVolumes = geom.flatMap(g => g.rows.filter(r => r.signedVolume <= 0)
  .map(r => `${r.key} @t=${g.t} ${JSON.stringify(g.flags)} vol=${r.signedVolume.toFixed(4)}`));
const leaky = geom.flatMap(g => g.rows.filter(r => r.unpairedEdges > 0)
  .map(r => `${r.key} @t=${g.t} ${JSON.stringify(g.flags)} unbalanced=${r.unpairedEdges}/${r.edges}`));
const coincident = geom.flatMap(g => g.rows.filter(r => r.coincidentEdges > 0)
  .map(r => `${r.key} @t=${g.t} ${JSON.stringify(g.flags)} shared-by-four=${r.coincidentEdges}/${r.edges}`));
const rayAway = geom.reduce((a, g) => a + g.rayAway, 0);
const rayFirst = geom.reduce((a, g) => a + g.rayFirst, 0);
const badRefs = (adapter.rows || []).filter(r => !r.ok);
const worstOverlap = Math.max.apply(null, overlap.rows.map(r => r.worst ? r.worst.frac : 0));

/* CHECK 10 IS NOT SCOPED. An earlier revision of this file scoped it away from the four parts built
   out of render-kit tubes, on the strength of a reading that turned out to be this census's own
   negative-zero bug; once that was fixed, a bare capped tube measured 0 and the remaining imbalance
   had one cause, localised by probe 10b and worked around in the model. Every part this model builds
   is now closed, and the probe keeps the kit finding runnable so it is a measurement rather than a
   note in a log. */
const leakyOwn = leaky;
const leakyKit = [];
const report = {
  scene: SCENE, model: 'models3d/primitive-streak.js', out: OUT,
  check1_renders: { frames: shots.length + 4, beats: shots.map(s => ({ beat: s.beat, t: s.t, cam: s.cam, meshes: s.info.meshes, file: s.file })) },
  check2_console: { real: real.length, realEvents: real.slice(0, 12), driverNoiseFiltered: noise.length },
  check3_normals: {
    worstFaceVsVertexWinding: worstWinding,
    partsWithNonPositiveSignedVolume: negVolumes,
    rayFirstHits: rayFirst, rayFirstHitsFacingAway: rayAway,
  },
  check5_adapter: { refs: (adapter.rows || []).length, failing: badRefs, error: adapter.error,
                    structuresShownInNoBeat: unshown },
  check6_windingProbe: winding,
  check7_perturbation: perturb,
  check8_overlap: { partitionPairsNamed: overlap.partition, worstUnnamedInsideFrac: worstOverlap, perT: overlap.rows },
  check9_everyBeatChangesThePicture: { identicalToPrevious: sameAsPrev, identicalPairsAnywhere: identicalPairs },
  check10_watertight: { leakyOwnGeometry: leakyOwn, leakyKitTubes: leakyKit,
                        coincidentSurfaces: coincident.slice(0, 20), coincidentCount: coincident.length },
  check10b_kitEdgeFinding: kitEdges,
  acceptance: acc,
};
writeFileSync(`${OUT}/proof.json`, JSON.stringify(report, null, 1));

const fails = [];
if (real.length) fails.push('console not clean: ' + real.length + ' event(s)');
if (!(worstWinding >= 0.9999)) fails.push('winding: worst face/vertex agreement ' + worstWinding);
if (negVolumes.length) fails.push('signed volume non-positive on ' + negVolumes.length + ' part(s)');
if (rayAway !== 0) fails.push('ray cast: ' + rayAway + ' of ' + rayFirst + ' first hits face away');
if (leakyOwn.length) fails.push('not watertight: ' + leakyOwn.length + ' part(s): ' + leakyOwn.slice(0,4).join('; '));
/* the probe has to keep saying what it says, or the workaround above is resting on nothing */
if (kitEdges.tubeAlong.unbalanced !== 0 || kitEdges.tubeCapped_both.unbalanced !== 0)
  fails.push('probe 10b: a plain kit tube is unbalanced, so this census is measuring its own hashing again');
if (kitEdges.domeCap_alone_expect12.unbalanced !== 12)
  fails.push('probe 10b positive control: an OPEN hemisphere did not read as open');
if (kitEdges.tipZero_capStart_FINDING.unbalanced === 0 || kitEdges.tipBlunt10pc_capStart_clean.unbalanced !== 0)
  fails.push('probe 10b: the render-kit finding no longer reproduces as stated — re-read it before trusting the workaround');
if (badRefs.length || adapter.error) fails.push('adapter: ' + (adapter.error || badRefs.length + ' ref(s) did not resolve'));
if (!(winding.a_then_u > 0.999 && winding.u_then_a < 0.001)) fails.push('winding probe did not resolve the convention');
if (perturb.rows.some(r => !r.ok)) fails.push('perturbation: ' + perturb.rows.filter(r => !r.ok).map(r => r.name).join(','));
if (worstOverlap > 0.02) fails.push('unnamed pair shares space: ' + worstOverlap.toFixed(4));
if (sameAsPrev.length || identicalPairs.length) fails.push('a beat does not change the picture');
if (!acc.pass) fails.push('acceptance: ' + acc.fails.join(','));
if (!acc.negatives.pass) fails.push('negatives not rejected: ' + acc.negatives.notRejected.join(','));
if (unshown.length) fails.push('structures shown in no beat: ' + unshown.join(','));

for (const r of controlRows) {
  if (r.error) fails.push('control ' + r.name + ': ' + r.error);
  else if (r.missed.length) fails.push('control ' + r.name + ' did NOT fail ' + r.missed.join(',') +
    ' — the region rows do not catch the defect they were written for');
  else if (r.pageErrors) fails.push('control ' + r.name + ' threw: ' + r.pageErrors);
}


console.log(JSON.stringify({
  regionControls: controlRows,
  worstWinding, rayFirst, rayAway, leaky: leaky.length, negVolumes: negVolumes.length,
  refs: (adapter.rows||[]).length, badRefs: badRefs.length, console: real.length,
  driverNoise: noise.length, windingProbe: winding, worstOverlap,
  perturbation: perturb.rows.map(r => ({ name: r.name, mustMove: r.mustMove, moved: r.moved })),
  identicalFrames: identicalPairs, acceptance: acc.pass, negatives: acc.negatives.pass,
  unshown,
}, null, 1));
console.log(fails.length ? 'PROOF FAILED:\n  - ' + fails.join('\n  - ') : 'ALL ELEVEN CHECKS PASS');
process.exit(fails.length ? 1 : 0);
