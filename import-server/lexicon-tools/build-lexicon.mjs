/* build-lexicon.mjs — grow med-lexicon.json to thousands of terms automatically.
 *
 * espeak-ng is the SAME grapheme→phoneme engine Kokoro uses internally, so its IPA is
 * exactly what Kokoro expects. Run this wherever espeak-ng is installed (your laptop or
 * a build step) — it is NOT needed at runtime.
 *
 *   # one-time:
 *   sudo apt-get install -y espeak-ng
 *   # then, with a plain word-per-line file (e.g. drug names from RxNorm, disease names
 *   # from ICD/SNOMED, anatomy lists):
 *   node lexicon-tools/build-lexicon.mjs terms.txt
 *
 * It only ADDS terms not already present, so your hand-curated entries always win.
 * Commit the updated med-lexicon.json and redeploy — the server picks it up on boot. */

import { execFileSync } from "node:child_process";
import { readFileSync, writeFileSync } from "node:fs";

const listFile = process.argv[2] || "terms.txt";
const lexUrl = new URL("../med-lexicon.json", import.meta.url);
const lex = JSON.parse(readFileSync(lexUrl, "utf8"));
lex.ipa = lex.ipa || {}; lex.say = lex.say || {};

const terms = readFileSync(listFile, "utf8").split(/\r?\n/).map(s => s.trim().toLowerCase()).filter(Boolean);
let added = 0, skipped = 0;
for(const t of terms){
  if(lex.ipa[t]){ skipped++; continue; }               // keep curated / existing
  try{
    const ipa = execFileSync("espeak-ng", ["-q","--ipa=3","-v","en-us", t], { encoding:"utf8" })
                  .trim().replace(/\s+/g, "");
    if(ipa){ lex.ipa[t] = ipa; added++; }
  }catch(e){ /* espeak couldn't handle it — leave to Kokoro's own g2p */ }
}
writeFileSync(lexUrl, JSON.stringify(lex, null, 0));
console.log(`added ${added} new terms (skipped ${skipped} existing). Total IPA entries: ${Object.keys(lex.ipa).length}`);
