# MedBank Q-bank — V1 Validation Checklist (v194)

**Purpose:** prove the *experience and question quality* are as good as the architecture — **before** any V1.5 work. The schema is right; the open risk is whether generated questions are genuinely good and whether the four cognitive levels behave differently rather than cosmetically.

Gate: **do not start V1.5 until the "Question-quality audit" below passes.**

---

## 0. Deploy

- [ ] Push the front-end to `main` (GitHub Pages).
- [ ] **Redeploy `import-server` on Render** — `server.mjs` changed (level behaviours + `trap_type`/`trap_explanation`). Front-end push alone is not enough.
- [ ] Hard-reload the app (Ctrl+Shift+R) so the service worker isn't serving a stale bundle. Confirm `sw.js` shows `medbank-v194`.

## 1. Test data — make it realistic

- [ ] Build **2–3 fresh topics from different courses** (e.g. Paediatrics · Neonatal Sepsis, Obstetrics · Pre-eclampsia, Medicine · Acute kidney injury). Cross-course is needed to test Mega selection + balancing.
- [ ] Make the pools **decent-sized** (aim ≥10–12 questions/topic). Judging Mega on 5–10 total questions hides bad distributions and weak generation.
- [ ] Intentionally create an **uneven pool** (one topic much larger than another) to test the 10/10 balancing.

---

## 2. Question-quality audit — THE important one

For ~5 questions per level, score each against the rubric. This is where a beautiful UI with mediocre questions gets caught.

### Level-differentiation rubric

| Level | Must require the student to… | ✅ Good question | ❌ Cosmetic / fail |
|---|---|---|---|
| 🔵 **Interpretation** | Read & interpret raw data (labs/ABG/ECG/imaging/vitals) | Gives an ABG/blood film/ECG and asks what it *means* | A recall MCQ with no data to interpret; just "easy" |
| 🟠 **Clinical reasoning** | Connect several findings → one clinical conclusion | History+exam+one result must be integrated to name what's happening / next consideration | A single-clue question a keyword could answer |
| 🔴 **Complex reasoning** | Integrate multiple facts, prioritise, decide in sequence | Evolving vignette (initial step done/failed, patient deteriorates); priority ≠ the obvious problem | A long stem that's still one-step reasoning ("long ≠ complex") |
| 🟣 **Exam trap** | Avoid a specific, recognisable reasoning error | Genuinely plausible distractor; tests dx-vs-next-step, stabilise-vs-definitive, most-likely-vs-most-dangerous, etc. | A "random tricky" question with no identifiable trap type |

### Per-question checks

- [ ] **Diagnosis is NOT named in the stem** (student must infer it). If the disease name appears, fail.
- [ ] **Options are homogeneous** (all "next investigation", or all "organism", etc. — never mixed categories).
- [ ] **A rationale for every option**, and each wrong one says *why* + what scenario would make it right.
- [ ] **`cognitive_level` matches the actual thinking required** (use the rubric — this is the crux).
- [ ] **`skill` is correct** (diagnosis / investigation / management / complications / differential / next_step).
- [ ] **`trap_type` + `trap_explanation`** are populated where a trap exists (not only on exam-trap items); `none` only when there's genuinely no trap.
- [ ] **Difficulty comes from reasoning/distractors, not stem padding.**
- [ ] Values (drugs, numbers) are faithful to the note; nothing invented.

**Pass bar:** for each level, ≥4/5 questions are *correctly categorised* and clear the per-question checks. If Interpretation/Clinical/Complex/Trap don't feel meaningfully different, the fix is **prompt-tuning**, not more features.

---

## 3. Topic Q-bank — flow checklist

- [ ] Tutor + **🔵 Interpretation** filter → runs, questions fit the level.
- [ ] Tutor + **🔴 Complex reasoning** filter → runs, questions fit the level.
- [ ] Test + **🟣 Exam trap** filter → runs.
- [ ] Filter by **Management** → only management questions.
- [ ] Filter by **Next best step** → only next-step questions.
- [ ] Answer one **incorrectly** → rationale for every option shows; exam-trap callout appears where relevant.
- [ ] **Show in note** jumps to the right note section.
- [ ] **Reasoning profile** card appears in the dashboard and looks right.
- [ ] **Before answering, the question does NOT reveal its skill/level/subtopic.** Revealed only after.
- [ ] Mastery grid columns are the 4 cognitive levels; tap a cell drills correctly (whole-topic and this-level).

## 4. Mega Q-bank — flow checklist

**Quick Exam**
- [ ] One click → 20 · Mixed · Blind · Timed runs.
- [ ] At the end: **course breakdown**, **cognitive-level breakdown**, **skill breakdown** all render.

**Customized**
- [ ] Select **Paediatrics + a second course**, Mixed, 🔴 Complex reasoning → session pulls only complex-reasoning questions across both.
- [ ] **Focused** → draws from selected topics; topic still hidden until answered.
- [ ] **Blind** → **no topic/skill/level leakage before answering**; topic revealed only after.

**Balancing (point 8)**
- [ ] With an uneven pool (e.g. ~100 vs ~15), a 20-question Mixed/Blind set is roughly **10/10**, not dominated by the big topic.

**Weakness focus (point 13)**
- [ ] After enough attempts, "🔥 Your weak areas" appears; **Drill my weaknesses** builds a targeted session.

---

## 5. Reordered V1.5 (only after the above passes)

- **V1.5A — Question quality + analytics validation** (this document). FIRST.
- **V1.5B — Weakness engine.** Use existing data: "you're weak at management" → auto-build a session from existing questions.
- **V1.5C — Confidence rating.** Guess / Unsure / Confident / Very confident → distinguish *wrong+unsure* (knowledge gap) from *wrong+confident* (misconception).
- **V1.5D — Adaptive difficulty.** Only once there's enough reliable performance data.

**North star:** Mega eventually stops asking "what do you want to practice?" and starts saying "🎯 you should practice this" — an auto-built Recommended Drill from the student's own weakness profile. That's when it feels like a tutor, not a toolbox.
