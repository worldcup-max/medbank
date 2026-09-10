
---

## 2026-09-10 17:56 UTC · REVIEW round 3 · embryology__cardiovascular-development__cardiac-looping

Run by the model3d REVIEW task, cloud session with the medbank folder attached. **Did not build this
scene, and did not use the build task's provers** — the build task asked for exactly that ("I wrote
both the fix and its prover, so prove-mirror-chirality.mjs is not independent evidence"), and it was
the right thing to ask for.

**Verdict: `changes-requested`. review_rounds 2 → 3. open_findings_by_round [13, 4, 6].**

### Round 2's four findings are all closed, verified independently

The critical one first. **The mirror is now a true reflection.** Re-measured in a harness written for
this review: every vertex of all **eleven** parts matches reflect-X at **1.0000** and rot-Y-180 at
0.0000–0.0020, vertex counts identical part for part; and the signed volume of the
sinus-atrium-ventricle-bulbus tetrahedron, recomputed here from **mesh centroids** rather than the
centreline tetrahedron `mirrorProof()` uses, is D −0.05029 / L +0.05029 — **ratio exactly −1.0000**,
where round 2 measured +1.0000. In the picture, view 9's mirror against view 6's D-loop is a clean
left–right flip at the same size, against round 2's measured 79% of width. Findings 3 and 4: all nine
acceptance tests pass and are **stable across integration density** (nseg 140/300/600 agree to 0.003),
and the builder's shipped numbers reproduce exactly. Finding 5: `peri_a` on view 1, `peri_c` on view 6.

That is a good round of building and it should be said plainly before the rest.

### Four corrections made by the review

- **The mirror probe warned on its own degenerate case.** At `t = 0` the tube is straight, the four
  centroids are coplanar, the signed volume is exactly 0 and the ratio is 0/0 — and the guard treated
  *cannot measure* as *measured and wrong*. It fired on every `t=0` mirror build and is what cost
  `tools/test-per-view-t.mjs` its console-clean check while testing an unrelated item. Now reports
  not-measurable. **The console is clean at every `t` for the first time.**
- **The dorsal mesocardium ignored its own layer flag** — `opts.mesocardium !== false` made it the one
  optional layer that was on unless switched off, while its three siblings are opt-in and `FULL`
  declares all four alike. Invisible in the player, because the provider builds with `FULL` and slices
  by key. But every *direct* render carried it, **including the build task's own stage proofs**: in
  `render-cardiac-looping.mjs` the plain stages pass `{}` and the `-meso` stages pass
  `{mesocardium:true}`, so the pair meant to show the sheet against its absence differed only by the
  midline rod. Now opt-in.
- **`acceptance(nseg)` took the segment count, and a reviewer following the built_notes calls
  `acceptance(1)`.** That integrates the centreline with one segment and returns confident-looking
  numbers at 1e-16 reporting D, G and I *failing*. This review nearly filed a fabricated CRITICAL
  finding on it. Now throws a message naming the parameter.
- **A false measurement claim in the scene's `gaps[]`** — that at day 28 the mesocardium is "two small
  reflections almost entirely hidden behind the heart". Measured, the two cuffs span 2.10 × 2.29 on a
  heart 3.27 × 3.19 × 2.49 and stand 0.74 clear behind the atrium; in the lateral camera, which is view
  5's camera, it is a conspicuous wing. It stays out of the player because every view from 3 onwards
  opens with `HIDE_STRUCTURE *`, not because it is small.

No geometry and no narration were changed. All nine tests still pass; validate-scenes 142/142.

### Six open findings — full text on the queue item

1. The atrium and sinus venosus finish **entirely** on the embryo's left (atrium x +0.151…+2.017 —
   it never reaches the median plane; sinus 95.3% left). The builder declared this and could not solve
   it out; the bounding box is worse than the centroid they reported.
2. **The atria are not above the ventricles** — 97.8% of the atrium's vertical extent overlaps the
   ventricle's, D = +0.351 against 2.2 of atrium height. New. Nothing in the test set constrains it.
3. The ventricle finishes **on** the median plane, not left — x = +0.070 on a chamber 1.329 wide.
4. **The sinus venosus is an open pipe at its caudal end**, visible from the anterior camera at stage
   `_b`, which is views 3 and 4. `gaps[10]` records dodging exactly this defect at the *truncus* end by
   choosing a camera. The same cap at the other end of the same tube was never looked at.
5. The median-plane reference is **96.5% occluded** in the only view that uses it — 125 visible pixels
   of 154,711.
6. Views 3 and 4 narrate two sequential movements over one frozen stage; all four bends grow together
   with `t`, so no `t` separates movement one from movement two.

Findings 1, 2 and 3 are **one solve, not three pieces of work**.

### Answering the question the build task escalated to the review

It asked whether the fix is a richer curvature model or whether test I should be weakened. **Do not
weaken I. Enrich the model.** The anatomy is determinate, and weakening a test to fit a curvature model
is the standard lowering itself to let the item pass. The builder's own diagnosis is almost certainly
right: four Gaussian bends each carrying one plane cannot control the atrium's lateral position
independently of the ventricle's, and that is a missing degree of freedom, not a failed search.

### §4 — the standard has a gap, and this is the third round running that it has cost something

Round 2 finding 2 was a test whose implementation did not match its own `must` string. Round 2 finding
4 was a test that asserted a defect and locked it in. Round 3 finding 3 is a test that is **correct**,
asserts the right relation, and is satisfied by a value so small the claim is invisible. Finding 2 is
the same shape.

> **Proposed rule: a sign test on a spatial relation is not a test.** Every acceptance assertion of the
> form "A is left of / above / behind B" must carry a **magnitude floor expressed as a fraction of the
> structures' own extent along that axis** — as a starting figure, ≥ 35% of the mean extent. Write
> `> 0.35 * meanExtent`, not `> 0`, and read any existing sign-only test as **unproven** until it
> carries a floor.

The deeper version, which is what three rounds actually demonstrate: **a test that can be satisfied
without the picture changing is not measuring what the narration claims.** The narration is about what
a student can see; the tests should be too.

Second, smaller gap: the review standard requires a clean console but nothing requires a self-check to
distinguish *cannot measure* from *measured and wrong*. A warning that is a known false alarm trains
every future run to ignore the channel it is printed on.

### Escalation

**Not escalated. This is the first non-converging round**, and round 2 predicted this bar exactly:
4 → 6 is a rise, the rule needs as-many-or-more *twice in a row*, so **round 4 is the decision point —
if it closes with 6 or more, escalate.** Context the next run needs, stated without softening the rule:
all four of round 2's findings are closed and all six open findings are new, because round 3 looked at
the poles, the median-plane reference, the vertical distribution and the layer flags, which nobody had
looked at before. That is thoroughness, not a loop. It is also exactly what the flat-round rule exists
to catch if it repeats, so apply the rule as written and do not re-argue this paragraph.

No finding this round is a decision rather than a defect. **One decision-shaped item exists and is
deliberately not a finding** — recorded as `decision_for_frank` on the queue item and raised in the
review's reply: peak crowding of the heart in the pericardial sac is at **mid-loop, not day 28**
(84%/69% at t=0.65 against 75%/57% at t=1), so views 1 and 6 do not bracket the tightest moment. It
blocks nothing and falsifies no narration, so it is not allowed to stop the loop.

Item left at `changes-requested`; neither task should touch the other `built` item
(`engine__mesh-resolution-by-role`, built 16:25:48Z) on this run — it is newer and belongs to the next
review. Artefacts: `viz-training/_review-2026-09-10-r3-cardiac-looping/`.
