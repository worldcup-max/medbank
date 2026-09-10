#!/usr/bin/env node
/* MedBank · viz-training/tools/apply-mesh-budget.mjs
 *
 * Decide how many triangles every mesh in the corpus is allowed, and why.
 *
 * WHAT THIS REPLACES. Until now every mesh was decimated to the same flat cap — 3,000 triangles,
 * with a few hand-raised to 8,000 or 20,000. A flat cap is the wrong shape for the problem twice
 * over. It spends the same budget on the femur that a scene is ABOUT as on the twelfth rib sitting
 * behind it for context. And it is blind to how many meshes a scene loads: the femur scene loads
 * nineteen, the intercostal scene loads thirty-five, and a cap that is generous for one is ruinous
 * for the other.
 *
 * WHAT IT COSTS TO GET THIS WRONG, measured rather than argued. The external oblique at 8,000
 * triangles is a smooth blob. At 76,733 the fibres are legible across the whole belly, running
 * inferomedially — and fibre direction is a thing a student is examined on. The flat cap was not
 * saving bandwidth on a cosmetic nicety; it was deleting the teaching.
 *
 * THE BUDGET IS MEASURED, NOT CHOSEN. The vertebral column scene loads 48 meshes totalling 419,568
 * triangles — 21 MB — and it loads. That is the only per-scene figure we have evidence for, so it
 * is the budget. Nothing here is allowed to make any scene heavier than the heaviest scene that is
 * already known to work.
 *
 * HOW THE BUDGET IS SPENT.
 *   1. A scene whose meshes total under budget at FULL SCAN RESOLUTION is left completely alone.
 *      34 of 81 scenes are in this position, and there is nothing to trade off: they ship at the
 *      resolution DBCLS scanned them at.
 *   2. A scene over budget shares it out in proportion to each mesh's source complexity. This is
 *      the "by role" part, and it falls out of the geometry rather than needing a label: the
 *      subject of a scene is nearly always its most complex mesh, because that is why it was
 *      chosen. The external oblique gets 77k in a scene where a rib gets 6k, and nobody had to
 *      annotate which was which.
 *   3. A FLOOR of 6,000 triangles, below which nothing is pushed. Measured on the lumbar vertebrae,
 *      which carry every process and facet at around 7,000. Meshes at or under the floor are
 *      fixed there and the remainder is reshared among the rest, iterated to a fixed point.
 *   4. A mesh in several scenes takes the TIGHTEST allocation any of them gives it. One file
 *      serves every scene, so the busiest scene sets the ceiling. This is the one place the rule
 *      can LOWER a mesh below what it has today, and the run reports each one.
 *
 * THE BOUNDING BOX IS STILL SACRED — see decimate-meshes.mjs. Landmark anchors are uvw fractions
 * of it, so a box that moves silently moves every landmark on that bone. This tool delegates to
 * that one and inherits its guarantee; it never writes geometry itself.
 *
 *   node viz-training/tools/apply-mesh-budget.mjs --plan     # print the allocation, write nothing
 *   node viz-training/tools/apply-mesh-budget.mjs --apply    # re-decimate what needs it
 *   node viz-training/tools/apply-mesh-budget.mjs --apply --only FMA13336,FMA9756
 *
 * Node 18+. Shells out to decimate-meshes.mjs. No dependencies.
 */
