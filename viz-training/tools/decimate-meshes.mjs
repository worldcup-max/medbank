#!/usr/bin/env node
/* MedBank · viz-training/tools/decimate-meshes.mjs
 *
 * Make the meshes small enough for a phone on Nigerian mobile data.
 *
 * BodyParts3D ships research-grade triangle counts. Measured against the live archive on 2026-08-25 the
 * arm scene is ~15 MB across nine files — the scapula alone is 5.4 MB at 113,256 triangles — and two of the
 * nine took over 40 seconds to arrive. At the distance a student actually views these, that detail is
 * invisible: the silhouette carries the teaching, not the triangle density.
 *
 *   node viz-training/tools/decimate-meshes.mjs viz-training/meshes/*.stl --target 20000
 *   node viz-training/tools/decimate-meshes.mjs viz-training/meshes --target 20000 --out viz-training/meshes-lite
 *
 * Flags:
 *   --target N     triangles to aim for per mesh (default 20000). Meshes already under it are copied as-is.
 *   --out DIR      where to write (default: alongside the input, suffixed -lite)
 *   --ratio R      alternative to --target: keep this fraction of triangles (e.g. 0.2)
 *   --report       print the table and write nothing
 *   --verify       measure how far the surface actually moved, in mm, and fail if it moves too far
 *   --max-dev MM   the deviation ceiling --verify enforces (default 0.5 mm)
 *
 * THE BOUNDING BOX IS SACRED. Landmark anchors in the scenes are stored as `uvw` fractions of the parent
 * mesh's bounding box — supraglenoid tubercle is [0.254, 0.311, 0.863] of the scapula's box, not a vertex
 * id. If decimation moves the box by a millimetre, every landmark on that bone silently moves with it and
 * the calibration measured by contact (supraglenoid↔coracoid 24.1 mm) quietly stops being true. So every
 * vertex that touches an extreme of the box is frozen: a collapse involving one must land exactly on it, or
 * it is refused. The tool then asserts the box is bit-identical before writing, and refuses the file if not.
 *
 * Method: quadric error metric edge collapse (Garland & Heckbert). Each vertex accumulates the squared
 * distance to the planes of its faces; collapsing an edge picks whichever of {v0, v1, midpoint} adds least
 * error. Collapses that flip a face normal are refused, which is what stops thin structures — the long head
 * tendon, the coracoid — from folding through themselves.
 *
 * Node 18+. No dependencies.
 */
import { readFileSync, writeFileSync, existsSync, mkdirSync, statSync, readdirSync } from 'node:fs';
import { join, dirname, basename, extname } from 'node:path';

/* ------------------------------------------------------------------ args */
const argv = process.argv.slice(2);
const flag = (name, dflt) => { const i = argv.indexOf('--' + name); return i < 0 ? dflt : argv[i + 1]; };
const has = name => argv.includes('--' + name);
const inputs = argv.filter((a, i) => !a.startsWith('--') && !(i > 0 && argv[i - 1].startsWith('--') && !['report'].includes(argv[i - 1].slice(2))));

const TARGET = parseInt(flag('target', '20000'), 10);
const RATIO = flag('ratio', null) ? parseFloat(flag('ratio', null)) : null;
const OUTDIR = flag('out', null);
const REPORT_ONLY = has('report');
const VERIFY = has('verify');
const MAX_DEV = parseFloat(flag('max-dev', '0.5'));

if (!inputs.length) {
  console.log('usage: node viz-training/tools/decimate-meshes.mjs <file.stl|dir> [...] [--target 20000] [--out DIR]');
  process.exit(2);
}

/* ------------------------------------------------------------------ STL io */
function readBinarySTL(path) {
  const buf = readFileSync(path);
  if (buf.length < 84) throw new Error('too short to be a binary STL');
  const n = buf.readUInt32LE(80);
  if (buf.length < 84 + n * 50) throw new Error(`header claims ${n} triangles but the file holds ${(buf.length - 84) / 50}`);
  const pos = new Float64Array(n * 9);
  for (let t = 0; t < n; t++) {
    const o = 84 + t * 50 + 12;
    for (let k = 0; k < 9; k++) pos[t * 9 + k] = buf.readFloatLE(o + k * 4);
  }
  return pos;
}

