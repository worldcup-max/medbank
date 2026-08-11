/* =====================================================================
 * MedBank — Study Timer
 * A floating, hovering pill at top-center that measures REAL study time.
 *
 * It only counts while the student is actually on a study screen:
 *   note / simplified note (topic), primer & recall decks (study),
 *   and active-recall sessions (today, review, hard, leeches, mistakes, nudge).
 * It pauses the instant you:
 *   - leave those screens,
 *   - minimise / background / leave the app (visibility + blur),
 *   - or go idle: if 2 minutes pass with no scroll / touch / tap / key, it stops
 *     until you do something again.
 * Daily totals are saved locally (per calendar day).
 * ===================================================================== */
(function () {
  if (typeof window === "undefined" || typeof document === "undefined") return;

  /* which hash routes count as "studying" — edit this set to add exam/cram etc. */
  var STUDY_ROUTES = {
    topic:1, study:1,                                   // notes, simplified notes, primer & set-B cards
    today:1, review:1, hard:1, hardnudge:1, nudge:1,    // active recall
    leeches:1, mistakes:1
  };

  var IDLE_MS = 120000;   // 2 minutes with no activity -> pause
  var KEY = "mb_study_time";
  var V = "#5b21b6", TEAL = "#0d9488";

  /* ---------- storage ---------- */
  function today(){ var d=new Date(); return d.getFullYear()+"-"+String(d.getMonth()+1).padStart(2,"0")+"-"+String(d.getDate()).padStart(2,"0"); }
  function load(){ try{ return JSON.parse(localStorage.getItem(KEY)||"{}")||{}; }catch(_){ return {}; } }
  function save(o){ try{ localStorage.setItem(KEY, JSON.stringify(o)); }catch(_){} }
  var store = load();
  function todaySecs(){ return store[today()]||0; }
  function addSec(){ var k=today(); store[k]=(store[k]||0)+1; }

  /* ---------- state ---------- */
  var lastActivity = Date.now();
  var counting = false;       // currently accumulating
  var wasCounting = false;    // for chime on session-start
  var visible = !document.hidden;

  function onStudyRoute(){ var r=(location.hash.slice(2)||"home").split("/")[0]; return !!STUDY_ROUTES[r]; }
  function idle(){ return (Date.now()-lastActivity) > IDLE_MS; }
  function shouldCount(){ return visible && onStudyRoute() && !idle(); }

  /* ---------- pretty time ---------- */
  function fmt(s){
    s=Math.max(0,Math.floor(s));
    var h=Math.floor(s/3600), m=Math.floor((s%3600)/60);
    if(h) return h+"h "+String(m).padStart(2,"0")+"m";
    var sec=s%60;
    if(m) return m+"m "+String(sec).padStart(2,"0")+"s";
    return sec+"s";
  }

  /* ---------- soft chime (WebAudio) — pleasant, not intrusive ---------- */
  var AC=null, muted=false;
  function chime(up){
    if(muted) return;
    try{
      AC = AC || new (window.AudioContext||window.webkitAudioContext)();
      if(AC.state==="suspended") AC.resume();
      var t=AC.currentTime;
      [up?659.25:523.25, up?783.99:392.00].forEach(function(f,i){
        var o=AC.createOscillator(), g=AC.createGain();
        o.type="sine"; o.frequency.value=f;
        var s=t+i*0.09;
        g.gain.setValueAtTime(0,s); g.gain.linearRampToValueAtTime(0.06,s+0.02);
        g.gain.exponentialRampToValueAtTime(0.0001,s+0.28);
        o.connect(g); g.connect(AC.destination); o.start(s); o.stop(s+0.3);
      });
    }catch(_){}
  }

  /* ---------- UI ---------- */
  var pill, timeEl, dot, pop=null, injected=false;
  function inject(){
    if(injected) return; injected=true;
    var st=document.createElement("style");
    st.textContent =
      "@keyframes mbtHover{0%,100%{transform:translate(-50%,0)}50%{transform:translate(-50%,-4px)}}"+
      "@keyframes mbtGlow{0%,100%{box-shadow:0 6px 20px rgba(13,148,136,.34)}50%{box-shadow:0 8px 30px rgba(13,148,136,.6)}}"+
      "@keyframes mbtPulse{0%,100%{opacity:1;transform:scale(1)}50%{opacity:.55;transform:scale(.82)}}"+
      "#mbTimer{position:fixed;top:12px;left:50%;transform:translate(-50%,0);z-index:9997;display:flex;align-items:center;gap:8px;"+
        "padding:8px 15px 8px 12px;border:0;border-radius:999px;cursor:pointer;font:800 14px/1 -apple-system,Segoe UI,Roboto,sans-serif;"+
        "color:#fff;background:linear-gradient(135deg,#6d28d9,#5b21b6);box-shadow:0 6px 20px rgba(91,33,182,.4);"+
        "animation:mbtHover 3.4s ease-in-out infinite;-webkit-tap-highlight-color:transparent}"+
      "#mbTimer.on{background:linear-gradient(135deg,#0d9488,#0f766e);animation:mbtHover 3.4s ease-in-out infinite, mbtGlow 2s ease-in-out infinite}"+
      "#mbTimer .mbtDot{width:9px;height:9px;border-radius:50%;background:#fca5a5}"+
      "#mbTimer.on .mbtDot{background:#5eead4;animation:mbtPulse 1.1s ease-in-out infinite}"+
      "#mbTimer .mbtLbl{font-weight:600;opacity:.85;font-size:12.5px}"+
      "#mbtPop{position:fixed;top:56px;left:50%;transform:translateX(-50%);z-index:9997;background:#fff;color:#1c1830;"+
        "border:1px solid #e6e3f0;border-radius:14px;box-shadow:0 16px 44px rgba(28,20,45,.22);padding:14px 16px;min-width:230px;"+
        "font:500 13.5px/1.5 -apple-system,Segoe UI,Roboto,sans-serif}";
    document.head.appendChild(st);

    pill=document.createElement("button"); pill.id="mbTimer";
    dot=document.createElement("span"); dot.className="mbtDot";
    var lbl=document.createElement("span"); lbl.className="mbtLbl"; lbl.textContent="Today";
    timeEl=document.createElement("span"); timeEl.textContent=fmt(todaySecs());
    pill.appendChild(dot); pill.appendChild(lbl); pill.appendChild(timeEl);
    pill.onclick=function(e){ e.stopPropagation(); togglePop(); };
    document.body.appendChild(pill);
  }

  function last7(){
    var out=[]; var d=new Date();
    for(var i=0;i<7;i++){ var k=d.getFullYear()+"-"+String(d.getMonth()+1).padStart(2,"0")+"-"+String(d.getDate()).padStart(2,"0");
      out.push([k, store[k]||0]); d.setDate(d.getDate()-1); }
    return out;
  }
  function togglePop(){
    if(pop){ pop.remove(); pop=null; document.removeEventListener("click",outPop,true); return; }
    var max=Math.max(1,...last7().map(function(x){return x[1];}));
    var rows=last7().map(function(x,i){
      var label = i===0?"Today":(i===1?"Yesterday":new Date(x[0]).toLocaleDateString(undefined,{weekday:"short"}));
      var w=Math.round((x[1]/max)*100);
      return "<div style='display:flex;align-items:center;gap:8px;margin-top:6px'>"+
        "<span style='width:60px;color:#5c5570;font-size:12px'>"+label+"</span>"+
        "<span style='flex:1;height:8px;background:#f0edf6;border-radius:5px;overflow:hidden'><span style='display:block;height:100%;width:"+w+"%;background:"+(i===0?TEAL:"#c9bff0")+"'></span></span>"+
        "<span style='width:56px;text-align:right;font-weight:700;font-size:12px'>"+(x[1]?fmt(x[1]):"—")+"</span></div>";
    }).join("");
    pop=document.createElement("div"); pop.id="mbtPop";
    pop.innerHTML="<div style='font-weight:800;color:#1c1830;margin-bottom:2px'>Study time</div>"+
      "<div style='font-size:12px;color:#5c5570'>Counts while you read notes &amp; do cards. Pauses when you leave or sit idle.</div>"+
      rows+
      "<div style='margin-top:11px;display:flex;justify-content:space-between;align-items:center'>"+
        "<span style='font-size:11.5px;color:#8a83a0'>"+(counting?"● Counting now":"Paused")+"</span>"+
        "<span id='mbtMute' style='font-size:12px;color:"+V+";cursor:pointer;font-weight:700'>"+(muted?"🔇 Sound off":"🔊 Sound on")+"</span></div>";
    document.body.appendChild(pop);
    pop.querySelector("#mbtMute").onclick=function(ev){ ev.stopPropagation(); muted=!muted; try{localStorage.setItem("mb_study_mute",muted?"1":"0");}catch(_){} this.textContent=muted?"🔇 Sound off":"🔊 Sound on"; };
    setTimeout(function(){ document.addEventListener("click",outPop,true); },0);
  }
  function outPop(e){ if(pop && !pop.contains(e.target) && e.target!==pill) togglePop(); }

  function paint(){
    if(!timeEl) return;
    timeEl.textContent=fmt(todaySecs());
    if(counting){ pill.classList.add("on"); } else { pill.classList.remove("on"); }
  }

  /* ---------- loop ---------- */
  function tick(){
    counting = shouldCount();
    if(counting && !wasCounting) chime(true);   // gentle "session started"
    wasCounting = counting;
    if(counting){ addSec(); }
    paint();
  }
  var saveN=0;
  function loop(){ tick(); if((++saveN%10)===0) save(store); }

  /* ---------- activity + visibility wiring ---------- */
  function bump(){ lastActivity=Date.now(); }
  ["scroll","touchstart","touchmove","pointerdown","keydown","click","wheel"].forEach(function(ev){
    window.addEventListener(ev, bump, { passive:true, capture:true });
  });
  // mousemove throttled so it doesn't keep a walked-away laptop "active" forever via jitter
  var mmT=0; window.addEventListener("mousemove", function(){ var n=Date.now(); if(n-mmT>4000){ mmT=n; bump(); } }, { passive:true });

  document.addEventListener("visibilitychange", function(){ visible=!document.hidden; if(!visible){ save(store); } else { bump(); } tick(); });
  window.addEventListener("blur", function(){ visible=false; tick(); });
  window.addEventListener("focus", function(){ visible=!document.hidden; bump(); tick(); });
  window.addEventListener("hashchange", function(){ bump(); tick(); });
  window.addEventListener("beforeunload", function(){ save(store); });

  /* ---------- boot ---------- */
  function boot(){
    try{ muted = localStorage.getItem("mb_study_mute")==="1"; }catch(_){}
    inject(); paint();
    setInterval(loop, 1000);
  }
  if(document.readyState==="loading") document.addEventListener("DOMContentLoaded", boot); else boot();

  /* expose for other modules */
  window.MB_STUDY_TIME = { today:todaySecs, all:function(){ return load(); } };
})();
