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
• MODE "curly" — a CURLY-ARROW REACTION MECHANISM: skeletal species on a dark board, TYPED curved
  arrows showing WHERE A PAIR OF ELECTRONS WENT, a step rail, named intermediate frames and a charge
  ledger. This is the flagship ORGANIC mode — use it for every reaction mechanism (substitution,
  elimination, addition, aromatic substitution, carbonyl chemistry, radicals) and for RESONANCE.
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
• MODE "punnett" — a GENETIC CROSS on a Punnett square: the two parent genotypes split into
  gametes, the gametes become the row and column headers, the cells fill in one at a time, the
  offspring are grouped by phenotype and the ratio is computed on screen. Use for monohybrid and
  dihybrid crosses, test crosses, incomplete dominance and codominance, carrier probability, and
  any "what proportion of the offspring will…" question. This is the flagship genetics mode.
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
growth curves against input size → "graph". DATA STRUCTURES — arrays, strings, stacks, queues,
linked lists, trees, binary search trees, graphs, hash tables, plus the searching/sorting/Big-O
family that lives on them → "tree", organised by the shape of the ACCESS (linear vs non-linear) and
closed with a "choose by the operation, not by the name" branch; this is NOT the last-resort use of
tree. Genuine taxonomies (types of software, network topologies, storage categories, data types,
DBMS models) → "tree" as well.

BIOLOGY ROUTING (biology's default is a SPATIAL SCENE, the inverse of chemistry — reach for
"mechanism" first, not "flow"): membrane transport, diffusion, osmosis, tonicity, the sodium–
potassium pump, facilitated diffusion, signalling and anything happening ACROSS a membrane or
INSIDE a cell → "mechanism" (template membrane_cell — the lumen/cell/blood compartments ARE the two
sides of the membrane). Genetic crosses, Punnett squares, monohybrid and dihybrid ratios, test
crosses, carriers, incomplete dominance and codominance → "punnett". Enzyme kinetics (rate versus
substrate, the temperature and pH optima, competitive versus non-competitive inhibition), population
growth (exponential versus logistic, carrying capacity), oxygen-dissociation curves, the action
potential and predator–prey cycles → "graph". Taxonomy, the rank hierarchy, the three domains and
phylogenetic trees → "tree" (the ONE topic where the whiteboard tree is genuinely the right diagram).
Cellular respiration, photosynthesis, DNA replication, transcription and translation, mitosis and
meiosis, homeostatic feedback loops, the dehydration/hydrolysis cycle and every other ordered
pathway → "flow" (kind "trigger" for what starts it, "process" for a step, "product" for what forms,
"danger" for the classic misconception or pathological case, "outcome" for the result).
SAY BIOLOGY ALOUD PROPERLY: never letter-name an abbreviation in narration — say "deoxyribonucleic
acid", "messenger RNA" (as "messenger R-N-A" only after it has been said in full once), "adenosine
triphosphate" not "A-T-P", "nicotinamide adenine dinucleotide" not "N-A-D-H", "endoplasmic
reticulum" not "E-R". Say "three to one", never "three colon one"; "five prime" and "three prime";
"two n" or "diploid"; "big A little a". For the central dogma NEVER say "turns into" or "becomes" —
say "is used to build", because the DNA is a master copy that is not consumed.

ORGANIC-CHEMISTRY ROUTING (Organic is not Gen Chem: Gen Chem is quantitative and lives in "flow",
Organic is MECHANISTIC and SPATIAL and lives in "curly" — the answer is a drawing, and the reasoning
is where a pair of electrons went). ANY reaction mechanism — proton transfer, S-N-one, S-N-two,
E-one, E-two, electrophilic addition to alkenes, electrophilic aromatic substitution, nucleophilic
addition to carbonyls, radical halogenation, hydride delivery — → "curly". Resonance and electron
pushing → "curly" with "mode":"resonance". Functional groups, the naming-priority order, reagent
classes, isomerism taxonomy, activating/deactivating substituents, and above all the
substitution-versus-elimination decision → "tree" (and for the decision tree EVERY leaf must carry
the mechanistic REASON, never a bare label — a bare flowchart is documented to make this topic
worse, not better). I-U-P-A-C naming and R/S assignment by Cahn–Ingold–Prelog → "solve", one
station per rule, because an early wrong choice silently invalidates everything downstream.
Hybridization, three-dimensional shape, cis/trans, conformers and chirality in space → "geometry".
Causal chains — why this carbocation is more stable, why this proton is acidic, the oxidation
ladder, Zaitsev versus Hofmann — → "flow".
SAY ORGANIC ALOUD PROPERLY: "NEW-klee-oh-file" (nucleophile), "ee-LEK-troh-file" (electrophile),
"car-boh-KAT-eye-on" (carbocation, four syllables — never "kay-shun"), "KY-ral" (chiral, hard K),
"ruh-SEE-mik" (racemic), "mar-KOV-nih-koff", "ZAIT-seff", "grin-YARD" (Grignard — never
"grig-nard"), "uh-REE-nee-um" (arenium). Say the mechanism name IN FULL on first use every video —
"S-N-two, said as letters, meaning substitution nucleophilic bimolecular" — because a student who
has only ever read it silently does not know the two means molecularity. Say "concerted" or
"stepwise" out loud at the start of every mechanism: that one word predicts the stereochemistry,
the kinetics and whether an intermediate exists. And when narrating an arrow, ALWAYS say the TAIL
before the HEAD — "this lone pair, moving to that carbon" — never "the carbon gets attacked".

Decision: try mechanism → cell → punnett → logic → fbd/circuit → unitcircle/solve/vectors/matrix → venn → table → graph → flow first; choose "tree" ONLY if none of the
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
{"meta":{"title":"","subject":"","concept_id":"snake_case_id"},"layout":"table","caption":"","mono":false,"columns":[{"id":"c1","label":"","group":"in"},{"id":"c2","label":"","group":"out"}],"rows":[{"id":"r0","cells":["",""],"note":""}],"note":"","narration_steps":[{"short":"","term":"","narration_text":"","reveal":["head"],"active":["head"],"point":"head"}]}

═══════ MODE "curly" (CURLY-ARROW MECHANISM — the Organic flagship) ═══════
A curved arrow does NOT mean "this atom moves here". It means "this PAIR OF ELECTRONS moves from
here to there". Students import the everyday meaning and read arrows as atoms sliding around, so
this mode makes the TAIL the star of the show.
Rules:
1. "mode": one of "stepwise" (an intermediate really forms), "concerted" (one step, ONE transition
   state, no intermediate — S-N-two, E-two), "resonance" (NOT a reaction — one delocalised molecule
   drawn two ways) or "radical" (single-electron, fishhook arrows). Say this word out loud in the
   first narration step; it predicts the kinetics, the stereochemistry and whether an intermediate
   exists. Optional "reaction": the overall equation as one line (it sits under the title).
