# One scheduled build run: 3 physiology library plates

You are a scheduled run that builds MedBank library plates. Every run starts fresh: everything you need is in Frank's
medbank folder on his computer (connected to this session). Read `explainer/library/HANDOFF.md` first for context.

## Hard rules
- Never run git (on the computer or for the repo). Frank commits and pushes himself.
- Only write inside `explainer/library/`. Do not edit app.html, the server, or `explainer/studio/` engine files.
- The plate never decides what a student is taught: DeepSeek later narrates it from each student's note. So every plate
  MUST ship a `manifest.json` (below) that DeepSeek can map a note onto.
- Quality bar: the two library plates `explainer/library/physiology/nephron-urine-journey/` and `explainer/library/physiology/cardiac-cycle-wiggers/`
  (the Four-Chamber Heart). Not `studio/fixtures/cardiac.*`: that is a simplified older drawing, never copy its look.
  If a plate cannot reach it after about 8 rounds, do not ship it: set status "needs-review" with a note.

## 1. Claim 3 topics
- Read `explainer/library/physiology.json`. Walk `plan.wave1` in order. Take the first 3 topics whose status is "todo",
  or "building" with `claimed_at` older than 3 hours (a crashed run). When wave1 is done, continue with the remaining
  priority-1 topics in chapter order, then priority 2.
- IMMEDIATELY set each one to `"status": "building", "claimed_at": "<ISO time>"` and save the file (python read-modify-write
  on the computer), so a run that starts an hour later does not take the same topics.
- If nothing is left, write one line to `explainer/library/BUILD-LOG.md` and stop.

## 2. Set up the cloud work folder
- Copy into `work/tools/` (stage them from the computer): `explainer/studio/{kit.js,shell.mjs,qa.mjs,prompts.mjs,llm.mjs}`,
  `explainer/studio/fixtures/*`, and `explainer/studio/plate-kit/{assemble.mjs,final.mjs,voice.py,manifest.mjs,freemap.mjs,compare.mjs,BRIEF-nephron-example.md}`.
  Also copy the library nephron plate `explainer/library/physiology/nephron-urine-journey/{plan.json,model.js,scene.js,lesson.json,shows.json,manifest.json}` into `work/tools/exemplar-nephron/` (this is the polished version; it supersedes `studio/out/nephron-compare/src-opus`), and
  `explainer/library/physiology/cardiac-cycle-wiggers/{plan.json,model.js,scene.js,lesson.json,shows.json,manifest.json}` into `work/tools/exemplar-heart/`.
- assemble.mjs imports Playwright from `/opt/npm-tools/node_modules/playwright/index.js`. If that path does not exist, find
  Playwright (`npm root -g`) or `npm i playwright` and fix the import in your work copy.
- Voice: `pip install kokoro-onnx soundfile --break-system-packages`, then download
  `https://github.com/thewh1teagle/kokoro-onnx/releases/download/model-files-v1.0/kokoro-v1.0.int8.onnx` (save as kokoro.onnx) and
  `https://github.com/thewh1teagle/kokoro-onnx/releases/download/model-files-v1.0/voices-v1.0.bin` (save as voices.bin). ffmpeg makes the mp3s.

## 3. Build the 3 plates in parallel (one Opus subagent each)
For each topic, write `work/BRIEF-<id>.md` by adapting `BRIEF-nephron-example.md`:
- Replace the topic, and replace the student note with a **reference note** you write for this topic at Guyton & Hall
  (15th ed) depth for Nigerian MBBS 200–300L: key mechanisms, real textbook numbers, common exam points (`work/<id>/reference-note.md`).
- Keep `kind` from physiology.json (cycle / journey / time-course / sequence / structure / compare) and the matching model rules
  (journeys return `parcel`; scenes return `paths`; no clock schedules; % for proportions).
- Point the builder at `tools/exemplar-nephron/` (journey) and `tools/exemplar-heart/` (cycle) as the standard.
- Charts: the shell supports per-lane `weight`, `step` (gridlines), `grid:false`, `marks` [{t,label}], `noEvents`, `dot`, per-series `at` and `label:""`,
  `M.chartModes` (a toggle, e.g. left/right heart), `M.gateWhy`, and a ledger number `text(s)` formatter. See the heart's model.js. Readouts must stay numeric.
- `plan.json` may carry a `legend` (HTML) for the plate's own colour key.
- Add: "Also write `shows.json` (format below); `manifest.json` is generated from it by `node tools/manifest.mjs <id> <id> physiology`, which must print MANIFEST ISSUES: none."
- Add: "assemble.mjs must also print LABELS ON STRUCTURES: none (no label sitting on a tube, vessel or wall). If a label will not fit, use `node tools/freemap.mjs <id> x0 y0 x1 y1` to find free space, or a short leader line."
Then launch three Agent subagents at once with `model: "opus"`, one per topic, each told to follow its brief in its own folder
`work/<id>/` and iterate with `node tools/assemble.mjs <id>` and the screenshots until MODEL/PAGE ISSUES and LABELS ON STRUCTURES are all none and it looks excellent.

## 4. Review, voice, finish
- Look at each `shot.png` and `stage-*.png` yourself. Reject anything that is boxes-and-arrows, cramped, mislabelled or wrong.
  Send it back to its subagent with specific fixes, at most 2 extra rounds.
- `KOKORO=<dir> python3 tools/voice.py <id> bf_emma` then `node tools/final.mjs <id> <id>.html`.

## 5. Save to the repo
Write to `explainer/library/physiology/<id>/`: `plan.json, model.js, scene.js, lesson.json, shows.json, manifest.json, reference-note.md,
<id>.html, shot.png` (put them under /mnt/user-data/outputs/ first, then device_commit_files).
Update physiology.json for that topic: `"status": "built", "built_at": "<ISO>", "plate": "explainer/library/physiology/<id>/<id>.html"`
(or "needs-review" + "note"). Append one line per topic to `explainer/library/BUILD-LOG.md`: time, id, result, issues left.

## manifest.json (what DeepSeek maps a student's note onto)
Never hand-write manifest.json. The builder writes `shows.json`; `tools/manifest.mjs` runs the model to get the exact phase
names (+ time windows), part ids, readout keys and ranges, merges in the "shows" text, adds the tutor rules, and validates the
default lesson against it. Example: `explainer/library/physiology/nephron-urine-journey/shows.json` and its `manifest.json`.
```json
{ "conditions": ["fixed settings the plate assumes, e.g. 'ADH on'"],
  "phases":   { "<exact phase name>": "one line: what the student sees happen" },
  "parts":    { "<part id>": "what it is / does here" },
  "readouts": { "<readout key>": "what the number means" },
  "concepts": ["each concept the plate can demonstrate, e.g. 'iso-osmotic reabsorption in the PCT'"],
  "not_shown": ["related concepts this plate cannot show (DeepSeek explains them in words and flags the topic)"] }
```
Every phase, part and readout of the model needs a "shows" line. The plate never decides what a student is taught; the
default lesson.json (recorded voice) is only the fallback when a student has no note.
