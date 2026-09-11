#!/usr/bin/env node
/* MedBank · viz-training/tools/split-mesh-at-plane.mjs
 *
 * Cut one binary STL into two closed solids at an axis-aligned plane.
 *
 * WHY THIS EXISTS. BodyParts3D segments the sacrum and the coccyx as a single object, FMA16202. The
 * coccyx is therefore in the corpus — 145.3 mm of bone where a sacrum is 100-115 — but it has no id
 * of its own, so a scene cannot show it, hide it or isolate it. It was reachable only as an anchor,
 * which drew a marker over it instead of letting a student look at the bone.
 *
 * The alternative was to build a procedural coccyx. That was rejected, and correctly: it would have
 * drawn a hand-made tailbone INTO the same space as real scan data already on screen, replacing four
 * segments and a pair of cornua with a plausible wedge. RENDER-STANDARD section 5 exists to stop
 * exactly that. Splitting keeps the scan.
 *
 * THE CUT MUST PRODUCE CLOSED SOLIDS, NOT TWO OPEN SHELLS. Assigning each triangle wholly to one side
 * by its centroid is a two-line version of this tool and it is wrong twice: every triangle straddling
 * the plane lands on one side, so the seam is ragged at triangle scale, and both halves are left open
 * at the cut. An open shell shades its interior through the hole, fails the outward-normals probe
 * that RENDER-STANDARD requires, and a student who isolates the coccyx sees straight into it. So:
 *   1. triangles crossing the plane are SPLIT, producing new vertices exactly on it;
 *   2. the resulting section outline is traced into loops and each loop is capped;
 *   3. the cap's winding is opposite on the two halves, because the same hole faces opposite ways.
 *
 * THE BOUNDING BOX IS NOT SACRED HERE, and that is the one difference from decimate-meshes.mjs. That
 * tool freezes the box because landmark anchors are uvw fractions of it. This tool deliberately makes
 * two NEW boxes, so any anchor authored against FMA16202 must be re-derived against whichever piece
 * now carries it. The tool prints both boxes so that work is possible rather than guessed at.
 *
 *   node viz-training/tools/split-mesh-at-plane.mjs <in.stl> --axis z --at 825.5 \
 *        --lower coccyx.stl --upper sacrum.stl
 *
 * Flags:
 *   --axis x|y|z   plane normal (default z)
 *   --at N         where the plane sits, in the mesh's own units
 *   --lower FILE   write everything below the plane here
 *   --upper FILE   write everything above it here
 *   --report       measure and print, write nothing
 *
 * Node 18+. No dependencies.
 */
import { readFileSync, writeFileSync } from 'node:fs';

const argv = process.argv.slice(2);
const val = (f, d) => { const i = argv.indexOf(f); return i < 0 ? d : argv[i + 1]; };
const IN = argv.find(a => !a.startsWith('--') && a.endsWith('.stl'));
const AXIS = ({ x: 0, y: 1, z: 2 })[String(val('--axis', 'z')).toLowerCase()];
const AT = Number(val('--at', NaN));
const LOWER = val('--lower', null);
const UPPER = val('--upper', null);
const REPORT = argv.includes('--report');

if (!IN || AXIS === undefined || !Number.isFinite(AT)) {
  console.error('split-mesh-at-plane: need <in.stl> --axis x|y|z --at <number>. See the header.');
  process.exit(2);
}

/* ------------------------------------------------------------------- read */
function readSTL(p) {
  const b = readFileSync(p);
  const n = b.readUInt32LE(80);
  const tris = [];
  for (let i = 0; i < n; i++) {
    const o = 84 + i * 50;
    tris.push([
      [b.readFloatLE(o + 12), b.readFloatLE(o + 16), b.readFloatLE(o + 20)],
      [b.readFloatLE(o + 24), b.readFloatLE(o + 28), b.readFloatLE(o + 32)],
      [b.readFloatLE(o + 36), b.readFloatLE(o + 40), b.readFloatLE(o + 44)]
    ]);
  }
  return tris;
}
function writeSTL(p, tris) {
  const b = Buffer.alloc(84 + tris.length * 50);
  b.write('MedBank split of a BodyParts3D mesh. (c) DBCLS, CC-BY-SA 2.1 JP.', 0, 'ascii');
  b.writeUInt32LE(tris.length, 80);
  tris.forEach((t, i) => {
    const o = 84 + i * 50;
    const n = normal(t);
    b.writeFloatLE(n[0], o); b.writeFloatLE(n[1], o + 4); b.writeFloatLE(n[2], o + 8);
    for (let v = 0; v < 3; v++) for (let c = 0; c < 3; c++) b.writeFloatLE(t[v][c], o + 12 + v * 12 + c * 4);
  });
  writeFileSync(p, b);
}
const sub = (a, b) => [a[0] - b[0], a[1] - b[1], a[2] - b[2]];
function normal(t) {
  const u = sub(t[1], t[0]), v = sub(t[2], t[0]);
  const n = [u[1] * v[2] - u[2] * v[1], u[2] * v[0] - u[0] * v[2], u[0] * v[1] - u[1] * v[0]];
  const L = Math.hypot(n[0], n[1], n[2]) || 1;
  return [n[0] / L, n[1] / L, n[2] / L];
}

