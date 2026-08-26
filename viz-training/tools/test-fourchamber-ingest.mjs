#!/usr/bin/env node
/* MedBank · viz-training/tools/test-fourchamber-ingest.mjs
 *
 * Prove the tetrahedral → surface conversion on geometry whose answer is known.
 *
 * ingest-fourchamber.mjs was written without the dataset in hand — it is 22 GB behind a host this
 * environment cannot reach. Shipping a parser and a boundary extractor that have never seen an input, and
 * finding out from a student, is exactly the failure this project has already had twice. So instead:
 * synthesise VTK files whose correct output can be calculated by hand, and assert it.
 *
 * What is checked:
 *   · the VTK legacy reader, in ASCII and big-endian BINARY
 *   · boundary extraction — a cube of tetrahedra must yield exactly 12 triangles, its 6 square faces
 *   · TWO tagged regions sharing a wall — each region's surface must be CLOSED and must INCLUDE the
 *     shared wall. This is the one that matters: the left ventricle's surface includes the septum, so a
 *     shared face is boundary for both regions, not interior to either.
 *   · every surface is watertight (each edge used exactly twice) and outward-facing
 *   · a mesh with no tag array fails loudly rather than writing empty files
 *
 *   node viz-training/tools/test-fourchamber-ingest.mjs
 *
 * Node 18+. No dependencies. Exit code 1 on any failed expectation.
 */
import { writeFileSync, readFileSync, mkdtempSync, existsSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { tmpdir } from 'node:os';
import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const HERE = dirname(fileURLToPath(import.meta.url));
const TOOL = join(HERE, 'ingest-fourchamber.mjs');
if (!existsSync(TOOL)) { console.error('ingest-fourchamber.mjs not found next to this test'); process.exit(2); }
const DIR = mkdtempSync(join(tmpdir(), 'mb4ch-'));

/* ---- a cube split into 6 tetrahedra: the standard Kuhn decomposition ---- */
function cubeTets(base) {
  /* vertices 0..7 of a unit cube, indices offset by `base` */
  const T = [[0, 1, 3, 7], [0, 1, 7, 5], [0, 5, 7, 4], [0, 3, 2, 7], [0, 6, 4, 7], [0, 2, 6, 7]];
  return T.map(t => t.map(i => i + base));
}
function cubePoints(ox, oy, oz) {
  const P = [];
  for (let z = 0; z < 2; z++) for (let y = 0; y < 2; y++) for (let x = 0; x < 2; x++) P.push([ox + x, oy + y, oz + z]);
  return P;                                     // index = x + 2y + 4z
}

function writeVTK(path, points, tets, tags, { binary = false } = {}) {
  const head = `# vtk DataFile Version 3.0\nsynthetic test mesh\n${binary ? 'BINARY' : 'ASCII'}\nDATASET UNSTRUCTURED_GRID\n`;
  if (!binary) {
    let s = head + `POINTS ${points.length} float\n`;
    for (const p of points) s += `${p[0]} ${p[1]} ${p[2]}\n`;
    s += `CELLS ${tets.length} ${tets.length * 5}\n`;
    for (const t of tets) s += `4 ${t.join(' ')}\n`;
    s += `CELL_TYPES ${tets.length}\n` + tets.map(() => '10').join('\n') + '\n';
    if (tags) s += `CELL_DATA ${tets.length}\nSCALARS elemTag int 1\nLOOKUP_TABLE default\n` + tags.join('\n') + '\n';
    writeFileSync(path, s);
    return;
  }
  const parts = [Buffer.from(head + `POINTS ${points.length} float\n`, 'latin1')];
  const pb = Buffer.alloc(points.length * 12);
  points.forEach((p, i) => { pb.writeFloatBE(p[0], i * 12); pb.writeFloatBE(p[1], i * 12 + 4); pb.writeFloatBE(p[2], i * 12 + 8); });
  parts.push(pb, Buffer.from('\n', 'latin1'));
  parts.push(Buffer.from(`CELLS ${tets.length} ${tets.length * 5}\n`, 'latin1'));
  const cb = Buffer.alloc(tets.length * 20);
  tets.forEach((t, i) => { cb.writeInt32BE(4, i * 20); t.forEach((v, k) => cb.writeInt32BE(v, i * 20 + 4 + k * 4)); });
  parts.push(cb, Buffer.from('\n', 'latin1'));
  parts.push(Buffer.from(`CELL_TYPES ${tets.length}\n`, 'latin1'));
  const tb = Buffer.alloc(tets.length * 4);
  tets.forEach((_, i) => tb.writeInt32BE(10, i * 4));
  parts.push(tb, Buffer.from('\n', 'latin1'));
  if (tags) {
    parts.push(Buffer.from(`CELL_DATA ${tets.length}\nSCALARS elemTag int 1\nLOOKUP_TABLE default\n`, 'latin1'));
    const gb = Buffer.alloc(tags.length * 4);
    tags.forEach((g, i) => gb.writeInt32BE(g, i * 4));
    parts.push(gb, Buffer.from('\n', 'latin1'));
  }
  writeFileSync(path, Buffer.concat(parts));
}

function readSTL(path) {
  const b = readFileSync(path);
  const n = b.readUInt32LE(80);
  const tris = [];
  for (let t = 0; t < n; t++) {
    const o = 84 + t * 50;
    const nrm = [b.readFloatLE(o), b.readFloatLE(o + 4), b.readFloatLE(o + 8)];
    const v = [];
    for (let k = 0; k < 3; k++) v.push([b.readFloatLE(o + 12 + k * 12), b.readFloatLE(o + 16 + k * 12), b.readFloatLE(o + 20 + k * 12)]);
    tris.push({ nrm, v });
  }
  return tris;
}

/* watertight: in a closed surface every undirected edge is shared by exactly two triangles */
function watertight(tris) {
  const key = (a, b) => (a < b ? a + '|' + b : b + '|' + a);
  const P = p => p.map(x => x.toFixed(4)).join(',');
  const count = new Map();
  for (const t of tris) {
    for (let i = 0; i < 3; i++) {
      const k = key(P(t.v[i]), P(t.v[(i + 1) % 3]));
      count.set(k, (count.get(k) || 0) + 1);
    }
  }
  for (const c of count.values()) if (c !== 2) return false;
  return true;
}

/* signed volume via the divergence theorem — positive means normals point outward */
function signedVolume(tris) {
  let v = 0;
  for (const t of tris) {
    const [a, b, c] = t.v;
    v += (a[0] * (b[1] * c[2] - b[2] * c[1]) - a[1] * (b[0] * c[2] - b[2] * c[0]) + a[2] * (b[0] * c[1] - b[1] * c[0])) / 6;
  }
  return v;
}

function run(args) {
  return execFileSync(process.execPath, [TOOL, ...args], { encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] });
}

