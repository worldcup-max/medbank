// node --test test-board.mjs — the whiteboard Visualize board contract (board.mjs)
import test from "node:test";
import assert from "node:assert/strict";
import { normalizeBoard, buildBoardPrompt, boardKey } from "./board.mjs";

const good = { title:"Insulin release", subtitle:"beta cell", layout:"chain",
  items:[{id:"a",label:"Glucose enters",note:"GLUT2",doodle:"molecule"},{id:"b",label:"ATP rises",note:"",doodle:"nope"},{id:"c",label:"Insulin out",doodle:"drop"}],
  steps:[{say:"One.",show:["a"]},{say:"Two.",show:["b","zz"]},{say:"Three.",show:[]}] };

test("a good board passes and is repaired, not rejected", ()=>{
  const { board, issues } = normalizeBoard(good, "standard");
  assert.deepEqual(issues, []);
  assert.equal(board.kind, "board"); assert.equal(board.mode, "standard");
  assert.equal(board.items[1].doodle, "circle");                 // unknown doodle → circle
  assert.deepEqual(board.steps[1].show, ["b"]);                  // unknown id dropped
  assert.deepEqual(board.steps[2].show, ["c"]);                  // never-shown item added to the last step
});
test("bad layout is reported but still drawable as a list", ()=>{
  const { board, issues } = normalizeBoard({ ...good, layout:"spiral" }, "layman");
  assert.ok(issues.length); assert.equal(board.layout, "list"); assert.equal(board.mode, "layman");
});
test("too little to draw → no board", ()=>{
  assert.equal(normalizeBoard({ title:"x", items:[{label:"a"}], steps:[] }).board, null);
  assert.equal(normalizeBoard(null).board, null);
});
test("compare needs both columns filled", ()=>{
  const { issues } = normalizeBoard({ ...good, layout:"compare", columns:["A","B"] });
  assert.ok(issues.some(s=>/both columns/.test(s)));
});
test("modes get different voices and different cache keys", ()=>{
  assert.match(buildBoardPrompt("t","s","layman"), /Auntie/);
  assert.doesNotMatch(buildBoardPrompt("t","s","standard"), /Auntie/);
  assert.match(buildBoardPrompt("t","s","standard"), /KEEP the real medical terms/);
  const k = s=>s; assert.notEqual(boardKey(k,"t","layman"), boardKey(k,"t","standard"));
});

import { normQ, parseAsk, buildAskPrompt, boardIdentity } from "./board.mjs";
test("ask: same question in other words normalises, and 'same' must point into the bank", ()=>{
  assert.equal(normQ("Auntie, please, WHY does it need ATP?"), normQ("why does it need atp"));
  assert.deepEqual(parseAsk({ same:1 }, 2), { same:1 });
  assert.equal(parseAsk({ same:5 }, 2), null);                    // out of range and no answer → nothing
  const a = parseAsk({ q:"Why ATP?", answer:"Because…", note:"ATP = cash", beyond:1 }, 0);
  assert.equal(a.a, "Because…"); assert.equal(a.beyond, true);
});
test("ask: prompt carries the board, the paused step, the bank and the voice", ()=>{
  const { board } = normalizeBoard({ ...good, faq:[{ q:"Why?", a:"Because.", note:"n" }] }, "layman");
  assert.equal(board.faq.length, 1);
  const p = buildAskPrompt(board, 1, "what is GLUT2", [{ q:"Why?" }]);
  assert.match(p, /STEP 2/); assert.match(p, /\[0\] Why\?/); assert.match(p, /Auntie/); assert.match(p, /beyond/);
  assert.equal(boardIdentity(board), boardIdentity(JSON.parse(JSON.stringify(board))));
});
