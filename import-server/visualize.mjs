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
• MODE "venn" — SETS and PROBABILITY LOGIC on overlapping circles: union ("A or B"), intersection
  ("A and B"), complement ("not A", "neither"), mutually exclusive vs overlapping events, and
  CONDITIONAL probability P(A|B). Use whenever the idea is which outcomes belong to which event, or
  the add-vs-multiply / "or vs and" confusion. Two or three circles.
• MODE "flow" — a cause-and-effect chain / pathway with no anatomical home: biochemical cascades,
  enzyme pathways, "if X then Y then Z", stepwise procedures (redox balancing, limiting reagent,
  buffer action). Ordered stations connected by arrows. This is the default workhorse for processes.
• MODE "tree" — LAST RESORT only. A pure DEFINITION/CLASSIFICATION/LIST with no diagrammatic form
  (e.g. "the two toxins are…", "types of X" that truly have no spatial/quantitative structure).

Decision: try mechanism → cell → venn → graph → flow first; choose "tree" ONLY if none of the
diagrammatic modes can honestly represent the content — the one exception is a PROBABILITY TREE,
where "tree" IS the right diagram (see the tree mode notes). Every highlight must produce a rich,
engaging result.

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

OPTIONAL ENRICHMENT (add these when they raise understanding — they power an interactive study mode; any layout):
 • Per node/element, an optional "def": one plain-language sentence on WHY this part matters or what it really is (deeper than the short "note"). e.g. "def":"AN-OX — oxidation always happens here, and in a galvanic cell this electrode is negative."
 • Per narration_step, an optional "quiz" testing UNDERSTANDING of that step: {"q":"why…?","options":["…","…","…"],"answer":0,"why":"one-sentence explanation"}. Make the WRONG options the real misconceptions students hold (e.g. "the salt bridge carries the electrons"), not obviously-silly choices. 3 options. "answer" is the index of the correct one.
 • A top-level "recap": array of 2–3 short "things to remember" takeaways for the whole concept.
These are optional; when unsure, omit them rather than pad. They must never replace narration_text.

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
5. PROBABILITY TREE (the one time "tree" is the BEST diagram, not a fallback): make the root the
   starting situation ("Bag: 3 red, 2 blue"), each child one OUTCOME of the first trial, and each
   grandchild one outcome of the second. Put the branch probability in the node "label" (e.g.
   "Red  3/5") and what it means in "note". Teach the two rules explicitly: MULTIPLY along a path
   (both things happening in sequence) and ADD across paths (either path would do). If the draws are
   WITHOUT replacement, say why the second-layer fractions change (one item is gone, so the
   denominator drops) — that is the classic misconception.
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
6. CALCULUS on this same graph engine — two flagship builds, no extra machinery needed:
   • THE DERIVATIVE AS A SLOPE. Plot the curve, mark the fixed point P, then add SECANT LINES as
     extra 2-point "curves" ({"id":"sec1","points":[[x1,y1],[x2,y2]]}) with the second point sliding
     closer to P each step, and finally the TANGENT. Put the slope in each line's "label"
     ("secant slope = 4"). The story: an average rate over a gap becomes an instantaneous rate the
     moment the gap closes.
   • THE INTEGRAL AS AN AREA. Plot the curve, mark the region with a "band" region over the limits,
     then add "bracket" regions as the HEIGHTS of a few rectangles (each bracket is one rectangle:
     height times width), then plot the running-area curve (the antiderivative) as a second curve —
     its steepness at any x equals the height of the original curve. That IS the Fundamental
     Theorem: differentiation and integration undo each other.
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
{"meta":{"title":"","subject":"","concept_id":"snake_case_id"},"layout":"ice","reaction":"","species":["",""],"rows":{"I":["",""],"C":["",""],"E":["",""]},"narration_steps":[{"short":"","term":"","narration_text":"","reveal":["rxn"],"active":["rxn"],"point":"rxn"}]}

