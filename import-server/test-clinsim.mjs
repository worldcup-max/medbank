// node --test test-clinsim.mjs — Clinical Simulation: the case-pack builder (clinsim.mjs), the built-in
// content (clinsim-cases.js) and the scoring in clinsim.js (OSCE domains, weighted quick cases, daily guesses).
import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { createRequire } from "node:module";
import vm from "node:vm";
import { isClinicalLevel, quoteInNote, buildCasePackPrompt, validateCasePack, packSize } from "./clinsim.mjs";

const require = createRequire(import.meta.url);
const E = require("../er-sim.js");
const src = f => readFileSync(new URL("../" + f, import.meta.url), "utf8");

// a browser-ish sandbox: clinsim.js needs `document` to exist, nothing more until it draws
const win = { ERSIM_ENGINE: E, MEDBANK_CONFIG: { FEATURES: { CLINICAL_SIM: true } } };
const doc = { getElementById: () => null, createElement: () => ({}), head: { appendChild(){} } };
const sandbox = { window: win, document: doc, location: { hash: "" }, localStorage: {}, navigator: {} };
vm.runInNewContext(src("er-sim-cases.js"), sandbox);
vm.runInNewContext(src("clinsim-cases.js"), sandbox);
vm.runInNewContext(src("clinsim.js"), sandbox);
const CS = win.MB_CLINSIM, T = CS._test;

const NOTE = `## Severe malaria in children
Severe malaria is a medical emergency. Danger signs include impaired consciousness, repeated convulsions, prostration and respiratory distress.
Give IV or IM artesunate as soon as severe malaria is suspected, and check the blood glucose because hypoglycaemia is common in children with severe malaria.
Treat a convulsion lasting more than five minutes with a benzodiazepine.`;

function goodPack(){
  return {
    osce: [{ title: "A child who will not wake up", src: "check the blood glucose because hypoglycaemia is common",
      patient: { name: "Musa Bello", age: "4", sex: "male" }, speaker: "Musa's mother", persona: "worried", opening: "Doctor, please help.",
      background: "No travel.", history: Array.from({ length: 8 }, (_, i) => ({ id: "h" + i, q: "Question " + i + "?", a: "Answer " + i, key: i < 4 })),
      dx: { options: ["Severe malaria", "Meningitis", "Hypoglycaemia only", "Epilepsy"], correct: 0 },
      plan: { options: ["IV artesunate and check glucose", "Oral ACT at home", "Antibiotics only", "Observe"], correct: 0 }, teaching: ["Check glucose."] }],
    quick: [{ title: "A child with fever who is fitting", src: "Give IV or IM artesunate as soon as severe malaria is suspected",
      patient: { name: "Aisha", age: "3", sex: "female" }, stem: "A child is carried in fitting.",
      steps: [0, 1, 2].map(i => ({ prompt: "Step " + i, reveal: "Revealed " + i, options: [{ t: "Best", pts: 10, why: "b" }, { t: "Weak", pts: 3, why: "w" }, { t: "Bad", pts: -10, why: "d" }] })),
      mcqs: [{ stem: "Q?", options: ["a", "b", "c", "d"], ans: 1, why: "because" }], teaching: [] }],
    daily: [{ answer: "Severe malaria", aliases: ["cerebral malaria"], src: "Danger signs include impaired consciousness, repeated convulsions",
      clues: ["1", "2", "3", "4", "5", "6"], why: "Classic." }]
  };
}

test("only 400, 500 and 600 level are clinical", () => {
  for(const l of [400, 500, 600, "500"]) assert.ok(isClinicalLevel(l), String(l));
  for(const l of [100, 200, 300, null, undefined, 700]) assert.ok(!isClinicalLevel(l), String(l));
});

test("quotes are checked against the note, ignoring case, punctuation and markdown", () => {
  assert.ok(quoteInNote("SEVERE MALARIA is a medical emergency.", NOTE));
  assert.ok(quoteInNote("give iv or im artesunate as soon as severe malaria is suspected, always", NOTE));   // a run of 6 words is enough
  assert.ok(!quoteInNote("Give ceftriaxone for typhoid perforation", NOTE));
  assert.ok(!quoteInNote("malaria", NOTE));   // too short to prove anything
});

test("the prompt carries the note and the grounding rule", () => {
  const p = buildCasePackPrompt(NOTE, "Severe malaria");
  assert.match(p, /ONLY from the lecture note/);
  assert.ok(p.includes("hypoglycaemia is common"));
});

test("a grounded pack passes validation intact", () => {
  const p = validateCasePack(goodPack(), NOTE);
  assert.equal(p.dropped, 0);
  assert.equal(packSize(p), 3);
  assert.equal(p.osce[0].history.length, 8);
  assert.equal(p.quick[0].steps.length, 3);
  assert.equal(p.daily[0].clues.length, 6);
});

test("cases whose quote is not in the note are dropped", () => {
  const raw = goodPack(); raw.osce[0].src = "Typhoid perforation needs urgent laparotomy and antibiotics";
  const p = validateCasePack(raw, NOTE);
  assert.equal(p.osce.length, 0); assert.equal(p.dropped, 1);
});

test("broken cases are dropped: no single best option, too little history, bad answer index", () => {
  const raw = goodPack();
  raw.quick[0].steps.forEach(s => { s.options[1].pts = 10; });   // two best options in every step
  raw.osce[0].history = raw.osce[0].history.slice(0, 3);
  raw.daily[0].clues = ["only", "two"];
  const p = validateCasePack(raw, NOTE);
  assert.equal(packSize(p), 0); assert.equal(p.dropped, 3);
  const r2 = goodPack(); r2.osce[0].dx.correct = 9;
  assert.equal(validateCasePack(r2, NOTE).osce.length, 0);
});