function writeBinarySTL(path, verts, tris, header) {
  const n = tris.length / 3;
  const buf = Buffer.alloc(84 + n * 50);
  buf.write((header || 'MedBank decimated BodyParts3D (CC-BY-SA 2.1 JP, (c) DBCLS)').slice(0, 79), 0, 'latin1');
  buf.writeUInt32LE(n, 80);
  let o = 84;
  for (let t = 0; t < n; t++) {
    const a = tris[t * 3] * 3, b = tris[t * 3 + 1] * 3, c = tris[t * 3 + 2] * 3;
    const ax = verts[a], ay = verts[a + 1], az = verts[a + 2];
    const bx = verts[b], by = verts[b + 1], bz = verts[b + 2];
    const cx = verts[c], cy = verts[c + 1], cz = verts[c + 2];
    const ux = bx - ax, uy = by - ay, uz = bz - az;
    const vx = cx - ax, vy = cy - ay, vz = cz - az;
    let nx = uy * vz - uz * vy, ny = uz * vx - ux * vz, nz = ux * vy - uy * vx;
    const len = Math.hypot(nx, ny, nz) || 1; nx /= len; ny /= len; nz /= len;
    buf.writeFloatLE(nx, o); buf.writeFloatLE(ny, o + 4); buf.writeFloatLE(nz, o + 8);
    buf.writeFloatLE(ax, o + 12); buf.writeFloatLE(ay, o + 16); buf.writeFloatLE(az, o + 20);
    buf.writeFloatLE(bx, o + 24); buf.writeFloatLE(by, o + 28); buf.writeFloatLE(bz, o + 32);
    buf.writeFloatLE(cx, o + 36); buf.writeFloatLE(cy, o + 40); buf.writeFloatLE(cz, o + 44);
    buf.writeUInt16LE(0, o + 48);
    o += 50;
  }
  writeFileSync(path, buf);
  return buf.length;
}

/* ------------------------------------------------------------------ weld */
/* STL is a triangle soup: the scapula's 113k triangles carry 340k vertices of which only ~57k are distinct.
   Welding is what turns it into a mesh with edges, and edges are what a collapse operates on. */
function weld(pos, eps) {
  const map = new Map();
  const verts = [];
  const tris = new Int32Array(pos.length / 3);
  const q = 1 / eps;
  for (let i = 0; i < pos.length / 3; i++) {
    const x = pos[i * 3], y = pos[i * 3 + 1], z = pos[i * 3 + 2];
    const key = Math.round(x * q) + ',' + Math.round(y * q) + ',' + Math.round(z * q);
    let id = map.get(key);
    if (id === undefined) { id = verts.length / 3; verts.push(x, y, z); map.set(key, id); }
    tris[i] = id;
  }
  return { verts: Float64Array.from(verts), tris };
}

function bbox(verts, live) {
  const lo = [Infinity, Infinity, Infinity], hi = [-Infinity, -Infinity, -Infinity];
  for (let v = 0; v < verts.length / 3; v++) {
    if (live && !live[v]) continue;
    for (let k = 0; k < 3; k++) {
      const c = verts[v * 3 + k];
      if (c < lo[k]) lo[k] = c;
      if (c > hi[k]) hi[k] = c;
    }
  }
  return { lo, hi };
}

/* ------------------------------------------------------- stray fragments
   Source meshes carry junk. FMA7333 (right lung, upper lobe) is 30,398 triangles in three pieces: the
   lobe, and two 2-triangle specks a tenth of a millimetre across sitting 34 mm away — scanner noise that
   was never anatomy. Decimation deletes them, correctly. But a naive deviation measurement then samples
   those specks' own vertices, finds the nearest surviving surface 34 mm away, and reports 34 mm of
   "surface movement" on a lobe whose mean movement is 0.024 mm.

   That number is not wrong, it is misattributed, and misattribution is worse than noise: it refused a
   good mesh and the obvious workaround — raising the ceiling past 34 mm — would have disabled the gate
   for every real defect too. So specks are identified, excluded from the gate, and REPORTED. A component
   only counts as a speck if it is a rounding error next to the model; anything bigger that gets dropped
   is real damage and still fails. */