2. "frames": 2–6 frames IN ORDER — the step rail. Each {id (f1,f2…), title (a VERB, e.g.
   "nucleophile attacks", "leaving group departs", "proton transfer" — never "step 2"),
   kind: step|ts|intermediate|product|danger, charge (the TOTAL charge on that frame as a string:
   "0", "−1", "+1" — the charge ledger prints it and CHARGE MUST BE CONSERVED across every frame),
   optional badge (the NAME of the species being held: "carbocation", "tetrahedral intermediate",
   "arenium ion", "bromonium ion", "carbanion", "radical", "transition state") and optional why
   (one line on why it is stable or unstable). Give every intermediate its own frame with a badge —
   students routinely fail to notice intermediates exist, and naming one makes it an object rather
   than transit noise.
3. Each frame carries "species": 1–3, each {id, slot: "left"|"center"|"right", label (the structure
   as text — "H₃C—Br", "HO⁻", "(CH₃)₃C⁺", the skeletal formula), optional lp (0–4 lone PAIRS, drawn
   as real dot pairs), optional charge ("−", "+", "δ+"), optional note (≤6 words: "the nucleophile",
   "the leaving group")}.
4. Each frame carries "arrows": 0–3, each {id (a1,a2…), from (a species id IN THIS FRAME), to (a
   species id in this frame — use the SAME id for an arrow that moves electrons WITHIN one molecule),
   tail: "lone-pair"|"sigma"|"pi"|"anion"|"radical" (a single unpaired
   electron — radical mode only) — WHERE THE ELECTRONS SIT, head: "atom"|"empty-orbital"|
   "bond", kind: "pair" (two electrons, full head) or "fishhook" (ONE electron, half head — radicals
   only), label (≤7 words naming tail then head: "lone pair → the carbon")}.
   HARD RULES the renderer enforces: a tail is ALWAYS electron-rich and a head is always electron-
   poor, so an arrow may never START on a species carrying a positive charge or on an empty orbital.
   In "radical" mode every arrow is a fishhook; in every other mode every arrow is a pair.
5. CONCERTED vs STEPWISE is the whole lesson. In "concerted" mode put ALL of a frame's arrows in the
   SAME narration step, and say "at the same time" out loud; the rail then draws the missing
   intermediate as a visible EMPTY slot, which is exactly the contrast with the stepwise case.
   In "stepwise" mode give the intermediate its own frame and dwell on it.
6. narration_steps: 4–10. "reveal"/"active"/"point" use FRAME ids, SPECIES ids and ARROW ids, plus
   the fixed parts "rail" and "ledger". Reveal a frame before its arrows. Animate TAIL FIRST: one
   step names what the electrons are sitting on ("these two electrons — the π bond, not the atom"),
   the next step fires the arrow, the next shows the consequence as the new frame. The last step
   recaps.
7. TEACH THE MISCONCEPTIONS, out loud: the arrow CAUSES the bond change, it does not decorate it;
   electrons move, atoms never do; for resonance the molecule does not flip between the drawings —
   it is one delocalised reality, the weighted average; for electrophilic addition dwell on the fact
   that the tail sits on the π BOND (the first time an arrow starts on a bond rather than an atom,
   and the documented point where students lose trust in the formalism).
Return ONLY valid minified JSON:
{"meta":{"title":"","subject":"","concept_id":"snake_case_id"},"layout":"curly","mode":"stepwise","reaction":"","note":"","frames":[{"id":"f1","title":"","kind":"step","charge":"0","badge":"","why":"","species":[{"id":"nu","slot":"left","label":"","lp":2,"charge":"","note":""}],"arrows":[{"id":"a1","from":"nu","to":"sub","tail":"lone-pair","head":"atom","kind":"pair","label":""}]}],"narration_steps":[{"short":"","term":"","narration_text":"","reveal":["f1"],"active":["nu"],"point":"nu"}]}

═══════ MODE "punnett" (a GENETIC CROSS — gametes, grid, tally, ratio) ═══════
Rules:
1. "parents": {"p1":{"genotype":"Aa","label":"Mother — Aa (carrier)"},"p2":{…}}. The genotype is the
   real allele string; the label says WHO and, if it helps, what they look like.
2. "gametes": {"top":[…],"side":[…]} — the gametes each parent can make, and therefore the COLUMN
   headers (top, from p1) and ROW headers (side, from p2). Monohybrid: 2 and 2. Dihybrid: 4 and 4.
   These must be the actual gametes of the genotypes you gave — that is the whole point of the row:
   the headers are EARNED from meiosis, not handed over.
3. "cells": exactly top.length × side.length entries in ROW-MAJOR order (row 0 left→right, then row
   1 …). Each {id (c00, c01, c10 …), geno (the combined genotype, dominant allele first), pheno (the
   KEY of the trait it shows — must match a "traits" key)}.
4. "traits": 2–4 entries, each {key, label (what that phenotype looks like, e.g. "Tall"), color}.
   Colour-group by phenotype so the ratio is something the student SEES before it is counted.
5. "ratio": the finished ratio in words-and-figures, e.g. "3 : 1  tall to short". OPTIONAL "note":
   one short line under the grid.
6. narration_steps: "reveal"/"active"/"point" use the CELL ids plus these fixed parts: "p1", "p2",
   "gtop" (the column headers), "gside" (the row headers), "tally" (the phenotype counts) and
   "ratio". Reveal "p1" and "p2" first, then the gametes, then the cells (one, or one row, per
   beat), then "tally", then "ratio". 5–10 steps, last recaps.
7. TEACH THE MISCONCEPTIONS, out loud: a ratio is a PROBABILITY, not a promise — three to one does
   not mean that in a family of four exactly one child is affected; each child independently has a
   one-in-four chance. "Dominant" does not mean common, strong or better — it only means it is the
   version you see when it is present. And say where the letters come from: each parent gives ONE
   allele per gene because meiosis halves the number, which is why the headers are single letters
   and the cells are pairs. Spoken words only: "big A little a", "three to one", "heterozygous".
Return ONLY valid minified JSON:
{"meta":{"title":"","subject":"","concept_id":"snake_case_id"},"layout":"punnett","parents":{"p1":{"genotype":"Aa","label":""},"p2":{"genotype":"Aa","label":""}},"gametes":{"top":["A","a"],"side":["A","a"]},"traits":[{"key":"dom","label":"","color":"#7c3aed"},{"key":"rec","label":"","color":"#e0632b"}],"cells":[{"id":"c00","geno":"AA","pheno":"dom"},{"id":"c01","geno":"Aa","pheno":"dom"},{"id":"c10","geno":"Aa","pheno":"dom"},{"id":"c11","geno":"aa","pheno":"rec"}],"ratio":"3 : 1","note":"","narration_steps":[{"short":"","term":"","narration_text":"","reveal":["p1","p2"],"active":["p1"],"point":"p1"}]}`
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
             "Check the boundary case: zero is the one everybody forgets."]} },

  /* ══════════ BIOLOGY (100-level). Nine gold shots, one per routed mode. Biology's default is the
     SPATIAL SCENE — the inverse of chemistry — so the membrane shot comes first and is the one the
     detection gate reaches for whenever the content happens inside or across a cell. ══════════ */

  /* ── BIOLOGY 25: MECHANISM. Osmosis on the membrane_cell scene. Water crosses in BOTH directions
     and the "danger" beat freezes the frame at equilibrium with the molecules still moving — the
     documented misconception is that molecules stop, and that water "wants" to dilute the salt. ── */
  { text: "Explain osmosis and tonicity: why water moves across a membrane towards the more concentrated solution, and what happens to a red blood cell in a hypertonic, hypotonic and isotonic solution.",
    blueprint: {meta:{title:"Osmosis — water crosses both ways, but not equally",subject:"Biology",concept_id:"osmosis_tonicity_membrane"},template:"membrane_cell",
      elements:[{id:"wl1",type:"water",zone:"lumen",lane:0,label:"H2O"},{id:"wl2",type:"water",zone:"lumen",lane:1,label:"H2O"},{id:"wl3",type:"water",zone:"lumen",lane:2,label:"H2O"},
                {id:"aqp",type:"channel",zone:"apical",lane:0,label:"aquaporin"},
                {id:"wc",type:"water",zone:"intra",lane:0,label:"H2O"},
                {id:"s1",type:"node",zone:"blood",lane:0,label:"solute",color:"#e0632b",r:23},{id:"s2",type:"node",zone:"blood",lane:1,label:"solute",color:"#e0632b",r:23},
                {id:"back",type:"water",zone:"baso",lane:1,label:"H2O"},
                {id:"eq",type:"label",zone:"intra",lane:2,label:"equilibrium: still moving, net zero"},
                {id:"wrong",type:"blockx",zone:"intra",lane:3,label:"“water wants to dilute it”"}],
      narration_steps:[
        {short:"Two sides",term:"concentration gradient",narration_text:"Two compartments, one membrane. On the left, mostly water. Notice there is nothing pulling anything — every molecule here is just jiggling about at random.",reveal:["wl1","wl2","wl3"],active:["wl1"],point:"wl1",
         def:"A concentration gradient is simply a difference in how crowded a substance is between two places."},
        {short:"The solute",term:"solute",narration_text:"On the right we add solute — particles too big to slip through. They take up room, so on this side there is less water per unit of space, even though nothing has been removed.",reveal:["s1","s2"],active:["s1"],point:"s1"},
        {short:"The doorway",term:"aquaporin",narration_text:"Water crosses through aquaporins, protein doorways in the membrane. No energy is spent here, which is why this is passive transport rather than a pump.",reveal:["aqp"],active:["aqp"],arrows:[{from:"wl1",to:"aqp",color:"#2563eb"}],point:"aqp"},
        {short:"Both ways",term:"osmosis",narration_text:"Here is the part everyone misses. Water crosses in both directions at once. It is just that the dilute side has more water molecules queueing, so more of them happen to make the trip.",reveal:["wc","back"],active:["wc"],arrows:[{from:"aqp",to:"wc",color:"#2563eb"},{from:"back",to:"aqp",color:"#93c5fd"}],point:"wc"},
        {short:"The trap",term:"teleology",narration_text:"So water does not want to rescue the salty side. Nothing wants anything. Say it as traffic: both lanes are open, one lane simply has more cars in it.",reveal:["wrong"],active:["wrong"],arrows:[{from:"wc",to:"wrong",color:"#dc2626"}],point:"wrong"},
        {short:"Equilibrium",term:"dynamic equilibrium",narration_text:"When the two sides match, the molecules keep crossing — the traffic is now equal in both directions. Equilibrium means net zero movement, not stillness.",reveal:["eq"],active:["eq"],arrows:[{from:"wc",to:"eq",color:"#7c3aed"}],point:"eq"},
        {short:"The payoff",term:"tonicity",narration_text:"Now predict a red cell. Hypertonic solution: more solute outside, so water leaves and the cell shrinks. Hypotonic: water enters and it swells. Isotonic: no net change.",reveal:["s1","s2"],active:["s2"],arrows:[{from:"s2",to:"aqp",color:"#e0632b"}],point:"s2",
         quiz:{q:"A cell is placed in a hypertonic solution. What happens?",options:["It shrinks — water leaves towards the solute","It swells — water is pulled in","Nothing, because water cannot cross"],answer:0,why:"Hypertonic describes the SOLUTION as having more solute, so water leaves the cell and it shrinks."}},
        {short:"Recap",term:"osmosis",narration_text:"Recap. Water moves down its own gradient, which means towards the solute. Both directions always happen. And the words hypertonic and hypotonic describe the solution, never the cell.",reveal:["eq"],active:["aqp"],arrows:[{from:"wl1",to:"aqp",color:"#2563eb"}],point:"aqp"}],
      recap:["Water moves down its OWN gradient — which is towards the solute.",
             "Both directions happen at once; only the net flow is one-way.",
             "Hypertonic and hypotonic describe the SOLUTION, not the cell."]} },

  /* ── BIOLOGY 26: FLOW. Cellular respiration, taught as four stages in three LOCATIONS, because
     location is what the exam asks and what students blur. The proton gradient is the payoff. ── */
  { text: "Cellular respiration: glycolysis in the cytosol, the link reaction and Krebs cycle in the mitochondrial matrix, and the electron transport chain and chemiosmosis on the inner membrane, producing ATP.",
    blueprint: {meta:{title:"Cellular respiration — four stages, three locations",subject:"Biology",concept_id:"cellular_respiration_stages"},layout:"flow",
      nodes:[{id:"glu",label:"Glucose",note:"in the cytosol",kind:"trigger"},
             {id:"gly",label:"Glycolysis",note:"cytosol · 2 pyruvate",kind:"process"},
             {id:"link",label:"Link reaction",note:"matrix · loses CO₂",kind:"process"},
             {id:"krebs",label:"Krebs cycle",note:"matrix · loads carriers",kind:"process"},
             {id:"carr",label:"NADH & FADH₂",note:"the electron taxis",kind:"product"},
             {id:"etc",label:"Electron transport",note:"inner membrane",kind:"process"},
             {id:"grad",label:"H⁺ gradient",note:"water behind a dam",kind:"product"},
             {id:"burn",label:"“Oxygen is burned”",note:"the classic error",kind:"danger"},
             {id:"atp",label:"ATP synthase → ATP",note:"the water wheel",kind:"outcome"}],
      narration_steps:[
        {short:"Where it starts",term:"glycolysis",narration_text:"Glucose never enters the mitochondrion whole. It is split in the cytosol, outside the mitochondrion entirely, in a stage called glycolysis — and that location is worth a mark on its own.",reveal:["glu","gly"],active:["gly"],point:"gly",
         def:"Glycolysis splits one six-carbon glucose into two three-carbon pyruvate molecules, in the cytosol, with no oxygen needed."},
        {short:"Into the matrix",term:"link reaction",narration_text:"Pyruvate is then carried into the matrix, the fluid centre of the mitochondrion. There the link reaction trims a carbon off as carbon dioxide — that is the gas you breathe out.",reveal:["link"],active:["link"],point:"link"},
        {short:"The cycle",term:"Krebs cycle",narration_text:"The Krebs cycle finishes stripping the carbons. But do not track the carbon here — track the electrons, because those are what the cell is actually harvesting.",reveal:["krebs"],active:["krebs"],point:"krebs"},
        {short:"The couriers",term:"electron carriers",narration_text:"Reduced nicotinamide adenine dinucleotide and reduced flavin adenine dinucleotide are not products to memorise. They are couriers, and they are carrying electrons to the next stage.",reveal:["carr"],active:["carr"],point:"carr"},
        {short:"The pumps",term:"electron transport chain",narration_text:"They unload on the inner membrane. As electrons drop from carrier to carrier, the energy released is used to pump protons out into the intermembrane space.",reveal:["etc"],active:["etc"],point:"etc"},
        {short:"The dam",term:"proton gradient",narration_text:"Protons pile up on one side. That crowding is the real battery of the cell — think of water held behind a dam, storing energy purely by being on the high side.",reveal:["grad"],active:["grad"],point:"grad",
         quiz:{q:"What is oxygen's actual job in respiration?",options:["It accepts the electrons at the end of the chain","It is burned to release energy","It carries the electrons to the membrane"],answer:0,why:"Oxygen is the FINAL ELECTRON ACCEPTOR — it takes the spent electrons and, with protons, forms water."}},
        {short:"The trap",term:"final electron acceptor",narration_text:"Which is where oxygen comes in — and it is not burned. It sits at the end of the chain and accepts the tired electrons, joining protons to make water. Without it, the whole queue backs up.",reveal:["burn"],active:["burn"],point:"burn"},
        {short:"The turbine",term:"chemiosmosis",narration_text:"The protons rush back through adenosine triphosphate synthase, spinning it like a water wheel. That spin is what makes the adenosine triphosphate. This is chemiosmosis.",reveal:["atp"],active:["atp"],point:"atp"},
        {short:"Recap",term:"recap",narration_text:"Recap. Glycolysis in the cytosol, link and Krebs in the matrix, transport chain on the inner membrane. Carriers move electrons, electrons build a proton gradient, and the gradient makes the energy.",reveal:["glu","atp"],active:["atp"],point:"atp"}],
      recap:["Location is the exam question: cytosol → matrix → inner membrane.",
             "The carriers move ELECTRONS; the proton gradient is the actual battery.",
             "Oxygen is the final electron acceptor — it is never 'burned'."]} },

  /* ── BIOLOGY 27: FLOW. Photosynthesis as a supply LOOP between two reaction sets, ending with the
     side-by-side beat that kills the "plants only respire at night" misconception. ── */
  { text: "Photosynthesis: the light-dependent reactions in the thylakoid membrane split water and make ATP and NADPH, which the light-independent Calvin cycle in the stroma uses to fix carbon dioxide into glucose.",
    blueprint: {meta:{title:"Photosynthesis — two reaction sets, one supply loop",subject:"Biology",concept_id:"photosynthesis_light_and_calvin"},layout:"flow",
      nodes:[{id:"light",label:"Light hits chlorophyll",note:"thylakoid membrane",kind:"trigger"},
             {id:"split",label:"Water is split",note:"where the O₂ comes from",kind:"process"},
             {id:"o2",label:"Oxygen released",note:"from H₂O, not CO₂",kind:"product"},
             {id:"carr",label:"ATP + reduced NADP",note:"handed to the stroma",kind:"product"},
             {id:"calvin",label:"Calvin cycle",note:"stroma · no light needed",kind:"process"},
             {id:"fix",label:"CO₂ fixed",note:"carbon joins the cycle",kind:"process"},
             {id:"glu",label:"Glucose built",note:"energy stored, not released",kind:"outcome"},
             {id:"night",label:"“Plants only respire at night”",note:"the classic error",kind:"danger"},
             {id:"back",label:"Spent carriers return",note:"the loop closes",kind:"outcome"}],
      narration_steps:[
        {short:"The trigger",term:"light-dependent reactions",narration_text:"Light lands on chlorophyll in the thylakoid membrane. Only this half of photosynthesis needs light, which is why it is called the light-dependent stage.",reveal:["light"],active:["light"],point:"light"},
        {short:"Splitting water",term:"photolysis",narration_text:"That energy is used to rip water apart. Notice what was split: water. Not carbon dioxide.",reveal:["split"],active:["split"],point:"split"},
        {short:"Where O₂ comes from",term:"oxygen",narration_text:"So the oxygen a plant gives off came from the water it drank, not from the carbon dioxide it absorbed. Isotope experiments settled this, and it is a favourite exam trap.",reveal:["o2"],active:["o2"],point:"o2",
         quiz:{q:"The oxygen released by photosynthesis comes from…",options:["water","carbon dioxide","glucose"],answer:0,why:"Light splits WATER (photolysis). The carbon dioxide's oxygen ends up in glucose and in more water."}},
        {short:"The handover",term:"ATP and reduced NADP",narration_text:"The light stage also loads two carriers — adenosine triphosphate and reduced nicotinamide adenine dinucleotide phosphate — and passes them across into the stroma.",reveal:["carr"],active:["carr"],point:"carr"},
        {short:"The other half",term:"Calvin cycle",narration_text:"In the stroma sits the Calvin cycle. It is called light-independent because it needs no light itself, but it stops in the dark anyway — it starves without the carriers.",reveal:["calvin"],active:["calvin"],point:"calvin"},
        {short:"Fixing carbon",term:"carbon fixation",narration_text:"Carbon dioxide is grabbed from the air and bolted onto a five-carbon acceptor. This is fixation: turning a gas into part of a solid molecule.",reveal:["fix"],active:["fix"],point:"fix"},
        {short:"Building glucose",term:"anabolic",narration_text:"Using the carriers' energy, the cycle builds glucose. Photosynthesis stores energy in a molecule — it does not release it. That is respiration's job, and it is the reverse.",reveal:["glu"],active:["glu"],point:"glu"},
        {short:"The trap",term:"plants respire too",narration_text:"Which brings us to the most stubborn error in biology. A plant respires every second of its life, day and night. In daylight it simply photosynthesises faster than it respires.",reveal:["night"],active:["night"],point:"night"},
        {short:"The loop",term:"the supply loop",narration_text:"The emptied carriers travel back to the thylakoid to be reloaded. Drawn properly this is a loop, not two lists — and that loop is the reason either half alone would stall.",reveal:["back"],active:["back"],point:"back"},
        {short:"Recap",term:"recap",narration_text:"Recap. Light splits water in the thylakoid and loads the carriers; the stroma spends them fixing carbon dioxide into glucose; the empty carriers go back for more.",reveal:["light","back"],active:["back"],point:"back"}],
      recap:["The oxygen released comes from WATER, not from carbon dioxide.",
             "Photosynthesis stores energy; respiration releases it — plants do both.",
             "The two stages are a supply loop: carriers out, empty carriers back."]} },

  /* ── BIOLOGY 28: FLOW. DNA replication. The lagging strand is not an accident, it is a CONSEQUENCE
     of one-directional synthesis — that framing is the whole lesson. ── */
  { text: "DNA replication is semi-conservative: helicase unwinds the double helix, primase lays down primers, DNA polymerase builds the leading strand continuously and the lagging strand in Okazaki fragments, and ligase seals the nicks.",
    blueprint: {meta:{title:"DNA replication — why one strand is built backwards in pieces",subject:"Biology",concept_id:"dna_replication_leading_lagging"},layout:"flow",
      nodes:[{id:"helix",label:"Double helix",note:"two antiparallel strands",kind:"trigger"},
             {id:"heli",label:"Helicase unzips",note:"breaks the base pairs",kind:"process"},
             {id:"prim",label:"Primase lays a primer",note:"polymerase needs a start",kind:"process"},
             {id:"rule",label:"Builds 5′ → 3′ only",note:"the one-way rule",kind:"danger"},
             {id:"lead",label:"Leading strand",note:"one smooth run",kind:"process"},
             {id:"lag",label:"Lagging strand",note:"restarts every time",kind:"process"},
             {id:"okaz",label:"Okazaki fragments",note:"short pieces",kind:"product"},
             {id:"lig",label:"Ligase seals the nicks",note:"one continuous strand",kind:"process"},
             {id:"semi",label:"Semi-conservative",note:"one old, one new strand",kind:"outcome"}],
      narration_steps:[
        {short:"The setup",term:"antiparallel",narration_text:"Start with the helix. The two strands run in opposite directions — one reads five prime to three prime, the other the other way. Hold onto that; it causes everything that follows.",reveal:["helix"],active:["helix"],point:"helix",
         def:"Antiparallel means the two strands of DNA run in opposite chemical directions, like two lanes of traffic."},
        {short:"Unzipping",term:"helicase",narration_text:"Helicase runs along and unzips the pairs, opening a Y-shaped replication fork. It breaks only the weak hydrogen bonds between bases, never the backbone.",reveal:["heli"],active:["heli"],point:"heli"},
        {short:"A foothold",term:"primer",narration_text:"Polymerase cannot start from nothing — it can only extend. So primase lays down a short primer for it to build from, like giving a climber the first handhold.",reveal:["prim"],active:["prim"],point:"prim"},
        {short:"The one-way rule",term:"5′ to 3′",narration_text:"Here is the rule that explains the whole topic. Polymerase can only add bases in one direction, five prime to three prime. It physically cannot work the other way.",reveal:["rule"],active:["rule"],point:"rule",
         quiz:{q:"Why does the lagging strand come in pieces?",options:["Polymerase can only build one way, so it must keep restarting","Because that strand is damaged","Because ligase cuts it up"],answer:0,why:"The fork opens in the direction that strand cannot be built, so polymerase jumps back and restarts each time."}},
        {short:"The easy one",term:"leading strand",narration_text:"On one template that direction happens to point towards the opening fork. Polymerase just glides along in one continuous run. That is the leading strand.",reveal:["lead"],active:["lead"],point:"lead"},
        {short:"The awkward one",term:"lagging strand",narration_text:"On the other template the fork opens the wrong way. So polymerase builds a short stretch, jumps back to the fork, and starts again. Watch that jump — it is the explanation.",reveal:["lag"],active:["lag"],point:"lag"},
        {short:"The pieces",term:"Okazaki fragments",narration_text:"Those short stretches are Okazaki fragments. And note this: nothing is ever built backwards. The enzyme always works the same way; the fork is what keeps moving away.",reveal:["okaz"],active:["okaz"],point:"okaz"},
        {short:"Stitching",term:"ligase",narration_text:"Ligase then seals the gaps between fragments, so the finished strand is every bit as continuous as the leading one. You could not tell them apart afterwards.",reveal:["lig"],active:["lig"],point:"lig"},
        {short:"The payoff",term:"semi-conservative",narration_text:"Each new double helix keeps one original strand and one new one. Semi means half — half of the old molecule is conserved in each copy. That is what the word is telling you.",reveal:["semi"],active:["semi"],point:"semi"},
        {short:"Recap",term:"recap",narration_text:"Recap. Unzip, prime, build. One strand runs smoothly, the other restarts because polymerase only works one way, and ligase joins the pieces. Every copy keeps one old strand.",reveal:["helix","semi"],active:["semi"],point:"semi"}],
      recap:["Polymerase builds 5′ → 3′ ONLY — everything odd follows from that.",
             "The lagging strand is a consequence, not an accident or a fault.",
             "Semi-conservative: each new helix keeps one original strand."]} },

  /* ── BIOLOGY 29: FLOW. The central dogma. The documented error is reading the arrow as "turns
     into"; the fix is stating out loud that the DNA is not consumed and never leaves. ── */
  { text: "Transcription and translation: DNA in the nucleus is transcribed into messenger RNA, which travels to a ribosome where transfer RNA brings amino acids matching each codon, building a polypeptide until a stop codon is reached.",
    blueprint: {meta:{title:"The central dogma — a copy, not a conversion",subject:"Biology",concept_id:"transcription_translation_central_dogma"},layout:"flow",
      nodes:[{id:"dna",label:"DNA in the nucleus",note:"the master copy",kind:"trigger"},
             {id:"trans",label:"Transcription",note:"mRNA built alongside",kind:"process"},
             {id:"intact",label:"DNA left intact",note:"nothing was used up",kind:"danger"},
             {id:"splice",label:"Introns spliced out",note:"message gets shorter",kind:"process"},
             {id:"exit",label:"mRNA leaves the nucleus",note:"DNA stays behind",kind:"process"},
             {id:"ribo",label:"Ribosome reads codons",note:"three bases at a time",kind:"process"},
             {id:"trna",label:"tRNA brings an amino acid",note:"anticodon pairs with codon",kind:"product"},
             {id:"chain",label:"Polypeptide grows",note:"amino acids joined in order",kind:"product"},
             {id:"stop",label:"Stop codon releases it",note:"no amino acid at all",kind:"outcome"}],
      narration_steps:[
        {short:"The master copy",term:"the gene",narration_text:"Start in the nucleus, where the deoxyribonucleic acid lives. Think of it as the master document in a locked room — it holds the instructions, and it never leaves.",reveal:["dna"],active:["dna"],point:"dna"},
        {short:"Copying",term:"transcription",narration_text:"Transcription builds a messenger RNA strand alongside one exposed side of the gene, base by base. It is being copied, and copying takes nothing away from the original.",reveal:["trans"],active:["trans"],point:"trans",
         def:"Transcription copies one gene's sequence into a strand of messenger RNA. The DNA is a template, not an ingredient."},
        {short:"The big trap",term:"not a conversion",narration_text:"So watch the deoxyribonucleic acid: it is still there, unchanged. More than a third of students say the DNA is converted into RNA. It is not. Say built from, never turns into.",reveal:["intact"],active:["intact"],point:"intact",
         quiz:{q:"What does the arrow in DNA → RNA actually mean?",options:["RNA is built USING DNA as a template","DNA is converted into RNA","The RNA was already there and is released"],answer:0,why:"It is a copy, not a conversion. The DNA is a template and survives completely unchanged."}},
        {short:"Editing",term:"splicing",narration_text:"Before it leaves, the non-coding stretches called introns are cut out and the coding exons are joined. That is why the finished message is shorter than the gene it came from.",reveal:["splice"],active:["splice"],point:"splice"},
        {short:"Why a copy",term:"messenger RNA",narration_text:"Now the reason for all this. The DNA is too precious and too large to leave, so a short disposable copy carries the message out to the cytosol instead.",reveal:["exit"],active:["exit"],point:"exit"},
        {short:"Reading",term:"codon",narration_text:"At the ribosome the message is read three bases at a time. Each triplet is a codon, and a codon is simply a three-letter word meaning one amino acid.",reveal:["ribo"],active:["ribo"],point:"ribo"},
        {short:"Delivery",term:"transfer RNA",narration_text:"Transfer RNA arrives carrying an amino acid, and its anticodon pairs with the codon. Note that it fetches an amino acid that was already floating about — translation does not make them.",reveal:["trna"],active:["trna"],point:"trna"},
        {short:"Building",term:"polypeptide",narration_text:"Each delivery adds one link to a growing chain. The order of the codons sets the order of the amino acids, and that order is what decides the protein's shape.",reveal:["chain"],active:["chain"],point:"chain"},
        {short:"The end",term:"stop codon",narration_text:"Then a stop codon arrives. No transfer RNA matches it and no amino acid is added — it is a full stop, not a final word. The finished chain is released.",reveal:["stop"],active:["stop"],point:"stop"},
        {short:"Recap",term:"recap",narration_text:"Recap. The gene is photocopied, never spent. The copy is edited, carried out, and read three letters at a time while transfer RNA delivers the matching amino acids in order.",reveal:["dna","stop"],active:["stop"],point:"stop"}],
      recap:["The arrow means 'is used to build', never 'turns into'.",
             "A codon is three bases naming one amino acid; a stop codon adds none.",
             "Amino acids already exist — transfer RNA fetches them, it does not make them."]} },

  /* ── BIOLOGY 30: GRAPH. Enzyme kinetics — the rate-versus-substrate curve, saturation, and the two
     inhibitors, which are only distinguishable ON the curve. ── */
  { text: "Enzyme kinetics: sketch the rate of reaction against substrate concentration, showing Vmax, Km, saturation of the active sites, and how competitive and non-competitive inhibitors change the curve.",
    blueprint: {meta:{title:"Enzyme kinetics — why the rate stops rising",subject:"Biology",concept_id:"enzyme_kinetics_vmax_km"},layout:"graph",
      x:{min:0,max:10,label:"substrate concentration"},y:{min:0,max:110,label:"rate of reaction"},
      curves:[{id:"normal",color:"#0d9488",label:"no inhibitor",points:[[0,0],[1,33],[2,55],[3,68],[4,77],[6,87],[8,93],[10,96]]},
              {id:"comp",color:"#2563eb",dash:true,points:[[0,0],[1,15],[2,28],[3,39],[4,48],[6,63],[8,74],[10,82]]},
              {id:"noncomp",color:"#dc2626",dash:true,points:[[0,0],[1,19],[2,32],[3,40],[4,45],[6,51],[8,54],[10,56]]}],
      markers:[{id:"lin",at:[1,33],label:"sites still free",color:"#0d9488"},
               {id:"vmax",at:[9,95],label:"Vmax — every site busy",color:"#7c3aed"},
               {id:"km",at:[1.6,48],label:"Km — half of Vmax",color:"#b45309",drop:true},
               {id:"kmc",at:[6,63],label:"competitive: Km rises, Vmax unchanged",color:"#2563eb"},
               {id:"vlow",at:[8,54],label:"non-competitive: Vmax falls",color:"#dc2626"}],
      narration_steps:[
        {short:"Two axes",term:"rate",narration_text:"Substrate concentration runs across, reaction rate goes up. Before anything else, decide what you expect: add more substrate, get more product. Let us see how far that holds.",reveal:["normal","lin"],active:["lin"],point:"lin"},
        {short:"The steep part",term:"collisions",narration_text:"At low concentration the line climbs almost straight. Most active sites are sitting empty, so nearly every extra substrate molecule finds one and gets converted.",reveal:["lin"],active:["lin"],point:"lin"},
        {short:"Levelling off",term:"saturation",narration_text:"Then it bends. The enzymes are now saturated — every active site is already occupied, so extra substrate simply queues. Enzyme number, not substrate, is the limit here.",reveal:["vmax"],active:["vmax"],point:"vmax",
         def:"Saturation means every active site is occupied, so adding more substrate cannot make the reaction faster."},
        {short:"Vmax",term:"Vmax",narration_text:"That ceiling is V max, the maximum rate. And notice the enzymes are not used up on the way there — one enzyme turns over thousands of molecules, which is exactly why so few are needed.",reveal:["vmax"],active:["vmax"],point:"vmax"},
        {short:"Km",term:"Km",narration_text:"Halfway up sits K m, the substrate concentration giving half the maximum rate. A low K m means the enzyme grabs substrate eagerly; a high one means it needs plenty about.",reveal:["km"],active:["km"],point:"km"},
        {short:"Competitive",term:"competitive inhibition",narration_text:"A competitive inhibitor sits in the active site itself. Flood the cell with enough substrate and it wins the race back — so the ceiling is unchanged, it just takes more substrate to reach it.",reveal:["comp","kmc"],active:["kmc"],point:"kmc",
         quiz:{q:"How do you tell the two inhibitors apart on this graph?",options:["Competitive raises Km but keeps Vmax; non-competitive lowers Vmax","Both lower Vmax equally","Competitive lowers Vmax and Km"],answer:0,why:"A competitive inhibitor can be out-competed by more substrate, so the ceiling is unchanged — only Km shifts right."}},
        {short:"Non-competitive",term:"non-competitive inhibition",narration_text:"A non-competitive inhibitor binds somewhere else and bends the active site out of shape. No amount of substrate fixes that, so the ceiling itself drops.",reveal:["noncomp","vlow"],active:["vlow"],point:"vlow"},
        {short:"Recap",term:"recap",narration_text:"Recap. The curve flattens because sites saturate, not because the enzyme is used up. Competitive inhibitors move K m across; non-competitive ones pull V max down.",reveal:["normal","comp","noncomp"],active:["vmax"],point:"vmax"}],
      recap:["The curve plateaus because active sites saturate — enzymes are not consumed.",
             "Km is the substrate concentration at half of Vmax: low Km = high affinity.",
             "Competitive shifts Km right; non-competitive drags Vmax down."]} },

  /* ── BIOLOGY 31: GRAPH. Population growth — exponential versus logistic. The J and the S on the
     same axes is what makes carrying capacity mean something. ── */
  { text: "Population growth: compare exponential (J-shaped) growth with logistic (S-shaped) growth, explaining the lag phase, the exponential phase, carrying capacity K and what environmental resistance does.",
    blueprint: {meta:{title:"Population growth — the J curve and the S curve",subject:"Biology",concept_id:"population_growth_logistic"},layout:"graph",
      x:{min:0,max:12,label:"time (generations)"},y:{min:0,max:1100,label:"population size"},
      curves:[{id:"expo",color:"#dc2626",dash:true,points:[[0,10],[2,26],[4,72],[6,200],[8,540],[9.5,900],[10.6,1080]]},
              {id:"log",color:"#0d9488",points:[[0,10],[2,26],[4,72],[6,190],[8,400],[9,560],[10,690],[11,760],[12,790]]},
              {id:"kline",color:"#7c3aed",dash:true,points:[[0,800],[12,800]]}],
      markers:[{id:"lag",at:[1.4,20],label:"lag — few breeders yet",color:"#8a8398"},
               {id:"exp",at:[8,540],label:"J curve — nothing limits it",color:"#dc2626"},
               {id:"slow",at:[10,690],label:"S curve — resistance bites",color:"#0d9488"},
               {id:"K",at:[10.8,800],label:"K — births ≈ deaths",color:"#7c3aed"}],
      narration_steps:[
        {short:"The axes",term:"population size",narration_text:"Time runs across, number of individuals goes up. We will put two stories on the same axes: what growth would do unchecked, and what it actually does.",reveal:["log","lag"],active:["lag"],point:"lag"},
        {short:"Slow start",term:"lag phase",narration_text:"It begins almost flat. Not because conditions are poor, but because there are so few individuals that even fast breeding adds very little. Ten doubling to twenty is still only ten more.",reveal:["lag"],active:["lag"],point:"lag"},
        {short:"Take-off",term:"exponential growth",narration_text:"Then it turns upwards steeply. Each generation multiplies rather than adds, so the same rate produces far bigger jumps. This is the J shape, and it is what growth does with no limits.",reveal:["expo","exp"],active:["exp"],point:"exp",
         def:"Exponential growth multiplies the population by a constant factor each generation, so the curve steepens without end."},
        {short:"Reality",term:"environmental resistance",narration_text:"But the red curve is a fantasy — it needs endless food and space. In reality food runs short, waste builds up, disease spreads and predators arrive. Together that is environmental resistance.",reveal:["slow"],active:["slow"],point:"slow"},
        {short:"The ceiling",term:"carrying capacity",narration_text:"So the real curve bends over and settles at K, the carrying capacity: the largest population the habitat can sustain. Here births roughly equal deaths — busy, but no longer growing.",reveal:["kline","K"],active:["K"],point:"K",
         quiz:{q:"What is happening to the population at carrying capacity?",options:["Births and deaths are roughly equal","Nothing is being born any more","The population has stopped moving entirely"],answer:0,why:"K is a dynamic balance: individuals are still born and still die, but the two rates cancel out."}},
        {short:"Not stillness",term:"dynamic balance",narration_text:"Careful though — flat does not mean frozen. Individuals are still born and still dying at K; the two simply cancel. And K is not fixed, because a wetter year can raise it.",reveal:["K"],active:["K"],point:"K"},
        {short:"Recap",term:"recap",narration_text:"Recap. The J curve is growth with nothing in the way; the S curve is growth meeting a real world. The gap between the two lines is environmental resistance, drawn to scale.",reveal:["expo","log","kline"],active:["kline"],point:"K"}],
      recap:["J-shaped = exponential, unlimited; S-shaped = logistic, real.",
             "The gap between the two curves IS environmental resistance.",
             "At K births ≈ deaths — a busy balance, not a frozen population."]} },

  /* ── BIOLOGY 32: TREE. Taxonomy. The one biology topic where the whiteboard tree is genuinely the
     right diagram, not a fallback — and the place to kill the read-across-the-tips error. ── */
  { text: "Taxonomy and classification: the rank hierarchy from domain down to species, the three domains including why archaea are not bacteria, binomial nomenclature, and how to read relatedness on a phylogenetic tree.",
    blueprint: {meta:{title:"Classification — ranks, domains, and reading a tree",subject:"Biology",concept_id:"taxonomy_ranks_domains"},layout:"tree",root:"life",
      nodes:[{id:"life",label:"All life",note:"one shared ancestry"},
             {id:"ranks",label:"The eight ranks",parent:"life",note:"domain → species"},
             {id:"mnem",label:"Nested, not listed",parent:"ranks",note:"each rank sits inside the last"},
             {id:"binom",label:"Binomial name",parent:"ranks",note:"genus + species, italic"},
             {id:"doms",label:"Three domains",parent:"life",note:"the top rank"},
             {id:"bact",label:"Bacteria",parent:"doms",note:"prokaryote, no nucleus"},
             {id:"arch",label:"Archaea",parent:"doms",note:"prokaryote, different chemistry"},
             {id:"euk",label:"Eukarya",parent:"doms",note:"has a nucleus"},
             {id:"kin",label:"Four eukaryote kingdoms",parent:"euk",note:"protists, fungi, plants, animals"},
             {id:"read",label:"Reading a phylogeny",parent:"life",note:"relatedness lives at the nodes"},
             {id:"tips",label:"Never read the tips",parent:"read",note:"tip order is arbitrary"},
             {id:"mrca",label:"Trace to the branch point",parent:"read",note:"the common ancestor"}],
      narration_steps:[
        {short:"One tree",term:"classification",narration_text:"Classification is not a filing system someone invented for tidiness. It is a claim about ancestry — the groups are meant to reflect who is descended from whom.",reveal:["life"],active:["life"],point:"life"},
        {short:"Eight ranks",term:"taxonomic ranks",narration_text:"There are eight ranks: domain, kingdom, phylum, class, order, family, genus, species. Any silly sentence will hold the order for you as long as the first letters match.",reveal:["ranks"],active:["ranks"],point:"ranks"},
        {short:"Nested boxes",term:"nested hierarchy",narration_text:"They are nested, not stacked side by side. Every family sits wholly inside one order, which sits wholly inside one class. Think boxes within boxes, never a ranking of importance.",reveal:["mnem"],active:["mnem"],point:"mnem"},
        {short:"The name",term:"binomial nomenclature",narration_text:"The last two ranks make the name: genus first with a capital, species second in lower case, both in italics. Homo sapiens is genus plus species, not a first name and a surname.",reveal:["binom"],active:["binom"],point:"binom"},
        {short:"Top rank",term:"domain",narration_text:"At the very top sit three domains. This is the broadest split we make, and it is based on deep molecular differences rather than on anything you could see.",reveal:["doms"],active:["doms"],point:"doms"},
        {short:"Bacteria",term:"Bacteria",narration_text:"Bacteria are prokaryotes: no nucleus, and no membrane-bound organelles at all. Students remember the missing nucleus and forget the rest of that sentence.",reveal:["bact"],active:["bact"],point:"bact"},
        {short:"Archaea",term:"Archaea",narration_text:"Archaea look like bacteria under a microscope but their membranes and their genetic machinery are quite different. Some of it is closer to ours than to a bacterium's.",reveal:["arch"],active:["arch"],point:"arch",
         quiz:{q:"Why are archaea placed in their own domain?",options:["Their membrane and genetic machinery differ fundamentally from bacteria","They are much larger","They have a nucleus"],answer:0,why:"They look bacterial but are biochemically distinct — in some respects closer to eukaryotes than to bacteria."}},
        {short:"Eukarya",term:"Eukarya",narration_text:"Eukarya is everything with a nucleus, which includes you. And within it sit the familiar kingdoms — protists, fungi, plants and animals.",reveal:["euk","kin"],active:["euk"],point:"euk"},
        {short:"Reading a tree",term:"phylogenetic tree",narration_text:"Now the skill this all exists for: reading a phylogeny. The information is not in the tips. It is in the branch points.",reveal:["read"],active:["read"],point:"read"},
        {short:"The error",term:"tip reading",narration_text:"Two species drawn next to each other need not be close relatives. Branches swivel freely at every node, so the left-to-right order of the tips carries no meaning at all.",reveal:["tips"],active:["tips"],point:"tips"},
        {short:"The fix",term:"common ancestor",narration_text:"Instead, trace back from both species until the lines meet. The more recently they meet, the more closely related they are. That meeting point is the only evidence you need.",reveal:["mrca"],active:["mrca"],point:"mrca"},
        {short:"Recap",term:"recap",narration_text:"Recap. Eight nested ranks, three domains, and a two-part italic name. And when you read a tree, ignore the tips and trace back to where the branches meet.",reveal:["life","mrca"],active:["mrca"],point:"mrca"}],
      recap:["The ranks are NESTED boxes, not a ladder of importance.",
             "Archaea are prokaryotes but biochemically distinct from bacteria.",
             "Relatedness is read from the most recent common ancestor, never from tip order."]} },

  /* ── BIOLOGY 33: PUNNETT. The flagship genetics build. The gametes are shown being EARNED from the
     parents before they become headers, and the ratio is stated as a probability, not a promise. ── */
  { text: "Two parents who are both carriers of cystic fibrosis (both Aa) have a child. Use a Punnett square to work out the genotype and phenotype ratios of their offspring and the chance that a child is affected.",
    blueprint: {meta:{title:"A monohybrid cross — two carriers, Aa × Aa",subject:"Biology",concept_id:"monohybrid_cross_carrier_3to1"},layout:"punnett",
      parents:{p1:{genotype:"Aa",label:"Mother — Aa (carrier, unaffected)"},p2:{genotype:"Aa",label:"Father — Aa (carrier, unaffected)"}},
      gametes:{top:["A","a"],side:["A","a"]},
      traits:[{key:"un",label:"Unaffected",color:"#0d9488"},{key:"aff",label:"Affected",color:"#dc2626"}],
      cells:[{id:"c00",geno:"AA",pheno:"un",note:"homozygous"},
             {id:"c01",geno:"Aa",pheno:"un",note:"carrier"},
             {id:"c10",geno:"Aa",pheno:"un",note:"carrier"},
             {id:"c11",geno:"aa",pheno:"aff",note:"affected"}],
      ratio:"3 : 1  unaffected to affected   ·   genotypes 1 : 2 : 1",
      note:"Each pregnancy is an independent one-in-four chance — the square is a probability, not a plan.",
      narration_steps:[
        {short:"The parents",term:"heterozygous",narration_text:"Both parents are big A little a. They carry one working copy and one faulty copy, and because the working copy is dominant, neither of them shows the condition at all.",reveal:["p1","p2"],active:["p1"],point:"p1",
         def:"Heterozygous means the two alleles for a gene are different — here one dominant and one recessive."},
        {short:"Not stronger",term:"dominant",narration_text:"And be careful with dominant. It does not mean stronger, better, or more common in the population. It only means that when it is present, it is the version you see.",reveal:["p2"],active:["p2"],point:"p2",
         quiz:{q:"What does 'dominant' actually mean?",options:["It is the version expressed when present","It is the more common allele","It is the healthier allele"],answer:0,why:"Dominant describes expression only. Plenty of dominant alleles are rare, and some cause disease."}},
        {short:"Gametes",term:"gamete",narration_text:"Now, where do the letters in the grid come from? Meiosis. Each parent halves their pairs, so every egg and every sperm carries just one allele — either big A or little a.",reveal:["gtop"],active:["gtop"],point:"gtop"},
        {short:"The headers",term:"the grid",narration_text:"Those gametes become the headers: father's along the top, mother's down the side. So a header is a single letter and a cell is a pair, because a cell is one gamete meeting another.",reveal:["gside"],active:["gside"],point:"gside"},
        {short:"Filling in",term:"genotype",narration_text:"Fill each cell by taking its column letter and its row letter. Top left, big A meets big A, giving two big A's — homozygous dominant, and definitely unaffected.",reveal:["c00"],active:["c00"],point:"c00"},
        {short:"The carriers",term:"carrier",narration_text:"The two diagonal cells each get one of each letter. These children are carriers, just like their parents: they have the faulty allele but the dominant copy masks it entirely.",reveal:["c01","c10"],active:["c01"],point:"c01"},
        {short:"The affected one",term:"homozygous recessive",narration_text:"And bottom right, little a meets little a. With no working copy at all, this is the only combination that shows the condition. That is why two healthy parents can have an affected child.",reveal:["c11"],active:["c11"],point:"c11"},
        {short:"Counting",term:"phenotype ratio",narration_text:"Count the colours rather than the letters. Three unaffected to one affected — the classic three to one. The genotypes underneath go one to two to one, which is a different ratio entirely.",reveal:["tally"],active:["tally"],point:"tally"},
        {short:"The trap",term:"probability",narration_text:"Now the mistake almost everyone makes. Three to one does not promise that one child in four is affected. Each pregnancy is a fresh one-in-four chance, exactly like tossing a coin.",reveal:["ratio"],active:["ratio"],point:"ratio",
         quiz:{q:"Three children are unaffected. What is the chance the fourth is affected?",options:["One in four — the same as every time","Certain, because the ratio must balance","Zero, the affected slot is used up"],answer:0,why:"Each fertilisation is independent. The square gives a probability per child, not a quota for the family."}},
        {short:"Recap",term:"recap",narration_text:"Recap. The headers come from meiosis, one allele each. Cells are pairs. Three in four unaffected, one in four affected — and that one in four applies afresh to every single child.",reveal:["ratio"],active:["ratio"],point:"ratio"}],
      recap:["The headers are gametes — one allele each, because meiosis halves the pairs.",
             "Dominant means 'the version you see', not stronger, better or commoner.",
             "3 : 1 is a probability per child, not a quota for the family."]} },

  /* ══════════ COMPUTER STUDIES (100-level), part two. The two modes the subject needs that the
     first pass did not cover: every base-conversion / encoding question is a STEP PROBLEM and
     belongs on "solve", and every data-structures question is a FAMILY and belongs on "tree" until
     the dedicated ds canvas exists. Both shots are built around the documented failure, not around
     the procedure: reading remainders in the wrong direction, and choosing a structure by its name
     instead of by the operation it has to be fast at. ══════════ */

  /* ── COMPUTER STUDIES 34: solve — denary → binary by repeated division, then the nibble jump to
     hex. The corpus is unambiguous that the near-universal error is reading the remainder column
     downwards, so the read-upwards move gets a LINE of its own rather than a footnote, and the hex
     step is done straight from the bits so the "detour through decimal" habit never forms. ── */
  { text: "Convert the denary number 45 into binary using repeated division by 2, then write it in hexadecimal.",
    blueprint: {meta:{title:"45 in binary — and why the remainders are read upwards",subject:"Computer Studies",concept_id:"denary_to_binary_hex"},layout:"solve",
      problem:"Convert  45₁₀  to binary, then to hexadecimal",
      lines:[{id:"l1",math:"45 ÷ 2 = 22  r 1",why:"divide by the BASE; the remainder is the first bit out"},
             {id:"l2",math:"22 ÷ 2 = 11  r 0",why:"keep dividing the quotient, never the remainder"},
             {id:"l3",math:"11 ÷ 2 =  5  r 1",why:"same move again — this is the whole method"},
             {id:"l4",math:" 5 ÷ 2 =  2  r 1",why:"still not zero, so carry on"},
             {id:"l5",math:" 2 ÷ 2 =  1  r 0",why:"an even number always gives remainder 0"},
             {id:"l6",math:" 1 ÷ 2 =  0  r 1",why:"stop only when the quotient reaches 0"},
             {id:"l7",math:"read the remainders UPWARDS  →  101101₂",why:"the LAST remainder is the MOST significant bit"},
             {id:"l8",math:"check:  32 + 8 + 4 + 1 = 45  ✓",why:"place values 32 16 8 4 2 1 — always check"},
             {id:"l9",math:"0010 1101  →  2 | D  =  2D₁₆",why:"pad to 8 bits, split into nibbles, one hex digit each"}],
      narration_steps:[
        {short:"The method",term:"repeated division",narration_text:"We want forty-five written in binary. The method is repeated division by the base — and the base is two, because binary has exactly two digits. Divide, write down the remainder, then divide the QUOTIENT again. Notice we never touch the remainders once they are written; they are just being collected.",reveal:["l1"],active:["l1"],point:"l1",
         def:"To convert to any base, divide repeatedly by that base and collect the remainders."},
        {short:"Keep going",term:"the quotient",narration_text:"Twenty-two divided by two is eleven remainder nought. Eleven divided by two is five remainder one. Each line takes the quotient from the line above — that is the only number travelling down the page. An even number always leaves nought, an odd number always leaves one, so the remainder column is really just asking odd or even.",reveal:["l2","l3"],active:["l3"],point:"l3",
         quiz:{q:"What tells you the remainder when you divide by 2?",options:["Whether the number is odd or even","The size of the number","The previous remainder"],answer:0,why:"Dividing by two leaves 1 for every odd number and 0 for every even one — that is all the remainder column records."}},
        {short:"Down to zero",term:"the stopping rule",narration_text:"Five gives two remainder one, two gives one remainder nought, and one divided by two gives zero remainder one. Stop when the QUOTIENT hits zero, not when it hits one. Stopping a line early is how a bit goes missing, and the number quietly comes out half the size it should be.",reveal:["l4","l5","l6"],active:["l6"],point:"l6",
         def:"The division stops when the quotient is 0 — the final remainder is still part of the answer."},
        {short:"Read upwards",term:"the direction",narration_text:"Now the move that this whole video exists for. Read the remainder column from the BOTTOM to the TOP: one, nought, one, one, nought, one. Upwards, because the last division produced the biggest place value. Read it downwards and you get one-zero-one-one-zero-one, which is a different number entirely — and it is the single most common mistake in this topic.",reveal:["l7"],active:["l7"],point:"l7",
         quiz:{q:"Which remainder is the most significant bit?",options:["The last one, from the final division","The first one","Whichever is a 1"],answer:0,why:"Each division peels off the next power of two, so the final remainder carries the largest place value and sits leftmost."}},
        {short:"Check it",term:"place value",narration_text:"Never hand in a conversion without checking it. Write the place values above the bits — thirty-two, sixteen, eight, four, two, one — and add up the columns holding a one. Thirty-two plus eight plus four plus one is forty-five. The check takes five seconds and catches a reversed answer immediately.",reveal:["l8"],active:["l8"],point:"l8",
         def:"Any base is Σ digit × baseᵖᵒˢⁱᵗⁱᵒⁿ — decimal is not special, it just has ten digits."},
        {short:"Straight to hex",term:"nibble grouping",narration_text:"For hexadecimal, do NOT go back through decimal. Pad the bits to eight, then chop them into two groups of four — a group of four is called a nibble. Nought-nought-one-nought is two, and one-one-nought-one is thirteen, which is written D. So forty-five is two-D in hex. One nibble, one hex digit, every time — that is why hex exists.",reveal:["l9"],active:["l9"],point:"l9",
         quiz:{q:"Why does one hex digit map to exactly four bits?",options:["Because 16 = 2⁴, so a nibble has exactly 16 possible values","Because hex uses the letters A to F","Because bytes are 8 bits"],answer:0,why:"Sixteen is two to the fourth, so four bits count from 0 to 15 — exactly the range of one hex digit."}},
        {short:"Recap",term:"recap",narration_text:"Recap. Divide by the base, collect the remainders, and keep going until the quotient is zero. Then read that column UPWARDS. Check with place values, and jump between binary and hex four bits at a time rather than detouring through decimal.",reveal:["l7","l9"],active:["l7"],point:"l7"}],
      recap:["Divide by the base; the remainders ARE the digits.",
             "Read the remainder column upwards — the last one is the most significant bit.",
             "Hex ↔ binary is a 4-bit nibble swap; never route it through decimal."]} },

  /* ── COMPUTER STUDIES 35: tree — the data-structure family. Deliberately organised by the shape of
     the ACCESS (linear vs branching) and closed with a "choose by the operation" branch, because the
     documented failure is that students memorise definitions and then pick a structure by its name.
     This is the stand-in for the ds canvas until that renderer exists. ── */
  { text: "Data structures: arrays, linked lists, stacks and queues are linear; trees and graphs are non-linear. Compare how each stores data and what each is fast at.",
    blueprint: {meta:{title:"Data structures — linear, non-linear, and how to choose",subject:"Computer Studies",concept_id:"data_structures_family"},layout:"tree",root:"ds",
      nodes:[{id:"ds",label:"Data structures",note:"a shape imposed on memory"},
             {id:"lin",label:"Linear",parent:"ds",note:"one element after another"},
             {id:"arr",label:"Array",parent:"lin",note:"contiguous · index from 0"},
             {id:"ll",label:"Linked list",parent:"lin",note:"scattered · node + next"},
             {id:"stk",label:"Stack — LIFO",parent:"lin",note:"push / pop at one end"},
             {id:"que",label:"Queue — FIFO",parent:"lin",note:"enqueue rear, dequeue front"},
             {id:"non",label:"Non-linear",parent:"ds",note:"an element has many neighbours"},
             {id:"tre",label:"Tree",parent:"non",note:"root, parent, child, leaf"},
             {id:"bst",label:"Binary search tree",parent:"tre",note:"left < node < right"},
             {id:"gra",label:"Graph",parent:"non",note:"vertices and edges, maybe cycles"},
             {id:"pick",label:"Choose by the OPERATION",parent:"ds",note:"never by the name"},
             {id:"idx",label:"Jump to item i?",parent:"pick",note:"→ array, O(1)"},
             {id:"ins",label:"Insert in the middle?",parent:"pick",note:"→ linked list, O(1)"}],
      narration_steps:[
        {short:"What they are",term:"data structure",narration_text:"A data structure is not a kind of data. It is a SHAPE you impose on memory so that certain operations become cheap — and, unavoidably, others become expensive.",reveal:["ds"],active:["ds"],point:"ds"},
        {short:"The first split",term:"linear",narration_text:"The first split is about shape. In a linear structure every element has one before it and one after it — a single file queue of values, and nothing else.",reveal:["lin"],active:["lin"],point:"lin"},
        {short:"Array",term:"array",narration_text:"An array sits in one contiguous block, so the computer can jump straight to item i by arithmetic on the address. Index from zero, and the last index is length minus one — the off-by-one trap.",reveal:["arr"],active:["arr"],point:"arr",
         quiz:{q:"An array has 10 elements. What is the last valid index?",options:["9","10","11"],answer:0,why:"Indexing starts at 0, so ten elements occupy 0 to 9. Reaching for index 10 runs off the end."}},
        {short:"Linked list",term:"linked list",narration_text:"A linked list is the opposite deal. The nodes are scattered anywhere in memory and each one carries a reference to the next, so inserting is cheap but you must walk from the head to reach anything.",reveal:["ll"],active:["ll"],point:"ll",
         def:"A node is data plus a reference to the next node; 'head' is a reference, not a node."},
        {short:"Stack",term:"LIFO",narration_text:"A stack restricts you to one end: push on, pop off. Last in, first out. It is a plate stack, an undo history, and the call stack that remembers where a function must return to.",reveal:["stk"],active:["stk"],point:"stk"},
        {short:"Queue",term:"FIFO",narration_text:"A queue opens both ends: join at the rear, leave from the front. First in, first out. Print jobs and buffers. Stack and queue are taught together, so anchor each one to a real object, not to the word.",reveal:["que"],active:["que"],point:"que",
         quiz:{q:"Push 1, 2, 3 then remove one item. Which comes out?",options:["3 from a stack, 1 from a queue","1 from both","3 from both"],answer:0,why:"LIFO returns the most recent arrival; FIFO returns the oldest. Same input, opposite output."}},
        {short:"Branching",term:"non-linear",narration_text:"Now the other family. In a non-linear structure an element can have several neighbours, so there is no single next — which is exactly why these need recursion to walk.",reveal:["non"],active:["non"],point:"non"},
        {short:"Tree",term:"tree",narration_text:"A tree has one root, and every other node has exactly one parent. Nodes with no children are leaves, and any node plus everything under it is a subtree.",reveal:["tre"],active:["tre"],point:"tre"},
        {short:"BST",term:"binary search tree",narration_text:"Add one rule — everything left is smaller, everything right is bigger — and searching halves the problem at each step. But that log n speed is a promise only while the tree stays balanced.",reveal:["bst"],active:["bst"],point:"bst",
         quiz:{q:"What happens if you insert already-sorted values into a BST?",options:["It degenerates into a list and search becomes O(n)","It balances itself","Insertion is refused"],answer:0,why:"Every value goes right, producing one long spine — a linked list wearing a tree costume."}},
        {short:"Graph",term:"graph",narration_text:"Drop the one-parent rule and you have a graph: vertices joined by edges, possibly in cycles. Roads, friendships and networks are graphs, and a tree is simply a graph with no cycles.",reveal:["gra"],active:["gra"],point:"gra"},
        {short:"How to choose",term:"the real question",narration_text:"Here is the part exams actually test. Do not choose a structure by its name. Ask which operation your program does most often, then pick the structure that is cheap at exactly that.",reveal:["pick"],active:["pick"],point:"pick"},
        {short:"The trade-off",term:"trade-off",narration_text:"Jumping to item i instantly? That is an array. Inserting in the middle constantly? That is a linked list. Neither is better — they are opposite bargains, and choosing means naming the operation first.",reveal:["idx","ins"],active:["ins"],point:"ins"},
        {short:"Recap",term:"recap",narration_text:"Recap. Linear means one neighbour each way; non-linear means many. Stack is last-in-first-out, queue is first-in-first-out. And you choose by the operation you repeat, never by the definition you memorised.",reveal:["ds","pick"],active:["pick"],point:"pick"}],
      recap:["Linear = one next; non-linear = many neighbours.",
             "Stack is LIFO, queue is FIFO — anchor each to a real object.",
             "Choose a structure by the operation you repeat most, not by its name."]} }
,

  /* ══════════ PHYSICS 36–41 · the gold shots for everything that is NOT a free-body diagram or a
     circuit (those are 20 and 21, built in Bit 2). The corpus is blunt about the shape of this
     subject: "the diagram IS the reasoning", and roughly half the syllabus is some quantity plotted
     against time or position. So three of these six are the graph engine, aimed at the three
     documented graph killers — slope-vs-height, area-blindness and graph-as-picture — and each
     carries its danger frame as a labelled marker rather than as an aside. The remaining three
     cover the vector plane (reused from Maths, per the corpus: do not rebuild it), the energy
     ledger as a flow, and a collision worked line by line on "solve". ══════════ */

  /* ── PHYSICS 36: graph — the velocity–time graph. Chosen as the flagship physics graph because
     TUG-K says the same three errors account for most of the loss: reading the HEIGHT when asked
     for the SLOPE, never seeing the AREA at all, and reading the plot as a picture of the road.
     All three are addressed on one curve, in that order, with the numbers printed on screen. ── */
  { text: "A car starts from rest, speeds up steadily to 20 m/s in 8 s, holds that speed for 6 s, then brakes to rest in 4 s. Sketch the velocity–time graph and explain what its slope and the area beneath it tell you.",
    blueprint: {meta:{title:"A velocity–time graph — slope is acceleration, area is distance",subject:"Physics",concept_id:"vt_graph_slope_and_area"},layout:"graph",
      x:{min:0,max:19,label:"time (seconds)"}, y:{min:0,max:25,label:"velocity (metres per second)"},
      curves:[{id:"v",color:"#7c3aed",label:"v–t",points:[[0,0],[2,5],[4,10],[6,15],[7,17.5],[8,20],[9,20],[11,20],[13,20],[14,20],[15,15],[16,10],[17,5],[18,0]]}],
      markers:[{id:"rise",at:[4,10],label:"climbing: slope = +2.5 m/s²",color:"#dc2626"},
               {id:"flat",at:[9,20],label:"FLAT ≠ stopped — steady 20 m/s",color:"#2563eb"},
               {id:"fall",at:[16,10],label:"slope = −5 m/s²",color:"#b45309"},
               {id:"stop",at:[18,0],label:"at rest",color:"#0d9488",drop:true}],
      regions:[{id:"slope",type:"bracket",at:8,y0:0,y1:20,label:"rise 20 m/s / run 8 s",color:"#dc2626"},
               {id:"area",type:"band",x0:0,x1:18,label:"area = distance travelled = 280 m",color:"#0d9488"}],
      narration_steps:[
        {short:"Read the axes",term:"velocity–time",narration_text:"Before a single number, read the axes out loud: time across the bottom, velocity up the side. So every height on this curve is a speed, and nothing on this picture is a distance yet.",reveal:["v"],active:["v"],point:"rise",
         def:"On a velocity–time graph the height is the velocity at that instant — not where the object is."},
        {short:"The climb",term:"acceleration",narration_text:"For the first eight seconds the line climbs. Climbing means the velocity is growing, so the car is speeding up — and how steeply it climbs is how quickly it gains speed.",reveal:["rise"],active:["rise"],point:"rise"},
        {short:"Slope, not height",term:"slope",narration_text:"Here is the number-one mistake in this topic. Asked for the acceleration at four seconds, most students read the height and write ten. But acceleration is the SLOPE: twenty metres per second gained over eight seconds — two point five.",reveal:["slope"],active:["slope"],point:"rise",
         quiz:{q:"At t = 4 s the curve is at a height of 10. What is the acceleration there?",options:["2.5 m/s² — the slope, not the height","10 m/s² — read straight off the graph","0, because the car has not stopped"],answer:0,why:"Height is velocity; slope is acceleration. They are different questions asked of the same point."}},
        {short:"The flat part",term:"constant velocity",narration_text:"Then the line goes flat. Flat does not mean stopped — the car is still doing twenty metres per second. Flat means the velocity is not CHANGING, so the acceleration here is zero even though the car is moving quickly.",reveal:["flat"],active:["flat"],point:"flat",
         def:"A horizontal line on a velocity–time graph means constant velocity: zero acceleration, not zero speed."},
        {short:"Not a picture",term:"graph-as-picture",narration_text:"And watch this trap. That flat top is not a hilltop and the climb is not a hill — the road is perfectly level the whole time. A graph is a plot of a quantity, never a photograph of the journey.",reveal:["flat"],active:["flat"],point:"flat"},
        {short:"Braking",term:"negative acceleration",narration_text:"Now the line falls: the slope is negative five metres per second squared. Say negative acceleration, not deceleration — the minus sign tells you the change is backwards, while the car itself is still travelling forwards the entire time.",reveal:["fall"],active:["fall"],point:"fall"},
        {short:"Zero at last",term:"at rest",narration_text:"Only where the curve touches the time axis is the car actually at rest. Notice how late that is compared with where students usually point — the braking took four full seconds.",reveal:["stop"],active:["stop"],point:"stop"},
        {short:"The area",term:"area under the curve",narration_text:"Finally, the piece everybody forgets. Velocity times time is a distance, so the AREA under the graph is how far the car went: eighty, plus one hundred and twenty, plus forty — two hundred and eighty metres.",reveal:["area"],active:["area"],point:"flat",
         def:"Area under a velocity–time graph = displacement, because height (m/s) × width (s) leaves metres.",
         quiz:{q:"What does the area under a velocity–time graph give you?",options:["The distance travelled","The acceleration","The average speed"],answer:0,why:"Multiplying a velocity by a time gives a distance — that is exactly what an area on these axes is."},
        },
        {short:"Recap",term:"recap",narration_text:"Recap, and these are three different questions about the same curve. Height is the velocity, slope is the acceleration, area is the distance. Ask which one the question wants before you touch the graph.",reveal:["v","area"],active:["area"],point:"flat"}],
      recap:["Height = velocity · slope = acceleration · area = distance. Three questions, one curve.",
             "A flat line means steady speed, not a stopped object.",
             "The graph is a plot of a quantity, never a picture of the road."]} },

  /* ── PHYSICS 37: graph — simple harmonic motion as three linked curves. Every documented SHM
     misconception is a RELATIVE-PHASE error (students put maximum velocity at the extremes), so the
     three quantities go on one set of axes against one clock and the markers sit exactly where the
     confusion lives. Normalised to a fraction of each maximum so all three fit honestly. ── */
  { text: "A mass on a spring oscillates in simple harmonic motion. Sketch displacement, velocity and acceleration against time, and explain why the acceleration is largest exactly where the velocity is zero.",
    blueprint: {meta:{title:"Simple harmonic motion — where each quantity peaks",subject:"Physics",concept_id:"shm_phase_x_v_a"},layout:"graph",
      x:{min:0,max:4,label:"time (seconds) — one full cycle takes 2 s"},
      y:{min:-1.45,max:1.45,label:"each quantity as a fraction of its own maximum"},
      curves:[{id:"x",color:"#7c3aed",label:"displacement x",points:[[0,1],[0.25,0.71],[0.5,0],[0.75,-0.71],[1,-1],[1.25,-0.71],[1.5,0],[1.75,0.71],[2,1],[2.25,0.71],[2.5,0],[2.75,-0.71],[3,-1],[3.25,-0.71],[3.5,0],[3.75,0.71],[4,1]]},
              {id:"v",color:"#0d9488",label:"velocity v",dash:true,points:[[0,0],[0.25,-0.71],[0.5,-1],[0.75,-0.71],[1,0],[1.25,0.71],[1.5,1],[1.75,0.71],[2,0],[2.25,-0.71],[2.5,-1],[2.75,-0.71],[3,0],[3.25,0.71],[3.5,1],[3.75,0.71],[4,0]]},
              {id:"a",color:"#dc2626",dash:true,points:[[0,-1],[0.25,-0.71],[0.5,0],[0.75,0.71],[1,1],[1.25,0.71],[1.5,0],[1.75,-0.71],[2,-1],[2.25,-0.71],[2.5,0],[2.75,0.71],[3,1],[3.25,0.71],[3.5,0],[3.75,-0.71],[4,-1]]}],
      markers:[{id:"ext",at:[2,1],label:"extreme: x max, v = 0, a max",color:"#7c3aed"},
               {id:"eq",at:[0.5,-1],label:"centre: v max, a = 0",color:"#0d9488"},
               {id:"back",at:[1,1],label:"a points BACK to the centre",color:"#dc2626"},
               {id:"mir",at:[3,1],label:"mirror of x — F = −kx",color:"#dc2626"}],
      narration_steps:[
        {short:"One clock",term:"simple harmonic motion",narration_text:"Three quantities, one clock. Displacement in purple, velocity in green, acceleration in red — all plotted against the same time axis so you can read one against another.",reveal:["x"],active:["x"],point:"ext",
         def:"Simple harmonic motion is any motion where the restoring force is proportional to the displacement and points back towards the centre."},
        {short:"The extremes",term:"the turning point",narration_text:"Start at the extreme, where the spring is stretched furthest. The mass has to turn around here, and a thing that is turning around is, for one instant, not moving at all.",reveal:["ext"],active:["ext"],point:"ext"},
        {short:"Zero velocity",term:"instantaneously at rest",narration_text:"So watch the green curve: velocity crosses zero exactly where the purple displacement is at its peak. Think of a ball thrown straight up — at the very top it is stationary, and nobody would say gravity switched off up there.",reveal:["v"],active:["v"],point:"ext"},
        {short:"The centre",term:"equilibrium",narration_text:"Slide forward to the centre. The spring is at its natural length, so it is pulling with nothing at all — and yet this is exactly where the mass is moving fastest. Zero force, maximum speed.",reveal:["eq"],active:["eq"],point:"eq",
         quiz:{q:"Where is the mass moving fastest?",options:["At the centre, where the force is zero","At the extremes, where the force is biggest","Everywhere — the speed is constant"],answer:0,why:"Force builds speed on the way in, so the speed peaks exactly where the force has run out — at the centre."}},
        {short:"Always inward",term:"the restoring force",narration_text:"Now the red curve. Acceleration is largest at the extremes and always points back towards the centre — that is the whole meaning of the minus sign in F equals minus k x. Say the minus out loud; it IS the concept.",reveal:["a","back"],active:["back"],point:"back"},
        {short:"Mirror images",term:"180 degrees out of phase",narration_text:"Lay red over purple and they are mirror images: whenever displacement is up, acceleration is down by the same fraction. That is what one hundred and eighty degrees out of phase means, and it follows directly from the minus sign.",reveal:["mir"],active:["mir"],point:"mir"},
        {short:"The surprise",term:"period",narration_text:"One last thing, and it is genuinely counterintuitive. Pull the mass twice as far and the curve gets taller but not wider — the period stays two seconds. A bigger swing simply comes with a bigger force to cover it.",reveal:["ext"],active:["ext"],point:"ext",
         def:"For small oscillations the period is independent of amplitude — it depends on the mass and the spring constant only."},
        {short:"Recap",term:"recap",narration_text:"Recap. Displacement and acceleration are mirror images; velocity peaks a quarter-cycle away from both. So at the ends: no speed, biggest pull. In the middle: top speed, no pull.",reveal:["x","v","a"],active:["a"],point:"eq"}],
      recap:["At the extremes v = 0 but a is maximum; at the centre a = 0 but v is maximum.",
             "Acceleration is the mirror image of displacement — that is the minus in F = −kx.",
             "Period does not depend on amplitude."]} },

  /* ── PHYSICS 38: graph — the heating curve. The corpus calls this the highest-value single physics
     graph after the kinematics stack, because the latent-heat plateau contradicts the intuition
     "add energy, temperature rises" and is unteachable without the picture. Both plateaus are drawn
     as shaded bands and the boiling one is deliberately far longer than the melting one. ── */
  { text: "Ice at −20 °C is heated steadily until it becomes steam at 120 °C. Sketch the heating curve of temperature against energy supplied and explain the two flat sections.",
    blueprint: {meta:{title:"The heating curve — why the temperature stops rising",subject:"Physics",concept_id:"heating_curve_latent_heat"},layout:"graph",
      x:{min:0,max:800,label:"energy supplied (kilojoules)"}, y:{min:-40,max:140,label:"temperature (degrees Celsius)"},
      curves:[{id:"h",color:"#7c3aed",label:"heating curve",points:[[0,-20],[20,-10],[40,0],[60,0],[90,0],[115,0],[140,0],[165,25],[190,50],[215,75],[240,100],[300,100],[430,100],[550,100],[620,100],[660,108],[700,116],[770,125]]}],
      markers:[{id:"warm",at:[20,-10],label:"Q = mcΔT",color:"#2563eb"},
               {id:"melt",at:[140,0],label:"MELTING — no rise",color:"#dc2626"},
               {id:"liq",at:[190,50],label:"liquid water warming",color:"#2563eb"},
               {id:"boil",at:[430,100],label:"BOILING — a far longer plateau",color:"#dc2626"},
               {id:"steam",at:[700,116],label:"steam warming — steep again",color:"#2563eb"}],
      regions:[{id:"pf",type:"band",x0:40,x1:140,label:"latent heat of fusion",color:"#dc2626"},
               {id:"pv",type:"band",x0:240,x1:620,label:"latent heat of vaporisation — much bigger",color:"#b45309"}],
      narration_steps:[
        {short:"Read the axes",term:"heating curve",narration_text:"Energy supplied runs across, temperature goes up. The heater is steady, so moving right also means time passing — and that makes the flat parts genuinely strange.",reveal:["h"],active:["h"],point:"warm",
         def:"A heating curve plots the temperature of a substance against the energy put into it."},
        {short:"Warming the ice",term:"specific heat capacity",narration_text:"At first the ice simply warms up. Energy goes into making the particles vibrate faster, and faster vibration is precisely what a higher temperature means.",reveal:["warm"],active:["warm"],point:"warm"},
        {short:"The first plateau",term:"melting",narration_text:"Then at zero degrees the line goes flat, and it stays flat for a while. The heater has not been turned off — energy is pouring in — yet the thermometer refuses to move.",reveal:["melt","pf"],active:["melt"],point:"melt"},
        {short:"Where it goes",term:"latent heat",narration_text:"So where does that energy go? Into breaking the bonds holding the ice lattice together, not into speeding the particles up. Think of paying off a debt before you can start saving — the money is real, but your balance sits still.",reveal:["pf"],active:["pf"],point:"melt",
         def:"Latent heat is the energy needed to change state at constant temperature — it changes potential energy, not kinetic energy.",
         quiz:{q:"During melting, where is the supplied energy going?",options:["Into breaking the bonds between particles","Into raising the average speed of the particles","Nowhere — it is lost to the surroundings"],answer:0,why:"Temperature measures average kinetic energy. During a phase change the energy goes into potential energy instead, so the temperature holds."}},
        {short:"Liquid water",term:"back to warming",narration_text:"Once every last bond is broken the temperature climbs again. Notice this slope is gentler than the ice's — water needs a lot of energy per degree, which is why the sea warms so slowly.",reveal:["liq"],active:["liq"],point:"liq"},
        {short:"The long plateau",term:"boiling",narration_text:"At one hundred degrees it flattens again, and look how much longer this plateau is. Escaping the liquid entirely takes far more energy than merely loosening the solid — that is why a steam burn is so much worse than boiling water.",reveal:["boil","pv"],active:["boil"],point:"boil"},
        {short:"Steam",term:"the last climb",narration_text:"Finally the steam itself warms, and steeply, because a gas needs little energy per degree. Each straight section's steepness is telling you the specific heat capacity of that state.",reveal:["steam"],active:["steam"],point:"steam"},
        {short:"Recap",term:"recap",narration_text:"Recap. Sloped sections are Q equals m c times the change in temperature — energy becoming motion. Flat sections are Q equals m L — energy becoming freedom. The heater never stops; only the thermometer does.",reveal:["h","pf","pv"],active:["pv"],point:"boil"}],
      recap:["Sloped = warming (Q = mcΔT); flat = changing state (Q = mL).",
             "During a phase change energy still flows in — it breaks bonds instead of raising temperature.",
             "The boiling plateau is far longer than the melting one."]} },

  /* ── PHYSICS 39: vectors — the maths tip-to-tail plane, reused exactly as the corpus instructs
     ("reuse, don't rebuild"). Numbers chosen so the resultant is the 3-4-5 triangle, because the
     documented failure is scalar habit: students add four and three and get seven. Physics adds
     nothing to the renderer — it only insists the narration says the units and the direction. ── */
  { text: "A boat's engine drives it east at 4 m/s while the river current carries it north at 3 m/s. Find the boat's resultant velocity, and explain why 4 and 3 do not make 7.",
    blueprint: {meta:{title:"Adding two velocities — why 4 and 3 make 5",subject:"Physics",concept_id:"vector_addition_resultant_boat"},layout:"vectors",
      a:[4,0], b:[0,3],
      narration_steps:[
        {short:"The first vector",term:"vector",narration_text:"The engine drives the boat east at four metres per second. Draw it as an arrow: its length is the speed and the way it points is the direction. Both halves matter — that is what makes it a vector rather than just a number.",reveal:["a"],active:["a"],point:"a",
         def:"A vector has a size AND a direction; a scalar, like mass or temperature, has only a size."},
        {short:"The second",term:"the current",narration_text:"Meanwhile the river carries the whole boat north at three metres per second, whatever the engine is doing. The water does not care which way the boat is pointed.",reveal:["b"],active:["b"],point:"b"},
        {short:"Read them off",term:"components",narration_text:"Because they are at right angles, each one is already a component: four across, three up. Notice you can read those straight off the picture instead of hunting for a sine or a cosine.",reveal:["comp"],active:["comp"],point:"comp"},
        {short:"Slide it",term:"tip to tail",narration_text:"Now slide the current arrow so its tail sits on the tip of the engine arrow. Sliding an arrow changes nothing at all, because a vector is only a size and a direction — it has no home.",reveal:["shift"],active:["shift"],point:"shift",
         quiz:{q:"Why are you allowed to slide the second arrow across the page?",options:["A vector is defined only by size and direction, not by position","Because the two are at right angles","Because the boat physically moves there first"],answer:0,why:"Position is not part of a vector, so moving one without turning or resizing it leaves it the same vector."}},
        {short:"The resultant",term:"resultant",narration_text:"Join the very start to the very end and that single arrow is the resultant — the one velocity that would do the job of both. It is five metres per second, by Pythagoras, at about thirty-seven degrees north of east.",reveal:["res"],active:["res"],point:"res",
         def:"The resultant is the single vector that has the same effect as all the others combined."},
        {short:"The trap",term:"scalar habit",narration_text:"So four plus three does not make seven here. Seven would only be right if both pushes pointed the same way — and if they pointed in opposite directions you would get one. Direction is doing the arithmetic with you.",reveal:["res"],active:["res"],point:"res"},
        {short:"Recap",term:"recap",narration_text:"Recap. Draw each vector to scale, slide the second to the tip of the first, and join start to finish. Always quote a resultant with its direction — five metres per second on its own is only half an answer.",reveal:["a","shift","res"],active:["res"],point:"res"}],
      recap:["Sliding a vector changes nothing — only length and direction define it.",
             "Perpendicular vectors combine by Pythagoras, never by simple addition.",
             "Always state the direction with the magnitude."]} },

  /* ── PHYSICS 40: flow — the energy ledger. Energy problems are a PROCEDURE, and the corpus is
     explicit that students treat energy as a substance that "gets used up". So the chain is built
     as bookkeeping (choose two states → list what is in each account → equate → find the gap), with
     the missing joules given their own danger station instead of being quietly written off. ── */
  { text: "A 2 kg trolley is released from rest at the top of a ramp 1.5 m high and reaches the bottom at 4 m/s. Account for all the energy and explain where the missing joules went.",
    blueprint: {meta:{title:"Energy accounting — nothing is used up",subject:"Physics",concept_id:"energy_conservation_ramp_friction"},layout:"flow",
      nodes:[{id:"pick",label:"Pick TWO states",note:"top, at rest → bottom",kind:"trigger"},
             {id:"zero",label:"Choose where PE = 0",note:"the floor — it's a choice",kind:"process"},
             {id:"pe",label:"PE at the top = 29.4 J",note:"mgh = 2 × 9.8 × 1.5",kind:"process"},
             {id:"ke",label:"KE at the bottom = 16 J",note:"½mv² = ½ × 2 × 4²",kind:"product"},
             {id:"gap",label:"13.4 J unaccounted for",note:"“the energy was used up”",kind:"danger"},
             {id:"fric",label:"Friction did −13.4 J of work",note:"opposing the motion",kind:"process"},
             {id:"heat",label:"13.4 J → thermal energy",note:"ramp and wheels warm up",kind:"product"},
             {id:"law",label:"Total energy: 29.4 J in, 29.4 J out",note:"mechanical energy alone is not conserved",kind:"outcome"}],
      narration_steps:[
        {short:"Two states",term:"the states",narration_text:"Energy questions are bookkeeping, so start like an accountant: pick two moments and only two. Here, the instant of release at the top, and the instant it reaches the bottom.",reveal:["pick"],active:["pick"],point:"pick",
         def:"An energy calculation compares two chosen instants — it never tracks what happens in between."},
        {short:"Set the zero",term:"the zero of PE",narration_text:"Next, decide where potential energy counts as zero. The floor is convenient, but it is genuinely a choice — only the CHANGE in height ever appears in an answer.",reveal:["zero"],active:["zero"],point:"zero"},
        {short:"Top of the ramp",term:"gravitational PE",narration_text:"At the top the trolley is still, so its only energy is positional: m g h, which is two times nine point eight times one point five — twenty-nine point four joules. That is the entire opening balance.",reveal:["pe"],active:["pe"],point:"pe"},
        {short:"Bottom of the ramp",term:"kinetic energy",narration_text:"At the bottom the height is gone and the speed is four metres per second, so we have one half m v squared: sixteen joules. And notice the v is squared — double the speed and you quadruple the energy.",reveal:["ke"],active:["ke"],point:"ke"},
        {short:"The gap",term:"the missing joules",narration_text:"Twenty-nine point four went in, sixteen came out. Thirteen point four joules are missing — and the tempting answer, that the energy was used up moving the trolley, is exactly wrong.",reveal:["gap"],active:["gap"],point:"gap",
         quiz:{q:"What does 'energy was used up' actually mean?",options:["Nothing — energy only moves between accounts, it is never spent","It was converted into force","It was destroyed by friction"],answer:0,why:"Energy is conserved absolutely. 'Used up' always means 'moved somewhere you were not counting' — usually thermal energy."}},
        {short:"The culprit",term:"non-conservative force",narration_text:"Friction acted backwards along the ramp the whole way down, so it did negative work: thirteen point four joules of it. Negative work simply means the force was taking energy out rather than putting it in.",reveal:["fric"],active:["fric"],point:"fric",
         def:"Work is negative when the force opposes the displacement — the force removes energy from the moving object."},
        {short:"Where it went",term:"thermal energy",narration_text:"Those joules are still here, as warmth in the ramp, in the axles and in the air. Run a hand along a slide after someone comes down it — that heat is the missing line in the ledger.",reveal:["heat"],active:["heat"],point:"heat"},
        {short:"The payoff",term:"conservation of energy",narration_text:"So the books balance: sixteen joules of motion plus thirteen point four of thermal energy is twenty-nine point four. Total energy is always conserved; MECHANICAL energy is conserved only when friction is absent.",reveal:["law"],active:["law"],point:"law"},
        {short:"Recap",term:"recap",narration_text:"Recap. Two states, a chosen zero, list every account at each end, then find the gap and name where it went. If your energies do not balance you have not lost energy — you have missed a column.",reveal:["pick","law"],active:["law"],point:"law"}],
      recap:["Energy is never used up — 'missing' energy has always moved to an account you forgot.",
             "Mechanical energy is conserved only when no friction acts; total energy always is.",
             "Pick two states and a zero for PE before writing anything down."]} },

  /* ── PHYSICS 41: solve — an inelastic collision, line by line. Momentum questions fail on two
     documented points: dropping the direction the moment the algebra starts, and believing that
     "conserved" is all-or-nothing. So direction is carried in the "why" of every line, and the
     kinetic-energy audit is done explicitly at the end rather than asserted. ── */
  { text: "A 1200 kg car travelling east at 15 m/s runs into the back of an 800 kg stationary van and the two lock together. Find their common velocity and how much kinetic energy is lost.",
    blueprint: {meta:{title:"An inelastic collision — momentum kept, kinetic energy not",subject:"Physics",concept_id:"inelastic_collision_momentum_ke"},layout:"solve",
      problem:"1200 kg at 15 m/s east strikes a stationary 800 kg van; they lock together. Find v, and the kinetic energy lost.",
      lines:[{id:"l1",math:"p_before = (1200)(15) + (800)(0) = 18 000 kg·m/s east",why:"include EVERY object, and write the direction down"},
             {id:"l2",math:"p_after = (1200 + 800) v = 2000 v",why:"they lock together, so one combined mass"},
             {id:"l3",math:"2000 v = 18 000",why:"no external horizontal force → momentum is conserved"},
             {id:"l4",math:"v = 9 m/s east",why:"divide by the total mass; the direction is unchanged"},
             {id:"l5",math:"KE_before = ½(1200)(15²) = 135 000 J",why:"now audit the energy separately"},
             {id:"l6",math:"KE_after = ½(2000)(9²) = 81 000 J",why:"one mass, one speed, after the collision"},
             {id:"l7",math:"ΔKE = 81 000 − 135 000 = −54 000 J",why:"54 kJ became heat, sound and crumpled metal"}],
      narration_steps:[
        {short:"Before",term:"momentum",narration_text:"Momentum is mass times velocity, so start by adding up every object before the crash: twelve hundred kilograms at fifteen metres per second, plus a van doing nothing at all. Eighteen thousand kilogram-metres per second, east.",reveal:["l1"],active:["l1"],point:"l1",
         def:"Momentum is a vector: the direction is part of the quantity, not a label added afterwards."},
        {short:"After",term:"perfectly inelastic",narration_text:"They lock together, so afterwards there is one object of two thousand kilograms moving at some unknown v. Sticking together is what makes this collision perfectly inelastic.",reveal:["l2"],active:["l2"],point:"l2"},
        {short:"Why equal",term:"conservation of momentum",narration_text:"Now the physics. During the crash the two push on each other with equal and opposite forces, so whatever one gains the other loses. With no outside push along the road, the total momentum cannot change.",reveal:["l3"],active:["l3"],point:"l3",
         def:"Momentum is conserved whenever the external forces on the chosen system add to zero."},
        {short:"Solve",term:"the common velocity",narration_text:"Divide eighteen thousand by two thousand and you get nine metres per second — and it is still heading east. A velocity written without its direction is only half an answer.",reveal:["l4"],active:["l4"],point:"l4"},
        {short:"Now the energy",term:"kinetic energy",narration_text:"Momentum is settled, so audit the energy as a completely separate question. Before the crash: one half times twelve hundred times fifteen squared — one hundred and thirty-five thousand joules.",reveal:["l5"],active:["l5"],point:"l5"},
        {short:"After the crash",term:"the audit",narration_text:"Afterwards: one half times two thousand times nine squared — eighty-one thousand joules. The mass went up but the speed went down, and because speed is squared, the speed wins.",reveal:["l6"],active:["l6"],point:"l6"},
        {short:"The loss",term:"inelastic",narration_text:"Fifty-four thousand joules have gone. Not destroyed — spent on bending metal, on heating the wreck, on the noise you heard. That is precisely what inelastic means.",reveal:["l7"],active:["l7"],point:"l7",
         quiz:{q:"Which quantity is conserved in EVERY collision?",options:["Momentum — kinetic energy only in an elastic one","Both, always","Kinetic energy — momentum only if they stick"],answer:0,why:"Momentum is conserved whenever no external force acts. Kinetic energy survives only in an elastic collision."}},
        {short:"Recap",term:"recap",narration_text:"Recap. Momentum before equals momentum after, direction included, in every collision. Kinetic energy survives only if the collision is elastic — and when it does not survive, name where it went.",reveal:["l4","l7"],active:["l7"],point:"l7"}],
      recap:["Momentum is conserved in every collision; kinetic energy only in elastic ones.",
             "Carry the direction through every line — momentum is a vector.",
             "'Lost' kinetic energy becomes heat, sound and deformation."]} },

  /* ══════════ ORGANIC CHEMISTRY (100-level) 42–55 · the gold shots. The corpus finding that drives
     this whole block: General Chemistry is quantitative, so "flow" carried it; Organic is
     MECHANISTIC and SPATIAL, so the answer is a drawing and the reasoning is where a pair of
     electrons went. Eight of these fourteen are "curly", which is exactly the ratio the corpus
     predicts (topics 7–17 are all the one renderer). Every arrow below is TYPED and LABELLED,
     every intermediate has a name badge, and every frame declares its charge — because the three
     things students get wrong are (1) thinking the arrow moves an atom, (2) not noticing the
     intermediate exists, and (3) drawing arrows that do not conserve charge. ══════════ */

  /* ── ORGANIC 42: curly — the PROTON TRANSFER. The arrows-first literature is explicit that the
     formalism should be built on a trivial proton transfer before any real reaction: one lone pair,
     one sigma bond, two arrows, done. Routing the first arrow lesson here rather than to
     substitution is a deliberate corpus recommendation. Concerted, so both arrows fire in ONE beat
     and the rail draws the missing intermediate as a visible absence. ── */
  { text: "Explain why ethanoic acid loses its O–H proton to hydroxide, and why the resulting carboxylate is so much more stable than an alkoxide.",
    blueprint: {meta:{title:"Proton transfer — your first two curly arrows",subject:"Organic Chemistry",concept_id:"proton_transfer_carboxylic_acid"},layout:"curly",mode:"concerted",
      reaction:"CH₃COOH + HO⁻ → CH₃COO⁻ + H₂O",
      note:"tail before head, every single time — say what the electrons are sitting on before you say where they go",
      frames:[
        {id:"f1",title:"the base takes the proton",kind:"step",charge:"−1",
         species:[{id:"b",slot:"left",label:"HO⁻",lp:3,charge:"−",note:"the base"},
                  {id:"a",slot:"right",label:"CH₃—C(=O)—O—H",note:"the acid"}],
         arrows:[{id:"a1",from:"b",to:"a",tail:"lone-pair",head:"atom",kind:"pair",label:"lone pair → the acidic hydrogen"},
                 {id:"a2",from:"a",to:"a",tail:"sigma",head:"atom",kind:"pair",label:"the O–H bond → its own oxygen"}]},
        {id:"f2",title:"conjugate base and conjugate acid",kind:"product",charge:"−1",
         badge:"carboxylate",why:"the minus is shared over TWO oxygens, so it is a comfortable place for a charge to sit",
         species:[{id:"p",slot:"left",label:"CH₃—COO⁻",lp:3,charge:"−",note:"the conjugate base"},
                  {id:"w",slot:"right",label:"H—OH",lp:2,note:"the conjugate acid"}],arrows:[]}],
      narration_steps:[
        {short:"Concerted",term:"concerted",narration_text:"Say the word first: this is concerted, meaning it all happens in one step with no intermediate. Two things are on the board — hydroxide, which is electron-rich, and ethanoic acid, whose oxygen–hydrogen bond is the weak point.",reveal:["f1"],active:["b"],point:"b",
         def:"Concerted means bond-making and bond-breaking happen together, in a single step."},
        {short:"Name the tail",term:"the tail",narration_text:"Before anything moves, look at where the electrons are sitting. It is this lone pair on the oxygen of hydroxide — a pair of electrons, not the oxygen atom itself. That distinction is the whole formalism.",reveal:["ledger"],active:["b"],point:"b",
         def:"A curly arrow always starts on electrons: a lone pair, a sigma bond, a pi bond or a negative charge."},
        {short:"Both arrows",term:"curly arrow",narration_text:"Now both arrows fire at the same time. The lone pair moves to the hydrogen, and the oxygen–hydrogen bonding pair moves onto its own oxygen. Notice the second arrow: the hydrogen leaves without its electrons, which is exactly what a proton is.",reveal:["a1","a2"],active:["a1","a2"],point:"a1",
         quiz:{q:"What does the tail of a curly arrow sit on?",options:["A pair of electrons — a lone pair or a bond","The atom that is about to move","Wherever there is space on the page"],answer:0,why:"An arrow tracks electrons. If you think it tracks atoms you will draw skeletons that never existed."}},
        {short:"The consequence",term:"conjugate base",narration_text:"And here is the consequence, drawn as its own frame, because the arrow caused this — it did not decorate it. The acid has become the carboxylate and hydroxide has become water.",reveal:["f2"],active:["p"],point:"p"},
        {short:"Why it happened",term:"resonance",narration_text:"Why did this proton go rather than one from an alcohol? Because the minus that is left behind is spread over two oxygens by resonance, and a shared charge is a stable charge. Stability of the conjugate base is what acidity actually measures.",reveal:["rail"],active:["p"],point:"p",
         quiz:{q:"Why is ethanoic acid far more acidic than ethanol?",options:["Its conjugate base spreads the charge over two oxygens","It has more hydrogens","Oxygen is more electronegative in acids"],answer:0,why:"Acidity is a statement about the conjugate base. Delocalise the charge and you stabilise it."}},
        {short:"Recap",term:"recap",narration_text:"Recap. Two arrows, both starting on electrons, both labelled, fired in one beat because the reaction is concerted — and the reason it happens at all is written on the product, not on the acid.",reveal:["f2"],active:["p"],point:"p"}],
      recap:["An arrow's tail is always electrons — a lone pair, a sigma bond or a pi bond.",
             "Concerted means one step and no intermediate; say the word out loud.",
             "Acidity is decided by how stable the conjugate base is."]} },

  /* ── ORGANIC 43: curly — S-N-TWO. Concerted mode, so both arrows appear in the same beat and the
     step rail renders the missing intermediate as an EMPTY dashed slot: the "no intermediate" fact
     is taught as an ABSENCE you can see, directly contrastable with the S-N-one rail below. ── */
  { text: "Explain the SN2 mechanism: why hydroxide attacks bromomethane from the back, why there is no intermediate, and why the carbon inverts.",
    blueprint: {meta:{title:"S-N-two — one step, backside attack, inversion",subject:"Organic Chemistry",concept_id:"sn2_backside_inversion"},layout:"curly",mode:"concerted",
      reaction:"HO⁻ + CH₃—Br → CH₃—OH + Br⁻",
      note:"look at the rail: the intermediate slot is empty, and that emptiness is the point",
      frames:[
        {id:"f1",title:"hydroxide attacks the back",kind:"step",charge:"−1",
         species:[{id:"nu",slot:"left",label:"HO⁻",lp:3,charge:"−",note:"strong nucleophile"},
                  {id:"sub",slot:"right",label:"H₃C—Br",note:"a methyl substrate — no bulk"}],
         arrows:[{id:"a1",from:"nu",to:"sub",tail:"lone-pair",head:"atom",kind:"pair",label:"lone pair → the carbon"},
                 {id:"a2",from:"sub",to:"sub",tail:"sigma",head:"atom",kind:"pair",label:"the C–Br bond → the bromine"}]},
        {id:"f2",title:"one transition state",kind:"ts",charge:"−1",
         badge:"transition state",why:"both bonds half made and half broken — never isolated, never drawn as a species",
         species:[{id:"ts",slot:"center",label:"[HO⋯CH₃⋯Br]",charge:"−",note:"the peak, not a pit"}],arrows:[]},
        {id:"f3",title:"inversion — the product",kind:"product",charge:"−1",
         badge:"inversion of configuration",why:"the carbon turns inside out, exactly like an umbrella in the wind",
         species:[{id:"pr",slot:"left",label:"CH₃—OH",note:"the product"},
                  {id:"lg",slot:"right",label:"Br⁻",lp:4,charge:"−",note:"the leaving group"}],arrows:[]}],
      narration_steps:[
        {short:"Say it in full",term:"S-N-two",narration_text:"S-N-two, said as letters, means substitution nucleophilic bimolecular — and the two is not a step count, it means the rate depends on two things: the substrate and the nucleophile.",reveal:["f1"],active:["sub"],point:"sub",
         def:"Bimolecular: doubling either reactant doubles the rate."},
        {short:"The tail",term:"the nucleophile",narration_text:"Start where the electrons are. Hydroxide has three lone pairs and a full negative charge, and one of those pairs is about to go looking for a positive carbon.",reveal:["ledger"],active:["nu"],point:"nu"},
        {short:"Both at once",term:"concerted",narration_text:"Now both arrows, in the same beat, because this is concerted. The lone pair comes in at the carbon while the carbon–bromine bonding pair leaves onto the bromine. Nothing waits for anything.",reveal:["a1","a2"],active:["a1","a2"],point:"a1",
         quiz:{q:"Why must the two arrows fire together?",options:["Carbon can never hold five bonds, so one must leave as the other arrives","To make the drawing tidier","Because bromine is heavier than oxygen"],answer:0,why:"A carbon with five bonds does not exist, which is precisely why the new bond forms as the old one breaks."}},
        {short:"From the back",term:"backside attack",narration_text:"And it comes in from directly opposite the bromine, one hundred and eighty degrees away, because that is the only side where the empty anti-bonding orbital is available. It also explains the rate order: methyl beats primary beats secondary, and tertiary is simply blocked.",reveal:["f2"],active:["ts"],point:"ts"},
        {short:"No pit",term:"transition state",narration_text:"This is a transition state, not an intermediate. It sits at the top of the energy hill and is never isolated — look at the rail and you will see the intermediate slot drawn empty. That absence is the whole difference from S-N-one.",reveal:["rail"],active:["ts"],point:"rail",
         def:"An intermediate sits in an energy valley and can in principle be trapped; a transition state cannot."},
        {short:"Inversion",term:"Walden inversion",narration_text:"Because the attack came from the back, the other three groups flip through, like an umbrella in the wind. That gives a single stereochemical outcome — inversion, every time — not a mixture.",reveal:["f3"],active:["pr"],point:"pr",
         quiz:{q:"What stereochemistry does SN2 give at a stereocentre?",options:["Clean inversion — one product","A racemic mixture","Retention of configuration"],answer:0,why:"One pathway, one geometry, one product. Mixtures come from flat carbocations, which SN2 never makes."}},
        {short:"Recap",term:"recap",narration_text:"Recap. One step, one transition state, no intermediate, backside attack and inversion — and every one of those follows from the single fact that the two arrows fired together.",reveal:["f3"],active:["pr"],point:"pr"}],
      recap:["SN2 is concerted: one step, one transition state, no intermediate.",
             "Backside attack at 180° gives clean inversion, not a mixture.",
             "Sterics set the rate: methyl > 1° > 2° >> 3° (blocked)."]} },

  /* ── ORGANIC 44: curly — S-N-ONE. Stepwise mode, so the carbocation gets a FULL held frame with a
     name badge and a stability line. The corpus calls SN1-vs-SN2 the highest-value comparison in the
     course, so this blueprint is deliberately the mirror image of 43 on every axis. ── */
  { text: "Explain the SN1 mechanism of 2-bromo-2-methylpropane with water: why the leaving group goes first, why the carbocation is planar, and why the product is racemic.",
    blueprint: {meta:{title:"S-N-one — the leaving group goes first",subject:"Organic Chemistry",concept_id:"sn1_carbocation_racemic"},layout:"curly",mode:"stepwise",
      reaction:"(CH₃)₃C—Br + H₂O → (CH₃)₃C—OH + HBr",
      note:"the rail has a filled intermediate slot — compare it with the empty one in the S-N-two video",
      frames:[
        {id:"f1",title:"the leaving group departs",kind:"step",charge:"0",
         species:[{id:"sub",slot:"center",label:"(CH₃)₃C—Br",note:"tertiary — three alkyl groups"}],
         arrows:[{id:"a1",from:"sub",to:"sub",tail:"sigma",head:"atom",kind:"pair",label:"the C–Br bond → the bromine"}]},
        {id:"f2",title:"the carbocation is held",kind:"intermediate",charge:"0",
         badge:"tertiary carbocation",why:"flat, sp² and electron-poor — three alkyl groups feed it electron density, so it is the stable kind",
         species:[{id:"cat",slot:"left",label:"(CH₃)₃C⁺",charge:"+",note:"planar, empty p orbital"},
                  {id:"br",slot:"right",label:"Br⁻",lp:4,charge:"−",note:"the leaving group"}],arrows:[]},
        {id:"f3",title:"water attacks — from either face",kind:"step",charge:"0",
         species:[{id:"cat2",slot:"left",label:"(CH₃)₃C⁺",charge:"+",note:"attackable from above OR below"},
                  {id:"w",slot:"right",label:"H₂O",lp:2,note:"a weak nucleophile is enough"},
                  {id:"br2",slot:"center",label:"Br⁻",lp:4,charge:"−",note:"just watching"}],
         arrows:[{id:"a2",from:"w",to:"cat2",tail:"lone-pair",head:"empty-orbital",kind:"pair",label:"lone pair → the empty p orbital"}]},
        {id:"f4",title:"a racemic product",kind:"product",charge:"0",
         badge:"racemic mixture",why:"a flat cation is attacked equally from both faces, so both enantiomers form in equal amounts",
         species:[{id:"pr",slot:"left",label:"(CH₃)₃C—OH",note:"after losing a proton"},
                  {id:"hbr",slot:"right",label:"H—Br",note:"the proton goes to bromide"}],arrows:[]}],
      narration_steps:[
        {short:"Say it in full",term:"S-N-one",narration_text:"S-N-one: substitution nucleophilic unimolecular. Unimolecular means only ONE thing appears in the rate law — the substrate. Adding more nucleophile does not speed it up at all, which already tells you the nucleophile is not in the slow step.",reveal:["f1"],active:["sub"],point:"sub"},
        {short:"Stepwise",term:"stepwise",narration_text:"And this one is stepwise, not concerted. The tail here is the carbon–bromine sigma bond itself, and it leaves all on its own, before any nucleophile shows up.",reveal:["a1"],active:["a1"],point:"a1",
         def:"Stepwise: a real, if short-lived, species forms in the middle."},
        {short:"The carbocation",term:"carbocation",narration_text:"This is a carbocation — say it car-boh-CAT-eye-on. It is flat, it is sp²-hybridised, and it has a completely empty p orbital sticking out above and below. It is also the slow step, so everything about the rate is decided right here.",reveal:["f2"],active:["cat"],point:"cat",
         def:"Only six electrons around that carbon — it is desperate for a pair.",
         quiz:{q:"Why does a tertiary carbocation form so much more readily than a primary one?",options:["Three alkyl groups donate electron density into the empty orbital","It is heavier, so it forms faster","Primary carbons have no p orbital"],answer:0,why:"Hyperconjugation and induction from the neighbouring alkyl groups spread the positive charge out."}},
        {short:"Either face",term:"planar",narration_text:"Now water arrives, and here is the payoff of that flatness: the lone pair can come into the empty p orbital from above or from below, and nothing prefers one side.",reveal:["f3","a2"],active:["a2"],point:"a2"},
        {short:"Racemic",term:"racemic mixture",narration_text:"So if the carbon was a stereocentre you get both enantiomers, in roughly equal amounts — a racemic mixture, said ruh-SEE-mik. Compare that with S-N-two, which gives clean inversion, and you can see why the two mechanisms are told apart by their products.",reveal:["f4"],active:["pr"],point:"pr",
         quiz:{q:"SN1 and SN2 differ in almost every way. Which pair is right?",options:["SN1: stepwise, 3° favoured, racemic. SN2: concerted, 1° favoured, inversion","Both are concerted; only the solvent differs","SN1 needs a strong nucleophile, SN2 a weak one"],answer:0,why:"They are mirror images on substrate, kinetics, intermediate and stereochemistry — learn them as a contrast, never separately."}},
        {short:"The trap",term:"rearrangement",narration_text:"One warning before you go. Because a real cation exists here, it can rearrange — a hydride or a methyl can shift to make a more stable cation — which is why the product sometimes is not where the leaving group was.",reveal:["rail"],active:["pr"],point:"rail"},
        {short:"Recap",term:"recap",narration_text:"Recap. Leaving group first, flat carbocation held in the middle, then attack from either face — so the rail has a filled intermediate slot and the product is racemic.",reveal:["f4"],active:["pr"],point:"pr"}],
      recap:["SN1 is stepwise: the leaving group goes first and a carbocation forms.",
             "The carbocation is planar, so attack from both faces gives a racemic mixture.",
             "A real cation can rearrange — the product is not always where the leaving group was."]} },

  /* ── ORGANIC 45: curly — ELECTROPHILIC ADDITION. The corpus calls this THE critical juncture for
     the whole formalism, because it is the first mechanism where an arrow's tail sits on a PI BOND
     rather than an atom or a lone pair. So beat one dwells on the pi bond by itself, and Markovnikov
     is derived on screen from carbocation stability rather than asserted as a rule. ── */
  { text: "Explain the addition of HBr to propene, including Markovnikov's rule and why the bromine ends up on the middle carbon.",
    blueprint: {meta:{title:"Adding H—Br to propene — Markovnikov, derived not memorised",subject:"Organic Chemistry",concept_id:"electrophilic_addition_markovnikov"},layout:"curly",mode:"stepwise",
      reaction:"CH₃—CH=CH₂ + H—Br → CH₃—CHBr—CH₃",
      note:"this is the first mechanism where an arrow starts on a BOND rather than an atom — slow down here",
      frames:[
        {id:"f1",title:"the π bond attacks the proton",kind:"step",charge:"0",
         species:[{id:"alk",slot:"left",label:"CH₃—CH=CH₂",note:"the alkene is the NUCLEOPHILE"},
                  {id:"hbr",slot:"right",label:"H—Br",lp:3,note:"the electrophile"}],
         arrows:[{id:"a1",from:"alk",to:"hbr",tail:"pi",head:"atom",kind:"pair",label:"the π bond → the hydrogen"},
                 {id:"a2",from:"hbr",to:"hbr",tail:"sigma",head:"atom",kind:"pair",label:"the H–Br bond → the bromine"}]},
        {id:"f2",title:"the carbocation you actually get",kind:"intermediate",charge:"0",
         badge:"secondary carbocation",why:"the proton added to the END carbon, so the plus lands on the middle one — the more substituted, more stable option",
         species:[{id:"cat",slot:"left",label:"CH₃—CH⁺—CH₃",charge:"+",note:"2° — two alkyl neighbours"},
                  {id:"br",slot:"right",label:"Br⁻",lp:4,charge:"−",note:"waiting"}],arrows:[]},
        {id:"f3",title:"the one you do NOT get",kind:"danger",charge:"0",
         badge:"primary carbocation",why:"only one alkyl neighbour, so it is far higher in energy — this is the path not taken",
         species:[{id:"bad",slot:"center",label:"⁺CH₂—CH₂—CH₃",charge:"+",note:"1° — much less stable"}],arrows:[]},
        {id:"f4",title:"bromide closes in",kind:"step",charge:"0",
         species:[{id:"cat2",slot:"left",label:"CH₃—CH⁺—CH₃",charge:"+",note:"flat, empty p orbital"},
                  {id:"br2",slot:"right",label:"Br⁻",lp:4,charge:"−",note:"the nucleophile now"}],
         arrows:[{id:"a3",from:"br2",to:"cat2",tail:"lone-pair",head:"empty-orbital",kind:"pair",label:"lone pair → the empty p orbital"}]},
        {id:"f5",title:"2-bromopropane",kind:"product",charge:"0",
         badge:"Markovnikov product",why:"the bromine sits on the more substituted carbon — a consequence of cation stability, not a rule to memorise",
         species:[{id:"pr",slot:"center",label:"CH₃—CHBr—CH₃",note:"the major product"}],arrows:[]}],
      narration_steps:[
        {short:"Flip your model",term:"the alkene",narration_text:"Everything you learned in substitution now flips. There the substrate was the target; here the alkene is the attacker. A double bond is a fat, exposed cloud of electrons, and that makes it the nucleophile.",reveal:["f1"],active:["alk"],point:"alk"},
        {short:"Look at the tail",term:"the π bond",narration_text:"Look very carefully at where this arrow starts. Not on a carbon, not on a lone pair — on the pi bond itself, those two electrons sitting above and below the plane. This is the first time an arrow starts on a bond, and it is the moment most students quietly stop trusting arrows.",reveal:["ledger"],active:["alk"],point:"alk",
         def:"A pi bond is made by p orbitals overlapping sideways; its two electrons are the loosest ones in the molecule.",
         quiz:{q:"Where does the first arrow's tail sit?",options:["On the two electrons of the π bond","On the carbon atom at the end of the chain","On the hydrogen of H–Br"],answer:0,why:"Tail on the bond, not the atom. Getting this one wrong is what makes every later mechanism feel arbitrary."}},
        {short:"Two arrows",term:"electrophile",narration_text:"So the pi electrons reach out and grab the hydrogen, and at the same time the hydrogen–bromine bonding pair falls back onto the bromine. The hydrogen arrives without its electrons — as a proton.",reveal:["a1","a2"],active:["a1","a2"],point:"a1"},
        {short:"Which carbon?",term:"carbocation",narration_text:"Now the question that decides the whole product. The proton could land on either carbon of the double bond, and whichever one takes it, the OTHER carbon is left holding the positive charge.",reveal:["f2"],active:["cat"],point:"cat"},
        {short:"The road not taken",term:"stability",narration_text:"Here is the alternative, drawn so you can see it lose. Put the proton on the middle carbon and you get a primary cation with only one alkyl neighbour — much higher in energy, so that route is far slower.",reveal:["f3"],active:["bad"],point:"bad",
         quiz:{q:"Markovnikov's rule works because…",options:["The proton adds so as to give the more stable carbocation","Hydrogen prefers carbons that already have hydrogens","Bromine is too big for the end carbon"],answer:0,why:"'The rich get richer' is a mnemonic for a consequence. The cause is carbocation stability."}},
        {short:"Bromide's turn",term:"nucleophilic attack",narration_text:"With the stable cation in hand, bromide — which has been waiting with four lone pairs and a full negative charge — donates a pair straight into that empty p orbital.",reveal:["f4","a3"],active:["a3"],point:"a3"},
        {short:"The payoff",term:"Markovnikov",narration_text:"And that is why the bromine ends up on the middle carbon. Markovnikov, said mar-KOV-nih-koff, is not a rule you obey — it is what falls out once you ask which carbocation is more stable.",reveal:["f5"],active:["pr"],point:"pr"},
        {short:"Recap",term:"recap",narration_text:"Recap. The pi bond attacks, the more stable carbocation wins, and the nucleophile lands there — so the position of the bromine was decided two frames before it ever arrived.",reveal:["rail"],active:["pr"],point:"pr"}],
      recap:["In addition the alkene is the nucleophile — the π bond attacks.",
             "The arrow's tail is on the π BOND, not on a carbon atom.",
             "Markovnikov is a consequence of carbocation stability, not a rule to memorise."]} },

  /* ── ORGANIC 46: curly — ELECTROPHILIC AROMATIC SUBSTITUTION. Ranked the single hardest organic
     topic in at least one teacher-and-student survey. The arenium ion gets the held frame, because
     the "why substitute rather than add" logic is usually stated in one line and skipped. Charge is
     kept at zero on every frame by keeping the bisulfate counter-ion on the board — which is also
     how the student learns that the ledger is a self-check. ── */
  { text: "Explain the nitration of benzene: why benzene substitutes rather than adds, what the arenium ion is, and why aromaticity is restored at the end.",
    blueprint: {meta:{title:"Nitration of benzene — lose aromaticity, then get it back",subject:"Organic Chemistry",concept_id:"eas_nitration_arenium"},layout:"curly",mode:"stepwise",
      reaction:"C₆H₆ + ⁺NO₂ → C₆H₅NO₂ + H⁺",
      note:"watch the charge ledger stay at zero — if yours drifts, an arrow is wrong",
      frames:[
        {id:"f1",title:"the ring attacks the electrophile",kind:"step",charge:"0",
         species:[{id:"ring",slot:"left",label:"C₆H₆",note:"benzene — a delocalised π ring"},
                  {id:"e",slot:"center",label:"⁺NO₂",charge:"+",note:"the REAL electrophile"},
                  {id:"hs",slot:"right",label:"HSO₄⁻",lp:3,charge:"−",note:"the base, waiting"}],
         arrows:[{id:"a1",from:"ring",to:"e",tail:"pi",head:"atom",kind:"pair",label:"one π bond → the nitrogen"}]},
        {id:"f2",title:"the arenium ion is held",kind:"intermediate",charge:"0",
         badge:"arenium ion (σ-complex)",why:"aromaticity is temporarily LOST, and the plus is spread over three ring carbons",
         species:[{id:"ar",slot:"left",label:"[C₆H₆NO₂]⁺",charge:"+",note:"one carbon is now sp³"},
                  {id:"hs2",slot:"right",label:"HSO₄⁻",lp:3,charge:"−",note:"about to act"}],arrows:[]},
        {id:"f3",title:"the base removes the proton",kind:"step",charge:"0",
         species:[{id:"ar2",slot:"left",label:"[C₆H₆NO₂]⁺",charge:"+",note:"the sp³ carbon still holds an H"},
                  {id:"hs3",slot:"right",label:"HSO₄⁻",lp:3,charge:"−",note:"the base"}],
         arrows:[{id:"a2",from:"hs3",to:"ar2",tail:"lone-pair",head:"atom",kind:"pair",label:"lone pair → that hydrogen"},
                 {id:"a3",from:"ar2",to:"ar2",tail:"sigma",head:"bond",kind:"pair",label:"the C–H bond → back into the ring"}]},
        {id:"f4",title:"aromaticity restored",kind:"product",charge:"0",
         badge:"nitrobenzene",why:"six delocalised electrons are back — the whole reaction existed to get here",
         species:[{id:"pr",slot:"left",label:"C₆H₅NO₂",note:"substituted, not added to"},
                  {id:"acid",slot:"right",label:"H₂SO₄",note:"the catalyst is regenerated"}],arrows:[]}],
      narration_steps:[
        {short:"The real question",term:"aromaticity",narration_text:"Start with the question nobody answers properly. Why does benzene SUBSTITUTE when every other double bond ADDS? Because adding would permanently destroy the delocalised ring, and substituting hands it back.",reveal:["f1"],active:["ring"],point:"ring",
         def:"Aromaticity is a big stabilisation — roughly 150 kilojoules per mole that benzene will not give up."},
        {short:"Make the attacker",term:"the electrophile",narration_text:"Second thing students skip: the reagent you write down is not the thing that reacts. Nitric acid plus sulfuric acid generates the nitronium ion, plus-N-O-two, and only that is electrophilic enough for a lazy aromatic ring.",reveal:["ledger"],active:["e"],point:"e",
         quiz:{q:"Why is the nitronium ion needed rather than nitric acid itself?",options:["Benzene is a weak nucleophile, so it needs a genuinely strong electrophile","Nitric acid is too dilute","Because sulfuric acid smells worse"],answer:0,why:"A delocalised ring is stabilised and reluctant; only a full cation will tempt it."}},
        {short:"The ring attacks",term:"π bond",narration_text:"Now the arrow. Its tail is one of the ring's pi bonds — the ring is the nucleophile here — and it reaches out to the nitrogen. Notice what that costs: the moment those electrons localise, the delocalisation is broken.",reveal:["a1"],active:["a1"],point:"a1"},
        {short:"Hold it",term:"arenium ion",narration_text:"This is the arenium ion, said uh-REE-nee-um, also called the sigma complex. One ring carbon has gone tetrahedral, the aromaticity is gone, and the positive charge is spread over three of the remaining carbons.",reveal:["f2"],active:["ar"],point:"ar",
         def:"It is a resonance-stabilised carbocation — unstable for a ring, but far better than a lone cation.",
         quiz:{q:"What is temporarily true of the arenium ion?",options:["It is not aromatic — the delocalised ring is broken","It has seven carbons","It carries a negative charge"],answer:0,why:"That temporary loss is exactly why the next step happens: the molecule is trying to get its aromaticity back."}},
        {short:"Take the proton",term:"deprotonation",narration_text:"So a base — the bisulfate that has been sitting there the whole time — takes the hydrogen off that sp³ carbon, and the carbon–hydrogen bonding pair drops back into the ring.",reveal:["f3","a2","a3"],active:["a2","a3"],point:"a2"},
        {short:"Why not add?",term:"substitution",narration_text:"And there it is. Restoring six delocalised electrons is worth far more than the new bond an addition would have given, so the ring throws away a hydrogen instead. Substitution is not a preference — it is arithmetic.",reveal:["f4"],active:["pr"],point:"pr"},
        {short:"Directing",term:"directing effects",narration_text:"One last thing to carry forward. Whether the next group lands ortho, meta or para is decided by whether the substituent already there can stabilise that positive charge — so the directing rules are just this arenium ion, drawn three times.",reveal:["rail"],active:["pr"],point:"rail"},
        {short:"Recap",term:"recap",narration_text:"Recap. Make a real electrophile, let the ring attack it, hold the arenium ion and name it, then lose a proton to get the aromaticity back. Two steps, one intermediate, one reason.",reveal:["f4"],active:["pr"],point:"pr"}],
      recap:["Benzene substitutes rather than adds because addition would destroy aromaticity.",
             "The arenium ion (σ-complex) is the key intermediate — name it and hold it.",
             "Directing effects are just the arenium ion redrawn for each attack position."]} },

  /* ── ORGANIC 47: curly — NUCLEOPHILIC ADDITION TO A CARBONYL, with the BRANCH. The corpus calls
     the branch point the most economical teaching move in Orgo 1: one tetrahedral intermediate,
     and whether it protonates or collapses is decided purely by whether a leaving group is present.
     Rendering that branch once buys you aldehydes, ketones, esters, acid chlorides and amides. ── */
  { text: "Explain the reduction of ethanal by sodium borohydride, the tetrahedral intermediate, and why an ester behaves differently from an aldehyde.",
    blueprint: {meta:{title:"Attacking a carbonyl — one intermediate, two fates",subject:"Organic Chemistry",concept_id:"carbonyl_tetrahedral_branch"},layout:"curly",mode:"stepwise",
      reaction:"CH₃CH=O + H⁻ → CH₃CH(O⁻)H → CH₃CH(OH)H",
      note:"the carbonyl carbon goes flat sp² → tetrahedral sp³ — that shape change IS the reaction",
      frames:[
        {id:"f1",title:"hydride attacks the carbonyl carbon",kind:"step",charge:"−1",
         species:[{id:"nu",slot:"left",label:"H—BH₃⁻",charge:"−",note:"from sodium borohydride"},
                  {id:"c",slot:"right",label:"CH₃—CH=O",lp:2,note:"the carbon is δ+"}],
         arrows:[{id:"a1",from:"nu",to:"c",tail:"sigma",head:"atom",kind:"pair",label:"a B–H bond → the carbonyl carbon"},
                 {id:"a2",from:"c",to:"c",tail:"pi",head:"atom",kind:"pair",label:"the C=O π bond → the oxygen"}]},
        {id:"f2",title:"the tetrahedral intermediate",kind:"intermediate",charge:"−1",
         badge:"tetrahedral intermediate",why:"the carbon has gone from flat sp² to tetrahedral sp³, and the charge now sits on oxygen, which can take it",
         species:[{id:"ti",slot:"center",label:"CH₃—CH(H)—O⁻",lp:3,charge:"−",note:"an alkoxide"}],arrows:[]},
        {id:"f3",title:"no leaving group → protonate",kind:"step",charge:"−1",
         species:[{id:"ti2",slot:"left",label:"CH₃—CH(H)—O⁻",lp:3,charge:"−",note:"nothing to expel"},
                  {id:"w",slot:"right",label:"H—OH",lp:2,note:"the work-up"}],
         arrows:[{id:"a3",from:"ti2",to:"w",tail:"lone-pair",head:"atom",kind:"pair",label:"an oxygen lone pair → the proton"},
                 {id:"a4",from:"w",to:"w",tail:"sigma",head:"atom",kind:"pair",label:"the O–H bond → its own oxygen"}]},
        {id:"f4",title:"leaving group present → it collapses",kind:"danger",charge:"−1",
         badge:"addition–elimination",why:"an ester has an OEt to expel, so the C=O re-forms and you get SUBSTITUTION, not addition",
         species:[{id:"ti3",slot:"center",label:"CH₃—C(H)(O⁻)—OEt",lp:3,charge:"−",note:"same intermediate, one extra group"}],
         arrows:[{id:"a5",from:"ti3",to:"ti3",tail:"lone-pair",head:"bond",kind:"pair",label:"an oxygen lone pair → re-form the C=O"}]},
        {id:"f5",title:"the alcohol",kind:"product",charge:"−1",
         badge:"addition product",why:"with an aldehyde or ketone there is nothing to expel, so the intermediate simply keeps the proton",
         species:[{id:"pr",slot:"left",label:"CH₃—CH(OH)—H",note:"ethanol"},
                  {id:"oh",slot:"right",label:"HO⁻",lp:3,charge:"−",note:"left over"}],arrows:[]}],
      narration_steps:[
        {short:"Opposite polarity",term:"the carbonyl",narration_text:"Last video the pi bond attacked. Here the pi system is attacked — because oxygen pulls the electrons over and leaves the carbon delta-positive. Say it out loud: the carbonyl carbon is an electrophile.",reveal:["f1"],active:["c"],point:"c",
         def:"δ+ means a partial positive charge — not a full plus, but enough to make the carbon a target."},
        {short:"The hydride",term:"hydride",narration_text:"Sodium borohydride does not hand over a bare hydrogen ion; it delivers one from a boron–hydrogen bond. So the tail of our first arrow is that sigma bond, and the head is the carbon.",reveal:["ledger"],active:["nu"],point:"nu"},
        {short:"Two arrows",term:"nucleophilic addition",narration_text:"The hydride arrives at the carbon, and because carbon cannot have five bonds, the carbon–oxygen pi pair has to go somewhere. It goes up onto the oxygen, which is delighted to hold a negative charge.",reveal:["a1","a2"],active:["a1","a2"],point:"a1",
         quiz:{q:"Why must the C=O π bond break as the nucleophile arrives?",options:["Otherwise carbon would have five bonds","Because oxygen is electronegative","To conserve the total charge"],answer:0,why:"Same reason as SN2: carbon's octet is full at four bonds, so something must give way."}},
        {short:"Flat to tetrahedral",term:"tetrahedral intermediate",narration_text:"And this is the species with the name nobody learns: the tetrahedral intermediate. The carbon started flat, with three groups at a hundred and twenty degrees, and it has just become a proper tetrahedron.",reveal:["f2"],active:["ti"],point:"ti",
         def:"sp² → sp³. If you can picture that flip, you can picture every carbonyl reaction there is."},
        {short:"The branch",term:"the branch point",narration_text:"Now everything turns on ONE question: is there a leaving group on that carbon? With an aldehyde or a ketone, there is not — so the intermediate just grabs a proton on work-up and you have an alcohol.",reveal:["f3","a3","a4"],active:["a3"],point:"a3"},
        {short:"The other branch",term:"addition–elimination",narration_text:"But hand the same carbon an O-ethyl, as an ester does, and the oxygen's lone pair pushes back down, re-forms the double bond and kicks that group out. Same start, same intermediate, completely different chapter.",reveal:["f4","a5"],active:["a5"],point:"a5",
         quiz:{q:"What decides addition versus substitution at a carbonyl?",options:["Whether the tetrahedral intermediate has a leaving group to expel","The temperature","Whether the nucleophile is charged"],answer:0,why:"One mechanism, one branch point. Aldehydes and ketones add; acid derivatives substitute."}},
        {short:"The product",term:"addition",narration_text:"For our aldehyde the answer was no leaving group, so we finish with the alcohol. Notice sodium borohydride never touched the ester — it is a mild reducing agent, and that selectivity is exam gold.",reveal:["f5"],active:["pr"],point:"pr"},
        {short:"Recap",term:"recap",narration_text:"Recap. The carbon is delta-positive, the nucleophile lands, the carbon goes flat to tetrahedral, and then one question — leaving group or not — decides whether you are doing addition or substitution.",reveal:["rail"],active:["pr"],point:"pr"}],
      recap:["The carbonyl carbon is δ+ — here the π system is attacked, not the attacker.",
             "The tetrahedral intermediate is the key species: sp² becomes sp³.",
             "Leaving group present → it collapses (substitution); absent → it protonates (addition)."]} },

  /* ── ORGANIC 48: curly in RADICAL mode. The corpus complaint is that the notation changes and
     nobody flags it loudly enough, so the renderer changes colour AND arrowhead: every arrow here is
     a fishhook, and the check rejects a double-barbed arrow outright. Propagation is laid out as the
     two steps that regenerate the carrier, which is what makes it a chain. ── */
  { text: "Explain the free-radical bromination of ethane: initiation, propagation and termination, and why the arrows are different from every other mechanism.",
    blueprint: {meta:{title:"Radical bromination — fishhooks, and a chain that turns over",subject:"Organic Chemistry",concept_id:"radical_halogenation_chain"},layout:"curly",mode:"radical",
      reaction:"CH₃CH₃ + Br₂ --hv--> CH₃CH₂Br + HBr",
      note:"one initiation event can drive thousands of propagation turns — that is what 'chain' means",
      frames:[
        {id:"f1",title:"initiation — the bond splits evenly",kind:"step",charge:"0",
         species:[{id:"br2",slot:"center",label:"Br—Br",lp:4,note:"light or heat does this"}],
         arrows:[{id:"a1",from:"br2",to:"br2",tail:"sigma",head:"atom",kind:"fishhook",label:"one electron goes this way"},
                 {id:"a2",from:"br2",to:"br2",tail:"sigma",head:"atom",kind:"fishhook",label:"the other goes that way"}]},
        {id:"f2",title:"propagation one — steal a hydrogen",kind:"step",charge:"0",
         species:[{id:"r",slot:"left",label:"Br•",note:"the chain carrier"},
                  {id:"m",slot:"right",label:"CH₃—CH₃",note:"the alkane"}],
         arrows:[{id:"a3",from:"r",to:"m",tail:"radical",head:"bond",kind:"fishhook",label:"the unpaired electron → the C–H bond"},
                 {id:"a4",from:"m",to:"m",tail:"sigma",head:"atom",kind:"fishhook",label:"one C–H electron → the carbon"}]},
        {id:"f3",title:"the carbon radical",kind:"intermediate",charge:"0",
         badge:"alkyl radical",why:"stability runs 3° > 2° > 1°, exactly like a carbocation — which is why bromination is selective",
         species:[{id:"cr",slot:"left",label:"•CH₂—CH₃",note:"the new carrier"},
                  {id:"hb",slot:"right",label:"H—Br",note:"made in this step"}],arrows:[]},
        {id:"f4",title:"propagation two — the chain turns over",kind:"step",charge:"0",
         species:[{id:"cr2",slot:"left",label:"•CH₂—CH₃",note:"attacks the halogen"},
                  {id:"bb",slot:"right",label:"Br—Br",lp:4,note:"fresh bromine"}],
         arrows:[{id:"a5",from:"cr2",to:"bb",tail:"radical",head:"bond",kind:"fishhook",label:"the unpaired electron → the Br–Br bond"},
                 {id:"a6",from:"bb",to:"bb",tail:"sigma",head:"atom",kind:"fishhook",label:"one Br–Br electron → the far bromine"}]},
        {id:"f5",title:"termination — two carriers meet",kind:"product",charge:"0",
         badge:"termination",why:"radicals are rare, so two of them meeting is rare — which is exactly why the chain runs so long before it stops",
         species:[{id:"p",slot:"left",label:"CH₃—CH₂—Br",note:"the product"},
                  {id:"r2",slot:"right",label:"Br•",note:"regenerated — go round again"}],arrows:[]}],
      narration_steps:[
        {short:"The rules changed",term:"homolysis",narration_text:"Stop and notice something before any chemistry happens. These arrows have half a head. That is a fishhook, and it means ONE electron moved, not a pair. Using your usual arrow here is the single most common radical mistake.",reveal:["f1"],active:["br2"],point:"br2",
         def:"Homolysis, said hoh-MOL-iss-iss: the bond splits evenly, one electron to each fragment."},
        {short:"Initiation",term:"initiation",narration_text:"Light or heat splits the bromine molecule right down the middle. Two fishhooks, one bond, two bromine radicals — each with a single unpaired electron and a strong desire to pair it up.",reveal:["a1","a2"],active:["a1","a2"],point:"a1",
         quiz:{q:"What does a fishhook arrow move?",options:["One electron","Two electrons","A whole atom"],answer:0,why:"Half an arrowhead, half an electron pair. The notation is telling you the bookkeeping has changed."}},
        {short:"Propagation one",term:"propagation",narration_text:"The bromine radical wants a partner, so it takes a hydrogen atom — the hydrogen and one of its bonding electrons — off the ethane. That leaves the other electron behind, on the carbon.",reveal:["f2","a3","a4"],active:["a3","a4"],point:"a3"},
        {short:"A new carrier",term:"alkyl radical",narration_text:"So now the radical has moved: it is on carbon. Radical stability follows the same ladder as carbocations, tertiary above secondary above primary, which is why bromination picks its hydrogen carefully while chlorination barely picks at all.",reveal:["f3"],active:["cr"],point:"cr",
         def:"Selective means it strongly prefers one position; bromine is fussy, chlorine is not."},
        {short:"Propagation two",term:"the chain",narration_text:"The carbon radical now attacks a fresh bromine molecule, takes one bromine for itself — and hands the OTHER bromine back as a radical. That is the crucial part: the carrier is regenerated.",reveal:["f4","a5","a6"],active:["a5","a6"],point:"a5",
         quiz:{q:"Why are these two steps called PROPAGATION?",options:["Each one consumes a radical and produces another, so the chain continues","They happen first","They cannot be reversed"],answer:0,why:"Carrier in, carrier out. One initiation can therefore drive thousands of turns of the loop."}},
        {short:"Termination",term:"termination",narration_text:"The loop only stops when two radicals happen to find each other and pair up. Radicals are scarce, so that is rare — which is exactly why one photon can produce an enormous amount of product.",reveal:["f5"],active:["p"],point:"p"},
        {short:"The bonus",term:"anti-Markovnikov",narration_text:"And a payoff for the last video: adding hydrogen bromide to an alkene with peroxides gives the ANTI-Markovnikov product — not because Markovnikov has exceptions, but because with radicals you are running this mechanism instead.",reveal:["rail"],active:["p"],point:"rail"},
        {short:"Recap",term:"recap",narration_text:"Recap. Fishhook arrows move one electron. Initiation makes the carrier, two propagation steps regenerate it in a loop, and termination is the rare accident that ends the chain.",reveal:["f5"],active:["p"],point:"p"}],
      recap:["Fishhook = one electron. Never use a double-barbed arrow in a radical mechanism.",
             "Propagation regenerates the carrier — that is what makes it a chain.",
             "Anti-Markovnikov HBr addition is a radical mechanism, not an exception to a rule."]} },

  /* ── ORGANIC 49: curly in RESONANCE mode. The corpus is emphatic that this is the single best
     demonstration the renderer earns its keep: resonance and mechanism share a notation, and only a
     view that DISTINGUISHES them can teach the difference. The frame border goes dashed and blue,
     the arrows change colour, and a persistent caption says "electrons only, atoms never move". ── */
  { text: "Explain resonance in the ethanoate ion: why the two structures are not in equilibrium, and what the real ion looks like.",
    blueprint: {meta:{title:"Resonance — one molecule, two drawings, no flipping",subject:"Organic Chemistry",concept_id:"resonance_carboxylate_delocalised"},layout:"curly",mode:"resonance",
      reaction:"CH₃COO⁻  ↔  CH₃COO⁻   (the same ion, drawn twice)",
      note:"the double-headed arrow is NOT the equilibrium arrow — nothing is going back and forth",
      frames:[
        {id:"f1",title:"one legal drawing",kind:"step",charge:"−1",
         species:[{id:"a",slot:"center",label:"CH₃—C(=O)—O⁻",lp:3,charge:"−",note:"minus on the right-hand oxygen"}],
         arrows:[{id:"a1",from:"a",to:"a",tail:"anion",head:"bond",kind:"pair",label:"the negative charge → the C–O bond"},
                 {id:"a2",from:"a",to:"a",tail:"pi",head:"atom",kind:"pair",label:"the C=O π bond → the other oxygen"}]},
        {id:"f2",title:"the other legal drawing",kind:"step",charge:"−1",
         species:[{id:"b",slot:"center",label:"CH₃—C(—O⁻)=O",lp:3,charge:"−",note:"minus on the left-hand oxygen"}],arrows:[]},
        {id:"f3",title:"what is actually there",kind:"product",charge:"−1",
         badge:"the delocalised average",why:"two identical C–O bonds, each one-and-a-half, each oxygen holding half a minus — and X-ray measurements agree",
         species:[{id:"c",slot:"center",label:"CH₃—C(⋯O⋯O)",charge:"½−",note:"one structure, dashed bonds"}],arrows:[]}],
      narration_steps:[
        {short:"Not a reaction",term:"resonance",narration_text:"Everything about this looks like the last five videos — same curly arrows, same tails — but it is not a reaction. Nothing is turning into anything. This is one molecule that a single drawing cannot capture.",reveal:["f1"],active:["a"],point:"a",
         def:"Resonance is a limitation of our notation, not a behaviour of the molecule."},
        {short:"The arrows",term:"delocalisation",narration_text:"Here the negative charge pushes down to make a new bond, and the existing pi bond gets pushed up onto the other oxygen. Two arrows, both starting on electrons, and — this is the rule — not one atom has moved.",reveal:["a1","a2"],active:["a1","a2"],point:"a1",
         quiz:{q:"What is allowed to move between resonance structures?",options:["Only electrons — never atoms","Electrons and hydrogen atoms","Anything, as long as the formula is unchanged"],answer:0,why:"If you moved an atom you drew a different compound. Redrawing skeletons is the classic error here."}},
        {short:"The second drawing",term:"contributor",narration_text:"And this is the result: the minus has swapped oxygens and so has the double bond. Both drawings are equally good, because the two oxygens are identical — so both contribute equally.",reveal:["f2"],active:["b"],point:"b"},
        {short:"The misconception",term:"not equilibrium",narration_text:"Now kill the big one. The molecule does not flip between these two pictures. There is no moment when it is one and a moment when it is the other. The double-headed arrow is a note to the reader, not an equilibrium.",reveal:["ledger"],active:["b"],point:"b",
         quiz:{q:"How often does the carboxylate switch between its two resonance structures?",options:["Never — it is always the single delocalised average","Millions of times a second","Once per collision"],answer:0,why:"A mule is not a horse on Mondays and a donkey on Tuesdays. It is one thing, all the time."}},
        {short:"The real ion",term:"the average",narration_text:"What is actually there is this: one structure with two identical carbon–oxygen bonds, each one and a half bonds long, and half a negative charge on each oxygen. Measure them and they come out the same length.",reveal:["f3"],active:["c"],point:"c",
         def:"The real molecule is the weighted average of the contributors, and it is lower in energy than any of them."},
        {short:"Recap",term:"recap",narration_text:"Recap. Same arrows, different job — bookkeeping inside one species, not a change from one species to another. Electrons move, atoms never do, and the truth is the average.",reveal:["rail"],active:["c"],point:"c"}],
      recap:["Resonance structures are drawings, not states — the molecule never flips.",
             "Only electrons move between contributors; atoms never do.",
             "The real species is the delocalised average, and it is more stable than any one drawing."]} },

  /* ── ORGANIC 50: tree — FUNCTIONAL GROUPS. The corpus calls this the highest-value single tree in
     the course, and pairs recognition with the NAMING-PRIORITY order, because that ordering genuinely
     IS a hierarchy and it is where groups collide with nomenclature. Branch by heteroatom, because
     that is how you spot one embedded in a bigger skeleton. ── */
  { text: "List the main functional groups, how to tell the confusable pairs apart, and which group wins when several are present in one molecule.",
    blueprint: {meta:{title:"Functional groups — spot them, then rank them",subject:"Organic Chemistry",concept_id:"functional_groups_and_priority"},layout:"tree",root:"fg",
      nodes:[{id:"fg",label:"Functional groups",note:"the reactive part of any molecule"},
             {id:"o",parent:"fg",label:"Oxygen-containing",note:"the biggest family"},
             {id:"n",parent:"fg",label:"Nitrogen-containing",note:"amine, amide, nitrile"},
             {id:"x",parent:"fg",label:"Halogen",note:"C—F, Cl, Br, I"},
             {id:"u",parent:"fg",label:"C—C unsaturation",note:"alkene, alkyne, arene"},
             {id:"oh",parent:"o",label:"Alcohol  R—OH",note:"suffix -ol"},
             {id:"co",parent:"o",label:"Carbonyl  C=O",note:"aldehyde vs ketone"},
             {id:"ac",parent:"o",label:"Acid & derivatives",note:"acid, ester, amide"},
             {id:"et",parent:"o",label:"Ether  R—O—R",note:"no H on the oxygen"},
             {id:"al",parent:"co",label:"Aldehyde — CHO",note:"C=O at the END of a chain"},
             {id:"ke",parent:"co",label:"Ketone — CO—",note:"C=O in the MIDDLE"},
             {id:"pri",parent:"fg",label:"Naming priority",note:"acid > ester > amide > aldehyde > ketone > alcohol > amine"}],
      narration_steps:[
        {short:"Two skills",term:"functional group",narration_text:"A functional group is the reactive handle on an otherwise dull carbon skeleton. There are two separate skills here — spotting one inside a bigger molecule, and ranking it against the others — and exams test both.",reveal:["fg"],active:["fg"],point:"fg"},
        {short:"Sort by atom",term:"heteroatom",narration_text:"Do not learn them as fifteen flashcards. Sort them by the atom that is not carbon or hydrogen, because that is what your eye can actually find in a drawing: oxygen, nitrogen, a halogen, or just a double bond.",reveal:["o","n","x","u"],active:["o"],point:"o",
         def:"A heteroatom is any atom in the skeleton that is not carbon."},
        {short:"Oxygen family",term:"oxygen groups",narration_text:"Oxygen gives you the most. An oxygen with a hydrogen on it is an alcohol; an oxygen double-bonded to carbon is a carbonyl; an oxygen with a carbon on each side and no hydrogen is an ether.",reveal:["oh","co","et"],active:["co"],point:"co"},
        {short:"The classic pair",term:"aldehyde vs ketone",narration_text:"Here is the pair that costs the most marks. An aldehyde has its carbon–oxygen double bond at the END of the chain, so it still carries a hydrogen. A ketone has it in the MIDDLE, with carbons on both sides. Position, not appearance.",reveal:["al","ke"],active:["al"],point:"al",
         quiz:{q:"You see C=O with a hydrogen attached to that carbon. What is it?",options:["An aldehyde","A ketone","An ester"],answer:0,why:"The hydrogen on the carbonyl carbon is the tell — it also explains why aldehydes oxidise and ketones do not."}},
        {short:"Acid family",term:"acid derivatives",narration_text:"Then the carboxylic acid and everything derived from it — swap the acid's O-H for an O-R and you have an ester, swap it for an N and you have an amide. One parent, several children.",reveal:["ac"],active:["ac"],point:"ac"},
        {short:"Nitrogen and the rest",term:"amine",narration_text:"Nitrogen alone on a carbon is an amine, said uh-MEEN; nitrogen next to a carbonyl is an amide, AM-ide. Say those two slowly and separately, because they look alike written down and behave nothing alike.",reveal:["n","x","u"],active:["n"],point:"n"},
        {short:"Who wins",term:"priority",narration_text:"Finally, when a molecule has several, one becomes the suffix and the rest become prefixes. The order runs carboxylic acid, ester, amide, aldehyde, ketone, alcohol, amine, then the plain carbon–carbon groups.",reveal:["pri"],active:["pri"],point:"pri",
         quiz:{q:"A molecule contains both an alcohol and a ketone. Which becomes the suffix?",options:["The ketone — it outranks the alcohol","The alcohol — oxygen with hydrogen wins","Whichever comes first in the chain"],answer:0,why:"Priority is fixed, not positional: the higher group takes the suffix and the lower becomes 'hydroxy-'."}},
        {short:"Recap",term:"recap",narration_text:"Recap. Find the heteroatom to spot the group, use position to split the confusable pairs, and remember that priority is a fixed ladder that decides the name.",reveal:["fg","pri"],active:["pri"],point:"pri"}],
      recap:["Spot groups by the heteroatom, not by memorising isolated cards.",
             "Aldehyde vs ketone is decided by POSITION on the chain.",
             "Naming priority is a fixed ladder: acid > ester > amide > aldehyde > ketone > alcohol > amine."]} },

  /* ── ORGANIC 51: tree — THE SUBSTITUTION/ELIMINATION DECISION. Documented as the single hardest
     topic in Orgo 1, and documented to get WORSE when students reach for a flowchart, because a
     flowchart hides the reasons and collapses on the 2° cases. So this is a tree with the
     mechanistic REASON welded onto every leaf — that requirement is the whole design. ── */
  { text: "How do you decide between SN1, SN2, E1 and E2 for a given substrate, nucleophile, solvent and temperature?",
    blueprint: {meta:{title:"SN1, SN2, E1 or E2 — with the reason on every leaf",subject:"Organic Chemistry",concept_id:"substitution_elimination_decision"},layout:"tree",root:"sub",
      nodes:[{id:"sub",label:"Start: the substrate",note:"1°, 2° or 3° carbon?"},
             {id:"p1",parent:"sub",label:"Methyl / primary",note:"no cation possible"},
             {id:"p2",parent:"sub",label:"Secondary",note:"the genuinely hard case"},
             {id:"p3",parent:"sub",label:"Tertiary",note:"backside is blocked"},
             {id:"p1a",parent:"p1",label:"SN2",note:"strong nucleophile: open back, no cation"},
             {id:"p1b",parent:"p1",label:"E2",note:"bulky base: too fat to attack, takes an H instead"},
             {id:"p2a",parent:"p2",label:"SN2",note:"strong nucleophile + aprotic: attack still possible"},
             {id:"p2b",parent:"p2",label:"E2",note:"strong BASE: the β-H is easier to reach"},
             {id:"p2c",parent:"p2",label:"SN1 / E1 mix",note:"weak nucleophile + protic + heat: 2° cation survives"},
             {id:"p3a",parent:"p3",label:"SN1 / E1",note:"weak nucleophile: 3° cation forms easily"},
             {id:"p3b",parent:"p3",label:"E2",note:"strong base: no room to substitute, so eliminate"},
             {id:"heat",parent:"sub",label:"Heat always helps elimination",note:"elimination makes more particles"}],
      narration_steps:[
        {short:"Why not a flowchart",term:"the decision",narration_text:"You will be offered a flowchart for this. Resist it. A flowchart hides the reasons, and the reasons are the only thing that survives contact with an unfamiliar molecule. We will build a tree where every leaf carries its WHY.",reveal:["sub"],active:["sub"],point:"sub"},
        {short:"Substrate first",term:"substrate",narration_text:"Always start at the carbon carrying the leaving group. Count the carbons attached to it: one is primary, two is secondary, three is tertiary. That single count eliminates half the possibilities immediately.",reveal:["p1","p2","p3"],active:["p2"],point:"p2"},
        {short:"Primary",term:"primary",narration_text:"Primary carbons never go by a cation route, because a primary carbocation is far too unstable to form. So with a strong nucleophile you get S-N-two; with a bulky base like tert-butoxide, which is too fat to reach the carbon, you get E-two instead.",reveal:["p1a","p1b"],active:["p1a"],point:"p1a",
         def:"Bulky base: it cannot get to the carbon, so it takes the exposed hydrogen instead."},
        {short:"Tertiary",term:"tertiary",narration_text:"Tertiary is the mirror image. The back of the carbon is completely blocked, so S-N-two is off the table forever. With a weak nucleophile you get S-N-one and E-one from the same cation; with a strong base you get E-two.",reveal:["p3a","p3b"],active:["p3a"],point:"p3a",
         quiz:{q:"Why can a tertiary substrate never react by SN2?",options:["Three alkyl groups physically block backside attack","Tertiary carbons have no leaving group","The nucleophile is repelled by charge"],answer:0,why:"SN2 needs a clear line 180° from the leaving group, and on a tertiary carbon there is not one."}},
        {short:"The hard case",term:"secondary",narration_text:"Now the one that actually costs marks. A secondary carbon can genuinely do all four, so the substrate tells you nothing — the reagent decides.",reveal:["p2a","p2b","p2c"],active:["p2b"],point:"p2b"},
        {short:"Read the reagent",term:"nucleophile vs base",narration_text:"So ask what the reagent really is. Strongly nucleophilic and not very basic, in an aprotic solvent — S-N-two. Strongly basic — E-two, because a hydrogen on the outside is easier to reach than a crowded carbon. Weak and protic — the cation route.",reveal:["p2c"],active:["p2c"],point:"p2c",
         quiz:{q:"A secondary halide with sodium ethoxide, hot. What dominates?",options:["E2 — ethoxide is a strong base and heat favours elimination","SN1 — it is secondary","SN2 only"],answer:0,why:"Strong base plus heat is the elimination signature; the substrate merely permits it."}},
        {short:"Temperature",term:"heat",narration_text:"And one dial that works everywhere: heat pushes towards elimination, because elimination turns one molecule into two and entropy likes that. If a question mentions warming, it is telling you something.",reveal:["heat"],active:["heat"],point:"heat"},
        {short:"Recap",term:"recap",narration_text:"Recap. Substrate narrows it, the reagent decides it, solvent and heat tilt it — and if you cannot say the reason out loud, you have memorised a chart rather than learned the chemistry.",reveal:["sub","p2"],active:["p2"],point:"p2"}],
      recap:["Substrate first (1°/2°/3°), then the reagent — and 2° is where the reagent decides.",
             "Bulky base means elimination; strong nucleophile in aprotic solvent means SN2.",
             "Every branch must come with its reason, or you have memorised a chart, not the chemistry."]} },

  /* ── ORGANIC 52: solve — IUPAC NOMENCLATURE as a step-view. Naming is a chain of tie-break rules
     where an early wrong choice silently invalidates everything downstream and the student gets no
     feedback on WHICH step failed. One station per rule, with the reason printed on every line, is
     exactly the cure — and it reuses the repo's existing solve/ idiom rather than inventing a mode. ── */
  { text: "Name this molecule by IUPAC rules: a seven-carbon chain drawn bent, with a methyl on one carbon and an ethyl on another, plus an OH group.",
    blueprint: {meta:{title:"Naming a molecule — one rule per line",subject:"Organic Chemistry",concept_id:"iupac_nomenclature_steps"},layout:"solve",
      problem:"Name:  CH₃—CH(CH₃)—CH₂—CH(OH)—CH₂—CH₂—CH₃",
      lines:[{id:"l1",math:"find the LONGEST chain → 7 carbons",why:"count every path, not the one drawn horizontally"},
             {id:"l2",math:"it contains the OH → parent = heptanol",why:"the chain MUST include the principal group"},
             {id:"l3",math:"number from the end nearest OH → C4",why:"lowest locant goes to the principal group first"},
             {id:"l4",math:"other direction would give C4 too → tie",why:"when the principal group ties, move to the next rule"},
             {id:"l5",math:"substituents: 2-methyl … vs … 6-methyl",why:"lowest SET of locants breaks the tie"},
             {id:"l6",math:"choose 2-methyl → numbering fixed",why:"{2,4} beats {4,6} at the first point of difference"},
             {id:"l7",math:"alphabetise: ethyl before methyl",why:"alphabetical order, ignoring di-/tri- prefixes"},
             {id:"l8",math:"NAME:  2-methylheptan-4-ol",why:"substituents, then parent, then suffix with its locant"}],
      narration_steps:[
        {short:"Why this is hard",term:"nomenclature",narration_text:"Naming feels unfair because one wrong choice at the start quietly ruins everything after it, and nothing tells you which step failed. So we will do one rule per line, and check each one before moving on.",reveal:["l1"],active:["l1"],point:"l1"},
        {short:"Longest chain",term:"parent chain",narration_text:"First find the longest continuous chain of carbons. Trace every path, including the ones that turn corners — the longest chain is very often not the one drawn straight across the page. Here it is seven.",reveal:["l1"],active:["l1"],point:"l1",
         def:"Longest means most carbons in an unbroken path, whatever shape it is drawn in.",
         quiz:{q:"What is the classic error at this very first step?",options:["Taking the chain that is drawn horizontally","Counting the hydrogens too","Starting from the wrong end"],answer:0,why:"Horizontal-chain bias. Turn the corner and you often find one or two extra carbons."}},
        {short:"It must include the group",term:"principal group",narration_text:"Second, the parent chain has to contain the principal functional group. Our O-H must be on the chain, so the chain is a heptanol, not a heptane with something dangling off it.",reveal:["l2"],active:["l2"],point:"l2"},
        {short:"Number towards it",term:"locant",narration_text:"Now number the chain. The rule order is strict: give the lowest possible number to the principal group first, before you look at any substituent at all.",reveal:["l3"],active:["l3"],point:"l3",
         def:"A locant is just the number that says which carbon something sits on."},
        {short:"A tie",term:"tie-break",narration_text:"Here the O-H lands on carbon four counting from either end, so we have a genuine tie. That is not a problem — it is a signal to move down to the next rule in the list.",reveal:["l4"],active:["l4"],point:"l4"},
        {short:"Lowest set",term:"lowest set of locants",narration_text:"The tie-break is the lowest SET of locants for the substituents. One direction gives two and four; the other gives four and six. Compare them at the first point of difference — two beats four — so the first direction wins.",reveal:["l5","l6"],active:["l6"],point:"l6",
         quiz:{q:"Compare the sets {2,4} and {4,6}. Which is 'lower'?",options:["{2,4} — compare term by term until they differ","{4,6} — its total is not much bigger","They are equal because both have two entries"],answer:0,why:"First point of difference, exactly like alphabetical order on words."}},
        {short:"Alphabetise",term:"alphabetical order",narration_text:"Write the substituents alphabetically — ethyl before methyl. Ignore the multiplying prefixes di and tri when you alphabetise, but do not ignore iso or neo, because those are part of the name.",reveal:["l7"],active:["l7"],point:"l7"},
        {short:"The name",term:"the answer",narration_text:"Substituents with their numbers, then the parent chain, then the suffix with its own number. Two-methyl-heptan-four-ol. Every one of those numbers was earned by a rule, in order.",reveal:["l8"],active:["l8"],point:"l8"},
        {short:"Recap",term:"recap",narration_text:"Recap. Longest chain containing the group, number to give the group the lowest locant, break ties with the lowest set, alphabetise, then write it out. Do them in that order and the tie-breaks stop feeling arbitrary.",reveal:["l8"],active:["l8"],point:"l8"}],
      recap:["The longest chain is often not the one drawn horizontally.",
             "Number for the principal group FIRST, then break ties on the lowest set of locants.",
             "Alphabetise ignoring di-/tri-, but not iso-/neo-."]} },

  /* ── ORGANIC 53: solve — R/S ASSIGNMENT. A spatial task performed on a flat drawing, with a
     viewing-direction condition most students never internalise. Every line restates where group
     four is pointing, and the reversal rule gets its own line — plus a line demolishing the
     R-equals-clockwise-rotation myth, which is a documented and very sticky misconception. ── */
  { text: "Assign R or S to a stereocentre using the Cahn–Ingold–Prelog rules, including what to do when the lowest priority group points towards you.",
    blueprint: {meta:{title:"R or S — rank, look, trace, and know when to flip",subject:"Organic Chemistry",concept_id:"cip_rs_assignment"},layout:"solve",
      problem:"Assign R/S:  a carbon bearing  —Br, —OH, —CH₃, —H  (with H on a wedge, towards you)",
      lines:[{id:"l1",math:"is it a stereocentre? 4 different groups ✓",why:"if any two are the same, stop — there is nothing to assign"},
             {id:"l2",math:"rank by ATOMIC NUMBER at the first atom",why:"Br(35) > O(8) > C(6) > H(1) — not by size or by 'looks bigger'"},
             {id:"l3",math:"1 = Br,  2 = OH,  3 = CH₃,  4 = H",why:"ties only: explore outward to the first point of difference"},
             {id:"l4",math:"where is group 4 pointing?  ON A WEDGE = towards you",why:"the whole method assumes #4 points AWAY"},
             {id:"l5",math:"trace 1 → 2 → 3 as drawn:  clockwise",why:"read the arc through the three remaining groups"},
             {id:"l6",math:"#4 is towards you → REVERSE the answer",why:"you are reading the steering wheel from behind"},
             {id:"l7",math:"clockwise as drawn  →  actually S",why:"R is clockwise ONLY when #4 points away"},
             {id:"l8",math:"note: S says nothing about (+) or (−)",why:"optical rotation is measured, never predicted from R/S"}],
      narration_steps:[
        {short:"First check",term:"stereocentre",narration_text:"Before any of this, check there is something to assign. A stereocentre is a carbon with four DIFFERENT groups. If two are the same, there is no R and no S, and a surprising number of marks are lost right here.",reveal:["l1"],active:["l1"],point:"l1"},
        {short:"Rank by number",term:"CIP priority",narration_text:"Rank the four groups by atomic number at the atom directly attached — Cahn, Ingold and Prelog, said KAHN, ING-gold, PRAY-log. Bromine thirty-five, oxygen eight, carbon six, hydrogen one. Not by how big the group looks.",reveal:["l2","l3"],active:["l2"],point:"l2",
         def:"If two are tied at the first atom, walk outward together until they first differ.",
         quiz:{q:"Between —CH₂CH₃ and —OH, which has higher priority?",options:["—OH, because oxygen (8) beats carbon (6)","—CH₂CH₃, because it is bigger","They tie"],answer:0,why:"Priority is atomic number at the first point of difference, never bulk."}},
        {short:"The condition",term:"the viewing rule",narration_text:"Now the step everyone skips. The whole method only works if the LOWEST priority group is pointing away from you, into the page. So before you trace anything, find group four and ask where it is.",reveal:["l4"],active:["l4"],point:"l4",
         def:"A wedge points towards you; a dashed bond points away."},
        {short:"Trace it",term:"the arc",narration_text:"Ours is on a wedge, which means it is pointing straight at you — the wrong way round. Trace the arc from one to two to three anyway, and here it comes out clockwise.",reveal:["l5"],active:["l5"],point:"l5"},
        {short:"Flip it",term:"the reversal",narration_text:"Because you are looking from the wrong side, everything you just read is backwards — like reading a steering wheel from behind the dashboard. So reverse the answer: clockwise as drawn actually means S.",reveal:["l6","l7"],active:["l7"],point:"l7",
         quiz:{q:"You trace 1→2→3 clockwise, but group 4 is on a wedge. The answer is…",options:["S — reverse it, because #4 points towards you","R — clockwise always means R","Undefined"],answer:0,why:"R means clockwise WITH #4 pointing away. Change the viewing direction and you must flip the label."}},
        {short:"Fischer warning",term:"Fischer projection",narration_text:"A related trap: in a Fischer projection the horizontal bonds point towards you and the vertical ones away. So a group four on a horizontal line means you invert, for exactly the same reason.",reveal:["l7"],active:["l7"],point:"l7"},
        {short:"The big myth",term:"optical rotation",narration_text:"And the misconception that survives everything else: R does not mean the compound rotates light clockwise. Plus and minus are measured in a laboratory. There is no way to predict them from the letter.",reveal:["l8"],active:["l8"],point:"l8",
         quiz:{q:"Does an (R) compound rotate plane-polarised light clockwise?",options:["Not necessarily — R/S and (+)/(−) are unrelated","Yes, always","Only if it is a sugar"],answer:0,why:"R/S is a naming convention from a drawing; (+)/(−) is an experimental measurement. No link."}},
        {short:"Recap",term:"recap",narration_text:"Recap. Four different groups, rank by atomic number, check where group four is pointing, trace one-two-three, and flip if you are looking from the wrong side — then remember the letter tells you nothing about rotation.",reveal:["l8"],active:["l8"],point:"l8"}],
      recap:["Rank by atomic number at the first point of difference — never by size.",
             "The method assumes #4 points AWAY; if it points towards you, reverse your answer.",
             "R/S says nothing about which way the compound rotates light."]} },

  /* ── ORGANIC 54: geometry — HYBRIDISATION AND THE SHAPE THAT FOLLOWS. The corpus wants the link
     students never make: sigma bonds rotate, pi bonds do not, and THAT is the root cause of cis/trans
     isomerism. The VSEPR renderer already draws a trigonal-planar centre with its angle, so this
     reuses it rather than waiting for the 3-D scene in the template-gap list. ── */
  { text: "Explain why an sp2 carbon is flat with 120° angles, and why you cannot rotate about a carbon–carbon double bond.",
    blueprint: {meta:{title:"sp² carbon — flat, 120°, and locked",subject:"Organic Chemistry",concept_id:"sp2_planar_no_rotation"},layout:"geometry",
      center:"C",shape:"trigonal_planar",shape_label:"TRIGONAL PLANAR (sp²)",angle:"120°",
      bonds:[{to:"C"},{to:"H"},{to:"H"}],
      narration_steps:[
        {short:"Count, don't guess",term:"hybridisation",narration_text:"Hybridisation sounds like a separate ritual, but it is just counting. Add up the sigma bonds and the lone pairs on your atom. Four means sp³, three means sp², two means sp. That is the entire rule.",reveal:["bonds"],active:["bonds"],point:"bonds",
         def:"Only sigma bonds count. A double bond contributes ONE sigma, plus a pi that does not count."},
        {short:"Three groups",term:"sp²",narration_text:"This carbon has three sigma bonds and no lone pairs, so it is sp²-hybridised — say it s-p-two. Three regions of electron density push each other as far apart as they can get on a flat surface.",reveal:["bonds"],active:["bonds"],point:"bonds"},
        {short:"The shape",term:"trigonal planar",narration_text:"And as far apart as possible for three things in a plane is a hundred and twenty degrees each. So an sp² carbon is trigonal planar, and — the part that matters — it is FLAT.",reveal:["info"],active:["info"],point:"info",
         quiz:{q:"Why is an sp² carbon planar?",options:["Three electron regions spread furthest apart at 120° in one plane","Because it has a double bond","Because carbon is small"],answer:0,why:"Shape comes from counting regions and pushing them apart — the geometry is a consequence, not a fact to memorise."}},
        {short:"The leftover",term:"the p orbital",narration_text:"Three orbitals were used up making sigma bonds, which leaves one unhybridised p orbital sticking up above and down below the plane. That leftover is where all the interesting chemistry lives.",reveal:["lp"],active:["lp"],point:"lp",
         def:"That p orbital is empty in a carbocation, half-full in a radical, and full of the pi bond in an alkene."},
        {short:"Sideways overlap",term:"π bond",narration_text:"Bring two sp² carbons together and those leftover p orbitals overlap sideways, above and below the axis. That is a pi bond — and a sideways overlap is exactly what a rotation would tear apart.",reveal:["lp","info"],active:["lp"],point:"lp"},
        {short:"The payoff",term:"restricted rotation",narration_text:"So try to rotate about a double bond and you simply cannot: the pi bond blocks it. A single bond spins freely all day; a double bond is locked. That one difference is the entire origin of cis and trans isomerism.",reveal:["info"],active:["info"],point:"info",
         quiz:{q:"Why does cis/trans isomerism exist for alkenes but not alkanes?",options:["Rotation about a C=C is blocked by the π bond","Alkenes are heavier","Alkanes have no substituents"],answer:0,why:"No rotation means the two arrangements cannot interconvert, so they are genuinely different compounds."}},
        {short:"Recap",term:"recap",narration_text:"Recap. Count sigma bonds and lone pairs to get the hybridisation, let the count give you the shape, and remember the leftover p orbital — because whether it is empty, half-full or holding a pi bond decides everything that happens next.",reveal:["bonds","info"],active:["info"],point:"info"}],
      recap:["Hybridisation = count σ bonds + lone pairs. Three regions → sp², 120°, flat.",
             "The leftover p orbital is where carbocations, radicals and π bonds live.",
             "π overlap is sideways, so a C=C cannot rotate — that is why cis/trans exists."]} },

  /* ── ORGANIC 55: flow — THE OXIDATION LADDER. The corpus asks for one diagram that turns reagent
     selectivity into a DISTANCE rather than a list of facts to memorise: rungs from alkane up to
     carbon dioxide, with each reagent shown as how far up it takes you. "Which reagent do I use" is
     the actual exam question, and this is the only view that answers it structurally. ── */
  { text: "Explain oxidation and reduction in organic chemistry: the oxidation ladder, and why PCC stops at the aldehyde while chromic acid does not.",
    blueprint: {meta:{title:"The oxidation ladder — how far does each reagent take you?",subject:"Organic Chemistry",concept_id:"oxidation_ladder_reagents"},layout:"flow",
      nodes:[{id:"n0",label:"Count bonds, not electrons",note:"more C—O = oxidised",kind:"trigger"},
             {id:"n1",label:"Alkane  R—CH₃",note:"the bottom rung",kind:"process"},
             {id:"n2",label:"Alcohol  R—CH₂OH",note:"one C—O bond",kind:"process"},
             {id:"n3",label:"Aldehyde  R—CHO",note:"two C—O bonds",kind:"product"},
             {id:"n4",label:"Carboxylic acid  R—COOH",note:"three C—O bonds",kind:"product"},
             {id:"n5",label:"PCC stops here",note:"mild — one rung only",kind:"outcome"},
             {id:"n6",label:"Chromic acid / KMnO₄",note:"strong — straight past the aldehyde",kind:"danger"},
             {id:"n7",label:"3° alcohol → no reaction",note:"no C—H left to lose",kind:"danger"},
             {id:"n8",label:"Choose by the distance",note:"the reagent IS the rung count",kind:"outcome"}],
      narration_steps:[
        {short:"A new definition",term:"oxidation",narration_text:"Forget oxidation numbers for a moment — they technically work but nobody can apply them at speed to a skeletal drawing. In organic chemistry, oxidation means gaining carbon–oxygen bonds and losing carbon–hydrogen ones. Reduction is the reverse.",reveal:["n0"],active:["n0"],point:"n0",
         def:"Count bonds to oxygen. More is oxidised; fewer is reduced. That is the working definition."},
        {short:"Bottom rung",term:"the ladder",narration_text:"Now build the ladder. At the bottom sits the alkane, with no bonds to oxygen at all. Every rung above it adds one more.",reveal:["n1"],active:["n1"],point:"n1"},
        {short:"Up one",term:"alcohol",narration_text:"Put one oxygen on and you have an alcohol — one carbon–oxygen bond. That is one rung up, and it is where most oxidation questions begin.",reveal:["n2"],active:["n2"],point:"n2"},
        {short:"Up two",term:"aldehyde",narration_text:"Take two hydrogens off the alcohol and you get an aldehyde, with a carbon–oxygen double bond — that counts as two. Notice the carbon still has one hydrogen left, and that is why it can go further.",reveal:["n3"],active:["n3"],point:"n3"},
        {short:"Up three",term:"carboxylic acid",narration_text:"Lose that last hydrogen and gain another oxygen and you are at the carboxylic acid — three carbon–oxygen bonds. Above that there is only carbon dioxide, which is combustion, not synthesis.",reveal:["n4"],active:["n4"],point:"n4"},
        {short:"The mild one",term:"PCC",narration_text:"Here is the whole point of the ladder. P-C-C, said as letters, is a mild oxidant: it climbs exactly one rung and stops. Primary alcohol to aldehyde, and it will not go further even if you wait.",reveal:["n5"],active:["n5"],point:"n5",
         quiz:{q:"You need an aldehyde from a primary alcohol. Which reagent?",options:["PCC — it climbs one rung and stops","Chromic acid — it is stronger","KMnO₄ — it is cheaper"],answer:0,why:"The strong oxidants sail past the aldehyde to the acid. Selectivity here is a distance, not a preference."}},
        {short:"The strong one",term:"chromic acid",narration_text:"Chromic acid and potassium permanganate are strong. Start at a primary alcohol and they go all the way to the acid, straight past the aldehyde without stopping. Same starting material, two rungs of difference, decided entirely by the reagent.",reveal:["n6"],active:["n6"],point:"n6"},
        {short:"The dead end",term:"tertiary alcohol",narration_text:"And one that catches people out: a tertiary alcohol simply does not oxidise. There is no hydrogen left on that carbon to remove, so there is no rung above it. A secondary alcohol, by contrast, gives a ketone and stops there for the same reason.",reveal:["n7"],active:["n7"],point:"n7",
         quiz:{q:"Why does a tertiary alcohol resist oxidation?",options:["Its carbon has no C–H bond left to lose","It is too crowded for the reagent","Tertiary alcohols are not really alcohols"],answer:0,why:"Oxidation here means swapping C–H for C–O. No C–H, no reaction — and the same logic stops a ketone."}},
        {short:"Recap",term:"recap",narration_text:"Recap. Count carbon–oxygen bonds to place any molecule on the ladder, then ask how many rungs your reagent climbs. Reagent selectivity stops being a list to memorise and becomes a distance you can read off.",reveal:["n8"],active:["n8"],point:"n8"}],
      recap:["Organic oxidation = more C—O bonds, fewer C—H bonds. Count bonds, not electrons.",
             "The ladder: alkane → alcohol → aldehyde → carboxylic acid → CO₂.",
             "PCC climbs one rung; chromic acid and KMnO₄ go all the way. 3° alcohols cannot climb at all."]} }

];

/* Cost optimisation (a): send only the ONE worked example whose mode best fits the text
 * (a cheap local heuristic), instead of all three. The rules still describe every mode, so the
 * model can still choose any — this just trims ~2/3 of the few-shot tokens. */
/* ---- BIOLOGY GATE (index map). Biology is the only subject whose vocabulary is systematically
   stolen by the other gates: "reaction", "atom", "molecul", "\bbond", "acid", "\bbase\b", "energy",
   "electron" and "catalyst" all live in the chemistry regex; "exponential growth", "\bfunction\b"
   and "probabilit" fire the maths gate; "\bcell\b" fires the electrochemical-cell branch. So the
   biology cues are tested FIRST, and they are deliberately high-precision — every term below is one
   that essentially never appears in a maths, physics, computing or pure-chemistry passage. Once the
   gate fires we ALWAYS return a biology exemplar, so a biology highlight can never be handed a
   free-body diagram or a titration curve as its few-shot. ---- */
const BIO_EXEMPLAR = { scene:25, respiration:26, photosynthesis:27, replication:28, dogma:29,
                       kinetics:30, population:31, taxonomy:32, punnett:33 };

/* ---- PHYSICS GATE (index map). Physics has the same problem biology has, from the other side:
   "resultant", "magnitude", "amplitude", "period", "vector", "solve" and "rate of change" all fire
   the maths regex; "energy", "reaction", "charge", "decay", "distribution" and "electron" all fire
   the chemistry regex; "circuit" fires the computing gate; and "\\bcarrier" in the biology list
   would hand a passage about CHARGE CARRIERS a Punnett square. So physics gets its own named gate
   and, once it fires, ALWAYS returns a physics exemplar — a physics highlight can never be given a
   titration curve or a genetics grid as its few-shot. The two purpose-built physics renderers (fbd,
   circuit) are 20 and 21 from Bit 2; the rest are the graph engine, the reused vectors plane, the
   flow ledger and the worked solution. ---- */
const PHY_EXEMPLAR = { fbd:20, circuit:21, motion:36, shm:37, thermal:38, vectors:39, energy:40, momentum:41 };

/* The unmistakable-physics cues. These are checked BEFORE the biology gate because each one is a
   term biology/computing/chemistry would otherwise steal outright (see the note above). Keep this
   list short and 100% physics — anything ambiguous belongs in PHYS below, not here. */
const PHYS_HARD = /free.?body|\bfbd\b|\bnet force\b|newton'?s (first|second|third) law|\bthird law\b|charge carriers?|\bfree fall\b|apparent weightless|projectile|simple harmonic|\bshm\b|kirchhoff|ohm'?s law|right.?hand rule|centripetal|centrifugal|coefficient of (static|kinetic) friction|terminal velocity|inclined plane|latent heat|specific heat capacity|heating curve|\bv ?= ?f ?λ\b|\bf ?= ?ma\b|\bv ?= ?ir\b/i;

/* The broader physics vocabulary, checked after biology and computing have had their say. */
const PHYS = new RegExp([
  // kinematics & motion graphs
  "kinematic","\\bvelocity\\b","\\bacceleration\\b","\\baccelerat","\\bdisplacement\\b","\\bdeceleration\\b",
  "\\bspeed\\b","distance.?time","velocity.?time","\\bsuvat\\b","metres per second","\\bm/s\\b",
  "trajector","\\blaunch(ed)? (at|with)\\b","\\bat rest\\b","\\bmotion\\b",
  // forces & mechanics
  "\\bforces?\\b","\\bnewtons?\\b","\\btension\\b","\\bnormal force\\b","\\bfriction","\\bincline","\\bweight\\b",
  "\\bmass\\b .{0,20}(kg|kilogram|accelerat|force)","equilibrium of forces","\\btorque\\b","\\bmoment of\\b","\\blever\\b",
  "circular motion","banked (curve|turn)","\\borbit","satellite","gravitational (field|force|potential)","inverse square",
  // energy, work, momentum
  "kinetic energy","potential energy","work.?energy","work done","joules?\\b","\\bwatts?\\b","conservation of energy",
  "mechanical energy","\\bmomentum\\b","\\bimpulse\\b","elastic collision","inelastic","\\bcollision","\\brecoil\\b",
  // oscillations & waves
  "oscillat","\\bpendulum","spring constant","hooke","restoring force","\\bamplitude\\b .{0,30}(wave|oscillat|sound|period)",
  "\\bwavelength\\b","\\bwavefront","standing wave","\\bantinode","\\bharmonic\\b","\\bresonan","doppler",
  "longitudinal","transverse wave","superposition","compressions? and rarefactions?","\\bpitch\\b .{0,20}frequenc","decibel",
  // electricity & magnetism
  "\\bcircuits?\\b","\\bresistors?\\b","\\bresistance\\b","potential difference","\\bvoltage\\b","\\bemf\\b",
  "\\bammeter","\\bvoltmeter","in series","in parallel","internal resistance","\\bcapacitor",
  "electric field","equipotential","\\bpoint charge","\\btest charge","field lines","magnetic (field|force|flux)",
  "\\btesla\\b","\\bsolenoid","electromagnetic induction","\\bfaraday'?s law\\b","\\blenz",
  // optics
  "ray diagram","principal ray","\\bfocal length\\b","converging lens","diverging lens","concave mirror","convex",
  "\\brefract","total internal reflection","\\bsnell","real image","virtual image",
  // thermal
  "thermal equilibrium","\\bconduction\\b","\\bconvection\\b","\\bradiation\\b .{0,24}(heat|thermal|transfer)",
  "internal energy","\\bkelvin\\b","phase change .{0,20}(temperature|energy|heat)"
].join("|"), "i");

/* Physics routing. Order matters and is argued, not arbitrary:
   1. FORCES first, because a forces question is very often also a motion question ("a block slides
      down a slope and accelerates") and the free-body diagram is the one view that teaches it.
   2. CIRCUITS next — "current" and "voltage" are unambiguous once computing has already declined.
   3. VECTORS before the graph, because a 2-D momentum or relative-velocity question mentions both
      "momentum" and "velocity" and the arrow plane is what the student cannot picture.
   4. WAVES / SHM / thermal / any quantity-vs-anything → the graph engine, the workhorse.
   5. Energy and collision PROCEDURES → the ledger (flow) or the worked solution (solve).
   Anything else that fired a physics cue still returns a physics exemplar — the motion graph,
   because "some quantity against time" is the single most likely shape of an unmatched physics
   highlight. It never falls through to chemistry or biology. */
function phyPick(t){
  const P = i => EXEMPLARS[i];
  // 1. forces on a body → the free-body diagram (the flagship)
  if(/free.?body|\bfbd\b|\bnet force\b|forces? (on|acting on)|newton'?s (first|second|third) law|\bf ?= ?ma\b|third law|action.{0,3}reaction|\bnormal force\b|\bfriction(al)?\b|coefficient of (static|kinetic) friction|\btension\b|\bincline|inclined plane|\bslope\b .{0,20}(block|mass)|equilibrium of forces|centripetal|centrifugal|circular motion|banked (curve|turn)|apparent weight|weightless|free fall|\bweight\b .{0,16}\bmass\b|impetus|\borbit(s|ing|al motion)?\b|satellite|gravitational field/.test(t))
    return P(PHY_EXEMPLAR.fbd);
  // 2. DC circuits → the circuit schematic
  if(/\bcircuits?\b|\bresistors?\b|\bresistance\b|\bohm'?s law\b|\bcurrent\b .{0,30}(volt|resist|circuit|batter|amp)|\bvoltage\b|potential difference|\bemf\b|\bbatter(y|ies)\b|\bammeter\b|\bvoltmeter\b|kirchhoff|in series|in parallel|\bbulbs?\b|\blamps?\b .{0,20}(bright|circuit)|\bv ?= ?ir\b|internal resistance|\bcapacitor/.test(t))
    return P(PHY_EXEMPLAR.circuit);
  // 3. vector addition, components, resultants, relative velocity, 2-D momentum → the arrow plane
  if(/\bvectors?\b|\bscalars?\b|magnitude and direction|tip.?to.?tail|\bresultant\b|\bcomponents?\b .{0,24}(vector|velocity|force|axis|axes)|resolve .{0,20}(into|components)|relative velocity|\bbearing\b|dot product|cross product|unit vector|two.?dimensional (collision|momentum)|momentum .{0,20}(vector|two dimension|2.?d)/.test(t))
    return P(PHY_EXEMPLAR.vectors);
  // 4a. thermal — the heating curve is the one graph this topic cannot be taught without
  if(/latent heat|specific heat capacity|heating curve|cooling curve|\bmelting\b|\bboiling\b|phase change|\bplateau\b|thermal equilibrium|internal energy|heat (vs|versus|and) temperature|\bq ?= ?mc|\bq ?= ?ml\b|\bkelvin\b|thermal expansion|conduction|convection/.test(t))
    return P(PHY_EXEMPLAR.thermal);
  // 4b. oscillations and waves — every misconception here is a relative-PHASE error
  if(/simple harmonic|\bshm\b|oscillat|\bpendulum|spring constant|hooke|restoring force|\bf ?= ?−? ?kx\b|\bamplitude\b|\bwavelength\b|\bwavefront|standing wave|\bantinode|\bnodes?\b .{0,20}wave|\bharmonic\b|resonan|doppler|longitudinal|transverse|superposition|\bv ?= ?f ?λ\b|frequency .{0,24}(wave|sound|pitch|hertz)|\bperiod\b .{0,24}(oscillat|pendulum|wave|amplitude)/.test(t))
    return P(PHY_EXEMPLAR.shm);
  // 5a. a collision or an impulse calculation → the worked solution, one move per line
  if(/\bmomentum\b|\bimpulse\b|\bcollision|\belastic\b|inelastic|\brecoil\b|\bp ?= ?mv\b|conservation of momentum|stick together|lock together|\bexplo(de|sion)\b/.test(t))
    return P(PHY_EXEMPLAR.momentum);
  // 5b. an energy accounting problem → the ledger
  if(/kinetic energy|potential energy|work.?energy|work done|\bjoules?\b|conservation of energy|mechanical energy|\bpower\b .{0,20}(watt|energy|work)|\bwatts?\b|efficiency|\bmgh\b|½ ?m ?v|energy (transfer|conversion|account|stored|lost)/.test(t))
    return P(PHY_EXEMPLAR.energy);
  // 6. anything else plottable — kinematics, projectiles, inverse-square, decay, force–time …
  return P(PHY_EXEMPLAR.motion);
}
const BIO = new RegExp([
  // cells, organelles & transport
  "organelle","endoplasmic reticulum","\\bgolgi\\b","lysosome","ribosom","mitochondri","chloroplast","thylakoid",
  "\\bstroma\\b","cytosol","cytoplasm","vacuole","\\bplasma membrane\\b","cell membrane","cell wall","phospholipid",
  "prokaryot","eukaryot","endosymbio","osmosis","osmolarit","tonicit","hypertonic","hypotonic","isotonic",
  "facilitated diffusion","active transport","sodium.?potassium pump","semi.?permeable","selectively permeable",
  // enzymes & metabolism
  "\\benzyme","\\bsubstrate\\b","active site","induced fit","lock.?and.?key","denatur","\\bcofactor\\b","\\bvmax\\b",
  "michaelis","glycolysis","pyruvate","krebs","citric acid cycle","link reaction","electron transport chain",
  "chemiosmosis","\\batp synthase\\b","aerobic respiration","anaerobic respiration","cellular respiration",
  "photosynth","calvin cycle","light.?(dependent|independent) reaction","carbon fixation","\\bautotroph","\\bheterotroph",
  // genetics & the central dogma
  "\\bdna\\b","\\brna\\b","\\bmrna\\b","\\btrna\\b","deoxyribonucleic","ribonucleic","nucleotide","\\badenine\\b",
  "\\bthymine\\b","\\bguanine\\b","\\bcytosine\\b","\\buracil\\b","base pair","double helix","antiparallel",
  "helicase","primase","ligase","dna polymerase","okazaki","semi.?conservative","replication fork","leading strand",
  "lagging strand","transcription","translation","\\bcodon\\b","anticodon","\\bintron","\\bexon","splicing",
  "polypeptide","amino acid","\\bgene\\b","\\ballele","genotype","phenotype","homozyg","heterozyg","punnett",
  "monohybrid","dihybrid","test cross","incomplete dominance","codominan","\\bcarrier\\b","mendel",
  "chromosome","chromatid","chromatin","centromere","\\bhaploid","\\bdiploid","\\bgamete","\\bzygote","\\bmeiosis\\b",
  "\\bmitosis\\b","interphase","crossing over","independent assortment","cytokinesis",
  // organisms, evolution, ecology, physiology
  "natural selection","\\bevolution","lamarck","darwin","adaptation","\\bspeciation","\\bfitness\\b",
  "phylogen","cladogram","\\bclade\\b","taxonom","binomial nomenclature","\\barchaea","\\bkingdom\\b",
  "\\bphylum\\b","\\bspecies\\b","common ancestor","food (web|chain)","trophic","ecosystem","\\bbiomass\\b",
  "carrying capacity","population growth","predator.?prey","decomposer","homeostasis","negative feedback",
  "positive feedback","\\bset point\\b","macromolecule","polysaccharide","monosaccharide","dehydration synthesis",
  "hydrolysis","tertiary structure","quaternary structure","protein folding",
  // whole-organism words that only a biology passage uses
  "\\bplants?\\b","\\bstomata\\b","transpiration","\\bxylem\\b","\\bphloem\\b","\\bchlorophyll\\b",
  "red blood cell","\\btissue\\b","\\borganism"
].join("|"));

/* ---- COMPUTER-STUDIES GATE (index map + detection). Computing is the subject with the largest
   number of stolen words in the whole system: a "logic circuit" contains "circuit" (physics), a
   "truth table" contains "table", "binary tree" and "traversal" sit next to biology's phylogenetic
   trees, "program translation" collides head-on with the central dogma, a flowchart is just a list
   of steps (biology cascade), and "solve"/"factor"/"log n" all fire the maths gate. So computing
   gets its own detection regex and its own router, and once either fires we ALWAYS return a
   computing exemplar — the subject can never be handed a titration curve or a Punnett square.
   Two entry points, deliberately:
     CS_STRONG — unambiguous computing terms, tested BEFORE biology, because these are the ones
                 biology would otherwise steal ("translation", "tissue", "stacks of thylakoids").
     CS        — the full subject gate, tested after biology and ahead of physics/maths routing. ---- */
const CS_EXEMPLAR = { logic:22, table:23, flow:24, solve:34, tree:35 };
/* Every term here is one that essentially never appears in a biology, chemistry, physics or pure
   maths passage. Bare "bit", "buffer", "sequence", "selection", "string", "node", "network",
   "memory", "register" and "tree" are deliberately ABSENT — each of them belongs to another
   subject far more often than to this one. */
const CS_STRONG = new RegExp([
  // translation toolchain — must beat the biology gate, which owns the word "translation"
  "\\bcompilers?\\b","\\binterpreters?\\b","\\bassembler\\b","machine code","source code","object code",
  "program translation","\\btranslator (program|software)\\b","\\bsyntax error\\b","high.?level language",
  "low.?level language","\\bide\\b .{0,20}(debug|editor|compil)",
  // number systems & representation
  "\\bdenary\\b","\\bhexadecimal\\b","\\boctal\\b","two'?s complement","one'?s complement","sign.?and.?magnitude",
  "\\bnibble\\b","\\bbitwise\\b","bit pattern","most significant bit","\\bmsb\\b","\\blsb\\b","\\bascii\\b",
  "\\bunicode\\b","utf.?8","floating.?point","\\bmantissa\\b","(8|16|32|64).?bit\\b","\\bbytes?\\b",
  "kilobyte","megabyte","gigabyte","\\bkib\\b","\\bmib\\b",
  // logic & Boolean
  "logic gates?","logic circuit","\\bboolean\\b","truth tables?","de ?morgan","\\bnand\\b","\\bxnor\\b","\\bxor\\b",
  "karnaugh","\\bk.?map\\b","half.?adder","full.?adder","combinational logic","sum of products","\\bminterm",
  // algorithms & complexity
  "\\bpseudo.?code\\b","\\bflow ?chart\\b","dry.?run","trace table","\\bbig.?o\\b","o\\(n( log n)?\\)",
  "bubble sort","selection sort","insertion sort","merge sort","quick ?sort","linear search","binary search",
  // data structures
  "\\blinked lists?\\b","binary (search )?tree","\\bbst\\b","tree traversal","in.?order traversal",
  "pre.?order traversal","post.?order traversal","adjacency (list|matrix)","hash (table|map|function)",
  "\\bfifo\\b","\\blifo\\b","enqueue","dequeue","\\bcall stack\\b","\\bnull (pointer|reference)\\b",
  "zero.?based","off.?by.?one","\\bdata structures?\\b","\\bleaf nodes?\\b","\\broot nodes?\\b","\\bsubtree\\b",
  // architecture, OS, networking, databases
  "\\bcpu\\b","\\balu\\b","\\bcontrol unit\\b","von neumann","stored.?program","fetch.?decode.?execute",
  "\\bram\\b","\\brom\\b","\\bcache\\b","memory hierarchy","virtual memory","\\boperating systems?\\b",
  "\\bdeadlock\\b","\\bthrashing\\b","\\bfile systems?\\b","\\bip address\\b","\\btcp\\b","\\budp\\b",
  "\\bosi\\b","\\bdns\\b","\\brouters?\\b","network topolog","client.?server","local area network","\\blan\\b",
  "\\bwan\\b","\\bdatabases?\\b","\\bsql\\b","\\bdbms\\b","primary key","foreign key","entity.?relationship",
  "\\b[123]nf\\b","normal form"
].join("|"));
/* The wider gate: CS_STRONG plus the softer cues that are safe once biology has already declined. */
const CS = new RegExp([CS_STRONG.source,
  "\\balgorithms?\\b","\\bbinary\\b","\\bbits?\\b","\\barrays?\\b","\\bstacks? and queues?\\b","\\bqueues?\\b",
  "\\bpointers?\\b","\\brecursi(on|ve)\\b","\\biteration\\b","\\bwhile loop\\b","\\bfor loop\\b",
  "control structures?","\\bsoftware\\b","\\bhardware\\b","\\bprogramming\\b","\\bcomputer\\b",
  "\\bpackets?\\b","\\bprotocols? (stack|layer)\\b","\\bstorage device","\\binput device","\\boutput device",
  "software development life ?cycle","\\bsdlc\\b","\\bdebugg?ing\\b","\\bvariables? and constants?\\b"
].join("|"));

/* One router for the whole subject: cue → the renderer that actually teaches that cue. */
function csPick(t){
  const C = i => EXEMPLARS[i];
  // 1. logic gates & Boolean algebra → the gate schematic (the flagship computing renderer).
  //    A truth-table-only or De Morgan question has no gates to draw, so it goes to the grid.
  if(/\blogic gates?\b|\blogic circuit\b|\bboolean\b|\btruth table\b|de ?morgan|\band gate\b|\bor gate\b|\bnot gate\b|\bnand\b|\bnor gate\b|\bxor\b|\bxnor\b|\bexclusive.?or\b|\binverter\b|universal gate|half.?adder|full.?adder|\bripple carry\b|\bkarnaugh\b|\bk.?map\b|logic (expression|diagram|simplif)|gate (symbol|diagram)|combinational logic|\bsum of products\b|\bminterm/.test(t))
    return /\btruth table\b|de ?morgan|\bk.?map\b|karnaugh|equivalen/.test(t) && !/\bgates?\b|circuit|adder|schematic/.test(t)
      ? C(CS_EXEMPLAR.table) : C(CS_EXEMPLAR.logic);
  // 2. comparison matrices → the grid (checked before the flow cues, because "compiler vs
  //    interpreter" and "the OSI model vs TCP/IP" both also carry process vocabulary)
  if(/\bram\b .{0,12}\brom\b|compiler .{0,12}interpreter|interpreter .{0,12}compiler|\btcp\b .{0,12}\budp\b|osi .{0,16}tcp|stack .{0,12}queue|array .{0,16}linked list|\bcompare\b .{0,40}(algorithm|memory|network|language|storage|structure)|difference(s)? between .{0,40}(ram|rom|compiler|interpreter|tcp|udp|stack|queue|lan|wan|analogue|digital|array|list)|\bk.?map\b|\bkarnaugh\b|character set|size units|adjacency matrix/.test(t))
    return C(CS_EXEMPLAR.table);
  // 3. base conversion, encoding and every other STEP problem → the worked solution, one line per
  //    beat. This is the biggest single band of 100-level computing marks.
  if(/\bconvert(ed|ing|s)?\b|\bdenary\b|\bhexadecimal\b|\bhex\b|\boctal\b|\bbinary (number|digit|form|arithmetic|addition|representation|equivalent)\b|\bbase ?(2|8|16)\b|place value|repeated division|remainders?|\bnibble\b|two'?s complement|one'?s complement|sign.?and.?magnitude|\boverflow\b|floating.?point|\bmantissa\b|\bexponent\b|\bascii\b|\bunicode\b|utf.?8|(8|16|32|64).?bit\b|\bbytes?\b|kilobyte|megabyte|gigabyte|\bkib\b|\bmib\b|subnet mask|\bip address\b|normalis(e|ed|ation)|\b[123]nf\b|normal form|work out .{0,20}\b(value|total|address)\b/.test(t))
    return C(CS_EXEMPLAR.solve);
  // 4. data structures (and the searching/sorting/complexity family that lives on them) → the tree.
  //    This is the stand-in until the dedicated ds canvas ships.
  if(/\bdata structures?\b|\barrays?\b|\blinked lists?\b|\bstacks?\b|\bqueues?\b|\blifo\b|\bfifo\b|enqueue|dequeue|\bpointers?\b|binary (search )?tree|\bbst\b|\bsubtree\b|traversal|in.?order|pre.?order|post.?order|adjacency (list|matrix)|hash (table|map|function)|\bleaf nodes?\b|\broot nodes?\b|zero.?based|off.?by.?one|\bbig.?o\b|o\(n( log n)?\)|linear search|binary search|bubble sort|selection sort|insertion sort|merge sort|quick ?sort|sorting algorithm|\brecursi(on|ve)\b|call stack|\bgraphs?\b .{0,24}(vertic|edges|directed)/.test(t))
    return C(CS_EXEMPLAR.tree);
  // 5. algorithms, processes and pipelines → the flow renderer used as a FLOWCHART
  if(/\bflow ?chart\b|\bflow diagram\b|dry.?run|trace table|\bpseudo.?code\b|\balgorithm\b|\bdecision (box|symbol|diamond)\b|\bterminator\b|fetch.?decode.?execute|instruction cycle|software development life ?cycle|\bsdlc\b|compil(ation|ing) (pipeline|process)|\bpacket'?s journey\b|\bpackets?\b|\bprotocol\b|client.?server|\bosi\b|\bboot(ing|s)? (up|process|sequence)\b|\bwhile loop\b|\bfor loop\b|\biteration\b|control structures?|\bdebugg?ing\b|life ?cycle|\bprocess (scheduling|management)\b|handshak/.test(t))
    return C(CS_EXEMPLAR.flow);
  // 6. genuine taxonomies — types of software, storage, topology, data types, DBMS models → tree
  if(/\btypes? of\b|\bkinds? of\b|categor|\bclassification\b|\bhierarch|consists? of|composed of|components? of|\bfamilies of\b|\bmodels? of\b/.test(t))
    return C(CS_EXEMPLAR.tree);
  /* A computing cue fired but nothing specific matched. Stay in-domain: a process flow is the
     workhorse of the subject, and the flowchart shot is a better teacher than anything outside it.
     THIS is the line that guarantees computing never borrows a foreign exemplar. */
  return C(CS_EXEMPLAR.flow);
}

/* ---- ORGANIC-CHEMISTRY GATE (index map). Organic is the one subject that has to be pulled out
   AHEAD of both biology and general chemistry, and for opposite reasons in each case. Against
   BIOLOGY: "amide", "amine", "hydrolysis", "amino acid" and "tertiary structure" all live in the
   biology regex, so a carbonyl passage would be handed a membrane scene. Against CHEMISTRY: an
   organic passage is stuffed with "reaction", "bond", "acid", "base", "electron" and "molecul", so
   it would fall straight into the Gen-Chem flow exemplar and produce a video that TALKS ABOUT a
   mechanism without ever SHOWING one — the exact failure mode the corpus warns about.
   The cues are split in two. ORG_HARD is unambiguous organic vocabulary (nobody writes
   "carbocation" or "Markovnikov" in a biology note) and is tested FIRST, before biology. ORG_SOFT
   is vocabulary organic shares with other subjects ("ester", "amine", "isomer", "aromatic") and is
   tested AFTER the biology gate, so a protein-structure passage keeps its biology exemplar. ---- */
const ORG_EXEMPLAR = { acid:42, sn2:43, sn1:44, addition:45, eas:46, carbonyl:47, radical:48,
                       resonance:49, groups:50, decision:51, naming:52, rs:53, shape:54, ladder:55 };
const ORG_HARD = new RegExp([
  // the formalism itself
  "nucleophil","electrophil","carbocation","carbanion","curly arrow","curved arrow",
  "electron.?push","arrow.?push","fishhook","fish.?hook","skeletal (structure|formula)","line.?angle",
  // the named mechanisms and the people
  "\\bs ?n ?1\\b","\\bs ?n ?2\\b","\\be ?1\\b","\\be ?2\\b","markovnikov","zaitsev","saytzeff","hofmann",
  "anti.?periplanar","arenium","friedel","bromonium","mercurinium","grignard","lindlar","wittig",
  "sandmeyer","walden","cahn","ingold","prelog","fischer projection","newman projection",
  // organic-only species and ideas
  "alkene","alkyne","alkyl halide","haloalkane","leaving group","hydroboration","halohydrin",
  "enantiomer","diastereomer","racemi","\\bchiral","achiral","stereocentre","stereocenter",
  "stereoisomer","hyperconjugation","tautomer","oxidation ladder","tetrahedral intermediate",
  "organic chemistry","\\borgo\\b","\\bpcc\\b","\\bnabh4\\b","\\blialh4\\b","sodium borohydride",
  "lithium aluminium hydride","tert.?butoxide","\\bt.?buok\\b","\\blda\\b"
].join("|"));
const ORG_SOFT = new RegExp([
  "functional group","aldehyde","\\bketone","carboxylic acid","\\bester\\b","\\bamide\\b","\\bamine\\b",
  "\\bnitrile\\b","anhydride","acetal","hemiacetal","\\bphenol\\b","\\bether\\b","carbonyl",
  "iupac","nomenclature","parent chain","\\blocant","substituent","\\bisomer","conformer",
  "chair (conformation|flip|form)","cis.?trans","\\be/z\\b","hybridi[sz]ation","\\bsp ?[23]\\b",
  "resonance structure","resonance form","delocalis","delocaliz","benzene","aromatic (ring|compound|hydrocarbon|substitution)",
  "toluene","cyclohexane","\\balkane\\b","substitution reaction","elimination reaction","addition reaction",
  "reaction mechanism","proton transfer","free.?radical","homolysis","heterolysis","propagation step"
].join("|"));
/* Route an organic highlight to the right renderer. Mechanisms dominate — eight of the fourteen
   shots are "curly" — because in Organic the answer IS a drawing and the reasoning is where a pair
   of electrons went. Everything else is the corpus's own routing table, verbatim. */
function pickOrganic(t){
  const B = i => EXEMPLARS[i];
  /* ── FIRST refusal: the four-way competition. If a passage names TWO OR MORE of the pathways, the
     question is not "how does S-N-one work" but "which of these happens" — which is the hardest
     topic in the course and the one the corpus insists must be a reason-annotated TREE rather than
     a flowchart. Tested before the individual mechanisms, or "SN1" in the question stem would grab
     it first and answer a question nobody asked. ── */
  const named = ["\\bs ?n ?1\\b","\\bs ?n ?2\\b","\\be ?1\\b","\\be ?2\\b"]
    .filter(re => new RegExp(re).test(t)).length;
  if(named>=2 || /substitution (versus|vs\.?|or) elimination|elimination (versus|vs\.?|or) substitution|which mechanism|competing (pathway|reaction)|decide between|bulky base|zaitsev|hofmann|anti.?periplanar/.test(t))
    return B(ORG_EXEMPLAR.decision);
  // ── the flagship: any reaction mechanism → curly, picking the closest-matching mechanism ──
  if(/radical|fishhook|fish.?hook|homolysis|initiation|propagation|termination|chain reaction|peroxide|anti.?markovnikov|\bhv\b|photochemical/.test(t))
    return B(ORG_EXEMPLAR.radical);
  if(/resonance (structure|form|hybrid|contributor)|delocalis|delocaliz|electron.?push|arrow.?push|contributing structure|major contributor/.test(t))
    return B(ORG_EXEMPLAR.resonance);
  if(/\bs ?n ?1\b|carbocation|racemi|rearrangement|hydride shift|methyl shift|unimolecular|first.?order .{0,20}(substitut|solvolys)|solvolysis|protic solvent/.test(t))
    return B(ORG_EXEMPLAR.sn1);
  if(/\bs ?n ?2\b|backside|back.?side attack|inversion of configuration|walden|bimolecular|aprotic|concerted .{0,20}substitut/.test(t))
    return B(ORG_EXEMPLAR.sn2);
  if(/markovnikov|electrophilic addition|addition to (an )?alkene|hydrohalogenation|hydration of (an )?alkene|halogenation of (an )?alkene|bromonium|halohydrin|hydroboration|\bpi bond\b .{0,30}attack/.test(t))
    return B(ORG_EXEMPLAR.addition);
  if(/electrophilic aromatic|\beas\b|arenium|nitration|sulfonation|friedel|directing (effect|group)|ortho.{0,12}para|meta.?direct|activating group|deactivating group/.test(t))
    return B(ORG_EXEMPLAR.eas);
  if(/carbonyl|tetrahedral intermediate|nucleophilic addition|grignard|hydride (delivery|reduction)|nabh4|sodium borohydride|lialh4|imine|acetal|hemiacetal|cyanohydrin|addition.?elimination|acyl substitution|ester hydrolysis|saponification/.test(t))
    return B(ORG_EXEMPLAR.carbonyl);
  if(/proton transfer|acid.?base|\bpka\b|conjugate (acid|base)|deprotonat|acidic (proton|hydrogen)|\bbronsted|brønsted/.test(t))
    return B(ORG_EXEMPLAR.acid);
  // ── genuine hierarchies → tree (the decision tree first: it is a tree, NOT a flowchart) ──
  if(/\be ?1\b|\be ?2\b|substitution (versus|vs\.?|or) elimination|elimination (versus|vs\.?|or) substitution|which mechanism|competing pathway|bulky base|zaitsev|hofmann|anti.?periplanar|beta.?hydrogen|β.?hydrogen/.test(t))
    return B(ORG_EXEMPLAR.decision);
  if(/functional group|naming priority|senior group|classify .{0,30}(group|reagent|compound)|types? of (isomer|functional group|reagent)|isomerism taxonomy|activating .{0,20}deactivating/.test(t))
    return B(ORG_EXEMPLAR.groups);
  // ── rule-governed procedures with one right answer per step → solve ──
  if(/\br\/s\b|\b[rs] configuration\b|cahn|ingold|prelog|\bcip\b|assign .{0,20}(r or s|configuration)|priority .{0,20}(rule|order)|fischer projection|lowest priority/.test(t))
    return B(ORG_EXEMPLAR.rs);
  if(/iupac|nomenclature|\bname (this|the) (molecule|compound|structure)\b|naming .{0,20}(rule|compound|molecule)|parent chain|\blocant|numbering .{0,16}chain|alphabetis|alphabetiz/.test(t))
    return B(ORG_EXEMPLAR.naming);
  // ── shape and space → geometry ──
  if(/hybridi[sz]ation|\bsp ?[23]\b|\bsigma bond\b|\bpi bond\b|restricted rotation|no rotation|cis.?trans|\be\/z\b|geometric isomer|conformer|conformation|chair (flip|form|conformation)|newman|axial|equatorial|\bchiral|stereocentre|stereocenter|enantiomer|diastereomer|\bmeso\b|optical activity|plane.?polaris|bond angle|trigonal|tetrahedral(?! intermediate)/.test(t))
    return B(ORG_EXEMPLAR.shape);
  // ── causal chains and reagent selectivity → flow ──
  if(/oxidation ladder|\bpcc\b|chromic acid|kmno4|permanganate|reagent selectiv|which reagent|oxidis|oxidiz|reduc(e|tion|ing)|jones reagent|why .{0,30}(more stable|stronger acid|faster)|stability (order|ladder|series)|\binduction\b|inductive effect/.test(t))
    return B(ORG_EXEMPLAR.ladder);
  if(/\bisomer/.test(t)) return B(ORG_EXEMPLAR.shape);
  // ── default: Organic's workhorse is the mechanism, not the mind-map ──
  return B(ORG_EXEMPLAR.sn2);
}
function pickExemplar(text){
  const t = (text||"").toLowerCase();
  /* ---- ORGANIC GATE, part one: the unambiguous cues, ahead of even biology (see note above). */
  if(ORG_HARD.test(t)) return pickOrganic(t);
  /* ---- COMPUTER-STUDIES STRONG GATE — ahead of biology, which owns "translation" and "tissue". */
  if(CS_STRONG.test(t)) return csPick(t);
  /* ---- PHYSICS STRONG GATE — ahead of biology, which owns "\bcarrier" (charge carriers) and
     "\bchannels?\b", and ahead of chemistry, which owns "decay", "electron" and "energy". Only the
     unmistakable terms are here; the broader physics vocabulary waits its turn below. */
  if(PHYS_HARD.test(t)) return phyPick(t);
  /* ---- BIOLOGY GATE — first refusal, before maths/physics/computing/chemistry (see note above). */
  if(BIO.test(t)){
    const B = i => EXEMPLARS[i];
    // genetic crosses → the Punnett grid (the flagship genetics renderer)
    if(/punnett|monohybrid|dihybrid|test cross|\bcross(ed|es|ing)? (a|two|between|with)\b|genotype|phenotyp|\ballele|homozyg|heterozyg|incomplete dominance|codominan|\bcarrier\b|mendel|\bdominant\b .{0,30}\brecessive\b|\brecessive\b|\bf1\b|\bf2\b|offspring ratio|3 ?: ?1|9 ?: ?3 ?: ?3 ?: ?1/.test(t))
      return B(BIO_EXEMPLAR.punnett);
    // membrane transport & anything happening across/inside one cell → the mechanism scene
    /* NB the word boundaries are load-bearing: "chemiosmosis" contains "osmosis" and "taxonomic"
       contains "axon", so an unanchored cue here would steal respiration and taxonomy questions. */
    if(/\bosmosis\b|osmolarit|tonicit|hypertonic|hypotonic|isotonic|diffusion|active transport|facilitated|sodium.?potassium pump|\bpermeab|cell membrane|plasma membrane|phospholipid|aquaporin|\bsolute\b|water potential|turgor|plasmolysis|\bmembrane\b|receptor|\bchannels?\b|\bsynap|\bneurons?\b|\baxons?\b|reabsorb|\bsecret(e|ion|ory)|\blumen\b|\btubule|\bvesicle|collecting duct/.test(t))
      return B(BIO_EXEMPLAR.scene);
    // plotted curves → the graph engine (kinetics first, because "rate" also appears in growth text)
    if(/\benzyme|\bsubstrate\b|active site|induced fit|lock.?and.?key|denatur|\bvmax\b|\bkm\b|michaelis|inhibitor|competitive inhibition|optimum (temperature|ph)|turnover/.test(t))
      return B(BIO_EXEMPLAR.kinetics);
    if(/population growth|carrying capacity|logistic|exponential growth|\bj.?(shaped|curve)\b|\bs.?(shaped|curve)\b|lag phase|environmental resistance|predator.?prey|birth rate|death rate|oxygen.?dissociation|action potential|dose.?response|growth curve/.test(t))
      return B(BIO_EXEMPLAR.population);
    // classification → the whiteboard tree (the one biology topic where a tree IS the diagram)
    if(/taxonom|classification|phylogen|cladogram|\bclade\b|binomial nomenclature|\bdomains?\b .{0,30}(bacteria|archaea|eukary)|\barchaea|rank hierarchy|kingdom|\bphylum\b|common ancestor|three domains|dichotomous key|(types?|four (families|groups|classes)|families) of (macromolecule|biomolecule|tissue|organism)|four (families|classes) of|macromolecule|biomolecule/.test(t))
      return B(BIO_EXEMPLAR.taxonomy);
    // the four flow pathways, each with its own gold shot
    if(/replication|helicase|primase|ligase|okazaki|semi.?conservative|leading strand|lagging strand|replication fork|\bs phase\b|proofread/.test(t))
      return B(BIO_EXEMPLAR.replication);
    if(/transcription|translation|central dogma|\bcodon\b|anticodon|\bmrna\b|\btrna\b|messenger rna|transfer rna|\bintron|\bexon|splicing|polypeptide|stop codon|start codon|ribosom/.test(t))
      return B(BIO_EXEMPLAR.dogma);
    if(/photosynth|calvin cycle|chloroplast|thylakoid|\bstroma\b|light.?(dependent|independent)|carbon fixation|\bchlorophyll\b|\brubisco\b|\bstomata\b|\bplants?\b/.test(t))
      return B(BIO_EXEMPLAR.photosynthesis);
    if(/respiration|glycolysis|pyruvate|krebs|citric acid cycle|link reaction|electron transport chain|chemiosmosis|atp synthase|mitochondri|\bnadh\b|\bfadh|aerobic|anaerobic|\blactate\b|fermentation/.test(t))
      return B(BIO_EXEMPLAR.respiration);
    /* A biology cue fired but no specific topic matched. Stay in-domain: a cascade is the biology
       workhorse, and the generic biology flow shot is a better teacher than anything outside the
       subject. THIS is the line that guarantees biology never borrows a foreign exemplar. */
    if(/\btwo (toxins|types|forms|kinds)\b|\btypes? of\b|classification|consists? of|composed of|\bfeatures of\b|components of|categor|defined as|\brefers? to\b/.test(t))
      return B(BIO_EXEMPLAR.taxonomy);
    return EXEMPLARS[2];
  }
  /* ---- ORGANIC GATE, part two: the cues Organic SHARES with other subjects. Tested after biology
     (so "amide bond" in a protein passage keeps its biology exemplar) but before chemistry (so
     "ester" and "aromatic" are not swallowed by the Gen-Chem flow). ---- */
  if(ORG_SOFT.test(t)) return pickOrganic(t);
  /* ---- MATHS GATE. Maths highlights must NEVER fall through to a medical/chemistry exemplar:
     the chemistry regex below would otherwise swallow "reaction", "atom", "distribution", "base"
     or "product" out of a perfectly ordinary maths passage. If any maths cue fires we route to a
     maths mode here and return before the chemistry/biology heuristics ever run. ---- */
  const MATHS = /derivative|differentiat|integral|integrat|antiderivative|\blimit\b|\btangent\b|\bsecant\b|calculus|\bsine\b|\bcosine\b|\btangent ratio\b|\bsin\b|\bcos\b|\btan\b|radian|unit circle|trigonometr|\bvector\b|\bvectors\b|scalar|magnitude and direction|dot product|cross product|\bmatrix\b|matrices|determinant|\beigen|linear transformation|inequalit|absolute value|number line|\bsolve\b|solving|factoris|factoriz|\bfactor\b|quadratic|parabola|complete the square|completing the square|simultaneous equation|probabilit|permutation|combination|\bsequence\b|\bseries\b|arithmetic progression|geometric progression|sigma notation|logarithm|\blog\b|\bln\b|exponential (growth|decay|function)|\bfunction\b .{0,24}\bgraph\b|domain and range|asymptot|\bpi\b|theta|\baxis\b .{0,20}\bcurve\b/;
  const ABSBAR = /\|\s*[a-z0-9][^|]{0,14}\|/i;   // |x|, |x − 3|, |2x + 1| — absolute-value bars
  const isMaths = MATHS.test(t) || ABSBAR.test(text||"") || /∫|∑|√|θ|π|dy\/dx|d\/dx|f'\(x\)|f′\(x\)|≤|≥/.test(text||"");
  /* ---- COMPUTER-STUDIES GATE (the wide one), ahead of physics and the maths routing. See the
     block comment above csPick for why computing needs its own gate rather than a cue list. ---- */
  if(CS.test(t)) return csPick(t);
  /* ---- PHYSICS GATE, ahead of maths. "Resultant", "magnitude", "amplitude", "period" and even
     "vector" all fire the maths regex, so a forces, waves or circuits question would otherwise be
     handed a maths exemplar. Once a physics cue fires we hand off to phyPick and ALWAYS return a
     physics exemplar — motion and any quantity-vs-time to the graph, forces to the free-body
     diagram, circuits to the schematic, waves and simple harmonic motion to the graph, vectors to
     the arrow plane, and energy/momentum problems to the ledger or the worked solution. ---- */
  if(PHYS.test(t)) return phyPick(t);
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

/* PUNNETT square: the grid must be self-consistent — the cells must exactly tile the gametes, every
 * phenotype must name a declared trait, and every cell must actually be revealed by some step. */
const PUN_PARTS = new Set(["p1","p2","gtop","gside","tally","ratio"]);
export function punnettCheck(bp){
  const issues=[]; if(!bp||typeof bp!=="object") return {pass:false,issues:["not an object"]};
  if(!bp.meta||!bp.meta.title) issues.push("missing meta.title");
  const P=bp.parents||{};
  ["p1","p2"].forEach(k=>{ if(!P[k]||!P[k].genotype) issues.push("parents."+k+" needs a genotype (e.g. \"Aa\")"); });
  const G=bp.gametes||{}, top=Array.isArray(G.top)?G.top:[], side=Array.isArray(G.side)?G.side:[];
  if(![2,4].includes(top.length)) issues.push("gametes.top must have 2 (monohybrid) or 4 (dihybrid) entries, got "+top.length);
  if(![2,4].includes(side.length)) issues.push("gametes.side must have 2 (monohybrid) or 4 (dihybrid) entries, got "+side.length);
  top.forEach((g,i)=>{ if(typeof g!=="string"||!g.trim()) issues.push("gametes.top["+i+"] must be a non-empty allele string"); });
  side.forEach((g,i)=>{ if(typeof g!=="string"||!g.trim()) issues.push("gametes.side["+i+"] must be a non-empty allele string"); });
  const traits=Array.isArray(bp.traits)?bp.traits:[], tkey={};
  if(traits.length<2) issues.push("need ≥2 traits — the phenotype grouping is what makes the ratio visible");
  if(traits.length>4) issues.push("too many traits ("+traits.length+") — 4 is the most a cross can show");
  traits.forEach((t,i)=>{ if(!t.key) issues.push("trait "+(i+1)+" missing key");
    else { if(tkey[t.key]) issues.push("duplicate trait key '"+t.key+"'"); tkey[t.key]=1; }
    if(!t.label) issues.push("trait "+(i+1)+" needs a label saying what that phenotype looks like"); });
  const cells=Array.isArray(bp.cells)?bp.cells:[], want=top.length*side.length, id={};
  if(top.length&&side.length&&cells.length!==want)
    issues.push("cells must tile the grid exactly — expected "+want+" ("+side.length+" rows × "+top.length+" columns), got "+cells.length);
  cells.forEach((c,i)=>{
    const cid=c.id||("c"+i);
    if(!c.id) issues.push("cell "+(i+1)+" missing id");
    if(PUN_PARTS.has(cid)) issues.push("cell id '"+cid+"' collides with a reserved part name");
    if(id[cid]) issues.push("duplicate cell id '"+cid+"'"); id[cid]=1;
    if(!c.geno) issues.push("cell '"+cid+"' missing geno (the combined genotype)");
    if(!c.pheno) issues.push("cell '"+cid+"' missing pheno");
    else if(!tkey[c.pheno]) issues.push("cell '"+cid+"' phenotype '"+c.pheno+"' is not one of the declared traits"); });
  if(!bp.ratio) issues.push("missing 'ratio' — the whole point of the square is the ratio it produces");
  const steps=Array.isArray(bp.narration_steps)?bp.narration_steps:[];
  if(steps.length<4) issues.push("too few steps ("+steps.length+", need ≥4)");
  if(steps.length>12) issues.push("too many steps ("+steps.length+")");
  const known=r=>!!id[r]||PUN_PARTS.has(r), seen=new Set();
  steps.forEach((s,i)=>{
    if(!s.narration_text||!s.narration_text.trim()) issues.push("step "+(i+1)+" has no narration");
    if(s.narration_text&&s.narration_text.length>420) issues.push("step "+(i+1)+" narration too long");
    (s.reveal||[]).forEach(r=>{ if(!known(r)) issues.push("step "+(i+1)+" reveals unknown id '"+r+"' (use a cell id, 'p1', 'p2', 'gtop', 'gside', 'tally' or 'ratio')"); else seen.add(r); });
    (s.active||[]).forEach(r=>{ if(!known(r)) issues.push("step "+(i+1)+" active unknown id '"+r+"'"); });
    if(s.point&&!known(s.point)) issues.push("step "+(i+1)+" point unknown id '"+s.point+"'"); });
  ["gtop","gside","ratio"].forEach(p=>{ if(!seen.has(p)) issues.push("'"+p+"' is never revealed — "+
    (p==="ratio"?"the cross has to end with the ratio":"the headers must be earned from the gametes before any cell means anything")); });
  cells.forEach((c,i)=>{ const cid=c.id||("c"+i); if(!seen.has(cid)) issues.push("cell '"+cid+"' is never revealed — it will stay blank"); });
  return {pass:issues.length===0,issues};
}

/* Every layout the engine in app.html can actually draw. A blueprint naming anything else would
 * fall through to the scene renderer and blow up, so it is rejected here and at the response guard. */
/* ---- CURLY-ARROW MECHANISM check. The anti-pattern guards from the Organic corpus are VALIDATION,
   not style: tails are always electron-rich and heads electron-poor, so an arrow may never start on
   a cation or an empty orbital; a tail must be TYPED, so an arrow can never quietly start on an atom
   label when a bond was meant; radicals use fishhooks and nothing else does; and the charge ledger
   must balance, because a mechanism that does not conserve charge is the "arrows can go anywhere"
   habit made visible. ---- */
const CURLY_PARTS = new Set(["rail","ledger"]);
const CURLY_MODES = new Set(["stepwise","concerted","resonance","radical"]);
const CURLY_FKINDS = new Set(["step","ts","intermediate","product","danger"]);
const CURLY_SLOTS = new Set(["left","center","right"]);
const CURLY_TAILS = new Set(["lone-pair","sigma","pi","anion","radical"]);
const CURLY_HEADS = new Set(["atom","empty-orbital","bond"]);
function chargeNum(c){ const s=String(c==null?"":c).replace(/−/g,"-").replace(/\s/g,"");
  if(s===""||s==="0") return 0;
  const m=/^([+-]?)(\d*)$/.exec(s); if(m) return (m[1]==="-"?-1:1)*(m[2]===""?1:parseInt(m[2],10));
  const n=/^(\d*)([+-])$/.exec(s); if(n) return (n[2]==="-"?-1:1)*(n[1]===""?1:parseInt(n[1],10));
  return null; }
export function curlyCheck(bp){
  const issues=[]; if(!bp||typeof bp!=="object") return {pass:false,issues:["not an object"]};
  if(!bp.meta||!bp.meta.title) issues.push("missing meta.title");
  const mode=bp.mode||"stepwise";
  if(!CURLY_MODES.has(mode)) issues.push("mode must be one of: "+[...CURLY_MODES].join(", ")+" — say it out loud in step 1, it predicts the kinetics and whether an intermediate exists");
  const frames=Array.isArray(bp.frames)?bp.frames:[];
  if(frames.length<2) issues.push("need at least 2 frames — a mechanism is a sequence, and the consequence must be its own frame so the arrow is seen to CAUSE the bond change");
  if(frames.length>6) issues.push("too many frames ("+frames.length+") — the step rail holds 6");
  const id={}, owner={}, charges=[];
  frames.forEach((f,i)=>{
    const who="frame "+(f.id||("#"+(i+1)));
    if(!f.id){ issues.push("frame "+(i+1)+" missing id"); return; }
    if(CURLY_PARTS.has(f.id)) issues.push("frame id '"+f.id+"' collides with a fixed part name — rename it");
    if(id[f.id]) issues.push("duplicate id '"+f.id+"'"); id[f.id]="frame";
    if(!f.title) issues.push(who+" needs a VERB title (\"nucleophile attacks\"), never \"step "+(i+1)+"\"");
    if(f.kind&&!CURLY_FKINDS.has(f.kind)) issues.push(who+" kind must be one of: "+[...CURLY_FKINDS].join(", "));
    if(f.kind==="intermediate"&&!f.badge) issues.push(who+" is an intermediate with no badge — name it (\"carbocation\", \"tetrahedral intermediate\", \"arenium ion\"), because students do not notice intermediates exist unless they are named");
    const cn=chargeNum(f.charge); charges.push(cn);
    if(cn===null) issues.push(who+" charge \""+f.charge+"\" is not readable — use \"0\", \"−1\", \"+1\"");
    const sp=Array.isArray(f.species)?f.species:[];
    if(!sp.length) issues.push(who+" has no species — there is nothing on the board to draw an arrow on");
    if(sp.length>3) issues.push(who+" has "+sp.length+" species — the board holds 3");
    const local={};
    sp.forEach((s,j)=>{ const w2=who+" species "+(s.id||("#"+(j+1)));
      if(!s.id){ issues.push(w2+" missing id"); return; }
      if(CURLY_PARTS.has(s.id)) issues.push("species id '"+s.id+"' collides with a fixed part name — rename it");
      if(id[s.id]&&id[s.id]!=="species") issues.push("id '"+s.id+"' is used twice for different things");
      id[s.id]="species"; owner[s.id]=f.id; local[s.id]=s;
      if(!s.label) issues.push(w2+" needs a label — the structure as text (\"H₃C—Br\", \"HO⁻\")");
      if(s.slot&&!CURLY_SLOTS.has(s.slot)) issues.push(w2+" slot must be left, center or right");
      if(s.lp!=null&&(typeof s.lp!=="number"||s.lp<0||s.lp>4)) issues.push(w2+" lp must be 0–4 lone PAIRS"); });
    const ar=Array.isArray(f.arrows)?f.arrows:[];
    if(ar.length>3) issues.push(who+" has "+ar.length+" arrows — at most 3 per frame, or no one can follow them");
    ar.forEach((a,j)=>{ const w2=who+" arrow "+(a.id||("#"+(j+1)));
      if(!a.id){ issues.push(w2+" missing id"); return; }
      if(CURLY_PARTS.has(a.id)) issues.push("arrow id '"+a.id+"' collides with a fixed part name — rename it");
      if(id[a.id]&&id[a.id]!=="arrow") issues.push("id '"+a.id+"' is used twice for different things");
      id[a.id]="arrow"; owner[a.id]=f.id;
      if(!local[a.from]) issues.push(w2+" starts on '"+a.from+"', which is not a species in this frame");
      if(!local[a.to]) issues.push(w2+" ends on '"+a.to+"', which is not a species in this frame");
      if(!CURLY_TAILS.has(a.tail)) issues.push(w2+" needs a TYPED tail — one of: "+[...CURLY_TAILS].join(", ")+". An untyped tail is how an arrow quietly ends up starting on an atom label when a bond was meant");
      if(!CURLY_HEADS.has(a.head)) issues.push(w2+" head must be one of: "+[...CURLY_HEADS].join(", "));
      const k=a.kind||"pair";
      if(k!=="pair"&&k!=="fishhook") issues.push(w2+" kind must be \"pair\" or \"fishhook\"");
      if(mode==="radical"&&k!=="fishhook") issues.push(w2+" is in radical mode, so it must be a \"fishhook\" — a radical moves ONE electron, and using a double-barbed arrow out of habit is the exact mistake this mode exists to stop");
      if(mode!=="radical"&&k==="fishhook") issues.push(w2+" is a fishhook but the mode is \""+mode+"\" — single-electron arrows belong to radical mechanisms only");
      const from=local[a.from], to=local[a.to];
      // tails are electron-RICH and heads electron-POOR; the typed tail is what stops an arrow
      // quietly starting on a plus sign or on an empty orbital
      if(a.tail==="anion"&&from&&!/-|−/.test(String(from.charge||"")))
        issues.push(w2+" claims a negative-charge tail, but '"+a.from+"' carries no negative charge. A tail must be electron-rich — use \"lone-pair\", \"sigma\" or \"pi\", or put the charge on the species");
      if(a.head==="empty-orbital"&&to&&!/\+/.test(String(to.charge||"")))
        issues.push(w2+" points into an empty orbital, but '"+a.to+"' is not drawn as electron-poor. An empty p orbital belongs to a cation — give it a \"+\" or a \"δ+\"");
      if(a.kind==="fishhook"&&a.tail!=="radical"&&a.tail!=="sigma"&&a.tail!=="pi")
        issues.push(w2+" is a fishhook, so its tail must be a single unpaired electron (\"radical\") or one electron of a bond (\"sigma\"/\"pi\")");
      if(a.tail==="pi"&&from&&!/=|≡|π/.test(String(from.label||""))&&!/aromat|benz|ring|arene/i.test(String(from.note||"")))
        issues.push(w2+" claims a π-bond tail, but '"+a.from+"' has no double bond, triple bond or ring in its label — draw the π bond you are starting from");
      if(!a.label) issues.push(w2+" needs a label naming the TAIL then the head (\"lone pair → the carbon\") — no unlabelled arrows, ever"); });
  });
  // charge is conserved — that is what lets a student check their own arrows
  const known=charges.filter(c=>c!=null);
  if(known.length>1&&known.some(c=>c!==known[0]))
    issues.push("the charge ledger does not balance ("+known.join(" → ")+"). Total charge is conserved across every step of a mechanism; if it changes, an arrow is wrong or a counter-ion is missing");
  // concerted mechanisms have no intermediate, by definition
  if(mode==="concerted"&&frames.some(f=>f.kind==="intermediate"))
    issues.push("mode is \"concerted\" but a frame is kind \"intermediate\" — concerted means ONE step and ONE transition state, with no intermediate at all. Use kind \"ts\", or switch the mode to \"stepwise\"");
  if(mode==="stepwise"&&frames.length>2&&!frames.some(f=>f.kind==="intermediate"))
    issues.push("mode is \"stepwise\" but no frame is kind \"intermediate\" — the whole point of stepwise is that a real species forms in the middle; give it its own frame and a badge");
  const steps=Array.isArray(bp.narration_steps)?bp.narration_steps:[];
  if(steps.length<4) issues.push("too few steps ("+steps.length+", need ≥4) — the tail, the arrow and the consequence are three separate beats");
  if(steps.length>10) issues.push("too many steps ("+steps.length+")");
  const ok=r=>!!id[r]||CURLY_PARTS.has(r), seen=new Set(); let arrowSeen=false;
  steps.forEach((s,i)=>{
    if(!s.narration_text||!s.narration_text.trim()) issues.push("step "+(i+1)+" has no narration");
    if(s.narration_text&&s.narration_text.length>380) issues.push("step "+(i+1)+" narration too long");
    (s.reveal||[]).forEach(r=>{ if(!ok(r)) issues.push("step "+(i+1)+" reveals unknown id '"+r+"' (use a frame, species or arrow id, or "+[...CURLY_PARTS].join(", ")+")"); else { seen.add(r); if(id[r]==="arrow")arrowSeen=true; } });
    (s.active||[]).forEach(r=>{ if(!ok(r)) issues.push("step "+(i+1)+" activates unknown id '"+r+"'"); });
    if(s.point&&!ok(s.point)) issues.push("step "+(i+1)+" points at unknown id '"+s.point+"'"); });
  frames.forEach(f=>{ if(f.id&&!seen.has(f.id)) issues.push("frame '"+f.id+"' is never revealed by any step"); });
  frames.forEach(f=>(Array.isArray(f.arrows)?f.arrows:[]).forEach(a=>{
    if(a.id&&!seen.has(a.id)) issues.push("arrow '"+a.id+"' is never revealed — an arrow that never fires teaches nothing"); }));
  if(!arrowSeen) issues.push("no arrow is ever revealed — a curly-arrow mechanism with no arrows is just a list of structures");
  // a frame's arrows must not be revealed before the frame they live on
  const at={}; steps.forEach((s,i)=>(s.reveal||[]).forEach(r=>{ if(at[r]==null)at[r]=i; }));
  frames.forEach(f=>(Array.isArray(f.arrows)?f.arrows:[]).forEach(a=>{
    if(at[a.id]!=null&&at[f.id]!=null&&at[a.id]<at[f.id]) issues.push("arrow '"+a.id+"' is revealed before its frame '"+f.id+"'"); }));
  // concerted: every arrow on a frame fires in ONE beat, because that IS the claim being made
  if(mode==="concerted") frames.forEach(f=>{ const ar=Array.isArray(f.arrows)?f.arrows:[];
    if(ar.length>1){ const ts=ar.map(a=>at[a.id]).filter(x=>x!=null);
      if(ts.length>1&&ts.some(x=>x!==ts[0])) issues.push("mode is \"concerted\", so the arrows on frame '"+f.id+"' must ALL be revealed in the SAME step — showing them one at a time says stepwise, which is the opposite of what you are teaching"); } });
  return { pass: issues.length===0, issues };
}
export const LAYOUTS = new Set(["scene","tree","flow","cell","graph","orbital","geometry","ice","venn","unitcircle","solve","vectors","matrix","fbd","circuit","logic","table","punnett","curly"]);

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
  if(bp && bp.layout==="punnett") return punnettCheck(bp);
  if(bp && bp.layout==="curly") return curlyCheck(bp);
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
  if(bp && bp.layout==="punnett"){ const P=bp.parents||{}, G=bp.gametes||{};
    return [ ((P.p1&&P.p1.genotype)||"?")+" × "+((P.p2&&P.p2.genotype)||"?"),
             "gametes: "+((G.top||[]).join(", "))+"  /  "+((G.side||[]).join(", ")) ]
      .concat((bp.cells||[]).map(c=>c.geno||c.id))
      .concat((bp.traits||[]).map(t=>t.label||t.key))
      .concat([bp.ratio||""]).filter(Boolean); }
  if(bp && bp.layout==="curly") return [(bp.mode||"stepwise")+" mechanism", bp.reaction||""]
    .concat((bp.frames||[]).map(f=>(f.title||f.id)+(f.badge?"  ["+f.badge+"]":"")+"  · charge "+(f.charge||"0")))
    .concat((bp.frames||[]).flatMap(f=>(f.arrows||[]).map(a=>"arrow: "+(a.label||a.id)+"  (tail = "+(a.tail||"?")+")")))
    .filter(Boolean);
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
