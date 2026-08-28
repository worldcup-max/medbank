#!/usr/bin/env node
/* MedBank · viz-training/tools/derive-abdominal-wall-landmarks.mjs
 *
 * Measure the attachments and borders of rectus abdominis on the mesh itself, so a label lands on the thing
 * it names.
 *
 * The catalog has both recti, both pyramidales, the linea alba and all six flat muscles, but it has no
 * tendinous intersection, no arcuate line, no umbilicus and no linea semilunaris — those are markings on a
 * muscle and a sheath rather than objects, so no provider will ever ship them as meshes. The honest way to
 * point at the ones that ARE geometric facts about the muscle (its lateral border, its medial border, its
 * costal and pubic attachments) is a landmark anchor: a `uvw` fraction of the parent mesh's own bounding
 * box. The ones that are not geometric facts are left out and recorded in the scene's gaps[], because an
 * anchor typed in by eye puts the words "arcuate line" somewhere plausible and the student believes it.
 *
 *   node viz-training/tools/derive-abdominal-wall-landmarks.mjs
 *   node viz-training/tools/derive-abdominal-wall-landmarks.mjs --json
 *
 * ---- what this tool can and cannot reach ----
 *
 * It measures ONLY against meshes present locally, and it never fetches. Of the abdominal wall set, that is
 * currently the RIGHT side: right rectus abdominis, right external oblique, right hip bone, and the right
 * fifth and sixth costal cartilages. The left rectus, the linea alba, the xiphoid process, the seventh
 * costal cartilage, the pyramidales and the deeper flat muscles are in the catalog but not on disk, so the
 * landmarks that would need them are not emitted at all rather than approximated from the right side. A
 * right-sided measurement relabelled as a midline one is exactly the class of error this whole tool exists
 * to prevent.
 *
 * ---- the coordinate frame, re-checked rather than assumed ----
 *
 * BodyParts3D ships in an LPS frame:  +X = the body's LEFT, +Y = POSTERIOR, +Z = SUPERIOR.
 * The assertions below re-prove all three on the meshes this tool is handed and emit nothing if they fail:
 *   · the body of the sternum must sit ABOVE (greater Z) the right hip bone
 *   · the right rectus abdominis must sit ANTERIOR (lesser Y) to the first lumbar vertebra
 *   · the right rectus abdominis must sit to the body's RIGHT (lesser X) of the midline sternum
 *
 * ---- how each landmark is found ----
 *
 *   EXTREME  — the furthest vertex in a stated direction, printed with the distance from the mesh's own
 *              surface centroid so a human can sanity-check the number.
 *   CONTACT  — the nearest point on mesh A to mesh B. A muscle attachment is where the muscle meets the
 *              bone, so the meeting point IS the attachment. The gap in mm is printed and never rounded
 *              away: a gap near zero means the surfaces genuinely touch.
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
  rect_r: 'FMA13377',    // right rectus abdominis
  extobl_r: 'FMA13336',  // right external oblique
  hip_r: 'FMA16586',     // right hip bone — pubic crest and pubic symphysis are on it
  cc5_r: 'FMA8070',      // right fifth costal cartilage
  cc6_r: 'FMA8194',      // right sixth costal cartilage
  sternbody: 'FMA7487',  // body of sternum — midline reference
  l1: 'FMA13072'         // first lumbar vertebra — posterior reference
};

function dedupe(v) {
  const seen = new Set(), out = [];
  for (const p of v) {
    const k = p[0].toFixed(3) + ',' + p[1].toFixed(3) + ',' + p[2].toFixed(3);
    if (seen.has(k)) continue;
    seen.add(k); out.push(p);
  }
  return out;
}

function load(id) {
  const p = existsSync(join(LITE, id + '.stl')) ? join(LITE, id + '.stl') : join(FULL, id + '.stl');
  if (!existsSync(p)) throw new Error(`no local mesh for ${id} — this tool never fetches; decimate or ingest it first`);
  const stl = readSTL(p);
  const v = vertices(stl);
  return { id, v: dedupe(v), b: bbox(v), c: surfaceCentroid(stl).c };
}

const M = Object.fromEntries(Object.entries(ID).map(([k, id]) => [k, load(id)]));

/* ---- frame assertions ---- */
const fails = [];
if (!(M.sternbody.c[2] > M.hip_r.c[2])) fails.push('the sternum is not above the hip bone — +Z is not SUPERIOR');
if (!(M.rect_r.c[1] < M.l1.c[1])) fails.push('the rectus abdominis is not anterior to the first lumbar vertebra — +Y is not POSTERIOR');
if (!(M.rect_r.c[0] < M.sternbody.c[0])) fails.push('the right rectus abdominis is not to the body right of the midline sternum — +X is not the body LEFT');
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

const SHELLS = [];
for (let r = 0; r < 48; r++) {
  const s = [];
  for (let i = -r; i <= r; i++) for (let j = -r; j <= r; j++) for (let k = -r; k <= r; k++)
    if (Math.max(Math.abs(i), Math.abs(j), Math.abs(k)) === r) s.push([i, j, k]);
  SHELLS.push(s);
}

function grid(pts, cell) {
  const g = new Map();
  for (const p of pts) {
    const k = Math.floor(p[0] / cell) + '|' + Math.floor(p[1] / cell) + '|' + Math.floor(p[2] / cell);
    let b = g.get(k); if (!b) g.set(k, b = []);
    b.push(p);
  }
  return { g, cell };
}

