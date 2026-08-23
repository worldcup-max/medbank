/* =====================================================================
 * MedBank — guided sign-up / sign-in walkthrough (Phase 4/5, v2)
 * A friendly first-run flow: welcome → pick level → pick courses (filtered
 * by the chosen level, with an "add course" escape hatch for other schools)
 * → create account. Value-first: the student sets up their study space
 * before being asked to sign up. Returning students get a clean sign-in.
 *
 * The app still works fully logged-out; this never blocks studying.
 * Requires: @supabase/supabase-js, config.js, sync.js (MB_SYNC).
 * Exposes: window.MB_openAuth(), window.MB_openWelcome().
 * ===================================================================== */
(function () {
  var CFG = (typeof window !== "undefined" && window.MEDBANK_CONFIG) || {};

  /* ---- palette (matches the violet light theme) ---- */
  var C = { violet:"#5b21b6", violetD:"#4c1d95", teal:"#0d9488", coral:"#f97362",
            ink:"#1c1830", dim:"#5c5570", line:"#e6e3f0", tint:"#ece3fb", tintB:"#ddd0f5" };

  /* ---- default course catalog per level (Nigerian MBBS; editable server-side) ---- */
  var DEFAULT_COURSES = {
    "100":["Biology","General Chemistry","Organic Chemistry","Physics","Mathematics","Use of English / GST","Computer Studies"],
    "200":["Gross Anatomy","Histology","Embryology","Genetics","Physiology","Biochemistry","Medical Sociology","Psychology"],
    "300":["Anatomy (Head & Neck)","Neuroanatomy","Physiology","Medical Biochemistry","Neuroscience","Introduction to Pharmacology"],
    "400":["Pathology","Pharmacology","Medical Microbiology","Haematology","Chemical Pathology","Immunology","Epidemiology & Biostatistics","Community Medicine"],
    "500":["Internal Medicine","General Surgery","Paediatrics","Obstetrics & Gynaecology","Psychiatry","Community Medicine","Family Medicine","Radiology","Anaesthesia","Clinical Pathology"],
    "600":["Medicine","Surgery","Paediatrics","Obstetrics & Gynaecology","Ophthalmology","ENT (Otorhinolaryngology)","Orthopaedics","Urology","Dermatology","Emergency Medicine","Community Medicine"]
  };
  var SERVER_TPL = {};
  function catalogFor(level){
    var s = SERVER_TPL[String(level)];
    if (Array.isArray(s) && s.length) return s.slice();
    return (DEFAULT_COURSES[String(level)] || []).slice();
  }

  function el(t, css, html){ var e=document.createElement(t); if(css)e.style.cssText=css; if(html!=null)e.innerHTML=html; return e; }
  function configured(){ return CFG.SUPABASE_URL && CFG.SUPABASE_URL.indexOf("YOUR-PROJECT")<0; }
  function client(){
    if(window.__mbSB) return window.__mbSB;
    if(window.supabase && configured()) window.__mbSB = window.supabase.createClient(CFG.SUPABASE_URL, CFG.SUPABASE_ANON_KEY);
    return window.__mbSB || null;
  }

  /* ---- overlay + card shell ---- */
  var overlay=null;
  function close(){ if(overlay&&overlay.parentNode) overlay.parentNode.removeChild(overlay); overlay=null; }
  function card(opts){
    opts=opts||{};
    close();
    overlay=el("div","position:fixed;inset:0;background:rgba(28,20,45,.55);display:flex;align-items:center;justify-content:center;z-index:100000;padding:16px;font-family:-apple-system,Segoe UI,Roboto,sans-serif;-webkit-backdrop-filter:blur(2px);backdrop-filter:blur(2px)");
    var s=el("div","background:#fff;width:100%;max-width:440px;max-height:92vh;overflow-y:auto;border-radius:20px;padding:26px 24px;box-shadow:0 30px 80px rgba(28,20,45,.4)");
    if(opts.step){
      var dots=el("div","display:flex;gap:6px;margin-bottom:16px");
      for(var i=1;i<=4;i++){ dots.appendChild(el("div","height:5px;flex:1;border-radius:3px;background:"+(i<=opts.step?C.violet:C.line))); }
      s.appendChild(dots);
    }
    if(opts.title) s.appendChild(el("div","font-weight:800;font-size:22px;letter-spacing:-.3px;color:"+C.ink+";margin-bottom:5px",opts.title));
    if(opts.sub) s.appendChild(el("div","color:"+C.dim+";font-size:14.5px;line-height:1.5;margin-bottom:16px",opts.sub));
    overlay.appendChild(s); overlay.onclick=function(e){ if(e.target===overlay && opts.dismiss!==false) close(); };
    document.body.appendChild(overlay);
    return s;
  }
  function input(s,label,type,ph){
    s.appendChild(el("div","font-size:12.5px;font-weight:700;color:"+C.dim+";margin:13px 0 5px",label));
    var i=el("input","width:100%;padding:12px 13px;border:1px solid "+C.line+";border-radius:11px;font-size:16px;box-sizing:border-box;outline:none");
    i.type=type||"text"; if(ph)i.placeholder=ph;
    i.onfocus=function(){ i.style.borderColor=C.violet; }; i.onblur=function(){ i.style.borderColor=C.line; };
    s.appendChild(i); return i;
  }
  function btn(s,label,primary){
    var b=el("button","width:100%;margin-top:14px;border:0;border-radius:12px;padding:14px;font-weight:800;font-size:15px;cursor:pointer;transition:.15s;"+
      (primary?("background:"+C.violet+";color:#fff"):("background:"+C.tint+";color:"+C.violetD)),label);
    if(primary){ b.onmouseenter=function(){b.style.background=C.violetD;}; b.onmouseleave=function(){b.style.background=C.violet;}; }
    s.appendChild(b); return b;
  }
  function link(s,label){ var d=el("div","text-align:center;color:"+C.dim+";font-size:13.5px;margin-top:13px;cursor:pointer",label); s.appendChild(d); return d; }
  function err(s){ var e=el("div","background:#fdece7;color:#b3391f;border-radius:10px;padding:10px 12px;font-size:13.5px;margin-top:12px;display:none"); s.appendChild(e); return e; }
  function fail(e,m){ e.textContent=m; e.style.display="block"; }

  function fp(){ var x=[navigator.userAgent,navigator.language,screen.width+"x"+screen.height,Intl.DateTimeFormat().resolvedOptions().timeZone,navigator.hardwareConcurrency||0].join("|");
    var h=0; for(var i=0;i<x.length;i++) h=((h<<5)-h+x.charCodeAt(i))|0; return "fp_"+(h>>>0).toString(36); }

  var CHOSEN={ level:null, courses:[], name:"" };

  /* ---- entry points ---- */
  async function open(){
    if(!configured()){ toast("Sync isn't set up yet."); return; }
    var sb=client(); if(!sb){ toast("Couldn't reach the sync service. Check your connection and try again."); return; }
    var ses=await sb.auth.getSession();
    if(ses.data.session) return showAccount(sb);
    loadServerTemplates(sb);
    renderWelcome(sb);
  }
  async function openWelcome(){
    if(!configured()) return;
    var sb=client(); if(!sb) return;
    var ses=await sb.auth.getSession();
    if(ses.data.session) return;              // already in — don't interrupt
    loadServerTemplates(sb);
    renderWelcome(sb);
  }
  async function loadServerTemplates(sb){
    try{ var d=await sb.from("app_config").select("value").eq("key","course_templates").maybeSingle();
      if(d.data && d.data.value) SERVER_TPL=d.data.value; }catch(_){}
  }

  /* ---- step 0: welcome ---- */
  function renderWelcome(sb){
    var s=card({ title:"Welcome to MedBank", sub:"Let's set up your study space. Takes about a minute — no card needed." });
    var feats=el("div","margin:2px 0 6px");
    [["📥","Turn your lectures into decks"],["🧠","Spaced repetition that sticks"],["✨","Let AI explain anything"]].forEach(function(f){
      var r=el("div","display:flex;align-items:center;gap:11px;padding:9px 2px;font-size:14.5px;color:"+C.ink);
      r.innerHTML='<span style="font-size:18px">'+f[0]+'</span><span>'+f[1]+'</span>'; feats.appendChild(r);
    });
    s.appendChild(feats);
    btn(s,"Get started",true).onclick=function(){ renderLevel(sb); };
    link(s,"I already have an account · Sign in").onclick=function(){ renderSignin(sb); };
    link(s,"Skip for now").onclick=close;
  }

  /* ---- step 1: level ---- */
  function renderLevel(sb){
    var s=card({ step:1, title:"What level are you?", sub:"This sets your courses. Levels below stay view-only; higher ones unlock as you finish each year." });
    var grid=el("div","display:grid;grid-template-columns:1fr 1fr 1fr;gap:9px;margin-top:4px");
    [100,200,300,400,500,600].forEach(function(lv){
      var on=CHOSEN.level===lv;
      var d=el("div","padding:16px 4px;border:1.5px solid "+(on?C.violet:C.line)+";border-radius:12px;text-align:center;font-weight:800;font-size:17px;cursor:pointer;color:"+C.ink+";background:"+(on?C.tint:"#fff")+";transition:.12s",lv+"");
      d.onclick=function(){ CHOSEN.level=lv; [].forEach.call(grid.children,function(c){c.style.borderColor=C.line;c.style.background="#fff";}); d.style.borderColor=C.violet; d.style.background=C.tint; nextBtn.style.opacity="1"; nextBtn.disabled=false; try{ e.style.display="none"; }catch(_){} };
      grid.appendChild(d);
    });
    s.appendChild(grid);
    var e=err(s);
    var nextBtn=btn(s,"Continue",true);
    if(!CHOSEN.level){ nextBtn.style.opacity=".5"; }
    nextBtn.onclick=function(){ if(!CHOSEN.level){ fail(e,"Pick your level to continue."); return; } renderCourses(sb); };
    link(s,"Back").onclick=function(){ renderWelcome(sb); };
  }

  /* ---- step 2: courses (filtered by level) + add course ---- */
  function renderCourses(sb){
    var s=card({ step:2, title:CHOSEN.level+" level courses", sub:"Pick the ones you're taking. Not from this school? Add your own at the bottom." });
    // seed from catalog for this level (only first time or when level changed)
    if(!CHOSEN.courses.length || CHOSEN._forLevel!==CHOSEN.level){
      CHOSEN.courses=catalogFor(CHOSEN.level).map(function(n){return {name:n,on:true};});
      CHOSEN._forLevel=CHOSEN.level;
    }
    var listBox=el("div","margin-top:4px");
    s.appendChild(listBox);
    function drawList(){
      listBox.innerHTML="";
      CHOSEN.courses.forEach(function(c,idx){
        var row=el("label","display:flex;align-items:center;gap:11px;padding:12px 13px;border:1px solid "+(c.on?C.violet:C.line)+";border-radius:12px;margin-top:8px;cursor:pointer;background:"+(c.on?C.tint:"#fff"));
        row.innerHTML='<input type="checkbox" '+(c.on?"checked":"")+' style="width:18px;height:18px;accent-color:'+C.violet+'"> '+
          '<span style="flex:1;font-weight:600;color:'+C.ink+'">'+esc(c.name)+'</span>'+
          (c.custom?'<span data-x="1" style="color:'+C.dim+';font-size:18px;padding:0 4px;cursor:pointer">×</span>':'');
        row.querySelector("input").onchange=function(ev){ c.on=ev.target.checked; row.style.background=c.on?C.tint:"#fff"; row.style.borderColor=c.on?C.violet:C.line; if(c.on){ try{ e.style.display="none"; }catch(_){} } };
        var x=row.querySelector('[data-x]'); if(x) x.onclick=function(ev){ ev.preventDefault(); CHOSEN.courses.splice(idx,1); drawList(); };
        listBox.appendChild(row);
      });
    }
    drawList();
    // add-course
    var addWrap=el("div","display:flex;gap:8px;margin-top:12px");
    var ai=el("input","flex:1;min-width:0;padding:11px 12px;border:1px dashed "+C.tintB+";border-radius:11px;font-size:15px;box-sizing:border-box;outline:none"); ai.placeholder="Add a course (e.g. Dermatology)";
    ai.onfocus=function(){ai.style.borderColor=C.violet;}; ai.onblur=function(){ai.style.borderColor=C.tintB;};
    var ab=el("button","flex:none;border:0;border-radius:11px;padding:0 16px;font-weight:800;font-size:20px;cursor:pointer;background:"+C.tint+";color:"+C.violetD,"+");
    function addCourse(){ var v=(ai.value||"").trim(); if(!v) return;
      if(!CHOSEN.courses.some(function(c){return c.name.toLowerCase()===v.toLowerCase();})) CHOSEN.courses.push({name:v,on:true,custom:true});
      ai.value=""; drawList(); ai.focus(); }
    ab.onclick=addCourse; ai.onkeydown=function(ev){ if(ev.key==="Enter"){ ev.preventDefault(); addCourse(); } };
    addWrap.appendChild(ai); addWrap.appendChild(ab); s.appendChild(addWrap);
    var e=err(s);
    btn(s,"Continue",true).onclick=function(){
      if(!CHOSEN.courses.filter(function(c){return c.on;}).length){ fail(e,"Pick at least one course."); return; }
      renderAccount(sb);
    };
    link(s,"Back").onclick=function(){ renderLevel(sb); };
  }

  /* ---- step 3: create account (value already delivered) ---- */
  function renderAccount(sb){
    var s=card({ step:3, title:"Create your account", sub:"Save your progress and sync across your phone and laptop." });
    var name=input(s,"Full name","text","e.g. Frank Wiz"); name.value=CHOSEN.name||"";
    var email=input(s,"Email","email","you@example.com");
    var pass=input(s,"Password","password","Create a password");
    var e=err(s);
    var go=btn(s,"Create account & start",true);
    go.onclick=async function(){
      e.style.display="none";
      var nm=(name.value||"").trim(), em=(email.value||"").trim(), pw=pass.value;
      CHOSEN.name=nm;
      if(!em||!pw){ fail(e,"Enter your email and a password."); return; }
      if(pw.length<6){ fail(e,"Use at least 6 characters for your password."); return; }
      go.disabled=true; go.textContent="Creating…";
      try{
        var r=await sb.auth.signUp({ email:em, password:pw, options:{ data:{ full_name:nm } } });
        if(r.error) throw r.error;
        if(r.data.user && Array.isArray(r.data.user.identities) && r.data.user.identities.length===0){
          renderSignin(sb, { email:em, note:"You already have an account with this email. Just sign in below." });
          return;
        }
        if(r.data.user){ try{ await sb.from("signup_signals").insert({ account_id:r.data.user.id, fingerprint:fp() }); }catch(_){} }
        stashPending();
        if(!r.data.session){ renderCheckEmail(sb, em); return; }
        await saveOnboarding(sb, CHOSEN);
      }catch(ex){ fail(e, friendly(ex)); go.disabled=false; go.textContent="Create account & start"; }
    };
    link(s,"Already have an account? Sign in").onclick=function(){ renderSignin(sb); };
    link(s,"Back").onclick=function(){ renderCourses(sb); };
  }
  function renderCheckEmail(sb, em){
    var s=card({ title:"You're almost in", sub:"We just sent a verification link to "+esc(em)+". Open it to activate your account — your level and courses are saved and waiting." });
    s.appendChild(el("div","font-size:12.5px;color:"+C.dim+";margin-top:2px","Can't find it? Check your spam or promotions folder."));
    btn(s,"I've verified — take me in",true).onclick=function(){ renderSignin(sb); };
    var rs=link(s,"Resend the link");
    rs.onclick=async function(){ rs.textContent="Sending…"; try{ await sb.auth.resend({ type:"signup", email:em }); rs.textContent="Sent again — check your inbox ✓"; }catch(_){ rs.textContent="Couldn't resend — try again shortly"; } };
    link(s,"Close").onclick=close;
  }

  /* ---- sign-in (returning) ---- */
  function renderSignin(sb, opts){
    opts=opts||{};
    var s=card({ title:"Welcome back", sub:"Sign in to pick up where you left off." });
    if(opts.note){ s.appendChild(el("div","background:#f2eafe;color:#4c1d95;border-radius:10px;padding:10px 12px;font-size:13.5px;margin-bottom:2px",opts.note)); }
    var email=input(s,"Email","email","you@example.com");
    if(opts.email){ email.value=opts.email; }
    var pass=input(s,"Password","password","Your password");
    var e=err(s);
    var go=btn(s,"Sign in",true);
    go.onclick=async function(){
      e.style.display="none";
      var em=(email.value||"").trim(), pw=pass.value;
      if(!em||!pw){ fail(e,"Enter your email and password."); return; }
      go.disabled=true; go.textContent="Signing in…";
      try{ var r=await sb.auth.signInWithPassword({ email:em, password:pw }); if(r.error) throw r.error; await afterAuth(sb); }
      catch(ex){ fail(e, friendly(ex)); go.disabled=false; go.textContent="Sign in"; }
    };
    link(s,"Forgot password?").onclick=async function(){
      var em2=(email.value||"").trim();
      if(!em2){ fail(e,"Enter your email above first, then tap Forgot password."); return; }
      try{ await sb.auth.resetPasswordForEmail(em2, { redirectTo:(location.origin||"")+"/app.html" }); }catch(_){}
      var s2=card({ title:"Check your email", sub:"If an account exists for "+esc(em2)+", we've sent a link to reset your password. Open it to choose a new one." });
      s2.appendChild(el("div","font-size:12.5px;color:"+C.dim+";margin-top:2px","Can't find it? Check your spam or promotions folder."));
      btn(s2,"Back to sign in",true).onclick=function(){ renderSignin(sb,{ email:em2 }); };
    };
    link(s,"New here? Create an account").onclick=function(){ renderWelcome(sb); };
    link(s,"Close").onclick=close;
  }

  /* ---- password reset landing (opened from the emailed link) ---- */
  function renderResetPassword(sb){
    var s=card({ title:"Set a new password", sub:"Choose a new password for your MedBank account.", dismiss:false });
    var p1=input(s,"New password","password","At least 6 characters");
    var e=err(s);
    var go=btn(s,"Update password & sign in",true);
    go.onclick=async function(){
      e.style.display="none";
      var pw=p1.value; if(!pw||pw.length<6){ fail(e,"Use at least 6 characters for your password."); return; }
      go.disabled=true; go.textContent="Updating…";
      try{ var r=await sb.auth.updateUser({ password:pw }); if(r.error) throw r.error; close(); await afterAuth(sb); }
      catch(ex){ fail(e, friendly(ex)); go.disabled=false; go.textContent="Update password & sign in"; }
    };
  }

  /* ---- after auth: route to sync / pending onboarding / setup ---- */
  async function afterAuth(sb){
    var { data:profs } = await sb.from("level_profiles").select("id").limit(1);
    if(profs && profs.length){ return startSync(sb); }
    var pend=readPending();
    if(pend && pend.level && Array.isArray(pend.courses) && pend.courses.some(function(c){return c && c.on;})){ CHOSEN=pend; return saveOnboarding(sb, pend); }
    renderLevel(sb);   // signed in but no profile yet → set up
  }

  async function saveOnboarding(sb, chosen){
    var s=card({ title:"Setting up your space…", sub:"One moment.", dismiss:false });
    try{
      var u=(await sb.auth.getUser()).data.user;
      if(!u || !u.id) throw new Error("Your session expired. Please sign in again to finish setting up.");
      var lp=await sb.from("level_profiles").insert({ account_id:u.id, level:chosen.level }).select("id").single();
      if(lp.error) throw lp.error;
      await sb.from("accounts").update({ active_level_profile_id:lp.data.id, start_level:chosen.level }).eq("id",u.id);
      var picked=chosen.courses.filter(function(c){return c.on;});
      var rows=picked.map(function(c,i){ return { level_profile_id:lp.data.id, account_id:u.id, name:c.name, position:i }; });
      var cr=await sb.from("courses").insert(rows); if(cr.error) throw cr.error;
      clearPending();
      await startSync(sb, true);
    }catch(ex){
      s.innerHTML=""; s.appendChild(el("div","font-weight:800;font-size:19px;color:"+C.ink,"Couldn't finish setup"));
      s.appendChild(el("div","color:"+C.dim+";font-size:14px;margin:6px 0 4px",friendly(ex)));
      btn(s,"Try again",true).onclick=function(){ saveOnboarding(sb, chosen); };
    }
  }

  async function startSync(sb, fresh){
    try{ if(window.MB_SYNC) await MB_SYNC.init(sb); }catch(_){}
    updateChip();
    if(fresh){
      close();
      try{ location.hash="#/home"; }catch(_){}
      // first lecture is required — open the importer with no skip
      setTimeout(function(){ try{ if(window.MB_openImport) MB_openImport({ mandatory:true }); }catch(_){} }, 80);
    } else {
      var s2=card({ title:"You're all set ✓", sub:"Signed in — your progress is syncing." });
      btn(s2,"Continue",true).onclick=function(){ close(); };
    }
  }

  async function showAccount(sb){
    var st=(window.MB_SYNC&&MB_SYNC.status)?MB_SYNC.status():{};
    // AUTH-04: only claim sync when sync is actually running. Being signed in is NOT enough —
    // every early return in MB_SYNC.init leaves it inert, and this sheet used to say
    // "signed in and syncing" while the student's work went nowhere but this device.
    var s=card({ title:"Your account", sub: st.syncing ? "You're signed in and syncing."
                                                       : "You're signed in, but your work isn't syncing yet." });
    if(st.syncing){
      s.appendChild(el("div","background:#e6f6f3;color:#0b6b60;border-radius:11px;padding:11px 13px;font-size:13.5px;font-weight:600",
        "✓ Sync on"+(st.level?(" · "+st.level+" level"):"")+(st.entitled? "":" · trial ended")));
    } else {
      s.appendChild(el("div","background:#fdece7;color:#b3391f;border-radius:11px;padding:11px 13px;font-size:13.5px;font-weight:600;line-height:1.45",
        "⚠ Not syncing — your progress is saved on this device only.<br><span style='font-weight:500'>Check your connection and reopen the app. If it keeps saying this, finish setting up your level and courses.</span>"));
    }
    btn(s,"Switch level").onclick=function(){ close(); if(window.MB_openLevelSwitcher) MB_openLevelSwitcher(); };
    var out=btn(s,"Log out"); out.onclick=async function(){ try{ await sb.auth.signOut(); }catch(_){} updateChip(); close(); };
    link(s,"Close").onclick=close;
  }

  /* ---- pending onboarding across email confirmation ---- */
  function stashPending(){ try{ localStorage.setItem("mb_pending_onboard", JSON.stringify({level:CHOSEN.level,courses:CHOSEN.courses,name:CHOSEN.name})); }catch(_){} }
  function readPending(){ try{ var v=localStorage.getItem("mb_pending_onboard"); return v?JSON.parse(v):null; }catch(_){ return null; } }
  function clearPending(){ try{ localStorage.removeItem("mb_pending_onboard"); }catch(_){} }

  function friendly(ex){
    var m=(ex&&ex.message)||"Something went wrong.";
    if(/already registered|already exists/i.test(m)) return "Looks like you already have an account — try signing in instead.";
    if(/invalid login|invalid credentials/i.test(m)) return "That email or password doesn't match. Give it another go.";
    if(/confirm/i.test(m)) return "Just verify your email to finish — we've sent you a link. Check your inbox (and spam).";
    return m;
  }
  function esc(x){ return String(x==null?"":x).replace(/[&<>"]/g,function(c){return {"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;"}[c];}); }

  /* ---- profile avatar + dropdown menu ---- */
  var chip=null, menu=null;
  function initialOf(name,email){ var s=((name||email||"?")+"").trim(); return s?s[0].toUpperCase():"?"; }
  function closeMenu(){ if(menu&&menu.parentNode) menu.parentNode.removeChild(menu); menu=null; try{ document.removeEventListener("click", outsideMenu, true); }catch(_){} }
  function outsideMenu(e){ if(menu && !menu.contains(e.target) && e.target!==chip) closeMenu(); }
  function mItem(icon,label){
    var it=el("div","display:flex;align-items:center;gap:11px;padding:12px 16px;cursor:pointer;font-size:14.5px;color:"+C.ink,"<span style='width:20px;text-align:center;font-size:15px'>"+icon+"</span><span>"+esc(label)+"</span>");
    it.onmouseenter=function(){ it.style.background=C.tint; };
    it.onmouseleave=function(){ it.style.background="#fff"; };
    return it;
  }
  async function toggleMenu(){
    if(menu){ closeMenu(); return; }
    var sb=client(); var signedIn=false, name="", email="", st={};
    if(sb){ try{ var ses=await sb.auth.getSession(); if(ses.data.session){ signedIn=true; var u=ses.data.session.user; email=u.email||""; name=(u.user_metadata&&u.user_metadata.full_name)||""; st=(window.MB_SYNC&&MB_SYNC.status)?(MB_SYNC.status()||{}):{}; } }catch(_){} }
    menu=el("div","position:fixed;right:14px;top:calc(env(safe-area-inset-top,0px) + 56px);z-index:100000;background:#fff;border:1px solid "+C.line+";border-radius:14px;box-shadow:0 16px 46px rgba(28,20,45,.24);min-width:242px;overflow:hidden;font-family:-apple-system,Segoe UI,Roboto,sans-serif");
    if(signedIn){
      menu.appendChild(el("div","padding:14px 16px;border-bottom:1px solid #f0edf6",
        "<div style='font-weight:800;color:"+C.ink+"'>"+esc(name||"Your account")+"</div>"+
        "<div style='font-size:12.5px;color:"+C.dim+";word-break:break-all'>"+esc(email)+"</div>"+
        // AUTH-04 — don't say "Synced" unless MB_SYNC is actually active on this device
        (st.syncing
          ? "<div style='font-size:12px;color:"+C.teal+";margin-top:4px;font-weight:600'>✓ Synced"+(st.level?(" · "+esc(st.level)+" level"):"")+"</div>"
          : "<div style='font-size:12px;color:#b3391f;margin-top:4px;font-weight:600'>⚠ Not syncing — this device only</div>")));
    } else {
      menu.appendChild(el("div","padding:14px 16px;border-bottom:1px solid #f0edf6;font-weight:700;color:"+C.ink,"Not signed in"));
    }
    var rows;
    if(signedIn){
      rows=[
        ["＋","Add a lecture",function(){ if(window.MB_openImport) MB_openImport(); }],
        ["🎙","Record a lecture",function(){ if(window.MB_openRecorder) MB_openRecorder(); else alert("Recording isn't available right now — reload the app, or use File / YouTube / Paste."); }],
        ["⚙","Settings",function(){ if(window.go) go("settings"); }],
        ["🎚","Switch level",function(){ if(window.MB_openLevelSwitcher) MB_openLevelSwitcher(); }],
        ["👤","Account & sync",function(){ open(); }],
        ["✉","Send feedback",function(){ try{ location.href="mailto:frankthewiz1@gmail.com?subject=MedBank%20feedback"; }catch(_){} }],
        ["⎋","Log out",async function(){ try{ await client().auth.signOut(); }catch(_){} updateChip(); }]
      ];
    } else {
      rows=[
        ["☁","Sign in",function(){ renderSignin(client()); }],
        ["✨","Create account",function(){ open(); }],
        ["⚙","Settings",function(){ if(window.go) go("settings"); }]
      ];
    }
    rows.forEach(function(r){ var it=mItem(r[0],r[1]); it.onclick=function(){ closeMenu(); r[2](); }; menu.appendChild(it); });
    document.body.appendChild(menu);
    setTimeout(function(){ document.addEventListener("click", outsideMenu, true); },0);
  }
  function ensureChip(){
    if(chip||typeof document==="undefined") return;
    chip=el("button","position:fixed;right:14px;top:calc(env(safe-area-inset-top,0px) + 8px);z-index:9999;width:40px;height:40px;border-radius:50%;transition:right .24s ease;border:0;cursor:pointer;font-weight:800;font-size:16px;color:#fff;background:"+C.violet+";box-shadow:0 4px 14px rgba(91,33,182,.35);display:flex;align-items:center;justify-content:center","☁");
    chip.id="mbAvatar";
    chip.onclick=function(e){ e.stopPropagation(); toggleMenu(); };
    document.body.appendChild(chip);
    updateChip();
  }
  async function updateChip(){
    if(!chip) return;
    var sb=client(); if(!sb){ chip.style.display="none"; return; }
    try{ var ses=await sb.auth.getSession();
      if(ses.data.session){ var u=ses.data.session.user; chip.textContent=initialOf((u.user_metadata&&u.user_metadata.full_name),u.email);
        // publish the signed-in name so app.html can greet the actual student (cached so the FIRST paint has it too)
        try{ var fn=(u.user_metadata&&u.user_metadata.full_name)||"";
          window.MB_USER={ name:fn, email:u.email||"" };
          if(fn) localStorage.setItem("mb_user_name", fn); else localStorage.removeItem("mb_user_name");
        }catch(_){}
      }
      else { chip.textContent="☁"; try{ window.MB_USER=null; localStorage.removeItem("mb_user_name"); }catch(_){} }
      chip.style.background=C.violet;
    }catch(_){}
  }
  function toast(m){ try{ alert(m); }catch(_){} }

  window.MB_openAuth=open;
  window.MB_openWelcome=openWelcome;
  if(typeof document!=="undefined"){
    if(configured()) document.addEventListener("DOMContentLoaded", function(){
      setTimeout(ensureChip, 800);
      try{ var sbr=client(); if(sbr && sbr.auth && sbr.auth.onAuthStateChange){ sbr.auth.onAuthStateChange(function(ev, session){
        if(ev==="PASSWORD_RECOVERY"){ try{ renderResetPassword(sbr); }catch(_){} return; }
        // Account-isolation guard for OUT-OF-BAND session changes (e.g. another tab/window signs in
        // as a different user, or a sign-out elsewhere). The normal in-app login path already runs
        // MB_SYNC.init() → uid-guard → reload; this covers the paths that don't. Without it, the tab
        // keeps rendering the PREVIOUS account's in-memory DATA (and could push it over the new
        // account's cloud state). We only reload on a genuine account CHANGE, so no reload loop.
        try{
          var prev = localStorage.getItem("mb_current_uid");
          var now  = session && session.user && session.user.id;
          if((ev==="SIGNED_IN"||ev==="TOKEN_REFRESHED"||ev==="USER_UPDATED") && now && prev && now!==prev){
            location.reload(); return;
          }
          // On sign-out, reload to drop the previous account's in-memory DATA from the screen,
          // but KEEP mb_current_uid so the next login by a DIFFERENT user still trips the
          // init() uid-guard (purge + clean load). Clearing it here would let the next student
          // merge/adopt the previous student's local data (AUTH-03).
          if(ev==="SIGNED_OUT" && prev){ location.reload(); return; }
        }catch(_){}
      }); } }catch(_){}
      try{
        var wantsWelcome = /(\?|&)welcome=1\b/.test(location.search) || /welcome/.test(location.hash);
        if(wantsWelcome){ var sb=client(); if(sb) loadServerTemplates(sb); setTimeout(openWelcome, 700); }
      }catch(_){}
    });
  }
})();
