/* =====================================================================
 * MedBank — Import server (Phase 5)
 * The secure, server-side engine behind the app's "Import lectures" tab and
 * the Paystack payment webhook. Runs on a small host (Render/Railway/Fly) with
 * your Anthropic key + Supabase service role. NEVER ships in the app.
 *
 * Endpoints:
 *   POST /import          — auth + gate + generate + validate + save topic
 *   POST /paystack/webhook— verify payment, flip subscription to active
 *   GET  /health
 *
 * Env (set on the host):
 *   SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, ANTHROPIC_API_KEY, PAYSTACK_SECRET_KEY
 *
 * Setup:  npm i express @supabase/supabase-js @anthropic-ai/sdk pdf-parse
 * Run:    node server.mjs
 * ===================================================================== */
import express from "express";
import crypto from "node:crypto";
import { createClient } from "@supabase/supabase-js";
import Anthropic from "@anthropic-ai/sdk";
import { createRequire } from "node:module";
import { createHash } from "node:crypto";
import { kokoroPrep, sayPrep, mergeTerms, knownTerm, KOKORO_DEFAULT } from "./med-voice.mjs";
import { buildVisualPrompt, qcCheck, graphCheck, chainOf, parseBlueprint, textKey, renderHints, registerAssets, assetDefs, LAYOUTS } from "./visualize.mjs";
const require = createRequire(import.meta.url);

const admin = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY, { auth:{ persistSession:false } });
const anthropic = new Anthropic();
const app = express();
// CORS: the app + website call this from a different origin. Set ALLOWED_ORIGINS
// (comma-separated) on the host to restrict; defaults to "*" for easy first setup.
const ALLOWED = (process.env.ALLOWED_ORIGINS || "*").split(",").map(s=>s.trim());
app.use((req, res, next) => {
  const o = req.headers.origin;
  if (ALLOWED[0] === "*") res.setHeader("Access-Control-Allow-Origin", "*");
  else if (o && ALLOWED.includes(o)) res.setHeader("Access-Control-Allow-Origin", o);
  res.setHeader("Access-Control-Allow-Headers", "authorization, content-type");
  res.setHeader("Access-Control-Allow-Methods", "POST, GET, OPTIONS");
  if (req.method === "OPTIONS") return res.status(204).end();
  next();
});
app.use("/paystack/webhook", express.raw({ type:"*/*" }));   // raw body for signature check
app.use(express.json({ limit:"48mb" }));   // roomy enough for a ~25MB audio file as base64

/* same stable card id as the app: cid(topicId,deck,c) = topicId|deckInitial|hstr(q) */
function hstr(s){ let h=5381; s=s||""; for(let i=0;i<s.length;i++) h=((h<<5)+h+s.charCodeAt(i))|0; return (h>>>0).toString(36); }

/* best-effort map a card's note-quote to the transcript moment it was spoken (seconds) */
function matchTime(src, transcript){
  if(!src || !Array.isArray(transcript) || !transcript.length) return null;
  const words = (""+src).toLowerCase().match(/[a-z]{4,}/g) || [];
  if(words.length < 2) return null;
  let best=null, score=0;
  for(const seg of transcript){
    const st=(seg.text||"").toLowerCase(); let sc=0;
    for(const w of words){ if(st.indexOf(w)>=0) sc++; }
    if(sc>score){ score=sc; best=seg; }
  }
  return (best && score>=2) ? best.t : null;
}

/* validate a topic object (in memory) reusing the same rules as the CLI validator */
function validateObj(obj){
  const errors=[];
  if(!obj.note_md || obj.note_md.trim().length<200) errors.push("note_md too short");
  if(!obj.simplified_md || obj.simplified_md.trim().length<200) errors.push("simplified_md too short");
  const chk=(deck,arr)=>{ if(!Array.isArray(arr)||!arr.length){ errors.push(deck+": no cards"); return; }
    arr.forEach((c,i)=>{ if(!c.q) errors.push(`${deck}[${i}] no q`);
      if(deck==="recall"){ if(!Array.isArray(c.opts)||c.opts.length!==4) errors.push(`${deck}[${i}] opts must be 4-item list`);
        if(!Number.isInteger(c.ans)||c.ans<0||c.ans>3) errors.push(`${deck}[${i}] bad ans`); if(!c.a) errors.push(`${deck}[${i}] no a`); }
      else { ["lecturer","explain","tie"].forEach(k=>{ if(!c[k]) errors.push(`${deck}[${i}] no ${k}`); }); } }); };
  chk("primer",(obj.primer||{}).cards); chk("recall",(obj.recall||{}).cards);
  return errors;
}

async function getUser(req){
  const tok=(req.headers.authorization||"").replace(/^Bearer\s+/i,"");
  if(!tok) return null;
  const { data } = await admin.auth.getUser(tok);
  return data && data.user ? data.user : null;
}
/* test override: emails in PREMIUM_TEST_EMAILS (comma-separated) count as premium — for building/QA only */
const PREMIUM_TEST = (process.env.PREMIUM_TEST_EMAILS||"").toLowerCase().split(",").map(s=>s.trim()).filter(Boolean);
async function isPremium(account_id, emailHint){ try{
  const s=await admin.from("subscriptions").select("status").eq("account_id",account_id).maybeSingle();
  if(s.data && s.data.status==="active") return true;
  if(PREMIUM_TEST.length){                                   // only runs when a test list is set (empty in production)
    // Prefer the caller's auth-token email (always present); only hit the accounts table
    // if no hint was passed. This fixes premium test-accounts whose accounts.email row is blank.
    let em=(emailHint||"").toLowerCase().trim();
    if(!em || PREMIUM_TEST.indexOf(em)<0){
      const a=await admin.from("accounts").select("email").eq("id",account_id).maybeSingle();
      em=(a.data && a.data.email || "").toLowerCase().trim();
    }
    if(em && PREMIUM_TEST.indexOf(em)>=0) return true;
  }
  return false;
}catch(e){ return false; } }
async function builtCount(account_id){ try{ const c=await admin.from("topics").select("id",{ count:"exact", head:true }).eq("account_id",account_id); return c.count||0; }catch(e){ return 0; } }
/* today's Visualize allowance for a user — basic 3/day, premium 10/day (only new builds count) */
async function vizQuota(userId, emailHint){
  const premium = await isPremium(userId, emailHint).catch(()=>false);
  const limit = premium ? 10 : 3;
  let used = 0;
  try{ const since=new Date(); since.setUTCHours(0,0,0,0);
    const c=await admin.from("viz_events").select("id",{ count:"exact", head:true }).eq("account_id",userId).gte("created_at",since.toISOString());
    used=(c && !c.error)?(c.count||0):0; }catch(_){}
  return { limit, remaining:Math.max(0,limit-used), premium };
}
const FREE_BUILD_LIMIT = 1;   // free accounts can build 1 lecture; everything inside it stays free

/* transcribe a recorded lecture with OpenAI (gpt-4o-transcribe / whisper-1).
 * Node 22 gives us global fetch/FormData/Blob. Audio file must be <= 25MB. */
async function transcribeAudio(b64, mime){
  // Prefer Groq Whisper large-v3 when a key is set — same Whisper model as OpenAI,
  // ~18x cheaper. Falls back to OpenAI Whisper automatically if no Groq key.
  const useGroq = !!process.env.GROQ_API_KEY && (process.env.STT_PROVIDER || "groq") !== "openai";
  const key = useGroq ? process.env.GROQ_API_KEY : process.env.OPENAI_API_KEY;
  if(!key) throw new Error((useGroq?"GROQ_API_KEY":"OPENAI_API_KEY")+" not set — needed to transcribe recorded lectures");
  const buf = Buffer.from(b64, "base64");
  if(buf.length > 25*1024*1024) throw new Error("Recording too long to transcribe (over ~45 min). Split it and try again.");
  const m = (mime||"").toLowerCase();
  const ext = m.includes("mp4")||m.includes("m4a") ? "mp4" : m.includes("mpeg")||m.includes("mp3") ? "mp3" : m.includes("wav") ? "wav" : m.includes("ogg") ? "ogg" : "webm";
  const fd = new FormData();
  fd.append("file", new Blob([buf], { type: mime || "audio/webm" }), "lecture."+ext);
  fd.append("model", useGroq ? (process.env.GROQ_STT_MODEL || "whisper-large-v3") : "whisper-1");
  fd.append("response_format", "verbose_json");        // both return per-segment timestamps
  fd.append("timestamp_granularities[]", "segment");
  const url = useGroq ? "https://api.groq.com/openai/v1/audio/transcriptions"
                      : "https://api.openai.com/v1/audio/transcriptions";
  const r = await fetch(url, {
    method:"POST", headers:{ Authorization:"Bearer "+key }, body: fd });
  if(!r.ok){ const t=await r.text().catch(()=> ""); throw new Error("transcription failed ("+r.status+"): "+t.slice(0,200)); }
  const j = await r.json();
  const segments = (j.segments||[]).map(s=>({ t:Math.max(0,Math.round(s.start||0)), text:(s.text||"").trim() })).filter(s=>s.text);
  return { text:(j.text||"").trim(), segments };
}

async function extractContent(body){
  const parts=[], images=[]; let transcript=null;
  if(body.text) parts.push({ type:"text", text:"RAW LECTURE:\n\n"+body.text });
  if(body.pdf_base64){ const pdf=require("pdf-parse"); const d=await pdf(Buffer.from(body.pdf_base64,"base64")); parts.push({ type:"text", text:"RAW LECTURE (PDF):\n\n"+d.text }); }
  if(body.audio_base64){ const tr=await transcribeAudio(body.audio_base64, body.audio_mime); if(tr.text) parts.push({ type:"text", text:"RAW LECTURE (RECORDED IN CLASS, AUTO-TRANSCRIBED):\n\n"+tr.text }); if(tr.segments && tr.segments.length) transcript=tr.segments; }
  if(body.youtube_url){
    const { YoutubeTranscript } = require("youtube-transcript");
    let items;
    try{ items = await YoutubeTranscript.fetchTranscript(body.youtube_url); }
    catch(e){ throw new Error("Couldn't read this video's captions. Make sure it's a public video that has captions/subtitles, or paste the text or upload the slides instead."); }
    const txt = (items||[]).map(x=>x.text).join(" ").replace(/\s+/g," ").trim();
    if(!txt) throw new Error("This video has no readable captions. Try one with subtitles, or paste the text instead.");
    parts.push({ type:"text", text:"RAW LECTURE (YOUTUBE TRANSCRIPT):\n\n"+txt });
    transcript = (items||[]).map(x=>({ t:Math.max(0,Math.round((x.offset||0)/1000)), text:(x.text||"").trim() })).filter(x=>x.text);
  }
  (body.images||[]).forEach(img=>{ images.push({ type:"image", source:{ type:"base64", media_type:img.media_type||"image/jpeg", data:img.data } }); });
  return { parts, images, transcript };
}

/* ---- multi-provider generation: routes by model name ----
 * claude -> Anthropic | gpt / o -> OpenAI | deepseek -> DeepSeek | gemini -> Gemini
 * Keys (set on the host as needed): ANTHROPIC_API_KEY, OPENAI_API_KEY, DEEPSEEK_API_KEY, GEMINI_API_KEY
 * Returns { text, usage:{input_tokens, output_tokens} }. */
