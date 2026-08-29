# Production Run #1 — the first real acquisition baseline

Account: frankthejay. Pipeline: FROZEN (R1/R2/R3, generator, diversity, source-budget). Corpus: clean
(20 approved + 6 calibration) at run start. DO NOT DELETE these rows — approved subset = real corpus,
rejected subset = failure data for the next generation of the acquisition engine.

## Funnel (100 candidates, 10 families × 10)
```
100 sources (distinct)
 → 56 integrated (R1 pass)          (44 shallow: 38 R1-reject + 6 self-gate)
 → 41 reviewable (human queue)       (6 clinical-reject, 9 exact-dup reject in between)
 → 28 novel reasoning (diversity ok/moderate)
 → X approved   ← measured by human review
```

## Metrics (stable across clean-slate 30 → 100)
| Metric | 30 | 100 |
|---|---|---|
| R1 yield | ~50% | 56% |
| Unique reasoning yield | 23% | 28% |
| Human queue yield | 33% | 41% |
| Major rate | 10% | 13% |
| Clinical hard-fails | 0 | 6 |
| Dangerous false passes | 0 | **0** |
| Exact duplicates | 3 | 9 |
| Self-gate declines | 2 | 6 |

R1 ~50–56% is the confirmed, FROZEN generator ceiling. Do not tune it yet — after human review of the 41
we'll know whether the R1-rejects are genuinely shallow (→ future transformer project) or good questions R1
misreads (→ revisit R1). That evidence, not guessing, drives V1.8.

## The 41 human-review candidates
- **28 none** → approve-lean. Sampled items clinically sound (HIV→PCP co-trimoxazole; diabetic-CKD sepsis-AKI
  mechanism; neutropenic fever; AML tumour-lysis → rasburicase).
- **13 major** → edit-lean. Reason is almost entirely `single_best_answer`: "a competing answer remains
  defensible; the keyed answer's priority is not established" — tighten the stem so one answer is clearly best.
  A few are near-duplicate (diversity) flags.
Family spread of the 41: cardio_renal 9, resp_cardiac 8, neuro_endocrine 5, infect_immunology 4, gi_hepatic 4,
onco_haem 3, pregnancy_cardio 3, endocrine_renal 2, cardio_endocrine 2, hepatic_pharm 1.

## Review workflow (in Admin → Integrated Workbench)
Classify each: Approve (production-ready) · Needs-edit (good, fix the flaw) · Reject (clinical / SBA /
integration / duplicate / poor-source). Record the counts to complete the funnel:
`100 → 56 → 41 → 28 → X approved`. X is the first real acquisition-yield number.

## FINAL human-review result (applied)
Funnel: **100 sources → 56 integrated → 41 reviewable → 28 novel → 27 APPROVED** (+ 9 edit, 5 reject).
**Acquisition yield ≈ 27 approved production questions per 100 source questions (27%).** This is the baseline
Mega-QBank acquisition economics. Corpus now: 47 approved (20 legacy + 27 new) across all 10 families.

### Rejection/edit taxonomy (the useful failure data)
Three distinct error classes, per human review:
1. **True clinical errors** (R2 MUST catch these): #18 (stop metformin at eGFR 38 — premature), **#20 (adds
   dapagliflozin to a patient already on empagliflozin — dangerous duplicate SGLT2i; a genuine R2 MISS)**,
   #36 (hyperkalaemia ECG mechanism mis-described as "delayed repolarisation").
2. **Correct concept, broken single-best-answer** (R3 territory): #8, #24 (rejected); #27, #33, #39 (edit) —
   the keyed answer doesn't uniquely dominate a defensible competitor.
3. **Correct concept, wording too aggressive** (editorial): #9, #14, #23, #40.

### Decision: do NOT tune the frozen reviewers on this. Feed it to the GENERATOR.
The lesson for the transformer: "generate questions where the keyed answer is uniquely defensible under the
exact facts provided" — not merely medically correct. **#20 is logged as a serious R2 miss** (duplicate-drug /
redundant-therapy detection is a gap) — a concrete fresh-production example of the dangerous class, kept as
evidence for the next generator/reviewer iteration, not normalized as noise.

### Approved (27): 1,2,3,5,6,7,10,11,12,13,15,16,17,21,22,25,26,28,29,30,31,32,34,35,37,38,41
### Edit (9): 4,9,14,19,23,27,33,39,40   ·   Reject (5): 8,18,20,24,36