═══════ MODE "venn" (sets · union / intersection / complement / conditional probability) ═══════
Rules:
1. "sets": 2 or 3 circles, each {id (ONE short word, letters/digits only — "A","B","C"), label (what
   the event is, e.g. "A — plays football"), optional "p" (a small line under the label, e.g.
   "P(A) = 0.45"), optional "color"}. Optional "universe": what the outer box contains
   ("S — 100 students"). Optional "formula": one line shown under the box.
2. "regions": the pieces you want to shade and label. Every region id is built from the set ids by
   this GRAMMAR — use no other form:
     "A"                 the whole of circle A
     "A_only"            in A but in nothing else
     "A_and_B"           the overlap (also "A_and_B_and_C")
     "A_or_B"            the union — everything in at least one
     "not_A"             everything outside A
     "outside"           in none of the circles ("neither")
     "A_given_B"         CONDITIONAL — the renderer greys out everything outside B and shades the
                         part of A inside it, so the student SEES that B has become the new universe
   Each region: {id, label (the number/probability that goes there), optional "note" (≤4 words),
   optional "color"}.
3. The "cell" regions (A_only, A_and_B, outside) stay on screen once revealed and hold the numbers.
   The "overlay" regions (A, A_or_B, not_A, A_given_B) appear only on their own step — use them to
   sweep one idea at a time.
4. 4–8 narration_steps. "reveal"/"active"/"point" use ONLY set ids and region ids. Reveal the sets
   first, then the overlap, then the pieces, then the overlays.
5. TEACH THE MISCONCEPTION: "or" ADDS but you must subtract the overlap once because it was counted
   twice; "and" is where the circles overlap, and you only MULTIPLY the two probabilities when the
   events are independent. Say those in spoken words. Last step recaps.
