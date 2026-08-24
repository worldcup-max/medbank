/* =============================================================================
 * Mega Q-bank — Knowledge Target layer (Phase A): extraction + reconciliation.
 *
 * Design (MEGA-QBANK-TARGET-LAYER.md):
 *   - The Knowledge Target is the source of truth; target_id is its stable id.
 *   - AI PROPOSES a target for a question; this module DECIDES MATCH / NEW / AMBIGUOUS.
 *   - Existing target wins. Never merge on similarity alone. When unsure → AMBIGUOUS.
 *   - A false merge is worse than a duplicate.
 *
 * This module is PURE + isolated: it holds the prompts and the deterministic decision
 * guards. The model call (generate) and the DB (admin/supabase) stay in server.mjs, which
 * passes their results in. Nothing here touches the live build until server.mjs wires it.
 * ========================================================================== */

/* ---- vocabulary (mirrors the client's QB_SKILLS / cognitive levels) ---- */
export const TARGET_SKILLS = ["diagnosis","investigation","management","complications","differential","next_step"];

/* ---- code helpers for a human-readable target_id: <TOPIC>-<SKILL>-<NNN> ---- */
const SKILL_CODE = { diagnosis:"DX", investigation:"IX", management:"MGMT", complications:"CX", differential:"DDX", next_step:"NEXT" };
export function skillCode(skill){ return SKILL_CODE[String(skill||"").toLowerCase()] || "GEN"; }
export function topicCode(topic){
  const t = String(topic||"").toUpperCase().replace(/[^A-Z0-9 ]/g," ").trim();
  if(!t) return "GEN";
  const words = t.split(/\s+/);
  const base = (words.length===1) ? words[0].slice(0,6) : words.map(w=>w[0]).join("").slice(0,6);
  return base || "GEN";
}
/* mint the next free id for a (topic,skill) family given the ids already in use */
export function mintTargetId(topic, skill, existingIds){
  const prefix = topicCode(topic)+"-"+skillCode(skill)+"-";
  let max = 0;
  (existingIds||[]).forEach(id=>{ if(typeof id==="string" && id.indexOf(prefix)===0){ const n=parseInt(id.slice(prefix.length),10); if(!isNaN(n)&&n>max) max=n; } });
  return prefix + String(max+1).padStart(3,"0");
}

