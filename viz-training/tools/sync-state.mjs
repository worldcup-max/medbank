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

/* A curriculum structure is identified by its COURSE and its name, never by its name alone. "Spleen" is
   a structure in Gross Anatomy and, separately, in Histology's Lymphoid Organs — different subjects,
   different preferred_modes, different engines. Keying coverage on the name alone let a gross scene credit
   the histology entry it cannot teach, which is the exact failure covers[] exists to prevent: the gap
   stopped being visible and nobody would ever have returned to it. */
const slot = w => `${w.courseKey}/${w.key}`;
const courseKeyByName = new Map(
  Object.entries(curriculum.courses || {}).map(([k, v]) => [norm(v.name || k), k])
);

/* ---- what is on disk ---- */
const scenesDir = join(ROOT, 'scenes');
const authored = new Map();                           // "<courseKey>/<normalised name>" -> {id, status, course, topic}
const orphans = [];
const unknownCovers = [];
const sceneMeshes = [];                               // every scene's model ids, for the drawability check
for (const f of readdirSync(scenesDir)) {
  if (!f.endsWith('.json') || f === 'index.json') continue;
  let s;
  try { s = JSON.parse(readFileSync(join(scenesDir, f), 'utf8')); }
  catch (e) { console.error(`  unreadable: ${f} — ${e.message}`); continue; }
  const rec = { id: s.id || f, status: s.status || 'unknown', course: s.course || '', topic: s.topic || '', file: f };
  sceneMeshes.push({
    ...rec,
    mode: s.mode || '',
    audited: !!(s.provenance && s.provenance.audited_at),
    meshIds: [...new Set((s.structures || []).map(x => x.refs && x.refs.bodyparts3d).filter(Boolean))]
  });

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
  const sceneCourse = courseKeyByName.get(norm(s.course)) || null;   // null = course unrecognised, match anywhere
  let credited = 0;
  for (const w of worklist) {
    if (sceneCourse && w.courseKey !== sceneCourse) continue;        // a scene covers only its own course
    const hit = declared.length
      ? declared.includes(w.key)
      : (w.key === sceneKey || (w.key.length > 4 && sceneKey.includes(w.key)));
    if (!hit) continue;
    if (!authored.has(slot(w))) authored.set(slot(w), rec);
    credited++;
  }
  /* A covers[] entry naming nothing in the curriculum — or nothing in this scene's own course — is a typo
     that would quietly cover nothing. */
  for (const d of declared) {
    const found = worklist.some(w => w.key === d && (!sceneCourse || w.courseKey === sceneCourse));
    if (!found) unknownCovers.push({ file: f, name: (s.covers || [])[declared.indexOf(d)] });
  }
  if (!credited) orphans.push({ ...rec, structure: s.structure });
}

