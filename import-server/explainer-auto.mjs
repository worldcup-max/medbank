/* =====================================================================
 * 3D Tutor — instant builder (server side).
 *   POST /explainer/scan   note → the mechanisms in it (cheap; cached per note)
 *   POST /explainer/build  note + mechanism name → a checked, playable 3D lesson (cached and shared)
 * DeepSeek writes the mechanism as atom-mapped SMILES states + curly arrows; chemspec checks the chemistry
 * and chem3d checks that the motion agrees with the written stereochemistry. Any failure goes back to the
 * model with the exact errors (up to 3 tries). Nothing unchecked ever reaches a student.
 * ===================================================================== */
import { createHash } from "node:crypto";
import { validateMechanism } from "./chemspec.mjs";
import { buildMechanism3D } from "./chem3d.mjs";

export const AUTO_VERSION = "v1";
const norm = (s) => String(s || "").toLowerCase().replace(/[^a-z0-9+]+/g, " ").trim();
export const mechKey = (name) => norm(name).slice(0, 80);
export const autoCacheKey = (name, excerpt) => createHash("md5").update("auto|" + AUTO_VERSION + "|" + mechKey(name) + "|" + norm(excerpt)).digest("hex");
export const scanCacheKey = (note) => createHash("md5").update("scan|" + AUTO_VERSION + "|" + norm(note).slice(0, 20000)).digest("hex");

/* the part of the note about this mechanism (falls back to the start of the note) */
export function autoExcerpt(note, name) {
  const text = String(note || "").replace(/\r/g, ""); const words = norm(name).split(" ").filter((w) => w.length > 3);
  const paras = text.split(/\n\s*\n/).map((p) => p.trim()).filter(Boolean);
  const hit = paras.map((p, i) => (words.some((w) => norm(p).includes(w)) ? i : -1)).filter((i) => i >= 0);
  const keep = new Set(); (hit.length ? hit : [0, 1, 2, 3, 4]).forEach((i) => { keep.add(i - 1); keep.add(i); keep.add(i + 1); });
  let out = ""; paras.forEach((p, i) => { if (keep.has(i) && (out + p).length < 6000) out += (out ? "\n\n" : "") + p; });
  return out || text.slice(0, 6000);
}

export function buildScanPrompt(note) {
  return `List the chemical reaction MECHANISMS taught in this student's lecture note (organic, inorganic or biochemical) — the ones a student would want to watch happen step by step with curly arrows.
Only include real mechanisms with electron movement (e.g. "SN2 of bromoethane with hydroxide", "Acid-catalysed esterification", "Electrophilic addition of HBr to propene", "Nucleophilic addition of HCN to ethanal"). Not general topics, not definitions.
For each: a short specific name including the example molecules if the note gives them, and one plain sentence of what happens.
NOTE:
"""
${String(note).slice(0, 12000)}
"""
Return ONLY JSON: {"mechanisms":[{"name":"...","summary":"..."}]}  (at most 8; empty list if none)`;
}
export function parseScan(text) {
  const o = json(text); const list = (o && Array.isArray(o.mechanisms) ? o.mechanisms : []).map((m) => ({ name: clean(m && m.name, 90), summary: clean(m && m.summary, 200) })).filter((m) => m.name.length > 2);
  return list.slice(0, 8);
}

