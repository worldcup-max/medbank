#!/usr/bin/env node
/* MedBank · viz-training/tools/biodigital-gap.mjs
 *
 * What would adopting BioDigital actually cost us? — measured against our own corpus, not argued.
 *
 * BioDigital publishes no price. Every business tier is "contact for pricing", self-service trials ended
 * in May 2026, and no one anywhere has published a figure they were quoted. So the negotiation starts with
 * them knowing what we need and us knowing nothing about what it costs. This tool fixes our half of that:
 * it reads the corpus and reports exactly what a migration would require, so the conversation is about
 * numbers we can defend.
 *
 *   node viz-training/tools/biodigital-gap.mjs
 *   node viz-training/tools/biodigital-gap.mjs --students 400 --opens 6
 *
 * Flags:
 *   --students N   pilot size, for the page-view estimate (default 200)
 *   --opens N      scene opens per student per month (default 4)
 *
 * The three questions it answers:
 *
 *   1. HOW MUCH HAND WORK. BioDigital addresses structures by opaque ids ("maleAdult-Frontal_bone_52734"),
 *      not FMA. There is no API that turns our FMA id into theirs. Every structure needs one found by
 *      hand, in their web app, per scene. That number is the migration.
 *
 *   2. WHAT WE LOSE. Our ten-op vocabulary does not map cleanly. TRACE_STRUCTURE cannot be expressed at
 *      all, because our waypoints are landmarks — points ON a bone, measured by contact — and BioDigital
 *      addresses whole objects. Any view built on one stops working.
 *
 *   3. WHETHER WE FIT THE TIER. Startup allows 20 published models and 5,000 page views. Our curriculum
 *      is 207 scenes. Those two numbers are the whole conversation.
 *
 * Node 18+. No dependencies. Reads only viz-training/.
 */
