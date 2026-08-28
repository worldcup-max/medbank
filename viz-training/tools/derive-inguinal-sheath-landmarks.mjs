#!/usr/bin/env node
/* MedBank · viz-training/tools/derive-inguinal-sheath-landmarks.mjs
 *
 * Measure the landmarks the "Rectus sheath" and "Inguinal ligament & landmarks" scenes point at, on the
 * meshes themselves, so a label lands on the thing it names.
 *
 *   node viz-training/tools/derive-inguinal-sheath-landmarks.mjs
 *   node viz-training/tools/derive-inguinal-sheath-landmarks.mjs --json
 *
 * ---- what this tool can and cannot reach ----
 *
 * It measures ONLY against meshes present locally and it never fetches. For this region that is the right
 * hip bone, the right rectus abdominis and the right external oblique. The inguinal ligament itself IS in
 * the catalog but is not on disk, so every landmark of the ligament here is derived from its two bony ends
 * on the hip bone and says so. The internal oblique and transversus abdominis are in the catalog and not on
 * disk, so no anchor claims to sit where their aponeuroses split — that split is narrated and left in the
 * scenes' gaps[] instead.
 *
 * Four things this tool refuses to invent, because a plausible marker is worse than no marker:
 *   · the ARCUATE LINE — the lower edge of the posterior sheath. It is a line on a fascia, not an object,
 *     and its level is stated relative to the umbilicus, which is not in the catalog either.
 *   · the PUBIC TUBERCLE — a small prominence at the lateral end of the pubic crest. Nothing in the
 *     geometry distinguishes it from the rest of the crest, so the measured pubic-crest contact is emitted
 *     under its own honest name and the tubercle is described in narration as lying at its lateral end.
 *   · the DEEP INGUINAL RING — a hole in the transversalis fascia, which is not on disk and has no mesh.
 *   · the SUPERFICIAL INGUINAL RING — a defect in the external oblique aponeurosis; the mesh is a closed
 *     surface with no such opening in it.
 *
 * ---- the coordinate frame, re-checked rather than assumed ----
 *
 * BodyParts3D ships in an LPS frame:  +X = the body's LEFT, +Y = POSTERIOR, +Z = SUPERIOR.
 * The assertions below re-prove all three on the meshes this tool is handed and emit nothing if they fail.
 *
 * ---- how each landmark is found ----
 *
 *   EXTREME   — the furthest vertex in a stated direction, printed with its distance from the mesh's own
 *               surface centroid so a human can sanity-check the number.
 *   CONSTRAINED EXTREME — the furthest vertex in a stated direction within a stated slab of the mesh. Used
 *               only where the constraint is itself an anatomical fact (the ASIS is the most anterior point
 *               of the ILIAC part of the bone, not of the whole bone — the pubis is further forward).
 *   CONTACT   — the nearest point on mesh A to mesh B. A muscle attachment is where the muscle meets the
 *               bone, so the meeting point IS the attachment. The gap in mm is printed, never rounded away.
 *   MIDPOINT  — the halfway point between two measured landmarks. Surface-anatomy points like the
 *               mid-inguinal point are DEFINED as a midpoint between two bony points, so this is the
 *               definition carried out, not an estimate. Such a point lies in soft tissue, off the bone
 *               surface, which is correct: that is where the femoral artery is.
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
  hip_r: 'FMA16586',      // right hip bone — ASIS, iliac crest, pubic crest, symphyseal surface
  rect_r: 'FMA13377',     // right rectus abdominis
  extobl_r: 'FMA13336',   // right external oblique
  sternbody: 'FMA7487',   // body of sternum — midline, superior reference
  l1: 'FMA13072'          // first lumbar vertebra — posterior reference
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

const extreme = (m, axis, sign, filter) => {
  let best = null, bv = -Infinity;
  for (const p of m.v) {
    if (filter && !filter(p)) continue;
    const s = sign * p[axis];
    if (s > bv) { bv = s; best = p; }
  }
  if (!best) throw new Error('no vertex satisfied the constraint — refusing to emit a landmark');
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
const mid = (a, b) => [0, 1, 2].map(i => (a[i] + b[i]) / 2);
const SEE = 'see tools/derive-inguinal-sheath-landmarks.mjs';

let p, r;

/* ---- the two bony ends of the inguinal ligament ----------------------------------------------------
   The ASIS is the anterior end of the iliac crest. It is NOT the most anterior point of the whole hip
   bone — the pubis is further forward — so the search is constrained to the iliac part, the upper third
   of the bone by height. The constraint is an anatomical fact, not a fudge to make the answer come out. */
const hipZ = M.hip_r.b;
const iliacFloor = hipZ.lo[2] + 0.62 * hipZ.size[2];
const asis = extreme(M.hip_r, 1, -1, q => q[2] >= iliacFloor);
emit('asis', M.hip_r, asis,
  `geometry: CONSTRAINED EXTREME — the most anterior vertex of the right hip bone within the upper 38% of its height (the iliac part), ${dist(asis, M.hip_r.c).toFixed(1)} mm from its surface centroid. That point is the anterior superior iliac spine, the lateral attachment of the inguinal ligament. The constraint is needed because the pubis is further forward than the ASIS on the unconstrained bone; ${SEE}`);

