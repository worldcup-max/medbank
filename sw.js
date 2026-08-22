/* MedBank service worker — offline caching + best-effort daily reminder */
const CACHE = 'medbank-v212';   // v212: SYNC DATA-LOSS FIX — logging in no longer adopts an EMPTY cloud copy over real local progress. On the same level-profile, if the cloud is empty but the device has data, sync now MERGES (keeps local) and pushes up instead of blind-adopting. Genuine level-switches and normal cloud adopts still work. This is the bug behind "logged in and my data vanished." Makes the REQUIRE_LOGIN pilot safe to ship. (sync.js only; Smart Drill engine still frozen at v203.) Verified: 12 sync-merge checks pass.
// v211: import UI - (a) a non-PDF/non-image attachment (e.g. .pptx) passed the "pick a file" check but was dropped from the request, so the server built from nothing and returned "model returned invalid JSON"; unsupported types are now rejected up front with a Save-as-PDF hint, PDFs detect by MIME as well as name, and an empty import is never sent. (b) Courses could only ever be created during signup (saveOnboarding), so a student with no course could never build a lecture and had nowhere to add one - the Course dropdown now has "+ Add a course" with an inline name field, mirroring the lecturer flow. Engine still frozen at v203.
// v208: PILOT TELEMETRY TRANSPORT — additive, engine still frozen at v203. smartLog now ALSO mirrors its four events (smart_drill_started/completed, reco_accept, reco_agree) to a Supabase table, tagged with an anonymous random device id (no PII). Fully inert until MB_SUPABASE_URL/ANON are pasted in app.html — behaves exactly as v207 otherwise. Offline-safe queue with retry. Ships with backend/ (SQL schema + RLS insert-only, SETUP-BACKEND.md, and a secret-free pilot-dashboard.html for the cohort view). Verified: 85 checks (80 prior + 5 transport safety) + app/dashboard parse clean.
// v207: Mega Q-bank 'End & grade' — you can now leave a Test OR Tutor session early and be graded on ONLY the questions you answered (score not diluted by skipped ones). Adds qbEndEarly() + a confirm, qbScore() grades over the answered subset, results screen notes 'Ended early — graded on N answered', review hides never-reached questions, and the partial session is still finalised/logged (planned vs completed) so the pilot funnel stays accurate. Engine behaviour otherwise frozen. Verified: 80 checks (21 engine + 9 adaptive + 16 behavioral + 26 telemetry + 8 partial-grading).
// v206: instrumentation schema aligned to spec (engine still FROZEN at v203). (1) sessions now carry session_type (smart_drill/quick_exam/custom/topic/adaptive/concept_retest). (2) paired smart_drill_started + smart_drill_completed events with minimal metadata (ts, sid, planned, completed, correct, dimension, reason, mode) → enables starts/completions/completion-rate/questions-per-session and Smart-Drill-vs-Quick-Exam usage. (3) recommendation feedback records the recommendation AS SHOWN — rec_id, dimension, dimension_type, diagnosis, accuracy, confidence, reason — alongside the binary 👍/👎 response, so a 'yes' stays meaningful if the engine later changes. Pilot readout (#/intel) shows completion rate + slices by diagnosis and dimension + preserved disagreements. Verified: 72 checks (21 engine + 9 adaptive + 16 behavioral + 26 telemetry/snapshot/pilot).
// v205: PILOT BUILD — dev-only validation readout added at route #/intel (NOT in student nav; student experience byte-for-byte unchanged, engine still frozen at v203 behaviour). Readout shows the funnel (Smart Drills started, recommendations accepted, agreement %), agreement sliced BY DIAGNOSIS (gap/misconception/fragile) and BY DIMENSION, concept-retest recovery + targeted-improvement, and a preserved DISAGREEMENT log (what MedBank thought vs what the student rejected). Interpretation line gated until ≥30 responses. 'Copy pilot data (JSON)' export for cross-device cohort aggregation. Verified: 66 checks pass (21 engine + 9 adaptive + 16 behavioral + 20 archetype/telemetry/pilot).
// v204: VALIDATION INSTRUMENTATION ONLY — engine behaviour is unchanged from v203 (frozen). Adds behaviour-neutral telemetry to measure Frank's experiment: smart_start events on every Smart Drill / drill-dim / concept-retest / adaptive session; sessions now tag kind + smart flag (Smart Drill distinguishable from Quick Exam); reco_accept logged when a recommendation is taken; optional 👍/👎 "is this actually your weak spot?" tap on each recommendation (reco_agree); smartValidation() computes the funnel (starts, accepts, agreement rate, smart-session completions, concept wrong→correct recovery). No change to which questions are served. Verified: 61 checks pass (21 engine + 9 adaptive + 16 behavioral + 15 archetype/telemetry simulation).
// v203: Engine-quality review pass — half-life (horizon-aware, shortens as exam nears) + 50/20/15/15 routing mix + adaptive signal weights all externalised into SMART config (tunable, not hard-coded); adaptive rebalanced so accuracy+confidence+consistency(last-3) are primary and TIME is a secondary dampener only, plus a guessing-guard so correct+guess no longer ratchets difficulty; mastery hides fake precision (word-only 'building (n)' until sample crosses medium tier, % only when earned); NEW two-axis diagnosis smartDiagnose() separates knowledge GAP vs MISCONCEPTION vs FRAGILE knowledge, wired into 'What should I work on?' badges/verbs (Learn/Confront/Reinforce) and Smart Drill reasons; confidence capture marked optional + confirmed off in timed exams. Verified: 30 prior checks + 16 new behavioral checks (skill-weakness-beats-topic; same-score gap-vs-misconception; param externalisation) all pass.
// v202: Q-bank V1.5 partials finished — [Drill this] buttons on every dashboard weakness bar (skill/cognitive/topic, topic-scope-aware); mastery-state labels extended to topic + course (was skill-only); by-course/topic reasoning views; per-skill adaptive difficulty (each skill tracks its own level, seeded from history, balanced skill rotation, recap on results); concept-retest ("🔄 Retest this concept" → a DIFFERENT question on the same topic+skill+objective, in tutor reveal + results review). Re-verified: 21 engine/feature checks + 9 adaptive checks all pass.
// v201: Q-bank V1.5 Smart Engine — intelligence over the existing pool (no new question generation). Recency-weighted + evidence-gated + confidence-aware mastery; Smart Drill (priority weak->recent-miss->cognitive->skill->topic->neglected, 50/20/15/15 mix, unseen-preferred with 2-day repeat cooldown, human reasons + "why this?"); non-interruptive confidence capture -> calibration + misconception (wrong+confident) detection; skill mastery states; Adaptive difficulty (accuracy+confidence+time+streak, skill-aware); Mega landing = Quick Exam / Smart Drill / Customize; actionable results + "What should I work on?" ranked drills. Verified vs the 10 spec success criteria.
// v200: Desktop home = D2 dashboard (full-width hero + 4 stat cards + continue + progress, responsive; phone keeps its banner layout); removed the stat tiles + the More toggle (everything inline); recolored the floating study-timer pill purple->teal so it no longer blends into the hero
// v199: Routing + Streak-freeze + Adaptive new-cards — home CTAs route to distinct drills on one engine (weak filter, lecturer scope, custom picker) with empty-state fallback; earned streak freezes (1/7 days, cap 2, auto-used to bridge a missed day + welcome-back); adaptive daily new-card cap driven by review-load ratio (0–20, small steps, manual override, exam bias)
// v198: Session Engine — session built from a TIME BUDGET (default 15 min), filled greedily by MEASURED per-card time; home session hero + rings time-honest (minutes studied / budget); daily length setting 5/15/30/45
// v197: Habit-loop — session-complete celebration screen + benefit-driven notification copy (morning pull / streak-at-risk+freeze off-ramp / re-engagement / positive), one pull/day + single streak-save guardrail, real notification titles
// v196: Habit-first home — session hero (15-min session), daily-goal ring up top, prominent+protected streak, weakest-area coach card, one dominant button; tiles/jump-back/progress demoted under "More"
// v195: Visualize dead-air fix — first line's voice is fully pre-generated before the "tap to watch" pill appears, audio element unlocked inside the tap gesture, safety poll capped at ~4s; podcast voice-picker routing restored
// v194: Mega corrections per spec — Focused/Mixed/Blind (no topic shown before answering, any mode); balanced round-robin so a big topic can't dominate; Blind draws whole courses; Quick Exam is the primary CTA; "Drill my weaknesses" panel; Mega Test results break down by course/level/skill; schema trap_type + trap_explanation (populated beyond exam-trap)
// v193: Mega Q-bank — cross-topic exam practice in the sidebar; course/topic pool selection; Targeted / Semi-blind / Blind exposure; Tutor/Test; level + skill + count; one-click Quick Exam (20 · blind · timed); reuses the attempt log so weakness analytics + mistakes pool work across topics; generator prompt now encodes each cognitive level's behaviour + the exam-trap taxonomy
// v192: Q-bank V1
// v192 detail: two-axis taxonomy (4 cognitive levels + 6 clinical skills); start-screen config; type hidden until answered then revealed; dashboard By-cognitive-level + Reasoning-profile; mastery grid columns = cognitive levels — two-axis taxonomy (4 cognitive levels + 6 clinical skills); start-screen config (practice-by-skill / level / count); type hidden until after answering then revealed (level·skill·subtopic + exam-trap callout); dashboard adds By-cognitive-level + Reasoning-profile(by-skill); mastery grid columns = cognitive levels
// v191: Mastery grid — "Show all (N)" expander (8 weakest by default) + a "drill: Whole topic / This difficulty" toggle (tap defaults to whole topic) — "Show all (N)" expander (8 weakest by default) + a "drill: Whole topic / This difficulty" toggle (tap defaults to whole topic)
// v190: Q-bank dashboard = Command Center + Mastery grid (topic × difficulty heatmap, redder=weaker, tap a cell to drill that topic)
// v189: Q-bank weakness engine — per-attempt log (single source of truth) with per-question timing; performance dashboard (first-pass vs after-review, by system/topic/difficulty, tutor-vs-test, pacing, session trend sparkline, auto study recommendations); "My mistakes" pool (retry until latest attempt is right); sync-safe union merge of the attempt log (can't be wiped across devices)
// v188: Q-bank differentiation — vignette-enforcing prompt (never name the dx, 2-step reasoning, discriminating clue, homogeneous options, decision lead-in), difficulty mix, richer schema (lead_in/teaching/system/difficulty/src); client shows lead-in + difficulty chip + educational objective + "Show in note" jump
// v184: Physics — 6 new exemplars (motion / SHM / heating-curve graphs, the reused vectors plane, the energy ledger, a collision worked on "solve"), the physics detection gate + full topic routing, the Physics teaser demo on the fbd renderer, and dashed comparison curves on the graph renderer
// v183: Organic Chemistry — the curly-arrow mechanism renderer (typed arrows, step rail, named intermediate frames, charge ledger), 14 Organic exemplars, the organic detection gate + routing, and the Organic teaser demo
const ASSETS = ['./', './index.html', './app.html', './content.js', './icon.svg', './manifest.webmanifest',
  './site.css', './config.js', './sync.js', './level-switcher.js', './paywall.js', './import-tab.js',
  './lecture-record.js', './study-timer.js', './study-dock.js', './content-loader.js', './auth-ui.js',
  './restore.js', './mb-personal-restore.js', './404.html'];

