// node tools/assemble.mjs <dir>   — builds <dir>/A.html from plan.json + model.js + scene.js + lesson.json and runs every Studio check
import { readFileSync, writeFileSync } from "node:fs"; import { join } from "node:path";
import { checkModel, checkPage, checkSyntax, checkSceneCode } from "./qa.mjs"; import { pageA } from "./shell.mjs";
const dir = process.argv[2]; const rd = (f) => readFileSync(join(dir, f), "utf8");
const plan = JSON.parse(rd("plan.json")), modelCode = rd("model.js"), sceneCode = rd("scene.js"), lesson = JSON.parse(rd("lesson.json"));
const mc = checkModel(modelCode, plan); console.log("MODEL ISSUES:", mc.issues.length ? mc.issues : "none"); console.log("MODEL INFO:", JSON.stringify(mc.info));
const sx = checkSyntax(sceneCode, "createScene").concat(checkSceneCode(sceneCode)); if (sx.length) console.log("SCENE CODE ISSUES:", sx);
const legend = plan.legend || "<span><i class='sw' style='background:var(--cold-hi)'></i>blood / water out</span><span><i class='sw' style='background:var(--hot-hi)'></i>solute / high</span><span>Every motion and number comes from the model</span>";
import { existsSync } from "node:fs";
const shows = existsSync(join(dir, "shows.json")) ? JSON.parse(rd("shows.json")) : {};
const lenses = Object.entries(shows.lenses || {}).map(([id, v]) => ({ id, title: v.title, kicker: v.kicker, shows: v.shows }));
const html = pageA({ meta: { figLabel: plan.figLabel, title: plan.title, titleEm: plan.titleEm, sub: plan.sub }, modelCode, sceneCode, lesson, legend, lenses });
writeFileSync(join(dir, "A.html"), html);
const pw = await import("/opt/npm-tools/node_modules/playwright/index.js"); const chromium = pw.chromium || pw.default.chromium;
const pc = await checkPage(html, { chromium, shots: join(dir, "shot") });
console.log("PAGE ISSUES:", pc.issues.length ? pc.issues : "none"); console.log("PAGE STATE:", JSON.stringify(pc.report && pc.report.state));
// extra stills at several moments, so you can see the motion
const b = await chromium.launch(); const p = await b.newPage({ viewport: { width: 1300, height: 900 } }); await p.setContent(html, { waitUntil: "load" }); await p.waitForTimeout(1500);
await p.click("#play").catch(() => {});
for (const f of [0.05, 0.3, 0.5, 0.75, 0.95]) { await p.evaluate((f) => { const c = document.getElementById("chart"), r = c.getBoundingClientRect(); const x = r.left + r.width * (0.058 + 0.927 * f), y = r.top + r.height / 2; for (const t of ["pointerdown", "pointerup"]) c.dispatchEvent(new PointerEvent(t, { clientX: x, clientY: y, bubbles: true, pointerId: 1 })); }, f); await p.waitForTimeout(300); await p.locator("#stage").screenshot({ path: join(dir, `stage-${Math.round(f * 100)}.png`) }); }
// labels sitting on drawn structures (tubes, vessels, valves, small parts): the label/label overlap check misses these.
// Occlusion-aware: only the topmost painted shape under each sample point counts; big filled surfaces (an organ, a chamber) and moving particles don't.
const hits = await p.evaluate(() => { const svg = document.getElementById("stage"), out = [];
  const skip = new Set(["bg", "zones", "glow", "fx", "labels", "inset"]), layerOf = new Map(), hidden = [];
  svg.querySelectorAll("g[data-layer]").forEach((g) => g.querySelectorAll("*").forEach((e) => layerOf.set(e, g.dataset.layer)));
  const labelsG = svg.querySelector("g[data-layer=labels]"); const texts = labelsG ? [...labelsG.querySelectorAll("text")].filter((t) => t.textContent.trim()) : [];
  const boxes = texts.map((t) => { const r = t.getBoundingClientRect(); return { t, r }; });
  if (labelsG) { labelsG.style.display = "none"; }
  svg.querySelectorAll("circle").forEach((c) => { if (+c.getAttribute("r") < 3.5) { hidden.push([c, c.style.pointerEvents]); c.style.pointerEvents = "none"; } });
  const solid = (e) => { if (!e || !layerOf.has(e) || skip.has(layerOf.get(e))) return false; const cs = getComputedStyle(e); let o = 1, q = e; while (q && q !== svg) { o *= +getComputedStyle(q).opacity; q = q.parentNode; } if (o < 0.3) return false;
    if (cs.stroke !== "none" && (parseFloat(cs.strokeWidth) || 0) >= 2.5 && (cs.fill === "none" || e.tagName === "line")) return true;
    if (cs.fill !== "none") { let bb = { width: 0, height: 0 }; try { bb = e.getBBox(); } catch (_) {} return bb.width * bb.height <= 1600; } return false; };
  for (const { t, r } of boxes) { let n = 0, tot = 0; const where = new Set();
    for (let i = 1; i <= 7; i++) for (let j = 1; j <= 3; j++) { tot++; const e = document.elementFromPoint(r.left + r.width * i / 8, r.top + r.height * j / 4); if (solid(e)) { n++; where.add(layerOf.get(e)); } }
    if (n >= 2) out.push(t.textContent.slice(0, 30) + " (" + Math.round(100 * n / tot) + "% on " + [...where].join("/") + ")"); }
  if (labelsG) labelsG.style.display = ""; hidden.forEach(([c, v]) => (c.style.pointerEvents = v));
  return out; });
