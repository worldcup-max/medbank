/* =====================================================================
 * MedBank — in-app checkout (Paystack)
 * MB_CHECKOUT.open({ tier })  Basic/Premium × Monthly/Annual picker → Paystack popup (or its hosted page as a fallback)
 *                     → the server confirms the payment → Premium unlocks in place.
 * The import server opens every transaction (amount + plan are decided there) and
 * confirms it with Paystack, so nothing here is trusted and no Paystack key is needed.
 * Coming back from Paystack's hosted page (?reference=…) is confirmed on load.
 * ===================================================================== */
(function () {
  var ID = "mbCheckout", PENDING = "mb_pending_payment";
  function cfg(){ return window.MEDBANK_CONFIG || {}; }
  function api(){ return (cfg().IMPORT_API || "").replace(/\/$/, ""); }
  function naira(n){ return "₦" + Number(n).toLocaleString("en-NG"); }
  function fmtDate(iso){ try{ return new Date(iso).toLocaleDateString("en-GB", { day:"numeric", month:"short", year:"numeric" }); }catch(e){ return ""; } }
  function el(tag, css, text){ var e=document.createElement(tag); if(css) e.style.cssText=css; if(text!=null) e.textContent=text; return e; }
  function store(k, v){ try{ if(v==null) localStorage.removeItem(k); else localStorage.setItem(k, v); }catch(e){} }
  function read(k){ try{ return localStorage.getItem(k); }catch(e){ return null; } }

  /* Shown only if the server's /plans can't be reached; the server's prices are what's charged. */
  var FALLBACK = function(){ var p=cfg().PRICES_NGN||{}, b=p.basic||{}, m=p.premium||{}; return [
    { id:"basic_monthly",   tier:"basic",   interval:"monthly", months:1,  ngn:b.monthly || 4999 },
    { id:"basic_annual",    tier:"basic",   interval:"annual",  months:12, ngn:b.annual  || 47990 },
    { id:"premium_monthly", tier:"premium", interval:"monthly", months:1,  ngn:m.monthly || 7999 },
    { id:"premium_annual",  tier:"premium", interval:"annual",  months:12, ngn:m.annual  || 76790 } ]; };
  var TIER_INFO = {
    basic:   { name:"Basic",   points:["Unlimited lecture imports", "Notes, cards, Q-bank, podcast and AI tutor on every lecture"] },
    premium: { name:"Premium", points:["Everything in Basic", "Snap & solve any question", "Best-quality builds and natural podcast voices", "More explainers and 3D lessons each day"] }
  };
  var plansCache = null;
  function loadPlans(){
    if(plansCache) return Promise.resolve(plansCache);
    if(!api()) return Promise.resolve(FALLBACK());
    return fetch(api() + "/plans").then(function(r){ return r.json(); })
      .then(function(j){ plansCache = (j && j.plans && j.plans.length) ? j.plans : FALLBACK(); return plansCache; })
      .catch(function(){ return FALLBACK(); });
  }
  async function token(){
    try{ var s = window.__mbSB && await window.__mbSB.auth.getSession(); return (s && s.data.session && s.data.session.access_token) || null; }catch(e){ return null; }
  }

  /* ---------- the sheet ---------- */
  var sheet = null;
  function close(){ try{ if(sheet && sheet.o.parentNode) sheet.o.remove(); }catch(e){} sheet = null; document.removeEventListener("keydown", onKey); }
  function onKey(e){ if(e.key === "Escape") close(); }
  function frame(){
    close();
    var o = el("div", "position:fixed;inset:0;background:rgba(10,16,30,.55);display:flex;align-items:center;justify-content:center;z-index:100060;padding:16px calc(16px + env(safe-area-inset-right,0px)) calc(16px + env(safe-area-inset-bottom,0px)) calc(16px + env(safe-area-inset-left,0px))");
    o.id = ID;
    var c = el("div", "background:var(--panel,#fff);color:var(--text,#0f1729);max-width:400px;width:100%;max-height:90vh;overflow-y:auto;border-radius:16px;padding:22px;font-family:inherit;box-shadow:0 20px 60px rgba(0,0,0,.3)");
    o.appendChild(c);
    o.onclick = function(e){ if(e.target === o && !(sheet && sheet.busy)) close(); };
    document.body.appendChild(o);
    document.addEventListener("keydown", onKey);
    sheet = { o:o, c:c, busy:false };
    return c;
  }
  function btn(text, primary){
    var b = el("button", "width:100%;border:0;border-radius:12px;padding:13px;font-weight:800;cursor:pointer;font-size:15px;margin-top:9px;" +
      (primary ? "background:var(--brand,#4f46e5);color:#fff" : "background:var(--bg2,#f2f3f9);color:var(--text,#0f1729)"), text);
    return b;
  }
  function message(title, body, actions){
    var c = frame();
    c.style.textAlign = "center";
    c.appendChild(el("div", "font-weight:800;font-size:19px;margin:4px 0 8px", title));
    if(body) c.appendChild(el("div", "color:var(--dim,#5b6b86);font-size:14.5px;margin-bottom:10px", body));
    (actions || [{ text:"Close", onClick:close }]).forEach(function(a, i){ var b = btn(a.text, i === 0 && a.primary !== false); b.onclick = a.onClick; c.appendChild(b); });
    return c;
  }

  /* opts.tier preselects "basic" or "premium" (a Premium-only feature passes "premium"). */
  async function open(opts){
    opts = opts || {};
    if(cfg().PAYMENTS && cfg().PAYMENTS.ENABLED === false){ message("Subscriptions open soon", "Payments aren't switched on yet. Your free lecture and everything on it keep working."); return; }
    var c = frame();
    c.appendChild(el("div", "font-weight:800;font-size:19px;margin-bottom:4px", opts.title || "Choose your plan"));
    c.appendChild(el("div", "color:var(--dim,#5b6b86);font-size:14px;margin-bottom:12px",
      opts.reason || "Everything you've already built stays yours on any plan."));
    var body = el("div"); c.appendChild(body);
    body.appendChild(el("div", "color:var(--dim,#5b6b86);font-size:13px", "Loading plans…"));
    var plans = await loadPlans();
    if(!sheet || sheet.c !== c) return;                               // closed while loading
    body.textContent = "";
    function find(tier, interval){ return plans.filter(function(p){ return p.tier === tier && p.interval === interval; })[0]; }
    var tier = opts.tier === "basic" ? "basic" : "premium", interval = "monthly";
    var maxSave = 0;
    ["basic", "premium"].forEach(function(t){ var m = find(t, "monthly"), a = find(t, "annual");
      if(m && a) maxSave = Math.max(maxSave, Math.round(100 - a.ngn / (m.ngn * 12) * 100)); });

    // Monthly | Annual switch
    var sw = el("div", "display:flex;background:var(--bg2,#f2f3f9);border-radius:12px;padding:4px;margin-bottom:10px");
    var swBtns = {};
    [["monthly", "Monthly"], ["annual", "Annual" + (maxSave > 0 ? " · save " + maxSave + "%" : "")]].forEach(function(x){
      var b = el("button", "flex:1;border:0;border-radius:9px;padding:9px;font:inherit;font-weight:800;font-size:13.5px;cursor:pointer;color:var(--text,#0f1729)", x[1]);
      b.onclick = function(){ interval = x[0]; paint(); };
      swBtns[x[0]] = b; sw.appendChild(b);
    });
    body.appendChild(sw);

    var cards = {};
    ["basic", "premium"].forEach(function(t){
      var r = el("button", "display:block;text-align:left;width:100%;border-radius:12px;padding:12px 14px;margin-top:8px;cursor:pointer;font:inherit;color:inherit;background:var(--panel,#fff)");
      var top = el("div", "display:flex;align-items:baseline;justify-content:space-between;gap:10px");
      top.appendChild(el("div", "font-weight:800;font-size:16px", TIER_INFO[t].name));
      var price = el("div", "text-align:right"); top.appendChild(price);
      r.appendChild(top);
      var ul = el("div", "font-size:13px;color:var(--dim,#5b6b86);margin-top:4px;line-height:1.5");
      TIER_INFO[t].points.forEach(function(pt){ ul.appendChild(el("div", "", "✓ " + pt)); });
      r.appendChild(ul);
      r.onclick = function(){ tier = t; paint(); };
      cards[t] = { r:r, price:price }; body.appendChild(r);
    });

    var pay = btn("", true); pay.style.marginTop = "14px"; c.appendChild(pay);
    var err = el("div", "color:#c0392b;font-size:13.5px;margin-top:8px;text-align:center;display:none"); c.appendChild(err);
    var no = btn("Not now"); no.onclick = close; c.appendChild(no);
    c.appendChild(el("div", "color:var(--dim,#5b6b86);font-size:12px;margin-top:10px;text-align:center", "Secure payment by Paystack · card, bank transfer or USSD"));
    function paint(){
      ["monthly", "annual"].forEach(function(i){ var on = i === interval;
        swBtns[i].style.background = on ? "var(--panel,#fff)" : "transparent"; swBtns[i].style.boxShadow = on ? "0 1px 4px rgba(0,0,0,.12)" : "none"; });
      ["basic", "premium"].forEach(function(t){
        var p = find(t, interval), card = cards[t];
        card.r.style.border = t === tier ? "2px solid var(--brand,#4f46e5)" : "1px solid var(--line,#e3e6ef)";
        card.price.textContent = "";
        if(!p) return;
        card.price.appendChild(el("div", "font-weight:800;font-size:16px", naira(p.ngn) + (interval === "annual" ? " / year" : " / month")));
        if(interval === "annual") card.price.appendChild(el("div", "font-size:12px;color:var(--dim,#5b6b86)", "about " + naira(Math.round(p.ngn / 12)) + " a month"));
      });
      var sel = find(tier, interval);
      pay.textContent = sel ? "Pay " + naira(sel.ngn) + " for " + TIER_INFO[tier].name : "Unavailable";
      pay.disabled = !sel;
    }
    paint();
    pay.onclick = function(){ var sel = find(tier, interval); if(!sel) return; err.style.display = "none"; start(sel.id, pay, err); };
  }

  async function start(planId, payBtn, errEl){
    var tok = await token();
    if(!tok){
      message("Sign in to subscribe", "Your subscription is attached to your MedBank account, so it works on all your devices.",
        [{ text:"Sign in or create account", onClick:function(){ close(); try{ window.MB_openAuth && window.MB_openAuth(); }catch(e){} } }, { text:"Not now", onClick:close }]);
      return;
    }
    var label = payBtn.textContent; payBtn.disabled = true; payBtn.textContent = "Opening Paystack…"; sheet.busy = true;
    try{
      var here = location.origin + location.pathname;
      var r = await fetch(api() + "/paystack/checkout", { method:"POST", headers:{ "Authorization":"Bearer " + tok, "Content-Type":"application/json" },
        body: JSON.stringify({ plan:planId, return_url:here }) });
      var j = await r.json().catch(function(){ return {}; });
      if(!r.ok || !j.access_code) throw new Error(j.error || "Couldn't open checkout. Try again in a moment.");
      store(PENDING, j.reference);
      waiting(j.reference);
      popup(j);
    }catch(e){
      if(sheet) sheet.busy = false;
      payBtn.disabled = false; payBtn.textContent = label;
      errEl.textContent = e.message || "Couldn't open checkout."; errEl.style.display = "block";
    }
  }

  /* Paystack's popup if its script loads, otherwise its hosted page (which returns here with ?reference=). */
  function popup(tx){
    var src = (cfg().PAYMENTS && cfg().PAYMENTS.PAYSTACK_INLINE_JS) || "https://js.paystack.co/v2/inline.js";
    var gone = false;
    function hosted(){ if(gone) return; gone = true; location.href = tx.authorization_url; }
    var timer = setTimeout(hosted, 10000);
    function run(){
      clearTimeout(timer); if(gone) return;
      try{
        new window.PaystackPop().resumeTransaction(tx.access_code, {
          onSuccess: function(){ confirm(tx.reference, { tries:6 }); },
          onCancel:  function(){ /* the "I've paid" button stays for transfers that finish later */ }
        });
        gone = true;
      }catch(e){ hosted(); }
    }
    if(window.PaystackPop) return run();
    var s = document.createElement("script"); s.src = src; s.async = true; s.onload = run; s.onerror = function(){ clearTimeout(timer); hosted(); };
    document.head.appendChild(s);
  }

  function waiting(ref){
    message("Finish paying in Paystack", "When Paystack says it's done, you'll be switched to Premium here. Paying by bank transfer? Tap below once you've sent it.",
      [{ text:"I've paid, check now", onClick:function(){ confirm(ref, { tries:3 }); } }, { text:"Cancel", onClick:close }]);
  }

  /* Ask the server to confirm with Paystack. Transfers can take a moment, so retry a few times. */
  async function confirm(ref, o){
    o = o || {};
    if(!o.silent) message("Confirming your payment…", "This takes a few seconds.", []);
    var tries = o.tries || 1, last = null;
    for(var i = 0; i < tries; i++){
      if(i) await new Promise(function(r){ setTimeout(r, 2500); });
      var tok = await token(); if(!tok) break;
      try{
        var r = await fetch(api() + "/paystack/verify?reference=" + encodeURIComponent(ref), { headers:{ "Authorization":"Bearer " + tok } });
        last = await r.json().catch(function(){ return {}; });
        if(r.ok && last.paid) return done(last);
        if(r.status === 400 || (last && last.status === "failed") || (last && last.status === "abandoned" && i > 0)) break;
      }catch(e){ last = { error:e.message }; }
    }
    if(o.silent){                                                     // forget an abandoned attempt; keep one still in flight
      if(!last || !/^(ongoing|pending|processing|queued)$/.test(last.status || "")) store(PENDING, null);
      return;
    }
    var failed = last && (last.status === "failed" || last.status === "abandoned");
    message(failed ? "That payment didn't go through" : "We haven't seen it yet",
      failed ? "No money was taken for this attempt. You can try again." :
               "If you've paid, it will still count: Paystack tells us directly and your account switches to Premium on its own. You can check again in a minute.",
      failed ? [{ text:"Try again", onClick:function(){ open(); } }, { text:"Close", onClick:close }]
             : [{ text:"Check again", onClick:function(){ confirm(ref, { tries:3 }); } }, { text:"Close", onClick:close }]);
  }

  function done(j){
    store(PENDING, null);
    try{ if(window.MB_SYNC && MB_SYNC.refreshEntitlement) MB_SYNC.refreshEntitlement(); }catch(e){}
    try{ if(typeof window.loadPlanBadge === "function") window.loadPlanBadge(); }catch(e){}
    try{ var nudge = document.getElementById("mbPaywallNudge"); if(nudge) nudge.remove(); }catch(e){}
    var tierName = j.tier === "basic" ? "Basic" : "Premium";
    message("You're on " + tierName + " 🎉", j.current_period_end ? "Paid up until " + fmtDate(j.current_period_end) + ". Thank you for supporting MedBank." : "Thank you for supporting MedBank.",
      [{ text:"Back to studying", onClick:close }]);
  }

  /* On load: returning from Paystack's hosted page, a ?subscribe=1 link, or a payment we never confirmed. */
  function boot(){
    var q; try{ q = new URLSearchParams(location.search); }catch(e){ return; }
    var ref = q.get("reference") || q.get("trxref");
    var wantPlans = q.get("subscribe");                                // "1", "basic" or "premium"
    if(ref || wantPlans){
      q.delete("reference"); q.delete("trxref"); q.delete("subscribe");
      try{ history.replaceState(null, "", location.pathname + (q.toString() ? "?" + q : "") + location.hash); }catch(e){}
    }
    // wait for auth-ui/sync to create the Supabase client before asking for a token
    var waited = 0;
    (function go(){
      if(!window.__mbSB && waited < 8000){ waited += 400; return setTimeout(go, 400); }
      if(ref) confirm(ref, { tries:4 });
      else if(wantPlans) open({ tier:wantPlans });
      else if(read(PENDING)) confirm(read(PENDING), { silent:true });
    })();
  }
  if(typeof document !== "undefined"){
    if(document.readyState === "loading") document.addEventListener("DOMContentLoaded", boot); else boot();
  }

  window.MB_CHECKOUT = { open:open, confirm:confirm };
})();
