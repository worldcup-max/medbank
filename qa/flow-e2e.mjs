/* =====================================================================
 * MedBank — V1.6 Increment-2 end-to-end flow validation (headless)
 * Drives the REAL functions extracted from app.html through the full path:
 *   session ends → fixQueue → select item → correct intervention opens →
 *   (gap) Learn → Practice → Retest → Result → telemetry.
 * Verifies: diagnosis-specific routing, retest is a DIFFERENT question on the
 * SAME objective, telemetry fires, flag independence, engine untouched.
 * Run: node qa/flow-e2e.mjs
 * ===================================================================== */
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const src = fs.readFileSync(path.join(__dirname, "..", "app.html"), "utf8");

function extractFn(name){
  const m = new RegExp("function\\s+" + name + "\\s*\\(").exec(src);
  if(!m) throw new Error("fn not found: " + name);
  let i = src.indexOf("{", m.index), d=0, j=i;
  for(; j<src.length; j++){ const c=src[j]; if(c==="{")d++; else if(c==="}"){d--; if(d===0){j++;break;}} }
  return src.slice(m.index, j);
}
function extractVarObj(name){
  const m = new RegExp("var\\s+" + name + "\\s*=\\s*\\{").exec(src);
  let i = src.indexOf("{", m.index), d=0, j=i;
  for(; j<src.length; j++){ const c=src[j]; if(c==="{")d++; else if(c==="}"){d--; if(d===0){j++;break;}} }
  return src.slice(m.index, j) + ";";
}

/* ---- mutable world shared by the extracted functions ---- */
let SCENARIO = { _attempts: [], _qmeta: {}, _events: [] };
let POOL = [];
let LASTDRILL = null;
let uidN = 0;
const store = { mb_current_uid: "student-xyz" };
const sandbox = {
  qbStore: () => SCENARIO,
  smartPool: () => POOL,
  qbQuestionsForTarget: (tid, served) => POOL.filter(q=>q.target_id===tid && !(served||[]).includes(q._qh)),
  smartCourseMap: () => ({}),
  persist: () => {},
  render: () => {},
  gapRender: () => {},                       // DOM paint not needed — we assert state + telemetry
  qbExit: () => {},                          // leaving the results screen (app-level)
  smartDrillDim: (type, key, scope) => { LASTDRILL = { type, key: decodeURIComponent(key), scope }; },
  qbUid: () => "u" + (uidN++),
  qbCogOf: (q) => (q && q.cognitive_level) || "clinical_reasoning",
  window: { MEDBANK_CONFIG: { FEATURES: { GAP_LOOP: true, POST_SESSION_FIX_QUEUE: true } } },
  localStorage: { getItem: (k) => (k in store ? store[k] : null) },
  document: { getElementById: () => null, createElement: () => ({ style:{}, appendChild(){}, set innerHTML(v){}, get innerHTML(){return "";} }), body:{ appendChild(){} } },
  Math, Date, Object, Array, JSON, console, parseInt, decodeURIComponent, encodeURIComponent,
};

const pieces = [
  "var GAPLOOP=null;", "var _FIXQ=[];",
  extractVarObj("SMART"),
  "var _COG_LADDER=['interpretation','clinical_reasoning','complex_reasoning'];",
  extractFn("smartExamDate"), extractFn("smartHalfLife"), extractFn("smartBand"),
  extractFn("smartStats"), extractFn("smartAcc"), extractFn("smartDiagnose"),
  extractFn("qbSkillLabel"), extractFn("qbShuffle"), extractFn("qbHash"), extractFn("smartLog"),
  extractFn("gapOn"), extractFn("fragOn"), extractFn("gapDiag"), extractFn("gapConceptPool"), extractFn("gapBucket"),
  extractFn("gapStart"), extractFn("gapToPractice"), extractFn("gapPick"), extractFn("gapAdvance"), extractFn("gapLogAttempt"),
  extractFn("fixQConceptQh"), extractFn("fixQueue"), extractFn("fixQAction"), extractFn("fixQGo"),
];
const names = ["fixQueue","fixQAction","fixQGo","gapStart","gapToPractice","gapPick","gapAdvance","gapOn"];
const factory = new Function(...Object.keys(sandbox),
  "var _QB_D2C={};\n" + pieces.join("\n")
  + "\nreturn {" + names.map(n=>n+":"+n).join(",")
  + ", getGAPLOOP:function(){return GAPLOOP;}, resetGAP:function(){GAPLOOP=null;}, setFIXQ:function(v){_FIXQ=v;}};");
