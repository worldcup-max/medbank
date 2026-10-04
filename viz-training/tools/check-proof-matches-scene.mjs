#!/usr/bin/env node
/* MedBank · viz-training · does the scene on disk match the scene the proof was run against?
 *
 * WHY THIS EXISTS. On 2026-10-01 a build run marked primitive-gut-tube `built` reporting
 * "check-scene-refs 103/103". Its own committed artifact recorded 60 pairs and the committed scene
 * yielded 54: six structures had been dropped from beat 3 AFTER the proof ran, and the six dropped
 * were the six the beat's narration names to the student. The run's read-back compared SHAs of the
 * files it had written, which proves the bytes landed — not that the proofs were generated from those
 * bytes. The review that caught it proposed this check in its own words:
 *
 *   "a build run compare its scene against the scene recorded in its own scene-refs.json before
 *    marking an item built — that single comparison would have caught finding 1 at source."
 *
 * So: rebuild the (beat, structure) pair list from the scene ON DISK and require it to equal, pair for
 * pair, the list the proof artifact recorded. A scene edited after its proof fails here.
 *
 *   node viz-training/tools/check-proof-matches-scene.mjs <scene.json> <scene-refs.json>
 */
import { readFileSync, existsSync } from 'fs';

const scenePath = process.argv[2];
const artPath = process.argv[3];
if (!scenePath || !artPath) { console.error('usage: check-proof-matches-scene.mjs <scene.json> <scene-refs.json>'); process.exit(2); }
for (const p of [scenePath, artPath]) if (!existsSync(p)) { console.error('missing: ' + p); process.exit(2); }

const scene = JSON.parse(readFileSync(scenePath, 'utf8'));
const art = JSON.parse(readFileSync(artPath, 'utf8'));

/* THE PAIR LIST THE SCENE IMPLIES, DERIVED THE WAY THE ARTIFACT'S PRODUCER DERIVES IT. This file's
   question is "was the proof run against THIS scene", not "is the producer's model of visibility
   right", so it has to count pairs exactly as check-scene-refs counts them or every scene that
   isolates would look like a mismatch. Two consequences worth stating rather than hiding:
     · it starts from NOTHING visible and adds what the ops SHOW, where viz3d resets every structure
       to visible and then applies the ops;
     · it treats ISOLATE_REGION as HIDING everything outside the region, where viz3d sets state.only
       and state.ghosted and a key outside the region stays DRAWN (viz3d.js:2393 — "hidden only when
       the view is NOT ghosted").
   So check-scene-refs under-counts a scene that isolates: on primitive-gut-tube at 17 views it
   resolves 79 pairs where the player draws 106, and the 27 it skips are the ghosted context. That is
   a real gap in that tool and is reported as one; it is NOT papered over here, because mirroring it
   is the only way this comparison can mean what it says. */
function keysFor(scn, target) {
  if (!target || target === '*') return scn.structures.map(s => s.key);
  if (scn.structures.some(s => s.key === target)) return [target];
  return scn.structures.filter(s => s.group === target).map(s => s.key);
}
/* ...AND THAT IS WHY THE SCENE SIDE IS DERIVED TWICE. The two artifact shapes this tool reads were
   produced by two different models of visibility, and comparing one against the other's derivation
   answers the wrong question. check-scene-refs treats ISOLATE_REGION as hiding what it does not name;
   a render harness's shownOf() applies SHOW and HIDE only, which is nearer what viz3d does (a key
   outside an isolated region stays DRAWN, ghosted). Pointed at blastocyst's proof.json, deriving the
   scene side the isolating way reported 7|mural_troph and 7|polar_troph as "dropped after the proof
   ran" when nothing had been dropped and beat 7 had not been touched for two rounds — a false alarm
   caused entirely by the derivation, on the one check whose whole job is to be believed. So each
   artifact shape is compared against the scene derived ITS way. This tool's question is "was the proof
   run against THIS scene", and it stays that question; which visibility model is right is a different
   argument and is in the header above. */
function pairsFromScene(applyIsolate) {
  const out = new Set();
  scene.views.forEach((v, i) => {
    const vis = new Set();
    (v.ops || []).forEach(o => {
      if (o.op === 'SHOW_STRUCTURE') keysFor(scene, o.target).forEach(k => vis.add(k));
      else if (o.op === 'HIDE_STRUCTURE') keysFor(scene, o.target).forEach(k => vis.delete(k));
      else if (applyIsolate && o.op === 'ISOLATE_REGION') {
        const keep = new Set(keysFor(scene, o.target));
        [...vis].forEach(k => { if (!keep.has(k)) vis.delete(k); });
      }
    });
    const beat = v.beat || (i + 1);
    vis.forEach(k => out.add(beat + '|' + k));
  });
  return out;
}

/* TWO ARTIFACT SHAPES, because not every model has a check-scene-refs of its own. The original is
   check-scene-refs's `results[]`, one row per (beat, key). A render harness's proof.json instead
   records `beats[]`, each with the `shown` set it composed that beat from — which is the same
   information, derived by the producer at the moment it rendered, and is what blastocyst and the other
   render-*.mjs harnesses emit. Added 2026-10-02 by the round-4 build run on blastocyst, which found
   this tool reporting every pair as missing against a proof.json simply because it only knew the one
   shape; a check that cannot read the artifact it is pointed at reports a false alarm, and a false
   alarm in a gate is worse than no gate. Neither shape is inferred from the other: if the artifact has
   neither key the tool says so and exits 2 rather than passing on an empty set. */
let fromArt, artShape;
if (Array.isArray(art.results)) {
  artShape = 'check-scene-refs results[]';
  fromArt = new Set(art.results.map(r => r.beat + '|' + r.key));
} else if (Array.isArray(art.beats) && art.beats.some(b => Array.isArray(b.shown))) {
  artShape = 'render harness proof.json beats[].shown';
  fromArt = new Set();
  art.beats.forEach((b, i) => (b.shown || []).forEach(k => fromArt.add((b.beat || (i + 1)) + '|' + k)));
} else {
  console.error('the artifact has neither results[] nor beats[].shown, so there is nothing to compare: ' + artPath);
  process.exit(2);
}

const fromScene = pairsFromScene(artShape === 'check-scene-refs results[]');
const missing = [...fromScene].filter(p => !fromArt.has(p)).sort();
const extra = [...fromArt].filter(p => !fromScene.has(p)).sort();

console.log('MedBank · proof-matches-scene');
console.log('  scene     ' + scenePath + '  (' + scene.views.length + ' views, ' + fromScene.size + ' visible pairs)');
console.log('  artifact  ' + artPath + '  (written ' + (art.when || 'unknown') + ', ' + fromArt.size + ' pairs)');
if (missing.length) console.log('  IN THE SCENE BUT NOT IN THE PROOF (added after the proof ran): ' + missing.join(', '));
if (extra.length) console.log('  IN THE PROOF BUT NOT IN THE SCENE (dropped after the proof ran): ' + extra.join(', '));
const ok = !missing.length && !extra.length;
console.log(ok ? 'THE PROOF WAS RUN AGAINST THE SCENE ON DISK'
               : 'THE SCENE ON DISK IS NOT THE SCENE THAT WAS PROVED');
process.exit(ok ? 0 : 1);
