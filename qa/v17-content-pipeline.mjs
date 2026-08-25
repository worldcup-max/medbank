/* V1.7 Integrated Content Pipeline — deterministic core tests (real import-server/integrated.mjs). */
import { dependencyGate, qaScore, readinessGate, nextStatus, READINESS } from '../import-server/integrated.mjs';
let pass=0, fail=0; const ok=(c,m)=>{ if(c)pass++; else{ fail++; console.log('  ✗ '+m); } };

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

console.log('\n'+pass+' passed, '+fail+' failed');
process.exit(fail?1:0);
