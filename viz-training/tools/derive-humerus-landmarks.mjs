#!/usr/bin/env node
/* MedBank · viz-training/tools/derive-humerus-landmarks.mjs
 *
 * Measure the named parts of the humerus on the mesh itself, so a label lands on the feature it names.
 *
 * Same reasoning as derive-vertebra-landmarks.mjs: the catalog's smallest unit is a whole humerus. There is
 * no mesh for a greater tubercle, a radial groove or a trochlea, so the only honest way to point at them is
 * a landmark anchor — a `uvw` fraction of the parent mesh's bounding box. An anchor typed in by eye is worse
 * than a missing one: it puts the words "radial groove" somewhere plausible and the student believes it.
 *
 *   node viz-training/tools/derive-humerus-landmarks.mjs            # meshes-lite/FMA23130.stl
 *   node viz-training/tools/derive-humerus-landmarks.mjs --json
 *
 * ---- the coordinate frame, re-checked rather than assumed ----
 *
 * BodyParts3D ships in an LPS frame:  +X = the body's LEFT, +Y = POSTERIOR, +Z = SUPERIOR.
 * assertFrame() re-proves all three on the meshes it is handed and refuses to emit anything if they fail:
 *   · the RIGHT humerus must sit entirely at X < 0
 *   · its longest bounding-box axis must be Z (a long bone lying along the body axis)
 *   · the triceps heads must sit POSTERIOR (greater Y) to the long head of biceps
 * A mesh loaded in another orientation is not a case to handle silently — it is one to look at.
 *
 * ---- how each landmark is found ----
 *
 * Two kinds of definition, and each printed with the measurement that justifies it:
 *
 *   CONTACT  — the nearest point on the humerus to another named mesh. A joint or an attachment is a place
 *              where two surfaces meet, so the meeting point IS the landmark. The gap in mm is printed: a
 *              gap near zero means the surfaces genuinely touch there.
 *   EXTREME  — the furthest point in a stated direction within a stated slice of the bone. Reported with
 *              the distance from the shaft axis, so a human can check the number rather than trust the word.
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
  humerus: 'FMA23130',            // right humerus
  scapula: 'FMA13395',            // right scapula          — glenoid, so: the head
  subscapularis: 'FMA13414',      // right subscapularis    — inserts on the lesser tubercle
  bicepsLong: 'FMA37686',         // long head of biceps    — runs in the intertubercular groove
  deltoid: 'FMA34680',            // clavicular part of deltoid — inserts on the deltoid tuberosity
  tricepsLat: 'FMA37697',         // lateral head of triceps — arises ABOVE the radial groove
  tricepsMed: 'FMA37695',         // medial head of triceps  — arises BELOW the radial groove
  radius: 'FMA23464',             // right radius           — its head meets the capitulum
  ulna: 'FMA23467'                // right ulna             — its trochlear notch meets the trochlea
};

const load = id => vertices(readSTL(join(MESH, id + '.stl')));
const V = Object.fromEntries(Object.entries(ID).map(([k, id]) => [k, load(id)]));
const B = bbox(V.humerus);

/* ---- frame ---- */
function assertFrame() {
  const fail = [];
  const hb = B;
  if (hb.hi[0] >= 0) fail.push(`right humerus is not entirely at X<0 (hi X = ${hb.hi[0].toFixed(1)})`);
  const longest = hb.size.indexOf(Math.max(...hb.size));
  if (longest !== 2) fail.push(`the humerus's longest axis is ${'XYZ'[longest]}, not Z`);
  const meanY = v => v.reduce((s, p) => s + p[1], 0) / v.length;
  if (!(meanY(V.tricepsLat) > meanY(V.bicepsLong))) fail.push('triceps is not posterior to biceps — +Y is not posterior here');
  if (fail.length) { console.error('FRAME CHECK FAILED:\n  ' + fail.join('\n  ') + '\nNothing emitted.'); process.exit(1); }
  return { longest, meanTri: meanY(V.tricepsLat).toFixed(1), meanBic: meanY(V.bicepsLong).toFixed(1) };
}

/* ---- helpers ---- */
const d2 = (a, b) => (a[0] - b[0]) ** 2 + (a[1] - b[1]) ** 2 + (a[2] - b[2]) ** 2;
const zFrac = p => (p[2] - B.lo[2]) / B.size[2];
const band = (lo, hi) => V.humerus.filter(p => zFrac(p) >= lo && zFrac(p) <= hi);

