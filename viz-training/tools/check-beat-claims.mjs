/* MedBank · check a time-varying scene's NARRATED CLAIMS against the model, beat by beat.
 *
 *   node viz-training/tools/check-beat-claims.mjs <scene.json> <models3d/<model>.js>
 *   node viz-training/tools/check-beat-claims.mjs viz-training/scenes/gross__heart-pericardium__cardiac-cycle-pumping.json
 *
 * WHY THIS EXISTS. Proposed by the model3d review task on 2026-09-23, after two rounds on the
 * cardiac-cycle item in which four of eight defects were the same shape: the MODEL was right and
 * the SCENE pointed at an instant where its own narration was false. Beat 7 said "all four valves
 * are shut" at a t where the pulmonary valve was 82% open. Beat 4 said "flow peaks here" at 36% of
 * peak. Beat 3 promised a picture it did not draw. Beat 9 narrated a diastasis that existed at no t
 * at all. The model's own acceptance battery grew from 19 rows to 30 between those rounds and still
 * had ZERO rows of this kind, because every row tests the model against physiology and none tests
 * the scene against the model. Row X asserted that an all-shut window exists; nothing asserted that
 * beat 7 sat inside it.
 *
 * So: every view's narrated claims are written into the scene as `claims[]`, and this tool evaluates
 * each one against the model AT THAT VIEW'S OWN SET_STAGE t.
 *
 * IT NEGATIVE-TESTS ITSELF, which is the half that makes it worth anything. RENDER-STANDARD: every
 * acceptance test needs a negative case, because a test that cannot fail is not evidence. Each beat
 * is re-evaluated at t - 0.05 and t + 0.05 of a cycle, and at least one of that beat's claims must
 * FAIL at each. A beat whose claims all survive a displacement of 40 ms is not pinned to its own
 * instant, and would not have caught any of the four defects above.
 *
 * Run from the repo root. Exits non-zero on any failure.
 */
import { readFileSync, existsSync } from 'fs';
import vm from 'vm';
import { createRequire } from 'module';

/* ---- the smallest THREE that lets a model module evaluate (same stub as solve-cardiac-cycle) ---- */
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
  crossVectors(a, b) { return this.set(a.y*b.z - a.z*b.y, a.z*b.x - a.x*b.z, a.x*b.y - a.y*b.x); }
  distanceTo(v) { const dx=this.x-v.x, dy=this.y-v.y, dz=this.z-v.z; return Math.sqrt(dx*dx+dy*dy+dz*dz); }
  /* added 2026-09-30: septation-of-heart's limbus() solve — and therefore every atrial-septum
     measure that reads it — nearest-point-searches a centreline with distanceToSquared. */
  distanceToSquared(v) { const dx=this.x-v.x, dy=this.y-v.y, dz=this.z-v.z; return dx*dx+dy*dy+dz*dz; }
  lerp(v, a) { this.x += (v.x-this.x)*a; this.y += (v.y-this.y)*a; this.z += (v.z-this.z)*a; return this; }
}

const scenePath = process.argv[2] ||
  'viz-training/scenes/gross__heart-pericardium__cardiac-cycle-pumping.json';
const scene = JSON.parse(readFileSync(scenePath, 'utf8'));
const shortName = (process.argv[3] || ('models3d/' + scene.id.split('__').pop() + '.js'));

/* THE REAL three.js WHEN THE REPO HAS IT, the Vector3-only stub when it does not.
 * Added 2026-09-30 by the model3d build run on cranio-caudal-folding. The stub above is enough for a
 * model whose claims are arithmetic on solved constants, and it was enough for every model this tool
 * had met. It is NOT enough for a model that obeys RENDER-STANDARD's rule that "the measured side of
 * every acceptance assertion must be read from the geometry the model builds": such a model's
 * claimMeasure BUILDS, and the first thing it reaches for is THREE.Group, which the stub does not
 * have — so the tool died on beat 1 with "T.Group is not a constructor" and could not check that
 * scene at all. Real three is a superset of the stub, so every model that ran before runs unchanged;
 * the fallback is kept so the tool still works in a checkout with no node_modules. Which one is in
 * use is printed, because a proof that silently ran against a different substrate is worse than one
 * that failed. */
