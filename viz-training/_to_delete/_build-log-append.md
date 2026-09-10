
---

## 2026-09-10 · `engine__refit-camera-on-isolate` — the player frames the SCENE, never the VIEW

Build run, cloud session, folders attached (`ls viz-training/BUILD-QUEUE.json` first, as instructed —
it was there). Claimed `building` at 12:21:01Z through `queue-set.mjs`, before touching anything.

**This is an engine item, not a model.** `--next` handed it over rather than a scene, because rework
beats new work and there was none: 124 todo, 1 built, 1 done, 0 changes-requested.

### What was wrong

`fit()` normalises the whole model once, when the scene opens, and that was the only framing there
was. A view showing eight of a scene's forty-four structures got them at whatever size they happen to
be *inside the whole*. RENDER-STANDARD's first standing rule — THE SUBJECT FILLS THE FRAME — failing
in the player rather than in a model, which is why it degrades every scene that isolates at once.

Measured before touching anything, in the real player, by reading the framebuffer view by view.
Numbers are the SUBJECT's share of the frame (height × width), measured geometrically by projecting
the subject meshes' corners — an independent read that does not consult the player's framing state:

| | before | after |
|---|---|---|
| cardiac-looping (procedural, 44 structures, 9 views) | 35–78% high | 76–94% high |
| · view 8, D-loop vs L-loop | 35.1 × 26.4 | **76.4 × 53.8** |
| · view 5, the atria climb up behind | 45.2 × 15.8 | **92.2 × 30.0** |
| quadriceps-femoris (BodyParts3D, 12 structures, 11 views) | 5–20% high | 28–49% high |
| · view 2, naming the four heads | 5.2 × 16.0 | **31.2 × 59.9** |
| · view 3, where each head starts | 12.3 × 10.8 | **49.1 × 47.2** |

Full per-view table: `viz-training/models-out/_framing/framing-measurements.json`. Before/after
screenshots of five views per scene alongside it.

The queue item said view 9 of cardiac-looping filled 30% and view 10 30%×16%. Checked, and it is if
anything understated at this canvas: I measured 35% and 45% of frame HEIGHT with widths of 26% and
16%. The finding stands as written.

### What I changed — `viz3d.js` only

- `frameView()` after a view's ops have run, easing camera **and** `controls.target` to the subject.
- **The subject is not "what is visible."** `ISOLATE_REGION`/`COMPARE_STRUCTURES` leave every other
  structure on screen ghosted to 10%, so framing on visibility measures the whole scene and changes
  nothing — on exactly the views that needed it most. `state.only` wins when set; ghosted context is
  allowed to run off the edges.
- **One animation owns the camera.** `easeCamera` takes a ticket; the newest move wins. Two lerps of
  `camera.position` in the same frames judder and the loser's destination is never reached. This was
  already latent between `ROTATE_TO_VIEW` and a trace's `flyTo`.
- `ROTATE_TO_VIEW` on an ordinary view now records a direction that `frameView` applies, instead of
  flying on its own. `rotateTo` is measured from `controls.target` rather than from the origin —
  once a view can look at something other than the centre, "distance from the origin" is not the
  distance to what is on screen.
- **"Show all" refits back out.** Without it the button would have restored the model and left the
  camera parked in close on the two structures the view had been about — restoring and hiding at once.
- Distance floor: `controls.minDistance`, the closest the scroll wheel itself may get. Not a new tuned
  constant, and `fit()` normalises every scene to 4.2 units across so it means the same thing
  everywhere.

**The fit formula is VizKit.fitCamera's**, generalised to an arbitrary viewing direction, with the
same `1.05` margin. It is written out in `viz3d.js` rather than called, because `VizKit` is a
MODEL-side global: it arrives with `models3d/<model>.js` and a BodyParts3D scene loads no model, so a
player that called it would frame procedural scenes and throw on the 71 mesh scenes — which are the
ones this fix is mostly for. Reimplementing kit geometry is otherwise a bug (RENDER-STANDARD §6), so
there is a test that asserts the two agree.

### What I PROVED

1. **It renders, in the real player.** `MB3D.mountScene()` and the view chips a student clicks — not
   `render-scene-views.mjs`, which fits its own camera per view and would have shown this bug as
   already fixed while the player was broken. 40 screenshots, two scenes, before and after.
2. **The console is clean** — zero entries, errors *and* warnings, before and after, both scenes.
   (An earlier run of mine showed a 404: my harness's own missing favicon, then a missing
   TrackballControls. Both fixed; see the substrate note below.)
3. **`test-view-framing.mjs` — 197 checks, 0 failures.** Agreement with `VizKit.fitCamera` across 7
   box shapes × 4 aspect ratios; containment of all 8 box corners inside the NDC cube for every one of
   the six `VIEW_DIR` directions, with the fill landing at 95.2% every time — exactly `1/1.05`, so the
   margin is the margin and nothing is being left on the table; and a check that the near-face term
   actually does work (drop it and a deep box crops).
4. **`test-view-framing-player.mjs` — all pass.** Every one of the 44 structures resolves through the
   real `MB3D.adapters.procedural` with geometry, 0 empty. An isolating view moves the camera in
   (6.14 → 2.07) and moves what it looks at. "Show all" pulls back out (→ 7.24). A trace still flies,
   5 distinct stops. Eleven chips hammered 90 ms apart settle at a position **identical to the same
   view reached calmly** — the proof that no stale animation is still holding the camera — with zero
   drift over 5 further seconds. Loop alive, 271 frames, no `lastError`.
