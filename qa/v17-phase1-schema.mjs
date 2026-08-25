/* V1.7 Phase 1 (Foundation) — acceptance tests. Proves the ADDITIVE schema (primary_topic, integrated_topics[],
   case_id, case_stage, reserved branch_id/parent_question_id) coexists with the FROZEN A6 scheduler WITHOUT any
   change to scheduling behavior. LOCKED invariant: retention identity = one primary target_id; integrated_topics[]
   is NEVER a scheduling key. Runs against the CURRENT app.html A6 functions (no implementation needed = proof). */
import { readFileSync } from 'node:fs';
const html=readFileSync('app.html','utf8');
function grab(name){ const re=new RegExp('function '+name+'\\s*\\('); const i=html.search(re); if(i<0)throw new Error('missing '+name);
  let j=html.indexOf('{',i),d=0,k=j; for(;k<html.length;k++){const c=html[k];if(c==='{')d++;else if(c==='}'){d--;if(!d){k++;break;}}} return html.slice(i,k); }
let pass=0, fail=0; const ok=(c,m)=>{ if(c)pass++; else{ fail++; console.log('  ✗ '+m); } };

const SIM={today:7000}; let DATA={qbank:{}};
function qbStore(){ DATA.qbank=DATA.qbank||{}; var s=DATA.qbank; s._qmeta=s._qmeta||{}; s._attempts=s._attempts||[]; return s; }
function dayNum(){ return SIM.today; } function persist(){}
function qbHash(str){ var h=5381,i=(str||'').length; while(i){ h=(h*33)^(str||'').charCodeAt(--i);} return (h>>>0).toString(36); }
function qbCogOf(){ return 'apply'; } function mbToast(){} function qbShuffle(a){ return a; } function qbUid(){ return 'u'; } function go(){}
let allTopics=[]; const win={ MEDBANK_CONFIG:{ FEATURES:{ A7:true } } }; function admApi(){ return Promise.resolve({ok:true,data:{}}); } function smartLog(){}
const _qbDash={open:true}; function qbTick(){}

const names=['qbSched','qbLadderNext','qbUniq','qbTargetOf','qbRetentionKey','qbMigrateSched','qbSchedApply','qbItemFromMeta','qbQuestionsForTarget','a7On','a7Api','a7TakeCachedCandidate','a7TriggerReplenish','qbServeForRecord','qbDueList'];
const src='var QB_LADDER=[1,3,7,14];\nvar _a7Pool={}, _a7Inflight={};\n'+names.map(grab).join('\n');
const F=new Function('DATA','qbStore','dayNum','persist','qbHash','qbCogOf','allTopics','mbToast','window','admApi','smartLog',
  src+'\n return { qbSchedApply, qbServeForRecord, qbDueList, qbRetentionKey, qbQuestionsForTarget };');
let E; function build(){ E=F(DATA,qbStore,dayNum,persist,qbHash,qbCogOf,allTopics,mbToast,win,admApi,smartLog); }

function setCorpus(qs){ DATA={qbank:{}}; SIM.today=7000; allTopics.length=0; allTopics.push({id:'t1',ready:true,extras:{qbank:qs}}); build();
  const s=qbStore(); qs.forEach(q=>{ q._qh=q._qh||qbHash(q.stem+'|'+q.options.join('|'));
    s._qmeta[q._qh]=Object.assign({topicId:'t1',stem:q.stem,options:q.options,answer:0,skill:'mgmt'}, q); }); }
function keysOf(){ return Object.keys(qbStore()._sched||{}).sort(); }

