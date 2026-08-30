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

/* ── Reviewer 2 — CLINICAL VALIDITY. The reviewer must reconstruct the case INDEPENDENTLY
   (facts → differential/physiology → conclusion) and only THEN compare to the keyed answer, so a
   suggestive downstream finding can't make it rationalise a wrong key (the #3 SIADH/ODS failure). */
export function clinicalGate(v){
  v=v||{};
  const errors = Array.isArray(v.errors) ? v.errors.filter(Boolean) : [];
  const valid = v.valid!==false && errors.length===0;                 // no false premise / physiology / timeline
  const matches_key = v.matches_key===true;                            // independent reconstruction lands on the key
  const stem_sufficient = v.stem_sufficient!==false;                   // answerable without an unstated assumption
  const pass = valid && matches_key && stem_sufficient;
  return { pass, valid, matches_key, stem_sufficient, errors, reconstructed:v.reconstructed||null };
}

/* ── Reviewer 3 — SINGLE-BEST-ANSWER. Distractor competitiveness is graded, not boolean:
   none | weak (minor tighten) | strong (major edit) | correct (a distractor is actually right → hard fail). */
export const DISTRACTOR_GRADES = ["none","weak","strong","correct"];
export function sbaGate(v){
  v=v||{};
  // DECISIVE: does a genuinely defensible alternative survive correct reasoning? (boolean, not the ordinal grade)
  const defensible_alternative = v.defensible_alternative===true;
  const distractor_correct = v.distractor_answer_actually_correct===true || v.distractor_flaw==="correct";
  const leakage = v.leakage===true;                                    // wording/imaging/sequence announces the answer
  // metadata only — NOT allowed to drive severity (an inferior distractor the model labels "weak" is not a flaw):
  const distractor_flaw = DISTRACTOR_GRADES.includes(v.distractor_flaw) ? v.distractor_flaw : "none";
  const single_best = v.single_best!==false;
  const pass = !defensible_alternative && !distractor_correct && !leakage;
  return { pass, defensible_alternative, distractor_correct, leakage, distractor_flaw, single_best, alternative:v.alternative||null };
}

/* ── Aggregate the specialist verdicts into ONE severity + recommended action. Deterministic and unit-tested;
   the reviewers (LLM) supply the signals, this maps them. Severity: hard > major > minor > none.
   hard → auto-reject; major/minor/none → to the HUMAN queue (never auto-approved), carrying the flags. */
/* ===== Deterministic redundant-therapy gate (V1.8.2) =====================================================
   Redundancy detection is a STRUCTURED FACT-CHECK, not clinical judgement, so it lives in code — never inside an
   LLM reviewer's attention budget (that competes with R2's mechanism reconstruction; see the #3/ODS regression).
   Rule: FLAG only when the keyed therapy is ADDED and its therapeutic class is ALREADY PRESENT in the stem's meds
   AND concurrent same-class use ordinarily constitutes duplicate therapy. DIFFERENT classes combined on purpose
   (the 4-pillar HFrEF regimen, loop+thiazide, dual bronchodilators) never match, so legitimate combinations are
   safe BY CONSTRUCTION. Versioned so the rule set is auditable. */
