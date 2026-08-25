/* V1.6 Phase 1 — telemetry contract test. Extracts the REAL app.html iv* functions; proves the
   observe-only invariant (a failing sink never throws into the caller) with everything mocked. */
import { readFileSync } from 'node:fs';
const html=readFileSync('app.html','utf8');
function grab(name){ const re=new RegExp('function '+name+'\\s*\\('); const i=html.search(re); if(i<0)throw new Error('missing '+name);
  let j=html.indexOf('{',i),d=0,k=j; for(;k<html.length;k++){const c=html[k];if(c==='{')d++;else if(c==='}'){d--;if(!d){k++;break;}}} return html.slice(i,k); }

let pass=0, fail=0; const ok=(c,m)=>{ if(c)pass++; else{ fail++; console.log('  ✗ '+m); } };

const names=['ivOn','ivAccountId','ivBucket','ivAttemptSignal','ivStandingDiagnosis','ivEmit','ivPost'];
const src='var IV_DIAG_VERSION="v1.5", IV_INTV_VERSION="v1.6-phase1";\n'+names.map(grab).join('\n');

// mocks
let logged=[]; let posted=[]; let postThrows=false;
function smartLog(ev){ logged.push(ev); }
function smartStats(){ return { bySkill:{ management:{} } }; }
function smartDiagnose(){ return { type:'misconception' }; }
function admApi(path,opts){ posted.push({path,opts}); if(postThrows) throw new Error('net down'); return Promise.resolve({ok:true,data:{}}); }
const win={ MEDBANK_CONFIG:{ FEATURES:{ V16_TELEMETRY:true } }, MB_USER:{ id:'acct-123' } };

const api=new Function('window','smartLog','smartStats','smartDiagnose','admApi',
  src+'\n return { ivOn, ivBucket, ivAttemptSignal, ivEmit };')(win,smartLog,smartStats,smartDiagnose,admApi);

// 1 — bucket stability
ok(api.ivBucket('acct-123')===api.ivBucket('acct-123'), 'R1 bucket stable for same account');
// 2 — bucket domain + ~50/50
let A=0,B=0; for(let i=0;i<200;i++){ const b=api.ivBucket('user-'+i); if(b==='A')A++; else if(b==='B')B++; else {fail++;console.log('  ✗ bad bucket '+b);} }
ok(A+B===200, 'R2 bucket only A/B'); ok(A>60&&B>60, 'R2 ~50/50 (A='+A+' B='+B+')');
// 3 — attempt_signal mapping
ok(api.ivAttemptSignal(false,3)==='wrong_confident','R3 wrong+confident');
ok(api.ivAttemptSignal(false,1)==='wrong_unsure','R3 wrong+unsure');
ok(api.ivAttemptSignal(false,null)==='wrong','R3 wrong (no conf)');
ok(api.ivAttemptSignal(true,0)==='correct_unsure','R3 correct+unsure');
ok(api.ivAttemptSignal(true,3)==='correct_confident','R3 correct+confident');
ok(api.ivAttemptSignal(true,null)==='correct','R3 correct (no conf)');
// 4 — event shape (ivEmit → smartLog captures the event)
logged=[]; posted=[];
const ret=api.ivEmit({skill:'management'}, 'qh1', 'BRONCH-NEXT-002', false, 3);
const ev=logged[0]||{};
ok(ev.target_id==='BRONCH-NEXT-002'&&ev.qh==='qh1'&&ev.ok===false&&ev.confidence===3
   &&ev.attempt_signal==='wrong_confident'&&ev.standing_diagnosis==='misconception'
   &&(ev.ab_bucket==='A'||ev.ab_bucket==='B')&&ev.diagnosis_version==='v1.5'&&ev.intervention_version==='v1.6-phase1',
   'R4 event carries all required fields');
ok(posted.length===1 && posted[0].path==='/telemetry/intervention', 'R4 durable POST fired');
// 5 — FAILURE ISOLATION: throwing sink never throws into caller
postThrows=true; let threw=false;
try{ api.ivEmit({skill:'management'}, 'qh2', 'T', true, 2); }catch(e){ threw=true; }
ok(threw===false, 'R5 INVARIANT: throwing telemetry never throws into the caller');
postThrows=false;
// 6 — gated off: ivOn false → no-op
win.MEDBANK_CONFIG.FEATURES.V16_TELEMETRY=false; logged=[]; posted=[];
api.ivEmit({skill:'management'}, 'qh3', 'T', true, 2);
ok(logged.length===0 && posted.length===0, 'R6 gated off → no local event, no POST');
win.MEDBANK_CONFIG.FEATURES.V16_TELEMETRY=true;
// 7 — no learning-path coupling: ivEmit returns undefined
ok(ret===undefined, 'R7 ivEmit returns nothing the scheduler could read');

console.log('\n'+pass+' passed, '+fail+' failed'); process.exit(fail?1:0);
