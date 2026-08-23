/* =====================================================================
 * MedBank — paywall & trial nudges (Phase 5)
 * Small, friendly gates. Shows trial status, and a subscribe/level nudge when a
 * feature is blocked (view-only level, quota hit, or trial ended).
 * Uses MB_SYNC.status()/canUseFeatures() and MEDBANK_CONFIG.WEBSITE_URL.
 *
 * Fixes PW-02..10 (2026-08-23): fail-open until entitlement is actually known
 * (never tell a paying student "trial ended" during the boot race); archived CTA
 * routes to the level switcher; message is escaped; overlay z-index above the app's
 * own overlays; window.open falls back to location; singleton + scrollable + Escape.
 * ===================================================================== */
(function () {
  var NUDGE_ID = "mbPaywallNudge";
  function cfg(){ return (typeof window !== "undefined" && window.MEDBANK_CONFIG) || {}; }
  function pricingURL(){
    var c = cfg();
    var base = c.WEBSITE_URL || (c.DOWNLOAD && c.DOWNLOAD.pwa) || "https://medbank.com.ng";  // PW-07: real origin, never "#"
    return base.replace(/#.*$/, "") + "#pricing";
  }

  // nudge(title, msg, cta, onCta) — onCta defaults to opening the pricing page.
  function nudge(title, msg, cta, onCta){
    if(typeof document === "undefined" || !document.body) return;
    if(document.getElementById(NUDGE_ID)) return;                                 // PW-09: singleton

    var o=document.createElement("div");
    o.id=NUDGE_ID;
    // PW-05: above every app overlay (highest live is .csov 100020). PW-10: safe-area pad.
    o.style.cssText="position:fixed;inset:0;background:rgba(10,16,30,.55);display:flex;align-items:center;justify-content:center;z-index:100050;padding:16px calc(16px + env(safe-area-inset-right,0px)) calc(16px + env(safe-area-inset-bottom,0px)) calc(16px + env(safe-area-inset-left,0px))";

    var c=document.createElement("div");
    // PW-10: max-height + scroll so "Not now" is always reachable; themable with light fallbacks.
    c.style.cssText="background:var(--panel,#fff);max-width:360px;width:100%;max-height:88vh;overflow-y:auto;border-radius:16px;padding:24px;text-align:center;font-family:inherit;box-shadow:0 20px 60px rgba(0,0,0,.3)";

    var emoji=document.createElement("div"); emoji.style.cssText="font-size:34px"; emoji.textContent="✨";
    var h=document.createElement("div"); h.style.cssText="font-weight:800;font-size:19px;margin:6px 0 6px;color:var(--text,#0f1729)"; h.textContent=title||"";   // PW-04: escaped
    var m=document.createElement("div"); m.style.cssText="color:var(--dim,#5b6b86);font-size:14.5px;margin-bottom:18px"; m.textContent=msg||"";                  // PW-04: escaped
    c.appendChild(emoji); c.appendChild(h); c.appendChild(m);

    function close(){ try{ if(o.parentNode) o.remove(); }catch(e){} document.removeEventListener("keydown", onKey); }  // PW-09
    function onKey(e){ if(e.key==="Escape") close(); }

    var go=document.createElement("button");
    go.textContent=cta||"Subscribe";
    go.style.cssText="width:100%;border:0;background:var(--brand,#4f46e5);color:#fff;border-radius:12px;padding:13px;font-weight:800;cursor:pointer;font-size:15px";
    go.onclick=function(){
      if(typeof onCta==="function"){ try{ onCta(); }catch(e){} close(); return; }               // PW-03: archived → level switcher
      var u=pricingURL(), w=null;                                                                // PW-06/07: reliable navigation
      try{ w=window.open(u,"_blank"); }catch(e){}
      if(!w){ try{ location.href=u; }catch(e){} }
      close();
    };
    var no=document.createElement("button");
    no.textContent="Not now";
    no.style.cssText="width:100%;margin-top:9px;border:0;background:var(--bg2,#f2f3f9);color:var(--text,#0f1729);border-radius:12px;padding:12px;font-weight:700;cursor:pointer";
    no.onclick=close;

    c.appendChild(go); c.appendChild(no);
    o.appendChild(c);
    o.onclick=function(e){ if(e.target===o) close(); };
    document.body.appendChild(o);
    document.addEventListener("keydown", onKey);
  }

  // Call before running any token-costing feature. Returns true if allowed.
  // Fails OPEN until entitlement is actually resolved (syncing===true), so a paying
  // student is never blocked during the boot race or a half-initialised session (PW-02).
  function guard(featureLabel){
    if(!window.MB_SYNC) return true;                                  // logged-out / local mode: don't block
    var st = (MB_SYNC.status && MB_SYNC.status()) || {};
    if(st.canUseFeatures) return true;
    if(!st.syncing) return true;                                      // PW-02: entitlement not known yet — never accuse
    if(st.archived){
      nudge("This level is view-only",
        "Your notes and progress here are saved. "+(featureLabel||"This feature")+" runs on your current level.",
        "Go to current level",
        (typeof window.MB_openLevelSwitcher==="function") ? window.MB_openLevelSwitcher : null);   // PW-03
    } else {
      nudge("Your free trial has ended",
        "Subscribe to keep using "+(featureLabel||"imports and AI")+" — your progress and notes stay exactly as they are.",
        "Subscribe");
    }
    return false;
  }

  // A tiny status string for the Settings Plan row. Keyed off canUseFeatures (PW-08).
  function trialBadge(){
    var st = (window.MB_SYNC && MB_SYNC.status) ? MB_SYNC.status() : {};
    if(!st.profileId) return "";                                      // logged-out / not resolved — say nothing
    if(st.canUseFeatures) return "";                                  // active/trialing & usable — no nag
    if(!st.syncing) return "";                                        // not resolved yet — don't accuse
    if(st.archived) return "Viewing an old level";
    return "Trial ended · Subscribe";
  }

  window.MB_PAYWALL = { guard: guard, nudge: nudge, trialBadge: trialBadge };
})();
