#!/usr/bin/env node
/* MedBank · viz-training/tools/derive-costal-groove.mjs
 *
 * Measure the costal groove on the rib itself, so the intercostal neurovascular bundle can be pointed at.
 *
 * The catalog has no mesh for an intercostal vein, artery or nerve — not one, at any level. The bundle is
 * still one of the most examined facts in the thorax (VAN, top to bottom, tucked under the lower border of
 * the rib above) and one of the few pieces of anatomy a house officer acts on with a needle. So the only
 * honest way to teach it from these meshes is a landmark anchor on the rib that carries it, and the only
 * honest way to place that anchor is to measure the groove rather than type in a plausible number.
 *
 *   node viz-training/tools/derive-costal-groove.mjs
 *   node viz-training/tools/derive-costal-groove.mjs --json
 *
 * ---- the coordinate frame, re-proved rather than assumed ----
 *
 * BodyParts3D ships in an LPS frame:  +X = the body's LEFT, +Y = POSTERIOR, +Z = SUPERIOR.
 * assertFrame() re-proves each claim on the two meshes it is handed and refuses to emit if any fails:
 *   · both RIBS are right ribs, so both must sit entirely at X < 0            — proves what +X means
 *   · rib 6 must sit BELOW rib 5 (smaller centroid Z)                          — proves what +Z means
 *   · the rib's head end must be MEDIAL to its most lateral point              — proves what +Y means
 *   · Y must be the rib's longest span — a hoop is longest front to back
 * A mesh loaded in another orientation is not a case to paper over; it is one to look at.
 *
 * The check earned its keep on the first run. It was originally written to assert that Z is a rib's
 * SMALLEST span, on the assumption that a rib is a flat hoop lying in a near-transverse plane. It is not:
 * rib 5 measures 112 × 183 × 122 mm, because a rib descends about as far as it is wide. The assertion was
 * wrong, not the mesh — and it was wrong in a way that mattered, because the same false assumption was
 * about to be used to find the groove (see the detrending note below). An assumption that fails loudly
 * before it is used is worth more than one that quietly bends a measurement.
 *
 * ---- how the groove is found ----
 *
 * A rib is a hoop, so no single axis parameterises its course: it doubles back on Y and on X. It is
 * single-valued in the ANGLE swept about its own centre in the transverse plane, so that is the station
 * variable. Pick a station theta, take a thin angular slab, and the rib's local cross-section appears as a
 * small oval. Within that oval:
 *
 *   INFERIOR  = smallest Z, AFTER the along-rib descent is removed  — the groove is on the lower border
 *   INTERNAL  = smallest radius from the hoop centre                — the deep surface, not the outer one
 *
 * The detrending needs stating precisely, because the first version of it was wrong in both directions.
 * A rib descends about 0.35 mm for every degree it sweeps — measured, not assumed. Across a ±2.5° slab
 * that is roughly 1.7 mm of tilt, against a rib cross-section some 12 mm tall. So the descent does NOT
 * dominate the slab and a raw minimum-Z is not catastrophically wrong; it lands within about 1.5 mm of the
 * detrended answer. Detrending is kept because it makes the result insensitive to slab width, which a raw
 * minimum is not — but it is a modest correction and this comment will not pretend otherwise.
 *
 * The slope is fitted on a WIDE window (±15°) and then applied to the narrow slab. Fitting it inside the
 * slab itself, which is what this tool did first, does not work: a ±2.5° slab is a compact blob rather
 * than a strip, so the regression has almost no leverage in theta and ends up fitting the rib's own
 * thickness. Run that way the fitted slope came out as -1.94, -0.42, -0.28 and -0.55 mm/deg at four slab
 * widths — it changed sign — and it moved the chosen point by up to 7.7 mm. On the wide window the same
 * fit gives -0.42, -0.34, -0.30, -0.37 across four window sizes. Estimate a trend where it is estimable,
 * apply it where it is needed.
 *
 * Measured on the full-resolution meshes, not the decimated ones: at ±2.5° the full rib gives 133 vertices
 * in the slab and the lite rib gives 15, and with 15 the answer is quantised to whatever the decimator
 * happened to keep.
 *
 * The station used for the scene is the MID-AXILLARY one — the most lateral point of the hoop. That is not
 * an arbitrary choice: it is where a chest drain goes in, which is the whole clinical reason the groove is
 * taught. No rib-angle station is emitted: the angle of the rib is a curvature feature, and this tool does
 * not measure curvature. Reporting one would be a guess wearing a measurement's clothes.
 *
 * ---- what is measured and what is not ----
 *
 * MEASURED: the groove point on each rib, in mm and as a uvw fraction of that rib's own bounding box.
 * ESTIMATED: the 2 mm spacing that separates vein from artery from nerve inside the groove. Three vessels
 * a few millimetres apart cannot be resolved from a bone mesh — no measurement of the rib can tell you
 * where inside the groove the vein stops and the artery starts. That spacing is printed as an estimate and
 * carried into the scene as one, so nobody later mistakes it for a measurement.
 */
