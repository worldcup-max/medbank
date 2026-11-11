/* MedBank · build drill-sets.json for the Anatomy Drill from every scan scene.
 *
 *   node viz-training/tools/build-drill-sets.mjs            → writes drill-sets.json at the repo root
 *   node viz-training/tools/build-drill-sets.mjs --missing  → also lists name words with no origin yet
 *
 * One set per bodyparts3d scene (big scenes are split into parts of at most 8 names). The structures the
 * scene marks as context stay on screen as glass; the rest become the names to type. Left and right copies
 * of one structure become ONE name with both meshes lit. Clues come from the scene's own narration (the
 * first sentence that does not give the name away). Word origins are hand-written, per word, in
 * viz-training/drill-origins.json — add a word there and re-run; nothing else needs touching.
 */
import { readFileSync, writeFileSync, readdirSync } from 'fs';

const SCENES = 'viz-training/scenes/';
const ORIGINS = JSON.parse(readFileSync('viz-training/drill-origins.json', 'utf8'));
const MAX_ITEMS = 8, MIN_ITEMS = 3, MAX_NAME = 34;

const ORD = ['', 'first', 'second', 'third', 'fourth', 'fifth', 'sixth', 'seventh', 'eighth', 'ninth', 'tenth', 'eleventh', 'twelfth'];
const REGION = { C: 'cervical', T: 'thoracic', L: 'lumbar', S: 'sacral' };
const STOP = new Set(['of', 'the', 'and', 'a', 'to', 'in', 'on', 'its', 'with', 'part']);

function plain(s) {
  return s.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase()
    .replace(/['’]s\b/g, 's').replace(/['’]/g, '').replace(/[-–\/]/g, ' ').replace(/[^a-z ]/g, ' ').replace(/\s+/g, ' ').trim();
}

/* label → { name, accept[] } or null when it is not a name a student could type */
function normalise(label) {
  let s = String(label).split(/\s+[—–]\s+|\s+-\s+/)[0].trim();
  const accept = [];
  s = s.replace(/\(([^)]*)\)/g, (m, inner) => {
    const w = inner.trim();
    if (/^(right|left|r|l|both|paired|bilateral)$/i.test(w)) return '';
    if (w.split(/\s+/).length <= 3 && !/\d/.test(w) && !/^(cut|section|outline|for|see)/i.test(w)) accept.push(plain(w));
    return '';
  }).trim();
  s = s.replace(/^(right|left)\s+/i, '');
  let m;
  if ((m = s.match(/^rib\s*(\d+)$/i)) || (m = s.match(/^(\d+)(st|nd|rd|th)\s+rib$/i))) s = ORD[+m[1]] + ' rib';
  else if ((m = s.match(/^([CTLS])(\d+)$/))) { accept.push(plain(m[1] + ' ' + ORD[+m[2]])); s = ORD[+m[2]] + ' ' + REGION[m[1]] + ' vertebra'; }
  else if ((m = s.match(/^([CTLS])(\d+)\s*[–-]\s*([CTLS])?(\d+)\s+(disc|intervertebral disc)$/i))) return null;
  if (/\d/.test(s)) return null;
  const name = plain(s);
  if (!name || name.length > MAX_NAME || name.split(' ').length > 5) return null;
  return { name, accept: [...new Set(accept.filter(a => a && a !== name))] };
}

function sentences(t) { return String(t || '').replace(/\s+/g, ' ').match(/[^.!?]+[.!?]+/g) || (t ? [t] : []); }
function gives(sent, name) {
  const p = plain(sent);
  return name.split(' ').filter(w => w.length > 3 && !STOP.has(w)).some(w => p.includes(w.slice(0, Math.max(4, w.length - 2))));
}
function clip(s, n) { s = s.trim(); if (s.length <= n) return s; s = s.slice(0, n); return s.slice(0, s.lastIndexOf(' ')).replace(/[,;:]$/, '') + '…'; }

