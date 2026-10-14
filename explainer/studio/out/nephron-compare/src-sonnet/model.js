/* How the nephron makes urine: follow ONE parcel of filtrate from Bowman's capsule to the papilla.
   State: W = volume of the parcel as % of what was filtered, S = its solute content (W x osmolality, in % x mOsm/kg).
   Each segment obeys its own law; the parcel's osmolality is S / W. */
function createModel() {
  const GFR = 125, ADH = 1, N = 600, TN = 4000;       // mL/min; ADH present; samples; integration table size
  const NFP = { PGC: 55, PBS: 15, PIGC: 30 };            // mmHg, from the note
  const SEG = [
    { id: "bowman", phase: "Bowman's capsule", dur: 6 },
    { id: "pct", phase: "Proximal tubule", dur: 28 },
    { id: "dtl", phase: "Descending limb", dur: 14 },
    { id: "tal", phase: "Ascending limb", dur: 26 },
    { id: "dct", phase: "Distal tubule", dur: 16 },
    { id: "cd", phase: "Collecting duct", dur: 40 },
  ];
  const T = SEG.reduce((a, s) => a + s.dur, 0);
  const U_TAL_MED = 0.66, U_CD_CORTEX = 0.2;            // fraction of the TAL lying in the medulla; of the collecting duct lying in the cortex
  const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
  // medullary interstitium: 300 at the corticomedullary border rising linearly to 1200 at the papillary tip (d = 0..1 of medullary depth)
  const interstitium = (d) => 300 + 900 * clamp(d, 0, 1);
  const depthOf = (id, u) => id === "dtl" ? u : id === "tal" ? (u < U_TAL_MED ? 1 - u / U_TAL_MED : 0) : id === "cd" ? clamp((u - U_CD_CORTEX) / (1 - U_CD_CORTEX), 0, 1) : 0;
  const relax = (x, target, k, du) => target + (x - target) * Math.exp(-k * du);   // exact first-order approach over a step du

  // integrate the parcel through every segment; record the table
  let W = 100, S = 100 * 300;
  const REC = []; let tt = 0;
  for (let si = 0; si < SEG.length; si++) {
    const sg = SEG[si], n = Math.max(2, Math.round(TN * sg.dur / T)), du = 1 / n;
    for (let k = 0; k < n; k++) {
      const u = k / (n - 1), I = interstitium(depthOf(sg.id, u)); let osm = S / W, Wp = W, Sp = S;
      if (sg.id === "pct") { const g = (x) => x * (1.35 - 0.35 * x); W = 100 - 65 * g(u); osm = 300; S = W * osm; }           // iso-osmotic: 65 % of the volume leaves, osmolality stays 300
      else if (sg.id === "dtl") { osm = relax(osm, I, 60, du); W = S / osm; }                                                  // water-permeable, salt-tight: S fixed, osmolality chases the medulla
      else if (sg.id === "tal") { osm = relax(osm, I - 200, 25, du); S = W * osm; }                                          // water-tight, NKCC2 pumps NaCl out: W fixed, a 200 mOsm single effect
      else if (sg.id === "dct") { osm = relax(osm, 75, 3, du); S = W * osm; }                                                // thiazide-sensitive NaCl uptake, still water-tight
      else if (sg.id === "cd") { S += 170 * du; osm = relax(S / W, I, 25 * ADH, du); W = S / osm; }                          // aldosterone/K+ adds solute; ADH (AQP2) lets water follow the medulla
      REC.push({ si, id: sg.id, u, W, S, osm: S / W, I: sg.id === "bowman" ? 300 : I, dW: Wp - W, dS: Sp - S, dtS: sg.dur / n });
      if (sg.id === "bowman") { W = 100; S = 100 * 300; }
    }
  }
  REC.forEach((r, k) => { r.t = k * T / REC.length; });
  const maxF = {}; const up = (id, key, v) => { maxF[id + key] = Math.max(maxF[id + key] || 1e-9, v); };
  REC.forEach((r) => { up(r.id, "w", r.dW / r.dtS); up(r.id, "s", Math.abs(r.dS) / r.dtS); });
  const mdStart = REC.findIndex((r) => r.id === "tal" && r.u > 0.82);
  const tipTime = REC.find((r) => r.id === "dtl" && r.u >= 0.999).t;

  const PARTS = [
    ["bowman", "Bowman's capsule"], ["glom", "Glomerulus (capillary tuft)"], ["afferent", "Afferent arteriole"], ["efferent", "Efferent arteriole"],
    ["pct", "Proximal convoluted tubule"], ["dtl", "Thin descending limb"], ["tal", "Thick ascending limb"], ["md", "Macula densa"],
    ["dct", "Distal convoluted tubule"], ["cd", "Collecting duct"], ["medulla", "Medullary interstitium"], ["ptc", "Peritubular capillaries"], ["vasa", "Vasa recta"],
  ].map(([id, name]) => ({ id, name }));
  const n0 = (v) => Math.round(v);
  const gate = (id, label, rule) => ({ label, on: (s) => s.parts[id].open > 0.5, detail: (s) => (s.parcel.part === id ? "tube " + n0(s.readouts.osm) + " · medulla " + n0(s.readouts.interst) : rule) });
  return {
    T, N, timeUnit: "s", clockNote: "GFR " + GFR + " mL/min · ADH present", speeds: [1, 2, 4, 8],
    parts: PARTS,
    readouts: [
      { key: "osm", label: "Fluid osmolality", unit: "mOsm/kg", digits: 0, big: true },
      { key: "vol", label: "Filtrate left", unit: "%", digits: 1, big: true },
      { key: "flow", label: "Tubular flow", unit: "mL/min", digits: 1, big: true },
      { key: "interst", label: "Local interstitium", unit: "mOsm/kg", digits: 0, big: true },
      { key: "pull", label: "Interstitium minus tube", unit: "mOsm/kg", digits: 0 },
    ],
    chart: [
      { lane: "Osmolality", unit: "mOsm/kg", min: 0, max: 1300, series: [{ key: "interst", label: "interstitium", tone: "muted", dash: true }, { key: "osm", label: "tubular fluid", tone: "hot" }] },
      { lane: "Volume", unit: "% left", min: 0, max: 100, series: [{ key: "vol", label: "filtrate left", tone: "accent" }] },
    ],
    gateTitle: "Water can leave?", onWord: "YES", offWord: "NO",
    gates: [gate("pct", "Proximal", "AQP1, follows Na+"), gate("dtl", "Descending", "AQP1, no salt exit"), gate("tal", "Ascending", "no aquaporins"), gate("dct", "Distal", "water-tight"), gate("cd", "Collecting", "AQP2, needs ADH")],
    events: () => [{ t: tipTime, label: "loop tip" }, { t: REC[mdStart].t, label: "macula densa" }],
    short: { "Bowman's capsule": "capsule", "Proximal tubule": "proximal", "Descending limb": "descending", "Ascending limb": "ascending", "Distal tubule": "distal", "Collecting duct": "collecting duct" },
    interstitium, nfp: NFP, gfr: GFR,
    parcelLabel: (s) => n0(s.readouts.osm) + " mOsm · " + (s.readouts.vol < 10 ? s.readouts.vol.toFixed(1) : n0(s.readouts.vol)) + "% left",
    sample(t) {
      const k = clamp(Math.floor(t / T * REC.length), 0, REC.length - 1), r = REC[k], sg = SEG[r.si];
      const wf = clamp(r.dW / r.dtS / maxF[r.id + "w"], 0, 1), sf = clamp(Math.abs(r.dS) / r.dtS / maxF[r.id + "s"], 0, 1);
      const on = (id) => (r.id === id ? 1 : 0), inTal = r.id === "tal" ? clamp((r.u - 0.8) / 0.2, 0, 1) : r.id === "dct" ? clamp(1 - r.u / 0.25, 0, 1) : 0;
      const reabs = clamp((r.id === "pct" || r.id === "dtl" || r.id === "cd" ? wf : 0) * (r.id === "pct" ? 1 : r.id === "dtl" ? 0.9 : 0.5) + (r.id === "tal" ? sf * 0.8 : 0), 0, 1);
      return {
        phase: sg.phase,
        readouts: { osm: r.osm, vol: r.W, flow: GFR * r.W / 100, interst: r.I, pull: Math.max(0, r.I - r.osm) },
        parcel: { part: r.id, u: r.u },
        parts: {
          bowman: { active: on("bowman"), flow: r.W / 100, level: r.W / 100 },
          glom: { active: 0.55 + 0.45 * on("bowman"), flow: 1 },
          afferent: { active: 0.6, flow: 1 }, efferent: { active: 0.6, flow: 0.8 },
          pct: { active: on("pct") * wf, flow: on("pct") * r.W / 100, level: r.W / 100, open: 1 },
          dtl: { active: on("dtl") * wf, flow: on("dtl") * r.W / 100, level: r.W / 100, open: 1 },
          tal: { active: on("tal") * sf, flow: on("tal") * r.W / 100, level: r.W / 100, open: 0 },
          md: { active: inTal, flow: r.W / 100 },
          dct: { active: on("dct") * sf, flow: on("dct") * r.W / 100, level: r.W / 100, open: 0 },
          cd: { active: on("cd") * wf, flow: on("cd") * Math.max(r.W / 100, 0.1), level: r.W / 100, open: ADH > 0.5 ? 1 : 0 },
          medulla: { active: clamp((r.I - 300) / 900, 0, 1), level: clamp((r.I - 300) / 900, 0, 1) },
          ptc: { active: reabs, flow: 0.3 + 0.7 * reabs }, vasa: { active: reabs, flow: 0.3 + 0.7 * reabs },
        },
      };
    },
    explain(s) {
      const r = s.readouts, f = (v) => Math.round(v);
      switch (s.parcel.part) {
        case "bowman": return "Net filtration pressure is <b>" + (NFP.PGC - NFP.PBS - NFP.PIGC) + " mmHg</b> (55 − 15 − 30), so plasma-like filtrate enters Bowman's space at about <b>" + f(r.osm) + " mOsm/kg</b> with 100% of the filtered volume.";
        case "pct": return "Reabsorption is <b>iso-osmotic</b>: water follows Na+ so the fluid stays at " + f(r.osm) + " mOsm/kg while the volume falls to <b>" + r.vol.toFixed(0) + "%</b>.";
        case "dtl": return "This limb is <b>water-permeable but salt-tight</b>. Water leaves toward the medulla (" + f(r.interst) + " mOsm/kg here), so the tube fluid is concentrated to <b>" + f(r.osm) + "</b> and only " + r.vol.toFixed(0) + "% remains.";
        case "tal": return "The thick limb is <b>water-tight</b> but pumps out Na+, K+ and 2Cl− through NKCC2. Tube fluid falls to <b>" + f(r.osm) + "</b>, " + f(r.pull) + " below its surroundings, so the medulla stays salty.";
        case "dct": return "The distal tubule is still water-tight and takes up Na+ and Cl− (thiazide-sensitive), so the fluid is <b>dilute, " + f(r.osm) + " mOsm/kg</b>, against an interstitium of " + f(r.interst) + ".";
        default: return "With <b>ADH</b>, aquaporin-2 lets water follow the interstitium (" + f(r.interst) + "), so the fluid concentrates to <b>" + f(r.osm) + "</b>; only " + r.vol.toFixed(2) + "% of the filtrate is left.";
      }
    },
    notes: "One parcel is followed: volume W and solute S are integrated per segment (PCT iso-osmotic; descending limb water-only; thick limb salt-only with a 200 mOsm single effect; distal tubule salt uptake; collecting duct water follows the 300 to 1200 mOsm/kg medulla under ADH, with aldosterone/K+ adding solute). Transit times are set per segment.",
  };
}
