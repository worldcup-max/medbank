#!/usr/bin/env node
/* MedBank · viz-training/tools/sync-state.mjs
 *
 * What has actually been authored? — ask the scenes directory, not a list someone remembered to update.
 *
 * The authoring task walks CURRICULUM.json with a cursor and keeps `coveredStructures` in STATE.json so it
 * does not author the same thing twice. That works right up until the two disagree — and on 2026-08-26
 * they did: two scenes existed on disk (arm, heart) while `coveredStructures` was `{}` and the cursor sat
 * at the very first structure of the first topic. The next run would have re-authored both, and nothing in
 * the pipeline would have objected, because duplication is not an error to a tool that trusts its own
 * bookkeeping.
 *
 * A hand-maintained list of what you have done is a second source of truth, and second sources of truth
 * drift. The scenes directory cannot drift: it IS the work. So this derives coverage from the files and
 * writes it back, and the task runs it FIRST, every run, before it decides what to author.
 *
 *   node viz-training/tools/sync-state.mjs              # report and write STATE.json
 *   node viz-training/tools/sync-state.mjs --check      # report only, exit 1 if out of step (for CI)
 *   node viz-training/tools/sync-state.mjs --report     # full coverage map, course by course
 *
 * Matching is on the structure NAME as the curriculum spells it, normalised — the same normalisation the
 * app uses to match a note to a scene. A scene whose `structure` matches no curriculum entry is reported
 * rather than silently ignored: it is either a typo or a scene nobody asked for, and both are worth seeing.
 *
 * Node 18+. No dependencies.
 */
