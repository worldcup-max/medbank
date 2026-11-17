/* =====================================================================
 * MedBank Clinical Simulation: ⚔️ Head-to-head duel (route #/clinsim/duel)
 *
 * Two students, two phones, side by side. Same quick case, same clock, highest score wins.
 * Built on how the best live games do it:
 *   - join by PIN, link or QR code, then a "2-step join" pattern copied off the host's screen
 *     (Kahoot): you can only copy it if you can see the other phone, so you are together;
 *   - focus lock (Forest's Plant Together): leaving the app ends the duel, and the other player
 *     wins. One 5-second slip is forgiven per duel (a notification), like Forest's short pause;
 *   - disconnects (chess.com): an opponent silent for 30 seconds has abandoned; if both drop, no result;
 *   - a face check at the end: each phone shows a code only the other player can read. A duel
 *     whose codes don't match still shows a winner but is marked unverified (it won't count on a
 *     verified class board).
 * Same score as the rest of Clinical Simulation; a tie goes to fewer dangerous decisions, then speed.
 *
 * Transport: Supabase Realtime broadcast + presence on channel "mbduel-<code>" (no tables). With no
 * Supabase client (no account / local file), a BroadcastChannel between tabs of one browser stands in,
 * which is how it is tested.
 * ===================================================================== */
