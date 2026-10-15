/* 3D Tutor · quick draft plates for topics the library has no plate for yet.
 *
 * When a premium student imports a topic with no plate, the server:
 *   1. classifyTopic(): Claude Haiku names the topic the note teaches (a slug) and reuses an existing slug when it is the
 *      same topic in other words, so every student with the same or similar material shares one plate.
 *   2. buildTourDraft(): Claude Opus writes a guided-tour plate for it on the shared engine (explainer/tours: README.md is
 *      the contract, the placenta praevia tour the exemplar), at final-year exam depth including management and drugs.
 *   3. checkTourPage() runs the page with every stop clicked; problems go back to Claude once for a fix.
 * The student's own note then drives the plate through the same 3D Tutor as the library plates.
 * Every call's tokens and dollar cost are returned (and stored) so the admin page can show what each plate cost.
 * The full, browser-checked plate is built later by the daily build run and replaces the draft. */
import { readFileSync, existsSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import { checkTourPage } from "./tour-check.mjs";

const HERE = dirname(fileURLToPath(import.meta.url));
const SITE = (process.env.PLATE_BASE || "https://medbank.com.ng/").replace(/\/?$/, "/");
export const DRAFT_MODEL = process.env.TOUR_DRAFT_MODEL || "claude-opus-5-5";
export const CLASSIFY_MODEL = process.env.TOUR_CLASSIFY_MODEL || "claude-haiku-5-5";
export const TOUR_DRAFT_VERSION = "d1";
/* $ per million tokens [input, output] (platform.claude.com/docs/en/about-claude/pricing, Oct 2026). Cache reads are 0.1× input, cache writes 1.25×. */
const PRICE = { "claude-opus-5-5": [4, 20], "claude-sonnet-5-5": [2, 10], "claude-haiku-5-5": [0.1, 0.5] };
export function costOf(model, u) { const p = PRICE[model] || PRICE["claude-opus-5-5"], M = 1e6;
  return ((u.input_tokens || 0) * p[0] + (u.cache_creation_input_tokens || 0) * p[0] * 1.25 + (u.cache_read_input_tokens || 0) * p[0] * 0.1 + (u.output_tokens || 0) * p[1]) / M; }

/* the engine and the exemplar, from this repo when deployed with it, else from the public site */
async function asset(rel) { const local = join(HERE, "..", rel); if (existsSync(local)) return readFileSync(local, "utf8"); const r = await fetch(SITE + rel); if (!r.ok) throw new Error("missing " + rel); return r.text(); }
let _kitMod = null;
async function kit() { if (_kitMod) return _kitMod;
  const local = join(HERE, "..", "explainer/tours/build-tour.mjs");
  const mod = existsSync(local) ? await import(pathToFileURL(local).href) : await import("data:text/javascript;base64," + Buffer.from(await asset("explainer/tours/build-tour.mjs")).toString("base64"));
  const [kitJs, css, contract, exMeta, exPal, exTour] = await Promise.all(["explainer/tours/tour-kit.js", "explainer/tours/tour.css", "explainer/tours/README.md",
    "explainer/library/obstetrics/placenta-praevia/meta.json", "explainer/library/obstetrics/placenta-praevia/palette.css", "explainer/library/obstetrics/placenta-praevia/tour.js"].map(asset));
  return (_kitMod = { ...mod, kitJs, css, contract, ex: { meta: exMeta, palette: exPal, tour: exTour } }); }

/* one Claude call, streamed (long outputs), returning text + usage + cost */
export async function claude(anthropic, { model, system, content, max_tokens = 1000, temperature = 0.3 }) {
  const stream = anthropic.messages.stream({ model, max_tokens, temperature, system, messages: [{ role: "user", content }] });
  const msg = await stream.finalMessage();
  const text = (msg.content || []).filter((b) => b.type === "text").map((b) => b.text).join("");
  const usage = msg.usage || {}; return { text, usage, usd: costOf(model, usage), stop: msg.stop_reason, model };
}

/* 1 · which topic is this? reuse an existing one when it is the same topic */
export async function classifyTopic(anthropic, { title, note, known = [] }) {
  const list = known.slice(0, 300).map((k) => `- ${k.slug}: ${k.title}`).join("\n") || "(none yet)";
  const r = await claude(anthropic, { model: CLASSIFY_MODEL, max_tokens: 300, temperature: 0,
    system: "You name the single medical topic a lecture note teaches, for a shared library of animated teaching plates. Reply with JSON only.",
    content: `NOTE TITLE: ${String(title || "").slice(0, 160)}
NOTE (opening):
${String(note || "").slice(0, 2500)}

TOPICS THE LIBRARY ALREADY HAS (slug: title):
${list}

If the note teaches the same topic as one of these (the same disease, mechanism or procedure, even in other words or as a sub-part of it), return that slug in "reuse". Otherwise invent a short kebab-case slug for the topic as it would be taught (e.g. "placenta-praevia", "acute-kidney-injury-children", "heart-failure").
Return ONLY: {"reuse": "<existing slug or null>", "slug": "<slug>", "title": "<topic title, 2-6 words>", "course": "<one of: physiology, obstetrics, gynaecology, paediatrics, medicine, surgery, pharmacology, anatomy, biochemistry, pathology, microbiology, psychiatry, community-medicine, other>"}` });
  let j = {}; try { const t = r.text; j = JSON.parse(t.slice(t.indexOf("{"), t.lastIndexOf("}") + 1)); } catch (_) {}
  const slugify = (s) => String(s || "").toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 60);
  const reuse = j.reuse && known.some((k) => k.slug === j.reuse) ? j.reuse : null;
  return { slug: reuse || slugify(j.slug || title) || "topic-" + Date.now().toString(36), reused: !!reuse, title: String(j.title || title || "").slice(0, 80), course: slugify(j.course) || "other", usd: r.usd, usage: r.usage };
}

