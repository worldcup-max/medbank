
---

## 2026-09-10 · REVIEW · `engine__refit-camera-on-isolate` → `changes-requested`

Review run, cloud session, folders attached. `ls viz-training/BUILD-QUEUE.json` first, as instructed —
it was there. This is the first review run in this chain that could reach the repo at all; the two
before it woke with no `$HOME/mnt` and said so. Claimed `in-review` at 15:38Z through `queue-set.mjs`.

Three items sat at `built`. Took the oldest `built_at`: this one, 13:03:57Z.

### My three checks, written before I read BUILD-LOG.md

From the `why` and `note` alone: (1) does the refit fire on the VISIBLE subject after the ops, and does
the clamp the note asked for exist and mean anything; (2) does it survive being composed with
`initialYaw`, the opening spin, a straggler mesh landing and a revisit; (3) does it regress the views
it was not aimed at — whole-scene views, and the 71 BodyParts3D scenes it claims to repair.

The builder's notes cover (1) and (2) thoroughly and honestly. (3) is where the defect is, and it is
the one their notes do not reach: **the item was measured on two scenes out of 142.**

### Review 1 — mechanical

Run on the device against the committed file: `node --check` ok; `tools/lint-viz3d.mjs` — every name
resolves; `tools/validate-scenes.mjs` — 142/142 valid; `tools/test-fit-idempotent.mjs` — 8/8.
Run in a container with the chromium the tools want: `tools/test-view-framing.mjs` — 197 checks, 0
failures, fill 95.2% every time. Console clean on every scene I measured serially (0 entries).

`sha256(viz3d.js)` on the device is `a8d3982130…` before and after this run: **I changed no product
code.** More on that below.

### Review 2 — the picture first

I measured framing in the real player with the builder's own `measure-view-framing.mjs`, unmodified
except for a `--before` flag that loads a copy of `viz3d.js` with `frameView()` disabled and
`ROTATE_TO_VIEW` flying on its own — the player as it was before this item. Ten scenes beyond the
builder's two. Full per-view numbers: `viz-training/_review-2026-09-10-r3/review-framing-measurements.json`.

**The item's central claim holds and it is a large win.** Nearly every view improves, several by an
order of magnitude of lit area: carpal-tunnel view 3 1.7% → 24.8% of the canvas, kidney view 1
2.8% → 15.8%, intervertebral-disc view 1 1.05% → 9.84%, vertebral-column view 6 blank → 41.5%. On the
scenes where students actually are, this fixes what it says it fixes.

**And it introduces a regression the two measured scenes could not show.** `frameView` frames on
`state.only`, which is what ISOLATE_REGION and COMPARE_STRUCTURES singled out. That is not what a view
is about. A view routinely isolates one group and then NAMES more: `SHOW_STRUCTURE` after the isolate,
`HIGHLIGHT_STRUCTURE`, and `SHOW_RELATIONSHIP from → to` — which draws a leader line to a structure
that framing has just pushed off the stage.

Measured, at rest, canvas 1008×440:

| scene · view | before | after |
|---|---|---|
| kidney v6 "Reading the clinic off the anatomy" | 58.0% h / 18.6% area | **100.0 h × 94.1 w, 72.9% area, clipped, geometric fill 2765%** |
| cerebral-hemispheres-lobes v10 "Cortex outside, white matter inside" | blank | **100.0 h, clipped, geometric fill 87005%** |
| vertebral-column v4 "Body in front, canal behind" | 28.6% h | **100.0 h × 100.0 w** |
| intervertebral-disc v2 "One joint, two bones" | 12.3% h | 66.6 h, **clipped — L5 cut off at NDC y = 1.03** |

A geometric fill in the thousands of percent is a corner of the subject projecting from BEHIND the
camera: the student is inside the model. Six views across three scenes land at exactly 100.0% of frame
height after this change; none did before.

**Look at `_review-2026-09-10-r3/kidney-view06-after.png`.** The narration follows a stone from the
pelviureteric junction down the ureter to the bladder, and names the left renal vein into the cava.
The view isolates `Kidneys`, then shows `Outflow` and `Bony landmarks` and draws two relationship
lines. The camera frames the two kidneys. The ureter runs off the bottom edge, the left kidney is
gone, the frame is filled with foreground slabs of structures the camera is now inside, and five
labels are stacked against the left margin with leaders crossing the whole stage. Before this item
that view was legible at 58% of frame height. It would lose marks now.

`intervertebral-disc` v2 is the same shape in miniature and worth reading because the picture is
otherwise excellent: ISOLATE_REGION `disc_l45`, then SHOW_STRUCTURE `l4` and `l5`, narration "two
vertebral bodies with one pad between them — bone, cartilage, bone". The framing subject is the disc.
L4 and L5, which are the sentence, are held in frame only because the `minDistance` floor happened to
stop the dive, and L5 is clipped anyway.

### On the clamp

The builder wrote that the floor at `controls.minDistance` is not the ratio clamp the queue note asked
for, and that this is fair grounds for changes-requested. It is, and here is the mechanism: the floor
is a distance from the SUBJECT'S CENTRE, so it cannot prevent the camera being inside a structure —
only inside a small one. On intervertebral-disc views 2 and 3 the camera sits exactly at the floor
(1.200), i.e. `distanceForBox` asked to go closer still. The builder's objection to a ratio-to-whole-
scene clamp is also sound: on cardiac-looping the whole-scene box is two side-by-side hearts.

