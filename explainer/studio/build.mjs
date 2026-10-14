#!/usr/bin/env node
/* Explainer Studio — note → two model-driven explainers.
 *   A: "Best explainer"  — an original, detailed plate drawn by the AI and driven by its model
 *   B: "Your note's diagram" — the student's own figure, mapped by a vision model and driven by the SAME model
 *
 *   DEEPSEEK_API_KEY=… [GEMINI_API_KEY=…] node explainer/studio/build.mjs --topic "The cardiac cycle" --note note.txt [--figure fig.png] [--out dir]
 *   node explainer/studio/build.mjs --fixture      (no API calls: runs the whole pipeline on the built-in cardiac example)
 *
 * Steps: understand → model (checked in Node: runs, real magnitudes) → scene (checked in a headless browser:
 * renders, detailed, moving, labels readable) → fix rounds → figure map → pages. Everything is logged to report.json. */
import { readFileSync, writeFileSync, mkdirSync, existsSync } from "node:fs";
import { dirname, join, extname } from "node:path";
import { fileURLToPath } from "node:url";
import { chat, look, MODELS, usage, cost, extractJson, extractCode } from "./llm.mjs";
import { understandPrompt, modelPrompt, scenePrompt, fixPrompt, figureMapPrompt } from "./prompts.mjs";
import { checkModel, checkPage, checkSyntax, checkSceneCode } from "./qa.mjs";
import { pageA, pageB, chooser } from "./shell.mjs";
const HERE = dirname(fileURLToPath(import.meta.url));

