# ER Sim

An emergency room simulator inside the app (`#/ersim`). The student is the doctor on duty: they take a history (by tapping questions or typing in their own words to an AI patient), examine, send tests that come back after realistic turnaround times, treat, call for help, then commit to a diagnosis and a disposition. The patient's vitals drift while problems go untreated and recover when they are fixed. A neglected patient can die. The debrief scores critical actions (with time targets), history and exam coverage, good practice, harm, diagnosis and disposition, then gives learning points and references.

## Files
- `er-sim.js`: engine (pure, runs in node) + screens. Action catalog, facility limits (PHC / General / Teaching), vitals model, triggers, scoring.
- `er-sim-cases.js`: the cases. The schema is documented at the top of the file.
- `import-server/ersim.mjs` + `POST /ersim/patient`: the AI patient. It answers in character from the case's history facts only, and returns which facts it used so the student gets credit. Signed-in only, 80 questions a day (300 for Premium), counted in memory. If the server is unreachable, the app falls back to its own keyword matcher.
- `import-server/test-ersim.mjs`: plays every case end to end (the ideal path must score Excellent with the patient alive, neglect must score under 50%), plus harm rules, timers, triggers, facility limits and the AI-patient contract.

## Switching it on
`FEATURES.ER_SIM` in `config.js` is **true** (switched on for students on 2026-11-17, before the clinical review below). Set it to `false` to hide ER Sim again.

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
