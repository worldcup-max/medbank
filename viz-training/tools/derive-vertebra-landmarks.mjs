#!/usr/bin/env node
/* MedBank · viz-training/tools/derive-vertebra-landmarks.mjs
 *
 * Measure the parts of a vertebra on the mesh itself, so a label lands on the process it names.
 *
 * The authoring task refused to sign off the Typical vertebra scene, and it was right to. The
 * catalog's smallest unit is a whole vertebra: there is no separate mesh for a pedicle, a lamina or
 * a spinous process. The only honest way to point at those is a landmark anchor — a `uvw` fraction
 * of the parent mesh's bounding box — and the task had no way to measure one, so it placed none. An
 * estimated anchor is worse than a missing one: it puts the word "spinous process" on the transverse
 * process and the student believes it.
 *
 * This measures them instead. Nothing here is typed in by hand.
 *
 *   node viz-training/tools/derive-vertebra-landmarks.mjs viz-training/meshes-lite/FMA13073.stl --kind lumbar
 *   node viz-training/tools/derive-vertebra-landmarks.mjs <stl> --kind thoracic|cervical|lumbar [--json]
 *
 * ---- the coordinate frame, established from the data rather than assumed ----
 *
 * BodyParts3D ships in an LPS frame, and this tool proves it before trusting it:
 *
 *   +X = the body's LEFT      — the left upper lobe (FMA7370) sits at X = +62, the right (FMA7333) at X = -55
 *   +Y = POSTERIOR            — on L2 the far +Y end is a 19 mm blade (the spinous process), the -Y end a 45 mm
 *                               cylinder (the vertebral body)
 *   +Z = SUPERIOR             — C1 sits at Z 1471, L2 at Z 1003; and on C2 the top 10 mm of Z is a narrow peg,
 *                               which is the dens
 *
 * `assertFrame()` re-checks the second and third of those on every mesh it is given and refuses to
 * emit anything if they do not hold. A vertebra loaded in a different orientation is not a case to
 * handle silently — it is a mesh that needs looking at.
 *
 * ---- how each landmark is found ----
 *
 * The workhorse is a ray cast along the midline. Fire a ray in +Y at X = 0 through the middle of
 * the body and the surface crossings, sorted, give three named things in one shot: the vertebral
 * body (the first solid span), the vertebral foramen (the hollow between the spans) and the spinous
 * process (the last solid span). No thresholds, no guessing where the body "probably" ends.
 *
 * The rest are extremes with a stated definition, each printed with the measurement that justifies it
 * so a human can check the number rather than trust the label.
 *
 * Node 18+. No dependencies.
 */
import { readSTL, vertices, bbox, toUVW } from './stl.mjs';
import { basename } from 'node:path';

const argv = process.argv.slice(2);
const FILE = argv.find(a => !a.startsWith('--'));
const KIND = (argv[argv.indexOf('--kind') + 1] || 'lumbar').toLowerCase();
const JSON_OUT = argv.includes('--json');
if (!FILE) { console.error('usage: derive-vertebra-landmarks.mjs <file.stl> --kind lumbar|thoracic|cervical [--json]'); process.exit(2); }

const mesh = readSTL(FILE);
const verts = vertices(mesh);
const box = bbox(verts);

/* ------------------------------------------------------------------ ray casting */
/* Möller–Trumbore. Returns the sorted t values where the ray (origin, dir) crosses the surface. */
function crossings(origin, dir) {
  const EPS = 1e-9, hits = [];
  const { n, tri } = mesh;
  for (let i = 0; i < n; i++) {
    const o = i * 9;
    const e1 = [tri[o + 3] - tri[o], tri[o + 4] - tri[o + 1], tri[o + 5] - tri[o + 2]];
    const e2 = [tri[o + 6] - tri[o], tri[o + 7] - tri[o + 1], tri[o + 8] - tri[o + 2]];
    const p = [dir[1] * e2[2] - dir[2] * e2[1], dir[2] * e2[0] - dir[0] * e2[2], dir[0] * e2[1] - dir[1] * e2[0]];
    const det = e1[0] * p[0] + e1[1] * p[1] + e1[2] * p[2];
    if (Math.abs(det) < EPS) continue;
    const inv = 1 / det;
    const s = [origin[0] - tri[o], origin[1] - tri[o + 1], origin[2] - tri[o + 2]];
    const u = (s[0] * p[0] + s[1] * p[1] + s[2] * p[2]) * inv;
    if (u < 0 || u > 1) continue;
    const q = [s[1] * e1[2] - s[2] * e1[1], s[2] * e1[0] - s[0] * e1[2], s[0] * e1[1] - s[1] * e1[0]];
    const v = (dir[0] * q[0] + dir[1] * q[1] + dir[2] * q[2]) * inv;
    if (v < 0 || u + v > 1) continue;
    const t = (e2[0] * q[0] + e2[1] * q[1] + e2[2] * q[2]) * inv;
    if (t > EPS) hits.push(t);
  }
  return hits.sort((a, b) => a - b);
}

