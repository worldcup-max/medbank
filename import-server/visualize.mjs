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
export { MANIFEST };

/* Render-relevant slice of the manifest for ONE template — the only thing the client
 * engine needs so scale flows from this single source (no hardcoded scale in the engine). */
export function renderHints(template){
  const t = TPL[template]; if(!t) return null;
  const zscale = {};
  for(const [z,cfg] of Object.entries(t.zones||{})) zscale[z] = (cfg && cfg.scale) || 1;
  return { scale: t.scale, zscale };
}

export const VOCAB = {
  get templates(){ return Object.fromEntries(Object.entries(TPL).map(([k,v])=>[k,{ zones:Object.keys(v.zones||{}), scale:v.scale, use:v.use }])); },
  get assets(){ return Object.keys(ASSET); },
  assetMeta: ASSET,
  actions: ["reveal","active","arrows","move","cut","point"]
};

/* --- Overlay: admin-approved assets (from the DB) merge in here at runtime, so a newly
 * approved asset is instantly usable by the prompt + QC + engine with NO code deploy.
 * A data-driven asset carries an `svg` spec (tokens @X @Y @LABEL @COLOR) the engine renders. */
export function registerAssets(list){
  let n = 0;
  for(const a of (list||[])){
    if(!a || !a.id) continue;
    ASSET[a.id] = {
      category: a.category||"custom", scale: a.scale||"molecular",
      valid_templates: a.valid_templates||["membrane_cell","neuro_pathway"],
      ...(a.valid_zones ? { valid_zones:a.valid_zones } : {}),
      ...(a.svg ? { svg:a.svg } : {}),
      source: "overlay"
    };
    n++;
  }
  return n;
}
/* SVG specs for the data-driven assets among `types` — server sends these to the engine as bp._defs */
export function assetDefs(types){
  const out = {};
  for(const t of new Set(types||[])){ const m = ASSET[t]; if(m && m.svg) out[t] = { svg:m.svg }; }
  return out;
}

/* compact "asset : allowed templates[/zones]" map so the model never crosses scales */
function assetMapText(){
  return Object.entries(ASSET).map(([id,m])=>{
    let s = id+" → "+(m.valid_templates||[]).join("/");
    if(m.valid_zones) s += " [zones: "+m.valid_zones.join(",")+"]";
    return s;
  }).join("\n");
}