self.addEventListener('install', e => {
  // Resilient precache: cache each asset individually so ONE missing/failed file
  // can never fail the whole install (which would leave users stuck on the old build).
  e.waitUntil(
    caches.open(CACHE).then(c => Promise.all(ASSETS.map(u => c.add(u).catch(() => {}))))
      .then(() => self.skipWaiting())
  );
});
self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys().then(keys => Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});
/* Stale-while-revalidate: serve the app shell INSTANTLY from cache, then refresh the
   cache in the background for next time. The whole shell stays one consistent cache
   generation, so versions never mix. New builds still arrive reliably: bumping CACHE
   makes the browser install a fresh SW (which re-fetches every asset), and the page's
   existing controllerchange handler auto-reloads once onto the new version. */
self.addEventListener('fetch', e => {
  if (e.request.method !== 'GET') return;
  let url; try { url = new URL(e.request.url); } catch (_) { return; }
  // never touch cross-origin requests (Supabase, Render API, Puter, CDNs) — straight to network
  if (url.origin !== self.location.origin) return;
  e.respondWith(
    caches.match(e.request).then(cached => {
      const fetching = fetch(e.request).then(res => {
        // only cache good, same-origin (basic) responses — never opaque/error responses
        if (res && res.status === 200 && res.type === 'basic') {
          const copy = res.clone();
          caches.open(CACHE).then(c => c.put(e.request, copy)).catch(() => {});
        }
        return res;
      }).catch(() => null);
      // cache first (fast); if nothing cached, wait on the network; final fallback = app shell
      return cached || fetching.then(r => r || caches.match('./app.html')).then(r => r || caches.match('./index.html'));
    })
  );
});

