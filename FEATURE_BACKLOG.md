# MedBank — Feature Backlog

_Living list of proposed features and improvements. Status: ✅ shipped · 🟡 partial · ⬜ to build_

---

## 1. Big new features (roadmap)

| # | Feature | What it is | Where it lives | Status |
|---|---------|-----------|----------------|--------|
| 1 | **Question bank (MCQ)** | Exam-style vignettes, 4–5 options, best answer + rationale for *every* option; Tutor & Timed modes; weakness-mapping analytics | New study mode (grows out of recall cards) | ✅ (v189 — see below) |
| 2 | **Image occlusion cards** | Hide labels on a diagram, reveal on recall (Anki-style); AI first pass + student edits | New card *type* inside Active Recall; creation tool on images | ⬜ (on hold — needs lecture-image storage first) |
| 3 | **OSCE / clinical case practice** | AI plays patient or examiner; history-taking, station checklists, branching cases | New mode / extends AI tutor | ⬜ |
| 4 | **Teach-back (Feynman) mode** | Student explains a concept aloud; AI scores it, flags gaps, feeds weak concepts back into review | Toggle inside the AI voice tutor (+ optional "Explain it" card in Active Recall) | ⬜ |
| 5 | **Study planner** | Enter exam date → auto daily plan across the syllabus; reshuffles when you fall behind | New planner view | ⬜ |
| 6 | **Progress dashboard** | Exam-readiness %, retention curve, weakest topics, what's due | Expand existing Progress | ⬜ |
| 7 | **Shared class library** | One classmate builds a topic → whole class gets it instantly; content shared, progress personal; cuts generation cost | Inside existing Library ("Your topics" + "Shared with your class") | ⬜ |
| 8 | **FSRS scheduling** | Upgrade SRS to the modern gold-standard algorithm | Under the hood of Active Recall | ⬜ |
| 9 | **Instant card from highlight** | Select text in a note → one tap makes a recall card | Note view action | ⬜ |
| 10 | **Inline quick-reference** | Normal lab values + drug lookup surfaced in notes | Note view | ⬜ |
| 11 | **Anki import / export** | Interop with students' existing Anki decks | Library / settings | ⬜ |
| 12 | **Gamification** | XP, badges, class leaderboard on top of streaks | Cross-app | ⬜ |

---

## 2. Podcast player improvements
_From the MedBank-vs-Studley teardown. Several already shipped this session._

| # | Improvement | Status |
|---|-------------|--------|
| 1 | Real time-based scrubber — elapsed / remaining (0:40 / -7:01), click/drag to seek | ✅ (v174) |
| 2 | Inline volume control | ✅ (v176) |
| 3 | Clickable transcript lines (tap to jump audio) | ✅ (podJump on each line) |
| 4 | Chat-bubble transcript with host avatars + distinct colors | ✅ (v177 — A left / B right bubbles) |
| 5 | Synced source/content pane — note scrolls to each line's source as it plays | ✅ (v177 — reuses the card→note dock via per-line `src`) |
| 6 | Downloadable audio (MP3 export, premium-gated) | ✅ (v176 — stitches clips to one MP3) |
| 7 | Regenerate — whole episode and per-line | ✅ (v177 — per-line ↻ + whole-episode Remake) |
| 8 | Full speed menu (0.75×…2×) instead of a cycle | ✅ (v176 — dropdown 0.75×–2×) |
| 9 | Sticky / docked mini-player while scrolling transcript | ✅ (v174) |
| 10 | Show total duration up front (needs clip durations) | ✅ (v174) |
| 11 | Inline "Ask the hosts" answer as a bubble + auto-resume | ✅ (v176 — type or speak; You + host bubbles inline; host answers aloud; auto-resume) |
| 12 | Keyboard shortcuts (space, arrows, number keys) | ✅ (v176 — space/arrows/1–5) |
| 13 | Chapter outline (jump by system) | ✅ (v173 chapters) |
| 14 | Clear "now playing" / active-speaker indicator | ✅ (now-speaking card + live dot + lock-screen art) |
| 15 | Spoken intro framing + "Key takeaways" card | 🟡 (intro/stakes hook in new script; takeaways card to build) |

---

## 3. Already shipped this session (podcast pipeline)
Script persistence · OpenAI TTS removed · premium→Fish routing · resumable/chunked generation (no timeouts) · Fish reliability (retries, no dead-Kokoro fallback) · Fish voice wiring (hidden-char key fix) · calmer speed (FISH_SPEED 0.9) + finer playback steps · real-voice avatar picker · realistic host portraits · player avatars + now-speaking + lock-screen artwork · empty/broken-clip fix · chapters · Quick review / Deep dive modes · richer script prompt (depth, hook, back-and-forth, vignettes, transitions, memory pegs, active-recall close, host personas, level-adaptive) · Kokoro-down admin alert · Kokoro CONC=1 memory fix.

