function createScene(svg, K, M, S) {
  const L = K.layers("bg", "med", "vb", "tb", "tf", "vf", "ov");
  const el = K.el, f1 = K.f1, clamp = K.clamp, lerp = K.lerp, defs = K.defs();
  const conc = (osm, k = 1) => "color-mix(in srgb, var(--accent) " + Math.round(k * (7 + 66 * clamp((osm - 60) / 1140, 0, 1))) + "%, var(--sheet))";
  const grp = (parent, attrs) => el("g", attrs || {}, parent);
  const path = (parent, pts, a, closed) => el("path", Object.assign({ d: K.spline(pts, closed), fill: "none", "stroke-linecap": "round", "stroke-linejoin": "round" }, a), parent);
  // winding tube: prolate cycloid travelling from x0 to x1
  const coil = (x0, x1, y, amp, loops, ph = 0) => { const pts = [], n = loops * 12, v = (x1 - x0) / (loops * 2 * Math.PI);
    for (let k = 0; k <= n; k++) { const f = 2 * Math.PI * loops * k / n; pts.push([x0 + v * f - 1.12 * v * Math.sin(f + ph), y + amp * Math.cos(f + ph)]); } return pts; };

  /* ---------- geometry (one continuous tube: every part starts where the previous one ends) ---------- */
  const G = [320, 118], RC = 42;
  const arc = (a0, a1, r, n) => Array.from({ length: n }, (_, k) => { const a = (a0 + (a1 - a0) * k / (n - 1)) * Math.PI / 180; return [G[0] + r * Math.cos(a), G[1] + r * Math.sin(a)]; });
  const P = {};
  P.bowman = arc(-42, -222, 36.3, 10);
  const c1 = coil(256, 132, 212, 25, 4, 0.5);
  P.pct = [P.bowman[9], [279, 160], [266, 184]].concat(c1.slice(1), [[120, 238], [128, 254], [139, 268]]);
  P.dtl = [[139, 268], [150, 306], [182, 372], [226, 442], [286, 506], [338, 548], [368, 565], [392, 562], [402, 546]];
  P.tal = [[402, 546], [408, 490], [414, 420], [420, 350], [424, 290], [424, 252], [419, 205], [406, 164], [386, 138], [366, 124]];
  const c2 = coil(438, 560, 92, 30, 4, 0.2);
  P.dct = [[366, 124], [378, 104], [396, 82], [418, 76]].concat(c2.slice(1), [[580, 106], [598, 120], [609, 138], [612, 152]]);
  P.cd = [[612, 152], [613, 208], [611, 262], [598, 332], [560, 424], [504, 508], [462, 563], [431, 593]];
  const EFF = [[330, 81], [352, 63], [338, 44], [250, 40], [150, 42], [106, 54], [100, 96], [100, 150], [95, 172]];
  const AFF = [[48, 64], [150, 64], [255, 64], [298, 71], [308, 81]];
  const ART = [[48, 258], [48, 150], [48, 40]];

  /* ---------- background: cortex, medulla gradient, capsule, calyx ---------- */
  const CORT = [[22, 270], [16, 150], [40, 62], [120, 30], [380, 24], [640, 30], [722, 62], [746, 150], [740, 270]];
  K.blob(L.bg, CORT, { fill: "var(--bed)", stroke: "var(--wall-deep)", width: 3, opacity: 0.8 });
  const gI = el("linearGradient", { id: "gI", gradientUnits: "userSpaceOnUse", x1: 0, y1: 262, x2: 0, y2: 592 }, defs);
  for (let k = 0; k <= 10; k++) el("stop", { offset: k / 10, style: "stop-color:" + conc(M.interstitium(k / 10), 0.95) }, gI);
  const PYR = [[95, 262], [250, 258], [400, 256], [550, 258], [700, 262], [676, 360], [620, 455], [550, 520], [480, 572], [452, 590], [400, 598], [348, 590], [320, 572], [250, 520], [180, 455], [120, 360]];
  K.part("medulla", K.blob(L.med, PYR, { fill: "url(#gI)", stroke: "var(--wall-deep)", width: 1.6 }));
  // fine interstitial texture: cells and fibres, denser toward the papilla
  const rnd = (() => { let s = 11; return () => ((s = (s * 16807) % 2147483647) / 2147483647); })();
  const tex = grp(L.med); const inPyr = (x, y) => y > 270 && y < 592 && x > 100 + Math.max(0, y - 340) * 0.9 && x < 700 - Math.max(0, y - 340) * 0.9;
  for (let k = 0; k < 360; k++) { const x = 100 + rnd() * 600, y = 268 + rnd() * 322; if (!inPyr(x, y)) continue; el("circle", { cx: f1(x), cy: f1(y), r: 0.9, fill: "var(--accent)", opacity: 0.1 + 0.3 * (y - 262) / 330 }, tex); }
  // cortical labyrinth texture
  for (let k = 0; k < 150; k++) { const x = 30 + rnd() * 700, y = 34 + rnd() * 224; el("circle", { cx: f1(x), cy: f1(y), r: 0.8, fill: "var(--wall-hi)", opacity: 0.35 }, tex); }
  // medullary rays: faint straight tubules fanning toward the papilla
  const ctxLoop = (x, depth, w) => { const a = [[x, 258], [x + 4, 258 + depth * 0.5], [x + 8, 258 + depth - 10], [x + 14, 258 + depth], [x + w, 258 + depth - 6], [x + w + 4, 258 + depth * 0.5], [x + w + 6, 262]];
    path(L.vb, a, { stroke: "var(--wall-deep)", "stroke-width": 6, opacity: 0.22 }); path(L.vb, a, { stroke: "var(--fluid)", "stroke-width": 3.4, opacity: 0.5 }); };
  [[466, 70, 10], [498, 95, 10], [528, 52, 10], [452, 100, 10]].forEach(([x, dpt, w]) => ctxLoop(x, dpt, w));
  // faint glomeruli (other nephrons)
  [[500, 205], [660, 160]].forEach(([x, y]) => { const g = grp(L.vb, { opacity: 0.4 }); el("circle", { cx: x, cy: y, r: 17, fill: "var(--fluid)", stroke: "var(--wall-deep)", "stroke-width": 1.4 }, g); el("circle", { cx: x, cy: y, r: 11, fill: "var(--hot-lumen)", stroke: "var(--hot)", "stroke-width": 1 }, g); });
  // interlobular vein draining the cortex
  { const VEIN = [[728, 262], [728, 150], [728, 48]]; const v = K.vessel(L.vb, VEIN, 5, { tone: "cold", wallWidth: 3 }); v.setAttribute("opacity", 0.7); K.part("ptc", v); }
  // arcuate artery and vein along the corticomedullary border
  path(L.vb, [[30, 270], [120, 259], [300, 255], [500, 255], [680, 259], [732, 270]], { stroke: "var(--hot)", "stroke-width": 11, opacity: 0.22 });
  path(L.vb, [[30, 270], [120, 259], [300, 255], [500, 255], [680, 259], [732, 270]], { stroke: "var(--hot-lumen)", "stroke-width": 6, opacity: 0.5 });
  // papilla tip, minor calyx and urine
  const cal = path(L.bg, [[322, 586], [316, 612], [360, 628], [420, 630], [472, 618], [480, 588]], { stroke: "var(--wall-deep)", "stroke-width": 3 }); cal.setAttribute("fill", "var(--fluid)"); cal.setAttribute("opacity", 0.9);
  path(L.bg, [[470, 612], [512, 622], [548, 628]], { stroke: "var(--wall-deep)", "stroke-width": 11, opacity: 0.85 }); path(L.bg, [[470, 612], [512, 622], [548, 628]], { stroke: "var(--fluid)", "stroke-width": 7 });
  const urine = S[S.length - 1].readouts.vol / 100 * 180;

  /* ---------- helpers: sampled polylines and profiles of the parcel's own properties along every part ---------- */
  const POLY = {};
  for (const id in P) { const q = K.sampleSpline(P[id], 8), cum = [0]; for (let i = 1; i < q.length; i++) cum.push(cum[i - 1] + Math.hypot(q[i][0] - q[i - 1][0], q[i][1] - q[i - 1][1])); POLY[id] = { q, cum, len: cum[cum.length - 1] }; }
  const at = (id, u) => { const g = POLY[id], s = clamp(u, 0, 1) * g.len; let k = 1; while (k < g.cum.length - 1 && g.cum[k] < s) k++;
    const a = g.q[k - 1], b = g.q[k], t = (s - g.cum[k - 1]) / ((g.cum[k] - g.cum[k - 1]) || 1), dx = b[0] - a[0], dy = b[1] - a[1], l = Math.hypot(dx, dy) || 1; return [lerp(a[0], b[0], t), lerp(a[1], b[1], t), -dy / l, dx / l]; };
  const NB = 60, PROF = {};
  S.forEach((s) => { const id = s.parcel.part, b = Math.min(NB - 1, Math.floor(s.parcel.u * NB)); (PROF[id] = PROF[id] || [])[b] = { osm: s.readouts.osm, vol: s.readouts.vol, act: s.parts[id].active }; });
  const prof = (id, u) => { const a = PROF[id]; let b = Math.min(NB - 1, Math.floor(clamp(u, 0, 1) * NB)); for (let k = 0; k < NB && !a[b]; k++) b = (b + 1) % NB; return a[b]; };

  /* ---------- tubes ---------- */
  const TUBES = {}, HALO = {};
  function tube(id, r, o = {}) {
    const pts = P[id], g = grp(o.layer || L.tb), d = K.spline(pts, false);
    HALO[id] = el("path", { d, fill: "none", stroke: "var(--accent)", "stroke-width": 2 * r + 16, "stroke-linecap": "round", "stroke-linejoin": "round", opacity: 0, style: "transition:opacity .4s" }, g);
    el("path", { d, fill: "none", stroke: o.wall || "var(--wall-deep)", "stroke-width": 2 * r + (o.wt || 5), "stroke-linecap": "round", "stroke-linejoin": "round" }, g);
    el("path", { d, fill: "none", stroke: "var(--fluid)", "stroke-width": 2 * r, "stroke-linecap": "round", "stroke-linejoin": "round" }, g);
    const q = POLY[id].q, nC = Math.max(10, Math.round(POLY[id].len / 14));
    for (let c = 0; c < nC; c++) { const i0 = Math.floor(c * (q.length - 1) / nC), i1 = Math.min(q.length - 1, Math.floor((c + 1) * (q.length - 1) / nC) + 1), pr = prof(id, (c + 0.5) / nC);
      el("path", { d: "M" + q.slice(i0, i1 + 1).map((p) => f1(p[0]) + " " + f1(p[1])).join("L"), fill: "none", stroke: conc(pr.osm), "stroke-width": 2 * r - 1, "stroke-linecap": "round", "stroke-linejoin": "round" }, g); }
    if (o.brush) el("path", { d, fill: "none", stroke: "var(--wall-deep)", "stroke-width": 2 * r - 1, "stroke-dasharray": "0.9 2.1", opacity: 0.7 }, g);   // brush border: tiny radial microvilli
    // cell borders and nuclei along the wall
    const sp = o.cell || 12; for (let s0 = sp / 2; s0 < POLY[id].len; s0 += sp) { const u = s0 / POLY[id].len, [x, y, nx, ny] = at(id, u);
      el("line", { x1: f1(x + nx * (r + 0.5)), y1: f1(y + ny * (r + 0.5)), x2: f1(x + nx * (r + 3.2)), y2: f1(y + ny * (r + 3.2)), stroke: "var(--sheet)", "stroke-width": 0.9, opacity: 0.55 }, g);
      el("line", { x1: f1(x - nx * (r + 0.5)), y1: f1(y - ny * (r + 0.5)), x2: f1(x - nx * (r + 3.2)), y2: f1(y - ny * (r + 3.2)), stroke: "var(--sheet)", "stroke-width": 0.9, opacity: 0.55 }, g);
      if (o.nuc) { const sgn = (Math.round(s0 / sp) % 2) ? 1 : -1; el("ellipse", { cx: f1(x + nx * sgn * (r + 1.8)), cy: f1(y + ny * sgn * (r + 1.8)), rx: 1.9, ry: 1.2, fill: "var(--wall-deep)", opacity: 0.8, transform: "rotate(" + f1(Math.atan2(ny, nx) * 180 / Math.PI) + " " + f1(x + nx * sgn * (r + 1.8)) + " " + f1(y + ny * sgn * (r + 1.8)) + ")" }, g); } }
    TUBES[id] = { r, len: POLY[id].len, g }; return g;
  }
  K.part("pct", tube("pct", 9, { wall: "var(--wall)", wt: 6, brush: 1, cell: 11, nuc: 1 }));
  K.part("dtl", tube("dtl", 3.6, { wall: "var(--wall-hi)", wt: 3, cell: 22 }));
  K.part("tal", tube("tal", 7.5, { wall: "var(--wall-deep)", wt: 5, cell: 10, nuc: 1 }));
  K.part("dct", tube("dct", 6, { wall: "var(--wall)", wt: 5, cell: 9, nuc: 1 }));
  K.part("cd", tube("cd", 7.5, { wall: "var(--wall-deep)", wt: 5, cell: 12, nuc: 1 }));
  // faint tributary tubules joining the collecting duct, and a second duct merging near the papilla
  const trib = (pts) => { path(L.tb, pts, { stroke: "var(--wall-deep)", "stroke-width": 9, opacity: 0.3 }); path(L.tb, pts, { stroke: "var(--fluid)", "stroke-width": 5.5, opacity: 0.6 }); };
  trib([[552, 164], [574, 178], [596, 190], [613, 196]]); trib([[660, 112], [646, 146], [630, 176], [614, 200]]); trib([[532, 330], [552, 372], [566, 402], [561, 424]]); trib([[476, 430], [498, 470], [504, 508]]);
  // AQP-2 channels on the collecting duct wall (open with ADH)
  const aq = grp(L.tf); const cdCh = [];
  for (let k = 0; k < 22; k++) { const [x, y, nx, ny] = at("cd", 0.2 + 0.78 * k / 21), sg = k % 2 ? 1 : -1; cdCh.push(el("rect", { x: f1(x + nx * sg * 8.5 - 1.6), y: f1(y + ny * sg * 8.5 - 1.6), width: 3.2, height: 3.2, rx: 0.8, fill: "var(--cold-hi)", stroke: "var(--sheet)", "stroke-width": 0.8, opacity: 0 }, aq)); }
  K.part("cd", aq);

  /* ---------- glomerulus and Bowman's capsule ---------- */
  const gl = grp(L.tf);
  const capHalo = el("circle", { cx: G[0], cy: G[1], r: RC + 8, fill: "none", stroke: "var(--accent)", "stroke-width": 7, opacity: 0, style: "transition:opacity .4s" }, gl);
  const capsule = el("circle", { cx: G[0], cy: G[1], r: RC, fill: "var(--fluid)", stroke: "var(--wall-deep)", "stroke-width": 3 }, gl);
  el("circle", { cx: G[0], cy: G[1], r: RC - 3.5, fill: "none", stroke: "var(--sheet)", "stroke-width": 0.8, opacity: 0.8 }, gl);
  for (let k = 0; k < 16; k++) { const a = 2 * Math.PI * k / 16 + 0.2; el("ellipse", { cx: f1(G[0] + (RC + 0.2) * Math.cos(a)), cy: f1(G[1] + (RC + 0.2) * Math.sin(a)), rx: 3, ry: 1.3, fill: "var(--wall-hi)", stroke: "var(--wall-deep)", "stroke-width": 0.6, transform: "rotate(" + f1(a * 180 / Math.PI + 90) + " " + f1(G[0] + (RC + 0.2) * Math.cos(a)) + " " + f1(G[1] + (RC + 0.2) * Math.sin(a)) + ")" }, gl); }
  K.part("bowman", gl);
  const tuft = grp(L.vf);
  el("circle", { cx: G[0], cy: G[1], r: 31, fill: "var(--hot-lumen)", stroke: "var(--hot)", "stroke-width": 1.2, opacity: 0.55 }, tuft);
  const loops = [];
  for (let k = 0; k < 10; k++) { const a = 2 * Math.PI * k / 10, r0 = k % 2 ? 15 : 8 + (k % 3) * 2, cx = G[0] + r0 * Math.cos(a), cy = G[1] + r0 * Math.sin(a), ang = a * 180 / Math.PI;
    loops.push(el("ellipse", { cx: f1(cx), cy: f1(cy), rx: 11, ry: 5, fill: k % 3 ? "var(--hot-lumen)" : "none", stroke: k % 2 ? "var(--hot)" : "var(--wall-deep)", "stroke-width": 2.6, opacity: 0.92, transform: "rotate(" + f1(ang) + " " + f1(cx) + " " + f1(cy) + ")" }, tuft)); }
  for (let k = 0; k < 6; k++) { const a = 2 * Math.PI * k / 6 + 0.5; el("circle", { cx: f1(G[0] + 4 * Math.cos(a)), cy: f1(G[1] + 4 * Math.sin(a)), r: 3, fill: "var(--hot)", opacity: 0.55 }, tuft); }
  for (let k = 0; k < 22; k++) { const a = 2 * Math.PI * k / 22; el("circle", { cx: f1(G[0] + 31.5 * Math.cos(a)), cy: f1(G[1] + 31.5 * Math.sin(a)), r: 1.7, fill: "var(--wall-deep)", stroke: "var(--sheet)", "stroke-width": 0.5 }, tuft); }
  K.part("glom", tuft);
  // filtrate droplets crossing the filtration barrier (rate from the model's glomerulus activity)
  const fdrops = [];
  for (let k = 0; k < 18; k++) fdrops.push({ a: 2 * Math.PI * (k + 0.2 * (k % 3)) / 18 + 0.1, ph: (k * 0.37) % 1, c: el("circle", { r: 1.9, fill: "var(--cold-hi)", stroke: "var(--sheet)", "stroke-width": 0.5 }, L.ov) });

  /* ---------- vessels ---------- */
  const vtube = (parent, pts, r, tone, id, op) => { const g = K.vessel(parent, pts, r, { tone, wallWidth: 3 }); if (op) g.setAttribute("opacity", op); if (id) K.part(id, g); return g; };
  vtube(L.vb, ART, 8, "hot", null, 0.85);
  vtube(L.vf, AFF, 4.6, "hot", "afferent"); vtube(L.vb, EFF, 3.8, "hot", "efferent");
  for (let k = 0; k < 4; k++) { const [x, y] = [AFF[3][0] + k * 3 - 6, AFF[3][1] - 3 + k * 3]; el("circle", { cx: x, cy: y, r: 2.6, fill: "var(--wall-deep)", stroke: "var(--fat)", "stroke-width": 0.8 }, L.vf); }   // juxtaglomerular cells
  // peritubular capillary plexus around the PCT: separate thin vessels, arterial end fading to venous
  const plexus = grp(L.vb);
  for (let k = 0; k < 5; k++) { const y0 = 170 + k * 15, pts = []; for (let i = 0; i <= 12; i++) pts.push([88 + i * 17, y0 + 7 * Math.sin(i * 1.1 + k * 1.7)]); K.part("ptc", vtube(plexus, pts, 1.7, k < 2 ? "hot" : "cold", null, 0.55)); }
  K.part("ptc", vtube(L.vb, [[102, 150], [96, 160], [90, 175], [88, 195]], 2.2, "hot", null, 0.55));
    // vasa recta: separate descending (arterial) and ascending (venous) hairpins beside the loops
  const VD = [[286, 256], [300, 300], [316, 380], [338, 452], [352, 494], [360, 512]], VA = [[376, 514], [372, 466], [358, 400], [336, 332], [312, 282], [300, 258]];
  K.part("vasa", vtube(L.vb, VD, 2.6, "hot", null, 0.7)); K.part("vasa", vtube(L.vb, VA, 2.6, "cold", null, 0.7)); K.part("vasa", vtube(L.vb, [[360, 512], [368, 520], [376, 514]], 2.6, "cold", null, 0.7));
  for (const [dx, k] of [[26, 0], [-30, 1]]) { const a = VD.map(([x, y], i) => [x + dx + (([0, 1][0]) + 0) * 3, y + 6]); K.part("vasa", vtube(L.vb, a.slice(0, 5), 1.6, k ? "cold" : "hot", null, 0.35)); }
  const afl = L.ov;
  const flows = K.flows({
    aff: { pts: AFF, w: 3, layer: afl, rate: (i, s) => 0.2 + 0.8 * s.parts.afferent.flow, tone: 1 },
    eff: { pts: EFF, w: 2.5, layer: afl, rate: (i, s) => 0.2 + 0.7 * s.parts.efferent.flow, tone: 0.8 },
    vd: { pts: VD, w: 1.5, layer: afl, rate: (i, s) => 0.1 + 0.6 * s.parts.vasa.flow, tone: "down" },
    va: { pts: VA, w: 1.5, layer: afl, rate: (i, s) => 0.1 + 0.6 * s.parts.vasa.flow, tone: "down" },
    art: { pts: ART, w: 4, layer: afl, rate: () => 0.5, tone: 1 },
  }, [["aff"], ["eff"], ["vd", "va"], ["art"]], { open: true, r: 1.8, spacing: 16 });

  /* ---------- macula densa ---------- */
  const mdp = at("tal", 0.97), md = grp(L.tf);
  for (let k = 0; k < 9; k++) { const t = 0.9 + 0.1 * k / 8, [x, y, nx, ny] = at("tal", t); el("ellipse", { cx: f1(x + nx * 9.5), cy: f1(y + ny * 9.5), rx: 2.4, ry: 3.4, fill: "var(--wall-deep)", stroke: "var(--sheet)", "stroke-width": 0.6, transform: "rotate(" + f1(Math.atan2(ny, nx) * 180 / Math.PI + 90) + " " + f1(x + nx * 9.5) + " " + f1(y + ny * 9.5) + ")" }, md); }
  const mdGlow = el("circle", { cx: f1(mdp[0]), cy: f1(mdp[1]), r: 18, fill: "var(--accent)", opacity: 0 }, md); md.insertBefore(mdGlow, md.firstChild);
  K.part("md", md);

  /* ---------- particles inside the tubes (water = blue, solute = red) and leaving them ---------- */
  const STR = []; const inner = grp(L.tf);
  for (const id of ["pct", "dtl", "tal", "dct", "cd"]) { const n = Math.round(POLY[id].len / (id === "dtl" ? 10 : 7));
    for (let j = 0; j < n; j++) STR.push({ id, s: (j + rnd() * 0.8) / n * POLY[id].len, off: rnd() * 2 - 1, r: rnd(), w: el("circle", { r: 1.7, fill: "var(--cold-hi)" }, inner), x: el("circle", { r: 1.25, fill: "var(--hot-hi)" }, inner) }); }
  for (const id of ["bowman"]) for (let j = 0; j < 6; j++) STR.push({ id, s: j / 6 * POLY[id].len, off: rnd() * 2 - 1, r: j / 6, w: el("circle", { r: 1.7, fill: "var(--cold-hi)" }, inner), x: el("circle", { r: 1.25, fill: "var(--hot-hi)" }, inner) });
  const KIND = { pct: "w", dtl: "w", cd: "w", tal: "s", dct: "s" }, DENS = { pct: 40, dtl: 46, tal: 46, dct: 20, cd: 40 };
  const DROPS = [];
  for (const id in DENS) for (let j = 0; j < DENS[id]; j++) DROPS.push({ id, s: (j + rnd()) / DENS[id], side: j % 2 ? 1 : -1, ph: rnd(), r: rnd(), c: el(KIND[id] === "w" ? "circle" : "rect", KIND[id] === "w" ? { r: 2.8, fill: "var(--cold-hi)", stroke: "var(--sheet)", "stroke-width": 1 } : { width: 4.6, height: 4.6, rx: 1, fill: "var(--hot-hi)", stroke: "var(--sheet)", "stroke-width": 1 }, L.ov) });

  /* ---------- the gradient scale, parcel depth marker, labels ---------- */
  const bar = grp(L.bg); const barG = el("linearGradient", { id: "gB", gradientUnits: "userSpaceOnUse", x1: 0, y1: 262, x2: 0, y2: 590 }, defs);
  for (let k = 0; k <= 10; k++) el("stop", { offset: k / 10, style: "stop-color:" + conc(M.interstitium(k / 10), 1.15) }, barG);
  el("rect", { x: 26, y: 262, width: 13, height: 328, rx: 2, fill: "url(#gB)", stroke: "var(--wall-deep)", "stroke-width": 1 }, bar);
  [0, 1 / 3, 2 / 3, 1].forEach((d) => { const y = 262 + 328 * d; el("line", { x1: 39, y1: y, x2: 44, y2: y, stroke: "var(--ink)", "stroke-width": 1 }, bar); K.label(47, y + 3.5, String(Math.round(M.interstitium(d))), "start"); });
  K.label(26, 244, "Interstitium, mOsm/kg", "start");
  const mark = grp(L.ov); const mLine = el("line", { x1: 40, x2: 700, y1: 0, y2: 0, stroke: "var(--accent)", "stroke-width": 1.1, "stroke-dasharray": "3 4", opacity: 0.7 }, mark);
  el("path", { d: "M44 0 l-9 -5.5 v11z", fill: "var(--accent)", stroke: "var(--sheet)", "stroke-width": 1 }, mark);
  const mTxt = K.label(80, 0, "", "start", { strong: true });
  const lab = (x, y, t, a) => K.label(x, y, t, a || "start");
  lab(272, 104, "Bowman's capsule", "end"); lab(344, 176, "Glomerulus", "start");
  lab(170, 82, "Afferent arteriole", "middle"); lab(190, 33, "Efferent arteriole", "middle");
  lab(58, 205, "Interlobular artery", "start"); lab(168, 178, "Proximal convoluted tubule", "middle");
  lab(205, 260, "Peritubular capillaries", "middle");
  lab(210, 424, "Thin descending limb", "end"); lab(432, 400, "Thick ascending limb", "start");
  lab(398, 202, "Macula densa", "end"); lab(520, 40, "Distal convoluted tubule", "middle");
  lab(626, 236, "Collecting duct", "start"); lab(366, 462, "Vasa recta", "start");
  lab(380, 590, "Loop of Henle tip", "middle"); lab(722, 62, "Interlobular vein", "end");
  lab(320, 600, "Papilla", "end"); lab(484, 618, "urine to ureter: ≈ " + urine.toFixed(1) + " L/day", "start");
  lab(534, 446, "AQP2 channels (ADH)", "end"); lab(434, 414, "NKCC2 pumps NaCl out", "start");
  const tagC = K.tag(676, 206, "Cortex"), tagM = K.tag(500, 366, "Medulla");
  tagC.set(Math.round(M.interstitium(0)) + " mOsm/kg");
  K.label(272, 126, "NFP " + M.nfp.PGC + " − " + M.nfp.PBS + " − " + M.nfp.PIGC + " = " + (M.nfp.PGC - M.nfp.PBS - M.nfp.PIGC) + " mmHg", "end");

  /* ---------- per-frame: reads the model only ---------- */
  const IDS = ["bowman", "pct", "dtl", "tal", "dct", "cd"];
  return {
    paths: P,
    update(i, s, d) {
      const dm = clamp(Math.abs(d || 0), 0, 0.02) * M.T, part = s.parcel.part, u = s.parcel.u;
      IDS.forEach((id) => { const on = part === id ? 0.5 : 0; if (HALO[id]) HALO[id].setAttribute("opacity", on); });
      capHalo.setAttribute("opacity", part === "bowman" ? 0.5 : 0);
      mdGlow.setAttribute("opacity", f1(0.45 * s.parts.md.active));
      const ga = s.parts.glom.active;
      tuft.setAttribute("opacity", f1(0.8 + 0.2 * ga));
      loops.forEach((l, k) => l.setAttribute("stroke-width", f1(2.2 + 1.1 * ga)));
      fdrops.forEach((p) => { p.ph = (p.ph + dm * 0.35 * (0.3 + ga)) % 1; const r = 31 + p.ph * 7.5; p.c.setAttribute("cx", f1(G[0] + r * Math.cos(p.a))); p.c.setAttribute("cy", f1(G[1] + r * Math.sin(p.a))); p.c.setAttribute("opacity", f1(ga * Math.sin(Math.PI * p.ph))); });
      // particles inside tubes: density follows the parcel's volume (blue) and osmolality (red) at that spot
      STR.forEach((p) => { const g = POLY[p.id], fl = p.id === "bowman" ? 0.5 : 0.35 + 0.65 * (prof(p.id, p.s / g.len).vol / 100) ** 0.3;
        p.s = (p.s + dm * 20 * fl) % g.len; const u0 = p.s / g.len, pr = prof(p.id, u0), [x, y, nx, ny] = at(p.id, u0), r = TUBES[p.id] ? TUBES[p.id].r : 6, o = p.off * (r - 2.2);
        const fw = 0.1 + 0.9 * Math.pow(clamp(pr.vol / 100, 0, 1), 0.4), fs = clamp(pr.osm / 1200, 0, 1) * 0.9 + 0.05;
        p.w.setAttribute("cx", f1(x + nx * o)); p.w.setAttribute("cy", f1(y + ny * o)); p.w.setAttribute("opacity", p.r < fw ? 0.95 : 0);
        p.x.setAttribute("cx", f1(x - nx * o * 0.6 + ny * 1.5)); p.x.setAttribute("cy", f1(y - ny * o * 0.6 - nx * 1.5)); p.x.setAttribute("opacity", ((p.r * 7.3) % 1) < fs ? 0.9 : 0); });
      // water and salt leaving the tubule: strongest around the parcel, faint along the rest of the segment
      DROPS.forEach((p) => { const here = part === p.id, near = here ? clamp(1 - Math.abs(p.s - u) / 0.4, 0, 1) : 0, a = prof(p.id, p.s).act * (0.18 + 0.82 * near) * (here ? 1 : 0.55);
        const vis = p.r < a * 1.6 + 0.02 && (here || a > 0.01);
        p.ph = (p.ph + dm * 0.28 * (0.5 + a)) % 1;
        const [x, y, nx, ny] = at(p.id, p.s), r = TUBES[p.id].r, dist = r + 3 + p.ph * 26, X = x + nx * p.side * dist, Y = y + ny * p.side * dist;
        if (p.c.tagName === "circle") { p.c.setAttribute("cx", f1(X)); p.c.setAttribute("cy", f1(Y)); } else { p.c.setAttribute("x", f1(X - 2.3)); p.c.setAttribute("y", f1(Y - 2.3)); }
        p.c.setAttribute("opacity", vis ? f1(Math.sin(Math.PI * Math.min(1, p.ph * 1.1)) * (0.35 + 0.65 * near)) : 0); });
      cdCh.forEach((c) => c.setAttribute("opacity", s.parts.cd.open ? (part === "cd" ? 1 : 0.6) : 0));
      // medullary depth marker driven by the model's local interstitial value
      const [px, py] = at(part, u), y = clamp(py, 262, 590), ty = clamp(py, 270, 584);
      mark.setAttribute("transform", "translate(0 " + f1(y) + ")"); mark.setAttribute("opacity", py > 262 ? 1 : 0.35);
      mLine.setAttribute("x2", f1(Math.min(700, 96 + Math.max(0, y - 340) * 0.9 + 560 - Math.max(0, y - 340) * 1.8)));
      mTxt.setAttribute("y", f1(y + 4)); mTxt.textContent = "local " + Math.round(s.readouts.interst);
      tagM.set(Math.round(s.readouts.interst) + " mOsm/kg here");
      flows.update(i, s, d);
    },
  };
}
