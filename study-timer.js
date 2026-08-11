/* =====================================================================
 * MedBank — Study Timer
 * A floating, hovering pill at top-center that measures REAL study time.
 *
 * It counts ONLY while you're truly studying — detected from what's on
 * screen, not just the page you're on:
 *   • a live flashcard is showing         (.studywrap / .mcqopt)
 *   • you're reading a built or simplified note   (topic route + .md)
 *   • you're on the cram sheet            (cram route + .cramsheet)
 * So menu/overview screens (the Active Recall hub, Home, lists) never count.
 *
 * It pauses the instant you:
 *   • leave the card/note (go back to a menu or list),
 *   • minimise / background / switch app / lock the screen,
 *   • or sit idle: 2 min with no scroll / tap / swipe / key -> stop until you move.
 *
 * While counting, the pill gets a fiery glow. Daily totals are saved locally,
 * and there's an expanded stats view (week / month + trend) modelled on
 * Strava & Duolingo.
 * ===================================================================== */
(function () {
  if (typeof window === "undefined" || typeof document === "undefined") return;

  var IDLE_MS = 120000;   // 2 minutes with no activity -> pause
  var KEY = "mb_study_time";
  var V = "#5b21b6", TEAL = "#0d9488", FIRE = "#f97316";

  /* ---------- dates ---------- */
  function keyOf(d){ return d.getFullYear()+"-"+String(d.getMonth()+1).padStart(2,"0")+"-"+String(d.getDate()).padStart(2,"0"); }
  function today(){ return keyOf(new Date()); }
  function daysBack(n){ var out=[], d=new Date(); for(var i=0;i<n;i++){ out.push(keyOf(d)); d.setDate(d.getDate()-1); } return out; } // [today, ...back]

  /* ---------- storage ---------- */
  function load(){ try{ return JSON.parse(localStorage.getItem(KEY)||"{}")||{}; }catch(_){ return {}; } }
  function save(o){ try{ localStorage.setItem(KEY, JSON.stringify(o)); }catch(_){} }
  var store = load();
  function secsOn(k){ return store[k]||0; }
  function todaySecs(){ return store[today()]||0; }
  function addSec(){ var k=today(); store[k]=(store[k]||0)+1; }

  function cardsByDay(){ try{ return (window.MB_CARDS_BY_DAY && window.MB_CARDS_BY_DAY()) || {}; }catch(_){ return {}; } }
  function cardsOn(k){ var l=cardsByDay()[k]; return (l&&l.cards)||0; }

  /* ---------- format ---------- */
  function fmt(s){
    s=Math.max(0,Math.floor(s));
    var h=Math.floor(s/3600), m=Math.floor((s%3600)/60);
    if(h) return h+"h "+String(m).padStart(2,"0")+"m";
    var sec=s%60;
    if(m) return m+"m "+String(sec).padStart(2,"0")+"s";
    return sec+"s";
  }
  function fmtHM(s){ s=Math.floor(s); var h=Math.floor(s/3600), m=Math.round((s%3600)/60); return h?(h+"h "+m+"m"):(m+"m"); }

  /* ---------- what counts as studying (DOM-based) ---------- */
  function route(){ return (location.hash.slice(2)||"home").split("/")[0]; }
  function isStudying(){
    if(document.querySelector(".studywrap, .mcqopt")) return true;         // a flashcard is on screen
    var r=route();
    if(r==="topic" && document.querySelector(".md")) return true;          // reading a built / simplified note
    if(r==="cram" && document.querySelector(".cramsheet")) return true;    // cram sheet
    return false;
  }

  /* ---------- state ---------- */
  var lastActivity=Date.now(), counting=false, wasCounting=false, visible=!document.hidden, muted=false;
  function idle(){ return (Date.now()-lastActivity) > IDLE_MS; }
  function shouldCount(){ return visible && !idle() && isStudying(); }

  /* ---------- soft chime ---------- */
  var AC=null;
  function chime(){
    if(muted) return;
    try{
      AC = AC || new (window.AudioContext||window.webkitAudioContext)();
      if(AC.state==="suspended") AC.resume();
      var t=AC.currentTime;
      [659.25,783.99].forEach(function(f,i){
        var o=AC.createOscillator(), g=AC.createGain();
        o.type="sine"; o.frequency.value=f; var s=t+i*0.09;
        g.gain.setValueAtTime(0,s); g.gain.linearRampToValueAtTime(0.06,s+0.02);
        g.gain.exponentialRampToValueAtTime(0.0001,s+0.28);
        o.connect(g); g.connect(AC.destination); o.start(s); o.stop(s+0.3);
      });
    }catch(_){}
  }

  /* ---------- UI: the pill ---------- */
  var pill, timeEl, dot, lbl, pop=null, injected=false;
  function inject(){
    if(injected) return; injected=true;
    var st=document.createElement("style");
    st.textContent =
      "@keyframes mbtHover{0%,100%{transform:translate(-50%,0)}50%{transform:translate(-50%,-4px)}}"+
      "@keyframes mbtFire{0%,100%{box-shadow:0 6px 20px rgba(249,115,22,.5),0 0 0 rgba(239,68,68,0)}50%{box-shadow:0 10px 30px rgba(249,115,22,.85),0 0 24px rgba(239,68,68,.55)}}"+
      "@keyframes mbtFlick{0%,100%{opacity:1;transform:scale(1)}50%{opacity:.6;transform:scale(.8)}}"+
      "#mbTimer{position:fixed;top:12px;left:50%;transform:translate(-50%,0);z-index:9997;display:flex;align-items:center;gap:8px;"+
        "padding:8px 15px 8px 12px;border:0;border-radius:999px;cursor:pointer;font:800 14px/1 -apple-system,Segoe UI,Roboto,sans-serif;"+
        "color:#fff;background:linear-gradient(135deg,#6d28d9,#5b21b6);box-shadow:0 6px 20px rgba(91,33,182,.4);"+
        "animation:mbtHover 3.4s ease-in-out infinite;-webkit-tap-highlight-color:transparent}"+
      "#mbTimer.on{animation:mbtHover 3.4s ease-in-out infinite, mbtFire 1.7s ease-in-out infinite}"+
      "#mbTimer .mbtDot{width:9px;height:9px;border-radius:50%;background:#c9bff0}"+
      "#mbTimer.on .mbtDot{background:#ffd7a1;box-shadow:0 0 8px #fb923c;animation:mbtFlick 1.1s ease-in-out infinite}"+
      "#mbTimer .mbtLbl{font-weight:600;opacity:.85;font-size:12.5px}"+
      "#mbtPop,#mbtStats{font:500 13.5px/1.5 -apple-system,Segoe UI,Roboto,sans-serif;color:#1c1830}"+
      "#mbtPop{position:fixed;top:56px;left:50%;transform:translateX(-50%);z-index:9998;background:#fff;border:1px solid #e6e3f0;border-radius:14px;box-shadow:0 16px 44px rgba(28,20,45,.22);padding:14px 16px;min-width:250px;max-width:92vw}"+
      "#mbtStats{position:fixed;inset:0;z-index:100003;background:#f6f5fb;overflow-y:auto;-webkit-overflow-scrolling:touch}"+
      ".mbtBtn{border:0;border-radius:999px;background:"+V+";color:#fff;font-weight:800;font-size:13px;padding:9px 16px;cursor:pointer}";
    document.head.appendChild(st);

    pill=document.createElement("button"); pill.id="mbTimer";
    dot=document.createElement("span"); dot.className="mbtDot";
    lbl=document.createElement("span"); lbl.className="mbtLbl"; lbl.textContent="Today";
    timeEl=document.createElement("span"); timeEl.textContent=fmt(todaySecs());
    pill.appendChild(dot); pill.appendChild(lbl); pill.appendChild(timeEl);
    pill.onclick=function(e){ e.stopPropagation(); togglePop(); };
    document.body.appendChild(pill);
  }

  /* ---------- popover ---------- */
  function togglePop(){
    if(pop){ pop.remove(); pop=null; document.removeEventListener("click",outPop,true); return; }
    var week=daysBack(7).reverse(); // oldest..today
    var max=Math.max(1,...week.map(secsOn));
    var rows=week.map(function(k,i){
      var isToday=(k===today());
      var label = isToday?"Today":new Date(k).toLocaleDateString(undefined,{weekday:"short"});
      var w=Math.round((secsOn(k)/max)*100), c=cardsOn(k);
      return "<div style='display:flex;align-items:center;gap:8px;margin-top:6px'>"+
        "<span style='width:44px;color:#5c5570;font-size:12px'>"+label+"</span>"+
        "<span style='flex:1;height:8px;background:#f0edf6;border-radius:5px;overflow:hidden'><span style='display:block;height:100%;width:"+w+"%;background:"+(isToday?FIRE:"#c9bff0")+"'></span></span>"+
        "<span style='width:92px;text-align:right;font-size:11.5px'><b>"+(secsOn(k)?fmtHM(secsOn(k)):"—")+"</b>"+(c?" · "+c+" cards":"")+"</span></div>";
    }).join("");
    pop=document.createElement("div"); pop.id="mbtPop";
    pop.innerHTML="<div style='font-weight:800;margin-bottom:2px'>Study time</div>"+
      "<div style='font-size:12px;color:#5c5570'>Counts only while you read notes or study cards. Pauses when you leave or sit idle.</div>"+
      rows+
      "<div style='margin-top:12px;display:flex;gap:8px;align-items:center'>"+
        "<button class='mbtBtn' id='mbtFull'>See full stats →</button>"+
        "<span id='mbtMute' style='margin-left:auto;font-size:12px;color:"+V+";cursor:pointer;font-weight:700'>"+(muted?"🔇":"🔊")+"</span></div>";
    document.body.appendChild(pop);
    pop.querySelector("#mbtFull").onclick=function(ev){ ev.stopPropagation(); togglePop(); openStats(); };
    pop.querySelector("#mbtMute").onclick=function(ev){ ev.stopPropagation(); muted=!muted; try{localStorage.setItem("mb_study_mute",muted?"1":"0");}catch(_){} this.textContent=muted?"🔇":"🔊"; };
    setTimeout(function(){ document.addEventListener("click",outPop,true); },0);
  }
  function outPop(e){ if(pop && !pop.contains(e.target) && e.target!==pill) togglePop(); }

  /* ---------- expanded stats (week / month + trend) ---------- */
  function sumSecs(keys){ return keys.reduce(function(a,k){ return a+secsOn(k); },0); }
  function sumCards(keys){ return keys.reduce(function(a,k){ return a+cardsOn(k); },0); }
  function studyStreak(){ // consecutive days up to today with any study time
    var n=0, d=new Date();
    for(var i=0;i<400;i++){ var k=keyOf(d); if(secsOn(k)>0){ n++; d.setDate(d.getDate()-1); } else { if(i===0){ d.setDate(d.getDate()-1); continue; } break; } }
    return n;
  }
  function openStats(){
    var range=(function(){ try{ return localStorage.getItem("mb_stats_range")||"week"; }catch(_){ return "week"; } })();
    var wrap=document.createElement("div"); wrap.id="mbtStats"; document.body.appendChild(wrap);
    function close(){ wrap.remove(); }
    function render(){
      var n = range==="month"?30:7;
      var days = daysBack(n).reverse();           // oldest..today
      var maxS = Math.max(1,...days.map(secsOn));
      var thisWk=daysBack(7), lastWk=daysBack(14).slice(7);
      var tS=sumSecs(thisWk), lS=sumSecs(lastWk);
      var pct = lS>0 ? Math.round((tS-lS)/lS*100) : (tS>0?100:0);
      var down = pct < -8, up = pct > 8;
      var verdict = lS===0 && tS===0 ? "Study some cards to start your trend."
        : down ? "▼ Down "+Math.abs(pct)+"% vs last week — you're slipping. A short session today gets you back on track."
        : up ? "▲ Up "+pct+"% vs last week — strong momentum, keep it going."
        : "≈ About the same as last week — steady.";
      var vcol = down ? "#e0492b" : up ? TEAL : "#5c5570";
      var avg = Math.round(sumSecs(thisWk)/7);

      // bars
      var showLabels = range==="week";
      var bars = days.map(function(k,i){
        var isToday=(k===today()), s=secsOn(k), c=cardsOn(k);
        var hpc = Math.round((s/maxS)*100);
        var lab = range==="week" ? new Date(k).toLocaleDateString(undefined,{weekday:"short"}).slice(0,2)
                                 : (i%5===0? String(new Date(k).getDate()) : "");
        return "<div style='flex:1;min-width:0;display:flex;flex-direction:column;align-items:center;gap:4px'>"+
          (showLabels && s ? "<span style='font-size:9.5px;color:#8a83a0'>"+(c||"")+"</span>" : "")+
          "<div style='width:100%;height:130px;display:flex;align-items:flex-end'>"+
            "<div title='"+fmtHM(s)+"' style='width:"+(range==="month"?"70%":"64%")+";margin:0 auto;height:"+Math.max(s?4:0,hpc)+"%;border-radius:5px 5px 0 0;background:"+(isToday?"linear-gradient(180deg,#fb923c,"+FIRE+")":"#c9bff0")+"'></div>"+
          "</div>"+
          "<span style='font-size:10px;color:"+(isToday?FIRE:"#8a83a0")+";font-weight:"+(isToday?"800":"500")+"'>"+lab+"</span></div>";
      }).join("");

      var chip=function(v,l){ var on=range===v; return "<button data-r='"+v+"' class='mbtRange' style='border:0;border-radius:999px;padding:7px 15px;font-weight:800;font-size:12.5px;cursor:pointer;background:"+(on?V:"#ece3fb")+";color:"+(on?"#fff":V)+"'>"+l+"</button>"; };
      function stat(big,small){ return "<div style='flex:1;background:#fff;border:1px solid #e6e3f0;border-radius:14px;padding:13px 14px'><div style='font-size:22px;font-weight:800;color:#1c1830'>"+big+"</div><div style='font-size:11.5px;color:#5c5570;margin-top:2px'>"+small+"</div></div>"; }

      wrap.innerHTML=
        "<div style='max-width:640px;margin:0 auto;padding:18px 16px 40px'>"+
          "<div style='display:flex;align-items:center;justify-content:space-between'>"+
            "<div style='font-size:20px;font-weight:800'>⏱ Study stats</div>"+
            "<button id='mbtClose' style='border:0;background:#ece3fb;color:"+V+";border-radius:999px;width:34px;height:34px;font-size:16px;font-weight:800;cursor:pointer'>✕</button></div>"+
          "<div style='display:flex;gap:10px;margin-top:14px'>"+
            stat(fmtHM(sumSecs(thisWk)),"This week")+
            stat(String(sumCards(thisWk)),"Cards this week")+
            stat(studyStreak()+"d","Study streak")+
            stat(fmtHM(avg),"Daily avg")+"</div>"+
          "<div style='margin-top:12px;background:#fff;border:1px solid #e6e3f0;border-radius:14px;padding:12px 14px;color:"+vcol+";font-weight:600;font-size:13.5px'>"+verdict+"</div>"+
          "<div style='margin-top:16px;display:flex;gap:8px'>"+chip("week","This week")+chip("month","Last 30 days")+"</div>"+
          "<div style='margin-top:12px;background:#fff;border:1px solid #e6e3f0;border-radius:14px;padding:16px 12px 10px'>"+
            "<div style='display:flex;align-items:flex-end;gap:"+(range==="month"?"2px":"6px")+";height:150px'>"+bars+"</div>"+
            "<div style='margin-top:8px;font-size:11px;color:#8a83a0;text-align:center'>"+(showLabels?"Minutes studied per day · number above each bar = cards done":"Minutes studied per day over the last 30 days")+"</div>"+
          "</div>"+
          "<div style='margin-top:14px;font-size:12px;color:#8a83a0'>Time counts only while you read notes or study cards. Modelled on Strava's weekly training log & Duolingo's streaks.</div>"+
        "</div>";
      wrap.querySelector("#mbtClose").onclick=close;
      Array.prototype.forEach.call(wrap.querySelectorAll(".mbtRange"),function(b){ b.onclick=function(){ range=b.getAttribute("data-r"); try{localStorage.setItem("mb_stats_range",range);}catch(_){} render(); }; });
    }
    render();
  }

  /* ---------- paint + loop ---------- */
  function paint(){
    if(!timeEl) return;
    timeEl.textContent=fmt(todaySecs());
    if(counting){ pill.classList.add("on"); lbl.textContent="Studying"; }
    else { pill.classList.remove("on"); lbl.textContent="Today"; }
  }
  function tick(){
    counting=shouldCount();
    if(counting && !wasCounting) chime();
    wasCounting=counting;
    if(counting) addSec();
    paint();
  }
  var saveN=0;
  function loop(){ tick(); if((++saveN%10)===0) save(store); }

  /* ---------- activity + visibility ---------- */
  function bump(){ lastActivity=Date.now(); }
  ["scroll","touchstart","touchmove","pointerdown","keydown","click","wheel"].forEach(function(ev){
    window.addEventListener(ev, bump, { passive:true, capture:true });
  });
  var mmT=0; window.addEventListener("mousemove", function(){ var n=Date.now(); if(n-mmT>4000){ mmT=n; bump(); } }, { passive:true });
  document.addEventListener("visibilitychange", function(){ visible=!document.hidden; if(!visible) save(store); else bump(); tick(); });
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

  window.MB_STUDY_TIME = { today:todaySecs, all:load, open:function(){ openStats(); } };
})();
