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
import { buildVisualPrompt, qcCheck, parseBlueprint, textKey } from "./visualize.mjs";
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
async function isPremium(account_id){ try{ const s=await admin.from("subscriptions").select("status").eq("account_id",account_id).maybeSingle(); return !!(s.data && s.data.status==="active"); }catch(e){ return false; } }
async function builtCount(account_id){ try{ const c=await admin.from("topics").select("id",{ count:"exact", head:true }).eq("account_id",account_id); return c.count||0; }catch(e){ return 0; } }
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
async function generate({ model, prompt, parts, images, max_tokens, temperature }){
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
      body: JSON.stringify({ contents:[{ role:"user", parts:gparts }], generationConfig:{ maxOutputTokens:max_tokens, temperature } })
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
  const r = await fetch(base+"/chat/completions", { method:"POST",
    headers:{ "Content-Type":"application/json", "Authorization":"Bearer "+key }, body:JSON.stringify(body) });
  const j = await r.json();
  if(!r.ok) throw new Error((isDeep?"DeepSeek":"OpenAI")+": "+((j.error&&j.error.message)||r.status));
  const text=(((j.choices||[])[0]||{}).message||{}).content||"";
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
  try{ const o=JSON.parse(t.slice(s,e+1)); return (o&&Array.isArray(o.items)&&o.items.length)?o.items:null; }catch(_){ return null; }
}

/* resolve the model for a student (paid vs trial), reused by extras / podcast */
async function resolveModel(account_id, level){
  // in-app generation (podcast script, extras, tutor, etc.) ALWAYS uses Flash.
  // Tiering (Flash basic / Pro premium) applies ONLY to the lecture import build.
  return BASIC_MODEL;
}

/* ---- Podcast: two-host study episode from a lecture note (script + Fish/Kokoro voices) ---- */
const PODCAST_PROMPT = "You are writing a lively but accurate two-host study podcast for medical students, based ONLY on the lecture note below. Two hosts, HOST A and HOST B, have a natural back-and-forth that genuinely teaches the material — clear, engaging, occasionally light, but always faithful and exam-relevant. Return ONLY valid JSON: {\"lines\":[{\"speaker\":\"A\"|\"B\",\"text\":\"one spoken line\"}]}. Keep it tight — a focused 10-12 minute episode, so use 12-18 lines, mostly alternating A/B, each 1-3 sentences, written to be SPOKEN (contractions, natural rhythm — not bookish). Open with a short hook, teach the key points in a logical order, and close with a quick recap. Never invent facts beyond the note.\n\nLECTURE NOTE:\n{{note}}";
async function podcastScript(level, note, model){
  const row = await loadPromptFor("podcast", level);
  const tmpl = (row && row.template) || PODCAST_PROMPT;
  const prompt = tmpl.replace(/\{\{note\}\}/g, note || "");
  const gen = await generate({ model:(row&&row.model)||model, prompt, parts:[], images:[], max_tokens:(row&&row.max_tokens)||4000, temperature:Number(row&&row.temperature)||0.6 });
  const t=gen.text||"", s=t.indexOf("{"), e=t.lastIndexOf("}");
  try{ const o=JSON.parse(t.slice(s,e+1)); return (o&&Array.isArray(o.lines)) ? o.lines.filter(l=>l&&l.text&&(l.speaker==="A"||l.speaker==="B")) : null; }catch(_){ return null; }
}
async function openaiTTS(text, voice){
  const key = process.env.OPENAI_API_KEY; if(!key) throw new Error("OPENAI_API_KEY not set on the server");
  const r = await fetch("https://api.openai.com/v1/audio/speech", {
    method:"POST", headers:{ "Authorization":"Bearer "+key, "Content-Type":"application/json" },
    body: JSON.stringify({ model: process.env.OPENAI_TTS_MODEL || "tts-1", voice: voice||"nova", input: text, response_format:"mp3" }) });
  if(!r.ok){ const t=await r.text().catch(()=> ""); throw new Error("OpenAI voice failed ("+r.status+"): "+t.slice(0,160)); }
  return Buffer.from(await r.arrayBuffer());
}
/* Fish Audio (hosted) — natural voices, same price tier as OpenAI, more voices.
 * Used for the AI tutor and most premium podcasts. Voice = reference_id. */
async function fishTTS(text, voiceId){
  const key = process.env.FISH_API_KEY; if(!key) throw new Error("FISH_API_KEY not set on the server");
  const r = await fetch("https://api.fish.audio/v1/tts", {
    method:"POST",
    headers:{ "Authorization":"Bearer "+key, "Content-Type":"application/json", "model": process.env.FISH_MODEL || "s2.1-pro" },
    body: JSON.stringify({ text, reference_id: voiceId || process.env.FISH_VOICE_A, format:"mp3" }) });
  if(!r.ok){ const t=await r.text().catch(()=> ""); throw new Error("Fish voice failed ("+r.status+"): "+t.slice(0,160)); }
  return Buffer.from(await r.arrayBuffer());
}
/* Kokoro (open model) via a hosted endpoint you point KOKORO_TTS_URL at (Deepinfra,
 * Replicate, or your own). Near-zero cost. Medical terms fixed via kokoroPrep(). */