const BASIC_MODEL   = process.env.MEDBANK_BASIC_MODEL   || "deepseek-v4-flash";  // cheap + fast → basic tier
const PREMIUM_MODEL = process.env.MEDBANK_PREMIUM_MODEL || "deepseek-v4-pro";    // higher accuracy → premium tier
const TEXT_MODEL    = process.env.MEDBANK_TEXT_MODEL    || BASIC_MODEL;          // fallback when tier is unknown; retires Claude
async function generate({ model, prompt, parts, images, max_tokens, temperature, json }){
  // Claude is retired for this app: route any Claude / empty text model to DeepSeek.
  // (Vision models like gpt-4o / gemini are left alone so Solve keeps working.)
  if(!model || /^claude/i.test(model)) model = TEXT_MODEL;
  const m = (model||"").toLowerCase();
  const textParts = (parts||[]).map(p=>p.text);
  const imgs = (images||[]).map(im=>({ media_type: im.source.media_type, data: im.source.data }));

  if(m.startsWith("claude")){
    const resp = await anthropic.messages.create({
      model, max_tokens, temperature,
      messages:[{ role:"user", content:[{ type:"text", text:prompt }, ...(images||[]), ...(parts||[]) ] }]
    });
    return { text: resp.content.map(b=>b.type==="text"?b.text:"").join(""),
             usage:{ input_tokens:(resp.usage||{}).input_tokens, output_tokens:(resp.usage||{}).output_tokens } };
  }

  if(m.startsWith("gemini")){
    const key = process.env.GEMINI_API_KEY; if(!key) throw new Error("GEMINI_API_KEY not set");
    const gparts = [{ text: prompt }]
      .concat(imgs.map(i=>({ inline_data:{ mime_type:i.media_type, data:i.data } })))
      .concat(textParts.map(t=>({ text:t })));
    const r = await fetch("https://generativelanguage.googleapis.com/v1beta/models/"+model+":generateContent?key="+key, {
      method:"POST", headers:{ "Content-Type":"application/json" },
      body: JSON.stringify({ contents:[{ role:"user", parts:gparts }], generationConfig:{ maxOutputTokens:max_tokens, temperature, ...(json?{responseMimeType:"application/json"}:{}) } })
    });
    const j = await r.json();
    if(!r.ok) throw new Error("Gemini: "+((j.error&&j.error.message)||r.status));
    const cand=((j.candidates||[])[0]||{}).content||{};
    const text=(cand.parts||[]).map(p=>p.text||"").join("");
    const um=j.usageMetadata||{};
    return { text, usage:{ input_tokens:um.promptTokenCount, output_tokens:um.candidatesTokenCount } };
  }

  // OpenAI-compatible: OpenAI + DeepSeek
  const isDeep = m.startsWith("deepseek");
  const base = isDeep ? "https://api.deepseek.com/v1" : "https://api.openai.com/v1";
  const key = isDeep ? process.env.DEEPSEEK_API_KEY : process.env.OPENAI_API_KEY;
  if(!key) throw new Error((isDeep?"DEEPSEEK_API_KEY":"OPENAI_API_KEY")+" not set");
  const content = [{ type:"text", text:prompt }];
  if(!isDeep) imgs.forEach(i=> content.push({ type:"image_url", image_url:{ url:"data:"+i.media_type+";base64,"+i.data } }));
  textParts.forEach(t=> content.push({ type:"text", text:t }));
  const body = { model, messages:[{ role:"user", content }] };
  if(isDeep){ body.max_tokens = max_tokens; body.temperature = temperature; }
  else { body.max_completion_tokens = max_tokens; }   // OpenAI newer models: leave temperature default
  // JSON mode: forces a clean JSON object and suppresses chain-of-thought preamble that otherwise
  // eats the whole token budget before any JSON is emitted (the cause of "parse failed" on reasoning models)
  if(json) body.response_format = { type:"json_object" };
  const r = await fetch(base+"/chat/completions", { method:"POST",
    headers:{ "Content-Type":"application/json", "Authorization":"Bearer "+key }, body:JSON.stringify(body) });
  const j = await r.json();
  if(!r.ok) throw new Error((isDeep?"DeepSeek":"OpenAI")+": "+((j.error&&j.error.message)||r.status));
  const msg=(((j.choices||[])[0]||{}).message)||{};
  // reasoning models sometimes leave `content` empty and put the answer in `reasoning_content`
  const text=(msg.content && msg.content.trim()) ? msg.content : (msg.reasoning_content||"");
  const u=j.usage||{};
  return { text, usage:{ input_tokens:u.prompt_tokens, output_tokens:u.completion_tokens } };
}

/* Pick the CORE build prompt for this student's level: a level-specific active row,
 * else the default (level = null). Backward-compatible — if the kind/level columns
 * haven't been added yet, it falls back to the single active import_generation row,
 * so imports keep working before the migration is run. */
async function loadImportPrompt(level){
  const sel = "template,model,max_tokens,temperature";
  const q = () => admin.from("prompt_templates").select(sel).eq("key","import_generation").eq("is_active",true);
  const legacy = async () => (await q().maybeSingle()).data || null;
  if(level!=null){
    const rl = await q().eq("kind","core").eq("level",level).maybeSingle();
    if(rl.error) return legacy();                 // columns not migrated yet
    if(rl.data) return rl.data;                   // level-specific wins
  }
  const rd = await q().eq("kind","core").is("level",null).maybeSingle();
  if(rd.error) return legacy();
  return rd.data || legacy();
}

/* generalised prompt loader for any build kind (core / cram / fill_blank / written) */
async function loadPromptFor(kind, level){
  const sel = "template,model,max_tokens,temperature";
  const q = () => admin.from("prompt_templates").select(sel).eq("key","import_generation").eq("is_active",true);
  if(level!=null){ const rl = await q().eq("kind",kind).eq("level",level).maybeSingle(); if(rl.error) return null; if(rl.data) return rl.data; }
  const rd = await q().eq("kind",kind).is("level",null).maybeSingle();
  if(rd.error) return null;
  return rd.data || null;
}

/* built-in default prompts for the optional extras (each overridable via a DB row per kind/level) */
const DEFAULT_PROMPTS = {
  fill_blank: "You are creating fill-in-the-blank study items for a medical student from the lecture note below. Return ONLY valid JSON of the form {\"items\":[{\"text\":\"a sentence from the material with exactly ONE key term replaced by ___ (three underscores)\",\"answer\":\"the removed term\",\"hint\":\"a short nudge that does NOT contain the answer\"}]}. Make 8-15 items covering the most important, testable facts. Each blank must be a single specific term or short phrase, and the sentence must stay faithful to the note.\n\nLECTURE NOTE:\n{{note}}",
  written: "You are setting short-answer / written-test questions for a medical student from the lecture note below. Return ONLY valid JSON of the form {\"items\":[{\"prompt\":\"an exam-style short-answer question (define / describe / explain / compare)\",\"model_answer\":\"a concise ideal answer\",\"points\":[\"key marking point 1\",\"key marking point 2\",\"key marking point 3\"]}]}. Make 5-8 questions matching how medical exams test this topic; the points array is the marking rubric.\n\nLECTURE NOTE:\n{{note}}"
};

/* "Solve" — a photo/text question (MCQ, past question, diagram) → worked explanation */
const SOLVE_PROMPT = "You are a sharp medical tutor helping a student with a question they've shared as a photo and/or text. It may be a multiple-choice question, a past exam question, or a diagram to interpret. First, state the answer clearly (for an MCQ, name the correct option). Then explain the reasoning step by step in plain, exam-relevant language a medical student understands, and for an MCQ briefly say why the other options are wrong. If the image is unclear or cut off, say what you can and ask for a clearer photo. Be accurate and concise — never invent facts you can't see.";

/* generate one optional extra (fill_blank / written) from the built note; returns items[] or null */
async function buildExtra(kind, level, note, model){
  const row = await loadPromptFor(kind, level);
  const tmpl = (row && row.template) || DEFAULT_PROMPTS[kind];
  if(!tmpl) return null;
  const prompt = tmpl.replace(/\{\{note\}\}/g, note || "");
  const gen = await generate({ model:(row&&row.model)||model, prompt, parts:[], images:[], max_tokens:(row&&row.max_tokens)||6000, temperature:Number(row&&row.temperature)||0.3 });
  const t=gen.text||"", s=t.indexOf("{"), e=t.lastIndexOf("}");
  try{
    const o=JSON.parse(t.slice(s,e+1));
    let items = (o && Array.isArray(o.items)) ? o.items : null;
    if(!items || !items.length) return null;
    if(kind==="fill_blank"){        // must have a real blank + an answer, or it renders as an empty "…" item
      items = items.filter(it => it && typeof it.text==="string" && /_{2,}/.test(it.text) && String(it.answer||"").trim());
    } else if(kind==="written"){
      items = items.filter(it => it && String(it.prompt||"").trim());
    }
    return items.length ? items : null;
  }catch(_){ return null; }
}

/* resolve the model for a student (paid vs trial), reused by extras / podcast */
async function resolveModel(account_id, level){
  // in-app generation (podcast script, extras, tutor, etc.) ALWAYS uses Flash.
  // Tiering (Flash basic / Pro premium) applies ONLY to the lecture import build.
  return BASIC_MODEL;
}