(function(root){
'use strict';
if(typeof document==='undefined') return;

var CS=function(){ return root.MB_CLINSIM && root.MB_CLINSIM._duel; };
function e(s){ return String(s==null?'':s).replace(/[&<>"']/g,function(ch){ return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[ch]; }); }
var DUEL_MIN=6, GRACE_MS=5000, ABANDON_MS=30000, BEAT_MS=3000;
var EMO=['🫀','🫁','🧠','🦴','🩸','💊','🩺','🦠','🧬'];

/* ---------- small pure helpers (tested) */
function rnd(n){ return Math.floor(Math.random()*n); }
function newCode(){ return String(1000+rnd(9000)); }
function newPattern(){ var a=EMO.map(function(_,i){ return i; }); for(var i=a.length-1;i>0;i--){ var j=rnd(i+1), t=a[i]; a[i]=a[j]; a[j]=t; } return a.slice(0,4); }
function samePattern(a, b){ return a.length===b.length && a.every(function(x,i){ return x===b[i]; }); }
// who won: higher score, then fewer dangerous decisions, then faster; null result = draw
function winner(a, b){
  if(a.forfeit&&b.forfeit) return null; if(a.forfeit) return 'b'; if(b.forfeit) return 'a';
  if(a.pct!==b.pct) return a.pct>b.pct?'a':'b';
  if(a.danger!==b.danger) return a.danger<b.danger?'a':'b';
  if(a.ms!==b.ms) return a.ms<b.ms?'a':'b';
  return null;
}

/* ---------- transport */
function transport(code, me, onMsg, onPresence){
  var sb=root.__mbSB, closed=false;
  if(sb && sb.channel){
    var ch=sb.channel('mbduel-'+code, { config:{ broadcast:{ self:false }, presence:{ key:me.id } } });
    ch.on('broadcast', { event:'m' }, function(p){ if(!closed) onMsg(p.payload); });
    ch.on('presence', { event:'sync' }, function(){ if(!closed) onPresence(Object.keys(ch.presenceState()).length); });
    ch.subscribe(function(st){ if(st==='SUBSCRIBED') ch.track({ name:me.name, at:Date.now() }); });
    return { kind:'live', send:function(m){ if(!closed) ch.send({ type:'broadcast', event:'m', payload:m }); }, close:function(){ closed=true; try{ sb.removeChannel(ch); }catch(_){} } };
  }
  if(typeof BroadcastChannel!=='undefined'){
    var bc=new BroadcastChannel('mbduel-'+code);
    bc.onmessage=function(ev){ if(!closed) onMsg(ev.data); };
    return { kind:'local', send:function(m){ if(!closed) bc.postMessage(m); }, close:function(){ closed=true; try{ bc.close(); }catch(_){} } };
  }
  return null;
}

/* ---------- state */
var D=null;   // the duel in progress
function myName(){ try{ return localStorage.getItem('mbduelname')||''; }catch(_){ return ''; } }
function setName(n){ try{ localStorage.setItem('mbduelname', n); }catch(_){} }
function draw(){ var c=CS(); if(c) c.draw(); }
function send(type, data){ if(D&&D.t) D.t.send(Object.assign({ type:type, from:D.me.id, name:D.me.name }, data||{})); }
function reset(){ stopTimers(); unlock(); if(D&&D.t) D.t.close(); D=null; }

function open(role, code){
  reset();
  var me={ id:Math.random().toString(36).slice(2,10), name:myName()||'Doctor' };
  D={ role:role, code:code, me:me, opp:null, phase:'lobby', pattern:role==='host'?newPattern():null, tap:[], checked:role==='host',
      ready:{}, q:null, step:0, picks:[], m:0, mcq:[], startAt:0, endsAt:0, mine:null, theirs:null, slips:0, hiddenAt:0,
      lastSeen:Date.now(), oppProg:0, face:{ mine:String(100+rnd(900)), typed:'', theirs:null, ok:null }, log:[] };
  D.t=transport(code, me, onMsg, function(n){ if(D) D.peers=n; });
  if(!D.t){ D.phase='error'; return; }
  send('hello', {});
  startBeat();
}

/* ---------- messages */
function onMsg(m){
  if(!D || !m || m.from===D.me.id) return;
  D.lastSeen=Date.now();
  if(!D.opp && (m.type==='hello' || m.type==='here' || m.type==='beat')){   // the first message from a peer introduces them
    D.opp={ id:m.from, name:m.name }; if(m.type!=='here') send('here', {}); draw(); return;
  }
  if(m.type==='hello' || m.type==='here') return;
  if(D.opp && m.from!==D.opp.id) return;   // a third phone in the room is ignored
  switch(m.type){
    case 'check':   // guest sends the pattern they tapped; host says yes or no
      if(D.role==='host'){ var ok=samePattern(m.tap||[], D.pattern); send('checked', { ok:ok }); if(ok){ D.checked=true; } else { D.pattern=newPattern(); } draw(); }
      break;
    case 'checked': D.checked=!!m.ok; if(!m.ok){ D.tap=[]; D.err='That pattern did not match. Look at the other phone and try again.'; } draw(); break;
    case 'ready': D.ready.opp=true; if(D.role==='host') maybeStart(); draw(); break;
    case 'start': begin(m.q, m.startAt, m.nonce); break;
    case 'prog': D.oppProg=m.n||0; draw(); break;
    case 'slip': D.log.push((D.opp.name||'Your opponent')+' left the app for a moment.'); draw(); break;
    case 'forfeit': D.theirs={ pct:0, danger:0, ms:Infinity, forfeit:true, why:m.why }; if(D.phase==='play'||D.phase==='wait'||D.phase==='face'){ finishOpp(); } break;
    case 'done': D.theirs={ pct:m.pct, danger:m.danger, ms:m.ms, forfeit:false }; D.face.theirs=m.code; maybeFace(); draw(); break;
    case 'face': D.face.oppOk=!!m.ok; maybeResult(); break;
    case 'beat': break;
    case 'bye': if(D.phase==='lobby'){ D.opp=null; D.checked=D.role==='host'; D.ready={}; draw(); } else if(D.phase==='play'||D.phase==='wait'){ D.theirs={ pct:0, danger:0, ms:Infinity, forfeit:true, why:'left the duel' }; finishOpp(); } break;
  }
}

/* ---------- lobby */
function maybeStart(){
  if(D.role!=='host' || !D.ready.me || !D.ready.opp || !D.checked) return;
  var c=CS(), list=c.quickCases('all').filter(function(q){ return c.inCourse(q, c.curCourse()); });
  if(!list.length) list=c.quickCases('builtin');
  var q=list[rnd(list.length)], startAt=Date.now()+3500, nonce=Math.random().toString(36).slice(2,8);
  send('start', { q:q, startAt:startAt, nonce:nonce }); begin(q, startAt, nonce);
}
function begin(q, startAt, nonce){
  D.q=q; D.nonce=nonce||''; D.phase='count'; D.startAt=startAt; D.endsAt=startAt+DUEL_MIN*60e3; D.step=0; D.picks=[]; D.m=0; D.mcq=[]; D.mine=null; D.theirs=null;
  lock(); draw();
  setTimeout(function(){ if(D && D.phase==='count'){ D.phase='play'; draw(); } }, Math.max(0, startAt-Date.now()));
}

/* ---------- focus lock */
function onHide(){
  if(!D || (D.phase!=='play' && D.phase!=='count')) return;
  if(document.visibilityState==='hidden'){
    D.hiddenAt=Date.now(); send('slip', {});
    // phones often freeze timers in the background, so the return below also checks; if this phone never
    // comes back, its heartbeat stops and the other phone calls it abandoned after 30 seconds
    D.slipTimer=setTimeout(function(){ if(D && document.visibilityState==='hidden') forfeit('left the app'); }, D.slips?0:GRACE_MS);
    return;
  }
  if(!D.hiddenAt) return;
  clearTimeout(D.slipTimer); var away=Date.now()-D.hiddenAt; D.hiddenAt=0;
  if(away>=GRACE_MS || D.slips){ forfeit('left the app'); return; }
  D.slips++; D.log.push('You left the app for '+Math.max(1, Math.round(away/1000))+' s. That was your one free slip: next time the duel ends.'); draw();
}
function onLeave(){ if(D && (D.phase==='play'||D.phase==='count')) { try{ send('forfeit', { why:'closed the app' }); }catch(_){} } else if(D) { try{ send('bye', {}); }catch(_){} } }
function lock(){
  document.addEventListener('visibilitychange', onHide); root.addEventListener('pagehide', onLeave);
  try{ var el=document.documentElement; if(el.requestFullscreen && !document.fullscreenElement) el.requestFullscreen().catch(function(){}); }catch(_){}
}
function unlock(){
  document.removeEventListener('visibilitychange', onHide); root.removeEventListener('pagehide', onLeave);
  try{ if(document.fullscreenElement && document.exitFullscreen) document.exitFullscreen().catch(function(){}); }catch(_){}
}
function forfeit(why){
  if(!D) return; send('forfeit', { why:why });
  D.mine={ pct:0, danger:0, ms:Infinity, forfeit:true, why:why }; D.phase='result'; D.res=resultOf(); saveResult(); stopTimers(); unlock(); draw();
}
function finishOpp(){
  if(!D.mine){ D.mine=scoreMine(); }
  D.phase='result'; D.res=resultOf(); saveResult(); stopTimers(); unlock(); draw();
}

/* ---------- heartbeat + clock */
function startBeat(){
  stopTimers();
  D.beat=setInterval(function(){
    if(!D) return; send('beat', {});
    if(D.opp && (D.phase==='play'||D.phase==='wait') && Date.now()-D.lastSeen>ABANDON_MS){ D.theirs={ pct:0, danger:0, ms:Infinity, forfeit:true, why:'lost connection for 30 seconds' }; finishOpp(); return; }
    if(D.phase==='play' && Date.now()>=D.endsAt) finishMine();
    var c=document.getElementById('duelClock'); if(c) c.textContent=clock();
  }, 1000);
}
function stopTimers(){ if(D){ clearInterval(D.beat); clearTimeout(D.slipTimer); } }
function clock(){ var ms=Math.max(0, (D.endsAt||0)-Date.now()), m=Math.floor(ms/60e3), s=Math.floor(ms%60e3/1e3); return m+':'+(s<10?'0':'')+s; }

/* ---------- playing */
function progress(){ return D.picks.filter(function(x){ return x!==undefined; }).length + D.mcq.filter(function(x){ return x!==undefined; }).length; }
function total(){ return D.q.steps.length + (D.q.mcqs||[]).length; }
function scoreMine(){
  var sc=CS().quickScore(D.q, D.picks), mq=D.q.mcqs||[], ok=mq.filter(function(m,i){ return D.mcq[i]===m.ans; }).length;
  // the duel score: decisions 80%, exam questions 20%, so a tie on decisions is broken by knowledge
  var pct=mq.length ? Math.round(0.8*sc.pct + 20*ok/mq.length) : sc.pct;
  return { pct:pct, danger:sc.danger.length, ms:Date.now()-D.startAt, forfeit:false, grade:sc.grade, mcq:ok };
}
function finishMine(){
  if(!D || D.mine) return;
  D.mine=scoreMine(); D.phase='wait';
  send('done', { pct:D.mine.pct, danger:D.mine.danger, ms:D.mine.ms, code:D.face.mine });
  maybeFace(); draw();
}
function maybeFace(){ if(D.mine && D.theirs && !D.theirs.forfeit && D.phase==='wait'){ D.phase='face'; draw(); } }
function maybeResult(){ if(D.face.ok!==null && D.face.oppOk!==undefined){ D.phase='result'; D.res=resultOf(); saveResult(); stopTimers(); unlock(); } draw(); }
function resultOf(){ var w=winner(D.mine, D.theirs||{ pct:0, danger:0, ms:Infinity, forfeit:true }); return { win:w==='a', draw:w===null, verified:!!(D.face.ok && D.face.oppOk) }; }
function saveResult(){
  if(D.saved) return; D.saved=true;
  var c=CS(), r=D.res;
  c.recordDuel({ code:D.code, opp:(D.opp&&D.opp.name)||'', caseId:D.q&&D.q.id, mine:D.mine.pct, theirs:D.theirs?D.theirs.pct:0, win:r.win, draw:r.draw, verified:r.verified,
    forfeit:D.mine.forfeit?'me':(D.theirs&&D.theirs.forfeit?'them':''), at:new Date().toISOString() });
  if(!D.mine.forfeit && D.q) c.recordRun('quick', D.q.id, D.mine.pct, { ctx:r.verified?'duel':'open', unsafe:D.mine.danger>0, duel:true });
}

/* ---------- views */
function head(){ return '<a href="#/clinsim" class="cs-back" onclick="MB_CLINDUEL.quit()">← Clinical Simulation</a><h1>⚔️ Duel</h1>'; }
function lobbyHome(){
  return head()+'<p class="cs-sub">Two of you, side by side, same patient, same clock. Leave the app and you lose. Highest score wins.</p>'+
    '<div class="cs-panel"><h4>Your name</h4><div class="cs-ask"><input id="duelName" maxlength="20" autocomplete="off" placeholder="What your opponent sees" value="'+e(myName())+'" aria-label="Your name" onchange="MB_CLINDUEL.name(this.value)"></div>'+
    '<div class="btnrow" style="margin-top:14px"><button class="btn primary" onclick="MB_CLINDUEL.host()">Start a duel</button></div>'+
    '<h4 style="margin-top:18px">Or join one</h4><form class="cs-ask" onsubmit="MB_CLINDUEL.join(document.getElementById(\'duelCode\').value);return false"><input id="duelCode" inputmode="numeric" maxlength="4" autocomplete="off" placeholder="4-digit code" aria-label="Duel code"><button class="btn">Join</button></form></div>'+
    '<div class="cs-panel"><h4>Rules</h4><ul class="cs-teach"><li>Sit together. You will copy a pattern off each other\'s screen to start, and read each other\'s code at the end.</li>'+
    '<li>Once it starts, stay in MedBank. You get one slip of under 5 seconds. After that, leaving the app ends the duel and your opponent wins.</li>'+
    '<li>If a phone goes silent for 30 seconds, its player has abandoned.</li><li>A dangerous decision costs you more than a slow answer. A tie goes to fewer dangerous decisions, then to the faster player.</li></ul></div>'+history();
}
function history(){
  var h=CS().duels().slice(-5).reverse(); if(!h.length) return '';
  return '<div class="cs-panel"><h4>Your last duels</h4><ul class="cs-list">'+h.map(function(d){ return '<li><span aria-hidden="true">'+(d.draw?'🤝':d.win?'🏆':'—')+'</span><span>'+(d.draw?'Draw':d.win?'Won':'Lost')+' against '+e(d.opp||'a friend')+' · '+d.mine+'% vs '+d.theirs+'%'+(d.verified?' · ✔ verified':' · not verified')+(d.forfeit==='them'?' · they left':d.forfeit==='me'?' · you left':'')+'</span></li>'; }).join('')+'</ul></div>';
}
function joinUrl(){ return location.href.split('#')[0]+'#/clinsim/duel/join/'+D.code; }
function lobbyRoom(){
  var h=head();
  if(D.phase==='error') return h+'<div class="cs-panel">Duels need a connection. Sign in and check your internet, then try again.</div>';
  var test=D.t.kind==='local'?'<div class="cs-meta">Test mode: no account, so this only links tabs in this browser.</div>':'';
  if(D.role==='host'){
    h+='<div class="cs-panel"><div class="cs-top"><b>Duel code</b><span class="cs-meta">'+(D.opp?'Opponent here':'Waiting for your opponent…')+'</span></div><div style="font-size:44px;font-weight:800;letter-spacing:8px;margin:6px 0">'+e(D.code)+'</div>'+
      '<div id="duelQr" style="width:180px;height:180px;margin:8px 0" aria-label="QR code to join">'+qrHtml()+'</div><div class="cs-meta">Your opponent scans this, or opens Duel and types the code.</div>'+test+'</div>';
    if(D.opp){
      h+=D.checked ? '<div class="cs-panel">✔ '+e(D.opp.name)+' is next to you.</div>'
        : '<div class="cs-panel"><h4>Show this to '+e(D.opp.name)+'</h4><div style="font-size:40px;letter-spacing:10px">'+D.pattern.map(function(i){ return EMO[i]; }).join('')+'</div><div class="cs-meta">They tap the same four, in this order, on their phone.</div></div>';
    }
  } else {
    h+='<div class="cs-panel"><b>Duel '+e(D.code)+'</b><div class="cs-meta">'+(D.opp?'Connected to '+e(D.opp.name):'Connecting…')+'</div>'+test+'</div>';
    if(D.opp && !D.checked){
      h+='<div class="cs-panel"><h4>Copy the pattern on '+e(D.opp.name)+'\'s screen</h4><div style="font-size:30px;min-height:40px;letter-spacing:8px">'+D.tap.map(function(i){ return EMO[i]; }).join('')+'</div>'+
        (D.err?'<div class="cs-danger">'+e(D.err)+'</div>':'')+
        '<div style="display:grid;grid-template-columns:repeat(3,64px);gap:8px;margin-top:8px">'+EMO.map(function(x,i){ return '<button class="cs-opt" style="font-size:28px;text-align:center" onclick="MB_CLINDUEL.tap('+i+')" aria-label="Tile '+(i+1)+'">'+x+'</button>'; }).join('')+'</div>'+
        '<div class="btnrow" style="margin-top:10px"><button class="btn" onclick="MB_CLINDUEL.untap()">Clear</button></div></div>';
    } else if(D.checked) h+='<div class="cs-panel">✔ You are next to '+e(D.opp.name)+'.</div>';
  }
  if(D.opp && D.checked) h+='<div class="btnrow" style="margin-top:12px"><button class="btn primary" onclick="MB_CLINDUEL.ready()"'+(D.ready.me?' disabled':'')+'>'+(D.ready.me?(D.ready.opp||D.role==='guest'?'Starting…':'Waiting for '+e(D.opp.name)+'…'):'I\'m ready')+'</button></div>';
  return h;
}
function playView(){
  var q=D.q, n=progress(), tot=total();
  var h='<div class="cs-top"><h1 style="margin:6px 0">⚔️ '+e(q.title)+'</h1><span class="cs-clock" id="duelClock">'+clock()+'</span></div>'+
    '<div class="cs-meta">You '+n+' of '+tot+' · '+e(D.opp.name)+' '+D.oppProg+' of '+tot+'</div>'+
    '<div class="cs-bar" style="margin:6px 0"><i style="width:'+Math.round(100*n/tot)+'%"></i></div>'+
    '<div class="cs-bar" style="margin:0 0 10px;opacity:.5"><i style="width:'+Math.round(100*D.oppProg/tot)+'%"></i></div>'+
    D.log.slice(-1).map(function(l){ return '<div class="cs-danger">'+e(l)+'</div>'; }).join('')+
    '<div class="cs-panel"><p style="margin:0;line-height:1.55">'+e(q.stem)+'</p></div>';
  if(D.step<q.steps.length){
    var st=q.steps[D.step];
    h+='<div class="cs-panel"><h4>Decision '+(D.step+1)+' of '+q.steps.length+'</h4><div style="font-weight:700;margin-bottom:8px">'+e(st.prompt)+'</div><div class="cs-opts">'+
      CS().order(st.options.length, q.id+'|s'+D.step+'|'+D.nonce).map(function(k){ return '<button class="cs-opt" onclick="MB_CLINDUEL.choose('+k+')">'+e(st.options[k].t)+'</button>'; }).join('')+'</div>'+
      (D.step>0 && q.steps[D.step-1].reveal ? '<div class="cs-reveal">'+e(q.steps[D.step-1].reveal)+'</div>' : '')+'</div>';
  } else {
    var mq=q.mcqs[D.m];
    h+='<div class="cs-panel"><h4>Exam question '+(D.m+1)+' of '+q.mcqs.length+'</h4><div style="font-weight:700;margin-bottom:8px">'+e(mq.stem)+'</div><div class="cs-opts">'+
      CS().order(mq.options.length, q.id+'|m'+D.m+'|'+D.nonce).map(function(k){ return '<button class="cs-opt" onclick="MB_CLINDUEL.answer('+k+')">'+e(mq.options[k])+'</button>'; }).join('')+'</div></div>';
  }
  return h;   // no feedback until the end: the duel is a test, the debrief is after
}
function faceView(){
  return '<h1>⚔️ Face check</h1><p class="cs-sub">Show each other your screens. Type the code on '+e(D.opp.name)+'\'s phone to see who won.</p>'+
    '<div class="cs-panel"><h4>Your code (show it)</h4><div style="font-size:48px;font-weight:800;letter-spacing:10px">'+e(D.face.mine)+'</div></div>'+
    (D.face.ok===null?'<div class="cs-panel"><h4>'+e(D.opp.name)+'\'s code</h4><form class="cs-ask" onsubmit="MB_CLINDUEL.face(document.getElementById(\'duelFace\').value);return false"><input id="duelFace" inputmode="numeric" maxlength="3" autocomplete="off" aria-label="Opponent code"><button class="btn primary">Check</button></form><div class="btnrow" style="margin-top:8px"><button class="btn" onclick="MB_CLINDUEL.face(\'\')">We\'re not together</button></div></div>'
      :'<div class="cs-panel">Waiting for '+e(D.opp.name)+' to type your code…</div>');
}
function resultView(){
  var r=D.res, me=D.mine, th=D.theirs||{ pct:0 }, col=r.draw?'var(--warntx)':r.win?'var(--recall-tx)':'var(--badtx)';
  var tie=!me.forfeit&&!th.forfeit&&me.pct===th.pct&&!r.draw ? (me.danger!==th.danger?'Same score: the win goes to fewer dangerous decisions.':'Same score: the win goes to whoever finished faster.') : '';
  var why=me.forfeit?'You '+e(me.why||'left')+', so the duel ended.':(th.forfeit?e(D.opp?D.opp.name:'Your opponent')+' '+e(th.why||'left')+'. You win.':'');
  var h='<h1>⚔️ '+(r.draw?'Draw':r.win?'You won':'You lost')+'</h1>'+(why||tie?'<p class="cs-sub">'+(why||tie)+'</p>':'')+
    '<div class="cs-panel"><div class="cs-score"><div class="cs-ring" style="border:8px solid '+col+';color:'+col+'">'+(me.forfeit?'—':me.pct+'%')+'</div><div>'+
    '<div class="cs-meta">You: '+(me.forfeit?'left':me.pct+'%'+(me.danger?' · '+me.danger+' dangerous':''))+'</div>'+
    '<div class="cs-meta">'+e(D.opp?D.opp.name:'Opponent')+': '+(th.forfeit?'left':th.pct+'%'+(th.danger?' · '+th.danger+' dangerous':''))+'</div>'+
    '<div class="cs-meta">'+(r.verified?'✔ Verified: you read each other\'s codes':'Not verified: the face check did not match, so this duel won\'t count on a verified board')+'</div></div></div></div>';
  if(D.q && !me.forfeit){
    h+='<div class="cs-panel"><h4>The case, with answers</h4>'+D.q.steps.map(function(st,i){ var p=st.options[D.picks[i]], b=st.options.filter(function(o){ return o.pts===10; })[0];
      return '<div style="margin:8px 0"><b>'+e(st.prompt)+'</b><div class="cs-meta">'+(p?(p.pts===10?'✅ ':p.pts<=-10?'⚠️ ':'❌ ')+'You: '+e(p.t):'No answer')+(p&&p.pts!==10?' · Best: '+e(b.t):'')+'</div><div class="cs-meta">'+e((p&&p.pts!==10?p:b).why||'')+'</div></div>'; }).join('')+'</div>';
  }
  if(D.q && !me.forfeit) h+=CS().revise(D.q, me.danger>0 || me.pct<60);
  return h+'<div class="btnrow" style="margin-top:14px"><button class="btn primary" onclick="MB_CLINDUEL.again()">New duel</button><a class="btn" href="#/clinsim" onclick="MB_CLINDUEL.quit()">Done</a></div>';
}
function page(sub, id){
  if(sub==='join' && id && (!D || D.code!==id)) open('guest', id);
  if(!D) return lobbyHome();
  if(D.phase==='lobby' || D.phase==='error') return lobbyRoom();
  if(D.phase==='count') return '<h1>⚔️ Get ready</h1><div class="cs-panel" style="font-size:22px">Same patient, same clock. Stay in MedBank until the end.</div>';
  if(D.phase==='play') return playView();
  if(D.phase==='wait') return '<h1>⚔️ Done</h1><div class="cs-panel">Waiting for '+e(D.opp.name)+' to finish… (<span id="duelClock">'+clock()+'</span> left)</div>';
  if(D.phase==='face') return faceView();
  return resultView();
}

/* ---------- QR code (qrcode-generator 1.4.4, MIT, from jsDelivr with Subresource Integrity like supabase-js;
 * loaded on first use, and the code and link work without it) */
var QR_SRC='https://cdn.jsdelivr.net/npm/qrcode-generator@1.4.4/qrcode.js', QR_SRI='sha384-8FWZA6BGMXhsfO+BLtrJK0We6gg5o1JyO8xQm6peWDEUs17ACA5ziE/NIAkl9z2k', qrLoading=false;
function qrHtml(){
  if(root.qrcode){ try{ var q=root.qrcode(0,'M'); q.addData(joinUrl()); q.make(); return q.createSvgTag({ cellSize:4, margin:2, scalable:true }); }catch(_){ return ''; } }
  if(!qrLoading){ qrLoading=true; var s=document.createElement('script'); s.src=QR_SRC; s.integrity=QR_SRI; s.crossOrigin='anonymous'; s.onload=draw; s.onerror=function(){}; document.head.appendChild(s); }
  return '<div class="cs-meta">Loading QR…</div>';
}

root.MB_CLINDUEL={
  page:page, live:function(){ return !!(D && (D.phase==='play'||D.phase==='count')); },
  leaving:function(){ if(D && (D.phase==='play'||D.phase==='count')) forfeit('left the duel screen'); },
  name:function(n){ setName(String(n||'').trim().slice(0,20)); },
  host:function(){ var n=document.getElementById('duelName'); if(n) setName(n.value.trim().slice(0,20)); open('host', newCode()); location.hash='#/clinsim/duel/host/'+D.code; draw(); },
  join:function(code){ code=String(code||'').replace(/\D/g,''); if(code.length!==4) return; var n=document.getElementById('duelName'); if(n) setName(n.value.trim().slice(0,20)); open('guest', code); location.hash='#/clinsim/duel/join/'+code; draw(); },
  tap:function(i){ if(!D||D.checked) return; D.err=''; if(D.tap.length<4) D.tap.push(i); if(D.tap.length===4) send('check', { tap:D.tap.slice() }); draw(); },
  untap:function(){ if(D){ D.tap=[]; D.err=''; draw(); } },
  ready:function(){ if(!D) return; D.ready.me=true; send('ready', {}); if(D.role==='host') maybeStart(); draw(); },
  choose:function(k){ if(!D||D.phase!=='play') return; D.picks[D.step]=k; D.step++; send('prog', { n:progress() }); if(D.step>=D.q.steps.length && !(D.q.mcqs||[]).length) finishMine(); draw(); },
  answer:function(k){ if(!D||D.phase!=='play') return; D.mcq[D.m]=k; D.m++; send('prog', { n:progress() }); if(D.m>=D.q.mcqs.length) finishMine(); draw(); },
  face:function(v){ if(!D||D.phase!=='face') return; D.face.typed=String(v||'').trim(); D.face.ok=!!D.face.theirs && D.face.typed===String(D.face.theirs); send('face', { ok:D.face.ok }); maybeResult(); },
  again:function(){ reset(); location.hash='#/clinsim/duel'; draw(); },
  quit:function(){ if(D && (D.phase==='play'||D.phase==='count')) forfeit('left the duel'); reset(); },
  _test:{ winner:winner, samePattern:samePattern, newPattern:newPattern, state:function(){ return D; } }
};
})(typeof window!=='undefined'?window:globalThis);
