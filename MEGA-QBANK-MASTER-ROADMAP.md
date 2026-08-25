# MEGA QBANK — MASTER BUILD ROADMAP (single source of truth)

_This is the one spine. Every future change attaches to exactly one box below. On each run: re-open this file, tick what shipped, and before starting any box state understanding + ask for context. Do NOT reopen a 🔒 FROZEN layer without a documented failure trigger._

Status legend: ✅ done · 🔒 frozen/validated · 🟢 current build · 🟡 deferred (not forgotten) · ⬜ not started · ❌ rejected

---

## North star — the loop (not a pile of features)
Give the right Q → student attempts → understand result → (correct ↑ / incorrect → diagnose WHY: gap · fragile · misconception) → **Intervention Engine** → **Master This Question** → **Target-based retest** → fresh assessment → improvement. AI parallel questions (A7) and branching cases (V1.8+) extend this loop; they don't replace it.

Architectural separation (never blur):
- **Mega QBank** = practice engine ("can you solve this?")
- **Master This Question** = reasoning tutor ("why wrong, and how to solve the *next* unseen one?")
- **Intervention Engine (V1.6)** = decides what MedBank does *because* you got it wrong
- **Target layer / A6 / A7 / A8** = semantic identity + retention + assessment supply underneath all of it

---

## ONE-PAGE TREE (tick here)

```
MEGA QBANK
│
├── FOUNDATION (F0)
│   ├── Topic QBank ✅   Mega QBank ✅   Tutor ✅   Test ✅   Smart Drill ✅   Adaptive ✅
│   └── UI rule: keep complexity underneath (Quick Exam / Smart Drill / Customize) — not a control panel
│
├── TARGET INTELLIGENCE (T0–T3)
│   ├── T0 reconciliation (contract, extraction, statement-primary adjudication) 🔒
│   ├── T1 tiered retrieval (T1∪T2∪T3) 🔒
│   ├── T2 sticky human authority 🔒
│   └── T3 hygiene (orphans / atomicity / calibration) 🟡
│
├── A6 — TARGET SCHEDULING  🔒 FROZEN
│   └── target_id propagation ✅ · Target retention ✅ · sibling rotation ✅ · anti-repeat ✅ · no_fresh_assessment ✅ · migration ✅ · live 14/14 ✅
│
├── A7 — AI PARALLEL RETEST  🔒 BUILT · LIVE-DEPLOYED · FROZEN
│   ├── no_fresh→generation ✅ · server Retest Pool ✅ · validation gate (round-trip MATCH→X, conf≥0.85) ✅
│   ├── hybrid trigger (exhaustion pre-gen + lazy fallback) ✅ · anti-repeat/parity ✅ · live shadow 17-step ✅
│   ├── ROLLOUT: FEATURES.A7=true (live, CDN-propagating) ✅
│   ├── hygiene: per-account persistent budget ✅ · admin panel ✅ · canonical anti-dup stems ✅ · retention-key hardening ✅ · quarantine ✅
│   └── deferred: in-memory backoff→persistent 🟡
│
├── A8 — RETEST POOL → CANONICAL PROMOTION  ⬜ (contract required, NOT auto)
│   └── promotion contract ⬜ · quality gate ⬜ · Target preservation ⬜ · canonical insertion ⬜
│
├── V1.6 — INTERVENTION ENGINE  🟢 NEXT MAJOR (re-baselined on A6+A7; identity = target_id)
│   ├── SPEC re-baselined (target_id identity; A6 owns scheduling; A7 owns supply; reads smartDiagnose) ✅
│   ├── Phase 1 instrumentation (durable intervention_events, both diagnosis levels, stable A/B bucket) ✅ built · 8/8 tests · pending deploy+migration+flag
│   ├── Phase 2 Gap loop (Learn+Practice; A6 owns retest; identity=target_id; gap_practice masked from frozen engine) ✅ built · 15/15 · GAP_LOOP=OFF (dormant for pilot) · pilot-gated
│   ├── Phase 3 Fragile (light: confirm→reinforce→optional practice→A6) 📝 CONTRACT written · not built · pilot-gated
│   ├── Phase 4 Misconception challenge ⬜ (pilot-gated, hardest)
│   └── boundary: V1.6 selects intervention · A6 schedules retest · A7 supplies fresh · V1.6 never generates
│
├── MASTER THIS QUESTION (reasoning tutor, runs ACROSS)  🟡 taxonomy protected
│   └── Exam Rule · Apply Rule · Decisive Clue · Why Tempting · What Would Change It · Differential · Exam Trap · Remember This (progressive disclosure by difficulty)
│
├── V1.7 — MEGA CLINICAL REASONING  ⬜ after V1.6
│   └── integrated questions ⬜ · linear clinical cases ⬜ · exam blueprint ⬜ · cross-topic reasoning ⬜ · reasoning profile ⬜
│
└── V1.8+ — BRANCHING  ⬜ future
    └── branching cases ⬜ · evolving patient state ⬜ · multi-step decisions ⬜ · adaptive cases ⬜ · AI advanced variants ⬜
```

