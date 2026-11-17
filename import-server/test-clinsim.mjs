// node --test test-clinsim.mjs — Clinical Simulation: the case-pack builder (clinsim.mjs), the built-in
// content (clinsim-cases.js) and the scoring in clinsim.js (OSCE domains, weighted quick cases, daily guesses).
import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { createRequire } from "node:module";
import vm from "node:vm";
import { isClinicalLevel, quoteInNote, buildCasePackPrompt, validateCasePack, packSize, onTopic, GENERAL_MAX, isClinicalTopic } from "./clinsim.mjs";

const require = createRequire(import.meta.url);
const E = require("../er-sim.js");
const src = f => readFileSync(new URL("../" + f, import.meta.url), "utf8");

// a browser-ish sandbox: clinsim.js needs `document` to exist, nothing more until it draws
const win = { ERSIM_ENGINE: E, MEDBANK_CONFIG: { FEATURES: { CLINICAL_SIM: true } } };
const doc = { getElementById: () => null, createElement: () => ({}), head: { appendChild(){} } };
const LS = { _: {}, getItem(k){ return this._[k] ?? null; }, setItem(k, v){ this._[k] = String(v); }, removeItem(k){ delete this._[k]; } };
const sandbox = { window: win, document: doc, location: { hash: "" }, localStorage: LS, navigator: {}, allTopics: [] };
vm.runInNewContext(src("er-sim-cases.js"), sandbox);
vm.runInNewContext(src("clinsim-cases.js"), sandbox);
vm.runInNewContext(src("clinsim.js"), sandbox);
vm.runInNewContext(src("clinsim-duel.js"), sandbox);
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
  assert.match(p, /"note" cases .*verbatim quote/s);
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

test("course names map to specialties", () => {
  const S = T.specOf;
  assert.equal(S("Obstetrics & Gynaecology"), "Obstetrics & Gynaecology");
  assert.equal(S("O&G 500L"), "Obstetrics & Gynaecology");
  assert.equal(S("Paediatrics"), "Paediatrics");
  assert.equal(S("General Surgery II"), "Surgery");
  assert.equal(S("Community Medicine"), "Community Health");
  assert.equal(S("Internal Medicine"), "Medicine");
  assert.equal(S("Cardiology"), "Medicine");
  assert.equal(S("Biochemistry"), null);
});

test("cases are chosen by course, then topic", () => {
  const paeds = { id: "course_p", name: "Paediatrics", modules: [] };
  const topic = { id: "t1", name: "Neonatal Jaundice", ready: true, note: "x", subject: paeds,
    extras: { clinsim: { osce: [], daily: [], quick: [{ id: "imp-quick-a-0", title: "A yellow baby", patient: { name: "B", age: "1 day", sex: "male" }, stem: "s",
      steps: [0, 1, 2].map(() => ({ prompt: "p", reveal: "", options: [{ t: "a", pts: 10, why: "" }, { t: "b", pts: 0, why: "" }, { t: "c", pts: -10, why: "" }] })), mcqs: [] }] } } };
  sandbox.allTopics.push(topic);
  const cat = T.catalogue();
  const course = { id: "course_p", name: "Paediatrics", spec: "Paediatrics" };
  const mine = cat.filter(it => it.source === "mine");
  assert.equal(mine.length, 1); assert.ok(T.inCourse(mine[0], course));
  // built-in: the jaundiced baby belongs to Paediatrics and to the topic, the pre-eclampsia case does not
  const baby = cat.find(it => it.id === "q-yellow-baby"), preg = cat.find(it => it.id === "q-headache-pregnant");
  assert.ok(T.inCourse(baby, course)); assert.ok(!T.inCourse(preg, course));
  assert.ok(T.topicHit(baby, topic.name)); assert.ok(!T.topicHit(preg, topic.name));
  // a specialty pick takes lecture cases from courses of that specialty
  assert.ok(T.inCourse(mine[0], { id: "spec:Paediatrics", name: "Paediatrics", spec: "Paediatrics" }));
  assert.ok(!T.inCourse(mine[0], { id: "spec:Surgery", name: "Surgery", spec: "Surgery" }));
  // Up next stays inside the course and skips tutorials and puzzles
  const nx = T.upNext(course, 10);
  assert.ok(nx.length > 0);
  nx.forEach(it => { assert.ok(T.inCourse(it, course), it.id); assert.ok(!it.tutorial && it.kind !== "daily"); });
  // the hub renders the course, its topic and the case
  win.MB_SYNC = { currentLevel: () => 500, status: () => ({ syncing: false }) };
  CS.course("course_p");
  const html = CS.page([]);
  assert.match(html, /Neonatal Jaundice/); assert.match(html, /A yellow baby/); assert.match(html, /Up next for you/);
  CS.course("all"); delete win.MB_SYNC; sandbox.allTopics.length = 0;
});