export function buildAutoPrompt(name, excerpt, errors) {
  return `You are building a 3D animated chemistry lesson for an A-level / pre-medical student. The app draws real 3D molecules from your SMILES and animates them between states, so the chemistry must be exactly right.

MECHANISM TO TEACH: ${name}
THE STUDENT'S NOTE (excerpt):
"""
${excerpt}
"""

WRITE THE MECHANISM AS STATES + ARROWS
- "states": the real, isolable species at each stage (reactants, each intermediate, products). 2–6 states. Transition states are NOT states — the app animates them between states.
- Each state is ONE SMILES string with every species separated by "." (spectators included: if water is a reactant or base, it is in every state).
- ATOM MAPPING (essential): every heavy atom has a map number in brackets, e.g. [CH3:1], [OH-:5], [C@H:3], [Br-:4]. The same atom keeps the same number in every state. Every state contains exactly the same mapped atoms.
- Write charges in brackets: [OH-:1], [C+:2], [OH2+:6], [Br-:4]. Bracket atoms need explicit H counts: [CH3:1], [OH:2], [NH3+:4].
- HYDROGENS THAT MOVE (proton transfers, eliminations) must be explicit mapped atoms written as their own atom: e.g. "[OH:6][H:9]" or "[CH2:5][H:8]". Hydrogens that never move stay implicit, and every atom keeps the same number of implicit H in every state.
- Stereochemistry: write @/@@ only where the lesson is about it (e.g. SN2 inversion). Be careful: SN2 inverts the centre.
- Use real example molecules from the note when it gives them; otherwise the simplest standard example. Keep species small (under ~25 heavy atoms in total).
- "arrows": one list per step (step k goes from state k to state k+1). Each arrow is {"from":[a] or [a,b], "to":[a] or [a,b]} using map numbers:
    from [a] = a lone pair on atom a;  from [a,b] = the electrons of bond a–b;
    to [a,b] = a new bond (or extra bond order) between a and b;  to [a] = electrons become a lone pair on atom a.
  EVERY bond that forms or gains order must have an arrow pointing to it, and EVERY bond that breaks or loses order must have an arrow starting from it.
- "energy" per state: relative energy from -1 to 1 (reactants 0). "barriers": one per step, 0.1 (tiny) to 1 (rate-determining).

EXAMPLE (SN2, hydroxide + (S)-2-bromobutane → (R)-butan-2-ol):
{"states":[{"name":"Reactants","smiles":"[OH-:1].[CH3:2][C@H:3]([Br:4])[CH2:5][CH3:6]","energy":0},{"name":"Products","smiles":"[OH:1][C@H:3]([CH3:2])[CH2:5][CH3:6].[Br-:4]","energy":-0.4}],"arrows":[[{"from":[1],"to":[1,3]},{"from":[3,4],"to":[4]}]],"barriers":[1]}

THEN THE LESSON (spoken narration, 2–5 short sentences per step, max 80 words each, plain words, no symbols like δ ‡ — say "delta plus"):
- "steps" in order: {"kind":"overview","say":...}, then for EVERY step k (0-based) {"kind":"step","k":k,"title":"short","focus":[map numbers being explained],"say":...}, and you may add {"kind":"state","s":index,"title":"...","focus":[...],"say":...} to pause on an important intermediate. Then {"kind":"summary","say":...} and {"kind":"quiz","say":"question","answer":"1–2 sentences"}.
- Explain WHY each step happens (which atom is electron-rich / electron-poor, why that bond breaks, what stabilises the intermediate, which step is rate-determining). Use the note's own terms and examples.
- "names": labels for the key atoms by map number, e.g. {"1":"Nucleophile (OH⁻)","3":"Electrophilic carbon"}.
- "lines": 4–8 key points taken from the note itself, in its own wording.
${errors && errors.length ? `\nYOUR PREVIOUS ANSWER FAILED THE CHEMISTRY CHECK. Fix exactly these problems:\n- ${errors.join("\n- ")}\n` : ""}
Return ONLY JSON:
{"title":"...","mechanism":{"states":[...],"arrows":[[...]],"barriers":[...]},"names":{...},"lines":[...],"steps":[...]}`;
}

function json(text) { const s = String(text || ""); const a = s.indexOf("{"), b = s.lastIndexOf("}"); if (a < 0 || b <= a) return null; try { return JSON.parse(s.slice(a, b + 1)); } catch (_) { return null; } }
const clean = (t, n) => String(t || "").replace(/[*_#`]/g, "").replace(/\s+/g, " ").trim().slice(0, n);

/* check an answer; returns { lesson } or { errors } */
export function checkAutoLesson(text, name) {
  const o = json(text); if (!o) return { errors: ["the answer was not valid JSON"] };
  const mech = o.mechanism; const v = validateMechanism(mech); if (!v.ok) return { errors: v.errors };
  let M; try { M = buildMechanism3D(mech); } catch (e) { return { errors: ["could not build 3D geometry: " + e.message] }; }
  const NT = mech.states.length - 1, errors = [];
  M.warnings.forEach((w) => errors.push(w));
  const steps = (Array.isArray(o.steps) ? o.steps : []).map((s) => {
    const kind = ["overview", "step", "state", "summary", "quiz"].includes(s && s.kind) ? s.kind : null; if (!kind) return null;
    const out = { kind, say: clean(s.say, 700) }; if (s.title) out.title = clean(s.title, 50);
    if (kind === "step") { out.k = Math.round(+s.k); if (!(out.k >= 0 && out.k < NT)) return null; }
    if (kind === "state") { out.s = Math.round(+s.s); if (!(out.s >= 0 && out.s <= NT)) return null; }
    if (Array.isArray(s.focus)) out.focus = s.focus.map((x) => Math.round(+x)).filter((x) => x > 0).slice(0, 6);
    if (kind === "quiz") out.answer = clean(s.answer, 400);
    return out.say.split(/\s+/).length >= 4 ? out : null;
  }).filter(Boolean);
  for (let k = 0; k < NT; k++) if (!steps.some((s) => s.kind === "step" && s.k === k)) errors.push(`no narration step for step k=${k}`);
  if (!steps.some((s) => s.kind === "quiz" && s.answer)) errors.push("missing the quiz step with an answer");
  if (errors.length) return { errors };
  if (!steps.some((s) => s.kind === "overview")) steps.unshift({ kind: "overview", say: "Here is the whole mechanism. Watch it once, then we'll take it step by step." });
  const names = {}; Object.entries(o.names || {}).forEach(([k, val]) => { if (+k > 0) names[+k] = clean(val, 40); });
  return { lesson: { v: 1, kind: "auto", name, title: clean(o.title || name, 80), mechanism: mech, names,
    lines: (Array.isArray(o.lines) ? o.lines : []).map((l) => clean(l, 220)).filter(Boolean).slice(0, 8), steps, personal: true } };
}
