#!/usr/bin/env node
/* MedBank · viz-training/tools/test-label-layout.mjs
 *
 * A label must never be the thing hiding the bone it names.
 *
 * Labels used to be placed 16 px from their own dot and then pushed downwards until none overlapped.
 * That is fine for a scene whose parts are spread across the frame and useless for one that is mostly
 * vertical: on the vertebral column every dot has nearly the same x, so every label landed in one
 * leaning stack straight down the middle of the spine — "L4/5 disc" sitting on top of L4/5. The layout
 * had done exactly what it was told; what it was told was wrong.
 *
 * The fix puts labels in two gutters at the edges of the frame and joins each to its dot with a leader.
 * This checks the rules that make that readable, on the two arrangements that actually occur:
 *
 *   · nothing overlaps — every pair in a column is at least one label-height apart
 *   · nothing leaves the frame, top or bottom
 *   · a vertical structure gets its labels dealt alternately left and right, not piled in one column
 *   · a label stays near its dot's height, so the leader is short and the eye can follow it
 *   · more labels than the frame can hold are DROPPED, not crushed together
 *
 * It lifts planLabels() out of viz3d.js, so it tests what ships.
 *
 *   node viz-training/tools/test-label-layout.mjs
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

const i = src.indexOf('function planLabels(');
if (i < 0) { console.error('viz3d.js has no planLabels() — has the label layout been renamed?'); process.exit(1); }
let d = 0, end = -1;
for (let j = src.indexOf('{', i); j < src.length; j++) {
  if (src[j] === '{') d++;
  else if (src[j] === '}') { d--; if (!d) { end = j + 1; break; } }
}
const planLabels = new Function(`${src.slice(i, end)}; return planLabels;`)();

const W = 900, H = 520, LH = 24;
const checks = [];
const ok = (name, pass, detail) => checks.push([name, pass, detail]);

/* the real case: the vertebral column, seen head-on — every dot within a few px of the same x */
const spine = Array.from({ length: 12 }, (_, k) => ({ x: 450 + (k % 3) - 1, y: 90 + k * 26 }));
/* a scene spread across the frame: the arm */
const arm = [
  { x: 180, y: 120 }, { x: 240, y: 210 }, { x: 300, y: 300 },
  { x: 640, y: 150 }, { x: 700, y: 260 }, { x: 720, y: 380 }
];
/* far more labels than the frame can hold */
const crowd = Array.from({ length: 90 }, (_, k) => ({ x: 200 + (k * 37) % 500, y: 40 + (k * 13) % 460 }));

function byCol(plan) {
  const c = { L: [], R: [] };
  plan.forEach(q => c[q.side].push(q));
  Object.values(c).forEach(a => a.sort((x, y) => x.ly - y.ly));
  return c;
}

/* 1 — no two labels in a column overlap */
{
  let worst = Infinity, where = '';
  for (const [name, dots] of [['spine', spine], ['arm', arm], ['crowd', crowd]]) {
    const c = byCol(planLabels(dots, W, H, LH));
    for (const side of ['L', 'R']) {
      for (let k = 1; k < c[side].length; k++) {
        const gap = c[side][k].ly - c[side][k - 1].ly;
        if (gap < worst) { worst = gap; where = `${name} ${side}`; }
      }
    }
  }
  ok('no two labels in a column overlap', worst >= LH - 1e-9, `tightest gap ${worst.toFixed(1)} px (need ${LH}) at ${where}`);
}

/* 2 — nothing escapes the frame */
{
  let bad = 0, worst = '';
  for (const [name, dots] of [['spine', spine], ['arm', arm], ['crowd', crowd]]) {
    for (const q of planLabels(dots, W, H, LH)) {
      if (q.ly - LH / 2 < 0 || q.ly + LH / 2 > H) { bad++; worst = `${name} at y=${q.ly.toFixed(0)}`; }
    }
  }
  ok('every label stays inside the frame', bad === 0, bad ? `${bad} outside, e.g. ${worst}` : `top and bottom respected in all three layouts`);
}

/* 3 — the spine is dealt to both sides, not stacked in one */
{
  const c = byCol(planLabels(spine, W, H, LH));
  const lo = Math.min(c.L.length, c.R.length), hi = Math.max(c.L.length, c.R.length);
  ok('a vertical structure uses both gutters', lo > 0 && hi - lo <= 1, `left ${c.L.length}, right ${c.R.length} of ${spine.length}`);
}

/* 4 — a label sits near its dot, or the leader becomes a wire across the picture */
{
  let worst = 0, where = '';
  for (const [name, dots] of [['spine', spine], ['arm', arm]]) {
    for (const q of planLabels(dots, W, H, LH)) {
      const drop = Math.abs(q.ly - dots[q.i].y);
      if (drop > worst) { worst = drop; where = `${name} #${q.i}`; }
    }
  }
  ok('labels stay near their own dot', worst <= LH * 2, `furthest is ${worst.toFixed(0)} px at ${where} (allow ${LH * 2})`);
}

/* 5 — an impossible crowd is thinned, never crushed */
{
  const plan = planLabels(crowd, W, H, LH);
  const capacity = Math.max(1, Math.floor((H - 8) / LH)) * 2;
  ok('an overfull frame drops labels rather than piling them', plan.length < crowd.length && plan.length <= capacity,
    `${crowd.length} asked for, ${plan.length} placed, room for ${capacity}`);
}

/* 6 — the arm keeps its natural sides: a dot on the left does not get a label on the right */
{
  const plan = planLabels(arm, W, H, LH);
  const wrong = plan.filter(q => (arm[q.i].x < 400 && q.side === 'R') || (arm[q.i].x > 500 && q.side === 'L'));
  ok('a spread-out scene keeps labels on their own side', wrong.length === 0,
    wrong.length ? `${wrong.length} crossed the picture` : 'left dots to the left gutter, right dots to the right');
}

/* 7 — empty input is not a crash */
ok('no labels is not an error', Array.isArray(planLabels([], W, H, LH)) && planLabels([], W, H, LH).length === 0, 'returns []');

let bad = 0;
const pad = Math.max(...checks.map(c => c[0].length));
for (const [name, pass, detail] of checks) {
  if (!pass) bad++;
  console.log(`${pass ? '  ok  ' : '  FAIL'}  ${name.padEnd(pad)}  ${detail || ''}`);
}
console.log(`\n${checks.length - bad}/${checks.length} expectations met.`);
if (bad) console.log('\nLabels are back over the anatomy. That is not cosmetic — the label hides the thing it names.');
process.exit(bad ? 1 : 0);
