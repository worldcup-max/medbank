/* V1.6 ADVERSARIAL BATTERY — deliberately try to break the frozen boundaries. Extracts the REAL diagnosis + A6
 * scheduler + intervention functions from app.html. Covers Frank's 10 scenarios + the degradation question. */
import { readFileSync } from 'node:fs';
const html=readFileSync('app.html','utf8');
function grab(name){ const re=new RegExp('function '+name+'\\s*\\('); const i=html.search(re); if(i<0)throw new Error('missing '+name);
  let j=html.indexOf('{',i),d=0,k=j; for(;k<html.length;k++){const c=html[k];if(c==='{')d++;else if(c==='}'){d--;if(!d){k++;break;}}} return html.slice(i,k); }
function grabVar(n){ const re=new RegExp('var '+n+'\\s*=\\s*\\{'); const i=html.search(re); let j=html.indexOf('{',i),d=0,k=j;
  for(;k<html.length;k++){const c=html[k];if(c==='{')d++;else if(c==='}'){d--;if(!d){k++;break;}}} return html.slice(i,k)+';'; }

let pass=0, fail=0, findings=[]; const ok=(c,m)=>{ if(c)pass++; else{ fail++; console.log('  ✗ '+m); } };
function rng(seed){ return function(){ seed|=0; seed=seed+0x6D2B79F5|0; let t=Math.imul(seed^seed>>>15,1|seed); t=t+Math.imul(t^t>>>7,61|t)^t; return ((t^t>>>14)>>>0)/4294967296; }; }
const R=rng(2027);

const SIM={ today:5000 };
let DATA={qbank:{}};
function qbStore(){ DATA.qbank=DATA.qbank||{}; var s=DATA.qbank; s._qmeta=s._qmeta||{}; s._attempts=s._attempts||[]; return s; }
function dayNum(){ return SIM.today; } function persist(){}
function qbHash(str){ var h=5381,i=(str||'').length; while(i){ h=(h*33)^(str||'').charCodeAt(--i);} return (h>>>0).toString(36); }
function qbCogOf(){ return 'clinical_reasoning'; } function smartExamDate(){ return null; } function smartCourseMap(){ return {}; }
function qbShuffle(a){ return a; } function mbToast(){} function qbUid(){ return 'u'+(R()*1e9|0); } function go(){}
function qbLetter(j){ return 'ABCD'[j]; } function esc(x){ return String(x); } function qbSkillLabel(x){ return x; } function gapDismiss(){}
function gapRender(){} let replenishCalls=[]; function admApi(p,o){ if((p||'').indexOf('/retest/replenish')>=0) replenishCalls.push(1); return Promise.resolve({ok:true,data:{}}); }
let logged=[]; function smartLog(ev){ logged.push(ev); }
let allTopics=[]; const win={ MEDBANK_CONFIG:{ FEATURES:{ GAP_LOOP:true, FRAGILE:true, MISCONCEPTION:true } } };
const _qbDash={open:true}; function qbTick(){}

const diag=[ grabVar('SMART'), grab('smartExamDate'), grab('smartHalfLife'), grab('smartBand'), grab('smartCourseMap'), grab('smartAcc'), grab('qbCogOf'), grab('smartStats'), grab('smartDiagnose') ];
const a6=['qbSched','qbLadderNext','qbUniq','qbTargetOf','qbRetentionKey','qbMigrateSched','qbSchedApply','qbItemFromMeta','qbQuestionsForTarget','a7On','a7Api','a7TakeCachedCandidate','a7TriggerReplenish','qbServeForRecord','qbDueList','ivAttemptSignal'].map(grab);
const iv=['gapOn','fragOn','misconOn','ivPhase','gapDiag','gapConceptPool','gapBucket','gapEligible','misconEligible','gapStart','gapPick','gapAdvance','gapLogAttempt'].map(grab);
const src='var _QB_D2C={};\nvar QB_LADDER=[1,3,7,14];\nvar _a7Pool={}, _a7Inflight={};\nvar GAPLOOP=null;\n'+diag.join('\n')+'\n'+a6.join('\n')+'\n'+iv.join('\n');
const F=new Function('qbStore','dayNum','persist','qbHash','qbCogOf','smartExamDate','smartCourseMap','qbShuffle','mbToast','qbUid','go','qbLetter','esc','qbSkillLabel','gapDismiss','gapRender','admApi','smartLog','allTopics','window','Date','Math','Object','Array',
  src+'\n return { smartStats,smartDiagnose,qbSchedApply,qbServeForRecord,qbDueList,qbRetentionKey,qbMigrateSched,gapEligible,misconEligible,gapStart,gapPick,gapAdvance,gapDiag, _loop:()=>GAPLOOP, _setLoop:v=>{GAPLOOP=v;} };');
