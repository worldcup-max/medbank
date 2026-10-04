/* MedBank · heart-external · MAKE EVERY BEAT SELF-CONTAINED
 *
 * THE ROUND-3 ROOT FINDING, and it is upstream of both earlier rounds' root findings.
 *
 * viz3d.js runOps() calls resetState() before applying a view's ops, and resetState sets EVERY
 * structure visible (viz3d.js:1790-1793). A beat's visible set is therefore whatever that beat's own
 * ops leave behind, starting from all-on — nothing carries over from the beat before it.
 *
 * This scene is authored the other way. Beat 3 hides twenty-five structures; beats 4, 6, 7, 10, 14
 * and 15 hide NONE, because the beats before them had already hidden what they did not want. Under
 * the semantics the player actually has, beat 4 ("From behind: the base is the left atrium") shows
 * all 42 structures — both lungs, the sternum, the diaphragm, the whole pericardial sac, every
 * chamber territory, every surface and every border, at once. So does beat 6, beat 10, beat 14. Beat
 * 5, "The sternocostal surface", renders with the sternum in front of it.
 *
 * Both review rounds measured beats on a composition built by replaying these ops CUMULATIVELY, and
 * so did this builder. That is the same error both rounds named in the model — a number measured on
 * a picture no beat shows — one level up, in the harnesses that were checking for it. It is also why
 * round 2 reported the arch's end cap exposed in 13 of 15 beats: under reset semantics desc_aorta is
 * visible in every beat but beat 3, so the cap is bare in one.
 *
 * THE FIX IS EXACT, NOT INTERPRETED. For each beat, take the visibility state the cumulative reading
 * carries INTO it and emit, at the top of that beat, HIDE_STRUCTURE '*' followed by SHOW_STRUCTURE
 * for each structure that was on. Then leave the beat's original ops untouched, in their original
 * order. Under reset semantics that reproduces the cumulative reading exactly — reset turns
 * everything on, the block restores the carried-in state, the original ops apply as they always did.
 * No judgement about what the author meant is involved, and the check at the end asserts it: replayed
 * with reset semantics, the new scene's 15 visible sets equal the old scene's cumulative ones.
 */
import { readFileSync, writeFileSync } from 'fs';

const PATH = 'viz-training/scenes/gross__heart-pericardium__heart-external.json';
const scene = JSON.parse(readFileSync(PATH, 'utf8'));
const KEYS = scene.structures.map(s => s.key);
const GROUP = {};
for (const s of scene.structures) (GROUP[s.group] = GROUP[s.group] || []).push(s.key);
const LAYER = {};
for (const s of scene.structures) (LAYER[s.layer] = LAYER[s.layer] || []).push(s.key);
const keysFor = t => (!t || t === '*') ? KEYS.slice() : (KEYS.includes(t) ? [t] : (GROUP[t] || []));

function apply(vis, ops) {
  for (const o of ops) {
    if (o.op === 'HIDE_STRUCTURE') keysFor(o.target).forEach(k => vis.delete(k));
    else if (o.op === 'SHOW_STRUCTURE') keysFor(o.target).forEach(k => vis.add(k));
    else if (o.op === 'PEEL_LAYER') (LAYER[o.layer] || []).forEach(k => vis.delete(k));
  }
  return vis;
}

/* the cumulative reading: what the scene was authored to mean */
const carriedIn = [], cumulative = [];
let vis = new Set(KEYS);
for (const v of scene.views) {
  carriedIn.push(new Set(vis));
  apply(vis, v.ops);
  cumulative.push(new Set(vis));
}

/* rewrite */
scene.views.forEach((v, i) => {
  const pre = carriedIn[i];
  if (pre.size === KEYS.length) return;                 // beat 1: all on is already the reset state
  const block = [{ op: 'HIDE_STRUCTURE', target: '*' }]
    .concat(KEYS.filter(k => pre.has(k)).map(k => ({ op: 'SHOW_STRUCTURE', target: k })));
  v.ops = block.concat(v.ops);
});

/* the check: reset semantics on the new scene must give the cumulative sets of the old one */
let ok = true;
scene.views.forEach((v, i) => {
  const got = apply(new Set(KEYS), v.ops);
  const want = cumulative[i];
  const missing = [...want].filter(k => !got.has(k));
  const extra = [...got].filter(k => !want.has(k));
  if (missing.length || extra.length) {
    ok = false;
    console.log('beat', v.beat, 'MISMATCH  missing:', missing.join(','), ' extra:', extra.join(','));
  } else {
    console.log('beat ' + String(v.beat).padStart(2) + '  visible ' + String(want.size).padStart(2) +
      '/' + KEYS.length + '  ops ' + v.ops.length + '  ✓');
  }
});
if (!ok) { console.error('NOT WRITTEN — the rewrite does not reproduce the authored reading'); process.exit(1); }
writeFileSync(PATH, JSON.stringify(scene, null, 1) + '\n');
console.log('\nwritten:', PATH);
