// node tools/stepshots.mjs <page.html> <outPrefix> [width] — clicks every tutor step and screenshots the stage while it loops
import { readFileSync } from "node:fs";
const [file, out, w] = process.argv.slice(2);
const pw = await import("/opt/npm-tools/node_modules/playwright/index.js"); const chromium = pw.chromium || pw.default.chromium;
const b = await chromium.launch(); const p = await b.newPage({ viewport: { width: +(w || 1300), height: 1000 }, deviceScaleFactor: +(w || 1300) < 600 ? 2 : 1 }); const errs = []; p.on("pageerror", (e) => errs.push(e.message));
await p.setContent(readFileSync(file, "utf8"), { waitUntil: "load" }); await p.waitForTimeout(1200); await p.click("#mute");
const n = await p.locator("#steps button").count();
for (let k = 0; k < n; k++) { await p.locator("#steps button").nth(k).click(); await p.waitForTimeout(1800);
  const st = await p.evaluate(() => ({ phase: document.getElementById("phase").textContent, lens: window.__studio.lens, loop: !document.getElementById("loop").hidden }));
  console.log(k + 1, st.phase, "| lens:", st.lens, "| loop:", st.loop); await p.locator(".stage").screenshot({ path: `${out}-${k + 1}.png` }); }
console.log("errors:", errs.concat(await p.evaluate(() => window.__studio.errors))); await b.close();
