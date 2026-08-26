#!/usr/bin/env node
/* MedBank · viz-training/tools/test-topic-match.mjs
 *
 * Does a note actually grow a 3D tab?
 *
 * This exists because of a live bug: scenesForTopic() filtered candidate topics with `t.length > 3`,
 * which silently excluded the string "arm" — the single most common way a note names that topic. A note
 * titled "Anatomy of the Arm — Biceps & Triceps" matched nothing, no chip rendered, and nothing was
 * logged, because returning zero scenes is a legitimate result. Silence is the whole problem: there is no
 * error to notice, so the only way to catch it is to assert the match table directly.
 *
 * It loads the REAL viz3d.js — not a copy of its logic — under a small browser shim, feeds it the real
 * scenes/index.json, and asserts both directions: titles that MUST match, and near-miss traps that must
 * NOT (an "ear" scene must never open on a note about the heart).
 *
 *   node viz-training/tools/test-topic-match.mjs
 *
 * Node 18+. No dependencies. Exit code 1 on any failed expectation.
 */
import { readFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const HERE = dirname(fileURLToPath(import.meta.url));
const ROOT = join(HERE, '..');

/* viz3d.js lives at the repo root, one level above viz-training/ */
import { existsSync } from 'node:fs';
const VIZ3D = [join(ROOT, '..', 'viz3d.js'), join(ROOT, 'viz3d.js')].find(existsSync);
if (!VIZ3D) { console.error('cannot find viz3d.js next to viz-training/'); process.exit(2); }

const index = JSON.parse(readFileSync(join(ROOT, 'scenes', 'index.json'), 'utf8'));

/* --- the smallest browser viz3d.js will start in --- */
const win = {
  localStorage: { getItem: k => (k === 'mb3d' ? '1' : null), setItem() {}, removeItem() {} },
  addEventListener() {}, removeEventListener() {},
  matchMedia: () => ({ matches: false, addListener() {}, removeListener() {} })
};
globalThis.window = win;
globalThis.document = {
  currentScript: { src: 'https://medbank.com.ng/viz3d.js' },
  addEventListener() {}, removeEventListener() {},
  createElement: () => ({ style: {}, setAttribute() {}, appendChild() {}, addEventListener() {} }),
  querySelector: () => null, querySelectorAll: () => [],
  head: { appendChild() {} }, body: { appendChild() {} }
};
globalThis.localStorage = win.localStorage;
win.navigator = { userAgent: 'node' };
globalThis.fetch = async (url) => {
  if (String(url).endsWith('viz-training/scenes/index.json')) {
    return { ok: true, status: 200, text: async () => JSON.stringify(index) };
  }
  return { ok: false, status: 404, text: async () => '' };
};

new Function(readFileSync(VIZ3D, 'utf8'))();
const MB3D = win.MB3D;
if (!MB3D || !MB3D.scenesForTopic) { console.error('viz3d.js did not expose MB3D.scenesForTopic'); process.exit(1); }

const ARM = 'gross__arm__biceps-triceps';
const HEART = 'gross__heart-pericardium__heart';

/* [title, subject, body, expected scene ids]
 *
 * A non-empty expectation means "these must be offered", not "only these". It used to mean only these,
 * and that broke the moment the authoring task wrote a pectoralis major scene: "Upper limb muscles"
 * quite correctly started offering the pectoral scene alongside the arm, and a green test went red for
 * doing the right thing. An exact-set assertion against a corpus that grows every hour fails on every
 * correct addition, and a test that cries wolf hourly stops being read.
 *
 * The opposite direction stays exact, because that is where the danger is: a case expecting NOTHING
 * must return nothing. Those are the near-miss traps — "Warm ischaemia", "Harm reduction" — and they
 * are what catches a matcher gone loose. And a topic about the arm must never be answered with the
 * heart, however many scenes get authored, so that is asserted too. */
const CASES = [
  /* the live failure that started this — a pasted lecture whose title says "Arm" */
  ['Anatomy of the Arm — Biceps & Triceps', 'Paediatrics', '', [ARM]],
  ['The Arm', 'Anatomy', '', [ARM]],
  ['ARM', 'Anatomy', '', [ARM]],
  ['Arm (Brachium)', 'Gross Anatomy', '', [ARM]],
  ['Upper limb muscles', 'Anatomy', '', [ARM]],
  ['Muscles of the elbow', 'Anatomy', '', [ARM]],
  ['Heart and Pericardium', 'Anatomy', '', [HEART]],
  ['The mediastinum', 'Anatomy', '', [HEART]],

  /* body fallback: the title says nothing, the note does */
  ['Week 3 Lecture', 'Dr Test', 'The anterior compartment of arm contains biceps brachii.', [ARM]],
  ['Lecture 7', 'Dr Test', 'We now turn to the upper limb and its flexors.', [ARM]],

  /* body fallback must NOT fire on a single stray word */
  ['Week 4 Lecture', 'Dr Test', 'The patient held his arm still during the examination.', []],

  /* near-miss traps: raw substring matching would wrongly fire on every one of these */
  ['Warm ischaemia time', 'Surgery', '', []],
  ['Harm reduction in addiction', 'Psychiatry', '', []],
  ['Alarm features in dyspepsia', 'Medicine', '', []],
  ['Armadillo model of leprosy', 'Micro', '', []],
  ['Pharmacology of beta blockers', 'Pharm', '', []],

  /* unrelated topics stay empty */
  ['Malaria in pregnancy', 'O&G', '', []],
  ['', '', '', []]
];

let failed = 0;
const pad = Math.max(...CASES.map(c => (c[0] || '(empty)').length));

for (const [title, subject, body, want] of CASES) {
  const got = (await MB3D.scenesForTopic(title, subject, body)).map(s => s.id).sort();
  const missing = want.filter(id => got.indexOf(id) < 0);
  /* the other half of the guarantee: the arm is not the heart, and must never be offered as it */
  const forbidden = want.indexOf(ARM) >= 0 ? [HEART] : want.indexOf(HEART) >= 0 ? [ARM] : [];
  const wrong = forbidden.filter(id => got.indexOf(id) >= 0);
  const ok = want.length ? (!missing.length && !wrong.length) : got.length === 0;
  if (!ok) failed++;
  const label = (title || '(empty)').padEnd(pad);
  const shown = got.length ? got.map(id => id.split('__')[1]).join(',') : '—';
  console.log(`${ok ? '  ok  ' : '  FAIL'}  ${label}  ${body ? '[body] ' : '       '}→ ${shown}${ok ? '' : `   expected ${want.length ? want.map(id => id.split('__')[1]).join(',') : '—'}`}`);
}

console.log(`\n${CASES.length - failed}/${CASES.length} expectations met.`);
if (failed) {
  console.log('\nA topic that should match but does not means students see no 3D tab and NOTHING is logged —');
  console.log('the match table is the only place that failure is visible. Fix scenesForTopic, not the scene.');
}
process.exit(failed ? 1 : 0);
