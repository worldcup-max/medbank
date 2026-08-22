/* =====================================================================
 * MedBank — level switcher UI (Phase 4/5)
 * Rules:
 *   • Levels BELOW the student's start level are hidden (they never used them).
 *   • The current level is active.
 *   • Levels already completed show "view only" — notes & progress stay, but
 *     features (import/AI/new scheduling) are off there.
 *   • Levels ABOVE the current one are LOCKED 🔒 until the student finishes and
 *     taps "Go to next level".
 * Wire a button to window.MB_openLevelSwitcher(). No-op if not logged in.
 * ===================================================================== */
(function () {
  function el(tag, css, html){ var e=document.createElement(tag); if(css)e.style.cssText=css; if(html!=null)e.innerHTML=html; return e; }
  var LEVELS = [100,200,300,400,500,600];

  async function openLevelSwitcher(){
    if(!window.MB_SYNC || !MB_SYNC.listProfiles) return;
    var profiles = await MB_SYNC.listProfiles();          // levels the student has entered
    var curId    = MB_SYNC.currentProfileId ? MB_SYNC.currentProfileId() : null;
    var curLevel = MB_SYNC.currentLevel ? MB_SYNC.currentLevel() : null;
    var startLv  = (MB_SYNC.startLevel && MB_SYNC.startLevel()) || curLevel || 100;
    var byLevel  = {}; (profiles||[]).forEach(function(p){ byLevel[p.level]=p; });

    var overlay = el("div","position:fixed;inset:0;background:rgba(10,16,30,.55);display:flex;align-items:flex-end;justify-content:center;z-index:9999");
    var sheet = el("div","background:#fff;width:100%;max-width:460px;border-radius:18px 18px 0 0;padding:20px 18px 26px;box-shadow:0 -10px 40px rgba(0,0,0,.2);font-family:inherit");
    sheet.appendChild(el("div","font-weight:800;font-size:18px;margin-bottom:4px","Your levels"));
    sheet.appendChild(el("div","color:#5b6b86;font-size:13.5px;margin-bottom:14px","Everything you build is kept for every level, forever."));

    var list = el("div","");
    // AUTH-09: with no current level (MB_SYNC.init bailed — no account row, no active profile,
    // or the level_profiles read failed) curId/curLevel are null, so EVERY row fell through to
    // the locked branch: six 🔒 rows, no "Go to next level", and no explanation whatsoever.
    if(curLevel==null || !curId){
      list.appendChild(el("div","border:1px solid #ffd9cf;background:#fff5f2;color:#b3391f;border-radius:12px;padding:14px;font-size:14px;line-height:1.5;font-weight:600",
        "We couldn't load your levels right now.<br><span style='font-weight:500;color:#5b6b86'>Check your connection and reopen the app. If you've just created your account, finish picking your level and courses first.</span>"));
    }
    LEVELS.filter(function(L){ return (curLevel!=null && curId) && L >= startLv; }).forEach(function(L){
      var p = byLevel[L];
      var isCurrent = p && p.id===curId;
      var isDone    = p && !isCurrent;                     // entered before → completed/view-only
      var isLocked  = !p;                                  // above current, not yet unlocked
      var label, right, color, bg, clickable=false;

      // AUTH-10: a student who switches BACK to a completed level makes it "current" while it is
      // still archived — every import/AI feature is off there and nothing said so.
      var curIsArchived = false;
      try{ curIsArchived = !!(p && (p.archived || (MB_SYNC.currentProfileArchived && MB_SYNC.currentProfileArchived()))); }catch(e){}
      if(isCurrent && curIsArchived){ label=L+" level"; right='<span style="color:#5b6b86;font-weight:700">current · view only</span>'; color="#4f46e5"; bg="#f7f8fb"; }
      else if(isCurrent){ label=L+" level"; right='<span style="color:#4f46e5;font-weight:800">current</span>'; color="#4f46e5"; bg="#eef0fe"; }
      else if(isDone){ label=L+" level"; right='<span style="color:#5b6b86;font-weight:600">✓ view only · tap to open</span>'; color="#e7ebf3"; bg="#fff"; clickable=true; }
      else { label='🔒 '+L+" level"; right='<span style="color:#9aa6bd;font-weight:600">locked</span>'; color="#eef0f4"; bg="#f7f8fb"; }

      var row = el("button",
        "display:flex;justify-content:space-between;align-items:center;width:100%;text-align:left;"+
        "border:1.5px solid "+color+";background:"+bg+";border-radius:12px;padding:14px;margin-bottom:9px;"+
        "font-size:15px;font-weight:700;color:"+(isLocked?"#9aa6bd":"#0f1729")+";cursor:"+(clickable?"pointer":"default"),
        label+" <span>"+right+"</span>");
      if(clickable) row.onclick=function(){ document.body.removeChild(overlay); MB_SYNC.switchProfile(p.id); };
      list.appendChild(row);
    });
    sheet.appendChild(list);

    // "Go to next level" — only from the current level, and only if not at 600
    if(curLevel && curLevel < 600){
      var go = el("button","width:100%;margin-top:4px;border:0;background:#0d9488;color:#fff;border-radius:12px;padding:14px;font-weight:800;cursor:pointer;font-size:15px",
        "Go to next level  →  "+(curLevel+100)+" level");
      go.onclick=function(){
        if(confirm("Move up to "+(curLevel+100)+" level?\n\nYour "+curLevel+" level notes and progress stay saved and viewable, but its import & AI features will stop.")){
          document.body.removeChild(overlay); MB_SYNC.goToNextLevel();
        }
      };
      sheet.appendChild(go);
    }

    var close = el("button","width:100%;margin-top:10px;border:0;background:#f2f3f9;color:#0f1729;border-radius:12px;padding:13px;font-weight:700;cursor:pointer","Close");
    close.onclick=function(){ document.body.removeChild(overlay); };
    sheet.appendChild(close);

    overlay.onclick=function(e){ if(e.target===overlay) document.body.removeChild(overlay); };
    overlay.appendChild(sheet);
    document.body.appendChild(overlay);
  }

  window.MB_openLevelSwitcher = openLevelSwitcher;
})();