test("topic practice does not ask for the diagnosis the topic gives away", () => {
  const st = T.stations("builtin");
  const mal = st.find(s => s.id === "er-fever-body-pains") || st[0];
  const viewed = T.forCtx(mal, "topic");
  assert.ok(viewed.dxGiven);
  if(mal.form){ assert.equal(viewed.dx.q, mal.form.q); assert.ok(viewed.dx.options.length >= 2 && viewed.dx.options.length < mal.dx.options.length); }
  const snake = st.find(s => s.id === "er-farm-snakebite");
  assert.equal(T.forCtx(snake, "topic").dx, null, "no look-alikes: the diagnosis question is dropped");
  assert.equal(T.forCtx(snake, "open").dx, snake.dx, "elsewhere the diagnosis is still asked");
  // a station with no diagnosis question is marked on the plan alone
  const s2 = T.forCtx(snake, "topic"), all = {}; s2.history.forEach(h => { all[h.id] = 1; });
  const sc = T.osceScore({ s: s2, asked: all, dx: null, plan: s2.plan.correct, said: [] });
  assert.equal(sc.mgmt, 100);
  // the topic panel holds no puzzles, and a pack's form question survives validation
  const v = validateCasePack(Object.assign(goodPack(), { osce: [Object.assign(goodPack().osce[0], { form: { q: "Which form?", options: ["Cerebral", "Severe anaemia", "Uncomplicated"], correct: 0 } })] }), NOTE);
  assert.equal(v.osce[0].form.options.length, 3);
});

test("one scoring system: grades, points, ranks, no farming by replay", () => {
  assert.equal(T.gradeOf(90), "Excellent"); assert.equal(T.gradeOf(60), "Pass"); assert.equal(T.gradeOf(55), "Borderline"); assert.equal(T.gradeOf(30), "Fail");
  assert.equal(T.gradeOf(95, { unsafe: true }), "Unsafe"); assert.equal(T.gradeOf(75, { fail: true }), "Fail");
  assert.equal(T.pointsOf(100, { diff: "Core", ctx: "topic" }), 13);
  assert.ok(T.pointsOf(100, { diff: "Core", ctx: "blind" }) > T.pointsOf(100, { diff: "Core", ctx: "open" }));
  assert.ok(T.pointsOf(100, { diff: "Advanced", ctx: "open" }) > T.pointsOf(100, { diff: "Beginner", ctx: "open" }));
  assert.equal(T.pointsOf(100, { diff: "Core", ctx: "topic", unsafe: true }), T.pointsOf(40, { diff: "Core", ctx: "topic" }));
  assert.equal(T.rankOf(0).name, "Student"); assert.equal(T.rankOf(350).name, "House Officer"); assert.equal(T.rankOf(9999).next, null);
  // only the best run of a case counts
  sandbox.DATA = { clinsim: { runs: [], daily: {} } };
  const one = { kind: "quick", id: "q-yellow-baby", pct: 80, ctx: "open", at: "2026-11-17T08:00:00Z" };
  sandbox.DATA.clinsim.runs.push(one, Object.assign({}, one, { at: "2026-11-17T08:05:00Z" }), Object.assign({}, one, { pct: 50, at: "2026-11-17T08:10:00Z" }));
  const st = T.standing();
  assert.equal(st.total, T.pointsOf(80, { diff: "Core", ctx: "open" }));
  assert.equal(st.safeStreak, 3);
  sandbox.DATA.clinsim.runs.push({ kind: "quick", id: "q-long-cough", pct: 90, ctx: "open", unsafe: true, at: "2026-11-17T09:00:00Z" });
  assert.equal(T.standing().safeStreak, 0);
  delete sandbox.DATA;
});

test("a mixed ward round hides the topic and mixes in another specialty", () => {
  const course = { id: "spec:Paediatrics", name: "Paediatrics", spec: "Paediatrics" };
  const r = T.roundItems(course, 42, 5);
  assert.ok(r.length >= 2 && r.length <= 5);
  assert.ok(r.some(it => !T.inCourse(it, course)), "one patient comes from outside the course");
  assert.equal(new Set(r.map(it => it.title.toLowerCase())).size, r.length);
  assert.equal(JSON.stringify(T.roundItems(course, 42, 5).map(x => x.id)), JSON.stringify(r.map(x => x.id)), "the same seed gives the same round");
  win.MB_SYNC = { currentLevel: () => 500, status: () => ({ syncing: false }) };
  const html = CS.page(["round"]);
  assert.match(html, /Mixed ward round/); assert.match(html, /Patient 1/);
  delete win.MB_SYNC;
});

