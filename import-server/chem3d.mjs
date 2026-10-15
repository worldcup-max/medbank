/* =====================================================================
 * chem3d — builds real 3D geometry for every state of a checked mechanism.
 * Pure JS (no DOM): runs in the app to draw the molecules, and on the server to sanity-check a mechanism.
 *
 * Method: each state is relaxed from the previous state's coordinates (so atoms move as little as they must),
 * with bond lengths from covalent radii, bond angles from VSEPR (bonds + lone pairs), flat sp2 centres,
 * coplanar double bonds and aromatic rings, non-bonded repulsion, and the SMILES chirality (@/@@).
 * Because each state starts from the last, an SN2 umbrella flips by itself and a leaving group drifts away.
 * ===================================================================== */
import { ELEMENTS, stateGraph, lonePairs } from "./chemspec.mjs";

const V = { sub: (a, b) => [a[0] - b[0], a[1] - b[1], a[2] - b[2]], add: (a, b) => [a[0] + b[0], a[1] + b[1], a[2] + b[2]], mul: (a, s) => [a[0] * s, a[1] * s, a[2] * s],
  dot: (a, b) => a[0] * b[0] + a[1] * b[1] + a[2] * b[2], cross: (a, b) => [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]],
  len: (a) => Math.hypot(a[0], a[1], a[2]), norm: (a) => { const l = Math.hypot(a[0], a[1], a[2]) || 1; return [a[0] / l, a[1] / l, a[2] / l]; } };

/* a seeded random so the same mechanism always gives the same picture (and the same cache) */
function rng(seed) { let s = seed >>> 0 || 1; return () => { s ^= s << 13; s ^= s >>> 17; s ^= s << 5; return ((s >>> 0) % 100000) / 100000; }; }

/* unify atoms across states: heavy atoms + mapped H by map number, implicit H as h<map>_<i> */
function unify(states) {
  const parsed = states.map((st) => stateGraph(st.smiles).g);
  const ids = []; const index = {};
  const idOf = (g, k, hIdx) => (g.atoms[k].map ? "m" + g.atoms[k].map : null);
  // every state's per-atom explicit graph with H expanded
  const graphs = parsed.map((g) => {
    const atoms = [], bonds = [], local = {};
    g.atoms.forEach((a, k) => { if (a.map) { local[k] = "m" + a.map; atoms.push({ id: "m" + a.map, el: a.el, charge: a.charge, chiral: a.chiral, nb: a.nb, hasPrev: a.hasPrev, h: a.h, k }); } });
    const hCount = {};
    g.atoms.forEach((a, k) => { if (!a.map && a.el === "H") { const nbk = a.nb.find((x) => x >= 0); const parent = g.atoms[nbk]; const pid = "m" + parent.map; hCount[pid] = (hCount[pid] || 0); const id = "h" + parent.map + "_" + hCount[pid]++; local[k] = id; atoms.push({ id, el: "H", charge: 0, parent: pid }); } });
    atoms.filter((a) => a.id[0] === "m").forEach((a) => { for (let i = 0; i < a.h; i++) { const id = "h" + a.id.slice(1) + "_" + (hCount[a.id] = (hCount[a.id] || 0)) ; hCount[a.id]++; atoms.push({ id, el: "H", charge: 0, parent: a.id, implicitOf: true }); bonds.push({ a: a.id, b: id, order: 1 }); } });
    g.bonds.forEach((b) => bonds.push({ a: local[b.a], b: local[b.b], order: b.order }));
    return { atoms, bonds, g, local };
  });
  graphs[0].atoms.forEach((a) => { index[a.id] = ids.length; ids.push({ id: a.id, el: a.el }); });
  return { parsed, graphs, ids, index };
}

const covR = (el) => (ELEMENTS[el] || ELEMENTS.C).r;
function bondLen(e1, e2, order) { const r = covR(e1) + covR(e2); return order >= 3 ? r * 0.78 : order >= 2 ? r * 0.87 : order > 1 ? r * 0.92 : r; }
const ANG = { 4: 109.5, 3: 120, 2: 180, 1: 180 };

