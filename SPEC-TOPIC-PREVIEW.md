# Topic Preview — the "pre-read orientation video" (build spec)

**Status:** implementation-ready spec, for review. **Build behind a default-off flag** (`FEATURES.TOPIC_PREVIEW`) so it's dormant for the live pilot until we choose to trial it.
**One-liner:** before a student reads a note, a 2–4 minute animated visual tour gives them the whole topic's shape — every heading, the key subtopics, the big comparisons — in simple words, so they read the detail with a mental map already in place.

Learning basis: this is an **advance organizer** (Ausubel) — a high-level scaffold delivered *before* detail. It reliably improves comprehension and retention, especially for dense clinical topics.

---

## 1. What it reuses (this is orchestration, NOT a new engine)
| Need | Existing piece |
|---|---|
| Text → animated visual "video" | `import-server/visualize.mjs` (manifest-driven blueprint; MODES: diagram, table, flow, graph, tree, unitcircle, ice…) + the fixed in-app renderer |
| Generate + cache a blueprint | `POST /visualize` → `visualizations` table (`text_key`, `blueprint`, `verified`) |
| Play a visual with narration | `aiVisualize(text, topicName, topicId)` + the TTS stack (`speakSeq`, cloud voices) + karaoke word-sync |
| Per-topic video surface | the `🎬 Videos` tab (`topicVizList` / `renderVizList`), storage in `DATA.viz[topicId]` |
| The note itself | `pageTopic()` → `topicTab==='note'` render (the preview card mounts at the TOP of this) |

**The genuinely new work is small and specific:** (1) a generation step that turns the *whole note* into an **ordered sequence of scenes** covering every heading, and (2) a **preview player** that chains those scenes into one continuous 2–4 min piece with a progress indicator. Everything else is existing infrastructure.

## 2. What the preview IS (content contract)
A `preview` is an ordered list of **scenes**. Each scene =
```
{ heading,                       // the note heading/subtopic this scene orients
  mode,                          // a visualize.mjs MODE (diagram|table|flow|graph|tree|…)
  blueprint,                     // the SAME blueprint shape the fixed renderer already draws
  narration,                    // 2–5 short sentences, plain words, spoken over the scene
  beat: 'overview'|'segment'|'contrast'  // overview = the map; segment = one heading; contrast = a differentiation
}
```
Rules the generator must follow (extends the existing `visSystem()` prompt):
- **Scene 1 is the map:** one overview scene (a labelled diagram or a categories/table view) that shows the whole topic at a glance — every top-level heading as a node/row.
- **Then one scene per heading**, diving into its key subtopics. Touch *every* heading in the note — none skipped.
- **Add `contrast` scenes where it helps** — "X vs Y", "conjugated vs unconjugated", "when to admit vs manage at home" — as tables or side-by-side diagrams (the engine already has a `table` comparison-matrix mode).
- **Prime, don't teach the detail.** Narration is simple, orienting, and short — "here's the shape of it," not the full explanation. Read-simple, exam-later.
- **Budget:** aim 8–12 scenes / ~2–4 min total narration. If the note is small, fewer scenes; never pad.
- **Faithful to the note.** No invented facts, drugs, or numbers — same discipline as the note build.

## 3. Generation — auto, in the background (D: chosen)
The import returns normally and fast. The preview builds **quietly afterward**, so it's usually ready by the time the student opens the note — but the student never waits on it.

**Trigger (client-orchestrated, no server job infra needed):**
1. On import success (and on first note-open if not yet built), the client fires `POST /topic-preview {topic_id}` **fire-and-forget** and marks the topic's preview `status:'building'`.
2. The server builds the scene sequence and stores it; the client polls (or re-checks on note open) until `status:'ready'`.
3. The note's preview card reflects state: `Preparing your preview…` → `▶ Watch a 3-min preview` (or a quiet hidden state if it fails — never a broken control).

(Server-side background/queue can replace the client trigger later; the client-fire keeps v1 reliable on the current stateless Render service.)

**Cost controls (this builds one per topic — keep it cheap):**
- Only build when the note has real substance (≥ ~400 chars / ≥ 2 headings); otherwise skip silently.
- Cache hard: store the finished preview on the topic; never rebuild unless forced.
- Use the **flash** model + `reasoning_effort:"none"` (the import-fix path). Prefer **one** generation call producing the ordered scene array; if the output is too large, batch by section (like `buildQbankBatched`) — reusing `extractJsonObject` + the json-mode/reject fallback so it can't fail the way imports did.
- Meter it (`bump_ai_usage` with `p_feature:"preview"`) so pilot spend is visible.

## 4. Server — `POST /topic-preview`
- Auth + ownership check (same pattern as `/build-extra`).
- Loads the topic's `note_md`; if too short → `{status:'skipped'}`.
- Prompt = the existing `visSystem()` VOCAB/MODES **plus** the §2 sequence rules (cover every heading, overview-first, simple orienting narration, 2–4 min budget).
- Output validated: array of scenes, each with a valid `mode` + a blueprint the renderer accepts (reuse the existing blueprint QC in `visualize.mjs`) + non-empty narration. Drop invalid scenes; if <2 survive → `failed`.
- Persist (see §5); return `{status, scenes}`.

## 5. Data model
Add a per-topic preview record. Either a `topics.preview` jsonb column or a `topic_previews` table:
```
topic_previews( topic_id pk, account_id, status, scenes jsonb, model, built_at )
```
Client mirror in `DATA` (like `DATA.viz`): `DATA.preview[topicId] = { status, scenes, ts }`, synced via `profile_state` like everything else. (Follow the `mergeQbankStore` lesson — if it syncs, make sure the merge carries it.)

