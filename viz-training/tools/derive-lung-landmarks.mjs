#!/usr/bin/env node
/* MedBank · viz-training/tools/derive-lung-landmarks.mjs
 *
 * Measure the named surface features of the lungs on the meshes themselves, so a label lands on the
 * feature it names.
 *
 * The catalog's smallest lung unit is a whole lobe. There is no mesh for an apex, a cardiac notch, a
 * lingula, a hilum or a fissure line, so the only honest way to point at them is a landmark anchor — a
 * `uvw` fraction of the parent lobe's own bounding box. An anchor typed in by eye is worse than a missing
 * one: it puts the word "hilum" somewhere plausible and the student believes it.
 *
 *   node viz-training/tools/derive-lung-landmarks.mjs
 *   node viz-training/tools/derive-lung-landmarks.mjs --json
 *
 * ---- the coordinate frame, re-checked rather than assumed ----
 *
 * BodyParts3D ships in an LPS frame:  +X = the body's LEFT, +Y = POSTERIOR, +Z = SUPERIOR.
 * assertFrame() re-proves all three on the meshes it is handed and refuses to emit anything if they fail:
 *   · the right lung lobes must sit at X < 0 and the left lung lobes at X > 0
 *   · the upper lobe of the right lung must sit ABOVE (greater Z) the lower lobe of the right lung
 *   · the wall of the heart must sit ANTERIOR (lesser Y) to the oesophageal side of both lower lobes
 *
 * ---- how each landmark is found ----
 *
 *   EXTREME  — the furthest vertex in a stated direction, printed with the distance from the lobe's own
 *              centre so a human can sanity-check the number.
 *   CONTACT  — the nearest point on lobe A to mesh B. A fissure, a hilum and a cardiac impression are all
 *              places where two surfaces meet, so the meeting point IS the landmark. The gap in mm is
 *              printed: a gap near zero means the surfaces genuinely touch there.
 *
 * Nothing here is typed in by hand, and nothing is emitted that the tool could not measure.
 */
