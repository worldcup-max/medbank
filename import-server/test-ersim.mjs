// node --test test-ersim.mjs — ER Sim: the engine plays every case end to end, plus the AI-patient contract (ersim.mjs)
import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { createRequire } from "node:module";
import vm from "node:vm";
import { cleanPatientRequest, buildPatientPrompt, parsePatientReply, ersimQuota } from "./ersim.mjs";

const require = createRequire(import.meta.url);
const E = require("../er-sim.js");
const sandbox = { window:{}, location:{ hash:"" } };
vm.runInNewContext(readFileSync(new URL("../er-sim-cases.js", import.meta.url), "utf8"), sandbox);
const CASES = sandbox.window.ERSIM_CASES;
const byId = id => CASES.find(c => c.id === id);
const PLAIN = CASES.filter(c => !E.branching(c));
const BRANCHING = CASES.filter(c => E.branching(c));
// every playable start of a branching case (each variant, no complication), plus every plain case
const variantsOf = c => (c.variants||[]).map((v,i) => E.instantiate(c, { seed:1, variant:i, severity:1, night:false, complication:null }));
const PLAYABLE = PLAIN.concat(...BRANCHING.map(variantsOf));

// The model answer for each case: what a good clinician does, in order.
const IDEAL = {
  "fever-body-pains":  { ask:"*", exam:"*", acts:["mrdt","paracetamol"], wait:15, then:["act"], dx:"uncomplicated", dispo:"discharge" },
  "child-fever-fit":   { acts:["position","o2_nasal","benzo","rbg","iv_access","dextrose10","artesunate","mrdt","paracetamol","ceftriaxone"], ask:"*", exam:"*", dx:"severe-malaria", dispo:"refer" },
  "scd-chest-pain":    { acts:["o2_nasal","iv_access","morphine","fbc","gxm","cxr","ceftriaxone","azithro","maint","consult_med"], wait:45, then:["blood"], ask:"*", exam:"*", dx:"acs", dispo:"admit_hdu" },
  "farm-snakebite":    { acts:["iv_access","wbct20","prep_anaphylaxis","antivenom","remove_tourniquet","immobilise","paracetamol","eucr"], wait:16, then:["adrenaline_im","tetanus"], ask:"*", exam:"*", dx:"viper", dispo:"admit_ward" },
  "pregnant-fit":      { acts:["position","mgso4","hydralazine","consult_og","o2_nasal","catheter","urinalysis","fbc","lft","fetal_heart"], ask:"*", exam:"*", dx:"eclampsia", dispo:"admit_hdu" },
  "okada-crash":       { acts:["o2_mask","needle_decomp","cspine","iv_access","gxm","chest_drain","morphine","efast","consult_surg","tetanus"], ask:"*", exam:"*", dx:"tension", dispo:"admit_hdu" },
  "diabetic-vomiting": { acts:["rbg","iv_access","monitor","ns_bolus","urinalysis","vbg","eucr","insulin_frii","kcl","upt","ecg","consult_med"], ask:"*", exam:"*", dx:"dka", dispo:"admit_hdu" },
  "watery-diarrhoea":  { acts:["iv_access","rl_planc","cholera_rdt","rbg","doxy","notify_dsno","call_senior"], wait:30, then:["ors"], ask:"*", exam:"*", dx:"cholera", dispo:"admit_ward" }
};

function play(c, plan){
  const run = E.newRun(c);
  for(const id of plan.acts||[]) assert.ok(E.act(c, run, id).ok, c.id+": "+id+" refused");
  if(plan.wait) E.wait(c, run, plan.wait);
  for(const id of plan.then||[]) assert.ok(E.act(c, run, id).ok, c.id+": "+id+" refused");
  if(plan.ask==="*") (c.history||[]).filter(h=>h.key).forEach(h=>E.ask(c, run, h.id));
  if(plan.exam==="*") (c.keyExam||[]).forEach(x=>E.examine(c, run, x));
  return { run, sc:E.finish(c, run, plan.dx, plan.dispo) };
}

