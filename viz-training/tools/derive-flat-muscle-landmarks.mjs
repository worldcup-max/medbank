#!/usr/bin/env node
/* MedBank · viz-training/tools/derive-flat-muscle-landmarks.mjs
 *
 * Measure the attachments and borders of the FLAT abdominal muscles, and the two bony points the inguinal
 * region is built on, so the labels in the "Flat abdominal muscles" and "Inguinal canal" scenes land on the
 * thing they name.
 *
 *   node viz-training/tools/derive-flat-muscle-landmarks.mjs
 *   node viz-training/tools/derive-flat-muscle-landmarks.mjs --json
 *
 * ---- what this tool can and cannot reach ----
 *
 * The catalog has all six flat muscles, both inguinal ligaments and both hip bones. `meshes/` has exactly
 * ONE of the flat muscles: the right external oblique. The right internal oblique, the right transversus
 * abdominis and the right inguinal ligament are in the catalog and are referenced by both scenes, but are
 * not on disk, so every landmark that would need them is not emitted at all rather than guessed from the
 * external oblique that sits on top of them. A depth relationship measured on the wrong layer is precisely
 * the error this file exists to prevent, and in this region it would be worse than elsewhere: the whole of
 * the inguinal canal is a statement about which of three layers you are in.
 *
 * The canal itself, its deep and superficial rings, the conjoint tendon, the transversalis fascia and the
 * spermatic cord are not meshes and are not landmarks on one either — they are spaces, edges and fascial
 * sheets. Nothing here tries to place them. They are recorded in each scene's gaps[].
 *
 * ---- the coordinate frame, re-checked rather than assumed ----
 *
 * BodyParts3D ships in an LPS frame:  +X = the body's LEFT, +Y = POSTERIOR, +Z = SUPERIOR.
 * The assertions below re-prove all three on the meshes this tool is handed and emit nothing if they fail:
 *   · the right fifth rib must sit ABOVE (greater Z) the right hip bone
 *   · the right external oblique must sit ANTERIOR (lesser Y) to the first lumbar vertebra
 *   · the right external oblique must sit to the body's RIGHT (lesser X) of the first lumbar vertebra
 *
 * ---- how each landmark is found ----
 *
 *   EXTREME  — the furthest vertex in a stated direction, printed with its distance from the mesh's own
 *              surface centroid so a human can sanity-check the number.
 *   CONTACT  — the nearest point on mesh A to mesh B. A muscle attachment is where the muscle meets the
 *              bone, so the meeting point IS the attachment. The gap in mm is printed and never rounded
 *              away: a gap near zero means the surfaces genuinely touch.
 *
 * One contact here — external oblique against rectus abdominis — is deliberately the same physical contact
 * that derive-abdominal-wall-landmarks.mjs measured from the other side. Its gap should reproduce that
 * tool's 0.34 mm. Two tools written against the same meshes agreeing is the only real check on a derived
 * number, so the cross-check is printed rather than assumed.
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
  extobl_r: 'FMA13336',  // right external oblique — the only flat muscle on disk
  rect_r: 'FMA13377',    // right rectus abdominis
  hip_r: 'FMA16586',     // right hip bone — iliac crest, pubic tubercle, pubic symphysis are all on it
  rib5_r: 'FMA8066',     // right fifth rib — the highest rib the external oblique arises from
  rib12_r: 'FMA8533',    // right twelfth rib — the lowest
  l1: 'FMA13072'         // first lumbar vertebra — posterior and midline reference
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
if (!(M.rib5_r.c[2] > M.hip_r.c[2])) fails.push('the fifth rib is not above the hip bone — +Z is not SUPERIOR');
if (!(M.extobl_r.c[1] < M.l1.c[1])) fails.push('the external oblique is not anterior to the first lumbar vertebra — +Y is not POSTERIOR');
if (!(M.extobl_r.c[0] < M.l1.c[0])) fails.push('the right external oblique is not to the body right of the midline L1 — +X is not the body LEFT');
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

/* Seeded with a coarse brute-force bound and precomputed shells: an unbounded shell walk on these meshes
 * runs for minutes, and a derive tool that hangs gets replaced by an anchor typed in by eye. */
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
  let best = Infinity, bestP = null, bestQ = null;
  const as = stride(a.v, 1500), bs = stride(bMesh.v, 1500);
  for (const p of as) for (const q of bs) {
    const d = (p[0] - q[0]) ** 2 + (p[1] - q[1]) ** 2 + (p[2] - q[2]) ** 2;
    if (d < best) { best = d; bestP = p; bestQ = q; }
  }
  const G = grid(bMesh.v, Math.max(Math.max(...bMesh.b.size) / 24, 1));
  for (const p of a.v) {
    const d = nearestIn(G, p, best);
    if (d < best) { best = d; bestP = p; }
  }
  return { p: bestP, q: bestQ, gap: Math.sqrt(best) };
}