/* nearest point on the humerus (optionally restricted to a Z band) to another mesh */
function contact(other, lo = 0, hi = 1) {
  const pts = band(lo, hi);
  let best = null, bd = Infinity;
  for (const p of pts) for (const q of other) { const d = d2(p, q); if (d < bd) { bd = d; best = p; } }
  return { p: best, gap: Math.sqrt(bd) };
}
/* furthest point in a direction, within a Z band. dir is a signed axis, e.g. [0,-1] = most negative X */
function extreme([axis, sign], lo, hi) {
  const pts = band(lo, hi);
  let best = null, bv = -Infinity;
  for (const p of pts) { const v = sign * p[axis]; if (v > bv) { bv = v; best = p; } }
  return { p: best, value: bv * sign };
}
/* snap an arbitrary point back onto the bone surface */
function snap(target, lo = 0, hi = 1) {
  const pts = band(lo, hi);
  let best = null, bd = Infinity;
  for (const p of pts) { const d = d2(p, target); if (d < bd) { bd = d; best = p; } }
  return { p: best, gap: Math.sqrt(bd) };
}
/* the shaft axis, as the mean X/Y of the middle third — for reporting how far off-axis a bump sits */
const shaft = (() => {
  const mid = band(0.35, 0.65);
  return [mid.reduce((s, p) => s + p[0], 0) / mid.length, mid.reduce((s, p) => s + p[1], 0) / mid.length];
})();
const offAxis = p => Math.hypot(p[0] - shaft[0], p[1] - shaft[1]);
/* the two epicondyles flare from the distal end, which is itself offset from the shaft axis — so their
   prominence is only meaningful against the centre of the distal end, not against the shaft. */
const centroidOf = pts => [0, 1, 2].map(a => pts.reduce((t, p) => t + p[a], 0) / pts.length);
const distalCentre = centroidOf(band(0, 0.12));
const offDistal = p => Math.hypot(p[0] - distalCentre[0], p[1] - distalCentre[1]);
/* mediolateral width at a Z band — the measurement the surgical neck is defined against */
const widthX = (lo, hi) => {
  const s = band(lo, hi);
  return s.length ? Math.max(...s.map(p => p[0])) - Math.min(...s.map(p => p[0])) : 0;
};
const shaftWidth = (() => {                       // median of thin slabs, so the shaft's curve does not inflate it
  const w = [];
  for (let i = 0; i < 12; i++) { const lo = 0.35 + 0.30 * i / 12; const x = widthX(lo, lo + 0.025); if (x) w.push(x); }
  w.sort((a, b) => a - b);
  return w[Math.floor(w.length / 2)];
})();

const frame = assertFrame();
const out = [];
const add = (key, label, how, r, extra) => out.push({
  key, label, how,
  uvw: toUVW(r.p, B).map(n => +n.toFixed(3)),
  xyz: r.p.map(n => +n.toFixed(1)),
  evidence: extra
});

/* --- CONTACT landmarks: a joint or an attachment is where two surfaces meet --- */
{
  const r = contact(V.scapula, 0.7, 1);
  add('head_of_humerus', 'Head of humerus',
    'CONTACT · nearest point on the humerus to the scapula, within the proximal 30% — the glenohumeral joint',
    r, `gap to scapula ${r.gap.toFixed(2)} mm`);
}
{
  const r = contact(V.subscapularis, 0.75, 1);
  add('lesser_tubercle', 'Lesser tubercle',
    'CONTACT · nearest point to subscapularis, within the proximal 25% — subscapularis inserts on the lesser tubercle',
    r, `gap to subscapularis ${r.gap.toFixed(2)} mm`);
}
{
  const r = contact(V.bicepsLong, 0.7, 1);
  add('intertubercular_groove', 'Intertubercular groove',
    'CONTACT · nearest point to the long head of biceps, within the proximal 30% — its tendon runs in the groove',
    r, `gap to the biceps tendon ${r.gap.toFixed(2)} mm`);
}
{
  const r = contact(V.deltoid, 0.35, 0.7);
  add('deltoid_tuberosity', 'Deltoid tuberosity',
    'CONTACT · nearest point to deltoid, restricted to the middle of the shaft (Z 35–70%) — deltoid inserts there',
    r, `gap to deltoid ${r.gap.toFixed(2)} mm · ${offAxis(r.p).toFixed(1)} mm off the shaft axis`);
}
{
  const r = contact(V.ulna, 0, 0.15);
  add('trochlea', 'Trochlea',
    'CONTACT · nearest point to the ulna, within the distal 15% — the trochlea articulates with the trochlear notch',
    r, `gap to ulna ${r.gap.toFixed(2)} mm`);
}
{
  const r = contact(V.radius, 0, 0.15);
  add('capitulum', 'Capitulum',
    'CONTACT · nearest point to the radius, within the distal 15% — the capitulum articulates with the radial head',
    r, `gap to radius ${r.gap.toFixed(2)} mm`);
}

