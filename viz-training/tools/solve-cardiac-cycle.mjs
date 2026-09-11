/* MedBank · solver and report for models3d/cardiac-cycle-pumping.js
 *
 * There is NO copy of the circulation model in this file. It loads the model itself with a stub
 * THREE and a stub VizKit — the model only touches either inside build(), so a module load is enough
 * to get at the physiology — and drives it through `analyseWith(side, overrides)`. A change to the
 * ODE therefore cannot leave this tool grading the previous one, which is the failure the
 * cardiac-looping solver is structurally exposed to and the reason this one is built the other way.
 *
 *   node viz-training/tools/solve-cardiac-cycle.mjs            report the current model
 *   node viz-training/tools/solve-cardiac-cycle.mjs --solve    bisect and print a SOLVED block
 *
 * Run from the repo root.
 */
import { readFileSync } from 'fs';
import vm from 'vm';

/* ---- the smallest THREE that lets the module evaluate ---- */
class V3 {
  constructor(x = 0, y = 0, z = 0) { this.x = x; this.y = y; this.z = z; }
  set(x, y, z) { this.x = x; this.y = y; this.z = z; return this; }
  copy(v) { return this.set(v.x, v.y, v.z); }
  clone() { return new V3(this.x, this.y, this.z); }
  add(v) { this.x += v.x; this.y += v.y; this.z += v.z; return this; }
  sub(v) { this.x -= v.x; this.y -= v.y; this.z -= v.z; return this; }
  subVectors(a, b) { return this.set(a.x - b.x, a.y - b.y, a.z - b.z); }
  addScaledVector(v, s) { this.x += v.x * s; this.y += v.y * s; this.z += v.z * s; return this; }
  multiplyScalar(s) { this.x *= s; this.y *= s; this.z *= s; return this; }
  negate() { return this.multiplyScalar(-1); }
  dot(v) { return this.x * v.x + this.y * v.y + this.z * v.z; }
  lengthSq() { return this.dot(this); }
  length() { return Math.sqrt(this.lengthSq()); }
  normalize() { const l = this.length() || 1; return this.multiplyScalar(1 / l); }
  crossVectors(a, b) {
    return this.set(a.y * b.z - a.z * b.y, a.z * b.x - a.x * b.z, a.x * b.y - a.y * b.x);
  }
  distanceTo(v) { const dx=this.x-v.x,dy=this.y-v.y,dz=this.z-v.z; return Math.sqrt(dx*dx+dy*dy+dz*dz); }
  lerp(v, a) { this.x += (v.x - this.x) * a; this.y += (v.y - this.y) * a; this.z += (v.z - this.z) * a; return this; }
}
const sandbox = {
  window: { THREE: { Vector3: V3 }, VizKit: {} },
  console: console, Math: Math, isFinite: isFinite, Object: Object, Array: Array, JSON: JSON,
};
sandbox.globalThis = sandbox;
vm.createContext(sandbox);
vm.runInContext(readFileSync('models3d/cardiac-cycle-pumping.js', 'utf8'),
  sandbox, { filename: 'cardiac-cycle-pumping.js' });
const M = sandbox.window.MB3D_MODELS['cardiac-cycle-pumping'];

const f2 = (x, n = 2) => (x == null ? 'n/a' : Number(x).toFixed(n));

/* ------------------------------------------------------------------ the solve

   Four knobs per side, each aimed at ONE stated target, cycled a few times because they are not
   perfectly independent — E_max moves the end-systolic volume but also nudges the pressure, and so
   on. Alternating bisection rather than a joint solve: it converges here in a handful of rounds, and
   when it does not converge the failure is legible (one knob at a bracket end) instead of arriving
   as a Jacobian that will not invert.                                                             */
function bisect(f, lo, hi, target, iters = 34) {
  let flo = f(lo);
  const rising = f(hi) > flo;
  for (let i = 0; i < iters; i++) {
    const mid = (lo + hi) / 2, v = f(mid);
    if ((v < target) === rising) lo = mid; else hi = mid;
  }
  return (lo + hi) / 2;
}

function solveSide(side, seed) {
  const st = M.STATED[side === 'left' ? 'lv' : 'rv'];
  const art = M.STATED[side === 'left' ? 'ao' : 'pa'];
  let k = Object.assign({}, seed);
  const A = over => M.analyseWith(side, Object.assign({}, k, over), true);
  /* brackets, per side. Wide enough to contain the answer, narrow enough that the low end still
     produces a circulation that beats — a ventricle whose peak elastance cannot lift the semilunar
     valve off its seat ejects nothing, and the bisection then has no gradient to follow. */
  const B = side === 'left'
    ? { emax: [0.80, 9], pven: [2, 30], rart: [0.20, 4.0], cart: [0.40, 8] }
    : { emax: [0.20, 0.80], pven: [3, 12], rart: [0.08, 0.40], cart: [1.50, 12] };
  for (let round = 0; round < 6; round++) {
    k.p_ven  = bisect(v => A({ p_ven: v }).edv,     B.pven[0], B.pven[1], st.edv, 24);
    k.emax_v = bisect(v => -A({ emax_v: v }).esv,   B.emax[0], B.emax[1], -st.esv, 24);
    k.r_art  = bisect(v => A({ r_art: v }).art_dia, B.rart[0], B.rart[1], art.dia, 24);
    k.c_art  = bisect(v => { const a2 = A({ c_art: v }); return -(a2.art_sys - a2.art_dia); },
                      B.cart[0], B.cart[1], -(art.sys - art.dia), 22);
  }
  return k;
}