/* recurring reminder via periodic background sync (Chrome/Android; best-effort timing) */
self.addEventListener('periodicsync', event => {
  if (event.tag === 'medbank-nudge' || event.tag === 'medbank-daily') event.waitUntil(maybeRemind());
});
function notifyOpts(body, url, strict) {
  return {
    body: body || 'Cards are due.',
    icon: './icon.svg', badge: './icon.svg', tag: 'medbank-nudge',
    renotify: true, requireInteraction: !!strict, silent: false,
    vibrate: [250, 120, 250, 120, 250],
    actions: [{ action: 'review', title: '▶ Review now' }, { action: 'later', title: 'Later' }],
    data: { url: url || './app.html#/nudge' }
  };
}
async function maybeRemind() {
  try {
    // prefer a page-staged payload that carries the actual cards
    const body = await readFlag('payloadBody');
    const url  = (await readFlag('payloadUrl')) || './app.html#/nudge';
    const title = (await readFlag('payloadTitle')) || 'MedBank';
    const strict = (await readFlag('strict')) === '1';
    if (body) { await self.registration.showNotification(title, notifyOpts(body, url, strict)); return; }
    // fallback if nothing staged
    const hc = parseInt((await readFlag('hardCount')) || '0', 10);
    const n = Math.min(5, hc);
    const fb = hc > 0 ? `Review ${n} hard card${n === 1 ? '' : 's'} to keep them sharp.`
                      : 'Time for a quick review — keep your streak alive.';
    await self.registration.showNotification('MedBank', notifyOpts(fb, hc > 0 ? './app.html#/nudge' : './app.html#/today', strict));
  } catch (e) {}
}
/* message channel: page tells the SW its state, stages a card payload, or asks it to notify */
self.addEventListener('message', e => {
  const d = e.data || {};
  if (d.type === 'skipWaiting') self.skipWaiting();
  if (d.type === 'studied')   writeFlag('lastStudied', d.date);
  if (d.type === 'hardcount') writeFlag('hardCount', String(d.n || 0));
  if (d.type === 'payload')   { writeFlag('payloadBody', d.body || ''); writeFlag('payloadUrl', d.url || './app.html#/nudge'); writeFlag('payloadTitle', d.title || 'MedBank'); }
  if (d.type === 'notify')    { writeFlag('strict', d.strict ? '1' : '0'); self.registration.showNotification(d.title || 'MedBank', notifyOpts(d.body, d.url, d.strict)); }
});
/* tiny IndexedDB-free flag store using Cache API */
async function writeFlag(k, v) { const c = await caches.open(CACHE); await c.put('flag:' + k, new Response(v)); }
async function readFlag(k) { const c = await caches.open(CACHE); const r = await c.match('flag:' + k); return r ? r.text() : null; }

self.addEventListener('notificationclick', e => {
  e.notification.close();
  if (e.action === 'later') return;            // dismiss without opening
  const url = (e.notification.data && e.notification.data.url) || './app.html#/nudge';
  e.waitUntil(self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then(cs => {
    for (const c of cs) { if ('focus' in c) { if (c.navigate) { try { c.navigate(url); } catch (_) {} } return c.focus(); } }
    return self.clients.openWindow(url);
  }));
});
