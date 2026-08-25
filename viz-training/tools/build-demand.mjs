#!/usr/bin/env node
/* MedBank · viz-training/tools/build-demand.mjs
 *
 * Turn what students actually read into the authoring queue.
 *
 * The app logs `mb3d_miss` whenever a note describes a structure spatially and the corpus has nothing to
 * show for it. That is demand. Walking CURRICULUM.json in order is a guess about what matters; this is
 * evidence. Feed the pilot export in, get DEMAND.json out, and the authoring task builds the scenes people
 * are already looking for.
 *
 *   1. In the app, open #/intel and press "⬇ Copy pilot data (JSON)". Paste into a file.
 *   2. node viz-training/tools/build-demand.mjs pilot-export.json [more-exports.json ...]
 *   3. The authoring task reads viz-training/DEMAND.json and authors those structures first.
 *
 * Several exports can be passed at once — one per student device — and they are pooled. A structure asked
 * for by four students outranks one asked for four times by the same device, so `students` is the primary
 * sort and raw count only breaks ties.
 *
 * Node 18+. No dependencies.
 */
import { readFileSync, writeFileSync, existsSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const HERE = dirname(fileURLToPath(import.meta.url));
const ROOT = join(HERE, '..');
const files = process.argv.slice(2).filter(f => !f.startsWith('--'));
if (!files.length) {
  console.log('usage: node viz-training/tools/build-demand.mjs <pilot-export.json> [...]');
  console.log('  the export comes from the #/intel page, "Copy pilot data (JSON)"');
  process.exit(2);
}

const demand = new Map();     // structure name -> { count, devices:Set, courses:Set, topics:Set }
let events = 0, sources = 0;

for (const f of files) {
  let blob;
  try { blob = JSON.parse(readFileSync(f, 'utf8')); }
  catch (e) { console.error(`skipped ${f}: ${e.message}`); continue; }
  sources++;
  const device = blob.device || blob.exportedAt || f;      // one export = one device
  for (const ev of blob.events || []) {
    if (ev.t !== 'mb3d_miss') continue;
    events++;
    (ev.structures || []).forEach((name, i) => {
      if (!demand.has(name)) demand.set(name, { count: 0, devices: new Set(), courses: new Set(), topics: new Set() });
      const d = demand.get(name);
      d.count++;
      d.devices.add(device);
      if ((ev.courses || [])[i]) d.courses.add(ev.courses[i]);
      if (ev.topic) d.topics.add(ev.topic);
    });
  }
}

/* which of these already have a scene? a covered structure is no longer demand */
let covered = new Set();
try {
  const idx = JSON.parse(readFileSync(join(ROOT, 'scenes', 'index.json'), 'utf8'));
  const norm = s => String(s || '').toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim();
  for (const s of idx.scenes || []) if (s.status === 'ready') covered.add(norm(s.structure));
  var normFn = norm;
} catch (e) { var normFn = s => String(s || '').toLowerCase(); }

const ranked = [...demand.entries()]
  .filter(([name]) => !covered.has(normFn(name)))
  .map(([name, d]) => ({
    structure: name,
    students: d.devices.size,
    reads: d.count,
    course: [...d.courses][0] || '',
    seen_in_topics: d.topics.size
  }))
  .sort((a, b) => b.students - a.students || b.reads - a.reads);

const out = {
  generated_by: 'viz-training/tools/build-demand.mjs',
  generated_from: { exports: sources, miss_events: events },
  note: 'Authoring order by evidence: structures students read about spatially while the corpus had nothing to show. Author top-down; re-run after each pilot export. An empty list means the corpus is ahead of demand — fall back to CURRICULUM order.',
  count: ranked.length,
  wanted: ranked
};
writeFileSync(join(ROOT, 'DEMAND.json'), JSON.stringify(out, null, 2) + '\n');

console.log(`${sources} export(s) · ${events} miss events · ${ranked.length} structures wanted\n`);
for (const r of ranked.slice(0, 15)) {
  console.log(`  ${String(r.students).padStart(3)} student(s) · ${String(r.reads).padStart(4)} reads   ${r.structure}${r.course ? '  (' + r.course + ')' : ''}`);
}
if (!ranked.length) console.log('  nothing wanted — either no misses logged yet, or the corpus already covers what was read.');
console.log(`\nwrote viz-training/DEMAND.json`);
