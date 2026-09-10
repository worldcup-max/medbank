/* MedBank · solve the cardiac-looping torsion.
 *
 * The nine numbers in SOLVED at the top of models3d/cardiac-looping.js come from here. They are the
 * four bend amplitudes, the four bend PLANES and how far the two poles converge — and the planes are
 * what decide whether the loop is convex ventrally or dorsally and whether the atrium finishes behind
 * and above the ventricle. RENDER-STANDARD: solve the parameter that decides the examinable relation.
 * They were hand-tuned before, and both relations came out backwards while every rendering check passed.
 *
 * Run from the repo root:   node viz-training/tools/solve-cardiac-torsion.mjs
 * It prints a SOLVED block to paste into the model, and the measurements it was accepted on.
 *
 * WHAT IT SOLVES AGAINST — all of these, not just the first four:
 *   A ventricle centroid z > 0            the bulboventricular limb is convex VENTRALLY
 *   B ventricle centroid x < 0            the loop is DEXTRAL
 *   C atrium z - ventricle z < 0          at day 28 the atrium lies BEHIND the ventricle
 *   D atrium y - ventricle y > 0          at day 28 the atrium lies ABOVE the ventricle
 *   E bulbus z - ventricle z > 0          the bulbus is VENTRAL to the ventricle
 *   F bulbus x - ventricle x < 0          the bulbus is to the RIGHT of the ventricle
 *   G transverse separation > cranio-caudal separation   the two sit SIDE BY SIDE
 *   plus: dextral and ventrally convex ALREADY at t = 0.25, 0.45 and 0.70, not only at the end;
 *         the pole-to-pole tether met exactly, and not by pinning the bend amplitude at its cap;
 *         no segment passing through another;
 *         and the same measurements at NSEG 140 and NSEG 300.
 *
 * TWO CANDIDATES WERE REJECTED BY THOSE LAST CLAUSES, which is why they are in the objective:
 *   · one satisfied every condition at NSEG 60 and INVERTED at NSEG 80 — its bend amplitude was
 *     pinned at the bisection's cap and the curve sat on a bifurcation, so rounding the parameters
 *     to four decimals for the model file changed the answer;
 *   · one satisfied every day-28 condition and swung the limb to the embryo's LEFT at t = 0.3 and
 *     t = 0.6 before correcting itself. One continuous function of t, and wrong for most of it.
 *
 * The geometry here is a COPY of the model's centreline integration, deliberately: this file has to
 * run without a browser. It is not the proof. The proof is that the model, built from what this
 * prints, passes MB3D_MODELS['cardiac-looping'].acceptance() and the headless render in
 * viz-training/tools/render-cardiac-looping.mjs. If this file and the model ever disagree about the
 * curve, the model is right and this one is stale.
 */
import * as T from 'three';

/* The calibre profile and the segment boundaries, identical to the model's. Copied rather than
   imported because this tool has to run in node, and the model is a browser script. */
export const SEGS = {
  sinus: [0.000, 0.165], atrium: [0.165, 0.400], ventricle: [0.400, 0.660],
  bulbus: [0.660, 0.870], truncus: [0.870, 1.000],
};
export function radius(u, t) {
  const g = (c, w) => { const z = (u - c) / w; return Math.exp(-z * z); };
  const grow = 0.45 + 0.75 * t;
  let r = 0.285;
  r += 0.155 * g(0.055, 0.075) * (0.7 + 0.3 * t);
  r += 0.300 * g(0.280, 0.110) * grow;
  r += 0.335 * g(0.530, 0.120) * grow;
  r += 0.170 * g(0.755, 0.090) * (0.6 + 0.4 * t);
  r -= 0.075 * g(0.165, 0.055);
  r -= 0.105 * g(0.400, 0.050);
  r -= 0.072 * g(0.660, 0.048);
  r -= 0.042 * g(0.870, 0.045);
  return Math.max(r, 0.125);
}
const L0 = 6.0, GROW = 0.50;
const gauss = (u, c, w) => { const z = (u - c) / w; return Math.exp(-z * z); };
const POLE = new T.Vector3(0, -L0 * 0.46, 0);
export const CENTRES = [0.165, 0.400, 0.660, 0.870];   // sinoatrial, AV canal, BV sulcus, bulbotruncal
export const WIDTHS  = [0.085, 0.100, 0.095, 0.080];
const LAM_CAP = 3.2;

