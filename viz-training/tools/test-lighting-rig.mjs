#!/usr/bin/env node
/* MedBank · viz-training/tools/test-lighting-rig.mjs
 *
 * The lit side must be the side you are looking at.
 *
 * The lights used to sit at fixed points in the world. The model does not turn when a student orbits — the
 * camera does — so one face of the scapula was permanently lit and the opposite face permanently in
 * shadow. Two screenshots of the same scene, taken from opposite sides, looked like two different renders:
 * a white bone and a grey one. It reads as a rendering fault, and no amount of tuning brightness fixes it,
 * because the problem is not how much light there is but where it is nailed down.
 *
 * Parenting the lights to the camera fixes it by construction. This asserts the construction held:
 *
 *   · each light's direction, expressed in the CAMERA's own frame, is identical from every camera
 *     position — front, back, both sides, above, and an arbitrary oblique angle
 *   · the target moves with the light (a DirectionalLight aims from position to target; leaving the
 *     target behind in world space reintroduces the same bug in a subtler form)
 *   · the lights are actually reachable in the scene graph — three.js only walks the camera's children
 *     if the camera itself was added to the scene, and forgetting that leaves a scene lit by nothing
 *
 * It lifts the rig out of viz3d.js rather than reimplementing it, so it tests what ships.
 *
 *   npm install three@0.128.0
 *   node viz-training/tools/test-lighting-rig.mjs
 *
 * Node 18+. Skips with a clear message if `three` is not installed.
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

/* ---- lift the shipped rig construction out of viz3d.js ---- */
const src = readFileSync(VIZ3D, 'utf8');
const fnStart = src.indexOf('function rigLight(light, x, y, z) {');
if (fnStart < 0) { console.error('could not find rigLight() in viz3d.js — has the light rig been renamed?'); process.exit(1); }
let depth = 0, fnEnd = -1;
for (let i = src.indexOf('{', fnStart); i < src.length; i++) {
  if (src[i] === '{') depth++;
  else if (src[i] === '}') { depth--; if (depth === 0) { fnEnd = i + 1; break; } }
}
const rigLightSrc = src.slice(fnStart, fnEnd);

/* the three offsets, read from the shipped calls so the test follows if they are retuned */
const offsets = [...src.matchAll(/rigLight\(new T\.DirectionalLight\([^)]*\),\s*(-?[\d.]+),\s*(-?[\d.]+),\s*(-?[\d.]+)\)/g)]
  .map(m => [parseFloat(m[1]), parseFloat(m[2]), parseFloat(m[3])]);
if (offsets.length < 3) { console.error(`expected 3 rigLight() calls in viz3d.js, found ${offsets.length}`); process.exit(1); }

/* ---- rebuild the scene exactly as build() does ---- */
const scene = new T.Scene();
const camera = new T.PerspectiveCamera(45, 1.5, 0.01, 4000);
camera.position.set(0, 0.4, 7);
const rig = new T.Group();
camera.add(rig);
scene.add(camera);
const rigLight = new Function('T', 'rig', `${rigLightSrc}; return rigLight;`)(T, rig);
const lights = offsets.map(([x, y, z]) => rigLight(new T.DirectionalLight(0xffffff, 1), x, y, z));

function dirInViewSpace(l) {
  scene.updateMatrixWorld(true);
  camera.updateMatrixWorld(true);
  const lp = new T.Vector3().setFromMatrixPosition(l.matrixWorld);
  const tp = new T.Vector3().setFromMatrixPosition(l.target.matrixWorld);
  const world = new T.Vector3().subVectors(tp, lp).normalize();
  const inv = new T.Matrix3().setFromMatrix4(new T.Matrix4().copy(camera.matrixWorld).invert());
  return world.applyMatrix3(inv).normalize();
}

const VIEWPOINTS = [
  ['front', [0, 0, 7]], ['right', [7, 0, 0]], ['back', [0, 0, -7]],
  ['left', [-7, 0, 0]], ['above', [0, 7, 0.001]], ['oblique', [3, -4, 5]]
];

const checks = [];
const ok = (name, pass, detail) => checks.push([name, pass, detail]);