function components(verts, tris) {
  const nv = verts.length / 3;
  const parent = new Int32Array(nv);
  for (let i = 0; i < nv; i++) parent[i] = i;
  const find = a => { while (parent[a] !== a) { parent[a] = parent[parent[a]]; a = parent[a]; } return a; };
  const union = (a, b) => { a = find(a); b = find(b); if (a !== b) parent[b] = a; };
  const nt = tris.length / 3;
  for (let t = 0; t < nt; t++) { union(tris[t * 3], tris[t * 3 + 1]); union(tris[t * 3 + 1], tris[t * 3 + 2]); }
  const box = new Map(), count = new Map();
  for (let t = 0; t < nt; t++) {
    const r = find(tris[t * 3]);
    count.set(r, (count.get(r) || 0) + 1);
    let e = box.get(r);
    if (!e) { e = [Infinity, Infinity, Infinity, -Infinity, -Infinity, -Infinity]; box.set(r, e); }
    for (let s = 0; s < 3; s++) {
      const v = tris[t * 3 + s] * 3;
      for (let k = 0; k < 3; k++) { if (verts[v + k] < e[k]) e[k] = verts[v + k]; if (verts[v + k] > e[3 + k]) e[3 + k] = verts[v + k]; }
    }
  }
  return { find, count, box, roots: [...count.keys()] };
}

/* ------------------------------------------------------------------ heap */
class Heap {
  constructor() { this.a = []; }
  get size() { return this.a.length; }
  push(item) {
    const a = this.a; a.push(item);
    let i = a.length - 1;
    while (i > 0) { const p = (i - 1) >> 1; if (a[p].cost <= a[i].cost) break; [a[p], a[i]] = [a[i], a[p]]; i = p; }
  }
  pop() {
    const a = this.a; if (!a.length) return null;
    const top = a[0], last = a.pop();
    if (a.length) {
      a[0] = last; let i = 0;
      for (;;) {
        const l = i * 2 + 1, r = l + 1; let m = i;
        if (l < a.length && a[l].cost < a[m].cost) m = l;
        if (r < a.length && a[r].cost < a[m].cost) m = r;
        if (m === i) break;
        [a[m], a[i]] = [a[i], a[m]]; i = m;
      }
    }
    return top;
  }
}

/* ------------------------------------------------------------------ QEM */
const Q = 10;                                        // symmetric 4x4 stored as 10 floats

function addPlaneQuadric(q, base, a, b, c, d, w) {
  q[base + 0] += w * a * a; q[base + 1] += w * a * b; q[base + 2] += w * a * c; q[base + 3] += w * a * d;
  q[base + 4] += w * b * b; q[base + 5] += w * b * c; q[base + 6] += w * b * d;
  q[base + 7] += w * c * c; q[base + 8] += w * c * d;
  q[base + 9] += w * d * d;
}

function quadricError(q, base, x, y, z) {
  return q[base + 0] * x * x + 2 * q[base + 1] * x * y + 2 * q[base + 2] * x * z + 2 * q[base + 3] * x
       + q[base + 4] * y * y + 2 * q[base + 5] * y * z + 2 * q[base + 6] * y
       + q[base + 7] * z * z + 2 * q[base + 8] * z
       + q[base + 9];
}