function integrate(p, lambda, t, N, mirror) {
  const L = L0 * (1 + GROW * t), ds = L / N;
  const pos = new T.Vector3(0,0,0), d = new T.Vector3(0,1,0), n = new T.Vector3(mirror?-1:1,0,0);
  const P = [];
  const b = new T.Vector3(), axis = new T.Vector3(), q = new T.Quaternion();
  for (let i = 0; i <= N; i++) {
    P.push(pos.clone());
    if (i === N) break;
    const u = i / N;
    b.crossVectors(d, n).normalize();
    let k = 0, wsum = 0, asum = 0;
    for (let j = 0; j < 4; j++) {
      const g = gauss(u, CENTRES[j], WIDTHS[j]);
      k += p.a[j] * g;
      const wt = Math.abs(p.a[j]) * g;
      wsum += wt; asum += wt * p.psi[j];
    }
    const ang = wsum > 1e-9 ? asum / wsum : 0;
    axis.set(0,0,0).addScaledVector(b, Math.cos(ang)).addScaledVector(n, Math.sin(ang)).normalize();
    q.setFromAxisAngle(axis, lambda * k * ds);
    d.applyQuaternion(q).normalize();
    n.applyQuaternion(q); n.addScaledVector(d, -n.dot(d)).normalize();
    pos.addScaledVector(d, ds);
  }
  return P;
}

function orient(P, N) {
  const chord = new T.Vector3().subVectors(P[N], P[0]).normalize();
  const q = new T.Quaternion().setFromUnitVectors(chord, new T.Vector3(0,1,0));
  for (const v of P) v.applyQuaternion(q);
  const shift = new T.Vector3().subVectors(POLE, P[0]);
  for (const v of P) v.add(shift);
  return P;
}

export function curve(p, t, N, mirror) {
  if (t <= 1e-4) return { P: orient(integrate(p, 0, t, N, mirror), N), lambda: 0, chord: L0, target: L0 };
  const target = L0 * (1 - p.chordFrac * t);
  const ch = lam => { const P = integrate(p, lam, t, N, mirror); return P[N].distanceTo(P[0]); };
  let lo = 0, hi = LAM_CAP;
  if (ch(hi) > target) { const P = integrate(p, hi, t, N, mirror); const c = P[N].distanceTo(P[0]); return { P: orient(P, N), lambda: hi, chord: c, target }; }
  for (let k = 0; k < 30; k++) { const m = (lo+hi)/2; if (ch(m) > target) lo = m; else hi = m; }
  const lam = (lo+hi)/2;
  const P = integrate(p, lam, t, N, mirror);
  const c = P[N].distanceTo(P[0]);
  return { P: orient(P, N), lambda: lam, chord: c, target };
}

export function segC(P, t, k, N) {
  const [u0,u1] = SEGS[k]; const c = new T.Vector3(); let W = 0;
  for (let i = Math.round(u0*N); i <= Math.round(u1*N); i++) {
    const w = radius(i/N, t) ** 2; c.addScaledVector(P[i], w); W += w;
  }
  return c.divideScalar(W);
}

function overlap(P, t, N) {
  let pen = 0, pairs = 0; const M = 40;
  for (let ia = 0; ia <= M; ia++) {
    const i = Math.round(ia / M * N), ri = radius(i / N, t);
    for (let ja = ia + Math.round(0.13 * M); ja <= M; ja++) {
      const j = Math.round(ja / M * N), rj = radius(j / N, t);
      const need = (ri + rj) * 0.92, d = P[i].distanceTo(P[j]);
      pairs++; if (d < need) pen += (need - d) * (need - d);
    }
  }
  return pen / Math.max(1, pairs) * 100;
}

/* the acceptance conditions, with margin beyond the queue item's stated "must" */
export const TARGET = { A: 0.55, B: -0.55, C: -0.80, D: 0.55, E: 0.25, F: -0.35, G: 0.30, MAXZ: 0.60 };

