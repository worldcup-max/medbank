
---

## 2026-10-04 · REVIEW · embryology__pharyngeal-apparatus__pharyngeal-clefts-membranes → changes-requested (round 1)

Reviewed by the model3d REVIEW task, run fired 2026-10-04T09:35Z. I did not build this item.

**The device shell worked this run.** `ls "$HOME/mnt/medbank/..."` succeeded on the first call and node
ran in-repo, so the queue was written through `queue-set.mjs` with its real lock rather than by staged
compare-and-swap. REVIEW-TASK-PROMPT §0's correction of 2026-09-30 is holding: the outage is
intermittent, and a run that refuses to test it converts an outage into a permanent one. The scheduled
prompt still says "YOU HAVE NO SHELL ON THAT COMPUTER … Do not try it" and is now wrong in the same way
§0 used to be — believe the repo, not the prompt. Renders and probes still ran in the cloud container
off a staged copy, because chromium is not on the device.

**Item claimed in-review at 09:37Z, set changes-requested at 09:52Z. `open_findings_by_round` = 3.**
Queue re-read off the disk after the write and the entry confirmed present (status, round, all three
findings, 8705 bytes) — §0's read-back rule, which caught a silent loss on 2026-09-30.

### §2's "your order first" — written before reading `built_notes`

From the scene and the curriculum entry alone: (1) does cleft 1 survive while 2–4 are buried, measured
rather than asserted; (2) is the tympanic membrane really between cleft 1 and pouch 1, and are its three
laminae in the right medio-lateral order; (3) do the three branchial anomalies have the openings their
definitions require — cyst closed, sinus open to skin only, fistula open at both ends. **(1) and (2)
passed.** (3) is F3. F1 and F2 came from re-running the builder's own harness.

### F1 — the recorded proof is stale, and the harness now FAILS

`built_notes` opens with "harness ALL NINE CHECKS PASS". Re-run here, it ends `PROOF FAILED` on check 11:
the two models disagree about where the first groove is by **2.12 intersegments of level** (floor 0.001)
and **1.38 lateral** (floor 0.05), with a sign flip on level. Root cause located: `pharyngeal-pouches.js`
was rebuilt on 2026-10-03 from *its* review's findings F1/F4, deleting the fixed `F_CLEFT = 3.60` in
favour of a solved body surface; `pharyngeal-clefts-membranes.js:235` still carries that constant under a
comment at :230 declaring it copied "VERBATIM" from the sibling. **The clefts model was written at 19:56
and the sibling changed at 20:21 the same evening.** The builder's claim was true when written and false
twenty-five minutes later — §6, exactly: a note in a file is a claim, not a fact.

### F2 — no body surface exists, so the clefts are grooves in nothing

The model's complete `addAll` key set contains no surface ectoderm. The four crescents sit 3.6
intersegments out from a pharyngeal half-width of 0.80 with nothing drawn between them. `d44-superior.png`
is the picture that shows it: pharynx and both carotids a small cluster at the centre, clefts and
operculum arcs at the rim, the whole middle empty. Beat 1 narrates "surface ectoderm dips between them as
four pairs of grooves"; beat 6 calls the sinus "sealed off from the surface". Same defect, same words, as
the one the pouches review already wrote up and repaired. The builder flagged the proportion honestly and
was right about it; what the note does not say is that the surface is absent altogether. F1 and F2 are one
repair — port the sibling's solved layout.

### F3 — the carotid relation is never shown, and its check cannot see the axis it fails on

Beat 11 is the only beat drawing the carotids, and narrates that the second-cleft remnant's tract runs
between ICA and ECA. The cyst it draws is **3.08 and 3.10 intersegments lateral of both**. From beat 11's
own camera it projects neatly between them and looks correct; rotating is what killed it (§2's "Rotate it.
Look underneath."). The claim that *is* measured, B12-between, belongs to beat 12 — which draws no
carotids. And `claimMeasure('fistulaBetween')` (model :2012–2025) reads **only z**: **0 of 5544 fistula
vertices lie inside the carotids' own x band** at either t (band 37.64–55.69, tract minimum x 69.01), and
it still returns 0.3941 against a 0.35 bar. Between two things on one axis is not between two things.

### Checked and sound, so the next round does not re-spend it

validate-scenes valid; check-beat-claims 54/54, 12/12 beats pinned; 0 unpaired edges and 0 bad outward
normals (hull and inner) on every key at days 22/40/56; console clean on both pages; no two consecutive
beats share a structure set and t. **The tympanic membrane is right** — laminae in correct medio-lateral
order (ectoderm 71.07–83.62, mesoderm 68.75–81.58, endoderm 66.71–79.26 at t=0.7647) and the chain
cleft1 → meatus_lumen → meatal_plug → TM → pouch1 continuously apposed at 0.01/0.03/0.03/0.02
intersegments. My first reading of the bounding boxes said the eardrum floated 1.76 intersegments clear of
the first cleft; measuring the chain showed that 1.76 is just the length of the canal and **the suspicion
was wrong** — recorded here so nobody re-runs it. Fistula reaches pouch 2 at 0.01 while the sinus tract
stays 3.78 clear of the pharynx: the cyst/sinus/fistula distinction is drawn correctly. Six hillocks per
side on arches 1 and 2.

### §4 — two gaps in the standards, proposed not written

**(a) A copied constant is a dependency, and nothing re-runs a built item when its dependency changes.**
This item sat `built` for fourteen hours carrying a stale copy while its own recorded proof said it
passed; only re-running the harness caught it, and only because this harness happens to load the sibling.
Propose for RENDER-STANDARD: a model that declares a copied constant must have its harness assert the copy
against the **source file's current value** — a textual check that fails the moment the sibling changes —
rather than against built geometry, which fails only once somebody re-runs it.

**(b) A measure that asserts a spatial relation must be rejected by a negative case placed outside that
relation on an axis the measure does not read.** This item's battery has 21 negative cases and not one
moves the tract laterally, which is how a z-only test shipped as a containment test.

### Not corrected here, and why

All three findings land on the same lateral layout, whose repair is a re-authoring of this model's
geometry — the build task's work under §5, not a review's. Tightening `fistulaBetween` alone would convert
a false pass into a failure without repairing what it tests, so it is specified in the findings instead.
No model, scene or standard file was modified by this run.
