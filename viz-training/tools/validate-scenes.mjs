#!/usr/bin/env node
/* MedBank · viz-training/tools/validate-scenes.mjs
 *
 * THE HARD GATE. A scene is not "ready" because someone wrote it — it is ready because it passed here.
 *
 *   author (task | ai | human)
 *        ↓
 *   1 schema      · is this a v2 VisualScene at all
 *   2 canonical   · does every structure name match the catalog's own name, character for character
 *   3 provider-id · is there a resolvable ref for the scene's provider
 *   4 existence   · does that id actually exist in the catalog
 *   5 ops         · does every op exist and every target resolve
 *   6 capability  · which ops will the adapter degrade (recorded, not fatal)
 *   7 purity      · does the scene leak delivery mechanics (urls, file types, library names)
 *   8 lifecycle   · may this scene claim the status it claims
 *        ↓
 *   status: ready | candidate | planned | blocked
 *
 * Only `ready` reaches a student. `candidate` is an AI-authored scene awaiting approval — it renders on the
 * dev route and nowhere else. This is what stops an invented mesh id ever becoming a taught fact: the v1
 * heart scene referenced 13 ids that do not exist and labelled FMA7196 — the SPLEEN — as "left lung".
 *
 * Usage:
 *   node viz-training/tools/validate-scenes.mjs           # report; exit 1 if any scene fails
 *   node viz-training/tools/validate-scenes.mjs --mark    # ALSO rewrite failures as status:"blocked"
 *   node viz-training/tools/validate-scenes.mjs --quiet   # failures only
 *
 * Node 18+. No dependencies.
 */
