#!/usr/bin/env node
/* MedBank · viz-training/tools/lint-viz3d.mjs
 *
 * Catch the bug that `node --check` cannot see.
 *
 * On 2026-08-26 one line — `if (v.narration) say(v.narration)` — was added to a function that never
 * receives `v`. The file parsed. It deployed. It passed every test we had. And then it threw
 * "ReferenceError: v is not defined" on every traced view, from inside a forEach, taking out the
 * narration, the step-through, the Play/Stop toggle and the heart's blood path in one go — while the
 * caption sat frozen on step 1 and the console said nothing unless you went looking for it.
 *
 * `node --check` only asks whether the file parses. A reference to a variable that does not exist in
 * scope parses perfectly well; it fails at the moment that line runs, which for a rarely-hit branch can
 * be weeks later, in front of a student.
 *
 * This runs ESLint's scope analysis over viz3d.js with a browser environment declared, and fails on
 * `no-undef` and `no-unused-vars`. It is deliberately just those two rules: this is not a style gate and
 * nobody should have to argue with it about semicolons. It exists to answer one question — does every
 * name in this file actually resolve?
 *
 *   node viz-training/tools/lint-viz3d.mjs
 *
 * Node 18+. Needs `npm install eslint`; skips with a clear message if it is not installed, so the
 * pre-push checklist still runs on a machine that has not installed it yet.
 */
import { readFileSync, existsSync } from 'node:fs';
import { join, dirname, basename } from 'node:path';
import { fileURLToPath } from 'node:url';

const HERE = dirname(fileURLToPath(import.meta.url));
const ROOT = join(HERE, '..');
const TARGETS = [join(ROOT, '..', 'viz3d.js'), join(ROOT, 'viz3d.js')].filter(existsSync).slice(0, 1);
if (!TARGETS.length) { console.error('cannot find viz3d.js next to viz-training/'); process.exit(2); }

let Linter;
try { ({ Linter } = await import('eslint')); }
catch (e) {
  console.log('SKIPPED — eslint is not installed here.');
  console.log('  npm install eslint   then re-run. This check is what catches "x is not defined".');
  process.exit(0);
}

const linter = new Linter({ configType: 'flat' });

/* Everything viz3d.js legitimately reaches for from outside itself. Anything NOT on this list and not
   declared in the file is the bug this tool exists to find. Keep it short and deliberate — adding a name
   here to silence an error is how the gate stops working. */
const GLOBALS = {
  window: 'readonly', document: 'readonly', navigator: 'readonly', location: 'readonly',
  localStorage: 'readonly', sessionStorage: 'readonly', console: 'readonly',
  setTimeout: 'readonly', clearTimeout: 'readonly', setInterval: 'readonly', clearInterval: 'readonly',
  requestAnimationFrame: 'readonly', cancelAnimationFrame: 'readonly',
  fetch: 'readonly', Promise: 'readonly', Map: 'readonly', Set: 'readonly', WeakMap: 'readonly',
  XMLHttpRequest: 'readonly', Blob: 'readonly', URL: 'readonly', performance: 'readonly',
  Float32Array: 'readonly', Float64Array: 'readonly', Int32Array: 'readonly', Uint8Array: 'readonly',
  Uint16Array: 'readonly', Uint32Array: 'readonly', ArrayBuffer: 'readonly', DataView: 'readonly',
  THREE: 'readonly',                       // loaded at runtime by loadThree()
  MEDBANK_CONFIG: 'readonly',              // config.js
  speechSynthesis: 'readonly', SpeechSynthesisUtterance: 'readonly'
};

let problems = 0;
for (const file of TARGETS) {
  const code = readFileSync(file, 'utf8');
  const messages = linter.verify(code, [{
    languageOptions: { ecmaVersion: 2020, sourceType: 'script', globals: GLOBALS },
    rules: { 'no-undef': 'error', /* `catch (e) {}` is a deliberate idiom throughout viz3d.js — a failed optional feature must never
         take the viewer down with it — so unused catch bindings are not findings. Everything else is. */
      'no-unused-vars': ['warn', { args: 'none', caughtErrors: 'none', varsIgnorePattern: '^_' }] }
  }], basename(file));

  const errors = messages.filter(m => m.severity === 2);
  const warns = messages.filter(m => m.severity === 1);

  console.log(`\n${basename(file)} — ${(code.length / 1024).toFixed(0)} KB`);
  for (const m of errors) {
    problems++;
    console.log(`  ERROR  line ${String(m.line).padStart(5)}  ${m.message}`);
    const src = code.split('\n')[m.line - 1] || '';
    console.log(`         ${src.trim().slice(0, 100)}`);
  }
  for (const m of warns.slice(0, 12)) console.log(`  warn   line ${String(m.line).padStart(5)}  ${m.message}`);
  if (warns.length > 12) console.log(`  warn   … and ${warns.length - 12} more unused-variable warnings`);
  if (!errors.length) console.log(`  ok     every name resolves${warns.length ? ` (${warns.length} unused-variable warning(s))` : ''}`);
}

if (problems) {
  console.log(`\n${problems} undefined reference(s). Each one throws the moment that line runs — which, for`);
  console.log(`a branch nobody exercises in testing, means it throws in front of a student instead.\n`);
  process.exit(1);
}
console.log('');
