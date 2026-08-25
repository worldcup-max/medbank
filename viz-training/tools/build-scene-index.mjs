#!/usr/bin/env node
/* MedBank · viz-training/tools/build-scene-index.mjs
 *
 * Writes viz-training/scenes/index.json — the one file the app fetches to answer two questions:
 *   1. "Does this topic have a 3D scene?"        → match.topics / structure / topic names
 *   2. "Which part does this highlighted term mean?" → term → structure key
 *
 * Without it the app would have to fetch every scene to find one. Regenerate after every
 * authoring run:  node viz-training/tools/build-scene-index.mjs
 *
 * Node 18+. No dependencies. Every scene is listed with its status and provenance; the app shows students
 * only `ready` ones, while the dev route can open candidates and blocked scenes for review.
 */
import { readFileSync, writeFileSync, readdirSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const HERE = dirname(fileURLToPath(import.meta.url));
const ROOT = join(HERE, '..');
const SCENES = join(ROOT, 'scenes');

const norm = s => String(s || '').toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim();

/* which ops each adapter only approximates — recorded so corpus review can see which scenes are waiting
   on a better renderer rather than silently under-delivering. Mirrors viz3d.js and validate-scenes.mjs. */
const DEGRADED = { bodyparts3d: ['PEEL_LAYER'], svg: [] };

const files = readdirSync(SCENES).filter(f => f.endsWith('.json') && f !== 'index.json').sort();
const scenes = [];

for (const f of files) {
  let s;
  try { s = JSON.parse(readFileSync(join(SCENES, f), 'utf8')); }
  catch (e) { console.error(`skipped ${f}: ${e.message}`); continue; }

  const structures = s.structures || [];
  const parts = structures.filter(x => x.role === 'part');

  // term → structure key. Sources, most specific first: authored terms, label, catalog name.
  const terms = {};
  for (const x of structures) {
    const cands = [].concat(x.terms || [], x.label || [], x.name || []);
    for (const t of cands) { const k = norm(t); if (k.length > 2 && !terms[k]) terms[k] = x.key; }
  }

  const provider = (s.provider && s.provider.primary) || null;
  const usedOps = new Set();
  for (const v of (s.views || [])) for (const o of (v.ops || [])) usedOps.add(o.op);
  const degrades = (DEGRADED[provider] || []).filter(op => usedOps.has(op));

  scenes.push({
    id: s.id,
    file: `viz-training/scenes/${f}`,
    schema: s.schema || 1,
    mode: s.mode || '3d_anatomy',
    provider: provider,
    status: s.status || 'unknown',
    student_ready: s.status === 'ready',
    authored_by: (s.provenance && s.provenance.author) || 'unknown',
    approved_by: (s.provenance && s.provenance.approved_by) || null,
    degrades: degrades,
    course: s.course || '',
    topic: s.topic || '',
    structure: s.structure || '',
    learning_goal: s.learning_goal || '',
    gaps: (s.gaps || []).length,
    // what the app matches a note's topic against
    match: {
      topics: [...new Set([].concat(s.match && s.match.topics || [], s.topic || [], s.structure || []).map(norm).filter(Boolean))],
      terms: [...new Set([].concat(s.match && s.match.terms || []).map(norm).filter(Boolean))]
    },
    parts: parts.map(p => ({ key: p.key, label: p.label, group: p.group || '' })),
    terms,
    counts: { structures: structures.length, parts: parts.length, views: (s.views || []).length }
  });
}

/* ---------------------------------------------------------------- the wanted list
   The corpus is a cache, and a cache needs to know what it is missing. Every curriculum structure that has
   no ready scene goes into `wanted`, so the app can notice when a student reads about something we cannot
   yet show and say so — turning 207 structures in curriculum order into a queue in DEMAND order. */
const covered = new Set();
for (const s of scenes) if (s.status === 'ready') covered.add(norm(s.structure));

const wanted = [];
try {
  const cur = JSON.parse(readFileSync(join(ROOT, 'CURRICULUM.json'), 'utf8'));
  for (const [key, course] of Object.entries(cur.courses || {})) {
    for (const t of course.topics || []) {
      for (const st of t.structures || []) {
        const n = norm(st.name);
        if (!n || covered.has(n)) continue;
        wanted.push({
          name: st.name, course: key, topic: t.topic,
          modes: st.preferred_modes || course.defaultModes || [],
          term: n
        });
      }
    }
  }
} catch (e) { console.error('no CURRICULUM.json — index built without a wanted list'); }

const index = {
  generated_by: 'viz-training/tools/build-scene-index.mjs',
  schema: 2,
  count: scenes.length,
  ready: scenes.filter(s => s.status === 'ready').length,
  scenes,
  wanted
};

writeFileSync(join(SCENES, 'index.json'), JSON.stringify(index, null, 2) + '\n');
console.log(`index.json written · ${index.count} scenes (${index.ready} ready) · ${scenes.reduce((n, s) => n + Object.keys(s.terms).length, 0)} term mappings`);