import { readSTL, vertices, bbox, surfaceCentroid, toUVW } from './stl.mjs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const HERE = dirname(fileURLToPath(import.meta.url));
const MESH = join(HERE, '..', 'meshes');       // full resolution — see the note on slab density
const JSON_OUT = process.argv.includes('--json');

const ID = {
  rib5: 'FMA8066',      // right fifth rib  — carries the bundle for the 5th intercostal space
  rib6: 'FMA8175'       // right sixth rib  — its UPPER border carries the collateral branch
};

const load = id => vertices(readSTL(join(MESH, id + '.stl')));
const V = Object.fromEntries(Object.entries(ID).map(([k, id]) => [k, load(id)]));
const B = Object.fromEntries(Object.entries(V).map(([k, v]) => [k, bbox(v)]));
const C = Object.fromEntries(Object.entries(ID).map(([k, id]) => [k, surfaceCentroid(readSTL(join(MESH, id + '.stl'))).c]));

/* ---- frame ---- */
function assertFrame() {
  const fail = [];
  for (const k of ['rib5', 'rib6']) {
    if (B[k].hi[0] >= 0) fail.push(`${k} (${ID[k]}) is a RIGHT rib but reaches X=${B[k].hi[0].toFixed(1)} — it should lie entirely at X<0`);
    const [sx, sy, sz] = B[k].size;
    if (!(sy > sx && sy > sz)) fail.push(`${k} spans ${sx.toFixed(1)}×${sy.toFixed(1)}×${sz.toFixed(1)} — a rib hoop should be longest front-to-back, so Y must be the largest span`);

    /* +Y = posterior: the head of the rib is the posterior end AND the medial one. So the most posterior
       vertex must sit closer to the midline than the most lateral vertex does. If Y were anterior this
       flips, because the sternal end is medial too but at the OTHER end of the sweep. */
    let post = V[k][0], lat = V[k][0];
    for (const p of V[k]) { if (p[1] > post[1]) post = p; if (p[0] < lat[0]) lat = p; }
    if (!(post[0] > lat[0] + 20)) fail.push(`${k}: the most posterior vertex sits at X=${post[0].toFixed(1)} and the most lateral at X=${lat[0].toFixed(1)} — the head should be clearly medial, so +Y does not look posterior`);
  }
  if (!(C.rib6[2] < C.rib5[2])) fail.push(`rib 6 centroid Z=${C.rib6[2].toFixed(1)} is not below rib 5 Z=${C.rib5[2].toFixed(1)} — the pair is not stacked as numbered`);
  if (fail.length) { console.error('FRAME CHECK FAILED — nothing emitted:\n  ' + fail.join('\n  ')); process.exit(1); }
  return true;
}

/* Station variable: angle swept about the hoop's own centre in the transverse plane. */
const theta = (p, c) => Math.atan2(p[1] - c[1], p[0] - c[0]);
const radius = (p, c) => Math.hypot(p[0] - c[0], p[1] - c[1]);

/* The most lateral point of the hoop — mid-axillary line, where a drain goes in. */
function midAxillaryTheta(v, c) {
  let best = v[0];
  for (const p of v) if (p[0] < best[0]) best = p;      // most negative X on a right rib = most lateral
  return theta(best, c);
}

