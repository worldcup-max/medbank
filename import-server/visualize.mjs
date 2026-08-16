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
`You are the DIRECTOR of a step-by-step medical/science explainer. You do NOT draw — you output a
JSON blueprint that a fixed renderer draws.

TOP RULE — ALWAYS PREFER A DIAGRAM. A real labelled diagram or animated schematic teaches far better
than a bullet mind-map. For almost every topic (aim for 80%+) you can and SHOULD build a diagrammatic
video. Work HARD to find the diagrammatic form first — a scene, a schematic, a plotted graph/curve, or
a process flow. Only fall back to the whiteboard "tree" as a LAST RESORT, when the content is a pure
definition/classification/list with genuinely no spatial layout, no sequence, and no quantities to plot.

Pick the FIRST mode below that can represent the concept:
• MODE "mechanism" — a cause-and-effect PROCESS in a REAL ANATOMICAL PLACE the templates draw
  (cell membrane: kidney tubule/gut; or a neuron/synapse). Richest, most spatial — use when it fits.
• MODE "cell" — an ELECTROCHEMICAL CELL (galvanic/voltaic/electrolytic): anode, cathode, salt bridge,
  electron flow ("galvanic cell", "which electrode is anode/cathode", "Daniell cell"). Real schematic.
• MODE "graph" — anything best shown as a PLOTTED CURVE on axes: reaction energy profile (activation
  energy, ΔH, catalyst), titration curve (pH vs volume), radioactive decay / half-life, Maxwell–
  Boltzmann distribution, phase diagram, cooling/heating curves, rate-vs-time, dose-response. If the
  idea involves how one quantity changes with another, or a characteristic curve, USE THIS.
• MODE "orbital" — ELECTRON CONFIGURATION / orbital filling: Aufbau order, Hund's rule, Pauli, ion
  formation. Renders arrows-in-boxes per subshell.
• MODE "geometry" — MOLECULAR SHAPE (VSEPR): a central atom with bonds and lone pairs (linear, bent,
  trigonal planar/pyramidal, tetrahedral, octahedral). Shows why lone pairs bend the shape.
• MODE "ice" — CHEMICAL EQUILIBRIUM set up as an ICE table (Initial / Change / Equilibrium) for a
  reaction; use for equilibrium concentration problems, Kc/Kp setups.
• MODE "flow" — a cause-and-effect chain / pathway with no anatomical home: biochemical cascades,
  enzyme pathways, "if X then Y then Z", stepwise procedures (redox balancing, limiting reagent,
  buffer action). Ordered stations connected by arrows. This is the default workhorse for processes.
• MODE "tree" — LAST RESORT only. A pure DEFINITION/CLASSIFICATION/LIST with no diagrammatic form
  (e.g. "the two toxins are…", "types of X" that truly have no spatial/quantitative structure).

Decision: try mechanism → cell → graph → flow first; choose "tree" ONLY if none of the diagrammatic
modes can honestly represent the content. Every highlight must produce a rich, engaging result.

════════ NARRATION — THIS IS THE WHOLE POINT. Make the student UNDERSTAND, not just see. ════════
The diagram is the stage; the narration is the teacher. Write every narration_text to build real
understanding, never to merely label what appears:
• Answer "WHY". After any statement, say why it is so or what it means — use "because…", "which
  means…", "so…". Never drop a term without unpacking it in plain words the moment it appears.
• Break it down. Assume the student meets this for the FIRST time. Go from intuition to the formal
  idea; define jargon inline; no leaps.
• Tell ONE connected story — each step refers back to the last ("now that we have …, …").
• Bust the classic misconception for that topic when there is one.
• SPEAK IT ALOUD: write narration EXACTLY as a voice must read it — the text-to-speech CANNOT read
  symbols or formulae. Spell everything out in words. Keep symbols in the diagram LABELS (for the eye)
  but WORDS in narration_text (for the ear). Say it like this:
    ∫ = "the integral of" · dy/dx = "dee y by dee x" · d/dx = "the derivative of" · Σ = "the sum of" ·
    √x = "the square root of x" · x² = "x squared" · xⁿ = "x to the power n" · π = "pi" · θ = "theta" ·
    ≈ = "approximately" · ≥ = "greater than or equal to" · ≠ = "is not equal to" · ∞ = "infinity" ·
    Δ = "delta" · ± = "plus or minus" · f(x) = "f of x" · |x| = "the absolute value of x" ·
    lim = "the limit" · ⇒ = "which implies" · ∴ = "therefore".
• One idea per step, at most two spoken sentences, warm and clear. The last step recaps the insight.
• Teach like the best tutor in the world:
   – Speak TO the student ("notice how…", "here's the trick…", "you might expect X, but…").
   – Use a quick concrete example or number when it makes the idea land ("half of −2 is −1, squared is 1…").
   – Reach for a plain everyday analogy when a concept is abstract, then drop it once the point is made.
   – Make the PAYOFF explicit — end a hard step with the takeaway ("so that's why…", "the whole point is…").
   – Pre-empt the mistake students actually make here, and say what to do instead.
Depth and clarity matter more than brevity within the two-sentence limit — every step should leave the
student thinking "oh, I get it now," not "okay, next."

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
{"meta":{"title":"","subject":"","concept_id":"snake_case_id"},"layout":"flow","nodes":[{"id":"n0","label":"","note":"","kind":"trigger"},{"id":"n1","label":"","note":"","kind":"process"}],"narration_steps":[{"short":"","term":"","narration_text":"","reveal":[],"active":[],"point":""}]}

═══════ MODE "cell" (electrochemical cell) ═══════
Rules:
1. Describe the two half-cells: "anode" and "cathode", each with a short "label" (e.g. "Zinc anode (−)"), a "half" reaction string (e.g. "Zn → Zn²⁺ + 2e⁻"), and a "sol" (solution label). Give a "bridge" label.
2. narration_steps drive a FIXED schematic; each step's "reveal"/"active"/"point" use ONLY these part names: "anode", "cathode", "wire", "bridge", "ions". Reveal all four core parts (anode, cathode, wire, bridge) across the steps; "ions" is optional.
3. 4–8 steps. narration_text is spoken, one idea, ≤ 2 sentences, teaches the WHY (AN-OX/RED-CAT, OIL-RIG, electron direction, why the salt bridge). Last step recaps. Faithful to the source; invent nothing.
Return ONLY valid minified JSON:
{"meta":{"title":"","subject":"","concept_id":"snake_case_id"},"layout":"cell","anode":{"label":"","half":"","sol":""},"cathode":{"label":"","half":"","sol":""},"bridge":"","narration_steps":[{"short":"","term":"","narration_text":"","reveal":["anode"],"active":["anode"],"point":"anode"}]}

═══════ MODE "graph" (plotted curve) ═══════
Rules:
1. Define "x" and "y" axes: each {min, max, label}. Choose ranges that frame the curve nicely.
2. "curves": 1–2 lines, each {id, color, points:[[x,y],…]} (6–9 points in DATA units; the renderer smooths them). Optional 2nd curve for a comparison (e.g. "with catalyst").
3. "markers": key labelled points {id, at:[x,y], label, color, drop?:true to drop a dashed line to the x-axis}. e.g. reactants, transition state, products; or half-equivalence, equivalence.
4. "regions" (optional): {id, type:"band", x0,x1, label, color} shaded vertical band (buffer region), or {id, type:"bracket", at:x, y0, y1, label, color} a vertical measure (Ea, ΔH).
5. narration_steps reveal the curve first, then markers/regions in teaching order; "reveal"/"active"/"point" reference curve ids, marker ids, or region ids. "point" should name a MARKER. 4–8 steps, last recaps.
Return ONLY valid minified JSON:
{"meta":{"title":"","subject":"","concept_id":"snake_case_id"},"layout":"graph","x":{"min":0,"max":100,"label":""},"y":{"min":0,"max":100,"label":""},"curves":[{"id":"c","color":"#7c3aed","points":[[0,0]]}],"markers":[{"id":"m","at":[0,0],"label":"","color":"#2563eb"}],"regions":[],"narration_steps":[{"short":"","term":"","narration_text":"","reveal":["c"],"active":["c"],"point":"m"}]}

═══════ MODE "orbital" (electron-configuration boxes) ═══════
"subshells" in FILL ORDER, each {id, label (e.g. "2p⁴"), boxes (1 for s, 3 for p, 5 for d, 7 for f), electrons (0..2×boxes)}. The renderer draws Hund/Pauli arrows automatically. Steps reveal subshells in order; "point" a subshell id.
{"meta":{"title":"","subject":"","concept_id":"snake_case_id"},"layout":"orbital","subshells":[{"id":"1s","label":"1s²","boxes":1,"electrons":2}],"narration_steps":[{"short":"","term":"","narration_text":"","reveal":["1s"],"active":["1s"],"point":"1s"}]}

═══════ MODE "geometry" (VSEPR molecular shape) ═══════
"center" (atom symbol), "shape" (one of: linear, trigonal_planar, bent, tetrahedral, trigonal_pyramidal, octahedral), "bonds":[{"to":"H"}…], optional "shape_label" and "angle". Steps reveal parts "bonds","lp","info" in that order.
{"meta":{"title":"","subject":"","concept_id":"snake_case_id"},"layout":"geometry","center":"O","shape":"bent","shape_label":"BENT","angle":"104.5°","bonds":[{"to":"H"},{"to":"H"}],"narration_steps":[{"short":"","term":"","narration_text":"","reveal":["bonds"],"active":["bonds"],"point":"bonds"}]}

═══════ MODE "ice" (equilibrium ICE table) ═══════
"reaction" string, "species" list, "rows":{"I":[…],"C":[…],"E":[…]} each with one entry per species. Steps reveal "rxn","I","C","E" in order; "point" one of those.
{"meta":{"title":"","subject":"","concept_id":"snake_case_id"},"layout":"ice","reaction":"","species":["",""],"rows":{"I":["",""],"C":["",""],"E":["",""]},"narration_steps":[{"short":"","term":"","narration_text":"","reveal":["rxn"],"active":["rxn"],"point":"rxn"}]}`
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
      ]} },
  /* ---- Chemistry gold exemplars (so chemistry highlights get an in-domain example) ---- */
  { text: "In a galvanic cell, which electrode is the anode and cathode, and which way do the electrons flow? Oxidation at the anode, reduction at the cathode, salt bridge balances charge.",
    blueprint: {meta:{title:"Galvanic cell — electron flow, anode & cathode",subject:"General Chemistry",concept_id:"galvanic_cell_electron_flow"},layout:"flow",
      nodes:[
        {id:"cell",label:"Galvanic cell",note:"spontaneous redox → electricity",kind:"trigger"},
        {id:"anode",label:"Anode (−)",note:"AN-OX: oxidation here",kind:"process"},
        {id:"lose",label:"Atoms lose e−",note:"OIL: oxidation is loss",kind:"process"},
        {id:"wire",label:"e− flow in wire",note:"anode → cathode",kind:"product"},
        {id:"cathode",label:"Cathode (+)",note:"RED-CAT: reduction here",kind:"process"},
        {id:"gain",label:"Ions gain e−",note:"RIG: reduction is gain",kind:"product"},
        {id:"salt",label:"Salt bridge",note:"keeps each side neutral",kind:"process"},
        {id:"current",label:"Steady current",note:"until equilibrium",kind:"outcome"}
      ],
      narration_steps:[
        {short:"Cell",term:"galvanic cell",narration_text:"A galvanic cell turns a spontaneous redox reaction into electrical current.",reveal:["cell"],active:["cell"],point:"cell"},
        {short:"Anode",term:"anode",narration_text:"Oxidation always happens at the anode — in a galvanic cell it is the negative electrode (AN-OX).",reveal:["anode"],active:["anode"],point:"anode"},
        {short:"Lose e−",term:"oxidation",narration_text:"There the atoms lose electrons — oxidation is loss (OIL).",reveal:["lose"],active:["lose"],point:"lose"},
        {short:"Wire",term:"electron flow",narration_text:"Those electrons flow out through the external wire, from anode to cathode.",reveal:["wire"],active:["wire"],point:"wire"},
        {short:"Cathode",term:"cathode",narration_text:"They reach the cathode, the positive electrode, where reduction happens (RED-CAT).",reveal:["cathode"],active:["cathode"],point:"cathode"},
        {short:"Gain e−",term:"reduction",narration_text:"Ions there gain the electrons — reduction is gain (RIG).",reveal:["gain"],active:["gain"],point:"gain"},
        {short:"Salt bridge",term:"salt bridge",narration_text:"The salt bridge lets ions move to keep each side neutral, so flow continues.",reveal:["salt"],active:["salt"],point:"salt"},
        {short:"Current",term:"current",narration_text:"The result is a steady current until equilibrium. Recap: anode oxidises (−) → electrons through the wire → cathode reduces (+), salt bridge balances charge.",reveal:["current"],active:["current"],point:"current"}
      ]} },
  { text: "How do I know if a reaction is spontaneous using Gibbs free energy? ΔG = ΔH − TΔS and the signs of ΔH and ΔS decide.",
    blueprint: {meta:{title:"Is it spontaneous? ΔG = ΔH − TΔS",subject:"General Chemistry",concept_id:"gibbs_spontaneity_four_cases"},layout:"tree",root:"g",
      nodes:[
        {id:"g",label:"ΔG = ΔH − TΔS",note:"sign of ΔG decides"},
        {id:"c1",parent:"g",label:"ΔH − , ΔS +",note:"exothermic + more disorder"},
        {id:"c1a",parent:"c1",label:"Spontaneous at all T",note:"ΔG always negative"},
        {id:"c2",parent:"g",label:"ΔH + , ΔS −",note:"endothermic + more order"},
        {id:"c2a",parent:"c2",label:"Never spontaneous",note:"ΔG always positive"},
        {id:"c3",parent:"g",label:"ΔH − , ΔS −",note:"exothermic but ordering"},
        {id:"c3a",parent:"c3",label:"Spontaneous at LOW T",note:"small TΔS term"},
        {id:"c4",parent:"g",label:"ΔH + , ΔS +",note:"endothermic but disordering"},
        {id:"c4a",parent:"c4",label:"Spontaneous at HIGH T",note:"TΔS overtakes ΔH"},
        {id:"warn",parent:"g",label:"Spontaneous ≠ fast",note:"that's kinetics, not ΔG"}
      ],
      narration_steps:[
        {short:"ΔG rule",term:"Gibbs free energy",narration_text:"A reaction is spontaneous when ΔG is negative, and ΔG = ΔH − TΔS — so the two signs decide everything.",reveal:["g"],active:["g"],point:"g"},
        {short:"Both favour",term:"all temperatures",narration_text:"ΔH negative and ΔS positive: both help, ΔG negative at every temperature — always spontaneous.",reveal:["c1","c1a"],active:["c1a"],point:"c1a"},
        {short:"Both oppose",term:"never",narration_text:"ΔH positive and ΔS negative: both oppose, ΔG positive at every temperature — never spontaneous.",reveal:["c2","c2a"],active:["c2a"],point:"c2a"},
        {short:"Low T",term:"low temperature",narration_text:"Both negative: enthalpy favours, entropy opposes — spontaneous only at low temperature where TΔS is small.",reveal:["c3","c3a"],active:["c3a"],point:"c3a"},
        {short:"High T",term:"high temperature",narration_text:"Both positive: entropy favours, enthalpy opposes — spontaneous only at high temperature where TΔS overtakes ΔH.",reveal:["c4","c4a"],active:["c4a"],point:"c4a"},
        {short:"Not fast",term:"spontaneous",narration_text:"Trap: spontaneous means it can happen, not that it is fast — speed is kinetics. Recap: −/+ always; +/− never; −/− low-T; +/+ high-T.",reveal:["warn"],active:["warn"],point:"warn"}
      ]} },
  { text: "In a Daniell (galvanic) cell with a zinc electrode in zinc sulphate and a copper electrode in copper sulphate joined by a salt bridge, which is the anode and cathode and which way do electrons flow?",
    blueprint: {meta:{title:"Daniell cell — Zn/Cu galvanic cell",subject:"General Chemistry",concept_id:"daniell_galvanic_cell"},layout:"cell",
      anode:{label:"Zinc anode (−)",half:"Zn → Zn²⁺ + 2e⁻",sol:"ZnSO₄ solution"},
      cathode:{label:"Copper cathode (+)",half:"Cu²⁺ + 2e⁻ → Cu",sol:"CuSO₄ solution"},
      bridge:"Salt bridge (KNO₃)",
      narration_steps:[
        {short:"Setup",term:"Daniell cell",narration_text:"A Daniell cell pairs a zinc half-cell with a copper half-cell to make electricity from a spontaneous redox reaction.",reveal:["anode","cathode"],active:[],point:"anode"},
        {short:"Anode",term:"anode",narration_text:"Zinc is more reactive, so it is oxidised — it is the anode, the negative electrode. Zinc atoms become Zn²⁺ ions, releasing electrons (AN-OX, OIL).",reveal:["anode"],active:["anode"],point:"anode"},
        {short:"Cathode",term:"cathode",narration_text:"Copper ions are reduced onto the copper electrode — that is the cathode, the positive electrode (RED-CAT, RIG).",reveal:["cathode"],active:["cathode"],point:"cathode"},
        {short:"Electrons",term:"electron flow",narration_text:"Electrons released at the zinc anode travel through the external wire to the copper cathode — anode to cathode, always.",reveal:["wire"],active:["wire"],point:"wire"},
        {short:"Salt bridge",term:"salt bridge",narration_text:"The salt bridge lets ions move to keep both solutions electrically neutral, or the flow would stop.",reveal:["bridge"],active:["bridge"],point:"bridge"},
        {short:"Ions",term:"ion movement",narration_text:"Anions drift toward the anode and cations toward the cathode. Recap: zinc anode oxidises and is negative, electrons flow through the wire to the positive copper cathode, and the salt bridge balances the charge.",reveal:["ions"],active:["ions"],point:"ions"}
      ]} },
  /* ---- Graph/curve exemplars (energy profile + titration) — the model reuses this for decay, Maxwell–Boltzmann, phase, etc. ---- */
  { text: "Draw the reaction energy profile: reactants, the activation energy barrier and transition state, the products and ΔH, and how a catalyst lowers the activation energy.",
    blueprint: {meta:{title:"Reaction energy profile — activation energy & ΔH",subject:"General Chemistry",concept_id:"reaction_energy_profile"},layout:"graph",
      x:{min:0,max:100,label:"Reaction progress →"}, y:{min:0,max:100,label:"Energy"},
      curves:[{id:"path",color:"#7c3aed",points:[[4,42],[20,55],[42,86],[64,55],[96,26]]},{id:"cat",color:"#0d9488",label:"with catalyst",points:[[4,42],[22,52],[42,68],[64,45],[96,26]]}],
      markers:[{id:"react",at:[4,42],label:"Reactants",color:"#2563eb"},{id:"ts",at:[42,86],label:"Transition state",color:"#dc2626"},{id:"prod",at:[96,26],label:"Products",color:"#0d9488"}],
      regions:[{id:"ea",type:"bracket",at:42,y0:42,y1:86,label:"Ea",color:"#dc2626"},{id:"dh",type:"bracket",at:80,y0:42,y1:26,label:"ΔH (−)",color:"#b45309"}],
      narration_steps:[
        {short:"Curve",term:"energy profile",narration_text:"An energy profile plots energy against reaction progress.",reveal:["path"],active:["path"],point:"react"},
        {short:"Reactants",term:"reactants",narration_text:"We start with the reactants at their energy level.",reveal:["react"],active:["react"],point:"react"},
        {short:"Barrier",term:"activation energy",narration_text:"Energy climbs to a peak — the transition state. The height of that barrier is the activation energy, Ea.",reveal:["ts","ea"],active:["ts"],point:"ts"},
        {short:"Products",term:"ΔH",narration_text:"It falls to the products. Products lower than reactants means ΔH is negative — the reaction is exothermic.",reveal:["prod","dh"],active:["prod"],point:"prod"},
        {short:"Catalyst",term:"catalyst",narration_text:"A catalyst gives a new path with a lower barrier — smaller Ea — so the reaction goes faster. It does NOT change ΔH.",reveal:["cat"],active:["cat"],point:"ts"},
        {short:"Recap",term:"recap",narration_text:"Recap: Ea is the barrier height, ΔH is products minus reactants, and a catalyst lowers Ea without changing ΔH.",reveal:[],active:["path"],point:"ts"}
      ]} },
  { text: "Sketch the titration curve for a weak acid with a strong base: the starting pH, the buffer region and half-equivalence where pH = pKa, and the equivalence point above pH 7.",
    blueprint: {meta:{title:"Titration curve — weak acid + strong base",subject:"General Chemistry",concept_id:"titration_curve_weak_strong"},layout:"graph",
      x:{min:0,max:50,label:"Volume of NaOH added (mL) →"}, y:{min:0,max:14,label:"pH"},
      curves:[{id:"curve",color:"#7c3aed",points:[[0,2.9],[5,4.0],[12.5,4.7],[20,5.6],[24,6.6],[25,8.7],[26,10.6],[35,11.8],[50,12.4]]}],
      markers:[{id:"start",at:[0,2.9],label:"Weak acid (low pH)",color:"#2563eb"},{id:"half",at:[12.5,4.7],label:"Half-eq: pH = pKa",color:"#0d9488",drop:true},{id:"equiv",at:[25,8.7],label:"Equivalence (pH > 7)",color:"#dc2626",drop:true}],
      regions:[{id:"buffer",type:"band",x0:5,x1:20,label:"buffer region",color:"#0d9488"}],
      narration_steps:[
        {short:"Curve",term:"titration curve",narration_text:"This plots the pH as we add strong base to a weak acid.",reveal:["curve"],active:["curve"],point:"start"},
        {short:"Start",term:"weak acid",narration_text:"We begin at a low pH — a weak acid, only partly ionised.",reveal:["start"],active:["start"],point:"start"},
        {short:"Buffer",term:"half-equivalence",narration_text:"The curve is flat here — the buffer region. At the half-equivalence point the pH equals the pKa of the acid.",reveal:["buffer","half"],active:["half"],point:"half"},
        {short:"Equivalence",term:"equivalence point",narration_text:"Then a steep jump: the equivalence point. For a weak acid with a strong base the pH there is above 7, because the salt is basic.",reveal:["equiv"],active:["equiv"],point:"equiv"},
        {short:"Recap",term:"recap",narration_text:"Recap: flat buffer region with pH = pKa at half-equivalence, then a sharp rise through an equivalence point above pH 7.",reveal:[],active:["curve"],point:"equiv"}
      ]} },
  /* ---- orbital-box, geometry, ICE exemplars ---- */
  { text: "Write the electron configuration of oxygen (Z = 8) and show how the 2p electrons fill using Hund's rule and the Pauli principle.",
    blueprint: {meta:{title:"Oxygen (Z=8): 1s² 2s² 2p⁴",subject:"General Chemistry",concept_id:"oxygen_electron_config"},layout:"orbital",
      subshells:[{id:"1s",label:"1s²",boxes:1,electrons:2},{id:"2s",label:"2s²",boxes:1,electrons:2},{id:"2p",label:"2p⁴",boxes:3,electrons:4}],
      narration_steps:[
        {short:"1s",term:"1s",narration_text:"Electrons fill lowest energy first. The 1s orbital takes two, paired with opposite spins — that's the Pauli principle.",reveal:["1s"],active:["1s"],point:"1s"},
        {short:"2s",term:"2s",narration_text:"Next the 2s orbital fills with two paired electrons.",reveal:["2s"],active:["2s"],point:"2s"},
        {short:"2p",term:"Hund's rule",narration_text:"The three 2p orbitals get one electron each first, all with the same spin, before any pairs up. That's Hund's rule — so the fourth 2p electron pairs in the first box.",reveal:["2p"],active:["2p"],point:"2p"},
        {short:"Recap",term:"recap",narration_text:"Recap: fill lowest first, one electron per orbital before pairing (Hund), and paired spins are opposite (Pauli).",reveal:[],active:["2p"],point:"2p"}
      ]} },
  { text: "Why is water (H₂O) bent and not linear? Explain using VSEPR and the lone pairs on oxygen.",
    blueprint: {meta:{title:"Water (H₂O) — bent, not linear",subject:"General Chemistry",concept_id:"water_vsepr_bent"},layout:"geometry",center:"O",shape:"bent",shape_label:"Molecular shape: BENT",angle:"104.5°",
      bonds:[{to:"H"},{to:"H"}],
      narration_steps:[
        {short:"Bonds",term:"bonding pairs",narration_text:"Oxygen forms two bonds, one to each hydrogen.",reveal:["bonds"],active:["bonds"],point:"bonds"},
        {short:"Lone pairs",term:"lone pairs",narration_text:"But oxygen also has two lone pairs. Four electron groups means a tetrahedral electron geometry.",reveal:["lp"],active:["lp"],point:"lp"},
        {short:"Shape",term:"bent",narration_text:"Lone pairs repel more strongly and push the bonds together, so the molecule is bent at about 104.5 degrees — not linear.",reveal:["info"],active:["info"],point:"info"}
      ]} },
  { text: "Set up the ICE table for the equilibrium N₂ + 3H₂ ⇌ 2NH₃ starting from 0.10 M N₂ and 0.30 M H₂.",
    blueprint: {meta:{title:"ICE table — ammonia synthesis",subject:"General Chemistry",concept_id:"ice_ammonia_equilibrium"},layout:"ice",reaction:"N₂ + 3H₂ ⇌ 2NH₃",species:["N₂","H₂","NH₃"],
      rows:{I:["0.10","0.30","0"],C:["−x","−3x","+2x"],E:["0.10−x","0.30−3x","2x"]},
      narration_steps:[
        {short:"Reaction",term:"equilibrium",narration_text:"An ICE table tracks how concentrations change as a reaction reaches equilibrium.",reveal:["rxn"],active:["rxn"],point:"rxn"},
        {short:"Initial",term:"initial",narration_text:"The Initial row is what we start with: 0.10 molar nitrogen, 0.30 molar hydrogen, and no ammonia.",reveal:["I"],active:["I"],point:"I"},
        {short:"Change",term:"change",narration_text:"The Change row uses the stoichiometry: nitrogen falls by x, hydrogen by 3x, and ammonia rises by 2x.",reveal:["C"],active:["C"],point:"C"},
        {short:"Equilibrium",term:"equilibrium row",narration_text:"The Equilibrium row is Initial plus Change — the expressions you put into the Kc expression to solve for x.",reveal:["E"],active:["E"],point:"E"}
      ]} }
];