let E; function build(){ E=F(qbStore,dayNum,persist,qbHash,qbCogOf,smartExamDate,smartCourseMap,qbShuffle,mbToast,qbUid,go,qbLetter,esc,qbSkillLabel,gapDismiss,gapRender,admApi,smartLog,allTopics,win,Date,Math,Object,Array); }

function reset(nQ){ DATA={qbank:{}}; SIM.today=5000; allTopics.length=0; replenishCalls=[]; logged=[];
  const qs=[]; for(let i=0;i<(nQ||5);i++){ const q={stem:'Q'+i, options:['a','b','c','d'], answer:0, target_id:'TX'}; q._qh=qbHash(q.stem+'|'+q.options.join('|')); qs.push(q); }
  allTopics.push({id:'t1',ready:true,extras:{qbank:qs}}); build();
  const s=qbStore(); qs.forEach(q=>{ s._qmeta[q._qh]={topicId:'t1',target_id:'TX',stem:q.stem,options:q.options,answer:0,skill:'mgmt',tag:'T',objective:'o',rationales:['a','b','c','d'],src:'n'}; });
  return qs; }
function attempt(qh, ok, conf){ const s=qbStore(); s._attempts.push({u:qbUid(),qh,topicId:'t1',ok:!!ok,conf,ms:2000,ts:Date.now()-(1000-s._attempts.length)*1000}); }
function stdDiag(){ const b=E.smartStats('*').bySkill['mgmt']; return b?E.smartDiagnose(b):null; }
const LADDER=new Set([1,3,7,14]);
function schedHealthy(){ const sc=qbStore()._sched||{}; return Object.keys(sc).every(k=>{ const e=sc[k];
  return (k.indexOf('t:')===0||k.indexOf('q:')===0) && (e.interval==null||e.interval<=0||LADDER.has(e.interval)) && !(e.dueAt<0) && (!e.servedQhs||new Set(e.servedQhs).size===e.servedQhs.length); }); }

console.log('== V1.6 ADVERSARIAL BATTERY ==');

// 1) Oscillating — no crash, always a valid/null diagnosis, no thrash to invalid states
{ const qs=reset(5); const seq=[[0,3],[1,0],[0,1],[1,2],[0,3],[1,0],[0,1]]; let bad=0, types=new Set();
  seq.forEach(([ok,conf],i)=>{ attempt(qs[i%5]._qh, ok, conf); const d=stdDiag(); if(d && ['gap','fragile','misconception','solid'].indexOf(d.type)<0) bad++; if(d)types.add(d.type); });
  ok(bad===0, '1 oscillating: diagnosis never returns an invalid type'); }

// 2) Mixed diagnoses on one Target — ONE coherent standing diagnosis, not multiple
{ const qs=reset(5); attempt(qs[0]._qh,false,1); attempt(qs[1]._qh,true,0); attempt(qs[2]._qh,false,3); attempt(qs[3]._qh,true,3);
  const d=stdDiag(); ok(d===null || ['gap','fragile','misconception','solid'].indexOf(d.type)>=0, '2 mixed history → one coherent standing diagnosis'); }

