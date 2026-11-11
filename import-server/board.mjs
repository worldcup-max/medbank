/* =====================================================================
 * WHITEBOARD EXPLAINER — the new Visualize (Standard / Layman modes)
 *
 * A board is a short narrated lesson drawn on a whiteboard: a title, a few
 * labelled doodles on one of five fixed layouts, and 3–9 spoken steps that
 * reveal them. The AI only chooses WHAT goes on the board and what is said;
 * the app places everything (whiteboard.js), so every board stays tidy on a
 * phone no matter what the model returns.
 *
 * Modes
 *   standard — explains and simplifies, but keeps the real medical terms
 *              (each defined in a few words). No persona, no jokes.
 *   layman   — "Auntie": one running everyday analogy, warm and funny,
 *              for someone with no medical background (the reel's style).
 * ===================================================================== */

export const BOARD_MODES = new Set(["standard", "layman"]);
export const BOARD_LAYOUTS = new Set(["hub", "chain", "cycle", "compare", "list"]);
export const DOODLES = ["circle","cell","nucleus","dna","mitochondria","heart","lung","brain","kidney","liver","stomach","bone","muscle","eye",
  "vessel","blood","drop","bacteria","virus","pill","syringe","shield","bolt","fire","clock","lock","key","gear","factory","house","person",
  "battery","truck","pot","crown","star","up","down","check","cross","question","molecule","book","door","scale","wave"];
const DOODLE_SET = new Set(DOODLES);

const LIMITS = { items:[2,7], steps:[3,9], label:30, note:60, say:260, title:60, subtitle:70 };

function modeRules(mode){
  if(mode === "layman") return (
`VOICE — LAYMAN ("Auntie Explains"):
- You are Auntie: a warm, witty Nigerian auntie explaining to someone with NO medical background.
- Pick ONE everyday analogy for the whole board (a church potluck, a market, a bus park, a kitchen, a wedding, a football team…) and map every item onto it. Keep using the same analogy all the way through.
- Name each medical term ONCE, then explain it through the analogy in plain words. Light, kind humour is welcome ("bless their hearts, they never sit down").
- "title" is playful and names the analogy (e.g. "The cell's Sunday potluck"). "subtitle" is a short funny line.
- Each item's "note" is a short quote of what it does IN THE ANALOGY (e.g. "runs the whole church").`);
  return (
`VOICE — STANDARD:
- You are a clear, calm medical lecturer. Explain the source simply and in order, so a medical student understands it before reading the detail.
- KEEP the real medical terms — do not replace them with everyday words. Define each the first time in a few plain words.
- No persona, no jokes. Use an everyday comparison only if one short phrase genuinely helps.
- "title" is the plain topic (e.g. "Cell organelles"). "subtitle" is one plain line on what the board shows.
- Each item's "note" is a precise short phrase of its role (e.g. "holds DNA, controls the cell").`);
}

export function buildBoardPrompt(text, subject, mode){
  mode = BOARD_MODES.has(mode) ? mode : "standard";
  return (
`You turn a passage from a student's medical note into a short WHITEBOARD LESSON: a narrator talks while simple labelled doodles appear on a whiteboard one by one.

${modeRules(mode)}

FAITHFULNESS (both voices): explain ONLY what the source says. No new facts, numbers, drugs or causes that are not in it. Accuracy beats humour.

PICK ONE LAYOUT for the board:
- "hub": one central thing with 2–6 parts or features around it (e.g. a cell and its organelles). Give "center".
- "chain": 2–6 steps that happen in order, each causing the next (a mechanism or pathway).
- "cycle": 3–6 steps that loop back to the start. Give "center" (what the loop is).
- "compare": two things side by side. Give "columns" (two short headings) and put each item in column 0 or 1 ("col").
- "list": 2–6 separate points of equal weight (types, features, signs).

DOODLES: every item (and the center) gets ONE doodle from this list, the closest match: ${DOODLES.join(", ")}.

STEPS: 3–9 steps, in the order of the source. Each step is 1–2 short spoken sentences (max 40 words) in the chosen voice, and lists the item ids it reveals in "show". Reveal items in the order you talk about them; every item must be shown by some step. The first step introduces the board (it may show nothing or the first item). The last step sums up in one line.

READY QUESTIONS: add 2–3 questions a student is most likely to ask about this board ("faq"), each with a 1–3 sentence spoken answer in the same voice, faithful to the source, and a sticky-note summary of ≤ 8 words.

LIMITS: item labels ≤ 3 words; notes ≤ 8 words; 2–7 items.

Return ONLY JSON in exactly this shape:
{"title":"","subtitle":"","layout":"hub|chain|cycle|compare|list","center":{"label":"","doodle":""},"columns":["",""],"items":[{"id":"a","label":"","note":"","doodle":"","col":0}],"steps":[{"say":"","show":["a"]}],"faq":[{"q":"","a":"","note":""}]}
("center" only for hub/cycle; "columns" and "col" only for compare.)

SUBJECT: ${subject || "medicine"}
SOURCE: ${text}`);
}

