/* Model calls for the Explainer Studio. Same conventions as import-server/server.mjs:
 * DeepSeek V4 (OpenAI-compatible) for text and code, Gemini for looking at the student's figure. */
const DS_BASE = process.env.DEEPSEEK_BASE_URL || "https://api.deepseek.com/v1";
export const MODELS = {
  think: process.env.STUDIO_THINK_MODEL || "deepseek-v4-pro",    // understanding + model + scene code
  fast: process.env.STUDIO_FAST_MODEL || "deepseek-v4-flash",    // small fixes, narration
  vision: process.env.STUDIO_VISION_MODEL || "gemini-2.5-flash", // reads the student's figure
};
export const usage = { calls: 0, in: 0, out: 0, byModel: {} };

export async function chat(prompt, { model = MODELS.think, json = false, max_tokens = 16000, temperature = 0.3, effort = process.env.STUDIO_REASONING || "none", timeoutMs = 600000 } = {}) {
  const key = process.env.DEEPSEEK_API_KEY; if (!key) throw new Error("DEEPSEEK_API_KEY is not set");
  const body = { model, messages: [{ role: "user", content: prompt }], max_tokens, temperature, reasoning_effort: effort };
  if (json) body.response_format = { type: "json_object" };
  for (let attempt = 0; attempt < 3; attempt++) {
    const ctrl = new AbortController(), to = setTimeout(() => ctrl.abort(), timeoutMs);
    let r, j;
    try { r = await fetch(DS_BASE + "/chat/completions", { method: "POST", headers: { "Content-Type": "application/json", Authorization: "Bearer " + key }, body: JSON.stringify(body), signal: ctrl.signal }); j = await r.json().catch(() => ({})); }
    catch (e) { clearTimeout(to); if (attempt === 2) throw new Error("DeepSeek request failed: " + (e.name === "AbortError" ? "timed out" : e.message)); await sleep(3000 * (attempt + 1)); continue; }
    clearTimeout(to);
    if (!r.ok) {
      const msg = ((j.error || {}).message || r.status + "");
      if (body.response_format && /response_format|json/i.test(msg)) { delete body.response_format; continue; }
      if (/max_tokens|maximum/i.test(msg) && body.max_tokens > 8192) { body.max_tokens = 8192; continue; }
      if (r.status >= 500 || r.status === 429) { await sleep(4000 * (attempt + 1)); continue; }
      throw new Error("DeepSeek: " + msg);
    }
    const c = ((j.choices || [])[0] || {}), u = j.usage || {};
    usage.calls++; usage.in += u.prompt_tokens || 0; usage.out += u.completion_tokens || 0;
    const m = (usage.byModel[model] = usage.byModel[model] || { in: 0, out: 0 }); m.in += u.prompt_tokens || 0; m.out += u.completion_tokens || 0;
    const text = (c.message && c.message.content) || "";
    if (!text.trim() && c.finish_reason === "length") throw new Error("DeepSeek ran out of tokens before answering");
    return text;
  }
  throw new Error("DeepSeek did not answer");
}

export async function look(prompt, imageB64, mime = "image/png") {
  const key = process.env.GEMINI_API_KEY; if (!key) return null;    // no vision model configured → version B is skipped
  const r = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${MODELS.vision}:generateContent?key=${key}`, {
    method: "POST", headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ contents: [{ role: "user", parts: [{ text: prompt }, { inline_data: { mime_type: mime, data: imageB64 } }] }], generationConfig: { temperature: 0.1, responseMimeType: "application/json", maxOutputTokens: 8000 } }),
  });
  const j = await r.json().catch(() => ({})); if (!r.ok) throw new Error("Gemini: " + ((j.error || {}).message || r.status));
  usage.calls++; const um = j.usageMetadata || {}; usage.in += um.promptTokenCount || 0; usage.out += um.candidatesTokenCount || 0;
  return (((j.candidates || [])[0] || {}).content || {}).parts?.map((p) => p.text || "").join("") || "";
}

export function cost() {   // rough, from published list prices; check current pricing
  const P = { "deepseek-v4-pro": [0.55, 2.2], "deepseek-v4-flash": [0.3, 1.2] };
  let usd = 0; for (const [m, u] of Object.entries(usage.byModel)) { const p = P[m] || [0.5, 2]; usd += (u.in * p[0] + u.out * p[1]) / 1e6; }
  return Math.round(usd * 1000) / 1000;
}
export const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
export function extractJson(t) { const s = String(t || ""); const a = s.indexOf("{"), b = s.lastIndexOf("}"); if (a < 0 || b <= a) return null; try { return JSON.parse(s.slice(a, b + 1)); } catch (_) { return null; } }
export function extractCode(t) { const m = /```(?:js|javascript)?\s*\n([\s\S]*?)```/.exec(String(t || "")); return (m ? m[1] : String(t || "")).trim(); }