/* built fresh each call so overlay-approved templates/assets appear immediately */
function visSystem(){ return (
`You are the DIRECTOR of a step-by-step medical explainer. You do NOT draw — you output a JSON
blueprint that a fixed renderer draws. FIRST choose the MODE that fits the highlighted text:

• MODE "mechanism" — a cause-and-effect PROCESS that happens in a REAL ANATOMICAL PLACE the templates
  below can draw: transport across a cell membrane (kidney tubule, gut, etc.) or a neuron/synapse
  journey. Use ONLY when the scene genuinely fits one of those templates — it gives the richest,
  most spatial animation. Do NOT force unrelated content into it.
• MODE "flow" — a cause-and-effect chain / pathway that has NO specific anatomical home: biochemical
  cascades, enzyme pathways, "if X then Y then Z" logic, consequences that unfold in sequence
  (e.g. "G6PD → NADPH → reduced glutathione → protects RBC; if deficient → oxidative damage →
  haemolysis"). Build a PROCESS FLOW: ordered stations connected by arrows, revealed one at a time,
  laid out as a clean flowing diagram. Use this for MOST mechanisms that aren't clearly a membrane
  or synapse scene — it looks purpose-built, never a plain vertical list.
• MODE "tree" — a DEFINITION, CLASSIFICATION, LIST, STRUCTURE, or set of facts with no causal flow
  (e.g. "the two toxins are…", "a 150-kd protein of a heavy and light chain", "types/features of X").
  Build a WHITEBOARD TREE: a root concept branching into sub-points, revealed like a mind-map.

Choose the mode that makes the BEST explainer. Prefer mechanism when the anatomy fits, flow for other
cascades, tree for non-causal facts. Every highlight must produce a rich, engaging result.

═══════ MODE "mechanism" ═══════
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
{"meta":{"title":"","subject":"","concept_id":"snake_case_id"},"template":"","elements":[{"id":"","type":"","zone":"","lane":0,"label":""}],"narration_steps":[{"short":"","term":"","narration_text":"","reveal":[],"active":[],"arrows":[{"from":"","to":"","color":"#7c3aed"}],"point":""}]}

═══════ MODE "tree" (whiteboard) ═══════
Rules:
1. "root" is the id of the central concept. Every other node has a "parent" (an existing id) — forming a tree, 2–4 levels deep.
2. 6–14 nodes total. Each node: short "id", short "label" (≤ 5 words), optional "note" (≤ 8 words of detail).
3. narration_steps reveal the tree progressively — usually root first, then each branch. EVERY node must be revealed by some step. "point" each step at the node it explains.
4. narration_text is spoken, one idea, ≤ 2 sentences, teaches the WHY. The last step recaps. Stay faithful to the source; invent nothing.
Return ONLY valid minified JSON:
{"meta":{"title":"","subject":"","concept_id":"snake_case_id"},"layout":"tree","root":"n0","nodes":[{"id":"n0","label":"","note":""},{"id":"n1","parent":"n0","label":"","note":""}],"narration_steps":[{"short":"","term":"","narration_text":"","reveal":[],"active":[],"point":""}]}

═══════ MODE "flow" (process diagram) ═══════
Rules:
1. "nodes" is the ORDERED sequence of stations in the pathway (cause → effect → effect …). 4–10 nodes.
2. Each node: short "id", short "label" (≤ 4 words, the step's key term), optional "note" (≤ 7 words), and optional "kind": one of trigger|process|product|danger|outcome (colours the station). Mark bad/pathological steps "danger" and the end result "outcome".
3. narration_steps reveal the stations IN ORDER (one per step is best). EVERY node revealed by some step; "point" each step at its node. The last step recaps the whole chain.
4. narration_text is spoken, one idea, ≤ 2 sentences, teaches the WHY. Faithful to the source; invent nothing.
Return ONLY valid minified JSON:
{"meta":{"title":"","subject":"","concept_id":"snake_case_id"},"layout":"flow","nodes":[{"id":"n0","label":"","note":"","kind":"trigger"},{"id":"n1","label":"","note":"","kind":"process"}],"narration_steps":[{"short":"","term":"","narration_text":"","reveal":[],"active":[],"point":""}]}`
); }
export const VIS_SYSTEM = visSystem();   // static snapshot (kept for compatibility)