function simplify(verts, tris, targetTris) {
  const nv = verts.length / 3;
  let nt = tris.length / 3;

  const quad = new Float64Array(nv * Q);
  const triLive = new Uint8Array(nt).fill(1);
  const vertLive = new Uint8Array(nv).fill(1);
  const incident = Array.from({ length: nv }, () => new Set());

  /* face quadrics, area-weighted so a big flat plate outvotes a sliver */
  for (let t = 0; t < nt; t++) {
    const i = tris[t * 3], j = tris[t * 3 + 1], k = tris[t * 3 + 2];
    incident[i].add(t); incident[j].add(t); incident[k].add(t);
    const ax = verts[i * 3], ay = verts[i * 3 + 1], az = verts[i * 3 + 2];
    const ux = verts[j * 3] - ax, uy = verts[j * 3 + 1] - ay, uz = verts[j * 3 + 2] - az;
    const vx = verts[k * 3] - ax, vy = verts[k * 3 + 1] - ay, vz = verts[k * 3 + 2] - az;
    let nx = uy * vz - uz * vy, ny = uz * vx - ux * vz, nz = ux * vy - uy * vx;
    const area2 = Math.hypot(nx, ny, nz);
    if (area2 < 1e-12) { triLive[t] = 0; nt--; continue; }
    nx /= area2; ny /= area2; nz /= area2;
    const d = -(nx * ax + ny * ay + nz * az);
    const w = area2 / 2;
    for (const v of [i, j, k]) addPlaneQuadric(quad, v * Q, nx, ny, nz, d, w);
  }

  /* THE BOUNDING BOX IS SACRED — freeze every vertex that defines it.
     Landmark anchors are uvw fractions of this box; if it moves, they move. */
  const box = bbox(verts, vertLive);
  const span = Math.max(box.hi[0] - box.lo[0], box.hi[1] - box.lo[1], box.hi[2] - box.lo[2]);
  const pinEps = span * 1e-9;
  const pinned = new Uint8Array(nv);
  for (let v = 0; v < nv; v++) {
    for (let k = 0; k < 3; k++) {
      if (Math.abs(verts[v * 3 + k] - box.lo[k]) <= pinEps || Math.abs(verts[v * 3 + k] - box.hi[k]) <= pinEps) { pinned[v] = 1; break; }
    }
  }

  /* candidate collapse position: whichever of the two endpoints or the midpoint costs least.
     A pinned endpoint forces the answer — the collapse must land exactly on it or not happen at all. */
  function best(v0, v1) {
    const cand = [];
    if (pinned[v0] && pinned[v1]) return null;                      // never merge two box-defining vertices
    if (pinned[v0]) cand.push([verts[v0 * 3], verts[v0 * 3 + 1], verts[v0 * 3 + 2]]);
    else if (pinned[v1]) cand.push([verts[v1 * 3], verts[v1 * 3 + 1], verts[v1 * 3 + 2]]);
    else {
      cand.push([verts[v0 * 3], verts[v0 * 3 + 1], verts[v0 * 3 + 2]]);
      cand.push([verts[v1 * 3], verts[v1 * 3 + 1], verts[v1 * 3 + 2]]);
      cand.push([(verts[v0 * 3] + verts[v1 * 3]) / 2, (verts[v0 * 3 + 1] + verts[v1 * 3 + 1]) / 2, (verts[v0 * 3 + 2] + verts[v1 * 3 + 2]) / 2]);
    }
    let bp = null, bc = Infinity;
    for (const p of cand) {
      const c = quadricError(quad, v0 * Q, p[0], p[1], p[2]) + quadricError(quad, v1 * Q, p[0], p[1], p[2]);
      if (c < bc) { bc = c; bp = p; }
    }
    return { cost: bc, p: bp };
  }

  /* unique undirected edges */
  const heap = new Heap();
  const version = new Int32Array(nv);
  const seen = new Set();
  function pushEdge(v0, v1) {
    if (v0 === v1) return;
    const a = Math.min(v0, v1), b = Math.max(v0, v1);
    const key = a * nv + b;
    if (seen.has(key)) return;
    seen.add(key);
    const r = best(a, b);
    if (!r) return;
    heap.push({ v0: a, v1: b, cost: r.cost, p: r.p, s0: version[a], s1: version[b] });
  }
  for (let t = 0; t < nt + 1 && t < tris.length / 3; t++) {
    if (!triLive[t]) continue;
    const i = tris[t * 3], j = tris[t * 3 + 1], k = tris[t * 3 + 2];
    pushEdge(i, j); pushEdge(j, k); pushEdge(k, i);
  }

  /* would this collapse turn a face inside out? thin structures depend on this refusal */
  function flips(v, other, px, py, pz) {
    for (const t of incident[v]) {
      if (!triLive[t]) continue;
      const i = tris[t * 3], j = tris[t * 3 + 1], k = tris[t * 3 + 2];
      if (i === other || j === other || k === other) continue;      // this face dies in the collapse
      const P = (id) => id === v ? [px, py, pz] : [verts[id * 3], verts[id * 3 + 1], verts[id * 3 + 2]];
      const a = P(i), b = P(j), c = P(k);
      const u = [b[0] - a[0], b[1] - a[1], b[2] - a[2]], w = [c[0] - a[0], c[1] - a[1], c[2] - a[2]];
      const nn = [u[1] * w[2] - u[2] * w[1], u[2] * w[0] - u[0] * w[2], u[0] * w[1] - u[1] * w[0]];
      const A = [verts[i * 3], verts[i * 3 + 1], verts[i * 3 + 2]];
      const B = [verts[j * 3], verts[j * 3 + 1], verts[j * 3 + 2]];
      const C = [verts[k * 3], verts[k * 3 + 1], verts[k * 3 + 2]];
      const u0 = [B[0] - A[0], B[1] - A[1], B[2] - A[2]], w0 = [C[0] - A[0], C[1] - A[1], C[2] - A[2]];
      const n0 = [u0[1] * w0[2] - u0[2] * w0[1], u0[2] * w0[0] - u0[0] * w0[2], u0[0] * w0[1] - u0[1] * w0[0]];
      const dot = nn[0] * n0[0] + nn[1] * n0[1] + nn[2] * n0[2];
      const m1 = Math.hypot(...nn), m0 = Math.hypot(...n0);
      if (m1 < 1e-14) return true;                                   // collapsed to a sliver
      if (dot / (m1 * m0) < 0.1) return true;                        // >~84° swing: a fold
    }
    return false;
  }

  let live = nt;
  while (live > targetTris && heap.size) {
    const e = heap.pop();
    const { v0, v1 } = e;
    if (!vertLive[v0] || !vertLive[v1]) continue;
    if (version[v0] !== e.s0 || version[v1] !== e.s1) continue;      // stale: an endpoint moved since
    const [px, py, pz] = e.p;
    if (flips(v0, v1, px, py, pz) || flips(v1, v0, px, py, pz)) continue;

    /* v1 merges into v0 */
    verts[v0 * 3] = px; verts[v0 * 3 + 1] = py; verts[v0 * 3 + 2] = pz;
    if (pinned[v1]) pinned[v0] = 1;
    for (let k = 0; k < Q; k++) quad[v0 * Q + k] += quad[v1 * Q + k];
    vertLive[v1] = 0;

    for (const t of incident[v1]) {
      if (!triLive[t]) continue;
      const i = tris[t * 3], j = tris[t * 3 + 1], k = tris[t * 3 + 2];
      if (i === v0 || j === v0 || k === v0) { triLive[t] = 0; live--; continue; }
      for (let s = 0; s < 3; s++) if (tris[t * 3 + s] === v1) tris[t * 3 + s] = v0;
      incident[v0].add(t);
    }
    incident[v1].clear();
    version[v0]++; version[v1]++;

    /* re-cost the ring around the new vertex */
    const ring = new Set();
    for (const t of incident[v0]) {
      if (!triLive[t]) continue;
      for (let s = 0; s < 3; s++) { const id = tris[t * 3 + s]; if (id !== v0 && vertLive[id]) ring.add(id); }
    }
    for (const id of ring) {
      const r = best(v0, id);
      if (r) heap.push({ v0: Math.min(v0, id), v1: Math.max(v0, id), cost: r.cost, p: r.p, s0: version[Math.min(v0, id)], s1: version[Math.max(v0, id)] });
    }
  }

  /* compact */
  const remap = new Int32Array(nv).fill(-1);
  const outV = [];
  for (let v = 0; v < nv; v++) if (vertLive[v]) { remap[v] = outV.length / 3; outV.push(verts[v * 3], verts[v * 3 + 1], verts[v * 3 + 2]); }
  const outT = [];
  for (let t = 0; t < tris.length / 3; t++) {
    if (!triLive[t]) continue;
    const i = remap[tris[t * 3]], j = remap[tris[t * 3 + 1]], k = remap[tris[t * 3 + 2]];
    if (i < 0 || j < 0 || k < 0 || i === j || j === k || i === k) continue;
    outT.push(i, j, k);
  }
  return { verts: Float64Array.from(outV), tris: Int32Array.from(outT), box };
}

