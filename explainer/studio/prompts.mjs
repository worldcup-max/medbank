/* Explainer Studio prompts. The order is the method: understand → model (the truth) → drawing driven by the model → lesson.
 * The few-shot exemplars are the cardiac fixtures, i.e. the Four-Chamber Heart plate rewritten in the Studio contract. */
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
const HERE = dirname(fileURLToPath(import.meta.url));
const ex = (f) => readFileSync(join(HERE, "fixtures", f), "utf8");

export function understandPrompt(topic, note) {
  return `You are planning an interactive, model-driven explainer for a pre-medical / medical student. It will look like a scientific specimen plate:
an ORIGINAL detailed drawing of the real structure (not a copy of any figure), animated by a small numerical MODEL of how it works, with live readouts, a timeline chart and a narrated tutor.

TOPIC: ${topic}
THE STUDENT'S NOTE:
"""
${String(note || "").slice(0, 14000)}
"""

Work out the real mechanism behind this topic and plan it. Be quantitatively correct (real textbook values with units).
Return ONLY JSON:
{
 "title": "short plate title, e.g. 'The four-chamber heart'", "titleEm": "italic tail, e.g. 'in motion'", "figLabel": "e.g. 'Plate 1 · Cardiac cycle'",
 "sub": "one sentence: what drives everything you will see (the model's core rule)",
 "kind": "cycle" | "journey" | "time-course" | "sequence",
   // cycle = repeats (heartbeat, breathing, action potential train)
   // journey = follow ONE parcel along a path through a structure (filtrate through the nephron, a bolus through the gut, air into the alveoli, an impulse along a pathway, a drug from gut to receptor): t is its transit time, the phases are the segments in order, and the numbers are what is happening to the parcel where it is now
   // time-course = one run of something that changes over time (drug level over 24 h, GFR falling in AKI); sequence = discrete stages
   // CHOOSE THE FRAME IN WHICH THE HEADLINE NUMBERS CHANGE. A process that is a path through an organ is a journey. A steady state repeated over a day is never right.
 "timeUnit": "ms" | "s" | "min" | "h", "duration": number (one cycle or the whole run, in timeUnit),
 "state_variables": ["what the model integrates, with units, e.g. 'LV volume (mL)'"],
 "rules": ["the cause-and-effect laws the model must obey, e.g. 'a valve is open only while upstream pressure > downstream pressure'", ...],
 "parameters": [{"name": "...", "value": number, "unit": "...", "why": "..."}],
 "quantities": [{"key": "camelCaseKey", "label": "...", "unit": "...", "typical": [low, high]}],   // what the ledger and chart will show; typical = real-world range over the run
 "parts": [{"id": "short_id", "name": "Anatomical / physical name", "role": "what it does in this mechanism"}],   // 6–16 structures the drawing must contain
 "phases": ["names of the stages in order, as the model will report them (for a journey: the segments, each visited once)"],
 "visual_plan": "4–8 sentences: the ORIGINAL figure — what cutaway or view, where each part sits on a 760×640 canvas, what moves and how (flows, valves, swelling, levels), what is drawn faintly as context. Rich, anatomically faithful detail.",
 "misconceptions": ["common student errors the tutor should correct"],
 "lesson": [{"title": "2–4 words", "phase": "one of phases", "focus": ["part ids"], "say": "2–4 spoken sentences, uses the note's own terms, explains WHY with numbers from the model"}],   // 5–9 steps
 "note_has_figure": true|false
}`;
}

