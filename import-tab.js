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
    if(window.MB_PAYWALL && !MB_PAYWALL.guard("Adding a lecture")) return;
    if(typeof document === "undefined") return;
    var cs = await courses();

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

    /* File */
    s.appendChild(el("div",lbl,"Lecture file (PDF) or photos"));
    var file=el("input","width:100%;font-size:14px;margin-top:2px"); file.type="file"; file.accept=".pdf,image/*"; file.multiple=true; s.appendChild(file);

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
      if(!file.files || !file.files.length){ show("Choose a PDF or some photos."); return; }
      if(!CFG.IMPORT_API){ show("Import isn't configured yet. Try again shortly."); return; }
      go.disabled=true; go.textContent="Building… this can take ~30–60s";
      try{
        var body={ topicName:topicName, course_id:course_id, lecturer:lecturer, subject:(sel.options[sel.selectedIndex]||{}).textContent };
        var files=[].slice.call(file.files);
        var pdf=files.find(function(f){ return /\.pdf$/i.test(f.name); });
        if(pdf){ body.pdf_base64=await fileToB64(pdf); }
        var imgs=files.filter(function(f){ return /^image\//.test(f.type); });
        if(imgs.length){ body.images=[]; for(var i=0;i<imgs.length;i++) body.images.push({ media_type:imgs[i].type, data:await fileToB64(imgs[i]) }); }

        var token=null;
        if(window.__mbSB){ var ses=await window.__mbSB.auth.getSession(); token=ses.data.session && ses.data.session.access_token; }
        var resp=await fetch(CFG.IMPORT_API.replace(/\/$/,"")+"/import",{
          method:"POST", headers:{ "Content-Type":"application/json", "Authorization":"Bearer "+token }, body:JSON.stringify(body) });
        var out=await resp.json();
        if(!resp.ok){ show(out.reason||out.error||"That didn't work. Try again."); go.disabled=false; go.textContent="Build my study set"; return; }
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
