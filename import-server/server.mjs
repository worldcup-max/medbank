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
import { readFileSync } from "node:fs";
import { createHash } from "node:crypto";
import { kokoroPrep, sayPrep, mergeTerms, knownTerm, KOKORO_DEFAULT } from "./med-voice.mjs";
import { buildVisualPrompt, qcCheck, graphCheck, chainOf, parseBlueprint, textKey, renderHints, registerAssets, assetDefs, LAYOUTS } from "./visualize.mjs";
import { buildExtractBatchPrompt, buildExtractPrompt, parseProposedBatch, parseProposed, buildReconcilePrompt, buildReconcilePromptV2, buildReconcilePromptV3, candidateFilter, retrieveCandidates, decide, mintTargetId, newTargetRecord } from "./targets.mjs";
import { replenish, onCanonicalExhausted, A7_CFG } from "./retestpool.mjs";
import { runCandidate, applyHumanReview, readinessGate, qaScore } from "./integrated.mjs";
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
  // ENT-04: maybeSingle() RETURNS an error, it doesn't throw — so a DB blip silently downgraded a
  // paying subscriber to Basic ("Solve is a premium feature — subscribe") with nothing in the logs.
  if(s.error) console.error("[isPremium] subscriptions read FAILED for %s — treating as NOT premium: %s", account_id, s.error.message||s.error);
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
async function builtCount(account_id){ try{ const c=await admin.from("topics").select("id",{ count:"exact", head:true }).eq("account_id",account_id);
  if(c && c.error) console.error("[builtCount] topics count FAILED for %s — free-build limit NOT enforced this call: %s", account_id, c.error.message||c.error);
  return c.count||0; }catch(e){ console.error("[builtCount] threw — free-build limit NOT enforced this call:", e.message); return 0; } }
