# 🧊 PILOT FREEZE — v207 (`2026.08.21m`)

**This is the pilot baseline. Do not modify the Smart Drill engine until the pilot data says so.**

Tagged: `v207-pilot`. This build = the v206 validation instrumentation **plus** the Mega Q-bank "End & grade" fix. Engine behaviour is frozen at v203.

## The freeze rule

**Do not change the engine because of an individual student result. Look for patterns, not anecdotes.**

- 1 student rejects a Management recommendation → interesting, not evidence.
- 3/27 reject Management recommendations → investigate.
- 15/27 consistently reject recommendations for one cognitive dimension → evidence for an engine change.
- Students overwhelmingly *accept* a diagnosis but show **no** later improvement → the diagnosis may be right while the intervention/routing is weak.
- Students *reject* a diagnosis but then perform poorly in that area → the disagreement may reveal a confidence/metacognition issue, not a routing error.

The only thing that unfreezes this build is student telemetry, not a new idea.

## What the pilot can now answer (from logged data, not inference)

1. **Did students start Smart Drill?** — `smart_drill_started` (sid, planned count, dimension, reason, mode).
2. **Did they finish?** — `smart_drill_completed` (planned vs completed) → a genuine completion rate.
3. **Did they agree with the diagnosis?** — 👍/👎 with diagnosis + dimension + a snapshot of exactly what was recommended at that moment.
4. **Did it lead to improvement?** — accepted recommendation → intervention → later accuracy on that dimension (targeted improvement, examined not claimed).
5. **What kinds of recommendations are wrong?** — the preserved 👎 disagreements: where the engine's model of the student diverges from the student's experience. Likely the most valuable dataset.

## Where to read it

- Dev-only readout: open the app at route `#/intel` (not in student nav).
- Raw export: "⬇ Copy pilot data (JSON)" button on that page → aggregate across devices.
- Interpretation line stays hidden until ≥30 recommendation responses.

## How to work without breaking the freeze

- New work goes on a branch, never on `main`: `git checkout -b v1.6-experiments`
- `main` stays exactly as the students see it.
- Technical confidence floor at freeze: 80 automated checks passing.