/* gold exemplar (few-shot) */
export const EXEMPLARS = [
  { text: "ADH increases water reabsorption by increasing aquaporin-2 channels in the collecting duct.",
    blueprint: {meta:{title:"ADH → AQP2 water reabsorption",subject:"Renal physiology",concept_id:"adh_aqp2_cascade"},template:"membrane_cell",
      elements:[{id:"adh",type:"hormone_bubble",zone:"blood",lane:0,label:"ADH"},{id:"v2",type:"receptor",zone:"baso",lane:0,label:"V2"},{id:"gs",type:"gprotein",zone:"intra",lane:0,label:"Gs"},{id:"ac",type:"enzyme",zone:"intra",lane:1,label:"AC"},{id:"camp",type:"messenger",zone:"intra",lane:2,label:"cAMP"},{id:"pka",type:"kinase",zone:"intra",lane:3,label:"PKA"},{id:"ves",type:"vesicle",zone:"intra",lane:4,label:"AQP2"},{id:"aqp",type:"channel",zone:"apical",lane:0,label:"AQP2"},{id:"w",type:"water",zone:"lumen",lane:0,label:"H2O"},{id:"aqp3",type:"channel",zone:"baso",lane:1,label:"AQP3/4"}],
      narration_steps:[
        {short:"ADH",term:"ADH",narration_text:"ADH reaches the collecting-duct cell in the blood.",reveal:["adh"],active:["adh"],point:"adh"},
        {short:"V2",term:"V2 receptor",narration_text:"It binds the V2 receptor on the basolateral membrane.",reveal:["v2"],active:["v2"],arrows:[{from:"adh",to:"v2",color:"#e0632b"}],point:"v2"},
        {short:"Gs",term:"Gs protein",narration_text:"The receptor activates the Gs protein.",reveal:["gs"],active:["gs"],arrows:[{from:"v2",to:"gs",color:"#9333ea"}],point:"gs"},
        {short:"cAMP",term:"cAMP",narration_text:"Gs turns on adenylyl cyclase, raising cAMP.",reveal:["ac","camp"],active:["camp"],arrows:[{from:"gs",to:"ac",color:"#9333ea"},{from:"ac",to:"camp",color:"#9333ea"}],point:"camp"},
        {short:"PKA",term:"PKA",narration_text:"cAMP activates protein kinase A.",reveal:["pka"],active:["pka"],arrows:[{from:"camp",to:"pka",color:"#7c3aed"}],point:"pka"},
        {short:"Insert",term:"aquaporin-2",narration_text:"PKA drives aquaporin-2 vesicles to fuse with the apical membrane.",reveal:["ves","aqp"],active:["aqp"],arrows:[{from:"pka",to:"ves",color:"#14b8a6"},{from:"ves",to:"aqp",color:"#14b8a6"}],point:"aqp"},
        {short:"Water",term:"water reabsorption",narration_text:"Water flows from the lumen into the cell, then to blood via AQP3/4. Recap: ADH → cAMP → PKA → AQP2 → water reabsorbed.",reveal:["w","aqp3"],active:["w"],arrows:[{from:"w",to:"aqp",color:"#2563eb"},{from:"aqp",to:"aqp3",color:"#2563eb"}],point:"aqp3"}
      ]} },
  { text: "The two toxins: Tetanolysin — a haemolysin with no recognized pathologic activity. Tetanospasmin — responsible for tetanus; a 150-kd protein of a 100-kd heavy chain and a 50-kd light chain joined by a disulphide bond.",
    blueprint: {meta:{title:"Clostridium tetani toxins",subject:"Microbiology",concept_id:"tetani_toxins_structure"},layout:"tree",root:"tox",
      nodes:[
        {id:"tox",label:"C. tetani toxins",note:"two produced"},
        {id:"tl",parent:"tox",label:"Tetanolysin",note:"a haemolysin"},
        {id:"tl1",parent:"tl",label:"No pathologic role",note:"not clinically important"},
        {id:"ts",parent:"tox",label:"Tetanospasmin",note:"causes the disease"},
        {id:"ts1",parent:"ts",label:"Extremely potent",note:"lethal dose ~2.5 ng/kg"},
        {id:"ts2",parent:"ts",label:"150-kd protein",note:"one disulphide bond"},
        {id:"hc",parent:"ts2",label:"Heavy chain 100-kd",note:"binds motor neuron"},
        {id:"lc",parent:"ts2",label:"Light chain 50-kd",note:"the toxic part"}
      ],
      narration_steps:[
        {short:"Two toxins",term:"toxins",narration_text:"Clostridium tetani makes two toxins. Let's break them down.",reveal:["tox"],active:["tox"],point:"tox"},
        {short:"Tetanolysin",term:"tetanolysin",narration_text:"Tetanolysin is a haemolysin.",reveal:["tl"],active:["tl"],point:"tl"},
        {short:"Harmless",term:"no role",narration_text:"It has no recognized pathologic activity — not the one that matters clinically.",reveal:["tl1"],active:["tl1"],point:"tl1"},
        {short:"Tetanospasmin",term:"tetanospasmin",narration_text:"Tetanospasmin is the toxin responsible for tetanus.",reveal:["ts"],active:["ts"],point:"ts"},
        {short:"Potency",term:"potency",narration_text:"It is one of the most potent toxins known — a lethal dose is about 2.5 nanograms per kilogram.",reveal:["ts1"],active:["ts1"],point:"ts1"},
        {short:"Structure",term:"150-kd",narration_text:"It is a 150-kilodalton protein held together by a single disulphide bond.",reveal:["ts2"],active:["ts2"],point:"ts2"},
        {short:"Heavy chain",term:"heavy chain",narration_text:"The 100-kd heavy chain binds the presynaptic motor neuron.",reveal:["hc"],active:["hc"],point:"hc"},
        {short:"Light chain",term:"light chain",narration_text:"The 50-kd light chain is the toxic part. Recap: two toxins — harmless tetanolysin, and potent two-chain tetanospasmin.",reveal:["lc"],active:["lc"],point:"lc"}
      ]} },
  { text: "G6PD's main job is to help produce NADPH. NADPH keeps glutathione in its reduced form, which protects RBCs from oxidative stress. If G6PD is deficient: less NADPH → less reduced glutathione → oxidative damage → haemoglobin and membrane damaged → the RBC breaks (haemolysis).",
    blueprint: {meta:{title:"G6PD → NADPH → glutathione → RBC protection",subject:"Haematology",concept_id:"g6pd_nadph_glutathione"},layout:"flow",
      nodes:[
        {id:"g6pd",label:"G6PD",note:"the enzyme",kind:"trigger"},
        {id:"nadph",label:"NADPH",note:"reducing power",kind:"product"},
        {id:"gsh",label:"Reduced glutathione",note:"the antioxidant",kind:"product"},
        {id:"protect",label:"RBC protected",note:"neutralises ROS",kind:"outcome"},
        {id:"def",label:"G6PD deficient",note:"↓ NADPH",kind:"danger"},
        {id:"oxi",label:"Oxidative damage",note:"ROS build up",kind:"danger"},
        {id:"dmg",label:"Hb + membrane damaged",note:"Heinz bodies",kind:"danger"},
        {id:"lyse",label:"Haemolysis",note:"RBC bursts",kind:"outcome"}
      ],
      narration_steps:[
        {short:"G6PD",term:"G6PD",narration_text:"G6PD's main job is to help produce NADPH.",reveal:["g6pd","nadph"],active:["nadph"],point:"nadph"},
        {short:"Glutathione",term:"glutathione",narration_text:"NADPH keeps glutathione in its reduced, active form.",reveal:["gsh"],active:["gsh"],point:"gsh"},
        {short:"Protection",term:"protection",narration_text:"Reduced glutathione mops up reactive oxygen species, protecting the red cell.",reveal:["protect"],active:["protect"],point:"protect"},
        {short:"Deficiency",term:"deficiency",narration_text:"If G6PD is deficient, NADPH falls, so there is less reduced glutathione.",reveal:["def"],active:["def"],point:"def"},
        {short:"Oxidative",term:"oxidative stress",narration_text:"Reactive oxygen species now build up unchecked.",reveal:["oxi"],active:["oxi"],point:"oxi"},
        {short:"Damage",term:"damage",narration_text:"They damage haemoglobin (forming Heinz bodies) and the cell membrane.",reveal:["dmg"],active:["dmg"],point:"dmg"},
        {short:"Haemolysis",term:"haemolysis",narration_text:"The weakened red cell breaks apart. Recap: G6PD → NADPH → reduced glutathione protects the RBC; without it, oxidative damage causes haemolysis.",reveal:["lyse"],active:["lyse"],point:"lyse"}
      ]} }
];

