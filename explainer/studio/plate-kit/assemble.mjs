// node tools/assemble.mjs <dir>   — builds <dir>/A.html from plan.json + model.js + scene.js + lesson.json and runs every Studio check
import { readFileSync, writeFileSync } from "node:fs"; import { join } from "node:path";
import { checkModel, checkPage, checkSyntax, checkSceneCode } from "./qa.mjs"; import { pageA } from "./shell.mjs";
const dir = process.argv[2]; const rd = (f) => readFileSync(join(dir, f), "utf8");
const plan = JSON.parse(rd("plan.json")), modelCode = rd("model.js"), sceneCode = rd("scene.js"), lesson = JSON.parse(rd("lesson.json"));
const mc = checkModel(modelCode, plan); console.log("MODEL ISSUES:", mc.issues.length ? mc.issues : "none"); console.log("MODEL INFO:", JSON.stringify(mc.info));
const sx = checkSyntax(sceneCode, "createScene").concat(checkSceneCode(sceneCode)); if (sx.length) console.log("SCENE CODE ISSUES:", sx);
const legend = "<span><i class='sw' style='background:var(--cold-hi)'></i>blood / water out</span><span><i class='sw' style='background:var(--hot-hi)'></i>solute / high</span><span>Every motion and number comes from the model</span>";
const html = pageA({ meta: { figLabel: plan.figLabel, title: plan.title, titleEm: plan.titleEm, sub: plan.sub }, modelCode, sceneCode, lesson, legend });
writeFileSync(join(dir, "A.html"), html);
const pw = await import("/opt/npm-tools/node_modules/playwright/index.js"); const chromium = pw.chromium || pw.default.chromium;
const pc = await checkPage(html, { chromium, shots: join(dir, "shot") });
console.log("PAGE ISSUES:", pc.issues.length ? pc.issues : "none"); console.log("PAGE STATE:", JSON.stringify(pc.report && pc.report.state));
// extra stills at several moments, so you can see the motion
const b = await chromium.launch(); const p = await b.newPage({ viewport: { width: 1300, height: 900 } }); await p.setContent(html, { waitUntil: "load" }); await p.waitForTimeout(1500);
await p.click("#play").catch(() => {});
for (const f of [0.05, 0.3, 0.5, 0.75, 0.95]) { await p.evaluate((f) => { const c = document.getElementById("chart"), r = c.getBoundingClientRect(); const x = r.left + r.width * (0.058 + 0.927 * f), y = r.top + r.height / 2; for (const t of ["pointerdown", "pointerup"]) c.dispatchEvent(new PointerEvent(t, { clientX: x, clientY: y, bubbles: true, pointerId: 1 })); }, f); await p.waitForTimeout(300); await p.locator("#stage").screenshot({ path: join(dir, `stage-${Math.round(f * 100)}.png`) }); }
await b.close(); console.log("wrote", join(dir, "A.html"), "shot.png and stage-*.png");
