#!/usr/bin/env node
/* MedBank · viz-training/tools/upload-meshes.mjs
 *
 * Put the decimated meshes in the bucket — and prove they arrived.
 *
 * Dragging the folder onto the Supabase dashboard looked like it worked and did not. New files were
 * created; files that already existed were left exactly as they were, with no error and no warning.
 * On 2026-08-26 that meant sixteen new discs uploaded fine while sixty re-decimated meshes stayed at
 * their old sizes — the corpus was complete, every URL returned 200, and the payload was still the
 * big one. A silent skip is the worst kind of failure: everything says success.
 *
 * The storage API overwrites only when asked, via the `x-upsert` header. This asks.
 *
 *   set SUPABASE_SERVICE_KEY=<the service role key>          (Windows cmd)
 *   $env:SUPABASE_SERVICE_KEY="<the service role key>"       (PowerShell)
 *   export SUPABASE_SERVICE_KEY=...                          (bash)
 *
 *   node viz-training/tools/upload-meshes.mjs                # upload viz-training/meshes-lite
 *   node viz-training/tools/upload-meshes.mjs --check        # compare local vs remote, upload nothing
 *   node viz-training/tools/upload-meshes.mjs --force        # re-send even files that already match
 *
 * The key is read from the environment and never written anywhere. Do not paste it into a file, and
 * do not pass it as an argument — arguments end up in shell history.
 *
 * The bucket URL is read from config.js, so there is one place that says where meshes live and this
 * cannot drift from what the app actually fetches.
 *
 * Node 18+ (needs global fetch). No dependencies.
 */
