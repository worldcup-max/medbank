#!/usr/bin/env node
/* MedBank · viz-training · queue-set
 *
 * The ONE way BUILD-QUEUE.json is written. Both scheduled tasks call this; neither edits the file.
 *
 * WHY THIS EXISTS. The build task fires hourly and the review task fires when a build finishes, so
 * two runs can be alive at the same time — and both were doing read-modify-write on the same JSON.
 * Whichever wrote second silently erased the other's changes. Nobody would ever see it happen: the
 * file stays valid JSON, the run reports success, and a review's findings simply vanish. That is the
 * same shape as the failure that cost a whole morning — a task that succeeds and changes nothing —
 * and it is the reason this file is a tool rather than an instruction telling each run to be careful.
 *
 * RELEASING BY RENAME, NOT DELETE. The tasks reach this repo through a mount that FORBIDS deletion —
 * `rm` returns "Operation not permitted" — so the first version of this tool, which released its lock
 * with unlink(), would have left a stuck lock after every single write and jammed the queue for good.
 * It passed its concurrency test because that test ran in a container where delete works. Renaming the
 * lock aside is permitted, and needs no cleanup: the released and broken names are fixed, so they are
 * overwritten rather than accumulated. THE LESSON, worth more than the fix: test on the substrate the
 * thing will actually run on, not on one that merely resembles it.
 *
 * HOW. An exclusive lock file (O_EXCL, which is atomic on every filesystem we care about), then
 * re-read, mutate, write to a temp file, rename over the original. The re-read INSIDE the lock is the
 * whole point: a run that read the queue ten minutes ago writes against what is on disk now, not
 * against its stale copy.
 *
 * USAGE
 *   node tools/queue-set.mjs <item-id> --status built
 *   node tools/queue-set.mjs <item-id> --set built_at=2026-09-10T09:45:00Z --set built_by="the build task"
 *   node tools/queue-set.mjs <item-id> --append findings="View 9 shows the L-loop mirrored the wrong way"
 *   node tools/queue-set.mjs <item-id> --bump review_rounds
 *   node tools/queue-set.mjs --show <item-id>
 *   node tools/queue-set.mjs --next            # what a build run should take, honouring rework-first
 *
 * Every write is echoed back so a run can put in its log what it actually changed, rather than what
 * it intended to change.
 */

import { readFileSync, writeFileSync, renameSync, openSync, closeSync, statSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const HERE = dirname(fileURLToPath(import.meta.url));
const QUEUE = join(HERE, '..', 'BUILD-QUEUE.json');
const LOCK = QUEUE + '.lock';

const STALE_MS = 5 * 60 * 1000;   // a run that died holding the lock must not block the queue for ever
const WAIT_MS = 30 * 1000;
const POLL_MS = 400;

const sleep = ms => new Promise(r => setTimeout(r, ms));

async function withLock(fn) {
  const started = Date.now();
  for (;;) {
    try {
      const fd = openSync(LOCK, 'wx');
      writeSafe(fd);
      try { return fn(); } finally { try { renameSync(LOCK, LOCK + '.released'); } catch {} }
    } catch (e) {
      if (e.code !== 'EEXIST') throw e;
      /* Someone holds it. If their lock is older than STALE_MS their run is gone — break it and say
         so loudly, because a broken lock means a run died mid-write and the queue may be half-updated. */
      try {
        const age = Date.now() - statSync(LOCK).mtimeMs;
        if (age > STALE_MS) {
          console.error(`queue-set: breaking a stale lock, ${Math.round(age / 1000)}s old — a run died holding it. CHECK THE QUEUE.`);
          renameSync(LOCK, LOCK + '.broken');
          continue;
        }
      } catch {}
      if (Date.now() - started > WAIT_MS) {
        console.error('queue-set: another run has held the queue lock for 30s. Nothing was written. Try again, or check for a run that hung.');
        process.exit(3);
      }
      await sleep(POLL_MS);
    }
  }
  function writeSafe(fd) { try { writeSafe.w = String(process.pid); } finally { closeSync(fd); } }
}

function load() { return JSON.parse(readFileSync(QUEUE, 'utf8')); }
function save(d) {
  const tmp = QUEUE + '.tmp';
  writeFileSync(tmp, JSON.stringify(d, null, 2) + '\n');
  renameSync(tmp, QUEUE);          // rename is atomic: no reader ever sees a half-written queue
}
function find(d, id) {
  const exact = d.items.find(i => i.id === id);
  if (exact) return exact;
  const partial = d.items.filter(i => i.id.includes(id));
  if (partial.length === 1) return partial[0];
  if (partial.length > 1) {
    console.error('queue-set: "' + id + '" matches ' + partial.length + ' items:\n  ' + partial.map(i => i.id).join('\n  '));
    process.exit(2);
  }
  return null;
}

const argv = process.argv.slice(2);
if (!argv.length) { console.error('queue-set: nothing to do. See the header of this file for usage.'); process.exit(2); }

if (argv[0] === '--next') {
  const d = load();
  const rework = d.items.find(i => i.status === 'changes-requested');
  const todo = d.items.find(i => i.status === 'todo');
  const pick = rework || todo;
  console.log(JSON.stringify({
    take: pick ? pick.id : null,
    because: rework ? 'rework beats new work' : (todo ? 'first todo' : 'queue is empty — that is a complete run, do not invent work'),
    status: pick ? pick.status : null,
    findings: pick && pick.findings ? pick.findings : undefined,
    counts: d.items.reduce((a, i) => (a[i.status] = (a[i.status] || 0) + 1, a), {})
  }, null, 2));
  process.exit(0);
}
if (argv[0] === '--show') {
  const it = find(load(), argv[1]);
  if (!it) { console.error('queue-set: no item matching ' + argv[1]); process.exit(2); }
  console.log(JSON.stringify(it, null, 2));
  process.exit(0);
}

const id = argv[0];
const ops = [];
for (let i = 1; i < argv.length; i++) {
  const a = argv[i];
  const kv = (s) => { const j = s.indexOf('='); return j < 0 ? [s, ''] : [s.slice(0, j), s.slice(j + 1)]; };
  if (a === '--status') ops.push(['set', 'status', argv[++i]]);
  else if (a === '--set') ops.push(['set', ...kv(argv[++i])]);
  else if (a === '--append') ops.push(['append', ...kv(argv[++i])]);
  else if (a === '--json') { const [k, v] = kv(argv[++i]); ops.push(['set', k, JSON.parse(v)]); }
  else if (a === '--bump') ops.push(['bump', argv[++i], 1]);
  else { console.error('queue-set: unknown argument ' + a); process.exit(2); }
}
if (!ops.length) { console.error('queue-set: no changes given for ' + id); process.exit(2); }

const changed = await withLock(() => {
  const d = load();                       // re-read INSIDE the lock — this is the whole point
  const it = find(d, id);
  if (!it) { console.error('queue-set: no item matching ' + id); process.exit(2); }
  const before = {}, after = {};
  for (const [op, key, val] of ops) {
    before[key] = it[key];
    if (op === 'set') it[key] = val;
    else if (op === 'append') { if (!Array.isArray(it[key])) it[key] = it[key] == null ? [] : [it[key]]; it[key].push(val); }
    else if (op === 'bump') it[key] = (Number(it[key]) || 0) + val;
    after[key] = it[key];
  }
  it.updated_at = new Date().toISOString().replace(/\.\d+Z$/, 'Z');
  save(d);
  return { id: it.id, before, after };
});

console.log(JSON.stringify(changed, null, 2));
