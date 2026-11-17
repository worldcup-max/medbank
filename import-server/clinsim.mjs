/* Clinical Simulation: cases built from a student's own imported lecture.
 *
 * When a 400, 500 or 600 level student imports a lecture, the server builds a small case pack
 * from the built note and caches it on the topic (topics.extras.clinsim). The pack feeds three
 * modes of the Clinical Simulation tab (clinsim.js):
 *   osce  : history-taking stations for the AI patient (same fact shape as ER Sim)
 *   quick : short branching cases, weighted scoring, then MCQs
 *   daily : progressive-clue diagnosis puzzles for Case of the Day
 *
 * Two kinds of case in each pack ("basis"):
 *   note    : most of the pack. Built on what the note teaches, with a verbatim quote ("src") that
 *             we check; a note case whose quote is not in the note is dropped.
 *   general : about a third. Standard, widely taught content on the same topic that the note may
 *             leave out (Nigerian and WHO guidance, standard textbooks), so students also meet the
 *             topic as examiners know it. At most one per mode, it must name the topic, and it is
 *             only kept when the note itself gave at least one case (so non-clinical notes stay empty).
 * The tab labels which is which, and both are labelled as made by AI.
 */
export const GENERAL_MAX = { osce: 1, quick: 1, daily: 1 };   // general cases per mode; note cases fill the rest
export const PACK_MAX = { osce: 3, quick: 3, daily: 4 };

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

/* Does this topic have a patient to see? Non-clinical topics (biostatistics, research methods,
 * ethics, law, pure basic science) get no case pack, so we check before calling the model.
 * 1. a topic name that is about methods, ethics or law is non-clinical;
 * 2. otherwise the note must talk like a clinical note: several clinical words, of several kinds. */
const NONCLINICAL_TOPIC = /\b(bio-?statistic|statistic|research method|methodolog|study design|sampling|hypothesis test|epidemiolog\w* method|measures? of (association|disease frequency)|ethic|bioethic|jurisprudence|medical law|legal|history of medicine|health economic|health (care )?management|health informatic|demograph|biochemi|molecular biology|genetics? basics|histolog|embryolog|gross anatomy)/i;   // prefixes: no closing \b, so plurals and -ical forms match
const CLINICAL_WORDS = [/\bpatients?\b/g, /\bpresent(s|ed|ing|ation)\b/g, /\bsymptoms?\b/g, /\bsigns?\b/g, /\bdiagnos\w*/g, /\btreat(ment|ed|s)?\b/g, /\bmanagement\b/g,
  /\b\d+(\.\d+)?\s?(mg|g|ml|mcg|iu|units?)\b/g, /\bhistory of\b/g, /\bexamination\b/g, /\bcomplications?\b/g, /\binvestigations?\b/g, /\bdifferential\b/g, /\bprognosis\b/g];
export function isClinicalTopic(topicName, note){
  if(NONCLINICAL_TOPIC.test(String(topicName || ""))) return false;
  const t = String(note || "").toLowerCase();
  let hits = 0, kinds = 0;
  CLINICAL_WORDS.forEach(re => { const n = (t.match(re) || []).length; hits += n; if(n) kinds++; });
  return hits >= 8 && kinds >= 4;
}

