# MedBank — Product Roadmap

The decision: **don't choose between the Intervention Engine and Mega Clinical Reasoning — sequence them.**

```
V1.5  Smart diagnostic engine (gap / misconception / fragile)     ← SHIPPED, FROZEN
   │
   ▼
PILOT  Validate whether the diagnoses are actually correct         ← RUNNING (v207-pilot)
   │      (agreement + does the diagnosis predict performance?)
   ▼
V1.6  INTERVENTION ENGINE                                          ← NEXT   (SPEC-V1.6-INTERVENTIONS.md)
   │    Diagnose → Intervene → Retest → Update → Adapt
   │      ├── Knowledge gap  → Learn → Practice → Retest
   │      ├── Misconception  → Contrast → Retest   (soft wording)
   │      └── Fragile        → Spaced reinforcement
   │    Gate: build an intervention ONLY if the pilot validates its diagnosis.
   ▼
V1.7  MEGA CLINICAL REASONING                                      ← LATER  (SPEC-V1.7-MEGA.md)
   │      🧠 Integrated questions · 🏥 Clinical cases · 🎯 Exam Blueprint · 📊 reasoning profile
   ▼
V1.8+ Branching cases · advanced adaptive cases · AI-generated variants
```

## Why this order
- V1.6 **reuses data you've already built** (pilot diagnoses), needs **no AI generation**, and closes the missing loop — the strongest near-term differentiator.
- V1.7 (Mega) is higher long-term differentiation but needs new content (integrated tags, cases) and is only worth building once the diagnostic engine is proven.
- Everything gates on the pilot. The V1.5 engine stays frozen until the data says otherwise.

## Positioning this earns
> "MedBank doesn't just tell you what you got wrong. It figures out **why** — then changes how it teaches you." *(V1.6)*
> "And when you're ready, it stops telling you the topic and makes you reason like you're in the exam or clinic." *(V1.7)*

## Branches
```
v207-pilot   ← frozen, students use it, never touched
   └── v1.6-interventions   ← V1.6 work
        └── v1.7-mega        ← V1.7 work (later)
```

## Specs
- `SPEC-V1.6-INTERVENTIONS.md` — the next build (decisions D1–D7).
- `SPEC-V1.7-MEGA.md` — the layer after.