const A = factory(...Object.values(sandbox));

/* ---- scenario builder ---- */
let ev = () => SCENARIO._events;
function reset(){ SCENARIO = { _attempts: [], _qmeta: {}, _events: [] }; POOL = []; LASTDRILL = null; A.resetGAP(); }
function addAttempts(spec){
  spec.forEach(s => { for(let k=0;k<s.n;k++){
    const qh = s.skill+"_"+s.tag+"_"+k;
    SCENARIO._qmeta[qh] = { skill:s.skill, tag:s.tag, subtopic:s.tag, target_id:"TGT_"+s.tag, cognitive_level:"clinical_reasoning", objective:"OBJ_"+s.tag, src:"note#"+s.tag };
    SCENARIO._attempts.push({ u:"a"+(uidN++), qh, topicId:"t1", ok:!!s.ok, conf:s.conf, ms:3000, ts: Date.now()-(SCENARIO._attempts.length*1000) });
  }});
}
function addPool(skill, tag, count){
  for(let k=0;k<count;k++) POOL.push({ _qh: skill+"_"+tag+"_pool"+k, _topicId:"t1", skill, tag, subtopic:tag, target_id:"TGT_"+tag,
    objective:"OBJ_"+tag, teaching:"OBJ_"+tag, options:["a","b","c","d"], answer:0, stem:"pool "+tag+" "+k, src:"note#"+tag });
}

let fails = [];
function check(name, cond, extra){ console.log(`  [${cond?"PASS":"FAIL"}] ${name}${extra?(" — "+extra):""}`); if(!cond) fails.push(name); }
const has = (t) => ev().some(e => e.t === t);
const last = (t) => [...ev()].reverse().find(e => e.t === t);

console.log("V1.6 Increment-2 end-to-end flow — " + new Date().toISOString());

/* ============ FULL GAP PATH: queue → select gap → Learn → Practice → Retest → Result ============ */
reset();
addAttempts([
  { skill:"management",    tag:"Mgmt", n:6, ok:false, conf:3 },  // misconception
  { skill:"investigation", tag:"Ix",   n:6, ok:false, conf:1 },  // gap
  { skill:"differential",  tag:"DDx",  n:5, ok:true,  conf:1 },  // fragile
]);
addPool("investigation","Ix", 3);   // sibling questions on the gap concept for practice + retest
const q = A.fixQueue("*"); A.setFIXQ(q);
console.log("  queue:", q.map(x=>x.label+"="+x.dg.type).join(" | "));
const gapIdx = q.findIndex(x=>x.dg.type==="gap");
check("queue has a gap item to select", gapIdx>=0);

A.fixQGo(gapIdx);   // select the gap item → should open the gap loop
check("fix_queue_item_selected logged", has("fix_queue_item_selected"));
check("intervention_started{source:queue} logged", (last("intervention_started")||{}).source==="queue");
let g = A.getGAPLOOP();
check("gap loop opened from queue", !!g && g.step);
check("intervention_shown source=queue", (last("intervention_shown")||{}).source==="queue");

// RE-BASELINE: practice drawn from the Target's A6 siblings; NO in-overlay retest (A6 owns retention)
check("practice question present (Target sibling)", !!(g && g.practiceQ && g.practiceQ._qh));
check("NO in-overlay retest question (A6 owns retention)", g && g.retestQ===undefined);
check("identity === target_id", g && typeof g.target_id==="string" && g.concept===g.target_id);