export function measure(p, N) {
  const cv = curve(p, 1, N, false), P = cv.P;
  const a = segC(P,1,'atrium',N), v = segC(P,1,'ventricle',N), b = segC(P,1,'bulbus',N),
        s = segC(P,1,'sinus',N), tr = segC(P,1,'truncus',N);
  let maxz = -1e9; for (let i = Math.round(0.40*N); i <= Math.round(0.87*N); i++) maxz = Math.max(maxz, P[i].z);
  let rad = 0; for (const q of P) rad = Math.max(rad, Math.hypot(q.x, q.z));
  const dx = b.x - v.x, dy = b.y - v.y, dz = b.z - v.z;
  return { A: v.z, B: v.x, C: a.z - v.z, D: a.y - v.y, E: dz, F: dx,
           G: Math.hypot(dx,dz) - Math.abs(dy), maxz, rad, sz: s.z,
           lambda: cv.lambda, chordErr: Math.abs(cv.chord - cv.target),
           ov: overlap(P, 1, N), a, v, b, s, tr };
}

function penalty(m) {
  const h = (x, lim, dir) => { const d = dir > 0 ? lim - x : x - lim; return d > 0 ? d*d : 0; };
  let pen = 0;
  pen += 40 * h(m.A, TARGET.A, +1);
  pen += 40 * h(m.B, TARGET.B, -1);
  pen += 40 * h(m.C, TARGET.C, -1);
  pen += 40 * h(m.D, TARGET.D, +1);
  pen += 20 * h(m.E, TARGET.E, +1);
  pen += 20 * h(m.F, TARGET.F, -1);
  pen += 15 * h(m.G, TARGET.G, +1);
  pen += 20 * h(m.maxz, TARGET.MAXZ, +1);
  pen += 10 * h(m.sz, -0.10, -1);
  pen += 0.8 * h(m.rad, 3.4, -1);
  pen += 3.0 * m.ov;
  pen += 200 * m.chordErr * m.chordErr;          // the tether must actually be met
  pen += 30 * h(m.lambda, LAM_CAP * 0.92, -1);   // and not by pinning the bend amplitude at its cap
  return pen;
}

/* Robust score: the parameters must give the SAME loop at a coarse and a fine integration. */
/* The loop has to be dextral and ventrally convex ALL THE WAY THROUGH, not only at day 28.
   The first solved candidate satisfied every t = 1 condition and swung the limb to the embryo's LEFT
   at t = 0.3 and t = 0.6 before coming back — one continuous function of t, and wrong for most of it.
   A student scrubbing the stage slider would have watched it loop the wrong way and correct itself. */
export function trajectory(p, N = 140) {
  const out = [];
  for (const t of [0.25, 0.45, 0.70]) {
    const cv = curve(p, t, N, false), P = cv.P;
    const v = segC(P, t, 'ventricle', N), b = segC(P, t, 'bulbus', N);
    out.push({ t, vx: v.x, vz: v.z, bx: b.x, lam: cv.lambda,
               chordErr: Math.abs(cv.chord - cv.target) });
  }
  return out;
}

function trajectoryPenalty(tr) {
  const h = (x, lim, dir) => { const d = dir > 0 ? lim - x : x - lim; return d > 0 ? d*d : 0; };
  let pen = 0;
  for (const s of tr) {
    pen += 30 * h(s.vx, -0.12 - 0.30 * s.t, -1);   // dextral from the start
    pen += 30 * h(s.bx, -0.12 - 0.45 * s.t, -1);   // and the bulbus leads it to the right
    pen += 20 * h(s.vz,  0.05 + 0.35 * s.t, +1);   // convex ventrally from the start
    pen += 200 * s.chordErr * s.chordErr;
    pen += 30 * h(s.lam, LAM_CAP * 0.92, -1);
  }
  return pen;
}

export function score(p, fine = false) {
  const m1 = measure(p, 140);
  let pen = penalty(m1) + trajectoryPenalty(trajectory(p, 140)) + 0.004 * p.a.reduce((s,x)=>s+x*x, 0);
  if (!fine) return { pen, m: m1 };
  const m2 = measure(p, 300);
  const tr2 = trajectory(p, 300), tr1 = trajectory(p, 140);
  const drift = ['A','B','C','D','E','F','G'].reduce((s,k)=>s + (m1[k]-m2[k])**2, 0)
    + tr1.reduce((s,x,i)=>s + (x.vx-tr2[i].vx)**2 + (x.vz-tr2[i].vz)**2, 0);
  return { pen: Math.max(pen, penalty(m2) + trajectoryPenalty(tr2)) + 50 * drift, m: m2, m1, drift, tr: tr2 };
}