---

## DEFERRED / REVISIT REGISTER (deferred ≠ forgotten)

| Item | Status | Why / evidence | Revisit trigger |
|------|--------|----------------|-----------------|
| Target atomicity | 🟡 deferred | production data: max 2 questions/Target, 0 over-broad; feared DIC problem not present | a Target repeatedly attracts distinct facets; humans repeatedly split its questions; scheduler/intervention shows the contract is too broad |
| Orphan Targets | 🟡 deferred (hygiene) | 27/76 have no authoritative mapping; safe reversible deprecate exists, but not roadmap-blocking | when it actually causes noise; batch with other hygiene |
| Threshold calibration (0.30 / 0.40 / K=8) | 🔒 frozen | MATCHes all ≥0.90 conf, no 0.80–0.90 marginal band; ambiguous 29% | a marginal MATCH cluster appears, or false merges/forks emerge |
| A7 backoff persistence | 🟡 deferred | in-memory backoff resets on restart → retries a bit sooner (harmless) | if restart-thrash causes real cost |
| A8 promotion | 🟡 deferred | needs its own contract; A7 existing ≠ A8 implied | when generated retests prove worthy + a contract is written |

## REJECTED REGISTER (do not revisit without contradicting evidence)

| Approach | Reason |
|----------|--------|
| Adjudicator V2 | 3 false merges on facet-vs-broad human-NEW cases |
| Adjudicator V3 | regressed to 4/5 definite-MATCH (missed sepsis paraphrase) while V1 was 5/5 + 0 false |
| Retrieval "improvements" beyond T1∪T2∪T3 | recall solved: NEW 14→2, 5/5 non-T1 MATCHes legit, 0 false; don't tune without evidence |

---

## OPERATING RULES (top of the engineering doc)

1. **Never reopen a frozen layer without new evidence of a defect.**
2. **Every change attaches to exactly one roadmap box.** If it doesn't, stop and write the architectural question first.
3. **Architectural change ≠ harmless optimization.** Anything touching Target identity/retrieval/retention/adjudicator gets the full six-stage process.
4. **Never mix experiments.** One change → test → audit → decision → freeze. (This is why the Target work became conclusive.)

Six-stage process for every box: **DEFINE → WRITE CONTRACT → DETERMINISTIC TESTS → IMPLEMENT → LIVE VALIDATION → FREEZE + LEDGER.**

Per-box record templates:
- ✅ DONE — Evidence / Test / Known limitations / Deferred / Revisit trigger
- ❌ REJECTED — Reason / Evidence / Do not revisit unless
- ⏸ DEFERRED — Why / Dependency / Revisit trigger

---

## CURRENT POSITION & IMMEDIATE PATH

Foundation 🔒 → A6 🔒 → A7 🔒 (frozen) → A8 ⏸ (deferred, no evidence yet) → **V1.6 Phase 1 🟢 PILOT / DATA COLLECTION (current checkpoint)** · Phase 2 ✅ built/OFF · Phase 3 📝 contract · Phase 4 ⬜ → V1.7 → V1.8+.

Do NOT: reopen Target retrieval, redo A6, tune V1 adjudicator, or start V1.7/V1.8 in parallel.

**Working protocol (agreed):** each run I re-open this file and tick what shipped. Before starting any box, I state what I understand about that box and ask for the context you'll provide — no code until the contract is agreed.

_Last ticked: 2026-08-25 — CURRENT CHECKPOINT: V1.6 Phase 1 PILOT / data collection (telemetry live-verified). Found GAP_LOOP+POST_SESSION_FIX_QUEUE were shipped TRUE → set both FALSE so Phase 2 is truly dormant during the pilot (needs deploy). gap_practice masking RESOLVED (kept out of frozen _attempts, logged separately). Phase 3 (Fragile) contract written — not built. A7 frozen. Do NOT activate any V1.6 intervention until the pilot A/B earns it._