/* 2 · write the plate */
function draftContent(K, { slug, title, course, note }) {
  return [
    { type: "text", text: `THE ENGINE CONTRACT (explainer/tours/README.md):\n\n${K.contract}\n\nTHE EXEMPLAR — the quality bar: a finished tour for placenta praevia.\nmeta.json:\n${K.ex.meta}\n\npalette.css:\n${K.ex.palette}\n\ntour.js:\n${K.ex.tour}`, cache_control: { type: "ephemeral" } },
    { type: "text", text: `BUILD A NEW PLATE
Topic: ${title}
id (use exactly): ${slug}
course: ${course}

A student's lecture note on this topic (it shows what this course teaches; the plate is shared by every student studying the topic, so cover the WHOLE topic as a final-year MBBS exam needs it, not only this note):
"""
${String(note || "").slice(0, 9000)}
"""

Write the plate on the engine, following the contract exactly and matching the exemplar's depth and style:
- 8 to 11 stops in teaching order. For a disease: what it is, why it happens (risk factors, mechanism), how it presents, how it is diagnosed, management (acute, ongoing, definitive), the drugs (real doses, routes, contraindications, where they act), complications and what to watch for. For a mechanism or process: the stages in order, the controls, and what goes wrong clinically.
- A detailed, anatomically faithful stage (the body region or system where it happens) that changes with each stop, at least 6 parts registered with TK.part, cases if patients differ in ways that matter, a timeline (meta.strip) when time matters (gestation, hours of an emergency, days of treatment), and a lens for every stop.
- Notes with lead, sections, dose cards / tables / checklists / ladders where they help, a "What students mix up" box and a check-yourself question on every stop. Name the guidelines you follow in meta.foot (e.g. NICE, WHO, RCOG, BNF, Nelson, Guyton) and give doses as those guidelines do.
- Your own helpers inside tour.js (the exemplar shows the style); no imports, no network. tour.js under 90 KB.

Return exactly three blocks and nothing else:
<<<META>>>
{ meta.json }
<<<PALETTE>>>
palette.css
<<<TOUR>>>
tour.js
<<<END>>>` },
  ];
}
export function parseDraft(text) {
  const t = String(text || ""), grab = (a, b) => { const i = t.indexOf(a); if (i < 0) return null; const j = t.indexOf(b, i + a.length); return t.slice(i + a.length, j < 0 ? undefined : j).replace(/^\s*```[a-z]*\s*|\s*```\s*$/g, "").trim(); };
  let meta = null; try { meta = JSON.parse(grab("<<<META>>>", "<<<PALETTE>>>")); } catch (_) {}
  return { meta, palette: grab("<<<PALETTE>>>", "<<<TOUR>>>") || "", script: grab("<<<TOUR>>>", "<<<END>>>") };
}

/* the whole draft: write → assemble → check → (one fix) → { html, manifest, meta, problems, usd, calls } */
export async function buildTourDraft(anthropic, { slug, title, course, note, log = () => {} }) {
  const K = await kit(), calls = []; let draft = null, html = null, report = null, problems = ["not built"];
  const system = "You are the plate builder for MedBank, a study app for Nigerian medical students. You write complete, working, self-contained guided-tour plates on the MedBank tour engine, accurate to current guidelines and textbooks. You output only the three requested blocks.";
  log("writing the plate");
  let r = await claude(anthropic, { model: DRAFT_MODEL, system, content: draftContent(K, { slug, title, course, note }), max_tokens: 48000, temperature: 0.4 }); calls.push({ step: "write", usd: r.usd, usage: r.usage, stop: r.stop });
  draft = parseDraft(r.text);
  for (let round = 0; round < 2; round++) {
    if (!draft.meta || !draft.script) { problems = ["the answer did not contain the META / TOUR blocks"]; }
    else {
      const meta = { ...draft.meta, id: slug, course: draft.meta.course || course };
      html = K.assembleTour({ meta, script: draft.script, palette: draft.palette, kit: K.kitJs, css: K.css });
      log("checking the plate"); report = checkTourPage(html); problems = K.tourProblems(report); draft.meta = meta;
    }
    if (!problems.length || round === 1) break;
    log("fixing " + problems.length + " problems");
    r = await claude(anthropic, { model: DRAFT_MODEL, system, max_tokens: 48000, temperature: 0.2, content: [draftContent(K, { slug, title, course, note })[0],
      { type: "text", text: `Your plate for "${title}" (id ${slug}) failed these checks when it was run with every stop clicked:\n- ${problems.slice(0, 20).join("\n- ")}\n\nHere is your tour.js:\n${draft.script || "(missing)"}\n\nHere is your meta.json:\n${JSON.stringify(draft.meta || {})}\n\nFix every problem and return all three blocks again, complete:\n<<<META>>>\n…\n<<<PALETTE>>>\n…\n<<<TOUR>>>\n…\n<<<END>>>` }] });
    calls.push({ step: "fix", usd: r.usd, usage: r.usage, stop: r.stop });
    const fixed = parseDraft(r.text); draft = { meta: fixed.meta || draft.meta, palette: fixed.palette || draft.palette, script: fixed.script || draft.script };
  }
  const usd = calls.reduce((a, c) => a + c.usd, 0);
  const manifest = !problems.length && report && report.tour ? K.manifestOf(draft.meta, report.tour) : null;
  return { ok: !problems.length, html: problems.length ? null : html, manifest, meta: draft.meta, problems, usd, calls, version: TOUR_DRAFT_VERSION, model: DRAFT_MODEL };
}
