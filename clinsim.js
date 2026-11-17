/* =====================================================================
 * MedBank Clinical Simulation (route #/clinsim)
 *
 * One tab for clinical-year students (400, 500 and 600 level) that holds
 * every simulator as a mode, each with its own sub-modes:
 *   🚑 Emergency Room   : ER Sim (er-sim.js), by facility, plus the tutorial
 *   🩺 OSCE Stations    : history taking with the AI patient, timed or with prompts,
 *                         marked on data gathering, management and interpersonal skills
 *   ⚡ Quick Cases      : short branching cases with weighted scoring, then MCQs
 *   📅 Case of the Day  : one shared puzzle a day, six clues, six guesses, WhatsApp share
 *   👥 Study Group OSCE : pass-and-play: patient script, examiner sheet, shared timer
 *   📚 My Lecture Cases : cases the server builds from every lecture the student imports
 *                         (import-server/clinsim.mjs, cached in topic.extras.clinsim)
 *
 * Built-in content: Quick Cases and daily puzzles in clinsim-cases.js; OSCE stations
 * are drawn from the ER Sim cases' history so the two stay in step.
 * Unpaid students get one rotating built-in station and quick case a week, Case of the
 * Day and their own lecture cases; the rest opens with a subscription.
 *
 * Gated by MEDBANK_CONFIG.FEATURES.CLINICAL_SIM (default false). To try it on your own
 * device: localStorage.mbclinsim='1', then reload. Off a clinical level it shows a notice.
 * ===================================================================== */
