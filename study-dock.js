/* =====================================================================
 * MedBank — Study Dock
 * A docked panel that stays put beside your studying so you never leave the
 * card: Ask (AI tutor for this topic/card), Source (the built note + PDF the
 * cards came from), and Note (your private note on the current card).
 *
 * Needs window.MB_DOCK (provided by app.html): onStudyScreen, ctx, ask,
 * saveNote, md.
 * ===================================================================== */
(function () {
  if (typeof window === "undefined" || typeof document === "undefined") return;
  var V = "#5b21b6", INK = "#1c1830", DIM = "var(--dim)", LINE = "var(--line)", TINT = "var(--panel2)";

  var tab=null, drawer=null, scrim=null, injected=false;
  var active="ask";                 // ask | source | note
  var hist={};                      // topicId -> [{role,text}]
  var hl="";                        // phrase to highlight in the Source note (set by a card's "Show in note")
  var hlT=null;                      // transcript moment (seconds) to jump to for recorded/YouTube lectures

  function DOCK(){ return window.MB_DOCK || null; }
  function fmtTime(s){ s=Math.floor(s||0); return Math.floor(s/60)+":"+String(s%60).padStart(2,"0"); }
  function esc(x){ return String(x==null?"":x).replace(/[&<>"]/g,function(c){return {"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;"}[c];}); }

  /* Scroll to the passage the current line came from and KEEP it lit — breathing, glow to dim and
     back — until the next line takes over. A single 2.4s flash was gone before the host had finished
     the sentence it belonged to, which made the follow-along feel broken rather than absent. Only the
     matched phrase is wrapped, not its whole paragraph, so the eye lands on the right words. */
  var _liveMark=null;
  function clearLiveMark(){
    try{ var m=_liveMark; _liveMark=null;
      if(m && m.parentNode){ var p=m.parentNode; while(m.firstChild) p.insertBefore(m.firstChild,m); p.removeChild(m); p.normalize(); }
    }catch(_){}
  }
  function highlightIn(container, phrase){
    if(!container || !phrase) return;
    var needle=(""+phrase).toLowerCase().replace(/\s+/g," ").trim(); if(needle.length<4) return;
    var tries=[needle, needle.split(" ").slice(0,6).join(" "), needle.split(" ").slice(0,4).join(" ")];
    for(var k=0;k<tries.length;k++){
      var frag=tries[k]; if(frag.length<4) continue;
      var walker=document.createTreeWalker(container, NodeFilter.SHOW_TEXT, null), node;
      while((node=walker.nextNode())){
        var raw=node.nodeValue||""; var tx=raw.toLowerCase();
        var at=tx.indexOf(frag);
        if(at<0){                                   // whitespace in the note may not match the phrase's
          var flat=tx.replace(/\s+/g," ");          // — fall back to the paragraph itself
          if(flat.indexOf(frag)<0) continue;
          at=-1;
        }
        clearLiveMark();
        var mark=document.createElement("span"); mark.className="mbdock-live";
        if(at>=0){
          var end=at+frag.length;
          var after=node.splitText(at); after.splitText(frag.length);
          mark.appendChild(document.createTextNode(after.nodeValue));
          after.parentNode.replaceChild(mark, after);
        } else {                                     // couldn't isolate the words — light the whole node
          var pnode=node.parentNode; if(!pnode) return;
          pnode.insertBefore(mark, node); mark.appendChild(node);
        }
        _liveMark=mark;
        try{ mark.scrollIntoView({block:"center",behavior:"smooth"}); }catch(_){ try{ mark.scrollIntoView(); }catch(__){} }
        return;
      }
    }
  }
  window.MB_DOCK_UNHIGHLIGHT = clearLiveMark;

  function inject(){
    if(injected) return; injected=true;
    var st=document.createElement("style");
    st.textContent=
      "#mbDockTab{position:fixed;right:0;top:50%;transform:translateY(-50%);z-index:9996;background:linear-gradient(135deg,#6d28d9,#5b21b6);color:#fff;"+
        "border:0;border-radius:14px 0 0 14px;padding:26px 13px;font:800 15px/1 -apple-system,Segoe UI,Roboto,sans-serif;cursor:pointer;"+
        "writing-mode:vertical-rl;text-orientation:mixed;box-shadow:0 6px 22px rgba(91,33,182,.45);letter-spacing:1px;display:none}"+
      "@keyframes mbdockGlow{0%,100%{background:rgba(255,214,64,.20);box-shadow:0 0 0 rgba(245,158,11,0)}50%{background:rgba(255,214,64,.85);box-shadow:0 0 14px rgba(245,158,11,.55)}}"+
      ".mbdock-live{border-radius:5px;padding:1px 2px;margin:0 -2px;color:inherit;font-weight:600;animation:mbdockGlow 1.9s ease-in-out infinite}"+
      "@media(prefers-reduced-motion:reduce){.mbdock-live{animation:none;background:rgba(255,214,64,.6)}}"+
      "#mbDockScrim{position:fixed;inset:0;z-index:100000;background:rgba(28,20,45,.4);opacity:0;transition:opacity .2s;pointer-events:none}"+
      "#mbDockScrim.on{opacity:1;pointer-events:auto}"+
      "#mbDock{position:fixed;top:0;right:0;bottom:0;z-index:100001;width:min(420px,92vw);background:var(--card,#fff);box-shadow:-14px 0 44px rgba(28,20,45,.25);"+
        "transform:translateX(100%);transition:transform .24s ease;display:flex;flex-direction:column;font-family:-apple-system,Segoe UI,Roboto,sans-serif;color:"+INK+"}"+
      "#mbDock.on{transform:translateX(0)}"+
      /* desktop: pinned side panel that pushes content instead of overlaying */
      "@media(min-width:900px){#mbDock{width:360px}#shell{transition:padding-right .24s ease}body.mb-dock-open #shell{padding-right:360px}body.mb-dock-open #mbDockScrim{display:none}body.mb-dock-open #mbAvatar{right:374px!important}}"+
      "#mbDock .dhead{display:flex;align-items:center;gap:6px;padding:calc(env(safe-area-inset-top,0px) + 12px) 12px 10px;border-bottom:1px solid "+LINE+"}"+
      "#mbDock .dtab{flex:1;text-align:center;padding:9px 6px;border-radius:10px;font-weight:800;font-size:13.5px;cursor:pointer;color:"+DIM+"}"+
      "#mbDock .dtab.on{background:"+TINT+";color:"+V+"}"+
      "#mbDock .dx{width:34px;height:34px;border:0;border-radius:9px;background:"+TINT+";color:"+V+";font-size:16px;font-weight:800;cursor:pointer}"+
      "#mbDock .dbody{flex:1;overflow-y:auto;-webkit-overflow-scrolling:touch;padding:14px}"+
      "#mbDock .dfoot{border-top:1px solid "+LINE+";padding:10px 12px calc(env(safe-area-inset-bottom,0px) + 10px)}"+
      "#mbDock .bub{max-width:88%;padding:10px 12px;border-radius:13px;margin:8px 0;font-size:14px;line-height:1.5;white-space:normal}"+
      "#mbDock .bub.u{background:"+V+";color:#fff;margin-left:auto;border-bottom-right-radius:4px}"+
      "#mbDock .bub.a{background:var(--panel2);color:"+INK+";border-bottom-left-radius:4px}"+
      "#mbDock .bub.a p{margin:.4em 0}"+
      "#mbDock textarea,#mbDock input{width:100%;box-sizing:border-box;border:1px solid "+LINE+";border-radius:11px;padding:11px;font-size:15px;font-family:inherit;color:"+INK+"}"+
      "#mbDock .dsend{margin-top:8px;width:100%;border:0;border-radius:11px;background:"+V+";color:#fff;font-weight:800;padding:12px;font-size:14px;cursor:pointer}"+
      "#mbDock .md{font-size:14.5px;line-height:1.6}#mbDock .md h1,#mbDock .md h2,#mbDock .md h3{font-size:16px;margin:.6em 0 .3em}";
    document.head.appendChild(st);

    tab=document.createElement("button"); tab.id="mbDockTab"; tab.textContent="✨ Ask AI";
    tab.onclick=function(){ open(); };
    scrim=document.createElement("div"); scrim.id="mbDockScrim"; scrim.onclick=close;
    drawer=document.createElement("div"); drawer.id="mbDock";
    document.body.appendChild(tab); document.body.appendChild(scrim); document.body.appendChild(drawer);
  }

  var isOpen=false;
  function isDesktop(){ return !!(window.matchMedia && window.matchMedia("(min-width:900px)").matches); }
  function onStudy(){ var d=DOCK(); return !!(d && d.onStudyScreen && d.onStudyScreen()); }
  function persist(){ try{ localStorage.setItem("mb_dock_open", isOpen?"1":"0"); }catch(_){} }
  function apply(){
    if(isOpen && onStudy()){
      drawer.classList.add("on");
      if(isDesktop()){ document.body.classList.add("mb-dock-open"); scrim.classList.remove("on"); }  // pinned, pushes content
      else { document.body.classList.remove("mb-dock-open"); scrim.classList.add("on"); }             // mobile overlay
      if(tab) tab.style.display="none";
    } else {
      drawer.classList.remove("on"); scrim.classList.remove("on"); document.body.classList.remove("mb-dock-open");
      if(tab) tab.style.display = onStudy() ? "block" : "none";
    }
  }
  function open(tabName){ active=tabName||active||"ask"; isOpen=true; render(); apply(); persist(); }
  function close(){ isOpen=false; apply(); persist(); }

  function setTab(t){ hl=""; hlT=null; active=t; render(); }   // manual tab switch clears any pending highlight

  function render(){
    var d=DOCK(); var ctx=(d&&d.ctx&&d.ctx())||null;
    var head="<div class='dhead'>"+
        "<div class='dtab "+(active==='ask'?'on':'')+"' data-t='ask'>✨ Ask</div>"+
        "<div class='dtab "+(active==='source'?'on':'')+"' data-t='source'>📄 Source</div>"+
        "<div class='dtab "+(active==='note'?'on':'')+"' data-t='note'>✍ Note</div>"+
        "<button class='dx'>✕</button></div>";
    var body="", foot="";
    if(!ctx){
      body="<div class='dbody'><div style='color:"+DIM+";font-size:14px;margin-top:20px;text-align:center'>Open a topic, note or card and I'll help you with it right here.</div></div>";
    } else if(active==="ask"){
      var h=hist[ctx.topicId]||[];
      var chat=h.map(function(m){ return "<div class='bub "+(m.role==='user'?'u':'a md')+"'>"+(m.role==='user'?esc(m.text):(d.md?d.md(m.text):esc(m.text)))+"</div>"; }).join("");
      if(!h.length) chat="<div style='color:"+DIM+";font-size:13.5px;text-align:center;margin:16px 4px'>Ask anything about <b>"+esc(ctx.topicName)+"</b>"+(ctx.cardQ?" or the card on screen":"")+".</div>";
      body="<div class='dbody' id='mbDockChat'>"+chat+"</div>";
      foot="<div class='dfoot'><textarea id='mbDockAsk' rows='2' placeholder='e.g. Explain this more simply…'></textarea><button class='dsend' id='mbDockSend'>Ask MedBank AI</button></div>";
    } else if(active==="source"){
      var src="";
      if(ctx.pdf) src+="<a href='"+esc(ctx.pdf)+"' target='_blank' style='display:inline-block;margin-bottom:12px;background:"+TINT+";color:"+V+";text-decoration:none;font-weight:800;padding:10px 14px;border-radius:11px'>⬇ Open the original PDF</a>";
      if(ctx.noteHtml) src+="<div style='font-weight:800;margin:6px 0'>Built note</div><div class='md'>"+ctx.noteHtml+"</div>";
      if(ctx.simplifiedHtml) src+="<div style='font-weight:800;margin:16px 0 6px'>Simplified</div><div class='md'>"+ctx.simplifiedHtml+"</div>";
      if(ctx.transcript && ctx.transcript.length){
        src+="<div style='font-weight:800;margin:16px 0 6px'>🎙 Lecture transcript</div><div id='mbDockTr'>"+
          ctx.transcript.map(function(seg){ return "<div class='trline' data-t='"+seg.t+"' style='display:flex;gap:8px;padding:7px 8px;border-radius:8px;font-size:13px;line-height:1.45'><span style='color:"+V+";font-weight:800;min-width:46px'>"+fmtTime(seg.t)+"</span><span>"+esc(seg.text)+"</span></div>"; }).join("")+
        "</div>";
      }
      if(!src) src="<div style='color:"+DIM+";text-align:center;margin-top:20px'>No source material attached to this topic yet.</div>";
      body="<div class='dbody'>"+src+"</div>";
    } else { // note
      if(ctx.cardId){
        body="<div class='dbody'><div style='color:"+DIM+";font-size:13px;margin-bottom:8px'>Your private note on this card — synced with your account.</div>"+
             "<textarea id='mbDockNote' rows='8'>"+esc(ctx.personalNote)+"</textarea>"+
             "<button class='dsend' id='mbDockNoteSave' style='margin-top:10px'>Save note</button></div>";
      } else {
        body="<div class='dbody'><div style='color:"+DIM+";text-align:center;margin-top:20px'>Open a card (start a deck or review) to jot a private note on it.</div></div>";
      }
    }
    drawer.innerHTML=head+body+foot;
    Array.prototype.forEach.call(drawer.querySelectorAll(".dtab"),function(el){ el.onclick=function(){ setTab(el.getAttribute("data-t")); }; });
    drawer.querySelector(".dx").onclick=close;

    if(active==="ask" && ctx){
      var ta=drawer.querySelector("#mbDockAsk"), send=drawer.querySelector("#mbDockSend");
      var chatEl=drawer.querySelector("#mbDockChat"); if(chatEl) chatEl.scrollTop=chatEl.scrollHeight;
      function doSend(){
        var q=(ta.value||"").trim(); if(!q) return;
        var h=hist[ctx.topicId]=hist[ctx.topicId]||[];
        h.push({role:"user",text:q}); ta.value="";
        render();
        var cl=drawer.querySelector("#mbDockChat");
        if(cl){ var typ=document.createElement("div"); typ.className="bub a"; typ.textContent="…"; cl.appendChild(typ); cl.scrollTop=cl.scrollHeight; }
        send=drawer.querySelector("#mbDockSend"); if(send){ send.disabled=true; send.textContent="Thinking…"; }
        d.ask(q, h.slice(0,-1), ctx).then(function(ans){
          h.push({role:"assistant",text:ans||"(no reply)"}); if(active==="ask") render();
        }).catch(function(e){
          h.push({role:"assistant",text:"Couldn't reach the AI just now — check your internet"+((""+e).indexOf("sign in")>=0?" (and approve the one-time Puter sign-in)":"")+" and try again."});
          if(active==="ask") render();
        });
      }
      if(send) send.onclick=doSend;
      if(ta) ta.addEventListener("keydown",function(e){ if((e.metaKey||e.ctrlKey)&&e.key==="Enter") doSend(); });
    }
    if(active==="note" && ctx && ctx.cardId){
      var save=drawer.querySelector("#mbDockNoteSave"), noteTa=drawer.querySelector("#mbDockNote");
      if(save) save.onclick=function(){
        // DCK-01: re-read the live context at click time — never write a note onto a card the student has already advanced past.
        var cur=(d&&d.ctx&&d.ctx())||null, curId=(cur&&cur.cardId)||"";
        if(curId && curId!==ctx.cardId){ save.textContent="Card changed — reopen"; setTimeout(function(){ save.textContent="Save note"; },1500); return; }
        d.saveNote(ctx.cardId, noteTa.value||""); save.textContent="Saved ✓"; setTimeout(function(){ save.textContent="Save note"; },1200);
      };
    }
    if(active==="source" && hl){ var sbody=drawer.querySelector(".dbody"); if(sbody) setTimeout(function(){ highlightIn(sbody, hl); }, 60); }
    if(active==="source" && hlT!=null){
      var tr=drawer.querySelector("#mbDockTr");
      if(tr) setTimeout(function(){
        var lines=tr.querySelectorAll(".trline"), pick=null;
        for(var i=0;i<lines.length;i++){ if((+lines[i].getAttribute("data-t")) <= hlT+1) pick=lines[i]; else break; }
        if(!pick && lines.length) pick=lines[0];
        if(pick){ pick.style.transition="background .5s"; pick.style.background="var(--panel2)";
          try{ pick.scrollIntoView({block:"center",behavior:"smooth"}); }catch(_){ pick.scrollIntoView(); }
          setTimeout(function(){ pick.style.background="transparent"; }, 2600); }
      }, 90);
    }
  }

  function syncTab(){ apply(); }

  function boot(){
    if(!window.MB_DOCK) return;   // provider not present
    inject();
    var saved=null; try{ saved=localStorage.getItem("mb_dock_open"); }catch(_){}
    isOpen = saved==="1" ? true : saved==="0" ? false : isDesktop();   // default: pinned open on desktop, closed on mobile
    if(isOpen && onStudy()) render();
    apply();
    window.addEventListener("hashchange", function(){ if(isOpen && onStudy()) render(); apply(); });
    window.addEventListener("resize", function(){ apply(); });
  }
  if(document.readyState==="loading") document.addEventListener("DOMContentLoaded", boot); else boot();

  window.MB_DOCK_OPEN = open;
  // DCK-01: the app calls this at the end of every render() so the dock re-binds to the CURRENT card
  // (advancing a card doesn't change the hash, so hashchange never fired and the panel went stale).
  window.MB_DOCK_REFRESH = function(){ try{ if(isOpen && onStudy()){ render(); } apply(); }catch(e){} };
  // called by a card's "📄 Show in the note" chip: open Source and flash the passage the card came from
  window.MB_DOCK_SOURCE = function(phrase){
    var d=DOCK(); var c=(d&&d.ctx&&d.ctx())||null;
    hl = phrase || (c&&c.cardSrc) || "";
    hlT = (c&&c.cardT!=null) ? c.cardT : null;
    if(!injected) inject();
    open("source");
  };
  // Podcast follow-along: scroll the Source note to the passage the current line came from,
  // WITHOUT yanking the user off the Ask/Note tab if they've switched. Opens the note on the
  // first call (desktop only, so it never covers the player on a phone mid-play).
  window.MB_DOCK_FOLLOW = function(phrase, t){
    if(!phrase) return;
    hl = phrase; hlT = (t!=null) ? t : null;
    if(!injected) inject();
    if(!isOpen){ if(isDesktop()) open("source"); return; }
    if(active==="source"){ var sbody=drawer && drawer.querySelector(".dbody"); if(sbody) highlightIn(sbody, hl); else render(); }
  };
})();
