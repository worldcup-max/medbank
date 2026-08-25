/* V1.6 Phase 2 — gap re-baseline test. Extracts REAL app.html gap functions; proves target_id identity,
   A6-sibling practice source, no in-overlay retest, and the INVARIANT: the loop never touches _sched. */
import { readFileSync } from 'node:fs';
const html=readFileSync('app.html','utf8');
function grab(name){ const re=new RegExp('function '+name+'\\s*\\('); const i=html.search(re); if(i<0)throw new Error('missing '+name);
  let j=html.indexOf('{',i),d=0,k=j; for(;k<html.length;k++){const c=html[k];if(c==='{')d++;else if(c==='}'){d--;if(!d){k++;break;}}} return html.slice(i,k); }

let pass=0, fail=0; const ok=(c,m)=>{ if(c)pass++; else{ fail++; console.log('  ✗ '+m); } };

// runtime
let DATA={qbank:{}}; let SCHED_WRITES=0;
function qbStore(){ DATA.qbank=DATA.qbank||{}; var s=DATA.qbank; s._qmeta=s._qmeta||{}; s._attempts=s._attempts||[];
  // trap any write to _sched (the retention record) — the invariant is that Phase 2 never does this
  if(!s.__schedGuarded){ let _sched={}; Object.defineProperty(s,'_sched',{ get(){return _sched;}, set(v){ SCHED_WRITES++; _sched=v; }, configurable:true }); s.__schedGuarded=true; }
  return s; }
function qbHash(str){ var h=5381,i=(str||'').length; while(i){ h=(h*33)^(str||'').charCodeAt(--i); } return (h>>>0).toString(36); }
function qbShuffle(a){ return a; }
function qbCogOf(){ return 'apply'; }
function persist(){}
function smartStats(){ return { seenQh:{} , bySkill:{ mgmt:{} } }; }
function smartDiagnose(){ return { type:'gap' }; }
function smartPool(){ return []; }
function qbSkillLabel(x){ return x; }
function qbLetter(j){ return 'ABCD'[j]; }
function esc(x){ return String(x); }
let logged=[]; function smartLog(ev){ logged.push(ev); }
function gapRender(){}
function qbUid(){ return 'u'; }
let SCHED_APPLY_CALLS=0; function qbSchedApply(){ SCHED_APPLY_CALLS++; }   // must never be called by Phase 2
const win={ MEDBANK_CONFIG:{ FEATURES:{ GAP_LOOP:true } } };
let GAPLOOP=null;

// corpus: Target TG has 3 questions
const corpus=[0,1,2].map(i=>({stem:'G stem '+i, options:['a','b','c','d'], answer:0, target_id:'TG', rationales:['r']}));
corpus.forEach(q=>q._qh=qbHash(q.stem+'|'+q.options.join('|')));
const allTopics=[{ id:'t1', ready:true, extras:{ qbank:corpus } }];
// real A6 sibling selector
function qbItemFromMeta(qh,m){ if(!m) return null; return { _qh:qh, _topicId:m.topicId||'*', target_id:(m.target_id||null), stem:m.stem, options:m.options, answer:m.answer, rationales:m.rationales||[], objective:m.objective||'', teaching:m.teaching||'', tag:m.tag||'General', subtopic:m.subtopic||'', skill:m.skill||'', src:m.src||'' }; }
function qbQuestionsForTarget(targetId, served){ var out=[], sv={}; (served||[]).forEach(h=>sv[h]=1);
  allTopics.forEach(t=>((t.extras&&t.extras.qbank)||[]).forEach(q=>{ if(q.target_id!==targetId) return; var h=q._qh; if(sv[h]) return;
    out.push(qbItemFromMeta(h,{topicId:t.id,target_id:targetId,stem:q.stem,options:q.options,answer:q.answer,rationales:q.rationales})); })); return out; }

const names=['gapOn','gapDiag','gapConceptPool','gapEligible','gapBucket','gapStart','gapPick','gapAdvance','gapLogAttempt'];
const src='var GAPLOOP=null;\n'+'function fragOn(){return false;}\nfunction misconOn(){return false;}\nfunction ivPhase(it){return it==="fragile"?"v1.6-phase3":it==="misconception"?"v1.6-phase4":"v1.6-phase2";}\n'+names.map(grab).join('\n');
const f=new Function('qbStore','qbHash','qbShuffle','qbCogOf','persist','smartStats','smartDiagnose','smartPool','qbSkillLabel','esc','smartLog','qbUid','qbSchedApply','window','qbItemFromMeta','qbQuestionsForTarget','gapRender',
  src+'\n return { gapOn, gapEligible, gapConceptPool, gapBucket, gapStart, gapPick, gapAdvance, _loop:()=>GAPLOOP, _setLoop:(v)=>{GAPLOOP=v;} };');
