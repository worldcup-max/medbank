import { readFileSync, writeFileSync } from "node:fs"; import { join } from "node:path"; import { pageA } from "./shell.mjs";
const [dir, outFile] = process.argv.slice(2); const rd = (f) => readFileSync(join(dir, f), "utf8"); const plan = JSON.parse(rd("plan.json"));
const legend = plan.legend || "<span><i class='sw' style='background:var(--cold-hi)'></i>water / blood</span><span><i class='sw' style='background:var(--hot-hi)'></i>solute / high</span><span>Every motion and number comes from the model</span>";
import { existsSync } from "node:fs";
const shows = existsSync(join(dir, "shows.json")) ? JSON.parse(rd("shows.json")) : {};
const lenses = Object.entries(shows.lenses || {}).map(([id, v]) => ({ id, title: v.title, kicker: v.kicker, shows: v.shows }));
writeFileSync(outFile, pageA({ meta: { figLabel: plan.figLabel, title: plan.title, titleEm: plan.titleEm, sub: plan.sub }, modelCode: rd("model.js"), sceneCode: rd("scene.js"), lesson: JSON.parse(rd("lesson.voiced.json")), legend, lenses }));
