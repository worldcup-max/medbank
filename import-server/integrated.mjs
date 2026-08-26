/* Integrated Content Pipeline — PURE deterministic core. No AI, no DB. The AI candidate-miner and adversarial
 * reviewer are upstream, non-deterministic seams (mocked in tests). THESE functions are the exact gates that
 * decide what may enter the Integrated Bank: the dependency test, the QA score, and the content-readiness gate.
 * AI is a candidate-finder; these gates + a human are the judges. */

export const TIERS = { mechanistic:1, diagnostic:2, management:3, competing:4, longitudinal:5 };

/* THE dependency test — genuine integration iff BOTH domains are required AND the secondary is a real reasoning
   domain (not a symptom/comorbidity/vocabulary of the primary). Kills the `infect`/fever false positives. */
export function dependencyGate(v){
  v=v||{};
  // HIGH bar (Frank): a second domain qualifies only if it MATERIALLY changes the reasoning AND the answer is not
  // reachable by a simple modifier/lookup. North star: if a smart student could answer WITHOUT integrating, reject.
  const checks = {
    removeA_changes: !!v.removeA_changes,   // remove primary domain → reasoning materially changes
    removeB_changes: !!v.removeB_changes,   // remove secondary domain → reasoning materially changes
    inferential:     !!v.inferential,       // learner must CONNECT the domains (not two parallel facts)
    moreThanLookup:  !!v.moreThanLookup,     // NOT a simple contraindication/dosing/screening/risk-factor lookup
    createsDecision: !!v.createsDecision     // the interaction CREATES the clinical decision
  };
  const pass = Object.values(checks).every(Boolean);
  const reasons=[];
  if(!checks.removeA_changes) reasons.push("removing the primary domain does not materially change the reasoning");
  if(!checks.removeB_changes) reasons.push("removing the secondary domain does not materially change the reasoning");
  if(!checks.inferential)     reasons.push("domains are not inferentially connected (no cross-domain reasoning)");
  if(!checks.moreThanLookup)  reasons.push("answer reachable by a simple modifier/lookup (dose/contraindication/screening)");
  if(!checks.createsDecision) reasons.push("the domain interaction does not create the clinical decision");
  return { pass, checks, reasons };
}

/* QA score — 7 criteria; approve iff total ≥ 15/19 AND dependency ≥ 3 (dependency is mandatory). */
export const QA_MAX = { dependency:3, coherence:3, educational:3, discrimination:3, targetClarity:2, difficulty:2, noArtificialComplexity:3 };
export const QA_TOTAL_MAX = 19, QA_THRESHOLD = 15, QA_DEP_MIN = 3;
export function qaScore(scores){
  scores=scores||{}; let total=0;
  Object.keys(QA_MAX).forEach(k=>{ total += Math.max(0, Math.min(QA_MAX[k], scores[k]||0)); });
  const dep=scores.dependency||0;
  const approve = total>=QA_THRESHOLD && dep>=QA_DEP_MIN;
  return { total, max:QA_TOTAL_MAX, dependency:dep, approve,
    reason: approve?null:(dep<QA_DEP_MIN ? ("dependency "+dep+" < "+QA_DEP_MIN+" (mandatory)") : ("total "+total+" < "+QA_THRESHOLD)) };
}

