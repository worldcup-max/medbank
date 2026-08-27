/* MedBank service worker — offline caching + best-effort daily reminder */
const CACHE = 'medbank-v221';   // v221: bone is matte and warm and the rig is lit like a printed anatomy plate — low directional contrast, no specular sheen to erase the ridges. The fetch handler is CACHE-FIRST, so viz3d.js changes are invisible to a device that already cached them until this string changes.
// v214: SW bug batch (SW-01..09) — flag store now writes (was 'flag:' URL-scheme reject → all background nudges generic); flags moved to an UNVERSIONED cache so deploys don't wipe them; offline fallback no longer serves app.html for script/style requests (killed the silent "Unexpected token '<'" half-load); activate backfills the new cache from the old before purging; message/revalidate work held with waitUntil; install no longer skipWaiting()s a student out of a live exam (banner-driven upgrade); maybeRemind suppresses when already-studied-today or reminders off; notificationclick prefers the app window. Engine still frozen at v203.
// v213: ACCOUNT-ISOLATION FIX (BUG-01) — on login, if a DIFFERENT account is signed in than the one cached locally, purge the previous account's local data (medbank_v1, sync meta, content caches) before rendering/syncing, then reload clean. Prevents account B seeing/overwriting account A's cards/notes/progress on a shared device or account switch. First-ever login is NOT purged (preserves studied-logged-out→signup merge). sync.js only; engine still frozen at v203. Verified: parse + 4 switch-logic checks.
// v212: SYNC DATA-LOSS FIX — logging in no longer adopts an EMPTY cloud copy over real local progress. On the same level-profile, if the cloud is empty but the device has data, sync now MERGES (keeps local) and pushes up instead of blind-adopting. Genuine level-switches and normal cloud adopts still work. This is the bug behind "logged in and my data vanished." Makes the REQUIRE_LOGIN pilot safe to ship. (sync.js only; Smart Drill engine still frozen at v203.) Verified: 12 sync-merge checks pass.
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
  './restore.js', './mb-personal-restore.js', './viz3d.js', './404.html'];

const FLAGS = 'medbank-flags';                                   // SW-02: unversioned — survives deploys
const FLAG_BASE = new URL('__mbflag/', self.location).href;     // SW-01: a real http(s) URL, not the 'flag:' scheme

self.addEventListener('install', e => {
  // Resilient precache: cache each asset individually so ONE missing/failed file
  // can never fail the whole install. SW-08: do NOT skipWaiting() — the page's update
  // banner drives activation so a deploy can't reload a student out of a live exam.
  e.waitUntil(
    caches.open(CACHE).then(c => Promise.all(ASSETS.map(u => c.add(u).catch(() => {}))))
  );
});
self.addEventListener('activate', e => {
  // SW-04: backfill the new cache from the old ones BEFORE deleting, so one flaky asset
  // during install can't permanently degrade the offline shell. Keep the flags cache.
  e.waitUntil((async () => {
    const c = await caches.open(CACHE);
    const keys = await caches.keys();
    const olds = keys.filter(k => k !== CACHE && k !== FLAGS);
    for (const u of ASSETS) {
      if (await c.match(u)) continue;
      for (const k of olds) { const hit = await (await caches.open(k)).match(u); if (hit) { await c.put(u, hit.clone()); break; } }
    }
    await Promise.all(olds.map(k => caches.delete(k)));
    await self.clients.claim();
  })());
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
  if (url.href.indexOf(FLAG_BASE) === 0) return;                // never intercept internal flag URLs
  // SW-03: only the app shell may be the offline fallback, and only for a NAVIGATION.
  const isNav = e.request.mode === 'navigate' || e.request.destination === 'document';
  const fetching = fetch(e.request).then(res => {
    if (res && res.status === 200 && res.type === 'basic') {
      const copy = res.clone();
      caches.open(CACHE).then(c => c.put(e.request, copy)).catch(() => {});
    }
    return res;
  }).catch(() => null);
  e.respondWith(
    caches.match(e.request).then(cached => {
      if (cached) { e.waitUntil(fetching); return cached; }     // SW-05: hold the worker open for the revalidate
      return fetching.then(r => {
        if (r) return r;
        if (isNav) return caches.match('./app.html').then(x => x || caches.match('./index.html'));
        return Response.error();                                // SW-03: a script/style 404s as an error, not HTML
      });
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
    // SW-07: an explicit off switch stops every path (blanking the payload only downgraded it).
    if ((await readFlag('remindOff')) === '1') return;
    // SW-06: don't nag a student who already studied today.
    const today = new Date().toISOString().slice(0, 10);
    if ((await readFlag('lastStudied')) === today) return;
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
  if (d.type === 'skipWaiting') { self.skipWaiting(); return; }
  const jobs = [];                                              // SW-05: hold the worker open for the writes/notification
  if (d.type === 'studied')   jobs.push(writeFlag('lastStudied', d.date));
  if (d.type === 'hardcount') jobs.push(writeFlag('hardCount', String(d.n || 0)));
  if (d.type === 'reminders') jobs.push(writeFlag('remindOff', d.off ? '1' : '0'));   // SW-07: real off switch
  if (d.type === 'payload')   { jobs.push(writeFlag('payloadBody', d.body || ''), writeFlag('payloadUrl', d.url || './app.html#/nudge'), writeFlag('payloadTitle', d.title || 'MedBank')); }
  if (d.type === 'notify')    { jobs.push(writeFlag('strict', d.strict ? '1' : '0'), self.registration.showNotification(d.title || 'MedBank', notifyOpts(d.body, d.url, d.strict))); }
  if (jobs.length && e.waitUntil) e.waitUntil(Promise.all(jobs).catch(() => {}));
});
/* tiny flag store using the Cache API. SW-01: key on a real same-origin http(s) URL
   (the old 'flag:'+k made a 'flag' URL SCHEME, which Cache.put rejects — so nothing was
   ever stored and every background nudge fell back to the generic copy). SW-02: unversioned. */
async function writeFlag(k, v) {
  try { const c = await caches.open(FLAGS); await c.put(FLAG_BASE + encodeURIComponent(k), new Response(String(v == null ? '' : v))); } catch (_) {}
}
async function readFlag(k) {
  try { const c = await caches.open(FLAGS); const r = await c.match(FLAG_BASE + encodeURIComponent(k)); return r ? r.text() : null; } catch (_) { return null; }
}

self.addEventListener('notificationclick', e => {
  e.notification.close();
  if (e.action === 'later') return;            // dismiss without opening
  const url = (e.notification.data && e.notification.data.url) || './app.html#/nudge';
  e.waitUntil(self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then(async cs => {
    // SW-09: prefer the actual app window, await the navigate, and fall back to opening one.
    const app = cs.find(c => c.url && c.url.indexOf('app.html') !== -1) || cs[0];
    if (app) { try { const n = app.navigate ? await app.navigate(url) : null; return (n || app).focus(); } catch (_) { return self.clients.openWindow(url); } }
    return self.clients.openWindow(url);
  }));
});
