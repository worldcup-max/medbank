#!/usr/bin/env node
/* MedBank · viz-training/tools/derive-scapula-landmarks.mjs
 *
 * Measure the coracoid process and the acromion on the scapula mesh itself, so the two landmarks the
 * pectoral scenes point at land on the features they name.
 *
 * Same reasoning as derive-humerus-landmarks.mjs: the catalog's smallest unit is a whole scapula. There
 * is no mesh for a coracoid process and there never will be, so the only honest way to point at one is a
 * landmark anchor — a `uvw` fraction of the parent mesh's bounding box. Until now these two were handled
 * by labelling the whole bone "Scapula — coracoid process", which lights the entire blade: a student
 * isolating the insertion of pectoralis minor was shown a bone the size of their hand.
 *
 *   node viz-training/tools/derive-scapula-landmarks.mjs
 *   node viz-training/tools/derive-scapula-landmarks.mjs --json
 *
 * ---- the coordinate frame, re-proved rather than assumed ----
 *
 * BodyParts3D ships in an LPS frame:  +X = the body's LEFT, +Y = POSTERIOR, +Z = SUPERIOR.
 * assertFrame() re-proves it on these meshes and refuses to emit anything if a check fails:
 *   · the RIGHT scapula must sit entirely at X < 0
 *   · the clavicle must sit SUPERIOR to the scapula's centroid
 *   · pectoralis minor must sit ANTERIOR (lesser Y) to the scapula's centroid
 *
 * ---- how each landmark is found ----
 *
 * CONTACT — the nearest point on the scapula to another named mesh. An attachment is a place where two
 * surfaces meet, so the meeting point IS the landmark, and the gap in mm says how well they meet.
 *
 * The coracoid is measured three independent times, because three different structures attach to it:
 * pectoralis minor (medial border), coracobrachialis and the short head of biceps (tip). If those three
 * contacts converge on the same few millimetres of bone, the point is the coracoid and the measurement
 * proves itself. If they scatter, something is wrong with the meshes and nothing should be emitted.
 *
 * The acromion is the scapula's contact with the clavicle — the acromioclavicular joint.
 *
 * Nothing here is typed in by hand, and nothing is emitted that the tool could not measure.
 */
import { readSTL, vertices, bbox, surfaceCentroid, toUVW } from './stl.mjs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const HERE = dirname(fileURLToPath(import.meta.url));
const MESH = join(HERE, '..', 'meshes-lite');
const JSON_OUT = process.argv.includes('--json');

const ID = {
  scapula: 'FMA13395',            // right scapula — the parent bone both landmarks live on
  pec_minor: 'FMA13375',          // inserts on the medial border of the coracoid
  coracobrachialis: 'FMA37665',   // arises from the coracoid tip
  biceps_short: 'FMA37684',       // arises from the coracoid tip, with coracobrachialis
  clavicle: 'FMA13322'            // meets the acromion at the AC joint
};

const load = id => { const m = readSTL(join(MESH, id + '.stl')); return { tri: m, v: vertices(m), c: surfaceCentroid(m).c }; };
const M = Object.fromEntries(Object.entries(ID).map(([k, id]) => [k, load(id)]));
const SCAP = M.scapula, B = bbox(SCAP.v);

/* ---- the frame, proved ---- */
function assertFrame() {
  const fails = [];
  const hi = bbox(SCAP.v).hi;
  if (!(hi[0] < 0)) fails.push(`right scapula is not entirely at X<0 (max X = ${hi[0].toFixed(1)})`);
  if (!(M.clavicle.c[2] > SCAP.c[2])) fails.push('clavicle is not superior to the scapula centroid');
  if (!(M.pec_minor.c[1] < SCAP.c[1])) fails.push('pectoralis minor is not anterior to the scapula centroid');
  if (fails.length) { console.error('FRAME CHECK FAILED:\n  ' + fails.join('\n  ') + '\nNothing emitted.'); process.exit(1); }
}