const crestTop = extreme(M.hip_r, 2, +1);
emit('iliac_crest', M.hip_r, crestTop,
  `geometry: EXTREME — the highest (most superior) vertex of the right hip bone, ${dist(crestTop, M.hip_r.c).toFixed(1)} mm from its surface centroid: the tubercle of the iliac crest region at the top of the crest. Surface landmark for the L4 vertebral level and the upper limit of the abdominal wall's bony attachment; ${SEE}`);

r = contact(M.hip_r, M.rect_r);
const pubicCrest = r.p;
emit('pubic_crest', M.hip_r, pubicCrest,
  `geometry: CONTACT — nearest point on the right hip bone to the right rectus abdominis (gap ${r.gap.toFixed(2)} mm): the pubic crest, where the rectus takes origin. The PUBIC TUBERCLE sits at the lateral end of this crest and is not separately identifiable in the mesh, so this landmark is named for what was actually measured; ${SEE}`);

const symph = extreme(M.hip_r, 0, +1);
emit('pubic_symphysis', M.hip_r, symph,
  `geometry: EXTREME — the most medial (most body-left, therefore closest to the midline) vertex of the right hip bone, ${dist(symph, M.hip_r.c).toFixed(1)} mm from its surface centroid: the symphyseal surface of the pubis; ${SEE}`);

/* ---- the two midpoints students are examined on --------------------------------------------------- */
const midInguinal = mid(asis, symph);
emit('mid_inguinal_point', M.hip_r, midInguinal,
  `geometry: MIDPOINT — halfway between the measured ASIS and the measured pubic symphysis. This is the textbook definition of the mid-inguinal point carried out on the bone, not an estimate. It lies off the bone surface, in soft tissue, which is correct: the femoral artery is there; ${SEE}`);

const midLigament = mid(asis, pubicCrest);
emit('midpoint_of_ligament', M.hip_r, midLigament,
  `geometry: MIDPOINT — halfway between the measured ASIS and the measured pubic crest. The true midpoint of the inguinal ligament is halfway between ASIS and PUBIC TUBERCLE; the tubercle could not be isolated in the mesh, so the pubic crest stands in for it and this point therefore sits slightly MEDIAL to the true midpoint. The deep inguinal ring lies about 1.25 cm above the true midpoint and is not emitted at all — it is a hole in the transversalis fascia, which has no mesh; ${SEE}`);

/* ---- the sheath ------------------------------------------------------------------------------------
   Only one flat muscle is on disk, so only the anterior wall can be measured. The posterior surface of
   the rectus is a genuine geometric extreme and is what the posterior wall lies against above the
   arcuate line and what is bare below it. */
r = contact(M.rect_r, M.extobl_r);
emit('sheath_anterior_wall', M.rect_r, r.p,
  `geometry: CONTACT — nearest point on the right rectus abdominis to the right external oblique (gap ${r.gap.toFixed(2)} mm): where the external oblique aponeurosis lies against the muscle as the anterior wall of the rectus sheath; ${SEE}`);

const rz = M.rect_r.b;
const bellyLo = rz.lo[2] + 0.30 * rz.size[2], bellyHi = rz.lo[2] + 0.70 * rz.size[2];
p = extreme(M.rect_r, 1, +1, q => q[2] >= bellyLo && q[2] <= bellyHi);
emit('sheath_posterior_surface', M.rect_r, p,
  `geometry: CONSTRAINED EXTREME — the most posterior vertex of the right rectus abdominis within the middle 40% of its height, ${dist(p, M.rect_r.c).toFixed(1)} mm from its surface centroid: the back of the muscle belly. The constraint matters: unconstrained, the most posterior vertex of this mesh is at the PUBIC end, where the muscle curves backwards to its origin, and a label reading "posterior surface" would land on the origin instead of on the belly. Above the arcuate line this face is covered by the posterior wall of the sheath; below it the same face lies bare on transversalis fascia. The arcuate line itself is NOT emitted — it is a free edge of fascia with no mesh; ${SEE}`);

p = extreme(M.rect_r, 0, -1);
emit('linea_semilunaris', M.rect_r, p,
  `geometry: EXTREME — the most lateral (most body-right) vertex of the right rectus abdominis, ${dist(p, M.rect_r.c).toFixed(1)} mm from its surface centroid: the lateral border of the muscle, which is the linea semilunaris and the line along which the three aponeuroses split to form the sheath; ${SEE}`);

p = extreme(M.rect_r, 2, -1);
emit('rectus_lower_end', M.rect_r, p,
  `geometry: EXTREME — the lowest vertex of the right rectus abdominis, ${dist(p, M.rect_r.c).toFixed(1)} mm from its surface centroid: the pubic end of the muscle, below the arcuate line, where the sheath is entirely in front of it; ${SEE}`);

p = extreme(M.rect_r, 2, +1);
emit('rectus_upper_end', M.rect_r, p,
  `geometry: EXTREME — the highest vertex of the right rectus abdominis, ${dist(p, M.rect_r.c).toFixed(1)} mm from its surface centroid: the costal end, above the costal margin level where the posterior wall of the sheath is deficient in a different way — there the muscle lies directly on the costal cartilages; ${SEE}`);

if (JSON_OUT) { console.log(JSON.stringify(out, null, 2)); process.exit(0); }
console.log('frame OK — +X left, +Y posterior, +Z superior, re-proved on these meshes\n');
for (const o of out) console.log(`${o.key.padEnd(24)} on ${o.on}  uvw [${o.uvw.join(', ')}]\n    ${o.calibrated_by}\n`);
