#!/usr/bin/env node
/* MedBank Visualize — mesh ingest (self-host)
 * Downloads the per-part anatomy meshes referenced by scenes/*.json into ./viz-meshes/FMA<id>.stl,
 * so the app serves them from OUR store (never a flaky public CDN). Run this on your machine or server
 * (full network) — NOT inside the sandbox. No dependencies (Node 18+, built-in fetch).
 *
 *   node viz-training/tools/ingest-meshes.mjs
 *   node viz-training/tools/ingest-meshes.mjs --only FMA7096,FMA7098
 *
 * It also prints a REPORT of which FMA files exist vs 404 — that's the ground truth we couldn't get
 * from the sandbox. Missing ones are logged so we can pick a different id or source.
 *
 * After it runs, upload ./viz-meshes/ to your store (e.g. Supabase Storage bucket `viz-meshes`, public),
 * and point scene `url`s at https://<project>.supabase.co/storage/v1/object/public/viz-meshes/FMA<id>.stl
 */
import { readdir, readFile, mkdir, writeFile, stat } from "node:fs/promises";
import { existsSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");     // viz-training/
const SCENES = path.join(ROOT, "scenes");
const OUT = path.join(ROOT, "viz-meshes");

const STLDIR = "assets/BodyParts3D_data/stl";                        // real location in the repo
const SOURCES = (id) => [
  `https://raw.githubusercontent.com/Kevin-Mattheus-Moerman/BodyParts3D/main/${STLDIR}/${id}.stl`,
  `https://cdn.jsdelivr.net/gh/Kevin-Mattheus-Moerman/BodyParts3D@main/${STLDIR}/${id}.stl`
];

const only = (() => {
  const i = process.argv.indexOf("--only");
  return i > -1 && process.argv[i + 1] ? new Set(process.argv[i + 1].split(",")) : null;
})();

function looksLikeSTL(buf) {
  if (buf.length < 200) return false;                                  // too small = 404 page / empty
  const head = buf.subarray(0, 6).toString("latin1").toLowerCase();
  if (head.startsWith("solid")) return true;                           // ASCII STL
  if (head.startsWith("<") || head.includes("404")) return false;      // HTML error
  const tris = buf.readUInt32LE(80);                                   // binary STL triangle count
  return buf.length === 84 + tris * 50 || buf.length > 134;            // header(84)+50/triangle
}

async function fetchMesh(id) {
  const tried = [];
  for (const url of SOURCES(id)) {
    try {
      const r = await fetch(url, { redirect: "follow" });
      const buf = Buffer.from(await r.arrayBuffer());
      tried.push(`${r.status} ${(r.headers.get("content-type")||"?")} ${buf.length}B`);
      if (r.ok && looksLikeSTL(buf)) return { buf, url };
    } catch (e) { tried.push("neterr:" + (e.message||e)); }
  }
  return { fail: true, tried };
}

// --diagnose FMA7088 : print exactly what each source returns (status, type, first bytes)
async function diagnose(id) {
  console.log(`\nDIAGNOSE ${id}\n`);
  for (const url of SOURCES(id)) {
    try {
      const r = await fetch(url, { redirect: "follow" });
      const buf = Buffer.from(await r.arrayBuffer());
      const head = buf.subarray(0, 160).toString("latin1").replace(/\s+/g, " ");
      console.log(`URL   ${url}`);
      console.log(`  status ${r.status} ${r.statusText}`);
      console.log(`  type   ${r.headers.get("content-type")}`);
      console.log(`  length ${buf.length} bytes`);
      console.log(`  first  ${head}\n`);
    } catch (e) { console.log(`URL   ${url}\n  neterr: ${e.message||e}\n`); }
  }
}

async function collectRefs() {
  const refs = new Map();                                             // id -> {label, scenes:Set}
  if (!existsSync(SCENES)) return refs;
  for (const f of (await readdir(SCENES)).filter((f) => f.endsWith(".json"))) {
    const scene = JSON.parse(await readFile(path.join(SCENES, f), "utf8"));
    const add = (ref, label) => {
      if (!ref || !/^FMA\d+$/.test(ref)) return;
      if (!refs.has(ref)) refs.set(ref, { label: label || ref, scenes: new Set() });
      refs.get(ref).scenes.add(f);
    };
    (scene.meshes || []).forEach((m) => add(m.ref, m.label));
    (scene.parts || []).forEach((p) => p.mode === "mesh" && add(p.ref, p.label));
  }
  return refs;
}

// --tree : list the real repo structure so we can see the actual folder + filenames
async function tree() {
  const url = "https://api.github.com/repos/Kevin-Mattheus-Moerman/BodyParts3D/git/trees/main?recursive=1";
  const r = await fetch(url, { headers: { "User-Agent": "medbank-ingest" } });
  if (!r.ok) { console.log(`GitHub API ${r.status} ${r.statusText}`); return; }
  const j = await r.json();
  const paths = (j.tree || []).map((n) => n.path);
  const stls = paths.filter((p) => p.toLowerCase().endsWith(".stl"));
  const topDirs = [...new Set(paths.map((p) => p.split("/")[0]))];
  console.log(`total entries: ${paths.length}${j.truncated ? " (TRUNCATED)" : ""}`);
  console.log(`top-level: ${topDirs.join(", ")}`);
  console.log(`.stl files: ${stls.length}`);
  console.log(`\nsample .stl paths:`);
  stls.slice(0, 15).forEach((p) => console.log("  " + p));
  console.log(`\nany heart-ish names:`);
  paths.filter((p) => /heart|atri|ventric|aorta|FMA7088|FMA7096|FMA7101/i.test(p)).slice(0, 20).forEach((p) => console.log("  " + p));
}

// --find <keyword> : which structures matching <keyword> actually exist in this dataset (name -> FMA id)
async function find(keyword) {
  const kw = (keyword || "heart").toLowerCase();
  const tr = await (await fetch("https://api.github.com/repos/Kevin-Mattheus-Moerman/BodyParts3D/git/trees/main?recursive=1", { headers: { "User-Agent": "medbank-ingest" } })).json();
  const paths = (tr.tree || []).map((n) => n.path);
  const avail = new Set(paths.filter((p) => p.startsWith(STLDIR) && p.endsWith(".stl")).map((p) => p.split("/").pop().replace(/\.stl$/i, "")));
  const mapFiles = paths.filter((p) => p.startsWith("assets/") && /\.(txt|csv|tsv)$/i.test(p));
  console.log(`available meshes: ${avail.size} · index files: ${mapFiles.join(", ") || "(none found)"}\n`);
  const hits = [];
  for (const mf of mapFiles) {
    let txt = "";
    try { txt = await (await fetch(`https://raw.githubusercontent.com/Kevin-Mattheus-Moerman/BodyParts3D/main/${mf}`)).text(); } catch { continue; }
    for (const line of txt.split(/\r?\n/)) {
      const m = line.match(/\b((?:FMA|BP)?\d{2,})\b[^\w]+(.+\S)/i);
      if (!m) continue;
      let id = m[1].toUpperCase(); if (/^\d/.test(id)) id = "FMA" + id;
      const name = m[2].trim();
      if (name.toLowerCase().includes(kw)) hits.push({ id, name, have: avail.has(id) });
    }
  }
  const seen = new Set();
  const uniq = hits.filter((h) => (seen.has(h.id + h.name) ? false : seen.add(h.id + h.name)));
  console.log(`matches for "${kw}" (✓ = mesh present in this dataset):`);
  uniq.forEach((h) => console.log(`  ${h.have ? "✓" : "·"} ${h.id}  ${h.name}`));
  const have = uniq.filter((h) => h.have);
  console.log(`\n${have.length} of ${uniq.length} matched structures have a mesh here. Send me this list.`);
}

// --catalog : write EVERY available mesh (id + English name) to viz-training/available-meshes.json
async function catalog() {
  const tr = await (await fetch("https://api.github.com/repos/Kevin-Mattheus-Moerman/BodyParts3D/git/trees/main?recursive=1", { headers: { "User-Agent": "medbank-ingest" } })).json();
  const paths = (tr.tree || []).map((n) => n.path);
  const avail = [...new Set(paths.filter((p) => p.startsWith(STLDIR) && p.endsWith(".stl")).map((p) => p.split("/").pop().replace(/\.stl$/i, "")))];
  // build id -> name from FMA.csv (cleanest), fallback parts_list_e.txt
  const name = new Map();
  for (const mf of ["assets/BodyParts3D_data/FMA.csv", "assets/BodyParts3D_data/parts_list_e.txt"]) {
    let txt = ""; try { txt = await (await fetch(`https://raw.githubusercontent.com/Kevin-Mattheus-Moerman/BodyParts3D/main/${mf}`)).text(); } catch { continue; }
    for (const line of txt.split(/\r?\n/)) {
      const m = line.match(/((?:FMA|BP)\d+[a-z]*)[,\t ]+["']?([^",\t]+)/i);
      if (m && !name.has(m[1].toUpperCase())) name.set(m[1].toUpperCase(), m[2].trim());
    }
  }
  const list = avail.map((id) => ({ id, name: name.get(id) || null })).sort((a, b) => (a.name || "zzz").localeCompare(b.name || "zzz"));
  const out = path.join(ROOT, "available-meshes.json");
  await writeFile(out, JSON.stringify({ count: list.length, dir: STLDIR, meshes: list }, null, 1));
  const named = list.filter((x) => x.name).length;
  console.log(`Wrote ${path.relative(process.cwd(), out)} — ${list.length} meshes (${named} with names).`);
  console.log(`Commit that file (or just tell me it's written) and I'll design scenes from exactly what's available.`);
}

