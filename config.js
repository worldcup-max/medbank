/* =====================================================================
 * MedBank website configuration
 * Fill these in when you deploy. Nothing here is secret EXCEPT nothing —
 * the anon key and Paystack PUBLIC key are safe to ship in the browser.
 * NEVER put the Supabase service_role key or Paystack SECRET key here.
 * ===================================================================== */
window.MEDBANK_CONFIG = {
  // From Supabase → Project Settings → API
  SUPABASE_URL: "https://tytbrhuzikqkscxdnkmr.supabase.co",
  SUPABASE_ANON_KEY: "sb_publishable_SExbh1aVqsvFbZwk4P361A_thit5lFF",

  // Require sign-in before the app can be used (identified pilot). Set false to revert to study-first.
  REQUIRE_LOGIN: false,

  // From Paystack → Settings → API Keys (use the PUBLIC key: pk_...)
  PAYSTACK_PUBLIC_KEY: "pk_test_XXXXXXXXXXXXXXXXXXXX",

  // Optional: a Paystack Plan code (create a monthly plan in Paystack → Plans).
  // Leave "" to charge a one-off amount instead of a recurring plan.
  PAYSTACK_PLAN_MONTHLY: "",

  // 60-second tutorial video. Paste a YouTube link (any form) or a direct .mp4 URL.
  // Leave "" to show a styled "coming soon" placeholder.
  VIDEO_URL: "",

  // Where the 3D player fetches anatomy meshes. Empty = the public BodyParts3D CDN (free, no chambers).
  // After running viz-training/tools/ingest-full-archive.mjs --upload, point this at our own store:
  //   MESH_BASE: "https://tytbrhuzikqkscxdnkmr.supabase.co/storage/v1/object/public/viz-meshes/"
  // No scene file changes — only the adapter reads this.
  MESH_BASE: "https://tytbrhuzikqkscxdnkmr.supabase.co/storage/v1/object/public/viz-meshes/",

  // The import server URL (Phase 5) — used by the app's Import tab. e.g. https://medbank-api.onrender.com
  IMPORT_API: "https://medbank-import.onrender.com",
  // Your website URL — paywall nudges link here for subscribing.
  WEBSITE_URL: "https://medbank.com.ng",

  // Where the installable app lives (fill in when the apps are published)
  DOWNLOAD: {
    ios: "",                       // App Store URL (Phase 6)
    android: "",                   // Play Store URL (Phase 6)
    pwa: "https://worldcup-max.github.io/medbank/"  // the current PWA, installable now
  },

  // Fallback prices in Naira if app_config can't be read (kept in sync with seed.sql)
  PRICES_NGN: { monthly: 2000, semester: 8000, annual: 15000 },
  TRIAL_DAYS: 14,

  // Feature flags — default OFF so new work is dormant for the live pilot until validated.
  // Independent switches so the two V1.6 surfaces can be trialled separately.
  //   GAP_LOOP             = at-miss Knowledge-Gap → Learn → Practice → Retest loop (SPEC-GAP-LEARN-LOOP.md)
  //   POST_SESSION_FIX_QUEUE = post-session "3 things to fix" prioritisation layer that routes to interventions
  //   TOPIC_PREVIEW = the pre-read "orientation video" at the top of the note (SPEC-TOPIC-PREVIEW.md)
  //   MODEL3D      = the 3D anatomy player (viz3d.js) — a NEW renderer beside the SVG Visualize engine,
  //                  reading viz-training/scenes/*.json. Default OFF: with the flag false nothing loads,
  //                  no tab appears and no network request is made. To test without flipping it live,
  //                  run localStorage.mb3d = '1' in the console on your own device.
  FEATURES: { GAP_LOOP: false, POST_SESSION_FIX_QUEUE: false, TOPIC_PREVIEW: true, MODEL3D: false, A7: true, V16_TELEMETRY: true }
};