if (process.argv.includes('--solve')) {
  const out = {};
  for (const side of ['left', 'right']) {
    process.stderr.write('solving ' + side + ' ...\n');
    out[side] = solveSide(side, M.SOLVED[side]);
  }
  const fmt = k => `{ emax_v: ${k.emax_v.toFixed(4)}, p_ven: ${k.p_ven.toFixed(4)}, ` +
                   `r_art: ${k.r_art.toFixed(4)}, c_art: ${k.c_art.toFixed(4)}` + ` }`;
  console.log('\nPaste into models3d/cardiac-cycle-pumping.js, replacing SOLVED.left / SOLVED.right:\n');
  console.log('  left:  ' + fmt(out.left) + ',');
  console.log('  right: ' + fmt(out.right) + ',');
  console.log('');
  process.exit(0);
}

/* ---------------------------------------------------------------- the report */
const a = M.acceptance();
const c = M.cycle();
const l = c.left, r = c.right, g = a.geometry;

console.log('MedBank · cardiac cycle (pumping) — model report');
console.log('cycle ' + f2(c.cycle_s) + ' s (' + Math.round(60 / c.cycle_s) + ' bpm), PR ' + f2(c.pr_s) + ' s\n');

console.log('LEFT   EDV ' + f2(l.edv, 1) + '  ESV ' + f2(l.esv, 1) + '  SV ' + f2(l.sv, 1) +
            '  EF ' + f2(l.ef, 3) + '   aorta ' + f2(l.art_sys, 1) + '/' + f2(l.art_dia, 1) +
            '  peak LV ' + f2(l.pv_peak, 1) + '  peak LA ' + f2(l.atr_peak, 1));
console.log('RIGHT  EDV ' + f2(r.edv, 1) + '  ESV ' + f2(r.esv, 1) + '  SV ' + f2(r.sv, 1) +
            '  EF ' + f2(r.ef, 3) + '   PA    ' + f2(r.art_sys, 1) + '/' + f2(r.art_dia, 1) +
            '  peak RV ' + f2(r.pv_peak, 1));
console.log('cardiac output ' + f2(l.sv * 60 / c.cycle_s / 1000, 2) + ' L/min' +
            '   peak ejection flow  L ' + f2(l.q_peak, 0) + '  R ' + f2(r.q_peak, 0) + ' ml/s\n');

const e = l.events, T0 = c.cycle_s;
console.log('EVENTS (left), located as pressure crossings on the integrated trace:');
console.log('  mitral shuts (S1)   t=' + f2(e.avShut, 4) + '   ' + f2(e.avShut * T0, 3) + ' s');
console.log('  aortic opens        t=' + f2(e.slOpen, 4) + '   ' + f2(e.slOpen * T0, 3) + ' s');
console.log('  aortic shuts (S2)   t=' + f2(e.slShut, 4) + '   ' + f2(e.slShut * T0, 3) + ' s');
console.log('  mitral opens        t=' + f2(e.avOpen, 4) + '   ' + f2(e.avOpen * T0, 3) + ' s\n');
console.log('PHASES (s):  atrial systole->  ivc ' + f2(l.ivc_s, 3) + '  ejection ' + f2(l.ejection_s, 3) +
            '  ivr ' + f2(l.ivr_s, 3) + '  filling ' + f2(l.filling_s, 3));
console.log('             systole ' + f2(l.systole_s, 3) + '   diastole ' + f2(l.diastole_s, 3) +
            '   atrial kick ' + f2(l.kick_frac, 3) + ' of filling\n');

console.log('GEOMETRY (predicted unless marked stated):');
console.log('  LV minor-axis shortening ' + f2(g.stated.fs_minor_lv, 3) + ' (stated)  ->  long axis ' +
            f2(g.longShort, 3));
console.log('  RV long-axis shortening from TAPSE ' + f2(g.stated.tapse_rv, 2) + ' cm (stated)  ->  minor axis ' +
            f2(g.rv_minorShort, 3));
console.log('  LV wall ' + f2(g.wall_ed_mm, 1) + ' mm (stated) -> ' + f2(g.wall_es_mm, 1) +
            ' mm, by conservation of myocardial volume');
console.log('  RV wall ' + f2(g.rv_wall_ed_mm, 1) + ' mm (stated) -> ' + f2(g.rv_wall_es_mm, 1) + ' mm');
console.log('  LVIDd ' + f2(g.lvid_d_cm, 2) + ' cm   LVIDs ' + f2(g.lvid_s_cm, 2) + ' cm   (normal 4.2-5.8 / 2.5-4.0)');
console.log('  LV mass ' + f2(g.lv_mass_g, 0) + ' g   (normal 88-224 g)');
console.log('  AV plane descent (MAPSE) ' + f2(g.av_plane_descent_cm, 2) + ' cm   (normal 1.0-1.6)');
console.log('  TAPSE achieved ' + f2(g.tapse_cm, 2) + ' cm');
console.log('  RV tube calibre ' + f2(g.rv_tube_R_ed_cm, 2) + ' -> ' + f2(g.rv_tube_R_es_cm, 2) +
            ' cm over a ' + f2(g.rv_path_length_cm, 1) + ' cm wrapped path (solve converged to ' +
            f2(g.rv_solve_converged_cm, 5) + ' cm)');
console.log('  RV mass ' + f2(g.rv_mass_g, 0) + ' g   (normal roughly a third of the LV)\n');

console.log('ACCEPTANCE');
for (const k of Object.keys(a.pass)) {
  const row = a.pass[k];
  console.log('  ' + (row.ok ? 'PASS' : 'FAIL') + '  ' + k + '  [' + row.kind + '] ' + row.what +
              '   -> ' + JSON.stringify(row.value, (kk, v) => typeof v === 'number' ? +v.toFixed(4) : v));
}
console.log('\nallPass = ' + a.allPass);
process.exit(a.allPass ? 0 : 1);