test("a non-clinical note gives an empty pack, not an error", () => {
  const p = validateCasePack({ osce: [], quick: [], daily: [] }, "The brachial plexus is formed from C5 to T1.");
  assert.equal(packSize(p), 0);
  assert.equal(packSize(validateCasePack(null, NOTE)), 0);
});

test("built-in quick cases are well formed", () => {
  const Q = win.CLINSIM_QUICK; assert.ok(Q.length >= 4);
  const ids = new Set();
  for(const q of Q){
    assert.ok(!ids.has(q.id), "duplicate id " + q.id); ids.add(q.id);
    assert.ok(q.steps.length >= 3, q.id);
    q.steps.forEach((s, i) => {
      assert.equal(s.options.filter(o => o.pts === 10).length, 1, q.id + " step " + i + " needs exactly one best option");
      s.options.forEach(o => assert.ok(o.pts >= -10 && o.pts <= 10 && o.why, q.id + " step " + i));
    });
    q.mcqs.forEach((m, i) => { assert.equal(m.options.length, 4, q.id + " mcq " + i); assert.ok(m.ans >= 0 && m.ans < 4); });
    assert.ok(!/eclampsia|sickle|tuberculosis|jaundice/i.test(q.title), q.id + ": the title must not give the diagnosis away");
  }
});

test("built-in daily puzzles have six clues and their own answer counts as right", () => {
  for(const d of win.CLINSIM_DAILY){
    assert.equal(d.clues.length, 6, d.id);
    assert.ok(T.isRight(d, d.answer), d.id);
    d.aliases.forEach(a => assert.ok(T.isRight(d, a), d.id + " alias " + a));
    d.clues.forEach(c => assert.ok(!c.toLowerCase().includes(d.answer.toLowerCase()), d.id + ": a clue names the answer"));
  }
  const lassa = win.CLINSIM_DAILY.find(d => d.id === "d-lassa");
  assert.ok(T.isRight(lassa, "Lasa fever"));    // small typo forgiven
  assert.ok(!T.isRight(lassa, "Malaria"));
});

test("every ER Sim case becomes a valid OSCE station", () => {
  const S = T.stations("builtin");
  assert.equal(S.length, win.ERSIM_CASES.filter(c => !c.tutorial).length);
  for(const s of S){
    assert.ok(s.history.some(h => h.key), s.id);
    assert.ok(s.dx.correct >= 0, s.id + " dx");
    assert.ok(s.plan && s.plan.correct >= 0, s.id + " plan");
  }
});

test("OSCE marking: full marks, a silent candidate, and the pass rule", () => {
  const s = T.stations("builtin")[0];
  const all = {}; s.history.forEach((h, i) => { all[h.id] = i; });
  const good = { s, asked: all, dx: s.dx.correct, plan: s.plan.correct,
    said: ["Good morning, my name is Dr Ade, a medical student. Can I ask you some questions?", "What brings you in today?", "Is it okay if I examine?", "What is your name and how old are you?",
           "What are you most worried about?", "So far you told me about the fever, let me recap.", "Do you have any questions?"] };
  const sc = T.osceScore(good);
  assert.equal(sc.data, 100); assert.equal(sc.mgmt, 100); assert.equal(sc.ip, 100); assert.ok(sc.pass);
  const bad = T.osceScore({ s, asked: {}, dx: null, plan: null, said: [] });
  assert.equal(bad.total, 0); assert.ok(!bad.pass);
  const lopsided = T.osceScore(Object.assign({}, good, { dx: (s.dx.correct + 1) % s.dx.options.length, plan: (s.plan.correct + 1) % s.plan.options.length }));
  assert.equal(lopsided.mgmt, 0); assert.ok(!lopsided.pass, "a zero in one domain fails the station even with a high total");
  // the study-group examiner sheet scores the same way
  const ticks = { h: Object.fromEntries(s.history.map(h => [h.id, true])), ip: Object.fromEntries(T.IP.map(i => [i.id, true])), dx: s.dx.correct, plan: s.plan.correct };
  assert.equal(T.osceScore({ s }, ticks).total, 100);
});

test("quick case scoring weights danger: one dangerous pick fails the case", () => {
  const q = win.CLINSIM_QUICK[0];
  const bestPicks = q.steps.map(s => s.options.findIndex(o => o.pts === 10));
  assert.equal(JSON.stringify(T.quickScore(q, bestPicks)), JSON.stringify({ pct: 100, grade: "Excellent", danger: [] }));
  const oneBad = bestPicks.slice(); oneBad[1] = q.steps[1].options.findIndex(o => o.pts === -10);
  const sc = T.quickScore(q, oneBad);
  assert.equal(sc.danger.length, 1);
  assert.match(sc.grade, /dangerous/);
  assert.ok(sc.pct < 100);
});

test("the tab is gated to clinical levels", () => {
  win.MB_SYNC = { currentLevel: () => 300, status: () => ({ syncing: true, canUseFeatures: true }) };
  assert.ok(!CS.visible());
  assert.match(CS.page([]), /400, 500 and 600 level/);
  win.MB_SYNC.currentLevel = () => 500;
  assert.ok(CS.visible());
  assert.match(CS.page([]), /Clinical Simulation/);
  delete win.MB_SYNC;
});
