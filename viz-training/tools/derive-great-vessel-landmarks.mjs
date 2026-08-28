#!/usr/bin/env node
/* MedBank · viz-training/tools/derive-great-vessel-landmarks.mjs
 *
 * Measure the named landmarks of the great vessels on the meshes themselves, so a label lands on the thing
 * it names.
 *
 * The catalog has an ascending aorta, an arch, a descending aorta, both venae cavae, one generic pulmonary
 * artery and one generic pulmonary vein. It has NO brachiocephalic trunk, no pulmonary trunk of its own, no
 * ligamentum arteriosum, no aortic valve, no azygos vein. Those are exactly the things the exam asks about,
 * and the only honest way to point at them is a landmark anchor — a `uvw` fraction of the parent mesh's own
 * bounding box. An anchor typed in by eye is worse than a missing one: it puts the words "aortic isthmus"
 * somewhere plausible and the student believes it.
 *
 *   node viz-training/tools/derive-great-vessel-landmarks.mjs
 *   node viz-training/tools/derive-great-vessel-landmarks.mjs --json
 *
 * ---- the coordinate frame, re-checked rather than assumed ----
 *
 * BodyParts3D ships in an LPS frame:  +X = the body's LEFT, +Y = POSTERIOR, +Z = SUPERIOR.
 * The assertions below re-prove all three on the meshes this tool is handed and emit nothing if they fail:
 *   · the manubrium must sit ABOVE (greater Z) the body of the sternum
 *   · the sternum must sit ANTERIOR (lesser Y) to the fourth thoracic vertebra
 *   · the ascending aorta must sit to the body's RIGHT (lesser X) of the descending aorta
 *   · the arch must sit ABOVE the wall of the heart
 *
 * ---- how each landmark is found ----
 *
 *   EXTREME  — the furthest vertex in a stated direction, printed with the distance from the mesh's own
 *              surface centroid so a human can sanity-check the number.
 *   CONTACT  — the nearest point on mesh A to mesh B. An aortic isthmus, a cavo-atrial junction and a
 *              pulmonary bifurcation are all places where two surfaces meet or all but meet, so the meeting
 *              point IS the landmark. The gap in mm is printed and never rounded away: a gap near zero means
 *              the surfaces genuinely touch, and a large gap is itself the finding — the gap between the arch
 *              and the right subclavian artery is the length of the brachiocephalic trunk the catalog lacks.
 *
 * Contact search is exact, not sampled: a uniform spatial hash over the deduplicated vertices of B, queried
 * with an expanding shell of cells around each vertex of A. Sub-sampling would have been faster and would
 * have quietly moved every landmark by however much it happened to miss.
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
  asc: 'FMA3736',        // ascending aorta
  arch: 'FMA3768',       // arch of aorta
  desc: 'FMA3784',       // descending aorta
  svc: 'FMA4720',        // superior vena cava
  ivc: 'FMA10951',       // inferior vena cava
  pa: 'FMA66326',        // pulmonary artery — trunk and both branches in one mesh
  pv: 'FMA66643',        // pulmonary vein
  bcv_r: 'FMA4751',      // right brachiocephalic vein
  subclav_r: 'FMA3953',  // right subclavian artery
  pulmvalve: 'FMA7246',  // pulmonary valve — the true origin of the trunk
  heart: 'FMA7274',      // wall of heart
  t4: 'FMA9248',         // fourth thoracic vertebra
  t12: 'FMA10081',       // twelfth thoracic vertebra — the level of the aortic hiatus
  manubrium: 'FMA7486',  // manubrium
  sternbody: 'FMA7487'   // body of sternum
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
if (!(M.manubrium.c[2] > M.sternbody.c[2])) fails.push('the manubrium is not above the body of the sternum — +Z is not SUPERIOR');
if (!(M.sternbody.c[1] < M.t4.c[1])) fails.push('the sternum is not anterior to the fourth thoracic vertebra — +Y is not POSTERIOR');
if (!(M.asc.c[0] < M.desc.c[0])) fails.push('the ascending aorta is not to the body right of the descending aorta — +X is not the body LEFT');
if (!(M.arch.c[2] > M.heart.c[2])) fails.push('the arch of the aorta is not above the heart — the meshes are not in the frame this tool assumes');
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

/* Uniform spatial hash over B, so the nearest-point search is exact without being O(n·m). */
function grid(pts, cell) {
  const g = new Map();
  for (const p of pts) {
    const k = Math.floor(p[0] / cell) + '|' + Math.floor(p[1] / cell) + '|' + Math.floor(p[2] / cell);
    let b = g.get(k); if (!b) g.set(k, b = []);
    b.push(p);
  }
  return { g, cell };
}

/* Shell offsets, computed once. Rescanning the whole cube for every radius turned an O(R) walk into O(R^4)
   and the tool simply never returned — worth saying out loud, because a landmark tool that hangs gets
   replaced by a landmark typed in by eye. */
const SHELLS = [];
for (let r = 0; r < 48; r++) {
  const s = [];
  for (let i = -r; i <= r; i++) for (let j = -r; j <= r; j++) for (let k = -r; k <= r; k++)
    if (Math.max(Math.abs(i), Math.abs(j), Math.abs(k)) === r) s.push([i, j, k]);
  SHELLS.push(s);
}