async function kokoroTTS(text, voiceId){
  const url = process.env.KOKORO_TTS_URL;
  if(!url) throw new Error("KOKORO_TTS_URL not set on the server");
  const key = process.env.KOKORO_API_KEY;   // optional — Kokoro-FastAPI needs none by default
  const r = await fetch(url, {              // KOKORO_TTS_URL = the FULL endpoint, e.g. https://HOST/v1/audio/speech
    method:"POST",
    headers: Object.assign({ "Content-Type":"application/json" }, key ? { "Authorization":"Bearer "+key } : {}),
    // OpenAI-compatible body → works with Kokoro-FastAPI, Deepinfra, and OpenAI
    body: JSON.stringify({ model: process.env.KOKORO_MODEL || "kokoro", input: text, voice: voiceId || KOKORO_DEFAULT.read, response_format: "mp3" }) });
  if(!r.ok){ const t=await r.text().catch(()=> ""); throw new Error("Kokoro voice failed ("+r.status+"): "+t.slice(0,160)); }
  return Buffer.from(await r.arrayBuffer());
}
/* is a provider actually configured on this host yet? */
function providerReady(p){
  if(p==="fish")   return !!process.env.FISH_API_KEY;
  if(p==="kokoro") return !!process.env.KOKORO_TTS_URL;
  return !!process.env.OPENAI_API_KEY;
}
/* bounded in-memory cache so identical clips (re-reading the same card, replaying a
 * line) never re-hit the paid API. Podcasts are also cached per-topic in storage. */
const _ttsCache = new Map(); const _TTS_MAX = 400;
function _ttsKey(p, voiceId, text){ return createHash("md5").update(p+"|"+(voiceId||"")+"|"+text).digest("hex"); }
/* one clip via the chosen provider; if that provider isn't set up yet, fall back to
 * OpenAI so audio keeps working until you add the new keys. */
async function ttsClip(provider, text, voiceId){
  const p = providerReady(provider) ? provider : "openai";
  // STRICT: every clip passes through medical pronunciation prep before it is spoken.
  const spoken = (p==="kokoro") ? kokoroPrep(text) : sayPrep(text);
  const key = _ttsKey(p, voiceId, spoken);
  if(_ttsCache.has(key)) return _ttsCache.get(key);
  let buf;
  if(p==="fish")        buf = await fishTTS(spoken, voiceId);
  else if(p==="kokoro") buf = await kokoroTTS(spoken, voiceId);
  else                  buf = await openaiTTS(spoken, voiceId);
  _ttsCache.set(key, buf);
  if(_ttsCache.size > _TTS_MAX){ _ttsCache.delete(_ttsCache.keys().next().value); }
  return buf;
}
async function uploadPodcastAudio(path, buf){
  const up = await admin.storage.from("podcasts").upload(path, buf, { contentType:"audio/mpeg", upsert:true });
  if(up.error) throw new Error("audio storage failed: "+up.error.message+" (create a public bucket named 'podcasts')");
  return admin.storage.from("podcasts").getPublicUrl(path).data.publicUrl;
}

app.get("/health", (_req,res)=>res.json({ ok:true }));

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
loadLearnedPronunciations();
setInterval(loadLearnedPronunciations, 30*60*1000);   // refresh every 30 min

