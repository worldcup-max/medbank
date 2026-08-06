/* =====================================================================
 * MedBank — in-app login & sync UI (Phase 4/5)
 * Adds a "Sign in / Sync" screen INSIDE the app so a student can log in on
 * their phone and have their progress sync. The app still works fully
 * logged-out; this is opt-in and never blocks studying.
 *
 * Requires: @supabase/supabase-js loaded, config.js, sync.js (MB_SYNC).
 * Exposes: window.MB_openAuth(). Also injects a small status chip.
 * ===================================================================== */
(function () {
  var CFG = (typeof window !== "undefined" && window.MEDBANK_CONFIG) || {};
  function el(t, css, html){ var e=document.createElement(t); if(css)e.style.cssText=css; if(html!=null)e.innerHTML=html; return e; }
  function configured(){ return CFG.SUPABASE_URL && CFG.SUPABASE_URL.indexOf("YOUR-PROJECT")<0; }

  function client(){
    if(window.__mbSB) return window.__mbSB;
    if(window.supabase && configured()) window.__mbSB = window.supabase.createClient(CFG.SUPABASE_URL, CFG.SUPABASE_ANON_KEY);
    return window.__mbSB || null;
  }

  var overlay=null;
  function close(){ if(overlay&&overlay.parentNode) overlay.parentNode.removeChild(overlay); overlay=null; }
  function sheet(title, sub){
    close();
    overlay=el("div","position:fixed;inset:0;background:rgba(10,16,30,.6);display:flex;align-items:center;justify-content:center;z-index:100000;font-family:-apple-system,Segoe UI,Roboto,sans-serif");
    var s=el("div","background:#fff;width:92%;max-width:380px;border-radius:18px;padding:24px;box-shadow:0 24px 70px rgba(0,0,0,.35)");
    s.appendChild(el("div","font-weight:800;font-size:20px;color:#0f1729;margin-bottom:4px",title));
    if(sub) s.appendChild(el("div","color:#5b6b86;font-size:14px;margin-bottom:14px",sub));
    overlay.appendChild(s); overlay.onclick=function(e){ if(e.target===overlay) close(); };
    document.body.appendChild(overlay);
    return s;
  }
  function input(s,label,type,ph){
    s.appendChild(el("div","font-size:12.5px;font-weight:700;color:#5b6b86;margin:12px 0 5px",label));
    var i=el("input","width:100%;padding:12px 13px;border:1px solid #e7ebf3;border-radius:11px;font-size:16px;box-sizing:border-box");
    i.type=type||"text"; if(ph)i.placeholder=ph; s.appendChild(i); return i;
  }
  function btn(s,label,primary){
    var b=el("button","width:100%;margin-top:14px;border:0;border-radius:12px;padding:13px;font-weight:800;font-size:15px;cursor:pointer;"+
      (primary?"background:#4f46e5;color:#fff":"background:#f2f3f9;color:#0f1729"),label);
    s.appendChild(b); return b;
  }
  function err(s){ var e=el("div","background:#fdecea;color:#c0392b;border-radius:10px;padding:10px 12px;font-size:13.5px;margin-top:12px;display:none"); s.appendChild(e); return e; }

  /* device fingerprint (matches website) */
  function fp(){ var x=[navigator.userAgent,navigator.language,screen.width+"x"+screen.height,Intl.DateTimeFormat().resolvedOptions().timeZone,navigator.hardwareConcurrency||0].join("|");
    var h=0; for(var i=0;i<x.length;i++) h=((h<<5)-h+x.charCodeAt(i))|0; return "fp_"+(h>>>0).toString(36); }

  var MODE="signin";
  async function open(){
    if(!configured()){ toast("Sync isn't configured yet."); return; }
    var sb=client(); if(!sb) return;
    var ses=await sb.auth.getSession();
    if(ses.data.session){ return showAccount(sb); }
    renderAuth(sb);
  }

  function renderAuth(sb){
    var isUp=MODE==="signup";
    var s=sheet(isUp?"Create your account":"Sign in", isUp?"Sync your progress across devices.":"Welcome back — sync your progress.");
    var name = isUp ? input(s,"Full name","text","e.g. Frank Wiz") : null;
    var email=input(s,"Email","email","you@example.com");
    var pass=input(s,"Password","password","Your password");
    var e=err(s);
    var go=btn(s,isUp?"Create account":"Sign in",true);
    var swap=el("div","text-align:center;color:#5b6b86;font-size:13px;margin-top:12px;cursor:pointer",
      isUp?"Already have an account? Sign in":"New here? Create an account");
    swap.onclick=function(){ MODE=isUp?"signin":"signup"; renderAuth(sb); };
    s.appendChild(swap);
    var cancel=el("div","text-align:center;color:#9aa6bd;font-size:13px;margin-top:10px;cursor:pointer","Not now"); cancel.onclick=close; s.appendChild(cancel);
    function fail(m){ e.textContent=m; e.style.display="block"; }
    go.onclick=async function(){
      e.style.display="none";
      var em=(email.value||"").trim(), pw=pass.value;
      if(!em||!pw){ fail("Enter your email and password."); return; }
      go.disabled=true; go.textContent="Please wait…";
      try{
        if(isUp){
          var r=await sb.auth.signUp({ email:em, password:pw, options:{ data:{ full_name:(name.value||"").trim() } } });
          if(r.error) throw r.error;
          if(r.data.user){ try{ await sb.from("signup_signals").insert({ account_id:r.data.user.id, fingerprint:fp() }); }catch(_){} }
          if(!r.data.session){ sheet("Check your email","We sent a confirmation link to "+em+". Tap it, then come back and sign in."); return; }
        } else {
          var r2=await sb.auth.signInWithPassword({ email:em, password:pw });
          if(r2.error) throw r2.error;
        }
        await afterAuth(sb);
      }catch(ex){ fail(ex.message||"Something went wrong."); go.disabled=false; go.textContent=isUp?"Create account":"Sign in"; }
    };
  }

  async function afterAuth(sb){
    // does this account already have a level profile?
    var { data:profs } = await sb.from("level_profiles").select("id").limit(1);
    if(profs && profs.length){ await startSync(sb); return; }
    renderOnboard(sb);
  }

  var CHOSEN={ level:null, courses:[] };
  async function renderOnboard(sb){
    var s=sheet("Set up your level","Levels below stay hidden; higher ones unlock as you go.");
    var grid=el("div","display:grid;grid-template-columns:1fr 1fr 1fr;gap:8px;margin-top:6px");
    [100,200,300,400,500,600].forEach(function(lv){
      var d=el("div","padding:14px 4px;border:1.5px solid #e7ebf3;border-radius:11px;text-align:center;font-weight:800;cursor:pointer;color:#0f1729",lv+"");
      d.onclick=function(){ CHOSEN.level=lv; [].forEach.call(grid.children,function(c){c.style.borderColor="#e7ebf3";c.style.background="#fff";}); d.style.borderColor="#4f46e5"; d.style.background="#eef0fe"; loadCourses(sb,s); };
      grid.appendChild(d);
    });
    s.appendChild(grid);
    s._coursesBox=el("div",""); s.appendChild(s._coursesBox);
    var e=err(s);
    var go=btn(s,"Start",true);
    go.onclick=async function(){
      if(!CHOSEN.level){ e.textContent="Pick your level."; e.style.display="block"; return; }
      var chosen=CHOSEN.courses.filter(function(c){return c.on});
      if(!chosen.length){ e.textContent="Pick at least one course."; e.style.display="block"; return; }
      go.disabled=true; go.textContent="Setting up…";
      try{
        var u=(await sb.auth.getUser()).data.user;
        var lp=await sb.from("level_profiles").insert({ account_id:u.id, level:CHOSEN.level }).select("id").single();
        if(lp.error) throw lp.error;
        await sb.from("accounts").update({ active_level_profile_id:lp.data.id, start_level:CHOSEN.level }).eq("id",u.id);
        var rows=chosen.map(function(c,i){ return { level_profile_id:lp.data.id, account_id:u.id, name:c.name, position:i }; });
        var cr=await sb.from("courses").insert(rows); if(cr.error) throw cr.error;
        await startSync(sb);
      }catch(ex){ e.textContent=ex.message||"Could not save."; e.style.display="block"; go.disabled=false; go.textContent="Start"; }
    };
  }
  async function loadCourses(sb,s){
    var tpl={}; try{ var d=await sb.from("app_config").select("value").eq("key","course_templates").maybeSingle(); if(d.data) tpl=d.data.value; }catch(_){}
    CHOSEN.courses=(tpl[String(CHOSEN.level)]||[]).map(function(n){return {name:n,on:true}});
    var box=s._coursesBox; box.innerHTML="";
    box.appendChild(el("div","font-size:12.5px;font-weight:700;color:#5b6b86;margin:14px 0 6px","Your courses"));
    CHOSEN.courses.forEach(function(c){
      var row=el("label","display:flex;align-items:center;gap:10px;padding:11px 12px;border:1px solid #e7ebf3;border-radius:11px;margin-top:7px;cursor:pointer;"+(c.on?"background:#eef0fe;border-color:#4f46e5":""));
      row.innerHTML='<input type="checkbox" '+(c.on?"checked":"")+' style="width:auto"> <span style="font-weight:600;color:#0f1729">'+c.name+'</span>';
      row.querySelector("input").onchange=function(ev){ c.on=ev.target.checked; row.style.background=c.on?"#eef0fe":"#fff"; row.style.borderColor=c.on?"#4f46e5":"#e7ebf3"; };
      box.appendChild(row);
    });
  }

  async function startSync(sb){
    try{ if(window.MB_SYNC) await MB_SYNC.init(sb); }catch(_){}
    updateChip();
    var s=sheet("You're synced ✓","Your progress now saves to your account and syncs across devices.");
    btn(s,"Done",true).onclick=close;
  }

  async function showAccount(sb){
    var s=sheet("Account","You're signed in and syncing.");
    var st=(window.MB_SYNC&&MB_SYNC.status)?MB_SYNC.status():{};
    s.appendChild(el("div","background:#e6f6f3;color:#0b6b60;border-radius:11px;padding:11px 13px;font-size:13.5px",
      "✓ Sync on"+(st.level?(" · "+st.level+" level"):"")+(st.entitled? "":" · trial ended")));
    var sw=btn(s,"Switch level"); sw.onclick=function(){ close(); if(window.MB_openLevelSwitcher) MB_openLevelSwitcher(); };
    var out=btn(s,"Log out"); out.onclick=async function(){ try{ await sb.auth.signOut(); }catch(_){} updateChip(); close(); };
    var cx=el("div","text-align:center;color:#9aa6bd;font-size:13px;margin-top:10px;cursor:pointer","Close"); cx.onclick=close; s.appendChild(cx);
  }

  /* small status chip so students can find sign-in */
  var chip=null;
  function ensureChip(){
    if(chip||typeof document==="undefined") return;
    chip=el("button","position:fixed;right:12px;bottom:14px;z-index:9998;border:0;border-radius:22px;padding:9px 14px;font-weight:800;font-size:13px;cursor:pointer;box-shadow:0 6px 20px rgba(31,41,90,.18);background:#4f46e5;color:#fff","☁ Sign in");
    chip.onclick=open; document.body.appendChild(chip);
    updateChip();
  }
  async function updateChip(){
    if(!chip) return;
    var sb=client(); if(!sb){ chip.style.display="none"; return; }
    try{ var ses=await sb.auth.getSession();
      if(ses.data.session){ chip.textContent="✓ Synced"; chip.style.background="#0d9488"; }
      else { chip.textContent="☁ Sign in"; chip.style.background="#4f46e5"; }
    }catch(_){}
  }
  function toast(m){ try{ alert(m); }catch(_){} }

  window.MB_openAuth=open;
  if(typeof document!=="undefined"){
    if(configured()) document.addEventListener("DOMContentLoaded", function(){ setTimeout(ensureChip, 800); });
  }
})();
