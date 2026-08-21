# Paste this into a new Cowork chat (UI-fix / debugging chat)

> I'm working on **MedBank**, a single-file medical-study PWA. Connect my **medbank** folder.
> **This chat is for UI fixes and bug debugging ONLY.** A separate chat handles the engine and version planning.

## Hard rules
1. **The engine is FROZEN (v203). Do NOT modify it.** Off-limits: the diagnosis logic (`smartDiagnose`), routing/weights (`smartDrillPlan`, the `SMART` config object), adaptive difficulty (`adaptAdjust`, `adaptPick`), mastery (`smartState`), and the **telemetry event schema** (`smartLog` and the event field names). A live pilot is collecting data — changing any of these corrupts the dataset. If a fix seems to need an engine change, **STOP and tell me** instead of doing it.
2. **UI / cosmetic / bug fixes are welcome:** layout, copy, typos, colors, spacing, and clearly broken interface behavior.
3. **Version every change:** bump `APP_VERSION` in `app.html` AND the `CACHE` string in `sw.js` (e.g. `medbank-v209` → `v210`) so the PWA updates for users.
4. **Verify before finishing:** `app.html` is one big HTML file. Parse-check by extracting its inline `<script>` blocks and running `node --check` on them; confirm no syntax errors. Double-check the specific area you changed.
5. Keep replies concise; show me the file with the file viewer when done. Ask for a screenshot if it's a visual bug you can't diagnose from the code.

## Where things live in `app.html` (~8,000 lines)
- **Router:** `function render()` — a `switch` on the URL hash; each route calls a page function.
- **Home:** `pageHome()`. **Mega Q-bank (question player):** `pageMega()`, `qbQuestionHtml()` (question screen), `qbDoneHtml()` (results). The "End & grade" button lives here (`qbEndEarly()`, `qbScore()`).
- **"What should I work on?" card:** `smartNextCard()`. **Mastery card:** `smartMasteryCard()`. ⚠️ These *render* UI but *read* the frozen engine — you may restyle their output, not change the logic.
- **Login gate:** `mbLoginGate()` at the very bottom of `app.html`; toggled by `REQUIRE_LOGIN` in `config.js`.
- **Styles:** inline `<style>` blocks in `app.html` — search a class name to find its CSS.
- **Accounts/sync (don't touch unless the bug is there):** `config.js`, `auth-ui.js`, `sync.js`.
- **Admin tooling (separate from the app):** the `backend/` folder — `admin-dashboard.html`, `admin-access.sql`, `ADMIN-SETUP.md`.

## Workflow for a reported bug
Locate the page/function by name above → read it → make the **minimal** UI fix → bump `APP_VERSION` + `sw.js` `CACHE` → parse-check → show me the file. If it touches the engine or telemetry, stop and flag it.