/* ------------------------------------------------------------------ verify
   A triangle count is not evidence. This measures the thing that actually matters: how far the surface
   moved, in millimetres, by taking points off the ORIGINAL mesh and finding the closest point on the
   decimated one. Reported as max and mean, and as a fraction of the model's own span so the number means
   something without knowing the bone. --max-dev makes it a gate rather than a note. */
function pointToTri(p, ax, ay, az, bx, by, bz, cx, cy, cz) {
  const abx = bx - ax, aby = by - ay, abz = bz - az;
  const acx = cx - ax, acy = cy - ay, acz = cz - az;
  const apx = p[0] - ax, apy = p[1] - ay, apz = p[2] - az;
  const d1 = abx * apx + aby * apy + abz * apz, d2 = acx * apx + acy * apy + acz * apz;
  if (d1 <= 0 && d2 <= 0) return Math.hypot(apx, apy, apz);
  const bpx = p[0] - bx, bpy = p[1] - by, bpz = p[2] - bz;
  const d3 = abx * bpx + aby * bpy + abz * bpz, d4 = acx * bpx + acy * bpy + acz * bpz;
  if (d3 >= 0 && d4 <= d3) return Math.hypot(bpx, bpy, bpz);
  const cpx = p[0] - cx, cpy = p[1] - cy, cpz = p[2] - cz;
  const d5 = abx * cpx + aby * cpy + abz * cpz, d6 = acx * cpx + acy * cpy + acz * cpz;
  if (d6 >= 0 && d5 <= d6) return Math.hypot(cpx, cpy, cpz);
  const nx = aby * acz - abz * acy, ny = abz * acx - abx * acz, nz = abx * acy - aby * acx;
  const nl = Math.hypot(nx, ny, nz) || 1;
  return Math.abs((apx * nx + apy * ny + apz * nz) / nl);
}

