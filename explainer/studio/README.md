# Explainer Studio — note → two model-driven explainers

What a student gets when they ask for a 3D/interactive explainer of a topic:

- **A · Best explainer** — an original, detailed "specimen plate" (like the Four-Chamber Heart): a numerical **model** of the
  mechanism drives an original drawing, live readouts, a timeline chart and a narrated tutor.
- **B · Your note's diagram** — the student's own figure, with its parts mapped by a vision model, animated by the **same** model
  (valves/gates turn green/red, structures glow when active, flow particles move at the model's rates).

The student chooses (`choose.html`). Same model, same numbers, two ways of seeing it.

## Method (the /anatomy order)
1. **Understand** the note → plan: state variables, rules, real parameters, quantities with real ranges, parts, phases, visual plan, lesson.
2. **Model** (the truth): `createModel()` — checked in Node: runs, every readout finite, real-world magnitudes, phases occur.
3. **Scene** (version A): `createScene(svg, K, M, S)` using the drawing kit (`kit.js`) — checked in a headless browser: renders,
   ≥120 drawn elements, every model part drawn, labels don't overlap, things move. Failures go back to the AI (2 fix rounds).
4. **Figure map** (version B): a vision model outlines each part and the flow paths on the student's figure.
5. Pages: `shell.mjs` lays out the plate (ledger, gates, chart, controls, tutor) around any model.

## Run it
```powershell
# from the medbank folder, with Node 20+
$env:DEEPSEEK_API_KEY = "sk-…"          # your DeepSeek key
$env:GEMINI_API_KEY   = "…"             # optional: needed for version B (reading the student's figure)
cd explainer; npm i -D playwright; npx playwright install chromium; cd ..   # optional: the drawing checks
node explainer/studio/build.mjs --topic "How the nephron makes urine" --note path\to\note.md --figure path\to\figure.png
```
Output: `explainer/studio/out/<topic>/` → `choose.html` (both), `A.html`, `B.html`, `plan.json`, `model.js`, `scene.js`, `report.json` (time, cost, every check).

`node explainer/studio/build.mjs --fixture` runs the whole pipeline with the built-in cardiac example and no API calls.

Models: `STUDIO_THINK_MODEL` (default deepseek-v4-pro), `STUDIO_FAST_MODEL`, `STUDIO_VISION_MODEL` (default gemini-2.5-flash), `STUDIO_REASONING` (default none).
