/* =====================================================================
 * import-server extractJsonObject() unit test (headless)
 * Proves the base-import JSON extractor survives the exact things that made
 * imports 502: reasoning prose, <think> blocks, code fences, trailing text,
 * and braces inside strings. Run: node qa/extract-json.mjs
 * ===================================================================== */
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const src = fs.readFileSync(path.join(__dirname, "..", "import-server", "server.mjs"), "utf8");

// extract the function source by its boundaries (the char-literals '{' '}' inside the body
// defeat a naive brace counter, so slice to the next top-level comment and trim to its last }).
const start = src.indexOf("function extractJsonObject");
const endMarker = src.indexOf("/* generate one optional extra", start);
let fnSrc = src.slice(start, endMarker);
fnSrc = fnSrc.slice(0, fnSrc.lastIndexOf("}") + 1);
const extractJsonObject = new Function(fnSrc + "\nreturn extractJsonObject;")();

let fails = [];
function check(name, cond, got){ console.log(`  [${cond?"PASS":"FAIL"}] ${name}${got!==undefined?(" — "+JSON.stringify(got)):""}`); if(!cond) fails.push(name); }

const good = { note_md:"x", simplified_md:"y", primer:{cards:[]}, recall:{cards:[]} };

console.log("extractJsonObject — " + new Date().toISOString());

check("clean JSON", JSON.stringify(extractJsonObject(JSON.stringify(good)))===JSON.stringify(good));

check("```json fenced", extractJsonObject("```json\n"+JSON.stringify(good)+"\n```")?.note_md==="x");

check("<think> reasoning then JSON",
  extractJsonObject("<think>Let me plan the note. I'll write {sections}...</think>\nHere it is:\n"+JSON.stringify(good))?.note_md==="x");

check("prose before AND after the JSON",
  extractJsonObject("Sure! Here is your study set:\n"+JSON.stringify(good)+"\nLet me know if you want changes.")?.note_md==="x");

check("braces INSIDE string values don't break it",
  extractJsonObject('prose {ignore} '+JSON.stringify({note_md:"use {curly} and }weird{ text", simplified_md:"a", primer:{cards:[]}, recall:{cards:[]}}))?.note_md==="use {curly} and }weird{ text");

check("nested objects", extractJsonObject('{"a":{"b":{"c":1}},"d":2}')?.d===2);

check("inline example object before the real one → returns the REAL (largest) one",
  extractJsonObject('First I considered {"draft":true} but the final answer is:\n'+JSON.stringify(good))?.note_md==="x");

check("no JSON at all → null (triggers a retry, not a crash)", extractJsonObject("I cannot help with that.")===null);

check("empty/garbage → null", extractJsonObject("")===null && extractJsonObject(null)===null);

// a genuinely truncated object should not throw; returns null so the caller retries
check("truncated JSON → null (no throw)", extractJsonObject('{"note_md":"x","recall":{"cards":[{"q":"unterminat')===null);

console.log("\n" + (fails.length ? ("❌ "+fails.length+" FAIL:\n - "+fails.join("\n - ")) : "✅ ALL EXTRACTOR CHECKS PASSED"));
process.exit(fails.length ? 1 : 0);
