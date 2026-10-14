/* Explainer Studio page shell: the "specimen plate" layout every generated explainer is played in.
 * The model (AI-written) is the single source of truth; the shell turns it into the ledger, the timeline chart,
 * the controls and the tutor; the scene (AI-written for version A, built-in for version B) draws it. */
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
const HERE = dirname(fileURLToPath(import.meta.url));
const KIT = () => readFileSync(join(HERE, "kit.js"), "utf8");
const esc = (s) => String(s == null ? "" : s).replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));
const safeScript = (s) => String(s).replace(/<\/script/gi, "<\\/script");

const CSS = `
:root{--ground:#eef1f3;--sheet:#fbfcfc;--ink:#1d2730;--muted:#5d6a75;--hair:#d5dbe0;--wall:#b9706b;--wall-deep:#8d4a49;--wall-hi:#d39892;--fat:#e7cf9a;
 --hot:#c3283a;--hot-lumen:#e7a2a6;--hot-hi:#ff5a68;--cold:#3a56a6;--cold-lumen:#a9b7e0;--cold-hi:#4f78e6;--fluid:#dfe7ee;--bed:#e6dcd3;
 --leaflet:#f6eadf;--leaflet-edge:#6b4b44;--accent:#0f6d6a;--open:#1c7a4a;--shut:#9a3a2e;--spark:#d68a00;--ca:#c79a00;
 --display:"Spectral",Georgia,"Times New Roman",serif;--body:"Public Sans",system-ui,-apple-system,"Segoe UI",sans-serif;--mono:"JetBrains Mono",ui-monospace,Consolas,monospace}
@media (prefers-color-scheme:dark){:root:not([data-theme="light"]){--ground:#0f1418;--sheet:#151c21;--ink:#e5eaee;--muted:#93a1ac;--hair:#2a343c;--wall:#8e4a4c;--wall-deep:#5f2d31;--wall-hi:#b26d6d;--fat:#6d5b36;
 --hot:#e0465a;--hot-lumen:#6e2a33;--hot-hi:#ff7482;--cold:#6a86d8;--cold-lumen:#2b3a66;--cold-hi:#8eaaff;--fluid:#1f2a33;--bed:#2b2a29;--leaflet:#efe3d6;--leaflet-edge:#2a1d1a;--accent:#4fc2bb;--open:#4fc28a;--shut:#ff8a77;--spark:#ffc94d;--ca:#ffd84a;color-scheme:dark}}
*{box-sizing:border-box}body{margin:0;background:var(--ground);color:var(--ink);font:14px/1.5 var(--body);padding:20px 16px 40px}
.wrap{max-width:1180px;margin:0 auto;display:grid;gap:14px;grid-template-columns:minmax(0,1fr)}
h1{font-family:var(--display);font-weight:600;font-size:clamp(24px,4vw,34px);margin:0;letter-spacing:-.01em}h1 em{font-style:italic;font-weight:500;color:var(--muted)}
.sub{color:var(--muted);max-width:64ch;margin:2px 0 0}.fig,.eyebrow{font-family:var(--mono);font-size:11px;letter-spacing:.12em;text-transform:uppercase;color:var(--muted)}
.plate{background:var(--sheet);border:1px solid var(--hair);border-radius:6px}
.main{display:grid;grid-template-columns:minmax(0,1.45fr) minmax(0,1fr)}@media (max-width:860px){.main{grid-template-columns:1fr}}
.stage{position:relative;padding:10px;border-right:1px solid var(--hair);min-width:0}@media (max-width:860px){.stage{border-right:0;border-bottom:1px solid var(--hair)}}
.stage svg{width:100%;height:auto;display:block;touch-action:pan-y}
.figwrap{position:relative}.figwrap img{display:block;width:100%;height:auto;border-radius:4px}.figwrap svg{position:absolute;inset:0;width:100%;height:100%}
.legend{display:flex;flex-wrap:wrap;gap:6px 16px;font-size:12px;color:var(--muted);padding:4px 8px 2px}.legend span{display:inline-flex;align-items:center;gap:6px}.sw{width:10px;height:10px;border-radius:50%;display:inline-block}
.ledger{padding:18px 20px;display:grid;gap:16px;align-content:start;min-width:0}
.phase{font-family:var(--display);font-size:27px;font-weight:600;line-height:1.1;margin:2px 0 0}.clock{font-family:var(--mono);font-size:12px;color:var(--muted)}
.why{margin:0}.why b{font-weight:600}
table{width:100%;border-collapse:collapse;font-variant-numeric:tabular-nums}th{text-align:left;font-weight:500;font-size:11px;letter-spacing:.08em;text-transform:uppercase;color:var(--muted);padding:0 0 6px;border-bottom:1px solid var(--hair)}
td{padding:6px 0;border-bottom:1px solid var(--hair)}td.g{font-family:var(--mono);font-size:12.5px}td.r{text-align:right}
.pill{font-family:var(--mono);font-size:11px;letter-spacing:.08em;padding:2px 8px;border-radius:99px;border:1px solid currentColor;display:inline-block;min-width:58px;text-align:center}.pill.on{color:var(--open)}.pill.off{color:var(--shut)}
.nums{display:grid;grid-template-columns:repeat(auto-fit,minmax(110px,1fr));gap:10px}.num{border-top:1px solid var(--hair);padding-top:6px}.num .v{font-family:var(--mono);font-size:17px}.num .l{font-size:11.5px;color:var(--muted)}
.controls{display:flex;flex-wrap:wrap;gap:8px;align-items:center;padding:12px 14px;border-bottom:1px solid var(--hair)}
button{font:500 13px var(--body);color:var(--ink);background:transparent;border:1px solid var(--hair);border-radius:5px;padding:6px 11px;cursor:pointer}button:hover{border-color:var(--muted)}
button[aria-pressed="true"]{background:var(--ink);color:var(--sheet);border-color:var(--ink)}.seg{display:inline-flex}.seg button{border-radius:0;margin-left:-1px;font-family:var(--mono);font-size:12px}.seg button:first-child{border-radius:5px 0 0 5px;margin-left:0}.seg button:last-child{border-radius:0 5px 5px 0}
.spacer{flex:1}.lbl{font-size:12px;color:var(--muted)}
.chartwrap{padding:8px 10px 12px;overflow-x:auto}.chart{width:100%;min-width:560px;height:auto;display:block;cursor:ew-resize;touch-action:pan-y}.chart text{font-family:var(--mono);font-size:11px;fill:var(--muted)}
.tutor{padding:14px 18px;display:grid;gap:10px}.say{font-size:16px;line-height:1.55;min-height:3em}.say span.on{background:color-mix(in srgb,var(--accent) 16%,transparent);border-radius:3px}
.steps{display:flex;gap:6px;overflow-x:auto;padding-bottom:4px}.steps button{flex:none;font-size:12px}.steps button.on{background:var(--accent);border-color:var(--accent);color:var(--sheet)}
.notes{color:var(--muted);font-size:12.5px;max-width:90ch;margin:0}
.lab{font-family:var(--body);font-size:10.5px;fill:var(--muted);font-style:italic}.lab.strong{fill:var(--ink);font-style:normal;font-weight:600}
.tag{font-family:var(--mono);font-size:11px;font-weight:500;fill:var(--ink)}.tagtitle{font-family:var(--display);font-size:18px;font-weight:600}
.halo{paint-order:stroke;stroke:var(--sheet);stroke-width:3.5px;stroke-linejoin:round}
.err{color:var(--shut);font-family:var(--mono);font-size:12px;white-space:pre-wrap}
@media (max-width:600px){.phase{font-size:22px}.controls{gap:6px}.lbl{display:none}}
/* lenses: split stage, never overlapping. Closed: the main drawing fills the stage. Open: it animates to ~40% (still live, the magnified
   region boxed, a faint cone to the lens) and the lens takes the other 60%. Phones: a small live locator above a full-width lens. */
.split{position:relative;display:grid;grid-template-columns:1fr 0fr;column-gap:0;align-items:center;transition:grid-template-columns .55s cubic-bezier(.2,.8,.2,1),column-gap .55s}
.split.lensing{grid-template-columns:2fr 3fr;column-gap:16px}
.mainv{min-width:0;position:relative}
.lenspane{min-width:0;overflow:hidden;border:1px solid var(--hair);border-radius:8px;background:var(--sheet);box-shadow:0 10px 28px -16px rgba(10,20,30,.35);opacity:0;visibility:hidden;transition:opacity .3s .2s,visibility 0s .5s}
.split.lensing .lenspane{opacity:1;visibility:visible;transition:opacity .3s .2s,visibility 0s}
.split:not(.lensing) .lenspane{max-height:0;border-width:0}   /* closed: no height either, or its text wraps tall in the 0-width column and pushes the drawing down */
.lenshead{display:flex;align-items:flex-start;gap:8px;padding:7px 8px 6px 12px;border-bottom:1px solid var(--hair)}.lenshead>div{flex:1;min-width:0;display:grid}
.lenstitle{font-family:var(--display);font-weight:600;font-size:15px;line-height:1.25}.lenshead button{padding:1px 9px;font-size:16px;line-height:1.3}
.stage .lenspane svg{width:100%;height:auto;aspect-ratio:1}
.lensshows{font-size:12px;color:var(--muted);padding:3px 12px 10px;line-height:1.45}
.stage svg.cone{position:absolute;inset:0;width:100%;height:100%;pointer-events:none;overflow:visible}
.lensbar{display:flex;flex-wrap:wrap;gap:6px;align-items:center;padding:8px 8px 0}.lensbar .lbl{margin-right:2px}.lensbar button{font-size:12px;padding:4px 9px}.lensbar button.on{background:var(--accent);border-color:var(--accent);color:var(--sheet)}
.steps button .lz{opacity:.65;margin-left:5px}
.lt{font:500 14px var(--body);fill:var(--ink)}.lh{font:600 15.5px var(--display);fill:var(--ink)}.lm{font:12px var(--mono);fill:var(--muted)}.ls{font:12.5px var(--body);fill:var(--muted)}.big{font:600 30px var(--display);fill:var(--ink)}
#stage .lab{font-size:calc(10.5px * var(--ls,1))}#stage .halo{stroke-width:calc(3.5px * var(--ls,1))}#stage .tag{font-size:calc(11px * var(--ls,1))}#stage .tagtitle{font-size:calc(18px * var(--ls,1))}
@media (max-width:640px){.split.lensing{grid-template-columns:1fr;row-gap:10px}.split.lensing .mainv{width:50%;justify-self:center}}
@media (prefers-reduced-motion:reduce){*{transition:none!important}}`;