/* constraints of one state */
function constraints(G, index, N) {
  const nbr = Array.from({ length: N }, () => []);
  const bonds = G.bonds.map((b) => { const i = index[b.a], j = index[b.b]; nbr[i].push(j); nbr[j].push(i); return { i, j, order: b.order }; });
  const el = []; G.atoms.forEach((a) => { el[index[a.id]] = a; });
  const dist = [], bonded = new Set(), near = new Set(), key = (i, j) => (i < j ? i * 10000 + j : j * 10000 + i);
  bonds.forEach((b) => { dist.push([b.i, b.j, bondLen(el[b.i].el, el[b.j].el, b.order), 1]); bonded.add(key(b.i, b.j)); });
  const lp = [], planar = [];
  for (let c = 0; c < N; c++) {
    const a = el[c], ns = nbr[c]; const bsum = bonds.filter((b) => b.i === c || b.j === c).reduce((t, b) => t + b.order, 0);
    lp[c] = a.el === "H" ? 0 : lonePairs(a.el, a.charge, bsum, 0);
    const multi = bonds.some((b) => (b.i === c || b.j === c) && b.order > 1);
    let sn = ns.length + lp[c]; if (multi && lp[c] > 0 && ns.length <= 2) sn = Math.min(sn, 3);   // amide N / enolate O conjugate → trigonal
    if (multi && ns.length === 3) sn = 3;
    const triple = bonds.some((b) => (b.i === c || b.j === c) && b.order >= 3), dbl = bonds.filter((b) => (b.i === c || b.j === c) && b.order === 2).length;
    const ang = ns.length === 2 && lp[c] === 0 && (triple || dbl === 2) ? 180 : (ANG[Math.max(2, Math.min(4, sn))] || 109.5);
    for (let x = 0; x < ns.length; x++) for (let y = x + 1; y < ns.length; y++) {
      const i = ns[x], j = ns[y]; const bi = dist.find((d) => key(d[0], d[1]) === key(c, i)), bj = dist.find((d) => key(d[0], d[1]) === key(c, j));
      const l1 = bi[2], l2 = bj[2], th = (ang * Math.PI) / 180; dist.push([i, j, Math.sqrt(l1 * l1 + l2 * l2 - 2 * l1 * l2 * Math.cos(th)), 0.5]); near.add(key(i, j));
    }
    if (ns.length === 3 && sn === 3) planar.push([c, ns[0], ns[1], ns[2]]);
  }
  // double/aromatic bonds keep their substituents coplanar (cis or trans, whichever is closer)
  const dihedral = [];
  bonds.filter((b) => b.order > 1 && b.order < 3).forEach((b) => {
    nbr[b.i].filter((x) => x !== b.j).forEach((si) => nbr[b.j].filter((x) => x !== b.i).forEach((sj) => {
      const l = bondLen(el[b.i].el, el[b.j].el, b.order), l1 = bondLen(el[b.i].el, el[si].el, 1), l2 = bondLen(el[b.j].el, el[sj].el, 1);
      const sa = [l1 * Math.cos(2.094), l1 * Math.sin(2.094)], cis = [l + l2 * Math.cos(1.047), l2 * Math.sin(1.047)], tr = [l + l2 * Math.cos(-1.047), -l2 * Math.sin(1.047)];
      dihedral.push([si, sj, Math.hypot(cis[0] - sa[0], cis[1] - sa[1]), Math.hypot(tr[0] - sa[0], tr[1] - sa[1]), b.i, b.j]); near.add(key(si, sj));
    }));
  });
  // chirality from SMILES (@ → signed volume < 0 with the SMILES neighbour order)
  const chiral = [];
  G.atoms.forEach((a) => {
    if (!a.chiral || a.id[0] !== "m") return; const c = index[a.id];
    const order = a.nb.filter((k) => k >= 0).map((k) => index[G.local[k]]);
    if (a.h === 1) { const hid = index["h" + a.id.slice(1) + "_0"]; order.splice(a.hasPrev ? 1 : 0, 0, hid); }
    if (order.length === 4) chiral.push([c, order, a.chiral === "@" ? -1 : 1]);
  });
  const frag = []; let f = 0; const seen = new Array(N).fill(-1);
  for (let s = 0; s < N; s++) { if (seen[s] >= 0) continue; const st = [s]; seen[s] = f; while (st.length) { const u = st.pop(); nbr[u].forEach((v) => { if (seen[v] < 0) { seen[v] = f; st.push(v); } }); } f++; }
  return { bonds, nbr, dist, bonded, near, key, lp, planar, dihedral, chiral, frag: seen, nfrag: f, el };
}