/* ---- rebuild coveredStructures from what exists, and move the cursor past it ---- */
const covered = {};
for (const w of worklist) {
  const a = authored.get(slot(w));
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
  if (authored.has(slot(w))) continue;
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
    const a = authored.get(slot(w));
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

const next = worklist.find(w => !authored.has(slot(w)));

/* Everything that has a scene but is not shippable. This list is the whole point of moving the cursor
   past them: they stay in front of a human every run instead of stalling the queue in silence. */
const held = [];
for (const w of worklist) {
  const a = authored.get(slot(w));
  if (a && a.status !== 'ready') held.push({ w, a });
}
if (held.length) {
  console.log(`\n${held.length} structure(s) HELD — a scene exists but is not ready. Not skipped: they need a decision.`);
  for (const { w, a } of held) console.log(`  · ${w.courseKey}/${w.topic} · ${w.name}  →  ${a.id} (${a.status})`);
}
/* ------------------------------------------------------------------ can a ready scene be DRAWN?
   Coverage and drawability are two different questions, and until 2026-08-28 this tool only asked the
   first one. It reported gross at 59/81 while seven of those scenes — the whole of Leg & Foot, the
   intrinsic hand muscles, the adductor canal — referenced meshes of which NOT ONE had been fetched.
   They were status:"ready", they were in index.json, they were live, and a student opening any of them
   got an empty stage with a full set of labels pointing at nothing.

   Nothing was lying. The authoring task resolves ids against available-meshes.json, which is a CATALOG
   — a list of what the provider publishes — and every id was real. The validator checks the same
   catalog. But the app fetches from the bucket, and the bucket only holds what someone downloaded and
   decimated. The corpus grew by ~250 references while the mesh folder stood still, and no tool in the
   chain was asked to compare the two.

   meshes-lite/ is what gets uploaded, so it is the honest local proxy for the bucket. If it is absent
   (a checkout without meshes) the check says so and stays quiet rather than crying wolf. */
const liteDir = join(ROOT, 'meshes-lite');
const haveMesh = existsSync(liteDir)
  ? new Set(readdirSync(liteDir).filter(f => /\.stl$/i.test(f)).map(f => f.replace(/\.stl$/i, '')))
  : null;

let repairNext = null;
if (haveMesh === null) {
  console.log('\nmeshes-lite/ is not in this checkout — skipping the drawability check.');
} else {
  const drawn = sceneMeshes
    .filter(r => r.meshIds.length && r.status !== 'planned' && r.status !== 'blocked')
    .map(r => {
      const missing = r.meshIds.filter(i => !haveMesh.has(i));
      return { ...r, missing, present: r.meshIds.length - missing.length };
    });

  const empty = drawn.filter(r => r.present === 0);
  const holed = drawn.filter(r => r.missing.length && r.present > 0);
  const gapIds = new Set();
  drawn.forEach(r => r.missing.forEach(i => gapIds.add(i)));

  console.log(`\ndrawable: ${drawn.length - empty.length - holed.length} of ${drawn.length} scene(s) have every mesh in meshes-lite/ (${haveMesh.size} files)`);

  if (empty.length) {
    console.log(`\n${empty.length} scene(s) DRAW NOTHING — not one of their meshes has been fetched.`);
    console.log('A "ready" scene with an empty stage is worse than no scene: the labels point at nothing.');
    for (const r of empty) console.log(`  ✗ ${r.status.padEnd(10)} ${String(r.meshIds.length).padStart(3)} missing  ${r.id}`);
  }
  if (holed.length) {
    console.log(`\n${holed.length} scene(s) draw with holes:`);
    for (const r of holed.sort((a, b) => b.missing.length - a.missing.length).slice(0, 12)) {
      console.log(`  · ${String(r.missing.length).padStart(3)}/${String(r.meshIds.length).padEnd(3)} missing  ${r.id}`);
    }
    if (holed.length > 12) console.log(`  … and ${holed.length - 12} more`);
  }
  if (gapIds.size) {
    const gapPath = join(ROOT, 'mesh-gaps.txt');
    writeFileSync(gapPath, [...gapIds].sort().join('\n') + '\n');
    console.log(`\n${gapIds.size} distinct model(s) referenced and not fetched → viz-training/mesh-gaps.txt`);
    console.log('Fetch, decimate and upload them (see DEPLOY-3D.md); nothing in this repo can do it — the');
    console.log('mirror is unreachable from the task, the desktop VM and the cloud container alike.');
  }

  /* The repair cursor. Authoring order is the curriculum's; repair order is the same order, because a
     course half-drawn is a worse thing to leave behind than a course unauthored. The empty stages come
     first inside a course — they are the ones a student is being shown right now. */
  const rank = new Map(order.map((c, i) => [c, i]));
  const courseOf = r => {
    const k = courseKeyByName.get(norm(r.course));
    return rank.has(k) ? rank.get(k) : 99;
  };
  const queue = [...empty.map(r => ({ r, kind: 'empty' })), ...holed.map(r => ({ r, kind: 'holes' }))]
    .sort((a, b) =>
      courseOf(a.r) - courseOf(b.r) ||
      (a.kind === b.kind ? 0 : a.kind === 'empty' ? -1 : 1) ||
      b.r.missing.length - a.r.missing.length);
  repairNext = queue.length ? queue[0] : null;
  state.meshGaps = {
    scenesEmpty: empty.length,
    scenesWithHoles: holed.length,
    modelsMissing: gapIds.size,
    checkedAt: new Date().toISOString()
  };
}

/* ------------------------------------------------------------------ the audit pass
   Every gross structure has a scene, so the authoring cursor walked out of Gross Anatomy and into
   Embryology — where nothing can be rendered at all — while Gross still had 22 structures held and
   52 scenes drawing with holes. Coverage is not the same as being finished.
   So a second cursor: the first scene of the earliest course, in file order, that no one has read
   back — file order is topic-then-structure, so it walks a topic at a time. A scene is
   audited when it carries provenance.audited_at. That is derived from the scene file like everything
   else here, so there is no list to keep in step. */
const auditByCourse = {};
for (const r of sceneMeshes) {
  const k = courseKeyByName.get(norm(r.course)) || 'unknown';
  (auditByCourse[k] = auditByCourse[k] || { done: 0, all: 0, next: null });
  auditByCourse[k].all++;
  if (r.audited) auditByCourse[k].done++;
  else if (!auditByCourse[k].next) auditByCourse[k].next = r.id;
}
const auditCourse = order.find(c => auditByCourse[c] && auditByCourse[c].next);
if (auditCourse) {
  const a = auditByCourse[auditCourse];
  console.log(`\naudit: ${auditCourse} ${a.done}/${a.all} scenes read back and signed (provenance.audited_at)`);
}

console.log(`\nnext to author: ${done ? 'nothing — the curriculum is covered' : `${next.courseKey} / ${next.topic} / ${next.name}`}`);
if (auditCourse) console.log(`next to audit:  ${auditByCourse[auditCourse].next}`);
if (repairNext) {
  console.log(`next to repair: ${repairNext.r.id}  (${repairNext.kind === 'empty' ? 'draws nothing' : repairNext.r.missing.length + ' meshes missing'})`);
}

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
