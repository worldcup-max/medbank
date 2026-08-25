#!/usr/bin/env node
/* MedBank · viz-training/tools/ingest-full-archive.mjs
 *
 * Get the structures the free subset does not have — heart chambers, the aortic valve, and ~430 other
 * concepts — out of the full BodyParts3D archive and into meshes we host ourselves.
 *
 * WHY THIS EXISTS
 *   The jsdelivr subset the player uses today has 934 meshes and no cardiac chambers, so the heart scene
 *   teaches them through their valves and says so in gaps[]. The full archive HAS them. It is just shaped
 *   differently, and the shape is the whole problem this script solves:
 *
 *     partof_element_parts.txt      FMA7096  right atrium  ->  FJ2421, FJ2424, FJ2433, ...   (5 element files)
 *     partof_BP3D_4.0_obj_99.zip    partof_BP3D_4.0_obj_99/FJ2421.obj  ...
 *
 *   One anatomical concept is the UNION of several element meshes, named by a third id scheme (FJ) that
 *   appears in neither parts list. So: resolve FMA -> FJ set, pull those OBJs out of the zip, merge them,
 *   write ONE binary STL named FMA7096.stl — the same filename the adapter already asks for. Nothing in the
 *   player or in any scene has to change; only where the adapter fetches from.
 *
 * WHERE TO RUN IT
 *   On a machine with internet — your laptop, not the Cowork workspace and not the cloud container, both of
 *   which are firewalled. Node 18+.
 *
 *     node viz-training/tools/ingest-full-archive.mjs --list
 *         Downloads the small index files (~700 KB) and reports what the archive has that we do not.
 *
 *     node viz-training/tools/ingest-full-archive.mjs --fetch FMA7096 FMA7097 FMA7098 FMA7101 FMA7236
 *         Downloads the 65 MB zip once (cached in viz-training/.archive/), extracts, merges, and writes
 *         viz-training/meshes/FMA7096.stl and friends.
 *
 *     node viz-training/tools/ingest-full-archive.mjs --for-scene viz-training/scenes/<id>.json
 *         Same, for every ref in a scene that is missing from available-meshes.json.
 *
 *     node viz-training/tools/ingest-full-archive.mjs --upload
 *         Uploads viz-training/meshes/*.stl to Supabase Storage. Needs, in the environment:
 *           SUPABASE_URL, SUPABASE_SERVICE_KEY, and optionally MB_MESH_BUCKET (default "viz-meshes").
 *         The service key is a secret: pass it in the environment, never in a file.
 *
 *   Then point the player at the store — one line in config.js, no code change:
 *       MESH_BASE: "https://<project>.supabase.co/storage/v1/object/public/viz-meshes/"
 *
 * LICENCE
 *   BodyParts3D, © DBCLS, CC-BY-SA 2.1 JP. Re-hosting is permitted with attribution, which the player
 *   already prints on every scene. Keep it that way.
 */
import { createWriteStream, existsSync, mkdirSync, readFileSync, writeFileSync, statSync, readdirSync } from 'node:fs';
import { join, dirname, basename } from 'node:path';
import { fileURLToPath } from 'node:url';
import { inflateRawSync } from 'node:zlib';

const HERE = dirname(fileURLToPath(import.meta.url));
const ROOT = join(HERE, '..');                       // viz-training/
const CACHE = join(ROOT, '.archive');                // downloaded archive files live here (git-ignore it)
const OUT = join(ROOT, 'meshes');                    // FMA####.stl we produce
const BASE = 'https://dbarchive.biosciencedbc.jp/data/bodyparts3d/LATEST/';
const ZIP = 'partof_BP3D_4.0_obj_99.zip';
const ELEMENTS = 'partof_element_parts.txt';
const PARTS = 'partof_parts_list_e.txt';

const args = process.argv.slice(2);
const has = f => args.includes(f);
const valuesAfter = f => { const i = args.indexOf(f); return i < 0 ? [] : args.slice(i + 1).filter(a => !a.startsWith('--')); };

for (const d of [CACHE, OUT]) if (!existsSync(d)) mkdirSync(d, { recursive: true });

