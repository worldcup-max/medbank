# Production review log — Phase A human first-pass reviews

Running record of first-pass reviews of the acquisition queue. First-pass = agent recommendation; APPROVAL is human (Frank).
The machine gate (R1→R2→R3→R4) rejects hard failures; everything else queues for human review.

---

## Batch 2026-08-30 (first deficit-aware batch) — 40 pending

Composition: 6 were the permanent calibration-6 benchmark items (excluded from approval — approving would contaminate the
benchmark). 34 genuine production candidates.

**Funnel (34 candidates):**
- 17 approve-worthy (~50%)
- 7 needs-edit (~21%)
- 4 clinical/SBA reject (~12%)
- 6 duplicate reject (~18%)

Verdict: HEALTHY stream — the machine gate is not producing garbage humans must clean wholesale. Bottleneck is
**review throughput + source diversity**, not acquisition quality.

**Applied (Frank's independent review, 2026-08-30):** the agent first-pass recommended 17 approvals; Frank's independent
human review tightened this — several first-pass approvals were too generous for the canonical bank.
FINAL: **7 approved · 8 needs-edit · 2 reject/rebuild.** Corpus 47 → **54 approved**. Both thin pairs (endocrine_renal,
cardio_endocrine) reached 3, so the per-pair blocker cleared; one family reached ≥10. Remaining blockers: 54/100 total,
9 families below 10.
- Approved (7): #7 HRS, #8 TLS→dialysis, #13 SBP+albumin, #14 cor pulmonale mechanism, #32 unstable AF→cardioversion,
  #34 tertiary hyperPTH, #36 pheo β-block-after-α.
- Needs-edit (8): #9, #15 (urgent-cesarean too categorical), #21 (SpO2>90 not universal in COPD), #26, #27, #31, #33, #40.
- Reject/rebuild (2): #29 (ARR is a SCREENING not confirmatory criterion), #39 (lorazepam-as-safest framing too strong).

**The metric that matters (not the 50% machine-to-human rate):** canonical-quality questions GAINED this batch = **7**,
with **8 recoverable via edit**. This — not raw approval rate — is what we track going forward.

**Clinical/SBA rejects (hard stops):**
- #16 cardio_endocrine — TWO options are SGLT2 inhibitors (dapagliflozin AND empagliflozin) → two correct answers.
- #22 cardio_endocrine — keys "hypoglycemia from SGLT2i"; clinically the picture is volume depletion. Wrong mechanism.
- #23 pregnancy_cardio — both plausible keys flawed (preeclampsia unsupported / "systolic failure" contradicts EF 55%).
- #37 endocrine_renal — Na rose 6 mmol in 1h (overcorrection) yet keyed "just monitor"; should be desmopressin. Dangerous.

**Duplicate rejects (source-pool signal, NOT a QA problem):** haemoconcentration ×3 (#9/#12/#17), mitral-stenosis-AF ×2
(#28/#32), mechanical-valve ×2 (#30/#33), pheochromocytoma ×2 (#36/#38), peripartum-CM ×2 (#15/#24).
Root cause: deficit-aware acquisition is correctly pushing the thin families (cardio_endocrine, pregnancy_cardio), but
their SOURCE POOLS are too shallow, so the generator re-discovers the same clinical territory. Fix upstream (broaden
pools — see SOURCE-POOLS-THIN-FAMILIES.md), do NOT loosen QA or approve duplicates for volume.

---

## OBSERVED FAILURE ARCHETYPES (production evidence → future targeted change; do NOT modify frozen V1.8.2 yet)

| Archetype | First seen | What it is | Current handling | Candidate future rule |
|-----------|-----------|-----------|------------------|-----------------------|
| **Multiple same-class answer OPTIONS** | #16, 2026-08-30 | Two answer options belong to the same drug class and are both defensible (e.g. dapagliflozin + empagliflozin) → no single best answer | Caught by **R3** as `single_best_answer [major]` → routed to human (working as designed; major≠auto-reject). R4 did NOT fire because R4 checks keyed-answer-vs-stem-meds, not option-vs-option. | IF this recurs: a deterministic option-set check (no two options share a therapeutic class where both would be correct). Distinct from R4's stem→keyed redundancy. LOG FIRST — only build if it's a recurring archetype, not a one-off. |

Note on #16 telemetry: this is NOT an R4 miss. R4's job is stem medication → keyed therapy duplication (V18-4/5). #16 is a
different shape (two distractors same class). R3 correctly flagged it major. Logging as a potential future deterministic
option-class rule; no gate change today.

---

## Batch 2026-09-08 (weekday acquisition run) — 10 transforms, 3 new reviewable

Pipeline FROZEN V1.8.2 (no reviewer/generator/gate change). Nothing auto-approved: approved stayed **54** throughout.

**Targeting.** No pair below the ≥3 analytics gate (`every_pair_ready: true`), so step 3a was already satisfied —
went straight to largest deficits: cardio_endocrine 7, endocrine_renal 7, hepatic_pharm 7, pregnancy_cardio 6.

**BLOCKER FOUND — source-pool exhaustion in the two most deficient families.** Enumerating
`topics.extras.qbank` against processed `integrated_items` question_ids:
- **hepatic_pharm: 0 fresh sources.** All five pools fully mined (paracetamol/NAC 0/6, DILI 0/7, anti-TB 0/8,
  analgesia-sedation 0/6, drug clearance 0/10, Cirrhosis+Drug Metabolism SEED 0/10). **Cannot be acquired at all**
  until new concept lectures are authored. Deficit 7 and structurally stuck.
- **endocrine_renal: 2 fresh sources** (both CKD-MBD). DKA+AKI, glucose-lowering across eGFR, primary
  hyperaldosteronism-renal, ADH disorders all 0 fresh. Deficit 7, effectively stuck after this run.
So the run targeted **cardio_endocrine (7)**, **pregnancy_cardio (6)**, **endocrine_renal (7, took its last 2)**;
hepatic_pharm skipped for lack of material, not by choice.

**Funnel (10 distinct fresh sources → 3 reviewable):**
| Family | Transformed | Reviewable | Rejected |
|---|---|---|---|
| cardio_endocrine | 5 | 1 (major) | 4 (4 R1 hard, 1 of them R2 clinical hard) |
| pregnancy_cardio | 3 | 2 (none, none) | 1 (R1 hard) |
| endocrine_renal | 2 | 0 | 2 (R1 hard) |

R1 yield **30%** — well below the 50–56% frozen-generator norm. Cause is source shape, not the gate: the
remaining unmined sources in these pools are the *shallow* ones (single-domain lookups), because earlier batches
already took the genuinely integrative material. R1 correctly called them "answer reachable by a simple
modifier/lookup" / "artificial label pairing". Do NOT tune R1 on this — it is reading the sources right.

**The 3 new candidates (human review pending, in `ai_reviewed`):**
- pregnancy_cardio — amniotic fluid embolism, severity `none`, diversity `ok`. Cleanest item of the batch.
- pregnancy_cardio — Eisenmenger/PAH in pregnancy, severity `none`, diversity `moderate`.
- cardio_endocrine — Addisonian crisis / peri-operative steroid withdrawal, severity `major` from
  **diversity[high]** (stem 58% + same family/intervention). Edit-lean at best; likely a near-dup.

**V1.8.2 duplicate-rate fix — evidence is now NEGATIVE-leaning, not proven.** The one cardio_endocrine item that
survived came from a *newly added* thin-family lecture and still tripped diversity[high]. Small n (1 of 1), so not
conclusive, but the added-lectures hypothesis has not yet produced a clean cardio_endocrine item. Keep watching.

**Also logged:** one R2 clinical hard-fail on carcinoid heart disease (keyed valve replacement over telotristat/
medical optimisation) — R2 working as designed, caught a genuinely wrong key.

**Next-run priority deficits:** `hepatic_pharm` (7) and `endocrine_renal` (7) — but BOTH are source-blocked, so
the next run cannot fix them by acquiring. **Upstream action required first: author new concept lectures for
hepatic_pharm and endocrine_renal** (the SOURCE-POOLS-THIN-FAMILIES.md treatment, applied to these two families).
Until then the only acquirable large deficits are `pregnancy_cardio` (6) and `cardio_renal` (5).

---

## Batch 2026-09-08 (run 2, weekday acquisition) — 12 transforms, 5 new reviewable

Pipeline FROZEN V1.8.2 (no reviewer/generator/gate change). Nothing auto-approved: approved stayed **54** throughout.

**Targeting.** `every_pair_ready: true` again (no pair below 3), so step 3a satisfied → largest deficits.
Re-confirmed the source-block from run 1 by re-enumerating `topics.extras.qbank` vs processed `integrated_items`:
**hepatic_pharm 0 fresh sources** (all 6 pools mined) and **endocrine_renal 0 fresh sources** (its last 2 CKD-MBD
sources were consumed in run 1). Both deficit-7 families are structurally unacquirable. So this run targeted the
largest *acquirable* deficits: **cardio_endocrine (7)**, **pregnancy_cardio (6)**, **infect_immunology (5)**.
infect_immunology was added deliberately for breadth — its SRC pools (asplenia, IRIS, transplant infections) were
essentially unmined, unlike the twice-worked cardio_endocrine/pregnancy_cardio pools.

**Funnel (12 distinct fresh sources → 5 reviewable, 42%):**
| Family | Transformed | Reviewable | Rejected |
|---|---|---|---|
| cardio_endocrine | 4 | 1 (none, diversity moderate) | 3 (2 R1 hard, 1 self-gate "no candidate") |
| pregnancy_cardio | 4 | 1 (none, diversity ok) | 3 (2 R1 hard, 1 self-gate) |
| infect_immunology | 4 | 3 (none/ok, major/ok, none/moderate) | 1 (R1 hard) |

**Signal: yield tracks source freshness, not family.** R1 yield recovered to **42%** (from 30% in run 1) and the
recovery is entirely infect_immunology's **3/4** on never-mined pools, against 1/4 in each of the two re-worked
families. This is direct corroboration of the frozen-playbook thesis — breadth of independent source material, not
reviewer tuning, is the yield lever. Do NOT tune R1; it is reading the shallow leftovers correctly.

**V1.8.2 duplicate-rate fix — first positive evidence.** The cardio_endocrine and pregnancy_cardio survivors both
came from the newly added thin-family lectures and this time landed **diversity moderate / ok**, not the
`diversity[high]` seen in run 1. **Zero exact duplicates and zero high near-duplicates across all 12.** Still small
n; keep accumulating before calling the fix successful.

**The 5 new candidates (human review pending, `ai_reviewed`):**
- infect_immunology — IRIS after ART, severity `none`, diversity `ok`. Cleanest of the batch.
- infect_immunology — IRIS after ART (second concept), severity `none`, diversity `moderate`.
- infect_immunology — asplenia / encapsulated-organism sepsis, severity `major` from **R3 single_best_answer**
  ("a competing answer remains defensible; keyed answer's priority not established"). Edit-lean.
- pregnancy_cardio — aortopathy / Marfan dissection risk, severity `none`, diversity `ok`.
- cardio_endocrine — primary hyperaldosteronism target-organ damage, severity `none`, diversity `moderate`.

No R2 clinical hard-fails this batch. Queue depth after run: `ai_reviewed` 99 → **104**, `needs_edit` 16.

**Next-run priority deficits:** `hepatic_pharm` (7) and `endocrine_renal` (7) — **both remain source-blocked and
cannot be fixed by acquiring**. Upstream action is now the binding constraint, unchanged from run 1: author new
concept lectures for these two families (SOURCE-POOLS-THIN-FAMILIES.md treatment). Largest acquirable deficits for
the next run: `cardio_endocrine` (7), `pregnancy_cardio` (6), then `onco_haem` / `cardio_renal` / `infect_immunology` (5)
— onco_haem and cardio_renal both still hold large unmined SRC pools and should be preferred for yield.

**Note the real throughput constraint:** 104 ai_reviewed + 16 needs_edit are queued against 54 approved. Acquisition
is running well ahead of human review; more batches will not move the readiness gate until items are reviewed.

---

## Batch 2026-09-08 (run 3, weekday acquisition) — 12 distinct sources (14 calls), 4 new reviewable

Pipeline FROZEN V1.8.2 (no reviewer/generator/gate change). Nothing auto-approved: approved stayed **54** throughout.

**Targeting.** `every_pair_ready: true` (no pair below 3) → step 3a satisfied, so largest deficits. Re-enumerated
`topics.extras.qbank` vs processed `integrated_items`: **hepatic_pharm and endocrine_renal still show 0 fresh sources**
(third consecutive confirmation — both deficit-7 families remain structurally unacquirable). Targeted the largest
*acquirable* deficits: **cardio_endocrine (7)**, **pregnancy_cardio (6)**, **onco_haem (5)** — onco_haem added on
run 2's recommendation (large unmined SRC pools), pregnancy_cardio chosen to exercise the never-mined
"Mitral stenosis decompensating in pregnancy (SRC)" lecture (10 fresh) that had previously FAILED to build.

**Funnel (12 distinct fresh sources → 4 reviewable, 33%):**
| Family | Transformed | Reviewable | Rejected |
|---|---|---|---|
| cardio_endocrine | 4 | 2 (none/moderate, none/ok) | 2 (1 R1 hard, 1 self-gate "no candidate") |
| pregnancy_cardio | 4 | 0 | 4 (3 R1 hard incl. 1 with an R2 clinical hard-fail, 1 self-gate) |
| onco_haem | 4 | 2 (none/ok; major from diversity[high]) | 2 (R1 hard) |

**R1 yield fell to 33%** (42% run 2, 30% run 1). The drop is not family-specific: cardio_endocrine held 2/4 on the
new thin-family lectures, but pregnancy_cardio went **0/4** and onco_haem 2/4 — and every pregnancy_cardio rejection
was R1 `cross_domain_dependency [hard]` ("removing the primary domain does not materially change the reasoning" /
"answer reachable by a simple modifier/lookup"). Read: the pregnancy_cardio source questions are single-domain
obstetric-cardiology management items whose "integration" is a pregnancy modifier, which is exactly what the frozen
R1 is built to reject. **Do NOT tune R1** — this is the source pool, not the reviewer. The mitral-stenosis lecture
being fresh did not help, which weakens the simple "freshness ⇒ yield" reading from run 2: freshness is necessary
but not sufficient; the source must carry genuine two-way dependency.

**One R2 clinical hard-fail** on mechanical-valve anticoagulation in pregnancy (HIT history vs warfarin/heparin
choice) — R2 working as designed.

**Diversity.** Zero exact duplicates and zero diversity[high] among the 12 distinct sources. (The two extra calls
below did produce one of each, but from re-transforming an already-used source, not from fresh material.)

**PROCESS NOTE — 2 unintended duplicate transform calls.** The first in-page batch loop lost its result handle to a
tool timeout while still running server-side; the retry loop re-fired onco_haem's last two sources. Result: 14 calls
over 12 distinct sources. The two extras produced 1 `exact duplicate` reject (correctly caught by the diversity
layer) and 1 `ai_reviewed` item flagged **diversity[high] major** (AIHA/lymphoproliferative, "stem 48% + same
family/intervention"). That item is a near-duplicate artifact of the double-run and is **reject-lean on human
review**. No data loss; the frozen guards caught both. Future runs: fire the batch as a detached job and poll.

**The 4 new candidates (human review pending, `ai_reviewed`):**
- cardio_endocrine — hyperthyroid high-output failure / rate control, severity `none`, diversity `moderate`.
- cardio_endocrine — diabetic autonomic neuropathy / silent ischaemia, severity `none`, diversity `ok`.
- onco_haem — APML DIC, severity `none`, diversity `ok`. Cleanest of the batch.
- onco_haem — AIHA + lymphoproliferative, severity `major` (diversity[high]) — the double-run artifact above.

Queue depth after run: `ai_reviewed` 136 → **141**, `needs_edit` 16, `rejected` 321 → 336.

**Next-run priority deficits:** `hepatic_pharm` (7) and `endocrine_renal` (7) — **source-blocked for the third run
running; acquiring cannot fix them.** Upstream action remains the binding constraint: author new concept lectures
for these two families (SOURCE-POOLS-THIN-FAMILIES.md treatment). Largest acquirable deficits next: `cardio_endocrine`
(7, still ~20 fresh sources) and `infect_immunology` (5, transplant-infection and HIV/CD4 pools still largely unmined);
**deprioritise pregnancy_cardio** until its pool is re-authored for genuine two-way dependency — 0/4 this run.

**Throughput constraint, restated and worsening:** 141 `ai_reviewed` + 16 `needs_edit` against 54 approved. Acquisition
is running far ahead of human review; the readiness gate will not move until items are reviewed by a human.

---

## Batch 2026-09-08 (run 4, weekday acquisition) — 12 distinct sources, 1 new reviewable

Pipeline FROZEN V1.8.2 (no reviewer/generator/gate change). Nothing auto-approved: approved stayed **54** throughout.
No unintended duplicate calls this run — the batch was fired as a detached job and polled, per run 3's process note.

**Targeting.** `every_pair_ready: true` (no pair below 3) → step 3a satisfied, so largest deficits. Re-enumerated
`topics.extras.qbank` vs processed `integrated_items`: **hepatic_pharm 0 fresh and endocrine_renal 0 fresh for the
FOURTH consecutive run** (all six hepatic_pharm pools and all five endocrine_renal pools fully mined). Targeted the
largest *acquirable* deficits: **cardio_endocrine (7)**, **infect_immunology (5)**, **cardio_renal (5)** — the latter
two chosen on run 3's recommendation (large nominally-unmined SRC pools: contrast-AKI 9 fresh, RAAS/MRA 9 fresh,
transplant infections 6, asplenia 5, HIV/CD4 4). pregnancy_cardio deliberately skipped (run 3 went 0/4).

**Funnel (12 distinct fresh sources → 1 reviewable, 8%):**
| Family | Transformed | Reviewable | Rejected |
|---|---|---|---|
| cardio_endocrine | 4 | 1 (major, diversity[high]) | 3 (2 R1 hard, 1 self-gate "no candidate") |
| infect_immunology | 4 | 0 | 4 (all R1 `cross_domain_dependency [hard]`) |
| cardio_renal | 4 | 0 | 4 (all R1 hard) |

**R1 yield collapsed to 8%** (33% run 3, 42% run 2, 30% run 1) — the worst run to date, and the collapse is
*not* explained by pool freshness. cardio_renal's contrast-AKI and RAAS/MRA pools had 9 fresh sources each and went
**0/4**; infect_immunology, which returned 3/4 in run 2 on these same pools, went **0/4** on its remaining sources.
Three of the twelve rejections were "domains are not inferentially connected", four were "answer reachable by a
simple modifier/lookup". Read: **residual-pool depletion is now the dominant effect.** Within any one concept
lecture the genuinely two-way-dependent questions get mined first; what is left is high-count but low-integration
— nominal freshness is a poor proxy for acquirable material. Run 2's "freshness ⇒ yield" reading is now clearly
too simple (run 3 weakened it, run 4 refutes it). **Do NOT tune R1** — it is reading depleted sources correctly.

**The 1 new candidate (human review pending, `ai_reviewed`):**
- cardio_endocrine — phaeochromocytoma / catecholamine cardiomyopathy, severity `major` from **diversity[high]**
  ("stem 40% + same family/intervention"). Near-duplicate; **reject-lean on human review.**

**V1.8.2 duplicate-rate fix — evidence mixed again.** Run 2 gave the first positive signal (moderate/ok, zero high);
run 4's single survivor tripped `diversity[high]`, as run 1's did. Zero exact duplicates across all 12. n is still
too small to call the fix either way; the more urgent signal this run is yield, not duplication.

Queue depth after run: `ai_reviewed` 148 → **149**, `needs_edit` 16, `rejected` 364 → 375. Approved 54, share 0.19.

**Next-run priority deficits:** `hepatic_pharm` (7) and `endocrine_renal` (7) — source-blocked for the fourth run;
acquiring cannot fix them. **The upstream constraint has now widened.** After this run, no family has a demonstrated
productive pool: cardio_endocrine, infect_immunology and cardio_renal have all been worked to depletion within their
existing lectures. Recommendation for the next run: **do not simply re-fire against the remaining fresh counts** —
they are depleted residue and will burn AI cost at ~8% yield. Author new concept lectures (SOURCE-POOLS-THIN-FAMILIES.md
treatment) for hepatic_pharm and endocrine_renal first, and consider the same for cardio_renal.

**Throughput constraint, unchanged and still binding:** 149 `ai_reviewed` + 16 `needs_edit` against 54 approved.
The readiness gate cannot move by acquisition at all — only human review of the standing queue will move it.

---

## Batch 2026-09-08 (run 5, weekday acquisition) — 6 distinct sources, 0 new reviewable

Pipeline FROZEN V1.8.2 (no reviewer/generator/gate change). Nothing auto-approved: approved stayed **54** throughout.
Fired as a detached job and polled (run 3 process note); no duplicate calls.

**Targeting.** `every_pair_ready: true` → step 3a satisfied, so largest deficits. Re-enumerated `topics.extras.qbank`
vs processed `integrated_items`: **hepatic_pharm 0 fresh and endocrine_renal 0 fresh for the FIFTH consecutive run**
(both still source-blocked; deficit 7 each). Per run 4's warning against re-firing depleted residue, targeted:
**onco_haem (5)** — five concept pools with 13 fresh sources, essentially unworked in recent runs;
**pregnancy_cardio (6)** — deprioritised in run 4, but its THIN-FAMILIES lectures are now built and carry genuinely
new material (mitral stenosis 10 fresh — the previously failed build; preeclampsia 5; SVT 5);
**cardio_endocrine (7)** — largest acquirable deficit. 2 distinct sources per family, one per concept lecture.

**Funnel (6 distinct fresh sources → 0 reviewable, 0%):**
| Family | Transformed | Reviewable | Rejected |
|---|---|---|---|
| onco_haem | 2 | 0 | 2 (R1 `cross_domain_dependency` hard) |
| pregnancy_cardio | 2 | 0 | 2 (1 R1 hard; 1 R1 hard + **R2 clinical hard**) |
| cardio_endocrine | 2 | 0 | 2 (1 R1 hard, 1 self-gate "no candidate") |

**R1 yield 0%** (8% run 4, 33% run 3, 42% run 2, 30% run 1). Five of six carried
"domains are not inferentially connected" and/or "answer reachable by a simple modifier/lookup"; four were additionally
flagged `integration_quality [major]: artificial label pairing`. **This refutes the remaining hope that the newly
authored THIN-FAMILIES lectures would restore yield** — pregnancy_cardio's brand-new mitral-stenosis and preeclampsia
pools failed exactly like the depleted ones, and onco_haem's largely unmined pools failed too. The constraint is not
pool *freshness* but whether a source question contains genuine two-way cross-domain dependency; the current lecture
authoring pattern is producing single-domain questions with a second domain as context, which R1 correctly rejects.
**Do NOT tune R1.** One useful safety datum: the mitral-stenosis candidate was caught by **R2 clinical hard**
(β-blocker in acute decompensation + wrong diuretic escalation) — the clinical reviewer is still working.

**V1.8.2 duplicate-rate fix — no evidence this run** (nothing survived to the diversity layer). Zero exact duplicates.

Queue depth after run: `ai_reviewed` **149** (unchanged), `needs_edit` 16, `rejected` 375 → **381**. Approved 54, share 0.19.

**Next-run priority deficits:** `hepatic_pharm` (7) and `endocrine_renal` (7) — source-blocked for the fifth run.
**Recommendation: pause acquisition firing entirely.** Two consecutive runs at 8% and 0% mean the AI spend is buying
nothing. The binding constraints, in order: (1) **149 ai_reviewed + 16 needs_edit against 54 approved** — only human
review can move the gate; (2) **source authoring**, and specifically the *pattern*, not the volume — the next lecture
batch should be written to force a decision that changes when either domain is removed, or the R1 gate will keep
rejecting it. Suggest a small hand-authored probe (3–4 questions written explicitly for two-way dependency) to test
the pattern before authoring another full lecture set.

---

## Source-pool expansion — CONCLUSION (2026-09-08) ✅ SUCCESSFUL, experiment closed
Broader 129-candidate sample after the 131 new source cards deployed:
| Metric | Before | After (129) |
|---|---|---|
| Mechanical duplicates (Jaccard >0.55) | 17.6% | **13.2%** |
| Old repeat clusters (haemoconcn/pheo/MS-AF/mech-valve/peripartum) | frequent | **gone** |
| Clinical territory breadth | narrow | **98 distinct concepts / 129** |
| Conceptual duplication (>0.40) | unmeasured | **24.0% identified** |
CONCLUSION: source-pool expansion worked — territory diversified, old clusters eliminated, mechanical duplication down
and stable at larger N. **No further source-pool changes required currently.**

## OBSERVED FAILURE ARCHETYPE #2 — Conceptual variant overproduction (LOG ONLY; do NOT build a cap yet)
Multiple differently-worded items testing the SAME clinical decision/concept within one acquisition window.
Seen 2026-09-08: Eisenmenger/pregnancy ×5, pregnancy MS ×4, HIV-TB IRIS ×3, thyrotoxic-AF-β-blocker ×3, TLS-type ×3.
Why NOT to build a naive "one concept = one question" cap: a single concept legitimately yields distinct questions by
DECISION POINT / learning objective (e.g. primary hyperaldosteronism → diagnosis vs ARR interpretation vs confirmatory
testing vs imaging vs adrenal vein sampling vs treatment are all valid, not duplicates). The correct future rule keys on
(clinical concept + decision point + mechanism/objective), not concept alone — a more sophisticated piece of architecture.
DECISION: observe more production evidence before coding it. Same discipline as the R4 option-class archetype.
Interim mitigation is human review (collapse variants at approval), not an acquisition-side cap.

## Harvest plan (2026-09-08): acquisition PAUSED; first-pass review the 129 distinct set family-by-family,
collapsing conceptual variants to the best canonical representative per learning objective, then APPROVE/EDIT/REJECT
toward 100. Recalculate readiness deficits after each batch.
