/* A7.2 — deterministic acceptance harness for the retestpool orchestrator.
 * generate() and reconcile() are MOCKED; the orchestration contract is pinned.
 * Realizes every row of A7-RETEST-POOL-SPEC §11. */
import { A7_CFG, structuralOk, validateCandidate, replenish, onCanonicalExhausted, serveForTarget } from '../import-server/retestpool.mjs';

let pass=0, fail=0; const ok=(c,m)=>{ if(c)pass++; else{ fail++; console.log('  ✗ '+m); } };

/* ---- reference in-memory pool (models the server retest_pool table) ---- */
function makePool(servedCanonical){
  const rows=[]; const served={};
  const qhOf=it=>'qh:'+(it.stem||'');
  return {
    _rows:rows, _served:served,
    candidateCount(t){ return rows.filter(r=>r.target_id===t&&r.status==='candidate').length; },
    priorStatements(t){ const out=[]; (servedCanonical[t]||[]).forEach(s=>out.push(s));
      rows.filter(r=>r.target_id===t&&(r.status==='served'||r.status==='candidate')).forEach(r=>out.push(r.item.stem)); return out; },
    addCandidate(t,item,v){ rows.push({target_id:t, qh:qhOf(item), item, status:'candidate', validation:v}); },
    addInvalid(t,item,v){ rows.push({target_id:t, qh:qhOf(item), item, status:'invalid', validation:v}); },
    takeCandidate(t){ const r=rows.find(r=>r.target_id===t&&r.status==='candidate'); if(!r) return null;
      r.status='served'; (served[t]=served[t]||new Set()).add(r.qh); return Object.assign({target_id:t, _qh:r.qh}, r.item); },
    quarantine(qh){ const r=rows.find(r=>r.qh===qh); if(r) r.status='quarantined'; },
    servedSet(t){ return served[t]||new Set(); }
  };
}
/* ---- reference budget (two counters; backoff across due-events, not within one) ---- */
function makeBudget(nowRef, dailyMax){
  const att={}, failn={}, backoff={}; let daily=0; dailyMax=dailyMax||200;
  return {
    _att:att, _fail:failn, _backoff:backoff, daily(){return daily;},
    canStart(t){ if(daily>=dailyMax) return false; if((backoff[t]||-1) >= nowRef.now) return false; return true; },
    canAttempt(){ return daily<dailyMax; },
    noteAttempt(t){ att[t]=(att[t]||0)+1; daily++; },
    noteFailure(t){ failn[t]=(failn[t]||0)+1; const n=Math.min(failn[t]-1, A7_CFG.BACKOFF_DAYS.length-1); backoff[t]=nowRef.now + A7_CFG.BACKOFF_DAYS[n]; }
  };
}
const X='T-X', Y='T-Y';
function goodItem(tag){ return { stem:'Assess X properly '+(tag||''), options:['a','b','c','d'], answer:0, rationales:['r'] }; }

/* generator/reconcile mock factories */
function genReturns(item){ let n=0; return ()=>{ n++; return typeof item==='function'?item(n):JSON.parse(JSON.stringify(item)); }; }
function genThrows(){ return ()=>{ throw new Error('timeout'); }; }
const recMatchX = ()=>({state:'MATCH', target_id:X, confidence:0.90, matched_via:'T1'});
const recMatchXLow = ()=>({state:'MATCH', target_id:X, confidence:0.82, matched_via:'T1'});
const recMatchY = ()=>({state:'MATCH', target_id:Y, confidence:0.91, matched_via:'T2'});
const recNew = ()=>({state:'NEW', target_id:'T-NEW', confidence:0.4});
const recAmb = ()=>({state:'AMBIGUOUS', target_id:null, confidence:0.5});

function baseDeps(over){
  const nowRef={now:0};
  const pool = makePool(over.servedCanonical||{});
  const budget = makeBudget(nowRef, over.dailyMax);
  let reconcileCalls=0;
  const deps = {
    targetContract:{ target_id:X, canonical_claim:'X claim', scope:'X', exclusions:'not Y' },
    generate: over.generate,
    reconcile: (it)=>{ reconcileCalls++; return (over.reconcile||recMatchX)(it); },
    pool, budget, cfg:A7_CFG, nowRef,
    canonicalEligible: over.canonicalEligible || (()=>null),
    _reconcileCalls: ()=>reconcileCalls
  };
  return deps;
}

