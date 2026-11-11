/* MedBank — Whiteboard Visualize ("Auntie Explains" style)
 *
 * The new Visualize: a narrated whiteboard lesson. Labelled doodles draw themselves on a
 * whiteboard while the voice explains, with word-by-word captions, progress dashes and
 * speed / mute / restart. Two modes, picked by the student before it is built:
 *   standard — explains simply but keeps the exam terms
 *   layman   — Auntie: one everyday analogy, no jargon
 *
 * The server (POST /board, import-server/board.mjs) only decides WHAT is on the board and
 * what is said; this file places everything on one of five fixed layouts (hub, chain,
 * cycle, compare, list), so a board always fits a phone screen.
 *
 * It takes over the existing entry points when FEATURES.WHITEBOARD is on:
 *   window.aiVisualize            highlight → 🎬 Visualize this, the Videos tab, ▶ watch chips
 *   window.aiVisualizeInline      "Visualize how to get this answer" under a question card
 *   window.aiVisualizeInlineSaved "Watch your explainer" (a card's saved explainer)
 * Explainers saved before the switch (old blueprints) still replay in the old player.
 * Narration uses the app's own voice stack (voiceSpeak / warmSpeak), so nothing new is paid for.
 */
(function(){
  'use strict';
  var CFG = window.MEDBANK_CONFIG || {};
  if(CFG.FEATURES && CFG.FEATURES.WHITEBOARD === false) return;

  /* ---------------- styles ---------------- */
  function injectStyles(){
    if(document.getElementById('wbStyles')) return;
    try{ var l=document.createElement('link'); l.rel='stylesheet'; l.href='https://fonts.googleapis.com/css2?family=Caveat:wght@500;700&display=swap'; document.head.appendChild(l); }catch(e){}
    var css = ''
    + '.wbov{position:fixed;inset:0;z-index:9000;background:rgba(30,20,60,.45);display:flex;align-items:center;justify-content:center;padding:12px}'
    + '.wbpanel{background:#f6f4fb;border-radius:20px;width:100%;max-width:520px;max-height:100%;overflow:auto;box-shadow:0 20px 60px rgba(40,20,90,.35);display:flex;flex-direction:column}'
    + '.wbhd{display:flex;align-items:center;gap:8px;padding:12px 14px 8px}'
    + '.wbhd b{font-size:15px;color:#2b2540;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;min-width:0;max-width:45%}.wbhd .wbchip{white-space:nowrap}'
    + '.wbchip{font-size:11px;font-weight:800;border-radius:99px;padding:3px 9px;background:#ede7fb;color:#5b21b6}'
    + '.wbchip.lay{background:#fff1dc;color:#b45309}'
    + '.wbq{font-size:11px;color:#6b6580;font-weight:700}.wbq.low{color:#dc2626}'
    + '.wbsp{flex:1}'
    + '.wbbtn{border:1px solid #e3def0;background:#fff;border-radius:9px;min-width:34px;height:32px;padding:0 9px;font-weight:800;font-size:13px;color:#3a3550;cursor:pointer}'
    + '.wbbtn:active{transform:scale(.96)}'
    + '.wbx{border:0;background:transparent;font-size:18px;color:#6b6580;cursor:pointer;padding:4px 6px}'
    + '.wbboard{position:relative;margin:0 12px;background:#fff;border:1px solid #e7e3f0;border-radius:16px;box-shadow:0 2px 0 #ece8f5;overflow:hidden}'
    + '.wbboard svg{display:block;width:100%;height:auto}'
    + '.wbbadge{position:absolute;bottom:8px;right:10px;font-size:10.5px;font-weight:800;color:#5b21b6;background:#efe9fd;border-radius:7px;padding:3px 7px;z-index:2}'
    + '.wbcap{min-height:58px;padding:12px 16px 4px;text-align:center;font-weight:800;font-size:17px;line-height:1.35;color:#2b2540}'
    + '.wbcap .w{color:#c9c4d8;transition:color .12s}.wbcap .w.on{color:#2b2540}'
    + '.wbdash{display:flex;gap:4px;padding:8px 16px 4px}'
    + '.wbdash i{flex:1;height:5px;border-radius:3px;background:#e2ddef;cursor:pointer}'
    + '.wbdash i.done{background:#6d28d9}.wbdash i.cur{background:#f59e0b}'
    + '.wbft{display:flex;align-items:center;gap:8px;padding:8px 14px 14px;font-size:13px;font-weight:700;color:#4b4565}'
    + '.wbeq{display:inline-flex;gap:2px;align-items:center;height:16px}.wbeq i{width:3px;height:4px;background:#6d28d9;border-radius:2px}'
    + '.wbeq.on i{animation:wbeq .7s ease-in-out infinite}.wbeq.on i:nth-child(2){animation-delay:.1s}.wbeq.on i:nth-child(3){animation-delay:.25s}.wbeq.on i:nth-child(4){animation-delay:.05s}.wbeq.on i:nth-child(5){animation-delay:.18s}'
    + '@keyframes wbeq{0%,100%{height:4px}50%{height:15px}}'
    + '.wbplay{margin-left:auto;background:#6d28d9;color:#fff;border:0;border-radius:99px;height:36px;min-width:36px;padding:0 14px;font-weight:800;cursor:pointer}'
    + '.wbs{fill:none;stroke-linecap:round;stroke-linejoin:round;transition:stroke-dashoffset .8s ease-in-out}'
    + '.wbt{opacity:0;clip-path:inset(0 100% 0 0);transition:clip-path .7s ease-out,opacity .15s}'
    + '.wbt.on{opacity:1;clip-path:inset(0 0 0 0)}'
    + '.wbhl{fill:none;stroke:#fde047;stroke-opacity:.55;stroke-linecap:round;transition:stroke-dashoffset .45s ease-out,opacity .4s}'
    + '.wbhand{font-family:Caveat,"Segoe Print","Comic Sans MS",cursive}'
    + '.wbend{position:absolute;inset:0;background:rgba(255,255,255,.93);display:flex;flex-direction:column;align-items:center;justify-content:center;gap:10px;padding:20px;text-align:center;z-index:3}'
    + '.wbend h3{margin:0;font-size:20px;color:#2b2540}'
    + '.wbend button{width:100%;max-width:260px;border-radius:12px;padding:11px;font-weight:800;font-size:14px;border:1px solid #e3def0;background:#fff;color:#3a3550;cursor:pointer}'
    + '.wbend button.pri{background:#6d28d9;color:#fff;border-color:transparent}'
    + '.wbposter{position:absolute;inset:0;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:10px;background:rgba(255,255,255,.75);cursor:pointer;z-index:3}'
    + '.wbposter .pb{width:64px;height:64px;border-radius:50%;background:#6d28d9;color:#fff;display:flex;align-items:center;justify-content:center;font-size:24px;box-shadow:0 8px 24px rgba(109,40,217,.35)}'
    + '.wbposter span{font-weight:800;color:#3a3550;font-size:14px}'
    + '.wbpvbar{display:flex;align-items:center;gap:6px;padding:10px 12px 0;font-size:12.5px;font-weight:800;color:#4b4565}'
    + '.wbpvt{flex:1;min-width:0;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}'
    + '.wbbtn:disabled{opacity:.4}'
    + '.wbread{border:0;background:#2b2540;color:#fff;border-radius:9px;height:32px;padding:0 11px;font-weight:800;font-size:12.5px;cursor:pointer;white-space:nowrap}'
    + '.wbinline{background:#f6f4fb;border:1px solid #e7e3f0;border-radius:16px;padding-top:8px;margin-top:10px}'
    + '.wbinline .wbhd{padding-top:2px}'
    + '.wbsheet{position:fixed;inset:0;z-index:9100;background:rgba(30,20,60,.4);display:flex;align-items:flex-end;justify-content:center}'
    + '.wbsheet .in{background:#fff;width:100%;max-width:520px;border-radius:20px 20px 0 0;padding:18px 16px 22px;box-shadow:0 -10px 40px rgba(40,20,90,.25)}'
    + '.wbsheet h3{margin:0 0 4px;font-size:17px;color:#2b2540}.wbsheet p{margin:0 0 12px;font-size:13px;color:#6b6580}'
    + '.wbopt{display:flex;gap:12px;align-items:center;width:100%;text-align:left;border:2px solid #ece8f5;background:#fff;border-radius:14px;padding:12px 14px;margin-bottom:10px;cursor:pointer}'
    + '.wbopt.last{border-color:#c4b5fd;background:#faf7ff}'
    + '.wbopt .ic{font-size:26px}.wbopt b{display:block;font-size:15px;color:#2b2540}.wbopt span{font-size:12.5px;color:#6b6580}'
    + '.wbopt .tag{margin-left:auto;font-size:10.5px;font-weight:800;color:#6d28d9}'
    + '.wbcancel{width:100%;border:0;background:transparent;color:#6b6580;font-weight:700;padding:8px;cursor:pointer}'
    + '.wbpick{background:#f6f4fb;border:1px solid #e7e3f0;border-radius:14px;padding:12px;margin-top:10px}'
    + '.wbpick .hd{font-weight:800;font-size:13px;color:#3a3550;margin-bottom:8px}'
    + '.wbpick .row{display:flex;gap:8px}.wbpick .wbopt{margin:0;flex:1;padding:10px;flex-direction:column;align-items:flex-start;gap:2px}'
    + '.wbpick .wbopt .ic{font-size:20px}'
    + '.wbgen{display:flex;gap:10px;align-items:center;background:#f6f4fb;border:1px dashed #d8d0ee;border-radius:14px;padding:12px;margin-top:10px;font-size:13px;color:#4b4565}'
    + '.wbgen.err{border-style:solid;border-color:#fecaca;background:#fef2f2;color:#b91c1c}'
    + '.wbspin{width:20px;height:20px;border:3px solid #ddd6fe;border-top-color:#6d28d9;border-radius:50%;animation:wbspin .8s linear infinite;flex:none}'
    + '@keyframes wbspin{to{transform:rotate(360deg)}}'
    + '.wbfloat{position:fixed;left:50%;transform:translateX(-50%);bottom:84px;z-index:8800;background:#2b2540;color:#fff;border-radius:99px;padding:11px 18px;font-weight:800;font-size:13.5px;box-shadow:0 10px 30px rgba(30,20,60,.35);display:flex;gap:9px;align-items:center;cursor:default;max-width:92vw}'
    + '.wbfloat.ready{background:#6d28d9;cursor:pointer;animation:wbpop .5s ease-out}.wbfloat.err{background:#b91c1c}'
    + '@keyframes wbpop{0%{transform:translateX(-50%) scale(.9)}60%{transform:translateX(-50%) scale(1.05)}100%{transform:translateX(-50%) scale(1)}}'
    + '@media (max-width:480px){.wbov{padding:0;align-items:stretch}.wbpanel{border-radius:0;max-width:none}.wbcap{font-size:16px}}';
    var st=document.createElement('style'); st.id='wbStyles'; st.textContent=css; document.head.appendChild(st);
  }

  /* ---------------- helpers ---------------- */
  function esc(s){ return String(s==null?'':s).replace(/[&<>"']/g,function(c){ return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]; }); }
  function sleep(ms){ return new Promise(function(r){ setTimeout(r,ms); }); }
  function hash(s){ var h=2166136261; s=String(s||''); for(var i=0;i<s.length;i++){ h^=s.charCodeAt(i); h=Math.imul(h,16777619); } return h>>>0; }
  function rng(seed){ var a=seed||1; return function(){ a|=0; a=a+0x6D2B79F5|0; var t=Math.imul(a^a>>>15,1|a); t=t+Math.imul(t^t>>>7,61|t)^t; return ((t^t>>>14)>>>0)/4294967296; }; }
  function toast(m){ try{ if(window.mbToast) window.mbToast(m); }catch(e){} }
  function settings(){ try{ window.DATA=window.DATA||{}; DATA.settings=DATA.settings||{}; return DATA.settings; }catch(e){ return {}; } }
  function save(){ try{ if(window.persist) window.persist(); }catch(e){} try{ if(window.MB_SYNC&&MB_SYNC.flush) MB_SYNC.flush(); }catch(e){} }

  var MODES = {
    standard:{ label:'Standard', icon:'🎓', blurb:'Clear and simple, keeps the exam terms', narrator:'Explaining' },
    layman:  { label:'Layman', icon:'👩🏾', blurb:'Auntie explains it with an everyday story, no jargon', narrator:'Auntie is explaining' }
  };
  function otherMode(m){ return m==='layman'?'standard':'layman'; }

  /* ---------------- doodles (hand-drawn icons in a 40×40 box) ---------------- */
  var D = {
    circle:['M20 5a15 15 0 1 1-.1 0'],
    cell:['M20 4C31 4 37 11 36 21S28 37 19 36 4 30 4 20 10 4 20 4Z','M20 15a5 5 0 1 1-.1 0','M10 26l3 1M27 10l2 2M28 27l-2 1'],
    nucleus:['M20 6a14 14 0 1 1-.1 0','M20 14a6 6 0 1 1-.1 0','M17 20q3-3 6 0'],
    dna:['M12 3C12 13 28 15 28 22S12 29 12 37','M28 3C28 13 12 15 12 22S28 29 28 37','M14 9h12M15 31h10M17 17h6M17 25h6'],
    mitochondria:['M6 20C6 12 13 9 20 9S34 12 34 20 27 31 20 31 6 28 6 20Z','M10 20l3-5 3 10 3-10 3 10 3-10 3 10 3-5'],
    heart:['M20 34C7 25 4 16 9 10S19 7 20 13C21 7 27 5 31 10S33 25 20 34Z'],
    lung:['M20 4V16M20 16L14 21M20 16L26 21','M14 12C7 13 5 24 6 32 7 36 13 35 15 31 17 26 17 17 14 12Z','M26 12C33 13 35 24 34 32 33 36 27 35 25 31 23 26 23 17 26 12Z'],
    brain:['M20 8C15 4 8 7 8 12 4 14 4 21 8 23 7 29 12 33 17 31 19 34 20 33 20 8Z','M20 8C25 4 32 7 32 12 36 14 36 21 32 23 33 29 28 33 23 31 21 34 20 33','M12 16q4 2 3 6M28 16q-4 2-3 6'],
    kidney:['M26 6C17 4 9 10 9 20S17 36 26 34C32 33 33 27 29 24 25 21 25 18 29 15 33 12 32 7 26 6Z','M25 20h-7'],
    liver:['M5 14C12 8 30 6 35 11 37 16 28 20 22 25 16 31 9 31 6 26 4 22 4 17 5 14Z'],
    stomach:['M16 4V12C16 15 12 16 10 20 7 26 11 34 19 34 28 34 34 28 34 21 34 15 28 13 25 16 22 19 22 12 22 4'],
    bone:['M11 13a4 4 0 1 1 3-6 4 4 0 1 1 5 4L29 21a4 4 0 1 1 4 5 4 4 0 1 1-6 3L17 19a4 4 0 1 1-6-6Z'],
    muscle:['M8 20C12 10 28 10 32 20 28 30 12 30 8 20Z','M3 20H8M32 20H37','M14 17q6-2 12 0M14 23q6 2 12 0'],
    eye:['M4 20Q20 6 36 20 20 34 4 20Z','M20 15a5 5 0 1 1-.1 0'],
    vessel:['M3 14C12 10 28 18 37 14','M3 26C12 22 28 30 37 26','M12 20h3M22 21h3'],
    blood:['M13 13a7 5 0 1 1-.1 0','M27 25a7 5 0 1 1-.1 0','M11 13h4M25 25h4'],
    drop:['M20 4C26 14 31 20 31 26A11 11 0 0 1 9 26C9 20 14 14 20 4Z'],
    bacteria:['M10 15H28A6 6 0 0 1 28 27H10A6 6 0 0 1 10 15Z','M34 21q3-4 5 0','M15 21h2M22 20h2'],
    virus:['M20 12a8 8 0 1 1-.1 0','M20 12V5M20 28V35M12 20H5M28 20H35M14 14L9 9M26 26L31 31M26 14L31 9M14 26L9 31'],
    pill:['M9 25L21 13A6 6 0 0 1 30 22L18 34A6 6 0 0 1 9 25Z','M15 19L24 28'],
    syringe:['M30 6L34 10M32 8L14 26M28 8L32 12','M24 12L12 24 16 28 28 16','M12 24L6 34'],
    shield:['M20 4L33 9V19C33 28 27 34 20 37 13 34 7 28 7 19V9Z','M14 20l4 4 8-9'],
    bolt:['M23 3L10 22H19L16 37 30 16H21Z'],
    fire:['M20 36C11 36 8 29 10 23 12 18 16 16 15 9 21 12 23 17 22 21 25 19 26 16 26 14 30 18 32 24 30 29 28 34 24 36 20 36Z'],
    clock:['M20 5a15 15 0 1 1-.1 0','M20 11V20L26 24'],
    lock:['M10 18H30V35H10Z','M14 18V12A6 6 0 0 1 26 12V18','M20 25V29'],
    key:['M13 20a6 6 0 1 1-.1 0','M19 20H36M31 20V26M35 20V24'],
    gear:['M20 12a8 8 0 1 1-.1 0','M20 4V9M20 31V36M4 20H9M31 20H36M9 9L12 12M28 28L31 31M31 9L28 12M12 28L9 31'],
    factory:['M4 35V18L13 23V18L22 23V10H28V35Z','M4 35H36','M28 10V5H32V35'],
    house:['M5 20L20 7 35 20','M9 17V34H31V17','M17 34V25H23V34'],
    person:['M20 6a5 5 0 1 1-.1 0','M20 16V27M11 21H29M20 27L13 36M20 27L27 36'],
    battery:['M6 12H32V30H6Z','M32 17H36V25H32','M20 14L15 22H21L18 28'],
    truck:['M3 12H24V28H3Z','M24 18H31L36 23V28H24','M10 31a3 3 0 1 1-.1 0M29 31a3 3 0 1 1-.1 0'],
    pot:['M7 18H33V27C33 32 28 35 20 35S7 32 7 27Z','M4 18H36','M14 13q2-4 0-8M20 13q2-4 0-8M26 13q2-4 0-8'],
    crown:['M6 30L8 12 15 21 20 9 25 21 32 12 34 30Z','M6 34H34'],
    star:['M20 4L24 15H36L26 22 30 34 20 27 10 34 14 22 4 15H16Z'],
    up:['M20 36V6M9 17L20 6 31 17'],
    down:['M20 4V34M9 23L20 34 31 23'],
    check:['M6 21L15 30 34 9'],
    cross:['M9 9L31 31M31 9L9 31'],
    question:['M13 13C13 6 27 5 27 13 27 19 20 19 20 26','M20 33v1'],
    molecule:['M20 6L31 12V26L20 33 9 26V12Z','M20 6V1M31 26L36 29M9 26L4 29'],
    book:['M20 9C15 6 9 6 4 8V33C9 31 15 31 20 34 25 31 31 31 36 33V8C31 6 25 6 20 9Z','M20 9V34'],
    door:['M10 36V5H30V36','M4 36H36','M25 21v1'],
    scale:['M20 5V34M10 34H30','M7 10H33','M7 10L3 21H11ZM33 10L29 21H37Z'],
    wave:['M3 20C8 10 12 10 16 20S24 30 28 20 34 10 37 20']
  };
  var COLORS=['#6d28d9','#d97706','#0d9488','#dc2626','#2563eb','#db2777','#65a30d'];
  var INK='#3b3551', TITLE='#2563eb';

  /* ---------------- board drawing ---------------- */
  var NS='http://www.w3.org/2000/svg';
  function el(tag,attrs,parent){ var e=document.createElementNS(NS,tag); for(var k in attrs) e.setAttribute(k,attrs[k]); if(parent) parent.appendChild(e); return e; }
  function wrap(text,max){ var words=String(text||'').split(/\s+/), lines=[], cur=''; words.forEach(function(w){ if((cur+' '+w).trim().length>max && cur){ lines.push(cur); cur=w; } else cur=(cur+' '+w).trim(); }); if(cur) lines.push(cur); return lines.slice(0,2); }

  function Board(svg, board){
    this.svg=svg; this.b=board; this.R=rng(hash(board.title+board.layout)); this.groups={}; this.hl={};
  }
  Board.prototype.wobLine=function(x1,y1,x2,y2,g,color,w){
    var R=this.R, mx=(x1+x2)/2+(R()-.5)*6, my=(y1+y2)/2+(R()-.5)*6;
    return this.stroke('M'+x1+' '+y1+'Q'+mx+' '+my+' '+x2+' '+y2, g, color||INK, w||2);
  };
  Board.prototype.wobCircle=function(cx,cy,rx,ry,g,color,w){
    var R=this.R, n=14, pts=[]; for(var k=0;k<=n+1;k++){ var a=(k/n)*Math.PI*2-Math.PI/2, j=1+(R()-.5)*.05; pts.push([cx+Math.cos(a)*rx*j, cy+Math.sin(a)*ry*j]); }
    var d='M'+((pts[0][0]+pts[1][0])/2).toFixed(1)+' '+((pts[0][1]+pts[1][1])/2).toFixed(1);
    for(var i=1;i<pts.length-1;i++){ var mx=(pts[i][0]+pts[i+1][0])/2, my=(pts[i][1]+pts[i+1][1])/2; d+='Q'+pts[i][0].toFixed(1)+' '+pts[i][1].toFixed(1)+' '+mx.toFixed(1)+' '+my.toFixed(1); }
    return this.stroke(d,g,color||INK,w||2);
  };
  Board.prototype.arrowHead=function(x,y,ang,g,color){
    var a1=ang+Math.PI*0.82, a2=ang-Math.PI*0.82, L=9;
    return this.stroke('M'+(x+Math.cos(a1)*L).toFixed(1)+' '+(y+Math.sin(a1)*L).toFixed(1)+'L'+x.toFixed(1)+' '+y.toFixed(1)+'L'+(x+Math.cos(a2)*L).toFixed(1)+' '+(y+Math.sin(a2)*L).toFixed(1), g, color||INK, 2);
  };
  Board.prototype.stroke=function(d,g,color,w){ return el('path',{d:d,'class':'wbs',stroke:color,'stroke-width':w||2.4},g); };
  Board.prototype.text=function(x,y,str,g,o){ o=o||{};
    var t=el('text',{x:x,y:y,'class':'wbt'+(o.hand?' wbhand':''),'text-anchor':o.anchor||'middle',fill:o.color||INK,'font-size':o.size||14,'font-weight':o.weight||400},g);
    if(o.italic) t.setAttribute('font-style','italic'); t.textContent=str; return t; };
  Board.prototype.doodle=function(name,cx,cy,size,g,color){
    var s=size/40, gg=el('g',{transform:'translate('+(cx-size/2)+' '+(cy-size/2)+') scale('+s+')'},g);
    (D[name]||D.circle).forEach(function(d){ el('path',{d:d,'class':'wbs',stroke:color,'stroke-width':(2.4/s).toFixed(2)},gg); }); return gg; };
  /* one item: doodle on top, label, then the note in quotes/small */
  Board.prototype.block=function(it,x,y,color,o){ o=o||{};
    var g=el('g',{'data-id':it.id},this.svg); this.groups[it.id]=g;
    var align=o.anchor||'middle', dx=0;
    if(align==='start'){ this.doodle(it.doodle,x+18,y,34,g,color); dx=44; }
    else this.doodle(it.doodle,x,y-26,34,g,color);
    var ly=align==='start'?y-4:y+12, lx=x+dx, fs=it.label.length>14?19:(it.label.length>10?21:24);
    if(align==='middle'){ var half=Math.max(it.label.length*fs*0.24, 62); lx=Math.min(Math.max(lx,half+6),400-half-6); }   // keep the label on the board
    var lab=this.text(lx,ly,it.label,g,{hand:true,size:fs,weight:700,color:color,anchor:align});
    var nl=wrap(it.note?(this.b.mode==='layman'?'"'+it.note+'"':it.note):'', align==='start'?34:20);
    nl.forEach(function(line,k){ this.text(lx,ly+18+k*15,line,g,{size:12.5,color:'#4b4565',anchor:align,italic:this.b.mode==='layman'}); },this);
    // highlighter swoosh behind the label (shown while this item is being talked about)
    var w=Math.min(150,it.label.length*fs*0.42+10), hx=align==='start'?lx:lx-w/2;
    var hl=el('path',{d:'M'+hx+' '+(ly-6)+'L'+(hx+w)+' '+(ly-7),'class':'wbhl','stroke-width':16},null);
    g.insertBefore(hl,g.firstChild); this.hl[it.id]=hl; return {g:g,label:lab};
  };
  Board.prototype.draw=function(){
    var b=this.b, svg=this.svg, W=400, items=b.items, n=items.length, H=480, self=this;
    var head=el('g',{'data-id':'_title'},svg); this.groups._title=head;
    this.text(20,46,b.title,head,{hand:true,size:b.title.length>26?27:33,weight:700,color:TITLE,anchor:'start'});
    if(b.subtitle) this.text(22,68,b.subtitle,head,{size:13,color:'#6b6580',anchor:'start',italic:true});
    var col=function(k){ return COLORS[k%COLORS.length]; };
    if(b.layout==='hub'||b.layout==='cycle'){
      var cx=200, cy=275, rx=n<=4?130:136, ry=n<=4?120:135, cr=b.layout==='hub'?58:44;
      var cg=el('g',{'data-id':'_center'},svg); this.groups._center=cg;
      if(b.layout==='hub') this.wobCircle(cx,cy,cr,cr*.92,cg,'#8b84a3',2.2);
      this.doodle(b.center.doodle,cx,cy-8,b.layout==='hub'?44:36,cg,'#6b6580');
      this.text(cx,cy+(b.layout==='hub'?32:30),b.center.label,cg,{hand:true,size:20,weight:700,color:'#4b4565'});
      var angs=items.map(function(_,k){ return n===2? (k?0:Math.PI) : -Math.PI/2+k*2*Math.PI/n; });
      items.forEach(function(it,k){
        var a=angs[k], x=cx+Math.cos(a)*rx, y=cy+Math.sin(a)*ry;
        var bl=self.block(it,x,y,col(k));
        if(b.layout==='hub'){ // a pointer from the item into the centre
          var sx=cx+Math.cos(a)*(rx-62), sy=cy+Math.sin(a)*(ry-62), ex=cx+Math.cos(a)*(cr+6), ey=cy+Math.sin(a)*(cr*.92+6);
          if(Math.hypot(sx-ex,sy-ey)>12) self.wobLine(sx,sy,ex,ey,bl.g,col(k),1.8);
        }
      });
      if(b.layout==='cycle'){ // arrows between consecutive items round the loop, drawn with the item they lead to
        var rr=Math.min(rx,ry)*.58;
        items.forEach(function(it,k){
          var a0=angs[k]+0.32, a1=angs[(k+1)%n]-0.32; if(a1<a0) a1+=Math.PI*2;
          var p0=[cx+Math.cos(a0)*rr*1.25, cy+Math.sin(a0)*rr], p1=[cx+Math.cos(a1)*rr*1.25, cy+Math.sin(a1)*rr], am=(a0+a1)/2;
          var pm=[cx+Math.cos(am)*rr*1.5, cy+Math.sin(am)*rr*1.22];
          var g=self.groups[items[(k+1)%n].id];
          self.stroke('M'+p0[0].toFixed(1)+' '+p0[1].toFixed(1)+'Q'+pm[0].toFixed(1)+' '+pm[1].toFixed(1)+' '+p1[0].toFixed(1)+' '+p1[1].toFixed(1),g,INK,1.8);
          self.arrowHead(p1[0],p1[1],Math.atan2(p1[1]-pm[1],p1[0]-pm[0]),g,INK);
        });
      }
      H=Math.round(cy+ry+60);
    } else if(b.layout==='compare'){
      var y0=112, cols=[[],[]]; items.forEach(function(it,k){ cols[it.col||0].push([it,k]); });
      var rows=Math.max(cols[0].length,cols[1].length); H=y0+70+rows*96;
      var hg=el('g',{'data-id':'_center'},svg); this.groups._center=hg;
      [105,295].forEach(function(x,c){ var c2=c?COLORS[1]:COLORS[0];
        self.text(x,y0,b.columns[c],hg,{hand:true,size:25,weight:700,color:c2});
        self.wobLine(x-55,y0+8,x+55,y0+9,hg,c2,2); });
      this.wobLine(200,y0-20,200,H-20,hg,'#cfc9de',1.6);
      this.text(200,y0+40,'vs',hg,{hand:true,size:22,weight:700,color:'#8b84a3'});
      cols.forEach(function(list,c){ list.forEach(function(p,r){ self.block(p[0],c?295:105,y0+86+r*96,COLORS[c?1:0]); }); });
    } else { // chain or list: one row per item, top to bottom
      var top=104, rowH=n>5?74:84; H=top+n*rowH+14;
      items.forEach(function(it,k){
        var y=top+k*rowH+26, bl=self.block(it,26,y,col(k),{anchor:'start'});
        if(b.layout==='chain' && k>0){ var ay0=y-rowH+18, ay1=y-22; self.wobLine(44,ay0,44,ay1,bl.g,INK,1.8); self.arrowHead(44,ay1,Math.PI/2,bl.g,INK); }
        if(b.layout==='list'){ self.text(16,y+4,(k+1)+'',bl.g,{hand:true,size:18,weight:700,color:'#8b84a3'}); }
      });
    }
    H=Math.max(H,300); svg.setAttribute('viewBox','0 0 '+W+' '+H);
    // every stroke starts undrawn
    Array.prototype.forEach.call(svg.querySelectorAll('.wbs,.wbhl'),function(p){ var L=400; try{ L=Math.ceil(p.getTotalLength())+2; }catch(e){} p.style.strokeDasharray=L; p.style.strokeDashoffset=L; p.style.transition='none'; });
    svg.getBoundingClientRect();   // flush so the next change animates
  };
  Board.prototype.reveal=function(id,instant){
    var g=this.groups[id]; if(!g||g._on) return; g._on=true; var d=0;
    Array.prototype.forEach.call(g.querySelectorAll('.wbs,.wbt'),function(p){
      if(instant){ p.style.transition='none'; } else { p.style.transition=''; p.style.transitionDelay=(d*0.18)+'s'; d++; }
      if(p.classList.contains('wbt')) p.classList.add('on'); else p.style.strokeDashoffset='0';
    });
  };
  Board.prototype.highlight=function(ids){ var self=this;
    Object.keys(this.hl).forEach(function(id){ var p=self.hl[id], on=ids.indexOf(id)>=0;
      p.style.transition=''; p.style.opacity=on?'1':'0'; if(on) p.style.strokeDashoffset='0'; }); };
  Board.prototype.reset=function(){ var self=this;
    Object.keys(this.groups).forEach(function(id){ self.groups[id]._on=false; });
    Array.prototype.forEach.call(this.svg.querySelectorAll('.wbs,.wbhl'),function(p){ p.style.transition='none'; p.style.strokeDashoffset=p.style.strokeDasharray; });
    Array.prototype.forEach.call(this.svg.querySelectorAll('.wbt'),function(t){ t.style.transition='none'; t.classList.remove('on'); });
    this.svg.getBoundingClientRect();
    Array.prototype.forEach.call(this.svg.querySelectorAll('.wbt'),function(t){ t.style.transition=''; }); };

  /* ---------------- player ---------------- */
  var SPEEDS=[0.75,1,1.25,1.5];
  var ACTIVE=[];   // live players (so leaving a card / closing can stop them)
  function Player(host, board, opts){
    opts=opts||{}; this.opts=opts; this.b=board; this.k=-1; this.playing=false; this.tok=0;
    this.muted=!!settings().boardMuted; this.speed=settings().boardSpeed||1;
    var mode=MODES[board.mode]||MODES.standard, self=this;
    host.innerHTML=''
      +'<div class="wbhd"><b>'+esc(opts.label||'🎬 Visualize')+'</b><span class="wbchip'+(board.mode==='layman'?' lay':'')+'">'+mode.icon+' '+mode.label+'</span><span class="wbq" data-r="q"></span><span class="wbsp"></span>'
      +'<button class="wbbtn" data-r="speed" title="Speed">'+this.speed+'×</button>'
      +'<button class="wbbtn" data-r="mute" title="Sound">'+(this.muted?'🔇':'🔊')+'</button>'
      +'<button class="wbbtn" data-r="restart" title="Start again">↻</button>'
      +(opts.inline?'':'<button class="wbx" data-r="close" aria-label="Close">✕</button>')+'</div>'
      +'<div class="wbboard"><span class="wbbadge">Built from your note</span><svg xmlns="'+NS+'" viewBox="0 0 400 480" role="img" aria-label="'+esc(board.title)+'"></svg></div>'
      +'<div class="wbcap" data-r="cap" aria-live="polite"></div>'
      +'<div class="wbdash" data-r="dash">'+board.steps.map(function(_,k){ return '<i data-k="'+k+'"></i>'; }).join('')+'</div>'
      +'<div class="wbft"><span class="wbeq" data-r="eq"><i></i><i></i><i></i><i></i><i></i></span><span>'+mode.narrator+'</span><button class="wbplay" data-r="play">▶ Play</button></div>';
    this.host=host; this.$=function(r){ return host.querySelector('[data-r="'+r+'"]'); };
    this.board=new Board(host.querySelector('svg'), board); this.board.draw();
    this.board.reveal('_title',true);
    this.$('speed').onclick=function(){ var i=SPEEDS.indexOf(self.speed); self.speed=SPEEDS[(i+1)%SPEEDS.length]; this.textContent=self.speed+'×'; settings().boardSpeed=self.speed; if(self.playing) self.go(self.k); };
    this.$('mute').onclick=function(){ self.muted=!self.muted; this.textContent=self.muted?'🔇':'🔊'; settings().boardMuted=self.muted; if(self.playing) self.go(self.k); };
    this.$('restart').onclick=function(){ self.restart(); };
    this.$('play').onclick=function(){ if(self.playing) self.pause(); else { try{ if(window.unlockAudio) unlockAudio(); }catch(e){} self.play(); } };
    if(this.$('close')) this.$('close').onclick=function(){ if(opts.onClose) opts.onClose(); };
    Array.prototype.forEach.call(this.$('dash').children,function(d){ d.onclick=function(){ self.jump(+d.getAttribute('data-k')); }; });
    if(opts.quota) this.setQuota(opts.quota);
    this.warm(); ACTIVE.push(this);
  }
  Player.prototype.setQuota=function(q){ var e=this.$('q'); if(!e||!q||q.remaining==null) return; e.textContent=q.remaining+' left today'; e.className='wbq'+(q.remaining<=1?' low':''); };
  Player.prototype.warm=function(){ try{ if(!window.warmSpeak) return; var q=this.b.steps.map(function(s){ return s.say; }), i=0;
    (function nx(){ if(i>=q.length) return; window.warmSpeak(q[i++],'read').then(nx,nx); })(); (function nx2(){ if(i>=q.length) return; window.warmSpeak(q[i++],'read').then(nx2,nx2); })(); }catch(e){} };
  Player.prototype.dash=function(){ var k=this.k; Array.prototype.forEach.call(this.$('dash').children,function(d,i){ d.className=i<k?'done':(i===k?'cur':''); }); };
  Player.prototype.caption=function(text){ var words=String(text||'').split(/\s+/).filter(Boolean);
    this.$('cap').innerHTML=words.map(function(w){ return '<span class="w">'+esc(w)+'</span>'; }).join(' ');
    return Array.prototype.slice.call(this.$('cap').querySelectorAll('.w')); };
  Player.prototype.showUpTo=function(k,instant){ var b=this.b, self=this;
    if(b.layout!=='list'&&b.layout!=='chain') this.board.reveal('_center',instant);
    for(var i=0;i<=k&&i<b.steps.length;i++) b.steps[i].show.forEach(function(id){ self.board.reveal(id, instant||i<k); });
    this.board.highlight(k>=0&&b.steps[k]?b.steps[k].show:[]); };
  Player.prototype.go=function(k){
    var self=this, tok=++this.tok, st=this.b.steps[k]; this.clearTimers(); this.closeEnd();
    try{ if(window.stopSpeak) stopSpeak(); }catch(e){}
    if(!st){ this.finish(); return; }
    this.k=k; this.dash(); this.showUpTo(k,false);
    var spans=this.caption(st.say), text=st.say, rate=this.speed;
    var est=Math.max(1800, text.length*62)/rate;            // rough speaking time, used for the word highlight and as a safety net
    var total=spans.reduce(function(a,s){ return a+s.textContent.length+1; },0)||1, acc=0, t0=Date.now();
    var marks=spans.map(function(s){ acc+=s.textContent.length+1; return acc/total; });
    this.kTimer=setInterval(function(){ var f=(Date.now()-t0)/est; spans.forEach(function(s,i){ if(marks[i]-0.04<=f) s.classList.add('on'); }); },90);
    var eq=this.$('eq'); if(eq) eq.classList.toggle('on',!this.muted);
    var done=false; function fin(){ if(done||tok!==self.tok) return; done=true; self.clearTimers(); spans.forEach(function(s){ s.classList.add('on'); });
      if(!self.playing) return; self.gap=setTimeout(function(){ if(tok===self.tok&&self.playing) self.go(k+1); },550); }
    if(this.muted || typeof window.voiceSpeak!=='function'){ this.watch=setTimeout(fin, est+400); return; }
    var warm=false; try{ warm=!!(window._ttsHas&&window._ttsHas(text,'read')); }catch(e){}
    this.watch=setTimeout(fin, est+2600+(warm?0:15000));
    try{ window.voiceSpeak(text, fin, 'read', rate); }catch(e){ fin(); }
  };
  Player.prototype.clearTimers=function(){ ['kTimer','watch','gap'].forEach(function(n){ if(this[n]){ clearInterval(this[n]); clearTimeout(this[n]); this[n]=null; } },this); var eq=this.$('eq'); if(eq) eq.classList.remove('on'); };
  Player.prototype.play=function(){ if(!this.host.isConnected) return; this.playing=true; this.$('play').textContent='❚❚ Pause';
    var p=this.host.querySelector('.wbposter'); if(p) p.remove();
    try{ this._rate0=window.mbVoiceRateGet?mbVoiceRateGet():null; }catch(e){}
    this.go(this.k<0||this.k>=this.b.steps.length?0:this.k); };
  Player.prototype.pause=function(){ this.playing=false; this.tok++; this.clearTimers(); this.$('play').textContent='▶ Play'; try{ if(window.stopSpeak) stopSpeak(); }catch(e){} };
  Player.prototype.jump=function(k){ var was=this.playing; this.pause(); this.board.reset(); this.board.reveal('_title',true); this.k=k; this.showUpTo(k-1,true); this.k=k;
    if(was){ this.playing=true; this.$('play').textContent='❚❚ Pause'; this.go(k); } else { this.dash(); this.caption(this.b.steps[k].say).forEach(function(s){ s.classList.add('on'); }); this.showUpTo(k,false); } };
  Player.prototype.restart=function(){ this.closeEnd(); this.playing=true; this.jump(0); };
  Player.prototype.finish=function(){ var self=this; this.pause(); this.k=this.b.steps.length; this.dash();
    if(this.opts.onDone){ this.opts.onDone(); return; }          // preview: glide into the next scene instead of the end card
    try{ if(this._rate0!=null&&window.mbVoiceRate) mbVoiceRate(this._rate0); }catch(e){}
    var other=otherMode(this.b.mode), om=MODES[other], box=document.createElement('div'); box.className='wbend';
    box.innerHTML='<h3>✓ '+(this.b.mode==='layman'?'Now you get the picture!':'That\'s the picture.')+'</h3>'
      +'<button class="pri" data-a="again">↺ Watch again</button>'
      +(this.opts.onSwitchMode?'<button data-a="switch">'+om.icon+' Explain it the '+om.label+' way</button>':'')
      +'<button data-a="done">Done</button>';
    this.host.querySelector('.wbboard').appendChild(box); this.endBox=box;
    box.querySelector('[data-a=again]').onclick=function(){ self.restart(); };
    var sw=box.querySelector('[data-a=switch]'); if(sw) sw.onclick=function(){ self.opts.onSwitchMode(other); };
    box.querySelector('[data-a=done]').onclick=function(){ self.closeEnd(); if(self.opts.onClose) self.opts.onClose(); }; };
  Player.prototype.closeEnd=function(){ if(this.endBox){ try{ this.endBox.remove(); }catch(e){} this.endBox=null; } };
  Player.prototype.destroy=function(){ this.pause(); try{ if(this._rate0!=null&&window.mbVoiceRate) mbVoiceRate(this._rate0); }catch(e){} var i=ACTIVE.indexOf(this); if(i>=0) ACTIVE.splice(i,1); };
  Player.prototype.poster=function(label){ var self=this, p=document.createElement('div'); p.className='wbposter';
    p.innerHTML='<div class="pb">▶</div><span>'+esc(label||'Watch the explainer')+'</span>';
    p.onclick=function(){ try{ if(window.unlockAudio) unlockAudio(); }catch(e){} self.play(); };
    this.host.querySelector('.wbboard').appendChild(p); };

  /* ---------------- modal ---------------- */
  var MODAL=null;
  function closeModal(){ if(!MODAL) return; try{ MODAL.p.destroy(); }catch(e){} try{ MODAL.ov.remove(); }catch(e){} MODAL=null; try{ document.removeEventListener('keydown',onKey); }catch(e){} }
  function onKey(e){ if(e.key==='Escape') closeModal(); }
  function openModal(board, ctx){
    injectStyles(); closeModal(); stopAllInline();
    var ov=document.createElement('div'); ov.className='wbov'; ov.id='wbov';
    ov.innerHTML='<div class="wbpanel" role="dialog" aria-modal="true"></div>';
    ov.onclick=function(e){ if(e.target===ov) closeModal(); };
    document.body.appendChild(ov); document.addEventListener('keydown',onKey);
    var p=new Player(ov.firstChild, board, { quota:ctx&&ctx.quota, onClose:closeModal,
      onSwitchMode: ctx&&ctx.text ? function(m){ closeModal(); buildForModal(ctx.text, ctx.topicName, ctx.topicId, m); } : null });
    MODAL={ov:ov,p:p}; return p;
  }

  /* ---------------- topic preview: the scenes of a note, one whiteboard after another ---------------- */
  function log(ev){ try{ if(window.smartLog) window.smartLog(ev); }catch(e){} }
  function playPreview(scenes, topicId, topicName){
    injectStyles(); closeModal(); stopAllInline();
    scenes=(scenes||[]).filter(function(sc){ return sc&&sc.board&&sc.board.steps&&sc.board.steps.length; }); if(!scenes.length) return;
    var n=scenes.length, k=0, player=null, done=false, mode=scenes[0].board.mode;
    var ov=document.createElement('div'); ov.className='wbov'; ov.id='wbov';
    ov.innerHTML='<div class="wbpanel" role="dialog" aria-modal="true">'
      +'<div class="wbpvbar"><span class="wbpvt" data-r="t"></span><button class="wbbtn" data-r="prev" aria-label="Previous scene">‹</button><button class="wbbtn" data-r="next" aria-label="Next scene">›</button><button class="wbread" data-r="read">Start reading →</button></div>'
      +'<div data-r="host"></div></div>';
    document.body.appendChild(ov); document.addEventListener('keydown',onKey);
    var $=function(r){ return ov.querySelector('[data-r="'+r+'"]'); };
    function close(){ if(!done) log({t:'preview_skipped', topic_id:topicId, watched_scenes:k+1, of:n, at:'mid', mode:mode}); done=true; closeModal(); }
    function warmScene(j){ try{ var sc=scenes[j]; if(!sc||!window.warmSpeak||settings().boardMuted) return; sc.board.steps.slice(0,2).forEach(function(st){ window.warmSpeak(st.say,'read'); }); }catch(e){} }
    function load(j){
      k=j; if(player) player.destroy();
      $('t').textContent='🎬 Preview · '+(j+1)+' / '+n+(scenes[j].heading?' · '+scenes[j].heading:'');
      $('prev').disabled=j===0;
      player=new Player($('host'), scenes[j].board, { label:topicName||'Preview', onClose:close, onDone:function(){ if(k<n-1) load(k+1); else end(); } });
      if(MODAL) MODAL.p=player;
      log({t:'preview_scene', topic_id:topicId, i:j, mode:mode}); warmScene(j+1); player.play();
    }
    function end(){ done=true; log({t:'preview_completed', topic_id:topicId, watched_scenes:n, of:n, mode:mode});
      var box=document.createElement('div'); box.className='wbend';
      box.innerHTML='<h3>✓ You\'ve got the map.</h3><p style="margin:0;color:#6b6580;font-size:13px">Now read the note. It will all slot into place.</p><button class="pri" data-a="read">Start reading →</button><button data-a="again">↺ Watch the preview again</button>';
      ov.querySelector('.wbboard').appendChild(box);
      box.querySelector('[data-a=read]').onclick=function(){ closeModal(); };
      box.querySelector('[data-a=again]').onclick=function(){ done=false; load(0); }; }
    $('prev').onclick=function(){ if(k>0) load(k-1); };
    $('next').onclick=function(){ if(k<n-1) load(k+1); else { if(player) player.pause(); end(); } };
    $('read').onclick=close;
    ov.onclick=function(e){ if(e.target===ov) close(); };
    MODAL={ov:ov,p:null};
    log({t:'preview_started', topic_id:topicId, scenes:n, mode:mode});
    try{ if(window.unlockAudio) unlockAudio(); }catch(e){}
    load(0);
  }

  /* ---------------- server ---------------- */
  async function fetchBoard(text, subject, mode){
    var C=window.MEDBANK_CONFIG||{}; if(!C.IMPORT_API||!window.__mbSB) throw new Error('Visualize needs an internet connection.');
    var ses=await window.__mbSB.auth.getSession(); var token=ses.data.session&&ses.data.session.access_token; if(!token) throw new Error('Please sign in.');
    var url=C.IMPORT_API.replace(/\/$/,'')+'/board', lastErr=null;
    for(var attempt=0;attempt<3;attempt++){
      try{
        var r=await fetch(url,{method:'POST',headers:{'Content-Type':'application/json','Authorization':'Bearer '+token},body:JSON.stringify({text:text,subject:subject||'',mode:mode})});
        if(r.status===502||r.status===503||r.status===504){ lastErr=new Error('Waking the Visualize server…'); await sleep(1500*(attempt+1)); continue; }
        var j=await r.json().catch(function(){ return {}; });
        if(r.status===429){ var e=new Error(j.message||'Daily limit reached'); e.status=429; e.info=j; throw e; }
        if(!r.ok||!j.board) throw new Error((j&&(j.error||j.message))||'Could not build this explainer.');
        return j;
      }catch(e){ if(e.status===429) throw e; lastErr=e; if(attempt<2) await sleep(1200*(attempt+1)); }
    }
    throw lastErr||new Error('Could not reach Visualize — check your connection and try again.');
  }
  function limitHit(e){ var j=(e&&e.info)||{}, msg=j.message||(e&&e.message)||"You've used all of today's explainers. They reset tomorrow.";
    if(!j.premium && window.MB_PAYWALL) MB_PAYWALL.nudge("You're out of explainers today", msg, "Upgrade", window.MB_CHECKOUT?function(){ MB_CHECKOUT.open({tier:'premium'}); }:null);
    else toast(msg); }
  function warmFirst(board){ try{ if(!window.warmSpeak||settings().boardMuted) return Promise.resolve(); var t=board.steps[0]&&board.steps[0].say; return t?Promise.race([window.warmSpeak(t,'read'),sleep(12000)]):Promise.resolve(); }catch(e){ return Promise.resolve(); } }

  /* ---------------- mode picker ---------------- */
  function optHtml(m,last){ var M=MODES[m]; return '<button class="wbopt'+(m===last?' last':'')+'" data-m="'+m+'"><span class="ic">'+M.icon+'</span><div><b>'+M.label+'</b><span>'+M.blurb+'</span></div>'+(m===last?'<span class="tag">last used</span>':'')+'</button>'; }
  function pickMode(){
    injectStyles(); var last=settings().boardLastMode||'';
    return new Promise(function(resolve){
      var sh=document.createElement('div'); sh.className='wbsheet';
      sh.innerHTML='<div class="in"><h3>How should we explain it?</h3><p>Pick a style. Your explainer is built in that style.</p>'+optHtml('standard',last)+optHtml('layman',last)+'<button class="wbcancel">Cancel</button></div>';
      function done(m){ try{ sh.remove(); }catch(e){} if(m){ settings().boardLastMode=m; save(); } resolve(m||null); }
      sh.onclick=function(e){ if(e.target===sh) done(null); };
      sh.querySelector('.wbcancel').onclick=function(){ done(null); };
      Array.prototype.forEach.call(sh.querySelectorAll('.wbopt'),function(b){ b.onclick=function(){ try{ if(window.unlockAudio) unlockAudio(); }catch(e){} done(b.getAttribute('data-m')); }; });
      document.body.appendChild(sh);
    });
  }
  function pickModeInline(host){
    var last=settings().boardLastMode||'';
    return new Promise(function(resolve){
      host.innerHTML='<div class="wbpick"><div class="hd">How should we explain it?</div><div class="row">'+optHtml('standard',last)+optHtml('layman',last)+'</div></div>';
      Array.prototype.forEach.call(host.querySelectorAll('.wbopt'),function(b){ b.onclick=function(e){ e.stopPropagation(); var m=b.getAttribute('data-m'); settings().boardLastMode=m; save(); resolve(m); }; });
    });
  }

  /* ---------------- floating "building…" pill (note path is non-blocking) ---------------- */
  function pill(state,msg,onTap){ var f=document.getElementById('wbFloat'); if(f) f.remove(); if(!state) return;
    f=document.createElement('div'); f.id='wbFloat'; f.className='wbfloat '+state;
    f.innerHTML=state==='gen'?'<span class="wbspin" style="border-color:#5b4a8a;border-top-color:#fff"></span><span>'+esc(msg)+'</span>':'<span>'+esc(msg)+'</span>';
    if(onTap) f.onclick=onTap; document.body.appendChild(f);
    if(state==='err') setTimeout(function(){ if(f.parentNode) f.remove(); },3800); }

  async function buildForModal(text, topicName, topicId, mode){
    injectStyles();
    pill('gen', mode==='layman'?'Auntie is drawing it up… keep reading':'Building your whiteboard… keep reading');
    try{
      var j=await fetchBoard(text, topicName, mode);
      try{ if(window._mbRecordViz) window._mbRecordViz(topicId, text); }catch(e){}
      await warmFirst(j.board);
      pill('ready','🎬 Explainer ready — tap to watch',function(){ pill(null); try{ if(window.unlockAudio) unlockAudio(); }catch(e){}
        var p=openModal(j.board,{text:text,topicName:topicName,topicId:topicId,quota:j.viz_quota}); p.play(); });
    }catch(e){ pill(null); if(e&&e.status===429){ limitHit(e); return; } pill('err','⚠️ '+((e&&e.message)||'Something went wrong')); }
  }

  /* ---------------- inline (under a question card) ---------------- */
  function stopAllInline(){ ACTIVE.slice().forEach(function(p){ if(p.opts.inline) p.pause(); }); }
  function mountInline(hostId, board, opts){
    injectStyles(); var host=document.getElementById(hostId); if(!host) return null;
    ACTIVE.slice().forEach(function(p){ if(p.opts.inline) p.destroy(); });
    host.innerHTML='<div class="wbinline"></div>';
    var p=new Player(host.firstChild, board, { inline:true, quota:opts&&opts.quota, onSwitchMode:opts&&opts.onSwitchMode, onClose:function(){ p.pause(); } });
    return p;
  }
  function saveToCard(cardId, board, text){ if(!cardId) return; try{ window.DATA=window.DATA||{}; DATA.cardViz=DATA.cardViz||{}; DATA.cardViz[cardId]={board:board,mode:board.mode,text:text,ts:Date.now()};
    var ids=Object.keys(DATA.cardViz); if(ids.length>60){ ids.sort(function(a,b){ return ((DATA.cardViz[b]||{}).ts||0)-((DATA.cardViz[a]||{}).ts||0); }); ids.slice(60).forEach(function(id){ delete DATA.cardViz[id]; }); }
    save(); }catch(e){} }
  async function buildInline(text, topicName, topicId, hostId, cardId, mode){
    var host=document.getElementById(hostId); if(!host) return;
    host.innerHTML='<div class="wbgen"><span class="wbspin"></span><div><b>'+(mode==='layman'?'Auntie is drawing it up…':'Building your whiteboard…')+'</b><br><span>Keep reading. It appears here when it\'s ready.</span></div></div>';
    try{
      var j=await fetchBoard(text, topicName, mode);
      if(!document.getElementById(hostId)) return;
      try{ if(window._mbRecordViz) window._mbRecordViz(topicId||'', text); }catch(e){}
      saveToCard(cardId, j.board, text);
      var p=mountInline(hostId, j.board, { quota:j.viz_quota, onSwitchMode:function(m){ buildInline(text, topicName, topicId, hostId, cardId, m); } });
      if(p) p.poster('Watch how to reach the answer');
    }catch(e){ var h=document.getElementById(hostId); if(h) h.innerHTML='<div class="wbgen err">'+esc((e&&e.message)||'Something went wrong')+'</div>'; if(e&&e.status===429) limitHit(e); }
  }

  /* ---------------- take over the app's Visualize entry points ---------------- */
  var old={ viz:window.aiVisualize, inline:window.aiVisualizeInline, saved:window.aiVisualizeInlineSaved, stop:window.vizInlineStop };
  window.aiVisualize=function(text, topicName, topicId){
    var words=(text||'').trim().split(/\s+/).filter(Boolean).length;
    if(!words) return;
    if(words>110){ toast('That\'s a lot of text — highlight one idea at a time for the sharpest explainer.'); return; }
    var tid=topicId||(window.currentTopicId?currentTopicId():'');
    pickMode().then(function(mode){ if(mode) buildForModal(text, topicName, tid, mode); });
  };
  window.aiVisualizeInline=function(text, topicName, topicId, hostId, cardId){
    var host=document.getElementById(hostId); if(!host) return;
    pickModeInline(host).then(function(mode){ buildInline(text, topicName, topicId, hostId, cardId, mode); });
  };
  window.aiVisualizeInlineSaved=function(cardId, topicId, hostId){
    var rec=(window.DATA&&DATA.cardViz)?DATA.cardViz[cardId]:null;
    if(rec && rec.board){
      try{ if(window.unlockAudio) unlockAudio(); }catch(e){}
      var p=mountInline(hostId, rec.board, { onSwitchMode:function(m){ buildInline(rec.text||'', '', topicId, hostId, cardId, m); } });
      if(p) setTimeout(function(){ p.play(); },250); return;
    }
    if(old.saved) return old.saved(cardId, topicId, hostId);   // an explainer saved before the whiteboard: old player
  };
  window.vizInlineStop=function(){ stopAllInline(); if(old.stop) try{ old.stop(); }catch(e){} };

  window.MBBoard={ playPreview:playPreview, open:openModal, close:closeModal, mount:mountInline, pickMode:pickMode, fetch:fetchBoard, Player:Player, Board:Board, DOODLES:Object.keys(D), _injectStyles:injectStyles };
})();