let THREE_IMPL = { Vector3: V3 }, THREE_WHICH = 'the Vector3-only stub in this file';
/* TRY BOTH BUILD FILES, AND SAY WHICH ONE ANSWERED. Added 2026-10-03 by the model3d build run on
 * pharyngeal-pouches, because the single path below silently stopped working and the failure mode is
 * the worst available: three ships `build/three.js` as a UMD file inside a package whose own
 * package.json declares "type": "module", so under Node 18+ require() treats it as ESM, returns an
 * EMPTY namespace, and the `real.Group` guard below falls through to the Vector3 stub. The banner
 * then says "the Vector3-only stub", which is true and easy to read past — and every claim whose
 * measure has to BUILD the model dies on `T.Group is not a constructor`, three screens of stack
 * trace with no hint that the cause is a module format. `build/three.cjs` is the same library in
 * CommonJS and requires cleanly. Measured on three 0.149.0: three.js gives 0 exported names,
 * three.cjs gives 407 including Group. Both are tried, in the order that keeps every repo that
 * worked before working unchanged. */
const THREE_CANDIDATES = ['/node_modules/three/build/three.cjs', '/node_modules/three/build/three.js'];
for (const rel of THREE_CANDIDATES) {
  try {
    const req = createRequire(import.meta.url);
    const real = req(process.cwd() + rel);
    if (real && real.Vector3 && real.Group) {
      THREE_IMPL = real; THREE_WHICH = 'the real three.js from node_modules' + rel.replace('/node_modules/three/build', '');
      break;
    }
  } catch (e) { /* try the next; if none answers the stub stands and the banner says so */ }
}

const sandbox = { window: { THREE: THREE_IMPL, VizKit: {} }, console: console, Math: Math,
                  isFinite: isFinite, isNaN: isNaN, Number: Number, Float32Array: Float32Array,
                  Uint16Array: Uint16Array, Uint32Array: Uint32Array, Date: Date, Map: Map, Set: Set,
                  Object: Object, Array: Array, JSON: JSON };
sandbox.globalThis = sandbox;
vm.createContext(sandbox);
/* RENDER-KIT FIRST, AND THE REAL ONE. Every model in this corpus is built on render-kit.js and some
 * of them CALL IT AT MODULE SCOPE — septation-of-heart builds its parallel-transported frame in a
 * top-level const, so with VizKit stubbed as {} the module threw
 * "K.parallelFrame is not a function" before a single claim could be read, and this tool could not
 * be run on it at all. render-kit evaluates cleanly against the Vector3-only stub above (checked:
 * all 19 of its exports are present afterwards), so loading it is strictly better than stubbing it,
 * and a model that reaches for a kit function this sandbox cannot support now says which one.
 * Added 2026-09-30 by the model3d build run on septation-of-heart, round 3. */
const KIT = 'models3d/render-kit.js';
if (existsSync(KIT)) {
  try { vm.runInContext(readFileSync(KIT, 'utf8'), sandbox, { filename: KIT }); }
  catch (e) { console.error('render-kit.js did not evaluate in this sandbox: ' + e.message);
              process.exit(2); }
} else {
  console.error('render-kit.js not found at ' + KIT + ' — run this from the repo root');
  process.exit(2);
}
vm.runInContext(readFileSync(shortName, 'utf8'), sandbox, { filename: shortName });
const models = sandbox.window.MB3D_MODELS || {};
const M = models[Object.keys(models)[0]];
/* EITHER ROUTE COUNTS. The own-vocabulary route below (claimMeasure) was added for heart-valves,
 * which happens to carry at(t) as well — so this guard kept demanding at(t) and a model that
 * brings ONLY claimMeasure was turned away with "this tool only checks time-varying scenes",
 * which was false of it. septation-of-heart is such a model: it is a 31-day process with no
 * cycle and no per-instant state object, and every claim it makes is a named measure of t.
 * Corrected 2026-09-30 by the model3d build run on septation-of-heart, round 3. */
