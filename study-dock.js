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
  var V = "#5b21b6", INK = "#1c1830", DIM = "#5c5570", LINE = "#e6e3f0", TINT = "#f6f3fe";

  var tab=null, drawer=null, scrim=null, injected=false;
  var active="ask";                 // ask | source | note
  var hist={};                      // topicId -> [{role,text}]

  function DOCK(){ return window.MB_DOCK || null; }
  function esc(x){ return String(x==null?"":x).replace(/[&<>"]/g,function(c){return {"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;"}[c];}); }

  function inject(){
    if(injected) return; injected=true;
    var st=document.createElement("style");
    st.textContent=
      "#mbDockTab{position:fixed;right:0;top:50%;transform:translateY(-50%);z-index:9996;background:linear-gradient(135deg,#6d28d9,#5b21b6);color:#fff;"+
        "border:0;border-radius:12px 0 0 12px;padding:14px 8px;font:800 12px/1 -apple-system,Segoe UI,Roboto,sans-serif;cursor:pointer;"+
        "writing-mode:vertical-rl;text-orientation:mixed;box-shadow:0 6px 20px rgba(91,33,182,.4);letter-spacing:.5px;display:none}"+
      "#mbDockScrim{position:fixed;inset:0;z-index:100000;background:rgba(28,20,45,.4);opacity:0;transition:opacity .2s;pointer-events:none}"+
      "#mbDockScrim.on{opacity:1;pointer-events:auto}"+
      "#mbDock{position:fixed;top:0;right:0;bottom:0;z-index:100001;width:min(420px,92vw);background:#fff;box-shadow:-14px 0 44px rgba(28,20,45,.25);"+
        "transform:translateX(100%);transition:transform .24s ease;display:flex;flex-direction:column;font-family:-apple-system,Segoe UI,Roboto,sans-serif;color:"+INK+"}"+
      "#mbDock.on{transform:translateX(0)}"+
      "#mbDock .dhead{display:flex;align-items:center;gap:6px;padding:calc(env(safe-area-inset-top,0px) + 12px) 12px 10px;border-bottom:1px solid "+LINE+"}"+
      "#mbDock .dtab{flex:1;text-align:center;padding:9px 6px;border-radius:10px;font-weight:800;font-size:13.5px;cursor:pointer;color:"+DIM+"}"+
      "#mbDock .dtab.on{background:"+TINT+";color:"+V+"}"+
      "#mbDock .dx{width:34px;height:34px;border:0;border-radius:9px;background:"+TINT+";color:"+V+";font-size:16px;font-weight:800;cursor:pointer}"+
      "#mbDock .dbody{flex:1;overflow-y:auto;-webkit-overflow-scrolling:touch;padding:14px}"+
      "#mbDock .dfoot{border-top:1px solid "+LINE+";padding:10px 12px calc(env(safe-area-inset-bottom,0px) + 10px)}"+
      "#mbDock .bub{max-width:88%;padding:10px 12px;border-radius:13px;margin:8px 0;font-size:14px;line-height:1.5;white-space:normal}"+
      "#mbDock .bub.u{background:"+V+";color:#fff;margin-left:auto;border-bottom-right-radius:4px}"+
      "#mbDock .bub.a{background:#f2eefb;color:"+INK+";border-bottom-left-radius:4px}"+
      "#mbDock .bub.a p{margin:.4em 0}"+
      "#mbDock textarea,#mbDock input{width:100%;box-sizing:border-box;border:1px solid "+LINE+";border-radius:11px;padding:11px;font-size:15px;font-family:inherit;color:"+INK+"}"+
      "#mbDock .dsend{margin-top:8px;width:100%;border:0;border-radius:11px;background:"+V+";color:#fff;font-weight:800;padding:12px;font-size:14px;cursor:pointer}"+
      "#mbDock .md{font-size:14.5px;line-height:1.6}#mbDock .md h1,#mbDock .md h2,#mbDock .md h3{font-size:16px;margin:.6em 0 .3em}";
    document.head.appendChild(st);

    tab=document.createElement("button"); tab.id="mbDockTab"; tab.textContent="✨ Ask";
    tab.onclick=function(){ open(); };
    scrim=document.createElement("div"); scrim.id="mbDockScrim"; scrim.onclick=close;
    drawer=document.createElement("div"); drawer.id="mbDock";
    document.body.appendChild(tab); document.body.appendChild(scrim); document.body.appendChild(drawer);
  }

  function open(tabName){ active=tabName||active||"ask"; render(); scrim.classList.add("on"); drawer.classList.add("on"); }
  function close(){ scrim.classList.remove("on"); drawer.classList.remove("on"); }

  function setTab(t){ active=t; render(); }

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
      if(save) save.onclick=function(){ d.saveNote(ctx.cardId, noteTa.value||""); save.textContent="Saved ✓"; setTimeout(function(){ save.textContent="Save note"; },1200); };
    }
  }

  function syncTab(){
    var d=DOCK();
    var show = d && d.onStudyScreen && d.onStudyScreen();
    if(tab) tab.style.display = show ? "block" : "none";
    if(!show){ close(); }
  }

  function boot(){
    if(!window.MB_DOCK) return;   // provider not present
    inject(); syncTab();
    window.addEventListener("hashchange", function(){ syncTab(); if(drawer && drawer.classList.contains("on")) render(); });
  }
  if(document.readyState==="loading") document.addEventListener("DOMContentLoaded", boot); else boot();

  window.MB_DOCK_OPEN = open;
})();
