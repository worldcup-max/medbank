# ER Sim

An emergency room simulator inside the app (`#/ersim`). The student is the doctor on duty: they take a history (by tapping questions or typing in their own words to an AI patient), examine, send tests that come back after realistic turnaround times, treat, call for help, then commit to a diagnosis and a disposition. The patient's vitals drift while problems go untreated and recover when they are fixed. A neglected patient can die. The debrief scores critical actions (with time targets), history and exam coverage, good practice, harm, diagnosis and disposition, then gives learning points and references.

## Files
- `er-sim.js`: engine (pure, runs in node) + screens. Action catalog, facility limits (PHC / General / Teaching), vitals model, triggers, scoring.
- `er-sim-cases.js`: the cases. The schema is documented at the top of the file.
- `import-server/ersim.mjs` + `POST /ersim/patient`: the AI patient. It answers in character from the case's history facts only, and returns which facts it used so the student gets credit. Signed-in only, 80 questions a day (300 for Premium), counted in memory. If the server is unreachable, the app falls back to its own keyword matcher.
- `import-server/test-ersim.mjs`: plays every case end to end (the ideal path must score Excellent with the patient alive, neglect must score under 50%), plus harm rules, timers, triggers, facility limits and the AI-patient contract.

## Switching it on
`FEATURES.ER_SIM` in `config.js` is **false**. To try it on your own device: `localStorage.mbersim='1'`, then reload. Turn the flag on only after the clinical review below.

## Clinical review before launch (one checklist per case)
- [ ] Vitals, history, exam and results are internally consistent and realistic for the setting.
- [ ] Every drug, dose and regimen in the catalog and the `responses` matches current Nigerian / WHO guidance.
- [ ] Critical actions and their time targets are defensible. Harmful actions are truly harmful.
- [ ] The best and acceptable dispositions are right for that facility level.
- [ ] Learning points and references are correct and current.

## Adding a case
Copy an existing case in `er-sim-cases.js`, keep the title to the presenting complaint (never the diagnosis), add its ideal path to `IDEAL` in `test-ersim.mjs`, and run `node --test test-ersim.mjs` in `import-server/`.

## Painted patients (case.art)

A case can carry `art` (see `okada-crash` in er-sim-cases.js). Its pictures live in `er-sim-art/<case-id>/`: one base picture of the bay, then edits of that same picture (distress, critical, treated) so the room never moves between them. They were made in Google Flow for MedBank; nothing is taken from other simulators.

- The state is picked live: critical (SpO₂ < 80, SBP < 70 or dead), distress (a `distress`/`fitting` look is active), treated (`treatedWhen` met), else base. Changes crossfade.
- `baked` lists the equipment a picture already shows, so it is not drawn twice. Everything else is drawn on top at the `at` anchors (image pixels).
- Live layers: chest rise at the real RR, the monitor screen (ECG, pleth, numbers, alarm flash), drip, drain bubbles, curtain sway, sunlight, a wall clock on real time.
- Sound is off until the student taps 🔇 on the picture: a beep per beat at the HR, pitch falling with SpO₂, alarms, a soft room hum.
- Cases without `art` keep the drawn SVG patient.
- To add art for a case: 1206×674 WebP (~70 KB each), then fill `at` by eye from the base picture.

## Branching cases (Patient cases in Mega Qbank)

A case can deal a different start every run. `child-very-sick-fever` is the first one. All of these fields are optional, and cases without them play exactly as before.

- `variants[]`: partial cases, each a different patient, hospital, presentation and picture set. Plain objects (`exam`, `tests`, `responses`, `vitals`, `patient`, `dx`, `dispo`) merge key by key. Arrays of `{id}` (`history`, `problems`) merge by id. Other arrays (`critical`, `good`, `harmful`, `complications`) replace the base ones.
- `severity[]`: `{id, label, vitals:{k:±}, drift:x}`, how late the patient was brought in. `drift` scales every problem's drift.
- `nightShift`: `{chance, tatX, note}`. On a night shift, lab tests (those with `at`) take `tatX` times as long. Day pictures are dimmed, and the set's `night` picture replaces `base`.
- `complications[]`: `{id, label, problem, at:[from,to], chance}`. At most one is drawn per run. It wakes a latent problem of the case, so it reuses the distress and critical pictures. The debrief scores how fast it was treated ("Handled the curveball", 10 points, or 5 if treated after more than 15 minutes).
- A test or exam finding can have `active:{problemId:"text"}`, which is shown only while that problem is active, for example a low glucose once late hypoglycaemia sets in.
- `pv` (Private Hospital) is a fourth setting, equipped like a General Hospital.

`ERSIM_ENGINE.instantiate(case, opts)` deals the start from one seed, and the run stores it so a reload rebuilds the same start. **Play again** deals a new one. The debrief adds **Your path and the best path**: each critical step in target order with when you did it, the diagnosis, where the patient went, the curveball, and anything off the path.

**Pictures.** A variant names a picture-library set with `art:{ topic, set, treatedWhen }`. The scene asks `window.MB_ART.resolve(topic, set)` (built by the picture library work) and otherwise falls back to `er-sim-art/<topic>/<set>/` with standard file names. It shows the arrival picture before the first action, looping flipbook frames (`distress-f1..f4`) for fits, rigors and fast breathing, close-ups when you examine (airway → mouth, circulation → hands, abdomen → abdomen, skin → eyes, hands and skin; the same five sites for every patient), and the discharge picture on the debrief when the patient went home well. The three severe malaria sets are in `er-sim-art/severe-malaria/` as a pilot. Long term, the plan is Supabase Storage.

**Switching it on.** `FEATURES.PATIENT_CASES` in `config.js` is **false**. To try it on your own device, run `localStorage.mbcases='1'` (and `localStorage.mbclinsimlevel='500'` with no account), then open Mega Q-bank. The card only shows for 400 to 600 level, and it doesn't switch the rest of ER Sim on. Branching cases are not used as OSCE stations, because there is no single patient to interview.
