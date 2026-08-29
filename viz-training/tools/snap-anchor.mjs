#!/usr/bin/env node
/* MedBank · viz-training/tools/snap-anchor.mjs
 *
 * Move an anchor that does not lie on a surface onto one — either its own parent's surface, or onto a
 * different structure entirely.
 *
 * check-anchors.mjs finds anchors that paint nothing: the renderer colours the parent's VERTICES within
 * a radius of the anchor, so a point floating inside the bone or out in the air beside it colours
 * nothing at all. The student selects the landmark and the model does not change. Two causes, two cures:
 *
 *   a point marking a VOLUME  (the centre of a vertebral body, the middle of the vertebral foramen)
 *     → snap it to the nearest surface of the same parent. A patch can only ever be on a surface, so
 *       the honest mark is the wall of the hole, or the front of the block.
 *
 *   a point in the SPACE BETWEEN two bones (the mid-inguinal point, halfway along a ligament)
 *     → re-parent it onto the structure it is actually on, when the scene has that mesh. The
 *       mid-inguinal point is a point on the inguinal ligament, not a point on the hip bone.
 *
 *   node viz-training/tools/snap-anchor.mjs --scene <scene-id> --key <anchor-key> [--to <structure-key>]
 *   node ... --apply        write it
 */
import { readFileSync, writeFileSync, existsSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { readSTL, vertices, bbox, toUVW } from './stl.mjs';

const HERE = dirname(fileURLToPath(import.meta.url));
const arg = n => { const i = process.argv.indexOf('--' + n); return i < 0 ? null : process.argv[i + 1]; };
const SCENE = arg('scene'), KEY = arg('key'), TO = arg('to'), APPLY = process.argv.includes('--apply');
if (!SCENE || !KEY) { console.error('need --scene and --key'); process.exit(2); }

const file = join(HERE, '..', 'scenes', SCENE + '.json');
const raw = readFileSync(file, 'utf8');
const indent = (raw.match(/\n(\s+)"/) || [, '  '])[1].length;
const d = JSON.parse(raw);
const byKey = Object.fromEntries(d.structures.map(s => [s.key, s]));
const st = byKey[KEY]; if (!st || !st.anchor) { console.error('no anchor ' + KEY); process.exit(2); }

function meshOf(key) {
  const id = (byKey[key].refs || {}).bodyparts3d;
  const p = join(HERE, '..', 'meshes-lite', id + '.stl');
  if (!existsSync(p)) { console.error('no mesh for ' + key + ' (' + id + ')'); process.exit(2); }
  const v = vertices(readSTL(p));
  return { id, v, b: bbox(v) };
}
const from = meshOf(st.anchor.on);
const to = meshOf(TO || st.anchor.on);
const pt = [0, 1, 2].map(a => from.b.lo[a] + from.b.size[a] * st.anchor.uvw[a]);

/* --dir restricts which way the point may travel. Snapping the centre of a vertebral body to its
   NEAREST surface lands on the endplate, because that is genuinely closest — but the narration calls
   it "the weight-bearing block in front", so the mark belongs on the front of the block. LPS: +X body's
   left, +Y posterior, +Z superior, so anterior is -y. */
const DIR = arg('dir');
const AX = { x: 0, y: 1, z: 2 };
let pool = to.v;
if (DIR) {
  const sign = DIR[0] === '-' ? -1 : 1, ax = AX[DIR.slice(-1)];
  pool = to.v.filter(q => (q[ax] - pt[ax]) * sign > 0);
  if (!pool.length) { console.error('no vertices lie ' + DIR + ' of the anchor'); process.exit(2); }
}
let best = null;
for (const q of pool) {
  const dd = (pt[0] - q[0]) ** 2 + (pt[1] - q[1]) ** 2 + (pt[2] - q[2]) ** 2;
  if (!best || dd < best.d) best = { d: dd, q };
}
const moved = Math.sqrt(best.d), uvw = toUVW(best.q, to.b).map(n => +n.toFixed(4));
console.log(`${KEY}: ${st.anchor.on} → ${TO || st.anchor.on}`);
console.log(`  moved ${moved.toFixed(1)} mm onto the surface`);
console.log(`  uvw ${JSON.stringify(st.anchor.uvw)} → ${JSON.stringify(uvw)}`);
if (!APPLY) { console.log('  (dry run — pass --apply to write it)'); process.exit(0); }

const note = TO
  ? ` · re-parented onto ${TO} and snapped ${moved.toFixed(1)} mm onto its surface: the point lies on that structure, not on ${st.anchor.on}, and a patch can only be painted on a surface`
  : ` · snapped ${moved.toFixed(1)} mm onto the parent's surface${DIR ? ' (' + DIR + ', the aspect the narration describes)' : ''}: the measured point marks a volume, and a patch can only be painted on a surface`;
if (TO) st.anchor.on = TO;
st.anchor.uvw = uvw;
st.calibrated_by = (st.calibrated_by || '') + note;
writeFileSync(file, JSON.stringify(d, null, indent) + '\n');
console.log('  written');
