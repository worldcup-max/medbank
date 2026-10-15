/* fixture + prompt exemplar: the Four-Chamber Heart drawing, written against the Studio kit (K) */
function createScene(svg, K, M, S) {
  const L = K.layers("bg", "back", "pback", "mid", "pmid", "front", "pfront", "top");
  const sh = (pts, dx) => pts.map(([x, y]) => [x + dx, y]);
  const TRI = [[256, 380], [322, 374]], MIT = [[452, 354], [516, 350]];
  const CH = {
    RA: { ann: TRI, Vref: 45, k: 0.5, reach: 120, pts: [[256, 380], [232, 372], [214, 352], [208, 316], [213, 282], [226, 258], [248, 248], [272, 252], [292, 270], [302, 302], [310, 342], [322, 374]], fill: "var(--cold-lumen)", vol: "RAV" },
    LA: { ann: MIT, Vref: 45, k: 0.5, reach: 90, pts: sh([[446, 354], [436, 330], [434, 300], [442, 276], [465, 263], [505, 263], [527, 277], [536, 301], [530, 329], [510, 350]], 6), fill: "var(--hot-lumen)", vol: "LAV" },
    RV: { ann: TRI, Vref: 80, k: 0.45, reach: 170, pts: [[256, 382], [322, 376], [346, 387], [372, 407], [392, 442], [404, 492], [410, 536], [400, 562], [370, 560], [322, 532], [284, 494], [264, 448], [256, 414]], fill: "var(--cold-lumen)", vol: "RVV" },
    LV: { ann: MIT, Vref: 90, k: 0.45, reach: 220, pts: sh([[446, 356], [437, 390], [433, 442], [440, 504], [458, 560], [478, 598], [498, 596], [514, 556], [524, 496], [527, 428], [523, 378], [510, 352]], 6), fill: "var(--hot-lumen)", vol: "LVV" },
  };
  const BODY = [[204, 262], [190, 318], [195, 366], [222, 389], [244, 402], [244, 444], [258, 494], [298, 548], [368, 594], [438, 632], [480, 632], [516, 604], [542, 552], [558, 482], [566, 404], [563, 344], [552, 294], [534, 262], [506, 248], [474, 250], [452, 258], [432, 266], [396, 270], [360, 268], [334, 254], [322, 236], [300, 232], [276, 240], [250, 242], [224, 248]];
  const AO = [[362, 302], [346, 276], [340, 240], [348, 200], [372, 162], [410, 142], [460, 136], [503, 146], [528, 172], [538, 214], [538, 280]];
  const SVC = [[246, 46], [246, 150], [248, 212], [250, 254]], IVC = [[212, 620], [208, 560], [210, 470], [216, 400], [222, 364]];
  const TRUNK = [[366, 446], [372, 394], [398, 330], [425, 270], [430, 241], [433, 216]], LPA = [[433, 216], [470, 211], [520, 214], [562, 226], [592, 240]], RPA = [[433, 216], [396, 207], [322, 203], [252, 212], [182, 236]];
  const LUNG_R = [[172, 158], [128, 150], [86, 178], [56, 240], [42, 320], [46, 400], [70, 462], [118, 474], [160, 450], [176, 390], [178, 300], [176, 220]];
  const LUNG_L = [[578, 158], [620, 150], [658, 178], [686, 240], [696, 320], [692, 400], [670, 462], [626, 474], [594, 452], [584, 400], [598, 352], [588, 300], [582, 220]];
  K.blob(L.bg, LUNG_R, { fill: "var(--bed)", stroke: "var(--hair)" }); K.blob(L.bg, LUNG_L, { fill: "var(--bed)", stroke: "var(--hair)" });
  K.label(108, 494, "Right lung", "middle"); K.label(636, 494, "Left lung", "middle");
  K.part("pa", K.vessel(L.back, RPA, 12, { tone: "cold" }));
  K.part("cavae", K.vessel(L.back, IVC, 13, { tone: "cold", cap: "butt" }));
  K.part("aorta", K.vessel(L.back, [[538, 250], [538, 420], [538, 600]], 15, { tone: "hot" }));
  const body = K.blob(L.mid, BODY);
  const cav = {}; for (const k in CH) cav[k] = K.part(k, K.blob(L.mid, CH[k].pts, { fill: CH[k].fill, width: 1.3 }));
  K.part("cavae", K.vessel(L.mid, SVC, 12, { tone: "cold", cap: "butt" }));
  K.part("aorta", K.vessel(L.mid, AO, 15, { tone: "hot", cap: "butt" }));
  K.part("pa", K.vessel(L.front, TRUNK, 15, { tone: "cold", cap: "butt" })); K.part("pa", K.vessel(L.front, LPA, 11, { tone: "cold" }));
  K.part("pveins", K.vessel(L.mid, [[614, 300], [578, 300], [540, 300]], 7, { tone: "hot" }));
  const V = { tricuspid: K.valve(L.top, TRI[0], TRI[1], [0.1, 1], "av"), mitral: K.valve(L.top, MIT[0], MIT[1], [0.05, 1], "av"),
    pulmonary: K.valve(L.top, [384, 336], [412, 346], K.norm([0.4, -1]), "sl"), aortic: K.valve(L.top, [352, 318], [372, 296], K.norm([-0.6, -1]), "sl") };
  for (const id in V) K.part(id, V[id]);
  const tags = { RA: K.tag(256, 298, "RA"), RV: K.tag(324, 470, "RV"), LA: K.tag(492, 300, "LA"), LV: K.tag(484, 470, "LV") };
  [[238, 112, "Superior vena cava", "end"], [196, 560, "Inferior vena cava", "end"], [330, 236, "Aorta", "end"], [566, 204, "Pulmonary artery", "start"], [622, 286, "Pulmonary veins", "start"], [548, 590, "Descending aorta", "start"],
   [238, 414, "tricuspid", "end"], [528, 372, "mitral", "start"], [420, 352, "pulmonary valve", "start"], [338, 330, "aortic valve", "end"]].forEach(([x, y, t, a]) => K.label(x, y, t, a));
  const triM = K.mid(...TRI), mitM = K.mid(...MIT), rate = (part) => (i, s) => 0.2 + (s.parts[part].flow || 0);
  const flows = K.flows({
    svc: { pts: SVC, w: 8, layer: L.pmid, rate: rate("cavae"), tone: 0 }, ivc: { pts: IVC, w: 9, layer: L.pback, rate: rate("cavae"), tone: 0 },
    ra: { pts: [[250, 254], [270, 320], triM], w: 18, layer: L.pmid, rate: rate("RA"), gate: (i, s) => s.parts.tricuspid.open, tone: 0 },
    rv: { pts: [triM, [300, 440], [350, 500], [370, 446]], w: 14, layer: L.pmid, rate: rate("RV"), gate: (i, s) => s.parts.pulmonary.open, tone: 0 },
    trunk: { pts: TRUNK.slice(1), w: 9, layer: L.pfront, rate: rate("pa"), tone: 0 }, lpa: { pts: LPA, w: 7, layer: L.pfront, rate: rate("pa"), tone: "up" },
    pv: { pts: [[614, 300], [540, 300], mitM], w: 7, layer: L.pmid, rate: rate("LA"), gate: (i, s) => s.parts.mitral.open, tone: 1 },
    lv: { pts: [mitM, [496, 450], [488, 540], [460, 470], [400, 360], [362, 302]], w: 15, layer: L.pmid, rate: rate("LV"), gate: (i, s) => s.parts.aortic.open, tone: 1 },
    ao: { pts: AO, w: 10, layer: L.pmid, rate: rate("aorta"), tone: 1 }, desc: { pts: [[538, 280], [538, 600]], w: 9, layer: L.pback, rate: rate("aorta"), tone: "down" },
  }, [["svc", "ra", "rv", "trunk", "lpa", "pv", "lv", "ao", "desc"], ["ivc", "ra", "rv", "trunk", "lpa", "pv", "lv", "ao", "desc"]]);
  return { update(i, s, d) {
    for (const k in CH) { const c = CH[k], def = K.deformer(c.ann[0], c.ann[1], c.reach, K.volumeScale(s.readouts[c.vol], c.Vref, c.k)); cav[k].set(c.pts.map(def)); }
    const mass = K.deformer([244, 392], [560, 340], 260, K.volumeScale(s.readouts.LVV + s.readouts.RVV, 170, 0.12)); body.set(BODY.map(mass));
    for (const id in V) V[id].set(s.parts[id].open);
    tags.LV.set(s.readouts.LVP.toFixed(0) + " mmHg · " + s.readouts.LVV.toFixed(0) + " mL"); tags.RV.set(s.readouts.RVP.toFixed(0) + " mmHg · " + s.readouts.RVV.toFixed(0) + " mL");
    tags.LA.set(s.readouts.LAP.toFixed(0) + " mmHg"); tags.RA.set(s.readouts.RAP.toFixed(0) + " mmHg");
    flows.update(i, s, d);
  } };
}
