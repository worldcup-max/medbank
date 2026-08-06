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

  // From Paystack → Settings → API Keys (use the PUBLIC key: pk_...)
  PAYSTACK_PUBLIC_KEY: "pk_test_XXXXXXXXXXXXXXXXXXXX",

  // Optional: a Paystack Plan code (create a monthly plan in Paystack → Plans).
  // Leave "" to charge a one-off amount instead of a recurring plan.
  PAYSTACK_PLAN_MONTHLY: "",

  // 60-second tutorial video. Paste a YouTube link (any form) or a direct .mp4 URL.
  // Leave "" to show a styled "coming soon" placeholder.
  VIDEO_URL: "",

  // The import server URL (Phase 5) — used by the app's Import tab. e.g. https://medbank-api.onrender.com
  IMPORT_API: "",
  // Your website URL — paywall nudges link here for subscribing.
  WEBSITE_URL: "https://YOUR-WEBSITE-URL",

  // Where the installable app lives (fill in when the apps are published)
  DOWNLOAD: {
    ios: "",                       // App Store URL (Phase 6)
    android: "",                   // Play Store URL (Phase 6)
    pwa: "https://worldcup-max.github.io/medbank/"  // the current PWA, installable now
  },

  // Fallback prices in Naira if app_config can't be read (kept in sync with seed.sql)
  PRICES_NGN: { monthly: 2000, semester: 8000, annual: 15000 },
  TRIAL_DAYS: 14
};
