/* Round-2 finding 6: the superior border needs a superior beat, and viz3d.js has had a `superior`
 * VIEW_DIR all along ([0,1,0.001], viz3d.js:2095) — the scene simply never used it. The review
 * corrected the gap text and left the authoring open, which is this task's half of it.
 *
 * It goes in AFTER the borders beat rather than at the end, because it is the same lesson: the four
 * borders are the cardiac silhouette, and the superior one is the member of that four you cannot
 * read from the front. Beats after it renumber.
 */
import { readFileSync, writeFileSync } from 'fs';
const PATH = 'viz-training/scenes/gross__heart-pericardium__heart-external.json';
const scene = JSON.parse(readFileSync(PATH, 'utf8'));
if (scene.views.some(v => v.title === 'The superior border, from above')) {
  console.log('already present'); process.exit(0);
}
const KEYS = scene.structures.map(s => s.key);
const SHOW = ['heart', 'ra_auricle', 'la_auricle', 'border_superior', 'border_right'];
const beat = {
  mode: 'location',
  title: 'The superior border, from above',
  ops: [{ op: 'HIDE_STRUCTURE', target: '*' }]
    .concat(KEYS.filter(k => SHOW.includes(k)).map(k => ({ op: 'SHOW_STRUCTURE', target: k })))
    .concat([
      { op: 'ROTATE_TO_VIEW', view: 'superior' },
      { op: 'COMPARE_STRUCTURES', targets: ['border_superior', 'border_right'] },
    ]),
  narration: 'The superior border again, this time from directly above. From the front it is the one '
    + 'border you cannot read: it lies along the top of the heart, edge-on to the outline the '
    + 'anterior camera makes, so it shows as a line a couple of pixels wide. Seen from above it is '
    + 'the whole upper aspect — the two atria side by side, with the aorta and the pulmonary trunk '
    + 'emerging between them and the superior vena cava entering on the right. That is why the '
    + 'superior mediastinal structures, and not the cardiac outline, are what a chest film shows you '
    + 'at this level.',
};
const at = scene.views.findIndex(v => v.beat === 8);
scene.views.splice(at + 1, 0, beat);
scene.views.forEach((v, i) => { v.beat = i + 1; });
writeFileSync(PATH, JSON.stringify(scene, null, 1) + '\n');
console.log('inserted as beat', at + 2, '— now', scene.views.length, 'views');
for (const v of scene.views) console.log('  ', String(v.beat).padStart(2), v.mode.padEnd(18), v.title);
