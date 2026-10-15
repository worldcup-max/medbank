# MedBank — rules for coding agents (OpenCode)

MedBank (medbank.com.ng) is a medical-study PWA for Nigerian MBBS and premedical students.
You are here for **routine work**: UI fixes, copy and typo fixes, small bugs, refactors, tests, docs.
Big features, 3D plates and anything touching the rules below go to Claude, not you.

## Hard rules
1. **Never run git or gh.** No commit, push, pull, checkout, stash, reset — nothing. Git on this machine leaves lock files that can't be deleted. Frank (or Claude, from the cloud) commits and pushes. Leave your changes as edited files and list them at the end.
2. **Never delete files.** If something should go, say so and let Frank delete it.
3. **The Smart Drill engine is FROZEN (see `FREEZE.md`).** Don't change `smartDiagnose`, `smartDrillPlan`, the `SMART` config, `adaptAdjust`, `adaptPick`, `smartState`, or `smartLog` and its event field names. You may restyle what `smartNextCard()` / `smartMasteryCard()` render, not their logic. If a fix seems to need an engine change, **stop and say so**.
4. **Don't touch** `explainer/library/` (plates built by scheduled tasks), `viz-training/`, `.github/`, or payment logic (`checkout.js`, `paywall.js`, `import-server/payments.mjs`) unless the task names them.
5. **Test accounts:** only ever test with Frank's designated test account (ask him which one if you need it). Never read, change or log data for Frank's main account or any real student's account.
6. **No secrets in code.** Don't print, copy or commit keys from `.env` or `config.js` beyond what is already public in the client.
7. **The tutor's core rule** (anything in `import-server/plate-tutor.mjs`, `explainer/plate-tutor.js`): the student's note drives the tutor. It explains only what the note says, in its terms, order and depth, and never adds concepts absent from the note. Don't weaken validation that enforces this.

## Every change to the app
- Bump `APP_VERSION` in `app.html` (search `const APP_VERSION=`) **and** the `CACHE` string in `sw.js` (`medbank-vNNN` → next number), with a one-line note of what changed at the front of the `sw.js` comment. The service worker is cache-first, so without this students keep the old files.
- Server-only changes (`import-server/`) don't need a version bump.

## Verify before you finish
- `app.html` is one big file (~8,000+ lines) with inline scripts. Extract its inline `<script>` blocks and run `node --check` on each; fix any syntax error.
- Run `node --check` on every `.js` / `.mjs` file you edited.
- Re-read the exact area you changed.
- If `import-server/` has a test for the area (`test-*.mjs`), run it.

## Where things live
- **Router:** `render()` in `app.html` — a `switch` on the URL hash.
- **Home:** `pageHome()`. **Q-bank player:** `pageMega()`, `qbQuestionHtml()`, `qbDoneHtml()`, `qbEndEarly()`, `qbScore()`.
- **Login gate:** `mbLoginGate()` at the bottom of `app.html`; `REQUIRE_LOGIN` in `config.js`.
- **Styles:** inline `<style>` blocks in `app.html` — search the class name.
- **Accounts/sync:** `config.js`, `auth-ui.js`, `sync.js` (don't touch unless the bug is there).
- **Server (Render):** `import-server/server.mjs` — import, AI, explainer, Paystack webhook. The AI calls use the Anthropic SDK pointed at DeepSeek.
- **3D Tutor:** `explainer/` (see `explainer/README.md`), `viz3d.js`, `models3d/`.
- **Admin tools:** `backend/`.

## Style
- Minimal, focused diffs. Match the surrounding code style; don't reformat files.
- Light theme: soft lavender background, white cards, violet accent.
- Mobile first — check the change makes sense at phone width.
- Finish with a short summary: what you changed, files touched, how you verified it.