app.post("/import", async (req,res)=>{
  try{
    const user = await getUser(req);
    if(!user) return res.status(401).json({ error:"not signed in" });
    const account_id = user.id;

    // --- freemium gate: premium = unlimited imports; free = 1 built lecture ---
    if(!await isPremium(account_id)){
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
    if(have && have.length) return res.json({ ok:true, items:have });   // already built → return cached
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
    const t = await admin.from("topics").select("id,account_id,note_md,extras").eq("id",topic_id).maybeSingle();
    if(!t.data) return res.status(404).json({ error:"topic not found" });
    if(t.data.account_id !== user.id) return res.status(403).json({ error:"not your topic" });
    const extras = t.data.extras || {};
    if(extras.podcast && extras.podcast.script && extras.podcast.script.length) return res.json({ ok:true, lines:extras.podcast.script });
    const level = Number(req.body.level) || null;
    const model = await resolveModel(user.id, level);
    const lines = await podcastScript(level, t.data.note_md, model);
    if(!lines || !lines.length) return res.status(502).json({ error:"couldn't write the script — try again" });
    extras.podcast = Object.assign({}, extras.podcast||{}, { script:lines });
    await admin.from("topics").update({ extras }).eq("id",topic_id);   // ignored if extras column absent
    res.json({ ok:true, lines });
  }catch(e){ console.error(e); res.status(500).json({ error:e.message||"server error" }); }
});

/* Podcast — the ElevenLabs voices available on the account (for the character picker) */
app.get("/podcast-voices", async (req,res)=>{
  try{
    if(!await getUser(req)) return res.status(401).json({ error:"not signed in" });
    // engine is chosen automatically server-side now (Kokoro / Fish); no voice list to fetch
    res.json({ ok:true, voices:[] });
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
    const extras = t.data.extras || {};
    const script = extras.podcast && extras.podcast.script;
    if(!script || !script.length) return res.status(400).json({ error:"generate the script first" });
    // engine is automatic: basic = Kokoro; premium = 2x Fish : 1x Kokoro. Cached once per topic.
    const prem = await isPremium(user.id);
    let provider, vA = voiceA, vB = voiceB;
    const combo = "auto";
    if(extras.podcast.audio && extras.podcast.audio[combo]) return res.json({ ok:true, urls:extras.podcast.audio[combo], lines:script });
    if(!prem){ provider = "kokoro"; }
    else { const n = _podRot.get(user.id)||0; provider = (n % 3 === 2) ? "kokoro" : "fish"; _podRot.set(user.id, n+1); }
    if(provider==="kokoro"){ vA = process.env.KOKORO_VOICE_A || KOKORO_DEFAULT.A; vB = process.env.KOKORO_VOICE_B || KOKORO_DEFAULT.B; }
    else { vA = process.env.FISH_VOICE_A || voiceA; vB = process.env.FISH_VOICE_B || voiceB; }
    const urls=[];
    for(let i=0;i<script.length;i++){
      const vid = script[i].speaker==="A" ? vA : vB;
      const buf = await ttsClip(provider, script[i].text, vid);
      urls.push(await uploadPodcastAudio("t/"+topic_id+"/"+combo+"/"+i+".mp3", buf));
    }
    extras.podcast.audio = Object.assign({}, extras.podcast.audio||{}, { [combo]:urls });
    await admin.from("topics").update({ extras }).eq("id",topic_id);
    res.json({ ok:true, urls, lines:script });
  }catch(e){ console.error(e); res.status(500).json({ error:e.message||"server error" }); }
});

/* Solve: image and/or text question → step-by-step worked explanation */
app.post("/solve", async (req,res)=>{
  try{
    const user = await getUser(req); if(!user) return res.status(401).json({ error:"not signed in" });
    if(!await isPremium(user.id)) return res.status(402).json({ error:"upgrade", reason:"Solve is a premium feature — subscribe to snap and solve any question." });
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
    const provider = isTutor ? "fish" : "kokoro";
    const voice = req.body.voice || (isTutor ? process.env.FISH_VOICE_TUTOR : KOKORO_DEFAULT.read);
    const buf = await ttsClip(provider, text, voice);
    res.setHeader("Content-Type","audio/mpeg"); res.send(buf);
  }catch(e){ res.status(500).json({ error:e.message||"tts error" }); }
});

/* Visualize Text — highlighted sentence → step-by-step diagram blueprint (DeepSeek Flash).
 * Cached per highlighted text in the "visualizations" table (generate once, reuse for everyone).
 * Narration audio is produced on the client via /tts (Kokoro) per step. */
app.post("/visualize", async (req,res)=>{
  try{
    const user = await getUser(req); if(!user) return res.status(401).json({ error:"not signed in" });
    const text = (req.body.text||"").toString().trim();
    if(!text) return res.status(400).json({ error:"highlight some text first" });
    if(text.length>1200) return res.status(400).json({ error:"select a shorter passage (one or two sentences)" });
    const subject = (req.body.subject||"").toString().slice(0,80);
    const key = textKey(text);
    // cache read (best-effort — skips silently if the table isn't created yet)
    try{ const c = await admin.from("visualizations").select("blueprint").eq("text_key",key).maybeSingle();
      if(c.data && c.data.blueprint) return res.json({ ok:true, cached:true, blueprint:c.data.blueprint }); }catch(_){}
    // generate blueprint (Flash — in-app, always cheap tier)
    const prompt = buildVisualPrompt(text, subject);
    let gen = await generate({ model: BASIC_MODEL, prompt, parts:[], images:[], max_tokens:4000, temperature:0.2 });
    let bp = parseBlueprint(gen.text), qc = qcCheck(bp);
    if(!qc.pass){                                   // one corrective retry with the QC issues
      const fix = prompt + "\n\nYour previous JSON had these problems — fix ALL of them and return ONLY corrected JSON:\n- "
                + qc.issues.join("\n- ") + "\n\nPREVIOUS:\n" + (gen.text||"").slice(0,4000);
      const gen2 = await generate({ model: BASIC_MODEL, prompt:fix, parts:[], images:[], max_tokens:4000, temperature:0.2 });
      const bp2 = parseBlueprint(gen2.text), qc2 = qcCheck(bp2);
      if(bp2 && (qc2.pass || !bp)){ bp = bp2; qc = qc2; }
    }
    if(!bp) return res.status(502).json({ error:"couldn't build a visualization — try a clearer single sentence" });
    // cache write (best-effort)
    try{ await admin.from("visualizations").upsert({ text_key:key, concept_id:(bp.meta&&bp.meta.concept_id)||key, subject, blueprint:bp, verified:false }); }catch(_){}
    res.json({ ok:true, cached:false, blueprint:bp, qc_issues:qc.issues });
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
app.listen(PORT, ()=>console.log("MedBank import server on :"+PORT));
