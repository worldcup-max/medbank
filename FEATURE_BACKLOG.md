# MedBank — Feature Backlog

_Living list of proposed features and improvements. Status: ✅ shipped · 🟡 partial · ⬜ to build_

---

## 1. Big new features (roadmap)

| # | Feature | What it is | Where it lives | Status |
|---|---------|-----------|----------------|--------|
| 1 | **Question bank (MCQ)** | Exam-style vignettes, 4–5 options, best answer + rationale for *every* option; Tutor & Timed modes; accuracy analytics per system | New study mode (grows out of recall cards) | ⬜ |
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

## Priorities (my recommendation)
- **Biggest brand-movers:** Question bank (#1) → Shared class library (#7) → Teach-back (#4).
- **Highest-impact podcast polish:** time scrubber (2.1) → sticky mini-player (2.9) → download MP3 (2.6) → inline Q&A bubble (2.11).