function frame({ meta, stageHtml, legendHtml }) {
  return `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>${esc(meta.title)}</title>
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Spectral:ital,wght@0,500;0,600;1,500&family=Public+Sans:wght@400;500;600&family=JetBrains+Mono:wght@400;500&display=swap">
<style>${CSS}</style></head><body>
<div class="wrap">
  <header><div class="fig">${esc(meta.figLabel || "Plate")}</div><h1>${esc(meta.title)} <em>${esc(meta.titleEm || "")}</em></h1><p class="sub">${esc(meta.sub || "")}</p></header>
  <section class="plate main"><div class="stage"><div class="split" id="split"><div class="mainv">${stageHtml}</div>
    <div class="lenspane" id="lensPane"><div class="lenshead"><div><span class="eyebrow" id="lensKicker"></span><span class="lenstitle" id="lensTitle"></span></div><button id="lensClose" aria-label="Close the lens">×</button></div>
      <svg id="lens" viewBox="0 0 400 400" role="img" aria-label="Lens"></svg><div class="lensshows" id="lensShows"></div></div><svg class="cone" id="cone" aria-hidden="true"></svg></div>
    <div class="lensbar" id="lensBar" hidden><span class="lbl">Look closer</span></div><div class="legend">${legendHtml || ""}</div></div>
    <div class="ledger"><div><div class="eyebrow">Phase</div><p class="phase" id="phase">—</p><div class="clock" id="clock"></div></div>
      <p class="why" id="why"></p><table id="gatesT"><thead><tr><th id="gatesH">Gate</th><th id="gatesW">Why</th><th class="r">State</th></tr></thead><tbody id="gates"></tbody></table>
      <div class="nums" id="nums"></div></div></section>
  <section class="plate tutor" aria-label="Tutor"><div class="eyebrow">Tutor</div><div class="say" id="say">Press “Tutor me” for a guided walk-through, or explore on your own.</div>
    <div class="steps" id="steps"></div><div><button id="tutor">▶ Tutor me</button> <button id="mute" aria-pressed="false">Voice on</button></div></section>
  <section class="plate"><div class="controls"><button id="play" aria-pressed="true">Pause</button><button id="prev">◀ Phase</button><button id="next">Phase ▶</button>
      <span class="lbl">Speed</span><div class="seg" id="speed"></div><button id="loop" aria-pressed="true" hidden title="Replay only the part of the cycle this step is about">Loop this moment</button><span class="spacer"></span><span class="lbl" id="modesL" hidden>Chart</span><div class="seg" id="modes" hidden></div><button id="sound" aria-pressed="false" hidden>Sound off</button></div>
    <div class="chartwrap"><svg id="chart" class="chart" viewBox="0 0 1000 330" tabindex="0" role="slider" aria-label="Timeline. Drag or use arrow keys."></svg></div></section>
  <p class="notes" id="notes"></p><div class="err" id="err"></div>
</div>`;
}

