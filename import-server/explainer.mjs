/* =====================================================================
 * 3D Tutor — server side (POST /explainer in server.mjs)
 *
 * The app plays a FIXED 3D screenplay per template (explainer/src/sn2.js). This module only
 * personalises the words: it rewrites each step's narration and the "From your note" lines so
 * they use the student's own note (their terms, their examples, their lecturer's emphasis).
 * The model can never change what the 3D shows — step ids are fixed and anything extra is dropped.
 *
 * Shared cache: the same note excerpt + template is generated once and reused for everyone
 * (table "explainers", see sql/explainers.sql).
 * ===================================================================== */
import { createHash } from "node:crypto";

/* Step ids MUST match explainer/src/sn2.js. "shows" is what the student is watching during that step. */
export const EXPLAINER_TEMPLATES = {
  sn2: {
    title: "SN2 reaction",
    match: /\bS\s?N\s?2\b|bimolecular nucleophilic|nucleophilic substitution|backside attack|back-side attack|walden inversion|inversion of configuration/i,
    fixed: [
      "The 3D shows hydroxide (HO⁻) attacking 2-halobutane. The halogen X can be Br, Cl or I (you choose \"lg\"); everything else is fixed.",
      "It starts as (S)-2-halobutane and ends as (R)-butan-2-ol plus the halide ion. The R/S labels on screen are computed from the 3D shape.",
      "The figure under the 3D has numbered parts: 1 nucleophile HO⁻, 2 curly arrow lone pair→C, 3 δ+ carbon, 4 curly arrow C–X bond→X, 5 leaving group, 6 transition state, 7 inverted product, 8 rate law.",
    ],
    steps: [
      ["overview",    "The whole reaction plays on a loop: HO⁻ approaches from the back, X⁻ leaves from the front, the molecule inverts. Curly arrows shown."],
      ["polar",       "Close-up of the C–X bond with δ+ on carbon (figure 3) and δ− on X (figure 5). Nothing moves yet."],
      ["nucleophile", "Close-up of hydroxide (figure 1): oxygen's three lone pairs glow blue; full negative charge."],
      ["attack",      "HO⁻ moves in from directly behind carbon, 180° from X. The C–X σ* orbital is drawn: a big gold lobe behind carbon. Curly arrow 2 from an O lone pair to C."],
      ["ts",          "Frozen at the transition state (figure 6): O···C and C···X both dashed (half-bonds), the three other groups flat in a plane, δ− on O and on X, ‡ shown, energy dot at the top of the hill."],
      ["leave",       "Curly arrow 4 from the C–X bond to X; X⁻ (figure 5) moves away as the C–O bond completes."],
      ["umbrella",    "Side view looping the inversion: methyl, ethyl and H flip to the other side like an umbrella in the wind (Walden inversion)."],
      ["cip",         "CIP priorities 1–4 appear on the atoms. Before: X=1, ethyl=2, methyl=3, H=4 → S. After: OH=1, ethyl=2, methyl=3, H=4 → R (figure 7)."],
      ["rate",        "Full reaction on a loop with the energy profile: one hill, no intermediate. Figure 8: rate = k[RX][OH⁻], second order."],
      ["tertiary",    "A tertiary haloalkane (three methyls on the carbon) with van der Waals clouds; HO⁻ approaches and bounces off — 'Blocked'. Steric hindrance; tertiary goes SN1."],
      ["quiz",        "Quiz (the reaction loops). Ask one question the student can answer from this lesson; give the answer separately."],
    ],
  },
};

const MAX_SAY = 700, MAX_LINE = 220;

/* The part of the note this template is about: paragraphs around the matching terms, max ~6000 chars.
 * Deterministic, so the same lecture note always gives the same cache key. */
export function explainerExcerpt(note, templateId){
  const T = EXPLAINER_TEMPLATES[templateId]; const text = String(note||"").replace(/\r/g,"");
  if(!T || !text.trim()) return "";
  const paras = text.split(/\n\s*\n/).map(p=>p.trim()).filter(Boolean);
  const hit = paras.map((p,i)=> T.match.test(p) ? i : -1).filter(i=>i>=0);
  let pick = [];
  if(hit.length){ const keep = new Set(); hit.forEach(i=>{ keep.add(i-1); keep.add(i); keep.add(i+1); }); pick = paras.filter((_,i)=>keep.has(i)); }
  else pick = paras;
  let out = ""; for(const p of pick){ if((out+"\n\n"+p).length > 6000) break; out += (out?"\n\n":"") + p; }
  return out.slice(0, 6000);
}
export function explainerKey(templateId, excerpt){
  return createHash("md5").update(templateId+"|v1|"+String(excerpt||"").toLowerCase().replace(/\s+/g," ").trim()).digest("hex");
}

