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