function nearestIn(G, p, bestSoFar) {
  const { g, cell } = G;
  const cx = Math.floor(p[0] / cell), cy = Math.floor(p[1] / cell), cz = Math.floor(p[2] / cell);
  let best = bestSoFar;
  for (let r = 0; r < SHELLS.length; r++) {
    if (r > 0 && ((r - 1) * cell) ** 2 > best) break;
    for (const [i, j, k] of SHELLS[r]) {
      const b = g.get((cx + i) + '|' + (cy + j) + '|' + (cz + k));
      if (!b) continue;
      for (const q of b) {
        const d = (p[0] - q[0]) ** 2 + (p[1] - q[1]) ** 2 + (p[2] - q[2]) ** 2;
        if (d < best) best = d;
      }
    }
  }
  return best;
}

const stride = (v, n) => v.length <= n ? v : v.filter((_, i) => i % Math.ceil(v.length / n) === 0);

function contact(a, bMesh) {
  let best = Infinity, bestP = null;
  const as = stride(a.v, 1500), bs = stride(bMesh.v, 1500);
  for (const p of as) for (const q of bs) {
    const d = (p[0] - q[0]) ** 2 + (p[1] - q[1]) ** 2 + (p[2] - q[2]) ** 2;
    if (d < best) { best = d; bestP = p; }
  }
  const G = grid(bMesh.v, Math.max(Math.max(...bMesh.b.size) / 24, 1));
  for (const p of a.v) {
    const d = nearestIn(G, p, best);
    if (d < best) { best = d; bestP = p; }
  }
  return { p: bestP, gap: Math.sqrt(best) };
}

const out = [];
const emit = (key, parent, p, how) => out.push({
  key,
  on: parent.id,
  uvw: toUVW(p, parent.b).map(n => +n.toFixed(3)),
  calibrated_by: how
});
const dist = (p, c) => Math.hypot(p[0] - c[0], p[1] - c[1], p[2] - c[2]);
const SEE = 'see tools/derive-abdominal-wall-landmarks.mjs';

let p, r;

/* ---- the two ends of the muscle ---- */
r = contact(M.rect_r, M.hip_r);
emit('pubic_origin', M.rect_r, r.p, `geometry: nearest CONTACT point between the right rectus abdominis and the right hip bone — the origin from the pubic crest and the front of the pubic symphysis (gap ${r.gap.toFixed(2)} mm); ${SEE}`);

r = contact(M.rect_r, M.cc5_r);
emit('costal_insertion_5', M.rect_r, r.p, `geometry: nearest CONTACT point between the right rectus abdominis and the right fifth costal cartilage — the highest of its three costal insertions (gap ${r.gap.toFixed(2)} mm); ${SEE}`);

r = contact(M.rect_r, M.cc6_r);
emit('costal_insertion_6', M.rect_r, r.p, `geometry: nearest CONTACT point between the right rectus abdominis and the right sixth costal cartilage — the middle of its three costal insertions (gap ${r.gap.toFixed(2)} mm); ${SEE}`);

p = extreme(M.rect_r, 2, +1);
emit('upper_end', M.rect_r, p, `geometry: the highest (most superior) vertex of the right rectus abdominis, ${dist(p, M.rect_r.c).toFixed(1)} mm from its surface centroid — the top of the muscle, where it is broad and thin against the costal margin; ${SEE}`);

p = extreme(M.rect_r, 2, -1);
emit('lower_end', M.rect_r, p, `geometry: the lowest (most inferior) vertex of the right rectus abdominis, ${dist(p, M.rect_r.c).toFixed(1)} mm from its surface centroid — the bottom of the muscle at the pubis, where it is narrow and thick; ${SEE}`);

/* ---- the two borders ---- */
p = extreme(M.rect_r, 0, -1);
emit('linea_semilunaris', M.rect_r, p, `geometry: the most lateral (most body-right) vertex of the right rectus abdominis, ${dist(p, M.rect_r.c).toFixed(1)} mm from its surface centroid — the lateral border, which is the linea semilunaris; ${SEE}`);

p = extreme(M.rect_r, 0, +1);
emit('medial_border', M.rect_r, p, `geometry: the single most medial (most body-left) vertex of the right rectus abdominis, ${dist(p, M.rect_r.c).toFixed(1)} mm from its surface centroid. The medial border is a line, not a point, and its most medial point is at the PUBIC end where the two recti converge — which is where this lands, and why the label reads "closest approach to the midline" rather than "the linea alba"; ${SEE}`);

/* ---- the sheath, inferred from the one flat muscle on disk ---- */
r = contact(M.rect_r, M.extobl_r);
emit('sheath_anterior_wall', M.rect_r, r.p, `geometry: nearest CONTACT point between the right rectus abdominis and the right external oblique — where the external oblique aponeurosis lies against the muscle as the anterior wall of the rectus sheath (gap ${r.gap.toFixed(2)} mm); ${SEE}`);

if (JSON_OUT) { console.log(JSON.stringify(out, null, 2)); process.exit(0); }
console.log('frame OK — +X left, +Y posterior, +Z superior, re-proved on these meshes\n');
for (const o of out) console.log(`${o.key.padEnd(24)} on ${o.on}  uvw [${o.uvw.join(', ')}]\n    ${o.calibrated_by}\n`);
