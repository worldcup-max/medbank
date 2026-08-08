/* =====================================================================
 * MedBank — private one-time FULL restore (Frank only)
 * Runs only with ?restore=<token>. Rebuilds your personal notes into your
 * account, then re-applies your exported backup's PROGRESS (studied cards,
 * SRS boxes, streaks, done/read topics, plan, notes) by mapping the backup's
 * old topic/card IDs onto the freshly-created ones. Temporary — remove after.
 * ===================================================================== */
(function () {
  var TOKEN = "mb9f3a";
  function qs(k){ try{ return new URLSearchParams(location.search).get(k); }catch(e){ return null; } }
  if (qs("restore") !== TOKEN) return;

  var SKEY = "medbank_v1";
  var V="#5b21b6", INK="#1c1830", DIM="#5c5570", LINE="#e6e3f0";
  function el(t,css,html){ var e=document.createElement(t); if(css)e.style.cssText=css; if(html!=null)e.innerHTML=html; return e; }
  function hstr(s){ var h=5381; s=s||""; for(var i=0;i<s.length;i++) h=((h<<5)+h+s.charCodeAt(i))|0; return (h>>>0).toString(36); }
  function norm(s){ return (s||"").toLowerCase().replace(/[^a-z]/g,"").replace("paediatrics","pediatrics"); }

  function loadData(cb){
    if (window.__MB_RESTORE) return cb(window.__MB_RESTORE);
    var sc=document.createElement("script"); sc.src="./mb-personal-restore.js";
    sc.onload=function(){ cb(window.__MB_RESTORE || null); }; sc.onerror=function(){ cb(null); };
    document.head.appendChild(sc);
  }
  function readFile(file){ return new Promise(function(res,rej){ var r=new FileReader(); r.onload=function(){ res(String(r.result)); }; r.onerror=rej; r.readAsText(file); }); }

  /* ---- remap a backup DATA object using topic/subject id maps ---- */
  function remap(d, topicMap, subjMap){
    var out = Object.assign({}, d);
    function pref(k){ var i=k.indexOf("|"); if(i<0) return k; var nn=topicMap[k.slice(0,i)]; return nn ? nn+k.slice(i) : k; }
    ["cards","starred","notes","missLog"].forEach(function(key){
      if(d[key]){ var m={}; Object.keys(d[key]).forEach(function(ck){ m[pref(ck)] = d[key][ck]; }); out[key]=m; }
    });
    ["topics","done","read"].forEach(function(key){
      if(d[key]){ var m={}; Object.keys(d[key]).forEach(function(tid){ m[ topicMap[tid]||tid ] = d[key][tid]; }); out[key]=m; }
    });
    if(d.dayTopics){ var dt={}; Object.keys(d.dayTopics).forEach(function(day){ var inner=d.dayTopics[day]||{}, mm={}; Object.keys(inner).forEach(function(tid){ mm[ topicMap[tid]||tid ]=inner[tid]; }); dt[day]=mm; }); out.dayTopics=dt; }
    if(Array.isArray(d.plan)) out.plan = d.plan.map(function(tid){ return topicMap[tid]||tid; });
    if(d.exams){ var ex={}; Object.keys(d.exams).forEach(function(sid){ ex[ subjMap[sid]||sid ]=d.exams[sid]; }); out.exams=ex; }
    if(d.pos){ var p={}; Object.keys(d.pos).forEach(function(pk){
      var nk=pk;
      if(pk.indexOf("pos:")===0){ var rest=pk.slice(4), deck=""; if(rest.slice(-6)==="recall"){deck="recall";rest=rest.slice(0,-6);} else if(rest.slice(-6)==="primer"){deck="primer";rest=rest.slice(0,-6);} var nn=topicMap[rest]; if(nn) nk="pos:"+nn+deck; }
      p[nk]=d.pos[pk];
    }); out.pos=p; }
    return out;
  }

  async function run(setStat, fin, backupFile){
    try{
      var sb=window.__mbSB;
      var ses = sb ? await sb.auth.getSession() : null;
      if(!sb || !ses.data.session){ setStat("Sign in first, then reopen this link."); return fin(false); }

      setStat("Reading your backup…");
      var backup = JSON.parse(await readFile(backupFile));

      setStat("Loading your notes file…");
      var data = await new Promise(function(res){ loadData(res); });
      var subjects = (data && data.subjects) || [];
      if(!subjects.length){ setStat("Couldn't load the notes file."); return fin(false); }

      var u=(await sb.auth.getUser()).data.user, account_id=u.id;
      var acc=await sb.from("accounts").select("active_level_profile_id").eq("id",account_id).single();
      var lp=acc.data && acc.data.active_level_profile_id;
      if(!lp){ setStat("Finish setup in the app first, then try again."); return fin(false); }

      var courses=(await sb.from("courses").select("id,name").eq("level_profile_id",lp)).data||[];
      var pos0=courses.length, totT=0, totC=0;
      var topicMap={}, subjMap={};

      for(var si=0; si<subjects.length; si++){
        var su=subjects[si];
        var course=courses.find(function(c){ return norm(c.name)===norm(su.name); });
        if(!course){
          var ins=await sb.from("courses").insert({ level_profile_id:lp, account_id:account_id, name:su.name, position:pos0++ }).select("id,name").single();
          if(ins.error) throw ins.error; course=ins.data; courses.push(course);
        }
        subjMap[su.id] = "course_"+course.id;
        var existing={}; ((await sb.from("topics").select("id,title").eq("course_id",course.id)).data||[]).forEach(function(t){ existing[t.title]=t.id; });
        var tpos=0;
        for(var mi=0; mi<(su.modules||[]).length; mi++){ var tps=su.modules[mi].topics||[];
          for(var ti=0; ti<tps.length; ti++){ var t=tps[ti];
            var prim=t.primer||[], rec=t.recall||[];
            var built = t.ready && (prim.length || rec.length);
            var newId = existing[t.name];
            if(!newId){
              var tins=await sb.from("topics").insert({ course_id:course.id, account_id:account_id, title:t.name, lecturer:t.lecturer||null, status: built?"ready":"processing", source_kind:"text", note_md:t.note||null, simplified_md:t.simplified||null, position:tpos++ }).select("id").single();
              if(tins.error) throw tins.error; newId=tins.data.id; existing[t.name]=newId;
              if(built){
                var cards=[];
                prim.forEach(function(c,i){ cards.push({ topic_id:newId, account_id:account_id, deck:"primer", idx:i, card_key:newId+"|p|"+hstr(c.q), q:c.q, payload:{ lecturer:c.lecturer, explain:c.explain, tie:c.tie } }); });
                rec.forEach(function(c,i){  cards.push({ topic_id:newId, account_id:account_id, deck:"recall", idx:i, card_key:newId+"|r|"+hstr(c.q), q:c.q, payload:{ a:c.a, opts:c.opts, ans:c.ans } }); });
                for(var k=0;k<cards.length;k+=150){ var cw=await sb.from("cards").insert(cards.slice(k,k+150)); if(cw.error) throw cw.error; }
                totC+=cards.length;
              }
              totT++;
            }
            if(t.id) topicMap[t.id]=newId;    // old content id -> new account id
            setStat("Rebuilt "+totT+" topics, "+totC+" cards…");
          }
        }
      }

      setStat("Re-applying your progress to your account…");
      var restored = remap(backup, topicMap, subjMap);
      // write progress straight to the account so ALL your devices get it
      var ms = await sb.from("profile_state").select("rev").eq("level_profile_id", lp).maybeSingle();
      var rev = ((ms.data && ms.data.rev) || 0) + 1;
      var up = await sb.from("profile_state").upsert({ level_profile_id: lp, state: restored, rev: rev, device_updated_at: new Date().toISOString() }, { onConflict:"level_profile_id" });
      if(up.error){ setStat("Progress save failed: "+up.error.message); return fin(false); }
      try{ localStorage.setItem(SKEY, JSON.stringify(restored)); }catch(_){}
      setStat("Done ✓  Rebuilt "+totT+" topics, "+totC+" cards, and restored your progress. Reloading…");
      fin(true);
      setTimeout(function(){ try{ location.href = location.origin + "/app.html"; }catch(e){ location.reload(); } }, 1500);
    }catch(e){ setStat("Error: "+(e.message||e)); fin(false); }
  }

  function ui(){
    var o=el("div","position:fixed;inset:0;background:rgba(28,20,45,.62);display:flex;align-items:center;justify-content:center;z-index:100050;font-family:-apple-system,Segoe UI,Roboto,sans-serif;padding:16px");
    var s=el("div","background:#fff;width:100%;max-width:410px;border-radius:18px;padding:22px 20px;box-shadow:0 24px 70px rgba(28,20,45,.35)");
    s.appendChild(el("div","font-weight:800;font-size:19px;color:"+INK,"Restore your notes & progress"));
    s.appendChild(el("div","color:"+DIM+";font-size:14px;margin:6px 0 14px;line-height:1.5","Sign in first. Then choose your exported backup file — this rebuilds your Pediatrics, O&G and Community Medicine topics AND re-applies your studied cards, streaks and progress. Takes a minute; keep the app open."));
    s.appendChild(el("div","font-size:12.5px;font-weight:700;color:"+DIM+";margin-bottom:6px","Your backup file (.json)"));
    var file=el("input","width:100%;font-size:14px;margin-bottom:12px"); file.type="file"; file.accept="application/json,.json"; s.appendChild(file);
    var stat=el("div","font-size:13.5px;color:"+V+";font-weight:600;margin-bottom:12px;min-height:20px");
    var go=el("button","width:100%;border:0;background:"+V+";color:#fff;border-radius:12px;padding:14px;font-weight:800;font-size:15px;cursor:pointer","Restore everything");
    var close=el("div","text-align:center;color:"+DIM+";font-size:13px;margin-top:12px;cursor:pointer","Close");
    close.onclick=function(){ if(o.parentNode) o.parentNode.removeChild(o); };
    function setStat(m){ stat.textContent=m; }
    go.onclick=function(){ if(!file.files||!file.files[0]){ setStat("Choose your backup .json file first."); return; } go.disabled=true; go.textContent="Working…"; run(setStat, function(done){ if(done){ go.textContent="Done ✓"; go.style.background="#0d9488"; } else { go.disabled=false; go.textContent="Try again"; } }, file.files[0]); };
    s.appendChild(stat); s.appendChild(go); s.appendChild(close);
    o.appendChild(s); document.body.appendChild(o);
  }

  if(typeof document!=="undefined"){ document.addEventListener("DOMContentLoaded", function(){ setTimeout(ui, 1000); }); }
})();