export function modelPrompt(plan) {
  return `Write the MODEL for this explainer: a small, deterministic numerical model in plain JavaScript that is the single source of truth. Every number, phase, valve/gate state and motion on screen will come from it.

PLAN:
${JSON.stringify(plan, null, 1)}

CONTRACT — define exactly one function, no imports, no DOM, no randomness, runs in < 300 ms:
function createModel() {
  // build parameters, integrate the state variables from first principles (ODEs with small Euler sub-steps, or closed-form laws),
  // settle to steady state if it is a cycle, then record N samples over one period / the whole run
  return {
    T: <duration in timeUnit>, N: 600, timeUnit: "${plan.timeUnit || "s"}", clockNote: "e.g. '75 bpm' or 'dose 400 mg'", speeds: [<4 sensible playback multipliers>],
    parts: [{ id, name }],                          // the plan's parts, same ids
    readouts: [{ key, label, unit, digits, big? }], // every quantity; mark 3–4 headline ones big:true
    chart: [{ lane, unit, min?, max?, series: [{ key, label, tone: "hot"|"cold"|"accent"|"muted", dash? }] }],   // 1–3 lanes, the graphs a textbook would show
    gateTitle?: "Valve"|"Channel"|..., gates?: [{ label, on: (s) => bool, detail: (s) => "A 12.0 > B 8.1" }],   // things that open/close, with the comparison that decides it
    onWord?: "OPEN", offWord?: "SHUT",
    events?: (S, T) => [{ t, label, sound?: bool, freq? }],   // e.g. heart sounds, action potential threshold
    short?: { "<phase name>": "short chart label" },
    sample(t) { return { phase: "<one of the phase names>", readouts: { key: number, … },
      parcel?: { part: "<part id the parcel is in>", u: 0..1 },   // journeys: where the followed parcel is, u = fraction of the way along that part
      parts: { <id>: { active: 0..1 (how hard it is working/contracting/firing), open: 0|1 (for valves/gates/channels only), flow: 0..1 (flow through it relative to its own max), level: 0..1 (optional fill) } } }; },
    explain(s, t) { return "1–2 sentences of HTML (<b> allowed) saying WHY this phase is happening, quoting the live numbers"; },
    notes: "the model's assumptions in one or two sentences",
  };
}
THE MODEL MUST BE REAL, NOT A SCHEDULE:
- Every phase, gate and activity is computed from the state and the plan's laws. Never drive them from a clock: no "t % 60", no "if (t < 10) phase = …" timetable, no Math.sin(t) wobble — unless the clock IS the physiology (a pacemaker, a dosing interval).
- A journey: give each segment a real transit time; from t find the segment the parcel is in (phase) and how far along it is (parcel.u); integrate that segment's law over the distance travelled (e.g. descending limb: osmolality rises toward the local interstitium; thick ascending limb: NaCl pumped out so osmolality falls to ~100; proximal tubule: 65% of volume removed iso-osmotically). Readouts are the parcel's own properties (its osmolality, % of the filtered volume still left, its flow, the local interstitial value), so they change along the way. Each phase is visited ONCE, in order.
- parts[id].active = how hard that part is working right now (from the state), so the drawing can show it.
- Report proportions as percent (0–100, unit "%"), not fractions.
RULES: real units and textbook magnitudes (stay inside each quantity's typical range); states must come from the rules (a gate opens because a comparison says so — never from a hard-coded schedule unless the schedule IS the physiology, like a pacemaker); keys in chart/gates/big must exist in readouts; every part id appears in sample().parts; phase names exactly as planned.

EXAMPLE OF THE STANDARD EXPECTED (the cardiac cycle):
\`\`\`js
${ex("cardiac.model.js")}
\`\`\`
Return ONLY the JavaScript in one \`\`\`js block.`;
}

const KIT_DOC = `K — the drawing kit (SVG, viewBox 0 0 760 640, y down). Draw back-to-front.
  const L = K.layers("bg","back","mid","front","top")   → <g> layers (a "labels" layer is added last automatically)
  K.vessel(parent, pts, r, {tone:"hot"|"cold"|"neutral"|"tissue", cap:"round"|"butt"})   → tube with wall + lumen along a smooth centreline (vessels, ducts, tubules, airways, axons)
  K.blob(parent, pts, {fill, stroke, width, opacity}) → closed smooth shape; .set(newPts) to reshape every frame (chambers, cells, organs). default fill = tissue gradient
  K.deformer(A, B, reach, scale) → fn(p) that scales points away from the line A–B (keep a valve ring / hilum fixed while a chamber swells)
  K.volumeScale(V, Vref, k=0.45) → scale factor for a cavity holding volume V
  K.valve(parent, A, B, downDir, "av"|"sl") → leaflets hinged at A and B; .set(open 0..1); .flash(0..1)
  K.bed(parent, x, y, w, h, label) → exchange bed (capillaries, alveoli, glomerulus, synapse); .set(active 0..1)
  Only these return objects with .set: blob, valve, bed, tag. vessel returns a <g> (style it directly).
  K.label(x, y, "text", "start"|"middle"|"end", {strong}) → small italic label with halo (overlaps are auto-resolved)
  K.tag(x, y, "LV") → big two-line tag; .set("117 mmHg · 62 mL") each frame
  K.part(id, ...elements) → register drawn elements as a model part (REQUIRED for every part: the tutor spotlights them)
  K.flows({ segId: { pts, w, layer, rate:(i,s)=>number (use 0.2 + s.parts[x].flow), gate?:(i,s)=>open 0..1, tone: 0 cold … 1 hot | "up" | "down" } }, [[segId,…], …routes]) → particles; call .update(i, s, d) every frame
  K.el(tag, attrs, parent), K.spline(pts, closed), K.mid(a,b), K.norm(v), K.lerp, K.f1
  CSS colour tokens (use these, never raw colours, so dark mode works): var(--wall) var(--wall-deep) var(--wall-hi) var(--fat) var(--hot) var(--hot-lumen) var(--hot-hi) var(--cold) var(--cold-lumen) var(--cold-hi) var(--fluid) var(--bed) var(--leaflet) var(--leaflet-edge) var(--accent) var(--open) var(--shut) var(--ink) var(--muted) var(--hair) var(--sheet)`;

