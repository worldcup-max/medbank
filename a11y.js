/* MedBank accessibility layer (WCAG 2.2 AA helpers). Additive and app-wide: it upgrades markup the
   app renders, so pages don't each need hand-written ARIA. Touches no study logic.
   1. Clickable <div>/<span> (onclick) become keyboard-operable: Tab reaches them, Enter/Space activates.
   2. Toggle switches and selectable chips report their on/off state; unnamed controls in a
      Settings row take the row's title as their name.
   3. Active nav items and tabs are marked aria-current.
   4. Overlays/modals act as dialogs: focus moves in, Tab stays inside, Escape closes, focus returns.
   5. Toasts are announced to screen readers through a polite live region. */
(function(){
  'use strict';
  var NATIVE=/^(A|BUTTON|INPUT|SELECT|TEXTAREA|LABEL|SUMMARY|OPTION|VIDEO|AUDIO)$/;
  var FOCUSABLE='a[href],button:not([disabled]),input:not([disabled]):not([type=hidden]),select:not([disabled]),textarea:not([disabled]),[tabindex]:not([tabindex="-1"])';
  // onclick handlers that only stop a click bubbling to a backdrop are not actions.
  var NOT_ACTION=/^\s*(event\.stopPropagation\(\)\s*;?\s*)$|^\s*if\s*\(\s*event\.target\s*===?\s*this\s*\)/;
  var SKIP_IDS={scrim:1};

  function textOf(el){ return (el && (el.innerText||el.textContent)||'').replace(/\s+/g,' ').trim(); }
  function stripIcons(t){ return (t||'').replace(/[\u{1F300}-\u{1FAFF}☀-➿←-⇿⬀-⯿]️?/gu,'').replace(/\(\s*\)/g,'').replace(/\s+/g,' ').trim(); }

  function upgradeClickable(el){
    if(el.__mbA11y || NATIVE.test(el.tagName) || SKIP_IDS[el.id]) return;
    var h=el.getAttribute('onclick')||'';
    if(NOT_ACTION.test(h)) return;
    el.__mbA11y=1;
    if(!el.hasAttribute('tabindex')) el.setAttribute('tabindex','0');
    // A container that holds its own buttons stays a plain focusable group (a button can't contain buttons).
    if(!el.hasAttribute('role') && !el.querySelector('button,a[href],input,select,textarea')) el.setAttribute('role','button');
    if(el.classList.contains('vplay') && !el.hasAttribute('aria-label')) el.setAttribute('aria-label','Play voice sample');
    if(el.classList.contains('vchip')||el.classList.contains('archip')) el.setAttribute('aria-pressed', el.classList.contains('on')?'true':'false');
    if(el.classList.contains('navitem')||el.classList.contains('navsub')||el.classList.contains('tab')){
      if(el.classList.contains('active')) el.setAttribute('aria-current','page'); else el.removeAttribute('aria-current');
    }
    if(el.classList.contains('navgrp')){
      var ch=el.querySelector('.chev'); if(ch) el.setAttribute('aria-expanded', textOf(ch)==='▾'?'true':'false');
    }
    // Decorative glyph icons inside a named control are noise to a screen reader.
    var ics=el.querySelectorAll('.ic,.chev'); for(var i=0;i<ics.length;i++) ics[i].setAttribute('aria-hidden','true');
  }

  function nameFromRow(el){
    var row=el.closest('.setrow'); if(!row) return '';
    var b=row.querySelector('b'); return stripIcons(textOf(b));
  }

  function upgradeControl(el){
    if(el.__mbA11yC) return; el.__mbA11yC=1;
    if(el.classList.contains('toggle')){
      el.setAttribute('aria-pressed', el.classList.contains('on')?'true':'false');
      if(!el.getAttribute('aria-label') && !textOf(el)){ var n=nameFromRow(el); if(n) el.setAttribute('aria-label',n); }
      return;
    }
    if(el.id && document.querySelector('label[for="'+el.id+'"]')) return;
    if(el.closest('label') || el.getAttribute('aria-label') || el.getAttribute('aria-labelledby')) return;
    var nm=nameFromRow(el);
    if(!nm && el.placeholder) nm=el.placeholder;
    if(nm){
      if(el.classList.contains('numin') && el.type==='number'){
        var sib=el.parentElement && el.parentElement.querySelectorAll('input[type=number]');
        if(sib && sib.length===2) nm+= (sib[0]===el?' from (hour)':' to (hour)');
      }
      el.setAttribute('aria-label',nm);
    }
  }

  function scan(root){
    if(!root || root.nodeType!==1) return;
    var list=[root].concat([].slice.call(root.querySelectorAll('[onclick],button.toggle,input,select,textarea')));
    for(var i=0;i<list.length;i++){
      var el=list[i];
      if(el.hasAttribute && el.hasAttribute('onclick')) upgradeClickable(el);
      if(/^(INPUT|SELECT|TEXTAREA)$/.test(el.tagName) || (el.tagName==='BUTTON' && el.classList.contains('toggle'))) upgradeControl(el);
    }
    // Icon-only buttons (✕ / ☰ / ▶ …) need a name.
    var btns=root.querySelectorAll ? root.querySelectorAll('button:not([aria-label])') : [];
    for(var j=0;j<btns.length;j++){
      var b=btns[j], t=textOf(b);
      if(/^[✕×xX]$/.test(t)) b.setAttribute('aria-label','Close');
      else if(t==='☰') b.setAttribute('aria-label','Open menu');
      else if(t==='▶') b.setAttribute('aria-label','Play');
      else if(!t && b.title) b.setAttribute('aria-label',b.title);
    }
  }

  /* Enter / Space on an upgraded element = click (native buttons already do this). */
  document.addEventListener('keydown',function(e){
    var el=e.target;
    if(!el || !el.__mbA11y) return;
    if(e.key==='Enter' || e.key===' ' || e.key==='Spacebar'){
      if(e.target!==el) return;
      e.preventDefault(); el.click();
    }
  });

  /* ---------- dialogs ---------- */
  // id → how Escape closes it (null = intentionally not dismissible by Escape)
  var DIALOGS={
    noteov:  function(){ window.closeNoteFull && closeNoteFull(); },
    mbModalOv:function(){ window.mbModalClose && mbModalClose(); },
    gapOverlay:function(){ window.gapExit && gapExit(); },
    csov:    function(){ window.csClose && csClose(); },
    explov:  function(){ window.closeExplainPanel && closeExplainPanel(); },
    vizov:   function(){ var x=document.getElementById('vizX'); if(x) x.click(); },
    vtov:    function(){ var x=document.getElementById('vtX'); if(x) x.click(); },
    obov:    function(){ var x=document.getElementById('obSkip'); if(x) x.click(); },
    strictov:null
  };
  var stack=[];   // {el, ret}
  function dialogFor(node){
    if(!node || node.nodeType!==1) return null;
    if(Object.prototype.hasOwnProperty.call(DIALOGS,node.id)) return node;
    if(node.classList && node.classList.contains('onbd')) return node;
    return null;
  }
  function openDialog(el){
    if(stack.some(function(d){return d.el===el;})) return;
    el.setAttribute('role','dialog'); el.setAttribute('aria-modal','true');
    if(!el.getAttribute('aria-label') && !el.getAttribute('aria-labelledby')){
      var h=el.querySelector('h1,h2,h3,b,strong');
      if(!h){ var w=document.createTreeWalker(el,NodeFilter.SHOW_TEXT,{acceptNode:function(n){ return n.nodeValue.trim()?1:3; }}); var tn=w.nextNode(); h=tn&&tn.parentElement; }
      var t=stripIcons(textOf(h));
      if(t) el.setAttribute('aria-label', t.slice(0,80));
    }
    stack.push({el:el, ret:document.activeElement});
    setTimeout(function(){
      if(!el.isConnected || el.contains(document.activeElement)) return;
      var f=el.querySelector('textarea,input:not([type=hidden]),select') || el.querySelector(FOCUSABLE);
      if(f){ try{ f.focus({preventScroll:true}); }catch(e){ f.focus(); } }
      else { el.setAttribute('tabindex','-1'); el.focus(); }
    },30);
  }
  function closeDialog(el){
    for(var i=stack.length-1;i>=0;i--){
      if(stack[i].el===el){
        var r=stack[i].ret; stack.splice(i,1);
        if(r && r.isConnected && r!==document.body && typeof r.focus==='function'){ try{ r.focus({preventScroll:true}); }catch(e){} }
        else { var m=document.getElementById('main'); if(m){ m.setAttribute('tabindex','-1'); try{ m.focus({preventScroll:true}); }catch(e){} } }
        return;
      }
    }
  }
  document.addEventListener('keydown',function(e){
    var top=stack.length && stack[stack.length-1];
    if(!top || !top.el.isConnected) return;
    var el=top.el;
    if(e.key==='Escape'){
      var fn=el.id && DIALOGS[el.id];
      if(el.classList.contains('onbd')){ var s=el.querySelector('.skip'); fn=s?function(){s.click();}:null; }
      if(fn){ e.preventDefault(); fn(); }
      return;
    }
    if(e.key==='Tab'){
      var f=[].filter.call(el.querySelectorAll(FOCUSABLE),function(n){ return n.offsetParent!==null || n===document.activeElement; });
      if(!f.length){ e.preventDefault(); return; }
      var first=f[0], last=f[f.length-1];
      if(!el.contains(document.activeElement)){ e.preventDefault(); first.focus(); }
      else if(e.shiftKey && document.activeElement===first){ e.preventDefault(); last.focus(); }
      else if(!e.shiftKey && document.activeElement===last){ e.preventDefault(); first.focus(); }
    }
  });

  /* ---------- toasts → live region ---------- */
  var live;
  function announce(msg){
    if(!msg) return;
    if(!live){
      live=document.createElement('div'); live.id='mbLive'; live.className='mb-sr-only';
      live.setAttribute('role','status'); live.setAttribute('aria-live','polite');
      document.body.appendChild(live);
    }
    live.textContent=''; setTimeout(function(){ live.textContent=msg; },60);
  }
  window.mbAnnounce=announce;

  /* ---------- keep focus across re-renders ----------
     Many actions redraw their own section (toggling a nav group, switching a topic tab). The focused
     element is replaced, which drops keyboard focus to <body>. Put it back on the redrawn twin. */
  var lastFocus=null;
  function baseCls(n){ return (n.className||'').toString().replace(/\b(on|active|cs-on|primary)\b/g,'').replace(/\s+/g,' ').trim(); }
  document.addEventListener('focusin',function(e){
    var t=e.target; if(!t || !t.getAttribute) return;
    var all=document.querySelectorAll(FOCUSABLE+',[onclick]');
    lastFocus={el:t, oc:t.getAttribute('onclick'), id:t.id, idx:[].indexOf.call(all,t), tag:t.tagName, cls:baseCls(t)};
  });
  function restoreFocus(){
    if(!lastFocus || lastFocus.el.isConnected) return;
    var a=document.activeElement; if(a && a!==document.body) return;
    var twin=null;
    try{
      if(lastFocus.id) twin=document.getElementById(lastFocus.id);
      if(!twin && lastFocus.oc) twin=document.querySelector('[onclick="'+CSS.escape(lastFocus.oc)+'"]');
      if(!twin && lastFocus.idx>=0){   // same control redrawn with a new state (e.g. a toggle whose onclick flips): same slot, same kind
        var c=document.querySelectorAll(FOCUSABLE+',[onclick]')[lastFocus.idx];
        if(c && c.tagName===lastFocus.tag && baseCls(c)===lastFocus.cls) twin=c;
      }
    }catch(e){}
    if(twin && twin.offsetParent!==null){ try{ twin.focus({preventScroll:true}); }catch(e){} }
  }

  /* ---------- observer ---------- */
  function onAdded(n){
    if(n.nodeType!==1) return;
    scan(n);
    var d=dialogFor(n); if(d) openDialog(d);
    if(n.classList && n.classList.contains('mbtoast')) announce(textOf(n));
  }
  function start(){
    scan(document.body);
    Object.keys(DIALOGS).forEach(function(id){ var d=document.getElementById(id); if(d) openDialog(d); });   // opened before this script loaded
    [].forEach.call(document.querySelectorAll('.onbd'),openDialog);
    var mo=new MutationObserver(function(muts){
      for(var i=0;i<muts.length;i++){
        var m=muts[i];
        if(m.type==='attributes'){
          var t=m.target;
          if(t.__mbA11y){ t.__mbA11y=0; upgradeClickable(t); }
          if(t.__mbA11yC && t.classList.contains('toggle')) t.setAttribute('aria-pressed', t.classList.contains('on')?'true':'false');
          continue;
        }
        for(var j=0;j<m.addedNodes.length;j++) onAdded(m.addedNodes[j]);
        for(var k=0;k<m.removedNodes.length;k++){
          var r=m.removedNodes[k]; if(r.nodeType!==1) continue;
          for(var s=stack.length-1;s>=0;s--) if(stack[s].el===r || r.contains(stack[s].el)) closeDialog(stack[s].el);
        }
      }
      restoreFocus();
    });
    mo.observe(document.body,{childList:true,subtree:true,attributes:true,attributeFilter:['class']});
    // Landmark name + the hamburger's open/closed state
    var hb=document.getElementById('hamburger');
    if(hb){
      hb.setAttribute('aria-label','Open menu'); hb.setAttribute('aria-controls','sidebar');
      var sync=function(){ var o=document.body.classList.contains('navopen'); hb.setAttribute('aria-expanded',o?'true':'false'); hb.setAttribute('aria-label',o?'Close menu':'Open menu'); };
      sync(); new MutationObserver(sync).observe(document.body,{attributes:true,attributeFilter:['class']});
    }
    var sb=document.getElementById('sidebar'); if(sb && !sb.getAttribute('aria-label')) sb.setAttribute('aria-label','Main');
  }
  if(document.body) start(); else document.addEventListener('DOMContentLoaded',start);

  /* Move focus to the new page's content after in-app navigation, so keyboard and screen-reader
     users start at the top of what changed instead of on a stale nav item. */
  window.addEventListener('hashchange',function(){
    setTimeout(function(){
      var m=document.getElementById('main'); if(!m) return;
      if(stack.length) return;
      if(m.contains(document.activeElement) && document.activeElement!==m) return;   // the page already placed focus (e.g. the search box)
      var h=m.querySelector('h1,h2');
      var tgt=h||m;
      if(!tgt.hasAttribute('tabindex')) tgt.setAttribute('tabindex','-1');
      try{ tgt.focus({preventScroll:true}); }catch(e){}
    },50);
  });
})();