export function buildCasePackPrompt(note, topicName){
  return `You write clinical training cases for Nigerian medical students in their clinical years (400 to 600 level).
Build them from the lecture note below, plus a few on the same topic as it is generally taught. Topic: "${cap(topicName, 120)}".

RULES
1. Each case has "basis": "note" or "general".
   - "note" cases (about two thirds of each list) are about a condition, presentation or management point that THIS NOTE teaches, with no diseases, drugs or doses the note does not mention. Each has "src": a SHORT verbatim quote (6 to 14 words) copied EXACTLY from the note that the case is built on.
   - "general" cases (at most ONE per list) cover standard, widely taught content on this same topic that the note leaves out or only touches on: what a Nigerian examiner would expect, following current Nigerian and WHO guidance and standard textbooks. They stay strictly on the topic "${cap(topicName, 120)}", name it (or the condition) in "topic_link", and use "src":"".
2. If the note is not clinical (for example pure anatomy or biochemistry with no patients), return {"osce":[],"quick":[],"daily":[]}: no general cases either.
3. Patients are fictional Nigerians with Nigerian names, in a Nigerian hospital. Titles name the presenting complaint, NEVER the diagnosis.
4. Keep every text field short and plain. Nigerian English is fine for what patients say.

RETURN STRICT JSON with this shape:
{
 "osce":[ up to 3 history-taking stations {
   "basis":"note or general", "topic_link":"", "title":"presenting complaint", "src":"...",
   "patient":{"name":"","age":"34","sex":"female"},
   "speaker":"who answers (the patient, or e.g. 'Musa's mother')",
   "persona":"one sentence on how they speak",
   "opening":"what they say when the doctor greets them",
   "background":"extra facts the patient knows (social, drugs, allergies)",
   "history":[ 8 to 12 {"id":"short_id","q":"a question a doctor asks","a":"the patient's answer in lay words","key":true or false} ],
   "dx":{"options":["4 or 5 diagnoses"],"correct":0},
   "form":{"q":"a question someone who already knows the topic still has to think about: which type, severity or complication this patient has","options":["3 or 4 look-alikes within the topic"],"correct":0},
   "plan":{"options":["4 next steps"],"correct":0},
   "teaching":["2 to 4 learning points from the note"]
 } ],
 "quick":[ up to 3 short cases {
   "basis":"note or general", "topic_link":"", "title":"presenting complaint", "src":"...",
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
 "daily":[ up to 4 {
   "basis":"note or general", "topic_link":"", "answer":"the diagnosis", "aliases":["other accepted names"], "src":"...",
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

// optional "form" question, asked instead of the diagnosis when the case is opened from its own topic
function cleanForm(f){
  const options = cleanOpts(f && f.options, 4), correct = idx(f && f.correct, options.length);
  return options.length >= 2 && correct >= 0 ? { q: cap(f.q, 160) || "These look alike. Which one fits this patient?", options, correct } : null;
}

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
    history, dx: { options: dxO, correct: dxC }, plan: { options: plO, correct: plC }, form: cleanForm(c.form),
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

// does a general case stay on the topic? It must name the topic (or a word of it) somewhere in its text
const STOP = new Set("with from that this have their into about over under after before what which when where while lecture topic notes note part introduction overview management".split(" "));
export function onTopic(c, topicName){
  const words = norm(topicName).split(" ").filter(w => w.length >= 4 && !STOP.has(w));
  if(!words.length) return true;   // a topic name with nothing to match on: trust the prompt
  const text = " " + norm(JSON.stringify(c)) + " ";
  return words.some(w => text.indexOf(" " + w) >= 0);
}

/* Validate a model response. Note cases must quote the note; general cases must stay on the topic,
 * are capped per mode and kept only when the note gave a case too.
 * Returns { osce, quick, daily, dropped, general } (possibly empty lists). */
export function validateCasePack(obj, note, topicName){
  const o = obj || {}; let dropped = 0;
  const keep = (kind, fn) => {
    let gen = 0;
    const out = (Array.isArray(o[kind]) ? o[kind] : []).slice(0, PACK_MAX[kind] + 2).map((c, i) => {
      if(!c){ dropped++; return null; }
      const general = c.basis === "general";
      if(general){ if(gen >= GENERAL_MAX[kind] || !onTopic(c, topicName)){ dropped++; return null; } }
      else if(!quoteInNote(c.src, note)){ dropped++; return null; }
      const x = fn(c, i); if(!x){ dropped++; return null; }
      if(general){ gen++; x.basis = "general"; x.src = ""; x.topicLink = cap(c.topic_link, 120); } else x.basis = "note";
      return x;
    }).filter(Boolean);
    const notes = out.filter(x => x.basis === "note"), gens = out.filter(x => x.basis === "general");
    return notes.slice(0, PACK_MAX[kind] - Math.min(gens.length, 1)).concat(gens.slice(0, 1));
  };
  const p = { osce: keep("osce", cleanOsce), quick: keep("quick", cleanQuick), daily: keep("daily", cleanDaily) };
  // a note that gave no case of its own (not clinical) gets no general cases either
  if(!["osce", "quick", "daily"].some(k => p[k].some(x => x.basis === "note"))){ dropped += packSize(p); p.osce = []; p.quick = []; p.daily = []; }
  p.dropped = dropped;
  p.general = ["osce", "quick", "daily"].reduce((n, k) => n + p[k].filter(x => x.basis === "general").length, 0);
  return p;
}

export function packSize(p){ return p ? (p.osce || []).length + (p.quick || []).length + (p.daily || []).length : 0; }