/* Within a thin angular slab, the groove = most inferior point on the INTERNAL (deep) surface,
   measured on Z DETRENDED against theta so the rib's own descent does not masquerade as a border. */
function groove(v, c, th, halfWidthDeg = 2.5, border = 'lower', slopeWindowDeg = 15) {
  const d = a => { let x = a - th; while (x > Math.PI) x -= 2 * Math.PI; while (x < -Math.PI) x += 2 * Math.PI; return x; };
  const at = w => v.filter(p => Math.abs(d(theta(p, c))) <= w * Math.PI / 180).map(p => ({ p, t: d(theta(p, c)) }));

  /* Trend fitted on the WIDE window, where theta has enough leverage to determine it. */
  const wide = at(slopeWindowDeg);
  const wn = wide.length;
  const wmt = wide.reduce((s, q) => s + q.t, 0) / wn;
  const wmz = wide.reduce((s, q) => s + q.p[2], 0) / wn;
  let sxy = 0, sxx = 0;
  for (const q of wide) { sxy += (q.t - wmt) * (q.p[2] - wmz); sxx += (q.t - wmt) ** 2; }
  const b = sxx ? sxy / sxx : 0;                       // mm per radian

  const slab = at(halfWidthDeg);
  if (slab.length < 40) throw new Error(`slab at theta=${(th * 180 / Math.PI).toFixed(1)}° holds only ${slab.length} vertices — too sparse to trust; use the full-resolution mesh or widen the slab`);
  const n = slab.length;
  const mz = slab.reduce((s, q) => s + q.p[2], 0) / n;
  const mt = slab.reduce((s, q) => s + q.t, 0) / n;
  const resid = q => q.p[2] - (mz + b * (q.t - mt));    // trend removed, level kept

  const rs_ = slab.map(resid);
  const rEdge = border === 'lower' ? Math.min(...rs_) : Math.max(...rs_);
  /* everything within 1.5 mm of that border, then the DEEP one of those */
  const lip = slab.filter(q => Math.abs(resid(q) - rEdge) <= 1.5);
  let best = lip[0].p, bestR = Infinity;
  for (const q of lip) { const r = radius(q.p, c); if (r < bestR) { bestR = r; best = q.p; } }

  const zs = slab.map(q => q.p[2]);
  const rads = slab.map(q => radius(q.p, c));
  return {
    point: best,
    slabVertices: n,
    slopeWindowVertices: wn,
    slopeMmPerDeg: +(b * Math.PI / 180).toFixed(3),
    tiltAcrossSlabMm: +(Math.abs(b * Math.PI / 180) * 2 * halfWidthDeg).toFixed(2),
    slabZSpreadMm: +(Math.max(...zs) - Math.min(...zs)).toFixed(2),
    slabDepthMm: +(Math.max(...rads) - Math.min(...rads)).toFixed(2),
    lipCandidates: lip.length,
    definition: `${border === 'lower' ? 'most INFERIOR' : 'most SUPERIOR'} point of Z with the along-rib trend removed, then the most INTERNAL of the vertices within 1.5 mm of it`
  };
}

/* The number that says whether to believe the number above: re-measure at four slab widths and
   report how far the answer travels. A landmark that jumps when you change an arbitrary knob is
   not a measurement, and the scene should not carry it as one. */
function sensitivity(v, c, th, border) {
  const pts = [1.5, 2.5, 4, 6].map(w => ({ w, p: groove(v, c, th, w, border).point }));
  let worst = 0, pair = null;
  for (let i = 0; i < pts.length; i++) for (let j = i + 1; j < pts.length; j++) {
    const dmm = Math.hypot(...[0, 1, 2].map(a => pts[i].p[a] - pts[j].p[a]));
    if (dmm > worst) { worst = dmm; pair = [pts[i].w, pts[j].w]; }
  }
  return { widthsDeg: pts.map(p => p.w), maxDisagreementMm: +worst.toFixed(2), between: pair };
}

const VAN_SPACING_MM = 2.0;   // ESTIMATE, not a measurement — see the header

assertFrame();

