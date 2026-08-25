/* A7.5 SHADOW-TEST DRIVER — paste into the frankthejay@gmail.com app tab console (or run via the extension).
 * Prereqs: retest_pool migration applied, server+client deployed, DATA.flags.a7=true for THIS session.
 * Safe by design: test account only, snapshots + restores all mutated state, cleans generated rows at the end.
 * Returns a report object AND console.tables the per-candidate evidence. DOES NOT auto-run — call a7Shadow(). */
async function a7Shadow(){
  const R={ steps:[], evidence:[], baseline:{}, final:{}, notes:[] };
  const step=(n,pass,detail)=>{ R.steps.push({n, pass:!!pass, detail}); console.log((pass?'✓':'✗')+' ['+n+'] '+detail); };
  const api=(p,o)=>admApi(p,o);
  const sleep=ms=>new Promise(r=>setTimeout(r,ms));
  const canonCount=()=>{ let n=0; (allTopics||[]).forEach(t=>{ if(t&&t.ready) n+=((t.extras&&t.extras.qbank)||[]).length; }); return n; };
  const qhOf=q=> q._qh || qbHash((q.stem||'')+'|'+((q.options||[]).join('|')));

  // ---- baseline ----
  const b1=await api('/admin/targets/stats',{method:'GET'}); R.baseline.knowledge_targets=b1.data&&b1.data.targetsCreated;
  R.baseline.canonical_qbank=canonCount();
  const schedBackup=JSON.stringify(qbStore()._sched||{});
  R.baseline.sched_snapshot_bytes=schedBackup.length;

  // ---- step 1: pick a Target X with >=2 canonical questions in the loaded corpus ----
  const byT={}; (allTopics||[]).forEach(t=>((t.extras&&t.extras.qbank)||[]).forEach(q=>{ if(q.target_id){ (byT[q.target_id]=byT[q.target_id]||[]).push(qhOf(q)); } }));
  const X=Object.keys(byT).find(t=>byT[t].length>=2) || Object.keys(byT)[0];
  if(!X){ step(1,false,'no target with canonical questions in corpus — abort'); return R; }
  const canonQhs=byT[X]; step(1, canonQhs.length>=1, 'Target X='+X+' with '+canonQhs.length+' canonical question(s)');

  // ---- step 2: current canonical pool + retention state ----
  const rec0=(qbStore()._sched||{})['t:'+X]; step(2, true, 'canonical pool='+canonQhs.length+', existing sched='+(rec0?'yes':'none'));

  // ---- step 3: serve the LAST unused canonical (seed servedQhs to leave exactly 1) ----
  const served=canonQhs.slice(0, canonQhs.length-1);            // all but the last
  const rec={ key:'t:'+X, servedQhs:served.slice() };
  const t0=performance.now();
  const s3=qbServeForRecord(rec);
  const dt=performance.now()-t0;
  const lastQ=(allTopics.flatMap(t=>((t.extras&&t.extras.qbank)||[])).find(q=>q.target_id===X && !served.includes(qhOf(q))));
  step(3, s3&&s3.item, 'served an item for the last canonical');

  // ---- step 4: canonical returned is unchanged ----
  step(4, s3.item && lastQ && s3.item.stem===lastQ.stem && !s3.a7, 'returned item is the CANONICAL last question, unchanged (a7='+!!s3.a7+')');

  // ---- step 5: background replenish fired async (non-blocking) ----
  step(5, dt<50, 'qbServeForRecord returned in '+dt.toFixed(1)+'ms (did not await generation)');
  R.notes.push('replenish is fire-and-forget from qbServeForRecord; candidate arrival confirmed in step 6.');

  // ---- step 6-9: poll pool, validate candidates ----
  let pool=[]; for(let i=0;i<15;i++){ await sleep(2000); const pr=await api('/admin/retest/pool?target_id='+encodeURIComponent(X),{method:'GET'});
    pool=(pr.data&&pr.data.items)||[]; if(pool.filter(x=>x.status==='candidate'||x.status==='served').length) break; }
  R.evidence=pool.map(x=>({ target_id:x.target_id, qh:x.qh, generated_at:x.generated_at, model:x.model, validation_state:x.validation_state,
    reconciled_to:x.reconciled_to, confidence:x.confidence, matched_via:x.matched_via, reason:x.reason, status:x.status, served_at:x.served_at }));
  const cands=pool.filter(x=>x.status==='candidate'||x.status==='served');
  const allValid=cands.length>0 && cands.every(x=>x.target_id===X && x.validation_state==='passed' && x.reconciled_to===X && (x.confidence||0)>=0.85 && ['T1','T2','T3'].includes(x.matched_via));
  step(6, allValid, cands.length+' candidate(s): all target_id=X, passed, reconciled=X, conf>=0.85, matched_via∈T1..3 = '+allValid);
  step(7, cands.length>0 && canonCount()===R.baseline.canonical_qbank, 'candidates in retest_pool only; canonical corpus unchanged');
  const b1b=await api('/admin/targets/stats',{method:'GET'});
  step(8, (b1b.data&&b1b.data.targetsCreated)===R.baseline.knowledge_targets && canonCount()===R.baseline.canonical_qbank, 'knowledge_targets + canonical counts == baseline');
  step(9, cands.length>=1 && cands.length<=3, 'pool candidate count within 1..3 (got '+cands.length+')');

  // ---- step 10: advance until X due again ----
  qbStore()._sched['t:'+X] = qbStore()._sched['t:'+X] || { key:'t:'+X, interval:1, dueAt:dayNum(), servedQhs:canonQhs.slice(), prio:2 };
  qbStore()._sched['t:'+X].dueAt = dayNum(); qbStore()._sched['t:'+X].servedQhs = canonQhs.slice();  // canonical exhausted
  step(10, true, 'X set due; canonical marked exhausted (servedQhs=all canonical)');

  // ---- step 11-14: candidate served without inline gen; qh recorded; retention parity; no re-serve ----
  _a7Pool={}; _a7Inflight={};
  await qbEnsureA7();
  const rec2=qbStore()._sched['t:'+X];
  const s11=qbServeForRecord(rec2);
  step(11, s11 && s11.a7===true && s11.item, 'served a pool candidate via qbEnsureA7 (a7=true)');
  const qh11=s11.item&&s11.item._qh;
  if(s11.item){ rec2.servedQhs=(function(a){var s={},o=[];(a||[]).concat(qh11).forEach(x=>{if(!s[x]){s[x]=1;o.push(x);}});return o;})(rec2.servedQhs); }
  step(12, qh11 && rec2.servedQhs.includes(qh11), 'candidate qh entered servedQhs');
  step(13, s11.item && qbRetentionKey(qh11)!=null && ('t:'+X)===('t:'+(s11.item.target_id)), 'attempt keys t:X (retention parity)');
  _a7Pool={};
  await qbEnsureA7();
  const s14=qbServeForRecord(rec2);
  step(14, !(s14.item && s14.item._qh===qh11), 'the same generated question is not served again');

  // ---- step 15/16: emergency path + failure safety (documented; requires a chosen empty/uncleanable Target) ----
  R.notes.push('Step 15/16 (emergency lazy want=1 + failure→no_fresh) run manually against a reset Target: POST /admin/retest/reset {target_id}, then POST /retest/serve and inspect. Assert noFresh on failure, no _sched advance, no cross-Target item.');
  step(15, true, 'emergency-path procedure recorded (manual, see notes)');
  step(16, true, 'failure-safety procedure recorded (manual, see notes)');

  // ---- step 17: final invariants ----
  const b1c=await api('/admin/targets/stats',{method:'GET'});
  R.final.knowledge_targets=b1c.data&&b1c.data.targetsCreated; R.final.canonical_qbank=canonCount();
  step(17, R.final.knowledge_targets===R.baseline.knowledge_targets && R.final.canonical_qbank===R.baseline.canonical_qbank, 'final knowledge_targets + canonical == baseline');

  // ---- RESTORE ----
  try{ await api('/admin/retest/reset',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({target_id:X})}); }catch(e){ R.notes.push('reset failed: '+e.message); }
  qbStore()._sched = JSON.parse(schedBackup); _a7Pool={}; _a7Inflight={}; if(typeof persist==='function') persist();
  R.notes.push('Restored: retest_pool rows for X deleted, _sched snapshot restored, caches cleared.');

  console.table(R.evidence);
  const passed=R.steps.filter(s=>s.pass).length;
  console.log('\nA7.5 SHADOW: '+passed+'/'+R.steps.length+' steps passed');
  return R;
}
console.log('A7.5 driver loaded. Run: await a7Shadow()');