/* today's Visualize allowance for a user — basic 3/day, premium 10/day (only new builds count) */
async function vizQuota(userId, emailHint){
  const premium = await isPremium(userId, emailHint).catch(()=>false);
  const limit = premium ? 10 : 3;
  let used = 0;
  try{ const since=new Date(); since.setUTCHours(0,0,0,0);
    const c=await admin.from("viz_events").select("id",{ count:"exact", head:true }).eq("account_id",userId).gte("created_at",since.toISOString());
    // ENT-04: fail-open is right for "table not created yet" and wrong for a transient error — and the
    // two look identical here. Log it, otherwise an outage quietly makes every explainer free.
    if(c && c.error) console.error("[vizQuota] viz_events count FAILED for %s — reporting 0 used (cap NOT enforced): %s", userId, c.error.message||c.error);
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
  if(body.pdf_base64){
    const pdf=require("pdf-parse");
    let d=null;
    try{ d = await pdf(Buffer.from(body.pdf_base64,"base64")); }
    catch(e){ throw new Error("Couldn't read that PDF — it may be damaged or password-protected. Re-save it and try again, or attach clear photos of the slides instead."); }
    const ptxt = ((d && d.text) || "").trim();
    // A scanned / image-only PDF extracts to nothing. Pushing the bare "RAW LECTURE (PDF):" header
    // then sends the model a prompt with no lecture in it; the empty-content guard in /import
    // catches that and tells the student what to do instead.
    if(ptxt) parts.push({ type:"text", text:"RAW LECTURE (PDF):\n\n"+ptxt });
  }
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
const GEN_TIMEOUT_MS = Number(process.env.GEN_TIMEOUT_MS) || 300000;            // text-model calls must never hang forever, but allow big reasoning+JSON gens (fail fast → the UI can show a real error)
const EXTRAS_MODEL = process.env.MEDBANK_EXTRAS_MODEL || BASIC_MODEL;           // model for in-app extras (qbank/written). Set to a non-reasoning model (e.g. deepseek-chat) for much faster builds.
const QBANK_BATCHES = Number(process.env.QBANK_BATCHES) || 5;                   // qbank is generated in N parallel focused calls → wall-clock ≈ one small call, not the whole set
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
    const gctrl = new AbortController(); const gto = setTimeout(()=>gctrl.abort(), GEN_TIMEOUT_MS);
    let r;
    try{
      r = await fetch("https://generativelanguage.googleapis.com/v1beta/models/"+model+":generateContent?key="+key, {
        method:"POST", headers:{ "Content-Type":"application/json" },
        body: JSON.stringify({ contents:[{ role:"user", parts:gparts }], generationConfig:{ maxOutputTokens:max_tokens, temperature, ...(json?{responseMimeType:"application/json"}:{}) } }),
        signal: gctrl.signal
      });
    }catch(e){ clearTimeout(gto); throw new Error("Gemini request "+(e&&e.name==="AbortError"?("timed out after "+Math.round(GEN_TIMEOUT_MS/1000)+"s"):("failed: "+(e&&e.message||e)))); }
    clearTimeout(gto);
    const j = await r.json().catch(()=>({}));
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
  if(isDeep){ body.max_tokens = max_tokens; body.temperature = temperature;
    // DeepSeek V4 (flash/pro) are HYBRID thinkers: with no reasoning_effort they default to "thinking"
    // and burn the entire token budget on chain-of-thought (reasoning_content) before ever emitting the
    // JSON answer — finish_reason:"length", empty content, unparseable. "none" = Non-think mode: the model
    // answers directly and fast. Override via env if a task ever needs reasoning. (Confirmed against
    // DeepSeek API docs — the legacy deepseek-chat/deepseek-reasoner names were retired 2026-07-24.)
    body.reasoning_effort = process.env.DEEPSEEK_REASONING_EFFORT || "none";
  }
  else { body.max_completion_tokens = max_tokens; }   // OpenAI newer models: leave temperature default
  // JSON mode: forces a clean JSON object and suppresses chain-of-thought preamble that otherwise
  // eats the whole token budget before any JSON is emitted (the cause of "parse failed" on reasoning models)
  if(json) body.response_format = { type:"json_object" };
  async function callOnce(){
    const ctrl = new AbortController(); const to = setTimeout(()=>ctrl.abort(), GEN_TIMEOUT_MS);   // never hang forever on a stalled model call
    let rr;
    try{
      rr = await fetch(base+"/chat/completions", { method:"POST",
        headers:{ "Content-Type":"application/json", "Authorization":"Bearer "+key }, body:JSON.stringify(body), signal: ctrl.signal });
    }catch(e){ clearTimeout(to); throw new Error((isDeep?"DeepSeek":"OpenAI")+" request "+(e&&e.name==="AbortError"?("timed out after "+Math.round(GEN_TIMEOUT_MS/1000)+"s"):("failed: "+(e&&e.message||e)))); }
    clearTimeout(to);
    return { r:rr, j: await rr.json().catch(()=>({})) };
  }
  let { r, j } = await callOnce();
  // Some models/proxies reject response_format:json_object (a reasoning model that doesn't support
  // it, or DeepSeek wanting the literal word "json" in the prompt). Never fail the build over the
  // formatting hint — drop json mode and retry once; robust extraction then handles the raw reply.
  if(!r.ok && body.response_format){
    const em = ((((j||{}).error)||{}).message || "").toLowerCase();
    if(/response_format|json.?object|json mode|does not support|not support|must contain the word/.test(em)){
      delete body.response_format; ({ r, j } = await callOnce());
    }
  }
  // QB-09: some OpenAI-compatible models REJECT (rather than clamp) a max_tokens above their output cap — the
  // legacy deepseek-chat capped at 8192, and smaller OpenAI models cap lower. That 400 would otherwise fail every
  // parallel qbank batch identically and surface as a generic "couldn't build — try again", making a provider-cap
  // config problem look like a transient error forever. The current default (deepseek-v4-flash, 384k output cap)
  // is safe at 12000; this guard only fires on a genuine cap rejection, clamps to a known-safe 8000, and retries once.
  if(!r.ok){
    const em = ((((j||{}).error)||{}).message || "").toLowerCase();
    const tokField = isDeep ? "max_tokens" : "max_completion_tokens";
    const cur = body[tokField]||0;
    if(cur>8000 && /token/.test(em) && /(max|maximum|exceed|too large|less than or equal|out of range|invalid|limit|cap)/.test(em)){
      console.warn("[generate] "+(isDeep?"DeepSeek":"OpenAI")+" rejected "+tokField+"="+cur+" → clamping to 8000 and retrying once");
      body[tokField]=8000; ({ r, j } = await callOnce());
    }
  }
  if(!r.ok) throw new Error((isDeep?"DeepSeek":"OpenAI")+": "+((j.error&&j.error.message)||r.status));
  const choice=((j.choices||[])[0])||{}; const msg=choice.message||{};
  // reasoning models sometimes leave `content` empty and put the answer in `reasoning_content`
  const usedContent = !!(msg.content && msg.content.trim());
  const text = usedContent ? msg.content : (msg.reasoning_content||"");
  const u=j.usage||{};
  return { text, usage:{ input_tokens:u.prompt_tokens, output_tokens:u.completion_tokens },
           finish_reason: choice.finish_reason||"", model_used: model, json_mode: !!body.response_format,
           from_reasoning: !usedContent && !!(msg.reasoning_content) };
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
  written: "You are setting short-answer / written-test questions for a medical student from the lecture note below. Return ONLY valid JSON of the form {\"items\":[{\"prompt\":\"an exam-style short-answer question (define / describe / explain / compare)\",\"model_answer\":\"a concise ideal answer\",\"points\":[\"key marking point 1\",\"key marking point 2\",\"key marking point 3\"]}]}. Make 5-8 questions matching how medical exams test this topic; the points array is the marking rubric.\n\nLECTURE NOTE:\n{{note}}",
  qbank: "You are a medical board question writer creating a single-best-answer question bank from the lecture note below (USMLE / MRCP / medical-school finals style), for a student preparing for exams and clinical rotations. Return ONLY valid JSON: {\"items\":[{\"stem\":\"the clinical vignette\",\"lead_in\":\"the clinical decision being asked\",\"options\":[\"...\"],\"answer\":0,\"rationales\":[\"why each option is right or wrong\"],\"objective\":\"one-line high-yield educational objective\",\"trap_type\":\"anchoring|premature_closure|next_step_confusion|timing_error|contraindication|overthinking|common_diagnosis_bias|none\",\"trap_explanation\":\"one line on why a student might fall for it (empty if trap_type is none)\",\"subtopic\":\"1-3 word sub-topic e.g. Unconjugated hyperbilirubinaemia\",\"system\":\"system/discipline e.g. Paediatrics\",\"cognitive_level\":\"interpretation|clinical_reasoning|complex_reasoning|exam_trap\",\"skill\":\"diagnosis|investigation|management|complications|differential|next_step\",\"src\":\"a 6-12 word verbatim quote copied EXACTLY from the note this tests\"}]}.\n\nTWO SEPARATE AXES — tag BOTH on every question:\n- cognitive_level = HOW the student must think. Build each level to this exact spec (do NOT just make the medicine harder):\n  * 'interpretation' — give RAW clinical data (labs / ABG / ECG / imaging / vital signs / examination findings / trends) and make the student work out what it MEANS. The task is reading and interpreting data, never recalling a named fact.\n  * 'clinical_reasoning' — the student must CONNECT several pieces (history + examination + investigations) to decide what is happening or the next consideration; the answer is defensible only after integrating the clues, and competing conditions must be distinguishable from the stem.\n  * 'complex_reasoning' — a MULTI-STEP or EVOLVING vignette (the initial step is already done or fails, or the patient deteriorates): the student must recognise -> interpret -> prioritise -> choose the correct action IN SEQUENCE. The priority problem is often NOT the most obvious one (e.g. persistent hypotension after fluids -> vasopressor; wide-QRS hyperkalaemia -> IV calcium first).\n  * 'exam_trap' — built to catch ONE specific reasoning error. The medicine may be simple; the difficulty is that the student misreads the task.\n- trap_type + trap_explanation = the reasoning error a careless student makes. Set these WHENEVER a question has a catchable trap (NOT only exam_trap questions — a clinical_reasoning management item can still have next_step_confusion). Use trap_type='none' only when there is genuinely no characteristic trap. Values: 'anchoring' (fixates on the first/obvious clue), 'premature_closure' (stops at the first plausible diagnosis), 'next_step_confusion' (gives the diagnosis or definitive treatment when asked the NEXT step), 'timing_error' (ignores urgency / therapeutic window), 'contraindication' (knows the treatment but misses a contraindication or safety check), 'overthinking' (picks an exotic answer over the simple correct one), 'common_diagnosis_bias' (answers 'most likely' when asked 'most dangerous / must exclude').\n- skill = WHICH CLINICAL TASK it tests: 'diagnosis', 'investigation', 'management', 'complications', 'differential' (differential diagnosis), 'next_step' (the single best next action). Independent of level — e.g. a management question can be clinical_reasoning OR complex_reasoning.\n\nWRITE REAL VIGNETTES, not a fact in a costume:\n- NEVER name the diagnosis in the stem — the student must INFER it from the presentation (age, timing, vitals, labs, a distinguishing finding). If the disease name appears in the stem, the question has FAILED; rewrite it.\n- TWO-STEP reasoning minimum: the student must identify the condition AND THEN apply management / mechanism / next step. (Recall = one hop; a Q-bank item = two.)\n- Every clue in the stem must EARN its place — include at least one detail that DISCRIMINATES the correct answer from the best distractor, and ideally one plausible red herring. Do NOT pad with irrelevant text: difficulty comes from reasoning and distractor quality, NEVER from stem length.\n- The lead-in is a CLINICAL DECISION (most likely diagnosis / best next step / most appropriate treatment / mechanism of the presenting sign) — never 'which of the following is true'.\n\nOPTIONS & RATIONALES:\n- 4 or 5 options, ALL the same category (all 'next investigation', or all 'most likely organism', etc.) — never mix categories. options and rationales arrays MUST be the same length.\n- Exactly ONE best answer; 'answer' is its 0-based index. Distractors must be plausible common student errors, not silly.\n- LENGTH PARITY: never let the correct option stand out. Keep all options the same length, detail and grammatical register. If the correct answer needs to be long or qualified, make every distractor equally long and qualified — a student must NOT be able to spot the answer by its wording (longest / most specific / most hedged / only one with a caveat). Match phrasing style across all options.\n- Write a rationale for EVERY option. EXACTLY ONE option is correct. Do NOT begin any rationale with 'Correct' / 'Incorrect' / 'Right' / 'Wrong' — the app marks the answer itself. For the correct option, explain why it's best. For each wrong option, explain why it is wrong (you may add the scenario that WOULD make it right, but NEVER phrase a wrong option's rationale as though it were the answer).\n- Rationales must give the CLINICAL reason a tutor would give — the mechanism, the discriminating feature, or the guideline principle. NEVER write 'the note states', 'according to the note/table/lecture', or otherwise cite the note as the reason. Explain WHY, not where it is written.\n- The rationales array MUST be in the SAME ORDER as the options (rationales[0] explains options[0], etc.). Do not shift or reorder them.\n- For exam_trap questions, set 'trap' to the specific error (e.g. 'recognises the diagnosis but picks the treatment instead of the required next investigation').\n\nSPREAD ACROSS COGNITIVE LEVELS: a few 'interpretation', the bulk 'clinical_reasoning', several 'complex_reasoning', and one or two 'exam_trap'. Vary the 'skill' too so the set covers diagnosis, investigation, management and next_step where the note allows.\n\nBase everything strictly on the note; never invent drugs, numbers, or guidelines; keep values EXACTLY as in the note. Make 13-15 questions IF the note supports that many DISTINCT high-yield concepts. EVERY question must test a DIFFERENT concept: NEVER write two questions on the same diagnosis or the same subtopic — not even one asking its diagnosis and another its treatment. Maximise coverage across the whole note. If the note only supports fewer distinct concepts, make fewer — quality and distinctness over hitting a number. No 'all of the above' / 'none of the above'.\n\nOUTPUT: reply with the JSON object ONLY. Do NOT restate the task or plan your work in prose. Your reply must BEGIN with the character { and contain nothing before it.\n\nLECTURE NOTE:\n{{note}}"
};

/* "Solve" — a photo/text question (MCQ, past question, diagram) → worked explanation */
const SOLVE_PROMPT = "You are a sharp medical tutor helping a student with a question they've shared as a photo and/or text. It may be a multiple-choice question, a past exam question, or a diagram to interpret. First, state the answer clearly (for an MCQ, name the correct option). Then explain the reasoning step by step in plain, exam-relevant language a medical student understands, and for an MCQ briefly say why the other options are wrong. If the image is unclear or cut off, say what you can and ask for a clearer photo. Be accurate and concise — never invent facts you can't see.";

/* Recover complete question objects from a truncated/dirty JSON array (reasoning models sometimes
 * narrate first or get cut off mid-array). Walks the text, JSON.parsing each balanced {...} object. */
function salvageItems(text){
  const out=[]; let arr=text.indexOf('"items"'); arr = text.indexOf('[', arr<0?0:arr); if(arr<0) return out;
  let depth=0, start=-1, inStr=false, esc=false;
  for(let k=arr+1;k<text.length;k++){ const ch=text[k];
    if(inStr){ if(esc) esc=false; else if(ch==='\\') esc=true; else if(ch==='"') inStr=false; continue; }
    if(ch==='"'){ inStr=true; continue; }
    if(ch==='{'){ if(depth===0) start=k; depth++; }
    else if(ch==='}'){ if(depth>0){ depth--; if(depth===0 && start>=0){ try{ out.push(JSON.parse(text.slice(start,k+1))); }catch(_){}; start=-1; } } }
    else if(ch===']' && depth===0){ break; }
  }
  return out;
}
/* Robustly pull the intended JSON OBJECT out of a model reply. Survives reasoning models that
 * narrate first, wrap output in ```json fences, emit <think>…</think>, or trail prose after the
 * JSON. Scans for the first BALANCED top-level {...} (respecting strings/escapes) and returns the
 * first one that parses; falls back to a naive first{…last} slice. Returns null only if nothing
 * parseable exists. This is the safety net that stops one stray reply from failing a whole build. */
function extractJsonObject(raw){
  let t = String(raw||"");
  t = t.replace(/<think>[\s\S]*?<\/think>/gi, " ").replace(/<\/?think>/gi, " ");   // strip reasoning wrappers
  t = t.replace(/```+\s*json/gi, " ").replace(/```+/g, " ");                        // strip markdown code fences
  if(t.indexOf("{") < 0) return null;
  // Collect every balanced top-level {...} that parses and keep the LARGEST — a reasoning model may
  // narrate a tiny example object before the real one, and the real study set (note + decks) dwarfs it.
  let best=null, bestLen=-1, depth=0, inStr=false, esc=false, start=-1;
  for(let k=0; k<t.length; k++){ const ch=t[k];
    if(inStr){ if(esc) esc=false; else if(ch==='\\') esc=true; else if(ch==='"') inStr=false; continue; }
    if(ch==='"'){ inStr=true; continue; }
    if(ch==='{'){ if(depth===0) start=k; depth++; }
    else if(ch==='}'){ if(depth>0){ depth--; if(depth===0 && start>=0){ const slice=t.slice(start,k+1);
      try{ const obj=JSON.parse(slice); if(slice.length>bestLen){ best=obj; bestLen=slice.length; } }catch(_){} start=-1; } } }
  }
  if(best) return best;
  try{ return JSON.parse(t.slice(t.indexOf("{"), t.lastIndexOf("}")+1)); }catch(_){ return null; }   // last resort
}
/* generate one optional extra (fill_blank / written) from the built note; returns items[] or null */
async function buildExtra(kind, level, note, model){
  const row = await loadPromptFor(kind, level);
  const tmpl = (row && row.template) || DEFAULT_PROMPTS[kind];
  if(!tmpl) return null;
  const mdl = (row && row.model) || model;
  // returns { items:[...], partial:bool } or null. `partial` only ever true for qbank (a multi-batch build).
  if(kind==="qbank") return buildQbankBatched(tmpl, note, mdl, row && row.max_tokens, row && row.temperature);
  // written (and any other single-shot kind): one call
  // `Number(x)||0.3` turned a deliberately configured temperature of 0 back into 0.3 — check for null instead
  const rowTemp = (row && row.temperature != null && !isNaN(Number(row.temperature))) ? Number(row.temperature) : 0.3;
  const raw = await genRawItems(tmpl.replace(/\{\{note\}\}/g, note || ""), mdl, (row&&row.max_tokens)||8000, rowTemp);
  const items = (raw||[]).filter(it => it && String(it.prompt||"").trim());
  return items.length ? { items, partial:false } : null;
}
/* one generate() call → parsed raw items[] (full parse, else salvage a truncated/dirty response) */
async function genRawItems(prompt, model, maxTok, temperature){
  const gen = await generate({ model, prompt, parts:[], images:[], max_tokens:maxTok, temperature:(temperature==null?0.3:temperature), json:true });
  const t=gen.text||""; let raw=null;
  { const s=t.indexOf("{"), e=t.lastIndexOf("}"); try{ const o=JSON.parse(t.slice(s,e+1)); if(o && Array.isArray(o.items)) raw=o.items; }catch(_){} }
  if(!raw || !raw.length){ const sal=salvageItems(t); if(sal.length){ console.warn("[genRawItems] salvaged "+sal.length+" from truncated/dirty JSON"); raw=sal; } }
  return raw || [];
}
/* Clean one rationale: drop a leading verdict label, and remove "the note states/stresses/directs/…"
   citations ANYWHERE (weak pedagogy — a tutor explains WHY, not where it's written), unwrapping any
   quoted clause left behind, then tidy + sentence-case. */
const NOTE_CITE = /\b(the (?:note|lecture|table)\s+(?:states?|stress(?:es|ed)?|direct(?:s|ed)?|say(?:s)?|mention(?:s|ed)?|note(?:s)?|emphasi[sz]e(?:s|d)?|indicate(?:s|d)?|specif(?:y|ies|ied)|recommend(?:s|ed)?|point(?:s|ed)? out)|according to the (?:note|lecture|table)|as (?:per|stated in|noted in|shown in) the (?:note|lecture|table)|per the note)\s*(?:that|to)?\s*[:,]?\s*/gi;
function cleanRationale(r){
  let s = String(r||"").trim();
  s = s.replace(/^(correct|incorrect|wrong|right|true|false)\s*[:\-–—]\s*/i, "");   // verdict label (Q3 keying bug)
  s = s.replace(NOTE_CITE, "");                                                       // note-citation, any sentence
  s = s.replace(/[‘’“”]/g, "'");                                  // normalise smart quotes
  s = s.replace(/(^|[.!?]\s+)'\s*([^']+?)\s*'(\s*[.!?,;]?)/g, "$1$2$3");              // unwrap a quoted clause
  s = s.replace(/^['",;:\-–—\s]+/, "").replace(/\s{2,}/g, " ").replace(/\s+([.,;])/g, "$1").trim();
  s = s.replace(/([.!?]\s+)([a-z])/g, (m,p,c)=>p+c.toUpperCase());                    // sentence-case after breaks
  return s ? s.charAt(0).toUpperCase()+s.slice(1) : s;
}
/* validate + clean + de-duplicate qbank items (shared by both the single and batched paths) */
function validateQbankItems(rawArr){
  const COG   = new Set(["interpretation","clinical_reasoning","complex_reasoning","exam_trap"]);
  const SKILL = new Set(["diagnosis","investigation","management","complications","differential","next_step"]);
  const TRAP  = new Set(["anchoring","premature_closure","next_step_confusion","timing_error","contraindication","overthinking","common_diagnosis_bias"]);
  const COG2DIFF = { interpretation:"easy", clinical_reasoning:"medium", complex_reasoning:"hard", exam_trap:"hard" };
  const DIFF2COG = { easy:"interpretation", medium:"clinical_reasoning", hard:"complex_reasoning" };
  const norm = s => String(s||"").toLowerCase().trim().replace(/[\s-]+/g,"_");
  /* Models don't always honour "0-based index": they return 2, "2", "B", "B)" or the option text.
     Every one of those used to fail `Number.isInteger` and the whole item was dropped SILENTLY —
     with only 3 questions per batch, one such habit can empty the entire q-bank. Coerce first;
     anything still unrecognisable becomes NaN and is dropped by the filter below, as before. */
  const coerceAnswer = (a, opts) => {
    if(typeof a === "number") return Number.isInteger(a) ? a : NaN;
    const s = String(a==null?"":a).trim();
    if(!s) return NaN;
    if(/^\d+$/.test(s)) return parseInt(s,10);
    const hit = (opts||[]).findIndex(o => String(o||"").trim().toLowerCase() === s.toLowerCase());
    if(hit>=0) return hit;                                             // answer given as the option text
    if(s.length<=3 && /^[a-j][).:]?$/i.test(s)) return s.toUpperCase().charCodeAt(0)-65;   // "B" / "B)" / "B."
    return NaN;
  };
  let ratDropped=0;   // QB-08: count items whose rationales couldn't be trusted to be positionally aligned
  /* Rationales are indexed positionally by the client (q.rationales[j] for option j). If the array is SHORTER
     than options, we cannot tell an end-truncation (entries present are aligned, safe to keep) from a middle
     omission (every later entry shifts up one → the right explanation renders under the WRONG option, which for
     an exam app is worse than showing none). Since the two are indistinguishable from the data, a short array is
     dropped entirely; an equal-or-longer one is sliced (extra tail is safely discarded) and kept. */
  const alignRationales = (arr, nOpts) => {
    const a = Array.isArray(arr) ? arr : [];
    if(a.length < nOpts){ if(a.length) ratDropped++; return []; }
    return a.slice(0, nOpts).map(cleanRationale);
  };
  let items = (rawArr||[])
    .map(it => (it && typeof it==="object" && !Array.isArray(it))
        ? Object.assign({}, it, { answer: coerceAnswer(it.answer, it.options) })
        : it)
    .filter(it => it && String(it.stem||"").trim()
      && Array.isArray(it.options) && it.options.length>=4 && it.options.every(o=>String(o||"").trim())
      && Number.isInteger(it.answer) && it.answer>=0 && it.answer<it.options.length)
    .map(it => {
      let cog = norm(it.cognitive_level); if(!COG.has(cog)) cog = DIFF2COG[norm(it.difficulty)] || "clinical_reasoning";
      let skill = norm(it.skill); if(!SKILL.has(skill)) skill = "";
      const objective = String(it.objective||it.teaching||"").trim().slice(0,240);
      const subtopic  = String(it.subtopic||it.tag||"").trim().slice(0,40);
      let trapType = norm(it.trap_type); if(!TRAP.has(trapType)) trapType = "";
      const trapExpl = String(it.trap_explanation||it.trap||"").trim().slice(0,240);
      return { stem:String(it.stem).trim(),
        lead_in: String(it.lead_in||"").trim().slice(0,160),
        options: it.options.map(o=>String(o).trim()),
        answer: it.answer,
        rationales: alignRationales(it.rationales, it.options.length),
        objective, teaching: objective,
        trap_type: trapType, trap_explanation: trapExpl, trap: trapExpl,
        subtopic, tag: subtopic,
        system: String(it.system||"").trim().slice(0,40),
        cognitive_level: cog,
        difficulty: COG2DIFF[cog],
        skill,
        src: String(it.src||"").trim().slice(0,160) };
    });
  // de-duplicate across everything (incl. across parallel batches). Catches: near-copy stems, same
  // subtopic label, AND functional duplicates — same skill + overlapping concept/answer + a similar
  // stem (e.g. two "typical absence" or two "febrile seizure → LP" items phrased differently).
  const wordSet = s => new Set(String(s||"").toLowerCase().replace(/[^a-z0-9 ]/g," ").split(/\s+/).filter(w=>w.length>3));
  const jac = (a,b)=>{ let inter=0; a.forEach(w=>{ if(b.has(w)) inter++; }); const uni=a.size+b.size-inter; return uni?inter/uni:0; };
  const shares = (a,b)=>{ for(const w of a) if(b.has(w)) return true; return false; };
  // QB-07: on a collision, keep the RARER / higher-value cognitive level rather than whichever arrived first.
  // FOCI order put exam_trap + complex_reasoning last, so "keep first" silently culled exactly the two levels the
  // v1.7 spec cares most about whenever a thin lecture forced two batches onto the same subtopic.
  const COG_RANK = { interpretation:0, clinical_reasoning:1, complex_reasoning:2, exam_trap:3 };
  const rank = it => COG_RANK[it && it.cognitive_level] || 0;
  const collides = (f,k) =>
       jac(f.ws,k.ws)>0.72                                                          // near-copy stem
    || (f.st && k.st===f.st)                                                         // identical subtopic label
    || (jac(f.ws,k.ws)>0.5 && f.sk && f.sk===k.sk && (shares(f.sw,k.sw) || shares(f.aw,k.aw)))  // similar stem, same skill, shared concept/answer
    || (f.sk && f.sk===k.sk && shares(f.aw,k.aw) && jac(f.sw,k.sw)>0.5);            // same skill + same answer + same subtopic-concept
  const kept=[], K=[]; const before=items.length;
  items.forEach(it=>{
    const f={ ws:wordSet(it.stem), st:(it.subtopic||"").toLowerCase().trim(),
              sw:wordSet(it.subtopic), aw:wordSet(it.options[it.answer]||""), sk:it.skill||"" };
    const hitIx = K.findIndex(k => collides(f,k));
    if(hitIx<0){ kept.push(it); K.push(f); }
    else if(rank(it) > rank(kept[hitIx])){ kept[hitIx]=it; K[hitIx]=f; }             // clash → the higher-value question wins
  });
  if(kept.length<before) console.log("[build-extra] qbank de-duped "+(before-kept.length)+" repeat(s) → "+kept.length+" distinct");
  if(ratDropped) console.warn("[build-extra] qbank dropped misaligned rationales on "+ratDropped+" item(s) (short array — kept the question, hid the explanations rather than risk mis-attributing them)");
  console.log("[build-extra] qbank yield raw="+before+" removed="+(before-kept.length)+" final="+kept.length);   // QB-12: one parseable line to monitor the raw→distinct collapse across builds
  return kept;
}
/* qbank: fire several small FOCUSED calls in PARALLEL, then merge + validate + dedup.
   Cuts wall-clock ~3-4x vs one big 13-15q call, AND gives a cleaner cognitive-level spread.
   Each batch owns a slice of the taxonomy, so overlap is low and the dedup mops up the rest. */
async function buildQbankBatched(tmpl, note, model, rowMax, rowTemp){
  const base = tmpl.replace(/\{\{note\}\}/g, note || "");
  const per = rowMax || 12000;   // each small batch fits comfortably (few questions + reasoning)
  // honour the prompt row's temperature here too (the single-shot path always did; this one ignored it)
  const temp = (rowTemp != null && !isNaN(Number(rowTemp))) ? Number(rowTemp) : 0.3;
  const FOCI = [
    "produce EXACTLY 3 questions, each on a DIFFERENT subtopic. Use only cognitive_level 'interpretation' (give raw labs/ECG/imaging/vitals to interpret); skills from diagnosis / investigation.",
    "produce EXACTLY 3 questions, each on a DIFFERENT subtopic. Use cognitive_level 'clinical_reasoning'; skills from diagnosis / differential.",
    "produce EXACTLY 3 questions, each on a DIFFERENT subtopic. Use cognitive_level 'clinical_reasoning'; skills from management / investigation / complications.",
    "produce EXACTLY 3 questions, each on a DIFFERENT subtopic. Use cognitive_level 'complex_reasoning' (evolving multi-step vignettes); skills from management / next_step.",
    "produce EXACTLY 3 questions on DIFFERENT subtopics. Include at least 2 'exam_trap' (set trap_type + trap_explanation) and 1 'complex_reasoning'."
  ];
  const foci = FOCI.slice(0, Math.max(2, Math.min(QBANK_BATCHES, FOCI.length)));
  const t0=Date.now();
  let failed = 0;   // a batch that dies just returns [] — without a count, a half-built q-bank looks identical to a full one in the log
  const settled = await Promise.all(foci.map((f,i) =>
    genRawItems(base + "\n\nFOR THIS BATCH: " + f, model, per, temp).catch(e => { failed++; console.warn("[build-extra] qbank batch "+(i+1)+"/"+foci.length+" failed: "+((e&&e.message)||e)); return []; })
  ));
  // QB-07: interleave the batches round-robin instead of concatenating them. The de-dup keeps the FIRST of any
  // colliding pair, and FOCI is ordered interpretation → … → complex_reasoning → exam_trap (last). A plain concat
  // therefore lets the earlier foci win every collision, so on a thin lecture the questions dropped are
  // disproportionately the complex_reasoning + exam_trap ones — exactly the highest-value levels. Round-robin gives
  // each focus an equal shot at surviving.
  const raw = [];
  { const maxLen = settled.reduce((m,s)=>Math.max(m,s.length),0);
    for(let r=0;r<maxLen;r++) for(const s of settled) if(r<s.length) raw.push(s[r]); }
  const empty = settled.filter(s=>!s.length).length;
  console.log("[build-extra] qbank "+foci.length+" parallel batches → "+raw.length+" raw items in "+(Date.now()-t0)+"ms"
    + (empty ? " ("+failed+" errored, "+empty+" of "+foci.length+" returned nothing)" : ""));
  if(!raw.length) return null;
  const items = validateQbankItems(raw);
  if(!items.length) return null;
  // QB-06: a build where a batch errored/returned nothing, or that came back thin, is NOT a complete q-bank.
  // Flag it so the caller can avoid caching it as final (a 3-question set otherwise sticks forever behind the cache).
  const partial = empty>0 || items.length<6;
  if(partial) console.warn("[build-extra] qbank PARTIAL — "+items.length+" item(s), "+empty+"/"+foci.length+" batch(es) empty; caller will not cache as complete");
  return { items, partial };
}

/* ============================ Knowledge Target layer (Phase A — SHADOW MODE) ============================
 * Observes + annotates q-bank questions with a knowledge target. It NEVER blocks or alters generation:
 * every call is best-effort, fire-and-forget, and fully guarded. With MEDBANK_TARGETS unset/"off" it is inert,
 * and disabling it yields byte-identical q-bank behaviour. The scheduler does NOT consume any of this yet (A6). */
function targetsMode(){ return String(process.env.MEDBANK_TARGETS||"off").toLowerCase(); }   // 'off' | 'shadow'
/* near-miss safety-net floor, env-configurable via AMBIGUOUS_NEAR_MISS_THRESHOLD (undefined -> module default 0.30; NOT yet calibrated) */
const TARGET_CFG = (()=>{ const v=Number(process.env.AMBIGUOUS_NEAR_MISS_THRESHOLD); return (isFinite(v)&&v>0)?{nearMiss:v}:undefined; })();
/* tiered-retrieval params, env-configurable (RETRIEVAL_FLOOR = T3 statement-overlap recall floor; RETRIEVAL_K = candidate cap) — NOT yet calibrated */
const RETRIEVAL_CFG = (()=>{ const c={}; const f=Number(process.env.RETRIEVAL_FLOOR), k=Number(process.env.RETRIEVAL_K);
  if(isFinite(f)&&f>0) c.floor=f; if(isFinite(k)&&k>0) c.K=k; return Object.keys(c).length?c:undefined; })();
/* replicate the CLIENT's qbHash EXACTLY so question_targets.qh matches the scheduler's key when A6 arrives */
function qbHashServer(str){ let h=5381,i=(str||"").length; while(i){ h=(h*33)^(str||"").charCodeAt(--i); } return (h>>>0).toString(36); }
function qhOf(q){ return qbHashServer((q.stem||"")+"|"+((q.options||[]).join("|"))); }
async function loadTargets(){ try{ const r=await admin.from("knowledge_targets").select("*").neq("status","deprecated").neq("status","merged"); return r.data||[]; }catch(e){ return []; } }
async function tExtractBatch(questions){
  try{ const gen=await generate({ model:EXTRAS_MODEL, prompt:buildExtractBatchPrompt(questions), parts:[], images:[], max_tokens:6000, temperature:0.2, json:true });
    return parseProposedBatch(gen.text||"", questions.length);
  }catch(e){ console.warn("[targets] extract batch failed:", e.message); return new Array(questions.length).fill(null); }
}
async function tReconcile(proposed, candidates){
  try{ const gen=await generate({ model:EXTRAS_MODEL, prompt:buildReconcilePrompt(proposed, candidates), parts:[], images:[], max_tokens:400, temperature:0, json:true });
    const t=gen.text||"", a=t.indexOf("{"), b=t.lastIndexOf("}"); let o={}; try{ o=JSON.parse(t.slice(a,b+1)); }catch(_){}
    return { target_id:o.target_id||null, confidence:Number(o.confidence)||0, second_id:o.second_id||null, second_confidence:Number(o.second_confidence)||0 };
  }catch(e){ console.warn("[targets] reconcile failed:", e.message); return null; }
}
/* annotate a batch of questions — idempotent (skips already-mapped qh); never throws to the caller */
async function annotateTargets(questions, ctx){
  try{
    if(targetsMode()==="off") return;
    const qs=(questions||[]).filter(q=>q&&q.stem&&Array.isArray(q.options)&&q.options.length);
    if(!qs.length) return;
    const hs=qs.map(qhOf);
    const seen=await admin.from("question_targets").select("qh").in("qh",hs);
    const done=new Set((seen.data||[]).map(r=>r.qh));
    const todo=qs.filter((q,i)=>!done.has(hs[i]));
    if(!todo.length) return;
    const proposals=await tExtractBatch(todo);
    let targets=await loadTargets();
    for(let i=0;i<todo.length;i++){
      const q=todo[i], qh=qhOf(q), proposed=proposals[i];
      if(!proposed) continue;
      const cands=retrieveCandidates(proposed, targets, RETRIEVAL_CFG);   // tiered: T1 exact ∪ T2 same-topic ∪ T3 statement-overlap
      let adj=null; if(cands.length) adj=await tReconcile(proposed, cands);
      const dec=decide(proposed, cands, adj, TARGET_CFG);
      let target_id=null;
      if(dec.state==="MATCH"){ target_id=dec.target_id; }
      else if(dec.state==="NEW"){
        const id=mintTargetId(proposed.topic, proposed.skill, targets.map(t=>t.target_id));
        const rec=newTargetRecord(proposed, id, q.difficulty||q.cognitive_level);
        const ins=await admin.from("knowledge_targets").insert(rec);
        if(!ins.error){ targets.push(rec); target_id=id; }
      }
      const candScores=cands.map(c=>({ target_id:c.target_id, tier:c._tier||null, ret:(c._retScore!=null?c._retScore:null),
        score: adj&&adj.target_id===c.target_id?adj.confidence : (adj&&adj.second_id===c.target_id?adj.second_confidence:null) }));
      const decision={ model_decision: dec.model_decision||null, nearest_candidate_id: dec.nearest_candidate_id||null,
        nearest_candidate_score: (dec.nearest_candidate_score!=null?dec.nearest_candidate_score:null),
        near_miss: !!dec.near_miss, matched_via: dec.matched_via||null, final_state: dec.state, note: dec.note||null };
      await admin.from("question_targets").upsert({ qh, target_id, map_state:dec.state, map_confidence:dec.confidence,
        proposed, candidates:candScores, decision, mapping_source:"ai", mapping_status:"active", topic_id:(ctx&&ctx.topic_id)||null, account_id:(ctx&&ctx.account_id)||null,
        updated_at:new Date().toISOString() }, { onConflict:"qh" });
    }
    console.log("[targets] annotated "+todo.length+" question(s)"+(ctx&&ctx.topic_id?" (topic "+ctx.topic_id+")":""));
    if(ctx&&ctx.topic_id) await stampTargetIds(ctx.topic_id);   // A6: propagate resolved target_ids onto extras.qbank for the client scheduler
  }catch(e){ console.warn("[targets] annotate failed (non-blocking):", e.message); }
}


/* A6: project the AUTHORITATIVE Target mappings from question_targets onto each question in a topic's extras.qbank,
   so the offline client scheduler can key retention by target_id. Authoritative = MATCH (ai) OR any human
   resolution (human NEW / human-resolved). ai-NEW and AMBIGUOUS/unresolved are deliberately NOT stamped
   (structurally excluded from Target scheduling). Idempotent + self-correcting: a superseded/removed mapping
   strips a stale target_id. Never touches question_targets — read-only projection. */
async function stampTargetIds(topic_id){
  const acc={ stamped:0, already:0, ambiguous:0, aiNew:0, unmapped:0, stripped:0, ambiguousReceivedId:0, total:0, changed:false };
  try{
    if(!topic_id) return acc;
    const t=await admin.from("topics").select("id,extras").eq("id",topic_id).maybeSingle();
    if(!t.data||!t.data.extras||!Array.isArray(t.data.extras.qbank)) return acc;
    const qs=t.data.extras.qbank, hs=qs.map(qhOf); acc.total=qs.length;
    const qt=await admin.from("question_targets").select("qh,target_id,map_state,mapping_source,mapping_status").in("qh",hs);
    const rowByQh={};
    (qt.data||[]).forEach(r=>{ if(r.mapping_status && r.mapping_status!=="active") return; rowByQh[r.qh]=r; });
    const isAuth=(r)=> !!(r && r.target_id && (r.map_state==="MATCH" || r.mapping_source==="human"));
    qs.forEach((q,i)=>{
      const r=rowByQh[hs[i]], want = isAuth(r) ? r.target_id : null;
      if(want){                                                       // AUTHORITATIVE mapping (MATCH ai OR any human resolution)
        if(q.target_id===want) acc.already++;
        else { q.target_id=want; acc.stamped++; acc.changed=true; }
      } else {                                                        // NOT authoritative → must NOT carry a target_id
        if(!r) acc.unmapped++;
        else if(r.map_state==="AMBIGUOUS") acc.ambiguous++;           // AMBIGUOUS/unresolved: deliberately skipped
        else if(r.map_state==="NEW") acc.aiNew++;                     // ai-NEW: structurally excluded per A6 spec
        if(q.target_id!=null){ delete q.target_id; acc.stripped++; acc.changed=true; }   // self-correct any stale id
      }
    });
    // INVARIANT audit: after stamping, no AMBIGUOUS/unresolved question may hold a target_id (must be 0)
    qs.forEach((q,i)=>{ const r=rowByQh[hs[i]]; if(q.target_id!=null && !isAuth(r)) acc.ambiguousReceivedId++; });
    if(acc.changed) await admin.from("topics").update({ extras:t.data.extras }).eq("id",topic_id);
    return acc;
  }catch(e){ console.warn("[targets] stamp failed (non-blocking):", e.message); acc.error=e.message; return acc; }
}

/* ============================================================================
 * A7 — Retest Pool server side (A7.3). Uses the FROZEN retestpool.mjs orchestrator
 * (same core the 39/39 harness pins) with real async deps: a real DeepSeek generator,
 * the FROZEN reconciliation pipeline as the validator, a Supabase-backed pool, and an
 * in-memory budget. NO write path to knowledge_targets or topics.extras.qbank.
 * ========================================================================== */
const A7_DAILY_MAX = Number(process.env.A7_DAILY_MAX) || 200;

/* --- Target Contract → generation prompt. Identity flows IN; the generator never infers it. --- */
function a7BuildGenPrompt(tc){
  const excl = (Array.isArray(tc.excludes)&&tc.excludes.length) ? tc.excludes.join("; ") : "(none listed)";
  const neigh = (tc._neighbors||[]).map(n=>"- "+n).join("\n") || "(none)";
  return `You are a medical education question writer. Produce ONE new single-best-answer multiple-choice question that assesses EXACTLY the knowledge target below. Answer ONLY with a JSON object, no prose.

TARGET CONTRACT (authoritative — do NOT reinterpret, broaden, or narrow it):
target_id: ${tc.target_id}
canonical claim: ${tc.canonical_statement}
scope (what IS included): ${tc.scope||tc.subtopic||tc.topic}
exclusions (explicitly OUTSIDE this target): ${excl}
topic / subtopic / skill: ${tc.topic} / ${tc.subtopic||""} / ${tc.skill||""}
difficulty: ${tc.difficulty_band||"medium"}

NEIGHBORING targets you must NOT drift into (these are DIFFERENT targets):
${neigh}

Requirements:
- test THIS canonical claim as an independently-testable single-best-answer item
- do NOT broaden the target, narrow it to a facet/subset, or test a neighboring target
- do NOT paraphrase an already-used question for this target
- exactly one unambiguously correct option; plausible distractors

Return exactly:
{ "stem":"<clinical vignette or direct question>",
  "lead_in":"<the question line, e.g. 'What is the single most appropriate next step?'>",
  "options":["<A>","<B>","<C>","<D>"],
  "answer":<0-based index of the correct option>,
  "rationales":["<why A>","<why B>","<why C>","<why D>"] }`;
}
async function a7Generate(tc){
  const gen = await generate({ model:EXTRAS_MODEL, prompt:a7BuildGenPrompt(tc), parts:[], images:[], max_tokens:1200, temperature:0.5, json:true });
  const t=(gen&&gen.text)||""; const a=t.indexOf("{"), b=t.lastIndexOf("}"); if(a<0||b<0) return null;
  let o=null; try{ o=JSON.parse(t.slice(a,b+1)); }catch(_){ return null; }
  if(!o || !o.stem || !Array.isArray(o.options)) return null;
  return { stem:String(o.stem), lead_in:String(o.lead_in||""), options:o.options.map(x=>String(x)),
           answer:Number.isInteger(o.answer)?o.answer:0, rationales:Array.isArray(o.rationales)?o.rationales:[],
           target_id:tc.target_id, source:"ai_retest" };
}

/* --- FROZEN reconciliation adapter: extract-from-ANSWERED → retrieve → decide. Returns only what A7 needs.
       Independently re-derives the target — identity is CONFIRMED here, never asserted from the prompt. --- */
async function a7Reconcile(item){
  const gen = await generate({ model:EXTRAS_MODEL, prompt:buildExtractPrompt(item), parts:[], images:[], max_tokens:500, temperature:0.2, json:true });
  const proposed = parseProposed((gen&&gen.text)||"");                       // buildExtractPrompt includes the keyed correct answer → I11
  if(!proposed) return { state:"EXTRACT_FAIL", target_id:null, confidence:0, matched_via:null, reason:"extract_null" };
  const targets = await loadTargets();
  const cands = retrieveCandidates(proposed, targets, RETRIEVAL_CFG);
  let adj=null; if(cands.length) adj = await tReconcile(proposed, cands);    // frozen V1 adjudicator
  const dec = decide(proposed, cands, adj, TARGET_CFG);                      // frozen decide()
  return { state:dec.state, target_id:dec.target_id, confidence:dec.confidence, matched_via:dec.matched_via||null, reason:dec.note||null };
}

/* --- Supabase-backed pool. Each addCandidate is an INDEPENDENT commit → crash-resilient (a mid-fill crash
       leaves prior candidates usable; the next invocation fills the remaining slots). --- */
function makeDbPool(account_id, canonicalStems){
  return {
    async candidateCount(t){ const r=await admin.from("retest_pool").select("id",{count:"exact",head:true}).eq("target_id",t).eq("status","candidate"); return r.count||0; },
    async priorStatements(t){                                               // FIX4: served canonical + served generated + unused candidate stems
      const r=await admin.from("retest_pool").select("content,status").eq("target_id",t).in("status",["served","candidate"]);
      const poolStems=(r.data||[]).map(x=>x.content&&x.content.stem).filter(Boolean);
      return (canonicalStems||[]).concat(poolStems);
    },
    async addCandidate(t,item,v){ await admin.from("retest_pool").upsert({ target_id:t, qh:qhOf(item), account_id, content:item, model:EXTRAS_MODEL, validation:Object.assign({passed:true},v), status:"candidate" }, { onConflict:"target_id,qh" }); },
    async addInvalid(t,item,v){ await admin.from("retest_pool").upsert({ target_id:t, qh:qhOf(item), account_id, content:item, model:EXTRAS_MODEL, validation:Object.assign({passed:false},v), status:"invalid" }, { onConflict:"target_id,qh" }); },
    async takeCandidate(t){
      const r=await admin.from("retest_pool").select("*").eq("target_id",t).eq("status","candidate").order("generated_at",{ascending:true}).limit(1).maybeSingle();
      if(!r.data) return null; const row=r.data;
      await admin.from("retest_pool").update({ status:"served", served_count:(row.served_count||0)+1, served_at:new Date().toISOString() }).eq("id",row.id);
      return Object.assign({ target_id:t, _qh:row.qh }, row.content);
    }
  };
}

/* --- PERSISTENT per-account generation budget: the daily ceiling is derived from retest_pool rows (each
   generation that produced output writes a row), so it survives server restarts and is scoped per account
   (A7_DAILY_MAX generations / account / day). Backoff stays in-memory — a minor optimization; on restart a
   previously-failing Target is simply retried a little sooner, which is harmless (fails toward MORE tries, not
   wrong serves). Interface matches the frozen orchestrator (canStart/canAttempt/noteAttempt/noteFailure). --- */
function startOfUtcDayISO(){ const d=new Date(); d.setUTCHours(0,0,0,0); return d.toISOString(); }
function makeDbBudget(account_id){
  const backoff={}, failn={}; const today=()=>Math.floor(Date.now()/864e5);
  return {
    async canAttempt(){ const r=await admin.from("retest_pool").select("id",{count:"exact",head:true}).eq("account_id",account_id).gte("generated_at",startOfUtcDayISO()); return (r.count||0) < A7_DAILY_MAX; },
    async canStart(t){ if((backoff[t]||-1)>=today()) return false; return await this.canAttempt(); },
    noteAttempt(){ /* daily count is derived from the rows generation creates — no separate counter to keep */ },
    noteFailure(t){ failn[t]=(failn[t]||0)+1; const n=Math.min(failn[t]-1, A7_CFG.BACKOFF_DAYS.length-1); backoff[t]=today()+A7_CFG.BACKOFF_DAYS[n]; }
  };
}
async function a7BudgetStats(account_id){
  const all=await admin.from("retest_pool").select("id",{count:"exact",head:true}).gte("generated_at",startOfUtcDayISO());
  let mine=null; if(account_id){ const r=await admin.from("retest_pool").select("id",{count:"exact",head:true}).eq("account_id",account_id).gte("generated_at",startOfUtcDayISO()); mine=r.count||0; }
  return { generatedToday_allAccounts:all.count||0, generatedToday_thisAccount:mine, dailyMaxPerAccount:A7_DAILY_MAX };
}

async function a7LoadContract(target_id){
  const r=await admin.from("knowledge_targets").select("*").eq("target_id",target_id).maybeSingle();
  if(!r.data) return null; const t=r.data;
  const nb=await admin.from("knowledge_targets").select("canonical_statement").eq("topic",t.topic).neq("target_id",target_id).limit(6);
  return Object.assign({}, t, { _neighbors:(nb.data||[]).map(x=>x.canonical_statement).filter(Boolean) });
}
async function a7CanonicalStems(target_id){
  try{
    const qt=await admin.from("question_targets").select("topic_id").eq("target_id",target_id);
    const tids=[...new Set((qt.data||[]).map(r=>r.topic_id).filter(Boolean))];
    if(!tids.length) return [];
    const tp=await admin.from("topics").select("extras").in("id",tids);
    const out=[]; (tp.data||[]).forEach(t=>{ ((t.extras&&t.extras.qbank)||[]).forEach(q=>{ if(q&&q.target_id===target_id && q.stem) out.push(q.stem); }); });
    return out;
  }catch(e){ return []; }
}
async function a7ReplenishTarget(target_id, account_id, want){
  const tc=await a7LoadContract(target_id); if(!tc) return { error:"unknown target" };
  const canonStems=await a7CanonicalStems(target_id);                       // FIX4: don't let a retest duplicate an existing canonical question
  const deps={ targetContract:tc, generate:a7Generate, reconcile:a7Reconcile, pool:makeDbPool(account_id, canonStems), budget:makeDbBudget(account_id), cfg:A7_CFG };
  return await replenish(target_id, deps, want);                            // want default = POOL_CAP (background fill)
}

/* --- endpoints --- */
/* NON-BLOCKING replenish trigger: fired by the client the moment it observes canonical exhaustion for a Target.
   Responds 202 immediately so the canonical learning path NEVER waits on A7 generation. */
app.post("/retest/replenish", async (req,res)=>{
  try{
    const user=await getUser(req); if(!user) return res.status(401).json({ error:"auth required" });
    const { target_id } = req.body||{};
    if(!target_id) return res.status(400).json({ error:"target_id required" });
    if(targetsMode()==="off") return res.status(200).json({ ok:true, skipped:"targets off" });
    res.status(202).json({ ok:true, queued:true, target_id });             // immediate — background does the work
    a7ReplenishTarget(target_id, user.id).then(r=>console.log("[a7] replenish "+target_id+":", JSON.stringify(r))).catch(e=>console.warn("[a7] replenish failed:", e.message));
  }catch(e){ try{ res.status(500).json({ error:e.message||"server error" }); }catch(_){} }
});

/* USER serve endpoint: return one validated retest for a due, canonically-exhausted Target.
   Fast path = a pre-validated pool candidate (instant). Slow path = lazy generate ONE (want=1). Else no_fresh.
   Marks the row served; the client adds its qh to the A6 servedQhs (retention parity is untouched). */
/* V1.6 Phase 1 — append-only telemetry ingest. Non-fatal by contract: NEVER 500-loops the client, and the
   client never awaits this. If the insert fails, learning is unaffected (the client already moved on). */
app.post("/telemetry/intervention", async (req,res)=>{
  try{
    const user=await getUser(req); if(!user) return res.status(200).json({ ok:false, skipped:"no auth" });
    const e=req.body||{};
    await admin.from("intervention_events").insert({
      account_id:user.id, target_id:e.target_id||null, qh:e.qh||null,
      event_type:e.t||e.event_type||"intervention_eligibility",
      ok:(typeof e.ok==="boolean"?e.ok:null), confidence:(e.confidence==null?null:Number(e.confidence)),
      attempt_signal:e.attempt_signal||null, standing_diagnosis:e.standing_diagnosis||null,
      ab_bucket:e.ab_bucket||null, diagnosis_version:e.diagnosis_version||null, intervention_version:e.intervention_version||null
    });
    res.json({ ok:true });
  }catch(err){ res.status(200).json({ ok:false, error:err.message||"insert failed" }); }   // 200 on purpose — telemetry is non-fatal
});
app.get("/admin/intervention/stats", async (req,res)=>{
  /* pilot cross-tab: attempt_signal × standing_diagnosis × bucket. Read-only. */
  try{
    if(!await requireAdmin(req)) return res.status(403).json({ error:"admins only" });
    const r=await admin.from("intervention_events").select("attempt_signal,standing_diagnosis,ab_bucket,ok,confidence").limit(50000);
    const rows=r.data||[];
    const bump=(o,k)=>{ o[k]=(o[k]||0)+1; };
    const bySignal={}, byStanding={}, byBucket={}, signalXstanding={};
    rows.forEach(x=>{ bump(bySignal,x.attempt_signal||"?"); bump(byStanding,x.standing_diagnosis||"none"); bump(byBucket,x.ab_bucket||"?");
      bump(signalXstanding,(x.attempt_signal||"?")+" → "+(x.standing_diagnosis||"none")); });
    res.json({ ok:true, total:rows.length, bySignal, byStanding, byBucket, signalXstanding });
  }catch(e){ res.status(500).json({ error:e.message||"server error" }); }
});

app.post("/retest/serve", async (req,res)=>{
  try{
    const user=await getUser(req); if(!user) return res.status(401).json({ error:"auth required" });
    const { target_id } = req.body||{};
    if(!target_id) return res.status(400).json({ error:"target_id required" });
    if(targetsMode()==="off") return res.status(200).json({ ok:true, noFresh:true, skipped:"targets off" });
    const pool=makeDbPool(user.id);
    let taken=await pool.takeCandidate(target_id);                          // pre-validated candidate → instant
    if(!taken){ await a7ReplenishTarget(target_id, user.id, 1); taken=await pool.takeCandidate(target_id); }  // lazy fallback: want=1
    if(!taken) return res.status(200).json({ ok:true, noFresh:true });
    res.json({ ok:true, item:taken, qh:taken._qh });
  }catch(e){ res.status(500).json({ error:e.message||"server error" }); }
});

app.get("/admin/retest/pool", async (req,res)=>{
  try{ if(!await requireAdmin(req)) return res.status(403).json({ error:"admins only" });
    let q=admin.from("retest_pool").select("target_id,qh,status,validation,served_count,generated_at,served_at,model,content").order("generated_at",{ascending:false}).limit(200);
    if(req.query.target_id) q=q.eq("target_id",req.query.target_id);
    const r=await q;
    res.json({ ok:true, items:(r.data||[]).map(x=>({ target_id:x.target_id, qh:x.qh, status:x.status,
      generated_at:x.generated_at, served_at:x.served_at||null, model:x.model||null,
      validation_state:(x.validation&&x.validation.passed)?"passed":"failed",
      reconciled_to:x.validation&&x.validation.reconciled_to, confidence:x.validation&&x.validation.confidence,
      matched_via:x.validation&&x.validation.matched_via, reason:x.validation&&x.validation.reason,
      served_count:x.served_count, stem:((x.content&&x.content.stem)||"").slice(0,140) })) });
  }catch(e){ res.status(500).json({ error:e.message||"server error" }); }
});

app.post("/admin/retest/quarantine", async (req,res)=>{
  /* Withhold a served/candidate retest that was later found bad → status='quarantined' (never served again;
     never canonical). Reversible by flipping status back. */
  try{
    if(!await requireAdmin(req)) return res.status(403).json({ error:"admins only" });
    const { qh, target_id } = req.body||{};
    if(!qh) return res.status(400).json({ error:"qh required" });
    let q=admin.from("retest_pool").update({ status:"quarantined" }).eq("qh",qh);
    if(target_id) q=q.eq("target_id",target_id);
    const r=await q;
    res.json({ ok:!r.error, quarantined:qh });
  }catch(e){ res.status(500).json({ error:e.message||"server error" }); }
});
app.post("/admin/retest/reset", async (req,res)=>{
  /* SHADOW-TEST cleanup: delete retest_pool rows for ONE target_id (or all if reset_all=true). Never touches
     knowledge_targets or topics.extras.qbank. Admin-only. Used to restore state after A7.5. */
  try{
    if(!await requireAdmin(req)) return res.status(403).json({ error:"admins only" });
    const { target_id, reset_all } = req.body||{};
    if(!target_id && !reset_all) return res.status(400).json({ error:"target_id or reset_all required" });
    let q=admin.from("retest_pool").delete();
    q = reset_all ? q.neq("target_id","") : q.eq("target_id",target_id);
    const r=await q;
    res.json({ ok:true, cleared:!r.error, scope: reset_all?"all":target_id });
  }catch(e){ res.status(500).json({ error:e.message||"server error" }); }
});
app.get("/admin/retest/stats", async (req,res)=>{
  try{ if(!await requireAdmin(req)) return res.status(403).json({ error:"admins only" });
    const r=await admin.from("retest_pool").select("target_id,status,validation");
    const rows=r.data||[]; const by=s=>rows.filter(x=>x.status===s).length;
    const reasons={}; rows.filter(x=>x.status==="invalid").forEach(x=>{ const k=(x.validation&&x.validation.reason)||"?"; reasons[k]=(reasons[k]||0)+1; });
    res.json({ ok:true, total:rows.length, candidate:by("candidate"), served:by("served"), invalid:by("invalid"),
      quarantined:by("quarantined"), expired:by("expired"), invalidReasons:reasons, budget: await a7BudgetStats() });
  }catch(e){ res.status(500).json({ error:e.message||"server error" }); }
});

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

SOUND LIKE A CONVERSATION (the most important rule):
- VARY LINE LENGTH SHARPLY. Some lines are ONE word or a 3-word reaction ("right", "wait — okay", "oh, interesting"); some are 2-3 sentences. NEVER make consecutive lines a similar length — uneven rhythm is what makes it human.
- REACTIONS ARE THEIR OWN LINES. Before a host answers or continues, the other often reacts first ("right", "exactly", "hang on", "okay so —", "yeah", "and that's the scary part"). Give these their own short line.
- INTERRUPT AND COMPLETE EACH OTHER. A host may cut in ("wait — before that…"), finish the other's thought, or answer a half-asked question. Not every line is a complete standalone sentence; a line may trail off with "…" for the other to pick up.
- BUILD ON THE LAST LINE. Every line must clearly RESPOND to the one before it — open with a connector when natural ("so", "and", "okay but", "right, which means…"). A line must never sound like it started from a cold, blank slate.
- LIGHT, SPARING DISFLUENCY. Occasional natural openers ("so", "okay", "here's the thing", "honestly") — but keep it clean; this is exam content. No rambling, no fake laughter, no small talk.
- Never pack more than 2 concepts into one line — split dense material across several short exchanges. Write to be SPOKEN: contractions, natural rhythm, never bookish.

STRUCTURE (follow this order):
1. HOOK (2-3 lines): open by framing why the topic matters — its clinical stakes (how common, how it's tested, what goes wrong if missed) — BEFORE any detail. Make them want to keep listening. Never cold-open into facts.
2. SIGNPOSTED BODY: group content into clear sections (by system, cause, or stage). Begin each section with a short spoken transition that names it ("that's the cardiovascular side — now the renal changes"). For EVERY key fact or number, add one sentence of WHY — the mechanism or the clinical consequence. Never leave a bare statistic unexplained. After each major section, add one quick clinical application or exam-trap callout ("a creatinine of 0.8 in pregnancy is a red flag").
3. RECAP as ACTIVE RECALL (final 2-3 lines): pose quick self-test questions and answer them ("what's a normal haemoglobin in pregnancy? Around 10.5 to 11"), not a passive summary.

CHAPTERS: tag EVERY line with a short Title Case "section" label (e.g. "Overview", "Cardiovascular", "Renal", "Clinical pearls", "Recap"). Consecutive lines share the label; the first line of a new section starts a chapter.

SOURCE ANCHOR: include "src" — a SHORT verbatim quote (6-12 words) copied EXACTLY (same words and casing) from the note — for every line that TEACHES a fact, so the app can scroll the note to that spot as the line plays. For a pure reaction/banter line with no factual content, set "src" to "" (empty) — do NOT invent a quote for a reaction.

ACCURACY & SAFETY: base everything strictly on the note — do not invent figures, drugs, or guidelines. Keep numbers, ranges, and units EXACTLY as in the note. Prioritise high-yield, exam-relevant facts.

NEVER emit an empty or placeholder "text" — every line must contain real spoken words (empty segments break audio generation). No stage directions, sound effects, or bracketed notes inside the spoken text. The only allowed non-word is a trailing "…" handing a thought to the other host.

SELF-CHECK silently before returning: line lengths are clearly UNEVEN (several 1-6 word reaction lines); lines respond to each other (connectors, hand-offs) rather than standing alone; every number has a "why it matters"; there is a hook, signposted sections with spoken transitions, and an active-recall recap; it reads as ONE conversation, not two monologues. If any line could stand alone as its own paragraph, rewrite it to connect.

Return ONLY valid JSON: {"lines":[{"speaker":"A"|"B","text":"one spoken line","section":"Section label","src":"verbatim note quote or empty"}]}.

LECTURE NOTE:
{{note}}`;
const PODCAST_LEN = {
  deep:  'LENGTH & PACING (critical): target a spoken runtime of 7-9 minutes. Aim for roughly 12-16 substantive TEACHING exchanges, PLUS plenty of short reaction/hand-off lines between them — so the final script is often 35-50 lines of very UNEVEN length (many are 1-6 words). Do NOT pad with bare facts; depth, "why", and natural back-and-forth matter more than covering everything fast. If it runs short, add explanation, reactions, and follow-up questions — not more standalone statements.',
  quick: 'LENGTH & PACING: a tight ~3-minute review — roughly 7-9 teaching exchanges plus short reactions between them (often 16-24 lines of uneven length). Hit only the highest-yield points and exam essentials; keep the hook and the active-recall recap, but trim to the single most important exam-trap. Still make it feel like a real conversation, not a fact list.'
};
async function podcastScript(level, note, model, mode){
  const row = await loadPromptFor("podcast", level);
  const tmpl = (row && row.template) || PODCAST_PROMPT;
  const levelLabel = level ? ("a Year/Level "+level+" medical student") : "medical students";
  const lenText = PODCAST_LEN[mode==="quick" ? "quick" : "deep"];
  const prompt = tmpl.replace(/\{\{note\}\}/g, note || "").replace(/\{\{level\}\}/g, levelLabel).replace(/\{\{length\}\}/g, lenText);
  const maxTok = (row&&row.max_tokens) || (mode==="quick" ? 3500 : 7000);   // more lines now (uneven, reaction-heavy)
  const gen = await generate({ model:(row&&row.model)||model, prompt, parts:[], images:[], max_tokens:maxTok, temperature:Number(row&&row.temperature)||0.7 });   // looser speech
  const t=gen.text||"", s=t.indexOf("{"), e=t.lastIndexOf("}");
  try{ const o=JSON.parse(t.slice(s,e+1));
    return (o&&Array.isArray(o.lines))
      ? o.lines.filter(l=>l&&l.text&&(l.speaker==="A"||l.speaker==="B"))
               .map(l=>({ speaker:l.speaker, text:String(l.text), section:(l.section||"").toString().slice(0,40), src:(l.src||"").toString().slice(0,160) }))
      : null;
  }catch(_){ return null; }
}
/* Fish MULTI-SPEAKER: one seamless audio file for a whole section of dialogue.
   text uses <|speaker:0|> / <|speaker:1|> tags; reference_id is [voiceA, voiceB]. S2 family only. */
async function fishMultiTTS(text, refs, attempt){
  attempt = attempt || 0;
  const key = FISH_KEY; if(!key) throw new Error("FISH_API_KEY not set");
  const ctrl=new AbortController(); const to=setTimeout(()=>ctrl.abort(),60000); let r;   // a whole section is longer than one line
  try{ r = await fetch("https://api.fish.audio/v1/tts", {
    method:"POST", signal:ctrl.signal,
    headers:{ "Authorization":"Bearer "+key, "Content-Type":"application/json", "model": process.env.FISH_MODEL || "s2.1-pro" },
    body: JSON.stringify({ text, reference_id: refs, format:"mp3", prosody:{ speed: FISH_SPEED }, condition_on_previous_chunks:true }) });
  }catch(e){ clearTimeout(to); if(attempt<2){ await new Promise(s=>setTimeout(s,900*(attempt+1))); return fishMultiTTS(text,refs,attempt+1); } throw new Error("Fish multi-speaker timed out"); }
  clearTimeout(to);
  if(!r.ok){ if((r.status>=500||r.status===429)&&attempt<2){ await new Promise(s=>setTimeout(s,1000*(attempt+1))); return fishMultiTTS(text,refs,attempt+1); } const t=await r.text().catch(()=> ""); throw new Error("Fish multi-speaker failed ("+r.status+"): "+t.slice(0,160)); }
  return Buffer.from(await r.arrayBuffer());
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
  let importId = null;   // hoisted so the catch below can mark a crashed build as failed
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

    // an empty images:[] is truthy — only call it an image import when there actually are images
    const sourceKind = req.body.pdf_base64 ? "pdf"
                     : req.body.audio_base64 ? "audio"
                     : req.body.youtube_url ? "youtube"
                     : (req.body.images && req.body.images.length) ? "images" : "text";

    // --- record the import as processing ---
    const imp = await admin.from("imports").insert({ account_id, status:"processing", source_kind: sourceKind }).select("id").single();
    if(imp.error) console.warn("[import] couldn't record the import row: "+(imp.error.message||imp.error));   // was silent: every later .eq("id",undefined) update then no-op'd
    importId = (imp.data && imp.data.id) || null;

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
      + "\n\nADDITIONAL REQUIREMENT — source anchors: For EVERY primer card and EVERY recall card, also include a field \"src\": a SHORT verbatim quote (6 to 12 words) copied EXACTLY (same words and casing) from note_md that this card is based on, so the app can jump the reader to the exact spot in the built note. Prefer a distinctive sentence fragment over a heading. If you truly cannot find a matching phrase, use the nearest heading text from note_md. Keep \"src\" inside each card object alongside its other fields."
      + "\n\nADDITIONAL REQUIREMENT — option length parity (recall cards): never let the correct answer stand out by its wording. Keep all 4 options the same length, detail and grammatical register. If the correct option needs to be long or qualified, make every distractor equally long and qualified — a student must NOT be able to guess the answer because it is the longest, most specific, most hedged, or the only one with a caveat. Distractors must be plausible, and phrased in the same style as the correct option.";
    const { parts, images, transcript } = await extractContent(req.body);

    // Nothing readable came out of the source (image-only/scanned PDF, a recording that transcribed
    // to silence, captions with no text). Without this the build ran on a prompt containing no
    // lecture at all — two full model calls, then the useless "unreadable response" message.
    if(!parts.length && !images.length){
      if(importId) await admin.from("imports").update({ status:"failed", error:"no readable content" }).eq("id",importId);
      return res.status(400).json({ error:"We couldn't read any lecture content from what you sent. If that PDF is a scan or image-only slides, attach clear photos of the slides instead, or paste the lecture text." });
    }

    // generate → parse → validate, with ONE automatic retry (BUG-03). LLM output is stochastic, so a
    // single flaky response shouldn't hard-fail the whole build. On the retry we tell the model exactly
    // what was wrong; on final failure we return the SPECIFIC reason, not a bare "validation failed".
    let obj=null, winGen=null, lastErrs=[], lastErr="", lastDiag=null;
    for(let attempt=1; attempt<=2; attempt++){
      const fixNote = attempt>1
        ? "\n\nIMPORTANT — your previous output was rejected for: "+lastErrs.join("; ")+". Return STRICT valid JSON that fixes ALL of these. Requirements: note_md and simplified_md must each be at least 200 characters; include a primer deck and a recall deck; EVERY recall card must have exactly 4 items in \"opts\", an integer \"ans\" between 0 and 3, and an answer note \"a\"; every primer card must have q, lecturer, explain and tie."
        : "";
      // json:true forces response_format=json_object, which suppresses the chain-of-thought
      // preamble a reasoning model (e.g. deepseek-v4-pro on the premium tier) otherwise emits —
      // the exact cause of the "unreadable response" 502 (reasoning prose, never parseable JSON,
      // 400s of it across two attempts). extractJsonObject is the belt-and-braces net for anything
      // that still slips a fence or a stray sentence around the JSON.
      const gen = await generate({ model, prompt: prompt + fixNote, parts, images, max_tokens: pt.data.max_tokens || 16000, temperature: attempt>1 ? 0.35 : (Number(pt.data.temperature) || 0.3), json:true });
      const rawTxt = gen.text || "";
      lastDiag = { model: gen.model_used, finish_reason: gen.finish_reason, json_mode: gen.json_mode,
                   from_reasoning: gen.from_reasoning, out_tokens: (gen.usage||{}).output_tokens,
                   raw_len: rawTxt.length, head: rawTxt.slice(0,180), tail: rawTxt.slice(-120) };
      console.warn("[import] attempt "+attempt+" diag:", JSON.stringify(lastDiag));
      const cand = extractJsonObject(rawTxt);
      if(!cand){ lastErr="bad json"; lastErrs=["the AI returned an unreadable (non-JSON) response"]; continue; }
      const errs = validateObj(cand);
      if(!errs.length){ obj=cand; winGen=gen; break; }
      lastErr=errs.join("; "); lastErrs=errs;
    }
    if(!obj){
      await admin.from("imports").update({ status:"failed", error:lastErr||"validation failed" }).eq("id",importId);
      const friendly = lastErr==="bad json"
        ? "The AI returned an unreadable response. Please try building again."
        : "Couldn't build a complete study set from this input ("+(lastErrs[0]||"missing content")+"). Try adding a little more detail to the lecture, then rebuild.";
      return res.status(502).json({ error:friendly, details:lastErrs, diag:lastDiag });
    }

    // --- save the topic + cards ---
    const topicRow = {
      course_id, account_id, title:topicName, lecturer:lecturer||null, status:"ready",
      source_kind: sourceKind,
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
    const wantBuilds = Array.isArray(req.body.builds) ? req.body.builds.filter(b=>b==="qbank"||b==="written") : [];
    if(wantBuilds.length){
      const extras={};
      for(const kind of wantBuilds){
        try{ const r = await buildExtra(kind, level, obj.note_md, model);
          if(r && r.items && r.items.length && !r.partial) extras[kind]=r.items;                                    // QB-06: only cache a COMPLETE build
          else if(r && r.partial) console.warn("[import] extra '"+kind+"' partial ("+r.items.length+" item(s)) — not caching; first open will rebuild (topic "+topicId+")");
          else console.warn("[import] extra '"+kind+"' produced no items (topic "+topicId+")"); }
        catch(e){ console.warn("[import] extra '"+kind+"' failed (topic "+topicId+"): "+((e&&e.message)||e)); }   // was swallowed silently
      }
      if(Object.keys(extras).length){ await admin.from("topics").update({ extras }).eq("id",topicId); }   // needs a jsonb "extras" column; ignored if absent
      if(extras.qbank && targetsMode()!=="off") annotateTargets(extras.qbank, { topic_id:topicId, account_id }).catch(()=>{});   // shadow-mode annotation
    }

    // --- meter usage ---
    const usage = (winGen && winGen.usage) || {};
    await admin.from("imports").update({ status:"done", topic_id:topicId, model, input_tokens:usage.input_tokens||null, output_tokens:usage.output_tokens||null }).eq("id",importId);
    await admin.rpc("bump_ai_usage", { p_account:account_id, p_feature:"import", p_tokens:(usage.output_tokens||0) });

    harvestFromNote(obj.note_md);   // fire-and-forget: learn new medical pronunciations from this lecture
    res.json({ ok:true, topic_id:topicId, primer:obj.primer.cards.length, recall:obj.recall.cards.length });
  }catch(e){
    console.error(e);
    // without this the row sat at status:"processing" forever whenever the build threw
    // (transcription error, card insert rejected, model call died) — it only ever reached
    // "failed" on the validation path.
    if(importId){ try{ await admin.from("imports").update({ status:"failed", error:String((e&&e.message)||e).slice(0,400) }).eq("id",importId); }catch(_){} }
    res.status(500).json({ error:(e&&e.message)||"server error" });
  }
});

/* Build one optional extra (fill_blank / written) on demand for an existing topic,
 * then cache it on the topic. Used the first time a student opens the mode on a
 * lecture that wasn't built with it. */
app.post("/build-extra", async (req,res)=>{
  try{
    const user = await getUser(req); if(!user) return res.status(401).json({ error:"not signed in" });
    const account_id = user.id;
    const { topic_id, kind } = req.body;
    if(!topic_id || (kind!=="written" && kind!=="qbank")) return res.status(400).json({ error:"bad request" });
    // open to any signed-in student — runs on their own built lecture
    const t = await admin.from("topics").select("id,account_id,note_md,extras").eq("id",topic_id).maybeSingle();
    if(!t.data) return res.status(404).json({ error:"topic not found" });
    if(t.data.account_id !== account_id) return res.status(403).json({ error:"not your topic" });
    const have = (t.data.extras && t.data.extras[kind]) || null;
    if(have && have.length && !req.body.force) return res.json({ ok:true, items:have });   // already built → return cached (unless a rebuild was requested)
    // a topic with no note (e.g. a build that saved the row but never produced note_md) would otherwise be
    // sent to the model as an EMPTY lecture — 5 paid calls that either fail or invent questions from nothing
    if(!String(t.data.note_md||"").trim()) return res.status(422).json({ error:"no_note", reason:"This lecture has no note to build questions from — rebuild the lecture first." });
    const level = Number(req.body.level) || null;
    // in-app extras use EXTRAS_MODEL (defaults to Flash; can be pointed at a faster non-reasoning model)
    const model = EXTRAS_MODEL;
    const _t0 = Date.now();
    console.log("[build-extra] start topic="+topic_id+" kind="+kind+" model="+model+" force="+(!!req.body.force));
    const r = await buildExtra(kind, level, t.data.note_md, model);
    console.log("[build-extra] done topic="+topic_id+" kind="+kind+" items="+((r&&r.items&&r.items.length)||0)+(r&&r.partial?" (PARTIAL)":"")+" in "+(Date.now()-_t0)+"ms");
    if(!r || !r.items || !r.items.length) return res.status(502).json({ error:"couldn't build this — try again" });
    if(kind==="qbank" && targetsMode()!=="off") annotateTargets(r.items, { topic_id, account_id }).catch(()=>{});   // shadow-mode: annotate, never block
    if(r.partial){
      // QB-06: a partial build must not be cached as complete (it would stick behind the cache forever). Hand it back
      // for this session so the student can use what built, and flag it so the client can offer a one-tap rebuild.
      return res.json({ ok:true, items:r.items, partial:true });
    }
    const extras = Object.assign({}, t.data.extras||{}, { [kind]: r.items });
    await admin.from("topics").update({ extras }).eq("id",topic_id);   // ignored if extras column absent
    res.json({ ok:true, items:r.items });
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
    // a topic with no note would otherwise be sent to the model as an EMPTY lecture — a paid call that
    // either fails ("try again" forever) or invents a podcast from nothing. Same guard as /build-extra.
    if(!String(t.data.note_md||"").trim()) return res.status(422).json({ error:"no_note", reason:"This lecture has no note to build a podcast from — rebuild the lecture first." });
    const level = Number(req.body.level) || null;
    const model = await resolveModel(user.id, level);
    const lines = await podcastScript(level, t.data.note_md, model, mode);
    if(!lines || !lines.length) return res.status(502).json({ error:"couldn't write the script — try again" });
    scripts[mode] = lines;
    extras.podcast = Object.assign({}, extras.podcast, { scripts, script:lines });   // keep .script as the latest (back-compat)
    const _up = await admin.from("topics").update({ extras }).eq("id",topic_id);   // ignored if extras column absent
    // a silent failure here means the script is never cached: every open re-bills a full model call
    if(_up && _up.error) console.warn("[podcast] script not cached for topic "+topic_id+":", (_up.error.message||"").slice(0,140));
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
      // Both hosts resolving to the same (or no) reference id means a "two-host" episode in ONE voice.
      // Happens when FISH_API_KEY is set but no FISH_VOICE_* ids are — the client then offers OpenAI-style
      // names (nova/shimmer/…) that match nothing here. Loud in the log so it's diagnosable from /health.
      if(!vA || !vB || vA===vB) console.warn("[podcast-audio] ⚠️ Fish host voices not distinct (A=%s B=%s, asked %s/%s) — both hosts will sound identical. Set FISH_VOICE_A / FISH_VOICE_B.", vA||"(default)", vB||"(default)", aKey||"-", bKey||"-");
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
      // normalise to the current script length — a shorter cached array would otherwise leave HOLES,
      // and Array.prototype.every() SKIPS holes, so the "all clips done" check below would wrongly pass.
      for(let k=0;k<script.length;k++){ if(rarr[k]===undefined) rarr[k]=null; }
      rarr.length = script.length;
      rarr[ri] = rurl; extras.podcast.audio = Object.assign({}, extras.podcast.audio||{}, { [combo]: rarr });
      await admin.from("topics").update({ extras }).eq("id", topic_id);
      return res.json({ ok:true, index:ri, url:rurl });
    }
    // ===== SEAMLESS (multi-speaker) path — one continuous Fish file per section (chapter). =====
    // Only for Fish (premium). Each section that succeeds is one natural, gapless clip; a section
    // that fails drops back to per-line clips, so the episode ALWAYS completes (never breaks).
    if(req.body.seamless === true && provider === "fish"){
      const seamKey = "seam_"+combo;
      const prevSegs = (extras.podcast.seg && extras.podcast.seg[seamKey]) || [];
      // contiguous section groups
      const groups=[]; { let cur=null; for(let i=0;i<script.length;i++){ const sec=((script[i].section||"").trim())||"_"; if(!cur||cur.section!==sec){ cur={section:sec, from:i, to:i}; groups.push(cur); } else cur.to=i; } }
      // Split any section that's too long into safe sub-chunks so ONE multi-speaker call never exceeds
      // Fish's per-generation character limit (the #1 cause of a chapter failing). Each sub-chunk is
      // still seamless internally; only very long chapters ever split.
      const SEAM_CAP = 1600;
      const chunks=[];
      for(const g of groups){ let s=g.from, len=0;
        for(let i=g.from;i<=g.to;i++){ const L=String(script[i].text||"").length+16;
          if(len>0 && len+L>SEAM_CAP){ chunks.push({from:s, to:i-1, section:g.section}); s=i; len=0; }
          len+=L; }
        chunks.push({from:s, to:g.to, section:g.section});
      }
      const have = {}; prevSegs.forEach(s=>{ have[s.from+"_"+s.to]=s; });
      const DL = Date.now()+40000;
      const segs = [];
      for(const g of chunks){
        if(Date.now()>DL) break;
        const gkey=g.from+"_"+g.to;
        if(have[gkey]){ segs.push(have[gkey]); continue; }              // resume: already done
        let done=false;
        try{
          let tagged=""; for(let i=g.from;i<=g.to;i++){ const idx=script[i].speaker==="A"?0:1; tagged+="<|speaker:"+idx+"|>"+String(script[i].text).trim()+" "; }
          const buf = await fishMultiTTS(tagged.trim(), [vA, vB]);
          if(buf && buf.length>=1200){ const u=await uploadPodcastAudio("t/"+topic_id+"/"+seamKey+"/g"+gkey+".mp3", buf); segs.push({url:u, from:g.from, to:g.to, multi:true, section:g.section}); done=true; }
        }catch(e){ console.warn("[podcast] seamless section "+gkey+" failed → per-line fallback:", (e&&e.message||"").slice(0,90)); }
        if(!done){                                                       // fallback: per-line clips for this section
          for(let i=g.from;i<=g.to;i++){
            // RESUME: a per-line clip generated on an earlier pass is keyed i_i. Without this the whole
            // section was re-spoken (and re-BILLED) on every pass, and a line that failed this time round
            // dropped out of segs entirely — so coverage could go BACKWARDS and never reach done.
            if(have[i+"_"+i]){ segs.push(have[i+"_"+i]); continue; }
            try{ const vid=script[i].speaker==="A"?vA:vB; const b=await ttsClip("fish", script[i].text, vid, null, true);
              if(b&&b.length>=1200){ const u=await uploadPodcastAudio("t/"+topic_id+"/"+seamKey+"/L"+i+".mp3", b); segs.push({url:u, from:i, to:i, multi:false, section:g.section}); } }catch(e){}
          }
        }
      }
      extras.podcast.seg = Object.assign({}, extras.podcast.seg||{}, { [seamKey]: segs });
      await admin.from("topics").update({ extras }).eq("id", topic_id);
      // NOTHING generated at all (every chapter AND every per-line fallback failed) — returning ok:true with
      // an empty segment list left the student on a silent 0/N spinner for 14 client passes. Say what happened.
      if(!segs.length) return res.status(502).json({ error:"voice generation failed — the voice service didn't return any audio. Try again in a moment." });
      const covered = {}; segs.forEach(s=>{ for(let i=s.from;i<=s.to;i++) covered[i]=1; });
      const allDone = script.every((_,i)=>covered[i]);
      return res.json({ ok:true, done:allDone, segments:segs, lines:script, mode, engine:"fish" });
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
    let _made = 0, _failed = 0, _lastErr = null;   // did THIS pass actually accomplish anything?
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
          catch(err){ _lastErr = (err&&err.message)||_lastErr; if(a>=1) { console.warn("[podcast] clip "+i+" failed, will resume next pass:", (err&&err.message||"").slice(0,100)); break; } await new Promise(s=>setTimeout(s,600)); }
        }
        if(!buf){ _failed++; continue; }   // leave urls[i] null → picked up on the next resume pass
        // a throw here (e.g. the 'podcasts' bucket is missing) used to reject Promise.all and 500 the whole
        // request — discarding every paid clip this pass had already generated, on every pass.
        try{
          const url = await uploadPodcastAudio("t/"+topic_id+"/"+combo+"/"+i+".mp3", buf);
          if(url){ urls[i] = url; _made++; }   // only record the URL once the upload actually succeeded
          else { _failed++; }
        }catch(err){ _failed++; _lastErr = (err&&err.message)||_lastErr; console.warn("[podcast] upload of clip "+i+" failed:", (err&&err.message||"").slice(0,120)); }
      }
    }
    await Promise.all(Array.from({length:Math.min(CONC, script.length)}, _worker));
    // persist whatever we have (partial or complete) so the next request resumes / caching works
    extras.podcast.audio = Object.assign({}, extras.podcast.audio||{}, { [combo]:urls });
    await admin.from("topics").update({ extras }).eq("id",topic_id);
    const done = urls.every(Boolean);
    const remaining = urls.filter(u=>!u).length;
    // This pass tried clips and EVERY one failed. Returning ok:true/done:false made the client keep
    // re-requesting until it gave up with "taking longer than expected" — hiding the real cause.
    if(_made === 0 && _failed > 0 && !done)
      return res.status(502).json({ error:"voice generation failed — "+String(_lastErr||"the voice service isn't responding").slice(0,140), engine:provider });
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
    const { image_base64, media_type, text } = req.body || {};
    const q = (text||"").toString().trim().slice(0,6000);     // a pasted chapter is not a question — cap it
    if(!image_base64 && !q) return res.status(400).json({ error:"send a photo or type the question" });
    const images = image_base64 ? [{ type:"image", source:{ type:"base64", media_type:media_type||"image/jpeg", data:image_base64 } }] : [];
    const parts = q ? [{ type:"text", text:"QUESTION (typed by the student):\n"+q }] : [];
    const model = process.env.SOLVE_MODEL || "gpt-4o-mini";   // vision-capable, cheap, non-Claude (DeepSeek chat can't see images)
    /* generate() only forwards images to OpenAI and Gemini. A deepseek model — or ANY claude* model,
     * which generate() reroutes to DeepSeek — silently drops the photo and answers the prompt blind,
     * i.e. invents an answer to a question it never saw. Refuse rather than guess. */
    if(images.length && (/^deepseek/i.test(model) || /^claude/i.test(model)))
      return res.status(500).json({ error:"Solve can't read photos with the model this server is set to. Type the question out instead." });
    const gen = await generate({ model, prompt:SOLVE_PROMPT, parts, images, max_tokens:2000, temperature:0.2 });
    const answer = (gen.text||"").trim();
    /* an empty reply used to ship as ok:true + answer:"" — the client then blamed the student's photo
     * ("try a clearer photo") for what is a model/config failure, so the retry could never work. */
    if(!answer) return res.status(502).json({ error:"The tutor didn't return an answer this time. Try again in a moment." });
    res.json({ ok:true, answer });
  }catch(e){
    console.error(e);
    const m = String((e && e.message) || "server error");
    /* never hand a paying student a raw env-var name as the answer to their question */
    res.status(500).json({ error: /API_KEY not set/i.test(m) ? "Solve isn't set up on this server yet." : m });
  }
});

/* Read-aloud / voice tutor speech (returns mp3).
 * use:"tutor" → Fish Audio · anything else (read-aloud & app audio) → Kokoro.
 * ttsClip falls back to OpenAI automatically if the chosen provider isn't set up yet. */
app.post("/tts", async (req,res)=>{
  try{
    const user = await getUser(req); if(!user) return res.status(401).json({ error:"not signed in" });
    // open to any signed-in student — read-aloud on their own content
    const text = (req.body.text||"").toString().slice(0,3000); if(!text.trim()) return res.status(400).json({ error:"no text" });
    const use = req.body.use;
    const isTutor = use === "tutor";
    let provider = isTutor ? "fish" : "kokoro";
    let voice = req.body.voice || (isTutor ? (process.env.FISH_VOICE_TUTOR || FISH_VOICE_HOST_A) : KOKORO_DEFAULT.read);
    // Topic Preview audio tier: paying (premium OR basic/trial → isPremium) get Fish; free users get Kokoro.
    if(use === "preview"){
      const entitled = await isPremium(user.id, user.email).catch(()=>false);
      provider = entitled ? "fish" : "kokoro";
      // ignore any client-sent voice here — it's an OpenAI/Kokoro name and would be an invalid Fish reference id
      voice = provider === "fish" ? (process.env.FISH_VOICE_PREVIEW || FISH_VOICE_HOST_A) : KOKORO_DEFAULT.read;
    }
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
  let chain; try{ chain = chainOf(bp); }catch(_){ chain = []; }   /* QCV-02: chainOf is debug-only — must never fail a build */
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

/* A blueprint with no narrated steps cannot be played at all (the client refuses it), so it must
 * never be shipped AND never be cached — a cached stepless row is served instantly forever and the
 * student can never get a working explainer for that sentence again. */
function narratedSteps(b){
  return Array.isArray(b && b.narration_steps)
    ? b.narration_steps.filter(s => s && typeof s.narration_text === "string" && s.narration_text.trim()).length
    : 0;
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
      if(c.data && c.data.blueprint && (!c.data.blueprint.layout || LAYOUTS.has(c.data.blueprint.layout)) && narratedSteps(c.data.blueprint)>=2 && (()=>{ try{ return qcCheck(c.data.blueprint).pass; }catch(_){ return false; } })()){ const b=c.data.blueprint;   /* QCV-02: re-validate the cached blueprint (guarded) — never serve a poisoned/cyclic row */ if(!b.layout||b.layout==="scene"){ b._render=renderHints(b.template); b._defs=assetDefs((b.elements||[]).map(e=>e.type)); } return res.json({ ok:true, cached:true, blueprint:b, viz_quota:await vizQuota(user.id, user.email) }); } }catch(_){}
    // --- daily limit: only NEW builds count (cached replays above are free & unlimited) ---
    const premium = await isPremium(user.id, user.email).catch(()=>false);
    const limit = premium ? 10 : 3;
    let used = 0;
    try{
      const since = new Date(); since.setUTCHours(0,0,0,0);
      const cnt = await admin.from("viz_events").select("id",{ count:"exact", head:true }).eq("account_id",user.id).gte("created_at",since.toISOString());
      if(cnt && cnt.error) console.error("[visualize] viz_events count FAILED for %s — daily cap NOT enforced this call: %s", user.id, cnt.error.message||cnt.error);
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
    const evalBp = (b)=>{ try{ const q=qcCheck(b), g=b?graphCheck(b):{pass:false,issues:[]}; return { pass:q.pass&&g.pass, issues:[...(q.issues||[]),...(g.issues||[])], qc:q, g }; }catch(e){ return { pass:false, issues:["blueprint is malformed: "+(e&&e.message||e)], qc:{pass:false,issues:[]}, g:{pass:false,issues:[]} }; } };   /* QCV-01: a validator throw degrades to a retry, never a 500 */
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
    // a blueprint the player can't narrate is a dead blueprint — fail here rather than ship it and cache it forever
    if(narratedSteps(bp) < 2){
      console.warn("[visualize] rejected blueprint with", narratedSteps(bp), "narrated step(s)");
      return res.status(502).json({ error:"couldn't build a visualization — try selecting one clear sentence, or try again in a moment" });
    }
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
    try{ await admin.from("visualizations").upsert({ text_key:key, concept_id:(bp.meta&&bp.meta.concept_id)||key, subject, blueprint:bp, verified: !!(ev && ev.pass) }); }catch(_){}   /* QCV-02: mark whether it actually passed QC (the cache read re-validates regardless) */
    try{ await admin.from("viz_events").insert({ account_id:user.id }); }catch(_){}   // count this NEW build against the daily limit
    if(!bp.layout||bp.layout==="scene"){                   // scene-mode only: tree mode needs no zones/assets
      bp._render = renderHints(bp.template);   // manifest-derived scale slice for the engine (kept out of the cached row)
      bp._defs = assetDefs((bp.elements||[]).map(e=>e.type));   // svg specs for any data-driven (overlay-approved) assets used
    }
    try{ bp._chain = chainOf(bp); }catch(_){ bp._chain = []; }                 // the causal chain / tree traversal, in order (transparency / debugging) — QCV-02 guarded
    res.json({ ok:true, cached:false, blueprint:bp, qc_issues:ev.issues, completeness, viz_quota:{ limit, remaining:Math.max(0,limit-(used+1)), premium } });
  }catch(e){ console.error(e); res.status(500).json({ error:e.message||"server error" }); }
});

/* =====================================================================
 * TOPIC PREVIEW — the "pre-read orientation video" (SPEC-TOPIC-PREVIEW.md)
 * A 3–4 min guided visual tour of a WHOLE note: an overview MAP, one scene per
 * heading (right visual per relationship), auto-inserted CONTRAST scenes at
 * confusion zones, then a closing TAKEAWAY. Each scene is a normal Visualize
 * blueprint, so the existing renderer draws it — this endpoint only adds the
 * SEQUENCING: it plans the scenes over the note, then renders each through the
 * same proven buildVisualPrompt → generate → parseBlueprint → qcCheck path.
 * ===================================================================== */
function previewPlanPrompt(note, subject){
  return (
`You are building a 3–4 minute PRE-READ PREVIEW for a medical student — a guided mental map of an ENTIRE lecture note, shown BEFORE they read it. Its job is to give them the STRUCTURE first, in the simplest possible words, so that when they read the detailed note they are filling in a framework they have already seen — not discovering it for the first time.

Return ONLY JSON: {"title":"<topic>","scenes":[{"heading":"","beat":"map|segment|contrast|takeaway","mode":"flow|tree|table|diagram|graph","focus":""}]}.

RULES — follow every one:
- SCENE 1 is always beat "map": a single overview showing the whole topic at a glance (its major headings as one diagram/tree and the ONE core relationship that ties them together).
- Then ONE scene per MAJOR HEADING in the note, in order — beat "segment". Touch EVERY major heading; skip none. Dive into that heading's key subtopics, but only the organising principle + a few key items (this is orientation, NOT the full detail).
- Insert beat "contrast" scenes wherever the note has a commonly-confused pair or set (e.g. nephrotic vs nephritic, primary vs secondary, acute vs chronic, upper vs lower). Use mode "table". These are the "here's the difference to keep straight" beats.
- The LAST scene is beat "takeaway": the whole structure brought back together as one map (causes → mechanism → features → investigations → diagnosis → management → complications, adapted to this note).
- Pick "mode" by the RELATIONSHIP, not habit: classification/hierarchy → "tree"; process/causal chain/mechanism → "flow"; comparison → "table"; structure/anatomy/relationships → "diagram"; a distribution/curve → "graph".
- "focus" is a 1–2 sentence instruction, in PLAIN words simpler than the note, describing exactly what THAT scene should visualise and orient the student to. It must name the concrete items to show. Do NOT copy the note's technical wording — translate it down.
- Total 7–12 scenes for a normal note; fewer if the note is short. Aim ~3 minutes of narration.
- Build the model PROGRESSIVELY: each scene should connect to the previous (cause → mechanism → features → …), not feel independent.
- Base everything strictly on the note. Never invent facts, drugs, or numbers.

SUBJECT: ${subject||"Medicine"}
LECTURE NOTE:
${note}`);
}
/* render one preview scene into a blueprint via the existing engine (lean: 1 gen + 1 corrective retry, no completeness pass) */
async function renderPreviewScene(scene, subject){
  const framing = "[PREVIEW SCENE — orient a student in the SIMPLEST possible words BEFORE they read the full note. Keep narration short and high-level; teach the organising principle and how the pieces connect, NOT every detail. Prefer the "+(scene.mode||"clearest")+" visual form.] ";
  const text = framing + (scene.focus||scene.heading||"");
  const prompt = buildVisualPrompt(text, subject);
  for(let attempt=1; attempt<=2; attempt++){
    const p = attempt>1 ? (prompt+"\n\nYour previous JSON was not a valid, drawable blueprint. Return ONLY corrected JSON with a valid \"layout\" and at least 2 narration_steps.") : prompt;
    const gen = await generate({ model: BASIC_MODEL, prompt:p, parts:[], images:[], max_tokens:12000, temperature:0.2, json:true });   // generous ceiling; with reasoning_effort:none the model outputs only the blueprint and stops, so no truncation and no wasted spend
    const bp = parseBlueprint(gen.text);
    if(bp && (!bp.layout || LAYOUTS.has(bp.layout)) && narratedSteps(bp)>=2 && qcCheck(bp).pass){
      if(!bp.layout || bp.layout==="scene"){ try{ bp._render=renderHints(bp.template); bp._defs=assetDefs((bp.elements||[]).map(e=>e.type)); }catch(_){} }
      return bp;
    }
  }
  return null;
}
async function buildTopicPreview(note, subject){
  const planGen = await generate({ model: BASIC_MODEL, prompt: previewPlanPrompt(note, subject), parts:[], images:[], max_tokens:4000, temperature:0.3, json:true });   // headroom so a 12-scene plan never truncates
  const plan = extractJsonObject(planGen.text||"");
  let list = (plan && Array.isArray(plan.scenes)) ? plan.scenes.slice(0,12) : [];
  if(!list.length) return { status:"failed", scenes:[] };
  const scenes=[];
  for(const sc of list){
    try{ const bp = await renderPreviewScene(sc, subject); if(bp) scenes.push({ heading: sc.heading||"", beat: sc.beat||"segment", blueprint: bp }); }
    catch(e){ console.warn("[preview] scene failed:", (e&&e.message)||e); }
  }
  return { status: scenes.length>=3 ? "ready" : "failed", title:(plan&&plan.title)||"", scenes };
}
app.post("/topic-preview", async (req,res)=>{
  try{
    const user = await getUser(req); if(!user) return res.status(401).json({ error:"not signed in" });
    const account_id = user.id;
    const { topic_id, force } = req.body||{};
    if(!topic_id) return res.status(400).json({ error:"topic_id required" });
    const t = await admin.from("topics").select("id,account_id,title,note_md").eq("id",topic_id).maybeSingle();   // NB: topics has no "subject" column — selecting it errored the query and 404'd
    if(t.error) return res.status(500).json({ error:"topic lookup failed: "+t.error.message });   // surface a real error instead of masking it as "not found"
    if(!t.data) return res.status(404).json({ error:"topic not found" });
    if(t.data.account_id !== account_id) return res.status(403).json({ error:"not your topic" });
    // cache read is best-effort and SEPARATE, so the feature works even if the topics.preview column doesn't exist yet
    if(!force){ try{ const c = await admin.from("topics").select("preview").eq("id",topic_id).maybeSingle(); if(c.data && c.data.preview && c.data.preview.status==="ready") return res.json(c.data.preview); }catch(_){} }
    const note = String(t.data.note_md||"");
    if(note.replace(/\s+/g," ").trim().length < 400){ const skip={status:"skipped",scenes:[]}; try{ await admin.from("topics").update({ preview:skip }).eq("id",topic_id); }catch(_){}; return res.json(skip); }
    const built = await buildTopicPreview(note, t.data.title||"Medicine");   // topic title is the subject hint for the viz prompt
    try{ await admin.from("topics").update({ preview: built }).eq("id",topic_id); }catch(_){}   // needs a jsonb "preview" column; ignored if absent
    try{ await admin.rpc("bump_ai_usage", { p_account:account_id, p_feature:"preview", p_tokens:0 }); }catch(_){}
    res.json(built);
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
    out.graph_pass = g.pass; out.graph_issues = g.issues; try{ out.chain = chainOf(bp); }catch(_){ out.chain = []; }   /* QCV-02 guarded */
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

/* ---- Admin: Knowledge Target layer (Phase A) — backfill + audit (shadow mode; scheduler untouched) ---- */
app.post("/admin/targets/stamp", async (req,res)=>{
  /* A6 backfill: stamp target_id onto every topic's extras.qbank from the authoritative question_targets mappings.
     Pure projection — reconciliation already ran; this only propagates resolved ids to the client scheduler. */
  try{
    const user=await requireAdmin(req); if(!user) return res.status(403).json({ error:"admins only" });
    const limit=Math.min(2000, Number((req.body&&req.body.limit)||500));
    const tr=await admin.from("topics").select("id,extras").not("extras","is",null).limit(limit);
    const topics=(tr.data||[]).filter(t=>t.extras && Array.isArray(t.extras.qbank) && t.extras.qbank.length);
    const agg={ questionsStamped:0, alreadyStamped:0, skippedAmbiguous:0, skippedAiNew:0, skippedUnmapped:0, staleStripped:0, ambiguousReceivedId:0, questionsScanned:0 };
    let topicsDone=0, changedTopics=0;
    for(const t of topics){ const r=await stampTargetIds(t.id); topicsDone++; if(r.changed) changedTopics++;
      agg.questionsStamped+=(r.stamped||0); agg.alreadyStamped+=(r.already||0); agg.skippedAmbiguous+=(r.ambiguous||0);
      agg.skippedAiNew+=(r.aiNew||0); agg.skippedUnmapped+=(r.unmapped||0); agg.staleStripped+=(r.stripped||0);
      agg.ambiguousReceivedId+=(r.ambiguousReceivedId||0); agg.questionsScanned+=(r.total||0); }
    res.json({ ok:true, topicsScanned:topics.length, topicsChanged:changedTopics,
      invariantOk: agg.ambiguousReceivedId===0, ...agg });
  }catch(e){ res.status(500).json({ error:e.message||"server error" }); }
});
app.post("/admin/targets/backfill", async (req,res)=>{
  try{
    if(!await requireAdmin(req)) return res.status(403).json({ error:"admins only" });
    if(targetsMode()==="off") return res.status(409).json({ error:"MEDBANK_TARGETS is off — set it to 'shadow' to enable annotation" });
    const limit=Math.min(100, Number(req.body&&req.body.limitTopics)||30);
    const tr=await admin.from("topics").select("id,account_id,extras").not("extras","is",null).limit(limit);
    const topics=(tr.data||[]).filter(t=>t.extras && Array.isArray(t.extras.qbank) && t.extras.qbank.length);
    let processed=0, topicsDone=0;
    for(const t of topics){ await annotateTargets(t.extras.qbank, { topic_id:t.id, account_id:t.account_id }); processed+=t.extras.qbank.length; topicsDone++; }
    res.json({ ok:true, topicsScanned:topics.length, topicsDone, questionsSeen:processed, note:"idempotent — already-mapped questions were skipped" });
  }catch(e){ res.status(500).json({ error:e.message||"server error" }); }
});
app.get("/admin/targets/stats", async (req,res)=>{
  try{
    if(!await requireAdmin(req)) return res.status(403).json({ error:"admins only" });
    const qt=await admin.from("question_targets").select("qh,target_id,map_state,map_confidence,resolution,candidates,decision");
    const rows=qt.data||[];
    const kt=await admin.from("knowledge_targets").select("target_id,status");
    const targets=kt.data||[];
    const n=rows.length, by=s=>rows.filter(r=>r.map_state===s).length, pct=x=>n?Math.round(x/n*100):0;
    const resolved=rows.filter(r=>r.resolution).length;
    const unresolvedAmb=rows.filter(r=>r.map_state==="AMBIGUOUS" && !r.resolution).length;
    const perT={}; rows.forEach(r=>{ const id=(r.resolution&&r.resolution.target_id)||r.target_id; if(id) perT[id]=(perT[id]||0)+1; });
    const counts=Object.keys(perT).map(id=>({ target_id:id, count:perT[id] })).sort((a,b)=>b.count-a.count);
    const dist={ "lt45":0, "45to80":0, "gte80":0 };
    rows.forEach(r=>{ const c=r.map_confidence||0; if(c<0.45)dist.lt45++; else if(c<0.80)dist["45to80"]++; else dist.gte80++; });
    const newWithCandidate=rows.filter(r=>r.map_state==="NEW" && Array.isArray(r.candidates) && r.candidates.length>0).length;
    const ambiguousFromNearMiss=rows.filter(r=>r.map_state==="AMBIGUOUS" && r.decision && r.decision.near_miss).length;
    const confirmedMatch=rows.filter(r=>r.resolution && r.resolution.action==="match").length;
    const confirmedNew=rows.filter(r=>r.resolution && r.resolution.action==="new").length;
    const keptAmbiguous=rows.filter(r=>r.resolution && r.resolution.action==="keep").length;
    const viaCount=(st)=>{ const o={T1:0,T2:0,T3:0,none:0}; rows.filter(r=>r.map_state===st).forEach(r=>{ const v=(r.decision&&r.decision.matched_via)||"none"; o[v]=(o[v]||0)+1; }); return o; };
    const matchedViaMatch=viaCount("MATCH"), matchedViaAmbiguous=viaCount("AMBIGUOUS");
    res.json({ ok:true, processed:n, match:by("MATCH"), new:by("NEW"), ambiguous:by("AMBIGUOUS"),
      matchPct:pct(by("MATCH")), newPct:pct(by("NEW")), ambiguousPct:pct(by("AMBIGUOUS")),
      resolved, unresolvedAmbiguous:unresolvedAmb, targetsCreated:targets.length,
      newWithCandidate, ambiguousFromNearMiss, confirmedMatch, confirmedNew, keptAmbiguous,
      matchedViaMatch, matchedViaAmbiguous,
      questionsPerTarget:counts.slice(0,20), singletonTargets:counts.filter(x=>x.count===1).length,
      heavyTargets:counts.filter(x=>x.count>=8), confidenceDistribution:dist });
  }catch(e){ res.status(500).json({ error:e.message||"server error" }); }
});
app.get("/admin/targets/ambiguous", async (req,res)=>{
  try{
    if(!await requireAdmin(req)) return res.status(403).json({ error:"admins only" });
    const r=await admin.from("question_targets").select("*").eq("map_state","AMBIGUOUS").is("resolution",null).limit(50);
    const rows=r.data||[];
    const ids=[...new Set(rows.flatMap(x=>(x.candidates||[]).map(c=>c.target_id)).filter(Boolean))];
    const tr= ids.length ? await admin.from("knowledge_targets").select("*").in("target_id",ids) : { data:[] };
    const tmap={}; (tr.data||[]).forEach(t=>{ tmap[t.target_id]=t; });
    res.json({ ok:true, items: rows.map(x=>({ qh:x.qh, proposed:x.proposed, confidence:x.map_confidence, decision:x.decision||null,
      candidates:(x.candidates||[]).map(c=>({ target_id:c.target_id, score:c.score, target:tmap[c.target_id]||null })) })) });
  }catch(e){ res.status(500).json({ error:e.message||"server error" }); }
});
app.post("/admin/targets/resolve", async (req,res)=>{
  try{
    const user=await requireAdmin(req); if(!user) return res.status(403).json({ error:"admins only" });
    const { qh, action, target_id } = req.body||{};   // action: 'match' | 'new' | 'keep'
    if(!qh || !action) return res.status(400).json({ error:"qh and action required" });
    const cur=await admin.from("question_targets").select("*").eq("qh",qh).maybeSingle();
    if(!cur.data) return res.status(404).json({ error:"mapping not found" });
    let finalId=null;
    if(action==="match"){ if(!target_id) return res.status(400).json({ error:"target_id required for match" }); finalId=target_id; }
    else if(action==="new"){
      const p=cur.data.proposed||{}; const targets=await loadTargets();
      const id=mintTargetId(p.topic, p.skill, targets.map(t=>t.target_id));
      const rec=newTargetRecord(p, id, "medium"); rec.source="human_defined"; rec.reviewed_by=(user.email||user.id); rec.reviewed_at=new Date().toISOString();
      const ins=await admin.from("knowledge_targets").insert(rec); if(ins.error) throw ins.error; finalId=id;
    } else if(action!=="keep"){ return res.status(400).json({ error:"action must be match | new | keep" }); }
    // record the human decision as its OWN event — map_state (the AI verdict) is preserved, never overwritten
    const resolution={ action, target_id:finalId, by:(user.email||user.id), at:new Date().toISOString(), from_state:cur.data.map_state };
    await admin.from("question_targets").update({ target_id:finalId, resolution, resolved_by:resolution.by, resolved_at:resolution.at, mapping_source:"human", mapping_status:"active", updated_at:resolution.at }).eq("qh",qh);
    let stampRes=null; if(cur.data.topic_id) stampRes=await stampTargetIds(cur.data.topic_id);   // A6: push the human-resolved target_id onto the question in extras.qbank
    res.json({ ok:true, resolution, stamped:stampRes });
  }catch(e){ res.status(500).json({ error:e.message||"server error" }); }
});

/* ---- Admin: reprocess = clear the QUESTION mappings but KEEP the (possibly human-resolved) targets, so a
   re-backfill reconciles the same corpus against the current target set. This is the STABILITY test: do questions
   return to their resolved canonical targets rather than re-flag AMBIGUOUS? Human decisions are NOT destroyed. ---- */
app.post("/admin/targets/reprocess", async (req,res)=>{
  try{
    if(!await requireAdmin(req)) return res.status(403).json({ error:"admins only" });
    const a=await admin.from("question_targets").delete().is("resolution",null);   // STICKY INVARIANT: never delete a human-resolved (authoritative) mapping
    res.json({ ok:true, clearedMappings:!a.error, keptTargets:true, keptResolved:true, note:"unresolved AI mappings cleared; resolved (human) mappings kept; now re-run /admin/targets/backfill" });
  }catch(e){ res.status(500).json({ error:e.message||"server error" }); }
});

/* ---- Admin: reset the shadow tables so a re-backfill regenerates mappings under the CURRENT policy (not a flag flip) ---- */
app.post("/admin/targets/reset", async (req,res)=>{
  try{
    if(!await requireAdmin(req)) return res.status(403).json({ error:"admins only" });
    const a=await admin.from("question_targets").delete().neq("qh","");
    const b=await admin.from("knowledge_targets").delete().neq("target_id","");
    res.json({ ok:true, cleared:{ question_targets:!a.error, knowledge_targets:!b.error }, note:"now re-run /admin/targets/backfill to regenerate under the current rule" });
  }catch(e){ res.status(500).json({ error:e.message||"server error" }); }
});

/* ---- Admin: NEW_WITH_CANDIDATE near-miss diagnostic (OBSERVABILITY ONLY — no decision change) ----
 * A question assigned NEW that nonetheless had ≥1 pre-filter candidate. This is the bucket we can't otherwise
 * see: did the target legitimately fork (correct NEW) or did the model under-score a true match (false NEW)? */
/* ---- Admin: CHURN AUDIT (read-only diagnostic). For every NEW question mapping, find its closest OTHER target by
   statement token-overlap and classify why it forked: A_new (no similar target), B_prefilter (a same-claim target
   exists but under a DIFFERENT topic/skill, so the hard pre-filter excluded it), C_matcher (a same-topic+skill
   candidate existed and the matcher still said not-same). Answers: how many of the +N duplicates are pre-filter
   exclusions? Changes NOTHING. ---- */
/* ---- Admin: adjudicator A/B eval on the hand-labeled regression set (read-only). Runs each labeled case
   through V1 and a chosen challenger prompt (?variant=v3|v2) against its real candidate list, applies decide(),
   and scores against the gates: class A must MATCH (100%), class B must NOT MATCH (0 false merges), class C must
   NOT be forced to MATCH (0). One false MATCH rejects the challenger. Writes nothing. ---- */
app.post("/admin/targets/adjudicate-eval", async (req,res)=>{
  try{
    if(!await requireAdmin(req)) return res.status(403).json({ error:"admins only" });
    const variant=(req.body&&req.body.variant)||"v3";
    const challenger = variant==="v2" ? buildReconcilePromptV2 : buildReconcilePromptV3;
    const set=JSON.parse(readFileSync(new URL("./eval/adjudicator-eval-set.json", import.meta.url), "utf8"));
    const cases=set.cases||[];
    async function run(promptFn, cse){
      const cands=cse.candidates||[];
      let adj=null;
      try{ const gen=await generate({ model:EXTRAS_MODEL, prompt:promptFn(cse.proposed, cands), parts:[], images:[], max_tokens:300, temperature:0, json:true });
        const t=gen.text||"", a=t.indexOf("{"), b=t.lastIndexOf("}"); let o={}; try{ o=JSON.parse(t.slice(a,b+1)); }catch(_){}
        adj={ target_id:o.target_id||null, confidence:Number(o.confidence)||0, second_id:o.second_id||null, second_confidence:Number(o.second_confidence)||0 };
      }catch(e){ adj=null; }
      const dec=decide(cse.proposed, cands, adj, TARGET_CFG);
      return { state:dec.state, conf:(adj?adj.confidence:0), picked:dec.target_id||null };
    }
    const items=[];
    for(const cse of cases){
      const v1=await run(buildReconcilePrompt, cse);
      const ch=await run(challenger, cse);
      items.push({ id:cse.id, class:cse.class, expect:cse.expect, v1:v1.state, v1c:v1.conf, ch:ch.state, chc:ch.conf, chPicked:ch.picked });
    }
    const score=(key)=>{
      const A=items.filter(i=>i.class==="A"), B=items.filter(i=>i.class==="B"), C=items.filter(i=>i.class==="C");
      const A_match=A.filter(i=>i[key]==="MATCH").length;
      const B_falseMatch=B.filter(i=>i[key]==="MATCH").length;
      const C_forcedMatch=C.filter(i=>i[key]==="MATCH").length;
      return { A_total:A.length, A_match, A_pass:(A_match===A.length),
               B_total:B.length, B_falseMatch, B_pass:(B_falseMatch===0),
               C_total:C.length, C_forcedMatch, C_pass:(C_forcedMatch===0),
               overall_pass:(A_match===A.length && B_falseMatch===0 && C_forcedMatch===0) };
    };
    res.json({ ok:true, variant, nCases:cases.length, v1:score("v1"), challenger:score("ch"), items });
  }catch(e){ res.status(500).json({ error:e.message||"server error" }); }
});

/* ---- Admin: list MATCH rows by retrieval tier (read-only) — the false-MATCH precision gate. Shows each match's
   proposed statement vs the matched target's canonical contract so every non-T1 (widened-recall) match can be
   inspected for genuine independently-testable equivalence. ---- */
app.get("/admin/targets/matches", async (req,res)=>{
  try{
    if(!await requireAdmin(req)) return res.status(403).json({ error:"admins only" });
    const via = req.query.via ? String(req.query.via).split(",").map(x=>x.trim()) : null;   // e.g. ?via=T2,T3
    const r=await admin.from("question_targets").select("qh,target_id,map_confidence,proposed,decision").eq("map_state","MATCH").limit(500);
    let rows=(r.data||[]).filter(x=>{ const v=(x.decision&&x.decision.matched_via)||null; return !via || via.indexOf(v)>=0; });
    const ids=[...new Set(rows.map(x=>x.target_id).filter(Boolean))];
    const tr= ids.length ? await admin.from("knowledge_targets").select("target_id,canonical_statement,topic,skill").in("target_id",ids) : { data:[] };
    const tmap={}; (tr.data||[]).forEach(t=>{ tmap[t.target_id]=t; });
    res.json({ ok:true, count:rows.length, items: rows.map(x=>({ qh:x.qh, via:(x.decision&&x.decision.matched_via)||null, conf:x.map_confidence,
      proposed:(x.proposed&&x.proposed.knowledge_statement)||null, target_id:x.target_id,
      target:(tmap[x.target_id]||{}).canonical_statement||null, target_topic:(tmap[x.target_id]||{}).topic, target_skill:(tmap[x.target_id]||{}).skill })) });
  }catch(e){ res.status(500).json({ error:e.message||"server error" }); }
});

/* User topic management — rename / delete your OWN topic. Ownership-checked; outside the frozen V1.6/A6/A7 boundaries. */
app.post("/topic/rename", async (req,res)=>{
  try{
    const user=await getUser(req); if(!user) return res.status(401).json({ error:"auth required" });
    const { topic_id, name } = req.body||{};
    if(!topic_id || !name || !String(name).trim()) return res.status(400).json({ error:"topic_id and name required" });
    const t=await admin.from("topics").select("id,account_id").eq("id",topic_id).maybeSingle();
    if(!t.data) return res.status(404).json({ error:"topic not found" });
    if(t.data.account_id && t.data.account_id!==user.id) return res.status(403).json({ error:"not your topic" });
    const up=await admin.from("topics").update({ title:String(name).trim() }).eq("id",topic_id);
    res.json({ ok:!up.error, error:(up.error&&up.error.message)||null });
  }catch(e){ res.status(500).json({ error:e.message||"server error" }); }
});
app.post("/topic/delete", async (req,res)=>{
  try{
    const user=await getUser(req); if(!user) return res.status(401).json({ error:"auth required" });
    const { topic_id } = req.body||{};
    if(!topic_id) return res.status(400).json({ error:"topic_id required" });
    const t=await admin.from("topics").select("id,account_id").eq("id",topic_id).maybeSingle();
    if(!t.data) return res.status(404).json({ error:"topic not found" });
    if(t.data.account_id && t.data.account_id!==user.id) return res.status(403).json({ error:"not your topic" });
    const del=await admin.from("topics").delete().eq("id",topic_id);
    res.json({ ok:!del.error, deleted:topic_id, error:(del.error&&del.error.message)||null });
  }catch(e){ res.status(500).json({ error:e.message||"server error" }); }
});

/* ===== V1.7 Integrated Content Pipeline (server). AI = candidate-finder + adversarial disprover; the tested
   dependency gate + a HUMAN decide. Never mutates canonical questions; only 'approved' items are ever exposed. ===== */
function a17MinePrompt(q){
  const opts=(q.options||[]).map((o,i)=>String.fromCharCode(65+i)+". "+o).join("\n");
  return `You are a medical-education content strategist. Decide if this single-best-answer question can be the seed of a GENUINE cross-domain integrated question — one where solving it REQUIRES reasoning across 2+ distinct clinical domains, not one domain with incidental mentions of another. Answer ONLY JSON.

QUESTION (topic: ${q._topic||""}, skill: ${q.skill||""}):
${q.stem||""}
${opts}
Correct: ${String.fromCharCode(65+(q.answer||0))}

Return: { "integrable": true|false,
  "primary_topic": "<owning clinical domain>",
  "integrated_topics": ["<the ADDITIONAL domain(s) genuinely required>"],
  "integration_type": "mechanistic|diagnostic|management|competing|longitudinal",
  "integration_family": "<e.g. cardio_renal>",
  "rationale": "<one sentence>",
  "dependency": "<why the secondary domain is NECESSARY to the answer>" }
Set integrable=false if the second domain is merely a symptom, comorbidity, risk factor, or vocabulary of the primary disease.`;
}
async function a17Mine(q){
  try{ const gen=await generate({ model:EXTRAS_MODEL, prompt:a17MinePrompt(q), parts:[], images:[], max_tokens:500, temperature:0.3, json:true });
    const t=(gen&&gen.text)||""; const a=t.indexOf("{"), b=t.lastIndexOf("}"); if(a<0||b<0) return null;
    let o=null; try{ o=JSON.parse(t.slice(a,b+1)); }catch(_){ return null; }
    if(!o||!o.integrable) return null;
    return { primary_topic:o.primary_topic||null, integrated_topics:o.integrated_topics||[], integration_type:o.integration_type||null,
      integration_family:o.integration_family||null, rationale:o.rationale||null, dependency:o.dependency||null, source_question_ids:[q.id||q._qh] };
  }catch(e){ return null; }
}
function a17AdvPrompt(q, p){
  return `You are an adversarial reviewer. Your job is to DISPROVE that the question below is genuinely integrated across [${p.primary_topic}] + [${(p.integrated_topics||[]).join(", ")}]. Be skeptical. Answer ONLY JSON.

QUESTION: ${q.stem||""}
Claimed integration: ${p.rationale||""} — dependency: ${p.dependency||""}

Apply the dependency test and answer:
{ "removeA_changes": <does removing the PRIMARY domain change the answer?>,
  "removeB_changes": <does removing the SECONDARY domain change the answer?>,
  "bothRequired": <are BOTH domains jointly required to solve it?>,
  "secondaryIsRealDomain": <is the secondary a real reasoning domain, NOT a symptom/comorbidity/vocabulary?>,
  "why": "<one sentence>" }
Default to false when unsure — a false positive pollutes the bank.`;
}
async function a17Adversarial(q, p){
  try{ const gen=await generate({ model:EXTRAS_MODEL, prompt:a17AdvPrompt(q,p), parts:[], images:[], max_tokens:300, temperature:0, json:true });
    const t=(gen&&gen.text)||""; const a=t.indexOf("{"), b=t.lastIndexOf("}"); if(a<0||b<0) return {};
    try{ return JSON.parse(t.slice(a,b+1)); }catch(_){ return {}; }
  }catch(e){ return {}; }
}

app.post("/admin/integrated/mine", async (req,res)=>{
  /* Run the candidate pipeline over a batch of not-yet-processed questions. Inserts ai_reviewed|rejected rows.
     NEVER touches topics.extras.qbank. Admin-only; bounded by limit (AI cost). */
  try{
    if(!await requireAdmin(req)) return res.status(403).json({ error:"admins only" });
    const limit=Math.min(50, Number((req.body&&req.body.limit)||15));
    const done=await admin.from("integrated_items").select("question_id");
    const seen=new Set((done.data||[]).map(r=>r.question_id));
    const tr=await admin.from("topics").select("id,extras").not("extras","is",null).limit(500);
    const pool=[]; (tr.data||[]).forEach(t=>{ ((t.extras&&t.extras.qbank)||[]).forEach(q=>{ if(!q||!q.stem) return;
      const qh=qhOf(q); if(seen.has(qh)) return; pool.push(Object.assign({}, q, { id:qh, _qh:qh, _topic:t.title||t.name||"" })); }); });
    const batch=pool.slice(0, limit); let ai_reviewed=0, rejected=0;
    for(const q of batch){
      const rec=await runCandidate(q, { mine:a17Mine, adversarial:a17Adversarial });
      await admin.from("integrated_items").insert({ question_id:rec.question_id||qhOf(q), primary_topic:rec.primary_topic||null,
        integrated_topics:rec.integrated_topics||[], integration_type:rec.integration_type||null, integration_family:rec.integration_family||null,
        integration_rationale:rec.integration_rationale||null, integration_dependency:rec.integration_dependency||null,
        transformed_content:rec.transformed_content||null, source_question_ids:rec.source_question_ids||[qhOf(q)],
        dependency_evidence:rec.dependency_evidence||null, review_status:rec.review_status, model:EXTRAS_MODEL });
      if(rec.review_status==="ai_reviewed") ai_reviewed++; else rejected++;
    }
    res.json({ ok:true, scanned:batch.length, ai_reviewed, rejected, remaining_unprocessed: Math.max(0, pool.length-batch.length) });
  }catch(e){ res.status(500).json({ error:e.message||"server error" }); }
});
app.post("/admin/integrated/minedebug", async (req,res)=>{
  /* DIAGNOSTIC (no insert): run ONLY the miner over a tiny batch and return the raw model output + parse + error,
     so we can see whether the miner is erroring vs legitimately returning integrable:false. */
  try{
    if(!await requireAdmin(req)) return res.status(403).json({ error:"admins only" });
    const limit=Math.min(5, Number((req.body&&req.body.limit)||3));
    const tr=await admin.from("topics").select("id,title,extras").not("extras","is",null).limit(500);
    const pool=[]; (tr.data||[]).forEach(t=>{ ((t.extras&&t.extras.qbank)||[]).forEach(q=>{ if(q&&q.stem) pool.push(Object.assign({}, q, { id:qhOf(q), _qh:qhOf(q), _topic:t.title||t.name||"" })); }); });
    const out=[];
    for(const q of pool.slice(0, limit)){
      let raw=null, err=null, parsed=null;
      try{ const gen=await generate({ model:EXTRAS_MODEL, prompt:a17MinePrompt(q), parts:[], images:[], max_tokens:500, temperature:0.3, json:true });
        raw=((gen&&gen.text)||"").slice(0,500);
        const a=raw.indexOf("{"), b=raw.lastIndexOf("}");
        if(a>=0&&b>=0){ try{ parsed=JSON.parse(raw.slice(a,b+1)); }catch(e){ err="parse_error: "+e.message; } } else { err="no_json_in_output"; }
      }catch(e){ err="generate_error: "+(e.message||e); }
      out.push({ qh:q.id, topic:q._topic, skill:q.skill||"", stem:(q.stem||"").slice(0,90), integrable:(parsed?parsed.integrable:null), family:(parsed?parsed.integration_family:null), error:err, raw:(err?raw:null) });
    }
    res.json({ ok:true, model:EXTRAS_MODEL, pool_size:pool.length, details:out });
  }catch(e){ res.status(500).json({ error:e.message||"server error" }); }
});
app.get("/admin/integrated/pending", async (req,res)=>{
  try{ if(!await requireAdmin(req)) return res.status(403).json({ error:"admins only" });
    const r=await admin.from("integrated_items").select("*").in("review_status",["ai_reviewed","needs_edit"]).order("created_at",{ascending:true}).limit(200);
    res.json({ ok:true, items:r.data||[] });
  }catch(e){ res.status(500).json({ error:e.message||"server error" }); }
});
app.post("/admin/integrated/review", async (req,res)=>{
  /* The ONLY route to 'approved'. Human action + (for approve) a passing QA score. */
  try{
    const user=await requireAdmin(req); if(!user) return res.status(403).json({ error:"admins only" });
    const { id, action, qa } = req.body||{};
    if(!id || !action) return res.status(400).json({ error:"id and action required" });
    const cur=await admin.from("integrated_items").select("*").eq("id",id).maybeSingle();
    if(!cur.data) return res.status(404).json({ error:"item not found" });
    const updated=applyHumanReview(cur.data, action, qa, (user.email||user.id));
    await admin.from("integrated_items").update({ review_status:updated.review_status, qa:updated.qa||null, reviewer:updated.reviewer||null, reviewed_at:updated.reviewed_at||new Date().toISOString() }).eq("id",id);
    res.json({ ok:true, review_status:updated.review_status, reason:updated.reason||null });
  }catch(e){ res.status(500).json({ error:e.message||"server error" }); }
});
app.get("/admin/integrated/readiness", async (req,res)=>{
  /* live readiness of the APPROVED bank against the locked gate. */
  try{ if(!await requireAdmin(req)) return res.status(403).json({ error:"admins only" });
    const r=await admin.from("integrated_items").select("integration_family,review_status").eq("review_status","approved");
    const gate=readinessGate((r.data||[]).map(x=>({ integration_family:x.integration_family })));
    const counts=await admin.from("integrated_items").select("review_status");
    const by={}; (counts.data||[]).forEach(x=>{ by[x.review_status]=(by[x.review_status]||0)+1; });
    res.json({ ok:true, readiness:gate, by_status:by });
  }catch(e){ res.status(500).json({ error:e.message||"server error" }); }
});

app.get("/admin/integrated/inventory", async (req,res)=>{
  /* READ-ONLY Integrated inventory probe. A heuristic CANDIDATE SCAN, NOT a classifier: it surfaces questions that
     MIGHT integrate ≥2 domains for HUMAN REVIEW. It writes nothing, sets no metadata, and changes no student
     behavior. Candidates are NOT "integrated questions" until a human confirms integrated_topics[]. */
  try{
    if(!await requireAdmin(req)) return res.status(403).json({ error:"admins only" });
    const DOMAINS={ cardio:/\b(cardiac|heart|myocard|angina|chest pain|ecg|arrhythm|hypertensi|heart failure)\b/i,
      renal:/\b(renal|kidney|ckd|nephro|creatinine|dialysis|aki)\b/i, endocrine:/\b(diabet|thyroid|insulin|glucose|adrenal|endocrine)\b/i,
      resp:/\b(respirat|lung|pneumonia|asthma|copd|dyspn|bronch|pulmonary)\b/i, neuro:/\b(neuro|seizure|stroke|meningit|consciousness|cerebral|epilep)\b/i,
      infect:/\b(sepsis|infection|fever|antibiotic|malaria|hiv|tubercul|\btb\b)\b/i, hepatic:/\b(liver|hepat|jaundice|cirrhos)\b/i,
      obgyn:/\b(pregnan|obstetric|eclampsia|labour|postpartum|puerper|gynae)\b/i, gi:/\b(gastro|bowel|diarrhoea|gi bleed|abdomin|pancreat)\b/i,
      haem:/\b(anaemia|anemia|bleeding|coagul|platelet|sickle)\b/i, neonate:/\b(neonat|newborn|prematur|birth asphyxia)\b/i };
    const SYNTH=new Set(["management","next_step","complications","differential"]);
    const tr=await admin.from("topics").select("id,extras").not("extras","is",null).limit(3000);
    const topics=(tr.data||[]).filter(t=>t.extras && Array.isArray(t.extras.qbank));
    let total=0, candidates=0; const byCombo={}, bySkill={};
    topics.forEach(t=>{ t.extras.qbank.forEach(q=>{ if(!q||!q.stem) return; total++;
      const stem=String(q.stem);
      const hit=Object.keys(DOMAINS).filter(d=>DOMAINS[d].test(stem));
      if(hit.length>=2 && SYNTH.has(String(q.skill||"").toLowerCase())){
        candidates++;
        const combo=hit.slice(0,2).sort().join(" + "); byCombo[combo]=(byCombo[combo]||0)+1;
        const sk=String(q.skill||"?"); bySkill[sk]=(bySkill[sk]||0)+1;
      }
    }); });
    const comboArr=Object.entries(byCombo).map(([k,v])=>({combo:k,n:v})).sort((a,b)=>b.n-a.n);
    // GATES (informational — human decides): enough candidates, enough breadth, enough per-combo for MIN_EV=3
    const distinctCombos=comboArr.length;
    const combosOverMinEv=comboArr.filter(c=>c.n>=3).length;
    res.json({ ok:true, disclaimer:"HEURISTIC CANDIDATES — require human review. NOT a classifier; nothing written.",
      totals:{ questions_scanned:total, topics:topics.length, candidate_questions:candidates, candidate_rate_pct: total?Math.round(candidates/total*1000)/10:0 },
      by_apparent_combination: comboArr.slice(0,25),
      by_skill: bySkill,
      gates:{ distinct_combinations:distinctCombos, "combinations_with_ev>=3":combosOverMinEv,
        note:"Gate1 enough candidates? Gate2 enough breadth (distinct combos)? Gate3 enough per-combo for MIN_EV=3 learning analytics?" } });
  }catch(e){ res.status(500).json({ error:e.message||"server error" }); }
});
app.get("/admin/targets/health", async (req,res)=>{
  /* Read-only target-layer diagnostics (no mutation). Surfaces the evidence for the deferred decisions:
     orphans (targets with 0 authoritative question mappings), over-broad targets (atomicity candidates),
     and the confidence + AMBIGUOUS distribution (threshold-calibration evidence). */
  try{
    if(!await requireAdmin(req)) return res.status(403).json({ error:"admins only" });
    const overBroadMin = Number(req.query.overBroadMin)||5;
    const kt=await admin.from("knowledge_targets").select("target_id,topic,skill,canonical_statement,status");
    const qt=await admin.from("question_targets").select("target_id,map_state,map_confidence,mapping_source,mapping_status");
    const targets=(kt.data||[]).filter(t=>t.status!=="deprecated"&&t.status!=="merged");
    const rows=(qt.data||[]).filter(r=> (r.mapping_status||"active")==="active");
    const members={};                                            // authoritative mappings per target
    rows.forEach(r=>{ const auth = r.target_id && (r.map_state==="MATCH" || r.mapping_source==="human");
      if(auth) members[r.target_id]=(members[r.target_id]||0)+1; });
    const orphans=targets.filter(t=>!members[t.target_id]).map(t=>({ target_id:t.target_id, topic:t.topic, statement:(t.canonical_statement||"").slice(0,90) }));
    const overBroad=targets.map(t=>({ target_id:t.target_id, topic:t.topic, members:members[t.target_id]||0, statement:(t.canonical_statement||"").slice(0,90) }))
      .filter(t=>t.members>=overBroadMin).sort((a,b)=>b.members-a.members);
    // confidence distribution over MATCH mappings + AMBIGUOUS count (calibration evidence)
    const conf={ "0.80-0.85":0, "0.85-0.90":0, "0.90-0.95":0, "0.95-1.00":0 };
    let matches=0, ambiguous=0;
    rows.forEach(r=>{ if(r.map_state==="MATCH"){ matches++; const c=r.map_confidence||0;
      if(c>=0.95)conf["0.95-1.00"]++; else if(c>=0.90)conf["0.90-0.95"]++; else if(c>=0.85)conf["0.85-0.90"]++; else if(c>=0.80)conf["0.80-0.85"]++; }
      else if(r.map_state==="AMBIGUOUS") ambiguous++; });
    res.json({ ok:true, targets:targets.length,
      orphans:{ count:orphans.length, items:orphans.slice(0,50) },
      overBroad:{ threshold:overBroadMin, count:overBroad.length, items:overBroad.slice(0,50) },
      calibration:{ matchConfidence:conf, matches, ambiguous, ambiguousRate: (matches+ambiguous)? Math.round(ambiguous/(matches+ambiguous)*100):0 } });
  }catch(e){ res.status(500).json({ error:e.message||"server error" }); }
});
app.post("/admin/targets/deprecate-orphans", async (req,res)=>{
  /* REVERSIBLE orphan cleanup: mark targets with 0 authoritative mappings as status='deprecated' (loadTargets
     already excludes deprecated). Not a hard delete — flip status back to 'active' to restore. */
  try{
    if(!await requireAdmin(req)) return res.status(403).json({ error:"admins only" });
    const kt=await admin.from("knowledge_targets").select("target_id,status");
    const qt=await admin.from("question_targets").select("target_id,map_state,mapping_source,mapping_status");
    const auth={}; (qt.data||[]).forEach(r=>{ if((r.mapping_status||"active")==="active" && r.target_id && (r.map_state==="MATCH"||r.mapping_source==="human")) auth[r.target_id]=1; });
    const orphanIds=(kt.data||[]).filter(t=>t.status!=="deprecated"&&t.status!=="merged"&&!auth[t.target_id]).map(t=>t.target_id);
    if(!orphanIds.length) return res.json({ ok:true, deprecated:0 });
    if(req.body && req.body.dryRun) return res.json({ ok:true, wouldDeprecate:orphanIds.length, ids:orphanIds.slice(0,100) });
    const up=await admin.from("knowledge_targets").update({ status:"deprecated" }).in("target_id",orphanIds);
    res.json({ ok:!up.error, deprecated:orphanIds.length, ids:orphanIds.slice(0,100) });
  }catch(e){ res.status(500).json({ error:e.message||"server error" }); }
});
app.get("/admin/targets/churn-audit", async (req,res)=>{
  try{
    if(!await requireAdmin(req)) return res.status(403).json({ error:"admins only" });
    const tr=await admin.from("knowledge_targets").select("target_id,canonical_statement,topic,skill");
    const targets=tr.data||[];
    const qr=await admin.from("question_targets").select("qh,target_id,proposed,candidates").eq("map_state","NEW");
    const news=qr.data||[];
    const toks=x=>new Set(String(x||"").toLowerCase().replace(/[^a-z0-9 ]/g," ").split(/\s+/).filter(w=>w.length>3));
    const jac=(a,b)=>{ let i=0; a.forEach(w=>{ if(b.has(w)) i++; }); const u=a.size+b.size-i; return u?i/u:0; };
    const nk=x=>String(x||"").toLowerCase().replace(/[^a-z0-9]+/g," ").trim();
    const tTok=targets.map(t=>({t, tk:toks(t.canonical_statement)}));
    const items=news.map(n=>{
      const p=n.proposed||{}, pk=toks(p.knowledge_statement); let best=null;
      tTok.forEach(({t,tk})=>{ if(t.target_id===n.target_id) return; const ov=jac(pk,tk);
        if(!best||ov>best.overlap) best={ target_id:t.target_id, topic:t.topic, skill:t.skill, overlap:+ov.toFixed(2), statement:t.canonical_statement }; });
      const sameFilter = !!(best && nk(best.topic)===nk(p.topic) && nk(best.skill)===nk(p.skill));
      const hadCand=(n.candidates||[]).length>0;
      let cls; if(!best||best.overlap<0.35) cls="A_new"; else if(!sameFilter) cls="B_prefilter"; else cls="C_matcher";
      return { qh:n.qh, own_target:n.target_id, proposed_topic:p.topic, proposed_skill:p.skill,
               proposed_statement:p.knowledge_statement, best, sameFilter, hadCandidate:hadCand, classification:cls }; });
    const summary={ A_new:0, B_prefilter:0, C_matcher:0 }; items.forEach(i=>summary[i.classification]++);
    res.json({ ok:true, totalNew:news.length, totalTargets:targets.length, summary, items });
  }catch(e){ res.status(500).json({ error:e.message||"server error" }); }
});

app.get("/admin/targets/near-miss", async (req,res)=>{
  try{
    if(!await requireAdmin(req)) return res.status(403).json({ error:"admins only" });
    const limit=Math.min(200, Number(req.query.limit)||60);
    const r=await admin.from("question_targets").select("qh,proposed,candidates,map_confidence,topic_id,target_id").eq("map_state","NEW").limit(500);
    let rows=(r.data||[]).filter(x=>Array.isArray(x.candidates) && x.candidates.length>0);
    const top=x=>Math.max.apply(null, x.candidates.map(c=>c.score==null?-1:c.score));
    rows.sort((a,b)=>top(b)-top(a));                     // strongest near-misses first (most likely false-NEW)
    rows=rows.slice(0, limit);
    const ids=[...new Set(rows.flatMap(x=>x.candidates.map(c=>c.target_id)).filter(Boolean))];
    const tr= ids.length ? await admin.from("knowledge_targets").select("target_id,canonical_statement,topic,skill").in("target_id",ids) : { data:[] };
    const tmap={}; (tr.data||[]).forEach(t=>{ tmap[t.target_id]=t; });
    // attach the question stem by matching qh inside each source topic's extras.qbank
    const topicIds=[...new Set(rows.map(x=>x.topic_id).filter(Boolean))];
    const stemByQh={};
    if(topicIds.length){ const tp=await admin.from("topics").select("id,extras").in("id",topicIds);
      (tp.data||[]).forEach(t=>{ const qs=(t.extras&&t.extras.qbank)||[]; qs.forEach(q=>{ stemByQh[qhOf(q)]=q.stem; }); }); }
    res.json({ ok:true, count:rows.length, items: rows.map(x=>({
      qh:x.qh, stem: stemByQh[x.qh]||null, decision:"NEW", confidence:x.map_confidence,
      proposed_statement: (x.proposed||{}).knowledge_statement||null,
      proposed: x.proposed,
      candidates: (x.candidates||[]).map(c=>({ target_id:c.target_id, score:c.score,
        statement:(tmap[c.target_id]||{}).canonical_statement||null })).sort((a,b)=>(b.score==null?-1:b.score)-(a.score==null?-1:a.score)) })) });
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
      if(!email) console.error("[paystack] %s with NO customer email — payment cannot be matched to an account:", event.event, JSON.stringify(event.data||{}).slice(0,400));
      if(email){
        // ENT-01: the lookup was case/whitespace-sensitive while isPremium lowercases everywhere,
        // and a miss was silent — the student paid and stayed Basic with nothing in the logs.
        const norm = String(email).trim().toLowerCase();
        let acc = await admin.from("accounts").select("id").eq("email", email).maybeSingle();
        if(!acc.data && norm !== email) acc = await admin.from("accounts").select("id").eq("email", norm).maybeSingle();
        if(!acc.data){
          console.error("[paystack] PAID BUT UNMATCHED — no accounts row for %s (event %s). Grant this subscription by hand.", norm, event.event);
        } else {
          // .update() matching zero rows is a silent success — if the account has no subscriptions
          // row yet, the payment vanished. .select() lets us see the row count and shout about it.
          const up = await admin.from("subscriptions").update({ status:"active", plan:"monthly" }).eq("account_id", acc.data.id).select("account_id");
          if(up.error) console.error("[paystack] PAID BUT NOT ACTIVATED — subscriptions update failed for account %s (%s): %s", acc.data.id, norm, up.error.message||up.error);
          else if(!up.data || !up.data.length) console.error("[paystack] PAID BUT NOT ACTIVATED — no subscriptions row exists for account %s (%s); the update matched 0 rows. Insert one by hand.", acc.data.id, norm);
          else console.log("[paystack] subscription active for account %s (%s)", acc.data.id, norm);
        }
      }
    }
    res.status(200).end();
  }catch(e){ console.error(e); res.status(200).end(); }   // always 200 so Paystack stops retrying
});

const PORT = process.env.PORT || 8787;
app.listen(PORT, ()=>{ console.log("MedBank import server on :"+PORT); loadApprovedOverlay(); });
