/* A7.4 — client wiring test. Extracts the REAL app.html functions and proves the serve-path constraints,
   with the network (admApi) mocked. Live DB serving is out of scope until the migration is applied. */
import { readFileSync } from 'node:fs';
const html=readFileSync('app.html','utf8');
function grab(name){ const re=new RegExp('function '+name+'\\s*\\(');
  const i=html.search(re); if(i<0) throw new Error('missing '+name);
  let j=html.indexOf('{',i),d=0,k=j; for(;k<html.length;k++){const c=html[k]; if(c==='{')d++; else if(c==='}'){d--; if(!d){k++;break;}}} return html.slice(i,k); }

let pass=0, fail=0; const ok=(c,m)=>{ if(c)pass++; else{ fail++; console.log('  ✗ '+m); } };

/* ---- injected runtime ---- */
let DATA={ flags:{ a7:false } };
let _store={ _qmeta:{} };
function qbStore(){ return _store; }
function qbHash(str){ var h=5381,i=(str||'').length; while(i){ h=(h*33)^(str||'').charCodeAt(--i); } return (h>>>0).toString(36); }
function qbCogOf(){ return 'apply'; }
function dayNum(){ return 100; }
let allTopics=[];
/* admApi mock — records calls; the pending promise is controllable */
let apiCalls=[]; let apiMode='resolve'; let pendingResolvers=[];
function admApi(path, opts){ apiCalls.push({path, body:opts&&opts.body}); 
  if(apiMode==='pending'){ return new Promise((res,rej)=>pendingResolvers.push({res,rej})); }
  if(apiMode==='reject'){ return Promise.reject(new Error('net fail')); }
  return Promise.resolve({ ok:true, data:{ ok:true, item:{ stem:'gen', options:['a','b','c','d'], answer:0 }, qh:'genqh' } }); }

const names=['qbItemFromMeta','qbQuestionsForTarget','a7On','a7Api','a7TriggerReplenish','a7TakeCachedCandidate','qbServeForRecord'];
let src='var _a7Pool={}, _a7Inflight={};\n'+names.map(grab).join('\n');
const factory=new Function('DATA','qbStore','qbHash','qbCogOf','dayNum','allTopics','admApi','window',
  src+'\n return { qbServeForRecord, a7TriggerReplenish, a7TakeCachedCandidate, a7On, _get:()=>({_a7Pool,_a7Inflight}) };');
let API;
let _win={};
function build(){ API=factory(DATA,qbStore,qbHash,qbCogOf,dayNum,allTopics,admApi,_win); }

function setCorpus(targetId, n){ allTopics=[{ id:'t1', ready:true, extras:{ qbank: Array.from({length:n},(_,i)=>({ stem:'Q'+i+' '+targetId, options:['a','b','c','d'], answer:0, target_id:targetId })) } }]; }
function rec(targetId, served){ return { key:'t:'+targetId, servedQhs:served||[] }; }
const X='T-X';

/* Row 1 — A7 OFF: canonical present → serve canonical; no network; exhausted → noFresh, no network */
{ DATA.flags.a7=false; apiCalls=[]; apiMode='resolve'; setCorpus(X,2); build();
  const r=API.qbServeForRecord(rec(X,[]));
  ok(r.item && !r.a7 && apiCalls.length===0, 'R1 A7 off: canonical served, zero network');
  const r2=API.qbServeForRecord(rec(X, allTopics[0].extras.qbank.map(q=>qbHash(q.stem+'|'+q.options.join('|')))));
  ok(r2.noFresh===true && apiCalls.length===0, 'R1 A7 off: exhausted → noFresh, zero network'); }

/* Row 2 — A7 ON, canonical present but NOT last → serve canonical, no replenish */
{ DATA.flags.a7=true; apiCalls=[]; apiMode='resolve'; setCorpus(X,2); build();
  const r=API.qbServeForRecord(rec(X,[]));
  ok(r.item && !r.a7, 'R2 canonical served');
  ok(apiCalls.length===0, 'R2 not-last canonical → NO replenish fired'); }

