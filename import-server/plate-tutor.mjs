/* 3D Tutor · library plates: write the tutor FROM THE STUDENT'S NOTE onto a plate's manifest.json.
 *
 * The plate is the stage, the note is the script. DeepSeek (Flash) maps the note's lines onto the plate's phases and
 * parts, in the note's order, terms and depth, and never teaches concepts of the topic the note does not contain.
 * Everything it returns is checked here before a student sees it (ids exist, numbers come from the cited note
 * lines, no un-noted concepts, note order kept); bad stops are fed back for one regeneration and then dropped.
 *
 * The same splitNote() runs in the app (explainer/plate-tutor.js): line ids L1…Ln are the contract between the two.
 */
import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

export const PLATE_TUTOR_VERSION = "p2";   // p2: + 2-minute overview and exam-revision questions
const HERE = dirname(fileURLToPath(import.meta.url));

/* ---------- the note, as numbered lines (keep identical to splitNote in explainer/plate-tutor.js) ---------- */
export function splitNote(md) {
  const out = []; let n = 0;
  const push = (text, h) => { text = text.replace(/\*\*|__|`/g, "").replace(/\s+/g, " ").trim(); if (text.length > 1) out.push({ id: "L" + (++n), h: !!h, text }); };
  for (const raw of String(md || "").replace(/\r/g, "").split("\n")) {
    const s = raw.trim(); if (!s || /^#\s/.test(s) || /^[-*_]{3,}$/.test(s)) continue;          // the title (# …) and rules are not lines
    if (/^#{2,6}\s/.test(s)) { push(s.replace(/^#+\s*/, ""), true); continue; }
    const body = s.replace(/^([-*+•]|\d+[.)])\s+/, "");
    if (body.length <= 260) { push(body); continue; }
    let buf = ""; for (const sen of body.split(/(?<=[.!?])\s+(?=[A-Z(])/)) { if (buf && (buf + " " + sen).length > 240) { push(buf); buf = sen; } else buf = buf ? buf + " " + sen : sen; } push(buf);
    if (n >= 400) break;
  }
  return out;
}

/* ---------- manifests: from this repo when deployed with it, else from the public site ---------- */
const MCACHE = new Map();
export async function loadManifest(plate, { base = process.env.PLATE_BASE || "https://medbank.com.ng/", course } = {}) {
  if (!/^[a-z0-9-]{3,80}$/.test(plate)) throw new Error("bad plate id");
  if (MCACHE.has(plate)) return MCACHE.get(plate);
  const courses = course ? [course] : ["physiology", "biochemistry", "anatomy", "pharmacology"];
  let m = null;
  for (const c of courses) { try { m = JSON.parse(readFileSync(join(HERE, "..", "explainer", "library", c, plate, "manifest.json"), "utf8")); break; } catch (_) {} }
  for (const c of courses) { if (m) break; try { const r = await fetch(new URL(`explainer/library/${c}/${plate}/manifest.json`, base)); if (r.ok) m = await r.json(); } catch (_) {} }
  if (!m || m.id !== plate) throw new Error("plate manifest not found: " + plate);
  MCACHE.set(plate, m); return m;
}

export function plateTutorKey(plate, lines) {
  const body = lines.map((l) => (l.h ? "#" : "") + l.text.toLowerCase()).join("\n");
  return createHash("md5").update(["plate", PLATE_TUTOR_VERSION, plate, body].join("|")).digest("hex");
}

/* ---------- the prompt ---------- */
export function buildPlateTutorPrompt(M, lines, errors) {
  const ph = M.phases.map((p) => `- "${p.name}": ${p.shows}`).join("\n");
  const pa = M.parts.map((p) => `- ${p.id} = ${p.name}: ${p.shows}`).join("\n");
  const rd = M.readouts.map((r) => `- ${r.label} (${r.unit})`).join("\n");
  const lz = (M.lenses || []).map((l) => `- ${l.id} = ${l.title} (phases: ${(l.phases || []).join(", ")}): ${l.shows}`).join("\n");
  const note = lines.map((l) => `${l.id}${l.h ? " [heading]" : ""}: ${l.text}`).join("\n");
  return `You are the voice of an animated physiology plate in MedBank, a study app for Nigerian medical students.
The PLATE is a stage that can show these things. The STUDENT'S NOTE is the script. Your job: walk the student through THEIR NOTE using the plate.

PLATE: ${M.title}
Fixed conditions: ${(M.conditions || []).join("; ")}
Phases (stage positions):
${ph}
Parts (ids you can spotlight):
${pa}
Live numbers on screen:
${rd}
${lz ? `Lenses (close-ups a stop may open):\n${lz}\n` : ""}Things this plate cannot show: ${(M.not_shown || []).join("; ")}

STUDENT'S NOTE (numbered lines):
${note}

RULES (all are checked by a program; breaking one gets the stop thrown away):
1. Teach ONLY what the note says, in the note's own terms, order and depth. Never add facts, mechanisms, transporters, numbers or concepts the note does not state, even if the plate shows them. If the note is brief, be brief.
2. Go through the note IN ORDER. Each stop cites the note lines it explains ("lines"), and stops follow the order of those lines.
3. A stop that the plate can show gets "phase" (exactly one phase name from the list) and "focus" (1–4 part ids from the list). Choose the phase and parts that show what THOSE lines say.
4. Note lines the plate cannot show (e.g. ${(M.not_shown || []).slice(0, 2).join(", ") || "things outside the plate"}) become a "words" stop: no phase or focus, explained in words only. Put the concept in "extend" too.
5. "say": 2–4 short sentences for the ear (TTS), plain English, about 25–70 words. Numbers ONLY if they appear in the cited lines, written as digits ("about 1200 milliosmoles per kilogram", "65 percent"). No symbols like → ≈ ~ / + −, no markdown, no "your note says".
6. "mentions": for every part id, the note lines that talk about it (even lines with no stop of their own). Parts the note never mentions are left out — the app dims them.
7. "flags": ONLY when a number in the note clearly disagrees with a number in the plate descriptions above (same quantity). Give the line, the note's figure, the plate's figure, and one gentle spoken sentence, e.g. "Your note gives about 1000 here; the plate, from Guyton, shows about 1200 — worth checking with your lecturer." Never flag rounding, ranges that include the plate value, or things the plate does not state. Usually there are none.
8. Skip lines that are only headings, references or admin. Do not invent lines.
9. A stop may add "lens" (one lens id) ONLY when the cited lines are about what that lens shows, and its phase is one of the lens's phases. While a lens is open, still say only what the note says.
10. "overview" is the 2-minute version: pick the 3–6 stops that carry the note's main idea (by their number in "steps", 1 = first) and give each ONE short spoken sentence (8–30 words) from that stop's lines. Keep them in order.
11. "exam" is exam revision: pick the 3–6 most examinable stops and write one multiple-choice question for each, answerable ONLY from that stop's lines: "q" (one sentence), exactly 3 "options" (short, one clearly right, two plausible wrong ones built from other facts in the note), "answer" (0, 1 or 2) and "why" (one sentence from the note). No trick questions, no facts outside the note.

Return ONLY this JSON:
{"steps":[{"title":"2–4 words","lines":["L2","L3"],"phase":"<phase name>","focus":["<part id>"],"lens":"<optional lens id>","speed":0.1–1,"say":"…"},
          {"title":"…","lines":["L5"],"words":true,"say":"…"}],
 "mentions":{"<part id>":["L2"]},
 "flags":[{"line":"L13","noteSays":"1000","plateSays":"1200","say":"…"}],
 "extend":["concept in the note this plate cannot show"],
 "overview":[{"stop":1,"say":"one sentence"}],
 "exam":[{"stop":4,"q":"…?","options":["…","…","…"],"answer":1,"why":"…"}]}${errors && errors.length ? `

YOUR LAST ANSWER WAS REJECTED. Fix exactly these problems and keep everything else:
- ${errors.slice(0, 14).join("\n- ")}` : ""}`;
}

/* ---------- checks ---------- */
const STOP = new Set("about above after again against all also and another any are around because been before being below between both but by can cannot does doing down during each even every few first for from further gets have having here into its itself just keeps less like made makes many more most much must near next not now only other our out over same should since some such than that their them then there these they this those through thus under until very what when called means which leave leaves minus equals plus roughly where which while with within without would your you".split(" "));
/* how a note's shorthand is said aloud, so "mOsm/kg" grounds "milliosmoles per kilogram" */
const SPOKEN = [[/mOsm\/kg|mOsm/gi, " milliosmoles per kilogram "], [/mmHg/gi, " millimetres of mercury "], [/mL\/min/gi, " millilitres a minute "], [/\bmL\b/gi, " millilitres "],
  [/L\/day/gi, " litres a day "], [/\bL\b/g, " litres "], [/%/g, " percent "], [/[~≈]/g, " about "], [/>/g, " more than "], [/</g, " less than "], [/→/g, " so "], [/\s[−–-]\s/g, " minus "], [/=/g, " equals "], [/\+\s/g, " plus "],
  [/\bNa\+/g, " sodium "], [/\bK\+/g, " potassium "], [/\bCl[−-]/g, " chloride "], [/\bHCO3[−-]?/gi, " bicarbonate "], [/\bADH\b/g, " ADH antidiuretic "], [/\bGFR\b/g, " GFR glomerular filtration rate "]];
export const spoken = (s) => SPOKEN.reduce((t, [re, w]) => t.replace(re, w), String(s || ""));
const stem = (w) => w.toLowerCase().replace(/[^a-z0-9]/g, "").replace(/(ies)$/, "y").replace(/(ing|ed|es|s)$/, "");
const words = (s) => spoken(s).toLowerCase().replace(/meters?\b/g, (m) => m.replace("meter", "metre")).replace(/liters?\b/g, (m) => m.replace("liter", "litre")).split(/[^a-z0-9+]+/).filter((w) => w.length >= 5 && !STOP.has(w)).map(stem);
/* standalone numbers only (not the 2 in NKCC2 or the 1 in AQP1) */
const nums = (s) => (String(s || "").replace(/(\d),(\d{3})/g, "$1$2").match(/(?<![A-Za-z\d.])\d+(?:\.\d+)?/g) || []).map(Number);
const numSet = (s) => new Set(nums(s));

export function checkPlateTutor(text, M, lines) {
  let j; try { const t = String(text || "").trim().replace(/^```(json)?|```$/g, ""); j = JSON.parse(t.slice(t.indexOf("{"), t.lastIndexOf("}") + 1)); } catch (_) { return { errors: ["the answer was not valid JSON"] }; }
  const L = new Map(lines.map((l, i) => [l.id, { ...l, i }])), phases = new Map(M.phases.map((p) => [p.name, p])), parts = new Map(M.parts.map((p) => [p.id, p]));
  const noteText = lines.map((l) => l.text).join("\n"), noteWords = new Set(words(noteText));
  const plateText = [...M.phases.map((p) => p.shows), ...M.parts.map((p) => p.shows), ...(M.conditions || [])].join(" ");
  const errors = [], steps = [], seen = new Set();
  const flags = [];
  for (const f of Array.isArray(j.flags) ? j.flags : []) {
    const ln = L.get(f && f.line), ns = Number(String(f && f.noteSays).replace(/[^\d.]/g, "")), ps = Number(String(f && f.plateSays).replace(/[^\d.]/g, ""));
    if (!ln) { errors.push(`flag cites unknown line ${f && f.line}`); continue; }
    if (!numSet(ln.text).has(ns)) { errors.push(`flag on ${ln.id}: ${f.noteSays} is not a number in that line`); continue; }
    if (!numSet(plateText).has(ps)) { errors.push(`flag on ${ln.id}: ${f.plateSays} is not a number the plate states`); continue; }
    if (ns === ps || Math.abs(ns - ps) / Math.max(ns, ps) < 0.08) { errors.push(`flag on ${ln.id}: ${ns} vs ${ps} is not a real disagreement`); continue; }
    const say = String(f.say || "").trim(); const bad = nums(say).filter((x) => x !== ns && x !== ps);
    if (!say || say.split(/\s+/).length > 40 || bad.length) { errors.push(`flag on ${ln.id}: its sentence must be short and use only ${ns} and ${ps}`); continue; }
    flags.push({ line: ln.id, noteSays: String(ns), plateSays: String(ps), say });
  }
  const flagNums = new Map(flags.map((f) => [f.line, Number(f.plateSays)]));
  const conceptTerms = [...(M.concepts || []), ...(M.not_shown || [])];
  // a lens may open only when the note covers what it shows: at least half its concepts, each mostly in the note's words
  const n6 = new Set(spoken(noteText).toLowerCase().split(/[^a-z0-9]+/).filter((w) => w.length >= 2).map((w) => w.slice(0, 6)));
  const covers = (c) => { const ws = spoken(c).toLowerCase().split(/[^a-z0-9]+/).filter((w) => w.length >= 2 && !STOP.has(w) && !["and", "of", "the", "via", "as", "to"].includes(w)).map((w) => w.slice(0, 6)); return ws.length && ws.filter((w) => n6.has(w)).length / ws.length >= 0.66; };
  const lensOK = new Map((M.lenses || []).map((l) => [l.id, { l, ok: (l.concepts || []).filter(covers).length >= Math.max(1, Math.ceil((l.concepts || []).length / 2)) }]));
  /* the same rules for every spoken or shown sentence: numbers from the cited lines, no drift, no un-noted concepts */
  function sayErrors(tag, text, ids, { focus = [], phase = "", extraNums = [], min = 12, max = 95 } = {}) {
    const errs = [], say = String(text || "").replace(/\s+/g, " ").trim(), wc = say ? say.split(" ").length : 0;
    if (wc < min || wc > max) errs.push(`${tag}: must be ${min}–${max} words (it has ${wc})`);
    if (/[→≈~∼≥≤]|\*\*/.test(say)) errs.push(`${tag}: has symbols or markdown; write it for the ear`);
    const okN = new Set([...ids.flatMap((x) => nums(L.get(x).text)), ...extraNums]); ids.forEach((x) => flagNums.has(x) && okN.add(flagNums.get(x)));
    const strayN = nums(say).filter((x) => !okN.has(x) && x > 4);
    if (strayN.length) errs.push(`${tag} says ${strayN.join(", ")}, which is not in lines ${ids.join(", ")}`);
    const ground = new Set([...ids.flatMap((x) => words(L.get(x).text)), ...focus.flatMap((p) => words(parts.get(p).name)), ...words(phase)]);
    const sw = words(say), off = sw.filter((w) => !ground.has(w) && !noteWords.has(w));
    if (sw.length >= 6 && off.length / sw.length > 0.45) errs.push(`${tag} drifts from the note (${off.slice(0, 5).join(", ")} are not in it)`);
    for (const c of conceptTerms) { const cw = words(c).filter((w) => w.length >= 6); if (cw.length && cw.every((w) => sw.includes(w)) && !cw.every((w) => noteWords.has(w))) errs.push(`${tag} teaches "${c}", which is not in the note`); }
    return errs; }
  const kept = new Map();   // the model's stop number (1-based) → index in steps[] after checks
  let lastFirst = -1;
  (Array.isArray(j.steps) ? j.steps : []).slice(0, 16).forEach((s, k) => {
    const tag = `stop ${k + 1}${s && s.title ? ` ("${String(s.title).slice(0, 30)}")` : ""}`, errs = [];
    const ids = (Array.isArray(s && s.lines) ? s.lines : []).filter((x) => L.has(x));
    if (!ids.length) errs.push(`${tag} cites no real note lines`);
    if (ids.some((x) => L.get(x).h) && ids.every((x) => L.get(x).h)) errs.push(`${tag} cites only headings`);
    const isWords = !!s.words || !s.phase;
    if (!isWords && !phases.has(s.phase)) errs.push(`${tag}: "${s.phase}" is not a phase name`);
    const focus = (Array.isArray(s.focus) ? s.focus : []).filter((x) => parts.has(x));
    if (!isWords && !focus.length) errs.push(`${tag} needs 1–4 focus part ids from the list`);
    const say = String(s.say || "").replace(/\s+/g, " ").trim();
    errs.push(...sayErrors(tag, say, ids, { focus, phase: s.phase || "" }));
    let lens = null;
    if (s.lens && !isWords) { const z = lensOK.get(s.lens);
      if (!z) errs.push(`${tag}: "${s.lens}" is not a lens id`);
      else if (!z.ok) errs.push(`${tag}: lens "${s.lens}" shows more than this note covers; leave it out`);
      else if ((z.l.phases || []).length && !z.l.phases.includes(s.phase)) errs.push(`${tag}: lens "${s.lens}" belongs to ${z.l.phases.join(" / ")}, not "${s.phase}"`);
      else lens = s.lens; }
    const win = Array.isArray(s.win) && s.win.length === 2 && s.win.every((x) => typeof x === "number" && x >= 0 && x <= (M.duration || Infinity)) && s.win[0] < s.win[1] ? s.win : null;
    const first = ids.length ? Math.min(...ids.map((x) => L.get(x).i)) : -1;
    if (first >= 0 && first < lastFirst) errs.push(`${tag} goes back to ${L.get(ids[0]).id}: keep the note's order`);
    if (errs.length) { errors.push(...errs); return; }
    lastFirst = Math.max(lastFirst, first); ids.forEach((x) => seen.add(x)); kept.set(k + 1, steps.length);
    steps.push(isWords ? { title: String(s.title || "").slice(0, 40), lines: ids, words: true, say }
      : { title: String(s.title || "").slice(0, 40), lines: ids, phase: s.phase, focus: focus.slice(0, 4), ...(lens ? { lens } : {}), ...(win ? { win } : {}), speed: Math.max(0.1, Math.min(2.5, Number(s.speed) || 0.5)), say });
  });
  if (!steps.length) errors.push("no usable stops");
  const mentions = {};
  for (const [id, v] of Object.entries(j.mentions && typeof j.mentions === "object" ? j.mentions : {})) { if (!parts.has(id)) continue; const ids = (Array.isArray(v) ? v : []).filter((x) => L.has(x)); if (ids.length) mentions[id] = [...new Set(ids)]; }
  steps.forEach((s) => (s.focus || []).forEach((p) => { mentions[p] = [...new Set([...(mentions[p] || []), ...s.lines])]; }));
  const extend = (Array.isArray(j.extend) ? j.extend : []).map((x) => String(x).slice(0, 90)).filter(Boolean).slice(0, 8);
  // 2-minute overview: 3–6 key stops, one sentence each, in order
  const overview = []; let lastO = -1;
  (Array.isArray(j.overview) ? j.overview : []).slice(0, 8).forEach((o, n) => { const k = kept.get(Number(o && o.stop)), tag = `overview ${n + 1}`;
    if (k == null) { errors.push(`${tag}: stop ${o && o.stop} is not a kept stop`); return; } if (k <= lastO) { errors.push(`${tag}: keep the overview in order`); return; }
    const st = steps[k], e = sayErrors(tag, o.say, st.lines, { focus: st.focus || [], phase: st.phase || "", min: 6, max: 34 });
    if (e.length) { errors.push(...e); return; } lastO = k; overview.push({ stop: k, say: String(o.say).replace(/\s+/g, " ").trim() }); });
  if (overview.length && overview.length < 3) errors.push("overview needs 3–6 stops");
  // exam revision: one 3-option question per high-yield stop, answerable from that stop's lines
  const allNums = nums(noteText), exam = [];
  (Array.isArray(j.exam) ? j.exam : []).slice(0, 8).forEach((x, n) => { const k = kept.get(Number(x && x.stop)), tag = `exam question ${n + 1}`;
    if (k == null) { errors.push(`${tag}: stop ${x && x.stop} is not a kept stop`); return; }
    const st = steps[k], opts = Array.isArray(x.options) ? x.options.map((o) => String(o).replace(/\s+/g, " ").trim()) : [], ans = Number(x.answer);
    const e = [];
    if (opts.length !== 3 || new Set(opts.map((o) => o.toLowerCase())).size !== 3 || opts.some((o) => !o || o.split(" ").length > 16)) e.push(`${tag}: needs exactly 3 different short options`);
    if (![0, 1, 2].includes(ans)) e.push(`${tag}: "answer" must be 0, 1 or 2`);
    e.push(...sayErrors(tag + " (question)", x.q, st.lines, { focus: st.focus || [], phase: st.phase || "", extraNums: allNums, min: 4, max: 34 }));
    if (!e.length) e.push(...sayErrors(tag + " (right answer)", opts[ans], st.lines, { focus: st.focus || [], phase: st.phase || "", min: 1, max: 16 }));
    e.push(...sayErrors(tag + " (why)", x.why, st.lines, { focus: st.focus || [], phase: st.phase || "", min: 4, max: 40 }));
    opts.forEach((o, m) => { if (m !== ans) e.push(...sayErrors(`${tag} (option ${m + 1})`, o, st.lines, { extraNums: allNums, min: 1, max: 16 }).filter((z) => !/drifts|words/.test(z))); });
    if (e.length) { errors.push(...e); return; }
    exam.push({ stop: k, q: String(x.q).trim(), options: opts, answer: ans, why: String(x.why).trim() }); });
  if (exam.length && exam.length < 2) errors.push("exam needs 3–6 questions");
  const lesson = { v: 2, kind: "plate", plate: M.id, version: PLATE_TUTOR_VERSION, lines, steps, mentions, flags: flags.filter((f) => steps.some((s) => s.lines.includes(f.line))), extend,
    overview: overview.length >= 3 ? overview : [], exam: exam.length >= 2 ? exam : [], personal: true };
  return { lesson, errors, dropped: errors.length };
}
