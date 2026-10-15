/* =====================================================================
 * chemspec — the chemistry checker behind the 3D Tutor's instant builder.
 * ONE source of truth, used by the server (to reject bad AI output and retry with the errors)
 * and bundled into the app (explainer/mech3d.js) to build the 3D molecules.
 *
 * A mechanism is a list of STATES (atom-mapped SMILES) and ARROWS between consecutive states.
 * Every heavy atom carries a map number (:n) that stays the same in every state, so the app can
 * follow each atom through the reaction. Any hydrogen that moves is written as an explicit [H:n].
 *
 * Checks: SMILES parse, valences, every state has the same atoms and the same total charge,
 * hydrogens only move when mapped, and the curly arrows explain every bond that forms or breaks.
 * ===================================================================== */

export const ELEMENTS = {
  H: { ve: 1, r: 0.31, val: [1] }, B: { ve: 3, r: 0.84, val: [3] }, C: { ve: 4, r: 0.76, val: [4] }, N: { ve: 5, r: 0.71, val: [3, 5] },
  O: { ve: 6, r: 0.66, val: [2] }, F: { ve: 7, r: 0.57, val: [1] }, P: { ve: 5, r: 1.07, val: [3, 5] }, S: { ve: 6, r: 1.05, val: [2, 4, 6] },
  Cl: { ve: 7, r: 1.02, val: [1] }, Br: { ve: 7, r: 1.2, val: [1] }, I: { ve: 7, r: 1.39, val: [1] },
  Li: { ve: 1, r: 1.28, val: [1] }, Na: { ve: 1, r: 1.66, val: [1] }, K: { ve: 1, r: 2.03, val: [1] }, Mg: { ve: 2, r: 1.41, val: [2] },
  Si: { ve: 4, r: 1.11, val: [4] }, Se: { ve: 6, r: 1.2, val: [2] }, Al: { ve: 3, r: 1.21, val: [3] }, Fe: { ve: 2, r: 1.32, val: [2, 3] }, Zn: { ve: 2, r: 1.22, val: [2] },
};
const ORGANIC = ["Cl", "Br", "B", "C", "N", "O", "P", "S", "F", "I"];
const AROM = { b: "B", c: "C", n: "N", o: "O", p: "P", s: "S" };

/* ------------------------------------------------------------------ SMILES */
export function parseSmiles(smi) {
  const s = String(smi || "").trim(); if (!s) throw new Error("empty SMILES");
  const atoms = [], bonds = [], ring = {}; let i = 0, prev = -1, bondSym = null; const stack = [];
  const addBond = (a, b, sym) => {
    if (a === b) throw new Error("atom bonded to itself");
    if (bonds.some((x) => (x.a === a && x.b === b) || (x.a === b && x.b === a))) throw new Error("duplicate bond");
    const ar = atoms[a].arom && atoms[b].arom;
    const order = sym === "=" ? 2 : sym === "#" ? 3 : sym === ":" ? 1.5 : sym === "-" || sym === "/" || sym === "\\" ? 1 : ar ? 1.5 : 1;
    bonds.push({ a, b, order });
  };
  const link = (a, b, sym) => { addBond(a, b, sym); atoms[a].nb.push(b); atoms[b].nb.push(a); };
  while (i < s.length) {
    const ch = s[i];
    if (ch === "(") { if (prev < 0) throw new Error("branch before any atom"); stack.push(prev); i++; continue; }
    if (ch === ")") { if (!stack.length) throw new Error("unbalanced )"); prev = stack.pop(); i++; continue; }
    if ("-=#:/\\".includes(ch)) { bondSym = ch; i++; continue; }
    if (ch === ".") { prev = -1; bondSym = null; i++; continue; }
    if (/[0-9%]/.test(ch)) {
      let n; if (ch === "%") { n = s.slice(i + 1, i + 3); i += 3; } else { n = ch; i++; }
      if (prev < 0) throw new Error("ring number before any atom");
      if (ring[n]) { const r = ring[n]; addBond(r.atom, prev, bondSym || r.sym); atoms[r.atom].nb[r.slot] = prev; atoms[prev].nb.push(r.atom); delete ring[n]; }
      else { ring[n] = { atom: prev, sym: bondSym, slot: atoms[prev].nb.length }; atoms[prev].nb.push(-1); }
      bondSym = null; continue;
    }
    let atom;
    if (ch === "[") {
      const j = s.indexOf("]", i); if (j < 0) throw new Error("unclosed [");
      const m = /^(\d+)?([A-Z][a-z]?|[a-z][a-z]?|\*)(@@|@)?(H\d?)?([+-]+\d*|[+-]\d+)?(?::(\d+))?$/.exec(s.slice(i + 1, j));
      if (!m) throw new Error("bad bracket atom [" + s.slice(i + 1, j) + "]");
      let sym = m[2], arom = false;
      if (/^[a-z]/.test(sym)) { arom = true; sym = AROM[sym] || (sym === "se" ? "Se" : null); if (!sym) throw new Error("unknown aromatic atom " + m[2]); }
      if (!ELEMENTS[sym]) throw new Error("unsupported element " + sym);
      let charge = 0; if (m[5]) { const sg = m[5][0] === "+" ? 1 : -1; const num = m[5].replace(/[+-]/g, ""); charge = sg * (num ? +num : m[5].length); }
      atom = { el: sym, arom, charge, hx: m[4] ? (m[4].length > 1 ? +m[4].slice(1) : 1) : 0, bracket: true, chiral: m[3] || null, map: m[6] ? +m[6] : 0 };
      i = j + 1;
    } else {
      let sym = null;
      for (const o of ORGANIC) if (s.startsWith(o, i)) { sym = o; break; }
      if (!sym && AROM[ch]) { atom = { el: AROM[ch], arom: true, charge: 0, hx: 0, bracket: false, chiral: null, map: 0 }; i++; }
      else if (sym) { atom = { el: sym, arom: false, charge: 0, hx: 0, bracket: false, chiral: null, map: 0 }; i += sym.length; }
      else throw new Error("unexpected character '" + ch + "' in SMILES");
    }
    atom.nb = []; atom.hasPrev = prev >= 0; const idx = atoms.push(atom) - 1;
    if (prev >= 0) link(prev, idx, bondSym);
    bondSym = null; prev = idx;
  }
  if (stack.length) throw new Error("unbalanced (");
  if (Object.keys(ring).length) throw new Error("unclosed ring " + Object.keys(ring).join(","));
  // atom.nb keeps SMILES neighbour order for @/@@ (previous atom, ring closures, then following atoms);
  // a bracket H counts right after the previous atom (or first if there is none)
  // implicit hydrogens for organic-subset atoms
  atoms.forEach((a, k) => {
    const bsum = bonds.filter((b) => b.a === k || b.b === k).reduce((t, b) => t + (b.order === 1.5 ? 1 : b.order), 0);
    if (a.bracket) { a.h = a.hx; return; }
    const vals = ELEMENTS[a.el].val; const need = bsum + (a.arom ? 1 : 0);
    const v = vals.find((x) => x >= need); a.h = v === undefined ? 0 : Math.max(0, v - need);
  });
  return { atoms, bonds };
}

