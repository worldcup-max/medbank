/* Phase A throughput — edit & resubmit + review-queue priority (real import-server/integrated.mjs).
 *     node qa/phase-a-throughput.mjs      Exit 0 = all pass. */
import { validateEdit, resubmitEdited, reviewQueueOrder, applyHumanReview } from '../import-server/integrated.mjs';
let pass=0, fail=0; const ok=(c,m)=>{ if(c)pass++; else{ fail++; console.log('  ✗ '+m); } };
(async()=>{
const STEM='A 58-year-old man with heart failure (EF 30%) and CKD stage 4 presents with worsening oedema and a potassium of 6.1 mmol/L.';
const GOOD={ stem:STEM, options:['Increase spironolactone','Stop spironolactone and give loop diuretic','Start an ACE inhibitor','Add amiloride'], answer:1, rationales:['a','b','c','d'] };
const CLEAN={ adversarial:async()=>({removeA_changes:true,removeB_changes:true,inferential:true,moreThanLookup:true,createsDecision:true,quality:'strong'}),
  clinical:async()=>({valid:true,matches_key:true,stem_sufficient:true,errors:[]}),
  sba:async()=>({defensible_alternative:false,distractor_answer_actually_correct:false,distractor_flaw:'none',single_best:true,leakage:false}) };
const HARD=Object.assign({}, CLEAN, { clinical:async()=>({valid:false,matches_key:false,stem_sufficient:true,errors:['wrong physiology']}) });
const item=(st,extra)=>Object.assign({ id:'x1', question_id:'q1', review_status:st, integration_family:'cardio_renal', primary_topic:'cardio', integrated_topics:['renal'],
  integration_dependency:'K+ from CKD changes the HF drug choice', source_question_ids:['q1'], transformed_content:{ stem:'old stem', options:['a','b','c','d'], answer:0 }, qa:{ severity:'major' } }, extra||{});

// validation
ok(validateEdit(GOOD).ok, 'V1 a well-formed edit validates');
ok(!validateEdit(Object.assign({},GOOD,{stem:'short'})).ok, 'V2 a stub stem is refused');
ok(!validateEdit(Object.assign({},GOOD,{options:['a','b','c']})).ok, 'V3 three options are refused');
ok(!validateEdit(Object.assign({},GOOD,{options:['a','b','a','d']})).ok, 'V4 duplicate options are refused');
ok(!validateEdit(Object.assign({},GOOD,{answer:4})).ok, 'V5 an out-of-range key is refused');
ok(!validateEdit(Object.assign({},GOOD,{options:['a','','c','d']})).ok, 'V6 an empty option is refused');
{ const v=validateEdit(Object.assign({},GOOD,{options:['A. Increase spironolactone','B. Stop it','C. ACEi','D. Amiloride']}));
  ok(v.ok && v.content.options[0]==='Increase spironolactone', 'V7 the option\'s own letter prefix is stripped'); }
{ const v=validateEdit(Object.assign({},GOOD,{rationales:['only one']}));
  ok(v.content.rationales.length===4 && v.content.rationales[1]==='', 'V8 rationales are padded to the option count'); }

// resubmit
{ const r=await resubmitEdited(item('needs_edit'), GOOD, CLEAN, 'frank');
  ok(r.ok && r.review_status==='ai_reviewed', 'E1 a clean edit of a needs_edit item goes back to the human queue');
  ok(r.update.transformed_content.stem===STEM && r.update.transformed_content.answer===1, 'E2 the edited content is what gets saved');
  ok(r.update.qa.edits.length===1 && r.update.qa.edits[0].previous.stem==='old stem' && r.update.qa.edits[0].editor==='frank', 'E3 previous content + editor kept in qa.edits');
  ok(r.review_status!=='approved' && r.update.review_status!=='approved', 'E4 an edit can never come out approved'); }
{ const r=await resubmitEdited(item('needs_edit'), GOOD, HARD, 'frank');
  ok(r.ok && r.review_status==='rejected', 'E5 a hard clinical fail on the edited version rejects it'); }
{ const r=await resubmitEdited(item('approved'), GOOD, CLEAN, 'frank'); ok(!r.ok, 'E6 an approved item cannot be edited'); }
{ const r=await resubmitEdited(item('rejected'), GOOD, CLEAN, 'frank'); ok(!r.ok, 'E7 a rejected item cannot be edited'); }
{ const r=await resubmitEdited(item('ai_reviewed'), GOOD, CLEAN, 'frank'); ok(r.ok, 'E8 an ai_reviewed item can be tidied before approval'); }
{ const r=await resubmitEdited(item('needs_edit'), Object.assign({},GOOD,{answer:9}), CLEAN, 'frank'); ok(!r.ok && /answer/.test(r.error), 'E9 invalid edits are refused before any reviewer runs'); }
{ const seen=[]; const spy={ adversarial:async(q)=>{ seen.push(q.stem); return CLEAN.adversarial(); }, clinical:CLEAN.clinical, sba:CLEAN.sba };
  await resubmitEdited(item('needs_edit'), GOOD, spy, 'frank'); ok(seen[0]===STEM, 'E10 reviewers see the EDITED stem, not the old one'); }
{ const prior=item('needs_edit',{ qa:{ severity:'major', edits:[{ at:'t0', previous:{stem:'older'} }] } });
  const r=await resubmitEdited(prior, GOOD, CLEAN, 'frank'); ok(r.update.qa.edits.length===2, 'E11 edit history accumulates'); }
{ const r=await resubmitEdited(item('needs_edit'), GOOD, CLEAN, 'frank');
  const after=applyHumanReview(Object.assign(item('ai_reviewed'), r.update), 'approve', {dependency:3,coherence:3,educational:3,discrimination:3,targetClarity:2,difficulty:2,noArtificialComplexity:3}, 'frank');
  ok(after.review_status==='approved', 'E12 a resubmitted item can then be approved through the normal human route'); }

// queue order
{ const approved=[...Array(10)].map(()=>({integration_family:'cardio_renal'})).concat([...Array(7)].map(()=>({integration_family:'gi_hepatic'})));
  const q=reviewQueueOrder([
    { id:'full', integration_family:'cardio_renal', qa:{severity:'none'}, created_at:'2026-09-01' },
    { id:'gi-major', integration_family:'gi_hepatic', qa:{severity:'major'}, created_at:'2026-09-01' },
    { id:'gi-clean', integration_family:'gi_hepatic', qa:{severity:'none'}, created_at:'2026-09-05' },
    { id:'onco', integration_family:'onco_haem', qa:{severity:'minor'}, created_at:'2026-09-09' },
  ], approved);
  ok(q.map(x=>x.id).join(',')==='onco,gi-clean,gi-major,full', 'Q1 order = biggest family shortfall → cleanest → oldest ('+q.map(x=>x.id).join(',')+')');
  ok(q[0].queue_priority.family_shortfall===10 && q[1].queue_priority.family_shortfall===3 && q[3].queue_priority.family_shortfall===0, 'Q2 shortfall annotated per item');
  ok(q[1].queue_priority.family_approved===7, 'Q3 approved count annotated per item'); }
{ const q=reviewQueueOrder([{id:'b',integration_family:'x',created_at:'2'},{id:'a',integration_family:'x',created_at:'1'}], []);
  ok(q[0].id==='a', 'Q4 ties fall back to oldest first'); }
ok(reviewQueueOrder([], []).length===0 && reviewQueueOrder(null,null).length===0, 'Q5 empty queue is safe');

console.log('\n'+pass+' passed, '+fail+' failed'); process.exit(fail?1:0);
})();
