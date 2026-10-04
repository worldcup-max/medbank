import { readFileSync, writeFileSync } from 'fs';
const F = 'viz-training/scenes/embryology__week-3-gastrulation__notochord.json';
const s = JSON.parse(readFileSync(F, 'utf8'));
const V = s.views;
const rmShow = (v, k) => { const n = v.ops.length;
  v.ops = v.ops.filter(o => !(o.op === 'SHOW_STRUCTURE' && o.target === k));
  if (v.ops.length !== n - 1) throw new Error('SHOW_STRUCTURE ' + k + ' not found once'); };
const setCam = (v, c) => { let n = 0; for (const o of v.ops) if (o.op === 'ROTATE_TO_VIEW') { o.view = c; n++; }
  if (n !== 1) throw new Error('ROTATE_TO_VIEW count ' + n); };

/* ── OPEN 1/5 · BEAT 1's orientation, said on the nearest non-verbatim beat ───────────────── */
const b7 = V[6];
if (!b7.narration.endsWith('before you compare them.')) throw new Error('beat 7 narration moved');
b7.narration += " And one more that applies to every other beat in this scene: the player holds the camera's up-vector at world +y, which here is CRANIAL, so on the beats that look at the embryo from the side the screen's vertical axis is head-to-tail — which means the amniotic cavity and the yolk sac, the “above” and “below” of beat one, read ACROSS the screen rather than up and down it.";
b7.narration_from += "\n\nROUND 3, finding OPEN 1/5. The sentence above about the side-on beats is NEW this round and is the remedy the review asked for. Beat 1's job is to orient the student and its picture contradicts its own words — `ectoderm` spans y 42-858 with mean x 539 and `endoderm` spans y 42-858 with mean x 496, so the two sheets overlap completely on the screen's vertical and are separated only by about 43 px horizontally. The cause is real and is gaps[7]: viz3d pins the up-vector to world +y and +y is cranial here. Beat 1's narration is VERBATIM and gap 0 forbids rewriting it, and the review forbade moving its camera, so the note goes on the nearest non-verbatim beat exactly as the beat-3 transverse note already did. THE COST IS STATED: a student meets the explanation six beats after the picture that needs it. That is the best this scene can do while beat 1's words are fixed, and it is better than the silence round 2 left.";

/* ── OPEN 3/5 · BEAT 3 · the unnarrated neural plate section is no longer drawn ───────────── */
const b3 = V[2];
rmShow(b3, 'neural_plate_sec');
b3.narration_from += "\n\nROUND 3, finding OPEN 3/5: `neural_plate_sec` is NO LONGER SHOWN here. Measured on the player walk before the change, it was the largest object in the frame at 17.823% against this beat's own HIGHLIGHTed subject `plate_sec` at 5.271% — three and a half times its own subject — and this beat's narration never names it. It also pre-empted beat 6, which exists to introduce neural induction. After the change: plate_sec 4.195%, ectoderm_sec 11.584%, mesoderm_sec 7.008%, endoderm_sec 4.384%, and every structure still in the beat clears its own floor. NOW THE PART THAT DISAGREES WITH THE FINDING'S OWN FIX TEXT, because a note in a file is a claim including a reviewer's: the fix was prescribed 'so each beat's subject is the largest thing in its own frame', and MEASURED, it does not deliver that — `ectoderm_sec` at 11.584% still out-draws `plate_sec` at 4.195% by 2.8x, where the neural plate out-drew it by 3.4x. The line taken here is that the defect named is dominance by a structure the beat never mentions, and that the three germ layers ARE what 'cut across the embryo' means: a transverse section of a trilaminar disc that does not draw the trilaminar disc is not a transverse section. The only composition that would literally satisfy the stronger reading drops two of the three sheets, and claim B3-camera — 'a camera that can show three stacked sheets as three stacked sheets' — would then be about a picture with two in it. A reviewer who wants the stronger reading should say which of those two things goes.";

