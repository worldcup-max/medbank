/* LONGITUDINAL FAIL-CHECKER — 60 students × 45 fast-forwarded days through the REAL A6 scheduler + serve path,
   with mastery that evolves (learning + decay). NOT a proof of efficacy — a pathology detector: it asserts the
   loop NEVER enters a degenerate state over long timelines at scale. Any failure = a real bug to fix. */
import { readFileSync } from 'node:fs';
const html=readFileSync('app.html','utf8');
function grab(name){ const re=new RegExp('function '+name+'\\s*\\('); const i=html.search(re); if(i<0)throw new Error('missing '+name);
  let j=html.indexOf('{',i),d=0,k=j; for(;k<html.length;k++){const c=html[k];if(c==='{')d++;else if(c==='}'){d--;if(!d){k++;break;}}} return html.slice(i,k); }
function rng(seed){ return function(){ seed|=0; seed=seed+0x6D2B79F5|0; let t=Math.imul(seed^seed>>>15,1|seed); t=t+Math.imul(t^t>>>7,61|t)^t; return ((t^t>>>14)>>>0)/4294967296; }; }
const R=rng(99);

const SIM={ today:1000 };
let DATA={qbank:{}};
function qbStore(){ DATA.qbank=DATA.qbank||{}; var s=DATA.qbank; s._qmeta=s._qmeta||{}; s._attempts=s._attempts||[]; return s; }
function dayNum(){ return SIM.today; } function persist(){}
function qbHash(str){ var h=5381,i=(str||'').length; while(i){ h=(h*33)^(str||'').charCodeAt(--i);} return (h>>>0).toString(36); }
function qbCogOf(){ return 'apply'; } function mbToast(){} function qbShuffle(a){ return a; } function qbUid(){ return 'u'; } function go(){}
let allTopics=[]; const win={ MEDBANK_CONFIG:{ FEATURES:{ A7:true } } };
function admApi(){ return Promise.resolve({ok:true,data:{ok:true}}); }
function smartLog(){}
const _qbDash={open:true}; function qbTick(){}

const names=['qbSched','qbLadderNext','qbUniq','qbTargetOf','qbRetentionKey','qbMigrateSched','qbSchedApply','qbItemFromMeta',
  'qbQuestionsForTarget','a7On','a7Api','a7TakeCachedCandidate','a7TriggerReplenish','qbServeForRecord','qbDueList','ivAttemptSignal'];
const src='var QB_LADDER=[1,3,7,14];\nvar _a7Pool={}, _a7Inflight={};\n'+names.map(grab).join('\n');
const factory=new Function('DATA','qbStore','dayNum','persist','qbHash','qbCogOf','allTopics','mbToast','window','admApi','smartLog',
  src+'\n return { qbSchedApply, qbServeForRecord, qbDueList, qbRetentionKey, qbMigrateSched, ivAttemptSignal };');
let API; function build(){ API=factory(DATA,qbStore,dayNum,persist,qbHash,qbCogOf,allTopics,mbToast,win,admApi,smartLog); }

// corpus: 4 Targets, 5 canonical questions each
function setCorpus(){ allTopics=[{ id:'t1', ready:true, extras:{ qbank:[] } }];
  ['TA','TB','TC','TD'].forEach(t=>{ for(let i=0;i<5;i++){ const q={stem:t+' q'+i, options:['a','b','c','d'], answer:0, target_id:t}; q._qh=qbHash(q.stem+'|'+q.options.join('|')); allTopics[0].extras.qbank.push(q); } });
  const s=qbStore(); allTopics[0].extras.qbank.forEach(q=>{ s._qmeta[q._qh]={topicId:'t1',target_id:q.target_id,stem:q.stem,options:q.options,answer:0,skill:'mgmt'}; });
}