/* the runtime shared by A and B: model → samples → ledger, chart, controls, tutor; calls scene.update every frame */
const RUNTIME = `
window.__studio = { errors: [], frames: 0 };
window.addEventListener("error", (e) => { window.__studio.errors.push(String(e.message || e)); const x = document.getElementById("err"); if (x) x.textContent += "⚠ " + e.message + "\\n"; });
const $ = (id) => document.getElementById(id);
function runStudio(createScene, LESSON) {
  const M = createModel(); const N = M.N || 600, T = M.T, unit = M.timeUnit || "s";
  const S = []; for (let i = 0; i < N; i++) S.push(M.sample(i * T / N));
  window.__studio.model = { N, T, parts: (M.parts || []).map((p) => p.id), phases: [...new Set(S.map((s) => s.phase))] };
  const BANDS = []; { let s0 = 0; for (let i = 1; i <= N; i++) if (i === N || S[i].phase !== S[s0].phase) { BANDS.push({ name: S[s0].phase, a: s0, b: i }); s0 = i; } }
  const EV = (M.events ? M.events(S, T) : []) || [];
  const svg = $("stage"); K.init(svg); const scene = createScene(svg, K, M, S) || { update() {} }; try { K.settleLabels(); } catch (_) {}
  // journeys: the runtime (not the AI) puts the followed parcel on the drawn path, straight from the model's parcel
  const TR = S[0] && S[0].parcel && scene.paths ? K.tracer(K.el("g", {}, svg), scene.paths) : null;
  const parcelText = (s) => { try { if (M.parcelLabel) return M.parcelLabel(s); } catch (_) {} return (M.readouts || []).filter((r) => r.big).slice(0, 2).map((r) => fmt(s.readouts[r.key], r.digits) + " " + (r.unit || "")).join(" · "); };
  window.__studio.tracer = !!TR; window.__studio.parcelParts = [...new Set(S.map((s) => s.parcel && s.parcel.part).filter(Boolean))]; window.__studio.paths = Object.keys(scene.paths || {});
  window.__studio.registered = Object.keys(K.parts());
  // ---- lenses (K.lens in the scene) + the main-drawing camera
  const LZ = K.lenses(), LMETA = {}; ((window.LENS_META) || []).forEach((m) => { LMETA[m.id] = m; });
  const split = $("split"), lensPane = $("lensPane"), lensSvg = $("lens"), cone = $("cone");
  let lensId = null, stepCam = null;
  const lensOrder = Object.keys(LMETA).filter((id) => LZ[id]).concat(Object.keys(LZ).filter((id) => !LMETA[id]));
  window.__studio.lenses = Object.keys(LZ); window.__studio.lensErrors = [];
  const lensToggle = (id, on) => { const L = id && LZ[id]; if (L && L.toggle) { try { L.toggle(on); } catch (e) { window.__studio.errors.push("lens " + id + ".toggle: " + e.message); } } };
  function openLens(id) { const L = LZ[id]; if (!L) { closeLens(); return; } if (lensId === id) return; lensToggle(lensId, false); lensId = id; lensToggle(id, true);
    if (!L._g) { L._g = K.el("g", {}, lensSvg); try { L._u = L.build(L._g, { S, M, N, T }) || (() => {}); } catch (e) { L._u = () => {}; window.__studio.lensErrors.push(id + ": " + e.message); window.__studio.errors.push("lens " + id + ": " + e.message); } }
    for (const k in LZ) if (LZ[k]._g) LZ[k]._g.style.display = k === id ? "" : "none";
    const m = LMETA[id] || {}; $("lensKicker").textContent = m.kicker || "Lens"; $("lensTitle").textContent = m.title || id; $("lensShows").textContent = m.shows || ""; lensSvg.setAttribute("aria-label", m.title || id);
    split.classList.add("lensing"); $("lensBar").querySelectorAll("button").forEach((b) => b.classList.toggle("on", b.dataset.id === id)); window.__studio.lens = id; prevI = -1; render(0); }
  function closeLens() { lensToggle(lensId, false); lensId = null; split.classList.remove("lensing"); $("lensBar").querySelectorAll("button").forEach((b) => b.classList.remove("on")); window.__studio.lens = null; }
  window.__studio.openLens = openLens; window.__studio.closeLens = closeLens;
  $("lensClose").onclick = closeLens;
  if (lensOrder.length) { $("lensBar").hidden = false; lensOrder.forEach((id) => { const b = document.createElement("button"); b.dataset.id = id; b.textContent = (LMETA[id] && LMETA[id].title) || id; b.onclick = () => (lensId === id ? closeLens() : openLens(id)); $("lensBar").appendChild(b); }); }
  const vb = svg.viewBox.baseVal, BASE = { x: vb.x, y: vb.y, w: vb.width || 760, h: vb.height || 640 }, cam = { ...BASE };
  function camTarget() { const c = (lensId && LZ[lensId].cam) || (!lensId && stepCam) || null; if (!c) return BASE;
    const w = Math.min(BASE.w, c[2]), h = w * BASE.h / BASE.w; return { x: Math.max(BASE.x, Math.min(BASE.x + BASE.w - w, c[0] - w / 2)), y: Math.max(BASE.y, Math.min(BASE.y + BASE.h - h, c[1] - h / 2)), w, h }; }
  let camKey = "";
  function moveCam(a) { const g = camTarget(); for (const k of ["x", "y", "w", "h"]) cam[k] += (g[k] - cam[k]) * a; const key = [cam.x, cam.y, cam.w, cam.h].map((v) => v.toFixed(1)).join(" ");
    if (key !== camKey) { camKey = key; svg.setAttribute("viewBox", key); svg.style.setProperty("--ls", (cam.w / BASE.w).toFixed(3)); } }
  const P2 = (p) => p[0].toFixed(1) + " " + p[1].toFixed(1);
  function drawCone() { const L = lensId && LZ[lensId]; if (!L || !L.focus) { if (cone.innerHTML) cone.innerHTML = ""; return; }
    const sr = split.getBoundingClientRect(), m = svg.getScreenCTM(); if (!m || !sr.width) return;
    const pt = (x, y) => { const p = svg.createSVGPoint(); p.x = x; p.y = y; const q = p.matrixTransform(m); return [q.x - sr.left, q.y - sr.top]; };
    const f = L.focus, a = pt(f[0], f[1]), b = pt(f[0] + f[2], f[1] + f[3]), lr = lensPane.getBoundingClientRect(), l = [lr.left - sr.left, lr.top - sr.top, lr.right - sr.left, lr.bottom - sr.top];
    const stacked = l[1] >= b[1] - 2;   // phone: the locator sits above the lens
    const [p1, p2, c1, c2] = stacked ? [[a[0], b[1]], [b[0], b[1]], [l[0], l[1]], [l[2], l[1]]] : [[b[0], a[1]], [b[0], b[1]], [l[0], l[1]], [l[0], l[3]]];
    cone.setAttribute("viewBox", "0 0 " + sr.width.toFixed(0) + " " + sr.height.toFixed(0)); cone.style.opacity = getComputedStyle(lensPane).opacity;
    cone.innerHTML = '<path d="M' + P2(p1) + "L" + P2(c1) + "L" + P2(c2) + "L" + P2(p2) + 'Z" fill="var(--accent)" fill-opacity="0.06"/><path d="M' + P2(p1) + "L" + P2(c1) + "M" + P2(p2) + "L" + P2(c2) + '" stroke="var(--accent)" stroke-opacity="0.5" stroke-width="1.1" fill="none"/>'
      + '<rect x="' + Math.min(a[0], b[0]).toFixed(1) + '" y="' + Math.min(a[1], b[1]).toFixed(1) + '" width="' + Math.abs(b[0] - a[0]).toFixed(1) + '" height="' + Math.abs(b[1] - a[1]).toFixed(1) + '" rx="4" fill="var(--accent)" fill-opacity="0.07" stroke="var(--accent)" stroke-width="1.6"/>'; }
  // "Loop this moment": replay only the part of the cycle the current step is about
  let loopWin = null, loopOn = true;
  const setLoopBtn = () => { $("loop").hidden = !loopWin; $("loop").setAttribute("aria-pressed", String(loopOn)); };
  // ledger
  const gates = M.gates || []; if (!gates.length) $("gatesT").hidden = true; else $("gatesH").textContent = M.gateTitle || "Gate"; if (M.gateWhy) $("gatesW").textContent = M.gateWhy;
  const grows = gates.map((g) => { const tr = document.createElement("tr"); tr.innerHTML = "<td></td><td class='g'></td><td class='r'><span class='pill'></span></td>"; tr.children[0].textContent = g.label; $("gates").appendChild(tr); return { g, d: tr.children[1], p: tr.querySelector(".pill") }; });
  const big = (M.readouts || []).filter((r) => r.big).slice(0, 4);
  big.forEach((r) => { const d = document.createElement("div"); d.className = "num"; d.innerHTML = "<div class='v'></div><div class='l'></div>"; d.lastChild.textContent = r.label + (r.unit ? ", " + r.unit : ""); r.el = d.firstChild; $("nums").appendChild(d); });
  $("notes").textContent = M.notes || "";
  const fmt = (v, d) => (typeof v === "number" ? v.toFixed(d ?? 0) : String(v ?? "—"));
  function ledger(i) { const s = S[i]; $("phase").textContent = s.phase; $("clock").textContent = "t = " + fmt(i * T / N, unit === "s" ? 3 : 1) + " " + unit + " of " + fmt(T, unit === "s" ? 3 : 1) + " " + unit + (M.clockNote ? " · " + M.clockNote : "");
    try { $("why").innerHTML = M.explain ? M.explain(s, i * T / N) : ""; } catch (e) { $("why").textContent = ""; }
    grows.forEach((r) => { let on = false; try { on = !!r.g.on(s); r.d.textContent = r.g.detail ? r.g.detail(s) : ""; } catch (_) {} r.p.textContent = on ? (M.onWord || "OPEN") : (M.offWord || "SHUT"); r.p.className = "pill " + (on ? "on" : "off"); });
    big.forEach((r) => { let v; try { v = r.text ? r.text(s) : null; } catch (_) {} r.el.textContent = v != null ? v : fmt(s.readouts[r.key], r.digits); }); }
  // chart
  const chart = $("chart"), CX0 = 58, CX1 = 985, xOf = (i) => CX0 + (CX1 - CX0) * i / N; let cursor;
  // lanes: M.chart, or M.chartModes [{label, lanes}] with a toggle (e.g. left / right heart). Optional per lane: weight (relative height),
  // step (gridline every step), grid:false, marks [{t, label}] (e.g. P, QRS, T), noEvents (event lines start below this lane), dot (series key
  // that gets a cursor dot); per series: at (0–1 of the cycle, where its label sits), label "" (no label), width.
  const modes = M.chartModes && M.chartModes.length ? M.chartModes : null; let mode = 0, dots = [];
  const lanesNow = () => { const l = modes ? modes[mode].lanes : null; return ((Array.isArray(l) ? l : M.chart) || []).slice(0, 3); };  // a mode with lanes:null shows M.chart
  function drawChart() { chart.innerHTML = ""; const g = K.el("g", {}, chart), lanes = lanesNow(); dots = [];
    BANDS.forEach((b, j) => { K.el("rect", { x: xOf(b.a), y: 4, width: xOf(b.b) - xOf(b.a), height: 300, fill: j % 2 ? "var(--ground)" : "var(--sheet)" }, g);
      if (xOf(b.b) - xOf(b.a) > 40) { const t = K.el("text", { x: (xOf(b.a) + xOf(b.b)) / 2, y: 322, "text-anchor": "middle" }, g); const room = Math.floor((xOf(b.b) - xOf(b.a) - 8) / 7), nm = (M.short && M.short[b.name]) || b.name; t.textContent = nm.length > room ? nm.slice(0, Math.max(3, room - 1)) + "…" : nm; } });
    const W = lanes.map((l) => l.weight || 1), WT = W.reduce((a, b) => a + b, 0) || 1; let yAcc = 8, evTop = 6;
    lanes.forEach((ln, li) => { const H = 296 * W[li] / WT, y0 = yAcc, y1 = y0 + H - 18; yAcc += H; if (ln.noEvents) evTop = yAcc - 4; let lo = ln.min, hi = ln.max;
      if (lo == null || hi == null) { let a = Infinity, b = -Infinity; ln.series.forEach((sr) => S.forEach((s) => { const v = s.readouts[sr.key]; if (typeof v === "number" && isFinite(v)) { a = Math.min(a, v); b = Math.max(b, v); } })); const pad = (b - a) * 0.08 || 1; lo = lo ?? a - pad; hi = hi ?? b + pad; }
      const yv = (v) => y1 - (v - lo) / ((hi - lo) || 1) * (y1 - y0 - 8);
      if (ln.grid !== false) { const ticks = []; if (ln.step) { for (let v = Math.ceil(lo / ln.step - 1e-9) * ln.step; v <= hi + 1e-9; v += ln.step) ticks.push(v); } else ticks.push(lo, hi);
        ticks.forEach((v) => { K.el("line", { x1: CX0, x2: CX1, y1: yv(v), y2: yv(v), stroke: "var(--hair)", "stroke-width": 0.8 }, g); K.el("text", { x: CX0 - 6, y: yv(v) + 4, "text-anchor": "end" }, g).textContent = fmt(v, Math.abs(hi - lo) < 5 ? 1 : 0); }); }
      K.el("text", ln.step || ln.grid === false ? { x: 6, y: y0 + (ln.grid === false ? H / 2 - 4 : 12) } : { x: CX0 + 6, y: y0 + 12 }, g).textContent = ln.unit || ln.lane;
      (ln.marks || []).forEach((m) => { const t = K.el("text", { x: xOf(Math.round(m.t / T * N)), y: y0 + 4, "text-anchor": "middle" }, g); t.textContent = m.label; });
      ln.series.forEach((sr, k) => { let d = ""; S.forEach((s, i) => { const v = s.readouts[sr.key]; if (typeof v === "number" && isFinite(v)) d += (d ? "L" : "M") + K.f1(xOf(i)) + " " + K.f1(yv(v)); });
        const col = { hot: "var(--hot)", cold: "var(--cold)", accent: "var(--accent)", muted: "var(--muted)", ink: "var(--ink)" }[sr.tone] || ["var(--hot)", "var(--cold)", "var(--accent)", "var(--muted)"][k % 4];
        K.el("path", { d, fill: "none", stroke: col, "stroke-width": sr.width || (sr.dash ? 1.6 : 2.1), "stroke-dasharray": sr.dash ? "6 3" : "", "stroke-linejoin": "round" }, g);
        if (sr.label === "") return; const bi = sr.at != null ? Math.round(N * sr.at) % N : Math.round(N * (0.12 + 0.27 * k)) % N, bv = S[bi].readouts[sr.key];
        const t = K.el("text", { x: xOf(bi) + 4, y: yv(typeof bv === "number" ? bv : lo) - 6 }, g); t.textContent = sr.label; t.setAttribute("style", "fill:var(--ink)"); });
      if (ln.dot) dots.push({ key: ln.dot, yv }); });
    EV.forEach((ev) => { const i = Math.round(ev.t / T * N); K.el("line", { x1: xOf(i), x2: xOf(i), y1: evTop, y2: 304, stroke: "var(--ink)", "stroke-width": 0.8, "stroke-dasharray": "2 3" }, g); const t = K.el("text", { x: xOf(i) + 4, y: evTop + 10 }, g); t.textContent = ev.label; t.setAttribute("style", "fill:var(--ink)"); });
    cursor = K.el("line", { x1: 0, x2: 0, y1: 2, y2: 306, stroke: "var(--accent)", "stroke-width": 2 }, chart);
    dots.forEach((d) => { d.c = K.el("circle", { r: 4, fill: "var(--accent)" }, chart); }); }
  if (modes) { $("modes").hidden = false; $("modesL").hidden = false; modes.forEach((m, k) => { const b = document.createElement("button"); b.textContent = m.label; b.setAttribute("aria-pressed", String(k === 0));
    b.onclick = () => { mode = k; $("modes").querySelectorAll("button").forEach((x) => x.setAttribute("aria-pressed", String(x === b))); drawChart(); prevI = -1; render(0); }; $("modes").appendChild(b); }); }
  drawChart(); matchMedia("(prefers-color-scheme: dark)").addEventListener("change", drawChart);
  // playback
  let t = (M.startAt || 0) * T, playing = !matchMedia("(prefers-reduced-motion: reduce)").matches, speed = (M.speeds || [0.25])[Math.min(1, (M.speeds || [0.25]).length - 1)], prevI = -1, sound = false, actx = null;
  const sp = $("speed"); (M.speeds || [0.1, 0.25, 0.5, 1]).forEach((v) => { const b = document.createElement("button"); b.textContent = v + "×"; b.dataset.s = v; b.setAttribute("aria-pressed", String(v === speed)); b.onclick = () => { speed = v; sp.querySelectorAll("button").forEach((x) => x.setAttribute("aria-pressed", String(x === b))); }; sp.appendChild(b); });
  if (EV.some((e) => e.sound)) $("sound").hidden = false;
  function thump(f) { if (!sound) return; try { actx = actx || new AudioContext(); const o = actx.createOscillator(), gN = actx.createGain(), now = actx.currentTime; o.frequency.setValueAtTime(f || 60, now); o.frequency.exponentialRampToValueAtTime(30, now + 0.12); gN.gain.setValueAtTime(0.0001, now); gN.gain.exponentialRampToValueAtTime(0.8, now + 0.01); gN.gain.exponentialRampToValueAtTime(0.0001, now + 0.15); o.connect(gN).connect(actx.destination); o.start(now); o.stop(now + 0.2); } catch (_) {} }
  const idx = () => Math.floor(((t % T + T) % T) / T * N) % N;
  function render(dBeat) { const i = idx(); if (TR) TR.set(S[i].parcel.part, S[i].parcel.u, parcelText(S[i])); try { scene.update(i, S[i], dBeat); } catch (e) { if (!window.__studio.sceneError) { window.__studio.sceneError = String(e.message); window.__studio.errors.push("scene.update: " + e.message); } }
    if (i !== prevI) { ledger(i); cursor.setAttribute("transform", "translate(" + K.f1(xOf(i)) + " 0)"); dots.forEach((d) => { const v = S[i].readouts[d.key]; d.c.setAttribute("cx", K.f1(xOf(i))); d.c.setAttribute("cy", K.f1(d.yv(typeof v === "number" ? v : 0))); });
      if (playing && prevI >= 0) EV.forEach((ev) => { const k = Math.round(ev.t / T * N); if ((prevI < i && k > prevI && k <= i) || (prevI > i && (k > prevI || k <= i))) if (ev.sound) thump(ev.freq); }); prevI = i; }
    if (lensId && LZ[lensId]._u) { try { LZ[lensId]._u(i, S[i], Math.max(0, dBeat)); } catch (e) { if (!LZ[lensId]._err) { LZ[lensId]._err = 1; window.__studio.lensErrors.push(lensId + ": " + e.message); window.__studio.errors.push("lens " + lensId + ".update: " + e.message); } } }
    window.__studio.frames++; window.__studio.i = i; }
  const still = matchMedia("(prefers-reduced-motion: reduce)");
  let last = 0; function tick(now) { const dt = last ? Math.min((now - last) / 1000, 0.05) : 0; last = now;
    moveCam(still.matches ? 1 : 1 - Math.exp(-dt / 0.3));
    if (playing) { const d = dt * speed * (M.playRate || 1); let tn = t + d; if (loopOn && loopWin && (tn > loopWin[1] || tn < loopWin[0] - 1e-9)) tn = loopWin[0]; t = ((tn % T) + T) % T; render(d / T * (M.flowScale || 1)); }
    drawCone(); requestAnimationFrame(tick); }
  for (let k = 0; k < 90; k++) { t = (t + T / N * 2) % T; render(2 / N); } render(0); requestAnimationFrame(tick);
  const setPlaying = (p) => { playing = p; $("play").textContent = p ? "Pause" : "Play"; $("play").setAttribute("aria-pressed", String(p)); }; setPlaying(playing);
  $("play").onclick = () => setPlaying(!playing);
  function scrubTo(tt) { let d = tt - t; if (d > T / 2) d -= T; if (d < -T / 2) d += T; const n = Math.max(1, Math.ceil(Math.abs(d) / (T / N * 3))); for (let k = 0; k < n; k++) { t = ((t + d / n) % T + T) % T; render(d / n / T); } }
  const freeRoam = () => { loopOn = false; stepCam = null; setLoopBtn(); };
  function jump(dir) { freeRoam(); setPlaying(false); const i = idx(); let b = BANDS.findIndex((x) => i >= x.a && i < x.b); b = dir > 0 ? (b + 1) % BANDS.length : (i - BANDS[b].a > 20 ? b : (b - 1 + BANDS.length) % BANDS.length); scrubTo((BANDS[b].a + 2) / N * T); }
  $("prev").onclick = () => jump(-1); $("next").onclick = () => jump(1);
  $("sound").onclick = (e) => { sound = !sound; e.currentTarget.setAttribute("aria-pressed", String(sound)); e.currentTarget.textContent = sound ? "Sound on" : "Sound off"; };
  let drag = false; const chartT = (ev) => { const r = chart.getBoundingClientRect(), x = (ev.clientX - r.left) / r.width * 1000; return Math.min(N - 1, Math.max(0, (x - CX0) / (CX1 - CX0) * N)) / N * T; };
  chart.addEventListener("pointerdown", (ev) => { drag = true; chart.setPointerCapture(ev.pointerId); setPlaying(false); freeRoam(); scrubTo(chartT(ev)); });
  chart.addEventListener("pointermove", (ev) => { if (drag) scrubTo(chartT(ev)); }); chart.addEventListener("pointerup", () => drag = false);
  document.addEventListener("keydown", (ev) => { if (ev.key === " ") { ev.preventDefault(); setPlaying(!playing); } else if (ev.key === "ArrowRight") { ev.preventDefault(); jump(1); } else if (ev.key === "ArrowLeft") { ev.preventDefault(); jump(-1); } });
  // tutor: each step jumps to its phase, spotlights its parts and is read aloud (the app's voice when embedded)
  const steps = (LESSON && LESSON.steps) || []; let si = -1, tutoring = false, muted = false, sayId = 0;
  $("steps").innerHTML = steps.map((s, k) => "<button data-k='" + k + "'" + (s.lens ? " title='Opens a lens'" : "") + ">" + (k + 1) + ". " + String(s.title || "").replace(/[<>&]/g, "") + (s.lens && LZ[s.lens] ? "<span class='lz'>◎</span>" : "") + "</button>").join("");
  $("loop").onclick = () => { loopOn = !loopOn; setLoopBtn(); };
  const sentences = (x) => String(x || "").split(/(?<=[.!?])\\s+/).filter(Boolean);
  let clip = null;
  function voice(text, done, rec) { if (muted) return setTimeout(done, 700 + text.length * 55);
    window.__studio.lastVoice = rec ? "recorded" : window.parent !== window ? "app" : "browser";
    if (rec) { let ended = false; const fin = () => { if (!ended) { ended = true; done(); } }; try { clip = new Audio(rec); clip.onended = fin; clip.onerror = () => { clip = null; voice(text, done, null); }; clip.play().catch(() => { clip = null; voice(text, fin, null); }); return; } catch (_) {} }
    if (window.parent !== window) { const id = "s" + Math.random(); const h = (e) => { if (e.data && e.data.type === "mbx-said" && e.data.id === id) { window.removeEventListener("message", h); done(); } }; window.addEventListener("message", h); window.parent.postMessage({ type: "mbx-speak", id, text }, "*"); setTimeout(() => { window.removeEventListener("message", h); }, 30000); return; }
    try { const u = new SpeechSynthesisUtterance(text); u.lang = "en-GB"; u.onend = done; u.onerror = done; speechSynthesis.speak(u); } catch (_) { setTimeout(done, 800 + text.length * 55); } }
  function goStep(k) { si = k; const s = steps[k]; if (!s) return; $("steps").querySelectorAll("button").forEach((b, j) => b.classList.toggle("on", j === k));
    try { if (clip) clip.pause(); } catch (_) {}
    const band = BANDS.filter((b) => b.name === s.phase).sort((x, y) => (y.b - y.a) - (x.b - x.a))[0]; /* a phase can recur in one cycle: use its longest window */
    // the moment this step is about: s.win [t0, t1] in model time, else its phase window padded a little either side
    loopWin = Array.isArray(s.win) ? [Math.max(0, s.win[0]), Math.min(T, s.win[1])] : band ? [Math.max(0, band.a / N * T - 0.03 * T), Math.min(T - T / N, band.b / N * T + 0.03 * T)] : null; loopOn = true; setLoopBtn();
    stepCam = Array.isArray(s.cam) ? s.cam : null; if (s.lens) openLens(s.lens); else closeLens();
    if (Array.isArray(s.win)) scrubTo(loopWin[0]); else if (band) { scrubTo((band.a + 2) / N * T); } else if (typeof s.at === "number") scrubTo(s.at * T);
    setPlaying(true); speed = s.speed || 0.1; K.focus(s.focus || []);
    const parts = sentences(s.say), id = ++sayId, rec = Array.isArray(s.audio) && s.audio.length === parts.length ? s.audio : null; let j = 0;
    const next = () => { if (id !== sayId) return; if (j >= parts.length) { if (tutoring && k + 1 < steps.length) setTimeout(() => goStep(k + 1), 900); else { tutoring = false; $("tutor").textContent = "▶ Tutor me"; K.focus([]); } return; }
      $("say").innerHTML = parts.map((p, q) => "<span class='" + (q === j ? "on" : "") + "'>" + p.replace(/[<>&]/g, "") + "</span>").join(" "); voice(parts[j], next, rec && rec[j]); j++; };
    next(); }
  $("steps").querySelectorAll("button").forEach((b) => b.onclick = () => { tutoring = false; goStep(+b.dataset.k); });
  $("tutor").onclick = () => { if (tutoring) { tutoring = false; sayId++; try { speechSynthesis.cancel(); } catch (_) {} try { if (clip) clip.pause(); } catch (_) {} $("tutor").textContent = "▶ Tutor me"; K.focus([]); return; } tutoring = true; $("tutor").textContent = "❚❚ Stop"; goStep(si < 0 || si >= steps.length - 1 ? 0 : si); };
  $("mute").onclick = (e) => { muted = !muted; e.currentTarget.textContent = muted ? "Voice off" : "Voice on"; e.currentTarget.setAttribute("aria-pressed", String(muted)); };
  window.__studio.seek = (f) => { setPlaying(false); scrubTo(f * T); };
  /* "what if": re-run the model with changed settings (createModel(params); M.whatifs lists the plate's own) and redraw
   * everything that comes from it: samples, phase bands, events, chart, gates, ledger. Same objects are refilled in place,
   * so the scene and lenses keep reading the live model. setParams({}) goes back to normal. */
  window.__studio.setParams = (params) => { const nm = createModel(params || {}); if (nm.T !== T || (nm.N || 600) !== N) { window.__studio.errors.push("setParams: model length changed"); return false; }
    for (const k of Object.keys(M)) delete M[k]; Object.assign(M, nm);
    S.length = 0; for (let i = 0; i < N; i++) S.push(M.sample(i * T / N));
    BANDS.length = 0; { let s0 = 0; for (let i = 1; i <= N; i++) if (i === N || S[i].phase !== S[s0].phase) { BANDS.push({ name: S[s0].phase, a: s0, b: i }); s0 = i; } }
    EV.length = 0; ((M.events ? M.events(S, T) : []) || []).forEach((e) => EV.push(e));
    grows.forEach((r, k) => { if (M.gates && M.gates[k]) r.g = M.gates[k]; });
    const nb = (M.readouts || []).filter((r) => r.big).slice(0, 4); big.forEach((r, k) => { if (nb[k]) r.text = nb[k].text; });
    $("notes").textContent = M.notes || ""; window.__studio.params = M.params || params || {};
    drawChart(); prevI = -1; render(0); return true; };
  window.__studio.ready = true;
}`;

