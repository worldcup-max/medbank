/* =====================================================================
 * MedBank — Add a lecture (Phase 5, client)
 * Upload sheet: pick a course, choose/add the lecturer, name the topic,
 * choose a PDF or photos, and send to the import server. Gated by the paywall.
 * The lecturer list is remembered per course (from your existing topics),
 * with an option to add a new lecturer. On success it refreshes the app.
 *
 * Config: MEDBANK_CONFIG.IMPORT_API (the import server URL).
 * Wire a button/tab to window.MB_openImport().
 * ===================================================================== */
(function () {
  var CFG = (typeof window !== "undefined" && window.MEDBANK_CONFIG) || {};
  var V = "#5b21b6", INK = "#1c1830", DIM = "#5c5570", LINE = "#e6e3f0";
  function el(t,css,html){ var e=document.createElement(t); if(css)e.style.cssText=css; if(html!=null)e.innerHTML=html; return e; }
  function fileToB64(file){ return new Promise(function(res,rej){ var r=new FileReader(); r.onload=function(){ res(String(r.result).split(",")[1]); }; r.onerror=rej; r.readAsDataURL(file); }); }

  function profileId(){ return (window.MB_SYNC && MB_SYNC.currentProfileId && MB_SYNC.currentProfileId()) || null; }

  async function courses(){
    if(!window.__mbSB) return [];
    var pid = profileId(); if(!pid) return [];
    var r = await window.__mbSB.from("courses").select("id,name").eq("level_profile_id", pid).order("position");
    return r.data || [];
  }
  async function lecturersFor(course_id){
    if(!window.__mbSB || !course_id) return [];
    var r = await window.__mbSB.from("topics").select("lecturer").eq("course_id", course_id);
    var seen = {}, out = [];
    (r.data || []).forEach(function(t){ var n=(t.lecturer||"").trim(); if(n && !seen[n.toLowerCase()]){ seen[n.toLowerCase()]=1; out.push(n); } });
    return out.sort();
  }

  async function openImport(opts){
    opts = opts || {};
    /* no pre-block: the first free lecture is allowed; the server returns 402 (upgrade) when the free build is used up */
    if(typeof document === "undefined") return;
    var cs = await courses();
    var isAdmin=false; try{ var _me=await window.__mbSB.from("accounts").select("is_admin").maybeSingle(); isAdmin=!!(_me.data&&_me.data.is_admin); }catch(e){}

    var o = el("div","position:fixed;inset:0;background:rgba(28,20,45,.55);display:flex;align-items:flex-end;justify-content:center;z-index:100001;font-family:-apple-system,Segoe UI,Roboto,sans-serif");
    var s = el("div","background:#fff;width:100%;max-width:460px;max-height:94vh;overflow-y:auto;border-radius:18px 18px 0 0;padding:20px 18px 26px;box-shadow:0 -12px 44px rgba(28,20,45,.28)");
    s.appendChild(el("div","font-weight:800;font-size:19px;color:"+INK+";margin-bottom:2px","Add a lecture"));
    s.appendChild(el("div","color:"+DIM+";font-size:13.5px;margin-bottom:6px","Upload a PDF or photos of your notes — MedBank builds your note, a simplified version, flashcards and a cram sheet."));

    var lbl="font-size:12.5px;font-weight:700;color:"+DIM+";margin:13px 0 6px";
    var inCss="width:100%;padding:12px;border:1px solid "+LINE+";border-radius:11px;font-size:15px;box-sizing:border-box;background:#fff;color:"+INK;

    /* Course */
    s.appendChild(el("div",lbl,"Course"));
    var sel=el("select",inCss);
    cs.forEach(function(c){ var op=document.createElement("option"); op.value=c.id; op.textContent=c.name; sel.appendChild(op); });
    if(!cs.length){ var op=document.createElement("option"); op.value=""; op.textContent="(no courses — add one in Settings first)"; sel.appendChild(op); }
    s.appendChild(sel);

    /* Lecturer (list per course + add new) */
    s.appendChild(el("div",lbl,"Lecturer"));
    var lecSel=el("select",inCss);
    var lecNew=el("input",inCss+";margin-top:8px;display:none"); lecNew.placeholder="New lecturer's name (e.g. Dr. Ojike)";
    s.appendChild(lecSel); s.appendChild(lecNew);

    function syncLecNew(){ lecNew.style.display = (lecSel.value==="__new__") ? "block" : "none"; if(lecSel.value==="__new__") lecNew.focus(); }
    async function loadLecturers(){
      lecSel.innerHTML=""; lecNew.value=""; lecNew.style.display="none";
      var list = await lecturersFor(sel.value);
      list.forEach(function(n){ var op=document.createElement("option"); op.value=n; op.textContent=n; lecSel.appendChild(op); });
      var add=document.createElement("option"); add.value="__new__"; add.textContent = list.length ? "＋ Add a new lecturer" : "＋ Add the lecturer"; lecSel.appendChild(add);
      if(!list.length){ lecSel.value="__new__"; }
      syncLecNew();
    }
    lecSel.onchange=syncLecNew;
    sel.onchange=loadLecturers;
    await loadLecturers();

    /* Topic name */
    s.appendChild(el("div",lbl,"Topic / lecture title"));
    var name=el("input",inCss); name.placeholder="e.g. Bronchiolitis"; s.appendChild(name);

    /* Source: recorded audio (record-first) OR file upload + record button */
    var recAudio = opts.audioBlob || null, recMime = opts.audioMime || "", recDur = opts.durationSec || 0;
    var srcMode = "file", yt = null, pasteTa = null;   // set by the source selector below
    var file=el("input","width:100%;font-size:14px;margin-top:2px"); file.type="file"; file.accept=".pdf,image/*"; file.multiple=true;
    function two(n){ return String(n).padStart(2,"0"); }
    if(recAudio){
      s.appendChild(el("div",lbl,"Recorded lecture"));
      var mm=Math.floor(recDur/60), ss=recDur%60;
      s.appendChild(el("div","display:flex;align-items:center;gap:10px;padding:12px;border:1px solid "+LINE+";border-radius:11px;background:#f6f3fe;color:"+INK+";font-size:14px",
        "<span style='width:34px;height:34px;border-radius:50%;background:"+V+";color:#fff;display:flex;align-items:center;justify-content:center;font-size:16px'>🎙</span>"+
        "<div><div style='font-weight:700'>Lecture recording</div><div style='font-size:12.5px;color:"+DIM+"'>"+two(mm)+":"+two(ss)+" · ready to transcribe</div></div>"));
      /* optionally combine the recording with the lecturer's slides / note photos */
      s.appendChild(el("div",lbl,"Add the lecturer's PDF or note photos on this topic (optional)"));
      s.appendChild(file);
      s.appendChild(el("div","font-size:12px;color:"+DIM+";margin-top:6px","MedBank will build one study set from the recording and anything you add here."));
    } else {
      /* one universal source selector: File / YouTube / Paste / Record */
      s.appendChild(el("div",lbl,"Lecture source"));
      var segWrap=el("div","display:flex;gap:6px;flex-wrap:wrap");
      var yt=el("input",inCss+";margin-top:10px;display:none"); yt.placeholder="Paste a YouTube link (video with captions)";
      var pasteTa=el("textarea",inCss+";margin-top:10px;min-height:130px;resize:vertical;font-family:inherit;display:none"); pasteTa.placeholder="Paste the lecture text, transcript or your notes here…";
      var fileHint=el("div","font-size:12px;color:"+DIM+";margin-top:6px","PDF of the slides, or clear photos of your notes.");
      function paintSeg(){
        file.style.display   = srcMode==="file"?"block":"none";
        fileHint.style.display = srcMode==="file"?"block":"none";
        yt.style.display     = srcMode==="youtube"?"block":"none";
        pasteTa.style.display= srcMode==="paste"?"block":"none";
        Array.prototype.forEach.call(segWrap.children,function(b){ var on=b.dataset.m===srcMode; b.style.background=on?V:"#fff"; b.style.color=on?"#fff":INK; b.style.borderColor=on?V:LINE; });
      }
      function seg(id,label){
        var b=el("button","flex:1;min-width:70px;border:1px solid "+LINE+";background:#fff;color:"+INK+";border-radius:10px;padding:9px 6px;font-weight:700;font-size:13px;cursor:pointer",label);
        b.dataset.m=id;
        b.onclick=function(){ if(id==="record"){ if(o.parentNode) document.body.removeChild(o); if(window.MB_openRecorder) MB_openRecorder(); return; } srcMode=id; paintSeg(); };
        return b;
      }
      [seg("file","📄 File"),seg("youtube","▶ YouTube"),seg("paste","✍ Paste"),seg("record","🎙 Record")].forEach(function(b){ segWrap.appendChild(b); });
      s.appendChild(segWrap);
      s.appendChild(file); s.appendChild(fileHint); s.appendChild(yt); s.appendChild(pasteTa);
      paintSeg();
    }

    /* what-to-build selector (core locked, extras optional) */
    s.appendChild(el("div",lbl,"What should MedBank build?"));
    var grid=el("div","display:grid;grid-template-columns:1fr 1fr;gap:8px;margin-top:2px");
    var builds={ qbank:false, written:false };
    function bcard(icon,label,key){
      var locked=!key;
      var c=el("div","display:flex;align-items:center;gap:9px;padding:11px;border-radius:11px;cursor:"+(locked?"default":"pointer"));
      function paint(){
        var on = locked || builds[key];
        c.style.border="1.5px solid "+(on?V:LINE); c.style.background=on?"#faf8ff":"#fff";
        c.innerHTML="<span style='width:28px;height:28px;border-radius:8px;flex:none;background:"+(on?V:"#efeaf3")+";color:"+(on?"#fff":DIM)+";display:flex;align-items:center;justify-content:center;font-size:14px'>"+icon+"</span>"+
          "<span style='font-weight:700;font-size:13.5px;color:"+INK+"'>"+label+"</span>"+
          (locked?"<span style='margin-left:auto;font-size:11px'>🔒</span>":"<span style='margin-left:auto;width:19px;height:19px;border-radius:6px;border:2px solid "+(on?V:"#cfc7de")+";background:"+(on?V:"#fff")+";color:#fff;display:flex;align-items:center;justify-content:center;font-size:11px;font-weight:800'>"+(on?"✓":"")+"</span>");
      }
      if(!locked) c.onclick=function(){ builds[key]=!builds[key]; paint(); };
      paint(); return c;
    }
    [bcard("📖","Notes"),bcard("🃏","Flashcards"),bcard("✓","Quiz"),bcard("📄","Cram sheet"),bcard("🧠","Q-bank","qbank"),bcard("📝","Written test","written")].forEach(function(c){ grid.appendChild(c); });
    s.appendChild(grid);
    s.appendChild(el("div","font-size:11.5px;color:"+DIM+";margin-top:7px","🔒 Always built. Tick extras to build now — or add them later from the topic."));

    var modelSel=null;
    if(isAdmin){
      s.appendChild(el("div",lbl,"Model (admin A/B)"));
      modelSel=el("select",inCss);
      [["","Default (trial / paid setting)"],["claude-sonnet-5","Claude Sonnet 5"],["claude-haiku-4-5-20251001","Claude Haiku 4.5"],["gpt-5-mini","OpenAI GPT-5 mini"],["deepseek-chat","DeepSeek"],["gemini-2.5-flash","Gemini 2.5 Flash"],["gemini-2.5-flash-lite","Gemini 2.5 Flash-Lite"]].forEach(function(o){ var op=document.createElement("option"); op.value=o[0]; op.textContent=o[1]; modelSel.appendChild(op); });
      s.appendChild(modelSel);
    }

    var msg=el("div","margin-top:12px;font-size:13.5px;color:#b3391f;display:none;background:#fdece7;border-radius:9px;padding:9px 11px"); s.appendChild(msg);
    function show(m){ msg.textContent=m; msg.style.display="block"; }

    var go=el("button","width:100%;margin-top:16px;border:0;background:"+V+";color:#fff;border-radius:12px;padding:14px;font-weight:800;cursor:pointer;font-size:15px","Build my study set");
    go.onclick=async function(){
      msg.style.display="none";
      var course_id=sel.value, topicName=(name.value||"").trim();
      var lecturer = lecSel.value==="__new__" ? (lecNew.value||"").trim() : lecSel.value;
      if(!course_id){ show("Pick a course."); return; }
      if(!lecturer){ show("Choose or add the lecturer's name."); return; }
      if(!topicName){ show("Enter the topic / lecture title."); return; }
      var ytVal = yt ? (yt.value||"").trim() : "", pasteVal = pasteTa ? (pasteTa.value||"").trim() : "";
      if(!recAudio){
        if(srcMode==="file" && (!file.files || !file.files.length)){ show("Choose a PDF or some photos."); return; }
        if(srcMode==="youtube" && !/(?:youtube\.com|youtu\.be)\//i.test(ytVal)){ show("Paste a valid YouTube link."); return; }
        if(srcMode==="paste" && pasteVal.length<40){ show("Paste a bit more of the lecture text to build from."); return; }
      }
      if(!CFG.IMPORT_API){ show("Import isn't configured yet. Try again shortly."); return; }
      var slow = recAudio || srcMode==="youtube";
      go.disabled=true; go.textContent = slow ? "Transcribing & building… ~1–2 min" : "Building… this can take ~30–60s";
      try{
        var body={ topicName:topicName, course_id:course_id, lecturer:lecturer, subject:(sel.options[sel.selectedIndex]||{}).textContent };
        try{ var _lv=(window.MB_SYNC&&MB_SYNC.currentLevel&&MB_SYNC.currentLevel()); if(_lv!=null&&_lv!=="") body.level=_lv; }catch(e){}   // per-level prompt selection
        var _b=[]; if(builds.qbank)_b.push("qbank"); if(builds.written)_b.push("written"); if(_b.length) body.builds=_b;   // optional extras ticked in the box
        if(modelSel && modelSel.value) body.model=modelSel.value;
        if(recAudio){ body.audio_base64 = await fileToB64(recAudio); body.audio_mime = recMime; }
        if(!recAudio && srcMode==="youtube"){ body.youtube_url = ytVal; }
        if(!recAudio && srcMode==="paste"){ body.text = pasteVal; }
        // files: used in file mode, and as an optional add-on to a recording
        var files=[].slice.call(file.files||[]);
        var pdf=files.find(function(f){ return /\.pdf$/i.test(f.name); });
        if(pdf){ body.pdf_base64=await fileToB64(pdf); }
        var imgs=files.filter(function(f){ return /^image\//.test(f.type); });
        if(imgs.length){ body.images=[]; for(var i=0;i<imgs.length;i++) body.images.push({ media_type:imgs[i].type, data:await fileToB64(imgs[i]) }); }

        var token=null;
        if(window.__mbSB){ var ses=await window.__mbSB.auth.getSession(); token=ses.data.session && ses.data.session.access_token; }
        var resp=await fetch(CFG.IMPORT_API.replace(/\/$/,"")+"/import",{
          method:"POST", headers:{ "Content-Type":"application/json", "Authorization":"Bearer "+token }, body:JSON.stringify(body) });
        var out=await resp.json();
        if(!resp.ok){
          if(out.error==="upgrade" && window.MB_PAYWALL){ if(o.parentNode) document.body.removeChild(o); MB_PAYWALL.nudge("Upgrade to import more", out.reason||"Subscribe to build more lectures — your built work stays free.", "Subscribe"); return; }
          show(out.reason||out.error||"That didn't work. Try again."); go.disabled=false; go.textContent="Build my study set"; return; }
        if(o.parentNode) document.body.removeChild(o);
        try{ if(typeof window.onImported==="function") window.onImported(out.topic_id); }catch(e){}
        try{ location.hash="#/subject/course_"+course_id; }catch(e){}
        alert("Done! Built "+out.primer+" primer + "+out.recall+" recall cards for "+topicName+". Open it to start studying.");
      }catch(e){ show(e.message||"Something went wrong."); go.disabled=false; go.textContent="Build my study set"; }
    };
    s.appendChild(go);
    if(opts.mandatory){
      s.appendChild(el("div","margin-top:10px;text-align:center;font-size:12px;color:"+DIM,"Add your first lecture to start building your cards."));
    } else {
      var close=el("button","width:100%;margin-top:9px;border:0;background:#f2eafe;color:"+V+";border-radius:12px;padding:12px;font-weight:700;cursor:pointer","Maybe later");
      close.onclick=function(){ if(o.parentNode) document.body.removeChild(o); };
      s.appendChild(close);
      o.onclick=function(e){ if(e.target===o && o.parentNode) document.body.removeChild(o); };
    }
    o.appendChild(s); document.body.appendChild(o);
  }

  window.MB_openImport = openImport;
})();
