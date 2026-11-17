#!/usr/bin/env node
/* MedBank · tools/upload-art.mjs — put the patient pictures in the er-sim-art bucket, and prove it.
 *
 *   PowerShell:   $env:SUPABASE_SERVICE_KEY="<service_role key>"
 *   Windows cmd:  set SUPABASE_SERVICE_KEY=<service_role key>
 *   bash:         export SUPABASE_SERVICE_KEY=<service_role key>
 *
 *   node tools/upload-art.mjs <art folder>            # upload new/changed pictures + art-manifest.json
 *   node tools/upload-art.mjs <art folder> --check    # compare local vs bucket, upload nothing (no key needed)
 *
 * <art folder> is the picture library's art/ folder: art/<course>/<topic>/<set>/<file>.webp.
 * Objects go to <topic>/<set>/<file>.webp (no course level, matching MB_ART.resolve), and the
 * manifest is rebuilt with tools/build-manifest.py pointing at the bucket, then uploaded last, so the
 * app never lists a picture that is not there yet.
 *
 * The bucket name and URL come from ART_BASE in config.js. If the bucket does not exist it is created
 * PUBLIC (read-only for everyone, write only with the service key). The key is read from the
 * environment and never written anywhere. Same rules as viz-training/tools/upload-meshes.mjs:
 * x-upsert so changed files really overwrite, size compare so a re-run resumes, stop on 401/403.
 * Node 18+. No dependencies (python3 needed for the manifest).
 */
import { readFileSync, readdirSync, statSync, existsSync, mkdtempSync } from 'node:fs';
import { join, dirname, relative, sep } from 'node:path';
import { fileURLToPath } from 'node:url';
import { execFileSync } from 'node:child_process';
import { tmpdir } from 'node:os';

const REPO = join(dirname(fileURLToPath(import.meta.url)), '..');
const argv = process.argv.slice(2);
const CHECK = argv.includes('--check');
const DIR = argv.find(a => !a.startsWith('--'));
if (!DIR || !existsSync(DIR)) { console.error('usage: node tools/upload-art.mjs <art folder> [--check]'); process.exit(2); }