/* Content-readiness gate over the APPROVED bank. Do NOT expose Integrated Mode until ready. */
export const READINESS = { minApproved:100, minFamilies:8, minPerFamily:10, maxFamilyShare:0.30, minPerPairAnalytics:3 };
export function readinessGate(approved, cfg){
  const R=Object.assign({}, READINESS, cfg||{});
  approved=approved||[];
  const byFamily={}; approved.forEach(it=>{ const f=(it&&it.integration_family)||"?"; byFamily[f]=(byFamily[f]||0)+1; });
  const total=approved.length, families=Object.keys(byFamily);
  const familiesOverMin=families.filter(f=>byFamily[f]>=R.minPerFamily);
  const biggestShare = total ? Math.max(0, ...families.map(f=>byFamily[f]/total)) : 0;
  const checks={
    enough_total: total>=R.minApproved,
    enough_families: families.length>=R.minFamilies,
    families_over_min_size: familiesOverMin.length>=R.minFamilies,
    no_family_dominates: biggestShare<=R.maxFamilyShare
  };
  const ready = Object.values(checks).every(Boolean);
  const analytics_ready_families = families.filter(f=>byFamily[f]>=R.minPerPairAnalytics);
  return { ready, total, families:families.length, byFamily, biggest_family_share:Math.round(biggestShare*100)/100,
    checks, analytics_ready_families, gate:R };
}

/* review lifecycle: candidate → ai_reviewed → pending → approved | rejected | needs_edit → (resubmit) pending */
export function nextStatus(cur, action){
  const flow={ candidate:{ ai_review:"ai_reviewed", reject:"rejected" },
    ai_reviewed:{ to_human:"pending", reject:"rejected" },
    pending:{ approve:"approved", reject:"rejected", edit:"needs_edit" },
    needs_edit:{ resubmit:"pending", reject:"rejected" } };
  return (flow[cur] && flow[cur][action]) || cur;
}

/* ---- pipeline orchestration. AI seams (mine, adversarial) are INJECTED — candidate-finders, never judges.
   The canonical question is READ-ONLY here; transformation yields a NEW record carrying source_question_ids[].
   No path produces "approved" — the only route to approved is applyHumanReview(). ---- */
export async function runCandidate(question, deps){
  const srcId = question.id || question._qh || null;
  const proposal = await deps.mine(question);                          // AI proposes a candidate integration (or null)
  if(!proposal) return { question_id:srcId, review_status:"rejected", reason:"no candidate", mined:false, source_question_ids:[srcId] };
  // review the ACTUAL candidate: the TRANSFORMED question if this was a transformation, else the original.
  const reviewQ = (proposal.transformed_content && proposal.transformed_content.stem)
    ? { stem:proposal.transformed_content.stem, options:proposal.transformed_content.options||[], answer:proposal.transformed_content.answer||0 }
    : question;
  const verdict = await deps.adversarial(reviewQ, proposal);          // AI actively tries to DISPROVE integration
  const dep = dependencyGate(verdict||{});
  const rec = {
    question_id: srcId,
    primary_topic: proposal.primary_topic||null,
    integrated_topics: proposal.integrated_topics||[],
    integration_type: proposal.integration_type||null,
    integration_family: proposal.integration_family||null,
    integration_rationale: proposal.rationale||null,
    integration_dependency: proposal.dependency||null,
    transformed_content: proposal.transformed_content||null,          // NEW content, if any — original stays untouched
    source_question_ids: proposal.source_question_ids||[srcId],
    dependency_evidence: verdict||null
  };
  if(!dep.pass) return Object.assign(rec, { review_status:"rejected", reason:dep.reasons.join("; ") });
  return Object.assign(rec, { review_status:"ai_reviewed" });          // → human queue; NEVER auto-approved
}
/* The ONLY route to 'approved'. Requires an explicit approve action AND a passing QA score; a failing QA on an
   approve attempt is bounced to needs_edit (a mediocre item cannot slip into the bank). */
export function applyHumanReview(item, action, qaScores, reviewer){
  const at=new Date().toISOString();
  if(action==="approve"){ const qa=qaScore(qaScores||{});
    if(!qa.approve) return Object.assign({}, item, { review_status:"needs_edit", qa, reviewer, reviewed_at:at, reason:qa.reason });
    return Object.assign({}, item, { review_status:"approved", qa, reviewer, reviewed_at:at }); }
  if(action==="reject") return Object.assign({}, item, { review_status:"rejected", reviewer, reviewed_at:at });
  if(action==="edit")   return Object.assign({}, item, { review_status:"needs_edit", reviewer, reviewed_at:at });
  return item;
}
