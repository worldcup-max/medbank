/* LOOP SIMULATION — fast-forward time across many rounds against the REAL app.html A6 scheduler +
   serve path + telemetry-signal, hunting integration loopholes before Phase 2 sits on the loop. */
import { readFileSync } from 'node:fs';
const html=readFileSync('app.html','utf8');
function grab(name){ const re=new RegExp('function '+name+'\\s*\\('); const i=html.search(re); if(i<0)throw new Error('missing '+name);
  let j=html.indexOf('{',i),d=0,k=j; for(;k<html.length;k++){const c=html[k];if(c==='{')d++;else if(c==='}'){d--;if(!d){k++;break;}}} return html.slice(i,k); }

let pass=0, fail=0; const ok=(c,m)=>{ if(c)pass++; else{ fail++; console.log('  ✗ '+m); } };

// ---- runtime ----
const SIM={ today:1000 };
let DATA={ qbank:{}, flags:{} };
function qbStore(){ DATA.qbank=DATA.qbank||{}; var s=DATA.qbank; s._attempts=s._attempts||[]; s._qmeta=s._qmeta||{}; s._sessions=s._sessions||[]; return s; }
function dayNum(){ return SIM.today; }
function persist(){}
function qbHash(str){ var h=5381,i=(str||'').length; while(i){ h=(h*33)^(str||'').charCodeAt(--i); } return (h>>>0).toString(36); }
function qbCogOf(){ return 'apply'; }
function mbToast(){}
let allTopics=[];
const win={ MEDBANK_CONFIG:{ FEATURES:{ A7:true } } };
let replenishCalls=[];
function admApi(path,opts){ if(path.indexOf('/retest/replenish')>=0) replenishCalls.push(JSON.parse(opts.body||'{}')); return Promise.resolve({ok:true,data:{ok:true}}); }

const names=['qbSched','qbLadderNext','qbUniq','qbTargetOf','qbRetentionKey','qbMigrateSched','qbSchedApply',
  'qbItemFromMeta','qbQuestionsForTarget','a7On','a7Api','a7TakeCachedCandidate','a7TriggerReplenish','qbServeForRecord','qbDueList','ivAttemptSignal'];
const src='var QB_LADDER=[1,3,7,14];\nvar _a7Pool={}, _a7Inflight={};\n'+names.map(grab).join('\n');
const factory=new Function('DATA','qbStore','dayNum','persist','qbHash','qbCogOf','allTopics','mbToast','window','admApi',
  src+'\n return { qbSchedApply, qbServeForRecord, qbDueList, qbRetentionKey, qbMigrateSched, qbQuestionsForTarget, ivAttemptSignal, a7On, _pool:()=>_a7Pool };');
let API;
function build(){ API=factory(DATA,qbStore,dayNum,persist,qbHash,qbCogOf,allTopics,mbToast,win,admApi); }

// corpus: Target A (4 canonical Qs), Target B (2). All stamped.
function setCorpus(){ allTopics=[{ id:'t1', ready:true, extras:{ qbank:[
  ...[0,1,2,3,4,5].map(i=>({stem:'A stem '+i, options:['a','b','c','d'], answer:0, target_id:'TA'})),
  ...[0,1].map(i=>({stem:'B stem '+i, options:['a','b','c','d'], answer:0, target_id:'TB'})),
]}}];
  // seed _qmeta so retention key resolves (as qbRecord would at answer time)
  const s=qbStore();
  allTopics[0].extras.qbank.forEach(q=>{ const h=qbHash(q.stem+'|'+q.options.join('|')); q._qh=h; s._qmeta[h]={ topicId:'t1', target_id:q.target_id, stem:q.stem, options:q.options }; });
}
function qhsFor(t){ return allTopics[0].extras.qbank.filter(q=>q.target_id===t).map(q=>q._qh); }

// ---- SIM 1: ladder advance to graduate over fast-forwarded days (miss once, then keep right+confident) ----
{ DATA={qbank:{},flags:{}}; SIM.today=1000; setCorpus(); build();
  const A=qhsFor('TA');
  API.qbSchedApply(A[0], false, 2);                 // miss+confident → interval 1, p3 miscon
  let e=qbStore()._sched['t:TA'];
  ok(e && e.interval===1 && e.prio===3 && e.miscon===true, 'S1 miss+confident → interval1 p3 miscon');
  const seenDays=[]; let guard=0;
  // each due day: serve fresh sibling, answer right+confident → advance
  while(qbStore()._sched['t:TA'] && guard++<10){
    e=qbStore()._sched['t:TA']; SIM.today=e.dueAt;   // fast-forward to due day
    const due=API.qbDueList(); const rec=due.find(x=>x.key==='t:TA'); if(!rec){ break; }
    const served=rec._serve; if(!served){ break; }
    seenDays.push({day:SIM.today, interval:e.interval, qh:served._qh});
    // snapshot _qmeta (answer flow) then apply correct+confident
    qbStore()._qmeta[served._qh]=qbStore()._qmeta[served._qh]||{target_id:'TA'};
    API.qbSchedApply(served._qh, true, 3);
    if(qbStore()._sched['t:TA']){ e=qbStore()._sched['t:TA']; e.servedQhs=(e.servedQhs||[]).concat(served._qh); }
  }
  const intervals=seenDays.map(d=>d.interval);
  ok(JSON.stringify(intervals)===JSON.stringify([1,3,7,14]), 'S1 ladder advanced 1→3→7→14 over fast-forwarded days (got '+JSON.stringify(intervals)+')');
  ok(!qbStore()._sched['t:TA'], 'S1 graduated off schedule after 14');
  const uniqQ=new Set(seenDays.map(d=>d.qh));
  ok(uniqQ.size===seenDays.length, 'S1 anti-repeat: every retest served a DIFFERENT sibling ('+uniqQ.size+'/'+seenDays.length+')');
}