I think both are right and the clamp is the wrong shape. The rule that fits the evidence is not
"do not travel too far from the whole-scene fit" but **"every structure this view names stays in
frame"** — which is a bound computed from the view itself and needs no tuned constant.

### I tried the fix and I am not shipping it

I patched `subjectBox()` to frame on `state.only` ∪ every key the view's ops name after it isolates,
and measured it. It fixes the case it was aimed at — kidney v6 goes 100.0 h / clipped → 66.4 h /
not clipped — and it fixes intervertebral-disc v2's clipping. It also makes kidney v3 worse
(44.8 h → 100.0 h, 82.9% area) and newly clips kidney v2 and intervertebral-disc v1. It is the right
direction and it is not right yet, and proving a framing rule belongs on the corpus, not on the two
or three scenes that motivated it. **So I reverted it. `viz3d.js` on the device is byte-for-byte the
builder's file.** The patch is described here rather than left half-applied; the build task should
implement it with the corpus-wide measurement below as its gate.

### `test-view-framing-player.mjs` is not a gate

It has no assertions and exits 0 whatever it finds. Run as committed, today, it prints
`showAll: {dist: 2.089, pulledBack: false}` on three consecutive runs — where BUILD-LOG says it proved
"Show all pulls back out (→ 7.24)".

Down the ladder, and it is NOT the product. With a single `waitForTimeout(1200)` and no intervening
`page.evaluate`, requestAnimationFrame is throttled in this headless setup and the ease never
advances; sampling the camera every 150 ms shows the pull-back completing inside 300 ms and landing at
6.774, and a 3000 ms wait lands at 6.798. The player is fine. The harness measures a page it has
stopped touching. But a regression test that cannot fail, and that today prints the opposite of the
claim it was written to support, is not evidence — and it is the only thing standing behind most of
this item's proof section. It needs to settle by polling, then assert, then exit non-zero.

### Two tool defects found by using them

1. **`measure-view-framing.mjs` writes its harness page to a fixed path** —
   `models-out/_framing/_player.html`. Two runs at once overwrite each other's `MEDBANK_CONFIG`, every
   mesh fetch then fails CORS from the other run's port, and the scene reports 0 views and ~400
   console errors. It cost me two false findings ("vertebral-column and ribs-sternum render nothing")
   before I re-ran serially. Give the page a per-scene name. Under CPU contention the same tool also
   returns `lit: 0` for views that are fine, so a blank reading is only real if it survives a serial
   re-run — kidney v2 read blank once and measures 44.5% h alone.
2. **`extent()`'s clip detector is blind exactly where it matters.** It ignores meshes below 0.5
   opacity, so on a view where everything ends up ghosted it returns null and `clippedAtRest` reads
   false. Three of intervertebral-disc's seven views are invisible to it. The framebuffer read is the
   truthful one; when the two disagree, believe the pixels.

### The standard has a gap (REVIEW-TASK-PROMPT §4)

RENDER-STANDARD's first standing rule is THE SUBJECT FILLS THE FRAME. Every number in this item's
build note satisfies it, and the kidney view above satisfies it too — the subject fills 73% of the
canvas. Proposed second half:

> **THE SUBJECT FILLS THE FRAME — AND EVERYTHING THE VIEW NAMES IS STILL IN IT.** A view's subject for
> framing is every key its ops name: the isolate or compare target, plus anything shown after it,
> highlighted, or joined by a relationship line. A structure the narration names and the picture
> cannot show is the same defect as a structure drawn wrong.

And a rule about evidence, which is what actually let this through:

> **A change to the PLAYER is measured on the corpus, not on the scene that motivated it.** A model
> bug is one scene; a player bug is 142. `measure-view-framing.mjs` needs an `--all` mode and a
> pass/fail threshold so this is one command, not a judgement call about which scenes to sample.

### Not investigated

Pins and leader lines at the closer distances (`check-anchors.mjs` still not run, by the builder or by
me — though the kidney screenshot suggests it would find something). The trace-vs-`ROTATE_TO_VIEW`
camera fight, which the builder correctly left alone and correctly says needs its own item; it is
still unfiled. `PEEL_LAYER` and `SHOW_RELATIONSHIP` under the new framing. Phone-shaped canvases —
still only the unit test's four aspect ratios, no render.

### Not this item, found while measuring

- `intervertebral-disc` v3 "Soft centre, tough ring" narrates the annulus and the nucleus over a
  picture in which every structure is ghosted and nothing is highlighted — no annulus, no nucleus,
  no isolated disc. Blank-looking views also occur in `vertebral-column` v2/v3 and `ribs-sternum` v5,
  before AND after this item, so they are not framing. Scene-side; worth an item.
- The builder's separate finding — that in cardiac-looping view 8 the d- and l-hearts sit 1.79 apart
  along the view axis and now render at visibly different sizes in the one view that compares them —
  I did not verify. The scene has changed since they measured it (`sizeOf('d_')` and `sizeOf('l_')`
  no longer return the identical dimensions their note quotes), so someone has been in it. It needs
  its own look, against the current file.