test("there are 9 cases (one branching) and every playable start is well-formed", ()=>{
  assert.equal(CASES.length, 9);
  assert.equal(BRANCHING.length, 1);
  const ids = new Set();
  for(const c of CASES){ assert.ok(!ids.has(c.id), "duplicate id "+c.id); ids.add(c.id); }
  for(const c of PLAYABLE){
    assert.ok(E.SETTINGS[c.setting], c.id+" setting");
    for(const k of ["hr","sbp","dbp","rr","spo2","temp","gcs","rbg"]) assert.equal(typeof c.vitals[k], "number", c.id+" vital "+k);
    const refs = [];
    for(const g of ["critical","good","harmful"]) (c[g]||[]).forEach(r=>refs.push(...r.any, ...(r.unless||[])));
    (c.problems||[]).forEach(p=>refs.push(...(p.fixedBy||[])));
    (c.triggers||[]).forEach(t=>refs.push(t.after, ...(t.unless||[])));
    for(const id of refs) assert.ok(E.BYID[id], c.id+" references unknown action "+id);
    for(const id of Object.keys(c.tests||{})) assert.equal(E.BYID[id]&&E.BYID[id].cat, "tests", c.id+" unknown test "+id);
    for(const id of c.dx.correct.concat(c.dx.close||[])) assert.ok(c.dx.options.some(o=>o.id===id), c.id+" dx "+id);
    for(const r of c.critical) for(const id of r.any) assert.ok(E.available(E.BYID[id], c.setting) || r.any.some(x=>E.available(E.BYID[x], c.setting)), c.id+" critical action unavailable here: "+id);
    assert.ok(!/malaria|eclampsia|ketoacidosis|cholera|pneumothorax|acute chest|viper/i.test(c.title), c.id+" title gives away the diagnosis");
  }
});

for(const c of PLAIN){
  test(c.id+": the ideal management keeps the patient alive and scores Excellent", ()=>{
    const { run, sc } = play(c, IDEAL[c.id]);
    assert.notEqual(run.outcome, "died", c.id+" died on the ideal path at "+run.t+" min");
    assert.ok(sc.pct>=85, c.id+" ideal path scored "+sc.pct+"%: "+JSON.stringify(sc.items.filter(i=>i.earned<i.pts||i.group==="harm").map(i=>i.label+" "+i.earned+"/"+i.pts)));
    assert.equal(sc.grade, "Excellent");
  });
  test(c.id+": doing nothing for an hour and discharging is unsafe", ()=>{
    const run = E.newRun(c); E.wait(c, run, 60);
    const sc = E.finish(c, run, c.dx.options.find(o=>!c.dx.correct.includes(o.id)).id, "discharge");
    assert.ok(sc.pct<50, c.id+" neglect scored "+sc.pct+"%");
  });
}

test("time-critical cases kill an untreated patient", ()=>{
  for(const id of ["child-fever-fit","okada-crash","watery-diarrhoea"]){
    const c = byId(id), run = E.newRun(c); E.wait(c, run, 120);
    assert.equal(run.outcome, "died", id+" survived two hours untreated");
  }
});

test("harm rules: X-ray before decompression is penalised, after is not", ()=>{
  const c = byId("okada-crash");
  const a = E.newRun(c); E.act(c, a, "cxr"); E.act(c, a, "needle_decomp");
  assert.ok(E.score(c, a).items.some(i=>i.group==="harm" && /X-ray/.test(i.label)));
  const b = E.newRun(c); E.act(c, b, "needle_decomp"); E.act(c, b, "cxr");
  assert.ok(!E.score(c, b).items.some(i=>i.group==="harm" && /X-ray/.test(i.label)));
});

test("a late critical action earns half marks", ()=>{
  const c = byId("pregnant-fit"), run = E.newRun(c);
  E.wait(c, run, 20); E.act(c, run, "mgso4");
  const it = E.score(c, run).items.find(i=>/magnesium/.test(i.label));
  assert.equal(it.earned, Math.round(it.pts/2));
});

test("magnesium before the timer prevents the second fit; without it she fits again", ()=>{
  const c = byId("pregnant-fit");
  const a = E.newRun(c); E.act(c, a, "mgso4"); E.wait(c, a, 20);
  assert.equal(a.probs.refit.active, false);
  const b = E.newRun(c); E.wait(c, b, 20);
  assert.equal(b.probs.refit.active, true);
  assert.ok(b.log.some(l=>/convulse again/.test(l.text)));
});