export async function buildExplainer({ topic, note, figure, out, log = console.log, chromium = null, llm = null, maxFix = 2, reuse = false }) {
  const ask = llm || chat; const t0 = Date.now(), steps = []; const stamp = (name, extra) => { steps.push({ name, s: Math.round((Date.now() - t0) / 1000), ...extra }); log(`[${Math.round((Date.now() - t0) / 1000)}s] ${name}`); };
  mkdirSync(out, { recursive: true });
  // 1. understand
  let plan = null, kept = null;
  if (reuse && existsSync(join(out, "plan.json")) && existsSync(join(out, "model.js"))) { plan = JSON.parse(readFileSync(join(out, "plan.json"), "utf8")); kept = readFileSync(join(out, "model.js"), "utf8"); }
  for (let k = 0; k < 2 && !plan; k++) plan = extractJson(await ask(understandPrompt(topic, note), { json: true, max_tokens: 8000, model: MODELS.think, stage: "understand" }));
  if (!plan) throw new Error("could not understand the note"); writeFileSync(join(out, "plan.json"), JSON.stringify(plan, null, 1)); stamp("understood", { title: plan.title, parts: (plan.parts || []).length });
  // 2. model, checked in Node
  let modelCode = kept && !checkModel(kept, plan).issues.length ? kept : extractCode(await ask(modelPrompt(plan), { max_tokens: 16000, model: MODELS.think, stage: "model" })), mc = checkModel(modelCode, plan);
  if (modelCode === kept) stamp("kept the checked plan + model from the last run");
  for (let k = 0; k < maxFix + 1 && mc.issues.length; k++) { stamp("model fix " + (k + 1), { issues: mc.issues });
    modelCode = extractCode(await ask(fixPrompt("model", modelCode, mc.issues, "PLAN:\n" + JSON.stringify(plan)), { max_tokens: 16000, model: MODELS.think, stage: "model-fix" })); mc = checkModel(modelCode, plan); }
  if (!chromium) stamp("WARNING: no browser, so the drawing was NOT checked (runtime errors, overlaps, size). Run: cd explainer; npm i -D playwright");
  writeFileSync(join(out, "model.js"), modelCode); stamp("model", { issues: mc.issues });
  if (mc.issues.some((x) => /threw|must return|timed out|missing or not a finite/.test(x))) throw new Error("the model does not run: " + mc.issues[0]);
  // 3. scene (version A), checked in a browser
  const meta = { figLabel: plan.figLabel, title: plan.title, titleEm: plan.titleEm, sub: plan.sub };
  const lesson = { steps: (plan.lesson || []).slice(0, 10) };
  const legend = "<span><i class='sw' style='background:var(--cold-hi)'></i>upstream / low</span><span><i class='sw' style='background:var(--hot-hi)'></i>downstream / high</span><span>Every motion and number comes from the model</span>";
  const freshScene = async (note) => extractCode(await ask(scenePrompt(plan, mc.info) + (note ? "\n\n" + note : ""), { max_tokens: 20000, model: MODELS.think, stage: "scene" }));
  let sceneCode = await freshScene(), syn = checkSyntax(sceneCode, "createScene");
  if (syn.length) { stamp("scene redo (did not parse)", { issues: syn }); sceneCode = await freshScene("YOUR PREVIOUS ATTEMPT WAS CUT OFF BECAUSE IT WAS TOO LONG. " + syn[0]); }
  const judge = async (k) => { const sx = checkSyntax(sceneCode, "createScene"); if (sx.length) return { issues: sx }; const r = await checkPage(pageA({ meta, modelCode, sceneCode, lesson, legend }), { chromium, shots: join(out, "A-check-" + k) }); r.issues = checkSceneCode(sceneCode).concat(r.issues); return r; };
  let pc = await judge(0);
  for (let k = 0; k < maxFix && pc.issues.length; k++) { stamp("scene fix " + (k + 1), { issues: pc.issues });
    sceneCode = checkSyntax(sceneCode, "createScene").length ? await freshScene("YOUR PREVIOUS ATTEMPT WAS CUT OFF BECAUSE IT WAS TOO LONG. Write it compactly.")
      : extractCode(await ask(fixPrompt("scene", sceneCode, pc.issues, "MODEL PROVIDES:\n" + JSON.stringify(mc.info)), { max_tokens: 20000, model: MODELS.think, stage: "scene-fix" }));
    pc = await judge(k + 1); }
  let A = pageA({ meta, modelCode, sceneCode, lesson, legend });
  writeFileSync(join(out, "scene.js"), sceneCode); writeFileSync(join(out, "A.html"), A); stamp("version A", { issues: pc.issues, report: pc.report && { els: pc.report.state.els } });
  // 4. version B: the student's own figure, mapped by a vision model, driven by the same model
  let B = null, mapIssues = [];
  if (figure && existsSync(figure)) {
    const buf = readFileSync(figure), mime = /\.jpe?g$/i.test(figure) ? "image/jpeg" : "image/png"; const dim = imageSize(buf);
    const raw = await (llm ? llm(figureMapPrompt(mc.info.parts, dim.W, dim.H), { stage: "figure-map", image: buf }) : look(figureMapPrompt(mc.info.parts, dim.W, dim.H), buf.toString("base64"), mime));
    const map = extractJson(raw);
    if (map && map.parts) { map.W = dim.W; map.H = dim.H; writeFileSync(join(out, "figure-map.json"), JSON.stringify(map, null, 1));
      B = pageB({ meta, modelCode, figure: `data:${mime};base64,${buf.toString("base64")}`, map, lesson }); const bc = await checkPage(B, { chromium, shots: join(out, "B-check") }); mapIssues = bc.issues.filter((x) => !/sparse|outside/.test(x));
      writeFileSync(join(out, "B.html"), B); stamp("version B", { issues: mapIssues }); }
    else stamp("version B skipped", { why: raw === null ? "no vision model configured (set GEMINI_API_KEY)" : "the figure could not be mapped" });
  } else stamp("version B skipped", { why: "no figure in the note" });
  writeFileSync(join(out, "choose.html"), chooser({ meta, a: A, b: B }));
  const shippable = !mc.issues.length && !pc.issues.length && !pc.skipped;
  const report = { shippable, topic, seconds: Math.round((Date.now() - t0) / 1000), usd: cost(), usage, models: MODELS, steps, modelIssues: mc.issues, sceneIssues: pc.issues, figureIssues: mapIssues, versions: { A: true, B: !!B } };
  writeFileSync(join(out, "report.json"), JSON.stringify(report, null, 1)); stamp("done", { usd: report.usd });
  return report;
}