/* ---------------------------------------------------------------- download, with a cache */
async function grab(name, note) {
  const path = join(CACHE, name);
  if (existsSync(path) && statSync(path).size > 0) return path;
  process.stdout.write(`  downloading ${name}${note ? ' (' + note + ')' : ''} … `);
  const r = await fetch(BASE + name);
  if (!r.ok) throw new Error(`HTTP ${r.status} for ${name}`);
  const buf = Buffer.from(await r.arrayBuffer());
  writeFileSync(path, buf);
  console.log(`${(buf.length / 1048576).toFixed(1)} MB`);
  return path;
}

/* ---------------------------------------------------------------- FMA -> element files, and names */
function loadIndex() {
  const el = readFileSync(join(CACHE, ELEMENTS), 'utf8').split('\n').filter(Boolean).slice(1);
  const map = new Map();
  for (const line of el) {
    const [fma, name, fj] = line.split('\t');
    if (!fma || !fj) continue;
    if (!map.has(fma)) map.set(fma, { name: (name || '').trim(), files: [] });
    map.get(fma).files.push(fj.trim());
  }
  return map;
}

/* ---------------------------------------------------------------- a minimal ZIP reader
   Node ships inflate but no unzip. The archive is a plain stored/deflated zip, so reading its central
   directory and inflating just the entries we want beats unpacking 65 MB of OBJ we do not need. */
function openZip(path) {
  const buf = readFileSync(path);
  let eocd = -1;
  for (let i = buf.length - 22; i >= 0 && i > buf.length - 66000; i--) if (buf.readUInt32LE(i) === 0x06054b50) { eocd = i; break; }
  if (eocd < 0) throw new Error('not a zip (no end-of-central-directory)');
  const count = buf.readUInt16LE(eocd + 10);
  let p = buf.readUInt32LE(eocd + 16);
  const entries = new Map();
  for (let i = 0; i < count; i++) {
    if (buf.readUInt32LE(p) !== 0x02014b50) break;
    const method = buf.readUInt16LE(p + 10);
    const csize = buf.readUInt32LE(p + 20);
    const nameLen = buf.readUInt16LE(p + 28);
    const extraLen = buf.readUInt16LE(p + 30);
    const cmtLen = buf.readUInt16LE(p + 32);
    const local = buf.readUInt32LE(p + 42);
    const name = buf.toString('latin1', p + 46, p + 46 + nameLen);
    entries.set(basename(name), { method, csize, local });
    p += 46 + nameLen + extraLen + cmtLen;
  }
  return {
    names: [...entries.keys()],
    read(name) {
      const e = entries.get(name);
      if (!e) return null;
      const nameLen = buf.readUInt16LE(e.local + 26), extraLen = buf.readUInt16LE(e.local + 28);
      const start = e.local + 30 + nameLen + extraLen;
      const raw = buf.subarray(start, start + e.csize);
      return e.method === 0 ? raw : inflateRawSync(raw);
    }
  };
}

