/* Refresh an already-built plate page without re-voicing it: swaps in the current shell runtime and the plate's current
 * page CSS, the plate's model.js (and scene.js if asked), keeping kit, lenses, lesson and the baked voice exactly as built.
 *   node explainer/studio/plate-kit/relink.mjs explainer/library/physiology/<id> [--scene]
 * Prints RELINKED with what changed, or why not. Safe to re-run. */
import { readFileSync, writeFileSync } from "node:fs";
import { join, basename } from "node:path";
import { RUNTIME_JS, CSS_TEXT } from "../shell.mjs";
const args = process.argv.slice(2), withScene = args.includes("--scene");
const safe = (s) => String(s).replace(/<\/script/gi, "<\\/script");
for (const dir of args.filter((a) => !a.startsWith("--"))) {
  const id = basename(dir), file = join(dir, id + ".html"); let html = readFileSync(file, "utf8"); const done = [];
  const swap = (startsWith, body, what) => { const tag = "<script>"; let i = -1, from = 0;
    while ((from = html.indexOf(tag, from)) >= 0) { const c = from + tag.length; if (html.slice(c, c + 200).replace(/^\s+/, "").startsWith(startsWith)) { i = from; break; } from = c; }
    if (i < 0) { console.log("  no " + what + " block found"); return; } const a = i + tag.length, b = html.indexOf("</script>", a);
    html = html.slice(0, a) + body + html.slice(b); done.push(what); };
  swap("window.__studio = { errors", RUNTIME_JS, "runtime");
  { const a = html.indexOf("<style>"), b = a < 0 ? -1 : html.indexOf("</style>", a); if (a >= 0 && html.slice(a + 7, a + 40).startsWith("\n:root{--ground")) { html = html.slice(0, a + 7) + CSS_TEXT + html.slice(b); done.push("css"); } else console.log("  no shell css block found"); }
  const model = readFileSync(join(dir, "model.js"), "utf8"); swap(model.trim().slice(0, 60), "\n" + safe(model) + "\n", "model");
  if (withScene) { const scene = readFileSync(join(dir, "scene.js"), "utf8"); swap(scene.trim().slice(0, 60), "\n" + safe(scene) + "\n", "scene"); }
  writeFileSync(file, html); console.log("RELINKED", file, done.join(" + "), (html.length / 1024).toFixed(0) + " KB");
}