const clip = (s, n) => { s = String(s == null ? "" : s).replace(/\s+/g, " ").trim(); return s.length > n ? s.slice(0, n - 1).trimEnd() + "…" : s; };

/* Normalise what the model returned into a board the player can always draw.
 * Fixable problems are fixed (unknown doodle → circle, long label → clipped,
 * an item never shown → added to the last step). Real problems are returned
 * as issues so the caller can retry once. */
export function normalizeBoard(raw, mode){
  const issues = [];
  if(!raw || typeof raw !== "object") return { board:null, issues:["not a JSON object"] };
  const b = { kind:"board", v:1, mode: BOARD_MODES.has(mode) ? mode : "standard" };
  b.title = clip(raw.title, LIMITS.title); if(!b.title) issues.push("missing title");
  b.subtitle = clip(raw.subtitle, LIMITS.subtitle);
  b.layout = BOARD_LAYOUTS.has(raw.layout) ? raw.layout : "list";
  if(!BOARD_LAYOUTS.has(raw.layout)) issues.push("layout must be one of hub, chain, cycle, compare, list");
  const doodle = d => { d = String(d || "").toLowerCase().trim(); return DOODLE_SET.has(d) ? d : "circle"; };
  const seen = new Set();
  b.items = (Array.isArray(raw.items) ? raw.items : []).map((it, k) => {
    let id = String((it && it.id) || "i" + k).trim() || "i" + k; if(seen.has(id)) id = id + "_" + k; seen.add(id);
    const o = { id, label: clip(it && it.label, LIMITS.label), note: clip(it && it.note, LIMITS.note), doodle: doodle(it && it.doodle) };
    if(b.layout === "compare") o.col = (Number(it && it.col) === 1) ? 1 : 0;
    return o;
  }).filter(it => it.label);
  if(b.items.length < LIMITS.items[0]) issues.push("need at least 2 items with labels");
  if(b.items.length > LIMITS.items[1]){ issues.push("too many items (max 7)"); b.items = b.items.slice(0, LIMITS.items[1]); }
  if(b.layout === "hub" || b.layout === "cycle"){
    const c = raw.center || {};
    b.center = { label: clip(c.label, LIMITS.label) || clip(raw.title, LIMITS.label), doodle: doodle(c.doodle) };
  }
  if(b.layout === "compare"){
    const cols = Array.isArray(raw.columns) ? raw.columns : [];
    b.columns = [clip(cols[0], 24) || "A", clip(cols[1], 24) || "B"];
    if(!cols[0] || !cols[1]) issues.push("compare needs two column headings");
    if(!b.items.some(i => i.col === 0) || !b.items.some(i => i.col === 1)) issues.push("compare needs items in both columns");
  }
  const ids = new Set(b.items.map(i => i.id));
  b.steps = (Array.isArray(raw.steps) ? raw.steps : []).map(s => ({
    say: clip(s && (s.say || s.narration || s.text), LIMITS.say),
    show: (Array.isArray(s && s.show) ? s.show : []).map(String).filter(id => ids.has(id)),
  })).filter(s => s.say);
  if(b.steps.length < LIMITS.steps[0]) issues.push("need at least 3 spoken steps");
  if(b.steps.length > LIMITS.steps[1]) b.steps = b.steps.slice(0, LIMITS.steps[1]);
  // every item must appear: put any never-shown item on the last step rather than fail the board
  const shown = new Set(b.steps.flatMap(s => s.show));
  const missing = b.items.filter(i => !shown.has(i.id)).map(i => i.id);
  if(missing.length && b.steps.length) b.steps[b.steps.length - 1].show.push(...missing);
  // an item shown twice is only drawn once — keep the first
  b.faq = (Array.isArray(raw.faq) ? raw.faq : []).map(f => ({ q: clip(f && f.q, 120), a: clip(f && f.a, LIMITS.say), note: clip(f && f.note, 60) })).filter(f => f.q && f.a).slice(0, 3);
  const drawn = new Set(); b.steps.forEach(s => { s.show = s.show.filter(id => !drawn.has(id) && drawn.add(id)); });
  return { board: issues.length && !(b.items.length >= 2 && b.steps.length >= 3) ? null : b, issues };
}

