/* =====================================================================
 * MedBank — paywall & trial nudges (Phase 5)
 * Small, friendly gates. Shows trial days left, and a subscribe nudge when a
 * feature is blocked (view-only level, quota hit, or trial ended).
 * Uses MB_SYNC.canUseFeatures() and MEDBANK_CONFIG.WEBSITE_URL.
 * ===================================================================== */
(function () {
  var CFG = (typeof window !== "undefined" && window.MEDBANK_CONFIG) || {};

  function nudge(title, msg, cta){
    if(typeof document === "undefined") return;
    var o=document.createElement("div");
    o.style.cssText="position:fixed;inset:0;background:rgba(10,16,30,.55);display:flex;align-items:center;justify-content:center;z-index:10000";
    var c=document.createElement("div");
    c.style.cssText="background:#fff;max-width:360px;width:90%;border-radius:16px;padding:24px;text-align:center;font-family:inherit;box-shadow:0 20px 60px rgba(0,0,0,.3)";
    c.innerHTML='<div style="font-size:34px">✨</div>'+
      '<div style="font-weight:800;font-size:19px;margin:6px 0 6px">'+title+'</div>'+
      '<div style="color:#5b6b86;font-size:14.5px;margin-bottom:18px">'+msg+'</div>';
    var go=document.createElement("button");
    go.textContent=cta||"Subscribe";
    go.style.cssText="width:100%;border:0;background:#4f46e5;color:#fff;border-radius:12px;padding:13px;font-weight:800;cursor:pointer;font-size:15px";
    go.onclick=function(){ var u=CFG.WEBSITE_URL||(CFG.DOWNLOAD&&CFG.DOWNLOAD.pwa)||"#"; try{ window.open(u+"#pricing","_blank"); }catch(e){} document.body.removeChild(o); };
    var no=document.createElement("button");
    no.textContent="Not now";
    no.style.cssText="width:100%;margin-top:9px;border:0;background:#f2f3f9;color:#0f1729;border-radius:12px;padding:12px;font-weight:700;cursor:pointer";
    no.onclick=function(){ document.body.removeChild(o); };
    c.appendChild(go); c.appendChild(no);
    o.appendChild(c); o.onclick=function(e){ if(e.target===o) document.body.removeChild(o); };
    document.body.appendChild(o);
  }

  // Call this before running any token-costing feature. Returns true if allowed.
  // If blocked, it shows the right nudge and returns false.
  function guard(featureLabel){
    if(!window.MB_SYNC) return true;                       // logged-out/local mode: don't block
    var st = MB_SYNC.status ? MB_SYNC.status() : {};
    if(st.canUseFeatures) return true;
    if(st.archived) nudge("This level is view-only", "Your notes and progress here are saved. "+(featureLabel||"This feature")+" runs on your current level.", "Go to current level");
    else nudge("Your free trial has ended", "Subscribe to keep using "+(featureLabel||"imports and AI")+" — your progress and notes stay exactly as they are.", "Subscribe");
    return false;
  }

  // A tiny banner you can drop into a container to show trial status.
  function trialBadge(){
    var st = (window.MB_SYNC && MB_SYNC.status) ? MB_SYNC.status() : {};
    if(!st.entitled) return "Trial ended · Subscribe";
    return "";   // (days-left text can be added once the app surfaces trial_ends_at)
  }

  window.MB_PAYWALL = { guard: guard, nudge: nudge, trialBadge: trialBadge };
})();