/* ── OPEN 2/5 + 3/5 · BEAT 5 · a dorsal camera, which fixes both ─────────────────────────── */
const b5 = V[4];
setCam(b5, 'posterior');
rmShow(b5, 'neural_plate');
rmShow(b5, 'ectoderm');
const before = b5.claims.length;
b5.claims = b5.claims.filter(c => c.id !== 'B5-np-stops');
if (b5.claims.length !== before - 1) throw new Error('B5-np-stops not found');
b5.claims.push({
  id: 'B5-camera',
  claim: 'and this is the camera that shows the cranial landmark as a patch rather than as a line',
  measure: 'projAreaRatio.prechordal_plate.posterior.lateral/hemi',
  op: 'atLeast',
  value: 2.5,
});
b5.narration_from += "\n\nROUND 3, findings OPEN 2/5 and OPEN 3/5, which turn out to be ONE fix. The camera is now `posterior` — dorsal — and `neural_plate` and `ectoderm` are no longer shown.\n\nWHY: round 2's waiver refused a dorsal camera because it 'loses the dorsoventral stack this beat is about', and the review was right that this beat is NOT about the dorsoventral stack. Its narration is 'the rod runs from the primitive node behind to the prechordal plate in front, and it goes no further forward than that' — cranio-caudal extent, with a landmark at each end. From `lateral` the caudal landmark read clearly and the cranial one, a flat midline condensation seen edge-on, drew 0.268% of the frame against the 0.30% floor for a structure a beat points at: the beat taught half of its own sentence. From `posterior` the screen's vertical is still head-to-tail (up-vector +y, as from `lateral`) so nothing is lost from the extent the beat is about, and the plate is seen FACE-ON. MEASURED on the player walk: prechordal_plate 0.268% -> 1.674%, a factor of 6.2, and oropharyngeal_membrane 0.000% -> 0.338%, so BOTH of this beat's waivers are now unnecessary and both have been removed. The subject's own coverage goes 9.05% -> 14.76%. Claim B5-camera asserts the ratio off the built triangles so the camera cannot drift back without a row going red.\n\nThe two sheets are hidden because a dorsal camera looks straight through them: ectoderm is the dorsal-most sheet and the neural plate sits on it, so with either of them shown the midline is behind an opaque roof. Hiding them is also the whole of OPEN 3/5 for this beat — the neural plate drew 3.677% against the subject's 1.342% and the narration never names it. Claim B5-np-stops was REMOVED with the structure rather than left pointing at something the student cannot see; it is not lost, because B6-only-over in beat 6 is the identical measure (npOverhangFrac, equals 0) in the beat whose narration actually makes that claim.\n\nWHAT THIS COSTS, said rather than left to be found: hiding the ectoderm means beat 5 no longer shows the embryo's dorsal surface at all, so the rod is seen lying on the mesoderm with nothing above it. That is the right picture for 'how far it runs', and it is a different convention from the lateral beats either side of it — a reviewer may reasonably want beat 4 or beat 6 to say so.";

/* ── OPEN 5/5 · BEAT 6 · the subject box, and the scene opting in to framing ──────────────── */
const b6 = V[5];
let nc = 0;
for (const o of b6.ops) if (o.op === 'COMPARE_STRUCTURES') { o.targets = ['neural_plate', 'sclerotome', 'definitive']; nc++; }
if (nc !== 1) throw new Error('COMPARE_STRUCTURES count ' + nc);
b6.narration_from += "\n\nROUND 3, finding OPEN 5/5 — AND THE CAUSE, WHICH IS NOT WHAT THE FIX TEXT ASSUMED. The rod was cut off at both ends because viz3d frames a view on `state.only` when one is set (viz3d.js:2129, subjectBox), and COMPARE_STRUCTURES sets `state.only` to its own targets (viz3d.js:1913). This beat compared `neural_plate` and `sclerotome`, so the camera was fitted to those two and `definitive` — longer than either, and the structure whose continuity this beat exists to establish — hung off the top and the bottom. MEASURED, by key, from the walk's edge_px_by_key: before, 282 subject pixels on a border row with definitive 101 and node 70 of them; after adding `definitive` to the compare targets, definitive 0 and node 0. The rod's two ends are now both inside the frame and the ghost at the top of the picture is its cranial curve, not a cut.\n\nThe op's `layout: side-by-side` is not implemented by viz3d at all — COMPARE_STRUCTURES is read purely as 'these are the subjects of this view, ghost the rest' — so adding the inducer to a list of two induced tissues changes nothing about what is compared and everything about what is framed. If a later engine does implement a layout, this op will need splitting.\n\nTHE REVIEW'S OTHER SUGGESTION, 'set framing_strict on beat 6', IS NOT A THING THAT EXISTS: measure-scene-visibility.mjs reads `scene.framing_strict` (line 688), a SCENE-level flag, and there is no per-view form of it. The scene now sets it, which gates all eleven beats, and only this beat needed a waiver afterwards — see the `__clipped__` entry in visibility_waivers.";

