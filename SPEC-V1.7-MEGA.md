# MedBank — Mega Clinical Reasoning — V1.7 Specification

> **Re-sequenced (was labelled "Mega V1.6").** After comparing the two proposals, the plan is:
> **V1.6 = Intervention Engine first** (`SPEC-V1.6-INTERVENTIONS.md`), **then V1.7 = this** (Mega Clinical Reasoning), **then V1.8+ = branching.**
> This spec is the *next major layer* — built only after the V1.6 interventions ship and the pilot has validated the diagnostic engine.

**Status:** specification only, deferred to V1.7. No code now. The post-exam "[Drill this]" loop (§9–§10) hands off to the V1.6 interventions.

**Branch rule (non-negotiable):**
```
v207-pilot   ← frozen. Students use this. Never touched.
   └── v1.6-interventions   ← V1.6 work
        └── v1.7-mega        ← this spec's work, later
```
The V1.5 Smart Engine stays **frozen** while the pilot runs. Both V1.6 and V1.7 *read* the engine's outputs; they do not modify the engine until pilot data justifies it.

---

## 1. Product thesis

| Version | Question it answers |
|---|---|
| V1 | "Give me questions from these subjects." |
| V1.5 | "Use my performance to decide what I need." |
| **V1.6** | **"Simulate the way a real exam makes me think."** |

V1.6 is about **integration and clinical decision-making**, not more filters. The failure mode to avoid: *"Topic Q-bank but bigger."* Every V1.6 addition must make Mega **smarter**, not just larger.

## 2. Scope boundaries

**V1.6A (this spec, buildable now):** Integrated questions + Clinical Case sequences (linear) + Exam Blueprint + richer post-exam reasoning profile + the closed loop back into Smart Drill.

**V1.6B (deferred, separate project):** true **branching** cases (decisions change which path/information the student sees next). Significantly bigger engine — not started until V1.6A ships and earns it.

**Explicitly NOT in V1.6 (deferred on purpose):** AI-generated question *variants* / infinite generation, full branching simulation, voice simulation, multiplayer, social leaderboards, heavy gamification, giant configuration screens.

> **Reuse-first principle (carried from V1.5):** wherever possible, V1.6 sources Integrated questions and Case stages from the **existing question pool** (tagged/authored), *not* new AI generation. Generation is a later, gated phase — see §11 Phase 2 and Open Decision D1.

---

## 3. Mega entry flow — behavior by behavior

The student opens **🧠 Mega Q-bank** and configures five things. (Items marked *exists* are already in the current Mega; V1.6 keeps them.)

