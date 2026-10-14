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
 --leaflet:#f6eadf;--leaflet-edge:#6b4b44;--accent:#0f6d6a;--open:#1c7a4a;--shut:#9a3a2e;
 --display:"Spectral",Georgia,"Times New Roman",serif;--body:"Public Sans",system-ui,-apple-system,"Segoe UI",sans-serif;--mono:"JetBrains Mono",ui-monospace,Consolas,monospace}
@media (prefers-color-scheme:dark){:root:not([data-theme="light"]){--ground:#0f1418;--sheet:#151c21;--ink:#e5eaee;--muted:#93a1ac;--hair:#2a343c;--wall:#8e4a4c;--wall-deep:#5f2d31;--wall-hi:#b26d6d;--fat:#6d5b36;
 --hot:#e0465a;--hot-lumen:#6e2a33;--hot-hi:#ff7482;--cold:#6a86d8;--cold-lumen:#2b3a66;--cold-hi:#8eaaff;--fluid:#1f2a33;--bed:#2b2a29;--leaflet:#efe3d6;--leaflet-edge:#2a1d1a;--accent:#4fc2bb;--open:#4fc28a;--shut:#ff8a77;color-scheme:dark}}
*{box-sizing:border-box}body{margin:0;background:var(--ground);color:var(--ink);font:14px/1.5 var(--body);padding:20px 16px 40px}
.wrap{max-width:1180px;margin:0 auto;display:grid;gap:14px}
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
@media (prefers-reduced-motion:reduce){*{transition:none!important}}`;

function frame({ meta, stageHtml, legendHtml }) {
  return `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>${esc(meta.title)}</title>
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Spectral:ital,wght@0,500;0,600;1,500&family=Public+Sans:wght@400;500;600&family=JetBrains+Mono:wght@400;500&display=swap">
<style>${CSS}</style></head><body>
<div class="wrap">
  <header><div class="fig">${esc(meta.figLabel || "Plate")}</div><h1>${esc(meta.title)} <em>${esc(meta.titleEm || "")}</em></h1><p class="sub">${esc(meta.sub || "")}</p></header>
  <section class="plate main"><div class="stage">${stageHtml}<div class="legend">${legendHtml || ""}</div></div>
    <div class="ledger"><div><div class="eyebrow">Phase</div><p class="phase" id="phase">—</p><div class="clock" id="clock"></div></div>
      <p class="why" id="why"></p><table id="gatesT"><thead><tr><th id="gatesH">Gate</th><th>Why</th><th class="r">State</th></tr></thead><tbody id="gates"></tbody></table>
      <div class="nums" id="nums"></div></div></section>
  <section class="plate tutor" aria-label="Tutor"><div class="eyebrow">Tutor</div><div class="say" id="say">Press “Tutor me” for a guided walk-through, or explore on your own.</div>
    <div class="steps" id="steps"></div><div><button id="tutor">▶ Tutor me</button> <button id="mute" aria-pressed="false">Voice on</button></div></section>
  <section class="plate"><div class="controls"><button id="play" aria-pressed="true">Pause</button><button id="prev">◀ Phase</button><button id="next">Phase ▶</button>
      <span class="lbl">Speed</span><div class="seg" id="speed"></div><span class="spacer"></span><button id="sound" aria-pressed="false" hidden>Sound off</button></div>
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
  // ledger
  const gates = M.gates || []; if (!gates.length) $("gatesT").hidden = true; else $("gatesH").textContent = M.gateTitle || "Gate";
  const grows = gates.map((g) => { const tr = document.createElement("tr"); tr.innerHTML = "<td></td><td class='g'></td><td class='r'><span class='pill'></span></td>"; tr.children[0].textContent = g.label; $("gates").appendChild(tr); return { g, d: tr.children[1], p: tr.querySelector(".pill") }; });
  const big = (M.readouts || []).filter((r) => r.big).slice(0, 4);
  big.forEach((r) => { const d = document.createElement("div"); d.className = "num"; d.innerHTML = "<div class='v'></div><div class='l'></div>"; d.lastChild.textContent = r.label + (r.unit ? ", " + r.unit : ""); r.el = d.firstChild; $("nums").appendChild(d); });
  $("notes").textContent = M.notes || "";
  const fmt = (v, d) => (typeof v === "number" ? v.toFixed(d ?? 0) : String(v ?? "—"));
  function ledger(i) { const s = S[i]; $("phase").textContent = s.phase; $("clock").textContent = "t = " + fmt(i * T / N, unit === "s" ? 3 : 1) + " " + unit + " of " + fmt(T, unit === "s" ? 3 : 1) + " " + unit + (M.clockNote ? " · " + M.clockNote : "");
    try { $("why").innerHTML = M.explain ? M.explain(s, i * T / N) : ""; } catch (e) { $("why").textContent = ""; }
    grows.forEach((r) => { let on = false; try { on = !!r.g.on(s); r.d.textContent = r.g.detail ? r.g.detail(s) : ""; } catch (_) {} r.p.textContent = on ? (M.onWord || "OPEN") : (M.offWord || "SHUT"); r.p.className = "pill " + (on ? "on" : "off"); });
    big.forEach((r) => { r.el.textContent = fmt(s.readouts[r.key], r.digits); }); }
  // chart
  const chart = $("chart"), CX0 = 58, CX1 = 985, xOf = (i) => CX0 + (CX1 - CX0) * i / N; let cursor;
  const lanes = (M.chart || []).slice(0, 3);
  function drawChart() { chart.innerHTML = ""; const g = K.el("g", {}, chart);
    BANDS.forEach((b, j) => { K.el("rect", { x: xOf(b.a), y: 4, width: xOf(b.b) - xOf(b.a), height: 300, fill: j % 2 ? "var(--ground)" : "var(--sheet)" }, g);
      if (xOf(b.b) - xOf(b.a) > 40) { const t = K.el("text", { x: (xOf(b.a) + xOf(b.b)) / 2, y: 322, "text-anchor": "middle" }, g); const room = Math.floor((xOf(b.b) - xOf(b.a) - 8) / 7), nm = (M.short && M.short[b.name]) || b.name; t.textContent = nm.length > room ? nm.slice(0, Math.max(3, room - 1)) + "…" : nm; } });
    const H = 296 / Math.max(1, lanes.length);
    lanes.forEach((ln, li) => { const y0 = 8 + li * H, y1 = y0 + H - 18; let lo = ln.min, hi = ln.max;
      if (lo == null || hi == null) { let a = Infinity, b = -Infinity; ln.series.forEach((sr) => S.forEach((s) => { const v = s.readouts[sr.key]; if (typeof v === "number" && isFinite(v)) { a = Math.min(a, v); b = Math.max(b, v); } })); const pad = (b - a) * 0.08 || 1; lo = lo ?? a - pad; hi = hi ?? b + pad; }
      const yv = (v) => y1 - (v - lo) / ((hi - lo) || 1) * (y1 - y0 - 8);
      [lo, hi].forEach((v) => { K.el("line", { x1: CX0, x2: CX1, y1: yv(v), y2: yv(v), stroke: "var(--hair)", "stroke-width": 0.8 }, g); K.el("text", { x: CX0 - 6, y: yv(v) + 4, "text-anchor": "end" }, g).textContent = fmt(v, Math.abs(hi - lo) < 5 ? 1 : 0); });
      K.el("text", { x: CX0 + 6, y: y0 + 12 }, g).textContent = ln.unit || ln.lane;
      ln.series.forEach((sr, k) => { let d = ""; S.forEach((s, i) => { const v = s.readouts[sr.key]; if (typeof v === "number" && isFinite(v)) d += (d ? "L" : "M") + K.f1(xOf(i)) + " " + K.f1(yv(v)); });
        const col = { hot: "var(--hot)", cold: "var(--cold)", accent: "var(--accent)", muted: "var(--muted)", ink: "var(--ink)" }[sr.tone] || ["var(--hot)", "var(--cold)", "var(--accent)", "var(--muted)"][k % 4];
        K.el("path", { d, fill: "none", stroke: col, "stroke-width": sr.dash ? 1.6 : 2.1, "stroke-dasharray": sr.dash ? "6 3" : "" }, g);
        const bi = Math.round(N * (0.12 + 0.27 * k)) % N, bv = S[bi].readouts[sr.key];
        const t = K.el("text", { x: xOf(bi) + 4, y: yv(typeof bv === "number" ? bv : lo) - 6 }, g); t.textContent = sr.label; t.setAttribute("style", "fill:var(--ink)"); }); });
    EV.forEach((ev) => { const i = Math.round(ev.t / T * N); K.el("line", { x1: xOf(i), x2: xOf(i), y1: 6, y2: 304, stroke: "var(--ink)", "stroke-width": 0.8, "stroke-dasharray": "2 3" }, g); const t = K.el("text", { x: xOf(i) + 4, y: 16 }, g); t.textContent = ev.label; t.setAttribute("style", "fill:var(--ink)"); });
    cursor = K.el("line", { x1: 0, x2: 0, y1: 2, y2: 306, stroke: "var(--accent)", "stroke-width": 2 }, chart); }
  drawChart(); matchMedia("(prefers-color-scheme: dark)").addEventListener("change", drawChart);
  // playback
  let t = (M.startAt || 0) * T, playing = !matchMedia("(prefers-reduced-motion: reduce)").matches, speed = (M.speeds || [0.25])[Math.min(1, (M.speeds || [0.25]).length - 1)], prevI = -1, sound = false, actx = null;
  const sp = $("speed"); (M.speeds || [0.1, 0.25, 0.5, 1]).forEach((v) => { const b = document.createElement("button"); b.textContent = v + "×"; b.dataset.s = v; b.setAttribute("aria-pressed", String(v === speed)); b.onclick = () => { speed = v; sp.querySelectorAll("button").forEach((x) => x.setAttribute("aria-pressed", String(x === b))); }; sp.appendChild(b); });
  if (EV.some((e) => e.sound)) $("sound").hidden = false;
  function thump(f) { if (!sound) return; try { actx = actx || new AudioContext(); const o = actx.createOscillator(), gN = actx.createGain(), now = actx.currentTime; o.frequency.setValueAtTime(f || 60, now); o.frequency.exponentialRampToValueAtTime(30, now + 0.12); gN.gain.setValueAtTime(0.0001, now); gN.gain.exponentialRampToValueAtTime(0.8, now + 0.01); gN.gain.exponentialRampToValueAtTime(0.0001, now + 0.15); o.connect(gN).connect(actx.destination); o.start(now); o.stop(now + 0.2); } catch (_) {} }
  const idx = () => Math.floor(((t % T + T) % T) / T * N) % N;
  function render(dBeat) { const i = idx(); if (TR) TR.set(S[i].parcel.part, S[i].parcel.u, parcelText(S[i])); try { scene.update(i, S[i], dBeat); } catch (e) { if (!window.__studio.sceneError) { window.__studio.sceneError = String(e.message); window.__studio.errors.push("scene.update: " + e.message); } }
    if (i !== prevI) { ledger(i); cursor.setAttribute("transform", "translate(" + K.f1(xOf(i)) + " 0)");
      if (playing && prevI >= 0) EV.forEach((ev) => { const k = Math.round(ev.t / T * N); if ((prevI < i && k > prevI && k <= i) || (prevI > i && (k > prevI || k <= i))) if (ev.sound) thump(ev.freq); }); prevI = i; }
    window.__studio.frames++; window.__studio.i = i; }
  let last = 0; function tick(now) { const dt = last ? Math.min((now - last) / 1000, 0.05) : 0; last = now; if (playing) { const d = dt * speed * (M.playRate || 1); t = (t + d) % T; render(d / T * (M.flowScale || 1)); } requestAnimationFrame(tick); }
  for (let k = 0; k < 90; k++) { t = (t + T / N * 2) % T; render(2 / N); } render(0); requestAnimationFrame(tick);
  const setPlaying = (p) => { playing = p; $("play").textContent = p ? "Pause" : "Play"; $("play").setAttribute("aria-pressed", String(p)); }; setPlaying(playing);
  $("play").onclick = () => setPlaying(!playing);
  function scrubTo(tt) { let d = tt - t; if (d > T / 2) d -= T; if (d < -T / 2) d += T; const n = Math.max(1, Math.ceil(Math.abs(d) / (T / N * 3))); for (let k = 0; k < n; k++) { t = ((t + d / n) % T + T) % T; render(d / n / T); } }
  function jump(dir) { setPlaying(false); const i = idx(); let b = BANDS.findIndex((x) => i >= x.a && i < x.b); b = dir > 0 ? (b + 1) % BANDS.length : (i - BANDS[b].a > 20 ? b : (b - 1 + BANDS.length) % BANDS.length); scrubTo((BANDS[b].a + 2) / N * T); }
  $("prev").onclick = () => jump(-1); $("next").onclick = () => jump(1);
  $("sound").onclick = (e) => { sound = !sound; e.currentTarget.setAttribute("aria-pressed", String(sound)); e.currentTarget.textContent = sound ? "Sound on" : "Sound off"; };
  let drag = false; const chartT = (ev) => { const r = chart.getBoundingClientRect(), x = (ev.clientX - r.left) / r.width * 1000; return Math.min(N - 1, Math.max(0, (x - CX0) / (CX1 - CX0) * N)) / N * T; };
  chart.addEventListener("pointerdown", (ev) => { drag = true; chart.setPointerCapture(ev.pointerId); setPlaying(false); scrubTo(chartT(ev)); });
  chart.addEventListener("pointermove", (ev) => { if (drag) scrubTo(chartT(ev)); }); chart.addEventListener("pointerup", () => drag = false);
  document.addEventListener("keydown", (ev) => { if (ev.key === " ") { ev.preventDefault(); setPlaying(!playing); } else if (ev.key === "ArrowRight") { ev.preventDefault(); jump(1); } else if (ev.key === "ArrowLeft") { ev.preventDefault(); jump(-1); } });
  // tutor: each step jumps to its phase, spotlights its parts and is read aloud (the app's voice when embedded)
  const steps = (LESSON && LESSON.steps) || []; let si = -1, tutoring = false, muted = false, sayId = 0;
  $("steps").innerHTML = steps.map((s, k) => "<button data-k='" + k + "'>" + (k + 1) + ". " + String(s.title || "").replace(/[<>&]/g, "") + "</button>").join("");
  const sentences = (x) => String(x || "").split(/(?<=[.!?])\\s+/).filter(Boolean);
  function voice(text, done) { if (muted) return setTimeout(done, 700 + text.length * 55); if (window.parent !== window) { const id = "s" + Math.random(); const h = (e) => { if (e.data && e.data.type === "mbx-said" && e.data.id === id) { window.removeEventListener("message", h); done(); } }; window.addEventListener("message", h); window.parent.postMessage({ type: "mbx-speak", id, text }, "*"); setTimeout(() => { window.removeEventListener("message", h); }, 30000); return; }
    try { const u = new SpeechSynthesisUtterance(text); u.lang = "en-GB"; u.onend = done; u.onerror = done; speechSynthesis.speak(u); } catch (_) { setTimeout(done, 800 + text.length * 55); } }
  function goStep(k) { si = k; const s = steps[k]; if (!s) return; $("steps").querySelectorAll("button").forEach((b, j) => b.classList.toggle("on", j === k));
    const band = BANDS.find((b) => b.name === s.phase); if (band) { scrubTo((band.a + 2) / N * T); } else if (typeof s.at === "number") scrubTo(s.at * T);
    setPlaying(true); speed = s.speed || 0.1; K.focus(s.focus || []);
    const parts = sentences(s.say), id = ++sayId; let j = 0;
    const next = () => { if (id !== sayId) return; if (j >= parts.length) { if (tutoring && k + 1 < steps.length) setTimeout(() => goStep(k + 1), 900); else { tutoring = false; $("tutor").textContent = "▶ Tutor me"; K.focus([]); } return; }
      $("say").innerHTML = parts.map((p, q) => "<span class='" + (q === j ? "on" : "") + "'>" + p.replace(/[<>&]/g, "") + "</span>").join(" "); voice(parts[j++], next); };
    next(); }
  $("steps").querySelectorAll("button").forEach((b) => b.onclick = () => { tutoring = false; goStep(+b.dataset.k); });
  $("tutor").onclick = () => { if (tutoring) { tutoring = false; sayId++; try { speechSynthesis.cancel(); } catch (_) {} $("tutor").textContent = "▶ Tutor me"; K.focus([]); return; } tutoring = true; $("tutor").textContent = "❚❚ Stop"; goStep(si < 0 || si >= steps.length - 1 ? 0 : si); };
  $("mute").onclick = (e) => { muted = !muted; e.currentTarget.textContent = muted ? "Voice off" : "Voice on"; e.currentTarget.setAttribute("aria-pressed", String(muted)); };
  window.__studio.ready = true;
}`;

/* Version A: the AI's own scene */
export function pageA({ meta, modelCode, sceneCode, lesson, legend }) {
  return frame({ meta, stageHtml: `<svg id="stage" viewBox="0 0 760 640" role="img" aria-label="${esc(meta.alt || meta.title)}"></svg>`, legendHtml: legend })
    + `<script>${KIT()}</script><script>${RUNTIME}</script><script>\n${safeScript(modelCode)}\n</script><script>\n${safeScript(sceneCode)}\n</script>`
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
