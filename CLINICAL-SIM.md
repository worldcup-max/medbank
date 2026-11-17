# Clinical Simulation

One tab (`#/clinsim`) for clinical-year students, **400, 500 and 600 level only**, that holds every simulator as a mode. Each mode has sub-modes.

## How the tab is arranged
The first screen goes **course → topic → cases**:
1. **Your course**: the courses the student imports into (plus specialties they have no course for yet).
2. **Up next**: three unplayed cases in that course, from the specialty where their scores are lowest.
3. **Topics in that course**: each imported lecture, holding its own lecture cases plus built-in cases whose topic words match its title, then the course's remaining **core cases**.
4. **Or practise by mode**: the six modes below. Their lists follow the chosen course.

A search box finds any case by name, topic word or specialty.

**The topic does not give the diagnosis away.** A case opened from its own topic panel is *topic practice*: the OSCE asks "These look alike. Which one fits this patient?" (the right diagnosis plus its look-alikes, from `dx.close` in ER cases or `form` in lecture packs) instead of the diagnosis, or drops that question and marks management on the plan. Topic panels hold no puzzles, and lecture case lists show the course name, not the lecture title. The diagnosis is tested in the **🎲 Mixed ward round** (`#/clinsim/round`): up to five patients from the course plus one from another specialty, with no topic or specialty shown. ER Sim cases still ask the diagnosis inside ER Sim.

## Scoring (one system for every mode)
- Each run scores 0 to 100 in its own mode (OSCE domains, quick-case points, ER Sim, Case of the Day guesses).
- **Grade:** Excellent 85+, Pass 60+, Borderline 50 to 59, Fail under 50. A dangerous decision (or a patient death in ER Sim) makes it **Unsafe** whatever the score. An OSCE with any part under 40% is Fail.
- **Clinical points** = score × difficulty (Beginner 1, Core 1.25, Advanced 1.5) × how it was opened (topic 1, open 1.1, mixed round 1.3) ÷ 10. OSCE practice mode counts half. Unsafe runs count as 40% at most.
- Only the best run of each case counts towards the total, so replaying cannot farm points. Study-group runs are ticked by friends and earn no points.
- **Ranks:** Student 0, Clerk 100, House Officer 300, Medical Officer 700, Registrar 1500, Consultant 3000.
- The hub shows rank, points, the **safe streak** (runs in a row with no dangerous decision) and the weakest specialties.

How matching works (`clinsim.js`): every case has `spec[]` (specialties) and `words` (topic words). Built-in quick cases and puzzles carry them in `clinsim-cases.js`. ER cases get them from `ER_TAGS` in `clinsim.js`, so `er-sim-cases.js` stays as the ER thread wrote it. A course is matched to a specialty by its name (`specOf`). Lecture cases already belong to their course and topic. When you add a built-in case, give it `spec`, `words` and `diff`.

## Modes
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
- Each pack mixes two kinds of case (`basis`):
  - **note** (about two thirds): built on what the note teaches. Each quotes the note verbatim (`src`), and a note case whose quote is not in the note is dropped.
  - **general** (at most one per mode, so about a third): standard, widely taught content on the same topic that the note may leave out (Nigerian and WHO guidance, standard textbooks). It must name the topic (`onTopic`), and it is kept only when the note gave at least one case of its own, so non-clinical notes still get no cases.
- **Only topics with a patient to see get a pack** (`isClinicalTopic`, checked before any model call). A topic named for biostatistics, research methods, epidemiological methods, ethics, law, histology, embryology or pure basic science gets none, and any other note must read like a clinical note (several clinical words of several kinds: patient, presents, signs, diagnosis, management, doses and so on). The import then doesn't show "Clinical cases on the way".
- The tab tags them "From your note" and "📘 General topic case". Packs built before this change count as note cases.
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
