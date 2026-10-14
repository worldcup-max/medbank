CONTINUE: MedBank physiology plate library (handoff from previous chat, 14 Oct 2026)

WHO / WHAT
I'm Frank, a 500L Nigerian medical student who builds MedBank (medbank.com.ng), a study PWA for Nigerian MBBS students.
Repo on my Windows laptop: C:\Users\domin\OneDrive\Documents\GitHub\medbank (GitHub: worldcup-max/medbank), working branch: 3d-tutor.
Rules: never run git on my machine (it leaves undeletable lock files). I commit, push and deploy myself. Never touch frankthewiz1@gmail.com's data in MedBank; test with frankthejay@gmail.com.

THE GOAL
Build a library of hand-quality, interactive, model-driven explainer "plates" (Four-Chamber Heart standard) for the top topics of every MBBS course, one course at a time, starting with PHYSIOLOGY (Guyton & Hall, 15th ed, 2025).
Each plate: a numerical model is the single source of truth (createModel), an original detailed SVG drawing driven by it every frame (createScene), a live ledger + chart, a phase-by-phase tutor with a recorded VOICE (Kokoro, bf_emma, baked into the page as mp3 per sentence, so $0 per student).
Students open a library plate instantly; only the narration is personalised to their note later (DeepSeek Flash, fractions of a cent). Topics not in the library fall back to the auto-builder.

THE CORE RULE: THE STUDENT'S NOTE DRIVES THE TUTOR
- Scheduled tasks build only the PLATE (model, drawing, controls, a default narration). They never decide what a student is taught.
- DeepSeek writes the tutor from the student's own note, every time: it explains what the note says, in the note's terms, order and depth. It must NOT teach concepts of the topic that are not in the note.
- So every plate must ship a manifest.json: its phases, parts (ids + names), readouts and what each one shows. DeepSeek maps the note onto the manifest and picks only the phases/parts the note covers. Parts the note doesn't mention are dimmed and stay silent (tappable). Content in the note that the plate can't show is explained in words and the topic is flagged for extension.
- Validation before showing: every step's phase/focus must exist in the manifest; narration that drifts from the note's content is rejected and regenerated.
- Voice for the personalised narration: the app's TTS (Kokoro free / Fish paid) via postMessage mbx-speak. The recorded voice baked into each plate is only the fallback when there's no note.
- Per-student cost: about $0.001 (DeepSeek Flash) + TTS. The plate is built once and shared by everyone.

