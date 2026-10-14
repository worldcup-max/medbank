// node tools/assemble.mjs <dir>   — builds <dir>/A.html from plan.json + model.js + scene.js + lesson.json and runs every Studio check
import { readFileSync, writeFileSync } from "node:fs"; import { join } from "node:path";
import { checkModel, checkPage, checkSyntax, checkSceneCode } from "./qa.mjs"; import { pageA } from "./shell.mjs";
const dir = process.argv[2]; const rd = (f) => readFileSync(join(dir, f), "utf8");
const plan = JSON.parse(rd("plan.json")), modelCode = rd("model.js"), sceneCode = rd("scene.js"), lesson = JSON.parse(rd("lesson.json"));
const mc = checkModel(modelCode, plan); console.log("MODEL ISSUES:", mc.issues.length ? mc.issues : "none"); console.log("MODEL INFO:", JSON.stringify(mc.info));
const sx = checkSyntax(sceneCode, "createScene").concat(checkSceneCode(sceneCode)); if (sx.length) console.log("SCENE CODE ISSUES:", sx);
const legend = plan.legend || "<span><i class='sw' style='background:var(--cold-hi)'></i>blood / water out</span><span><i class='sw' style='background:var(--hot-hi)'></i>solute / high</span><span>Every motion and number comes from the model</span>";
const html = pageA({ meta: { figLabel: plan.figLabel, title: plan.title, titleEm: plan.titleEm, sub: plan.sub }, modelCode, sceneCode, lesson, legend });
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
await b.close(); console.log("wrote", join(dir, "A.html"), "shot.png and stage-*.png");