test("antivenom triggers a reaction that adrenaline treats", ()=>{
  const c = byId("farm-snakebite"), run = E.newRun(c);
  E.act(c, run, "antivenom"); E.wait(c, run, 16);
  assert.equal(run.probs.reaction.active, true);
  const bp = run.v.sbp; E.act(c, run, "adrenaline_im"); E.wait(c, run, 10);
  assert.equal(run.probs.reaction.fixed, true); assert.ok(run.v.sbp>bp);
});

test("tests take their turnaround time and reflect state when ordered", ()=>{
  const c = byId("child-fever-fit"), run = E.newRun(c);
  E.act(c, run, "rbg"); assert.ok(!run.results.rbg);
  E.wait(c, run, 2); assert.match(run.results.rbg.text, /LOW/);
  E.act(c, run, "dextrose10"); E.act(c, run, "rbg"); E.wait(c, run, 3);
  assert.match(run.results.rbg.text, /6\.4/);
});

test("facility limits: no chest X-ray at a PHC", ()=>{
  const c = byId("child-fever-fit"), run = E.newRun(c);
  assert.equal(E.act(c, run, "cxr").ok, false);
});

/* ---------------------------------------------------------- branching cases */
const BIDEAL = {
  "phc-fits":     { acts:["position","o2_nasal","benzo","rbg","iv_access","dextrose10","artesunate","mrdt","paracetamol","ceftriaxone"], ask:"*", exam:"*", dx:"severe-malaria", dispo:"refer" },
  "gh-anaemia":   { acts:["o2_nasal","monitor","iv_access","pcv","rbg","mrdt","gxm","artesunate","paracetamol","consult_paeds"], wait:30, then:["blood"], ask:"*", exam:"*", dx:"severe-malaria", dispo:"admit_ward" },
  "pv-prostrate": { acts:["rbg","mrdt","iv_access","artesunate","paracetamol","maint","monitor","fbc","eucr","lft"], ask:"*", exam:"*", dx:"severe-malaria", dispo:"admit_ward" }
};
const CURE = { refit:["benzo"], hypo2:["rbg","dextrose10"], shock:["ns_bolus"] };
const sm = byId("child-very-sick-fever");

test("branching: every variant x severity x shift, on the ideal path, survives and scores Excellent", ()=>{
  sm.variants.forEach((v,vi)=>{
    for(let si=0; si<sm.severity.length; si++) for(const night of [false,true]){
      const c = E.instantiate(sm, { seed:7, variant:vi, severity:si, night, complication:null });
      assert.equal(c.variant.id, v.id);
      const { run, sc } = play(c, BIDEAL[v.id]);
      const tag = v.id+" sev "+si+(night?" night":"");
      assert.notEqual(run.outcome, "died", tag+" died at "+run.t);
      assert.ok(sc.pct>=85, tag+" scored "+sc.pct+"%: "+JSON.stringify(sc.items.filter(i=>i.earned<i.pts||i.group==="harm").map(i=>i.label+" "+i.earned+"/"+i.pts)));
    }
  });
});

test("branching: every complication wakes on time, reuses a latent problem, and treating it keeps the score Excellent", ()=>{
  sm.variants.forEach((v,vi)=>{
    for(const cp of v.complications){
      const c = E.instantiate(sm, { seed:11, variant:vi, severity:1, night:false, complication:cp.id });
      assert.equal(c.variant.complication.id, cp.id);
      const at = c.variant.complication.at;
      assert.ok(at>=cp.at[0] && at<=cp.at[1], v.id+" "+cp.id+" at "+at);
      const plan = BIDEAL[v.id], run = E.newRun(c);
      let cured = false;
      const watch = ()=>{ if(!cured && run.probs[cp.problem].active){ cured = true; for(const id of CURE[cp.problem]) E.act(c, run, id); } };   // a good doctor responds as soon as it shows
      for(const id of plan.acts){ E.act(c, run, id); watch(); }
      for(let m=0; m<(plan.wait||0); m++){ E.wait(c, run, 1); watch(); }
      for(const id of plan.then||[]){ E.act(c, run, id); watch(); }
      while(!cured && run.t<at+2){ E.wait(c, run, 1); watch(); }
      assert.ok(cured, v.id+" "+cp.id+" did not wake");
      if(cp.problem==="hypo2") E.wait(c, run, 3);
      (c.history||[]).filter(h=>h.key).forEach(h=>E.ask(c, run, h.id)); (c.keyExam||[]).forEach(x=>E.examine(c, run, x));
      const sc = E.finish(c, run, plan.dx, plan.dispo);
      assert.notEqual(run.outcome, "died", v.id+" "+cp.id+" died");
      const cb = sc.items.find(i=>/curveball/.test(i.label));
      assert.ok(cb && cb.earned===10, v.id+" "+cp.id+" curveball "+JSON.stringify(cb));
      assert.ok(sc.pct>=85, v.id+" "+cp.id+" scored "+sc.pct+"%: "+JSON.stringify(sc.items.filter(i=>i.earned<i.pts||i.group==="harm").map(i=>i.label+" "+i.earned+"/"+i.pts)));
    }
  });
});

