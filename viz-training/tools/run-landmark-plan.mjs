#!/usr/bin/env node
/* MedBank · viz-training/tools/run-landmark-plan.mjs
 *
 * Measure every landmark named in viz-training/landmark-plan.json and, with --apply, write the results
 * into the scene files: the parent bone goes back to being the parent bone, and the feature it was
 * standing in for becomes a real anchored landmark with a patch on it.
 *
 *   node viz-training/tools/run-landmark-plan.mjs             # measure and report, change nothing
 *   node viz-training/tools/run-landmark-plan.mjs --apply     # write the scenes
 *
 * Anything the measurement refuses is left exactly as it is — still marked `approx`, still honest about
 * being the whole bone. A row marked `drop` was never an approximation (the whole parent IS the answer),
 * so it just loses the marking.
 *
 * The narration is NOT split automatically. The landmark inherits the text that was written about it
 * and is flagged `status: needs-review`, because deciding which sentences belong to the bone and which
 * to the feature is authoring, not measurement.
 */
import { readFileSync, writeFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { derive } from './derive-landmark.mjs';

const HERE = dirname(fileURLToPath(import.meta.url));
const SCENES = join(HERE, '..', 'scenes');
const PLAN = JSON.parse(readFileSync(join(HERE, '..', 'landmark-plan.json'), 'utf8'));
const APPLY = process.argv.includes('--apply');

const load = f => { const raw = readFileSync(f, 'utf8'); const m = raw.match(/\n(\s+)"/); return { d: JSON.parse(raw), ind: m ? m[1].length : 2 }; };
const save = (f, d, ind) => writeFileSync(f, JSON.stringify(d, null, ind) + '\n');
const cap = s => s.charAt(0).toUpperCase() + s.slice(1);

let measured = 0, refused = 0, dropped = 0;
const touched = new Map();

for (const row of PLAN.rows) {
  const file = join(SCENES, row.scene + '.json');
  const st = touched.get(file) || load(file);
  touched.set(file, st);
  const parent = st.d.structures.find(s => s.key === row.on);
  if (!parent) { console.log('✗ ' + row.scene + ' · ' + row.on + ' — no such structure'); continue; }

  if (row.drop) {
    console.log('· ' + row.on.padEnd(16) + 'DROP  ' + row.drop);
    if (APPLY) { delete parent.approx; parent.label = String(parent.label).split(/\s+[—–]\s+/)[0].trim(); }
    dropped++; continue;
  }

  const pid = (parent.refs || {}).bodyparts3d;
  let out;
  try { out = derive({ parent: pid, name: row.label, contact: row.def.contact || [], extreme: row.def.extreme, slab: row.def.slab, radius: row.def.radius }); }
  catch (e) { console.log('✗ ' + row.label.padEnd(28) + 'ERROR ' + e.message); refused++; continue; }

  if (out.refused) { console.log('✗ ' + row.label.padEnd(28) + 'REFUSED  ' + out.refused); refused++; continue; }
  const ev = out.method.startsWith('CONTACT')
    ? 'gaps ' + out.evidence.gaps_mm.map(g => Object.values(g)[0] + 'mm').join(', ') + (out.evidence.witnesses > 1 ? ' · spread ' + out.evidence.spread_mm + 'mm' : ' · 1 witness')
    : out.method + ' · ' + out.evidence.from_centroid_mm + 'mm from centroid';
  console.log('✓ ' + row.label.padEnd(28) + 'uvw ' + JSON.stringify(out.uvw).padEnd(30) + ev);
  measured++;

  if (!APPLY) continue;
  const i = st.d.structures.indexOf(parent);
  const narr = parent.narration || '';
  parent.label = String(parent.label).split(/\s+[—–]\s+/)[0].trim();
  delete parent.approx;
  st.d.structures.splice(i + 1, 0, {
    key: row.key, label: row.label, role: 'part', group: 'Landmarks', render: 'anchor', color: '#ffcf5c',
    anchor: { on: row.on, uvw: out.uvw, radius: out.radius },
    status: 'needs-review',
    calibrated_by: 'geometry: ' + out.method + ' — ' + row.why + ' (' + ev + ')',
    calibration_gap_mm: out.method.startsWith('CONTACT') ? Object.values(out.evidence.gaps_mm[0])[0] : 0,
    terms: row.terms || [row.label.toLowerCase()],
    narration: narr
  });
  /* the views were pointing at the bone because there was nothing else to point at */
  for (const v of st.d.views || []) for (const o of v.ops || []) {
    if (Array.isArray(o.path)) o.path = o.path.map(k => (k === row.on ? row.key : k));
    if (o.to === row.on) o.to = row.key;
    if (o.target === row.on && (o.op === 'HIGHLIGHT_STRUCTURE')) o.target = row.key;
  }
}

if (APPLY) for (const [f, st] of touched) save(f, st.d, st.ind);
console.log('\n' + measured + ' measured · ' + refused + ' refused · ' + dropped + ' dropped' + (APPLY ? '  — scenes written' : '  (dry run)'));