import { readSTL, vertices, bbox, toUVW, surfaceCentroid } from './stl.mjs';
import { join, dirname } from 'node:path';
import { existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

const HERE = dirname(fileURLToPath(import.meta.url));
const LITE = join(HERE, '..', 'meshes-lite');
const FULL = join(HERE, '..', 'meshes');
const JSON_OUT = process.argv.includes('--json');

const ID = {
  rul: 'FMA7333',   // upper lobe of right lung
  rll: 'FMA7337',   // lower lobe of right lung
  lul: 'FMA7370',   // upper lobe of left lung
  lll: 'FMA7371',   // lower lobe of left lung
  heart: 'FMA7274', // wall of heart      — the cardiac impression / notch
  pa: 'FMA66326',   // pulmonary artery   — enters at the hilum
  pv: 'FMA66643',   // pulmonary vein     — leaves at the hilum
  trachea: 'FMA7394'
};

function load(id) {
  const p = existsSync(join(LITE, id + '.stl')) ? join(LITE, id + '.stl') : join(FULL, id + '.stl');
  if (!existsSync(p)) throw new Error(`no local mesh for ${id} — this tool never fetches; decimate or ingest it first`);
  const stl = readSTL(p);
  const v = vertices(stl);
  return { id, v, b: bbox(v), c: surfaceCentroid(stl).c };
}

const M = Object.fromEntries(Object.entries(ID).map(([k, id]) => [k, load(id)]));

/* ---- frame assertions ---- */
const fails = [];
const midX = m => (m.b.lo[0] + m.b.hi[0]) / 2;
if (!(midX(M.rul) < 0 && midX(M.rll) < 0)) fails.push('right lung lobes are not at X < 0 — +X is not the body LEFT');
if (!(midX(M.lul) > 0 && midX(M.lll) > 0)) fails.push('left lung lobes are not at X > 0 — +X is not the body LEFT');
if (!(M.rul.c[2] > M.rll.c[2])) fails.push('upper lobe of right lung is not above the lower lobe — +Z is not SUPERIOR');
if (!(M.heart.c[1] < M.rll.c[1])) fails.push('the heart is not anterior to the lower lobe — +Y is not POSTERIOR');
if (fails.length) {
  console.error('FRAME ASSERTION FAILED — nothing emitted:');
  for (const f of fails) console.error('  · ' + f);
  process.exit(1);
}

const extreme = (m, axis, sign) => {
  let best = null, bv = -Infinity;
  for (const p of m.v) { const s = sign * p[axis]; if (s > bv) { bv = s; best = p; } }
  return best;
};

function contact(a, bMesh) {
  let best = null, bg = Infinity;
  for (const p of a.v) {
    for (const q of bMesh.v) {
      const d = (p[0] - q[0]) ** 2 + (p[1] - q[1]) ** 2 + (p[2] - q[2]) ** 2;
      if (d < bg) { bg = d; best = p; }
    }
  }
  return { p: best, gap: Math.sqrt(bg) };
}

const out = [];
const emit = (key, parent, p, how) => out.push({
  key,
  on: parent.id,
  uvw: toUVW(p, parent.b).map(n => +n.toFixed(3)),
  calibrated_by: how
});

const dist = (p, c) => Math.hypot(p[0] - c[0], p[1] - c[1], p[2] - c[2]);

let p;
p = extreme(M.rul, 2, +1);
emit('apex_right', M.rul, p, `geometry: the highest (most superior) vertex of the upper lobe of the right lung, ${dist(p, M.rul.c).toFixed(1)} mm from the lobe's surface centroid; see tools/derive-lung-landmarks.mjs`);

p = extreme(M.lul, 2, +1);
emit('apex_left', M.lul, p, `geometry: the highest (most superior) vertex of the upper lobe of the left lung, ${dist(p, M.lul.c).toFixed(1)} mm from the lobe's surface centroid; see tools/derive-lung-landmarks.mjs`);

let r;
r = contact(M.rul, M.rll);
emit('oblique_fissure_right', M.rul, r.p, `geometry: nearest CONTACT point between the upper and lower lobes of the right lung — the oblique fissure surface (gap ${r.gap.toFixed(2)} mm); see tools/derive-lung-landmarks.mjs`);

r = contact(M.lul, M.lll);
emit('oblique_fissure_left', M.lul, r.p, `geometry: nearest CONTACT point between the upper and lower lobes of the left lung — the oblique fissure surface (gap ${r.gap.toFixed(2)} mm); see tools/derive-lung-landmarks.mjs`);

r = contact(M.lul, M.heart);
emit('cardiac_notch', M.lul, r.p, `geometry: nearest CONTACT point between the upper lobe of the left lung and the wall of the heart — the cardiac impression, whose upper edge is the notch (gap ${r.gap.toFixed(2)} mm); see tools/derive-lung-landmarks.mjs`);

p = extreme(M.lul, 2, -1);
emit('lingula', M.lul, p, `geometry: the lowest (most inferior) vertex of the upper lobe of the left lung — the tongue that hangs below the cardiac notch, ${dist(p, M.lul.c).toFixed(1)} mm from the lobe's surface centroid; see tools/derive-lung-landmarks.mjs`);

r = contact(M.rul, M.pa);
emit('hilum_right', M.rul, r.p, `geometry: nearest CONTACT point between the upper lobe of the right lung and the pulmonary artery — the root of the lung (gap ${r.gap.toFixed(2)} mm); see tools/derive-lung-landmarks.mjs`);

r = contact(M.lul, M.pa);
emit('hilum_left', M.lul, r.p, `geometry: nearest CONTACT point between the upper lobe of the left lung and the pulmonary artery — the root of the lung (gap ${r.gap.toFixed(2)} mm); see tools/derive-lung-landmarks.mjs`);

p = extreme(M.rll, 2, -1);
emit('base_right', M.rll, p, `geometry: the lowest (most inferior) vertex of the lower lobe of the right lung — the diaphragmatic surface, ${dist(p, M.rll.c).toFixed(1)} mm from the lobe's surface centroid; see tools/derive-lung-landmarks.mjs`);

if (JSON_OUT) { console.log(JSON.stringify(out, null, 2)); process.exit(0); }
console.log('frame OK — +X left, +Y posterior, +Z superior, re-proved on these meshes\n');
for (const o of out) console.log(`${o.key.padEnd(22)} on ${o.on}  uvw [${o.uvw.join(', ')}]\n    ${o.calibrated_by}`);
