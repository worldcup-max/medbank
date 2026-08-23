# Visualize model3d scenes — index

Production scenes authored by `medbank-viz3d-corpus` (2 structures/run) + hand examples. Glows correct by
construction (per-part real meshes). Only FMA ids present in `available-meshes.json` are used. See
`model3d-production-spec.md`, `CURRICULUM.json`.

| course | topic | structure | mesh-parts | anchor-parts | status | scene |
|---|---|---|---|---|---|---|
| Gross Anatomy | Arm (Brachium) | Biceps & Triceps brachii | 5 (heads) + 4 bones | 0 | ✅ ready (verified) | `scenes/gross__arm__biceps-triceps.json` |
| Gross Anatomy | Heart & Pericardium | Heart | 0 | chambers | ⚠ whole-only (subset lacks chambers) | `scenes/gross__heart-pericardium__heart.json` |