/* ---- Podcast: two-host study episode from a lecture note (script + Fish/Kokoro voices) ---- */
const PODCAST_PROMPT = `You are an expert medical educator and podcast scriptwriter. Write a two-host audio podcast script that TEACHES the topic below to medical / health-science students preparing for exams and clinical rotations, based ONLY on the supplied note. It must be accurate, engaging, well-paced, and built for spoken audio.

HOSTS — peers, never a lecturer/student dynamic. Do NOT use any names in the spoken text (the student picks the voices later, so a hardcoded name would clash):
- HOST A — warm and curious: asks the "wait, why?" questions a learner would ask.
- HOST B — precise: explains the mechanism and the clinical relevance.

LEVEL: pitch the depth for {{level}}. Lower levels — explain fundamentals and mechanisms plainly. Higher levels — move faster through basics, deeper into management, edge cases, and exam nuance.

{{length}}

PACING & RHYTHM: never pack more than 2 concepts into one line. VARY the length like a real chat — mix very short reactions and questions (3-8 words: "wait, why?", "exactly", "ooh, that's the trap") with longer explanations. Do NOT make every line the same length: even, balanced turns are exactly what makes a podcast sound like two monologues stitched together — avoid that.

FLOW — THIS IS WHAT MAKES IT SOUND HUMAN (most important rule): every turn must CONNECT to the one before it. Open most lines by reacting to or building on what the other host just said — a quick acknowledgement or pivot ("Right —", "Exactly, and here's the thing —", "Ooh, good point —", "Wait, back up —", "Yeah, so..."). Let one host finish or gently interrupt the other's thought, and let a sentence carry across the hand-off (one host sets it up, the other lands it). Sprinkle natural spoken fillers ("so", "I mean", "you know") sparingly. It must sound like two friends talking — NOT two people reading alternate paragraphs. Write to be SPOKEN: contractions, natural rhythm, never bookish.

STRUCTURE (follow this order):
1. HOOK (2-3 lines): open by framing why the topic matters — its clinical stakes (how common, how it's tested, what goes wrong if missed) — BEFORE any detail. Make them want to keep listening. Never cold-open into facts.
2. SIGNPOSTED BODY: group content into clear sections (by system, cause, or stage). Begin each section with a short spoken transition that names it ("that's the cardiovascular side — now the renal changes"). For EVERY key fact or number, add one sentence of WHY — the mechanism or the clinical consequence. Never leave a bare statistic unexplained. After each major section, add one quick clinical application or exam-trap callout ("a creatinine of 0.8 in pregnancy is a red flag").
3. RECAP as ACTIVE RECALL (final 2-3 lines): pose quick self-test questions and answer them ("what's a normal haemoglobin in pregnancy? Around 10.5 to 11"), not a passive summary.

CHAPTERS: tag EVERY line with a short Title Case "section" label (e.g. "Overview", "Cardiovascular", "Renal", "Clinical pearls", "Recap"). Consecutive lines share the label; the first line of a new section starts a chapter.

SOURCE ANCHOR: for EVERY line include "src" — a SHORT verbatim quote (6-12 words) copied EXACTLY (same words and casing) from the note the line is based on, so the app can scroll the note to that spot as the line plays. Prefer a distinctive fragment. For a pure transition/banter line, use the nearest heading from the note.

ACCURACY & SAFETY: base everything strictly on the note — do not invent figures, drugs, or guidelines. Keep numbers, ranges, and units EXACTLY as in the note. Prioritise high-yield, exam-relevant facts.

NEVER emit an empty or placeholder line — every line must contain real spoken text (empty segments break audio generation). No stage directions, sound effects, or bracketed notes inside the spoken text.

SELF-CHECK silently before returning: every line has real text; the length target is met (if short, ADD depth and "why", not new bare facts); every number has a "why it matters"; there is a hook, signposted sections with spoken transitions, and an active-recall recap; line lengths VARY (not all similar); and MOST turns open by reacting to / building on the previous line so it reads as one flowing conversation, not alternating monologues. If any turn could stand alone as its own paragraph, rewrite it to connect.

Return ONLY valid JSON: {"lines":[{"speaker":"A"|"B","text":"one spoken line","section":"Section label","src":"verbatim note quote"}]}.

LECTURE NOTE:
{{note}}`;
const PODCAST_LEN = {
  deep:  'LENGTH & PACING (critical): target a spoken runtime of 7-9 minutes (~1,100-1,400 words) — 26-34 lines, mostly alternating A/B, each 1-3 sentences (~15-35 words). Do NOT compress the topic into a rapid fact-list; depth and pacing matter more than covering everything fast. If it runs short, add explanation and "why", not more bare facts.',
  quick: 'LENGTH & PACING: a tight ~3-minute review — 12-16 lines, each 1-2 sentences. Hit only the highest-yield points and exam essentials; keep the hook and the active-recall recap, but trim to the single most important exam-trap. Every line must earn its place.'
};
async function podcastScript(level, note, model, mode){
  const row = await loadPromptFor("podcast", level);
  const tmpl = (row && row.template) || PODCAST_PROMPT;
  const levelLabel = level ? ("a Year/Level "+level+" medical student") : "medical students";
  const lenText = PODCAST_LEN[mode==="quick" ? "quick" : "deep"];
  const prompt = tmpl.replace(/\{\{note\}\}/g, note || "").replace(/\{\{level\}\}/g, levelLabel).replace(/\{\{length\}\}/g, lenText);
  const maxTok = (row&&row.max_tokens) || (mode==="quick" ? 3000 : 6000);
  const gen = await generate({ model:(row&&row.model)||model, prompt, parts:[], images:[], max_tokens:maxTok, temperature:Number(row&&row.temperature)||0.6 });
  const t=gen.text||"", s=t.indexOf("{"), e=t.lastIndexOf("}");
  try{ const o=JSON.parse(t.slice(s,e+1));
    return (o&&Array.isArray(o.lines))
      ? o.lines.filter(l=>l&&l.text&&(l.speaker==="A"||l.speaker==="B"))
               .map(l=>({ speaker:l.speaker, text:String(l.text), section:(l.section||"").toString().slice(0,40), src:(l.src||"").toString().slice(0,160) }))
      : null;
  }catch(_){ return null; }
}
async function openaiTTS(text, voice, _retry){
  const key = process.env.OPENAI_API_KEY; if(!key) throw new Error("OPENAI_API_KEY not set on the server");
  const ctrl=new AbortController(); const to=setTimeout(()=>ctrl.abort(),30000); let r;
  try{ r = await fetch("https://api.openai.com/v1/audio/speech", {
    method:"POST", signal:ctrl.signal, headers:{ "Authorization":"Bearer "+key, "Content-Type":"application/json" },
    body: JSON.stringify({ model: process.env.OPENAI_TTS_MODEL || "tts-1", voice: voice||"nova", input: text, response_format:"mp3" }) });
  }catch(e){ clearTimeout(to); if(!_retry) return openaiTTS(text,voice,true); throw new Error("OpenAI voice timed out"); }
  clearTimeout(to);
  if(!r.ok){ if((r.status>=500||r.status===429)&&!_retry){ await new Promise(s=>setTimeout(s,900)); return openaiTTS(text,voice,true); } const t=await r.text().catch(()=> ""); throw new Error("OpenAI voice failed ("+r.status+"): "+t.slice(0,160)); }
  return Buffer.from(await r.arrayBuffer());
}
/* Fish Audio (hosted) — natural voices, same price tier as OpenAI, more voices.
 * Used for the AI tutor and most premium podcasts. Voice = reference_id. */
const _OAI_VOICE_NAMES = new Set(["alloy","echo","fable","onyx","nova","shimmer","ash","ballad","coral","sage","verse"]);
/* Two distinct Fish voices for podcast Host A / Host B. Resolves from whatever the host
   already has set: the explicit FISH_VOICE_A/B, else the existing tutor reference IDs. */
const FISH_VOICE_HOST_A = process.env.FISH_VOICE_A || process.env.FISH_VOICE_ETHAN_TUTOR || process.env.FISH_VOICE_TUTOR || process.env.FISH_VOICE_LAURA_TUTOR || undefined;
const FISH_VOICE_HOST_B = process.env.FISH_VOICE_B || process.env.FISH_VOICE_LAURA_TUTOR || process.env.FISH_VOICE_ETHAN_TUTOR || process.env.FISH_VOICE_TUTOR || undefined;
/* Fish API key — accept the common naming variants so it works whatever you called it on Render. */
const FISH_KEY_NAMES = ["FISH_API_KEY","FISH_AUDIO_API_KEY","FISHAUDIO_API_KEY","FISH_AUDIO_KEY","FISH_KEY","FISHAUDIO_KEY"];
const FISH_KEY_SOURCE = FISH_KEY_NAMES.find(n => (process.env[n]||"").trim()) || null;
const FISH_KEY = FISH_KEY_SOURCE ? (process.env[FISH_KEY_SOURCE]||"").trim() : "";
/* Fish speaks a touch fast at 1.0 — generate at a calmer default so normal-speed playback feels right.
   Tune without a code change via FISH_SPEED (0.5–2.0). */
const FISH_SPEED = Math.min(2, Math.max(0.5, parseFloat(process.env.FISH_SPEED || "0.9") || 0.9));

/* Selectable podcast host voices — friendly name + avatar tag mapped to your Fish reference IDs.
   Only voices whose env var is actually set are offered to the client. */
const FISH_VOICE_CATALOG = [
  { key:"ethan",   name:"Ethan",     gender:"male",   avatar:"ethan",   env:"FISH_VOICE_ETHAN_TUTOR" },
  { key:"laura",   name:"Laura",     gender:"female", avatar:"laura",   env:"FISH_VOICE_LAURA_TUTOR" },
  { key:"dexter",  name:"Dexter",    gender:"male",   avatar:"dexter",  env:"FISH_VOICE_DEXTER_TUTOR" },
  { key:"griffin", name:"Griffin",   gender:"male",   avatar:"griffin", env:"FISH_VOICE_GRIFFIN_TUTOR" },
  { key:"hannah",  name:"Hannah",    gender:"female", avatar:"hannah",  env:"FISH_VOICE_HANNAH_TUTOR" },
  { key:"mj",      name:"MJ",        gender:"female", avatar:"mj",      env:"FISH_VOICE_MJ_TUTOR" },
  { key:"doctor",  name:"Dr. Mensah",gender:"male",   avatar:"doctor",  env:"FISH_VOICE_MYDOCTOR_TUTOR" },
  { key:"maxx",    name:"Maxx",      gender:"male",   avatar:"maxx",    env:"FISH_VOICE_WNBADEXTER_TUTOR" },
];
const FISH_VOICES = FISH_VOICE_CATALOG
  .map(v => ({ key:v.key, name:v.name, gender:v.gender, avatar:v.avatar, ref:(process.env[v.env]||"").trim() }))
  .filter(v => v.ref);
const FISH_VOICE_BY_KEY = Object.fromEntries(FISH_VOICES.map(v => [v.key, v]));
function fishRefForKey(key, fallback){ const v = FISH_VOICE_BY_KEY[(key||"").toLowerCase()]; return (v && v.ref) || fallback; }
async function fishTTS(text, voiceId, attempt){
  attempt = attempt || 0;
  const key = FISH_KEY; if(!key) throw new Error("FISH_API_KEY not set on the server");
  // The podcast picker offers OpenAI-style names (Nova/Shimmer/…). Those are NOT valid Fish
  // reference IDs, so ignore them and use the configured Fish voice (or Fish's default).
  if(voiceId && _OAI_VOICE_NAMES.has(String(voiceId).toLowerCase())) voiceId = null;
  const reference_id = voiceId || FISH_VOICE_HOST_A || undefined;
  const ctrl=new AbortController(); const to=setTimeout(()=>ctrl.abort(),30000); let r;
  try{ r = await fetch("https://api.fish.audio/v1/tts", {
    method:"POST", signal:ctrl.signal,
    headers:{ "Authorization":"Bearer "+key, "Content-Type":"application/json", "model": process.env.FISH_MODEL || "s2.1-pro" },
    body: JSON.stringify(Object.assign({ text, format:"mp3", prosody:{ speed: FISH_SPEED } }, reference_id ? { reference_id } : {})) });
  }catch(e){ clearTimeout(to); if(attempt<3){ await new Promise(s=>setTimeout(s,700*(attempt+1))); return fishTTS(text,voiceId,attempt+1); } throw new Error("Fish voice timed out"); }
  clearTimeout(to);
  // retry up to 3x on rate-limit (429) or transient 5xx, with escalating backoff — this is what
  // keeps a burst of parallel podcast clips from failing when Fish briefly rate-limits us.
  if(!r.ok){ if((r.status>=500||r.status===429)&&attempt<3){ await new Promise(s=>setTimeout(s,1000*(attempt+1))); return fishTTS(text,voiceId,attempt+1); } const t=await r.text().catch(()=> ""); throw new Error("Fish voice failed ("+r.status+"): "+t.slice(0,160)); }
  return Buffer.from(await r.arrayBuffer());
}
/* Kokoro (open model) via a hosted endpoint you point KOKORO_TTS_URL at (Deepinfra,
 * Replicate, or your own). Near-zero cost. Medical terms fixed via kokoroPrep(). */
