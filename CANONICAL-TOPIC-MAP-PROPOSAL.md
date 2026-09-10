# Canonical Topic Map — PROPOSAL (draft only; NOT applied)

_Status: PROPOSAL. No map applied, no merges, no resolver/threshold/candidate-generation change. This is a curated,
deterministic, NAME-driven key normalization (retrieval-only): the underlying `knowledge_targets` identities are
preserved; only the retrieval **key** used to gather candidates would change. Similarity does NOT decide identity —
evidence showed 9/19 apparent near-duplicates are genuinely distinct, so this map is hand-curated, not threshold-derived._

Gate: **Proposal → human review → regression suite → explicit approval → implementation.** We are at step 1.

## Legend
Decision = **Proposed** (clean, low false-positive) · **Needs-review** (real FP concern, human call) · **Reject** (out of scope / wrong mechanism).
"Known dup pairs" = count of the 19 measured cross-topic near-duplicate target pairs this entry would let retrieval reconcile.

## A. PROPOSED — clean, low false-positive (case / plural / spelling / clear synonym / peds-corpus qualifier)

| Current topics | Canonical key | Axis | Targets | Known dup pairs | Reason | False-positive concern |
|---|---|---|---|---|---|---|
| Heart Failure (3) · Heart failure (3) | `heart failure` | case | 6 | 0 | Pure case difference | None — identical string modulo case |
| Acute Kidney Injury (3) · Acute kidney injury (3) | `acute kidney injury` | case | 6 | 0 | Pure case difference | None |
| Congenital heart disease (5) · Congenital Heart Disease (5) | `congenital heart disease` | case | 10 | 0 | Pure case difference | None |
| Infective endocarditis (1) · Infective Endocarditis (1) | `infective endocarditis` | case | 2 | 0 | Pure case difference | None |
| Neonatal Sepsis (1) · Neonatal sepsis (1) | `neonatal sepsis` | case | 2 | 0 | Pure case difference (does NOT fold into generic "Sepsis" — see B) | None at this level |
| Febrile seizures (3) · Febrile seizure (1) | `febrile seizure` | plural | 4 | 0 | Singular/plural | None |
| Posterior urethral valve (3) · Posterior urethral valves (2) | `posterior urethral valve` | plural | 5 | 0 | Singular/plural | None |
| Hyponatraemia (2) · Hyponatremia (6) | `hyponatremia` | spelling | 8 | **1** | UK/US spelling | None (curated stem, not blanket) |
| Acute myeloid leukaemia (4) · Acute myeloid leukemia (1) | `acute myeloid leukemia` | spelling | 5 | 0 | UK/US spelling | None |
| Pediatric Pneumonia (22) · Pneumonia (5) | `pneumonia` | qualifier | 27 | **2** | Same domain in a paediatrics corpus | Adult vs peds pneumonia differ in general; SAFE here because the corpus is peds-only — revisit if adult content is added |
| Pediatric Sickle Cell Disease (1) · Sickle cell disease (2) | `sickle cell disease` | qualifier | 3 | 0 | Same disease | Low |
| Primary aldosteronism (5) · Primary hyperaldosteronism (7) | `primary hyperaldosteronism` | synonym | 12 | **2** | Exact clinical synonyms (same entity) | None — true synonym |

**Section A subtotal:** ~12 entries · ~90 targets co-located · reconciles **5 of the 19** known cross-topic pairs, all low-FP.

## B. NEEDS-REVIEW — real false-positive concern; requires a clinical human call

| Current topics | Proposed key | Axis | Targets | Known dup pairs | Reason | False-positive concern |
|---|---|---|---|---|---|---|
| Neonatal Sepsis (2 total) → Sepsis (1) | `sepsis`? | qualifier | 3 | 0 | Overlapping domain | **HIGH** — neonatal sepsis is a distinct entity (organisms, workup, empiric abx) from adult sepsis. Recommend KEEP separate |
| Neonatal hematology (3) · Pediatric hematology (1) · Hematology (1) | `hematology`? | qualifier | 5 | 0 | Overlapping domain | **HIGH** — neonatal haematology (physiologic differences) is genuinely distinct. Recommend keep neonatal separate |
| Cor pulmonale (6) · Pulmonary Hypertension (5) | ? | synonym | 11 | **1** | Related | **MEDIUM** — NOT synonyms: cor pulmonale ⊂ PH (RH failure *due to* PH). Folding may over-collapse. Human call |
| Mitral stenosis (8) · Mitral stenosis in pregnancy (6) | ? | scope | 14 | **1** | Same lesion | **HIGH** — pregnancy materially changes management (anticoagulation, cardioversion timing). Likely KEEP separate |

**Section B:** would touch ~3 more of the 19 pairs but each carries a genuine clinical false-positive risk — deliberately NOT auto-proposed.

## C. REJECT for this map — different mechanism

| Topics | Why rejected |
|---|---|
| Cardiology (11) · Embryology (1) overlapping specific topics (Mitral stenosis, VTE, TAPVC) — 3 of the 19 pairs | These are over-broad topic TAGS on specific questions, not name variants. Fix by question re-tagging, NOT key normalization. Separate task. |
| The 9 genuinely-distinct pairs (GBS↔DVT, Cirrhosis↔HRS, MS-AF↔thyrotoxic-AF, Bronchiolitis↔Ped Pneumonia, …) | Distinct knowledge sharing vocabulary. MUST NOT be normalized/merged. This is the evidence that similarity must never drive the map. |

## Coverage summary
Of the 19 cross-topic near-duplicate pairs: **~5 reconciled by Section A (clean)**, ~3 more only if Section B is approved,
3 are re-tagging (Section C), and **9 must stay distinct**. So the *clean* achievable win is ~5/19 with zero FP risk;
the map is small and bounded — consistent with "smallest evidence-backed fix," not mass consolidation.

## Retrieval regression test (define now; run at implementation gate)
Purpose: prove the canonical key makes the KNOWN misses discoverable WITHOUT collapsing the KNOWN-distinct cases.
1. **Positive set (must improve):** the ~5 Section-A pairs (e.g. Hyponatraemia/Hyponatremia; Pediatric Pneumonia/Pneumonia;
   aldosteronism/hyperaldosteronism). After canonicalization, a candidate query for one member MUST retrieve the other as a
   candidate (i.e., they land under the same retrieval key). Assert: candidate-retrieval now surfaces the counterpart.
2. **Negative set (must NOT collapse):** the 9 genuinely-distinct pairs + all Section-B items withheld. Assert: their targets
   still resolve to DIFFERENT canonical keys and are NOT retrieved as candidates for each other purely via normalization.
3. **Identity invariant:** every `knowledge_targets.target_id` is unchanged; only the retrieval key differs. No target row is
   created, merged, or deprecated by the map. (Key normalization ≠ merge.)
4. **Reversibility:** removing the map returns retrieval keys to the raw topic names byte-for-byte.
5. **Whole-corpus guard:** count distinct canonical keys before/after; assert the map reduces keys ONLY by the proposed
   entries and introduces ZERO unintended collisions across the full 199-name set (re-run the curated normalizer over all 199).

Gate order remains: this proposal → your review of Sections A/B → regression suite green → explicit go → implement narrowly.
Branching Cases stays a separate workstream and is NOT blocked on this.