const checks = [];
const ok = (name, pass, detail) => checks.push([name, pass, detail]);

/* ---------------- case 1: one tagged cube, ASCII ---------------- */
{
  const pts = cubePoints(0, 0, 0);
  const tets = cubeTets(0);
  const f = join(DIR, 'one.vtk');
  writeVTK(f, pts, tets, tets.map(() => 1));
  run([f, '--tags', '1', '--out', DIR, '--prefix', 'ONE']);
  const tris = readSTL(join(DIR, 'ONE1.stl'));
  ok('ASCII: a cube of 6 tets → 12 surface triangles', tris.length === 12, `${tris.length} triangles`);
  ok('ASCII: the surface is watertight', watertight(tris));
  ok('ASCII: normals face outward (volume > 0)', signedVolume(tris) > 0, `volume ${signedVolume(tris).toFixed(3)} (cube = 1.000)`);
  ok('ASCII: volume is the cube it came from', Math.abs(signedVolume(tris) - 1) < 1e-4, signedVolume(tris).toFixed(6));
}

/* ---------------- case 2: same thing, BINARY ---------------- */
{
  const pts = cubePoints(0, 0, 0);
  const tets = cubeTets(0);
  const f = join(DIR, 'bin.vtk');
  writeVTK(f, pts, tets, tets.map(() => 1), { binary: true });
  run([f, '--tags', '1', '--out', DIR, '--prefix', 'BIN']);
  const tris = readSTL(join(DIR, 'BIN1.stl'));
  ok('BINARY: reads big-endian and yields the same 12 triangles', tris.length === 12, `${tris.length} triangles`);
  ok('BINARY: same volume as the ASCII path', Math.abs(signedVolume(tris) - 1) < 1e-4, signedVolume(tris).toFixed(6));
}