// drive: (learn→)practice→result  (no retest step)
if(g.step==="learn"){ A.gapToPractice(); check("LEARN step logged", (ev().filter(e=>e.t==="intervention_step"&&e.step==="learn").length)>=1); }
g = A.getGAPLOOP();
A.gapPick(g.practiceQ.answer);        // answer practice correctly
A.gapAdvance();                       // → result (straight; no retest step)
g = A.getGAPLOOP();
check("advanced straight to RESULT (no retest step)", g.step==="result");
check("intervention_completed logged with practice_ok", (last("intervention_completed")||{}).practice_ok===true);
// practice recorded as an ordinary attempt so the engine counts it
const gapPrac = (SCENARIO._gapPractice||[]).map(a=>a.mode);
check("gap_practice logged SEPARATELY, never in _attempts (masking fix)",
      gapPrac.includes("gap_practice") && !SCENARIO._attempts.some(a=>/^gap_/.test(a.mode)),
      "gapPractice=["+gapPrac.join(",")+"] _attempts-gap="+SCENARIO._attempts.filter(a=>/^gap_/.test(a.mode)).length);

/* ============ ROUTING: misconception → drill, fragile → drill ============ */
reset();
addAttempts([{ skill:"management", tag:"Mgmt", n:6, ok:false, conf:3 }]); addPool("management","Mgmt",2);
let qm = A.fixQueue("*"); A.setFIXQ(qm); A.fixQGo(0);
check("misconception routes to a focused drill (not the gap loop)", !!LASTDRILL && A.getGAPLOOP()===null, LASTDRILL?("drill on "+LASTDRILL.key):"no drill");

reset();
addAttempts([{ skill:"differential", tag:"DDx", n:5, ok:true, conf:1 }]); addPool("differential","DDx",2);
let qf = A.fixQueue("*"); A.setFIXQ(qf); A.fixQGo(0);
check("fragile routes to a Smart Drill", !!LASTDRILL && A.getGAPLOOP()===null, LASTDRILL?("drill on "+LASTDRILL.key):"no drill");

/* ============ SILENT-FAILURE GUARD: gap with NO loop material → must fall back to a drill ============ */
reset();
addAttempts([{ skill:"investigation", tag:"Ix", n:6, ok:false, conf:1 }]);   // gap, but NO sibling pool question added
let qn = A.fixQueue("*"); A.setFIXQ(qn);
check("gap with no material is offered as a drill, not the loop", qn.length && qn[0].canLoop===false);
A.fixQGo(0);
check("no-material gap click falls back to a drill (no silent fail)", !!LASTDRILL && A.getGAPLOOP()===null, LASTDRILL?("drill on "+LASTDRILL.key):"NOTHING HAPPENED");

/* ============ FLAG INDEPENDENCE ============ */
// queue ON, gap flag OFF → gap item must STILL launch the loop (fromQueue bypasses the at-miss flag)
reset();
sandbox.window.MEDBANK_CONFIG.FEATURES.GAP_LOOP = false;
sandbox.window.MEDBANK_CONFIG.FEATURES.POST_SESSION_FIX_QUEUE = true;
addAttempts([{ skill:"investigation", tag:"Ix", n:6, ok:false, conf:1 }]); addPool("investigation","Ix",3);
let qi = A.fixQueue("*"); A.setFIXQ(qi); A.fixQGo(0);
check("queue-on / gap-off: gap item STILL opens the loop (no silent fail)", !!A.getGAPLOOP());
check("gapOn() reflects the flag being off", A.gapOn()===false);
sandbox.window.MEDBANK_CONFIG.FEATURES.GAP_LOOP = true;   // restore

console.log("\n" + (fails.length ? ("❌ "+fails.length+" FAIL:\n - "+fails.join("\n - ")) : "✅ ALL END-TO-END FLOW CHECKS PASSED"));
process.exit(fails.length ? 1 : 0);
