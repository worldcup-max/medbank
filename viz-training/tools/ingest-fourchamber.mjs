#!/usr/bin/env node
/* MedBank · viz-training/tools/ingest-fourchamber.mjs
 *
 * Close the chamber gap for free.
 *
 * The heart scene has declared three honest gaps since it was authored: no chamber meshes, no aortic
 * valve, no pericardium. BodyParts3D simply does not carry them. The obvious fix was to buy a commercial
 * anatomy provider; the cheaper and more permanent one is this dataset.
 *
 *   Strocchi et al., "A Publicly Available Virtual Cohort of Four-chamber Heart Meshes for Cardiac
 *   Electro-mechanics Simulations", Zenodo 3890034 — CC BY 4.0.
 *
 * CC BY 4.0 means commercial use and re-hosting are permitted with attribution, and there is no
 * share-alike clause. It is a cleaner licence than the BodyParts3D meshes already in the corpus.
 *
 * WHAT THIS IS NOT. These are volumetric TETRAHEDRAL meshes built for electro-mechanics simulation, not
 * surfaces built for a renderer. Every chamber is a region of tagged elements inside one solid mesh. There
 * is no "left ventricle" object to export. This tool does the conversion: it finds the boundary of each
 * tagged region — the faces belonging to exactly one element within that tag — and writes it as a closed
 * surface. That surface is then decimated by the existing pipeline like any other mesh.
 *
 *   1. Download ONE archive (they are per-heart, 700 MB – 1.3 GB): zenodo.org/records/3890034
 *   2. Convert the coarse mesh once, because it ships as EnSight Gold and this tool reads VTK:
 *        pip install meshio
 *        meshio convert 01/coarse/heart.case heart.vtk
 *   3. node viz-training/tools/ingest-fourchamber.mjs heart.vtk --scan
 *   4. node viz-training/tools/ingest-fourchamber.mjs heart.vtk --tags 1,2,3,4,16
 *   5. node viz-training/tools/decimate-meshes.mjs viz-training/meshes --target 8000 --verify \
 *           --out viz-training/meshes-lite
 *
 * USE THE COARSE (1.1 mm) MESH. The fine 0.39 mm version is roughly 25 million elements; the coarse one is
 * near a million and decimates to the same 8,000 triangles regardless. Resolution you are about to throw
 * away is not worth the memory.
 *
 * Element tags, from Strocchi et al. Figure 3:
 *    1 LV myocardium   2 RV myocardium   3 LA myocardium   4 RA myocardium
 *    5 aorta wall      6 pulmonary artery wall
 *    7–13 vein and LAA rings
 *   14 mitral · 15 tricuspid · 16 aortic · 17 pulmonary valve planes
 *   18–24 cut vein planes
 *
 * The three the corpus is missing are 1–4 (chambers) and 16 (aortic valve). --scan first anyway: this tool
 * reports what is actually in YOUR file rather than trusting the table above.
 *
 * Node 18+. No dependencies. Large meshes may want: node --max-old-space-size=4096
 */
import { readFileSync, writeFileSync, existsSync, mkdirSync, statSync } from 'node:fs';
import { join, dirname, basename } from 'node:path';
import { fileURLToPath } from 'node:url';

const HERE = dirname(fileURLToPath(import.meta.url));
const ROOT = join(HERE, '..');

const argv = process.argv.slice(2);
const flag = (n, d) => { const i = argv.indexOf('--' + n); return i < 0 ? d : argv[i + 1]; };
const has = n => argv.includes('--' + n);
const file = argv.find(a => !a.startsWith('--') && (a.endsWith('.vtk') || a.endsWith('.vtu')));
const SCAN = has('scan');
const OUT = flag('out', join(ROOT, 'meshes'));
const PREFIX = flag('prefix', 'S4CH');

/* Names for the tags we expect, used only to make the report readable. An unknown tag is still reported
   and still extractable — the file is the authority, not this table. */
