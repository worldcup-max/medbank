/* The juxtamedullary nephron, unfolded through cortex and medulla, driven by the filtrate-parcel model. */
function createScene(svg, K, M, S) {
  const L = K.layers("bg", "zones", "vessels", "glow", "tubes", "fx", "front", "inset");
  const el = K.el, f1 = K.f1, clamp = K.clamp;
  const Y0 = 236, Y1 = 600, yOfZ = (z) => Y0 + (Y1 - Y0) * z, G = [215, 100];
  /*GEO*/
  const arc = (r, a0, a1, n) => Array.from({ length: n }, (_, k) => { const a = (a0 + (a1 - a0) * k / (n - 1)) * Math.PI / 180; return [215 + r * Math.cos(a), 100 + r * Math.sin(a)]; });
  const PATHS = {
    bowman: arc(35, -40, -205, 7).concat([[177, 124]]),
    pct: [[177, 124], [160, 136], [140, 134], [128, 114], [136, 92], [126, 70], [100, 62], [76, 74], [72, 100], [92, 116], [96, 140], [76, 158], [56, 172], [52, 198], [72, 214], [100, 206], [118, 186], [142, 182], [160, 204], [186, 228], [206, 248], [212, 268]],
    tdl: [[212, 268], [212, 340], [213, 430], [214, 520], [216, 566], [224, 588], [240, 598], [256, 592]],
    tal: [[256, 592], [266, 576], [276, 540], [281, 470], [282, 380], [282, 290], [282, 210], [283, 160], [280, 124], [268, 104]],
    dct: [[268, 104], [284, 88], [306, 76], [334, 80], [346, 104], [334, 128], [344, 154], [370, 160], [388, 138], [382, 110], [398, 86], [426, 84], [440, 108], [432, 136], [442, 166], [468, 178], [498, 162], [518, 138], [530, 124]],
    cd: [[530, 124], [541, 138], [543, 190], [543, 250], [544, 340], [546, 440], [548, 530], [550, 604]],
  };
  /*ENDGEO*/
  const ORDER = ["bowman", "pct", "tdl", "tal", "dct", "cd"];
  const TUBE = { pct: [6, 8], tdl: [3.2, 2], tal: [6.5, 9], dct: [5, 6], cd: [7.5, 6] };   // lumen radius, epithelium thickness

  // ---- zones: renal capsule, cortex, outer and inner medulla; the interstitial gradient is built from the model's own values
  const gr = el("linearGradient", { id: "nInt", x1: 0, y1: 0, x2: 0, y2: 1, gradientUnits: "userSpaceOnUse" }, K.defs());
  gr.setAttribute("y1", Y0); gr.setAttribute("y2", 616);
  const prof = []; S.forEach((s) => { if (s.parcel.part === "cd" && s.readouts.depth > 0) prof.push([yOfZ(s.readouts.depth), s.readouts.intOsm]); });
  prof.sort((a, b) => a[0] - b[0]); const pick = [prof[0]]; prof.forEach((p) => { if (p[0] - pick[pick.length - 1][0] > 30) pick.push(p); }); pick.push(prof[prof.length - 1]);
  [[Y0, 300]].concat(pick, [[616, pick[pick.length - 1][1]]]).forEach(([y, v]) => el("stop", { offset: f1((y - Y0) / (616 - Y0) * 100) + "%", "stop-color": "var(--hot-hi)", "stop-opacity": f1(0.02 + 0.42 * (v - 300) / 900 * 100) / 100 }, gr));
  el("rect", { x: 20, y: 24, width: 720, height: Y0 - 24, fill: "var(--bed)", opacity: 0.55 }, L.bg);
  el("path", { d: "M20 24H740", stroke: "var(--wall-deep)", "stroke-width": 2.5, opacity: 0.6 }, L.bg);
  const MED = `M20 ${Y0}H740V598Q740 608 728 608H574Q560 609 556 618Q550 624 544 618Q540 609 526 608H32Q20 608 20 596Z`;
  el("path", { d: MED, fill: "var(--bed)", opacity: 0.35 }, L.bg);
  const medFill = K.part("interstitium", el("path", { d: MED, fill: "url(#nInt)" }, L.zones));
  el("path", { d: `M20 ${yOfZ(0.5)}H700`, stroke: "var(--muted)", "stroke-width": 0.8, "stroke-dasharray": "2 5", opacity: 0.6 }, L.zones);
  let seed = 11; const rnd = () => ((seed = (seed * 16807) % 2147483647) / 2147483647);
  for (let k = 0; k < 70; k++) { const x = 30 + rnd() * 700, y = 34 + rnd() * (Y0 - 50); if (Math.hypot(x - G[0], y - G[1]) < 58 || (x > 566)) continue;
    el("ellipse", { cx: f1(x), cy: f1(y), rx: f1(5 + rnd() * 4), ry: f1(4 + rnd() * 3), fill: "none", stroke: "var(--wall-hi)", "stroke-width": 1.6, opacity: 0.32 }, L.bg); }
  for (let x = 34; x < 700; x += 23) { if (x > 196 && x < 300) continue; el("path", { d: `M${x} ${Y0 + 12 + (x * 7) % 40}V${560 - (x * 13) % 120}`, stroke: "var(--wall-hi)", "stroke-width": 3, "stroke-linecap": "round", opacity: 0.18 }, L.bg); }
  K.label(30, 40, "Cortex", "start", { strong: true }); K.label(30, Y0 + 40, "Outer medulla", "start", { strong: true }); K.label(30, yOfZ(0.5) + 18, "Inner medulla", "start", { strong: true });

  // ---- blood: arcuate and interlobular vessels, afferent and efferent arterioles, peritubular capillaries, vasa recta
  K.vessel(L.vessels, [[20, Y0 + 3], [740, Y0 + 3]], 3, { tone: "hot", cap: "butt", wallWidth: 2 });
  K.vessel(L.vessels, [[20, Y0 + 13], [740, Y0 + 13]], 3.6, { tone: "cold", cap: "butt", wallWidth: 1.6 });
  K.vessel(L.vessels, [[488, Y0], [488, 36]], 3.5, { tone: "hot", wallWidth: 2.5 }); K.vessel(L.vessels, [[502, Y0 + 12], [502, 36]], 4.5, { tone: "cold", wallWidth: 2 });
  const AFF = [[488, 40], [430, 36], [360, 38], [300, 46], [262, 56], [238, 70]], EFF = [[236, 112], [252, 126], [254, 160], [251, 210], [249, Y0 + 20]];
  K.part("aff", K.vessel(L.front, AFF, 4.5, { tone: "hot", wallWidth: 5 }));
  for (let k = 0; k < 5; k++) { const p = [246 + k * 6, 66 - k * 2.6]; K.part("aff", el("circle", { cx: f1(p[0]), cy: f1(p[1]), r: 2.3, fill: "var(--fat)", stroke: "var(--wall-deep)", "stroke-width": 0.6 }, L.front)); }
  K.part("eff", K.vessel(L.vessels, EFF, 3.2, { tone: "hot", wallWidth: 3 }));
  const ptc = [];
  [[[40, 50], [70, 44], [98, 50], [118, 40], [150, 46]], [[34, 90], [56, 84], [64, 120], [44, 140]], [[110, 92], [116, 130], [104, 160], [120, 172]], [[36, 214], [60, 230], [96, 222], [130, 230], [160, 222]],
   [[300, 112], [316, 104], [322, 140], [312, 176], [326, 196]], [[358, 96], [364, 126], [356, 140], [404, 168], [420, 196]], [[408, 112], [416, 136], [460, 140], [470, 120]], [[318, 60], [360, 62], [374, 90], [412, 70], [460, 66]], [[300, 214], [350, 206], [392, 222], [440, 210], [470, 222]]]
    .forEach((pts, k) => ptc.push(K.part("ptc", K.vessel(L.vessels, pts, 1.7, { tone: k % 2 ? "cold" : "hot", wallWidth: 1.2 }))));
  ptc.forEach((g) => g.setAttribute("opacity", 0.55));
  const VR = [[249, Y0 + 20, 562, 237], [330, Y0 + 3, 430, 341], [380, Y0 + 3, 520, 391], [430, Y0 + 3, 590, 441]];
  VR.forEach(([x, y, d, x2]) => { const h = (x2 - x) / 2, mx = (x + x2) / 2;
    K.part("vr", K.vessel(L.vessels, [[x, y], [x - 1, (y + d) / 2], [x, d - 12], [mx, d]], 1.7, { tone: "hot", wallWidth: 1.2 }));
    K.part("vr", K.vessel(L.vessels, [[mx, d], [x2, d - 12], [x2 + 1, (Y0 + d) / 2], [x2, Y0 + 14]], 2.1, { tone: "cold", wallWidth: 1.2 })); });
  const bloodRate = (id) => (i, s) => 0.15 + 0.5 * (s.parts[id].flow || 0);
  const blood = K.flows({ aff: { pts: AFF.slice(0, -1).concat([[226, 82]]), w: 2, layer: L.front, rate: bloodRate("aff"), tone: 1 },
    eff: { pts: EFF, w: 1.5, layer: L.vessels, rate: bloodRate("eff"), tone: 0.8 },
    dvr: { pts: [[249, Y0 + 20], [248, 400], [249, 550], [243, 562]], w: 0.8, layer: L.vessels, rate: bloodRate("vr"), tone: "down" },
    avr: { pts: [[243, 562], [237, 550], [238, 400], [237, Y0 + 14]], w: 0.8, layer: L.vessels, rate: bloodRate("vr"), tone: 0 } },
    [["aff"], ["eff", "dvr", "avr"]], { open: true, spacing: 16, r: 1.8, speed: 900 });

  // ---- the glomerulus: Bowman's capsule (parietal layer + urinary space) around a lobulated capillary tuft
  K.part("bowman", el("circle", { cx: G[0], cy: G[1], r: 44, fill: "var(--fluid)", stroke: "var(--wall-deep)", "stroke-width": 3.5 }, L.tubes));
  K.part("bowman", el("circle", { cx: G[0], cy: G[1], r: 41, fill: "none", stroke: "var(--wall-hi)", "stroke-width": 1.2, "stroke-dasharray": "3 3" }, L.tubes));
  const tuft = el("g", {}, L.tubes); K.part("glom", tuft);
  el("circle", { cx: G[0], cy: G[1], r: 12, fill: "var(--wall-hi)", opacity: 0.8 }, tuft);
  for (let k = 0; k < 8; k++) { const a = k / 8 * 2 * Math.PI + 0.3, cx = G[0] + 17 * Math.cos(a), cy = G[1] + 17 * Math.sin(a), q = [];
    for (let j = 0; j < 7; j++) { const b = a + (j / 7) * 2 * Math.PI, rr = 9 + 2.5 * Math.cos(3 * (b - a)); q.push([cx + rr * Math.cos(b), cy + rr * Math.sin(b)]); }
    K.blob(tuft, q, { fill: k % 2 ? "var(--hot-lumen)" : "var(--cold-lumen)", stroke: "var(--hot)", width: 1.6 });
    el("path", { d: K.spline([[cx - 4 * Math.cos(a + 1), cy - 4 * Math.sin(a + 1)], [cx + 5 * Math.cos(a), cy + 5 * Math.sin(a)], [cx + 4 * Math.cos(a + 1), cy + 4 * Math.sin(a + 1)]]), fill: "none", stroke: "var(--hot)", "stroke-width": 0.8, opacity: 0.6 }, tuft);
    el("circle", { cx: f1(G[0] + 27 * Math.cos(a + 0.4)), cy: f1(G[1] + 27 * Math.sin(a + 0.4)), r: 2.2, fill: "var(--wall)", stroke: "var(--wall-deep)", "stroke-width": 0.5 }, tuft); }

  // ---- the tubule: one continuous tube, each segment with its own epithelium; lumen tinted by the parcel's osmolality there
  const glow = {}, chunks = [], arrows = {}, POLY = {}, CUM = {}; let total = 0; const START = {};
  const osmAt = {}; S.forEach((s) => { (osmAt[s.parcel.part] = osmAt[s.parcel.part] || []).push([s.parcel.u, s.readouts.osm]); });
  const lookOsm = (id, u) => { const a = osmAt[id]; if (!a) return 300; let best = a[0]; for (const p of a) if (Math.abs(p[0] - u) < Math.abs(best[0] - u)) best = p; return best[1]; };
  const osmColor = (o) => o >= 300 ? `color-mix(in srgb, var(--hot-hi) ${Math.round(8 + 84 * (o - 300) / 900)}%, var(--fluid))` : `color-mix(in srgb, var(--cold-hi) ${Math.round(70 * (300 - o) / 220)}%, var(--fluid))`;
  ORDER.forEach((id) => { const q = K.sampleSpline(PATHS[id], 12), cum = [0]; for (let i = 1; i < q.length; i++) cum.push(cum[i - 1] + Math.hypot(q[i][0] - q[i - 1][0], q[i][1] - q[i - 1][1]));
    POLY[id] = q; CUM[id] = cum; START[id] = total; total += cum[cum.length - 1]; });
  const at = (id, u) => { const q = POLY[id], c = CUM[id], Lh = c[c.length - 1] * clamp(u, 0, 1); let k = 1; while (k < c.length - 1 && c[k] < Lh) k++;
    const a = q[k - 1], b = q[k], t = (Lh - c[k - 1]) / ((c[k] - c[k - 1]) || 1), n = K.norm([b[0] - a[0], b[1] - a[1]]); return [K.lerp(a[0], b[0], t), K.lerp(a[1], b[1], t), -n[1], n[0]]; };
  for (const id in TUBE) { const [r, w] = TUBE[id], pts = PATHS[id];
    glow[id] = K.part(id, el("path", { d: K.spline(pts), fill: "none", stroke: "var(--accent)", "stroke-width": 2 * r + w + 12, "stroke-linecap": "round", "stroke-linejoin": "round", opacity: 0, filter: "url(#kGlow)" }, L.glow));
    el("path", { d: K.spline(pts), fill: "none", stroke: "var(--wall-deep)", "stroke-width": 2 * r + w + 2.4, "stroke-linecap": "round", "stroke-linejoin": "round" }, L.tubes);
    K.part(id, K.vessel(L.tubes, pts, r, { wall: id === "tdl" ? "var(--wall-hi)" : "var(--wall)", wallWidth: w }));
    const q = POLY[id], c = CUM[id], Lt = c[c.length - 1];
    for (let i = 0; i + 2 < q.length; i += 2) { const u = c[i + 1] / Lt; const ch = el("path", { d: `M${f1(q[i][0])} ${f1(q[i][1])}L${f1(q[i + 1][0])} ${f1(q[i + 1][1])}L${f1(q[i + 2][0])} ${f1(q[i + 2][1])}`, fill: "none", "stroke-width": 2 * r, "stroke-linejoin": "round", style: "stroke:" + osmColor(lookOsm(id, u)), opacity: 0.14 }, L.tubes); ch.g = START[id] + c[i]; ch.on = false; chunks.push(ch); }
    // epithelial nuclei along both walls (cuboidal in PCT/TAL/DCT/CD, flat in the thin limb)
    for (let sAt = 6; sAt < Lt - 4; sAt += id === "tdl" ? 22 : 11) { const [x, y, nx, ny] = at(id, sAt / Lt), side = (Math.round(sAt / 11) % 2) ? 1 : -1, o = r + w / 2;
      el("ellipse", { cx: f1(x + nx * o * side), cy: f1(y + ny * o * side), rx: id === "tdl" ? 2.4 : 1.7, ry: id === "tdl" ? 0.9 : 1.6, fill: "var(--wall-deep)", opacity: 0.55, transform: `rotate(${f1(Math.atan2(ny, nx) * 180 / Math.PI)} ${f1(x + nx * o * side)} ${f1(y + ny * o * side)})` }, L.tubes); } }
  // PCT brush border: a fringe of microvilli lining the lumen
  el("path", { d: K.spline(PATHS.pct), fill: "none", stroke: "var(--wall-hi)", "stroke-width": 11.6, "stroke-dasharray": "1 1.6", opacity: 0.9 }, L.tubes);
  el("path", { d: K.spline(PATHS.pct), fill: "none", stroke: "var(--fluid)", "stroke-width": 7.2, opacity: 0.85 }, L.tubes);
  const pctTint = []; for (const ch of chunks) if (ch.g < START.tdl && ch.g >= START.pct) { const c2 = ch.cloneNode(); c2.setAttribute("stroke-width", 7.2); c2.g = ch.g; L.tubes.appendChild(c2); pctTint.push(c2); }
  chunks.push(...pctTint);
  // thin limb to thick limb transition at the bend, then the tall cells of the macula densa facing the glomerulus
  K.part("md", el("path", { d: K.spline([[283, 150], [280, 124], [268, 104]]), fill: "none", stroke: "var(--wall-deep)", "stroke-width": 4, "stroke-dasharray": "2 1.4", opacity: 0.9, transform: "translate(-7 1)" }, L.front));
  for (let k = 0; k < 6; k++) { const [x, y, nx, ny] = at("tal", 0.86 + k * 0.022); K.part("md", el("ellipse", { cx: f1(x - nx * 9), cy: f1(y - ny * 9), rx: 2.6, ry: 1.3, fill: "var(--wall-deep)", transform: `rotate(${f1(Math.atan2(ny, nx) * 180 / Math.PI)} ${f1(x - nx * 9)} ${f1(y - ny * 9)})` }, L.front)); }
  K.part("cd", K.vessel(L.tubes, [[543, 30], [542, 90], [541, 138]], 7.5, { wall: "var(--wall)", wallWidth: 6, cap: "butt" }));
  K.part("cd", el("path", { d: "M560 214Q568 210 576 214", fill: "none" }, L.tubes));

  // ---- where water and salt leave each segment (lit while the parcel is there)
  const ARW = { pct: ["w", "s"], tdl: ["w"], tal: ["s"], dct: ["s"], cd: ["w"] };
  for (const id in ARW) { const g = el("g", { opacity: 0.15 }, L.fx); arrows[id] = K.part(id, g); const r = TUBE[id][0] + TUBE[id][1] / 2 + 3, n = id === "pct" ? 9 : id === "dct" ? 6 : 8;
    for (let k = 0; k < n; k++) { const u = (k + 0.5) / n, kind = ARW[id][k % ARW[id].length]; let side = k % 2 ? 1 : -1;
      if (id === "tal") side = 1; if (id === "tdl") side = 1; if (id === "cd") side = (u < 0.15) ? -1 : 1;
      const [x, y, nx, ny] = at(id, u), x0 = x + nx * r * side, y0 = y + ny * r * side, x1 = x0 + nx * 13 * side, y1 = y0 + ny * 13 * side, hx = nx * side, hy = ny * side;
      el("path", { d: `M${f1(x0)} ${f1(y0)}L${f1(x1)} ${f1(y1)}M${f1(x1 - hx * 4 - hy * 3)} ${f1(y1 - hy * 4 + hx * 3)}L${f1(x1)} ${f1(y1)}L${f1(x1 - hx * 4 + hy * 3)} ${f1(y1 - hy * 4 - hx * 3)}`, fill: "none", stroke: kind === "w" ? "var(--cold-hi)" : "var(--hot-hi)", "stroke-width": 1.8, "stroke-linecap": "round", "stroke-linejoin": "round" }, g); } }

  // ---- the parcel itself: a slug of fluid whose length shrinks with the volume left, tinted by its osmolality
  const slugO = el("path", { fill: "none", stroke: "var(--accent)", "stroke-linecap": "round", "stroke-linejoin": "round", opacity: 0.9 }, L.fx);
  const slug = el("path", { fill: "none", "stroke-linecap": "round", "stroke-linejoin": "round" }, L.fx);
  const drops = []; for (let k = 0; k < 90; k++) drops.push({ c: el("circle", { r: 0, opacity: 0 }, L.fx), life: 0 });
  let accW = 0, accS = 0;
  const findPart = (g) => { let id = ORDER[0]; for (const p of ORDER) if (g >= START[p]) id = p; return id; };
  const posAt = (g) => { const id = findPart(g), Lt = CUM[id][CUM[id].length - 1]; return at(id, (g - START[id]) / Lt); };

  // ---- depth gauge: interstitial osmolality ruler, a level line at the parcel's depth, and a live tag
  const RX = 722; el("path", { d: `M${RX} ${Y0}V${Y1}`, stroke: "var(--ink)", "stroke-width": 1, opacity: 0.6 }, L.front);
  [300, 600, 900, 1200].forEach((v) => { const y = yOfZ((v - 300) / 900); el("path", { d: `M${RX - 4} ${f1(y)}H${RX + 4}`, stroke: "var(--ink)", "stroke-width": 1 }, L.front); const t = el("text", { x: RX + 7, y: f1(y + 3.5), class: "lab" }, L.front); t.textContent = v; });
  const unitT = el("text", { x: RX + 14, y: Y0 - 8, class: "lab", "text-anchor": "end" }, L.front); unitT.textContent = "mOsm/kg";
  const level = el("path", { d: "", stroke: "var(--accent)", "stroke-width": 1, "stroke-dasharray": "3 4", opacity: 0 }, L.front);
  const pip = el("circle", { cx: RX, r: 4, fill: "var(--accent)", stroke: "var(--sheet)", "stroke-width": 1.5 }, L.front);
  const intTag = K.tag(662, 300, "Interstitium");

  // ---- key for the lumen tint (same colour law as the tubule)
  const KX = 34, KY = 572; for (let k = 0; k < 28; k++) { const v = k < 8 ? 80 + k * 220 / 8 : 300 + (k - 8) * 900 / 19; el("rect", { x: KX + k * 5, y: KY, width: 5.4, height: 8, style: "fill:" + osmColor(v) }, L.front); }
  el("rect", { x: KX, y: KY, width: 140, height: 8, fill: "none", stroke: "var(--wall-deep)", "stroke-width": 0.6 }, L.front);
  [[KX, "100", "start"], [KX + 40, "300", "middle"], [KX + 140, "1200", "end"]].forEach(([x, t, a]) => { const e = el("text", { x, y: KY + 19, "text-anchor": a, class: "lab" }, L.front); e.textContent = t; });
  { const e = el("text", { x: KX, y: KY - 5, class: "lab strong" }, L.front); e.textContent = "Tubular fluid, mOsm/kg"; }

  // ---- labels
  [[215, 162, "Glomerulus", "middle"], [215, 175, "Bowman's capsule", "middle"], [380, 62, "Afferent arteriole", "middle"], [244, 206, "efferent arteriole", "end"],
   [200, 480, "Thin descending limb", "end"], [294, 552, "Thick ascending limb", "start"], [408, 222, "Distal convoluted tubule", "middle"], [532, 300, "Collecting duct", "end"],
   [30, 182, "Proximal tubule", "start"], [336, 452, "Vasa recta", "middle"], [300, 186, "macula densa", "start"], [548, 632, "papilla, to calyx", "middle"],
   [470, 30, "Peritubular capillaries", "end"], [300, Y0 + 32, "Arcuate artery & vein", "start"], [200, 418, "water out", "end"], [294, 418, "NaCl out", "start"], [532, 520, "water out (ADH)", "end"]]
    .forEach(([x, y, t, a]) => K.label(x, y, t, a));
  el("path", { d: "M298 182L272 116", stroke: "var(--muted)", "stroke-width": 0.7 }, L.front);

  // ---- inset: the epithelium of the segment the parcel is in, with its transporters
  const IX = 572, IY = 30, IW = 166, IH = 192, inset = el("g", {}, L.inset);
  el("rect", { x: IX, y: IY, width: IW, height: IH, rx: 8, fill: "var(--sheet)", stroke: "var(--hair)" }, inset);
  const tx = (p, x, y, t, o = {}) => { const e = el("text", { x, y, "text-anchor": o.a || "start", style: `font:${o.it ? "italic " : ""}${o.w || 400} ${o.s || 9}px var(--body);fill:${o.c || "var(--muted)"}` }, p); e.textContent = t; return e; };
  tx(inset, IX + 10, IY + 14, "THE CELL WALL HERE", { s: 8.5, w: 600 }); const cap = tx(inset, IX + 10, IY + 28, "", { s: 11, w: 600, c: "var(--ink)" });
  tx(inset, 594, IY + 44, "lumen", { s: 8, it: true, a: "middle" }); tx(inset, 714, IY + 44, "blood", { s: 8, it: true, a: "middle" });
  el("rect", { x: 696, y: IY + 50, width: 36, height: 118, rx: 4, fill: "var(--hot-lumen)", opacity: 0.5 }, inset);
  const arrowP = (p, x0, y0, x1, kind) => { const col = { na: "var(--hot-hi)", w: "var(--cold-hi)", k: "var(--accent)" }[kind], dir = Math.sign(x1 - x0);
    return el("path", { d: `M${x0} ${y0}H${x1}M${x1 - dir * 4} ${y0 - 3}L${x1} ${y0}L${x1 - dir * 4} ${y0 + 3}`, fill: "none", stroke: col, "stroke-width": 1.7, "stroke-linecap": "round", "stroke-linejoin": "round" }, p); };
  const CELL = {
    bowman: { name: "Filtration barrier", w: 0, ap: [], ar: [[96, "w", 730, 586], [124, "na", 730, 586]], notes: ["NFP = 55 − 15 − 30", "= 10 mmHg  ·  GFR 125 mL/min"] },
    pct: { name: "Proximal tubule cell", w: 74, micro: true, ap: [[92, "SGLT2"], [118, "NHE3"], [146, "AQP1"]], pump: 104, ar: [[92, "na", 584, 728], [146, "w", 584, 728]], notes: ["65% of Na⁺ and water out,", "all glucose: iso-osmotic, 300"] },
    tdl: { name: "Thin descending limb", w: 24, ap: [[100, "AQP1"], [140, "AQP1"]], ar: [[100, "w", 584, 728], [140, "w", 584, 728]], notes: ["water only: no salt route,", "fluid climbs to ~1200"] },
    tal: { name: "Thick ascending limb", w: 74, mito: true, ap: [[92, "NKCC2"], [124, "ROMK"]], pump: 104, ar: [[92, "na", 584, 728], [124, "k", 640, 590]], notes: ["Na⁺ K⁺ 2Cl⁻ out, no aquaporins;", "furosemide blocks NKCC2"] },
    dct: { name: "Distal convoluted tubule", w: 70, mito: true, ap: [[96, "NCC"]], pump: 112, ar: [[96, "na", 584, 728]], notes: ["Na⁺ Cl⁻ out, water-tight;", "thiazide-sensitive"] },
    cd: { name: "Principal cell, ADH on", w: 70, ap: [[88, "ENaC"], [114, "ROMK"], [146, "AQP2"]], pump: 100, adh: 146, ar: [[88, "na", 584, 728], [114, "k", 640, 590], [146, "w", 584, 728]], notes: ["aldosterone: Na⁺ in, K⁺ out", "ADH inserts AQP2: water out"] },
  };
  const cellG = {}, cellA = {}; let shown = null;
  for (const id in CELL) { const c = CELL[id], g = el("g", { display: "none" }, inset); cellG[id] = g; cellA[id] = [];
    if (id === "bowman") { el("path", { d: `M688 ${IY + 52}V${IY + 150}`, stroke: "var(--hot)", "stroke-width": 1.5, "stroke-dasharray": "5 2" }, g); el("path", { d: `M678 ${IY + 52}V${IY + 150}`, stroke: "var(--wall-deep)", "stroke-width": 4 }, g);
      for (let y = IY + 55; y < IY + 150; y += 7) el("circle", { cx: 670, cy: y, r: 3, fill: "var(--wall-hi)", stroke: "var(--wall-deep)", "stroke-width": 0.6 }, g);
      tx(g, 690, IY + 163, "podocytes · GBM · endothelium", { s: 7.5, a: "end", it: true }); }
    else { const x0 = 692 - c.w; el("rect", { x: x0, y: IY + 50, width: c.w, height: 118, rx: 5, fill: "var(--wall-hi)", opacity: 0.7, stroke: "var(--wall-deep)" }, g);
      el("ellipse", { cx: x0 + c.w / 2, cy: IY + 148, rx: Math.min(13, c.w / 2 - 3), ry: c.w < 30 ? 6 : 10, fill: "var(--wall)", stroke: "var(--wall-deep)", "stroke-width": 0.8 }, g);
      if (c.micro) for (let y = IY + 53; y < IY + 166; y += 3.5) el("path", { d: `M${x0} ${y}h-9`, stroke: "var(--wall-hi)", "stroke-width": 1.6, "stroke-linecap": "round" }, g);
      if (c.mito) for (let k = 0; k < 8; k++) el("ellipse", { cx: 680 - (k % 2) * 10, cy: IY + 60 + k * 13, rx: 4.5, ry: 2, fill: "var(--fat)", stroke: "var(--wall-deep)", "stroke-width": 0.5 }, g);
      c.ap.forEach(([y, n]) => { el("circle", { cx: x0, cy: y, r: 5, fill: "var(--accent)", stroke: "var(--sheet)", "stroke-width": 1 }, g); tx(g, x0 + 8, y - 6, n, { s: 8.5, w: 600, c: "var(--ink)" }); });
      if (c.pump) { el("rect", { x: 684, y: c.pump - 6, width: 16, height: 12, rx: 4, fill: "var(--fat)", stroke: "var(--wall-deep)" }, g); tx(g, 692, c.pump + 2.5, "ATP", { s: 6, w: 600, a: "middle", c: "var(--ink)" }); }
      if (c.adh) { el("rect", { x: 689, y: c.adh - 5, width: 6, height: 10, rx: 2, fill: "var(--accent)" }, g); tx(g, 714, c.adh + 18, "ADH", { s: 8.5, w: 600, a: "middle", c: "var(--accent)" });
        for (let k = 0; k < 4; k++) el("circle", { cx: x0 + 14 + (k % 2) * 8, cy: c.adh - 10 + k * 5, r: 2.4, fill: "none", stroke: "var(--accent)", "stroke-width": 0.9 }, g); } }
    c.ar.forEach(([y, kind, a, b]) => cellA[id].push(arrowP(g, a, y, b, kind)));
    c.notes.forEach((t, k) => tx(g, IX + 10, IY + IH - 16 + k * 11, t, { s: 8.5, c: "var(--ink)" })); g.removeAttribute("display"); g.remove(); }
  K.part("pct", inset);

  return {
    paths: PATHS,
    update(i, s, d) {
      const pp = s.parcel, gpos = START[pp.part] + pp.u * (CUM[pp.part][CUM[pp.part].length - 1]), r = s.readouts;
      for (const id in glow) { const a = (s.parts[id] && s.parts[id].active) || 0; glow[id].setAttribute("opacity", f1(0.55 * a)); arrows[id].setAttribute("opacity", f1(0.12 + 0.88 * a)); }
      for (const ch of chunks) { const on = ch.g <= gpos; if (on !== ch.on) { ch.on = on; ch.setAttribute("opacity", on ? 0.95 : 0.14); } }
      tuft.setAttribute("opacity", f1(0.75 + 0.25 * s.parts.glom.active)); ptc.forEach((g) => g.setAttribute("opacity", f1(0.4 + 0.5 * s.parts.ptc.active)));
      medFill.setAttribute("opacity", f1(0.85 + 0.15 * s.parts.interstitium.active));
      // slug
      const len = 6 + 50 * Math.sqrt(r.vol / 100), a0 = Math.max(0, gpos - len / 2), a1 = Math.min(total, gpos + len / 2); let dd = "";
      for (let g = a0; g <= a1 + 0.01; g += 2) { const p = posAt(Math.min(g, a1)); dd += (dd ? "L" : "M") + f1(p[0]) + " " + f1(p[1]); }
      const rr = pp.part === "bowman" ? 4 : TUBE[pp.part][0]; slug.setAttribute("d", dd); slugO.setAttribute("d", dd);
      slug.setAttribute("stroke-width", f1(2 * rr - 0.5)); slugO.setAttribute("stroke-width", f1(2 * rr + 3)); slug.setAttribute("style", "stroke:" + osmColor(r.osm));
      // water and solute leaving the parcel, at the rates the model reports
      const dt = d * M.T; if (dt > 0 && dt < 5) { accW += r.waterOut * dt * 0.45; accS += r.saltOut * dt * 0.45;
        const spawn = (kind) => { const q = drops.find((x) => x.life <= 0); if (!q) return; const g = clamp(a0 + rnd() * (a1 - a0), 0, total), [x, y, nx, ny] = posAt(g), side = rnd() < 0.5 ? -1 : 1, o = rr + 3;
          Object.assign(q, { x: x + nx * o * side, y: y + ny * o * side, vx: nx * side, vy: ny * side, life: 1, kind }); q.c.setAttribute("fill", kind === "w" ? "var(--cold-hi)" : "var(--hot-hi)"); q.c.setAttribute("r", kind === "w" ? 2.4 : 1.9); };
        while (accW >= 1) { accW -= 1; spawn("w"); } while (accS >= 1) { accS -= 1; spawn("s"); }
        for (const q of drops) if (q.life > 0) { q.life -= dt / 2.6; q.x += q.vx * dt * 11; q.y += q.vy * dt * 11; } }
      else if (dt < 0 || dt >= 5) drops.forEach((q) => { q.life = 0; });
      for (const q of drops) { if (q.life > 0) { q.c.setAttribute("cx", f1(q.x)); q.c.setAttribute("cy", f1(q.y)); q.c.setAttribute("opacity", f1(Math.min(1, q.life * 1.6))); } else q.c.setAttribute("opacity", 0); }
      // depth gauge
      const z = r.depth, y = z > 0 ? yOfZ(Math.min(1, z)) : Y0;
      level.setAttribute("d", `M24 ${f1(y)}H${RX}`); level.setAttribute("opacity", z > 0 ? 0.7 : 0); pip.setAttribute("cy", f1(y));
      intTag.el.setAttribute("transform", `translate(0 ${f1((y - 30 < 262 ? y + 24 : y - 30) - 300)})`); intTag.set(r.intOsm.toFixed(0) + " mOsm/kg");
      // inset
      if (shown !== pp.part) { if (shown) cellG[shown].remove(); inset.appendChild(cellG[pp.part]); shown = pp.part; }
      cap.textContent = CELL[pp.part].name; cellA[pp.part].forEach((a) => a.setAttribute("opacity", f1(0.35 + 0.65 * ((s.parts[pp.part] || {}).active || 0))));
      blood.update(i, s, Math.max(0, d));
    },
  };
}