import { readFileSync, readdirSync, existsSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const HERE = dirname(fileURLToPath(import.meta.url));
const ROOT = join(HERE, '..');
const argv = process.argv.slice(2);
const num = (name, d) => { const i = argv.indexOf('--' + name); return i < 0 ? d : (parseFloat(argv[i + 1]) || d); };
const STUDENTS = num('students', 200);
const OPENS = num('opens', 4);

/* What the Human API can and cannot be made to do with our vocabulary. Kept here rather than imported from
   viz3d.js so this tool runs with no browser shim — but it must be kept in step with the adapter's
   `capabilities` block, which is the authority. */
const NATIVE = new Set(['SHOW_STRUCTURE', 'HIDE_STRUCTURE', 'HIGHLIGHT_STRUCTURE', 'ISOLATE_REGION', 'ROTATE_TO_VIEW']);
const DEGRADED = new Set(['CROSS_SECTION', 'COMPARE_STRUCTURES', 'SHOW_RELATIONSHIP', 'PEEL_LAYER']);
const BLOCKED = new Set(['TRACE_STRUCTURE']);

/* Published tier limits, from pricing.biodigital.com/business.html (read 2026-08-26).
   Prices are deliberately absent because BioDigital publishes none — see the header. */
const STARTUP = { pageViews: 5000, publishedModels: 20, creators: 3 };

const scenes = [];
for (const f of readdirSync(join(ROOT, 'scenes'))) {
  if (!f.endsWith('.json') || f === 'index.json') continue;
  try { scenes.push(JSON.parse(readFileSync(join(ROOT, 'scenes', f), 'utf8'))); }
  catch (e) { console.error(`skipped ${f}: ${e.message}`); }
}
if (!scenes.length) { console.error('no scenes found'); process.exit(2); }

let curriculumStructures = 0;
try {
  const c = JSON.parse(readFileSync(join(ROOT, 'CURRICULUM.json'), 'utf8'));
  /* courses → topics → structures[]. Count the leaves, and only under `topics`, so a stray array
     elsewhere in the file cannot quietly inflate the headline number this tool exists to defend. */
  for (const course of Object.values(c.courses || {})) {
    for (const topic of Object.values(course.topics || {})) {
      if (Array.isArray(topic.structures)) curriculumStructures += topic.structures.length;
    }
  }
} catch (e) { /* optional */ }

let needIds = 0, haveIds = 0, landmarks = 0, meshes = 0;
const opTally = new Map();
const brokenViews = [];

for (const s of scenes) {
  for (const st of s.structures || []) {
    if (st.render === 'anchor') { landmarks++; continue; }         // no BioDigital equivalent at all
    if (!(st.refs && st.refs.bodyparts3d)) continue;
    meshes++;
    if (st.refs && st.refs.biodigital) haveIds++; else needIds++;
  }
  for (const v of s.views || []) {
    let broken = null;
    for (const o of v.ops || []) {
      opTally.set(o.op, (opTally.get(o.op) || 0) + 1);
      if (BLOCKED.has(o.op)) broken = o.op;
    }
    if (broken) brokenViews.push({ scene: s.id, view: v.title, op: broken });
  }
}

const line = n => '─'.repeat(n);
const pct = (a, b) => b ? Math.round(a / b * 100) + '%' : '—';

console.log(`\nBioDigital adoption — measured against ${scenes.length} authored scene(s)\n${line(72)}`);

console.log(`\n1 · HAND WORK BEFORE ANYTHING RENDERS`);
console.log(`   ${String(meshes).padStart(5)}  structures with a mesh today (FMA ids we already hold)`);
console.log(`   ${String(needIds).padStart(5)}  need a BioDigital object id found BY HAND — no API derives one from FMA`);
console.log(`   ${String(haveIds).padStart(5)}  already carry refs.biodigital`);
console.log(`   ${String(landmarks).padStart(5)}  LANDMARKS — points on a bone. BioDigital has no way to address these at all.`);
if (curriculumStructures) {
  const per = meshes / scenes.length;
  console.log(`\n   Extrapolated over the ${curriculumStructures}-structure curriculum at ~${per.toFixed(0)} structures/scene:`);
  console.log(`   roughly ${Math.round(per * curriculumStructures).toLocaleString()} ids to find by hand, one at a time, in their web app.`);
}

console.log(`\n2 · WHAT OUR VOCABULARY LOSES`);
const ops = [...opTally.entries()].sort((a, b) => b[1] - a[1]);
const total = ops.reduce((n, [, c]) => n + c, 0);
let nat = 0, deg = 0, blk = 0;
for (const [op, c] of ops) {
  const cls = NATIVE.has(op) ? 'native' : DEGRADED.has(op) ? 'DEGRADED' : BLOCKED.has(op) ? 'BLOCKED' : 'unknown';
  if (cls === 'native') nat += c; else if (cls === 'DEGRADED') deg += c; else blk += c;
  console.log(`   ${String(c).padStart(3)}×  ${op.padEnd(22)} ${cls}`);
}
console.log(`   ${line(48)}`);
console.log(`   ${pct(nat, total)} native · ${pct(deg, total)} degraded · ${pct(blk, total)} blocked`);

if (brokenViews.length) {
  console.log(`\n   Views that STOP WORKING as authored:`);
  for (const b of brokenViews) console.log(`     ✗ "${b.view}"  (${b.scene})  — ${b.op}`);
  console.log(`\n   TRACE_STRUCTURE walks landmark waypoints: a point ON a bone, measured by contact.`);
  console.log(`   BioDigital addresses whole objects. There is no "a place on this bone" in their API,`);
  console.log(`   so these views cannot be re-authored — only replaced with something else.`);
}

console.log(`\n3 · DO WE EVEN FIT THE ENTRY TIER?`);
const views = STUDENTS * OPENS;
console.log(`   Startup allows ${STARTUP.publishedModels} published models and ${STARTUP.pageViews.toLocaleString()} page views.`);
console.log(`   We have ${scenes.length} scene(s) today${curriculumStructures ? ` and a ${curriculumStructures}-structure curriculum` : ''}.`);
console.log(`   ${STUDENTS} students × ${OPENS} opens/month = ${views.toLocaleString()} page views — ` +
  (views > STARTUP.pageViews ? `${(views / STARTUP.pageViews).toFixed(1)}× the Startup cap.` : `inside the Startup cap.`));
console.log(`\n   Note: BioDigital does not define what counts as a page view for a single-page app that`);
console.log(`   re-mounts the viewer, and publishes no overage rate. Ask both before signing anything.`);

console.log(`\n4 · WHAT IS TRUE REGARDLESS OF PRICE`);
console.log(`   · Offline is lost. An iframe to human.biodigital.com cannot work on a bad connection,`);
console.log(`     and a PWA for students on mobile data is the reason this project exists.`);
console.log(`   · The free tier forbids embedding and API use outright, and self-service trials ended`);
console.log(`     in May 2026 — there is no way to evaluate this without going through sales.`);
console.log(`   · A lapsed subscription takes every scene dark. BodyParts3D is CC-BY-SA: ours forever.`);
console.log(`   · Against that: 8,000+ structures, real animation, and the chambers and pericardium`);
console.log(`     our corpus currently declares as gaps.`);

console.log(`\n${line(72)}`);
console.log(`Verdict this tool supports: adopt as a SECOND provider for what we cannot teach —`);
console.log(`motion, chambers, pericardium — and keep BodyParts3D as the free, offline, self-hosted`);
console.log(`default. The adapter is already registered; only refs.biodigital and a key are missing.\n`);
