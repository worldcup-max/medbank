/* ==========================================================================
 * Phase B (Integrated Mode) + Phase E (linear Case Mode) — PURE serve core.
 * NO AI, NO network, NO DB. Everything here only READS approved integrated_items rows and decides what may be
 * shown to a student. It never writes questions, never derives or alters target_id, never touches A6/A7
 * scheduling or the frozen R1–R4 QA engine (see PHASE-B-INTEGRATED-MODE-CONTRACT.md, CASE-MODE-SCOPE.md).
 *
 * Invariants pinned by qa/v19-integrated-serve.mjs:
 *  - only review_status==='approved' rows are ever servable (fail closed on anything else / malformed content)
 *  - ONE primary target_id per item, passed through untouched; integrated_topics/case_id/case_stage = metadata
 *  - shortfall is REPORTED, never substituted (no non-integrated padding, no relabelling)
 *  - a case is N approved rows sharing case_id with contiguous stages 1..N, served in FIXED order
 * ========================================================================== */

function _norm(s){ return String(s==null?"":s).toLowerCase().replace(/[^a-z0-9 ]+/g," ").replace(/\s+/g," ").trim(); }

/* Map ONE integrated_items row → a qbank-shaped student item, or null if it is not servable. */
export function toServable(row){
  if(!row || row.review_status!=="approved") return null;
  const tc=row.transformed_content||{};
  const stem=String(tc.stem||"").trim();
  const options=Array.isArray(tc.options)?tc.options.map(o=>String(o==null?"":o).trim()):[];
  const answer=tc.answer;
  if(!stem || options.length<2 || options.length>6 || options.some(o=>!o)) return null;
  if(new Set(options.map(_norm)).size!==options.length) return null;                  // duplicate options → not servable
  if(!Number.isInteger(answer) || answer<0 || answer>=options.length) return null;
  const rationales=Array.isArray(tc.rationales)?tc.rationales.slice(0,options.length).map(r=>String(r==null?"":r)):[];
  return {
    id: row.id,
    stem, options, answer, rationales,
    lead_in: tc.lead_in||"",
    teaching: tc.teaching||tc.objective||row.integration_rationale||"",
    objective: tc.objective||tc.teaching||"",
    skill: tc.skill||"",
    cognitive_level: tc.cognitive_level||"",
    difficulty: tc.difficulty||"",
    target_id: row.target_id||null,                                                    // ONE primary target, untouched
    primary_topic: row.primary_topic||null,
    integrated_topics: Array.isArray(row.integrated_topics)?row.integrated_topics.slice():[],   // metadata only
    integration_family: row.integration_family||null,
    integration_type: row.integration_type||null,
    integration_dependency: row.integration_dependency||"",
    case_id: row.case_id||null,                                                        // metadata only
    case_stage: Number.isInteger(row.case_stage)?row.case_stage:null
  };
}

/* Deterministic, family-balanced selection. Round-robins across the requested families (or all present) so no
   family dominates a session; within a family the order is a seeded shuffle (reproducible per seed). Requests
   beyond what exists are reported as shortfall — NEVER padded. */
function _seed(s){ let h=2166136261>>>0; s=String(s||""); for(let i=0;i<s.length;i++){ h^=s.charCodeAt(i); h=Math.imul(h,16777619); } return h>>>0; }
function _rng(a){ return function(){ a|=0; a=a+0x6D2B79F5|0; let t=Math.imul(a^a>>>15,1|a); t=t+Math.imul(t^t>>>7,61|t)^t; return ((t^t>>>14)>>>0)/4294967296; }; }
export function selectIntegrated(items, req){
  req=req||{}; const count=Math.max(0, req.count|0); const exclude=new Set(req.exclude||[]);
  const pool=(items||[]).filter(it=>it && it.id && !exclude.has(it.id));
  const wanted=Array.isArray(req.families)&&req.families.length ? req.families.slice() : null;
  const byFam={}; pool.forEach(it=>{ const f=it.integration_family||"?"; if(wanted && wanted.indexOf(f)<0) return; (byFam[f]=byFam[f]||[]).push(it); });
  const fams=Object.keys(byFam).sort();
  const rnd=_rng(_seed(req.seed||"mb"));
  fams.forEach(f=>{ const d=byFam[f].slice().sort((a,b)=>a.id<b.id?-1:a.id>b.id?1:0);
    for(let i=d.length-1;i>0;i--){ const j=Math.floor(rnd()*(i+1)); const t=d[i]; d[i]=d[j]; d[j]=t; } byFam[f]=d; });
  const selected=[]; let gi=0, guard=0;
  while(selected.length<count && fams.some(f=>byFam[f].length) && guard<100000){
    const f=fams[gi%fams.length]; if(byFam[f].length) selected.push(byFam[f].shift()); gi++; guard++;
  }
  const deliveredByFamily={}; selected.forEach(it=>{ const f=it.integration_family||"?"; deliveredByFamily[f]=(deliveredByFamily[f]||0)+1; });
  const missingFamilies = wanted ? wanted.filter(f=>!(f in deliveredByFamily)) : [];
  return { selected, requested:count, delivered:selected.length, shortfall:Math.max(0, count-selected.length),
           deliveredByFamily, missingFamilies };
}