/* ---------------------------------------------------------------- OBJ -> triangles -> binary STL */
function objTriangles(text) {
  const verts = [], tris = [];
  for (const line of text.split('\n')) {
    if (line.charCodeAt(0) === 118 && line[1] === ' ') {            // "v x y z"
      const p = line.split(/\s+/);
      verts.push([+p[1], +p[2], +p[3]]);
    } else if (line.charCodeAt(0) === 102 && line[1] === ' ') {      // "f a b c [d]" (a may be a/b/c)
      const idx = line.trim().split(/\s+/).slice(1).map(t => {
        const n = parseInt(t.split('/')[0], 10);
        return n < 0 ? verts.length + n : n - 1;
      });
      for (let i = 1; i + 1 < idx.length; i++) tris.push([idx[0], idx[i], idx[i + 1]]);   // fan-triangulate
    }
  }
  return { verts, tris };
}
function writeBinarySTL(path, meshes) {
  let total = 0;
  for (const m of meshes) total += m.tris.length;
  const buf = Buffer.alloc(84 + total * 50);
  buf.write('MedBank ingest of BodyParts3D (CC-BY-SA 2.1 JP, (c) DBCLS)', 0, 'latin1');
  buf.writeUInt32LE(total, 80);
  let o = 84;
  for (const m of meshes) {
    for (const t of m.tris) {
      const a = m.verts[t[0]], b = m.verts[t[1]], c = m.verts[t[2]];
      if (!a || !b || !c) continue;
      const ux = b[0] - a[0], uy = b[1] - a[1], uz = b[2] - a[2];
      const vx = c[0] - a[0], vy = c[1] - a[1], vz = c[2] - a[2];
      let nx = uy * vz - uz * vy, ny = uz * vx - ux * vz, nz = ux * vy - uy * vx;
      const len = Math.hypot(nx, ny, nz) || 1; nx /= len; ny /= len; nz /= len;
      buf.writeFloatLE(nx, o); buf.writeFloatLE(ny, o + 4); buf.writeFloatLE(nz, o + 8);
      for (const [i, p] of [[12, a], [24, b], [36, c]]) {
        buf.writeFloatLE(p[0], o + i); buf.writeFloatLE(p[1], o + i + 4); buf.writeFloatLE(p[2], o + i + 8);
      }
      buf.writeUInt16LE(0, o + 48);
      o += 50;
    }
  }
  writeFileSync(path, buf.subarray(0, o));
  return { triangles: total, bytes: o };
}

/* ---------------------------------------------------------------- commands */
async function cmdList() {
  console.log('reading the archive index…');
  await grab(ELEMENTS, '650 KB'); await grab(PARTS, '58 KB');
  const map = loadIndex();
  let have = new Set();
  try { have = new Set(JSON.parse(readFileSync(join(ROOT, 'available-meshes.json'), 'utf8')).meshes.map(m => m.id)); }
  catch (e) { console.log('  (no available-meshes.json to compare against)'); }
  const missing = [...map.keys()].filter(k => !have.has(k));
  console.log(`\narchive: ${map.size} concepts · we already have ${have.size} · ${missing.length} we do not\n`);
  const interesting = /(atrium|ventricle|valve|septum|chamber|nerve|plexus|ganglion|nucleus|tract|gyrus)/i;
  const show = missing.filter(k => interesting.test(map.get(k).name)).slice(0, 40);
  console.log('a sample of what is newly reachable:');
  for (const k of show) console.log(`  ${k.padEnd(10)} ${map.get(k).name}  (${map.get(k).files.length} element files)`);
  console.log(`\nfetch some:  node viz-training/tools/ingest-full-archive.mjs --fetch ${show.slice(0, 3).join(' ')}`);
}

async function cmdFetch(ids) {
  if (!ids.length) { console.log('nothing to fetch — pass FMA ids, or --for-scene <file>'); return; }
  await grab(ELEMENTS, '650 KB');
  const map = loadIndex();
  const unknown = ids.filter(i => !map.has(i));
  if (unknown.length) console.log(`not in the archive, skipping: ${unknown.join(', ')}`);
  const todo = ids.filter(i => map.has(i));
  if (!todo.length) return;

  const zipPath = await grab(ZIP, '65 MB, cached after the first run');
  console.log('reading the zip index…');
  const zip = openZip(zipPath);
  console.log(`  ${zip.names.length} element meshes in the archive\n`);

  const report = [];
  for (const fma of todo) {
    const { name, files } = map.get(fma);
    const meshes = [];
    let missingFiles = 0;
    for (const fj of files) {
      const raw = zip.read(fj + '.obj');
      if (!raw) { missingFiles++; continue; }
      meshes.push(objTriangles(raw.toString('utf8')));
    }
    if (!meshes.length) { console.log(`✗ ${fma} ${name} — no element meshes found`); continue; }
    const out = join(OUT, fma + '.stl');
    const { triangles, bytes } = writeBinarySTL(out, meshes);
    console.log(`✓ ${fma.padEnd(10)} ${name.padEnd(34)} ${String(meshes.length).padStart(3)} elements · ${String(triangles).padStart(7)} triangles · ${(bytes / 1024).toFixed(0)} KB` +
      (missingFiles ? `  (${missingFiles} element file(s) absent)` : ''));
    report.push({ id: fma, name, elements: meshes.length, triangles });
  }

  /* keep the catalog honest: these ids now exist, and the scene validator checks against it */
  const catPath = join(ROOT, 'available-meshes.json');
  try {
    const cat = JSON.parse(readFileSync(catPath, 'utf8'));
    const known = new Set(cat.meshes.map(m => m.id));
    let added = 0;
    for (const r of report) if (!known.has(r.id)) { cat.meshes.push({ id: r.id, name: r.name, source: 'archive' }); added++; }
    if (added) {
      cat.count = cat.meshes.length;
      cat.meshes.sort((a, b) => (a.name || '').localeCompare(b.name || ''));
      writeFileSync(catPath, JSON.stringify(cat, null, 1) + '\n');
      console.log(`\navailable-meshes.json: +${added} ids (now ${cat.count})`);
    }
  } catch (e) { console.log('\ncould not update available-meshes.json: ' + e.message); }

  console.log(`\nwrote ${report.length} mesh file(s) to viz-training/meshes/`);
  console.log('next:  --upload  (or serve that folder yourself and set MESH_BASE in config.js)');
}

