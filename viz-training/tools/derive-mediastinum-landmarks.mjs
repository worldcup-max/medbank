#!/usr/bin/env node
/* MedBank · viz-training/tools/derive-mediastinum-landmarks.mjs
 *
 * Measure the named landmarks of the airway and the mediastinum on the meshes themselves, so a label lands
 * on the thing it names.
 *
 * The catalog has a trachea and one generic bronchus; it has no carina, no sternal angle, no plane of
 * Ludwig, no ligamentum arteriosum and no cavo-atrial junction. Those are the landmarks the exam asks for,
 * and the only honest way to point at them is a landmark anchor — a `uvw` fraction of the parent mesh's own
 * bounding box. An anchor typed in by eye is worse than a missing one: it puts the words "sternal angle"
 * somewhere plausible and the student believes it.
 *
 *   node viz-training/tools/derive-mediastinum-landmarks.mjs
 *   node viz-training/tools/derive-mediastinum-landmarks.mjs --json
 *
 * ---- the coordinate frame, re-checked rather than assumed ----
 *
 * BodyParts3D ships in an LPS frame:  +X = the body's LEFT, +Y = POSTERIOR, +Z = SUPERIOR.
 * assertFrame() re-proves all three on the meshes it is handed and refuses to emit anything if they fail:
 *   · the manubrium must sit ABOVE (greater Z) the body of the sternum
 *   · the sternum must sit ANTERIOR (lesser Y) to the fourth thoracic vertebra
 *   · the ascending aorta must sit to the body's RIGHT (lesser X) of the descending aorta
 *   · the trachea must sit ABOVE the wall of the heart
 *
 * ---- how each landmark is found ----
 *
 *   EXTREME  — the furthest vertex in a stated direction, printed with the distance from the mesh's own
 *              surface centroid so a human can sanity-check the number.
 *   CONTACT  — the nearest point on mesh A to mesh B. A sternal angle, a cavo-atrial junction and a
 *              ligamentum arteriosum are all places where two surfaces meet, so the meeting point IS the
 *              landmark. The gap in mm is printed: a gap near zero means the surfaces genuinely touch.
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
  trachea: 'FMA7394',   // trachea            — carina is its lowest point, at the bifurcation
  manubrium: 'FMA7486', // manubrium          — sternal angle is where it meets the body
  sternbody: 'FMA7487', // body of sternum
  t4: 'FMA9248',        // fourth thoracic vertebra
  t12: 'FMA10081',      // twelfth thoracic vertebra — the level of the aortic hiatus
  arch: 'FMA3768',      // arch of aorta
  asc: 'FMA3736',       // ascending aorta
  desc: 'FMA3784',      // descending aorta
  svc: 'FMA4720',       // superior vena cava
  ivc: 'FMA10951',      // inferior vena cava
  heart: 'FMA7274',     // wall of heart
  pa: 'FMA66326',       // pulmonary artery
  rul: 'FMA7333'        // upper lobe of right lung
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
if (!(M.manubrium.c[2] > M.sternbody.c[2])) fails.push('the manubrium is not above the body of the sternum — +Z is not SUPERIOR');
if (!(M.sternbody.c[1] < M.t4.c[1])) fails.push('the sternum is not anterior to the fourth thoracic vertebra — +Y is not POSTERIOR');
if (!(M.asc.c[0] < M.desc.c[0])) fails.push('the ascending aorta is not to the body right of the descending aorta — +X is not the body LEFT');
if (!(M.trachea.c[2] > M.heart.c[2])) fails.push('the trachea is not above the heart — the meshes are not in the frame this tool assumes');
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
const SEE = 'see tools/derive-mediastinum-landmarks.mjs';

let p, r;

/* ---- airway ---- */
p = extreme(M.trachea, 2, -1);
emit('carina', M.trachea, p, `geometry: the lowest (most inferior) vertex of the trachea — the bifurcation, where the carina sits, ${dist(p, M.trachea.c).toFixed(1)} mm from the trachea's surface centroid; ${SEE}`);

