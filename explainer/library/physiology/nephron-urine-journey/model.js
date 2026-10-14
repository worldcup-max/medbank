/* One parcel of glomerular filtrate followed from Bowman's capsule to the papilla (juxtamedullary nephron, ADH present).
 * State along the way: volume V (% of what was filtered), solute content Sol (V × osmolality), glucose and bicarbonate (% left).
 * Each segment applies its own transport law over the distance travelled; the interstitium the parcel sees depends on its depth. */
function createModel() {
  // the note's numbers
  const P_GC = 55, P_BS = 15, PI_GC = 30, NFP = P_GC - P_BS - PI_GC;           // mmHg → 10
  const GFR = 125, RPF = 650, FF = GFR / RPF * 100, GFR_DAY = GFR * 1440 / 1000;  // mL/min, %, L/day (180)
  const PLASMA = 300, PAPILLA = 1200, TAL_FLOOR = 100, SINGLE_EFFECT = 200;
  const INT = (z) => PLASMA + (PAPILLA - PLASMA) * Math.max(0, Math.min(1, z));   // medullary interstitium, set up by the countercurrent multiplier
  // depth of each segment (0 = corticomedullary junction, 1 = papillary tip, < 0 = cortex) at u = 0, 0.05 … 1 of its length
  const DEPTH = {
    bowman: [-0.44, -0.31],
    pct: [-0.306, -0.272, -0.309, -0.38, -0.448, -0.478, -0.453, -0.384, -0.334, -0.264, -0.214, -0.166, -0.095, -0.06, -0.086, -0.14, -0.142, -0.083, -0.027, 0.019, 0.088],
    tdl: [0.097, 0.137, 0.19, 0.248, 0.286, 0.344, 0.385, 0.449, 0.491, 0.533, 0.598, 0.642, 0.686, 0.746, 0.78, 0.834, 0.882, 0.927, 0.971, 0.995, 0.978],
    tal: [0.976, 0.915, 0.847, 0.78, 0.714, 0.643, 0.565, 0.501, 0.437, 0.375, 0.291, 0.229, 0.168, 0.09, 0.032, -0.04, -0.112, -0.169, -0.237, -0.308, -0.363],
    dct: [-0.365, -0.413, -0.441, -0.429, -0.368, -0.308, -0.239, -0.207, -0.239, -0.301, -0.371, -0.417, -0.415, -0.358, -0.288, -0.223, -0.171, -0.167, -0.203, -0.254, -0.308],
    cd: [-0.306, -0.252, -0.179, -0.114, -0.05, 0.022, 0.094, 0.155, 0.22, 0.286, 0.353, 0.423, 0.493, 0.56, 0.625, 0.689, 0.75, 0.827, 0.886, 0.96, 1.011],
  };
  const depth = (part, u) => { const a = DEPTH[part], x = Math.max(0, Math.min(1, u)) * (a.length - 1), k = Math.min(a.length - 2, Math.floor(x)); return a[k] + (a[k + 1] - a[k]) * (x - k); };
  let ucc = 0; for (let k = 0; k < 400; k++) if (depth("cd", k / 400) < 0) ucc = (k + 1) / 400;   // where the collecting duct leaves the cortex
  // segments in order, with transit times (s) and the law that acts on the parcel there: rates are per unit of segment length
  const k_pct = Math.log(100 / 35) / 1.0, k_glu = 9, k_hco3 = Math.log(5);
  const SEG = [
    { phase: "Glomerular filtration", part: "bowman", u0: 0, u1: 1, dur: 3, law: () => ({ dV: 0, dSol: 0 }) },
    { phase: "Proximal convoluted tubule", part: "pct", u0: 0, u1: 1, dur: 12, law: (st, u) => { const f = k_pct * (1.45 - 0.9 * u) / 1.0; const dV = -f * st.V; return { dV, dSol: dV * st.Sol / st.V, dG: -k_glu * st.G, dB: -k_hco3 * st.B, water: "follows Na⁺", salt: "Na⁺/H⁺, SGLT2" }; } },
    { phase: "Thin descending limb", part: "tdl", u0: 0, u1: 1, dur: 20, law: (st, u, z) => { const osm = st.Sol / st.V, drive = INT(z) - osm; return { dV: -24 * st.V * Math.max(0, drive) / osm, dSol: 0 }; } },
    { phase: "Thick ascending limb", part: "tal", u0: 0, u1: 1, dur: 22, law: (st, u, z) => { const osm = st.Sol / st.V, floor = Math.max(TAL_FLOOR, INT(z) - SINGLE_EFFECT); return { dV: 0, dSol: -22 * st.V * Math.max(0, osm - floor) }; } },
    { phase: "Distal convoluted tubule", part: "dct", u0: 0, u1: 1, dur: 16, law: (st) => { const osm = st.Sol / st.V; return { dV: 0, dSol: -0.32 * st.V * Math.max(0, osm - 60) }; } },
    { phase: "Cortical collecting duct", part: "cd", u0: 0, u1: ucc, dur: 12, law: (st, u, z) => { const osm = st.Sol / st.V; return { dV: -11 * st.V * Math.max(0, INT(z) - osm) / osm, dSol: -0.45 * st.Sol }; } },
    { phase: "Medullary collecting duct", part: "cd", u0: ucc, u1: 1, dur: 48, law: (st, u, z) => { const osm = st.Sol / st.V; return { dV: -15 * st.V * Math.max(0, INT(z) - osm) / osm, dSol: 0 }; } },
  ];
  let T = 0; SEG.forEach((g) => { g.t0 = T; T += g.dur; });
  // integrate the parcel through every segment (fine Euler steps in u), recording its state
  const SUB = 900, st = { V: 100, Sol: 100 * PLASMA, G: 100, B: 100 };
  SEG.forEach((g) => { g.rec = []; const du = (g.u1 - g.u0) / SUB;
    for (let k = 0; k <= SUB; k++) { const u = g.u0 + k * du, z = depth(g.part, u), r = g.law(st, u, z);
      const dt = g.dur / SUB, wOut = -r.dV * du / dt / st.V * 100, sOut = -r.dSol * du / dt / st.Sol * 100;   // % of the parcel's own water / solute leaving per second
      g.rec.push({ u, z, V: st.V, osm: st.Sol / st.V, G: st.G, B: st.B, wOut, sOut, int: INT(z) });
      if (k < SUB) { st.V += r.dV * du; st.Sol += r.dSol * du; st.G += (r.dG || 0) * du; st.B += (r.dB || 0) * du; } } });
  const maxAct = {}; SEG.forEach((g) => { maxAct[g.part] = Math.max(maxAct[g.part] || 0, ...g.rec.map((r) => r.wOut + r.sOut)); });
  const tipOsm = SEG[2].rec[SUB].osm, urine = SEG[6].rec[SUB];
  const segAt = (t) => { let j = 0; while (j < SEG.length - 1 && t >= SEG[j + 1].t0) j++; return j; };
  const N = 600, PARTS = ["aff", "glom", "eff", "bowman", "pct", "tdl", "tal", "md", "dct", "cd", "ptc", "vr", "interstitium"];
  const f0 = (v) => v.toFixed(0), f1 = (v) => (v < 10 ? v.toFixed(1) : v.toFixed(0));
  return {
    T, N, timeUnit: "s", clockNote: "one parcel · ADH on · GFR " + GFR + " mL/min", speeds: [1, 2, 5, 10],
    parts: [{ id: "aff", name: "Afferent arteriole" }, { id: "glom", name: "Glomerulus" }, { id: "eff", name: "Efferent arteriole" }, { id: "bowman", name: "Bowman's capsule" },
      { id: "pct", name: "Proximal convoluted tubule" }, { id: "tdl", name: "Thin descending limb" }, { id: "tal", name: "Thick ascending limb" }, { id: "md", name: "Macula densa" },
      { id: "dct", name: "Distal convoluted tubule" }, { id: "cd", name: "Collecting duct" }, { id: "ptc", name: "Peritubular capillaries" }, { id: "vr", name: "Vasa recta" },
      { id: "interstitium", name: "Medullary interstitium" }],
    readouts: [{ key: "osm", label: "Tubular fluid", unit: "mOsm/kg", digits: 0, big: true }, { key: "vol", label: "Filtrate left", unit: "%", digits: 1, big: true },
      { key: "intOsm", label: "Interstitium here", unit: "mOsm/kg", digits: 0, big: true }, { key: "flowDay", label: "Flow at this point", unit: "L/day", digits: 1, big: true },
      { key: "gap", label: "Lumen minus interstitium", unit: "mOsm/kg", digits: 0 }, { key: "waterOut", label: "Water leaving parcel", unit: "%/s", digits: 1 },
      { key: "saltOut", label: "Solute leaving parcel", unit: "%/s", digits: 1 }, { key: "glucose", label: "Glucose left", unit: "%", digits: 0 },
      { key: "hco3", label: "Bicarbonate left", unit: "%", digits: 0 }, { key: "depth", label: "Depth into medulla", unit: "0–1", digits: 2 }, { key: "nfp", label: "Net filtration pressure", unit: "mmHg", digits: 0 },
      { key: "pGC", label: "Glomerular capillary pressure", unit: "mmHg", digits: 0 }, { key: "pBS", label: "Bowman's space pressure", unit: "mmHg", digits: 0 }, { key: "piGC", label: "Plasma oncotic pressure", unit: "mmHg", digits: 0 }],
    chart: [{ lane: "Osmolality", unit: "mOsm/kg", min: 0, max: 1250, series: [{ key: "intOsm", label: "interstitium", tone: "muted", dash: true }, { key: "osm", label: "tubular fluid", tone: "hot" }] },
      { lane: "Volume", unit: "% left", min: 0, max: 100, series: [{ key: "vol", label: "filtrate left", tone: "accent" }] }],
    gateTitle: "Transport", onWord: "ON", offWord: "OFF",
    gates: [
      { label: "Filtration", on: (s) => s.parcel.part === "bowman", detail: () => P_GC + " − " + P_BS + " − " + PI_GC + " = " + NFP + " mmHg" },
      { label: "Water out", on: (s) => s.readouts.waterOut > 0.05, detail: (s) => { const r = s.readouts, p = s.parcel.part;
          return p === "pct" ? "AQP1, follows Na⁺ (iso " + f0(r.osm) + ")" : p === "tdl" ? "AQP1 · " + f0(r.osm) + " < " + f0(r.intOsm) : p === "cd" ? "AQP2 · " + f0(r.osm) + " < " + f0(r.intOsm) : p === "bowman" ? "—" : "no aquaporins"; } },
      { label: "NaCl out", on: (s) => s.readouts.saltOut > 0.05, detail: (s) => { const r = s.readouts, p = s.parcel.part;
          return p === "pct" ? "Na⁺/H⁺, SGLT2, pump" : p === "tdl" ? "no salt route" : p === "tal" ? "NKCC2 · " + f0(r.osm) + " > " + f0(Math.max(TAL_FLOOR, r.intOsm - SINGLE_EFFECT)) : p === "dct" ? "NCC (thiazide)" : p === "cd" ? "ENaC (aldosterone)" : "—"; } },
      { label: "Glucose out", on: (s) => s.parcel.part === "pct" && s.readouts.glucose > 0.5, detail: (s) => "SGLT · " + f0(s.readouts.glucose) + "% left" }],
    events: () => [{ t: SEG[3].t0, label: "loop tip" }, { t: SEG[4].t0, label: "macula densa" }],
    short: { "Glomerular filtration": "filtration", "Proximal convoluted tubule": "PCT", "Thin descending limb": "thin desc.", "Thick ascending limb": "thick asc.",
      "Distal convoluted tubule": "distal", "Cortical collecting duct": "CCD", "Medullary collecting duct": "medullary collecting duct (ADH)" },
    parcelLabel: (s) => f0(s.readouts.osm) + " mOsm · " + f1(s.readouts.vol) + "%",
    sample(t) {
      const j = segAt(t), g = SEG[j], x = Math.max(0, Math.min(1, (t - g.t0) / g.dur)) * SUB, k = Math.min(SUB - 1, Math.floor(x)), w = x - k, a = g.rec[k], b = g.rec[k + 1];
      const L = (key) => a[key] + (b[key] - a[key]) * w, V = L("V"), osm = L("osm"), z = L("z"), intOsm = L("int"), u = L("u"), wOut = L("wOut"), sOut = L("sOut");
      const act = Math.min(1, (wOut + sOut) / (maxAct[g.part] || 1)), here = (p) => (g.part === p ? Math.max(0.3, act) : 0);
      const md = g.part === "tal" && u > 0.85 ? (u - 0.85) / 0.15 : g.part === "dct" && u < 0.12 ? 1 - u / 0.12 : 0;
      const parts = { aff: { active: g.part === "bowman" ? 1 : 0, flow: 1 }, glom: { active: g.part === "bowman" ? 1 : 0, flow: 1 }, eff: { active: g.part === "bowman" ? 1 : 0, flow: 1 - FF / 100 },
        bowman: { active: g.part === "bowman" ? 1 : 0, flow: V / 100, level: V / 100 }, md: { active: md },
        ptc: { active: g.part === "pct" || g.part === "dct" ? act : 0, flow: 1 }, vr: { active: ["tdl", "tal", "cd"].includes(g.part) && z > 0 ? act : 0, flow: 0.6 },
        interstitium: { active: z > 0 ? Math.min(1, z) : 0, level: (intOsm - PLASMA) / (PAPILLA - PLASMA) } };
      for (const p of ["pct", "tdl", "tal", "dct", "cd"]) parts[p] = { active: here(p), flow: g.part === p ? V / 100 : 0, level: g.part === p ? V / 100 : 0 };
      return { phase: g.phase, parcel: { part: g.part, u: Math.max(0, Math.min(1, u)) },
        readouts: { osm, vol: V, intOsm, flowDay: GFR_DAY * V / 100, gap: osm - intOsm, waterOut: wOut, saltOut: sOut, glucose: L("G"), hco3: L("B"), depth: z, nfp: NFP, pGC: P_GC, pBS: P_BS, piGC: PI_GC },
        parts };
    },
    explain(s) { const r = s.readouts;
      switch (s.phase) {
        case "Glomerular filtration": return "Net filtration pressure is " + P_GC + " − " + P_BS + " − " + PI_GC + " = <b>" + NFP + " mmHg</b>, so plasma is pushed into Bowman's space: " + GFR + " mL/min, " + f0(FF) + "% of renal plasma flow. The parcel starts as plasma water at " + f0(r.osm) + " mOsm/kg.";
        case "Proximal convoluted tubule": return "Na⁺ is pumped out and <b>water follows it</b>, so the fluid stays at " + f0(r.osm) + " mOsm/kg while the volume falls to " + f1(r.vol) + "%. Glucose left: " + f0(r.glucose) + "%.";
        case "Thin descending limb": return "Water-permeable but salt-tight: water leaves toward the saltier interstitium (" + f0(r.intOsm) + "), so the fluid <b>concentrates to " + f0(r.osm) + "</b>; " + f1(r.vol) + "% of the filtrate is left.";
        case "Thick ascending limb": return "<b>NKCC2 pumps NaCl out</b> but no water can follow, so the fluid dilutes to " + f0(r.osm) + " while the interstitium stays at " + f0(r.intOsm) + ". This salt builds the medullary gradient.";
        case "Distal convoluted tubule": return "Past the macula densa, <b>NCC</b> (the thiazide target) removes more NaCl; the wall is still water-tight, so the fluid stays dilute at " + f0(r.osm) + ".";
        case "Cortical collecting duct": return "With ADH, <b>aquaporin-2</b> lets water out to the 300 mOsm/kg cortex: the fluid rises to " + f0(r.osm) + " and volume drops to " + f1(r.vol) + "%. Aldosterone drives Na⁺ in and K⁺ out here.";
        default: return "The duct dives through ever saltier medulla (" + f0(r.intOsm) + "), and ADH lets water follow: urine reaches <b>" + f0(r.osm) + " mOsm/kg</b> with " + f1(r.vol) + "% of the filtrate left, about " + f1(r.flowDay) + " L/day.";
      } },
    notes: "Juxtamedullary nephron with ADH on. Each segment's transport law (iso-osmotic PCT, water-only thin limb, NaCl-only thick limb with a 200 mOsm single effect, NCC in the DCT, ADH-gated water in the duct) acts on one parcel over typical transit times; the interstitium rises linearly from 300 to 1200 mOsm/kg with depth. Solute entry into the thin limb (urea recycling) is ignored. Final urine " + f0(urine.osm) + " mOsm/kg, " + f1(urine.V) + "% of filtrate, tip of loop " + f0(tipOsm) + ".",
  };
}
