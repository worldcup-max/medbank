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
├── V1.6 — INTERVENTION ENGINE  🔒 ARCHITECTURALLY COMPLETE + FROZEN (adversarial 20/20) · gap+fragile live · misconception built/off
│   ├── SPEC re-baselined (target_id identity; A6 owns scheduling; A7 owns supply; reads smartDiagnose) ✅
│   ├── Phase 1 instrumentation ✅ LIVE + collecting · pilot-sim: diagnosis 81/98/83/98% acc, misconception→gap 0.7%, strong predictiveness, A/B detectable (PILOT-EVIDENCE.md)
│   ├── Phase 2 Gap loop (Learn+Practice; A6 owns retest; gap_practice masked) ✅ built · 15/15 · GAP_LOOP=ON (activated; live A/B)
│   ├── Phase 3 Fragile (light reinforce; post-session; A6 owns retest; masked) ✅ built · 9/9 · FRAGILE=ON (activated; live A/B)
│   ├── Phase 4 Misconception (contrast the wrong rule; soft wording; at-miss+queue) ✅ built · 11/11 · MISCONCEPTION=OFF (build≠trust; A/B-gated)
│   └── boundary: V1.6 selects intervention · A6 schedules retest · A7 supplies fresh · V1.6 never generates
│
├── MASTER THIS QUESTION (reasoning tutor, runs ACROSS)  🟡 taxonomy protected
│   └── Exam Rule · Apply Rule · Decisive Clue · Why Tempting · What Would Change It · Differential · Exam Trap · Remember This (progressive disclosure by difficulty)
│
├── V1.7 CONTENT PIPELINE (content-acquisition, precedes Integrated/Case)  🟢 CURRENT
│   ├── deterministic core ✅ (taxonomy · dependency gate · QA score · readiness gate · lifecycle) 17/17
│   ├── storage ✅ · miner+adversarial+gate ✅ · transformation ✅ · HIGH-bar 5-check gate ✅ (verified: HF→cardio_renal passes, diabetes+CKD lookup rejects) · Review Workbench ✅ (#/admin-integrated) · readiness dashboard ✅
│   └── TOOLCHAIN COMPLETE — remaining is CONTENT (feed good sources) → unlock Integrated Mode at gate (≥100 approved)
│   └── GATE: ≥100 approved · ≥8 families · ≥10/family · no family>30% · ≥3/pair → then unlock Integrated Mode
│
├── V1.7 — MEGA CLINICAL REASONING  📝 CONTRACT + gap analysis written (V1.7-CONTRACT.md) · not implemented
│   ├── D1-D5 LOCKED (reuse-first · whole-exam timer · defer saved blueprints · assemble+showcase cases · content-free-first order)
│   ├── LOCKED: integrated item → ONE primary target_id (A6); integrated_topics[]/case_id/case_stage = metadata only
│   ├── Phase 1 Foundation ✅ acceptance-proven (9/9) — additive schema coexists with frozen A6/A7, ZERO scheduling change
│   └── Phases: 1 schema ✅ · 2 Exam Blueprint ✅ BUILT (wired selector 11/11; shortfall no-substitution; whole-exam timer; requested-vs-delivered analytics; Focused/Mixed/Blind intact; identity invariant held) · 3 Reasoning Profile ✅ BUILT (consolidated qbAgg → evidence-gated view; thin=explicit insufficient; narrative only if measured+separated; no ability claims; combination axis reserved; [Drill this]→Smart Drill; frozen engine untouched; 13/13) · 4 Integrated 📝 READ→GAP done (V1.7-PHASE4-INTEGRATED.md): pool inspected, auto-heuristic OVER-counts (multi-tag≠integrated), inventory thin → strict definition + human tagging + content gate; inventory probe RUN (127q/13 topics → 22 candidates 17.3%, but ~17 are infect-noise → ~3-6 genuine). VERDICT: INSUFFICIENT inventory — Integrated NOT built (content-gated, D1). Defer Integrated+Case OR author genuine integrated content · 5 case
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
| **V1.6.1 — repeated-intervention-failure / escalation policy** | 🟡 deferred (product policy, NOT an unfreeze of V1.6) | adversarial: current behavior is safe + deterministic; there is simply no give-up rule for a Target that repeatedly fails intervention. | decide from ACTUAL usage patterns — do NOT add a cooldown just because it feels cleaner |

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

## MEGA QBANK — CANONICAL PHASE SPINE (A → F)

Two distinct tracks — never conflate them:
- **QA ENGINE** = the quality-control machinery UNDERNEATH the corpus (infrastructure milestone).
- **PHASE A–F** = the product/corpus journey ON TOP of it (product milestone).
V1.8.2 hardened the QA engine; it did NOT advance the phase. We are still in Phase A.

```
                 MEGA QBANK
                      │
         ┌────────────┴────────────┐
         │  QA ENGINE  🔒 V1.8.2   │   R1 dependency → R2 clinical/mechanism
         │  R1 · R2 · R3 · R4      │   → R3 SBA → R4 deterministic redundancy
         └────────────┬────────────┘
                      ↓
   PHASE A  CORPUS GROWTH → READINESS         🟢 CURRENT  (47 / 100 approved, 10 families)
     gate: ≥100 approved · ≥8 families · ≥10/family · no family >30% · ≥3/integration-pair
                      ↓
   PHASE B  INTEGRATED MODE (student-facing)  🔜  one primary target_id; integrated_topics[]/case_id = metadata; selector serves; requested-vs-delivered
                      ↓
   PHASE C  REASONING PROFILE — integration axis  🔜  evidence-gated, NO premature claims; [Drill this] → Smart Drill
                      ↓
   PHASE D  A8 RETEST POOL → CANONICAL PROMOTION  🔜  promotion contract + quality gate; PRESERVE target identity
                      ↓
   PHASE E  CASE MODE — multi-stage clinical cases  🔜  content-gated on genuine integrated inventory (NOT yet branching)
                      ↓
   PHASE F  BRANCHING  🔜  evolving patient state · multi-step decisions · adaptive paths
```

**Critical-path spine:** A (grow) → B (unlock) → D (promote) → E (cases) → F (branching); C is a fast-follow to B.
Branching is Phase F, NOT the next thing — building it now = a clever UI over a thin corpus. Do NOT jump QA → branching.

Phase A is not merely "47 → 100": the corpus must be structurally DIVERSE (family + integration-pair balance) or Case Mode/branching inherit a bad foundation. Track family/pair balance + R4 catch-rate by archetype (redundant / contraindicated / wrong-sequencing / mechanism-wording) as production QA feedback.

---

## CURRENT POSITION & IMMEDIATE PATH

Foundation 🔒 → A6 🔒 → A7 🔒 → A8 ⏸ (Phase D) → **V1.6: Phase 1 🟢 · Phase 2 ✅ ON · Phase 3 ✅ ON · Phase 4 📝** → **QA ENGINE 🔒 V1.8.2** → **PHASE A 🟢 CURRENT** → B → C → D → E → F.

Immediate objective: run weekday acquisition into the human-review queue, take 47 → 100+ approved while holding breadth (family + integration-pair balance) and quality, then unlock Integrated Mode (Phase B).

Do NOT: reopen Target retrieval, redo A6, tune V1 adjudicator, modify the frozen R1/R2/R3/R4 QA engine without a documented defect, or start Phase B/E/F before their gates.

**Working protocol (agreed):** each run I re-open this file and tick what shipped. Before starting any box, I state what I understand and ask for context — no code until the contract is agreed.

_Last ticked: 2026-08-30 — 🔒 QA ENGINE V1.8.2 FROZEN: R1 dependency → R2 clinical/mechanism → R3 SBA → R4 deterministic medication-redundancy. Live gate passed (6-case #3 hard citing Na trajectory; V18-4 SGLT2i + V18-5 β-blocker caught via R4 with R1 passing, 3× stable; V18-6 legit combo not false-flagged). Offline 92/92. V1.8/1.8.1/1.8.2 scope docs written. Weekday integrated-qbank-acquisition schedule RESUMED into human-review queue. Canonical phase spine A→F established; branching correctly seated at Phase F. Phase A is current (47/100 approved). A6/A7/R1/R3 untouched._
_Prior tick: 2026-08-25 — 🔒 V1.6 ARCHITECTURALLY COMPLETE + FROZEN. Adversarial 20/20; 15/15 harnesses green. Open item: no bounded-escalation rule for Targets that repeatedly fail intervention — deferred. gap+fragile live, misconception built/off._
