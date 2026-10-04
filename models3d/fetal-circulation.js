/* MedBank · fetal circulation — PRODUCTION procedural model.
 *
 * Registers itself as MB3D_MODELS['fetal-circulation']. The contract the procedural provider in
 * viz3d.js depends on is a LAYERS palette and build(t, opts) -> THREE.Group whose meshes carry
 * userData.key.
 *
 * WRAPPED IN AN IIFE. Only the registration escapes. RENDER-STANDARD: a model written at top level
 * puts T, K, C, LAYERS and every constant into global lexical scope, and the next model to load —
 * written the obvious way, `const T = window.THREE` — dies on "Identifier 'T' has already been
 * declared" and takes the page with it.
 *
 * ─────────────────────────────────────────────────────────────────────────────────────────────────
 * WHAT t MEANS.  t = 0 is the last moment of fetal life, the instant before the first breath.
 * t = 1 is six weeks after birth. In between, t is LOG TIME since the first breath:
 *
 *     tau(t) = 10^(S·t) - 1   minutes,   S = log10(1 + 60480) = 4.78162
 *
 * so t = 0 is tau = 0 exactly (no discontinuity at birth), t = 0.163 is five minutes,
 * t = 0.373 is one hour, t = 0.601 is twelve and a half hours, t = 0.807 is five days,
 * t = 1 is six weeks. A log clock is the only one on which this process is legible: the foramen
 * ovale shuts in minutes, the duct in hours, the ductus venosus in days, and the pulmonary bed
 * finishes remodelling in weeks. On a linear clock four of the five events happen in the first pixel.
 *
 * WHY THE CLOCK IS A STRAIGHT LINE IN t.  Writing tau(t) that way makes log10(1 + tau) EXACTLY S·t,
 * so every closure curve below is a logistic in t with no special case at tau = 0 — which is what a
 * naive logistic in log(tau) cannot have, and the reason a plateau segment is not needed.
 *
 * ─────────────────────────────────────────────────────────────────────────────────────────────────
 * THE PARAMETER THAT DECIDES THE EXAMINABLE RELATION — and it is not the geometry.
 *
 * RENDER-STANDARD §3: "ask which number a student would be marked wrong for, and solve THAT one".
 * For fetal circulation there are two, and neither is a shape:
 *
 *   1. THE OXYGEN ORDER.  Umbilical vein highest, then the inferior caval stream, then the left
 *      heart and the ascending aorta, then the descending aorta below the duct, and the umbilical
 *      arteries lowest. A student is marked wrong for putting the descending aorta above the
 *      ascending one. So the saturations in this model are not a colour ramp somebody picked: they
 *      are the solution of an oxygen mass balance over the flows, with ONE free parameter (whole-body
 *      oxygen extraction) solved by bisection against the number the scene's own narration states —
 *      "into the right atrium at about seventy percent".
 *
 *   2. THE DIRECTION OF THE DUCT.  Right-to-left before birth, left-to-right in a persistent duct
 *      after it, and the reason is that the two resistances swap places. So the flows are not
 *      asserted either: they are the solution of a six-node resistive network whose pulmonary and
 *      placental conductances are functions of t. The duct reverses in this model because the
 *      arithmetic reverses it. Nothing anywhere says "now draw the arrow the other way".
 *
 * The corollary, which is the whole reason this is not a diagram: EVERY COLOUR AND EVERY ARROW IN
 * THIS MODEL IS AN OUTPUT. Change the pulmonary resistance and the picture rearranges itself.
 *
 * ─────────────────────────────────────────────────────────────────────────────────────────────────
 * AXES. +x = fetus's LEFT, -x = RIGHT, +y = CRANIAL, +z = VENTRAL.
 * MEASURED, not assumed, on 2026-09-11 from three BodyParts3D right/left pairs in
 * viz-training/meshes-lite — tenth rib (FMA8445/FMA8472), hip bone (FMA16586/FMA16587) and kidney
 * (FMA7204/FMA7205). Mean vertex x: right -80.40/-65.19/-63.32, left +78.39/+66.52/+53.20. RIGHT is
 * negative x in the source data, in all three pairs. viz3d.js line 2133 puts the 'anterior' camera at
 * [0,0,1], so +z is ventral; +y cranial follows. ACCEPTANCE test H asserts the sign on the built
 * geometry, because a comment is not checked by anything.
 *
 * SCALE. One unit is roughly one centimetre of a term fetus. Nothing depends on it — fitCamera frames
 * whatever is built — but the proportions are kept honest so the picture is readable as a fetus.
 *
 * GEOMETRY NOTE. Vessels are SOLID tubes (K.tubeAlong), chambers and organs are closed blobs, and the
 * atrial septum is the one sheet: it tapers to nothing at both its rims, per RENDER-STANDARD's
 * membrane rule, so its free edge reads as an edge and not as a slab of card. The foramen ovale is a
 * real hole through that sheet and the septum primum flap is a separate leaf whose ANGLE is driven by
 * the solved atrial pressure difference — so the flap does not close because a constant says it is
 * time, it closes because the model computed that left atrial pressure has overtaken right.
 */