test("packs mix note cases with a general case on the same topic", () => {
  const g = goodPack();
  const genOsce = Object.assign({}, g.osce[0], { basis: "general", src: "", title: "A child with fever and dark urine", topic_link: "severe malaria complications" });
  const genOsce2 = Object.assign({}, genOsce, { title: "A second general station" });
  const offTopic = Object.assign({}, g.quick[0], { basis: "general", src: "", title: "Chest pain on exertion", topic_link: "angina",
    stem: "A man has chest pain.", teaching: [], mcqs: [], steps: g.quick[0].steps.map(s => Object.assign({}, s, { prompt: "p", reveal: "" })) });
  const p = validateCasePack(Object.assign(g, { osce: [g.osce[0], genOsce, genOsce2], quick: [g.quick[0], offTopic] }), NOTE, "Severe malaria in children");
  assert.equal(p.osce.length, 2, "one note station plus at most one general");
  assert.equal(p.osce.filter(x => x.basis === "general").length, 1);
  assert.equal(p.osce.find(x => x.basis === "general").src, "");
  assert.equal(p.quick.length, 1, "a general case off the topic is dropped");
  assert.equal(p.quick[0].basis, "note");
  assert.equal(p.general, 1);
  // a note with no clinical case of its own gets no general cases either
  const onlyGeneral = validateCasePack({ osce: [genOsce], quick: [], daily: [] }, NOTE, "Severe malaria in children");
  assert.equal(packSize(onlyGeneral), 0);
  // a general case still has to pass the shape checks
  assert.ok(onTopic({ title: "Fever in a child", teaching: ["Severe malaria kills"] }, "Severe Malaria"));
  assert.ok(!onTopic({ title: "Chest pain" }, "Severe Malaria"));
  assert.equal(GENERAL_MAX.osce, 1);
  assert.match(buildCasePackPrompt(NOTE, "Severe malaria"), /"general" cases \(at most ONE per list\)/);
});

test("lecture cases show whether they came from the note or are general", () => {
  const paeds = { id: "course_p", name: "Paediatrics" };
  const q = (id, basis) => ({ id, basis, title: "Case " + id, patient: { name: "B", age: "1", sex: "male" }, stem: "s",
    steps: [0, 1, 2].map(() => ({ prompt: "p", reveal: "", options: [{ t: "a", pts: 10, why: "" }, { t: "b", pts: 0, why: "" }, { t: "c", pts: -10, why: "" }] })), mcqs: [] });
  sandbox.allTopics.push({ id: "t9", name: "Neonatal Jaundice", ready: true, note: "x", subject: paeds, extras: { clinsim: { osce: [], daily: [], quick: [q("a", "note"), q("b", "general")] } } });
  win.MB_SYNC = { currentLevel: () => 500, status: () => ({ syncing: false }) };
  CS.course("course_p");
  const html = CS.page([]);
  assert.match(html, /From your note/); assert.match(html, /General topic case/);
  CS.course("all"); delete win.MB_SYNC; sandbox.allTopics.length = 0;
});

test("non-clinical topics get no case pack: no patient to see", () => {
  assert.ok(isClinicalTopic("Severe malaria in children", NOTE + " The patient presents with fever. Signs include pallor. Diagnosis is by microscopy. Management: treatment with artesunate 2.4 mg/kg. Complications include anaemia. History of travel. Investigation: blood film."));
  for(const name of ["Biostatistics: measures of central tendency", "Research methodology and study design", "Medical ethics and consent", "Epidemiological methods", "Medical jurisprudence", "Histology of the kidney"])
    assert.ok(!isClinicalTopic(name, NOTE + " patient presents signs diagnosis treatment management complications history of"), name);
  const stats = "The mean is the sum of values divided by their number. The median is the middle value. Standard deviation measures spread. A p value below 0.05 is called significant.";
  assert.ok(!isClinicalTopic("Week 3 lecture", stats), "a note with no clinical talk is not clinical, whatever its name");
});