5. **The repo's own gate.** `node --check` and `viz-training/tools/lint-viz3d.mjs` (eslint scope
   analysis) both pass, run **on the device against the committed file**, not only on my copy. The
   committed file's sha256 matches mine byte for byte.
6. **On both providers.** Tested on a procedural scene and on a real BodyParts3D scene with its 12
   STL meshes, because the item's whole claim is that this repairs 71 shipped mesh scenes.

**And I looked at them.** The comparison view now reads as two hearts a student can tell apart
instead of two specks; the quadriceps views are legible with their labels attached. Judge for yourself
in `models-out/_framing/`.

### The substrate nearly caught me, exactly as the standard warns

My first three measurement runs were on **OrbitControls**, not the TrackballControls the product uses
— my harness 404'd on the controls script and `viz3d.js` silently fell back, as it is written to. The
numbers looked fine and were about a viewer nobody runs. Fixed and every number above re-measured on
trackball; the test now asserts `controls instanceof THREE.TrackballControls` so it cannot happen
quietly again. Same lesson as the queue lock, found the same way: by checking rather than assuming.

### What I did NOT prove, and where I am unsure

- **Not opened in a real browser by a person.** Headless swiftshader at one canvas size (1008×440 —
  wide and short). Phone-shaped and tall stages are covered only by the unit test's four aspect
  ratios, not by a render.
- **Traced views are deliberately UNCHANGED, and they are still badly framed.** Quadriceps view 9
  ("one nerve for the whole compartment") sits at 6.9% of frame height before and after. I tried
  routing `flyTo` through `easeCamera` and it made things worse in a way worth recording: the trace's
  flight then cancels the `ROTATE_TO_VIEW` the same view asks for, and the student ends up **inside**
  the model — that view went from 7% of the frame to **269%** of it. So `flyTo` keeps its own loop,
  and only gains a guard on the trace's own turn counter so a flight stops when the student leaves the
  view that started it. **The trace's camera and `ROTATE_TO_VIEW` have always fought each other and
  still do. That is a separate item and it should be filed.**
- **One view of nine clips if the model is yawed far from its authored direction** (cardiac-looping
  view 5, worst 100.5% of frame — half a percent over). This follows from matching `VizKit.fitCamera`,
  which fits the silhouette rather than the swept cylinder. I built the yaw-invariant version first
  and dropped it: it cost 62% fill where 88% was available, and inventing a second framing rule to
  sit beside the kit's is the thing §6 forbids. Stated so a reviewer can disagree with the trade.
- **The clamp is a floor, not a ceiling.** The queue note asked to "clamp how far a refit may travel
  from the whole-scene fit". I did not do it as a ratio to the whole-scene fit, because on this scene
  the whole-scene box is dominated by two side-by-side hearts and is not a meaningful baseline — a
  ratio clamp generous enough to be useful is not a clamp. The floor is `controls.minDistance`
  instead. **If review wants the ratio clamp as specified, that is a fair finding against this item.**
- **Not measured: whether pins and leader lines still lay out well at the closer distances.** They
  look right in the screenshots. There is a `check-anchors.mjs` in the tools I did not run.
- Untouched and unexercised: `PEEL_LAYER`, `SHOW_RELATIONSHIP`, and the OrbitControls fallback (which
  the first three runs did exercise, accidentally, and it worked).

### Two things I found while measuring, which are NOT this item

1. **The D-loop and the L-loop are the same size but not the same depth.** In cardiac-looping view 8,
   `d_*` and `l_*` measure identically (1.43/1.47 × 2.403 × 2.113) but their centres sit at
   z = +0.894 and z = −0.894 — 1.79 apart along the view axis. Under perspective at ~4 units that
   renders the L-loop visibly smaller than the D-loop, in the one view whose whole job is to compare
   them. It was invisible while both were specks. **Now that the view is framed, it teaches a
   difference that does not exist.** A scene/model matter, so I have not touched it.
2. **`BUILD-TASK-PROMPT.md` §1 says the queue tool is at `tools/queue-set.mjs`.** It is at
   `viz-training/tools/queue-set.mjs`; run from the repo root the documented command fails with
   MODULE_NOT_FOUND. Same shape as the `viz-training/models/` error the file already warns about.
   **Left for a person to correct — I did not edit the standing instructions.**

And one claim I checked that HELD: §2's "the four cerebellum and brainstem scenes carry zero mesh refs
across 35 structures". Exactly four queue items match, they carry 8+7+8+12 = 35 structures, and
`bodyparts3d` refs across all four: **0**. Nothing is coming; the rule to build them is sound.

### New tools

- `viz-training/tools/measure-view-framing.mjs` — subject fill per view in the real player, by
  framebuffer readback and by corner projection, with an optional `--shots`. `--scene <id>`.
- `viz-training/tools/test-view-framing.mjs` — the 197-check unit test above.
- `viz-training/tools/test-view-framing-player.mjs` — the player regressions above.

All three want the build container's chromium, like `render-scene-views.mjs`.
