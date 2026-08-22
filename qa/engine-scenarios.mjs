/* =====================================================================
 * MedBank — Smart-Drill engine validation harness (headless, log-only)
 *
 * Extracts the REAL frozen engine functions out of app.html (not copies)
 * and asserts that, on a set of canonical Q-bank answer scenarios, the
 * two-axis diagnosis (gap / misconception / fragile / solid) and the
 * Smart-Drill recommendation (focus dimensions) come out correctly.
 *
 * Purpose: a regression guard so any future change that breaks the
 * diagnosis or the recommendation is caught automatically. Run:
 *     node qa/engine-scenarios.mjs
 * Exit 0 = all pass. Exit 1 = a scenario failed (prints what).
 * This file NEVER edits app code and has no side effects.
 * ===================================================================== */
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const APP = path.join(__dirname, "..", "app.html");
const src = fs.readFileSync(APP, "utf8");

/* ---- balanced-brace extraction of a top-level `function NAME(...){...}` ---- */
function extractFn(name){
  const re = new RegExp("function\\s+" + name + "\\s*\\(", "g");
  const m = re.exec(src);
  if(!m) throw new Error("function not found: " + name);
  let i = src.indexOf("{", m.index);
  if(i < 0) throw new Error("no body brace for " + name);
  let depth = 0, j = i;
  for(; j < src.length; j++){
    const c = src[j];
    if(c === "{") depth++;
    else if(c === "}"){ depth--; if(depth === 0){ j++; break; } }
  }
  return src.slice(m.index, j);
}
/* ---- extract `var NAME = {...};` (the SMART config) ---- */
function extractVarObj(name){
  const re = new RegExp("var\\s+" + name + "\\s*=\\s*\\{", "g");
  const m = re.exec(src);
  if(!m) throw new Error("var not found: " + name);
  let i = src.indexOf("{", m.index), depth = 0, j = i;
  for(; j < src.length; j++){
    const c = src[j];
    if(c === "{") depth++;
    else if(c === "}"){ depth--; if(depth === 0){ j++; break; } }
  }
  return src.slice(m.index, j) + ";";
}

/* ---- build a sandbox: real engine funcs + minimal stubs for globals ---- */
let SCENARIO = { _attempts: [], _qmeta: {}, _sessions: [], _events: [] };
const sandbox = {
  qbStore: () => SCENARIO,           // feed the engine our constructed attempt log
  smartCourseMap: () => ({}),        // no course map in the harness
  persist: () => {},
  render: () => {},
  Math, Date, Object, Array, JSON, console,
};

const pieces = [
  extractVarObj("SMART"),
  "var _COG_LADDER=['interpretation','clinical_reasoning','complex_reasoning'];",
  extractFn("smartExamDate"),
  extractFn("smartHalfLife"),
  extractFn("smartBand"),
  extractFn("smartStats"),
  extractFn("smartAcc"),
  extractFn("smartState"),
  extractFn("smartDiagnose"),
  extractFn("smartBandOf"),
  extractFn("smartWeak"),
  extractFn("smartDrillPlan"),
  extractFn("qbCogOf"),
  extractFn("qbCogLabel"),
  extractFn("qbSkillLabel"),
];

// _QB_D2C is referenced by qbCogOf via difficulty; provide a benign default.
const preamble = "var _QB_D2C={};";
const exportNames = ["SMART","smartStats","smartAcc","smartState","smartDiagnose","smartBandOf","smartWeak","smartDrillPlan","qbCogOf"];
const factory = new Function(
  ...Object.keys(sandbox),
  preamble + "\n" + pieces.join("\n") + "\nreturn {" + exportNames.map(n=>n+":"+n).join(",") + "};"
);
const ENG = factory(...Object.values(sandbox));

/* ---- helpers to build a scenario from a compact spec ---- */
let _uid = 0;
function attempts(spec){
  // spec: { skill, tag, n, ok, conf }  -> n attempts on one concept
  const out = [];
  const now = Date.now();
  spec.forEach(s => {
    for(let k=0;k<s.n;k++){
      const qh = (s.skill||"x") + "_" + (s.tag||"g") + "_" + k;
      SCENARIO._qmeta[qh] = { skill:s.skill||"", tag:s.tag||"General", cognitive_level:s.cog||"clinical_reasoning" };
      out.push({ u:"a"+(_uid++), qh, topicId:"t1", ok:!!s.ok, conf:s.conf, ms:3000, ts: now - (out.length*1000) });
    }
  });
  return out;
}
function loadScenario(spec){
  SCENARIO = { _attempts: [], _qmeta: {}, _sessions: [], _events: [] };
  SCENARIO._attempts = attempts(spec);
}

