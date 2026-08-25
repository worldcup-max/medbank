/* ==========================================================================
 * A7 — Retest Pool orchestrator (PURE CORE). NO LLM, NO network, NO DB.
 * Every side-effecting dependency is INJECTED (generate, reconcile, pool,
 * budget, retentionAdapter, clock). This is the layer whose contract the
 * deterministic harness pins: no possible generator failure or bad output
 * may cause an A6 guarantee to break.
 *
 * Hard guarantees this module preserves (see A7-RETEST-POOL-SPEC):
 *  - I2  never serves when a fresh canonical question exists (gating)
 *  - I2/I15 never serves another Target's question (no substitution)
 *  - I1/I11 never mints/alters a Target (no write path to targets here)
 *  - I4  never writes the canonical corpus (no write path to qbank here)
 *  - I3  serves only a candidate that passed the frozen round-trip gate
 *  - I5  any failure => {noFresh:true}; retention untouched
 *  - I6  a served item's qh joins the Target's served set
 *  - I8  bounded generation (pool cap on candidate-status, attempt cap, budget/backoff)
 * ========================================================================== */

export const A7_CFG = { POOL_CAP:3, MAX_ATTEMPTS:2, MATCH_CONF_FLOOR:0.85, ANTIDUP_MAX:0.85, BACKOFF_DAYS:[1,2,4] };

/* ---------- validation primitives (pure) ---------- */
export function structuralOk(item){
  if(!item || typeof item!=='object') return false;
  if(!item.stem || !Array.isArray(item.options)) return false;
  if(item.options.length<4 || item.options.length>5) return false;
  const opts=item.options.map(o=>String(o==null?'':o).trim());
  if(opts.some(o=>!o)) return false;
  if(new Set(opts).size!==opts.length) return false;                 // no duplicate options
  if(typeof item.answer!=='number' || item.answer<0 || item.answer>=item.options.length) return false;
  return true;
}
function norm(s){ return String(s||'').toLowerCase().replace(/[^a-z0-9 ]+/g,' ').replace(/\s+/g,' ').trim(); }
function toks(s){ return new Set(norm(s).split(' ').filter(Boolean)); }
export function jaccard(a,b){ const A=toks(a),B=toks(b); if(!A.size&&!B.size) return 0; let i=0; A.forEach(x=>{ if(B.has(x)) i++; }); return i/(A.size+B.size-i); }
export function antiDupOk(item, priorStatements, max){ const s=item.stem||''; for(const p of (priorStatements||[])){ if(jaccard(s,p) >= max) return false; } return true; }
/* reconcile result shape (from the FROZEN pipeline): { state:'MATCH'|'NEW'|'AMBIGUOUS', target_id, confidence, matched_via } */
export function reconcileOk(rec, targetId, floor){ return !!rec && rec.state==='MATCH' && rec.target_id===targetId && (rec.confidence||0) >= floor; }

/* full validation gate — structural -> anti-dup -> round-trip reconciliation+floor (fail-closed, cheap->expensive) */
export async function validateCandidate(item, ctx){
  const cfg=ctx.cfg||A7_CFG;
  if(!structuralOk(item)) return { passed:false, reason:'structural', validation:{ passed:false, reason:'structural' } };
  if(!antiDupOk(item, ctx.priorStatements, cfg.ANTIDUP_MAX)) return { passed:false, reason:'antidup', validation:{ passed:false, reason:'antidup' } };
  const rec = await ctx.reconcile(item);                                    // injected: extract-from-ANSWERED + frozen decide()
  if(!reconcileOk(rec, ctx.targetId, cfg.MATCH_CONF_FLOOR)){
    const why = !rec ? 'reconcile_null'
      : rec.state!=='MATCH' ? ('reconcile_'+rec.state)               // NEW / AMBIGUOUS (incl. facet/subset drift)
      : rec.target_id!==ctx.targetId ? 'match_other_target'          // neighbor / broaden drift
      : 'below_floor';                                               // weak self-MATCH (D4)
    return { passed:false, reason:why, validation:{ passed:false, reason:why, reconciled_to:rec&&rec.target_id, confidence:rec&&rec.confidence, matched_via:rec&&rec.matched_via } };
  }
  return { passed:true, reason:null, validation:{ passed:true, reconciled_to:rec.target_id, confidence:rec.confidence, matched_via:rec.matched_via } };
}

/* ---------- bounded generation: generate -> validate -> pool ----------
 * deps: { targetContract, generate, reconcile, pool, budget, cfg }
 * Counters live in deps.budget: noteAttempt() every generator CALL (incl. timeouts);
 * noteFailure(reason) on a failed attempt (timeout OR rejected candidate). */
export async function replenish(targetId, deps, want){
  const cfg=deps.cfg||A7_CFG;
  const target = Math.min(want==null ? cfg.POOL_CAP : want, cfg.POOL_CAP);   // background fill → CAP; lazy fallback → 1
  const out={ attempts:0, genFailures:0, invalid:0, added:0, fails:0, blocked:false };
  if(deps.budget.canStart && !(await deps.budget.canStart(targetId))){ out.blocked=true; return out; }  // backoff/daily gate — ACROSS due-events
  while(true){
    if((await deps.pool.candidateCount(targetId)) >= target) break;   // reached desired candidate count (FIX3: only status==='candidate')
    if(out.fails >= cfg.MAX_ATTEMPTS) break;                          // FAILURE budget for THIS invocation (backoff is future-only)
    if(deps.budget.canAttempt && !(await deps.budget.canAttempt(targetId))) break;   // daily ceiling, per attempt
    out.attempts++;
    await deps.budget.noteAttempt(targetId);                          // generation-attempt counter (FIX2)
    let item=null, threw=false;
    try{ item = await deps.generate(deps.targetContract); }
    catch(e){ threw=true; }
    if(threw || !item){ out.genFailures++; out.fails++; await deps.budget.noteFailure(targetId,'gen_error'); continue; } // timeout: no pool row (FIX2)
    const priors = await deps.pool.priorStatements(targetId);        // served canonical + served gen + unused candidates (FIX4)
    const v = await validateCandidate(item, { targetId, priorStatements:priors, reconcile:deps.reconcile, cfg });
    if(v.passed){ await deps.pool.addCandidate(targetId, item, v.validation); out.added++; }
    else { await deps.pool.addInvalid(targetId, item, v.validation); out.invalid++; out.fails++; await deps.budget.noteFailure(targetId, v.reason); } // FIX1: status='invalid' + reason
  }
  return out;
}

/* ---------- normal-path trigger: last canonical for X served -> background replenish ---------- */
export async function onCanonicalExhausted(targetId, deps){ return replenish(targetId, deps); }

/* ---------- serve-time decision — the SINGLE insertion point for qbServeForRecord ----------
 * deps additionally provides canonicalEligible(targetId) -> item|null. */
export async function serveForTarget(targetId, deps){
  const canon = await deps.canonicalEligible(targetId);
  if(canon) return { source:'canonical', item:canon };               // I2: A7 not invoked while a fresh canonical exists
  let c = await deps.pool.takeCandidate(targetId);                   // normal A7 path: pre-validated, instant
  if(c) return { source:'pool', item:c };
  await replenish(targetId, deps, 1);                               // lazy fallback (emergency): make just ONE to serve now
  c = await deps.pool.takeCandidate(targetId);
  if(c) return { source:'pool_lazy', item:c };
  return { noFresh:true };                                          // I5: safe — never a substitute
}
