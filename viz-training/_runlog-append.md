
---

## 2026-08-28 — human session · Gross Anatomy audit, entry 1 · the corpus and the bucket had drifted 245 models apart

Not an authoring run. Frank asked for the task to be repointed back to Gross Anatomy, and then for the
Gross work to be walked run by run, looking for mistakes. This is the first pass.

### The finding that matters

**Fifty-two of the sixty-four Gross model scenes were missing meshes. Seven of them were missing every
single one, and all seven were `status:"ready"`, in `index.json`, and live.**

    gross__forearm-hand__intrinsic-hand-muscles-arches   28 models,  0 in hand
    gross__leg-foot__ankle-joint                         14 models,  0 in hand
    gross__leg-foot__arches-of-the-foot                  23 models,  0 in hand
    gross__leg-foot__gastrocnemius-soleus                15 models,  0 in hand
    gross__leg-foot__popliteal-fossa                     16 models,  0 in hand
    gross__leg-foot__tibia-fibula                        17 models,  0 in hand
    gross__thigh__adductor-canal                         10 models,  0 in hand

A student who opened Tibia & Fibula got an empty stage with a full set of labels pointing into the dark.
The whole of Leg & Foot was in that state.

Nothing in the pipeline lied. Scenes resolve model ids against `available-meshes.json`, which is a catalog
of what the provider *publishes*, and every id was real; the validator checks the same catalog. But the app
fetches from the bucket, and the bucket holds only what somebody downloaded and decimated. The corpus grew
by 245 references while the mesh folder stood still, and no tool in the chain had ever been asked to compare
the two. Coverage was being measured; drawability was not.

### What changed

- **`tools/sync-state.mjs`** now reads `meshes-lite/` and reports, every run, how many scenes draw complete,
  how many draw with holes, and how many draw nothing at all. It writes the missing ids to
  `viz-training/mesh-gaps.txt` and prints two new cursors beside `next to author`: `next to repair` and
  `next to audit`.
- **`tools/validate-scenes.mjs`** gains a delivery check after the eight stages. A `ready` 3d_anatomy scene
  with **not one** of its models in hand is held at `candidate` — not `blocked`, because nothing is wrong
  with the scene; the geometry simply has not been delivered. The hold **releases itself** the moment the
  meshes arrive, so no one has to remember which files were demoted. Both directions were mutation-tested
  on a scratch corpus before shipping.
- **`tools/decimate-meshes.mjs`** gains `--skip-existing`, so topping up 245 meshes does not re-grind the
  142 already done.
- **`AUTHOR-TASK-PROMPT.md`** is rewritten as a Gross Anatomy audit pass. Authoring is suspended: the cursor
  had walked into Embryology, where twelve consecutive runs wrote sequence scenes no engine can draw, while
  Gross was still 59/81 with 22 held. A scene is audited when it carries `provenance.audited_at`, which is
  derived from the file like everything else here — no list to keep in step.

### Corrections made to scenes

**1. Twelve labels were ambiguous about side.** In five scenes the right-hand structure carried an unsided
teaching phrase while its mirror was explicitly marked left, so the parts list read:

    Psoas major — the medial bed
    Psoas major (left)

The first one is the right psoas and nothing said so. On a spotter question about side that is a wrong
answer waiting to happen. All twelve now name their side. While there, the corpus was made consistent on
one spelling — `X (right)` / `X (left)` rather than a mix of that and `X — right` — which touched 44 further
labels that were already unambiguous. That part was cosmetic and is recorded here so the diff is not a
surprise.

Checked across all 1217 model references in the corpus: **zero** labels now disagree with the catalog's
side, **zero** sided pairs are ambiguous, **zero** duplicate labels within a scene.

**2. `gross__pectoral-region-breast__clavicle` claimed a mesh that exists.** Its gaps[] said "No sternohyoid
in the catalog" — the catalog holds FMA13346 and FMA13347. Beat 4's narration already taught sternohyoid
correctly as the fifth attachment on a bone usually given four; it simply had nothing on screen. The muscle
is now a part in "Muscles attached to it", added to that beat's trace path, and the false gap is gone.

This is the second time an absence claim has turned out to be wrong (the taeniae coli were the first, caught
by the large-intestine scene). Both were found the same way: by searching the catalog for the thing the gap
said was not there. Every "no X in the catalog" line in the corpus was swept this way; the remaining hits
were substring noise — "no obturator" in the internal-iliac scene means the obturator *artery*, and the
catalog's obturator entries are muscles, which that scene already uses as proxies.

### Still open — needs the network, which no part of this system has

`viz-training/mesh-gaps.txt` lists 245 model ids the corpus references and nobody has fetched. All 245 are
real catalog entries. The mirror is unreachable from the scheduled task, from the desktop workspace VM and
from the cloud container alike, so this is a human step in a terminal: fetch, decimate, upload, verify. Until
it is done, 52 Gross scenes teach with holes and 7 teach with nothing.