test("branching: an untreated complication drags the score down; neglect is unsafe in every variant", ()=>{
  sm.variants.forEach((v,vi)=>{
    const c = E.instantiate(sm, { seed:3, variant:vi, severity:2, night:false, complication:null });
    const run = E.newRun(c); E.wait(c, run, 60);
    const sc = E.finish(c, run, "uncomplicated", "discharge");
    assert.ok(sc.pct<50, v.id+" neglect scored "+sc.pct+"%");
    const c2 = E.instantiate(sm, { seed:3, variant:vi, severity:1, night:false, complication:v.complications[0].id }), r2 = E.newRun(c2);
    E.wait(c2, r2, c2.variant.complication.at+2);
    assert.equal(E.curveball(c2, r2).happened, true);
    assert.equal(E.score(c2, r2).items.find(i=>/curveball/.test(i.label)).earned, 0);
  });
});

test("branching: a seed rebuilds the same start, and different seeds deal different starts", ()=>{
  const a = E.instantiate(sm, { seed:12345 }), b = E.instantiate(sm, { seed:12345 });
  assert.deepEqual(a.variant, b.variant);
  assert.deepEqual(a.vitals, b.vitals);
  const run = E.newRun(a), again = E.instantiate(sm, E.variantOpts(run));
  assert.deepEqual(again.variant, a.variant);
  const seen = new Set(), nights = new Set(), comps = new Set();
  for(let s=1; s<200; s++){ const c = E.instantiate(sm, { seed:s }); seen.add(c.variant.id+"/"+c.variant.severityId); nights.add(c.variant.night); comps.add(c.variant.complication&&c.variant.complication.id); }
  assert.equal(seen.size, 9, "every patient x severity comes up");
  assert.equal(nights.size, 2); assert.ok(comps.has(null) && comps.size>=4, "complications vary, sometimes none");
  assert.equal(E.instantiate(byId("okada-crash")), byId("okada-crash"), "plain cases are untouched");
});

test("branching: hospital level limits options; a private hospital is equipped like a General Hospital", ()=>{
  const phc = E.instantiate(sm, { seed:1, variant:0, complication:null }), pv = E.instantiate(sm, { seed:1, variant:2, complication:null });
  assert.equal(phc.setting, "phc"); assert.equal(pv.setting, "pv");
  assert.equal(E.act(phc, E.newRun(phc), "blood").ok, false);
  assert.equal(E.act(phc, E.newRun(phc), "mp_film").ok, false);
  assert.equal(E.act(pv, E.newRun(pv), "mp_film").ok, true);
  assert.equal(E.act(pv, E.newRun(pv), "ct_head").ok, false);
});

test("branching: lab results take twice as long on a night shift, bedside tests do not", ()=>{
  const day = E.instantiate(sm, { seed:1, variant:1, night:false, complication:null }), nite = E.instantiate(sm, { seed:1, variant:1, night:true, complication:null });
  assert.match(E.act(day, E.newRun(day), "gxm").text, /45 min/);
  assert.match(E.act(nite, E.newRun(nite), "gxm").text, /1\.5 h/);
  assert.match(E.act(nite, E.newRun(nite), "pcv").text, /15 min/);
  assert.match(nite.triage, /Night shift/);
});