function nearestIn(G, p, bestSoFar) {
  const { g, cell } = G;
  const cx = Math.floor(p[0] / cell), cy = Math.floor(p[1] / cell), cz = Math.floor(p[2] / cell);
  let best = bestSoFar;
  for (let r = 0; r < SHELLS.length; r++) {
    /* stop as soon as no cell in this shell could hold anything nearer than what we already have */
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
  /* Seed the search with a coarse brute-force pass. Without a finite starting bound the very first vertex
     expands shells to the edge of the grid before it finds anything, which is the whole cost. */
  let best = Infinity, bestP = null;
  const as = stride(a.v, 1500), bs = stride(bMesh.v, 1500);
  for (const p of as) for (const q of bs) {
    const d = (p[0] - q[0]) ** 2 + (p[1] - q[1]) ** 2 + (p[2] - q[2]) ** 2;
    if (d < best) { best = d; bestP = p; }
  }
  /* Then the exact pass, bounded by that seed. */
  const span = Math.max(...bMesh.b.size);
  const G = grid(bMesh.v, Math.max(span / 24, 1));
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
const SEE = 'see tools/derive-great-vessel-landmarks.mjs';

let p, r;

/* ---- the aorta, root to hiatus ---- */
r = contact(M.asc, M.heart);
emit('aortic_root', M.asc, r.p, `geometry: nearest CONTACT point between the ascending aorta and the wall of the heart — the aortic root, where the aorta leaves the left ventricle and the coronary arteries arise (gap ${r.gap.toFixed(2)} mm); ${SEE}`);

r = contact(M.asc, M.arch);
emit('arch_begins', M.asc, r.p, `geometry: nearest CONTACT point between the ascending aorta and the arch — where one becomes the other, at the level of the sternal angle (gap ${r.gap.toFixed(2)} mm); ${SEE}`);

r = contact(M.arch, M.desc);
emit('aortic_isthmus', M.arch, r.p, `geometry: nearest CONTACT point between the arch of the aorta and the descending aorta — the isthmus, the fixed point just distal to the left subclavian artery where a decelerating aorta tears (gap ${r.gap.toFixed(2)} mm); ${SEE}`);

r = contact(M.arch, M.subclav_r);
emit('brachiocephalic_trunk_origin', M.arch, r.p, `geometry: nearest CONTACT point between the arch of the aorta and the right subclavian artery — the arch end of the missing brachiocephalic trunk, so the printed gap of ${r.gap.toFixed(2)} mm IS the length of the vessel the catalog does not carry; ${SEE}`);

p = extreme(M.desc, 2, -1);
emit('aorta_lowest', M.desc, p, `geometry: the lowest (most inferior) vertex of the descending aorta mesh, ${dist(p, M.desc.c).toFixed(1)} mm from its surface centroid — this mesh runs on past the diaphragm to the aortic bifurcation, so this point is ABDOMINAL and is emitted to mark where the mesh ends, not where the thorax does; ${SEE}`);

r = contact(M.desc, M.t12);
emit('aortic_hiatus', M.desc, r.p, `geometry: nearest CONTACT point between the descending aorta and the twelfth thoracic vertebra — the aortic hiatus at T12, where the aorta leaves the thorax behind the diaphragm (gap ${r.gap.toFixed(2)} mm); ${SEE}`);

/* ---- the pulmonary side ---- */
r = contact(M.pa, M.pulmvalve);
emit('pulmonary_trunk_origin', M.pa, r.p, `geometry: nearest CONTACT point between the pulmonary artery mesh and the pulmonary valve — the origin of the trunk from the right ventricular outflow tract (gap ${r.gap.toFixed(2)} mm); ${SEE}`);

r = contact(M.pa, M.arch);
emit('pulmonary_bifurcation', M.pa, r.p, `geometry: nearest CONTACT point between the pulmonary artery and the arch of the aorta — the trunk divides here, under the concavity of the arch, and the ligamentum arteriosum bridges this exact gap of ${r.gap.toFixed(2)} mm; ${SEE}`);

r = contact(M.pv, M.heart);
emit('pulmonary_venous_return', M.pv, r.p, `geometry: nearest CONTACT point between the pulmonary vein and the wall of the heart — where oxygenated blood re-enters the left atrium (gap ${r.gap.toFixed(2)} mm); ${SEE}`);

/* ---- the systemic veins ---- */
r = contact(M.svc, M.bcv_r);
emit('svc_formation', M.svc, r.p, `geometry: nearest CONTACT point between the superior vena cava and the right brachiocephalic vein — where the two brachiocephalic veins unite to form the cava, behind the right first costal cartilage (gap ${r.gap.toFixed(2)} mm); ${SEE}`);

r = contact(M.svc, M.heart);
emit('svc_atrial_junction', M.svc, r.p, `geometry: nearest CONTACT point between the superior vena cava and the wall of the heart — the cavo-atrial junction, the point a central line tip should reach and not pass (gap ${r.gap.toFixed(2)} mm); ${SEE}`);

r = contact(M.ivc, M.heart);
emit('ivc_atrial_junction', M.ivc, r.p, `geometry: nearest CONTACT point between the inferior vena cava and the wall of the heart — where it enters the right atrium, a centimetre or two after piercing the central tendon at T8 (gap ${r.gap.toFixed(2)} mm); ${SEE}`);

/* ---- the surface landmark the whole topic is read against ---- */
r = contact(M.manubrium, M.sternbody);
emit('sternal_angle', M.manubrium, r.p, `geometry: nearest CONTACT point between the manubrium and the body of the sternum — the manubriosternal joint, i.e. the sternal angle, the plane the arch begins and ends on (gap ${r.gap.toFixed(2)} mm); ${SEE}`);

if (JSON_OUT) { console.log(JSON.stringify(out, null, 2)); process.exit(0); }
console.log('frame OK — +X left, +Y posterior, +Z superior, re-proved on these meshes\n');
for (const o of out) console.log(`${o.key.padEnd(30)} on ${o.on}  uvw [${o.uvw.join(', ')}]\n    ${o.calibrated_by}\n`);