console.log("LABELS ON STRUCTURES:", hits.length ? hits : "none");
// ---- lenses: every lens opens cleanly, draws inside its 400 × 400 canvas without overlapping text, and matches shows.json
const LS = await p.evaluate(() => (window.__studio.lenses || []));
const declared = lenses.map((l) => l.id), lensIssues = [];
declared.filter((id) => !LS.includes(id)).forEach((id) => lensIssues.push(`shows.json lists lens "${id}" but the scene never draws it (K.lens)`));
LS.filter((id) => !declared.includes(id)).forEach((id) => lensIssues.push(`the scene draws lens "${id}" but shows.json does not describe it`));
(lesson.steps || []).forEach((st, k) => { if (st.lens && !LS.includes(st.lens)) lensIssues.push(`lesson step ${k + 1} opens unknown lens "${st.lens}"`); });
await p.click("#play").catch(() => {});
const lensProbe = (id) => { const g = [...document.querySelectorAll("#lens > g")].find((x) => x.style.display !== "none"); if (!g) return { n: 0 };
    const n = g.querySelectorAll("path,circle,ellipse,rect,polygon,line,text").length; let out = 0; g.querySelectorAll("path,circle,ellipse,rect,polygon,line").forEach((e) => { if (e.closest("[data-bleed]")) return; try { const b = e.getBBox(); if (b.x < -6 || b.y < -6 || b.x + b.width > 406 || b.y + b.height > 406) out++; } catch (_) {} });
    const vis = (t) => { let q = t; while (q && q !== g) { if (getComputedStyle(q).opacity === "0" || +(q.getAttribute("opacity") ?? 1) <= 0.05) return false; q = q.parentNode; } return true; };
    const T = [...g.querySelectorAll("text")].filter((t) => t.textContent.trim() && vis(t)).map((t) => { const b = t.getBBox(); return { t: t.textContent.slice(0, 24), x: b.x, y: b.y, w: b.width, h: b.height }; });
    const ov = []; for (let a = 0; a < T.length; a++) for (let c = a + 1; c < T.length; c++) { const A = T[a], B = T[c], ox = Math.min(A.x + A.w, B.x + B.w) - Math.max(A.x, B.x), oy = Math.min(A.y + A.h, B.y + B.h) - Math.max(A.y, B.y); if (ox > 2 && oy > 2) ov.push(A.t + " / " + B.t); }
    const offText = T.filter((A) => A.x < -2 || A.y < -2 || A.x + A.w > 402 || A.y + A.h > 402).map((A) => A.t);
    return { n, out, ov, offText, err: (window.__studio.lensErrors || []).filter((e) => e.startsWith(id)) }; };
for (const id of LS) { await p.evaluate((id) => window.__studio.openLens(id), id); await p.waitForTimeout(900);
  // live text changes with the model: probe the lens at seven moments across the cycle, then screenshot it playing
  const acc = { ov: new Set(), offText: new Set() }; let r0 = null;
  for (const f of [0.03, 0.17, 0.31, 0.45, 0.59, 0.73, 0.87]) { await p.evaluate((f) => window.__studio.seek(f), f); await p.waitForTimeout(60);
    const q = await p.evaluate(`(${lensProbe.toString()})(${JSON.stringify(id)})`); r0 = r0 || q; q.ov.forEach((x) => acc.ov.add(x)); q.offText.forEach((x) => acc.offText.add(x)); r0.out = Math.max(r0.out, q.out); r0.err = q.err; }
  await p.click("#play").catch(() => {}); await p.waitForTimeout(500);
  const r = { ...r0, ov: [...acc.ov].slice(0, 6), offText: [...acc.offText] };
  if (r.n < 14) lensIssues.push(`lens "${id}" draws only ${r.n} elements — too thin for a lens`);
  if (r.out > 2) lensIssues.push(`lens "${id}": ${r.out} shapes fall outside the 400 × 400 lens canvas`);
  if (r.offText && r.offText.length) lensIssues.push(`lens "${id}": text runs off the canvas: ${r.offText.join("; ")}`);
  if (r.ov && r.ov.length) lensIssues.push(`lens "${id}": text overlaps: ${r.ov.join("; ")}`);
  if (r.err && r.err.length) lensIssues.push(`lens "${id}" threw: ${r.err.join("; ")}`);
  await p.locator("#split").screenshot({ path: join(dir, `lens-${id}.png`) }); }
if (LS.length) { await p.evaluate(() => window.__studio.closeLens()); await p.waitForTimeout(700); }
console.log("LENS ISSUES:", lensIssues.length ? lensIssues : (LS.length ? "none" : "no lenses"), LS.length ? "(" + LS.length + " lenses: " + LS.join(", ") + ")" : "");
if (LS.length) { const ph = await b.newPage({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2 }); await ph.setContent(html, { waitUntil: "load" }); await ph.waitForTimeout(1200);
  await ph.evaluate((id) => window.__studio.openLens(id), LS[0]); await ph.waitForTimeout(900); await ph.locator(".stage").screenshot({ path: join(dir, "phone-lens.png") }); await ph.close(); }
await b.close(); console.log("wrote", join(dir, "A.html"), "shot.png and stage-*.png");