/* ------------------------------------------------------------------- split */
const EPS = 1e-7;
const d = v => v[AXIS] - AT;
/* Where the segment a→b crosses the plane. Computed from the two signed distances rather than by
   marching, so the point lands EXACTLY on the plane and the two halves share it bit-for-bit — which
   is what lets the caps meet the walls with no crack. */
function cross(a, b) {
  const t = d(a) / (d(a) - d(b));
  const p = [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t, a[2] + (b[2] - a[2]) * t];
  p[AXIS] = AT;
  return p;
}

const below = [], above = [], seam = [];   // seam: directed edges of the section, as seen from below
function emit(side, tri) { (side < 0 ? below : above).push(tri); }

for (const t of readSTL(IN)) {
  const ds = t.map(d);
  const nb = ds.filter(x => x < -EPS).length, na = ds.filter(x => x > EPS).length;
  if (na === 0) { emit(-1, t); continue; }
  if (nb === 0) { emit(+1, t); continue; }

  /* One vertex is alone on its side of the plane; the other two share the far side. Find it. */
  let i = 0;
  for (let k = 0; k < 3; k++) if ((ds[k] > 0) !== (ds[(k + 1) % 3] > 0) && (ds[k] > 0) !== (ds[(k + 2) % 3] > 0)) i = k;
  const A = t[i], B = t[(i + 1) % 3], C = t[(i + 2) % 3];
  const P = cross(A, B), Q = cross(A, C);
  const aSide = ds[i] > 0 ? +1 : -1;
  emit(aSide, [A, P, Q]);                 // the lone corner keeps one triangle
  emit(-aSide, [P, B, C]);                // the far side becomes a quad, as two triangles
  emit(-aSide, [P, C, Q]);
  /* The section edge, oriented so that walking it keeps the solid on a consistent side. */
  seam.push(aSide > 0 ? [Q, P] : [P, Q]);
}

/* --------------------------------------------------------------- cap loops */
const key = p => p[0].toFixed(5) + ',' + p[1].toFixed(5) + ',' + p[2].toFixed(5);
function loopsFrom(edges) {
  const next = new Map();
  for (const [a, b] of edges) { const k = key(a); if (!next.has(k)) next.set(k, []); next.get(k).push([a, b]); }
  const used = new Set(), loops = [];
  for (const [a0, b0] of edges) {
    const e0 = key(a0) + '>' + key(b0);
    if (used.has(e0)) continue;
    const loop = [a0]; used.add(e0);
    let cur = b0, guard = 0;
    while (guard++ < edges.length + 5) {
      loop.push(cur);
      const outs = (next.get(key(cur)) || []).filter(([a, b]) => !used.has(key(a) + '>' + key(b)));
      if (!outs.length) break;
      const [a, b] = outs[0]; used.add(key(a) + '>' + key(b));
      if (key(b) === key(a0)) break;
      cur = b;
    }
    if (loop.length >= 3) loops.push(loop);
  }
  return loops;
}
/* Fan from the loop's own centroid. The section here is a handful of small, convex-ish outlines —
   145.3 mm of sacrum meets its coccyx across 147 mm^2 — so a fan is honest. It would NOT be for a
   deeply re-entrant section, and this is the line to revisit if this tool is ever pointed at one. */
function capTriangles(loop, flip) {
  const c = [0, 0, 0];
  for (const p of loop) { c[0] += p[0]; c[1] += p[1]; c[2] += p[2]; }
  c[0] /= loop.length; c[1] /= loop.length; c[2] /= loop.length; c[AXIS] = AT;
  const out = [];
  for (let i = 0; i < loop.length; i++) {
    const a = loop[i], b = loop[(i + 1) % loop.length];
    if (key(a) === key(b)) continue;
    out.push(flip ? [c, b, a] : [c, a, b]);
  }
  return out;
}

