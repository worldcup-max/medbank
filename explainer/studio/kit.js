/* Explainer Studio kit — the drawing toolkit every generated explainer gets (window.K).
 * Distilled from the hand-built Four-Chamber Heart plate: tubes with walls and lumens, organic cavities that
 * deform with a model volume, valves with leaflets, particles that move along routes at the model's flow rates,
 * labels with halos that never pile on each other, and registered parts the lesson can spotlight. */
(function () {
  const NS = "http://www.w3.org/2000/svg";
  const f1 = (n) => Math.round(n * 10) / 10;
  const el = (tag, attrs = {}, parent) => { const e = document.createElementNS(NS, tag); for (const k in attrs) if (attrs[k] !== undefined) e.setAttribute(k, attrs[k]); if (parent) parent.appendChild(e); return e; };
  const lerp = (a, b, t) => a + (b - a) * t, mid = (a, b) => [(a[0] + b[0]) / 2, (a[1] + b[1]) / 2], clamp = (v, a, b) => Math.max(a, Math.min(b, v));
  const norm = (v) => { const L = Math.hypot(v[0], v[1]) || 1; return [v[0] / L, v[1] / L]; };
  function spline(pts, closed) {
    const n = pts.length; if (n < 2) return ""; const P = (i) => closed ? pts[(i + n) % n] : pts[Math.max(0, Math.min(n - 1, i))];
    let d = `M${f1(pts[0][0])} ${f1(pts[0][1])}`; const last = closed ? n : n - 1;
    for (let i = 0; i < last; i++) { const p0 = P(i - 1), p1 = P(i), p2 = P(i + 1), p3 = P(i + 2);
      d += `C${f1(p1[0] + (p2[0] - p0[0]) / 6)} ${f1(p1[1] + (p2[1] - p0[1]) / 6)} ${f1(p2[0] - (p3[0] - p1[0]) / 6)} ${f1(p2[1] - (p3[1] - p1[1]) / 6)} ${f1(p2[0])} ${f1(p2[1])}`; }
    return d + (closed ? "Z" : "");
  }
  function sampleSpline(pts, per = 10) {
    const out = [], n = pts.length, P = (i) => pts[Math.max(0, Math.min(n - 1, i))]; if (n < 2) return pts.slice();
    for (let i = 0; i < n - 1; i++) { const p0 = P(i - 1), p1 = P(i), p2 = P(i + 1), p3 = P(i + 2);
      const c1 = [p1[0] + (p2[0] - p0[0]) / 6, p1[1] + (p2[1] - p0[1]) / 6], c2 = [p2[0] - (p3[0] - p1[0]) / 6, p2[1] - (p3[1] - p1[1]) / 6];
      for (let k = 0; k < per; k++) { const t = k / per, m = 1 - t; out.push([m*m*m*p1[0] + 3*m*m*t*c1[0] + 3*m*t*t*c2[0] + t*t*t*p2[0], m*m*m*p1[1] + 3*m*m*t*c1[1] + 3*m*t*t*c2[1] + t*t*t*p2[1]]); } }
    out.push(pts[n - 1]); return out;
  }
  const TONE = { hot: ["var(--hot)", "var(--hot-lumen)"], cold: ["var(--cold)", "var(--cold-lumen)"], neutral: ["var(--wall-deep)", "var(--fluid)"], tissue: ["var(--wall-deep)", "var(--wall)"] };

  const K = { el, f1, lerp, mid, clamp, norm, spline, sampleSpline, NS };
  let svgRoot = null, top = null, defs = null; const LABELS = [], PARTS = {};
  K.init = (svg) => { svgRoot = svg; defs = el("defs", {}, svg); top = null; LABELS.length = 0; for (const k in PARTS) delete PARTS[k];
    const g = el("radialGradient", { id: "kTissue", cx: "45%", cy: "35%", r: "75%" }, defs); el("stop", { offset: "0", "stop-color": "var(--wall-hi)" }, g); el("stop", { offset: "1", "stop-color": "var(--wall)" }, g);
    const glow = el("filter", { id: "kGlow", x: "-30%", y: "-30%", width: "160%", height: "160%" }, defs); el("feGaussianBlur", { stdDeviation: "3", result: "b" }, glow); const m = el("feMerge", {}, glow); el("feMergeNode", { in: "b" }, m); el("feMergeNode", { in: "SourceGraphic" }, m);
  };
  /* back-to-front drawing layers: K.layers("bg","back","mid","front") → { bg:<g>, … } ; a "top" layer for labels is always added last */
  K.layers = (...names) => { const o = {}; names.forEach((n) => o[n] = el("g", { "data-layer": n }, svgRoot)); top = el("g", { "data-layer": "labels" }, svgRoot); o.labels = top; return o; };
  K.defs = () => defs;
  /* a tube: wall then lumen, along a smooth centreline (vessels, ducts, airways, tubules) */
  K.vessel = (parent, pts, r, opt = {}) => { const [wall, lumen] = TONE[opt.tone || "neutral"]; const d = spline(pts, false), cap = opt.cap || "round";
    const g = el("g", {}, parent); el("path", { d, fill: "none", stroke: opt.wall || "var(--wall-deep)", "stroke-width": 2 * r + (opt.wallWidth || 5), "stroke-linecap": cap, "stroke-linejoin": "round", opacity: 0.92 }, g);
    const l = el("path", { d, fill: "none", stroke: opt.lumen || lumen, "stroke-width": 2 * r, "stroke-linecap": cap, "stroke-linejoin": "round" }, g); g.lumen = l; return g; };
  /* a closed organic shape (chamber, cell, organ outline) whose points you can change every frame */
  K.blob = (parent, pts, opt = {}) => { const p = el("path", { d: spline(pts, true), fill: opt.fill || "url(#kTissue)", stroke: opt.stroke || "var(--wall-deep)", "stroke-width": opt.width || 1.4, "stroke-linejoin": "round", opacity: opt.opacity }, parent);
    p.set = (q) => p.setAttribute("d", spline(q, true)); return p; };
  /* deform points about a fixed line (a valve ring, a hilum…): far points scale by s, points on the line stay put */
  K.deformer = (A, B, reach, s) => { const M = mid(A, B), dx = B[0] - A[0], dy = B[1] - A[1], L = Math.hypot(dx, dy) || 1, nx = -dy / L, ny = dx / L;
    return (p) => { const d = Math.abs((p[0] - M[0]) * nx + (p[1] - M[1]) * ny), w = Math.min(1, d / reach * 2.2), f = 1 + (s - 1) * w; return [M[0] + (p[0] - M[0]) * f, M[1] + (p[1] - M[1]) * f]; }; };
  K.volumeScale = (V, Vref, k = 0.45) => Math.pow(Math.max(1e-6, V) / Vref, k);
  /* an exchange bed (capillaries, alveoli, glomerulus…) */
  K.bed = (parent, x, y, w, h, label, opt = {}) => { const g = el("g", {}, parent); el("rect", { x, y, width: w, height: h, rx: Math.min(h, w) / 2, fill: opt.fill || "var(--bed)", stroke: "var(--hair)" }, g);
    const n = Math.max(6, Math.round(w / 14)); for (let i = 0; i < n; i++) { const xx = x + 12 + i * (w - 24) / (n - 1); el("path", { d: `M${f1(xx)} ${y + 5} q 4 ${f1(h / 2 - 5)} 0 ${f1(h - 10)}`, fill: "none", stroke: i % 2 ? "var(--hot)" : "var(--cold)", "stroke-width": 0.8, opacity: 0.35 }, g); }
    if (label) K.label(x + w / 2, y + h + 13, label, "middle"); return g; };
  /* a valve or gate: two leaflets hinged at A and B. down = unit vector of forward flow. kind "av" (hangs open into the next space) or "sl" (cusps lie along the wall) */
  K.valve = (parent, A, B, down, kind = "sl") => { const g = el("g", {}, parent), half = Math.hypot(B[0] - A[0], B[1] - A[1]) / 2, M = mid(A, B);
    const outer = [0, 1].map(() => el("path", { fill: "none", stroke: "var(--leaflet-edge)", "stroke-width": 6, "stroke-linecap": "round" }, g)), inner = [0, 1].map(() => el("path", { fill: "none", stroke: "var(--leaflet)", "stroke-width": 3.4, "stroke-linecap": "round" }, g));
    for (const p of [A, B]) el("circle", { cx: p[0], cy: p[1], r: 3, fill: "var(--fat)", stroke: "var(--wall-deep)", "stroke-width": 1 }, g);
    const ring = el("circle", { cx: f1(M[0]), cy: f1(M[1]), r: 10, fill: "none", stroke: "var(--accent)", "stroke-width": 2, opacity: 0 }, g);
    g.tips = [A, B]; g.set = (o) => { o = clamp(o, 0, 1);
      [[A, B], [B, A]].forEach(([H], j) => { const toward = [(M[0] - H[0]) / half, (M[1] - H[1]) / half], len = kind === "av" ? half * 1.08 : half * 0.98;
        const cd = kind === "av" ? [toward[0] - down[0] * 0.18, toward[1] - down[1] * 0.18] : [toward[0] - down[0] * 0.35, toward[1] - down[1] * 0.35];
        const od = kind === "av" ? [down[0] + toward[0] * 0.18, down[1] + toward[1] * 0.18] : [down[0] + toward[0] * 0.08, down[1] + toward[1] * 0.08];
        const a0 = Math.atan2(cd[1], cd[0]); let a1 = Math.atan2(od[1], od[0]); while (a1 - a0 > Math.PI) a1 -= 2 * Math.PI; while (a1 - a0 < -Math.PI) a1 += 2 * Math.PI;
        const a = lerp(a0, a1, o), tip = [H[0] + Math.cos(a) * len, H[1] + Math.sin(a) * len]; g.tips[j] = tip;
        const side = (toward[0] * down[1] - toward[1] * down[0]) > 0 ? 1 : -1, bow = (kind === "av" ? 3.5 : -5) * side * (1 - o) + 1.5 * side * o, m = mid(H, tip), dx = tip[0] - H[0], dy = tip[1] - H[1], L = Math.hypot(dx, dy) || 1;
        const d = `M${f1(H[0])} ${f1(H[1])}Q${f1(m[0] - dy / L * bow)} ${f1(m[1] + dx / L * bow)} ${f1(tip[0])} ${f1(tip[1])}`; outer[j].setAttribute("d", d); inner[j].setAttribute("d", d); }); };
    g.flash = (v) => { ring.setAttribute("opacity", f1(v * 0.9)); ring.setAttribute("r", f1(10 + (1 - v) * 12)); };
    g.set(0); return g; };
  /* labels: small italic names with a halo. Collected, then K.settleLabels() moves any that overlap apart. */
  K.label = (x, y, text, anchor = "start", opt = {}) => { const t = el("text", { x: f1(x), y: f1(y), "text-anchor": anchor, class: "lab halo" + (opt.strong ? " strong" : "") }, opt.parent || top); t.textContent = text; LABELS.push(t); return t; };
  /* a big two-line tag (name + live value), e.g. "LV / 117 mmHg · 62 mL" */
  K.tag = (x, y, title) => { const t = el("text", { x: f1(x), y: f1(y), "text-anchor": "middle", class: "tag halo" }, top);
    t.innerHTML = `<tspan x="${f1(x)}" class="tagtitle">${title}</tspan><tspan x="${f1(x)}" dy="15"></tspan>`; LABELS.push(t); return { el: t, set: (s) => { t.lastChild.textContent = s; } }; };
  K.settleLabels = () => { for (let pass = 0; pass < 6; pass++) { let moved = false; const boxes = LABELS.map((t) => { try { return t.getBBox(); } catch (_) { return null; } });
      for (let i = 0; i < LABELS.length; i++) for (let j = i + 1; j < LABELS.length; j++) { const a = boxes[i], b = boxes[j]; if (!a || !b) continue;
        const ox = Math.min(a.x + a.width, b.x + b.width) - Math.max(a.x, b.x), oy = Math.min(a.y + a.height, b.y + b.height) - Math.max(a.y, b.y);
        if (ox > 2 && oy > 1) { const t = LABELS[j], dy = (b.y > a.y ? 1 : -1) * (oy + 2); t.setAttribute("y", f1(+t.getAttribute("y") + dy)); t.querySelectorAll("tspan").forEach((s) => { if (s.getAttribute("y")) s.setAttribute("y", f1(+s.getAttribute("y") + dy)); }); boxes[j] = t.getBBox(); moved = true; } }
      if (!moved) break; } };
  /* register a structure under a model part id so the lesson can spotlight it (K.focus) */
  K.part = (id, ...els) => { (PARTS[id] = PARTS[id] || []).push(...els); return els[0]; };
  K.parts = () => PARTS;
  K.focus = (ids) => { const on = new Set(ids || []); for (const id in PARTS) PARTS[id].forEach((e) => { e.style.transition = "opacity .5s, filter .5s"; e.style.opacity = on.size && !on.has(id) ? 0.35 : ""; e.style.filter = on.has(id) ? "url(#kGlow)" : ""; }); };
  /* particles flowing along routes. segments: { id: { pts, w (spread px), layer (<g>), rate(i,s) px-per-tick, gate?(i,s) 0..1 (closed below .25), tone: 0 cold … 1 hot | "up" | "down", warp?(p) } }
     routes: [[segId, …], …] closed loops or open paths. Call .update(i, s, dBeat) every frame. */
  K.flows = (segments, routes, opt = {}) => {
    const SEG = {}; for (const id in segments) { const s = segments[id], poly = sampleSpline(s.pts, 10), cum = [0]; for (let i = 1; i < poly.length; i++) cum.push(cum[i - 1] + Math.hypot(poly[i][0] - poly[i - 1][0], poly[i][1] - poly[i - 1][1])); SEG[id] = { ...s, id, poly, cum, len: cum[cum.length - 1] || 1 }; }
    let seed = 7; const rnd = () => ((seed = (seed * 16807) % 2147483647) / 2147483647);
    const P = []; const spacing = opt.spacing || 13;
    routes.forEach((r, ri) => { const L = r.reduce((t, id) => t + SEG[id].len, 0), n = Math.max(3, Math.round(L / spacing));
      for (let i = 0; i < n; i++) { let s = (i + rnd() * 0.6) * L / n, k = 0; while (k < r.length - 1 && s > SEG[r[k]].len) { s -= SEG[r[k]].len; k++; } const c = el("circle", { r: 0 }, SEG[r[k]].layer); P.push({ r: ri, k, s, off: rnd() * 2 - 1, gap: 3 + rnd() * 10, c }); } });
    const cs = getComputedStyle(document.documentElement), rgb = (v) => { const c = document.createElement("canvas").getContext("2d"); c.fillStyle = v; const h = c.fillStyle; return h[0] === "#" ? [1, 3, 5].map((i) => parseInt(h.slice(i, i + 2), 16)) : (h.match(/\d+/g) || [128, 128, 128]).slice(0, 3).map(Number); };
    const RAMP = []; const C0 = rgb(cs.getPropertyValue("--cold-hi").trim() || "#4f78e6"), C1 = rgb(cs.getPropertyValue("--hot-hi").trim() || "#ff5a68");
    for (let i = 0; i <= 16; i++) RAMP.push(`rgb(${C0.map((v, j) => Math.round(lerp(v, C1[j], i / 16))).join(",")})`);
    function at(sg, s) { const c = sg.cum; let lo = 0, hi = c.length - 1; s = clamp(s, 0, sg.len); while (hi - lo > 1) { const m = (lo + hi) >> 1; if (c[m] <= s) lo = m; else hi = m; }
      const a = sg.poly[lo], b = sg.poly[hi], t = (s - c[lo]) / ((c[hi] - c[lo]) || 1), dx = b[0] - a[0], dy = b[1] - a[1], L = Math.hypot(dx, dy) || 1; return [a[0] + dx * t, a[1] + dy * t, -dy / L, dx / L]; }
    return { update(i, st, dBeat) {
      for (const p of P) { const route = routes[p.r]; let sg = SEG[route[p.k]];
        if (dBeat) { p.s += Math.max(0, sg.rate(i, st)) * dBeat * (opt.speed || 1500); let guard = 0;
          while (p.s > sg.len && guard++ < 4) { if (sg.gate && sg.gate(i, st) < 0.25) { p.s = Math.min(p.s, sg.len - p.gap); break; } if (p.k === route.length - 1 && opt.open) { p.k = 0; p.s = 0; sg = SEG[route[0]]; break; } p.s -= sg.len; p.k = (p.k + 1) % route.length; sg = SEG[route[p.k]]; }
          if (sg.gate && sg.gate(i, st) < 0.25 && p.s > sg.len - p.gap) p.s = Math.max(0, sg.len - p.gap); }
        sg = SEG[route[p.k]]; let [x, y, nx, ny] = at(sg, p.s); const taper = Math.min(1, p.s / 14, (sg.len - p.s) / 14 + 0.25); x += nx * p.off * (sg.w || 6) * taper; y += ny * p.off * (sg.w || 6) * taper;
        if (sg.warp) [x, y] = sg.warp([x, y], i, st);
        const tone = sg.tone === "up" ? p.s / sg.len : sg.tone === "down" ? 1 - p.s / sg.len : (sg.tone ?? 0);
        if (p.c.parentNode !== sg.layer) sg.layer.appendChild(p.c);
        p.c.setAttribute("cx", f1(x)); p.c.setAttribute("cy", f1(y)); p.c.setAttribute("r", opt.r || 2.5); p.c.setAttribute("fill", RAMP[Math.round(clamp(tone, 0, 1) * 16)]); } } };
  };
  window.K = K;
})();
