/* =====================================================================
 * MedBank — Branded lecture recorder
 * A full-screen, unmistakably-MedBank recording screen (logo lock-up,
 * animated waveform, big live timer, red stop). Records the lecture audio,
 * and on stop hands it to the Add-a-lecture flow (record first, details after).
 * Anyone who glances at your phone in class sees MedBank.
 *
 * window.MB_openRecorder()  — start recording.
 * Needs window.MB_openImport({audioBlob, audioMime, durationSec}).
 * ===================================================================== */
(function () {
  if (typeof window === "undefined" || typeof document === "undefined") return;
  var V = "#5b21b6", CORAL = "#f97362";

  function pickMime(){
    var c = ["audio/mp4","audio/webm;codecs=opus","audio/webm","audio/ogg;codecs=opus"];
    if (typeof MediaRecorder === "undefined" || !MediaRecorder.isTypeSupported) return "";
    for (var i=0;i<c.length;i++){ if (MediaRecorder.isTypeSupported(c[i])) return c[i]; }
    return "";
  }
  function two(n){ return String(n).padStart(2,"0"); }
  function fmt(s){ s=Math.floor(s); var h=Math.floor(s/3600), m=Math.floor((s%3600)/60), x=s%60; return (h?h+":":"")+two(m)+":"+two(x); }

  var stream=null, rec=null, chunks=[], accMs=0, segStart=0, paused=false, tick=null, wake=null, overlay=null;
  function elapsedSec(){ return (accMs + (paused?0:(Date.now()-segStart)))/1000; }

  async function keepAwake(){ try{ if(navigator.wakeLock){ wake=await navigator.wakeLock.request("screen"); } }catch(_){}}
  function releaseAwake(){ try{ if(wake){ wake.release(); wake=null; } }catch(_){}}

  function teardown(){
    if(tick){ clearInterval(tick); tick=null; }
    try{ if(stream) stream.getTracks().forEach(function(t){ t.stop(); }); }catch(_){}
    stream=null; releaseAwake();
    if(overlay && overlay.parentNode){ overlay.parentNode.removeChild(overlay); }
    overlay=null;
  }

  function ui(){
    var o=document.createElement("div");
    o.id="mbRec";
    o.style.cssText="position:fixed;inset:0;z-index:100002;display:flex;flex-direction:column;align-items:center;justify-content:space-between;"+
      "background:radial-gradient(120% 80% at 50% 12%,#1a0f36 0%,#0b0713 55%,#050308 100%);font-family:-apple-system,Segoe UI,Roboto,sans-serif;color:#fff;text-align:center;"+
      "padding:calc(env(safe-area-inset-top,0px) + 8vh) 7vw calc(env(safe-area-inset-bottom,0px) + 6vh)";
    o.innerHTML =
      // TOP — brand lock-up pill
      "<div style='display:flex;align-items:center;gap:12px;background:#fff;color:#1c1830;padding:13px 26px 13px 15px;border-radius:999px;box-shadow:0 0 46px rgba(167,139,250,.6),0 12px 34px rgba(124,79,224,.4);font-weight:800;font-size:25px'>"+
        "<img src='icon.svg' width='40' height='40' style='border-radius:11px' alt=''>MedBank</div>"+
      // MIDDLE — waveform fills, then status + big timer
      "<div style='width:100%;display:flex;flex-direction:column;align-items:center'>"+
        "<div id='mbRecWave' style='display:flex;align-items:flex-end;justify-content:center;gap:7px;height:26vh;min-height:130px;width:100%;margin-bottom:30px'>"+
          Array.apply(null,{length:18}).map(function(_,i){ return "<span style='width:9px;border-radius:6px;background:linear-gradient(180deg,#a78bfa,"+CORAL+");animation:mbRecBar "+(0.8+(i%4)*0.18)+"s ease-in-out "+(i*0.06)+"s infinite'></span>"; }).join("")+
        "</div>"+
        "<div id='mbRecStatus' style='font-size:17px;font-weight:600;letter-spacing:.3px;color:#d8ccff'>Recording the lecture…</div>"+
        "<div id='mbRecTime' style='font-size:64px;font-weight:800;letter-spacing:1px;margin:6px 0 6px;font-variant-numeric:tabular-nums'>00:00</div>"+
        "<div id='mbRecHint' style='font-size:13px;color:#9a8fc0;max-width:280px;line-height:1.5'>Keep MedBank open with your screen on.</div>"+
      "</div>"+
      // BOTTOM — controls + cancel
      "<div style='display:flex;flex-direction:column;align-items:center'>"+
        "<div style='display:flex;align-items:center;gap:34px'>"+
          "<button id='mbRecPause' style='width:64px;height:64px;border-radius:50%;border:2px solid rgba(255,255,255,.3);background:rgba(255,255,255,.08);color:#fff;font-size:26px;cursor:pointer;display:flex;align-items:center;justify-content:center'>⏸</button>"+
          "<button id='mbRecStop' style='width:88px;height:88px;border-radius:50%;border:6px solid rgba(255,255,255,.16);background:#ef4444;cursor:pointer;display:flex;align-items:center;justify-content:center;box-shadow:0 8px 32px rgba(239,68,68,.55)'>"+
            "<span style='width:32px;height:32px;border-radius:7px;background:#fff;display:block'></span></button>"+
        "</div>"+
        "<div id='mbRecStopLbl' style='margin-top:16px;font-size:14px;color:#c9bff0;font-weight:600'>Pause&nbsp; ·&nbsp; Stop &amp; build my cards</div>"+
        "<button id='mbRecCancel' style='margin-top:18px;background:transparent;border:0;color:#6f6690;font-size:13px;cursor:pointer;text-decoration:underline'>Cancel</button>"+
      "</div>";
    if(!document.getElementById("mbRecKF")){
      var s=document.createElement("style"); s.id="mbRecKF";
      s.textContent="@keyframes mbRecBar{0%,100%{height:16%}50%{height:100%}}";
      document.head.appendChild(s);
    }
    return o;
  }

  function fail(msg){
    if(!overlay) return;
    var h=overlay.querySelector("#mbRecHint"); if(h){ h.textContent=msg; h.style.color="#fca5a5"; }
    var w=overlay.querySelector("#mbRecWave"); if(w) w.style.opacity=".25";
    var lbl=overlay.querySelector("#mbRecStopLbl"); if(lbl) lbl.textContent="Close";
  }

  async function open(){
    if(overlay) return;
    overlay=ui(); document.body.appendChild(overlay);
    var timeEl=overlay.querySelector("#mbRecTime");
    overlay.querySelector("#mbRecCancel").onclick=function(){ try{ if(rec&&rec.state!=="inactive"){ rec.onstop=null; rec.stop(); } }catch(_){} teardown(); };

    // mic
    try{
      stream=await navigator.mediaDevices.getUserMedia({ audio:true });
    }catch(e){
      fail("MedBank needs microphone access to record. Allow it in your browser settings, then try again.");
      overlay.querySelector("#mbRecStop").onclick=teardown;
      return;
    }
    keepAwake();

    var mime=pickMime();
    try{ rec = mime ? new MediaRecorder(stream,{ mimeType:mime, audioBitsPerSecond:32000 }) : new MediaRecorder(stream); }
    catch(_){ try{ rec=new MediaRecorder(stream); }catch(e2){ fail("Recording isn't supported in this browser. Try the App Store version, or upload a PDF instead."); return; } }

    chunks=[];
    rec.ondataavailable=function(e){ if(e.data && e.data.size) chunks.push(e.data); };
    rec.onstop=function(){
      var dur=Math.round(elapsedSec());
      var blob=new Blob(chunks,{ type:(rec && rec.mimeType) || mime || "audio/webm" });
      teardown();
      if(!blob.size || dur<3){ try{ alert("That recording was too short. Give it another go."); }catch(_){} return; }
      if(window.MB_openImport){ window.MB_openImport({ audioBlob:blob, audioMime:blob.type, durationSec:dur }); }
    };

    accMs=0; segStart=Date.now(); paused=false;
    try{ rec.start(1000); }catch(_){ try{ rec.start(); }catch(e3){ fail("Couldn't start recording on this device."); return; } }
    tick=setInterval(function(){ timeEl.textContent=fmt(elapsedSec()); },500);

    // pause / resume
    var waveEl=overlay.querySelector("#mbRecWave"), statusEl=overlay.querySelector("#mbRecStatus"), pauseBtn=overlay.querySelector("#mbRecPause");
    function setPaused(p){
      paused=p;
      if(waveEl){ waveEl.style.opacity=p?".3":"1"; var bars=waveEl.querySelectorAll("span"); for(var i=0;i<bars.length;i++) bars[i].style.animationPlayState=p?"paused":"running"; }
      if(statusEl){ statusEl.textContent=p?"Paused — tap ▶ to keep recording":"Recording the lecture…"; statusEl.style.color=p?"#fca5a5":"#d8ccff"; }
      if(pauseBtn) pauseBtn.textContent=p?"▶":"⏸";
    }
    pauseBtn.onclick=function(){
      if(!rec) return;
      try{
        if(paused){ segStart=Date.now(); if(rec.state==="paused") rec.resume(); setPaused(false); keepAwake(); }
        else { accMs+=Date.now()-segStart; if(rec.state==="recording") rec.pause(); setPaused(true); }
      }catch(_){ /* pause unsupported on this device */ }
    };

    overlay.querySelector("#mbRecStop").onclick=function(){ try{ if(rec && rec.state!=="inactive"){ rec.stop(); } else { teardown(); } }catch(_){ teardown(); } };

    // re-acquire wake lock when returning to the app
    document.addEventListener("visibilitychange", function(){ if(!document.hidden && rec && rec.state==="recording") keepAwake(); });
  }

  window.MB_openRecorder = open;
})();