(async () => {
  if (process.argv.includes("--catalog")) { await catalog(); return; }
  const fi = process.argv.indexOf("--find");
  if (fi > -1) { await find(process.argv[fi + 1] || "heart"); return; }
  if (process.argv.includes("--tree")) { await tree(); return; }
  // diagnose mode: node ingest-meshes.mjs --diagnose FMA7088
  const di = process.argv.indexOf("--diagnose");
  if (di > -1) { await diagnose(process.argv[di + 1] || "FMA7088"); return; }

  await mkdir(OUT, { recursive: true });
  const refs = await collectRefs();
  let ids = [...refs.keys()];
  if (only) ids = ids.filter((id) => only.has(id));
  if (!ids.length) { console.log("No FMA mesh refs found in scenes/*.json. Author a scene first."); return; }

  console.log(`Ingesting ${ids.length} meshes → ${path.relative(process.cwd(), OUT)}/\n`);
  const ok = [], missing = [];
  for (const id of ids) {
    const dest = path.join(OUT, `${id}.stl`);
    if (existsSync(dest) && (await stat(dest)).size > 200) { console.log(`· ${id}  (already have it)`); ok.push(id); continue; }
    process.stdout.write(`· ${id}  ${refs.get(id).label} … `);
    const got = await fetchMesh(id);
    if (got && got.buf) { await writeFile(dest, got.buf); console.log(`OK  (${(got.buf.length / 1024).toFixed(0)} KB)`); ok.push(id); }
    else { console.log(`MISSING  [${(got.tried||[]).join(" | ")}]`); missing.push(id); }
  }

  console.log(`\n== REPORT ==\n  hosted: ${ok.length}/${ids.length}`);
  if (missing.length) {
    console.log(`  MISSING (${missing.length}) — pick another FMA id or source for these:`);
    missing.forEach((id) => console.log(`    - ${id}  ${refs.get(id).label}  [used by ${[...refs.get(id).scenes].join(", ")}]`));
  }
  console.log(`\nNext: upload ${path.relative(process.cwd(), OUT)}/ to your store (Supabase Storage bucket 'viz-meshes', public),`);
  console.log(`then set scene url base to  https://<project>.supabase.co/storage/v1/object/public/viz-meshes/`);
})();