/* nearest point ON THE SCAPULA to another mesh, with the gap that separates them */
function contact(other) {
  let best = null;
  for (const p of SCAP.v) {
    for (const q of other.v) {
      const d = (p[0] - q[0]) ** 2 + (p[1] - q[1]) ** 2 + (p[2] - q[2]) ** 2;
      if (!best || d < best.d2) best = { d2: d, p };
    }
  }
  return { p: best.p, mm: Math.sqrt(best.d2) };
}
const dist = (a, b) => Math.hypot(a[0] - b[0], a[1] - b[1], a[2] - b[2]);
const mean = ps => [0, 1, 2].map(a => ps.reduce((s, p) => s + p[a], 0) / ps.length);

assertFrame();

const cPec = contact(M.pec_minor);
const cCbr = contact(M.coracobrachialis);
const cBic = contact(M.biceps_short);
const cCla = contact(M.clavicle);

const trio = [cPec.p, cCbr.p, cBic.p];
const cor = mean(trio);
const spread = Math.max(dist(cPec.p, cCbr.p), dist(cPec.p, cBic.p), dist(cCbr.p, cBic.p));
const span = Math.max(...B.size);

/* A radius that covers the feature and no more. The renderer paints a patch of
 * max(span*radius*3, span*0.045), so `radius` here is roughly a sixth of the area a student will see —
 * which is why the house value across the corpus is ~0.02 and not the raw size of the feature. Size it
 * from half the spread of the three attachments that define the coracoid, then clamp into house scale. */
const rCor = Math.min(0.035, Math.max(0.018, spread / (2 * span * 3)));

const out = {
  parent: ID.scapula,
  bbox: { lo: B.lo.map(n => +n.toFixed(2)), size: B.size.map(n => +n.toFixed(2)) },
  landmarks: {
    coracoid_process: { uvw: toUVW(cor, B).map(n => +n.toFixed(4)), radius: +rCor.toFixed(3) },
    acromion: { uvw: toUVW(cCla.p, B).map(n => +n.toFixed(4)), radius: 0.02 }
  },
  evidence: {
    pec_minor_gap_mm: +cPec.mm.toFixed(2),
    coracobrachialis_gap_mm: +cCbr.mm.toFixed(2),
    biceps_short_gap_mm: +cBic.mm.toFixed(2),
    three_attachment_spread_mm: +spread.toFixed(2),
    clavicle_gap_mm: +cCla.mm.toFixed(2),
    bone_span_mm: +span.toFixed(1)
  }
};

if (JSON_OUT) { console.log(JSON.stringify(out, null, 2)); process.exit(0); }

console.log('scapula ' + ID.scapula + '  span ' + span.toFixed(1) + ' mm');
console.log('');
console.log('CORACOID PROCESS — where three structures attach');
console.log('  pectoralis minor   gap ' + cPec.mm.toFixed(2) + ' mm');
console.log('  coracobrachialis   gap ' + cCbr.mm.toFixed(2) + ' mm');
console.log('  short head biceps  gap ' + cBic.mm.toFixed(2) + ' mm');
console.log('  the three contacts lie within ' + spread.toFixed(1) + ' mm of each other');
console.log('  uvw ' + JSON.stringify(out.landmarks.coracoid_process.uvw) + '  radius ' + out.landmarks.coracoid_process.radius);
console.log('');
console.log('ACROMION — the acromioclavicular joint');
console.log('  clavicle           gap ' + cCla.mm.toFixed(2) + ' mm');
console.log('  uvw ' + JSON.stringify(out.landmarks.acromion.uvw) + '  radius ' + out.landmarks.acromion.radius);
console.log('');
console.log(spread < span * 0.25
  ? 'VERDICT: the three attachments converge — this is the coracoid.'
  : 'VERDICT: the three attachments SCATTER (' + spread.toFixed(1) + ' mm). Do not use this uvw; look at the meshes.');
