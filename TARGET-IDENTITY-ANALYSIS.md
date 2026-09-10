# Target Identity — measurement record (read-only; no writes, no resolver changes, no merges)

_Status: MEASUREMENT MODE. Nothing about the resolver, thresholds, candidate generation, or targets has been changed.
This is evidence-gathering toward deciding **what a MedBank knowledge identity should represent** — not a tuning exercise._

## Build 01 (telemetry) — VERIFIED (2026-09-08)
Fresh live QBank click-through via the real `qbStart`→`QB`→`qbPick`/`qbNext` path, flag runtime-on then off:
answered→event, answered→event, **skip→NO event**, answered→event; 3 distinct `response_ms`, non-null `topic_id`,
unique `object_id`/`client_event_id`; duplicate `client_event_id` rejected (23505). Flashcard: **persisted-wiring
verified** (durable card_id + topic_id + ms), **fresh-runtime interaction not yet demonstrated**.

## Step 3 — NEW/singleton analysis (read-only via existing admin GET endpoints)
Headline: 996 mappings · MATCH 268 (27%) · NEW 582 (58%) · ambiguous 146 (15%) · targets 648 · singletons 472 ·
matches mostly T1-exact (199/268) · confidence bimodal (`<45: 537`, `45–80: 0`, `≥80: 459` → discrete score, NOT a
probability) · orphans 455/648 (see Step 4 — not yet a quality metric).

**Stratified semantic classification of the 582 NEW (PROVISIONAL — computed from raw labeled counts):**
| Stratum (pop) | N labeled | Consolidation/miss (cat 1+2+4) | Sibling (3) | Novel (5) |
|---|---|---|---|---|
| No-candidate (176) | 12/56 moderate; 120 low inferred | ~18%* | ~34% | ~48% |
| Overlap 0–0.2 (177) | 16 | 0% | 37.5% | 62.5% |
| Overlap 0.2–0.4 (214) | 16 | 25% | 37.5% | 37.5% |
| Overlap ≥0.4 (15) | 11 | 45% | 55% | 0% |

**FORMAL STATEMENT (do not present the per-category %s as corpus-wide measured):** the stratified sample indicates a
material consolidation/resolver-miss share **approximately in the high teens**, with the exact population estimate
**PROVISIONAL**. The sibling/novel splits (~37%/~47% weighted) are directional only — derived from the provisional
stratified labels, NOT a corpus-wide census — and must not be quoted as measured population percentages until the raw
stratum labels are recomputed on a fuller sample. Denominators: 55 items explicitly labeled; ≥0.4 remainder (4) and
low-overlap no-candidate (120) NOT labeled (inferred) — the softest input.

**Demonstrated mechanisms behind the consolidation/miss share (these are the real findings, independent of the exact %):**
1. **Topic-scoped retrieval + inconsistent topic naming** (biggest driver): duplicates filed under differently-named
   topics never retrieved → minted NEW. E.g. Meningitis↔Pediatric Infectious Disease (↑ICP/papilloedema contraindicates
   LP), Pneumonia↔Pediatric Pneumonia, Pulmonary Hypertension↔Cor pulmonale. Same class as Paediatrics/Pediatrics, one
   level down. `NEW` ≠ "new knowledge."
2. **Statement-level identity** fragments opposite-claim/misconception pairs (patellar reflex therapeutic-vs-toxicity;
   cirrhosis sedation propofol-vs-lorazepam).
3. **Malformed extraction** — vignette text leaking into the statement mints junk targets (febrile-seizure "in this case…").
4. **Legitimate siblings are abundant** (~37%) — distinct decisions/facts sharing a topic+skill (GBS HTN vs bradycardia;
   PE massive vs submassive; breast-milk vs physiological jaundice). These need a RELATIONSHIP graph, NOT merging.
Also proven: high overlap IS strong duplicate evidence (bacterial-meningitis CSF, overlap 0.80, near-identical yet NEW =
genuine resolver miss); but low/no overlap does NOT prove novelty (the patellar case, 0.32, is semantically identical).

**No merges, no threshold changes, no candidate-generation changes.** Do not merge the 52 risk-stratum cases.

## Step 4 — read-only qh-orphan audit (deployed + run 2026-09-08)
Live result over the 455 `/health` orphans (endpoint read-only; `withQid:0` confirms the qid backfill was NOT run):
- **385 (85%) LIVE_HASH_MATCH** — stored `qh` still resolves to a live question (connected; simply lacks an
  authoritative MATCH relationship — expected for NEW-state singletons).
- **25 (5%) DISCONNECTED** — no `qh` mapping at all; genuinely detached.
- **45 (10%) INDETERMINATE (MIGRATION_ARTIFACT)** — `qh` not in the live set AND no qid, so it **cannot be reconciled
  to a live question**; whether this is hash-churn or deletion is **impossible to tell until a qid exists**. Do NOT
  characterise these as "stale/problematic" — they are indeterminate.
