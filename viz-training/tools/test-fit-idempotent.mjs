#!/usr/bin/env node
/* MedBank · viz-training/tools/test-fit-idempotent.mjs
 *
 * Re-framing the model must be a no-op the second time.
 *
 * The 3D viewer can now open before every mesh has arrived and fold in stragglers as they land, which
 * means the functions that lay out the scene run more than once. On 2026-08-25 that turned the arm scene
 * solid black on the live site, and it read exactly like a lighting bug — geometry loaded, 15 of 15 parts
 * reported, render loop running, nothing on screen.
 *
 * It was fit(). It measured the group with `setFromObject`, which includes the scale the previous call had
 * already applied, so the second call saw a model 4.2 units across, "corrected" the scale to ~1, and blew
 * a 545 mm scene up past a hundredfold with the camera inside it. It also subtracted the centre from every
 * child position on each call, so the model drifted off-centre too.
 *
 * This runs the REAL fit() — lifted verbatim out of viz3d.js, not reimplemented — against a real three.js
 * scene, and asserts that calling it repeatedly lands in the same place as calling it once. Any layout
 * function that accumulates state instead of recomputing it will fail here.
 *
 *   npm install three@0.128.0     (once, in the repo or globally)
 *   node viz-training/tools/test-fit-idempotent.mjs
 *
 * Node 18+. Needs the `three` package; skips with a clear message if it is not installed.
 */
import { readFileSync, existsSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const HERE = dirname(fileURLToPath(import.meta.url));
const ROOT = join(HERE, '..');
const VIZ3D = [join(ROOT, '..', 'viz3d.js'), join(ROOT, 'viz3d.js')].find(existsSync);
if (!VIZ3D) { console.error('cannot find viz3d.js next to viz-training/'); process.exit(2); }

let T;
try { T = await import('three'); }
catch (e) {
  console.log('SKIPPED — the `three` package is not installed here.');
  console.log('  npm install three@0.128.0   then re-run.');
  process.exit(0);
}

/* ---- lift the shipped fit() out of viz3d.js, so this tests the real thing ---- */
const src = readFileSync(VIZ3D, 'utf8');
const start = src.indexOf('function fit() {');
if (start < 0) { console.error('could not find fit() in viz3d.js — has it been renamed?'); process.exit(1); }
let depth = 0, end = -1;
for (let i = src.indexOf('{', start); i < src.length; i++) {
  if (src[i] === '{') depth++;
  else if (src[i] === '}') { depth--; if (depth === 0) { end = i + 1; break; } }
}
const fitSrc = src.slice(start, end);

/* ---- a real three.js scene shaped like the arm ---- */
function buildHolder() {
  const holder = new T.Group();
  /* rough stand-ins for scapula, humerus, radius, ulna, and a muscle — different sizes, offset from the
     origin the way BodyParts3D delivers them (whole-body coordinates, nowhere near 0,0,0) */
  const parts = [
    { size: [109, 110, 158], at: [20, -8, 250] },
    { size: [101, 50, 307], at: [10, 0, 100] },
    { size: [60, 67, 229], at: [5, 10, -80] },
    { size: [51, 80, 248], at: [-5, 12, -85] },
    { size: [92, 48, 346], at: [15, -20, 60] }
  ];
  for (const p of parts) {
    const g = new T.BoxGeometry(p.size[0], p.size[1], p.size[2]);
    const m = new T.Mesh(g, new T.MeshBasicMaterial());
    m.position.set(p.at[0], p.at[1], p.at[2]);
    holder.add(m);
  }
  return holder;
}

function snapshot(holder) {
  return {
    scale: +holder.scale.x.toFixed(9),
    children: holder.children.map(m => [m.position.x, m.position.y, m.position.z].map(v => +v.toFixed(6)))
  };
}

function runFit(holder, times) {
  const fit = new Function('T', 'holder', `${fitSrc}; return fit;`)(T, holder);
  for (let i = 0; i < times; i++) fit();
  return snapshot(holder);
}

const once = runFit(buildHolder(), 1);
const twice = runFit(buildHolder(), 2);
const five = runFit(buildHolder(), 5);

/* a late mesh joining after the first fit must be included, and must not wreck the framing */
const grown = buildHolder();
const growFit = new Function('T', 'holder', `${fitSrc}; return fit;`)(T, grown);
growFit();
const lateG = new T.BoxGeometry(84, 33, 265);
const late = new T.Mesh(lateG, new T.MeshBasicMaterial());
late.position.set(-30, 5, 40);
grown.add(late);
growFit();
const grownBox = new T.Box3().setFromObject(grown);
const grownSize = grownBox.getSize(new T.Vector3());
const grownCentre = grownBox.getCenter(new T.Vector3());

const checks = [
  ['fit() once then twice lands in the same place', JSON.stringify(once) === JSON.stringify(twice),
   `scale ${once.scale} → ${twice.scale}`],
  ['fit() five times still lands in the same place', JSON.stringify(once) === JSON.stringify(five),
   `scale ${once.scale} → ${five.scale}`],
  ['a single fit() scales the model to ~4.2 units', Math.abs(4.2 - Math.max(
     ...(() => { const h = buildHolder(); runFit(h, 1); const s = new T.Box3().setFromObject(h).getSize(new T.Vector3()); return [s.x, s.y, s.z]; })()
   )) < 0.01, 'the camera is positioned for a model of this size'],
  ['a mesh arriving late is framed in, not ignored', Math.abs(4.2 - Math.max(grownSize.x, grownSize.y, grownSize.z)) < 0.01,
   `largest dimension ${Math.max(grownSize.x, grownSize.y, grownSize.z).toFixed(3)}`],
  ['and the model stays centred on the origin', grownCentre.length() < 1e-6,
   `centre offset ${grownCentre.length().toExponential(1)}`]
];

let bad = 0;
const pad = Math.max(...checks.map(c => c[0].length));
for (const [name, ok, detail] of checks) {
  if (!ok) bad++;
  console.log(`${ok ? '  ok  ' : '  FAIL'}  ${name.padEnd(pad)}  ${detail}`);
}

console.log(`\n${checks.length - bad}/${checks.length} expectations met.`);
if (bad) {
  console.log('\nA layout function that accumulates instead of recomputing turns the viewport black the');
  console.log('moment a mesh arrives late — and it looks like a lighting bug, not a maths bug. Reset to a');
  console.log('known state at the top of fit(), then measure.');
}
process.exit(bad ? 1 : 0);