if (!M || (!M.at && typeof M.claimMeasure !== 'function')) {
  console.error('model exposes neither at(t) nor claimMeasure(name, t); nothing to check a beat against');
  process.exit(2);
}

/* A MODEL MAY BRING ITS OWN VOCABULARY, and the second time-varying scene this tool met needed to.
 * Everything below was written for cardiac-cycle-pumping and asks that model for pressures, volumes
 * and flows through `M.cycle()`. heart-valves has no cycle(): it solves GEOMETRY, and its only
 * function of t is which valves are shut. Teaching this file a second model's measures would make it
 * the place every future model has to be registered; a model that exports `claimMeasure(name, t)`
 * instead keeps its own vocabulary next to the functions the vocabulary reads. The cardiac-cycle path
 * is untouched — a model without claimMeasure takes exactly the route it took before.
 * Added 2026-09-29 by the model3d build run on gross__heart-pericardium__heart-valves. */
const ownMeasure = typeof M.claimMeasure === 'function' ? M.claimMeasure : null;

const cyc = ownMeasure ? null : M.cycle();
/* acceptance() is NOT called on the own-vocabulary path. It builds geometry — heart-valves' row S
 * builds the whole model to check its own key list — and this file's sandbox has a stub THREE and no
 * VizKit at all, so calling it would throw before the first claim was read. */
const acc = ownMeasure ? null : M.acceptance();
const L = cyc && cyc.left, R = cyc && cyc.right, G = acc && acc.geometry;
const CYCLE_S = cyc ? cyc.cycle_s : (M.cycle_s || 1);
const wrap01 = x => x - Math.floor(x);
const recAt = (A, key, t) => {
  const rec = A.rec, n = rec.tau.length, x = wrap01(t) * n, i0 = Math.floor(x), fr = x - i0;
  const a = rec[key][i0 % n], b = rec[key][(i0 + 1) % n];
  return a + (b - a) * fr;
};
const dia = acc && acc.diastasis;
const ms = x => x * CYCLE_S * 1000;

/* every measure this vocabulary knows, as a pure function of t */
function measure(name, t) {
  if (ownMeasure) return ownMeasure(name, t);
  const a = M.at(t);
  const path = name.split('.');
  switch (path[0]) {
    case 'valve':  return a.valves[path[1]];
    case 'phase':  return a.phase.key;
    case 'lv': case 'rv': case 'la': case 'ra': case 'aorta': case 'pulm':
      return a[path[0]][path[1]];
    case 'flow': {
      const m = { mitral: [L,'Qin'], aortic: [L,'Qout'], tricuspid: [R,'Qin'], pulmonary: [R,'Qout'] }[path[1]];
      return recAt(m[0], m[1], t);
    }
    case 'cycle':    return (path[1] === 'left' ? L : R)[path[2]];
    case 'geometry': return G[path[1]];
    case 'base': {
      const ax = { x: 0, y: 1, z: 2 }[path[2]];
      const m = path[1].match(/^(\w+)_minus_(\w+)$/);
      if (m) return G.base[m[1]][ax] - G.base[m[2]][ax];
      return G.base[path[1]][ax];
    }
    case 'derived': return derived(path[1], t, a);
  }
  throw new Error('unknown measure: ' + name);
}