/* ---- A2: extraction prompt (AI proposes a knowledge target for one question) ---- */
export function buildExtractPrompt(q){
  const opts = (q.options||[]).map((o,i)=>String.fromCharCode(65+i)+". "+o).join("\n");
  return `You are a medical education expert. For the single-best-answer question below, extract the ONE knowledge target it assesses. Answer ONLY with a JSON object, no prose.

QUESTION:
${q.stem||""}
${q.lead_in?("\n"+q.lead_in+"\n"):""}
${opts}
Correct answer: ${String.fromCharCode(65+(q.answer||0))}

Return exactly:
{
  "topic": "<the disease/subject, e.g. Bronchiolitis>",
  "subtopic": "<the sub-area, e.g. Management>",
  "skill": "<one of: ${TARGET_SKILLS.join(", ")}>",
  "knowledge_statement": "<ONE sentence stating the single fact/principle a learner must know to answer this — the teaching point, not the question>",
  "clinical_context": "<the vignette setting in a few words, or '' if none>",
  "expected_reasoning": "<the reasoning step the question tests, one clause>",
  "tested_misconception": "<the wrong belief a typical distractor represents, or '' if none>"
}

RULES:
- knowledge_statement is the MOST IMPORTANT field: make it a self-contained principle ("Supportive care is the mainstay of uncomplicated bronchiolitis"), NOT a restatement of the question.
- Keep it to the SINGLE target this question tests. If the question tests two things, pick the one the correct answer hinges on.`;
}
/* ---- A2/A4: BATCH extraction (one call annotates many questions — keeps build-time + backfill cost sane) ---- */
export function buildExtractBatchPrompt(questions){
  const blocks = questions.map((q,i)=>{
    const opts=(q.options||[]).map((o,j)=>String.fromCharCode(65+j)+". "+o).join("\n");
    return `#${i+1}\n${q.stem||""}${q.lead_in?("\n"+q.lead_in):""}\n${opts}\nCorrect: ${String.fromCharCode(65+(q.answer||0))}`;
  }).join("\n\n");
  return `You are a medical education expert. For EACH numbered single-best-answer question, extract the ONE knowledge target it assesses. Answer ONLY with a JSON object {"items":[ ... ]} whose items are IN THE SAME ORDER and SAME COUNT as the questions.

QUESTIONS:
${blocks}

Each item:
{ "n": <question number>,
  "topic": "<disease/subject>",
  "subtopic": "<sub-area>",
  "skill": "<one of: ${TARGET_SKILLS.join(", ")}>",
  "knowledge_statement": "<ONE self-contained principle a learner must know to answer — the teaching point, NOT a restatement of the question>",
  "clinical_context": "<vignette setting in a few words, or ''>",
  "expected_reasoning": "<the reasoning step tested, one clause>",
  "tested_misconception": "<the wrong belief a distractor represents, or ''>" }

RULES: knowledge_statement is the most important field and must be a standalone principle. One target per question — the one the correct answer hinges on. Return exactly ${questions.length} items.`;
}
/* parse a batch extraction; returns an array aligned to the input order (entries may be null on a bad item) */
export function parseProposedBatch(text, n){
  const out = new Array(n).fill(null);
  let o=null; const s=String(text||""); const a=s.indexOf("{"), b=s.lastIndexOf("}");
  if(a<0||b<0) return out;
  try{ o=JSON.parse(s.slice(a,b+1)); }catch(_){ return out; }
  const items = (o && Array.isArray(o.items)) ? o.items : (Array.isArray(o)?o:[]);
  items.forEach((it,idx)=>{
    if(!it||typeof it!=="object") return;
    const pos = (Number.isInteger(it.n) && it.n>=1 && it.n<=n) ? (it.n-1) : idx;   // honour explicit n, else position
    if(pos<0||pos>=n) return;
    const one = parseProposed(JSON.stringify(it));
    if(one) out[pos]=one;
  });
  return out;
}

/* parse the model's extraction JSON safely; returns a normalised proposal or null */
export function parseProposed(text){
  let o=null; const s=String(text||""); const a=s.indexOf("{"), b=s.lastIndexOf("}");
  if(a<0||b<0) return null;
  try{ o=JSON.parse(s.slice(a,b+1)); }catch(_){ return null; }
  if(!o || typeof o!=="object") return null;
  const norm = v => String(v==null?"":v).trim();
  let skill = norm(o.skill).toLowerCase().replace(/[\s-]+/g,"_");
  if(TARGET_SKILLS.indexOf(skill)<0) skill="";
  const stmt = norm(o.knowledge_statement);
  if(!stmt) return null;                                  // no statement → nothing to reconcile on
  return { topic:norm(o.topic), subtopic:norm(o.subtopic), skill,
           knowledge_statement:stmt, clinical_context:norm(o.clinical_context),
           expected_reasoning:norm(o.expected_reasoning), tested_misconception:norm(o.tested_misconception) };
}

/* ---- A3: reconciliation ---- */
export const RECON = { T_match:0.80, T_new:0.45, tieGap:0.12 };   // conservative; tuned from the A5 audit, not guessed live

/* normalise a topic for comparison (so "Bronchiolitis" == "bronchiolitis ") */
function nkey(s){ return String(s||"").toLowerCase().replace(/[^a-z0-9]+/g," ").trim(); }

/* DETERMINISTIC pre-filter: a candidate target is only eligible if it shares the topic AND skill.
   A different skill or topic is never a match, no matter how similar the wording. */
export function candidateFilter(proposed, targets){
  const pt=nkey(proposed.topic), ps=nkey(proposed.skill);
  return (targets||[]).filter(t=> t && t.status!=="deprecated" && t.status!=="merged"
    && nkey(t.topic)===pt
    && (!ps || !nkey(t.skill) || nkey(t.skill)===ps) );
}

/* A proposal that falls inside a candidate's `excludes` is FORCED APART, however similar the
   statement. This is the guard against collapsing "management" into "differential", etc. */
export function excludesConflict(proposed, target){
  const hay = (nkey(proposed.knowledge_statement)+" "+nkey(proposed.subtopic)+" "+nkey(proposed.expected_reasoning));
  return (target.excludes||[]).some(x=>{ const k=nkey(x); return k && hay.indexOf(k)>=0; });
}

