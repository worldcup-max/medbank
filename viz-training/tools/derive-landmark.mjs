#!/usr/bin/env node
/* MedBank · viz-training/tools/derive-landmark.mjs
 *
 * The general form of derive-scapula-landmarks.mjs: measure ONE landmark on ONE parent mesh, by a
 * definition stated on the command line, and print the evidence that justifies it.
 *
 *   node viz-training/tools/derive-landmark.mjs --parent FMA24474 --contact FMA22342 --name "lesser trochanter"
 *   node viz-training/tools/derive-landmark.mjs --parent FMA24480 --extreme -z --name "lateral malleolus"
 *   node viz-training/tools/derive-landmark.mjs --parent FMA24477 --extreme +x --slab z:0,0.15 --name "medial malleolus"
 *   node viz-training/tools/derive-landmark.mjs --parent FMA16586 --contact FMA22322 --area 3 --name "iliac fossa"
 *   ... --json          machine-readable, for the batch runner
 *
 * ---- the two definitions ----
 *
 * CONTACT  --contact FMA…[,FMA…]
 *   The nearest point on the parent to another named mesh. An attachment or a joint is a place where
 *   two surfaces meet, so the meeting point IS the landmark, and the gap in mm says how well they meet.
 *   Give more than one and they must converge: three structures that attach to the same process should
 *   land within a few per cent of the bone's span. Convergence is the proof. A single contact is a
 *   measurement with no witness — allowed, but reported as such.
 *
 * EXTREME  --extreme ±x|±y|±z  [--slab axis:from,to]
 *   The furthest point in a stated direction, optionally inside a stated slice of the bone (fractions
 *   of the bounding box). For features that are defined by position rather than by what touches them —
 *   the lateral malleolus is simply the lowest point of the fibula.
 *
 * BodyParts3D ships LPS:  +X = the body's LEFT, +Y = POSTERIOR, +Z = SUPERIOR.
 * The frame is printed for every run (which side the parent sits on, its long axis) so a definition
 * written against the wrong axis is visible immediately rather than silently plausible.
 *
 * Refuses to emit when the evidence is weak: a contact gap over 3 mm, or contacts that scatter over
 * more than a quarter of the bone. An anchor typed in by eye is worse than a missing one; an anchor
 * measured badly and emitted anyway is worse still, because it looks measured.
 */
import { readSTL, vertices, bbox, surfaceCentroid, toUVW } from './stl.mjs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { existsSync } from 'node:fs';

const HERE = dirname(fileURLToPath(import.meta.url));
const MESH = join(HERE, '..', 'meshes-lite');
const AXIS = { x: 0, y: 1, z: 2 };

export function arg(name, argv = process.argv) {
  const i = argv.indexOf('--' + name);
  return i < 0 ? null : argv[i + 1];
}
export function loadMesh(id) {
  const p = join(MESH, id + '.stl');
  if (!existsSync(p)) throw new Error('no mesh on disk: ' + id);
  const m = readSTL(p);
  return { id, tri: m, v: vertices(m), c: surfaceCentroid(m).c };
}
const dist = (a, b) => Math.hypot(a[0] - b[0], a[1] - b[1], a[2] - b[2]);
const mean = ps => [0, 1, 2].map(a => ps.reduce((s, p) => s + p[a], 0) / ps.length);

function slabPool(parent, slab) {
  if (!slab) return parent.v;
  const b = bbox(parent.v);
  const [ax, range] = slab.split(':');
  const [f, t] = range.split(',').map(Number);
  const i = AXIS[ax], lo = b.lo[i] + b.size[i] * f, hi = b.lo[i] + b.size[i] * t;
  const pool = parent.v.filter(p => p[i] >= lo && p[i] <= hi);
  if (!pool.length) throw new Error('slab ' + slab + ' contains no vertices');
  return pool;
}
/* Nearest point ON parent to other, and the gap.
 *
 * `area` changes what is returned, and it matters for a broad attachment. Iliacus does not touch the
 * hip bone at a point — it lines the whole iliac fossa — so the single nearest vertex lands wherever
 * the two meshes happen to come closest, which was at the fossa's lower edge by the brim. With `area`,
 * every parent vertex lying within that many millimetres of the other mesh is collected and their
 * centroid is returned: the middle of the contact PATCH rather than its nearest corner. Use it for
 * surfaces (a fossa, a facet); leave it off for a point (a tubercle, a joint). */