import { readFileSync, writeFileSync, readdirSync, existsSync, statSync, mkdirSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const HERE = dirname(fileURLToPath(import.meta.url));
const ROOT = join(HERE, '..');
const SRC = join(ROOT, 'meshes');
const OUT = join(ROOT, 'meshes-lite');

/* 450,000 rather than the vertebral column's exact 419,568, and the difference matters. That scene
   ships 47 of its 48 meshes at full scan resolution and one — the sacrum — capped at 20,000 out of
   44,416. Set the budget to what the scene currently weighs and the scene fails its own test: its
   SOURCE total is 443,984, so the rule would call it over budget and reallocate it proportionally,
   dropping T5 from 9,834 to 6,000 and the sacrum to 10,827. The scene the budget was derived from
   must be a fixed point of the rule, or the rule is measuring something other than what it claims. */
const BUDGET = 450000;   // 21.5 MB — the vertebral column at full scan resolution, sacrum included
const FLOOR = 6000;      // a lumbar vertebra carries every process and facet at ~7,000

const argv = process.argv.slice(2);
const has = f => argv.includes(f);
const val = f => { const i = argv.indexOf(f); return i < 0 ? null : argv[i + 1]; };
const APPLY = has('--apply');
const ONLY = val('--only') ? new Set(val('--only').split(',')) : null;
if (!APPLY && !has('--plan')) { console.error('apply-mesh-budget: pass --plan or --apply.'); process.exit(2); }

/* ---------------------------------------------------------------- inventory */
const tris = p => { try { return (statSync(p).size - 84) / 50; } catch { return null; } };

const source = {};
for (const f of readdirSync(SRC)) {
  if (!f.endsWith('.stl')) continue;
  const n = tris(join(SRC, f));
  if (n) source[f.slice(0, -4)] = n;
}
const current = {};
for (const id of Object.keys(source)) current[id] = tris(join(OUT, id + '.stl'));

/* ------------------------------------------------------------------ scenes */
const scenes = [];
for (const f of readdirSync(join(ROOT, 'scenes'))) {
  if (!f.endsWith('.json') || f === 'index.json') continue;
  let s; try { s = JSON.parse(readFileSync(join(ROOT, 'scenes', f), 'utf8')); } catch { continue; }
  const ids = [...new Set((s.structures || []).map(x => x.refs && x.refs.bodyparts3d).filter(Boolean))]
    .filter(i => source[i]);
  if (ids.length) scenes.push({ id: f.slice(0, -5), ids });
}

/* -------------------------------------------------------------- allocation */
const alloc = {};
for (const id of Object.keys(source)) alloc[id] = source[id];   // start at full scan resolution

const untouchedScenes = [];
for (const sc of scenes) {
  const total = sc.ids.reduce((a, i) => a + source[i], 0);
  if (total <= BUDGET) { untouchedScenes.push(sc.id); continue; }

  /* Share the budget in proportion to source complexity, with anything at or under the floor
     pinned there and the remainder reshared. Iterate to a fixed point — one pass is not enough
     because pinning a mesh frees budget that changes who else falls below the floor. */
  let k = BUDGET / total;
  for (let pass = 0; pass < 25; pass++) {
    const pinned = sc.ids.filter(i => source[i] * k < FLOOR);
    const pinnedSum = pinned.reduce((a, i) => a + Math.min(source[i], FLOOR), 0);
    const rest = sc.ids.filter(i => source[i] * k >= FLOOR);
    const restSum = rest.reduce((a, i) => a + source[i], 0);
    if (!restSum) break;
    const k2 = (BUDGET - pinnedSum) / restSum;
    const done = Math.abs(k2 - k) < 1e-5;
    k = k2;
    if (done) break;
  }
  for (const i of sc.ids) {
    const want = Math.max(Math.min(source[i], FLOOR), Math.round(source[i] * k));
    alloc[i] = Math.min(alloc[i], want);   // tightest scene wins
  }
}

/* NEVER GO BACKWARDS. Whatever a mesh already carries is known to load and known to look right —
   it is on the CDN and in front of students today. This rule exists to add detail, so it is not
   allowed to remove any, even where the proportional share would suggest a smaller number. Safe
   against the budget by construction: no scene's CURRENT total comes anywhere near it (the
   heaviest is the vertebral column, which is the budget), so clamping up to current can never
   push a scene over. */
const raisedToCurrent = [];
for (const id of Object.keys(alloc)) {
  if (current[id] != null && current[id] > alloc[id]) {
    raisedToCurrent.push({ id, from: alloc[id], to: current[id] });
    alloc[id] = current[id];
  }
}

/* ----------------------------------------------------------------- report */
const rows = Object.keys(source).sort().map(id => ({
  id, src: source[id], now: current[id], next: alloc[id],
  atSource: alloc[id] >= source[id],
  delta: current[id] == null ? null : alloc[id] - current[id]
}));

const work = rows.filter(r => ONLY ? ONLY.has(r.id) : (r.now == null || Math.abs(r.next - r.now) > Math.max(50, r.now * 0.02)));
const lowered = rows.filter(r => r.delta != null && r.delta < -50);
const sum = a => a.reduce((x, y) => x + y, 0);
const mb = t => (t * 50 / 1048576).toFixed(1);

console.log(`budget ${BUDGET.toLocaleString()} tri/scene (${mb(BUDGET)} MB) · floor ${FLOOR.toLocaleString()} tri`);
console.log(`meshes ${rows.length} · scenes ${scenes.length}`);
console.log(`scenes already under budget at full scan resolution: ${untouchedScenes.length} — untouched`);
console.log(`meshes that will ship at full scan resolution: ${rows.filter(r => r.atSource).length}`);
console.log(`corpus  now ${sum(rows.map(r => r.now || 0)).toLocaleString()} tri (${mb(sum(rows.map(r => r.now || 0)))} MB)`);
console.log(`        next ${sum(rows.map(r => r.next)).toLocaleString()} tri (${mb(sum(rows.map(r => r.next)))} MB)`);
console.log(`        source ${sum(rows.map(r => r.src)).toLocaleString()} tri (${mb(sum(rows.map(r => r.src)))} MB)`);
console.log(`to re-decimate: ${work.length}`);

if (lowered.length) {
  console.log(`\nBUG — ${lowered.length} mesh(es) came out below what they carry today. The never-go-backwards`);
  console.log(`clamp should have caught these. Do not --apply until this is understood:`);
  for (const r of lowered) console.log(`  ${r.id.padEnd(10)} ${String(r.now).padStart(7)} -> ${String(r.next).padStart(7)}`);
}
if (raisedToCurrent.length) {
  console.log(`\nheld at today's resolution rather than the proportional share (${raisedToCurrent.length}):`);
  for (const r of raisedToCurrent.slice(0, 12)) console.log(`  ${r.id.padEnd(10)} share ${String(r.from).padStart(7)} -> kept ${String(r.to).padStart(7)}`);
  if (raisedToCurrent.length > 12) console.log(`  … and ${raisedToCurrent.length - 12} more`);
}

const worst = scenes.map(sc => ({ id: sc.id, t: sum(sc.ids.map(i => alloc[i])) })).sort((a, b) => b.t - a.t);
console.log('\nheaviest scenes after allocation:');
for (const w of worst.slice(0, 6)) console.log(`  ${w.id.padEnd(60)} ${mb(w.t).padStart(6)} MB`);

writeFileSync(join(ROOT, 'MESH-BUDGET.json'), JSON.stringify({
  budget: BUDGET, floor: FLOOR, generated: new Date().toISOString().replace(/\.\d+Z$/, 'Z'),
  meshes: Object.fromEntries(rows.map(r => [r.id, { source: r.src, allocated: r.next, atSourceResolution: r.atSource }]))
}, null, 2) + '\n');
console.log('\nMESH-BUDGET.json written.');

if (!APPLY) { console.log('(--plan: nothing was decimated)'); process.exit(0); }

/* ------------------------------------------------------------------ apply */
if (!existsSync(OUT)) mkdirSync(OUT, { recursive: true });
const DEC = join(HERE, 'decimate-meshes.mjs');

/* --seconds N: stop STARTING new meshes after N seconds and exit cleanly.
   The corpus takes over an hour and the only shell available here is killed when its call returns,
   so the run has to come in slices. Each slice re-derives the allocation from scratch and skips
   anything already within 2% of its target, so calling this repeatedly converges — and stopping
   between meshes rather than inside one is what keeps a half-written STL off the disk. */
const LIMIT = Number(val('--seconds') || 0) * 1000;
const started = Date.now();

let done = 0, failed = [], stoppedEarly = false;
for (const r of work) {
  if (LIMIT && Date.now() - started > LIMIT) { stoppedEarly = true; break; }
  const t0 = Date.now();
  try {
    const out = execFileSync(process.execPath,
      ['--max-old-space-size=4096', DEC, join(SRC, r.id + '.stl'), '--target', String(r.next), '--out', OUT, '--verify'],
      { encoding: 'utf8', maxBuffer: 1 << 24 });
    const line = out.split('\n').find(l => l.startsWith(r.id)) || '';
    console.log(`[${++done}/${work.length}] ${((Date.now() - t0) / 1000).toFixed(0)}s  ${line.trim()}`);
  } catch (e) {
    failed.push(r.id);
    console.log(`[${++done}/${work.length}] FAILED ${r.id}: ${String(e.message).split('\n')[0]}`);
  }
}
console.log(`\n${stoppedEarly ? 'SLICE ENDED' : 'done.'} ${done - failed.length} re-decimated this run, ${failed.length} failed, ${work.length - done} still to do.`);
if (failed.length) console.log('failed: ' + failed.join(', '));
if (stoppedEarly) console.log('run the same command again to continue — it re-derives the plan and skips what is finished.');
