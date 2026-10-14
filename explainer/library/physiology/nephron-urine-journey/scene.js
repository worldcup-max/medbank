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
  // keep-clear test: background detail never crosses this nephron's tubes, its arterioles or the interlobular vessels
  const SOLID = Object.values(PATHS).concat([[[488, 40], [430, 36], [360, 38], [300, 46], [262, 56], [238, 70]], [[236, 112], [252, 126], [254, 160], [251, 210], [249, Y0 + 20]], [[488, Y0], [488, 36]], [[502, Y0], [502, 36]], [[543, 30], [542, 90], [541, 138]]]).map((q) => K.sampleSpline(q, 10));
  const near = (x, y, d) => Math.hypot(x - G[0], y - G[1]) < 44 + d || SOLID.some((q) => q.some(([a, b]) => Math.hypot(a - x, b - y) < d));
  // other tubules cut in cross-section: sparse, faint, only in the gaps
  for (let k = 0, n = 0; k < 160 && n < 26; k++) { const x = 30 + rnd() * 530, y = 36 + rnd() * (Y0 - 52); if (near(x, y, 17)) continue; n++;
    el("ellipse", { cx: f1(x), cy: f1(y), rx: f1(4.5 + rnd() * 3), ry: f1(3.5 + rnd() * 2.5), fill: "none", stroke: "var(--wall-hi)", "stroke-width": 1.4, opacity: 0.24 }, L.bg); }
  for (let x = 34; x < 700; x += 23) { if (x > 196 && x < 300) continue; el("path", { d: `M${x} ${Y0 + 12 + (x * 7) % 40}V${560 - (x * 13) % 120}`, stroke: "var(--wall-hi)", "stroke-width": 3, "stroke-linecap": "round", opacity: 0.18 }, L.bg); }
  K.label(30, 40, "Cortex", "start", { strong: true }); K.label(30, Y0 + 46, "Outer medulla", "start", { strong: true }); K.label(30, yOfZ(0.5) + 18, "Inner medulla", "start", { strong: true });

  // ---- blood: arcuate and interlobular vessels, afferent and efferent arterioles, peritubular capillaries, vasa recta
  K.vessel(L.vessels, [[20, Y0 + 3], [740, Y0 + 3]], 3, { tone: "hot", cap: "butt", wallWidth: 2 });
  K.vessel(L.vessels, [[20, Y0 + 13], [740, Y0 + 13]], 3.6, { tone: "cold", cap: "butt", wallWidth: 1.6 });
  K.vessel(L.vessels, [[488, Y0], [488, 36]], 3.5, { tone: "hot", wallWidth: 2.5 }); K.vessel(L.vessels, [[502, Y0 + 12], [502, 36]], 4.5, { tone: "cold", wallWidth: 2 });
  const AFF = [[488, 40], [430, 36], [360, 38], [300, 46], [262, 56], [238, 70]], EFF = [[236, 112], [252, 126], [254, 160], [251, 210], [249, Y0 + 20]];
  K.part("aff", K.vessel(L.front, AFF, 4.5, { tone: "hot", wallWidth: 5 }));
  for (let k = 0; k < 5; k++) { const p = [246 + k * 6, 66 - k * 2.6]; K.part("aff", el("circle", { cx: f1(p[0]), cy: f1(p[1]), r: 2.3, fill: "var(--fat)", stroke: "var(--wall-deep)", "stroke-width": 0.6 }, L.front)); }
  K.part("eff", K.vessel(L.vessels, EFF, 3.2, { tone: "hot", wallWidth: 3 }));
  // peritubular capillaries: the efferent blood re-wraps the cortical tubules; drawn only where they do not cross this nephron's tubes
  const ptc = [];
  [[[40, 50], [70, 44], [98, 50], [118, 40], [150, 46]], [[34, 90], [56, 84], [64, 120], [44, 140]], [[110, 92], [116, 130], [104, 160], [120, 172]], [[36, 214], [60, 230], [96, 222], [130, 230], [160, 222]],
   [[358, 96], [364, 126], [356, 140], [404, 168], [420, 196]], [[408, 112], [416, 136], [460, 140], [470, 120]], [[318, 60], [360, 62], [374, 90], [412, 70], [460, 66]],    [[414, 224], [440, 214], [474, 222]], [[456, 92], [470, 120], [474, 150]]]
    .filter((pts) => !K.sampleSpline(pts, 8).some(([x, y]) => near(x, y, 12)))
    .forEach((pts, k) => ptc.push(K.part("ptc", K.vessel(L.vessels, pts, 1.5, { tone: k % 2 ? "cold" : "hot", wallWidth: 1 }))));
  ptc.forEach((g) => g.setAttribute("opacity", 0.35));
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
  [[238, 160, "Glomerulus", "end"], [238, 173, "Bowman's capsule", "end"], [380, 62, "Afferent arteriole", "middle"], [240, 187, "efferent arteriole", "end"],
   [200, 480, "Thin descending limb", "end"], [294, 552, "Thick ascending limb", "start"], [420, 197, "Distal convoluted tubule", "middle"], [528, 300, "Collecting duct", "end"],
   [22, 120, "Proximal", "start"], [22, 131, "tubule", "start"], [478, 468, "Vasa recta", "middle"], [300, 186, "macula densa", "start"], [548, 632, "papilla, to calyx", "middle"],
   [300, 226, "Peritubular capillaries", "start"], [30, Y0 + 30, "Arcuate artery & vein", "start"], [200, 418, "water out", "end"], [294, 418, "NaCl out", "start"], [532, 520, "water out (ADH)", "end"]]
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


  // =================== LENSES: six magnified views, each driven by the same parcel sample s and frame index i as the nephron ===================
  const TX_ = K.text, lerp = K.lerp, N = S.length, T = M.T, DTn = T / N;
  let nseed = 31; const rnd2 = () => ((nseed = (nseed * 16807) % 2147483647) / 2147483647);
  const ION = { na: "var(--hot-hi)", k: "var(--spark)", cl: "var(--open)", glu: "var(--accent)", h: "var(--cold)", hco3: "var(--wall-deep)", w: "var(--cold-hi)", mg: "var(--ink)" };
  // per-frame removal rates the model implies (per second), for glucose and bicarbonate
  const dropRate = (key) => S.map((s, k) => Math.max(0, (S[(k + N - 1) % N].readouts[key] - s.readouts[key]) / DTn) * (k ? 1 : 0));
  const gluRate = dropRate("glucose"), hco3Rate = dropRate("hco3");
  // ions or molecules moving along a path through transporters, at a rate set by the model; idle ones fade
  function lane(g, pts, col, opt = {}) { const poly = K.sampleSpline(pts, 8), cum = [0]; for (let k = 1; k < poly.length; k++) cum.push(cum[k - 1] + Math.hypot(poly[k][0] - poly[k - 1][0], poly[k][1] - poly[k - 1][1]));
    const len = cum[cum.length - 1], n = opt.n || 5, r = opt.r || 3.2, Q = [];
    for (let k = 0; k < n; k++) Q.push({ s: (k + rnd2() * 0.5) / n * len, e: opt.square ? el("rect", { width: r * 2, height: r * 2, rx: 1.2, fill: col, stroke: "var(--sheet)", "stroke-width": 0.8 }, g) : el("circle", { r, fill: col, stroke: "var(--sheet)", "stroke-width": 0.8 }, g) });
    const at = (s) => { let k = 1; while (k < cum.length - 1 && cum[k] < s) k++; const t = (s - cum[k - 1]) / ((cum[k] - cum[k - 1]) || 1); return [lerp(poly[k - 1][0], poly[k][0], t), lerp(poly[k - 1][1], poly[k][1], t)]; };
    return (rate, dS) => { const on = rate > 0.02; for (const q of Q) { if (on) q.s = (q.s + rate * dS * (opt.speed || 40)) % len; const [x, y] = at(q.s);
      if (opt.square) { q.e.setAttribute("x", f1(x - r)); q.e.setAttribute("y", f1(y - r)); } else { q.e.setAttribute("cx", f1(x)); q.e.setAttribute("cy", f1(y)); } q.e.setAttribute("opacity", on ? 0.95 : 0.12); } }; }
  const membraneProtein = (g, x, y, label, side, col = "var(--accent)") => { el("rect", { x: x - 7, y: y - 11, width: 14, height: 22, rx: 6, fill: col, stroke: "var(--sheet)", "stroke-width": 1.2 }, g);
    TX_(g, side < 0 ? x - 11 : x + 11, y - 13, label, "lm halo", side < 0 ? "end" : "start", { style: "font-size:11px;fill:var(--ink)" }); };
  const bar = (g, x, y, w, label, col) => { TX_(g, x, y + 9, label, "ls"); el("rect", { x: x + 118, y, width: w, height: 11, rx: 5.5, fill: "var(--ground)", stroke: "var(--hair)" }, g);
    const b = el("rect", { x: x + 118, y, height: 11, rx: 5.5, fill: col }, g), v = TX_(g, x + 118 + w + 6, y + 9.5, "", "lm"); return (frac, txt) => { b.setAttribute("width", f1(Math.max(6, w * K.clamp(frac, 0, 1)))); v.textContent = txt; }; };
  // an epithelial cell between the lumen (left) and the interstitium/blood (right)
  function cellFrame(g, opt = {}) {
    el("rect", { x: 0, y: 26, width: 104, height: 270, fill: "var(--fluid)" }, g); TX_(g, 52, 44, "Lumen", "lh", "middle"); TX_(g, 52, 60, "(urine side)", "lm", "middle");
    el("rect", { x: 296, y: 26, width: 104, height: 270, fill: "var(--bed)" }, g); TX_(g, 348, 44, "Blood side", "lh", "middle");
    el("rect", { x: 352, y: 66, width: 44, height: 222, rx: 22, fill: "var(--hot-lumen)", stroke: "var(--hot)", "stroke-width": 1.4 }, g); TX_(g, 396, 302, "capillary", "lm", "end");
    for (const y of [26, 286]) el("rect", { x: 104, y: y === 26 ? 26 : 280, width: 192, height: 16, fill: "var(--wall-hi)", opacity: 0.35 }, g);
    el("rect", { x: 104, y: 42, width: 192, height: 238, rx: 4, fill: "var(--wall-hi)", "fill-opacity": 0.42, stroke: "var(--wall-deep)", "stroke-width": 1.6 }, g);
    for (const y of [42, 280]) el("rect", { x: 100, y: y - 3, width: 10, height: 6, rx: 2, fill: "var(--wall-deep)" }, g);   // tight junctions
    el("ellipse", { cx: 232, cy: 238, rx: 26, ry: 18, fill: "var(--wall)", stroke: "var(--wall-deep)", "stroke-width": 1 }, g);
    if (opt.brush) for (let y = 46; y < 278; y += 4.5) el("path", { d: `M104 ${f1(y)}h-9`, stroke: "var(--wall-hi)", "stroke-width": 2, "stroke-linecap": "round" }, g);
    if (opt.mito) for (let k = 0; k < 7; k++) el("ellipse", { cx: 268 - (k % 2) * 12, cy: 64 + k * 30, rx: 9, ry: 4, fill: "var(--fat)", stroke: "var(--wall-deep)", "stroke-width": 0.6 }, g);
    TX_(g, 104, 22, "apical", "lm", "middle"); TX_(g, 296, 22, "basolateral", "lm", "middle"); }
  const here = (s, part) => s.parcel.part === part;

  // 1 · the filtration barrier: capillary lumen → fenestrated endothelium → basement membrane → podocyte slits → Bowman's space
  K.lens("barrier", { focus: [168, 52, 96, 96],
    build(g) { const SL = [26, 72, 118, 164, 210];   // filtration channels: a fenestra, the basement membrane, then a slit diaphragm
      el("rect", { x: 0, y: 22, width: 400, height: 96, fill: "var(--hot-lumen)" }, g); TX_(g, 12, 40, "Glomerular capillary", "lh"); TX_(g, 12, 56, "blood flows past", "lm");
      el("rect", { x: 0, y: 166, width: 400, height: 76, fill: "var(--fluid)" }, g); TX_(g, 12, 234, "Bowman's space · filtrate", "lh");
      for (let k = -1; k < SL.length; k++) { const a = k < 0 ? -4 : SL[k] + 6, b = k + 1 < SL.length ? SL[k + 1] - 6 : 250; el("rect", { x: a, y: 118, width: b - a, height: 10, rx: 3, fill: "var(--wall)", stroke: "var(--wall-deep)", "stroke-width": 0.8 }, g); }
      el("rect", { x: -2, y: 128, width: 252, height: 16, fill: "var(--fat)", stroke: "var(--wall-deep)", "stroke-width": 0.6 }, g);
      for (let x = 14; x < 246; x += 28) TX_(g, x, 140, "–", "lm", "middle", { style: "fill:var(--wall-deep);font-size:13px" });
      for (let k = -1; k < SL.length; k++) { const a = k < 0 ? -8 : SL[k] + 4, b = k + 1 < SL.length ? SL[k + 1] - 4 : 252; el("path", { d: `M${a} 144q0 20 ${f1((b - a) / 2)} 20q${f1((b - a) / 2)} 0 ${f1((b - a) / 2)} -20`, fill: "var(--wall-hi)", stroke: "var(--wall-deep)", "stroke-width": 1 }, g); }
      for (const x of SL) el("path", { d: `M${x - 4} 150h8`, stroke: "var(--ink)", "stroke-width": 1.2 }, g);
      el("rect", { x: 254, y: 100, width: 146, height: 104, fill: "var(--sheet)", opacity: 0.9 }, g);
      for (const [ly, y, a, b] of [[123, 112, "endothelium", "fenestrated"], [136, 148, "basement membrane", "negatively charged"], [156, 184, "podocytes", "slit diaphragms"]]) {
        el("path", { d: `M246 ${ly}L262 ${ly}L266 ${y - 4}`, fill: "none", stroke: "var(--muted)", "stroke-width": 0.8 }, g); TX_(g, 270, y, a, "ls", "start", { style: "fill:var(--ink)" }); TX_(g, 270, y + 13, b, "lm"); }
      const rbc = Array.from({ length: 4 }, (_, k) => ({ x: k * 110, e: el("ellipse", { cy: 88, rx: 17, ry: 9, fill: "var(--hot)", stroke: "var(--wall-deep)", "stroke-width": 1 }, g) }));
      const alb = Array.from({ length: 5 }, (_, k) => ({ x: 24 + k * 44, y: 74 + (k % 3) * 12, v: k % 2 ? 1 : -1, e: el("circle", { r: 5.5, fill: "var(--cold)", stroke: "var(--sheet)", "stroke-width": 1 }, g) }));
      const small = []; SL.forEach((x, k) => { for (let j = 0; j < 3; j++) small.push({ x, p: (j / 3 + k * 0.17) % 1, w: j !== 1, e: el("circle", { r: j === 1 ? 2.4 : 2.8, fill: j === 1 ? ION.na : ION.w, stroke: "var(--sheet)", "stroke-width": 0.6 }, g) }); });
      // Starling forces across the barrier: arrows sized by the model's pressures
      el("line", { x1: 0, x2: 400, y1: 250, y2: 250, stroke: "var(--hair)" }, g); TX_(g, 12, 268, "Starling forces (mmHg)", "lm");
      const arr = [0, 1, 2, 3].map(() => el("path", { fill: "none", "stroke-width": 3, "stroke-linecap": "round", "stroke-linejoin": "round" }, g)), lab = [0, 1, 2, 3].map(() => TX_(g, 0, 0, "", "lm", "start", { style: "fill:var(--ink)" })), lab2 = [0, 1, 2, 3].map(() => TX_(g, 0, 0, "", "ls", "start"));
      const legend = [[ION.w, "water"], [ION.na, "salts, glucose"], ["var(--cold)", "albumin"], ["var(--hot)", "red cells"]];
      legend.forEach(([c, t], k) => { const x = 10 + k * 97; el("circle", { cx: x + 5, cy: 330, r: 4.5, fill: c }, g); TX_(g, x + 14, 334, t, "ls"); });
      TX_(g, 12, 350, "albumin and red cells stay in the blood", "lm");
      const eq = TX_(g, 12, 372, "", "lt"), st = TX_(g, 12, 392, "", "lm");
      return (i, s, d) => { const r = s.readouts, dS = d * T;
        const F = [[r.pGC, true, "var(--hot)", "P_GC " + r.pGC, "pushes out"], [r.pBS, false, "var(--cold)", "P_BS " + r.pBS, "pushes back"], [r.piGC, false, "var(--cold)", "π_GC " + r.piGC, "pulls back"], [r.nfp, true, "var(--accent)", "net " + r.nfp, "filters out"]];
        F.forEach(([v, down, c, t1, t2], k) => { const x = 18 + k * 96, dir = down ? 1 : -1, y0 = down ? 280 : 312, y1 = down ? 280 + Math.min(32, 6 + v * 0.5) : 312 - Math.min(32, 6 + v * 0.5);
          arr[k].setAttribute("d", `M${x} ${y0}V${f1(y1)}M${x - 5} ${f1(y1 - dir * 6)}L${x} ${f1(y1)}L${x + 5} ${f1(y1 - dir * 6)}`); arr[k].setAttribute("stroke", c);
          lab[k].setAttribute("x", x + 12); lab[k].setAttribute("y", 293); lab[k].textContent = t1; lab2[k].setAttribute("x", x + 12); lab2[k].setAttribute("y", 307); lab2[k].textContent = t2; });
        for (const q of rbc) { q.x = (q.x + 30 * dS) % 440; q.e.setAttribute("cx", f1(q.x - 20)); }
        for (const q of alb) { q.y += q.v * 14 * dS; if (q.y > 112) { q.y = 112; q.v = -1; } if (q.y < 66) { q.y = 66; q.v = 1; } q.x = (q.x + 18 * dS) % 240; q.e.setAttribute("cx", f1(q.x)); q.e.setAttribute("cy", f1(q.y)); }
        const flux = r.nfp * 0.06; for (const q of small) { q.p = (q.p + flux * dS * (q.w ? 1.15 : 1)) % 1; const y = 70 + q.p * 160; q.e.setAttribute("cx", f1(q.x + (q.p < 0.3 ? (q.w ? -7 : 7) * (1 - q.p / 0.3) : 0))); q.e.setAttribute("cy", f1(y)); }
        eq.textContent = `Net filtration = ${r.pGC} − ${r.pBS} − ${r.piGC} = ${r.nfp} mmHg`;
        st.textContent = here(s, "bowman") ? "this parcel is being filtered now · GFR 125 mL/min" : "filtration never stops · GFR 125 mL/min = 180 L/day"; }; } });

  // 2 · a proximal tubule cell: Na⁺ pumped out, water follows, glucose and bicarbonate reclaimed
  K.lens("pctcell", { focus: [48, 54, 152, 176],
    build(g) { cellFrame(g, { brush: true, mito: true }); TX_(g, 200, 66, "Proximal tubule cell", "lh", "middle");
      membraneProtein(g, 104, 96, "SGLT2", -1); membraneProtein(g, 104, 150, "NHE3", -1); membraneProtein(g, 104, 206, "AQP1", -1, "var(--cold)");
      membraneProtein(g, 296, 96, "GLUT2", 1); membraneProtein(g, 296, 128, "Na⁺/K⁺ ATPase", 1, "var(--spark)"); membraneProtein(g, 296, 170, "NBCe1", 1); membraneProtein(g, 296, 214, "AQP1", 1, "var(--cold)");
      TX_(g, 200, 160, "CO₂ + H₂O → H⁺ + HCO₃⁻", "lm", "middle");
      const Lg = lane(g, [[14, 90], [104, 96], [200, 92], [296, 96], [372, 100]], ION.glu, { square: true, r: 3.3, n: 6 });
      const Ln = lane(g, [[14, 104], [104, 100], [200, 116], [296, 128], [372, 132]], ION.na, { n: 7 });
      const Ln2 = lane(g, [[14, 142], [104, 146], [190, 136], [296, 130], [372, 136]], ION.na, { n: 6 });
      const Lh = lane(g, [[190, 168], [104, 154], [14, 158]], ION.h, { n: 4, r: 2.6 });
      const Lb = lane(g, [[200, 172], [296, 172], [372, 176]], ION.hco3, { n: 4, r: 3 });
      const Lk = lane(g, [[372, 122], [296, 124], [250, 118]], ION.k, { n: 3, r: 2.8 });
      const Lw = lane(g, [[14, 202], [104, 206], [200, 210], [296, 214], [372, 216]], ION.w, { n: 8, r: 2.6 });
      const Lw2 = lane(g, [[14, 274], [104, 282], [296, 282], [372, 268]], ION.w, { n: 5, r: 2.4 });
      TX_(g, 200, 300, "water also slips between cells", "lm", "middle");
      const legend = [[ION.na, "Na⁺"], [ION.glu, "glucose"], [ION.w, "water"], [ION.h, "H⁺"], [ION.hco3, "HCO₃⁻"], [ION.k, "K⁺"]];
      legend.forEach(([c, t], k) => { const x = 8 + k * 65; el("circle", { cx: x + 5, cy: 318, r: 4, fill: c }, g); TX_(g, x + 13, 322, t, "ls"); });
      const bV = bar(g, 8, 332, 190, "Filtrate left", "var(--accent)"), bG = bar(g, 8, 349, 190, "Glucose left", ION.glu), bB = bar(g, 8, 366, 190, "HCO₃⁻ left", ION.hco3);
      const st = TX_(g, 200, 396, "", "lm", "middle");
      return (i, s, d) => { const r = s.readouts, dS = d * T, inP = here(s, "pct");
        Lg(inP ? gluRate[i] * 0.05 : 0, dS); Ln(inP ? r.saltOut * 0.25 : 0, dS); Ln2(inP ? r.saltOut * 0.25 : 0, dS); Lh(inP ? hco3Rate[i] * 0.06 : 0, dS); Lb(inP ? hco3Rate[i] * 0.06 : 0, dS);
        Lk(inP ? r.saltOut * 0.12 : 0, dS); Lw(inP ? r.waterOut * 0.25 : 0, dS); Lw2(inP ? r.waterOut * 0.12 : 0, dS);
        bV(r.vol / 100, r.vol.toFixed(r.vol < 10 ? 1 : 0) + "%"); bG(r.glucose / 100, r.glucose.toFixed(0) + "%"); bB(r.hco3 / 100, r.hco3.toFixed(0) + "%");
        st.textContent = inP ? `iso-osmotic: water follows Na⁺, fluid stays ${r.osm.toFixed(0)}` : s.parcel.part === "bowman" ? "the parcel has not reached the proximal tubule yet" : "past the PCT now: the bars show what it reclaimed"; }; } });

  // 3 · the countercurrent multiplier: the loop unfolded as a hairpin against the interstitial gradient
  K.lens("multiplier", { focus: [196, 248, 100, 360],
    build(g) { const Yz = (z) => 70 + K.clamp(z, 0, 1) * 250, XD = 128, XA = 222;
      const grad = el("linearGradient", { id: "lzInt", x1: 0, y1: 0, x2: 0, y2: 1 }, g); for (const [o, a] of [[0, 0.04], [1, 0.46]]) el("stop", { offset: o, "stop-color": "var(--hot-hi)", "stop-opacity": a }, grad);
      el("rect", { x: 40, y: 70, width: 320, height: 250, fill: "url(#lzInt)" }, g); el("rect", { x: 40, y: 70, width: 320, height: 250, fill: "none", stroke: "var(--hair)" }, g);
      TX_(g, 16, 30, "The loop of Henle as a hairpin", "lh"); TX_(g, 16, 48, "cortex at the top · papilla at the bottom", "lm");
      for (const v of [300, 600, 900, 1200]) { const y = Yz((v - 300) / 900); el("line", { x1: 40, x2: 360, y1: f1(y), y2: f1(y), stroke: "var(--hair)", "stroke-dasharray": "2 4" }, g); TX_(g, 364, y + 4, String(v), "lm"); }
      TX_(g, 396, 340, "interstitium", "lm", "end");
      // the hairpin: thin descending (water-permeable) and thick ascending (salt pump, water-tight)
      const hp = `M${XD} 60V${f1(Yz(1) - 14)}Q${XD} ${f1(Yz(1) + 18)} ${(XD + XA) / 2} ${f1(Yz(1) + 18)}Q${XA} ${f1(Yz(1) + 18)} ${XA} ${f1(Yz(1) - 14)}V60`;
      el("path", { d: hp, fill: "none", stroke: "var(--wall-deep)", "stroke-width": 26, "stroke-linejoin": "round" }, g);
      el("path", { d: hp, fill: "none", stroke: "var(--wall-hi)", "stroke-width": 23, "stroke-linejoin": "round" }, g);
      el("path", { d: `M${XA} 60V${f1(Yz(1) - 14)}`, stroke: "var(--wall)", "stroke-width": 23 }, g);
      el("path", { d: hp, fill: "none", stroke: "var(--fluid)", "stroke-width": 12, "stroke-linejoin": "round" }, g);
      TX_(g, XD + 12, 356, "thin descending", "ls", "end"); TX_(g, XD + 12, 370, "water out only", "lm", "end"); TX_(g, XA - 12, 356, "thick ascending", "ls", "start"); TX_(g, XA - 12, 370, "NaCl out only", "lm", "start");
      // tubular fluid along each limb, from the model's own parcel
      const dPts = [], aPts = []; S.forEach((s) => { if (s.parcel.part === "tdl") dPts.push([s.readouts.depth, s.readouts.osm]); if (s.parcel.part === "tal") aPts.push([s.readouts.depth, s.readouts.osm]); });
      const near = (A, z) => A.reduce((b, p) => (Math.abs(p[0] - z) < Math.abs(b[0] - z) ? p : b), A[0])[1];
      for (const z of [0.15, 0.5, 0.85]) { const y = Yz(z); TX_(g, XD - 36, y + 4, near(dPts, z).toFixed(0), "lm halo", "end", { style: "fill:var(--ink)" }); TX_(g, XA + 36, y + 4, near(aPts, z).toFixed(0), "lm halo", "start", { style: "fill:var(--ink)" }); }
      // water leaving the descending limb, salt leaving the ascending limb
      const wa = [], na = []; for (let k = 0; k < 5; k++) { const y = Yz(0.12 + k * 0.19); wa.push(el("path", { d: `M${XD - 14} ${f1(y)}h-16m6 -5l-6 5l6 5`, fill: "none", stroke: ION.w, "stroke-width": 2.2, "stroke-linecap": "round", "stroke-linejoin": "round" }, g));
        na.push(el("path", { d: `M${XA + 14} ${f1(y + 8)}h16m-6 -5l6 5l-6 5`, fill: "none", stroke: ION.na, "stroke-width": 2.2, "stroke-linecap": "round", "stroke-linejoin": "round" }, g)); }
      // the parcel on the hairpin
      const pDot = el("circle", { r: 7, fill: "var(--accent)", stroke: "var(--sheet)", "stroke-width": 2 }, g), pTag = TX_(g, 0, 0, "", "lm halo", "middle", { style: "fill:var(--ink)" });
      const st = TX_(g, 200, 392, "", "lm", "middle");
      return (i, s) => { const r = s.readouts, p = s.parcel.part, inD = p === "tdl", inA = p === "tal";
        wa.forEach((e) => e.setAttribute("opacity", inD ? 0.95 : 0.25)); na.forEach((e) => e.setAttribute("opacity", inA ? 0.95 : 0.25));
        if (inD || inA) { const z = K.clamp(r.depth, 0, 1), y = Yz(z), nearTip = z > 0.94, x = nearTip ? lerp(XD, XA, inD ? 0.15 : 0.85) : inD ? XD : XA;
          pDot.setAttribute("cx", f1(x)); pDot.setAttribute("cy", f1(nearTip ? Yz(1) + 8 : Math.max(62, y))); pDot.setAttribute("opacity", 1); pTag.setAttribute("x", f1((XD + XA) / 2)); pTag.setAttribute("y", f1(Math.max(62, y) - 12)); pTag.textContent = r.osm.toFixed(0) + " mOsm"; }
        else { pDot.setAttribute("opacity", 0); pTag.textContent = ""; }
        st.textContent = inD ? `water out · fluid ${r.osm.toFixed(0)}, outside ${r.intOsm.toFixed(0)}` : inA ? `NaCl out · fluid ${r.osm.toFixed(0)}, outside ${r.intOsm.toFixed(0)}` : "parcel outside the loop · numbers are its own values"; }; } });

  // 4 · a thick ascending limb cell: NKCC2, K⁺ recycling, the lumen-positive voltage and paracellular Mg²⁺/Ca²⁺
  K.lens("talcell", { focus: [262, 300, 42, 210],
    build(g) { cellFrame(g, { mito: true }); TX_(g, 200, 66, "Thick ascending limb cell", "lh", "middle");
      membraneProtein(g, 104, 104, "NKCC2", -1); membraneProtein(g, 104, 168, "ROMK", -1, "var(--spark)");
      membraneProtein(g, 296, 104, "Na⁺/K⁺ ATPase", 1, "var(--spark)"); membraneProtein(g, 296, 150, "ClC-Kb", 1, "var(--open)");
      TX_(g, 52, 248, "lumen +", "lt", "middle"); TX_(g, 52, 264, "(K⁺ recycled", "lm", "middle"); TX_(g, 52, 278, "back out)", "lm", "middle");
      // water-tight wall
      el("path", { d: "M18 214h68", stroke: ION.w, "stroke-width": 2.2, "stroke-dasharray": "3 3" }, g); el("path", { d: "M94 206l12 16M106 206l-12 16", stroke: "var(--shut)", "stroke-width": 2.4 }, g); TX_(g, 52, 204, "no aquaporins", "lm", "middle");
      TX_(g, 150, 130, "loop diuretics", "lm", "start", { style: "fill:var(--shut)" }); TX_(g, 150, 143, "(furosemide) block", "lm", "start", { style: "fill:var(--shut)" }); el("path", { d: "M146 126L112 108", stroke: "var(--shut)", "stroke-width": 1, "stroke-dasharray": "3 2" }, g);
      const Ln = lane(g, [[14, 96], [104, 100], [210, 96], [296, 104], [372, 108]], ION.na, { n: 6 });
      const Lc1 = lane(g, [[14, 108], [104, 106], [210, 120], [296, 150], [372, 152]], ION.cl, { n: 6, r: 3 });
      const Lc2 = lane(g, [[14, 118], [104, 110], [200, 132], [296, 152], [372, 160]], ION.cl, { n: 6, r: 3 });
      const Lk = lane(g, [[14, 112], [104, 104], [180, 140], [104, 168], [14, 172]], ION.k, { n: 5, r: 2.8 });
      const Lk2 = lane(g, [[372, 96], [296, 102], [240, 98]], ION.k, { n: 3, r: 2.6 });
      const Lm = lane(g, [[14, 282], [104, 288], [200, 290], [296, 288], [372, 282]], ION.mg, { n: 5, r: 3 });
      TX_(g, 200, 304, "Mg²⁺ and Ca²⁺ squeeze between cells", "lm", "middle");
      const legend = [[ION.na, "Na⁺"], [ION.k, "K⁺"], [ION.cl, "Cl⁻"], [ION.mg, "Mg²⁺/Ca²⁺"]];
      legend.forEach(([c, t], k) => { const x = 8 + k * 92; el("circle", { cx: x + 5, cy: 320, r: 4, fill: c }, g); TX_(g, x + 13, 324, t, "ls"); });
      const bL = bar(g, 8, 338, 160, "Lumen", "var(--hot-hi)"), bI = bar(g, 8, 356, 160, "Interstitium", "var(--hot)"); const st = TX_(g, 200, 392, "", "lm", "middle");
      return (i, s, d) => { const r = s.readouts, dS = d * T, on = here(s, "tal"), k = on ? r.saltOut * 0.35 : 0;
        Ln(k, dS); Lc1(k, dS); Lc2(k, dS); Lk(k * 0.8, dS); Lk2(k * 0.5, dS); Lm(k * 0.4, dS);
        bL(r.osm / 1200, r.osm.toFixed(0) + " mOsm/kg"); bI(r.intOsm / 1200, r.intOsm.toFixed(0) + " mOsm/kg");
        st.textContent = on ? `NaCl out, water stays · lumen ${r.osm.toFixed(0)}, outside ${r.intOsm.toFixed(0)}` : "the parcel is not in the thick limb now"; }; } });

  // 5 · a principal cell of the collecting duct: ADH → V2 → cAMP → aquaporin-2 inserted; aldosterone → ENaC, ROMK
  K.lens("principal", { focus: [526, 140, 36, 330],
    build(g) { cellFrame(g, {}); TX_(g, 200, 66, "Principal cell · ADH on", "lh", "middle");
      membraneProtein(g, 104, 96, "ENaC", -1); membraneProtein(g, 104, 138, "ROMK", -1, "var(--spark)");
      for (const y of [184, 208, 232]) el("rect", { x: 97, y: y - 9, width: 14, height: 18, rx: 6, fill: "var(--cold)", stroke: "var(--sheet)", "stroke-width": 1.2 }, g);
      TX_(g, 92, 172, "AQP2", "lm halo", "end", { style: "font-size:11px;fill:var(--ink)" });
      membraneProtein(g, 296, 110, "Na⁺/K⁺ ATPase", 1, "var(--spark)"); membraneProtein(g, 296, 196, "AQP3/4", 1, "var(--cold)");
      el("path", { d: "M289 252h14", stroke: "var(--accent)", "stroke-width": 8, "stroke-linecap": "round" }, g); TX_(g, 310, 272, "V2 receptor", "lm halo", "start", { style: "font-size:11px;fill:var(--ink)" });
      const adh = [0, 1, 2].map((k) => el("circle", { cx: 318 + k * 10, cy: 236 + (k % 2) * 8, r: 4, fill: "var(--accent)", stroke: "var(--sheet)" }, g)); TX_(g, 330, 226, "ADH", "lm", "middle", { style: "fill:var(--accent)" });
      el("path", { d: "M282 252Q250 250 236 230", fill: "none", stroke: "var(--accent)", "stroke-width": 1.4, "stroke-dasharray": "3 3" }, g); TX_(g, 214, 196, "cAMP", "lm", "middle", { style: "fill:var(--accent)" });
      TX_(g, 232, 242, "MR", "lm", "middle", { style: "fill:var(--sheet)" }); TX_(g, 198, 272, "aldosterone receptor", "lm", "middle");
      const ves = [0, 1, 2, 3].map((k) => ({ p: k / 4, e: el("g", { "data-bleed": 1 }, g) })); ves.forEach((v) => { el("circle", { r: 7, fill: "var(--sheet)", stroke: "var(--cold)", "stroke-width": 1.5 }, v.e); el("rect", { x: -2.5, y: -4, width: 5, height: 8, rx: 2, fill: "var(--cold)" }, v.e); });
      const Lw = lane(g, [[14, 196], [104, 208], [200, 206], [296, 196], [372, 192]], ION.w, { n: 9, r: 2.6 });
      const Ln = lane(g, [[14, 92], [104, 96], [200, 100], [296, 110], [372, 112]], ION.na, { n: 6 });
      const Lk = lane(g, [[372, 122], [296, 114], [200, 128], [104, 138], [14, 140]], ION.k, { n: 5, r: 2.8 });
      const legend = [[ION.na, "Na⁺"], [ION.k, "K⁺"], [ION.w, "water"], ["var(--accent)", "ADH"]];
      legend.forEach(([c, t], k) => { const x = 8 + k * 92; el("circle", { cx: x + 5, cy: 316, r: 4, fill: c }, g); TX_(g, x + 13, 320, t, "ls"); });
      const bL = bar(g, 8, 334, 160, "Lumen", ION.w), bI = bar(g, 8, 352, 160, "Interstitium", "var(--hot)"); const st = TX_(g, 200, 392, "", "lm", "middle"), st2 = TX_(g, 200, 378, "", "lm", "middle");
      return (i, s, d) => { const r = s.readouts, dS = d * T, on = here(s, "cd");
        Lw(on ? r.waterOut * 0.35 : 0, dS); Ln(on ? r.saltOut * 0.6 : 0, dS); Lk(on ? r.saltOut * 0.4 : 0, dS);
        for (const v of ves) { v.p = (v.p + dS * (on ? 0.25 : 0.05)) % 1; const y = 266 - v.p * 70, x = 150 - v.p * 32; v.e.setAttribute("transform", `translate(${f1(x)} ${f1(y)})`); v.e.setAttribute("opacity", f1(v.p > 0.85 ? (1 - v.p) / 0.15 : 1)); }
        adh.forEach((a) => a.setAttribute("opacity", 1));
        bL(r.osm / 1200, r.osm.toFixed(0) + " mOsm/kg"); bI(r.intOsm / 1200, r.intOsm.toFixed(0) + " mOsm/kg");
        st2.textContent = on ? `water out at ${r.waterOut.toFixed(1)} %/s of the parcel's water` : "the parcel is not in the collecting duct now";
        st.textContent = on ? `filtrate left ${r.vol < 10 ? r.vol.toFixed(1) : r.vol.toFixed(0)}% · ${r.flowDay.toFixed(1)} L/day at this point` : ""; }; } });

  // 6 · where the filtrate goes: volume left after each segment, from the model's own parcel
  K.lens("ledger", { focus: [30, 30, 532, 590],
    build(g) { const PH = [...new Set(S.map((s) => s.phase))], short = { "Glomerular filtration": ["Bowman", ""], "Proximal convoluted tubule": ["PCT", ""], "Thin descending limb": ["thin", "desc."], "Thick ascending limb": ["thick", "asc."], "Distal convoluted tubule": ["DCT", ""], "Cortical collecting duct": ["CCD", ""], "Medullary collecting duct": ["MCD", ""] };
      const seg = PH.map((ph) => { const idx = S.map((s, k) => (s.phase === ph ? k : -1)).filter((k) => k >= 0), a = S[idx[0]].readouts, b = S[idx[idx.length - 1]].readouts; return { ph, k0: idx[0], k1: idx[idx.length - 1], vIn: a.vol, vOut: b.vol, osmOut: b.osm }; });
      const n = seg.length, X0 = 44, W = (390 - X0) / n, Y = (v) => 250 - v / 100 * 190;
      TX_(g, 12, 28, "Where the 180 L/day of filtrate goes", "lh"); TX_(g, 12, 46, "% of the filtrate still in the tubule", "lm");
      for (const v of [0, 25, 50, 75, 100]) { el("line", { x1: X0, x2: 390, y1: f1(Y(v)), y2: f1(Y(v)), stroke: "var(--hair)" }, g); TX_(g, X0 - 5, Y(v) + 4, String(v), "lm", "end"); }
      const cols = seg.map((sg, k) => el("rect", { x: f1(X0 + k * W), y: 56, width: f1(W), height: 196, fill: "var(--accent)", opacity: 0 }, g));
      let d = `M${X0} ${f1(Y(100))}`; seg.forEach((sg, k) => { d += `L${f1(X0 + k * W)} ${f1(Y(sg.vIn))}L${f1(X0 + (k + 1) * W)} ${f1(Y(sg.vOut))}`; });
      el("path", { d: d + `L390 ${f1(Y(0))}L${X0} ${f1(Y(0))}Z`, fill: "var(--cold-hi)", "fill-opacity": 0.18 }, g); el("path", { d, fill: "none", stroke: "var(--cold-hi)", "stroke-width": 2.4 }, g);
      seg.forEach((sg, k) => { const cx = X0 + (k + 0.5) * W, [a, b] = short[sg.ph] || [sg.ph.slice(0, 6), ""]; TX_(g, cx, 268, a, "lm", "middle", { style: "fill:var(--ink)" }); if (b) TX_(g, cx, 281, b, "lm", "middle", { style: "fill:var(--ink)" });
        const out = sg.vIn - sg.vOut; TX_(g, cx, 314, out > 0.05 ? "−" + (out >= 10 ? out.toFixed(0) : out.toFixed(1)) : "0", "lm", "middle", { style: out > 0.05 ? "fill:var(--cold)" : "" }); TX_(g, cx, 348, sg.osmOut.toFixed(0), "lm", "middle"); });
      TX_(g, 12, 298, "water removed here, % of the filtrate", "lm"); TX_(g, 12, 332, "osmolality leaving, mOsm/kg", "lm");
      const fin = seg[n - 1]; TX_(g, 12, 372, `Urine: ${fin.vOut.toFixed(1)}% of the filtrate, ${(180 * fin.vOut / 100).toFixed(1)} L/day, ${fin.osmOut.toFixed(0)} mOsm/kg`, "lt");
      const dot = el("circle", { r: 6, fill: "var(--accent)", stroke: "var(--sheet)", "stroke-width": 2 }, g), st = TX_(g, 12, 392, "", "lm");
      return (i, s) => { const r = s.readouts, k = seg.findIndex((sg) => sg.ph === s.phase); cols.forEach((c, j) => c.setAttribute("opacity", j === k ? 0.1 : 0));
        if (k >= 0) { const sg = seg[k], f = (i - sg.k0) / Math.max(1, sg.k1 - sg.k0); dot.setAttribute("cx", f1(X0 + (k + K.clamp(f, 0, 1)) * W)); dot.setAttribute("cy", f1(Y(r.vol))); }
        st.textContent = `parcel now: ${r.vol < 10 ? r.vol.toFixed(1) : r.vol.toFixed(0)}% left · ${r.osm.toFixed(0)} mOsm/kg · ${r.flowDay.toFixed(1)} L/day`; }; } });


  return {
    paths: PATHS,
    update(i, s, d) {
      const pp = s.parcel, gpos = START[pp.part] + pp.u * (CUM[pp.part][CUM[pp.part].length - 1]), r = s.readouts;
      for (const id in glow) { const a = (s.parts[id] && s.parts[id].active) || 0; glow[id].setAttribute("opacity", f1(0.55 * a)); arrows[id].setAttribute("opacity", f1(0.12 + 0.88 * a)); }
      for (const ch of chunks) { const on = ch.g <= gpos; if (on !== ch.on) { ch.on = on; ch.setAttribute("opacity", on ? 0.95 : 0.14); } }
      tuft.setAttribute("opacity", f1(0.75 + 0.25 * s.parts.glom.active)); ptc.forEach((g) => g.setAttribute("opacity", f1(0.3 + 0.55 * s.parts.ptc.active)));
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
