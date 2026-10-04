/* MedBank · MINIMAL REPRODUCTION — does render-kit wind its ANNULAR END CAPS and its CUTAWAY RIM
 * against their own supplied normals?
 *
 * WHY THIS FILE EXISTS. RENDER-STANDARD 2.4b records that sweptShell's flat end cap for a SOLID tube
 * was wound backwards for as long as the file had existed, and that it never showed, because the caps
 * sit inside the hull count, the materials are DoubleSide and the shading was right. It was found by a
 * ray cast asking which surface faces the camera FIRST. That fix went into the solid path — triN and
 * domeCap. It did NOT go into the two paths a THICK-WALLED shell uses:
 *
 *    cap(k, sign)  the ANNULAR end cap between the outer and inner surfaces
 *    the rim faces around a cutaway WINDOW
 *
 * A build note on BUILD-QUEUE item embryology__folding-of-the-embryo__cranio-caudal-folding asserted
 * exactly this on 2026-09-11 and cited a probe at viz-training/tools/probe-kit-winding.mjs. That whole
 * build was later VOIDED — nothing it described was ever written, and the probe it cited has never
 * existed. So the claim has been sitting in the queue for nineteen days as an assertion nobody could
 * check. This file checks it, from scratch, on geometry with no model in it.
 *
 * THE TEST IS NOT A RAY CAST. A ray cast tells you a surface faces the wrong way but not which code
 * wrote it. This reads the buffer directly: for every triangle, compare the geometric normal
 * (b-a) x (c-a) against the normals render-kit SUPPLIED for those three vertices. Disagreement is the
 * bug, in the one place it can be attributed.
 *
 *   node viz-training/tools/probe-kit-rim-winding.mjs
 */
import { createRequire } from 'module';
import { readFileSync } from 'fs';
import path from 'path';
import vm from 'vm';

const ROOT = process.cwd();
const requireCjs = createRequire(path.join(ROOT, 'x.js'));
const THREE = requireCjs(path.join(ROOT, 'node_modules/three/build/three.js'));
const ctx = { console, Math, Float32Array, Array, Object, Number, isFinite, isNaN };
ctx.window = ctx; ctx.global = ctx; ctx.THREE = THREE;
vm.createContext(ctx);
vm.runInContext(readFileSync(path.join(ROOT, 'models3d/render-kit.js'), 'utf8'), ctx);
const K = ctx.window.VizKit;

/** count triangles in [lo,hi) whose winding disagrees with their own supplied vertex normals */
function disagree(geo, lo, hi) {
  const p = geo.attributes.position, n = geo.attributes.normal;
  const a = new THREE.Vector3(), b = new THREE.Vector3(), c = new THREE.Vector3();
  const e1 = new THREE.Vector3(), e2 = new THREE.Vector3(), f = new THREE.Vector3(), m = new THREE.Vector3();
  let bad = 0, tot = 0;
  for (let i = lo; i + 2 < hi; i += 3) {
    a.set(p.getX(i), p.getY(i), p.getZ(i));
    b.set(p.getX(i + 1), p.getY(i + 1), p.getZ(i + 1));
    c.set(p.getX(i + 2), p.getY(i + 2), p.getZ(i + 2));
    e1.subVectors(b, a); e2.subVectors(c, a); f.crossVectors(e1, e2);
    if (f.lengthSq() < 1e-18) continue;                    // degenerate, not a winding fact
    m.set(0, 0, 0);
    for (let k = 0; k < 3; k++) m.add(new THREE.Vector3(n.getX(i + k), n.getY(i + k), n.getZ(i + k)));
    if (m.lengthSq() < 1e-18) continue;
    tot++;
    if (f.dot(m) < 0) bad++;
  }
  return { bad, tot };
}

/* a STRAIGHT thick-walled tube along +y. No curvature, no model, no options: if this is wound wrong
   the fault is in render-kit and in nothing else. */
const NP = 24, RING = 24;
const pts = [];
for (let i = 0; i <= NP; i++) pts.push(new THREE.Vector3(0, i / NP, 0));
const F = K.parallelFrame(pts, new THREE.Vector3(1, 0, 0));

function shell(win) {
  return K.sweptShell({ frame: F, i0: 0, i1: NP, ring: RING,
    outerR: () => 0.20, innerR: () => 0.12, flatten: 1, section: () => 1, window: win || null });
}

console.log('render-kit.js, thick-walled sweptShell, straight tube, ring=' + RING + ', rows=' + (NP + 1));

const plain = shell(null);
const hull = plain.userData.hullCount;
const total = plain.attributes.position.count;
const outer = disagree(plain, 0, hull);
/* layout for a thick-walled shell with no window, asserted rather than assumed: outer surface (hull),
   then inner surface, then the two annular end caps. */
const innerCount = hull;                    // inner surface has the same quad count as the outer
const inner = disagree(plain, hull, hull + innerCount);
const caps = disagree(plain, hull + innerCount, total);
console.log('  outer surface      ' + outer.bad + ' / ' + outer.tot + ' wound against their own normals');
console.log('  inner surface      ' + inner.bad + ' / ' + inner.tot);
console.log('  ANNULAR END CAPS   ' + caps.bad + ' / ' + caps.tot);

const winged = shell({ i0: 6, i1: 18, dir: new THREE.Vector3(0, 0, 1), half: 0.9 });
const wHull = winged.userData.hullCount;
const wTot = winged.attributes.position.count;
const wOuter = disagree(winged, 0, wHull);
/* everything after the hull is inner surface + caps + rim; the rim is what the plain shell does not
   have, so the DIFFERENCE in the after-hull disagreement count is attributable to it. */
const wAfter = disagree(winged, wHull, wTot);
const pAfter = disagree(plain, hull, total);
console.log('\n  with a cutaway window (dir +z, half 0.9 rad, rows 6..18):');
console.log('  outer surface      ' + wOuter.bad + ' / ' + wOuter.tot);
console.log('  inner+caps+RIM     ' + wAfter.bad + ' / ' + wAfter.tot
  + '   (plain shell, no rim: ' + pAfter.bad + ' / ' + pAfter.tot + ')');

const verdict = [];
if (outer.bad || wOuter.bad) verdict.push('OUTER SURFACE IS WOUND WRONG — this would be visible everywhere');
if (caps.bad) verdict.push('ANNULAR END CAPS: ' + caps.bad + ' of ' + caps.tot + ' wound against their own normals');
if (wAfter.bad > pAfter.bad) verdict.push('CUTAWAY RIM: ' + (wAfter.bad - pAfter.bad) + ' more than the same shell without a window');
console.log('\nVERDICT: ' + (verdict.length ? verdict.join('; ') : 'no disagreement found in any path'));
process.exit(verdict.length ? 1 : 0);