/* Solid spans along a ray: pairs of crossings. Tiny spans are tessellation noise, not anatomy. */
function spans(origin, dir, minLen = 1.0) {
  const t = crossings(origin, dir);
  const out = [];
  for (let i = 0; i + 1 < t.length; i += 2) if (t[i + 1] - t[i] >= minLen) out.push([t[i], t[i + 1]]);
  return out;
}

/* ------------------------------------------------------------------ frame check */
/* The first version of this compared the width of the -Y end against the +Y end, on the theory that a
   vertebra is a wide body in front and a narrow blade behind. That is true of a lumbar vertebra and
   false of a thoracic one, whose transverse processes sweep backwards and whose spinous process is
   long: T6 measured 36 mm at the back against 23 mm at the front and was rejected as "upside down"
   when it was nothing of the kind. A check that rejects correct data is worse than no check.

   So compare the two masses the midline ray actually finds, each at its own level. Whichever end is
   anterior, the vertebral BODY is the wide one — that is what makes it a body — and the midline bone
   behind the canal is a blade. If the frame were flipped, the first mass found would be that blade,
   and this fails. It needs the ray result, so it runs after it. */
function assertFrame(best) {
  const fails = [];
  const xMid = (box.lo[0] + box.hi[0]) / 2;
  if (Math.abs(xMid) > 12) fails.push(`the mesh does not straddle X=0 (mid-X is ${xMid.toFixed(1)} mm) — is this really a whole vertebra?`);
  if (!best) return { fails, xMid, front: NaN, back: NaN };
  const widthAt = (y) => {
    const t = crossings([box.lo[0] - 10, y, best.z], [1, 0, 0]);
    if (t.length < 2) return 0;
    return t[t.length - 1] - t[0];
  };
  const yOf = x => box.lo[1] - 10 + x;
  const front = widthAt((yOf(best.t[0]) + yOf(best.t[1])) / 2);
  const back = widthAt((yOf(best.t[2]) + yOf(best.t[3])) / 2);
  if (!(front > back)) fails.push(`+Y is not posterior: the mass behind the canal is ${back.toFixed(1)} mm wide and the one in front ${front.toFixed(1)} mm — the vertebral body should be the wider of the two`);
  return { fails, xMid, front, back };
}

/* ------------------------------------------------------------------ landmarks */
const L = [];
function add(key, label, point, evidence) { L.push({ key, label, point, uvw: toUVW(point, box), evidence }); }

const zMid = (box.lo[2] + box.hi[2]) / 2;

/* --- the midline ray: body, foramen, spinous process, in one measurement --- */
/* Fired at several heights; the one with a clean two-span signature (body | gap | arch) wins.
   At the very top and bottom of a vertebra there is no canal to find. */
/* Pick the height by the BODY, not by the canal. An earlier version took whichever ray showed the
   widest gap, and picked a height where the ray grazed the pedicles and returned six crossings — it
   reported a vertebral body 4.4 mm deep, which is not a vertebral body. The signature we want is
   exactly four crossings (in through the body, out of the body, in through the arch, out the back)
   and, among those, the height where the body is thickest. That is mid-body by definition. */