/* Version A: the AI's own scene */
export function pageA({ meta, modelCode, sceneCode, lesson, legend, lenses }) {
  // lenses = [{ id, title, kicker, shows }] from the plate's shows.json (the scene draws them with K.lens)
  return frame({ meta, stageHtml: `<svg id="stage" viewBox="0 0 760 640" role="img" aria-label="${esc(meta.alt || meta.title)}"></svg>`, legendHtml: legend })
    + `<script>window.LENS_META = ${safeScript(JSON.stringify(lenses || []))};</script><script>${KIT()}</script><script>${RUNTIME}</script><script>\n${safeScript(modelCode)}\n</script><script>\n${safeScript(sceneCode)}\n</script>`
    + `<script>try{ runStudio(createScene, ${JSON.stringify(lesson || {})}); }catch(e){ window.__studio.errors.push("start: "+e.message); document.getElementById("err").textContent = "⚠ " + e.message; }</script></body></html>`;
}

/* Version B: the student's own figure, animated by the same model.
 * map = { W, H, parts: { id: { poly:[[x,y]…] | ell:[cx,cy,rx,ry], label:[x,y] } }, flows: [{ pts:[[x,y]…], part: id (its .flow drives speed), gate?: id (its .open gates), tone: 0..1|"up"|"down" }] } */
