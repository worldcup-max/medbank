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
