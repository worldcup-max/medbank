#!/usr/bin/env node
/* MedBank · viz-training/tools/derive-forearm-landmarks.mjs
 *
 * Measure the named parts of the radius and the ulna on the meshes themselves, so a label lands on the
 * feature it names.
 *
 * Same reasoning as derive-humerus-landmarks.mjs: the catalog's smallest unit is a whole radius and a whole
 * ulna. There is no mesh for an olecranon, a radial head, a styloid process or either radioulnar joint, so
 * the only honest way to point at them is a landmark anchor — a `uvw` fraction of the parent mesh's own
 * bounding box. An anchor typed in by eye is worse than a missing one: it puts the words "ulnar styloid"
 * somewhere plausible and the student believes it.
 *
 *   node viz-training/tools/derive-forearm-landmarks.mjs
 *   node viz-training/tools/derive-forearm-landmarks.mjs --json
 *
 * ---- the coordinate frame, re-checked rather than assumed ----
 *
 * BodyParts3D ships in an LPS frame:  +X = the body's LEFT, +Y = POSTERIOR, +Z = SUPERIOR.
 * assertFrame() re-proves it on the meshes it is handed and refuses to emit anything if it fails:
 *   · the RIGHT radius and RIGHT ulna must sit entirely at X < 0
 *   · each one's longest bounding-box axis must be Z (a long bone along the limb)
 *   · at their proximal ends the ulna must be MEDIAL to the radius (greater X) — that is what makes this
 *     an anatomical forearm and not a mirrored one, and it is the fact every side-naming below rests on
 *   · the olecranon must reach higher (greater Z) than the top of the radius
 *
 * ---- how each landmark is found ----
 *
 *   CONTACT  — the nearest point on the bone to another named mesh. A joint or an attachment is a place
 *              where two surfaces meet, so the meeting point IS the landmark. The gap in mm is printed:
 *              a gap near zero means the surfaces genuinely touch there.
 *   EXTREME  — the furthest point in a stated direction within a stated slice of the bone, reported with
 *              the distance from the shaft axis so a human can check the number rather than trust the word.
 *
 * Nothing here is typed in by hand, and nothing is emitted that the tool could not measure.
 */
import { readSTL, vertices, bbox, toUVW } from './stl.mjs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const HERE = dirname(fileURLToPath(import.meta.url));
const MESH = join(HERE, '..', 'meshes-lite');
const JSON_OUT = process.argv.includes('--json');

const ID = {
  radius: 'FMA23464',      // right radius
  ulna: 'FMA23467',        // right ulna
  humerus: 'FMA23130',     // right humerus  — capitulum meets the radial head, trochlea the trochlear notch
  bicepsLong: 'FMA37686'   // long head of right biceps brachii — its tendon reaches the radial tuberosity
};

const load = id => vertices(readSTL(join(MESH, id + '.stl')));
const V = Object.fromEntries(Object.entries(ID).map(([k, id]) => [k, load(id)]));
const B = { radius: bbox(V.radius), ulna: bbox(V.ulna) };

/* ---- frame ---- */
function assertFrame() {
  const fail = [];
  for (const bone of ['radius', 'ulna']) {
    if (B[bone].hi[0] >= 0) fail.push(`right ${bone} is not entirely at X<0 (hi X = ${B[bone].hi[0].toFixed(1)})`);
    const longest = B[bone].size.indexOf(Math.max(...B[bone].size));
    if (longest !== 2) fail.push(`the ${bone}'s longest axis is ${'XYZ'[longest]}, not Z`);
  }
  const meanXProx = v => {
    const b = bbox(v), cut = b.lo[2] + 0.85 * b.size[2];
    const p = v.filter(q => q[2] >= cut);
    return p.reduce((s, q) => s + q[0], 0) / p.length;
  };
  const ux = meanXProx(V.ulna), rx = meanXProx(V.radius);
  if (!(ux > rx)) fail.push(`proximally the ulna (mean X ${ux.toFixed(1)}) is not medial to the radius (${rx.toFixed(1)}) — the side naming below would be inverted`);
  if (!(B.ulna.hi[2] > B.radius.hi[2])) fail.push('the ulna does not reach higher than the radius — the olecranon is not the top of this forearm');
  if (fail.length) { console.error('FRAME CHECK FAILED:\n  ' + fail.join('\n  ') + '\nNothing emitted.'); process.exit(1); }
  return { ulnaProximalX: ux.toFixed(1), radiusProximalX: rx.toFixed(1),
           ulnaTopZ: B.ulna.hi[2].toFixed(1), radiusTopZ: B.radius.hi[2].toFixed(1) };
}

/* ---- helpers, per bone ---- */
const d2 = (a, b) => (a[0] - b[0]) ** 2 + (a[1] - b[1]) ** 2 + (a[2] - b[2]) ** 2;
function tools(bone) {
  const pts = V[bone], b = B[bone];
  const zFrac = p => (p[2] - b.lo[2]) / b.size[2];
  const band = (lo, hi) => pts.filter(p => zFrac(p) >= lo && zFrac(p) <= hi);
  const contact = (other, lo = 0, hi = 1) => {
    const s = band(lo, hi);
    let best = null, bd = Infinity;
    for (const p of s) for (const q of other) { const d = d2(p, q); if (d < bd) { bd = d; best = p; } }
    return { p: best, gap: Math.sqrt(bd) };
  };
  const extreme = ([axis, sign], lo, hi) => {
    const s = band(lo, hi);
    let best = null, bv = -Infinity;
    for (const p of s) { const v = sign * p[axis]; if (v > bv) { bv = v; best = p; } }
    return { p: best, value: bv * sign };
  };
  const mid = band(0.35, 0.65);
  const shaft = [mid.reduce((s, p) => s + p[0], 0) / mid.length, mid.reduce((s, p) => s + p[1], 0) / mid.length];
  const offAxis = p => Math.hypot(p[0] - shaft[0], p[1] - shaft[1]);
  return { b, band, contact, extreme, offAxis, zFrac };
}
const R = tools('radius'), U = tools('ulna');