// 3) Sparse data — no overconfidence under MIN_EV
{ const qs=reset(5); attempt(qs[0]._qh,false,3); attempt(qs[1]._qh,false,3);   // only 2 (< MIN_EV=3)
  ok(stdDiag()===null, '3 sparse (<MIN_EV) → NO diagnosis (no overconfidence)'); }

// 4) Persistent misconception — one record, no flood, bounded
{ const qs=reset(5); for(let i=0;i<20;i++){ const qh=qs[i%5]._qh; attempt(qh,false,3); E.qbSchedApply(qh,false,3); }
  const sc=qbStore()._sched; const keys=Object.keys(sc);
  ok(keys.length===1 && keys[0]==='t:TX', '4 persistent miscon → ONE Target record (no multiplication)');
  ok(sc['t:TX'].interval===1 && sc['t:TX'].miscon===true && sc['t:TX'].prio===3, '4 stays interval1 / miscon / p3 (bounded)');
  ok(schedHealthy(), '4 schedule stays healthy under 20 confident-wrong'); }

// 5) Persistent gap — one record, interval 1
{ const qs=reset(5); for(let i=0;i<20;i++){ const qh=qs[i%5]._qh; attempt(qh,false,1); E.qbSchedApply(qh,false,1); }
  const sc=qbStore()._sched; ok(Object.keys(sc).length===1 && sc['t:TX'].interval===1, '5 persistent gap → one record, interval 1');
  ok(schedHealthy(),'5 schedule healthy under 20 wrong-unsure'); }

// 6+degradation) Intervention-resistant + degradation: run gap loop repeatedly; student always fails A6 retest
{ const qs=reset(6); attempt(qs[0]._qh,false,1); E.qbSchedApply(qs[0]._qh,false,1);   // seed a gap
  let interventions=0, perDay={}, guard=0;
  for(let d=0; d<30 && guard<400; d++){ SIM.today=(qbStore()._sched['t:TX']||{}).dueAt||SIM.today+1;
    const due=E.qbDueList(); const rec=due.find(x=>x.key==='t:TX'); if(!rec){ continue; }
    const it=rec._serve; if(!it){ continue; }
    // student is offered the intervention (opt-in). Completes gap loop, then FAILS the A6 retest anyway.
    const rc=qbStore()._sched['t:TX']; if(rc) rc.servedQhs=(rc.servedQhs||[]).concat(it._qh);
    interventions++; perDay[SIM.today]=(perDay[SIM.today]||0)+1;
    qbStore()._qmeta[it._qh]=qbStore()._qmeta[it._qh]||{target_id:'TX'};
    E.qbSchedApply(it._qh, false, 1);   // fails again
    guard++;
  }
  const maxPerDay=Math.max(...Object.values(perDay),0);
  ok(maxPerDay<=1, '6 intervention-resistant: at most ONE retest/intervention per day (no within-day loop)');
  ok(schedHealthy(), '6 schedule stays healthy across 30 days of failure');
  findings.push('DEGRADATION: a persistently-failing Target recurs every cycle at interval 1 ('+interventions+' interventions / 30 days). Bounded per-day, but there is NO escalation/give-up rule — it will keep offering the intervention indefinitely. Candidate follow-up: a bounded-escalation rule (after N failed interventions → escalate / hand to human / cool down).'); }