---

## 4. Question bank — shipped (v188–v189)
- **Differentiation from Quiz (v188):** vignette-enforcing prompt (never name the diagnosis, ≥2-step reasoning, discriminating clue + red herring, homogeneous options, clinical-decision lead-in), difficulty mix, richer schema (`lead_in`, `teaching`/educational objective, `system`, `difficulty`, `src`). Rationale for *every* option (was already live). Client shows lead-in, difficulty chip, 🎯 objective, and a "📄 Show in note" jump.
- **Weakness engine (v189):** every answer logged as one attempt (single source of truth) with per-question timing. Performance dashboard: first-pass vs after-review (only first-pass predicts the exam), by system / topic / difficulty, Tutor vs Test, pacing (avg time + fast-wrong flag), session-trend sparkline, and auto study recommendations. **My Mistakes** pool re-serves questions you last got wrong until you get them right; scope toggle This-topic / All-topics. Attempt log unions across devices in sync (can't be wiped).
- **Roadmap (Q-bank phase 2):** peer percentile / decile benchmark (needs backend aggregation of anonymised attempts — schema is already peer-ready); adaptive session generation weighted to weak systems; answer-changing stats; flag-for-review pool separate from wrong-answers.

## 5. Q-bank system roadmap (Topic + Mega + beyond)
Two layers now, growing toward a clinical-reasoning engine. Difficulty = the four **cognitive levels** (Interpretation → Clinical reasoning → Complex reasoning → Exam trap); **skill** (Diagnosis / Investigation / Management / Complications / Differential / Next best step) is a separate axis. Data model designed-for the later phases (reserved integrated_topics[]/case_id/branch_id).

**V1 — shipped (v192–v193)**
- Topic Q-bank: Tutor/Test, 4 cognitive levels, skill filter ("what to practice"), count, type hidden until after answering then revealed (level·skill·subtopic + exam-trap callout), objective + Show-in-note, weak-question retry, dashboard with By-cognitive-level + Reasoning-profile, mastery grid columns = cognitive levels.
- Mega Q-bank (sidebar): course + topic pool, **Focused / Mixed / Blind** exposure (topic never shown before answering, revealed after — point 5), **balanced round-robin** so a big topic can't dominate (point 8), Blind draws whole courses (point 6). **Quick Exam is the primary CTA** (point 11); **"Drill my weaknesses"** panel from existing analytics (point 13); Mega Test **results break down by course / cognitive level / skill** (point 9). Tutor/Test, level + skill + count. Reuses the attempt log so weakness analytics + mistakes pool work across topics.
- Schema: **trap_type** (anchoring / premature_closure / next_step_confusion / timing_error / contraindication / overthinking / common_diagnosis_bias) + **trap_explanation**, populated beyond exam-trap (point 16) — enables "you keep falling for next-step confusion" analytics later.
- Generator prompt encodes each cognitive level's construction rules + the exam-trap taxonomy (diagnosis-vs-next-step, stabilisation-vs-definitive, most-likely-vs-most-dangerous, treatment-vs-contraindication, conditional-not-automatic).

**⏸ VALIDATION GATE (do this before V1.5)** — deploy v194, build 2–3 cross-course topics with decent pools, and run `QA_CHECKLIST.md`. The open risk is question-generation quality: prove the four cognitive levels generate *differently* (not cosmetically) before adding adaptive logic. If they don't differ, fix the prompt — not by adding features.

**V1.5 — reordered (after the gate passes)**
- **V1.5A** Question-quality + analytics validation (QA_CHECKLIST). FIRST.
- **V1.5B** Weakness engine — "you're weak at management" → auto-build a session from existing questions (extends `mgDrillWeak`).
- **V1.5C** Confidence rating (Guess/Unsure/Confident/Very confident) → wrong+unsure = knowledge gap vs wrong+confident = misconception. Also: trap_type analytics ("you keep falling for next-step confusion").
- **V1.5D** Adaptive difficulty — only once there's enough reliable performance data.
- North star: Mega shifts from "what do you want to practice?" → "🎯 you should practice this" (auto-built Recommended Drill from the weakness profile).
**V2** ⬜ Integrated cases (one vignette needs multiple topics/courses) — new multi-note generation path.
**V3** ⬜ 🌳 Branching clinical cases — decision → consequence → outcome; "your first wrong decision was at step 2". Its own engine (case state / transitions / scoring).
**V4** ⬜ 🧠 Adaptive Exam Simulator — "prepare me for my exam": auto-builds a personalised timed paper (weak areas + previously-missed + mixed reasoning + traps), then reports risk areas.

## Priorities (my recommendation)
- **Biggest brand-movers:** Question bank (#1) → Shared class library (#7) → Teach-back (#4).
- **Highest-impact podcast polish:** time scrubber (2.1) → sticky mini-player (2.9) → download MP3 (2.6) → inline Q&A bubble (2.11).
