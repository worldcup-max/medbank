/* =====================================================================
 * MedBank — private one-time "Restore my personal notes" (Frank only)
 * Runs ONLY when the app is opened with ?restore=<token>. Loads the backed-up
 * Pediatrics / O&G / Community Medicine notes into the signed-in account via
 * that account's own session (RLS). Temporary — remove after use.
 * ===================================================================== */
(function () {
  var TOKEN = "mb9f3a";
  function qs(k){ try{ return new URLSearchParams(location.search).get(k); }catch(e){ return null; } }
  if (qs("restore") !== TOKEN) return;

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

  async function run(setStat, fin){
    try{
      var sb=window.__mbSB;
      var ses = sb ? await sb.auth.getSession() : null;
      if(!sb || !ses.data.session){ setStat("Sign in first, then reopen this link."); return fin(false); }
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

      for(var si=0; si<subjects.length; si++){
        var su=subjects[si];
        var course=courses.find(function(c){ return norm(c.name)===norm(su.name); });
        if(!course){
          var ins=await sb.from("courses").insert({ level_profile_id:lp, account_id:account_id, name:su.name, position:pos0++ }).select("id,name").single();
          if(ins.error) throw ins.error; course=ins.data; courses.push(course);
        }
        var have={}; ((await sb.from("topics").select("title").eq("course_id",course.id)).data||[]).forEach(function(t){ have[t.title]=1; });
        var tpos=0, mods=su.modules||[];
        for(var mi=0; mi<mods.length; mi++){ var tps=mods[mi].topics||[];
          for(var ti=0; ti<tps.length; ti++){ var t=tps[ti];
            if(!t.ready) continue; var prim=t.primer||[], rec=t.recall||[]; if(!prim.length && !rec.length) continue;
            if(have[t.name]) continue;
            var tins=await sb.from("topics").insert({ course_id:course.id, account_id:account_id, title:t.name, lecturer:t.lecturer||null, status:"ready", source_kind:"text", note_md:t.note||null, simplified_md:t.simplified||null, position:tpos++ }).select("id").single();
            if(tins.error) throw tins.error; var tid=tins.data.id, cards=[];
            prim.forEach(function(c,i){ cards.push({ topic_id:tid, account_id:account_id, deck:"primer", idx:i, card_key:tid+"|p|"+hstr(c.q), q:c.q, payload:{ lecturer:c.lecturer, explain:c.explain, tie:c.tie } }); });
            rec.forEach(function(c,i){  cards.push({ topic_id:tid, account_id:account_id, deck:"recall", idx:i, card_key:tid+"|r|"+hstr(c.q), q:c.q, payload:{ a:c.a, opts:c.opts, ans:c.ans } }); });
            for(var k=0;k<cards.length;k+=150){ var cw=await sb.from("cards").insert(cards.slice(k,k+150)); if(cw.error) throw cw.error; }
            totT++; totC+=cards.length; setStat("Added "+totT+" topics, "+totC+" cards…");
          }
        }
      }
      setStat("Done ✓  "+totT+" topics and "+totC+" cards restored. Reopen the app to see them.");
      try{ if(window.MB_loadProfileContent) MB_loadProfileContent(); }catch(e){}
      fin(true);
    }catch(e){ setStat("Error: "+(e.message||e)); fin(false); }
  }

  function ui(){
    var o=el("div","position:fixed;inset:0;background:rgba(28,20,45,.62);display:flex;align-items:center;justify-content:center;z-index:100050;font-family:-apple-system,Segoe UI,Roboto,sans-serif;padding:16px");
    var s=el("div","background:#fff;width:100%;max-width:400px;border-radius:18px;padding:22px 20px;box-shadow:0 24px 70px rgba(28,20,45,.35)");
    s.appendChild(el("div","font-weight:800;font-size:19px;color:"+INK,"Restore your personal notes"));
    s.appendChild(el("div","color:"+DIM+";font-size:14px;margin:6px 0 14px;line-height:1.5","Loads your Pediatrics, O&G and Community Medicine notes into your account. Make sure you're signed in first. This can take a minute — keep the app open."));
    var stat=el("div","font-size:13.5px;color:"+V+";font-weight:600;margin-bottom:12px;min-height:20px");
    var go=el("button","width:100%;border:0;background:"+V+";color:#fff;border-radius:12px;padding:14px;font-weight:800;font-size:15px;cursor:pointer","Restore my notes");
    var close=el("div","text-align:center;color:"+DIM+";font-size:13px;margin-top:12px;cursor:pointer","Close");
    close.onclick=function(){ if(o.parentNode) o.parentNode.removeChild(o); };
    function setStat(m){ stat.textContent=m; }
    go.onclick=function(){ go.disabled=true; go.textContent="Working…"; run(setStat, function(done){ if(done){ go.textContent="Done ✓"; go.style.background="#0d9488"; } else { go.disabled=false; go.textContent="Try again"; } }); };
    s.appendChild(stat); s.appendChild(go); s.appendChild(close);
    o.appendChild(s); document.body.appendChild(o);
  }

  if(typeof document!=="undefined"){ document.addEventListener("DOMContentLoaded", function(){ setTimeout(ui, 1000); }); }
})();
