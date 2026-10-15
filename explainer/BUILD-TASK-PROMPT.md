# Build task: a polished, hand-built 3D Tutor lesson

You are turning the top mechanism in `explainer/BUILD-QUEUE.md` into a **hand-built template** like `explainer/src/sn2.js`.
Hand-built templates replace the instant builder's version for every student whose topic matches. Use the **/anatomy skill's
method** throughout: truth first, the object is the explanation, dense purposeful detail, and verify like a critic.

## 1. Truth first (write it down before any code)
- The real mechanism: every species, every curly arrow, which step is rate-determining, stereochemistry (retention, inversion,
  racemisation), what each intermediate looks like in 3D (flat carbocation, tetrahedral intermediate, bridged ion…).
- Real numbers: bond lengths (Å), angles, relative energies. Every number on screen (bond meters, energy dot, R/S) must come
  from the same model that moves the atoms — never typed in.
- Start from the instant builder's cached lesson for this mechanism if there is one (Supabase `explainers`, template `auto`):
  its atom-mapped states already passed `import-server/chemspec.mjs`. Run `validateMechanism` on your own states too.

## 2. The screenplay (src/<id>.js, same shape as sn2.js)
- 8–12 steps: overview → each arrow-pushing step → the key 3D insight (the thing a flat drawing can't show) → a contrast case
  (e.g. SN1 vs SN2, syn vs anti) → quiz. Camera shot per step, focus atoms, labels, a numbered mechanism figure (SVG) whose
  numbers the narration uses.
- Geometry: a mode in `src/mech3d.js` (or a new engine file) computed from bond lengths and angles — never keyframed pictures.
- Detail that teaches (the /anatomy rule "highly detailed, never noise"): lone pairs where electrons come from, the orbital being
  filled, partial charges that change through the transition state, van der Waals clouds where sterics matter.

## 3. Wire it in
- Register it in `TEMPLATES` (`src/mech3d.js`), add the step ids + "shows" to `EXPLAINER_TEMPLATES` in
  `import-server/explainer.mjs` (with a `match` regex), and add the same matcher to `MBX_TEMPLATES` in app.html.
- `cd explainer && npm run build`, then bump `?v=` in `mbxLoad()` in app.html.

## 4. Verify like a critic (do not skip)
- Screenshot every step at desktop (1300×900) and phone (390×844), plus mid-transition moments. Read every PNG.
- Zoom 4× on the reacting centre: bonds meet atoms cleanly, dashed bonds only while forming/breaking, labels never cover the
  atom they name, nothing clips through anything.
- Check R/S and charges at the first and last frame against the textbook answer.
- Play it with narration once end to end; every sentence must describe what is on screen at that moment.
- Commit only your files; note the template in `explainer/README.md`.
