/* =====================================================================
 * MedBank — V1.6 post-session "3 things to fix" queue test (headless)
 * Extracts fixQueue / fixQAction from app.html and asserts the prioritisation
 * layer ranks by value (confidence + severity + recurrence, NOT just lowest
 * accuracy), only surfaces actionable diagnoses, caps at 3, and routes each
 * diagnosis to the right intervention. Run: node qa/fix-queue.mjs
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

let SCENARIO = { _attempts: [], _qmeta: {} };
const sandbox = {
  qbStore: () => SCENARIO, smartCourseMap: () => ({}), persist: () => {}, render: () => {},
  Math, Date, Object, Array, JSON, console, parseInt,
};
const pieces = [
  extractVarObj("SMART"),
  "var _COG_LADDER=['interpretation','clinical_reasoning','complex_reasoning'];",
  extractFn("smartExamDate"), extractFn("smartHalfLife"), extractFn("smartBand"),
  extractFn("smartStats"), extractFn("smartAcc"), extractFn("smartDiagnose"),
  extractFn("qbCogOf"), extractFn("qbSkillLabel"),
  extractFn("fixQConceptQh"), extractFn("fixQueue"), extractFn("fixQAction"),
];
const names = ["fixQueue","fixQAction","SMART"];
const factory = new Function(...Object.keys(sandbox),
  "var _QB_D2C={};\n" + pieces.join("\n") + "\nreturn {" + names.map(n=>n+":"+n).join(",") + "};");
const F = factory(...Object.values(sandbox));

let _uid = 0;
function add(spec){
  spec.forEach(s => { for(let k=0;k<s.n;k++){
    const qh = (s.skill||"x")+"_"+(s.tag||"g")+"_"+k;
    SCENARIO._qmeta[qh] = { skill:s.skill||"", tag:s.tag||"General", cognitive_level:"clinical_reasoning", objective:"Obj "+(s.tag||"g") };
    SCENARIO._attempts.push({ u:"a"+(_uid++), qh, topicId:"t1", ok:!!s.ok, conf:s.conf, ms:3000, ts: Date.now()-(SCENARIO._attempts.length*1000) });
  }});
}
function reset(){ SCENARIO = { _attempts: [], _qmeta: {} }; }

let fails = [];
function check(name, cond, extra){ console.log(`  [${cond?"PASS":"FAIL"}] ${name}${extra?(" — "+extra):""}`); if(!cond) fails.push(name); }

console.log("V1.6 fix-queue prioritisation — " + new Date().toISOString());

/* Scenario A — a rich mixed session: misconception, gap, fragile, and a SOLID area */
reset();
add([
  { skill:"management",    tag:"Mgmt", n:6, ok:false, conf:3 },   // misconception (confident-wrong)
  { skill:"investigation", tag:"Ix",   n:6, ok:false, conf:1 },   // gap (unsure-wrong)
  { skill:"differential",  tag:"DDx",  n:5, ok:true,  conf:1 },   // fragile (right but unsure)
  { skill:"diagnosis",     tag:"Dx",   n:6, ok:true,  conf:3 },   // solid (must NOT appear)
]);
const q = F.fixQueue("*");
console.log("  queue:", q.map(x=>x.label+"="+x.dg.type+"(score "+x.score.toFixed(2)+")").join(" | "));
check("caps at 3 items", q.length===3, "got "+q.length);
check("excludes the SOLID area", !q.some(x=>/diagnosis/i.test(x.label)));
check("includes the misconception (Management)", q.some(x=>x.dg.type==="misconception"));
check("includes the gap (Investigation)", q.some(x=>x.dg.type==="gap"));
check("every item has a launch qh", q.every(x=>typeof x.qh==="string"));

/* routing per diagnosis */
check("gap → gap loop",           F.fixQAction({type:"gap"}).kind==="gap");
check("misconception → drill",    F.fixQAction({type:"misconception"}).kind==="drill");
check("fragile → drill",          F.fixQAction({type:"fragile"}).kind==="drill");

/* Scenario B — ranking is NOT just lowest accuracy:
   a high-evidence misconception at ~30% should outrank a thin gap at ~20%. */
reset();
add([
  { skill:"management",    tag:"Mgmt", n:12, ok:false, conf:3 },  // acc 0%, high evidence, misconception, recurs a lot
  { skill:"investigation", tag:"Ix",   n:3,  ok:false, conf:1 },  // acc 0%, thin evidence, gap
]);
// make management partly-correct so its raw accuracy is HIGHER than investigation's,
// yet it should still rank first on confidence+recurrence+misconception weighting
SCENARIO._attempts.filter(a=>a.qh.startsWith("management")).slice(0,4).forEach(a=>{ a.ok=true; });
const q2 = F.fixQueue("*");
console.log("  queue B:", q2.map(x=>x.label+"="+x.dg.type+" acc"+x.acc+" score"+x.score.toFixed(2)).join(" | "));
const mgmt = q2.find(x=>/management/i.test(x.label)), inv = q2.find(x=>/investigation/i.test(x.label));
check("higher-accuracy misconception can still outrank a lower-accuracy gap",
      !!mgmt && !!inv && mgmt.acc > inv.acc && q2[0]===mgmt,
      mgmt&&inv?("mgmt acc "+mgmt.acc+" ranked #"+(q2.indexOf(mgmt)+1)+", inv acc "+inv.acc):"");

/* Scenario C — below the evidence floor → empty (no over-eager queue on noise) */
reset();
add([{ skill:"management", tag:"Mgmt", n:2, ok:false, conf:3 }]);
check("under MIN_EV → empty queue", F.fixQueue("*").length===0);

console.log("\n" + (fails.length ? ("❌ "+fails.length+" FAIL:\n - "+fails.join("\n - ")) : "✅ ALL FIX-QUEUE CHECKS PASSED"));
process.exit(fails.length ? 1 : 0);
