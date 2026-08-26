/* V1.7 Integrated Content Pipeline — deterministic core tests (real import-server/integrated.mjs). */
import { dependencyGate, qaScore, readinessGate, nextStatus, READINESS, runCandidate, applyHumanReview } from '../import-server/integrated.mjs';
let pass=0, fail=0; const ok=(c,m)=>{ if(c)pass++; else{ fail++; console.log('  ✗ '+m); } };
(async()=>{

// --- dependency test ---
ok(dependencyGate({removeA_changes:true,removeB_changes:true,bothRequired:true,secondaryIsRealDomain:true}).pass, 'D1 all-true → genuine integration');
// febrile pneumonia: removing "infection" doesn't change it (it IS the disease) + secondary not a real domain
ok(!dependencyGate({removeA_changes:true,removeB_changes:false,bothRequired:false,secondaryIsRealDomain:false}).pass, 'D2 febrile-pneumonia style → NOT integrated');
// secondary is a symptom/comorbidity only
ok(!dependencyGate({removeA_changes:true,removeB_changes:true,bothRequired:true,secondaryIsRealDomain:false}).pass, 'D3 secondary is symptom/comorbidity → rejected');
{ const r=dependencyGate({removeA_changes:true,removeB_changes:false,bothRequired:true,secondaryIsRealDomain:true});
  ok(!r.pass && r.reasons.some(x=>/domain B not required/.test(x)), 'D4 one domain removable → rejected with reason'); }

// --- QA score ---
{ const full={dependency:3,coherence:3,educational:3,discrimination:3,targetClarity:2,difficulty:2,noArtificialComplexity:3};
  const r=qaScore(full); ok(r.total===19 && r.approve, 'Q1 full marks → approve (19/19)'); }
{ const r=qaScore({dependency:3,coherence:3,educational:3,discrimination:3,targetClarity:2,difficulty:1,noArtificialComplexity:0});
  ok(r.total===15 && r.approve, 'Q2 exactly 15 with dep=3 → approve'); }
{ const r=qaScore({dependency:2,coherence:3,educational:3,discrimination:3,targetClarity:2,difficulty:2,noArtificialComplexity:3});
  ok(!r.approve && /dependency/.test(r.reason), 'Q3 dep=2 but total 18 → REJECT (dependency mandatory)'); }
{ const r=qaScore({dependency:3,coherence:2,educational:2,discrimination:2,targetClarity:1,difficulty:1,noArtificialComplexity:2});
  ok(r.total===13 && !r.approve && /total/.test(r.reason), 'Q4 total 13 → reject'); }

// --- readiness gate ---
function bank(families){ const out=[]; Object.keys(families).forEach(f=>{ for(let i=0;i<families[f];i++) out.push({integration_family:f}); }); return out; }
// ready: 8 families x 13 = 104, none dominates
{ const fams={}; ['cardio_renal','cardio_endocrine','endocrine_renal','resp_cardiac','neuro_endocrine','pregnancy_cardio','gi_hepatic','onco_haem'].forEach(f=>fams[f]=13);
  const r=readinessGate(bank(fams)); ok(r.ready && r.total===104 && r.families===8, 'R1 100+/8 families/≥10 each/no dominance → READY'); }
// not ready: too few total
{ const r=readinessGate(bank({cardio_renal:10,cardio_endocrine:10})); ok(!r.ready && !r.checks.enough_total, 'R2 <100 total → not ready'); }
// not ready: one family dominates (>30%)
{ const r=readinessGate(bank({cardio_renal:60, cardio_endocrine:12,endocrine_renal:11,resp_cardiac:11,neuro_endocrine:11,pregnancy_cardio:11,gi_hepatic:11,onco_haem:11}));
  ok(!r.ready && !r.checks.no_family_dominates && r.biggest_family_share>0.30, 'R3 one family >30% → not ready (no silent skew)'); }
// not ready: <8 families
{ const r=readinessGate(bank({cardio_renal:60,cardio_endocrine:60})); ok(!r.ready && !r.checks.enough_families, 'R4 <8 families → not ready (breadth)'); }
// analytics pairs: only families with >=3
{ const r=readinessGate(bank({cardio_renal:5, cardio_endocrine:2, neuro_endocrine:1}));
  ok(r.analytics_ready_families.length===1 && r.analytics_ready_families[0]==='cardio_renal', 'R5 only families ≥3 are analytics-ready (MIN_EV)'); }
// realistic infect-noise bank (what we actually have) → NOT ready
{ const r=readinessGate(bank({cardio_endocrine:3})); ok(!r.ready, 'R6 current real supply (~cardio_endocrine 3) → NOT ready (matches the live verdict)'); }

// --- lifecycle ---
ok(nextStatus('candidate','ai_review')==='ai_reviewed' && nextStatus('ai_reviewed','to_human')==='pending' && nextStatus('pending','approve')==='approved', 'L1 lifecycle candidate→ai_reviewed→pending→approved');
ok(nextStatus('pending','reject')==='rejected' && nextStatus('pending','edit')==='needs_edit' && nextStatus('needs_edit','resubmit')==='pending', 'L2 reject/edit/resubmit transitions');
ok(nextStatus('candidate','approve')==='candidate', 'L3 illegal transition is a no-op (cannot skip review)');


// --- pipeline orchestration (AI seams mocked, deterministic) ---
const goodProposal={ primary_topic:'Cardiology', integrated_topics:['Nephrology'], integration_type:'management', integration_family:'cardio_renal', rationale:'renal fn changes drug choice', dependency:'diuresis worsens renal fn', source_question_ids:['Q1'] };
const genuineVerdict={removeA_changes:true,removeB_changes:true,bothRequired:true,secondaryIsRealDomain:true};
const fakeVerdict={removeA_changes:true,removeB_changes:false,bothRequired:false,secondaryIsRealDomain:false};

// P1: genuine → ai_reviewed (NOT approved), provenance preserved, canonical untouched
{ const q={ id:'Q1', stem:'HF patient...', options:['a','b','c','d'], answer:0, target_id:'T-CARD' };
  const before=JSON.stringify(q);
  const r=await runCandidate(q, { mine:async()=>goodProposal, adversarial:async()=>genuineVerdict });
  ok(r.review_status==='ai_reviewed', 'P1 genuine candidate → ai_reviewed (never auto-approved)');
  ok(r.source_question_ids[0]==='Q1' && r.integration_family==='cardio_renal', 'P1 provenance + family preserved');
  ok(JSON.stringify(q)===before, 'P1 INVARIANT: canonical question object NOT mutated'); }
// P2: adversarial disproves (fake) → rejected with reason
{ const q={ id:'Q2', stem:'febrile pneumonia', target_id:'T-RESP' };
  const r=await runCandidate(q, { mine:async()=>({primary_topic:'Respiratory',integrated_topics:['Infectious'],integration_family:'resp_infect',source_question_ids:['Q2']}), adversarial:async()=>fakeVerdict });
  ok(r.review_status==='rejected' && /required|symptom/.test(r.reason), 'P2 adversarial disproves → rejected (infect-noise killed)'); }
// P3: no candidate → rejected
{ const r=await runCandidate({id:'Q3'}, { mine:async()=>null, adversarial:async()=>genuineVerdict });
  ok(r.review_status==='rejected' && r.reason==='no candidate', 'P3 no candidate → rejected'); }
// P4: ONLY human approval yields approved — and only with passing QA
{ const q={ id:'Q4', target_id:'T' };
  const ai=await runCandidate(q, { mine:async()=>goodProposal, adversarial:async()=>genuineVerdict });
  ok(ai.review_status!=='approved', 'P4 pipeline output is NOT approved');
  const goodQA={dependency:3,coherence:3,educational:3,discrimination:3,targetClarity:2,difficulty:2,noArtificialComplexity:3};
  const appr=applyHumanReview(ai,'approve',goodQA,'frank'); ok(appr.review_status==='approved' && appr.reviewer==='frank', 'P4 human approve + passing QA → approved');
  const badQA={dependency:2,coherence:3,educational:3,discrimination:3,targetClarity:2,difficulty:2,noArtificialComplexity:3};
  const bounced=applyHumanReview(ai,'approve',badQA,'frank'); ok(bounced.review_status==='needs_edit', 'P4 human approve + FAILING QA → needs_edit (cannot slip in)');
  ok(applyHumanReview(ai,'reject',null,'frank').review_status==='rejected', 'P4 human reject → rejected'); }


// P5: TRANSFORMATION — mine seam returns transformed content + provenance; carried through the gate, never auto-approved
{ const q={ id:'Q9', stem:'diabetic nephropathy basics', target_id:'T-ENDO' };
  const before=JSON.stringify(q);
  const transformProposal={ primary_topic:'Endocrinology', integrated_topics:['Nephrology'], integration_type:'management', integration_family:'endocrine_renal',
    rationale:'renal function constrains glycaemic drug choice', dependency:'CKD changes safe agent', source_question_ids:['Q9'],
    transformed_content:{ stem:'diabetic with CKD stage 4 — which agent?', options:['a','b','c','d'], answer:0, rationales:['','','',''] } };
  const r=await runCandidate(q, { mine:async()=>transformProposal, adversarial:async()=>genuineVerdict });
  ok(r.review_status==='ai_reviewed', 'P5 transformed candidate → ai_reviewed (not auto-approved)');
  ok(r.transformed_content && r.transformed_content.stem==='diabetic with CKD stage 4 — which agent?', 'P5 transformed_content carried through');
  ok(r.source_question_ids[0]==='Q9' && r.integration_family==='endocrine_renal', 'P5 provenance (source Q9) + family preserved');
  ok(JSON.stringify(q)===before, 'P5 INVARIANT: source question NOT mutated by transformation'); }

console.log('\n'+pass+' passed, '+fail+' failed');
process.exit(fail?1:0);
})();