export const DRUG_CLASS_VERSION = "1.8.2";
export const DRUG_CLASSES = {
  // beta-blockers (incl. combined alpha/beta) — two beta-blockers is never intentional combination therapy
  carvedilol:["beta_blocker"], labetalol:["beta_blocker"], bisoprolol:["beta_blocker"], metoprolol:["beta_blocker"],
  nebivolol:["beta_blocker"], atenolol:["beta_blocker"], propranolol:["beta_blocker"], sotalol:["beta_blocker"],
  // SGLT2 inhibitors
  empagliflozin:["sglt2i"], dapagliflozin:["sglt2i"], canagliflozin:["sglt2i"], ertugliflozin:["sglt2i"],
  // RAAS blockers — ACE-I / ARB / ARNI all share raas_blocker so dual RAAS (incl. on top of an ARNI) is caught
  lisinopril:["acei","raas_blocker"], ramipril:["acei","raas_blocker"], enalapril:["acei","raas_blocker"],
  perindopril:["acei","raas_blocker"], captopril:["acei","raas_blocker"],
  losartan:["arb","raas_blocker"], candesartan:["arb","raas_blocker"], valsartan:["arb","raas_blocker"],
  irbesartan:["arb","raas_blocker"], telmisartan:["arb","raas_blocker"], olmesartan:["arb","raas_blocker"],
  sacubitril:["arni","arb","raas_blocker"],   // sacubitril/valsartan is written with a slash; matching sacubitril tags the ARNI
  // MRA / potassium-sparing — two MRAs, or MRA + K-sparing, is redundant/hazardous
  spironolactone:["mra","k_sparing"], eplerenone:["mra","k_sparing"], amiloride:["k_sparing"], triamterene:["k_sparing"],
  // non-dihydropyridine CCB, biguanide, loop, thiazide, DPP-4 (distinct classes; here for completeness)
  verapamil:["non_dhp_ccb"], diltiazem:["non_dhp_ccb"], metformin:["biguanide"],
  furosemide:["loop"], bumetanide:["loop"], torsemide:["loop"],
  hydrochlorothiazide:["thiazide"], indapamide:["thiazide"], bendroflumethiazide:["thiazide"],
  sitagliptin:["dpp4"], linagliptin:["dpp4"], saxagliptin:["dpp4"]
};
const _RED_SUBSTITUTION = /\b(switch|switching|replace|replacing|substitut|stop|stopping|discontinu|change\s+\w+\s+to|instead of|in place of|down-?titrat|reduce|reducing)\b/i;
const _RED_ADDITIVE = /\b(add|adding|start|starting|commenc|initiat|introduc|up-?titrat|increase|increasing|combine|combining)\b/i;
function _drugsIn(text){ const t=" "+String(text||"").toLowerCase()+" "; const found=[]; for(const name in DRUG_CLASSES){ if(new RegExp("\\b"+name+"\\b","i").test(t)) found.push(name); } return found; }
function _classesOf(names){ const s=new Set(); names.forEach(n=>(DRUG_CLASSES[n]||[]).forEach(c=>s.add(c))); return s; }
export function redundancyGate(q){
  q=q||{}; const opts=q.options||[]; const ai=(typeof q.answer==="number")?q.answer:0;
  const keyedText=String(opts[ai]||"");
  const present=_drugsIn(q.stem);                     // meds the patient is already on (from the stem)
  const keyedDrugs=_drugsIn(keyedText);               // drug named in the keyed option
  // additive iff the option introduces a drug and is NOT phrased as a switch/stop/substitution
  const additive = _RED_ADDITIVE.test(keyedText) || (!_RED_SUBSTITUTION.test(keyedText) && keyedDrugs.length>0);
  const substitution = _RED_SUBSTITUTION.test(keyedText);
  const presentClasses=_classesOf(present), keyedClasses=_classesOf(keyedDrugs);
  const shared=[...keyedClasses].filter(c=>presentClasses.has(c));
  const conflicts=[]; if(shared.length){ present.forEach(p=>{ if((DRUG_CLASSES[p]||[]).some(c=>shared.includes(c))) conflicts.push(p); }); }
  const duplicate = additive && !substitution && shared.length>0 && keyedDrugs.length>0
                    && conflicts.filter(p=>!keyedDrugs.includes(p)).length>0;   // must duplicate a DIFFERENT existing agent
  const dupPartners=conflicts.filter(p=>!keyedDrugs.includes(p));
  const reason = duplicate
    ? ("keyed therapy "+keyedDrugs.join("/")+" duplicates existing "+dupPartners.join("/")+" (shared class: "+shared.join(", ")+") — switch/adjust the existing agent, do not add a second of the same class")
    : "";
  return { version:DRUG_CLASS_VERSION, duplicate, additive, substitution, present_drugs:present, present_classes:[...presentClasses],
           keyed_drugs:keyedDrugs, keyed_classes:[...keyedClasses], shared_classes:shared, conflicts:dupPartners, reason };
}

