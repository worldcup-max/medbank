/* PHASE B — Integrated Mode acceptance (PHASE-B-INTEGRATED-MODE-CONTRACT.md). Real integratedModeView from
 * import-server/integrated.mjs + the REAL integratedSelect / mgAssemble extracted from app.html.
 *     node qa/phase-b-integrated.mjs      Exit 0 = all pass. */
import fs from 'fs'; import path from 'path'; import vm from 'vm'; import { fileURLToPath } from 'url';
import { integratedModeView, readinessGate } from '../import-server/integrated.mjs';
const __dirname=path.dirname(fileURLToPath(import.meta.url));
const src=fs.readFileSync(path.join(__dirname,'..','app.html'),'utf8');
function extractFn(name){ const m=new RegExp('function\\s+'+name+'\\s*\\(').exec(src); if(!m) throw new Error('missing '+name);
  let i=src.indexOf('{',m.index),d=0,j=i; for(;j<src.length;j++){ if(src[j]==='{')d++; else if(src[j]==='}'){ d--; if(!d) break; } } return src.slice(m.index,j+1); }
let pass=0, fail=0; const ok=(c,m)=>{ if(c)pass++; else{ fail++; console.log('  ✗ '+m); } };

const FAMS=['cardio_renal','cardio_endocrine','endocrine_renal','resp_cardiac','neuro_endocrine','pregnancy_cardio','gi_hepatic','onco_haem','hepatic_pharm','infect_immunology'];
let seq=0;
const row=(fam,extra)=>Object.assign({ id:'r'+String(++seq).padStart(4,'0'), review_status:'approved', integration_family:fam, integration_type:'management',
  question_id:'src'+seq, source_question_ids:['src'+seq], integrated_topics:['x'],
  transformed_content:{ stem:'Stem '+seq+' long enough', options:['a','b','c','d'], answer:1, rationales:['','','',''] } }, extra||{});
const bank=(per)=>{ const out=[]; FAMS.forEach(f=>{ for(let i=0;i<per;i++) out.push(row(f)); }); return out; };

// --- server view: fail-closed gate ---
{ const v=integratedModeView(bank(9));   // 90 approved, every family 9
  ok(v.integrated_mode==='locked' && v.items.length===0, 'B1 below the gate → locked, ZERO items served');
  ok(v.blockers.some(b=>/90 \/ 100 approved/.test(b)), 'B2 lock reason comes from blockers[] ('+v.blockers.join(' · ')+')'); }
{ const v=integratedModeView(bank(10));
  ok(v.integrated_mode==='available' && v.items.length===100, 'B3 exactly at the gate → available with all 100 items'); }
{ const b=bank(10); b.pop(); const v=integratedModeView(b);
  ok(v.integrated_mode==='locked' && v.items.length===0, 'B4 one item below the gate flips it back to locked'); }
{ const b=bank(10).concat([row('cardio_renal',{review_status:'ai_reviewed'}), row('cardio_renal',{review_status:'needs_edit'})]);
  const v=integratedModeView(b); ok(v.items.length===100 && v.items.every(q=>!/ai_reviewed|needs_edit/.test(JSON.stringify(q))), 'B5 only approved items are ever served'); }
{ const v=integratedModeView(bank(10)), g=readinessGate(bank(10));
  ok((v.integrated_mode==='available')===g.ready, 'B6 view agrees with the ONE canonical readinessGate'); }
ok(integratedModeView(null).integrated_mode==='locked' && integratedModeView([]).items.length===0, 'B7 empty/missing input fails closed');

// --- identity invariant ---
{ const b=bank(10); b[0].target_id='T-own'; b[1].source_question_ids=['srcX']; b[1].question_id='srcX';
  const v=integratedModeView(b, { targets:{ srcX:'T-inherited', [b[0].question_id]:'T-should-not-win' }, topics:{ srcX:{id:'topic9',name:'Heart failure'} } });
  const byId=Object.fromEntries(v.items.map(q=>[q.id,q]));
  ok(byId['ig:'+b[0].id].target_id==='T-own', 'I1 an item\'s own target_id wins');
  ok(byId['ig:'+b[1].id].target_id==='T-inherited', 'I2 otherwise it inherits its source question\'s authoritative Target');
  ok(byId['ig:'+b[2].id].target_id===null, 'I3 no authoritative Target → null (own-hash fallback, like AMBIGUOUS)');
  ok(v.items.every(q=>typeof q.target_id==='string'||q.target_id===null) && v.items.every(q=>!Array.isArray(q.target_id)), 'I4 exactly ONE primary target_id per item');
  ok(byId['ig:'+b[1].id].source_topic.id==='topic9', 'I5 source topic carried for analytics');
  ok(v.items.every(q=>Array.isArray(q.integrated_topics) && q.integration_family), 'I6 integrated_topics/family kept as metadata'); }
{ const b=bank(10); b[3].transformed_content=null; const v=integratedModeView(b);
  ok(v.items.length===99, 'I7 an approved row without content is skipped, not served blank'); }
{ const v1=integratedModeView(bank(10).reverse()), ids=v1.items.map(q=>q.id); ok(ids.join()===ids.slice().sort().join(), 'I8 deterministic order'); }

