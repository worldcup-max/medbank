# Clinical Simulation

One tab (`#/clinsim`) for clinical-year students, **400, 500 and 600 level only**, that holds every simulator as a mode. Each mode has sub-modes.

| Mode | Sub-modes | What the student does |
| --- | --- | --- |
| 🚑 Emergency Room | Tutorial, Primary Health Centre, General Hospital, Teaching Hospital | ER Sim (`er-sim.js`, see ER-SIM.md). The debrief now shows a vitals trace with a marker at each treatment. |
| 🩺 OSCE Stations | Timed station, Practice with prompts, From my lectures | Takes a history from the AI patient (`POST /ersim/patient`) in 8 minutes, then gives a diagnosis and plan. Marked on data gathering (50%), clinical management (30%) and interpersonal skills (20%). Pass = 60% overall and at least 40% in every part. Built-in stations come from the ER Sim cases' history. |
| ⚡ Quick Cases | MedBank cases, From my lectures | 3 to 4 decisions with weighted points (best 10, dangerous -10), then 3 MCQs. One dangerous decision grades the case Unsafe. |
| 📅 Case of the Day | Today's case, Past days, From my lectures | One shared puzzle a day (Lagos time), six clues revealed one per wrong guess, six guesses, share to WhatsApp. |
| 👥 Study Group OSCE | Pick a station | Pass-and-play on one phone: patient script, examiner sheet with ticks and an 8-minute clock, then the same three-part mark. |
| 📚 My Lecture Cases | | Every lecture a clinical-year student imports gets its own OSCE stations, quick cases and puzzles. |

## Cases from imported lectures
- `import-server/clinsim.mjs` builds a case pack from the built note. `POST /import` starts it after responding (so imports are no slower) when the level is 400, 500 or 600, and saves it to `topics.extras.clinsim`. `POST /build-extra` with `kind:"clinsim"` builds it for older lectures (the "Build cases" button), and returns the cached pack when there is one.
- The note drives the cases, like the tutor rule: every case must quote the note verbatim (`src`), and a case whose quote is not in the note is dropped. Non-clinical notes get no cases.
- Generated cases are labelled as AI-made from the student's note.

## Free and paid
Unpaid students (trial ended) get one built-in OSCE station and one quick case a week on rotation, every Case of the Day, every ER case, and all cases from their own lectures. The rest opens with a subscription through the existing paywall nudge. Payment code is unchanged.

## Files
- `clinsim.js`: the hub, every mode, scoring and the router (`MB_CLINSIM.page`).
- `clinsim-cases.js`: built-in quick cases (`CLINSIM_QUICK`) and daily puzzles (`CLINSIM_DAILY`).
- `import-server/clinsim.mjs`: case-pack prompt and validation.
- `import-server/test-clinsim.mjs`: run `node --test test-clinsim.mjs` in `import-server/`.

## Switching it on
`FEATURES.CLINICAL_SIM` in `config.js` is **false**. It also switches ER Sim on inside the tab. To try it on your own device: `localStorage.mbclinsim='1'`, then reload. With no account, `localStorage.mbclinsimlevel='500'` sets a level for testing. The nav shows **Clinical Sim** instead of **ER Sim** for 400 to 600 level.

## Clinical review before launch
- [ ] Each built-in quick case: the best option, points and explanations match current Nigerian / WHO guidance.
- [ ] Each MCQ has one defensible answer.
- [ ] Each daily puzzle's clues are accurate and lead to one diagnosis.
- [ ] OSCE marking: the key history items for each ER case are the ones an examiner would expect.
- [ ] Spot-check 10 packs built from real imported lectures for accuracy and staying within the note.