/* ── BEAT 8 · the claim that the section is not seen along its own normal ─────────────────── */
const b8 = V[7];
b8.claims.push({
  id: 'B8-oblique',
  claim: 'and you are looking at the cut from an angle, not square on to it — this is a solid, not a diagram',
  measure: 'cutFaceAngle.lateral/adult',
  op: 'atLeast',
  value: 40,
});
b8.narration_from += "\n\nROUND 3, finding OPEN 4/5. The segment is now TURNED 45 degrees about its own long axis, in the model (ADU_YAW), because viz3d offers only the six world-axis cameras and `lateral` IS the median plane's normal — there is no oblique camera to point at it and `scene.camera.initialYaw` is scene-wide, so turning the camera was not available and the specimen turns instead. The cut is still EXACTLY the median plane: row T now measures that against the plane's own normal derived from the built triangles rather than against the x axis, which is the same assertion written so it cannot be satisfied by a convenient choice of frame. The other three cameras were measured first and both are dead ends — `medial` puts nucleus_pulposus and notochord_regressed at 0.000%, and `anterior`/`posterior` give the bodies their curved outer surface but drop the remnant to 0.228%, under the 0.30% floor for a structure this beat's SHOW_RELATIONSHIP points at. Claim B8-oblique and acceptance row AA pin the angle.";

/* ── scene-level: framing_strict, and the waivers ────────────────────────────────────────── */
s.framing_strict = true;

const keep = [];
for (const w of s.visibility_waivers) {
  if (w.view === 5 && (w.key === 'prechordal_plate' || w.key === 'oropharyngeal_membrane')) continue;  // fixed, not waived
  keep.push(w);
}
if (keep.length !== s.visibility_waivers.length - 2) throw new Error('expected to drop 2 waivers');
s.visibility_waivers = keep;

const w9 = s.visibility_waivers.find(w => w.view === 9 && w.key === 'prechordal_plate');
if (!w9) throw new Error('beat 9 waiver missing');
w9.why = "MEASURED 0.229% against the 0.30% floor. It is a flat midline condensation seen EDGE-ON from this beat's `lateral` camera, and here it also lies partly behind the cranial chordoma mass, which is the thing this beat points at. The relationship op that names it is the sequence version's own (“remnants anywhere along it become”), and the claim it supports, B9-oneaxis, is measured on centroids rather than on pixels. ROUND 3: this waiver's ARGUMENT HAS CHANGED, because round 2's version said “for the reasons given on beat 5” and beat 5 no longer has those reasons — review finding OPEN 2/5 was right that a dorsal camera shows this structure face-on, and beat 5 has been re-pointed at one, where the plate measures 1.674%. So this is no longer 'the only picture of it there is'; it is one beat that cannot show it well, with a named beat that now shows it SIX TIMES better. The reason beat 9 does not also turn dorsal is its own: beat 9's subject is the two chordoma masses at the two ends of one axis, and from `posterior` they sit one behind the other along the screen's vertical with the cranial mass over the prechordal plate — the separation claim B9-oneaxis is about would be the thing lost. One beat, one camera.";
w9.shown_by_note = "Beat 5 is now a `posterior` (dorsal) camera and draws the prechordal plate as a patch at 1.674% of the frame, 6.2 times what it drew from `lateral`.";

s.visibility_waivers.push({
  view: 6,
  key: '__clipped__',
  why: "The scene now sets `framing_strict`, and this is the one beat of eleven with any subject pixel on a border. MEASURED by key, which is what settles it: before this round the border pixels were definitive 101, node 70, ectoderm 68, endoderm 43 — the ROD was being amputated at both ends, which is the defect review finding OPEN 5/5 names and it is FIXED (`definitive` is now one of the view's COMPARE_STRUCTURES targets, so the camera is fitted to it; definitive 0 and node 0 on the border afterwards). What is left on the border is ectoderm 153 and endoderm 70: the two germ-layer sheets, which this beat shows as GHOSTED context at 0.10 opacity and which are 9.6 units long against a subject 4.56 units long, so no framing of the subject can contain them. viz3d says the same thing in its own words at subjectBox (“Ghosted context is deliberately not counted — it is context, and it is allowed to run off the edges”) and then frames the view that way; measure-scene-visibility's border tally does NOT make that distinction and counts every id-carrying structure, so the tool and the engine disagree about this one number. The tool's own header says that where the two disagree, viz3d is right. FOR WHOEVER OWNS THE TOOL: the edge tally should exclude keys that are ghosted — it already knows which they are, because stateFor() computes `st.only` and `st.ghosted` — and until it does, every scene that opts into framing_strict and ghosts a large context structure will need a waiver like this one to say so.",
});

writeFileSync(F, JSON.stringify(s, null, 2));
console.log('scene patched: views', s.views.length, 'waivers', s.visibility_waivers.length,
            'framing_strict', s.framing_strict);