function derived(k, t, a) {
  const dt = 1 / 2000;
  switch (k) {
    case 'fill_frac':       return (a.lv.volume - L.esv) / (L.edv - L.esv);
    case 'ejected_frac':    return (L.edv - a.lv.volume) / (L.edv - L.esv);
    case 'wall_mm_here':    return a.geometry.lv.wall * 10;
    case 'mitral_flow_frac_of_E': return recAt(L, 'Qin', t) / L.e_peak;
    case 'mitral_flow_frac_of_A': return recAt(L, 'Qin', t) / L.a_peak;
    case 'aortic_flow_frac_of_peak': return recAt(L, 'Qout', t) / L.q_peak;
    case 'gradient_frac_of_peak': {
      let pk = 0; const rec = L.rec, n = rec.tau.length;
      for (let i = 0; i < n; i++) { const g = rec.Pat[i] - rec.Pv[i]; if (g > pk) pk = g; }
      return (a.la.pressure - a.lv.pressure) / pk;
    }
    case 'lv_minus_aorta':  return a.lv.pressure - a.aorta.pressure;
    case 'd_la_volume_dt':  return (M.at(t + dt).la.volume - M.at(t - dt).la.volume) / (2 * dt * CYCLE_S);
    case 'elastance_falling': {
      /* the ventricle has begun to relax: its pressure at constant-ish volume is past its peak */
      const p0 = recAt(L, 'Pv', t - dt), p1 = recAt(L, 'Pv', t + dt);
      return p1 < p0;
    }
    case 'in_diastasis':    return !!dia && wrap01(t - dia.from) < wrap01(dia.to - dia.from + 1e-12);
    case 'allshut_ivr_ms': {
      const w = acc.all_shut_windows.filter(x => x.phase === 'ivr')
                  .sort((x, y) => y.width_s - x.width_s)[0];
      return w ? w.width_s * 1000 : 0;
    }
    case 'tricuspid_reopen_ms': return ms(wrap01(R.events.avOpen - t));
    case 'a2p2_split_ms':       return ms(wrap01(R.events.slShut - L.events.slShut));
    case 'ms_since_aortic_shut': return ms(wrap01(t - L.events.slShut));
    case 'first_third_fill_frac': {
      /* share of the whole diastolic filling volume delivered in the first third of diastole */
      const open = L.events.avOpen, len = wrap01(L.events.avShut - open);
      const vol = u => recAt(L, 'Vv', wrap01(open + u));
      return (vol(len / 3) - vol(0)) / (vol(len) - vol(0));
    }
  }
  throw new Error('unknown derived measure: ' + k);
}

function evaluate(c, t) {
  const got = measure(c.measure, t);
  let ok;
  switch (c.op) {
    case 'equals':  ok = got === c.value; break;
    case 'near':    ok = Math.abs(got - c.value) <= (c.tol == null ? 1e-9 : c.tol); break;
    case 'between': ok = got >= c.value[0] && got <= c.value[1]; break;
    case 'atLeast': ok = got >= c.value; break;
    case 'atMost':  ok = got <= c.value; break;
    default: throw new Error('unknown op: ' + c.op);
  }
  return { ok: ok, got: got };
}

const fmt = v => (typeof v === 'number' ? (Math.abs(v) >= 100 ? v.toFixed(1) : v.toFixed(4)) : String(v));
let fails = 0, notBinding = 0, total = 0, pinned = 0;

/* ══════════════════════════════════ PINNED REFS: DOES THE BEAT DRAW THE t IT CLAIMS?
 *
 * ADDED 2026-09-30 by the model3d build run on fetal-circulation, round 5, and it is the check review
 * round 3's R3-FIXED-1 needed and nothing had.
 *
 * A procedural ref may PIN its t — `model#part@0.25`. viz3d's atStage() returns null for a pinned ref
 * and stageable() reports it unstageable (viz3d.js:552,561), so SET_STAGE CANNOT RESTAGE A PINNED
 * STRUCTURE: the player draws the model at the PIN's t, whatever t the beat is at. Everything else in
 * this file evaluates a claim at the beat's SET_STAGE t, so a claim can be true at the beat's instant
 * while the picture is the model at another one — which is exactly how beat 9 of fetal-circulation drew
 * the duct's arrows in the FETAL direction, at 3.5x the correct length, in the one beat written to show
 * them reverse, through four build rounds and every gate.
 *
 * So this asserts the one thing a claim cannot: for every structure a view leaves showing, a pinned ref
 * must be pinned at THAT VIEW'S OWN t. A pin is legitimate — it is what stops a flow marker resolving
 * `reason:'none'` at a t where the model emits none — but a pin that does not match its beat is a beat
 * drawing another beat's picture. Two beats needing two different t of one part need two keys, which is
 * what this scene already does for the pda and pfc variants.
 *
 * Reported per view and counted into the same failure total, because a beat that draws the wrong instant
 * is not a lesser defect than a beat that claims the wrong number. */
