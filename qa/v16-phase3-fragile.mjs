/* V1.6 Phase 3 — fragile reinforce test (real app.html fns). Light path: reinforce → optional practice → result.
   Proves: post-session routing, reinforce-first, optional/skippable practice, fragile_practice masked from _attempts,
   identity=target_id, and the INVARIANT that the loop never touches _sched. */
import { readFileSync } from 'node:fs';
const html=readFileSync('app.html','utf8');
function grab(name){ const re=new RegExp('function '+name+'\\s*\\('); const i=html.search(re); if(i<0)throw new Error('missing '+name);
  let j=html.indexOf('{',i),d=0,k=j; for(;k<html.length;k++){const c=html[k];if(c==='{')d++;else if(c==='}'){d--;if(!d){k++;break;}}} return html.slice(i,k); }
let pass=0, fail=0; const ok=(c,m)=>{ if(c)pass++; else{ fail++; console.log('  ✗ '+m); } };

let DATA={qbank:{}}; let SCHED_WRITES=0, SCHED_APPLY=0;
function qbStore(){ DATA.qbank=DATA.qbank||{}; var s=DATA.qbank; s._qmeta=s._qmeta||{}; s._attempts=s._attempts||[];
  if(!s.__g){ let _s={}; Object.defineProperty(s,'_sched',{get(){return _s;},set(v){SCHED_WRITES++;_s=v;},configurable:true}); s.__g=true; } return s; }
function qbHash(str){ var h=5381,i=(str||'').length; while(i){ h=(h*33)^(str||'').charCodeAt(--i);} return (h>>>0).toString(36); }
function qbShuffle(a){ return a; } function qbCogOf(){ return 'apply'; } function persist(){}
function smartStats(){ return { seenQh:{}, bySkill:{} }; }
function qbSchedApply(){ SCHED_APPLY++; }
function qbLetter(j){ return 'ABCD'[j]; } function esc(x){ return String(x); } function qbSkillLabel(x){ return x; }
let logged=[]; function smartLog(ev){ logged.push(ev); } function gapRender(){} function qbUid(){ return 'u'; }
const win={ MEDBANK_CONFIG:{ FEATURES:{ GAP_LOOP:true, FRAGILE:true } } };

const corpus=[0,1].map(i=>({stem:'F stem '+i, options:['a','b','c','d'], answer:0, target_id:'TF', rationales:['r']}));
corpus.forEach(q=>q._qh=qbHash(q.stem+'|'+q.options.join('|')));
const allTopics=[{ id:'t1', ready:true, extras:{ qbank:corpus } }];
function qbItemFromMeta(qh,m){ return { _qh:qh, _topicId:'t1', target_id:(m.target_id||null), stem:m.stem, options:m.options, answer:m.answer, rationales:m.rationales||[], objective:m.objective||'', teaching:'', tag:'T', subtopic:'', skill:'mgmt', src:m.src||'' }; }
function qbQuestionsForTarget(tid, served){ var out=[],sv={};(served||[]).forEach(h=>sv[h]=1);
  allTopics[0].extras.qbank.forEach(q=>{ if(q.target_id!==tid||sv[q._qh]) return; out.push(qbItemFromMeta(q._qh,{target_id:tid,stem:q.stem,options:q.options,answer:q.answer,rationales:q.rationales})); }); return out; }

const names=['gapOn','fragOn','gapConceptPool','gapBucket','gapStart','gapPick','gapAdvance','gapLogAttempt','fixQAction'];
const src='var GAPLOOP=null;\n'+names.map(grab).join('\n');
const f=new Function('qbStore','qbHash','qbShuffle','qbCogOf','persist','smartStats','qbSchedApply','qbLetter','esc','qbSkillLabel','smartLog','gapRender','qbUid','window','qbItemFromMeta','qbQuestionsForTarget',
  src+'\n return { gapStart, gapPick, gapAdvance, fixQAction, fragOn, _loop:()=>GAPLOOP, _set:(v)=>{GAPLOOP=v;} };');
const A=f(qbStore,qbHash,qbShuffle,qbCogOf,persist,smartStats,qbSchedApply,qbLetter,esc,qbSkillLabel,smartLog,gapRender,qbUid,win,qbItemFromMeta,qbQuestionsForTarget);

const fqh=corpus[0]._qh;
qbStore()._qmeta[fqh]={ topicId:'t1', target_id:'TF', stem:corpus[0].stem, options:corpus[0].options, answer:0, skill:'mgmt', tag:'T', objective:'obj', src:'note#x' };

// R1 fixQAction: fragile + canLoop + fragOn → reinforce loop
ok(A.fixQAction({type:'fragile'}, true).kind==='fragile', 'R1 fragile routes to reinforce loop when fragOn+canLoop');
// R2 fragOn off → fragile falls back to drill
win.MEDBANK_CONFIG.FEATURES.FRAGILE=false;
ok(A.fixQAction({type:'fragile'}, true).kind==='drill', 'R2 fragOn off → fragile falls back to drill');
win.MEDBANK_CONFIG.FEATURES.FRAGILE=true;
// R3 start fragile → reinforce step, identity target_id
SCHED_WRITES=0; SCHED_APPLY=0; logged=[];
A.gapStart(fqh, true, 'fragile');
let g=A._loop();
ok(g && g.itype==='fragile' && g.step==='reinforce' && g.target_id==='TF' && g.concept==='TF', 'R3 fragile loop: reinforce step, identity=target_id');
ok(logged.some(e=>e.t==='intervention_shown' && e.itype==='fragile' && e.intervention_version==='v1.6-phase3'), 'R3 telemetry itype=fragile phase3');
// R4 skip practice (I'm good) → straight to result
A.gapAdvance();
ok(A._loop().step==='result', 'R4 fragile can skip practice → result (light, optional)');
// R5 with practice: reinforce → practice → result; fragile_practice masked
A._set(null); SCHED_WRITES=0; SCHED_APPLY=0;
A.gapStart(fqh, true, 'fragile'); g=A._loop();
g.step='practice';   // gapToPractice
A.gapPick(0); A.gapAdvance();
ok(A._loop().step==='result', 'R5 reinforce→practice→result');
ok((qbStore()._gapPractice||[]).some(a=>a.mode==='fragile_practice'), 'R5 fragile_practice logged separately');
ok(!(qbStore()._attempts||[]).some(a=>/practice/.test(a.mode||'')), 'R5 fragile_practice NEVER enters _attempts (masking)');
// R6 INVARIANT: no retention mutation across the whole fragile loop
ok(SCHED_WRITES===0 && SCHED_APPLY===0, 'R6 INVARIANT: fragile loop never wrote _sched / called qbSchedApply');

console.log('\n'+pass+' passed, '+fail+' failed'); process.exit(fail?1:0);