const TAG_NAMES = {
  1: 'LV myocardium', 2: 'RV myocardium', 3: 'LA myocardium', 4: 'RA myocardium',
  5: 'aorta wall', 6: 'pulmonary artery wall',
  7: 'ring — LAA (cropped)', 8: 'ring — pulmonary vein', 9: 'ring — pulmonary vein',
  10: 'ring — pulmonary vein', 11: 'ring — pulmonary vein', 12: 'ring — SVC', 13: 'ring — IVC',
  14: 'mitral valve plane', 15: 'tricuspid valve plane', 16: 'aortic valve plane', 17: 'pulmonary valve plane',
  18: 'cut vein plane', 19: 'cut vein plane', 20: 'cut vein plane', 21: 'cut vein plane',
  22: 'cut vein plane', 23: 'cut vein plane', 24: 'cut vein plane'
};

if (!file || !existsSync(file)) {
  console.log('usage: node viz-training/tools/ingest-fourchamber.mjs <heart.vtk> [--scan] [--tags 1,2,3,4,16] [--out DIR]');
  console.log('\nThe dataset ships EnSight Gold (.case). Convert once, then point this at the .vtk:');
  console.log('  pip install meshio && meshio convert 01/coarse/heart.case heart.vtk');
  process.exit(2);
}

/* ------------------------------------------------------------ VTK legacy reader
   Only what this dataset uses: an UNSTRUCTURED_GRID of tetrahedra with an integer cell tag. ASCII and
   big-endian BINARY both appear in the wild depending on how meshio was invoked, so both are read. */
