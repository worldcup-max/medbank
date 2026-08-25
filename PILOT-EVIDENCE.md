# MEGA QBANK — PILOT EVIDENCE LOG (simulated pilot; I am the pilot)

Since there are no real users yet, evidence is collected by simulating students with KNOWN latent states over
fast-forwarded time and running them through the FROZEN engine (`qa/pilot-sim.mjs`, seeded/reproducible). What this
proves and what it does NOT is stated explicitly per run.

---

## Run 2026-08-25 — V1.6 diagnosis validation (seed 12345, N=300/archetype)

**Diagnosis accuracy vs ground truth (frozen `smartDiagnose`):**
| latent state | correctly diagnosed | notable leakage |
|---|---|---|
| gap | 81% | ~18% → misconception (confidence-driven boundary, see finding) |
| misconception | 98% | — |
| fragile | 83% | small sampling leak → gap/solid |
| solid | 98% | — |

**Safety-critical:** a true misconception is mislabeled as a plain **gap only 0.7%** of the time. The dangerous
direction (treating a confident wrong belief as "just teach it") essentially does not happen.

**Predictiveness (does the diagnosis predict the next retest?):** gap 34% · misconception 28% · fragile 88% · solid 94%.
The diagnosis separates future performance by ~55 points (fragile ≫ gap) — it is capturing a real, persistent signal,
not noise.

**A/B measurement pipeline (MODELED effect):** matched 67% vs generic 39% next-retest accuracy. The pipeline detects a
routed effect when one exists.

### Finding — the gap↔misconception boundary is confidence-driven (by design, safe)
A low-mastery student who is *confidently* wrong ≥~25% of the time shifts from `gap` to `misconception`. This is the
engine correctly prioritising the confident-wrong signature (Frank's ranking: misconception > gap). With realistic
low-confidence gap behaviour, gap recall is 81%. Not a defect — a calibration property worth watching in the real pilot.

### What this run PROVES
- The frozen diagnosis engine correctly identifies latent gap / misconception / fragile / solid states.
- The diagnosis predicts the next Target assessment outcome.
- The A/B measurement + routing can detect an intervention effect if one is present.

### What this run does NOT prove (needs REAL users)
- That the Learn+Practice (Phase 2) or reinforcement (Phase 3) interventions actually raise real mastery. The A/B
  effect sizes are modeled assumptions; only real pilot data can establish efficacy. **Activation of Phase 2/3 stays
  gated on real matched-vs-generic outcomes**, not on this simulation.

**Verdict:** engine intelligence + predictiveness + experiment soundness = validated. Efficacy = still real-user-gated.

---

## Run 2026-08-25 (2) — multi-seed stability (6 seeds: 1, 7, 42, 100, 2024, 31337)

Purpose: prove the diagnosis + robustness results are not a single-seed artifact. Full V1.6 intervention system now
built (gap+fragile activated, misconception built/flag-off).

**Diagnosis accuracy stability (pilot-sim, N=300/archetype/seed):**
| archetype | range across 6 seeds |
|---|---|
| gap | 76–82% |
| misconception | **98–99%** |
| fragile | 80–85% |
| solid | **98–99%** |
All 9/9 assertions pass on every seed (misconception→gap ≤ ~1%, predictiveness + A/B-detectability hold each time).

**Longitudinal robustness (60 students × 45 days, 6 seeds):** 4/4 every seed · **0 crashes · 0 schedule pathologies**
across 870–960 attempts / 630–720 retest-serves per seed.

**Verdict:** the frozen diagnosis engine is stably accurate and the whole loop (V1.5 → V1.6 → A6 → A7) is robust over
long timelines at scale, reproducibly. Efficacy of the interventions themselves remains real-user-gated (live A/B on
gap+fragile now running; misconception built but flag-off until its A/B earns it).