async function kokoroTTS(text, voiceId, _retry){
  const url = process.env.KOKORO_TTS_URL;
  if(!url) throw new Error("KOKORO_TTS_URL not set on the server");
  const key = process.env.KOKORO_API_KEY;   // optional — Kokoro-FastAPI needs none by default
  const ctrl = new AbortController(); const to = setTimeout(()=>ctrl.abort(), 30000);   // don't hang forever on a slow/dead host
  let r;
  try{
    r = await fetch(url, {                  // KOKORO_TTS_URL = the FULL endpoint, e.g. https://HOST/v1/audio/speech
      method:"POST", signal: ctrl.signal,
      headers: Object.assign({ "Content-Type":"application/json" }, key ? { "Authorization":"Bearer "+key } : {}),
      // OpenAI-compatible body → works with Kokoro-FastAPI, Deepinfra, and OpenAI
      body: JSON.stringify({ model: process.env.KOKORO_MODEL || "kokoro", input: text, voice: voiceId || KOKORO_DEFAULT.read, response_format: "mp3" }) });
  }catch(e){ clearTimeout(to); if(!_retry) return kokoroTTS(text, voiceId, true); throw new Error("Kokoro voice timed out — the voice host isn't responding"); }
  clearTimeout(to);
  if(!r.ok){
    if((r.status>=500 || r.status===429) && !_retry){ await new Promise(s=>setTimeout(s,600)); return kokoroTTS(text, voiceId, true); }   // one quick retry on a transient host error
    const t=await r.text().catch(()=> ""); throw new Error("Kokoro voice failed ("+r.status+"): "+t.slice(0,160));
  }
  return Buffer.from(await r.arrayBuffer());
}
/* is a provider actually configured on this host yet?
 * OpenAI TTS is intentionally NOT used on this account (voices are Fish + Kokoro). */
function providerReady(p){
  if(p==="fish")   return !!FISH_KEY;
  if(p==="kokoro") return !!process.env.KOKORO_TTS_URL;
  return false;
}
/* bounded in-memory cache so identical clips (re-reading the same card, replaying a
 * line) never re-hit the paid API. Podcasts are also cached per-topic in storage. */
const _ttsCache = new Map(); const _TTS_MAX = 400;
function _ttsKey(p, voiceId, text){ return createHash("md5").update(p+"|"+(voiceId||"")+"|"+text).digest("hex"); }
/* one clip via the chosen provider; if that provider isn't set up yet, fall back to
 * OpenAI so audio keeps working until you add the new keys. */
async function _ttsRaw(p, text, voiceId){
  // STRICT: every clip passes through medical pronunciation prep before it is spoken.
  const spoken = (p==="kokoro") ? kokoroPrep(text) : sayPrep(text);
  const key = _ttsKey(p, voiceId, spoken);
  if(_ttsCache.has(key)) return _ttsCache.get(key);
  let buf;
  if(p==="fish")        buf = await fishTTS(spoken, voiceId);
  else if(p==="kokoro") buf = await kokoroTTS(spoken, voiceId);
  else throw new Error("Unsupported TTS provider '"+p+"' (OpenAI TTS is disabled on this account)");
  _ttsCache.set(key, buf);
  if(_ttsCache.size > _TTS_MAX){ _ttsCache.delete(_ttsCache.keys().next().value); }
  return buf;
}
/* Live Kokoro health — so the app can warn you (admin) when basic tier is silently
 * burning paid Fish credits because the self-hosted Kokoro box is down. */
const KOKORO_HEALTH = { ok:true, lastOkAt:0, lastFailAt:0, lastError:null, fallbacks:0 };
function kokoroRecentlyDown(){ return KOKORO_HEALTH.ok===false && (Date.now()-KOKORO_HEALTH.lastFailAt) < 90000; }
async function ttsClip(provider, text, voiceId, kokoroVoice, strict){
  // Try the requested provider first, then fall back to the OTHER configured non-OpenAI
  // provider so a clip still finishes. STRICT mode (podcasts) disables the cross-provider
  // fallback so an episode can NEVER mix voices — every clip stays on the same provider.
  const chain = [];
  if(provider && providerReady(provider)) chain.push([provider, voiceId]);
  if(!strict){
    if(providerReady("fish")   && provider!=="fish")   chain.push(["fish",   voiceId || FISH_VOICE_HOST_A]);
    // Only fall back to Kokoro if it isn't currently crash-looping — otherwise a premium (Fish)
    // clip that hiccups would die on a dead Kokoro 502 instead of just retrying Fish.
    if(providerReady("kokoro") && provider!=="kokoro" && !kokoroRecentlyDown()) chain.push(["kokoro", kokoroVoice || KOKORO_DEFAULT.read]);
  }
  if(!chain.length) throw new Error("No TTS provider configured — set FISH_API_KEY (premium) and/or KOKORO_TTS_URL (basic)");
  let lastErr;
  for(const [p, v] of chain){
    try{
      const buf = await _ttsRaw(p, text, v);
      if(p==="kokoro"){ KOKORO_HEALTH.ok = true; KOKORO_HEALTH.lastOkAt = Date.now(); }
      return buf;
    }
    catch(err){
      lastErr = err;
      console.warn("[tts] "+p+" failed:", (err&&err.message||"").slice(0,120));
      if(p==="kokoro"){
        KOKORO_HEALTH.ok = false; KOKORO_HEALTH.lastFailAt = Date.now();
        KOKORO_HEALTH.lastError = (err&&err.message||"").slice(0,200); KOKORO_HEALTH.fallbacks++;
        console.error("[tts] ⚠️ KOKORO DOWN — basic tier is falling back to PAID Fish credits. err:", KOKORO_HEALTH.lastError);
      }
    }
  }
  throw lastErr || new Error("All TTS providers failed");
}
async function uploadPodcastAudio(path, buf){
  const up = await admin.storage.from("podcasts").upload(path, buf, { contentType:"audio/mpeg", upsert:true });
  if(up.error) throw new Error("audio storage failed: "+up.error.message+" (create a public bucket named 'podcasts')");
  return admin.storage.from("podcasts").getPublicUrl(path).data.publicUrl;
}

app.get("/health", (_req,res)=>res.json({ ok:true,
  kokoro:{ ok:KOKORO_HEALTH.ok, configured:!!process.env.KOKORO_TTS_URL, lastError:KOKORO_HEALTH.lastError,
           lastFailAt:KOKORO_HEALTH.lastFailAt, lastOkAt:KOKORO_HEALTH.lastOkAt, fallbacks:KOKORO_HEALTH.fallbacks },
  fish:{ configured:!!FISH_KEY, keyLen:FISH_KEY.length, source:FISH_KEY_SOURCE,
         voiceA:!!FISH_VOICE_HOST_A, voiceB:!!FISH_VOICE_HOST_B },
  // debug: the actual FISH-related env var NAMES the process sees (names + length only, never values).
  // If FISH_API_KEY's name has a hidden character, nameLen will be > 12 or the name will look off.
  fishEnvKeys: Object.keys(process.env).filter(k=>/fish/i.test(k))
    .map(k=>({ name:k, nameLen:k.length, hasVal:!!(process.env[k]||"").trim() })) }));

/* who am I + plan — lets the app show the current plan (reads the real isPremium check) */
app.get("/me", async (req,res)=>{
  try{ const user = await getUser(req); if(!user) return res.status(401).json({ error:"not signed in" });
    const premium = await isPremium(user.id, user.email).catch(()=>false);
    const isTest = PREMIUM_TEST.length>0 && PREMIUM_TEST.indexOf((user.email||"").toLowerCase())>=0;
    res.json({ ok:true, email:user.email||"", premium, test:(premium && isTest) });
  }catch(e){ res.status(500).json({ error:e.message||"server error" }); }
});

/* ===================================================================
 * Passive lexicon growth: harvest unusual medical terms from each imported
 * lecture, learn their pronunciation once (LLM), store in Supabase and merge
 * live — so the more lectures students build, the better the voice gets.
 * Opt-in: set LEXICON_MODEL (a cheap model, e.g. deepseek-chat) to enable.
 * Needs a Supabase table:
 *   create table pronunciations (term text primary key, ipa text, say text,
 *     source text default 'lecture', created_at timestamptz default now());
 * =================================================================== */
const _MEDSUF=/(itis|osis|aemia|emia|ectomy|otomy|ostomy|opathy|pathy|plasia|trophy|megaly|uria|rrhoea|rrhea|algia|penia|cytosis|noma|oma|plegia|sclerosis|stenosis|lysis|pnoea|pnea|iasis|ptosis|malacia|ectasis|cele)$/;
const _MEDROOT=/(cardio|neuro|gastro|hepat|nephr|pulmon|osteo|arthro|dermat|haemat|hemat|myelo|encephal|thromb|angio|bronch|laryng|pharyng|rhino|ophthalm|glomerul|prostat|lymph|leuk|erythro|myco|bacter|strept|staphyl|penicill|cillin|mycin|azole|statin|prazole|parin|sartan)/;
function harvestCandidates(text){
  const seen=new Set(), out=[];
  (String(text||"").toLowerCase().match(/[a-z][a-z-]{5,}/g)||[]).forEach(w=>{
    if(seen.has(w)) return; seen.add(w);
    if((_MEDSUF.test(w)||_MEDROOT.test(w)) && !knownTerm(w)) out.push(w);
  });
  return out;
}
async function loadLearnedPronunciations(){
  try{
    const r = await admin.from("pronunciations").select("term,ipa,say");
    if(r.data && r.data.length){
      const ipa={}, say={};
      r.data.forEach(x=>{ if(x.term&&x.ipa) ipa[x.term]=x.ipa; if(x.term&&x.say) say[x.term]=x.say; });
      const total = mergeTerms(ipa, say);
      console.log("[lexicon] loaded", r.data.length, "learned terms · total", total);
    }
  }catch(e){ /* table not created yet — fine */ }
}
async function harvestFromNote(note){
  const model = process.env.LEXICON_MODEL; if(!model) return;         // opt-in
  const terms = harvestCandidates(note).slice(0, 8);
  if(!terms.length) return;
  try{
    const prompt = "For each medical term below, give American-English IPA (NO surrounding slashes, use stress marks ˈ primary and ˌ secondary) and a plain phonetic respelling (hyphens between syllables, stressed syllable in CAPS). If unsure of a term, omit it. Return ONLY JSON: {\"items\":[{\"term\":\"\",\"ipa\":\"\",\"say\":\"\"}]}.\nTerms: " + terms.join(", ");
    const gen = await generate({ model, prompt, parts:[], images:[], max_tokens:900, temperature:0 });
    const t=gen.text||"", s=t.indexOf("{"), e=t.lastIndexOf("}");
    const obj = JSON.parse(t.slice(s,e+1));
    const rows=[], ipa={}, say={};
    (obj.items||[]).forEach(it=>{
      const term=(it.term||"").toLowerCase().trim();
      if(!term || !it.ipa) return;
      ipa[term]=it.ipa; if(it.say) say[term]=it.say;
      rows.push({ term, ipa:it.ipa, say:it.say||null, source:"lecture" });
    });
    if(rows.length){
      await admin.from("pronunciations").upsert(rows, { onConflict:"term" });
      mergeTerms(ipa, say);
      console.log("[lexicon] learned", rows.length, "new terms from a lecture");
    }
  }catch(e){ /* never let harvesting affect the import */ }
}
/* ── MATHS pronunciation safety-net ───────────────────────────────────────────────────────────
 * The MAIN guarantee is the prompt rule: narration_text is written in SPOKEN WORDS, symbols stay
 * in the diagram labels. This map is a belt-and-braces catch for the handful of abbreviations a
 * model still slips into narration. Word-boundary matching only (see buildRx in med-voice.mjs),
 * so ONLY tokens that are safe as whole words appear here — never bare punctuation, and nothing
 * that could fire inside an ordinary English word.
 * Note the matcher is case-insensitive and these are already-correct English words in most other
 * contexts, so each entry is chosen to be harmless if it fires ("tan" → "tangent" is the only
 * mildly lossy one, and in a maths explainer that is the reading we want). */