export const SEVERITY_RANK = { none:0, minor:1, major:2, hard:3 };
export function qaVerdict(inp){
  inp=inp||{};
  const dep = inp.dependency || { pass:false, reasons:["no dependency verdict"] };
  const iq  = ["strong","adequate","artificial"].includes(inp.integration_quality) ? inp.integration_quality : "adequate";
  const clin= inp.clinical || { pass:false, valid:false, matches_key:false, stem_sufficient:false, errors:["no clinical verdict"] };
  const sba = inp.sba || { pass:false, single_best:false, distractor_flaw:"none", leakage:false };
  const criteria = {};
  const fail = (name, sev, reason)=>{ criteria[name]={ pass:false, severity:sev, reason }; };
  const pass = (name)=>{ criteria[name]={ pass:true, severity:"none" }; };

  // 1 cross-domain dependency (hard: not eligible for Integrated if it isn't genuinely integrated)
  dep.pass ? pass("cross_domain_dependency") : fail("cross_domain_dependency","hard",(dep.reasons||[]).join("; ")||"not integrated");
  // 2 clinical validity — HARD only on an ACTUAL clinical error (wrong physiology/timeline/dose/impossible premise).
  //   A key the reviewer merely disagrees with while reporting no error (valid:true, matches_key:false) is NOT a
  //   clinical error — it's a single-best-answer dispute, handled in criterion 3. (Live-calibration fix: #6.)
  if(!clin.valid) fail("clinical_validity","hard",(clin.errors||[]).join("; ")||"clinically invalid");
  else pass("clinical_validity");
  // 3 single-best-answer — DECISIVE signal is R3's defensible_alternative boolean (or R2 independently preferring
  //   another VALID answer). A clearly-inferior distractor NEVER flags here, whatever its none/weak/strong metadata
  //   says — that was the #5 over-flag. A distractor that is actually correct → HARD (two correct answers).
  const answerDispute = clin.valid && clin.matches_key===false;      // R2 prefers a different, still-valid answer
  if(sba.distractor_correct) fail("single_best_answer","hard","a distractor is actually correct (two correct answers)");
  else if(sba.defensible_alternative || answerDispute) fail("single_best_answer","major","a competing answer remains defensible after reasoning; the keyed answer's priority is not established");
  else pass("single_best_answer");
  // 4 redundant therapy (deterministic gate; hard — a duplicate-class drug is a clinical medication error).
  //   Only evaluated when a redundancy verdict is supplied, so legacy callers/tests are unchanged.
  if(inp.redundancy){ inp.redundancy.duplicate ? fail("redundant_therapy","hard",inp.redundancy.reason||"keyed therapy duplicates an existing drug class") : pass("redundant_therapy"); }
  // 5 integration quality (artificial→major, adequate→minor, strong→pass)
  if(iq==="artificial") fail("integration_quality","major","integration is an artificial label pairing");
  else if(iq==="adequate") fail("integration_quality","minor","integration is real but close to pattern-recognition");
  else pass("integration_quality");
  // 6 stem sufficiency (major)
  clin.stem_sufficient ? pass("stem_sufficiency") : fail("stem_sufficiency","major","stem needs an unstated assumption");
  // 7 no answer leakage (hard if it forces an UNjustified key; else major)
  if(sba.leakage) fail("answer_leakage", (!clin.valid?"hard":"major"), "wording/imaging/sequence announces the answer");
  else pass("answer_leakage");

  let sev="none";
  Object.values(criteria).forEach(c=>{ if(SEVERITY_RANK[c.severity]>SEVERITY_RANK[sev]) sev=c.severity; });
  const action = sev==="hard"?"reject" : sev==="major"?"major_edit" : sev==="minor"?"minor_edit" : "pass";
  const reasons = Object.entries(criteria).filter(([,c])=>!c.pass).map(([k,c])=>k+" ["+c.severity+"]: "+c.reason);
  return { severity:sev, action, review_status: sev==="hard"?"rejected":"ai_reviewed", criteria, reasons,
           gates:{ dependency:dep, integration_quality:iq, clinical:clin, sba } };
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
export const READINESS = { minApproved:20, minFamilies:8, minPerFamily:2, maxFamilyShare:0.35, minPerPairAnalytics:3 };
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

/* Deterministic answer-position rebalancer. The transformer biases the key toward option A; we FIX it after
   generation (not by asking the model to "vary it"): seeded Fisher-Yates reorder of the options, key remapped to
   the new position of the SAME correct option, and any parallel per-option array (rationales) reordered identically.
   Seeded off the stem so it's reproducible per item but ~uniform across a batch. Reordering can't change meaning
   (same option strings) or add ambiguity. */
/* Content-boundary normalizer: the generator sometimes emits option text already carrying its OWN positional
   letter label ("A. Initiate…"); the UI then adds a letter too → "A. A. Initiate…". Strip ONLY the option's own
   positional prefix (idx 0 → "A", idx 1 → "B", …) so we never touch legitimate content like "E. coli" (unless it
   sits at position E AND was double-labelled, which strips correctly). Idempotent. Storage holds bare text; the
   letter is a render concern; the answer key stays an index. Does not touch reviewer/generator logic. */
export function normalizeOptions(options){
  return (options||[]).map((o,i)=>{
    const letter=String.fromCharCode(65+i);
    const re=new RegExp("^\\s*"+letter+"\\s*[.)\\-:]\\s+","i");
    let s=String(o==null?"":o); if(re.test(s)) s=s.replace(re,"");   // strip at most one positional prefix
    return s.trim();
  });
}
function _strSeed(s){ let h=2166136261>>>0; s=String(s||""); for(let i=0;i<s.length;i++){ h^=s.charCodeAt(i); h=Math.imul(h,16777619); } return h>>>0; }
function _mulberry32(a){ return function(){ a|=0; a=a+0x6D2B79F5|0; let t=Math.imul(a^a>>>15,1|a); t=t+Math.imul(t^t>>>7,61|t)^t; return ((t^t>>>14)>>>0)/4294967296; }; }
export function rebalanceOptions(tc, seedStr){
  tc=tc||{}; const opts=(tc.options||[]).slice(); const ans=Number.isInteger(tc.answer)?tc.answer:0;
  if(opts.length<2) return { options:opts, answer:ans, order:opts.map((_,i)=>i) };
  const order=opts.map((_,i)=>i); const rnd=_mulberry32(_strSeed(seedStr||tc.stem||""));
  for(let i=order.length-1;i>0;i--){ const j=Math.floor(rnd()*(i+1)); const t=order[i]; order[i]=order[j]; order[j]=t; }
  return { options:order.map(i=>opts[i]), answer:order.indexOf(ans), order };
}

/* Diversity signal (ADVISORY, no embeddings). Compares a candidate to the existing corpus on BOTH wording and
   reasoning STRUCTURE (family + intervention/answer + demographic template), so two differently-worded questions
   testing the same pattern are still caught. Tiers: exact → auto-reject; high → suppress (kept out of the clean
   queue, human sees it); moderate → warning (metadata only). Does NOT touch R1/R2/R3. */
export const DIVERSITY = { high:0.6, moderate:0.4 };
function _dnorm(s){ return String(s||"").toLowerCase().replace(/[^a-z0-9 ]/g," ").replace(/\s+/g," ").trim(); }
function _dtok(s){ return new Set(_dnorm(s).split(" ").filter(w=>w.length>3)); }
function _djac(a,b){ if(!a.size||!b.size) return 0; let i=0; a.forEach(x=>{ if(b.has(x))i++; }); return i/(a.size+b.size-i); }
function _ddemo(s){ const m=_dnorm(s).match(/(\d{1,3}) year old (man|woman|male|female|boy|girl)/); return m?(m[1]+"|"+m[2]):null; }
export function diversitySignal(cand, corpus, cfg){
  const R=Object.assign({}, DIVERSITY, cfg||{}); cand=cand||{};
  const cStem=_dnorm(cand.stem), cTok=_dtok(cand.stem), cOpts=_dtok((cand.options||[]).join(" "));
  const cAns=_dnorm((cand.options||[])[cand.answer]), cDemo=_ddemo(cand.stem), cFam=cand.integration_family||"";
  const rank={ok:0,moderate:1,high:2,exact:3}; let best={ tier:"ok", sim:0, matched:null, reasons:[] };
  (corpus||[]).forEach(o=>{
    if(best.tier==="exact") return;
    const oStem=_dnorm(o.stem);
    if(oStem && oStem===cStem){ best={ tier:"exact", sim:1, matched:o.id||null, reasons:["identical stem"] }; return; }
    const stemSim=_djac(cTok,_dtok(o.stem)), optSim=_djac(cOpts,_dtok((o.options||[]).join(" ")));
    const sameStruct = cFam && cFam===(o.integration_family||"") && cAns && cAns===_dnorm((o.options||[])[o.answer]);
    const sameDemo = cDemo && cDemo===_ddemo(o.stem);
    let tier="ok"; const reasons=[];
    if(stemSim>=R.high || (sameStruct && stemSim>=R.moderate)){ tier="high"; reasons.push("stem "+Math.round(stemSim*100)+"%"+(sameStruct?" + same family/intervention":"")); }
    else if(stemSim>=R.moderate || sameStruct || (sameDemo && optSim>=R.moderate)){ tier="moderate"; reasons.push(sameStruct?"same family + same intervention":(sameDemo?"same demographic template":"stem "+Math.round(stemSim*100)+"%")); }
    if(rank[tier]>rank[best.tier]) best={ tier, sim:Math.max(stemSim,optSim), matched:o.id||null, reasons };
  });
  return best;
}

/* Source-aware budget (provenance). A single source question yields only so many GENUINELY distinct integrated
   candidates; past that, transforming it again just manufactures near-duplicates the diversity layer will reject.
   Count the good, distinct candidates already produced from a source (ai_reviewed|approved, not exact/high-dup);
   once >= cap, stop mining that source. This is smarter than comparing final text — it reasons per starting point. */
export const SOURCE_CAP = 3;
export function sourceBudget(sourceId, corpus, cap){
  cap = cap || SOURCE_CAP;
  let count=0;
  (corpus||[]).forEach(it=>{
    const src = it.question_id===sourceId || (Array.isArray(it.source_question_ids) && it.source_question_ids.includes(sourceId));
    if(!src) return;
    const good = it.review_status==="ai_reviewed" || it.review_status==="approved";
    const divTier = it.qa && it.qa.diversity && it.qa.diversity.tier;
    const distinct = divTier!=="exact" && divTier!=="high";
    if(good && distinct) count++;
  });
  return { source_id:sourceId, count, cap, exhausted:count>=cap };
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
  // Reviewer 1 — dependency (AI actively tries to DISPROVE integration)
  const verdict = await deps.adversarial(reviewQ, proposal);
  const dep = dependencyGate(verdict||{});
  // Reviewer 2 — clinical validity (independent reconstruction). Reviewer 3 — single-best-answer.
  // Injected as separate specialists so one model never polices integration + medicine + answer-uniqueness at once.
  const clin = deps.clinical ? clinicalGate(await deps.clinical(reviewQ, proposal)) : { pass:true, valid:true, matches_key:true, stem_sufficient:true, errors:[], skipped:true };
  const sba  = deps.sba      ? sbaGate(await deps.sba(reviewQ, proposal))          : { pass:true, single_best:true, distractor_flaw:"none", leakage:false, skipped:true };
  const redundancy = redundancyGate(reviewQ);   // deterministic same-class duplicate-therapy check
  const qa = qaVerdict({ dependency:dep, integration_quality:(verdict&&verdict.quality)||"adequate", clinical:clin, sba, redundancy });
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
    dependency_evidence: verdict||null,
    qa,                                                                // full multi-reviewer verdict + severity
    severity: qa.severity
  };
  // hard fail → auto-reject. Everything else → HUMAN queue (ai_reviewed), carrying severity/flags. NEVER auto-approved.
  return Object.assign(rec, { review_status: qa.review_status, reason: qa.reasons.length?qa.reasons.join(" | "):null });
}
/* The ONLY route to 'approved'. Requires an explicit approve action AND a passing QA score; a failing QA on an
   approve attempt is bounced to needs_edit (a mediocre item cannot slip into the bank). */
export function applyHumanReview(item, action, qaScores, reviewer){
  const at=new Date().toISOString();
  if(action==="approve"){ const human=qaScore(qaScores||{});
    // a human may NOT approve over a machine HARD fail — clinical error / dual-answer / dangerous Tx cannot be waved through
    const machineHard = item && item.qa && item.qa.severity==="hard";
    const qa=Object.assign({}, item&&item.qa, { human });
    if(machineHard) return Object.assign({}, item, { review_status:"rejected", qa, reviewer, reviewed_at:at, reason:"machine hard-fail cannot be human-approved: "+((item.qa.reasons||[]).join(" | ")) });
    if(!human.approve) return Object.assign({}, item, { review_status:"needs_edit", qa, reviewer, reviewed_at:at, reason:human.reason });
    return Object.assign({}, item, { review_status:"approved", qa, reviewer, reviewed_at:at }); }
  if(action==="reject") return Object.assign({}, item, { review_status:"rejected", reviewer, reviewed_at:at });
  if(action==="edit")   return Object.assign({}, item, { review_status:"needs_edit", reviewer, reviewed_at:at });
  return item;
}