/* 1 — direction constant in the camera's frame, for every light, from every angle */
let worstDrift = 0, worstWhere = '';
for (let i = 0; i < lights.length; i++) {
  let ref = null;
  for (const [label, pos] of VIEWPOINTS) {
    camera.position.set(pos[0], pos[1], pos[2]);
    camera.lookAt(0, 0, 0);
    const d = dirInViewSpace(lights[i]);
    if (!ref) { ref = d.clone(); continue; }
    const drift = d.angleTo(ref) * 180 / Math.PI;
    if (drift > worstDrift) { worstDrift = drift; worstWhere = `light ${i + 1} from ${label}`; }
  }
}
ok('every light holds its angle to the camera', worstDrift < 1e-6,
  worstDrift === 0 ? 'exactly 0° drift across 6 viewpoints × 3 lights' : `${worstDrift.toExponential(1)}° at ${worstWhere}`);

/* 2 — the target rides along; a world-anchored target is the same bug wearing a disguise */
const targetsParented = lights.every(l => {
  let p = l.target;
  while (p.parent) { p = p.parent; if (p === camera) return true; }
  return false;
});
ok('each light\'s target is parented to the camera too', targetsParented,
  targetsParented ? '' : 'a target left in world space swings the direction as you orbit');

/* 3 — the lights exist as far as the renderer is concerned */
let found = 0;
scene.traverse(o => { if (o.isLight) found++; });
ok('the lights are reachable in the scene graph', found === lights.length,
  `${found} of ${lights.length} — three.js only walks the camera's children if the camera is in the scene`);

/* 4 — the rig must actually shade, not flatten: the key cannot point straight down the view axis,
       or every surface facing you gets identical light and all form disappears */
camera.position.set(0, 0.4, 7); camera.lookAt(0, 0, 0);
const key = dirInViewSpace(lights[0]);
const straightAhead = new T.Vector3(0, 0, -1);
const off = key.angleTo(straightAhead) * 180 / Math.PI;
ok('the key is off-axis, so form still reads', off > 12 && off < 70, `${off.toFixed(1)}° off the view axis`);

/* 5 — bone must be matte. A specular highlight is brightest exactly where the surface curves most,
       which is where the ridges and fossae are, so sheen erases the detail a student is meant to read.
       A drawn atlas has no specular at all. */
{
  const bone = src.match(/roughness: isBone \? ([\d.]+) : ([\d.]+)/);
  const metal = src.match(/metalness: isBone \? ([\d.]+) : ([\d.]+)/);
  const r = bone ? parseFloat(bone[1]) : NaN, mm = metal ? parseFloat(metal[1]) : NaN;
  ok('bone is matte and non-metallic', r >= 0.9 && mm === 0,
    bone ? `bone roughness ${r}, metalness ${mm} (soft tissue keeps ${bone[2]} / ${metal[2]})` : 'could not find the bone material');
}

/* 6 — the key-to-fill ratio carries the contrast. Too wide and the shadow side crushes to black, which
       is what happened the first time this was tuned; the fix then was to raise the fill, not the key. */
{
  const L = src.match(/var LIGHTS = \{ ambient: ([\d.]+), key: ([\d.]+), fill: ([\d.]+)/);
  const key = L ? parseFloat(L[2]) : NaN, fill = L ? parseFloat(L[3]) : NaN;
  const ratio = key / fill;
  ok('key-to-fill contrast stays modest', ratio > 1 && ratio < 2.2, `key ${key} : fill ${fill} = ${ratio.toFixed(2)}:1`);
}

let bad = 0;
const pad = Math.max(...checks.map(c => c[0].length));
for (const [name, pass, detail] of checks) {
  if (!pass) bad++;
  console.log(`${pass ? '  ok  ' : '  FAIL'}  ${name.padEnd(pad)}  ${detail || ''}`);
}
console.log(`\n${checks.length - bad}/${checks.length} expectations met.`);
if (bad) {
  console.log('\nA light nailed to the world gives the model a permanent dark side, and the student who');
  console.log('rotates towards it thinks the app broke. Lights belong to the camera.');
}
process.exit(bad ? 1 : 0);
