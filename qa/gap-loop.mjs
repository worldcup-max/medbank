/* =====================================================================
 * MedBank — V1.6 gap-loop decision-logic test (headless)
 * Extracts the gap-loop gating functions from app.html and asserts they
 * offer the Learn loop only when they should (flag on, real gap diagnosis,
 * a miss, and something to teach with) — and stay dormant when the flag is off.
 * Run: node qa/gap-loop.mjs   (exit 0 = pass)
 * ===================================================================== */
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const src = fs.readFileSync(path.join(__dirname, "..", "app.html"), "utf8");

function extractFn(name){
  const m = new RegExp("function\\s+" + name + "\\s*\\(").exec(src);
  if(!m) throw new Error("fn not found: " + name);
  let i = src.indexOf("{", m.index), depth = 0, j = i;
  for(; j < src.length; j++){ const c=src[j]; if(c==="{")depth++; else if(c==="}"){depth--; if(depth===0){j++;break;}} }
  return src.slice(m.index, j);
}
function extractVarObj(name){
  const m = new RegExp("var\\s+" + name + "\\s*=\\s*\\{").exec(src);
  let i = src.indexOf("{", m.index), depth=0, j=i;
  for(; j<src.length; j++){ const c=src[j]; if(c==="{")depth++; else if(c==="}"){depth--; if(depth===0){j++;break;}} }
  return src.slice(m.index, j) + ";";
}

/* scenario + stubs shared by the extracted functions */
let SCENARIO = { _attempts: [], _qmeta: {} };
let POOL = [];
let CFG = { FEATURES: { GAP_LOOP: false } };
const store = { mb_current_uid: "student-123" };
const sandbox = {
  qbStore: () => SCENARIO,
  smartPool: () => POOL,
  smartCourseMap: () => ({}),
  qbHash: (str) => { let h=5381,i=(str||"").length; while(i){ h=(h*33)^(str||"").charCodeAt(--i);} return (h>>>0).toString(36); },
  persist: () => {}, render: () => {},
  window: { MEDBANK_CONFIG: null },   // set per-test below
  localStorage: { getItem:(k)=> (k in store? store[k]: null) },
  GAPLOOP: null,
  Math, Date, Object, Array, JSON, console, parseInt,
};

const pieces = [
  extractVarObj("SMART"),
  "var _COG_LADDER=['interpretation','clinical_reasoning','complex_reasoning'];",
  extractFn("smartExamDate"), extractFn("smartHalfLife"), extractFn("smartBand"),
  extractFn("smartStats"), extractFn("smartAcc"), extractFn("smartDiagnose"),
  extractFn("qbCogOf"),
  extractFn("gapOn"), extractFn("gapDiag"), extractFn("gapConceptPool"),
  extractFn("gapBucket"), extractFn("gapEligible"),
];
const exportNames = ["gapOn","gapDiag","gapConceptPool","gapBucket","gapEligible"];
const factory = new Function(...Object.keys(sandbox),
  "var _QB_D2C={};\n" + pieces.join("\n") + "\nreturn {" + exportNames.map(n=>n+":"+n).join(",") + "};");
const G = factory(...Object.values(sandbox));

/* build a scenario: N attempts on one skill/tag with given ok/conf, + a pool with a sibling question */
function setup({ skill, tag, n, ok, conf, siblings=1, flag }){
  SCENARIO = { _attempts: [], _qmeta: {} };
  const now = Date.now();
  const missedQh = skill + "_" + tag + "_missed";
  for(let k=0;k<n;k++){
    const qh = skill+"_"+tag+"_"+k;
    SCENARIO._qmeta[qh] = { skill, tag, cognitive_level:"clinical_reasoning", objective:"Obj "+tag };
    SCENARIO._attempts.push({ u:"a"+k, qh, topicId:"t1", ok, conf, ms:3000, ts: now-k*1000 });
  }
  // the just-missed question + N sibling questions on the same concept for the pool
  SCENARIO._qmeta[missedQh] = { skill, tag, cognitive_level:"clinical_reasoning", objective:"Obj "+tag };
  POOL = [];
  for(let k=0;k<siblings;k++){
    POOL.push({ _qh: skill+"_"+tag+"_sib"+k, skill, tag, subtopic:tag, options:["a","b","c","d"], answer:0,
                stem:"sib "+k, objective:"Obj "+tag });
  }
  sandbox.window.MEDBANK_CONFIG = { FEATURES: { GAP_LOOP: !!flag } };
  return { missedQh };
}

let fails = [];
function check(name, cond){ console.log(`  [${cond?"PASS":"FAIL"}] ${name}`); if(!cond) fails.push(name); }
const missQ = (skill,tag)=>({ skill, tag, subtopic:tag, options:["a","b","c","d"], answer:0, _qh: skill+"_"+tag+"_missed" });

console.log("V1.6 gap-loop decision logic — " + new Date().toISOString());

/* 1. flag OFF: even a clear gap must NOT offer (dormant for the pilot) */
setup({ skill:"investigation", tag:"Ix", n:6, ok:false, conf:1, siblings:2, flag:false });
check("flag off → no offer", G.gapEligible(missQ("investigation","Ix"), 1) === null);

/* 2. flag ON + gap concept + a miss + a sibling to teach with → offer (returns the gap diagnosis) */
setup({ skill:"investigation", tag:"Ix", n:6, ok:false, conf:1, siblings:2, flag:true });
{ const d = G.gapEligible(missQ("investigation","Ix"), 1); check("flag on + gap + miss → offer", d && d.type==="gap"); }

/* 3. flag ON but the answer was CORRECT → no offer (only fires on a miss) */
check("correct answer → no offer", G.gapEligible(missQ("investigation","Ix"), 0) === null);

/* 4. flag ON but concept is SOLID (right+confident) → no offer */
setup({ skill:"diagnosis", tag:"Dx", n:6, ok:true, conf:3, siblings:2, flag:true });
check("solid concept → no offer", G.gapEligible(missQ("diagnosis","Dx"), 1) === null);

/* 5. flag ON + gap but NO sibling question to teach with → no offer (nothing to serve) */
setup({ skill:"investigation", tag:"Ix", n:6, ok:false, conf:1, siblings:0, flag:true });
check("gap but empty pool → no offer", G.gapEligible(missQ("investigation","Ix"), 1) === null);

/* 6. A/B bucket is deterministic and splits both ways across concepts */
setup({ skill:"investigation", tag:"Ix", n:6, ok:false, conf:1, siblings:2, flag:true });
const b1 = G.gapBucket("investigation|Ix|Obj Ix"), b2 = G.gapBucket("investigation|Ix|Obj Ix");
check("bucket deterministic", b1===b2 && (b1==="matched"||b1==="generic"));
const buckets = Array.from({length:40}, (_,k)=>G.gapBucket("c"+k));
const matched = buckets.filter(b=>b==="matched").length;
check("bucket splits ~50/50 (got "+matched+"/40 matched)", matched>=8 && matched<=32);

console.log("\n" + (fails.length ? ("❌ "+fails.length+" FAIL:\n - "+fails.join("\n - ")) : "✅ ALL GAP-LOOP CHECKS PASSED"));
process.exit(fails.length ? 1 : 0);