Return ONLY valid minified JSON:
{"meta":{"title":"","subject":"","concept_id":"snake_case_id"},"layout":"venn","universe":"","formula":"","sets":[{"id":"A","label":"","p":"","color":"#2563eb"},{"id":"B","label":"","p":"","color":"#dc2626"}],"regions":[{"id":"A_and_B","label":"","note":"","color":"#7c3aed"}],"narration_steps":[{"short":"","term":"","narration_text":"","reveal":["A","B"],"active":["A"],"point":"A"}]}`
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
      ]} },
  /* ---- [11] MATHS · venn — "or" vs "and" vs "given", the add-vs-multiply misconception ---- */
  { text: "In a group of 100 students, 45 play football and 30 play tennis; 10 play both. Find P(A or B), P(A and B) and P(A given B).",
    blueprint: {meta:{title:"P(A or B), P(A and B) and P(A given B)",subject:"Probability",concept_id:"venn_or_and_given"},layout:"venn",
      universe:"S — all 100 students",
      formula:"P(A or B) = P(A) + P(B) − P(A and B)   ·   P(A|B) = P(A and B) ÷ P(B)",
      sets:[{id:"A",label:"A — plays football",p:"P(A) = 0.45",color:"#2563eb"},
            {id:"B",label:"B — plays tennis",p:"P(B) = 0.30",color:"#dc2626"}],
      regions:[{id:"A_and_B",label:"0.10",note:"both sports",color:"#7c3aed"},
               {id:"A_only",label:"0.35",note:"football only",color:"#2563eb"},
               {id:"B_only",label:"0.20",note:"tennis only",color:"#dc2626"},
               {id:"A_or_B",label:"0.65",note:"at least one",color:"#0d7a68"},
               {id:"A_given_B",label:"0.10 ÷ 0.30 = 0.33",note:"inside tennis only",color:"#7c3aed"},
               {id:"outside",label:"0.35",note:"neither sport",color:"#8b84a3"}],
      narration_steps:[
        {short:"Two events",term:"event",narration_text:"The box is every student, and each circle is one event — an event is just a set of outcomes we care about. Forty-five in a hundred play football, so the probability of A is nought point four five.",reveal:["A","B"],active:["A"],point:"A",
         def:"An event is a collection of outcomes; its probability is the share of the box it covers.",
         quiz:{q:"What does the box around the circles represent?",options:["Every possible outcome — all 100 students","Only the students who play a sport","The students who play both"],answer:0,why:"The box is the sample space: every outcome, including students in no circle at all."}},
        {short:"And",term:"intersection",narration_text:"Where the circles overlap sit the ten who play both, so the probability of A and B is nought point one. Notice we did not multiply the two probabilities — multiplying only works when the events are independent.",reveal:["A_and_B"],active:["A_and_B"],point:"A_and_B",
         def:"A and B is the intersection — the outcomes that belong to BOTH events at once."},
        {short:"Only",term:"exclusive parts",narration_text:"Now peel the overlap out of each circle: thirty-five play football but not tennis, and twenty play tennis but not football. Every student in the box now sits in exactly one piece, which is what makes the pieces safe to add.",reveal:["A_only","B_only"],active:["A_only","B_only"],point:"A_only"},
        {short:"Or",term:"union",narration_text:"A or B means at least one of them, so it is all three shaded pieces: nought point three five plus nought point one plus nought point two, which is nought point six five.",reveal:["A_or_B"],active:["A_or_B"],point:"A_or_B",
         def:"In maths 'or' is inclusive — it includes the people who do both."},
        {short:"Why subtract",term:"addition rule",narration_text:"That is why the addition rule subtracts the overlap: nought point four five plus nought point three is nought point seven five, but the ten who play both were counted in each circle, so we take that nought point one off once to get nought point six five.",reveal:["A_or_B"],active:["A_or_B"],point:"A_or_B",
         quiz:{q:"Why do we subtract P(A and B) in the addition rule?",options:["The overlap was counted twice, once in each circle","Because the events are independent","To make the answer smaller than one"],answer:0,why:"Adding the two circles counts everyone in the overlap twice, so one copy has to come back off."}},
        {short:"Given",term:"conditional probability",narration_text:"A given B changes the question: we are told the student plays tennis, so that circle becomes the whole world and everything outside switches off. Of those thirty, ten also play football — ten over thirty, about nought point three three.",reveal:["A_given_B"],active:["A_given_B"],point:"A_given_B",
         def:"Conditioning shrinks the sample space — you divide by the probability of what you were told.",
         quiz:{q:"P(A given B) is bigger than P(A) here. What does that tell you?",options:["Knowing they play tennis makes football more likely, so the events are not independent","The events are mutually exclusive","A mistake was made — it can never be bigger"],answer:0,why:"If knowing B changes the probability of A, the two events are dependent."}},
        {short:"Recap",term:"recap",narration_text:"So: overlap is and, everything shaded is or with the overlap subtracted once, and given means shrink the world down to what you were told and divide by it.",reveal:["outside"],active:["outside"],point:"outside"}],
      recap:["'And' is the overlap; 'or' is everything shaded, minus the overlap counted once.",
             "Only multiply probabilities when the events are independent.",
             "'Given' shrinks the sample space — divide by the probability of the condition."]} },
  /* ---- [12] MATHS · probability tree — multiply along, add across, without replacement ---- */
  { text: "A bag holds 3 red and 2 blue counters. Two are drawn without replacement. Find the probability that both are red, and that the two counters are different colours.",
    blueprint: {meta:{title:"Probability tree — two draws without replacement",subject:"Probability",concept_id:"prob_tree_without_replacement"},layout:"tree",root:"bag",
      nodes:[
        {id:"bag",label:"Bag: 3 red, 2 blue",note:"5 counters to start"},
        {id:"r1",parent:"bag",label:"1st Red  3/5",note:"3 of the 5 are red"},
        {id:"b1",parent:"bag",label:"1st Blue  2/5",note:"2 of the 5 are blue"},
        {id:"rr",parent:"r1",label:"2nd Red  2/4",note:"one red already gone"},
        {id:"rb",parent:"r1",label:"2nd Blue  2/4",note:"both blues still in"},
        {id:"br",parent:"b1",label:"2nd Red  3/4",note:"all 3 reds still in"},
        {id:"bb",parent:"b1",label:"2nd Blue  1/4",note:"one blue already gone"},
        {id:"pRR",parent:"rr",label:"Red then Red = 3/10",note:"3/5 × 2/4"},
        {id:"pRB",parent:"rb",label:"Red then Blue = 3/10",note:"3/5 × 2/4"},
        {id:"pBR",parent:"br",label:"Blue then Red = 3/10",note:"2/5 × 3/4"},
        {id:"pDIFF",parent:"pRB",label:"Different colours = 3/5",note:"3/10 + 3/10"}],
      narration_steps:[
        {short:"The set-up",term:"sample space",narration_text:"Start with the whole situation: five counters, three red and two blue. A tree lets us follow every possible story one draw at a time.",reveal:["bag"],active:["bag"],point:"bag"},
        {short:"First draw",term:"first branch",narration_text:"The first draw has two outcomes. Three of the five counters are red, so that branch carries three fifths, and two of the five are blue, so that one carries two fifths — and notice they add to one, because something must happen.",reveal:["r1","b1"],active:["r1","b1"],point:"r1"},
        {short:"The bag changed",term:"without replacement",narration_text:"Here is the step almost everyone misses. We did not put the counter back, so only four counters remain — and which ones remain depends on what we just drew.",reveal:["rr","rb"],active:["rr","rb"],point:"rr",
         quiz:{q:"After drawing a red first, why is the second-draw denominator 4 and not 5?",options:["One counter has been removed and not replaced","Because red and blue are equally likely","Because there were 4 reds to begin with"],answer:0,why:"Without replacement the bag genuinely shrinks, so every second-layer fraction is out of four."}},
        {short:"Other branch",term:"conditional branch",narration_text:"Down the blue branch all three reds are still in the bag, so a red now has probability three quarters — the same event, a different probability, because the past changed the bag.",reveal:["br","bb"],active:["br","bb"],point:"br"},
        {short:"Multiply along",term:"multiplication rule",narration_text:"To get both things happening you multiply along the path: three fifths times two quarters is six twentieths, which is three tenths for red then red.",reveal:["pRR"],active:["pRR"],point:"pRR",
         def:"Multiplying along a path answers 'this AND then that'.",
         quiz:{q:"Why do we multiply along a path rather than add?",options:["Because both events must happen in sequence","Because the branches are alternatives","Because the fractions have different denominators"],answer:0,why:"Multiplying is the 'and' rule: the second probability is a fraction of what is left after the first."}},
        {short:"Add across",term:"addition rule",narration_text:"Different colours can happen two separate ways — red then blue, or blue then red — so we work each path out and then add across, because either path would satisfy us.",reveal:["pRB","pBR"],active:["pRB","pBR"],point:"pRB"},
        {short:"The answer",term:"combining",narration_text:"Three tenths plus three tenths is six tenths, or three fifths, for two different colours.",reveal:["pDIFF"],active:["pDIFF"],point:"pDIFF"},
        {short:"Recap",term:"recap",narration_text:"Recap: multiply along a path for 'and', add across paths for 'or', and without replacement the denominator drops by one on the second draw.",reveal:[],active:["pDIFF"],point:"bag"}],
      recap:["Multiply along a path (and); add across paths (or).",
             "Without replacement, the second-layer fractions are out of one fewer.",
             "Every set of branches from one node adds to 1."]} },
  /* ---- [13] MATHS · graph — the derivative as the slope of the tangent ---- */
  { text: "Explain the derivative as the slope of the tangent: the secant between two points on a curve becomes the tangent as the second point slides in.",
    blueprint: {meta:{title:"The derivative — a secant becoming a tangent",subject:"Calculus",concept_id:"derivative_secant_to_tangent"},layout:"graph",
      x:{min:0,max:3.2,label:"x"},y:{min:0,max:10,label:"y = x²"},
      curves:[
        {id:"c",color:"#7c3aed",points:[[0,0],[0.4,0.16],[0.8,0.64],[1.2,1.44],[1.6,2.56],[2,4],[2.4,5.76],[2.8,7.84],[3.1,9.61]]},
        {id:"sec1",color:"#94a3b8",label:"secant slope = 4",points:[[1,1],[2,5],[3,9]]},
        {id:"sec2",color:"#2563eb",label:"secant slope = 3",points:[[1,1],[1.5,2.5],[2,4]]},
        {id:"tan",color:"#dc2626",label:"tangent slope = 2 — the derivative",points:[[0.5,0],[2.75,4.5],[3,5]]}],
      markers:[{id:"P",at:[1,1],label:"P (1, 1)",color:"#4b2c91",drop:true},
               {id:"Q1",at:[3,9],label:"Q at x = 3",color:"#94a3b8",drop:true},
               {id:"Q2",at:[2,4],label:"Q slides to x = 2",color:"#2563eb",drop:true}],
      narration_steps:[
        {short:"A curve bends",term:"gradient",narration_text:"On a straight line the steepness never changes, but this curve gets steeper as you move right — so asking 'what is its slope' only makes sense at one chosen point. Let us fix on P, where x is one.",reveal:["c","P"],active:["P"],point:"P",
         def:"Slope means rise divided by run — how much y changes for each unit of x."},
        {short:"Average rate",term:"secant",narration_text:"Join P to a second point Q at x equals three. That straight line through two points on a curve is called a secant, and its slope is nine minus one over three minus one, which is four.",reveal:["sec1","Q1"],active:["sec1","Q1"],point:"Q1",
         def:"A secant slope is an AVERAGE rate of change across a gap, not the rate at a single point."},
        {short:"Close the gap",term:"limit",narration_text:"But four describes the whole stretch, not P itself. Slide Q in to x equals two and the secant slope falls to three — closer to how steep the curve really is at P.",reveal:["sec2","Q2"],active:["sec2","Q2"],point:"Q2",
         quiz:{q:"Why isn't the first secant slope the gradient at P?",options:["It averages the steepness over a whole gap, and the curve changes steepness across it","Because the line is straight","Because Q is higher than P"],answer:0,why:"A secant only gives an average; the curve is flatter near P and steeper near Q."}},
        {short:"The tangent",term:"tangent",narration_text:"Keep sliding Q towards P and the secant settles onto one line that just grazes the curve — the tangent, with slope two. That limiting value is the derivative at P.",reveal:["tan"],active:["tan","P"],point:"P",
         def:"The derivative at a point is the limit the secant slopes approach as the gap shrinks to nothing."},
        {short:"Not a fraction",term:"dee y by dee x",narration_text:"We write this dee y by dee x, and the classic trap is reading it as a fraction of two numbers. It is one symbol meaning the instantaneous rate — how fast y is changing at that exact instant.",reveal:["tan"],active:["P"],point:"P",
         quiz:{q:"What does dy/dx actually mean?",options:["The instantaneous rate of change — the slope of the tangent","dy divided by dx, two separate numbers","The average change between two points"],answer:0,why:"It is a single symbol for the limit of the secant slopes, not an ordinary fraction."}},
        {short:"Recap",term:"recap",narration_text:"Recap: an average rate over a gap becomes an instantaneous rate the moment the gap closes — and for y equals x squared, the derivative is two x, which is exactly two at x equals one.",reveal:["tan"],active:["P"],point:"P"}],
      recap:["A secant gives an average rate; the tangent gives the instantaneous rate.",
             "The derivative is the LIMIT of secant slopes as the two points merge.",
             "dy/dx is one symbol for that limit, not a fraction to be split."]} },
  /* ---- [14] MATHS · graph — the definite integral as area, and the Fundamental Theorem ---- */
  { text: "Explain the definite integral as the area under a curve, using rectangles, and how the Fundamental Theorem links area to the antiderivative.",
    blueprint: {meta:{title:"The definite integral — area under the curve",subject:"Calculus",concept_id:"integral_area_under_curve"},layout:"graph",
      x:{min:0,max:2.3,label:"x"},y:{min:0,max:5,label:"value"},
      curves:[
        {id:"f",color:"#7c3aed",label:"f(x) = x²",points:[[0,0],[0.367,0.135],[0.733,0.537],[1.1,1.21],[1.467,2.152],[1.833,3.36],[2.2,4.84]]},
        {id:"F",color:"#0d7a68",points:[[0,0],[0.367,0.016],[0.733,0.131],[1.1,0.444],[1.467,1.052],[1.833,2.053],[2.2,3.549]]}],
      markers:[{id:"U",at:[2,4],label:"upper limit x = 2",color:"#4b2c91",drop:true},
               {id:"Ar",at:[2,2.67],label:"area = 8 ÷ 3 ≈ 2.67",color:"#0d7a68"},
               {id:"Fm",at:[1.833,2.053],label:"F(x) = x³ ÷ 3 — area so far",color:"#0d7a68"}],
      regions:[{id:"band",type:"band",x0:0,x1:2,label:"the region we are measuring",color:"#7c3aed"},
               {id:"r1",type:"bracket",at:0.25,y0:0,y1:0.0625,label:"h = 0.06",color:"#dc2626"},
               {id:"r2",type:"bracket",at:0.75,y0:0,y1:0.5625,label:"h = 0.56",color:"#dc2626"},
               {id:"r3",type:"bracket",at:1.25,y0:0,y1:1.5625,label:"h = 1.56",color:"#dc2626"},
               {id:"r4",type:"bracket",at:1.75,y0:0,y1:3.0625,label:"h = 3.06",color:"#dc2626"}],
      narration_steps:[
        {short:"The region",term:"definite integral",narration_text:"Here is the curve f of x equals x squared. The integral from nought to two of x squared is not a mysterious symbol — it is simply the area trapped between this curve and the x-axis, between those two limits.",reveal:["f","band","U"],active:["band"],point:"U",
         def:"A definite integral is an accumulated total — for a curve above the axis, that total is an area."},
        {short:"Chop it up",term:"Riemann rectangles",narration_text:"The region has a curved top, so we cannot use one rectangle. Instead chop it into thin vertical strips and treat each one as a rectangle: its area is its height on the curve times its width.",reveal:["r1","r2","r3","r4"],active:["r1","r2","r3","r4"],point:"U",
         def:"Each red bar is one strip's height, read straight off the curve."},
        {short:"Thinner and thinner",term:"limit",narration_text:"Four rectangles undershoot, because each flat top misses the rise across the strip. Make the strips thinner and the gaps shrink, and in the limit of infinitely thin strips the total becomes the exact area — that is what the integral sign means.",reveal:["r1","r2","r3","r4"],active:["band"],point:"U",
         quiz:{q:"Why do we let the rectangle width shrink towards zero?",options:["Each flat top misses part of the curve, and thinner strips miss less","To make the arithmetic easier","Because rectangles have no area otherwise"],answer:0,why:"The error lives in the sliver between the flat top and the curve; thinner strips squeeze it away."}},
        {short:"Area so far",term:"accumulation",narration_text:"Now plot a second curve: the area collected so far as you sweep from left to right. At x equals two it has reached eight thirds, about two point six seven — the exact answer.",reveal:["F","Fm","Ar"],active:["F","Fm","Ar"],point:"Ar"},
        {short:"The link",term:"Fundamental Theorem",narration_text:"Look at how the green area curve behaves. Where the purple curve is low the area grows slowly, and where the purple curve is high the area shoots up — so the slope of the area curve at any point equals the height of the original curve.",reveal:["F"],active:["F"],point:"Ar",
         def:"Differentiating the area-so-far function gives you back the original function.",
         quiz:{q:"What is the Fundamental Theorem of Calculus really saying?",options:["Differentiation and integration undo each other","Area is always positive","Every curve has an antiderivative you can write down"],answer:0,why:"The derivative of the area-so-far function is the original function, so the two operations are inverses."}},
        {short:"Recap",term:"recap",narration_text:"Recap: the definite integral is the exact area you get from infinitely thin rectangles, and you find it by evaluating the antiderivative at the two limits and subtracting — because differentiation and integration undo each other.",reveal:["F"],active:["Ar"],point:"Ar"}],
      recap:["A definite integral is an accumulated area, built from infinitely thin rectangles.",
             "The area-so-far function's SLOPE is the original curve — the Fundamental Theorem.",
             "So you evaluate the antiderivative at both limits and subtract."]} }
];

/* Cost optimisation (a): send only the ONE worked example whose mode best fits the text
 * (a cheap local heuristic), instead of all three. The rules still describe every mode, so the
 * model can still choose any — this just trims ~2/3 of the few-shot tokens. */
function pickExemplar(text){
  const t = (text||"").toLowerCase();
  /* ---- MATHS routing first: maths cues are distinctive, and the chemistry regex below would
     otherwise swallow words like "reaction", "atom" or "distribution" out of a maths passage. ---- */
  // sets / probability logic → the Venn diagram
  if(/venn|\bunion\b|intersection of|\bcomplement\b|mutually exclusive|\bsubset\b|set notation|(\bp\s*\(\s*a\s*(or|and|\|)\s*b\s*\))|probability of a (or|and|given)|conditional probability|\bgiven that\b|\bp\s*\(\s*a\s*\|\s*b\s*\)|neither .{0,20}\bnor\b|at least one of/.test(t))
    return EXEMPLARS[11];
  // branching chance experiments → the probability tree
  if(/probability tree|tree diagram|with(out)? replacement|two draws|draws? (two|a second)|branch(es)? .{0,20}probabilit|independent events|multiply along|\bdice\b|\bcoin\b|\bspinner\b|counters? (are|is) drawn|balls? (are|is) drawn/.test(t))
    return EXEMPLARS[12];
  // the derivative as a slope
  if(/derivative|differentiat|tangent|\bsecant\b|gradient of (the )?(curve|tangent)|dy\/dx|dee y by dee x|instantaneous rate|rate of change|stationary point|f ?['′]\(x\)|chain rule|product rule|quotient rule|second derivative|concav/.test(t))
    return EXEMPLARS[13];
  // the integral as an area
  if(/integral|integrat|antiderivative|area under (the )?curve|riemann|fundamental theorem|\+ ?c\b.{0,20}constant of integration|by parts|substitution rule/.test(t))
    return EXEMPLARS[14];
  // any other plottable maths idea → the derivative graph exemplar (best in-domain graph shot)
  if(/\blimit\b|approaches|asymptot|\bcontinuit\b|continuous function|domain and range|\bsin\b|\bcos\b|\btan\b|sine|cosine|unit circle|radian|logarithm|\bln\b|exponential (growth|decay|function)|quadratic|parabola|\bvertex\b|simultaneous equations|geometric series|arithmetic sequence|converge|\bsigma notation\b|sum to infinity/.test(t))
    return EXEMPLARS[13];
  const isTree =/\btwo (toxins|types|forms|kinds)\b|\btypes? of\b|classification|consists? of|composed of|\bfeatures of\b|components of|categor|defined as|\brefers? to\b/.test(t);
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

/* VENN validity — set ids must be simple words, and every region id must parse against the
 * region GRAMMAR over those ids (the renderer can only draw ids it can parse). */
export function vennParseId(id, ids){
  let m;
  if(id==="outside") return { kind:"outside", uses:ids.slice() };
  if((m=/^not_(.+)$/.exec(id))) return ids.indexOf(m[1])>=0 ? { kind:"not", uses:[m[1]] } : null;
  if((m=/^(.+)_given_(.+)$/.exec(id))) return (ids.indexOf(m[1])>=0 && ids.indexOf(m[2])>=0 && m[1]!==m[2]) ? { kind:"given", uses:[m[1],m[2]] } : null;
  if((m=/^(.+)_only$/.exec(id))) return ids.indexOf(m[1])>=0 ? { kind:"only", uses:[m[1]] } : null;
  if(id.indexOf("_or_")>0){ const p=id.split("_or_"); return p.every(t=>ids.indexOf(t)>=0) ? { kind:"or", uses:p } : null; }
  if(id.indexOf("_and_")>0){ const p=id.split("_and_"); return p.every(t=>ids.indexOf(t)>=0) ? { kind:"and", uses:p } : null; }
  if(ids.indexOf(id)>=0) return { kind:"set", uses:[id] };
  return null;
}
export function vennCheck(bp){
  const issues=[]; if(!bp||typeof bp!=="object") return {pass:false,issues:["not an object"]};
  if(!bp.meta||!bp.meta.title) issues.push("missing meta.title");
  const sets=Array.isArray(bp.sets)?bp.sets:[];
  if(sets.length<2||sets.length>3) issues.push("venn needs 2 or 3 sets (got "+sets.length+")");
  const ids=[]; const seen={};
  sets.forEach((s,i)=>{
    if(!s.id){ issues.push("set "+i+" missing id"); return; }
    if(!/^[A-Za-z0-9]+$/.test(s.id)) issues.push("set id '"+s.id+"' must be letters/digits only (no spaces, no underscores)");
    if(seen[s.id]) issues.push("duplicate set id '"+s.id+"'"); seen[s.id]=1; ids.push(s.id);
    if(!s.label) issues.push("set '"+s.id+"' needs a label saying what the event is");
  });
  const ok={}; ids.forEach(x=>ok[x]=1);
  const regs=Array.isArray(bp.regions)?bp.regions:[];
  if(!regs.length) issues.push("no regions — shade and label at least the overlap");
  regs.forEach((r,i)=>{
    if(!r.id){ issues.push("region "+i+" missing id"); return; }
    if(ok[r.id] && ids.indexOf(r.id)<0){ issues.push("duplicate region id '"+r.id+"'"); return; }
    if(!vennParseId(r.id, ids)) issues.push("region id '"+r.id+"' does not follow the grammar (use A, A_only, A_and_B, A_or_B, not_A, outside, A_given_B over the set ids "+ids.join(",")+")");
    else ok[r.id]=1;
  });
  const steps=Array.isArray(bp.narration_steps)?bp.narration_steps:[];
  if(steps.length<3) issues.push("too few steps ("+steps.length+", need ≥3)");
  if(steps.length>10) issues.push("too many steps ("+steps.length+")");
  steps.forEach((s,i)=>{
    if(!s.narration_text||!s.narration_text.trim()) issues.push("step "+(i+1)+" has no narration");
    if(s.narration_text && s.narration_text.length>260) issues.push("step "+(i+1)+" narration too long");
    (s.reveal||[]).forEach(r=>{ if(!ok[r]) issues.push("step "+(i+1)+" reveals unknown id "+r); });
    (s.active||[]).forEach(r=>{ if(!ok[r]) issues.push("step "+(i+1)+" active unknown id "+r); });
    if(s.point && !ok[s.point]) issues.push("step "+(i+1)+" point unknown id "+s.point);
  });
  return { pass: issues.length===0, issues };
}

/* Every layout the engine in app.html can actually draw. A blueprint naming anything else would
 * fall through to the scene renderer and blow up, so it is rejected here and at the response guard. */
export const LAYOUTS = new Set(["scene","tree","flow","cell","graph","orbital","geometry","ice","venn"]);

/* QC critic — deterministic, manifest-enforced. Delegates to each layout's own check. */
export function qcCheck(bp){
  if(bp && bp.layout && !LAYOUTS.has(bp.layout))
    return { pass:false, issues:["layout '"+bp.layout+"' does not exist — use one of: "+[...LAYOUTS].join(", ")] };
  if(bp && bp.layout==="flow") return flowCheck(bp);
  if(bp && bp.layout==="tree") return treeCheck(bp);
  if(bp && bp.layout==="cell") return cellCheck(bp);
  if(bp && bp.layout==="graph") return graphPlotCheck(bp);
  if(bp && bp.layout==="orbital") return orbitalCheck(bp);
  if(bp && bp.layout==="geometry") return geometryCheck(bp);
  if(bp && bp.layout==="ice") return iceCheck(bp);
  if(bp && bp.layout==="venn") return vennCheck(bp);
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
  if(bp && bp.layout==="venn") return (bp.sets||[]).map(s=>s.label||s.id)
    .concat((bp.regions||[]).map(r=>(r.id||"")+(r.label?" = "+r.label:"")));
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