export function scenePrompt(plan, modelInfo) {
  return `Write the SCENE: the original, detailed drawing for this explainer, driven every frame by the model. It must look like a hand-made scientific plate — a real structure with many small, purposeful parts — not boxes and arrows, and not a copy of any textbook figure.

PLAN:
${JSON.stringify({ title: plan.title, parts: plan.parts, phases: plan.phases, visual_plan: plan.visual_plan }, null, 1)}
THE MODEL PROVIDES (s = sample at this frame):
${JSON.stringify(modelInfo, null, 1)}

${KIT_DOC}

CONTRACT — define exactly one function:
function createScene(svg, K, M, S) {   // M = the model, S = all N samples (use them to precompute e.g. max values)
  // build everything once here (static anatomy, labels, K.part registrations, flows)
  return { paths: { /* journeys only: partId → the centreline points you drew that part with; the runtime moves the parcel along them */ },
    update(i, s, d) { /* move what the model moves: reshape chambers from volumes, set valves from s.parts[id].open, glow from active, flows.update(i, s, d), tags with live numbers */ } };
}
CRAFT RULES (from the /anatomy method):
- The object is the explanation: a faithful cutaway/section of the real structure, filling ~70% of the 760×640 canvas, with real proportions and relationships.
- Highly detailed, never noise: walls with thickness, lumens, layered back/mid/front depth (vessels pass behind/in front correctly), small true parts (valve leaflets, fat in grooves, cut vessels, capillary beds, membranes, cells) — at least 25 drawn structures.
- Everything that moves is driven by s (volumes → K.deformer/K.volumeScale, valves → .set(s.parts[id].open), flows → K.flows with rate from s.parts[x].flow). Nothing moves on its own timer.
- Every part id from the model is drawn and registered with K.part(id, …).
- Fill the canvas: the main structure's bounding box covers at least half of 760×640. A long thin structure (nephron, gut, neuron) is unfolded schematically across the canvas, never shrunk into a corner; keep 40 px between parallel limbs so labels fit.
- A journey: draw the path as ONE continuous tube in order (each segment's centreline starts where the previous one ends), keep each centreline in a variable and return them as paths so the runtime can move the parcel along them; shade context (e.g. the interstitial osmolality gradient, darker toward the papilla) from the model's values; light up the segment the parcel is in (s.parts[id].active).
- update() only READS the model: s.phase, s.parcel, s.readouts, s.parts. Never compute your own timing or phase from i.
- Colour by meaning: blood vessels hot (oxygenated) / cold, tubular fluid "neutral"; capillary networks are several separate thin vessels, never one zig-zag path.
- Labels: short anatomical names placed next to (not on top of) their structure; 1–2 big K.tag readouts inside the key compartments with live values.
- Use only the CSS tokens for colour. Keep all geometry inside x 20–740, y 20–620.
- Keep the code COMPACT (under ~350 lines): generate repeated structures (cells, capillary loops, coils, villi, hatching) with loops and small helper functions; never write out long coordinate lists — at most ~25 hand-written points per path.

EXAMPLE OF THE STANDARD EXPECTED (the cardiac cycle scene for the cardiac model):
\`\`\`js
${ex("cardiac.scene.js")}
\`\`\`
Return ONLY the JavaScript in one \`\`\`js block.`;
}

export function fixPrompt(kind, code, issues, context) {
  return `This ${kind} code for a model-driven explainer failed automatic checks. Fix every issue while keeping everything that works. ${kind === "scene" ? "Keep the same createScene(svg, K, M, S) contract and the K kit API." : "Keep the same createModel() contract."}
${context ? "CONTEXT:\n" + context + "\n" : ""}
ISSUES:
- ${issues.join("\n- ")}

CODE:
\`\`\`js
${code}
\`\`\`
Return ONLY the full corrected JavaScript in one \`\`\`js block.`;
}

export function figureMapPrompt(parts, W, H) {
  return `This image is a diagram from a student's lecture note (${W}×${H} pixels). Map where each of these structures is on it, in IMAGE PIXEL coordinates (x right, y down):
${parts.map((p) => `- ${p.id}: ${p.name}`).join("\n")}
For each structure you can see: an outline polygon (6–14 points hugging it) or, for small round things like valves, an ellipse [cx, cy, rx, ry]; plus a label point just beside it (not covering any printed number or text).
Also trace the FLOW paths (blood, urine, air, current…) as ordered points along the channels, split at each structure so each piece can be driven by one part: {"pts": [[x,y],…], "part": id whose flow drives it, "gate": id of a valve it passes (or null), "tone": 0 for deoxygenated/upstream, 1 for oxygenated/downstream}.
Skip structures that are not in the image. Return ONLY JSON:
{"parts": {"<id>": {"poly": [[x,y],…]} | {"ell": [cx,cy,rx,ry]}, "label": [x,y]}, "flows": [ … ]}`;
}