function signedVol(P, o) { const [a, b, c, d] = o.map((i) => P[i]); return V.dot(V.sub(b, a), V.cross(V.sub(c, a), V.sub(d, a))); }

/* position-based relaxation */
function relax(P, C, N, iters, opts = {}) {
  const { key, bonded, near } = C, heavy = (i) => C.el[i].el !== "H";
  for (let it = 0; it < iters; it++) {
    const w = 0.5;
    C.dist.forEach(([i, j, d0, k]) => { const d = V.sub(P[j], P[i]); const l = V.len(d) || 1e-6; const c = ((l - d0) / l) * 0.5 * k * w; P[i] = V.add(P[i], V.mul(d, c)); P[j] = V.sub(P[j], V.mul(d, c)); });
    C.dihedral.forEach(([i, j, dc, dt, a, b]) => {
      const n1 = V.cross(V.sub(P[a], P[i]), V.sub(P[b], P[a])), n2 = V.cross(V.sub(P[b], P[a]), V.sub(P[j], P[b]));
      const target = V.dot(n1, n2) >= 0 ? dc : dt; const d = V.sub(P[j], P[i]); const l = V.len(d) || 1e-6; const c = ((l - target) / l) * 0.25;
      P[i] = V.add(P[i], V.mul(d, c)); P[j] = V.sub(P[j], V.mul(d, c));
    });
    C.planar.forEach(([c, a, b, d]) => { const n = V.norm(V.cross(V.sub(P[b], P[a]), V.sub(P[d], P[a]))); const off = V.dot(V.sub(P[c], P[a]), n); P[c] = V.sub(P[c], V.mul(n, off * 0.6)); });
    if (opts.chiral !== false) C.chiral.forEach(([c, o, sign]) => {   // signed-volume constraint (gradient projection)
      const [a, b, cc, d] = o.map((i) => P[i]); const ba = V.sub(b, a), ca = V.sub(cc, a), da = V.sub(d, a);
      const vol = V.dot(ba, V.cross(ca, da)), target = sign * 2.2; if (vol * sign >= 2.0) return;
      const gb = V.cross(ca, da), gc = V.cross(da, ba), gd = V.cross(ba, ca), ga = V.mul(V.add(V.add(gb, gc), gd), -1);
      const g = [ga, gb, gc, gd], den = g.reduce((t, x) => t + V.dot(x, x), 0) || 1e-6, lam = ((vol - target) / den) * 0.5;
      o.forEach((i, n) => { P[i] = V.sub(P[i], V.mul(g[n], lam)); });
    });
    // non-bonded repulsion (and keep separate molecules apart)
    for (let i = 0; i < N; i++) for (let j = i + 1; j < N; j++) {
      const kk = key(i, j); if (bonded.has(kk) || near.has(kk)) continue;
      const other = C.frag[i] !== C.frag[j]; const rmin = other ? (heavy(i) && heavy(j) ? 3.2 : 2.6) : (heavy(i) && heavy(j) ? 2.5 : heavy(i) || heavy(j) ? 2.1 : 1.8);
      const d = V.sub(P[j], P[i]); const l = V.len(d); if (l >= rmin) continue; const c = ((l - rmin) / (l || 1e-6)) * 0.25;
      P[i] = V.add(P[i], V.mul(d, c)); P[j] = V.sub(P[j], V.mul(d, c));
    }
    (opts.keepApart || []).forEach(([i, j, dmin]) => { const d = V.sub(P[j], P[i]); const l = V.len(d) || 1e-6; if (l >= dmin) return; const c = ((l - dmin) / l) * 0.3; P[i] = V.add(P[i], V.mul(d, c)); P[j] = V.sub(P[j], V.mul(d, c)); });
  }
  return P;
}
function violation(P, C) { let e = 0; C.dist.forEach(([i, j, d0, k]) => { const l = V.len(V.sub(P[j], P[i])); e += k * (l - d0) ** 2; }); return e; }