## 6. App — the preview surface + player
**The card (top of the note tab).** At the very top of `topicTab==='note'`, before the note HTML:
```
┌───────────────────────────────────────────────┐
│ 🎬  Get the picture first · 3-min preview       │
│ A quick visual tour of Bronchiolitis before you │
│ read.                          [ ▶ Watch ]      │
└───────────────────────────────────────────────┘
```
States: `building` → "Preparing your preview…" (spinner); `ready` → Watch button; `skipped/failed` → card hidden (note reads normally). Dismissible ("Skip preview") and remembered per topic.

**The player.** A lightweight sequencer over the existing renderer: play scene *i*'s blueprint (existing draw) with its narration (existing TTS + karaoke); on scene end, auto-advance; show `Scene 3 / 10` + a scrubber + prev/next + a "Start reading →" button that closes the player and drops them into the note. Reuses `aiVisualize`'s draw/TTS internals — the new part is only the chaining + progress chrome.

## 7. Telemetry (additive, syncs via profile_state)
`preview_generated {topic_id, scenes, model, ms}` · `preview_shown {topic_id}` · `preview_started` · `preview_scene {i}` · `preview_completed {watched_scenes, of}` · `preview_skipped {at:'card'|'mid', scene}`.

## 8. Success metric (why it earns its cost)
Primary: does watching the preview **before** first reading a topic improve later performance on that topic (first Q-bank/recall accuracy, time-to-first-correct) vs. not watching? Bucket per student→topic (like the V1.6 A/B) so we can measure lift, not just usage. Secondary: watch-start rate, completion rate, skip point.

## 9. Edge cases
- Thin/near-empty note → skip (no card). · Generation fails → hide the card, note reads normally, log `failed`. · Offline → card shows "preview unavailable offline"; play if already cached. · A heading with no diagrammatic form → the engine's `tree`/`table` last-resort modes (already handled by `visSystem()`). · Re-import/rebuild of a topic → invalidate + rebuild the preview.

## 10. Flag & rollout
`CFG.FEATURES.TOPIC_PREVIEW` (default **false**). Independent of the V1.6 flags. When on: background build + the card appear. Trial on the test account first, then a small cohort, watching the §8 metric and the per-topic cost.

## 11. NOT in v1
- No editing/reordering scenes by the student. · No real exported mp4 (it's the in-app animated player, same as today's videos). · No voice/character selection beyond the existing TTS settings. · No per-scene regeneration UI (rebuild is whole-preview).

## 12. Open decisions for Frank
1. **Generation shape:** one call for the whole scene array (cheaper/faster, needs the robust-parse net) vs. batched per-section (more reliable, ~2–4× the calls). Recommend: try one-call first, fall back to batched.
2. **Placement of the trigger:** fire the background build at *import success* (builds for every imported topic) vs. at *first note-open* (builds only for topics actually opened — cheaper, but the first opener waits in `building`). Recommend: first note-open, so we only pay for topics students actually read.
3. **Length target:** 2–3 min (tighter, higher completion) vs. up to 4 (fuller coverage). Recommend: target 3, cap 4.

---

## BUILD STATUS — 2026-08-22 (increment 1, feature-flagged: CFG.FEATURES.TOPIC_PREVIEW, default OFF)
**Server (`import-server/server.mjs`):** `POST /topic-preview {topic_id}` — auth + ownership, skips notes < ~400 chars, else `buildTopicPreview()`: one **plan** call (`previewPlanPrompt`) turns the whole note into an ordered scene list (map → per-heading segments → contrast tables → takeaway, orientation framing, simpler-than-note wording), then each scene is rendered through the **existing proven path** (`buildVisualPrompt`→`generate`→`parseBlueprint`→`qcCheck`, lean 1-gen+1-retry, `reasoning_effort:"none"`), invalid scenes dropped, needs ≥3. Result cached to `topics.preview` (jsonb) + returned. Flash model.
**App (`app.html`):** always-present **YouTube-style poster card** at the top of the note tab (`topicPreviewCard`) with `building` (spinner) / `ready` (play) states; **first-note-open background trigger** (`ensureTopicPreview` → fires `/topic-preview`, caches in an in-memory `_PREVIEW` map — kept OUT of DATA so blueprints never bloat the synced blob — and re-renders when ready); a **sequenced player** added *inside* the Visualize IIFE (`MB_playPreview` + `PV` state) that plays each scene's blueprint through the real renderer and **auto-advances** on scene-end (via a `PV`-aware branch in `playStep`), with a bottom bar: ◀ / ▶ / "Start reading →". Telemetry: `preview_generated / shown / started / scene / completed / skipped` via `smartLog` (syncs through profile_state).

**DB requirement:** add a `preview jsonb` column to `topics` (like `extras`). Without it the feature still works, but the server can't cache — it rebuilds the preview on each open (cost + latency). Also confirm `bump_ai_usage` accepts `p_feature:'preview'` (best-effort; won't crash if not).

**Verified:** config.js + import-server/server.mjs + app.html all parse; all 5 regression harnesses pass; frozen engine untouched.
**Remaining (needs a live/deploy pass — could not runtime-verify this session):** visual polish of the poster + player bar (possible overlap with the modal's own controls); generation quality tuning of the plan/scene prompts on real notes; confirm scene auto-advance timing feels like a continuous video; the A/B lift measurement panel (post-pilot).
**To trial:** commit + deploy (app.html, config.js, import-server/server.mjs), add the `topics.preview` column, set `TOPIC_PREVIEW: true`, open a built topic's note.