const MATH_SAY = {
  "sin":"sine", "cos":"cosine", "tan":"tangent",
  "cosec":"cosecant", "sec":"secant", "cot":"cotangent",
  "arcsin":"arc sine", "arccos":"arc cosine", "arctan":"arc tangent",
  "dx":"dee x", "dy":"dee y", "dt":"dee t", "dr":"dee r",
  "ln":"natural log", "log":"log", "sqrt":"square root", "cbrt":"cube root",
  "lim":"limit", "det":"determinant", "vs":"versus",
  "iff":"if and only if", "wrt":"with respect to",
  "nCr":"n choose r", "nPr":"n permute r", "lcm":"lowest common multiple", "hcf":"highest common factor"
};
mergeTerms({}, MATH_SAY);   // say-map only — no IPA, so Kokoro's medical phonemes are untouched
console.log("[lexicon] maths say-map merged ·", Object.keys(MATH_SAY).length, "tokens");

loadLearnedPronunciations();
setInterval(loadLearnedPronunciations, 30*60*1000);   // refresh every 30 min

app.post("/import", async (req,res)=>{
  try{
    const user = await getUser(req);
    if(!user) return res.status(401).json({ error:"not signed in" });
    const account_id = user.id;

    // --- freemium gate: premium = unlimited imports; free = 1 built lecture ---
    if(!await isPremium(account_id, user.email)){
      if(await builtCount(account_id) >= FREE_BUILD_LIMIT)
        return res.status(402).json({ error:"upgrade", reason:"Your free account includes 1 lecture. Subscribe to import more — everything you've already built stays free to study, and the AI tutor and podcast keep working on it." });
    }

    const { topicName, subject, lecturer, course_id } = req.body;
    if(!topicName || !course_id) return res.status(400).json({ error:"topicName and course_id required" });

    // --- record the import as processing ---
    const imp = await admin.from("imports").insert({ account_id, status:"processing", source_kind: req.body.pdf_base64?"pdf":(req.body.audio_base64?"audio":(req.body.youtube_url?"youtube":(req.body.images?"images":"text"))) }).select("id").single();
    const importId = imp.data && imp.data.id;

    // --- load the CORE build prompt for this student's level (falls back to the default) ---
    const level = Number(req.body.level) || null;
    const pt = { data: await loadImportPrompt(level) };
    if(!pt.data){ await admin.from("imports").update({ status:"failed", error:"no active prompt" }).eq("id",importId); return res.status(500).json({ error:"no active prompt" }); }
    // IMPORT BUILD ONLY — the one place tiering applies: basic → Flash, premium → Pro
    const paid = await admin.from("subscriptions").select("status").eq("account_id",account_id).maybeSingle();
    let model = (paid.data && paid.data.status==="active") ? PREMIUM_MODEL : BASIC_MODEL;
    // admins may override the model per import (for A/B testing)
    if(req.body.model){ const adm = await admin.from("accounts").select("is_admin").eq("id",account_id).maybeSingle(); if(adm.data && adm.data.is_admin) model = req.body.model; }

    const prompt = pt.data.template
      .replace(/\{\{topicName\}\}/g, topicName).replace(/\{\{lecturer\}\}/g, lecturer||"").replace(/\{\{subject\}\}/g, subject||"")
      + "\n\nADDITIONAL REQUIREMENT — source anchors: For EVERY primer card and EVERY recall card, also include a field \"src\": a SHORT verbatim quote (6 to 12 words) copied EXACTLY (same words and casing) from note_md that this card is based on, so the app can jump the reader to the exact spot in the built note. Prefer a distinctive sentence fragment over a heading. If you truly cannot find a matching phrase, use the nearest heading text from note_md. Keep \"src\" inside each card object alongside its other fields.";
    const { parts, images, transcript } = await extractContent(req.body);

    const gen = await generate({ model, prompt, parts, images, max_tokens: pt.data.max_tokens || 16000, temperature: Number(pt.data.temperature) || 0.3 });
    let raw = gen.text;
    const s=raw.indexOf("{"), e=raw.lastIndexOf("}");
    let obj; try{ obj=JSON.parse(raw.slice(s,e+1)); }catch(err){ await admin.from("imports").update({ status:"failed", error:"bad json" }).eq("id",importId); return res.status(502).json({ error:"model returned invalid JSON" }); }
    const errs = validateObj(obj);
    if(errs.length){ await admin.from("imports").update({ status:"failed", error:errs.join("; ") }).eq("id",importId); return res.status(502).json({ error:"validation failed", details:errs }); }

    // --- save the topic + cards ---
    const topicRow = {
      course_id, account_id, title:topicName, lecturer:lecturer||null, status:"ready",
      source_kind: req.body.pdf_base64?"pdf":(req.body.audio_base64?"audio":(req.body.youtube_url?"youtube":(req.body.images?"images":"text"))),
      note_md: obj.note_md, simplified_md: obj.simplified_md
    };
    if(transcript && transcript.length) topicRow.transcript = transcript;   // needs a jsonb "transcript" column
    let topic = await admin.from("topics").insert(topicRow).select("id").single();
    if(topic.error && /transcript/i.test(topic.error.message||"")){ delete topicRow.transcript; topic = await admin.from("topics").insert(topicRow).select("id").single(); } // column not added yet → save without it
    if(topic.error) throw topic.error;
    const topicId = topic.data.id;

    const cards=[];
    (obj.primer.cards||[]).forEach((c,i)=>cards.push({ topic_id:topicId, account_id, deck:"primer", idx:i, card_key:topicId+"|p|"+hstr(c.q), q:c.q, payload:{ lecturer:c.lecturer, explain:c.explain, tie:c.tie, src:c.src||null, src_t:matchTime(c.src, transcript) } }));
    (obj.recall.cards||[]).forEach((c,i)=>cards.push({ topic_id:topicId, account_id, deck:"recall", idx:i, card_key:topicId+"|r|"+hstr(c.q), q:c.q, payload:{ a:c.a, opts:c.opts, ans:c.ans, src:c.src||null, src_t:matchTime(c.src, transcript) } }));
    const cw = await admin.from("cards").insert(cards);
    if(cw.error) throw cw.error;

    // --- optional extras the student ticked in the "what to build" box (fill_blank / written) ---
    const wantBuilds = Array.isArray(req.body.builds) ? req.body.builds.filter(b=>b==="fill_blank"||b==="written") : [];
    if(wantBuilds.length){
      const extras={};
      for(const kind of wantBuilds){
        try{ const items = await buildExtra(kind, level, obj.note_md, model); if(items && items.length) extras[kind]=items; }catch(_){}
      }
      if(Object.keys(extras).length){ await admin.from("topics").update({ extras }).eq("id",topicId); }   // needs a jsonb "extras" column; ignored if absent
    }

    // --- meter usage ---
    const usage = gen.usage || {};
    await admin.from("imports").update({ status:"done", topic_id:topicId, model, input_tokens:usage.input_tokens||null, output_tokens:usage.output_tokens||null }).eq("id",importId);
    await admin.rpc("bump_ai_usage", { p_account:account_id, p_feature:"import", p_tokens:(usage.output_tokens||0) });

    harvestFromNote(obj.note_md);   // fire-and-forget: learn new medical pronunciations from this lecture
    res.json({ ok:true, topic_id:topicId, primer:obj.primer.cards.length, recall:obj.recall.cards.length });
  }catch(e){ console.error(e); res.status(500).json({ error:e.message||"server error" }); }
});

/* Build one optional extra (fill_blank / written) on demand for an existing topic,
 * then cache it on the topic. Used the first time a student opens the mode on a
 * lecture that wasn't built with it. */
app.post("/build-extra", async (req,res)=>{
  try{
    const user = await getUser(req); if(!user) return res.status(401).json({ error:"not signed in" });
    const account_id = user.id;
    const { topic_id, kind } = req.body;
    if(!topic_id || (kind!=="fill_blank" && kind!=="written")) return res.status(400).json({ error:"bad request" });
    // open to any signed-in student — runs on their own built lecture
    const t = await admin.from("topics").select("id,account_id,note_md,extras").eq("id",topic_id).maybeSingle();
    if(!t.data) return res.status(404).json({ error:"topic not found" });
    if(t.data.account_id !== account_id) return res.status(403).json({ error:"not your topic" });
    const have = (t.data.extras && t.data.extras[kind]) || null;
    if(have && have.length && !req.body.force) return res.json({ ok:true, items:have });   // already built → return cached (unless a rebuild was requested)
    const level = Number(req.body.level) || null;
    // in-app extras always use Flash — tiering is import-only
    const model = BASIC_MODEL;
    const items = await buildExtra(kind, level, t.data.note_md, model);
    if(!items) return res.status(502).json({ error:"couldn't build this — try again" });
    const extras = Object.assign({}, t.data.extras||{}, { [kind]: items });
    await admin.from("topics").update({ extras }).eq("id",topic_id);   // ignored if extras column absent
    res.json({ ok:true, items });
  }catch(e){ console.error(e); res.status(500).json({ error:e.message||"server error" }); }
});

/* Podcast — script (cached on the topic) */
app.post("/podcast", async (req,res)=>{
  try{
    const user = await getUser(req); if(!user) return res.status(401).json({ error:"not signed in" });
    // open to any signed-in student — runs on their own built lecture
    const { topic_id } = req.body; if(!topic_id) return res.status(400).json({ error:"topic_id required" });
    const mode = req.body.mode === "quick" ? "quick" : "deep";
    const t = await admin.from("topics").select("id,account_id,note_md,extras").eq("id",topic_id).maybeSingle();
    if(!t.data) return res.status(404).json({ error:"topic not found" });
    if(t.data.account_id !== user.id) return res.status(403).json({ error:"not your topic" });
    const extras = t.data.extras || {};
    extras.podcast = extras.podcast || {};
    const scripts = extras.podcast.scripts || {};
    // migrate a legacy single script into the "deep" slot so old topics keep working
    if(!Object.keys(scripts).length && extras.podcast.script && extras.podcast.script.length) scripts.deep = extras.podcast.script;
    if(scripts[mode] && scripts[mode].length) return res.json({ ok:true, lines:scripts[mode], mode });
    const level = Number(req.body.level) || null;
    const model = await resolveModel(user.id, level);
    const lines = await podcastScript(level, t.data.note_md, model, mode);
    if(!lines || !lines.length) return res.status(502).json({ error:"couldn't write the script — try again" });
    scripts[mode] = lines;
    extras.podcast = Object.assign({}, extras.podcast, { scripts, script:lines });   // keep .script as the latest (back-compat)
    await admin.from("topics").update({ extras }).eq("id",topic_id);   // ignored if extras column absent
    res.json({ ok:true, lines, mode });
  }catch(e){ console.error(e); res.status(500).json({ error:e.message||"server error" }); }
});

/* Podcast — the ElevenLabs voices available on the account (for the character picker) */
app.get("/podcast-voices", async (req,res)=>{
  try{
    if(!await getUser(req)) return res.status(401).json({ error:"not signed in" });
    // the real, configured Fish host voices — names + avatar tags only (reference IDs stay server-side)
    res.json({ ok:true, voices: FISH_VOICES.map(v => ({ key:v.key, name:v.name, gender:v.gender, avatar:v.avatar })) });
  }catch(e){ res.json({ ok:true, voices:[] }); }
});

