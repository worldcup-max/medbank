#!/usr/bin/env node
/* MedBank · viz-training/tools/test-narration-pacing.mjs
 *
 * The voice must finish its sentence before the picture moves on.
 *
 * Play advanced every 7000 ms and a trace every 1600 ms, no matter what the line said. Both numbers
 * were guesses at reading speed and both were wrong: every narration was cut off mid-word, and the
 * only one a student ever heard to the end was the last, because nothing came after it to interrupt.
 *
 * The fix hands the clock to the voice — `sayThen(text, done, floorMs)` calls `done` when the app
 * reports the sound has stopped. That creates a new way to fail that a stopwatch never had: if the
 * callback never arrives, the sequence stops dead on step one and the student is left staring at a
 * frozen caption. So the estimate is not a nicety, it is the thing that keeps a broken voice from
 * taking the whole player down with it.
 *
 * This lifts the real `sayThen`, `say` and `readMs` out of viz3d.js and checks both halves:
 *
 *   · a long line is waited for — the advance does NOT fire at the old fixed interval
 *   · `floorMs` still holds a short line on screen long enough for the camera to arrive
 *   · a speaker that never calls back does NOT stall the sequence
 *   · a speaker that throws does not stall it either
 *   · `say(null)` cancels a pending advance, so leaving a view does not get a beat from the last one
 *   · a superseded line never fires its callback — two traces cannot interleave
 *
 *   node viz-training/tools/test-narration-pacing.mjs
 *
 * Node 18+. No dependencies.
 */
import { readFileSync, existsSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const HERE = dirname(fileURLToPath(import.meta.url));
const ROOT = join(HERE, '..');
const VIZ3D = [join(ROOT, '..', 'viz3d.js'), join(ROOT, 'viz3d.js')].find(existsSync);
if (!VIZ3D) { console.error('cannot find viz3d.js next to viz-training/'); process.exit(2); }
const src = readFileSync(VIZ3D, 'utf8');

/* ---- lift the shipped implementation, so this tests what ships ---- */
function grab(name) {
  const i = src.indexOf('function ' + name + '(');
  if (i < 0) throw new Error(`viz3d.js has no function ${name}() — has the narration clock been renamed?`);
  let d = 0, end = -1;
  for (let j = src.indexOf('{', i); j < src.length; j++) {
    if (src[j] === '{') d++;
    else if (src[j] === '}') { d--; if (!d) { end = j + 1; break; } }
  }
  return src.slice(i, end);
}
const decl = (src.match(/var SPEAK = null, sayTurn = 0, sayTimer = null, speaking = false;/) || [])[0];
if (!decl) { console.error('could not find the narration state declaration in viz3d.js'); process.exit(1); }

const body = [decl, grab('speaker'), grab('nowMs'), grab('readMs'), grab('sayThen'), grab('say')].join('\n');
const api = new Function('window', `${body}; return { speaker, sayThen, say, readMs, isSpeaking: function(){ return speaking; } };`)({ performance });

const checks = [];
const ok = (name, pass, detail) => checks.push([name, pass, detail]);
const sleep = ms => new Promise(r => setTimeout(r, ms));

const LONG = 'The annulus fibrosus is the outer ring of concentric fibrocartilage, and it is strongest in front and weakest posterolaterally.';

/* 1 — a long line is waited for, not cut off at a fixed interval */
{
  let fired = null, release = null;
  api.speaker((text, done) => { release = done; });
  const t0 = Date.now();
  api.sayThen(LONG, () => { fired = Date.now() - t0; }, 0);
  await sleep(300);
  const earlyFire = fired;
  release();                                   // the voice finishes at 300 ms, not at 7000
  await sleep(60);
  ok('waits for the voice, does not fire early', earlyFire === null && fired !== null,
    earlyFire === null ? `nothing at 300 ms while speaking; fired ${fired} ms after the voice ended` : `fired at ${earlyFire} ms while still speaking`);
}

/* 2 — floorMs holds a short line long enough for the camera to land */
{
  let fired = null;
  api.speaker((text, done) => setTimeout(done, 20));
  const t0 = Date.now();
  api.sayThen('L4.', () => { fired = Date.now() - t0; }, 600);
  await sleep(900);
  ok('a short line still respects the floor', fired !== null && fired >= 580,
    fired === null ? 'never fired' : `voice ended at ~20 ms, advance held to ${fired} ms (floor 600)`);
}

/* 3 — a speaker that never calls back must not stall the sequence */
{
  let fired = null;
  api.speaker(() => { /* starts talking and never reports back */ });
  const t0 = Date.now();
  api.sayThen('two words', () => { fired = Date.now() - t0; }, 0);
  const est = api.readMs('two words');
  await sleep(est + 8000 + 400);
  ok('a silent callback does not freeze the player', fired !== null,
    fired === null ? 'NEVER fired — the sequence would sit on step one for ever' : `fell back to the read-time estimate and fired at ${fired} ms`);
}

/* 4 — a speaker that throws must not stall it either */
{
  let fired = null;
  api.speaker(() => { throw new Error('TTS unavailable'); });
  const t0 = Date.now();
  api.sayThen('short', () => { fired = Date.now() - t0; }, 0);
  await sleep(api.readMs('short') + 400);
  ok('a throwing speaker does not freeze the player', fired !== null,
    fired === null ? 'NEVER fired' : `fired at ${fired} ms despite the speaker throwing`);
}

/* 5 — say(null) cancels a pending advance */
{
  let fired = false;
  let release = null;
  api.speaker((text, done) => { release = done; });
  api.sayThen(LONG, () => { fired = true; }, 0);
  api.say(null);                               // the student leaves the view
  if (release) release();                      // a late callback from the abandoned line
  await sleep(200);
  ok('leaving a view cancels its pending advance', fired === false,
    fired ? 'the abandoned line still advanced the sequence' : 'the late callback was ignored');
}

/* 6 — a superseded line never fires; two traces cannot interleave */
{
  const order = [];
  const releases = [];
  api.speaker((text, done) => { releases.push(done); });
  api.sayThen('first', () => order.push('first'), 0);
  api.sayThen('second', () => order.push('second'), 0);
  releases.forEach(r => r());                  // both voices report back
  await sleep(200);
  ok('only the current line advances', order.length === 1 && order[0] === 'second',
    order.length === 1 ? 'the superseded line stayed silent' : `both fired: ${order.join(', ')}`);
}

/* 7 — the estimate must be in the right region: a 20-word sentence is several seconds, not 200 ms */
{
  const ms = api.readMs(LONG);
  ok('the read-time estimate is plausible', ms > 4000 && ms < 15000, `${(ms / 1000).toFixed(1)} s for a ${LONG.split(/\s+/).length}-word sentence`);
}

let bad = 0;
const pad = Math.max(...checks.map(c => c[0].length));
for (const [name, pass, detail] of checks) {
  if (!pass) bad++;
  console.log(`${pass ? '  ok  ' : '  FAIL'}  ${name.padEnd(pad)}  ${detail || ''}`);
}
console.log(`\n${checks.length - bad}/${checks.length} expectations met.`);
if (bad) {
  console.log('\nEither the voice is being talked over again, or the player can be left waiting for a');
  console.log('callback that never comes. The second is worse: it looks like the app has hung.');
}
process.exit(bad ? 1 : 0);