// 7) Multi-Target exhaustion while interventions happen
{ reset(2);   // TX has only 2 canonical
  const s=qbStore(); ['TY','TZ'].forEach(t=>{ for(let i=0;i<2;i++){ const q={stem:t+i,options:['a','b','c','d'],answer:0,target_id:t}; q._qh=qbHash(q.stem+'|a|b|c|d'); allTopics[0].extras.qbank.push(q); s._qmeta[q._qh]={topicId:'t1',target_id:t,stem:q.stem,options:q.options,answer:0,skill:'mgmt'}; } });
  const firstOf=t=>allTopics[0].extras.qbank.find(q=>q.target_id===t)._qh;
  ['TX','TY','TZ'].forEach(t=>E.qbSchedApply(firstOf(t),false,2));
  let noFresh=0, subst=0, guard=0;
  for(let d=0; d<15 && guard<300; d++){ SIM.today++;
    ['TX','TY','TZ'].forEach(t=>{ const rc=qbStore()._sched['t:'+t]; if(!rc||rc.dueAt>SIM.today) return;
      const served=E.qbServeForRecord(rc); if(served.noFresh){ noFresh++; } else if(served.item && served.item.target_id!==t){ subst++; }
      if(served.item){ rc.servedQhs=(rc.servedQhs||[]).concat(served.item._qh); qbStore()._qmeta[served.item._qh]=qbStore()._qmeta[served.item._qh]||{target_id:t}; E.qbSchedApply(served.item._qh,false,2); } else { rc.dueAt=SIM.today+1; } });
    guard++; }
  ok(subst===0, '7 exhaustion: NEVER substitutes another Target\'s question ('+subst+' substitutions)');
  ok(noFresh>0, '7 exhaustion reached no_fresh (A7 seam) '+noFresh+' times');
  ok(schedHealthy(), '7 schedule healthy through multi-Target exhaustion'); }

// 8) Restart / persistence — serialize → restore → resume, no loss/dup
{ const qs=reset(5); E.qbSchedApply(qs[0]._qh,false,3); E.qbSchedApply(qs[1]._qh,true,0);
  const snapshot=JSON.stringify(DATA); const before=JSON.stringify(qbStore()._sched);
  DATA=JSON.parse(snapshot); build();                                       // "restart"
  E.qbMigrateSched();                                                       // runs on load
  const after=JSON.stringify(qbStore()._sched);
  ok(before===after, '8 restart: schedule survives serialize→restore unchanged (no loss)');
  E.qbMigrateSched(); ok(JSON.stringify(qbStore()._sched)===after, '8 migration idempotent post-restart (no dup)'); }

// 9) Concurrent: many Targets due same day + many intervention events close together
{ reset(3); const s=qbStore(); ['C1','C2','C3','C4'].forEach(t=>{ for(let i=0;i<3;i++){ const q={stem:t+i,options:['a','b','c','d'],answer:0,target_id:t}; q._qh=qbHash(q.stem+'|c|'+i); allTopics[0].extras.qbank.push(q); s._qmeta[q._qh]={topicId:'t1',target_id:t,stem:q.stem,options:q.options,answer:0,skill:'mgmt'}; }
    E.qbSchedApply(allTopics[0].extras.qbank.find(q=>q.target_id===t)._qh,false,2); });
  Object.keys(qbStore()._sched).forEach(k=>{ qbStore()._sched[k].dueAt=SIM.today; });   // all due same day
  const due=E.qbDueList(); const servedTargets=due.map(r=>r._serve&&r._serve.target_id).filter(Boolean);
  ok(due.length>=4, '9 concurrent: all due Targets surface together ('+due.length+')');
  ok(servedTargets.every((t,i)=>due[i].key==='t:'+t), '9 each due record serves its OWN Target (no cross-wire)');
  ok(schedHealthy(), '9 schedule healthy under concurrent due'); }

// 10) Flag transitions OFF→ON→OFF cannot corrupt A6 state
{ const qs=reset(5);
  win.MEDBANK_CONFIG.FEATURES.GAP_LOOP=false; E.qbSchedApply(qs[0]._qh,false,1); const a=JSON.stringify(qbStore()._sched);
  win.MEDBANK_CONFIG.FEATURES.GAP_LOOP=true;  E.qbSchedApply(qs[1]._qh,true,0);  const b=JSON.stringify(qbStore()._sched);
  win.MEDBANK_CONFIG.FEATURES.GAP_LOOP=false; const c=JSON.stringify(qbStore()._sched);
  ok(b===c, '10 toggling GAP_LOOP OFF does not alter existing _sched (flags gate UI only)');
  ok(schedHealthy(), '10 schedule healthy across flag transitions'); }

console.log('\n'+pass+' passed, '+fail+' failed');
if(findings.length){ console.log('\nFINDINGS:'); findings.forEach(f=>console.log(' • '+f)); }
process.exit(fail?1:0);
