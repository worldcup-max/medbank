# MedBank · model3d — ESCALATIONS

**This file is a desk for humans. Frank and the session working with him read it; the build and
review tasks only write to it.**

An item lands here when an automated loop has decided it cannot finish the job. That is a legitimate
outcome, not a failure — the whole point of a stopping condition is that something eventually reaches
a person instead of burning runs forever.

An item is escalated for exactly one of three reasons:

1. **Three review rounds without converging.** The build task fixed what the review asked for, the
   review still found it wrong, three times. Something about the item is not understood by either
   side, and a fourth round will not discover it.
2. **The structure should not be procedural.** Irregular organic form — anything a student is
   examined on recognising *exactly* — needs a mesh, not code. RENDER-STANDARD §5.
3. **A decision no task is allowed to make.** Curriculum scope, what counts as correct when sources
   disagree, anything that changes what a student is taught.

## How an entry must be written

Enough for a human to decide **without opening anything else**. A vague entry wastes the escalation.

```
## <UTC date> · <item id> · <reason 1, 2 or 3>

WHAT WAS ASKED FOR       one sentence
WHAT WAS BUILT           one sentence, and where the render is
WHAT KEEPS FAILING       the specific defect, in anatomical terms, not "it looks wrong"
WHY IT IS NOT CONVERGING what each round tried and why the next round would not do better
WHAT I WOULD DO          the recommendation, and what it costs
DECISION NEEDED          the actual question, phrased so it can be answered yes or no
```

Neither task touches an escalated item again. A human resolves it and sets the status back to `todo`
with a note saying what changed — otherwise it will simply escalate again for the same reason.

---

## Open

## 2026-09-10 · gross__back-vertebral-column__coccyx · reason 2 (should not be procedural) + reason 3 (decision no task may make)

WHAT WAS ASKED FOR
Build a procedural coccyx, on the queue's stated premise that "BodyParts3D HAS NO COCCYX BONE ...
there is nothing to fetch, ever", so the vertebral column stops ending at the sacrum.

WHAT WAS BUILT
Nothing. The premise is false and building on it would have made the scene worse. Renders proving
this are in `viz-training/models-out/coccyx/` (`cut-lateral.png`, `cut-anterior.png`,
`anchor-lateral.png`, `patch-lateral.png`), produced by `probe-coccyx-mesh.mjs` in the same folder.

WHAT KEEPS FAILING
Not a build failure — a premise failure. Measured directly on `viz-training/meshes/FMA16202.stl`:

  · ONE connected component (union-find over 22,194 welded vertices), 145.3 mm tall, Z 790.7-936.0.
  · A sacrum is 100-115 mm. 145 mm is sacrum PLUS coccyx, and the mesh is segmented as one piece.
  · Cross-sectional hull area per 1 mm slab has a clean waist at Z 825.5 (147 mm^2) between the
    sacral apex flare above (440 mm^2 by Z 831, 1,450 mm^2 in the body) and the first coccygeal
    segment's bulge below (320 mm^2 at Z 817). Cutting there gives sacrum 110.5 mm and coccyx
    34.8 mm — both textbook adult.
  · The distal piece is midline (X centre -0.2 mm) and curves ventrally ~10 mm over its length.
  · The lateral render shows it plainly: four tapering segments with cornua at the top. It is a
    coccyx, in real scan data, and the scene ALREADY LOADS IT as part of FMA16202.

So the catalog has no coccyx ENTRY because there is no separate OBJECT — not because the bone is
missing. The scene's own `coccyx.calibrated_by` note says exactly this and is correct; the queue
item's `why` contradicts it and is wrong. RENDER-STANDARD's "no mesh means build it" does not apply,
because its own condition is "where there is not [a mesh] to have", and here there is.

A procedural coccyx would therefore have been drawn INTO the same space as real scanned bone already
on screen — a second, hand-made tailbone interpenetrating the scanned one — and would have replaced
a four-segment coccyx with cornua by a plausible wedge. That is a regression a review would have had
to catch, and it is the case RENDER-STANDARD section 5 exists to prevent.