/* WHICH WAY EACH CAP FACES, and how that was settled.

   The lower half's cut face is its TOP, so its outward normal is +axis; the upper half's cut face is
   its BOTTOM, so its outward normal is -axis. They are opposites, which is why their contributions
   cancel when you add the two halves back together — and that cancellation is a trap, because it
   holds whether or not the pair is the right way round. The first version of this had both flags
   inverted: the halves still summed to exactly the source volume, 194,116.9, and looked correct.

   The signed-volume probe is what caught it. Measured on FMA16202 at z = 825.5, all four
   combinations of the two flags:

     below=false above=false   -71,828.6   188,786.5      lower inside-out
     below=false above=true    -71,828.6   265,945.5      lower inside-out, upper bigger than the whole
     below=true  above=false     5,330.4   188,786.5   <- both positive, and they sum to the source
     below=true  above=true      5,330.4   265,945.5      upper bigger than the whole

   Only one row is physically possible: two positive volumes that add up to the original. 5.3 cm3 of
   coccyx and 188.8 cm3 of sacrum. Do not "simplify" these flags by reasoning about winding — rerun
   the probe. */
const loops = loopsFrom(seam);
const capsBelow = loops.flatMap(l => capTriangles(l, true));
const capsAbove = loops.flatMap(l => capTriangles(l, false));

/* ------------------------------------------------------------------ report */
function bbox(tris) {
  const lo = [Infinity, Infinity, Infinity], hi = [-Infinity, -Infinity, -Infinity];
  for (const t of tris) for (const p of t) for (let c = 0; c < 3; c++) { if (p[c] < lo[c]) lo[c] = p[c]; if (p[c] > hi[c]) hi[c] = p[c]; }
  return { lo, hi, size: [hi[0] - lo[0], hi[1] - lo[1], hi[2] - lo[2]] };
}
/* Signed volume via the divergence theorem. Positive means the surface is closed and wound outward —
   the same probe RENDER-STANDARD requires of a new model, applied here to prove the cap actually
   sealed the hole rather than merely covering it. */
function signedVolume(tris) {
  let v = 0;
  for (const [a, b, c] of tris) v += (a[0] * (b[1] * c[2] - b[2] * c[1]) - a[1] * (b[0] * c[2] - b[2] * c[0]) + a[2] * (b[0] * c[1] - b[1] * c[0])) / 6;
  return v;
}
const L = below.concat(capsBelow), U = above.concat(capsAbove);
const bl = bbox(L), bu = bbox(U);
const ax = 'xyz'[AXIS];
const f = n => n.toFixed(1);

console.log(`cut ${IN} at ${ax} = ${AT}`);
console.log(`section: ${loops.length} loop(s), ${seam.length} edges`);
console.log(`lower  ${L.length} tri (${below.length} wall + ${capsBelow.length} cap)  ${ax}-extent ${f(bl.lo[AXIS])}–${f(bl.hi[AXIS])} = ${f(bl.size[AXIS])}  volume ${f(signedVolume(L))}`);
console.log(`upper  ${U.length} tri (${above.length} wall + ${capsAbove.length} cap)  ${ax}-extent ${f(bu.lo[AXIS])}–${f(bu.hi[AXIS])} = ${f(bu.size[AXIS])}  volume ${f(signedVolume(U))}`);
/* Both halves positive AND summing to the source is the only combination a real split can produce.
   Either check alone passes for a wrongly-wound pair; together they do not. */
const vL = signedVolume(L), vU = signedVolume(U), vSrc = signedVolume(readSTL(IN));
const closed = Math.abs((vL + vU) - vSrc) < Math.abs(vSrc) * 1e-6;
if (vL <= 0 || vU <= 0) console.log('FAIL: a non-positive volume means that half is inside-out or open — do not ship it.');
else if (!closed) console.log(`FAIL: halves sum to ${f(vL + vU)} but the source is ${f(vSrc)} — the cut is not watertight.`);
else console.log(`OK: both halves closed and outward, and they sum to the source (${f(vSrc)}).`);
console.log(`ANCHORS: both halves have NEW bounding boxes. Any anchor.uvw authored against ${IN} must be`);
console.log('re-derived against whichever half now carries it, or it will move.');

if (REPORT) { console.log('(--report: nothing written)'); process.exit(0); }
if (LOWER) { writeSTL(LOWER, L); console.log('wrote ' + LOWER); }
if (UPPER) { writeSTL(UPPER, U); console.log('wrote ' + UPPER); }
if (!LOWER && !UPPER) console.log('(no --lower/--upper given: nothing written)');