const refOf = s2 => (s2 && s2.refs && s2.refs.procedural) || '';
const pinOf = ref => { const m = /#[^@+]+@([-0-9.eE]+)/.exec(ref); return m ? parseFloat(m[1]) : null; };
const byKey = {};
const byGroup = {};
for (const s2 of (scene.structures || [])) {
  byKey[s2.key] = s2;
  if (s2.group) (byGroup[s2.group] = byGroup[s2.group] || []).push(s2.key);
}
/* A TARGET MAY BE A GROUP, AND THREE OPS BESIDES SHOW/HIDE DECIDE WHAT IS VISIBLE.
 *
 * Corrected 2026-10-03 by the model3d build run on pharyngeal-arches, which this reported twenty
 * pinned-elsewhere failures against while every one of its twenty-four claims passed and every beat
 * was pinned to its own t. None of the twenty was real. The scene hides whole groups —
 * `{op:'HIDE_STRUCTURE', target:'Clinical'}` — and the resolver treated 'Clinical' as a structure
 * KEY, found no such structure, set a phantom entry false and left the three real members of that
 * group standing in its model of the beat. The spec has allowed a group target throughout
 * ("Every `target`, `targets[]`, `path[]`, `from` and `to` must name a structure `key` or a `group`
 * in the same scene, or be `*`"), validate-scenes accepts it, and viz3d's dispatcher resolves it;
 * this file was the one place that did not.
 *
 * ISOLATE_REGION and PEEL_LAYER were missing for the same reason and matter more, because both only
 * ever REMOVE things: a scene that isolates one region was being checked as though every structure in
 * it were on screen, so this file has been over-reporting pinned structures on every scene that
 * isolates — the direction that manufactures work for a reviewer rather than hiding it, which is
 * presumably why it went unnoticed. The expansion below is the same one
 * viz-training/tools/render-pharyngeal-arches.mjs uses for its beat probe, so the two agree. */
function keysFor(target) {
  if (target === '*' || target == null) return Object.keys(byKey);
  if (byGroup[target]) return byGroup[target];
  return [target];
}
function visibleAfter(ops) {
  const vis = {};
  for (const k of Object.keys(byKey)) vis[k] = true;
  for (const o of (ops || [])) {
    if (o.op === 'SHOW_STRUCTURE') keysFor(o.target).forEach(k => { if (k in vis) vis[k] = true; });
    else if (o.op === 'HIDE_STRUCTURE') keysFor(o.target).forEach(k => { if (k in vis) vis[k] = false; });
    else if (o.op === 'ISOLATE_REGION') {
      const keep = new Set(keysFor(o.target));
      Object.keys(vis).forEach(k => { if (!keep.has(k)) vis[k] = false; });
    } else if (o.op === 'PEEL_LAYER') {
      for (const s2 of (scene.structures || [])) if (s2.layer === o.layer) vis[s2.key] = false;
    }
  }
  return Object.keys(vis).filter(k => vis[k]);
}
/* A PIN AT ANOTHER t IS SOMETIMES THE POINT OF THE BEAT, and this tool could not tell that from a
 * mistake. cardiac-looping's L-loop comparison is the documented case — "the L-loop comparison shows
 * the finished loop beside the finished mirror loop and must not slide when a neighbouring view walks
 * the stages" (viz3d.js) — and cranio-caudal-folding's beat 3 is another: it draws the cranial strip
 * BEFORE the head fold beside the same strip AFTER it, which is the single most examined point in
 * that topic and is impossible without two pins.
 *
 * So a view may declare `pinned_ok: { "<structure key>": "why" }`, and a declared pin is REPORTED
 * with its reason and not counted. RENDER-STANDARD 3.x's rule applies unchanged: a waiver is an
 * argument someone wrote down, and a reviewer can see it in the scene and argue with it; an
 * UNdeclared pin still fails. Added 2026-09-30 by the model3d build run on cranio-caudal-folding. */
function pinReport(v, t) {
  const bad = [], waived = [];
  const okd = v.pinned_ok || {};
  for (const k of visibleAfter(v.ops)) {
    const pin = pinOf(refOf(byKey[k]));
    if (pin != null && Math.abs(pin - t) > 1e-9) {
      if (okd[k]) waived.push(k + ' pinned @' + pin + ' — ' + okd[k]);
      else bad.push(k + ' pinned @' + pin);
    }
  }
  return { bad, waived };
}
console.log('MedBank · beat-claim check\n  scene ' + scenePath + '\n  model ' + shortName
  + '\n  THREE  ' + THREE_WHICH + '\n');

for (const v of scene.views) {
  const st = (v.ops || []).find(o => o.op === 'SET_STAGE');
  if (!st) continue;
  const t = st.t;
  const claims = v.claims || [];
  console.log('beat ' + v.beat + '  t=' + t.toFixed(4) + '  ' + v.title);
  const pr = pinReport(v, t);
  if (pr.waived.length) {
    console.log('    PINNED-DELIBERATELY  ' + pr.waived.join('; '));
  }
  if (pr.bad.length) {
    pinned += pr.bad.length; fails += pr.bad.length;
    console.log('    PINNED-ELSEWHERE  this beat sits at t=' + t.toFixed(4) +
                ' but the player draws these at their pinned t, not at it: ' + pr.bad.join(', ') +
                ' — SET_STAGE cannot restage a pinned ref (viz3d.js:561)');
  }
  if (!claims.length) { console.log('    (no claims — a time-varying beat with no claims is unchecked)'); fails++; continue; }
  for (const c of claims) {
    total++;
    const r = evaluate(c, t);
    if (!r.ok) fails++;
    console.log('    ' + (r.ok ? 'PASS' : 'FAIL') + '  ' + c.id.padEnd(16) +
                c.claim + '  [' + c.measure + ' ' + c.op + ' ' + JSON.stringify(c.value) +
                (c.tol != null ? ' +/-' + c.tol : '') + ']  -> ' + fmt(r.got));
  }
  /* THE NEGATIVE CASE: displace the beat and require that it stops being true.
     The near displacement defaults to 0.05 of a cycle (40 ms at 75 bpm). A beat that legitimately
     stands for an INTERVAL rather than an instant — diastasis is 0.104 of a cycle wide — cannot be
     pinned tighter than its own interval, and says so by declaring `negative_displacement`, which a
     reviewer can see in the scene and argue with. The far displacement of 0.15 is not negotiable and
     every beat must fail it, so declaring a wide interval cannot buy a beat out of being checked. */
  const near = v.negative_displacement || 0.05;
  for (const dtr of [-near, +near, -0.15, +0.15]) {
    const t2 = wrap01(t + dtr);
    let broke = null;
    for (const c of claims) { let r; try { r = evaluate(c, t2); } catch (e) { r = { ok: false }; }
                              if (!r.ok) { broke = c.id; break; } }
    if (!broke) { notBinding++;
      console.log('    NOT-BINDING  every claim still holds at t=' + t2.toFixed(4) +
                  ' (displaced ' + (dtr > 0 ? '+' : '') + dtr.toFixed(3) +
                  ') — these claims do not pin this beat to its own instant'); }
  }
  console.log('');
}
console.log('claims ' + total + ', failures ' + fails + ', beats not pinned to their own t ' + notBinding +
            ', structures drawn at a t their beat is not at ' + pinned);
const ok = fails === 0 && notBinding === 0;
console.log(ok ? 'ALL BEAT CLAIMS HOLD, AND EACH BEAT IS PINNED TO ITS OWN INSTANT'
               : 'BEAT CLAIM CHECK FAILED');
process.exit(ok ? 0 : 1);