/* in-memory rotation so premium podcasts run 2x Fish : 1x Kokoro (resets on restart) */
const _podRot = new Map();
/* Podcast — generate (once, cached) and store the audio clips */
app.post("/podcast-audio", async (req,res)=>{
  try{
    const user = await getUser(req); if(!user) return res.status(401).json({ error:"not signed in" });
    // open to any signed-in student — runs on their own built lecture
    const { topic_id, voiceA, voiceB } = req.body;
    if(!topic_id || !voiceA || !voiceB) return res.status(400).json({ error:"topic_id, voiceA and voiceB required" });
    const t = await admin.from("topics").select("id,account_id,extras").eq("id",topic_id).maybeSingle();
    if(!t.data) return res.status(404).json({ error:"topic not found" });
    if(t.data.account_id !== user.id) return res.status(403).json({ error:"not your topic" });
    const mode = req.body.mode === "quick" ? "quick" : "deep";
    const extras = t.data.extras || {};
    extras.podcast = extras.podcast || {};
    const scripts = extras.podcast.scripts || {};
    let script = (scripts[mode] && scripts[mode].length) ? scripts[mode] : (extras.podcast.script);
    // Fallback: if the server copy is missing (e.g. the /podcast save didn't persist),
    // accept the script the client already has on screen — then re-persist it here so
    // audio caching + replay work. This makes "generate the script first" unreachable
    // whenever a script is genuinely present.
    if((!script || !script.length) && Array.isArray(req.body.lines) && req.body.lines.length){
      const clean = req.body.lines
        .filter(l => l && typeof l.text === "string" && l.text.trim())
        .map(l => ({ speaker: (l.speaker === "B" ? "B" : "A"), text: String(l.text).slice(0, 1400), section: (l.section||"").toString().slice(0,40), src: (l.src||"").toString().slice(0,160) }));
      if(clean.length){ script = clean; scripts[mode] = clean; extras.podcast = Object.assign({}, extras.podcast, { scripts, script:clean }); }
    }
    if(!script || !script.length) return res.status(400).json({ error:"generate the script first" });
    // engine is automatic: basic = Kokoro; premium = 2x Fish : 1x Kokoro. Cached once per topic.
    const prem = await isPremium(user.id, user.email);
    console.log("[podcast-audio] user=%s premium=%s → provider=%s", user.email, prem, prem ? "fish" : "kokoro");
    // premium → Fish (the paid, natural voice); basic → Kokoro (free). ttsClip falls
    // back to the other configured provider automatically if one is down. No OpenAI.
    let provider = prem ? "fish" : "kokoro";
    // Decide ONE provider for the WHOLE episode so every clip uses the same two voices — never
    // mid-episode voice switching. If the tier's provider isn't usable, switch the whole episode.
    if(provider==="fish" && !providerReady("fish") && providerReady("kokoro")) provider="kokoro";
    else if(provider==="kokoro" && (!providerReady("kokoro") || kokoroRecentlyDown()) && providerReady("fish")) provider="fish";
    let vA, vB;
    const aKey = (voiceA||"").toString().toLowerCase(), bKey = (voiceB||"").toString().toLowerCase();
    if(provider==="kokoro"){ vA = process.env.KOKORO_VOICE_A || KOKORO_DEFAULT.A; vB = process.env.KOKORO_VOICE_B || KOKORO_DEFAULT.B; }
    else {   // map the chosen host voice KEYS (ethan/laura/…) to Fish reference IDs
      vA = fishRefForKey(aKey, FISH_VOICE_HOST_A || (FISH_VOICES[0] && FISH_VOICES[0].ref));
      vB = fishRefForKey(bKey, FISH_VOICE_HOST_B || (FISH_VOICES[1] && FISH_VOICES[1].ref) || vA);
    }
    // cache per mode + chosen voice-pair so quick/deep and different host combos save separately
    const combo = (provider==="fish" ? ("fish_"+mode+"_"+(FISH_VOICE_BY_KEY[aKey]?aKey:"a")+"_"+(FISH_VOICE_BY_KEY[bKey]?bKey:"b")) : ("kokoro_"+mode));
    // ---- per-line regenerate: redo just ONE clip and replace it in the cache ----
    if(req.body.regen != null){
      const ri = parseInt(req.body.regen, 10);
      if(!(ri >= 0 && ri < script.length)) return res.status(400).json({ error:"bad line index" });
      const _kA = process.env.KOKORO_VOICE_A || KOKORO_DEFAULT.A, _kB = process.env.KOKORO_VOICE_B || KOKORO_DEFAULT.B;
      const rvid = script[ri].speaker==="A" ? vA : vB;
      const rkvid = script[ri].speaker==="A" ? _kA : _kB;
      const rbuf = await ttsClip(provider, script[ri].text, rvid, rkvid, true);   // strict: keep the same voice
      if(!rbuf || rbuf.length < 1200) return res.status(502).json({ error:"empty audio — try again" });
      const rurl0 = await uploadPodcastAudio("t/"+topic_id+"/"+combo+"/"+ri+".mp3", rbuf);
      const rurl = rurl0 + (rurl0.indexOf('?')>=0?'&':'?') + "v=" + Date.now();   // cache-bust so the player refetches
      const rarr = (extras.podcast.audio && extras.podcast.audio[combo]) ? extras.podcast.audio[combo].slice() : new Array(script.length).fill(null);
      rarr[ri] = rurl; extras.podcast.audio = Object.assign({}, extras.podcast.audio||{}, { [combo]: rarr });
      await admin.from("topics").update({ extras }).eq("id", topic_id);
      return res.json({ ok:true, index:ri, url:rurl });
    }
    if(extras.podcast.audio && extras.podcast.audio[combo] && extras.podcast.audio[combo].every(Boolean))
      return res.json({ ok:true, done:true, urls:extras.podcast.audio[combo], lines:script });
    const kA = process.env.KOKORO_VOICE_A || KOKORO_DEFAULT.A, kB = process.env.KOKORO_VOICE_B || KOKORO_DEFAULT.B;
    // RESUMABLE: carry over any clips already generated in a previous (timed-out) request.
    const prev = (extras.podcast.audio && extras.podcast.audio[combo]) || [];
    const urls = new Array(script.length); for(let i=0;i<script.length;i++) urls[i] = prev[i] || null;
    const _preFallbacks = KOKORO_HEALTH.fallbacks;   // detect if Kokoro failed during THIS episode
    // TIME BUDGET: stop well under Render's request limit, persist progress, and let the client
    // re-request to continue. Guarantees each request finishes even a 16-line episode never times out.
    const DEADLINE = Date.now() + 40000;
    // Kokoro is memory-bound (serialize); Fish is a remote API but rate-limits at high concurrency,
    // so keep it at 2 — combined with the resumable design that's plenty to finish within the window.
    let _idx = 0; const CONC = (provider === "kokoro") ? 1 : 2;
    async function _worker(){
      while(_idx < script.length){
        const i = _idx++;
        if(urls[i]) continue;                         // already generated in a previous request — skip
        if(Date.now() > DEADLINE) return;             // out of time this request; client will continue
        const vid = script[i].speaker==="A" ? vA : vB;
        const kvid = script[i].speaker==="A" ? kA : kB;   // Kokoro voice to use if the premium engine falls back
        // per-clip retry so one transient failure doesn't leave a gap (unfilled clips resume next pass anyway)
        let buf=null;
        for(let a=0; a<2 && !buf; a++){
          try{
            const b = await ttsClip(provider, script[i].text, vid, kvid, true);   // strict: whole episode = one provider, two voices
            if(!b || b.length < 1200) throw new Error("empty audio ("+(b?b.length:0)+" bytes)");   // reject 0-byte / broken clips
            buf = b;
          }
          catch(err){ if(a>=1) { console.warn("[podcast] clip "+i+" failed, will resume next pass:", (err&&err.message||"").slice(0,100)); break; } await new Promise(s=>setTimeout(s,600)); }
        }
        if(!buf){ continue; }   // leave urls[i] null → picked up on the next resume pass
        const url = await uploadPodcastAudio("t/"+topic_id+"/"+combo+"/"+i+".mp3", buf);
        if(url) urls[i] = url;   // only record the URL once the upload actually succeeded
      }
    }
    await Promise.all(Array.from({length:Math.min(CONC, script.length)}, _worker));
    // persist whatever we have (partial or complete) so the next request resumes / caching works
    extras.podcast.audio = Object.assign({}, extras.podcast.audio||{}, { [combo]:urls });
    await admin.from("topics").update({ extras }).eq("id",topic_id);
    const done = urls.every(Boolean);
    const remaining = urls.filter(u=>!u).length;
    // if this was a basic (Kokoro) episode but Kokoro failed and we used paid Fish, tell the client
    const degraded = (provider === "kokoro") && (KOKORO_HEALTH.fallbacks > _preFallbacks);
    res.json({ ok:true, done, remaining, urls, lines:script, engine: degraded ? "fish(kokoro-down)" : provider, degraded });
  }catch(e){ console.error(e); res.status(500).json({ error:e.message||"server error" }); }
});

/* Solve: image and/or text question → step-by-step worked explanation */
app.post("/solve", async (req,res)=>{
  try{
    const user = await getUser(req); if(!user) return res.status(401).json({ error:"not signed in" });
    if(!await isPremium(user.id, user.email)) return res.status(402).json({ error:"upgrade", reason:"Solve is a premium feature — subscribe to snap and solve any question." });
    const { image_base64, media_type, text } = req.body;
    if(!image_base64 && !(text && text.trim())) return res.status(400).json({ error:"send a photo or type the question" });
    const images = image_base64 ? [{ type:"image", source:{ type:"base64", media_type:media_type||"image/jpeg", data:image_base64 } }] : [];
    const parts = (text && text.trim()) ? [{ type:"text", text:"QUESTION (typed by the student):\n"+text.trim() }] : [];
    const model = process.env.SOLVE_MODEL || "gpt-4o-mini";   // vision-capable, cheap, non-Claude (DeepSeek chat can't see images)
    const gen = await generate({ model, prompt:SOLVE_PROMPT, parts, images, max_tokens:2000, temperature:0.2 });
    res.json({ ok:true, answer:(gen.text||"").trim() });
  }catch(e){ console.error(e); res.status(500).json({ error:e.message||"server error" }); }
});

/* Read-aloud / voice tutor speech (returns mp3).
 * use:"tutor" → Fish Audio · anything else (read-aloud & app audio) → Kokoro.
 * ttsClip falls back to OpenAI automatically if the chosen provider isn't set up yet. */
app.post("/tts", async (req,res)=>{
  try{
    const user = await getUser(req); if(!user) return res.status(401).json({ error:"not signed in" });
    // open to any signed-in student — read-aloud on their own content
    const text = (req.body.text||"").toString().slice(0,3000); if(!text.trim()) return res.status(400).json({ error:"no text" });
    const isTutor = req.body.use === "tutor";
    let provider = isTutor ? "fish" : "kokoro";
    let voice = req.body.voice || (isTutor ? (process.env.FISH_VOICE_TUTOR || FISH_VOICE_HOST_A) : KOKORO_DEFAULT.read);
    // "Ask the hosts": answer in one of the podcast's OWN two host voices (voiceKey = ethan/laura/…)
    const vk = (req.body.voiceKey||"").toString().toLowerCase();
    if(vk && FISH_VOICE_BY_KEY[vk]){ provider = "fish"; voice = fishRefForKey(vk, voice); }
    const buf = await ttsClip(provider, text, voice, null, true);   // strict — the exact voice, no fallback swap
    res.setHeader("Content-Type","audio/mpeg"); res.send(buf);
  }catch(e){ res.status(500).json({ error:e.message||"tts error" }); }
});

