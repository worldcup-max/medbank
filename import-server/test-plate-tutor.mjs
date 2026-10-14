/* Live test of the note → plate tutor, exactly as POST /explainer/plate runs it (same prompt, same checks, one retry),
 * without the server, Supabase or sign-in. Writes the result next to the note so it can be opened in the demo page.
 *
 *   PowerShell:  $env:DEEPSEEK_API_KEY="sk-…"; node import-server/test-plate-tutor.mjs; Remove-Item Env:DEEPSEEK_API_KEY
 *   Options:     node import-server/test-plate-tutor.mjs [note.md] [plate-id]
 * The key is only read from the environment; it is never written to a file. */
import { readFileSync, writeFileSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { splitNote, loadManifest, buildPlateTutorPrompt, checkPlateTutor } from "./plate-tutor.mjs";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const notePath = process.argv[2] || join(ROOT, "explainer/studio/samples/nephron-note.md");
const plate = process.argv[3] || "nephron-urine-journey";
const key = process.env.DEEPSEEK_API_KEY; if (!key) { console.error("Set DEEPSEEK_API_KEY first."); process.exit(1); }
const model = process.env.MEDBANK_BASIC_MODEL || "deepseek-v4-flash";

const M = await loadManifest(plate), lines = splitNote(readFileSync(notePath, "utf8"));
console.log(`plate ${plate} · ${lines.length} note lines · model ${model}`);
let best = null, errors = null, usage = { in: 0, out: 0 };
for (let attempt = 0; attempt < 2; attempt++) {
  const t0 = Date.now();
  const r = await fetch("https://api.deepseek.com/v1/chat/completions", { method: "POST", headers: { "Content-Type": "application/json", Authorization: "Bearer " + key },
    body: JSON.stringify({ model, messages: [{ role: "user", content: buildPlateTutorPrompt(M, lines, errors) }], max_tokens: 5000, temperature: attempt ? 0.2 : 0.35, reasoning_effort: "none", response_format: { type: "json_object" } }) });
  const j = await r.json(); if (!r.ok) { console.error("DeepSeek error", r.status, JSON.stringify(j).slice(0, 400)); process.exit(1); }
  usage.in += j.usage?.prompt_tokens || 0; usage.out += j.usage?.completion_tokens || 0;
  const res = checkPlateTutor(j.choices[0].message.content, M, lines);
  console.log(`attempt ${attempt + 1}: ${((Date.now() - t0) / 1000).toFixed(1)} s · ${res.lesson ? res.lesson.steps.length : 0} stops kept · ${res.errors.length} problems`);
  res.errors.forEach((e) => console.log("   ✗ " + e));
  if (res.lesson && (!best || res.lesson.steps.length >= best.steps.length)) best = res.lesson;
  if (!res.errors.length) break; errors = res.errors;
}
if (!best) { console.error("no usable lesson"); process.exit(1); }
const out = notePath.replace(/\.md$/, "") + ".tutor.live.json";
writeFileSync(out, JSON.stringify(best, null, 1));
console.log(`\ntokens in ${usage.in}, out ${usage.out} (multiply by your DeepSeek per-token price for the cost)`);
best.steps.forEach((s, k) => console.log(`${k + 1}. [${s.lines.join(",")}] ${s.words ? "(in words)" : s.phase + " · " + s.focus.join("+") + (s.lens ? " · lens " + s.lens : "")} — ${s.say}`));
if (best.flags.length) console.log("flags:", best.flags.map((f) => `${f.line} ${f.noteSays}→${f.plateSays}`).join("; "));
console.log("extend:", best.extend.join("; ") || "—", "\nsaved", out);