function imageSize(buf) {   // PNG / JPEG dimensions without dependencies
  if (buf[0] === 0x89 && buf[1] === 0x50) return { W: buf.readUInt32BE(16), H: buf.readUInt32BE(20) };
  let i = 2; while (i < buf.length) { if (buf[i] !== 0xff) { i++; continue; } const m = buf[i + 1], len = buf.readUInt16BE(i + 2); if (m >= 0xc0 && m <= 0xc3) return { H: buf.readUInt16BE(i + 5), W: buf.readUInt16BE(i + 7) }; i += 2 + len; }
  return { W: 1000, H: 800 };
}

/* --fixture: the whole pipeline with canned answers (the cardiac exemplars) — proves the plumbing without API calls */
function fixtureLLM() {
  const plan = { title: "The four-chamber heart", titleEm: "in motion", figLabel: "Plate 1 · Cardiac cycle", sub: "Every valve opens only when the pressure behind it beats the pressure ahead.", kind: "cycle", timeUnit: "s", duration: 0.8,
    quantities: [{ key: "LVP", label: "LV pressure", unit: "mmHg", typical: [2, 125] }, { key: "AoP", label: "Aortic pressure", unit: "mmHg", typical: [75, 125] }, { key: "LVV", label: "LV volume", unit: "mL", typical: [45, 140] }],
    parts: ["RA", "RV", "LA", "LV", "tricuspid", "pulmonary", "mitral", "aortic", "aorta", "pa", "cavae", "pveins"].map((id) => ({ id, name: id })),
    phases: ["Atrial systole", "Isovolumetric contraction", "Ventricular ejection", "Isovolumetric relaxation", "Rapid filling", "Diastasis"],
    visual_plan: "frontal cutaway", lesson: [{ title: "Filling", phase: "Rapid filling", focus: ["LV", "mitral"], say: "The mitral valve opens because LA pressure is now above LV pressure." }, { title: "Ejection", phase: "Ventricular ejection", focus: ["LV", "aortic"], say: "LV pressure passes the aorta, so the aortic valve is forced open." }] };
  return async (prompt, o = {}) => o.stage === "understand" ? JSON.stringify(plan) : o.stage?.startsWith("model") ? "```js\n" + readFileSync(join(HERE, "fixtures/cardiac.model.js"), "utf8") + "\n```"
    : o.stage?.startsWith("scene") ? "```js\n" + readFileSync(join(HERE, "fixtures/cardiac.scene.js"), "utf8") + "\n```" : o.stage === "figure-map" ? readFileSync(join(HERE, "fixtures/cardiac.figure-map.json"), "utf8") : "{}";
}

if (process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1]) {
  const arg = (k) => { const i = process.argv.indexOf("--" + k); return i > 0 ? process.argv[i + 1] : null; };
  const fixture = process.argv.includes("--fixture");
  let chromium = null; try { ({ chromium } = await import("playwright")); } catch (_) { try { const g = (await import("node:child_process")).execSync("npm root -g").toString().trim(); ({ chromium } = await import(join(g, "playwright/index.mjs"))); } catch (_) { console.log("(no playwright — the drawing can't be checked. Fix: cd explainer; npm i -D playwright   — it uses your installed Edge, no extra download)"); } }
  const topic = fixture ? "The cardiac cycle" : arg("topic"), noteF = arg("note"), out = arg("out") || join(HERE, "out", (topic || "explainer").toLowerCase().replace(/[^a-z0-9]+/g, "-").slice(0, 40));
  if (!topic) { console.log("usage: node build.mjs --topic \"…\" --note note.txt [--figure fig.png] [--out dir]   |   --fixture"); process.exit(1); }
  const note = fixture ? "The heart pumps blood through four chambers…" : noteF ? readFileSync(noteF, "utf8") : "";
  const figure = fixture ? join(HERE, "fixtures/cardiac.figure.png") : arg("figure");
  const r = await buildExplainer({ topic, note, figure, out, chromium, llm: fixture ? fixtureLLM() : null, reuse: process.argv.includes("--redraw") });
  console.log(`\nDone in ${r.seconds}s · ≈$${r.usd} · model ${r.modelIssues.length ? r.modelIssues.length + " open issues" : "clean"} · drawing ${!chromium ? "NOT CHECKED" : r.sceneIssues.length ? r.sceneIssues.length + " open issues" : "clean"} · B ${r.versions.B ? "built" : "skipped"} · ${r.shippable ? "ready for students" : "NOT ready for students"}\nOpen ${join(out, "choose.html")}`);
}
