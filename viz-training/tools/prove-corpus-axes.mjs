#!/usr/bin/env node
/* prove-corpus-axes.mjs — THE CORPUS'S HANDEDNESS, MEASURED FROM SCAN DATA, AND EVERY
 * PROCEDURAL MODEL'S DECLARED `axes` CHECKED AGAINST IT.
 *
 * WHY THIS EXISTS. RENDER-STANDARD section 3 carries two rules about axes. "DECLARE THE AXES AND
 * PROVE THEM" asks that the convention be measured from BodyParts3D right/left pairs rather than
 * taken from a comment. "A DECLARED AXIS IS NOT A PROVED ONE, AND A SYMMETRIC MODEL CANNOT PROVE
 * ITS OWN" — added 2026-09-30 by the review of lateral-folding — records that the first rule
 * silently does not run on a procedural model in its own units, and gives two ways out:
 *
 *   (a) carry a landmark that is independently right/left determined, or
 *   (b) have the declared `axes` string checked, BY A CORPUS-LEVEL TEST, against a model that
 *       IS mesh-anchored.
 *
 * This is (b), and it is stronger than (b) as written: it does not compare one model's comment
 * against another model's comment. It measures the handedness off the SCAN DATA ITSELF and
 * compares every model's declaration to that.
 *
 * WHY THE SCAN DATA IS ALLOWED TO SETTLE IT, which is the only step here that is an argument and
 * not an arithmetic. viz3d.js's bodyparts3d adapter (register('bodyparts3d'), load()) applies NO
 * coordinate transform to a loaded STL: makeMesh() computes vertex normals, builds a material and
 * returns; there is no rotate, no scale, no applyMatrix4, no re-centring anywhere on that path.
 * So the corpus's world frame IS the BodyParts3D frame, and the question "which sign of x is the
 * body's right?" is a question about the files, answerable by opening them. A structure whose NAME
 * contains "right" is right-sided by the vocabulary, not by our choice of axis — that is what makes
 * this non-circular, and it is the whole reason the rule names BodyParts3D pairs specifically.
 *
 * WHAT IT MEASURES. For each pair below: the area-weighted surface centroid of the "right ..." mesh
 * and of the "left ..." mesh. The right one must sit at LOWER x, and — RENDER-STANDARD's magnitude
 * floor, because a sign test is not a test — by at least SEP_FLOOR of the pair's mean x extent.
 *
 * WHICH MESHES, AND WHY THESE SIX. One pair proves nothing about a convention: it could be a
 * mislabelled file. These are six, from six regions (shoulder girdle, abdomen, pelvis, cerebrum,
 * brainstem, scrotum) and four tissue classes, so a single bad label cannot carry the result and a
 * regional transform would show up as a disagreement rather than as a quiet pass.
 *
 * SUBSTRATE. It reads viz-training/meshes-lite/<id>.stl — the LOCAL copies of the same ids the
 * adapter's resolve() turns into MESH_BASE URLs. They are decimated; a centroid's SIGN is not, which
 * is the only thing asserted here. Stated rather than left implicit, per RENDER-STANDARD's "TEST ON
 * THE SUBSTRATE, NOT ON SOMETHING THAT RESEMBLES IT": if this ever grows a claim about surface
 * detail rather than about sidedness, it must move to the full tier.
 *
 * Exits non-zero if the measurement fails, if any model's declaration disagrees with it, or if the
 * built-in negative case is not rejected.
 *
 *   node viz-training/tools/prove-corpus-axes.mjs [--models <dir>] [--meshes <dir>] [--json]
 */
import { readFileSync, readdirSync, existsSync } from 'node:fs';
import { join, basename } from 'node:path';
import { readSTL, vertices, bbox, surfaceCentroid } from './stl.mjs';

const argv = process.argv.slice(2);
const arg = (k, d) => { const i = argv.indexOf(k); return i >= 0 && argv[i + 1] ? argv[i + 1] : d; };
const MODELS = arg('--models', 'models3d');
const MESHES = arg('--meshes', 'viz-training/meshes-lite');
const AS_JSON = argv.includes('--json');

/* the pair list. id, id, what it is, and which region it stands for */
const PAIRS = [
  { right: 'FMA13322', left: 'FMA13323', what: 'clavicle',            region: 'shoulder girdle' },
  { right: 'FMA15571', left: 'FMA15572', what: 'ureter',              region: 'abdomen' },
  { right: 'FMA21387', left: 'FMA21388', what: 'common iliac vein',   region: 'pelvis' },
  { right: 'FMA72832', left: 'FMA72833', what: 'amygdala',            region: 'cerebrum' },
  { right: 'FMA73422', left: 'FMA73423', what: 'superior colliculus', region: 'brainstem' },
  { right: 'FMA7211',  left: 'FMA7212',  what: 'testis',              region: 'scrotum' },
];

const SEP_FLOOR = 0.35;   // RENDER-STANDARD's starting figure for a spatial magnitude floor

function measurePair(p) {
  const rf = join(MESHES, p.right + '.stl'), lf = join(MESHES, p.left + '.stl');
  if (!existsSync(rf) || !existsSync(lf)) return { ...p, ok: false, why: 'mesh file missing: ' + (existsSync(rf) ? lf : rf) };
  const R = readSTL(rf), L = readSTL(lf);
  const cR = surfaceCentroid(R).c[0], cL = surfaceCentroid(L).c[0];
  const bR = bbox(vertices(R)), bL = bbox(vertices(L));
  const meanExt = 0.5 * (bR.size[0] + bL.size[0]);
  const sep = (cL - cR) / (meanExt || 1);          // positive when RIGHT is at lower x
  return { ...p, rightCx: +cR.toFixed(3), leftCx: +cL.toFixed(3), meanXExtent: +meanExt.toFixed(3),
           sepOverExtent: +sep.toFixed(3), rightIsNegX: cR < cL, ok: cR < cL && sep >= SEP_FLOOR };
}