test("branching: severity changes the starting vitals and how fast things go wrong", ()=>{
  const early = E.instantiate(sm, { seed:1, variant:1, severity:0, complication:null }), late = E.instantiate(sm, { seed:1, variant:1, severity:2, complication:null });
  assert.ok(late.vitals.spo2 < early.vitals.spo2 && late.vitals.hr > early.vitals.hr);
  const a = late.problems.find(p=>p.id==="anaemia").drift.spo2, b = early.problems.find(p=>p.id==="anaemia").drift.spo2;
  assert.ok(a < b, "late drifts faster");
});

test("branching: a latent problem shows in the glucose result only while it is active", ()=>{
  const c = E.instantiate(sm, { seed:1, variant:2, complication:"hypo2" }), run = E.newRun(c);
  E.act(c, run, "rbg"); E.wait(c, run, 3); assert.match(run.results.rbg.text, /^4\.0/);
  E.wait(c, run, c.variant.complication.at - run.t + 1);
  E.act(c, run, "rbg"); E.wait(c, run, 3); assert.match(run.results.rbg.text, /LOW/);
});

test("branching: the debrief puts the student's path next to the best path", ()=>{
  const c = E.instantiate(sm, { seed:1, variant:1, severity:1, night:false, complication:null }), run = E.newRun(c);
  E.act(c, run, "ns_bolus"); E.act(c, run, "o2_nasal"); E.wait(c, run, 20); E.act(c, run, "pcv");
  E.finish(c, run, "pneumonia", "refer");
  const pc = E.pathCompare(c, run);
  assert.deepEqual(pc.rows.map(r=>r.status), ["on-time","late","missed","missed","missed"]);
  assert.equal(pc.rows[0].label, "Gave oxygen");
  assert.ok(pc.off.some(o=>/fluid bolus/.test(o.label) && o.at===0));
  assert.equal(pc.dx.ok, false); assert.equal(pc.dispo.ok, false); assert.deepEqual(pc.dispo.best, ["Admit to the ward"]);
});

test("offline matcher understands plain questions", ()=>{
  const c = byId("fever-body-pains");
  assert.equal(E.matchHistory(c, "how long have you had the fever").id, "onset");
  assert.equal(E.matchHistory(c, "do you use a mosquito net").id, "net");
  assert.equal(E.matchHistory(c, "xyz"), null);
});

/* ---- server side */
test("patient request is capped and cleaned", ()=>{
  const r = cleanPatientRequest({ question:"x".repeat(1000), facts:Array.from({length:50},(_,i)=>({id:"f"+i,q:"q",a:"a"})), recent:[{who:"me",text:"hi"}], patient:{name:"A"} });
  assert.equal(r.question.length, 300); assert.equal(r.facts.length, 30); assert.equal(r.recent[0].who, "doctor");
  assert.equal(cleanPatientRequest({}).facts.length, 0);
});

test("prompt keeps the model in role and lists the facts", ()=>{
  const p = buildPatientPrompt(cleanPatientRequest({ question:"Any cough?", speaker:"the mother", facts:[{id:"cough",q:"Cough?",a:"No cough."}] }));
  assert.match(p, /\[cough\]/); assert.match(p, /Never invent/); assert.match(p, /Never name a diagnosis/); assert.match(p, /the mother/);
});

test("reply parsing keeps only known fact ids and rejects junk", ()=>{
  assert.deepEqual(parsePatientReply('{"reply":"No cough.","about":["cough","made-up"]}', ["cough"]), { reply:"No cough.", about:["cough"] });
  assert.equal(parsePatientReply("not json", ["a"]), null);
  assert.equal(parsePatientReply('{"reply":""}', []), null);
  assert.equal(parsePatientReply('Sure: {"reply":"Yes.","about":[]}', []).reply, "Yes.");
});

test("daily quota counts per account and per day", ()=>{
  const d = new Date("2026-11-16T10:00:00Z");
  for(let i=0;i<80;i++) ersimQuota("u1", false, d).take();
  assert.equal(ersimQuota("u1", false, d).ok, false);
  assert.equal(ersimQuota("u1", true, d).ok, true);
  assert.equal(ersimQuota("u2", false, d).ok, true);
  assert.equal(ersimQuota("u1", false, new Date("2026-11-17T10:00:00Z")).ok, true);
});