### Step 1 — Scope
- **Courses** (multi-select checkboxes): Medicine, Surgery, Paediatrics, O&G, Psychiatry, Community Medicine, … (driven by the student's built courses). *exists*
- **Topics** (optional): choose specific topics, or "all topics in selected courses." *exists*
- Behavior: scope defines the candidate pool for every style below.

### Step 2 — Practice style (four)
- **🎯 Focused** — questions stay within the selected topic(s). *exists*
- **🔀 Mixed** — questions jump between selected topics (balanced round-robin; no topic dominates). *exists*
- **🕵️ Blind** — student isn't told the topic/system before answering. *exists*
- **🧠 Integrated** — **NEW, the flagship.** Questions deliberately require knowledge spanning 2+ topics/systems (see §5).
- Behavior: exactly one style per session. Integrated is only selectable if the scope contains ≥2 topics/systems with integrated-tagged content (else show a "not enough integrated content yet" note).

### Step 3 — Mode
- **Tutor** — answer → immediate rationale → teaching → next. *exists*
- **Test** — answer → continue → results at end. *exists*
- **Test sub-option: ⏱ Timed / Untimed** — NEW toggle (timed applies a per-question or whole-exam clock; see Open Decision D2).

### Step 4 — Cognitive level
- Keep the four: 🔵 Interpretation, 🟠 Clinical reasoning, 🔴 Complex reasoning, 🟣 Exam trap. *exists*
- **Default = Adaptive** (NEW default). Instead of forcing one level, Adaptive builds a deliberate distribution, e.g. **20% Interpretation / 40% Clinical reasoning / 30% Complex reasoning / 10% Exam trap** (tunable; see §8 and config `MEGA.COG_MIX`). Student *can* still pin a single level.

### Step 5 — Session size
- Quick buttons: **10 · 20 · 40 · 60**. *(current app offers 10/20/30/50 — V1.6 changes to 10/20/40/60 per this spec.)*
- **⚡ Quick Exam** remains the primary one-tap entry: **20 questions · Mixed · Blind · Timed Test.** *exists*

---

## 4. Data model — field by field

V1.6 extends the existing per-question object. New fields are additive; existing questions without them behave exactly as today (single-topic).

### 4.1 Question fields (existing, kept)
`stem, lead_in, options[], answer, rationales[], objective, teaching, tag/subtopic, system, skill, cognitive_level, difficulty, trap_type, trap_explanation, src`.

### 4.2 New V1.6 fields

| Field | Type | Required | Meaning |
|---|---|---|---|
| `primary_topic` | string (topic id/key) | yes for integrated | The main concept the question is *about*. |
| `integrated_topics[]` | string[] | integrated only | Other topics/systems the student must also use to answer. Empty/absent = ordinary single-topic question. |
| `primary_skill` | enum (diagnosis, investigation, management, complications, differential, next_step) | yes | The clinical skill under test (reuses V1.5 skill set). |
| `case_id` | string | case only | Groups a set of questions into one Clinical Case. Null for standalone questions. |
| `case_stage` | enum (presentation, examination, investigations, management, complication) | case only | Orders the stages within a case. |
| `parent_question_id` | string | V1.6B only | The question whose answer led here (branching). **Unused in V1.6A** (reserved). |
| `branch_id` | string | V1.6B only | Which branch/path this belongs to. **Unused in V1.6A** (reserved). |

> Note: `case_id`, `branch_id`, `parent_question_id` were the "reserved for V2" fields flagged during V1.5. V1.6A activates `case_id`/`case_stage`; `branch_id`/`parent_question_id` stay reserved until V1.6B.

### 4.3 Example (integrated)
```
primary_topic:     meningitis
integrated_topics: [paediatric_emergencies, antimicrobial_therapy]
primary_skill:     management
cognitive_level:   complex_reasoning
objective:         "Empirical management of the septic child with suspected meningitis"
```

---

## 5. Integrated questions — spec

**Definition:** a question that cannot be answered correctly using a single topic's knowledge; it requires `primary_topic` **plus** every `integrated_topics[]` entry.

**Sourcing (V1.6A):** tag existing pool questions that already span areas, and/or author a small integrated set. AI generation of integrated questions is Phase 2 (gated) — not required to ship Integrated mode.

**Selection behavior (Integrated style):**
- Only draw questions where `integrated_topics.length ≥ 1` **and** (`primary_topic` ∪ `integrated_topics`) ⊆ the student's selected scope.
- Prefer questions whose integration axes the student has *not* recently seen (spread the combinations).
- Never silently fall back to single-topic questions in Integrated mode; if the pool runs out, end the set and say so.

**Why this matters (the payoff):** because integration axes are tagged, analytics can say something ordinary Q-banks can't:
> "You know **meningitis** (88%) and you know **paediatric emergencies** (81%), but when they're **combined** you drop to **52%**."

That "combination weakness" is a first-class metric (see §9), distinct from topic accuracy.

---

## 6. Clinical Case Mode — spec

A **separate experience** from standalone questions: one patient, revealed progressively across ordered stages sharing a `case_id`.

**Case shell:**
```
🏥 Clinical Case
Patient — Age: 4 years · Chief complaint: fever and vomiting
```

**Stages (linear, V1.6A):** each stage is one question with a `case_stage`, shown in order; new clinical information is revealed at the top of each stage before its question.

| Stage | Reveals | Asks (example) |
|---|---|---|
| 1 · Presentation | history / chief complaint | "What is your next step?" |
| 2 · Examination | exam findings | "Which diagnosis is now most likely?" |
| 3 · Investigations | labs / imaging | "Which finding is most significant?" |
| 4 · Management | — | "Most appropriate next step?" |
| 5 · Complication (optional) | deterioration | "The patient deteriorates — now what?" |

**Behavior:**
- Stages advance only forward; earlier reveals stay visible (scrollable) so the student reasons over accumulating information.
- Tutor mode: rationale after each stage. Test mode: answers locked, full case rationale at the end.
- **Scoring:** each stage scored individually **and** a case-level result ("4/5 stages correct"). A wrong early stage does **not** block later stages (V1.6A is linear, not branching — the "right" information is always revealed regardless of the student's answer). Branching that changes revealed information is V1.6B.
- Data: a case = N question rows sharing `case_id`, ordered by `case_stage`. No new table required.

---

## 7. Exam Blueprint — "Build my exam" — spec

Turns Mega from a pool into an **exam simulator**. The student specifies a blueprint and Mega assembles it.

**Config:**
- **Scope** — courses/topics (as §3.1).
- **Questions** — 10 / 20 / 40 / 60 (or custom).
- **Difficulty** — Adaptive (default) or a pinned cognitive level.
- **Mode** — Test (timed/untimed) or Tutor.
- **Skill distribution** (percentages summing to 100), e.g.:

| Skill | Share |
|---|---:|
| Diagnosis | 25% |
| Investigation | 20% |
| Management | 30% |
| Complications | 15% |
| Differential | 10% |

**Behavior:**
- "Generate exam" assembles a set matching the blueprint as closely as the pool allows; if a slice can't be filled (e.g., not enough Complications questions in scope), it fills the nearest and **reports the shortfall** rather than silently substituting.
- Blueprint is savable/reusable (a named blueprint) — nice-to-have, Open Decision D3.
- Reuses the existing session runner; this is a smarter *item selector* in front of it.

---

## 8. Adaptive distribution — spec

- `MEGA.COG_MIX = { interpretation:0.20, clinical_reasoning:0.40, complex_reasoning:0.30, exam_trap:0.10 }` — the default cognitive blend when level = Adaptive. Tunable config, not hard-coded.
- When the student has enough V1.5 history, Adaptive may skew the mix toward their weaker cognitive levels (reads the frozen engine's `byCog`; does not change it).
- Skill distribution in Exam Blueprint is authoritative when set; Adaptive fills within it.

---

## 9. Post-exam reasoning profile — spec

Results must be a **reasoning profile**, not just a percentage.

**Overall:** `72%` headline.

**By clinical skill:**

| Skill | Accuracy |
|---|---:|
| Diagnosis | 84% |
| Investigation | 76% |
| Management | **58%** |
| Differential | 71% |
| Complications | 69% |

**By cognitive level:** 🔵 Interpretation 89% · 🟠 Clinical reasoning 77% · 🔴 Complex reasoning **61%** · 🟣 Exam traps **54%**.

**NEW — combination performance (integrated):** for Integrated/Case sessions, accuracy on single-topic vs integrated items, and the weakest **integration axes** (e.g., "meningitis + paediatric emergencies: 52%").

**The narrative insight (the important part):**
> "Your biggest weakness isn't Medicine generally. You're strong at recognising diagnoses but struggle to choose the **next management step in complex cases**."

Followed by **[Drill this weakness]**, which hands the specific dimension to the existing V1.5 Smart Drill.

**Honest constraint:** the narrative must be **evidence-gated** exactly like V1.5 mastery — no confident "your weakness is X" off a handful of items. Reuse the `MIN_EV`/tiering discipline.

---

## 10. The closed learning loop

```
Choose scope → Mega tests you → Mega diagnoses HOW you struggle
   → recommends what to practise → Smart Drill targets it
   → concept retest → integrated case → new exam → updated reasoning profile
```
This is the product's real identity: a **closed learning loop**, not a question pool. V1.6 supplies the "tests you / diagnoses how" and "integrated case / new exam" arcs; V1.5 (frozen) supplies "recommends / Smart Drill / retest."

---

## 11. Build order (phased, each gated & shippable)

| Phase | Deliverable | Reuses | Acceptance criteria |
|---|---|---|---|
| **1 · Foundation** | Integrated/case **schema** (`primary_topic`, `integrated_topics[]`, `case_id`, `case_stage`; reserve `branch_id`, `parent_question_id`) + a handful of hand-tagged integrated/case items | existing question object | Schema parses; existing single-topic questions unaffected; ≥5 integrated + 1 full case exist to test with |
| **2 · Integrated sourcing** | Tag existing pool for integration; (gated) extend the import/generator to *deliberately* create 2+-area questions | IMPORT_API pipeline | Enough integrated items in ≥2 courses to run a session; **Decision D1 first** |
| **3 · Integrated mode** | Add 🧠 Integrated to Focused/Mixed/Blind | existing exposure switch | Integrated-only selection; combination analytics recorded |
| **4 · Case Mode** | Linear sequential cases | existing session runner | Progressive reveal; per-stage + case scoring; Tutor/Test both work |
| **5 · Exam Blueprint** | Build-my-exam (scope/count/difficulty/mode/skill mix) | existing runner + selector | Blueprint honored or shortfall reported; timed/untimed |
| **6 · Post-exam intelligence** | Reasoning profile + [Drill this] → Smart Drill | frozen V1.5 engine | Skill/cognitive/combination breakdown; evidence-gated narrative; hands off to Smart Drill |

**V1.6B (later):** true branching (`branch_id`/`parent_question_id` activated; decisions change revealed information).

---

## 12. Open decisions (need your call before Phase 2+)

- **D1 — Integrated sourcing:** start by **tagging/authoring from the existing pool** (reuse-first, recommended), or invest in generator work now? This decides whether Phase 2 is content work or engineering.
- **D2 — Timed mode:** per-question clock, whole-exam clock, or both? Any auto-submit on timeout?
- **D3 — Saved blueprints:** ship named/reusable exam blueprints in V1.6A, or defer?
- **D4 — Case authoring:** who writes the clinical cases, and how many for launch? (This is the content bottleneck for Phase 4, like misconception tagging was for the interventions.)
- **D5 — Order of value:** ship order above is Foundation→Integrated→Case→Blueprint→Intelligence. Confirm, or pull **Exam Blueprint** earlier (it's high perceived value and needs no new content).

## 13. Risks / honest flags

- **Content is the bottleneck, not code** — integrated tagging and case authoring will gate Phases 2/4 far more than engineering. Budget for it explicitly.
- **Don't let Integrated become "just a tag"** — the value is the `integrated_topics[]` axis analytics; if we skip that, it's cosmetic.
- **Evidence-gating** the reasoning-profile narrative is essential, or it becomes confident nonsense on thin data.
- **Engine stays frozen** — V1.6 reads V1.5 outputs; any change to the diagnosis/routing waits for pilot evidence.