/* ---------------- case 3: two regions sharing a wall — the septum case ---------------- */
{
  /* two unit cubes side by side, sharing the plane x = 1. Built as separate vertex sets that coincide on
     the shared plane, which is how a tagged simulation mesh actually looks after region labelling. */
  const p1 = cubePoints(0, 0, 0), p2 = cubePoints(1, 0, 0);
  const pts = [...p1, ...p2];
  const tets = [...cubeTets(0), ...cubeTets(8)];
  const tags = [...cubeTets(0).map(() => 1), ...cubeTets(8).map(() => 2)];
  const f = join(DIR, 'two.vtk');
  writeVTK(f, pts, tets, tags);
  run([f, '--tags', '1,2', '--out', DIR, '--prefix', 'TWO']);

  const A = readSTL(join(DIR, 'TWO1.stl')), B = readSTL(join(DIR, 'TWO2.stl'));
  ok('two regions: each is a closed 12-triangle surface', A.length === 12 && B.length === 12, `${A.length} and ${B.length}`);
  ok('two regions: each is watertight', watertight(A) && watertight(B));
  ok('two regions: each keeps its own full volume', Math.abs(signedVolume(A) - 1) < 1e-4 && Math.abs(signedVolume(B) - 1) < 1e-4,
    `${signedVolume(A).toFixed(4)} and ${signedVolume(B).toFixed(4)}`);
  /* the shared wall at x = 1 must appear in BOTH — a ventricle's surface includes the septum */
  const onPlane = tris => tris.filter(t => t.v.every(v => Math.abs(v[0] - 1) < 1e-6)).length;
  ok('two regions: the shared wall belongs to BOTH, not to neither', onPlane(A) === 2 && onPlane(B) === 2,
    `${onPlane(A)} triangles in region 1, ${onPlane(B)} in region 2`);
}

/* ---------------- case 4: scan reports what is really there ---------------- */
{
  const pts = [...cubePoints(0, 0, 0), ...cubePoints(3, 0, 0)];
  const tets = [...cubeTets(0), ...cubeTets(8)];
  const out = (() => {
    const f = join(DIR, 'scan.vtk');
    writeVTK(f, pts, tets, [...cubeTets(0).map(() => 1), ...cubeTets(8).map(() => 16)]);
    return run([f, '--scan']);
  })();
  ok('scan: lists the tags present and names them', /\bLV myocardium\b/.test(out) && /aortic valve plane/.test(out),
    out.includes('LV myocardium') ? 'named tag 1 and tag 16' : 'names missing');
  ok('scan: does not invent tags that are absent', !/RV myocardium/.test(out));
}

/* ---------------- case 5: no tags → refuse, do not write empty files ---------------- */
{
  const f = join(DIR, 'notags.vtk');
  writeVTK(f, cubePoints(0, 0, 0), cubeTets(0), null);
  let failed = false, msg = '';
  try { run([f, '--tags', '1', '--out', DIR, '--prefix', 'NO']); }
  catch (e) { failed = true; msg = String(e.stderr || e.message).split('\n').find(l => /tag/i.test(l)) || ''; }
  ok('a mesh with no tag array is refused, not silently emptied', failed && !existsSync(join(DIR, 'NO1.stl')), msg.trim().slice(0, 60));
}

let bad = 0;
const pad = Math.max(...checks.map(c => c[0].length));
for (const [name, pass, detail] of checks) {
  if (!pass) bad++;
  console.log(`${pass ? '  ok  ' : '  FAIL'}  ${name.padEnd(pad)}  ${detail || ''}`);
}
console.log(`\n${checks.length - bad}/${checks.length} expectations met.`);
if (bad) {
  console.log('\nThe boundary of a tagged region is the set of faces used exactly ONCE within that region.');
  console.log('Get that wrong and a chamber comes out either hollow or missing its septum — and it will');
  console.log('look plausible on screen either way.');
}
process.exit(bad ? 1 : 0);