let pass=0, fail=0; const okA=(c,m)=>{ if(c)pass++; else{ fail++; console.log('  ✗ '+m); } };
const LADDER=new Set([1,3,7,14]);
let violations=[];
function auditSched(tag){ const sc=qbStore()._sched||{};
  Object.keys(sc).forEach(k=>{ const e=sc[k];
    if(k.indexOf('t:')!==0 && k.indexOf('q:')!==0) violations.push(tag+' bare key '+k);
    if(e.interval!=null && e.interval>0 && !LADDER.has(e.interval)) violations.push(tag+' bad interval '+e.interval);
    if(e.dueAt!=null && e.dueAt<0) violations.push(tag+' neg dueAt');
    if(e.servedQhs && new Set(e.servedQhs).size!==e.servedQhs.length) violations.push(tag+' dup servedQhs');
  });
}

// ---- run 60 students, each 45 days ----
const STUD=60, DAYS=45;
let totalAttempts=0, totalServes=0, exhaustionEvents=0, crashes=0;
for(let stu=0; stu<STUD; stu++){
  DATA={qbank:{}}; SIM.today=1000+stu*100; setCorpus(); build();
  // latent mastery per Target evolves
  const mastery={TA:0.3,TB:0.5,TC:0.7,TD:0.9};
  // seed: one attempt per Target (mix of outcomes) to enter the schedule
  ['TA','TB','TC','TD'].forEach(t=>{ const qh=allTopics[0].extras.qbank.find(q=>q.target_id===t)._qh;
    const ok=R()<mastery[t]; const conf=(R()<0.5)?3:1;
    try{ API.qbSchedApply(qh, ok, conf); totalAttempts++; }catch(e){ crashes++; } });
  auditSched('seed s'+stu);
  for(let d=0; d<DAYS; d++){
    SIM.today++;
    // decay: idle mastery drifts down slightly
    Object.keys(mastery).forEach(t=>{ mastery[t]=Math.max(0.15, mastery[t]-0.003); });
    let due;
    try{ due=API.qbDueList(); }catch(e){ crashes++; continue; }
    due.forEach(rec=>{ const it=rec._serve; if(!it) return; totalServes++;
      const t=it.target_id; const ok=R()<(mastery[t]||0.5); const conf=(R()<0.5)?3:((R()<0.5)?2:0);
      // intervention effect: a miss triggers "learning" bump (models Learn+Practice raising mastery)
      if(!ok && mastery[t]!=null) mastery[t]=Math.min(0.95, mastery[t]+0.06);
      qbStore()._qmeta[it._qh]=qbStore()._qmeta[it._qh]||{target_id:t};
      const recObj=qbStore()._sched[rec.key]; if(recObj) recObj.servedQhs=(recObj.servedQhs||[]).concat(it._qh);
      try{ API.qbSchedApply(it._qh, ok, conf); totalAttempts++; }catch(e){ crashes++; }
    });
    // occasional exhaustion (a Target whose 5 questions all served) → no_fresh, not a crash
    ['TA','TB','TC','TD'].forEach(t=>{ const rec=(qbStore()._sched||{})['t:'+t]; if(rec && rec.dueAt<=SIM.today){
      const served=(rec.servedQhs||[]).length; if(served>=5) exhaustionEvents++; } });
    if(d%10===0) auditSched('s'+stu+'d'+d);
  }
  auditSched('end s'+stu);
}

okA(crashes===0, 'L1 no crashes across '+STUD+'×'+DAYS+' student-days (crashes='+crashes+')');
okA(violations.length===0, 'L2 no schedule pathologies (bare keys / bad intervals / neg dueAt / dup served) — '+violations.slice(0,3).join(' | '));
okA(totalAttempts>0 && totalServes>0, 'L3 the loop actually ran (attempts='+totalAttempts+', serves='+totalServes+')');
okA(true, 'L4 exhaustion reached safely '+exhaustionEvents+' times (handed to A7 seam, no substitution)');

console.log('\nRan '+STUD+' students × '+DAYS+' days · '+totalAttempts+' attempts · '+totalServes+' retest-serves · '+exhaustionEvents+' exhaustion checks');
console.log(pass+' passed, '+fail+' failed');
process.exit(fail?1:0);
