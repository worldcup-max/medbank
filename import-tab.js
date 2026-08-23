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
  /* Only a PDF or an image can actually be sent to the import server. Anything else
   * (.pptx, .docx, .txt ...) used to pass the "did you pick a file?" check and then get
   * dropped from the request body, so the model was asked to build from nothing and the
   * student saw "model returned invalid JSON". Detect by MIME type as well as by name,
   * because some phone pickers hand over a file with no extension. */
  function isPdfFile(f){ return /\.pdf$/i.test(f.name||"") || f.type==="application/pdf"; }
  function isImgFile(f){ return /^image\//.test(f.type||"") || /\.(png|jpe?g|webp|heic|heif|gif|bmp)$/i.test(f.name||""); }
  function usableFiles(list){ return [].slice.call(list||[]).filter(function(f){ return isPdfFile(f)||isImgFile(f); }); }
  var IMG_MIME={png:"image/png",jpg:"image/jpeg",jpeg:"image/jpeg",webp:"image/webp",heic:"image/heic",heif:"image/heif",gif:"image/gif",bmp:"image/bmp"};
  function imgMime(f){ if(/^image\//.test(f.type||"")) return f.type;
    var m=/\.([a-z0-9]+)$/i.exec(f.name||""); return (m && IMG_MIME[m[1].toLowerCase()]) || "image/jpeg"; }

  function profileId(){ return (window.MB_SYNC && MB_SYNC.currentProfileId && MB_SYNC.currentProfileId()) || null; }

  async function courses(){
    if(!window.__mbSB) return [];
    var pid = profileId(); if(!pid) return [];
    /* Never let a network/Supabase rejection escape: openImport awaits this before it
     * appends the sheet, so a throw here meant tapping "Add a lecture" did nothing at all. */
    try{
      var r = await window.__mbSB.from("courses").select("id,name").eq("level_profile_id", pid).order("position");
      return r.data || [];
    }catch(e){ return []; }
  }
  /* Create a course on the fly. Until now courses could ONLY be made during signup
   * (saveOnboarding in auth-ui.js), so a student with no course - or one taking a new
   * course later - could never build a lecture and had nowhere to add one. */
  async function createCourse(nm){
    if(!window.__mbSB) throw new Error("Not connected — sign in and try again.");
    var pid = profileId();
    if(!pid) throw new Error("Your profile isn't ready yet — sign out and back in, then try again.");
    var u = (await window.__mbSB.auth.getUser()).data.user;
    if(!u) throw new Error("You're signed out — sign in and try again.");
    var have = await window.__mbSB.from("courses").select("id,name,position").eq("level_profile_id", pid);
    var rows = have.data || [];
    var dup = rows.find(function(c){ return (c.name||"").trim().toLowerCase() === nm.toLowerCase(); });
    if(dup) return dup.id;                       // already there → reuse it, never duplicate
    var pos = rows.reduce(function(m,c){ return Math.max(m, (c.position==null?-1:c.position)); }, -1) + 1;
    var r = await window.__mbSB.from("courses").insert({ level_profile_id:pid, account_id:u.id, name:nm, position:pos }).select("id").single();
    if(r.error) throw r.error;
    return r.data.id;
  }

  async function lecturersFor(course_id){
    if(!window.__mbSB || !course_id || course_id==="__new__") return [];
    var r;
    /* same reason as courses(): a rejection here aborted openImport before the sheet
     * was ever added to the page, and left the lecturer <select> completely empty. */
    try{ r = await window.__mbSB.from("topics").select("lecturer").eq("course_id", course_id); }
    catch(e){ return []; }
    var seen = {}, out = [];
    ((r && r.data) || []).forEach(function(t){ var n=(t.lecturer||"").trim(); if(n && !seen[n.toLowerCase()]){ seen[n.toLowerCase()]=1; out.push(n); } });
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
    s.appendChild(el("div","width:38px;height:4px;border-radius:3px;background:"+LINE+";margin:-6px auto 12px"));   // bottom-sheet drag handle
    s.appendChild(el("div","font-weight:800;font-size:19px;color:"+INK+";margin-bottom:2px","Add a lecture"));
    s.appendChild(el("div","color:"+DIM+";font-size:13.5px;margin-bottom:6px","Upload a PDF or photos of your notes — MedBank builds your note, a simplified version, flashcards and a cram sheet."));

    var lbl="font-size:12.5px;font-weight:700;color:"+DIM+";margin:13px 0 6px";
    var inCss="width:100%;padding:12px;border:1px solid "+LINE+";border-radius:11px;font-size:15px;box-sizing:border-box;background:#fff;color:"+INK;

    /* Course */
    s.appendChild(el("div",lbl,"Course"));
    var sel=el("select",inCss);
    cs.forEach(function(c){ var op=document.createElement("option"); op.value=c.id; op.textContent=c.name; sel.appendChild(op); });
    var addC=document.createElement("option"); addC.value="__new__"; addC.textContent = cs.length ? "\uff0b Add a new course" : "\uff0b Add your first course"; sel.appendChild(addC);
    var courseNew=el("input",inCss+";margin-top:8px;display:none"); courseNew.placeholder="New course name (e.g. Dermatology)";
    if(!cs.length){ sel.value="__new__"; }
    s.appendChild(sel); s.appendChild(courseNew);
    function syncCourseNew(){ courseNew.style.display = (sel.value==="__new__") ? "block" : "none"; if(sel.value==="__new__") courseNew.focus(); }

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
    sel.onchange=function(){ syncCourseNew(); loadLecturers(); };
    syncCourseNew();
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
      var fileHint=el("div","font-size:12px;color:"+DIM+";margin-top:6px","PDF of the slides, or clear photos of your notes. PowerPoint or Word? Save it as a PDF first.");
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
        /* Only tear this sheet down if the recorder actually exists. If lecture-record.js
         * failed to load, the old code closed the sheet and opened nothing — the student
         * lost everything they'd typed and got no feedback (and in mandatory mode, no way back). */
        b.onclick=function(){
          if(id==="record"){
            if(!window.MB_openRecorder){ show("Recording isn't available right now — reload the app, or use File / YouTube / Paste."); return; }
            if(o.parentNode) document.body.removeChild(o);
            MB_openRecorder(); return;
          }
          srcMode=id; paintSeg();
        };
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

    /* ---- polished build experience: animated steps + rotating tips, then an in-app success screen
            (replaces the button-text "Building…" state and the native alert). ---- */
    var TINT="#ece3fb", TINTB="#ddd0f5", VD="#4c1d95", TEAL="#0d9488";
    function esc2(x){ return String(x==null?"":x).replace(/[&<>"]/g,function(c){return {"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;"}[c];}); }
    function startBuilding(topicTitle, slow){
      s.style.position="relative";
      var p=el("div","position:absolute;inset:0;background:#fff;border-radius:18px 18px 0 0;display:flex;flex-direction:column;align-items:center;justify-content:center;text-align:center;padding:30px 24px;z-index:6");
      var defs=["Reading your lecture","Writing your notes","Building flashcards"];
      if(builds.qbank) defs.push("Writing the Q-bank");
      if(builds.written) defs.push("Writing the written test");
      var stepsHtml=defs.map(function(t,i){ return '<div class="mbi-step" style="display:flex;align-items:center;gap:11px;padding:7px 0;font-size:14px;color:'+DIM+'"><span class="mbi-ic" style="width:22px;height:22px;border-radius:50%;border:2px solid '+LINE+';flex:none;display:flex;align-items:center;justify-content:center;font-size:12px;color:'+DIM+'">'+(i+1)+'</span><span>'+t+'</span></div>'; }).join("");
      p.innerHTML=
        '<div style="width:52px;height:52px;border-radius:16px;background:'+V+';color:#fff;display:flex;align-items:center;justify-content:center;font-size:24px">🧠</div>'+
        '<div style="font-weight:800;font-size:17px;margin:14px 0 2px;color:'+INK+'">Building your study set…</div>'+
        '<div style="font-size:13px;color:'+DIM+';margin-bottom:14px">'+esc2(topicTitle)+' · usually '+(slow?"1–2 minutes":"30–60 seconds")+'</div>'+
        '<div style="width:100%;max-width:250px;text-align:left">'+stepsHtml+'</div>'+
        '<div style="height:6px;border-radius:6px;background:'+TINT+';overflow:hidden;width:100%;max-width:250px;margin-top:16px"><i class="mbi-bar" style="display:block;height:100%;background:'+V+';width:8%;transition:width .5s ease"></i></div>'+
        '<div class="mbi-tip" style="margin-top:16px;background:'+TINT+';border:1px solid '+TINTB+';border-radius:12px;padding:11px 13px;font-size:12.5px;color:'+VD+';line-height:1.45;max-width:270px;min-height:56px;display:flex;align-items:center;text-align:left;transition:opacity .2s"></div>';
      s.appendChild(p);
      var stepEls=p.querySelectorAll(".mbi-step"), bar=p.querySelector(".mbi-bar"), tipEl=p.querySelector(".mbi-tip");
      var n=stepEls.length, cur=0;
      function paint(){ Array.prototype.forEach.call(stepEls,function(elx,i){ var ic=elx.querySelector(".mbi-ic");
        if(i<cur){ elx.style.color=INK; elx.style.fontWeight="400"; ic.style.background=TEAL; ic.style.borderColor=TEAL; ic.style.color="#fff"; ic.textContent="✓"; }
        else if(i===cur){ elx.style.color=INK; elx.style.fontWeight="700"; ic.style.borderColor=V; ic.style.color=V; ic.style.background="#fff"; ic.textContent=(i+1); }
        else { elx.style.color=DIM; elx.style.fontWeight="400"; ic.style.borderColor=LINE; ic.style.color=DIM; ic.style.background="#fff"; ic.textContent=(i+1); } });
        bar.style.width=Math.min(94,(cur/n)*100+8)+"%"; }
      paint();
      var per=(slow?18000:11000);
      var stepT=setInterval(function(){ if(cur<n-1){ cur++; paint(); } }, per);
      var tips=["💡 Spaced repetition beats cramming — small daily reviews stick far longer.",
                "🩺 Your Q-bank is written in exam-style single-best-answer questions.",
                "🎯 Smart Drill finds what you get wrong while feeling sure — then fixes it.",
                "📈 Confidence and accuracy together show what you truly know.",
                "⏱ Almost there — most lectures finish in under a minute."];
      var ti=0; tipEl.textContent=tips[0];
      var tipT=setInterval(function(){ ti=(ti+1)%tips.length; tipEl.style.opacity="0"; setTimeout(function(){ tipEl.textContent=tips[ti]; tipEl.style.opacity="1"; },200); }, 3200);
      return {
        stop:function(){ clearInterval(stepT); clearInterval(tipT); if(p.parentNode) p.parentNode.removeChild(p); },
        success:function(out, topicTitle2, cid){ clearInterval(stepT); clearInterval(tipT); cur=n; paint();
          var pr=Number(out.primer), rc=Number(out.recall), chips="";
          if(isFinite(pr)) chips+='<span class="mbi-chip">'+pr+' primer</span>';
          if(isFinite(rc)) chips+='<span class="mbi-chip">'+rc+' recall</span>';
          if(builds.qbank) chips+='<span class="mbi-chip">Q-bank</span>';
          if(builds.written) chips+='<span class="mbi-chip">Written</span>';
          p.innerHTML=
            '<div style="width:60px;height:60px;border-radius:50%;background:'+TEAL+';color:#fff;display:flex;align-items:center;justify-content:center;font-size:30px">✓</div>'+
            '<div style="font-weight:800;font-size:18px;margin:14px 0 2px;color:'+INK+'">Your study set is ready</div>'+
            (chips?'<div style="display:flex;gap:8px;justify-content:center;flex-wrap:wrap;margin:12px 0 4px">'+chips+'</div>':"")+
            '<div style="font-size:13.5px;color:'+DIM+';margin:6px 0 18px">'+esc2(topicTitle2)+' is built and ready to study.</div>'+
            '<button class="mbi-open" style="width:100%;max-width:280px;border:0;border-radius:12px;padding:14px;font-weight:800;font-size:15px;cursor:pointer;background:'+V+';color:#fff">Open topic →</button>'+
            '<div class="mbi-again" style="color:'+DIM+';font-size:13px;margin-top:14px;cursor:pointer">Add another lecture</div>';
          var stEl=document.createElement("style"); stEl.textContent=".mbi-chip{background:"+TINT+";border:1px solid "+TINTB+";color:"+VD+";border-radius:999px;padding:5px 12px;font-size:12.5px;font-weight:700}"; p.appendChild(stEl);
          p.querySelector(".mbi-open").onclick=function(){ if(o.parentNode) document.body.removeChild(o); try{ if(window.onImported) onImported(out.topic_id); }catch(e){} try{ location.hash="#/topic/"+out.topic_id; }catch(e){} };
          p.querySelector(".mbi-again").onclick=function(){ if(o.parentNode) document.body.removeChild(o); openImport(); };
        }
      };
    }

    var go=el("button","width:100%;margin-top:16px;border:0;background:"+V+";color:#fff;border-radius:12px;padding:14px;font-weight:800;cursor:pointer;font-size:15px","Build my study set");
    go.onclick=async function(){
      msg.style.display="none";
      var course_id=sel.value, topicName=(name.value||"").trim();
      var newCourse = (sel.value==="__new__") ? (courseNew.value||"").trim() : "";
      var lecturer = lecSel.value==="__new__" ? (lecNew.value||"").trim() : lecSel.value;
      if(!course_id){ show("Pick a course."); return; }
      if(sel.value==="__new__" && !newCourse){ show("Type the new course's name."); return; }
      if(!lecturer){ show("Choose or add the lecturer's name."); return; }
      if(!topicName){ show("Enter the topic / lecture title."); return; }
      var ytVal = yt ? (yt.value||"").trim() : "", pasteVal = pasteTa ? (pasteTa.value||"").trim() : "";
      if(!recAudio){
        if(srcMode==="file" && (!file.files || !file.files.length)){ show("Choose a PDF or some photos."); return; }
        if(srcMode==="file" && !usableFiles(file.files).length){ show("MedBank can't read \u201c"+((file.files[0]||{}).name||"that file")+"\u201d yet. Save it as a PDF first (PowerPoint / Word: File \u2192 Save as \u2192 PDF), or attach clear photos of the slides."); return; }
        if(srcMode==="youtube" && !/(?:youtube\.com|youtu\.be)\//i.test(ytVal)){ show("Paste a valid YouTube link."); return; }
        if(srcMode==="paste" && pasteVal.length<40){ show("Paste a bit more of the lecture text to build from."); return; }
      }
      if(!CFG.IMPORT_API){ show("Import isn't configured yet. Try again shortly."); return; }
      var slow = recAudio || srcMode==="youtube";
      var buildUI = startBuilding(topicName, slow);
      try{
        var subjectName = newCourse || (sel.options[sel.selectedIndex]||{}).textContent;
        if(sel.value==="__new__"){
          course_id = await createCourse(newCourse);
        }
        var body={ topicName:topicName, course_id:course_id, lecturer:lecturer, subject:subjectName };
        try{ var _lv=(window.MB_SYNC&&MB_SYNC.currentLevel&&MB_SYNC.currentLevel()); if(_lv!=null&&_lv!=="") body.level=_lv; }catch(e){}   // per-level prompt selection
        var _b=[]; if(builds.qbank)_b.push("qbank"); if(builds.written)_b.push("written"); if(_b.length) body.builds=_b;   // optional extras ticked in the box
        if(modelSel && modelSel.value) body.model=modelSel.value;
        if(recAudio){ body.audio_base64 = await fileToB64(recAudio); body.audio_mime = recMime; }
        if(!recAudio && srcMode==="youtube"){ body.youtube_url = ytVal; }
        if(!recAudio && srcMode==="paste"){ body.text = pasteVal; }
        // files: used in file mode, and as an optional add-on to a recording.
        // The file <input> keeps its selection when the student switches to YouTube/Paste
        // (it's only hidden), so without this mode check an abandoned PDF was silently
        // uploaded alongside the link/text and fed to the model.
        var files=(recAudio || srcMode==="file") ? usableFiles(file.files) : [];
        var pdf=files.find(isPdfFile);
        if(pdf){ body.pdf_base64=await fileToB64(pdf); }
        var imgs=files.filter(isImgFile);
        if(imgs.length){ body.images=[]; for(var i=0;i<imgs.length;i++) body.images.push({ media_type:imgMime(imgs[i]), data:await fileToB64(imgs[i]) }); }

        /* Never send an import with nothing to build from - that is what produced the
         * confusing "model returned invalid JSON" instead of a useful message. */
        if(!body.pdf_base64 && !(body.images&&body.images.length) && !body.text && !body.youtube_url && !body.audio_base64){
          buildUI.stop(); show("Nothing to build from \u2014 attach a PDF or photos, paste the lecture text, or record the lecture."); return; }

        var token=null;
        if(window.__mbSB){ var ses=await window.__mbSB.auth.getSession(); token=ses.data.session && ses.data.session.access_token; }
        /* Without this we sent the literal header "Bearer null" and the student got the
         * server's raw 401 instead of being told their session had expired. */
        if(!token){ buildUI.stop(); show("You're signed out — sign in and try again."); return; }
        var resp=await fetch(CFG.IMPORT_API.replace(/\/$/,"")+"/import",{
          method:"POST", headers:{ "Content-Type":"application/json", "Authorization":"Bearer "+token }, body:JSON.stringify(body) });
        /* A proxy 413/502/504 returns HTML, not JSON: resp.json() then threw and the
         * student saw "Unexpected token '<'…". Fall back to a message about the status. */
        var out;
        try{ out = await resp.json(); }catch(e){ out = null; }
        if(!out){
          buildUI.stop();
          show(resp.ok ? "The build finished but the reply couldn't be read. Check your topics before rebuilding."
                       : (resp.status===413 ? "That upload is too large. Try a smaller PDF or fewer photos."
                                            : "The import server didn't respond properly ("+resp.status+"). Try again in a moment."));
          return; }
        if(!resp.ok){
          if(out.error==="upgrade" && window.MB_PAYWALL){ buildUI.stop(); if(o.parentNode) document.body.removeChild(o); MB_PAYWALL.nudge("Upgrade to import more", out.reason||"Subscribe to build more lectures — your built work stays free.", "Subscribe"); return; }
          buildUI.stop(); show(out.reason||out.error||"That didn't work. Try again."); return; }
        /* success — swap the building screen for the in-app "ready" screen (no native alert) */
        buildUI.success(out, topicName, course_id);
      }catch(e){ try{ buildUI.stop(); }catch(_){} show(e.message||"Something went wrong."); }
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