const frame = assertFrame();
const out = [];
const add = (bone, key, label, how, r, evidence) => out.push({
  bone, key, label, how,
  uvw: toUVW(r.p, B[bone]).map(n => +n.toFixed(4)),
  xyz: r.p.map(n => +n.toFixed(1)),
  evidence
});

/* ================= RADIUS ================= */
{
  const r = R.contact(V.humerus, 0.85, 1);
  add('radius', 'head_of_radius', 'Head of radius',
    'CONTACT · nearest point on the radius to the humerus, within the proximal 15% — the radial head turning on the capitulum',
    r, `gap to humerus ${r.gap.toFixed(2)} mm`);
}
{
  const r = R.contact(V.ulna, 0.8, 1);
  add('radius', 'proximal_radioulnar', 'Proximal radioulnar joint',
    'CONTACT · nearest point on the radius to the ulna, within the proximal 20% — the radial head in the radial notch of the ulna',
    r, `gap to ulna ${r.gap.toFixed(2)} mm`);
}
{
  const r = R.contact(V.bicepsLong, 0.6, 0.95);
  add('radius', 'radial_tuberosity', 'Radial tuberosity',
    'CONTACT · nearest point on the radius to the long head of biceps, in the upper third — the biceps tendon inserts on the tuberosity',
    r, `gap to the biceps tendon ${r.gap.toFixed(2)} mm · ${R.offAxis(r.p).toFixed(1)} mm off the shaft axis`);
}
{
  const r = R.extreme([2, -1], 0, 0.12);
  add('radius', 'radial_styloid', 'Styloid process of the radius',
    'EXTREME · the most distal point of the distal 12% of the radius',
    r, `${R.offAxis(r.p).toFixed(1)} mm off the shaft axis · reaches Z ${r.p[2].toFixed(1)}, which is ${(B.ulna.lo[2] - r.p[2]).toFixed(1)} mm below the lowest point of the ulna`);
}
{
  const r = R.contact(V.ulna, 0, 0.15);
  add('radius', 'ulnar_notch', 'Ulnar notch of the radius',
    'CONTACT · nearest point on the radius to the ulna, within the distal 15% — the distal radioulnar joint',
    r, `gap to ulna ${r.gap.toFixed(2)} mm`);
}

/* ================= ULNA ================= */
{
  const r = U.extreme([2, +1], 0.85, 1);
  add('ulna', 'olecranon', 'Olecranon',
    'EXTREME · the most proximal point of the ulna',
    r, `${U.offAxis(r.p).toFixed(1)} mm off the shaft axis · ${(r.p[2] - B.radius.hi[2]).toFixed(1)} mm above the top of the radius`);
}
{
  const r = U.contact(V.humerus, 0.8, 1);
  add('ulna', 'trochlear_notch', 'Trochlear notch',
    'CONTACT · nearest point on the ulna to the humerus, within the proximal 20% — the notch gripping the trochlea',
    r, `gap to humerus ${r.gap.toFixed(2)} mm`);
}
{
  const r = U.extreme([1, -1], 0.78, 0.95);
  add('ulna', 'coronoid_process', 'Coronoid process',
    'EXTREME · the most anterior point of the ulna between 78% and 95% of its height — the lip in front of and below the trochlear notch',
    r, `${U.offAxis(r.p).toFixed(1)} mm off the shaft axis`);
}
{
  const r = U.contact(V.radius, 0.8, 1);
  add('ulna', 'radial_notch', 'Radial notch of the ulna',
    'CONTACT · nearest point on the ulna to the radius, within the proximal 20% — the socket the radial head spins in',
    r, `gap to radius ${r.gap.toFixed(2)} mm`);
}
{
  const r = U.extreme([2, -1], 0, 0.12);
  add('ulna', 'ulnar_styloid', 'Styloid process of the ulna',
    'EXTREME · the most distal point of the distal 12% of the ulna',
    r, `${U.offAxis(r.p).toFixed(1)} mm off the shaft axis · reaches Z ${r.p[2].toFixed(1)}, ${(r.p[2] - B.radius.lo[2]).toFixed(1)} mm above the tip of the radial styloid`);
}
{
  const r = U.contact(V.radius, 0, 0.15);
  add('ulna', 'head_of_ulna', 'Head of the ulna',
    'CONTACT · nearest point on the ulna to the radius, within the distal 15% — the ulnar head in the ulnar notch of the radius',
    r, `gap to radius ${r.gap.toFixed(2)} mm`);
}

if (JSON_OUT) {
  console.log(JSON.stringify({ frame, landmarks: out }, null, 2));
} else {
  console.log('frame check passed:');
  console.log(`  proximal mean X — ulna ${frame.ulnaProximalX} (medial) vs radius ${frame.radiusProximalX}`);
  console.log(`  top Z — ulna ${frame.ulnaTopZ} vs radius ${frame.radiusTopZ}\n`);
  for (const bone of ['radius', 'ulna']) {
    console.log(`== ${bone} (bbox ${B[bone].size.map(n => n.toFixed(1)).join(' × ')} mm)`);
    for (const l of out.filter(x => x.bone === bone)) {
      console.log(`  ${l.key.padEnd(20)} uvw [${l.uvw.join(', ')}]`);
      console.log(`  ${''.padEnd(20)} ${l.how}`);
      console.log(`  ${''.padEnd(20)} ${l.evidence}\n`);
    }
  }
}
