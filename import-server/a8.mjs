/* ==========================================================================
 * A8 — Retest Pool → Canonical Promotion. PURE gate (no AI, no network, no DB).
 * Contract: A8-PROMOTION-CONTRACT.md. Pinned by qa/v19-a8-promotion.mjs.
 *
 * A7 generates parallel retests and serves them; that does NOT make them canonical. A8 decides which served
 * retests have EARNED promotion. It is NEVER automatic: this gate only says "eligible"; a human promotes.
 *
 * Guarantees:
 *  - P1 Target preserved: a promoted item keeps the exact target_id it was generated and round-trip-validated
 *       for. No re-reconciliation, no re-mapping, no new Target (A6 identity untouched).
 *  - P2 Only items that passed the frozen A7 validation gate (validation.passed, MATCH to the SAME target,
 *       confidence ≥ floor) are eligible.
 *  - P3 Evidence before promotion: served to ≥ minServes and attempted ≥ minAttempts, with a sane difficulty
 *       band (not trivially easy, not a broken/ambiguous item everyone misses).
 *  - P4 Quarantined / invalid / expired items are never eligible. An item flagged by students is held.
 *  - P5 Not a near-duplicate of an existing canonical question for the same Target.
 *  - P6 Promotion is recorded beside the row (promoted_at/promotion) — the A7 row status is NOT changed, so A7's
 *       anti-repeat set and pool accounting are exactly as before (A7 stays frozen).
 * ========================================================================== */

export const A8_CFG = { MATCH_FLOOR:0.90, MIN_SERVES:3, MIN_ATTEMPTS:5, P_MIN:0.25, P_MAX:0.90, DUP_MAX:0.85, MAX_FLAGS:0 };

function norm(s){ return String(s||"").toLowerCase().replace(/[^a-z0-9 ]+/g," ").replace(/\s+/g," ").trim(); }
function jac(a,b){ const A=new Set(norm(a).split(" ").filter(Boolean)), B=new Set(norm(b).split(" ").filter(Boolean)); if(!A.size&&!B.size) return 0; let i=0; A.forEach(x=>{ if(B.has(x)) i++; }); return i/(A.size+B.size-i); }

/* row: a retest_pool row. ctx: { attempts, correct, flags, canonicalStems:[...] } — evidence gathered by the caller. */
export function a8PromotionGate(row, ctx, cfg){
  const R=Object.assign({}, A8_CFG, cfg||{}); ctx=ctx||{}; row=row||{};
  const v=row.validation||{}; const reasons=[]; const checks={};
  checks.status_ok = row.status==="served";
  if(!checks.status_ok) reasons.push("status is "+(row.status||"?")+" (only served items can be promoted)");
  checks.not_promoted = !row.promoted_at;
  if(!checks.not_promoted) reasons.push("already promoted");
  checks.validated = v.passed===true;
  if(!checks.validated) reasons.push("did not pass the A7 validation gate");
  const reconciledTo = v.reconciled_to||v.target_id||row.target_id;
  checks.same_target = !!row.target_id && reconciledTo===row.target_id;
  if(!checks.same_target) reasons.push("validated against a different target ("+(reconciledTo||"none")+")");
  checks.confident = (Number(v.confidence)||0) >= R.MATCH_FLOOR;
  if(!checks.confident) reasons.push("round-trip confidence "+(Number(v.confidence)||0)+" < "+R.MATCH_FLOOR);
  checks.served_enough = (row.served_count||0) >= R.MIN_SERVES;
  if(!checks.served_enough) reasons.push("served "+(row.served_count||0)+" / "+R.MIN_SERVES);
  const n=ctx.attempts|0, c=ctx.correct|0, p=n?c/n:0;
  checks.attempted_enough = n >= R.MIN_ATTEMPTS;
  if(!checks.attempted_enough) reasons.push("attempted "+n+" / "+R.MIN_ATTEMPTS+" — not enough evidence yet");
  checks.difficulty_sane = checks.attempted_enough && p>=R.P_MIN && p<=R.P_MAX;
  if(checks.attempted_enough && !checks.difficulty_sane) reasons.push("accuracy "+Math.round(p*100)+"% outside "+Math.round(R.P_MIN*100)+"–"+Math.round(R.P_MAX*100)+"%");
  checks.unflagged = (ctx.flags|0) <= R.MAX_FLAGS;
  if(!checks.unflagged) reasons.push((ctx.flags|0)+" student flag(s) — hold for review");
  const stem=(row.content||{}).stem||"";
  const dupOf=(ctx.canonicalStems||[]).find(s=>jac(stem,s)>=R.DUP_MAX);
  checks.not_duplicate = !dupOf;
  if(!checks.not_duplicate) reasons.push("near-duplicate of an existing canonical question");
  const eligible = Object.values(checks).every(Boolean);
  return { eligible, checks, reasons, target_id:row.target_id||null, evidence:{ attempts:n, correct:c, accuracy:n?Math.round(p*100):null } };
}

/* The promotion RECORD (what gets written beside the A7 row). Requires an explicit human and an eligible gate;
   throws otherwise so no caller can promote by accident. Target is copied, never recomputed. */
export function promotionRecord(row, gate, reviewer, at){
  if(!reviewer) throw new Error("A8: a human reviewer is required to promote");
  if(!gate || !gate.eligible) throw new Error("A8: item is not eligible: "+((gate&&gate.reasons)||[]).join("; "));
  if(gate.target_id!==row.target_id) throw new Error("A8: target mismatch — promotion must preserve target_id");
  return { promoted_at: at||new Date().toISOString(), promoted_by: reviewer,
           promotion: { target_id: row.target_id, qh: row.qh, evidence: gate.evidence, checks: gate.checks } };
}