export function lonePairs(el, charge, bondSum, h) { const e = ELEMENTS[el].ve - charge - bondSum - h; return Math.max(0, Math.floor(e / 2)); }
const VALID = { // allowed (bond-order sum incl. H) per element and charge
  H: { 0: [1], 1: [0], "-1": [0] }, B: { 0: [3], "-1": [4] }, C: { 0: [4], 1: [3], "-1": [3] }, N: { 0: [3], 1: [4], "-1": [2] },
  O: { 0: [2], 1: [3], "-1": [1] }, F: { 0: [1], "-1": [0] }, Cl: { 0: [1], "-1": [0], 1: [2] }, Br: { 0: [1], "-1": [0], 1: [2] }, I: { 0: [1], "-1": [0], 1: [2] },
  S: { 0: [2, 4, 6], 1: [3], "-1": [1] }, P: { 0: [3, 5], 1: [4] }, Li: { 0: [1], 1: [0] }, Na: { 0: [1], 1: [0] }, K: { 0: [1], 1: [0] }, Mg: { 0: [2], 2: [0], 1: [1] },
};

/* ------------------------------------------------------------- one state */
export function stateGraph(smiles) {
  const g = parseSmiles(smiles), errs = [];
  g.atoms.forEach((a, k) => {
    const bs = g.bonds.filter((b) => b.a === k || b.b === k).reduce((t, b) => t + b.order, 0) + a.h;
    a.bondSum = bs - a.h;
    const ok = (VALID[a.el] || {})[a.charge];
    if (ok && !a.arom && !ok.some((v) => Math.abs(v - bs) < 0.01)) errs.push(`${a.el}${a.map ? ":" + a.map : ""} has ${bs} bonds with charge ${a.charge}`);
    if (a.el !== "H" && !a.map) errs.push(`heavy atom ${a.el} (position ${k + 1}) has no map number`);
  });
  const maps = g.atoms.filter((a) => a.map).map((a) => a.map); const dup = maps.filter((m, i) => maps.indexOf(m) !== i);
  if (dup.length) errs.push("map number used twice: " + [...new Set(dup)].join(","));
  return { g, errs, charge: g.atoms.reduce((t, a) => t + a.charge, 0) };
}
const bkey = (a, b) => (a < b ? a + "-" + b : b + "-" + a);
function bondMap(g) { const m = {}; g.bonds.forEach((b) => { const A = g.atoms[b.a].map, B = g.atoms[b.b].map; if (A && B) m[bkey(A, B)] = b.order; }); return m; }

