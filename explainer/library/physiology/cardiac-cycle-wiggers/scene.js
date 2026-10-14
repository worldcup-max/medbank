/* Library plate: the Four-Chamber Heart. A frontal cutaway (atria, ventricles, outflow tracts, four valves with chordae and papillary
   muscles, coronary grooves, great vessels, both lungs and the systemic beds), every chamber sized by the model's volumes every frame,
   every valve set by the model's flows, and the blood moved by the model's flows. Ported from the hand-built Four-Chamber Heart. */
function createScene(svg, K, M, S) {
  const L = K.layers("bg", "back", "pback", "mid", "pmid", "front", "pfront", "top");
  const el = K.el, f1 = K.f1, N = S.length, T = M.T;
  // the hand-built plate was drawn on 730×690; fit it to the 760×640 plate
  const SC = 0.9275, TX = 38, TY = 2;
  // show exactly the hand-built frame (730×690 → 677×640 here), so the heart is drawn as large as the original; QA bounds still hold
  svg.setAttribute("viewBox", `${TX} 0 ${f1(730 * SC)} 640`);
  const P = (p) => [p[0] * SC + TX, p[1] * SC + TY], mp = (pts) => pts.map(P), R = (r) => r * SC, mid = (a, b) => [(a[0] + b[0]) / 2, (a[1] + b[1]) / 2];
  const norm = (v) => { const l = Math.hypot(v[0], v[1]) || 1; return [v[0] / l, v[1] / l]; };
  const sh = (pts, dx) => pts.map(([x, y]) => [x + dx, y]);

  // ---------------- anatomy at rest (hand-built coordinates, mapped) ----------------
  const TRI = mp([[256, 380], [322, 374]]), MIT = mp([[452, 354], [516, 350]]);
  const CH = {
    RA: { ann: TRI, Vref: 45, k: 0.5, reach: R(120), vol: "RAV", fill: "var(--cold-lumen)", pts: mp([[256, 380], [232, 372], [214, 352], [208, 316], [213, 282], [226, 258], [248, 248], [272, 252], [292, 270], [302, 302], [310, 342], [322, 374]]) },
    LA: { ann: MIT, Vref: 45, k: 0.5, reach: R(90), vol: "LAV", fill: "var(--hot-lumen)", pts: mp(sh([[446, 354], [436, 330], [434, 300], [442, 276], [465, 263], [505, 263], [527, 277], [536, 301], [530, 329], [510, 350]], 6)) },
    RV: { ann: TRI, Vref: 80, k: 0.45, reach: R(170), vol: "RVV", fill: "var(--cold-lumen)", pts: mp([[256, 382], [322, 376], [346, 387], [372, 407], [392, 442], [404, 492], [410, 536], [400, 562], [370, 560], [322, 532], [284, 494], [264, 448], [256, 414]]) },
    LV: { ann: MIT, Vref: 90, k: 0.45, reach: R(220), vol: "LVV", fill: "var(--hot-lumen)", pts: mp(sh([[446, 356], [437, 390], [433, 442], [440, 504], [458, 560], [478, 598], [498, 596], [514, 556], [524, 496], [527, 428], [523, 378], [510, 352]], 6)) },
  };
  const BODY = { ann: mp([[244, 392], [560, 340]]), k: 0.12, reach: R(260), pts: mp([[204, 262], [190, 318], [195, 366], [222, 389], [244, 402], [244, 444], [258, 494], [298, 548], [368, 594], [438, 632], [480, 632], [516, 604], [542, 552], [558, 482], [566, 404], [563, 344], [552, 294], [534, 262], [506, 248], [474, 250], [452, 258], [432, 266], [396, 270], [360, 268], [334, 254], [322, 236], [300, 232], [276, 240], [250, 242], [224, 248]]) };
  const LVOT = { c: mp([[458, 424], [446, 380], [404, 332], [362, 302]]), r: R(15) }, RVOT = { c: mp([[366, 446], [372, 394], [398, 330], [425, 270]]), r: R(16) };
  const AO_ASC = mp([[362, 302], [346, 276], [340, 240], [348, 200], [372, 162], [410, 142], [460, 136], [503, 146], [528, 172], [538, 214], [538, 280]]);
  const AO_DESC = mp([[538, 250], [538, 420], [538, 560], [538, 634]]);
  const TRUNK = mp([[425, 270], [430, 241], [433, 216]]), LPA = mp([[433, 216], [470, 211], [520, 214], [562, 226], [592, 240]]), RPA = mp([[433, 216], [396, 207], [322, 203], [252, 212], [182, 236]]);
  const SVC = mp([[246, 46], [246, 150], [248, 212], [250, 254]]), IVC = mp([[212, 650], [208, 560], [210, 470], [216, 400], [222, 364]]);
  const LPV = [mp([[614, 282], [578, 283], [540, 286]]), mp([[614, 318], [578, 316], [538, 318]])];
  const RPV = [mp([[154, 282], [240, 272], [330, 276], [452, 292]]), mp([[154, 318], [250, 316], [340, 318], [452, 320]])];
  const BRANCH = [mp([[392, 150], [384, 100], [378, 50]]), mp([[446, 137], [448, 90], [450, 50]]), mp([[492, 142], [508, 94], [522, 50]])];
  const LUNG_R = mp([[172, 158], [128, 150], [86, 178], [56, 240], [42, 320], [46, 400], [70, 462], [118, 474], [160, 450], [176, 390], [178, 300], [176, 220]]);
  const LUNG_L = mp([[578, 158], [620, 150], [658, 178], [686, 240], [696, 320], [692, 400], [670, 462], [626, 474], [594, 452], [584, 400], [598, 352], [588, 300], [582, 220]]);
  const PAP = { RV: mp([[332, 516], [380, 526]]), LV: mp([[466, 528], [508, 516]]) };

  // ---------------- static plate ----------------
  const vessel = (pts, r, tone, layer, cap = "round") => K.vessel(layer, pts, R(r), { tone, cap, wallWidth: 5 * SC });
  // systemic capillary beds (head and arms above, trunk and legs below)
  const bed = (x, y, w, h, label) => { [x, y] = P([x, y]); w = R(w); h = R(h);
    el("rect", { x: f1(x), y: f1(y), width: f1(w), height: f1(h), rx: f1(h / 2), fill: "var(--bed)", stroke: "var(--hair)" }, L.bg);
    for (let k = 0; k < 26; k++) { const xx = x + 13 + k * (w - 26) / 25; el("path", { d: `M${f1(xx)} ${f1(y + 5)} q 4 ${f1(h / 2 - 5)} 0 ${f1(h - 10)}`, fill: "none", stroke: k % 2 ? "var(--hot)" : "var(--cold)", "stroke-width": 0.8, opacity: 0.35 }, L.bg); }
    K.label(x + w / 2, y + h / 2 + 3.5, label, "middle"); };
  bed(186, 22, 360, 30, "Head and arms · systemic capillaries");
  bed(176, 640, 400, 30, "Trunk and legs · systemic capillaries");
  // lungs, with their bronchovascular tree
  const lungFill = "color-mix(in srgb, var(--hot-lumen) 45%, var(--bed))", lungLine = "color-mix(in srgb, var(--wall-hi) 70%, var(--bed))";
  for (const [pts, name, x0] of [[LUNG_R, "Right lung", 108], [LUNG_L, "Left lung", 636]]) {
    el("path", { d: K.spline(pts, true), fill: lungFill, stroke: lungLine, "stroke-width": 1.2 }, L.bg);
    const [cx, cy] = P([x0, 320]);
    for (let i = 0; i < 9; i++) { const a = 0.3 + i * 0.32;
      el("path", { d: `M${f1(cx)} ${f1(cy)} q ${f1(R(Math.cos(a) * 30))} ${f1(R(Math.sin(a) * 50 - 40))} ${f1(R(Math.cos(a + 0.4) * 52))} ${f1(R(Math.sin(a + 0.4) * 110 - 40))}`, fill: "none", stroke: lungLine, "stroke-width": 0.8, opacity: 0.8 }, L.bg); }
    const lp = P([x0, 494]); K.label(lp[0], lp[1], name, "middle"); }
  // behind the heart: descending aorta, right pulmonary veins and artery, inferior vena cava
  K.part("aorta", vessel(AO_DESC, 15, "hot", L.back));
  RPV.forEach((v) => K.part("pveins", vessel(v, 7, "hot", L.back)));
  K.part("pa", vessel(RPA, 12, "cold", L.back));
  K.part("cavae", vessel(IVC, 13, "cold", L.back, "butt"));
  // arch branches and the far half of the arch
  BRANCH.forEach((b) => K.part("aorta", vessel(b, 7, "hot", L.mid)));
  K.part("aorta", vessel(AO_ASC.slice(4), 15, "hot", L.mid));
  // the heart: outer surface, AV-groove fat with the coronary arteries in section, chambers, outflow tracts
  const body = K.blob(L.mid, BODY.pts, { width: 1.6 });
  const fatR = el("path", { fill: "none", stroke: "var(--fat)", "stroke-width": R(9), "stroke-linecap": "round" }, L.mid);
  const fatL = el("path", { fill: "none", stroke: "var(--fat)", "stroke-width": R(7), "stroke-linecap": "round" }, L.mid);
  const rca = el("circle", { r: R(4.2), fill: "var(--hot-lumen)", stroke: "var(--hot)", "stroke-width": 1.5 }, L.mid);
  const lcx = el("circle", { r: R(3.8), fill: "var(--hot-lumen)", stroke: "var(--hot)", "stroke-width": 1.5 }, L.mid);
  const cav = {}; const cavity = (k) => (cav[k] = K.part(k, K.blob(L.mid, CH[k].pts, { fill: CH[k].fill, width: 1.3 })));
  cavity("RA"); cavity("LA");
  const tract = (t, lumen, wallG, lumG, part) => { const d = K.spline(t.c, false);
    el("path", { d, fill: "none", stroke: "var(--wall-deep)", "stroke-width": f1(2 * t.r + R(15)), "stroke-linecap": "butt" }, wallG);
    el("path", { d, fill: "none", stroke: "url(#kTissue)", "stroke-width": f1(2 * t.r + R(12)), "stroke-linecap": "butt" }, wallG);
    el("path", { d, fill: "none", stroke: "var(--wall-deep)", "stroke-width": f1(2 * t.r + R(2.6)), "stroke-linecap": "butt" }, wallG);
    K.part(part, el("path", { d, fill: "none", stroke: lumen, "stroke-width": f1(2 * t.r), "stroke-linecap": "butt" }, lumG)); };
  const gLVOTw = el("g", {}, L.mid), gLVOTl = el("g", {}, L.mid); cavity("LV");
  const gRVOTw = el("g", {}, L.mid); cavity("RV"); const gRVOTl = el("g", {}, L.mid);
  tract(LVOT, "var(--hot-lumen)", gLVOTw, gLVOTl, "LV"); tract(RVOT, "var(--cold-lumen)", gRVOTw, gRVOTl, "RV");
  K.part("RV", el("circle", { cx: f1(RVOT.c[0][0]), cy: f1(RVOT.c[0][1]), r: f1(RVOT.r), fill: "var(--cold-lumen)" }, gRVOTl));
  const papG = el("g", {}, L.mid), papEls = { RV: [0, 1].map(() => K.part("RV", el("path", { fill: "url(#kTissue)", stroke: "var(--wall-deep)", "stroke-width": 1 }, papG))), LV: [0, 1].map(() => K.part("LV", el("path", { fill: "url(#kTissue)", stroke: "var(--wall-deep)", "stroke-width": 1 }, papG))) };
  K.part("cavae", vessel(SVC, 12, "cold", L.mid, "butt"));
  K.part("aorta", vessel(AO_ASC.slice(0, 6), 15, "hot", L.mid, "butt"));
  LPV.forEach((v) => K.part("pveins", vessel(v, 7, "hot", L.mid, "butt")));
  // in front: the pulmonary trunk and left pulmonary artery are the most anterior structures
  K.part("pa", vessel(TRUNK, 15, "cold", L.front, "butt")); K.part("pa", vessel(LPA, 11, "cold", L.front));
  { const c = P([433, 216]); K.part("pa", el("circle", { cx: f1(c[0]), cy: f1(c[1]), r: R(14), fill: "var(--cold-lumen)" }, L.front)); }

  // ---------------- valves, chordae ----------------
  const ringOf = (c, r) => { const p = c[c.length - 1], q = c[c.length - 2], d = norm([p[0] - q[0], p[1] - q[1]]); return { A: [p[0] - d[1] * r, p[1] + d[0] * r], B: [p[0] + d[1] * r, p[1] - d[0] * r], down: d }; };
  const AOR = ringOf(LVOT.c, LVOT.r), PUR = ringOf(RVOT.c, RVOT.r);
  const chordG = el("g", {}, L.top);
  const VG = { tricuspid: { A: TRI[0], B: TRI[1], down: norm([0.1, 1]), kind: "av", ch: "RV", q: "tricuspid" }, mitral: { A: MIT[0], B: MIT[1], down: norm([0.05, 1]), kind: "av", ch: "LV", q: "mitral" },
    pulmonary: { A: PUR.A, B: PUR.B, down: PUR.down, kind: "sl", q: "pulmonic" }, aortic: { A: AOR.A, B: AOR.B, down: AOR.down, kind: "sl", q: "aortic" } };
  const valve = {}, chords = {};
  for (const id in VG) { valve[id] = K.part(id, K.valve(L.top, VG[id].A, VG[id].B, VG[id].down, VG[id].kind));
    if (VG[id].kind === "av") chords[id] = [0, 1, 2, 3].map(() => K.part(id, el("path", { fill: "none", stroke: "var(--leaflet-edge)", "stroke-width": 0.9, opacity: 0.8 }, chordG))); }
  // valve openness from forward flow, eased (leaflets swing rather than snap); heart sounds where the AV and semilunar valves close
  const OPEN = {}; for (const id in VG) { const o = new Float32Array(N), a = 1 - Math.exp(-(T / N) / 0.016); let x = 0;
    for (let pass = 0; pass < 3; pass++) for (let i = 0; i < N; i++) { x += ((S[i].q[VG[id].q] > 0.01 ? 1 : 0) - x) * a; o[i] = x; } OPEN[id] = o; }
  // closure flash: AV rings light at S1 (mitral closes), semilunar rings at S2 (aortic closes), fading over ~60 ms
  const FLASH = { av: new Float32Array(N), sl: new Float32Array(N) };
  for (const [qk, kind] of [["mitral", "av"], ["aortic", "sl"]]) for (let k = 0; k < N; k++) if (S[(k + N - 1) % N].q[qk] > 0.01 && S[k].q[qk] <= 0.01)
    for (let j = 0; j < 45; j++) { const m = (k + j) % N; FLASH[kind][m] = Math.max(FLASH[kind][m], 1 - j / 45); }

  // ---------------- labels and live chamber tags ----------------
  const lab = (x, y, t, a) => { const p = P([x, y]); K.label(p[0], p[1], t, a); };
  [[238, 112, "Superior vena cava", "end"], [200, 560, "Inferior vena cava", "end"], [566, 204, "Pulmonary artery", "start"],
   [640, 352, "Pulmonary veins", "middle"], [564, 604, "Descending aorta", "start"], [528, 370, "mitral", "start"], [334, 338, "aortic valve", "end"]].forEach((a) => lab(...a));
  // placed in plate coordinates, in measured free space next to their structures
  K.label(340, 239, "Aorta", "end"); K.label(466, 247, "pulmonary", "start"); K.label(466, 258, "valve", "start");
  { const a = P([338, 333]), v = mid(AOR.A, AOR.B); el("path", { d: `M${f1(a[0])} ${f1(a[1])}L${f1(v[0] - 4)} ${f1(v[1] + 6)}`, stroke: "var(--muted)", "stroke-width": 0.7 }, L.top); }
  K.label(300, 396, "tricuspid", "middle"); el("path", { d: "M301 386L305 362", stroke: "var(--muted)", "stroke-width": 0.7 }, L.top);
  const TAGPOS = { RA: [256, 298], RV: [324, 470], LA: [492, 300], LV: [484, 470] }, tags = {};
  for (const k in TAGPOS) { const p = P(TAGPOS[k]); tags[k] = K.tag(p[0], p[1], k); }

  // ---------------- blood: each segment moves at its own model flow; chamber segments ride the deforming chambers ----------------
  let DEF = {};
  const q = (id, f = 1) => (i, s) => s.q[id] * f, qmax = (a, b) => (i, s) => Math.max(s.q[a], s.q[b]);
  const gate = (id) => (i) => OPEN[id][i];
  const warp = (ch) => (p) => (DEF[ch] ? DEF[ch](p) : p);
  const triM = mid(...TRI), mitM = mid(...MIT);
  const seg = (pts, rate, w, tone, layer, extra = {}) => ({ pts, rate, w: R(w), tone, layer, ...extra });
  const SEGS = {
    svc: seg(SVC, q("cava", 0.9), 8, 0, L.pmid), ivc: seg(IVC, q("cava", 0.9), 9, 0, L.pback),
    raS: seg(mp([[250, 254], [262, 290], [280, 334]]).concat([triM]), qmax("cava", "tricuspid"), 20, 0, L.pmid, { warp: warp("RA"), gate: gate("tricuspid") }),
    raI: seg(mp([[222, 364], [246, 366]]).concat([triM]), qmax("cava", "tricuspid"), 8, 0, L.pmid, { warp: warp("RA"), gate: gate("tricuspid") }),
    rv: seg([triM].concat(mp([[296, 432], [322, 490], [366, 524], [376, 486]]), [RVOT.c[0]]), qmax("tricuspid", "pulmonic"), 15, 0, L.pmid, { warp: warp("RV") }),
    rvot: seg(RVOT.c, (i, s) => Math.max(s.q.pulmonic, 0.3 * s.q.tricuspid), 10, 0, L.pfront, { gate: gate("pulmonary") }),
    trunk: seg(TRUNK, q("pulmonic"), 9, 0, L.pfront), lpa: seg(LPA, q("pulmonary", 0.5), 7, 0, L.pfront), rpa: seg(RPA, q("pulmonary", 0.5), 7, 0, L.pback),
    lungL1: seg(mp([[592, 240], [636, 232], [672, 262], [644, 280], [614, 282]]), q("pulmonary", 0.5), 13, "up", L.pmid),
    lungL2: seg(mp([[592, 240], [656, 300], [676, 362], [646, 334], [614, 318]]), q("pulmonary", 0.5), 13, "up", L.pmid),
    lungR1: seg(mp([[182, 236], [120, 222], [70, 252], [112, 278], [154, 282]]), q("pulmonary", 0.5), 13, "up", L.pmid),
    lungR2: seg(mp([[182, 236], [90, 302], [66, 382], [118, 352], [154, 318]]), q("pulmonary", 0.5), 13, "up", L.pmid),
    lpv1: seg(LPV[0], q("pveins", 0.5), 4.5, 1, L.pmid), lpv2: seg(LPV[1], q("pveins", 0.5), 4.5, 1, L.pmid),
    rpv1: seg(RPV[0], q("pveins", 0.5), 4.5, 1, L.pback), rpv2: seg(RPV[1], q("pveins", 0.5), 4.5, 1, L.pback),
    laR1: seg(mp([[540, 286], [508, 298]]).concat([mitM]), qmax("pveins", "mitral"), 13, 1, L.pmid, { warp: warp("LA"), gate: gate("mitral") }),
    laR2: seg(mp([[538, 318], [512, 330]]).concat([mitM]), qmax("pveins", "mitral"), 10, 1, L.pmid, { warp: warp("LA"), gate: gate("mitral") }),
    laL1: seg(mp([[452, 292], [470, 310]]).concat([mitM]), qmax("pveins", "mitral"), 11, 1, L.pmid, { warp: warp("LA"), gate: gate("mitral") }),
    laL2: seg(mp([[452, 320], [468, 334]]).concat([mitM]), qmax("pveins", "mitral"), 9, 1, L.pmid, { warp: warp("LA"), gate: gate("mitral") }),
    lv: seg([mitM].concat(mp([[498, 430], [490, 530], [466, 496]]), [LVOT.c[0]]), qmax("mitral", "aortic"), 17, 1, L.pmid, { warp: warp("LV") }),
    lvot: seg(LVOT.c, (i, s) => Math.max(s.q.aortic, 0.3 * s.q.mitral), 9, 1, L.pmid, { gate: gate("aortic") }),
    asc: seg(AO_ASC.slice(0, 5), q("aortic"), 10, 1, L.pmid),
    arch2: seg(mp([[372, 162], [410, 142], [446, 137]]), (i, s) => 0.5 * (s.q.aortic + s.q.systemic), 10, 1, L.pmid),
    arch3: seg(mp([[372, 162], [410, 142], [460, 136], [492, 142]]), (i, s) => 0.5 * (s.q.aortic + s.q.systemic), 10, 1, L.pmid),
    arch4: seg(AO_ASC.slice(4, 10), (i, s) => 0.5 * (s.q.aortic + s.q.systemic), 10, 1, L.pmid),
    desc: seg(mp([[538, 214], [538, 280], [538, 420], [538, 560], [538, 634]]), q("systemic", 0.7), 9, 1, L.pback),
    br1: seg([P([372, 162])].concat(BRANCH[0].slice(1)), q("systemic", 0.6), 4, 1, L.pmid), br2: seg(BRANCH[1], q("systemic", 0.6), 4, 1, L.pmid), br3: seg(BRANCH[2], q("systemic", 0.6), 4, 1, L.pmid),
    headA: seg(mp([[378, 50], [330, 38], [280, 40], [246, 46]]), q("systemic", 0.6), 9, "down", L.pmid),
    headB: seg(mp([[450, 50], [380, 34], [300, 40], [246, 46]]), q("systemic", 0.6), 9, "down", L.pmid),
    headC: seg(mp([[522, 50], [450, 36], [330, 42], [246, 46]]), q("systemic", 0.6), 9, "down", L.pmid),
    legs: seg(mp([[538, 634], [480, 662], [360, 650], [250, 662], [212, 650]]), q("systemic", 0.7), 9, "down", L.pmid),
  };
  // rate is in model units (mL/s); K.flows moves rate × dBeat × speed px, so speed = T × 1.35 × scale gives the hand-built pace
  for (const id in SEGS) { const r = SEGS[id].rate; SEGS[id].rate = (i, s) => r(i, s) * 1.35 * SC; }
  const after = ["ivc", "raI", "rv", "rvot", "trunk"];
  const flows = K.flows(SEGS, [
    ["lv", "lvot", "asc", "br1", "headA", "svc", "raS", "rv", "rvot", "trunk", "rpa", "lungR1", "rpv1", "laL1"],
    ["lv", "lvot", "asc", "arch2", "br2", "headB", "svc", "raS", "rv", "rvot", "trunk", "lpa", "lungL1", "lpv1", "laR1"],
    ["lv", "lvot", "asc", "arch3", "br3", "headC", "svc", "raS", "rv", "rvot", "trunk", "lpa", "lungL2", "lpv2", "laR2"],
    ["lv", "lvot", "asc", "arch4", "desc", "legs", ...after, "rpa", "lungR2", "rpv2", "laL2"],
    ["lv", "lvot", "asc", "arch4", "desc", "legs", ...after, "lpa", "lungL2", "lpv2", "laR2"],
  ], { spacing: 12, r: 2.3, speed: T });

  return {
    update(i, s, d) {
      const r = s.readouts;
      DEF = {}; for (const k in CH) { const c = CH[k]; DEF[k] = K.deformer(c.ann[0], c.ann[1], c.reach, K.volumeScale(r[c.vol], c.Vref, c.k)); cav[k].set(c.pts.map(DEF[k])); }
      const dM = K.deformer(BODY.ann[0], BODY.ann[1], BODY.reach, K.volumeScale(r.LVV + r.RVV, 170, BODY.k)); body.set(BODY.pts.map(dM));
      fatR.setAttribute("d", K.spline(mp([[197, 364], [222, 389], [243, 401]]).map(dM), false)); fatL.setAttribute("d", K.spline(mp([[566, 360], [563, 340], [558, 318]]).map(dM), false));
      const rc = dM(P([222, 389])), lc = dM(P([563, 340])); rca.setAttribute("cx", f1(rc[0] + 2)); rca.setAttribute("cy", f1(rc[1] - 2)); lcx.setAttribute("cx", f1(lc[0] - 1)); lcx.setAttribute("cy", f1(lc[1]));
      // papillary muscles ride their ventricle; chordae run from each AV leaflet to its papillary tip
      const tips = {}; for (const k of ["RV", "LV"]) PAP[k].forEach((p, j) => { const base = DEF[k]([p[0] + (k === "LV" && j ? 9 : 0), p[1] + 13]), tip = DEF[k](p); tips[k + j] = tip;
        papEls[k][j].setAttribute("d", `M${f1(base[0] - 6.5)} ${f1(base[1])}Q${f1(tip[0] - 5.5)} ${f1(tip[1] + 2)} ${f1(tip[0])} ${f1(tip[1] - 3)}Q${f1(tip[0] + 5.5)} ${f1(tip[1] + 2)} ${f1(base[0] + 6.5)} ${f1(base[1])}Z`); });
      for (const id in VG) { const v = valve[id]; v.set(OPEN[id][i]);
        if (chords[id]) v.tips.forEach((tp, j) => { const pp = tips[VG[id].ch + j], A = j ? VG[id].B : VG[id].A, m = mid(A, tp);
          chords[id][j * 2].setAttribute("d", `M${f1(tp[0])} ${f1(tp[1])}L${f1(pp[0])} ${f1(pp[1] - 3)}`); chords[id][j * 2 + 1].setAttribute("d", `M${f1(m[0])} ${f1(m[1])}L${f1(pp[0])} ${f1(pp[1] - 3)}`); });
        v.flash(FLASH[VG[id].kind][i]); }
      for (const k in tags) tags[k].set(`${Math.round(r[k + "P"])} mmHg · ${Math.round(r[k + "V"])} mL`);
      flows.update(i, s, d);
    },
  };
}