function deviation(srcPos, verts, tris, samples, speckTri) {
  /* bucket the decimated triangles so each sample only tests its neighbourhood */
  const b = bbox(verts, null);
  const span = Math.max(b.hi[0] - b.lo[0], b.hi[1] - b.lo[1], b.hi[2] - b.lo[2]) || 1;
  const G = 24, cell = span / G;
  const grid = new Map();
  const key = (i, j, k) => i + ',' + j + ',' + k;
  const cellOf = (x, y, z) => [Math.min(G - 1, Math.max(0, Math.floor((x - b.lo[0]) / cell))),
                               Math.min(G - 1, Math.max(0, Math.floor((y - b.lo[1]) / cell))),
                               Math.min(G - 1, Math.max(0, Math.floor((z - b.lo[2]) / cell)))];
  /* Register each triangle in EVERY cell its bounding box overlaps, not just the three cells its corners
     land in. This matters more than it looks. The search below stops early once it has a hit closer than
     the nearest unsearched shell (`bestD < r * cell`) — a bound that is only sound if a triangle can be
     found from any cell it passes through. Decimation makes triangles large: bucket one by its corners
     alone and a sample point sitting in the middle of a wide triangle cannot see it, so the search settles
     for something further away and the early exit locks that wrong answer in.

     That bug reported 34 mm of movement on a lung that had barely moved (mean 0.008 mm), and the tool
     refused three perfectly good meshes because of it. It fails safe — a missed triangle can only make the
     distance look bigger, never smaller — but a verifier that cries wolf gets overridden, and then it is
     worth nothing at all. */
  for (let t = 0; t < tris.length / 3; t++) {
    let lo0 = Infinity, lo1 = Infinity, lo2 = Infinity, hi0 = -Infinity, hi1 = -Infinity, hi2 = -Infinity;
    for (let s = 0; s < 3; s++) {
      const v = tris[t * 3 + s] * 3;
      if (verts[v] < lo0) lo0 = verts[v];       if (verts[v] > hi0) hi0 = verts[v];
      if (verts[v + 1] < lo1) lo1 = verts[v + 1]; if (verts[v + 1] > hi1) hi1 = verts[v + 1];
      if (verts[v + 2] < lo2) lo2 = verts[v + 2]; if (verts[v + 2] > hi2) hi2 = verts[v + 2];
    }
    const [i0, j0, k0] = cellOf(lo0, lo1, lo2);
    const [i1, j1, k1] = cellOf(hi0, hi1, hi2);
    for (let i = i0; i <= i1; i++) for (let j = j0; j <= j1; j++) for (let k = k0; k <= k1; k++) {
      const kk = key(i, j, k);
      if (!grid.has(kk)) grid.set(kk, []);
      grid.get(kk).push(t);
    }
  }
  const nSrc = srcPos.length / 9;
  const step = Math.max(1, Math.floor(nSrc / samples));
  let max = 0, sum = 0, n = 0, speckMax = 0, speckN = 0;
  for (let t = 0; t < nSrc; t += step) {
    const p = [srcPos[t * 9], srcPos[t * 9 + 1], srcPos[t * 9 + 2]];
    const [ci, cj, ck] = cellOf(p[0], p[1], p[2]);
    let bestD = Infinity;
    for (let r = 1; r <= G; r++) {                             // widening shell until something is found
      for (let i = ci - r; i <= ci + r; i++) for (let j = cj - r; j <= cj + r; j++) for (let k = ck - r; k <= ck + r; k++) {
        if (r > 1 && Math.abs(i - ci) < r && Math.abs(j - cj) < r && Math.abs(k - ck) < r) continue;
        const list = grid.get(key(i, j, k)); if (!list) continue;
        for (const tt of list) {
          const a = tris[tt * 3] * 3, bb2 = tris[tt * 3 + 1] * 3, c = tris[tt * 3 + 2] * 3;
          const d = pointToTri(p, verts[a], verts[a + 1], verts[a + 2], verts[bb2], verts[bb2 + 1], verts[bb2 + 2], verts[c], verts[c + 1], verts[c + 2]);
          if (d < bestD) bestD = d;
        }
      }
      /* The point sits SOMEWHERE inside its own cell, possibly right against a face, so a triangle
         reachable from a cell at ring r can come as close as (r-1)*cell. Testing against r*cell instead
         exits one ring too early and locks in an answer that is merely the best seen so far. */
      if (bestD < (r - 1) * cell) break;
    }
    if (bestD === Infinity) continue;
    if (speckTri && speckTri[t]) { speckMax = Math.max(speckMax, bestD); speckN++; continue; }
    max = Math.max(max, bestD); sum += bestD; n++;
  }
  return { max, mean: n ? sum / n : 0, samples: n, span, speckMax, speckN };
}

