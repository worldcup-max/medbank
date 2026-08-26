/* Minimal binary-STL reader + geometry helpers, shared by the landmark tools.
 * Binary STL only — that is what the decimator writes and what the app ships. */
import { readFileSync } from 'node:fs';

export function readSTL(path) {
  const buf = readFileSync(path);
  const n = buf.readUInt32LE(80);
  if (84 + n * 50 !== buf.length) throw new Error(`${path}: not a binary STL (header says ${n} triangles, file is ${buf.length} bytes)`);
  const tri = new Float64Array(n * 9);
  for (let i = 0; i < n; i++) {
    const o = 84 + i * 50 + 12;                 // skip the per-facet normal
    for (let k = 0; k < 9; k++) tri[i * 9 + k] = buf.readFloatLE(o + k * 4);
  }
  return { n, tri };
}

/* Unique vertices, so a point that 6 triangles share is not counted 6 times. */
export function vertices({ n, tri }) {
  const seen = new Map();
  const out = [];
  for (let i = 0; i < n * 9; i += 3) {
    const x = tri[i], y = tri[i + 1], z = tri[i + 2];
    const k = `${x.toFixed(4)},${y.toFixed(4)},${z.toFixed(4)}`;
    if (seen.has(k)) continue;
    seen.set(k, 1);
    out.push([x, y, z]);
  }
  return out;
}

export function bbox(v) {
  const lo = [Infinity, Infinity, Infinity], hi = [-Infinity, -Infinity, -Infinity];
  for (const p of v) for (let a = 0; a < 3; a++) { if (p[a] < lo[a]) lo[a] = p[a]; if (p[a] > hi[a]) hi[a] = p[a]; }
  return { lo, hi, size: [hi[0] - lo[0], hi[1] - lo[1], hi[2] - lo[2]] };
}

/* Area-weighted centroid of the surface. Better than a vertex mean, which is biased
 * towards wherever the tessellation happens to be dense. */
export function surfaceCentroid({ n, tri }) {
  let A = 0, cx = 0, cy = 0, cz = 0;
  for (let i = 0; i < n; i++) {
    const o = i * 9;
    const ax = tri[o], ay = tri[o + 1], az = tri[o + 2];
    const bx = tri[o + 3], by = tri[o + 4], bz = tri[o + 5];
    const cxx = tri[o + 6], cyy = tri[o + 7], czz = tri[o + 8];
    const ux = bx - ax, uy = by - ay, uz = bz - az;
    const vx = cxx - ax, vy = cyy - ay, vz = czz - az;
    const nx = uy * vz - uz * vy, ny = uz * vx - ux * vz, nz = ux * vy - uy * vx;
    const a = 0.5 * Math.hypot(nx, ny, nz);
    A += a;
    cx += a * (ax + bx + cxx) / 3; cy += a * (ay + by + cyy) / 3; cz += a * (az + bz + czz) / 3;
  }
  return { area: A, c: [cx / A, cy / A, cz / A] };
}

/* Slice the vertex cloud along one axis and report how wide the model is in each slab.
 * A thin peg (the dens) or a thin blade (a spinous process) shows up as a long tail of
 * slabs whose extent collapses — which is how the axes get identified without assuming
 * anything about the source data's convention. */
export function profile(v, axis, bins = 24) {
  const b = bbox(v);
  const lo = b.lo[axis], span = b.size[axis] || 1;
  const o1 = (axis + 1) % 3, o2 = (axis + 2) % 3;
  const slab = Array.from({ length: bins }, () => ({ count: 0, lo1: Infinity, hi1: -Infinity, lo2: Infinity, hi2: -Infinity }));
  for (const p of v) {
    let i = Math.floor((p[axis] - lo) / span * bins);
    if (i >= bins) i = bins - 1; if (i < 0) i = 0;
    const s = slab[i];
    s.count++;
    if (p[o1] < s.lo1) s.lo1 = p[o1]; if (p[o1] > s.hi1) s.hi1 = p[o1];
    if (p[o2] < s.lo2) s.lo2 = p[o2]; if (p[o2] > s.hi2) s.hi2 = p[o2];
  }
  return slab.map((s, i) => ({
    i,
    from: lo + span * i / bins,
    to: lo + span * (i + 1) / bins,
    count: s.count,
    w1: s.count ? s.hi1 - s.lo1 : 0,
    w2: s.count ? s.hi2 - s.lo2 : 0
  }));
}

/* uvw: a point expressed as fractions of the bounding box — the same convention the
 * scene files use for `anchor.uvw`, so what comes out of here can be pasted straight in. */
export function toUVW(p, b) {
  return [0, 1, 2].map(a => (p[a] - b.lo[a]) / (b.size[a] || 1));
}
export function fromUVW(uvw, b) {
  return [0, 1, 2].map(a => b.lo[a] + uvw[a] * b.size[a]);
}
