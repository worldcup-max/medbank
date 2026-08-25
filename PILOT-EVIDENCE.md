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

---

## Run 2026-08-25 (3) — V1.6 ADVERSARIAL BATTERY (qa/v16-adversarial.mjs) — 20/20

Deliberate attempts to break the frozen boundaries. All 10 of Frank's scenarios pass:
1. **Oscillating** (wrong-confident↔correct-unsure↔…): diagnosis never returns an invalid type; no thrash to bad states.
2. **Mixed diagnoses on one Target**: one coherent standing diagnosis (never multiple).
3. **Sparse (<MIN_EV)**: returns NO diagnosis — no overconfidence from thin evidence.
4. **Persistent misconception** (20× confident-wrong): ONE Target record, stays interval-1/miscon/p3, schedule healthy — no multiplication, no flood.
5. **Persistent gap** (20× wrong-unsure): one record, interval 1, healthy.
6. **Intervention-resistant** (completes the loop, still fails): ≤1 retest/intervention per day; schedule healthy across 30 days. *(see finding)*
7. **Multi-Target exhaustion while intervening**: NEVER substitutes another Target's question; reaches `no_fresh` (A7 seam); healthy.
8. **Restart/persistence**: schedule survives serialize→restore unchanged; migration idempotent post-restart (no loss/dup).
9. **Concurrent** (many Targets due same day): each due record serves its OWN Target; no cross-wire; healthy.
10. **Flag transitions OFF→ON→OFF**: toggling an intervention flag never alters existing `_sched` (flags gate UI only).

### ⚠️ KEY FINDING — degradation behavior (as Frank asked)
V1.6 does **not** loop uncontrollably within a session — a single global loop, opt-in offers, a queue capped at 3, and ≤1 retest/day give it hard per-cycle bounds. **But there is NO bounded-escalation / give-up rule.** A Target the interventions repeatedly fail to fix keeps recurring at interval 1 and keeps being offered its intervention. In this A7-less sim it self-limits at canonical exhaustion (~6 cycles); **with A7 supplying fresh retests it would recur indefinitely** — `intervention → fail → intervention → fail …`.

**This is a product decision, not a bug** (Frank: "establish the failure behavior, then decide whether V1.6 needs a bounded escalation rule"). Candidate follow-up (NOT built): after N consecutively-failed interventions on a Target → escalate (hand to human / different modality), cool down, or cap intervention offers while A6 keeps the spaced retest. **Deferred to Frank's decision.**

**Verdict:** V1.6 passes the adversarial battery. The only open item is the escalation-policy decision above.
