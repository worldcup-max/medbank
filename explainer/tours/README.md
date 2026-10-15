# Guided-tour plates

A guided-tour plate shows one topic as a set of stops, like `explainer/library/obstetrics/placenta-praevia/`. A topic can be a mechanism, a disease with its management and drugs, a procedure, or a timeline. For each stop the plate:
- zooms the stage to that moment;
- opens a lens (a close-up) joined to the spot by a cone;
- shows rich notes beside it: the lead, sections, dose cards, tables, checklists, "what students mix up" and "check yourself".

In the app, the 3D Tutor drives the plate from the student's own note, exactly as it drives the physiology plates.

## Files in a plate folder

| file | what it is |
|---|---|
| `meta.json` | id, course, title, titleEm, fig, sub, foot (sources), cases, caseLabel, stage {viewBox, aria}, lens {viewBox}, strip {viewBox, aria, min, max, now} or null, nowDefault, concepts, not_shown |
| `palette.css` | the topic's colours: a `:root { … }` block, a dark block under `@media (prefers-color-scheme: dark) { :root:not([data-theme="light"]) { … } }`, and the same again under `:root[data-theme="dark"]` |
| `tour.js` | the topic script (contract below) |

To build, run `node explainer/tours/build-tour.mjs <folder> [--shots]`. It assembles `<id>.html` and `<id>.lite.html` from `tour.css`, `tour-kit.js` and the topic. It then checks the page in a real browser at laptop and phone size and writes `manifest.json`. A plate ships only on **TOUR OK**.

## The page the script gets

`build-tour.mjs` builds these elements. Use them by id:
- `#stops`: the nav, filled by the script with group labels and stop buttons.
- `#stage`: the main SVG.
- `#cone`
- `#lensBox`, `#lensKicker`, `#lensTitle`, `#lens`: the close-up SVG.
- `#play`
- `#cases`: buttons with `data-case`, one per `meta.cases`.
- `#strip`: the timeline SVG, only if `meta.strip` is set.
- `#prev`, `#count`, `#next`
- `#kicker`, `#title`
- `#nowWeek`, `#nowState`: the "now" line.
- `#body`: the stop's notes.

Classes in `tour.css`:
- **Lens position:** `.lens.tr|br|tl|bl`
- **Notes:** `.lead`, `h3`, `.confuse` (what students mix up), `table.cmp` inside `.tablewrap`, `.dose` with `.big` and `.row`, `.ladder`/`.step`, `ul.checks`, `.opts`, `.seg`, `.pill.ok|mid|bad`, `.live`, `details/summary`
- **SVG text:** `.lt`, `.lh`, `.lm`, `.ls`, `.lb`, `.halo`, `.lab`, `.tag`

## The script's contract

Every script must do all of the following:

1. **Stay self-contained.** `"use strict"`, no imports, no network, no `alert`. Helpers are its own; `TK` from tour-kit.js is the only global it may rely on. Never declare a global named `TK` or `K`.
2. **Draw a detailed stage** with real anatomy in SVG. Use layers (back to front), gradients from the palette, and labels with the `.lab halo` classes. The stage must change with the stop, the timeline and the case.
3. **Register at least 6 named parts** with `TK.part(id, ...elements)`, for example `TK.part("placenta", placentaPath)`. These are what the tutor spotlights, dims and asks students to tap. Give each a `PARTS_INFO` entry `{id, name, shows}`, where `shows` is one sentence on what it shows.
4. **List 8–12 stops in `STOPS`**, in teaching order. Each stop is `{grp, chip, kicker, title, parts: [part ids], lens, lensKicker, lensTitle, cam: [cx, cy, width], corner, focus: (R) => [x, y, r], html: () => "...", q: [question, answer]}`, plus whatever state the stage needs (time, case, mode):
   - **`grp`:** the group label shown before the stop. Examples: "The idea", "Management", "Delivery".
   - **`title`:** unique. The tutor matches note lines to it.
   - **`html`:** starts with `<p class="lead">` (the one-sentence point), then `<h3>` sections.
   - **A clinical topic covers everything a final-year exam asks:** definition, causes or risk factors, mechanism, presentation, diagnosis, management (acute and long-term), drugs with real doses, routes and contraindications, and complications.
   - **Every stop has a `.confuse` box** ("What students mix up") and a check-yourself question.
5. **Give every stop a lens.** A lens is `(g) => (S) => void`: draw into `g` once, then update every frame. A lens is a close-up from a new angle: the cell, the scan, the drug tray, the pathway, the decision ladder.
6. **Run one frame loop** with `requestAnimationFrame`:
   - Move the camera toward the stop's `cam`.
   - Draw the cone from the focus ring to the lens box.
   - Update the stage, the lens and the "now" line.
   - Respect `prefers-reduced-motion`.
7. **Provide the stop and playback controls:**
   - `goStop(k)` updates `#stops` (`aria-current`), `#count`, `#kicker`, `#title` and `#body`, and builds the stop's lens.
   - `setPlaying(bool)` drives `#play`.
   - `ST.playing` and `ST.stop` hold the current state.
   - Keyboard: ← → for stops, Space for play/pause.
8. **End with exactly this call:**

   ```js
   TK.connect({ meta: TOUR_META, parts: PARTS_INFO, stops: STOPS, goStop: (k) => goStop(k), setPlaying, isPlaying: () => ST.playing, current: () => ST.stop });
   ```

   `TOUR_META` is `{ id, title }`.

Doses are teaching values. Name the guideline in `meta.foot` (for example RCOG, NICE, WHO, BNF), and write doses exactly as that guideline gives them.