async function cmdForScene(file) {
  const scene = JSON.parse(readFileSync(file, 'utf8'));
  let have = new Set();
  try { have = new Set(JSON.parse(readFileSync(join(ROOT, 'available-meshes.json'), 'utf8')).meshes.map(m => m.id)); } catch (e) {}
  const want = [...new Set((scene.structures || []).map(s => s.refs && s.refs.bodyparts3d).filter(Boolean))];
  const missing = want.filter(id => !have.has(id));
  console.log(`${basename(file)}: ${want.length} refs, ${missing.length} missing from the catalog`);
  await cmdFetch(missing);
}

async function cmdUpload() {
  const url = process.env.SUPABASE_URL, key = process.env.SUPABASE_SERVICE_KEY;
  const bucket = process.env.MB_MESH_BUCKET || 'viz-meshes';
  if (!url || !key) { console.error('set SUPABASE_URL and SUPABASE_SERVICE_KEY in the environment first'); process.exit(2); }
  const files = readdirSync(OUT).filter(f => f.endsWith('.stl'));
  if (!files.length) { console.log('nothing in viz-training/meshes/ to upload'); return; }
  console.log(`uploading ${files.length} file(s) to ${bucket}…`);
  let ok = 0;
  for (const f of files) {
    const body = readFileSync(join(OUT, f));
    const r = await fetch(`${url.replace(/\/$/, '')}/storage/v1/object/${bucket}/${f}`, {
      method: 'POST',
      headers: { Authorization: 'Bearer ' + key, 'Content-Type': 'model/stl', 'x-upsert': 'true' },
      body
    });
    if (r.ok) { ok++; console.log(`  ✓ ${f}`); }
    else console.log(`  ✗ ${f} — HTTP ${r.status} ${(await r.text()).slice(0, 120)}`);
  }
  console.log(`\n${ok}/${files.length} uploaded.`);
  console.log(`set in config.js:  MESH_BASE: "${url.replace(/\/$/, '')}/storage/v1/object/public/${bucket}/"`);
  console.log('the bucket must be public for the player to read it — check that in the Supabase dashboard.');
}

/* ---------------------------------------------------------------- */
try {
  if (has('--list')) await cmdList();
  else if (has('--for-scene')) await cmdForScene(valuesAfter('--for-scene')[0]);
  else if (has('--fetch')) await cmdFetch(valuesAfter('--fetch'));
  else if (has('--upload')) await cmdUpload();
  else {
    console.log('BodyParts3D full-archive ingest — the meshes the free subset does not have.\n');
    console.log('  --list                    what the archive has that we do not');
    console.log('  --fetch FMA7096 FMA7097   pull those concepts, merge elements, write STL');
    console.log('  --for-scene <scene.json>  pull whatever that scene refs and we lack');
    console.log('  --upload                  push viz-training/meshes/*.stl to Supabase Storage');
    console.log('\nrun it on a machine with internet — node 18+.');
  }
} catch (e) { console.error('\nfailed: ' + e.message); process.exit(1); }