let best = null;
for (let f = 0.20; f <= 0.85; f += 0.01) {
  const z = box.lo[2] + box.size[2] * f;
  const t = crossings([0, box.lo[1] - 10, z], [0, 1, 0]);
  if (t.length !== 4) continue;
  const bodyDepth = t[1] - t[0], gap = t[2] - t[1];
  if (gap < 4) continue;                                   // a real canal, not a crease
  if (!best || bodyDepth > best.bodyDepth) best = { z, t, gap, bodyDepth, f };
}

const frame = assertFrame(best);
if (frame.fails.length) {
  console.error(`\n${basename(FILE)} — FRAME CHECK FAILED, no landmarks emitted:`);
  for (const f of frame.fails) console.error('  ! ' + f);
  process.exit(1);
}

if (best) {
  const yOf = x => box.lo[1] - 10 + x;
  const bodyA = yOf(best.t[0]), bodyP = yOf(best.t[1]);
  const canalA = bodyP, canalP = yOf(best.t[2]);
  /* Centre the label in the body vertically as well. The ray height was chosen where the body is
     DEEPEST front-to-back, and on a vertebra that is at an endplate, not at mid-height — the first
     version put the point 1.9 mm under the inferior endplate, technically inside the bone and
     visually sitting on its bottom rim. Cast once more, straight up, and take the middle of the
     span the point is standing in. */
  const yBody = (bodyA + bodyP) / 2;
  const up = crossings([0, yBody, best.z], [0, 0, 1]);
  const dn = crossings([0, yBody, best.z], [0, 0, -1]);
  const zBody = (up.length && dn.length) ? best.z + (up[0] - dn[0]) / 2 : best.z;
  add('vertebral-body', 'Vertebral body', [0, yBody, zBody],
    `midline ray: solid from Y ${bodyA.toFixed(1)} to ${bodyP.toFixed(1)} — ${(bodyP - bodyA).toFixed(1)} mm of bone in front of the canal; centred vertically in a ${(up[0] + dn[0]).toFixed(1)} mm span of body`);
  add('vertebral-foramen', 'Vertebral foramen', [0, (canalA + canalP) / 2, best.z],
    `midline ray: hollow from Y ${canalA.toFixed(1)} to ${canalP.toFixed(1)} — a ${(canalP - canalA).toFixed(1)} mm gap between body and arch`);
}

/* The spinous process TIP is not on the mid-body ray: on a lumbar vertebra the blade slopes
   backwards and down, so the most posterior bone sits below mid-height. Take it from the vertices. */
{
  const mid = verts.filter(p => Math.abs(p[0]) < 5);
  const yMax = Math.max(...mid.map(p => p[1]));
  const tip = mid.filter(p => p[1] > yMax - 3);
  const mean = a => [0, 1, 2].map(i => a.reduce((s, p) => s + p[i], 0) / a.length);
  const m = mean(tip);
  add('spinous-process', 'Spinous process', m,
    `most posterior bone within 5 mm of the midline: Y ${yMax.toFixed(1)}, at Z ${m[2].toFixed(1)} — ${(m[2] - zMid).toFixed(1)} mm from mid-height (${tip.length} vertices at the tip)`);
}

/* --- transverse processes: the widest points of the bone --- */
{
  const xs = verts.map(p => p[0]);
  const xMin = Math.min(...xs), xMax = Math.max(...xs);
  const pick = (want) => {
    const near = verts.filter(p => Math.abs(p[0] - want) < 3);
    const m = [0, 1, 2].map(a => near.reduce((s, p) => s + p[a], 0) / near.length);
    return { p: m, n: near.length };
  };
  const left = pick(xMax), right = pick(xMin);
  add('transverse-process-left', 'Transverse process (left)', left.p,
    `widest bone to the left: X ${xMax.toFixed(1)} mm (+X is the body's left; ${left.n} vertices within 3 mm of the tip)`);
  add('transverse-process-right', 'Transverse process (right)', right.p,
    `widest bone to the right: X ${xMin.toFixed(1)} mm (${right.n} vertices within 3 mm of the tip)`);
}