const KEY = (process.env.SUPABASE_SERVICE_KEY || '').trim().replace(/^["']|["']$/g, '').trim();
if (!CHECK) {
  const segs = KEY.split('.');
  if (!KEY || segs.length !== 3 || !segs.every(x => /^[A-Za-z0-9_-]+$/.test(x))) {
    console.error('\nSUPABASE_SERVICE_KEY is missing or does not look like a service_role key (eyJ… with 2 dots).');
    console.error('Supabase dashboard > Project Settings > API > service_role. Set it in THIS terminal window:');
    console.error('  PowerShell:  $env:SUPABASE_SERVICE_KEY="eyJ..."   cmd:  set SUPABASE_SERVICE_KEY=eyJ...\n');
    process.exit(2);
  }
}

const cfg = readFileSync(join(REPO, 'config.js'), 'utf8');
const m = cfg.match(/^\s*ART_BASE\s*:\s*"([^"]+)"/m);
if (!m) { console.error('ART_BASE is not set in config.js'); process.exit(1); }
const ART_BASE = m[1].replace(/\/+$/, '') + '/';
const parts = ART_BASE.match(/^(https:\/\/[^/]+)\/storage\/v1\/object\/public\/([^/]+)\/$/);
if (!parts) { console.error('ART_BASE is not a Supabase public bucket URL: ' + ART_BASE); process.exit(1); }
const [, ORIGIN, BUCKET] = parts;

/* art/<course>/<topic>/<set>/<file>.webp  ->  <topic>/<set>/<file>.webp */
function walk(d) { return readdirSync(d).flatMap(n => { const p = join(d, n); return statSync(p).isDirectory() ? walk(p) : [p]; }); }
const files = walk(DIR).filter(p => p.toLowerCase().endsWith('.webp')).map(p => {
  const r = relative(DIR, p).split(sep);
  return r.length === 4 ? { path: p, name: r.slice(1).join('/') } : null;
}).filter(Boolean).sort((a, b) => a.name.localeCompare(b.name));
if (!files.length) { console.error('no art/<course>/<topic>/<set>/*.webp files under ' + DIR); process.exit(2); }

const tmp = mkdtempSync(join(tmpdir(), 'mbart-'));
const manifestPath = join(tmp, 'art-manifest.json');
execFileSync('python3', [join(REPO, 'tools', 'build-manifest.py'), DIR, manifestPath, '--base-url', ART_BASE], { stdio: 'inherit' });

console.log(`\n${files.length} picture(s) in ${DIR}\nbucket: ${BUCKET} at ${ORIGIN}\n`);
const sleep = ms => new Promise(r => setTimeout(r, ms));
async function net(fn) {
  for (let i = 0; ; i++) {
    try { return await fn(); }
    catch (e) { if (i >= 4 || !/EAI_AGAIN|ENOTFOUND|ECONNRESET|ETIMEDOUT|fetch failed|terminated/i.test(String(e && (e.cause && e.cause.code || e.message)))) throw e; await sleep(1000 * 2 ** i); }
  }
}
const auth = { 'Authorization': 'Bearer ' + KEY, 'apikey': KEY };
async function why(r) { let s = r.status + ' ' + r.statusText; try { const j = await r.json(); s += ' — ' + (j.message || j.error || ''); } catch (_) {} return s; }

if (!CHECK) {
  const r = await net(() => fetch(`${ORIGIN}/storage/v1/bucket/${BUCKET}`, { headers: auth }));
  if (r.status === 401 || r.status === 403) { console.error('The server refused the key: ' + await why(r)); process.exit(1); }
  if (!r.ok) {
    const c = await net(() => fetch(`${ORIGIN}/storage/v1/bucket`, { method: 'POST', headers: { ...auth, 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: BUCKET, name: BUCKET, public: true, allowed_mime_types: ['image/webp', 'application/json'] }) }));
    if (!c.ok) { console.error('could not create bucket: ' + await why(c)); process.exit(1); }
    console.log(`created public bucket ${BUCKET}\n`);
  }
}

async function remoteSize(name) {
  const r = await net(() => fetch(`${ART_BASE}${name}?cb=${Date.now()}`, { method: 'HEAD', cache: 'no-store' }));
  if (!r.ok) return null; const n = Number(r.headers.get('content-length')); return Number.isFinite(n) ? n : null;
}
async function put(name, buf, type) {
  const r = await net(() => fetch(`${ORIGIN}/storage/v1/object/${BUCKET}/${name}`, { method: 'POST',
    headers: { ...auth, 'Content-Type': type, 'x-upsert': 'true', 'cache-control': '3600' }, body: buf }));
  return r.ok ? null : await why(r);
}

let sent = 0, same = 0, failed = 0;
for (const f of [...files, { path: manifestPath, name: 'art-manifest.json', json: true }]) {
  const local = statSync(f.path).size, remote = await remoteSize(f.name);
  if (remote === local && !f.json) { same++; continue; }
  if (CHECK) { console.log(`  DIFFERS ${f.name}  local ${local}  remote ${remote === null ? 'missing' : remote}`); continue; }
  if (f.json && failed) { console.log('  skipped art-manifest.json because some pictures failed; re-run to finish'); break; }
  const err = await put(f.name, readFileSync(f.path), f.json ? 'application/json' : 'image/webp');
  if (err) {
    failed++; console.log(`  FAIL ${f.name}  ${err}`);
    if (/^40[013]/.test(err)) { console.log('\nThe server is refusing the key, so stopping.'); process.exit(1); }
    continue;
  }
  const back = await remoteSize(f.name);
  if (back !== local) { failed++; console.log(`  FAIL ${f.name}  uploaded but bucket reports ${back} bytes, expected ${local}`); continue; }
  sent++; console.log(`  sent ${f.name}`);
}
console.log(`\n${sent} sent, ${same} already there, ${failed} failed.`);
process.exit(failed ? 1 : 0);