/* "Nothing-missed" SEMANTIC critic: given the source text and the ordered chain the blueprint
 * shows, ask the model which ESSENTIAL mechanistic steps are skipped. Deterministic graph checks
 * catch broken wiring; this catches missing physiology. Guarded + best-effort — never blocks. */
async function completenessCheck(text, bp){
  if(process.env.VIZ_COMPLETENESS === "0") return { missing:[] };
  const chain = chainOf(bp);
  if(chain.length < 2) return { missing:[] };
  const prompt =
`You are a strict medical accuracy checker. Do NOT rewrite anything — only judge completeness.
SOURCE TEXT: "${text.slice(0,1000)}"
An explainer animation shows this ordered causal chain: ${chain.join(" -> ")}.
List ONLY essential mechanistic steps that are present in the source (or are standard, non-optional physiology for this process) but are MISSING or SKIPPED from the chain. Do not add nice-to-have detail, examples, or anything not needed to understand the mechanism. If nothing essential is missing, return an empty list.
Return ONLY JSON: {"missing":["short name of skipped step", ...]}`;
  const gen = await generate({ model: BASIC_MODEL, prompt, parts:[], images:[], max_tokens:600, temperature:0.1, json:true });
  const o = parseBlueprint(gen.text) || {};
  const missing = Array.isArray(o.missing) ? o.missing.filter(x=>typeof x==="string" && x.trim()).slice(0,6) : [];
  return { missing };
}

/* Visualize Text — highlighted sentence → step-by-step diagram blueprint (DeepSeek Flash).
 * Cached per highlighted text in the "visualizations" table (generate once, reuse for everyone).
 * Narration audio is produced on the client via /tts (Kokoro) per step. */
app.post("/visualize", async (req,res)=>{
  try{
    const user = await getUser(req); if(!user) return res.status(401).json({ error:"not signed in" });
    const text = (req.body.text||"").toString().trim();
    if(!text) return res.status(400).json({ error:"highlight some text first" });
    if(text.length>2000) return res.status(400).json({ error:"that passage is very long — highlight one or two sentences (a single mechanism)" });
    const subject = (req.body.subject||"").toString().slice(0,80);
    const key = textKey(text);
    // cache read (best-effort — skips silently if the table isn't created yet)
    try{ const c = await admin.from("visualizations").select("blueprint").eq("text_key",key).maybeSingle();
      if(c.data && c.data.blueprint && (!c.data.blueprint.layout || LAYOUTS.has(c.data.blueprint.layout))){ const b=c.data.blueprint; if(!b.layout||b.layout==="scene"){ b._render=renderHints(b.template); b._defs=assetDefs((b.elements||[]).map(e=>e.type)); } return res.json({ ok:true, cached:true, blueprint:b, viz_quota:await vizQuota(user.id, user.email) }); } }catch(_){}
    // --- daily limit: only NEW builds count (cached replays above are free & unlimited) ---
    const premium = await isPremium(user.id, user.email).catch(()=>false);
    const limit = premium ? 10 : 3;
    let used = 0;
    try{
      const since = new Date(); since.setUTCHours(0,0,0,0);
      const cnt = await admin.from("viz_events").select("id",{ count:"exact", head:true }).eq("account_id",user.id).gte("created_at",since.toISOString());
      used = (cnt && !cnt.error) ? (cnt.count||0) : 0;
      if(used >= limit){
        return res.status(429).json({ error:"daily_limit", limit, premium, viz_quota:{ limit, remaining:0, premium },
          message: premium ? "You've used all 10 of today's explainers. They reset tomorrow."
                           : "You've used all 3 of today's explainers. Upgrade to Premium for 10 a day." });
      }
    }catch(_){}   // table not created yet → fail open (don't block students)
    // generate blueprint (Flash — in-app, always cheap tier)
    const prompt = buildVisualPrompt(text, subject);
    let gen = await generate({ model: BASIC_MODEL, prompt, parts:[], images:[], max_tokens:8000, temperature:0.2, json:true });
    let bp = parseBlueprint(gen.text);
    // combined validity: structural (QC) + causal-completeness (graph). Both feed the corrective retry.
    const evalBp = (b)=>{ const q=qcCheck(b), g=b?graphCheck(b):{pass:false,issues:[]}; return { pass:q.pass&&g.pass, issues:[...(q.issues||[]),...(g.issues||[])], qc:q, g }; };
    let ev = evalBp(bp);
    if(!bp) console.warn("[visualize] parse failed. raw head:", (gen.text||"").slice(0,300), "| len:", (gen.text||"").length);
    // capture genuine demand: assets the model reached for that don't exist yet (before the retry forces it back)
    try{
      const wanted = (ev.issues||[]).map(s=>{ const m=/asset type not in manifest: (\S+)/.exec(s)||/asset '([^']+)' not allowed/.exec(s); return m&&m[1]; }).filter(Boolean);
      for(const t of new Set(wanted)) await admin.from("viz_expansion_log").insert({ requested_type:t, subject, source_text:text.slice(0,300) });
    }catch(_){}
    if(!ev.pass){                                   // one corrective retry with the combined issues (skipped steps included)
      const fix = prompt + "\n\nYour previous JSON had these problems — fix ALL of them and return ONLY corrected JSON:\n- "
                + ev.issues.join("\n- ") + "\n\nPREVIOUS:\n" + (gen.text||"").slice(0,4000);
      const gen2 = await generate({ model: BASIC_MODEL, prompt:fix, parts:[], images:[], max_tokens:8000, temperature:0.2, json:true });
      const bp2 = parseBlueprint(gen2.text);
      if(!bp2) console.warn("[visualize] retry parse failed. raw head:", (gen2.text||"").slice(0,300));
      const ev2 = evalBp(bp2);
      if(bp2 && (ev2.pass || !bp)){ bp = bp2; ev = ev2; }
    }
    if(!bp) return res.status(502).json({ error:"couldn't build a visualization — try selecting one clear sentence, or try again in a moment" });
    // response guard: never ship a layout the engine can't draw (it would fall through to the scene renderer)
    if(bp.layout && !LAYOUTS.has(bp.layout)){
      console.warn("[visualize] unknown layout rejected:", bp.layout);
      return res.status(502).json({ error:"couldn't build a visualization — try again in a moment" });
    }
    // deeper "nothing-missed" pass: LLM critic vs the source text (guarded; never blocks delivery)
    let completeness = { missing:[] };
    try{ completeness = await completenessCheck(text, bp); }catch(e){ console.warn("[visualize] completeness skipped:", e.message); }
    if(completeness.missing && completeness.missing.length){
      const add = prompt + "\n\nYour previous blueprint SKIPPED these essential steps from the source: "
                + completeness.missing.join("; ") + ".\nRegenerate the FULL blueprint including them, keeping everything else. Return ONLY JSON.\n\nPREVIOUS:\n"+JSON.stringify(bp).slice(0,4000);
      try{ const gen3 = await generate({ model: BASIC_MODEL, prompt:add, parts:[], images:[], max_tokens:8000, temperature:0.2, json:true });
        const bp3 = parseBlueprint(gen3.text), ev3 = evalBp(bp3);
        if(bp3 && ev3.pass) { bp = bp3; ev = ev3; completeness.fixed = true; }
      }catch(e){ console.warn("[visualize] completeness regen skipped:", e.message); }
    }
    // cache write (best-effort)
    try{ await admin.from("visualizations").upsert({ text_key:key, concept_id:(bp.meta&&bp.meta.concept_id)||key, subject, blueprint:bp, verified:false }); }catch(_){}
    try{ await admin.from("viz_events").insert({ account_id:user.id }); }catch(_){}   // count this NEW build against the daily limit
    if(!bp.layout||bp.layout==="scene"){                   // scene-mode only: tree mode needs no zones/assets
      bp._render = renderHints(bp.template);   // manifest-derived scale slice for the engine (kept out of the cached row)
      bp._defs = assetDefs((bp.elements||[]).map(e=>e.type));   // svg specs for any data-driven (overlay-approved) assets used
    }
    bp._chain = chainOf(bp);                 // the causal chain / tree traversal, in order (transparency / debugging)
    res.json({ ok:true, cached:false, blueprint:bp, qc_issues:ev.issues, completeness, viz_quota:{ limit, remaining:Math.max(0,limit-(used+1)), premium } });
  }catch(e){ console.error(e); res.status(500).json({ error:e.message||"server error" }); }
});

/* Explain-simpler — re-say one narration step in plainer words (interactive study mode).
 * Tiny, cheap call; best-effort. Never caches — it's on-demand per tap. */
app.post("/simplify", async (req,res)=>{
  try{
    const user = await getUser(req); if(!user) return res.status(401).json({ error:"not signed in" });
    const text = (req.body.text||"").toString().trim().slice(0,600);
    if(!text) return res.status(400).json({ error:"nothing to simplify" });
    const context = (req.body.context||"").toString().slice(0,120);
    // "Simpler" is a regeneration → it counts against the same daily Visualize limit
    const premium = await isPremium(user.id, user.email).catch(()=>false);
    const limit = premium ? 10 : 3;
    let used = 0;
    try{ const since=new Date(); since.setUTCHours(0,0,0,0);
      const cnt = await admin.from("viz_events").select("id",{ count:"exact", head:true }).eq("account_id",user.id).gte("created_at",since.toISOString());
      used = (cnt && !cnt.error) ? (cnt.count||0) : 0;
      if(used >= limit) return res.status(429).json({ error:"daily_limit", limit, premium, viz_quota:{ limit, remaining:0, premium },
        message: premium ? "You've used all 10 of today's explainers. They reset tomorrow."
                         : "You've used all 3 of today's explainers. Upgrade to Premium for 10 a day." });
    }catch(_){}
    const prompt =
`Re-explain this one sentence from a study animation in the SIMPLEST possible words, as if to a struggling first-year student. Keep it accurate. One or two short sentences. Use an everyday analogy ONLY if it truly helps. No jargon unless you immediately define it. Do not add new facts.
${context?`TOPIC: ${context}\n`:""}SENTENCE: "${text}"
Return ONLY JSON: {"text":"the simpler explanation"}`;
    const gen = await generate({ model: BASIC_MODEL, prompt, parts:[], images:[], max_tokens:400, temperature:0.3, json:true });
    const o = parseBlueprint(gen.text) || {};
    const out = (o.text||"").toString().trim();
    if(!out) return res.status(502).json({ error:"try again" });
    try{ await admin.from("viz_events").insert({ account_id:user.id }); }catch(_){}   // count this regeneration against the daily limit
    res.json({ ok:true, text:out.slice(0,400), viz_quota:{ limit, remaining:Math.max(0,limit-(used+1)), premium } });
  }catch(e){ console.error(e); res.status(500).json({ error:e.message||"server error" }); }
});

/* ---- "Let AI explain" — highlighted note text → step-by-step explanation.
 * Routed through DeepSeek V4 Flash (BASIC_MODEL) on the server; no Puter, no browser sign-in. ---- */
app.post("/explain", async (req,res)=>{
  try{
    const user = await getUser(req); if(!user) return res.status(401).json({ error:"not signed in" });
    const prompt = (req.body.prompt||"").toString().slice(0,8000);
    if(!prompt) return res.status(400).json({ error:"nothing to explain" });
    const gen = await generate({ model: BASIC_MODEL, prompt, parts:[], images:[], max_tokens:900, temperature:0.4 });
    const out = (gen.text||"").toString().trim();
    if(!out) return res.status(502).json({ error:"try again" });
    res.json({ ok:true, text:out });
  }catch(e){ console.error(e); res.status(500).json({ error:e.message||"server error" }); }
});

