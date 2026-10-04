# Target Resolver — Failure Mode Analysis

**Read-only analysis of the 996 existing `question_targets` decision traces. 8 September 2026.**
No resolver run. No writes. No merges calculated or executed.

**Verdict up front:** this is **primarily a target-definition problem, secondarily a
normalisation bug, and the largest single lever is neither — it is write-back.**
The mapping layer already covers **99% of current questions**; only **28%** carry the stamp.

---

## 1. The 582 NEW decisions

The resolver records its own reason. Every NEW row falls into exactly two buckets:

| Reason recorded by the resolver | n | % of NEW |
|---|---:|---:|
| `no candidate in this topic+skill` — retrieval returned **nothing** | 176 | 30.2% |
| `no candidate close enough` — candidates retrieved, model rejected them | 406 | 69.8% |

Mapped onto the categories you asked for:

- **Insufficient candidate retrieval — 176 (30.2%).** Retrieval is gated on `topic` + `skill`
  (T1/T2), with a lexical fallback on the statement (T3, Jaccard ≥ 0.40). These 176 got no
  candidate from any tier. Section 2 shows this is largely driven by *topic-string* variation,
  not by the knowledge being novel.
- **Model rejected an existing target — 406 (69.8%).** The near-miss safety net routes anything
  scoring ≥ 0.30 to AMBIGUOUS, so by construction these 406 all scored **below 0.30**.

### The gap that limits this answer, stated plainly

**No NEW row has a confidence between 0 and 0.45.** The distribution is binary:

```
NEW  confidence = 1  →  176   (the no-candidate case)
NEW  confidence = 0  →  406   (everything else)
NEW  0 < conf < 0.45 →    0
MATCH avg confidence  =  0.949
AMBIGUOUS avg         =  0.100
```

When the model picks a candidate, a real confidence is stored. When it declines, **`0` is
stored and the gradient is discarded** — `nearest_candidate_score` is null on all 406.

So: *"likely missed an existing target"* versus *"genuinely novel"* **cannot be separated from
the stored data** for those 406. That is itself a finding — the resolver preserves no evidence
for its negative decisions, which is precisely the evidence needed to calibrate it. Recording
the nearest score on every NEW would cost one field and make this question answerable.

---

## 2. The 497 singleton targets

472 targets have exactly one question; 26 have none (498 total ≤1, of 648).

I compared every singleton's `canonical_statement` against every other singleton's
(token Jaccard, tokens > 3 chars). **Only 10 pairs exceed 0.45 similarity.**

```
high-overlap pairs (≥0.45)     10
  cross-topic                   9
  same-topic                    1
```

**Most singletons are not obviously duplicative at the statement level.** Fragmentation is real
but concentrated, not rampant. Three distinct causes, all visible in the examples below.

### Example A — SAME knowledge, split by topic granularity

```
DIC-MGMT-001   topic="Disseminated intravascular coagulation"   skill=management
  "In DIC secondary to sepsis, the most important immediate management is to treat
   the underlying cause, such as with intravenous broad-spectrum antibiotics."

HEMATO-MGMT-001  topic="Hematology"                             skill=management
  "In a child with suspected disseminated intravascular coagulation secondary to sepsis,
   the most important immediate management is to treat the underlying cause, such as with
   intravenous broad-spectrum antibiotics."

Likely same knowledge: YES
Reason: the statements are the same sentence with a different opening clause. Same skill.
        The extractor assigned one a specific disease as `topic` and the other an entire
        discipline. Retrieval is topic-gated, so T1/T2 could never surface one for the other.
Confidence: HIGH
Cause: EXTRACTION — inconsistent topic granularity
```

### Example B — SAME knowledge, split by the skill axis

```
NS-MGMT-002   topic="Neonatal sepsis"   skill=management
  "In a neonate with suspected sepsis, empiric intravenous ampicillin and gentamicin should be
   started immediately after blood cultures are obtained, without waiting for results."

NS-NEXT-001   topic="Neonatal Sepsis"   skill=next_step
  "In a neonate with suspected sepsis, empiric intravenous antibiotics (ampicillin and
   gentamicin) should be started immediately after blood cultures are obtained, without
   waiting for results."

Likely same knowledge: YES  (statement overlap 0.95)
Reason: identical clinical fact. The only difference is which SKILL the extractor chose for
        the same idea. `candidateFilter` treats a different skill as never-a-match by design.
Confidence: HIGH
Cause: TARGET DEFINITION — the skill axis is splitting single facts
```

