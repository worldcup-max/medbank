/* V1.7 Integrated Content Pipeline — deterministic core tests (real import-server/integrated.mjs). */
import { dependencyGate, qaScore, readinessGate, nextStatus, READINESS, runCandidate, applyHumanReview,
         clinicalGate, sbaGate, qaVerdict, rebalanceOptions, normalizeOptions, diversitySignal } from '../import-server/integrated.mjs';
let pass=0, fail=0; const ok=(c,m)=>{ if(c)pass++; else{ fail++; console.log('  ✗ '+m); } };
(async()=>{

// --- dependency test ---
const GEN5={removeA_changes:true,removeB_changes:true,inferential:true,moreThanLookup:true,createsDecision:true};
ok(dependencyGate(GEN5).pass, 'D1 all 5 checks true → genuine integration');
// diabetes+CKD dose-adjust: materially changes answer (removeB) but is a LOOKUP, not inferential cross-domain
ok(!dependencyGate({removeA_changes:true,removeB_changes:true,inferential:false,moreThanLookup:false,createsDecision:false}).pass, 'D2 diabetes+CKD dose-lookup → REJECTED (high bar)');
{ const r=dependencyGate({removeA_changes:true,removeB_changes:true,inferential:true,moreThanLookup:false,createsDecision:true});
  ok(!r.pass && r.reasons.some(x=>/lookup/.test(x)), 'D3 more-than-lookup fails → rejected with lookup reason'); }
{ const r=dependencyGate(Object.assign({},GEN5,{removeA_changes:false}));
  ok(!r.pass && r.reasons.some(x=>/primary domain/.test(x)), 'D4 primary domain not required → rejected'); }
{ const r=dependencyGate(Object.assign({},GEN5,{createsDecision:false}));
  ok(!r.pass && r.reasons.some(x=>/create the clinical decision/.test(x)), 'D5 interaction does not create the decision → rejected'); }

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
// ready: 8 families x 3 = 24 (>=20 total, >=2 each), none dominates (<=35%)
{ const fams={}; ['cardio_renal','cardio_endocrine','endocrine_renal','resp_cardiac','neuro_endocrine','pregnancy_cardio','gi_hepatic','onco_haem'].forEach(f=>fams[f]=3);
  const r=readinessGate(bank(fams)); ok(r.ready && r.total===24 && r.families===8, 'R1 20+/8 families/≥2 each/no dominance → READY'); }
// not ready: too few total (16 < 20)
{ const r=readinessGate(bank({cardio_renal:8,cardio_endocrine:8})); ok(!r.ready && !r.checks.enough_total, 'R2 <20 total → not ready'); }
// not ready: one family dominates (>35%)
{ const r=readinessGate(bank({cardio_renal:12, cardio_endocrine:2,endocrine_renal:2,resp_cardiac:2,neuro_endocrine:2,pregnancy_cardio:2,gi_hepatic:2,onco_haem:2}));
  ok(!r.ready && !r.checks.no_family_dominates && r.biggest_family_share>0.35, 'R3 one family >35% → not ready (no silent skew)'); }
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
const genuineVerdict={removeA_changes:true,removeB_changes:true,inferential:true,moreThanLookup:true,createsDecision:true};
const fakeVerdict={removeA_changes:true,removeB_changes:true,inferential:false,moreThanLookup:false,createsDecision:false};

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
  ok(r.review_status==='rejected' && /lookup|inferential|create/.test(r.reason), 'P2 adversarial disproves → rejected (shallow integration killed)'); }
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

// P6: adversarial must review the TRANSFORMED candidate, not the source (regression for the review-target bug)
{ let sawStem=null; const src={ id:'Q10', stem:'ORIGINAL single-domain stem', target_id:'T' };
  const prop={ primary_topic:'Endocrinology', integrated_topics:['Nephrology'], integration_family:'endocrine_renal', source_question_ids:['Q10'],
    transformed_content:{ stem:'TRANSFORMED integrated stem (diabetes + CKD)', options:['a','b','c','d'], answer:0, rationales:[] } };
  await runCandidate(src, { mine:async()=>prop, adversarial:async(q)=>{ sawStem=q.stem; return genuineVerdict; } });
  ok(sawStem==='TRANSFORMED integrated stem (diabetes + CKD)', 'P6 adversarial reviews the TRANSFORMED stem, not the source'); }

// --- Reviewer 2: clinical gate ---
ok(clinicalGate({valid:true,matches_key:true,stem_sufficient:true,errors:[]}).pass, 'CG1 valid + matches key + sufficient → pass');
ok(!clinicalGate({valid:false,matches_key:true,stem_sufficient:true,errors:['wrong physiology']}).pass, 'CG2 clinical error → fail');
ok(!clinicalGate({valid:true,matches_key:false,stem_sufficient:true,errors:[]}).pass, 'CG3 reconstruction ≠ key → fail');

// --- Reviewer 3: single-best-answer gate (decisive = defensible_alternative boolean; grade is metadata) ---
ok(sbaGate({defensible_alternative:false,leakage:false}).pass, 'SG1 no defensible alternative, no leak → pass');
ok(!sbaGate({defensible_alternative:true}).pass, 'SG2 a genuinely defensible alternative → fail');
ok(!sbaGate({distractor_answer_actually_correct:true}).pass && sbaGate({distractor_answer_actually_correct:true}).distractor_correct, 'SG3 a distractor actually correct → fail (two correct)');
ok(!sbaGate({leakage:true}).pass, 'SG4 answer leakage → fail');
// INVARIANT (the #5 lesson): a clearly-inferior distractor the model merely labels "weak" is NOT a flaw.
ok(sbaGate({defensible_alternative:false,distractor_flaw:'weak',leakage:false}).pass, 'SG5 inferior distractor graded "weak" but no defensible alternative → PASS (metadata ≠ severity)');

// --- qaVerdict: severity aggregation (deterministic) ---
const depPass={pass:true}, depFail={pass:false,reasons:['not integrated']};
const clinOK={pass:true,valid:true,matches_key:true,stem_sufficient:true,errors:[]};
const sbaOK={pass:true,defensible_alternative:false,distractor_correct:false,leakage:false,distractor_flaw:'none',single_best:true};
{ const v=qaVerdict({dependency:depPass,integration_quality:'strong',clinical:clinOK,sba:sbaOK});
  ok(v.severity==='none' && v.action==='pass' && v.review_status==='ai_reviewed', 'V1 all clean → pass severity, to human'); }
{ const v=qaVerdict({dependency:depFail,integration_quality:'strong',clinical:clinOK,sba:sbaOK});
  ok(v.severity==='hard' && v.review_status==='rejected', 'V2 dependency fail → hard → rejected'); }
{ const v=qaVerdict({dependency:depPass,integration_quality:'strong',clinical:{valid:false,matches_key:false,stem_sufficient:true,errors:['bad']},sba:sbaOK});
  ok(v.severity==='hard' && v.review_status==='rejected', 'V3 clinical invalid → hard → rejected'); }
{ const v=qaVerdict({dependency:depPass,integration_quality:'strong',clinical:clinOK,sba:Object.assign({},sbaOK,{defensible_alternative:true})});
  ok(v.severity==='major' && v.action==='major_edit' && v.review_status==='ai_reviewed', 'V4 genuinely defensible alternative → major'); }
{ const v=qaVerdict({dependency:depPass,integration_quality:'adequate',clinical:clinOK,sba:sbaOK});
  ok(v.severity==='minor' && v.action==='minor_edit', 'V5 adequate integration → minor'); }
{ const v=qaVerdict({dependency:depPass,integration_quality:'strong',clinical:clinOK,sba:Object.assign({},sbaOK,{distractor_correct:true})});
  ok(v.severity==='hard', 'V6 a distractor is actually correct → hard'); }
{ const v=qaVerdict({dependency:depPass,integration_quality:'strong',clinical:{valid:true,matches_key:false,stem_sufficient:true,errors:[]},sba:sbaOK});
  ok(v.severity==='major' && v.review_status==='ai_reviewed', 'V7 valid key-dispute (R2 prefers another valid answer) → major, not hard'); }
{ const v=qaVerdict({dependency:depPass,integration_quality:'strong',clinical:{valid:false,matches_key:false,stem_sufficient:true,errors:['impossible mechanism']},sba:Object.assign({},sbaOK,{leakage:true})});
  ok(v.severity==='hard', 'V8 clinical error → hard (overrides)'); }
// INVARIANT: an inferior distractor graded "weak" must NOT create a flag through qaVerdict either (the #5 regression)
{ const v=qaVerdict({dependency:depPass,integration_quality:'strong',clinical:clinOK,sba:Object.assign({},sbaOK,{distractor_flaw:'weak'})});
  ok(v.severity==='none', 'V9 weak-labelled but inferior distractor → still none (no severity from metadata)'); }

// --- runCandidate with the specialist reviewers ---
{ const q={ id:'QC', stem:'SIADH, Na 128→130, MRI central pontine → ODS?', options:['a','b','c','d'], answer:1 };
  const r=await runCandidate(q, { mine:async()=>goodProposal, adversarial:async()=>genuineVerdict,
    clinical:async()=>({valid:false,matches_key:false,stem_sufficient:true,errors:['2 mmol/L is not overcorrection']}),
    sba:async()=>({defensible_alternative:false,leakage:true}) });
  ok(r.review_status==='rejected' && r.severity==='hard', 'PC1 clinically invalid candidate → hard-rejected despite passing dependency'); }
{ const q={ id:'QC2' };
  const hard=await runCandidate(q, { mine:async()=>goodProposal, adversarial:async()=>genuineVerdict,
    clinical:async()=>({valid:false,matches_key:false,stem_sufficient:true,errors:['x']}), sba:async()=>({defensible_alternative:false}) });
  const goodQA={dependency:3,coherence:3,educational:3,discrimination:3,targetClarity:2,difficulty:2,noArtificialComplexity:3};
  ok(applyHumanReview(hard,'approve',goodQA,'frank').review_status==='rejected', 'PC2 human cannot approve over a machine hard-fail'); }

// --- SAFETY INVARIANTS (must always hold — tested against the reviewer SIGNALS, not exact ordinal labels) ---
// These encode the architecture's guarantees; the LIVE run additionally checks the REASONING (e.g. #3 cites Na).
const inv=(clinical,sba,iq)=>qaVerdict({dependency:depPass,integration_quality:iq||'strong',clinical,sba}).severity;
ok(inv({valid:false,matches_key:false,stem_sufficient:true,errors:['Na 128→130 cannot cause ODS']},sbaOK)==='hard', 'INV1 #3-type: clinical error → HARD (never passes as valid)');
ok(inv(clinOK,Object.assign({},sbaOK,{defensible_alternative:false,distractor_flaw:'weak'}))==='none', 'INV2 #5-type: inferior distractor never creates hard/major');
ok(inv({valid:true,matches_key:false,stem_sufficient:true,errors:[]},sbaOK)==='major', 'INV3 #6-type: R2 prefers another VALID answer → MAJOR, not hard');
ok(inv({valid:true,matches_key:true,stem_sufficient:true,errors:[]},sbaOK)==='none', 'INV4 clean item → none');

// --- BOUNDARY ARCHETYPES (mapping generalization beyond the 6; blind-content versions run live post-deploy) ---
const BND=[
  { n:'clean',                 clinical:clinOK, sba:sbaOK, iq:'strong', expect:'none' },
  { n:'inferior-distractor',   clinical:clinOK, sba:Object.assign({},sbaOK,{distractor_flaw:'weak'}), iq:'strong', expect:'none' },
  { n:'competing-diagnosis',   clinical:clinOK, sba:Object.assign({},sbaOK,{defensible_alternative:true}), iq:'strong', expect:'major' },
  { n:'missing-info',          clinical:{valid:true,matches_key:true,stem_sufficient:false,errors:[]}, sba:sbaOK, iq:'strong', expect:'major' },
  { n:'false-premise',         clinical:{valid:false,matches_key:false,stem_sufficient:true,errors:['x']}, sba:sbaOK, iq:'strong', expect:'hard' },
  { n:'tempting-downstream',   clinical:{valid:false,matches_key:false,stem_sufficient:true,errors:['finding contradicts physiology']}, sba:Object.assign({},sbaOK,{leakage:true}), iq:'strong', expect:'hard' },
  { n:'ambiguous-wording',     clinical:clinOK, sba:sbaOK, iq:'adequate', expect:'minor' },
  { n:'two-correct',           clinical:clinOK, sba:Object.assign({},sbaOK,{distractor_correct:true}), iq:'strong', expect:'hard' },
  { n:'not-integrated',        clinical:clinOK, sba:sbaOK, iq:'strong', dep:depFail, expect:'hard' },
  { n:'answer-preference',     clinical:{valid:true,matches_key:false,stem_sufficient:true,errors:[]}, sba:sbaOK, iq:'strong', expect:'major' }
];
BND.forEach(b=>{ const v=qaVerdict({dependency:b.dep||depPass,integration_quality:b.iq,clinical:b.clinical,sba:b.sba}); ok(v.severity===b.expect, 'BND '+b.n+' → '+b.expect+' (got '+v.severity+')'); });

// --- answer-position rebalancer (generator fix) ---
{ const tc={options:['CORRECT','b','c','d'],answer:0,rationales:['rC','rb','rc','rd']}; const r=rebalanceOptions(tc,'seed-x');
  ok(r.options[r.answer]==='CORRECT', 'RB1 key still points to the same correct option after reorder');
  ok(r.options.slice().sort().join('|')===['CORRECT','b','c','d'].sort().join('|'), 'RB2 option set preserved (no content change)');
  ok(r.order.map(i=>['rC','rb','rc','rd'][i])[r.answer]==='rC', 'RB3 parallel rationales reorder in lockstep with the key'); }
{ const r=rebalanceOptions({options:['x'],answer:0},'s'); ok(r.answer===0 && r.options.length===1, 'RB4 <2 options → no-op'); }
{ const a=rebalanceOptions({options:['w','x','y','z'],answer:2},'same'); const b=rebalanceOptions({options:['w','x','y','z'],answer:2},'same');
  ok(JSON.stringify(a.order)===JSON.stringify(b.order), 'RB5 deterministic for a given seed'); }
// DISTRIBUTION REGRESSION: across many items (key always A pre-shuffle), post-shuffle positions must be ~uniform,
// not skewed to A. Fails if any position <15% or >35% over a large batch (the 69%-A stress-test finding).
{ const N=400, dist=[0,0,0,0];
  for(let i=0;i<N;i++){ const r=rebalanceOptions({options:['A','B','C','D'],answer:0}, 'item-'+i+'-stem'); dist[r.answer]++; }
  const share=dist.map(d=>d/N); const ok4=share.every(s=>s>=0.15 && s<=0.35);
  ok(ok4, 'RB6 anti-skew: post-rebalance answer positions ~uniform over 400 ('+share.map(s=>Math.round(s*100)).join('/')+')'); }

// --- option-prefix normalization (double-letter fix) ---
{ const n=normalizeOptions(['A. Initiate hemodialysis','B. Rasburicase','C. IV fluids','D. Sodium polystyrene']);
  ok(n[0]==='Initiate hemodialysis' && n[1]==='Rasburicase', 'NM1 strips the generator\'s positional letter prefix'); }
{ const n=normalizeOptions(['Initiate hemodialysis','Rasburicase']); ok(n[0]==='Initiate hemodialysis', 'NM2 unprefixed text left unchanged'); }
{ const once=normalizeOptions(['A. X','B. Y']); const twice=normalizeOptions(once); ok(JSON.stringify(once)===JSON.stringify(twice), 'NM3 idempotent'); }
// the key regression Frank asked for: normalized + UI-rendered letter must NEVER read "A. A."
{ const n=normalizeOptions(['A. X','B. Y','C. Z','D. W']); const rendered=n.map((o,i)=>String.fromCharCode(65+i)+'. '+o);
  ok(rendered.every((r,i)=>!new RegExp('^'+String.fromCharCode(65+i)+'\\. '+String.fromCharCode(65+i)+'\\.').test(r)), 'NM4 render never produces "A. A."'); }
// don't strip legitimate non-positional content: "E. coli" at position A stays intact
{ const n=normalizeOptions(['E. coli sepsis','B. other']); ok(n[0]==='E. coli sepsis', 'NM5 non-positional letter (E. coli at idx0) NOT stripped'); }
// normalize → rebalance still moves text + rationale + answer together
{ const clean=normalizeOptions(['A. CORRECT','B. b','C. c','D. d']); const r=rebalanceOptions({options:clean,answer:0},'seed-nm');
  ok(r.options[r.answer]==='CORRECT' && r.options.slice().sort().join('|')===['CORRECT','b','c','d'].sort().join('|'), 'NM6 normalize+rebalance preserves key + option set'); }

// --- diversity signal (advisory content-boundary layer) ---
const corpus=[
  { id:'x1', integration_family:'cardio_renal', stem:'A 65-year-old man with heart failure and CKD develops worsening creatinine on diuresis. What is the next step?', options:['Add a thiazide','Stop diuretics','Start dialysis','Give fluids'], answer:0 }
];
{ const d=diversitySignal({ stem:'A 65-year-old man with heart failure and CKD develops worsening creatinine on diuresis. What is the next step?', options:['Add a thiazide','Stop diuretics','Start dialysis','Give fluids'], answer:0, integration_family:'cardio_renal' }, corpus);
  ok(d.tier==='exact', 'DV1 identical stem → exact'); }
{ const d=diversitySignal({ stem:'A 66-year-old man with heart failure and chronic kidney disease has a rising creatinine while on diuresis; what is the best next step?', options:['Add a thiazide diuretic','Stop diuretics','Start dialysis','Give fluids'], answer:0, integration_family:'cardio_renal' }, corpus);
  ok(d.tier==='high' || d.tier==='moderate', 'DV2 reworded same-pattern (same family+intervention) → flagged (not ok)'); }
{ const d=diversitySignal({ stem:'A 30-year-old woman with sepsis and lactic acidosis needs fluid resuscitation; which vasopressor is first-line after fluids?', options:['Noradrenaline','Dopamine','Adrenaline','Vasopressin'], answer:0, integration_family:'infect_immunology' }, corpus);
  ok(d.tier==='ok', 'DV3 unrelated question → ok (no false diversity flag)'); }

console.log('\n'+pass+' passed, '+fail+' failed');
process.exit(fail?1:0);
})();