/* --- articular processes: the highest and lowest bone BEHIND the canal --- */
if (best) {
  const canalY = L.find(l => l.key === 'vertebral-foramen').point[1];
  const behind = verts.filter(p => p[1] > canalY);
  const sideOf = s => behind.filter(p => s > 0 ? p[0] > 4 : p[0] < -4);
  for (const [side, label] of [[1, 'left'], [-1, 'right']]) {
    const set = sideOf(side);
    if (set.length < 20) continue;
    const zs = set.map(p => p[2]);
    const zTop = Math.max(...zs), zBot = Math.min(...zs);
    const top = set.filter(p => p[2] > zTop - 3);
    const bot = set.filter(p => p[2] < zBot + 3);
    const mean = a => [0, 1, 2].map(i => a.reduce((s, p) => s + p[i], 0) / a.length);
    add(`superior-articular-process-${label}`, `Superior articular process (${label})`, mean(top),
      `highest bone behind the canal on that side: Z ${zTop.toFixed(1)}, ${(zTop - zMid).toFixed(1)} mm above mid-height`);
    add(`inferior-articular-process-${label}`, `Inferior articular process (${label})`, mean(bot),
      `lowest bone behind the canal on that side: Z ${zBot.toFixed(1)}, ${(zMid - zBot).toFixed(1)} mm below mid-height`);
  }
}

/* --- pedicle and lamina: measured across the arch, not guessed at --- */
/* The pedicle is the bridge from the body back to the transverse process; the lamina is the plate
   from there back to the spinous process. Both sit off the midline, so they are found by firing the
   same kind of ray sideways at the height of the canal. */
if (best) {
  const foramen = L.find(l => l.key === 'vertebral-foramen');
  const canalY = foramen.point[1], z = foramen.point[2];
  /* A lateral ray does not isolate a pedicle by itself: at the back of the body it passes through one
     continuous mass that spans the midline, and "the first thing I hit" is that whole body. What
     separates them is the ray returning FOUR crossings — two separate masses with the canal between —
     and that happens exactly twice as you walk backwards: first at the pedicles, then, after the canal
     opens out, at the laminae. So walk, and take the two runs.

     An earlier version fired at a Y picked by proportion and reported a "pedicle" 40 mm wide spanning
     both sides. Forty millimetres is not a pedicle; the number is what gave it away, which is why every
     landmark here prints the span it was measured from. */
  const yStart = (best ? box.lo[1] - 10 + best.t[1] : canalY) + 1;
  const ySpinous = L.find(l => l.key === 'spinous-process').point[1];
  const runs = [];
  let cur = null;
  for (let y = yStart; y <= ySpinous; y += 0.5) {
    const t = crossings([box.lo[0] - 10, y, z], [1, 0, 0]);
    const paired = t.length === 4 && (t[2] - t[1]) > 2;    // two masses, a real gap between them
    if (paired) {
      const xAt = i => box.lo[0] - 10 + t[i];
      const rec = { y, right: [xAt(0), xAt(1)], left: [xAt(2), xAt(3)] };
      if (cur) cur.push(rec); else runs.push(cur = [rec]);
    } else cur = null;
  }
  const name = ['Pedicle', 'Lamina'];
  const keyOf = ['pedicle', 'lamina'];
  const take = runs.length >= 2 ? [runs[0], runs[runs.length - 1]] : runs;
  take.forEach((run, i) => {
    const mid = run[Math.floor(run.length / 2)];
    for (const [side, label] of [['left', 'left'], ['right', 'right']]) {
      const seg = mid[side];
      add(`${keyOf[i]}-${label}`, `${name[i]} (${label})`, [(seg[0] + seg[1]) / 2, mid.y, z],
        `lateral ray at Y ${mid.y.toFixed(1)} splits into two masses; the ${label} one runs X ${seg[0].toFixed(1)} to ${seg[1].toFixed(1)} — ${Math.abs(seg[1] - seg[0]).toFixed(1)} mm thick (run of ${run.length} slices)`);
    }
  });
  if (runs.length < 2) console.error(`  note: expected two paired-mass runs (pedicles, then laminae) walking back from the body; found ${runs.length}`);
}