const API=f(qbStore,qbHash,qbShuffle,qbCogOf,persist,smartStats,smartDiagnose,smartPool,qbSkillLabel,esc,smartLog,qbUid,qbSchedApply,win,qbItemFromMeta,qbQuestionsForTarget,gapRender);

// seed _qmeta for the missed question (target-mapped)
const missedQh=corpus[0]._qh;
qbStore()._qmeta[missedQh]={ topicId:'t1', target_id:'TG', stem:corpus[0].stem, options:corpus[0].options, answer:0, skill:'mgmt', tag:'T', objective:'obj' };
const q0=Object.assign({_qh:missedQh}, corpus[0], {skill:'mgmt'});

// R1 bucket stable + domain
ok(API.gapBucket('TG')===API.gapBucket('TG'), 'R1 bucket stable');
ok(['matched','generic'].includes(API.gapBucket('TG')), 'R1 bucket domain matched/generic');
// R2 eligible only on gap + target_id + sibling
ok(API.gapEligible(q0, 1)!==null, 'R2 eligible on gap+target_id+sibling (wrong pick)');
ok(API.gapEligible(q0, 0)===null, 'R2 not eligible when answered correctly');
const qNoTarget=Object.assign({}, q0, {target_id:null, _qh:'noT'}); qbStore()._qmeta['noT']={target_id:null, stem:'x', options:['a','b','c','d'], skill:'mgmt'};
ok(API.gapEligible(qNoTarget,1)===null, 'R2 not eligible without target_id');
// R3 practice source = Target siblings, excludes missed qh
const pool=API.gapConceptPool(missedQh);
ok(pool.length===2 && pool.every(p=>p.target_id==='TG') && !pool.some(p=>p._qh===missedQh), 'R3 practice pool = Target siblings, excludes missed qh');
// R4 loop shape: start → learn/practice, advance → result (no retest step ever)
SCHED_WRITES=0; SCHED_APPLY_CALLS=0; logged=[];
API.gapStart(missedQh);
let g=API._loop();
ok(g && (g.step==='learn'||g.step==='practice') && g.target_id==='TG' && g.practiceQ && g.retestQ===undefined, 'R4 loop has practiceQ, NO retestQ; identity=target_id');
if(g.step==='learn'){ g.step='practice'; }   // simulate gapToPractice
API.gapPick(0);   // answer practice
API.gapAdvance();
ok(API._loop().step==='result', 'R4 advance goes straight practice→result (no retest step)');
// R5 INVARIANT: the whole loop never wrote _sched and never called qbSchedApply
ok(SCHED_WRITES===0, 'R5 INVARIANT: loop never wrote a _sched retention record (writes='+SCHED_WRITES+')');
ok(SCHED_APPLY_CALLS===0, 'R5 INVARIANT: loop never called qbSchedApply');
// R6 identity = target_id
ok(API._loop().concept==='TG', 'R6 concept identity === target_id');
// R7 flag gate
win.MEDBANK_CONFIG.FEATURES.GAP_LOOP=false; API._setLoop(null);
ok(API.gapEligible(q0,1)===null, 'R7 GAP_LOOP off → not eligible (dormant)');
win.MEDBANK_CONFIG.FEATURES.GAP_LOOP=true;
// telemetry carries target_id + versions
ok(logged.some(e=>e.t==='intervention_shown' && e.target_id==='TG' && e.intervention_version==='v1.6-phase2'), 'R8 telemetry keyed by target_id + version');

// R9 MASKING INVARIANT: gap_practice logged separately, NEVER into the frozen engine's _attempts
ok((qbStore()._gapPractice||[]).some(a=>a.mode==='gap_practice'), 'R9 gap_practice logged separately (_gapPractice)');
ok(!(qbStore()._attempts||[]).some(a=>/^gap_/.test(a.mode||'')), 'R9 gap_practice NEVER enters _attempts (standing diagnosis uncontaminated)');

console.log('\n'+pass+' passed, '+fail+' failed'); process.exit(fail?1:0);