import { readFileSync, writeFileSync, readdirSync, existsSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const HERE = dirname(fileURLToPath(import.meta.url));
const ROOT = join(HERE, '..');
const argv = process.argv.slice(2);
const CHECK = argv.includes('--check');
const REPORT = argv.includes('--report');

const norm = s => String(s || '').toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim();

const curriculum = JSON.parse(readFileSync(join(ROOT, 'CURRICULUM.json'), 'utf8'));
const statePath = join(ROOT, 'STATE.json');
const state = existsSync(statePath) ? JSON.parse(readFileSync(statePath, 'utf8')) : { cursor: {}, coveredStructures: {} };

/* ---- flatten the curriculum into the exact walk order the task uses ---- */
const order = curriculum.order || Object.keys(curriculum.courses || {});
const worklist = [];                                  // [{courseKey, topicIndex, structureIndex, topic, name}]
for (const courseKey of order) {
  const course = (curriculum.courses || {})[courseKey];
  if (!course) continue;
  const topicKeys = Object.keys(course.topics || {}).sort((a, b) => Number(a) - Number(b));
  topicKeys.forEach((tk, topicIndex) => {
    const topic = course.topics[tk];
    (topic.structures || []).forEach((st, structureIndex) => {
      worklist.push({ courseKey, topicIndex, structureIndex, topic: topic.topic || '', name: st.name, key: norm(st.name) });
    });
  });
}

/* ---- what is on disk ---- */
const scenesDir = join(ROOT, 'scenes');
const authored = new Map();                           // normalised structure name -> {id, status, course, topic}
const orphans = [];
const unknownCovers = [];
for (const f of readdirSync(scenesDir)) {
  if (!f.endsWith('.json') || f === 'index.json') continue;
  let s;
  try { s = JSON.parse(readFileSync(join(scenesDir, f), 'utf8')); }
  catch (e) { console.error(`  unreadable: ${f} — ${e.message}`); continue; }
  const rec = { id: s.id || f, status: s.status || 'unknown', course: s.course || '', topic: s.topic || '', file: f };

  /* What does this scene cover?
     `covers[]` is the scene saying so explicitly, and it is authoritative. It exists because a scene's
     title is a poor claim: the heart scene is called "Heart" while the curriculum lists five separate
     heart structures, and letting a title match loosely would have one vague scene silently claiming all
     five — including "Heart chambers", which that scene openly declares as a gap. A scene marking a
     structure covered when it cannot teach it is worse than a scene that never existed, because the gap
     stops being visible to anyone.

     Falling back to the title is for scenes authored before `covers` existed, and only where the title
     genuinely contains the curriculum name — "Biceps brachii & Triceps brachii" credits both. */
  const sceneKey = norm(s.structure);
  const declared = (s.covers || []).map(norm);
  let credited = 0;
  for (const w of worklist) {
    const hit = declared.length
      ? declared.includes(w.key)
      : (w.key === sceneKey || (w.key.length > 4 && sceneKey.includes(w.key)));
    if (!hit) continue;
    if (!authored.has(w.key)) authored.set(w.key, rec);
    credited++;
  }
  /* A covers[] entry naming nothing in the curriculum is a typo that would quietly cover nothing. */
  for (const d of declared) {
    if (!worklist.some(w => w.key === d)) unknownCovers.push({ file: f, name: (s.covers || [])[declared.indexOf(d)] });
  }
  if (!credited) orphans.push({ ...rec, structure: s.structure });
}

/* ---- rebuild coveredStructures from what exists, and move the cursor past it ---- */
const covered = {};
for (const w of worklist) {
  const a = authored.get(w.key);
  if (!a) continue;
  if (a.status !== 'ready') continue;                 // a blocked or candidate scene stays on the worklist
  (covered[w.courseKey] = covered[w.courseKey] || []).push(w.name);
}

/* cursor = the first structure with NO SCENE AT ALL.
   It used to be the first structure with no READY scene, and that quietly created a trap. "Spinal cord
   in vertebral canal" has a scene, held at `candidate` because the catalog contains no spinal cord —
   a gap no amount of authoring can close. The cursor parked on it permanently, so every run arrived at
   a structure it could not advance, re-authored the identical file or stepped around it, and the run
   after that did the same. A cursor that cannot move is not a queue.
   So a structure with any scene is ATTENDED and the cursor moves past it. It is not forgotten: it is
   listed under "held" below, every run, with its status and the reason it is not ready. Skipped means
   invisible; held means someone has to look. */
let cursor = null;
for (const w of worklist) {
  if (authored.has(w.key)) continue;
  cursor = { courseKey: w.courseKey, topicIndex: w.topicIndex, structureIndex: w.structureIndex };
  break;
}
const done = cursor === null;
if (!cursor) cursor = { ...(state.cursor || {}), done: true };

const before = JSON.stringify({ cursor: state.cursor, covered: state.coveredStructures });
const after = JSON.stringify({ cursor, covered });
const drifted = before !== after;

/* ------------------------------------------------------------------ report */
const totals = {};
for (const w of worklist) totals[w.courseKey] = (totals[w.courseKey] || 0) + 1;

console.log(`\ncurriculum: ${worklist.length} structures across ${Object.keys(totals).length} courses`);
console.log(`on disk:    ${authored.size} covered by ${new Set([...authored.values()].map(a => a.id)).size} scene file(s)\n`);

for (const courseKey of order) {
  if (!totals[courseKey]) continue;
  const n = (covered[courseKey] || []).length;
  const bar = '█'.repeat(Math.round(n / totals[courseKey] * 24)).padEnd(24, '·');
  console.log(`  ${courseKey.padEnd(14)} ${bar}  ${String(n).padStart(3)} / ${totals[courseKey]}`);
}

if (REPORT) {
  console.log('\n--- covered ---');
  for (const w of worklist) {
    const a = authored.get(w.key);
    if (a) console.log(`  ✓ ${w.courseKey}/${w.topic} · ${w.name}  →  ${a.id} (${a.status})`);
  }
}

if (unknownCovers.length) {
  console.log(`\n${unknownCovers.length} covers[] entr(ies) name no curriculum structure — a typo covers nothing:`);
  for (const u of unknownCovers) console.log(`  ! ${u.file} · covers "${u.name}"`);
}

if (orphans.length) {
  console.log(`\n${orphans.length} scene(s) match NO curriculum structure — a typo, or work nobody asked for:`);
  for (const o of orphans) console.log(`  ? ${o.file} · structure "${o.structure}"`);
}

const next = worklist.find(w => !authored.has(w.key));

/* Everything that has a scene but is not shippable. This list is the whole point of moving the cursor
   past them: they stay in front of a human every run instead of stalling the queue in silence. */
const held = [];
for (const w of worklist) {
  const a = authored.get(w.key);
  if (a && a.status !== 'ready') held.push({ w, a });
}
if (held.length) {
  console.log(`\n${held.length} structure(s) HELD — a scene exists but is not ready. Not skipped: they need a decision.`);
  for (const { w, a } of held) console.log(`  · ${w.courseKey}/${w.topic} · ${w.name}  →  ${a.id} (${a.status})`);
}
console.log(`\nnext to author: ${done ? 'nothing — the curriculum is covered' : `${next.courseKey} / ${next.topic} / ${next.name}`}`);

if (CHECK) {
  if (drifted) {
    console.log('\nSTATE.json does not match the scenes directory. Run without --check to reconcile.');
    process.exit(1);
  }
  console.log('\nSTATE.json matches the scenes directory.');
  process.exit(0);
}

state.cursor = cursor;
state.coveredStructures = covered;
state.done = done;
state.syncedAt = new Date().toISOString();
state.note = 'coveredStructures and cursor are DERIVED from viz-training/scenes/ by tools/sync-state.mjs. ' +
  'Do not hand-edit them: the scenes directory is the source of truth, and a second one always drifts. ' +
  'The authoring task runs this tool first, every run, before choosing what to author.';
writeFileSync(statePath, JSON.stringify(state, null, 2) + '\n');
console.log(drifted ? '\nSTATE.json reconciled with the scenes directory.\n' : '\nSTATE.json was already in step.\n');