/* ---------------------------------------------------------- phase 1 rules (c.phase1) */
const p1 = (opts) => Object.assign(E.instantiate(sm, Object.assign({ seed:7, severity:1, night:false, complication:null }, opts)), { phase1:true });
// A good doctor under the phase 1 rules: right first move, every dose worked out, blood only once crossmatched,
// rechecks when due, and a complete handover.
function playP1(c, plan){
  const run = E.newRun(c);
  E.firstMove(c, run, c.firstMove.correct);
  const doIt = id => {
    if(id==="blood") while(!run.results.gxm && !run.ended) E.wait(c, run, 1);
    const d = E.doseInfo(c, id);
    assert.ok(E.act(c, run, id, d?{ dose:d.right }:null).ok, c.variant.id+": "+id+" refused");
  };
  (plan.acts||[]).forEach(doIt);
  if(plan.wait) E.wait(c, run, plan.wait);
  (plan.then||[]).forEach(doIt);
  if(plan.ask==="*") (c.history||[]).filter(h=>h.key).forEach(h=>E.ask(c, run, h.id));
  if(plan.exam==="*") (c.keyExam||[]).forEach(x=>E.examine(c, run, x));
  for(const r of E.rechecks(c, run)) if(!r.done && run.t>=r.dueAt-5 && run.t<=r.dueAt+15 && !run.pending.some(p=>p.id===r.test)) E.act(c, run, r.test);
  const picks = {}; E.handoverParts(c, run).forEach(p=>{ picks[p.id]=p.right; });
  return { run, sc:E.finish(c, run, plan.dx, plan.dispo, { picks }) };
}

test("phase 1: off by default — no O-negative button, no new rows, blood needs no crossmatch", ()=>{
  const c = E.instantiate(sm, { seed:7, variant:1, severity:1, night:false, complication:null }), run = E.newRun(c);
  assert.equal(E.act(c, run, "blood_oneg").ok, false);
  assert.equal(E.act(c, run, "blood").ok, true);
  const sc = E.finish(c, run, "severe-malaria", "admit_ward");
  assert.ok(!sc.items.some(i=>i.group==="handover" || /Unneeded|doses/.test(i.label)));
});

test("phase 1: the ideal path, every variant x severity x shift, survives and scores Excellent", ()=>{
  sm.variants.forEach((v,vi)=>{
    for(let si=0; si<sm.severity.length; si++) for(const night of [false,true]){
      const c = p1({ variant:vi, severity:si, night });
      const { run, sc } = playP1(c, BIDEAL[v.id]);
      const tag = v.id+" sev "+si+(night?" night":"");
      assert.notEqual(run.outcome, "died", tag+" died at "+run.t);
      assert.equal(sc.grade, "Excellent", tag+" scored "+sc.pct+"%: "+JSON.stringify(sc.items.filter(i=>i.earned<i.pts||i.group==="harm").map(i=>i.label+" "+i.earned+"/"+i.pts)));
      const ho = sc.items.find(i=>i.group==="handover"); assert.equal(ho.earned, 10, tag+" handover");
      assert.ok(sc.items.some(i=>/Worked out the doses/.test(i.label) && i.earned===i.pts), tag+" doses");
    }
  });
});

test("phase 1 (1): no blood before the crossmatch; uncrossmatched blood is dangerous unless the patient is crashing", ()=>{
  const c = p1({ variant:1 }), run = E.newRun(c);
  assert.match(E.act(c, run, "blood").text, /crossmatch first/);
  E.act(c, run, "gxm");
  assert.match(E.act(c, run, "blood").text, /not back yet/);
  assert.equal(E.act(c, run, "blood_oneg", { dose:110 }).ok, true);
  assert.equal(run.probs.anaemia.fixed, true, "O-negative blood treats the anaemia");
  const sc = E.finish(c, run, "severe-malaria", "admit_ward");
  assert.equal(sc.grade, "Unsafe");
  assert.ok(sc.items.some(i=>/Dangerous: uncrossmatched/.test(i.label) && i.earned===-15));
  assert.ok(E.extraTeaching(c, run).some(t=>/transfusion reaction/.test(t)));
  assert.equal(E.act(c, E.newRun(c), "blood_oneg").ok, true);
  const phc = p1({ variant:0 }); assert.equal(E.act(phc, E.newRun(phc), "blood_oneg").ok, false, "not at a PHC");
  const late = p1({ variant:1, severity:2 }), r2 = E.newRun(late); E.wait(late, r2, 200);   // left long enough to be crashing
  if(r2.outcome!=="died"){ r2.v.spo2=80; E.act(late, r2, "blood_oneg"); assert.equal(r2.oneg.justified, true); }
});