export function buildVisualPrompt(text, subject){
  const shots = EXEMPLARS.map(e => "SOURCE: "+e.text+"\nBLUEPRINT: "+JSON.stringify(e.blueprint)).join("\n\n");
  return visSystem() + "\n\nEXAMPLE:\n" + shots +
    "\n\nNow do the same for this text (subject: "+(subject||"medicine")+"). Output ONLY the JSON blueprint.\nSOURCE: " + (text||"");
}

export function textKey(text){ return createHash("md5").update((text||"").toLowerCase().replace(/\s+/g," ").trim()).digest("hex"); }

/* Whiteboard TREE validity: valid hierarchy, no cycles, every node reachable + revealed. */
export function treeCheck(bp){
  const issues = [];
  if(!bp || typeof bp!=="object") return { pass:false, issues:["not an object"] };
  if(!bp.meta || !bp.meta.title) issues.push("missing meta.title");
  const nodes = Array.isArray(bp.nodes)?bp.nodes:[];
  if(nodes.length<3) issues.push("too few nodes ("+nodes.length+", need ≥3)");
  if(nodes.length>16) issues.push("too many nodes ("+nodes.length+")");
  const byId={}; nodes.forEach(n=>{ if(!n.id) issues.push("node missing id"); else byId[n.id]=n; });
  const root = bp.root || (nodes[0]&&nodes[0].id);
  if(!byId[root]) issues.push("root node not found: "+root);
  // parents valid, no cycles, all reachable from root
  nodes.forEach(n=>{ if(n.id!==root){ if(!n.parent) issues.push("node '"+n.id+"' has no parent"); else if(!byId[n.parent]) issues.push("node '"+n.id+"' parent not found: "+n.parent); } });
  const seen={}; let cyc=false;
  nodes.forEach(n=>{ let c=n, hops=0; const path={}; while(c && c.parent && hops++<50){ if(path[c.id]){cyc=true;break;} path[c.id]=1; c=byId[c.parent]; } });
  if(cyc) issues.push("the tree has a cycle (a node is its own ancestor)");
  // reachability from root
  const reach={}; (function walk(id){ if(reach[id])return; reach[id]=1; nodes.filter(x=>x.parent===id).forEach(x=>walk(x.id)); })(root);
  nodes.forEach(n=>{ if(!reach[n.id]) issues.push("node '"+n.id+"' is not connected to the root"); });
  // steps reveal every node
  const steps = Array.isArray(bp.narration_steps)?bp.narration_steps:[];
  if(steps.length<3) issues.push("too few steps ("+steps.length+")");
  if(steps.length>16) issues.push("too many steps ("+steps.length+")");
  const revealed={}; steps.forEach((s,i)=>{
    if(!s.narration_text||!s.narration_text.trim()) issues.push("step "+(i+1)+" has no narration");
    if(s.narration_text && s.narration_text.length>260) issues.push("step "+(i+1)+" narration too long");
    (s.reveal||[]).forEach(r=>{ if(!byId[r]) issues.push("step "+(i+1)+" reveals unknown node "+r); revealed[r]=1; });
    if(s.point && !byId[s.point]) issues.push("step "+(i+1)+" point bad ref "+s.point);
  });
  nodes.forEach(n=>{ if(!revealed[n.id]) issues.push("node '"+(n.label||n.id)+"' is never revealed (missing step)"); });
  return { pass: issues.length===0, issues };
}

