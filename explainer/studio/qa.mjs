/* Explainer Studio checks. Nothing reaches a student unless the model runs, its numbers are real-world sized,
 * and the page renders with a detailed, moving, readable drawing. Every failure becomes a sentence the AI can fix. */
import vm from "node:vm";

export function checkModel(code, plan) {
  const issues = [], info = {};
  let M;
  try {
    const ctx = vm.createContext({ Math, Number, Array, Object, String, JSON, isFinite, Float32Array, Float64Array, Infinity, NaN, console: { log() {} } });
    new vm.Script(code + "\n;globalThis.__M = createModel();", { timeout: 3000 }).runInContext(ctx, { timeout: 3000 });
    M = ctx.__M;
  } catch (e) { return { issues: ["createModel() threw or timed out: " + e.message], info }; }
  if (!M || typeof M.sample !== "function") return { issues: ["createModel() must return an object with sample(t)"], info };
  if (!(M.T > 0)) issues.push("T must be a positive duration");
  const N = M.N || 600, S = [];
  try { for (let i = 0; i < N; i++) S.push(M.sample(i * M.T / N)); } catch (e) { return { issues: ["sample(t) threw: " + e.message], info }; }
  const keys = (M.readouts || []).map((r) => r.key);
  if (!keys.length) issues.push("readouts is empty");
  keys.forEach((k) => { const bad = S.findIndex((s) => !s || !s.readouts || typeof s.readouts[k] !== "number" || !isFinite(s.readouts[k])); if (bad >= 0) issues.push(`readout "${k}" is missing or not a finite number at sample ${bad}`); });
  (M.chart || []).forEach((ln) => (ln.series || []).forEach((sr) => { if (!keys.includes(sr.key)) issues.push(`chart series "${sr.key}" is not a readout key`); }));
  const parts = (M.parts || []).map((p) => p.id);
  (plan.parts || []).forEach((p) => { if (!parts.includes(p.id)) issues.push(`part "${p.id}" from the plan is missing from parts`); });
  parts.forEach((id) => { if (!S.every((s) => s.parts && s.parts[id])) issues.push(`sample().parts.${id} is missing on some samples`); });
  const phases = [...new Set(S.map((s) => s.phase))]; info.phases = phases;
  if (plan.kind === "cycle" && phases.length < 2) issues.push("a cycle must pass through at least 2 phases");
  (plan.phases || []).forEach((p) => { if (!phases.includes(p)) issues.push(`phase "${p}" never occurs`); });
  // real-world magnitudes
  (plan.quantities || []).forEach((q) => {
    if (!keys.includes(q.key) || !Array.isArray(q.typical)) return;
    const vals = S.map((s) => s.readouts[q.key]).filter((v) => typeof v === "number" && isFinite(v)); if (!vals.length) return;
    const lo = Math.min(...vals), hi = Math.max(...vals), tl = Math.min(...q.typical), th = Math.max(...q.typical), span = Math.max(Math.abs(th - tl), Math.abs(th) * 0.2, 1e-9);
    if (hi > th + span * 0.5 || lo < tl - span * 0.5) issues.push(`${q.label} (${q.key}) runs ${lo.toFixed(2)}–${hi.toFixed(2)} ${q.unit}, but the real range is ${tl}–${th} ${q.unit}`);
  });
  // something must actually change
  const moving = keys.filter((k) => { const v = S.map((s) => s.readouts[k]); return Math.max(...v) - Math.min(...v) > 1e-6; });
  if (keys.length && !moving.length) issues.push("no readout changes over the run — the model is static");
  // a real model, not a timetable
  const cyc = plan.kind === "cycle";
  let flips = 0; for (let i = 1; i < N; i++) if (S[i].phase !== S[i - 1].phase) flips++;
  const nPh = Math.max(phases.length, (plan.phases || []).length, 1);
  if (!cyc && flips > nPh) issues.push(`the phase changes ${flips} times over the run, but a ${plan.kind || "run"} must pass through each of its ${nPh} phases once, in order — compute the phase from the state (where the parcel is), not from a repeating clock`);
  if (cyc && flips > 2 * nPh + 2) issues.push(`the phase flips ${flips} times in one cycle — it should pass through each phase about once`);
  if (!cyc && /\bt\s*%\s*[\d(]/.test(code)) issues.push("the model uses a repeating clock (t % …) to schedule what happens — derive phases and activity from the state and the laws instead");
  if (!cyc && /Math\.(sin|cos)\(\s*t\s*[\/*)]/.test(code)) issues.push("the model adds a sin(t)/cos(t) wobble — nothing should move unless a law makes it move");
  const rel = (k) => { const v = S.map((s) => s.readouts[k]).filter((x) => typeof x === "number" && isFinite(x)); if (!v.length) return 0; const lo = Math.min(...v), hi = Math.max(...v); return (hi - lo) / Math.max(Math.abs(hi), Math.abs(lo), 1e-9); };
  const live = keys.filter((k) => rel(k) > 0.05), flat = keys.filter((k) => rel(k) <= 0.05);
  if (keys.length >= 3 && live.length < Math.ceil(keys.length / 2)) issues.push(`most readouts are flat over the run (${flat.join(", ")}) — choose the frame where the numbers change (e.g. follow one parcel of fluid) and compute them from the laws`);
  if (plan.kind === "journey") { const bad = S.findIndex((s) => !s.parcel || !parts.includes(s.parcel.part) || !(s.parcel.u >= 0 && s.parcel.u <= 1));
    if (bad >= 0) issues.push(`a journey must return parcel: { part: <a part id>, u: 0..1 } on every sample (missing or invalid at sample ${bad})`);
    else { let back = 0; for (let i = 1; i < N; i++) { const a = S[i - 1].parcel, b = S[i].parcel; if (a.part === b.part && b.u < a.u - 1e-6) back++; } if (back > 2) issues.push("the parcel moves backwards along a part — u must only increase within a part"); } }
  try { const e = M.explain && M.explain(S[Math.floor(N / 3)], M.T / 3); if (M.explain && (typeof e !== "string" || e.length < 20)) issues.push("explain(s) must return a sentence"); } catch (e) { issues.push("explain(s) threw: " + e.message); }
  info.parts = (M.parts || []).map((p) => ({ id: p.id, name: p.name, fields: Object.keys((S[0].parts || {})[p.id] || {}) }));
  info.readouts = (M.readouts || []).map((r) => ({ key: r.key, label: r.label, unit: r.unit, range: [Math.min(...S.map((s) => s.readouts[r.key])), Math.max(...S.map((s) => s.readouts[r.key]))].map((v) => +(+v).toPrecision(3)) }));
  info.T = M.T; info.timeUnit = M.timeUnit;
  return { issues, info };
}

/* render the page headless and judge the drawing */
export async function checkPage(html, { chromium, shots } = {}) {
  if (!chromium) return { issues: [], skipped: "no headless browser available" };
  const browser = await launchBrowser(chromium); const issues = []; const report = {};
  try {
    const p = await browser.newPage({ viewport: { width: 1300, height: 900 } });
    const errs = []; p.on("pageerror", (e) => errs.push(e.message));
    await p.setContent(html, { waitUntil: "load" }); await p.waitForTimeout(2500);
    const st = await p.evaluate(() => { const W = window.__studio || {}; const svg = document.getElementById("stage");
      const els = svg ? svg.querySelectorAll("path,circle,ellipse,rect,polygon,line,text").length : 0;
      const texts = svg ? [...svg.querySelectorAll("text")].map((t) => { const b = t.getBBox(); return { t: t.textContent.slice(0, 30), x: b.x, y: b.y, w: b.width, h: b.height }; }) : [];
      let overlaps = []; for (let i = 0; i < texts.length; i++) for (let j = i + 1; j < texts.length; j++) { const a = texts[i], b = texts[j]; const ox = Math.min(a.x + a.w, b.x + b.w) - Math.max(a.x, b.x), oy = Math.min(a.y + a.h, b.y + b.h) - Math.max(a.y, b.y); if (ox > 3 && oy > 3) overlaps.push(a.t + " / " + b.t); }
      let outside = 0; if (svg) svg.querySelectorAll("path,circle,ellipse,rect,polygon").forEach((e) => { try { const b = e.getBBox(); if (b.x < -10 || b.y < -10 || b.x + b.width > 770 || b.y + b.height > 650) outside++; } catch (_) {} });
      let box = null; const PP = (window.K && K.parts && K.parts()) || {}; for (const id in PP) PP[id].forEach((e) => { try { const b = e.getBBox(); if (!b.width && !b.height) return; box = box ? { x0: Math.min(box.x0, b.x), y0: Math.min(box.y0, b.y), x1: Math.max(box.x1, b.x + b.width), y1: Math.max(box.y1, b.y + b.height) } : { x0: b.x, y0: b.y, x1: b.x + b.width, y1: b.y + b.height }; } catch (_) {} });
      const cover = box ? Math.max(0, Math.min(box.x1, 760) - Math.max(box.x0, 0)) * Math.max(0, Math.min(box.y1, 640) - Math.max(box.y0, 0)) / (760 * 640) : 0;
      return { tracer: !!W.tracer, parcelParts: W.parcelParts || [], paths: W.paths || [], cover: Math.round(cover * 100) / 100, ready: !!W.ready, errors: W.errors || [], frames: W.frames || 0, registered: W.registered || [], parts: (W.model || {}).parts || [], els, overlaps: overlaps.slice(0, 8), outside }; });
    const a = await p.locator("#stage").screenshot(); await p.waitForTimeout(900); const b = await p.locator("#stage").screenshot();
    if (shots) { await p.screenshot({ path: shots + ".png", fullPage: true }); }
    report.state = st;
    if (!st.ready) issues.push("the page did not finish starting: " + (st.errors[0] || errs[0] || "unknown error"));
    st.errors.concat(errs).slice(0, 5).forEach((e) => issues.push("runtime error: " + e));
    if (st.els < 120) issues.push(`the drawing has only ${st.els} SVG elements — it is too sparse; add the real sub-structures (walls, lumens, small parts, context organs)`);
    const missing = st.parts.filter((id) => !st.registered.includes(id)); if (missing.length) issues.push("these model parts are not drawn/registered with K.part: " + missing.join(", "));
    if (st.overlaps.length) issues.push("labels overlap each other: " + st.overlaps.join("; ") + " — move them apart");
    if (st.outside > 3) issues.push(`${st.outside} shapes fall outside the 760×640 canvas`);
    if (st.parcelParts.length) { const miss = st.parcelParts.filter((p) => !st.paths.includes(p)); if (!st.tracer || miss.length) issues.push(`this is a journey: createScene must return paths: { <part id>: <the same centreline points you drew that part with> } for every part the parcel visits (missing: ${(miss.length ? miss : st.parcelParts).join(", ")}) — the runtime then moves the parcel along them`); }
    if (st.cover < 0.4) issues.push(`the drawn parts only cover ${Math.round(st.cover * 100)}% of the canvas — the structure is too small; enlarge/unfold it so its parts span at least half of 760×640`);
    if (Buffer.compare(a, b) === 0) issues.push("nothing moves between frames — drive the drawing from s in update()");
  } catch (e) { issues.push("page check failed: " + e.message); }
  await browser.close();
  return { issues, report };
}

/* the bundled Chromium if installed, else the Edge or Chrome already on the machine (no 150 MB download needed) */
export async function launchBrowser(chromium) {
  const tries = [{}, { channel: "msedge" }, { channel: "chrome" }]; let err;
  for (const o of tries) { try { return await chromium.launch(o); } catch (e) { err = e; } }
  throw err;
}

/* cheap pre-browser check: does the code even parse, and does it define the function it must? */
export function checkSyntax(code, fn) {
  try { new vm.Script(code + "\n;typeof " + fn + ";"); } catch (e) { return [`the code does not parse (${e.message}) — it was probably too long and got cut off. Rewrite it COMPACTLY: generate repeated structures with loops, at most ~25 points per path, under ~350 lines.`]; }
  if (!new RegExp("function\\s+" + fn + "\\s*\\(").test(code)) return [`the code must define function ${fn}(…)`];
  return [];
}

/* the scene must show the model, not invent its own story */
export function checkSceneCode(code) {
  const issues = [];
  if (/\bi\s*%\s*\d/.test(code) || /Math\.floor\(\s*i\s*\//.test(code)) issues.push("update() invents its own timing from the frame index (i % …) — read s.phase, s.parcel and s.readouts instead; the model already says where everything is");
  if (/s\.phases\b/.test(code)) issues.push("s.phases does not exist — use s.phase (a string)");
  if (/K\.tracer\(/.test(code)) issues.push("do not call K.tracer yourself — return paths: { partId: pts } from createScene and the runtime draws the parcel");
  return issues;
}
