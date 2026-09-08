/* 01.5b — resolver evidence. Two things must hold:
     1. every decision now carries candidate_count + nearest_candidate_* (including NEW)
     2. NO decision STATE changes as a result — this is instrumentation, not behaviour
   Run: node qa/v18-resolver-evidence.mjs                                                  */
import { decide, RECON } from '../import-server/targets.mjs';

let pass=0, fail=0;
const t=(n,got,want)=>{ const ok=JSON.stringify(got)===JSON.stringify(want); ok?pass++:fail++;
  console.log((ok?'PASS':'FAIL')+' | '+n.padEnd(58)+' | '+JSON.stringify(got)+(ok?'':' want '+JSON.stringify(want))); };

const P = { topic:'Neonatal sepsis', skill:'management', knowledge_statement:'Empiric ampicillin and gentamicin after cultures.' };
const C = (id,tier)=>({ target_id:id, _tier:tier, canonical_statement:'x', excludes:[] });

console.log('--- the two NEW cases are now distinguishable ---');
const noCand = decide(P, [], null, RECON);
t('no candidates → state NEW',            noCand.state, 'NEW');
t('no candidates → candidate_count 0',    noCand.candidate_count, 0);
t('no candidates → nearest is null',      noCand.nearest_candidate_score, null);
t('no candidates → note unchanged',       noCand.note, 'no candidate in this topic+skill');

const rejected = decide(P, [C('NS-MGMT-001','T1'),C('NS-MGMT-009','T2')], { target_id:'NS-MGMT-001', confidence:0.20 }, RECON);
t('rejected → still state NEW',           rejected.state, 'NEW');
t('rejected → candidate_count 2',         rejected.candidate_count, 2);
t('rejected → nearest id recorded',       rejected.nearest_candidate_id, 'NS-MGMT-001');
t('rejected → nearest SCORE recorded',    rejected.nearest_candidate_score, 0.20);
t('rejected → model_decision NOT_SAME',   rejected.model_decision, 'NOT_SAME');
t('rejected → matched_via recorded',      rejected.matched_via, 'T1');

console.log('\n--- THE POINT: two NEWs that used to look identical no longer do ---');
console.log('   no-candidate NEW :', JSON.stringify({count:noCand.candidate_count, nearest:noCand.nearest_candidate_score}));
console.log('   rejected NEW     :', JSON.stringify({count:rejected.candidate_count, nearest:rejected.nearest_candidate_score}));
t('the two NEWs are now distinguishable',
  noCand.candidate_count===rejected.candidate_count && noCand.nearest_candidate_score===rejected.nearest_candidate_score, false);

console.log('\n--- BEHAVIOUR UNCHANGED: every state is what it was before ---');
t('high confidence → MATCH',      decide(P,[C('A','T1')],{target_id:'A',confidence:0.92},RECON).state, 'MATCH');
t('uncertainty band → AMBIGUOUS', decide(P,[C('A','T1')],{target_id:'A',confidence:0.60},RECON).state, 'AMBIGUOUS');
t('near-miss ≥0.30 → AMBIGUOUS',  decide(P,[C('A','T1')],{target_id:'A',confidence:0.35},RECON).state, 'AMBIGUOUS');
t('below near-miss → NEW',        decide(P,[C('A','T1')],{target_id:'A',confidence:0.10},RECON).state, 'NEW');
t('near-tie → AMBIGUOUS',         decide(P,[C('A','T1'),C('B','T1')],{target_id:'A',confidence:0.90,second_id:'B',second_confidence:0.85},RECON).state, 'AMBIGUOUS');
t('excludes conflict → AMBIGUOUS',
  decide({...P, knowledge_statement:'dose adjustment in renal failure'},
         [{target_id:'A',_tier:'T1',canonical_statement:'x',excludes:['dose adjustment']}],
         {target_id:'A',confidence:0.95}, RECON).state, 'AMBIGUOUS');
t('out-of-set choice → NEW',      decide(P,[C('A','T1')],{target_id:'ZZZ',confidence:0.99},RECON).state, 'NEW');

console.log('\n--- MATCH carries evidence too ---');
const m = decide(P,[C('A','T1')],{target_id:'A',confidence:0.92},RECON);
t('MATCH → candidate_count',      m.candidate_count, 1);
t('MATCH → nearest score = conf', m.nearest_candidate_score, 0.92);
t('MATCH → target_id preserved',  m.target_id, 'A');

console.log('\n'+pass+' passed, '+fail+' failed');
process.exit(fail?1:0);
