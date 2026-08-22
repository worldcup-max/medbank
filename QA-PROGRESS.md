# QA Progress — code-review bug hunt (one flow per scheduled run)

Each scheduled run: pick the FIRST unchecked flow below, review ONLY that flow's code for bugs/mistakes,
log findings + any conservative fix to `QA-BUGS.md`, then check the box here. Do not do more than one per run.
`[ ]` = not done · `[x]` = reviewed. When all are checked, the run has nothing to do — stop.

## Student study flows (code review)
- [x] 1. Onboarding / first-run — welcome → pick level → pick courses → account created (`auth-ui.js`) — 11 findings (ONB-01..11). Biggest: email-verify link never runs `afterAuth`, so verified users land half-onboarded (likely root cause of BUG-01/FRICTION-02); plus two duplicate-`level_profile` paths. 6 LOW fixes applied, 4 logged for review.
- [ ] 2. Add lecture / Import UI — course/lecturer/title validation, each source (File/YouTube/Paste/Record), createCourse (`import-tab.js`)
- [ ] 3. Import server build — `/import` handler, `validateObj`, `generate`, retry path (`import-server/server.mjs`)
- [ ] 4. Q-bank generation — `buildExtra('qbank')`, `validateQbankItems` (`import-server/server.mjs`)
- [ ] 5. Podcast generation — `/podcast`, `/podcast-audio`, TTS paths (Fish/OpenAI/Kokoro) (`import-server/server.mjs`)
- [ ] 6. Visualize feature — `/visualize`, viz rendering + the client viz modal (`import-server/server.mjs`, `app.html` viz code)
- [ ] 7. Visualize voice-playback DELAY — the audio pre-gen / "tap to watch" gating in `app.html` (code review only; runtime timing needs live test — FLAG IT)
- [ ] 8. Home / today's session — `startToday`, session build, hero CTAs (`app.html`)
- [ ] 9. Active recall / review — card flow, SRS rating, `rateSRS`, `LADDER` (`app.html`)
- [ ] 10. Mega Q-bank — config (exposures/modes/sizes), `mgStart`, question render, End & grade (`app.html`; DO NOT touch the frozen engine)
- [ ] 11. Mock exam — `startExam`, nav, submit, results, drill-missed (`app.html`)
- [ ] 12. Solve — photo/text → `/solve` (`app.html`, `import-server/server.mjs`)
- [ ] 13. Topic page — open topic, its Q-bank/notes/cards/podcast/visualize entry points (`app.html`)
- [ ] 14. Cards library / Note builder / Lecturers / Folders (`app.html`)
- [ ] 15. Progress + This week (weekly report, new-card scheduling) (`app.html`)
- [ ] 16. Settings — backup/restore (export/import/copy/paste), reminders, TTS (`app.html`)
- [ ] 17. Auth / sync — login, logout, level switcher, cross-account isolation (`auth-ui.js`, `sync.js`)
- [ ] 18. Streak / freezes + paywall/entitlement gating (`app.html`, `import-server/server.mjs isPremium`)

## Runtime-only (need YOU present + live app — task can only code-review, not run)
- Podcast audio actually playing, Visualize animation + voice-sync delay, real import→qbank end-to-end. Flag these for a live session.
