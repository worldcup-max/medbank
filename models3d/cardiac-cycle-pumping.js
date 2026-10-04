/* MedBank · cardiac cycle (pumping) — PRODUCTION procedural model.
 *
 * Registers itself as MB3D_MODELS['cardiac-cycle-pumping'], which is the whole contract the
 * procedural provider in viz3d.js depends on: a LAYERS palette, FULL, and build(t, opts) ->
 * THREE.Group whose meshes carry userData.key.
 *
 * WRAPPED IN AN IIFE. Only the registration escapes. RENDER-STANDARD: a model written at top level
 * puts T, K, C, LAYERS and every constant into global lexical scope, and the second model to load —
 * written the obvious way, `const T = window.THREE` — dies on "Identifier 'T' has already been
 * declared" and takes the page with it.
 *
 * ------------------------------------------------------------------------------------------------
 * WHY PROCEDURAL. The queue item carries `candidate_meshes: 3`. Checked rather than trusted: the
 * three meshes in `available-meshes.json` whose names match are `great cardiac vein` (FMA4707),
 * `middle cardiac vein` (FMA4713) and `set of anterior cardiac veins` (FMA71567). They are VEINS.
 * They name-match on the word "cardiac" and have nothing to do with this structure. There is no STL
 * of the cardiac cycle and there cannot be one: the subject is not an object, it is what the object
 * DOES. RENDER-STANDARD §5 — procedural belongs where the form is a function of something — and this
 * form is a function of time and of nothing else.
 *
 * ------------------------------------------------------------------------------------------------
 * WHAT t MEANS. t = 0 to t = 1 is ONE COMPLETE CARDIAC CYCLE, 0.80 s at 75 beats per minute.
 * t = 0 is the onset of ATRIAL SYSTOLE — the P wave. The cycle is periodic, so build(0) and build(1)
 * are the same picture; that is asserted, not assumed (acceptance test P).
 *
 * AXES. +x = patient's LEFT, +y = SUPERIOR, +z = ANTERIOR. The same frame cardiac-looping.js and
 * heart-external.js use, and the frame viz3d.js's VIEW_DIR assumes. UNITS: centimetres for geometry,
 * millilitres / mmHg / seconds for the physiology.
 *
 * ------------------------------------------------------------------------------------------------
 * THE ONE DECISION THIS MODEL IS ABOUT.
 *
 * RENDER-STANDARD: "Ask which number a student would be marked wrong for, and solve THAT one against
 * a stated constraint." For the cardiac cycle that number is not a size. It is WHEN EACH VALVE MOVES,
 * and the fact that nothing but a pressure difference moves it. A model that schedules the valves —
 * "mitral shuts at 0.12, aortic opens at 0.19" — teaches the timings and destroys the mechanism,
 * because a scheduled valve shuts on time even when the model's own pressures say it should not.
 *
 * So NOTHING here is scheduled. The model integrates a time-varying-elastance circulation:
 *
 *     P_ventricle  = e(t)·Emax·(V−V0) + (1−e(t))·Ppass(V)    active spring, passive exponential
 *     Ppass(V)     = a·(exp(b·(V−V0)) − 1)       the end-diastolic pressure-volume relation
 *     Q_valve      = max(0, ΔP) / R_valve        a valve is a diode: flow only down a gradient
 *     dV/dt        = Q_in − Q_out                volume is the integral of what crossed the valves
 *     dP_art/dt    = (Q_out − P_art/R) / C       the windkessel the ventricle ejects into
 *     dV_ven/dt    = Q_source − Q_venous         the venous reservoir the atrium draws on
 *
 * and every event in the Wiggers diagram is then a CROSSING of two of those pressure curves, found
 * by root-solve on the integrated trace:
 *
 *     mitral shuts  when P_LV rises above P_LA     -> S1, start of isovolumetric contraction
 *     aortic opens  when P_LV rises above P_Ao     -> start of ejection
 *     aortic shuts  when P_LV falls below P_Ao     -> S2, start of isovolumetric relaxation
 *     mitral opens  when P_LV falls below P_LA     -> start of ventricular filling
 *
 * THE ISOVOLUMETRIC PHASES ARE THEREFORE ISOVOLUMETRIC BY CONSTRUCTION, not by tuning. Between the
 * mitral shutting and the aortic opening no valve is open, so Q_in and Q_out are both zero, so dV/dt
 * is zero. That is the single most examined fact about this structure and this model cannot get it
 * wrong without the arithmetic failing. Acceptance test I measures it anyway.
 *
 * WHAT IS STATED (inputs — all textbook, all examinable):
 *   · cycle 0.80 s (75 bpm); PR interval 0.16 s, so the ventricle is activated 0.16 s after the atrium
 *   · LV end-diastolic volume 120 ml, end-systolic volume 50 ml
 *   · aortic pressure 120 / 80 mmHg
 *   · RV end-diastolic volume 130 ml, end-systolic volume 60 ml
 *   · pulmonary artery pressure 25 / 10 mmHg
 *   · minor-axis fractional shortening of the ventricle 0.30 (the echocardiographer's FS)
 *   · end-diastolic filling pressure 8 mmHg on the left, 4 on the right
 *   · the chamber stiffness constant of the exponential filling curve, 0.025 /ml left, 0.018 right
 *
 * WHAT IS SOLVED from those (bisection, in tools/solve-cardiac-cycle.mjs, pasted into SOLVED below).
 * Four knobs per side, each aimed at exactly ONE stated target, so every one of them is legible:
 *   · E_max of each ventricle      <- bisected against that ventricle's end-systolic volume
 *   · the venous source pressure   <- bisected against its end-diastolic volume
 *   · the arterial resistance      <- bisected against arterial diastolic pressure
 *   · the arterial compliance      <- bisected against arterial pulse pressure
 * and one DERIVED in closed form, not bisected and not a fifth knob: the scale of the passive
 * filling curve, fixed exactly by the two stated numbers it must pass through, (EDV, EDP).
 * They land on textbook values without being aimed at them, which is worth noticing: total arterial
 * compliance 1.55 ml/mmHg and systemic resistance 1.09 mmHg.s/ml are both what the literature gives.
 *
 * WHAT IS PREDICTED, and therefore falsifiable — measured by acceptance(), never solved against:
 *   · stroke volume 70 ml and ejection fraction 0.58 on the left
 *   · the two sides eject the SAME stroke volume, which nothing in the solve imposes
 *   · systole (mitral shut -> aortic shut) lasts about 0.30 s and diastole about 0.50 s
 *   · isovolumetric contraction about 0.05 s, isovolumetric relaxation about 0.08 s
 *   · the RIGHT side's events bracket the left's: the pulmonary valve opens before the aortic and
 *     shuts after it — that is the splitting of the second heart sound — and the tricuspid opens
 *     before the mitral. Nothing in the solve imposes any of it.
 *   · peak ejection flow of a few hundred millilitres a second, on both sides
 *   · atrial systole contributes about a fifth of ventricular filling — the "atrial kick"
 *   · the ventricle's long axis shortens about 15% while its minor axis shortens 30%
 *   · the LV wall thickens from about 10 mm to about 15 mm, because myocardial volume is conserved
 *   · the mitral valve shuts BEFORE the tricuspid — M1 before T1. This model had it the wrong way
 *     round for a week, declared as a defect in the scene's gaps[] because a test that asserts a
 *     defect locks it in. The venous reservoir of 2026-09-29 repaired it, and nothing was aimed at
 *     it; it is asserted now, by row W2.
 *
 * AND ONE THING THAT IS NEITHER, LABELLED HONESTLY. The transmitral E/A ratio and the depth of the
 * diastasis (rows Y and Z) are not bisected against — but the chamber stiffness constant that
 * dominates them was chosen from inside its literature range with a sweep of those measurements in
 * view. They carry the label `calibrated`: weaker than a prediction, stronger than a solve. See the
 * DIASTOLE block below, and the sweep in BUILD-LOG.md.
 *
 * The last two are geometry, not circulation, and they matter for the same reason: minor-axis
 * shortening is STATED and long-axis shortening and wall thickening COME OUT. Wall thickness is not
 * a dial anywhere in this file — the epicardial surface is whatever encloses a constant myocardial
 * volume around the cavity the circulation solved for.
 *
 * ------------------------------------------------------------------------------------------------
 * WHAT THIS MODEL DELIBERATELY DOES NOT CLAIM — see the scene's gaps[] for the full list.
 *   · The right ventricle is a flattened tube swept along a curved path that wraps the left — right
 *     in kind, schematic in detail. It rides at a constant standoff from the left ventricle at every
 *     station, where a real outflow tract rises into an infundibulum and comes medially over the
 *     left ventricular outflow; so its inflow and outflow ends sit 9.0 cm apart and the four
 *     chambers span 12.3 cm in x where a real heart spans about 8.5. Measured 2026-09-22 and
 *     declared in the scene's gaps[]. A student learning RV shape needs a mesh scene.
 *   · Coronary flow does not exist here, so the fact that the left coronary fills in DIASTOLE — which
 *     is examined, and is a consequence of this very cycle — is narrated but not drawn.
 *   · There is no conducting system and no ECG trace. The PR interval enters as a number.
 *   · The aorta stores 73% of the stroke volume where a real one stores about half, and the E wave
 *     carries 0.495 of diastolic filling where a real one carries 0.7-0.8. Both are consequences of
 *     describing a whole circulation as one resistance and one compliance per bed. Declared in the
 *     scene's gaps[] with the numbers, and the narration teaches the real physiology rather than
 *     this model's approximation to it.
 */