export function pageB({ meta, modelCode, figure, map, lesson }) {
  const scene = `function createScene(svg, K, M, S){
  const MAP = ${JSON.stringify(map)}; svg.setAttribute("viewBox", "0 0 " + MAP.W + " " + MAP.H);
  const L = K.layers("glow", "flow", "rings"); const glow = {}, ring = {}, tags = {};
  const names = Object.fromEntries((M.parts || []).map((p) => [p.id, p.name]));
  const shape = (r, parent, attrs) => r.poly ? K.el("polygon", { points: r.poly.map((p) => p.join(",")).join(" "), ...attrs }, parent) : K.el("ellipse", { cx: r.ell[0], cy: r.ell[1], rx: r.ell[2], ry: r.ell[3], ...attrs }, parent);
  for (const id in MAP.parts) { const r = MAP.parts[id];
    glow[id] = shape(r, L.glow, { fill: "var(--accent)", opacity: 0 });
    ring[id] = shape(r, L.rings, { fill: "none", stroke: "var(--accent)", "stroke-width": 2.5, opacity: 0, "stroke-dasharray": "7 5", "vector-effect": "non-scaling-stroke" });
    K.part(id, glow[id], ring[id]);
    if (r.label && names[id]) tags[id] = K.label(r.label[0], r.label[1], names[id], "middle", { strong: true }); }
  const seg = {}, routes = [];
  (MAP.flows || []).forEach((f, k) => { seg["f" + k] = { pts: f.pts, w: f.w || 5, layer: L.flow, tone: f.tone ?? 0.5,
      rate: (i, s) => { const p = s.parts[f.part] || {}; return 0.15 + 1.6 * Math.max(0, Math.min(1, p.flow ?? (p.active ?? 0.5))); },
      gate: f.gate ? (i, s) => ((s.parts[f.gate] || {}).open ?? 1) : null }; routes.push(["f" + k]); });
  const flows = routes.length ? K.flows(seg, routes, { open: true, spacing: 11, speed: 900 }) : null;
  return { update(i, s, d) { for (const id in MAP.parts) { const p = s.parts[id] || {};
      glow[id].setAttribute("opacity", K.f1(0.28 * (p.active ?? 0)));
      if (p.open !== undefined) { ring[id].setAttribute("opacity", 0.9); ring[id].setAttribute("stroke", p.open > 0.5 ? "var(--open)" : "var(--shut)"); } }
    if (flows) flows.update(i, s, d); } };
}`;
  const stage = `<div class="figwrap"><img src="${figure}" alt="The diagram from your note"><svg id="stage" viewBox="0 0 ${map.W} ${map.H}" preserveAspectRatio="none"></svg></div>`;
  return frame({ meta: { ...meta, figLabel: (meta.figLabel || "Plate") + " · your note's diagram" }, stageHtml: stage, legendHtml: `<span>Your own diagram, driven by the same model as the main plate</span>` })
    + `<script>${KIT()}</script><script>${RUNTIME}</script><script>\n${safeScript(modelCode)}\n</script><script>${scene}</script>`
    + `<script>try{ runStudio(createScene, ${JSON.stringify(lesson || {})}); }catch(e){ window.__studio.errors.push("start: "+e.message); document.getElementById("err").textContent = "⚠ " + e.message; }</script></body></html>`;
}

