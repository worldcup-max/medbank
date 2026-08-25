/* V1.6 Phase 4 — misconception contrast test (real app.html fns). Proves: at-miss trigger on misconception+target_id,
   contrast step (soft wording, uses the CHOSEN distractor), optional practice, misconception_practice masked,
   identity=target_id, no _sched mutation, flag-gated (default off). */
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
function smartStats(){ return { seenQh:{}, bySkill:{ mgmt:{} } }; }
function smartDiagnose(){ return { type:'misconception' }; }
function qbSchedApply(){ SCHED_APPLY++; }
function qbLetter(j){ return 'ABCD'[j]; } function esc(x){ return String(x); } function qbSkillLabel(x){ return x; }
let logged=[]; function smartLog(ev){ logged.push(ev); } function gapRender(){} function qbUid(){ return 'u'; } function gapDismiss(){}
const win={ MEDBANK_CONFIG:{ FEATURES:{ MISCONCEPTION:true } } };

const corpus=[0,1].map(i=>({stem:'M stem '+i, options:['right','trap','c','d'], answer:0, target_id:'TM', rationales:['because right','the tempting wrong rule','c','d']}));
corpus.forEach(q=>q._qh=qbHash(q.stem+'|'+q.options.join('|')));
const allTopics=[{ id:'t1', ready:true, extras:{ qbank:corpus } }];
function qbItemFromMeta(qh,m){ return { _qh:qh, _topicId:'t1', target_id:(m.target_id||null), stem:m.stem, options:m.options, answer:m.answer, rationales:m.rationales||[], objective:'', tag:'T', subtopic:'', skill:'mgmt', src:m.src||'' }; }
function qbQuestionsForTarget(tid, served){ var out=[],sv={};(served||[]).forEach(h=>sv[h]=1);
  allTopics[0].extras.qbank.forEach(q=>{ if(q.target_id!==tid||sv[q._qh]) return; out.push(qbItemFromMeta(q._qh,{target_id:tid,stem:q.stem,options:q.options,answer:q.answer,rationales:q.rationales})); }); return out; }
function gapDiag(){ return { type:'misconception' }; }

const names=['misconOn','ivPhase','gapConceptPool','gapBucket','gapStart','misconEligible','misconStart','gapPick','gapAdvance','gapLogAttempt','fixQAction'];
const src='var GAPLOOP=null;\nfunction gapOn(){return false;}\nfunction fragOn(){return false;}\n'+names.map(grab).join('\n');
const f=new Function('qbStore','qbHash','qbShuffle','qbCogOf','persist','smartStats','smartDiagnose','gapDiag','qbSchedApply','qbLetter','esc','qbSkillLabel','smartLog','gapRender','qbUid','gapDismiss','window','qbItemFromMeta','qbQuestionsForTarget',
  src+'\n return { misconOn, misconEligible, misconStart, gapStart, gapPick, gapAdvance, fixQAction, _loop:()=>GAPLOOP, _set:(v)=>{GAPLOOP=v;} };');
const A=f(qbStore,qbHash,qbShuffle,qbCogOf,persist,smartStats,smartDiagnose,gapDiag,qbSchedApply,qbLetter,esc,qbSkillLabel,smartLog,gapRender,qbUid,gapDismiss,win,qbItemFromMeta,qbQuestionsForTarget);

const mqh=corpus[0]._qh;
qbStore()._qmeta[mqh]={ topicId:'t1', target_id:'TM', stem:corpus[0].stem, options:corpus[0].options, answer:0, rationales:corpus[0].rationales, skill:'mgmt', tag:'T', src:'note#x' };
const q0=Object.assign({_qh:mqh}, corpus[0], {skill:'mgmt'});

// R1 eligible on misconception + target_id + miss
ok(A.misconEligible(q0, 1)!==null, 'R1 misconception eligible on confident-wrong miss (picked=1 trap)');
ok(A.misconEligible(q0, 0)===null, 'R1 not eligible when answered correctly');
// R2 flag gate
win.MEDBANK_CONFIG.FEATURES.MISCONCEPTION=false; ok(A.misconEligible(q0,1)===null, 'R2 MISCONCEPTION off → dormant');
win.MEDBANK_CONFIG.FEATURES.MISCONCEPTION=true;
// R3 start → contrast step, carries chosen distractor, identity target_id
SCHED_WRITES=0; SCHED_APPLY=0; logged=[];
A.misconStart(mqh, 1);
let g=A._loop();
ok(g && g.itype==='misconception' && g.step==='contrast' && g.target_id==='TM' && g.distractor===1, 'R3 contrast step, chosen distractor=1, identity=target_id');
ok(logged.some(e=>e.t==='intervention_shown' && e.itype==='misconception' && e.intervention_version==='v1.6-phase4'), 'R3 telemetry itype=misconception phase4');
// R4 fixQAction routes to contrast when misconOn+canLoop
ok(A.fixQAction({type:'misconception'}, true).kind==='misconception', 'R4 fixQ routes misconception → contrast loop');
// R5 contrast → (skip) result; and practice masked
A._set(null); A.misconStart(mqh,1); g=A._loop();
g.step='practice'; A.gapPick(0); A.gapAdvance();
ok(A._loop().step==='result', 'R5 contrast→practice→result');
ok((qbStore()._gapPractice||[]).some(a=>a.mode==='misconception_practice'), 'R5 misconception_practice logged separately');
ok(!(qbStore()._attempts||[]).some(a=>/practice/.test(a.mode||'')), 'R5 misconception_practice NEVER enters _attempts (masking)');
// R6 INVARIANT: no retention mutation
ok(SCHED_WRITES===0 && SCHED_APPLY===0, 'R6 INVARIANT: misconception loop never wrote _sched / called qbSchedApply');
// R7 soft wording: no "misconception" string emitted to the student in offer/telemetry labels
ok(!logged.some(e=>/you have a misconception/i.test(JSON.stringify(e))), 'R7 never tells the student "you have a misconception"');

console.log('\n'+pass+' passed, '+fail+' failed'); process.exit(fail?1:0);