export function boardKey(textKeyFn, text, mode){ return textKeyFn("board|" + (BOARD_MODES.has(mode) ? mode : "standard") + "|" + (text || "")); }

/* =====================================================================
 * ASK AUNTIE — a student pauses a board and asks a question.
 * Every board keeps one shared question bank. A new question is first
 * matched against the bank (same meaning, different words → the saved
 * answer plays, free); only a genuinely new question gets a new answer,
 * which is then saved for the next student. One model call does both.
 * ===================================================================== */
export function normQ(q){ return String(q||"").toLowerCase().replace(/[^a-z0-9 ]+/g," ").replace(/\b(please|auntie|aunty|um|uh|so|like|can you|could you|tell me)\b/g," ").replace(/\s+/g," ").trim(); }
export function boardIdentity(b){ return JSON.stringify({ t:b&&b.title, m:b&&b.mode, i:(b&&b.items||[]).map(x=>x.label), s:(b&&b.steps||[]).map(x=>x.say) }); }

export function buildAskPrompt(board, step, question, bank){
  const mode = board && board.mode === "layman" ? "layman" : "standard";
  const voice = mode === "layman"
    ? `Answer as Auntie: warm, witty, plain words, using the SAME everyday analogy as the board ("${board.title}"). Name the medical term once if needed.`
    : `Answer as a clear, calm medical lecturer. Keep the real medical terms and define them in a few words.`;
  const lines = (board.steps||[]).map((s,k)=>`${k+1}. ${s.say}`).join("\n");
  const items = (board.items||[]).map(i=>`- ${i.label}: ${i.note||""}`).join("\n");
  const prev = (bank||[]).map((x,k)=>`[${k}] ${x.q}`).join("\n") || "(none yet)";
  return (
`A student paused a narrated whiteboard lesson to ask a question by voice (it may be mis-transcribed: read it charitably).

BOARD: "${board.title}"${board.subtitle?` (${board.subtitle})`:""}
ON THE BOARD:
${items}
WHAT THE LESSON SAYS:
${lines}
${board.src?`SOURCE (the student's own note):\n${String(board.src).slice(0,2000)}\n`:""}
THE STUDENT PAUSED AT STEP ${Number(step)+1}.
STUDENT'S QUESTION: "${question}"

QUESTIONS ALREADY ANSWERED FOR THIS BOARD:
${prev}

1. If the student's question asks the SAME thing as one already answered (same meaning, even in different words), return ONLY {"same": <its number>}.
2. Otherwise answer it. ${voice}
   - 1–3 short spoken sentences (max 60 words), then the lesson carries on, so do not ask them anything back.
   - Answer from the board and the source first. If the source does not cover it, still answer briefly and correctly from standard medical knowledge, and set "beyond": true.
   - "note": the key point for a sticky note on the board, max 8 words.
   - "q": the question rewritten cleanly (fix mis-transcription), max 15 words.
   Return ONLY {"q":"","answer":"","note":"","beyond":false}.`);
}
export function parseAsk(o, bankLen){
  if(!o || typeof o !== "object") return null;
  if(o.same != null && Number.isInteger(Number(o.same)) && Number(o.same) >= 0 && Number(o.same) < bankLen) return { same: Number(o.same) };
  const a = clip(o.answer || o.a, 400); if(!a) return null;
  return { q: clip(o.q, 120), a, note: clip(o.note, 60), beyond: !!o.beyond };
}
