# The hourly Visualize-scene author task

**Live task:** “MedBank 3D scene author (v2)” · id `trig_01QTUT9eFVLxLG9KhHqQhUkm`
**Cadence:** hourly, at :31 past the hour · **Starts authoring Thu 2026-08-27** (date guard inside the prompt —
every run before then just logs “dormant” and stops). **Cost:** model-free. **Mode:** log-only.
**Throughput:** 2 structures/run. Manage it in the Scheduled panel.

> **Replaced 2026-08-23.** The old task `medbank-viz3d-corpus` carried the v1 prompt (hardcoded mesh URLs,
> `show`-lists, no validation gate, course-level modes). It was replaced rather than edited, so there is no
> half-updated prompt to reason about. **Delete the old one if it still exists** — two tasks would author the
> same structures twice and fight over `STATE.json`.

## What it produces
VisualScenes in `viz-training/scenes/`, one per curriculum structure, so students see parts already glowing
correctly — no calibration. Each part is its own labelled model, which is why the glow is right by
construction. Each structure becomes a short guided set of **views**, and each view is a list of **ops** from
the ten-op vocabulary rather than a list of model ids to show.

## Coverage (CURRICULUM.json), in order
| # | course | topics / structures | leads with |
|---|---|---|---|
| 1 | **Gross Anatomy** | 16 / 81 | `3d_anatomy` (process topics lead with `diagram`) |
| 2 | **Embryology** | 12 / 46 | `sequence` (19 keep `3d_anatomy` as a later option) |
| 3 | **Neuroanatomy** | 9 / 34 | `3d_anatomy` (circulation/testing topics lead with `diagram`) |
| 4 | **Histology** | 14 / 46 | `microscopic` (16 keep `3d_anatomy` as a later option) |

Mode comes from each structure's `preferred_modes`, never from its course — a structure routed to `diagram`
today becomes a 3D scene the day a model for it exists, with no curriculum edit.

## One run
Reads the cursor → takes the next **2 structures** → resolves each part to an id **that exists in
`available-meshes.json`** → authors the v2 scene → runs `tools/validate-scenes.mjs --mark` →
runs `tools/build-scene-index.mjs` → updates STATE/CORPUS/RUNLOG.

**A scene that fails validation is written `status:"blocked"` with its reason, is NOT counted as done, and
the structure is NOT marked covered.** That gate is what would have caught the v1 heart scene, which
referenced 13 ids that do not exist and labelled `FMA7196` — the *spleen* — as “left lung”.

## What the runs need
The Claude desktop app open with the medbank folder connected, so the run can reach the files. If the
computer is unreachable that hour, the run does nothing and the next hour picks up where it left off.

## Hard limits (never)
Edit app code · commit/deploy · drive a browser · fetch over the network · touch the frozen Smart-Drill
engine or the real account. It reads the repo, resolves ids against the local catalog, writes under
`viz-training/`, and logs.

## To stop / adjust
Disable it in the Scheduled panel, or set `STATE.json.done = true` to pause authoring ·
throughput via `CURRICULUM.itemsPerRun`.