test("options are shuffled on screen: the best answer is not always first", () => {
  const o = T.order(4, "q-x|s0|abc");
  assert.deepEqual([...o].sort(), [0, 1, 2, 3]);
  assert.deepEqual(T.order(4, "q-x|s0|abc"), o, "stable while you play");
  let first = 0, n = 0;
  for(const q of win.CLINSIM_QUICK) q.steps.forEach((s, i) => { n++; if(T.order(s.options.length, q.id + "|s" + i + "|n1")[0] === s.options.findIndex(x => x.pts === 10)) first++; });
  assert.ok(first < n / 2, "best shown first in " + first + " of " + n);
});

test("duel: winner by score, then fewer dangerous decisions, then speed; leaving loses", () => {
  const W = win.MB_CLINDUEL._test.winner;
  assert.equal(W({ pct: 80, danger: 0, ms: 9 }, { pct: 70, danger: 0, ms: 1 }), "a");
  assert.equal(W({ pct: 80, danger: 1, ms: 1 }, { pct: 80, danger: 0, ms: 9 }), "b");
  assert.equal(W({ pct: 80, danger: 0, ms: 5 }, { pct: 80, danger: 0, ms: 9 }), "a");
  assert.equal(W({ pct: 80, danger: 0, ms: 5 }, { pct: 80, danger: 0, ms: 5 }), null);
  assert.equal(W({ pct: 100, danger: 0, ms: 1, forfeit: true }, { pct: 0, danger: 0, ms: 9 }), "b");
  assert.equal(W({ forfeit: true }, { forfeit: true }), null);
  const S = win.MB_CLINDUEL._test.samePattern, p = win.MB_CLINDUEL._test.newPattern();
  assert.equal(p.length, 4); assert.equal(new Set(p).size, 4);
  assert.ok(S(p, p.slice())); assert.ok(!S(p, p.slice().reverse()));
});

test("my posting: 3 cases a week, core first, fixed once opened, exam week last", () => {
  sandbox.DATA = { clinsim: { runs: [], daily: {} } };
  const start = new Date(Date.now() - 8 * 864e5).toISOString();   // we are in week 2
  const r = { courseId: null, spec: "Paediatrics", name: "Paediatrics", start, weeks: 4, plan: {} };
  sandbox.DATA.clinsim.rotation = r;
  assert.equal(T.weekOf(r), 1);
  const w0 = T.weekCases(r, 0), w1 = T.weekCases(r, 1);
  assert.ok(w0.length >= 1 && w0.length <= 3);
  w0.concat(w1).forEach(it => assert.ok(it.spec.includes("Paediatrics"), it.id));
  assert.deepEqual(T.weekCases(r, 0).map(x => x.id), w0.map(x => x.id), "a week's cases stay fixed");
  // a case played after the posting began counts as done
  const q = w0.find(x => x.kind === "quick") || w0[0];
  assert.ok(!T.doneSince(q, start));
  sandbox.DATA.clinsim.runs.push({ kind: q.kind, id: q.id, pct: 70, at: new Date().toISOString() });
  if(q.kind !== "er") assert.ok(T.doneSince(q, start));
  win.MB_SYNC = { currentLevel: () => 500, status: () => ({ syncing: false }) };
  const html = CS.page(["rotation"]);
  assert.match(html, /week 2 of 4/); assert.match(html, /Saw a patient on the ward/);
  assert.match(CS.page([]), /Paediatrics · week 2 of 4/);
  delete win.MB_SYNC; delete sandbox.DATA;
});

test("mock OSCE day: a mix across specialties, one report, pass needs stations and average", () => {
  const ids = T.mockPick(6, null, 7);
  assert.ok(ids.length >= 4 && ids.length <= 6);
  assert.equal(new Set(ids).size, ids.length);
  const st = T.stations("all").filter(s => ids.includes(s.id));
  assert.ok(new Set(st.map(s => s.spec[0])).size >= 3, "a finals mix spreads across specialties");
  const r = (total, pass, d) => ({ total, pass, data: d, mgmt: d, ip: d });
  assert.ok(T.mockResult([r(70, true, 70), r(65, true, 65), r(62, true, 62), r(40, false, 40), r(80, true, 80)]).pass);
  assert.ok(!T.mockResult([r(90, true, 90), r(90, true, 90), r(40, false, 40), r(40, false, 40), r(40, false, 40)]).pass, "3 of 5 stations failed");
  assert.ok(!T.mockResult([r(61, true, 61), r(61, true, 61), r(61, true, 61), r(20, false, 20)]).pass, "average under 60");
  assert.match(T.mockFeedback({ data: 30, mgmt: 80, ip: 90 }), /History/);
  assert.match(T.mockFeedback({ data: 80, mgmt: 80, ip: 90 }), /Good station/);
});