/* ------------------------------------------------------------------ run */
const files = [];
for (const p of inputs) {
  if (!existsSync(p)) { console.error(`skipped ${p}: not found`); continue; }
  if (statSync(p).isDirectory()) for (const f of readdirSync(p)) { if (extname(f).toLowerCase() === '.stl') files.push(join(p, f)); }
  else files.push(p);
}
if (!files.length) { console.error('no .stl files found'); process.exit(2); }

const rows = [];
let inBytes = 0, outBytes = 0, refused = 0;

for (const f of files) {
  const name = basename(f);
  try {
    const pos = readBinarySTL(f);
    const srcTris = pos.length / 9;
    const srcBytes = statSync(f).size;
    inBytes += srcBytes;

    const span0 = (() => { const b = bbox(pos.length ? Float64Array.from(pos) : new Float64Array(0), null); return Math.max(b.hi[0] - b.lo[0], b.hi[1] - b.lo[1], b.hi[2] - b.lo[2]); })();
    const { verts, tris } = weld(pos, Math.max(span0 * 1e-7, 1e-6));
    const before = bbox(verts, null);

    /* mark triangles belonging to stray specks so the gate is not judged on scanner dust */
    let speckTri = null, specks = 0, speckBiggest = 0;
    if (VERIFY) {
      const modelSpan = Math.hypot(before.hi[0] - before.lo[0], before.hi[1] - before.lo[1], before.hi[2] - before.lo[2]);
      const cmp = components(verts, tris);
      const SPECK = modelSpan * 0.01;                    // 1% of the model's diagonal, and no bigger
      const speckRoots = new Set();
      for (const r of cmp.roots) {
        const e = cmp.box.get(r);
        const d = Math.hypot(e[3] - e[0], e[4] - e[1], e[5] - e[2]);
        if (cmp.roots.length > 1 && d < SPECK) { speckRoots.add(r); specks++; speckBiggest = Math.max(speckBiggest, d); }
      }
      if (speckRoots.size) {
        speckTri = new Uint8Array(tris.length / 3);
        for (let t = 0; t < tris.length / 3; t++) if (speckRoots.has(cmp.find(tris[t * 3]))) speckTri[t] = 1;
      }
    }

    const want = RATIO ? Math.max(4, Math.round(srcTris * RATIO)) : TARGET;
    let res;
    if (srcTris <= want) res = { verts, tris };
    else res = simplify(verts, tris, want);

    const after = bbox(res.verts, null);
    let drift = 0;
    for (let k = 0; k < 3; k++) drift = Math.max(drift, Math.abs(after.lo[k] - before.lo[k]), Math.abs(after.hi[k] - before.hi[k]));

    const outTris = res.tris.length / 3;
    const estBytes = 84 + outTris * 50;

    if (drift > 1e-6) {
      refused++;
      rows.push({ name, srcTris, outTris, srcBytes, outBytes: 0, drift, note: 'REFUSED — bounding box moved' });
      continue;
    }

    let dev = null;
    if (VERIFY && outTris < srcTris) {
      dev = deviation(pos, res.verts, res.tris, 4000, speckTri);
      dev.specks = specks; dev.speckBiggest = speckBiggest;
      if (dev.max > MAX_DEV) {
        refused++;
        rows.push({ name, srcTris, outTris, srcBytes, outBytes: 0, drift, dev, note: `REFUSED — surface moved ${dev.max.toFixed(3)} mm (ceiling ${MAX_DEV} mm)` });
        continue;
      }
    }

    let wrote = estBytes;
    if (!REPORT_ONLY) {
      const dir = OUTDIR || join(dirname(f), '..', basename(dirname(f)) + '-lite');
      if (!existsSync(dir)) mkdirSync(dir, { recursive: true });
      wrote = writeBinarySTL(join(dir, name), res.verts, res.tris);
    }
    outBytes += wrote;
    rows.push({ name, srcTris, outTris, srcBytes, outBytes: wrote, drift, dev, note: '' });
  } catch (e) {
    refused++;
    rows.push({ name, srcTris: 0, outTris: 0, srcBytes: 0, outBytes: 0, drift: 0, note: 'FAILED — ' + e.message });
  }
}

