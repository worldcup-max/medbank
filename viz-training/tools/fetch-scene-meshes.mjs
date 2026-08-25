#!/usr/bin/env node
/* MedBank · viz-training/tools/fetch-scene-meshes.mjs
 *
 * Download exactly the meshes the corpus asks for — nothing else.
 *
 * ingest-full-archive.mjs exists for structures only the raw BodyParts3D archive has (the heart chambers,
 * which live inside a ~500 MB zip as FJ#### element files that have to be merged). Most scenes do not need
 * that. A public mirror already publishes the merged per-concept meshes under exactly the FMA#### filename
 * the adapter requests, so for those this is a short download rather than an archive build.
 *
 *   node viz-training/tools/fetch-scene-meshes.mjs                     # every id in every ready scene
 *   node viz-training/tools/fetch-scene-meshes.mjs --scene gross__arm__biceps-triceps
 *   node viz-training/tools/fetch-scene-meshes.mjs --list              # print the ids and sizes, download nothing
 *
 * NOTE ON WHERE THIS RUNS. It needs the open internet. Neither the Cowork cloud container nor the desktop
 * workspace VM can reach dbarchive or the mirror — both are firewalled — so run this in your own terminal,
 * not through the assistant. Everything downstream of it (decimate, validate) runs fine anywhere.
 *
 * Attribution travels with the geometry: BodyParts3D, © DBCLS, licensed CC-BY-SA 2.1 JP. The adapter emits
 * that string at render time; keep it intact if these files are re-hosted.
 *
 * Node 18+ (built-in fetch). No dependencies.
 */
import { readFileSync, writeFileSync, existsSync, mkdirSync, readdirSync, statSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const HERE = dirname(fileURLToPath(import.meta.url));
const ROOT = join(HERE, '..');
const SCENES = join(ROOT, 'scenes');
const OUT = join(ROOT, 'meshes');
const MIRROR = 'https://cdn.jsdelivr.net/gh/Kevin-Mattheus-Moerman/BodyParts3D@main/assets/BodyParts3D_data/stl/';

const argv = process.argv.slice(2);
const flag = (n, d) => { const i = argv.indexOf('--' + n); return i < 0 ? d : argv[i + 1]; };
const LIST_ONLY = argv.includes('--list');
const ONE = flag('scene', null);

/* ---- collect every bodyparts3d id the corpus references, and who wants it ---- */
const want = new Map();                                   // id -> Set of "scene · structure label"
for (const f of readdirSync(SCENES)) {
  if (!f.endsWith('.json') || f === 'index.json') continue;
  if (ONE && !f.startsWith(ONE)) continue;
  let scene;
  try { scene = JSON.parse(readFileSync(join(SCENES, f), 'utf8')); }
  catch (e) { console.error(`skipped ${f}: ${e.message}`); continue; }
  if (scene.status === 'planned' || scene.status === 'blocked') continue;
  for (const s of scene.structures || []) {
    const id = s.refs && s.refs.bodyparts3d;
    if (!id) continue;                                    // landmarks and SVG regions have no mesh
    if (!want.has(id)) want.set(id, new Set());
    want.get(id).add(`${scene.id} · ${s.label}`);
  }
}

if (!want.size) { console.log(ONE ? `no meshes referenced by ${ONE}` : 'no meshes referenced by any ready scene'); process.exit(0); }

if (!LIST_ONLY && !existsSync(OUT)) mkdirSync(OUT, { recursive: true });

console.log(`${want.size} mesh${want.size === 1 ? '' : 'es'} referenced by the corpus\n`);

let got = 0, skipped = 0, failed = 0, bytes = 0;
const missing = [];          // genuinely absent from the mirror (404)
const unreachable = [];      // could not tell — proxy, offline, rate limit

for (const [id, users] of [...want].sort()) {
  const dest = join(OUT, id + '.stl');
  const who = [...users][0] + (users.size > 1 ? ` (+${users.size - 1} more)` : '');

  if (!LIST_ONLY && existsSync(dest) && statSync(dest).size > 84) {
    skipped++; bytes += statSync(dest).size;
    console.log(`  have  ${id}  ${(statSync(dest).size / 1048576).toFixed(2)} MB   ${who}`);
    continue;
  }
  try {
    const r = await fetch(MIRROR + id + '.stl');
    if (!r.ok) {
      failed++;
      /* 404 means the mirror really does not carry this concept. Anything else — 403 from a corporate or
         sandbox proxy, 429, 5xx — means we could not tell, and sending someone to build a 500 MB archive
         over a blocked network would be a wild goose chase. Say which happened. */
      (r.status === 404 ? missing : unreachable).push(id);
      console.log(`  ${r.status === 404 ? 'MISS' : 'ERR '}  ${id}  HTTP ${r.status}   ${who}`);
      continue;
    }
    const buf = Buffer.from(await r.arrayBuffer());
    if (buf.length < 84) { failed++; unreachable.push(id); console.log(`  ERR   ${id}  truncated   ${who}`); continue; }
    bytes += buf.length;
    if (LIST_ONLY) { got++; console.log(`  ok    ${id}  ${(buf.length / 1048576).toFixed(2)} MB   ${who}`); continue; }
    writeFileSync(dest, buf);
    got++;
    console.log(`  got   ${id}  ${(buf.length / 1048576).toFixed(2)} MB   ${who}`);
  } catch (e) {
    failed++; unreachable.push(id);
    console.log(`  ERR   ${id}  ${e.message}   ${who}`);
  }
}

console.log(`\n${got} downloaded · ${skipped} already present · ${failed} not retrieved · ${(bytes / 1048576).toFixed(1)} MB total`);

if (unreachable.length) {
  console.log(`\nCould not reach the mirror for ${unreachable.length} id(s) — this is a network answer, not a`);
  console.log('verdict on whether the mesh exists. A blanket 403 across every id means a proxy is in the way:');
  console.log('run this from your own terminal rather than inside a sandbox, then re-run and compare.');
}

if (missing.length) {
  console.log(`\nGenuinely not on the mirror (404): ${missing.join(', ')}`);
  console.log('These exist only inside the full archive as FJ#### element files and need merging:');
  console.log(`  node viz-training/tools/ingest-full-archive.mjs --fetch ${missing.join(' ')}`);
}

if (!LIST_ONLY && got + skipped && !unreachable.length) {
  console.log('\nRaw archive meshes are far too large to ship. Next:');
  console.log('  node viz-training/tools/decimate-meshes.mjs viz-training/meshes --target 8000 --verify \\');
  console.log('       --out viz-training/meshes-lite');
  console.log('then upload meshes-lite/ and point config.js MESH_BASE at it.');
}