/* -------------------------------------------------- the whole mechanism */
export function validateMechanism(spec) {
  const errors = [], warnings = [];
  if (!spec || !Array.isArray(spec.states) || spec.states.length < 2) return { ok: false, errors: ["need at least 2 states"], warnings };
  if (spec.states.length > 8) errors.push("at most 8 states");
  const parsed = spec.states.map((st, i) => {
    try { const r = stateGraph(st.smiles); r.errs.forEach((e) => errors.push(`state ${i + 1}: ${e}`)); return r; }
    catch (e) { errors.push(`state ${i + 1}: SMILES error — ${e.message}`); return null; }
  });
  if (parsed.some((p) => !p)) return { ok: false, errors, warnings };
  const inv = (g) => { const m = {}; g.atoms.forEach((a) => { if (a.map) m[a.map] = a.el; }); return m; };
  const unmappedH = (g) => { const m = {}; g.atoms.forEach((a, k) => { if (!a.map) return; let h = a.h; g.bonds.forEach((b) => { const o = b.a === k ? b.b : b.b === k ? b.a : -1; if (o >= 0 && g.atoms[o].el === "H" && !g.atoms[o].map) h++; }); m[a.map] = h; }); return m; };
  const i0 = inv(parsed[0].g), h0 = unmappedH(parsed[0].g);
  parsed.forEach((p, i) => {
    if (i === 0) return;
    const ii = inv(p.g), hh = unmappedH(p.g);
    const k0 = Object.keys(i0).sort().join(), k1 = Object.keys(ii).sort().join();
    if (k0 !== k1) errors.push(`state ${i + 1} has different map numbers from state 1 (every state must contain exactly the same mapped atoms)`);
    Object.keys(i0).forEach((m) => { if (ii[m] && ii[m] !== i0[m]) errors.push(`map ${m} is ${i0[m]} in state 1 but ${ii[m]} in state ${i + 1}`); });
    Object.keys(h0).forEach((m) => { if (m in hh && hh[m] !== h0[m] && i0[m] !== "H") errors.push(`atom :${m} has ${h0[m]} implicit H in state 1 but ${hh[m]} in state ${i + 1} — a hydrogen that moves must be written as an explicit mapped [H:n]`); });
    if (p.charge !== parsed[0].charge) errors.push(`total charge changes: ${parsed[0].charge} in state 1, ${p.charge} in state ${i + 1}`);
  });
  // arrows must explain the bond changes of each step
  const steps = Array.isArray(spec.arrows) ? spec.arrows : [];
  for (let k = 0; k < parsed.length - 1; k++) {
    const A = bondMap(parsed[k].g), B = bondMap(parsed[k + 1].g), arr = Array.isArray(steps[k]) ? steps[k] : [];
    const up = new Set(), down = new Set();
    new Set([...Object.keys(A), ...Object.keys(B)]).forEach((key) => { const a = A[key] || 0, b = B[key] || 0; if (b > a + 0.01) up.add(key); if (b < a - 0.01) down.add(key); });
    const toBond = new Set(), fromBond = new Set();
    arr.forEach((ar, j) => {
      const f = ar && ar.from, t = ar && ar.to;
      if (!Array.isArray(f) || !Array.isArray(t) || !f.length || !t.length) { errors.push(`step ${k + 1} arrow ${j + 1}: "from" and "to" must be [atom] or [atom,atom]`); return; }
      [...f, ...t].forEach((m) => { if (!i0[m]) errors.push(`step ${k + 1} arrow ${j + 1}: unknown map number ${m}`); });
      if (f.length === 2) { fromBond.add(bkey(f[0], f[1])); if (!(A[bkey(f[0], f[1])] > 0)) errors.push(`step ${k + 1} arrow ${j + 1}: starts from bond ${f[0]}-${f[1]}, which does not exist in state ${k + 1}`); }
      if (t.length === 2) toBond.add(bkey(t[0], t[1]));
    });
    up.forEach((key) => { if (!toBond.has(key)) errors.push(`step ${k + 1}: bond ${key} forms (or gains order) but no arrow points to it`); });
    down.forEach((key) => { if (!fromBond.has(key)) errors.push(`step ${k + 1}: bond ${key} breaks (or loses order) but no arrow starts from it`); });
    toBond.forEach((key) => { if (!up.has(key)) warnings.push(`step ${k + 1}: an arrow points to bond ${key} but that bond does not form`); });
    if (!up.size && !down.size) errors.push(`step ${k + 1}: nothing changes between state ${k + 1} and state ${k + 2}`);
  }
  return { ok: !errors.length, errors: [...new Set(errors)].slice(0, 20), warnings, parsed };
}

/* the bonds that change in step k (for the app: dashed bonds, camera focus, arrows) */
export function stepChanges(parsed, k) {
  const A = bondMap(parsed[k].g), B = bondMap(parsed[k + 1].g), out = [];
  new Set([...Object.keys(A), ...Object.keys(B)]).forEach((key) => { const a = A[key] || 0, b = B[key] || 0; if (Math.abs(a - b) > 0.01) out.push({ key, from: a, to: b }); });
  return out;
}