import { readFileSync, writeFileSync, readdirSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const HERE = dirname(fileURLToPath(import.meta.url));
const ROOT = join(HERE, '..');
const SCENES = join(ROOT, 'scenes');
const MARK = process.argv.includes('--mark');
const QUIET = process.argv.includes('--quiet');

const OPS = new Set(['SHOW_STRUCTURE', 'HIDE_STRUCTURE', 'HIGHLIGHT_STRUCTURE', 'ISOLATE_REGION',
  'ROTATE_TO_VIEW', 'CROSS_SECTION', 'COMPARE_STRUCTURES', 'SHOW_RELATIONSHIP',
  'TRACE_STRUCTURE', 'PEEL_LAYER']);
const MODES = new Set(['3d_anatomy', 'microscopic', 'diagram', 'sequence', 'comparison', 'imaging']);
const VIEWS = new Set(['anterior', 'posterior', 'lateral', 'medial', 'superior', 'inferior']);
const STATUSES = new Set(['ready', 'candidate', 'planned', 'blocked']);

/* Mirrors viz3d.js. When an adapter gains an ability, change it in both places — the mismatch is the point:
   authoring should never be silently limited by what today's renderer happens to do. */
const CAPABILITIES = {
  bodyparts3d: {
    native: ['SHOW_STRUCTURE', 'HIDE_STRUCTURE', 'HIGHLIGHT_STRUCTURE', 'ISOLATE_REGION', 'ROTATE_TO_VIEW',
      'CROSS_SECTION', 'COMPARE_STRUCTURES', 'SHOW_RELATIONSHIP', 'TRACE_STRUCTURE'],
    degraded: ['PEEL_LAYER'],
    catalog: 'available-meshes.json'
  },
  svg: { native: [], degraded: [], catalog: null }
};

/* Delivery mechanics belong BELOW the abstraction boundary. A scene says "the median nerve, highlighted and
   traced" — how that is fetched is the adapter's business, and a scene that knows is a scene that has to be
   rewritten when the provider changes. */
const FORBIDDEN = [
  [/https?:\/\//i, 'a URL'],
  [/\.stl\b/i, 'a file extension (.stl)'],
  [/jsdelivr|cdn\./i, 'a CDN host'],
  [/three\.?js/i, 'a rendering library'],
  [/\bmesh_base\b|"url"/i, 'a delivery field']
];
const PROVIDER_NAMES = [/bodyparts3d/i, /biodigital/i, /complete ?anatomy/i];

const catalogRaw = JSON.parse(readFileSync(join(ROOT, 'available-meshes.json'), 'utf8'));
const CATALOG = new Map((catalogRaw.meshes || []).map(m => [m.id, m.name || '']));

function validate(scene) {
  const errors = [], warnings = [], degrades = new Set();
  const E = (stage, m) => errors.push(`[${stage}] ${m}`);
  const W = (stage, m) => warnings.push(`[${stage}] ${m}`);

  /* ---- 1 schema ---- */
  if (scene.schema !== 2) E('schema', `schema is ${JSON.stringify(scene.schema)} — must be 2 (model3d-scene-spec-v2.md)`);
  if (!scene.id) E('schema', 'missing id');
  if (!MODES.has(scene.mode)) E('schema', `mode ${JSON.stringify(scene.mode)} is not one of ${[...MODES].join(', ')}`);
  if (!scene.provider || !scene.provider.primary) E('schema', 'missing provider.primary');
  if (!scene.learning_goal) W('schema', 'no learning_goal — the note cannot say why this scene opened');
  if (scene.status && !STATUSES.has(scene.status)) E('schema', `status ${JSON.stringify(scene.status)} is not one of ${[...STATUSES].join(', ')}`);

  const provider = (scene.provider && scene.provider.primary) || 'bodyparts3d';
  const caps = CAPABILITIES[provider];
  if (!caps) E('schema', `no adapter known for provider ${JSON.stringify(provider)}`);

  const structures = Array.isArray(scene.structures) ? scene.structures : null;
  if (!structures) {
    E('schema', 'missing structures[] (v1 meshes[]/parts[] must be merged — see the spec)');
    return { errors, warnings, degrades: [] };
  }

  const keys = new Set(), groups = new Set();
  for (const s of structures) {
    if (!s.key) { E('schema', `a structure has no key (label ${JSON.stringify(s.label || '')})`); continue; }
    if (keys.has(s.key)) E('schema', `duplicate structure key ${JSON.stringify(s.key)}`);
    keys.add(s.key);
    if (s.group) groups.add(s.group);
    if (!s.label) E('schema', `${s.key}: no label — the student needs something to read`);

    if (s.render === 'anchor') {
      /* A landmark is a place ON a parent structure. Authored as uvw — fractions of the parent's own
         bounding box — so it survives scaling and travels with the parent. xyz stays legal for a point
         that belongs to the scene rather than to one structure. */
      const a = s.anchor || {};
      const uvwOk = Array.isArray(a.uvw) && a.uvw.length === 3 && a.uvw.every(n => typeof n === 'number' && n >= -0.5 && n <= 1.5);
      const xyzOk = Array.isArray(a.xyz) && a.xyz.length === 3;
      if (!uvwOk && !xyzOk) E('schema', `${s.key}: anchor needs anchor.uvw [u,v,w] (0–1 within its parent) or anchor.xyz`);
      if (uvwOk && !a.on) E('schema', `${s.key}: anchor.uvw needs anchor.on — the key of the structure it sits on`);
      if (a.on && !keys.has(a.on) && !structures.some(x => x.key === a.on)) E('ops', `${s.key}: anchor.on "${a.on}" matches no structure in this scene`);
      if (s.status !== 'needs-review' && !s.reviewed_by)
        E('lifecycle', `${s.key}: an authored anchor stays status:"needs-review" until a human clears it — set reviewed_by to release it`);
      if (!s.calibrated_by) W('lifecycle', `${s.key}: no calibrated_by — record how the anchor was placed (geometry, author, calibrate-click)`);
      continue;
    }
    if (scene.mode !== '3d_anatomy') continue;         // diagram/microscopic scenes carry no model refs

    /* ---- 3 provider-id ---- */
    const ref = s.refs && s.refs[provider];
    if (!ref) { E('provider-id', `${s.key}: no refs.${provider} and not an anchor — nothing can render this`); continue; }

    /* ---- 4 existence ---- */
    if (caps && caps.catalog && !CATALOG.has(ref)) {
      E('existence', `${s.key}: ${ref} is NOT in ${caps.catalog} — the model does not exist. Never invent an id.`);
      continue;
    }

    /* ---- 2 canonical ---- */
    const catName = CATALOG.get(ref);
    if (!s.name) E('canonical', `${s.key}: no name — cannot check ${ref} against the catalog`);
    else if (catName != null && s.name !== catName) E('canonical', `${s.key}: name mismatch — scene says ${JSON.stringify(s.name)}, catalog says ${JSON.stringify(catName)} for ${ref}. This is how a spleen ends up labelled "lung".`);
  }

  /* ---- 5 ops + 6 capability ---- */
  const resolves = t => t === '*' || t === 'blood' || keys.has(t) || groups.has(t);
  for (const v of (scene.views || [])) {
    const where = JSON.stringify(v.title || v.mode);
    if (!v.narration) W('ops', `view ${where}: no narration`);
    if (!(v.ops || []).length) W('ops', `view ${where}: no ops — nothing will happen on screen`);
    for (const o of (v.ops || [])) {
      if (!OPS.has(o.op)) { E('ops', `view ${where}: unknown op ${JSON.stringify(o.op)}`); continue; }
      const targets = [].concat(o.target || [], o.targets || [], o.from || [], o.to || [], o.path || []);
      for (const t of targets) if (!resolves(t)) E('ops', `view ${where} · ${o.op}: target ${JSON.stringify(t)} matches no structure key or group`);
      if (o.op === 'ROTATE_TO_VIEW' && !VIEWS.has(o.view)) E('ops', `${where} · ROTATE_TO_VIEW: view ${JSON.stringify(o.view)} is not one of ${[...VIEWS].join(', ')}`);
      if (o.op === 'CROSS_SECTION' && !['x', 'y', 'z'].includes(o.axis)) E('ops', `${where} · CROSS_SECTION: axis must be x, y or z`);
      if (caps && caps.degraded.indexOf(o.op) >= 0) degrades.add(o.op);
      else if (caps && caps.native.indexOf(o.op) < 0 && OPS.has(o.op)) W('capability', `${o.op} is unknown to the ${provider} adapter — it will be ignored, not degraded`);
    }
  }

  /* ---- 7 purity ----
     gaps[] and blocked_reason[] are prose written for a human reader — a gap that says "the chambers are in
     the full BodyParts3D archive, fetch FMA7096" is exactly the note a maintainer needs. Strip those two
     arrays before scanning, so the rule polices the machine-read scene without gagging the notes.
     (The earlier version stripped a synthesised {gaps,blocked_reason} object that never appears verbatim in
     the scene, so the exemption silently did nothing.) */
  const strip = (text) => {
    for (const arr of [scene.gaps, scene.blocked_reason]) {
      if (!Array.isArray(arr) || !arr.length) continue;
      const json = JSON.stringify(arr);
      text = text.split(json).join('');                                  // as it appears in the whole scene
      for (const item of arr) text = text.split(JSON.stringify(item)).join('');   // and item by item
    }
    return text;
  };
  const body = strip(JSON.stringify(scene));
  for (const [re, what] of FORBIDDEN) if (re.test(body)) E('purity', `the scene contains ${what} — delivery belongs to the adapter, not the scene`);
  const outsideRefs = strip(JSON.stringify({ ...scene, provider: null, structures: (scene.structures || []).map(s => ({ ...s, refs: null })) }));
  for (const re of PROVIDER_NAMES) if (re.test(outsideRefs)) E('purity', `the scene names a provider outside provider{} and refs{} — a scene should not know who renders it`);

  /* ---- 8 lifecycle ---- */
  const prov = scene.provenance || {};
  if (!prov.author) W('lifecycle', 'no provenance.author — record whether this was authored by the task, an AI, or a human');
  if (scene.status === 'ready' && prov.author === 'ai' && !prov.approved_by)
    E('lifecycle', 'an AI-authored scene cannot be "ready" without provenance.approved_by — it stays "candidate" until a human signs it off');
  if (scene.mode === 'imaging' && scene.status === 'ready')
    E('lifecycle', 'no imaging engine exists yet — an imaging scene must be status:"planned"');

  const parts = structures.filter(s => s.role === 'part');
  if (!parts.length) W('ops', 'no structures with role:"part" — the student gets no parts list');
  return { errors, warnings, degrades: [...degrades] };
}

const files = readdirSync(SCENES).filter(f => f.endsWith('.json') && f !== 'index.json').sort();
let bad = 0, total = 0;
for (const f of files) {
  const path = join(SCENES, f);
  let scene;
  try { scene = JSON.parse(readFileSync(path, 'utf8')); }
  catch (e) { console.log(`✗ ${f}\n    unparseable JSON: ${e.message}`); bad++; continue; }
  total++;
  const { errors, warnings, degrades } = validate(scene);
  if (errors.length) {
    bad++;
    console.log(`✗ ${f}  (${errors.length} error${errors.length === 1 ? '' : 's'})`);
    errors.forEach(m => console.log(`    ✗ ${m}`));
    warnings.forEach(m => console.log(`    · ${m}`));
    if (MARK) {
      scene.status = 'blocked';
      scene.blocked_reason = errors;
      writeFileSync(path, JSON.stringify(scene, null, 2) + '\n');
      console.log('    → marked status:"blocked"');
    }
  } else if (!QUIET) {
    const s = scene.structures || [];
    const p = s.filter(x => x.role === 'part').length;
    const ops = (scene.views || []).reduce((n, v) => n + (v.ops || []).length, 0);
    console.log(`✓ ${f}  ${s.length} structures (${p} parts) · ${(scene.views || []).length} views · ${ops} ops · ${scene.status || 'unknown'}` +
      (degrades.length ? `  [degrades: ${degrades.join(', ')}]` : ''));
    warnings.forEach(m => console.log(`    · ${m}`));
  }
}
console.log(`\n${total - bad}/${total} scenes valid.`);
process.exit(bad ? 1 : 0);