/* Process FLOW validity: an ordered station sequence, all revealed. */
export function flowCheck(bp){
  const issues = [];
  if(!bp || typeof bp!=="object") return { pass:false, issues:["not an object"] };
  if(!bp.meta || !bp.meta.title) issues.push("missing meta.title");
  const nodes = Array.isArray(bp.nodes)?bp.nodes:[];
  if(nodes.length<3) issues.push("too few nodes ("+nodes.length+", need ≥3)");
  if(nodes.length>12) issues.push("too many nodes ("+nodes.length+")");
  const byId={}; nodes.forEach(n=>{ if(!n.id) issues.push("node missing id"); else if(byId[n.id]) issues.push("duplicate node id: "+n.id); else byId[n.id]=n; });
  const steps = Array.isArray(bp.narration_steps)?bp.narration_steps:[];
  if(steps.length<3) issues.push("too few steps ("+steps.length+")");
  const revealed={}; steps.forEach((s,i)=>{
    if(!s.narration_text||!s.narration_text.trim()) issues.push("step "+(i+1)+" has no narration");
    if(s.narration_text && s.narration_text.length>260) issues.push("step "+(i+1)+" narration too long");
    (s.reveal||[]).forEach(r=>{ if(!byId[r]) issues.push("step "+(i+1)+" reveals unknown node "+r); revealed[r]=1; });
    if(s.point && !byId[s.point]) issues.push("step "+(i+1)+" point bad ref "+s.point);
  });
  nodes.forEach(n=>{ if(!revealed[n.id]) issues.push("node '"+(n.label||n.id)+"' is never revealed (missing step)"); });
  return { pass: issues.length===0, issues };
}