/* Row 3 — A7 ON, LAST canonical (pool==1) → serve canonical + replenish fired once */
{ DATA.flags.a7=true; apiCalls=[]; apiMode='resolve'; setCorpus(X,1); build();
  const r=API.qbServeForRecord(rec(X,[]));
  ok(r.item && r.item.stem.indexOf('Q0')===0, 'R3 last canonical served');
  ok(apiCalls.length===1 && apiCalls[0].path==='/retest/replenish', 'R3 last canonical → replenish fired once'); }

/* Row 4 — CRITICAL: last-canonical served result is identical whether A7 later fails or succeeds */
{ DATA.flags.a7=true; setCorpus(X,1); 
  apiCalls=[]; apiMode='reject'; build();
  const rFail=API.qbServeForRecord(rec(X,[]));
  apiCalls=[]; apiMode='resolve'; build();
  const rOk=API.qbServeForRecord(rec(X,[]));
  ok(rFail.item && rOk.item && rFail.item.stem===rOk.item.stem && rFail.item.stem.indexOf('Q0')===0,
     'R4 CRITICAL: served canonical identical under A7 failure vs success');
  ok(!rFail.a7 && !rOk.a7, 'R4 the served item is the CANONICAL one (not an A7 item) in both cases'); }

/* Row 5 — exhausted + cached candidate → serve pool candidate, target_id=X (retention parity) */
{ DATA.flags.a7=true; apiCalls=[]; apiMode='resolve'; setCorpus(X,1); build();
  const served=[qbHash(allTopics[0].extras.qbank[0].stem+'|'+allTopics[0].extras.qbank[0].options.join('|'))];
  API._get()._a7Pool[X]=[{ stem:'A7 retest', options:['a','b','c','d'], answer:0, _qh:'poolqh' }];
  const r=API.qbServeForRecord(rec(X, served));
  const retentionKey=q=> q.target_id?('t:'+q.target_id):('q:'+q._qh);
  ok(r.item && r.a7===true, 'R5 exhausted → A7 pool candidate served');
  ok(r.item.target_id===X && retentionKey(r.item)==='t:'+X, 'R5 pool item keys t:X (retention parity, constraint 6)'); }

/* Row 6 — exhausted + no cache → noFresh + a7Pending */
{ DATA.flags.a7=true; apiCalls=[]; apiMode='resolve'; setCorpus(X,1); build();
  const served=[qbHash(allTopics[0].extras.qbank[0].stem+'|'+allTopics[0].extras.qbank[0].options.join('|'))];
  const r=API.qbServeForRecord(rec(X, served));
  ok(r.noFresh===true && r.a7Pending===true && r.targetId===X, 'R6 exhausted, no cache → noFresh + a7Pending'); }

/* Row 7 — idempotence: 5 rapid triggers while in-flight → exactly ONE network POST (constraint 8) */
{ DATA.flags.a7=true; apiCalls=[]; apiMode='pending'; build();
  for(let i=0;i<5;i++) API.a7TriggerReplenish(X);
  ok(apiCalls.length===1, 'R7 idempotent: 5 triggers, 1 in-flight POST (got '+apiCalls.length+')');
  pendingResolvers.forEach(p=>p.res({ok:true,data:{}}));
  await Promise.resolve(); await Promise.resolve();
  API.a7TriggerReplenish(X);
  ok(apiCalls.length===2, 'R7 after settle, a new trigger is allowed again'); }

/* Row 8 — pool lookup ONLY after canonical exhaustion: cached candidate NOT consumed while canonical present */
{ DATA.flags.a7=true; apiCalls=[]; apiMode='resolve'; setCorpus(X,2); build();
  API._get()._a7Pool[X]=[{ stem:'A7 retest', options:['a','b','c','d'], answer:0, _qh:'poolqh' }];
  const r=API.qbServeForRecord(rec(X,[]));
  ok(!r.a7 && API._get()._a7Pool[X].length===1, 'R8 canonical present → pool candidate untouched (constraint 3)'); }

console.log('\n'+pass+' passed, '+fail+' failed');
process.exit(fail?1:0);