WHAT IS ACTUALLY WRONG (the real defect behind "the column looked unfinished")
Two things, both small, neither procedural:

 1. The coccyx has no mesh OF ITS OWN, so it cannot be shown, hidden or isolated apart from the
    sacrum. It is reachable only as an anchor.
 2. `anchor-lateral.png`: because `render:"anchor"` builds a sphere of `0.05 x span`, and span here
    is the sacrum's 145.3 mm, a student sees an OPAQUE 14.5 mm emissive yellow ball parked over the
    middle of the coccyx — drawn with `depthTest:false`, so it shows through the bone from every
    angle and hides the segments it is pointing at. The marker idiom is right for a tubercle and
    wrong for a whole bone.
    The painted patch is fine: at radius 21.8 mm it covers ~96% of the coccyx and spills onto only
    ~9% of the sacral apex (measured over 133,248 render vertices). It is the sphere that is the
    problem, not the patch.

WHAT I WOULD DO
Split the asset, do not write geometry. Cut FMA16202 at Z = 825.5 mm into two derived STLs served
from our own `MESH_BASE`, point `sacrum.refs.bodyparts3d` at the upper piece and give `coccyx` a
`refs.bodyparts3d` of its own for the lower, then delete `coccyx.render:"anchor"` and its `anchor`
block. Cost: an asset-pipeline job plus a scene edit. ZERO engine change — the bodyparts3d adapter
already turns an id into a URL and cares about nothing else (`resolve()` in viz3d.js), and there is
no mesh-subset capability anywhere in the engine, so this is the only route that does not add one.

Two caveats I am NOT confident about and will not decide alone:
  · The exact joint line. I solved for the minimum cross-section (Z 825.5). The scene's existing
    calibration note picked Z 832 by a width threshold, 7 mm higher — the difference is whether the
    sacral apex tip counts as sacrum or as coccyx. Both give textbook proportions. Someone should
    put an eye on `cut-lateral.png` before this is baked into a published asset.
  · Splitting forks a CC-BY-SA 2.1 JP asset into derivative files. Attribution carries, but that is
    a licensing call, not a rendering one.

DECISION NEEDED
Two questions, both yes/no:
 1. Split FMA16202 into sacrum and coccyx assets at the solved waist (Z 825.5) and re-ref the scene
    — yes or no? If yes, this item should be reopened as a mesh-pipeline item, not a model3d one.
 2. Independently of (1): should `render:"anchor"` stop drawing an opaque depth-test-off sphere when
    the anchored thing is a whole bone rather than a landmark? That is an engine question affecting
    every anchored structure in the corpus, not just this one.


## 2026-09-10 · engine__mesh-resolution-by-role · reason 3 (a decision no task is allowed to make)

WHAT WAS ASKED FOR
Stop shipping every bone in the corpus at a flat 3,000 triangles, on the measured premise that
students receive `meshes-lite/` and that this discards 57% of a lumbar vertebra — the processes and
facets they are examined on.

WHAT WAS BUILT
`viz-training/tools/apply-mesh-budget.mjs`, and it was APPLIED: 333 of 494 meshes re-decimated, one
file per mesh, sized so every scene it appears in stays under 450,000 tri (21.5 MB — the vertebral
column at full scan resolution, the heaviest scene known to load). `meshes-lite/` is now 6,640,242 tri
/ 316.6 MB, up from 2,049,168 / 97.7 MB. 250 meshes at full scan resolution, up from 142. Renders in
`models-out/mesh-budget/`. I reviewed it and it is good work: the allocation on disk matches
`MESH-BUDGET.json` on all 494, every scene ref resolves, no scene is meaningfully over budget, and the
external-oblique render earns the whole item — fibre direction is legible at 76,733 triangles and
simply absent at 8,000, and fibre direction is how a student tells external oblique from internal.

WHAT KEEPS FAILING
Nothing is failing. Something is UNKNOWABLE from inside the loop, and it is the item's premise.

