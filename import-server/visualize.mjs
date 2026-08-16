/* visualize.mjs — "Visualize Text" generation: strict blueprint prompt + vocabulary +
 * gold exemplars (few-shot) + a rule-based QC critic. Pure/stateless so it's testable.
 * server.mjs calls buildVisualPrompt() → generate() (DeepSeek V4 Flash) → JSON → qcCheck().
 *
 * The renderer (visualize engine, client) draws whatever this emits. The LLM is a DIRECTOR:
 * it may only pick from the fixed VOCAB (templates, zones, asset types, action verbs) and
 * never invents new ones or uses pixel coordinates. */
import { createHash } from "node:crypto";

/* ---------------- controlled vocabulary (must match the renderer) ---------------- */
export const VOCAB = {
  templates: {
    membrane_cell: { zones: ["lumen","apical","intra","baso","blood"],
      use: "transport / signalling across a cell membrane (lumen | cell | blood)" },
    neuro_pathway: { zones: ["peri","axon","cns","pre","cleft","post","eff"],
      use: "a neuron/synapse journey: periphery → axon → CNS → presynapse → cleft → postsynapse → effector" }
  },
  assets: ["hormone_bubble","toxin","receptor","gprotein","enzyme","messenger","kinase",
           "vesicle","channel","water","neuron_soma","snare","muscle","lightning","node","blockx","label"],
  actions: ["reveal","active","arrows","move","cut","point"]  // per narration_step keys
};

/* ---------------- strict system prompt ---------------- */
export const VIS_SYSTEM =
`You are the DIRECTOR of a step-by-step medical explainer diagram for a student. You do NOT draw —
you output a JSON blueprint that a fixed renderer draws. Obey every rule:

VOCABULARY (never invent outside this):
• templates: ${Object.keys(VOCAB.templates).map(t=>t+" ("+VOCAB.templates[t].use+")").join(" | ")}
• zones: use ONLY the zones of the template you pick.
• asset types: ${VOCAB.assets.join(", ")}
• each narration_step may use these keys: reveal[], active[], arrows[{from,to,color}], move[{id,to_zone,lane}], cut[], point.
• NEVER use pixel coordinates. Place every element with a zone + lane (0,1,2… to stack within a zone).

QUALITY RULES (all mandatory):
1. Pick exactly ONE template that fits the concept.
2. Break the mechanism into 6–12 ordered narration_steps that follow the FULL causal chain with nothing skipped — include every intermediate (receptor, G-protein, enzyme, second messenger, kinase, vesicle, channel, etc.).
3. Every step must advance the story: reveal new element(s) AND/OR draw an arrow showing the DIRECTION of the process. Use arrows to show flow between elements.
4. Give every element a short id and a short label.
5. narration_text: spoken, one idea, ≤ 2 sentences, and it must teach the WHY. Set "term" to the single key term of that step.
6. The LAST step is a recap that names the chain.
7. "point" every step at the id (or zone) being described.
8. Stay strictly faithful to the source text and standard physiology; never invent facts.

Return ONLY valid minified JSON with this shape (no prose, no markdown):
{"meta":{"title":"","subject":"","concept_id":"snake_case_id"},
 "template":"",
 "elements":[{"id":"","type":"","zone":"","lane":0,"label":""}],
 "narration_steps":[{"short":"","term":"","narration_text":"","reveal":[],"active":[],"arrows":[{"from":"","to":"","color":"#7c3aed"}],"point":""}]}`;

/* ---------------- gold exemplars (few-shot) ---------------- */
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

/* ---------------- prompt builder ---------------- */
export function buildVisualPrompt(text, subject){
  const shots = EXEMPLARS.map(e => "SOURCE: "+e.text+"\nBLUEPRINT: "+JSON.stringify(e.blueprint)).join("\n\n");
  return VIS_SYSTEM + "\n\nEXAMPLE:\n" + shots +
    "\n\nNow do the same for this text (subject: "+(subject||"medicine")+"). Output ONLY the JSON blueprint.\nSOURCE: " + (text||"");
}

/* stable id for caching identical highlights */
export function textKey(text){ return createHash("md5").update((text||"").toLowerCase().replace(/\s+/g," ").trim()).digest("hex"); }

/* ---------------- rule-based QC critic (cheap, deterministic) ---------------- */
export function qcCheck(bp){
  const issues = [];
  if(!bp || typeof bp!=="object") return { pass:false, issues:["not an object"] };
  if(!bp.meta || !bp.meta.title) issues.push("missing meta.title");
  const tpl = VOCAB.templates[bp.template];
  if(!tpl) issues.push("template not in vocabulary: "+bp.template);
  const els = Array.isArray(bp.elements)?bp.elements:[];
  if(!els.length) issues.push("no elements");
  const ids = {};
  els.forEach(e=>{
    if(!e.id) issues.push("element missing id");
    else ids[e.id]=true;
    if(VOCAB.assets.indexOf(e.type)<0) issues.push("bad asset type: "+e.type);
    if(tpl && e.zone && tpl.zones.indexOf(e.zone)<0) issues.push("bad zone '"+e.zone+"' for "+bp.template);
    if(!e.zone && !e.at) issues.push("element "+e.id+" has no zone");
  });
  const steps = Array.isArray(bp.narration_steps)?bp.narration_steps:[];
  if(steps.length<5) issues.push("too few steps ("+steps.length+", need ≥5)");
  if(steps.length>14) issues.push("too many steps ("+steps.length+")");
  const okRef = (r)=> ids[r] || (tpl && tpl.zones.indexOf(r)>=0);
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

/* extract the first {...} JSON object from an LLM response */
export function parseBlueprint(raw){
  const t = raw||"", s=t.indexOf("{"), e=t.lastIndexOf("}");
  if(s<0||e<0) return null;
  try{ return JSON.parse(t.slice(s,e+1)); }catch(_){ return null; }
}