// --- client selector (real code from app.html) ---
const ctx={ window:{}, Math, Object, Array, String };
vm.createContext(ctx); vm.runInContext(extractFn('integratedSelect'), ctx);
const sel=(p,n)=>vm.runInContext('integratedSelect',ctx)(p,n);
const pool=integratedModeView(bank(10)).items;
{ const a=sel(pool,20), b=sel(pool.slice().reverse(),20);
  ok(a.selected.map(q=>q.id).join()===b.selected.map(q=>q.id).join(), 'S1 deterministic: same pool + count ⇒ same selection');
  ok(a.delivered===20 && a.shortfall===0, 'S2 delivers the requested count when available');
  ok(Object.values(a.byFamily).every(c=>c===2), 'S3 balanced across families (2 each of 10)');
  ok(new Set(a.selected.map(q=>q.id)).size===20, 'S4 no duplicates');
  ok(a.selected.every(q=>q.integrated===true), 'S5 never pads with non-integrated questions'); }
{ const small=pool.slice(0,7), r=sel(small,20);
  ok(r.delivered===7 && r.shortfall===13 && r.available===7 && r.requested===20, 'S6 shortfall reported: requested 20, available 7, delivered 7'); }
ok(sel([],10).delivered===0 && sel(pool,0).delivered===0, 'S7 empty pool / zero request are safe');
{ const skew=pool.filter(q=>q.integration_family==='cardio_renal').concat(pool.filter(q=>q.integration_family==='onco_haem').slice(0,1)); const r=sel(skew,4);
  ok(r.byFamily.cardio_renal<=3, 'S8 round-robin reaches the second family before exhausting the first'); }

// --- mgAssemble wiring (real code; stubs for the rest of the app) ---
{ const c2={ window:{ MEDBANK_CONFIG:{ FEATURES:{ INTEGRATED_MODE:true } } }, Math, Object, Array, String };
  c2.qbShuffle=a=>a; c2.qbCogOf=q=>q.cognitive_level||'clinical_reasoning';
  vm.createContext(c2);
  vm.runInContext(['mgIntegOn','integratedSelect','blueprintSelect','mgAssemble','_mgAssembleCore'].map(extractFn).join('\n'), c2);
  const regular=[...Array(40)].map((_,i)=>({ _qh:'q'+String(i).padStart(2,'0'), stem:'r'+i, skill:'diagnosis' }));
  c2.mgTopicGroups=()=>[{ topicId:'t1', items:regular }];
  c2.window._mgInteg={ state:'available', items:pool };
  c2._mgCfg={ exposure:'focused', count:20, integratedN:5 }; vm.runInContext('var _mgCfg=_mgCfg', c2);
  const out=vm.runInContext('mgAssemble(20)', c2), ig=c2.window._mgLastInteg;
  ok(out.length===20 && out.filter(q=>q.integrated).length===5, 'W1 5 integrated + 15 regular = the 20 asked for');
  ok(ig && ig.requested===5 && ig.delivered===5, 'W2 requested-vs-delivered recorded for the session');
  c2.window._mgInteg={ state:'locked', items:pool };   // server says locked — even a stale count must serve none
  const out2=vm.runInContext('mgAssemble(20)', c2);
  ok(out2.filter(q=>q.integrated).length===0 && c2.window._mgLastInteg.delivered===0 && c2.window._mgLastInteg.shortfall===5, 'W3 locked ⇒ zero integrated served, shortfall recorded (fail-closed client)');
  c2.window._mgInteg={ state:'available', items:pool }; c2._mgCfg.integratedN=0;
  const out3=vm.runInContext('mgAssemble(20)', c2);
  ok(out3.length===20 && out3.every(q=>!q.integrated) && c2.window._mgLastInteg===null, 'W4 integratedN 0 ⇒ session unchanged');
  c2.window.MEDBANK_CONFIG.FEATURES.INTEGRATED_MODE=false; c2._mgCfg.integratedN=5;
  const out4=vm.runInContext('mgAssemble(20)', c2);
  ok(out4.every(q=>!q.integrated), 'W5 flag off ⇒ no integrated questions');
  c2.window.MEDBANK_CONFIG.FEATURES.INTEGRATED_MODE=true;
  c2._mgCfg={ exposure:'blueprint', count:20, integratedN:4, skillMix:{ diagnosis:100 } }; vm.runInContext('var _mgCfg=_mgCfg', c2);
  const out5=vm.runInContext('mgAssemble(20)', c2);
  ok(out5.length===20 && out5.filter(q=>q.integrated).length===4 && c2.window._mgLastBlueprint.requested.count===16, 'W6 blueprint: 4 integrated + blueprint fills the other 16'); }

console.log('\n'+pass+' passed, '+fail+' failed'); process.exit(fail?1:0);
