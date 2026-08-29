#!/usr/bin/env node
/* MedBank · viz-training/tools/check-anchors.mjs
 *
 * One cheap question asked of every authored anchor: does the point actually lie ON the parent's
 * surface? A landmark is a place on a bone. An anchor floating inside the marrow or out in the air
 * beside the bone paints its patch on whatever happens to be nearest, and reads as a confident mark on
 * the wrong spot — which is exactly the failure mode a measured coordinate is supposed to rule out.
 *
 * CONTACT and EXTREME anchors are taken FROM parent vertices, so they land on the surface by
 * construction and this check simply confirms nothing has drifted (a re-decimated mesh, an edited uvw).
 * MIDPOINT anchors are the interesting ones: halfway between two measured points is not a point on the
 * bone unless the bone happens to be straight there.
 *
 *   node viz-training/tools/check-anchors.mjs            # every scene
 *   node viz-training/tools/check-anchors.mjs --tol 8    # a looser tolerance, in mm
 *
 * It reports the distance from each anchor to the nearest vertex of its parent, as mm and as a
 * percentage of the bone's span. It changes nothing.
 */
import { readFileSync, existsSync, readdirSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { readSTL, vertices, bbox } from './stl.mjs';

const HERE = dirname(fileURLToPath(import.meta.url));
const SCENES = join(HERE, '..', 'scenes');
const MESH = join(HERE, '..', 'meshes-lite');
const TOL = parseFloat((process.argv[process.argv.indexOf('--tol') + 1] || '')) || 6;

const cache = new Map();
function mesh(id) {
  if (cache.has(id)) return cache.get(id);
  const p = join(MESH, id + '.stl');
  const m = existsSync(p) ? (() => { const v = vertices(readSTL(p)); return { v, b: bbox(v) }; })() : null;
  cache.set(id, m); return m;
}
const nearest = (v, p) => Math.sqrt(v.reduce((best, q) => {
  const d = (p[0] - q[0]) ** 2 + (p[1] - q[1]) ** 2 + (p[2] - q[2]) ** 2;
  return d < best ? d : best;
}, Infinity));

let checked = 0, off = [], skipped = [];
for (const f of readdirSync(SCENES).filter(n => n.endsWith('.json') && n !== 'index.json').sort()) {
  const d = JSON.parse(readFileSync(join(SCENES, f), 'utf8'));
  if (d.mode !== '3d_anatomy') continue;
  const byKey = Object.fromEntries((d.structures || []).map(s => [s.key, s]));
  for (const s of d.structures || []) {
    if (s.render !== 'anchor' || !s.anchor || !s.anchor.uvw) continue;
    const par = byKey[s.anchor.on];
    const id = par && par.refs && par.refs.bodyparts3d;
    if (!id) { skipped.push(`${d.id.split('__').pop()} · ${s.key} — parent has no mesh id`); continue; }
    const m = mesh(id);
    if (!m) { skipped.push(`${d.id.split('__').pop()} · ${s.key} — ${id} not in meshes-lite`); continue; }
    const p = [0, 1, 2].map(a => m.b.lo[a] + m.b.size[a] * s.anchor.uvw[a]);
    const mm = nearest(m.v, p), span = Math.max(...m.b.size);
    checked++;
    /* The renderer paints every vertex within R of the anchor, R = max(span*radius*3, span*0.045).
       An anchor further off the surface than R paints NOTHING: the student selects the landmark and the
       bone does not change. That is the difference between a mark in the wrong place and no mark. */
    const R = Math.max(span * (s.anchor.radius || 0.05) * 3, span * 0.045);
    if (mm > TOL) off.push({ scene: d.id.split('__').pop(), key: s.key, mm, pct: mm / span * 100, status: d.status,
                             paints: mm < R, R,
                             how: (s.calibrated_by || '').slice(0, 46), reviewed: !!s.reviewed_by });
  }
}
off.sort((a, b) => b.pct - a.pct);
console.log(`${checked} anchors checked · tolerance ${TOL} mm\n`);
if (!off.length) console.log('every anchor lies on its parent surface.');
else {
  console.log(`${off.length} sit off the surface:\n`);
  for (const o of off) console.log(`  ${o.mm.toFixed(1).padStart(6)} mm  patch reaches ${o.R.toFixed(1)} mm → ${o.paints ? 'still paints' : 'PAINTS NOTHING'}  ${o.status.padEnd(9)} ${o.scene.padEnd(30)} ${o.key.padEnd(24)}${o.reviewed ? ' [reviewed]' : ''}`);
}
if (skipped.length) { console.log(`\n${skipped.length} not checkable:`); for (const s of skipped.slice(0, 12)) console.log('  ' + s); }
