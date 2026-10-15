#!/usr/bin/env node
/* Build a guided-tour plate page from its folder, check it in a real browser, and write its manifest.
 *   node explainer/tours/build-tour.mjs explainer/library/<course>/<id> [--shots]
 * The folder holds meta.json, tour.js and (optionally) palette.css. Writes <id>.html, <id>.lite.html (the same page:
 * tours carry no baked voice) and manifest.json, which the 3D Tutor maps a student's note onto.
 * Prints TOUR OK with what it checked, or TOUR FAILED with every problem (exit code 1).
 *
 * assembleTour() and manifestOf() are also used by the server's draft builder (import-server/tour-draft.mjs). */
import { readFileSync, writeFileSync, existsSync, copyFileSync } from "node:fs";
import { join, dirname, basename } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
const IS_FILE = import.meta.url.startsWith("file:"), HERE = IS_FILE ? dirname(fileURLToPath(import.meta.url)) : ".";  // the server may load this module from a data: URL
const esc = (s) => String(s == null ? "" : s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
const safe = (s) => String(s).replace(/<\/script/gi, "<\\/script");

export function assembleTour({ meta, script, palette = "", kit = readFileSync(join(HERE, "tour-kit.js"), "utf8"), css = readFileSync(join(HERE, "tour.css"), "utf8") }) {
  const m = meta || {}, cases = Array.isArray(m.cases) ? m.cases : [], strip = m.strip || null;
  const controls = `<button id="play" aria-pressed="true">Pause</button>` + (cases.length ? `<span class="lbl">${esc(m.caseLabel || "Case")}</span><div class="seg" role="group" aria-label="${esc(m.caseAria || "Which case")}" id="cases">${cases.map((c) => `<button data-case="${esc(c.id)}">${esc(c.label)}</button>`).join("")}</div>` : "") + (m.controlsExtra || "");
  return `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover">
<title>${esc(m.title || "Plate")}</title>
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Spectral:ital,wght@0,500;0,600;1,500&family=Public+Sans:wght@400;500;600&family=JetBrains+Mono:wght@400;500&display=swap">
<style>
${css}
${palette}
</style></head><body>
<div class="wrap">
  <header>
    <div class="fig">${esc(m.fig || "Guided tour")}</div>
    <h1>${esc(m.title || "")}${m.titleEm ? `, <em>${esc(m.titleEm)}</em>` : ""}</h1>
    <p class="sub">${esc(m.sub || "")}</p>
  </header>
  <section class="plate" aria-label="${esc((m.title || "Plate") + " tour")}">
    <nav class="stops" id="stops" aria-label="Tour stops"></nav>
    <div class="tour">
      <div class="left"><div class="sticky">
        <div class="stagebox" id="stagebox">
          <svg id="stage" viewBox="${esc((m.stage && m.stage.viewBox) || "0 0 760 720")}" role="img" aria-label="${esc((m.stage && m.stage.aria) || m.title || "")}"></svg>
          <svg class="cone" id="cone" aria-hidden="true"></svg>
          <div class="lens br" id="lensBox">
            <div class="lens-head"><span class="eyebrow" id="lensKicker">Lens</span><span id="lensTitle"></span></div>
            <svg id="lens" viewBox="${esc((m.lens && m.lens.viewBox) || "0 0 400 400")}" role="img" aria-label=""></svg>
          </div>
        </div>
        <div class="controls">${controls}</div>
        ${strip ? `<div class="stripwrap"><svg id="strip" class="strip" viewBox="${esc(strip.viewBox || "0 0 1000 132")}" tabindex="0" role="slider" aria-label="${esc(strip.aria || "Timeline")}" aria-valuemin="${esc(strip.min ?? 0)}" aria-valuemax="${esc(strip.max ?? 100)}" aria-valuenow="${esc(strip.now ?? strip.min ?? 0)}"></svg></div>` : ""}
      </div></div>
      <article class="notes" id="notes">
        <div class="navrow"><button id="prev">◀ Back</button><span class="count" id="count">Stop 1</span><button id="next">Next stop ▶</button></div>
        <div><div class="eyebrow" id="kicker"></div><h2 id="title"></h2></div>
        <div class="now"><b id="nowWeek">${esc(m.nowDefault || "")}</b><span id="nowState"></span></div>
        <div id="body"></div>
      </article>
    </div>
  </section>
  <p class="foot">${esc(m.foot || "")}</p>
</div>
<script>
${safe(kit)}
</script>
<script>
"use strict";
${safe(script)}
</script>
</body></html>`;
}

/* manifest.json for the 3D Tutor (same shape as the physiology plates', so plate-tutor.mjs needs no special case) */
export function manifestOf(meta, tour) {
  const m = meta || {}, t = tour || {};
  return { id: m.id, title: m.title + (m.titleEm ? ", " + m.titleEm : ""), course: m.course || null, kind: "tour", version: m.version || 1,
    conditions: m.conditions || [], phases: (t.stops || []).map((s) => ({ name: s.title, shows: [s.kicker, s.summary].filter(Boolean).join(" · ") })),
    parts: (t.parts || []).map((p) => ({ id: p.id, name: p.name, shows: p.shows || p.name })), readouts: [], lenses: [], whatifs: [], predictions: [],
    concepts: m.concepts || (t.stops || []).map((s) => s.chip), not_shown: m.not_shown || [], stops: (t.stops || []).map((s) => ({ title: s.title, chip: s.chip, grp: s.grp, kicker: s.kicker, lens: s.lens })) };
}

/* the checks every tour must pass, from the page's own report (window.__studio / window.__tour) */
export function tourProblems(report) {
  const r = report || {}, t = r.tour || {}, p = [];
  if (!r.ready) p.push("the page never called TK.connect (or crashed before it)");
  (r.errors || []).forEach((e) => p.push("runtime error: " + e));
  if (r.ready && (r.frames || 0) < 5) p.push("the frame loop is not running");
  const stops = t.stops || [];
  if (stops.length < 6) p.push(`only ${stops.length} stops (a tour needs at least 6)`);
  stops.forEach((s, k) => { if (!s.summary || s.summary.length < 20) p.push(`stop ${k + 1} has no lead sentence (<p class="lead">)`); });
  const reg = t.registered || [], named = (t.parts || []).map((x) => x.id);
  if (reg.length < 4) p.push(`only ${reg.length} parts registered with TK.part (needs at least 4 named structures)`);
  named.filter((id) => !reg.includes(id)).forEach((id) => p.push(`part "${id}" is listed but never drawn with TK.part`));
  (r.stopErrors || []).forEach((e) => p.push(e));
  return p;
}

async function check(htmlFile, { shots = null } = {}) {
  let chromium; try { ({ chromium } = await import("playwright")); } catch (_) { ({ chromium } = (await import("/opt/npm-tools/node_modules/playwright/index.js")).default); }
  const b = await chromium.launch(), out = {};
  for (const [w, h, tag] of [[1366, 900, "laptop"], [390, 844, "phone"]]) {
    const pg = await b.newPage({ viewport: { width: w, height: h }, deviceScaleFactor: w < 800 ? 2 : 1 }); const errs = [];
    pg.on("pageerror", (e) => errs.push(e.message));
    await pg.goto(pathToFileURL(htmlFile).href); await pg.waitForTimeout(1500);
    const stopErrors = [];
    const n = await pg.evaluate(() => ((window.__tour || {}).stops || []).length);
    for (let k = 0; k < n; k++) { const before = errs.length; await pg.evaluate((k) => { const b = document.querySelectorAll("#stops button")[k]; if (b) b.click(); }, k); await pg.waitForTimeout(450);
      if (errs.length > before) stopErrors.push(`stop ${k + 1}: ${errs.slice(before).join(" | ")}`);
      if (shots && tag === "laptop") await pg.screenshot({ path: join(shots, `stop-${k + 1}.png`) }); }
    if (shots) { await pg.evaluate(() => document.querySelectorAll("#stops button")[0].click()); await pg.waitForTimeout(600); await pg.screenshot({ path: join(shots, `${tag}.png`) }); }
    const rep = await pg.evaluate(() => ({ ready: !!(window.__studio && window.__studio.ready), errors: (window.__studio || {}).errors || [], frames: (window.__studio || {}).frames || 0, tour: window.__tour || null }));
    out[tag] = { ...rep, errors: [...new Set([...(rep.errors || []), ...errs])], stopErrors }; await pg.close(); }
  await b.close(); return out;
}

if (IS_FILE && process.argv[1] === fileURLToPath(import.meta.url)) {
  const dir = process.argv[2], shots = process.argv.includes("--shots") ? dir : null;
  if (!dir) { console.error("usage: build-tour.mjs <plate folder> [--shots]"); process.exit(2); }
  const meta = JSON.parse(readFileSync(join(dir, "meta.json"), "utf8")), id = meta.id || basename(dir);
  const html = assembleTour({ meta, script: readFileSync(join(dir, "tour.js"), "utf8"), palette: existsSync(join(dir, "palette.css")) ? readFileSync(join(dir, "palette.css"), "utf8") : "" });
  const file = join(dir, id + ".html"); writeFileSync(file, html); copyFileSync(file, join(dir, id + ".lite.html"));
  const rep = await check(file, { shots }), problems = [...new Set([...tourProblems(rep.laptop), ...tourProblems(rep.phone).map((x) => "phone: " + x)])];
  if (rep.laptop.tour) writeFileSync(join(dir, "manifest.json"), JSON.stringify(manifestOf({ ...meta, id }, rep.laptop.tour), null, 1));
  if (problems.length) { console.log("TOUR FAILED", id); problems.forEach((x) => console.log("  ✗ " + x)); process.exit(1); }
  const t = rep.laptop.tour; console.log(`TOUR OK ${id} · ${t.stops.length} stops · ${t.registered.length} parts (${t.registered.join(", ")}) · ${(html.length / 1024).toFixed(0)} KB · frames ${rep.laptop.frames}`);
}