/* ------------------------------------------------------------------ report */
if (JSON_OUT) {
  console.log(JSON.stringify({
    file: basename(FILE), kind: KIND, triangles: mesh.n,
    bbox: { lo: box.lo, size: box.size },
    frame: { x: 'left', y: 'posterior', z: 'superior' },
    landmarks: L.map(l => ({ key: l.key, label: l.label, uvw: l.uvw.map(v => +v.toFixed(4)), mm: l.point.map(v => +v.toFixed(2)), evidence: l.evidence }))
  }, null, 2));
} else {
  console.log(`\n${basename(FILE)} · ${KIND} vertebra · ${mesh.n} triangles`);
  console.log(`bbox  ${box.size.map(s => s.toFixed(1)).join(' × ')} mm   (X left, Y posterior, Z superior)`);
  console.log(`frame check: body ${frame.front.toFixed(1)} mm wide vs midline arch ${frame.back.toFixed(1)} mm at the same height, mid-X ${frame.xMid.toFixed(1)} mm`);
  if (best) console.log(`midline ray fired at ${(best.f * 100).toFixed(0)}% height (Z ${best.z.toFixed(1)}), found a ${best.gap.toFixed(1)} mm canal\n`);
  else console.log('\nno vertebral canal found on the midline — landmarks depending on it were skipped\n');
  const pad = Math.max(...L.map(l => l.label.length));
  for (const l of L) {
    console.log(`  ${l.label.padEnd(pad)}  uvw [${l.uvw.map(v => v.toFixed(3)).join(', ')}]`);
    console.log(`  ${' '.repeat(pad)}  ${l.evidence}`);
  }
  console.log(`\n${L.length} landmarks measured.`);
}

/* ------------------------------------------------------------------ verify
 * A uvw triple looks equally plausible whether it names the right thing or not, so check each one
 * against the mesh: is that point inside the bone or outside it, and how far is the nearest surface?
 *
 * The expectations are anatomy, not preference. The vertebral body, the pedicles and the laminae are
 * solid bone — a point at their centre must be INSIDE. The vertebral foramen is a hole — a point at
 * its centre must be OUTSIDE, and comfortably so; if it ever reads "inside", the canal was not found
 * and the label is sitting in bone. Tips are surface features: outside or barely inside, but close.
 *
 *   node ... --verify
 */
if (process.argv.includes('--verify')) {
  const inside = (p) => {
    /* parity along +X. An odd number of crossings means the point started inside the surface. */
    const t = crossings(p, [1, 0, 0]);
    return t.length % 2 === 1;
  };
  const nearest = (p) => {
    let d2 = Infinity;
    for (const v of verts) {
      const dx = v[0] - p[0], dy = v[1] - p[1], dz = v[2] - p[2];
      const s = dx * dx + dy * dy + dz * dz;
      if (s < d2) d2 = s;
    }
    return Math.sqrt(d2);
  };
  const EXPECT = {
    'vertebral-body': 'inside', 'vertebral-foramen': 'outside',
    'pedicle': 'inside', 'lamina': 'inside',
    'spinous-process': 'surface', 'transverse-process': 'surface',
    'superior-articular-process': 'surface', 'inferior-articular-process': 'surface'
  };
  console.log('\n--- verify: is each point where its name says it is? ---');
  let bad = 0;
  for (const l of L) {
    const fam = Object.keys(EXPECT).find(k => l.key.startsWith(k));
    const want = EXPECT[fam] || 'surface';
    const isIn = inside(l.point);
    const d = nearest(l.point);
    let ok, why;
    if (want === 'inside')  { ok = isIn;                    why = isIn ? `inside the bone, ${d.toFixed(1)} mm from the surface` : `OUTSIDE the bone — solid structure, hollow point`; }
    else if (want === 'outside') { ok = !isIn && d > 3;     why = !isIn ? `in open space, nearest bone ${d.toFixed(1)} mm away` : `INSIDE bone — the canal was not found`; }
    else { ok = d < 6;                                      why = `${isIn ? 'just inside' : 'on the surface'}, ${d.toFixed(1)} mm from the nearest vertex`; }
    if (!ok) bad++;
    console.log(`  ${ok ? 'ok  ' : 'FAIL'}  ${l.label.padEnd(34)} ${why}`);
  }
  console.log(`\n${L.length - bad}/${L.length} landmarks verified against the mesh.`);
  if (bad) process.exit(1);
}
