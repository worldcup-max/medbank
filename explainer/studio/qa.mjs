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
    const lo = Math.min(...vals), hi = Math.max(...vals), [tl, th] = q.typical, span = Math.max(Math.abs(th - tl), Math.abs(th) * 0.2, 1e-9);
    if (hi > th + span * 0.5 || lo < tl - span * 0.5) issues.push(`${q.label} (${q.key}) runs ${lo.toFixed(2)}–${hi.toFixed(2)} ${q.unit}, but the real range is ${tl}–${th} ${q.unit}`);
  });
  // something must actually change
  const moving = keys.filter((k) => { const v = S.map((s) => s.readouts[k]); return Math.max(...v) - Math.min(...v) > 1e-6; });
  if (keys.length && !moving.length) issues.push("no readout changes over the run — the model is static");
  try { const e = M.explain && M.explain(S[Math.floor(N / 3)], M.T / 3); if (M.explain && (typeof e !== "string" || e.length < 20)) issues.push("explain(s) must return a sentence"); } catch (e) { issues.push("explain(s) threw: " + e.message); }
  info.parts = (M.parts || []).map((p) => ({ id: p.id, name: p.name, fields: Object.keys((S[0].parts || {})[p.id] || {}) }));
  info.readouts = (M.readouts || []).map((r) => ({ key: r.key, label: r.label, unit: r.unit, range: [Math.min(...S.map((s) => s.readouts[r.key])), Math.max(...S.map((s) => s.readouts[r.key]))].map((v) => +(+v).toPrecision(3)) }));
  info.T = M.T; info.timeUnit = M.timeUnit;
  return { issues, info };
}

/* render the page headless and judge the drawing */
export async function checkPage(html, { chromium, shots } = {}) {
  if (!chromium) return { issues: [], skipped: "no headless browser available" };
  const browser = await chromium.launch(); const issues = []; const report = {};
  try {
    const p = await browser.newPage({ viewport: { width: 1300, height: 900 } });
    const errs = []; p.on("pageerror", (e) => errs.push(e.message));
    await p.setContent(html, { waitUntil: "load" }); await p.waitForTimeout(2500);
    const st = await p.evaluate(() => { const W = window.__studio || {}; const svg = document.getElementById("stage");
      const els = svg ? svg.querySelectorAll("path,circle,ellipse,rect,polygon,line,text").length : 0;
      const texts = svg ? [...svg.querySelectorAll("text")].map((t) => { const b = t.getBBox(); return { t: t.textContent.slice(0, 30), x: b.x, y: b.y, w: b.width, h: b.height }; }) : [];
      let overlaps = []; for (let i = 0; i < texts.length; i++) for (let j = i + 1; j < texts.length; j++) { const a = texts[i], b = texts[j]; const ox = Math.min(a.x + a.w, b.x + b.w) - Math.max(a.x, b.x), oy = Math.min(a.y + a.h, b.y + b.h) - Math.max(a.y, b.y); if (ox > 3 && oy > 3) overlaps.push(a.t + " / " + b.t); }
      let outside = 0; if (svg) svg.querySelectorAll("path,circle,ellipse,rect,polygon").forEach((e) => { try { const b = e.getBBox(); if (b.x < -10 || b.y < -10 || b.x + b.width > 770 || b.y + b.height > 650) outside++; } catch (_) {} });
      return { ready: !!W.ready, errors: W.errors || [], frames: W.frames || 0, registered: W.registered || [], parts: (W.model || {}).parts || [], els, overlaps: overlaps.slice(0, 8), outside }; });
    const a = await p.locator("#stage").screenshot(); await p.waitForTimeout(900); const b = await p.locator("#stage").screenshot();
    if (shots) { await p.screenshot({ path: shots + ".png", fullPage: true }); }
    report.state = st;
    if (!st.ready) issues.push("the page did not finish starting: " + (st.errors[0] || errs[0] || "unknown error"));
    st.errors.concat(errs).slice(0, 5).forEach((e) => issues.push("runtime error: " + e));
    if (st.els < 120) issues.push(`the drawing has only ${st.els} SVG elements — it is too sparse; add the real sub-structures (walls, lumens, small parts, context organs)`);
    const missing = st.parts.filter((id) => !st.registered.includes(id)); if (missing.length) issues.push("these model parts are not drawn/registered with K.part: " + missing.join(", "));
    if (st.overlaps.length) issues.push("labels overlap each other: " + st.overlaps.join("; ") + " — move them apart");
    if (st.outside > 3) issues.push(`${st.outside} shapes fall outside the 760×640 canvas`);
    if (Buffer.compare(a, b) === 0) issues.push("nothing moves between frames — drive the drawing from s in update()");
  } catch (e) { issues.push("page check failed: " + e.message); }
  await browser.close();
  return { issues, report };
}
