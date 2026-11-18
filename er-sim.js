/* =====================================================================
 * MedBank Emergency Room simulator ("ER Sim")
 *
 * One file, two halves:
 *   1. ENGINE (pure, no DOM): the action catalog, the live patient model
 *      (vitals drift while problems go untreated, recover when they are
 *      fixed), the clock, test turnaround times, triggers, and scoring.
 *      It runs in node too, so test-ersim.mjs can drive whole cases.
 *   2. UI (browser only): the case lobby (#/ersim) and the shift screen
 *      (#/ersim/<caseId>), drawn into #main like every other app page.
 *
 * Cases live in er-sim-cases.js (window.ERSIM_CASES). Every case is
 * original MedBank content written for Nigerian clinical students and must be
 * reviewed by a clinician before FEATURES.ER_SIM is switched on for students.
 *
 * Gated by MEDBANK_CONFIG.FEATURES.ER_SIM (default false). To try it on your
 * own device without flipping the flag: localStorage.mbersim='1', then reload.
 * ===================================================================== */
(function(root){
'use strict';

/* ---------------------------------------------------------------- catalog */
// min  = minutes of the clinician's time the action costs (the clock moves on)
// tat  = (tests) minutes until the result comes back
// at   = facility levels where it is available (omitted = everywhere)
// norm = (tests) what the result says when the case doesn't override it
var GH_UP=['gh','th'], TH_ONLY=['th'];
var CATALOG=[
  // --- Airway, breathing, circulation, procedures
  {id:'position',     cat:'abc', label:'Recovery / left-lateral position', min:1},
  {id:'suction',      cat:'abc', label:'Suction the airway', min:1},
  {id:'o2_nasal',     cat:'abc', label:'Oxygen by nasal prongs', dose:'1–4 L/min, titrate to SpO₂ 94–98%', min:1},
  {id:'o2_mask',      cat:'abc', label:'Oxygen by non-rebreather mask', dose:'15 L/min', min:1},
  {id:'bvm',          cat:'abc', label:'Bag-valve-mask ventilation', min:2},
  {id:'intubate',     cat:'abc', label:'Intubate (rapid sequence induction)', min:12, at:GH_UP},
  {id:'monitor',      cat:'abc', label:'Cardiac monitor and pulse oximetry', min:1},
  {id:'iv_access',    cat:'abc', label:'Wide-bore IV cannula and draw bloods', min:3},
  {id:'io_access',    cat:'abc', label:'Intraosseous access', min:3},
  {id:'cspine',       cat:'abc', label:'Immobilise the cervical spine', min:2},
  {id:'needle_decomp',cat:'abc', label:'Needle decompression of the chest', dose:'14–16G, 2nd ICS mid-clavicular or 4th–5th ICS anterior axillary', min:2},
  {id:'chest_drain',  cat:'abc', label:'Insert a chest drain (underwater seal)', min:15, at:GH_UP},
  {id:'catheter',     cat:'abc', label:'Urinary catheter and hourly urine output', min:3},
  {id:'ngt',          cat:'abc', label:'Nasogastric tube', min:3},
  {id:'immobilise',   cat:'abc', label:'Splint and immobilise the injured limb', min:2},
  {id:'remove_tourniquet', cat:'abc', label:'Remove the tourniquet carefully', min:1},
  {id:'tourniquet',   cat:'abc', label:'Apply a tight tourniquet above the wound', min:1},
  {id:'incise',       cat:'abc', label:'Incise and suck the wound', min:2},
  {id:'decontaminate',cat:'abc', label:'Remove clothing and wash the skin', min:4},
  {id:'cool',         cat:'abc', label:'Tepid sponging / cooling', min:2},
  {id:'prep_anaphylaxis', cat:'abc', label:'Draw up adrenaline and watch for a reaction', min:1},
  {id:'cpr',          cat:'abc', label:'Start CPR', min:2},
  // --- Fluids and blood
  {id:'ns_bolus',     cat:'fluids', label:'0.9% saline bolus', dose:'20 mL/kg child · 500 mL–1 L adult, then reassess', min:2},
  {id:'rl_planc',     cat:'fluids', label:'Ringer\'s lactate, WHO Plan C', dose:'100 mL/kg: adults 30 mL/kg in 30 min then 70 mL/kg over 2½ h', min:2},
  {id:'maint',        cat:'fluids', label:'Maintenance IV fluids', min:2},
  {id:'dextrose10',   cat:'fluids', label:'10% dextrose IV', dose:'5 mL/kg child · 150–200 mL adult', min:2},
  {id:'ors',          cat:'fluids', label:'Oral rehydration solution', dose:'Sips often, as much as tolerated', min:1},
  {id:'kcl',          cat:'fluids', label:'Add potassium chloride to the fluids', dose:'40 mmol per litre if K⁺ 3.5–5.5', min:1},
  {id:'blood',        cat:'fluids', label:'Transfuse red cells / whole blood', dose:'10–15 mL/kg, crossmatched', min:8, at:GH_UP},
  {id:'blood_oneg',   cat:'fluids', label:'Emergency O-negative blood (uncrossmatched)', dose:'Red cells 10 mL/kg, no crossmatch', min:3, at:GH_UP, p1:true},   // p1: only shown when the phase 1 rules are on (c.phase1)
  // --- Drugs
  {id:'artesunate',   cat:'drugs', label:'IV/IM artesunate', dose:'2.4 mg/kg (3 mg/kg if under 20 kg) at 0, 12, 24 h', min:2},
  {id:'artesunate_pr',cat:'drugs', label:'Rectal artesunate (pre-referral)', dose:'10 mg/kg once', min:1},
  {id:'act',          cat:'drugs', label:'Oral artemether–lumefantrine (ACT)', dose:'Weight-based, twice daily for 3 days', min:1},
  {id:'paracetamol',  cat:'drugs', label:'Paracetamol', dose:'15 mg/kg child · 1 g adult', min:1},
  {id:'nsaid',        cat:'drugs', label:'NSAID (ibuprofen / diclofenac)', min:1},
  {id:'aspirin',      cat:'drugs', label:'Aspirin', dose:'300 mg chewed', min:1},
  {id:'morphine',     cat:'drugs', label:'IV morphine, titrated', dose:'0.1 mg/kg in small increments', min:2},
  {id:'benzo',        cat:'drugs', label:'Benzodiazepine for a fit', dose:'Diazepam 0.5 mg/kg PR or 0.3 mg/kg IV · or buccal midazolam', min:1},
  {id:'phenobarb',    cat:'drugs', label:'Phenobarbital loading dose', dose:'20 mg/kg IV over 20 min', min:3, at:GH_UP},
  {id:'mgso4',        cat:'drugs', label:'Magnesium sulphate loading dose', dose:'Pritchard: 4 g IV over 5–10 min + 5 g IM each buttock', min:3},
  {id:'calcium_gluc', cat:'drugs', label:'10% calcium gluconate IV', dose:'10 mL over 10 min', min:1},
  {id:'hydralazine',  cat:'drugs', label:'IV hydralazine', dose:'5 mg slowly, repeat after 20 min if needed', min:1},
  {id:'labetalol',    cat:'drugs', label:'IV labetalol', dose:'20 mg, then 40–80 mg every 10 min', min:1},
  {id:'nifedipine',   cat:'drugs', label:'Oral nifedipine (immediate release)', dose:'10 mg, repeat after 30 min if needed', min:1},
  {id:'ergometrine',  cat:'drugs', label:'IM ergometrine', dose:'0.5 mg', min:1},
  {id:'oxytocin',     cat:'drugs', label:'Oxytocin', dose:'10 IU IM', min:1},
  {id:'ceftriaxone',  cat:'drugs', label:'IV ceftriaxone', dose:'80–100 mg/kg child · 2 g adult', min:1},
  {id:'azithro',      cat:'drugs', label:'Azithromycin (macrolide)', dose:'10 mg/kg child · 500 mg adult', min:1},
  {id:'doxy',         cat:'drugs', label:'Doxycycline single dose', dose:'300 mg adult', min:1},
  {id:'insulin_frii', cat:'drugs', label:'Fixed-rate IV insulin infusion', dose:'0.1 unit/kg/hour', min:2, at:GH_UP},
  {id:'insulin_bolus',cat:'drugs', label:'IV insulin bolus', dose:'10 units stat', min:1},
  {id:'antivenom',    cat:'drugs', label:'Polyvalent snake antivenom IV', dose:'Initial dose per the product insert, over 30–60 min', min:5, at:GH_UP},
  {id:'adrenaline_im',cat:'drugs', label:'IM adrenaline 1:1000', dose:'0.01 mg/kg, max 0.5 mg, anterolateral thigh', min:1},
  {id:'hydrocortisone',cat:'drugs', label:'IV hydrocortisone', dose:'200 mg adult', min:1},
  {id:'antihistamine',cat:'drugs', label:'IV chlorphenamine', dose:'10 mg adult', min:1},
  {id:'salbutamol',   cat:'drugs', label:'Nebulised salbutamol', dose:'5 mg (2.5 mg under 5 years)', min:2},
  {id:'furosemide',   cat:'drugs', label:'IV furosemide', dose:'40 mg', min:1},
  {id:'loperamide',   cat:'drugs', label:'Loperamide (anti-diarrhoeal)', min:1},
  {id:'tetanus',      cat:'drugs', label:'Tetanus toxoid', dose:'0.5 mL IM', min:1},
  {id:'tranexamic',   cat:'drugs', label:'IV tranexamic acid', dose:'1 g over 10 min', min:1},
  // --- Tests
  {id:'rbg',      cat:'tests', label:'Random blood glucose (glucometer)', tat:2,  norm:'5.4 mmol/L'},
  {id:'mrdt',     cat:'tests', label:'Malaria rapid diagnostic test', tat:15, norm:'Negative'},
  {id:'pcv',      cat:'tests', label:'PCV (haematocrit)', tat:15, norm:'38%'},
  {id:'urinalysis',cat:'tests', label:'Urine dipstick', tat:3, norm:'No blood, protein, glucose or ketones'},
  {id:'upt',      cat:'tests', label:'Urine pregnancy test', tat:3, norm:'Negative'},
  {id:'wbct20',   cat:'tests', label:'20-minute whole blood clotting test', tat:20, norm:'Clotted at 20 minutes'},
  {id:'cholera_rdt',cat:'tests', label:'Cholera rapid test (stool)', tat:15, norm:'Negative'},
  {id:'fetal_heart',cat:'tests', label:'Fetal heart (Pinard / Doppler)', tat:1, norm:'Not applicable'},
  {id:'mp_film',  cat:'tests', label:'Blood film for malaria parasites', tat:60, at:GH_UP, norm:'No parasites seen'},
  {id:'fbc',      cat:'tests', label:'Full blood count', tat:60, at:GH_UP, norm:'Hb 13.2 g/dL · WBC 7.4 ×10⁹/L · platelets 245 ×10⁹/L'},
  {id:'eucr',     cat:'tests', label:'Electrolytes, urea and creatinine', tat:60, at:GH_UP, norm:'Na 138 · K 4.1 · urea 4.2 · creatinine 78 · HCO₃ 24'},
  {id:'lft',      cat:'tests', label:'Liver function tests', tat:90, at:GH_UP, norm:'Within normal limits'},
  {id:'coag',     cat:'tests', label:'Clotting screen (PT/INR, aPTT)', tat:90, at:GH_UP, norm:'Normal'},
  {id:'vbg',      cat:'tests', label:'Venous blood gas', tat:10, at:GH_UP, norm:'pH 7.39 · HCO₃ 24 · lactate 1.1'},
  {id:'gxm',      cat:'tests', label:'Group and crossmatch', tat:45, at:GH_UP, norm:'Group O RhD positive · 2 units crossmatched'},
  {id:'bcult',    cat:'tests', label:'Blood culture', tat:2880, at:GH_UP, norm:'No growth so far'},
  {id:'ecg',      cat:'tests', label:'12-lead ECG', tat:5, at:GH_UP, norm:'Sinus rhythm, no acute changes'},
  {id:'cxr',      cat:'tests', label:'Chest X-ray', tat:30, at:GH_UP, norm:'Clear lung fields'},
  {id:'lp',       cat:'tests', label:'Lumbar puncture (CSF)', tat:45, at:GH_UP, norm:'Clear CSF · WBC 2 · protein and glucose normal'},
  {id:'abg',      cat:'tests', label:'Arterial blood gas', tat:10, at:TH_ONLY, norm:'pH 7.40 · PaO₂ 12.5 kPa · PaCO₂ 5.1 kPa'},
  {id:'efast',    cat:'tests', label:'Bedside ultrasound (eFAST)', tat:5, at:TH_ONLY, norm:'No free fluid, normal lung sliding'},
  {id:'ct_head',  cat:'tests', label:'CT head', tat:60, at:TH_ONLY, norm:'No acute intracranial abnormality'},
  // --- Team
  {id:'call_senior',  cat:'team', label:'Call your senior / registrar', min:3},
  {id:'consult_paeds',cat:'team', label:'Call paediatrics', min:3, at:GH_UP},
  {id:'consult_og',   cat:'team', label:'Call obstetrics & gynaecology', min:3, at:GH_UP},
  {id:'consult_surg', cat:'team', label:'Call general / trauma surgery', min:3, at:GH_UP},
  {id:'consult_med',  cat:'team', label:'Call internal medicine', min:3, at:GH_UP},
  {id:'consult_anaes',cat:'team', label:'Call anaesthesia', min:3, at:GH_UP},
  {id:'notify_dsno',  cat:'team', label:'Notify the LGA disease surveillance officer', min:2}
];
var BYID={}; CATALOG.forEach(function(a){ BYID[a.id]=a; });

var EXAM=[
  {id:'general',   label:'General look', min:1},
  {id:'airway',    label:'Airway', min:1},
  {id:'breathing', label:'Breathing and chest', min:2},
  {id:'circulation',label:'Circulation and heart', min:2},
  {id:'abdomen',   label:'Abdomen', min:2},
  {id:'neuro',     label:'Neurological', min:2},
  {id:'skin',      label:'Skin, eyes and extremities', min:1},
  {id:'local',     label:'The injured / affected area', min:1},
  {id:'obstetric', label:'Obstetric', min:2}
];

var SETTINGS={
  phc:{ label:'Primary Health Centre', short:'PHC', note:'Bedside tests only. No X-ray, no lab, no theatre. Stabilise and refer.' },
  gh: { label:'General Hospital', short:'General', note:'Basic lab, X-ray and ECG. No CT. Specialists on call.' },
  th: { label:'Teaching Hospital ED', short:'Teaching', note:'Full lab, ultrasound, CT and every specialty.' },
  pv: { label:'Private Hospital', short:'Private', note:'Own lab, X-ray and ECG, a doctor on site, specialists by phone. No CT.', as:'gh' }   // equipped like a General Hospital (`as`)
};

var DISPOSITIONS=[
  {id:'discharge', label:'Discharge home with advice'},
  {id:'admit_ward',label:'Admit to the ward'},
  {id:'admit_hdu', label:'Admit to HDU / ICU'},
  {id:'theatre',   label:'Take to theatre'},
  {id:'refer',     label:'Refer to a higher-level facility'}
];

var VITAL_KEYS=['hr','sbp','dbp','rr','spo2','temp','gcs','rbg'];
var LIMITS={ hr:[0,240], sbp:[0,260], dbp:[0,160], rr:[0,70], spo2:[40,100], temp:[33,42.5], gcs:[3,15], rbg:[0.5,40] };

/* ---------------------------------------------------------------- engine */
function clone(o){ return JSON.parse(JSON.stringify(o)); }
function clamp(k,v){ var l=LIMITS[k]; return l ? Math.max(l[0],Math.min(l[1],v)) : v; }
function available(a, setting){ var s=(SETTINGS[setting]&&SETTINGS[setting].as)||setting; return !a.at || a.at.indexOf(s)>=0; }

/* ------------------------------------------------- branching starts (variants)
 * A case may carry any of these. Each run then starts differently, from one seed:
 *   variants[]    partial cases (a different patient, hospital, presentation and art set).
 *                 Plain objects are merged key by key (exam, tests, responses, vitals, patient...),
 *                 arrays of {id} are merged by id (history, problems), other arrays replace,
 *                 drop:{history:[ids], problems:[ids]} removes items.
 *   severity[]    {id, label, vitals:{k:+/-}, drift:x}: how late the patient came. drift scales every problem's drift.
 *   nightShift    {chance, tatX, note}: lab tests (those with `at`) take tatX times as long at night.
 *   complications[] {id, label, problem, at:[from,to], chance, unless[]}: at most one is drawn per run.
 *                 It wakes a latent problem of the case (so it reuses the distress / critical pictures).
 * instantiate(c, opts) returns the case to play (c itself when it has none of these) with
 * c.variant = {seed, variant, severity, night, complication, ...} so the same start can be rebuilt. */
function rng(seed){ var a=seed>>>0; return function(){ a=(a+0x6D2B79F5)>>>0; var t=a; t=Math.imul(t^(t>>>15), t|1); t^=t+Math.imul(t^(t>>>7), t|61); return ((t^(t>>>14))>>>0)/4294967296; }; }
function isPlain(o){ return o && typeof o==='object' && !Array.isArray(o); }
function mergeCase(base, v){
  var out=clone(base);
  Object.keys(v).forEach(function(k){
    if(k==='drop'||k==='id'||k==='label') return;
    var val=v[k], cur=out[k];
    if(Array.isArray(val) && Array.isArray(cur) && val.length && val.every(function(x){ return isPlain(x)&&x.id; }) && cur.every(function(x){ return isPlain(x)&&x.id; })){
      val.forEach(function(x){ var i=-1; cur.forEach(function(y,j){ if(y.id===x.id) i=j; }); if(i>=0) cur[i]=Object.assign({}, cur[i], clone(x)); else cur.push(clone(x)); });
    } else if(isPlain(val) && isPlain(cur)) out[k]=Object.assign(cur, clone(val));
    else out[k]=clone(val);
  });
  Object.keys(v.drop||{}).forEach(function(k){ out[k]=(out[k]||[]).filter(function(x){ return v.drop[k].indexOf(x.id)<0; }); });
  return out;
}
function branching(c){ return !!(c && ((c.variants||[]).length || (c.severity||[]).length || c.nightShift || (c.complications||[]).length)); }
function instantiate(c, opts){
  if(!branching(c)) return c;
  opts=opts||{};
  var seed=(opts.seed!==undefined && opts.seed!==null) ? (opts.seed>>>0) : Math.floor(Math.random()*4294967296);
  var r=rng(seed), r1=r(), r2=r(), r3=r();   // always drawn in this order, so a seed rebuilds the same start
  var vs=c.variants||[], vi=vs.length ? (opts.variant!=null ? opts.variant : Math.floor(r1*vs.length)) : -1;
  var out=vi>=0 ? mergeCase(c, vs[vi]) : clone(c);
  delete out.variants;
  var sv=c.severity||[], si=sv.length ? (opts.severity!=null ? opts.severity : Math.floor(r2*sv.length)) : -1, sev=si>=0?sv[si]:null;
  if(sev){
    Object.keys(sev.vitals||{}).forEach(function(k){ if(typeof out.vitals[k]==='number') out.vitals[k]=Math.round(clamp(k, out.vitals[k]+sev.vitals[k])*10)/10; });
    if(out.vitals.gcs>15) out.vitals.gcs=15;
    if(sev.drift && sev.drift!==1) (out.problems||[]).forEach(function(p){ if(p.drift) Object.keys(p.drift).forEach(function(k){ p.drift[k]=p.drift[k]*sev.drift; }); });
  }
  var ns=c.nightShift, night=ns ? (opts.night!=null ? !!opts.night : r3<(ns.chance==null?0.33:ns.chance)) : false;
  if(night){
    out.tat=out.tat||{};
    CATALOG.forEach(function(a){ if(a.cat==='tests' && a.at) out.tat[a.id]=Math.round(a.tat*(ns.tatX||2)); });
    if(ns.note) out.triage=(out.triage?out.triage+' ':'')+ns.note;
  }
  var comp=null, pool=(out.complications||c.complications||[]).slice();
  if(opts.complication!==undefined){ comp=opts.complication===null?null:(pool.filter(function(x){ return x.id===opts.complication; })[0]||null); }
  else for(var i=0;i<pool.length && !comp;i++){ if(r()<(pool[i].chance==null?0.5:pool[i].chance)) comp=pool[i]; }
  var compAt=null;
  if(comp){
    var w=comp.at||[20,40]; compAt=w[0]+Math.floor(r()*(w[1]-w[0]+1));
    out.timers=(out.timers||[]).concat([{ at:compAt, problem:comp.problem, unless:comp.unless||[] }]);
  }
  delete out.severity; delete out.nightShift; delete out.complications;
  out.variant={ seed:seed, variant:vi, id:vi>=0?(vs[vi].id||String(vi)):null, label:vi>=0?(vs[vi].label||''):'',
    severity:si, severityId:sev?sev.id:null, severityLabel:sev?(sev.label||''):'', night:night,
    complication:comp?{ id:comp.id, label:comp.label||comp.id, problem:comp.problem, at:compAt }:null };
  return out;
}
function variantOpts(run){ var v=run&&run.variant; return v ? { seed:v.seed, variant:v.variant<0?null:v.variant, severity:v.severity<0?null:v.severity, night:v.night, complication:v.complication?v.complication.id:null } : null; }

function newRun(c){
  var probs={};
  (c.problems||[]).forEach(function(p){ probs[p.id]={ active:!p.latent, fixed:false, count:0, since:p.latent?null:0 }; });
  return {
    caseId:c.id, t:0, v:clone(c.vitals), probs:probs,
    done:{},          // actionId -> [times]
    log:[],           // {t, kind, text}
    asked:{},         // historyId -> t
    examined:{},      // examId -> t
    pending:[],       // {id, ready}
    results:{},       // testId -> {t, text}
    recover:[],       // {k, perMin, until}
    timers:(c.timers||[]).map(function(tm){ return { at:tm.at, problem:tm.problem, unless:tm.unless||[] }; }),   // {at, problem, unless:[ids]}
    variant:c.variant||null,   // the branching start this run was dealt (instantiate), so a reload rebuilds the same case
    steps:[],         // every student step in order ({k:'act'|'ask'|'exam'|'wait'|'free'|'first', ...}), so a run can be replayed to any minute
    doses:[], unneeded:[], alerts:[],   // phase 1 rules only (c.phase1): worked-out doses, steps with no reason, nurse warnings
    dx:null, dispo:null, ended:false, outcome:null, startedAt:Date.now()
  };
}

function caseProblem(c,id){ for(var i=0;i<(c.problems||[]).length;i++) if(c.problems[i].id===id) return c.problems[i]; return null; }
function didAny(run, ids){ return (ids||[]).some(function(id){ return !!run.done[id]; }); }
function firstTime(run, ids){ var best=null; (ids||[]).forEach(function(id){ var ts=run.done[id]; if(ts&&ts.length&&(best===null||ts[0]<best)) best=ts[0]; }); return best; }

function log(run, kind, text){ var v=run.v||{}; run.log.push({ t:Math.round(run.t), kind:kind, text:text, v:{ hr:Math.round(v.hr), sbp:Math.round(v.sbp), spo2:Math.round(v.spo2) } }); }   // v: vitals at that moment, for the debrief's vitals trace

// Advance the clock: problems drift vitals, recoveries play out, latent problems wake, tests come back.
function tick(c, run, minutes){
  for(var m=0; m<minutes && !run.ended; m++){
    run.t+=1;
    (c.problems||[]).forEach(function(p){
      var st=run.probs[p.id]; if(!st||!st.active||st.fixed||!p.drift) return;
      Object.keys(p.drift).forEach(function(k){ run.v[k]=clamp(k, run.v[k]+p.drift[k]/10); });
      if(p.drift.sbp && p.drift.dbp===undefined) run.v.dbp=clamp('dbp', run.v.dbp+p.drift.sbp*0.6/10);
    });
    run.recover=run.recover.filter(function(r){
      if(run.t>r.until) return false;
      run.v[r.k]=clamp(r.k, run.v[r.k]+r.perMin); return true;
    });
    run.timers=run.timers.filter(function(tm){
      if(run.t<tm.at) return true;
      if(!didAny(run, tm.unless)) wake(c, run, tm.problem);
      return false;
    });
    run.pending=run.pending.filter(function(p){
      if(run.t<p.ready) return true;
      var text=testResult(c, run, p.id, p.orderedState, p.orderedActive);
      run.results[p.id]={ t:run.t, text:text };
      log(run,'result', BYID[p.id].label+': '+text);
      return false;
    });
    checkArrest(c, run);
  }
}

function wake(c, run, pid){
  var st=run.probs[pid], p=caseProblem(c,pid); if(!st||!p||st.active||st.fixed) return;
  st.active=true; st.since=run.t;
  if(p.wakeText) log(run,'event', p.wakeText);
  if(c.phase1 && p.wakeText) (run.alerts=run.alerts||[]).push({ t:run.t, problem:pid, text:p.wakeText, seen:false });   // the nurse warns the doctor (shown by level in the UI)
}
function rec(run, s){ (run.steps=run.steps||[]).push(s); }

function checkArrest(c, run){
  var v=run.v;
  if(v.sbp<50 || v.spo2<62 || v.hr<30 || v.hr>220 || v.rbg<1.0){
    run.ended=true; run.outcome='died';
    log(run,'event','The patient has gone into cardiac arrest. Despite resuscitation, they could not be saved.');
  }
}

function startRecovery(run, deltas, over){
  over=over||15;
  Object.keys(deltas||{}).forEach(function(k){
    var d=deltas[k];
    run.v[k]=clamp(k, run.v[k]+d*0.4);   // part of the effect is immediate…
    run.recover.push({ k:k, perMin:(d*0.6)/over, until:run.t+over });   // …the rest over the next minutes
    if(k==='sbp' && deltas.dbp===undefined){ run.v.dbp=clamp('dbp',run.v.dbp+d*0.24); run.recover.push({k:'dbp',perMin:(d*0.36)/over,until:run.t+over}); }
  });
}

function testResult(c, run, id, stateAtOrder, activeAtOrder){
  var spec=(c.tests||{})[id], a=BYID[id];
  if(spec===undefined) return a.norm;
  if(typeof spec==='string') return spec;
  if(spec.active){   // a result that only shows while a (latent) problem is active, e.g. glucose when late hypoglycaemia has set in
    var ak=Object.keys(spec.active);
    for(var j=0;j<ak.length;j++){ if(activeAtOrder && activeAtOrder[ak[j]]) return spec.active[ak[j]]; }
  }
  if(spec.fixed){
    var keys=Object.keys(spec.fixed);
    for(var i=0;i<keys.length;i++){ if(stateAtOrder && stateAtOrder[keys[i]]) return spec.fixed[keys[i]]; }
  }
  return spec.r;
}

function examFinding(c, run, id){
  var spec=(c.exam||{})[id];
  if(spec===undefined) return 'Nothing abnormal found.';
  if(typeof spec==='string') return spec;
  var ak=Object.keys(spec.active||{});
  for(var j=0;j<ak.length;j++){ var sa=run.probs[ak[j]]; if(sa&&sa.active&&!sa.fixed) return spec.active[ak[j]]; }
  var keys=Object.keys(spec.fixed||{});
  for(var i=0;i<keys.length;i++){ var st=run.probs[keys[i]]; if(st&&st.fixed) return spec.fixed[keys[i]]; }
  return spec.r;
}

function fixedMap(run){ var m={}; Object.keys(run.probs).forEach(function(k){ m[k]=run.probs[k].fixed; }); return m; }
function activeMap(run){ var m={}; Object.keys(run.probs).forEach(function(k){ var s=run.probs[k]; m[k]=!!(s.active&&!s.fixed); }); return m; }

// Do one thing. Returns {ok, text} for the UI to show.
function act(c, run, id, opt){
  if(run.ended) return { ok:false, text:'This case has ended.' };
  var a=BYID[id]; if(!a) return { ok:false, text:'Unknown action.' };
  if(a.p1 && !c.phase1) return { ok:false, text:'Unknown action.' };
  if(!available(a, c.setting)) return { ok:false, text:a.label+' is not available at a '+SETTINGS[c.setting].label+'.' };
  var lock=c.phase1 ? bloodLock(c, run, id) : null;
  if(lock) return { ok:false, text:lock };
  opt=opt||{};
  rec(run, opt.dose!=null ? { k:'act', id:id, dose:opt.dose } : { k:'act', id:id });
  if(a.cat==='tests'){
    if(run.pending.some(function(p){ return p.id===id; })){ run.steps.pop(); return { ok:false, text:'Already sent. Waiting for the result.' }; }
    (run.done[id]=run.done[id]||[]).push(run.t);
    var tat=(c.tat&&c.tat[id])||a.tat;
    run.pending.push({ id:id, ready:run.t+tat, orderedState:fixedMap(run), orderedActive:activeMap(run) });
    log(run,'test','Sent: '+a.label);
    tick(c, run, 1);
    return { ok:true, text:a.label+' sent. Result in about '+fmtDur(tat)+'.' };
  }
  var extra='', dc=null;
  if(c.phase1){
    var why=unneededWhy(c, run, id);
    if(why) (run.unneeded=run.unneeded||[]).push({ id:id, t:run.t, why:why });
    if(id==='blood_oneg') run.oneg={ t:run.t, justified:onegJustified(c, run) };
    if(opt.dose!=null){ dc=doseCheck(c, id, opt.dose); if(dc){ dc.t=run.t; (run.doses=run.doses||[]).push(dc); extra=dc.band==='full'?'':' (The right dose was '+dc.right+' '+dc.unit+'.)'; } }
  }
  (run.done[id]=run.done[id]||[]).push(run.t);
  var reply=(c.responses||{})[id] || (a.cat==='team' ? 'They will come when they can. Keep managing the patient.' : null);
  if(reply && dc && dc.band!=='full') reply=givenText(dc);   // the case's own text names the right dose, so say what was actually given
  log(run, a.cat==='team'?'team':'tx', a.label + (reply?' — '+reply:''));
  var fixId=FIX_ALIAS[id]||id;
  // Fix any problem this action treats
  (c.problems||[]).forEach(function(p){
    var st=run.probs[p.id];
    if(!st || st.fixed || (p.fixedBy||[]).indexOf(fixId)<0) return;
    st.count+=1;
    if(!st.active){ if(p.preventable){ st.fixed=true; } return; }
    if(st.count>=(p.need||1)){
      st.fixed=true; st.fixedAt=run.t;
      startRecovery(run, p.onFix, p.over);
      if(p.fixText) log(run,'event',p.fixText);
    }
  });
  // Triggers: this action starts a timer that may wake a latent problem
  (c.triggers||[]).forEach(function(tr){
    if(tr.after===id && !tr._fired){
      if(!run._firedTriggers) run._firedTriggers={};
      var key=tr.after+'>'+tr.problem; if(run._firedTriggers[key]) return; run._firedTriggers[key]=1;
      run.timers.push({ at:run.t+(tr.delay||0), problem:tr.problem, unless:tr.unless||[] });
    }
  });
  tick(c, run, a.min||1);
  return { ok:true, text:(reply || (a.label+' done.'))+extra };
}

function ask(c, run, hid){
  var h=(c.history||[]).filter(function(x){ return x.id===hid; })[0];
  if(!h || run.ended) return null;
  rec(run, { k:'ask', id:hid });
  if(!run.asked[hid]) run.asked[hid]=run.t;
  log(run,'talk','“'+h.q+'” — '+h.a);
  tick(c, run, 1);
  return h.a;
}

function examine(c, run, eid){
  var e=EXAM.filter(function(x){ return x.id===eid; })[0]; if(!e || run.ended) return null;
  rec(run, { k:'exam', id:eid });
  var f=examFinding(c, run, eid);
  run.examined[eid]=run.t;
  log(run,'exam', e.label+': '+f);
  tick(c, run, e.min);
  return f;
}

function wait(c, run, minutes){ if(run.ended) return; rec(run, { k:'wait', m:minutes }); log(run,'wait','Observed the patient for '+minutes+' min.'); tick(c, run, minutes); }
/* A typed question the AI patient (or the offline matcher) already answered: record it so a replay can play it back. */
function freeAsk(c, run, q, reply, about){
  if(run.ended) return;
  rec(run, { k:'free', q:q, reply:reply, about:about||[] });
  (about||[]).forEach(function(id){ if(run.asked[id]===undefined && (c.history||[]).some(function(h){ return h.id===id; })) run.asked[id]=run.t; });
  run.log.push({ t:run.t, kind:'talk', text:'“'+q+'” — '+reply });
  tick(c, run, 1);
}

// Simple local matcher for typed questions when the AI patient is unavailable.
var STOP={the:1,a:1,an:1,is:1,are:1,you:1,your:1,do:1,did:1,does:1,has:1,have:1,had:1,any:1,of:1,to:1,in:1,on:1,for:1,and:1,or:1,she:1,he:1,her:1,his:1,it:1,been:1,was:1,what:1,how:1,when:1,there:1,been:1,ever:1,me:1,tell:1,about:1,with:1,this:1,that:1};
function words(s){ return String(s||'').toLowerCase().replace(/[^a-z0-9 ]/g,' ').split(/\s+/).filter(function(w){ return w.length>2 && !STOP[w]; }).map(function(w){ return w.replace(/(ing|ed|es|s)$/,''); }); }
function matchHistory(c, text){
  var q=words(text); if(!q.length) return null;
  var best=null, bestScore=0;
  (c.history||[]).forEach(function(h){
    var bag={}; words(h.q+' '+(h.k||'')).forEach(function(w){ bag[w]=1; });
    var s=0; q.forEach(function(w){ if(bag[w]) s+=1; });
    var score=s/Math.max(2,q.length);
    if(score>bestScore){ bestScore=score; best=h; }
  });
  return bestScore>=0.34 ? best : null;
}

/* Scoring. Everything is derived from the run, so a debrief can be rebuilt any time. */
function score(c, run){
  var items=[], got=0, max=0;
  function add(group, label, pts, earned, note){ items.push({ group:group, label:label, pts:pts, earned:earned, note:note||'' }); if(pts>0) max+=pts; got+=earned; }
  var P1=!!c.phase1, dangerous=false;
  (c.critical||[]).forEach(function(r){
    var t=firstTime(run, anyOf(r.any));
    if(t===null) add('critical', r.label, r.pts, 0, r.why||'Not done.');
    else if(byOf(c, r) && t>byOf(c, r)) add('critical', r.label, r.pts, Math.round(r.pts/2), 'Done at '+t+' min, target was within '+byOf(c, r)+' min.');
    else add('critical', r.label, r.pts, r.pts, 'Done at '+t+' min.');
  });
  (c.good||[]).forEach(function(r){
    var t=firstTime(run, anyOf(r.any));
    add('good', r.label, r.pts, t===null?0:r.pts, t===null?(r.why||''):'Done at '+t+' min.');
  });
  if(P1){
    var ds=run.doses||[];
    if(ds.length){
      var cr=ds.reduce(function(s,d){ return s+(d.band==='full'?1:d.band==='half'?0.5:0); }, 0), okN=ds.filter(function(d){ return d.band==='full'; }).length;
      add('good', 'Worked out the doses ('+okN+' of '+ds.length+' right)', 6, Math.round(6*cr/ds.length*2)/2,
        ds.filter(function(d){ return d.band!=='full'; }).map(function(d){ return d.name+': gave '+d.given+' '+d.unit+', the right dose was '+d.right+' '+d.unit; }).join(' · '));
    }
    rechecks(c, run).forEach(function(r){
      if(r.done || run.t>=r.dueAt+RECHECK_LATE) add('good', 'Rechecked on time: '+r.label, 3, r.done?3:0, r.done?'Rechecked at '+r.doneAt+' min (due at '+r.dueAt+').':(r.why||'Due at '+r.dueAt+' min and not repeated.'));
    });
  }
  // History and examination coverage
  var keyH=(c.history||[]).filter(function(h){ return h.key; });
  if(keyH.length){
    var askedN=keyH.filter(function(h){ return run.asked[h.id]!==undefined; }).length;
    var pts=10, earned=Math.round(pts*askedN/keyH.length);
    var missed=keyH.filter(function(h){ return run.asked[h.id]===undefined; }).map(function(h){ return h.q; });
    add('history', 'Asked the key history questions ('+askedN+'/'+keyH.length+')', pts, earned, missed.length?'Missed: '+missed.join(' · '):'');
  }
  if((c.keyExam||[]).length){
    var exN=c.keyExam.filter(function(e){ return run.examined[e]!==undefined; }).length;
    add('exam', 'Examined the key systems ('+exN+'/'+c.keyExam.length+')', 8, Math.round(8*exN/c.keyExam.length),
      exN<c.keyExam.length ? 'Missed: '+c.keyExam.filter(function(e){ return run.examined[e]===undefined; }).map(function(e){ return (EXAM.filter(function(x){return x.id===e;})[0]||{}).label; }).join(' · ') : '');
  }
  (c.harmful||[]).forEach(function(r){
    var ts=[]; (r.any||[]).forEach(function(id){ (run.done[id]||[]).forEach(function(t){ ts.push(t); }); });
    var bad=ts.some(function(t){
      if(!r.unless) return true;
      var before=firstTime(run, r.unless);
      return before===null || before>t;   // harmful only if done while the safer step had not been done
    });
    if(r.repeat){ bad = ts.length>r.repeat; }
    if(bad){
      if(!P1) add('harm', r.label, 0, r.pts, r.why||'');
      else { var tier=r.tier||'harmful'; if(tier==='dangerous') dangerous=true; add('harm', TIER_LABEL[tier]+': '+r.label, 0, TIER_PTS[tier], r.why||''); }
    }
  });
  if(P1){
    (run.unneeded||[]).forEach(function(u){ add('harm', 'Unneeded: '+BYID[u.id].label+' at '+u.t+' min', 0, TIER_PTS.unneeded, u.why); });
    (run.doses||[]).forEach(function(d){ if(d.band==='wrong') add('harm', 'Harmful: wrong dose of '+d.name+' at '+d.t+' min', 0, TIER_PTS.harmful, 'You gave '+d.given+' '+d.unit+'. The right dose was '+d.right+' '+d.unit+' ('+d.perKg+' '+d.unit+'/kg × '+d.kg+' kg). More than 25% off.'); });
    if(run.oneg && !run.oneg.justified){ dangerous=true; add('harm', 'Dangerous: uncrossmatched blood when there was time to crossmatch', 0, TIER_PTS.dangerous, 'The patient was not about to die, so there was time to wait for crossmatched blood. Uncrossmatched blood risks a transfusion reaction.'); }
  }
  // Diagnosis
  var dxPts=20, dxEarned=0, dxNote;
  var dxOpt=(c.dx.options||[]).filter(function(o){ return o.id===run.dx; })[0];
  if(!run.dx) dxNote='No working diagnosis was recorded.';
  else if(c.dx.correct.indexOf(run.dx)>=0){ dxEarned=dxPts; dxNote='Correct.'; }
  else if((c.dx.close||[]).indexOf(run.dx)>=0){ dxEarned=Math.round(dxPts/2); dxNote='Close. The best answer was: '+dxLabel(c, c.dx.correct[0])+'.'; }
  else dxNote='The best answer was: '+dxLabel(c, c.dx.correct[0])+'.';
  add('dx', 'Working diagnosis'+(dxOpt?': '+dxOpt.label:''), dxPts, dxEarned, dxNote);
  // Disposition
  var dp=c.dispo||{}, dpPts=12, dpEarned=0, dpNote;
  var dpLabel=(DISPOSITIONS.filter(function(d){ return d.id===run.dispo; })[0]||{}).label;
  if(!run.dispo) dpNote='No disposition was chosen.';
  else if((dp.best||[]).indexOf(run.dispo)>=0){ dpEarned=dpPts; dpNote=dp.why||'Right place for this patient.'; }
  else if((dp.ok||[]).indexOf(run.dispo)>=0){ dpEarned=Math.round(dpPts/2); dpNote='Acceptable. '+(dp.why||''); }
  else if((dp.harm||[]).indexOf(run.dispo)>=0){ dpEarned=P1?TIER_PTS.dangerous:-10; dpNote=(P1?'Dangerous. ':'Unsafe. ')+(dp.why||''); if(P1) dangerous=true; }
  else dpNote='Not the best choice. '+(dp.why||'');
  add('dispo', 'Disposition'+(dpLabel?': '+dpLabel:''), dpPts, dpEarned, dpNote);
  var cb=curveball(c, run);
  if(cb && cb.happened) add('critical', 'Handled the curveball: '+cb.label, 10, cb.fixed?(cb.response<=15?10:5):0,
    cb.fixed ? 'It started at '+cb.at+' min. You treated it '+cb.response+' min later'+(cb.response>15?' (aim for within 15).':'.') : 'It started at '+cb.at+' min and was never treated.');
  if(P1 && run.outcome!=='died' && c.handover){
    var ho=handoverScore(c, run);
    add('handover', 'Handover to the ward doctor ('+ho.right+' of 4 parts right)', 10, ho.right*2.5, ho.note);
  }
  if(run.outcome==='died') add('harm','The patient died', 0, -30, 'Deterioration was not reversed in time.');
  var pct=max?Math.max(0,Math.min(100,Math.round(100*got/max))):0;
  var grade = run.outcome==='died' ? 'Patient died' : dangerous ? 'Unsafe' : pct>=85?'Excellent': pct>=70?'Safe': pct>=50?'Borderline':'Unsafe';
  return { pct:pct, got:got, max:max, grade:grade, items:items, minutes:run.t, dangerous:dangerous };
}
/* The complication this run was dealt, and what became of it. */
function curveball(c, run){
  var cp=c.variant&&c.variant.complication; if(!cp) return null;
  var st=run.probs[cp.problem]; if(!st) return null;
  var happened=st.since!==null && st.since!==undefined;
  return { label:cp.label, at:happened?st.since:cp.at, happened:happened, prevented:!happened && st.fixed, fixed:happened && st.fixed,
    response:(happened && st.fixed && st.fixedAt!=null) ? Math.max(0, st.fixedAt-st.since) : null };
}
/* The student's path next to the best path: every critical step in its target order, when (or whether) they did it,
   then the curveball, what they did that was off the path, and where the patient went. Derived from the run only. */
function pathCompare(c, run){
  var steps=(c.critical||[]).map(function(r, i){ return { r:r, i:i }; });
  steps.sort(function(a,b){ var x=byOf(c, a.r), y=byOf(c, b.r); x=x==null?1e9:x; y=y==null?1e9:y; return x-y || a.i-b.i; });
  var rows=steps.map(function(s){
    var r=s.r, by=byOf(c, r), t=firstTime(run, anyOf(r.any)), did=anyOf(r.any).filter(function(id){ return run.done[id]; })[0];
    return { label:r.label, by:by, best:by!=null?('by '+by+' min'):'during the case', yours:t===null?null:t, what:did?BYID[did].label:null,
      status:t===null?'missed':(by!=null && t>by?'late':'on-time') };
  });
  var off=[];
  (c.harmful||[]).forEach(function(r){
    var ts=[]; (r.any||[]).forEach(function(id){ (run.done[id]||[]).forEach(function(t){ ts.push(t); }); });
    var bad=ts.some(function(t){ if(!r.unless) return true; var b=firstTime(run, r.unless); return b===null || b>t; });
    if(r.repeat) bad=ts.length>r.repeat;
    if(bad) off.push({ label:r.label, at:Math.min.apply(null, ts), why:r.why||'', tier:c.phase1?(r.tier||'harmful'):null });
  });
  if(c.phase1){
    (run.unneeded||[]).forEach(function(u){ off.push({ label:BYID[u.id].label, at:u.t, why:u.why, tier:'unneeded' }); });
    (run.doses||[]).forEach(function(d){ if(d.band==='wrong') off.push({ label:'Wrong dose of '+d.name+' ('+d.given+' '+d.unit+' instead of '+d.right+')', at:d.t, why:'More than 25% off the right dose.', tier:'harmful' }); });
    if(run.oneg && !run.oneg.justified) off.push({ label:'Uncrossmatched O-negative blood', at:run.oneg.t, why:'There was time to wait for the crossmatch.', tier:'dangerous' });
    off.sort(function(a,b){ return a.at-b.at; });
  }
  var dp=c.dispo||{}, lab=function(id){ return (DISPOSITIONS.filter(function(d){ return d.id===id; })[0]||{}).label||id; };
  return { rows:rows, curveball:curveball(c, run), off:off,
    dispo:{ best:(dp.best||[]).map(lab), yours:run.dispo?lab(run.dispo):null, ok:(dp.best||[]).indexOf(run.dispo)>=0 },
    dx:{ best:dxLabel(c, c.dx.correct[0]), yours:run.dx?dxLabel(c, run.dx):null, ok:c.dx.correct.indexOf(run.dx)>=0 } };
}
function dxLabel(c, id){ var o=(c.dx.options||[]).filter(function(x){ return x.id===id; })[0]; return o?o.label:id; }

function finish(c, run, dx, dispo, handover){
  if(run.ended && run.outcome==='died'){ run.dx=dx||run.dx; run.dispo=dispo||run.dispo; return score(c, run); }
  if(handover) run.handover=handover;   // {picks:{situation:id,...}} or {text:'...'} (phase 1)
  run.dx=dx; run.dispo=dispo; run.ended=true; run.outcome=run.outcome||'handed over';
  log(run,'end','Handed over. Diagnosis: '+(dx?dxLabel(c,dx):'none')+' · '+((DISPOSITIONS.filter(function(d){return d.id===dispo;})[0]||{}).label||'no disposition'));
  return score(c, run);
}

function status(c, run){
  var cues=[];
  (c.problems||[]).forEach(function(p){ var st=run.probs[p.id]; if(st&&st.active&&!st.fixed&&p.cue) cues.push(p.cue); });
  var v=run.v, warn=[];
  if(v.spo2<88) warn.push('SpO₂ critically low'); if(v.sbp<80) warn.push('hypotensive'); if(v.gcs<=8) warn.push('GCS 8 or less, protect the airway'); if(v.hr>150) warn.push('marked tachycardia');
  return { cues:cues, warn:warn, stable: !cues.length && !warn.length };
}

function fmtDur(m){ if(m>=1440) return Math.round(m/1440)+' day'+(m>=2880?'s':''); if(m>=60) return (m/60).toFixed(m%60?1:0)+' h'; return m+' min'; }

/* ------------------------------------------------- phase 1 rules ("Make the case right")
 * Only when the case to play carries phase1:true (the UI sets it while FEATURES.CASES_PHASE1 is on,
 * or on the owner's ?mbcases=1 preview). Without it, every case plays and scores exactly as before.
 *   1  No blood before a crossmatch; emergency O-negative blood (blood_oneg) instead.
 *   2  Off-path tiers: unneeded -3, harmful -8, dangerous -15 (and the grade is at most Unsafe).
 *   3  Weight-based doses are worked out by the student (DOSES); 10% off = full, 25% = half, more = harmful.
 *   7  "What do you do first?" on arrival (c.firstMove).
 *   8  Rechecks the case expects (c.recheck), shown on the test buttons and scored as good practice.
 *   9  A scored handover in 4 parts (c.handover), 2.5 points each.
 *   10 Replay from the mistake: run.steps rebuilds the run at any minute (replay()). */
var FIX_ALIAS={ blood_oneg:'blood' };   // O-negative blood treats what crossmatched blood treats
function anyOf(ids){ ids=ids||[]; return ids.indexOf('blood')>=0 && ids.indexOf('blood_oneg')<0 ? ids.concat(['blood_oneg']) : ids; }
var TIER_PTS={ unneeded:-3, harmful:-8, dangerous:-15 }, TIER_LABEL={ unneeded:'Unneeded', harmful:'Harmful', dangerous:'Dangerous' };
var RECHECK_EARLY=5, RECHECK_LATE=15;
/* A step's time target. On a night shift the crossmatch takes longer, so a target that needs crossmatched blood moves with it. */
function byOf(c, r){
  if(r.by==null) return null;
  if(c.phase1 && anyOf(r.any).indexOf('blood')>=0 && c.tat && c.tat.gxm) return r.by+Math.max(0, c.tat.gxm-BYID.gxm.tat);
  return r.by;
}
function bloodLock(c, run, id){
  if(id!=='blood' || run.results.gxm) return null;
  var p=run.pending.filter(function(x){ return x.id==='gxm'; })[0];
  if(p) return 'The crossmatch is not back yet (about '+fmtDur(p.ready-run.t)+'). Wait for it, or give emergency O-negative blood if the patient cannot wait.';
  return 'Send a group and crossmatch first. Blood is given only once it is crossmatched.';
}
function onegJustified(c, run){ var v=run.v; return v.spo2<85 || v.sbp<70 || v.hr>190; }   // about to die: no time to wait for crossmatched blood
/* Why a drug or fluid had no reason at that moment (null when it had one). Harmful steps are scored on their own. */
function unneededWhy(c, run, id){
  var a=BYID[id]; if(!a || (a.cat!=='drugs' && a.cat!=='fluids') || id==='blood_oneg') return null;
  if((c.harmful||[]).some(function(r){ return (r.any||[]).indexOf(id)>=0 && !r.repeat && (!r.unless || firstTime(run, r.unless)===null); })) return null;   // scored as harmful already
  var fid=FIX_ALIAS[id]||id, own=(c.unneededWhy||{})[id];
  var fixers=(c.problems||[]).filter(function(p){ return (p.fixedBy||[]).indexOf(fid)>=0; });
  if(fixers.length){
    var live=fixers.some(function(p){ var st=run.probs[p.id]; return st && !st.fixed && (st.active || p.preventable); });
    if(live) return null;
    var treated=fixers.some(function(p){ var st=run.probs[p.id]; return st && st.fixed; });
    return own || (treated ? 'Nothing needed it at that moment: what it treats had already been treated.' : 'Nothing needed it at that moment: the problem it treats was not there.');
  }
  var used=['critical','good'].some(function(g){ return (c[g]||[]).some(function(r){ return anyOf(r.any).indexOf(id)>=0; }); }) || (c.allowed||[]).indexOf(id)>=0;
  return used ? null : (own || 'This patient had no reason for it.');
}
/* Weight-based doses the student works out. perKg can depend on the weight (artesunate is 3 mg/kg under 20 kg). */
var DOSES={
  artesunate:   { name:'IV/IM artesunate', unit:'mg', perKg:function(kg){ return kg<20?3:2.4; } },
  artesunate_pr:{ name:'rectal artesunate', unit:'mg', perKg:10 },
  dextrose10:   { name:'10% dextrose', unit:'mL', perKg:5 },
  blood:        { name:'whole blood', unit:'mL', perKg:20 },
  blood_oneg:   { name:'O-negative red cells', unit:'mL', perKg:10 },
  ns_bolus:     { name:'0.9% saline bolus', unit:'mL', perKg:20 },
  benzo:        { name:'rectal diazepam', unit:'mg', perKg:0.5 }
};
function weightKg(c){ var m=/([\d.]+)\s*kg/i.exec(String((c.patient||{}).weight||'')); return m?Number(m[1]):null; }
function doseInfo(c, id){
  var d=DOSES[id], kg=weightKg(c); if(!c.phase1 || !d || !kg) return null;
  var per=typeof d.perKg==='function'?d.perKg(kg):d.perKg;
  return { id:id, name:d.name, unit:d.unit, perKg:per, kg:kg, right:Math.round(per*kg*10)/10 };
}
function doseCheck(c, id, given){
  var d=doseInfo(c, id), g=Number(given); if(!d || !isFinite(g)) return null;
  var err=Math.abs(g-d.right)/d.right;
  d.given=g; d.band=err<=0.10?'full':(err<=0.25?'half':'wrong');
  return d;
}
function givenText(d){ return 'Given: '+d.given+' '+d.unit+' of '+d.name+'.'; }
/* The rechecks the case expects, and whether the student did them on time. */
function rechecks(c, run){
  return (c.recheck||[]).map(function(r){
    var base=r.afterAction ? firstTime(run, anyOf([r.afterAction])) : ((run.done[r.test]||[])[0]);
    if(base==null) return null;
    var due=base+r.after, ts=(run.done[r.test]||[]).filter(function(t){ return t>base && t>=due-RECHECK_EARLY && t<=due+RECHECK_LATE; });
    var later=(run.done[r.test]||[]).some(function(t){ return t>base; });
    return { id:r.id, test:r.test, label:r.label, why:r.why||'', dueAt:due, done:ts.length>0, doneAt:ts.length?ts[0]:null, due:run.t>=due-RECHECK_EARLY && !later };
  }).filter(Boolean);
}
/* First move on arrival. */
var FIRST_OPTS=[ { id:'abc', label:'Oxygen and the airway', tab:'treat' }, { id:'history', label:'Take a history', tab:'talk' },
  { id:'bloods', label:'Send bloods', tab:'tests' }, { id:'senior', label:'Call the consultant', tab:'team' } ];
function firstMove(c, run, choice){
  var fm=c.firstMove, o=FIRST_OPTS.filter(function(x){ return x.id===choice; })[0];
  if(!fm || !o || run.first || run.ended) return null;
  rec(run, { k:'first', id:choice });
  var right=choice===fm.correct, best=FIRST_OPTS.filter(function(x){ return x.id===fm.correct; })[0], why=(fm.why||{})[choice]||'';
  run.first={ choice:choice, right:right, t:run.t };
  log(run, 'first', 'First move: '+o.label+'. '+(right?'Right call. ':'Not first. ')+why);
  if(!right) tick(c, run, 1);   // the right pick saves the minute a wrong start costs
  return { right:right, why:why, tab:best.tab, best:best.label };
}
/* The handover: 4 parts, 3 lines each (right, incomplete, wrong). "What was done" is built from the student's own run. */
var HO_PARTS=[ ['situation','Situation'], ['done','What was done'], ['now','Now'], ['watch','Watch for'] ];
function lc(s){ return s ? s.charAt(0).toLowerCase()+s.slice(1) : s; }
function handoverParts(c, run){
  var h=c.handover; if(!h) return [];
  var rows=pathCompare(c, run).rows, did=rows.filter(function(r){ return r.yours!==null; }), miss=rows.filter(function(r){ return r.yours===null; });
  var list=function(rs){ return rs.map(function(r){ return lc(r.label); }).join('; '); };
  var done={ right: did.length ? 'Done: '+list(did)+'.' : 'Nothing given yet. Seen and examined only.',
    incomplete: did.length>=2 ? 'Done: '+lc(did[0].label)+'.' : 'Seen and examined, bloods sent.',
    wrong: miss.length ? 'Done: '+list(rows)+'.' : 'Nothing given yet, we are waiting for the results.' };
  if(done.incomplete===done.right) done.incomplete='Seen and examined.';
  var st=status(c, run), v=run.v, vit='HR '+Math.round(v.hr)+', BP '+Math.round(v.sbp)+'/'+Math.round(v.dbp)+', SpO₂ '+Math.round(v.spo2)+'%, GCS '+Math.round(v.gcs);
  var now={ right: st.stable ? 'Stable now: '+vit+'.' : 'Still unstable: '+vit+'. '+(st.cues.concat(st.warn)[0]||''),
    incomplete:'Settling.', wrong: st.stable ? 'Crashing: needs intubation now.' : 'Stable, nothing to worry about.' };
  var src={ situation:h.situation, done:done, now:now, watch:h.watch }, seed=((c.variant&&c.variant.seed)||1)>>>0;
  return HO_PARTS.map(function(p, i){
    var s=src[p[0]]||{}, opts=[s.right, s.incomplete, s.wrong].map(function(t){ return String(t||'').trim(); }), r=rng(seed+i*7919), order=[0,1,2];
    for(var j=2;j>0;j--){ var k=Math.floor(r()*(j+1)), x=order[j]; order[j]=order[k]; order[k]=x; }
    return { id:p[0], label:p[1], right:opts[0], options:order.map(function(o){ return opts[o]; }) };
  });
}
function handoverScore(c, run){
  var ho=run.handover, parts=handoverParts(c, run), keys=(c.handover&&c.handover.keys)||{};
  if(!ho) return { right:0, note:'No handover was given.' };
  var miss=[], right=0, txt=String(ho.text||'').toLowerCase();
  parts.forEach(function(p){
    var ok = ho.text!=null ? (keys[p.id]||[]).some(function(k){ return txt.indexOf(String(k).toLowerCase())>=0; }) : (ho.picks||{})[p.id]===p.right;
    if(ok) right++; else miss.push(p.label+(ho.text!=null?'':': '+p.right));
  });
  return { right:right, note:miss.length ? (ho.text!=null?'Missing: ':'Better: ')+miss.join(' · ') : 'A clear, complete handover.' };
}
/* Replay. applyStep plays one recorded step; replay() rebuilds a run up to (not past) a minute. */
function applyStep(c, run, s){
  if(s.k==='act') return act(c, run, s.id, s.dose!=null?{ dose:s.dose }:null);
  if(s.k==='ask') return ask(c, run, s.id);
  if(s.k==='exam') return examine(c, run, s.id);
  if(s.k==='wait') return wait(c, run, s.m);
  if(s.k==='free') return freeAsk(c, run, s.q, s.reply, s.about);
  if(s.k==='first') return firstMove(c, run, s.id);
}
function replay(c, steps, upto){
  var run=newRun(c);
  for(var i=0;i<(steps||[]).length;i++){
    var trial=clone(run); applyStep(c, trial, steps[i]);
    if(trial.t>upto || trial.ended) break;
    run=trial;
  }
  run.startedAt=Date.now();
  return run;
}
/* Where "Try again from N min" restarts: 2 minutes before the first late or missed step was due. */
function replayPoint(c, run){
  if(!run.steps || !run.steps.length) return null;
  var row=pathCompare(c, run).rows.filter(function(r){ return r.status!=='on-time' && r.by!=null; })[0];
  if(!row) return null;
  var r=replay(c, run.steps, Math.max(0, row.by-2));
  return { label:row.label, at:r.t, run:r };
}
/* Clinical points (the same system as Clinical Simulation, clinsim.js): case % after deductions x harder-start
   bonuses / 10, with the case's difficulty and context. Replays earn half. */
function bonusOf(c, run){
  var v=c.variant||{}, x=1, notes=[], add=0;
  if(v.severityId==='late'){ x*=1.25; notes.push('brought in late ×1.25'); }
  if(v.night){ x*=1.25; notes.push('night shift ×1.25'); }
  var cb=curveball(c, run); if(cb && cb.fixed && cb.response<=15){ add=10; notes.push('complication handled within 15 min +10'); }
  return { x:x, add:add, notes:notes };
}
function clinicalPoints(pct, o){
  o=o||{}; var p=Math.max(0, Math.min(100, o.unsafe?Math.min(pct,40):pct))+(o.add||0);
  var DIFF={ Beginner:1, Foundation:1, Core:1.25, Advanced:1.5 };
  return Math.round(p*(DIFF[o.diff]||1.25)*1.1*(o.x||1)*(o.mode==='practice'?0.5:1)/10);
}
/* Learning points this particular run earned (dose slips, uncrossmatched blood). */
function extraTeaching(c, run){
  var out=[];
  (run.doses||[]).forEach(function(d){ if(d.band!=='full') out.push('Dose check, '+d.name+': '+d.perKg+' '+d.unit+'/kg × '+d.kg+' kg = '+d.right+' '+d.unit+'. You gave '+d.given+' '+d.unit+'. Write the sum down before you draw it up.'); });
  if(run.oneg) out.push('Uncrossmatched O-negative blood is for a patient who will die before crossmatched blood is ready. It can still cause a transfusion reaction (fever, rigors, a fall in blood pressure, dark urine): stop the transfusion, keep the line open with saline, recheck the patient and the bag, and tell the lab.');
  return out;
}

var ENGINE={ CATALOG:CATALOG, BYID:BYID, EXAM:EXAM, SETTINGS:SETTINGS, DISPOSITIONS:DISPOSITIONS, VITAL_KEYS:VITAL_KEYS,
  newRun:newRun, act:act, ask:ask, examine:examine, wait:wait, tick:tick, score:score, finish:finish, status:status,
  matchHistory:matchHistory, available:available, fmtDur:fmtDur, examFinding:examFinding,
  instantiate:instantiate, branching:branching, variantOpts:variantOpts, pathCompare:pathCompare, curveball:curveball, rng:rng,
  freeAsk:freeAsk, doseInfo:doseInfo, doseCheck:doseCheck, DOSES:DOSES, rechecks:rechecks, bloodLock:bloodLock, FIRST_OPTS:FIRST_OPTS, firstMove:firstMove,
  handoverParts:handoverParts, handoverScore:handoverScore, replay:replay, replayPoint:replayPoint, bonusOf:bonusOf, clinicalPoints:clinicalPoints,
  extraTeaching:extraTeaching, byOf:byOf, TIER_PTS:TIER_PTS };
root.ERSIM_ENGINE=ENGINE;
if(typeof module!=='undefined' && module.exports) module.exports=ENGINE;

/* ==================================================================== UI */
if(typeof document==='undefined') return;

function cases(){ return root.ERSIM_CASES||[]; }
function caseById(id){ return cases().filter(function(c){ return c.id===id; })[0]||null; }
function e(s){ return String(s==null?'':s).replace(/[&<>"']/g,function(ch){ return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[ch]; }); }
function on(){ try{ var C=root.MEDBANK_CONFIG||{}; if(C.FEATURES&&C.FEATURES.ER_SIM) return true; if(root.MB_CLINSIM&&root.MB_CLINSIM.on()) return true; return root.localStorage&&localStorage.mbersim==='1'; }catch(_){ return false; } }   // also on inside Clinical Simulation (clinsim.js)
/* Patient cases: the branching cases, opened from Mega Qbank for 400-600 level. FEATURES.PATIENT_CASES (default false),
   or localStorage.mbcases='1' on your own device. They play in this simulator but don't switch the rest of ER Sim on. */
/* Owner preview: opening the app with ?mbcases=1 (or #...?mbcases=1) switches Patient cases on for this device only,
   whatever the account's level; ?mbcases=0 switches it off again. Students never get the link, and the flag stays off. */
(function(){ try{ var m=/[?&]mbcases=([01])/.exec(String(root.location&&(root.location.search+root.location.hash)||'')); if(m){ if(m[1]==='1') localStorage.mbcases='1'; else localStorage.removeItem('mbcases'); } }catch(_){} })();
function preview(){ try{ return root.localStorage&&localStorage.mbcases==='1'; }catch(_){ return false; } }
function casesOn(){ try{ var C=root.MEDBANK_CONFIG||{}; if(C.FEATURES&&C.FEATURES.PATIENT_CASES) return true; return preview(); }catch(_){ return false; } }
function clinicalLevel(){
  var l=null;
  try{ l=root.MB_SYNC&&root.MB_SYNC.currentLevel&&root.MB_SYNC.currentLevel(); }catch(_){}
  try{ if(!l && localStorage.mbclinsimlevel) l=localStorage.mbclinsimlevel; }catch(_){}   // testing on a device with no account
  return [400,500,600].indexOf(Number(l))>=0;
}
function branchCases(){ return cases().filter(function(c){ return ENGINE.branching(c); }); }
/* Phase 1 rules for Patient cases (see the engine): FEATURES.CASES_PHASE1 (default false), or the owner preview (?mbcases=1). */
function p1On(){ try{ var C=root.MEDBANK_CONFIG||{}; if(C.FEATURES&&C.FEATURES.CASES_PHASE1) return true; return preview(); }catch(_){ return false; } }
function deal(c, opts){ var x=ENGINE.instantiate(c, opts); if(x!==c && ENGINE.branching(c) && p1On()) x.phase1=true; return x; }
function levelNum(){
  var l=null;
  try{ l=root.MB_SYNC&&root.MB_SYNC.currentLevel&&root.MB_SYNC.currentLevel(); }catch(_){}
  try{ if(!l && localStorage.mbclinsimlevel) l=localStorage.mbclinsimlevel; }catch(_){}
  l=Number(l); return isFinite(l)&&l>0 ? l : null;
}
/* Nurse warning by level (option D): 300-400 a pause card (A), 500 an alarm that does not pause (B), 600 only the picture
   and a speech bubble (C). With no level known it uses A, the easiest to notice. */
function nurseMode(){ var l=levelNum(); return l==null||l<=400 ? 'A' : (l<600 ? 'B' : 'C'); }
function advanced(){ var l=levelNum(); return l!=null && l>=500; }   // dose box shows only the weight
function typedHandover(){ var l=levelNum(); return l!=null && l>=600; }
function backHref(){ return on() ? '#/ersim' : '#/mega'; }

var RUN=null, CASE=null, TAB='talk', CHAT=[], BUSY=false, DEBRIEF=null, FILTER='all', LAST=null;
var DOSEQ=null, TXQ='', SHOWN_T=0, FIRSTMSG=null, BUBBLE={};   // phase 1: open dose box, Treat search, last clock drawn, first-move feedback, nurse bubbles shown
var RUN_KEY='mb_ersim_run';
function saveRun(){ try{ if(RUN&&!RUN.ended) localStorage.setItem(RUN_KEY, JSON.stringify({ run:RUN, chat:CHAT })); else localStorage.removeItem(RUN_KEY); }catch(_){} }
function loadRun(id){ try{ var o=JSON.parse(localStorage.getItem(RUN_KEY)||'null'); if(o&&o.run&&o.run.caseId===id&&!o.run.ended){ RUN=o.run; CHAT=o.chat||[]; return true; } }catch(_){} return false; }

var SCRATCH={ runs:[] };
function store(){ /* DATA is a top-level `let` in app.html, so it is not on window */ var D=(typeof DATA!=='undefined')?DATA:null; if(!D) return SCRATCH; if(!D.ersim) D.ersim={ runs:[] }; if(!D.ersim.runs) D.ersim.runs=[]; return D.ersim; }
function bestFor(id){ var b=null; store().runs.forEach(function(r){ if(r.caseId===id && (b===null||r.pct>b)) b=r.pct; }); return b; }
function recordRun(sc){
  var s=store(), row={ caseId:CASE.id, pct:sc.pct, grade:sc.grade, minutes:sc.minutes, outcome:RUN.outcome, at:new Date().toISOString() };
  if(CASE.phase1){ var b=ENGINE.bonusOf(CASE, RUN); if(b.x!==1) row.x=b.x; if(b.add) row.add=b.add; if(RUN.replay) row.mode='practice'; }   // read by clinsim.js allRuns()
  s.runs.push(row);
  if(s.runs.length>200) s.runs=s.runs.slice(-200);
  try{ if(typeof root.persist==='function') root.persist(); }catch(_){}
}

function css(){
  if(document.getElementById('ersCss')) return;
  var st=document.createElement('style'); st.id='ersCss';
  st.textContent=[
  '.ers-lobby .ers-grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(260px,1fr));gap:12px;margin-top:14px}',
  '.ers-case{background:var(--card);border:1px solid var(--line);border-radius:14px;padding:14px;display:flex;flex-direction:column;gap:6px;cursor:pointer;text-align:left;font:inherit;color:var(--text)}',
  '.ers-case:hover,.ers-case:focus-visible{border-color:var(--accent)}',
  '.ers-case h3{margin:0;font-size:16px;line-height:1.3}',
  '.ers-meta{font-size:12.5px;color:var(--dim)}',
  '.ers-tag{display:inline-block;font-size:11px;font-weight:700;padding:2px 8px;border-radius:999px;background:var(--panel2);color:var(--accent);margin-right:6px}',
  '.ers-tag.tut{background:#e6f6f3;color:#0f766e}',
  '.ers-best{font-size:12px;font-weight:700;color:var(--recall-tx)}',
  '.ers-filter{display:flex;gap:6px;flex-wrap:wrap;margin-top:8px}',
  '.ers-chip{border:1px solid var(--line);background:var(--card);color:var(--text);border-radius:999px;padding:6px 12px;font:inherit;font-size:13px;cursor:pointer}',
  '.ers-chip[aria-pressed="true"]{background:var(--accent);color:#fff;border-color:var(--accent)}',
  '.ers-top{position:sticky;top:0;z-index:5;background:var(--bg);padding:8px 0 10px;margin:-8px 0 8px}',
  '.ers-pt{display:flex;justify-content:space-between;align-items:center;gap:8px;flex-wrap:wrap}',
  '.ers-pt b{font-size:15px}',
  '.ers-bed{margin-top:8px;max-width:760px}',
  '.ers-clock{font-variant-numeric:tabular-nums;font-weight:800;background:var(--panel2);border-radius:8px;padding:4px 10px;font-size:14px}',
  '.ers-mon{display:grid;grid-template-columns:repeat(6,1fr);gap:6px;margin-top:8px;background:#0e1420;border-radius:12px;padding:8px}',
  '.ers-vt{text-align:center;padding:4px 2px;border-radius:8px}',
  '.ers-vt small{display:block;font-size:10px;letter-spacing:.06em;color:#8aa0b8;font-weight:700}',
  '.ers-vt span{display:block;font-size:19px;font-weight:800;font-variant-numeric:tabular-nums;color:#7CF29A}',
  '.ers-vt.w span{color:#FFD166}.ers-vt.c span{color:#FF6B6B}',
  '.ers-vt.c{animation:ersb 1.2s infinite}@keyframes ersb{50%{background:rgba(255,107,107,.15)}}',
  '@media (prefers-reduced-motion:reduce){.ers-vt.c{animation:none}}',
  '.ers-status{margin-top:8px;font-size:13.5px;padding:8px 10px;border-radius:10px;background:var(--warnbg);border:1px solid var(--warnline);color:var(--warntx)}',
  '.ers-status.ok{background:var(--panel2);border-color:var(--line);color:var(--dim)}',
  '.ers-tabs{display:flex;gap:4px;overflow-x:auto;margin:10px 0 0;padding-bottom:2px;scrollbar-width:none}',
  '.ers-tab{flex:0 0 auto;border:0;background:var(--panel2);color:var(--text);padding:8px 14px;border-radius:10px;font:inherit;font-size:14px;font-weight:700;cursor:pointer}',
  '.ers-tab[aria-selected="true"]{background:var(--accent);color:#fff}',
  '.ers-body{display:grid;grid-template-columns:minmax(0,1fr) 320px;gap:14px}',
  '@media (max-width:860px){.ers-body{grid-template-columns:1fr}.ers-top{position:static;margin:0 0 8px;padding-top:0}}',
  /* The top (patient, picture, monitor, tabs) only sticks when the screen is tall enough to show the panels under it too.
     On a shorter screen a sticky top covered the whole window, so the tabs seemed dead and the page would not scroll. */
  '@media (max-height:1300px){.ers-top{position:static;margin:0 0 8px}}',
  '.ers-bed{width:min(100%, calc((100vh - 330px) * 1.79))}',
  '.ers-minihost{position:sticky;top:0;height:0;z-index:30}',
  '.ers-mini{position:absolute;left:0;right:0;top:0;display:grid;grid-template-columns:min(var(--ers-mini-w),32vw) minmax(0,1fr);gap:12px;align-items:start;background:var(--bg);padding:46px 0 10px;box-shadow:0 10px 18px -14px rgba(40,20,80,.45);opacity:0;transform:translateY(-12px);pointer-events:none;transition:opacity .18s,transform .18s}',
  '.ers-mini.show{opacity:1;transform:none;pointer-events:auto}.ers-mini.nopic{grid-template-columns:1fr}',
  '.ers-mini-pic{width:100%;aspect-ratio:1206/674;object-fit:cover;border-radius:10px;border:1px solid var(--line);display:block}',
  '.ers-mini-h{font-size:13px;line-height:1.3}.ers-mini .ers-mon{margin-top:4px;padding:5px;gap:4px}.ers-mini .ers-vt span{font-size:16px}',
  '.ers-mini .ers-status{margin-top:5px;padding:5px 9px;font-size:12.5px}.ers-mini .ers-tabs{margin-top:6px}.ers-mini .ers-tab{padding:6px 11px;font-size:13px}',
  '@media (max-width:600px){.ers-mini{padding-top:60px}.ers-mini .ers-status,.ers-mini-h .ers-meta{display:none}.ers-mini .ers-vt small{font-size:9px}.ers-mini .ers-vt span{font-size:13px}.ers-mini{gap:8px}}',
  '@media (prefers-reduced-motion:reduce){.ers-mini{transition:none}}',
  '.ers-panel{background:var(--card);border:1px solid var(--line);border-radius:14px;padding:14px}',
  '.ers-panel h4{margin:14px 0 8px;font-size:12px;letter-spacing:.06em;text-transform:uppercase;color:var(--dim)}',
  '.ers-panel h4:first-child{margin-top:0}',
  '.ers-acts{display:grid;grid-template-columns:repeat(auto-fill,minmax(220px,1fr));gap:6px}',
  '.ers-act{text-align:left;border:1px solid var(--line);background:var(--panel);color:var(--text);border-radius:10px;padding:9px 11px;font:inherit;font-size:13.5px;cursor:pointer;line-height:1.35}',
  '.ers-act:hover:not(:disabled),.ers-act:focus-visible{border-color:var(--accent)}',
  '.ers-act small{display:block;color:var(--dim);font-size:12px;margin-top:2px}',
  '.ers-act.done{background:var(--panel2)}',
  '.ers-act.done::after{content:" ✓";color:var(--recall-tx);font-weight:800}',
  '.ers-act:disabled{opacity:.45;cursor:not-allowed}',
  '.ers-chat{display:flex;flex-direction:column;gap:8px;max-height:340px;overflow:auto;padding:2px}',
  '.ers-msg{max-width:88%;padding:8px 11px;border-radius:12px;font-size:14px;line-height:1.45}',
  '.ers-msg.me{align-self:flex-end;background:var(--accent);color:#fff;border-bottom-right-radius:4px}',
  '.ers-msg.pt{align-self:flex-start;background:var(--panel2);border-bottom-left-radius:4px}',
  '.ers-msg.sys{align-self:center;font-size:12.5px;color:var(--dim);background:none}',
  '.ers-ask{display:flex;gap:6px;margin-top:10px}',
  '.ers-ask input{flex:1;min-width:0;border:1px solid var(--line);border-radius:10px;padding:10px;font:inherit;font-size:14px;background:var(--panel);color:var(--text)}',
  '.ers-qs{display:flex;flex-wrap:wrap;gap:6px}',
  '.ers-q{border:1px solid var(--line);background:var(--panel);color:var(--text);border-radius:999px;padding:6px 11px;font:inherit;font-size:13px;cursor:pointer}',
  '.ers-q.asked{opacity:.55}',
  '.ers-find{font-size:14px;line-height:1.5;margin:0 0 10px;padding:8px 10px;border-left:3px solid var(--accent);background:var(--panel2);border-radius:0 8px 8px 0}',
  '.ers-log{font-size:13px;line-height:1.45;max-height:520px;overflow:auto}',
  '.ers-log div{padding:6px 0;border-bottom:1px dashed var(--line)}',
  '.ers-log time{font-variant-numeric:tabular-nums;font-weight:800;color:var(--dim);margin-right:6px}',
  '.ers-log .k-event{color:var(--badtx);font-weight:700}.ers-log .k-result{color:var(--recall-tx)}',
  '.ers-res{font-size:13.5px;margin:0 0 6px}',
  '.ers-res b{display:block}',
  '.ers-hint{margin-top:10px;font-size:13.5px;padding:9px 11px;border-radius:10px;background:#e6f6f3;color:#0f5f58;border:1px solid #b5e3db}',
  'html[data-theme="dark"] .ers-hint{background:#0f2e2a;color:#9be8dc;border-color:#1f5a52}',
  'html[data-theme="dark"] .ers-tag.tut{background:#0f2e2a;color:#5eead4}',
  '.ers-opts{display:grid;gap:6px}',
  '.ers-opt{display:flex;gap:8px;align-items:flex-start;border:1px solid var(--line);border-radius:10px;padding:9px 11px;cursor:pointer;font-size:14px}',
  '.ers-opt:has(input:checked){border-color:var(--accent);background:var(--panel2)}',
  '.ers-score{display:flex;align-items:center;gap:16px;flex-wrap:wrap}',
  '.ers-ring{width:96px;height:96px;border-radius:50%;display:grid;place-items:center;font-size:26px;font-weight:800}',
  '.ers-items{list-style:none;padding:0;margin:0}',
  '.ers-items li{display:flex;gap:10px;padding:8px 0;border-bottom:1px solid var(--line);font-size:14px}',
  '.ers-items .pt{margin-left:auto;font-weight:800;font-variant-numeric:tabular-nums;white-space:nowrap}',
  '.ers-items .n{display:block;color:var(--dim);font-size:12.5px;margin-top:2px}',
  '.ers-teach li{margin-bottom:6px;font-size:14px;line-height:1.5}',
  '.ers-tag.night{background:#1e2a4a;color:#dfe6ff}',
  '.ers-path{display:grid;font-size:13.5px}',
  '.ers-path-h,.ers-path-r{display:grid;grid-template-columns:minmax(0,2fr) minmax(0,1fr) minmax(0,1fr);gap:8px;padding:8px 0;border-bottom:1px solid var(--line)}',
  '.ers-path-h{font-size:11px;letter-spacing:.06em;text-transform:uppercase;color:var(--dim);font-weight:700}',
  '.ers-path-r.late span:last-child{color:var(--warntx);font-weight:700}.ers-path-r.missed span:last-child{color:var(--badtx);font-weight:700}',
  /* phase 1 (Patient cases) */
  '.ers-clock{position:relative}.ers-dt{position:absolute;right:-6px;top:-12px;font-size:11px;font-weight:800;background:var(--accent);color:#fff;border-radius:999px;padding:1px 6px;animation:ersDt 1.6s ease-out forwards}',
  '@keyframes ersDt{0%{transform:translateY(6px);opacity:0}15%{transform:none;opacity:1}75%{opacity:1}100%{opacity:0;transform:translateY(-6px)}}',
  '.ers-last{font-weight:700}.ers-last.ab{color:var(--badtx)}.ers-last.ok{color:var(--recall-tx)}',
  '.ers-due{display:inline-block;margin-top:4px;font-size:11px;font-weight:800;padding:2px 8px;border-radius:999px;background:var(--warnbg);color:var(--warntx);border:1px solid var(--warnline)}',
  '.ers-txs{width:100%;box-sizing:border-box;border:1px solid var(--line);border-radius:10px;padding:10px;font:inherit;font-size:14px;background:var(--panel);color:var(--text);margin-bottom:4px}',
  '.ers-dose{border:2px solid var(--accent);border-radius:12px;padding:12px;margin-bottom:12px;background:var(--panel2)}',
  '.ers-dose p{margin:6px 0;font-size:14.5px}.ers-dose form{display:flex;gap:6px;align-items:center;flex-wrap:wrap}',
  '.ers-dose input{width:110px;border:1px solid var(--line);border-radius:10px;padding:9px;font:inherit;font-size:15px;background:var(--card);color:var(--text)}',
  '.ers-first .ers-acts{grid-template-columns:repeat(auto-fill,minmax(180px,1fr))}.ers-first .ers-act{font-weight:700;padding:12px}',
  '.ers-ho{margin-bottom:10px}.ers-ho>b{display:block;font-size:13px;margin-bottom:4px}',
  '.ers-hotxt{width:100%;box-sizing:border-box;border:1px solid var(--line);border-radius:10px;padding:10px;font:inherit;font-size:14px;background:var(--panel);color:var(--text)}',
  '.ers-nurse-ov{position:fixed;inset:0;z-index:80;background:rgba(20,10,40,.55);display:grid;place-items:center;padding:16px}',
  '.ers-nurse-card{background:var(--card);color:var(--text);border-radius:16px;padding:18px;max-width:420px;width:100%;box-shadow:0 18px 40px rgba(0,0,0,.3);border-top:6px solid var(--badtx)}',
  '.ers-nurse-h{font-weight:800;font-size:15px}.ers-nurse-card p{font-size:16px;line-height:1.45;margin:10px 0 14px}',
  '.ers-alarmstrip{background:#ffe1e1;border-color:#ff8a8a;color:#8a1010;animation:ersStrip .9s steps(2) infinite}',
  'html[data-theme="dark"] .ers-alarmstrip{background:#4a1414;border-color:#a33;color:#ffd6d6}',
  '@keyframes ersStrip{50%{background:var(--card)}}',
  '.ers-reddot{position:absolute;top:10px;left:10px;width:18px;height:18px;border-radius:50%;background:#ff3b3b;box-shadow:0 0 0 4px rgba(255,59,59,.35);animation:ersDot 1s infinite;z-index:3}',
  '@keyframes ersDot{50%{box-shadow:0 0 0 10px rgba(255,59,59,0)}}',
  '.ers-bubble{position:absolute;left:4%;top:6%;max-width:62%;background:#fff;color:#222;border-radius:14px;padding:9px 12px;font-size:14px;line-height:1.35;box-shadow:0 6px 18px rgba(0,0,0,.25);z-index:3;animation:ersBub .6s ease-in forwards}',
  '.ers-bubble::after{content:"";position:absolute;left:24px;bottom:-9px;border:9px solid transparent;border-top-color:#fff;border-bottom:0}',
  '@keyframes ersBub{to{opacity:0;visibility:hidden}}',
  '.ers-off-unneeded{border-left-color:var(--warnline)}.ers-off-harmful{border-left-color:var(--warntx)}.ers-off-dangerous{border-left-color:var(--badtx)}',
  '@media (prefers-reduced-motion:reduce){.ers-dt,.ers-alarmstrip,.ers-reddot{animation:none}}',
  '@media (max-width:520px){.ers-path-h{display:none}.ers-path-r{grid-template-columns:1fr 1fr}.ers-path-r span:first-child{grid-column:1/-1;font-weight:700}.ers-path-r [data-k]::before{content:attr(data-k) ": ";color:var(--dim);font-weight:400}}'
  ].join('\n');
  if(root.ERSIM_SCENE) st.textContent+='\n'+root.ERSIM_SCENE.css;
  document.head.appendChild(st);
}

function draw(){ var m=document.getElementById('main'); if(!m) return; m.innerHTML=page(CASE?CASE.id:null); try{ if(root.renderNav) root.renderNav(); }catch(_){} watchMini(); txApply(); alertEffects();
  try{ if(document.getElementById('ersHoRead')) root.MB_ERSIM.hoRead(); var nb=document.querySelector('.ers-nurse-ov button'); if(nb) nb.focus(); }catch(_){} }

/* ---------- lobby */
function lobby(){
  var list=cases();
  var runs=store().runs, done={}; runs.forEach(function(r){ done[r.caseId]=1; });
  var avg=runs.length?Math.round(runs.reduce(function(s,r){ return s+r.pct; },0)/runs.length):null;
  var settingsOf=function(c){ return ENGINE.branching(c)&&(c.variants||[]).length ? c.variants.map(function(v){ return v.setting||c.setting; }) : [c.setting]; };
  var shown=list.filter(function(c){ return FILTER==='all'||settingsOf(c).indexOf(FILTER)>=0; });
  var h='<div class="ers-lobby"><h1>🚑 ER Sim</h1>'+
    '<p class="sub">You are the doctor on duty. A patient arrives. Take the history, examine, send tests, treat, call for help, then decide where they go. The patient gets better or worse depending on what you do and how fast you do it.</p>'+
    '<div class="ers-meta">'+list.length+' cases · '+Object.keys(done).length+' played'+(avg!==null?' · average score '+avg+'%':'')+'</div>'+
    '<div class="ers-filter" role="group" aria-label="Facility">'+
      [['all','All'],['phc','Primary Health Centre'],['gh','General Hospital'],['pv','Private Hospital'],['th','Teaching Hospital']].map(function(f){
        return '<button class="ers-chip" aria-pressed="'+(FILTER===f[0])+'" onclick="MB_ERSIM.filter(\''+f[0]+'\')">'+f[1]+'</button>'; }).join('')+
    '</div><div class="ers-grid">';
  shown.forEach(function(c){
    var b=bestFor(c.id);
    h+='<button class="ers-case" onclick="MB_ERSIM.open(\''+c.id+'\')">'+
      '<div>'+(c.tutorial?'<span class="ers-tag tut">Tutorial</span>':'')+(ENGINE.branching(c)?'<span class="ers-tag">🔀 Branching</span><span class="ers-tag">Varies</span>':'<span class="ers-tag">'+e(SETTINGS[c.setting].short)+'</span>')+'<span class="ers-tag">'+e(c.level||'')+'</span></div>'+
      '<h3>'+e(c.title)+'</h3>'+
      '<div class="ers-meta">'+(ENGINE.branching(c)&&(c.variants||[]).length?(c.variants.length+' different patients'):(e(c.patient.name)+', '+e(c.patient.age)+' '+e(c.patient.sex)))+'</div>'+
      (b!==null?'<div class="ers-best">Best: '+b+'%</div>':'<div class="ers-meta">Not played yet</div>')+
    '</button>';
  });
  h+='</div><p class="ers-meta" style="margin-top:16px">All patients are fictional. ER Sim is practice, not a clinical guideline. Check doses and protocols against your hospital and national guidelines.</p></div>';
  return h;
}

/* ---------- the shift */
function vt(label, val, cls){ return '<div class="ers-vt '+(cls||'')+'"><small>'+label+'</small><span>'+val+'</span></div>'; }
function band(k,v,age){
  var child=age<12;
  if(k==='hr'){ var hi=child?160:130; return v>hi+20||v<40?'c':(v>hi||v<55?'w':''); }
  if(k==='sbp'){ return v<80?'c':(v<95||v>170?'w':''); }
  if(k==='rr'){ var r=child?40:24; return v>r+12||v<8?'c':(v>r?'w':''); }
  if(k==='spo2'){ return v<88?'c':(v<94?'w':''); }
  if(k==='temp'){ return v>=40||v<35?'c':(v>=38?'w':''); }
  if(k==='gcs'){ return v<=8?'c':(v<15?'w':''); }
  return '';
}
function monitor(){
  var v=RUN.v, a=CASE.patient.ageYears||30;
  return '<div class="ers-mon" role="group" aria-label="Monitor">'+
    vt('HR',Math.round(v.hr),band('hr',v.hr,a))+
    vt('BP',Math.round(v.sbp)+'/'+Math.round(v.dbp),band('sbp',v.sbp,a))+
    vt('RR',Math.round(v.rr),band('rr',v.rr,a))+
    vt('SpO₂',Math.round(v.spo2)+'%',band('spo2',v.spo2,a))+
    vt('TEMP',v.temp.toFixed(1),band('temp',v.temp,a))+
    vt('GCS',Math.round(v.gcs),band('gcs',v.gcs,a))+
  '</div>';
}
/* Pinned mini bar: once the full picture and tabs scroll out of view, a compact bar pins to the top with a smaller
   picture, the monitor, the status line and the tabs, so the panels scroll underneath it. Width: MINI_W. */
var MINI_W=420;
function miniBar(st){
  var src=root.ERSIM_SCENE&&root.ERSIM_SCENE.currentSrc ? root.ERSIM_SCENE.currentSrc(CASE, RUN) : null;
  var mtab=function(id,label){ return '<button class="ers-tab" aria-selected="'+(TAB===id)+'" onclick="MB_ERSIM.miniTab(\''+id+'\')">'+label+'</button>'; };
  return '<div class="ers-minihost" aria-hidden="true"><div class="ers-mini'+(src?'':' nopic')+'" id="ersMini" style="--ers-mini-w:'+MINI_W+'px">'+
    (src?'<img class="ers-mini-pic'+(RUN.outcome==='died'?' ers-dead':'')+'" src="'+e(src)+'" alt="">':'')+
    '<div class="ers-mini-r"><div class="ers-mini-h"><b>'+e(CASE.patient.name)+'</b> <span class="ers-meta">'+e(SETTINGS[CASE.setting].short)+' · ⏱ '+RUN.t+' min</span></div>'+
    monitor()+'<div class="ers-status'+(st.stable?' ok':'')+'">'+(st.cues.concat(st.warn).map(e).join(' · ')||'No new concerns on the monitor.')+'</div>'+
    '<div class="ers-tabs">'+mtab('talk','💬 History')+mtab('exam','🩺 Examine')+mtab('tests','🧪 Tests')+mtab('treat','💉 Treat')+mtab('team','📞 Team')+mtab('decide','✅ Decide')+'</div></div></div></div>';
}
var MINI_OBS=null;
function watchMini(){
  try{
    if(MINI_OBS){ MINI_OBS.disconnect(); MINI_OBS=null; }
    var tabs=document.querySelector('.ers-top .ers-tabs'), bar=document.getElementById('ersMini');
    if(!tabs || !bar || !root.IntersectionObserver) return;
    MINI_OBS=new IntersectionObserver(function(es){ es.forEach(function(x){
      var gone=!x.isIntersecting && x.boundingClientRect.top<0;
      bar.classList.toggle('show', gone); bar.parentNode.setAttribute('aria-hidden', String(!gone));
    }); }, { threshold:0 });
    MINI_OBS.observe(tabs);
  }catch(_){}
}
function tabBtn(id,label){ return '<button class="ers-tab" role="tab" aria-selected="'+(TAB===id)+'" onclick="MB_ERSIM.tab(\''+id+'\')">'+label+'</button>'; }

function actBtn(id){
  var a=ENGINE.BYID[id]; if(!a) return '';
  var avail=available(a, CASE.setting), n=(RUN.done[id]||[]).length;
  var pend=RUN.pending.some(function(p){ return p.id===id; });
  var sub=a.dose||(a.cat==='tests'?(avail?'Result in '+fmtDur(a.tat):'Not available here'):(avail?'':'Not available here'));
  if(pend) sub='Waiting for result…';
  var lock=null, extra='';
  if(CASE.phase1){   // 5: every button shows what it costs on the case clock; 8: a test shows its last result
    var tat=(CASE.tat&&CASE.tat[id])||a.tat;
    if(a.cat==='tests') sub=!avail?'Not available here':(pend?'Waiting for result… back in '+fmtDur(Math.max(0,(RUN.pending.filter(function(p){ return p.id===id; })[0].ready-RUN.t))):'1 min · result in '+fmtDur(tat));
    else if(avail){ var dose=(ENGINE.DOSES[id]&&advanced())?'':(a.dose||''); sub=(dose?dose+' · ':'')+(a.min||1)+' min'; }
    if(avail && !RUN.ended){ lock=ENGINE.bloodLock(CASE, RUN, id); if(lock){ var gx=RUN.pending.filter(function(p){ return p.id==='gxm'; })[0]; sub=gx?'Waiting for the crossmatch, back in about '+fmtDur(Math.max(1,gx.ready-RUN.t)):'Send a group and crossmatch first'; } }
    var res=RUN.results[id];
    if(res){ var ab=/LOW|HIGH|POSITIVE|VERY|raised|\(high\)/.test(res.text); extra+='<small class="ers-last '+(ab?'ab':'ok')+'">Last, at '+res.t+' min: '+e(res.text.length>70?res.text.slice(0,68)+'…':res.text)+'</small>'; }
    if(a.cat==='tests' && !pend && ENGINE.rechecks(CASE, RUN).some(function(r){ return r.test===id && r.due; })) extra+='<span class="ers-due">Recheck due</span>';
  }
  return '<button class="ers-act'+(n?' done':'')+'" data-l="'+e(a.label.toLowerCase())+'" '+(avail&&!pend&&!lock&&!RUN.ended?'':'disabled')+' onclick="MB_ERSIM.act(\''+id+'\')">'+e(a.label)+(n>1?' ×'+n:'')+(sub?'<small>'+e(sub)+'</small>':'')+extra+'</button>';
}
function groupActs(cat){ return CATALOG.filter(function(a){ return a.cat===cat && (!a.p1 || CASE.phase1); }).map(function(a){ return actBtn(a.id); }).join(''); }

function talkPanel(){
  var who=CASE.speaker||'the patient';
  var h='<h4>Talk to '+e(who)+'</h4><div class="ers-chat" id="ersChat" aria-live="polite">';
  if(!CHAT.length) h+='<div class="ers-msg sys">'+e(CASE.arrival||'')+'</div>';
  CHAT.forEach(function(m){ h+='<div class="ers-msg '+m.who+'">'+e(m.text)+'</div>'; });
  h+='</div><form class="ers-ask" onsubmit="event.preventDefault();MB_ERSIM.askFree()"><input id="ersQ" autocomplete="off" placeholder="Ask anything, in your own words…" aria-label="Your question" '+(RUN.ended?'disabled':'')+'><button class="btn primary" '+(RUN.ended||BUSY?'disabled':'')+'>'+(BUSY?'…':'Ask')+'</button></form>';
  h+='<h4>Or pick a question</h4><div class="ers-qs">';
  (CASE.history||[]).forEach(function(q){ h+='<button class="ers-q'+(RUN.asked[q.id]!==undefined?' asked':'')+'" '+(RUN.ended?'disabled':'')+' onclick="MB_ERSIM.ask(\''+q.id+'\')">'+e(q.q)+'</button>'; });
  return h+'</div>';
}
function examPanel(){
  var h='<h4>Examine</h4><div class="ers-acts">';
  EXAM.forEach(function(x){
    if((x.id==='obstetric'||x.id==='local') && !(CASE.exam||{})[x.id]) return;
    h+='<button class="ers-act'+(RUN.examined[x.id]!==undefined?' done':'')+'" '+(RUN.ended?'disabled':'')+' onclick="MB_ERSIM.exam(\''+x.id+'\')">'+e(x.label)+'<small>'+x.min+' min</small></button>';
  });
  h+='</div><h4>Findings</h4>';
  var any=false;
  EXAM.forEach(function(x){ if(RUN.examined[x.id]!==undefined){ any=true; h+='<p class="ers-find"><b>'+e(x.label)+':</b> '+e(ENGINE.examFinding(CASE,RUN,x.id))+'</p>'+(root.ERSIM_SCENE&&root.ERSIM_SCENE.closeups?root.ERSIM_SCENE.closeups(CASE, x.id):''); } });
  return h+(any?'':'<p class="ers-meta">Nothing examined yet.</p>');
}
function testsPanel(){
  var bedside=['rbg','mrdt','pcv','urinalysis','upt','wbct20','cholera_rdt','fetal_heart'];
  var h='<h4>Bedside</h4><div class="ers-acts">'+bedside.map(actBtn).join('')+'</div><h4>Laboratory and imaging</h4><div class="ers-acts">'+
    CATALOG.filter(function(a){ return a.cat==='tests'&&bedside.indexOf(a.id)<0; }).map(function(a){ return actBtn(a.id); }).join('')+'</div>';
  return h+resultsBlock();
}
function resultsBlock(){
  var h='<h4>Results</h4>';
  var ids=Object.keys(RUN.results);
  if(!ids.length && !RUN.pending.length) return h+'<p class="ers-meta">No results yet.</p>';
  ids.forEach(function(id){ h+='<p class="ers-res"><b>'+e(ENGINE.BYID[id].label)+' · '+RUN.results[id].t+' min</b>'+e(RUN.results[id].text)+'</p>'; });
  RUN.pending.forEach(function(p){ h+='<p class="ers-res ers-meta">'+e(ENGINE.BYID[p.id].label)+': back in about '+fmtDur(p.ready-RUN.t)+'</p>'; });
  return h;
}
function treatPanel(){
  if(!CASE.phase1) return '<h4>Airway, breathing, circulation and procedures</h4><div class="ers-acts">'+groupActs('abc')+'</div><h4>Fluids and blood</h4><div class="ers-acts">'+groupActs('fluids')+'</div><h4>Drugs</h4><div class="ers-acts">'+groupActs('drugs')+'</div>';
  var g=function(t, cat){ return '<div class="ers-txg"><h4>'+t+'</h4><div class="ers-acts">'+groupActs(cat)+'</div></div>'; };
  return doseBox()+'<input class="ers-txs" id="ersTxs" type="search" autocomplete="off" placeholder="Search treatments, e.g. artes" aria-label="Search treatments" value="'+e(TXQ)+'" oninput="MB_ERSIM.txFilter(this.value)">'+
    g('Airway, breathing, circulation and procedures','abc')+g('Fluids and blood','fluids')+g('Drugs','drugs')+'<p class="ers-meta" id="ersTxNone" hidden>No treatment matches. Try another word.</p>';
}
/* 3: work out the dose. Beginners see the formula; 500 level and up see only the weight. */
function doseBox(){
  if(!DOSEQ) return '';
  var d=ENGINE.doseInfo(CASE, DOSEQ); if(!d){ DOSEQ=null; return ''; }
  var who=e(String(CASE.patient.name||'The patient').split(' ')[0]), nm=e(d.name);
  var q=advanced() ? who+' weighs '+d.kg+' kg. How many '+d.unit+' of '+nm+'?' : who+' weighs '+d.kg+' kg. '+nm.charAt(0).toUpperCase()+nm.slice(1)+' is '+d.perKg+' '+d.unit+'/kg. How many '+d.unit+'?';
  return '<div class="ers-dose" id="ersDose" role="group" aria-label="Work out the dose"><b>'+e(ENGINE.BYID[DOSEQ].label)+'</b><p>'+q+'</p>'+
    (advanced()?'':'<p class="ers-meta">'+d.kg+' kg × '+d.perKg+' '+d.unit+'/kg = ?</p>')+
    '<form onsubmit="event.preventDefault();MB_ERSIM.doseGive()"><input id="ersDoseIn" type="number" inputmode="decimal" step="any" min="0" aria-label="Dose in '+d.unit+'"> <span>'+d.unit+'</span> '+
    '<button class="btn primary">Give</button> <button type="button" class="btn" onclick="MB_ERSIM.doseCancel()">Cancel</button></form></div>';
}
function txApply(){
  try{
    var box=document.getElementById('ersTxs'); if(!box) return;
    var q=TXQ.trim().toLowerCase(), any=false;
    document.querySelectorAll('.ers-txg').forEach(function(gr){
      var n=0; gr.querySelectorAll('.ers-act').forEach(function(b){ var hit=!q || (b.getAttribute('data-l')||'').indexOf(q)>=0; b.hidden=!hit; if(hit) n++; });
      gr.hidden=!n; if(n) any=true;
    });
    var none=document.getElementById('ersTxNone'); if(none) none.hidden=any;
  }catch(_){}
}
function teamPanel(){
  var h='<h4>Call for help</h4><div class="ers-acts">'+groupActs('team')+'</div><h4>What they said</h4>';
  var t=RUN.log.filter(function(l){ return l.kind==='team'; });
  return h+(t.length?t.map(function(l){ return '<p class="ers-find">'+e(l.text)+'</p>'; }).join(''):'<p class="ers-meta">You haven\'t called anyone yet.</p>');
}
function decidePanel(){
  var h='<h4>Working diagnosis</h4><div class="ers-opts">';
  (CASE.dx.options||[]).forEach(function(o){ h+='<label class="ers-opt"><input type="radio" name="ersDx" value="'+e(o.id)+'"'+ck('ersDx',o.id)+' onchange="MB_ERSIM.pick(this)"> '+e(o.label)+'</label>'; });
  h+='</div><h4>Where does the patient go?</h4><div class="ers-opts">';
  DISPOSITIONS.forEach(function(d){
    var dis=(d.id==='theatre'&&CASE.setting==='phc')||(d.id==='admit_hdu'&&CASE.setting==='phc');
    h+='<label class="ers-opt" '+(dis?'style="opacity:.45"':'')+'><input type="radio" name="ersDispo" value="'+d.id+'" '+(dis?'disabled':ck('ersDispo',d.id))+' onchange="MB_ERSIM.pick(this)"> '+e(d.label)+(dis?' (not at a PHC)':'')+'</label>';
  });
  h+='</div>'+handoverBox()+'<div class="btnrow" style="margin-top:12px"><button class="btn primary" onclick="MB_ERSIM.end()">Hand over and end the case</button></div><p class="ers-meta" id="ersEndMsg"></p>';
  return h;
}
/* 9: hand over to the ward doctor, one line in each of 4 parts (600 level types it). */
function handoverBox(){
  if(!CASE.phase1 || !CASE.handover || RUN.outcome==='died') return '';
  var h='<h4>Hand over to the ward doctor</h4>';
  if(typedHandover()) return h+'<p class="ers-meta">Say it as you would on the phone: the situation, what was done, how the patient is now, and what to watch for.</p>'+
    '<textarea id="ersHoText" class="ers-hotxt" rows="4" aria-label="Your handover" oninput="MB_ERSIM.pickText(this.value)">'+e(DSEL.hoText||'')+'</textarea>';
  ENGINE.handoverParts(CASE, RUN).forEach(function(p){
    h+='<div class="ers-ho"><b>'+e(p.label)+'</b><div class="ers-opts">'+p.options.map(function(o){
      return '<label class="ers-opt"><input type="radio" name="ersHo_'+p.id+'" value="'+e(o)+'"'+ck('ersHo_'+p.id,o)+' onchange="MB_ERSIM.pick(this);MB_ERSIM.hoRead()"> '+e(o)+'</label>'; }).join('')+'</div></div>';
  });
  return h+'<p class="ers-find" id="ersHoRead" hidden></p>';
}
/* What the student picked on the Decide tab survives a redraw (Watch 5 min, a nurse call, the pinned tabs). */
var DSEL={};
function ck(name, val){ return DSEL[name]===val ? ' checked' : ''; }
function hoPicks(){ var o={}; ['situation','done','now','watch'].forEach(function(k){ var x=document.querySelector('input[name="ersHo_'+k+'"]:checked'); if(x) o[k]=x.value; }); return o; }
function hint(){
  if(!CASE.tutorial || RUN.ended) return '';
  var steps=CASE.tutorialSteps||[];
  for(var i=0;i<steps.length;i++){
    var s=steps[i], done=false;
    if(s.ask) done=s.ask.some(function(id){ return RUN.asked[id]!==undefined; });
    if(s.exam) done=s.exam.some(function(id){ return RUN.examined[id]!==undefined; });
    if(s.act) done=didAny(RUN, s.act);
    if(s.end) done=false;
    if(!done) return '<div class="ers-hint" role="note"><b>Tutorial '+(i+1)+'/'+steps.length+':</b> '+e(s.hint)+'</div>';
  }
  return '';
}
function shift(){
  var st=ENGINE.status(CASE, RUN), p=CASE.patient;
  var dt=RUN.t-SHOWN_T; SHOWN_T=RUN.t;
  var al=CASE.phase1 ? liveAlert() : null, mode=nurseMode(), alarm=al && mode==='B';
  var first=CASE.phase1 && CASE.firstMove && !RUN.first && !RUN.ended && !(RUN.steps||[]).length;
  var h='<div class="ers-top"><div class="ers-pt"><div><a href="'+backHref()+'" class="ers-meta">← Cases</a><br><b>'+e(p.name)+', '+e(p.age)+' '+e(p.sex)+(p.weight?' · '+e(p.weight):'')+'</b><div class="ers-meta">'+e(SETTINGS[CASE.setting].label)+' · '+e(CASE.title)+'</div>'+startTags()+'</div>'+
    '<div style="display:flex;gap:6px;align-items:center"><span class="ers-clock" aria-label="Time since arrival">⏱ '+RUN.t+' min'+(CASE.phase1&&dt>0?'<span class="ers-dt" aria-hidden="true">+'+dt+'</span>':'')+'</span>'+
    '<button class="btn" '+(RUN.ended||first?'disabled':'')+' onclick="MB_ERSIM.wait(5)">Watch 5 min</button></div></div>'+
    (root.ERSIM_SCENE?'<div class="ers-bed" style="position:relative">'+root.ERSIM_SCENE.svg(CASE, RUN, LAST)+nurseOnPicture(al, mode)+'</div>':'')+
    monitor()+
    '<div class="ers-status'+(st.stable&&!alarm?' ok':'')+(alarm?' ers-alarmstrip':'')+'" role="status">'+(alarm?'<b>🚨 Nurse: </b>'+e(al.text.replace(/^The nurse calls:\s*/,''))+' · ':'')+(st.cues.concat(st.warn).map(e).join(' · ')||'No new concerns on the monitor. Keep reassessing.')+'</div>'+
    hint()+(FIRSTMSG?'<div class="ers-hint" role="note">'+e(FIRSTMSG)+'</div>':'');
  if(first) return h+'</div>'+firstCard();
  h+='<div class="ers-tabs" role="tablist">'+tabBtn('talk','💬 History')+tabBtn('exam','🩺 Examine')+tabBtn('tests','🧪 Tests')+tabBtn('treat','💉 Treat')+tabBtn('team','📞 Team')+tabBtn('decide','✅ Decide')+'</div></div>'+
    miniBar(st)+(al && mode==='A' && !al.seen ? nurseCard(al) : '');
  var panel = TAB==='exam'?examPanel(): TAB==='tests'?testsPanel(): TAB==='treat'?treatPanel(): TAB==='team'?teamPanel(): TAB==='decide'?decidePanel(): talkPanel();
  h+='<div class="ers-body"><div class="ers-panel" role="tabpanel">'+panel+'</div>'+
     '<div class="ers-panel"><h4>Timeline</h4><div class="ers-log">'+
       RUN.log.slice().reverse().map(function(l){ return '<div class="k-'+l.kind+'"><time>'+l.t+'′</time>'+e(l.text)+'</div>'; }).join('')+
       (RUN.log.length?'':'<p class="ers-meta">'+e(CASE.triage||'')+'</p>')+
     '</div>'+(TAB!=='tests'?resultsBlock():'')+'</div></div>';
  return h;
}

/* 7: one question on arrival, before the tabs. */
function firstCard(){
  return '<div class="ers-panel ers-first"><h4>What do you do first?</h4><p class="ers-find">'+e(CASE.arrival||'')+'</p><div class="ers-acts">'+
    ENGINE.FIRST_OPTS.map(function(o){ return '<button class="ers-act" onclick="MB_ERSIM.first(\''+o.id+'\')">'+e(o.label)+'</button>'; }).join('')+'</div></div>';
}
/* 4: the nurse's warning. The newest alert whose problem is still untreated. */
function liveAlert(){
  var as=RUN.alerts||[];
  for(var i=as.length-1;i>=0;i--){ var st=RUN.probs[as[i].problem]; if(st && st.active && !st.fixed && !RUN.ended) return as[i]; }
  return null;
}
function nurseCard(al){   // option A: the case stops until the student goes to the patient
  return '<div class="ers-nurse-ov" role="alertdialog" aria-modal="true" aria-labelledby="ersNurseH"><div class="ers-nurse-card">'+
    '<div class="ers-nurse-h" id="ersNurseH">👩🏾‍⚕️ The nurse, at '+al.t+' min</div><p>“'+e(al.text.replace(/^The nurse calls:\s*/,'').replace(/^"|"$/g,''))+'”</p>'+
    '<button class="btn primary" onclick="MB_ERSIM.ack()" autofocus>Go to the patient</button></div></div>';
}
function nurseOnPicture(al, mode){
  if(!al) return '';
  if(mode==='B') return '<span class="ers-reddot" aria-hidden="true"></span>';
  if(mode==='C'){   // option C: a speech bubble over the picture for 10 seconds, then only the picture tells it
    var k=al.t+':'+al.problem, now=Date.now(); if(!BUBBLE[k]) BUBBLE[k]=now;
    var left=10000-(now-BUBBLE[k]); if(left<=0) return '';
    return '<div class="ers-bubble" role="status" style="animation-delay:'+Math.max(0,left-600)+'ms">👩🏾‍⚕️ '+e(al.text.replace(/^The nurse calls:\s*/,''))+'</div>';
  }
  return '';
}
/* Option B side effects, once per alert: vibrate, and beep if the monitor sound is on. */
function alertEffects(){
  try{
    if(!RUN || !CASE || !CASE.phase1 || DEBRIEF) return;
    var al=liveAlert(); if(!al || al.seen) return;
    var mode=nurseMode();
    if(mode==='A') return;   // seen when the student taps "Go to the patient"
    al.seen=true; saveRun();
    if(mode==='B'){
      if(root.navigator && navigator.vibrate) navigator.vibrate([250,120,250]);
      var snd=root.ERSIM_SCENE&&root.ERSIM_SCENE.sound; if(snd&&snd.nurse) snd.nurse();
    }
    if(mode==='C') setTimeout(function(){ var b=document.querySelector('.ers-bubble'); if(b) b.remove(); }, 10000);
  }catch(_){}
}
/* What kind of start this run was dealt (branching cases only). */
function startTags(){
  var v=CASE.variant; if(!v) return '';
  var t=[];
  if(v.night) t.push('<span class="ers-tag night">🌙 Night shift</span>');
  if(v.severityLabel) t.push('<span class="ers-tag">'+e(v.severityLabel)+'</span>');
  return t.length?'<div style="margin-top:4px">'+t.join('')+'</div>':'';
}
var TIERS={ unneeded:'Unneeded', harmful:'Harmful', dangerous:'Dangerous' };
/* 10: "Try again from N min", next to the first late or missed step. */
var REPLAY=null;
function replayRow(){
  REPLAY=null;
  if(!CASE.phase1) return '';
  var rp=ENGINE.replayPoint(CASE, RUN); if(!rp) return '';
  REPLAY=rp;
  return '<div class="ers-path-r" role="row"><span role="cell" style="grid-column:1/-1"><button class="btn" onclick="MB_ERSIM.replayFrom()">↩ Try again from '+rp.at+' min</button> '+
    '<span class="ers-meta">Fix “'+e(rp.label)+'” and play on from there. A replay earns half points, so your first run still counts.</span></span></div>';
}
/* Clinical points for this run (the same points and ranks as Clinical Simulation). */
function pointsPanel(sc){
  if(!CASE.phase1) return '';
  var b=ENGINE.bonusOf(CASE, RUN), unsafe=RUN.outcome==='died'||/unsafe/i.test(sc.grade||'');
  var pts=ENGINE.clinicalPoints(sc.pct, { unsafe:unsafe, x:b.x, add:b.add, mode:RUN.replay?'practice':null, diff:CASE.level });
  var why=[sc.pct+'% case score'+(unsafe?' (counted as 40% at most, because it was unsafe)':'')].concat(b.notes);
  if(RUN.replay) why.push('replay from '+RUN.replay.from+' min ×0.5');
  return '<div class="ers-panel" style="margin-top:12px"><h4>Clinical points</h4><div style="font-size:20px;font-weight:800">'+pts+' clinical points</div>'+
    '<div class="ers-meta">'+e(why.join(' · '))+'. Only your best run of this case counts toward your rank.</div></div>';
}
/* Debrief: the student's path next to the best path. */
function pathPanel(){
  var pc=ENGINE.pathCompare(CASE, RUN);
  var ic={ 'on-time':'✅', late:'🟡', missed:'❌' };
  var h='<div class="ers-panel" style="margin-top:12px"><h4>Your path and the best path</h4>'+
    '<div class="ers-path" role="table" aria-label="Your path compared with the best path"><div class="ers-path-h" role="row"><span role="columnheader">Step</span><span role="columnheader">Best</span><span role="columnheader">You</span></div>';
  pc.rows.forEach(function(r){
    h+='<div class="ers-path-r '+r.status+'" role="row"><span role="cell"><span aria-hidden="true">'+ic[r.status]+'</span> '+e(r.label)+'</span><span role="cell" data-k="Best">'+e(r.best)+'</span><span role="cell" data-k="You">'+
      (r.yours===null?'Not done':'At '+r.yours+' min'+(r.status==='late'?' (late)':''))+'</span></div>';
  });
  h+=replayRow()+'<div class="ers-path-r '+(pc.dx.ok?'on-time':'missed')+'" role="row"><span role="cell"><span aria-hidden="true">'+(pc.dx.ok?'✅':'❌')+'</span> Diagnosis</span><span role="cell" data-k="Best">'+e(pc.dx.best)+'</span><span role="cell" data-k="You">'+e(pc.dx.yours||'None')+'</span></div>';
  h+='<div class="ers-path-r '+(pc.dispo.ok?'on-time':'missed')+'" role="row"><span role="cell"><span aria-hidden="true">'+(pc.dispo.ok?'✅':'❌')+'</span> Where the patient goes</span><span role="cell" data-k="Best">'+e(pc.dispo.best.join(' or '))+'</span><span role="cell" data-k="You">'+e(pc.dispo.yours||'None')+'</span></div></div>';
  var cb=pc.curveball;
  if(cb){
    h+='<h4>The curveball</h4><p class="ers-find">'+
      (cb.happened ? (cb.fixed ? e(cb.label)+' started at '+cb.at+' min. You treated it '+cb.response+' min later.' : e(cb.label)+' started at '+cb.at+' min and was not treated.')
                   : (cb.prevented ? 'You prevented it: '+e(cb.label)+' was due at about '+cb.at+' min.' : 'It never came: '+e(cb.label)+' was due at about '+cb.at+' min, after you handed over.'))+'</p>';
  }
  if(pc.off.length) h+='<h4>Off the best path</h4>'+pc.off.map(function(o){ return '<p class="ers-find'+(o.tier?' ers-off-'+o.tier:'')+'"><b>At '+o.at+' min: '+(o.tier?e(TIERS[o.tier])+' ('+ENGINE.TIER_PTS[o.tier]+'). ':'')+e(o.label)+'.</b> '+e(o.why)+'</p>'; }).join('');
  var v=CASE.variant;
  if(v) h+='<p class="ers-meta">This start: '+e(SETTINGS[CASE.setting].label)+(v.severityLabel?' · '+e(v.severityLabel):'')+(v.night?' · night shift':'')+'. Play again for a different patient, hospital or shift.</p>';
  return h+'</div>';
}
function debrief(){
  var sc=DEBRIEF, c=CASE;
  var col= sc.grade==='Patient died'||sc.pct<50 ? 'var(--badtx)' : sc.pct<70 ? 'var(--warntx)' : 'var(--recall-tx)';
  var h='<a href="'+backHref()+'" class="ers-meta">← Cases</a><h1>Debrief: '+e(c.title)+'</h1>'+
    '<div class="ers-panel"><div class="ers-score"><div class="ers-ring" style="border:8px solid '+col+';color:'+col+'">'+sc.pct+'%</div>'+
    '<div><div style="font-size:20px;font-weight:800;color:'+col+'">'+e(sc.grade)+'</div><div class="ers-meta">'+sc.minutes+' minutes · '+e(RUN.outcome==='died'?'The patient died':'Handed over alive')+'</div>'+
    '<div class="ers-meta">The diagnosis was <b>'+e(dxLabel(c,c.dx.correct[0]))+'</b>.</div></div></div>'+
    (RUN.outcome!=='died' && sc.pct>=70 && !(c.problems||[]).some(function(p){ var x=RUN.probs[p.id]; return x && x.active && !x.fixed; }) && root.ERSIM_SCENE && root.ERSIM_SCENE.picture ? root.ERSIM_SCENE.picture(c, 'discharge', 'Going home a few days later') : '')+'</div>';
  h+=pointsPanel(sc);
  if(c.variant) h+=pathPanel();
  var groups=[['critical','Critical actions'],['history','History and examination'],['exam',''],['good','Good practice'],['handover','Handover'],['dx','Diagnosis and disposition'],['dispo',''],['harm','Harm and penalties']];
  h+='<div class="ers-panel" style="margin-top:12px">';
  groups.forEach(function(g){
    var its=sc.items.filter(function(i){ return i.group===g[0]; }); if(!its.length) return;
    if(g[1]) h+='<h4>'+g[1]+'</h4>';
    h+='<ul class="ers-items">'+its.map(function(i){
      var ok=i.group==='harm'?false:(i.earned>=i.pts?true:(i.earned>0?null:false));
      var ic=i.group==='harm'?'⚠️':(ok===true?'✅':(ok===null?'🟡':'❌'));
      return '<li><span aria-hidden="true">'+ic+'</span><span>'+e(i.label)+(i.note?'<span class="n">'+e(i.note)+'</span>':'')+'</span><span class="pt">'+(i.group==='harm'?i.earned:(i.earned+'/'+i.pts))+'</span></li>';
    }).join('')+'</ul>';
  });
  h+='</div>';
  var teach=(c.phase1?ENGINE.extraTeaching(c, RUN):[]).concat(c.teaching||[]);
  if(teach.length) h+='<div class="ers-panel" style="margin-top:12px"><h4>Learning points</h4><ul class="ers-teach">'+teach.map(function(t){ return '<li>'+e(t)+'</li>'; }).join('')+'</ul>'+
    ((c.refs||[]).length?'<h4>Further reading</h4><ul class="ers-teach">'+c.refs.map(function(t){ return '<li>'+e(t)+'</li>'; }).join('')+'</ul>':'')+'</div>';
  h+=vitalsTrace();
  h+='<div class="ers-panel" style="margin-top:12px"><h4>Your timeline</h4><div class="ers-log">'+RUN.log.map(function(l){ return '<div class="k-'+l.kind+'"><time>'+l.t+'′</time>'+e(l.text)+'</div>'; }).join('')+'</div></div>';
  h+='<div class="btnrow" style="margin-top:14px"><button class="btn primary" onclick="MB_ERSIM.restart()">Play again</button><button class="btn" onclick="location.hash=\''+backHref()+'\'">Back to cases</button></div>';
  return h;
}

/* Vitals against time, with a marker for each treatment, so the student sees WHEN they acted, not just what.
   Built from the vitals each log entry carries (log() stores them). Old runs without them show nothing. */
function vitalsTrace(){
  var pts=(RUN.log||[]).filter(function(l){ return l.v && isFinite(l.v.hr); });
  if(pts.length<2) return '';
  var W=640, H=200, L=34, R=10, T=12, B=26, tMax=Math.max(10, pts[pts.length-1].t);
  var x=function(t){ return L+(W-L-R)*t/tMax; }, y=function(v){ return T+(H-T-B)*(1-Math.max(0,Math.min(200,v))/200); };
  var series=[['hr','Heart rate','#e5484d'],['sbp','Systolic BP','#3e63dd'],['spo2','SpO₂ %','#12a594']];
  var grid=[0,50,100,150,200].map(function(g){ return '<line x1="'+L+'" x2="'+(W-R)+'" y1="'+y(g)+'" y2="'+y(g)+'" stroke="var(--line)"/><text x="'+(L-6)+'" y="'+(y(g)+4)+'" text-anchor="end" font-size="10" fill="var(--dim)">'+g+'</text>'; }).join('');
  var lines=series.map(function(s){ return '<polyline fill="none" stroke="'+s[2]+'" stroke-width="2" points="'+pts.map(function(p){ return x(p.t).toFixed(1)+','+y(p.v[s[0]]).toFixed(1); }).join(' ')+'"/>'; }).join('');
  var marks=(RUN.log||[]).filter(function(l){ return l.kind==='tx'; }).map(function(l){ return '<line x1="'+x(l.t)+'" x2="'+x(l.t)+'" y1="'+T+'" y2="'+(H-B)+'" stroke="var(--accent)" stroke-dasharray="3 3" opacity=".7"><title>'+e(l.t+' min: '+l.text)+'</title></line>'; }).join('');
  var ticks=[0,Math.round(tMax/2),tMax].map(function(t){ return '<text x="'+x(t)+'" y="'+(H-8)+'" text-anchor="middle" font-size="10" fill="var(--dim)">'+t+' min</text>'; }).join('');
  return '<div class="ers-panel" style="margin-top:12px"><h4>Vitals and your treatments</h4>'+
    '<svg viewBox="0 0 '+W+' '+H+'" width="100%" role="img" aria-label="Heart rate, systolic blood pressure and oxygen saturation over the case, with a dashed line at each treatment">'+grid+marks+lines+ticks+'</svg>'+
    '<div class="ers-meta">'+series.map(function(s){ return '<span style="color:'+s[2]+';font-weight:800">━</span> '+s[1]; }).join(' &nbsp; ')+' &nbsp; <span style="color:var(--accent)">┆</span> a treatment</div></div>';
}

function page(caseId){
  css();
  var asCase=!on() && casesOn() && caseId && caseById(caseId) && ENGINE.branching(caseById(caseId));
  if(!on() && !asCase) return '<h1>🚑 ER Sim</h1><div class="empty" style="text-align:left">ER Sim is switched off. Turn on <b>FEATURES.ER_SIM</b> in config.js, or run <code>localStorage.mbersim=\'1\'</code> on your own device and reload.</div>';
  if(!caseId){ CASE=null; DEBRIEF=null; return lobby(); }
  var c=caseById(caseId); if(!c){ return '<h1>Case not found</h1><p><a href="'+backHref()+'">Back to cases</a></p>'; }
  if(!CASE || CASE.id!==c.id){ DEBRIEF=null; TAB='talk'; LAST=null;
    if(loadRun(c.id)) CASE=deal(c, ENGINE.variantOpts(RUN)||{});   // a saved run rebuilds the start it was dealt
    else { CASE=deal(c); RUN=ENGINE.newRun(CASE); CHAT=[]; }
    SHOWN_T=RUN.t; DOSEQ=null; FIRSTMSG=null; DSEL={}; }
  if(DEBRIEF) return debrief();
  setTimeout(watchMini, 0);   // the router inserts this page's HTML after page() returns
  if(RUN.ended && RUN.outcome==='died' && !DEBRIEF){ /* fall through: show the shift with the arrest in the log, then Decide to debrief */ }
  return shift();
}

function after(text, keepMsg){
  if(!keepMsg) FIRSTMSG=null;
  if(RUN.ended && RUN.outcome==='died' && !DEBRIEF){ TAB='decide'; }
  saveRun(); draw();
  if(text && root.mbToast && TAB!=='talk') try{ root.mbToast(text); }catch(_){}
  var ch=document.getElementById('ersChat'); if(ch) ch.scrollTop=ch.scrollHeight;
}

async function token(){ try{ if(!root.__mbSB) return null; var s=await root.__mbSB.auth.getSession(); return s&&s.data&&s.data.session?s.data.session.access_token:null; }catch(_){ return null; } }

async function askFree(){
  var inp=document.getElementById('ersQ'); var q=(inp&&inp.value||'').trim(); if(!q||BUSY||RUN.ended) return;
  CHAT.push({ who:'me', text:q }); BUSY=true; draw();
  var reply=null, about=[];
  try{
    var CFG=root.MEDBANK_CONFIG||{}, tok=await token();
    if(CFG.IMPORT_API && tok){
      var r=await fetch(CFG.IMPORT_API.replace(/\/$/,'')+'/ersim/patient',{ method:'POST', headers:{'Content-Type':'application/json','Authorization':'Bearer '+tok},
        body:JSON.stringify({ case_id:CASE.id, question:q, speaker:CASE.speaker, persona:CASE.persona, patient:CASE.patient,
          facts:(CASE.history||[]).map(function(h){ return { id:h.id, q:h.q, a:h.a }; }), background:CASE.background||'',
          recent:CHAT.slice(-8,-1) }) });
      var o=null; try{ o=await r.json(); }catch(_){}
      if(r.ok && o && o.reply){ reply=o.reply; about=o.about||[]; }
    }
  }catch(_){}
  if(!reply){
    var m=ENGINE.matchHistory(CASE, q);
    if(m){ reply=m.a; about=[m.id]; }
    else reply=CASE.fallback||'I don\'t understand, doctor. Can you ask it another way?';
  }
  ENGINE.freeAsk(CASE, RUN, q, reply, about);   // also records the step, so a replay can play it back
  CHAT.push({ who:'pt', text:reply }); BUSY=false;
  after(); var i2=document.getElementById('ersQ'); if(i2) i2.focus();
}

root.MB_ERSIM={
  on:on, page:page,
  open:function(id){ CASE=null; DEBRIEF=null; location.hash='#/ersim/'+id; },
  filter:function(f){ FILTER=f; draw(); },
  tab:function(t){ TAB=t; draw(); },
  miniTab:function(t){ TAB=t; draw(); var b=document.querySelector('.ers-body'), bar=document.getElementById('ersMini');
    if(b && bar && root.scrollTo){ var y=b.getBoundingClientRect().top+root.scrollY-bar.offsetHeight-8; if(root.scrollY>y) root.scrollTo(0,y); } },
  act:function(id){
    if(CASE.phase1 && ENGINE.doseInfo(CASE, id) && !RUN.ended){ DOSEQ=id; TAB='treat'; draw(); var inp=document.getElementById('ersDoseIn'); if(inp){ inp.focus(); var bx=document.getElementById('ersDose'); if(bx&&bx.scrollIntoView) bx.scrollIntoView({ block:'center' }); } return; }
    var r=ENGINE.act(CASE, RUN, id); if(r&&r.ok) LAST={ id:id, at:Date.now() }; after(r&&r.text); },
  doseGive:function(){
    var id=DOSEQ, inp=document.getElementById('ersDoseIn'), v=inp?Number(String(inp.value).replace(',','.')):NaN;
    if(!id) return; if(!inp || inp.value==='' || !isFinite(v) || v<=0){ if(inp) inp.focus(); return; }
    DOSEQ=null; var r=ENGINE.act(CASE, RUN, id, { dose:v }); if(r&&r.ok) LAST={ id:id, at:Date.now() }; after(r&&r.text); },
  doseCancel:function(){ DOSEQ=null; draw(); },
  pick:function(el){ if(el && el.name) DSEL[el.name]=el.value; },
  pickText:function(v){ DSEL.hoText=String(v||''); },
  txFilter:function(q){ TXQ=String(q||''); txApply(); },
  first:function(id){ var r=ENGINE.firstMove(CASE, RUN, id); if(!r) return; TAB=r.tab; FIRSTMSG=(r.right?'Right first move. ':'Better first: '+r.best+'. ')+r.why; after(null, true); },
  ack:function(){ var al=liveAlert(); if(al){ al.seen=true; } TAB='exam'; after(); root.scrollTo&&root.scrollTo(0,0); },
  hoRead:function(){ var o=hoPicks(), el=document.getElementById('ersHoRead'); if(!el) return; var t=['situation','done','now','watch'].map(function(k){ return o[k]; }).filter(Boolean);
    el.hidden=!t.length; el.textContent=t.length?'Your handover: '+t.join(' '):''; },
  replayFrom:function(){
    var rp=REPLAY||ENGINE.replayPoint(CASE, RUN); if(!rp) return;
    RUN=rp.run; RUN.replay={ from:rp.at }; DEBRIEF=null; TAB='talk'; DOSEQ=null; LAST=null; SHOWN_T=RUN.t; DSEL={};
    (RUN.alerts||[]).forEach(function(a){ a.seen=true; });   // warnings from before the replay point were already answered
    CHAT=[]; (RUN.steps||[]).forEach(function(s){
      if(s.k==='ask'){ var hq=(CASE.history||[]).filter(function(x){ return x.id===s.id; })[0]; if(hq){ CHAT.push({ who:'me', text:hq.q }); CHAT.push({ who:'pt', text:hq.a }); } }
      if(s.k==='free'){ CHAT.push({ who:'me', text:s.q }); CHAT.push({ who:'pt', text:s.reply }); } });
    FIRSTMSG='Replay from '+rp.at+' min: everything you did before then is kept. Now fix “'+rp.label+'”.';
    saveRun(); draw(); root.scrollTo&&root.scrollTo(0,0); },
  ask:function(id){ var h=(CASE.history||[]).filter(function(x){ return x.id===id; })[0]; if(!h) return; CHAT.push({who:'me',text:h.q}); var a=ENGINE.ask(CASE, RUN, id); CHAT.push({who:'pt',text:a}); after(); },
  askFree:askFree,
  exam:function(id){ ENGINE.examine(CASE, RUN, id); after(); },
  wait:function(m){ ENGINE.wait(CASE, RUN, m); after(); },
  end:function(){
    var dx=(document.querySelector('input[name="ersDx"]:checked')||{}).value||null;
    var dp=(document.querySelector('input[name="ersDispo"]:checked')||{}).value||null;
    if((!dx||!dp) && RUN.outcome!=='died'){ var m=document.getElementById('ersEndMsg'); if(m) m.textContent='Pick a working diagnosis and where the patient goes first.'; return; }
    var ho=null;
    if(CASE.phase1 && CASE.handover && RUN.outcome!=='died'){ var ta=document.getElementById('ersHoText'); ho=ta ? { text:ta.value } : { picks:hoPicks() }; }
    DEBRIEF=ENGINE.finish(CASE, RUN, dx, dp, ho); recordRun(DEBRIEF);
    try{ localStorage.removeItem(RUN_KEY); }catch(_){}
    draw(); root.scrollTo&&root.scrollTo(0,0);
  },
  restart:function(){ LAST=null; CASE=deal(caseById(CASE.id)||CASE); RUN=ENGINE.newRun(CASE); CHAT=[]; DEBRIEF=null; TAB='talk'; DOSEQ=null; FIRSTMSG=null; SHOWN_T=0; DSEL={}; saveRun(); draw(); root.scrollTo&&root.scrollTo(0,0); },   // a branching case deals a new start
  casesOn:casesOn,
  /* The "Patient cases" card in Mega Qbank (pageMega in app.html). Empty unless switched on and the student is 400-600 level. */
  patientCasesCard:function(){
    if(!casesOn() || !(clinicalLevel() || preview())) return '';   // the owner preview shows it at any level
    var list=branchCases(); if(!list.length) return '';
    css();
    return '<div class="card ers-pcard" style="cursor:default"><div class="mgq-t">🩺 Patient cases</div>'+
      '<div class="mgq-s">A patient arrives and your choices decide what happens next. Each time, the patient, hospital, how sick they are and the shift can change, and something may go wrong along the way.</div>'+
      list.map(function(c){ var b=bestFor(c.id);
        return '<button class="ers-case" style="margin-top:10px;width:100%" onclick="MB_ERSIM.open(\''+c.id+'\')"><div><span class="ers-tag">🔀 Branching</span><span class="ers-tag">'+e(c.level||'')+'</span></div>'+
          '<h3>'+e(c.title)+'</h3><div class="ers-meta">'+(c.variants||[]).length+' patients · PHC to private hospital · day or night</div>'+
          (b!==null?'<div class="ers-best">Best: '+b+'%</div>':'<div class="ers-meta">Not played yet</div>')+'</button>'; }).join('')+
      '</div>';
  }
};
})(typeof window!=='undefined'?window:globalThis);
