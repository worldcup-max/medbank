// node tools/manifest.mjs <dir> [topic-id] [course]
// Builds <dir>/manifest.json: the contract DeepSeek uses to write a note-driven tutor for this plate.
// Facts (phases + time windows, parts, readouts + ranges) come from running model.js; the meaning of each
// ("shows") comes from the author-written <dir>/shows.json. Fails loudly if anything is undescribed or the
// default lesson does not validate against the manifest.
//
// shows.json = { "phases": {"<phase name>": "what the student sees happen"}, "parts": {"<id>": "what it is / does here"},
//   "readouts": {"<key>": "what the number means"}, "conditions": ["fixed settings, e.g. ADH on"],
//   "concepts": ["concepts the plate can show"], "not_shown": ["related concepts the plate cannot show (explain in words + flag)"] }
import { readFileSync, writeFileSync, existsSync } from "node:fs"; import { join } from "node:path"; import vm from "node:vm";

export function validateLesson(lesson, manifest, opt = {}) {
  // the same rule the app applies to DeepSeek's note-driven tutor before showing it
  const issues = [], P = new Set(manifest.phases.map((p) => p.name)), Q = new Set(manifest.parts.map((p) => p.id)), LZ = new Set((manifest.lenses || []).map((l) => l.id));
  if (!lesson || !Array.isArray(lesson.steps) || !lesson.steps.length) return ["lesson has no steps"];
  lesson.steps.forEach((s, k) => {
    if (!s.say || typeof s.say !== "string") issues.push(`step ${k + 1}: no narration`);
    if (s.phase && !P.has(s.phase)) issues.push(`step ${k + 1}: phase "${s.phase}" is not in the manifest`);
    if (!s.phase && typeof s.at !== "number") issues.push(`step ${k + 1}: needs a phase (or at)`);
    (s.focus || []).forEach((f) => { if (!Q.has(f)) issues.push(`step ${k + 1}: focus "${f}" is not a part in the manifest`); });
    if (s.lens != null && !LZ.has(s.lens)) issues.push(`step ${k + 1}: lens "${s.lens}" is not in the manifest`);
    if (s.win != null && !(Array.isArray(s.win) && s.win.length === 2 && s.win[0] >= 0 && s.win[1] > s.win[0] && s.win[1] <= manifest.duration + 1e-9)) issues.push(`step ${k + 1}: win must be [t0, t1] inside 0–${manifest.duration}`);
    if (opt.maxWords && s.say && s.say.split(/\s+/).length > opt.maxWords) issues.push(`step ${k + 1}: narration too long`);
  });
  return issues;
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const [dir, topicId, course] = process.argv.slice(2); const rd = (f) => readFileSync(join(dir, f), "utf8");
  const plan = JSON.parse(rd("plan.json")), lesson = JSON.parse(rd("lesson.json"));
  if (!existsSync(join(dir, "shows.json"))) { console.error("missing " + join(dir, "shows.json")); process.exit(1); }
  const shows = JSON.parse(rd("shows.json"));
  const ctx = vm.createContext({ Math, Number, Array, Object, String, JSON, isFinite, Float32Array, Float64Array, Infinity, NaN, console: { log() {} } });
  new vm.Script(rd("model.js") + "\n;globalThis.__M = createModel();").runInContext(ctx, { timeout: 5000 }); const M = ctx.__M;
  const N = M.N || 600, T = M.T, S = []; for (let i = 0; i < N; i++) S.push(M.sample(i * T / N));
  const phases = []; for (let i = 0; i < N; i++) { const ph = S[i].phase; const last = phases[phases.length - 1]; if (!last || last.name !== ph) phases.push({ name: ph, from: +(i * T / N).toFixed(3), to: +((i + 1) * T / N).toFixed(3) }); else last.to = +((i + 1) * T / N).toFixed(3); }
  const ro = (M.readouts || []).map((r) => { let lo = Infinity, hi = -Infinity; S.forEach((s) => { const v = s.readouts[r.key]; if (isFinite(v)) { lo = Math.min(lo, v); hi = Math.max(hi, v); } }); return { key: r.key, label: r.label, unit: r.unit || "", range: [+lo.toPrecision(4), +hi.toPrecision(4)] }; });
  const issues = [];
  const uniq = []; phases.forEach((p) => { const u = uniq.find((q) => q.name === p.name); if (u) u.windows.push([p.from, p.to]); else uniq.push({ name: p.name, windows: [[p.from, p.to]] }); });
  const man = {
    schema: "medbank-plate-manifest/1", id: topicId || plan.id || dir.split("/").pop(), course: course || "physiology",
    title: [plan.title, plan.titleEm].filter(Boolean).join(" "), sub: plan.sub, kind: plan.kind || M.kind || "cycle",
    timeUnit: M.timeUnit || plan.timeUnit || "s", duration: T, conditions: shows.conditions || [],
    phases: uniq.map((p) => ({ ...p, shows: (shows.phases || {})[p.name] || (issues.push(`phase "${p.name}" has no 'shows'`), "") })),
    parts: (M.parts || []).map((p) => ({ id: p.id, name: p.name, shows: (shows.parts || {})[p.id] || (issues.push(`part "${p.id}" has no 'shows'`), "") })),
    readouts: ro.map((r) => ({ ...r, shows: (shows.readouts || {})[r.key] || (issues.push(`readout "${r.key}" has no 'shows'`), "") })),
    concepts: shows.concepts || [], not_shown: shows.not_shown || [],
    // lenses: magnified, model-driven second views the tutor can open at a step (see lenses[].shows); a step may name at most one
    lenses: Object.entries(shows.lenses || {}).map(([id, l]) => ({ id, title: l.title, kicker: l.kicker || "", shows: l.shows, phases: l.phases || [], parts: l.parts || [], concepts: l.concepts || [] })),
    tutor: {
      rule: "The student's note drives the tutor. Explain only what the note says, in the note's terms, order and depth. Never teach concepts of this topic that are not in the note.",
      use: "Pick only the phases and parts the note covers; parts the note does not mention stay dimmed and silent. Note content this plate cannot show is explained in words (no phase/focus) and listed in 'extend'.",
      lenses: "A step may open one lens (lens: lenses[].id) only when the note covers what that lens shows (match its concepts and shows against the note); skip every lens the note does not cover. When a lens is open, the narration should talk about what the lens shows.",
      step: { title: "short heading", phase: "one of phases[].name", focus: "array of parts[].id", lens: "optional: one of lenses[].id", win: "optional: [t0, t1] model-time window to loop (default: the phase, padded)", speed: "playback speed (see the default lesson)", say: "2–4 sentences, written for the ear, in the note's own terms" },
      output: { steps: "[step]", extend: "[note concepts this plate cannot show]" },
      fallbackLesson: "lesson.json (recorded voice, used only when there is no note)",
    },
  };
  if (!man.concepts.length) issues.push("shows.json: 'concepts' is empty");
  const PH = new Set(man.phases.map((p) => p.name)), PT = new Set(man.parts.map((p) => p.id));
  man.lenses.forEach((l) => { if (!l.title || !l.shows) issues.push(`lens "${l.id}": needs a title and 'shows'`); if (!l.phases.length || !l.parts.length) issues.push(`lens "${l.id}": needs linked phases and parts`);
    l.phases.forEach((p) => { if (!PH.has(p)) issues.push(`lens "${l.id}": phase "${p}" is not a model phase`); }); l.parts.forEach((p) => { if (!PT.has(p)) issues.push(`lens "${l.id}": part "${p}" is not a model part`); }); });
  validateLesson(lesson, man).forEach((x) => issues.push("default lesson: " + x));
  writeFileSync(join(dir, "manifest.json"), JSON.stringify(man, null, 1));
  console.log("MANIFEST ISSUES:", issues.length ? issues : "none"); console.log(`manifest: ${man.phases.length} phases, ${man.parts.length} parts, ${man.readouts.length} readouts, ${man.lenses.length} lenses`);
  if (issues.length) process.exitCode = 1;
}
