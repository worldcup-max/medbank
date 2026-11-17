/* Phase C — integration axis of the Reasoning Profile (WIRED extraction from app.html). Run: node qa/v19-phase-c-integration-axis.mjs */
import { readFileSync } from 'node:fs';
const html=readFileSync('app.html','utf8');
function grab(name){ const i=html.search(new RegExp('function '+name+'\\s*\\(')); if(i<0) throw new Error('missing '+name);
  let j=html.indexOf('{',i),d=0,k=j; for(;k<html.length;k++){ const c=html[k]; if(c==='{')d++; else if(c==='}'){ d--; if(!d){k++;break;} } } return html.slice(i,k); }
let pass=0, fail=0; const ok=(c,m)=>{ if(c) pass++; else { fail++; console.log('  ✗ '+m); } };
const SMART={MIN_EV:3,EV_MED:6,EV_HIGH:15}, RP_SEP=15;
let STORE={_attempts:[],_qmeta:{}};
const env=new Function('SMART','RP_SEP','qbStore','esc','intOn',
  'function qbPct(b){ return b&&b.seen?Math.round(b.correct/b.seen*100):0; }\n'
  +grab('profileTier')+'\n'+grab('rpRow')+'\n'+grab('intFamLabel')+'\n'+grab('integratedProfileBands')+'\n'+grab('integratedProfileHtml')
  +'\nreturn { integratedProfileBands, integratedProfileHtml, intFamLabel };')(SMART,RP_SEP,()=>STORE,s=>String(s),()=>true);
const set=(list)=>{ STORE={_attempts:[],_qmeta:{}}; list.forEach((a,i)=>{ const qh='q'+i; STORE._qmeta[qh]=a.meta; STORE._attempts.push({qh, ok:a.ok, topicId:a.topicId||'_integrated'}); }); };
const I=(fam,ok)=>({ meta:{ integrated:true, integration_family:fam }, ok });
const N=(ok)=>({ meta:{ tag:'x' }, ok, topicId:'t1' });

set([]); ok(/No integrated questions answered yet/.test(env.integratedProfileHtml('*',70)), 'C1 none answered → explicit "none yet", no claim');
set([I('cardio_renal',true),I('cardio_renal',false)]); { const h=env.integratedProfileHtml('*',70); ok(/Not enough evidence yet/.test(h) && !/\d+%<\/b>/.test(h), 'C2 n=2 → insufficient, no percentage'); }
set([N(true),N(true),I('cardio_renal',true),I('cardio_renal',true),I('cardio_renal',false),I('hepatic_pharm',true)]);
{ const b=env.integratedProfileBands('*'); ok(b.all.seen===4 && b.byFam.cardio_renal.seen===3 && b.byFam.hepatic_pharm.seen===1, 'C3 counts only integrated attempts, per pairing'); }
{ const h=env.integratedProfileHtml('*',70); ok(/Cardio \+ Renal/.test(h) && /Liver \+ Pharmacology/.test(h), 'C4 pairing rows labelled in plain words'); ok(/Liver \+ Pharmacology<\/div><div class="rp-v ins">Not enough evidence/.test(h), 'C4 thin pairing row stays insufficient'); }
{ const many=[]; for(let i=0;i<10;i++) many.push(I('cardio_renal', i<4)); set(many); const h=env.integratedProfileHtml('*',80);
  ok(/below your 80% overall/.test(h) && /Practise integrated/.test(h), 'C5 measured + separated → descriptive note + practise link');
  ok(!/ability|weak reasoner|intelligence/i.test(h), 'C5 never an ability claim'); }
{ const many=[]; for(let i=0;i<10;i++) many.push(I('cardio_renal', i<7)); set(many); ok(!/Practise integrated/.test(env.integratedProfileHtml('*',75)), 'C6 not separated (70 vs 75) → no nudge'); }
ok(!/smartDrill|smartDiagnose|smartLog/.test(grab('integratedProfileHtml')+grab('integratedProfileBands')), 'C7 frozen Smart Drill engine not called by the integration axis');
console.log('\n'+pass+' passed, '+fail+' failed'); process.exit(fail?1:0);
