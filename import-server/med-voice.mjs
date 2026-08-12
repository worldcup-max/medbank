/* med-voice.mjs — STRICT medical pronunciation for every TTS clip.
 *
 * Two engines, two mechanisms, but NOTHING skips pronunciation prep:
 *   • Kokoro  → inline IPA via Markdown-link syntax  [word](/ipa/)   (exact phonemes)
 *   • Fish / OpenAI (no IPA support) → phonetic RESPELLING  e.g. "koh-luh-sis-TEK-tuh-mee"
 *
 * ttsClip() in server.mjs runs kokoroPrep() or sayPrep() on EVERY clip before it is
 * spoken. The word→pronunciation data lives in med-lexicon.json (grows independently of
 * this code). Regenerate/extend it with lexicon-tools/build-lexicon.mjs. */

import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

let LEX = { ipa:{}, say:{} };
try {
  LEX = JSON.parse(readFileSync(join(dirname(fileURLToPath(import.meta.url)), "med-lexicon.json"), "utf8"));
} catch(e){ console.warn("[med-voice] med-lexicon.json not loaded —", e.message); }

export const MED_IPA = LEX.ipa || {};
export const MED_SAY = LEX.say || {};

function buildRx(keys){
  if(!keys.length) return null;
  const t = keys.slice().sort((a,b)=>b.length-a.length).map(k=>k.replace(/[-/\\^$*+?.()|[\]{}]/g,"\\$&"));
  return new RegExp("\\b("+t.join("|")+")\\b","gi");
}
let _rxIpa = buildRx(Object.keys(MED_IPA));
let _rxSay = buildRx(Object.keys(MED_SAY));

/* Merge learned terms in at runtime (e.g. harvested from real lectures) and rebuild the
 * matchers. Existing keys are kept unless overwrite=true. */
export function mergeTerms(ipaObj={}, sayObj={}, overwrite=false){
  for(const k in ipaObj){ const t=k.toLowerCase(); if(overwrite||!MED_IPA[t]) MED_IPA[t]=ipaObj[k]; }
  for(const k in sayObj){ const t=k.toLowerCase(); if(overwrite||!MED_SAY[t]) MED_SAY[t]=sayObj[k]; }
  _rxIpa = buildRx(Object.keys(MED_IPA));
  _rxSay = buildRx(Object.keys(MED_SAY));
  return Object.keys(MED_IPA).length;
}
export function knownTerm(t){ return !!MED_IPA[(t||"").toLowerCase()]; }

/* Kokoro: wrap known terms with IPA so they are pronounced exactly. */
export function kokoroPrep(text){
  if(!text) return "";
  if(!_rxIpa) return String(text);
  return String(text).replace(_rxIpa, (m)=>{ const ipa = MED_IPA[m.toLowerCase()]; return ipa ? `[${m}](/${ipa}/)` : m; });
}
/* Fish / OpenAI: swap the hardest terms for a phonetic respelling. */
export function sayPrep(text){
  if(!text) return "";
  if(!_rxSay) return String(text);
  return String(text).replace(_rxSay, (m)=>{ const say = MED_SAY[m.toLowerCase()]; return say || m; });
}

export const KOKORO_DEFAULT = {
  A:    process.env.KOKORO_VOICE_A    || "af_heart",
  B:    process.env.KOKORO_VOICE_B    || "am_michael",
  read: process.env.KOKORO_VOICE_READ || "af_heart"
};