function readVTK(path) {
  const buf = readFileSync(path);
  const headEnd = Math.min(buf.length, 4096);
  const head = buf.toString('latin1', 0, headEnd);
  if (!/^#\s*vtk\s+DataFile/i.test(head)) throw new Error('not a VTK legacy file (no "# vtk DataFile" header)');
  const binary = /\nBINARY\s*\n/i.test(head);
  if (!/UNSTRUCTURED_GRID/i.test(head)) throw new Error('not an UNSTRUCTURED_GRID — this tool reads tetrahedral volume meshes');

  /* Walk the file section by section. In binary files the numeric blocks are raw bytes between ASCII
     keyword lines, so we track a byte cursor rather than splitting the whole file into lines. */
  let pos = 0;
  const nextLine = () => {
    const nl = buf.indexOf(0x0a, pos);
    if (nl < 0) return null;
    const line = buf.toString('latin1', pos, nl).replace(/\r$/, '');
    pos = nl + 1;
    return line;
  };

  let points = null, cells = null, cellTypes = null, tags = null, nCells = 0;

  for (;;) {
    const line = nextLine();
    if (line === null) break;
    const t = line.trim();
    if (!t) continue;

    let m;
    if ((m = /^POINTS\s+(\d+)\s+(\w+)/i.exec(t))) {
      const n = +m[1], type = m[2].toLowerCase();
      points = new Float64Array(n * 3);
      if (binary) {
        const bytes = type === 'double' ? 8 : 4;
        for (let i = 0; i < n * 3; i++) {
          points[i] = bytes === 8 ? buf.readDoubleBE(pos + i * 8) : buf.readFloatBE(pos + i * 4);
        }
        pos += n * 3 * bytes;
      } else {
        const nums = readAsciiNumbers(n * 3);
        for (let i = 0; i < n * 3; i++) points[i] = nums[i];
      }
      continue;
    }

    if ((m = /^CELLS\s+(\d+)\s+(\d+)/i.exec(t))) {
      nCells = +m[1];
      const size = +m[2];
      const flat = binary ? readBinaryInts(size) : readAsciiInts(size);
      cells = new Int32Array(nCells * 4);
      let k = 0, bad = 0;
      for (let c = 0; c < nCells; c++) {
        const nv = flat[k++];
        if (nv !== 4) { bad++; k += nv; cells[c * 4] = cells[c * 4 + 1] = cells[c * 4 + 2] = cells[c * 4 + 3] = -1; continue; }
        cells[c * 4] = flat[k++]; cells[c * 4 + 1] = flat[k++]; cells[c * 4 + 2] = flat[k++]; cells[c * 4 + 3] = flat[k++];
      }
      if (bad) console.error(`  note: ${bad} non-tetrahedral cell(s) skipped`);
      continue;
    }

    if ((m = /^CELL_TYPES\s+(\d+)/i.exec(t))) {
      const n = +m[1];
      cellTypes = binary ? readBinaryInts(n) : readAsciiInts(n);
      continue;
    }

    if (/^CELL_DATA\s+\d+/i.test(t)) continue;
    if ((m = /^SCALARS\s+(\S+)\s+(\w+)/i.exec(t))) {
      const name = m[1], type = m[2].toLowerCase();
      const lut = nextLine();                         // LOOKUP_TABLE default
      if (!/LOOKUP_TABLE/i.test(lut || '')) throw new Error('SCALARS without LOOKUP_TABLE');
      const isInt = /int|long|short|char|unsigned/.test(type);
      const vals = binary
        ? (isInt ? readBinaryInts(nCells) : readBinaryFloats(nCells, type === 'double' ? 8 : 4))
        : readAsciiNumbers(nCells);
      /* The tag array is whichever integer cell scalar the converter produced — meshio names it
         "elemTag", "gmsh:physical", "CellEntityIds" or just "tag" depending on the route in. Take the
         first integer-valued one and say which was chosen, rather than guessing at a name. */
      if (!tags && isInt) { tags = Int32Array.from(vals); tags.__name = name; }
      continue;
    }
    if (/^POINT_DATA\s+\d+/i.test(t)) break;          // nothing past here matters to us
  }

  function readAsciiNumbers(n) {
    const out = new Float64Array(n);
    let got = 0;
    while (got < n) {
      const line = nextLine();
      if (line === null) throw new Error('file ended mid-array');
      for (const part of line.trim().split(/\s+/)) {
        if (!part) continue;
        out[got++] = +part;
        if (got === n) break;
      }
    }
    return out;
  }
  function readAsciiInts(n) { const f = readAsciiNumbers(n); const o = new Int32Array(n); for (let i = 0; i < n; i++) o[i] = f[i] | 0; return o; }
  function readBinaryInts(n) {
    const o = new Int32Array(n);
    for (let i = 0; i < n; i++) o[i] = buf.readInt32BE(pos + i * 4);
    pos += n * 4;
    if (buf[pos] === 0x0a) pos++;
    return o;
  }
  function readBinaryFloats(n, bytes) {
    const o = new Float64Array(n);
    for (let i = 0; i < n; i++) o[i] = bytes === 8 ? buf.readDoubleBE(pos + i * 8) : buf.readFloatBE(pos + i * 4);
    pos += n * bytes;
    if (buf[pos] === 0x0a) pos++;
    return o;
  }

  if (!points || !cells) throw new Error('no POINTS or CELLS found');
  if (!tags) throw new Error('no integer cell scalar found — the element tags are what identify the chambers, so there is nothing to extract without them');
  return { points, cells, tags, nCells, cellTypes };
}

/* ------------------------------------------------------- boundary of a tagged region
   A tetrahedron has four triangular faces. Inside a solid region every face is shared by exactly two
   elements; on the surface a face belongs to just one. So: list every face of every element carrying this
   tag, and keep the ones that appear once. That yields a closed surface — including the wall a chamber
   shares with its neighbour, which is correct: the left ventricle's surface does include the septum.

   Done by sorting rather than hashing. A million elements is four million faces, and a Map with four
   million string keys is gigabytes; three Int32Arrays and an index sort is a few hundred megabytes and
   several times faster. */
function boundaryOf(cells, tags, tag) {
  let n = 0;
  for (let c = 0; c < tags.length; c++) if (tags[c] === tag && cells[c * 4] >= 0) n++;
  if (!n) return { tris: new Int32Array(0), elements: 0 };

  const F = 4 * n;
  const a = new Int32Array(F), b = new Int32Array(F), d = new Int32Array(F);
  const FACE = [[0, 1, 2], [0, 1, 3], [0, 2, 3], [1, 2, 3]];
  let f = 0;
  for (let c = 0; c < tags.length; c++) {
    if (tags[c] !== tag || cells[c * 4] < 0) continue;
    const v = [cells[c * 4], cells[c * 4 + 1], cells[c * 4 + 2], cells[c * 4 + 3]];
    for (const [i, j, k] of FACE) {
      let x = v[i], y = v[j], z = v[k], t;
      if (x > y) { t = x; x = y; y = t; }
      if (y > z) { t = y; y = z; z = t; }
      if (x > y) { t = x; x = y; y = t; }
      a[f] = x; b[f] = y; d[f] = z; f++;
    }
  }

  const order = new Int32Array(F);
  for (let i = 0; i < F; i++) order[i] = i;
  /* Array.prototype.sort on a typed array of indices: the comparator is the cost, so keep it branch-cheap. */
  const idx = Array.from(order);
  idx.sort((p, q) => (a[p] - a[q]) || (b[p] - b[q]) || (d[p] - d[q]));

  const out = [];
  for (let i = 0; i < F;) {
    let j = i + 1;
    while (j < F && a[idx[j]] === a[idx[i]] && b[idx[j]] === b[idx[i]] && d[idx[j]] === d[idx[i]]) j++;
    if (j - i === 1) { const p = idx[i]; out.push(a[p], b[p], d[p]); }   // used once → surface
    i = j;
  }
  return { tris: Int32Array.from(out), elements: n };
}

/* Is the extracted surface actually closed?
   A chamber wall that is watertight renders and decimates cleanly. Open edges mean the tetrahedral mesh
   had coincident-but-distinct nodes at that seam — two nodes at the same coordinates with different
   indices — so faces that meet in space do not meet by index. Conforming simulation meshes should not
   have any, which makes a non-zero count here worth knowing about before the surface goes further. It is
   reported, not fixed: the decimator welds by position on the way in, so this heals downstream, and
   silently merging nodes here could join two structures that are meant to stay apart. */
function openEdges(tris) {
  const seen = new Map();
  for (let t = 0; t < tris.length; t += 3) {
    for (let i = 0; i < 3; i++) {
      const a = tris[t + i], b = tris[t + (i + 1) % 3];
      const k = a < b ? a * 4294967296 + b : b * 4294967296 + a;
      seen.set(k, (seen.get(k) || 0) + 1);
    }
  }
  let open = 0;
  for (const c of seen.values()) if (c !== 2) open++;
  return open;
}

/* ------------------------------------------------------------------ STL out
   Winding is fixed so every face points away from the region's centroid. The tetrahedral connectivity
   carries no consistent outward orientation once faces are sorted, and a surface lit from the inside
   reads as a hole. */
function writeSTL(path, points, tris, header) {
  const n = tris.length / 3;
  let cx = 0, cy = 0, cz = 0, seen = new Set();
  for (let i = 0; i < tris.length; i++) seen.add(tris[i]);
  for (const v of seen) { cx += points[v * 3]; cy += points[v * 3 + 1]; cz += points[v * 3 + 2]; }
  cx /= seen.size; cy /= seen.size; cz /= seen.size;

  const buf = Buffer.alloc(84 + n * 50);
  buf.write((header || 'MedBank · Strocchi et al. four-chamber cohort (CC BY 4.0)').slice(0, 79), 0, 'latin1');
  buf.writeUInt32LE(n, 80);
  let o = 84;
  for (let t = 0; t < n; t++) {
    let i = tris[t * 3], j = tris[t * 3 + 1], k = tris[t * 3 + 2];
    let ax = points[i * 3], ay = points[i * 3 + 1], az = points[i * 3 + 2];
    let bx = points[j * 3], by = points[j * 3 + 1], bz = points[j * 3 + 2];
    let cx2 = points[k * 3], cy2 = points[k * 3 + 1], cz2 = points[k * 3 + 2];
    let ux = bx - ax, uy = by - ay, uz = bz - az;
    let vx = cx2 - ax, vy = cy2 - ay, vz = cz2 - az;
    let nx = uy * vz - uz * vy, ny = uz * vx - ux * vz, nz = ux * vy - uy * vx;
    /* outward test: does the normal agree with (face centre − region centre)? */
    const mx = (ax + bx + cx2) / 3 - cx, my = (ay + by + cy2) / 3 - cy, mz = (az + bz + cz2) / 3 - cz;
    if (nx * mx + ny * my + nz * mz < 0) {
      let tx = bx, ty = by, tz = bz; bx = cx2; by = cy2; bz = cz2; cx2 = tx; cy2 = ty; cz2 = tz;
      nx = -nx; ny = -ny; nz = -nz;
    }
    const len = Math.hypot(nx, ny, nz) || 1;
    buf.writeFloatLE(nx / len, o); buf.writeFloatLE(ny / len, o + 4); buf.writeFloatLE(nz / len, o + 8);
    buf.writeFloatLE(ax, o + 12); buf.writeFloatLE(ay, o + 16); buf.writeFloatLE(az, o + 20);
    buf.writeFloatLE(bx, o + 24); buf.writeFloatLE(by, o + 28); buf.writeFloatLE(bz, o + 32);
    buf.writeFloatLE(cx2, o + 36); buf.writeFloatLE(cy2, o + 40); buf.writeFloatLE(cz2, o + 44);
    buf.writeUInt16LE(0, o + 48);
    o += 50;
  }
  writeFileSync(path, buf);
  return buf.length;
}

/* ------------------------------------------------------------------------ run */
console.log(`\nreading ${basename(file)} (${(statSync(file).size / 1048576).toFixed(0)} MB)…`);
const mesh = readVTK(file);
console.log(`  ${(mesh.points.length / 3).toLocaleString()} points · ${mesh.nCells.toLocaleString()} elements · tag array "${mesh.tags.__name}"\n`);

const present = new Map();
for (let c = 0; c < mesh.tags.length; c++) present.set(mesh.tags[c], (present.get(mesh.tags[c]) || 0) + 1);
const tagList = [...present.keys()].sort((x, y) => x - y);

if (SCAN || !flag('tags', null)) {
  console.log('tag   elements    what Strocchi et al. say it is');
  console.log('─'.repeat(64));
  for (const t of tagList) {
    console.log(`${String(t).padStart(3)}  ${String(present.get(t)).padStart(9)}    ${TAG_NAMES[t] || '(not in the published table — check before using)'}`);
  }
  console.log('─'.repeat(64));
  console.log(`\n${tagList.length} tags. The corpus is missing chambers (1–4) and the aortic valve (16).`);
  console.log(`\nExtract them with:\n  node viz-training/tools/ingest-fourchamber.mjs ${basename(file)} --tags 1,2,3,4,16\n`);
  process.exit(0);
}

const want = String(flag('tags', '')).split(',').map(x => parseInt(x, 10)).filter(x => !isNaN(x));
if (!existsSync(OUT)) mkdirSync(OUT, { recursive: true });

console.log('tag   what                       elements    triangles   closed?   file');
console.log('─'.repeat(96));
let wrote = 0, bytes = 0;
for (const t of want) {
  if (!present.has(t)) { console.log(`${String(t).padStart(3)}  NOT PRESENT in this file — skipped`); continue; }
  const { tris, elements } = boundaryOf(mesh.cells, mesh.tags, t);
  if (!tris.length) { console.log(`${String(t).padStart(3)}  produced no surface — skipped`); continue; }
  const name = `${PREFIX}${t}.stl`;
  const size = writeSTL(join(OUT, name), mesh.points, tris);
  const open = openEdges(tris);
  wrote++; bytes += size;
  console.log(`${String(t).padStart(3)}  ${(TAG_NAMES[t] || '?').padEnd(24)}  ${String(elements).padStart(9)}  ${String(tris.length / 3).padStart(11)}   ${(open ? open + ' open' : 'closed').padStart(8)}   ${name}  ${(size / 1048576).toFixed(1)} MB`);
}
console.log('─'.repeat(96));
console.log(`${wrote} surface(s) · ${(bytes / 1048576).toFixed(1)} MB raw\n`);
console.log('These are full-resolution boundaries. Decimate before they go anywhere near a student:');
console.log(`  node viz-training/tools/decimate-meshes.mjs ${OUT} --target 8000 --verify --out ${OUT}-lite\n`);
console.log('Attribution to carry with the geometry, per CC BY 4.0:');
console.log('  Strocchi et al., "A Publicly Available Virtual Cohort of Four-chamber Heart Meshes for');
console.log('  Cardiac Electro-mechanics Simulations", doi:10.5281/zenodo.3890034, CC BY 4.0.\n');