/* first placement of one molecule: grow from a root along ideal directions */
function seedFragment(P, C, atomsInFrag, origin, rand) {
  const root = atomsInFrag[0]; P[root] = origin.slice(); const placed = new Set([root]); const q = [root];
  while (q.length) {
    const u = q.shift(); const kids = C.nbr[u].filter((v) => !placed.has(v)); if (!kids.length) continue;
    const par = C.nbr[u].find((v) => placed.has(v) && v !== u);
    const axis = par !== undefined ? V.norm(V.sub(P[u], P[par])) : V.norm([rand() - 0.5, rand() - 0.5, rand() - 0.5]);
    const ref = Math.abs(axis[2]) < 0.9 ? [0, 0, 1] : [0, 1, 0], e1 = V.norm(V.cross(axis, ref)), e2 = V.cross(axis, e1);
    const tw = rand() * 6.283, n = kids.length;
    kids.forEach((v, k) => {
      const ps = tw + (k * 6.283) / n, cone = par !== undefined ? 0.94 : 0;
      const dir = V.norm(V.add(V.mul(axis, par !== undefined ? 0.334 : 1), V.add(V.mul(e1, Math.cos(ps) * (cone || 1)), V.mul(e2, Math.sin(ps) * (cone || 1)))));
      const b = C.bonds.find((x) => (x.i === u && x.j === v) || (x.j === u && x.i === v));
      P[v] = V.add(P[u], V.mul(dir, bondLen(C.el[u].el, C.el[v].el, b ? b.order : 1))); placed.add(v); q.push(v);
    });
  }
}
function centroid(P, list) { const c = [0, 0, 0]; list.forEach((i) => { c[0] += P[i][0]; c[1] += P[i][1]; c[2] += P[i][2]; }); return V.mul(c, 1 / Math.max(1, list.length)); }
function rotateFrag(P, list, about, from, to) {   // rotate so unit vector `from` turns into `to` (Rodrigues)
  const k = V.cross(from, to), s = V.len(k), c = V.dot(from, to); if (s < 1e-6) { if (c > 0) return; const ax = V.norm(V.cross(from, Math.abs(from[0]) < 0.9 ? [1, 0, 0] : [0, 1, 0])); list.forEach((i) => { const p = V.sub(P[i], about); const pr = V.sub(V.mul(ax, 2 * V.dot(ax, p)), p); P[i] = V.add(about, pr); }); return; }
  const ku = V.mul(k, 1 / s), th = Math.atan2(s, c);
  list.forEach((i) => { const p = V.sub(P[i], about); const r = V.add(V.add(V.mul(p, Math.cos(th)), V.mul(V.cross(ku, p), Math.sin(th))), V.mul(ku, V.dot(ku, p) * (1 - Math.cos(th)))); P[i] = V.add(about, r); });
}
const openDir = (P, C, i, avoid) => {   // direction from atom i that points away from its neighbours (and from a bond being broken)
  if (avoid !== undefined) return V.norm(V.sub(P[i], P[avoid]));
  const ns = C.nbr[i]; if (!ns.length) return [1, 0, 0];
  const c = centroid(P, ns); let d = V.sub(P[i], c);
  if (V.len(d) < 0.2 && ns.length >= 2) d = V.cross(V.sub(P[ns[0]], P[i]), V.sub(P[ns[1]], P[i]));   // flat centre → attack from the face
  return V.norm(d);
};

