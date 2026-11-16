/* =====================================================================
 * ER Sim — the patient at the bedside (original MedBank vector art).
 *
 * ERSIM_SCENE.svg(case, run, last) draws the patient lying on an A&E trolley
 * in a Nigerian hospital bay, from the live run state:
 *   - who they are: child / teen / adult, pregnant, skin tone, clothes, hair
 *     or head-tie / hijab / cap  (case.look)
 *   - how they are: breathing at their real RR, fitting, sweating, pale, blue
 *     lips, eyes open / drowsy / closed, grimacing, bleeding, hives
 *     (vitals + the case's active problems' `look`)
 *   - what you have done: oxygen, IV line and the bag running, monitor leads,
 *     BP cuff, catheter bag, NG tube, collar, needle in the chest, chest drain,
 *     splint, the tourniquet the family tied (until you remove it)
 *   - a ring and a label at the spot you just acted on (last = {id, at})
 * Everything is inline SVG + CSS, so it costs nothing to download and works offline.
 * ===================================================================== */
(function(root){
'use strict';

function e(s){ return String(s==null?'':s).replace(/[&<>"']/g,function(ch){ return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[ch]; }); }
function did(run, ids){ return ids.some(function(id){ return run.done[id] && run.done[id].length; }); }
function lastOf(run, ids){ var best=-1; ids.forEach(function(id){ var t=run.done[id]; if(t&&t.length&&t[t.length-1]>best) best=t[t.length-1]; }); return best; }
function mix(hex, to, k){
  var a=parseInt(hex.slice(1),16), b=parseInt(to.slice(1),16);
  var r=Math.round(((a>>16)&255)*(1-k)+((b>>16)&255)*k), g=Math.round(((a>>8)&255)*(1-k)+((b>>8)&255)*k), bl=Math.round((a&255)*(1-k)+(b&255)*k);
  return '#'+((1<<24)|(r<<16)|(g<<8)|bl).toString(16).slice(1);
}

// Active "looks" from the case's untreated problems
function looks(c, run){
  var L={};
  (c.problems||[]).forEach(function(p){ var st=run.probs[p.id]; if(p.look && st && st.active && !st.fixed) L[p.look]=1; });
  return L;
}

// Where things sit on the body (viewBox 0 0 480 270, head on the left)
var SITE={
  head:[112,128], mouth:[121,138], nose:[122,132], neck:[132,142], chest:[170,136], arm:[150,142], hand:[204,150],
  belly:[230,138], leg:[300,148], foot:[372,150], side:[178,152], bedside:[300,196]
};
var ACT_SITE={
  o2_nasal:'nose', o2_mask:'mouth', bvm:'mouth', intubate:'mouth', suction:'mouth', ngt:'nose',
  iv_access:'hand', io_access:'leg', monitor:'chest', cspine:'neck', needle_decomp:'chest', chest_drain:'side',
  catheter:'bedside', immobilise:'foot', remove_tourniquet:'leg', tourniquet:'leg', incise:'foot', cool:'head', cpr:'chest',
  position:'chest', decontaminate:'chest', prep_anaphylaxis:'hand'
};
function siteFor(id, cat){
  if(ACT_SITE[id]) return ACT_SITE[id];
  if(cat==='fluids') return 'hand';
  if(cat==='drugs') return /oral|act|nifedipine|doxy|ors|loperamide|aspirin|paracetamol|nsaid|azithro/.test(id)?'mouth':'hand';
  return null;
}

function svg(c, run, last){
  var lk=c.look||{}, L=looks(c, run), v=run.v, dead=run.outcome==='died';
  var age=lk.build||'adult', scale= age==='child'?0.78 : age==='teen'?0.9 : 1;
  var skinBase=lk.skin||'#7a4a2a';
  var pale = L.pale || v.sbp<85 || v.spo2<85;
  var skin = dead ? '#9a9a9a' : pale ? mix(skinBase,'#c9c2b8',0.32) : skinBase;
  var skinShade = mix(skin,'#000000',0.22);
  var cyan = !dead && v.spo2<88;
  var lips = cyan ? '#4a5fa8' : mix(skinBase,'#5a1f1f',0.45);
  var shirt=lk.shirt||'#3E7CB1', blanket='#A9CBE6';
  var fitting = !dead && L.fitting;
  var gcs=v.gcs;
  var eyes = dead||gcs<=8 ? 'closed' : gcs<14 ? 'drowsy' : 'open';
  var hot = L.hot || v.temp>=38.5;
  var sweat = !dead && (hot || v.sbp<85 || L.distress) && !L.dry;
  var rr=Math.max(6,Math.min(60,v.rr||16)), hr=Math.max(20,Math.min(220,v.hr||80));
  var tourniquetOn = lk.tourniquet && !did(run,['remove_tourniquet']);
  var feet = lk.footOut;
  var o = [];

  o.push('<svg class="ers-scene" viewBox="54 54 420 172" role="img" aria-label="'+e(sceneLabel(c, run, L))+'">');
  // ---- room
  o.push('<defs><linearGradient id="ersSky" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#9fd3f0"/><stop offset="1" stop-color="#f6e7c8"/></linearGradient>'+
    '<linearGradient id="ersWall" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#f3ead9"/><stop offset="1" stop-color="#eadfca"/></linearGradient>'+
    '<radialGradient id="ersLight" cx="0.72" cy="0.2" r="0.7"><stop offset="0" stop-color="#fff6dc" stop-opacity=".75"/><stop offset="1" stop-color="#fff6dc" stop-opacity="0"/></radialGradient></defs>');
  o.push('<rect width="480" height="270" fill="url(#ersWall)"/>');
  o.push('<rect y="176" width="480" height="40" fill="#cfe3d9"/><rect y="174" width="480" height="3" fill="#b7d0c4"/>');
  o.push('<rect y="214" width="480" height="56" fill="#d8ccb6"/>');
  for(var fx=0; fx<480; fx+=48) o.push('<line x1="'+fx+'" y1="214" x2="'+(fx-30)+'" y2="270" stroke="#c9bca4" stroke-width="1"/>');
  // window with a palm outside
  o.push('<g><rect x="286" y="26" width="104" height="86" rx="4" fill="url(#ersSky)" stroke="#b9a98d" stroke-width="4"/>'+
    '<path d="M338 112 C336 90 340 70 346 56" stroke="#6b5232" stroke-width="3" fill="none"/>'+
    '<path d="M346 56 C330 50 318 54 308 64 M346 56 C356 44 370 44 382 50 M346 56 C344 42 336 34 324 32 M346 56 C362 56 374 64 380 76 M346 56 C334 60 326 70 322 82" stroke="#3f7a4a" stroke-width="4" fill="none" stroke-linecap="round"/>'+
    '<line x1="338" y1="26" x2="338" y2="112" stroke="#b9a98d" stroke-width="3"/><line x1="286" y1="69" x2="390" y2="69" stroke="#b9a98d" stroke-width="3"/></g>');
  o.push('<rect width="480" height="270" fill="url(#ersLight)"/>');
  // ceiling fan
  o.push('<g opacity=".8"><line x1="236" y1="0" x2="236" y2="10" stroke="#6d6a63" stroke-width="2"/><ellipse cx="236" cy="12" rx="6" ry="3" fill="#6d6a63"/>'+
    '<g class="ers-fan"><rect x="196" y="10.5" width="34" height="3" rx="1.5" fill="#8b877e"/><rect x="242" y="10.5" width="34" height="3" rx="1.5" fill="#8b877e"/></g></g>');
  // bay sign + oxygen wall outlet
  o.push('<g><rect x="196" y="60" width="76" height="18" rx="4" fill="#2f6f5e"/><text x="234" y="72.5" text-anchor="middle" font-size="9" font-weight="700" fill="#fff" font-family="system-ui,sans-serif">A&amp;E · BAY 3</text></g>');
  o.push('<g><rect x="70" y="78" width="20" height="16" rx="3" fill="#e9eef0" stroke="#9aa7ad"/><circle cx="80" cy="86" r="4" fill="#2e9e5b"/></g>');
  // curtain
  o.push('<g><rect x="0" y="0" width="58" height="6" fill="#9a8f7e"/>'+
    '<path d="M0 6 H56 V214 C48 210 44 214 38 210 C30 214 24 210 18 214 C12 210 6 214 0 210 Z" fill="#2f7d6b"/>'+
    '<path d="M12 6 V210 M26 6 V212 M40 6 V210" stroke="#256556" stroke-width="3"/></g>');

  // ---- IV pole + bag (when a line is in)
  var line = did(run,['iv_access','io_access']);
  var fluidIds=['blood','rl_planc','ns_bolus','dextrose10','maint','kcl','antivenom','insulin_frii','mgso4','artesunate'];
  var bag=null, lt=-1;
  fluidIds.forEach(function(id){ var t=lastOf(run,[id]); if(t>lt){ lt=t; bag=id; } });
  var BAG={ blood:['#9b1c1c','BLOOD'], rl_planc:['#e8f1f8','RL'], ns_bolus:['#e8f1f8','0.9% NS'], maint:['#e8f1f8','MAINT'], dextrose10:['#f3efdc','D10'], kcl:['#e8f1f8','+KCl'],
            antivenom:['#efe6f7','ASV'], insulin_frii:['#e8f1f8','INSULIN'], mgso4:['#e8f1f8','MgSO₄'], artesunate:['#eef4e6','ARTES.'] };
  o.push('<g><line x1="160" y1="44" x2="160" y2="226" stroke="#8c96a0" stroke-width="3"/><path d="M146 46 H174" stroke="#8c96a0" stroke-width="3" stroke-linecap="round"/>'+
    '<path d="M150 226 L160 220 L170 226" stroke="#8c96a0" stroke-width="3" fill="none"/>');
  if(line && bag && BAG[bag]){
    var col=BAG[bag][0];
    o.push('<rect x="149" y="48" width="22" height="32" rx="5" fill="'+col+'" stroke="#9aa7b4"/><text x="160" y="67" text-anchor="middle" font-size="5.5" font-weight="700" fill="'+(bag==='blood'?'#fff':'#335')+'" font-family="system-ui,sans-serif">'+BAG[bag][1]+'</text>'+
      '<rect x="157" y="80" width="6" height="9" rx="1.5" fill="#dfe8ef" stroke="#9aa7b4"/><circle class="ers-drip" cx="160" cy="84" r="1.2" fill="'+(bag==='blood'?'#9b1c1c':'#7fb6e0')+'"/>');
  }
  o.push('</g>');

  // ---- monitor on a stand
  var mon = did(run,['monitor']);
  o.push('<g><line x1="436" y1="104" x2="436" y2="226" stroke="#8c96a0" stroke-width="3"/><path d="M424 226 H448" stroke="#8c96a0" stroke-width="3"/>'+
    '<rect x="402" y="58" width="68" height="48" rx="5" fill="#2d3540"/><rect x="406" y="62" width="60" height="40" rx="2" fill="#0d141d"/>');
  if(mon){
    o.push('<svg x="406" y="66" width="44" height="20" viewBox="0 0 88 20" preserveAspectRatio="none"><g class="'+(dead?'':'ers-ecg')+'" style="animation-duration:'+(dead?0:(60/hr)).toFixed(2)+'s">'+
      '<path d="'+(dead?'M0 12 H176':ecgPath())+'" stroke="'+(dead?'#ff6b6b':'#7CF29A')+'" stroke-width="1.6" fill="none"/></g></svg>'+
      '<text x="460" y="78" text-anchor="end" font-size="9" font-weight="800" fill="'+(dead?'#ff6b6b':'#7CF29A')+'" font-family="system-ui,sans-serif">'+(dead?'0':Math.round(hr))+'</text>'+
      '<text x="410" y="97" font-size="7.5" font-weight="800" fill="#7fd7ff" font-family="system-ui,sans-serif">'+(dead?'--':Math.round(v.spo2))+'%</text>'+
      '<text x="463" y="97" text-anchor="end" font-size="7.5" font-weight="700" fill="#ffd166" font-family="system-ui,sans-serif">'+(dead?'--/--':Math.round(v.sbp)+'/'+Math.round(v.dbp))+'</text>');
  } else {
    o.push('<text x="436" y="86" text-anchor="middle" font-size="6.5" fill="#5f6b78" font-family="system-ui,sans-serif">not connected</text>');
  }
  o.push('</g>');

  // ---- trolley
  o.push('<g><rect x="62" y="112" width="12" height="76" rx="4" fill="#7d8b99"/><rect x="386" y="128" width="12" height="60" rx="4" fill="#7d8b99"/>'+
    '<rect x="80" y="176" width="302" height="10" rx="3" fill="#9aa5b1"/>'+
    '<line x1="98" y1="186" x2="98" y2="226" stroke="#7d8b99" stroke-width="5"/><line x1="362" y1="186" x2="362" y2="226" stroke="#7d8b99" stroke-width="5"/>'+
    '<circle cx="98" cy="231" r="6" fill="#4b5560"/><circle cx="362" cy="231" r="6" fill="#4b5560"/>'+
    '<rect x="70" y="152" width="320" height="24" rx="7" fill="#ffffff" stroke="#cdc6b8"/>'+
    '<rect x="150" y="160" width="190" height="4" rx="2" fill="#b8c2cc" opacity=".55"/></g>');

  // catheter bag, chest drain bottle (under/beside the trolley)
  if(did(run,['catheter'])){
    var dry = L.dry && !(run.probs.dehydration&&run.probs.dehydration.fixed);
    o.push('<g><path d="M262 172 C262 186 286 186 290 192" stroke="#e7d9a5" stroke-width="2" fill="none"/><rect x="284" y="190" width="22" height="26" rx="4" fill="#f6f1df" stroke="#b9ad86"/>'+
      '<rect x="286" y="'+(dry?208:200)+'" width="18" height="'+(dry?6:14)+'" rx="2" fill="'+(dry?'#b8732a':'#e8c95a')+'"/></g>');
  }
  if(did(run,['chest_drain'])){
    o.push('<g><path d="M178 150 C186 176 196 186 200 200" stroke="#c9d6e0" stroke-width="3" fill="none"/><rect x="190" y="198" width="22" height="26" rx="3" fill="#e9f3fb" stroke="#90a8bb"/>'+
      '<rect x="192" y="210" width="18" height="12" fill="#bfe0f5"/><circle class="ers-bubble" cx="201" cy="218" r="1.6" fill="#fff"/><circle class="ers-bubble b2" cx="204" cy="220" r="1.2" fill="#fff"/></g>');
  }

  // ---- the patient
  var cls='ers-pt'+(fitting?' ers-fit':'')+(dead?' ers-dead':'');
  var tr='translate(112,140) scale('+scale+') translate(-112,-140)';
  o.push('<g class="'+cls+'"><g transform="'+tr+'">');
  // pillow
  o.push('<ellipse cx="108" cy="150" rx="36" ry="11" fill="#f4f7fb" stroke="#d9dee6"/>');
  // hair behind the head
  o.push(hairBack(lk, skinShade));
  // neck + shoulder (shirt)
  o.push('<rect x="122" y="136" width="14" height="12" rx="4" fill="'+skin+'"/>');
  o.push('<path d="M130 132 C142 126 160 126 176 130 L182 152 L128 152 Z" fill="'+shirt+'"/>');
  // body under the blanket, breathing
  var belly = lk.pregnant ? 'C206 150 210 104 248 106 C282 108 282 140 296 140' : 'C220 132 260 134 300 138';
  var rrDur=(60/rr).toFixed(2);
  o.push('<g class="'+(dead?'':'ers-breathe')+'" style="animation-duration:'+rrDur+'s">'+
    '<path d="M150 154 L156 130 C170 124 186 126 196 132 '+belly+' C330 140 350 132 364 134 C376 136 380 146 380 156 Z" fill="'+blanket+'" stroke="#7fa9c9" stroke-width="1"/>'+
    '<path d="M210 140 C230 146 250 146 270 142 M300 146 C318 150 336 150 350 146" stroke="#8fb6d4" stroke-width="1.4" fill="none"/>'+
    '<path d="M154 136 C166 132 182 132 196 136" stroke="#ffffff" stroke-width="4" opacity=".7" fill="none"/></g>');
  // exposed lower leg/foot (snakebite)
  if(feet){
    var swollen = L.bleeding || L.pain;
    o.push('<g><path d="M334 146 C346 144 360 144 370 146 L'+(swollen?378:374)+' 140 C386 140 390 148 386 154 L334 156 Z" fill="'+skin+'" stroke="'+skinShade+'" stroke-width=".8"/>'+
      '<circle cx="372" cy="146" r="1.3" fill="#8b1a1a"/><circle cx="377" cy="146.5" r="1.3" fill="#8b1a1a"/>'+
      (L.bleeding?'<path class="ers-ooze" d="M374 148 q1 4 0 6" stroke="#a11d1d" stroke-width="1.6" fill="none"/>':'')+
      '<ellipse cx="372" cy="149" rx="9" ry="5" fill="#5b2a6e" opacity=".22"/></g>');
    if(tourniquetOn) o.push('<g><rect x="338" y="143" width="5" height="15" rx="1.5" fill="#8a5a2b"/><path d="M340 143 l-4 -6 M341 143 l3 -7" stroke="#8a5a2b" stroke-width="1.6"/></g>');
    if(did(run,['immobilise'])) o.push('<rect x="346" y="152" width="40" height="5" rx="2" fill="#d9c08d" stroke="#a88e5a"/>');
  }
  // arm on top of the blanket
  var armSkin = L.rash ? 'url(#ersHives)' : skin;
  o.push('<path d="M150 140 C168 146 186 150 204 150" stroke="'+skin+'" stroke-width="9" stroke-linecap="round" fill="none"/>'+
    '<path d="M146 138 C152 141 158 143 164 145" stroke="'+shirt+'" stroke-width="12" stroke-linecap="round" fill="none"/>'+
    '<circle cx="206" cy="150" r="5.2" fill="'+skin+'"/>');
  if(L.rash) o.push('<g fill="#d64545" opacity=".75"><circle cx="172" cy="147" r="1.6"/><circle cx="180" cy="149" r="1.3"/><circle cx="188" cy="148" r="1.8"/><circle cx="194" cy="151" r="1.2"/><circle cx="128" cy="140" r="1.4"/><circle cx="134" cy="144" r="1.2"/></g>');
  if(lk.abrasions) o.push('<g stroke="#a63a2a" stroke-width="1.2" opacity=".8"><path d="M176 146 l6 2 M180 148 l5 2"/><path d="M160 132 l7 -2 M163 135 l6 -2"/></g>');
  // head
  o.push('<circle cx="112" cy="128" r="15" fill="'+skin+'"/>');
  o.push('<ellipse cx="102" cy="130" rx="3" ry="4" fill="'+skinShade+'"/>');   // ear
  o.push(face(eyes, L, lips, skinShade, fitting, dead));
  o.push(hairFront(lk));
  if(sweat) o.push('<g fill="#9fd4f5"><path class="ers-sweat" d="M120 114 q2 3 0 4 q-2 -1 0 -4z"/><path class="ers-sweat s2" d="M126 120 q2 3 0 4 q-2 -1 0 -4z"/><path class="ers-sweat s3" d="M106 113 q2 3 0 4 q-2 -1 0 -4z"/></g>');
  if(L.bleeding) o.push('<path d="M121 140 q1 3 0 5" stroke="#a11d1d" stroke-width="1.4" fill="none"/>');
  if(did(run,['cool'])) o.push('<rect x="104" y="113" width="18" height="6" rx="2" fill="#ffffff" stroke="#c9d6e0"/>');
  if(did(run,['cspine'])) o.push('<rect x="119" y="134" width="20" height="13" rx="4" fill="#efe9d8" stroke="#b3a98f"/>');
  o.push('</g></g>');

  // ---- equipment on the body (outside the fitting/scale group so lines stay attached to the room)
  var P=function(k){ var s=SITE[k]; return [112+(s[0]-112)*scale, 140+(s[1]-140)*scale]; };
  var nose=P('nose'), mouth=P('mouth'), hand=P('hand'), chest=P('chest'), arm=P('arm');
  if(did(run,['o2_nasal']) && !did(run,['o2_mask','bvm','intubate'])){
    o.push('<path d="M'+nose[0]+' '+nose[1]+' C'+(nose[0]-8)+' '+(nose[1]+10)+' 96 112 84 94" stroke="#cfe8f2" stroke-width="2" fill="none"/><circle cx="'+nose[0]+'" cy="'+nose[1]+'" r="1.6" fill="#cfe8f2"/>');
  }
  if(did(run,['o2_mask']) && !did(run,['bvm','intubate'])){
    o.push('<path d="M'+mouth[0]+' '+(mouth[1]+4)+' C'+(mouth[0]-14)+' '+(mouth[1]+18)+' 96 112 84 94" stroke="#cfe8f2" stroke-width="2.4" fill="none"/>'+
      '<ellipse cx="'+mouth[0]+'" cy="'+(mouth[1]-3)+'" rx="'+(9*scale)+'" ry="'+(8*scale)+'" fill="#bfe8d5" fill-opacity=".55" stroke="#7cc4a4"/>'+
      '<ellipse cx="'+(mouth[0]+3)+'" cy="'+(mouth[1]+10)+'" rx="7" ry="5" fill="#bfe8d5" fill-opacity=".5" stroke="#7cc4a4"/>');
  }
  if(did(run,['bvm'])) o.push('<g><ellipse cx="'+mouth[0]+'" cy="'+(mouth[1]-3)+'" rx="'+(9*scale)+'" ry="'+(8*scale)+'" fill="#9fd0ea" fill-opacity=".6" stroke="#5b9bc0"/><ellipse class="ers-bag" cx="'+(mouth[0]+4)+'" cy="'+(mouth[1]-22)+'" rx="14" ry="7" fill="#e7f2f9" stroke="#5b9bc0"/></g>');
  if(did(run,['intubate'])) o.push('<path d="M'+mouth[0]+' '+mouth[1]+' L'+(mouth[0]+2)+' '+(mouth[1]-22)+' L'+(mouth[0]+20)+' '+(mouth[1]-30)+'" stroke="#e7f2f9" stroke-width="3.2" fill="none"/>');
  if(did(run,['ngt'])) o.push('<path d="M'+nose[0]+' '+nose[1]+' C'+(nose[0]+12)+' '+(nose[1]-8)+' '+(nose[0]+20)+' '+(nose[1]+4)+' '+(nose[0]+30)+' '+(nose[1]+18)+'" stroke="#f2e2a8" stroke-width="1.8" fill="none"/>');
  if(line){
    o.push('<rect x="'+(hand[0]-7)+'" y="'+(hand[1]-4)+'" width="9" height="6" rx="1.5" fill="#f7f7f2" stroke="#b9c3cc"/>');
    if(bag) o.push('<path d="M160 89 C162 120 '+(hand[0]-30)+' '+(hand[1]-30)+' '+(hand[0]-4)+' '+(hand[1]-2)+'" stroke="'+(bag==='blood'?'#b33a3a':'#cfe3f2')+'" stroke-width="1.6" fill="none"/>');
  }
  if(did(run,['monitor'])){
    o.push('<path d="M'+chest[0]+' '+chest[1]+' C220 110 360 120 404 92" stroke="#e05555" stroke-width="1" fill="none"/>'+
      '<path d="M'+(chest[0]+8)+' '+(chest[1]-2)+' C230 108 370 112 404 96" stroke="#e6c34a" stroke-width="1" fill="none"/>'+
      '<path d="M'+hand[0]+' '+hand[1]+' C260 160 380 130 404 100" stroke="#6aa9d8" stroke-width="1" fill="none"/><circle cx="'+(hand[0]+4)+'" cy="'+hand[1]+'" r="2.4" fill="#e04848"/>'+
      '<rect x="'+(arm[0]-5)+'" y="'+(arm[1]-7)+'" width="11" height="12" rx="2" fill="#3f6d9c" opacity=".9"/>');
  }
  if(did(run,['needle_decomp'])) o.push('<g><line x1="'+(chest[0]-6)+'" y1="'+(chest[1]-6)+'" x2="'+(chest[0]-2)+'" y2="'+(chest[1]-14)+'" stroke="#cfd6dc" stroke-width="1.6"/><rect x="'+(chest[0]-5)+'" y="'+(chest[1]-19)+'" width="5" height="6" rx="1" fill="#f08a24"/></g>');

  // ---- the spot you just acted on
  if(last && last.id && (Date.now()-last.at)<2600){
    var A=(root.ERSIM_ENGINE&&ERSIM_ENGINE.BYID[last.id])||{};
    var sk=siteFor(last.id, A.cat);
    if(sk){
      var s=P(sk); if(sk==='bedside'||sk==='side'||sk==='foot'||sk==='leg') s=SITE[sk];
      var lab=shortLabel(last.id, A.label||'');
      var lx=Math.min(Math.max(s[0]-50,8),372), ly=s[1]<120?s[1]+16:s[1]-34;
      o.push('<g class="ers-ping"><circle cx="'+s[0]+'" cy="'+s[1]+'" r="9" fill="none" stroke="#ffb020" stroke-width="2.5"/>'+
        '<rect x="'+lx+'" y="'+ly+'" width="100" height="16" rx="8" fill="#1d2433" opacity=".88"/><text x="'+(lx+50)+'" y="'+(ly+11)+'" text-anchor="middle" font-size="8" font-weight="700" fill="#fff" font-family="system-ui,sans-serif">'+e(lab)+'</text></g>');
    }
  }
  if(dead) o.push('<rect width="480" height="270" fill="#1b1b1b" opacity=".35"/>');
  o.push('<defs><pattern id="ersHives" width="6" height="6" patternUnits="userSpaceOnUse"><rect width="6" height="6" fill="'+skin+'"/><circle cx="3" cy="3" r="1.2" fill="#d64545"/></pattern></defs>');
  o.push('</svg>');
  return o.join('');
}

function shortLabel(id, label){
  var M={ o2_nasal:'O₂ nasal prongs', o2_mask:'O₂ mask 15 L', iv_access:'IV line in', io_access:'IO needle in', monitor:'Monitor on', cspine:'Collar on',
    needle_decomp:'Needle decompression', chest_drain:'Chest drain in', catheter:'Catheter in', immobilise:'Limb splinted', remove_tourniquet:'Tourniquet off',
    ngt:'NG tube in', bvm:'Bagging', intubate:'Intubated', cool:'Cooling', suction:'Suctioned', position:'Repositioned' };
  if(M[id]) return M[id];
  return label.replace(/^(IV|IM|Oral|IV\/IM)\s+/i,'').split(/[(,]/)[0].slice(0,22);
}

function ecgPath(){
  // two beats across 176 units (the group slides left by one beat width, 88)
  var b=function(x){ return 'L'+(x+20)+' 12 L'+(x+26)+' 10 L'+(x+30)+' 12 L'+(x+38)+' 12 L'+(x+40)+' 14 L'+(x+43)+' 2 L'+(x+46)+' 17 L'+(x+49)+' 12 L'+(x+60)+' 12 C'+(x+64)+' 7 '+(x+70)+' 7 '+(x+74)+' 12 L'+(x+88)+' 12'; };
  return 'M0 12 '+b(0)+' '+b(88);
}

function face(eyes, L, lips, shade, fitting, dead){
  var o='';
  // brows
  if(L.pain || L.distress) o+='<path d="M104 120 l6 2 M116 122 l6 -2" stroke="#2b1a12" stroke-width="1.4" stroke-linecap="round"/>';
  else o+='<path d="M104 121 q3 -1.5 6 0 M116 121 q3 -1.5 6 0" stroke="#2b1a12" stroke-width="1.2" fill="none" stroke-linecap="round"/>';
  // eyes
  if(fitting) o+='<ellipse cx="107" cy="126" rx="2.6" ry="1.8" fill="#f4f1ea"/><ellipse cx="119" cy="126" rx="2.6" ry="1.8" fill="#f4f1ea"/><circle cx="107" cy="125" r=".9" fill="#2b1a12"/><circle cx="119" cy="125" r=".9" fill="#2b1a12"/>';
  else if(eyes==='open') o+='<ellipse cx="107" cy="126.5" rx="1.6" ry="2" fill="#1d120c"/><ellipse cx="119" cy="126.5" rx="1.6" ry="2" fill="#1d120c"/>';
  else if(eyes==='drowsy') o+='<path d="M105 127 h4 M117 127 h4" stroke="#1d120c" stroke-width="1.6" stroke-linecap="round"/><path d="M105 126 q2 -1.5 4 0 M117 126 q2 -1.5 4 0" stroke="#1d120c" stroke-width="1" fill="none"/>';
  else o+='<path d="M105 126.5 q2 1.6 4 0 M117 126.5 q2 1.6 4 0" stroke="#1d120c" stroke-width="1.3" fill="none" stroke-linecap="round"/>';
  if(L.dry) o+='<path d="M105 129.5 q2 1.2 4 0 M117 129.5 q2 1.2 4 0" stroke="'+shade+'" stroke-width="1.4" fill="none"/>';
  // nose + mouth
  o+='<path d="M113 128 q2 4 0 5" stroke="'+shade+'" stroke-width="1.2" fill="none"/>';
  if(fitting) o+='<path d="M108 137 q5 3 10 0" stroke="'+lips+'" stroke-width="1.8" fill="#f4f1ea"/>';
  else if(L.pain) o+='<path d="M108 137 l2.5 -1.5 l2.5 1.5 l2.5 -1.5 l2.5 1.5" stroke="'+lips+'" stroke-width="1.5" fill="none" stroke-linejoin="round"/>';
  else if(L.distress) o+='<ellipse cx="113" cy="137" rx="3" ry="2.2" fill="#3a1f1a" stroke="'+lips+'" stroke-width="1.2"/>';
  else if(dead) o+='<path d="M109 137 h8" stroke="'+lips+'" stroke-width="1.4"/>';
  else o+='<path d="M109 136.5 q4 1.8 8 0" stroke="'+lips+'" stroke-width="1.6" fill="none" stroke-linecap="round"/>';
  if(L.hot) o+='<ellipse cx="104" cy="132" rx="3.5" ry="2" fill="#e0614f" opacity=".28"/><ellipse cx="122" cy="132" rx="3.5" ry="2" fill="#e0614f" opacity=".28"/>';
  return o;
}

function hairBack(lk, shade){
  var h=lk.hair||'short', c=lk.hairColor||'#1b1310';
  if(h==='braids') return '<path d="M98 124 C92 136 90 150 96 160 M102 128 C98 142 98 154 104 162 M94 120 C86 132 84 146 88 156" stroke="'+c+'" stroke-width="3.2" fill="none" stroke-linecap="round"/>';
  if(h==='puffs') return '<circle cx="98" cy="114" r="6.5" fill="'+c+'"/><circle cx="126" cy="112" r="6" fill="'+c+'"/>';
  if(h==='hijab') return '<path d="M94 118 C92 136 100 150 122 152 L140 152 C134 140 132 120 126 112 Z" fill="'+(lk.wrap||'#3a3f7a')+'"/>';
  return '';
}
function hairFront(lk){
  var h=lk.hair||'short', c=lk.hairColor||'#1b1310', w=lk.wrap||'#c9572e';
  if(h==='short') return '<path d="M98 124 C98 110 110 106 120 110 C126 112 128 118 127 122 C122 116 110 114 98 124 Z" fill="'+c+'"/>';
  if(h==='braids') return '<path d="M97 126 C96 110 112 104 124 110 C128 113 128 118 127 121 C118 114 106 116 97 126 Z" fill="'+c+'"/><path d="M104 114 l2 6 M110 112 l1 6 M116 112 l0 6" stroke="#3a2a22" stroke-width="1"/>';
  if(h==='puffs') return '<path d="M98 124 C98 112 110 108 120 111 C126 113 128 118 127 121 C120 116 108 116 98 124 Z" fill="'+c+'"/>';
  if(h==='cap') return '<path d="M97 122 C97 108 128 106 128 120 Z" fill="'+(lk.wrap||'#f2efe6')+'" stroke="#c9c3b2"/><path d="M100 116 h24" stroke="#c9c3b2" stroke-width=".8" stroke-dasharray="2 2"/>';
  if(h==='headwrap') return '<path d="M95 124 C92 104 120 98 130 112 C132 118 130 122 127 123 C118 114 104 114 95 124 Z" fill="'+w+'"/><path d="M98 112 C108 104 120 104 128 110" stroke="'+mix(w,'#ffffff',0.35)+'" stroke-width="2" fill="none"/><circle cx="124" cy="104" r="5" fill="'+w+'"/>';
  if(h==='hijab') return '<path d="M96 124 C94 106 122 100 130 116 C131 122 130 126 128 128 C126 118 108 112 96 124 Z" fill="'+(lk.wrap||'#3a3f7a')+'"/>';
  return '';
}

function sceneLabel(c, run, L){
  var p=c.patient, bits=[p.name+', '+p.age+' '+p.sex+', lying on a trolley'];
  if(L.fitting) bits.push('fitting'); if(L.pain) bits.push('in pain'); if(L.distress) bits.push('breathing hard');
  if(L.bleeding) bits.push('bleeding'); if(L.rash) bits.push('covered in hives'); if(L.dry) bits.push('dehydrated');
  if(run.outcome==='died') bits.push('no signs of life');
  return bits.join(', ');
}

var CSS=[
  '.ers-scene{display:block;width:100%;height:auto;border-radius:14px;border:1px solid var(--line);background:#efe6d6}',
  '.ers-breathe{transform-box:fill-box;transform-origin:50% 100%;animation:ersBreathe 3s ease-in-out infinite}',
  '@keyframes ersBreathe{0%,100%{transform:scaleY(1)}45%{transform:scaleY(1.07)}}',
  '.ers-fit{animation:ersFit .16s steps(2) infinite}',
  '@keyframes ersFit{0%{transform:translate(0,0) rotate(0)}25%{transform:translate(1.4px,-1px) rotate(.4deg)}50%{transform:translate(-1.2px,1px) rotate(-.4deg)}75%{transform:translate(1px,1px)}}',
  '.ers-ecg{animation:ersEcg 1s linear infinite}@keyframes ersEcg{to{transform:translateX(-88px)}}',
  '.ers-sweat{animation:ersSweat 2.2s ease-in infinite}.ers-sweat.s2{animation-delay:.7s}.ers-sweat.s3{animation-delay:1.4s}',
  '@keyframes ersSweat{0%{transform:translateY(0);opacity:0}20%{opacity:1}100%{transform:translateY(10px);opacity:0}}',
  '.ers-drip{animation:ersDrip 1.4s ease-in infinite}@keyframes ersDrip{0%{transform:translateY(0);opacity:1}100%{transform:translateY(4px);opacity:0}}',
  '.ers-bubble{animation:ersBub 1.6s ease-out infinite}.ers-bubble.b2{animation-delay:.6s}@keyframes ersBub{0%{transform:translateY(0);opacity:1}100%{transform:translateY(-9px);opacity:0}}',
  '.ers-ooze{animation:ersOoze 2s ease-in-out infinite}@keyframes ersOoze{50%{opacity:.4}}',
  '.ers-bag{transform-box:fill-box;transform-origin:center;animation:ersBag 2.4s ease-in-out infinite}@keyframes ersBag{50%{transform:scale(.8,.7)}}',
  '.ers-fan{transform-box:fill-box;transform-origin:center;animation:ersFan .9s linear infinite}@keyframes ersFan{50%{transform:scaleX(.2)}}',
  '.ers-ping circle{transform-box:fill-box;transform-origin:center;animation:ersPing 1.2s ease-out 2}.ers-ping{animation:ersFade 2.6s forwards}',
  '@keyframes ersPing{0%{transform:scale(.4);opacity:1}100%{transform:scale(1.8);opacity:0}}@keyframes ersFade{0%,80%{opacity:1}100%{opacity:0}}',
  '.ers-dead{filter:grayscale(1)}',
  '@media (prefers-reduced-motion:reduce){.ers-scene *{animation:none!important}}'
].join('\n');

root.ERSIM_SCENE={ svg:svg, css:CSS, siteFor:siteFor, looks:looks };
})(typeof window!=='undefined'?window:globalThis);