(function(root){
'use strict';
if(typeof document==='undefined') return;

var CLIN_LEVELS=[400,500,600];
var FORM_Q='These look alike. Which one fits this patient?';
var OSCE_MIN=8;
function e(s){ return String(s==null?'':s).replace(/[&<>"']/g,function(ch){ return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[ch]; }); }
function cfg(){ return root.MEDBANK_CONFIG||{}; }
function on(){ try{ var F=cfg().FEATURES||{}; if(F.CLINICAL_SIM) return true; return root.localStorage&&localStorage.mbclinsim==='1'; }catch(_){ return false; } }
function level(){
  try{ var l=root.MB_SYNC&&root.MB_SYNC.currentLevel&&root.MB_SYNC.currentLevel(); if(l) return Number(l); }catch(_){}
  try{ if(localStorage.mbclinsimlevel) return Number(localStorage.mbclinsimlevel); }catch(_){}   // testing on a device with no account
  return null;
}
function clinical(){ return CLIN_LEVELS.indexOf(level())>=0; }
function visible(){ return on() && clinical(); }
function entitled(){ try{ var st=root.MB_SYNC.status(); if(!st.syncing) return true; return !!st.canUseFeatures; }catch(_){ return true; } }   // fail open, like MB_PAYWALL.guard
function go(h){ location.hash='#/'+h; }
function draw(){ var m=document.getElementById('main'); if(!m) return; m.innerHTML=page(CUR); try{ if(root.renderNav) root.renderNav(); }catch(_){} }

/* ---------- saved progress (DATA.clinsim, synced with the rest of DATA) */
var SCRATCH={ runs:[], daily:{} };
function store(){ var D=(typeof DATA!=='undefined')?DATA:null; if(!D) return SCRATCH; if(!D.clinsim) D.clinsim={ runs:[], daily:{} }; if(!D.clinsim.runs) D.clinsim.runs=[]; if(!D.clinsim.daily) D.clinsim.daily={}; return D.clinsim; }
function save(){ try{ if(typeof root.persist==='function') root.persist(); else if(typeof persist==='function') persist(); }catch(_){} }
function record(kind, id, pct, extra){ var s=store(); s.runs.push(Object.assign({ kind:kind, id:id, pct:pct, at:new Date().toISOString() }, extra||{})); if(s.runs.length>300) s.runs=s.runs.slice(-300); save(); }
function best(kind, id){ var b=null; store().runs.forEach(function(r){ if(r.kind===kind&&r.id===id&&(b===null||r.pct>b)) b=r.pct; }); return b; }

/* ---------- content */
function erCases(){ return root.ERSIM_CASES||[]; }
function engine(){ return root.ERSIM_ENGINE||null; }
function myTopics(){
  var list=(typeof allTopics!=='undefined')?allTopics:[];
  return list.filter(function(t){ return t && t.ready && t.subject && String(t.subject.id).indexOf('course_')===0 && String(t.note||'').trim(); });
}
function pack(t){ return (t && t.extras && t.extras.clinsim) || null; }
function packCount(p){ return p ? (p.osce||[]).length+(p.quick||[]).length+(p.daily||[]).length : 0; }

// OSCE stations from ER Sim cases: same patient, same history facts, diagnosis + where they go.
function stationFromEr(c){
  var E=engine(), D=(E&&E.DISPOSITIONS)||[];
  var dxO=(c.dx.options||[]).map(function(o){ return o.label; });
  var dxC=(c.dx.options||[]).map(function(o){ return o.id; }).indexOf(c.dx.correct[0]);
  var best=((c.dispo||{}).best||[])[0], okay=(c.dispo||{}).ok||[];
  var plan=null;
  if(best && D.length){
    var others=D.filter(function(d){ return d.id!==best && okay.indexOf(d.id)<0; }).slice(0,3);
    var opts=[D.filter(function(d){ return d.id===best; })[0]].concat(others).filter(Boolean);
    var k=(c.id.length)%opts.length; opts=opts.slice(k).concat(opts.slice(0,k));   // stable shuffle so the answer is not always first
    plan={ q:'Where should '+(c.patient.name.split(' ')[0])+' go now?', options:opts.map(function(d){ return d.label; }), correct:opts.map(function(d){ return d.id; }).indexOf(best) };
  }
  // topic practice: the topic names the condition, so ask which look-alike this patient has instead
  var cl=(c.dx.options||[]).filter(function(o){ return (c.dx.close||[]).indexOf(o.id)>=0; }).map(function(o){ return o.label; });
  var form=null;
  if(cl.length && dxC>=0){ var fo=[dxO[dxC]].concat(cl), fk=c.id.length%fo.length; fo=fo.slice(fk).concat(fo.slice(0,fk)); form={ q:FORM_Q, options:fo, correct:fo.indexOf(dxO[dxC]) }; }
  return { id:'er-'+c.id, source:'builtin', title:c.title, form:form, patient:c.patient, speaker:c.speaker, persona:c.persona,
    opening:'Good day, doctor.', background:c.background||'', history:c.history||[],
    dx:{ q:'What is your working diagnosis?', options:dxO, correct:dxC }, plan:plan, teaching:c.teaching||[], refs:c.refs||[], area:(E&&E.SETTINGS[c.setting]||{}).short||'',
    spec:erTags(c).spec, words:erTags(c).words, diff:c.level||'' };
}
function stationFromPack(t, s){
  return { id:t.id+'~'+s.id, source:'mine', basis:s.basis||'note', topicId:t.id, topicName:t.name, courseId:t.subject&&t.subject.id, title:s.title, patient:s.patient, speaker:s.speaker, persona:s.persona,
    opening:s.opening||'Good day, doctor.', background:s.background||'', history:s.history||[],
    dx:{ q:'What is your working diagnosis?', options:s.dx.options, correct:s.dx.correct },
    form:s.form&&s.form.options?{ q:s.form.q||FORM_Q, options:s.form.options, correct:s.form.correct }:null, courseName:t.subject&&t.subject.name,
    plan:s.plan?{ q:'What is the most appropriate next step?', options:s.plan.options, correct:s.plan.correct }:null, teaching:s.teaching||[], refs:[] };
}
function stations(src){
  var out=[];
  if(src!=='mine') erCases().forEach(function(c){ if(!c.tutorial) out.push(stationFromEr(c)); });
  if(src!=='builtin') myTopics().forEach(function(t){ var p=pack(t); ((p&&p.osce)||[]).forEach(function(s){ out.push(stationFromPack(t,s)); }); });
  return out;
}
function quickCases(src){
  var out=[];
  if(src!=='mine') (root.CLINSIM_QUICK||[]).forEach(function(q){ out.push(Object.assign({ source:'builtin' }, q)); });
  if(src!=='builtin') myTopics().forEach(function(t){ var p=pack(t); ((p&&p.quick)||[]).forEach(function(q){ out.push(Object.assign({}, q, { id:t.id+'~'+q.id, source:'mine', topicId:t.id, topicName:t.name, courseId:t.subject&&t.subject.id, courseName:t.subject&&t.subject.name, area:t.subject&&t.subject.name||'Your lecture' })); }); });
  return out;
}
function dailies(src){
  var out=[];
  if(src!=='mine') (root.CLINSIM_DAILY||[]).forEach(function(d){ out.push(Object.assign({ source:'builtin' }, d)); });
  if(src!=='builtin') myTopics().forEach(function(t){ var p=pack(t); ((p&&p.daily)||[]).forEach(function(d){ out.push(Object.assign({}, d, { id:t.id+'~'+d.id, source:'mine', topicId:t.id, topicName:t.name, courseId:t.subject&&t.subject.id, courseName:t.subject&&t.subject.name })); }); });
  return out;
}
function byId(list, id){ return list.filter(function(x){ return x.id===id; })[0]||null; }

/* ---------- course → topic → case (how cases are chosen)
 * Every case carries spec[] (specialties) and words (topic words). Built-in quick cases and
 * puzzles carry them in clinsim-cases.js; ER Sim cases get them here, so er-sim-cases.js stays
 * untouched. A student's course is matched to a specialty by its name, and their imported
 * topics are matched to built-in cases by topic words. Lecture cases belong to their own
 * course and topic already. */
var ER_TAGS={
  'fever-body-pains':  { spec:['Medicine'], words:'malaria fever infectious tropical' },
  'child-fever-fit':   { spec:['Paediatrics'], words:'severe malaria febrile convulsion seizure fever hypoglycaemia' },
  'scd-chest-pain':    { spec:['Paediatrics','Medicine'], words:'sickle cell acute chest syndrome haemoglobinopathy anaemia' },
  'farm-snakebite':    { spec:['Medicine','Surgery'], words:'snakebite envenoming toxicology antivenom emergency' },
  'pregnant-fit':      { spec:['Obstetrics & Gynaecology'], words:'eclampsia pre-eclampsia hypertension pregnancy seizure' },
  'okada-crash':       { spec:['Surgery'], words:'trauma road traffic chest injury pneumothorax atls' },
  'diabetic-vomiting': { spec:['Medicine'], words:'diabetes dka ketoacidosis endocrine' },
  'watery-diarrhoea':  { spec:['Medicine','Community Health'], words:'cholera diarrhoea dehydration outbreak gastroenteritis' }
};
function erTags(c){ return ER_TAGS[c.id] || { spec:['Medicine'], words:'' }; }
var SPECS=[
  ['Obstetrics & Gynaecology', /\b(obs|obstet|gyn|gynae|o\s*&\s*g|o\s*and\s*g|midwif|labou?r)/i],
  ['Paediatrics', /\b(paed|pediat|child|neonat)/i],
  ['Surgery', /\b(surg|ortho|trauma|urolog|anaesth|ent\b|ophthal)/i],
  ['Community Health', /\b(community|public health|epidemiol|preventive|cm\b)/i],
  ['Psychiatry', /\b(psych|mental)/i],
  ['Medicine', /\b(med|internal|cardio|nephro|gastro|neuro|endocrin|haemat|hemat|respir|infect|dermat)/i]
];
function specOf(name){ var n=String(name||''); for(var i=0;i<SPECS.length;i++) if(SPECS[i][1].test(n)) return SPECS[i][0]; return null; }
function myCourses(){
  var seen={}, out=[];
  myTopics().forEach(function(t){ var s=t.subject; if(!s||seen[s.id]) return; seen[s.id]=1; out.push({ id:s.id, name:s.name||s.short||'My course', spec:specOf(s.name) }); });
  return out;
}
var COURSE_KEY='mbclinsimcourse';
function courseSel(){ try{ return localStorage.getItem(COURSE_KEY)||'all'; }catch(_){ return 'all'; } }
function setCourse(id){ try{ localStorage.setItem(COURSE_KEY, id); }catch(_){} }
function curCourse(){
  var id=courseSel(); if(id==='all') return null;
  if(id.indexOf('spec:')===0){ var sp=id.slice(5); return { id:id, name:sp, spec:sp }; }
  return byId(myCourses(), id);
}
function normW(s){ return ' '+String(s||'').toLowerCase().replace(/[^a-z0-9]+/g,' ').trim()+' '; }
// does a built-in case belong with this topic title?
function topicHit(item, title){
  var t=normW(title); if(t.length<4) return false;
  return String(item.words||'').toLowerCase().split(/\s+/).some(function(w){ return w.length>=4 && t.indexOf(' '+w.replace(/[^a-z0-9]+/g,' ').trim()+' ')>=0; });
}
// does a case belong to the chosen course? (null course = everything)
function inCourse(item, course){
  if(!course) return true;
  if(item.source==='mine'){ if(item.courseId===course.id) return true; if(String(course.id).indexOf('spec:')!==0) return false; var mc=byId(myCourses(), item.courseId); return !!(mc && mc.spec===course.spec); }   // a specialty pick also takes lecture cases from courses of that specialty
  return !!(course.spec && (item.spec||[]).indexOf(course.spec)>=0);
}
// one list of every playable case, whatever its mode
function catalogue(){
  var out=[];
  erCases().forEach(function(c){ var tg=erTags(c); out.push({ kind:'er', id:c.id, title:c.title, spec:tg.spec, words:tg.words, diff:c.level||'', source:'builtin', tutorial:!!c.tutorial, href:'#/ersim/'+c.id }); });
  stations('all').forEach(function(s){ out.push({ kind:'osce', id:s.id, title:s.title, spec:s.spec||[], words:s.words||'', diff:s.diff||'', source:s.source, basis:s.basis, topicId:s.topicId, courseId:s.courseId, act:"openOsce('"+s.id+"','timed')" }); });
  quickCases('all').forEach(function(q){ out.push({ kind:'quick', id:q.id, title:q.title, spec:q.spec||[], words:q.words||'', diff:q.diff||'', source:q.source, basis:q.basis, topicId:q.topicId, courseId:q.courseId, act:"openQuick('"+q.id+"')" }); });
  dailies('mine').forEach(function(d){ out.push({ kind:'daily', id:d.id, title:'Mystery patient', spec:[], words:'', source:'mine', topicId:d.topicId, courseId:d.courseId, href:'#/clinsim/daily/mine/'+d.id }); });
  return out;
}
var KIND={ er:['🚑','ER case'], osce:['🩺','OSCE station'], quick:['⚡','Quick case'], daily:['📅','Puzzle'] };
function played(item){
  if(item.kind==='er'){ var runs=(typeof DATA!=='undefined'&&DATA.ersim&&DATA.ersim.runs)||[], b=null; runs.forEach(function(r){ if(r.caseId===item.id&&(b===null||r.pct>b)) b=r.pct; }); return b; }
  if(item.kind==='daily'){ var st=store().daily['mine:'+item.id]; return st&&st.done?(st.won?100:0):null; }
  return best(item.kind, item.id);
}
// Up next: unplayed cases in the chosen course, from the specialty where the student scores lowest
function upNext(course, n){
  var runsBySpec={}, all=catalogue();
  all.forEach(function(it){ var b=played(it); if(b===null) return; (it.spec.length?it.spec:['Lectures']).forEach(function(sp){ (runsBySpec[sp]=runsBySpec[sp]||[]).push(b); }); });
  var avg=function(sp){ var a=runsBySpec[sp]; return a&&a.length ? a.reduce(function(x,y){ return x+y; },0)/a.length : 60; };   // untried areas sit just under a pass
  return all.filter(function(it){ return it.kind!=='daily' && !it.tutorial && inCourse(it, course) && played(it)===null; })
    .map(function(it){ var sp=it.spec.length?it.spec:['Lectures']; return { it:it, w:Math.min.apply(null, sp.map(avg)) - (it.source==='mine'?5:0) }; })   // own lectures first on a tie
    .sort(function(a,b){ return a.w-b.w; }).filter(function(x){ var k=x.it.title.toLowerCase(); if(this[k]) return false; this[k]=1; return true; }, {}).slice(0, n||3).map(function(x){ return x.it; });   // one card per patient (an ER case and its OSCE station share a title)
}
// ctx: 'topic' (opened from its topic, so the diagnosis is not asked), 'blind' (mixed ward round:
// no topic or specialty shown, the diagnosis is asked and scores more) or 'open' (anywhere else)
function actFor(it, ctx){ ctx=ctx||'open'; return it.kind==='osce' ? "openOsce('"+it.id+"','timed','"+ctx+"')" : it.kind==='quick' ? "openQuick('"+it.id+"','"+ctx+"')" : it.act; }
function caseCard(it, ctx, label){
  var k=KIND[it.kind], b=played(it), free=it.kind==='er'||it.kind==='daily'||isFreeAny(it), blind=ctx==='blind';
  var href=it.kind==='daily'&&blind ? it.href+'/blind' : it.href;
  var open=href?'href="'+e(href)+'"':'href="javascript:void 0" onclick="MB_CLINSIM.'+(free?e(actFor(it, ctx)):'locked()')+';return false"';
  var tags=blind ? '' : (it.source==='mine'?'<span class="cs-tag">'+(it.basis==='general'?'📘 General topic case':'From your note')+'</span>':(it.spec||[]).slice(0,1).map(function(sp){ return '<span class="cs-tag">'+e(sp)+'</span>'; }).join(''));
  return '<a class="cs-card" style="text-decoration:none" '+open+'><div>'+(label?'<span class="cs-tag">'+e(label)+'</span>':'')+'<span class="cs-tag">'+k[0]+' '+k[1]+'</span>'+tags+(!free?'<span class="cs-tag lock">🔒</span>':'')+'</div>'+
    '<h3>'+e(it.title)+'</h3>'+(b!==null?'<div class="cs-best">Best: '+b+'%</div>':'<div class="cs-meta">Not played yet</div>')+'</a>';
}
function isFreeAny(it){ if(it.kind==='osce') return isFree(stations('all'), it); if(it.kind==='quick') return isFree(quickCases('all'), it); return true; }

/* ---------- one scoring system for every mode
 * Each run scores 0-100 in its own mode (OSCE domains, quick-case points, ER Sim, guesses).
 * grade : Excellent 85+, Pass 60+, Borderline 50-59, Fail below 50. A dangerous decision makes
 *         it Unsafe whatever the score; an OSCE part under 40% makes it Fail.
 * points: score x difficulty x how it was opened, divided by 10. Unsafe runs count as 40% at most.
 *         Only your best run of each case counts, so replaying a case cannot farm points.
 * rank  : from your total points. Study-group runs are ticked by friends, so they earn no points. */
var DIFF_X={ Beginner:1, Foundation:1, Core:1.25, Advanced:1.5 };
var CTX_X={ topic:1, open:1.1, duel:1.2, blind:1.3 };   // duel = a verified in-person duel (clinsim-duel.js)
var RANKS=[[0,'Student'],[100,'Clerk'],[300,'House Officer'],[700,'Medical Officer'],[1500,'Registrar'],[3000,'Consultant']];
function gradeOf(pct, o){ o=o||{}; if(o.unsafe) return 'Unsafe'; if(o.fail&&pct>=60) return 'Fail'; if(pct>=85&&!o.fail) return 'Excellent'; if(pct>=60&&!o.fail) return 'Pass'; return pct>=50?'Borderline':'Fail'; }
function pointsOf(pct, o){ o=o||{}; var p=Math.max(0, Math.min(100, o.unsafe?Math.min(pct,40):pct)); return Math.round(p*(DIFF_X[o.diff]||1.25)*(CTX_X[o.ctx]||1.1)*(o.mode==='practice'?0.5:1)/10); }
function rankOf(total){ var r=RANKS[0], nx=null; RANKS.forEach(function(x, i){ if(total>=x[0]){ r=x; nx=RANKS[i+1]||null; } }); return { name:r[1], at:r[0], next:nx?{ name:nx[1], at:nx[0] }:null }; }
function diffOf(kind, id){ var it=catalogue().filter(function(x){ return x.kind===kind && x.id===id; })[0]; return (it&&it.diff)||'Core'; }
function allRuns(){
  var out=store().runs.filter(function(r){ return r.kind!=='group'; }).map(function(r){ return { kind:r.kind, id:r.id, pct:r.pct, at:r.at, ctx:r.ctx, mode:r.mode, unsafe:!!r.unsafe }; });
  var er=(typeof DATA!=='undefined'&&DATA.ersim&&DATA.ersim.runs)||[];
  er.forEach(function(r){ out.push({ kind:'er', id:r.caseId, pct:r.pct, at:r.at, ctx:'open', unsafe:r.outcome==='died'||/unsafe/i.test(r.grade||'') }); });
  return out.sort(function(a,b){ return String(a.at).localeCompare(String(b.at)); });
}
function standing(){
  var bestPts={}, bestPct={}, runs=allRuns();
  runs.forEach(function(r){ var k=r.kind+':'+r.id, p=pointsOf(r.pct, { diff:diffOf(r.kind, r.id), ctx:r.ctx, mode:r.mode, unsafe:r.unsafe });
    if(!(k in bestPts) || p>bestPts[k]) bestPts[k]=p; if(!(k in bestPct) || r.pct>bestPct[k]) bestPct[k]=r.pct; });
  var total=Object.keys(bestPts).reduce(function(a,k){ return a+bestPts[k]; }, 0), streak=0;
  for(var i=runs.length-1; i>=0 && !runs[i].unsafe; i--) streak++;
  var specs={};
  catalogue().forEach(function(it){ if(it.tutorial || it.kind==='daily') return; (it.spec.length?it.spec:[]).forEach(function(sp){ var x=specs[sp]=specs[sp]||{ n:0, played:0, sum:0 }; x.n++; var b=bestPct[it.kind+':'+it.id]; if(b!=null){ x.played++; x.sum+=b; } }); });
  var bySpec=Object.keys(specs).map(function(sp){ var x=specs[sp]; return { spec:sp, cases:x.n, played:x.played, avg:x.played?Math.round(x.sum/x.played):null }; });
  return { total:total, rank:rankOf(total), safeStreak:streak, runs:runs.length, unsafe:runs.filter(function(r){ return r.unsafe; }).length, bySpec:bySpec };
}
// points this run adds on top of your previous best for the case (0 when it does not beat it)
function award(kind, id, pct, ex){
  var o={ diff:diffOf(kind, id), ctx:ex.ctx, mode:ex.mode, unsafe:ex.unsafe }, p=pointsOf(pct, o), prev=0;
  allRuns().forEach(function(r){ if(r.kind===kind && r.id===id) prev=Math.max(prev, pointsOf(r.pct, { diff:o.diff, ctx:r.ctx, mode:r.mode, unsafe:r.unsafe })); });
  return { pts:p, gain:Math.max(0, p-prev), grade:gradeOf(pct, { unsafe:ex.unsafe, fail:ex.pass===false }), ctx:ex.ctx };
}
function pointsLine(a){
  if(!a) return '';
  var why=a.ctx==='blind'?' · mixed round bonus':a.ctx==='topic'?' · topic practice':'';
  return '<div class="cs-meta" style="margin:6px 0 2px"><b>'+e(a.grade)+'</b> · '+a.pts+' clinical points'+why+(a.gain?' · <b>+'+a.gain+'</b> to your total':' · your best on this case stays')+'</div>';
}
function standingHtml(){
  var st=standing(); if(!st.runs) return '';
  var r=st.rank, prog=r.next?Math.round(100*(st.total-r.at)/(r.next.at-r.at)):100;
  var sp=st.bySpec.filter(function(x){ return x.played; }).sort(function(a,b){ return a.avg-b.avg; }).slice(0,4);
  return '<div class="cs-panel"><div class="cs-top"><b>'+e(r.name)+' · '+st.total+' clinical points</b><span class="cs-meta">'+(r.next?(r.next.at-st.total)+' to '+e(r.next.name):'Top rank')+'</span></div>'+
    '<div class="cs-bar" style="margin:8px 0"><i style="width:'+prog+'%"></i></div>'+
    '<div class="cs-meta">Safe streak: '+st.safeStreak+' case'+(st.safeStreak===1?'':'s')+' without a dangerous decision'+(st.unsafe?' · '+st.unsafe+' unsafe so far':'')+'</div>'+
    (sp.length?'<div class="cs-doms" style="margin-top:10px">'+sp.map(function(x){ return '<div class="cs-dom"><span class="cs-meta">'+e(x.spec)+' · '+x.played+' of '+x.cases+' cases</span><b>'+x.avg+'%</b><div class="cs-bar"><i style="width:'+x.avg+'%"></i></div></div>'; }).join('')+'</div>':'')+'</div>';
}
function ctxNote(ctx){
  if(ctx==='topic') return '<div class="cs-meta" style="margin-top:4px">📖 Topic practice: the diagnosis is not marked, the rest is.</div>';
  if(ctx==='blind') return '<div class="cs-meta" style="margin-top:4px">🎲 Mixed ward round: work out the diagnosis yourself. Worth 30% more points.</div>';
  return '';
}

/* ---------- 🎲 Mixed ward round: cases from across the course (plus one from outside it), with no topic
 * or specialty shown, so the diagnosis is tested properly. */
var ROUND_SEED=0;
function seeded(n){ var x=Math.sin(n*9301+49297)*233280; return x-Math.floor(x); }
function roundItems(course, seed, n){
  n=n||5; var all=catalogue().filter(function(it){ return !it.tutorial && (it.kind!=='daily' || it.source==='mine'); });
  var mix=function(list, s){ return list.map(function(it, i){ return { it:it, r:seeded(s*131+i+1) }; }).sort(function(a,b){ return a.r-b.r; }).map(function(x){ return x.it; }); };
  var seen={}, uniq=function(it){ var k=it.title.toLowerCase(); if(seen[k]) return false; seen[k]=1; return true; };
  var inC=mix(all.filter(function(it){ return inCourse(it, course); }), seed).filter(uniq);
  var out=inC.slice(0, course ? n-1 : n);
  if(course){ var other=mix(all.filter(function(it){ return !inCourse(it, course); }), seed+7).filter(uniq); if(other.length) out.push(other[0]); else if(inC[n-1]) out.push(inC[n-1]); }
  return mix(out, seed+3);
}
function roundBtn(course){ return '<div class="btnrow" style="margin:4px 0 8px"><a class="btn" href="#/clinsim/round">🎲 Mixed ward round'+(course?' for '+e(course.name):'')+': diagnosis hidden</a></div>'; }
function roundPage(){
  var course=curCourse(), items=roundItems(course, dayNo()+ROUND_SEED, 5);
  var h='<a href="#/clinsim" class="cs-back">← Clinical Simulation</a><h1>🎲 Mixed ward round</h1><p class="cs-sub">'+(items.length===1?'One patient':items.length+' patients')+(course?' from '+e(course.name)+', with one from another specialty mixed in,':'')+' and no topic shown. Work out what each one has. Every case here is worth 30% more points.</p>';
  if(!items.length) return h+'<div class="cs-panel">No cases yet. Import a clinical lecture or pick a specialty.</div>';
  return h+'<div class="cs-grid">'+items.map(function(it, i){ return caseCard(it, 'blind', 'Patient '+(i+1)); }).join('')+'</div>'+
    '<div class="btnrow" style="margin-top:14px"><button class="btn" onclick="MB_CLINSIM.newRound()">🔀 New round</button></div>';
}

/* ---------- free rotation: one built-in station and one quick case a week for unpaid students */
function weekNo(){ return Math.floor((Date.now()+3600e3)/(7*864e5)); }
function dayNo(){ return Math.floor((Date.now()+3600e3)/864e5); }   // Lagos days (UTC+1)
function dayKey(n){ return new Date((n==null?dayNo():n)*864e5).toISOString().slice(0,10); }
function isFree(list, item){ if(item.source==='mine' || entitled()) return true; var b=list.filter(function(x){ return x.source==='builtin'; }); return b.length && b[weekNo()%b.length].id===item.id; }
function locked(){ if(root.MB_PAYWALL&&root.MB_PAYWALL.nudge) root.MB_PAYWALL.nudge('Unlock every case','This week\'s free case and Case of the Day stay open. Subscribe to play every station and quick case. Cases from your own lectures are always yours.','Subscribe'); else if(root.mbToast) root.mbToast('Subscribe to unlock every case.'); }

/* ---------- styles */
function css(){
  if(document.getElementById('csCss')) return;
  var st=document.createElement('style'); st.id='csCss';
  st.textContent=[
  '.cs-sub{color:var(--dim);margin:4px 0 0;line-height:1.5}',
  '.cs-grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(280px,1fr));gap:12px;margin-top:14px}',
  '.cs-card{background:var(--card);border:1px solid var(--line);border-radius:14px;padding:14px;display:flex;flex-direction:column;gap:8px;text-align:left;font:inherit;color:var(--text)}',
  'button.cs-card{cursor:pointer}button.cs-card:hover,button.cs-card:focus-visible{border-color:var(--accent)}',
  '.cs-card h3{margin:0;font-size:16px;line-height:1.3}',
  '.cs-ic{font-size:22px;line-height:1}',
  '.cs-meta{font-size:12.5px;color:var(--dim);line-height:1.45}',
  '.cs-subs{display:flex;flex-wrap:wrap;gap:6px;margin-top:2px}',
  '.cs-chip{border:1px solid var(--line);background:var(--panel);color:var(--text);border-radius:999px;padding:6px 11px;font:inherit;font-size:13px;cursor:pointer;text-decoration:none}',
  '.cs-chip:hover,.cs-chip:focus-visible{border-color:var(--accent)}',
  '.cs-chip[aria-pressed="true"]{background:var(--accent);color:#fff;border-color:var(--accent)}',
  '.cs-tag{display:inline-block;font-size:11px;font-weight:700;padding:2px 8px;border-radius:999px;background:var(--panel2);color:var(--accent);margin-right:6px}',
  '.cs-tag.free{background:#e6f6f3;color:#0f766e}.cs-tag.lock{background:var(--panel2);color:var(--dim)}',
  'html[data-theme="dark"] .cs-tag.free{background:#0f2e2a;color:#5eead4}',
  '.cs-best{font-size:12px;font-weight:700;color:var(--recall-tx)}',
  '.cs-panel{background:var(--card);border:1px solid var(--line);border-radius:14px;padding:14px;margin-top:12px}',
  '.cs-panel h4{margin:12px 0 8px;font-size:12px;letter-spacing:.06em;text-transform:uppercase;color:var(--dim)}',
  '.cs-panel h4:first-child{margin-top:0}',
  '.cs-top{display:flex;justify-content:space-between;align-items:center;gap:8px;flex-wrap:wrap}',
  '.cs-clock{font-variant-numeric:tabular-nums;font-weight:800;background:var(--panel2);border-radius:8px;padding:4px 10px;font-size:15px}',
  '.cs-clock.low{background:var(--warnbg);color:var(--warntx)}',
  '.cs-chat{display:flex;flex-direction:column;gap:8px;max-height:380px;overflow:auto;padding:2px}',
  '.cs-msg{max-width:88%;padding:8px 11px;border-radius:12px;font-size:14px;line-height:1.45}',
  '.cs-msg.me{align-self:flex-end;background:var(--accent);color:#fff;border-bottom-right-radius:4px}',
  '.cs-msg.pt{align-self:flex-start;background:var(--panel2);border-bottom-left-radius:4px}',
  '.cs-msg.sys{align-self:center;font-size:12.5px;color:var(--dim);background:none}',
  '.cs-ask{display:flex;gap:6px;margin-top:10px}',
  '.cs-ask input{flex:1;min-width:0;border:1px solid var(--line);border-radius:10px;padding:10px;font:inherit;font-size:14px;background:var(--panel);color:var(--text)}',
  '.cs-opts{display:grid;gap:8px}',
  '.cs-opt{text-align:left;border:1px solid var(--line);background:var(--panel);color:var(--text);border-radius:10px;padding:11px 12px;font:inherit;font-size:14px;cursor:pointer;line-height:1.4}',
  '.cs-opt:hover:not(:disabled),.cs-opt:focus-visible{border-color:var(--accent)}',
  '.cs-opt:disabled{cursor:default}',
  '.cs-opt.best{border-color:var(--recall-tx);background:var(--panel2)}',
  '.cs-opt.bad{border-color:var(--badtx)}',
  '.cs-opt.picked{outline:2px solid var(--accent)}',
  '.cs-opt small{display:block;color:var(--dim);font-size:12.5px;margin-top:4px}',
  '.cs-reveal{margin-top:10px;font-size:14px;line-height:1.5;padding:9px 11px;border-left:3px solid var(--accent);background:var(--panel2);border-radius:0 8px 8px 0}',
  '.cs-danger{margin-top:10px;font-size:14px;padding:9px 11px;border-radius:10px;background:var(--warnbg);border:1px solid var(--warnline);color:var(--warntx);font-weight:700}',
  '.cs-score{display:flex;align-items:center;gap:16px;flex-wrap:wrap}',
  '.cs-ring{width:92px;height:92px;border-radius:50%;display:grid;place-items:center;font-size:24px;font-weight:800}',
  '.cs-doms{display:grid;grid-template-columns:repeat(auto-fill,minmax(180px,1fr));gap:8px;margin-top:10px}',
  '.cs-dom{border:1px solid var(--line);border-radius:12px;padding:10px}',
  '.cs-dom b{display:block;font-size:22px;font-variant-numeric:tabular-nums}',
  '.cs-bar{height:6px;border-radius:3px;background:var(--panel2);margin-top:6px;overflow:hidden}.cs-bar i{display:block;height:100%;background:var(--accent)}',
  '.cs-list{list-style:none;padding:0;margin:0}',
  '.cs-list li{display:flex;gap:10px;padding:8px 0;border-bottom:1px solid var(--line);font-size:14px;line-height:1.4}',
  '.cs-list label{display:flex;gap:10px;align-items:flex-start;cursor:pointer;width:100%}',
  '.cs-teach li{margin-bottom:6px;font-size:14px;line-height:1.5}',
  '.cs-clues{list-style:none;padding:0;margin:0;counter-reset:c}',
  '.cs-clues li{counter-increment:c;padding:9px 10px 9px 38px;position:relative;border:1px solid var(--line);border-radius:10px;margin-bottom:6px;font-size:14.5px}',
  '.cs-clues li::before{content:counter(c);position:absolute;left:10px;top:8px;width:20px;height:20px;border-radius:50%;background:var(--accent);color:#fff;font-size:12px;font-weight:800;display:grid;place-items:center}',
  '.cs-clues li.hid{color:var(--dim);background:var(--panel2)}',
  '.cs-squares{font-size:22px;letter-spacing:2px}',
  '.cs-note{font-size:12.5px;color:var(--dim);margin-top:14px;line-height:1.5}',
  '.cs-back{font-size:13px;color:var(--dim);text-decoration:none}',
  '.cs-h{margin:22px 0 8px;font-size:12px;letter-spacing:.06em;text-transform:uppercase;color:var(--dim)}',
  'a.cs-card:hover,a.cs-card:focus-visible{border-color:var(--accent)}',
  '@media (max-width:520px){.cs-grid{grid-template-columns:1fr}}'
  ].join('\n');
  document.head.appendChild(st);
}

/* ---------- the hub */
var MODES=[
  { id:'er', ic:'🚑', name:'Emergency Room', blurb:'You are the doctor on duty. The patient gets better or worse with what you do and how fast.',
    subs:[['tut','Tutorial'],['phc','Primary Health Centre'],['gh','General Hospital'],['th','Teaching Hospital']] },
  { id:'osce', ic:'🩺', name:'OSCE Stations', blurb:'Take a history from an AI patient in 8 minutes, then get marked like a real OSCE examiner would.',
    subs:[['timed','Timed station'],['practice','Practice with prompts'],['mine','From my lectures']] },
  { id:'quick', ic:'⚡', name:'Quick Cases', blurb:'Short cases you finish in 5 minutes. One dangerous decision costs more than several small misses.',
    subs:[['builtin','MedBank cases'],['mine','From my lectures']] },
  { id:'daily', ic:'📅', name:'Case of the Day', blurb:'One mystery patient a day for everyone. Six clues, six guesses. Share your result.',
    subs:[['today','Today\'s case'],['archive','Past days'],['mine','From my lectures']] },
  { id:'duel', ic:'⚔️', name:'Duel', blurb:'Two phones side by side, same patient, same clock. Leave the app and you lose.',
    subs:[['home','Start or join a duel']] },
  { id:'group', ic:'👥', name:'Study Group OSCE', blurb:'Practise with friends on one phone: one plays the patient, one examines, one is the candidate.',
    subs:[['pick','Pick a station']] },
  { id:'mine', ic:'📚', name:'My Lecture Cases', blurb:'Every lecture you import gets its own patients, stations and puzzles, built from your note.',
    subs:[['all','See my cases']] }
];
function hub(){
  var course=curCourse(), courses=myCourses(), sel=courseSel(), runs=store().runs, all=catalogue();
  var h='<h1>🏥 Clinical Simulation</h1><p class="cs-sub">Pick your course, then a topic. Every kind of case for that topic sits together.</p>'+
    '<div class="cs-meta" style="margin-top:6px">'+level()+' level · '+runs.length+' case'+(runs.length===1?'':'s')+' played</div>'+standingHtml();
  // 1 · your course
  var covered={}; courses.forEach(function(c){ if(c.spec) covered[c.spec]=1; });
  var extra=['Medicine','Surgery','Paediatrics','Obstetrics & Gynaecology','Community Health'].filter(function(sp){ return !covered[sp]; });
  h+='<h4 class="cs-h">1 · Your course</h4><div class="cs-subs" role="group" aria-label="Course">'+
    '<button class="cs-chip" aria-pressed="'+(sel==='all')+'" onclick="MB_CLINSIM.course(\'all\')">All courses</button>'+
    courses.map(function(c){ return '<button class="cs-chip" aria-pressed="'+(sel===c.id)+'" onclick="MB_CLINSIM.course(\''+e(c.id)+'\')">'+e(c.name)+'</button>'; }).join('')+
    extra.map(function(sp){ return '<button class="cs-chip" aria-pressed="'+(sel==='spec:'+sp)+'" onclick="MB_CLINSIM.course(\'spec:'+e(sp)+'\')">'+e(sp)+'</button>'; }).join('')+'</div>';
  if(!courses.length) h+='<div class="cs-meta" style="margin-top:6px">Your imported courses appear here. Until then, pick a specialty.</div>';
  // Up next
  var nx=upNext(course, 3);
  if(nx.length) h+='<h4 class="cs-h">Up next for you</h4><div class="cs-meta">Cases you haven\'t played'+(course?' in '+e(course.name):'')+', from the area where your scores are lowest.</div><div class="cs-grid">'+nx.map(function(it){ return caseCard(it); }).join('')+'</div>';
  // search
  h+='<div class="cs-ask" style="margin-top:16px"><input id="csSearch" type="search" autocomplete="off" placeholder="Search cases: malaria, jaundice, trauma…" aria-label="Search cases" oninput="MB_CLINSIM.search(this.value)" value="'+e(SEARCH)+'"></div><div id="csResults">'+searchHtml(SEARCH)+'</div>';
  // 2 · topics
  h+='<h4 class="cs-h">2 · Topics'+(course?' in '+e(course.name):'')+'</h4>';
  if(!course){
    h+=roundBtn(null);
    if(!courses.length) h+='<div class="cs-panel">Pick a course above to see its topics and cases.</div>';
    else h+='<div class="cs-grid">'+courses.map(function(c){ var n=all.filter(function(it){ return inCourse(it,c); }).length, tn=myTopics().filter(function(t){ return t.subject&&t.subject.id===c.id; }).length;
      return '<button class="cs-card" onclick="MB_CLINSIM.course(\''+e(c.id)+'\')"><h3>'+e(c.name)+'</h3><div class="cs-meta">'+tn+' lecture'+(tn===1?'':'s')+' · '+n+' case'+(n===1?'':'s')+(c.spec?' · '+e(c.spec):'')+'</div></button>'; }).join('')+'</div>';
  } else {
    var shown={};
    var tps=myTopics().filter(function(t){ return t.subject && t.subject.id===course.id; });
    tps.forEach(function(t){
      var items=all.filter(function(it){ return it.kind!=='daily' && !it.tutorial; }).filter(function(it){ return it.source==='mine' ? it.topicId===t.id : topicHit(it, t.name); });
      items.forEach(function(it){ shown[it.kind+it.id]=1; });
      var p=pack(t);
      h+='<div class="cs-panel"><div class="cs-top"><b>'+e(t.name)+'</b><span class="cs-meta">'+items.length+' case'+(items.length===1?'':'s')+'</span></div>'+
        (items.length?'<div class="cs-grid">'+items.map(function(it){ return caseCard(it, 'topic'); }).join('')+'</div>':'')+
        (!packCount(p) && !(p&&p.none) ? '<div class="btnrow" style="margin-top:10px"><button class="btn" '+(BUILDING[t.id]?'disabled':'')+' onclick="MB_CLINSIM.build(\''+e(t.id)+'\')">'+(BUILDING[t.id]?'Building cases… about 30 s':'✨ Build cases from this lecture')+'</button></div>' : '')+'</div>';
    });
    if(tps.length) h+='<div class="cs-meta" style="margin:-4px 0 10px">You know the condition from the topic, so these cases test history, management and look-alikes, not the diagnosis. To be tested on the diagnosis, play a mixed ward round.</div>';
    var core=all.filter(function(it){ return it.source==='builtin' && it.kind!=='daily' && !it.tutorial && inCourse(it, course) && !shown[it.kind+it.id]; });
    if(core.length) h+='<div class="cs-panel"><div class="cs-top"><b>Core '+e(course.spec||course.name)+' cases</b><span class="cs-meta">'+core.length+' case'+(core.length===1?'':'s')+'</span></div><div class="cs-grid">'+core.map(function(it){ return caseCard(it); }).join('')+'</div></div>';
    if(!tps.length && !core.length) h+='<div class="cs-panel">No cases for this course yet. Import a clinical lecture and MedBank builds cases from it.</div>';
    else h+=roundBtn(course);
  }
  // 3 · practise by mode
  h+='<h4 class="cs-h">3 · Or practise by mode</h4><div class="cs-grid">';
  MODES.forEach(function(m){
    h+='<div class="cs-card"><div class="cs-ic" aria-hidden="true">'+m.ic+'</div><h3>'+e(m.name)+'</h3><div class="cs-meta">'+e(m.blurb)+'</div><div class="cs-subs">'+
      m.subs.map(function(s){ return '<a class="cs-chip" href="#/clinsim/'+m.id+'/'+s[0]+'">'+e(s[1])+'</a>'; }).join('')+'</div></div>';
  });
  h+='</div><p class="cs-note">All patients are fictional. This is practice, not a clinical guideline. Check doses and protocols against your hospital and national guidelines. Cases built from your lectures are made by AI: most come from your note, and about a third (marked 📘 General topic case) cover the topic as it is generally taught. Check them against what your lecturer taught.</p>';
  return h;
}
var SEARCH='';
function searchHtml(q){
  var x=normW(q).trim(); if(x.length<2) return '';
  var hits=catalogue().filter(function(it){ return it.kind!=='daily' && normW(it.title+' '+it.words+' '+(it.spec||[]).join(' ')).indexOf(x)>=0; }).slice(0,12);
  return hits.length ? '<div class="cs-grid">'+hits.map(function(it){ return caseCard(it); }).join('')+'</div>' : '<div class="cs-meta" style="margin-top:8px">No cases match "'+e(q)+'" yet.</div>';
}
function courseBar(){
  var c=curCourse(); if(!c) return '';
  return '<div class="cs-meta" style="margin-top:8px">Showing <b>'+e(c.name)+'</b> cases · <a href="javascript:void 0" onclick="MB_CLINSIM.course(\'all\');return false">show all</a></div>';
}
function modeHead(mid, sub){
  var m=MODES.filter(function(x){ return x.id===mid; })[0];
  return '<a href="#/clinsim" class="cs-back">← Clinical Simulation</a><h1>'+m.ic+' '+e(m.name)+'</h1>'+
    (m.subs.length>1?'<div class="cs-subs" role="group" aria-label="Sub-mode">'+m.subs.map(function(s){ return '<a class="cs-chip" aria-pressed="'+(s[0]===sub)+'" href="#/clinsim/'+m.id+'/'+s[0]+'">'+e(s[1])+'</a>'; }).join('')+'</div>':'')+
    (mid!=='mine'&&!(mid==='daily'&&sub!=='mine')?courseBar():'');
}
function emptyMine(what){ return '<div class="cs-panel">No '+what+' from your lectures yet. Import a clinical lecture and MedBank builds them for you, or open <a href="#/clinsim/mine/all">My Lecture Cases</a> to build them for lectures you already have.</div>'; }

/* ---------- 🚑 Emergency Room (ER Sim lives in er-sim.js) */
function erMode(sub){
  var E=engine(), cc=curCourse(); var list=erCases().filter(function(c){ return sub==='tut' ? c.tutorial : (!c.tutorial && c.setting===sub && inCourse({ spec:erTags(c).spec, source:'builtin' }, cc)); });
  var h=modeHead('er', sub)+'<p class="cs-sub">'+(sub==='tut'?'A guided first case: hints show you the next step.':e(((E&&E.SETTINGS[sub])||{}).label||'')+': only what that facility has is available.')+'</p><div class="cs-grid">';
  list.forEach(function(c){
    var runs=(typeof DATA!=='undefined'&&DATA.ersim&&DATA.ersim.runs)||[], b=null; runs.forEach(function(r){ if(r.caseId===c.id&&(b===null||r.pct>b)) b=r.pct; });
    h+='<a class="cs-card" style="text-decoration:none" href="#/ersim/'+e(c.id)+'"><div><span class="cs-tag">'+e(c.level||'')+'</span></div><h3>'+e(c.title)+'</h3><div class="cs-meta">'+e(c.patient.name)+', '+e(c.patient.age)+' '+e(c.patient.sex)+'</div>'+(b!==null?'<div class="cs-best">Best: '+b+'%</div>':'<div class="cs-meta">Not played yet</div>')+'</a>';
  });
  if(!list.length) h+='<div class="cs-panel">No cases here yet.</div>';
  return h+'</div>';
}

/* ---------- 🩺 OSCE stations */
var OS=null, TIMER=null;
function osceList(sub){
  var cc=curCourse(), list=stations(sub==='mine'?'mine':'builtin').filter(function(s){ return inCourse(s, cc); });
  var h=modeHead('osce', sub)+'<p class="cs-sub">'+(sub==='practice'?'No clock. The questions an examiner expects are shown as prompts.':sub==='mine'?'Stations built from your own lectures. Timed, 8 minutes.':'8 minutes. Greet the patient, take the history, then give your diagnosis and plan.')+'</p>';
  if(sub==='mine' && !list.length) return h+emptyMine('stations');
  h+='<div class="cs-grid">';
  var all=stations('all');
  list.forEach(function(s){
    var free=isFree(all, s), b=best('osce', s.id), mode=sub==='practice'?'practice':'timed';
    h+='<button class="cs-card" onclick="MB_CLINSIM.'+(free?'openOsce(\''+e(s.id)+'\',\''+mode+'\')':'locked()')+'">'+
      '<div>'+(s.source==='mine'?'<span class="cs-tag">'+e(s.courseName||'Your lecture')+'</span>'+(s.basis==='general'?'<span class="cs-tag">📘 General topic case</span>':''):'<span class="cs-tag">'+e(s.area)+'</span>')+(!entitled()&&s.source==='builtin'?(free?'<span class="cs-tag free">Free this week</span>':'<span class="cs-tag lock">🔒 Subscribe</span>'):'')+'</div>'+
      '<h3>'+e(s.title)+'</h3><div class="cs-meta">'+e(s.patient.name)+', '+e(s.patient.age)+' '+e(s.patient.sex)+(s.speaker&&!/patient/i.test(s.speaker)?' · you speak with '+e(s.speaker):'')+'</div>'+
      (b!==null?'<div class="cs-best">Best: '+b+'%</div>':'<div class="cs-meta">Not played yet</div>')+'</button>';
  });
  return h+'</div>';
}
function forCtx(s, ctx){ return ctx==='topic' ? Object.assign({}, s, { dx:s.form||null, dxGiven:true }) : s; }
function osceStart(id, mode, ctx){
  var s=byId(stations('all'), id); if(!s) return false; ctx=ctx||'open';
  OS={ s:forCtx(s, ctx), ctx:ctx, mode:mode, chat:[{ who:'sys', text:'You are the doctor. '+s.patient.name+' ('+s.patient.age+', '+s.patient.sex+') is waiting. Start by greeting them.' }],
       said:[], asked:{}, phase:'talk', endsAt: mode==='timed' ? Date.now()+OSCE_MIN*60e3 : null, dx:null, plan:null, busy:false };
  return true;
}
function clockText(){ if(!OS||!OS.endsAt) return ''; var ms=Math.max(0,OS.endsAt-Date.now()), m=Math.floor(ms/60e3), s=Math.floor(ms%60e3/1e3); return m+':'+(s<10?'0':'')+s; }
function startTimer(){
  stopTimer();
  TIMER=setInterval(function(){
    var el=document.getElementById('csClock'); if(!OS||OS.phase!=='talk'||!OS.endsAt){ stopTimer(); return; }
    if(!el){ stopTimer(); return; }   // left the page
    el.textContent=clockText(); if(OS.endsAt-Date.now()<60e3) el.classList.add('low');
    if(Date.now()>=OS.endsAt){ OS.phase='present'; OS.chat.push({ who:'sys', text:'Time is up. Present your findings.' }); stopTimer(); draw(); }
  }, 1000);
}
function stopTimer(){ if(TIMER){ clearInterval(TIMER); TIMER=null; } }
function osceTalk(){
  var s=OS.s, timed=!!OS.endsAt;
  var h='<a href="#/clinsim/osce/'+(OS.mode==='practice'?'practice':(s.source==='mine'?'mine':'timed'))+'" class="cs-back" onclick="MB_CLINSIM.stop()">← Stations</a>'+
    '<div class="cs-top"><h1 style="margin:6px 0">'+e(s.title)+'</h1>'+(timed?'<span class="cs-clock" id="csClock" aria-live="off">'+clockText()+'</span>':'<span class="cs-meta">Practice: no clock</span>')+'</div>'+
    '<div class="cs-meta">'+e(s.patient.name)+', '+e(s.patient.age)+' '+e(s.patient.sex)+(s.speaker&&!/^the patient$/i.test(s.speaker)?' · speaking: '+e(s.speaker):'')+'</div>'+ctxNote(OS.ctx)+
    '<div class="cs-panel"><div class="cs-chat" id="csChat" aria-live="polite">'+OS.chat.map(function(m){ return '<div class="cs-msg '+m.who+'">'+e(m.text)+'</div>'; }).join('')+(OS.busy?'<div class="cs-msg pt">…</div>':'')+'</div>'+
    '<form class="cs-ask" onsubmit="MB_CLINSIM.say();return false"><input id="csQ" autocomplete="off" placeholder="Speak to '+e(s.speaker&&!/^the patient$/i.test(s.speaker)?s.speaker:s.patient.name.split(' ')[0])+'…" aria-label="What you say"'+(OS.busy?' disabled':'')+'><button class="btn primary"'+(OS.busy?' disabled':'')+'>Say</button></form>'+
    '<div class="btnrow" style="margin-top:10px"><button class="btn" onclick="MB_CLINSIM.present()">I\'m ready to present</button></div></div>';
  if(OS.mode==='practice'){
    h+='<div class="cs-panel"><h4>Prompts</h4><div class="cs-subs">'+s.history.filter(function(x){ return x.key; }).map(function(x){ var got=OS.asked[x.id]!==undefined; return '<span class="cs-chip" style="'+(got?'opacity:.5;text-decoration:line-through':'')+'">'+e(x.q)+'</span>'; }).join('')+'</div>'+
      '<div class="cs-meta" style="margin-top:8px">Also: introduce yourself, confirm who you are speaking to, ask permission, explore their worries, summarise, and ask if they have questions.</div></div>';
  }
  return h;
}
function oscePresent(){
  var s=OS.s;
  function q(name, block, val){ if(!block) return ''; return '<h4>'+e(block.q)+'</h4><div class="cs-opts">'+block.options.map(function(o,i){ return '<button class="cs-opt'+(val===i?' picked':'')+'" onclick="MB_CLINSIM.pick(\''+name+'\','+i+')">'+e(o)+'</button>'; }).join('')+'</div>'; }
  return '<h1>'+e(s.title)+'</h1><p class="cs-sub">The examiner asks you to present.'+(s.dxGiven?' You picked this from its topic, so you are not asked to name the diagnosis.':'')+'</p><div class="cs-panel">'+q('dx', s.dx, OS.dx)+q('plan', s.plan, OS.plan)+
    '<div class="btnrow" style="margin-top:14px"><button class="btn primary" onclick="MB_CLINSIM.mark()"'+((s.dx&&OS.dx===null)||(s.plan&&OS.plan===null)?' disabled':'')+'>Finish the station</button>'+(OS.endsAt&&Date.now()<OS.endsAt?'<button class="btn" onclick="MB_CLINSIM.back()">Back to the patient</button>':'')+'</div></div>';
}
// Interpersonal skills, checked from what the student actually said.
var IP=[
  { id:'intro', label:'Introduced yourself', re:/\b(my name is|i am (dr|doctor)|i'?m (dr|doctor)|i am a (doctor|medical student|student)|i'?m a (doctor|medical student|student))\b/i },
  { id:'ident', label:'Confirmed who you were speaking to', re:/\b(your name|what is your name|what'?s your name|how old|your age|are you (his|her|the) (mother|father|wife|husband))\b/i },
  { id:'consent', label:'Asked permission to talk or examine', re:/\b(is it (ok|okay|alright)|may i|can i (ask|talk|speak)|do you mind|would you (mind|like)|permission|consent)\b/i },
  { id:'open', label:'Opened with an open question', test:function(said){ return said.slice(0,3).some(function(t){ return /\b(what (brings|brought|happened|seems|is the (problem|matter))|how can i help|tell me (about|more|what))\b/i.test(t); }); } },   // in the first three things said
  { id:'ice', label:'Explored their worries and expectations', re:/\b(worr|concern|afraid|expect|hoping|what do you think|any idea what)\w*/i },
  { id:'sum', label:'Summarised back to them', re:/\b(summar|to recap|let me (check|recap)|so far you|you (said|told me)|so you have)\w*/i },
  { id:'close', label:'Checked for questions before closing', re:/\b(any (questions|other (questions|concerns))|anything else|is there anything)\b/i }
];
function osceScore(o, ticks){
  var s=o.s, key=s.history.filter(function(x){ return x.key; }), other=s.history.filter(function(x){ return !x.key; });
  var got=ticks?key.filter(function(x){ return ticks.h[x.id]; }):key.filter(function(x){ return o.asked[x.id]!==undefined; });
  var gotO=ticks?other.filter(function(x){ return ticks.h[x.id]; }):other.filter(function(x){ return o.asked[x.id]!==undefined; });
  var data=Math.min(100, Math.round(100*(got.length + 0.25*gotO.length)/Math.max(1,key.length)));
  var mg=0, mgN=0;
  if(s.dx){ mgN++; if((ticks?ticks.dx:o.dx)===s.dx.correct) mg++; }
  if(s.plan){ mgN++; if((ticks?ticks.plan:o.plan)===s.plan.correct) mg++; }
  var mgmt=mgN?Math.round(100*mg/mgN):0;
  var ipItems=IP.map(function(it){ var ok=ticks?!!ticks.ip[it.id]:(it.test?it.test(o.said):o.said.some(function(t){ return it.re.test(t); })); return { label:it.label, ok:ok }; });
  var ip=Math.round(100*ipItems.filter(function(x){ return x.ok; }).length/ipItems.length);
  var total=Math.round(0.5*data+0.3*mgmt+0.2*ip);
  var pass=total>=60 && data>=40 && mgmt>=40 && ip>=40;
  return { total:total, pass:pass, data:data, mgmt:mgmt, ip:ip, ipItems:ipItems, missed:key.filter(function(x){ return got.indexOf(x)<0; }).map(function(x){ return x.q; }), got:got.length, keyN:key.length };
}
function domainsHtml(sc){
  function d(label, v, w){ return '<div class="cs-dom"><span class="cs-meta">'+label+' · '+w+'% of the mark</span><b>'+v+'%</b><div class="cs-bar"><i style="width:'+v+'%"></i></div></div>'; }
  return '<div class="cs-doms">'+d('Data gathering', sc.data, 50)+d('Clinical management', sc.mgmt, 30)+d('Interpersonal skills', sc.ip, 20)+'</div>';
}
function resultHtml(s, sc, opts){
  var col=sc.pass?'var(--recall-tx)':'var(--badtx)';
  var h='<div class="cs-panel"><div class="cs-score"><div class="cs-ring" style="border:8px solid '+col+';color:'+col+'">'+sc.total+'%</div><div><div style="font-size:22px;font-weight:800;color:'+col+'">'+(sc.pass?'PASS':'FAIL')+'</div>'+
    '<div class="cs-meta">Key history: '+sc.got+' of '+sc.keyN+(opts&&opts.time?' · '+opts.time:'')+'</div><div class="cs-meta">Pass mark 60%, with at least 40% in every part.</div></div></div>'+domainsHtml(sc)+'</div>';
  h+='<div class="cs-panel"><h4>Data gathering</h4>'+(sc.missed.length?'<div class="cs-meta">You missed:</div><ul class="cs-teach">'+sc.missed.map(function(m){ return '<li>'+e(m)+'</li>'; }).join('')+'</ul>':'<div>You covered every key question.</div>')+
    '<h4>Clinical management</h4><ul class="cs-list">'+[['dx',s.dx],['plan',s.plan]].filter(function(x){ return x[1]; }).map(function(x){ var b=x[1], pick=opts.picks[x[0]]; var ok=pick===b.correct;
      return '<li><span aria-hidden="true">'+(ok?'✅':'❌')+'</span><span>'+e(b.q)+'<span class="cs-meta" style="display:block">'+(ok?'Correct: ':'You said '+e(b.options[pick]||'nothing')+'. Best: ')+e(b.options[b.correct])+'</span></span></li>'; }).join('')+'</ul>'+
    '<h4>Interpersonal skills</h4><ul class="cs-list">'+sc.ipItems.map(function(i){ return '<li><span aria-hidden="true">'+(i.ok?'✅':'❌')+'</span><span>'+e(i.label)+'</span></li>'; }).join('')+'</ul></div>';
  if((s.teaching||[]).length) h+='<div class="cs-panel"><h4>Learning points</h4><ul class="cs-teach">'+s.teaching.map(function(t){ return '<li>'+e(t)+'</li>'; }).join('')+'</ul></div>';
  return h;
}
function osceResult(){
  var s=OS.s, sc=OS.score;
  var h='<h1>Station result: '+e(s.title)+'</h1>'+pointsLine(OS.pts)+resultHtml(s, sc, { picks:{ dx:OS.dx, plan:OS.plan }, time:OS.endsAt?OSCE_MIN+'-minute station':'practice' });
  h+='<div class="cs-panel"><h4>Your conversation</h4><div class="cs-chat">'+OS.chat.map(function(m){ return '<div class="cs-msg '+m.who+'">'+e(m.text)+'</div>'; }).join('')+'</div></div>';
  h+='<div class="btnrow" style="margin-top:14px"><button class="btn primary" onclick="MB_CLINSIM.openOsce(\''+e(s.id)+'\',\''+OS.mode+'\',\''+OS.ctx+'\')">Try again</button><button class="btn" onclick="location.hash=\'#/clinsim/osce/'+(s.source==='mine'?'mine':OS.mode)+'\'">Other stations</button></div>';
  return h;
}
async function token(){ try{ if(!root.__mbSB) return null; var s=await root.__mbSB.auth.getSession(); return s&&s.data&&s.data.session?s.data.session.access_token:null; }catch(_){ return null; } }
function localMatch(s, text){ var E=engine(); if(!E) return null; return E.matchHistory({ history:s.history }, text); }
async function say(){
  var inp=document.getElementById('csQ'); var q=(inp&&inp.value||'').trim(); if(!q||!OS||OS.busy||OS.phase!=='talk') return;
  var s=OS.s; OS.chat.push({ who:'me', text:q }); OS.said.push(q); OS.busy=true; draw();
  var reply=null, about=[];
  var social=/^(hi|hello|good (morning|afternoon|evening|day)|my name is|i am (dr|doctor)|i'?m (dr|doctor))/i.test(q) && q.split(/\s+/).length<14 && !/\?/.test(q.replace(/how are you\??/i,''));
  if(social && OS.said.length<=2){ reply=s.opening||'Good day, doctor.'; }
  else {
    try{
      var C=cfg(), tok=await token();
      if(C.IMPORT_API && tok){
        var r=await fetch(C.IMPORT_API.replace(/\/$/,'')+'/ersim/patient',{ method:'POST', headers:{'Content-Type':'application/json','Authorization':'Bearer '+tok},
          body:JSON.stringify({ case_id:s.id, question:q, speaker:s.speaker, persona:s.persona, patient:s.patient,
            facts:s.history.map(function(h){ return { id:h.id, q:h.q, a:h.a }; }), background:s.background||'', recent:OS.chat.filter(function(m){ return m.who!=='sys'; }).slice(-8,-1) }) });
        var o=null; try{ o=await r.json(); }catch(_){}
        if(r.ok && o && o.reply){ reply=o.reply; about=o.about||[]; }
        else if(r.status===429 && root.mbToast) root.mbToast('You have used today\'s AI patient questions. The patient will answer from the case notes.');
      }
    }catch(_){}
    if(!reply){ var m=localMatch(s, q); if(m){ reply=m.a; about=[m.id]; } else reply='Sorry doctor, I don\'t understand. Can you ask it another way?'; }
  }
  about.forEach(function(id){ if(OS.asked[id]===undefined && s.history.some(function(h){ return h.id===id; })) OS.asked[id]=OS.said.length; });
  OS.chat.push({ who:'pt', text:reply }); OS.busy=false; draw();
  var ch=document.getElementById('csChat'); if(ch) ch.scrollTop=ch.scrollHeight;
  var i2=document.getElementById('csQ'); if(i2) i2.focus();
}
function osceView(){
  if(OS.phase==='result') return osceResult();
  if(OS.phase==='present') return oscePresent();
  return osceTalk();
}

/* ---------- ⚡ Quick cases */
var QS=null;
function quickList(sub){
  var cc=curCourse(), src=sub==='mine'?'mine':'builtin', list=quickCases(src).filter(function(q){ return inCourse(q, cc); }), all=quickCases('all');
  var h=modeHead('quick', sub)+'<p class="cs-sub">3 to 4 decisions, then 3 exam questions. The best choice scores most; a dangerous one sinks the case.</p>';
  if(src==='mine' && !list.length) return h+emptyMine('quick cases');
  h+='<div class="cs-grid">';
  list.forEach(function(q){
    var free=isFree(all, q), b=best('quick', q.id);
    h+='<button class="cs-card" onclick="MB_CLINSIM.'+(free?'openQuick(\''+e(q.id)+'\')':'locked()')+'"><div><span class="cs-tag">'+e(q.area||'')+'</span>'+(!entitled()&&q.source==='builtin'?(free?'<span class="cs-tag free">Free this week</span>':'<span class="cs-tag lock">🔒 Subscribe</span>'):'')+'</div>'+
      '<h3>'+e(q.title)+'</h3><div class="cs-meta">'+e(q.patient.name)+', '+e(q.patient.age)+' '+e(q.patient.sex)+' · '+q.steps.length+' decisions</div>'+(b!==null?'<div class="cs-best">Best: '+b+'%</div>':'<div class="cs-meta">Not played yet</div>')+'</button>';
  });
  return h+'</div>';
}
function quickScore(q, picks){
  var got=0, max=10*q.steps.length, danger=[];
  q.steps.forEach(function(st,i){ var o=st.options[picks[i]]; if(!o) return; got+=o.pts; if(o.pts<=-10) danger.push({ step:st.prompt, t:o.t, why:o.why }); });
  var pct=Math.max(0, Math.min(100, Math.round(100*got/max)));
  var grade=danger.length?'Unsafe: dangerous decision':gradeOf(pct);
  return { pct:pct, grade:grade, danger:danger };
}
function quickView(){
  var q=QS.q, back='<a href="#/clinsim/quick/'+(q.source==='mine'?'mine':'builtin')+'" class="cs-back">← Quick cases</a>';
  var h=back+'<h1>'+e(q.title)+'</h1><div class="cs-meta">'+e(q.patient.name)+', '+e(q.patient.age)+' '+e(q.patient.sex)+(q.source==='mine'&&QS.ctx!=='blind'?(q.basis==='general'?' · a general case on '+e(q.topicName)+', beyond your note':' · from your lecture '+e(q.topicName)):'')+'</div>'+ctxNote(QS.ctx)+
    '<div class="cs-panel"><p style="margin:0;line-height:1.55">'+e(q.stem)+'</p></div>';
  if(QS.phase==='steps'){
    q.steps.forEach(function(st,i){
      if(i>QS.step) return;
      var picked=QS.picks[i], done=picked!==undefined;
      h+='<div class="cs-panel"><h4>Decision '+(i+1)+' of '+q.steps.length+'</h4><div style="font-weight:700;margin-bottom:8px">'+e(st.prompt)+'</div><div class="cs-opts">'+
        order(st.options.length, q.id+'|s'+i+'|'+QS.nonce).map(function(k){ var o=st.options[k]; var cls=done?(o.pts===10?' best':(k===picked&&o.pts<0?' bad':''))+(k===picked?' picked':''):'';
          return '<button class="cs-opt'+cls+'"'+(done?' disabled':' onclick="MB_CLINSIM.choose('+i+','+k+')"')+'>'+e(o.t)+(done&&(k===picked||o.pts===10)?'<small>'+(o.pts>0?'+':'')+o.pts+' · '+e(o.why)+'</small>':'')+'</button>'; }).join('')+'</div>'+
        (done&&st.options[picked].pts<=-10?'<div class="cs-danger">⚠️ Dangerous decision. In real life this could seriously harm the patient.</div>':'')+
        (done&&st.reveal?'<div class="cs-reveal">'+e(st.reveal)+'</div>':'')+'</div>';
    });
    if(QS.picks[QS.step]!==undefined) h+='<div class="btnrow" style="margin-top:12px"><button class="btn primary" onclick="MB_CLINSIM.next()">'+(QS.step+1<q.steps.length?'Next decision':((q.mcqs||[]).length?'On to the exam questions':'See my score'))+'</button></div>';
    return h;
  }
  if(QS.phase==='mcq'){
    var mq=q.mcqs[QS.m], mp=QS.mcq[QS.m], md=mp!==undefined;
    h+='<div class="cs-panel"><h4>Exam question '+(QS.m+1)+' of '+q.mcqs.length+'</h4><div style="font-weight:700;margin-bottom:8px">'+e(mq.stem)+'</div><div class="cs-opts">'+
      order(mq.options.length, q.id+'|m'+QS.m+'|'+QS.nonce).map(function(k){ var x={ t:mq.options[k] }; cls=md?(k===mq.ans?' best':(k===mp?' bad':''))+(k===mp?' picked':''):'';
        return '<button class="cs-opt'+cls+'"'+(md?' disabled':' onclick="MB_CLINSIM.answer('+k+')"')+'>'+e(x.t)+'</button>'; }).join('')+'</div>'+
      (md?'<div class="cs-reveal">'+(mp===mq.ans?'✅ ':'❌ ')+e(mq.why||'')+'</div><div class="btnrow" style="margin-top:12px"><button class="btn primary" onclick="MB_CLINSIM.nextMcq()">'+(QS.m+1<q.mcqs.length?'Next question':'See my score')+'</button></div>':'')+'</div>';
    return h;
  }
  var sc=QS.score, col=sc.danger.length||sc.pct<50?'var(--badtx)':sc.pct<70?'var(--warntx)':'var(--recall-tx)';
  var mcqN=(q.mcqs||[]).length, mcqOk=(q.mcqs||[]).filter(function(m,i){ return QS.mcq[i]===m.ans; }).length;
  h+=pointsLine(QS.pts)+'<div class="cs-panel"><div class="cs-score"><div class="cs-ring" style="border:8px solid '+col+';color:'+col+'">'+sc.pct+'%</div><div><div style="font-size:20px;font-weight:800;color:'+col+'">'+e(sc.grade)+'</div>'+
    (mcqN?'<div class="cs-meta">Exam questions: '+mcqOk+' of '+mcqN+' right</div>':'')+'</div></div>'+
    (sc.danger.length?'<h4>Dangerous decisions</h4><ul class="cs-teach">'+sc.danger.map(function(d){ return '<li><b>'+e(d.t)+'</b>. '+e(d.why)+'</li>'; }).join('')+'</ul>':'')+'</div>';
  if((q.teaching||[]).length) h+='<div class="cs-panel"><h4>Learning points</h4><ul class="cs-teach">'+q.teaching.map(function(t){ return '<li>'+e(t)+'</li>'; }).join('')+'</ul>'+((q.refs||[]).length?'<h4>Further reading</h4><ul class="cs-teach">'+q.refs.map(function(t){ return '<li>'+e(t)+'</li>'; }).join('')+'</ul>':'')+'</div>';
  h+='<div class="btnrow" style="margin-top:14px"><button class="btn primary" onclick="MB_CLINSIM.openQuick(\''+e(q.id)+'\',\''+(QS.ctx||'open')+'\')">Play again</button>'+(q.topicId?'<a class="btn" href="#/topic/'+e(q.topicId)+'">Open the lecture</a>':'')+'<button class="btn" onclick="location.hash=\'#/clinsim/quick/'+(q.source==='mine'?'mine':'builtin')+'\'">Other cases</button></div>';
  return h;
}
function quickDone(){
  var mq=QS.q.mcqs||[], ex={ grade:QS.score.grade, ctx:QS.ctx||'open', unsafe:QS.score.danger.length>0 };
  if(mq.length) ex.mcq=mq.filter(function(m,i){ return QS.mcq[i]===m.ans; }).length;
  QS.pts=award('quick', QS.q.id, QS.score.pct, ex); record('quick', QS.q.id, QS.score.pct, ex);
}
// The order options are shown in. The content keeps the best answer first, so the screen must not:
// a seeded shuffle per case, step and play (nonce), stable while you play, new each time you replay.
function order(n, key){
  var h=2166136261, k=String(key), a=[], i;
  for(i=0;i<k.length;i++){ h^=k.charCodeAt(i); h=Math.imul(h,16777619)>>>0; }
  for(i=0;i<n;i++) a.push(i);
  for(i=n-1;i>0;i--){ h=Math.imul(h^(h>>>15), 2246822519)>>>0; h=(h^(h>>>13))>>>0; var j=h%(i+1), t=a[i]; a[i]=a[j]; a[j]=t; }
  return a;
}
function nonce(){ return Math.random().toString(36).slice(2,8); }

/* ---------- 📅 Case of the Day */
function normA(s){ return String(s||'').toLowerCase().replace(/[^a-z0-9]+/g,' ').replace(/\b(acute|the|a)\b/g,' ').replace(/\s+/g,' ').trim(); }
function lev(a,b){ var m=a.length,n=b.length,d=[],i,j; for(i=0;i<=m;i++){ d[i]=[i]; } for(j=1;j<=n;j++) d[0][j]=j; for(i=1;i<=m;i++) for(j=1;j<=n;j++) d[i][j]=Math.min(d[i-1][j]+1,d[i][j-1]+1,d[i-1][j-1]+(a[i-1]===b[j-1]?0:1)); return d[m][n]; }
function isRight(p, g){ var x=normA(g); if(!x) return false; return [p.answer].concat(p.aliases||[]).some(function(a){ var y=normA(a); return x===y || (y.length>6 && lev(x,y)<=2); }); }
function todayPuzzle(n){ var list=dailies('builtin'); return list.length ? list[(n==null?dayNo():n)%list.length] : null; }
function dailyState(key){ var d=store().daily; if(!d[key]) d[key]={ g:[], done:false, won:false }; return d[key]; }
function dailyKeyFor(p, n){ return p.source==='mine' ? 'mine:'+p.id : dayKey(n); }
function dailyHtml(p, key, title){
  var st=dailyState(key), wrong=st.g.filter(function(g){ return !isRight(p,g); }).length, shown=st.done?6:Math.min(6, wrong+1);
  var h='<div class="cs-panel"><div class="cs-top"><h4 style="margin:0">'+e(title)+'</h4><span class="cs-meta">'+st.g.length+' of 6 guesses</span></div>'+
    '<ol class="cs-clues" style="margin-top:10px">'+p.clues.slice(0,6).map(function(c,i){ return i<shown?'<li>'+e(c)+'</li>':'<li class="hid">Hidden clue: make a guess to reveal it</li>'; }).join('')+'</ol>';
  if(st.g.length) h+='<div class="cs-meta" style="margin-top:6px">Your guesses: '+st.g.map(function(g){ return (isRight(p,g)?'✅ ':'❌ ')+e(g); }).join(' · ')+'</div>';
  if(!st.done){
    var names={}; dailies('all').forEach(function(d){ names[d.answer]=1; });
    h+='<form class="cs-ask" onsubmit="MB_CLINSIM.guess(\''+e(key)+'\',\''+e(p.id)+'\');return false"><input id="csGuess" list="csDx" autocomplete="off" placeholder="Your diagnosis" aria-label="Your diagnosis"><button class="btn primary">Guess</button></form>'+
      '<datalist id="csDx">'+Object.keys(names).sort().map(function(n){ return '<option value="'+e(n)+'">'; }).join('')+'</datalist>';
  } else {
    h+='<div class="cs-reveal" style="margin-top:12px"><b>'+(st.won?'Solved in '+st.g.length+'!':'The answer was')+' '+e(p.answer)+'.</b> '+e(p.why||'')+'</div>';
    if(p.source!=='mine') h+='<div class="btnrow" style="margin-top:10px"><button class="btn primary" onclick="MB_CLINSIM.share(\''+e(key)+'\',\''+e(p.id)+'\')">📲 Share my result</button></div>';
  }
  return h+'</div>';
}
var DAILY_BLIND=false;
function squares(p, st){ var s=st.g.map(function(g){ return isRight(p,g)?'🟩':'🟥'; }); while(s.length<6) s.push('⬜'); return s.join(''); }
function dailyMode(sub, id){
  var h=modeHead('daily', sub); DAILY_BLIND=/\/blind$/.test(id||'');
  if(sub==='mine'){
    var cc=curCourse(), list=dailies('mine').filter(function(d){ return inCourse(d, cc); });
    var blind=/\/blind$/.test(id||''); if(blind) id=id.replace(/\/blind$/,'');
    if(id){ var p=byId(list, id)||byId(dailies('mine'), id); if(!p) return h+'<div class="cs-panel">Puzzle not found.</div>'; return h+dailyHtml(p, dailyKeyFor(p), blind?'Mixed ward round: mystery patient':'From '+(p.courseName||'your lecture')); }
    if(!list.length) return h+emptyMine('puzzles');
    return h+'<div class="cs-grid">'+list.map(function(p){ var st=store().daily[dailyKeyFor(p)]; return '<a class="cs-card" style="text-decoration:none" href="#/clinsim/daily/mine/'+e(p.id)+'"><div><span class="cs-tag">'+e(p.courseName||'Your lecture')+'</span></div><h3>'+(st&&st.done?e(p.answer):'Mystery patient')+'</h3><div class="cs-meta">'+(st&&st.done?(st.won?'Solved in '+st.g.length:'Not solved'):'Not played yet')+'</div></a>'; }).join('')+'</div>';
  }
  if(sub==='archive'){
    var rows=''; for(var k=1;k<=7;k++){ var n=dayNo()-k, pz=todayPuzzle(n), ky=dayKey(n), s2=store().daily[ky];
      if(pz) rows+='<a class="cs-card" style="text-decoration:none" href="#/clinsim/daily/day/'+n+'"><h3>'+e(ky)+'</h3><div class="cs-meta">'+(s2&&s2.done?(s2.won?'Solved in '+s2.g.length+' · '+e(pz.answer):'Not solved · '+e(pz.answer)):'Not played')+'</div></a>'; }
    return h+'<p class="cs-sub">Missed a day? Play the last week\'s cases.</p><div class="cs-grid">'+rows+'</div>';
  }
  if(sub==='day' && id){ var dn=Number(id), pd=todayPuzzle(dn); if(!pd || dn>dayNo()) return h+'<div class="cs-panel">Not available.</div>'; return h+dailyHtml(pd, dayKey(dn), 'Case of '+dayKey(dn)); }
  var pt=todayPuzzle(); if(!pt) return h+'<div class="cs-panel">No case today.</div>';
  return h+'<p class="cs-sub">Everyone gets the same patient today. A new one appears at midnight.</p>'+dailyHtml(pt, dayKey(), 'Case of '+dayKey());
}

/* ---------- 👥 Study group OSCE (pass and play on one phone) */
var GS=null;
function groupList(){
  var cc=curCourse(), all=stations('all'), shownS=all.filter(function(s){ return inCourse(s, cc); });
  return modeHead('group','pick')+'<p class="cs-sub">For three people and one phone. The <b>patient</b> reads their script first. Then hand the phone to the <b>examiner</b>, who starts the clock and ticks what the <b>candidate</b> does. The candidate never sees the screen.</p><div class="cs-grid">'+
    shownS.map(function(s){ var free=isFree(all, s); return '<button class="cs-card" onclick="MB_CLINSIM.'+(free?'openGroup(\''+e(s.id)+'\')':'locked()')+'"><div><span class="cs-tag">'+e(s.source==='mine'?(s.courseName||'Your lecture'):s.area)+'</span>'+(!entitled()&&s.source==='builtin'&&!free?'<span class="cs-tag lock">🔒 Subscribe</span>':'')+'</div><h3>'+e(s.title)+'</h3><div class="cs-meta">'+e(s.patient.name)+', '+e(s.patient.age)+' '+e(s.patient.sex)+'</div></button>'; }).join('')+'</div>';
}
function groupView(){
  var s=GS.s, back='<a href="#/clinsim/group/pick" class="cs-back" onclick="MB_CLINSIM.stop()">← Stations</a>';
  var tabs='<div class="cs-subs" role="tablist" style="margin-top:8px">'+[['patient','1 · Patient script'],['examiner','2 · Examiner sheet'],['result','3 · Result']].map(function(t){ return '<button class="cs-chip" role="tab" aria-selected="'+(GS.tab===t[0])+'" aria-pressed="'+(GS.tab===t[0])+'" onclick="MB_CLINSIM.gtab(\''+t[0]+'\')">'+t[1]+'</button>'; }).join('')+'</div>';
  var h=back+'<h1>'+e(s.title)+'</h1>'+tabs;
  if(GS.tab==='patient'){
    h+='<div class="cs-panel"><h4>You are</h4><p style="margin:0">'+e(s.speaker&&!/^the patient$/i.test(s.speaker)?s.speaker+', speaking for '+s.patient.name:s.patient.name)+' ('+e(s.patient.age)+', '+e(s.patient.sex)+'). '+e(s.persona||'')+'</p>'+
      '<h4>Rules</h4><ul class="cs-teach"><li>Answer only what you are asked. Do not volunteer the answers below.</li><li>Use everyday words, not medical terms.</li><li>If asked something not on this sheet, say no, or that you don\'t know.</li></ul>'+
      '<h4>When the doctor greets you, say</h4><p style="margin:0">"'+e(s.opening||'Good day, doctor.')+'"</p>'+
      (s.background?'<h4>Background you know</h4><p style="margin:0">'+e(s.background)+'</p>':'')+
      '<h4>Your answers</h4><ul class="cs-list">'+s.history.map(function(x){ return '<li><span><b>'+e(x.q)+'</b><span class="cs-meta" style="display:block">'+e(x.a)+'</span></span></li>'; }).join('')+'</ul>'+
      '<div class="btnrow" style="margin-top:12px"><button class="btn primary" onclick="MB_CLINSIM.gtab(\'examiner\')">Ready: hand the phone to the examiner</button></div></div>';
  } else if(GS.tab==='examiner'){
    var running=GS.endsAt&&Date.now()<GS.endsAt;
    h+='<div class="cs-panel"><div class="cs-top"><h4 style="margin:0">Tick what the candidate does</h4>'+(GS.endsAt?'<span class="cs-clock" id="csGClock">'+gclock()+'</span>':'<button class="btn primary" onclick="MB_CLINSIM.gstart()">Start the 8-minute clock</button>')+'</div>'+
      '<h4>Key history (data gathering)</h4><ul class="cs-list">'+s.history.map(function(x){ return '<li><label><input type="checkbox" '+(GS.ticks.h[x.id]?'checked ':'')+'onchange="MB_CLINSIM.gtick(\'h\',\''+e(x.id)+'\',this.checked)"><span>'+e(x.q)+(x.key?' <span class="cs-tag">key</span>':'')+'</span></label></li>'; }).join('')+'</ul>'+
      '<h4>Interpersonal skills</h4><ul class="cs-list">'+IP.map(function(it){ return '<li><label><input type="checkbox" '+(GS.ticks.ip[it.id]?'checked ':'')+'onchange="MB_CLINSIM.gtick(\'ip\',\''+it.id+'\',this.checked)"><span>'+e(it.label)+'</span></label></li>'; }).join('')+'</ul>'+
      [['dx',s.dx],['plan',s.plan]].filter(function(x){ return x[1]; }).map(function(x){ var b=x[1]; return '<h4>Ask: '+e(b.q)+'</h4><div class="cs-meta" style="margin-bottom:6px">Best answer: <b>'+e(b.options[b.correct])+'</b>. Tick what the candidate said.</div><div class="cs-opts">'+
        b.options.map(function(o,i){ return '<button class="cs-opt'+(GS.ticks[x[0]]===i?' picked':'')+'" onclick="MB_CLINSIM.gpick(\''+x[0]+'\','+i+')">'+e(o)+'</button>'; }).join('')+'</div>'; }).join('')+
      '<div class="btnrow" style="margin-top:14px"><button class="btn primary" onclick="MB_CLINSIM.gtab(\'result\')">Mark the station</button></div></div>';
    if(running) setTimeout(gtimer, 0);
  } else {
    var sc=osceScore({ s:s }, GS.ticks);
    h+=resultHtml(s, sc, { picks:{ dx:GS.ticks.dx, plan:GS.ticks.plan }, time:'study group' })+'<div class="btnrow" style="margin-top:14px"><button class="btn primary" onclick="MB_CLINSIM.openGroup(\''+e(s.id)+'\')">Swap roles and go again</button></div>';
  }
  return h;
}
function gclock(){ if(!GS||!GS.endsAt) return ''; var ms=Math.max(0,GS.endsAt-Date.now()), m=Math.floor(ms/60e3), s=Math.floor(ms%60e3/1e3); return ms?m+':'+(s<10?'0':'')+s:'Time up'; }
function gtimer(){ stopTimer(); TIMER=setInterval(function(){ var el=document.getElementById('csGClock'); if(!el||!GS){ stopTimer(); return; } el.textContent=gclock(); if(Date.now()>=GS.endsAt){ stopTimer(); try{ navigator.vibrate&&navigator.vibrate([300,150,300]); }catch(_){} } }, 1000); }

/* ---------- 📚 My lecture cases */
var BUILDING={};
function mineMode(){
  var list=myTopics();
  var h=modeHead('mine','all')+'<p class="cs-sub">When you import a lecture, MedBank reads your note and builds patients from it: OSCE stations, quick cases and Case of the Day puzzles. Lectures with no patients in them (pure anatomy or biochemistry, say) may not get any.</p>';
  if(!list.length) return h+'<div class="cs-panel">You haven\'t imported a lecture yet. <a href="#/import">Import one</a> and its cases appear here.</div>';
  h+='<div class="cs-grid">';
  list.forEach(function(t){
    var p=pack(t), n=packCount(p);
    h+='<div class="cs-card"><h3>'+e(t.name)+'</h3><div class="cs-meta">'+e((t.subject&&t.subject.name)||'')+'</div>';
    if(n){
      h+='<div class="cs-subs">'+((p.osce||[]).length?'<a class="cs-chip" href="#/clinsim/osce/mine">🩺 '+p.osce.length+' station'+(p.osce.length>1?'s':'')+'</a>':'')+
        ((p.quick||[]).length?'<a class="cs-chip" href="#/clinsim/quick/mine">⚡ '+p.quick.length+' quick case'+(p.quick.length>1?'s':'')+'</a>':'')+
        ((p.daily||[]).length?'<a class="cs-chip" href="#/clinsim/daily/mine">📅 '+p.daily.length+' puzzle'+(p.daily.length>1?'s':'')+'</a>':'')+'</div>';
    } else if(p && p.none){
      h+='<div class="cs-meta">'+e(p.none)+'</div>';
    } else {
      h+='<button class="btn" '+(BUILDING[t.id]?'disabled':'')+' onclick="MB_CLINSIM.build(\''+e(t.id)+'\')">'+(BUILDING[t.id]?'Building cases… about 30 s':'✨ Build cases from this lecture')+'</button>';
    }
    h+='</div>';
  });
  return h+'</div>';
}
async function buildFor(topicId){
  var t=myTopics().filter(function(x){ return x.id===topicId; })[0]; if(!t || BUILDING[topicId]) return;
  if(root.MB_PAYWALL && !root.MB_PAYWALL.guard('Building cases')) return;
  var C=cfg(); if(!C.IMPORT_API){ if(root.mbToast) root.mbToast('Not configured yet.'); return; }
  BUILDING[topicId]=1; draw();
  try{
    var tok=await token();
    var r=await fetch(C.IMPORT_API.replace(/\/$/,'')+'/build-extra',{ method:'POST', headers:{'Content-Type':'application/json','Authorization':'Bearer '+tok}, body:JSON.stringify({ topic_id:topicId, kind:'clinsim', level:level(), topic_name:t.name }) });
    var o={}; try{ o=await r.json(); }catch(_){}
    if(r.ok && o.items){ t.extras=t.extras||{}; t.extras.clinsim=o.items; if(root.mbToast) root.mbToast(packCount(o.items)+' cases built from '+t.name+'.'); }
    else if(r.status===422){ t.extras=t.extras||{}; t.extras.clinsim={ none:o.reason||'No patient cases could be built from this lecture.' }; }
    else if(root.mbToast) root.mbToast(o.reason||o.error||'Could not build cases. Try again.');
  }catch(err){ if(root.mbToast) root.mbToast('Could not reach the server. Try again.'); }
  delete BUILDING[topicId]; if(CUR && CUR[0]==='mine') draw();
}

/* ---------- router */
var CUR=null;
function gate(){
  if(!on()) return '<h1>🏥 Clinical Simulation</h1><div class="empty" style="text-align:left">Clinical Simulation is switched off. Turn on <b>FEATURES.CLINICAL_SIM</b> in config.js, or run <code>localStorage.mbclinsim=\'1\'</code> on your own device and reload.</div>';
  if(!clinical()) return '<h1>🏥 Clinical Simulation</h1><div class="cs-panel" style="line-height:1.55">Clinical Simulation is for clinical-year medical students: <b>400, 500 and 600 level</b>.'+(level()?' You are on '+level()+' level, so it opens when you move up to 400 level.':' Sign in and pick your level to use it.')+'</div>';
  return null;
}
function page(parts){
  css();
  parts=(parts||[]).filter(function(x){ return x!==undefined && x!==''; }); CUR=parts;
  var g=gate(); if(g) return g;
  var mode=parts[0], sub=parts[1], id=parts.slice(2).join('/');
  if(mode!=='osce') stopTimer();
  if(mode!=='duel' && root.MB_CLINDUEL && root.MB_CLINDUEL.live()) root.MB_CLINDUEL.leaving();   // walking out of a live duel forfeits it
  switch(mode){
    case 'er':    return erMode(sub||'tut');
    case 'osce':
      if(id){ if(!OS || OS.s.id!==id){ if(!osceStart(id, sub==='practice'?'practice':'timed', 'open')) return '<h1>Station not found</h1><p><a href="#/clinsim/osce/timed">Back to stations</a></p>'; } if(OS.phase==='talk'&&OS.endsAt) setTimeout(startTimer,0); return osceView(); }
      OS=null; return osceList(sub||'timed');
    case 'quick':
      if(id){ if(!QS || QS.q.id!==id){ var q=byId(quickCases('all'), id); if(!q) return '<h1>Case not found</h1><p><a href="#/clinsim/quick/builtin">Back</a></p>'; QS={ q:q, step:0, picks:[], phase:'steps', m:0, mcq:[], ctx:'open', nonce:nonce() }; } return quickView(); }
      QS=null; return quickList(sub||'builtin');
    case 'daily': return dailyMode(sub||'today', id);
    case 'group':
      if(id){ if(!GS || GS.s.id!==id){ var s=byId(stations('all'), id); if(!s) return '<h1>Station not found</h1>'; GS={ s:s, tab:'patient', endsAt:null, ticks:{ h:{}, ip:{}, dx:null, plan:null } }; } return groupView(); }
      GS=null; return groupList();
    case 'mine':  return mineMode();
    case 'round': return roundPage();
    case 'duel':  return root.MB_CLINDUEL ? root.MB_CLINDUEL.page(sub, id) : '<h1>Duel</h1><p>Reload to load duels.</p>';
    default:      return hub();
  }
}

root.MB_CLINSIM={
  on:on, visible:visible, page:page, locked:locked,
  _test:{ osceScore:osceScore, quickScore:quickScore, isRight:isRight, stationFromEr:stationFromEr, stations:stations, IP:IP, specOf:specOf, inCourse:inCourse, topicHit:topicHit, catalogue:catalogue, upNext:upNext, order:order, gradeOf:gradeOf, pointsOf:pointsOf, standing:standing, rankOf:rankOf, roundItems:roundItems, forCtx:forCtx },
  stop:function(){ stopTimer(); },
  openOsce:function(id, mode, ctx){ stopTimer(); var all=stations('all'), s=byId(all,id); if(s && !isFree(all,s)) return locked(); osceStart(id, mode, ctx); location.hash='#/clinsim/osce/'+mode+'/'+id; CUR=['osce',mode,id]; draw(); },
  say:say,
  present:function(){ if(!OS) return; OS.phase='present'; stopTimer(); draw(); root.scrollTo&&root.scrollTo(0,0); },
  back:function(){ if(!OS) return; OS.phase='talk'; draw(); if(OS.endsAt) startTimer(); },
  pick:function(k, i){ if(!OS) return; OS[k]=i; draw(); },
  mark:function(){ if(!OS) return; OS.score=osceScore(OS); OS.phase='result'; stopTimer();
    var ex={ pass:OS.score.pass, mode:OS.mode, ctx:OS.ctx }; OS.pts=award('osce', OS.s.id, OS.score.total, ex); record('osce', OS.s.id, OS.score.total, ex); draw(); root.scrollTo&&root.scrollTo(0,0); },
  openQuick:function(id, ctx){ var all=quickCases('all'), q=byId(all,id); if(!q) return; if(!isFree(all,q)) return locked(); QS={ q:q, step:0, picks:[], phase:'steps', m:0, mcq:[], ctx:ctx||'open', nonce:nonce() }; location.hash='#/clinsim/quick/'+(q.source==='mine'?'mine':'builtin')+'/'+id; CUR=['quick',(q.source==='mine'?'mine':'builtin'),id]; draw(); },
  choose:function(i, k){ if(!QS || QS.picks[i]!==undefined) return; QS.picks[i]=k; draw(); },
  next:function(){ if(!QS) return; if(QS.step+1<QS.q.steps.length){ QS.step++; draw(); return; } QS.score=quickScore(QS.q, QS.picks); QS.phase=(QS.q.mcqs||[]).length?'mcq':'done'; if(QS.phase==='done') quickDone(); draw(); },
  answer:function(k){ if(!QS || QS.mcq[QS.m]!==undefined) return; QS.mcq[QS.m]=k; draw(); },
  nextMcq:function(){ if(!QS) return; if(QS.m+1<QS.q.mcqs.length){ QS.m++; draw(); return; } QS.phase='done'; quickDone(); draw(); root.scrollTo&&root.scrollTo(0,0); },
  guess:function(key, pid){
    var p=byId(dailies('all'), pid); var inp=document.getElementById('csGuess'); var g=(inp&&inp.value||'').trim(); if(!p||!g) return;
    var st=dailyState(key); if(st.done) return;
    st.g.push(g.slice(0,80));
    if(isRight(p,g)){ st.done=true; st.won=true; } else if(st.g.length>=6){ st.done=true; st.won=false; }
    if(st.done) record('daily', p.id, st.won?Math.round(100*(7-st.g.length)/6):0, { day:key, ctx:/^mine:/.test(key)&&DAILY_BLIND?'blind':'open' });
    save(); draw(); var i2=document.getElementById('csGuess'); if(i2) i2.focus();
  },
  share:function(key, pid){
    var p=byId(dailies('all'), pid), st=dailyState(key); if(!p) return;
    var text='MedBank Case of the Day '+key+'\n'+squares(p, st)+' '+(st.won?st.g.length+'/6':'X/6')+'\nCan you beat me? medbank.com.ng';
    if(navigator.share){ navigator.share({ text:text }).catch(function(){}); return; }
    root.open('https://wa.me/?text='+encodeURIComponent(text), '_blank', 'noopener');
  },
  openGroup:function(id){ stopTimer(); var all=stations('all'), s=byId(all,id); if(!s) return; if(!isFree(all,s)) return locked(); GS={ s:s, tab:'patient', endsAt:null, ticks:{ h:{}, ip:{}, dx:null, plan:null } }; location.hash='#/clinsim/group/pick/'+id; CUR=['group','pick',id]; draw(); },
  gtab:function(t){ if(!GS) return; GS.tab=t; if(t!=='examiner') stopTimer(); if(t==='result') record('group', GS.s.id, osceScore({ s:GS.s }, GS.ticks).total); draw(); root.scrollTo&&root.scrollTo(0,0); },
  gstart:function(){ if(!GS) return; GS.endsAt=Date.now()+OSCE_MIN*60e3; draw(); },
  gtick:function(k, id, v){ if(!GS) return; GS.ticks[k][id]=!!v; },
  gpick:function(k, i){ if(!GS) return; GS.ticks[k]=i; draw(); },
  build:buildFor,
  course:function(id){ setCourse(id||'all'); SEARCH=''; draw(); },
  newRound:function(){ ROUND_SEED++; draw(); },
  // what the duel (clinsim-duel.js) borrows from here
  _duel:{ draw:function(){ draw(); }, order:order, quickCases:quickCases, quickScore:quickScore, inCourse:inCourse, curCourse:curCourse,
    recordRun:function(kind, id, pct, ex){ record(kind, id, pct, ex); },
    recordDuel:function(d){ var s=store(); s.duels=(s.duels||[]).concat([d]).slice(-100); save(); },
    duels:function(){ return store().duels||[]; } },
  search:function(q){ SEARCH=String(q||'').slice(0,60); var r=document.getElementById('csResults'); if(r) r.innerHTML=searchHtml(SEARCH); }
};
})(typeof window!=='undefined'?window:globalThis);
