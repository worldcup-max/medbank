/* Clinical Simulation: cases built from a student's own imported lecture.
 *
 * When a 400, 500 or 600 level student imports a lecture, the server builds a small case pack
 * from the built note and caches it on the topic (topics.extras.clinsim). The pack feeds three
 * modes of the Clinical Simulation tab (clinsim.js):
 *   osce  : history-taking stations for the AI patient (same fact shape as ER Sim)
 *   quick : short branching cases, weighted scoring, then MCQs
 *   daily : progressive-clue diagnosis puzzles for Case of the Day
 *
 * The note drives the cases, the same rule as the tutor: every case must be about something
 * the note teaches, and each case carries a verbatim quote ("src") from the note that we check.
 * A case whose quote is not in the note is dropped, so the model cannot drift off the lecture.
 */

export const CLINICAL_LEVELS = [400, 500, 600];
export function isClinicalLevel(level){ return CLINICAL_LEVELS.indexOf(Number(level)) >= 0; }

const cap = (s, n) => String(s == null ? "" : s).replace(/\s+/g, " ").trim().slice(0, n);
const slug = (s, i) => (cap(s, 60).toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "") || "case") + "-" + i;
const norm = s => String(s || "").toLowerCase().replace(/[‘’“”"'`*_#>|]/g, "").replace(/[^a-z0-9]+/g, " ").trim();

/* true when the quote (or most of it) appears in the note, ignoring case, punctuation and markdown */
export function quoteInNote(quote, note){
  const q = norm(quote), n = norm(note);
  if(!q || q.split(" ").length < 4) return false;
  if(n.indexOf(q) >= 0) return true;
  // allow a trimmed quote: any run of 6 consecutive words from it
  const w = q.split(" ");
  for(let i = 0; i + 6 <= w.length; i++) if(n.indexOf(w.slice(i, i + 6).join(" ")) >= 0) return true;
  return false;
}

export function buildCasePackPrompt(note, topicName){
  return `You write clinical training cases for Nigerian medical students in their clinical years (400 to 600 level).
Build them ONLY from the lecture note below. Topic: "${cap(topicName, 120)}".

RULES
1. Every case must be about a condition, presentation or management point that THIS NOTE teaches. Do not add diseases, drugs or doses the note does not mention. If the note is not clinical (for example pure anatomy or biochemistry with no patients), return {"osce":[],"quick":[],"daily":[]}.
2. Each case has "src": a SHORT verbatim quote (6 to 14 words) copied EXACTLY from the note that the case is built on.
3. Patients are fictional Nigerians with Nigerian names, in a Nigerian hospital. Titles name the presenting complaint, NEVER the diagnosis.
4. Keep every text field short and plain. Nigerian English is fine for what patients say.

RETURN STRICT JSON with this shape:
{
 "osce":[ up to 2 history-taking stations {
   "title":"presenting complaint", "src":"...",
   "patient":{"name":"","age":"34","sex":"female"},
   "speaker":"who answers (the patient, or e.g. 'Musa's mother')",
   "persona":"one sentence on how they speak",
   "opening":"what they say when the doctor greets them",
   "background":"extra facts the patient knows (social, drugs, allergies)",
   "history":[ 8 to 12 {"id":"short_id","q":"a question a doctor asks","a":"the patient's answer in lay words","key":true or false} ],
   "dx":{"options":["4 or 5 diagnoses"],"correct":0},
   "plan":{"options":["4 next steps"],"correct":0},
   "teaching":["2 to 4 learning points from the note"]
 } ],
 "quick":[ up to 2 short cases {
   "title":"presenting complaint", "src":"...",
   "patient":{"name":"","age":"","sex":""},
   "stem":"2 to 3 sentences: who walks in and what you see",
   "steps":[ 3 to 4 decision points {
      "prompt":"what do you do / ask / order next?",
      "reveal":"what the student learns after choosing (shown after the choice)",
      "options":[ 3 or 4 {"t":"option","pts":integer from -10 to 10,"why":"one sentence"} ]
   } ],
   "mcqs":[ 3 {"stem":"","options":["4 options"],"ans":0,"why":"one sentence"} ],
   "teaching":["2 to 3 learning points"]
 } ],
 "daily":[ up to 3 {
   "answer":"the diagnosis", "aliases":["other accepted names"], "src":"...",
   "clues":[ exactly 6 clues, vaguest first, most specific last ],
   "why":"one or two sentences tying the clues to the diagnosis"
 } ]
}
In "quick" steps, the best option scores 10, a reasonable but weaker one 3 to 6, a useless one 0, and a DANGEROUS one -10 (a missed emergency or a harmful drug). Each step must have exactly one best option.
Option texts in a step must be similar in length so the answer does not stand out.

LECTURE NOTE
"""
${String(note || "").slice(0, 24000)}
"""`;
}

function cleanPatient(p){ p = p || {}; return { name: cap(p.name, 60) || "The patient", age: cap(p.age, 12), sex: cap(p.sex, 12) }; }
function cleanOpts(arr, n){ return (Array.isArray(arr) ? arr : []).map(o => cap(o, 160)).filter(Boolean).slice(0, n); }
function idx(v, len){ const k = Number(v); return Number.isInteger(k) && k >= 0 && k < len ? k : -1; }

function cleanOsce(c, i){
  const history = (Array.isArray(c.history) ? c.history : []).slice(0, 14).map((h, j) => ({
    id: cap(h && h.id, 30).replace(/[^a-z0-9_]/gi, "_") || ("h" + j),
    q: cap(h && h.q, 160), a: cap(h && h.a, 300), key: !!(h && h.key)
  })).filter(h => h.q && h.a);
  const seen = new Set(); history.forEach(h => { while(seen.has(h.id)) h.id += "_"; seen.add(h.id); });
  const dxO = cleanOpts(c.dx && c.dx.options, 5), plO = cleanOpts(c.plan && c.plan.options, 4);
  const dxC = idx(c.dx && c.dx.correct, dxO.length), plC = idx(c.plan && c.plan.correct, plO.length);
  if(history.length < 6 || !history.some(h => h.key) || dxO.length < 3 || dxC < 0 || plO.length < 3 || plC < 0) return null;
  return {
    id: "imp-osce-" + slug(c.title, i), kind: "osce", title: cap(c.title, 90), src: cap(c.src, 200),
    patient: cleanPatient(c.patient), speaker: cap(c.speaker, 80) || "the patient",
    persona: cap(c.persona, 300), opening: cap(c.opening, 300), background: cap(c.background, 600),
    history, dx: { options: dxO, correct: dxC }, plan: { options: plO, correct: plC },
    teaching: cleanOpts(c.teaching, 4)
  };
}

function cleanQuick(c, i){
  const steps = (Array.isArray(c.steps) ? c.steps : []).slice(0, 5).map(s => {
    const options = (Array.isArray(s && s.options) ? s.options : []).slice(0, 4).map(o => ({
      t: cap(o && o.t, 160), pts: Math.max(-10, Math.min(10, Math.round(Number(o && o.pts) || 0))), why: cap(o && o.why, 240)
    })).filter(o => o.t);
    return { prompt: cap(s && s.prompt, 200), reveal: cap(s && s.reveal, 300), options };
  }).filter(s => s.prompt && s.options.length >= 3 && s.options.filter(o => o.pts === 10).length === 1);
  const mcqs = (Array.isArray(c.mcqs) ? c.mcqs : []).slice(0, 4).map(q => {
    const options = cleanOpts(q && q.options, 4);
    return { stem: cap(q && q.stem, 300), options, ans: idx(q && q.ans, options.length), why: cap(q && q.why, 240) };
  }).filter(q => q.stem && q.options.length === 4 && q.ans >= 0);
  if(steps.length < 3) return null;
  return {
    id: "imp-quick-" + slug(c.title, i), kind: "quick", title: cap(c.title, 90), src: cap(c.src, 200),
    patient: cleanPatient(c.patient), stem: cap(c.stem, 500), steps, mcqs, teaching: cleanOpts(c.teaching, 3)
  };
}

function cleanDaily(c, i){
  const clues = cleanOpts(c.clues, 6);
  const answer = cap(c.answer, 80);
  if(!answer || clues.length < 5) return null;
  return { id: "imp-daily-" + slug(answer, i), kind: "daily", answer, aliases: cleanOpts(c.aliases, 5).map(a => cap(a, 80)),
           src: cap(c.src, 200), clues, why: cap(c.why, 300) };
}

/* Validate a model response against the note. Returns { osce, quick, daily, dropped } (possibly empty lists). */
export function validateCasePack(obj, note){
  const o = obj || {}; let dropped = 0;
  const keep = (arr, fn) => (Array.isArray(arr) ? arr : []).slice(0, 3).map((c, i) => {
    if(!c || !quoteInNote(c.src, note)){ dropped++; return null; }
    const out = fn(c, i); if(!out) dropped++; return out;
  }).filter(Boolean);
  return { osce: keep(o.osce, cleanOsce), quick: keep(o.quick, cleanQuick), daily: keep(o.daily, cleanDaily), dropped };
}

export function packSize(p){ return p ? (p.osce || []).length + (p.quick || []).length + (p.daily || []).length : 0; }
