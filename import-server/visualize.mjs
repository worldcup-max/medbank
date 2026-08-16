/* visualize.mjs — "Visualize Text" generation: manifest-driven prompt + gold exemplars +
 * a QC critic that enforces the shared asset manifest (asset↔template↔zone validity + scale).
 *
 * The asset library lives in ONE place — viz-assets.json — read here (to build the prompt VOCAB
 * and validate) and, in production, by the renderer too (single source of truth, so growing the
 * library = one manifest entry + one draw fn, and the wrong-scale mistake is impossible because
 * an asset can only be placed in the templates/zones its manifest entry allows). */
import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

let MANIFEST = { templates:{}, assets:{} };
try { MANIFEST = JSON.parse(readFileSync(join(dirname(fileURLToPath(import.meta.url)), "viz-assets.json"), "utf8")); }
catch(e){ console.warn("[visualize] viz-assets.json not loaded —", e.message); }

const TPL = MANIFEST.templates || {};
const ASSET = MANIFEST.assets || {};

export const VOCAB = {
  templates: Object.fromEntries(Object.entries(TPL).map(([k,v])=>[k,{ zones:Object.keys(v.zones||{}), scale:v.scale, use:v.use }])),
  assets: Object.keys(ASSET),
  assetMeta: ASSET,
  actions: ["reveal","active","arrows","move","cut","point"]
};

/* compact "asset : allowed templates[/zones]" map so the model never crosses scales */
function assetMapText(){
  return Object.entries(ASSET).map(([id,m])=>{
    let s = id+" → "+(m.valid_templates||[]).join("/");
    if(m.valid_zones) s += " [zones: "+m.valid_zones.join(",")+"]";
    return s;
  }).join("\n");
}

export const VIS_SYSTEM =
`You are the DIRECTOR of a step-by-step medical explainer diagram. You do NOT draw — you output a
JSON blueprint that a fixed renderer draws. Obey every rule:

TEMPLATES (pick exactly ONE whose scale fits the concept):
${Object.entries(VOCAB.templates).map(([k,v])=>"• "+k+" ["+v.scale+"] — "+v.use+" — zones: "+v.zones.join(", ")).join("\n")}

ASSET TYPES you may use, and where each is allowed (NEVER use an asset outside its templates/zones — this keeps scale correct):
${assetMapText()}

RULES (all mandatory):
1. Pick ONE template whose scale matches the concept (molecular vs cellular vs tissue).
2. Place every element with a zone from that template + a lane index (0,1,2…). NEVER use pixel coordinates or sizes — the renderer sizes each asset to its zone.
3. 6–12 ordered narration_steps covering the FULL causal chain, nothing skipped (every receptor, G-protein, enzyme, messenger, kinase, vesicle, channel, etc.).
4. Every step advances the story: reveal new element(s) AND/OR draw an arrow showing DIRECTION of the process.
5. Every element has a short id + short label. narration_text is spoken, one idea, ≤ 2 sentences, teaches the WHY; set "term" to the step's key term.
6. The LAST step is a recap naming the chain. "point" every step at the id (or zone) it describes.
7. Stay faithful to the source text and standard physiology; invent nothing.

Return ONLY valid minified JSON:
{"meta":{"title":"","subject":"","concept_id":"snake_case_id"},"template":"","elements":[{"id":"","type":"","zone":"","lane":0,"label":""}],"narration_steps":[{"short":"","term":"","narration_text":"","reveal":[],"active":[],"arrows":[{"from":"","to":"","color":"#7c3aed"}],"point":""}]}`;

/* gold exemplar (few-shot) */
export const EXEMPLARS = [
  { text: "ADH increases water reabsorption by increasing aquaporin-2 channels in the collecting duct.",
    blueprint: {meta:{title:"ADH → AQP2 water reabsorption",subject:"Renal physiology",concept_id:"adh_aqp2_cascade"},template:"membrane_cell",
      elements:[{id:"adh",type:"hormone_bubble",zone:"blood",lane:0,label:"ADH"},{id:"v2",type:"receptor",zone:"baso",lane:0,label:"V2"},{id:"gs",type:"gprotein",zone:"intra",lane:0,label:"Gs"},{id:"ac",type:"enzyme",zone:"intra",lane:1,label:"AC"},{id:"camp",type:"messenger",zone:"intra",lane:2,label:"cAMP"},{id:"pka",type:"kinase",zone:"intra",lane:3,label:"PKA"},{id:"ves",type:"vesicle",zone:"intra",lane:4,label:"AQP2"},{id:"aqp",type:"channel",zone:"apical",lane:0,label:"AQP2"},{id:"w",type:"water",zone:"lumen",lane:0,label:"H2O"},{id:"aqp3",type:"channel",zone:"baso",lane:1,label:"AQP3/4"}],
      narration_steps:[
        {short:"ADH",term:"ADH",narration_text:"ADH reaches the collecting-duct cell in the blood.",reveal:["adh"],active:["adh"],point:"adh"},
        {short:"V2",term:"V2 receptor",narration_text:"It binds the V2 receptor on the basolateral membrane.",reveal:["v2"],active:["v2"],arrows:[{from:"adh",to:"v2",color:"#e0632b"}],point:"v2"},
        {short:"Gs",term:"Gs protein",narration_text:"The receptor activates the Gs protein.",reveal:["gs"],active:["gs"],arrows:[{from:"v2",to:"gs",color:"#9333ea"}],point:"gs"},
        {short:"cAMP",term:"cAMP",narration_text:"Gs turns on adenylyl cyclase, raising cAMP.",reveal:["ac","camp"],active:["camp"],arrows:[{from:"gs",to:"camp",color:"#9333ea"}],point:"camp"},
        {short:"PKA",term:"PKA",narration_text:"cAMP activates protein kinase A.",reveal:["pka"],active:["pka"],arrows:[{from:"camp",to:"pka",color:"#7c3aed"}],point:"pka"},
        {short:"Insert",term:"aquaporin-2",narration_text:"PKA inserts aquaporin-2 channels into the apical membrane.",reveal:["ves","aqp"],active:["aqp"],arrows:[{from:"pka",to:"aqp",color:"#14b8a6"}],point:"aqp"},
        {short:"Water",term:"water reabsorption",narration_text:"Water flows from the lumen into the cell, then to blood via AQP3/4. Recap: ADH → cAMP → PKA → AQP2 → water reabsorbed.",reveal:["w","aqp3"],active:["w"],arrows:[{from:"w",to:"aqp",color:"#2563eb"},{from:"aqp",to:"aqp3",color:"#2563eb"}],point:"aqp3"}
      ]} }
];

