/* Phase B (Integrated Mode) + Phase E (linear Case Mode) — serve-core invariants.
   Run: node qa/v19-integrated-serve.mjs */
import { toServable, selectIntegrated, assembleCases, caseLeakage, caseScore } from '../import-server/integrated-serve.mjs';
import { readinessGate } from '../import-server/integrated.mjs';
import { readFileSync } from 'node:fs';
let pass=0, fail=0; const ok=(c,m)=>{ if(c) pass++; else { fail++; console.log('  ✗ '+m); } };

const row=(id,fam,extra)=>Object.assign({ id, review_status:'approved', integration_family:fam, target_id:'T-'+id, integrated_topics:['b'],
  transformed_content:{ stem:'Stem '+id+' about a patient', options:['alpha '+id,'beta '+id,'gamma '+id,'delta '+id], answer:1, rationales:['a','b','c','d'] } }, extra||{});

// B1 only approved rows are servable
ok(toServable(row('1','cardio_renal'))!==null, 'B1 approved row servable');
for(const st of ['ai_reviewed','needs_edit','rejected','candidate','pending']) ok(toServable(row('x','cardio_renal',{review_status:st}))===null, 'B1 '+st+' never servable');
// B2 malformed content fails closed
ok(toServable(row('m','f',{transformed_content:{stem:'',options:['a','b'],answer:0}}))===null, 'B2 empty stem');
ok(toServable(row('m','f',{transformed_content:{stem:'s',options:['a','a','b','c'],answer:0}}))===null, 'B2 duplicate options');
ok(toServable(row('m','f',{transformed_content:{stem:'s',options:['a','b','c','d'],answer:4}}))===null, 'B2 answer out of range');
ok(toServable(row('m','f',{transformed_content:null}))===null, 'B2 no content');
// B3 identity invariant: ONE target_id passed through untouched; metadata never alters it
{ const s=toServable(row('7','cardio_renal',{ case_id:'c1', case_stage:2, integrated_topics:['renal','pharm'] }));
  ok(s.target_id==='T-7' && typeof s.target_id==='string', 'B3 target_id passed through untouched');
  ok(Array.isArray(s.integrated_topics) && s.case_id==='c1' && s.case_stage===2, 'B3 metadata carried as metadata'); }
// B4 shortfall: request > available → serve available + report, never substitute
{ const items=[row('1','a'),row('2','a'),row('3','b')].map(toServable);
  const r=selectIntegrated(items,{count:10,seed:'s'});
  ok(r.delivered===3 && r.shortfall===7 && r.selected.every(x=>items.includes(x)), 'B4 shortfall reported, no padding'); }
// B5 family balance: round robin so a big family cannot dominate
{ const items=[]; for(let i=0;i<20;i++) items.push(toServable(row('a'+i,'big'))); for(let i=0;i<5;i++) items.push(toServable(row('b'+i,'small')));
  const r=selectIntegrated(items,{count:10,seed:'x'});
  ok(r.deliveredByFamily.big===5 && r.deliveredByFamily.small===5, 'B5 balanced 5/5 across families'); }
// B6 family filter + missing families reported
{ const items=[row('1','a'),row('2','b')].map(toServable);
  const r=selectIntegrated(items,{count:5,families:['b','zzz'],seed:'x'});
  ok(r.selected.length===1 && r.selected[0].integration_family==='b' && r.missingFamilies.join()==='zzz', 'B6 family filter + missing reported'); }
// B7 deterministic per seed, exclude respected, no duplicates
{ const items=[]; for(let i=0;i<12;i++) items.push(toServable(row('q'+i,i%3?'x':'y')));
  const a=selectIntegrated(items,{count:6,seed:'same'}), b=selectIntegrated(items,{count:6,seed:'same'});
  ok(a.selected.map(x=>x.id).join()===b.selected.map(x=>x.id).join(), 'B7 same seed → same set');
  const e=selectIntegrated(items,{count:12,exclude:['q0','q1'],seed:'s'});
  ok(!e.selected.some(x=>x.id==='q0'||x.id==='q1') && new Set(e.selected.map(x=>x.id)).size===e.selected.length, 'B7 exclude + no duplicates'); }
// B8 gate is the ONE canonical gate: below → not ready; exactly at → ready; one less → locked
{ const fams=['f1','f2','f3','f4','f5','f6','f7','f8','f9','f10']; const mk=n=>{ const a=[]; fams.forEach(f=>{ for(let i=0;i<n;i++) a.push({integration_family:f}); }); return a; };
  ok(readinessGate(mk(10)).ready===true, 'B8 100 approved, 10 families of 10 → ready');
  const minus=mk(10); minus.pop(); ok(readinessGate(minus).ready===false, 'B8 one item below gate → locked');
  ok(readinessGate([]).ready===false, 'B8 empty → locked (fail closed)'); }