/* Decide from the model's constrained adjudication.
 *   adj = { target_id: <one of candidate ids | null>, confidence: 0..1, second_id?, second_confidence? }
 *   candidates = the pre-filtered candidate target records (with .excludes)
 *   proposed = the extraction (for the excludes guard)
 * Returns { state, target_id, confidence, note }.
 *
 * Order of guards matters: no candidates → NEW; excludes conflict removes a candidate;
 * near-tie → AMBIGUOUS; below T_new → NEW; between → AMBIGUOUS; at/above T_match → MATCH.
 */
export function decide(proposed, candidates, adj, cfg){
  const T = Object.assign({}, RECON, cfg||{});
  if(!candidates || !candidates.length) return { state:"NEW", target_id:null, confidence:1, note:"no candidate in this topic+skill" };
  const byId = {}; candidates.forEach(c=>{ byId[c.target_id]=c; });

  let id = adj && adj.target_id, conf = (adj && typeof adj.confidence==="number") ? adj.confidence : 0;
  // the model may only choose among the candidates it was given
  if(id && !byId[id]){ id=null; conf=0; }
  // excludes guard: if the chosen candidate excludes this proposal, it cannot be a match
  if(id && excludesConflict(proposed, byId[id])) return { state:"AMBIGUOUS", target_id:null, confidence:conf, note:"chosen candidate excludes this proposal" };
  // near-tie between the top two → not safe to merge
  const second = adj && typeof adj.second_confidence==="number" ? adj.second_confidence : 0;
  if(id && second>0 && (conf-second) < T.tieGap) return { state:"AMBIGUOUS", target_id:null, confidence:conf, note:"top two candidates near-tie" };

  if(!id || conf < T.T_new) return { state:"NEW", target_id:null, confidence:conf, note:"no candidate close enough" };
  if(conf < T.T_match)       return { state:"AMBIGUOUS", target_id:null, confidence:conf, note:"in the uncertainty band" };
  return { state:"MATCH", target_id:id, confidence:conf, note:"statement-equivalent to existing target" };
}

/* ---- reconciliation prompt: adjudicate a proposal AGAINST a bounded candidate set only ---- */
export function buildReconcilePrompt(proposed, candidates){
  const list = candidates.map((c,i)=>`${i+1}. id=${c.target_id}
   statement: ${c.canonical_statement}
   scope: ${c.scope||"(unspecified)"}
   excludes: ${(c.excludes||[]).join("; ")||"(none)"}`).join("\n");
  return `You are reconciling a medical knowledge target. Decide whether the PROPOSED target is testing the SAME underlying knowledge as one of the EXISTING targets. Two statements can be related yet distinct — only call it the same if a learner who has mastered one has necessarily mastered the other. Answer ONLY JSON.

PROPOSED:
  statement: ${proposed.knowledge_statement}
  topic/subtopic/skill: ${proposed.topic} / ${proposed.subtopic} / ${proposed.skill}
  reasoning tested: ${proposed.expected_reasoning}

EXISTING CANDIDATES (choose only from these):
${list}

Return exactly:
{ "target_id": "<the id of the SAME target, or null if none is truly the same>",
  "confidence": <0..1 how sure they are the SAME knowledge target>,
  "second_id": "<the next closest id, or null>",
  "second_confidence": <0..1> }

Be conservative: if the proposed target tests a different fact, angle, or reasoning step than a candidate — even within the same disease — return null. Do NOT merely match on shared topic words.`;
}

/* build a fresh canonical target record from a proposal (used when the decision is NEW) */
export function newTargetRecord(proposed, target_id, difficulty){
  return {
    target_id, version:1,
    canonical_statement: proposed.knowledge_statement,
    topic: proposed.topic, subtopic: proposed.subtopic, skill: proposed.skill,
    scope: proposed.clinical_context || proposed.subtopic || "",
    tests: proposed.expected_reasoning ? [proposed.expected_reasoning] : [],
    excludes: [],
    misconceptions: proposed.tested_misconception ? [proposed.tested_misconception] : [],
    difficulty_band: difficulty || "medium",
    status: "active", source: "ai_reconciled", member_count: 0
  };
}