**Nobody in this loop can see what the bucket actually serves, and two tools in this repo upload
different directories to the same place.**

  · `tools/upload-meshes.mjs`          → uploads `viz-training/meshes-lite/`  (this is what DEPLOY-3D.md documents)
  · `tools/ingest-full-archive.mjs --upload` → uploads `viz-training/meshes/`  — the FULL directory —
                                          to the SAME bucket root, with the same filenames.

Whichever ran last wins, per file. `config.js` `MESH_BASE` points at that one bucket root, so the
filename `FMA13073.stl` is served from whichever directory last wrote it, and nothing in the repo
records which that was.

WHY IT IS NOT CONVERGING
This is not a defect a round can fix — it is a fact about the outside world that the loop is walled
off from. The previous build run flagged it and could not close it. I retried it myself from both
sides rather than take the note on trust, and both are blocked:

  · device (`device_bash`):   `getaddrinfo EAI_AGAIN tytbrhuzikqkscxdnkmr.supabase.co`
  · cloud container (curl):   `CONNECT tunnel failed, response 403` (egress allowlist)

A fourth round would produce the same two error messages. The answer is thirty seconds of dashboard
and cannot be reached from here.

WHY IT MATTERS ENOUGH TO STOP FOR — the two cases point opposite ways:

  · If the bucket holds the OLD LITE meshes, uploading is what this item is for, and it takes what
    students download from **97.7 MB to 316.6 MB — 3.2x more**, on the Nigerian mobile data this
    product exists to be usable on. That is the intended trade and someone should own it knowingly.
  · If the bucket holds `meshes/` (the full archive), then the item's founding premise is WRONG:
    students have been receiving **761.9 MB** all along, the vertebrae never were the 3,000-triangle
    ones anyone was looking at, and uploading `meshes-lite/` is a 2.4x payload CUT that should happen
    immediately and urgently. The real emergency would be the eight months of 762 MB, not the facets.

Same upload command, same files, and the two readings differ by a factor of seven in what it means.

WHAT I WOULD DO
1. Open the Supabase dashboard, look at `viz-meshes/FMA13073.stl`, and read its size. 347,384 bytes
   is the full source; 150,084 is the old 3,000-tri lite file. That single number settles it.
   (`node viz-training/tools/upload-meshes.mjs --check` prints the whole comparison and uploads
   nothing, if it is run from a machine that can reach the bucket. It needs no service key.)
2. Record the answer in `DEPLOY-3D.md`, because it is not recorded anywhere and this is the second
   run to be stopped by it.
3. Delete the `--upload` path from `ingest-full-archive.mjs`, or point it at a different bucket
   prefix. Two tools writing different resolutions to one filename is the trap underneath all of
   this, and it will fire again. Cost: a few lines. I have not done it because which one is correct
   depends on the answer to (1).

Cost of NOT deciding: `meshes-lite/` sits re-decimated and unuploaded, and the item's benefit — the
legible muscle fibres — reaches no student. Cost of deciding wrong: a 3.2x payload increase shipped
to the exact users least able to absorb it.

DECISION NEEDED
1. Does `viz-meshes/FMA13073.stl` in the bucket read 347,384 bytes (full) or 150,084 (old lite)?
2. Given the answer: upload the new `meshes-lite/` at 316.6 MB — yes or no?

SECOND DECISION, same item, unrelated and much older. `role: 'primary'` is off-spec:
`model3d-scene-spec-v2.md` declares only `part|context`, but **92 structures across 30 scenes** use
`primary`, and `viz3d.js` tests `role === 'part'` in four places. Those 92 are excluded from the
student's part list, pinned as scaffolding, AND CLIPPED AWAY IN CROSS-SECTIONS. Two build runs have
now flagged it and neither was allowed to choose: either the spec gains a third role, or 92
structures get rewritten. It is not blocking the upload and it deserves its own queue item, but it
has been passed down three times now and should stop being passed down.
   → Third role in the spec, or rewrite the 92 — which?


## Resolved

*(none yet)*