/* Cost optimisation (a): send only the ONE worked example whose mode best fits the text
 * (a cheap local heuristic), instead of all three. The rules still describe every mode, so the
 * model can still choose any — this just trims ~2/3 of the few-shot tokens. */
function pickExemplar(text){
  const t = (text||"").toLowerCase();
  const isTree = /\btwo (toxins|types|forms|kinds)\b|\btypes? of\b|classification|consists? of|composed of|\bfeatures of\b|components of|categor|defined as|\brefers? to\b/.test(t);
  // chemistry cues → use an in-domain chemistry exemplar (chemistry rarely fits the biology scenes)
  const chem = /\b(mole|reagent|reactant|stoichiometr|oxidation|reduction|redox|anode|cathode|electrode|electron|electroly|galvanic|electrochemical|voltaic|daniell|salt bridge|half-cell|\bion\b|ionis|acid|\bbase\b|\bph\b|buffer|titrat|equilibrium|entropy|enthalpy|gibbs|spontaneous|exotherm|endotherm|\bbond|covalent|ionic|orbital|electroneg|valence|molar|molecul|intermolecular|dipole|hydrogen bond|london|van der|solub|catalyst|\bgas law\b|periodic|isotope|atom|compound|reaction|delta ?[ghs]|energy profile|activation energy|reaction coordinate|maxwell|boltzmann|half-life|half life|radioactive|decay|phase diagram|triple point|distribution|electron config|aufbau|hund|pauli|subshell|vsepr|molecular shape|molecular geometry|lone pair|tetrahedral|trigonal|\bbent\b|pyramidal|octahedral|bond angle|ice table|le ?chatelier|reaction quotient|\bkc\b|\bkp\b)\b/.test(t)
    || /Δ[ghs]/i.test(text||"");
  if(chem){
    // electrochemical cell → the purpose-built cell schematic
    if(/galvanic|electrochemical|voltaic|daniell|salt bridge|half-cell|electrode|(\banode\b[\s\S]*\bcathode\b)/.test(t)) return EXEMPLARS[5]; // chem cell schematic
    if(/electron config|orbital|aufbau|hund|pauli|subshell/.test(t)) return EXEMPLARS[8];  // orbital boxes
    if(/vsepr|molecular shape|molecular geometry|lone pair|tetrahedral|trigonal|\bbent\b|pyramidal|octahedral|bond angle/.test(t)) return EXEMPLARS[9]; // VSEPR geometry
    if(/ice table|le ?chatelier|reaction quotient|\bkc\b|\bkp\b|equilibrium (concentration|expression|constant|problem)/.test(t)) return EXEMPLARS[10]; // ICE table
    // plotted curves → the graph engine (energy profile / titration / decay / Boltzmann / phase …)
    if(/energy profile|reaction coordinate|activation energy|\bcatalyst\b|maxwell|boltzmann|distribution curve/.test(t)) return EXEMPLARS[6]; // energy-profile graph
    if(/titration|\bph curve\b|half-life|half life|radioactive decay|decay curve|phase diagram|triple point|cooling curve|heating curve|solubility curve|rate.{0,6}time/.test(t)) return EXEMPLARS[7]; // titration-style graph
    // thermodynamics decision matrix → the Gibbs "cases" tree (a genuine matrix, not a curve)
    if(/enthalp|entrop|gibbs|spontaneous|delta ?[ghs]|Δ[ghs]|criteri|four cases|sign of/.test(t)) return EXEMPLARS[4]; // chem tree
    if(isTree) return EXEMPLARS[4];   // other chem classification → tree (last resort)
    return EXEMPLARS[3];   // chem flow (cascades, redox, kinetics, buffers, stoichiometry…)
  }
  if(isTree) return EXEMPLARS[1]; // biology tree
  if(/membrane|receptor|channel|synap|neuron|axon|reabsorb|secret|lumen|tubule|vesicle|presynap|postsynap|collecting duct/.test(t)) return EXEMPLARS[0]; // biology mechanism
  return EXEMPLARS[2];   // biology flow — the default for cascades
}
/* Cost optimisation (b): the big CONSTANT block (rules + schemas + the example) goes FIRST and the
 * variable SOURCE goes LAST, so DeepSeek/OpenAI automatic prompt-caching bills the repeated prefix
 * at a fraction of the price on subsequent builds. */
