// node tools/compare.mjs ref.html mine.html outPrefix  → side-by-side stage screenshots, light + dark, at the same moments
import { readFileSync } from "node:fs";
const [ref, mine, out] = process.argv.slice(2);
const pw = await import("/opt/npm-tools/node_modules/playwright/index.js"); const chromium = pw.chromium || pw.default.chromium;
const b = await chromium.launch();
for (const scheme of ["light", "dark"]) for (const [name, file, sel] of [["ref", ref, "#heart"], ["mine", mine, "#stage"]]) {
  const p = await b.newPage({ viewport: { width: 1300, height: 1000 }, colorScheme: scheme });
  await p.setContent(readFileSync(file, "utf8"), { waitUntil: "load" }); await p.waitForTimeout(2000);
  await p.click("#play").catch(() => {});
  // scrub to ejection (t ≈ 0.42 of 0.8 s)
  await p.evaluate(() => { const c = document.getElementById("chart"), r = c.getBoundingClientRect(); const x = r.left + r.width * (0.058 + 0.927 * 0.52), y = r.top + r.height / 2; for (const t of ["pointerdown", "pointerup"]) c.dispatchEvent(new PointerEvent(t, { clientX: x, clientY: y, bubbles: true, pointerId: 1 })); });
  await p.waitForTimeout(400);
  await p.locator(".plate.main").screenshot({ path: `${out}-${scheme}-${name}.png` }); await p.close(); }
await b.close();