(function () {

const T = window.THREE;
const K = window.VizKit;   // render-kit.js must load first — it owns winding, normals and colour
const C = K.C;

/* ───────────────────────────────────────────────────────────────────────── the legend palette

   These are the ANATOMICAL colours, used for the legend and for opts.plain. By default a vessel is
   painted with its SOLVED oxygen saturation instead (SAT_COLD -> SAT_WARM below), because the
   saturation is the subject of this scene. opts.plain restores these.                             */
const LAYERS = {
  placenta:          { color: 0x8e3b4e, name: 'Placenta' },
  umbilical_vein:    { color: 0xc0392b, name: 'Umbilical vein' },
  ductus_venosus:    { color: 0xcb4335, name: 'Ductus venosus' },
  portal_sinus:      { color: 0xa04a3a, name: 'Portal sinus & left portal vein' },
  liver:             { color: 0x8d5a45, name: 'Liver' },
  hepatic_veins:     { color: 0xb05a4a, name: 'Hepatic veins' },
  ivc:               { color: 0xd98880, name: 'Inferior vena cava' },
  /* THE TERMINAL CAVA ON ITS OWN KEY — see GEO.ivc_terminal and review finding R3-OPEN-1. Same
     colour and same saturation as `ivc`, because it IS the cava: what differs is only how much of
     it a beat may show. */
  ivc_terminal:      { color: 0xd98880, name: 'Inferior vena cava — terminal segment' },
  svc:               { color: 0x2874a6, name: 'Superior vena cava' },
  right_atrium:      { color: 0x3d7fb5, name: 'Right atrium' },
  atrial_septum:     { color: 0xb8c4d4, name: 'Interatrial septum' },
  crista_dividens:   { color: 0xe59866, name: 'Crista dividens' },
  foramen_ovale:     { color: 0x5499c7, name: 'Foramen ovale (septum primum flap)' },
  left_atrium:       { color: 0xb04a55, name: 'Left atrium' },
  right_ventricle:   { color: 0x2e6da4, name: 'Right ventricle' },
  left_ventricle:    { color: 0xa8333f, name: 'Left ventricle' },
  pulmonary_trunk:   { color: 0x3f6ea8, name: 'Pulmonary trunk' },
  pulmonary_arteries:{ color: 0x4a7fbf, name: 'Pulmonary arteries' },
  lungs:             { color: 0x6f7f93, name: 'Lungs' },
  pulmonary_veins:   { color: 0xbf5f66, name: 'Pulmonary veins' },
  ductus_arteriosus: { color: 0x5dade2, name: 'Ductus arteriosus' },
  ascending_aorta:   { color: 0xc0392b, name: 'Ascending aorta' },
  aortic_arch:       { color: 0xc0392b, name: 'Aortic arch' },
  head_neck_vessels: { color: 0xe74c3c, name: 'Brachiocephalic, left common carotid, left subclavian' },
  descending_aorta:  { color: 0xb03a2e, name: 'Descending aorta' },
  common_iliacs:     { color: 0xa93226, name: 'Common & internal iliac arteries' },
  umbilical_arteries:{ color: 0x2e86c1, name: 'Umbilical arteries' },
  flow:              { color: 0xf4d03f, name: 'Flow' },
  /* THE THREE SHUNTS AND THE TWO CAVAL STREAMS GET THEIR OWN FLOW KEYS. See FLOW_KEY_OF below. */
  flow_ductus_venosus:   { color: 0xf4d03f, name: 'Flow — ductus venosus' },
  flow_foramen_ovale:    { color: 0xf4d03f, name: 'Flow — foramen ovale' },
  flow_ductus_arteriosus:{ color: 0xf4d03f, name: 'Flow — ductus arteriosus' },
  flow_ivc:              { color: 0xf4d03f, name: 'Flow — inferior caval stream' },
  flow_svc:              { color: 0xf4d03f, name: 'Flow — superior caval stream' },
  midline:           { color: 0x9aa6bf, name: 'Median plane' },
};

/* ───────────────────────────────────────────── WHICH FLOW MARKERS CARRY WHICH KEY
 *
 * Added 2026-09-30 (round 3), and it is the enabling fix review round 2 asked for by name.
 *
 * THE PROBLEM IT SOLVES. Every flow marker used to carry the single key `flow`, so the scene could
 * only ever show or hide the whole gold cloud. That put two of this scene's rules in direct
 * conflict. Its gaps[1] says a view either shows the WHOLE circuit and may show flow, or ISOLATES
 * a region and must not — because a marker rides on a vessel's centreline, so hiding the vessel
 * leaves its arrows hanging in mid air, which is what beats 3 and 4 rendered when they were first
 * authored. But the player visibility walk says the three shunts are unseeable in every
 * whole-circuit frame, and the only lever that clears them is a CLOSE frame. A close frame is an
 * isolating frame, so under one monolithic key a shunt could be shown with its arrows or shown at
 * a size a student can see, and never both.
 *
 * THE PARTITION. Each marker carries exactly ONE key — no geometry is duplicated and no two keys
 * can ever draw the same cone twice. The three shunts this scene is about get their own; every
 * other vessel's markers stay under `flow`, which therefore still means "the circuit's flow" in
 * the whole-circuit beats and no longer includes the three that need to be isolatable.
 *
 * WHY ONLY FIVE AND NOT ALL TWENTY-FIVE. A key is only worth minting where a beat needs to show
 * that vessel's arrows WITHOUT the rest. Minting twenty-five would leave twenty keys no view names,
 * and this scene has already been bitten once by declared-but-never-shown structures (review
 * finding R1-OPEN-1, and `midline` found by check 10 on its first run). A key nothing shows is the
 * same defect in a new place, so the test for minting one is a BEAT THAT SHOWS IT, named here:
 *   flow_ductus_venosus     beat 3   flow_foramen_ovale  beats 5, 8, 14   flow_ductus_arteriosus  beats 9, 12, 13
 *   flow_ivc                beat 4   flow_svc            beat 4
 *
 * THE TWO CAVAL KEYS WERE ADDED IN ROUND 4, in answer to review finding R2-OPEN-1, and the reason
 * is the same shape as the shunts' reason rather than a new one. Beat 4 is titled "Streaming — why
 * the fetus is not just mixed blood" and its narration says "look at the two streams ... they cross
 * the same chamber without properly mixing". It shows five structures — both cavae, the right
 * atrium, the septum and the right ventricle — and under one monolithic key it could show the
 * ARROWS of those two streams only by showing the whole circuit's cloud, whose markers ride on
 * twenty vessels the beat has hidden. So beat 4 narrated two streams and drew none: the same
 * defect as R2-OPEN-2 (a beat narrating a shunt it does not show), one beat earlier, and it had
 * survived because no check asks whether the thing the WORDS point at is in the frame.
 *
 * NOTE FOR THE SCENE. `#flow` no longer resolves to the duct's arrows, so the two variant refs
 * that used to read `#flow@1+pda` and `#flow@1+pfc` must now read
 * `#flow_ductus_arteriosus@1+pda` / `@1+pfc`. That is a narrowing rather than a loss: those two
 * beats are about one duct, and the whole-circuit cloud was spending 1.4-2.4% of their frame
 * drawing over the duct they point at. */
const FLOW_KEY_OF = {
  ductus_venosus:    'flow_ductus_venosus',
  ductus_arteriosus: 'flow_ductus_arteriosus',
  ivc:               'flow_ivc',
  svc:               'flow_svc',
};
/* the complete set, in one place, so acceptance row T and the scene cannot drift from the build */
const FLOW_KEYS = ['flow', 'flow_ductus_venosus', 'flow_foramen_ovale', 'flow_ductus_arteriosus',
                   'flow_ivc', 'flow_svc'];
/* THE MAGNITUDE BELOW WHICH A VESSEL CARRIES NOTHING AND GETS NO MARKER. Named here rather than
   written twice, because acceptance row U asserts the foramen marker EXISTS in the pfc build and
   does NOT exist in the plain one, and a row that carries its own copy of the build's threshold
   stops measuring the build the moment either moves. markerCones() and the foramen marker below
   both read this. */
const FLOW_MARKER_MIN = 0.006;

/* Saturation colour ramp. Both ends go through C() because they reach a material (RENDER-STANDARD
   §2.2); the ramp itself is interpolated in sRGB and converted once, at the end. */
const SAT_COLD = { r: 0x1f, g: 0x4e, b: 0x9c };   // 0.20 saturation — deep venous blue
const SAT_WARM = { r: 0xe1, g: 0x27, b: 0x2c };   // 0.98 saturation — arterial red
const SAT_LO = 0.20, SAT_HI = 0.98;

function satHex(s) {
  const u = Math.max(0, Math.min(1, (s - SAT_LO) / (SAT_HI - SAT_LO)));
  const g = Math.pow(u, 0.85);   // perceptual: the interesting range is 0.55-0.80 and it must spread
  const r = Math.round(SAT_COLD.r + (SAT_WARM.r - SAT_COLD.r) * g);
  const gg = Math.round(SAT_COLD.g + (SAT_WARM.g - SAT_COLD.g) * g);
  const b = Math.round(SAT_COLD.b + (SAT_WARM.b - SAT_COLD.b) * g);
  return (r << 16) | (gg << 8) | b;
}

/* ───────────────────────────────────────────────────────────────────────────────── the clock */

const TAU_MAX = 60480;                       // six weeks, in minutes
const S_DEC   = Math.log(1 + TAU_MAX) / Math.LN10;   // 4.781617…  decades of minutes
function uOf(t) { return S_DEC * Math.max(0, Math.min(1, t)); }
function minutesOf(t) { return Math.pow(10, uOf(t)) - 1; }
function tOfMinutes(m) { return (Math.log(1 + m) / Math.LN10) / S_DEC; }

/* A closure curve is a logistic in u whose CENTRE and WIDTH both come from a STATED range rather
   than from a fitted constant. For a logistic, 10% -> 90% spans 4.3944·w, so a process the narration
   says takes "ten to fifteen hours" has w = (u(900) - u(600)) / 4.3944 and centre at their midpoint.
   Every number in EVENTS below is therefore traceable to a sentence a student is taught.

   The one that is NOT from this scene's narration is the pulmonary bed, which the narration describes
   only qualitatively ("pulmonary resistance falls"); its two ranges are the standard clinical account
   — most of the fall within minutes of the first breaths, the remainder over the first six weeks —
   and they are declared here as an assumption rather than smuggled in as a constant. */
function fromRange(loMin, hiMin) {
  const a = Math.log(1 + loMin) / Math.LN10, b = Math.log(1 + hiMin) / Math.LN10;
  return { u0: 0.5 * (a + b), w: Math.max(1e-4, (b - a) / 4.3944), loMin: loMin, hiMin: hiMin };
}
const EVENTS = {
  /* "the flap valve is pressed shut and the foramen ovale closes functionally in minutes" */
  foramen:  fromRange(1, 10),
  /* "constrict the ductus arteriosus over ten to fifteen hours" */
  duct:     fromRange(600, 900),
  /* "The cord is clamped" — an event, not a process */
  cord:     fromRange(0, 1),
  /* "Umbilical flow stops, so the ductus venosus closes" — functionally at once with the cord;
     structurally over three to seven days, which is what this curve is */
  venosus:  fromRange(4320, 10080),
  /* "The lungs open" — aeration complete within the first few minutes */
  breath:   fromRange(0, 5),
  /* ASSUMED, not stated by the narration: the pulmonary bed falls in two phases */
  lungFast: fromRange(1, 15),
  lungSlow: fromRange(10080, 60480),
  /* THE REMNANTS. "Then name what each becomes: ligamentum teres, ligamentum venosum, fossa ovalis,
     ligamentum arteriosum, medial umbilical ligaments" — this is the end of the narration and it is
     the most examined line in the topic, so it is geometry rather than a caption: each of these
     vessels loses its calibre on its own structural clock, weeks after the functional closure that
     stopped its flow. The duct's lumen shuts in hours; the LIGAMENT takes two to four weeks. */
  ductStruct: fromRange(20160, 40320),   // ductus arteriosus -> ligamentum arteriosum, 2-4 weeks
  umbStruct:  fromRange(10080, 30240),   // umbilical vein    -> ligamentum teres,      1-3 weeks
};
/* what a vessel that becomes a ligament shrinks TO, as a fraction of its fetal calibre */
const REMNANT = 0.30;
const LUNG_FAST_SHARE = 0.60;                 // ASSUMED: 60% of the fall is the fast phase

/* WHICH EDGE THE SEPTUM PRIMUM FLAP TURNS ABOUT. In multiples of GEO.septum.rIn along vAx, and vAx
   is CRANIAL — so a NEGATIVE value hinges the leaf on the CAUDAL rim of the foramen and leaves its
   free edge cranial.
 *
 * CORRECTED 2026-09-30 (round 2) against review finding R1-OPEN-3, which read +0.98 here: hinged
 * CRANIALLY with its free edge caudal. Two things were wrong with that and one sign fixes both.
 *
 * (1) THE ANATOMY. Septum primum grows down from the roof of the common atrium and FUSES with the
 *     endocardial cushions; the ostium secundum then opens in its upper part. So the tissue that
 *     acts as the valve of the foramen ovale is anchored CAUDALLY, at the cushions, and its FREE
 *     edge — the margin of the ostium secundum — is CRANIAL. The caval stream passes under the
 *     crista dividens (the free lower edge of septum secundum, drawn on the caudal rim here),
 *     up between the two septa, and out through the cranial ostium secundum into the left atrium.
 *     Hinged cranially, the leaf and the ridge sat on each other's edges.
 *
 * (2) THE DIRECTION IT OPENED. nAx runs RA -> LA, and rotating by +ang about uAx (= vAx x nAx)
 *     carries +vAx toward +nAx. With the hinge cranial the leaf body lay at -vAx from it, so the
 *     free edge swung toward -nAx: the flap opened into the RIGHT atrium, through the septum,
 *     against the shunt it is supposed to be opened BY. Measured on the arithmetic the geometry
 *     uses, at t=0 the leaf's centre sat 0.073 on the RA side of the septal plane. With the hinge
 *     caudal it sits 0.223 on the LA side. Acceptance row Q now asserts both facts and its
 *     negative case flips the sign, because row M measures only the flap's ANGLE and an angle is
 *     the same on either side of the septum — which is exactly why five rounds did not see this. */
const FLAP_HINGE_V = -0.98;

function closing(ev, t) { return 1 / (1 + Math.exp((uOf(t) - ev.u0) / ev.w)); }   // 1 -> 0
function opening(ev, t) { return 1 - closing(ev, t); }                            // 0 -> 1

/* ───────────────────────────────────────────────────────────── the six-node resistive network

   Nodes: 0 RA, 1 LA, 2 PA, 3 AOA (ascending aorta and arch), 4 AOD (descending aorta), 5 VEN.
   VEN is the systemic venous pool and is the pressure reference.

   The two ventricles are FLOW SOURCES — steady state, so what fills a ventricle leaves it — and the
   loop is closed by normalising their sum to 1, which makes every flow a fraction of COMBINED
   VENTRICULAR OUTPUT. That is also how the physiology is taught, so the numbers this prints can be
   read straight against a textbook.

   The foramen ovale is a ONE-WAY valve: it conducts only while right atrial pressure exceeds left.
   That is the whole mechanism of its closure and it is enforced here, once, rather than asserted in
   the narration.                                                                                  */

const NODE = { RA: 0, LA: 1, PA: 2, AOA: 3, AOD: 4, VEN: 5 };

/* SOLVED, NOT TUNED. These four conductances are the output of
   viz-training/tools/solve-fetal-circulation.mjs, which drives calibrate() below by bisection until
   the t = 0 network reproduces four figures of the standard fetal account at once:
       placental flow 40% of combined output, pulmonary flow 8%, right ventricle 66% of combined
       output, and an interatrial gradient 2% of the pressure the left heart generates.
   Do not hand-edit them: change the network, re-run the tool, paste what it prints, and check that
   acceptance() still passes — the model asserts these four at build time, so a drifted constant says
   so in the console instead of quietly teaching a circulation that does not balance. */
const SOLVED = {
  gPlac: 0.382834,    // placental bed, the low-resistance one
  gLung: 0.022778,    // fetal pulmonary bed, before the fall
  gFo:   7.780584,    // foramen ovale, fully open — wide, so the atrial gradient stays small
  gUp:   0.157038,    // upper body (brain, heart, arms) off the ascending aorta
  gLow:  0.258412,    // lower body and abdominal viscera off the descending aorta
  /* HOW FAR THE PULMONARY BED FALLS. Not assumed: calibrated against the neonatal pressure ratio,
     because that is the only observation that pins it, and because with the value first assumed here
     (a ten-fold rise in conductance) a persistent duct went on shunting RIGHT TO LEFT at six weeks —
     the exact opposite of what this scene teaches. Textbooks quote the fall in pulmonary vascular
     RESISTANCE as eight- to ten-fold; this is a CONDUCTANCE rise measured against a systemic bed that
     has itself changed, because the placenta left with the cord. The two are not the same number and
     the difference is recorded in BUILD-LOG rather than reconciled by picking one. */
  pvrFall: 82.355547,
  note:  'calibrated 2026-09-11 by tools/solve-fetal-circulation.mjs',
};
const FIXED = {
  gDa:   1.6000,      // ductus arteriosus, fully open: it is as wide as the descending aorta
  gIsth: 0.5000,      // aortic isthmus — narrow in the fetus, which is why it is where coarctation bites
  gRet:  40.000,      // the great veins: near-zero resistance, so RA pressure tracks the venous pool
  gHeart: 1.0000,     // each ventricle's conductance — the same for both, so the SPLIT is afterload
  pump:   1.0000,     // the baseline pressure each ventricle generates, and the unit of pressure here
  starling: 12.00,    // how much more a ventricle generates per unit of filling pressure
};
/* THE TARGETS, and why they are these four.

   Five are the standard fetal account, in fractions of combined ventricular output: the placenta
   takes 40%, the fetal lungs 8%, the upper body 22%, the lower body 30% and the foramen ovale 26%.
   They sum correctly — 0.40 + 0.30 + 0.22 = 0.92 is the systemic venous return, and 0.92 + 0.08 of
   pulmonary venous return is the whole of combined output — which matters, because the FIRST set of
   targets this file carried did not: it asked for a foramen flow of 32% alongside a left ventricle of
   34% and a pulmonary flow of 13%, and conservation at the left atrium says those three cannot all be
   true. The calibration drove the foramen's conductance to its bound trying, and the flow sat against
   a ceiling at 0.213. A target set that does not balance is not a hard problem; it is a wrong problem.

   The sixth is measured after birth: the neonatal pulmonary-to-systemic mean pressure ratio, about
   1:4.3 (25/10 against 80/50). It is here because it is the only thing that pins how far the
   pulmonary bed falls, and because without it the duct did not reverse — see PVR_FALL_RATIO.

   Everything else is a PREDICTION this model has to get right: the right ventricle at 66% of combined
   output, the duct at 58%, the isthmus at about 10%, and the whole oxygen order. */
const TARGETS = { plac: 0.40, lung: 0.08, up: 0.22, low: 0.30, fo: 0.26, pressureRatio: 4.30 };
const DERIVED = { rv: 0.66, lv: 0.34, da: 0.58 };  // forced by conservation once the five above hold
const TARGET_TOL = 0.012;

/* dense 6x6 Gaussian elimination with partial pivoting — small, exact enough, no dependencies */
function solveLinear(A, b, n) {
  const M = [];
  for (let i = 0; i < n; i++) { M.push(A[i].slice()); M[i].push(b[i]); }
  for (let c = 0; c < n; c++) {
    let piv = c;
    for (let r = c + 1; r < n; r++) if (Math.abs(M[r][c]) > Math.abs(M[piv][c])) piv = r;
    if (Math.abs(M[piv][c]) < 1e-14) return null;
    const tmp = M[c]; M[c] = M[piv]; M[piv] = tmp;
    for (let r = 0; r < n; r++) {
      if (r === c) continue;
      const f = M[r][c] / M[c][c];
      if (f === 0) continue;
      for (let k = c; k <= n; k++) M[r][k] -= f * M[c][k];
    }
  }
  const x = new Array(n);
  for (let i = 0; i < n; i++) x[i] = M[i][n] / M[i][i];
  return x;
}

/* conductances at time t, with the variant flags applied */
function conductances(t, opts, P) {
  const o = opts || {};
  const p = P || SOLVED;
  const cord = o.cordIntact ? 1 : closing(EVENTS.cord, t);
  /* PDA: the duct never constricts. PFC: the pulmonary bed never falls — "if pulmonary resistance
     never falls, the shunts keep running right to left". Both are variants of the SAME network, so
     the picture they produce is a consequence and not a second drawing. */
  /* PERSISTENT FETAL CIRCULATION holds the duct and the foramen open as well as the bed, and that is
     not three separate switches: both shunts close because the pressure gradient across them reverses
     and presses them shut, and in PFC it never does. Closing them on a clock while the bed stayed
     tight would have been a model of a baby with a high pulmonary resistance and NO shunts, which is
     not the disease. */
  const duct = (o.pda || o.pfc) ? 1 : closing(EVENTS.duct, t);
  const foPat = o.pfc ? 1 : closing(EVENTS.foramen, t);
  const lungRise = o.pfc ? 0
    : LUNG_FAST_SHARE * opening(EVENTS.lungFast, t) + (1 - LUNG_FAST_SHARE) * opening(EVENTS.lungSlow, t);
  return {
    gFo:   p.gFo * foPat,
    gLung: p.gLung * (1 + (p.pvrFall - 1) * lungRise),
    gDa:   FIXED.gDa * duct,
    gIsth: FIXED.gIsth,
    gUp:   p.gUp,
    gLow:  p.gLow,
    gPlac: p.gPlac * cord,
    gRet:  FIXED.gRet,
    patency: { foramen: foPat, duct: duct, cord: cord, venosus: closing(EVENTS.venosus, t),
               breath: opening(EVENTS.breath, t), lungRise: lungRise,
               ductStruct: closing(EVENTS.ductStruct, t), umbStruct: closing(EVENTS.umbStruct, t) },
  };
}

/* The flow solve. ONE linear solve — no fixed point, nothing to converge.

   The two ventricles are real elements rather than flow sources: each is a conductance in series
   with the pressure it generates, so the right heart is `flow = gHeart * (P_RA - P_PA + H)` and the
   left is the same between LA and AOA. That matters, and the first version of this file got it
   wrong: with the ventricles as pure FLOW SOURCES the atrial pressures float free, so the split
   between the foramen ovale and the tricuspid valve was not determined by the foramen's conductance
   at all — the calibration ran the foramen's conductance down by a factor of fifty and the shunt did
   not move. A flow source draws whatever pressure it needs; a real ventricle cannot.

   With both ventricles given the SAME pressure generation H, the fetal split comes out of the
   afterloads alone (the right heart faces the duct and the placenta, the left faces the head and
   neck), and after the shunts close continuity forces the two outputs equal on its own — which is
   the series circulation, arrived at rather than imposed.

   Every flow is returned as a fraction of COMBINED VENTRICULAR OUTPUT, which is how the physiology
   is taught, so these numbers can be read straight against a textbook. F.da is SIGNED: positive is
   right-to-left, the fetal direction.                                                              */
function flows(t, opts, P) {
  const g = conductances(t, opts, P);
  const N = 6, H = FIXED.pump, gh = FIXED.gHeart;
  let foOpen = true, p = null, fo = 0;
  for (let pass = 0; pass < 2; pass++) {
    const A = []; for (let i = 0; i < N; i++) A.push(new Array(N).fill(0));
    const b = new Array(N).fill(0);
    const link = (i, j, gg) => { A[i][i] += gg; A[i][j] -= gg; A[j][j] += gg; A[j][i] -= gg; };
    link(NODE.PA, NODE.LA, g.gLung);
    link(NODE.PA, NODE.AOD, g.gDa);
    link(NODE.AOA, NODE.AOD, g.gIsth);
    link(NODE.AOA, NODE.VEN, g.gUp);
    link(NODE.AOD, NODE.VEN, g.gLow);
    link(NODE.AOD, NODE.VEN, g.gPlac);
    link(NODE.VEN, NODE.RA, g.gRet);
    if (foOpen) link(NODE.RA, NODE.LA, g.gFo);
    /* THE VENTRICLES, AS STARLING PUMPS.  q = gHeart * ((1 + GAIN)*P_atrium + H - P_outflow):
       a ventricle generates a pressure that RISES WITH ITS FILLING. That one term is what makes the
       duct able to reverse. With a constant pressure generation the two ventricles can never develop
       different pressures, so a persistent duct went on shunting right-to-left at six weeks — which
       is the opposite of the thing this scene exists to teach. With the Starling term, a left atrium
       starved of pulmonary venous return falls BELOW the right atrium (which is what opens the
       foramen in the fetus) and a left atrium filled by an open lung bed rises above it (which is
       what shuts it, and what lets the left ventricle out-pressure the right afterwards). Both come
       from the same line. */
    const GA = FIXED.starling;
    A[NODE.RA][NODE.RA] += gh * (1 + GA); A[NODE.RA][NODE.PA] -= gh;
    A[NODE.PA][NODE.RA] -= gh * (1 + GA); A[NODE.PA][NODE.PA] += gh;
    b[NODE.RA] -= gh * H; b[NODE.PA] += gh * H;
    A[NODE.LA][NODE.LA] += gh * (1 + GA); A[NODE.LA][NODE.AOA] -= gh;
    A[NODE.AOA][NODE.LA] -= gh * (1 + GA); A[NODE.AOA][NODE.AOA] += gh;
    b[NODE.LA] -= gh * H; b[NODE.AOA] += gh * H;
    for (let k = 0; k < N; k++) A[NODE.VEN][k] = 0;
    A[NODE.VEN][NODE.VEN] = 1; b[NODE.VEN] = 0;
    const x = solveLinear(A, b, N);
    if (!x) return null;
    p = x;
    fo = foOpen ? g.gFo * (p[NODE.RA] - p[NODE.LA]) : 0;
    /* THE FLAP VALVE. It conducts only while right atrial pressure exceeds left. When the gradient
       reverses the valve shuts and the network is re-solved without it — which is the whole
       mechanism of the foramen's closure, enforced in one place rather than narrated. */
    if (fo < 0 && foOpen) { foOpen = false; continue; }
    break;
  }
  const qr = gh * ((1 + FIXED.starling) * p[NODE.RA] - p[NODE.PA] + H);
  const ql = gh * ((1 + FIXED.starling) * p[NODE.LA] - p[NODE.AOA] + H);
  const cvo = qr + ql;
  if (!(cvo > 1e-9)) return null;
  const k = 1 / cvo;
  const F = {
    rv: qr * k, lv: ql * k,
    fo: Math.max(0, fo) * k,
    lung: g.gLung * (p[NODE.PA] - p[NODE.LA]) * k,
    da:   g.gDa   * (p[NODE.PA] - p[NODE.AOD]) * k,      // POSITIVE = right-to-left
    isth: g.gIsth * (p[NODE.AOA] - p[NODE.AOD]) * k,
    up:   g.gUp   * (p[NODE.AOA] - p[NODE.VEN]) * k,
    low:  g.gLow  * (p[NODE.AOD] - p[NODE.VEN]) * k,
    plac: g.gPlac * (p[NODE.AOD] - p[NODE.VEN]) * k,
    ret:  g.gRet  * (p[NODE.VEN] - p[NODE.RA]) * k,
    foOpen: foOpen,
  };
  F.uv = F.plac;
  F.dv = F.uv * DV_SHARE * g.patency.venosus;
  F.hepatic = F.uv - F.dv;
  F.ivc = F.low + F.uv;
  F.svc = F.up;
  F.pressures = { RA: p[NODE.RA], LA: p[NODE.LA], PA: p[NODE.PA], AOA: p[NODE.AOA],
                  AOD: p[NODE.AOD], VEN: p[NODE.VEN] };
  F.dPatria = p[NODE.RA] - p[NODE.LA];
  F.patency = g.patency;
  F.g = g;
  /* CONSERVATION, MEASURED. Not "it is a linear solve so it must balance" — the residual is what
     says the matrix was assembled the way this comment claims it was. */
  F.residual = Math.max(
    Math.abs(F.rv + F.lv - 1),
    Math.abs(F.up + F.low + F.plac - F.ret),
    Math.abs(F.lung + F.fo - F.lv),
    Math.abs(F.ret - F.fo - F.rv),
    Math.abs(F.isth + F.da - F.low - F.plac)
  );
  return F;
}

/* "The ductus venosus carries roughly half of it straight from the umbilical vein into the inferior
   vena cava" — the scene's own figure, used as written. Human fetal MRI in late gestation puts this
   nearer 30%, and that disagreement is recorded in gaps[] and in BUILD-LOG rather than silently
   resolved in one direction: the model agrees with the words a student is reading. */
const DV_SHARE = 0.50;

/* ──────────────────────────────────────────────────────────────────── the oxygen mass balance

   Given the flows, every saturation in the circuit is fixed by conservation. The only free parameter
   is EXTRACT, the whole-body oxygen extraction, expressed in units of (fraction of combined output)
   x (saturation) so that the oxygen-carrying capacity cancels. It is SOLVED by bisection against the
   one saturation the narration states downstream of the placenta — "into the right atrium at about
   seventy percent" — and everything else, including the ascending-versus-descending aorta ordering
   that the whole scene turns on, is then a PREDICTION this model has to get right rather than a
   number it was given.

   The SPLIT of that extraction between the upper and the lower body is solved too, against the
   superior caval saturation of 0.38, because it turned out to decide the thing the scene is about.
   Assumed at 45% upper, the model put the ascending aorta only 0.007 above the descending one: the
   right ORDER, and a picture in which a student could not see it. The upper body is where the duct's
   blood comes from, so how much oxygen the head takes out is what sets how much worse the lower
   body's supply is. Guessing it guesses the answer.

   IT IS SOLVED AGAINST THE SUPERIOR CAVA AND NOT THE DESCENDING AORTA, and the difference is the
   point. The descending aorta was the first choice, and asking for 0.58 there drove the upper share
   to its bound at 0.95 — 95% of the whole body's oxygen consumption in the head and arms, which is
   not a fetus. The superior caval saturation is what this parameter actually controls, it is a
   directly measured figure rather than a mixture, and it leaves the descending aorta free to be a
   PREDICTION. It lands at 0.595, inside the 0.55-0.62 the standard account gives, and acceptance O
   asserts that — a claim the calibration was never allowed to buy. */
const UV_SAT       = 0.80;      // "about eighty percent saturation — the highest anywhere in the fetus"
const RA_IVC_SAT   = 0.70;      // "into the right atrium at about seventy percent"
const ALVEOLAR_SAT = 0.98;      // a ventilated lung
const SVC_SAT      = 0.38;      // the standard figure for the superior caval stream
const AOD_RANGE    = [0.55, 0.62];   // where the descending aorta must LAND — never calibrated to
const LUNG_EXTRACT = 0.004;     // the unventilated fetal lung still consumes oxygen

function saturations(F, t, opts, extract) {
  const o = opts || {};
  const E = extract;
  const UPPER_SHARE = (arguments.length > 4 && arguments[4] != null) ? arguments[4] : upperShare();
  const breath = F.patency.breath * (o.pfc ? 1 : 1);   // the lung aerates even in PFC; it is the BED that stays tight
  const q = (x) => Math.max(1e-4, x);
  /* start everything at the venous end and iterate the loop to a fixed point */
  let S = { uv: UV_SAT, dv: UV_SAT, hep: 0.65, ivcLow: 0.35, svc: 0.40,
            ivc: 0.70, ra: 0.65, la: 0.62, rv: 0.60, lv: 0.62, pa: 0.60, pv: 0.58,
            aoa: 0.62, aod: 0.58, ua: 0.55 };
  for (let it = 0; it < 200; it++) {
    const prev = S.aod;
    /* the placenta sets the umbilical vein while there is placental flow */
    S.uv = F.plac > 1e-5 ? UV_SAT : S.aod;
    S.dv = S.uv;
    /* the half that perfuses the liver gives some up on the way through */
    S.hep = Math.max(0.05, S.uv - (E * 0.06) / q(F.hepatic));
    /* the lower body bed, off the descending aorta */
    S.ivcLow = Math.max(0.05, S.aod - (E * (1 - UPPER_SHARE)) / q(F.low));
    /* the upper body bed, off the ascending aorta */
    S.svc = Math.max(0.05, S.aoa - (E * UPPER_SHARE) / q(F.up));
    /* the inferior caval stream: the ductus venosus, the hepatic veins and the lower body, mixed */
    S.ivc = (F.dv * S.dv + F.hepatic * S.hep + F.low * S.ivcLow) / q(F.dv + F.hepatic + F.low);
    /* THE CRISTA DIVIDENS. The foramen ovale flow is drawn from the INFERIOR caval stream first —
       that is what the crista does, and it is why the left heart gets the better blood. Only if the
       foramen is taking more than the inferior stream can supply does superior caval blood follow. */
    const qIvc = F.ivc, qSvc = F.svc, qFo = Math.max(0, F.fo);
    const foFromIvc = Math.min(qFo, qIvc);
    const foFromSvc = Math.max(0, qFo - foFromIvc);
    const foSat = qFo > 1e-6 ? (foFromIvc * S.ivc + foFromSvc * S.svc) / qFo : S.ivc;
    const tvIvc = qIvc - foFromIvc, tvSvc = qSvc - foFromSvc;
    S.ra = (qIvc * S.ivc + qSvc * S.svc) / q(qIvc + qSvc);
    S.rv = (tvIvc * S.ivc + tvSvc * S.svc) / q(tvIvc + tvSvc);
    S.pa = S.rv;
    /* the lung: a consumer before the first breath, an exchanger after it */
    const unvent = Math.max(0.05, S.pa - LUNG_EXTRACT / q(F.lung));
    S.pv = breath * ALVEOLAR_SAT + (1 - breath) * unvent;
    S.la = (qFo * foSat + F.lung * S.pv) / q(qFo + F.lung);
    S.lv = S.la; S.aoa = S.lv;
    /* the descending aorta: whatever crosses the isthmus, plus whatever the duct delivers.
       F.da is signed — POSITIVE right-to-left. A negative duct flow is blood going the OTHER way,
       from the aorta into the pulmonary artery, and then it contributes nothing to the descending
       aorta and instead dilutes the pulmonary artery. Both cases fall out of the same two lines. */
    const qIsth = Math.max(0, F.isth), qDa = Math.max(0, F.da);
    S.aod = (qIsth * S.aoa + qDa * S.pa) / q(qIsth + qDa);
    if (F.da < 0) {
      const back = -F.da;
      S.pa = (Math.max(1e-6, F.rv) * S.rv + back * S.aoa) / q(Math.max(1e-6, F.rv) + back);
    }
    S.ua = S.aod;
    if (Math.abs(S.aod - prev) < 1e-12) break;
  }
  S.foSat = S.la;
  return S;
}

/* Solved by nested bisection at t = 0: the inner loop finds the whole-body extraction that puts the
   inferior caval stream at 0.70 in the right atrium; the outer loop finds the upper-body share of
   that extraction which puts the descending aorta at 0.58. Two equations, two unknowns, and both
   right-hand sides are figures a student is taught rather than numbers chosen to make a picture. */
let _mix = null;
function solveMixing() {
  const F0 = flows(0, {}, SOLVED);
  const extractFor = (share) => {
    let lo = 0.0, hi = 3.0;
    for (let i = 0; i < 90; i++) {
      const mid = 0.5 * (lo + hi);
      if (saturations(F0, 0, {}, mid, share).ivc > RA_IVC_SAT) lo = mid; else hi = mid;
    }
    return 0.5 * (lo + hi);
  };
  let lo = 0.05, hi = 0.95, e = 0;
  for (let i = 0; i < 60; i++) {
    const share = 0.5 * (lo + hi);
    e = extractFor(share);
    /* a bigger upper share desaturates the superior caval stream: the reading falls as the knob rises */
    if (saturations(F0, 0, {}, e, share).svc > SVC_SAT) lo = share; else hi = share;
  }
  const share = 0.5 * (lo + hi);
  return { extract: extractFor(share), upperShare: share };
}
function mixing() { if (_mix == null) _mix = solveMixing(); return _mix; }
function extract() { return mixing().extract; }
function upperShare() { return mixing().upperShare; }

/* the whole physiological state at one t — this is what the geometry reads */
function state(t, opts) {
  const F = flows(t, opts, SOLVED);
  const S = saturations(F, t, opts, extract());
  return { t: t, flow: F, sat: S, extract: extract() };
}

/* CALIBRATION. Exposed so viz-training/tools/solve-fetal-circulation.mjs can re-derive SOLVED by
   coordinate bisection instead of anybody hand-picking a conductance. The model owns the network;
   the tool owns the search. That way the two cannot drift apart, which is the failure mode of a
   solver that carries its own copy of the thing it is solving. */
function calibrate(rounds) {
  const P = { gPlac: SOLVED.gPlac, gLung: SOLVED.gLung, gFo: SOLVED.gFo, gUp: SOLVED.gUp,
              gLow: SOLVED.gLow, pvrFall: SOLVED.pvrFall };
  const ratio = () => {
    const F = flows(1, {}, P);
    return (F.pressures.AOA - F.pressures.VEN) / Math.max(1e-9, F.pressures.PA - F.pressures.VEN);
  };
  /* [knob, lo, hi, read, target, sign] — sign is which way the reading moves as the knob rises.
     The first five read the FETAL network; the sixth reads the neonatal one. */
  const knobs = [
    ['gPlac', 0.005, 12.0, F => F.plac, TARGETS.plac, +1],
    ['gLung', 0.001, 6.00, F => F.lung, TARGETS.lung, +1],
    ['gUp',   0.002, 12.0, F => F.up,   TARGETS.up,   +1],
    ['gLow',  0.002, 12.0, F => F.low,  TARGETS.low,  +1],
    ['gFo',   0.002, 60.0, F => F.fo,   TARGETS.fo,   +1],
  ];
  for (let r = 0; r < (rounds || 60); r++) {
    for (const kn of knobs) {
      const key = kn[0], read = kn[3], target = kn[4], sign = kn[5];
      let lo = kn[1], hi = kn[2];
      for (let i = 0; i < 70; i++) {
        const mid = 0.5 * (lo + hi);
        const save = P[key]; P[key] = mid;
        const F = flows(0, {}, P);
        P[key] = save;
        const v = F ? read(F) : (sign > 0 ? -1e9 : 1e9);
        if (sign * (v - target) < 0) lo = mid; else hi = mid;
      }
      P[key] = 0.5 * (lo + hi);
    }
    /* the pulmonary fall, against the neonatal pressure ratio */
    let lo = 1.0, hi = 4000;
    for (let i = 0; i < 80; i++) {
      const mid = 0.5 * (lo + hi);
      const save = P.pvrFall; P.pvrFall = mid;
      const v = ratio();
      P.pvrFall = save;
      if (v < TARGETS.pressureRatio) lo = mid; else hi = mid;   // more conductance -> higher ratio
    }
    P.pvrFall = 0.5 * (lo + hi);
  }
  const F = flows(0, {}, P), F1 = flows(1, {}, P), Fp = flows(1, { pda: true }, P);
  return { params: P,
           achieved: { plac: F.plac, lung: F.lung, up: F.up, low: F.low, fo: F.fo,
                       pressureRatio: ratio() },
           predicted: { rv: F.rv, lv: F.lv, da: F.da, isth: F.isth,
                        neonatal_lung: F1.lung, pda_duct: Fp.da },
           targets: TARGETS, derived: DERIVED, residual: F.residual };
}
/* ═════════════════════════════════════════════════════════════════════════════════════ geometry

   Everything below is built through render-kit: winding through emitter().quad / triN, colour
   through C(), silhouettes through addSolid, framing left to fitCamera. Nothing here reimplements
   any of those — RENDER-STANDARD §6.                                                              */

const V = (x, y, z) => new T.Vector3(x, y, z);

/* A closed blob — chamber, organ, placenta. Positions come from one point function and normals from
   a finite difference OF THAT SAME FUNCTION (rule 3), so a warped organ shades correctly instead of
   being shaded as the sphere it started as. The poles close with triN, which decides vertex order
   from the geometry rather than from a comment (rule 2.4b). */
function blob(cx, cy, cz, a, b, c, opts) {
  const o = opts || {};
  const ring = o.ring || 30, rows = o.rows || 18;
  const warp = o.warp || null;
  const cen = V(cx, cy, cz);
  function pt(i, j, out) {
    const phi = (Math.max(0, Math.min(rows, i)) / rows) * Math.PI;
    const th = (j / ring) * Math.PI * 2;
    const sp = Math.sin(phi), cp = Math.cos(phi);
    let ux = sp * Math.cos(th), uy = cp, uz = sp * Math.sin(th);
    let k = warp ? warp(ux, uy, uz) : 1;
    return out.set(cen.x + a * ux * k, cen.y + b * uy * k, cen.z + c * uz * k);
  }
  const _a = V(0,0,0), _b = V(0,0,0), _du = V(0,0,0), _dv = V(0,0,0), _rad = V(0,0,0);
  function nrm(i, j, out) {
    pt(i + 1, j, _a); pt(i - 1, j, _b); _du.subVectors(_a, _b);
    pt(i, j + 1, _a); pt(i, j - 1, _b); _dv.subVectors(_a, _b);
    out.crossVectors(_du, _dv);
    pt(i, j, _a); _rad.subVectors(_a, cen);
    if (_rad.lengthSq() < 1e-12) _rad.set(0, 1, 0); else _rad.normalize();
    if (out.lengthSq() < 1e-12) out.copy(_rad);
    out.normalize();
    if (out.dot(_rad) < 0) out.negate();
    return out;
  }
  const E = K.emitter();
  const P00 = V(0,0,0), P10 = V(0,0,0), P11 = V(0,0,0), P01 = V(0,0,0);
  const N00 = V(0,0,0), N10 = V(0,0,0), N11 = V(0,0,0), N01 = V(0,0,0);
  for (let i = 0; i < rows; i++) {
    for (let j = 0; j < ring; j++) {
      pt(i, j, P00); pt(i + 1, j, P10); pt(i + 1, j + 1, P11); pt(i, j + 1, P01);
      nrm(i, j, N00); nrm(i + 1, j, N10); nrm(i + 1, j + 1, N11); nrm(i, j + 1, N01);
      if (i === 0)            E.triN(P10, P11, P00, N10);          // north pole fan
      else if (i === rows - 1) E.triN(P00, P10, P01, N00);          // south pole fan
      else                     E.quad(P00, P10, P11, P01, N00, N10, N11, N01);
    }
  }
  return E.geometry(E.count());     // all of it is outer surface, so all of it takes a silhouette
}

/* A vessel. K.tubeAlong owns the sweep; this adds a rounded dome where a tube ends in mid air,
   because RENDER-STANDARD is explicit that a flat disc at a free end reads as a cut pipe. */
function vesselGeoms(points, rFn, opts) {
  const o = opts || {};
  const ring = o.ring || 18;
  const out = [K.tubeAlong(points, rFn, { ring: ring, seed: o.seed })];
  if (o.capStart || o.capEnd) {
    const F = K.parallelFrame(points, o.seed);
    const last = points.length - 1;
    if (o.capStart) out.push(K.domeCap({ frame: F, i: 0, sign: -1, r: rFn(0), ring: ring,
                                         rows: 6, bulge: 0.85, flatten: 1, section: () => 1 }));
    if (o.capEnd)   out.push(K.domeCap({ frame: F, i: last, sign: 1, r: rFn(1), ring: ring,
                                         rows: 6, bulge: 0.85, flatten: 1, section: () => 1 }));
  }
  return out;
}

/* THE INTERATRIAL SEPTUM — the one membrane in this model, and it TAPERS.
   An annulus in the septal plane: inner rim = the foramen ovale, outer rim = where it meets the
   atrial wall. Thickness goes to zero at BOTH rims, so neither reads as a cut edge and no cap is
   needed — the two faces meet. RENDER-STANDARD: "a membrane tapers to nothing where it meets what it
   suspends", and the first version of this septum, drawn at constant thickness, was the slab of card
   that rule is about. */
function annularSheet(cen, uAx, vAx, nAx, rIn, rOut, hMax, ringN, radN) {
  const E = K.emitter();
  const R = rho => rIn + (rOut - rIn) * rho;
  const H = rho => hMax * Math.pow(Math.sin(Math.PI * Math.max(0, Math.min(1, rho))), 0.55);
  function pt(iRho, jTh, side, out) {
    const rho = iRho / radN, th = (jTh / ringN) * Math.PI * 2;
    const r = R(rho), h = H(rho) * 0.5 * side;
    return out.set(0, 0, 0)
      .addScaledVector(uAx, r * Math.cos(th))
      .addScaledVector(vAx, r * Math.sin(th))
      .addScaledVector(nAx, h)
      .add(cen);
  }
  const _a = V(0,0,0), _b = V(0,0,0), _du = V(0,0,0), _dv = V(0,0,0);
  function nrm(i, j, side, out) {
    pt(i + 1, j, side, _a); pt(i - 1, j, side, _b); _du.subVectors(_a, _b);
    pt(i, j + 1, side, _a); pt(i, j - 1, side, _b); _dv.subVectors(_a, _b);
    out.crossVectors(_du, _dv);
    if (out.lengthSq() < 1e-14) out.copy(nAx).multiplyScalar(side);
    out.normalize();
    if (out.dot(nAx) * side < 0) out.negate();
    return out;
  }
  const P00 = V(0,0,0), P10 = V(0,0,0), P11 = V(0,0,0), P01 = V(0,0,0);
  const N00 = V(0,0,0), N10 = V(0,0,0), N11 = V(0,0,0), N01 = V(0,0,0);
  for (const side of [1, -1]) {
    for (let i = 0; i < radN; i++) {
      for (let j = 0; j < ringN; j++) {
        pt(i, j, side, P00); pt(i + 1, j, side, P10);
        pt(i + 1, j + 1, side, P11); pt(i, j + 1, side, P01);
        nrm(i, j, side, N00); nrm(i + 1, j, side, N10);
        nrm(i + 1, j + 1, side, N11); nrm(i, j + 1, side, N01);
        /* THROUGH triN, NOT quad. A sheet is not a ring quad: the (rho, theta) parametrisation has
           its own handedness, and on the first build of this septum EVERY ONE of its 1,008 triangles
           came out wound against its own supplied normal — measured, winding 0.000 — which is
           RENDER-STANDARD's cardinal bug arriving in the one place the kit's own note says to use
           triN: "any triangle that is not part of a ring quad — a cap, a taper, A SHEET, a dome pole".
           triN decides the order from the geometry instead of from a comment. */
        E.triN(P00, P10, P11, avg3(N00, N10, N11));
        E.triN(P00, P11, P01, avg3(N00, N11, N01));
      }
    }
  }
  return E.geometry(E.count());
}

function avg3(a, b, c) {
  const v = new T.Vector3().add(a).add(b).add(c);
  return v.lengthSq() < 1e-14 ? a.clone() : v.normalize();
}

/* THE SEPTUM PRIMUM FLAP. A leaf, thick at its hinge and tapering to nothing at its free edge, so
   that when it is pressed against the septum it reads as a valve closing and not as two plates
   colliding. The disc closes on itself at the rim for the same reason the sheet above does. */
function leaf(cen, uAx, vAx, nAx, R, hMax, ringN, radN) {
  const E = K.emitter();
  const H = rho => hMax * Math.pow(Math.max(0, 1 - rho * rho), 0.7);
  function pt(iRho, jTh, side, out) {
    const rho = iRho / radN, th = (jTh / ringN) * Math.PI * 2;
    const r = R * rho, h = H(rho) * 0.5 * side;
    return out.set(0, 0, 0)
      .addScaledVector(uAx, r * Math.cos(th))
      .addScaledVector(vAx, r * Math.sin(th))
      .addScaledVector(nAx, h)
      .add(cen);
  }
  const _a = V(0,0,0), _b = V(0,0,0), _du = V(0,0,0), _dv = V(0,0,0);
  function nrm(i, j, side, out) {
    pt(i + 1, j, side, _a); pt(Math.max(0, i - 1), j, side, _b); _du.subVectors(_a, _b);
    pt(i, j + 1, side, _a); pt(i, j - 1, side, _b); _dv.subVectors(_a, _b);
    out.crossVectors(_du, _dv);
    if (out.lengthSq() < 1e-14) out.copy(nAx).multiplyScalar(side);
    out.normalize();
    if (out.dot(nAx) * side < 0) out.negate();
    return out;
  }
  const P00 = V(0,0,0), P10 = V(0,0,0), P11 = V(0,0,0), P01 = V(0,0,0);
  const N00 = V(0,0,0), N10 = V(0,0,0), N11 = V(0,0,0), N01 = V(0,0,0);
  for (const side of [1, -1]) {
    for (let i = 0; i < radN; i++) {
      for (let j = 0; j < ringN; j++) {
        pt(i, j, side, P00); pt(i + 1, j, side, P10);
        pt(i + 1, j + 1, side, P11); pt(i, j + 1, side, P01);
        nrm(i, j, side, N00); nrm(i + 1, j, side, N10);
        nrm(i + 1, j + 1, side, N11); nrm(i, j + 1, side, N01);
        if (i === 0) { E.triN(P10, P11, P00, avg3(N10, N11, N00)); }
        else { E.triN(P00, P10, P11, avg3(N00, N10, N11));
               E.triN(P00, P11, P01, avg3(N00, N11, N01)); }
      }
    }
  }
  return E.geometry(E.count());
}

/* ─────────────────────────────────────────────────────────────────────────────── the layout

   One table, so that a reviewer can check a position against an anatomy plate without reading any
   code, and so that every centreline the flow markers walk is the SAME array the tube was built
   from. The flow arrows cannot drift off their vessels because there is only one copy.             */

function P(...a) { const r = []; for (let i = 0; i < a.length; i += 3) r.push(V(a[i], a[i+1], a[i+2])); return r; }

const GEO = {
  placenta:   { c: [0, -6.35, 2.25], r: [1.85, 1.32, 0.46] },
  liver:      { c: [-0.62, -1.30, 0.55], r: [1.85, 0.92, 0.92] },
  lungR:      { c: [-2.85, 3.30, -0.15], r: [0.95, 1.90, 0.95] },
  lungL:      { c: [ 2.85, 3.35, -0.10], r: [0.90, 1.90, 0.92] },
  ra:         { c: [-1.05, 2.30, 0.20], r: [0.78, 0.85, 0.72] },
  la:         { c: [ 0.95, 2.45, -0.45], r: [0.70, 0.78, 0.66] },
  rv:         { c: [-0.75, 1.05, 0.85], r: [0.82, 0.95, 0.70] },
  lv:         { c: [ 0.75, 0.85, 0.40], r: [0.80, 1.05, 0.72] },
  septum:     { c: [-0.05, 2.38, -0.12], rIn: 0.26, rOut: 0.74, h: 0.115 },

  umbilical_vein: P(0, -6.05, 2.40,  0, -4.95, 2.44,  0.02, -3.98, 2.16,  0.02, -3.02, 1.72,
                    -0.14, -2.20, 1.32,  -0.30, -1.50, 0.92,  -0.35, -1.05, 0.60),
  ductus_venosus: P(-0.35, -1.05, 0.55,  -0.45, -0.70, 0.24,  -0.56, -0.36, -0.10),
  portal_sinus:   P(-0.35, -1.05, 0.58,  -0.80, -1.02, 0.46,  -1.22, -1.00, 0.34),
  hepatic_R:      P(-1.28, -0.86, 0.30,  -0.90, -0.56, 0.04,  -0.62, -0.30, -0.12),
  hepatic_L:      P( 0.30, -0.96, 0.36,  -0.16, -0.60, 0.08,  -0.52, -0.34, -0.10),
  ivc:            P(-0.42, -4.20, -0.46,  -0.48, -2.40, -0.32,  -0.56, -0.40, -0.12,
                    -0.84, 1.00, 0.00,  -1.05, 1.95, 0.12),
  svc:            P(-0.85, 5.60, 0.10,  -0.98, 4.00, 0.06,  -1.05, 3.05, 0.10,  -1.05, 2.78, 0.14),
  /* THE TERMINAL INFERIOR VENA CAVA, ON ITS OWN KEY. Review finding R3-OPEN-1 (round 3): beat 3
     narrates the ductus venosus going "straight past through the ductus venosus INTO THE INFERIOR
     VENA CAVA" and the two streams meeting "again in the inferior cava", and drew a tube ending in
     empty space. The whole cava could not simply be added: it is a six-unit column standing along
     beat 3's own superior view direction, right over the junction the beat is about, and the review
     measured the cost through the real tool — highlighted ductus_venosus 1.258 to 0.072 per cent,
     under the pointed-at floor.
     THIS IS THE SAME CENTRELINE over its terminal span, sampled off GEO.ivc itself rather than
     written out twice, so the two can never disagree about where the cava is. The boundary is the
     HEPATIC VENOUS CONFLUENCE — a real landmark, RENDER-STANDARD section 3 — and it is placed just
     CAUDAL of it so the ductus venosus and both hepatic veins open INSIDE the segment rather than at
     its cut end. Built behind opts.ivcTerminal and declared in FULL, exactly as the flow layers are,
     so the adapter resolves it while a direct build(t, {flow:true}) does not draw it over `ivc`. */
  pulmonary_trunk:P(-0.55, 1.85, 1.05,  -0.25, 2.75, 0.95,  0.15, 3.35, 0.55),
  pa_R:           P( 0.15, 3.35, 0.55,  -1.10, 3.36, 0.14,  -2.25, 3.26, -0.12),
  pa_L:           P( 0.15, 3.35, 0.55,   1.20, 3.40, 0.20,   2.25, 3.35, -0.06),
  pv_R:           P(-2.10, 2.78, -0.52,  -0.70, 2.56, -0.58,  0.72, 2.46, -0.52),
  pv_L:           P( 2.10, 2.80, -0.50,   1.60, 2.60, -0.55,  1.18, 2.50, -0.50),
  ductus_arteriosus: P(0.42, 3.40, 0.38,  0.60, 3.24, -0.20,  0.58, 3.00, -0.86),
  ascending_aorta:P( 0.55, 1.95, 0.45,   0.38, 2.90, 0.30,   0.25, 3.55, 0.10),
  aortic_arch:    P( 0.25, 3.55, 0.10,   0.20, 4.06, -0.14,   0.40, 3.96, -0.60,  0.55, 3.46, -0.88),
  brachiocephalic:P( 0.16, 4.00, -0.09,  -0.50, 4.90, 0.05,  -0.96, 5.90, 0.10),
  carotid_L:      P( 0.22, 4.06, -0.28,   0.35, 5.00, -0.15,   0.42, 6.00, -0.05),
  subclavian_L:   P( 0.33, 4.02, -0.45,   1.00, 4.75, -0.35,   1.75, 5.15, -0.25),
  descending_aorta: P(0.55, 3.46, -0.88,  0.35, 1.50, -0.95,  0.20, -1.00, -0.92,  0.12, -3.30, -0.80),
  iliac_L:        P( 0.12, -3.30, -0.80,  0.60, -3.85, -0.68,  0.95, -4.28, -0.54),
  iliac_R:        P( 0.12, -3.30, -0.80, -0.36, -3.85, -0.68, -0.72, -4.28, -0.54),
  /* THE UMBILICAL ARTERIES ARE TWO SWEEPS EACH, not one. They run from the internal iliac UP the
     anterior abdominal wall to the umbilicus and then OUT along the cord, which reverses in y at the
     umbilicus — a hairpin. Swept as one tube through that reversal the parallel frame tumbles and 5%
     of the triangles came out wound backwards (measured: winding 0.948). Two overlapping spans meet
     inside the umbilicus, where neither end cap can be seen, which is the same reason every segment
     boundary in this corpus sits at a waist. */
  ua_L:           P( 0.95, -4.28, -0.54,  0.78, -4.72, 0.14,  0.48, -4.18, 1.06,  0.24, -3.36, 1.56,
                     0.15, -3.02, 1.80),
  ua_R:           P(-0.72, -4.28, -0.54, -0.60, -4.72, 0.14, -0.40, -4.18, 1.06, -0.20, -3.36, 1.56,
                    -0.15, -3.02, 1.80),
  uacord_L:       P( 0.15, -3.02, 1.80,  0.24, -3.48, 2.12,  0.28, -4.30, 2.46,  0.16, -5.25, 2.50,
                     0.06, -5.98, 2.36),
  uacord_R:       P(-0.15, -3.02, 1.80, -0.24, -3.48, 2.12, -0.28, -4.30, 2.46, -0.16, -5.25, 2.50,
                    -0.06, -5.98, 2.36),
};

/* ── the terminal cava, CUT OUT OF GEO.ivc rather than restated ──────────────────────────────────
   The span runs from Y_HEPATIC_CUT to the cranial end of the cava. The caudal end is interpolated on
   the cava's own polyline, so moving GEO.ivc moves this with it and a layout change cannot leave the
   two describing different vessels. See LAYERS.ivc_terminal for why it exists. */
/* BOTH ENDS AT A LANDMARK, which is what made this segment work. The caudal end is the HEPATIC
   VENOUS CONFLUENCE - GEO.ivc's own node - and the cranial end is the CAVAL OPENING OF THE
   DIAPHRAGM, which in this layout sits just above the liver's dome and well below the heart. That is
   the segment a student is taught: the ductus venosus and the hepatic veins join the cava here and it
   then leaves the abdomen.
   AND IT IS SHORT BECAUSE THE FRAME SAYS SO, measured rather than chosen. viz3d's distanceForBox adds
   the box's half-extent ALONG the view direction to the camera distance, so from beat 3's superior
   camera every unit of cranial reach is a unit of standing back. Cut to the right atrium at y = 1.95
   the beat's own highlighted ductus venosus fell from 0.741 to 0.085 per cent of the frame and cleared
   the pointed-at floor only through the liver - which is the defect R3-OPEN-1 was raised about, moved
   one structure to the left. Cut at the diaphragm the duct keeps its frame and still empties into a
   vessel. Both cut faces are CAPPED, because they are cuts and not open lumina. */
const Y_HEPATIC_CUT = -0.40;
const Y_DIAPHRAGM   =  0.15;
GEO.ivc_terminal = (function () {
  const pts = GEO.ivc, out = [];
  const at = y => {                                  // the point on the cava's own polyline at this y
    for (let i = 1; i < pts.length; i++) {
      const a = pts[i - 1], b = pts[i];
      if (a.y <= y && b.y >= y) {
        const f = (y - a.y) / (b.y - a.y);
        return V(a.x + (b.x - a.x) * f, y, a.z + (b.z - a.z) * f);
      }
    }
    throw new Error('ivc_terminal: y=' + y + ' is not on GEO.ivc');
  };
  out.push(at(Y_HEPATIC_CUT));
  for (const q of pts) if (q.y > Y_HEPATIC_CUT && q.y < Y_DIAPHRAGM) out.push(q.clone());
  out.push(at(Y_DIAPHRAGM));
  return out;
})();

/* ── THE TWO CAVAL STREAMS INSIDE THE RIGHT ATRIUM ───────────────────────────────────────────────
   Review finding R3-OPEN-2 (round 3). Beat 4 is titled "Streaming - why the fetus is not just mixed
   blood" and its narration ends "they cross the same chamber without properly mixing" - and every
   marker it drew rode on a caval centreline OUTSIDE the atrium, so the frame showed two streams
   ARRIVING at a chamber and never crossing it, which is the one word the beat exists to teach.
   Two rounds treated beat 4 as a camera problem; no camera shows a crossing that is not drawn.

   These are the two streams' paths THROUGH the cavity, each from its own caval mouth to its own
   destination, which is the whole of the streaming story and not a decoration:
     the INFERIOR stream is aimed by the crista dividens at the FORAMEN, so it runs from the caval
       mouth to the septal centre - and it carries F.fo, the solved interatrial shunt, so when the
       foramen shuts the crossing stops being drawn because the arithmetic stops it;
     the SUPERIOR stream turns down to the TRICUSPID orifice and carries F.svc, all of which goes to
       the right ventricle at every t.
   They cross inside the chamber, which acceptance row W measures rather than asserts. */
const RA_STREAM_R = 0.20;             // the streams are broader than a vessel and narrower than the chamber
/* the tricuspid orifice: on the line between the two right chambers' centres, at the right atrium's
   caudal boundary. Read off GEO so it follows the chambers rather than being pinned beside them. */
const TRICUSPID_FRAC = 0.62;
GEO.stream_ivc = (function () {
  const mouth = GEO.ivc[GEO.ivc.length - 1];
  const sep = V(GEO.septum.c[0], GEO.septum.c[1], GEO.septum.c[2]);
  return [mouth.clone(), mouth.clone().lerp(sep, 0.5), sep];
})();
GEO.stream_svc = (function () {
  const mouth = GEO.svc[GEO.svc.length - 1];
  const ra = V(GEO.ra.c[0], GEO.ra.c[1], GEO.ra.c[2]);
  const rv = V(GEO.rv.c[0], GEO.rv.c[1], GEO.rv.c[2]);
  const tricuspid = ra.clone().lerp(rv, TRICUSPID_FRAC);
  return [mouth.clone(), mouth.clone().lerp(tricuspid, 0.5), tricuspid];
})();
/* which solved flow each intra-atrial stream carries, and it matters that these are the SHUNT and the
   whole superior return rather than a pair of constants: the inferior stream is drawn crossing the
   chamber only while something crosses it, so when the foramen shuts the crossing stops being drawn
   because the arithmetic stopped it, not because a beat stopped asking for it. */
const RA_STREAMS = [
  { fk: 'flow_ivc', path: 'stream_ivc', q: F => F.fo },
  { fk: 'flow_svc', path: 'stream_svc', q: F => F.svc },
];
/* CALIBRE. Raised 20% from the first build, which measured clean and read as a lollipop: against
   chambers of the right size the vessels were thin enough that a student could not see which vessel
   was which, and the colour — which is the whole teaching here — had almost no area to show itself in.
   The ratios between them are anatomical; the common scaling is legibility. */
const R_ = {
  umbilical_vein: 0.276, ductus_venosus: 0.204, portal_sinus: 0.168, hepatic: 0.144,
  ivc: 0.306, svc: 0.258, pulmonary_trunk: 0.306, pa: 0.204, pv: 0.132,
  ductus_arteriosus: 0.258, ascending_aorta: 0.288, aortic_arch: 0.276,
  brachiocephalic: 0.156, carotid: 0.124, subclavian: 0.134,
  descending_aorta: 0.252, iliac: 0.180, ua: 0.138,
};

/* ───────────────────────────────────────────────────────── which blood is in which vessel

   One table again. Each entry names the centreline it is drawn on, the flow that runs through it and
   the saturation that colours it. `signed` marks the two vessels whose DIRECTION is itself the
   teaching — the duct and the foramen — where a negative flow means the arrows turn round.         */
/* CALIBRE AS A FUNCTION OF t — the four vessels that become ligaments. Everything else keeps the
   calibre in R_. Returned as a multiplier so the layout table stays the single source of the shape. */
function calibre(key, F, opts) {
  const o = opts || {}, pt = F.patency;
  const shrink = x => REMNANT + (1 - REMNANT) * x;
  /* A DUCT THAT NEVER CLOSES NEVER SHRINKS — AND `pfc` IS ALSO A DUCT THAT NEVER CLOSES.
   *
   * CORRECTED 2026-09-30 (round 3). This line read `o.pda && ...`, so the structural calibre was
   * held at 1 for the persistent-ductus variant and NOT for the persistent-fetal-circulation one,
   * while flows() line 306 — `const duct = (o.pda || o.pfc) ? 1 : closing(EVENTS.duct, t)` — holds
   * the LUMEN fully patent for both. So in the pfc build at t=1 the duct carried full flow through
   * a vessel drawn at REMNANT = 0.30 of its fetal calibre: a ligamentum arteriosum with the whole
   * right ventricular output going through it. The comment on this line already said the rule in
   * words; the condition implemented it for one of the two options that mean "never closes".
   *
   * It was invisible because nothing compared the two variants. It surfaced in RENDERED PIXELS:
   * under one identical superior camera and one identical structure set, pda_duct cleared the
   * visibility floor and pfc_duct read 0.132% — the builds differ in nothing else, and a tenth of
   * an order of magnitude in drawn area is what 0.30 of a radius costs. See BUILD-LOG 2026-09-30
   * round 3 and acceptance row S. */
  if ((o.pda || o.pfc) && key === 'ductus_arteriosus') return 1;
  switch (key) {
    case 'ductus_arteriosus': return shrink(pt.ductStruct);
    case 'ductus_venosus':    return shrink(pt.venosus);
    case 'umbilical_vein':    return shrink(pt.umbStruct);
    /* the umbilical arteries are the interesting one: the DISTAL part becomes the medial umbilical
       ligament while the proximal part stays open as the superior vesical artery, which the
       narration is explicit about — "the superior vesical arteries stay open and keep working" — so
       this taper runs ALONG the vessel and not merely with time. */
    case 'umbilical_arteries': return shrink(pt.umbStruct);
    default: return 1;
  }
}

const COLUMN = [
  { key: 'umbilical_vein',    path: 'umbilical_vein',    r: R_.umbilical_vein,    q: F => F.uv,      s: S => S.uv },
  { key: 'ductus_venosus',    path: 'ductus_venosus',    r: R_.ductus_venosus,    q: F => F.dv,      s: S => S.dv },
  { key: 'portal_sinus',      path: 'portal_sinus',      r: R_.portal_sinus,      q: F => F.hepatic, s: S => S.uv },
  { key: 'hepatic_veins',     path: 'hepatic_R',         r: R_.hepatic,           q: F => F.hepatic * 0.6, s: S => S.hep },
  { key: 'hepatic_veins',     path: 'hepatic_L',         r: R_.hepatic,           q: F => F.hepatic * 0.4, s: S => S.hep },
  { key: 'ivc',               path: 'ivc',               r: R_.ivc,               q: F => F.ivc,     s: S => S.ivc },
  { key: 'svc',               path: 'svc',               r: R_.svc,               q: F => F.svc,     s: S => S.svc },
  { key: 'pulmonary_trunk',   path: 'pulmonary_trunk',   r: R_.pulmonary_trunk,   q: F => F.rv,      s: S => S.pa },
  { key: 'pulmonary_arteries',path: 'pa_R',              r: R_.pa,                q: F => F.lung * 0.5, s: S => S.pa },
  { key: 'pulmonary_arteries',path: 'pa_L',              r: R_.pa,                q: F => F.lung * 0.5, s: S => S.pa },
  { key: 'pulmonary_veins',   path: 'pv_R',              r: R_.pv,                q: F => F.lung * 0.5, s: S => S.pv },
  { key: 'pulmonary_veins',   path: 'pv_L',              r: R_.pv,                q: F => F.lung * 0.5, s: S => S.pv },
  { key: 'ductus_arteriosus', path: 'ductus_arteriosus', r: R_.ductus_arteriosus, q: F => F.da,
    s: S => S.pa, sBack: S => S.aoa, signed: true },
  { key: 'ascending_aorta',   path: 'ascending_aorta',   r: R_.ascending_aorta,   q: F => F.lv,      s: S => S.aoa },
  { key: 'aortic_arch',       path: 'aortic_arch',       r: R_.aortic_arch,       q: F => F.isth,    s: S => S.aoa },
  { key: 'head_neck_vessels', path: 'brachiocephalic',   r: R_.brachiocephalic,   q: F => F.up * 0.45, s: S => S.aoa },
  { key: 'head_neck_vessels', path: 'carotid_L',         r: R_.carotid,           q: F => F.up * 0.25, s: S => S.aoa },
  { key: 'head_neck_vessels', path: 'subclavian_L',      r: R_.subclavian,        q: F => F.up * 0.30, s: S => S.aoa },
  { key: 'descending_aorta',  path: 'descending_aorta',  r: R_.descending_aorta,  q: F => F.low + F.plac, s: S => S.aod },
  { key: 'common_iliacs',     path: 'iliac_L',           r: R_.iliac,             q: F => (F.low + F.plac) * 0.5, s: S => S.aod },
  { key: 'common_iliacs',     path: 'iliac_R',           r: R_.iliac,             q: F => (F.low + F.plac) * 0.5, s: S => S.aod },
  { key: 'umbilical_arteries',path: 'ua_L',              r: R_.ua,                q: F => F.plac * 0.5, s: S => S.ua },
  { key: 'umbilical_arteries',path: 'ua_R',              r: R_.ua,                q: F => F.plac * 0.5, s: S => S.ua },
  { key: 'umbilical_arteries',path: 'uacord_L',          r: R_.ua,                q: F => F.plac * 0.5, s: S => S.ua },
  { key: 'umbilical_arteries',path: 'uacord_R',          r: R_.ua,                q: F => F.plac * 0.5, s: S => S.ua },
];
const CHAMBERS = [
  { key: 'right_atrium',    g: 'ra', s: S => S.ra },
  { key: 'left_atrium',     g: 'la', s: S => S.la },
  { key: 'right_ventricle', g: 'rv', s: S => S.rv },
  { key: 'left_ventricle',  g: 'lv', s: S => S.lv },
];

/* ─────────────────────────────────────────────────────────────────────── flow markers

   "Needs flow arrows along vessel centrelines, not new tissue" — the queue item's own words, and the
   reason these are cones sampled off the SAME arrays the tubes were swept along rather than a second
   set of positions that could drift. A marker's direction is the SIGN of the solved flow; its size is
   the magnitude; its colour is the local saturation. So when the duct reverses, the arrows in it
   reverse, because nothing here knows which way they are supposed to point.                        */
/* THE MAGNITUDE LAW, WRITTEN ONCE. Both flow markers in this model scale their LENGTH by it, and the
   reason it is a named function rather than the same arithmetic in two places is review finding
   R3-OPEN-3: the foramen marker below carried the flow's SIGN and not its magnitude at all, so beat 8
   drew an interatrial arrow the size of beat 5's while the solved shunt between them had fallen
   fourteenfold. Two copies of a rule is one copy of the rule and one place for it to go missing. */
function magLaw(qSigned) { return 1.80 + 1.60 * Math.min(1, Math.abs(qSigned) / 0.60); }

function markerCones(points, qSigned, radius) {
  const out = [];
  const mag = Math.abs(qSigned);
  if (mag < FLOW_MARKER_MIN) return out;              // below this a vessel is not carrying anything
  const dir = qSigned >= 0 ? 1 : -1;
  const total = [];
  let L = 0;
  for (let i = 1; i < points.length; i++) L += points[i].distanceTo(points[i - 1]);
  const n = Math.max(1, Math.round(L / 1.20));
  /* WIDTH IS FIXED TO THE VESSEL; LENGTH CARRIES THE FLOW.
     Two wrong versions got this here. The first scaled the marker's WIDTH with the flow, up to twice
     its vessel's radius, and put a cone larger than the pulmonary trunk across the middle of the
     heart. The second shrank it to 0.8 of the radius, which is INSIDE an opaque tube: the markers
     were built, they were correct, and not one pixel of them reached the screen. A marker rides on
     the centreline, so it has to be wider than the vessel to be seen at all. At 1.15 it was visible
     and useless: only a thin band cleared the tube, so every marker read as a COLLAR and none of them
     pointed anywhere — which on a model whose whole subject is which way the blood goes is the same
     as not drawing them. At 1.75 the cone's taper clears the vessel and the silhouette is a triangle,
     and the flow is shown by how LONG that triangle is. */
  const size = radius * 1.75;
  const len = radius * magLaw(qSigned);
  for (let m = 0; m < n; m++) {
    const u = (m + 0.5) / n;
    let want = u * L, acc = 0, seg = 0, frac = 0;
    for (let i = 1; i < points.length; i++) {
      const d = points[i].distanceTo(points[i - 1]);
      if (acc + d >= want) { seg = i; frac = (want - acc) / Math.max(1e-9, d); break; }
      acc += d; seg = i; frac = 1;
    }
    const a = points[seg - 1], b = points[seg];
    const c = new T.Vector3().lerpVectors(a, b, frac);
    const tan = new T.Vector3().subVectors(b, a).normalize().multiplyScalar(dir);
    const tip = c.clone().addScaledVector(tan, len * 0.62);
    const base = c.clone().addScaledVector(tan, -len * 0.38);
    const mid = c.clone().addScaledVector(tan, len * 0.10);
    out.push(K.tubeAlong([base, mid, tip], u2 => size * Math.max(0.001, 1 - u2), { ring: 12 }));
    total.push(1);
  }
  return out;
}

/* ─────────────────────────────────── THE ONE MARKER THAT RIDES ON NO CENTRELINE
 *
 * The interatrial shunt crosses the septum instead of running along a vessel, so it cannot come out
 * of markerCones(); it takes markerCones' TWO RULES instead, and for the same two reasons.
 *
 *   WIDTH IS FIXED TO THE VESSEL. Here the vessel is the FORAMEN, and markerCones fixes its width to
 *   the vessel's CURRENT calibre (`c.r * calibre(...)`), not its fetal one. The foramen's calibre is
 *   the APERTURE the flap leaves: the free edge lifted off the septum, which is solved from the
 *   flap's own angle and therefore from the solved interatrial gradient. An arrow wider than the hole
 *   it passes through is drawing a shunt the geometry does not have.
 *
 *   LENGTH CARRIES THE FLOW, by magLaw, normalised by the FETAL shunt - the same idiom the flap angle
 *   already uses (`openFrac = F.dPatria / _dpFetal()`), so the fetal marker is the one this model has
 *   always drawn and every later t is measured against it rather than against a new constant.
 *
 * R3-OPEN-3, review round 3, 2026-09-30: this was built with FIXED extents (-0.30 and +0.34 along
 * nAx, radius 0.15) and took only the SIGN of F.fo. Measured on the built triangles, the marker at
 * t=0.0998 was VERTEX-FOR-VERTEX IDENTICAL to the one at t=0 while the solved shunt had fallen from
 * 0.2600 to 0.0186 - fourteenfold - so beat 8, "The flap is pressed shut", drew an interatrial arrow
 * at 1.401 per cent of the frame against beat 5's 1.449, which is 3.8x the foramen_ovale it passes
 * through and the most salient object in a frame whose narration says the leaf is lying flat. The
 * marker must SHRINK and must not VANISH: the residual shunt is genuinely non-zero there
 * (0.0186 > FLOW_MARKER_MIN), and the review proved the fix is not the scene's @0 pin by measuring
 * that unpinning moves beat 8 not at all. */
const FO_MARKER_W = 0.15;     // the marker's radius at a fully patent foramen - its widest
const FO_MARKER_L = 0.64;     // its whole length at the FETAL shunt - the length it has always had
const FO_BASE_FRAC = 0.469;   // where sepC sits along it: reproduces the old -0.30 / +0.34 at L = 0.64
let _fo0 = null;
function _foFetal() { if (_fo0 == null) _fo0 = flows(0, {}, SOLVED).fo; return _fo0; }

function foMarkerDims(F, ang) {
  /* the gap the shunt crosses: the flap's free edge lifted off the septal plane. The lever arm is the
     leaf's own radius and the angle is the one build() rotates it by, so this is the aperture the
     drawn flap actually leaves and not a second opinion about it. */
  const gap = GEO.septum.rIn * 1.32 * Math.sin(Math.max(0, ang));
  return { w: Math.min(FO_MARKER_W, gap),
           l: FO_MARKER_L * magLaw(F.fo) / magLaw(_foFetal()),
           gap: gap, mag: Math.abs(F.fo) };
}
/* the same dimensions as a pure function of t, so measure() and build() cannot disagree about them */
function foMarkerAt(t, opts) {
  const F = flows(t, opts || {}, SOLVED);
  const openFrac = Math.max(0, Math.min(1, F.dPatria / Math.max(1e-9, _dpFetal())));
  return foMarkerDims(F, 0.62 * openFrac);
}

/* ───────────────────────────────────────────────────────────────────────────── the build */

let _lastState = null;

function buildFetalCirculation(t, opts) {
  const o = Object.assign({}, opts || {});
  const tt = Math.max(0, Math.min(1, typeof t === 'number' ? t : 1));
  const st = state(tt, o);
  _lastState = st;
  const F = st.flow, S = st.sat;
  const g = new T.Group();
  g.userData.model = 'fetal-circulation';
  g.userData.t = tt;

  const tint = (key, sat) => (o.plain || sat == null) ? LAYERS[key].color : satHex(sat);
  const add = (key, geo, colour, over) =>
    K.addSolid(g, key, geo, { color: colour, name: LAYERS[key].name, outline: 0.022, matOver: over });

  /* the two exchangers and the one solid organ keep their own colour: they are tissue, not a blood
     column, and painting an organ with a saturation would say something the physiology does not */
  add('placenta', blob(GEO.placenta.c[0], GEO.placenta.c[1], GEO.placenta.c[2],
       GEO.placenta.r[0], GEO.placenta.r[1], GEO.placenta.r[2],
       { ring: 40, rows: 22, warp: (x, y, z) => 1 + 0.030 * (Math.sin(5.5 * x) + Math.sin(5.5 * y) + Math.sin(5.5 * z)) }),
      LAYERS.placenta.color);
  add('liver', blob(GEO.liver.c[0], GEO.liver.c[1], GEO.liver.c[2],
       GEO.liver.r[0], GEO.liver.r[1], GEO.liver.r[2],
       { ring: 34, rows: 20, warp: (x, y, z) => 1 + 0.10 * x - 0.07 * Math.max(0, -y) + 0.05 * z }),
      LAYERS.liver.color);
  for (const L of ['lungR', 'lungL'])
    add('lungs', blob(GEO[L].c[0], GEO[L].c[1], GEO[L].c[2], GEO[L].r[0], GEO[L].r[1], GEO[L].r[2],
        { ring: 28, rows: 20 }),
        LAYERS.lungs.color,
        /* The fetal lung is fluid filled and airless and it clears as the breath is taken, so it is
           drawn translucent and clearing — a function of the same curve the network reads.
           FRONT SIDE ONLY, and depth-write off: on DoubleSide the far wall showed THROUGH the near
           one and each lung came out as a striped balloon, which is a rendering artefact that reads
           exactly like an anatomical feature. */
        { transparent: true, side: T.FrontSide, depthWrite: false,
          opacity: 0.34 + 0.34 * (1 - F.patency.breath) });

  for (const ch of CHAMBERS) {
    const G2 = GEO[ch.g];
    add(ch.key, blob(G2.c[0], G2.c[1], G2.c[2], G2.r[0], G2.r[1], G2.r[2], { ring: 28, rows: 18 }),
        tint(ch.key, ch.s(S)));
  }

  for (const c of COLUMN) {
    const pts = GEO[c.path];
    const back = c.signed && c.q(F) < 0;
    const sat = back && c.sBack ? c.sBack(S) : c.s(S);
    const caps = { capStart: false, capEnd: false };
    if (c.path === 'brachiocephalic' || c.path === 'carotid_L' || c.path === 'subclavian_L') caps.capEnd = true;
    const k = calibre(c.key, F, o);
    /* the medial umbilical ligament: the taper runs along the vessel, proximal end kept open */
    const alongTaper = (c.key === 'umbilical_arteries')
      ? (u => c.r * (c.path.indexOf('ua_') === 0 ? (1 - (1 - k) * Math.min(1, u * 1.6)) : k))
      : (() => c.r * k);
    for (const geo of vesselGeoms(pts, alongTaper, caps)) add(c.key, geo, tint(c.key, sat));
  }

  /* THE TERMINAL CAVA, on its own key and behind its own flag. Same radius, same saturation and the
     same centreline as `ivc` over this span — it is the cava, cut at the hepatic confluence so a beat
     about the ductus venosus can show WHERE THE DUCT GOES without putting a six-unit column along its
     own view direction. Review finding R3-OPEN-1. The flag keeps it out of a direct
     build(t, {flow:true}) — the proof harness's frames — where it would z-fight with `ivc`; the
     adapter builds with FULL and slices by key, so the player never draws both. */
  if (o.ivcTerminal)
    for (const geo of vesselGeoms(GEO.ivc_terminal, () => R_.ivc, { capStart: true, capEnd: true }))
      add('ivc_terminal', geo, tint('ivc_terminal', S.ivc));

  /* ─── the atrial septum, the foramen and the flap ─────────────────────────────────────────── */
  const raC = V(GEO.ra.c[0], GEO.ra.c[1], GEO.ra.c[2]);
  const laC = V(GEO.la.c[0], GEO.la.c[1], GEO.la.c[2]);
  const sepC = V(GEO.septum.c[0], GEO.septum.c[1], GEO.septum.c[2]);
  const nAx = new T.Vector3().subVectors(laC, raC).normalize();          // RA -> LA, the shunt direction
  const vAx = V(0, 1, 0).addScaledVector(nAx, -nAx.y).normalize();       // cranial, in the septal plane
  const uAx = new T.Vector3().crossVectors(vAx, nAx).normalize();
  add('atrial_septum', annularSheet(sepC, uAx, vAx, nAx, GEO.septum.rIn, GEO.septum.rOut,
      GEO.septum.h, 36, 7), LAYERS.atrial_septum.color);

  /* THE CRISTA DIVIDENS — the free lower edge of the septum secundum, the ridge that splits the
     inferior caval stream. It is a crescent on the CAUDAL rim of the foramen, which is the side the
     inferior caval stream arrives on; drawn anywhere else it would be decorative. */
  {
    const arc = [];
    for (let i = 0; i <= 14; i++) {
      const a = Math.PI * (1.18 + 0.64 * (i / 14));    // the caudal third of the rim
      arc.push(sepC.clone()
        .addScaledVector(uAx, GEO.septum.rIn * 1.04 * Math.cos(a))
        .addScaledVector(vAx, GEO.septum.rIn * 1.04 * Math.sin(a))
        .addScaledVector(nAx, -0.02));
    }
    add('crista_dividens', K.tubeAlong(arc, u => 0.070 * (0.55 + 0.45 * Math.sin(Math.PI * u)), { ring: 14 }),
        LAYERS.crista_dividens.color);
  }

  /* THE FLAP. Its angle is not a constant and not a curve fitted to "closes in minutes": it is the
     SOLVED interatrial pressure difference, normalised by its own fetal value. When the network says
     left has overtaken right, the leaf lies on the septum — which is the mechanism the narration
     describes, arrived at rather than asserted. */
  {
    const dp0 = _dpFetal();
    const openFrac = Math.max(0, Math.min(1, F.dPatria / Math.max(1e-9, dp0)));
    const ang = 0.62 * openFrac;                       // radians, ~36 degrees fully open
    const hinge = sepC.clone().addScaledVector(vAx, GEO.septum.rIn * FLAP_HINGE_V);
    const closedC = sepC.clone().addScaledVector(nAx, GEO.septum.h * 0.5 + 0.035);
    let geo = leaf(closedC, uAx, vAx, nAx, GEO.septum.rIn * 1.32, 0.075, 30, 6);
    const M = new T.Matrix4()
      .makeTranslation(hinge.x, hinge.y, hinge.z)
      .multiply(new T.Matrix4().makeRotationAxis(uAx, ang))
      .multiply(new T.Matrix4().makeTranslation(-hinge.x, -hinge.y, -hinge.z));
    geo.applyMatrix4(M);
    geo.computeBoundingBox = geo.computeBoundingBox;   // (buffer already carries explicit normals)
    /* applyMatrix4 rotates normals too for a pure rotation, which this is */
    add('foramen_ovale', geo, tint('foramen_ovale', S.la));
    g.userData.flapAngle = ang;
    g.userData.flapOpenFraction = openFrac;
  }

  /* ─── flow, as an optional layer ─────────────────────────────────────────────────────────── */
  if (o.flow) {
    for (const c of COLUMN) {
      const cones = markerCones(GEO[c.path], c.q(F), c.r * calibre(c.key, F, o));
      const back = c.signed && c.q(F) < 0;
      const sat = back && c.sBack ? c.sBack(S) : c.s(S);
      const fk = FLOW_KEY_OF[c.key] || 'flow';
      /* THE ARROWS ARE GOLD, NOT THE SATURATION COLOUR, and that is a correction rather than a
         choice. Painted with the saturation of the blood they carry, every marker was the exact
         colour of the vessel around it and vanished — in the first six renders of this model the
         flow layer was on and INVISIBLE, and only the plain-colour frame showed that it had built
         anything at all. The vessel carries the saturation; the arrow carries the direction; putting
         both on both leaves the direction carrying nothing. */
      for (const geo of cones)
        K.addSolid(g, fk, geo, { color: LAYERS[fk].color, name: LAYERS[fk].name,
                                 noOutline: true, renderOrder: 2,
                                 matOver: { emissive: C(0x4a3400), roughness: 0.35 } });
    }
    /* THE TWO CAVAL STREAMS CROSSING THE CHAMBER. They carry the SAME keys as their own vessels'
       markers, so a beat that shows a caval stream's arrows gets the whole stream — arriving and
       crossing — and no beat has to name a second key to see the crossing it narrates. Review
       finding R3-OPEN-2; the paths and the flows they carry are at GEO.stream_ivc above. */
    for (const st2 of RA_STREAMS)
      for (const geo of markerCones(GEO[st2.path], st2.q(F), RA_STREAM_R))
        K.addSolid(g, st2.fk, geo, { color: LAYERS[st2.fk].color, name: LAYERS[st2.fk].name,
                                     noOutline: true, renderOrder: 2,
                                     matOver: { emissive: C(0x4a3400), roughness: 0.35 } });

    /* the shunt itself, through the septum: one marker in the foramen, pointing the way the solved
       gradient sends it, sized by how much crosses and how far the flap is lifted (foMarkerDims
       above, review finding R3-OPEN-3), and absent when nothing crosses */
    if (Math.abs(F.fo) > FLOW_MARKER_MIN) {
      const fm = foMarkerDims(F, g.userData.flapAngle);
      const sgn = F.fo >= 0 ? 1 : -1;
      const a = sepC.clone().addScaledVector(nAx, -FO_BASE_FRAC * fm.l * sgn);
      const b = sepC.clone().addScaledVector(nAx, (1 - FO_BASE_FRAC) * fm.l * sgn);
      const mid = new T.Vector3().lerpVectors(a, b, 0.55);
      K.addSolid(g, 'flow_foramen_ovale',
        K.tubeAlong([a, mid, b], u => fm.w * Math.max(0.001, 1 - u), { ring: 12 }),
        { color: LAYERS.flow_foramen_ovale.color, name: LAYERS.flow_foramen_ovale.name,
          noOutline: true, renderOrder: 2,
          matOver: { emissive: C(0x4a3400), roughness: 0.35 } });
    }
  }

  /* ─── the median plane, as a TRACE drawn clear of the subject ────────────────────────────── */
  if (o.midline) {
    /* RENDER-STANDARD, round 3: a rod lying IN the median plane is seen edge-on by the anterior
       camera and buried by whatever is in front of it — 96.5% occluded, measured, on the model this
       rule came from. What a plane gives a camera looking along it is its TRACE, so this is drawn
       ventral of everything, where it can be seen, and it is labelled as the trace it is. */
    const zFront = 3.05;
    add('midline', K.tubeAlong([V(0, -6.9, zFront), V(0, 0, zFront), V(0, 6.4, zFront)],
        () => 0.035, { ring: 10 }), LAYERS.midline.color);
  }

  return g;
}

/* the fetal interatrial gradient, computed once and cached — the normaliser for the flap angle */
let _dp0 = null;
function _dpFetal() { if (_dp0 == null) _dp0 = flows(0, {}, SOLVED).dPatria; return _dp0; }

/* ═══════════════════════════════════════════════════════════════════════════════ acceptance

   Written so that the arithmetic is visible and not just the conclusion, and so that every one of
   these can be fed a deliberately wrong input and made to reject it (negatives() below).

   EVERY RELATIONAL ASSERTION CARRIES A MAGNITUDE FLOOR, expressed as a fraction of the relevant
   extent of the things compared — RENDER-STANDARD, after three review rounds were spent on tests
   that were true and invisible. A sign test on this model would pass on a picture in which nothing
   a student can see has changed.                                                                   */

const FLOORS = {
  /* 0.25 and not 0.35, and the reason is written down rather than left as a softened number: the
     physiology itself puts only about a third of the whole fetal oxygen cascade between the ascending
     and the descending aorta (0.80 at the umbilical vein, 0.65 at the ascending aorta, 0.58 at the
     descending one). A 0.35 floor here would be a floor the anatomy cannot clear, which makes it a
     badly set floor and not a finding about the model. It is still a floor with teeth: the negative
     case below is a gap of 1% of the cascade, which is the shape of defect this exists to catch. */
  order:   0.25,   // of the full arterial saturation cascade, umbilical vein down to umbilical artery
  shunt:   0.35,   // of right ventricular output, for a shunt to count as a shunt
  spatial: 0.35,   // of the mean extent of the two structures compared, along the axis compared
  reversal: 0.15,  // of combined ventricular output, for a reversed duct to be a real left-to-right shunt
  /* 0.35 OF THE FETAL MARKER'S DRAWN AREA. Row V's floor, and it is set where it is because the
     defect it exists to catch was a marker whose drawn area fell by EXACTLY NOTHING while the flow
     through it fell fourteenfold (R3-OPEN-3). A sign-only marker passes any test that asks whether
     the marker exists; this asks whether a student could see that less is going through. */
  marker: 0.35,
};

const ACCEPTANCE = {
  axes: '+x = fetus LEFT, -x = RIGHT, +y = CRANIAL, +z = VENTRAL',
  A: 'at t=0 the network reproduces the five calibrated fetal flows - placenta 40%, lungs 8%, upper body 22%, lower body 30%, foramen ovale 26% of combined output - AND PREDICTS the two that were never calibrated: a right ventricle doing 66% of the work and a duct carrying 58%',
  B: 'at t=0 the umbilical vein is at 0.80 saturation — "about eighty percent, the highest anywhere in the fetus"',
  C: 'at t=0 the inferior caval stream reaches the right atrium at 0.70 — "at about seventy percent". This is the SOLVED constraint: whole-body oxygen extraction is bisected until it holds',
  D: 'at t=0 the ascending aorta is better oxygenated than the descending aorta by at least 0.25 of the whole oxygen cascade (umbilical vein minus umbilical artery) - the relation the entire scene turns on',
  E: 'at t=0 the duct carries blood RIGHT TO LEFT, at least 0.35 of right ventricular output',
  F: 'with the duct held open, at t=1 it carries blood LEFT TO RIGHT — the sign NEGATED, not merely small — at least 0.15 of combined output. A duct that simply shrank would pass a sign test and fail this one',
  G: 'at t=1 the normal circulation is in series: foramen and duct both shut, no placental flow, pulmonary flow at least 0.45 of combined output',
  H: 'the built geometry puts the right atrium on -x and the left on +x, separated by at least 0.35 of their mean width — the axis convention asserted rather than commented',
  I: 'the duct joins the descending aorta CAUDAL to the origin of the left subclavian — "beyond the head and arm vessels" — by at least 0.35 of the mean vertical extent of the arch and its branches',
  J: 'the umbilical vein runs VENTRAL to the inferior vena cava — "up in the free edge of the falciform ligament" — by at least 0.35 of their mean depth',
  K: 'two umbilical arteries and one umbilical vein — "two arteries one vein"',
  L: 'in persistent fetal circulation at t=1 the shunts still run right to left and the systemic arterial saturation stays low — "the newborn stays blue"',
  M: 'the flap angle is driven by the solved interatrial gradient: fully open at t=0, flat on the septum once left atrial pressure has overtaken right',
  N: 'conservation holds: every node balances to better than 1e-6 at every t measured',
  P: 'at t=1 the three ducts and the umbilical vein have lost at least 60% of their fetal calibre - the ligamentum arteriosum, venosum and teres are cords and not vessels - while at t=0 all four are at full calibre',
  O: 'the descending aorta lands between 0.55 and 0.62 - PREDICTED, never calibrated to, and the check that says the two mixing constraints did not simply buy the answer',
  Q: 'the septum primum flap is hinged on the CAUDAL rim of the foramen with its free edge cranial, and it opens INTO THE LEFT ATRIUM - the two signs row M cannot carry, because an angle is the same on either side of the septum',
  S: 'a duct that never closes never shrinks, for BOTH options that mean it: at t=1 the ductus arteriosus keeps its full fetal calibre in the pda build AND in the pfc build, and loses at least 60% of it in the plain one. The two variant builds must agree with each other exactly - the defect this catches held the pfc duct at REMNANT while its lumen carried full flow',
  T: 'the flow markers are PARTITIONED by key, not duplicated: the six flow keys between them account for every flow triangle the model builds, no triangle is emitted under two keys, and each of the three shunt keys AND both caval stream keys are present',
  U: 'in persistent fetal circulation at t=1 the FORAMEN is still shunting RIGHT TO LEFT and its flap is still held open by the solved gradient — so the beat that narrates "the arrows in it and through the foramen still run right to left" has a foramen to draw — while in the plain and pda builds at the same t the foramen is shut and carries too little for a marker to be emitted at all. Row L asserts this of the DUCT and its wording says "the shunts" plural; this is the half of that sentence nothing measured, and it is what review finding R2-OPEN-2 turned on',
  V: 'the interatrial flow marker CARRIES ITS MAGNITUDE AND NOT ONLY ITS SIGN: both of its drawn dimensions fall between the fetal shunt and the shunt ten minutes after birth - length by the same magLaw markerCones uses, width by the aperture the solved flap angle leaves - so its drawn area falls to at most 0.35 of the fetal one, while neither marker vanishes. The fetal marker is unchanged, which is what stops the fix from being a quietly smaller arrow everywhere',
  W: 'THE TWO CAVAL STREAMS CROSS THE RIGHT ATRIUM, measured rather than narrated: each stream starts exactly at its own caval mouth and ends exactly at its own destination (the septum for the inferior, the tricuspid orifice for the superior), the two chords pass within one stream width of each other, that crossing point lies INSIDE the right atrial ellipsoid, and it is not at either chord\'s end. And it is drawn only while it happens: the inferior stream carries the solved interatrial shunt, so at t=1 it falls below the marker threshold and the crossing stops being drawn, while the superior stream still carries the whole superior return',
  R: 'the newborn preductal saturation curve has the SHAPE the model can honestly claim: it dips below the fetal value after the cord is clamped, then rises monotonically from its nadir to a plateau above 0.97 by six weeks. It is deliberately NOT asserted against the published 1/5/10-minute targets - see gaps: no monotone aeration profile can reach them in a steady-state network, and that is proved by measurement rather than assumed',
};

const REMNANT_KEYS = ['ductus_arteriosus', 'ductus_venosus', 'umbilical_vein', 'umbilical_arteries'];

function boxOfPoints(pts) {
  const b = { minx: 1e9, maxx: -1e9, miny: 1e9, maxy: -1e9, minz: 1e9, maxz: -1e9, cx: 0, cy: 0, cz: 0, n: 0 };
  for (const p of pts) {
    b.minx = Math.min(b.minx, p.x); b.maxx = Math.max(b.maxx, p.x);
    b.miny = Math.min(b.miny, p.y); b.maxy = Math.max(b.maxy, p.y);
    b.minz = Math.min(b.minz, p.z); b.maxz = Math.max(b.maxz, p.z);
    b.cx += p.x; b.cy += p.y; b.cz += p.z; b.n++;
  }
  b.cx /= b.n; b.cy /= b.n; b.cz /= b.n;
  return b;
}

/* the raw measurements — cheap, no geometry built, read off the same tables the geometry is built
   from, so a layout change moves the measurement with it */
function measure() {
  const arch = boxOfPoints(GEO.aortic_arch);
  const branches = boxOfPoints([].concat(GEO.brachiocephalic, GEO.carotid_L, GEO.subclavian_L));
  const uvBox = boxOfPoints(GEO.umbilical_vein), ivcBox = boxOfPoints(GEO.ivc);
  const f0 = flows(0, {}, SOLVED), s0 = saturations(f0, 0, {}, extract());
  const f1 = flows(1, {}, SOLVED), s1 = saturations(f1, 1, {}, extract());
  const fP = flows(1, { pda: true }, SOLVED);
  const fC = flows(1, { pfc: true, cordIntact: false }, SOLVED);
  const sC = saturations(fC, 1, { pfc: true }, extract());
  return {
    f0: f0, s0: s0, f1: f1, s1: s1, fPda: fP, fPfc: fC, sPfc: sC,
    raX: GEO.ra.c[0], laX: GEO.la.c[0], raW: 2 * GEO.ra.r[0], laW: 2 * GEO.la.r[0],
    ductJunctionY: GEO.ductus_arteriosus[GEO.ductus_arteriosus.length - 1].y,
    subclavianOriginY: GEO.subclavian_L[0].y,
    archExtentY: arch.maxy - arch.miny,
    branchExtentY: branches.maxy - branches.miny,
    uvZ: uvBox.cz, ivcZ: ivcBox.cz,
    uvDepth: uvBox.maxz - uvBox.minz, ivcDepth: ivcBox.maxz - ivcBox.minz,
    /* two arteries, each in two spans — the count is of SIDES, not of sweeps */
    nUmbArteries: new Set(COLUMN.filter(c => c.key === 'umbilical_arteries')
                    .map(c => c.path.endsWith('_L') ? 'L' : 'R')).size,
    nUmbVeins: COLUMN.filter(c => c.key === 'umbilical_vein').length,
    flapOpen0: flapOpenFraction(0), flapOpen1: flapOpenFraction(1),
    flap0: flapFrame(0), flap1: flapFrame(1),
    /* the newborn preductal curve, sampled here so check() can assert its SHAPE rather than
       report.json merely printing it beside targets it misses — see row R */
    satCurve: [0.5, 1, 2, 3, 4, 5, 10, 30, 60, 600].map(m => ({ min: m, aoa: preductalAt(m) })),
    satFetal: saturations(flows(0, {}, SOLVED), 0, {}, extract()).aoa,
    calibre0: REMNANT_KEYS.map(k => calibre(k, f0, {})),
    calibre1: REMNANT_KEYS.map(k => calibre(k, f1, {})),
    /* ROW S. The duct's calibre multiplier at t=1 under the three builds, read from the model's own
       calibre() rather than restated here — the perturbation that proves it measures something is
       the condition inside calibre() itself: put `o.pda` back in place of `(o.pda || o.pfc)` and
       ductPfc1 moves from 1 to REMNANT while ductPda1 does not move at all. */
    ductPlain1: calibre('ductus_arteriosus', f1, {}),
    ductPda1:   calibre('ductus_arteriosus', f1, { pda: true }),
    ductPfc1:   calibre('ductus_arteriosus', f1, { pfc: true }),
    /* ROW T. The flow-key partition, counted off the COLUMN table and the key map that drives the
       build, so adding a vessel or renaming a key moves these. flowKeys is what the model will emit;
       flowKeyDup counts any vessel the map sends to a key it also sends another vessel's markers to
       under a DIFFERENT name, which is the duplication the row forbids. */
    flowKeys: FLOW_KEYS.slice(),
    flowKeysDeclared: FLOW_KEYS.every(k => !!LAYERS[k]),
    flowKeyOfEveryColumn: COLUMN.every(c => FLOW_KEYS.indexOf(FLOW_KEY_OF[c.key] || 'flow') >= 0),
    shuntFlowKeys: ['flow_ductus_venosus', 'flow_foramen_ovale', 'flow_ductus_arteriosus'],
    /* ROW U's stream half: the two caval keys beat 4 shows, and whether either vessel is actually
       carrying enough at t=0 for markerCones to emit anything under them. A key declared for a beat
       that then draws nothing is the defect this scene has already been bitten by twice. */
    streamFlowKeys: ['flow_ivc', 'flow_svc'],
    streamCarries0: [Math.abs(f0.ivc), Math.abs(f0.svc)],
    /* ROW U. THE FORAMEN IN THE THREE t=1 BUILDS, read off flows() and the SAME threshold the
       marker is emitted under, so the row cannot drift from the build. fo > 0 is right-to-left:
       it is the sign convention row L already uses for the duct, and the sign the marker's own
       cone direction is taken from at build() line ~1161. */
    foPfc1: fC.fo, foPlain1: f1.fo, foPda1: fP.fo,
    foMarkerMin: FLOW_MARKER_MIN,
    flapOpenPfc1: (function () {
      const F = flows(1, { pfc: true, cordIntact: false }, SOLVED);
      return Math.max(0, Math.min(1, F.dPatria / Math.max(1e-9, _dpFetal())));
    })(),
    /* ROW V. The foramen marker's two DRAWN dimensions, from foMarkerAt() - the same arithmetic
       build() uses through foMarkerDims() - at the fetal shunt and at beat 8's own instant. A row that
       restated the formula here would stop measuring the build the moment either copy moved. */
    foMarkerFetal: foMarkerAt(0, {}),
    foMarkerBeat8: foMarkerAt(BEAT8_T, {}),
    foMarkerWMax: FO_MARKER_W,
    markerFloor: FLOORS.marker,
    /* ROW W. The intra-atrial streams, off GEO.stream_* and the chamber table they were derived from */
    raStreams: raStreamGeometry(),
    raStreamR: RA_STREAM_R,
    raStreamCarries0: RA_STREAMS.map(st => Math.abs(st.q(f0))),
    raStreamCarries1: RA_STREAMS.map(st => Math.abs(st.q(f1))),
    residual: Math.max(f0.residual, f1.residual, fP.residual, fC.residual),
  };
}

/* BEAT 8's OWN t, named once. It is the instant the scene's "The flap is pressed shut" beat sits at,
   and row V is about what that beat DRAWS, so the row has to be evaluated there and not at a round
   number nearby. If the scene moves the beat, this has to move with it - which is the kind of coupling
   a claims[] check is for, and viz-training/tools/check-beat-claims.mjs now carries it. */
const BEAT8_T = 0.0998;

/* WHERE THE TWO INTRA-ATRIAL STREAMS ACTUALLY GO, from the same tables build() sweeps them along.
   Everything here is geometry, not narration: the closest approach of two chords has a closed form,
   and "inside the right atrium" is the normalised radius in the chamber's own ellipsoid. */
function raStreamGeometry() {
  const A = GEO.stream_ivc, B = GEO.stream_svc;
  const a0 = A[0], a1 = A[A.length - 1], b0 = B[0], b1 = B[B.length - 1];
  const sep = V(GEO.septum.c[0], GEO.septum.c[1], GEO.septum.c[2]);
  const ra = V(GEO.ra.c[0], GEO.ra.c[1], GEO.ra.c[2]);
  const rv = V(GEO.rv.c[0], GEO.rv.c[1], GEO.rv.c[2]);
  const tricuspid = ra.clone().lerp(rv, TRICUSPID_FRAC);
  const d0 = a1.clone().sub(a0), d1 = b1.clone().sub(b0), w0 = a0.clone().sub(b0);
  const aa = d0.dot(d0), bb = d0.dot(d1), cc = d1.dot(d1), dd = d0.dot(w0), ee = d1.dot(w0);
  const den = aa * cc - bb * bb;
  const sPar = den > 1e-12 ? (bb * ee - cc * dd) / den : 0;
  const uPar = den > 1e-12 ? (aa * ee - bb * dd) / den : 0;
  const pA = a0.clone().addScaledVector(d0, sPar), pB = b0.clone().addScaledVector(d1, uPar);
  const mid = pA.clone().lerp(pB, 0.5);
  const rr = GEO.ra.r;
  const nx = (mid.x - ra.x) / rr[0], ny = (mid.y - ra.y) / rr[1], nz = (mid.z - ra.z) / rr[2];
  return {
    mouthGapIvc: a0.distanceTo(GEO.ivc[GEO.ivc.length - 1]),
    mouthGapSvc: b0.distanceTo(GEO.svc[GEO.svc.length - 1]),
    endGapSeptum: a1.distanceTo(sep),
    endGapTricuspid: b1.distanceTo(tricuspid),
    crossS: sPar, crossU: uPar, crossDist: pA.distanceTo(pB),
    crossRadiusInRA: Math.sqrt(nx * nx + ny * ny + nz * nz),
  };
}

function preductalAt(mins) { return saturations(flows(tOfMinutes(mins), {}, SOLVED), tOfMinutes(mins), {}, extract()).aoa; }

function flapOpenFraction(t) {
  const F = flows(t, {}, SOLVED);
  return Math.max(0, Math.min(1, F.dPatria / Math.max(1e-9, _dpFetal())));
}

/* WHERE THE FLAP ACTUALLY IS, in the septal frame, from the SAME arithmetic build() uses.
 *
 * Row M measures the flap's ANGLE, and an angle is the same whichever side of the septum the leaf
 * ends up on and whichever rim it turns about — which is how R1-OPEN-3 survived five review rounds
 * and a 16-row battery. This returns the two signs an angle cannot carry:
 *   hinge_v  <0 the leaf is hinged on the CAUDAL rim (free edge cranial), >0 cranial
 *   centre_n >0 the leaf lies in the LEFT atrium, <0 in the right
 * A rotation of (a*vAx + b*nAx) by +ang about uAx = vAx x nAx gives
 * ((a*cos - b*sin)*vAx + (a*sin + b*cos)*nAx), which is the whole of the geometry below. */
function flapFrame(t) {
  const openFrac = flapOpenFraction(t);
  const ang = 0.62 * openFrac;
  const dv = -FLAP_HINGE_V * GEO.septum.rIn;          // hinge -> leaf centre, along vAx (cranial)
  const dn = GEO.septum.h * 0.5 + 0.035;              // hinge -> leaf centre, along nAx (toward LA)
  const c = Math.cos(ang), sn = Math.sin(ang);
  return { ang: ang, openFrac: openFrac, hinge_v: FLAP_HINGE_V,
           centre_v: dv * c - dn * sn, centre_n: dv * sn + dn * c,
           /* the free edge is the leaf rim furthest from the hinge, at +dv + R along vAx */
           free_edge_v: (dv + GEO.septum.rIn * 1.32) * c - dn * sn,
           free_edge_n: (dv + GEO.septum.rIn * 1.32) * sn + dn * c };
}

/* the checks, as pure functions of the measurements, so negatives() can hand them a wrong one */
function check(m) {
  const spread = m.s0.uv - m.s0.ua;
  const orderFloor = FLOORS.order * spread;
  const spatialFloorArch = FLOORS.spatial * 0.5 * (m.archExtentY + m.branchExtentY);
  const spatialFloorDepth = FLOORS.spatial * 0.5 * (m.uvDepth + m.ivcDepth);
  const chamberFloor = FLOORS.spatial * 0.5 * (m.raW + m.laW);
  const near = (a, b, tol) => Math.abs(a - b) <= tol;
  return {
    A: near(m.f0.plac, TARGETS.plac, TARGET_TOL) && near(m.f0.lung, TARGETS.lung, TARGET_TOL) &&
       near(m.f0.up, TARGETS.up, TARGET_TOL) && near(m.f0.low, TARGETS.low, TARGET_TOL) &&
       near(m.f0.fo, TARGETS.fo, TARGET_TOL) &&
       near(m.f0.rv, DERIVED.rv, TARGET_TOL) && near(m.f0.da, DERIVED.da, TARGET_TOL),
    B: near(m.s0.uv, UV_SAT, 0.001),
    C: near(m.s0.ivc, RA_IVC_SAT, 0.004),
    D: (m.s0.aoa - m.s0.aod) >= orderFloor,
    E: m.f0.da >= FLOORS.shunt * m.f0.rv,
    F: m.fPda.da <= -FLOORS.reversal,
    G: Math.abs(m.f1.fo) < 0.01 && Math.abs(m.f1.da) < 0.01 && m.f1.plac < 0.005 && m.f1.lung >= 0.45,
    H: (m.laX - m.raX) >= chamberFloor,
    I: (m.subclavianOriginY - m.ductJunctionY) >= spatialFloorArch,
    J: (m.uvZ - m.ivcZ) >= spatialFloorDepth,
    K: m.nUmbArteries === 2 && m.nUmbVeins === 1,
    L: m.fPfc.da > 0 && m.sPfc.aod <= (m.s1.aod - 0.10),
    M: m.flapOpen0 > 0.98 && m.flapOpen1 < 0.02,
    N: m.residual < 1e-6,
    O: m.s0.aod >= AOD_RANGE[0] && m.s0.aod <= AOD_RANGE[1],
    P: m.calibre0.every(x => x > 0.999) && m.calibre1.every(x => x <= 0.40),
    Q: m.flap0.hinge_v < 0 && m.flap1.hinge_v < 0 &&
       m.flap0.free_edge_v > m.flap0.centre_v && m.flap1.free_edge_v > m.flap1.centre_v &&
       m.flap0.centre_n > 0.15 && m.flap1.centre_n > 0 &&
       m.flap0.centre_n > m.flap1.centre_n,
    /* BOTH options that mean "never closes" hold the calibre, they agree exactly, and the plain
       build still loses at least 60% — so this cannot be passed by holding every build at 1. */
    S: m.ductPda1 > 0.999 && m.ductPfc1 > 0.999 &&
       Math.abs(m.ductPda1 - m.ductPfc1) < 1e-12 && m.ductPlain1 <= 0.40,
    T: m.flowKeysDeclared && m.flowKeyOfEveryColumn &&
       new Set(m.flowKeys).size === m.flowKeys.length &&
       m.shuntFlowKeys.every(k => m.flowKeys.indexOf(k) >= 0) &&
       m.streamFlowKeys.every(k => m.flowKeys.indexOf(k) >= 0) &&
       m.streamCarries0.every(q => q > m.foMarkerMin),
    /* THE FORAMEN HALF OF ROW L. Both signs and both thresholds, and the plain/pda side is what
       stops it being passed by a model that simply holds the foramen open in every build. */
    U: m.foPfc1 > m.foMarkerMin && m.flapOpenPfc1 > 0.5 &&
       Math.abs(m.foPlain1) <= m.foMarkerMin && Math.abs(m.foPda1) <= m.foMarkerMin,
    /* ROW V. BOTH dimensions must fall, and the AREA must fall by the floor - a marker that got
       one per cent shorter would satisfy a monotonicity test and change no picture. */
    V: (function () {
         const a = m.foMarkerFetal, b = m.foMarkerBeat8;
         return a.w > 0 && a.l > 0 && b.w > 0 && b.l > 0 &&
                b.l < a.l && b.w < a.w &&
                (b.w * b.l) <= m.markerFloor * (a.w * a.l) &&
                a.w >= m.foMarkerWMax - 1e-12;
       })(),
    /* ROW W. The endpoints are asserted EXACTLY because the streams are cut out of the same tables the
       cavae and the chambers are built from - a gap of any size means the derivation drifted. */
    W: (function () {
         const r = m.raStreams;
         return r.mouthGapIvc < 1e-9 && r.mouthGapSvc < 1e-9 &&
                r.endGapSeptum < 1e-9 && r.endGapTricuspid < 1e-9 &&
                r.crossS > 0.05 && r.crossS < 0.95 && r.crossU > 0.05 && r.crossU < 0.95 &&
                r.crossDist <= 2 * m.raStreamR && r.crossRadiusInRA < 1 &&
                m.raStreamCarries0.every(q => q > m.foMarkerMin) &&
                m.raStreamCarries1[0] <= m.foMarkerMin && m.raStreamCarries1[1] > m.foMarkerMin;
       })(),
    R: (function () {
         const c = m.satCurve, iN = c.reduce((b, x, i) => x.aoa < c[b].aoa ? i : b, 0);
         if (!(c[iN].aoa < m.satFetal)) return false;               // there IS a nadir below fetal
         if (!(c[iN].min <= 2)) return false;                        // and it is early, with the clamp
         for (let i = iN + 1; i < c.length; i++) if (c[i].aoa < c[i - 1].aoa - 1e-9) return false;
         return c[c.length - 1].aoa > 0.97;
       })(),
  };
}

function acceptance() {
  const m = measure();
  const ok = check(m);
  const measured = {
    targets: { plac: m.f0.plac, lung: m.f0.lung, up: m.f0.up, low: m.f0.low, fo: m.f0.fo,
               predicted_rv: m.f0.rv, predicted_da: m.f0.da, want: TARGETS, predictions_wanted: DERIVED },
    saturations_fetal: { uv: m.s0.uv, dv: m.s0.dv, hepatic: m.s0.hep, ivc: m.s0.ivc, svc: m.s0.svc,
                         ra: m.s0.ra, la: m.s0.la, rv: m.s0.rv, lv: m.s0.lv, pv: m.s0.pv,
                         ascending_aorta: m.s0.aoa, descending_aorta: m.s0.aod, umbilical_artery: m.s0.ua },
    saturations_neonate: { aoa: m.s1.aoa, aod: m.s1.aod, svc: m.s1.svc, pv: m.s1.pv },
    order_gap: m.s0.aoa - m.s0.aod, order_floor: FLOORS.order * (m.s0.uv - m.s0.ua),
    duct_fetal: m.f0.da, duct_pda_neonate: m.fPda.da, duct_pfc_neonate: m.fPfc.da,
    reversal_ratio: m.fPda.da / m.f0.da,
    flows_fetal: { rv: m.f0.rv, lv: m.f0.lv, fo: m.f0.fo, lung: m.f0.lung, plac: m.f0.plac,
                   up: m.f0.up, low: m.f0.low, isth: m.f0.isth },
    flows_neonate: { rv: m.f1.rv, lv: m.f1.lv, fo: m.f1.fo, lung: m.f1.lung, plac: m.f1.plac },
    spatial: { chamber_separation: m.laX - m.raX, chamber_floor: FLOORS.spatial * 0.5 * (m.raW + m.laW),
               duct_below_subclavian: m.subclavianOriginY - m.ductJunctionY,
               duct_floor: FLOORS.spatial * 0.5 * (m.archExtentY + m.branchExtentY),
               uv_ventral_to_ivc: m.uvZ - m.ivcZ,
               depth_floor: FLOORS.spatial * 0.5 * (m.uvDepth + m.ivcDepth) },
    flap: { open_fetal: m.flapOpen0, open_neonate: m.flapOpen1 },
    remnant_calibre: { keys: REMNANT_KEYS, fetal: m.calibre0, neonate: m.calibre1 },
    extraction: extract(), upper_share: upperShare(), residual: m.residual,
    /* NOT a pass/fail, and now for a REASON rather than out of caution. Review finding R1-OPEN-4
       (2026-09-21) said this curve is out of range at every published checkpoint and that the number
       would be quoted by someone eventually. Round 2 went looking for the parameter to move and
       found there is not one.
     *
     * WHAT WAS MEASURED, 2026-09-30. The model's aoa saturation was evaluated as a function of the
     * IMPOSED aeration fraction at each checkpoint, by driving EVENTS.breath to a chosen value at
     * that instant (11 values, 0.01 to 0.99). Reading the published bands back through that
     * response: to sit in 0.60-0.65 at one minute the lung must be 0.42-0.49 aerated, and to sit in
     * 0.65-0.70 at two minutes it must be 0.385-0.411 aerated. The second interval lies BELOW the
     * first. Aeration is monotone, so NO aeration profile of any shape — one logistic, two phases,
     * anything — can satisfy both bands. A 70-point sweep of single-logistic ranges confirms it from
     * the other direction: the best fit puts 4 of 6 checkpoints in band and drags one minute down to
     * 0.263.
     *
     * WHY, which is the part worth keeping: the published curve rises only 0.05 between one and two
     * minutes because oxygenating a newborn means filling an oxygen STORE — a whole circulating
     * volume, plus progressive alveolar recruitment — and a store is capacitive. This network is
     * steady-state with instantaneous mixing: what enters a node leaves it in the same breath, so it
     * has no capacity to buffer a nadir and its arterial saturation tracks aeration immediately.
     * Matching the published curve needs a transit/equilibration term, which is a different model.
     * See gaps. Row R asserts the shape this model CAN honestly claim; these numbers are printed
     * with the divergence stated beside them so they cannot be read as agreement. */
    newborn_preductal_saturation: { at_1_min: preductalAt(1), at_2_min: preductalAt(2),
      at_5_min: preductalAt(5), at_10_min: preductalAt(10),
      published_targets: { at_1_min: '0.60-0.65', at_5_min: '0.80-0.85', at_10_min: '0.85-0.95' },
      agrees_with_published: false,
      divergence: 'PROVEN UNREACHABLE in this network, not mis-tuned. The 1-minute band needs aeration 0.42-0.49 and the 2-minute band needs 0.385-0.411; aeration is monotone, so no profile satisfies both. Cause: steady-state mixing with no oxygen store. Remedy: a capacitive/transit term — a different model.' },
    clock: { five_minutes: tOfMinutes(5), one_hour: tOfMinutes(60), twelve_hours: tOfMinutes(750),
             five_days: tOfMinutes(7200), six_weeks: 1 },
  };
  return { measured: measured, pass: ok, allPass: Object.keys(ok).every(k => ok[k]), spec: ACCEPTANCE };
}

/* EVERY ACCEPTANCE TEST NEEDS A NEGATIVE CASE. A test that grades its own homework in the wrong
   units launders a defect into a proof, so each id below is handed an input it MUST reject. */
function negatives() {
  const m = measure();
  const clone = () => JSON.parse(JSON.stringify({
    f0: { plac: m.f0.plac, lung: m.f0.lung, fo: m.f0.fo, rv: m.f0.rv, da: m.f0.da },
    s0: m.s0, f1: { fo: m.f1.fo, da: m.f1.da, plac: m.f1.plac, lung: m.f1.lung }, s1: m.s1,
    fPda: { da: m.fPda.da }, fPfc: { da: m.fPfc.da }, sPfc: m.sPfc,
    raX: m.raX, laX: m.laX, raW: m.raW, laW: m.laW,
    ductJunctionY: m.ductJunctionY, subclavianOriginY: m.subclavianOriginY,
    archExtentY: m.archExtentY, branchExtentY: m.branchExtentY,
    uvZ: m.uvZ, ivcZ: m.ivcZ, uvDepth: m.uvDepth, ivcDepth: m.ivcDepth,
    nUmbArteries: m.nUmbArteries, nUmbVeins: m.nUmbVeins,
    flapOpen0: m.flapOpen0, flapOpen1: m.flapOpen1, residual: m.residual,
    calibre0: m.calibre0, calibre1: m.calibre1,
    flap0: m.flap0, flap1: m.flap1, satCurve: m.satCurve, satFetal: m.satFetal,
    ductPlain1: m.ductPlain1, ductPda1: m.ductPda1, ductPfc1: m.ductPfc1,
    flowKeys: m.flowKeys, flowKeysDeclared: m.flowKeysDeclared,
    flowKeyOfEveryColumn: m.flowKeyOfEveryColumn, shuntFlowKeys: m.shuntFlowKeys,
    streamFlowKeys: m.streamFlowKeys, streamCarries0: m.streamCarries0,
    foPfc1: m.foPfc1, foPlain1: m.foPlain1, foPda1: m.foPda1,
    foMarkerMin: m.foMarkerMin, flapOpenPfc1: m.flapOpenPfc1,
    foMarkerFetal: m.foMarkerFetal, foMarkerBeat8: m.foMarkerBeat8,
    foMarkerWMax: m.foMarkerWMax, markerFloor: m.markerFloor,
    raStreams: m.raStreams, raStreamR: m.raStreamR,
    raStreamCarries0: m.raStreamCarries0, raStreamCarries1: m.raStreamCarries1,
  }));
  const cases = {};
  /* `label` lets one row carry MORE THAN ONE negative case without the second silently overwriting
     the first in `cases`. Row S needs two: one that restores the defect it was written for, and one
     that holds every build at full calibre, which would satisfy the first three conjuncts. A row
     whose only negative case is the bug it was born from is a row that stops biting the moment
     someone breaks it a different way. */
  const bite = (id, mutate, label) => {
    const w = clone(); mutate(w);
    cases[label || id] = { row: id, rejected: check(w)[id] === false };
  };
  bite('A', w => { w.f0.plac = TARGETS.plac + 5 * TARGET_TOL; });
  bite('B', w => { w.s0.uv = 0.72; });
  bite('C', w => { w.s0.ivc = 0.62; });
  /* the invisible-but-true case this floor exists for: a gap of 1% of the spread */
  bite('D', w => { w.s0.aod = w.s0.aoa - 0.01 * (w.s0.uv - w.s0.ua); });
  bite('E', w => { w.f0.da = 0.10 * w.f0.rv; });
  /* the case that fooled the cardiac-looping mirror: the right SHAPE with the wrong SIGN */
  bite('F', w => { w.fPda.da = +Math.abs(w.fPda.da); });
  bite('G', w => { w.f1.da = 0.20; });
  bite('H', w => { w.laX = w.raX + 0.05; });
  bite('I', w => { w.ductJunctionY = w.subclavianOriginY - 0.02; });
  bite('J', w => { w.uvZ = w.ivcZ + 0.01; });
  bite('K', w => { w.nUmbArteries = 1; });
  bite('L', w => { w.sPfc.aod = w.s1.aod; });
  bite('M', w => { w.flapOpen1 = 0.5; });
  bite('N', w => { w.residual = 1e-3; });
  bite('O', w => { w.s0.aod = 0.67; });
  bite('P', w => { w.calibre1 = w.calibre1.map(() => 0.9); });
  /* THE CASE THIS MODEL ACTUALLY SHIPPED FOR FIVE ROUNDS: hinge the leaf on the cranial rim, which
     leaves the flap angle — and therefore row M — completely unchanged while the flap opens into the
     wrong atrium. If row Q ever stops rejecting this, it has stopped measuring the sign. */
  bite('Q', w => { w.flap0.hinge_v = +0.98; w.flap0.centre_n = -0.0727;
                   w.flap0.free_edge_v = w.flap0.centre_v - 0.34; });
  /* ROW V, TWO CASES. First: THE EXACT DEFECT R3-OPEN-3 FOUND, restored - a marker whose dimensions
     are the fetal ones at every t, which is what "carries the sign and not the magnitude" means in
     drawn geometry, and which every check in this model passed for four rounds. */
  bite('V', w => { w.foMarkerBeat8 = { w: w.foMarkerFetal.w, l: w.foMarkerFetal.l,
                                       gap: w.foMarkerFetal.gap, mag: w.foMarkerBeat8.mag }; });
  /* and the case a monotonicity test alone would let through: both dimensions DO fall, by a hair, so
     nothing a student looks at has changed. This is the floor doing the work rather than the sign. */
  bite('V', w => { w.foMarkerBeat8 = { w: w.foMarkerFetal.w * 0.99, l: w.foMarkerFetal.l * 0.99,
                                       gap: w.foMarkerFetal.gap, mag: w.foMarkerBeat8.mag }; }, 'V2');
  /* ROW W, TWO CASES. First: the streams stop before they meet - two arrows arriving at a chamber and
     no crossing, which is the picture beat 4 drew for four rounds while narrating a crossing. */
  bite('W', w => { w.raStreams = Object.assign({}, w.raStreams, { crossS: 1.4, crossU: 1.8 }); });
  /* and the half that matters at the other end of t: a crossing drawn after the foramen has shut, so
     the student sees the inferior stream still crossing to the left in a newborn */
  bite('W', w => { w.raStreamCarries1 = [w.raStreamCarries0[0], w.raStreamCarries1[1]]; }, 'W2');
  /* a curve that keeps rising and never dips: the shape a model with no cord clamp would give */
  bite('R', w => { w.satCurve = w.satCurve.map((x, i) => ({ min: x.min, aoa: w.satFetal + 0.01 * i })); });
  /* THE EXACT DEFECT ROUND 3 FOUND, restored: the pda build holds its calibre and the pfc build
     shrinks to REMNANT. Row P cannot reject this - P only looks at the PLAIN build, where the duct
     is supposed to shrink - which is why the pfc duct was drawn as a ligament carrying full flow
     through four review rounds and a battery that grew to seventeen rows. */
  bite('S', w => { w.ductPfc1 = REMNANT; });
  /* and the other half of S: a build that holds EVERY variant at 1 would pass the first three
     conjuncts, so the plain build must still be a remnant */
  bite('S', w => { w.ductPlain1 = 1; }, 'S2');
  /* the partition collapsing back to one key: the state this model was in until round 3, where a
     view could show the whole gold cloud or no arrows at all */
  bite('T', w => { w.flowKeys = ['flow']; w.shuntFlowKeys = w.shuntFlowKeys; });
  /* and the half round 4 added: the two caval keys dropped, which the collapse-to-one case above
     would also catch but only incidentally. This one removes exactly the new pair. */
  bite('T', w => { w.flowKeys = w.flowKeys.filter(k => k !== 'flow_ivc' && k !== 'flow_svc'); }, 'T2');
  /* ROW U, TWO CASES. First: the foramen shunting LEFT TO RIGHT in pfc — the right magnitude with
     the wrong sign, which is the shape that fooled row F's ancestor and the shape a beat drawing
     arrows would render backwards while every magnitude test still passed. */
  bite('U', w => { w.foPfc1 = -Math.abs(w.foPfc1); });
  /* Second, and the one that matters more: a model that holds the foramen open in EVERY t=1 build
     would satisfy the pfc half and teach that a normal newborn keeps shunting. */
  bite('U', w => { w.foPlain1 = w.foPfc1; }, 'U2');
  const allGood = Object.keys(cases).every(k => cases[k].rejected);
  const covered = new Set(Object.keys(cases).map(k => cases[k].row));
  const missing = Object.keys(ACCEPTANCE).filter(k => k !== 'axes' && !covered.has(k));
  return { cases: cases, allGood: allGood && missing.length === 0, missingNegatives: missing };
}

/* asserted at build time, once, so a drifted constant says so in the console rather than quietly
   teaching a circulation that does not balance */
let _checked = false;
function selfCheck() {
  if (_checked) return;
  _checked = true;
  try {
    const r = acceptance();
    if (!r.allPass) {
      const bad = Object.keys(r.pass).filter(k => !r.pass[k]).join(', ');
      console.warn('[fetal-circulation] ACCEPTANCE FAILED for ' + bad +
        ' — the flows or the saturations no longer satisfy what the narration claims.', r.measured);
    }
  } catch (e) {
    console.warn('[fetal-circulation] acceptance could not run: ' + (e && e.message));
  }
}

/* ═════════════════════════════════════════ THE CLAIM VOCABULARY, for check-beat-claims.mjs
 *
 * ADDED 2026-09-30 (round 5), and it is the mechanism review round 3 asked for by name
 * (R3-STANDARDS-GAP-1, second proposal): "nothing anywhere asserts that a beat's flow markers point
 * the way its own narration says. The model knows the sign of every flow, the scene knows the words,
 * and no tool joins them - which is how a beat drew reversed arrows unreversed through four rounds
 * and every gate." markerState() below is the join. It returns, for every flow key the model can
 * emit, the DIRECTION its cones are oriented by at a given t: +1 along the centreline as the layout
 * table lists it, -1 reversed, 0 no marker emitted at all. A scene beat that says "now they point
 * from the aorta into the pulmonary trunk" can then carry that as a claim and fail if it does not.
 *
 * WHAT THIS STILL CANNOT SEE, stated rather than left for a reviewer to find: check-beat-claims
 * evaluates a claim at the view's SET_STAGE t, while what the PLAYER draws for a structure whose ref
 * is PINNED (`#key@0`) is the model at the PIN's t, because viz3d's atStage() refuses to restage a
 * pinned ref. So a claim can be true at the beat's t and the picture still be the model at another
 * one - which is exactly the shape of R3-FIXED-1. That mismatch is not a model measure at all; it is
 * a property of the scene, and check-beat-claims.mjs now asserts it directly (see its PINNED REFS
 * section) rather than being asked to infer it from here. */
function markerState(t, opts) {
  const F = flows(Math.max(0, Math.min(1, t)), opts || {}, SOLVED);
  const out = {};
  const put = (fk, q) => {
    const dir = Math.abs(q) < FLOW_MARKER_MIN ? 0 : (q >= 0 ? 1 : -1);
    const cur = out[fk];
    if (cur == null || cur === 0) out[fk] = dir;
    else if (dir !== 0 && dir !== cur) out[fk] = NaN;   // one key drawing two ways at once
  };
  for (const c of COLUMN) put(FLOW_KEY_OF[c.key] || 'flow', c.q(F));
  for (const st of RA_STREAMS) put(st.fk, st.q(F));
  put('flow_foramen_ovale', F.fo);
  return out;
}

/* A MODEL BRINGS ITS OWN VOCABULARY (check-beat-claims.mjs, the claimMeasure path). Names are
 * `<domain>.<item>`, optionally prefixed `pda:` or `pfc:` for the two beats that are drawn from a
 * variant build - because a claim about the duct in a persistent-ductus frame has to be evaluated in
 * the build that frame shows, not in the normal one. */
function claimMeasure(name, t) {
  let opts = {}, nm = name;
  const colon = nm.indexOf(':');
  if (colon > 0) {
    const flag = nm.slice(0, colon); nm = nm.slice(colon + 1);
    if (flag === 'pda') opts = { pda: true };
    else if (flag === 'pfc') opts = { pfc: true, cordIntact: false };
    else throw new Error('unknown build prefix: ' + flag);
  }
  const tt = Math.max(0, Math.min(1, t));
  const path = nm.split('.');
  const F = () => flows(tt, opts, SOLVED);
  switch (path[0]) {
    case 'flow': { const f = F(); if (!(path[1] in f)) throw new Error('unknown flow: ' + path[1]);
                   return f[path[1]]; }
    case 'sat':  { const f = F(), S = saturations(f, tt, opts, extract());
                   if (!(path[1] in S)) throw new Error('unknown saturation: ' + path[1]);
                   return S[path[1]]; }
    case 'marker': {
      const st = markerState(tt, opts);
      if (!(path[1] in st)) throw new Error('unknown flow key: ' + path[1]);
      if (path[2] === 'direction') return st[path[1]];
      if (path[2] === 'exists') return st[path[1]] === 0 ? 0 : 1;
      throw new Error('marker.<key>.direction or .exists, not ' + path[2]);
    }
    case 'calibre': return calibre(path[1], F(), opts);
    case 'flap': {
      const f = F();
      const open = Math.max(0, Math.min(1, f.dPatria / Math.max(1e-9, _dpFetal())));
      if (path[1] === 'open') return open;
      if (path[1] === 'angle') return 0.62 * open;
      throw new Error('flap.open or flap.angle');
    }
    case 'fo_marker': {
      const d = foMarkerAt(tt, opts), d0 = foMarkerAt(0, {});
      if (path[1] === 'length') return d.l;
      if (path[1] === 'width') return d.w;
      if (path[1] === 'area_frac_of_fetal') return (d.w * d.l) / (d0.w * d0.l);
      throw new Error('fo_marker.length | .width | .area_frac_of_fetal');
    }
    case 'clock': if (path[1] === 'minutes') return minutesOf(tt);
                  throw new Error('clock.minutes');
    case 'derived': {
      const f = F(), S = saturations(f, tt, opts, extract());
      if (path[1] === 'aoa_minus_aod') return S.aoa - S.aod;
      if (path[1] === 'order_frac') return (S.aoa - S.aod) / Math.max(1e-9, S.uv - S.ua);
      if (path[1] === 'pulmonary_share') return f.lung / Math.max(1e-9, f.rv + f.lv);
      throw new Error('derived.aoa_minus_aod | .order_frac | .pulmonary_share');
    }
  }
  throw new Error('unknown measure: ' + name);
}

/* ─────────────────────────────────────────────────────────────────────── the provider contract */

function build(t, opts) { selfCheck(); return buildFetalCirculation(t, opts); }

window.MB3D_MODELS = window.MB3D_MODELS || {};
window.MB3D_MODELS['fetal-circulation'] = {
  LAYERS: LAYERS,
  build: build,
  /* Every optional layer on. The provider builds with this and slices the group by key afterwards,
     so a structure behind a flag is still RESOLVABLE — without it the player tells a student "there
     is no model of this structure" about a structure sitting right there. */
  FULL: { flow: true, midline: true, ivcTerminal: true },
  VARIANTS: {
    flow: 'arrows along every vessel centreline EXCEPT the two ducts, direction and size from the solved flow',
    flow_ductus_venosus: 'the ductus venosus arrows alone, so a close view can show them without the cloud',
    flow_foramen_ovale: 'the one marker that crosses the septum, pointing the way the solved gradient sends it',
    flow_ductus_arteriosus: 'the ductus arteriosus arrows alone — the pair that reverse, on their own key',
    ivc_terminal: 'the terminal inferior vena cava alone, cut at the hepatic confluence, so a beat about the ductus venosus can show what it empties into without the whole vessel',
    midline: 'the trace of the median plane, drawn ventral of the subject so it is not buried',
    plain: 'anatomical colours instead of solved saturation',
    pda: 'the duct never constricts — a persistent ductus arteriosus',
    pfc: 'the pulmonary bed never falls — persistent fetal circulation',
    cordIntact: 'the cord is never clamped (for showing what the clamp alone does)',
  },
  ACCEPTANCE: ACCEPTANCE,
  FLOORS: FLOORS,
  SOLVED: SOLVED,
  TARGETS: TARGETS,
  DERIVED: DERIVED,
  EVENTS: EVENTS,
  acceptance: acceptance,
  negatives: negatives,
  /* the claim vocabulary check-beat-claims.mjs reads, and the marker directions it joins the scene's
     words to — see markerState() above */
  claimMeasure: claimMeasure,
  markerState: markerState,
  foMarkerAt: foMarkerAt,
  raStreamGeometry: raStreamGeometry,
  calibrate: calibrate,
  /* the whole physiological state at any t, so a test, a review or the console can read the numbers
     this model is teaching without building any geometry */
  physiology: function (t, opts) { return state(Math.max(0, Math.min(1, t)), opts || {}); },
  mixing: mixing,
  clock: { minutesOf: minutesOf, tOfMinutes: tOfMinutes, decades: S_DEC },
  lastState: function () { return _lastState; },
};

})();