p = extreme(M.trachea, 2, +1);
emit('trachea_start', M.trachea, p, `geometry: the highest (most superior) vertex of the trachea — its beginning at the lower border of the cricoid cartilage, ${dist(p, M.trachea.c).toFixed(1)} mm from the trachea's surface centroid; ${SEE}`);

r = contact(M.trachea, M.t4);
emit('t4_level', M.trachea, r.p, `geometry: nearest CONTACT point between the trachea and the fourth thoracic vertebra — the vertebral level the bifurcation lies at (gap ${r.gap.toFixed(2)} mm); ${SEE}`);

/* ---- sternal angle: the plane of Ludwig ---- */
r = contact(M.manubrium, M.sternbody);
emit('sternal_angle', M.manubrium, r.p, `geometry: nearest CONTACT point between the manubrium and the body of the sternum — the manubriosternal joint, i.e. the sternal angle (gap ${r.gap.toFixed(2)} mm); ${SEE}`);

/* ---- mediastinum ---- */
p = extreme(M.arch, 2, +1);
emit('arch_summit', M.arch, p, `geometry: the highest (most superior) vertex of the arch of the aorta, ${dist(p, M.arch.c).toFixed(1)} mm from the arch's surface centroid; ${SEE}`);

r = contact(M.arch, M.pa);
emit('ligamentum_arteriosum', M.arch, r.p, `geometry: nearest CONTACT point between the arch of the aorta and the pulmonary artery — where the ligamentum arteriosum runs and the left recurrent laryngeal nerve hooks (gap ${r.gap.toFixed(2)} mm); ${SEE}`);

r = contact(M.svc, M.heart);
emit('svc_atrial_junction', M.svc, r.p, `geometry: nearest CONTACT point between the superior vena cava and the wall of the heart — the cavo-atrial junction (gap ${r.gap.toFixed(2)} mm); ${SEE}`);

r = contact(M.ivc, M.heart);
emit('ivc_atrial_junction', M.ivc, r.p, `geometry: nearest CONTACT point between the inferior vena cava and the wall of the heart — where it enters the right atrium after piercing the diaphragm (gap ${r.gap.toFixed(2)} mm); ${SEE}`);

r = contact(M.trachea, M.arch);
emit('arch_over_airway', M.trachea, r.p, `geometry: nearest CONTACT point between the trachea and the arch of the aorta — the arch crossing the airway just above the bifurcation (gap ${r.gap.toFixed(2)} mm); ${SEE}`);

/* NOT the lowest vertex of the descending aorta: that mesh runs on past the diaphragm to the aortic
   bifurcation, so its lowest point is in the abdomen and calling it the hiatus would be a lie the student
   could not check. The hiatus is at T12, so measure it against T12. */
r = contact(M.desc, M.t12);
emit('aortic_hiatus', M.desc, r.p, `geometry: nearest CONTACT point between the descending aorta and the twelfth thoracic vertebra — the aortic hiatus, where the aorta leaves the posterior mediastinum behind the diaphragm at T12 (gap ${r.gap.toFixed(2)} mm); ${SEE}`);

r = contact(M.t4, M.desc);
emit('ludwig_posterior', M.t4, r.p, `geometry: nearest CONTACT point between the fourth thoracic vertebra and the descending aorta — the back end of the transthoracic plane, where the superior mediastinum stops (gap ${r.gap.toFixed(2)} mm); ${SEE}`);

if (JSON_OUT) { console.log(JSON.stringify(out, null, 2)); process.exit(0); }
console.log('frame OK — +X left, +Y posterior, +Z superior, re-proved on these meshes\n');
for (const o of out) console.log(`${o.key.padEnd(24)} on ${o.on}  uvw [${o.uvw.join(', ')}]\n    ${o.calibrated_by}\n`);