/* ---- Phase E: linear cases ---- */
export const CASE_CFG = { minStages:2, maxStages:6, leakMinChars:12 };

/* Cross-stage leakage guard. An EARLIER stage's visible text (stem, lead-in, options, rationales, teaching) must not
   contain a LATER stage's keyed answer — otherwise answering stage 1 hands you stage 3. Earlier answers appearing
   in later stems are allowed (the student has already answered them; that's the case progressing). */
export function caseLeakage(stages, cfg){
  const R=Object.assign({}, CASE_CFG, cfg||{}); const leaks=[];
  for(let k=0;k<stages.length;k++){
    const s=stages[k]; const shown=_norm([s.stem,s.lead_in,(s.options||[]).join(" "),(s.rationales||[]).join(" "),s.teaching].join(" "));
    for(let m=k+1;m<stages.length;m++){
      const later=stages[m]; const key=_norm((later.options||[])[later.answer]);
      if(key.length>=R.leakMinChars && shown.indexOf(key)>=0) leaks.push({ from_stage:k+1, leaks_stage:m+1, answer:(later.options||[])[later.answer] });
    }
  }
  return leaks;
}

/* Group approved rows into playable cases. Rejects (with a reason) any case that is incomplete, out of order,
   mixes unapproved stages, is too short/long, or leaks a later answer. Returns playable cases in fixed stage order. */
export function assembleCases(rows, meta, cfg){
  const R=Object.assign({}, CASE_CFG, cfg||{}); meta=meta||{};
  const groups={};
  (rows||[]).forEach(r=>{ if(r && r.case_id) (groups[r.case_id]=groups[r.case_id]||[]).push(r); });
  const cases=[], rejected=[];
  Object.keys(groups).sort().forEach(cid=>{
    const g=groups[cid];
    const bad=g.filter(r=>r.review_status!=="approved");
    if(bad.length){ rejected.push({ case_id:cid, reason:bad.length+" stage(s) not approved" }); return; }
    const stages=g.map(toServable);
    if(stages.some(s=>!s)){ rejected.push({ case_id:cid, reason:"a stage has malformed content" }); return; }
    if(stages.some(s=>!Number.isInteger(s.case_stage))){ rejected.push({ case_id:cid, reason:"a stage has no case_stage" }); return; }
    stages.sort((a,b)=>a.case_stage-b.case_stage);
    const contiguous=stages.every((s,i)=>s.case_stage===i+1);
    if(!contiguous){ rejected.push({ case_id:cid, reason:"stages are not 1.."+stages.length+" without gaps/duplicates" }); return; }
    if(stages.length<R.minStages || stages.length>R.maxStages){ rejected.push({ case_id:cid, reason:stages.length+" stages (need "+R.minStages+"–"+R.maxStages+")" }); return; }
    const leaks=caseLeakage(stages, R);
    if(leaks.length){ rejected.push({ case_id:cid, reason:"stage "+leaks[0].from_stage+" reveals the answer to stage "+leaks[0].leaks_stage, leaks }); return; }
    const first=g.find(r=>r.case_stage===1)||g[0]; const m=meta[cid]||{};
    const families=[...new Set(stages.map(s=>s.integration_family).filter(Boolean))];
    cases.push({ case_id:cid, title:m.title||first.case_title||"Clinical case", intro:m.intro||first.case_intro||"",
                 stages, n:stages.length, families });
  });
  return { cases, rejected };
}

/* Case scoring: each stage graded exactly as a standalone question; the case score is a DERIVED summary. */
export function caseScore(stages, results){
  const byStage=(stages||[]).map((s,i)=>{ const r=(results||[]).find(x=>x.i===i); return { stage:i+1, answered:!!r, ok:!!(r&&r.ok) }; });
  const answered=byStage.filter(s=>s.answered).length, correct=byStage.filter(s=>s.ok).length;
  const firstMiss=byStage.find(s=>s.answered && !s.ok);
  return { n:byStage.length, answered, correct, pct:answered?Math.round(correct/answered*100):0, byStage, first_miss_stage:firstMiss?firstMiss.stage:null };
}