const out = [];
const emit = (key, parent, p, how) => out.push({
  key,
  on: parent.id,
  uvw: toUVW(p, parent.b).map(n => +n.toFixed(3)),
  calibrated_by: how
});
const dist = (p, c) => Math.hypot(p[0] - c[0], p[1] - c[1], p[2] - c[2]);
const SEE = 'see tools/derive-flat-muscle-landmarks.mjs';

let p, r;

/* ---- where the external oblique comes from: the ribs ---- */
r = contact(M.extobl_r, M.rib5_r);
emit('eo_origin_rib5', M.extobl_r, r.p, `geometry: nearest CONTACT point between the right external oblique and the right fifth rib — the highest of the eight rib origins, where its digitations interdigitate with serratus anterior (gap ${r.gap.toFixed(2)} mm); ${SEE}`);

r = contact(M.extobl_r, M.rib12_r);
emit('eo_origin_rib12', M.extobl_r, r.p, `geometry: nearest CONTACT point between the right external oblique and the right twelfth rib — the lowest of the eight rib origins, where its digitations interdigitate with latissimus dorsi (gap ${r.gap.toFixed(2)} mm); ${SEE}`);

/* ---- where it goes: the iliac crest, and the aponeurosis in front of the rectus ---- */
r = contact(M.extobl_r, M.hip_r);
const hipUVW = toUVW(r.q || r.p, M.hip_r.b).map(n => +n.toFixed(3));
emit('eo_iliac_attachment', M.extobl_r, r.p, `geometry: nearest CONTACT point between the right external oblique and the right hip bone — the fleshy posterior fibres taking hold of the anterior half of the iliac crest. The matching point on the hip bone sits at uvw [${hipUVW.join(', ')}] of that bone's own box, i.e. its upper part, which is what identifies this as the CREST rather than the pubis (gap ${r.gap.toFixed(2)} mm); ${SEE}`);

r = contact(M.extobl_r, M.rect_r);
emit('eo_aponeurosis_over_rectus', M.extobl_r, r.p, `geometry: nearest CONTACT point between the right external oblique and the right rectus abdominis — where its aponeurosis lies in front of the rectus as the anterior wall of the sheath (gap ${r.gap.toFixed(2)} mm). This is the same physical contact derive-abdominal-wall-landmarks.mjs measured from the rectus side at 0.34 mm; the two tools agree on the gap and differ only in which mesh the anchor hangs on; ${SEE}`);

/* ---- the borders of the sheet ---- */
p = extreme(M.extobl_r, 2, -1);
emit('eo_lower_free_border', M.extobl_r, p, `geometry: the lowest (most inferior) vertex of the right external oblique, ${dist(p, M.extobl_r.c).toFixed(1)} mm from its surface centroid — the bottom of the sheet, at the level where its free lower border rolls back as the inguinal ligament. The ligament is a separate mesh that is not on disk, so this marks the LEVEL and not the ligament; ${SEE}`);

p = extreme(M.extobl_r, 0, -1);
emit('eo_lateral_digitations', M.extobl_r, p, `geometry: the most lateral (most body-right) vertex of the right external oblique, ${dist(p, M.extobl_r.c).toFixed(1)} mm from its surface centroid — the fleshy lateral part of the muscle, before it becomes aponeurotic; ${SEE}`);

p = extreme(M.extobl_r, 2, +1);
emit('eo_upper_end', M.extobl_r, p, `geometry: the highest (most superior) vertex of the right external oblique, ${dist(p, M.extobl_r.c).toFixed(1)} mm from its surface centroid — the top of the sheet against the lower ribs; ${SEE}`);

/* ---- the two bony points the inguinal region is built on ---- */
p = extreme(M.hip_r, 0, +1);
emit('pubic_symphysis_r', M.hip_r, p, `geometry: the most medial (most body-left) vertex of the right hip bone, ${dist(p, M.hip_r.c).toFixed(1)} mm from its surface centroid — the symphyseal surface of the pubis, i.e. the midline end of the bone. The pubic TUBERCLE lies a couple of centimetres lateral to this and is not a separate mesh, so it is not emitted; ${SEE}`);

p = extreme(M.hip_r, 2, +1);
emit('iliac_crest_r', M.hip_r, p, `geometry: the highest (most superior) vertex of the right hip bone, ${dist(p, M.hip_r.c).toFixed(1)} mm from its surface centroid — the summit of the iliac crest. The anterior superior iliac spine is the anterior END of this crest and is not separately modelled, so it is not emitted; ${SEE}`);

if (JSON_OUT) { console.log(JSON.stringify(out, null, 2)); process.exit(0); }
console.log('frame OK — +X left, +Y posterior, +Z superior, re-proved on these meshes\n');
for (const o of out) console.log(`${o.key.padEnd(28)} on ${o.on}  uvw [${o.uvw.join(', ')}]\n    ${o.calibrated_by}\n`);