const mb = b => (b / 1048576).toFixed(2) + ' MB';
const pad = Math.max(...rows.map(r => r.name.length), 4);
const W = pad + (VERIFY ? 92 : 66);
console.log(`${'file'.padEnd(pad)}  ${'triangles'.padStart(19)}  ${'size'.padStart(19)}   bbox${VERIFY ? '   surface moved (max / mean)' : ' drift'}`);
console.log('-'.repeat(W));
for (const r of rows) {
  if (r.note) { console.log(`${r.name.padEnd(pad)}  ${r.note}`); continue; }
  let d = r.dev ? `   ${r.dev.max.toFixed(3)} / ${r.dev.mean.toFixed(3)} mm  (${(r.dev.max / r.dev.span * 100).toFixed(2)}% of span)` : (VERIFY ? '   unchanged' : '');
  if (r.dev && r.dev.specks) d += `  · dropped ${r.dev.specks} stray fragment${r.dev.specks === 1 ? '' : 's'} (≤${r.dev.speckBiggest.toFixed(2)} mm)`;
  console.log(`${r.name.padEnd(pad)}  ${String(r.srcTris).padStart(7)} → ${String(r.outTris).padStart(7)}    ${mb(r.srcBytes).padStart(8)} → ${mb(r.outBytes).padStart(8)}   ${r.drift === 0 ? 'none' : r.drift.toExponential(1)}${d}`);
}
console.log('-'.repeat(W));
console.log(`${'TOTAL'.padEnd(pad)}  ${' '.repeat(19)}  ${mb(inBytes).padStart(8)} → ${mb(outBytes).padStart(8)}   ${inBytes && outBytes ? (inBytes / outBytes).toFixed(1) + '× smaller' : ''}`);
if (REPORT_ONLY) console.log('\n--report: nothing was written.');
if (refused) {
  console.log(`\n${refused} file(s) refused — nothing was written for them.`);
  console.log('  bbox moved      → every landmark anchor on that mesh would have silently moved with it.');
  console.log('  surface moved   → raise --target so fewer triangles are collapsed, or raise --max-dev');
  console.log('                    deliberately if you have looked at the mesh and accept the loss.');
  console.log('Do not work around a refusal by lowering the bar without looking.');
  process.exit(1);
}