/* --- the radial groove: between two origins, not at either of them --- */
{
  const a = contact(V.tricepsLat, 0.4, 0.8);      // lateral head arises above the groove
  const b = contact(V.tricepsMed, 0.25, 0.65);    // medial head arises below it
  const mid = [0, 1, 2].map(i => (a.p[i] + b.p[i]) / 2);
  const r = snap(mid, 0.25, 0.8);
  add('radial_groove', 'Radial groove',
    'DERIVED · midpoint between the humeral contact of the lateral head of triceps (above the groove) and that of the medial head (below it), snapped back onto the bone',
    r, `lateral-head contact Z ${a.p[2].toFixed(1)} (gap ${a.gap.toFixed(2)} mm) · medial-head contact Z ${b.p[2].toFixed(1)} (gap ${b.gap.toFixed(2)} mm) · snap ${r.gap.toFixed(2)} mm`);
}

/* --- EXTREME landmarks: furthest in a stated direction, within a stated slice --- */
{
  const r = extreme([0, -1], 0.88, 1);            // most lateral (most negative X) proximally
  add('greater_tubercle', 'Greater tubercle',
    'EXTREME · the most lateral point of the proximal 12% of the bone',
    r, `${offAxis(r.p).toFixed(1)} mm lateral of the shaft axis`);
}
{
  const r = extreme([0, +1], 0, 0.12);            // most medial (most positive X) distally
  add('medial_epicondyle', 'Medial epicondyle',
    'EXTREME · the most medial point of the distal 12% of the bone',
    r, `${offDistal(r.p).toFixed(1)} mm from the centre of the distal end`);
}
{
  const r = extreme([0, -1], 0, 0.12);            // most lateral distally
  add('lateral_epicondyle', 'Lateral epicondyle',
    'EXTREME · the most lateral point of the distal 12% of the bone',
    r, `${offDistal(r.p).toFixed(1)} mm from the centre of the distal end`);
}

/* --- surgical neck: where the flare of the head and tubercles ends and the shaft begins ---
   NOT "the narrowest level in the proximal half": the humerus is narrowest at mid-shaft, so that
   definition walks the label down the arm. The neck is a shoulder in the width profile, so measure the
   profile and find where it returns to shaft width. */
{
  /* anchored to the tubercles, not to an absolute height: the lowest tubercle contact measured above is
     the floor of the flare, and the neck is the narrowest level in the 10% of bone directly below it. */
  const tubZ = Math.min(...out.filter(l => /tubercle/.test(l.key)).map(l => l.uvw[2]));
  let found = null;
  for (let z = tubZ - 0.10; z < tubZ; z += 0.005) {
    const w = widthX(z, z + 0.025);
    if (w && (!found || w < found.w)) found = { z: z + 0.0125, w };
  }
  const lo = found.z - 0.0125, hi = found.z + 0.0125;
  const r = snap(centroidOf(band(lo, hi)), lo, hi);
  add('surgical_neck', 'Surgical neck',
    'DERIVED · the narrowest level in the 10% of bone directly below the lowest tubercle — the constriction where the flare of the head and tubercles gives way to shaft',
    r, `width here ${found.w.toFixed(1)} mm vs mid-shaft ${shaftWidth.toFixed(1)} mm, at Z-fraction ${found.z.toFixed(3)}, lowest tubercle at ${tubZ.toFixed(3)} · snap to surface ${r.gap.toFixed(2)} mm`);
}

if (JSON_OUT) { console.log(JSON.stringify(out, null, 2)); process.exit(0); }

console.log(`frame OK · longest axis Z · mean Y: triceps ${frame.meanTri} posterior to biceps ${frame.meanBic}`);
console.log(`humerus bbox size  ${B.size.map(n => n.toFixed(1)).join(' × ')} mm\n`);
for (const l of out) {
  console.log(`${l.label}`);
  console.log(`  uvw  [${l.uvw.join(', ')}]`);
  console.log(`  how  ${l.how}`);
  console.log(`  ✎    ${l.evidence}\n`);
}
/* Cross-checks a human can sanity-test against a real bone. */
const by = Object.fromEntries(out.map(l => [l.key, l.xyz]));
const dist = (a, b) => Math.hypot(...[0, 1, 2].map(i => by[a][i] - by[b][i])).toFixed(1);
console.log('cross-checks (mm)');
console.log(`  medial to lateral epicondyle   ${dist('medial_epicondyle', 'lateral_epicondyle')}`);
console.log(`  greater to lesser tubercle     ${dist('greater_tubercle', 'lesser_tubercle')}`);
console.log(`  head to trochlea (bone length) ${dist('head_of_humerus', 'trochlea')}`);
console.log(`  surgical neck to deltoid tub.  ${dist('surgical_neck', 'deltoid_tuberosity')}`);
