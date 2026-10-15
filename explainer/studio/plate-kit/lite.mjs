/* The tutor's copy of a plate: the same page without its baked voice (about 40 KB instead of 1 MB). The 3D Tutor never plays that
 * voice; it speaks the student's own lesson in the MedBank voice. relink.mjs writes it every run; run this alone after a fresh build:
 *   node explainer/studio/plate-kit/lite.mjs explainer/library/physiology/<id> [...]
 * Writes <id>.lite.html next to <id>.html. Without its clips the plate's own "Tutor me" falls back to the app or browser voice. */
import { readFileSync, writeFileSync } from "node:fs";
import { join, basename } from "node:path";
import { fileURLToPath } from "node:url";
export const liteOf = (html) => html.replace(/,"audio":\[[^\]]*\]/g, "").replace(/"audio":\[[^\]]*\],?/g, "");
export function writeLite(dir) { const id = basename(dir), html = readFileSync(join(dir, id + ".html"), "utf8"), lite = liteOf(html);
  if (/data:audio\//.test(lite)) throw new Error(id + ": baked audio left after stripping");
  writeFileSync(join(dir, id + ".lite.html"), lite); return { id, from: html.length, to: lite.length }; }
if (process.argv[1] === fileURLToPath(import.meta.url)) for (const dir of process.argv.slice(2)) { const r = writeLite(dir); console.log("LITE", r.id, (r.from / 1024).toFixed(0) + " KB →", (r.to / 1024).toFixed(0) + " KB"); }