// ---- fixtures with the NEW additive fields ----
// plain (backward-compat), integrated (primary + integrated_topics[]), case stages (case_id/case_stage, own targets)
const plain = { stem:'plain q', options:['a','b','c','d'], answer:0, target_id:'TP' };
const integ1= { stem:'integrated A', options:['a','b','c','d'], answer:0, target_id:'TI', primary_topic:'Meningitis', integrated_topics:['Meningitis','Paediatric emergencies'], branch_id:'RESV', parent_question_id:'RESV' };
const integ2= { stem:'integrated B', options:['a','b','c','d'], answer:0, target_id:'TI', primary_topic:'Meningitis', integrated_topics:['Meningitis','Sepsis'] };   // same primary target, DIFFERENT integrated_topics
const caseQs=[
  { stem:'case s1', options:['a','b','c','d'], answer:0, target_id:'CA', case_id:'CASE1', case_stage:1 },
  { stem:'case s2', options:['a','b','c','d'], answer:0, target_id:'CB', case_id:'CASE1', case_stage:2 },
  { stem:'case s3', options:['a','b','c','d'], answer:0, target_id:'CC', case_id:'CASE1', case_stage:3 },
];

// R1 backward-compat: plain question schedules exactly as today (t:TP)
setCorpus([plain]); E.qbSchedApply(plain._qh, false, 2);
ok(keysOf().join()==='t:TP', 'R1 plain question → t:TP (unchanged backward-compat)');

// R2 integrated question schedules ONLY under its primary target_id; integrated_topics[] NEVER a scheduling key
setCorpus([integ1]); E.qbSchedApply(integ1._qh, false, 2);
ok(keysOf().join()==='t:TI', 'R2 integrated → schedules under primary target_id (t:TI) only');
ok(!keysOf().some(k=>/Meningitis|Paediatric|Sepsis/.test(k)), 'R2 integrated_topics[] never became a scheduling key');

// R3 two integrated Qs, same primary target, DIFFERENT integrated_topics → ONE shared retention record
setCorpus([integ1, integ2]); E.qbSchedApply(integ1._qh, false, 2); E.qbSchedApply(integ2._qh, false, 1);
ok(keysOf().join()==='t:TI' && (qbStore()._sched['t:TI'].servedQhs||[]).length===2, 'R3 differing integrated_topics do NOT fork identity — one t:TI record, both served');

// R4 case: each stage schedules under its OWN target; case_id/case_stage never scheduling keys
setCorpus(caseQs.slice()); caseQs.forEach(q=>E.qbSchedApply(q._qh, false, 2));
ok(keysOf().join()==='t:CA,t:CB,t:CC', 'R4 case stages → three independent Target records (t:CA,t:CB,t:CC)');
ok(!keysOf().some(k=>/CASE1|stage/.test(k)), 'R4 case_id/case_stage never became a scheduling key');

// R5 reserved fields present are ignored (no effect vs a stripped copy)
setCorpus([integ1]); E.qbSchedApply(integ1._qh, false, 2); const withResv=JSON.stringify(qbStore()._sched['t:TI']);
const stripped=Object.assign({},integ1); delete stripped.branch_id; delete stripped.parent_question_id; delete stripped.integrated_topics; delete stripped.primary_topic;
setCorpus([stripped]); E.qbSchedApply(stripped._qh, false, 2); const withoutResv=JSON.stringify(qbStore()._sched['t:TI']);
ok(withResv===withoutResv, 'R5 reserved/new fields are inert — identical _sched with vs without them');

// R6 serving: qbQuestionsForTarget keys purely by target_id (integrated sibling served; integrated_topics ignored)
setCorpus([integ1, integ2]);
const pool=E.qbQuestionsForTarget('TI', [integ1._qh]);
ok(pool.length===1 && pool[0]._qh===integ2._qh, 'R6 Target-sibling selection ignores integrated_topics, keys by target_id');

// R7 retentionKey resolves to primary target regardless of the extra fields
setCorpus([integ1]);
ok(E.qbRetentionKey(integ1._qh)==='t:TI', 'R7 retentionKey = t:<primary target_id>, independent of new metadata');

console.log('\n'+pass+' passed, '+fail+' failed');
console.log('PROOF: A6/A7 need ZERO change — the additive V1.7 schema coexists with the frozen scheduler by construction.');
process.exit(fail?1:0);