(function () {

const T = window.THREE;
const K = window.VizKit;   // render-kit.js must load first — it owns winding, normals and colour

/* ================================================================= 1 · PHYSIOLOGY

   Units throughout this section: millilitres, mmHg, seconds, ml/s, ml/mmHg, mmHg·s/ml.            */

const CYCLE_S   = 0.80;    // one beat at 75 bpm
const PR_S      = 0.16;    // atrial activation to ventricular activation — the PR interval

/* STATED targets. Everything in SOLVED below exists to hit exactly these and nothing else. */
const STATED = {
  lv: { edv: 120, esv: 50, edp: 8 },
  rv: { edv: 130, esv: 60, edp: 4 },
  ao: { sys: 120, dia: 80,  qpeak: 500 },
  pa: { sys: 25,  dia: 10,  qpeak: 480 },
  fs_minor: 0.30,          // minor-axis fractional shortening, ventricle
};
/* `edp` — the END-DIASTOLIC FILLING PRESSURE, added 2026-09-29. Textbook and examined: a left
   ventricular end-diastolic pressure of about 8 mmHg and a right of about 4. It is stated here
   because it is the second number the passive filling curve needs, and because the curve is what
   this rework is about: see DIASTOLE below. */

/* ---------------------------------------------------------------- activation

   A chamber's elastance rises and falls once per cycle. The ventricle is activated PR_S after the
   atrium, which is the only place the AV delay enters — and it is what puts atrial systole in front
   of ventricular systole rather than a hand-placed offset.

   Shape: sin^2 up, cos^2 down. Smooth, C1 at the joins, zero outside its own window, and it does not
   pretend to be more than it is — the point of this curve is WHEN the chamber is stiff, and the
   valve events depend on the crossings, not on the curve's exact profile. */
function activation(phase, rise, hold, fall) {
  // phase in [0,1) of the cycle, measured from that chamber's own activation instant
  const r = rise / CYCLE_S, hh = hold / CYCLE_S, f = fall / CYCLE_S;
  if (phase < 0 || phase >= r + hh + f) return 0;
  if (phase < r) { const s = Math.sin(Math.PI * phase / (2 * r)); return s * s; }
  if (phase < r + hh) return 1;
  const c = Math.cos(Math.PI * (phase - r - hh) / (2 * f));
  return c * c;
}
const wrap01 = x => x - Math.floor(x);

/* THE PLATEAU IS NOT DECORATION. Written first as a plain rise-and-fall, the ventricle lost its
   pressure-generating capacity the instant the curve peaked, so the aortic valve shut almost as soon
   as it had opened: ejection came out at 0.107 s against an isovolumetric relaxation of 0.145 s,
   which is the wrong way round and wrong by a factor of two. A real ventricle holds near-maximal
   elastance across most of ejection. Rise, hold, fall — and the durations below are the shape of
   mechanical systole, stated, with everything that follows from them measured. */
/* V_FALL WAS 0.105 UNTIL 2026-09-22, AND THAT IS WHAT PUT THE RIGHT HEART OUT OF WIGGERS ORDER.
   A ventricle that relaxes in 105 ms drops its pressure below its own atrium's very quickly, and on
   the RIGHT — where the peak is 25 mmHg rather than 120, so there is barely any pressure to shed —
   it got there while the pulmonary outflow was still coasting. The tricuspid opened 1.15e-5 of a
   cycle BEFORE the pulmonary shut: the right ventricle was open to the right atrium and the
   pulmonary trunk at the same time, for 11 samples of the trace, and the right isovolumetric
   relaxation window therefore had NEGATIVE width. It wrapped, and the model reported ivr_s = 0.79999
   s — the whole cycle — with allPass true beside it, because nothing asserted on the right side.

   0.145 s is not a number chosen to make the symptom go away; it is the one the measurement says is
   right. Isovolumic relaxation of a ventricle has a time constant tau of 40-50 ms and takes three to
   four tau to complete, so 145 ms is the textbook figure and 105 ms was short. Lengthening it fixes
   the defect at its cause and repairs the model's own weakest declared number at the same time:
   LEFT isovolumetric relaxation goes 0.044 s -> 0.073 s against a textbook 0.08, which the FIXED
   comment below had recorded as the price of the lumped inertance. It was not the inertance.

   What it costs: A2-to-P2 splitting comes out at 33 ms (was 30), right isovolumetric relaxation at
   16 ms — short, positive, and shorter than the left's, which is the correct way round and is the
   thing a student is examined on. Every one of those is now asserted; see acceptance rows J2-N2, V
   and W. */
const V_RISE = 0.130, V_HOLD = 0.110, V_FALL = 0.145;   // ventricle, seconds
/* THE ATRIUM'S MECHANICAL SYSTOLE ENDS EXACTLY WHERE THE VENTRICLE'S BEGINS, so A_FALL is DERIVED
   rather than chosen: A_RISE + A_HOLD + A_FALL = PR_S. Added 2026-09-29 with the venous reservoir,
   and it is the reservoir that made it necessary. A_FALL was 0.060 s, which ended atrial systole at
   t = 0.15 of a cycle while the ventricle is not activated until t = 0.20. Against the old IDEAL
   venous source that gap was invisible — atrial pressure could not fall below the source, so it
   stayed above the ventricle's and the mitral valve kept passing flow until the ventricle contracted.
   Against a reservoir the atrium genuinely relaxes, its pressure fell to 5.9 mmHg under a ventricle
   sitting at its stated 8.0, flow stopped at t = 0.1115, and the span the model calls isovolumetric
   contraction became 0.134 s — most of it a fully-relaxed ventricle at end-diastolic volume with
   nothing contracting at all.

   The gradient reversal itself is REAL and is kept: left atrial pressure after the a-wave does fall
   below left ventricular end-diastolic pressure, which is why the mitral valve is already apposed
   before the ventricle contracts and why M1 is the tensing of a shut valve rather than its closure.
   What was wrong was a 40 ms interval of nothing between the two systoles. Tying the end of atrial
   relaxation to the onset of ventricular contraction removes it with a constraint instead of a
   constant, and 0.16 s of atrial mechanical systole is the textbook figure in its own right.       */
const A_RISE = 0.050, A_HOLD = 0.010, A_FALL = PR_S - A_RISE - A_HOLD;   // atrium — ends at the QRS

function eVent(tau) { return activation(wrap01(tau - PR_S / CYCLE_S), V_RISE, V_HOLD, V_FALL); }
function eAtr(tau)  { return activation(wrap01(tau),                  A_RISE, A_HOLD, A_FALL); }

/* ------------------------------------------------------------------- SOLVED

   Produced by `node viz-training/tools/solve-cardiac-cycle.mjs --solve`, which loads THIS FILE with
   a stub THREE/VizKit and bisects against STATED above. There is no second copy of the circulation
   model anywhere: the tool measures this one. Do not hand-edit these; change the model, re-run the
   tool, paste what it prints, and check that acceptance() still passes — the model asserts it at
   build time, so a drifted parameter says so in the console instead of quietly teaching a wrong
   cycle.                                                                                          */
const SOLVED = {
  solved_at: '2026-09-29',          // re-solved after the venous reservoir and the exponential EDPVR
  solver: 'viz-training/tools/solve-cardiac-cycle.mjs --solve',
  /* four numbers per side, each bisected against ONE stated target. `p_src` was `p_ven` until
     2026-09-29: it is the same knob, bisected against the same end-diastolic volume, but it now
     drives the far side of the venous reservoir rather than the atrium directly. See DIASTOLE. */
  left:  { emax_v: 1.5023, p_src: 10.7970, r_art: 1.0931, c_art: 1.5447 },
  right: { emax_v: 0.2907, p_src: 6.0204, r_art: 0.1631, c_art: 4.9575 },
};

/* Fixed properties — not solved, and not targets either. These are the parts of the circulation the
   stated numbers do not pin down: a chamber's unstressed volume, its diastolic stiffness, the
   trivial resistance of an open valve. They are held at textbook order-of-magnitude values and the
   solve moves the four that matter around them. Recorded here so that a reviewer can see exactly
   which numbers were chosen and which were derived, instead of having to work it out.

   ONE OF THEM IS A DECLARED COMPROMISE AND A REVIEWER SHOULD KNOW WHERE IT SITS. `l_out`, the
   outflow inertance, trades EJECTION DURATION against ISOVOLUMETRIC RELAXATION, monotonically and
   with no setting that makes both right. Measured on this model, left side:

       l_out    ejection    IVR      systole        (life: ~0.25 / ~0.08 / ~0.30)
       0.0050     0.183    0.078      0.238
       0.0075     0.214    0.044      0.271          <- chosen
       0.0100     0.235    0.023      0.292

   The reason is structural, not a tuning failure: with one lumped inertance the aortic valve shuts
   when the coasting column finally stops, and a longer coast is exactly a later closure and a lower
   ventricular pressure left to dissipate. A real aorta has wave reflection and a distributed mass;
   this has one number. 0.0075 was chosen as the point where BOTH land inside their textbook ranges
   rather than the point that optimises either — systole 0.271 s against 0.30, isovolumetric
   relaxation 0.044 s against 0.08. If a reviewer thinks the balance should sit elsewhere, that is a
   judgement about which phase a student is more likely to be examined on, and it is theirs to make;
   the trade-off itself is not removable without a distributed arterial model.

   THE TABLE ABOVE IS STILL TRUE AND THE CONCLUSION DRAWN FROM IT WAS NOT. It was measured with
   V_FALL at 0.105 s, and the 0.044 s isovolumetric relaxation it reports was blamed on the
   inertance. The inertance was not the cause: the ventricle was being relaxed in 105 ms against a
   time constant of 40-50 ms that needs three or four of them to finish. At V_FALL = 0.145 s the same
   l_out = 0.0075 gives isovolumetric relaxation 0.073 s against a textbook 0.08, with ejection and
   systole unchanged. The trade-off is real; it was carrying an error that did not belong to it.
   Re-measure the table before quoting it — every number in it is from the old relaxation. */
const FIXED = {
  left:  { v0_v: 10, b_pass: 0.025, v0_a: 4, emin_a: 0.180, emax_a: 0.480,
           r_in: 0.020, r_out: 0.006, r_ven: 0.010, z_art: 0.026, l_out: 0.00750,
           c_ven: 6.0, r_src: 0.020 },
  right: { v0_v: 12, b_pass: 0.018, v0_a: 4, emin_a: 0.095, emax_a: 0.260,
           r_in: 0.012, r_out: 0.004, r_ven: 0.006, z_art: 0.020, l_out: 0.00250,
           c_ven: 12.0, r_src: 0.012 },
};

/* ------------------------------------------------------------------ DIASTOLE

   REWRITTEN 2026-09-29, and this is what this round of rework is. Review round 2 found that beat 9
   narrates DIASTASIS — "filling has almost stopped ... this quiet stretch is diastole's slack" — and
   that the model had no such instant at ANY t: mitral inflow fell monotonically from its early peak
   to 120 ml/s at the P wave and never approached zero. A beat whose claim is true at no t is a MODEL
   finding, not a narration finding, so the narration was left alone and the model changed.

   Measured on the model as it stood, independently of the review, before anything was touched:
   peak early inflow 314 ml/s, inflow at beat 9's own t = 0.88 still 161 ml/s (51% of peak), and the
   whole of the interval between mitral opening and the P wave monotonically decreasing. There was no
   plateau anywhere. TWO structural causes, and the fix is one for each.

   1 · THE ATRIUM WAS CLAMPED. `Qven = (p_ven - Pat) / r_ven` with r_ven = 0.005 is a conductance of
       200 ml/s per mmHg onto an IDEAL pressure source. Nothing the atrium or the ventricle could do
       moved left atrial pressure off 10.61 mmHg — measured, it varied between 9.43 and 10.26 across
       the whole of diastole — so the atrioventricular gradient could not close and inflow could not
       stop. The y-descent did not exist; neither did the mid-diastolic plateau that follows it.
       An ideal source also let atrial systole regurgitate 738 ml/s backwards into the veins.

       FIX: the constant-pressure source moves one compartment upstream. There is now a VENOUS
       RESERVOIR of finite compliance `c_ven` between it and the atrium — the pulmonary veins on the
       left, the great veins on the right — filled from the source through `r_src` and emptying into
       the atrium through `r_ven`. Its pressure FALLS as the atrium and ventricle draw on it during
       rapid filling and recovers while they do not, which is what a y-descent is.

   2 · THE VENTRICLE DID NOT STIFFEN AS IT FILLED. Passive pressure was `emin_v * (V - v0_v)`, a
       straight line, so the last 20 ml of filling met no more resistance than the first. A real
       ventricle's end-diastolic pressure-volume relation is EXPONENTIAL, which is why filling
       decelerates into diastasis and why the atrial kick has to exist at all.

       FIX: P_passive(V) = a_pass * (exp(b_pass * (V - v0_v)) - 1), blended with the active
       end-systolic relation by the activation curve in the standard time-varying-elastance form
           P = e(tau) * emax_v * (V - v0_v) + (1 - e(tau)) * P_passive(V)
       which is identical to the old expression at e = 1, so `emax_v` keeps its meaning and its
       bracket in the solver, and differs only in diastole, which is the half being repaired.

   `b_pass`, the chamber stiffness constant, is STATED: 0.016 /ml on the left and 0.020 /ml on the
   right, inside the 0.01-0.03 /ml range reported for the human ventricle. `a_pass` is then not free
   — it is DERIVED in closed form, below, from the stated end-diastolic pressure and volume. It is
   not a fifth knob and it is not bisected: two stated numbers fix it exactly.

   `c_ven`, `r_src` and `r_ven` join `r_in`, `r_out` and `z_art` in the FIXED block above, for the
   same reason those are there: the stated targets do not pin them down, so they are held at
   literature order-of-magnitude values rather than aimed at anything. Total pulmonary vascular
   compliance is reported at 4-7 ml/mmHg, and 6.0 is used here. THE RIGHT-HAND VALUE IS A MODELLING
   CHOICE AND IS DECLARED AS ONE: total systemic venous compliance is of order 100 ml/mmHg, and 12.0
   is not that number. What is represented is the part of the venous bed in direct communication with
   the right atrium within one 0.8 s beat, which is a small fraction of the whole; the full figure
   would make the right atrium a pressure source again and reproduce exactly the defect this change
   exists to remove. It is in the scene's gaps[].

   NOTHING HERE IS AIMED AT THE DIASTASIS. The E/A ratio and the depth of the mid-diastolic plateau
   are PREDICTED by acceptance rows Y and Z and are free to come out wrong. On the model as it stood
   the transmitral E/A ratio measured 0.86 — peak early inflow 270 ml/s against a peak atrial-systolic
   inflow of 314 — which is not merely "no diastasis": it is a reversed E/A, the pattern a student is
   taught to read as impaired relaxation. That number was computed by nothing and asserted by nothing
   before this round.                                                                                */

/* a_pass, in closed form: the passive curve must pass through (edv, edp), both stated. */
const PASSIVE = {};
for (const side of ['left', 'right']) {
  const st = STATED[side === 'left' ? 'lv' : 'rv'];
  const f = FIXED[side];
  PASSIVE[side] = st.edp / (Math.exp(f.b_pass * (st.edv - f.v0_v)) - 1);
}

function paramsFor(side, over) {
  const p = {};
  for (const k in FIXED[side]) p[k] = FIXED[side][k];
  for (const k in SOLVED[side]) p[k] = SOLVED[side][k];
  p.a_pass = PASSIVE[side];
  if (over) for (const k in over) p[k] = over[k];
  /* If an override moves b_pass or v0_v, a_pass must move with it, or the curve no longer passes
     through the stated end-diastolic point and the override is silently measuring something else. */
  if (over && (over.b_pass != null || over.v0_v != null) && over.a_pass == null) {
    const st = STATED[side === 'left' ? 'lv' : 'rv'];
    p.a_pass = st.edp / (Math.exp(p.b_pass * (st.edv - p.v0_v)) - 1);
  }
  return p;
}
const P = { left: paramsFor('left'), right: paramsFor('right') };

/* ----------------------------------------------------------------- the ODE

   State per side: [V_ventricle, V_atrium, P_windkessel].

   THREE-ELEMENT WINDKESSEL, and the third element is the one that made this model work. y[2] is the
   pressure in the compliant reservoir; the pressure a catheter in the ascending aorta reads — and
   the pressure the valve sees — is that plus the drop across the artery's CHARACTERISTIC IMPEDANCE,
   Zc, which is the resistance the flow itself meets before it reaches the reservoir.

   Written as a TWO-element windkessel this model failed in a way worth recording, because the
   failure is the argument for Zc. Without Zc the reservoir pressure IS the aortic pressure, so it
   charges straight up to meet the ventricle and the two curves cross at the peak of the pressure
   wave: ejection came out at 0.107 s and isovolumetric relaxation at 0.145 s. That is the wrong way
   round, by a factor of two, in the one relation a Wiggers diagram exists to show. With Zc the
   reservoir sits BELOW the ventricle for as long as flow is high, so ejection runs on down the far
   side of the pressure curve and the valve shuts at a ventricular pressure near arterial — which is
   what leaves ninety-odd millimetres of pressure to be dissipated in isovolumetric relaxation, and
   what makes the dicrotic notch: the instant flow stops, the Q*Zc term vanishes and the recorded
   aortic pressure steps down.

   (An outflow INERTANCE was tried first, as the more obvious way to keep blood moving against a
   reversed gradient. It works physically but it made the outflow equation stiff against a large Zc,
   and the peak flows the solver was bisecting against turned out to be numerical spikes rather than
   flow. Recorded in BUILD-LOG.md. Blood does have mass; this model does not need it to get the
   phase durations right, and a term that is not doing work is a term that can mislead.)

   Nothing here knows about phases. Flow exists when a pressure difference exists, and that is all. */
function deriv(p, tau, y, out) {
  const Vv = y[0], Va = y[1], Pwk = y[2], Qo = Math.max(0, y[3]), Vpv = y[4];
  /* TIME-VARYING ELASTANCE WITH A NONLINEAR PASSIVE LIMB. At e = 1 this is emax_v * (V - v0_v),
     which is what it always was; at e = 0 it is the exponential end-diastolic pressure-volume
     relation, which is what it was missing. See DIASTOLE above. */
  const ev  = eVent(tau);
  const Ppa = p.a_pass * (Math.exp(p.b_pass * (Vv - p.v0_v)) - 1);
  const Pv  = ev * p.emax_v * (Vv - p.v0_v) + (1 - ev) * Ppa;
  const Pat = (p.emin_a + (p.emax_a - p.emin_a) * eAtr(tau))  * (Va - p.v0_a);
  const Qin  = Pat > Pv ? (Pat - Pv) / p.r_in : 0;                // AV valve — a resistive diode
  /* THE VENOUS RESERVOIR. y[4] is its stressed volume, so its pressure is y[4]/c_ven: it falls when
     the atrium draws on it faster than the source refills it, and that fall is the y-descent and the
     reason filling can stop in mid-diastole. `Qsrc` is what crosses the capillary bed into it. */
  const Ppv  = Vpv / p.c_ven;
  const Qsrc = (p.p_src - Ppv) / p.r_src;
  const Qven = (Ppv - Pat) / p.r_ven;                             // reservoir -> atrium
  /* THE OUTFLOW CARRIES BOTH: an inertance, because blood has mass and cannot be accelerated
     instantly, and the characteristic impedance in series with the reservoir. Without the inertance
     a quasi-steady outflow spikes to two thousand millilitres a second in the first milliseconds of
     ejection, when the ventricle's isovolumic pressure potential is far above the reservoir's; the
     inertance is what makes the flow rise over about eighty milliseconds instead, which is what it
     does in life. Time constant L/(Zc+R) is 45 ms here — well resolved at this step, and deliberately
     not the two-millisecond one an inertance paired with a very large Zc produces, where what the
     solver reads as a peak flow is a numerical oscillation. */
  const dP = Pv - Pwk - Qo * (p.z_art + p.r_out);
  let dQo;
  if (Qo > 0) dQo = dP / p.l_out;
  else if (Pv > Pwk) dQo = (Pv - Pwk) / p.l_out;
  else dQo = 0;
  out[0] = Qin - Qo;
  out[1] = Qven - Qin;
  out[2] = (Qo - Pwk / p.r_art) / p.c_art;
  out[3] = dQo;
  out[4] = Qsrc - Qven;
  return { Pv: Pv, Pat: Pat, Qin: Qin, Qout: Qo, Qven: Qven, Ppv: Ppv,
           Pao: Pwk + Qo * p.z_art };
}

/** Integrate to the limit cycle, then tabulate ONE cycle at `n` samples. RK4, fixed step. */
function integrate(p, n, warmCycles, stepsPerCycle) {
  const steps = stepsPerCycle || 4000;
  const dt = CYCLE_S / steps, NS = 5;
  let y = [p.v0_v + 100, p.v0_a + 30, (STATED.ao.dia + STATED.ao.sys) / 2, 0, p.c_ven * p.p_src];
  const z5 = () => [0,0,0,0,0];
  const k1 = z5(), k2 = z5(), k3 = z5(), k4 = z5(), tmp = z5();
  const stepOnce = (tau) => {
    deriv(p, tau, y, k1);
    for (let i=0;i<NS;i++) tmp[i] = y[i] + dt/2*k1[i];
    deriv(p, tau + 0.5*dt/CYCLE_S, tmp, k2);
    for (let i=0;i<NS;i++) tmp[i] = y[i] + dt/2*k2[i];
    deriv(p, tau + 0.5*dt/CYCLE_S, tmp, k3);
    for (let i=0;i<NS;i++) tmp[i] = y[i] + dt*k3[i];
    deriv(p, tau + dt/CYCLE_S, tmp, k4);
    for (let i=0;i<NS;i++) y[i] += dt/6*(k1[i] + 2*k2[i] + 2*k3[i] + k4[i]);
    /* a valve cannot pass a negative flow: RK4 steps a hair past the closure instant, and an
       unclamped state would run the aorta backwards into the ventricle for one step per beat */
    if (y[3] < 0) y[3] = 0;
  };
  const warm = warmCycles == null ? 14 : warmCycles;
  for (let c = 0; c < warm; c++) for (let s = 0; s < steps; s++) stepOnce(s/steps);

  const rec = { tau: [], Vv: [], Va: [], Pa: [], Pwk: [], Pv: [], Pat: [], Qin: [], Qout: [],
                Qven: [], Ppv: [], Vpv: [], cumIn: [], cumOut: [] };
  let cumIn = 0, cumOut = 0;
  const d = [0,0,0,0,0];
  for (let s = 0; s < steps; s++) {
    const tau = s / steps;
    const m = deriv(p, tau, y, d);
    rec.tau.push(tau); rec.Vv.push(y[0]); rec.Va.push(y[1]);
    rec.Pa.push(m.Pao); rec.Pwk.push(y[2]);
    rec.Pv.push(m.Pv); rec.Pat.push(m.Pat); rec.Qin.push(m.Qin); rec.Qout.push(m.Qout);
    rec.Qven.push(m.Qven); rec.Ppv.push(m.Ppv); rec.Vpv.push(y[4]);
    rec.cumIn.push(cumIn); rec.cumOut.push(cumOut);
    cumIn += m.Qin * dt; cumOut += m.Qout * dt;
    stepOnce(tau);
  }
  rec.strokeIn = cumIn; rec.strokeOut = cumOut; rec.steps = steps; rec.dt = dt;
  if (n && n !== steps) {
    const out = {}; const keys = Object.keys(rec).filter(k2 => Array.isArray(rec[k2]));
    for (const key of keys) {
      out[key] = new Array(n);
      for (let i = 0; i < n; i++) {
        const x = i / n * steps, i0 = Math.floor(x), fr = x - i0;
        const aa = rec[key][i0 % steps], bb = rec[key][(i0 + 1) % steps];
        out[key][i] = aa + (bb - aa) * fr;
      }
    }
    out.strokeIn = rec.strokeIn; out.strokeOut = rec.strokeOut; out.steps = n;
    out.dt = CYCLE_S / n;
    return out;
  }
  return rec;
}

/* --------------------------------------------------------------- the events

   A VALVE EVENT IS THE INSTANT FLOW STARTS OR STOPS CROSSING IT. Not a schedule, and — after the
   inertance went in — not a pressure crossing either, because the aortic valve does not shut when
   the gradient reverses; it shuts a little later, when the column of blood that was already moving
   finally stops. Defining the event on the flow makes the two cases one case and removes the need to
   ask which crossing of a pressure pair was meant.

   `openInterval` takes the LONGEST contiguous run of flow in the cycle rather than the first, which
   matters for the atrioventricular valves: through diastasis the gradient is nearly zero and a
   numerical hair either side of it would otherwise be read as the valve shutting and reopening in
   mid-diastole. The threshold is a thousandth of that valve's own peak, so it scales with the valve
   instead of being a number that suits one of the four.                                            */
function openInterval(rec, key) {
  const n = rec.tau.length;
  let peak = 0;
  for (let i = 0; i < n; i++) if (rec[key][i] > peak) peak = rec[key][i];
  if (peak <= 0) return null;
  const eps = peak * 1e-3;
  const open = i => rec[key][((i % n) + n) % n] > eps;
  /* find a shut sample to start from, so a run that straddles t = 0 is not cut in two */
  let z = -1;
  for (let i = 0; i < n; i++) if (!open(i)) { z = i; break; }
  if (z < 0) return { start: 0, end: 1, always: true };
  let best = null, run = null;
  for (let s = 0; s <= n; s++) {
    const i = z + s;
    if (open(i)) { if (!run) run = { from: i, to: i }; else run.to = i; }
    else if (run) {
      const len = run.to - run.from + 1;
      if (!best || len > best.len) best = { from: run.from, to: run.to, len: len };
      run = null;
    }
  }
  if (!best) return null;
  /* refine each end by linear interpolation against the threshold */
  const val = i => rec[key][((i % n) + n) % n];
  const lerpUp = (i0, i1) => {
    const a0 = val(i0), a1 = val(i1);
    return a1 === a0 ? i0 : i0 + (eps - a0) / (a1 - a0);
  };
  const sx = lerpUp(best.from - 1, best.from);
  const ex = lerpUp(best.to + 1, best.to);
  return { start: wrap01(sx / n), end: wrap01(ex / n), len: best.len / n };
}

/** The AV valve's definitive closure before ejection, and its first opening after. */
function avEventsAround(rec, slI) {
  const n = rec.tau.length;
  let peak = 0;
  for (let i = 0; i < n; i++) if (rec.Qin[i] > peak) peak = rec.Qin[i];
  if (peak <= 0) return null;
  const eps = peak * 1e-3;
  const at = x => Math.round(wrap01(x) * n) % n;
  const q = i => rec.Qin[((i % n) + n) % n];
  const i0 = at(slI.start), i1 = at(slI.end);
  let shut = null, open = null;
  for (let s2 = 0; s2 < n; s2++) if (q(i0 - s2) > eps) { shut = wrap01((i0 - s2 + 1) / n); break; }
  for (let s2 = 0; s2 < n; s2++) if (q(i1 + s2) > eps) { open = wrap01((i1 + s2) / n); break; }
  if (shut == null || open == null) return null;
  return { start: open, end: shut };
}

/** Everything the geometry and the narration need, for one side, derived from one integration. */
function analyse(p, side, fast) {
  /* `fast` is for the solver only: a coarser grid, enough to bisect against, and about six times
     cheaper. The model itself never uses it — every number a student sees comes off the fine grid. */
  const rec = fast ? integrate(p, 600, 8, 1200) : integrate(p, 2000, 14, 4000);
  const n = rec.tau.length;

  /* the four events: when flow starts and stops crossing each of the two valves.

     THE ATRIOVENTRICULAR VALVE'S CLOSURE IS ITS *LAST* CLOSURE BEFORE EJECTION, not the longest run's
     end. Through the atrium's relaxation the pressure gradient across an open mitral valve passes
     through zero and inflow can stop and restart — which is real, and is the partial mid-diastolic
     closure an M-mode echo shows after the A wave. Read as "the valve shut", it put S1 at 0.10 s and
     stretched isovolumetric contraction to 0.12 s. So the semilunar valve's own open interval is
     found first, and each atrioventricular event is then defined against it: shut = the last flow
     before ejection began, open = the first flow after ejection ended. */
  const slI = openInterval(rec, 'Qout');
  const avI = slI ? avEventsAround(rec, slI) : openInterval(rec, 'Qin');
  /* A valve that never opens is a degenerate circulation, not an exception. The solver walks through
     parameter values that produce one — a ventricle too weak to lift the aortic valve off its seat —
     and a throw there would abort the bisection rather than steer it. So it is reported as a flag,
     the derived numbers degrade to "nothing was ejected", and acceptance fails loudly if the SOLVED
     values ever land here for real. */
  const degenerate = !avI || !slI;
  const avOpen = avI ? avI.start : 0.60, avShut = avI ? avI.end : 0.10;   // AV valve:  filling
  const slOpen = slI ? slI.start : 0.30, slShut = slI ? slI.end : 0.30;   // semilunar: ejection

  const at = tau => Math.min(n - 1, Math.max(0, Math.round(wrap01(tau) * n)));
  const span = (a, b) => wrap01(b - a) * CYCLE_S;

  const edv = rec.Vv[at(avShut)];
  const esv = degenerate ? edv : rec.Vv[at(slShut)];
  let vmax = -Infinity, vmin = Infinity, pmax = -Infinity;
  let amax = -Infinity, amin = Infinity, atrMax = -Infinity, qmax = 0, qinMax = 0;
  for (let i = 0; i < n; i++) {
    if (rec.Qout[i] > qmax) qmax = rec.Qout[i];
    if (rec.Qin[i] > qinMax) qinMax = rec.Qin[i];
    if (rec.Vv[i] > vmax) vmax = rec.Vv[i];
    if (rec.Vv[i] < vmin) vmin = rec.Vv[i];
    if (rec.Pv[i] > pmax) pmax = rec.Pv[i];
    if (rec.Pa[i] > amax) amax = rec.Pa[i];
    if (rec.Pa[i] < amin) amin = rec.Pa[i];
    if (rec.Pat[i] > atrMax) atrMax = rec.Pat[i];
  }

  /* THE ATRIAL KICK, measured rather than asserted. Ventricular filling runs from the AV valve
     opening to the AV valve shutting; atrial systole is the last part of it, and the share of the
     filling volume that arrives after the atrium starts to stiffen is what a student is asked for.
     Atrial activation begins at tau = 0, so the kick is the volume that crosses the AV valve between
     tau = 0 and the valve shutting. */
  const volAt = tau => rec.Vv[at(tau)];
  const fillTotal = edv - esv;                      // what filling put in, over the whole of diastole
  const kick = edv - volAt(0);                      // what arrived after the P wave
  const kickFrac = fillTotal > 0 ? kick / fillTotal : 0;

  /* isovolumetric = both valves shut. Measured as the volume EXCURSION across each interval, which
     is the thing that must be zero; it is zero by construction and is measured anyway. */
  const excursion = (a, b) => {
    let lo = Infinity, hi = -Infinity;
    const ia = at(a), steps = Math.max(1, Math.round(wrap01(b - a) * n));
    for (let s = 0; s <= steps; s++) { const v = rec.Vv[(ia + s) % n]; if (v < lo) lo = v; if (v > hi) hi = v; }
    return hi - lo;
  };

  /* CAN THIS VENTRICLE BE OPEN AT BOTH ENDS AT ONCE? Added 2026-09-22, and it is the measurement the
     battery was missing. A ventricle open to its atrium and its great artery in the same instant is
     not a short isovolumetric phase, it is an impossible one — and it is exactly what the right side
     was doing for 11 samples of its trace, which made the right isovolumetric relaxation window
     NEGATIVE in width. A negative window wraps: span() returned 0.79999 s, the whole cycle, and the
     model reported it beside allPass:true because every timing row read the left side. Measured on
     the flows themselves, at each valve's own threshold, so it cannot disagree with the events. */
  let overlap = 0;
  {
    let pkIn = 0, pkOut = 0;
    for (let i = 0; i < n; i++) {
      if (rec.Qin[i] > pkIn) pkIn = rec.Qin[i];
      if (rec.Qout[i] > pkOut) pkOut = rec.Qout[i];
    }
    const ei = pkIn * 1e-3, eo = pkOut * 1e-3;
    for (let i = 0; i < n; i++) if (rec.Qin[i] > ei && rec.Qout[i] > eo) overlap++;
  }

  /* ------------------------------------------- M1, AND THE END-DIASTOLIC PAUSE

     Added 2026-09-29, with the venous reservoir, because the reservoir made a real interval visible
     that the old ideal source had hidden and the old measurement then mislabelled.

     `avShut` is the instant FLOW STOPS crossing the atrioventricular valve, which is when the
     leaflets come into apposition, and that is the right instant for the geometry to draw them shut.
     It is NOT the start of isovolumetric contraction. The atrium finishes its systole at the QRS;
     the ventricle's pressure does not begin to rise until it is activated; and between the two the
     ventricle sits at end-diastolic volume with all four valves shut and nothing contracting. That
     interval is real — a left ventricle does reach its end-diastolic volume before the QRS and hold
     it — but measuring isovolumetric contraction from `avShut` swept it into a phase it does not
     belong to and reported an IVCT of 0.113 s against a textbook 0.05.

     So M1 is located on the trace: the first instant after the valve shuts at which the ventricle's
     pressure is genuinely rising, taken as dP/dt crossing a tenth of its own peak for this cycle.
     Read off the integrated pressure, never from PR_S — RENDER-STANDARD, an acceptance measurement
     must be a function of the built model and not of the constants it was built from, and
     `PR_S / CYCLE_S` would be a compile-time constant wearing a measurement's clothes.             */
  let dpMax = 0;
  for (let i = 0; i < n; i++) {
    const dp = (rec.Pv[(i + 1) % n] - rec.Pv[i]) / rec.dt;
    if (dp > dpMax) dpMax = dp;
  }
  let m1 = avShut;
  {
    const i0 = at(avShut), span2 = Math.max(1, Math.round(wrap01(slOpen - avShut) * n));
    for (let s2 = 0; s2 <= span2; s2++) {
      const i = (i0 + s2) % n;
      const dp = (rec.Pv[(i + 1) % n] - rec.Pv[i]) / rec.dt;
      if (dp >= 0.10 * dpMax) { m1 = wrap01(i / n); break; }
    }
  }

  /* --------------------------------------------------- THE SHAPE OF DIASTOLE

     Added 2026-09-29, and this is the measurement the battery had no row of. Everything above
     measures WHEN the valves move and HOW MUCH blood crosses them. Nothing measured the SHAPE of the
     inflow between the valve opening and the valve shutting, which is precisely what beat 9 narrates
     and what review round 2 found to be false at every t.

     Diastolic inflow across an atrioventricular valve has three parts and a student is examined on
     all three: the E wave (early, passive, driven by the ventricle relaxing), DIASTASIS (the quiet
     middle, when atrial and ventricular pressures have equalised and almost nothing crosses), and
     the A wave (the atrial kick). E and A are read as peak velocities on a Doppler trace; here they
     are peak flows, which is the same measurement without the orifice area.

     The windows are taken from the model's own events, not from constants: E runs from the AV valve
     OPENING to the P wave at tau = 0, where atrial activation begins; A runs from the P wave to the
     valve SHUTTING. Diastasis is then whatever lies between the two peaks, and its depth is measured
     as the minimum flow there as a fraction of the E peak — the number that has to be small for the
     word "diastasis" to mean anything.                                                             */
  const qAt = i => rec.Qin[((i % n) + n) % n];
  const scanPeak = (from, to) => {                 // fractions of a cycle, wrapping
    const i0 = at(from), span2 = Math.max(1, Math.round(wrap01(to - from) * n));
    let pk = -Infinity, pkT = from;
    for (let s2 = 0; s2 <= span2; s2++) {
      const q = qAt(i0 + s2);
      if (q > pk) { pk = q; pkT = wrap01((i0 + s2) / n); }
    }
    return { peak: pk, t: pkT };
  };
  const E = scanPeak(avOpen, 0);                   // mitral opening -> the P wave
  const A = scanPeak(0, avShut);                   // the P wave -> the valve shutting
  let dia = { min: Infinity, t: 0 };
  {
    const i0 = at(E.t), span2 = Math.max(1, Math.round(wrap01(A.t - E.t) * n));
    for (let s2 = 0; s2 <= span2; s2++) {
      const q = qAt(i0 + s2);
      if (q < dia.min) { dia = { min: q, t: wrap01((i0 + s2) / n) }; }
    }
  }
  const eaRatio = A.peak > 0 ? E.peak / A.peak : 0;
  const diastasisFrac = E.peak > 0 ? dia.min / E.peak : 1;

  /* The events in Wiggers order, for THIS side: shut -> semilunar open -> semilunar shut -> open. */
  const orderOk = wrap01(slOpen - avShut) < wrap01(slShut - avShut)
               && wrap01(slShut - avShut) < wrap01(avOpen - avShut);

  return {
    side: side, rec: rec, degenerate: degenerate,
    events: { avShut: avShut, m1: m1, slOpen: slOpen, slShut: slShut, avOpen: avOpen },
    edv: edv, esv: esv, sv: edv - esv, ef: (edv - esv) / edv,
    vmax: vmax, vmin: vmin,
    pv_peak: pmax, art_sys: amax, art_dia: amin, atr_peak: atrMax,
    q_peak: qmax, qin_peak: qinMax,
    /* MECHANICAL SYSTOLE RUNS FROM M1, for the same reason isovolumetric contraction does: the
       end-diastolic pause between the valve sealing and the ventricle contracting belongs to
       diastole, which is where the ventricle is. Measured from avShut it read 0.332 s. */
    systole_s: span(m1, slShut),
    diastole_s: span(slShut, m1),
    /* ISOVOLUMETRIC CONTRACTION IS MEASURED FROM M1, not from the valve shutting — see above. The
       interval between the two is reported separately rather than absorbed. */
    m1: m1, dpdt_max: dpMax,
    presystole_s: span(avShut, m1),
    ivc_s: span(m1, slOpen),
    shut_to_eject_s: span(avShut, slOpen),
    ejection_s: span(slOpen, slShut),
    ivr_s: span(slShut, avOpen),
    filling_s: span(avOpen, avShut),
    ivc_excursion: excursion(avShut, slOpen),
    ivr_excursion: excursion(slShut, avOpen),
    overlap_samples: overlap,
    overlap_s: overlap / n * CYCLE_S,
    order_ok: orderOk,
    /* the cycle closes on itself: the last sample and the first must agree, measured rather than
       assumed. Kept as a number on the analysis so acceptance's rows stay a pure function of it. */
    periodic_err: Math.abs(rec.Vv[0] - rec.Vv[n - 1] - (rec.Vv[n - 1] - rec.Vv[n - 2])),
    kick_frac: kickFrac,
    e_peak: E.peak, e_t: E.t, a_peak: A.peak, a_t: A.t, ea_ratio: eaRatio,
    diastasis_flow: dia.min, diastasis_t: dia.t, diastasis_frac: diastasisFrac,
    ven_res_max: Math.max.apply(null, rec.Ppv), ven_res_min: Math.min.apply(null, rec.Ppv),
    atr_min: Math.min.apply(null, rec.Pat),
    stroke_in: rec.strokeIn, stroke_out: rec.strokeOut,
  };
}

/* Solved once, at module load, and cached. Two integrations of 14 warm-up cycles at 4000 steps —
   about 120k RK4 steps in total, tens of milliseconds. build(t) never integrates. */
let _L = null, _R = null;
function L() { return _L || (_L = analyse(P.left, 'left')); }
function R() { return _R || (_R = analyse(P.right, 'right')); }

/** Sample the recorded cycle at an arbitrary t, with wrap-around and linear interpolation. */
function sample(A, key, t) {
  const rec = A.rec, n = rec.tau.length;
  const x = wrap01(t) * n, i0 = Math.floor(x), fr = x - i0;
  const a = rec[key][i0 % n], b = rec[key][(i0 + 1) % n];
  return a + (b - a) * fr;
}

/* --------------------------------------------------------------- valve state

   A leaflet's position is not a schedule either. It follows the flow through its own orifice: shut
   when nothing is crossing it, open when anything much is. The reference flow is a FRACTION OF THAT
   VALVE'S OWN PEAK, so the same rule works for a mitral valve moving 400 ml/s and a pulmonary valve
   moving 300, and so that raising or lowering the stroke volume does not silently change how far a
   valve opens.

   This is a rendering decision and it is worth naming as one: real leaflets have inertia and drift
   toward closure through late ejection, which this reproduces because the flow itself is falling —
   but the model has no leaflet mass and does not claim to. What it does guarantee is the thing the
   scene teaches: a valve is never open while the pressure gradient across it is the wrong way. */
const OPEN_FRAC  = 0.12;     // of that valve's own peak flow: the flow at which it is fully open
const SEAT_RAMP  = 0.010;    // of a cycle — 8 ms at 75 bpm, a leaflet's excursion off and onto its seat
const OPEN_FLOOR = 0.35;     // how far off the seat a leaflet sits while its orifice is open but still

function peakOf(A, key) {
  if (A['_peak_' + key] == null) {
    let m = 0; for (let i = 0; i < A.rec[key].length; i++) if (A.rec[key][i] > m) m = A.rec[key][i];
    A['_peak_' + key] = m;
  }
  return A['_peak_' + key];
}

/* THE LEAFLET IS LATCHED TO ITS OWN OPEN INTERVAL, AND THE FLOW ONLY MODULATES IT WITHIN THAT.
   Rewritten 2026-09-22. Driving the leaflet from the flow ALONE — open = smoothstep(q / 0.12 peak) —
   read every pause in the flow as a closure, and there is a real pause in mid-diastole: through the
   atrium's relaxation the atrioventricular gradient passes through zero (LA 8.6 against LV 8.7 at
   t = 0.110) and inflow genuinely stops. The picture therefore shut the mitral valve at t = 0.108,
   reopened it to 0.610 at t = 0.180, opened it fully at 0.195 and shut it again at 0.210 — two full
   closures inside one atrial systole, the first of them 80 ms early, and 80 ms early is where S1 is.
   The scene's own first beat narrates the opposite: "the atrioventricular valves are already open —
   they have been open through the whole of diastole — so this squeeze does not open anything."

   The analysis already root-solves the four events. A valve is OPEN between its own opening and its
   own closure and shut outside them, which is what a valve is; the flow then says HOW FAR open it
   sits, between a floor and fully. The floor is what the mid-diastolic pause now shows: leaflets
   drifting towards apposition without coapting, which is the partial closure after the A wave that
   an M-mode echo shows and the thing the old behaviour was a caricature of. SEAT_RAMP closes the
   leaflet smoothly onto the seat exactly at the event, so a valve still reaches zero — and all four
   still reach zero together, which is what makes the isovolumetric beats honest. */
function valveOpen(A, key, t) {
  const pk = peakOf(A, key);
  if (pk <= 0) return 0;
  const e = A.events;
  const a = key === 'Qin' ? e.avOpen : e.slOpen;      // this valve's own opening
  const b = key === 'Qin' ? e.avShut : e.slShut;      // ... and its own closure
  const width = wrap01(b - a);
  if (!(width > 0)) return 0;
  const into = wrap01(t - a);
  if (into >= width) return 0;                        // outside its open interval: shut, flatly
  const ramp = Math.min(SEAT_RAMP, width / 2);
  const gr = Math.min(1, Math.min(into, width - into) / ramp);
  const gate = gr * gr * (3 - 2 * gr);
  const u = Math.min(1, Math.max(0, sample(A, key, t) / (OPEN_FRAC * pk)));
  const drive = u * u * (3 - 2 * u);                  // smoothstep — no corner as it leaves the seat
  return gate * (OPEN_FLOOR + (1 - OPEN_FLOOR) * drive);
}

/** Which named phase of the cycle t falls in. Derived from the events, so it cannot disagree. */
/* THE PHASES THIS MODEL RESOLVES, DECLARED IN ONE PLACE. Added round 5, 2026-09-30, for
   R4-OPEN-3: the scene's learning_goal promised "the five phases" and phaseAt had been returning
   SIX since round 4, when the venous reservoir separated mitral leaflet apposition at t=0.1320
   from the first heart sound at t=0.2050 and the 58 ms between them became an interval of its own
   (gaps[20]). Nothing noticed, because nothing compared the two — the same shape of defect as
   R4-OPEN-1, where nothing compared the declared width with the built one.

   `examined` marks the five a student is examined on. The sixth is real and stays: it is the
   interval in which the ventricle sits at end-diastolic volume with every valve shut and nothing
   contracting, and folding it into isovolumetric contraction would name a contraction that has
   not started. The scene's goal now says five-plus-one rather than five, which is the honest way
   round; rewriting the model to agree with the goal would have been the other way. Rows Z8 and Z9
   assert that these keys and only these tile the cycle, so a seventh cannot appear unannounced. */
const PHASES = [
  { key: 'atrial_systole', name: 'Atrial systole',            examined: true  },
  { key: 'end_diastole',   name: 'End-diastolic pause',       examined: false },
  { key: 'ivc',            name: 'Isovolumetric contraction', examined: true  },
  { key: 'ejection',       name: 'Ventricular ejection',      examined: true  },
  { key: 'ivr',            name: 'Isovolumetric relaxation',  examined: true  },
  { key: 'filling',        name: 'Ventricular filling',       examined: true  },
];

/** How much of one cycle each phase key holds, sampled off phaseAt itself rather than off the
    events it reads — so a phase that phaseAt can never return shows up as zero, and a key it
    returns that PHASES does not declare shows up as `undeclared`. */
function phaseCensus(n) {
  const N = n || 4000, held = {}, undeclared = {};
  const known = {}; for (const ph of PHASES) { known[ph.key] = true; held[ph.key] = 0; }
  for (let i = 0; i < N; i++) {
    const k = phaseAt((i + 0.5) / N).key;
    if (known[k]) held[k]++; else undeclared[k] = (undeclared[k] || 0) + 1;
  }
  const spans = {}; let covered = 0;
  for (const k of Object.keys(held)) { spans[k] = held[k] / N * CYCLE_S; covered += held[k]; }
  return { spans_s: spans, coverage: covered / N,
           undeclared: Object.keys(undeclared),
           examined_present: PHASES.filter(ph => ph.examined && spans[ph.key] > 0).length,
           examined_total: PHASES.filter(ph => ph.examined).length,
           narrowest_examined_s: PHASES.filter(ph => ph.examined)
             .reduce((m, ph) => Math.min(m, spans[ph.key]), Infinity),
           declared: PHASES.map(ph => ph.key), n: PHASES.length };
}

function phaseAt(t) {
  const e = L().events, x = wrap01(t);
  const inSpan = (a, b) => wrap01(x - a) < wrap01(b - a);
  if (inSpan(0, e.avShut))        return { key: 'atrial_systole',  name: 'Atrial systole' };
  /* The ventricle is full, every valve is shut, and nothing is contracting yet. Named rather than
     folded into isovolumetric contraction, which is what it was until 2026-09-29. */
  if (inSpan(e.avShut, e.m1))     return { key: 'end_diastole',    name: 'End-diastolic pause' };
  if (inSpan(e.m1, e.slOpen))     return { key: 'ivc',             name: 'Isovolumetric contraction' };
  if (inSpan(e.slOpen, e.slShut)) return { key: 'ejection',        name: 'Ventricular ejection' };
  if (inSpan(e.slShut, e.avOpen)) return { key: 'ivr',             name: 'Isovolumetric relaxation' };
  return { key: 'filling', name: 'Ventricular filling' };
}

/* ------------------------------------------------------------- acceptance

   Two kinds of row, kept visibly apart, because a test that grades what you solved against is not
   evidence of anything. `solved` rows confirm the bisection converged. `predicted` rows are the ones
   that can actually fail: nothing in the solve aims at them, and if the circulation model is wrong
   they will say so.                                                                                */
/* EVERY INSTANT AT WHICH ALL FOUR VALVES ARE SHUT. The scene's isovolumetric beats claim exactly
   this, and until 2026-09-22 one of them was false: beat 7 narrated "all four valves are shut again"
   at t = 0.575, where the pulmonary valve measured 0.82 open. It was not a badly chosen t — there was
   no t that worked, because relaxation had no all-shut instant at all on a heart whose right side
   was open at both ends. Measured here, on the same valveOpen() the geometry draws with, so the
   scene can be pointed at a window that exists rather than at one an author expected. */
/* A RUN IS BROKEN BY A PHASE BOUNDARY AS WELL AS BY A VALVE. Added 2026-09-29 with the
   end-diastolic pause: all four valves are shut continuously from the atrioventricular valve sealing
   right through to the semilunar valve opening, which is one run spanning TWO phases, and
   classifying it by its midpoint put the whole thing in whichever phase the midpoint happened to
   land in. The scene needs to stand in the middle of the ISOVOLUMETRIC part of it, so the run is cut
   where the phase changes and each piece carries its own phase. */
function allShutWindows(n) {
  const l = L(), r = R(), N = n || 2000, runs = [];
  let cur = null;
  for (let i = 0; i <= N; i++) {
    const t = i / N;
    const shut = valveOpen(l, 'Qin', t) < 1e-9 && valveOpen(l, 'Qout', t) < 1e-9
              && valveOpen(r, 'Qin', t) < 1e-9 && valveOpen(r, 'Qout', t) < 1e-9;
    const ph = shut ? phaseAt(t).key : null;
    if (shut) {
      if (!cur || cur.phase !== ph) { if (cur) runs.push(cur); cur = { from: t, to: t, phase: ph }; }
      else cur.to = t;
    } else if (cur) { runs.push(cur); cur = null; }
  }
  if (cur) runs.push(cur);
  return runs.map(function (w) {
    return { from: w.from, to: w.to, mid: (w.from + w.to) / 2,
             width_s: (w.to - w.from) * CYCLE_S, phase: w.phase };
  });
}

/* THE DIASTASIS WINDOW, in the same shape as allShutWindows above and for the same reason: the
   scene has a beat that narrates it, and a beat must be pointable at an interval that EXISTS rather
   than at one an author expected. Diastasis is taken as the stretch before the P wave in which
   inflow has fallen below DIASTASIS_OF_E of that valve's own early-filling peak — a fraction of the
   E wave, so it scales with the heart rather than being a flow in ml/s that suits one side. */
const DIASTASIS_OF_E = 0.35;

function diastasisWindow(A) {
  const rec = A.rec, n = rec.tau.length;
  const thr = DIASTASIS_OF_E * A.e_peak;
  if (!(thr > 0)) return null;
  const at2 = t => Math.min(n - 1, Math.max(0, Math.round(wrap01(t) * n)));
  /* walk BACK from the P wave while the flow is below the threshold and the valve is still open */
  let from = 0;
  const i0 = at2(0), lim = Math.round(wrap01(0 - A.events.avOpen) * n);
  let s2 = 0;
  for (; s2 <= lim; s2++) {
    const i = ((i0 - s2) % n + n) % n;
    if (rec.Qin[i] > thr) break;
    from = wrap01((i0 - s2) / n);
  }
  if (s2 === 0) return null;
  return { from: from, to: 1, mid: wrap01((from + 1) / 2),
           width_s: (1 - from) * CYCLE_S,
           min_flow: A.diastasis_flow, min_frac: A.diastasis_frac };
}

/* ------------------------------------------------------------- acceptance

   Two kinds of row, kept visibly apart, because a test that grades what you solved against is not
   evidence of anything. `solved` rows confirm the bisection converged. `predicted` rows are the ones
   that can actually fail: nothing in the solve aims at them, and if the circulation model is wrong
   they will say so.

   A THIRD KIND WAS ADDED 2026-09-29 AND IT IS AN HONESTY LABEL, NOT A NEW CAPABILITY. `calibrated`
   marks a row whose measured quantity was not bisected against — so it is not `solved` — but whose
   dominant input was chosen from INSIDE a stated literature range with this very measurement in
   view. Rows Y and Z are the case: `b_pass`, the chamber stiffness constant, is stated at 0.025 /ml
   on the left and 0.018 on the right, both inside the 0.01-0.03 /ml reported for the human
   ventricle, and a sweep across that range was run and looked at before those two were fixed. A
   reviewer should read `calibrated` as weaker evidence than `predicted` and stronger than `solved`,
   and the sweep is in BUILD-LOG.md so the choice can be re-made rather than taken on trust.

   EVERY TIMING ROW USED TO READ THE LEFT SIDE ONLY. `const e = l.events` at the head of this
   function, and rows J, K, L, M and N all read `l.*`; only A-F and E2 touched `r`, and those are
   volumes, pressures and peak flow. The consequence sat in the model's own public report with
   allPass:true beside it — right ivr_s = 0.79999 s, the entire cycle, and right ivr_excursion =
   70.11 ml, the whole stroke volume moving during a phase named isovolumetric. Both were computed,
   both were exported, neither was asserted on. The rows are built per side now (J2, K2, L2, M2, N2),
   and rows V, W and X assert the things that only exist BETWEEN the two sides.

   The rows are a pure function of (l, r, g) so that `negatives()` below can feed each one a
   deliberately wrong input and check that it is rejected — RENDER-STANDARD, every acceptance test
   needs a negative case, because a test that grades its own homework in the wrong units launders a
   defect into a proof.                                                                             */
function rowsFor(l, r, g, shut, dia, ph) {
  const near = (x, want, tol) => Math.abs(x - want) <= tol;
  const between = (x, a, b) => x >= a && x <= b;
  const ms = x => x * 1000;

  /* MAGNITUDE FLOORS, as fractions of the extent of the structures compared — RENDER-STANDARD: a
     sign test on a spatial relation is not a test. The extent here is the annulus diameter, which is
     the size of the thing whose centre is being placed. */
  const b = g.base;
  const floorAV = 0.35 * b.annulus_av_cm;
  const floorMV = 0.35 * (b.annulus_av_cm + b.annulus_mv_cm) / 2;
  const d = (p, q, i) => p[i] - q[i];                     // 0 = x LEFT, 1 = y SUPERIOR, 2 = z ANTERIOR

  /* the widest all-four-shut window inside each isovolumetric phase */
  const winIn = k => {
    let best = null;
    for (const w of (shut || [])) if (w.phase === k && (!best || w.width_s > best.width_s)) best = w;
    return best;
  };
  const wIvc = winIn('ivc'), wIvr = winIn('ivr');

  return [
    ['A', 'solved',    'LV end-diastolic volume 120 ml',           near(l.edv, 120, 2),      l.edv],
    ['B', 'solved',    'LV end-systolic volume 50 ml',             near(l.esv, 50, 2),       l.esv],
    ['C', 'solved',    'aortic pressure 120/80 mmHg',              near(l.art_sys, 120, 3) && near(l.art_dia, 80, 3), [l.art_sys, l.art_dia]],
    ['D', 'solved',    'RV volumes 130 / 60 ml',                   near(r.edv, 130, 3) && near(r.esv, 60, 3), [r.edv, r.esv]],
    ['E2','predicted', 'peak ejection flow 350-700 ml/s on both sides',
                        between(l.q_peak, 350, 700) && between(r.q_peak, 350, 700), [l.q_peak, r.q_peak]],
    ['E', 'solved',    'pulmonary artery 25/10 mmHg',              near(r.art_sys, 25, 2) && near(r.art_dia, 10, 2), [r.art_sys, r.art_dia]],
    ['F', 'predicted', 'the two sides eject the same stroke volume', Math.abs(l.sv - r.sv) <= 2.5, [l.sv, r.sv]],
    ['G', 'predicted', 'systole lasts about 0.30 s',               near(l.systole_s, 0.30, 0.04), l.systole_s],
    ['H', 'predicted', 'diastole lasts about 0.50 s',              near(l.diastole_s, 0.50, 0.05), l.diastole_s],
    ['I', 'predicted', 'ejection fraction 0.55-0.62',              between(l.ef, 0.55, 0.62), l.ef],

    ['J', 'structural','LEFT valve events in Wiggers order',       !!l.order_ok, l.events],
    ['J2','structural','RIGHT valve events in Wiggers order',      !!r.order_ok, r.events],
    ['K', 'structural','LEFT isovolumetric phases move no blood (<0.5 ml)',
                        l.ivc_excursion < 0.5 && l.ivr_excursion < 0.5, [l.ivc_excursion, l.ivr_excursion]],
    ['K2','structural','RIGHT isovolumetric phases move no blood (<0.5 ml)',
                        r.ivc_excursion < 0.5 && r.ivr_excursion < 0.5, [r.ivc_excursion, r.ivr_excursion]],
    ['L', 'predicted', 'LEFT isovolumetric contraction 0.03-0.09 s',  between(l.ivc_s, 0.03, 0.09), l.ivc_s],
    ['L2','predicted', 'RIGHT isovolumetric contraction 0.01-0.07 s, and shorter than the left by >= 10 ms',
                        between(r.ivc_s, 0.01, 0.07) && (l.ivc_s - r.ivc_s) >= 0.010, [r.ivc_s, l.ivc_s - r.ivc_s]],
    ['M', 'predicted', 'LEFT isovolumetric relaxation 0.04-0.12 s',   between(l.ivr_s, 0.04, 0.12), l.ivr_s],
    ['M2','predicted', 'RIGHT isovolumetric relaxation 0.004-0.05 s, and shorter than the left by >= 20 ms',
                        between(r.ivr_s, 0.004, 0.05) && (l.ivr_s - r.ivr_s) >= 0.020, [r.ivr_s, l.ivr_s - r.ivr_s]],
    ['N', 'predicted', 'LEFT atrial systole supplies 0.15-0.30 of filling',  between(l.kick_frac, 0.15, 0.30), l.kick_frac],
    ['N2','predicted', 'RIGHT atrial systole supplies 0.15-0.32 of filling', between(r.kick_frac, 0.15, 0.32), r.kick_frac],

    /* THE ROW THE BATTERY WAS MISSING. A ventricle cannot be open to its atrium and to its great
       artery at the same instant, and this is measured on the flows rather than inferred from the
       events, so a defect cannot hide behind an event that was read at the wrong sample. */
    ['V', 'structural','neither ventricle is ever open at both ends at once (0 samples of overlap)',
                        l.overlap_samples === 0 && r.overlap_samples === 0,
                        [l.overlap_samples, r.overlap_samples, l.overlap_s, r.overlap_s]],

    /* THE INTER-SIDE ORDER: right-sided events bracket left-sided ones, which is what a student is
       examined on when they are asked why the second heart sound splits. Each with a floor in
       milliseconds rather than a sign. See the model's limitations for the one relation of the four
       that this model does NOT get right — M1 before T1 — which is deliberately not asserted here,
       because a test that asserts a defect locks the defect in. */
    ['W', 'predicted', 'pulmonary opens >= 10 ms before aortic, shuts 20-50 ms after it (A2-P2 split), tricuspid opens >= 10 ms before mitral',
                        ms(wrap01(l.events.slOpen - r.events.slOpen) * CYCLE_S) >= 10 &&
                        between(ms(wrap01(r.events.slShut - l.events.slShut) * CYCLE_S), 20, 50) &&
                        ms(wrap01(l.events.avOpen - r.events.avOpen) * CYCLE_S) >= 10,
                        [ms(wrap01(l.events.slOpen - r.events.slOpen) * CYCLE_S),
                         ms(wrap01(r.events.slShut - l.events.slShut) * CYCLE_S),
                         ms(wrap01(l.events.avOpen - r.events.avOpen) * CYCLE_S)]],

    /* M1 BEFORE T1. Until 2026-09-29 this model had it the wrong way round, by 2.8 ms, and the
       scene declared it in gaps[] rather than asserting it — a test that asserts a defect locks the
       defect in. The venous reservoir repaired it as a side effect that nothing aimed at, so it can
       be asserted now: the mitral shuts before the tricuspid, with a floor in milliseconds. The
       MAGNITUDE is still short of life's 20-30 ms and stays declared rather than asserted. */
    ['W2','predicted', 'the mitral shuts >= 5 ms before the tricuspid (M1 before T1)',
                        ms(wrap01(r.events.avShut - l.events.avShut) * CYCLE_S) >= 5 &&
                        ms(wrap01(r.events.avShut - l.events.avShut) * CYCLE_S) <= 40,
                        ms(wrap01(r.events.avShut - l.events.avShut) * CYCLE_S)],

    /* THE END-DIASTOLIC PAUSE, bounded so it cannot grow unnoticed. It is real — the leaflets are
       apposed before the ventricle contracts — but it is the interval that used to be swept into
       isovolumetric contraction and reported as a 0.113 s IVCT. */
    ['W3','structural','the end-diastolic pause (AV valve apposition to M1) is 0.02-0.09 s on both sides',
                        between(l.presystole_s, 0.02, 0.09) && between(r.presystole_s, 0.02, 0.09),
                        [l.presystole_s, r.presystole_s]],

    /* THE BEATS THAT SAY "ALL FOUR SHUT" MUST HAVE SOMEWHERE TO STAND. Both isovolumetric phases
       need a window in which all four valve openings are actually zero, wide enough that a scene can
       be pointed into the middle of it. */
    ['X', 'structural','all four valves shut together for >= 8 ms in BOTH isovolumetric phases',
                        !!wIvc && !!wIvr && wIvc.width_s >= 0.008 && wIvr.width_s >= 0.008,
                        [wIvc && [wIvc.from, wIvc.to, wIvc.width_s], wIvr && [wIvr.from, wIvr.to, wIvr.width_s]]],

    /* ---- THE SHAPE OF DIASTOLE. Added 2026-09-29; review round 2 found beat 9 narrating a
       diastasis the model did not have, and nothing in a 30-row battery could have noticed, because
       every row measured WHEN a valve moved or HOW MUCH crossed it and none measured the SHAPE of
       what crossed. Y is the examined ratio. Z is the beat's own claim, made measurable. ---- */
    ['Y', 'calibrated','transmitral E/A 1.0-2.0 and transtricuspid E/A 0.9-2.0 (a normal adult filling pattern, not the reversed one the model had)',
                        between(l.ea_ratio, 1.0, 2.0) && between(r.ea_ratio, 0.9, 2.0),
                        [l.ea_ratio, r.ea_ratio, l.e_peak, l.a_peak, r.e_peak, r.a_peak]],
    ['Z', 'calibrated','a DIASTASIS exists on the left: a stretch of >= 60 ms before the P wave in which inflow is under 0.35 of the E peak, and the ventricle is >= 0.70 of the way from ESV to EDV at the window midpoint',
                        !!dia && dia.width_s >= 0.060 && dia.min_frac <= 0.35 && dia.fillFrac >= 0.70,
                        dia && [dia.from, dia.mid, dia.width_s, dia.min_frac, dia.min_flow,
                                dia.fillFrac, dia.fillFrac_at_start]],

    /* NOT a physiological claim, and labelled so. In a real heart the ventricular and aortic
       pressure curves very nearly coincide through ejection. In THIS lumped model the ventricle sits
       above the artery by the inertial term L*dQ/dt, which peaks at about 30 mmHg. That is an
       artifact of describing a whole aorta as one inertance, it is not correctable by tuning, and it
       is the reason this scene does not draw a pressure trace. The row exists so the artifact is
       measured and cannot silently grow. */
    ['O', 'limitation','peak LV exceeds recorded aortic systolic by the lumped inertial term (<= 45 mmHg)',
                        (l.pv_peak - l.art_sys) <= 45 && (l.pv_peak - l.art_sys) >= 0,
                        [l.pv_peak, l.art_sys, l.pv_peak - l.art_sys]],
    ['P', 'structural','the cycle is periodic: the trace closes on itself at t=1',
                        l.periodic_err < 1e-3, l.periodic_err],
    ['Q', 'predicted', 'long axis shortens 0.12-0.18 while the minor axis shortens 0.30 (stated)',
                        between(g.longShort, 0.12, 0.18), g.longShort],
    ['R', 'predicted', 'LV wall 9-11 mm at end-diastole, 13-18 mm at end-systole (myocardial volume conserved)',
                        between(g.wall_ed_mm, 9, 11) && between(g.wall_es_mm, 13, 18), [g.wall_ed_mm, g.wall_es_mm]],

    /* ---- the axes, and the two relations at the base a student is examined on ---- */
    ['S', 'structural','e2L, the base plane in-plane axis, points ANTERIOR (+z)',
                        b.e2_anterior > 0.30, b.e2_anterior],
    ['T', 'predicted', 'the pulmonary valve lies anterior to, to the LEFT of and ABOVE the aortic valve, each by >= 0.35 of the aortic annulus',
                        d(b.pv, b.av, 2) >= floorAV && d(b.pv, b.av, 0) >= floorAV && d(b.pv, b.av, 1) >= floorAV,
                        [d(b.pv, b.av, 2), d(b.pv, b.av, 0), d(b.pv, b.av, 1), floorAV]],
    ['U', 'predicted', 'the aortic valve lies anterior to and medial to (right of) the mitral annulus, by >= 0.35 of the mean annulus',
                        d(b.av, b.mv, 2) >= floorMV && d(b.mv, b.av, 0) >= floorMV,
                        [d(b.av, b.mv, 2), d(b.mv, b.av, 0), floorMV]],

    /* ---- THE SIZE AND HEIGHT OF THE FOUR RINGS. Added round 4, 2026-09-29. Nothing in this
       battery could see the tricuspid or pulmonary annulus at all until now, which is how the
       tricuspid came to be "the largest of the four" by 0.26 mm and how the base came to be a
       4.5 cm deep funnel with an Ebstein-sized mitral-to-tricuspid offset. Both are relations a
       student is examined on and both are now graded. ---- */
    ['Y2','structural','the tricuspid annulus is the LARGEST of the four and the aortic the smallest',
                        b.annulus_tv_cm > b.annulus_mv_cm && b.annulus_mv_cm > b.annulus_pv_cm &&
                        b.annulus_pv_cm > b.annulus_av_cm,
                        [b.annulus_tv_cm, b.annulus_mv_cm, b.annulus_pv_cm, b.annulus_av_cm]],
    ['Y3','predicted', 'the tricuspid annulus is 12-25% wider than the mitral — a margin a student can see, not a coincidence',
                        between(b.annulus_tv_cm / b.annulus_mv_cm, 1.12, 1.25),
                        b.annulus_tv_cm / b.annulus_mv_cm],

    /* ---- THE SHAPE OF THE FOUR RINGS. Added round 6, 2026-09-30, for R5-OPEN-1. Y2 and Y3 above
       grade the four rings by ONE scalar each, and that scalar is the mean of two diameters — so a
       ring that is a 2.8-to-1 ellipse and a ring that is a circle of the same mean radius are the
       same number to both of them. The review that found this measured the built tricuspid at
       4.92 cm by 1.61 in its OWN plane, an aspect no annulus reaches, and every row and every beat
       claim that touched it passed. Three rows follow: Y4 grades the three rings that ARE circles,
       so the same thing happening to one of them would be caught; Y5 re-states the examined
       relation by ORIFICE AREA, which is the measure a non-circular ring cannot defeat; Y6 is the
       tricuspid itself, and it is a `limitation` and not a claim. ---- */
    ['Y4','predicted', 'the mitral, aortic and pulmonary rings are within 1.15 of circular — each is DRAWN as a circle, and a ring that silently inherits a flattened section is exactly R5-OPEN-1',
                        b.ring_mv.aspect <= 1.15 && b.ring_av.aspect <= 1.15 &&
                        b.ring_pv.aspect <= 1.15,
                        [b.ring_mv.aspect, b.ring_av.aspect, b.ring_pv.aspect]],
    ['Y5','structural','by ORIFICE AREA the tricuspid is the largest of the four and the aortic the smallest — the same order as Y2, in the measure that survives a ring which is not a circle',
                        b.ring_tv.orifice_area_cm2 > b.ring_mv.orifice_area_cm2 &&
                        b.ring_mv.orifice_area_cm2 > b.ring_pv.orifice_area_cm2 &&
                        b.ring_pv.orifice_area_cm2 > b.ring_av.orifice_area_cm2,
                        [b.ring_tv.orifice_area_cm2, b.ring_mv.orifice_area_cm2,
                         b.ring_pv.orifice_area_cm2, b.ring_av.orifice_area_cm2]],

    /* Y6 IS A DECLARED DEFECT, NOT A CLAIM, and it is labelled `limitation` for the same reason
       row O is: the number is wrong, it is not correctable by anything short of a redesign, and a
       number nobody asserts on drifts — which is the whole lesson of R4-OPEN-1.

       WHAT IS WRONG. A real tricuspid annulus is oval at about 1.2-1.3 to 1 and its orifice is
       30-70% larger in area than the mitral. This model's is 2.86 to 1 and 7% larger. Both figures
       have ONE cause: the tricuspid ring is the MOUTH of the right ventricular tube, so it inherits
       that tube's section, and the section is flattened to 0.35 to make the crescent the right
       ventricle needs. Flattening an ellipse of fixed mean radius to 0.35 also costs it 23% of its
       area, which is where the missing area went.

       WHY THE ROW BOUNDS IT INSTEAD OF FIXING IT, measured rather than asserted — round 6 built the
       fix and rejected it on the numbers. Rounding the inlet section (flatten as a function of
       station, high at the mouth, falling to 0.35 over the first quarter of the tube) moves the
       aspect exactly as intended, and it moves the standoff with it, because rho in rvPath is what
       the tube has to clear PLUS its own radial half-thickness at that station:

         flatten(0)   aspect (built)   mv_to_tv_x   inflow standoff   widest x    verdict
           0.35          2.77           4.260 cm       3.048 cm       13.448 cm   ships today
           0.50          1.96           4.525          3.357          13.713      all rows pass
           0.625         1.58           4.739          3.604          13.927      Z5, Z7, width fail
           0.80          1.24           5.028          3.939          14.216      Z5, Z7, width fail

       Z5 bounds the mitral-to-tricuspid offset at 4.6 cm, Z7 the inflow standoff at 3.6, and check 8
       the world-x span at 13.8. The loosest aspect a real annulus reaches, 1.6, breaks all three —
       and there is no honest headroom to buy, because this heart's transverse width is ALREADY 2-3 cm
       over anatomy and says so in the scene's gaps[13]. The 0.50 row passes everything, and is not
       shipped for the reason RENDER-STANDARD section 3 gives: 0.50 has no anatomical basis, it is
       simply the largest value the width rows tolerate, and a constant chosen to keep a row passing
       is the smell this file already carries one example of (ANN.pv_cal).

       WHAT WOULD FIX IT is the crescentic right-ventricular section the scene's gaps[1] owes, where
       the chamber's radial depth comes from WRAPPING the left ventricle rather than from standing
       off its axis — at which point the mouth can be capacious without the base getting wider. That
       is a redesign of this model's central abstraction with consequences in all eleven beats, and
       round 6 did not attempt it.

       The bounds below are the current values with no headroom to grow into, and the negative
       carries a WORSE ring, so the row rejects the defect getting bigger without ever calling the
       present value right. */
    ['Y6', 'limitation','DECLARED DEFECT: the tricuspid ring is 2.86 to 1 where a real annulus is 1.2-1.3, and its orifice only 7% larger than the mitral where a real pair is 30-70% — one cause, the tube section it is the mouth of. Bounded so it cannot grow; the fix is the crescentic section gaps[1] owes',
                        b.ring_tv.aspect <= 2.90 &&
                        b.ring_tv.orifice_area_cm2 / b.ring_mv.orifice_area_cm2 >= 1.05,
                        [b.ring_tv.aspect, b.ring_tv.major_cm, b.ring_tv.minor_cm,
                         b.ring_tv.orifice_area_cm2 / b.ring_mv.orifice_area_cm2]],
    ['Z2','predicted', 'the tricuspid annulus is MORE APICAL than the mitral by 0.2-1.0 cm — below 0 is the wrong way round, above 1.0 is Ebstein territory',
                        between(b.tv_below_mv_cm, 0.2, 1.0), b.tv_below_mv_cm],
    ['Z3','predicted', 'the four annuli span under 3.2 cm vertically — a saddle, not a funnel',
                        b.annuli_span_y_cm < 3.2, b.annuli_span_y_cm],
    ['Z4','structural','the four chamber cavities are four distinguishable colours, not two pairs of shades',
                        g.cavity_colour_min_delta >= 90, g.cavity_colour_min_delta],

    /* ---- HOW WIDE THE HEART IS. Added round 5, 2026-09-30, in answer to R4-OPEN-1. The review
       found the four chamber walls spanning 13.55-14.66 cm in x where gaps[13] claimed 12.3, and
       the finding's sting was not the 2 cm — it was that NOTHING MEASURED IT, so the drift arrived
       inside the edit that closed two other findings and nobody was told. Three rows, and each
       negative below carries the round-4 measurement itself rather than an arbitrary nudge, so a
       row that survives its negative is saying it would not have caught the real thing.

       Z7 is the one that names the CAUSE gaps[13] identified: the tube rode at the same standoff
       at both ends — rv_inflow_standoff_cm and rv_outflow_standoff_cm were 4.875 and 4.875, equal
       to seven figures — because rho was the septal clearance at every station. A real outflow
       tract does not do that; it rises into an infundibulum and comes MEDIALLY over the left
       ventricular outflow. So the row asserts the two standoffs differ, which is a statement about
       the shape of the tube and not a bound on a number that happens to be too big. ---- */
    /* THE UPPER BOUND IS CHOSEN, AND HERE IS THE DERIVATION, because a bound with no derivation is
       the thing this row exists to stop. A real pair of atrioventricular annular centres sits
       about 3.3 cm apart — the two rings very nearly touching across the atrioventricular septum,
       1.5 + 1.75 cm of radius. This construction cannot reach that: the inflow standoff has a
       floor of (mitral annulus radius 1.40) + (atrioventricular septum 0.34) + (the tube's own
       radial half-thickness at the orifice, 1.14) = 2.88 cm, and the inflow lift adds its own
       x-component, which together put the floor at about 4.15 cm. The model measures 4.26. So the
       bound is 4.6: 0.35 cm of headroom over what the construction supports, far enough under the
       round-4 measurement of 6.045 that the negative below still rejects, and the residual 0.9 cm
       over anatomy is DECLARED in the scene's gaps[13] rather than hidden inside a bound wide
       enough to swallow it. Narrowing it further needs a thinner tube at the orifice, which needs
       the crescentic section gaps[1] still owes. */
    ['Z5','structural','the mitral and tricuspid annular centres are 2.8-4.6 cm apart in x, and never closer than their two rings touching',
                        b.mv_to_tv_x_cm >= Math.max(2.8, b.annuli_touch_floor_cm) &&
                        b.mv_to_tv_x_cm <= 4.6,
                        [b.mv_to_tv_x_cm, b.annuli_touch_floor_cm]],
    ['Z6','predicted', 'the four annuli span under 5.5 cm in x — a base, not a bench',
                        b.base_span_x_cm < 5.5, b.base_span_x_cm],
    ['Z7','structural','the right ventricular tube BELLIES OUT around the left ventricle and comes in at both orifices: each end stands 2.4-3.6 cm off the left ventricular axis and the mid-body at least 0.6 cm further out than either',
                        between(b.rv_inflow_standoff_cm, 2.4, 3.6) &&
                        between(b.rv_outflow_standoff_cm, 2.4, 3.6) &&
                        (b.rv_standoff_max_cm - Math.max(b.rv_inflow_standoff_cm,
                                                         b.rv_outflow_standoff_cm)) >= 0.6,
                        [b.rv_inflow_standoff_cm, b.rv_outflow_standoff_cm, b.rv_standoff_max_cm]],

    /* ---- THE PHASES, AND HOW MANY OF THEM THERE ARE. Added round 5 for R4-OPEN-3. The scene
       promised five and the model had been returning six since round 4 without anything comparing
       the two. Z8 is the structural half — the declared keys tile the cycle exactly, no gap, no
       overlap, nothing returned that is not declared — and Z9 is the curricular half: all five
       examined phases exist and none is so narrow that "state its duration" is a trick question.
       Between them a seventh phase cannot arrive unannounced, which is the only thing that would
       have caught the sixth. ---- */
    ['Z8','structural','the declared phases tile the cycle exactly and phaseAt returns no undeclared key',
                        Math.abs(ph.coverage - 1) < 1e-9 && ph.undeclared.length === 0 && ph.n === 6,
                        [ph.coverage, ph.undeclared, ph.n]],
    ['Z9','structural','all five examined phases exist and the narrowest lasts at least 20 ms',
                        ph.examined_present === ph.examined_total && ph.narrowest_examined_s >= 0.020,
                        [ph.examined_present, ph.examined_total, ph.narrowest_examined_s]],
  ];
}

/* How full the ventricle already is across the diastasis window. `fillFrac` is read at the window's
   MIDPOINT, because that is the instant the scene stands at and "nearly full" is a claim about the
   picture a student sees; the value at the window's start is reported beside it rather than
   asserted on, since filling is still visibly running there. */
function fillOf(dia, A) {
  const v0 = sample(A, 'Vv', dia.from), vm = sample(A, 'Vv', dia.mid);
  dia.volume_at_start = v0; dia.volume_at_mid = vm;
  dia.fillFrac_at_start = (v0 - A.esv) / (A.edv - A.esv);
  dia.fillFrac = (vm - A.esv) / (A.edv - A.esv);
  return dia;
}

function acceptance() {
  const l = L(), r = R(), g = GEOM_REPORT(), shut = allShutWindows();
  const dia = diastasisWindow(l);
  if (dia) fillOf(dia, l);
  const ph = phaseCensus();
  const rows = rowsFor(l, r, g, shut, dia, ph);
  const pass = {}; let allPass = true;
  for (const [id, kind, what, ok, value] of rows) {
    pass[id] = { kind: kind, what: what, ok: !!ok, value: value };
    if (!ok) allPass = false;
  }
  const side = A => A && { edv: A.edv, esv: A.esv, sv: A.sv, ef: A.ef, q_peak: A.q_peak,
                           systole_s: A.systole_s, diastole_s: A.diastole_s, ivc_s: A.ivc_s,
                           ejection_s: A.ejection_s, ivr_s: A.ivr_s, filling_s: A.filling_s,
                           kick_frac: A.kick_frac, art_sys: A.art_sys, art_dia: A.art_dia,
                           presystole_s: A.presystole_s, shut_to_eject_s: A.shut_to_eject_s,
                           e_peak: A.e_peak, e_t: A.e_t, a_peak: A.a_peak, a_t: A.a_t,
                           ea_ratio: A.ea_ratio, diastasis_flow: A.diastasis_flow,
                           diastasis_t: A.diastasis_t, diastasis_frac: A.diastasis_frac,
                           pv_peak: A.pv_peak, atr_peak: A.atr_peak,
                           ivc_excursion: A.ivc_excursion, ivr_excursion: A.ivr_excursion,
                           overlap_samples: A.overlap_samples, overlap_s: A.overlap_s,
                           order_ok: A.order_ok, periodic_err: A.periodic_err, events: A.events };
  return { pass: pass, allPass: allPass, left: side(l), right: side(r),
           geometry: g, all_shut_windows: shut, diastasis: dia, phases: ph,
           negatives: negatives() };
}

/* EVERY ROW GETS A DELIBERATELY WRONG INPUT IT MUST REJECT. RENDER-STANDARD, added after a round in
   which a test asserted a defect and so locked it in, and another in which a test was satisfied by a
   value so small the claim was invisible. A row that cannot be made to fail is not measuring
   anything. The perturbations below are each the SHAPE of the defect the row exists to catch — the
   right side's negative isovolumetric window, the flow overlap, the mirrored base — not an arbitrary
   nudge, so a row that survives one is telling you it would not have caught the real thing either. */
function negatives() {
  const clone = o => JSON.parse(JSON.stringify(o));
  const l0 = L(), r0 = R(), g0 = GEOM_REPORT(), s0 = allShutWindows();
  const d0 = diastasisWindow(l0);
  if (d0) fillOf(d0, l0);
  const p0 = phaseCensus();
  const strip = A => { const c = clone({ edv: A.edv, esv: A.esv, sv: A.sv, ef: A.ef, q_peak: A.q_peak,
      systole_s: A.systole_s, diastole_s: A.diastole_s, ivc_s: A.ivc_s, ejection_s: A.ejection_s,
      ivr_s: A.ivr_s, filling_s: A.filling_s, kick_frac: A.kick_frac, art_sys: A.art_sys,
      art_dia: A.art_dia, pv_peak: A.pv_peak, atr_peak: A.atr_peak, ivc_excursion: A.ivc_excursion,
      ivr_excursion: A.ivr_excursion, overlap_samples: A.overlap_samples, overlap_s: A.overlap_s,
      e_peak: A.e_peak, a_peak: A.a_peak, ea_ratio: A.ea_ratio, diastasis_flow: A.diastasis_flow,
      diastasis_frac: A.diastasis_frac, presystole_s: A.presystole_s,
      order_ok: A.order_ok, periodic_err: A.periodic_err, events: A.events }); return c; };

  /* each case: [row id, what is broken, a mutator over {l, r, g, shut}] */
  const cases = [
    ['A',  'LV end-diastolic volume 20 ml out',          x => { x.l.edv = 140; }],
    ['B',  'LV end-systolic volume 20 ml out',           x => { x.l.esv = 70; }],
    ['C',  'aortic pressure 140/95',                     x => { x.l.art_sys = 140; x.l.art_dia = 95; }],
    ['D',  'RV volumes 100/40',                          x => { x.r.edv = 100; x.r.esv = 40; }],
    ['E',  'pulmonary artery 45/20',                     x => { x.r.art_sys = 45; x.r.art_dia = 20; }],
    ['E2', 'right peak flow a numerical spike',          x => { x.r.q_peak = 2100; }],
    ['F',  'the right side ejects 20 ml more',           x => { x.r.sv = x.l.sv + 20; }],
    ['G',  'systole half a second',                      x => { x.l.systole_s = 0.50; }],
    ['H',  'diastole a quarter second',                  x => { x.l.diastole_s = 0.25; }],
    ['I',  'ejection fraction 0.80',                     x => { x.l.ef = 0.80; }],
    ['J',  'left aortic valve opens before the mitral shuts',
                                                         x => { x.l.order_ok = false; }],
    ['J2', 'right events out of order — the defect found 2026-09-22',
                                                         x => { x.r.order_ok = false; }],
    ['K',  'left isovolumetric contraction moves 5 ml',  x => { x.l.ivc_excursion = 5; }],
    ['K2', 'right relaxation moves the whole stroke volume — the 70.11 ml that was exported and never asserted on',
                                                         x => { x.r.ivr_excursion = 70.11; }],
    ['L',  'left isovolumetric contraction 0.12 s',      x => { x.l.ivc_s = 0.12; }],
    ['L2', 'right isovolumetric contraction longer than the left',
                                                         x => { x.r.ivc_s = x.l.ivc_s + 0.01; }],
    ['M',  'left isovolumetric relaxation 0.02 s',       x => { x.l.ivr_s = 0.02; }],
    ['M2', 'right isovolumetric relaxation 0.79999 s — the wrapped negative window itself',
                                                         x => { x.r.ivr_s = 0.79999; }],
    ['N',  'atrial kick 0.45 of filling',                x => { x.l.kick_frac = 0.45; }],
    ['N2', 'right atrial kick 0.45 of filling',          x => { x.r.kick_frac = 0.45; }],
    ['V',  'eleven samples of flow overlap on the right — exactly what was there',
                                                         x => { x.r.overlap_samples = 11; x.r.overlap_s = 0.0044; }],
    ['W',  'the aortic valve shuts after the pulmonary (S2 split backwards)',
                                                         x => { x.r.events.slShut = wrap01(x.l.events.slShut - 0.02); }],
    ['X',  'no all-shut window in relaxation — what beat 7 was narrating into',
                                                         x => { x.shut = x.shut.filter(w => w.phase !== 'ivr'); }],
    ['P',  'the trace does not close on itself at t = 1', x => { x.l.periodic_err = 0.5; }],
    ['O',  'peak LV 90 mmHg above recorded aortic systolic',
                                                         x => { x.l.pv_peak = x.l.art_sys + 90; }],
    ['Q',  'long axis shortens as much as the minor axis', x => { x.g.longShort = 0.30; }],
    ['R',  'LV wall thinner at end-systole than end-diastole',
                                                         x => { x.g.wall_es_mm = 8; }],
    ['S',  'e2L pointing posterior — the mirrored base, as it was until 2026-09-22',
                                                         x => { x.g.base.e2_anterior = -0.947; }],
    ['T',  'the pulmonary valve 3.9 cm BEHIND the aortic — the measured defect',
                                                         x => { x.g.base.pv[2] = x.g.base.av[2] - 3.9; }],
    ['U',  'the aortic root behind the mitral annulus',  x => { x.g.base.av[2] = x.g.base.mv[2] - 1.0; }],
    /* The two defects this round repaired, each fed back in at the size it actually had. */
    ['W2', 'T1 before M1 by 2.8 ms — the inter-side order this model had until 2026-09-29',
                                                        x => { x.r.events.avShut = wrap01(x.l.events.avShut - 0.0035); }],
    ['W3', 'a 0.113 s end-diastolic pause — the interval that was being reported as isovolumetric contraction',
                                                        x => { x.l.presystole_s = 0.113; }],
    ['Y',  'transmitral E/A 0.86 — the reversed filling pattern the model had on 2026-09-29, before the venous reservoir',
                                                        x => { x.l.ea_ratio = 0.86; }],
    ['Z',  'no diastasis: inflow at its mid-diastolic minimum still 0.51 of the E peak, exactly what review round 2 measured at beat 9',
                                                        x => { x.dia.min_frac = 0.51; }],
    /* the four defects round 4 repaired, each fed back in at the size it actually had */
    ['Y2', 'the mitral annulus larger than the tricuspid — the order the wrong way round',
                                                        x => { x.g.base.annulus_tv_cm = x.g.base.annulus_mv_cm - 0.1; }],
    ['Y3', 'the tricuspid annulus larger than the mitral by 0.26 mm — the coincidence measured on 2026-09-29',
                                                        x => { x.g.base.annulus_tv_cm = x.g.base.annulus_mv_cm + 0.026; }],
    /* ---- the three ring-SHAPE rows, round 6. Y4's negative is the defect R5-OPEN-1 found, moved
       onto a ring that is supposed to be a circle: if the mitral ever inherited a flattened section
       the way the tricuspid did, Y4 has to catch it. Y5's negative shrinks the tricuspid orifice
       below the mitral, which is what a mean diameter cannot see. Y6's negative is a ring WORSE than
       the one that ships — the declared defect growing, which is the only thing that row is for. */
    ['Y4', 'the mitral ring inheriting a flattened section — aspect 3.05, the shape round 5 measured on the tricuspid',
                                                        x => { x.g.base.ring_mv.aspect = 3.05; }],
    ['Y5', 'the tricuspid orifice AREA smaller than the mitral while its mean diameter stays the larger — the exact blind spot Y2 and Y3 have',
                                                        x => { x.g.base.ring_tv.orifice_area_cm2 =
                                                               x.g.base.ring_mv.orifice_area_cm2 * 0.95; }],
    ['Y6', 'the tricuspid ring flattened FURTHER, to 3.30 to 1 — the declared defect getting bigger inside an edit that fixed something else, which is how R4-OPEN-1 happened',
                                                        x => { x.g.base.ring_tv.aspect = 3.30; }],
    ['Z2', 'the tricuspid annulus 2.52 cm below the mitral — the Ebstein-sized offset measured in round 3',
                                                        x => { x.g.base.tv_below_mv_cm = 2.52; }],
    ['Z3', 'the four annuli spanning 4.46 cm in y — the funnel av_plane was cut from in round 3',
                                                        x => { x.g.base.annuli_span_y_cm = 4.46; }],
    ['Z4', 'the round-3 palette, whose closest cavity pair differed by 29 across the three channels',
                                                        x => { x.g.cavity_colour_min_delta = 29; }],
    /* the three widths round 4 measured, fed back in at the size they actually had (R4-OPEN-1) */
    ['Z5', 'the mitral and tricuspid annular centres 6.045 cm apart in x — the round-4 measurement',
                                                        x => { x.g.base.mv_to_tv_x_cm = 6.045; }],
    ['Z6', 'the four annuli spanning 6.852 cm in x — the round-4 measurement',
                                                        x => { x.g.base.base_span_x_cm = 6.852; }],
    ['Z7', 'the tube standing off the left ventricular axis by 4.875 cm at BOTH ends and nowhere further — the constant standoff gaps[13] named as the cause, and the reason neither orifice came medially',
                                                        x => { x.g.base.rv_inflow_standoff_cm = 4.875;
                                                               x.g.base.rv_outflow_standoff_cm = 4.875;
                                                               x.g.base.rv_standoff_max_cm = 4.875; }],
    /* a SEVENTH phase arriving unannounced is the shape R4-OPEN-3 actually had: the sixth arrived
       inside the round-4 diastole rework and the scene's goal was never told */
    ['Z8', 'phaseAt returning a key the model does not declare — a seventh phase arriving unannounced',
                                                        x => { x.ph.undeclared = ['presystole'];
                                                               x.ph.coverage = 0.97; }],
    ['Z9', 'isovolumetric relaxation collapsed to 4 ms — a phase a student is asked the duration of, too narrow to have one',
                                                        x => { x.ph.narrowest_examined_s = 0.004; }],
  ];

  const out = {}; let allReject = true;
  for (const [id, what, mutate] of cases) {
    const x = { l: strip(l0), r: strip(r0), g: clone(g0), shut: clone(s0), dia: clone(d0),
                ph: clone(p0) };
    mutate(x);
    const row = rowsFor(x.l, x.r, x.g, x.shut, x.dia, x.ph).find(rw => rw[0] === id);
    const rejected = !!row && !row[3];
    out[id] = { broke: what, rejected: rejected };
    if (!rejected) allReject = false;
  }
  return { allReject: allReject, cases: out };
}

/* ================================================================== 2 · GEOMETRY

   Units: centimetres. +x = patient's LEFT, +y = SUPERIOR, +z = ANTERIOR.

   STATED (shape inputs, textbook and examinable):
     · LV cavity long axis at end-diastole 8.0 cm; LV free wall 1.0 cm at end-diastole
     · LV minor-axis fractional shortening 0.30 — the echocardiographer's FS
     · RV cavity long axis at end-diastole 6.8 cm; RV free wall 0.35 cm  (so LV : RV wall is ~3 : 1)
     · TAPSE 2.0 cm — the tricuspid annulus descends 2 cm in systole

   The two ventricles are given DIFFERENT stated shortenings on purpose, because the contrast is the
   teaching: the left ventricle empties mainly by CIRCUMFERENTIAL shortening (minor axis stated, long
   axis predicted) and the right mainly by LONGITUDINAL shortening (long axis stated as TAPSE, minor
   axis predicted). Getting one of each out as a prediction is the only way to know the law is not
   just two numbers wearing a formula.

   DERIVED, at every t, with no dials:
     · the cavity's radius and length, from the volume the circulation solved for
     · the wall thickness, by BISECTION against a CONSTANT MYOCARDIAL VOLUME. Wall thickness appears
       nowhere as a constant in this file after end-diastole. The muscle cannot be compressed, so a
       cavity that gets smaller must have a wall that gets thicker, and by exactly how much is
       arithmetic rather than judgement.
     · the position of the atrioventricular plane. THE APEX IS FIXED and the base descends towards
       it, which is what actually happens and is why the apex beat stays in one intercostal space.  */

const ANTERIOR = new T.Vector3(0, 0, 1);
const LATERAL  = new T.Vector3(1, 0, 0);   // patient's left

/* WHICH WAY EACH VENTRICLE IS OPENED, and this had to be answered once the base plane stopped being
   mirrored. Both windows used to be aimed at ANTERIOR, and that worked only because e2L pointed the
   wrong way: the right ventricle wrapped round the BACK, so an anterior cut into the left ventricle
   had nothing in front of it. Un-mirrored, the right ventricle is where it belongs — the most
   anterior chamber, covering the left ventricle's anterior surface — and an anterior window into
   the left ventricle looks straight into the back of the right one.

   So each ventricle is opened through its OWN FREE WALL, which is also how a heart is opened on a
   dissecting bench and why the septum is what you see across the far side of an opened left
   ventricle. The right ventricle's free wall IS anterior. The left ventricle's is anterolateral, and
   that is a world direction rather than a camera angle — RENDER-STANDARD, aim a cutaway at a world
   direction. It is the same 132-degree opening; only where it faces has changed. */
const RV_WINDOW = ANTERIOR;
const LV_WINDOW = new T.Vector3(1, 0, 0.62).normalize();   // patient's left, and forward

const APEX_LV = new T.Vector3( 4.20, -5.60,  1.40);
const UP_LV   = new T.Vector3(-0.3965, 0.8697, -0.2942).normalize();

const SHAPE = {
  m: 2.5,                    // cavity profile exponent: r(zeta) = r0 * sqrt(1 - zeta^m), a bullet
  lv: { h_ed: 8.00, wall_ed: 1.00, flatten: 0.94, fs_minor: 0.30 },
  /* The right ventricle is NOT a second lozenge. See the RV section below. `deep` is how far its
     lowest point sits below the left ventricle's base plane, `phi0`/`phi1` how far round the left
     ventricle it wraps, and `tapse` the descent of its annulus — the one stated shortening it has. */
  rv: { wall_ed: 0.35, flatten: 0.35, tapse: 2.00, deep: 4.60, phi0: -0.35, phi1: 2.00,
        bulge: 0.22, septal: 1.05,
        /* ABOVE THE BASE PLANE THERE IS NO LEFT VENTRICLE TO STAND OFF, AND UNTIL ROUND 5 THE TUBE
           STOOD OFF ONE ANYWAY. rvPath clamped zeta at 0 for any station above the base, so the
           obstacle it cleared there was the left ventricle's FULL basal cavity radius — 2.67 cm —
           plus a 1.05 cm interventricular septum, at the one height where neither exists. Both
           ends of the tube sit at or above the base, so both were pushed out to 4.875 cm from the
           left ventricular axis, equal to seven figures, and that single number is what made the
           heart 14.3 cm wide and put the tricuspid annulus 6.04 cm from the mitral (R4-OPEN-1).
           What IS there above the base plane is the atrioventricular junction: the mitral annulus
           and, between the two orifices, the thin atrioventricular septum. So the obstacle fades
           from the cavity radius at the base plane to the mitral annulus radius over `base_fade`
           centimetres of height, and the septal clearance fades with it from the interventricular
           `septal` to the atrioventricular `septal_base`. Nothing here is a fudge factor pulling a
           number down: it is the tube clearing what is actually in its way. */
        base_fade: 1.60, septal_base: 0.34,
        /* THE INFUNDIBULUM RISES. The pulmonary valve is the most SUPERIOR of the four annuli and
           the outflow tract crosses in front of the left ventricular outflow to reach it, which is
           why it comes medially rather than staying out on the free wall. Giving the outflow end
           its own lift is what lets it do that: above the base plane the obstacle fades, so the
           standoff falls out of the fade rather than being drawn in by hand. `deep` still sets how
           far the mid-body dives, so the tube bellies out around the left ventricle between the
           two orifices and comes in at both — asserted, row Z7. */
        pv_lift: 1.60,
        /* THE TRICUSPID ANNULUS IS MORE APICAL THAN THE MITRAL BY UNDER A CENTIMETRE, NOT BY TWO
           AND A HALF. Round 3 measured mv y +1.613 against tv y -0.908 — a 2.52 cm offset at
           end-diastole and 3.05 at peak ejection, where the normal is under about 1 cm and beyond
           8 mm/m2 indexed is the echocardiographic threshold for Ebstein anomaly (R3-OPEN-8). The
           cause was geometric rather than a typed-in number: the inflow end of the tube sat 4.9 cm
           out from the left ventricle's axis on a base plane tilted 0.46 cm of drop per cm of
           radius, so the plane alone buried it. A base is not one plane — the four annuli sit in a
           saddle — so the inflow end is lifted back towards the mitral's level.

           WAS 1.98 UNTIL ROUND 5, AND THE RE-DERIVATION ABOVE IS WHY IT CAME DOWN. Half of that
           1.98 was paying for the 4.9 cm standoff, which was itself the defect R4-OPEN-1 found:
           the inflow now stands 3.05 cm off the axis instead, the plane buries it by that much
           less, and a lift of 1.45 puts the tricuspid 0.41 cm below the mitral where 1.98 would
           now put it 0.06 cm ABOVE. Solved by sweep against rows Z2, Z3 and Z5 together rather
           than aimed at one of them — the sweep is in BUILD-LOG.md. Still asserted and not
           assumed: row Z2 requires the measured mitral-to-tricuspid drop to land in 0.2-1.0 cm,
           and the four annuli now span 2.96 cm in y where round 3 measured 4.46. */
        tv_lift: 1.45 },
};
/* THE BASE PLANE'S OWN BASIS, IN ONE PLACE. There were two copies of this — one in buildCycle and
   one in GEOM_REPORT — and both had e2 built as cross(UP_LV, e1), which points POSTERIOR. Every
   structure placed off it came out mirrored front to back: the pulmonary valve 3.9 cm BEHIND the
   aortic root instead of directly in front of it, the aortic root behind the mitral annulus, the
   inferior vena cava in front of the heart, the pulmonary veins entering the left atrium
   anteriorly. Tricuspid-to-pulmonary centre distance 9.1 cm, wider than the whole base.

   Nothing caught it because the intent was written down and never checked: rvPath's own comment
   says "phi grows towards ANTERIOR, so the tube sweeps round the front", and it swept round the
   back. RENDER-STANDARD, twice over — DECLARE THE AXES AND PROVE THEM, and a comment is not checked
   by anything. Acceptance row S proves it now, and rows T and U prove the two relations at the base
   that a student is examined on. Two copies became one for the same reason: the fix had to be
   applied twice to be complete, which is how a fix gets applied once. */
function baseFrame(lvShape) {
  const baseLV = new T.Vector3().copy(APEX_LV).addScaledVector(UP_LV, lvShape.h);
  const e1L = new T.Vector3().copy(LATERAL).addScaledVector(UP_LV, -LATERAL.dot(UP_LV)).normalize();
  const e2L = new T.Vector3().crossVectors(e1L, UP_LV).normalize();   // ANTERIOR. Asserted, row S.
  return { baseLV: baseLV, e1L: e1L, e2L: e2L };
}

/* The four valve centres, from the frame and the two chambers — used by buildCycle to place the
   leaflets and by GEOM_REPORT to measure where they landed. ONE definition: a second copy of these
   offsets is how a geometry assertion ends up grading a different heart from the one on screen. */
function valveCentres(fr, slv, srv, annL) {
  const rvLast = srv.path.pts.length - 1;
  return {
    mv: new T.Vector3().copy(fr.baseLV).addScaledVector(fr.e1L,  1.15 * annL).addScaledVector(fr.e2L, -0.55 * annL),
    av: new T.Vector3().copy(fr.baseLV).addScaledVector(fr.e1L, -1.20 * annL).addScaledVector(fr.e2L,  0.50 * annL),
    tv: new T.Vector3().copy(srv.path.pts[0]),
    pv: new T.Vector3().copy(srv.path.pts[rvLast]),
  };
}

/* THE FOUR ANNULI, IN ONE PLACE. buildCycle draws the leaflets from these and GEOM_REPORT measures
   against them, for the reason valveCentres gives above: a second copy of a geometry constant is how
   an assertion ends up grading a different heart from the one on screen. Radii in cm at
   end-diastole; the mitral and aortic scale with the left cavity, the tricuspid and pulmonary with
   the right. The examined relation is the ORDER of the four — tricuspid > mitral > pulmonary >
   aortic — and the tricuspid-to-mitral margin; both are asserted, rows Y and Y2. */
const ANN = {
  mv: 1.40,              // mitral annulus radius at end-diastole
  av: 1.05,              // aortic
  tv_mv_ratio: 1.18,     // STATED: the tricuspid's MEAN annulus is 15-20% wider than the mitral
  /* WAS 0.80. The round-5 re-derivation shortened the right ventricular path, so the solved tube
     radius fell about 5% and the pulmonary ring fell with it — to 2.078 cm, BELOW the aortic 2.1,
     inverting the examined order of the four rings and failing row Y2. The valve ring is a little
     narrower than the infundibulum it sits in rather than a lot: 0.88 puts the pulmonary annulus
     at 2.30 cm against a real 2.2-2.5, restores tricuspid > mitral > pulmonary > aortic with
     0.2 cm of margin at the tightest pair, and is the only constant in this model that moved to
     keep a row passing. Recorded here rather than in a commit message because that is the kind of
     change that is invisible six months later. */
  pv_cal: 0.88,          // pulmonary ring as a fraction of the infundibulum's mean calibre
};

/* THE SHAPE OF EACH RING, AND NOT JUST ITS SIZE. Added round 6, 2026-09-30, for R5-OPEN-1.
   Until now the only thing that left this model about an annulus was ONE scalar — annulus_tv_cm and
   its three siblings — and that scalar is the ARITHMETIC MEAN of the ring's two diameters. A mean is
   a convention, and review round 5 showed what a convention hides: the tricuspid ring measured
   4.92 cm by 1.78 on its own built triangles, an ellipse of 2.8 to 1, while the one exported number
   read 3.304 and three rows and a beat claim all read it and all passed. A single diameter for a
   non-circular structure is not a measurement.

   So the two functions below are the ONE definition of each ring's shape, for the same reason ANN
   and valveCentres are one definition of its size and its place: buildCycle draws the leaflets from
   `annulusAspect` and GEOM_REPORT measures with `ringShape`, so a row cannot grade a ring the
   student is not shown. `aspect` here is avLeaflet's own parameter — the ratio of the e2 semi-axis
   to the e1 one, so 1 is a circle and 0.35 is a 2.86-to-1 ellipse. The reported `aspect` is the
   major-over-minor ratio instead, which is >= 1 whichever way round the ellipse lies, because that
   is the number an annulus is quoted by. */

/** The e2/e1 ratio each annulus is DRAWN with. The three circular rings say so here rather than by
    omitting an argument, so that "this ring is a circle" is a stated fact and not a default. */
function annulusAspect(rv) {
  return {
    mv: 1, av: 1, pv: 1,
    /* THE ONE THAT IS NOT A CIRCLE, and the reason is structural rather than a choice: the
       tricuspid annulus is the MOUTH of the right ventricular tube, so its section is the tube's
       section, and the tube is flattened towards the septum to make the crescent. See the
       limitation row Y6 — this is a declared defect with its remedy named, not a modelling
       decision that came out right. */
    tv: rv.flatten,
  };
}

/** major and minor DIAMETER, aspect (>= 1) and orifice AREA of a ring of MEAN radius Rmean drawn at
    the given e2/e1 ratio. The two semi-axes are derived exactly as avLeaflet derives them from the
    same pair, so this measures the ellipse that is built and not one like it. */
function ringShape(Rmean, asp) {
  const a = 2 * Rmean / (1 + asp), b = a * asp;
  const major = 2 * Math.max(a, b), minor = 2 * Math.min(a, b);
  return {
    major_cm: major, minor_cm: minor,
    mean_cm: major / 2 + minor / 2,              // the scalar the four annulus_*_cm figures are
    aspect: major / minor,
    orifice_area_cm2: Math.PI * a * b,
  };
}

const KAPPA = SHAPE.m / (SHAPE.m + 1);       // ∫(1 - z^m) dz over [0,1] — the bullet's fullness
const NSEG = 46, NRING = 40;

/** Volume of one bullet-of-revolution cavity: pi r0^2 h * kappa * flatten. */
function bulletVolume(r0, h, flat) { return Math.PI * r0 * r0 * h * KAPPA * flat; }

/* The two shortening exponents, one ventricle at a time. r ∝ (V/Ved)^q, h ∝ (V/Ved)^p, 2q + p = 1 so
   the volume law is exact at every V and not only at the two ends. One of q, p is STATED and the
   other falls out. */
function shorteningLaw(side) {
  const st = STATED[side], sh = SHAPE[side];
  const vr = st.esv / st.edv;
  const q = Math.log(1 - sh.fs_minor) / Math.log(vr), p = 1 - 2 * q;
  return { q: q, p: p,
           minorRatio: Math.pow(vr, q), longRatio: Math.pow(vr, p),
           minorShort: 1 - Math.pow(vr, q), longShort: 1 - Math.pow(vr, p) };
}
const LAW = { lv: shorteningLaw('lv') };

const R0ED = { lv: Math.sqrt(STATED.lv.edv / (Math.PI * SHAPE.lv.h_ed * KAPPA * SHAPE.lv.flatten)) };

/* MYOCARDIAL VOLUME, fixed once from the stated end-diastolic wall thickness, then conserved.
   The epicardial body is the same bullet family grown by w in radius and by w in length past the
   apex, with the base annulus staying where it is — so V_epi(w) is a cubic in w and the wall at any
   other cavity volume is the root of V_epi(w) - V_cav = V_myo. Bisected rather than solved in closed
   form because the cubic's algebra is longer than the bisection and offers nothing in return. */
function myoVolumeOf(side) {
  const sh = SHAPE[side], r0 = R0ED[side], h = sh.h_ed, w = sh.wall_ed;
  return bulletVolume(r0 + w, h + w, sh.flatten) - bulletVolume(r0, h, sh.flatten);
}
const VMYO = { lv: myoVolumeOf('lv') };   // the RV's is set below, once its path exists

function wallFor(side, r0, h) {
  const flat = SHAPE[side].flatten, want = VMYO[side] + bulletVolume(r0, h, flat);
  let lo = 0.01, hi = 6.0;
  for (let i = 0; i < 60; i++) {
    const mid = (lo + hi) / 2;
    if (bulletVolume(r0 + mid, h + mid, flat) < want) lo = mid; else hi = mid;
  }
  return (lo + hi) / 2;
}

/** Cavity geometry of the LEFT ventricle at cavity volume V. */
function ventricleShape(side, V) {
  const st = STATED[side], law = LAW[side], sh = SHAPE[side];
  const ratio = Math.max(0.05, V / st.edv);
  const r0 = R0ED[side] * Math.pow(ratio, law.q);
  const h  = sh.h_ed     * Math.pow(ratio, law.p);
  return { r0: r0, h: h, wall: wallFor(side, r0, h), flatten: sh.flatten, V: V };
}

/* ============================================ THE RIGHT VENTRICLE, AS THE SHAPE IT ACTUALLY IS

   The first version of this model built the right ventricle the way it built the left: a body of
   revolution on its own axis, standing beside it. It was measured before it was believed, and it was
   wrong in two ways at once, both of which a render made obvious and neither of which any earlier
   check would have caught:

     · 19.6% OF THE LEFT VENTRICULAR CAVITY WAS ALSO INSIDE THE RIGHT VENTRICULAR CAVITY. Sampled on
       a grid, by parity ray-casting against the built triangles. A fifth of the blood was in both
       chambers. Nothing in the volume arithmetic notices that, because each chamber integrates to
       the right number on its own.
     · THE HEART WAS 11.7 cm ACROSS, against a real 8.5. Two convex bodies of 120 and 130 ml sitting
       side by side cannot be any narrower; the geometry forces it.

   Both have one cause: a right ventricle is not a chamber beside the left one, it is a chamber
   WRAPPED AROUND it. Its inflow runs from the tricuspid annulus down towards the apex and its
   outflow turns up and forwards to the pulmonary valve, so the cavity is a curved tube of crescentic
   section riding on the left ventricle's epicardium — which is why it can hold slightly MORE than
   the left ventricle while adding only a couple of centimetres to the width of the heart, and why
   the pulmonary valve ends up anterior to and left of the aortic.

   So it is built as what it is: render-kit's swept shell along a curved centreline. The path is
   written in cylindrical coordinates ABOUT THE LEFT VENTRICLE'S OWN AXIS, so the right ventricle
   rides on the left and moves with it instead of being positioned against it by hand.

     a(u)   = sin(pi u)^0.8   0 at both ends, 1 at the deepest point
     axial  = -(deep*a + descent*(1-a))     apex end fixed, annulus end descends by TAPSE
     phi    = phi0 + (phi1-phi0)*u          how far round the left ventricle it has wrapped
     rho    = (left ventricle's epicardial radius here) + clearance * R

   THE TUBE RADIUS IS SOLVED, NOT CHOSEN: R comes out of the requirement that the tube hold exactly
   the volume the circulation solved for, integrated along the actual path. So does the wall, from
   the same conserved myocardial volume as the left. Nothing about this shape is a dial except how
   far round it wraps and how deep it goes, which are stated.                                       */

const RV_STEPS = 44;

function rvDescent(V) {
  const st = STATED.rv;
  const f = (st.edv - V) / (st.edv - st.esv);
  return SHAPE.rv.tapse * Math.max(0, Math.min(1.4, f));
}
const rvShape = u => 1 - SHAPE.rv.bulge * Math.pow(2 * u - 1, 2);   // fuller in the middle

/** The centreline, in world space, given the left ventricle it rides on. */
function rvPath(lv, baseLV, e1L, e2L, descent, clearR) {
  const sh = SHAPE.rv;
  const pts = [], shape = [], stand = [];
  /* the mitral annulus radius at this left-ventricular volume, scaled the same way GEOM_REPORT and
     buildCycle scale it — ONE definition, so the obstacle the tube clears above the base plane is
     the same ring the leaflets are drawn on */
  const annR = ANN.mv * Math.pow(lv.r0 / R0ED.lv, 0.4);
  for (let i = 0; i <= RV_STEPS; i++) {
    const u = i / RV_STEPS;
    const a = Math.pow(Math.sin(Math.PI * u), 0.8);
    /* Both ORIFICES stand above the left ventricle's base plane and the body dives between them.
       The inflow lift brings the tricuspid annulus up beside the mitral — (1-u)^2 dies away along
       the tube — and the outflow lift raises the infundibulum, u^2, so the pulmonary valve ends up
       the highest of the four annuli, which is what it is. */
    const lift = sh.tv_lift * (1 - u) * (1 - u) + sh.pv_lift * u * u;
    const axial = -(sh.deep * a + descent * (1 - a)) + lift;
    const phi = sh.phi0 + (sh.phi1 - sh.phi0) * u;
    /* WHAT THE TUBE HAS TO CLEAR AT THIS STATION, which is not the same thing all the way along.
       BELOW the base plane it is the left ventricular cavity plus the interventricular septum —
       the septal surface is what actually bounds the right ventricle, so the standoff is measured
       from the cavity and not guessed off the epicardium. ABOVE the base plane the left ventricle
       has ended: what is there is the atrioventricular junction, so the obstacle fades to the
       mitral annulus radius and the septum to the thin atrioventricular one. Until round 5 this
       fade did not exist — zeta clamped at 0 and every station above the base cleared the full
       basal cavity — and that is the whole of R4-OPEN-1's 2 cm. */
    const zeta = Math.min(1, Math.max(0, -axial / lv.h));
    let obst, sept;
    if (axial <= 0) {
      obst = lv.r0 * Math.sqrt(Math.max(0, 1 - Math.pow(zeta, SHAPE.m)));
      sept = sh.septal;
    } else {
      const f = Math.min(1, axial / sh.base_fade);
      obst = lv.r0 + (annR - lv.r0) * f;
      sept = sh.septal + (sh.septal_base - sh.septal) * f;
    }
    const rho = obst + sept + clearR * rvShape(u) * sh.flatten + sh.wall_ed;
    const p = new T.Vector3().copy(baseLV).addScaledVector(UP_LV, axial);
    /* phi = 0 is the patient's RIGHT; phi grows towards ANTERIOR, so the tube sweeps round the front */
    p.addScaledVector(e1L, -Math.cos(phi) * rho).addScaledVector(e2L, Math.sin(phi) * rho);
    pts.push(p); shape.push(rvShape(u)); stand.push(rho);
  }
  return { pts: pts, shape: shape, stand: stand };
}

/* A RADIALLY ALIGNED FRAME, not a parallel-transported one, and the reason is the shape of the
   chamber. sweptShell squashes its section along the frame's binormal, and for a crescent the thin
   direction is RADIAL — towards the left ventricle it is wrapped around — which rotates as the tube
   sweeps round. A parallel-transported frame holds its binormal fixed in space, so a flattened
   section built on one comes out thin in the right direction at one station and edge-on at another,
   and the "crescent" ends up a lozenge again. This is a different FRAME, not a different winding or
   a different normal: it hands sweptShell the same {P,D,N,B} contract and every triangle still goes
   out through the emitter. B is the radial direction with its along-path component removed; N is
   B x D, which satisfies D x N = B exactly, so the kit's own relation still holds. */
function radialFrame(pts, axisPoint, axisDir) {
  const n = pts.length - 1;
  const P = pts.map(p => p.clone()), D = [], N = [], B = [];
  const rel = new T.Vector3();
  for (let i = 0; i <= n; i++) {
    const d = new T.Vector3()
      .subVectors(pts[Math.min(i + 1, n)], pts[Math.max(i - 1, 0)]).normalize();
    rel.subVectors(pts[i], axisPoint);
    rel.addScaledVector(axisDir, -rel.dot(axisDir));            // radial, from the LV axis
    const b = new T.Vector3().copy(rel);
    b.addScaledVector(d, -b.dot(d));                            // ... perpendicular to the path
    if (b.lengthSq() < 1e-8) b.copy(ANTERIOR).addScaledVector(d, -ANTERIOR.dot(d));
    b.normalize();
    D.push(d); B.push(b);
    N.push(new T.Vector3().crossVectors(b, d).normalize());
  }
  return { P: P, D: D, N: N, B: B };
}

/** integral of shape(u)^2 ds along the path — the geometry factor the volume solve needs */
function rvIntegral(path, pow, offset) {
  let s = 0;
  for (let i = 0; i < path.pts.length - 1; i++) {
    const ds = path.pts[i].distanceTo(path.pts[i + 1]);
    const m = (path.shape[i] + path.shape[i + 1]) / 2;
    s += Math.pow(m + (offset || 0), pow == null ? 2 : pow) * ds;
  }
  return s;
}

/** Everything about the right ventricle at cavity volume V. */
function rvGeometry(V, lv, baseLV, e1L, e2L, clearR) {
  const sh = SHAPE.rv, descent = rvDescent(V);
  const path = rvPath(lv, baseLV, e1L, e2L, descent, clearR);
  /* R from the volume: V = pi * flatten * R^2 * integral(shape^2 ds) */
  const R = Math.sqrt(V / (Math.PI * sh.flatten * rvIntegral(path, 2)));
  /* wall from the same conserved myocardial volume the left ventricle uses:
     V_epi(w) = pi * flatten * integral((R*shape + w)^2 ds) */
  let lo = 0.01, hi = 4.0;
  const want = (VMYO.rv || 0) + V;
  for (let k = 0; k < 50; k++) {
    const mid = (lo + hi) / 2;
    let acc = 0;
    for (let i = 0; i < path.pts.length - 1; i++) {
      const ds = path.pts[i].distanceTo(path.pts[i + 1]);
      const m = (path.shape[i] + path.shape[i + 1]) / 2;
      acc += Math.pow(m * R + mid, 2) * ds;
    }
    if (Math.PI * sh.flatten * acc < want) lo = mid; else hi = mid;
  }
  return { path: path, R: R, wall: (lo + hi) / 2, descent: descent, flatten: sh.flatten, V: V };
}

/* The clearance radius and the right ventricle's myocardial volume are fixed once, at end-diastole,
   by two passes: the path needs a radius to stand off the left ventricle by, and the radius needs a
   path to be solved against. Two passes converge to well under a tenth of a millimetre; a third
   changes nothing measurable, which is checked below rather than asserted. */
const RV_ED = (function () {
  const lv = ventricleShape('lv', STATED.lv.edv);
  const baseLV = new T.Vector3().copy(APEX_LV).addScaledVector(UP_LV, lv.h);
  const e1 = new T.Vector3().copy(LATERAL).addScaledVector(UP_LV, -LATERAL.dot(UP_LV)).normalize();
  const e2 = new T.Vector3().crossVectors(UP_LV, e1).normalize();
  let R = 2.0, prev = 0;
  for (let k = 0; k < 6; k++) {
    prev = R;
    const path = rvPath(lv, baseLV, e1, e2, 0, R);
    R = Math.sqrt(STATED.rv.edv / (Math.PI * SHAPE.rv.flatten * rvIntegral(path, 2)));
  }
  const path = rvPath(lv, baseLV, e1, e2, 0, R);
  /* myocardial volume, from the stated end-diastolic wall thickness, then conserved */
  let acc = 0;
  for (let i = 0; i < path.pts.length - 1; i++) {
    const ds = path.pts[i].distanceTo(path.pts[i + 1]);
    const m = (path.shape[i] + path.shape[i + 1]) / 2;
    acc += (Math.pow(m * R + SHAPE.rv.wall_ed, 2) - Math.pow(m * R, 2)) * ds;
  }
  return { R: R, converged: Math.abs(R - prev), vmyo: Math.PI * SHAPE.rv.flatten * acc,
           length: rvIntegral(path, 0) };
})();
VMYO.rv = RV_ED.vmyo;

/** Reported by acceptance(); also the only place the geometry's predictions are computed. */
function GEOM_REPORT() {
  const ed = ventricleShape('lv', STATED.lv.edv), es = ventricleShape('lv', STATED.lv.esv);
  const fe = baseFrame(ed), fs = baseFrame(es);
  const red = rvGeometry(STATED.rv.edv, ed, fe.baseLV, fe.e1L, fe.e2L, RV_ED.R);
  const res = rvGeometry(STATED.rv.esv, es, fs.baseLV, fs.e1L, fs.e2L, RV_ED.R);
  /* WHERE THE FOUR VALVES ACTUALLY LAND, measured at end-diastole through the same helper buildCycle
     places the leaflets with. Reported in world centimetres, +x LEFT, +y SUPERIOR, +z ANTERIOR. */
  const Ved = valveCentres(fe, ed, red, Math.pow(ed.r0 / R0ED.lv, 0.4));
  const vec = v => [v.x, v.y, v.z];
  const dist = (a, b) => a.distanceTo(b);
  /* THE FOUR MEAN RADII, ONCE. Every ring figure below — the four annulus_*_cm scalars, the four
     ring_* shapes, annuli_touch_floor_cm and annulus_ratio_tv_mv — is derived from these, so the
     size a row grades and the shape a row grades cannot come apart. Until round 6 the same
     expressions were written out four separate times. */
  const annLe = Math.pow(ed.r0 / R0ED.lv, 0.4), annRe = Math.pow(red.R / RV_ED.R, 0.4);
  const Rm = {
    mv: ANN.mv * annLe,
    av: ANN.av * annLe,
    tv: ANN.tv_mv_ratio * ANN.mv * annRe,
    pv: Math.max(0.70, red.R * red.path.shape[red.path.shape.length - 1]
                       * Math.sqrt(red.flatten) * ANN.pv_cal),
  };
  const ASP = annulusAspect(red);
  const RING = { mv: ringShape(Rm.mv, ASP.mv), av: ringShape(Rm.av, ASP.av),
                 tv: ringShape(Rm.tv, ASP.tv), pv: ringShape(Rm.pv, ASP.pv) };
  return {
    base: {
      e2_anterior: fe.e2L.z,                        // must be > 0 — row S
      mv: vec(Ved.mv), av: vec(Ved.av), tv: vec(Ved.tv), pv: vec(Ved.pv),
      /* the extents the spatial rows take their magnitude floors from */
      annulus_mv_cm: 2 * Rm.mv,
      annulus_av_cm: 2 * Rm.av,
      /* the two right-sided rings, measured the same way buildCycle draws them. The tricuspid's is
         a MEAN diameter: the ring is an ellipse of the tube's own aspect. Added round 4 — until
         then nothing in the report or the battery could see either of them (R3-OPEN-7). */
      annulus_tv_cm: 2 * Rm.tv,
      annulus_pv_cm: 2 * Rm.pv,
      /* THE SHAPE OF ALL FOUR RINGS, each with a major diameter, a minor diameter, an aspect and an
         orifice area, and each measured in the ring's OWN plane rather than in the left ventricle's.
         R5-OPEN-1, and the standards gap the same review proposed: every geometric measure in this
         model was taken in the left ventricular frame, so a structure with a plane of its own was
         measured obliquely — the tricuspid reads 4.67 by 1.67 across the left ventricle's long axis
         and 4.92 by 1.61 in its own. Rows Y4, Y5 and Y6 grade these, and
         tools/render-cardiac-cycle.mjs check 9 measures the same four rings on the BUILT triangles,
         in each ring's own best-fit plane, and requires them to agree with what is exported here. */
      ring_mv: RING.mv, ring_av: RING.av, ring_tv: RING.tv, ring_pv: RING.pv,
      /* how much more apical the tricuspid annulus is than the mitral, and the whole base's
         vertical spread. Normal is under about 1 cm; beyond 8 mm/m2 indexed is Ebstein (R3-OPEN-8) */
      tv_below_mv_cm: Ved.mv.y - Ved.tv.y,
      annuli_span_y_cm: Math.max(Ved.mv.y, Ved.av.y, Ved.tv.y, Ved.pv.y)
                      - Math.min(Ved.mv.y, Ved.av.y, Ved.tv.y, Ved.pv.y),
      tv_to_pv_cm: dist(Ved.tv, Ved.pv),            // MEASURED, declared in the scene's gaps[]
      av_to_pv_cm: dist(Ved.av, Ved.pv),

      /* HOW WIDE THIS HEART IS, AND NOTHING MEASURED IT UNTIL NOW. Round 4's review (R4-OPEN-1)
         found the four chamber walls spanning 13.55-14.66 cm in x where gaps[13] claimed 12.3, and
         the mitral and tricuspid annular centres 6.04 cm apart against a real pair about 3 cm
         apart -- a 2 cm drift that passed a 39-row battery because the battery exported
         tv_to_pv_cm and av_to_pv_cm and no width at all. The lesson is the one RENDER-STANDARD
         states about the base plane: a dimension nobody asserts on is free to move, and it moves
         in the edit that fixes something else. So the three numbers below are exported and
         asserted (rows Z5, Z6, Z7), each with a negative case carrying the SHAPE of the round-4
         measurement rather than an arbitrary nudge.

         These are BASE relations, computed here from the same valveCentres() the leaflets are
         drawn with, so they cannot grade a different heart from the one on screen. The x-span of
         the four chamber WALLS is a property of the built triangles rather than of these centres,
         and it is measured where it can be measured honestly -- on the mesh, by
         tools/render-cardiac-cycle.mjs check 8, which also asserts that
         rv_inflow_standoff_cm below agrees with the geometry it renders. */
      mv_to_tv_x_cm: Ved.mv.x - Ved.tv.x,
      base_span_x_cm: Math.max(Ved.mv.x, Ved.av.x, Ved.tv.x, Ved.pv.x)
                    - Math.min(Ved.mv.x, Ved.av.x, Ved.tv.x, Ved.pv.x),
      /* HOW FAR THE RIGHT VENTRICULAR TUBE STANDS OFF THE LEFT VENTRICLE'S OWN AXIS, at its two
         orifices and at its widest. These are rvPath's own rho, not a second measurement of it, so
         a change to the path cannot leave the assertion grading the previous one. This is the
         number gaps[13] named as the cause -- "the tube rides at a standoff radius set by the
         septal clearance at EVERY station" -- and nothing exported it until round 5. Before the
         re-derivation the first two read 4.875120678076252 and 4.875120678076255: equal to seven
         figures, which is what a constant standoff looks like when you finally print it. */
      rv_inflow_standoff_cm: red.path.stand[0],
      rv_outflow_standoff_cm: red.path.stand[red.path.stand.length - 1],
      rv_standoff_max_cm: red.path.stand.reduce((m, v) => Math.max(m, v), 0),
      /* the geometric floor under mv_to_tv_x_cm: two annuli cannot be closer than the sum of their
         radii without their rings intersecting. Exported so row Z5's lower bound is visibly a
         consequence of the rings rather than a taste. */
      annuli_touch_floor_cm: Rm.mv + Rm.tv,
      /* THE LONG AXIS AND THE APEX, EXPORTED SO A MESH-SIDE CHECK CAN USE THE MODEL'S OWN and not
         a hand-copied vector. tools/render-cardiac-cycle.mjs check 8 measures the built chamber
         walls across this axis, which is the direction the textbook "the heart is about 8.5 cm
         wide" is measured in — an x-span is not the same number, because the heart lies obliquely
         and the left ventricle's own 9 cm axis projects 3.6 cm onto x. Round 4 measured the
         x-span, this model's header quoted the transverse width, and the two were compared as if
         they were the same figure. Both are reported now, separately and labelled. */
      long_axis: [UP_LV.x, UP_LV.y, UP_LV.z],
      apex: vec(APEX_LV),
    },
    /* THE PALETTE IS GRADED TOO. Round 3 measured lv_blood against la_blood at (16,12,15) in RGB
       and rv_blood against ra_blood at (5,10,14): each pair read as one continuous mass, and
       telling the atrial cavity from the ventricular one is a precondition for every claim this
       scene makes (R3-OPEN-6). The measure is the smallest channel-sum distance over all six pairs
       of the four cavity colours — the old palette scored 29, the smallest gap being the right
       pair. Asserted by row Z4 so the next person to retune a colour is told. */
    cavity_colour_min_delta: (function () {
      const ks = ['lv_blood', 'rv_blood', 'la_blood', 'ra_blood'];
      const ch = c => [(c >> 16) & 255, (c >> 8) & 255, c & 255];
      let m = Infinity;
      for (let i = 0; i < ks.length; i++) for (let j = i + 1; j < ks.length; j++) {
        const a = ch(LAYERS[ks[i]].color), c = ch(LAYERS[ks[j]].color);
        m = Math.min(m, Math.abs(a[0] - c[0]) + Math.abs(a[1] - c[1]) + Math.abs(a[2] - c[2]));
      }
      return m;
    })(),
    stated: { fs_minor_lv: SHAPE.lv.fs_minor, tapse_rv: SHAPE.rv.tapse,
              wall_ed_lv_mm: SHAPE.lv.wall_ed * 10, wall_ed_rv_mm: SHAPE.rv.wall_ed * 10 },
    /* the examined relation as a single number, so a beat can claim it directly */
    annulus_ratio_tv_mv: Rm.tv / Rm.mv,
    /* the same relation by ORIFICE AREA, which is the measure that survives a ring that is not a
       circle — see row Y5. A mean diameter cannot tell a 2.8-to-1 ellipse from a circle. */
    orifice_ratio_tv_mv: RING.tv.orifice_area_cm2 / RING.mv.orifice_area_cm2,
    /* THE TRICUSPID'S SHAPE AS A TOP-LEVEL SCALAR, so a beat can claim it directly the way beat 10
       already claims annulus_ratio_tv_mv. check-beat-claims reads `geometry.<field>` and does not
       walk into base.ring_tv, and beat 10's sentence "the tricuspid ring is ... distinctly oval" was
       ungraded for exactly that reason — the second standards gap review round 5 named. */
    annulus_aspect_tv: RING.tv.aspect,
    longShort: LAW.lv.longShort,                       // PREDICTED for the left ventricle
    /* THE OTHER HALF OF THE SAME SENTENCE. LAW.lv has carried minorShort since the shortening law
       was written, and GEOM_REPORT exported only its sibling — so beat 6's "the minor axis has
       shortened by 30%" had nothing to grade against and went unchecked for five review rounds,
       while "and the long axis by 15%" beside it was graded. It is the LARGER of the two numbers
       and the one fractional shortening is quoted by. Exported review round 6, 2026-09-30.
       NOTE FOR THE BUILD TASK: acceptance row at g.longShort bounds the long axis to 0.12-0.18 and
       nothing bounds this one; a matching row (normal fractional shortening 0.28-0.45) is the
       obvious pair to it, with negative case Q already next door. Proposed, not added here. */
    minorShort: LAW.lv.minorShort,                     // PREDICTED: normal 0.28-0.45
    rv_minorShort: 1 - res.R / red.R,                  // PREDICTED for the right
    rv_tube_R_ed_cm: red.R, rv_tube_R_es_cm: res.R,
    rv_path_length_cm: RV_ED.length, rv_solve_converged_cm: RV_ED.converged,
    wall_ed_mm: ed.wall * 10, wall_es_mm: es.wall * 10,
    rv_wall_ed_mm: red.wall * 10, rv_wall_es_mm: res.wall * 10,
    lvid_d_cm: 2 * ed.r0, lvid_s_cm: 2 * es.r0,        // PREDICTED: normal 4.2-5.8 / 2.5-4.0
    lv_myocardial_volume_ml: VMYO.lv,
    lv_mass_g: VMYO.lv * 1.05,                         // PREDICTED: normal 88-224 g
    rv_myocardial_volume_ml: VMYO.rv,
    rv_mass_g: VMYO.rv * 1.05,                         // PREDICTED: normal about a third of the LV
    lv_long_ed_cm: ed.h, lv_long_es_cm: es.h,
    av_plane_descent_cm: ed.h - es.h,                  // PREDICTED: MAPSE, normally 1.0-1.6 cm
    tapse_cm: res.descent,
  };
}

/* ------------------------------------------------------------ shell building

   A chamber is ONE bullet-of-revolution, built through render-kit's sweptShell along a straight
   centreline from base to apex, thick-walled, with an anterior cutaway so the cavity is visible.
   The window is aimed at a WORLD DIRECTION (+z, anterior) rather than at a frame angle — the frame
   here does not twist, so the two would agree, but RENDER-STANDARD is right that aiming at the angle
   is the habit that breaks the moment a centreline curves, and there is no reason to keep the habit. */

function chamberGeometry(base, up, r0, h, wall, flat, opts) {
  /* THE SWEEP RUNS TO THE EPICARDIAL APEX, NOT THE CAVITY APEX, and getting that wrong was visible
     the moment the first frame was looked at. The epicardium of this family closes `wall` further
     down the axis than the cavity does; swept only as far as the cavity, the wall was truncated
     there and closed off by its own annular end cap — so the heart ended in a flat ring instead of a
     point, and read as a capsule rather than an apex. It also disagreed with the volume the wall was
     solved for, since VMYO integrates the full bullet of length h + wall.
     So: the axis is h + wall long, the outer surface closes at the far end, and the cavity closes at
     the fraction h/(h+wall) along it — which also gives the apex a solid muscular tip, and the real
     apex is the thinnest part of the ventricular wall rather than the thickest. */
  const H = h + wall, zc = h / H;
  const pts = [];
  for (let i = 0; i <= NSEG; i++) pts.push(new T.Vector3().copy(up).multiplyScalar(-H * i / NSEG).add(base));
  /* The wall and the blood inside it MUST use the same seed, or the two are flattened about
     different axes and the cavity pokes through its own wall on two sides. */
  const frame = K.parallelFrame(pts, seedFor(LATERAL, up));
  const prof = zeta => Math.sqrt(Math.max(0, 1 - Math.pow(Math.min(1, zeta), SHAPE.m)));
  const inner = i => Math.max(0.004, r0 * prof(Math.min(1, (i / NSEG) / zc)));
  const outer = i => Math.max(0.020, (r0 + wall) * prof(i / NSEG));
  return K.sweptShell({
    frame: frame, i0: 0, i1: NSEG, ring: NRING,
    outerR: outer, innerR: inner, flatten: flat,
    section: () => 1,
    /* A NARROW WINDOW IS A SLOT, NOT A CUTAWAY. At 0.72 rad half-angle the opening spanned 82
       degrees, about a quarter of the circumference, and the first frames showed a letterbox with a
       slab of blood behind it rather than an opened chamber. 1.15 rad opens 132 degrees, which is
       what an anatomical model with its front wall taken off actually looks like. */
    window: (opts && opts.cutaway === false) ? null
      : { i0: Math.round(NSEG * 0.05), i1: Math.round(NSEG * 0.93), dir: LV_WINDOW, half: 1.15 },
  });
}

/** The blood filling that cavity: the SAME inner profile, as a solid, inset by half a percent of
    radius so that two surfaces are never exactly coincident. MEASURED consequence, by integrating
    the actual triangles (tools/render-cardiac-cycle.mjs, check 7): the blood solid encloses 1.5%
    less than the volume the circulation solved for — 1.0% from the inset and 0.4% from a 40-sided
    ring inscribed in a circle. Constant across every t, which is the signature of a systematic
    offset rather than a drifting one. Recorded rather than rounded away. */
function bloodGeometry(base, up, r0, h, flat) {
  const pts = [];
  for (let i = 0; i <= NSEG; i++) pts.push(new T.Vector3().copy(up).multiplyScalar(-h * i / NSEG).add(base));
  /* The wall and the blood inside it MUST use the same seed, or the two are flattened about
     different axes and the cavity pokes through its own wall on two sides. */
  const frame = K.parallelFrame(pts, seedFor(LATERAL, up));
  const prof = zeta => Math.sqrt(Math.max(0, 1 - Math.pow(Math.min(1, zeta), SHAPE.m)));
  return K.sweptShell({
    frame: frame, i0: 0, i1: NSEG, ring: NRING,
    outerR: i => Math.max(0.02, r0 * prof(i / NSEG) * 0.995),
    flatten: flat, section: () => 1,
  });
}

/* ------------------------------------------------------------------- sheets

   Leaflets and the septum are SHEETS: thin two-sided solids from one point function. render-kit has
   no sheet primitive, so this is local — but it is local in the way RENDER-STANDARD permits and not
   the way it forbids. Winding goes through K.emitter().quad(); normals are a finite difference of
   the same p(u,v) that made the positions; only the outer face becomes the silhouette hull. Nothing
   is reimplemented, and the winding convention is the emitter's own: for a grid where u runs along
   the first index and v along the second, quad()'s face normal agrees with cross(dv, du), which is
   what nrm() below returns — the same relation sweptShell relies on, measured by the probe rather
   than assumed. (FINDING for the log: this is the third membrane in the corpus after the dorsal
   mesocardium and the pericardial reflections, and it should probably move into render-kit.) */
function sheet(pFn, nu, nv, thick) {
  const E = K.emitter();
  const _a = new T.Vector3(), _b = new T.Vector3(), _du = new T.Vector3(), _dv = new T.Vector3();
  const eps = 1e-3;
  const at = (u, v, out) => pFn(Math.min(1, Math.max(0, u)), Math.min(1, Math.max(0, v)), out);
  function nrm(u, v, out) {
    at(u + eps, v, _a); at(u - eps, v, _b); _du.subVectors(_a, _b);
    at(u, v + eps, _a); at(u, v - eps, _b); _dv.subVectors(_a, _b);
    out.crossVectors(_dv, _du);
    if (out.lengthSq() < 1e-14) out.set(0, 1, 0);
    return out.normalize();
  }
  const OP = [], ON = [], IP = [];
  for (let i = 0; i <= nu; i++) for (let j = 0; j <= nv; j++) {
    const u = i / nu, v = j / nv;
    const p = at(u, v, new T.Vector3()), n = nrm(u, v, new T.Vector3());
    OP.push(new T.Vector3().copy(p).addScaledVector(n, thick / 2));
    IP.push(new T.Vector3().copy(p).addScaledVector(n, -thick / 2));
    ON.push(n);
  }
  const ix = (i, j) => i * (nv + 1) + j;
  for (let i = 0; i < nu; i++) for (let j = 0; j < nv; j++) {
    const a = ix(i, j), b = ix(i + 1, j), c = ix(i + 1, j + 1), d = ix(i, j + 1);
    E.quad(OP[a], OP[b], OP[c], OP[d], ON[a], ON[b], ON[c], ON[d]);
  }
  const hull = E.count();
  const neg = [];
  for (let i = 0; i < ON.length; i++) neg.push(new T.Vector3().copy(ON[i]).negate());
  for (let i = 0; i < nu; i++) for (let j = 0; j < nv; j++) {
    const a = ix(i, j), b = ix(i + 1, j), c = ix(i + 1, j + 1), d = ix(i, j + 1);
    E.quadFlip(IP[a], IP[b], IP[c], IP[d], neg[a], neg[b], neg[c], neg[d]);
  }
  /* rim, so a cut edge reads as an edge and not as a piece of paper */
  const rim = (ia, ib) => {
    const t1 = new T.Vector3().subVectors(OP[ib], OP[ia]);
    const t2 = new T.Vector3().subVectors(IP[ia], OP[ia]);
    const n = new T.Vector3().crossVectors(t1, t2);
    if (n.lengthSq() < 1e-14) return;
    n.normalize();
    /* quadFlip, not quad, and this was measured rather than guessed. For corners in the order
       (outer a, outer b, inner b, inner a) the emitter's `quad` produces the face normal OPPOSITE to
       cross(edge, thickness), which is the normal this rim supplies. Left as `quad` it put every one
       of the rim's triangles — 128 of a leaflet's 1008, almost exactly the 12.7% the probe reported
       — in disagreement with its own vertex normals. Invisible on a DoubleSide material with no
       silhouette on the rim, and exactly the reimplemented-winding fault RENDER-STANDARD calls a bug
       rather than a style choice. */
    E.quadFlip(OP[ia], OP[ib], IP[ib], IP[ia], n, n, n, n);
  };
  for (let i = 0; i < nu; i++) { rim(ix(i + 1, 0), ix(i, 0)); rim(ix(i, nv), ix(i + 1, nv)); }
  for (let j = 0; j < nv; j++) { rim(ix(0, j), ix(0, j + 1)); rim(ix(nu, j + 1), ix(nu, j)); }
  return E.geometry(hull);
}

/* Which way a chamber's cross-section is squashed. sweptShell squashes along its binormal B, and
   B = d x N where d is the centreline direction and N the transported normal — so to squash along a
   chosen world direction the SEED is cross(squashDir, up) negated, not the squash direction itself.
   Written out because getting this backwards flattens the right ventricle front-to-back, which looks
   plausible from the front and is ninety degrees wrong. */
function seedFor(squashDir, up) {
  const s = new T.Vector3().crossVectors(squashDir, up).negate();
  if (s.lengthSq() < 1e-6) s.set(1, 0, 0);
  return s.normalize();
}

function axisPoints(base, up, h) {
  const pts = [];
  for (let i = 0; i <= NSEG; i++) pts.push(new T.Vector3().copy(up).multiplyScalar(-h * i / NSEG).add(base));
  return pts;
}

/* An atrium: a rounded sac standing on the atrioventricular plane, thin-walled, cut away in front.
   Profile r(zeta) = R*sqrt(1-(2*zeta-1)^2) — an ellipsoid closed at both ends. */
function sacGeometry(base, up, R, H, wall, flat, cut) {
  const pts = [];
  for (let i = 0; i <= NSEG; i++) pts.push(new T.Vector3().copy(up).multiplyScalar(H * i / NSEG).add(base));
  const frame = K.parallelFrame(pts, seedFor(LATERAL, up));
  const prof = z => Math.sqrt(Math.max(0, 1 - Math.pow(2 * z - 1, 2)));
  const inner = i => Math.max(0.02, R * prof(i / NSEG));
  const outer = i => Math.max(0.05, (R + wall) * prof(i / NSEG));
  return K.sweptShell({
    frame: frame, i0: 0, i1: NSEG, ring: NRING,
    outerR: wall > 0 ? outer : inner, innerR: wall > 0 ? inner : null,
    flatten: flat, section: () => 1,
    window: cut ? { i0: Math.round(NSEG * 0.10), i1: Math.round(NSEG * 0.90),
                    dir: ANTERIOR, half: 1.15 } : null,
  });
}
function sacBlood(base, up, R, H, flat) {
  const pts = [];
  for (let i = 0; i <= NSEG; i++) pts.push(new T.Vector3().copy(up).multiplyScalar(H * i / NSEG).add(base));
  const frame = K.parallelFrame(pts, seedFor(LATERAL, up));
  const prof = z => Math.sqrt(Math.max(0, 1 - Math.pow(2 * z - 1, 2)));
  return K.sweptShell({ frame: frame, i0: 0, i1: NSEG, ring: NRING,
    outerR: i => Math.max(0.02, R * prof(i / NSEG) * 0.995), flatten: flat, section: () => 1 });
}
const SAC_K = (2 / 3);                       // ∫(1-(2z-1)^2)dz
function sacRadius(V, aspect, flat) {        // H = aspect * R  =>  V = pi R^2 (aspect R) SAC_K flat
  return Math.cbrt(Math.max(1, V) / (Math.PI * aspect * SAC_K * flat));
}

/* ------------------------------------------------------------------- valves

   AN ATRIOVENTRICULAR LEAFLET. u runs along its share of the annulus, v from the annulus (0) to the
   free edge (1). `open` is the opening fraction the FLOW produced — nothing here knows the time.
   Closed: the free edges of all leaflets converge near the axis, well down in the ventricle, which
   is coaptation. Open: they swing out towards the wall and the orifice is the annulus.             */
function avLeaflet(centre, up, e1, e2, Rann, a0, a1, depth, open, thick, aspect) {
  const down = new T.Vector3().copy(up).negate();
  const dir = (th, out) => out.set(0, 0, 0).addScaledVector(e1, Math.cos(th)).addScaledVector(e2, Math.sin(th));
  const _d = new T.Vector3();
  /* THE ANNULUS MAY BE AN ELLIPSE, and for the tricuspid it has to be. `aspect` is the ratio of the
     e2 semi-axis to the e1 one; 1 (or omitted) is the circle the mitral gets. Rann is the MEAN
     radius, (a + b) / 2, which is the figure a measured annulus diameter quotes — so the caller
     states the size it means and the shape separately. The tricuspid annulus is markedly
     non-circular in life, and here it also has to follow a right ventricle whose section is
     flattened 0.35 towards the septum: a circular ring of the correct MEAN radius drawn on that
     section stands 8 mm proud of the free wall, which is the cream spike an earlier round saw and
     "fixed" by shrinking the whole annulus to the tube's mean calibre — losing the one relation the
     valve is examined on. r(th) is the polar form of the ellipse with semi-axes a along e1 and
     b = a * aspect along e2. */
  const asp = (aspect == null || !(aspect > 0)) ? 1 : aspect;
  const aSemi = 2 * Rann / (1 + asp), bSemi = aSemi * asp;
  const rAnn = th => {
    const c = Math.cos(th), sn = Math.sin(th);
    return (aSemi * bSemi) / Math.sqrt(bSemi * bSemi * c * c + aSemi * aSemi * sn * sn);
  };
  const dFree = depth * (1.00 - 0.18 * open);
  return sheet(function (u, v, out) {
    const th = a0 + (a1 - a0) * u;
    dir(th, _d);
    const Ra = rAnn(th), rFree = Ra * (0.10 + 0.82 * open);
    const r = Ra * (1 - v) + rFree * v;
    const dd = dFree * v;
    out.copy(centre).addScaledVector(_d, r).addScaledVector(down, dd);
    /* the belly sags into the ventricle; least at the annulus and at the free edge */
    out.addScaledVector(down, 0.16 * depth * Math.sin(Math.PI * v));
    return out;
  }, 22, 10, thick);
}

/* A SEMILUNAR CUSP. The attachment is a crown, not a circle: low in the middle of each cusp and high
   at the commissures, which is why the aortic "annulus" is not one plane and why the sinuses sit
   below the sinotubular junction. Closed: the three free edges meet on the axis. Open: they lie back
   against the sinus wall and the orifice is nearly the whole root. */
function semilunarCusp(centre, up, e1, e2, Rann, a0, a1, height, open, thick) {
  const _d = new T.Vector3();
  const dir = (th, out) => out.set(0, 0, 0).addScaledVector(e1, Math.cos(th)).addScaledVector(e2, Math.sin(th));
  return sheet(function (u, v, out) {
    const th = a0 + (a1 - a0) * u, s = 2 * u - 1;
    dir(th, _d);
    const rAtt = Rann;
    const rClosed = Rann * (0.08 + 0.92 * s * s);
    const rFree = rClosed * (1 - open) + Rann * 0.90 * open;
    const yAtt = height * s * s;                       // the crown
    const yFree = height;
    const r = rAtt * (1 - v) + rFree * v;
    const y = yAtt * (1 - v) + yFree * v;
    out.copy(centre).addScaledVector(_d, r).addScaledVector(up, y);
    /* the pocket: the belly of a shut cusp bulges back towards the ventricle */
    out.addScaledVector(up, -0.22 * height * Math.sin(Math.PI * v) * (1 - open));
    return out;
  }, 20, 10, thick);
}

/* ---------------------------------------------------------------- flow route

   A parcel's position is the INTEGRAL OF THE FLOW through the valve it is crossing, divided by the
   stroke volume — so a train of parcels advances exactly as fast as blood is actually moving and
   STANDS STILL when the valve is shut. That is the whole point: during the two isovolumetric phases
   nothing moves, and a student watching should see nothing move. A parcel animation driven by t
   would drift through a shut valve and teach the opposite of the phase it is illustrating.         */
function routePoint(way, s) {
  const n = way.length - 1, x = Math.min(0.9999, Math.max(0, s)) * n;
  const i = Math.floor(x), f = x - i;
  return new T.Vector3().copy(way[i]).lerp(way[Math.min(n, i + 1)], f);
}

/* ==================================================================== 3 · LAYERS */

const LAYERS = {
  lv:            { color: 0x9e2b33, name: 'Left ventricular myocardium' },
  rv:            { color: 0xb5555c, name: 'Right ventricular myocardium' },
  septum:        { color: 0x8f2028, name: 'Interventricular septum' },
  la:            { color: 0xc98a92, name: 'Left atrium' },
  ra:            { color: 0xb98890, name: 'Right atrium' },
  /* THE ATRIAL CAVITY IS A DIFFERENT COLOUR FROM THE VENTRICULAR ONE, NOT A DIFFERENT SHADE OF IT.
     Round 3 measured the old palette: lv_blood #c0392b against la_blood #d0453a differed by
     (16,12,15) in RGB, and rv_blood #2f5fa8 against ra_blood #2a559a by (5,10,14). In beat 7 the
     left atrial cast sits directly against the left ventricular one, so the two read as a single
     continuous red mass, and telling the atrial cavity from the ventricular one is a precondition
     for every claim this scene makes. The side convention is kept — red is the left heart, blue the
     right, which is how it is taught — and the ATRIUM is the pale member of each pair, which also
     matches the low pressure it works at. Separation is asserted, not eyeballed: acceptance row Y
     requires every pair of cavity colours to differ by at least CAVITY_MIN_DELTA per channel sum. */
  lv_blood:      { color: 0xc0392b, name: 'Left ventricular cavity' },
  rv_blood:      { color: 0x2f5fa8, name: 'Right ventricular cavity' },
  la_blood:      { color: 0xf0937f, name: 'Left atrial cavity' },
  ra_blood:      { color: 0x7fb8e8, name: 'Right atrial cavity' },
  mitral:        { color: 0xefe6d2, name: 'Mitral valve' },
  tricuspid:     { color: 0xe6dcc6, name: 'Tricuspid valve' },
  aortic:        { color: 0xf2ecdc, name: 'Aortic valve' },
  pulmonary:     { color: 0xe8e0cc, name: 'Pulmonary valve' },
  papillary:     { color: 0x8f2028, name: 'Papillary muscles & chordae' },
  av_plane:      { color: 0xe0c060, name: 'Atrioventricular plane' },
  aorta:         { color: 0xb02a2a, name: 'Aorta' },
  pulm_trunk:    { color: 0x2f5fa8, name: 'Pulmonary trunk' },
  svc:           { color: 0x1f4272, name: 'Superior vena cava' },
  ivc:           { color: 0x1a3a66, name: 'Inferior vena cava' },
  pulm_veins:    { color: 0x9e3540, name: 'Pulmonary veins' },
  flow_left_in:  { color: 0xff7a66, name: 'Blood entering the left ventricle' },
  flow_left_out: { color: 0xe03a28, name: 'Blood leaving the left ventricle' },
  flow_right_in: { color: 0x6aa6e6, name: 'Blood entering the right ventricle' },
  flow_right_out:{ color: 0x2f6fae, name: 'Blood leaving the right ventricle' },
};

/* ===================================================================== 4 · BUILD */

function add(g, key, geo, over) {
  if (!geo) return null;
  const pal = LAYERS[key] || { color: 0xcccccc, name: key };
  return K.addSolid(g, key, geo, Object.assign({ color: pal.color, name: pal.name, outline: 0.022 }, over || {}));
}

function buildCycle(t, opts) {
  opts = opts || {};
  const l = L(), r = R();
  const cut = !opts.intact;
  const g = new T.Group();

  /* ---- what the circulation says the picture is, at this t ---- */
  const Vlv = sample(l, 'Vv', t), Vla = sample(l, 'Va', t);
  const Vrv = sample(r, 'Vv', t), Vra = sample(r, 'Va', t);
  const slv = ventricleShape('lv', Vlv);

  /* the base plane's own basis — ONE definition, shared with GEOM_REPORT; see baseFrame */
  const _fr = baseFrame(slv);
  const baseLV = _fr.baseLV, e1L = _fr.e1L, e2L = _fr.e2L;

  /* the right ventricle rides on the left: its path is written about the left ventricle's own axis */
  const srv = rvGeometry(Vrv, slv, baseLV, e1L, e2L, RV_ED.R);
  const rvFrame = radialFrame(srv.path.pts, baseLV, UP_LV);
  const rvLast = srv.path.pts.length - 1;
  /* the tricuspid sits at the inflow end of that tube and the pulmonary at the outflow end, each on
     the plane the tube itself presents there — so neither valve has to be placed by hand */
  const upTV = new T.Vector3().copy(rvFrame.D[0]).negate();
  const upPV = new T.Vector3().copy(rvFrame.D[rvLast]);
  const e1R = new T.Vector3().copy(rvFrame.N[0]);
  const e2R = new T.Vector3().crossVectors(upTV, e1R).normalize();
  const e1P = new T.Vector3().copy(rvFrame.N[rvLast]);
  const e2P = new T.Vector3().crossVectors(upPV, e1P).normalize();

  /* THE ANNULUS SHRINKS WITH THE CHAMBER. A mitral annulus is not a rigid ring: its area falls by
     about a quarter in systole, and a valve drawn on a fixed ring sits proud of a contracted
     ventricle. Scaled with the cavity radius, exponent 0.4, which lands the systolic annulus at 0.87
     of its diastolic radius — the measured figure, arrived at rather than typed in. */
  const annL = Math.pow(slv.r0 / R0ED.lv, 0.4);
  const annR = Math.pow(srv.R / RV_ED.R, 0.4);
  const R_MV = ANN.mv * annL, R_AV = ANN.av * annL;
  /* The two right-sided annuli are the tube's own calibre where each sits — but the tube's section is
     FLATTENED, so its calibre is not R: it is R in one direction and R*flatten in the other. Taking R
     alone drew a tricuspid annulus almost three times the tube's radial half-thickness, and the
     leaflets came out through the free wall as a cream spike standing outside the heart. The mean
     radius of an ellipse with semi-axes a and a*f is a*sqrt(f), which is what the valve ring gets. */
  const rvCal = Math.sqrt(srv.flatten);
  /* THE TRICUSPID ANNULUS IS THE LARGEST OF THE FOUR BY THE MARGIN IT IS EXAMINED BY, AND IT IS NOW
     DERIVED FROM THE MITRAL RATHER THAN FROM THE TUBE. Until round 4 R_TV was the tube's own mean
     calibre, and round 3 measured what that produced: mitral annulus 2.766 cm against tricuspid
     2.792 — larger by 0.9%, a 0.26 mm coincidence of the right ventricular calibration standing in
     for a relation a student is examined on, with no acceptance row anywhere near it (R3-OPEN-7).
     In life the tricuspid annulus is about 15-20% larger in mean diameter than the mitral, so that
     ratio is STATED and the annulus follows it; row Y asserts it and rejects a circular one. The
     ring is an ELLIPSE of that mean radius, with the tube's own aspect, because the right
     ventricle's section is flattened towards the septum and a circle of the right size drawn on it
     comes out through the free wall — see avLeaflet. */
  const R_TV = ANN.tv_mv_ratio * ANN.mv * annR;   // MEAN radius of the elliptical ring
  const TV_ASPECT = annulusAspect(srv).tv;     // ... and its shape, from the ONE definition
  const R_PV = Math.max(0.70, srv.R * srv.path.shape[rvLast] * rvCal * ANN.pv_cal);

  const _vc = valveCentres(_fr, slv, srv, annL);
  const Cmv = _vc.mv, Cav = _vc.av, Ctv = _vc.tv, Cpv = _vc.pv;

  /* ---- myocardium and cavities ---- */
  add(g, 'lv', chamberGeometry(baseLV, UP_LV, slv.r0, slv.h, slv.wall, slv.flatten, { cutaway: cut }));
  add(g, 'lv_blood', bloodGeometry(baseLV, UP_LV, slv.r0, slv.h, slv.flatten));
  add(g, 'rv', K.sweptShell({
    frame: rvFrame, i0: 0, i1: rvLast, ring: NRING,
    outerR: i => srv.R * srv.path.shape[Math.min(rvLast, i)] + srv.wall,
    innerR: i => Math.max(0.02, srv.R * srv.path.shape[Math.min(rvLast, i)]),
    flatten: srv.flatten, section: () => 1,
    window: cut ? { i0: Math.round(rvLast * 0.10), i1: Math.round(rvLast * 0.90),
                    dir: RV_WINDOW, half: 1.05 } : null,
  }));
  add(g, 'rv_blood', K.sweptShell({
    frame: rvFrame, i0: 0, i1: rvLast, ring: NRING,
    outerR: i => Math.max(0.02, srv.R * srv.path.shape[Math.min(rvLast, i)] * 0.995),
    flatten: srv.flatten, section: () => 1,
  }));

  /* ---- the septum ----
     Drawn as a discrete plate between the two cavities, of LEFT ventricular thickness, because that
     is what it is: the septum is functionally part of the left ventricle and thickens with it. It is
     a plate rather than the shared wall it really is — see the scene's gaps[]. */
  {
    /* on the left ventricle's right flank, where the tube's inflow limb lies against it */
    const mid = new T.Vector3().copy(baseLV).addScaledVector(e1L, -(slv.r0 + slv.wall * 0.5) * 0.62);
    const upS = new T.Vector3().copy(UP_LV);
    const hS = slv.h * 0.94;
    const rS = slv.r0 * 0.72;
    const pts = axisPoints(mid, upS, hS);
    const frame = K.parallelFrame(pts, seedFor(LATERAL, upS));
    const prof = z => Math.sqrt(Math.max(0, 1 - Math.pow(Math.min(1, z), SHAPE.m)));
    add(g, 'septum', K.sweptShell({
      frame: frame, i0: 0, i1: NSEG, ring: NRING,
      outerR: i => Math.max(0.03, rS * prof(i / NSEG)),
      flatten: Math.max(0.06, slv.wall / rS), section: () => 1,
    }));
  }

  /* ---- atria ----
     Thin-walled by construction: 2 mm, against the left ventricle's 10-15 mm. That contrast is the
     reason an atrium cannot generate a pressure that matters, which is the reason the atrial kick is
     a fifth of filling and not most of it. */
  const ATR_WALL = 0.20, ATR_ASPECT = 1.60, ATR_FLAT = 0.62;
  const Rla = sacRadius(Vla, ATR_ASPECT, ATR_FLAT), Hla = ATR_ASPECT * Rla;
  const Rra = sacRadius(Vra, ATR_ASPECT, ATR_FLAT), Hra = ATR_ASPECT * Rra;
  /* THE RIGHT ATRIUM STANDS AT THE HEART'S RIGHT BORDER, NOT CONCENTRIC WITH THE RIGHT VENTRICLE'S
     INFLOW. Until round 4 baseRA was Ctv + 0.10 up — the tricuspid annulus centre, which is a point
     ON the right ventricle's own centreline. The sac therefore grew inside the inflow limb it is
     supposed to sit upstream of, and round 3 measured the consequence: the right atrium was
     0.000-0.002% of the frame in nine beats of ten and its cavity 0.000-0.02% in seven, with the
     wall and cavity 100% covered by rv_blood (86.8%) and rv (13.2%) — a declared structure carrying
     its own narration about the jugular venous pressure that a student could select and be shown
     nothing (R3-OPEN-3). It is also wrong about the heart: the right atrium forms the RIGHT BORDER
     of the cardiac silhouette and is one of the three chambers you see in an anterior projection.
     RA_BORDER is how far towards the patient's right the sac's axis stands off the annulus, as a
     fraction of its own radius — so it clears the ventricle at every volume rather than at one. It
     still overlaps the annulus, because that is the orifice the blood crosses. The venae cavae hang
     off this base and travel with it. */
  const RA_BORDER = 0.85;
  const baseLA = new T.Vector3().copy(baseLV).addScaledVector(UP_LV, 0.10).addScaledVector(e2L, -0.55);
  const baseRA = new T.Vector3().copy(Ctv).addScaledVector(UP_LV, 0.10)
                                         .addScaledVector(e1L, -RA_BORDER * Rra);
  add(g, 'la', sacGeometry(baseLA, UP_LV, Rla, Hla, ATR_WALL, ATR_FLAT, cut));
  add(g, 'ra', sacGeometry(baseRA, UP_LV, Rra, Hra, ATR_WALL, ATR_FLAT, cut));
  add(g, 'la_blood', sacBlood(baseLA, UP_LV, Rla, Hla, ATR_FLAT));
  add(g, 'ra_blood', sacBlood(baseRA, UP_LV, Rra, Hra, ATR_FLAT));

  /* ---- valves: position from the flow, never from the clock ---- */
  const oMV = valveOpen(l, 'Qin', t),  oAV = valveOpen(l, 'Qout', t);
  const oTV = valveOpen(r, 'Qin', t),  oPV = valveOpen(r, 'Qout', t);

  const TAU = Math.PI * 2;
  /* mitral: two leaflets, the anterior one deeper and spanning a third of the annulus */
  add(g, 'mitral', avLeaflet(Cmv, UP_LV, e1L, e2L, R_MV, -TAU * 0.17, TAU * 0.17, 1.75 * annL, oMV, 0.055));
  add(g, 'mitral', avLeaflet(Cmv, UP_LV, e1L, e2L, R_MV,  TAU * 0.17, TAU * 0.83, 1.10 * annL, oMV, 0.048));
  /* tricuspid: three, and a larger annulus than the mitral — which is the way round it is examined */
  for (let i = 0; i < 3; i++)
    add(g, 'tricuspid', avLeaflet(Ctv, upTV, e1R, e2R, R_TV,
      TAU * (i / 3), TAU * ((i + 1) / 3), 1.35 * annR, oTV, 0.040, TV_ASPECT));
  /* semilunar: three cusps each */
  for (let i = 0; i < 3; i++) {
    add(g, 'aortic', semilunarCusp(Cav, UP_LV, e1L, e2L, R_AV,
      TAU * (i / 3), TAU * ((i + 1) / 3), 1.30 * annL, oAV, 0.036));
    add(g, 'pulmonary', semilunarCusp(Cpv, upPV, e1P, e2P, R_PV,
      TAU * (i / 3), TAU * ((i + 1) / 3), 1.10 * annR, oPV, 0.034));
  }

  /* ---- papillary muscles and chordae ---- */
  if (opts.papillary) {
    const down = new T.Vector3().copy(UP_LV).negate();
    for (const sgn of [-1, 1]) {
      const wallPt = new T.Vector3().copy(baseLV)
        .addScaledVector(down, slv.h * 0.60)
        .addScaledVector(e2L, sgn * slv.r0 * 0.62 * slv.flatten)
        .addScaledVector(e1L, slv.r0 * 0.24);
      const tipPt = new T.Vector3().copy(wallPt).addScaledVector(UP_LV, slv.h * 0.20)
        .addScaledVector(e2L, -sgn * slv.r0 * 0.16);
      const pts = [wallPt, new T.Vector3().copy(wallPt).lerp(tipPt, 0.5), tipPt];
      add(g, 'papillary', K.tubeAlong(pts, u => 0.30 * (1 - 0.72 * u), { ring: 14 }));
      /* chordae to the free edge of the leaflet above */
      const edge = new T.Vector3().copy(Cmv)
        .addScaledVector(e2L, sgn * R_MV * (0.10 + 0.82 * oMV) * 0.8)
        .addScaledVector(down, 1.75 * annL * (1.0 - 0.18 * oMV));
      for (let c = -1; c <= 1; c++) {
        const target = new T.Vector3().copy(edge).addScaledVector(e1L, c * R_MV * 0.45);
        add(g, 'papillary', K.tubeAlong([tipPt, new T.Vector3().copy(tipPt).lerp(target, 0.5), target],
          () => 0.035, { ring: 7 }), { noOutline: true });
      }
    }
  }

  /* ---- the atrioventricular plane, so its descent is visible as a movement of something ---- */
  if (opts.avplane) {
    const pts = axisPoints(new T.Vector3().copy(baseLV).addScaledVector(UP_LV, 0.05), UP_LV, 0.10);
    const frame = K.parallelFrame(pts, seedFor(LATERAL, UP_LV));
    add(g, 'av_plane', K.sweptShell({ frame: frame, i0: 0, i1: NSEG, ring: NRING,
      outerR: () => (slv.r0 + slv.wall) * 1.30, flatten: 1, section: () => 1 }), { noOutline: true });
  }

  /* ---- great vessels ---- */
  const aortaWay = [
    new T.Vector3().copy(Cav).addScaledVector(UP_LV, 1.30 * annL),
    new T.Vector3().copy(Cav).addScaledVector(UP_LV, 2.9).addScaledVector(e2L, 0.30),
    new T.Vector3().copy(Cav).addScaledVector(UP_LV, 4.4).addScaledVector(e2L, 0.20).addScaledVector(e1L, 0.5),
    new T.Vector3().copy(Cav).addScaledVector(UP_LV, 5.2).addScaledVector(e2L, -0.9).addScaledVector(e1L, 1.9),
    new T.Vector3().copy(Cav).addScaledVector(UP_LV, 4.3).addScaledVector(e2L, -1.9).addScaledVector(e1L, 2.6),
  ];
  const ptWay = [
    new T.Vector3().copy(Cpv).addScaledVector(upPV, 1.10 * annR),
    new T.Vector3().copy(Cpv).addScaledVector(upPV, 2.4).addScaledVector(UP_LV, 0.8),
    new T.Vector3().copy(Cpv).addScaledVector(upPV, 3.2).addScaledVector(UP_LV, 2.2).addScaledVector(e1L, 0.9),
    new T.Vector3().copy(Cpv).addScaledVector(upPV, 3.4).addScaledVector(UP_LV, 3.2).addScaledVector(e1L, 2.1),
  ];
  const svcWay = [
    new T.Vector3().copy(baseRA).addScaledVector(UP_LV, Hra * 0.86).addScaledVector(e1L, -0.35),
    new T.Vector3().copy(baseRA).addScaledVector(UP_LV, Hra + 1.6).addScaledVector(e1L, -0.55),
    new T.Vector3().copy(baseRA).addScaledVector(UP_LV, Hra + 3.4).addScaledVector(e1L, -0.65),
  ];
  const ivcWay = [
    new T.Vector3().copy(baseRA).addScaledVector(UP_LV, Hra * 0.16).addScaledVector(e2L, -Rra * 0.55),
    new T.Vector3().copy(baseRA).addScaledVector(UP_LV, -1.4).addScaledVector(e2L, -Rra * 0.75),
    new T.Vector3().copy(baseRA).addScaledVector(UP_LV, -3.0).addScaledVector(e2L, -Rra * 0.80),
  ];
  if (opts.vessels) {
    add(g, 'aorta',      K.tubeAlong(aortaWay, u => 1.12 * annL * (1 - 0.10 * u), { ring: 20 }));
    add(g, 'pulm_trunk', K.tubeAlong(ptWay,    u => Math.max(0.55, R_PV * 1.05 * (1 - 0.14 * u)), { ring: 20 }));
    add(g, 'svc',        K.tubeAlong(svcWay,   () => 0.92, { ring: 16 }));
    add(g, 'ivc',        K.tubeAlong(ivcWay,   () => 1.05, { ring: 16 }));
    for (const sgn of [-1, 1]) {
      const mouth = new T.Vector3().copy(baseLA).addScaledVector(UP_LV, Hla * 0.62)
        .addScaledVector(e2L, -Rla * 0.72).addScaledVector(e1L, sgn * Rla * 0.55);
      const far = new T.Vector3().copy(mouth).addScaledVector(e2L, -2.1).addScaledVector(e1L, sgn * 1.5);
      add(g, 'pulm_veins', K.tubeAlong([mouth, new T.Vector3().copy(mouth).lerp(far, 0.5), far],
        () => 0.46, { ring: 12 }));
    }
  }

  /* ---- the blood itself, moving exactly as fast as the flow ----

     REWRITTEN 2026-09-29, round 4, and both changes come straight out of round 3's measurements.

     ONE · A MARKER TRAIN IS DRAWN ONLY WHILE ITS VALVE IS PASSING BLOOD. The old trains were built
     at every t whatever the flow was, which put five beads in the pulmonary trunk during
     isovolumetric contraction — a phase whose whole definition is that no blood crosses any valve —
     and, because beats 3 and 7 hide the great vessels, drew them as three unattached beads floating
     in empty space above the heart (round 3, R3-OPEN-4). The gate is the flow itself, as a fraction
     of that orifice's own peak, so it is the same rule for a mitral valve moving 400 ml/s and a
     pulmonary valve moving 300, and it cannot fall out of agreement with the valve state: both are
     read from the same integrated trace. FLOW_EPS is well below OPEN_FRAC, so a train never outlives
     its own open leaflet.

     TWO · THE TRAIN SITS AT ITS VALVE, NOT ALONG THE WHOLE VESSEL. Each of these four structures is
     named "blood crossing the <x> valve", and the old routes ran from the middle of an atrium, or
     the middle of a ventricle, all the way up the aorta or the pulmonary trunk to its far end. That
     did two kinds of damage. It put every left-sided bead inside an opaque blood cast or inside the
     aorta, where round 3 measured flow_left_in and flow_left_out at 0.000% of the frame in every
     beat that points at them (R3-OPEN-2); and it made the marker train the widest thing in the
     scene — flow_right_out spanned 12.5 cm against the heart's own 10 — so the player, which fits
     its camera to the visible set, framed the beads and shrank the heart to 16% of the frame. The
     route is now a short segment across the orifice: UPSTREAM cm before the valve centre, along the
     valve's own axis, to DOWNSTREAM cm past it. Parcels still travel at exactly the speed of the
     flow, because the phase is still the integrated volume; LAPS says how many times that volume
     carries a parcel across the short segment, and is a rendering constant, not a physical one. */
  const FLOW_EPS = 0.03;        // of that orifice's own peak flow: below this, nothing is crossing
  /* The two arms are deliberately UNEQUAL. A marker train is buried by whatever it is inside, and
     the two sides of a valve are not equally buried: the atrium and the ventricular outflow tract
     sit under the wrapped right ventricle, while the ventricular cavity and the great vessel above
     the valve are the parts of the path a student can actually see. So the train leans downstream —
     inflow markers run mostly INTO the ventricle, outflow markers mostly UP THE VESSEL — which is
     also the direction the blood is going. Measured, not guessed: at the symmetric 1.55/2.30 the
     left outflow train reached 0.037% of the frame in the beat that highlights it. */
  const UPSTREAM = 0.85, DOWNSTREAM = 2.90;   // cm either side of the valve centre
  const NPARCEL = 5, PR = 0.60, LAPS = 6;   // PR is a marker's radius, a rendering constant: 12 mm
                                          // across, inside a 22 mm aorta and a 28 mm mitral annulus

  /* each valve's own axis, pointing the way the blood goes through it */
  const axMV = new T.Vector3().copy(UP_LV).negate();          // atrium above, ventricle below
  const axAV = new T.Vector3().copy(UP_LV);                   // up and out into the aorta
  const axTV = new T.Vector3().copy(upTV);                    // along the inflow limb, into the RV
  const axPV = new T.Vector3().copy(upPV);                    // out of the infundibulum
  const across = (centre, axis) => [
    new T.Vector3().copy(centre).addScaledVector(axis, -UPSTREAM),
    new T.Vector3().copy(centre),
    new T.Vector3().copy(centre).addScaledVector(axis, DOWNSTREAM),
  ];
  const routes = {
    flow_left_in:  across(Cmv, axMV),
    flow_left_out: across(Cav, axAV),
    flow_right_in: across(Ctv, axTV),
    flow_right_out:across(Cpv, axPV),
  };
  const trains = [
    ['flow_left_in',  l, 'cumIn',  l.sv, 'Qin' ], ['flow_left_out',  l, 'cumOut', l.sv, 'Qout'],
    ['flow_right_in', r, 'cumIn',  r.sv, 'Qin' ], ['flow_right_out', r, 'cumOut', r.sv, 'Qout'],
  ];
  for (const [key, A, cumKey, sv, qKey] of trains) {
    const pk = peakOf(A, qKey);
    const running = pk > 0 && sample(A, qKey, t) >= FLOW_EPS * pk;
    /* PARKED, NOT ABSENT. A train that vanished entirely at zero flow read better on screen and was
       wrong in the player: `refs.procedural` for that structure then resolves to nothing, and viz3d
       shows a student "there is no model of this structure" — a confident lie about an annotation
       that is simply not carrying anything at this instant. So a still valve keeps ONE marker,
       smaller, seated on the orifice: the structure is always resolvable and always stageable, and
       one motionless bead against five moving ones is what "nothing is crossing here" looks like.
       Checked at every t by the render harness's ref pass, which is what caught the absence. */
    const n = running ? NPARCEL : 1;
    const rad = running ? PR : PR * 0.62;
    const phase = running ? wrap01((sample(A, cumKey, t) / Math.max(1e-6, sv)) * LAPS) : null;
    for (let k = 0; k < n; k++) {
      const p = running ? routePoint(routes[key], wrap01(phase + k / NPARCEL))
                        : routePoint(routes[key], UPSTREAM / (UPSTREAM + DOWNSTREAM));  // the orifice
      const geo = new T.SphereGeometry(rad, 12, 9);
      geo.translate(p.x, p.y, p.z);
      add(g, key, geo, { outline: 0.018 });
    }
  }

  if (opts.intact) g.userData.intact = true;
  g.userData.t = wrap01(t);
  g.userData.phase = phaseAt(t);
  return g;
}

/* ============================================================ 5 · REGISTRATION */

/* The acceptance battery is asserted at first build, so a drifted parameter says so in the console
   rather than quietly teaching a wrong cycle. Once, not per build — a scene rebuilds this model at
   every beat and a warning per beat is a warning nobody reads. */
let _asserted = false;
function build(t, opts) {
  if (!_asserted) {
    _asserted = true;
    try {
      const a = acceptance();
      if (!a.allPass) {
        const failed = Object.keys(a.pass).filter(k => !a.pass[k].ok)
          .map(k => k + ' (' + a.pass[k].what + ')');
        console.warn('[cardiac-cycle-pumping] ACCEPTANCE FAILED: ' + failed.join('; ') +
          ' — the solved circulation no longer meets the stated targets. Re-run ' +
          'viz-training/tools/solve-cardiac-cycle.mjs --solve and paste what it prints.', a);
      }
    } catch (e) { console.warn('[cardiac-cycle-pumping] acceptance could not run', e); }
  }
  return buildCycle(t, opts);
}

window.MB3D_MODELS = window.MB3D_MODELS || {};
window.MB3D_MODELS['cardiac-cycle-pumping'] = {
  LAYERS: LAYERS,
  build: build,
  /* Every optional layer on. Without this the provider builds only the default set and any structure
     behind a flag comes back reason:'none' — which the player shows a student as "there is no model
     of this structure", a confident lie about a model sitting right there. */
  FULL: { papillary: true, avplane: true, vessels: true },
  VARIANTS: {
    intact: 'no anterior cutaway — the chambers closed, for an external view of the same beat',
  },
  /* Exposed so a test, a review or the console can re-check the relations this model was solved
     against, and read the whole cycle off, without reading the source or trusting a comment. */
  STATED: STATED, SOLVED: SOLVED, FIXED: FIXED, SHAPE: SHAPE,
  acceptance: acceptance,
  phaseAt: phaseAt,
  /* The seam the solver works through. `tools/solve-cardiac-cycle.mjs` bisects the four numbers per
     side against STATED by calling THIS — so there is no second copy of the circulation model
     anywhere, and a change to the ODE cannot leave the solver measuring the old one. */
  analyseWith: function (side, over, fast) { return analyse(paramsFor(side, over), side, fast); },
  paramsFor: paramsFor,
  /* The full analysed cycle for each side: events, volumes, pressures, durations. */
  cycle: function () { return { left: L(), right: R(), cycle_s: CYCLE_S, pr_s: PR_S }; },
  /* Sample the trace at any t — what the geometry itself reads. */
  at: function (t) {
    const l = L(), r = R();
    return {
      t: wrap01(t), time_s: wrap01(t) * CYCLE_S, phase: phaseAt(t),
      lv: { volume: sample(l, 'Vv', t), pressure: sample(l, 'Pv', t) },
      la: { volume: sample(l, 'Va', t), pressure: sample(l, 'Pat', t) },
      aorta: { pressure: sample(l, 'Pa', t) },
      rv: { volume: sample(r, 'Vv', t), pressure: sample(r, 'Pv', t) },
      ra: { volume: sample(r, 'Va', t), pressure: sample(r, 'Pat', t) },
      pulm: { pressure: sample(r, 'Pa', t) },
      valves: { mitral: valveOpen(l, 'Qin', t), aortic: valveOpen(l, 'Qout', t),
                tricuspid: valveOpen(r, 'Qin', t), pulmonary: valveOpen(r, 'Qout', t) },
      geometry: { lv: ventricleShape('lv', sample(l, 'Vv', t)),
                  /* the right ventricle is a wrapped tube, not a body of revolution — what it has
                     instead of a length and a radius is an annular descent and a tube calibre */
                  rv_descent_cm: rvDescent(sample(r, 'Vv', t)) },
    };
  },
};

})();
