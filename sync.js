/* =====================================================================
 * MedBank — cloud sync adapter (Phase 4)
 * Offline-first. The app keeps working exactly as before with NO network;
 * when the student is logged in and online, their progress (DATA) syncs to
 * Supabase per active level-profile, and the level switcher lets them move
 * between 100→600 without losing anything.
 *
 * This file adds a global MB_SYNC. It does NOT change your study engine.
 * It snapshots the whole DATA blob (which holds only progress, never content),
 * so your exact semantics (dayNum `due`, streak.frozen, per-course log) are
 * preserved byte-for-byte.
 *
 * Requires: @supabase/supabase-js loaded, and window.MEDBANK_CONFIG (config.js).
 * Integration hooks: see INTEGRATION.md.
 * ===================================================================== */
(function () {
  var CFG = (typeof window !== "undefined" && window.MEDBANK_CONFIG) || {};
  var META_KEY = "medbank_sync_meta";       // { rev, pushedAt, dirty, profileId }
  var PUSH_DEBOUNCE = 1500;
  var sb = null, account = null, profileId = null, pushTimer = null, ready = false;
  var curLevel = null, startLevel = null, curArchived = false, entitled = false;

  function log(){ if (CFG.SYNC_DEBUG) try{ console.log.apply(console, ["[sync]"].concat([].slice.call(arguments))); }catch(e){} }
  function meta(){ try{ return JSON.parse(localStorage.getItem(META_KEY) || "{}"); }catch(e){ return {}; } }
  function setMeta(m){ try{ localStorage.setItem(META_KEY, JSON.stringify(m)); }catch(e){} }

  /* ---------- pure merge helpers (unit-tested in node) ---------- */
  // Resolve two SRS card states: the one studied more recently (greater `seen`)
  // wins; ties break to the higher box (more progress).
  function pickCard(a, b){
    if(!a) return b; if(!b) return a;
    if((b.seen||0) > (a.seen||0)) return b;
    if((a.seen||0) > (b.seen||0)) return a;
    return (b.box||0) > (a.box||0) ? b : a;
  }
  function mergeCards(a, b){
    var out = {}, k;
    a=a||{}; b=b||{};
    for(k in a) out[k]=a[k];
    for(k in b) out[k]=pickCard(out[k], b[k]);
    return out;
  }
  function mergeLog(a, b){
    var out = {}, d, k;
    a=a||{}; b=b||{};
    for(d in a) out[d]=Object.assign({}, a[d]);
    for(d in b){
      if(!out[d]){ out[d]=Object.assign({}, b[d]); continue; }
      var L=out[d], R=b[d];
      L.cards=Math.max(L.cards||0, R.cards||0);
      L.correct=Math.max(L.correct||0, R.correct||0);
      L.rev=Math.max(L.rev||0, R.rev||0);
      if(L.new||R.new){ var nn=Object.assign({}, L.new||{}); var s;
        for(s in (R.new||{})) nn[s]=Math.max(nn[s]||0, R.new[s]); L.new=nn; }
    }
    return out;
  }
  function mergeStreak(a, b){
    a=a||{current:0,best:0,last:'',lastN:null,frozen:[]}; b=b||{};
    var newer = (b.lastN||-1) > (a.lastN||-1) ? b : a;
    var fz = (a.frozen||[]).concat(b.frozen||[]).filter(function(v,i,arr){return arr.indexOf(v)===i;});
    return { current:newer.current||0, best:Math.max(a.best||0,b.best||0),
             last:newer.last||'', lastN:newer.lastN!=null?newer.lastN:(a.lastN!=null?a.lastN:b.lastN), frozen:fz };
  }
  // union of two string->something maps, preferring `pref` side on key conflict
  function mergeMap(a, b, pref){
    var out={}, k; a=a||{}; b=b||{};
    var lo = pref==="b" ? a : b, hi = pref==="b" ? b : a;
    for(k in lo) out[k]=lo[k];
    for(k in hi) out[k]=hi[k];
    return out;
  }
  // full state merge (used only in a genuine two-sided conflict)
  function mergeState(localD, remoteD){
    var out = Object.assign({}, remoteD, localD);      // start from local for scalars/settings
    out.cards  = mergeCards(localD.cards, remoteD.cards);
    out.starred= mergeMap(localD.starred, remoteD.starred, "b");   // union; keep any star
    out.log    = mergeLog(localD.log, remoteD.log);
    out.study  = (function(a,b){ a=a||{}; b=b||{}; var o={},k; for(k in a) o[k]=a[k]||0; for(k in b) o[k]=Math.max(o[k]||0, b[k]||0); return o; })(localD.study, remoteD.study); // seconds/day: keep the larger
    out.streak = mergeStreak(localD.streak, remoteD.streak);
    // progress maps: union, prefer local (device just used)
    ["topics","done","read","notes","missLog","dayTopics","exams","pos","flags"].forEach(function(k){
      out[k] = mergeMap(localD[k], remoteD[k], "a");
    });
    // plan: prefer whichever is non-empty & local if both
    out.plan = (localD.plan && localD.plan.length) ? localD.plan : (remoteD.plan||[]);
    out.settings = Object.assign({}, remoteD.settings||{}, localD.settings||{}); // local device wins for keys
    return out;
  }

  /* ---------- apply a state object into the live DATA in place ---------- */
  function applyState(next){
    if(typeof DATA === "undefined" || !next) return;
    Object.keys(DATA).forEach(function(k){ if(!(k in next)) return; DATA[k]=next[k]; });
    Object.keys(next).forEach(function(k){ DATA[k]=next[k]; });
    try{ localStorage.setItem("medbank_v1", JSON.stringify(DATA)); }catch(e){}
    try{ if(typeof render==="function") render(); }catch(e){}
  }

  /* ---------- network ops ---------- */
  async function pull(){
    var r = await sb.from("profile_state").select("state,rev,updated_at").eq("level_profile_id", profileId).maybeSingle();
    return r.data || null;
  }
  async function pushNow(){
    if(!ready || !profileId) return;
    var m = meta();
    var snapshot = (typeof DATA !== "undefined") ? DATA : {};
    var body = { level_profile_id: profileId, account_id: account.id,
                 state: snapshot, rev: (m.rev||0)+1, device_updated_at: new Date().toISOString() };
    var r = await sb.from("profile_state").upsert(body, { onConflict:"level_profile_id" });
    if(!r.error){ setMeta({ rev:body.rev, pushedAt:Date.now(), dirty:false, profileId:profileId }); log("pushed rev", body.rev); }
    else log("push error", r.error.message);
  }
  function schedulePush(){
    if(!ready) return;                                   // fully inert until sync is active
    var m = meta(); m.dirty = true; setMeta(m);
    if(pushTimer) clearTimeout(pushTimer);
    pushTimer = setTimeout(function(){ pushNow().catch(function(e){log("push failed",e);}); }, PUSH_DEBOUNCE);
  }

  /* ---------- init ---------- */
  async function init(client){
    try{
      if(!CFG.SUPABASE_URL || CFG.SUPABASE_URL.indexOf("YOUR-PROJECT")>=0) { log("not configured; local-only"); return; }
      sb = client || (window.supabase && window.supabase.createClient(CFG.SUPABASE_URL, CFG.SUPABASE_ANON_KEY));
      if(!sb) return;
      window.__mbSB = sb;                    // shared client for import-tab / paywall
      var s = await sb.auth.getSession();
      if(!s.data.session){ log("not logged in; local-only"); return; }   // app still works offline/local
      var acc = await sb.from("accounts").select("id,active_level_profile_id,start_level").maybeSingle();
      if(!acc.data){ log("no account row"); return; }
      account = acc.data; profileId = account.active_level_profile_id; startLevel = acc.data.start_level;
      if(!profileId){ log("no active profile yet"); return; }

      // load current level + archived flag, and entitlement (trial or paid)
      try{
        var lp = await sb.from("level_profiles").select("level,archived").eq("id", profileId).maybeSingle();
        if(lp.data){ curLevel = lp.data.level; curArchived = !!lp.data.archived; }
        var sub = await sb.from("subscriptions").select("status,trial_ends_at").maybeSingle();
        if(sub.data){ entitled = sub.data.status==="active" ||
          (sub.data.status==="trialing" && sub.data.trial_ends_at && new Date(sub.data.trial_ends_at) > new Date()); }
      }catch(e){ log("entitlement load error", e && e.message); }

      // one-time on-device safety snapshot BEFORE sync ever touches DATA
      try{ if(!localStorage.getItem("medbank_presync_backup"))
        localStorage.setItem("medbank_presync_backup", localStorage.getItem("medbank_v1")||"{}"); }catch(e){}

      var remote = await pull();
      var m = meta();
      var firstOnDevice = !m.rev;                          // never synced from this device before
      if(!remote){
        await pushNow();                                   // first upload of this device's DATA
      } else if(firstOnDevice){
        // CRITICAL: the first login on a device with existing progress ALWAYS merges,
        // never blind-adopts, so local progress can never be lost.
        applyState(mergeState(DATA, remote.state||{}));
        setMeta({ rev:remote.rev, pushedAt:Date.now(), dirty:true, profileId:profileId });
        await pushNow();
      } else if(!m.dirty || (m.profileId && m.profileId !== profileId)){
        applyState(remote.state);                          // adopt cloud (local not ahead)
        setMeta({ rev:remote.rev, pushedAt:Date.now(), dirty:false, profileId:profileId });
      } else {
        applyState(mergeState(DATA, remote.state||{}));    // true conflict → merge
        setMeta({ rev:remote.rev, pushedAt:Date.now(), dirty:true, profileId:profileId });
        await pushNow();
      }
      ready = true;
      window.addEventListener("online", function(){ if(meta().dirty) pushNow(); });
      try{ if(window.MB_loadProfileContent) MB_loadProfileContent(); }catch(e){}   // load this profile's imported topics
      log("ready on profile", profileId);
    }catch(e){ log("init error", e && e.message); }        // never break the app
  }

  /* ---------- level switching ---------- */
  async function listProfiles(){
    if(!sb) return [];
    var r = await sb.from("level_profiles").select("id,level,archived").order("level");
    return r.data || [];
  }
  async function switchProfile(newId){
    if(!sb || !account || newId===profileId) return;
    try{
      if(meta().dirty) await pushNow();                    // flush current profile first
      await sb.from("accounts").update({ active_level_profile_id:newId }).eq("id", account.id);
      setMeta({ rev:0, pushedAt:0, dirty:false, profileId:newId });
      // reload rebuilds the app cleanly for the new profile (content + state)
      if(typeof location !== "undefined") location.reload();
    }catch(e){ log("switch error", e && e.message); }
  }

  async function createProfile(level){
    if(!sb || !account) return null;
    try{
      var ex = await sb.from("level_profiles").select("id").eq("level", level).maybeSingle();
      if(ex.data && ex.data.id) return ex.data.id;        // one profile per level
      var r = await sb.from("level_profiles").insert({ account_id:account.id, level:level }).select("id").single();
      return r.error ? null : r.data.id;
    }catch(e){ log("createProfile error", e && e.message); return null; }
  }
  function currentProfileId(){ return profileId; }

  // Advance to the next level: archive the current one (it becomes view-only),
  // create/unlock the next, and make it active. Progress & notes stay intact.
  async function goToNextLevel(){
    if(!sb || !account || curLevel==null) return;
    var next = curLevel + 100;
    if(next > 600){ log("already at top level"); return; }
    try{
      if(meta().dirty) await pushNow();
      await sb.from("level_profiles").update({ archived:true }).eq("id", profileId);
      var id = await createProfile(next);
      if(!id) return;
      await sb.from("accounts").update({ active_level_profile_id:id }).eq("id", account.id);
      setMeta({ rev:0, pushedAt:0, dirty:false, profileId:id });
      if(typeof location !== "undefined") location.reload();
    }catch(e){ log("goToNextLevel error", e && e.message); }
  }

  // Feature gate for the app: import / AI / new scheduling only when the CURRENT
  // level is active (not archived) AND the account is entitled (trial or paid).
  function canUseFeatures(){ return !!entitled && !curArchived; }
  function status(){ return { level:curLevel, startLevel:startLevel, archived:curArchived, entitled:entitled, canUseFeatures:canUseFeatures() }; }

  window.MB_SYNC = {
    init: init,
    flush: pushNow,
    markDirty: schedulePush,       // call this after persist()
    listProfiles: listProfiles,
    switchProfile: switchProfile,
    createProfile: createProfile,
    goToNextLevel: goToNextLevel,
    canUseFeatures: canUseFeatures,
    status: status,
    currentLevel: function(){ return curLevel; },
    startLevel: function(){ return startLevel; },
    currentProfileArchived: function(){ return curArchived; },
    currentProfileId: currentProfileId,
    // exposed for tests
    _merge: { mergeState:mergeState, mergeCards:mergeCards, mergeLog:mergeLog, mergeStreak:mergeStreak, pickCard:pickCard }
  };
})();