const stations = {
  midAxillary: { rib5: midAxillaryTheta(V.rib5, C.rib5), rib6: midAxillaryTheta(V.rib6, C.rib6) }
};

const out = { frame: 'LPS (+X left, +Y posterior, +Z superior) — re-proved on these meshes', anchors: [], measurements: {} };

for (const [stationName, th] of Object.entries(stations)) {
  const g5 = groove(V.rib5, C.rib5, th.rib5, 2.5, 'lower');
  const g6 = groove(V.rib6, C.rib6, th.rib6, 2.5, 'upper');
  g5.sensitivity = sensitivity(V.rib5, C.rib5, th.rib5, 'lower');
  g6.sensitivity = sensitivity(V.rib6, C.rib6, th.rib6, 'upper');
  out.measurements[stationName] = { rib5_lower_border: g5, rib6_upper_border: g6 };
}

/* The scene uses the mid-axillary station. */
const g5 = out.measurements.midAxillary.rib5_lower_border;
const g6 = out.measurements.midAxillary.rib6_upper_border;

const stack = [
  ['ic_vein',   'Intercostal VEIN',   0 * VAN_SPACING_MM, 'measured groove point'],
  ['ic_artery', 'Intercostal ARTERY', 1 * VAN_SPACING_MM, `${VAN_SPACING_MM} mm below the measured groove point — ESTIMATE`],
  ['ic_nerve',  'Intercostal NERVE',  2 * VAN_SPACING_MM, `${2 * VAN_SPACING_MM} mm below the measured groove point — ESTIMATE`]
];
for (const [key, label, drop, how] of stack) {
  const p = [g5.point[0], g5.point[1], g5.point[2] - drop];
  out.anchors.push({
    key, label, on: 'rib5',
    uvw: toUVW(p, B.rib5).map(n => +n.toFixed(3)),
    mm: p.map(n => +n.toFixed(2)),
    how,
    estimated_offset_mm: drop
  });
}
out.anchors.push({
  key: 'collateral', label: 'Collateral branch', on: 'rib6',
  uvw: toUVW(g6.point, B.rib6).map(n => +n.toFixed(3)),
  mm: g6.point.map(n => +n.toFixed(2)),
  how: 'measured: most SUPERIOR point on the internal surface of the rib below, mid-axillary station',
  estimated_offset_mm: 0
});

if (JSON_OUT) { console.log(JSON.stringify(out, null, 2)); process.exit(0); }

console.log('frame  : ' + out.frame);
for (const [k, id] of Object.entries(ID)) {
  console.log(`${k.padEnd(6)} : ${id}  bbox ${B[k].size.map(n => n.toFixed(1)).join(' × ')} mm   centroid Z ${C[k][2].toFixed(1)}`);
}
for (const [s, m] of Object.entries(out.measurements)) {
  console.log(`\nstation ${s}`);
  for (const [w, g] of Object.entries(m)) {
    console.log(`  ${w.padEnd(20)} ${g.point.map(n => n.toFixed(2)).join(', ')}   slab ${g.slabVertices} verts (trend fitted on ${g.slopeWindowVertices}), ${g.slabDepthMm} mm deep, ${g.lipCandidates} on the lip`);
    console.log(`  ${''.padEnd(20)} descent ${g.slopeMmPerDeg} mm/deg → ${g.tiltAcrossSlabMm} mm of tilt across a slab ${g.slabZSpreadMm} mm tall`);
    console.log(`  ${''.padEnd(20)} slab width 1.5–6°: answer moves at most ${g.sensitivity.maxDisagreementMm} mm`);
    console.log(`  ${''.padEnd(20)} ${g.definition}`);
  }
}
console.log('\nanchors for the scene (mid-axillary station):');
for (const a of out.anchors) {
  console.log(`  ${a.key.padEnd(11)} on ${a.on.padEnd(5)} uvw [${a.uvw.join(', ')}]   ${a.how}`);
}
console.log('\nNOTE: the VAN spacing is an ESTIMATE. The groove is measured; where the vein ends and the');
console.log('      artery begins inside it cannot be read off a bone mesh, and the scene says so.');
