# Visualize 3D training corpus

Goal: accumulate high-quality **training/spec data** to teach the MedBank Visualize engine how to render
hard preclinical topics — with priority on **3D revolving anatomy** (bones, muscles, joints, viscera) the way
a rotating atlas model would, narrated landmark-by-landmark.

This folder is built up **automatically** by a scheduled task (hourly, from Tuesday) — see
`../viz-training/SCHEDULE.md` for exactly what each run does and the hard limits it runs under.

## Files
- `CURRICULUM.json` — ordered worklist (anatomy-first) drawn from the real 200lv/300lv catalogue.
- `STATE.json` — the cursor + coverage log the task reads/updates each run. **Do not hand-edit while a run may be firing.**
- `model3d-scene-spec.md` — the proposed blueprint shape for a *3D revolve* scene (the new engine mode this corpus is training toward).
- `corpus/*.json` — one entry per topic: the structured plan **and** a draft blueprint.
- `CORPUS.md` — human-readable index of everything captured (one line per topic).
- `RUNLOG.md` — one block per hourly run (what it did, what it skipped, cost = £0/model-free).

## What an entry contains (per topic)
1. **Why it's hard** — the specific sub-concepts students trip on.
2. **3D plan** — which structures need a revolving mesh, from which **open-source, correctly-licensed** source
   (BodyParts3D · CC-BY-SA · https://github.com/Kevin-Mattheus-Moerman/BodyParts3D ; Leiden LUMC Open3DModel · CC-BY-SA ·
   https://caskanatomy.info/open3dviewer/ ; Z-Anatomy · CC-BY-SA · https://www.z-anatomy.com/), with the exact structure names.
3. **Blueprint plan** — the ordered scenes (map → tour → contrast → takeaway) and the visualize `mode` for each.
4. **Draft blueprint** — a ready-to-review JSON scene array in the engine's shape, hand-authored (NO model spend),
   including proposed `model3d` scenes for the revolving-anatomy parts.

## Hard limits (this pipeline is log-only)
The task **never**: edits app/engine code, commits, deploys, drives a browser, spends the model API, or touches the
frozen Smart-Drill engine or the real account. It only reads the repo, does web research for asset sourcing
(no curl/wget), hand-writes corpus files, and updates STATE/logs. Everything it produces is for **Frank to review**
before any of it is fed into the live engine.
