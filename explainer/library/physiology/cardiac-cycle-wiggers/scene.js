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


  // =================== LENSES: seven magnified views, each driven by the same sample s and frame index i as the heart ===================
  const DT = T / N, TX_ = K.text, rgn = (x, y, w, h) => { const a = P([x, y]); return [f1(a[0]), f1(a[1]), f1(R(w)), f1(R(h))]; };
  const PK = { LV: "LVP", SA: "AoP", LA: "LAP", RV: "RVP", PA: "PAP", RA: "RAP" }, pr = (s, k) => s.readouts[PK[k]], vl = (s, k) => s.readouts[k + "V"];
  const LVVs = S.map((s) => s.readouts.LVV), RVVs = S.map((s) => s.readouts.RVV), EDV = Math.max(...LVVs), ESV = Math.min(...LVVs), RVmax = Math.max(...RVVs), RVmin = Math.min(...RVVs);
  const SVOL = EDV - ESV, EF = SVOL / EDV;
  const edge = (q, opening) => { for (let k = 0; k < N; k++) { const a = S[(k + N - 1) % N].q[q] > 0.01, b = S[k].q[q] > 0.01; if (opening ? (!a && b) : (a && !b)) return k; } return 0; };
  const EVT = { MVO: edge("mitral", true), MVC: edge("mitral", false), AVO: edge("aortic", true), AVC: edge("aortic", false) };
  const SND = [{ k: EVT.MVC, s: "S1" }, { k: EVT.AVC, s: "S2" }];
  const sndAmp = {}; for (const ev of SND) { const a = new Float32Array(N); for (let j = 0; j < 70; j++) a[(ev.k + j) % N] = 1 - j / 70; sndAmp[ev.s] = a; }
  let lseed = 23; const rnd = () => ((lseed = (lseed * 16807) % 2147483647) / 2147483647);
  const qpt = (a, c, b, t) => { const m = 1 - t; return [m * m * a[0] + 2 * m * t * c[0] + t * t * b[0], m * m * a[1] + 2 * m * t * c[1] + t * t * b[1]]; };
  const cpt = (a, c1, c2, b, t) => { const m = 1 - t; return [m * m * m * a[0] + 3 * m * m * t * c1[0] + 3 * m * t * t * c2[0] + t * t * t * b[0], m * m * m * a[1] + 3 * m * m * t * c1[1] + 3 * m * t * t * c2[1] + t * t * t * b[1]]; };
  const smooth = (x) => { x = K.clamp(x, 0, 1); return x * x * (3 - 2 * x); };
  const lerp = K.lerp;

  // ---- overlays on the main heart that belong to a lens (shown only while that lens is open)
  const OV = el("g", { "pointer-events": "none", opacity: 0 }, L.top), condG = el("g", {}, OV);
  const CP = [
    { pts: [[262, 262], [292, 300], [312, 340], [328, 372]], ts: [0, 0.014, 0.028, 0.04], fade: [0.14, 0.24] },
    { pts: [[262, 258], [340, 248], [420, 262], [482, 292]], ts: [0, 0.02, 0.04, 0.062], fade: [0.14, 0.24] },
    { pts: [[328, 372], [384, 398], [404, 420]], ts: [0.10, 0.106, 0.11], fade: [0.30, 0.42] },
    { pts: [[404, 420], [424, 470], [440, 530], [464, 588], [520, 560], [536, 480]], ts: [0.11, 0.113, 0.117, 0.121, 0.128, 0.136], fade: [0.30, 0.42] },
    { pts: [[404, 420], [400, 470], [394, 530], [378, 562], [330, 542], [284, 500]], ts: [0.11, 0.113, 0.117, 0.121, 0.128, 0.136], fade: [0.30, 0.42] },
  ].map((c) => ({ ...c, pts: mp(c.pts) }));
  for (const c of CP) { const d = "M" + c.pts.map((p) => f1(p[0]) + " " + f1(p[1])).join("L");
    el("path", { d, fill: "none", stroke: "var(--sheet)", "stroke-width": 5.5, "stroke-linecap": "round", "stroke-linejoin": "round", opacity: 0.6 }, condG);
    el("path", { d, fill: "none", stroke: "var(--spark)", "stroke-width": 1.5, "stroke-linecap": "round", "stroke-linejoin": "round", opacity: 0.45 }, condG);
    c.glow = el("path", { fill: "none", stroke: "var(--spark)", "stroke-width": 6.5, "stroke-linecap": "round", "stroke-linejoin": "round", opacity: 0.3 }, condG);
    c.lit = el("path", { fill: "none", stroke: "var(--spark)", "stroke-width": 2.8, "stroke-linecap": "round", "stroke-linejoin": "round" }, condG);
    c.head = el("circle", { r: 4.2, fill: "var(--sheet)", stroke: "var(--spark)", "stroke-width": 2.3 }, condG); }
  const saN = P([262, 260]), avN = P([328, 372]);
  const saNode = el("circle", { cx: f1(saN[0]), cy: f1(saN[1]), r: 6.5, fill: "var(--spark)", stroke: "var(--sheet)", "stroke-width": 1.5 }, condG);
  el("circle", { cx: f1(avN[0]), cy: f1(avN[1]), r: 6, fill: "var(--spark)", stroke: "var(--sheet)", "stroke-width": 1.5 }, condG);
  const avRing = el("circle", { cx: f1(avN[0]), cy: f1(avN[1]), r: 9, fill: "none", stroke: "var(--spark)", "stroke-width": 1.5 }, condG);
  for (const [x, y, t, a] of [[248, 246, "SA node", "end"], [318, 392, "AV node", "end"], [412, 412, "Bundle of His", "start"], [452, 612, "Purkinje fibres", "end"]]) { const p = P([x, y]); TX_(condG, p[0], p[1], t, "tag halo", a); }
  function conduction(u) {
    for (const c of CP) { const pts = c.pts, ts = c.ts; const lit = []; let head = null;
      if (u >= ts[0]) { lit.push(pts[0]); for (let k = 1; k < pts.length; k++) { if (u >= ts[k]) lit.push(pts[k]); else { const f = (u - ts[k - 1]) / (ts[k] - ts[k - 1]); head = [lerp(pts[k - 1][0], pts[k][0], f), lerp(pts[k - 1][1], pts[k][1], f)]; lit.push(head); break; } } }
      const fade = u < c.fade[0] ? 1 : 1 - smooth((u - c.fade[0]) / (c.fade[1] - c.fade[0])), d = lit.length > 1 ? "M" + lit.map((p) => f1(p[0]) + " " + f1(p[1])).join("L") : "";
      c.lit.setAttribute("d", d); c.glow.setAttribute("d", d); c.lit.setAttribute("opacity", f1(fade)); c.glow.setAttribute("opacity", f1(0.3 * fade));
      if (head) { c.head.setAttribute("cx", f1(head[0])); c.head.setAttribute("cy", f1(head[1])); c.head.setAttribute("opacity", 1); } else c.head.setAttribute("opacity", 0); }
    saNode.setAttribute("r", f1(6.5 + (u < 0.03 ? 4 * (1 - u / 0.03) : 0))); const hold = u > 0.04 && u < 0.10; avRing.setAttribute("opacity", hold ? 0.9 : 0); avRing.setAttribute("r", f1(9 + (hold ? 3.5 * Math.sin((u - 0.04) * 120) ** 2 : 0))); }
  const sliceG = el("g", { opacity: 0 }, L.top); { const c = P([410, 500]);
    el("ellipse", { cx: f1(c[0]), cy: f1(c[1]), rx: f1(R(178)), ry: f1(R(30)), transform: `rotate(-18.6 ${f1(c[0])} ${f1(c[1])})`, fill: "var(--accent)", "fill-opacity": 0.12, stroke: "var(--accent)", "stroke-width": 1.8, "stroke-dasharray": "7 5" }, sliceG);
    const q = P([236, 566]); TX_(sliceG, q[0], q[1], "cut plane", "tag halo", "start", { style: "fill:var(--accent)" }); }
  let condOn = false;

  // 1 · inside two heart cells: action potentials and the ECG they sum to
  K.lens("ap", { focus: rgn(214, 238, 130, 150), toggle: (on) => { condOn = on; OV.setAttribute("opacity", on ? 1 : 0); },
    build(g) { const X = (u) => 50 + 332 * u / T, ySA = (v) => 118 - (v + 70) / 90 * 80, yV = (v) => 262 - (v + 95) / 125 * 92, yE = (v) => 360 - v * 30;
      TX_(g, 16, 22, "SA node cell · the pacemaker", "lh"); TX_(g, 16, 160, "Ventricular muscle cell", "lh"); TX_(g, 16, 306, "ECG · the sum of every cell", "lh");
      for (const [y, t] of [[ySA(0), "0"], [ySA(-60), "−60"], [yV(0), "0"], [yV(-90), "−90"]]) { el("line", { x1: 50, x2: 382, y1: f1(y), y2: f1(y), stroke: "var(--hair)" }, g); TX_(g, 44, y + 4, t, "lm", "end"); }
      el("line", { x1: 50, x2: 382, y1: f1(ySA(-40)), y2: f1(ySA(-40)), stroke: "var(--spark)", "stroke-dasharray": "4 4" }, g); TX_(g, 380, ySA(-40) - 5, "threshold", "lm", "end");
      let a = "", b = "", c = ""; S.forEach((s, k) => { const x = f1(X(k * DT)); a += (k ? "L" : "M") + x + " " + f1(ySA(s.readouts.vmSA)); b += (k ? "L" : "M") + x + " " + f1(yV(s.readouts.vmV)); c += (k ? "L" : "M") + x + " " + f1(yE(s.readouts.ecg)); });
      el("path", { d: a, fill: "none", stroke: "var(--spark)", "stroke-width": 2.4 }, g); el("path", { d: b, fill: "none", stroke: "var(--hot)", "stroke-width": 2.4 }, g); el("path", { d: c, fill: "none", stroke: "var(--ink)", "stroke-width": 1.6 }, g);
      el("path", { d: `M${f1(X(0.07))} 372v6H${f1(X(0.098))}v-6`, fill: "none", stroke: "var(--accent)", "stroke-width": 1.4 }, g); TX_(g, X(0.084), 394, "PR · AV delay", "lm");
      for (const [u, t] of [[0.05, "P"], [0.104, "QRS"], [0.36, "T"]]) { const k = Math.round(u / DT); TX_(g, X(u), yE(S[k].readouts.ecg) - 8, t, "lm", "middle"); }
      const cur = el("line", { y1: 30, y2: 380, stroke: "var(--accent)", "stroke-width": 1.5 }, g);
      const d1 = el("circle", { r: 4.5, fill: "var(--spark)", stroke: "var(--sheet)", "stroke-width": 1.5 }, g), d2 = el("circle", { r: 4.5, fill: "var(--hot)", stroke: "var(--sheet)", "stroke-width": 1.5 }, g);
      const t1 = TX_(g, 50, 140, "", "lm halo"), t2 = TX_(g, 50, 284, "", "lm halo");
      const ionSA = (u) => u < 0.03 ? "Phase 0 · Ca²⁺ rushes in → fires" : u < 0.17 ? "Phase 3 · K⁺ leaves → resets" : "Phase 4 · 'funny' Na⁺ leak drifts up";
      const ionV = (u) => u < 0.10 ? "Phase 4 · resting, K⁺ holds −88 mV" : u < 0.106 ? "Phase 0 · fast Na⁺ channels open" : u < 0.12 ? "Phase 1 · brief K⁺ out (notch)" : u < 0.30 ? "Phase 2 · plateau: Ca²⁺ in ≈ K⁺ out" : u < 0.40 ? "Phase 3 · K⁺ out → repolarising" : "Phase 4 · resting, K⁺ holds −88 mV";
      return (i, s) => { const u = i * DT, x = f1(X(u)); cur.setAttribute("x1", x); cur.setAttribute("x2", x);
        d1.setAttribute("cx", x); d1.setAttribute("cy", f1(ySA(s.readouts.vmSA))); d2.setAttribute("cx", x); d2.setAttribute("cy", f1(yV(s.readouts.vmV)));
        t1.textContent = ionSA(u); t2.textContent = ionV(u); if (condOn) conduction(u); }; } });

  // 2 · the surgeon's view of the mitral valve, looking down from the left atrium
  K.lens("mitral", { focus: rgn(444, 318, 82, 72),
    build(g) { const Lp = [72, 205], Rp = [328, 205], A1 = [95, 112], A2 = [305, 112], B1 = [330, 330], B2 = [70, 330], P2 = (p) => f1(p[0]) + " " + f1(p[1]);
      el("rect", { x: 0, y: 0, width: 400, height: 400, fill: "var(--hot-lumen)" }, g);
      el("circle", { cx: 200, cy: 46, r: 30, fill: "var(--hot)", stroke: "var(--wall-deep)", "stroke-width": 3 }, g);
      for (const a of [-90, 30, 150]) el("line", { x1: 200, y1: 46, x2: f1(200 + 29 * Math.cos(a * Math.PI / 180)), y2: f1(46 + 29 * Math.sin(a * Math.PI / 180)), stroke: "var(--leaflet)", "stroke-width": 2 }, g);
      TX_(g, 238, 40, "aortic valve", "ls halo"); TX_(g, 238, 56, "(fibrous continuity)", "lm halo");
      const orifice = el("path", { fill: "var(--hot)" }, g), chords = el("path", { fill: "none", stroke: "var(--leaflet-edge)", "stroke-width": 1.3 }, g);
      const pms = [0, 1].map(() => el("ellipse", { rx: 10, ry: 6, fill: "var(--wall)", stroke: "var(--wall-deep)" }, g));
      const ant = el("path", { fill: "var(--leaflet)", stroke: "var(--leaflet-edge)", "stroke-width": 1.8, "stroke-linejoin": "round" }, g), post = el("path", { fill: "var(--leaflet)", stroke: "var(--leaflet-edge)", "stroke-width": 1.8, "stroke-linejoin": "round" }, g);
      const cleft = el("path", { fill: "none", stroke: "var(--leaflet-edge)", "stroke-width": 1.1 }, g);
      const annD = `M${P2(Lp)}C${P2(A1)} ${P2(A2)} ${P2(Rp)}C${P2(B1)} ${P2(B2)} ${P2(Lp)}Z`;
      el("path", { d: annD, fill: "none", stroke: "var(--fat)", "stroke-width": 8 }, g); el("path", { d: annD, fill: "none", stroke: "var(--wall-deep)", "stroke-width": 1.4 }, g);
      const dots = Array.from({ length: 28 }, () => ({ a: rnd() * 6.283, r: 0.3 + rnd() * 0.7, e: el("circle", { fill: "var(--hot-hi)", opacity: 0.75 }, g) }));
      const aLab = TX_(g, 200, 0, "Anterior leaflet", "ls", "middle", { style: "fill:var(--leaflet-edge)" }); TX_(g, 200, 316, "Posterior leaflet", "ls halo", "middle");
      const sc = ["P1", "P2", "P3"].map((p) => TX_(g, 0, 0, p, "lm", "middle", { style: "fill:var(--leaflet-edge)" }));
      TX_(g, 38, 200, "AL", "lm halo", "middle"); TX_(g, 38, 214, "comm.", "lm halo", "middle"); TX_(g, 362, 200, "PM", "lm halo", "middle"); TX_(g, 362, 214, "comm.", "lm halo", "middle");
      const status = TX_(g, 200, 376, "", "lm halo", "middle");
      return (i, s, d) => { const o = OPEN.mitral[i], aY = lerp(258, 140, o), pY = lerp(258, 318, o), Ca = [200, aY], Cp = [200, pY];
        orifice.setAttribute("d", `M${P2(Lp)}Q${P2(Ca)} ${P2(Rp)}Q${P2(Cp)} ${P2(Lp)}Z`);
        ant.setAttribute("d", `M${P2(Lp)}C${P2(A1)} ${P2(A2)} ${P2(Rp)}Q${P2(Ca)} ${P2(Lp)}Z`); post.setAttribute("d", `M${P2(Lp)}Q${P2(Cp)} ${P2(Rp)}C${P2(B1)} ${P2(B2)} ${P2(Lp)}Z`);
        let cl = ""; for (const t of [1 / 3, 2 / 3]) { const e = qpt(Lp, Cp, Rp, t), b = cpt(Rp, B1, B2, Lp, 1 - t); cl += `M${P2(e)}L${P2(b)}`; } cleft.setAttribute("d", cl);
        const tips = [0.3, 0.7].map((t, k) => [k ? 250 : 150, (qpt(Lp, Ca, Rp, t)[1] + qpt(Lp, Cp, Rp, t)[1]) / 2]);
        let cd = ""; for (const t of [0.15, 0.3, 0.45, 0.55, 0.7, 0.85]) { const tip = tips[t < 0.5 ? 0 : 1]; cd += `M${P2(qpt(Lp, Ca, Rp, t))}L${P2(tip)}M${P2(qpt(Lp, Cp, Rp, t))}L${P2(tip)}`; }
        chords.setAttribute("d", cd); chords.setAttribute("opacity", f1(o)); pms.forEach((p, k) => { p.setAttribute("cx", f1(tips[k][0])); p.setAttribute("cy", f1(tips[k][1])); p.setAttribute("opacity", f1(o)); });
        aLab.setAttribute("y", f1(lerp(178, 136, o)));
        [1 / 6, 0.5, 5 / 6].forEach((t, k) => { const e = qpt(Lp, Cp, Rp, t), b = cpt(Rp, B1, B2, Lp, 1 - t); sc[k].setAttribute("x", f1((e[0] + b[0]) / 2)); sc[k].setAttribute("y", f1((e[1] + b[1]) / 2 + 4)); });
        const q = s.q.mitral, dS = d * T;
        for (const p of dots) { p.r -= q * dS * 0.035; if (p.r < 0.06) { p.r = 1; p.a = rnd() * 6.283; } p.e.setAttribute("cx", f1(200 + Math.cos(p.a) * 150 * p.r)); p.e.setAttribute("cy", f1(222 + Math.sin(p.a) * 100 * p.r)); p.e.setAttribute("r", f1(1.4 + 2.6 * p.r)); p.e.setAttribute("opacity", f1(o > 0.05 ? 0.75 : 0)); }
        const la = pr(s, "LA"), lv = pr(s, "LV"); status.textContent = `LA ${la.toFixed(1)} ${la > lv ? ">" : "<"} LV ${lv.toFixed(1)} mmHg · ${q > 0.01 ? "OPEN · " + Math.round(q) + " mL/s" : "SHUT"}`; }; } });

  // 3 · one sarcomere in the LV wall: Ca²⁺, cross-bridges, length and tension
  K.lens("sarcomere", { focus: rgn(506, 440, 46, 64),
    build(g) { el("rect", { x: 14, y: 34, width: 372, height: 26, rx: 13, fill: "var(--bed)", stroke: "var(--hair)" }, g); TX_(g, 200, 52, "sarcoplasmic reticulum · the Ca²⁺ store", "lm", "middle");
      el("rect", { x: 0, y: 108, width: 400, height: 176, fill: "var(--wall-hi)", opacity: 0.25 }, g);
      const ca = Array.from({ length: 46 }, () => el("circle", { cx: f1(18 + rnd() * 364), cy: f1(66 + rnd() * 214), r: 2.6, fill: "var(--ca)", stroke: "var(--sheet)", "stroke-width": 0.8 }, g));
      const thin = el("path", { "data-bleed": 1, fill: "none", stroke: "var(--cold)", "stroke-width": 2.6, "stroke-dasharray": "3.2 1.6" }, g), heads = el("path", { "data-bleed": 1, fill: "none", stroke: "var(--hot)", "stroke-width": 1.8, "stroke-linecap": "round" }, g);
      const bound = el("path", { "data-bleed": 1, fill: "none", stroke: "var(--hot)", "stroke-width": 2.2, "stroke-linecap": "round" }, g), thick = el("path", { "data-bleed": 1, fill: "none", stroke: "var(--hot)", "stroke-width": 6.5, "stroke-linecap": "round" }, g);
      const zs = el("path", { "data-bleed": 1, fill: "none", stroke: "var(--ink)", "stroke-width": 2.4, "stroke-linejoin": "round" }, g);
      el("line", { x1: 200, x2: 200, y1: 116, y2: 276, stroke: "var(--muted)", "stroke-width": 1, "stroke-dasharray": "2 3" }, g);
      const zl = TX_(g, 0, 102, "Z-disc", "lm", "middle"), zr = TX_(g, 0, 102, "Z-disc", "lm", "middle"); TX_(g, 200, 102, "M-line", "lm", "middle");
      const dim = el("path", { fill: "none", stroke: "var(--accent)", "stroke-width": 1.4 }, g), dimT = TX_(g, 200, 310, "", "lm halo", "middle");
      TX_(g, 16, 334, "Tension", "ls"); TX_(g, 16, 360, "[Ca²⁺] inside", "ls");
      el("rect", { x: 118, y: 324, width: 266, height: 12, rx: 6, fill: "var(--ground)", stroke: "var(--hair)" }, g); el("rect", { x: 118, y: 350, width: 266, height: 12, rx: 6, fill: "var(--ground)", stroke: "var(--hair)" }, g);
      const barT = el("rect", { x: 118, y: 324, height: 12, rx: 6, fill: "var(--hot)" }, g), barC = el("rect", { x: 118, y: 350, height: 12, rx: 6, fill: "var(--ca)" }, g);
      const st = TX_(g, 200, 388, "", "lm halo", "middle"), rowsThin = [128, 160, 192, 224, 256], rowsThick = [144, 176, 208, 240, 272];
      let beat = 0;   // accumulated cycle time: cross-bridges cycle asynchronously while Ca²⁺ is up
      return (i, s, d) => { const V = s.readouts.LVV, SL = 1.8 + 0.45 * (V - ESV) / (EDV - ESV), Kp = 138, w = SL * Kp, zL = 200 - w / 2, zR = 200 + w / 2;
        const ac = s.readouts.actV, cav = s.readouts.ca, tension = ac * (0.62 + 0.38 * (SL - 1.8) / 0.45); beat += d * T;
        let tn = "", th = "", hd = "", bd = "", zz = "";
        for (const zx of [zL - w, zL, zR, zR + w]) { let p = `M${f1(zx)} 112`; for (let y = 112, k = 0; y <= 280; y += 12, k++) p += `L${f1(zx + (k % 2 ? 4 : -4))} ${y}`; zz += p; }
        for (const y of rowsThin) for (const zx of [zL - w, zL, zR, zR + w]) tn += `M${f1(zx - Kp)} ${y}H${f1(zx + Kp)}`;
        for (const cx of [200 - w, 200, 200 + w]) for (const y of rowsThick) { th += `M${f1(cx - Kp * 0.8)} ${y}H${f1(cx + Kp * 0.8)}`;
          for (let x = cx - Kp * 0.78; x <= cx + Kp * 0.78; x += 11) { if (Math.abs(x - cx) < 18) continue; const dir = x < cx ? -1 : 1, nearZ = x < cx ? cx - w / 2 : cx + w / 2, inThin = Math.abs(x - nearZ) < Kp;
            for (const sy of [-1, 1]) { const ph = Math.sin(beat * 38 + x * 0.7 + y + sy), att = inThin && cav > 0.12 && ph > -0.2;
              if (att) { const tilt = 6 * (0.5 + 0.5 * Math.sin(beat * 38 + x)); bd += `M${f1(x)} ${y + sy * 3}L${f1(x + dir * tilt)} ${y + sy * 13}`; } else hd += `M${f1(x)} ${y + sy * 3}l${f1(-dir * 4)} ${sy * 5}`; } } }
        thin.setAttribute("d", tn); thick.setAttribute("d", th); heads.setAttribute("d", hd); bound.setAttribute("d", bd); zs.setAttribute("d", zz);
        zl.setAttribute("x", f1(Math.max(26, zL))); zr.setAttribute("x", f1(Math.min(374, zR)));
        dim.setAttribute("d", `M${f1(zL)} 288v8M${f1(zL)} 292H${f1(zR)}M${f1(zR)} 288v8`); dimT.textContent = `sarcomere ${SL.toFixed(2)} µm`;
        const nCa = Math.round(cav * ca.length + 4); ca.forEach((c, k) => c.setAttribute("opacity", k < nCa ? 1 : 0));
        barT.setAttribute("width", f1(Math.max(12, 266 * tension))); barC.setAttribute("width", f1(Math.max(12, 266 * (0.08 + 0.92 * cav))));
        const ph = s.phase; st.textContent = ph === "Isovolumetric contraction" ? "both valves shut → length fixed, tension climbing" : ph === "Ventricular ejection" ? "aortic valve open → fibres shorten as they pull" : ph === "Isovolumetric relaxation" ? "Ca²⁺ pumped back (SERCA) → tension falls, length fixed" : ph === "Atrial systole" ? "atrial kick stretches the fibres a little more" : "relaxed fibres are stretched as the LV fills"; }; } });

  // 4 · looking down the aorta at the aortic valve
  K.lens("aortic", { focus: rgn(334, 274, 56, 56),
    build(g) { const C = [200, 192], Rr = 116, rad = (a) => a * Math.PI / 180, at = (a, r) => [C[0] + Math.cos(rad(a)) * r, C[1] + Math.sin(rad(a)) * r], P2 = (p) => f1(p[0]) + " " + f1(p[1]);
      const COM = [-90, 30, 150], SIN = [-30, 90, 210], root = []; for (let k = 0; k < 3; k++) { root.push(at(COM[k], Rr)); root.push(at(SIN[k], Rr * 1.16)); }
      const rootD = K.spline(root, true); el("path", { d: rootD, fill: "var(--hot-lumen)" }, g); el("circle", { cx: C[0], cy: C[1], r: f1(Rr * 0.98), fill: "var(--hot)" }, g);
      const cusps = [0, 1, 2].map(() => el("path", { fill: "var(--leaflet)", stroke: "var(--leaflet-edge)", "stroke-width": 1.8, "stroke-linejoin": "round" }, g));
      const nod = [0, 1, 2].map(() => el("circle", { r: 3, fill: "var(--leaflet-edge)", opacity: 0.6 }, g));
      el("path", { d: rootD, fill: "none", stroke: "var(--wall-deep)", "stroke-width": 5 }, g);
      const ost = [SIN[0], SIN[1]].map((a) => { const p = at(a, Rr * 1.02); return { ring: el("circle", { cx: f1(p[0]), cy: f1(p[1]), r: 9, fill: "none", stroke: "var(--hot-hi)", "stroke-width": 2 }, g), hole: el("circle", { cx: f1(p[0]), cy: f1(p[1]), r: 7, fill: "var(--hot)", stroke: "var(--wall-deep)", "stroke-width": 2 }, g) }; });
      const dots = Array.from({ length: 36 }, () => ({ a: rnd() * 6.283, r: Math.sqrt(rnd()), z: rnd(), e: el("circle", { fill: "var(--hot-hi)" }, g) }));
      for (const [a, l1, l2] of [[SIN[0], "Left", "coronary cusp"], [SIN[1], "Right", "coronary cusp"], [SIN[2], "Non-", "coronary cusp"]]) { const p = at(a, Rr * (a === SIN[1] ? 1.36 : 1.5)); TX_(g, p[0], p[1] - 3, l1, "ls halo", "middle"); TX_(g, p[0], p[1] + 12, l2, "lm halo", "middle"); }
      const pL = at(SIN[0], Rr * 1.02), pR = at(SIN[1], Rr * 1.02); TX_(g, pL[0] + 12, pL[1] + 22, "LCA ostium", "lm halo"); TX_(g, pR[0] + 14, pR[1] + 4, "RCA ostium", "lm halo");
      const status = TX_(g, 200, 388, "", "lm halo", "middle");
      const corMax = Math.max(...S.map((s) => Math.max(0, s.readouts.AoP - 0.92 * s.readouts.LVP)));
      return (i, s, d) => { const o = OPEN.aortic[i];
        for (let k = 0; k < 3; k++) { const A = at(COM[k], Rr), B = at(COM[(k + 1) % 3], Rr), Sx = at(SIN[k], Rr * 1.16), Mx = K.mid(A, B), tip = at(SIN[k], Rr * 0.9);
          const Pm = [lerp(C[0], tip[0], o * 0.62), lerp(C[1], tip[1], o * 0.62)], c1 = [2 * Sx[0] - Mx[0], 2 * Sx[1] - Mx[1]], c2 = [2 * Pm[0] - Mx[0], 2 * Pm[1] - Mx[1]];
          cusps[k].setAttribute("d", `M${P2(A)}Q${P2(c1)} ${P2(B)}Q${P2(c2)} ${P2(A)}Z`); const nd = qpt(B, c2, A, 0.5); nod[k].setAttribute("cx", f1(nd[0])); nod[k].setAttribute("cy", f1(nd[1])); }
        const q = s.q.aortic, open = Rr * 0.36 * o, dS = d * T;
        for (const p of dots) { p.z += q * dS * 0.012; if (p.z > 1) { p.z -= 1; p.a = rnd() * 6.283; p.r = Math.sqrt(rnd()); } const rr = p.r * open * (0.25 + 0.75 * p.z);
          p.e.setAttribute("cx", f1(C[0] + Math.cos(p.a) * rr)); p.e.setAttribute("cy", f1(C[1] + Math.sin(p.a) * rr)); p.e.setAttribute("r", f1(1 + 4 * p.z)); p.e.setAttribute("opacity", f1(o > 0.05 ? (1 - p.z) * 0.9 : 0)); }
        const cf = Math.max(0, s.readouts.AoP - 0.92 * s.readouts.LVP) / corMax; for (const o2 of ost) { o2.ring.setAttribute("r", f1(9 + 9 * cf)); o2.ring.setAttribute("opacity", f1(0.15 + 0.75 * cf)); }
        const lv = pr(s, "LV"), sa = pr(s, "SA"); status.textContent = `LV ${lv.toFixed(0)} ${lv > sa ? ">" : "<"} aorta ${sa.toFixed(0)} mmHg · ${q > 0.01 ? "OPEN · " + Math.round(q) + " mL/s" : "SHUT"}`; }; } });

  // 5 · short-axis slice across both ventricles (the cut plane is drawn on the heart while this lens is open)
  K.lens("shortaxis", { focus: rgn(244, 452, 334, 100), toggle: (on) => sliceG.setAttribute("opacity", on ? 1 : 0),
    build(g) { const C = [236, 180], Aw = 128 * 128 - 82 * 82;
      const rvW = el("circle", { fill: "var(--wall)", stroke: "var(--wall-deep)", "stroke-width": 1.5 }, g), rvC = el("circle", { fill: "var(--cold-lumen)" }, g);
      const lvW = el("circle", { cx: C[0], cy: C[1], fill: "url(#kTissue)", stroke: "var(--wall-deep)", "stroke-width": 1.5 }, g), lvC = el("circle", { cx: C[0], cy: C[1], fill: "var(--hot-lumen)", stroke: "var(--wall-deep)", "stroke-width": 1.2 }, g);
      const ghost = el("circle", { cx: C[0], cy: C[1], fill: "none", stroke: "var(--ink)", "stroke-width": 1, "stroke-dasharray": "4 4", opacity: 0.5 }, g);
      const pm = [0, 1].map(() => el("ellipse", { fill: "var(--wall)", stroke: "var(--wall-deep)" }, g)), dimL = el("path", { fill: "none", stroke: "var(--accent)", "stroke-width": 1.8 }, g);
      const lvT = TX_(g, C[0], C[1], "LV", "big halo", "middle"), rvT = TX_(g, 0, 0, "RV", "lh halo", "middle"), sep = TX_(g, 0, 0, "septum", "lm halo", "middle"), pmT = TX_(g, C[0], 0, "papillary muscles", "lm halo", "middle");
      TX_(g, 16, 22, "Seen from the apex, looking toward the base", "lm");
      const t1 = TX_(g, 16, 346, "", "ls"), t2 = TX_(g, 16, 366, "", "ls"); TX_(g, 16, 388, "dashed ring = cavity size at end-diastole", "lm");
      const ri = (V) => 82 * Math.pow(V / 128, 0.6), RiED = ri(EDV), wED = Math.sqrt(RiED * RiED + Aw) - RiED; ghost.setAttribute("r", f1(RiED));
      return (i, s) => { const Ri = ri(s.readouts.LVV), Ro = Math.sqrt(Ri * Ri + Aw), tk = 16 + 40 * (s.readouts.RVV - RVmin) / (RVmax - RVmin), dx = (tk + 12) / 2, Rc = Ro + dx - 12, cx = C[0] - dx;
        rvW.setAttribute("cx", f1(cx - 3.5)); rvW.setAttribute("cy", C[1]); rvW.setAttribute("r", f1(Rc + 7)); rvC.setAttribute("cx", f1(cx)); rvC.setAttribute("cy", C[1]); rvC.setAttribute("r", f1(Rc));
        lvW.setAttribute("r", f1(Ro)); lvC.setAttribute("r", f1(Ri));
        pm.forEach((p, k) => { const a = (k ? 128 : 52) * Math.PI / 180; p.setAttribute("cx", f1(C[0] + Math.cos(a) * (Ri - 7))); p.setAttribute("cy", f1(C[1] + Math.sin(a) * (Ri - 7))); p.setAttribute("rx", f1(Ri * 0.2)); p.setAttribute("ry", f1(Ri * 0.15)); });
        pmT.setAttribute("y", f1(C[1] + (Ri - 7) * 0.79 - Ri * 0.2 - 6)); lvT.setAttribute("y", f1(C[1] - Ri * 0.12));
        rvT.setAttribute("x", f1(C[0] - Ro - tk / 2 - 1)); rvT.setAttribute("y", f1(C[1] + 5)); sep.setAttribute("x", f1(C[0] - Ro + (Ro - Ri) / 2)); sep.setAttribute("y", f1(C[1] - Ri - 16));
        dimL.setAttribute("d", `M${f1(C[0] + Ri)} ${C[1] - 6}v12M${f1(C[0] + Ri)} ${C[1]}H${f1(C[0] + Ro)}M${f1(C[0] + Ro)} ${C[1] - 6}v12`);
        const wall = Ro - Ri; t1.textContent = `LV wall ${(wall * 0.21).toFixed(1)} mm  (${wall > wED ? "+" : ""}${Math.round((wall / wED - 1) * 100)}% vs relaxed)`; t2.textContent = `LV cavity ${Math.round(s.readouts.LVV)} mL · RV cavity ${Math.round(s.readouts.RVV)} mL`; }; } });

  // 6 · the LV pressure–volume loop: the whole beat as one loop, valve events at the corners
  K.lens("pv", { focus: rgn(432, 352, 104, 252),
    build(g) { const X = (v) => 66 + (v - 40) / 100 * 312, Y = (p) => 334 - p / 130 * 290;
      for (let v = 40; v <= 140; v += 20) { el("line", { x1: f1(X(v)), x2: f1(X(v)), y1: 44, y2: 334, stroke: "var(--hair)" }, g); TX_(g, X(v), 350, String(v), "lm", "middle"); }
      for (let p = 0; p <= 120; p += 20) { el("line", { x1: 66, x2: 378, y1: f1(Y(p)), y2: f1(Y(p)), stroke: "var(--hair)" }, g); TX_(g, 60, Y(p) + 4, String(p), "lm", "end"); }
      TX_(g, 378, 370, "LV volume (mL)", "lm", "end"); TX_(g, 14, 30, "LV pressure (mmHg)", "lm");
      let d = ""; S.forEach((s, k) => { d += (k ? "L" : "M") + f1(X(s.readouts.LVV)) + " " + f1(Y(s.readouts.LVP)); });
      el("path", { d: d + "Z", fill: "var(--accent)", "fill-opacity": 0.1, stroke: "var(--hot)", "stroke-width": 2 }, g);
      el("path", { d: `M${f1(X(40))} ${f1(Y(2.6 * 28))}L${f1(X(62))} ${f1(Y(2.6 * 50))}`, stroke: "var(--muted)", "stroke-width": 1.4, "stroke-dasharray": "5 4", fill: "none" }, g); TX_(g, 140, 44, "ESPVR · contractility", "lm halo");
      el("path", { d: `M${f1(X(40))} ${f1(Y(0.07 * 28))}L${f1(X(140))} ${f1(Y(0.07 * 128))}`, stroke: "var(--muted)", "stroke-width": 1.4, "stroke-dasharray": "5 4", fill: "none" }, g); TX_(g, 376, 290, "EDPVR", "lm halo", "end"); TX_(g, 376, 305, "stiffness", "lm halo", "end");
      let area = 0; for (let k = 0; k < N; k++) { const a = S[k].readouts, b = S[(k + 1) % N].readouts; area += a.LVV * b.LVP - b.LVV * a.LVP; } area = Math.abs(area) / 2;
      for (const [k, t, ox, oy] of [[EVT.MVC, "mitral closes", -9, 17], [EVT.AVO, "aortic opens", -9, -8], [EVT.AVC, "aortic closes", 9, -11], [EVT.MVO, "mitral opens", -9, 5]]) { const r = S[k].readouts, x = X(r.LVV), y = Y(r.LVP);
        el("circle", { cx: f1(x), cy: f1(y), r: 4, fill: "var(--sheet)", stroke: "var(--ink)", "stroke-width": 1.6 }, g); TX_(g, x + ox, y + oy, t, "ls halo", ox < 0 ? "end" : "start"); }
      TX_(g, X(90), Y(56), "stroke work", "ls halo", "middle"); TX_(g, X(90), Y(56) + 15, `${(area * 1.333e-4).toFixed(2)} J per beat`, "lm halo", "middle");
      TX_(g, 378, 30, `SV ${Math.round(SVOL)} mL · EF ${Math.round(EF * 100)}%`, "lm", "end");
      const trail = el("path", { fill: "none", stroke: "var(--accent)", "stroke-width": 5, "stroke-linecap": "round", "stroke-linejoin": "round", opacity: 0.55 }, g);
      const dot = el("circle", { r: 6.5, fill: "var(--accent)", stroke: "var(--sheet)", "stroke-width": 2 }, g), st = TX_(g, 200, 390, "", "lm halo", "middle");
      return (i, s) => { let t = ""; for (let k = 40; k >= 0; k--) { const r = S[(i - k + N) % N].readouts; t += (k === 40 ? "M" : "L") + f1(X(r.LVV)) + " " + f1(Y(r.LVP)); }
        trail.setAttribute("d", t); dot.setAttribute("cx", f1(X(s.readouts.LVV))); dot.setAttribute("cy", f1(Y(s.readouts.LVP)));
        const ph = s.phase; st.textContent = (ph === "Ventricular ejection" ? "top edge · ejecting" : ph === "Isovolumetric contraction" ? "right edge · isovolumetric" : ph === "Isovolumetric relaxation" ? "left edge · isovolumetric" : "bottom edge · filling") + ` · ${Math.round(s.readouts.LVV)} mL, ${Math.round(s.readouts.LVP)} mmHg`; }; } });

  // 7 · on the chest: where each valve's closure is heard, with the phonocardiogram of this beat
  K.lens("chest", { focus: rgn(190, 236, 380, 396),
    build(g) { const rib = (k) => 72 + k * 30;
      el("path", { d: "M164 8L166 34Q120 44 62 58Q30 70 28 112L36 300M236 8L234 34Q280 44 338 58Q370 70 372 112L364 300", fill: "none", stroke: "var(--ink)", "stroke-width": 1.6 }, g);
      el("path", { d: "M186 126C160 138 150 196 168 236C190 270 246 262 292 244C312 230 300 192 270 160C250 136 212 120 186 126Z", fill: "var(--wall)", opacity: 0.32 }, g);
      for (let k = 1; k <= 7; k++) { const y = rib(k); el("path", { d: `M188 ${y}Q120 ${y + 2} 52 ${y + 40}`, fill: "none", stroke: "var(--hair)", "stroke-width": 7, "stroke-linecap": "round" }, g); el("path", { d: `M212 ${y}Q280 ${y + 2} 348 ${y + 40}`, fill: "none", stroke: "var(--hair)", "stroke-width": 7, "stroke-linecap": "round" }, g); }
      el("path", { d: "M196 62Q130 46 66 62M204 62Q270 46 334 62", fill: "none", stroke: "var(--hair)", "stroke-width": 9, "stroke-linecap": "round" }, g);
      el("rect", { x: 188, y: 62, width: 24, height: 196, rx: 8, fill: "var(--bed)", stroke: "var(--hair)" }, g);
      TX_(g, 16, 22, "Patient facing you · their left is your right", "lm");
      const PTS = [{ s: "S2", p: [176, rib(2) + 15], n: ["Aortic", "2nd ICS · RSE"], at: [160, rib(2) + 11], a: "end" }, { s: "S2", p: [224, rib(2) + 15], n: ["Pulmonary", "2nd ICS · LSE"], at: [240, rib(2) + 11], a: "start" },
        { s: "S1", p: [224, rib(4) + 15], n: ["Tricuspid", "4th ICS · LLSE"], at: [240, rib(4) + 11], a: "start" }, { s: "S1", p: [292, rib(5) + 17], n: ["Mitral (apex)", "5th ICS · MCL"], at: [292, rib(5) + 46], a: "middle" }];
      for (const q of PTS) { q.wave = el("circle", { cx: q.p[0], cy: q.p[1], r: 9, fill: "none", stroke: "var(--accent)", "stroke-width": 2 }, g); q.dot = el("circle", { cx: q.p[0], cy: q.p[1], r: 7, fill: "var(--sheet)", stroke: "var(--accent)", "stroke-width": 2.5 }, g);
        TX_(g, q.at[0], q.at[1], q.n[0], "lt halo", q.a); TX_(g, q.at[0], q.at[1] + 15, q.n[1], "lm halo", q.a); }
      const lub = TX_(g, 346, 196, "LUB", "big halo", "middle"), dub = TX_(g, 86, 112, "DUB", "big halo", "middle");
      const steth = el("g", { "data-bleed": 1 }, g); el("path", { d: "M0 0C10 -40 60 -60 90 -110", fill: "none", stroke: "var(--ink)", "stroke-width": 3 }, steth); el("circle", { r: 15, fill: "var(--sheet)", stroke: "var(--ink)", "stroke-width": 3, opacity: 0.85 }, steth); el("circle", { r: 9, fill: "none", stroke: "var(--muted)", "stroke-width": 1.2 }, steth);
      el("rect", { x: 10, y: 316, width: 380, height: 76, rx: 6, fill: "var(--sheet)", stroke: "var(--hair)" }, g); TX_(g, 18, 332, "phonocardiogram", "lm");
      const X = (u) => 22 + 360 * u / T; let d = "";
      for (let k = 0; k <= 1400; k++) { const u = k / 1400 * T; let a = 0; for (const ev of SND) { let dt = u - ev.k * DT; dt -= Math.round(dt / T) * T; a += Math.exp(-((dt / 0.016) ** 2)) * (ev.s === "S1" ? 1 : 0.7) * Math.sin(2 * Math.PI * (ev.s === "S1" ? 70 : 95) * dt); } d += (k ? "L" : "M") + f1(X(u)) + " " + f1(362 - a * 22); }
      el("path", { d, fill: "none", stroke: "var(--ink)", "stroke-width": 1.2 }, g); for (const ev of SND) TX_(g, X(ev.k * DT), 386, ev.s, "lm", "middle");
      const cur = el("line", { y1: 322, y2: 390, stroke: "var(--accent)", "stroke-width": 1.5 }, g); const sp = [...PTS[3].p]; let lastP = PTS[3];
      return (i) => { const f = { S1: sndAmp.S1[i], S2: sndAmp.S2[i] };
        for (const q of PTS) { const v = f[q.s]; q.wave.setAttribute("r", f1(9 + 22 * (1 - v))); q.wave.setAttribute("opacity", f1(v)); q.dot.setAttribute("fill", v > 0.05 ? "var(--accent)" : "var(--sheet)"); }
        lub.setAttribute("opacity", f1(f.S1)); dub.setAttribute("opacity", f1(f.S2)); if (f.S2 > 0.9) lastP = PTS[0]; else if (f.S1 > 0.9) lastP = PTS[3];
        sp[0] += (lastP.p[0] - sp[0]) * 0.08; sp[1] += (lastP.p[1] - sp[1]) * 0.08; steth.setAttribute("transform", `translate(${f1(sp[0] + 16)} ${f1(sp[1] + 16)})`);
        const x = f1(X(i * DT)); cur.setAttribute("x1", x); cur.setAttribute("x2", x); }; } });


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