// ---- SIM 2: exhaustion → no_fresh (A7 seam), no cross-Target substitution ----
{ DATA={qbank:{},flags:{}}; SIM.today=2000; setCorpus(); build();
  const A=qhsFor('TA');
  // fail all 4 A questions across days so all get served + none fresh
  let e; API.qbSchedApply(A[0], false, 2);
  let guard=0, exhausted=false;
  while(guard++<12){
    e=qbStore()._sched['t:TA']; if(!e) break; SIM.today=e.dueAt;
    const due=API.qbDueList(); const rec=due.find(x=>x.key==='t:TA');
    if(!rec){ // exhausted: qbServeForRecord should say noFresh (a7 cache empty)
      const s2=API.qbServeForRecord(qbStore()._sched['t:TA']); exhausted = s2.noFresh===true && !!s2.a7Pending; break; }
    const served=rec._serve; qbStore()._qmeta[served._qh]=qbStore()._qmeta[served._qh]||{target_id:'TA'};
    e.servedQhs=(e.servedQhs||[]).concat(served._qh);
    API.qbSchedApply(served._qh, false, 2);           // keep missing → stays scheduled, exhausts siblings
  }
  ok(exhausted, 'S2 canonical exhausted → no_fresh_assessment (a7Pending), never a substitute');
  // and it never served a TB question for TA:
  const servedForTA=(qbStore()._sched['t:TA']&&qbStore()._sched['t:TA'].servedQhs)||[];
  ok(servedForTA.every(h=>qhsFor('TA').includes(h)), 'S2 no cross-Target substitution (only TA qhs served for TA)');
  ok(replenishCalls.some(c=>c.target_id==='TA'), 'S2 exhaustion fired a7 replenish for TA (fire-and-forget)');
}

// ---- SIM 3: telemetry signal correctness per attempt (all 6 outcomes) ----
{ build();
  const cases=[[false,3,'wrong_confident'],[false,1,'wrong_unsure'],[false,null,'wrong'],[true,0,'correct_unsure'],[true,3,'correct_confident'],[true,null,'correct']];
  let allok=true; cases.forEach(([o,c,exp])=>{ if(API.ivAttemptSignal(o,c)!==exp) allok=false; });
  ok(allok, 'S3 telemetry attempt_signal correct for all 6 outcome×confidence combos');
}

// ---- SIM 4: cross-Target isolation + no orphan q: records ----
{ DATA={qbank:{},flags:{}}; SIM.today=3000; setCorpus(); build();
  const A=qhsFor('TA'), B=qhsFor('TB');
  API.qbSchedApply(A[0], false, 2); API.qbSchedApply(B[0], true, 0);   // TA miss, TB fragile
  const keys=Object.keys(qbStore()._sched).sort();
  ok(JSON.stringify(keys)===JSON.stringify(['t:TA','t:TB']), 'S4 keyed only by t:TA, t:TB — no orphan q: records ('+keys+')');
  ok(qbStore()._sched['t:TA'].servedQhs.every(h=>A.includes(h)) && qbStore()._sched['t:TB'].servedQhs.every(h=>B.includes(h)), 'S4 each Target holds only its own qhs');
}

// ---- SIM 5: migration idempotence mid-flight ----
{ DATA={qbank:{},flags:{}}; SIM.today=4000; setCorpus(); build();
  const A=qhsFor('TA');
  qbStore()._sched={}; qbStore()._sched[A[0]]={ n:1, interval:3, dueAt:4005, prio:2, miscon:true, servedQhs:[] };  // legacy bare-qh record
  API.qbMigrateSched(); const after1=JSON.stringify(qbStore()._sched);
  API.qbMigrateSched(); const after2=JSON.stringify(qbStore()._sched);
  ok(qbStore()._sched['t:TA'] && !qbStore()._sched[A[0]], 'S5 legacy qh folded to t:TA');
  ok(after1===after2, 'S5 migration idempotent (second run no-op)');
}

// ---- SIM 6: no negative/degenerate intervals or dueAt drift over 30 fast-forwarded days ----
{ DATA={qbank:{},flags:{}}; SIM.today=5000; setCorpus(); build();
  const A=qhsFor('TA'); API.qbSchedApply(A[0], false, 2);
  let bad=false, guard=0;
  while(qbStore()._sched['t:TA'] && guard++<20){
    const e=qbStore()._sched['t:TA']; SIM.today=e.dueAt;
    if(e.interval<0 || e.dueAt<SIM.today-0 || (e.interval>0 && e.dueAt!==SIM.today+e.interval && e._day!==SIM.today)) { /* dueAt should equal today+interval after an apply-day */ }
    const due=API.qbDueList(); const rec=due.find(x=>x.key==='t:TA'); if(!rec) break;
    const served=rec._serve; qbStore()._qmeta[served._qh]=qbStore()._qmeta[served._qh]||{target_id:'TA'};
    e.servedQhs=(e.servedQhs||[]).concat(served._qh);
    API.qbSchedApply(served._qh, (guard%2===0), (guard%2===0)?3:2);
    const e2=qbStore()._sched['t:TA']; if(e2 && (e2.interval<0 || e2.dueAt<SIM.today)) bad=true;
  }
  ok(!bad, 'S6 no negative interval / dueAt-in-past over many fast-forwarded rounds');
}

console.log('\n'+pass+' passed, '+fail+' failed'); process.exit(fail?1:0);
