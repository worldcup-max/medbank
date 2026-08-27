#!/usr/bin/env node
/* MedBank · viz-training/tools/test-landmark-patch.mjs
 *
 * A landmark is an AREA on a bone, not a dot beside it.
 *
 * Landmarks shipped as a glowing sphere with a leader line to a label. That is accurate and it is not
 * what a student has ever seen: in every atlas the supraglenoid tubercle is a coloured patch ON the
 * scapula, and the size and shape of the patch is part of the teaching — how much of the bone the
 * attachment takes, and where on it. A dot says "somewhere here". A patch says "this much, this shape,
 * this place".
 *
 * The bone is painted with per-vertex colour rather than a second mesh, because the catalog has no mesh
 * for any landmark and never will. Two things about that are easy to get wrong and impossible to see in
 * a screenshot until they compound:
 *
 *   · the structure's colour has to be REMEMBERED, not read back off the material — paintPatches()
 *     blanks the material to white and moves the colour into the vertices, so a second paint that read
 *     the material would find white, write white, and the bone would fade out over a few repaints
 *   · a bone that was painted has to be able to go back to plain, or a landmark stays lit long after
 *     the narration has moved on
 *
 * This asserts the construction. It is a structural test, not a rendering one — it cannot tell you the
 * patch is in the right place, only that the mechanism is wired the way it has to be. Where the patch
 * SITS is guaranteed by derive-vertebra-landmarks.mjs and the contact measurements, not by this.
 *
 *   node viz-training/tools/test-landmark-patch.mjs
 *
 * Node 18+. No dependencies.
 */
import { readFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
const HERE = dirname(fileURLToPath(import.meta.url));
const ROOT = join(HERE, '..');
const VIZ3D = [join(ROOT, '..', 'viz3d.js'), join(ROOT, 'viz3d.js')].find(existsSync);
if (!VIZ3D) { console.error('cannot find viz3d.js next to viz-training/'); process.exit(2); }
const src = readFileSync(VIZ3D, 'utf8');
const checks=[];
const ok=(n,p,d)=>checks.push([n,p,d]);
ok('paintPatches exists', /function paintPatches\(\)/.test(src), '');
ok('called from paint()', /paintPatches\(\);\s*\n\s*Object\.keys\(pins\)/.test(src), 'runs every repaint, before the pins');
ok('base colour is remembered, not read back', /__baseCol/.test(src) && /m\.userData\.__baseCol = m\.material\.color\.getHex\(\)/.test(src),
   'otherwise the bone whitens itself on every paint');
ok('vertexColors switched on for host meshes', /m\.material\.vertexColors = true/.test(src), '');
ok('patch is wider than the marker sphere', /\(a\.radius \|\| 0\.05\) \* 3\.0/.test(src), 'the sphere is the point, the patch is the area');
ok('only lit landmarks are painted', /selected\.indexOf\(s\.key\) >= 0 \|\| \(state\.hi && state\.hi\[s\.key\] != null\)/.test(src),
   'painting all of them would give a striped bone');
ok('unpainting is possible', /patched\[key\] = lit\.length > 0/.test(src), 'a bone that was painted repaints back to plain');
/* The atlas look is the point, and all three of these were wrong in the first version. */
ok('the edge is hard, not a fade', /\/ 0\.06\)\)/.test(src), 'a wide feather makes a glow; the boundary is the teaching');
ok('landmarks use a saturated palette', /var PATCH = \['#d1344b'/.test(src), 'authored pale golds read as a smear of light on cream bone');
ok('no two landmarks on a bone share a colour', /PATCH\[i % PATCH\.length\]/.test(src), 'dealt in order, so origin and insertion cannot match');
ok('a scene can still override', /s\.patch_color \|\| PATCH/.test(src), 'patch_color wins where an author means a specific one');
ok('glow is held down under a patch', /Math\.min\(m\.material\.emissiveIntensity, 0\.08\)/.test(src),
   'emissive adds after the vertex colour and turns crimson into pink haze');
let bad=0; const pad=Math.max(...checks.map(c=>c[0].length));
for(const [n,p,d] of checks){ if(!p) bad++; console.log(`${p?'  ok  ':'  FAIL'}  ${n.padEnd(pad)}  ${d||''}`); }
console.log(`\n${checks.length-bad}/${checks.length} expectations met.`);
if (bad) console.log('\nThe landmark patch is wired wrong. The failure mode is gradual — a bone that pales\nover a few repaints, or a landmark still lit two steps after the narration left it.');
process.exit(bad?1:0);
