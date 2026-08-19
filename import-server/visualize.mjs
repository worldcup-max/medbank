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
• MODE "fbd" — a FREE-BODY DIAGRAM: the forces acting on ONE body (block on a slope, mass on a
  string, car on a bend, satellite in orbit). Use for Newton's laws, equilibrium, tension, friction,
  the normal force, inclines, "what is the net force", and circular-motion dynamics. The renderer
  draws the situation on the LEFT and the isolated body on the RIGHT, and every arrow must name the
  object that exerts it. This is the flagship physics mode — prefer it over "flow" for any force
  question.
• MODE "circuit" — a DC CIRCUIT SCHEMATIC: a battery, resistors, lamps, switches and meters on a
  rectangular loop, with charge flowing round it and an optional VOLTAGE LADDER showing potential as
  height. Use for current, voltage, resistance, series vs parallel, Ohm's law, meter placement, and
  above all for "the current is not used up".
• MODE "logic" — a LOGIC-GATE SCHEMATIC: input pins carrying a 0 or a 1, AND/OR/NOT/NAND/NOR/XOR/
  XNOR gates wired together, and the signal COLOURED BY VALUE as it propagates left to right (1 is
  red, 0 is blue). Optionally a TRUTH TABLE is bonded beside it, one row highlighted per step. Use
  for Boolean algebra, truth tables, De Morgan's laws, universal gates, circuit simplification,
  half/full adders and any "what is the output when…" question. This is the flagship computing mode.
• MODE "table" — a GRID revealed one row per beat: truth tables on their own, comparison matrices
  (RAM vs ROM, compiler vs interpreter, TCP vs UDP, sorting algorithms), trace/dry-run tables, and
  any "compare these on these criteria" content. Columns can be tinted "in" (the givens) or "out"
  (the results), so a student sees which side of the table is cause and which is effect. Prefer this
  over "tree" for anything that is really a comparison.
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
• MODE "unitcircle" — TRIGONOMETRY's master diagram: a radius drawn at angle θ on a circle of
  radius 1, with the sine as the HEIGHT of the point and the cosine as the distance ACROSS. Use for
  "where sine/cosine come from", radians vs degrees, quadrant signs (ASTC), and the Pythagorean
  identity. Prefer this over a graph whenever the idea is what sine and cosine ARE.
• MODE "solve" — a WORKED ALGEBRAIC SOLUTION, one line per move, each line carrying the REASON for
  that move: solving equations, completing the square, quadratics, factorising, rearranging formulae,
  simultaneous equations by elimination, absolute-value equations, and INEQUALITIES (add the optional
  "numberline" to shade the solution set with an open or filled dot). Use whenever the source asks to
  SOLVE, SIMPLIFY or FACTORISE something.
• MODE "vectors" — arrows on a coordinate grid: vector addition tip-to-tail, the resultant, and
  components dropping to the axes. Use for what a vector IS, why sliding one changes nothing, and
  why components simply add.
• MODE "matrix" — a 2×2 MATRIX AS A TRANSFORMATION of the plane: the unit square and its basis
  arrows i and j, where each COLUMN sends them, and the determinant as the AREA SCALE FACTOR. Use for
  "what does a matrix do", determinants, singular/invertible, and why order matters.
• MODE "flow" — a cause-and-effect chain / pathway with no anatomical home: biochemical cascades,
  enzyme pathways, "if X then Y then Z", stepwise procedures (redox balancing, limiting reagent,
  buffer action). Ordered stations connected by arrows. This is the default workhorse for processes.
• MODE "tree" — LAST RESORT only. A pure DEFINITION/CLASSIFICATION/LIST with no diagrammatic form
  (e.g. "the two toxins are…", "types of X" that truly have no spatial/quantitative structure).

MATHS ROUTING (use it — never force maths into a medical or chemistry mode): functions, limits,
continuity, the derivative-as-tangent, integrals-as-area, curve sketching, sequences and series, and
systems of equations → "graph". Trig, radians, quadrant signs, the Pythagorean identity →
"unitcircle". Solving / factorising / quadratics / rearranging / inequalities → "solve". Vectors →
"vectors". Matrices, determinants, linear transformations → "matrix". Sets and probability logic →
"venn"; branching chance experiments (with/without replacement) → "tree" as a PROBABILITY TREE.
Multi-step PROCEDURES with no single worked example (chain rule, integration by parts, Gaussian
elimination, induction) → "flow".

PHYSICS ROUTING (never force physics into a chemistry mode): forces, net force, equilibrium, tension,
the normal force, friction, inclines, Newton's laws, third-law pairs, circular-motion dynamics and
orbits → "fbd". DC circuits, current, voltage, resistance, series/parallel, batteries, bulbs, meters
→ "circuit". Kinematics and motion graphs, projectiles, SHM, waves, heating/cooling curves,
inverse-square laws, force–time and energy–position plots → "graph". Vector addition, components,
resultants, relative velocity and 2-D momentum → "vectors". Multi-step accounting procedures (energy
bookkeeping, solving a collision, reducing a resistor network) → "flow".

COMPUTER STUDIES ROUTING (never force computing into a physics or chemistry mode — a "logic circuit"
is NOT a DC circuit, and an "AND gate" has nothing to do with current): logic gates, Boolean
expressions and laws, De Morgan, NAND/NOR as universal gates, adders, ALUs, circuit simplification
and "what does this circuit output" → "logic". Truth tables on their own, K-maps, and every
comparison matrix (RAM vs ROM, compiler vs interpreter, TCP vs UDP, stack vs queue, bubble vs
insertion sort, OSI vs TCP/IP) → "table". Flowcharts, dry-running an algorithm, the
fetch–decode–execute cycle, the software development lifecycle, the compilation pipeline and a
packet's journey → "flow" (use kind "trigger" for Start, "process" for a step, "danger" for the
decision that students get wrong, "outcome" for Stop). Base conversion, two's complement,
floating-point encoding, subnet masks and Big-O arithmetic → "solve", one line per move. Big-O
growth curves against input size → "graph". Genuine taxonomies (types of software, network
topologies, data types) → "tree", last resort as always.

Decision: try mechanism → cell → logic → fbd/circuit → unitcircle/solve/vectors/matrix → venn → table → graph → flow first; choose "tree" ONLY if none of the
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
{"meta":{"title":"","subject":"","concept_id":"snake_case_id"},"layout":"venn","universe":"","formula":"","sets":[{"id":"A","label":"","p":"","color":"#2563eb"},{"id":"B","label":"","p":"","color":"#dc2626"}],"regions":[{"id":"A_and_B","label":"","note":"","color":"#7c3aed"}],"narration_steps":[{"short":"","term":"","narration_text":"","reveal":["A","B"],"active":["A"],"point":"A"}]}

═══════ MODE "unitcircle" (trigonometry — sine is the height, cosine is the across) ═══════
Rules:
1. "angle": the angle θ in DEGREES, strictly between 0 and 360 (e.g. 52). The renderer draws the
   circle, the axes, the radius at θ, the point P, the angle arc, and the labels.
2. narration_steps drive a FIXED diagram. "reveal"/"active"/"point" use ONLY these part names:
   "circle", "radius", "sin", "cos", "quadrants", "identity". Reveal at least "radius", "sin" and
   "cos". 3–8 steps, last recaps.
3. TEACH THE MISCONCEPTION: sine is not a triangle-only idea — it is simply how HIGH the point is on
   the circle, which is why it never exceeds one and why it goes negative below the axis. The
   identity is Pythagoras with a hypotenuse of one, not a rule to memorise. Spoken words only:
   "sine of theta", "cosine squared plus sine squared equals one".
Return ONLY valid minified JSON:
{"meta":{"title":"","subject":"","concept_id":"snake_case_id"},"layout":"unitcircle","angle":52,"narration_steps":[{"short":"","term":"","narration_text":"","reveal":["circle"],"active":["circle"],"point":"circle"}]}