/* a chooser page holding both versions (each isolated in its own sandboxed frame) */
export function chooser({ meta, a, b }) {
  const frameOf = (html) => `<iframe sandbox="allow-scripts" srcdoc="${esc(html)}" style="width:100%;height:1500px;border:0"></iframe>`;
  return `<!doctype html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${esc(meta.title)} — choose your explainer</title>
<style>body{margin:0;font:14px system-ui;background:#eef1f3}nav{position:sticky;top:0;z-index:2;display:flex;gap:8px;padding:10px 16px;background:#1d2730}nav button{font:600 13px system-ui;border:1px solid #445;border-radius:6px;padding:8px 14px;background:transparent;color:#e5eaee;cursor:pointer}nav button[aria-pressed=true]{background:#e5eaee;color:#1d2730}nav span{color:#93a1ac;align-self:center;font-size:12px}</style></head>
<body><nav><button id="ta" aria-pressed="true">★ Best explainer</button>${b ? '<button id="tb" aria-pressed="false">📝 Your note’s diagram</button>' : ""}<span>Same model drives both — pick whichever helps you see it.</span></nav>
<div id="pa">${frameOf(a)}</div>${b ? `<div id="pb" hidden>${frameOf(b)}</div>` : ""}
<script>const ta=document.getElementById("ta"),tb=document.getElementById("tb");function sel(x){document.getElementById("pa").hidden=x!=="a";if(tb){document.getElementById("pb").hidden=x!=="b";tb.setAttribute("aria-pressed",x==="b");}ta.setAttribute("aria-pressed",x==="a");}ta.onclick=()=>sel("a");if(tb)tb.onclick=()=>sel("b");</script></body></html>`;
}

/* the page runtime on its own: plate-kit/relink.mjs swaps it (and a plate's model.js) into already-built, already-voiced plates */
export const RUNTIME_JS = RUNTIME;
export const CSS_TEXT = CSS;
