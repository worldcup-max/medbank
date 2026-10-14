/* Live test of Ask the plate and Explain it back, exactly as POST /explainer/plate/ask and /explain run them (same prompts,
 * same checks, one retry), without the server, Supabase or sign-in.
 *   PowerShell:  $env:DEEPSEEK_API_KEY="sk-…"; node import-server/test-plate-ask.mjs; Remove-Item Env:DEEPSEEK_API_KEY
 * The key is only read from the environment; it is never written to a file. */
import { readFileSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { splitNote, loadManifest, buildAskPrompt, checkAsk, buildExplainPrompt, checkExplain } from "./plate-tutor.mjs";
const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const key = process.env.DEEPSEEK_API_KEY; if (!key) { console.error("Set DEEPSEEK_API_KEY first."); process.exit(1); }
const model = process.env.MEDBANK_BASIC_MODEL || "deepseek-v4-flash";
const M = await loadManifest("nephron-urine-journey"), lines = splitNote(readFileSync(join(ROOT, "explainer/studio/samples/nephron-note.md"), "utf8"));
let tin = 0, tout = 0;
async function ask(prompt, t) { const r = await fetch("https://api.deepseek.com/v1/chat/completions", { method: "POST", headers: { "Content-Type": "application/json", Authorization: "Bearer " + key },
  body: JSON.stringify({ model, messages: [{ role: "user", content: prompt }], max_tokens: 700, temperature: t, reasoning_effort: "none", response_format: { type: "json_object" } }) });
  const j = await r.json(); if (!r.ok) { console.error("DeepSeek error", r.status, JSON.stringify(j).slice(0, 300)); process.exit(1); } tin += j.usage?.prompt_tokens || 0; tout += j.usage?.completion_tokens || 0; return j.choices[0].message.content; }
const QS = [["What does the thick ascending limb do?", { phase: "Thick ascending limb", focus: ["tal"] }], ["What does the vasa recta do?", {}], ["Why does the fluid get more concentrated in the descending limb?", { phase: "Thin descending limb" }], ["Who won the Champions League?", {}]];
for (const [q, at] of QS) { let res = null, errs = null;
  for (let a = 0; a < 2 && !res; a++) { const c = checkAsk(await ask(buildAskPrompt(M, lines, q, at, errs), a ? 0.1 : 0.25), M, lines); if (!c.errors.length) res = c.answer; else { errs = c.errors; console.log("   ✗ " + errs.join(" | ")); } }
  console.log(`\nASK: ${q}\n → ${res ? (res.offTopic ? "(declined as off-topic)" : (res.inNote ? "from note " + res.lines.join(",") : "NOT in note") + ` · ${res.phase || "-"} · ${(res.focus || []).join("+")}\n   ${res.say}`) : "NO ANSWER (both attempts failed)"}`); }
const ids = ["L10", "L11", "L12"], q = "Your turn. In your own words, explain this part of your note: Loop of Henle.";
for (const answer of ["the thin limb loses water so it gets concentrated then the thick limb pumps the salt out with nkcc2 so it gets diluted", "the loop of henle reabsorbs glucose"]) {
  let res = null, errs = null;
  for (let a = 0; a < 2 && !res; a++) { const c = checkExplain(await ask(buildExplainPrompt(M, lines, ids, q, answer, errs), a ? 0.1 : 0.2), M, lines, ids); if (!c.errors.length) res = c.result; else { errs = c.errors; console.log("   ✗ " + errs.join(" | ")); } }
  console.log(`\nEXPLAIN: "${answer}"\n → ${res ? `score ${res.score}/3 · got: ${res.got.join("; ") || "-"} · missed: ${res.missed.map((m) => m.point + " (" + m.line + ")").join("; ") || "-"}\n   ${res.say}` : "NOT MARKED (both attempts failed)"}`); }
console.log(`\ntokens in ${tin}, out ${tout} for ${QS.length} questions + 2 explanations`);