═══════ MODE "solve" (a worked solution, line by line, with the reason for every move) ═══════
Rules:
1. "problem": the question exactly as it would be set (it sits in the banner).
2. "lines": 3–9 steps of working, IN ORDER, each {id (l1,l2,…), math (the algebra for that line —
   symbols are fine HERE, this is a label), why (a SHORT reason for the move, e.g. "divide every
   term by 2", "÷ by −3 → flip the sign")}. Every line MUST have a "why" — the reason is the lesson.
3. OPTIONAL "numberline" for inequalities / absolute-value solution sets:
   {min, max, op ("<", ">", "≤" or "≥"), value (the boundary), closed (true for ≤/≥ — a filled dot;
   false for </> — an open dot)}. Reveal it with the id "nl" on the final step.
4. narration_steps: "reveal"/"active"/"point" use the LINE ids (and "nl" if a numberline exists).
   Reveal one line per step in order. 3–10 steps, last recaps.
5. Narration is SPOKEN: "two x squared minus four x minus three equals zero", never the symbols.
   Say WHY each move is legal (both sides stay balanced) and bust the topic's misconception — above
   all, that multiplying or dividing an inequality by a NEGATIVE flips the sign, because it reverses
   which number is bigger.
Return ONLY valid minified JSON:
{"meta":{"title":"","subject":"","concept_id":"snake_case_id"},"layout":"solve","problem":"","lines":[{"id":"l1","math":"","why":""}],"numberline":{"min":-6,"max":2,"op":"≤","value":-2,"closed":true},"narration_steps":[{"short":"","term":"","narration_text":"","reveal":["l1"],"active":["l1"],"point":"l1"}]}

═══════ MODE "vectors" (arrows on a grid — tip-to-tail addition) ═══════
Rules:
1. "a" and "b": two-number arrays [across, up]. Keep components small (within ±6 across, ±4 up) and
   make sure the resultant a + b also fits.
2. narration_steps use ONLY these part names: "a", "b", "comp" (dashed component lines under a),
   "shift" (b slid to the tip of a), "res" (the resultant). Reveal at least "a", "shift" and "res".
   3–8 steps, last recaps.
3. TEACH: a vector is size AND direction, so sliding it changes nothing — which is exactly why the
   components simply add. Say the numbers in words.
Return ONLY valid minified JSON:
{"meta":{"title":"","subject":"","concept_id":"snake_case_id"},"layout":"vectors","a":[3,1],"b":[1,2],"narration_steps":[{"short":"","term":"","narration_text":"","reveal":["a"],"active":["a"],"point":"a"}]}

═══════ MODE "matrix" (a 2×2 matrix as a transformation of the plane) ═══════
Rules:
1. "M": [[a,b],[c,d]] — keep every entry within ±4 so the transformed square stays on screen.
2. narration_steps use ONLY these part names: "orig" (the unit square with i and j), "ti" (where i
   lands = column 1), "tj" (where j lands = column 2), "det" (the parallelogram + its area), "M"
   (the matrix caption). Reveal at least "orig", "ti" and "tj". 3–8 steps, last recaps.
3. TEACH: the COLUMNS are the new homes of the basis vectors, and the determinant is the AREA SCALE
   FACTOR (zero means space is flattened, so there is no inverse; negative means space was flipped).
   Say "determinant", "two by two", "i and j" in spoken words.
Return ONLY valid minified JSON:
{"meta":{"title":"","subject":"","concept_id":"snake_case_id"},"layout":"matrix","M":[[2,1],[0,1.5]],"narration_steps":[{"short":"","term":"","narration_text":"","reveal":["orig"],"active":["orig"],"point":"orig"}]}

═══════ MODE "fbd" (FREE-BODY DIAGRAM — the forces on one body) ═══════
Rules:
1. "incline": the slope angle in DEGREES, 0 for a flat surface, up to 60. The renderer draws the
   scene on the left with the slope DESCENDING TO THE RIGHT, and the isolated body on the right.
2. DIRECTIONS ARE COMPASS-FREE DEGREES measured anticlockwise from "pointing right": 0 = right,
   90 = straight up, 180 = left, 270 = straight down. On a slope of angle θ:
     down the slope   = 360 − θ        up the slope       = 180 − θ
     into the surface = 270 − θ        away from it (the NORMAL) = 90 − θ
3. "forces": 2–6 arrows, each {id (short, e.g. "w","n","f"), label (the name AND the number with its
   unit, e.g. "Weight  mg = 39 N"), agent (WHO exerts it — MUST begin with "by", e.g. "by the
   Earth", "by the rope", "by the surface"), dir (degrees as above), mag (arrow length, 0.2–1.2,
   proportional to the size of the force), kind (weight|normal|friction|tension|applied|other)}.
   • EVERY arrow names its agent. If you cannot name the object exerting it, IT IS NOT A FORCE —
     that kills "the force of motion", impetus and centrifugal force at a stroke.
   • The weight points straight down (dir 270) ALWAYS. The normal is perpendicular to the surface
     (dir 90 − θ) and is NOT equal to mg on a slope — work out the number and print it.
   • Friction runs ALONG the surface (dir 360 − θ or 180 − θ), never into it.
   • NEVER add a "centripetal force" arrow — label the real arrow (tension, gravity, friction) and
     say in the narration that this inward force IS the centripetal force.
4. OPTIONAL "components": [{dir, mag, label}] — the dashed split of the weight on the rotated axes
   ("mg sin θ = 18 N" down the slope, "mg cos θ = 35 N" into the surface). Revealed with the id "comp".
5. OPTIONAL "net": {dir, mag, label} — the vector sum, a thick hollow arrow, always drawn LAST.
   OPTIONAL "accel": {dir, label} — drawn in its own teal box, dashed, open head, OUTSIDE the force
   cluster, because ACCELERATION IS NOT A FORCE and must never be summed with them.
   OPTIONAL "danger": {dir, label} — the WRONG arrow, drawn and struck through (the phantom forward
   force, the centrifugal arrow). Every physics video should have one.
   OPTIONAL "friction_gauge": {fs, fsmax, label} — a bar showing the static friction sitting BELOW
   its cap μ_s N, because students think it is always at maximum.
   OPTIONAL "body": {label, mass} and "scene_note" (one short line under the scene).
6. narration_steps: "reveal"/"active"/"point" use the FORCE IDS plus these fixed parts: "body"
   (plays the isolate-the-body beat), "axes", "comp", "net", "accel", "danger", "gauge". Reveal
   "body" first, then ONE force per step naming its agent aloud, then resolve, then sum. 4–9 steps.
7. SPOKEN narration: name the agent BEFORE the force ("the rope pulls up on the block"), say the
   DIRECTION of every vector every time, always say "the NET force", and say the misconception out
   loud before demolishing it.
Return ONLY valid minified JSON:
{"meta":{"title":"","subject":"","concept_id":"snake_case_id"},"layout":"fbd","incline":0,"body":{"label":"","mass":""},"scene_note":"","forces":[{"id":"w","label":"Weight  mg = 39 N","agent":"by the Earth","dir":270,"mag":1,"kind":"weight"}],"components":[],"net":{"dir":0,"mag":0.4,"label":""},"accel":{"dir":0,"label":""},"danger":{"dir":0,"label":""},"friction_gauge":{"fs":0,"fsmax":1,"label":""},"narration_steps":[{"short":"","term":"","narration_text":"","reveal":["body","w"],"active":["w"],"point":"w"}]}

═══════ MODE "circuit" (DC CIRCUIT SCHEMATIC — a loop, conserved charge, a voltage ladder) ═══════
Rules:
1. "battery": {label, e.g. "6 V battery"} — it always sits on the LEFT rail, so no component may use
   the left side. "current": {direction ("cw" or "ccw"), label — say the value AND that it is the
   same everywhere, e.g. "I = 0.5 A — identical at every point"}.
2. "components": 1–6, each {id, type (resistor|bulb|switch|ammeter|voltmeter|capacitor|junction),
   side ("top", "right" or "bottom"), label (the component AND its value/reading, with units)}.
   Extras: a bulb may carry "brightness" 0–1; a switch "open": true/false; a VOLTMETER must carry
   "across": the id of the component it measures (it is then drawn on a branch beside it, never in
   the loop) and no side. An AMMETER goes in the loop and must NOT have "across".
3. OPTIONAL "ladder": the voltage ladder — the potential drawn as HEIGHT, walked round the loop in
   order: [{v: +6, label: "+6 V battery"}, {v: −4, label: "−4 V  R₁"}, …]. THE RISES MUST EQUAL THE
   DROPS — the entries must sum to zero, because the charge ends back where it started. This single
   overlay is the best cure there is for confusing current with voltage. Revealed with the id "ladder".
   OPTIONAL "note": one short line under the diagram.
4. narration_steps: "reveal"/"active"/"point" use the COMPONENT IDS plus these fixed parts: "loop",
   "battery", "current", "ladder". Reveal "loop" and "battery" first. 4–9 steps, last recaps.
5. TEACH THE MISCONCEPTIONS, out loud: the current is NOT used up — the same charge per second
   passes every point and returns to the battery; what is delivered is ENERGY, not charge. Never say
   "the current is used up". Say "the charge comes back with the same charge but less energy."
   Say "amps", "volts" and "ohms" in words, never the symbols.
Return ONLY valid minified JSON:
{"meta":{"title":"","subject":"","concept_id":"snake_case_id"},"layout":"circuit","battery":{"label":"6 V battery"},"current":{"direction":"cw","label":""},"components":[{"id":"r1","type":"resistor","side":"top","label":"R₁ = 8 Ω"}],"ladder":[{"v":6,"label":""},{"v":-6,"label":""}],"note":"","narration_steps":[{"short":"","term":"","narration_text":"","reveal":["loop","battery"],"active":["battery"],"point":"battery"}]}

═══════ MODE "logic" (LOGIC-GATE SCHEMATIC — signal colour propagating through gates) ═══════
Rules:
1. "inputs": 1–4 pins, each {id, label ("A", "B", "Cin"), value: 0 or 1}. The value is the STARTING
   bit; it must be a real 0 or 1, never blank. Every input must be wired to something.
2. "gates": 1–8, each {id, type (AND|OR|NOT|NAND|NOR|XOR|XNOR|BUF), in: [ids], label}. The "in" ids
   are input ids or OTHER GATE ids — that is how you build depth. NOT and BUF take exactly ONE
   input; every other gate takes 2 or 3. NO CYCLES — this is combinational logic. The label should
   be the sub-expression that gate computes ("A ⊕ B", "A · B"), because it is printed under the gate.
   YOU DO NOT POSITION ANYTHING: the renderer derives each gate's column from its depth and wires it.
3. "outputs": 1–3, each {id, from: <gate or input id>, label}. The label must say what the bit MEANS
   ("SUM", "CARRY", "alarm sounds"), never a bare letter. Every gate must drive another gate or an
   output — a floating wire is rejected.
4. OPTIONAL "truth_table": {inputs: [column names, SAME ORDER as your input pins], outputs: [column
   names, each matching an output's label or id], rows: [[0,0,0,0], …], caption}. It must have
   EXACTLY 2ⁿ rows for n inputs, in counting order, and every row MUST agree with the circuit you
   drew — the server simulates your gates and rejects the blueprint if a single cell disagrees.
   Enumerating only the interesting rows is the classic student error; do not model it.
5. OPTIONAL "expression" — ONE Boolean expression printed on a rail under the schematic (revealed
   with the id "expr"). OPTIONAL "note", one short line.
6. narration_steps: "reveal"/"active"/"point" use the INPUT, GATE and OUTPUT ids plus the fixed parts
   "table" and "expr". A step may also carry "inputs": [0,1,…] to RE-DRIVE the input pins for that
   beat (this is how you walk the combinations — change ONE bit at a time so the consequence is
   unambiguous) and "row": <index> to highlight the matching truth-table row. 4–9 steps.
7. TEACH THE MISCONCEPTIONS, out loud: the bubble is a NOT you can MOVE, which is what De Morgan's
   law says — break the bar AND flip the operator, never just one. XOR is "one or the other but not
   both", unlike everyday English "or". AND binds tighter than OR. Boolean plus is not arithmetic
   plus: 1 + 1 = 1 in Boolean. Say the gate names aloud ("a NAND gate"), and say "the output goes
   HIGH" / "goes LOW" as well as "1" and "0".
Return ONLY valid minified JSON:
{"meta":{"title":"","subject":"","concept_id":"snake_case_id"},"layout":"logic","inputs":[{"id":"a","label":"A","value":1},{"id":"b","label":"B","value":0}],"gates":[{"id":"g1","type":"XOR","in":["a","b"],"label":"A ⊕ B"}],"outputs":[{"id":"s","from":"g1","label":"SUM"}],"expression":"","truth_table":{"inputs":["A","B"],"outputs":["SUM"],"rows":[[0,0,0],[0,1,1],[1,0,1],[1,1,0]],"caption":""},"note":"","narration_steps":[{"short":"","term":"","narration_text":"","reveal":["a","b"],"active":["a"],"inputs":[1,0],"row":2,"point":"a"}]}

═══════ MODE "table" (a GRID built one row per beat — truth tables, comparisons, trace tables) ═══════
Rules:
1. "columns": 2–8, each {id, label, group}. "group" is optional and tints the column: "in" (the
   givens / inputs, lilac), "out" (the result, teal), "danger" (the trap, red). Use it — showing
   which columns are cause and which are effect is half the teaching.
2. "rows": 2–12, each {id, cells: [one string per column], note}. "note" is an optional short line
   printed in the right-hand gutter beside that row ("1 + 1 = 10 ← the carry"), and it is where the
   real teaching goes. Cells are short — a table is not a paragraph.
3. OPTIONAL "caption" (one line above the grid), "note" (one line below), and "mono": true to set the
   cells in a monospace face (do this for bit patterns, so the columns line up).
4. narration_steps: "reveal"/"active"/"point" use the ROW ids and COLUMN ids plus the fixed parts
   "head" and "caption". Reveal "head" FIRST — the headings must go up before any number means
   anything — then ONE row (or a small group) per beat. Activating a row spotlights it. 4–10 steps.
5. TEACH THE PATTERN, not just the contents: for a truth table say the counting pattern out loud
   (the right-hand input column alternates every row, the next every two rows) and say WHY there are
   exactly 2ⁿ rows and why stopping early is a guess rather than a proof. For a comparison, say what
   the single deciding difference is before listing the details.
Return ONLY valid minified JSON:
{"meta":{"title":"","subject":"","concept_id":"snake_case_id"},"layout":"table","caption":"","mono":false,"columns":[{"id":"c1","label":"","group":"in"},{"id":"c2","label":"","group":"out"}],"rows":[{"id":"r0","cells":["",""],"note":""}],"note":"","narration_steps":[{"short":"","term":"","narration_text":"","reveal":["head"],"active":["head"],"point":"head"}]}`
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
             "So you evaluate the antiderivative at both limits and subtract."]} },
  /* ── MATHS 15: unit circle — where sine and cosine come from ── */
  { text: "On the unit circle, sine is the y-coordinate and cosine is the x-coordinate of the point at angle θ.",
    blueprint: {meta:{title:"The unit circle — where sine and cosine come from",subject:"Trigonometry",concept_id:"unit_circle_sin_cos"},layout:"unitcircle",angle:52,
      narration_steps:[
        {short:"Circle",term:"unit circle",narration_text:"This circle has a radius of exactly one, which is why we call it the unit circle. Any point on it is pinned down by a single angle, theta, measured round from the positive x-axis.",reveal:["circle"],active:["circle"],point:"circle",
         def:"The unit circle is a circle of radius one centred on the origin — the home diagram of all trigonometry."},
        {short:"Radius",term:"the point P",narration_text:"Draw the radius out at the angle theta, and it meets the circle at a point we will call P. Everything else on this diagram is just a fact about where P sits.",reveal:["radius"],active:["radius"],point:"radius"},
        {short:"Sine",term:"sine",narration_text:"Drop straight down from P to the x-axis. That height, the y-coordinate of P, IS the sine of theta — so sine is simply how high the point is, not something that only lives inside a right-angled triangle.",reveal:["sin"],active:["sin"],point:"sin",
         def:"Sine of theta = the height (y-coordinate) of the point on the unit circle at angle theta.",
         quiz:{q:"Why is the sine of an angle never bigger than one?",options:["The point sits on a circle of radius one, so its height can never exceed one","Because angles are measured in degrees","Because sine is always positive"],answer:0,why:"The height of a point on a circle of radius one is at most one, so sine is trapped between minus one and one."}},
        {short:"Cosine",term:"cosine",narration_text:"The distance across along the x-axis, the x-coordinate of P, is the cosine of theta. So cosine is how far across the point is, and sine is how far up — that is the whole definition.",reveal:["cos"],active:["cos"],point:"cos"},
        {short:"Signs",term:"quadrants",narration_text:"Now you can read the signs straight off the picture instead of memorising a rule: in the second quadrant the point is left of centre but still above the axis, so cosine is negative while sine stays positive.",reveal:["quadrants"],active:["quadrants"],point:"quadrants",
         def:"The sign of sine and cosine is just the sign of the point's height and its across-distance."},
        {short:"Identity",term:"the identity",narration_text:"Because the radius is one, Pythagoras on this little triangle gives cosine squared plus sine squared equals one. The famous identity is not magic — it is the circle's radius written in algebra.",reveal:["identity"],active:["identity"],point:"identity",
         quiz:{q:"Where does cos²θ + sin²θ = 1 come from?",options:["Pythagoras on the triangle whose hypotenuse is the radius of length one","A definition you have to memorise","The fact that sine and cosine are waves"],answer:0,why:"Across-squared plus up-squared equals radius-squared, and the radius is one."}}],
      recap:["Sine is the HEIGHT of the point; cosine is how far ACROSS it is.",
             "The signs in each quadrant are just the signs of those two coordinates.",
             "cos²θ + sin²θ = 1 is Pythagoras with a hypotenuse of one."]} },
  /* ── MATHS 16: solve — completing the square, line by line with the reason for every move ── */
  { text: "Solve 2x² − 4x − 3 = 0 by completing the square.",
    blueprint: {meta:{title:"Completing the square",subject:"Algebra",concept_id:"completing_the_square"},layout:"solve",problem:"Solve  2x² − 4x − 3 = 0  by completing the square",
      lines:[{id:"l1",math:"2x² − 4x − 3 = 0",why:"the equation to solve"},
             {id:"l2",math:"x² − 2x − 3/2 = 0",why:"divide every term by 2"},
             {id:"l3",math:"x² − 2x = 3/2",why:"move the constant right"},
             {id:"l4",math:"x² − 2x + 1 = 3/2 + 1",why:"add (half of −2)² = 1 to both sides"},
             {id:"l5",math:"(x − 1)² = 5/2",why:"the left is a perfect square"},
             {id:"l6",math:"x − 1 = ± √(5/2)",why:"square-root both sides — keep ±"},
             {id:"l7",math:"x = 1 ± √(5/2) ≈ 2.58 or −0.58",why:"add 1 — two solutions"}],
      narration_steps:[
        {short:"Start",term:"complete the square",narration_text:"We want to solve two x squared minus four x minus three equals zero. It does not factorise nicely, so we reshape it into something that does — that is what completing the square means.",reveal:["l1"],active:["l1"],point:"l1"},
        {short:"Divide",term:"coefficient of one",narration_text:"First divide every term by two, so that x squared has a coefficient of one. The trick only works in that form, because a perfect square always starts with a plain x squared.",reveal:["l2"],active:["l2"],point:"l2"},
        {short:"Move",term:"isolate",narration_text:"Now move the constant to the right-hand side, leaving x squared minus two x on its own. We are clearing space for the piece we are about to add.",reveal:["l3"],active:["l3"],point:"l3"},
        {short:"Half & square",term:"the key move",narration_text:"Here is the key move: take half of the x-coefficient — half of minus two is minus one — then square it to get one, and add that one to BOTH sides. Half-then-square is exactly the number that completes a perfect square.",reveal:["l4"],active:["l4"],point:"l4",
         def:"Half-then-square: for x² + bx, the number that completes the square is always b over two, all squared.",
         quiz:{q:"Why must the 1 be added to BOTH sides?",options:["Adding to only one side would change the equation","Because 1 is a perfect square","To make the right-hand side positive"],answer:0,why:"An equation is a balance: whatever you do to one side you must do to the other, or the solutions change."}},
        {short:"Factor",term:"perfect square",narration_text:"Now the left-hand side folds up into x minus one, all squared — and notice that the minus one is exactly the half we took a moment ago. That is the payoff for the whole manoeuvre.",reveal:["l5"],active:["l5"],point:"l5"},
        {short:"Root",term:"plus or minus",narration_text:"Square-root both sides. Because a positive and a negative number both square to the same result, we must write plus or minus — forgetting it is how students lose a whole solution.",reveal:["l6"],active:["l6"],point:"l6",
         quiz:{q:"Why does the ± appear when you take the square root?",options:["Two numbers square to the same value, one positive and one negative","Because the equation was quadratic to begin with","Because the right-hand side is a fraction"],answer:0,why:"Both plus and minus root five over two square to five over two, so both are genuine solutions."}},
        {short:"Solve",term:"two solutions",narration_text:"Finally add one to both sides. So x is one plus or minus the square root of five over two, which is about two point five eight or minus nought point five eight — two solutions, exactly, and no formula was memorised.",reveal:["l7"],active:["l7"],point:"l7"}],
      recap:["Divide through first so x² has a coefficient of one.",
             "Half the x-coefficient, square it, and add it to BOTH sides.",
             "Square-rooting always gives ±, which is why a quadratic has two solutions."]} },
  /* ── MATHS 17: solve + number line — the inequality flip ── */
  { text: "Solve the inequality −3x + 1 ≥ 7 and show the solution set.",
    blueprint: {meta:{title:"Solving an inequality — and the flip",subject:"Algebra",concept_id:"inequality_negative_flip"},layout:"solve",problem:"Solve  −3x + 1 ≥ 7",
      lines:[{id:"l1",math:"−3x + 1 ≥ 7",why:"the inequality"},
             {id:"l2",math:"−3x ≥ 6",why:"subtract 1 from both sides"},
             {id:"l3",math:"x ≤ −2",why:"÷ by −3 → flip the sign"}],
      numberline:{min:-6,max:2,op:"≤",value:-2,closed:true},
      narration_steps:[
        {short:"Start",term:"inequality",narration_text:"Solve negative three x plus one is greater than or equal to seven. An inequality is solved just like an equation — you isolate x — but there is one twist waiting at the end.",reveal:["l1"],active:["l1"],point:"l1"},
        {short:"Subtract",term:"a safe move",narration_text:"Subtract one from both sides. Adding or subtracting is completely safe, because shifting both sides along the number line does not change which one is bigger, so we get negative three x greater than or equal to six.",reveal:["l2"],active:["l2"],point:"l2"},
        {short:"The flip",term:"flip the sign",narration_text:"Now divide by negative three, and here is the trap: multiplying or dividing by a negative number swaps which side is bigger, so the sign must FLIP. Greater-than-or-equal becomes less-than-or-equal, and x is less than or equal to minus two.",reveal:["l3"],active:["l3"],point:"l3",
         def:"Multiplying by a negative reflects both numbers through zero, which reverses their order.",
         quiz:{q:"Why does the inequality sign flip when you divide by a negative?",options:["Multiplying by a negative reverses the order of the two numbers","Because the answer is negative","Because you divided rather than subtracted"],answer:0,why:"Two is less than five, but minus two is GREATER than minus five — the order reverses."}},
        {short:"Answer",term:"the solution set",narration_text:"On the number line the answer is everything from minus two leftwards, and the dot is filled in because minus two itself satisfies the inequality. Check it: three times minus two is minus six, plus one is minus five... so always test one value to be sure the flip went the right way.",reveal:["nl"],active:["l3"],point:"nl"}],
      recap:["Adding and subtracting never change an inequality sign.",
             "Multiplying or dividing by a NEGATIVE flips the sign.",
             "A filled dot means the endpoint is included; an open dot means it is not."]} },
  /* ── MATHS 18: vectors — tip to tail ── */
  { text: "How do you add two vectors, and why can you just add their components?",
    blueprint: {meta:{title:"Adding vectors — tip to tail",subject:"Vectors",concept_id:"vector_addition_tip_to_tail"},layout:"vectors",a:[3,1],b:[1,2],
      narration_steps:[
        {short:"Vector a",term:"vector",narration_text:"A vector carries both a size and a direction, which is why we draw it as an arrow rather than write it as a single number. Here is vector a: three across and one up.",reveal:["a"],active:["a"],point:"a",
         def:"A vector has magnitude AND direction; a scalar has only size."},
        {short:"Components",term:"components",narration_text:"Those two numbers are its components — how far it travels across and how far it travels up. Break any arrow into an across-part and an up-part and it becomes arithmetic.",reveal:["a","comp"],active:["comp"],point:"comp"},
        {short:"Vector b",term:"the second vector",narration_text:"Here is vector b: one across and two up. To add them we do not simply join the two arrows where they happen to sit — we use tip to tail.",reveal:["a","b"],active:["b"],point:"b"},
        {short:"Tip to tail",term:"slide it over",narration_text:"Pick up vector b and slide it across, keeping its length and direction exactly, until its tail sits on the tip of a. Sliding a vector never changes it, because only size and direction define it — not where it is drawn.",reveal:["a","shift"],active:["shift"],point:"shift",
         quiz:{q:"Why are we allowed to slide vector b across the page?",options:["A vector is defined only by size and direction, not by its position","Because the grid squares are equal","Because b is shorter than a"],answer:0,why:"Moving an arrow without turning or stretching it leaves both its magnitude and its direction untouched."}},
        {short:"Resultant",term:"the resultant",narration_text:"The sum, a plus b, is the single arrow from the start of a to the new tip of b — four across and three up. That is exactly why you can just add the components: three plus one across, and one plus two up.",reveal:["a","shift","res"],active:["res"],point:"res",
         def:"The resultant is the one arrow that does the job of both."}],
      recap:["A vector is size plus direction — sliding it changes nothing.",
             "Add tip to tail; the resultant runs from the first tail to the last tip.",
             "Which is why components simply add: across with across, up with up."]} },
  /* ── MATHS 19: matrix — a matrix is a transformation, the determinant is an area scale factor ── */
  { text: "What does a matrix actually do to space, and what does its determinant mean?",
    blueprint: {meta:{title:"A matrix is a transformation of space",subject:"Matrices",concept_id:"matrix_transformation_determinant"},layout:"matrix",M:[[2,1],[0,1.5]],
      narration_steps:[
        {short:"The basis",term:"basis vectors",narration_text:"Start with the unit square and its two basis arrows: i pointing one step right, and j pointing one step up. Every point in the plane is built from those two, so a matrix's whole job is to say where they go.",reveal:["orig"],active:["orig"],point:"orig",
         def:"The basis vectors i and j are the two unit steps from which every other vector is assembled."},
        {short:"Where i goes",term:"first column",narration_text:"The first column of the matrix tells i where to land — here at two across and zero up. That is the single most useful fact about matrices: the columns are simply the new homes of the basis vectors.",reveal:["orig","ti"],active:["ti"],point:"ti",
         quiz:{q:"What do the COLUMNS of a 2×2 matrix tell you?",options:["Where the basis vectors i and j end up after the transformation","The solutions of a system of equations","The rows read sideways"],answer:0,why:"Column one is the image of i and column two is the image of j — everything else follows."}},
        {short:"Where j goes",term:"second column",narration_text:"The second column sends j to one across and one and a half up. Every other point of the plane is dragged along with them, which is why the grid lines stay straight and evenly spaced.",reveal:["orig","ti","tj"],active:["tj"],point:"tj"},
        {short:"Determinant",term:"the determinant",narration_text:"The unit square had an area of one, and it has been stretched into this parallelogram. Its new area is exactly the determinant — here, three — so the determinant is simply how much the transformation scales area.",reveal:["ti","tj","det"],active:["det"],point:"det",
         def:"The determinant is the area scale factor; a negative one means space has also been flipped over.",
         quiz:{q:"What does a determinant of zero tell you?",options:["The transformation squashes the square flat, so it cannot be undone","The matrix is the identity","The transformation is a pure rotation"],answer:0,why:"Zero area means the plane has collapsed onto a line, and no inverse can un-squash it."}},
        {short:"Recap",term:"recap",narration_text:"Recap: read the columns as the new homes of i and j, and read the determinant as the area scale factor — and because doing two transformations in a different order lands the arrows somewhere else, matrix multiplication is not commutative.",reveal:["ti","tj","det"],active:["det"],point:"det"}],
      recap:["The columns of a matrix are where i and j land.",
             "The determinant is the area scale factor of the transformation.",
             "Determinant zero means the space is flattened — no inverse exists."]} },
  /* ── PHYSICS 20: fbd — the flagship. Built against the INCLINE first, because it forces axis
     rotation, component splitting and a normal force that is NOT mg — three misconceptions at once. */
  { text: "A 4 kg block is released on a rough slope inclined at 28°. Draw the free-body diagram and find its acceleration.",
    blueprint: {meta:{title:"Forces on a block on a 28° incline",subject:"Physics",concept_id:"fbd_block_on_incline"},layout:"fbd",incline:28,
      body:{label:"4 kg block",mass:"m = 4 kg"},scene_note:"released from rest — it slides down the slope",
      forces:[
        {id:"w",label:"Weight  mg = 39 N",agent:"by the Earth",dir:270,mag:1,kind:"weight"},
        {id:"n",label:"Normal  N = 35 N",agent:"by the surface",dir:62,mag:0.85,kind:"normal"},
        {id:"f",label:"Friction  f = 7 N",agent:"by the surface",dir:152,mag:0.35,kind:"friction"}],
      components:[{dir:242,mag:0.85,label:"mg cos θ = 35 N"},{dir:332,mag:0.5,label:"mg sin θ = 18 N"}],
      net:{dir:332,mag:0.32,label:"F_net = 11 N down the slope"},
      accel:{dir:332,label:"a = 2.8 m/s² down the slope"},
      danger:{dir:332,label:"there is no “force of motion”"},
      friction_gauge:{fs:7,fsmax:12,label:"f = 7 N"},
      narration_steps:[
        {short:"Isolate",term:"the system",narration_text:"Before any equation, lift the block out of the picture. Everything else — the slope, the ground, the room — goes away, and we ask one question: what is touching this block, and what is pulling on it from a distance?",reveal:["body"],active:["body"],point:"body",
         def:"A free-body diagram shows one chosen object and only the forces acting ON it.",
         quiz:{q:"Why do we remove the slope from the diagram?",options:["Because we only draw forces ON the block, and the slope is a different object","Because the slope has no mass","Because the block is heavier than the slope"],answer:0,why:"Anything the slope experiences belongs on the slope's diagram, not the block's."}},
        {short:"Weight",term:"weight",narration_text:"The Earth pulls the block straight down with thirty-nine newtons. Notice the direction: straight down, not into the slope. Gravity has never heard of the slope.",reveal:["w"],active:["w"],point:"w",
         def:"Weight is the pull of the Earth on the mass — always vertically downward, whatever the surface is doing."},
        {short:"Normal",term:"the normal force",narration_text:"The surface pushes back, perpendicular to itself — that is what “normal” means here. And this is the trap: it is thirty-five newtons, not thirty-nine, because it only has to balance the part of the weight pressing into the slope.",reveal:["n"],active:["n"],point:"n",
         quiz:{q:"On a slope, is the normal force equal to the weight?",options:["No — it only balances the part of the weight perpendicular to the surface","Yes, they are always an action–reaction pair","Yes, both equal mg"],answer:0,why:"N equals mg only on the flat. Tilt the surface and N falls to mg cos θ."}},
        {short:"Friction",term:"friction",narration_text:"The surface also grips, along its own face, seven newtons up the slope — opposing the sliding, not the block. Name the agent out loud each time: the surface pushes, the Earth pulls.",reveal:["f"],active:["f"],point:"f",
         def:"Friction acts along the contact surface and opposes relative sliding, not motion in general."},
        {short:"Resolve",term:"resolving",narration_text:"Now turn the axes to lie along the slope, and watch the weight split into two: thirty-five newtons pressing into the surface, and eighteen newtons dragging down the slope. Nothing new has been added — the same one arrow, measured two ways.",reveal:["axes","comp"],active:["comp"],point:"comp",
         def:"Resolving replaces one arrow with two perpendicular ones that add back to it exactly."},
        {short:"Net force",term:"the net force",narration_text:"Along the slope, eighteen newtons down and seven newtons up leaves eleven newtons down the slope. That is the NET force — never call it just “the force”, because no single arrow on this diagram is eleven newtons.",reveal:["net"],active:["net"],point:"net",
         quiz:{q:"Which arrow on the diagram is the net force?",options:["None of them — it is what is left after the arrows are added","The weight","The biggest one"],answer:0,why:"The net force is the sum of every arrow, so it usually matches none of them."}},
        {short:"Acceleration",term:"F = ma",narration_text:"Eleven newtons on four kilograms gives two point eight metres per second squared, down the slope. It is drawn over here, dashed and in a different colour, because acceleration is a RESULT of the forces — never one of them, and never added to them.",reveal:["accel"],active:["accel"],point:"accel",
         def:"F_net = ma: the arrows cause the acceleration; the acceleration is not itself an arrow on the body."},
        {short:"The trap",term:"impetus",narration_text:"You might think a moving block needs a forward push to keep it going. Watch — that arrow has no agent. Nothing is touching the block in that direction, so it does not exist. And notice the friction sits below its cap, because static friction is only ever as big as it needs to be.",reveal:["danger","gauge"],active:["danger"],point:"danger",
         quiz:{q:"What kills the phantom “force of motion” arrow?",options:["No object exerts it — you cannot name the agent","It is too small to matter","It cancels the normal force"],answer:0,why:"Every real force is a push or pull BY something. If you cannot name that something, there is no arrow."}},
        {short:"Recap",term:"recap",narration_text:"Recap: isolate the body, draw one arrow per agent, turn the axes to the slope, split the weight, add them up, and let the net force give the acceleration — which is never an arrow on the body.",reveal:["net","accel"],active:["net"],point:"net"}],
      recap:["Every arrow names the object exerting it — no agent, no force.",
             "On a slope the normal force is mg cos θ, NOT the weight.",
             "Acceleration is the result of the net force, never a force itself."]} },
  /* ── PHYSICS 21: circuit — conserved charge and the voltage ladder, aimed straight at the most
     common misconception in all of physics education: that the current gets used up. ── */
  { text: "In a simple series circuit with a 6 V battery, an 8 Ω resistor and a lamp, is the current smaller after the resistor than before it?",
    blueprint: {meta:{title:"A series circuit — the current is the same everywhere",subject:"Physics",concept_id:"series_current_conserved"},layout:"circuit",
      battery:{label:"6 V battery"},
      current:{direction:"cw",label:"I = 0.5 A — identical at every point in the loop"},
      components:[
        {id:"r1",type:"resistor",side:"top",label:"R₁ = 8 Ω"},
        {id:"b1",type:"bulb",side:"right",label:"lamp, 4 Ω",brightness:0.9},
        {id:"a1",type:"ammeter",side:"bottom",label:"A reads 0.5 A"},
        {id:"sw",type:"switch",side:"bottom",label:"switch (closed)",open:false},
        {id:"v1",type:"voltmeter",across:"r1",label:"V reads 4 V"}],
      ladder:[{v:6,label:"+6 V battery"},{v:-4,label:"−4 V  R₁"},{v:-2,label:"−2 V  lamp"}],
      note:"the charge comes back with the same charge, but less energy",
      narration_steps:[
        {short:"The loop",term:"a complete circuit",narration_text:"A circuit has to be a closed loop, because charge has nowhere else to go. The battery does not make charge — the charge is already in the wire; the battery pushes it round.",reveal:["loop","battery"],active:["battery"],point:"battery",
         def:"The battery supplies energy per unit charge — that is what its voltage, in volts, means."},
        {short:"Components",term:"in series",narration_text:"Everything sits on one single path: an eight ohm resistor, a lamp, a switch and an ammeter. One path means there is nowhere for the charge to divide.",reveal:["r1","b1","sw","a1"],active:["r1"],point:"r1",
         def:"In series there is exactly one route round the loop, so every component carries the same current."},
        {short:"Same everywhere",term:"conservation of charge",narration_text:"Watch the charges move. Count them past the resistor, past the lamp, past the ammeter — nought point five amps at every point. The same number arrives back at the battery as left it.",reveal:["current"],active:["current"],point:"current",
         quiz:{q:"Is the current smaller after the lamp than before it?",options:["No — it is identical, because charge cannot pile up or vanish","Yes, the lamp uses some of it up","Yes, half of it is converted to light"],answer:0,why:"Charge is conserved. What the lamp takes is energy, not charge."}},
        {short:"Energy, not charge",term:"potential difference",narration_text:"So what does the lamp actually take? Look at the ladder: the battery lifts each charge six volts, the resistor drops it four, the lamp drops it two — and it lands back where it started. The charge returns; the ENERGY is delivered.",reveal:["v1","ladder"],active:["ladder"],point:"ladder",
         def:"Potential difference is the energy given up per unit charge as it passes through a component.",
         quiz:{q:"Why must the rises and drops on the ladder add to zero?",options:["The charge ends up back at the same point, so it must be back at the same potential","Because the resistances are equal","Because the current is constant"],answer:0,why:"That is Kirchhoff's loop rule — it is just energy conservation drawn as height."}},
        {short:"Meters",term:"meter placement",narration_text:"Notice where the meters sit. The ammeter is IN the loop, because it counts the charge going past it. The voltmeter is ACROSS the resistor, because it compares two heights on the ladder — reading four volts.",reveal:["a1","v1"],active:["v1"],point:"v1",
         quiz:{q:"Where does a voltmeter go?",options:["Across a component, in parallel with it","In the loop, in series","It does not matter"],answer:0,why:"Voltage is a difference between two points, so the meter must touch both."}},
        {short:"Recap",term:"recap",narration_text:"Recap: one loop means one current, the same at every point; the battery raises the potential and each component lowers it; and going right round, the rises equal the drops.",reveal:["current","ladder"],active:["current"],point:"current"}],
      recap:["In a series loop the current is identical at every point.",
             "The charge comes back — what is delivered is energy.",
             "Round any loop, the voltage rises equal the voltage drops."]} },

  /* ── COMPUTER STUDIES 22: logic — the half-adder. The gate schematic and the truth table are the
     SAME OBJECT, and the video is built so the student watches one become the other. The steps walk
     the input combinations one bit at a time, which is the whole point of the mode. ── */
  { text: "A half-adder adds two single bits A and B. The SUM output is A XOR B and the CARRY output is A AND B.",
    blueprint: {meta:{title:"The half-adder — one XOR for the sum, one AND for the carry",subject:"Computer Studies",concept_id:"half_adder_xor_and"},layout:"logic",
      inputs:[{id:"a",label:"A",value:0},{id:"b",label:"B",value:0}],
      gates:[{id:"gx",type:"XOR",in:["a","b"],label:"A ⊕ B"},{id:"gn",type:"AND",in:["a","b"],label:"A · B"}],
      outputs:[{id:"s",from:"gx",label:"SUM"},{id:"c",from:"gn",label:"CARRY"}],
      expression:"SUM = A ⊕ B , CARRY = A · B",
      truth_table:{inputs:["A","B"],outputs:["SUM","CARRY"],rows:[[0,0,0,0],[0,1,1,0],[1,0,1,0],[1,1,0,1]],caption:"four input combinations, four rows — none missed"},
      note:"Two bits in, two bits out: the sum bit and the carry bit.",
      narration_steps:[
        {short:"Two bits in",term:"input pin",narration_text:"Start with what you are given. These two boxes are input pins, and each one is holding a single bit — right now both are holding zero. A bit is not a number you calculate with yet; it is just a wire that is either off or on. Watch the colour: blue means zero, red means one.",reveal:["a","b"],active:["a"],point:"a",inputs:[0,0],
         def:"An input pin is a wire whose value is given to the circuit from outside."},
        {short:"Zero plus zero",term:"XOR gate",narration_text:"Now the first gate. This curved one with the extra bar is an exclusive-OR, which outputs one when its inputs are DIFFERENT and zero when they are the same. Both inputs are zero, so they are the same, so the sum bit is zero. Zero plus zero is zero — the arithmetic and the gate agree.",reveal:["gx","s","table"],active:["gx"],point:"gx",inputs:[0,0],row:0,
         def:"XOR outputs 1 when exactly one of its inputs is 1.",
         quiz:{q:"When does an XOR gate output 1?",options:["When its inputs differ","When both inputs are 1","When both inputs are 0"],answer:0,why:"Exclusive-OR means one or the other, but NOT both — which is exactly 'the inputs differ'."}},
        {short:"Flip one bit",term:"signal propagation",narration_text:"Change ONE thing and nothing else — flip B to one. Watch the wire go red all the way to the gate, then the sum output goes red too. The inputs now differ, so the exclusive-OR fires. Changing a single bit at a time is how you tell what actually caused what.",reveal:["a","b","gx","s"],active:["b"],point:"s",inputs:[0,1],row:1,
         quiz:{q:"Why change only one input at a time?",options:["So the change and its consequence are unambiguous","To save time","Because two changes are not allowed"],answer:0,why:"If two things change together you cannot tell which one moved the output."}},
        {short:"The AND gate",term:"AND gate",narration_text:"Here is the second gate, feeding a second output. The flat-backed one is an AND, and it only goes high when EVERY input is high. A is zero, so the carry stays at zero. Notice the same two inputs feed both gates at once — that dot on the wire is a junction, not a crossing.",reveal:["gn","c"],active:["gn"],point:"gn",inputs:[0,1],row:1,
         def:"AND outputs 1 only when all of its inputs are 1."},
        {short:"One plus one",term:"carry",narration_text:"Now the case everyone gets wrong. Set both inputs to one. In ordinary arithmetic you want to write two — but there is no digit two in binary. The exclusive-OR sees two identical inputs and drops the sum to zero, while the AND finally goes high and raises the carry. One plus one is one-zero: sum zero, carry one.",reveal:["a","b","gx","gn","s","c"],active:["c"],point:"c",inputs:[1,1],row:3,
         quiz:{q:"In binary, 1 + 1 gives which sum and carry bits?",options:["Sum 0, carry 1","Sum 1, carry 0","Sum 1, carry 1"],answer:0,why:"1 + 1 = 10 in binary — the 0 stays as the sum and the 1 is carried to the next column, exactly like 5 + 5 in decimal."}},
        {short:"Four rows, no guessing",term:"truth table",narration_text:"Look at the table beside the circuit. Two inputs give exactly four combinations, so the table has exactly four rows — two to the power of two. If you ever stop at the two rows that look interesting, you have not proved anything, you have guessed. Read the input columns downward and you will see them counting up in binary.",reveal:["table"],active:["table"],point:"table",inputs:[1,1],row:3,
         def:"A truth table lists the output for every possible combination of inputs — all 2ⁿ of them."},
        {short:"Recap",term:"recap",narration_text:"Recap. The circuit, the table and the expression are three views of one thing. Exclusive-OR gives the sum because it means the inputs differ; AND gives the carry because it means both were one; and the only way to be sure is to check all four rows.",reveal:["expr"],active:["expr"],point:"expr",inputs:[1,1],row:3}],
      recap:["SUM = A ⊕ B — the exclusive-OR fires when the bits differ.",
             "CARRY = A · B — the AND fires only when both bits are 1.",
             "n inputs means exactly 2ⁿ rows: stopping early is a guess, not a proof."]} },

  /* ── COMPUTER STUDIES 23: table — the truth table standing on its own, built one row per beat so
     the COUNTING PATTERN is something the student watches happen rather than a wall of digits. ── */
  { text: "Draw the truth table for the Boolean expression NOT (A AND B), and compare it with (NOT A) OR (NOT B).",
    blueprint: {meta:{title:"De Morgan's law — two expressions, one output column",subject:"Computer Studies",concept_id:"de_morgan_truth_table"},layout:"table",mono:true,
      caption:"Two inputs, so exactly four rows — written in binary counting order.",
      columns:[{id:"A",label:"A",group:"in"},{id:"B",label:"B",group:"in"},{id:"nand",label:"¬(A · B)",group:"out"},
               {id:"dm",label:"¬A + ¬B",group:"out"},{id:"trap",label:"¬A · ¬B",group:"danger"}],
      rows:[{id:"r0",cells:["0","0","1","1","1"],note:"agree"},
            {id:"r1",cells:["0","1","1","1","0"],note:"the trap fails here"},
            {id:"r2",cells:["1","0","1","1","0"],note:"and here"},
            {id:"r3",cells:["1","1","0","0","0"],note:"agree"}],
      note:"Break the bar AND flip the operator. Break it without flipping and you get the red column.",
      narration_steps:[
        {short:"Headings first",term:"truth table",narration_text:"Before any numbers, put the headings up. The two lilac columns are what you are given — the inputs. The teal columns are what you are working out. Keeping cause and effect on different sides of the table is the difference between reading a table and staring at one.",reveal:["head"],active:["head"],point:"head",
         def:"A truth table lists an expression's output for every combination of its inputs."},
        {short:"Why four rows",term:"2ⁿ rows",narration_text:"Two inputs, each with two possible values, gives two times two — four combinations. That is where two-to-the-n comes from, and it is why a three-input table has eight rows, not six. Write them in binary counting order and you physically cannot miss one.",reveal:["r0"],active:["r0"],point:"r0",
         quiz:{q:"How many rows does a truth table with 3 inputs have?",options:["8","6","9"],answer:0,why:"2³ = 8. Each extra input DOUBLES the table."}},
        {short:"The pattern",term:"counting order",narration_text:"Now fill in the input columns and watch the rhythm. The right-hand column alternates every single row: zero, one, zero, one. The column to its left alternates every two rows. That pattern is not decoration — it is your guarantee that nothing has been skipped.",reveal:["r1","r2","r3"],active:["r1"],point:"r1"},
        {short:"NOT (A AND B)",term:"NAND",narration_text:"Work out the first teal column. A AND B is only true on the last row, where both are one — so its negation is true everywhere EXCEPT the last row. Three ones and a zero. Do it row by row and you never have to trust your instinct.",reveal:["r0","r1","r2","r3"],active:["r3"],point:"r3"},
        {short:"The trap",term:"De Morgan's law",narration_text:"Here is the mistake almost everyone makes. Asked to negate A AND B, students break the bar over the terms and leave the operator alone, giving NOT A AND NOT B — the red column. Compare it against the teal one. It agrees on two rows and disagrees on two, which means it is simply a different expression.",reveal:["r1","r2"],active:["r2"],point:"r2",
         quiz:{q:"What is ¬(A · B) equal to?",options:["¬A + ¬B","¬A · ¬B","A + B"],answer:0,why:"De Morgan: break the bar AND change the operator. AND becomes OR."},
         def:"De Morgan's law: negating a bracket flips the operator inside it."},
        {short:"Proof by matching",term:"equivalence",narration_text:"Compare the two teal columns instead. One, one, one, zero — and one, one, one, zero. Identical in every row, so the expressions are equivalent, and that is a proof rather than an opinion. Two expressions are the same thing exactly when their output columns match all the way down.",reveal:["r0","r1","r2","r3"],active:["r0"],point:"head"},
        {short:"Recap",term:"recap",narration_text:"Recap. Count the rows first: two to the n, every time. Fill the inputs in counting order so nothing is missed. And when you push a negation into a bracket, break the bar AND flip the operator — doing only half of it is the red column.",reveal:["head","r3"],active:["head"],point:"head"}],
      recap:["n inputs → exactly 2ⁿ rows, in binary counting order.",
             "¬(A · B) = ¬A + ¬B — break the bar AND flip the operator.",
             "Identical output columns is what 'equivalent' actually means."]} },

  /* ── COMPUTER STUDIES 24: flow used as a FLOWCHART. Start/Stop are "trigger"/"outcome", each step
     is "process", and the decision the students get wrong is a "danger" node, so the colour itself
     warns. This exists so a flowchart request routes to flow and not to tree. ── */
  { text: "Draw a flowchart for an algorithm that reads a number and reports whether it is positive, negative or zero.",
    blueprint: {meta:{title:"A flowchart: is the number positive, negative or zero?",subject:"Computer Studies",concept_id:"flowchart_sign_of_number"},layout:"flow",
      nodes:[{id:"n0",label:"START",note:"terminator — an oval",kind:"trigger"},
             {id:"n1",label:"INPUT n",note:"I/O — a parallelogram",kind:"process"},
             {id:"n2",label:"Is n > 0 ?",note:"decision — a diamond",kind:"danger"},
             {id:"n3",label:"OUTPUT “positive”",note:"the YES branch",kind:"product"},
             {id:"n4",label:"Is n < 0 ?",note:"the NO branch",kind:"danger"},
             {id:"n5",label:"OUTPUT “negative”",note:"YES",kind:"product"},
             {id:"n6",label:"OUTPUT “zero”",note:"NO — the case people forget",kind:"product"},
             {id:"n7",label:"STOP",note:"terminator — every path ends here",kind:"outcome"}],
      narration_steps:[
        {short:"Start",term:"terminator",narration_text:"Every flowchart begins and ends with a terminator — the rounded box that says START. It sounds trivial, but in an exam the SHAPE is the answer: markers are checking that you used an oval here and not a rectangle.",reveal:["n0"],active:["n0"],point:"n0",
         def:"A terminator marks where an algorithm begins or ends."},
        {short:"Input",term:"input/output box",narration_text:"Next, get the data in. Reading a value from the user is an input step, drawn as a slanted parallelogram — a different shape from a calculation, because getting a number and working something out are genuinely different actions.",reveal:["n1"],active:["n1"],point:"n1"},
        {short:"The decision",term:"decision",narration_text:"Now the diamond, and this is where marks are lost. A decision asks a yes-or-no question, and it must have exactly TWO exits, each one LABELLED. Leave an arrow unlabelled and the reader cannot tell which branch is which — the algorithm is ambiguous.",reveal:["n2"],active:["n2"],point:"n2",
         quiz:{q:"How many labelled exits must a decision diamond have?",options:["Exactly two","One","As many as you like"],answer:0,why:"A yes/no question has two answers, and both arrows must be labelled or the chart is ambiguous."},
         def:"A decision is a yes/no test that splits the path in two."},
        {short:"The YES path",term:"branch",narration_text:"Follow the YES branch first and finish it completely before you go back for the other one. If the number is greater than zero we report positive, and that path is now done. Tracing one path at a time is how you check a chart without getting lost.",reveal:["n3"],active:["n3"],point:"n3"},
        {short:"Ask again",term:"nested decision",narration_text:"Back to the NO branch. Careful here — NO does not mean negative, it only means not greater than zero, and that still covers two different cases. So you need a second question. Assuming one test settles it is the most common error in this whole topic.",reveal:["n4"],active:["n4"],point:"n4",
         quiz:{q:"Why is a second decision needed?",options:["'Not greater than zero' still covers negative AND zero","To make the chart longer","Because one diamond is not allowed"],answer:0,why:"Failing the first test leaves two possibilities, so one more question is required to separate them."}},
        {short:"The forgotten case",term:"boundary case",narration_text:"Second question, two more branches. Negative gets reported, and if the answer is no again, the only value left is zero. Zero is the case that gets forgotten every time, because it sits exactly on the boundary — and boundaries are where algorithms break.",reveal:["n5","n6"],active:["n6"],point:"n6"},
        {short:"One exit",term:"terminator",narration_text:"Finally, all three paths come back together and end at one STOP. Every route through the chart must reach an end — a branch that just stops in mid-air means you have left a case unhandled.",reveal:["n7"],active:["n7"],point:"n7"},
        {short:"Recap",term:"recap",narration_text:"Recap. Ovals to start and stop, a parallelogram for input, a rectangle for a step, and a diamond for a decision with two labelled exits. Trace one path at a time, and always ask yourself what happens at the boundary.",reveal:["n0","n7"],active:["n7"],point:"n7"}],
      recap:["The shape carries the meaning — oval, parallelogram, rectangle, diamond.",
             "Every decision diamond has exactly two LABELLED exits.",
             "Check the boundary case: zero is the one everybody forgets."]} }
];

/* Cost optimisation (a): send only the ONE worked example whose mode best fits the text
 * (a cheap local heuristic), instead of all three. The rules still describe every mode, so the
 * model can still choose any — this just trims ~2/3 of the few-shot tokens. */
function pickExemplar(text){
  const t = (text||"").toLowerCase();
  /* ---- MATHS GATE. Maths highlights must NEVER fall through to a medical/chemistry exemplar:
     the chemistry regex below would otherwise swallow "reaction", "atom", "distribution", "base"
     or "product" out of a perfectly ordinary maths passage. If any maths cue fires we route to a
     maths mode here and return before the chemistry/biology heuristics ever run. ---- */
  const MATHS = /derivative|differentiat|integral|integrat|antiderivative|\blimit\b|\btangent\b|\bsecant\b|calculus|\bsine\b|\bcosine\b|\btangent ratio\b|\bsin\b|\bcos\b|\btan\b|radian|unit circle|trigonometr|\bvector\b|\bvectors\b|scalar|magnitude and direction|dot product|cross product|\bmatrix\b|matrices|determinant|\beigen|linear transformation|inequalit|absolute value|number line|\bsolve\b|solving|factoris|factoriz|\bfactor\b|quadratic|parabola|complete the square|completing the square|simultaneous equation|probabilit|permutation|combination|\bsequence\b|\bseries\b|arithmetic progression|geometric progression|sigma notation|logarithm|\blog\b|\bln\b|exponential (growth|decay|function)|\bfunction\b .{0,24}\bgraph\b|domain and range|asymptot|\bpi\b|theta|\baxis\b .{0,20}\bcurve\b/;
  const ABSBAR = /\|\s*[a-z0-9][^|]{0,14}\|/i;   // |x|, |x − 3|, |2x + 1| — absolute-value bars
  const isMaths = MATHS.test(t) || ABSBAR.test(text||"") || /∫|∑|√|θ|π|dy\/dx|d\/dx|f'\(x\)|f′\(x\)|≤|≥/.test(text||"");
  /* ---- COMPUTER-STUDIES GATE, ahead of everything. A "logic circuit" contains the word "circuit"
     and would otherwise be handed the DC-circuit exemplar; "truth table" contains "table"; a
     flowchart is a list of steps and would fall through to a biology cascade; and "solve"/"factor"
     in an algorithm question fires the maths gate. Computing gets first refusal on its own cues. ---- */
  // logic gates & Boolean algebra → the gate schematic (the flagship computing renderer)
  if(/\blogic gates?\b|\blogic circuit\b|\bboolean\b|\btruth table\b|de ?morgan|\band gate\b|\bor gate\b|\bnot gate\b|\bnand\b|\bnor gate\b|\bxor\b|\bxnor\b|\bexclusive.?or\b|\binverter\b|universal gate|half.?adder|full.?adder|\bripple carry\b|\bkarnaugh\b|\bk.?map\b|logic (expression|diagram|simplif)|gate (symbol|diagram)|combinational logic|\bsum of products\b|\bminterm/.test(t))
    return /\btruth table\b|de ?morgan|\bk.?map\b|karnaugh|equivalen/.test(t) && !/\bgates?\b|circuit|adder|schematic/.test(t)
      ? EXEMPLARS[23] : EXEMPLARS[22];
  // flowcharts & dry-running → the flow renderer, used as a flowchart
  if(/\bflow ?chart\b|\bflow diagram\b|dry.?run|trace table|\bpseudo.?code\b|\balgorithm\b .{0,40}(step|draw|diagram|chart|design)|\bdecision (box|symbol|diamond)\b|\bterminator\b|fetch.?decode.?execute|software development life ?cycle|\bsdlc\b|compilation (pipeline|process)|\bpacket'?s journey\b/.test(t))
    return EXEMPLARS[24];
  // comparison matrices → the grid
  if(/\bram\b .{0,12}\brom\b|compiler .{0,12}interpreter|\btcp\b .{0,12}\budp\b|osi .{0,16}tcp|stack .{0,12}queue|\bcompare\b .{0,40}(algorithm|memory|network|language|storage)|difference(s)? between .{0,40}(ram|rom|compiler|interpreter|tcp|udp|stack|queue|lan|wan|analogue|digital)/.test(t))
    return EXEMPLARS[23];
  /* ---- PHYSICS GATE, ahead of maths. "Resultant", "magnitude", "amplitude", "period" and even
     "vector" all fire the maths regex, so a forces or circuits question would otherwise be handed a
     maths exemplar. The two purpose-built physics renderers get first refusal on their own cues. ---- */
  // forces on a body → the free-body diagram (the flagship)
  if(/free.?body|\bfbd\b|\bnet force\b|forces? (on|acting on)|newton'?s (first|second|third) law|\bf ?= ?ma\b|third law|action.{0,3}reaction|\bnormal force\b|\bfriction(al)?\b|coefficient of (static|kinetic) friction|\btension\b .{0,24}(rope|string|cable)|\bincline\b|inclined plane|\bslope\b .{0,20}(block|mass)|\bequilibrium of forces\b|centripetal|centrifugal|circular motion|banked (curve|turn)|apparent weight|weightless|free fall|\bweight\b .{0,16}\bmass\b|impetus/.test(t))
    return EXEMPLARS[20];
  // DC circuits → the circuit schematic
  if(/\bcircuit\b|\bresistors?\b|\bresistance\b|\bohm'?s law\b|\bcurrent\b .{0,30}(volt|resist|circuit|batter|amp)|\bvoltage\b|potential difference|\bemf\b|\bbatter(y|ies)\b|\bammeter\b|\bvoltmeter\b|kirchhoff|in series|in parallel|\bbulbs?\b|\blamps?\b .{0,20}(bright|circuit)|\bv ?= ?ir\b|internal resistance/.test(t))
    return EXEMPLARS[21];
  /* ---- MATHS routing (cue → the right renderer) ---- */
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
  // trigonometry / the unit circle → the unit-circle renderer
  if(/unit circle|radian|trigonometr|\bsine\b|\bcosine\b|\bsin\b|\bcos\b|\btan\b|\bsoh ?cah ?toa\b|pythagorean identity|\bastc\b|quadrant|amplitude|\bperiod(ic)?\b|phase shift|trig (identit|equation|graph)/.test(t))
    return EXEMPLARS[15];
  // inequalities & absolute value → the worked solution WITH a number line
  if(/inequalit|\bnumber line\b|absolute value|modulus|greater than or equal|less than or equal|solution set|\binterval notation\b|flip the (sign|inequality)|two cases/.test(t) || ABSBAR.test(text||""))
    return EXEMPLARS[17];
  // vectors → the tip-to-tail plane
  if(/\bvectors?\b|scalar|magnitude and direction|tip to tail|resultant|dot product|cross product|position vector|unit vector/.test(t))
    return EXEMPLARS[18];
  // matrices & transformations → the transformation grid (checked BEFORE "solve", because a
  // determinant is an "area scale FACTOR" and would otherwise be caught by the factorising cue)
  if(/\bmatri(x|ces)\b|determinant|\beigen(value|vector)|\bidentity matrix\b|inverse matrix|linear transformation|transformation of (the )?(plane|space)|singular matrix|basis vector/.test(t))
    return EXEMPLARS[19];
  // solving / factorising / rearranging → the line-by-line worked solution
  if(/complet(e|ing) the square|quadratic formula|\bquadratic\b|factoris|factoriz|factor(ed|ing)? (out|completely|the)|common factor|\bsolve\b|solving|rearrang|make .{0,12}the subject|simultaneous equation|elimination method|substitution method|extraneous solution|\broots? of\b|discriminant/.test(t))
    return EXEMPLARS[16];
  // any other plottable maths idea → the derivative graph exemplar (best in-domain graph shot)
  if(/\blimit\b|approaches|asymptot|\bcontinuit\b|continuous function|domain and range|logarithm|\bln\b|exponential (growth|decay|function)|parabola|\bvertex\b|geometric series|arithmetic sequence|\bsequence\b|\bseries\b|converge|\bsigma notation\b|sum to infinity|curve sketch|stationary point|maximum and minimum/.test(t))
    return EXEMPLARS[13];
  /* Maths cue fired but nothing above matched: still keep it in-domain — the graph engine is the
     workhorse of maths — rather than dropping through to a chemistry or biology exemplar. */
  if(isMaths) return EXEMPLARS[13];
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


/* ═══ MATHS layout validators — one per new renderer. Each renderer draws ONLY the part names it
 * knows, so a blueprint naming anything else would silently render a blank stage. ═══ */
const UC_PARTS = new Set(["circle","radius","sin","cos","identity","quadrants"]);
export function unitCircleCheck(bp){
  const issues=[]; if(!bp||typeof bp!=="object") return {pass:false,issues:["not an object"]};
  if(!bp.meta||!bp.meta.title) issues.push("missing meta.title");
  const a=bp.angle; if(a!=null && (typeof a!=="number"||!isFinite(a))) issues.push("angle must be a number of degrees");
  if(typeof a==="number" && (a<=0||a>=360)) issues.push("angle must be strictly between 0 and 360 degrees");
  const steps=Array.isArray(bp.narration_steps)?bp.narration_steps:[];
  if(steps.length<3) issues.push("too few steps ("+steps.length+", need ≥3)");
  if(steps.length>10) issues.push("too many steps ("+steps.length+")");
  const seen=new Set();
  steps.forEach((s,i)=>{
    if(!s.narration_text||!s.narration_text.trim()) issues.push("step "+(i+1)+" has no narration");
    if(s.narration_text && s.narration_text.length>320) issues.push("step "+(i+1)+" narration too long");
    (s.reveal||[]).forEach(r=>{ if(!UC_PARTS.has(r)) issues.push("step "+(i+1)+" reveals unknown part '"+r+"' (use "+[...UC_PARTS].join(", ")+")"); else seen.add(r); });
    (s.active||[]).forEach(r=>{ if(!UC_PARTS.has(r)) issues.push("step "+(i+1)+" active unknown part '"+r+"'"); });
    if(s.point && !UC_PARTS.has(s.point)) issues.push("step "+(i+1)+" point is not a part: "+s.point);
  });
  ["radius","sin","cos"].forEach(p=>{ if(!seen.has(p)) issues.push("part '"+p+"' is never revealed — the unit-circle story needs the radius, the sine height and the cosine across"); });
  return {pass:issues.length===0,issues};
}

/* SOLVE — a worked algebraic solution: every line needs the MOVE and the REASON for it. */
export function solveCheck(bp){
  const issues=[]; if(!bp||typeof bp!=="object") return {pass:false,issues:["not an object"]};
  if(!bp.meta||!bp.meta.title) issues.push("missing meta.title");
  if(!bp.problem) issues.push("missing 'problem' — the question being solved goes in the banner");
  const lines=Array.isArray(bp.lines)?bp.lines:[];
  if(lines.length<3) issues.push("need ≥3 solution lines (got "+lines.length+")");
  if(lines.length>9) issues.push("too many solution lines ("+lines.length+") — keep it to the real moves");
  const ok={}; lines.forEach((ln,i)=>{
    if(!ln.id){ issues.push("line "+(i+1)+" missing id"); return; }
    if(ok[ln.id]) issues.push("duplicate line id '"+ln.id+"'");
    ok[ln.id]=1;
    if(!ln.math) issues.push("line '"+ln.id+"' missing 'math' (the algebra for that line)");
    if(!ln.why) issues.push("line '"+ln.id+"' missing 'why' — every line must state the reason for the move");
  });
  const nl=bp.numberline;
  if(nl){
    ok.nl=1;
    if(typeof nl.min!=="number"||typeof nl.max!=="number"||!(nl.max>nl.min)) issues.push("numberline needs numeric min < max");
    if(typeof nl.value!=="number") issues.push("numberline needs a numeric 'value' (the boundary)");
    if(typeof nl.value==="number" && typeof nl.min==="number" && typeof nl.max==="number" && (nl.value<nl.min||nl.value>nl.max)) issues.push("numberline value must lie between min and max");
    if(["<",">","≤","≥"].indexOf(nl.op)<0) issues.push("numberline op must be one of < > ≤ ≥");
    if(nl.closed!=null && typeof nl.closed!=="boolean") issues.push("numberline 'closed' must be true/false (filled vs open dot)");
    if((nl.op==="≤"||nl.op==="≥") && nl.closed===false) issues.push("op '"+nl.op+"' includes the endpoint, so 'closed' must be true (filled dot)");
    if((nl.op==="<"||nl.op===">") && nl.closed===true) issues.push("op '"+nl.op+"' excludes the endpoint, so 'closed' must be false (open dot)");
  }
  const steps=Array.isArray(bp.narration_steps)?bp.narration_steps:[];
  if(steps.length<3) issues.push("too few steps ("+steps.length+", need ≥3)");
  if(steps.length>10) issues.push("too many steps ("+steps.length+")");
  const revealed=new Set();
  steps.forEach((s,i)=>{
    if(!s.narration_text||!s.narration_text.trim()) issues.push("step "+(i+1)+" has no narration");
    if(s.narration_text && s.narration_text.length>380) issues.push("step "+(i+1)+" narration too long");
    (s.reveal||[]).forEach(r=>{ if(!ok[r]) issues.push("step "+(i+1)+" reveals unknown id '"+r+"' (use a line id"+(nl?", or 'nl' for the number line":"")+")"); else revealed.add(r); });
    (s.active||[]).forEach(r=>{ if(!ok[r]) issues.push("step "+(i+1)+" active unknown id '"+r+"'"); });
    if(s.point && !ok[s.point]) issues.push("step "+(i+1)+" point unknown id '"+s.point+"'");
  });
  lines.forEach(ln=>{ if(ln.id && !revealed.has(ln.id)) issues.push("line '"+ln.id+"' is never revealed — it will not appear"); });
  if(nl && !revealed.has("nl")) issues.push("a numberline is defined but never revealed — reveal 'nl' on the final step");
  return {pass:issues.length===0,issues};
}

/* VECTORS — a fixed tip-to-tail plane; only these five part names exist. */
const VEC_PARTS = new Set(["a","b","comp","shift","res"]);
function vec2(v){ return Array.isArray(v)&&v.length===2&&v.every(n=>typeof n==="number"&&isFinite(n)); }
export function vectorsCheck(bp){
  const issues=[]; if(!bp||typeof bp!=="object") return {pass:false,issues:["not an object"]};
  if(!bp.meta||!bp.meta.title) issues.push("missing meta.title");
  if(!vec2(bp.a)) issues.push("'a' must be a two-number array [across, up]");
  if(!vec2(bp.b)) issues.push("'b' must be a two-number array [across, up]");
  [["a",bp.a],["b",bp.b]].forEach(([k,v])=>{ if(vec2(v)&&(Math.abs(v[0])>6||Math.abs(v[1])>4)) issues.push("vector "+k+" is off the drawable grid — keep components within ±6 across and ±4 up"); });
  if(vec2(bp.a)&&vec2(bp.b)){ const r=[bp.a[0]+bp.b[0],bp.a[1]+bp.b[1]];
    if(Math.abs(r[0])>7||Math.abs(r[1])>4) issues.push("the resultant a + b runs off the grid — shrink the components"); }
  const steps=Array.isArray(bp.narration_steps)?bp.narration_steps:[];
  if(steps.length<3) issues.push("too few steps ("+steps.length+", need ≥3)");
  if(steps.length>8) issues.push("too many steps ("+steps.length+")");
  const seen=new Set();
  steps.forEach((s,i)=>{
    if(!s.narration_text||!s.narration_text.trim()) issues.push("step "+(i+1)+" has no narration");
    (s.reveal||[]).forEach(r=>{ if(!VEC_PARTS.has(r)) issues.push("step "+(i+1)+" reveals unknown part '"+r+"' (use "+[...VEC_PARTS].join(", ")+")"); else seen.add(r); });
    (s.active||[]).forEach(r=>{ if(!VEC_PARTS.has(r)) issues.push("step "+(i+1)+" active unknown part '"+r+"'"); });
    if(s.point && !VEC_PARTS.has(s.point)) issues.push("step "+(i+1)+" point is not a part: "+s.point);
  });
  ["a","shift","res"].forEach(p=>{ if(!seen.has(p)) issues.push("part '"+p+"' is never revealed — tip-to-tail needs the first vector, the slid copy and the resultant"); });
  return {pass:issues.length===0,issues};
}

/* MATRIX — a 2×2 transformation of the unit square; five fixed part names. */
const MAT_PARTS = new Set(["orig","ti","tj","det","M"]);
export function matrixCheck(bp){
  const issues=[]; if(!bp||typeof bp!=="object") return {pass:false,issues:["not an object"]};
  if(!bp.meta||!bp.meta.title) issues.push("missing meta.title");
  const M=bp.M;
  if(!Array.isArray(M)||M.length!==2||!M.every(r=>vec2(r))) issues.push("'M' must be a 2×2 array of numbers [[a,b],[c,d]]");
  else {
    const flat=[M[0][0],M[0][1],M[1][0],M[1][1]];
    if(flat.some(n=>Math.abs(n)>4)) issues.push("keep every entry of M within ±4 so the transformed square stays on screen");
    const det=M[0][0]*M[1][1]-M[0][1]*M[1][0];
    if(Math.abs(det)>12) issues.push("|det| = "+det+" is too large to draw — choose a gentler matrix");
  }
  const steps=Array.isArray(bp.narration_steps)?bp.narration_steps:[];
  if(steps.length<3) issues.push("too few steps ("+steps.length+", need ≥3)");
  if(steps.length>8) issues.push("too many steps ("+steps.length+")");
  const seen=new Set();
  steps.forEach((s,i)=>{
    if(!s.narration_text||!s.narration_text.trim()) issues.push("step "+(i+1)+" has no narration");
    (s.reveal||[]).forEach(r=>{ if(!MAT_PARTS.has(r)) issues.push("step "+(i+1)+" reveals unknown part '"+r+"' (use "+[...MAT_PARTS].join(", ")+")"); else seen.add(r); });
    (s.active||[]).forEach(r=>{ if(!MAT_PARTS.has(r)) issues.push("step "+(i+1)+" active unknown part '"+r+"'"); });
    if(s.point && !MAT_PARTS.has(s.point)) issues.push("step "+(i+1)+" point is not a part: "+s.point);
  });
  ["orig","ti","tj"].forEach(p=>{ if(!seen.has(p)) issues.push("part '"+p+"' is never revealed — show the unit square and where BOTH basis vectors land"); });
  return {pass:issues.length===0,issues};
}

/* ═══ PHYSICS layout validators. A physics diagram with an illegal arrow teaches the exact
 * misconception the renderer exists to fix — worse than no video at all — so these are HARD checks,
 * not style notes: every force names its agent, the normal is perpendicular to the surface, friction
 * runs along it, acceleration is never a force, the current is conserved and the ladder closes. ═══ */
const FBD_PARTS = new Set(["body","axes","comp","net","accel","danger","gauge"]);
const FBD_KINDS = new Set(["weight","normal","friction","tension","applied","other"]);
const NOT_A_FORCE = /centrifugal|force of motion|motive (force|power)|impetus|\binertial? force\b/i;
function degOK(d){ return typeof d==="number" && isFinite(d) && d>=0 && d<=360; }
function degNear(d,target,tol){ var x=Math.abs(((d-target)%360+540)%360-180); return x<=tol; }
export function fbdCheck(bp){
  const issues=[]; if(!bp||typeof bp!=="object") return {pass:false,issues:["not an object"]};
  if(!bp.meta||!bp.meta.title) issues.push("missing meta.title");
  const th = bp.incline==null?0:bp.incline;
  if(typeof th!=="number"||!isFinite(th)||th<0||th>60) issues.push("'incline' must be a number of degrees between 0 and 60 (0 for a flat surface)");
  const forces=Array.isArray(bp.forces)?bp.forces:[];
  if(forces.length<2) issues.push("a free-body diagram needs at least 2 forces (got "+forces.length+")");
  if(forces.length>6) issues.push("too many forces ("+forces.length+") — keep the diagram readable");
  const ok={}; let weights=0;
  forces.forEach((f,i)=>{
    const who="force "+(f.id||("#"+(i+1)));
    if(!f.id){ issues.push("force "+(i+1)+" missing id"); return; }
    if(FBD_PARTS.has(f.id)) issues.push("force id '"+f.id+"' collides with the fixed part name '"+f.id+"' — rename it");
    if(ok[f.id]) issues.push("duplicate force id '"+f.id+"'");
    ok[f.id]=1;
    if(!f.label) issues.push(who+" needs a label with the force's name and its size in newtons");
    if(!f.agent||!f.agent.trim()) issues.push(who+" has no agent — every force must name the object exerting it ('by the rope', 'by the Earth'). If you cannot name one, it is not a force");
    else if(!/^by\b/i.test(f.agent.trim())) issues.push(who+" agent must be phrased 'by the …' (got '"+f.agent+"')");
    if(NOT_A_FORCE.test(f.label||"")||NOT_A_FORCE.test(f.agent||"")) issues.push(who+" is not a real force — put it in the 'danger' frame to be struck through, never in 'forces'");
    if(/centripetal/i.test(f.label||"")) issues.push(who+": centripetal force is not a separate force — label the arrow with its real agent (tension, gravity, friction) and say in the narration that this inward force IS the centripetal force");
    if(!degOK(f.dir)) issues.push(who+" needs 'dir' in degrees 0–360 (0 = right, 90 = up, 180 = left, 270 = down)");
    if(f.mag!=null&&(typeof f.mag!=="number"||f.mag<0.15||f.mag>1.3)) issues.push(who+" 'mag' must be between 0.2 and 1.2");
    if(!FBD_KINDS.has(f.kind||"other")) issues.push(who+" kind must be one of: "+[...FBD_KINDS].join(", "));
    if(f.kind==="weight"){ weights++;
      if(degOK(f.dir)&&!degNear(f.dir,270,8)) issues.push(who+": weight always points straight DOWN — dir must be 270, not "+f.dir); }
    if(f.kind==="normal"&&degOK(f.dir)&&!degNear(f.dir,90-th,7))
      issues.push(who+": the normal force is perpendicular to the surface, so on a "+th+"° slope dir must be "+(((90-th)%360+360)%360)+", not "+f.dir);
    if(f.kind==="friction"&&degOK(f.dir)&&!degNear(f.dir,360-th,7)&&!degNear(f.dir,180-th,7))
      issues.push(who+": friction acts ALONG the surface, so dir must be "+(((360-th)%360+360)%360)+" (down the slope) or "+(((180-th)%360+360)%360)+" (up it), not "+f.dir);
  });
  if(weights>1) issues.push("only one weight arrow is allowed — gravity acts once");
  ["net","accel","danger"].forEach(k=>{ const o=bp[k]; if(o==null)return;
    if(typeof o!=="object") issues.push("'"+k+"' must be an object"); else if(!degOK(o.dir)) issues.push("'"+k+"' needs 'dir' in degrees 0–360"); });
  (Array.isArray(bp.components)?bp.components:[]).forEach((c,i)=>{
    if(!degOK(c.dir)) issues.push("component "+(i+1)+" needs 'dir' in degrees 0–360");
    if(!c.label) issues.push("component "+(i+1)+" needs a label (e.g. 'mg sin θ = 18 N')"); });
  const g=bp.friction_gauge;
  if(g){ if(!(+g.fsmax>0)) issues.push("friction_gauge needs a positive 'fsmax' (the cap μ_s N)");
    if(!(+g.fs>=0)) issues.push("friction_gauge needs 'fs' ≥ 0");
    if(+g.fs>+g.fsmax) issues.push("friction_gauge: f_s cannot exceed f_s,max — that is the whole point of the cap"); }
  const steps=Array.isArray(bp.narration_steps)?bp.narration_steps:[];
  if(steps.length<3) issues.push("too few steps ("+steps.length+", need ≥3)");
  if(steps.length>10) issues.push("too many steps ("+steps.length+")");
  const known=id=>ok[id]||FBD_PARTS.has(id), seen=new Set();
  steps.forEach((s,i)=>{
    if(!s.narration_text||!s.narration_text.trim()) issues.push("step "+(i+1)+" has no narration");
    if(s.narration_text&&s.narration_text.length>380) issues.push("step "+(i+1)+" narration too long");
    (s.reveal||[]).forEach(r=>{ if(!known(r)) issues.push("step "+(i+1)+" reveals unknown id '"+r+"' (use a force id, or one of "+[...FBD_PARTS].join(", ")+")"); else seen.add(r); });
    (s.active||[]).forEach(r=>{ if(!known(r)) issues.push("step "+(i+1)+" active unknown id '"+r+"'"); });
    if(s.point&&!known(s.point)) issues.push("step "+(i+1)+" point unknown id '"+s.point+"'");
  });
  forces.forEach(f=>{ if(f.id&&!seen.has(f.id)) issues.push("force '"+f.id+"' is never revealed — it will not appear"); });
  if(!seen.has("body")) issues.push("reveal 'body' on the first step — lifting the body out of its situation is the whole lesson");
  [["components","comp"],["net","net"],["accel","accel"],["danger","danger"],["friction_gauge","gauge"]].forEach(([k,part])=>{
    if(bp[k]&&!(Array.isArray(bp[k])&&!bp[k].length)&&!seen.has(part)) issues.push("'"+k+"' is defined but the part '"+part+"' is never revealed"); });
  return {pass:issues.length===0,issues};
}

/* CIRCUIT — a loop the renderer can actually lay out, with legal meters and a ladder that closes. */
const CIR_PARTS = new Set(["loop","battery","current","ladder"]);
const CIR_TYPES = new Set(["resistor","bulb","switch","ammeter","voltmeter","capacitor","junction"]);
const CIR_SIDES = new Set(["top","right","bottom"]);
export function circuitCheck(bp){
  const issues=[]; if(!bp||typeof bp!=="object") return {pass:false,issues:["not an object"]};
  if(!bp.meta||!bp.meta.title) issues.push("missing meta.title");
  if(!bp.battery||!bp.battery.label) issues.push("missing 'battery' — every DC circuit needs a source, with its emf in volts in the label");
  const cur=bp.current||{};
  if(cur.direction&&["cw","ccw"].indexOf(cur.direction)<0) issues.push("current.direction must be 'cw' or 'ccw'");
  const comps=Array.isArray(bp.components)?bp.components:[];
  if(!comps.length) issues.push("no components — put at least one resistor, lamp or meter on the loop");
  if(comps.length>6) issues.push("too many components ("+comps.length+") — the loop has room for 6");
  const ok={}, inLoop={};
  comps.forEach((c,i)=>{
    const who="component "+(c.id||("#"+(i+1)));
    if(!c.id){ issues.push("component "+(i+1)+" missing id"); return; }
    if(CIR_PARTS.has(c.id)) issues.push("component id '"+c.id+"' collides with the fixed part name '"+c.id+"' — rename it");
    if(ok[c.id]) issues.push("duplicate component id '"+c.id+"'");
    ok[c.id]=1;
    if(!CIR_TYPES.has(c.type)) issues.push(who+" type must be one of: "+[...CIR_TYPES].join(", "));
    if(!c.label) issues.push(who+" needs a label carrying its value or reading, with units");
    if(c.type==="voltmeter"){
      if(!c.across) issues.push(who+": a voltmeter is connected ACROSS a component — give it \"across\":\"<component id>\". A voltmeter in the loop would be an illegal circuit");
    } else {
      if(c.across) issues.push(who+": only a voltmeter uses 'across' — an ammeter and every other component sit IN the loop");
      inLoop[c.id]=1;
      if(!CIR_SIDES.has(c.side||"top")) issues.push(who+" side must be top, right or bottom (the left rail is reserved for the battery)");
    }
    if(c.type==="bulb"&&c.brightness!=null&&(typeof c.brightness!=="number"||c.brightness<0||c.brightness>1)) issues.push(who+" brightness must be between 0 and 1");
    if(c.type==="switch"&&c.open!=null&&typeof c.open!=="boolean") issues.push(who+" 'open' must be true or false");
  });
  comps.forEach(c=>{ if(c.type==="voltmeter"&&c.across&&!inLoop[c.across]) issues.push("voltmeter '"+c.id+"' measures across '"+c.across+"', which is not a component in the loop"); });
  const bySide={}; comps.filter(c=>inLoop[c.id]).forEach(c=>{ const s=c.side||"top"; bySide[s]=(bySide[s]||0)+1; });
  Object.keys(bySide).forEach(s=>{ if(bySide[s]>3) issues.push("side '"+s+"' has "+bySide[s]+" components — at most 3 fit on one side"); });
  const lad=bp.ladder;
  if(lad!=null){
    if(!Array.isArray(lad)||lad.length<2) issues.push("'ladder' must be a list of at least 2 steps round the loop");
    else {
      let sum=0, rise=0, drop=0;
      lad.forEach((e,i)=>{ if(typeof e.v!=="number"||!isFinite(e.v)) issues.push("ladder step "+(i+1)+" needs a numeric 'v' (the rise or drop in volts)");
        else { sum+=e.v; if(e.v>0)rise++; else if(e.v<0)drop++; } });
      if(!rise) issues.push("the ladder has no rise — the battery must lift the charge (a positive 'v')");
      if(!drop) issues.push("the ladder has no drop — the charge must lose energy somewhere (a negative 'v')");
      if(Math.abs(sum)>0.011) issues.push("the voltage ladder does not close: the rises and drops sum to "+Math.round(sum*1000)/1000+" V, not 0. Round the loop the charge must come back to the same potential");
    }
  }
  const steps=Array.isArray(bp.narration_steps)?bp.narration_steps:[];
  if(steps.length<3) issues.push("too few steps ("+steps.length+", need ≥3)");
  if(steps.length>10) issues.push("too many steps ("+steps.length+")");
  const known=id=>ok[id]||CIR_PARTS.has(id), seen=new Set();
  steps.forEach((s,i)=>{
    if(!s.narration_text||!s.narration_text.trim()) issues.push("step "+(i+1)+" has no narration");
    if(s.narration_text&&s.narration_text.length>380) issues.push("step "+(i+1)+" narration too long");
    if(/used up|uses up the current|current is consumed/i.test(s.narration_text||"")) issues.push("step "+(i+1)+" says the current is used up — it is not. Say 'the charge comes back; the ENERGY is delivered'");
    (s.reveal||[]).forEach(r=>{ if(!known(r)) issues.push("step "+(i+1)+" reveals unknown id '"+r+"' (use a component id, or one of "+[...CIR_PARTS].join(", ")+")"); else seen.add(r); });
    (s.active||[]).forEach(r=>{ if(!known(r)) issues.push("step "+(i+1)+" active unknown id '"+r+"'"); });
    if(s.point&&!known(s.point)) issues.push("step "+(i+1)+" point unknown id '"+s.point+"'");
  });
  comps.forEach(c=>{ if(c.id&&!seen.has(c.id)) issues.push("component '"+c.id+"' is never revealed — it will not appear"); });
  ["loop","battery"].forEach(p=>{ if(!seen.has(p)) issues.push("part '"+p+"' is never revealed — the loop and the source must both be on screen"); });
  if(lad&&!seen.has("ladder")) issues.push("a ladder is defined but never revealed — reveal 'ladder' on the step that explains the energy balance");
  return {pass:issues.length===0,issues};
}

/* ═══ LOGIC — a gate schematic the engine can route, wired to a truth table that is ARITHMETICALLY
 * TRUE of that schematic. The corpus is explicit that the three representations (circuit,
 * expression, table) are one object, and that students "prove" things by incomplete enumeration.
 * So this check does not merely count rows: it EVALUATES the declared circuit over every input
 * combination and refuses a table that disagrees with the gates. A wrong truth table is the single
 * most damaging thing this mode could ship. ═══ */
const LOG_PARTS = new Set(["table","expr"]);
const LOG_TYPES = new Set(["AND","OR","NOT","NAND","NOR","XOR","XNOR","BUF"]);
const LOG_1IN = new Set(["NOT","BUF"]);
export function logicEval(type,v){
  const T=(type||"").toUpperCase(), b=v.map(x=>x?1:0);
  if(T==="NOT") return b[0]?0:1;
  if(T==="BUF") return b[0]?1:0;
  if(T==="AND")  return b.every(x=>x)?1:0;
  if(T==="NAND") return b.every(x=>x)?0:1;
  if(T==="OR")   return b.some(x=>x)?1:0;
  if(T==="NOR")  return b.some(x=>x)?0:1;
  if(T==="XOR")  return b.reduce((p,c)=>p^c,0)?1:0;
  if(T==="XNOR") return b.reduce((p,c)=>p^c,0)?0:1;
  return 0;
}
export function logicCheck(bp){
  const issues=[]; if(!bp||typeof bp!=="object") return {pass:false,issues:["not an object"]};
  if(!bp.meta||!bp.meta.title) issues.push("missing meta.title");
  const ins=Array.isArray(bp.inputs)?bp.inputs:[], gates=Array.isArray(bp.gates)?bp.gates:[], outs=Array.isArray(bp.outputs)?bp.outputs:[];
  if(ins.length<1||ins.length>4) issues.push("need 1–4 inputs (got "+ins.length+") — more than four makes the truth table unreadable");
  if(!gates.length) issues.push("no gates — a logic diagram needs at least one gate");
  if(gates.length>8) issues.push("too many gates ("+gates.length+") — the canvas holds 8");
  if(!outs.length) issues.push("no outputs — every circuit must end on a named output pin, never a floating wire");
  if(outs.length>3) issues.push("too many outputs ("+outs.length+") — at most 3");
  const id={}, kind={};
  ins.forEach((p,i)=>{ const who="input "+(p.id||("#"+(i+1)));
    if(!p.id){ issues.push("input "+(i+1)+" missing id"); return; }
    if(LOG_PARTS.has(p.id)) issues.push("input id '"+p.id+"' collides with the fixed part name — rename it");
    if(id[p.id]) issues.push("duplicate id '"+p.id+"'"); id[p.id]=1; kind[p.id]="in";
    if(!p.label) issues.push(who+" needs a short label (A, B, Cin…)");
    if(p.value!==0&&p.value!==1) issues.push(who+" needs \"value\": 0 or 1 — the starting signal must be a real bit, not blank"); });
  gates.forEach((g,i)=>{ const who="gate "+(g.id||("#"+(i+1)));
    if(!g.id){ issues.push("gate "+(i+1)+" missing id"); return; }
    if(LOG_PARTS.has(g.id)) issues.push("gate id '"+g.id+"' collides with the fixed part name — rename it");
    if(id[g.id]) issues.push("duplicate id '"+g.id+"'"); id[g.id]=1; kind[g.id]="gate";
    const T=(g.type||"").toUpperCase();
    if(!LOG_TYPES.has(T)) issues.push(who+" type must be one of: "+[...LOG_TYPES].join(", "));
    const src=Array.isArray(g.in)?g.in:[];
    if(LOG_1IN.has(T)){ if(src.length!==1) issues.push(who+" is a "+T+" — it takes exactly ONE input, not "+src.length); }
    else if(src.length<2||src.length>3) issues.push(who+" ("+T+") needs 2 or 3 inputs, got "+src.length); });
  outs.forEach((o,i)=>{ const who="output "+(o.id||("#"+(i+1)));
    if(!o.id){ issues.push("output "+(i+1)+" missing id"); return; }
    if(LOG_PARTS.has(o.id)) issues.push("output id '"+o.id+"' collides with the fixed part name — rename it");
    if(id[o.id]) issues.push("duplicate id '"+o.id+"'"); id[o.id]=1; kind[o.id]="out";
    if(!o.label) issues.push(who+" needs a label saying what the bit MEANS (\"SUM\", \"CARRY\"), not just a letter"); });
  // every reference must resolve, and nothing may feed itself
  gates.forEach(g=>{ (Array.isArray(g.in)?g.in:[]).forEach(r=>{
    if(kind[r]!=="in"&&kind[r]!=="gate") issues.push("gate '"+g.id+"' takes input from '"+r+"', which is not an input or gate id");
    if(r===g.id) issues.push("gate '"+g.id+"' feeds itself — a combinational circuit has no loops"); }); });
  outs.forEach(o=>{ if(kind[o.from]!=="gate"&&kind[o.from]!=="in") issues.push("output '"+o.id+"' comes from '"+o.from+"', which is not a gate or input id"); });
  // depth resolution doubles as the cycle detector: anything still unplaced sits in a loop
  const depth={}; ins.forEach(p=>{ if(p.id) depth[p.id]=0; });
  for(let pass=0;pass<gates.length+2;pass++) gates.forEach(g=>{
    const src=Array.isArray(g.in)?g.in:[];
    if(src.length&&src.every(r=>depth[r]!=null)) depth[g.id]=Math.max(...src.map(r=>depth[r]))+1; });
  gates.forEach(g=>{ if(depth[g.id]==null) issues.push("gate '"+g.id+"' can never be evaluated — its inputs form a cycle, or reference something that does not exist"); });
  // no floating outputs: every gate must feed another gate or an output pin
  const fed=new Set(); gates.forEach(g=>(Array.isArray(g.in)?g.in:[]).forEach(r=>fed.add(r))); outs.forEach(o=>fed.add(o.from));
  gates.forEach(g=>{ if(g.id&&!fed.has(g.id)) issues.push("gate '"+g.id+"' drives nothing — every wire must terminate on a pin, never dangle"); });
  ins.forEach(p=>{ if(p.id&&!fed.has(p.id)) issues.push("input '"+p.id+"' is never used — an input pin wired to nothing teaches nothing"); });

  // the bonded truth table must be COMPLETE and TRUE of this circuit
  const tt=bp.truth_table;
  if(tt){
    const ti=Array.isArray(tt.inputs)?tt.inputs:[], to=Array.isArray(tt.outputs)?tt.outputs:[], rows=Array.isArray(tt.rows)?tt.rows:[];
    if(ti.length!==ins.length) issues.push("truth_table.inputs lists "+ti.length+" columns but the circuit has "+ins.length+" inputs — they must be the same, in the same order");
    if(!to.length) issues.push("truth_table.outputs is empty — name the output column(s)");
    const want=Math.pow(2,ins.length||1);
    if(rows.length!==want) issues.push("a truth table for "+ins.length+" inputs has EXACTLY "+want+" rows; this one has "+rows.length+". Incomplete enumeration is the classic student error — do not model it");
    rows.forEach((r,ri)=>{ if(!Array.isArray(r)||r.length!==ti.length+to.length){ issues.push("truth_table row "+(ri+1)+" must have "+(ti.length+to.length)+" cells"); return; }
      r.forEach((c,ci)=>{ if(c!==0&&c!==1&&c!=="0"&&c!=="1") issues.push("truth_table row "+(ri+1)+" cell "+(ci+1)+" must be 0 or 1"); }); });
    // simulate the circuit over the table's own input rows and compare
    if(rows.length===want && ti.length===ins.length && !issues.length){
      const outIdx=to.map(name=>{ const o=outs.find(x=>(x.label||"")===name||x.id===name); return o?o.from:null; });
      if(outIdx.every(x=>x!=null)) rows.forEach((r,ri)=>{
        const v={}; ins.forEach((p,k)=>{ v[p.id]=(+r[k])?1:0; });
        for(let q=0;q<gates.length+2;q++) gates.forEach(g=>{
          const src=Array.isArray(g.in)?g.in:[];
          if(src.length&&src.every(s=>v[s]!=null)) v[g.id]=logicEval(g.type,src.map(s=>v[s])); });
        outIdx.forEach((src,k)=>{ const got=v[src], said=(+r[ti.length+k])?1:0;
          if(got!=null&&got!==said) issues.push("truth_table row "+(ri+1)+" says "+to[k]+" = "+said+", but the circuit you drew computes "+got+". The table and the schematic must be the same object"); });
      });
    }
  }
  const steps=Array.isArray(bp.narration_steps)?bp.narration_steps:[];
  if(steps.length<3) issues.push("too few steps ("+steps.length+", need ≥3)");
  if(steps.length>10) issues.push("too many steps ("+steps.length+")");
  const known=r=>!!id[r]||LOG_PARTS.has(r), seen=new Set();
  steps.forEach((s,i)=>{
    if(!s.narration_text||!s.narration_text.trim()) issues.push("step "+(i+1)+" has no narration");
    if(s.narration_text&&s.narration_text.length>380) issues.push("step "+(i+1)+" narration too long");
    (s.reveal||[]).forEach(r=>{ if(!known(r)) issues.push("step "+(i+1)+" reveals unknown id '"+r+"' (use an input/gate/output id, or "+[...LOG_PARTS].join(", ")+")"); else seen.add(r); });
    (s.active||[]).forEach(r=>{ if(!known(r)) issues.push("step "+(i+1)+" active unknown id '"+r+"'"); });
    if(s.point&&!known(s.point)) issues.push("step "+(i+1)+" point unknown id '"+s.point+"'");
    if(s.inputs!=null){ if(!Array.isArray(s.inputs)||s.inputs.length!==ins.length) issues.push("step "+(i+1)+" 'inputs' must be a list of "+ins.length+" bits, one per input pin");
      else s.inputs.forEach(b=>{ if(b!==0&&b!==1) issues.push("step "+(i+1)+" 'inputs' may only contain 0 and 1"); }); }
    if(s.row!=null&&(!tt||!(s.row>=0&&s.row<((tt.rows||[]).length)))) issues.push("step "+(i+1)+" 'row' "+s.row+" is not a row of the truth table");
  });
  [...ins,...gates,...outs].forEach(x=>{ if(x.id&&!seen.has(x.id)) issues.push("'"+(x.label||x.id)+"' is never revealed — it will not appear"); });
  if(tt&&!seen.has("table")) issues.push("a truth_table is defined but 'table' is never revealed — bond it to the schematic on the step that enumerates the cases");
  if(bp.expression&&!seen.has("expr")) issues.push("an expression is defined but 'expr' is never revealed");
  return {pass:issues.length===0,issues};
}

/* ═══ TABLE — the ICE grid generalised: a truth table, a comparison matrix, a trace table.
 * One row per beat, because a table dumped whole is a wall the student's eye slides off. ═══ */
const TBL_PARTS = new Set(["head","caption"]);
export function tableCheck(bp){
  const issues=[]; if(!bp||typeof bp!=="object") return {pass:false,issues:["not an object"]};
  if(!bp.meta||!bp.meta.title) issues.push("missing meta.title");
  const cols=Array.isArray(bp.columns)?bp.columns:[], rows=Array.isArray(bp.rows)?bp.rows:[];
  if(cols.length<2) issues.push("need ≥2 columns");
  if(cols.length>8) issues.push("too many columns ("+cols.length+") — 8 is the most that stays readable");
  if(rows.length<2) issues.push("need ≥2 rows");
  if(rows.length>12) issues.push("too many rows ("+rows.length+") — 12 is the most that fits");
  const id={};
  cols.forEach((c,i)=>{ if(!c.id) issues.push("column "+(i+1)+" missing id");
    else { if(id[c.id]) issues.push("duplicate id '"+c.id+"'"); id[c.id]=1; }
    if(!c.label) issues.push("column "+(i+1)+" needs a label");
    if(c.group&&["in","out","danger"].indexOf(c.group)<0) issues.push("column "+(i+1)+" group must be 'in', 'out' or 'danger'"); });
  rows.forEach((r,i)=>{ const rid=r.id||("r"+i);
    if(id[rid]) issues.push("duplicate id '"+rid+"'"); id[rid]=1;
    if(!Array.isArray(r.cells)||r.cells.length!==cols.length) issues.push("row "+(i+1)+" must have exactly "+cols.length+" cells"); });
  const steps=Array.isArray(bp.narration_steps)?bp.narration_steps:[];
  if(steps.length<3) issues.push("too few steps ("+steps.length+", need ≥3)");
  if(steps.length>12) issues.push("too many steps ("+steps.length+")");
  const known=r=>!!id[r]||TBL_PARTS.has(r), seen=new Set();
  steps.forEach((s,i)=>{
    if(!s.narration_text||!s.narration_text.trim()) issues.push("step "+(i+1)+" has no narration");
    if(s.narration_text&&s.narration_text.length>380) issues.push("step "+(i+1)+" narration too long");
    (s.reveal||[]).forEach(r=>{ if(!known(r)) issues.push("step "+(i+1)+" reveals unknown id '"+r+"' (use a row id, a column id, 'head' or 'caption')"); else seen.add(r); });
    (s.active||[]).forEach(r=>{ if(!known(r)) issues.push("step "+(i+1)+" active unknown id '"+r+"'"); });
    if(s.point&&!known(s.point)) issues.push("step "+(i+1)+" point unknown id '"+s.point+"'"); });
  if(!seen.has("head")) issues.push("'head' is never revealed — the column headings must go up first, or the numbers mean nothing");
  rows.forEach((r,i)=>{ const rid=r.id||("r"+i); if(!seen.has(rid)) issues.push("row '"+rid+"' is never revealed — it will not appear"); });
  return {pass:issues.length===0,issues};
}

/* Every layout the engine in app.html can actually draw. A blueprint naming anything else would
 * fall through to the scene renderer and blow up, so it is rejected here and at the response guard. */
export const LAYOUTS = new Set(["scene","tree","flow","cell","graph","orbital","geometry","ice","venn","unitcircle","solve","vectors","matrix","fbd","circuit","logic","table"]);

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
  if(bp && bp.layout==="unitcircle") return unitCircleCheck(bp);
  if(bp && bp.layout==="solve") return solveCheck(bp);
  if(bp && bp.layout==="vectors") return vectorsCheck(bp);
  if(bp && bp.layout==="matrix") return matrixCheck(bp);
  if(bp && bp.layout==="fbd") return fbdCheck(bp);
  if(bp && bp.layout==="circuit") return circuitCheck(bp);
  if(bp && bp.layout==="logic") return logicCheck(bp);
  if(bp && bp.layout==="table") return tableCheck(bp);
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
  if(bp && bp.layout==="unitcircle") return ["unit circle (r = 1)","angle θ = "+(bp.angle==null?50:bp.angle)+"°","cos θ = x","sin θ = y","cos²θ + sin²θ = 1"];
  if(bp && bp.layout==="solve") return (bp.lines||[]).map(l=>(l.math||l.id)+(l.why?"  ("+l.why+")":""))
    .concat(bp.numberline?["solution set: x "+(bp.numberline.op||"≥")+" "+bp.numberline.value]:[]);
  if(bp && bp.layout==="vectors"){ const a=bp.a||[0,0],b=bp.b||[0,0];
    return ["a = ("+a[0]+", "+a[1]+")","b = ("+b[0]+", "+b[1]+")","b slid tip-to-tail","a + b = ("+(a[0]+b[0])+", "+(a[1]+b[1])+")"]; }
  if(bp && bp.layout==="matrix"){ const M=bp.M||[[1,0],[0,1]];
    return ["unit square with i and j","i → ("+M[0][0]+", "+M[1][0]+")","j → ("+M[0][1]+", "+M[1][1]+")","det = "+(M[0][0]*M[1][1]-M[0][1]*M[1][0])+" (area scale factor)"]; }
  if(bp && bp.layout==="fbd") return ["isolate the body"]
    .concat((bp.forces||[]).map(f=>(f.label||f.id)+(f.agent?" — "+f.agent:"")))
    .concat((bp.components||[]).map(c=>c.label||""))
    .concat(bp.net?[bp.net.label||"F_net"]:[])
    .concat(bp.accel?[(bp.accel.label||"a")+" (not a force)"]:[]);
  if(bp && bp.layout==="circuit") return [((bp.battery||{}).label)||"battery"]
    .concat((bp.components||[]).map(c=>c.label||c.id))
    .concat([((bp.current||{}).label)||"current — the same everywhere"])
    .concat((bp.ladder||[]).map(e=>e.label||(((+e.v||0)>0?"+":"")+e.v+" V")));
  if(bp && bp.layout==="logic") return (bp.inputs||[]).map(p=>(p.label||p.id)+" = "+(p.value?1:0))
    .concat((bp.gates||[]).map(g=>(g.type||"")+((g.label)?" — "+g.label:"")))
    .concat((bp.outputs||[]).map(o=>o.label||o.id))
    .concat(bp.truth_table?["truth table — all "+Math.pow(2,(bp.inputs||[]).length)+" rows"]:[]);
  if(bp && bp.layout==="table") return [(bp.columns||[]).map(c=>c.label||c.id).join(" | ")]
    .concat((bp.rows||[]).map(r=>(r.cells||[]).join(" | ")));
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