import { readFileSync, readdirSync, statSync, existsSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const HERE = dirname(fileURLToPath(import.meta.url));
const ROOT = join(HERE, '..');
const REPO = join(ROOT, '..');
const argv = process.argv.slice(2);
const CHECK = argv.includes('--check');
const FORCE = argv.includes('--force');
const DIR = argv.find(a => !a.startsWith('--')) || join(ROOT, 'meshes-lite');

/* Strip what a shell leaves behind. `set KEY="eyJ..."` in cmd keeps the quotes IN the value, and a
   copy-paste from a web page often carries a trailing newline or a stray space. Either one turns a
   perfectly good key into a string the API rejects, and the error it gives back — "Invalid Compact
   JWS" — says nothing about quotes. */
const KEY = (process.env.SUPABASE_SERVICE_KEY || process.env.SUPABASE_KEY || '')
  .trim().replace(/^["']|["']$/g, '').trim();

/* A JWT is three base64url segments separated by dots. Check the SHAPE before sending 142 files at a
   server that will refuse every one of them. The first version of this did not, and a mistyped key
   produced 142 identical failures over several minutes — the error was on line one and you had to
   read to the end to be sure it was on every line. */
if (KEY && !CHECK) {
  const segs = KEY.split('.');
  const shape = /^[A-Za-z0-9_-]+$/;
  const bad = segs.length !== 3 || !segs.every(x => x && shape.test(x));
  if (bad) {
    console.error('\nSUPABASE_SERVICE_KEY does not look like a JWT.\n');
    console.error(`  length: ${KEY.length} characters`);
    console.error(`  dot-separated segments: ${segs.length} (a JWT has exactly 3)`);
    if (/\s/.test(KEY)) console.error('  contains whitespace — the value was probably split or wrapped');
    if (/^["']|["']$/.test(process.env.SUPABASE_SERVICE_KEY || '')) console.error('  starts or ends with a quote');
    console.error(`  starts with: ${KEY.slice(0, 12)}…   ends with: …${KEY.slice(-8)}`);
    console.error('\nA service_role key starts "eyJ" and is several hundred characters long. In cmd use');
    console.error('  set SUPABASE_SERVICE_KEY=eyJ...        (no quotes, no spaces around the =)');
    console.error('and set it in the SAME window you run node in — cmd and PowerShell do not share it.\n');
    process.exit(2);
  }
}
if (!KEY && !CHECK) {
  console.error('\nSUPABASE_SERVICE_KEY is not set.\n');
  console.error('  Windows cmd:  set SUPABASE_SERVICE_KEY=eyJ...');
  console.error('  PowerShell:   $env:SUPABASE_SERVICE_KEY="eyJ..."');
  console.error('  bash:         export SUPABASE_SERVICE_KEY=eyJ...\n');
  console.error('Then re-run. The key is used from the environment and never written to disk.\n');
  process.exit(2);
}

/* ---- where the meshes live, according to the app itself ---- */
const cfgPath = [join(REPO, 'config.js'), join(ROOT, 'config.js')].find(existsSync);
if (!cfgPath) { console.error('cannot find config.js next to viz-training/ — run this from inside the repo'); process.exit(2); }
const cfg = readFileSync(cfgPath, 'utf8');
const m = cfg.match(/^\s*MESH_BASE\s*:\s*"([^"]+)"/m);
if (!m) { console.error('could not read MESH_BASE from config.js — has it been renamed?'); process.exit(1); }
const MESH_BASE = m[1].replace(/\/+$/, '') + '/';
const parts = MESH_BASE.match(/^(https:\/\/[^/]+)\/storage\/v1\/object\/public\/([^/]+)\//);
if (!parts) { console.error(`MESH_BASE does not look like a Supabase public object URL:\n  ${MESH_BASE}`); process.exit(1); }
const [, ORIGIN, BUCKET] = parts;

if (!existsSync(DIR)) { console.error(`no such directory: ${DIR}`); process.exit(2); }
const files = readdirSync(DIR).filter(f => f.toLowerCase().endsWith('.stl')).sort();
if (!files.length) { console.error(`no .stl files in ${DIR}`); process.exit(2); }

console.log(`\n${files.length} mesh(es) in ${DIR}`);
console.log(`bucket: ${BUCKET} at ${ORIGIN}\n`);

/* ---- what is already there? ---- */
/* A three-hundred-file upload runs for minutes over a domestic connection, and on 2026-08-28 one of
   those minutes contained a DNS hiccup:

     [TypeError: fetch failed] { [cause]: Error: getaddrinfo EAI_AGAIN tytbrhuzikqkscxdnkmr.supabase.co }

   Node's fetch throws rather than returning a response, nothing here caught it, and the whole run died
   at file 104 of 250 with an uncaught exception and a stack trace. Nothing was lost — the size compare
   makes a re-run resume — but a transient name-lookup failure should never end a job that was working.

   So: network faults are retried with a widening pause, and everything else is left alone. A 401 is not
   a hiccup and must not be retried; neither is a 404. Only the errors that mean "the wire twitched". */
const sleep = ms => new Promise(r => setTimeout(r, ms));
const TRANSIENT = /EAI_AGAIN|ENOTFOUND|ECONNRESET|ECONNREFUSED|ETIMEDOUT|EPIPE|ENETUNREACH|socket hang up|terminated|fetch failed/i;
const reason = e => [e && e.message, e && e.cause && e.cause.code, e && e.cause && e.cause.message]
  .filter(Boolean).join(' ');

async function net(fn, what) {
  let last;
  for (let attempt = 0; attempt < 5; attempt++) {
    try { return await fn(); }
    catch (e) {
      last = e;
      if (!TRANSIENT.test(reason(e))) throw e;
      const wait = Math.min(30000, 1000 * 2 ** attempt);
      console.log(`          ${what}: ${(e.cause && e.cause.code) || e.message} — waiting ${wait / 1000}s, then retrying`);
      await sleep(wait);
    }
  }
  throw last;
}

async function remoteSize(name) {
  const r = await net(() => fetch(`${MESH_BASE}${name}?cb=${Date.now()}`, { method: 'HEAD', cache: 'no-store' }),
                      `HEAD ${name}`);
  if (!r.ok) return null;                   // a genuine 404: the object is not there
  const n = Number(r.headers.get('content-length'));
  return Number.isFinite(n) ? n : null;
}

async function put(name, buf) {
  const r = await net(() => fetch(`${ORIGIN}/storage/v1/object/${BUCKET}/${name}`, {
    method: 'POST',
    headers: {
      'Authorization': 'Bearer ' + KEY,
      'Content-Type': 'application/octet-stream',
      'x-upsert': 'true'                    // the whole point: overwrite what is already there
    },
    body: buf
  }), `PUT ${name}`);
  if (r.ok) return null;
  let why = r.status + ' ' + r.statusText;
  try { const j = await r.json(); if (j && (j.message || j.error)) why += ' — ' + (j.message || j.error); } catch (e) {}
  return why;
}

let sent = 0, same = 0, failed = 0, bytes = 0;
const wrong = [];

for (const f of files) {
  const local = statSync(join(DIR, f)).size;
  const label = f.padEnd(16) + String(local).padStart(8) + ' bytes';

  /* Even after the retries, one file that will not go should be one line of output and a non-zero
     exit — not a stack trace that hides the hundred files that went fine above it. */
  let remote;
  try { remote = await remoteSize(f); }
  catch (e) {
    failed++;
    console.log(`  FAIL    ${label}  could not reach the bucket — ${reason(e)}`);
    continue;
  }

  if (remote === local && !FORCE) { same++; console.log(`  same    ${label}`); continue; }
  if (CHECK) {
    wrong.push({ f, local, remote });
    console.log(`  DIFFERS ${label}  remote ${remote === null ? 'missing' : remote + ' bytes'}`);
    continue;
  }
  let err;
  try { err = await put(f, readFileSync(join(DIR, f))); }
  catch (e) { err = 'could not reach the bucket — ' + reason(e); }
  if (err) {
    failed++; console.log(`  FAIL    ${label}  ${err}`);
    /* An auth or permission refusal is about the CREDENTIAL, not this file. Trying the next 141 files
       will fail the same way and bury the one line that matters under a screen of noise. Stop. */
    if (/^40[013]/.test(err)) {
      console.log('\nThat is the server refusing the key, not the file. Every remaining upload would fail');
      console.log('the same way, so stopping here. Check SUPABASE_SERVICE_KEY is the service_role key,');
      console.log('pasted whole, with no quotes, in this same terminal window.\n');
      process.exit(1);
    }
    continue;
  }

  /* Verify, do not assume. A 200 from the API is not the same as the object being served. */
  let after;
  try { after = await remoteSize(f); } catch (e) { after = -1; }
  if (after !== local) {
    failed++;
    const served = after === null ? 'nothing' : after < 0 ? 'an answer we could not read' : after + ' bytes';
    console.log(`  FAIL    ${label}  uploaded but the bucket serves ${served}`);
    continue;
  }
  sent++; bytes += local;
  console.log(`  sent    ${label}  ${remote === null ? '(new)' : 'replacing ' + remote + ' bytes'}`);
}

console.log('');
if (CHECK) {
  console.log(`${same} already match, ${wrong.length} differ or are missing.`);
  if (wrong.length) console.log(`Run without --check to upload them.`);
  process.exit(wrong.length ? 1 : 0);
}
console.log(`${sent} uploaded (${(bytes / 1048576).toFixed(1)} MB), ${same} already current, ${failed} failed.`);
if (failed) {
  console.log('\nRe-running this command resumes: files that already match are skipped, so nothing');
  console.log('is re-sent and only the failures are retried. The key is still set in this window.');
  console.log('\nA failure here means the app will fetch an old mesh, or none. Fix it before pushing —');
  console.log('the scene JSON and the bucket have to agree or the student gets a hole in the picture.');
  process.exit(1);
}