test("phase 1 (1): on a night shift the transfusion target moves with the slower crossmatch", ()=>{
  const day = p1({ variant:1 }), nite = p1({ variant:1, night:true });
  const r = sm.variants[1].critical.find(x=>x.any.includes("blood"));
  assert.equal(E.byOf(day, r), 90); assert.equal(E.byOf(nite, r), 135);
});

test("phase 1 (2): unneeded -3, harmful -8, dangerous -15 caps the grade", ()=>{
  const c = p1({ variant:1 }), run = E.newRun(c);
  E.act(c, run, "dextrose10", { dose:55 });   // sugar is normal
  E.act(c, run, "ns_bolus", { dose:220 });    // harmful in severe anaemia
  const sc = E.finish(c, run, "severe-malaria", "discharge");
  const u = sc.items.find(i=>/^Unneeded: 10% dextrose/.test(i.label)); assert.ok(u && u.earned===-3 && /sugar was not low/.test(u.note));
  assert.ok(sc.items.some(i=>/^Harmful: Gave a fluid bolus/.test(i.label) && i.earned===-8));
  assert.ok(sc.items.some(i=>i.group==="dispo" && i.earned===-15));
  assert.equal(sc.grade, "Unsafe");
  const pc = E.pathCompare(c, run); assert.deepEqual(pc.off.map(o=>o.tier), ["unneeded","harmful"]);
  const a = p1({ variant:0 }), ra = E.newRun(a);
  E.act(a, ra, "benzo", { dose:7.5 }); assert.equal(ra.unneeded.length, 0, "first benzo stops the fit");
  E.act(a, ra, "benzo", { dose:7.5 }); assert.equal(ra.unneeded.length, 1, "a second with no fit has no reason");
});

test("phase 1 (3): doses within 10% full, within 25% half, further off harmful", ()=>{
  const c = p1({ variant:1 });   // Hauwa, 11 kg: artesunate 3 mg/kg = 33 mg
  assert.equal(E.doseInfo(c, "artesunate").right, 33);
  assert.equal(E.doseCheck(c, "artesunate", 35).band, "full");
  assert.equal(E.doseCheck(c, "artesunate", 40).band, "half");
  assert.equal(E.doseCheck(c, "artesunate", 24).band, "wrong");
  assert.equal(E.doseInfo(p1({ variant:2 }), "artesunate").right, 52.8, "2.4 mg/kg from 20 kg");
  const run = E.newRun(c); E.act(c, run, "artesunate", { dose:40 }); E.act(c, run, "o2_nasal"); E.act(c, run, "dextrose10", { dose:200 });
  const sc = E.score(c, run);
  assert.equal(sc.items.find(i=>/Worked out the doses/.test(i.label)).earned, 1.5);
  assert.ok(sc.items.some(i=>/^Harmful: wrong dose of 10% dextrose/.test(i.label)));
  assert.equal(E.extraTeaching(c, run).length, 2);
});

test("phase 1 (7): the right first move costs nothing, a wrong one a minute and points to the right tab", ()=>{
  const c = p1({ variant:2 }), a = E.newRun(c), b = E.newRun(c);
  assert.equal(E.firstMove(c, a, "bloods").right, true); assert.equal(a.t, 0);
  const w = E.firstMove(c, b, "abc"); assert.equal(w.right, false); assert.equal(w.tab, "tests"); assert.equal(b.t, 1);
  assert.equal(E.firstMove(c, b, "bloods"), null, "only once");
});