/* QC critic — deterministic, manifest-enforced. Delegates to tree/flow checks for those modes. */
export function qcCheck(bp){
  if(bp && bp.layout==="flow") return flowCheck(bp);
  if(bp && bp.layout==="tree") return treeCheck(bp);
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

/* Robust JSON extraction — small models wrap the object in ```json fences, a <think> block,
 * or trailing prose, and sometimes truncate the tail. Try hard before giving up. */
/* Elements ordered by when they first appear (reveal step), then declaration order —
 * this is the causal chain as the student experiences it. Markers/labels excluded. */
const ANNOTATION = new Set(["label","blockx","lightning"]);
export function chainOf(bp){
  if(bp && bp.layout==="flow") return (bp.nodes||[]).map(n=>n.label||n.id);   // flow = the node sequence
  if(bp && bp.layout==="tree"){   // pre-order traversal of the tree
    const nodes = bp.nodes||[], byId={}; nodes.forEach(n=>byId[n.id]=n);
    const root = bp.root || (nodes[0]&&nodes[0].id), out=[];
    (function walk(id){ const n=byId[id]; if(!n)return; out.push(n.label||n.id); nodes.filter(x=>x.parent===id).forEach(x=>walk(x.id)); })(root);
    return out.length?out:nodes.map(n=>n.label||n.id);
  }
  const els = (bp && bp.elements || []).filter(e => e.id && !ANNOTATION.has(e.type));
  const steps = (bp && bp.narration_steps) || [];
  const firstReveal = {};
  steps.forEach((s,i)=> (s.reveal||[]).forEach(id=>{ if(firstReveal[id]==null) firstReveal[id]=i; }));
  return els
    .map((e,idx)=>({ e, order:(firstReveal[e.id]!=null?firstReveal[e.id]:999), idx }))
    .sort((a,b)=> a.order-b.order || a.idx-b.idx)
    .map(x => x.e.label || x.e.id);
}

/* "Nothing-missed" STRUCTURAL check: a complete cascade is ONE connected directed chain where
 * every element is revealed and wired in. Catches skipped links (disconnected sub-chains),
 * orphan elements (revealed but never connected), and elements that never appear. Deterministic. */
export function graphCheck(bp){
  if(bp && (bp.layout==="tree"||bp.layout==="flow")) return { pass:true, issues:[], components:1 };   // handled by tree/flow checks
  const issues = [];
  const els = (bp && bp.elements || []).filter(e => e.id && !ANNOTATION.has(e.type));
  const steps = (bp && bp.narration_steps) || [];
  if(els.length < 2) return { pass:true, issues, components:1 };
  const ids = new Set(els.map(e=>e.id));

  // every chain element must be revealed at some step, or it never renders
  const revealed = new Set();
  steps.forEach(s => (s.reveal||[]).forEach(id => revealed.add(id)));
  for(const e of els) if(!revealed.has(e.id)) issues.push("element '"+(e.label||e.id)+"' is never revealed — it won't appear (missing step)");

  // build the undirected connectivity graph from arrows (+ moves) between chain elements
  const adj = {}; els.forEach(e => adj[e.id]=new Set());
  const linked = new Set();
  const addEdge = (a,b)=>{ if(ids.has(a)&&ids.has(b)&&a!==b){ adj[a].add(b); adj[b].add(a); linked.add(a); linked.add(b); } };
  steps.forEach(s=>{ (s.arrows||[]).forEach(a=>addEdge(a.from,a.to));
                     (s.move||[]).forEach(m=>{ if(m.to_id) addEdge(m.id,m.to_id); }); });

  // orphans: chain elements with no connection to anything (a link was skipped)
  for(const e of els) if(!linked.has(e.id)) issues.push("element '"+(e.label||e.id)+"' is never connected by an arrow (a causal link is missing)");

  // connected components over the linked nodes — more than one means the chain has a GAP
  const seen = new Set(); let components = 0;
  for(const id of linked){ if(seen.has(id)) continue; components++;
    const stack=[id]; while(stack.length){ const n=stack.pop(); if(seen.has(n))continue; seen.add(n); adj[n].forEach(m=>{ if(!seen.has(m)) stack.push(m); }); } }
  if(components > 1) issues.push("the cascade is split into "+components+" disconnected parts — a step is missing that links them into one chain");

  return { pass: issues.length===0, issues, components: components||1 };
}

export function parseBlueprint(raw){
  let t = raw || "";
  if(!t) return null;
  // drop reasoning / think blocks and markdown code fences
  t = t.replace(/<think>[\s\S]*?<\/think>/gi, "").replace(/<\/?think>/gi, "");
  const fence = t.match(/```(?:json)?\s*([\s\S]*?)```/i);
  if(fence) t = fence[1];
  const s = t.indexOf("{");
  if(s < 0) return null;
  // 1) fast path: first "{" … last "}"
  const e = t.lastIndexOf("}");
  if(e > s){ const one = tryParse(t.slice(s, e+1)); if(one) return one; }
  // 2) brace-balanced scan from the first "{" (ignores braces inside strings)
  const bal = balanced(t, s); if(bal){ const two = tryParse(bal); if(two) return two; }
  // 3) last resort: repair a truncated object (unclosed brackets/quote + trailing comma)
  const rep = tryParse(repair(t.slice(s))); if(rep) return rep;
  return null;
}
function tryParse(x){ try{ return JSON.parse(x); }catch(_){ return null; } }
function balanced(t, start){
  let depth=0, inStr=false, esc=false;
  for(let i=start;i<t.length;i++){ const c=t[i];
    if(inStr){ if(esc) esc=false; else if(c==="\\") esc=true; else if(c==='"') inStr=false; continue; }
    if(c==='"') inStr=true; else if(c==="{") depth++; else if(c==="}"){ depth--; if(depth===0) return t.slice(start,i+1); }
  }
  return null;   // never closed → truncated
}
function repair(x){
  let str=x, inStr=false, esc=false; const stack=[];
  for(const c of str){ if(inStr){ if(esc)esc=false; else if(c==="\\")esc=true; else if(c==='"')inStr=false; continue; }
    if(c==='"')inStr=true;
    else if(c==="{")stack.push("}"); else if(c==="[")stack.push("]");
    else if(c==="}"||c==="]")stack.pop(); }
  if(inStr) str+='"';
  str=str.replace(/,\s*$/,"");                        // dangling comma at the cut point
  while(stack.length) str+=stack.pop();               // close in nesting order (stack)
  return str.replace(/,\s*([}\]])/g, "$1");           // then any remaining trailing commas
}
