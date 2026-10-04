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
 *   node tools/queue-set.mjs --new '<json object>'   # file a NEW item (see --new below)
 *
 * Every write is echoed back so a run can put in its log what it actually changed, rather than what
 * it intended to change.
 */

import { readFileSync, writeFileSync, renameSync, openSync, closeSync, statSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const HERE = dirname(fileURLToPath(import.meta.url));

/* --queue <path>: operate on a queue file somewhere other than beside this script.
 *
 * WHY. A Windows update on 2026-09-08 stopped Claude's workspace from reaching Frank's files, so the
 * scheduled tasks lost their shell on the machine holding the repo and all three auto-suspended with
 * `device_absent`. The review task died first, on the evening of the 10th, and the build task carried
 * on for another eight and a half hours producing work nothing consumed — eleven items reached `built`
 * with nine of them never reviewed.
 *
 * The tasks still have FILE access to that machine, and their own cloud container has node. So a run
 * now stages the queue into its container, runs this tool there, and commits the result back. That
 * needs one thing from this file: the ability to point it at the staged copy.
 *
 * THE LOCK BELOW IS NOT WHAT MAKES THAT SAFE — see the note above withLock(). Two runs editing two
 * separate staged copies would both take their own uncontended lock and the second commit would erase
 * the first. What makes it safe is `expectedMtimeMs` on device_commit_files: the write is refused if
 * the file changed since it was staged. That is a compare-and-swap, which is what the lock was
 * standing in for all along. The prompts spell out the retry. */
const QUEUE = (() => {
  const i = process.argv.indexOf('--queue');
  return i >= 0 && process.argv[i + 1] ? process.argv[i + 1] : join(HERE, '..', 'BUILD-QUEUE.json');
})();
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

/* --queue and its value are consumed above; drop them before anything else reads the arguments, or
   the mutation parser meets an option it does not know and exits 2. */
const argv = process.argv.slice(2).filter((a, i, all) => a !== '--queue' && all[i - 1] !== '--queue');
if (!argv.length) { console.error('queue-set: nothing to do. See the header of this file for usage.'); process.exit(2); }

/* STALE CLAIMS COME FIRST — added 2026-09-29, and the reason is worth more than the code.
 *
 * BUILD-TASK-PROMPT.md §1 has said for weeks: "If you find an item already `building` with a
 * `claimed_at` older than two hours, that run died; reclaim it." The rule was right. It was also
 * UNREACHABLE, because the same section tells a run to use `--next` to decide what to take, and
 * `--next` only ever looked at `changes-requested` and `todo`. A `building` item is in neither
 * bucket, so no run ever "found" one, and the condition the rule hangs on never became true.
 *
 * On 2026-09-29 four items were sitting `building` — 8, 7, 6 and 6 days old — while every run
 * stepped straight past them to fresh work and reported a good day. Zero items `built`, four
 * `building`, and a reviewer with nothing to do: a chain that looks busy and produces nothing.
 *
 * THE LESSON, which is the third sighting of this shape in this project: a rule conditioned on
 * noticing something is only as good as whatever makes you look. Prose cannot fix that; the thing
 * that chooses what a run sees has to surface it. So `--next` now hands a stale claim over FIRST,
 * with its age and the status to restore, and the rule in the prompt finally has something to fire on.
 *
 * `in-review` is here for the same reason: it was orphaned the same way on 2026-09-21, and every
 * review run looks for `built`, so nothing would ever have picked it up again either. */
const STALE_CLAIM_MS = 2 * 60 * 60 * 1000;

function staleClaim(d) {
  const now = Date.now();
  const held = d.items.filter(i => i.status === 'building' || i.status === 'in-review');
  const aged = held.map(i => {
    const t = Date.parse(i.claimed_at || i.updated_at || '');
    return { item: i, ms: isFinite(t) ? now - t : Infinity };
  }).filter(x => x.ms > STALE_CLAIM_MS);
  aged.sort((a, b) => b.ms - a.ms);           // oldest first — it has waited longest
  return aged[0] || null;
}

/* What a reclaimed item goes back to. An item that has been reviewed and has open findings was
 * `changes-requested` when it was claimed; one that had been built but not yet reviewed was `built`;
 * anything else never got that far and returns to `todo`. Never guess past that: the point of a
 * reclaim is to put the item back where it was, not to advance it.
 *
 * CORRECTED 2026-09-29T22:4xZ by the build run that got burned by it, and the bug mattered more than
 * its size. The old body tested `findings.length || review_rounds` FIRST and so returned
 * `changes-requested` for any item that had ever been reviewed — including one that had since been
 * REBUILT against those findings. findings[] is not cleared when a build answers it (deliberately:
 * the next review needs to see what it is checking), so it is not evidence about the CURRENT state.
 *
 * What happened: cardiac-cycle-pumping was built by its round-4 run at 16:11:04Z, six files
 * read-back verified. A review then claimed it — that is what sets `in-review` — and died WITHOUT
 * updating claimed_at, leaving the build's own 15:32:50Z in place and making the item read as 7.2h
 * stale. `--next` duly offered it as a stale claim with reclaim_to `changes-requested`, and the
 * 22:40Z build run claimed it and was one step from rebuilding an item finished six and a half hours
 * earlier, on top of round 4's verified output. The whole value of a reclaim is putting an item back
 * where it was; getting that backwards turns the safety feature into the thing that destroys work.
 *
 * THE DISCRIMINATOR IS built_at AGAINST reviewed_at, because those two are the actual events. Built
 * after its last review -> the build answered those findings and it is awaiting the NEXT review, so
 * `built`. Reviewed after its last build -> the findings are live, so `changes-requested`. */
function reclaimTo(i) {
  const built = Date.parse(i.built_at || '');
  const reviewed = Date.parse(i.reviewed_at || '');
  const everReviewed = (i.findings && i.findings.length) || i.review_rounds;
  if (Number.isFinite(built) && (!Number.isFinite(reviewed) || built > reviewed)) return 'built';
  if (everReviewed) return 'changes-requested';
  if (Number.isFinite(built)) return 'built';
  return 'todo';
}

if (argv[0] === '--next') {
  const d = load();
  const stale = staleClaim(d);
  if (stale) {
    const i = stale.item;
    console.log(JSON.stringify({
      take: i.id,
      because: 'STALE CLAIM — that run died. Reclaim it before anything else: restore the status below, keeping findings and review_rounds, log that you did it, then work it.',
      status: i.status,
      claimed_at: i.claimed_at || null,
      /* 3.6e6 ms in an hour. Was 3.6e5, which reported every age as TEN TIMES its real value —
         a 7.2h stale claim printed as "71.6". The SELECTION was never wrong (staleClaim compares raw
         ms against STALE_CLAIM_MS), only the number a run reads and then repeats in its log, which
         is how "stale for 71.6 hours" got written about a claim staked the same afternoon. */
      stale_for_hours: Math.round(stale.ms / 3.6e6 * 10) / 10,
      reclaim_to: reclaimTo(i),
      findings: i.findings || undefined,
      counts: d.items.reduce((a, x) => (a[x.status] = (a[x.status] || 0) + 1, a), {})
    }, null, 2));
    process.exit(0);
  }
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

/* --new '<json>' — FILE A NEW ITEM THROUGH THIS TOOL RATHER THAN BY HAND.
 *
 * WHY THIS EXISTS. Added 2026-10-02 by the round-5 build run on blastocyst, which had to escalate a
 * defect as an ENGINE item in its own right (engine__camera-scale-group) because the review round that
 * found it said in terms that the scene must not be cycled through further rounds waiting on it. There
 * was no way to do that: this tool could only mutate items that already existed, and the file's own
 * rule — NEVER EDIT BUILD-QUEUE.json BY HAND, because two hand-edits of the same JSON silently erase
 * one another — correctly forbade the obvious workaround. So a run that found work it was not allowed
 * to do could record it in prose and nothing would ever schedule it. A note in a file is a claim, not
 * a fact; a queue item is a fact.
 *
 * It goes through the same lock, the same re-read-inside-the-lock and the same atomic rename as every
 * other write here, so it is safe against a concurrent review in exactly the way a hand edit is not.
 *
 * REFUSALS, deliberately strict — this is the one op that can grow the file:
 *   · a duplicate id is refused outright. Re-filing the same escalation twice is how a desk for
 *     humans becomes noise, and --append on the existing item is the right move instead.
 *   · id, status and kind are required. An item with no status is invisible to --next and to the
 *     back-pressure count, which is worse than no item at all.
 *   · the item is APPENDED. Order in this file means "what a build run takes first", and nothing a run
 *     files for itself should jump ahead of work a human queued.
 */
if (argv[0] === '--new') {
  if (!argv[1]) { console.error('queue-set --new: give the item as one JSON object.'); process.exit(2); }
  let item;
  try { item = JSON.parse(argv[1]); }
  catch (e) { console.error('queue-set --new: that is not valid JSON — ' + e.message); process.exit(2); }
  for (const k of ['id', 'status', 'kind']) {
    if (!item[k] || typeof item[k] !== 'string') {
      console.error('queue-set --new: "' + k + '" is required and must be a string. Nothing was written.');
      process.exit(2);
    }
  }
  const filed = await withLock(() => {
    const d = load();
    if (d.items.some(i => i.id === item.id)) {
      console.error('queue-set --new: ' + item.id + ' is already in the queue (status ' +
        d.items.find(i => i.id === item.id).status + '). Use --append on it instead. Nothing was written.');
      process.exit(2);
    }
    item.updated_at = new Date().toISOString().replace(/\.\d+Z$/, 'Z');
    d.items.push(item);
    save(d);
    return { filed: item.id, status: item.status, kind: item.kind, items: d.items.length };
  });
  console.log(JSON.stringify(filed, null, 2));
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

/* NO TIMESTAMP IN THE FUTURE. Raised by the review task 2026-09-29: a run set built_at to
   13:40:00Z at 11:35Z — two hours after it fired, and after its own updated_at. The review selects
   the OLDEST built_at, so a future timestamp sorts that item to the BACK of the queue and a
   genuinely older item can be skipped for as long as the clock takes to catch up. Nothing in the
   file could have caught it, because a timestamp is just a string to --set.
   Refused rather than clamped: a wrong timestamp means the run that wrote it is confused about the
   time, and quietly correcting it hides that. SKEW is a minute, for clock drift between a cloud
   container and the machine holding the repo. */
const SKEW_MS = 60 * 1000;
for (const [op, key, val] of ops) {
  if (op !== 'set' || !/_at$/.test(key) || typeof val !== 'string') continue;
  const t = Date.parse(val);
  if (!Number.isFinite(t)) continue;                       // not a timestamp we recognise; leave it
  if (t > Date.now() + SKEW_MS) {
    console.error('queue-set: refusing ' + key + '=' + val + ' — that is in the future (now ' +
      new Date().toISOString().replace(/\.\d+Z$/, 'Z') + '). Nothing was written.');
    process.exit(2);
  }
}

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
