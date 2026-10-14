/* Library plate: the cardiac cycle (Wiggers) as a time-varying-elastance model of all four chambers and both circulations. */
function createModel() {
  const HR = 75, T = 60 / HR, N = 800, DT = T / N;
  const ATR = { start: 0, dur: 0.17, rise: 0.085 }, VEN = { start: 0.12, dur: 0.43, rise: 0.30 };
  const act = (t, a) => { const u = ((t - a.start) % T + T) % T; if (u > a.dur) return 0; return u < a.rise ? 0.5 * (1 - Math.cos(Math.PI * u / a.rise)) : 0.5 * (1 + Math.cos(Math.PI * (u - a.rise) / (a.dur - a.rise))); };
  const CH = { LV: [0.07, 2.6, 12], RV: [0.035, 0.6, 12], LA: [0.16, 0.35, 6], RA: [0.07, 0.2, 6] };
  const CAP = { SA: 1.35, SV: 60, PA: 4.2, PV: 18 }, UV = { SA: 680, SV: 2700, PA: 120, PV: 520 };
  const R = { sys: 1.05, sven: 0.035, pul: 0.075, pven: 0.012, mv: 0.006, av: 0.005, tv: 0.005, pv: 0.004 };
  const pos = (x) => (x > 0 ? x : 0);
  function pressures(t, V) { const ev = act(t, VEN), ea = act(t, ATR), P = {};
    for (const k of ["LV", "RV"]) { const c = CH[k]; P[k] = (c[0] + (c[1] - c[0]) * ev) * (V[k] - c[2]); }
    for (const k of ["LA", "RA"]) { const c = CH[k]; P[k] = (c[0] + (c[1] - c[0]) * ea) * (V[k] - c[2]); }
    for (const k of ["SA", "SV", "PA", "PV"]) P[k] = (V[k] - UV[k]) / CAP[k]; return P; }
  const flows = (P) => ({ mitral: pos(P.LA - P.LV) / R.mv, aortic: pos(P.LV - P.SA) / R.av, systemic: (P.SA - P.SV) / R.sys, cava: (P.SV - P.RA) / R.sven,
    tricuspid: pos(P.RA - P.RV) / R.tv, pulmonic: pos(P.RV - P.PA) / R.pv, pulmonary: (P.PA - P.PV) / R.pul, pveins: (P.PV - P.LA) / R.pven });
  // simulate to a steady beat, then record one beat
  const V = { LV: 130, RV: 135, LA: 60, RA: 60, SA: 820, SV: 3000, PA: 205, PV: 600 }; let t = 0; const h = DT / 5;
  const step = () => { const P = pressures(t, V), Q = flows(P); V.LV += h * (Q.mitral - Q.aortic); V.SA += h * (Q.aortic - Q.systemic); V.SV += h * (Q.systemic - Q.cava); V.RA += h * (Q.cava - Q.tricuspid);
    V.RV += h * (Q.tricuspid - Q.pulmonic); V.PA += h * (Q.pulmonic - Q.pulmonary); V.PV += h * (Q.pulmonary - Q.pveins); V.LA += h * (Q.pveins - Q.mitral); t += h; };
  for (let i = 0; i < 40 * N * 5; i++) step(); t = Math.round(t / T) * T;
  const REC = []; for (let i = 0; i < N; i++) { const P = pressures(t, V), Q = flows(P); REC.push({ P, Q, V: { ...V } }); for (let j = 0; j < 5; j++) step(); }
  const maxQ = {}; for (const k of Object.keys(REC[0].Q)) maxQ[k] = Math.max(...REC.map((r) => Math.abs(r.Q[k]))) || 1;
  const EDV = Math.max(...REC.map((r) => r.V.LV)), ESV = Math.min(...REC.map((r) => r.V.LV));
  // rapid filling runs from mitral opening until mitral inflow has peaked and fallen back (no one-frame "diastasis" at opening)
  let kPeak = 0; for (let k = 0; k < N; k++) if (k * DT > VEN.start + VEN.rise && REC[k].Q.mitral > REC[kPeak].Q.mitral) kPeak = k;
  function phaseOf(k) { const r = REC[k], u = k * DT;
    if (r.P.LV > r.P.SA) return "Ventricular ejection";
    if (r.P.LA > r.P.LV) { if (act(u, ATR) > 0.02) return "Atrial systole"; return (r.Q.mitral > 120 || (k <= kPeak && u > VEN.start + VEN.rise)) ? "Rapid filling" : "Diastasis"; }
    if (u < VEN.start) return "Atrial systole"; return u < VEN.start + VEN.rise ? "Isovolumetric contraction" : "Isovolumetric relaxation"; }
  const open = (k, v) => (REC[k].Q[v] > 0.01 ? 1 : 0);
  // surface ECG, drawn on the same clock as the activation that drives the chambers (P at atrial onset, QRS just before ventricular onset)
  const g = (u, c, w) => Math.exp(-((u - c) * (u - c)) / (2 * w * w));
  const ecg = (u) => 0.13 * g(u, 0.05, 0.022) - 0.10 * g(u, 0.092, 0.006) + 1.0 * g(u, 0.104, 0.008) - 0.22 * g(u, 0.118, 0.007) + 0.28 * g(u, 0.36, 0.04);
  return {
    T, N, timeUnit: "s", clockNote: HR + " bpm", speeds: [0.1, 0.25, 0.5, 1],
    parts: [{ id: "RA", name: "Right atrium" }, { id: "RV", name: "Right ventricle" }, { id: "LA", name: "Left atrium" }, { id: "LV", name: "Left ventricle" },
      { id: "tricuspid", name: "Tricuspid valve" }, { id: "pulmonary", name: "Pulmonary valve" }, { id: "mitral", name: "Mitral valve" }, { id: "aortic", name: "Aortic valve" },
      { id: "aorta", name: "Aorta" }, { id: "pa", name: "Pulmonary artery" }, { id: "cavae", name: "Venae cavae" }, { id: "pveins", name: "Pulmonary veins" }],
    readouts: [{ key: "LVP", label: "LV pressure", unit: "mmHg" }, { key: "AoP", label: "Aortic pressure", unit: "mmHg" }, { key: "LAP", label: "LA pressure", unit: "mmHg" },
      { key: "RVP", label: "RV pressure", unit: "mmHg" }, { key: "PAP", label: "Pulmonary artery pressure", unit: "mmHg" }, { key: "RAP", label: "RA pressure", unit: "mmHg" },
      { key: "LAV", label: "LA volume", unit: "mL" }, { key: "RAV", label: "RA volume", unit: "mL" }, { key: "ecg", label: "ECG", unit: "mV (schematic)" },
      { key: "LVV", label: "LV volume", unit: "mL", big: true }, { key: "RVV", label: "RV volume", unit: "mL", big: true }, { key: "SV", label: "Stroke vol · EF", unit: "", big: true, text: (s) => s.readouts.SV.toFixed(0) + " · " + s.readouts.EF.toFixed(0) + "%" }, { key: "EF", label: "Ejection fraction", unit: "%" }],
    chart: [{ lane: "ECG", unit: "ECG", min: -0.3, max: 1.05, weight: 0.7, grid: false, noEvents: true, marks: [{ t: 0.05, label: "P" }, { t: 0.104, label: "QRS" }, { t: 0.36, label: "T" }], series: [{ key: "ecg", label: "", tone: "ink", width: 1.3 }] },
      { lane: "Pressure", unit: "mmHg", min: 0, max: 130, step: 20, weight: 2.3, dot: "LVP", series: [{ key: "AoP", label: "Aorta", tone: "hot", dash: true, at: 0.38 }, { key: "LVP", label: "LV", tone: "hot", at: 0.29 }, { key: "LAP", label: "LA", tone: "muted", at: 0.04 }] },
      { lane: "Volume", unit: "LV mL", min: 40, max: 140, step: 60, weight: 1, series: [{ key: "LVV", label: "", tone: "accent" }] }],
    chartModes: [
      { label: "Left heart", lanes: null },
      { label: "Right heart", lanes: [{ lane: "ECG", unit: "ECG", min: -0.3, max: 1.05, weight: 0.7, grid: false, noEvents: true, marks: [{ t: 0.05, label: "P" }, { t: 0.104, label: "QRS" }, { t: 0.36, label: "T" }], series: [{ key: "ecg", label: "", tone: "ink", width: 1.3 }] },
        { lane: "Pressure", unit: "mmHg", min: 0, max: 30, step: 5, weight: 2.3, dot: "RVP", series: [{ key: "PAP", label: "Pulm. artery", tone: "cold", dash: true, at: 0.74 }, { key: "RVP", label: "RV", tone: "cold", at: 0.29 }, { key: "RAP", label: "RA", tone: "muted", at: 0.04 }] },
        { lane: "Volume", unit: "RV mL", min: 40, max: 140, step: 60, weight: 1, series: [{ key: "RVV", label: "", tone: "accent" }] }] }],
    startAt: 0.275, gateWhy: "Behind · ahead (mmHg)",
    gateTitle: "Valve", gates: [
      { label: "Tricuspid", on: (s) => s.parts.tricuspid.open > 0.5, detail: (s) => "RA " + s.readouts.RAP.toFixed(1) + (s.readouts.RAP > s.readouts.RVP ? " > " : " < ") + "RV " + s.readouts.RVP.toFixed(1) },
      { label: "Pulmonary", on: (s) => s.parts.pulmonary.open > 0.5, detail: (s) => "RV " + s.readouts.RVP.toFixed(1) + (s.readouts.RVP > s.readouts.PAP ? " > " : " < ") + "PA " + s.readouts.PAP.toFixed(1) },
      { label: "Mitral", on: (s) => s.parts.mitral.open > 0.5, detail: (s) => "LA " + s.readouts.LAP.toFixed(1) + (s.readouts.LAP > s.readouts.LVP ? " > " : " < ") + "LV " + s.readouts.LVP.toFixed(1) },
      { label: "Aortic", on: (s) => s.parts.aortic.open > 0.5, detail: (s) => "LV " + s.readouts.LVP.toFixed(1) + (s.readouts.LVP > s.readouts.AoP ? " > " : " < ") + "Aorta " + s.readouts.AoP.toFixed(1) }],
    events: (S, T) => { const ev = []; for (let k = 1; k < N; k++) { if (S[k - 1].parts.mitral.open > 0.5 && S[k].parts.mitral.open <= 0.5) ev.push({ t: k * DT, label: "S1", sound: true, freq: 55 }); if (S[k - 1].parts.aortic.open > 0.5 && S[k].parts.aortic.open <= 0.5) ev.push({ t: k * DT, label: "S2", sound: true, freq: 80 }); } return ev; },
    short: { "Atrial systole": "atrial kick", "Isovolumetric contraction": "isovol. contr.", "Ventricular ejection": "ejection", "Isovolumetric relaxation": "isovol. relax.", "Rapid filling": "rapid filling", "Diastasis": "diastasis" },
    sample(tt) { const k = Math.min(N - 1, Math.floor(tt / DT)), r = REC[k];
      return { phase: phaseOf(k),
        q: r.Q,
        readouts: { ecg: ecg(k * DT), LVP: r.P.LV, AoP: r.P.SA, LAP: r.P.LA, RVP: r.P.RV, PAP: r.P.PA, RAP: r.P.RA, LVV: r.V.LV, RVV: r.V.RV, LAV: r.V.LA, RAV: r.V.RA, SV: EDV - ESV, EF: (EDV - ESV) / EDV * 100 },
        parts: { tricuspid: { open: open(k, "tricuspid") }, pulmonary: { open: open(k, "pulmonic") }, mitral: { open: open(k, "mitral") }, aortic: { open: open(k, "aortic") },
          RA: { active: act(k * DT, ATR), flow: r.Q.tricuspid / maxQ.tricuspid }, LA: { active: act(k * DT, ATR), flow: r.Q.mitral / maxQ.mitral },
          RV: { active: act(k * DT, VEN), flow: r.Q.pulmonic / maxQ.pulmonic }, LV: { active: act(k * DT, VEN), flow: r.Q.aortic / maxQ.aortic },
          aorta: { flow: r.Q.aortic / maxQ.aortic }, pa: { flow: r.Q.pulmonic / maxQ.pulmonic }, cavae: { flow: r.Q.cava / maxQ.cava }, pveins: { flow: r.Q.pveins / maxQ.pveins } } }; },
    explain(s) { const r = s.readouts, f = (v) => v.toFixed(0);
      switch (s.phase) {
        case "Atrial systole": return "The P wave has fired and the <b>atria contract</b>. LA pressure (" + f(r.LAP) + ") sits above LV pressure (" + f(r.LVP) + "), so the mitral valve stays open and tops up the ventricle with its last ~15–20% of filling. The aortic valve is shut because the aorta (" + f(r.AoP) + ") is far above the relaxed LV.";
        case "Isovolumetric contraction": return "After the QRS the <b>ventricles contract</b>. As soon as LV pressure (" + f(r.LVP) + ") passed LA pressure (" + f(r.LAP) + ") the mitral valve was pushed shut, giving <b>S1</b>. LV pressure is still below the aorta (" + f(r.AoP) + "), so the aortic valve is shut too. With both doors closed the volume is fixed at " + f(r.LVV) + " mL and pressure climbs steeply.";
        case "Ventricular ejection": return "LV pressure (" + f(r.LVP) + ") has overtaken the aorta (" + f(r.AoP) + "), so the <b>aortic valve is forced open</b> and blood leaves. On the right, RV (" + f(r.RVP) + ") beats the pulmonary artery (" + f(r.PAP) + ") with a much smaller push: same stroke volume at about a fifth of the pressure, because the lungs offer far less resistance.";
        case "Isovolumetric relaxation": return "The ventricles <b>relax</b>. LV pressure (" + f(r.LVP) + ") fell below the aorta (" + f(r.AoP) + "); the brief backflow snapped the aortic valve shut, giving <b>S2</b> and the dicrotic notch. LV pressure is still above LA (" + f(r.LAP) + "), so the mitral valve stays shut and volume holds at " + f(r.LVV) + " mL while pressure falls.";
        case "Rapid filling": return "LV pressure (" + f(r.LVP) + ") dropped below LA pressure (" + f(r.LAP) + "), so the <b>mitral valve swings open</b> and blood that pooled in the atrium during systole rushes in. Most ventricular filling happens here, passively, before the atria ever contract.";
        default: return "<b>Diastasis.</b> LA (" + f(r.LAP) + ") and LV (" + f(r.LVP) + ") pressures have nearly equalised, so filling slows to a trickle. Venous blood keeps arriving in both atria. The next P wave will start atrial systole."; } },
    notes: "Four time-varying-elastance chambers, arterial and venous compliances and ideal one-way valves, simulated to a steady beat at 75 bpm (LV 117/4, aorta 117/78, PA 21/10 mmHg, stroke volume ≈ 70 mL, cardiac output ≈ 5.3 L/min). Ventricular contraction starts 0.12 s after the atria (the AV-node delay). Leaflets are drawn two per valve in this section; the tricuspid, pulmonary and aortic valves really have three cusps.",
  };
}