- HASH_CHURN 0 / QUESTION_DELETED 0 — unpopulated by construction (no qid).
CONCLUSION: the "70% orphans" figure was highly misleading as a quality signal — most are live-connected targets that
merely lack a MATCH relationship. The genuinely detached set (25) is small and does not justify architectural change.

## Step 4 — endpoint spec (as deployed)
`GET /admin/targets/qh-orphan-audit` (import-server/server.mjs) — single purpose, NO mutation. For each orphan target,
compares stored `question_targets.qh` (and `qid` when present) against current live `topics.extras.qbank` hashes and
classifies: **LIVE_HASH_MATCH · HASH_CHURN · QUESTION_DELETED · DISCONNECTED · MIGRATION_ARTIFACT**, returning evidence
rows (target_id, stored_qh, current_qh, qid, question_exists, hash_matches, topic, mapping_status) + `qidCoverage` so we
know the method's limits (HASH_CHURN vs DELETED is only distinguishable where a stored qid exists). This turns "455
orphans (~70%)" into a cause breakdown — until then, 70% is lifecycle-churn-vs-quality UNKNOWN, not a quality metric.

## Step 5 — Paediatrics/Pediatrics
Course-level discipline split (541 vs 221) + topic-name spelling inconsistency. Treat as a **normalization** issue
(discipline→course alias so spelling can't split the discipline), NOT a merge. Audit only.

## DECISION (2026-09-10) — audit closed; system held as-is
Most important outcome is **negative**: no evidence the target layer needs mass consolidation. This prevents a
potentially destructive optimization. Held: no qid backfill (write risk, not needed for the decision), no merges, no
resolver/threshold/candidate-generation changes. `/health` "orphan" status ≠ target corruption (385/455 are
live-connected). Step 3 percentage stays explicitly provisional.

### Next architectural work — SEQUENCED, not bundled (do NOT start until chosen):
1. **Topic / discipline identity normalization FIRST** (Paediatrics/Pediatrics + topic-name inconsistency driving
   topic-scoped retrieval misses — the primary, highest-leverage lever).
2. **Statement / decision-point identity** — considered SEPARATELY.
3. **Relationship modeling** (sibling/prerequisite/misconception/contrast between legitimate identities) — SEPARATELY.
Explicitly NOT a single large resolver rewrite.

## Topic/discipline normalization — MEASUREMENT (2026-09-10, read-only; no writes, no resolver change)
Measured BEFORE implementing, per the sequencing decision. Data: 617 targets across **199 distinct topic names**
(~3 targets/name — high name granularity). Target→topic from churn(own_target/proposed_topic) + matches(target_topic);
target→statement from churn(proposed_statement) + matches(target).

**(1) String-normalizable name splits:** 11 clusters, 25 names, **88 targets (~14%)** share a normalized base but differ by
case (`Heart Failure`/`Heart failure`, `Acute Kidney Injury`/`Acute kidney injury`, `Congenital Heart Disease` x2,
`Infective endocarditis` x2), qualifier (`Pediatric Pneumonia`22/`Pneumonia`5; `Neonatal Sepsis`/`Sepsis`; Sickle-Cell;
hematology), or plural (`Febrile seizure(s)`, `Posterior urethral valve(s)`). These clusters currently produce **0**
lexical duplicate targets across names (≥0.4) → hygiene/consistency risk, not yet active duplicate-generators.

**(2) Cross-topic near-duplicate targets (the retrieval-miss impact):** at overlap ≥0.35, **19 near-duplicate pairs sit
across DIFFERENT topic names vs only 8 within the same name** — so topic naming is the DOMINANT axis of near-duplication,
i.e. topic-scoped retrieval genuinely cannot reconcile them. Driver name-pairs: Pediatric Pneumonia↔Pneumonia,
Bronchiolitis↔Pediatric Pneumonia, Primary aldosteronism↔Primary hyperaldosteronism, Cor pulmonale↔Pulmonary Hypertension,
**Hyponatraemia↔Hyponatremia (British/American spelling — a whole axis: ae/oe/-aemia)**, Mitral stenosis↔Mitral stenosis
in pregnancy, generic `Cardiology`↔specific topics.

**Verdict:** topic-name inconsistency is a REAL, MEASURED driver — but BOUNDED (~19 near-dup pairs + 88 hygiene targets),
consistent with "not mass consolidation." Normalization axes, by risk:
- **Clearly safe / mechanical:** case-fold, plural/singular, British↔American spelling (haem/hem, oedema/edema, -aemia/-emia,
  paed/ped). Unambiguous; would reconcile several of the 19 pairs and the 88 hygiene targets.
- **Needs a small curated map:** qualifier folding (`Pediatric X`↔`X` — safe in a peds-only corpus) and clinical synonyms
  (aldosteronism/hyperaldosteronism, Cor pulmonale/Pulmonary Hypertension). Requires human review, NOT auto string rules.
- Note: commit `01.5c` already began narrow topic-key normalization (SIRS acronym) — a foundation to extend.
IMPLEMENTATION STILL GATED: normalization touches retrieval/identity, so it is a change, not measurement. Recommend, if
approved, starting with the mechanical axis only (case/plural/spelling) + regression tests, synonyms deferred to a curated map.

## British/American spelling axis — MEASUREMENT (2026-09-10, read-only)
Curated word-boundary clinical normalizer (aemia→emia, oedema→edema, haem→hem, paed→ped, phaeo→pheo, apnoea→apnea,
leukaem→leukem, ischaem→ischem, tumour→tumor, …) — NOT blanket ae/oe (blanket mangles cross-morpheme cases:
thromb**oe**mbolism, gastr**oe**nteritis — confirmed false-positive danger, now avoided).
- **Q1:** 6 of 199 names carry a UK spelling; **2 active collisions** (both forms present as separate topics):
  `Hyponatraemia↔Hyponatremia`, `Acute myeloid leukaemia↔…leukemia`.
- **Q2:** 17 targets under UK-spelled names = **2.8%** of 617.
- **Q3:** spelling explains **1 of the 19** cross-topic near-duplicate pairs (Hyponatraemia/Hyponatremia). Confirmed, not
  merely potential.
- **Q4 false positives:** none — curated rules changed exactly the 6 genuine UK names; thromboembolism etc. untouched.
**VERDICT: safest axis, but LOW-YIELD (1/19 pairs, 2.8% targets).** Not materially useful enough to justify a
spelling-only patch by the stated gate. The material yield lives in the DEFERRED axes (qualifier `Pediatric X↔X`,
clinical synonyms) which require a curated human-reviewed map. RECOMMEND: either fold spelling into a single low-risk
mechanical hygiene normalizer (case-fold + singular/plural + curated spelling + existing SIRS acronym) as future-proofing,
or defer — standalone spelling yield is marginal. STILL GATED; no key normalization applied; no target merges.
Reminder: normalizing a retrieval KEY ≠ merging targets — identities preserved; only candidate retrieval would change.

## Qualifier + synonym axes — MEASUREMENT (2026-09-10, read-only). The 19 cross-topic near-dup pairs decomposed:
| Axis | Pairs | Notes |
|---|---|---|
| Spelling | 1 | Hyponatraemia/Hyponatremia |
| Qualifier (Pediatric X↔X) | 2 | Pneumonia/Pediatric Pneumonia |
| Synonym | 3 | Cor pulmonale↔Pulmonary Hypertension; aldosteronism↔hyperaldosteronism (×2) |
| Scope | 1 | Mitral stenosis ↔ …in pregnancy |
| Generic umbrella | 3 | `Cardiology`/`Embryology` overlapping specifics — a RE-TAGGING issue, not normalization |
| **Genuinely distinct** | **9 (47%)** | GBS↔DVT, Cirrhosis↔HRS, MS-AF↔thyrotoxic-AF, Bronchiolitis↔Ped Pneumonia — MUST NOT merge |

**Decisive findings:**
1. A curated NAME map (spelling+qualifier+synonym+scope) explains **~7 of 19** cross-topic pairs (~37%). Modest but real.
2. **~47% of the "near-dups" are genuinely distinct knowledge sharing vocabulary** → any SIMILARITY/statement-threshold
   normalizer would corrupt nearly half. Normalization MUST be a curated, deterministic, name-driven map — NEVER a
   similarity threshold. This is the key false-positive guardrail.
3. Qualifier equivalence test: 4 clusters have both forms present (Pediatric Pneumonia+Pneumonia 27 targets; Neonatal
   Sepsis+Sepsis 6; Neonatal/Pediatric hematology+Hematology 5; Pediatric Sickle Cell+Sickle cell 3). Same DOMAIN
   (co-locating helps retrieval) but most targets under them are genuinely distinct (only 2/27 pneumonia targets duplicate
   across the split) — so folding the KEY is safe/helpful, but it does NOT imply the targets are redundant.

**DECISION INPUT:** a SMALL curated canonical-topic map is evidence-justified — deterministic, reversible KEY
normalization (identities preserved, not merged), human-reviewed, addressing ~7/19 pairs. Entries would be: the 2 spelling
collisions, ~4 qualifier clusters, ~2 synonym pairs (aldosteronism, cor-pulmonale/PH), 1 scope (in-pregnancy), + the
existing SIRS acronym. Generic-umbrella "Cardiology"/"Embryology" is separate (question re-tagging). Similarity-based
normalization REJECTED by evidence (47% false-positive rate). STILL GATED — no map applied, no merges, no resolver change.

## Architectural direction (NOT to build yet)
Three layers currently conflated: Question → Knowledge identity/decision-point → Relationships (sibling/prerequisite/
misconception/contrast). `question_targets` infers the middle layer from the extracted statement, which is why we see
wording/claim/topic-name fragmentation + legitimate look-alike siblings. The eventual fix is concept/decision-point
identity + a relationship graph + name normalization — decided from corpus evidence, not resolver tuning. Still measuring.
