/* =====================================================================
 * MedBank — Import lectures tab (Phase 5, client)
 * Opens an upload sheet: pick a course, name the topic, choose a PDF or photos
 * of handwritten notes, and send them to the import server. Gated by the
 * paywall. On success it calls your onImported() so the app can refresh.
 *
 * Config: MEDBANK_CONFIG.IMPORT_API (the import server URL).
 * Wire a button/tab to window.MB_openImport().
 * ===================================================================== */
(function () {
  var CFG = (typeof window !== "undefined" && window.MEDBANK_CONFIG) || {};
  function el(t,css,html){ var e=document.createElement(t); if(css)e.style.cssText=css; if(html!=null)e.innerHTML=html; return e; }
  function fileToB64(file){ return new Promise(function(res,rej){ var r=new FileReader(); r.onload=function(){ res(String(r.result).split(",")[1]); }; r.onerror=rej; r.readAsDataURL(file); }); }

  async function courses(){
    if(!window.__mbSB) return [];
    var pid = window.MB_SYNC && MB_SYNC.currentProfileId && MB_SYNC.currentProfileId();
    if(!pid) return [];
    var r = await window.__mbSB.from("courses").select("id,name").eq("level_profile_id", pid).order("position");
    return r.data || [];
  }

  async function openImport(){
    // gate first — shows subscribe/view-only nudge if blocked
    if(window.MB_PAYWALL && !MB_PAYWALL.guard("Importing lectures")) return;
    if(typeof document === "undefined") return;
    var cs = await courses();

    var o = el("div","position:fixed;inset:0;background:rgba(10,16,30,.55);display:flex;align-items:flex-end;justify-content:center;z-index:9999");
    var s = el("div","background:#fff;width:100%;max-width:460px;border-radius:18px 18px 0 0;padding:20px 18px 26px;font-family:inherit;box-shadow:0 -10px 40px rgba(0,0,0,.2)");
    s.appendChild(el("div","font-weight:800;font-size:18px;margin-bottom:2px","Import a lecture"));
    s.appendChild(el("div","color:#5b6b86;font-size:13.5px;margin-bottom:14px","Upload a PDF or photos of your notes — we build your notes, decks and cram sheet."));

    var lbl="font-size:13px;font-weight:700;color:#5b6b86;margin:12px 0 6px";
    s.appendChild(el("div",lbl,"Course"));
    var sel=el("select","width:100%;padding:12px;border:1px solid #e7ebf3;border-radius:11px;font-size:15px");
    cs.forEach(function(c){ var op=document.createElement("option"); op.value=c.id; op.textContent=c.name; sel.appendChild(op); });
    if(!cs.length){ var op=document.createElement("option"); op.textContent="(no courses — add one first)"; sel.appendChild(op); }
    s.appendChild(sel);

    s.appendChild(el("div",lbl,"Topic name"));
    var name=el("input","width:100%;padding:12px;border:1px solid #e7ebf3;border-radius:11px;font-size:15px"); name.placeholder="e.g. Bronchiolitis"; s.appendChild(name);

    s.appendChild(el("div",lbl,"Lecture file (PDF) or photos"));
    var file=el("input"); file.type="file"; file.accept=".pdf,image/*"; file.multiple=true;
    file.style.cssText="width:100%;font-size:14px"; s.appendChild(file);

    var msg=el("div","margin-top:12px;font-size:13.5px;color:#c0392b;display:none"); s.appendChild(msg);

    var go=el("button","width:100%;margin-top:16px;border:0;background:#5b21b6;color:#fff;border-radius:12px;padding:14px;font-weight:800;cursor:pointer;font-size:15px","Build my study set");
    go.onclick=async function(){
      msg.style.display="none";
      var course_id=sel.value, topicName=(name.value||"").trim();
      if(!course_id || !topicName){ show("Pick a course and enter a topic name."); return; }
      if(!file.files || !file.files.length){ show("Choose a PDF or some photos."); return; }
      if(!CFG.IMPORT_API){ show("Import server URL not set (MEDBANK_CONFIG.IMPORT_API)."); return; }
      go.disabled=true; go.textContent="Building… this can take ~20s";
      try{
        var body={ topicName:topicName, course_id:course_id, subject:(sel.options[sel.selectedIndex]||{}).textContent };
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
        if(!resp.ok){ show(out.reason||out.error||"Import failed. Try again."); go.disabled=false; go.textContent="Build my study set"; return; }
        document.body.removeChild(o);
        try{ if(typeof window.onImported==="function") window.onImported(out.topic_id); }catch(e){}
        alert("Done! Built "+out.primer+" primer + "+out.recall+" recall cards. Open the topic to study.");
      }catch(e){ show(e.message||"Something went wrong."); go.disabled=false; go.textContent="Build my study set"; }
      function show(m){ msg.textContent=m; msg.style.display="block"; }
    };
    s.appendChild(go);
    var close=el("button","width:100%;margin-top:9px;border:0;background:#f2f3f9;color:#0f1729;border-radius:12px;padding:12px;font-weight:700;cursor:pointer","Cancel");
    close.onclick=function(){ document.body.removeChild(o); };
    s.appendChild(close);
    o.onclick=function(e){ if(e.target===o) document.body.removeChild(o); };
    o.appendChild(s); document.body.appendChild(o);
  }

  window.MB_openImport = openImport;
})();