/* the declaration, off a model file. Two forms are accepted and BOTH are checked when both are
   present, because a model may carry a structured AXES object and a prose `axes:` string and they
   can disagree — which is itself the failure this tool is for. */
function declarationsIn(src) {
  const out = [];
  /* structured: right: '-x' (or "+x"), anywhere inside an AXES-ish object literal */
  const re1 = /right\s*:\s*['"]([+-]x)['"]/g;
  let m; while ((m = re1.exec(src))) out.push({ form: 'structured right:', right: m[1] });
  /* prose: axes: '+x = embryo LEFT, -x = RIGHT, ...'  */
  const re2 = /axes\s*:\s*['"]([^'"]*)['"]/g;
  while ((m = re2.exec(src))) {
    const s = m[1];
    const mm = /([+-])x\s*=\s*(?:\w+\s+)?RIGHT/i.exec(s) || null;
    const nn = /([+-])x\s*=\s*(?:\w+\s+)?LEFT/i.exec(s) || null;
    if (mm) out.push({ form: 'prose axes string', right: mm[1] + 'x', text: s });
    else if (nn) out.push({ form: 'prose axes string (from LEFT)', right: (nn[1] === '+' ? '-' : '+') + 'x', text: s });
  }
  return out;
}

function main() {
  const measured = PAIRS.map(measurePair);
  const allPairsOk = measured.every(p => p.ok);
  const agree = measured.filter(p => p.rightIsNegX).length;
  /* the convention the SCAN DATA states. Not read from anywhere; derived from the majority and then
     required to be unanimous, so a single mislabelled file fails the run instead of flipping it. */
  const measuredRight = agree === measured.length ? '-x' : (agree === 0 ? '+x' : null);

  const files = existsSync(MODELS)
    ? readdirSync(MODELS).filter(f => f.endsWith('.js') && f !== 'render-kit.js').sort()
    : [];
  const models = [];
  for (const f of files) {
    const src = readFileSync(join(MODELS, f), 'utf8');
    const decls = declarationsIn(src);
    const bad = decls.filter(d => d.right !== measuredRight);
    models.push({ model: basename(f), declarations: decls.length, declared: [...new Set(decls.map(d => d.right))],
                  ok: decls.length === 0 ? null : bad.length === 0, disagreeing: bad });
  }

  /* NEGATIVE CASE. RENDER-STANDARD: every assertion gets a deliberately wrong input it must reject.
     Hand the checker a model source whose declaration is flipped and require it to be caught. */
  const negSrc = "const AXES = { right: '" + (measuredRight === '-x' ? '+x' : '-x') + "', left: '-x' };\n" +
                 "  axes: '" + (measuredRight === '-x' ? '-x' : '+x') + " = embryo LEFT, " +
                 (measuredRight === '-x' ? '+x' : '-x') + " = RIGHT',";
  const negDecls = declarationsIn(negSrc);
  const negRejected = negDecls.length >= 2 && negDecls.every(d => d.right !== measuredRight);

  const modelFails = models.filter(m => m.ok === false);
  const pass = allPairsOk && measuredRight !== null && modelFails.length === 0 && negRejected;

  const report = {
    tool: 'prove-corpus-axes',
    measured_convention: measuredRight === null ? 'INCONSISTENT' : measuredRight + ' = RIGHT, ' +
      (measuredRight === '-x' ? '+x' : '-x') + ' = LEFT',
    basis: 'BodyParts3D right/left mesh pairs, read through the same ids the bodyparts3d adapter ' +
           'resolves; that adapter applies no coordinate transform, so the corpus frame is the scan frame',
    substrate: MESHES + ' (lite tier; a centroid SIGN does not depend on decimation)',
    sep_floor: SEP_FLOOR,
    pairs: measured,
    models,
    negative_case: { source: negSrc.replace(/\n/g, ' '), rejected: negRejected },
    pass,
  };
  if (AS_JSON) { console.log(JSON.stringify(report, null, 2)); }
  else {
    console.log('CORPUS AXES, measured from scan data');
    console.log('  convention: ' + report.measured_convention);
    for (const p of measured) {
      console.log('  ' + (p.ok ? 'ok  ' : 'FAIL') + '  ' + p.what.padEnd(22) +
        (p.why ? p.why : 'right Cx ' + String(p.rightCx).padStart(9) + '   left Cx ' + String(p.leftCx).padStart(9) +
        '   sep/extent ' + String(p.sepOverExtent).padStart(6) + '  (floor ' + SEP_FLOOR + ')   [' + p.region + ']'));
    }
    console.log('MODEL DECLARATIONS');
    for (const m of models) {
      console.log('  ' + (m.ok === null ? '--  ' : m.ok ? 'ok  ' : 'FAIL') + '  ' + m.model.padEnd(34) +
        (m.declarations ? m.declarations + ' declaration(s), right = ' + m.declared.join('/') : 'no axes declaration'));
    }
    console.log('NEGATIVE CASE: flipped declaration ' + (negRejected ? 'REJECTED (correct)' : 'ACCEPTED — THE CHECK IS BLIND'));
    console.log(pass ? 'PASS' : 'FAIL');
  }
  process.exit(pass ? 0 : 1);
}
main();