export function buildExplainerPrompt(templateId, excerpt){
  const T = EXPLAINER_TEMPLATES[templateId];
  return `You are writing the spoken narration for a 3D animated chemistry tutor in a study app for A-level and pre-medical students.
The animation is FIXED. You only write the words. Your job: make it feel made for THIS student's lecture note — use their terminology, their examples, their lecturer's emphasis — while staying 100% consistent with what is on screen.

WHAT IS ON SCREEN (cannot change):
${T.fixed.map(f=>"- "+f).join("\n")}

STEPS (in order — write narration for every id, matching what the student is watching):
${T.steps.map(([id,shows],i)=>`${i+1}. "${id}": ${shows}`).join("\n")}

THE STUDENT'S NOTE (excerpt):
"""
${excerpt}
"""

RULES:
- Narration is spoken aloud. 2–5 short sentences per step, max 80 words. Plain words a student would say; no markdown, no symbols like ‡ σ* δ (write "double dagger", "sigma-star", "delta plus").
- Refer to the figure's numbers where the step shows them ("number six, the transition state").
- If the note teaches something relevant (a specific example, a mnemonic, a lecturer's warning, solvent effects, nucleophile strength), weave it into the step where it fits.
- If the note's example differs from the screen (another nucleophile or substrate), say once in "overview" that the note uses that example and the screen shows hydroxide with 2-halobutane — same mechanism. Never claim the screen shows something it doesn't.
- Choose "lg" = the halogen the note's own example uses (Br, Cl or I); default "Br".
- "lines": 5–9 short key points taken from THE NOTE ITSELF, in the note's own wording (lightly trimmed), in teaching order. Each under 200 characters. Do not invent facts the note doesn't contain.
- Be chemically correct. SN2: one concerted step, backside attack, inversion of configuration, rate = k[RX][Nu⁻], methyl > primary > secondary, tertiary does not do SN2.
- The quiz must be answerable from this lesson; answer in 1–2 sentences.

Return ONLY JSON:
{"lg":"Br","lines":["..."],"steps":{${T.steps.map(([id])=>`"${id}":{"say":"..."}`).join(",")}},"quiz":{"say":"question, spoken","answer":"..."}}`;
}

function extractJson(text){
  const s = String(text||""); const a = s.indexOf("{"), b = s.lastIndexOf("}");
  if(a < 0 || b <= a) return null;
  try{ return JSON.parse(s.slice(a, b+1)); }catch(_){ return null; }
}
const clean = (t, n) => String(t||"").replace(/[*_#`]/g,"").replace(/\s+/g," ").trim().slice(0, n);

/* Validate + normalise. Returns a lesson the app can play, or null. */
export function parseExplainerLesson(text, templateId){
  const T = EXPLAINER_TEMPLATES[templateId]; const o = extractJson(text);
  if(!T || !o || typeof o !== "object") return null;
  const steps = {};
  for(const [id] of T.steps){
    if(id === "quiz") continue;
    const say = clean(o.steps && o.steps[id] && o.steps[id].say, MAX_SAY);
    if(say.split(/\s+/).length < 8) return null;                 // every step needs real narration
    steps[id] = { say };
  }
  const q = o.quiz || (o.steps && o.steps.quiz) || {};
  const quiz = { say: clean(q.say, MAX_SAY), answer: clean(q.answer, 400) };
  if(!quiz.say || !quiz.answer) return null;
  const lines = (Array.isArray(o.lines) ? o.lines : []).map(l=>clean(l, MAX_LINE)).filter(l=>l.length > 3).slice(0, 10);
  const lg = ["Br","Cl","I"].includes(o.lg) ? o.lg : "Br";
  return { v:1, template:templateId, lg, lines, steps, quiz, personal:true };
}