export function contactPoint(parent, other, opts = {}) {
  const pool = slabPool(parent, opts.slab);
  let best = null; const dists = [];
  for (const p of pool) {
    let m = Infinity;
    for (const q of other.v) {
      const d = (p[0] - q[0]) ** 2 + (p[1] - q[1]) ** 2 + (p[2] - q[2]) ** 2;
      if (d < m) m = d;
    }
    dists.push({ p, mm: Math.sqrt(m) });
    if (!best || m < best.d2) best = { d2: m, p };
  }
  if (!opts.area) return { p: best.p, mm: Math.sqrt(best.d2) };
  const near = dists.filter(d => d.mm <= opts.area);
  if (!near.length) return { p: best.p, mm: Math.sqrt(best.d2), area: 0 };
  const c = [0, 1, 2].map(a => near.reduce((s, d) => s + d.p[a], 0) / near.length);
  /* The centroid of a patch on a CONCAVE surface floats in the air above it — the iliac fossa is a
     bowl, so the middle of the contact area sat 8 mm off the bone. An anchor must be a point ON the
     surface (the renderer paints outward from it, and a point far enough inside or outside never
     reaches the bone at all), so snap the centroid to the nearest vertex of the patch. */
  let snap = near[0], bd = Infinity;
  for (const d of near) {
    const q = (d.p[0] - c[0]) ** 2 + (d.p[1] - c[1]) ** 2 + (d.p[2] - c[2]) ** 2;
    if (q < bd) { bd = q; snap = d; }
  }
  return { p: snap.p, mm: Math.sqrt(best.d2), area: near.length, snapped_mm: +Math.sqrt(bd).toFixed(2) };
}
export function extremePoint(parent, dirSpec, slab) {
  const sign = dirSpec[0] === '-' ? -1 : 1, ax = AXIS[dirSpec.slice(-1)];
  const pool = slabPool(parent, slab);
  let best = null;
  for (const p of pool) { const val = p[ax] * sign; if (!best || val > best.val) best = { val, p }; }
  return { p: best.p, pool: pool.length };
}

export function derive(opts) {
  const parent = loadMesh(opts.parent);
  const B = bbox(parent.v), span = Math.max(...B.size);
  const out = { parent: opts.parent, name: opts.name || '', span: +span.toFixed(1),
                frame: { side: B.hi[0] < 0 ? 'right (X<0)' : B.lo[0] > 0 ? 'left (X>0)' : 'crosses the midline',
                         longAxis: 'xyz'[B.size.indexOf(Math.max(...B.size))] } };
  let point, radius = 0.02;
  if (opts.contact && opts.contact.length) {
    const cs = opts.contact.map(id => ({ id, ...contactPoint(parent, loadMesh(id), { area: opts.area, slab: opts.slab }) }));
    const worst = Math.max(...cs.map(c => c.mm));
    const pts = cs.map(c => c.p);
    const spread = pts.length < 2 ? 0 : Math.max(...pts.flatMap((a, i) => pts.slice(i + 1).map(b => dist(a, b))));
    out.method = 'CONTACT';
    out.evidence = { gaps_mm: cs.map(c => ({ [c.id]: +c.mm.toFixed(2) })), spread_mm: +spread.toFixed(2),
                     witnesses: cs.length };
    if (opts.area) { out.evidence.contact_area_verts = cs.map(c => c.area);
                     out.evidence.centroid_snapped_mm = cs.map(c => c.snapped_mm); }
    if (opts.slab) out.evidence.within = opts.slab;
    if (worst > 3) { out.refused = 'contact gap ' + worst.toFixed(2) + ' mm — the surfaces do not meet there'; return out; }
    if (spread > span * 0.25) { out.refused = 'contacts scatter over ' + spread.toFixed(1) + ' mm of a ' + span.toFixed(0) + ' mm bone'; return out; }
    point = mean(pts);
    radius = Math.min(0.035, Math.max(0.018, spread / (2 * span * 3)));
  } else if (opts.extreme) {
    const e = extremePoint(parent, opts.extreme, opts.slab);
    out.method = 'EXTREME ' + opts.extreme + (opts.slab ? ' within ' + opts.slab : '');
    out.evidence = { from_centroid_mm: +dist(e.p, parent.c).toFixed(1), vertices_considered: e.pool };
    point = e.p;
    radius = +(opts.radius || 0.02);
  } else { out.refused = 'no definition given (--contact or --extreme)'; return out; }
  out.uvw = toUVW(point, B).map(n => +n.toFixed(4));
  out.radius = +radius.toFixed(3);
  return out;
}

if (import.meta.url === 'file://' + process.argv[1]) {
  const o = derive({ parent: arg('parent'), name: arg('name'),
                     contact: (arg('contact') || '').split(',').filter(Boolean),
                     extreme: arg('extreme'), slab: arg('slab'), radius: arg('radius'),
                     area: arg('area') ? parseFloat(arg('area')) : null });
  if (process.argv.includes('--json')) { console.log(JSON.stringify(o, null, 2)); process.exit(o.refused ? 1 : 0); }
  console.log((o.name || 'landmark') + '  on ' + o.parent + '  ·  ' + o.span + ' mm, ' + o.frame.side + ', long axis ' + o.frame.longAxis);
  console.log('  ' + (o.method || ''));
  console.log('  ' + JSON.stringify(o.evidence));
  if (o.refused) { console.log('  REFUSED: ' + o.refused); process.exit(1); }
  console.log('  uvw ' + JSON.stringify(o.uvw) + '  radius ' + o.radius);
}