/* ---- Admin: edit build prompts per kind × level (only is_admin accounts) ---- */
async function requireAdmin(req){
  const user = await getUser(req); if(!user) return null;
  const a = await admin.from("accounts").select("is_admin").eq("id",user.id).maybeSingle();
  return (a.data && a.data.is_admin) ? user : null;
}
app.get("/admin/prompt", async (req,res)=>{
  try{
    if(!await requireAdmin(req)) return res.status(403).json({ error:"admins only" });
    const kind = req.query.kind || "core";
    const level = (req.query.level==null || req.query.level==="") ? null : Number(req.query.level);
    let q = admin.from("prompt_templates").select("template,model,max_tokens,temperature").eq("key","import_generation").eq("kind",kind).eq("is_active",true);
    q = level!=null ? q.eq("level",level) : q.is("level",null);
    const r = await q.maybeSingle();
    res.json({ ok:true, row: r.data || null, defaultPrompt: (kind!=="core" ? (DEFAULT_PROMPTS[kind]||"") : "") });
  }catch(e){ res.status(500).json({ error:e.message||"server error" }); }
});
app.post("/admin/prompt", async (req,res)=>{
  try{
    if(!await requireAdmin(req)) return res.status(403).json({ error:"admins only" });
    const { kind, template } = req.body;
    if(!kind || !template) return res.status(400).json({ error:"kind and template required" });
    const lv = (req.body.level==null || req.body.level==="") ? null : Number(req.body.level);
    // inherit model/tokens/temp from the core default so we never violate a NOT NULL column
    const base = await admin.from("prompt_templates").select("model,max_tokens,temperature").eq("key","import_generation").eq("kind","core").is("level",null).eq("is_active",true).maybeSingle();
    const bd = base.data || {};
    const row = { key:"import_generation", kind, level:lv, template, is_active:true,
      model: req.body.model || bd.model || TEXT_MODEL,
      max_tokens: Number(req.body.max_tokens) || bd.max_tokens || 16000,
      temperature: (req.body.temperature!=null && req.body.temperature!=="") ? Number(req.body.temperature) : (bd.temperature!=null ? bd.temperature : 0.3) };
    let q = admin.from("prompt_templates").select("id").eq("key","import_generation").eq("kind",kind).eq("is_active",true);
    q = lv!=null ? q.eq("level",lv) : q.is("level",null);
    const ex = await q.maybeSingle();
    const r = ex.data ? await admin.from("prompt_templates").update(row).eq("id",ex.data.id)
                      : await admin.from("prompt_templates").insert(row);
    if(r.error) return res.status(500).json({ error:r.error.message });
    res.json({ ok:true });
  }catch(e){ res.status(500).json({ error:e.message||"server error" }); }
});

/* ================= Visualize asset library — automated growth ==================
 * Loop: the engine's asset library is finite; when the model asks for an asset that
 * doesn't exist we log the demand (see /visualize). An admin runs "grow" → the LLM
 * drafts a manifest entry + a data-driven SVG for each frequently-wanted asset →
 * these land as PENDING proposals. One-tap approve registers the asset live (prompt +
 * QC + engine) with no code deploy, because approved assets are data-driven. */
const ASSET_DRAFT_SYS =
`You extend a medical-diagram asset library. Given an asset name that a diagram generator wanted but
that doesn't exist yet, output ONE JSON object describing how to draw and place it. The drawing is a
tiny SVG fragment centered on tokens @X and @Y (numbers the renderer substitutes), may use @LABEL for
a short caption and @COLOR for its main colour. Keep it ~40px, self-contained, no <svg> wrapper, no
scripts, no external refs. Choose sensible placement rules.
Return ONLY: {"id":"snake_case","category":"","scale":"molecular|subcellular|cellular|tissue","valid_templates":["membrane_cell"|"neuro_pathway"...],"valid_zones":[optional],"svg":"<...>@X..@Y..@LABEL..@COLOR..</...>"}`;

async function loadApprovedOverlay(){
  try{
    const r = await admin.from("viz_asset_proposals").select("spec").eq("status","approved");
    if(r.data && r.data.length){ const n = registerAssets(r.data.map(x=>x.spec)); console.log("[visualize] overlay: "+n+" approved asset(s) registered"); }
  }catch(_){ /* table not created yet — fine */ }
}

/* One-shot pipeline probe: runs a known sentence through generate → parse → QC and reports
 * exactly which stage fails (API / parse / QC), the model used, and the raw output head.
 * Lets an admin diagnose "couldn't build a visualization" without reading server logs. */
app.get("/admin/viz/selftest", async (req,res)=>{
  try{
    if(!await requireAdmin(req)) return res.status(403).json({ error:"admins only" });
    const sentence = (req.query.text||"ADH increases water reabsorption by inserting aquaporin-2 channels in the collecting duct.").toString().slice(0,400);
    const out = { model: BASIC_MODEL, deepseek_key: !!process.env.DEEPSEEK_API_KEY, stage:"start" };
    let gen;
    try{ gen = await generate({ model:BASIC_MODEL, prompt:buildVisualPrompt(sentence,"self-test"), parts:[], images:[], max_tokens:8000, temperature:0.2, json:true }); }
    catch(e){ out.stage="api_error"; out.error=e.message; return res.json({ ok:false, ...out }); }
    out.api_ok = true; out.text_len = (gen.text||"").length; out.raw_head = (gen.text||"").slice(0,220);
    if(!out.text_len){ out.stage="empty_response"; return res.json({ ok:false, ...out }); }
    const bp = parseBlueprint(gen.text);
    if(!bp){ out.stage="parse_failed"; return res.json({ ok:false, ...out }); }
    out.parse_ok = true; out.template = bp.template; out.elements = (bp.elements||[]).length; out.steps = (bp.narration_steps||[]).length;
    const qc = qcCheck(bp), g = graphCheck(bp);
    out.qc_pass = qc.pass; out.qc_issues = qc.issues;
    out.graph_pass = g.pass; out.graph_issues = g.issues; out.chain = chainOf(bp);
    try{ out.completeness = await completenessCheck(sentence, bp); }catch(e){ out.completeness = { missing:[], error:e.message }; }
    out.stage = (qc.pass && g.pass) ? "ok" : "warnings";   // warnings don't block delivery (a blueprint that parses is still shown)
    res.json({ ok:true, ...out });
  }catch(e){ res.status(500).json({ error:e.message||"server error" }); }
});

app.post("/admin/viz/grow", async (req,res)=>{
  try{
    if(!await requireAdmin(req)) return res.status(403).json({ error:"admins only" });
    // aggregate demand: most-wanted unknown asset types not already proposed
    const log = await admin.from("viz_expansion_log").select("requested_type,subject,source_text").limit(500);
    if(log.error) return res.status(500).json({ error:"expansion log unavailable — run the SQL migration first" });
    const counts = {}, sample = {};
    for(const r of (log.data||[])){ counts[r.requested_type]=(counts[r.requested_type]||0)+1; sample[r.requested_type]=sample[r.requested_type]||r; }
    const existing = await admin.from("viz_asset_proposals").select("id");
    const already = new Set((existing.data||[]).map(x=>x.id));
    const wanted = Object.entries(counts).sort((a,b)=>b[1]-a[1]).filter(([t])=>!already.has(t)).slice(0, Number(req.body.max)||5);
    const drafted = [];
    for(const [type,count] of wanted){
      const ex = sample[type]||{};
      const prompt = ASSET_DRAFT_SYS + `\n\nASSET NAME: ${type}\nSeen in subject: ${ex.subject||"medicine"}\nExample context: ${(ex.source_text||"").slice(0,200)}`;
      const gen = await generate({ model: BASIC_MODEL, prompt, parts:[], images:[], max_tokens:900, temperature:0.3, json:true });
      const spec = parseBlueprint(gen.text); if(!spec || !spec.svg) continue;
      spec.id = type;   // key by the requested name so future requests resolve
      const row = { id:type, status:"pending", demand:count, spec, drafted_at:new Date().toISOString() };
      const up = await admin.from("viz_asset_proposals").upsert(row);
      if(!up.error) drafted.push({ id:type, demand:count });
    }
    res.json({ ok:true, drafted, considered:wanted.length });
  }catch(e){ console.error(e); res.status(500).json({ error:e.message||"server error" }); }
});

app.get("/admin/viz/proposals", async (req,res)=>{
  try{
    if(!await requireAdmin(req)) return res.status(403).json({ error:"admins only" });
    const status = req.query.status || "pending";
    const r = await admin.from("viz_asset_proposals").select("id,status,demand,spec,drafted_at").eq("status",status).order("demand",{ascending:false});
    if(r.error) return res.status(500).json({ error:"proposals table unavailable — run the SQL migration first" });
    res.json({ ok:true, proposals:r.data||[] });
  }catch(e){ res.status(500).json({ error:e.message||"server error" }); }
});

app.post("/admin/viz/approve", async (req,res)=>{
  try{
    if(!await requireAdmin(req)) return res.status(403).json({ error:"admins only" });
    const { id, spec } = req.body; if(!id) return res.status(400).json({ error:"id required" });
    const patch = { status:"approved" }; if(spec) patch.spec = spec;   // allow an edited spec on approve
    const r = await admin.from("viz_asset_proposals").update(patch).eq("id",id).select("spec").maybeSingle();
    if(r.error) return res.status(500).json({ error:r.error.message });
    if(r.data && r.data.spec) registerAssets([r.data.spec]);   // live immediately — no deploy
    res.json({ ok:true, live:true });
  }catch(e){ res.status(500).json({ error:e.message||"server error" }); }
});

app.post("/admin/viz/reject", async (req,res)=>{
  try{
    if(!await requireAdmin(req)) return res.status(403).json({ error:"admins only" });
    const { id } = req.body; if(!id) return res.status(400).json({ error:"id required" });
    const r = await admin.from("viz_asset_proposals").update({ status:"rejected" }).eq("id",id);
    if(r.error) return res.status(500).json({ error:r.error.message });
    res.json({ ok:true });
  }catch(e){ res.status(500).json({ error:e.message||"server error" }); }
});

/* ---- Paystack webhook: confirm a payment server-side and activate the sub ---- */
app.post("/paystack/webhook", async (req,res)=>{
  try{
    const sig = req.headers["x-paystack-signature"];
    const hash = crypto.createHmac("sha512", process.env.PAYSTACK_SECRET_KEY).update(req.body).digest("hex");
    if(hash !== sig) return res.status(401).end();
    const event = JSON.parse(req.body.toString("utf8"));
    if(event.event === "charge.success" || event.event === "subscription.create"){
      const email = event.data && (event.data.customer && event.data.customer.email);
      if(email){
        const acc = await admin.from("accounts").select("id").eq("email", email).maybeSingle();
        if(acc.data) await admin.from("subscriptions").update({ status:"active", plan:"monthly" }).eq("account_id", acc.data.id);
      }
    }
    res.status(200).end();
  }catch(e){ console.error(e); res.status(200).end(); }   // always 200 so Paystack stops retrying
});

const PORT = process.env.PORT || 8787;
app.listen(PORT, ()=>{ console.log("MedBank import server on :"+PORT); loadApprovedOverlay(); });