/* ---- assertions ---- */
let failures = [];
function diagnoseSkill(skill){
  const st = ENG.smartStats("*");
  return ENG.smartDiagnose(st.bySkill[skill]);
}
function expectDiag(name, skill, expectedType){
  const d = diagnoseSkill(skill);
  const got = d ? d.type : null;
  const ok = got === expectedType;
  if(!ok) failures.push(`${name}: skill '${skill}' → expected '${expectedType}', got '${got}'`);
  console.log(`  [${ok?"PASS":"FAIL"}] ${name}: ${skill} → ${got} (want ${expectedType})`);
}

console.log("MedBank Smart-Drill engine validation — " + new Date().toISOString());
console.log("SMART config in use:", JSON.stringify(ENG.SMART.MIX), "MIN_EV="+ENG.SMART.MIN_EV, "MIN_TOTAL="+ENG.SMART.MIN_TOTAL);

/* Scenario 1 — pure knowledge gap: low accuracy, low confidence, no confident-wrong */
loadScenario([{ skill:"investigation", tag:"Diagnostic approach", n:6, ok:false, conf:1 }]);
console.log("\nScenario 1 — pure gap (6× wrong + unsure)");
expectDiag("gap", "investigation", "gap");

/* Scenario 2 — misconception: wrong while CONFIDENT */
loadScenario([{ skill:"management", tag:"Management", n:6, ok:false, conf:3 }]);
console.log("\nScenario 2 — misconception (6× wrong + confident)");
expectDiag("misconception", "management", "misconception");

/* Scenario 3 — fragile: right but UNSURE */
loadScenario([{ skill:"differential", tag:"DDx", n:5, ok:true, conf:1 }]);
console.log("\nScenario 3 — fragile (5× correct + unsure)");
expectDiag("fragile", "differential", "fragile");

/* Scenario 4 — solid: right AND confident */
loadScenario([{ skill:"diagnosis", tag:"Clinical", n:6, ok:true, conf:3 }]);
console.log("\nScenario 4 — solid (6× correct + confident)");
expectDiag("solid", "diagnosis", "solid");

/* Scenario 5 — below the evidence floor: must not diagnose on noise */
loadScenario([{ skill:"management", tag:"Management", n:2, ok:false, conf:3 }]);
console.log("\nScenario 5 — under MIN_EV (2 attempts) → no diagnosis");
{
  const d = diagnoseSkill("management");
  const ok = d === null;
  if(!ok) failures.push("evidence-gate: 2 attempts should NOT diagnose, got " + (d&&d.type));
  console.log(`  [${ok?"PASS":"FAIL"}] evidence gate: ${d?d.type:"null"} (want null)`);
}

/* Scenario 6 — the Smart-Drill RECOMMENDATION: mixed profile,
   plan must surface the two weak areas, misconception ranked first. */
loadScenario([
  { skill:"management",    tag:"Management",         n:5, ok:false, conf:3 },   // misconception
  { skill:"investigation", tag:"Diagnostic approach", n:5, ok:false, conf:1 },  // gap
  { skill:"diagnosis",     tag:"Clinical",           n:6, ok:true,  conf:3 },   // solid
]);
console.log("\nScenario 6 — Smart-Drill recommendation (mixed profile)");
{
  const plan = ENG.smartDrillPlan("*", 20, true);
  const okReady = plan && plan.ok;
  if(!okReady) failures.push("recommendation: plan not ok on 16 attempts (MIN_TOTAL="+ENG.SMART.MIN_TOTAL+")");
  const labels = (plan.focus||[]).map(f=>f.label).join(", ");
  const hasMgmt = (plan.focus||[]).some(f=>/management/i.test(f.label));
  const hasInv  = (plan.focus||[]).some(f=>/investigation/i.test(f.label));
  const firstIsMisconWeak = plan.focus && plan.focus.length && /management/i.test(plan.focus[0].label);
  console.log("  focus:", labels || "(none)");
  console.log("  why:", (plan.reasons&&plan.reasons[0])||"(none)");
  if(!hasMgmt) failures.push("recommendation: focus missing Management (misconception)");
  if(!hasInv)  failures.push("recommendation: focus missing Investigation (gap)");
  if(!firstIsMisconWeak) failures.push("recommendation: misconception (Management) should rank first, focus was: "+labels);
  const ok = okReady && hasMgmt && hasInv && firstIsMisconWeak;
  console.log(`  [${ok?"PASS":"FAIL"}] recommendation surfaces both weak areas, misconception first`);
}

console.log("\n" + (failures.length ? ("❌ " + failures.length + " FAILURE(S):\n - " + failures.join("\n - ")) : "✅ ALL SCENARIOS PASSED"));
process.exit(failures.length ? 1 : 0);