// B9 server routes fail closed on the gate (static check of the wiring)
{ const srv=readFileSync('import-server/server.mjs','utf8');
  const items=srv.slice(srv.indexOf('app.get("/qbank/integrated/items"'), srv.indexOf('app.get("/qbank/cases"'));
  ok(/if\(!gate\.ready\) return res\.status\(423\)/.test(items) && items.indexOf('!gate.ready')<items.indexOf('toServable'), 'B9 items route checks gate before serving');
  const cases=srv.slice(srv.indexOf('app.get("/qbank/cases"'), srv.indexOf('app.post("/qbank/integrated/log"'));
  ok(/if\(!gate\.ready\) return res\.status\(423\)/.test(cases), 'B9 cases route checks gate');
  ok(!/integrated_items"\)\.(update|insert|delete)/.test(items+cases), 'B9 student routes never write integrated_items'); }

// ---- Phase E — cases ----
const stage=(id,cid,k,opts)=>row(id,'pregnancy_cardio',Object.assign({ case_id:cid, case_stage:k }, opts||{}));
// E1 fixed order by case_stage regardless of row order
{ const r=assembleCases([stage('s3','c',3),stage('s1','c',1),stage('s2','c',2)]);
  ok(r.cases.length===1 && r.cases[0].stages.map(s=>s.id).join()==='s1,s2,s3', 'E1 stages served in fixed stage order'); }
// E2 any unapproved stage rejects the whole case
{ const r=assembleCases([stage('s1','c',1),stage('s2','c',2,{review_status:'needs_edit'})]);
  ok(!r.cases.length && /not approved/.test(r.rejected[0].reason), 'E2 unapproved stage → whole case rejected'); }
// E3 gaps / duplicates in stages rejected
ok(assembleCases([stage('a','c',1),stage('b','c',3)]).cases.length===0, 'E3 gap 1,3 rejected');
ok(assembleCases([stage('a','c',1),stage('b','c',1)]).cases.length===0, 'E3 duplicate stage rejected');
// E4 too short / too long
ok(assembleCases([stage('a','c',1)]).cases.length===0, 'E4 one stage is not a case');
{ const g=[]; for(let i=1;i<=7;i++) g.push(stage('x'+i,'c',i)); ok(assembleCases(g).cases.length===0, 'E4 seven stages rejected'); }
// E5 leakage: an earlier stage revealing a LATER answer is rejected; later stems repeating earlier answers allowed
{ const s1=stage('l1','c',1,{ transformed_content:{ stem:'Pregnant woman breathless', options:['peripartum cardiomyopathy','pulmonary embolism','asthma','anaemia'], answer:0,
    rationales:['','','','start bromocriptine plus anticoagulation later'] } });
  const s2=stage('l2','c',2,{ transformed_content:{ stem:'She is diagnosed with peripartum cardiomyopathy. Next step?', options:['start bromocriptine plus anticoagulation','observe','discharge','induce labour now'], answer:0 } });
  const r=assembleCases([s1,s2]); ok(!r.cases.length && /reveals the answer to stage 2/.test(r.rejected[0].reason), 'E5 earlier stage leaking later answer → rejected');
  const s1b=Object.assign({}, s1, { transformed_content:Object.assign({}, s1.transformed_content, { rationales:['','','',''] }) });
  ok(assembleCases([s1b,s2]).cases.length===1, 'E5 later stem repeating earlier answer is allowed'); }
// E6 each stage keeps its OWN target_id (independent Target assessments)
{ const r=assembleCases([stage('t1','c',1),stage('t2','c',2)]); ok(r.cases[0].stages.map(s=>s.target_id).join()==='T-t1,T-t2', 'E6 per-stage target_id preserved'); }
// E7 case score is a derived summary of per-stage grading
{ const sc=caseScore([{},{},{}],[{i:0,ok:true},{i:1,ok:false},{i:2,ok:true}]);
  ok(sc.correct===2 && sc.answered===3 && sc.pct===67 && sc.first_miss_stage===2, 'E7 derived case score + first miss'); }
// E8 client copy of caseScore matches the server one (same shape, same numbers)
{ const html=readFileSync('app.html','utf8'); const i=html.indexOf('function caseScoreOf('); let j=html.indexOf('{',i),d=0,k=j; for(;k<html.length;k++){ const c=html[k]; if(c==='{')d++; else if(c==='}'){ d--; if(!d){k++;break;} } }
  const caseScoreOf=new Function(html.slice(i,k)+'\nreturn caseScoreOf;')();
  const items=[{},{},{},{}], res=[{i:0,ok:false},{i:2,ok:true}];
  ok(JSON.stringify(caseScoreOf(items,res))===JSON.stringify(caseScore(items,res)), 'E8 client caseScoreOf ≡ server caseScore'); }
// E9 leakage helper direct
ok(caseLeakage([{stem:'x',options:['a','b'],answer:0,rationales:['the answer is long enough text here']},{stem:'y',options:['long enough text here','z'],answer:0}]).length===1, 'E9 caseLeakage finds the leak');

console.log('\n'+pass+' passed, '+fail+' failed'); process.exit(fail?1:0);