export function unpack(x) { return { a: x.slice(0,4), psi: x.slice(4,8), chordFrac: x[8] }; }
export const BOUNDS = [
  [-2.2, 2.2], [-2.2, 2.2], [0.2, 2.2], [-1.8, 1.8],
  [-Math.PI, Math.PI], [-Math.PI, Math.PI], [-Math.PI, Math.PI], [-Math.PI, Math.PI],
  [0.26, 0.60],
];


/* ------------------------------------------------------------------ the search */
const f = (x, fine) => { try { return score(unpack(x), fine).pen; } catch (e) { return 1e9; } };
let seed = 20260910;
const rnd = () => { seed ^= seed << 13; seed ^= seed >>> 17; seed ^= seed << 5; return ((seed >>> 0) / 4294967296); };
const cl = x => x.map((v,i)=>Math.max(BOUNDS[i][0], Math.min(BOUNDS[i][1], v)));

const cands = [];
const SEED = [-1.0479,-0.8214,1.2856,-0.5237,-2.2790,-1.6195,-3.0306,-1.0428,0.60];
cands.push({ x: SEED, v: f(SEED, false) });
for (let k = 0; k < 9000; k++) { const x = BOUNDS.map(([lo,hi]) => lo + rnd()*(hi-lo)); cands.push({ x, v: f(x, false) }); }
for (let k = 0; k < 1200; k++) { const x = SEED.map((v,i)=>Math.max(BOUNDS[i][0],Math.min(BOUNDS[i][1], v + (rnd()-0.5)*(BOUNDS[i][1]-BOUNDS[i][0])*0.35))); cands.push({ x, v: f(x, false) }); }
cands.sort((a,b)=>a.v-b.v);
console.log('coarse top5:', cands.slice(0,5).map(c=>c.v.toFixed(3)).join(' '));

function refine(x0, fine) {
  let x = cl(x0.slice()), v = f(x, fine);
  let step = BOUNDS.map(([lo,hi]) => (hi-lo)*0.08);
  for (let it = 0; it < 200; it++) {
    let imp = false;
    for (let i = 0; i < x.length; i++) for (const s of [step[i], -step[i]]) {
      const y = x.slice(); y[i] = Math.max(BOUNDS[i][0], Math.min(BOUNDS[i][1], x[i]+s));
      const w = f(y, fine); if (w < v - 1e-12) { x = y; v = w; imp = true; }
    }
    if (!imp) { step = step.map(s=>s*0.5); if (Math.max(...step) < 2e-6) break; }
  }
  return { x, v };
}
let best = null;
for (const c of cands.slice(0, 8)) { const r = refine(c.x, false); if (!best || r.v < best.v) best = r; }
best = refine(best.x, true);
console.log('refined (robust) pen =', best.v.toFixed(6));
// round to what will actually be written into the model, then re-verify
const rx = best.x.map(n => Math.round(n * 1e4) / 1e4);
const p = unpack(rx);
console.log('PARAMS', JSON.stringify(p));
for (const N of [140, 300, 600]) {
  const m = measure(p, N);
  console.log('N='+String(N).padStart(3),
    'A='+m.A.toFixed(3), 'B='+m.B.toFixed(3), 'C='+m.C.toFixed(3), 'D='+m.D.toFixed(3),
    'E='+m.E.toFixed(3), 'F='+m.F.toFixed(3), 'G='+m.G.toFixed(3),
    'maxz='+m.maxz.toFixed(2), 'lam='+m.lambda.toFixed(3), 'chordErr='+m.chordErr.toExponential(1), 'ov='+m.ov.toFixed(3));
}
const m = measure(p, 300);
for (const k of ['s','a','v','b','tr']) console.log('  ', k.padEnd(3), m[k].x.toFixed(2), m[k].y.toFixed(2), m[k].z.toFixed(2));
console.log('trajectory:'); for (const s2 of trajectory(p, 300)) console.log('   t='+s2.t, 'vx='+s2.vx.toFixed(3), 'vz='+s2.vz.toFixed(3), 'bx='+s2.bx.toFixed(3), 'lam='+s2.lam.toFixed(2));
console.log('MUSTS:', JSON.stringify(TARGET));