Same pattern, same topic, independently:

```
BRONCH-MGMT-001  skill=management  "…require hospital admission for oxygen therapy and
                                    nasogastric feeding."
BRONCH-NEXT-001  skill=next_step   "…should be admitted for oxygen therapy and nasogastric
                                    feeding."
Same admission threshold (SpO2 < 92% or feeding < 50%), same topic, two targets.
```

### Example C — SAME knowledge, split by a topic-string variant

```
SIRS-DX-001    topic="Systemic Inflammatory Response Syndrome"          skill=diagnosis
  "SIRS in neonates is defined by abnormalities in temperature, heart rate, respiratory rate,
   and leukocyte count or immature neutrophils; at least two criteria must be met."

SIRSS-DX-001   topic="Systemic inflammatory response syndrome (SIRS)"   skill=diagnosis
  "In neonates, SIRS is defined by at least two of: abnormal temperature, tachycardia,
   tachypnea, or abnormal leukocyte count/immature neutrophils."

Likely same knowledge: YES — this is the same definition
Reason: same skill, same content. The topic strings differ only by the parenthetical "(SIRS)".
        `nkey()` lowercases and strips punctuation but keeps the token `sirs`, so the two
        normalise to DIFFERENT keys and T1/T2 retrieval never fires.
Confidence: HIGH
Cause: RESOLVER — topic-key normalisation is too literal
```

### Example D — RELATED but correctly separate

```
EONS-DX-001  topic="Early-onset neonatal sepsis"   skill=diagnosis
NS-DX-003    topic="Neonatal Sepsis"               skill=diagnosis
statement overlap 0.46

Related but should remain separate: YES
Relationship: SPECIALISATION (subtype → parent). Early-onset sepsis has its own timing,
              organisms and risk factors; collapsing it into the parent would lose the
              distinction the question is testing.
```

```
BHS-DX-001  topic="Breath-holding spells"    skill=diagnosis
PD-DX-001   topic="Paroxysmal disorders"     skill=diagnosis
statement overlap 0.85

Related but should remain separate: PROBABLY — but this one is genuinely borderline.
Relationship: INSTANCE-OF (a specific spell type vs the category it sits in). The high overlap
              suggests the "Paroxysmal disorders" statement may in fact be *about* breath-holding
              spells, in which case it is Example A again. Needs a human eye; I am not merging it.
```

**This is the crux.** Examples A–C are genuine duplicates created by *how targets are defined and
retrieved*. Example D shows the same statistical signal (high overlap) arising from a legitimate
prerequisite/specialisation relationship. **A similarity threshold alone cannot separate them** —
which is why an automated consolidation pass would be dangerous here, and why the edges layer
(item 05) is arguably the correct home for D rather than a merge.

---

## 3. The 150 multi-question targets — what made convergence work

MATCH decisions, by the retrieval tier that surfaced the winning candidate:

| Matched via | n | % of MATCH |
|---|---:|---:|
| **T1** — exact topic **and** skill | 199 | 74.3% |
| T2 — same topic, any skill | 37 | 13.8% |
| T3 — statement overlap, any topic | 32 | 11.9% |

**Convergence is almost entirely an artefact of metadata agreement.** When two questions happen
to be labelled with the same `topic` *and* the same `skill`, they converge 74% of the time. The
semantic path (T3) rescued only 32 of 268.

The difference between the converged 150 and the singleton 497 is therefore **not** that the
converged ones are more conceptually coherent — it is that their extractions happened to agree on
two free-text labels. That is a fragile basis for concept identity, and it is the direct cause of
Examples A–C.

---

## 4. The 146 AMBIGUOUS — dominant patterns

| Pattern | n | avg nearest score |
|---|---:|---:|
| Near-miss, matched via **T1** (model said NOT_SAME, nearest ≥0.30) | 64 | 0.548 |
| Near-miss, matched via **T2** | 51 | 0.484 |
| Near-miss, matched via **T3** | 9 | 0.600 |
| Near-miss, no tier recorded | 7 | 0.571 |
| **Top-two near-tie** (confidence gap < 0.12) | 15 | — |