WHAT WE LEARNED (DON'T REPEAT)
- DeepSeek (explainer/studio/build.mjs pipeline) gets the science right but draws badly, even with checks and fix rounds. Don't use it to draw plates.
- I compared Opus vs Sonnet on the same brief (nephron). OPUS WON: more faithful anatomy and a "cell wall here" transporter inset per segment. Sonnet is prettier but anatomically wrong in places. Build library plates with Opus (Sonnet only for rare topics).
- One Opus plate costs about 20 min and about 230k tokens. Wave 1 (49 left) is about 16 hours of build time.
- Model must be real: no timers (t % 60), no sin(t) wobble. For paths through organs use kind "journey" (follow one parcel; sample() returns parcel {part,u}; scene returns paths {partId: pts}; the runtime moves the parcel). Proportions in %.

FILES (all in the repo)
- explainer\library\COURSES.md: course line-up and textbooks (Physiology → Biochemistry → Anatomy → Pharmacology → Histopath → Chempath → Haematology → Microbiology → Community Med → clinical).
- explainer\library\physiology.json: THE BUILD QUEUE. 363 topics, 85 chapters. Each has id, title, kind, priority, status (todo/building/built/reviewed/published). "plan.wave1" = the 51 to build first, in order. cardiac-cycle-wiggers and nephron-urine-journey are already "built".
- explainer\library\physiology-topics.md: human-readable list.
- explainer\studio\: the engine. kit.js (drawing kit, window.K), shell.mjs (page runtime: ledger, chart, tutor, voice, parcel tracer), qa.mjs (checks), prompts.mjs (contracts + craft rules), build.mjs/llm.mjs (DeepSeek auto-builder), fixtures\cardiac.* (heart exemplar).
- explainer\studio\plate-kit\: how to build a library plate. README.md (setup), BRIEF-nephron-example.md (the exact brief that produced the winning plate), assemble.mjs (build + all checks + screenshots), voice.py (Kokoro voice), final.mjs (final voiced page), nephron-note.md.
- explainer\studio\out\nephron-compare\: the Opus and Sonnet nephron plates (nephron-opus.html, nephron-sonnet.html) + their sources (src-opus\, src-sonnet\).

HOW TO BUILD ONE PLATE (the recipe)
1. Copy explainer\studio\{kit.js,shell.mjs,qa.mjs,prompts.mjs,llm.mjs,fixtures} + plate-kit\{assemble.mjs,final.mjs,voice.py} into a cloud work folder "tools/". Set up Kokoro per plate-kit\README.md.
2. Write a brief for the topic (copy BRIEF-nephron-example.md and swap the topic and note; use Guyton-level facts and real numbers).
3. Opus writes <topic>/plan.json, model.js, scene.js, lesson.json (6–8 spoken steps written for the ear). Loop: node tools/assemble.mjs <topic>, then look at shot.png/stage-*.png, fix, until 0 issues and it truly looks excellent (at most about 8 rounds).
4. python3 tools/voice.py <topic> bf_emma, then node tools/final.mjs <topic> <topic>.html.
5. Write the plate into the repo at explainer\library\physiology\<topic-id>\ (sources + html) and set its status to "built" in physiology.json.

WHAT I WANT NEXT
1. Set up ONE recurring scheduled task (fresh session each run, which saves tokens) that reads explainer\library\physiology.json, takes the next 2 "todo" topics in wave1 order, builds them to the Opus standard with the recipe above, saves them into the repo, marks them "built" and stops. The next run continues from there. Suggested cadence: every 4–6 hours. It must run with my computer connected (needs the medbank folder). No git.
2. Before that: polish the Opus nephron plate (busy cortex, a couple of labels over tubes), port the Four-Chamber Heart into the library format, and save both as the first two library plates.
3. Later: wire the library into the app (3D Tutor tab opens a library plate when the topic matches; narration personalised; voice via postMessage mbx-speak or the baked audio), build-once-per-topic caching on the server, then repeat for Biochemistry.

OTHER CONTEXT
- MedBank app: single-file app.html PWA, Supabase, import-server on Render (DeepSeek V4), sw.js cache-first (bump CACHE on deploy). Go-live steps still pending from the SN2 3D Tutor work: run import-server\sql\explainers.sql, merge 3d-tutor, redeploy the import server, bump sw.js.
- My DeepSeek API key was pasted in an earlier chat; I should rotate it.
- On Windows PowerShell use npm.cmd (script execution is blocked); playwright is installed in explainer\node_modules.

STUDENT LEARNING EXPERIENCE (3D Tutor chat, 14 Oct 2026) — feature 1 built: note-to-plate linking
- App side: explainer/plate-tutor.js (MBPlate.mount). Phone: plate on top, the note in a bottom sheet (current line + caption + controls; pull up for the whole note). Laptop: note rail on the right. The plate keeps ALL its own content (lenses, legend, ledger, live numbers, chart).
- In the plate: explainer/studio/tutor-link.js is injected into the same-origin plate iframe. It needs no shell change, but it RELIES ON these plate bits — keep them: window.__studio.ready/seek/openLens/closeLens, the global createModel, K.parts(), #stage, #play (aria-pressed = playing), #speed buttons with data-s, #tutor, and the runStudio(createScene, {lesson}) call.
- Server: POST /explainer/plate {plate, text, topic} → import-server/plate-tutor.mjs (splitNote, prompt, checks). Stops cite note lines L1…Ln; every phase/part/lens id is checked against manifest.json, numbers must come from the cited lines, un-noted concepts and drift are rejected, a lens opens only when the note covers at least half its concepts. Cached in explainers (template 'plate').
- Try it without the app: explainer/studio/samples/plate-tutor-demo.html (rebuild with node explainer/studio/plate-kit/demo.mjs). Fixture lesson: samples/nephron-note.tutor.json.
- Feature 2 built: three lengths. A start card ("How long have you got?") offers Continue, 2-minute overview, Full walk-through and Exam revision. The same DeepSeek call now also returns overview [{stop, say}] and exam [{stop, q, options[3], answer, why}] (PLATE_TUTOR_VERSION p2), checked like the stops. A wrong exam answer replays that stop. Progress per topic lives in DATA.tutor[topicId] (synced; the tab shows "· 4/10" or "· ✓").
- Feature 3 built: prediction pauses (shows.json predictions; the student taps a part), what-ifs (createModel(params) + model whatifs; shell window.__studio.setParams re-runs the plate; offered at the stop whose note line mentions them and as switches), and plate questions at the end of the full walk-through (tap a part / move the parcel to a phase; DeepSeek "end", version p3). Predictions and what-ifs are attached by the server from the manifest, only where the note covers them. plate-kit/relink.mjs refreshes built plates (runtime, CSS, model) without re-voicing.
- Feature 4 built: after the full walk-through or exam revision, the lesson's note-based exam questions become review cards (DATA.plateCards[topicId], merged by sync.js and folded into t.recall by mergeVizCards). New cards are due tomorrow; a missed one is due today. In the review, a plate card shows "Watch the 30-second replay first"; after answering, the replay opens anyway. MBPlate.replay mounts the plate in mini mode (tutor-link.js hides the ledger and lens bar) at the card's phase and focus.
- Feature 5 built (data-light): the tutor and review replay load <id>.lite.html, the plate without its baked voice (1 MB → about 40 KB gzipped; plate-kit/lite.mjs, also written by relink.mjs). When a student first picks a length, the lesson is saved for offline on any connection: plate files in Cache Storage mb-keep-plates, every line the tutor can say (api.voiceTexts(), about 50) in the MedBank voice in mb-keep-voice, the lesson in localStorage mbp-les:<plate>|<topic> (reused for 7 days for the same note, so reopening costs no request). The start card shows "Saving for offline… n of N", then "✓ Saved for offline", with a toast once. sw.js never purges mb-keep-*. serverSpeak checks the saved clips before the network and before sign-in. Lite mode in tutor-link.js (30 fps, no SVG glow) for Data Saver, ≤3 GB memory, ≤4 cores or under about 45 fps; localStorage mbp-lite on/off overrides. The MedBank voice is always used (Frank's choice). Note: /tts has no server cache, so saving a lesson generates all its lines once (about 52 clips). Laptop fix: the bottom sheet now sits under the tutor's column when the sidebar or Ask panel narrows it.
- Voice clip store (server.mjs _ttsRaw): every /tts clip is kept in a private Supabase Storage bucket "tts-cache" (created on first use), keyed by provider + voice + the exact spoken text, so each line is paid for once ever. /health shows store hits, misses, puts and errors. TTS_STORE=0 turns it off. The 3D Tutor tab hides the Study Dock (Ask panel and Ask AI tab) so the tutor gets the full width.