/* --------------------------------------------------------- the builder */
export function buildMechanism3D(spec) {
  const U = unify(spec.states), N = U.ids.length, rand = rng(N * 7919 + spec.states.length);
  const Cs = U.graphs.map((G) => constraints(G, U.index, N));
  const arrows = spec.arrows || [];
  const idx = (m) => U.index["m" + m];
  let P = Array.from({ length: N }, () => [0, 0, 0]);
  // state 1: build each molecule, then place partners so the first arrows can happen (backside / face attack)
  const C0 = Cs[0], frags = {}; C0.frag.forEach((f, i) => (frags[f] = frags[f] || []).push(i));
  const order = Object.keys(frags).sort((a, b) => frags[b].length - frags[a].length);
  let best = null;
  for (let attempt = 0; attempt < 3; attempt++) {
    const Q = Array.from({ length: N }, () => [0, 0, 0]);
    order.forEach((f, n) => { const list = frags[f].slice().sort((a, b) => (C0.el[a].el === "H") - (C0.el[b].el === "H")); seedFragment(Q, C0, list, [n * 9, 0, 0], rand); });
    relax(Q, C0, N, 260);
    const v = violation(Q, C0); if (!best || v < best.v) best = { v, Q };
  }
  P = best.Q;
  const placed = new Set([order[0]]);
  // first bond each molecule makes with another decides where it waits
  for (let k = 0; k < Cs.length - 1 && placed.size < order.length; k++) {
    (arrows[k] || []).forEach((ar) => {
      if (!Array.isArray(ar.to) || ar.to.length !== 2) return;
      const a = idx(ar.to[0]), b = idx(ar.to[1]); if (a === undefined || b === undefined) return;
      const fa = String(C0.frag[a]), fb = String(C0.frag[b]); if (fa === fb) return;
      let mover = placed.has(fa) && !placed.has(fb) ? b : !placed.has(fa) && placed.has(fb) ? a : (placed.has(fa) ? null : b);
      if (mover === null) return; const anchor = mover === a ? b : a, fm = String(C0.frag[mover]);
      const breaking = (arrows[k] || []).find((x) => Array.isArray(x.from) && x.from.length === 2 && (idx(x.from[0]) === anchor || idx(x.from[1]) === anchor));
      const leaving = breaking ? (idx(breaking.from[0]) === anchor ? idx(breaking.from[1]) : idx(breaking.from[0])) : undefined;
      const dir = openDir(P, C0, anchor, leaving);
      const target = V.add(P[anchor], V.mul(dir, 3.4));
      const list = frags[fm]; const lone = openDir(P, C0, mover);
      rotateFrag(P, list, P[mover], lone, V.mul(dir, -1));
      const shift = V.sub(target, P[mover]); list.forEach((i) => { P[i] = V.add(P[i], shift); });
      placed.add(fm);
    });
  }
  // molecules that never react sit to one side
  order.forEach((f, n) => { if (placed.has(f)) return; const c = centroid(P, frags[order[0]]); const off = V.add(c, [0, -5.5 - n, 2]); const cc = centroid(P, frags[f]); const s = V.sub(off, cc); frags[f].forEach((i) => { P[i] = V.add(P[i], s); }); placed.add(f); });
  relax(P, C0, N, 120);
  const frames = [P.map((p) => p.slice())], warnings = [];
  for (let k = 1; k < Cs.length; k++) {
    const Ck = Cs[k], Q = frames[k - 1].map((p) => p.slice());
    // bonds broken in this step: push the pieces apart
    const keepApart = [];
    Cs[k - 1].bonds.forEach((b) => { if (!Ck.bonded.has(Ck.key(b.i, b.j)) && Ck.frag[b.i] !== Ck.frag[b.j]) keepApart.push([b.i, b.j, 3.6]); });
    relax(Q, Ck, N, 260, { chiral: false, keepApart });
    Ck.chiral.forEach(([c, o, sign]) => { if (signedVol(Q, o) * sign < 0) warnings.push(`state ${k + 1}: the motion gives the opposite configuration at atom ${U.ids[c].id.slice(1)} from the one written (check retention vs inversion)`); });
    relax(Q, Ck, N, 160, { keepApart });
    frames.push(Q);
  }
  // centre the whole movie on the reacting atoms
  const all = []; frames.forEach((F) => F.forEach((p, i) => { if (U.ids[i].el !== "H") all.push(p); }));
  const c = all.reduce((t, p) => V.add(t, p), [0, 0, 0]).map((x) => x / all.length);
  frames.forEach((F) => F.forEach((p, i) => { F[i] = V.sub(p, c); }));
  return {
    atoms: U.ids.map((a, i) => ({ id: a.id, el: a.el, map: a.id[0] === "m" ? +a.id.slice(1) : 0 })),
    frames,
    states: Cs.map((C, k) => ({
      bonds: C.bonds.map((b) => ({ i: b.i, j: b.j, order: b.order })),
      charge: C.el.map((a) => a.charge || 0), lp: C.lp, name: spec.states[k].name || "",
    })),
    warnings,
  };
}
