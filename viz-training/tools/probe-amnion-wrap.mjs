/* MedBank · probe: the amnion's WRAP law, and what it does to where the yolk sac hangs.
 *
 *   node viz-training/tools/probe-amnion-wrap.mjs
 *
 * Written 2026-10-03 by the model3d BUILD run taking round-2 finding (1) on
 * amniotic-cavity-yolk-sac: "DAY-21 SEPARATION ONLY HALVED, 2.78 units remain, and the cause is a
 * DIFFERENT clamp ... THE QUESTION IS amnPhMax's GROWTH LAW, NOT THE CLAMP."
 *
 * The review named the quantity but did not measure the law across the days it governs, and said so:
 * "deserves its own measurement". This is that measurement. It reports, per day:
 *
 *   - the declared law:  phMax, capFrac, the solved semi-axes, yAmn, thAm
 *   - the DRAWN ventral edge of the amnion, amnVentral = yAmn + (b + thAm) cos(phMax)
 *   - the disc's own half-thickness hy, which is what the amnion's floor should be resting on while
 *     the embryo is still a plate
 *   - all three arms of the yolk-sac clamp and WHICH ONE BINDS
 *   - and, off the BUILT grid rather than off the laws: the hypoblast's ventral surface near the
 *     axis and the secondary yolk sac's dorsal pole, so the VOID between them is measured where the
 *     review measured it (vertices within r = 2 of the axis).
 *
 * Shape-independent and law-independent: it reads the model's own exported stateAt() and build(),
 * so changing the law and re-running is the whole experiment.
 */
import { readFileSync, existsSync } from 'fs';
import { createRequire } from 'module';
import vm from 'vm';

const require_ = createRequire(import.meta.url);
const THREE = require_(process.cwd() + '/node_modules/three/build/three.js');
if (!THREE || !THREE.Group) { console.error('need node_modules/three with Group'); process.exit(2); }

const sandbox = { window: { THREE: THREE, VizKit: {} }, console: console, Math: Math,
  isFinite: isFinite, isNaN: isNaN, Number: Number, Float32Array: Float32Array,
  Uint16Array: Uint16Array, Uint32Array: Uint32Array, Date: Date, Map: Map, Set: Set,
  Object: Object, Array: Array, JSON: JSON };
sandbox.globalThis = sandbox;
vm.createContext(sandbox);
for (const f of ['models3d/render-kit.js', 'models3d/amniotic-cavity-yolk-sac.js']) {
  if (!existsSync(f)) { console.error('missing ' + f + ' — run from the repo root'); process.exit(2); }
  vm.runInContext(readFileSync(f, 'utf8'), sandbox, { filename: f });
}
const M = sandbox.window.MB3D_MODELS['amniotic-cavity-yolk-sac'];

/* ---- built geometry: y extremes of one key, optionally only near the axis ---- */
function yExtremes(t, key, nearAxis) {
  const g = M.build(t, M.FULL);
  let lo = Infinity, hi = -Infinity, n = 0;
  g.traverse(o => {
    if (!o.isMesh || !o.geometry || !o.userData || o.userData.key !== key) return;
    const p = o.geometry.attributes.position;
    if (!p) return;
    for (let i = 0; i < p.count; i++) {
      const x = p.getX(i), y = p.getY(i), z = p.getZ(i);
      if (nearAxis && Math.hypot(x, z) > nearAxis) continue;
      if (y < lo) lo = y; if (y > hi) hi = y; n++;
    }
  });
  return { lo: lo, hi: hi, n: n };
}

const DAYS = [13, 14, 16, 18, 19, 21, 22, 24, 26, 28, 30, 35, 42, 56, 70];
const cf = ph => { const h = 1 - Math.cos(ph); return h * h * (3 - h) / 4; };