export function buildVisualPrompt(text, subject){
  const shots = EXEMPLARS.map(e => "SOURCE: "+e.text+"\nBLUEPRINT: "+JSON.stringify(e.blueprint)).join("\n\n");
  return VIS_SYSTEM + "\n\nEXAMPLE:\n" + shots +
    "\n\nNow do the same for this text (subject: "+(subject||"medicine")+"). Output ONLY the JSON blueprint.\nSOURCE: " + (text||"");
}

export function textKey(text){ return createHash("md5").update((text||"").toLowerCase().replace(/\s+/g," ").trim()).digest("hex"); }

/* QC critic — deterministic, manifest-enforced */
export function qcCheck(bp){
  const issues = [];
  if(!bp || typeof bp!=="object") return { pass:false, issues:["not an object"] };
  if(!bp.meta || !bp.meta.title) issues.push("missing meta.title");
  const tpl = TPL[bp.template];
  if(!tpl){ issues.push("template not in manifest: "+bp.template); }
  const zones = tpl ? Object.keys(tpl.zones||{}) : [];
  const els = Array.isArray(bp.elements)?bp.elements:[];
  if(!els.length) issues.push("no elements");
  const ids = {};
  els.forEach(e=>{
    if(!e.id){ issues.push("element missing id"); return; }
    ids[e.id]=true;
    const meta = ASSET[e.type];
    if(!meta){ issues.push("asset type not in manifest: "+e.type); return; }
    if(meta.valid_templates && meta.valid_templates.indexOf(bp.template)<0)
      issues.push("asset '"+e.type+"' not allowed in template '"+bp.template+"' (scale mismatch)");
    if(e.zone && zones.indexOf(e.zone)<0)
      issues.push("zone '"+e.zone+"' not in template '"+bp.template+"'");
    if(meta.valid_zones && e.zone && meta.valid_zones.indexOf(e.zone)<0)
      issues.push("asset '"+e.type+"' cannot sit in zone '"+e.zone+"' (allowed: "+meta.valid_zones.join(",")+")");
    if(!e.zone && !e.at) issues.push("element "+e.id+" has no zone");
  });
  const steps = Array.isArray(bp.narration_steps)?bp.narration_steps:[];
  if(steps.length<5) issues.push("too few steps ("+steps.length+", need ≥5)");
  if(steps.length>14) issues.push("too many steps ("+steps.length+")");
  const okRef = (r)=> ids[r] || zones.indexOf(r)>=0;
  let anyFlow=false;
  steps.forEach((s,i)=>{
    if(!s.narration_text || !s.narration_text.trim()) issues.push("step "+(i+1)+" has no narration");
    if(s.narration_text && s.narration_text.length>260) issues.push("step "+(i+1)+" narration too long");
    (s.reveal||[]).forEach(r=>{ if(!ids[r]) issues.push("step "+(i+1)+" reveals unknown id "+r); });
    (s.active||[]).forEach(r=>{ if(!ids[r]) issues.push("step "+(i+1)+" active unknown id "+r); });
    (s.arrows||[]).forEach(a=>{ if(!okRef(a.from)||!okRef(a.to)) issues.push("step "+(i+1)+" arrow bad ref"); anyFlow=true; });
    (s.move||[]).forEach(m=>{ if(!ids[m.id]) issues.push("step "+(i+1)+" move unknown id"); anyFlow=true; });
    if(s.point && !okRef(s.point)) issues.push("step "+(i+1)+" point bad ref "+s.point);
  });
  if(!anyFlow) issues.push("no directional flow (no arrows/moves anywhere)");
  return { pass: issues.length===0, issues };
}

export function parseBlueprint(raw){
  const t = raw||"", s=t.indexOf("{"), e=t.lastIndexOf("}");
  if(s<0||e<0) return null;
  try{ return JSON.parse(t.slice(s,e+1)); }catch(_){ return null; }
}