export function buildVisualPrompt(text, subject){
  const e = pickExemplar(text);
  const shot = "SOURCE: "+e.text+"\nBLUEPRINT: "+JSON.stringify(e.blueprint);
  return visSystem() + "\n\nEXAMPLE:\n" + shot +
    "\n\nNow do the same for the SOURCE below (subject: "+(subject||"medicine")+"). Output ONLY the JSON blueprint.\nSOURCE: " + (text||"");
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

/* Electrochemical-CELL validity: a fixed schematic driven by named parts. */
const CELL_PARTS = new Set(["anode","cathode","wire","bridge","ions"]);
export function cellCheck(bp){
  const issues = [];
  if(!bp || typeof bp!=="object") return { pass:false, issues:["not an object"] };
  if(!bp.meta || !bp.meta.title) issues.push("missing meta.title");
  if(!bp.anode || !bp.anode.label) issues.push("missing anode.label");
  if(!bp.cathode || !bp.cathode.label) issues.push("missing cathode.label");
  const steps = Array.isArray(bp.narration_steps)?bp.narration_steps:[];
  if(steps.length<3) issues.push("too few steps ("+steps.length+")");
  if(steps.length>10) issues.push("too many steps ("+steps.length+")");
  const revealed = {};
  steps.forEach((s,i)=>{
    if(!s.narration_text || !s.narration_text.trim()) issues.push("step "+(i+1)+" has no narration");
    if(s.narration_text && s.narration_text.length>260) issues.push("step "+(i+1)+" narration too long");
    (s.reveal||[]).forEach(r=>{ if(!CELL_PARTS.has(r)) issues.push("step "+(i+1)+" reveals unknown part "+r); revealed[r]=1; });
    if(s.point && !CELL_PARTS.has(s.point)) issues.push("step "+(i+1)+" point not a cell part: "+s.point);
  });
  ["anode","cathode","wire","bridge"].forEach(p=>{ if(!revealed[p]) issues.push("core part '"+p+"' is never revealed"); });
  return { pass: issues.length===0, issues };
}

/* Plotted-GRAPH validity: axes, ≥1 curve with points, steps reference real ids. */
export function graphPlotCheck(bp){
  const issues = [];
  if(!bp || typeof bp!=="object") return { pass:false, issues:["not an object"] };
  if(!bp.meta || !bp.meta.title) issues.push("missing meta.title");
  if(!bp.x || bp.x.min==null || bp.x.max==null || !bp.x.label) issues.push("x axis needs min, max, label");
  if(!bp.y || bp.y.min==null || bp.y.max==null || !bp.y.label) issues.push("y axis needs min, max, label");
  const curves = Array.isArray(bp.curves)?bp.curves:[];
  if(!curves.length) issues.push("no curves");
  const ids = {};
  curves.forEach((c,i)=>{ if(!c.id){issues.push("curve "+i+" missing id");return;} ids[c.id]=1;
    if(!Array.isArray(c.points)||c.points.length<2) issues.push("curve '"+c.id+"' needs ≥2 points"); });
  (bp.markers||[]).forEach((m,i)=>{ if(!m.id){issues.push("marker "+i+" missing id");return;} ids[m.id]=1;
    if(!Array.isArray(m.at)||m.at.length!==2) issues.push("marker '"+m.id+"' needs at:[x,y]"); });
  (bp.regions||[]).forEach((r,i)=>{ if(!r.id){issues.push("region "+i+" missing id");return;} ids[r.id]=1; });
  const steps = Array.isArray(bp.narration_steps)?bp.narration_steps:[];
  if(steps.length<3) issues.push("too few steps ("+steps.length+")");
  if(steps.length>10) issues.push("too many steps ("+steps.length+")");
  steps.forEach((s,i)=>{
    if(!s.narration_text || !s.narration_text.trim()) issues.push("step "+(i+1)+" has no narration");
    if(s.narration_text && s.narration_text.length>260) issues.push("step "+(i+1)+" narration too long");
    (s.reveal||[]).forEach(r=>{ if(!ids[r]) issues.push("step "+(i+1)+" reveals unknown id "+r); });
    if(s.point && !ids[s.point]) issues.push("step "+(i+1)+" point unknown id "+s.point);
  });
  return { pass: issues.length===0, issues };
}

/* ORBITAL-box (electron configuration) validity. */
export function orbitalCheck(bp){
  const issues=[]; if(!bp||typeof bp!=="object")return{pass:false,issues:["not an object"]};
  if(!bp.meta||!bp.meta.title)issues.push("missing meta.title");
  const subs=Array.isArray(bp.subshells)?bp.subshells:[]; if(subs.length<1)issues.push("no subshells");
  const ids={}; subs.forEach((s,i)=>{ if(!s.id){issues.push("subshell "+i+" missing id");return;} ids[s.id]=1;
    if(!(s.boxes>=1))issues.push("subshell '"+s.id+"' needs boxes ≥1");
    if(s.electrons==null||s.electrons<0||s.electrons>2*s.boxes)issues.push("subshell '"+s.id+"' electrons must be 0.."+(2*s.boxes)); });
  const steps=Array.isArray(bp.narration_steps)?bp.narration_steps:[]; if(steps.length<2)issues.push("too few steps");
  steps.forEach((s,i)=>{ if(!s.narration_text||!s.narration_text.trim())issues.push("step "+(i+1)+" no narration");
    (s.reveal||[]).forEach(r=>{if(!ids[r])issues.push("step "+(i+1)+" reveals unknown subshell "+r);});
    if(s.point&&!ids[s.point])issues.push("step "+(i+1)+" point unknown "+s.point); });
  return {pass:issues.length===0,issues};
}
/* VSEPR GEOMETRY validity. */
const GEO_SHAPES=new Set(["linear","trigonal_planar","bent","tetrahedral","trigonal_pyramidal","octahedral"]);
const GEO_PARTS=new Set(["bonds","lp","info"]);
export function geometryCheck(bp){
  const issues=[]; if(!bp||typeof bp!=="object")return{pass:false,issues:["not an object"]};
  if(!bp.meta||!bp.meta.title)issues.push("missing meta.title");
  if(!bp.center)issues.push("missing center atom");
  if(!GEO_SHAPES.has(bp.shape))issues.push("shape must be one of: "+[...GEO_SHAPES].join(", "));
  const steps=Array.isArray(bp.narration_steps)?bp.narration_steps:[]; if(steps.length<2)issues.push("too few steps");
  steps.forEach((s,i)=>{ if(!s.narration_text||!s.narration_text.trim())issues.push("step "+(i+1)+" no narration");
    (s.reveal||[]).forEach(r=>{if(!GEO_PARTS.has(r))issues.push("step "+(i+1)+" reveals unknown part "+r);});
    if(s.point&&!GEO_PARTS.has(s.point))issues.push("step "+(i+1)+" point not a part "+s.point); });
  return {pass:issues.length===0,issues};
}
/* ICE table validity. */
const ICE_PARTS=new Set(["rxn","I","C","E"]);
export function iceCheck(bp){
  const issues=[]; if(!bp||typeof bp!=="object")return{pass:false,issues:["not an object"]};
  if(!bp.meta||!bp.meta.title)issues.push("missing meta.title");
  if(!bp.reaction)issues.push("missing reaction");
  const sp=Array.isArray(bp.species)?bp.species:[]; if(sp.length<2)issues.push("need ≥2 species");
  const rows=bp.rows||{}; ["I","C","E"].forEach(r=>{ if(!Array.isArray(rows[r])||rows[r].length!==sp.length)issues.push("row "+r+" must have "+sp.length+" cells"); });
  const steps=Array.isArray(bp.narration_steps)?bp.narration_steps:[]; if(steps.length<2)issues.push("too few steps");
  steps.forEach((s,i)=>{ if(!s.narration_text||!s.narration_text.trim())issues.push("step "+(i+1)+" no narration");
    (s.reveal||[]).forEach(r=>{if(!ICE_PARTS.has(r))issues.push("step "+(i+1)+" reveals unknown part "+r);});
    if(s.point&&!ICE_PARTS.has(s.point))issues.push("step "+(i+1)+" point not a part "+s.point); });
  return {pass:issues.length===0,issues};
}

/* QC critic — deterministic, manifest-enforced. Delegates to each layout's own check. */
export function qcCheck(bp){
  if(bp && bp.layout==="flow") return flowCheck(bp);
  if(bp && bp.layout==="tree") return treeCheck(bp);
  if(bp && bp.layout==="cell") return cellCheck(bp);
  if(bp && bp.layout==="graph") return graphPlotCheck(bp);
  if(bp && bp.layout==="orbital") return orbitalCheck(bp);
  if(bp && bp.layout==="geometry") return geometryCheck(bp);
  if(bp && bp.layout==="ice") return iceCheck(bp);
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
  if(bp && bp.layout==="orbital") return (bp.subshells||[]).map(s=>s.label||s.id);
  if(bp && bp.layout==="geometry") return [bp.center||"", bp.shape_label||bp.shape||""];
  if(bp && bp.layout==="ice") return [bp.reaction||"", "Initial","Change","Equilibrium"];
  if(bp && bp.layout==="graph") return (bp.markers||[]).map(m=>m.label||m.id);
  if(bp && bp.layout==="cell") return [(bp.anode&&bp.anode.label)||"anode","e⁻ → wire","(cathode)"+((bp.cathode&&bp.cathode.label)||""),bp.bridge||"salt bridge"];
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
  if(bp && bp.layout && bp.layout!=="scene") return { pass:true, issues:[], components:1 };   // non-scene layouts handled by their own checks
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