function clueFor(name, structs, scene) {
  for (const st of structs) for (const s of sentences(st.narration)) {
    const t = s.trim();
    if (t.length >= 25 && !gives(t, name)) return clip(t.replace(/\.$/, ''), 150);
  }
  for (const st of structs) for (const term of (st.terms || [])) if (term.length > 8 && !gives(term, name)) return term;
  const st = structs[0];
  return (st.layer ? st.layer.replace(/_/g, ' ') + ' · ' : '') + (st.group || scene.structure);
}

function originFor(name) {
  const words = name.split(' ').filter(w => !STOP.has(w));
  const hits = [];
  for (const w of words) {
    const o = ORIGINS[w] || ORIGINS[w.replace(/s$/, '')] || ORIGINS[w.replace(/es$/, '')];
    if (o && !hits.some(h => h[1] === o)) hits.push([w, o]);
  }
  hits.sort((a, b) => b[0].length - a[0].length);
  return hits.slice(0, 2).map(h => h[0] + ' · ' + h[1]).join('   ');
}

function viewOf(scene) {
  const f = (scene.camera && scene.camera.framing) || 'anterior';
  return ({ anterior: [0, 0.1, 1], posterior: [0, 0.1, -1], lateral: [-1, 0.1, 0.1], right: [-1, 0.1, 0.1], left: [1, 0.1, 0.1],
    superior: [0.05, 1, 0.25], inferior: [0.05, -1, 0.25], medial: [1, 0.1, 0.1] })[f] || [0, 0.1, 1];
}

const out = [], missing = new Map();
for (const f of readdirSync(SCENES).filter(f => f.endsWith('.json') && f !== 'index.json').sort()) {
  const scene = JSON.parse(readFileSync(SCENES + f, 'utf8'));
  const p = scene.provider, prim = p && typeof p === 'object' ? p.primary : p;
  if (prim !== 'bodyparts3d') continue;
  const ref = s => s.refs && s.refs.bodyparts3d;
  const ctx = [...new Set(scene.structures.filter(ref).map(ref))];
  const byName = new Map();
  for (const s of scene.structures) {
    if (!ref(s) || s.role === 'context') continue;
    const n = normalise(s.label || s.name); if (!n) continue;
    const it = byName.get(n.name) || { name: n.name, fma: [], accept: [], structs: [] };
    if (!it.fma.includes(ref(s))) it.fma.push(ref(s));
    n.accept.forEach(a => { if (!it.accept.includes(a)) it.accept.push(a); });
    it.structs.push(s); byName.set(n.name, it);
  }
  // one mesh answering to two names is ambiguous — keep the first name only
  const seen = new Set(), items = [];
  for (const it of byName.values()) {
    it.fma = it.fma.filter(x => !seen.has(x)); it.fma.forEach(x => seen.add(x));
    if (!it.fma.length) continue;
    const o = originFor(it.name);
    if (!o) it.name.split(' ').filter(w => !STOP.has(w)).forEach(w => missing.set(w, (missing.get(w) || 0) + 1));
    const item = { name: it.name, fma: it.fma, clue: clueFor(it.name, it.structs, scene), origin: o || '' };
    if (it.accept.length) item.accept = it.accept;
    items.push(item);
  }
  if (items.length < MIN_ITEMS) continue;
  const parts = Math.ceil(items.length / MAX_ITEMS), per = Math.ceil(items.length / parts);
  for (let k = 0; k < parts; k++) {
    const chunk = items.slice(k * per, (k + 1) * per);
    if (chunk.length < 2) continue;
    out.push({ id: scene.id + (parts > 1 ? '~' + (k + 1) : ''), title: scene.structure + (parts > 1 ? ' · ' + (k + 1) + ' of ' + parts : ''),
      region: scene.topic, course: scene.course, auto: true, view: viewOf(scene), ctx, items: chunk });
  }
}
writeFileSync('drill-sets.json', JSON.stringify({ generated: new Date().toISOString().slice(0, 10), count: out.length, sets: out }));
const nItems = out.reduce((a, s) => a + s.items.length, 0), noOrigin = out.reduce((a, s) => a + s.items.filter(i => !i.origin).length, 0);
console.log(`drill-sets.json: ${out.length} sets, ${nItems} names, ${noOrigin} without an origin line`);
if (process.argv.includes('--missing')) console.log([...missing].sort((a, b) => b[1] - a[1]).map(x => x[0]).join(' '));