**131 of 146 (89.7%) are the near-miss safety net firing** — the model rejected the candidate,
but the deterministic layer refused to accept that rejection as proof of novelty. Only 15 are
genuine "two candidates too close to call".

The average nearest score of ~0.5 is the interesting part: these sit squarely between the
`T_new` floor (0.45) and the `T_match` ceiling (0.80). **This is the population where a human
decision would add the most information** — and only 7 of 996 rows have ever been resolved by a
human.

---

## 5. Orphaned mappings — exact numbers

```
question_targets rows                                          996
  rows whose topic_id no longer exists (topic deleted)          43     4.3%
  excess mappings over current question count (5 topics)        57     5.7%
  rows with a null topic_id                                      0
                                                              ----
  total orphaned                                               100    10.0%

current questions with no mapping available                      9
topics under-mapped                                              0
```

**Causes, separated:**

1. **Deleted topics — 43.** The topic itself is gone; the mapping outlived its source.
2. **Content edits / regeneration — 57**, concentrated in just **5 topics**. `qh` is a content
   hash of stem + options and — verified across all 905 questions — **is never stored on the
   question** (`items_with_qh_field = 0`). Any edit silently re-keys the question and abandons
   its mapping.
3. **No other causes found.** No null topic_ids, no under-mapped topics.

### The number that matters most in this whole report

```
current questions                                 905
   of which live in topics that have mappings     896   (99.0%)
   of which carry target_id in the canonical JSON 256   (28.3%)
```

**The mapping layer already covers 99% of live questions. Only 28% of them carry the stamp.**
That ~71-point gap is pure write-back loss — no resolver improvement required to recover it.
Its ceiling is ~85% (the 147 AMBIGUOUS rows hold no target by design).

---

## 6. Paediatrics vs Pediatrics — there are three, not two

| id | name | topics | questions | created |
|---|---|---:|---:|---|
| `397450f6` | **Pediatrics** | 175 | 221 | 8 Aug, all within 16 minutes |
| `5b5395c8` | **Paediatrics** | 74 | 541 | 22–26 Aug |
| `70cbeac1` | **Pediatrics** | 0 | 0 | — |

Exact topic-title overlap between the two populated courses: **3** (`bronchiolitis`, `malaria`,
`neonatal jaundice`) out of 67 and 175 distinct titles.

**Answers:**

- **Same discipline?** Yes, unambiguously.
- **Different course?** No. They are the same subject at two different stages of work. The
  8 August course is a **syllabus skeleton** — 175 lecture titles imported in one 16-minute
  batch, thin on questions. The 22–26 August course is where **content was actually built** —
  a quarter of the topics but 2.4× the questions.
- **Historical duplication?** Yes, plus a third empty stub that has never held anything.
- **Canonical identity?** **`Paediatrics`** (`5b5395c8`). It matches Nigerian MBBS convention,
  it is the actively built course, and it holds 71% of the questions. The empty `70cbeac1` can
  go with no analysis at all. The 8 August skeleton should be **migrated, not deleted** — its
  175 titles are a real syllabus map that the 74-topic course lacks, and the 3 overlapping
  titles need individual decisions rather than a blanket merge.

**I have not merged, moved or deleted anything.**

---

## What this points to (not a proposal — an argument about ordering)

Against your three options:

- **C — fix identity persistence / write-back.** The evidence is strongest here by a distance.
  99% mapped versus 28% stamped, with a single identified mechanism (unstored `qh`) and only
  100 orphans to reconcile. This is the cheapest, most reversible, highest-yield action, and it
  requires **no change to the resolver or to target definitions** — so it cannot contaminate
  anything downstream.
- **A — improve resolver retrieval/matching.** Justified but narrowly: the topic-key
  normalisation gap (Example C) is a real bug with a small, testable fix. The broader retrieval
  question cannot be answered until NEW decisions record their nearest score — which is itself a
  one-field change worth making *before* any resolver tuning, so the next run produces evidence.
- **B — redefine target granularity.** The evidence says the skill axis is splitting single
  facts (Examples A and B) and that extraction produces inconsistent topic granularity. But
  Example D shows similarity alone cannot distinguish a duplicate from a prerequisite. **B is
  the most consequential and the least safe**, and I would not touch it until the edges layer
  exists to express "related but distinct" — otherwise every judgement call collapses into a
  merge.

Nothing here has been acted on. No merges computed, no consolidation proposed, no writes made.
