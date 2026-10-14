# Build: "How the nephron makes urine", an interactive, model-driven explainer plate

You are building one explainer for MedBank, a study app for medical students. A student imported the lecture note in
`tools/nephron-note.md` and pressed "Tutor me". Your job is to make the best explainer of that note that you can, at the
quality bar of `tools/QUALITY-BAR-heart.png` (a hand-built Four-Chamber Heart plate; look at it with the Read tool before you start).

## What you write (in your own folder, `<your folder>/`)
1. `plan.json`: `{ "title", "titleEm", "figLabel", "sub", "kind": "journey", "timeUnit", "duration", "parts": [{id,name}], "phases": [...], "quantities": [{key,label,unit,typical:[lo,hi]}] }`
2. `model.js`: one function `createModel()`, the single source of truth (contract below).
3. `scene.js`: one function `createScene(svg, K, M, S)`, the drawing, driven every frame by the model (contract below).
4. `lesson.json`: `{ "steps": [{ "title": "2–4 words", "phase": "<one of the phases>", "focus": ["part ids"], "say": "..." }] }`, 6–8 steps.
   The `say` text is READ ALOUD by a narrator voice: 2–4 natural spoken sentences each, explaining WHY with the model's numbers and the note's terms.
   Write it for the ear: no symbols like "→" or "~"; write "about", "milliosmoles per kilogram", "N-K-two-C-L cotransporter", and so on.

You may NOT edit anything in `tools/` (kit.js, shell.mjs, qa.mjs, …): the app ships those. Everything you make lives in your four files.

## The contracts
- Read `tools/prompts.mjs`: `modelPrompt()` gives the full model contract, `KIT_DOC` and `scenePrompt()` give the drawing kit and craft rules.
  Those are the same instructions the production AI gets. Follow them.
- Read `tools/kit.js` for the exact kit API (`K.vessel`, `K.blob`, `K.bed`, `K.valve`, `K.label`, `K.tag`, `K.part`, `K.flows`, `K.el`, `K.defs`, `K.spline`, `K.sampleSpline`, ...).
  You may also draw raw SVG with `K.el(tag, attrs, parent)` and add gradients/patterns in `K.defs()`. Use the CSS colour tokens listed in KIT_DOC.
- Exemplars of the standard: `tools/fixtures/cardiac.model.js` and `tools/fixtures/cardiac.scene.js` (they produce the heart plate).
- This is a **journey**: the model follows ONE parcel of filtrate from Bowman's capsule to the end of the collecting duct.
  `sample(t)` returns `parcel: { part, u }`, each phase is visited once in order, and readouts are the parcel's own properties
  (osmolality, % of filtered volume remaining, flow, local interstitial osmolality, …), so they change along the way. Use real numbers from the note.
  Proportions are percent (0–100). ADH is present (concentrated urine).
- `createScene` must `return { paths: { <partId>: <centreline points you drew that part with> }, update(i, s, d) { ... } }`.
  The runtime moves the parcel marker along `paths` itself. Do not call `K.tracer`. `update()` only READS `s.phase`, `s.parcel`, `s.readouts`, `s.parts`.
  It never invents timing from `i`.

## What "good" means here
- An original, anatomically faithful, richly detailed plate (not boxes and arrows, and not a copy of a textbook figure).
  Cortex and medulla zones, with the medullary interstitium shaded as a real 300 to 1200 gradient. A glomerular tuft inside Bowman's capsule,
  afferent and efferent arterioles, a coiled PCT, thin descending and thick ascending limbs (the ascending limb is visibly thicker),
  the DCT returning to its own glomerulus (macula densa), the collecting duct to the papilla, peritubular capillaries and vasa recta as faint context
  (separate thin vessels, never one zig-zag), and cell or brush-border detail where it helps.
- It moves because the model says so: the segment holding the parcel lights up, reabsorption arrows or particles leave the tubule where water or salt
  actually leaves (water out of the descending limb and collecting duct, salt out of the thick ascending limb), and tubule fill or particle density
  reflects the remaining volume.
- Labels are readable and never overlap. Everything sits inside the 760×640 canvas, and the structure fills at least half of it.

## How to check your work (do this repeatedly)
From the `neph/` folder: `node tools/assemble.mjs <your folder>`
It builds `<your folder>/A.html`, runs every production check, and prints MODEL ISSUES / SCENE CODE ISSUES / PAGE ISSUES.
It also saves screenshots: `shot.png` (full page) and `stage-5.png … stage-95.png` (the drawing at 5 moments of the journey).
**Look at the screenshots with the Read tool** after each build and judge them as a demanding anatomy teacher would. Fix and rebuild until
there are no issues and the plate looks excellent. A few rounds is normal; stop when it truly meets the bar, at most about 8 rounds.

## When you finish
Reply with: what you built, the final check output (issue lists), and an honest one-paragraph self-critique (what is still weak).