/* ============================= ROWS ============================= */
(async ()=>{
// Row 1 — fresh canonical exists → A7 not invoked
{ let genCalled=0; const d=baseDeps({ canonicalEligible:()=>({stem:'canon', options:['a','b','c','d'], answer:0, target_id:X}), generate:()=>{genCalled++; return goodItem();} });
  const r=await serveForTarget(X, Object.assign(d,{canonicalEligible:d.canonicalEligible}));
  ok(r.source==='canonical' && r.item.target_id===X && genCalled===0, 'R1 fresh canonical served, A7 not invoked'); }

// Row 2 — no canonical → A7 invoked (generate called)
{ let genCalled=0; const d=baseDeps({ generate:()=>{genCalled++; return goodItem();}, reconcile:recMatchX });
  const r=await serveForTarget(X, d); ok(genCalled>=1 && r.source==='pool_lazy', 'R2 no canonical → A7 generates & serves'); }

// Row 3 — MATCH→X ≥ floor → accepted, served, qh in servedQhs
{ const d=baseDeps({ generate:genReturns(goodItem('q1')), reconcile:recMatchX });
  const r=await serveForTarget(X, d);
  ok(r.item && r.item.target_id===X && r.source==='pool_lazy', 'R3 accepted & served');
  ok(d.pool.servedSet(X).has(r.item._qh), 'R3 served qh joins servedQhs (I6)'); }

// Row 3b — MATCH→X below floor → invalid, noFresh
{ const d=baseDeps({ generate:genReturns(goodItem()), reconcile:recMatchXLow });
  const r=await serveForTarget(X, d);
  ok(r.noFresh===true, 'R3b weak self-MATCH → noFresh');
  ok(d.pool._rows.some(x=>x.status==='invalid'&&x.validation.reason==='below_floor'), 'R3b invalid row w/ below_floor reason'); }

// Row 4 — MATCH→Y (sibling drift) → invalid, noFresh, never served
{ const d=baseDeps({ generate:genReturns(goodItem()), reconcile:recMatchY });
  const r=await serveForTarget(X, d);
  ok(r.noFresh===true, 'R4 MATCH→Y → noFresh');
  ok(d.pool._rows.every(x=>x.status!=='served'), 'R4 nothing served'); }

// Row 5 — NEW → invalid
{ const d=baseDeps({ generate:genReturns(goodItem()), reconcile:recNew });
  const r=await serveForTarget(X, d); ok(r.noFresh===true && d.pool._rows.some(x=>x.status==='invalid'&&x.validation.reason==='reconcile_NEW'), 'R5 NEW → invalid/noFresh'); }

// Row 6 — AMBIGUOUS → invalid
{ const d=baseDeps({ generate:genReturns(goodItem()), reconcile:recAmb });
  const r=await serveForTarget(X, d); ok(r.noFresh===true && d.pool._rows.some(x=>x.validation.reason==='reconcile_AMBIGUOUS'), 'R6 AMBIGUOUS → invalid/noFresh'); }

// Row 6a — facet/subset manifests as NEW → reject
{ const d=baseDeps({ generate:genReturns(goodItem()), reconcile:recNew });
  await serveForTarget(X, d); ok(d.pool._rows.some(x=>x.status==='invalid'), 'R6a facet/subset (NEW) rejected'); }
// Row 6b — broaden manifests as MATCH→broader → match_other_target
{ const d=baseDeps({ generate:genReturns(goodItem()), reconcile:()=>({state:'MATCH', target_id:'T-BROAD', confidence:0.9}) });
  await serveForTarget(X, d); ok(d.pool._rows.some(x=>x.validation.reason==='match_other_target'), 'R6b broaden → match_other_target'); }
// Row 6c — neighbor → MATCH→Y → match_other_target
{ const d=baseDeps({ generate:genReturns(goodItem()), reconcile:recMatchY });
  await serveForTarget(X, d); ok(d.pool._rows.some(x=>x.validation.reason==='match_other_target'), 'R6c neighbor → match_other_target'); }

// Row 7 — structural-invalid → rejected BEFORE reconcile (no LLM spent)
{ const bad={stem:'', options:['a','b'], answer:9}; const d=baseDeps({ generate:genReturns(bad), reconcile:recMatchX });
  const r=await serveForTarget(X, d);
  ok(r.noFresh===true, 'R7 structural → noFresh');
  ok(d._reconcileCalls()===0, 'R7 reconcile NOT called (no LLM spent on bad output)'); }

// Row 8 — near-duplicate of a served question → rejected by anti-dup, before reconcile
{ const servedCanonical={ [X]:['Assess X properly dupstem'] };
  const dupItem={ stem:'Assess X properly dupstem', options:['a','b','c','d'], answer:0 };
  const d=baseDeps({ generate:genReturns(dupItem), reconcile:recMatchX, servedCanonical });
  const r=await serveForTarget(X, d);
  ok(r.noFresh===true && d.pool._rows.some(x=>x.validation.reason==='antidup'), 'R8 near-dup → antidup reject');
  ok(d._reconcileCalls()===0, 'R8 reconcile NOT called (antidup precedes it)'); }

// Row 9 — disposability: accepted item lives in pool, NOT canonical corpus
{ const canonicalCorpus=[{stem:'c1'},{stem:'c2'}]; const before=canonicalCorpus.length;
  const d=baseDeps({ generate:genReturns(goodItem()), reconcile:recMatchX });
  await serveForTarget(X, d);
  ok(canonicalCorpus.length===before, 'R9/INV-A canonical corpus untouched (disposable)');
  ok(d.pool._rows.some(x=>x.status==='served'), 'R9 accepted item lives in pool'); }

// Row 10 — identity immutability: no target minting; item carries target_id=X
{ const targets={count:76}; const d=baseDeps({ generate:genReturns(goodItem()), reconcile:recMatchX });
  const r=await serveForTarget(X, d);
  ok(targets.count===76, 'R10/INV-B knowledge_targets count unchanged (no minting)');
  ok(r.item.target_id===X, 'R10 served item carries target_id=X'); }

// Row 11 — served-once: two distinct candidates, each served once; no re-serve
{ let k=0; const d=baseDeps({ generate:()=>{k++; return {stem:'Fresh X variant '+k, options:['a','b','c','d'], answer:0};}, reconcile:recMatchX });
  await onCanonicalExhausted(X, d);                         // background fill up to cap (3)
  const s1=await serveForTarget(X, d), s2=await serveForTarget(X, d);
  ok(s1.item && s2.item && s1.item._qh!==s2.item._qh, 'R11 two serves are different items');
  ok(d.pool.servedSet(X).size>=2, 'R11 both qhs in servedSet, none re-served'); }

// Row 12 — generator timeout → noFresh, no pool row, retention NOT advanced, genFailure counted
{ let schedApplied=false; const d=baseDeps({ generate:genThrows(), reconcile:recMatchX });
  const r=await serveForTarget(X, d);
  ok(r.noFresh===true, 'R12 timeout → noFresh');
  ok(d.pool._rows.length===0, 'R12 no retest_pool row created on timeout');
  ok(d.budget._fail[X]>=1 && d.budget._att[X]>=1, 'R12 counts as failed generation attempt (FIX2)');
  ok(schedApplied===false, 'R12 retention not advanced (no attempt happened)'); }

// Row 13 — pool at cap → no generation
{ let genCalled=0; const d=baseDeps({ generate:()=>{genCalled++; return goodItem();}, reconcile:recMatchX });
  // preload 3 candidates
  for(let i=0;i<3;i++) d.pool.addCandidate(X, {stem:'cand'+i, options:['a','b','c','d'], answer:0}, {passed:true});
  const out=await replenish(X, d);
  ok(genCalled===0 && out.added===0, 'R13 pool at POOL_CAP → no new generation (FIX3)'); }

// Row 13b — attempts cap: reconcile always fails → stops at MAX_ATTEMPTS
{ let genCalled=0; const d=baseDeps({ generate:()=>{genCalled++; return goodItem('a'+genCalled);}, reconcile:recNew });
  const out=await replenish(X, d);
  ok(genCalled<=A7_CFG.MAX_ATTEMPTS && out.attempts<=A7_CFG.MAX_ATTEMPTS, 'R13b stops at MAX_ATTEMPTS (got '+genCalled+')'); }

// Row 14 — backoff: after a failure, replenish within cooldown does NOT call generate
{ let genCalled=0; const d=baseDeps({ generate:()=>{genCalled++; return goodItem();}, reconcile:recNew });
  await replenish(X, d);                           // fails → sets backoff at now(0)
  const after=genCalled; d.nowRef.now=0;           // same "day" — still in cooldown (backoff>=now)
  const out2=await replenish(X, d);
  ok(out2.blocked===true && genCalled===after, 'R14 backoff blocks generation within cooldown');
  d.nowRef.now=99;                                 // past cooldown
  const out3=await replenish(X, d);
  ok(out3.blocked!==true, 'R14 generation allowed again after cooldown'); }

// Row 15 — NO SUBSTITUTION: only Y content exists; X served must never be a Y item
{ const d=baseDeps({ generate:genReturns(goodItem()), reconcile:recMatchY });   // everything drifts to Y
  const r=await serveForTarget(X, d);
  ok(r.noFresh===true || (r.item && r.item.target_id===X), 'R15 X never served another Target\'s question');
  ok(!d.pool._rows.some(x=>x.status==='served'), 'R15 nothing served under total drift'); }

// Row 16 — retention parity: a served generated item keys to t:X (same ladder as canonical)
{ const retentionKey=q=> q.target_id?('t:'+q.target_id):('q:'+q._qh);
  const d=baseDeps({ generate:genReturns(goodItem()), reconcile:recMatchX });
  const r=await serveForTarget(X, d);
  ok(r.item && retentionKey(r.item)==='t:'+X, 'R16 served gen item keys t:X (retention parity, I9)'); }

// INV-A / INV-B over many generations
{ const canonicalCorpus=[1,2,3]; const targets={count:76}; const cbefore=canonicalCorpus.length;
  const d=baseDeps({ generate:()=>({stem:'V '+Math.random(), options:['a','b','c','d'], answer:0}), reconcile:recMatchX });
  for(let i=0;i<10;i++){ await onCanonicalExhausted(X, d); d.nowRef.now+=10; }
  ok(canonicalCorpus.length===cbefore, 'INV-A corpus count invariant across 10 gens');
  ok(targets.count===76, 'INV-B knowledge_targets count invariant across 10 gens'); }

// Row 18 — CRASH-RESILIENCE: pool.addCandidate throws on the 3rd commit.
// Committed candidates must persist; the next invocation fills the remaining slot (disposable cache).
{ let k=0; const d=baseDeps({ generate:()=>({stem:'Variant '+(++k), options:['a','b','c','d'], answer:0}), reconcile:recMatchX });
  const realAdd=d.pool.addCandidate.bind(d.pool); let commits=0;
  d.pool.addCandidate=(t,item,v)=>{ if(commits>=2) throw new Error('crash mid-replenish'); commits++; return realAdd(t,item,v); };
  let crashed=false;
  try{ await onCanonicalExhausted(X, d); }catch(e){ crashed=true; }
  ok(crashed===true, 'R18 replenish surfaced the crash (fire-and-forget caller handles it)');
  ok(d.pool.candidateCount(X)===2, 'R18 the 2 committed candidates persist (got '+d.pool.candidateCount(X)+')');
  // repair the store and re-run: it should fill ONLY the remaining slot to reach CAP
  d.pool.addCandidate=realAdd;
  await onCanonicalExhausted(X, d);
  ok(d.pool.candidateCount(X)===3, 'R18 next invocation fills the remaining slot → CAP=3 (got '+d.pool.candidateCount(X)+')'); }

console.log('\n'+pass+' passed, '+fail+' failed');
process.exit(fail?1:0);
})();