console.log('MedBank · amnion wrap law probe');
console.log('  phMax law in force, read back off stateAt():  day -> phMax (deg)');
console.log('');
const H = ['day', 'phMax', 'deg', 'capFrac', 'amnA', 'amnB', 'yAmn', 'thAm',
           'amnVentral', 'hy', 'yFromDisc', 'yInside', 'yOutside', 'yYS', 'binds'];
console.log(H.map((h, i) => h.padStart(i ? 11 : 5)).join(''));
const rows = [];
for (const day of DAYS) {
  const t = M.tOfDay(day), st = M.stateAt(t);
  const amnVentral = st.yAmn + (st.amnB + st.thAm) * Math.cos(st.amnPhMax);
  const yFromDisc = -(st.hy + Math.max(0.35, 0.012 * st.rys) + st.rys + st.vdLen);
  const yInside = -(st.rExmIn - Math.max(0.35, 0.012 * st.rch) - st.rys);
  const yOutside = amnVentral - Math.max(0.35, 0.012 * st.rys) - st.rys;
  let binds = 'prefer';
  if (st.yYS === yInside) binds = 'INSIDE';
  else if (Math.abs(st.yYS - yOutside) < 1e-9) binds = 'OUTSIDE';
  const r = { day, t, phMax: st.amnPhMax, deg: st.amnPhMax * 180 / Math.PI, capFrac: cf(st.amnPhMax),
              amnA: st.amnA, amnB: st.amnB, yAmn: st.yAmn, thAm: st.thAm, amnVentral,
              hy: st.hy, yFromDisc, yInside, yOutside, yYS: st.yYS, binds };
  rows.push(r);
  console.log(
    String(day).padStart(5) +
    [r.phMax, r.deg, r.capFrac, r.amnA, r.amnB, r.yAmn, r.thAm, r.amnVentral, r.hy,
     r.yFromDisc, r.yInside, r.yOutside, r.yYS].map(v => v.toFixed(3).padStart(11)).join('') +
    r.binds.padStart(11));
}

console.log('');
console.log('THE VOID, off the BUILT grid, vertices within r = 2 of the axis (the review\'s method):');
console.log('  day   hypoVentral   sacDorsal        void   discHalfThk   void/discThk');
for (const day of [13, 16, 19, 21, 24, 28, 35, 56]) {
  const t = M.tOfDay(day);
  M.clearCaches && M.clearCaches();
  const hyp = yExtremes(t, 'hypoblast', 2);
  const sac = yExtremes(t, 'secondary_yolk_sac', 2);
  const st = M.stateAt(t);
  if (!isFinite(hyp.lo) || !isFinite(sac.hi)) {
    console.log(String(day).padStart(5) + '   (one of the two is not built at this day)');
    continue;
  }
  const voidGap = hyp.lo - sac.hi;
  console.log(String(day).padStart(5) +
    [hyp.lo, sac.hi, voidGap, 2 * st.hy, voidGap / (2 * st.hy)].map(v => v.toFixed(4).padStart(13)).join(''));
}

console.log('');
console.log('ANATOMY THE LAW HAS TO AGREE WITH:');
console.log('  While the embryo is a flat disc the amnion is a DOME standing on the epiblast — its rim');
console.log('  is on the disc and nothing of it is below the disc. phMax = pi/2 is exactly that dome.');
console.log('  phMax > pi/2 draws the amnion wrapping BELOW the disc, which only happens as the body');
console.log('  folds and the amnion is carried round it. So for every day on which this model still');
console.log('  draws a flat disc, amnVentral must not be below -hy.');
console.log('');
console.log('  day   amnVentral        -hy   amnion below the disc by');
for (const r of rows) {
  const below = (-r.hy) - r.amnVentral;
  console.log(String(r.day).padStart(5) +
    [r.amnVentral, -r.hy].map(v => v.toFixed(4).padStart(13)).join('') +
    (below > 1e-9 ? ('   ' + below.toFixed(4) + '  <-- below the disc') : '   0 (rests on or above it)').padStart(28));
}