test("phase 1 (8): the glucose recheck is due 30 min after the first one, and a PCV after the blood", ()=>{
  const c = p1({ variant:1 }), run = E.newRun(c);
  E.act(c, run, "rbg"); E.wait(c, run, 26);
  let r = E.rechecks(c, run).find(x=>x.test==="rbg"); assert.equal(r.dueAt, 30); assert.equal(r.due, true);
  E.act(c, run, "rbg"); r = E.rechecks(c, run).find(x=>x.test==="rbg"); assert.equal(r.done, true); assert.equal(r.due, false);
  assert.ok(E.score(c, run).items.some(i=>/Rechecked on time: blood glucose/.test(i.label) && i.earned===3));
  assert.ok(!E.rechecks(c, run).some(x=>x.test==="pcv"), "no PCV recheck before any blood");
});

test("phase 1 (9): the handover scores 2.5 per right part, built from the student's own run", ()=>{
  const c = p1({ variant:0 }), run = E.newRun(c);
  E.act(c, run, "benzo", { dose:7.5 }); E.act(c, run, "rbg");
  const parts = E.handoverParts(c, run);
  assert.deepEqual(parts.map(p=>p.id), ["situation","done","now","watch"]);
  parts.forEach(p=>{ assert.equal(p.options.length, 3); assert.equal(new Set(p.options).size, 3, p.id+" options differ"); assert.ok(p.options.includes(p.right)); });
  const done = parts.find(p=>p.id==="done");
  assert.match(done.right, /stopped the fit/); assert.doesNotMatch(done.right, /dextrose/, "forgotten dextrose is not claimed");
  const picks = {}; parts.forEach(p=>{ picks[p.id] = p.id==="watch" ? p.options.find(o=>o!==p.right) : p.right; });
  const sc = E.finish(c, run, "severe-malaria", "refer", { picks });
  assert.equal(sc.items.find(i=>i.group==="handover").earned, 7.5);
  const c2 = p1({ variant:0 }), r2 = E.newRun(c2);
  E.finish(c2, r2, "severe-malaria", "refer", { text:"Severe malaria. Gave artesunate. Stable sats 96. Watch the sugar." });
  assert.equal(E.score(c2, r2).items.find(i=>i.group==="handover").earned, 10, "typed handover with the 4 key facts");
});

test("phase 1 (10): a run replays exactly from its steps, and Try again restarts before the first late step", ()=>{
  const c = p1({ variant:1, complication:"hypo2" }), run = E.newRun(c);
  E.firstMove(c, run, "abc"); E.act(c, run, "o2_nasal"); E.ask(c, run, "fever"); E.examine(c, run, "general"); E.wait(c, run, 20);
  E.freeAsk(c, run, "any cough?", "No cough.", ["breath"]); E.act(c, run, "pcv");
  const again = E.replay(c, run.steps, Infinity);
  assert.equal(again.t, run.t); assert.deepEqual(again.v, run.v); assert.deepEqual(again.asked, run.asked); assert.deepEqual(again.steps, run.steps);
  const rp = E.replayPoint(c, run);
  assert.equal(rp.label, "Checked the haemoglobin (PCV or FBC)");
  assert.ok(rp.at<=13, "restored at "+rp.at); assert.ok(!rp.run.done.pcv);
});

test("phase 1 (4): a complication pushes a nurse warning", ()=>{
  const c = p1({ variant:1, complication:"hypo2" }), run = E.newRun(c);
  E.wait(c, run, c.variant.complication.at+1);
  assert.equal(run.alerts.length, 1); assert.match(run.alerts[0].text, /nurse calls/);
  const off = E.instantiate(sm, { seed:7, variant:1, severity:1, night:false, complication:"hypo2" }), r2 = E.newRun(off);
  E.wait(off, r2, off.variant.complication.at+1); assert.equal(r2.alerts.length, 0);
});

test("phase 1: clinical points use the harder-start bonuses, and a replay earns half", ()=>{
  const c = p1({ variant:1, severity:2, night:true, complication:null }), run = E.newRun(c);
  const b = E.bonusOf(c, run); assert.equal(b.x, 1.5625); assert.equal(b.add, 0);
  assert.equal(E.clinicalPoints(80, { x:1 }), 11);
  assert.equal(E.clinicalPoints(80, { x:b.x }), 17);
  assert.equal(E.clinicalPoints(80, { x:1, mode:"practice" }), 6);
  assert.equal(E.clinicalPoints(90, { unsafe:true }), 6);
});
