#!/usr/bin/env node
/* MedBank · viz-training/tools/test-mesh-loading.mjs
 *
 * A greyed-out muscle must mean what it says.
 *
 * On 2026-08-25 the arm scene opened on the live site reporting "Loaded 2 of 15 parts — 8 unavailable",
 * with every muscle head labelled "not available in this mesh set". That was false. The meshes exist and
 * had rendered fine an hour earlier; the public CDN simply failed to deliver them, the loader tried once,
 * and a transient network failure was presented to the student as a permanent fact about the corpus. It
 * also pointed the whole investigation at buying a different mesh provider, which would have been a
 * waste of money and weeks.
 *
 * So the adapter now distinguishes two answers, and this asserts the distinction holds:
 *   no ref in the scene   → {reason:'none'}    a real gap. Nothing the student can do.
 *   fetch failed          → {reason:'failed'}  retryable, and retried before we say so.
 *
 * It loads the REAL viz3d.js and drives its bodyparts3d adapter with a fake STLLoader whose failure
 * pattern each case controls.
 *
 *   node viz-training/tools/test-mesh-loading.mjs
 *
 * Node 18+. No dependencies. Exit code 1 on any failed expectation.
 */
import { readFileSync, existsSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const HERE = dirname(fileURLToPath(import.meta.url));
const ROOT = join(HERE, '..');
const VIZ3D = [join(ROOT, '..', 'viz3d.js'), join(ROOT, 'viz3d.js')].find(existsSync);
if (!VIZ3D) { console.error('cannot find viz3d.js next to viz-training/'); process.exit(2); }

const win = {
  localStorage: { getItem: () => null, setItem() {}, removeItem() {} },
  addEventListener() {}, removeEventListener() {}
};
globalThis.window = win;
globalThis.document = {
  currentScript: { src: 'https://medbank.com.ng/viz3d.js' },
  addEventListener() {}, removeEventListener() {},
  createElement: () => ({ style: {}, setAttribute() {}, appendChild() {}, addEventListener() {} }),
  querySelector: () => null, querySelectorAll: () => [], getElementById: () => null,
  head: { appendChild() {} }, body: { appendChild() {} }
};
globalThis.localStorage = win.localStorage;
globalThis.fetch = async () => ({ ok: false, status: 404, text: async () => '' });

new Function(readFileSync(VIZ3D, 'utf8'))();
const adapter = win.MB3D && win.MB3D.adapters && win.MB3D.adapters.bodyparts3d;
if (!adapter) { console.error('viz3d.js did not expose the bodyparts3d adapter'); process.exit(1); }

/* a three.js stand-in: only what the adapter touches */
function fakeThree(plan) {
  let call = 0;
  return {
    calls: () => call,
    Color: class { constructor(c) { this.c = c; } },
    MeshStandardMaterial: class {},
    Mesh: class { constructor(g, m) { this.geometry = g; this.material = m; this.isObject3D = true; } },
    DoubleSide: 2,
    STLLoader: class {
      load(url, ok, prog, err) {
        const outcome = plan[Math.min(call, plan.length - 1)];
        call++;
        setTimeout(() => {
          if (outcome === 'ok') ok({ computeVertexNormals() {} });
          else if (outcome === 'hang') { /* never calls back — the timeout must catch it */ }
          else err(new Error('network'));
        }, 1);
      }
    }
  };
}

const withRef = { key: 'bic_long', label: 'Biceps — long head', refs: { bodyparts3d: 'FMA37686' } };
const noRef = { key: 'supraglenoid_tubercle', label: 'Supraglenoid tubercle', render: 'anchor' };

const CASES = [
  { name: 'loads first time',                   s: withRef, plan: ['ok'],                     mesh: true,  reason: null,     minCalls: 1 },
  { name: 'one failure then success  (retries)', s: withRef, plan: ['fail', 'ok'],             mesh: true,  reason: null,     minCalls: 2 },
  { name: 'two failures then success (retries)', s: withRef, plan: ['fail', 'fail', 'ok'],     mesh: true,  reason: null,     minCalls: 3 },
  { name: 'always fails → failed, not none',     s: withRef, plan: ['fail'],                   mesh: false, reason: 'failed', minCalls: 3 },
  { name: 'no ref in scene → none, not failed',  s: noRef,   plan: ['ok'],                     mesh: false, reason: 'none',   minCalls: 0 }
];

let failedCount = 0;
const pad = Math.max(...CASES.map(c => c.name.length));

for (const c of CASES) {
  const T = fakeThree(c.plan);
  let r;
  try { r = await adapter.load(T, c.s); }
  catch (e) { r = { mesh: null, reason: 'THREW: ' + e.message }; }
  const gotMesh = !!(r && r.mesh);
  const gotReason = r ? (r.reason || null) : null;
  const calls = T.calls();
  const ok = gotMesh === c.mesh && gotReason === c.reason && calls >= c.minCalls;
  if (!ok) failedCount++;
  console.log(`${ok ? '  ok  ' : '  FAIL'}  ${c.name.padEnd(pad)}  mesh=${String(gotMesh).padEnd(5)} reason=${String(gotReason).padEnd(6)} attempts=${calls}` +
    (ok ? '' : `   expected mesh=${c.mesh} reason=${c.reason} attempts>=${c.minCalls}`));
}

/* the hang case is what a timeout exists for — it must resolve, not sit there forever */
{
  const T = fakeThree(['hang']);
  const started = Date.now();
  const r = await Promise.race([
    adapter.load(T, withRef),
    new Promise(res => setTimeout(() => res('NEVER SETTLED'), 90000))
  ]);
  const ok = r !== 'NEVER SETTLED' && r && !r.mesh && r.reason === 'failed';
  if (!ok) failedCount++;
  console.log(`${ok ? '  ok  ' : '  FAIL'}  ${'a request that never answers'.padEnd(pad)}  ` +
    (r === 'NEVER SETTLED' ? 'HUNG — Promise.all would never resolve and the viewer would spin forever'
                           : `resolved reason=${r.reason} after ${Math.round((Date.now() - started) / 1000)}s`));
}

console.log(`\n${CASES.length + 1 - failedCount}/${CASES.length + 1} expectations met.`);
if (failedCount) {
  console.log('\nTelling a student "not available in this mesh set" when the download merely failed is a lie');
  console.log('the app cannot detect and they cannot act on. Keep the two reasons apart.');
}
process.exit(failedCount ? 1 : 0);
