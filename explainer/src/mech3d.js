/* MedBank · 3D Tutor (mechanism engine)
 * A topic's organic mechanism, played as real 3D molecules with narration, the mechanism figure in sync,
 * an energy profile and live readouts. Geometry is computed from bond lengths and angles (Å), so the
 * umbrella inversion, the trigonal-bipyramidal transition state and the R/S label are physically right.
 *
 *   window.MBMech.mount(hostElement, {
 *     template: "sn2",
 *     lesson:   { lg, lines, steps:{ id:{say} }, quiz:{say,answer}, personal:true }   // optional, from POST /explainer
 *     speak:    (text, done) => {}   // app voice (voiceSpeak). text === null means "stop".
 *     warm:     (lines) => {}        // pre-buy narration clips
 *   }) → { setLesson(lesson), destroy() }
 *
 * Build: see explainer/README.md (esbuild bundles three.js in; the app loads explainer/mech3d.js lazily). */
import * as THREE from "three";
import { RoomEnvironment } from "three/examples/jsm/environments/RoomEnvironment.js";
import { SN2 } from "./sn2.js";
import { CSS } from "./ui.js";

const TEMPLATES = { sn2: SN2 };
const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
const smooth = (t) => { t = clamp(t, 0, 1); return t * t * (3 - 2 * t); };
const V = (x, y, z) => new THREE.Vector3(x, y, z);
const esc = (s) => String(s == null ? "" : s).replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));
function kf(s, keys) {
  if (s <= keys[0][0]) return keys[0][1];
  for (let i = 0; i < keys.length - 1; i++) { const [s0, v0] = keys[i], [s1, v1] = keys[i + 1]; if (s <= s1) return v0 + (v1 - v0) * smooth((s - s0) / (s1 - s0)); }
  return keys[keys.length - 1][1];
}
const ELEM = { C: { r: 0.36, c: 0x3a3f4b }, H: { r: 0.23, c: 0xf2f3f5 }, O: { r: 0.36, c: 0xff3b3b },
  Br: { r: 0.5, c: 0xa5402e, bond: 1.94 }, Cl: { r: 0.42, c: 0x22b35a, bond: 1.79 }, I: { r: 0.56, c: 0x8a3fb0, bond: 2.14 } };



function mount(host, opts) {
  opts = opts || {};
  const T = TEMPLATES[opts.template || "sn2"]; if (!T) throw new Error("unknown 3D template " + opts.template);
  if (!document.getElementById("mbx-css")) { const st = document.createElement("style"); st.id = "mbx-css"; st.textContent = CSS; document.head.appendChild(st); }
  let lesson = null, X = "Br";
  host.innerHTML = `<div class="mbx">
    <div class="mbx-stage"><canvas></canvas><div class="mbx-labels"></div>
      <div class="mbx-hud"><div class="mbx-chip"><small data-r="stepn">3D Tutor</small><b data-r="stept">${esc(T.title)}</b></div>
        <div class="mbx-chip mbx-energy"><small>Energy profile</small><svg viewBox="0 0 224 116"><line x1="14" y1="104" x2="214" y2="104" stroke="#3a3f58"/><line x1="14" y1="104" x2="14" y2="8" stroke="#3a3f58"/>
          <path data-r="ecurve" fill="none" stroke="#8fb2ff" stroke-width="2.2"/><text x="16" y="113" font-size="9" fill="#6b7086">reactants</text><text x="172" y="113" font-size="9" fill="#6b7086">products</text>
          <text data-r="ets" x="104" y="20" font-size="13" fill="#ffc040">‡</text><circle data-r="edot" r="5.5" fill="#ffc040" stroke="#fff" stroke-width="1.5"/></svg></div></div>
      <div class="mbx-meters"><div class="mbx-chip"><div class="mbx-bar"><span>C–O</span><i><em data-r="bo"></em></i></div><div class="mbx-bar"><span data-r="bxl">C–Br</span><i><em data-r="bb"></em></i></div></div>
        <div class="mbx-chip" style="text-align:center"><small>Config</small><b class="mbx-cfg" data-r="cfg">(S)</b></div></div>
      <div class="mbx-badge" data-r="badge">Drag to turn · pinch to zoom</div></div>
    <div class="mbx-card"><div class="mbx-cap" data-r="cap"></div>
      <div class="mbx-quiz" data-r="quiz" hidden><button data-r="revealbtn">Tap to reveal</button><div class="mbx-reveal" data-r="reveal" hidden></div></div>
      <div class="mbx-ctl"><button class="mbx-play" data-r="play">▶ Start the lesson</button><button data-r="prev" aria-label="Previous step">◀</button><button data-r="next" aria-label="Next step">▶</button>
        <span class="sp"></span><button data-r="slow">Slow motion</button><button data-r="mute" aria-label="Mute">🔊</button></div>
      <div class="mbx-chaps" data-r="chaps" style="margin-top:10px"></div></div>
    <div class="mbx-card"><h4>Mechanism figure</h4><div data-r="fig"></div></div>
    <div class="mbx-cols"><div class="mbx-card"><h4>Key to the figure</h4><ul class="mbx-key" data-r="key"></ul></div>
      <div class="mbx-card"><h4 data-r="lineshd">Key points</h4><ol class="mbx-lines" data-r="lines"></ol></div></div>
    <div class="mbx-legend"><span><em style="background:#3a3f4b;border:1px solid #777"></em>C</span><span><em style="background:#f2f3f5;border:1px solid #bbb"></em>H</span><span><em style="background:#ff3b3b"></em>O</span><span><em data-r="lgdot" style="background:#a5402e"></em><span data-r="lgname">Br</span></span><span><em style="background:#ffc040"></em>bond forming / breaking · being explained</span></div>
  </div>`;
  const R = {}; host.querySelectorAll("[data-r]").forEach((e) => R[e.dataset.r] = e);
  const stage = host.querySelector(".mbx-stage"), canvas = stage.querySelector("canvas"), labelsEl = stage.querySelector(".mbx-labels");
  const still = matchMedia("(prefers-reduced-motion: reduce)");

  /* renderer */
  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true });
  renderer.setPixelRatio(Math.min(2, window.devicePixelRatio || 1));
  renderer.outputColorSpace = THREE.SRGBColorSpace; renderer.toneMapping = THREE.NeutralToneMapping; renderer.toneMappingExposure = 1.05;
  const scene = new THREE.Scene();
  const pmrem = new THREE.PMREMGenerator(renderer); scene.environment = pmrem.fromScene(new RoomEnvironment(), 0.04).texture; scene.environmentIntensity = 0.75;
  const camera = new THREE.PerspectiveCamera(34, 1, 0.1, 200);
  scene.add(new THREE.HemisphereLight(0xffffff, 0x283044, 0.8));
  const key = new THREE.DirectionalLight(0xffffff, 1.8); key.position.set(-4, 8, 9); scene.add(key);
  const rim = new THREE.DirectionalLight(0x8fb2ff, 1.2); rim.position.set(6, 2, -8); scene.add(rim);

  /* atoms & bonds */
  const sphereGeo = new THREE.SphereGeometry(1, 40, 28), cylGeo = new THREE.CylinderGeometry(1, 1, 1, 18, 1);
  const mol = new THREE.Group(); scene.add(mol);
  let atoms = {}, bonds = [], mode = "";
  const elOf = (id) => atoms[id].e;
  function atomMat(e) { return new THREE.MeshPhysicalMaterial({ color: ELEM[e].c, roughness: e === "H" ? 0.35 : 0.3, clearcoat: 0.6, clearcoatRoughness: 0.2, emissive: 0xffb000, emissiveIntensity: 0 }); }
  function addAtom(id, e) { const m = new THREE.Mesh(sphereGeo, atomMat(e)); m.scale.setScalar(ELEM[e].r); mol.add(m); atoms[id] = { id, e, m, p: new THREE.Vector3() }; }
  function addBond(a, b, strength) {
    const half = [a, b].map((id) => new THREE.Mesh(cylGeo, new THREE.MeshPhysicalMaterial({ color: ELEM[elOf(id)].c, roughness: 0.35, clearcoat: 0.4 })));
    half.forEach((h) => mol.add(h));
    const dashMat = new THREE.MeshBasicMaterial({ color: 0xffc040, transparent: true }), dashes = [];
    if (strength) for (let i = 0; i < 5; i++) { const d = new THREE.Mesh(cylGeo, dashMat); mol.add(d); dashes.push(d); }
    bonds.push({ a, b, strength, half, dashes, dashMat });
  }
  const UP = V(0, 1, 0), _d = new THREE.Vector3();
  function placeStick(mesh, p0, p1, r) { _d.subVectors(p1, p0); const len = _d.length(); mesh.position.addVectors(p0, p1).multiplyScalar(0.5); mesh.quaternion.setFromUnitVectors(UP, _d.normalize()); mesh.scale.set(r, len, r); }
  function disposeMol() { mol.traverse((o) => { if (o.material) o.material.dispose(); if (o.geometry && o.geometry !== sphereGeo && o.geometry !== cylGeo) o.geometry.dispose(); }); mol.clear(); }
  function buildMolecule(m) {
    disposeMol(); atoms = {}; bonds = []; mode = m;
    addAtom("C2", "C"); addAtom("O", "O"); addAtom("X", X); addAtom("HO", "H");
    const groups = m === "tert" ? [["Me1", "Me"], ["Me2", "Me"], ["Me3", "Me"]] : [["Me", "Me"], ["H2", "H"], ["Et", "Et"]];
    groups.forEach(([g, t]) => {
      if (t === "H") { addAtom(g, "H"); addBond("C2", g); }
      if (t === "Me") { addAtom(g + "C", "C"); addBond("C2", g + "C"); for (let i = 0; i < 3; i++) { addAtom(g + "H" + i, "H"); addBond(g + "C", g + "H" + i); } }
      if (t === "Et") { addAtom("EtC", "C"); addAtom("EtC2", "C"); addBond("C2", "EtC"); addBond("EtC", "EtC2");
        for (let i = 0; i < 2; i++) { addAtom("EtH" + i, "H"); addBond("EtC", "EtH" + i); } for (let i = 0; i < 3; i++) { addAtom("EtC2H" + i, "H"); addBond("EtC2", "EtC2H" + i); } }
    });
    addBond("O", "HO"); addBond("C2", "X", "CX"); addBond("C2", "O", "CO");
    buildExtras();
  }
  function children(axis, n, twist) {
    const ref = Math.abs(axis.z) < 0.9 ? V(0, 0, 1) : V(0, 1, 0), u = new THREE.Vector3().crossVectors(axis, ref).normalize(), v = new THREE.Vector3().crossVectors(axis, u);
    const out = []; for (let k = 0; k < n; k++) { const ps = twist + k * Math.PI * 2 / n; out.push(axis.clone().multiplyScalar(0.334).addScaledVector(u, 0.943 * Math.cos(ps)).addScaledVector(v, 0.943 * Math.sin(ps)).normalize()); }
    return out;
  }
  const GEO = {};
  function geometry(s) {
    const tert = mode === "tert", P = (id, v) => atoms[id] && atoms[id].p.copy(v), b0 = ELEM[X].bond;
    const dO = tert ? kf(s, [[0, 6.6], [0.42, 3.4], [0.5, 3.15], [0.6, 3.5], [1, 6.6]]) : kf(s, [[0, 6.6], [0.3, 3.2], [0.5, 2.05], [0.66, 1.6], [0.8, 1.43], [1, 1.43]]);
    const dX = tert ? b0 + 0.03 : kf(s, [[0, b0], [0.3, b0 + 0.03], [0.5, b0 + 0.44], [0.66, b0 + 1.16], [0.82, b0 + 2.36], [1, b0 + 3.86]]);
    const cx = tert ? -0.334 : -0.334 * Math.cos(Math.PI * smooth((s - 0.22) / 0.56)), r = Math.sqrt(1 - cx * cx);
    P("C2", V(0, 0, 0)); P("X", V(dX, 0, 0)); P("O", V(-dO, 0, 0));
    const hDir = V(-0.33, 0.94 * Math.cos(1.05), 0.94 * Math.sin(1.05)).normalize(); P("HO", atoms.O.p.clone().addScaledVector(hDir, 0.96));
    const dirs = { Me: 0, H2: 2 * Math.PI / 3, Et: 4 * Math.PI / 3, Me1: 0, Me2: 2 * Math.PI / 3, Me3: 4 * Math.PI / 3 };
    Object.entries(dirs).forEach(([g, phi]) => {
      const d = V(cx, r * Math.cos(phi), r * Math.sin(phi));
      if (g === "H2" && atoms.H2) P("H2", d.clone().multiplyScalar(1.09));
      if (g.startsWith("Me") && atoms[g + "C"]) { const c = d.clone().multiplyScalar(1.53); P(g + "C", c); children(d, 3, 0.5 + phi).forEach((cd, i) => P(g + "H" + i, c.clone().addScaledVector(cd, 1.09))); }
      if (g === "Et" && atoms.EtC) { const c = d.clone().multiplyScalar(1.53); P("EtC", c); const ch = children(d, 3, 0.9);
        const c2 = c.clone().addScaledVector(ch[0], 1.53); P("EtC2", c2); P("EtH0", c.clone().addScaledVector(ch[1], 1.09)); P("EtH1", c.clone().addScaledVector(ch[2], 1.09));
        children(ch[0], 3, 0.3).forEach((cd, i) => P("EtC2H" + i, c2.clone().addScaledVector(cd, 1.09))); }
    });
    GEO.dO = dO; GEO.sCX = tert ? 1 : kf(s, [[0, 1], [0.32, 1], [0.5, 0.5], [0.7, 0]]); GEO.sCO = tert ? 0 : kf(s, [[0, 0], [0.32, 0], [0.5, 0.5], [0.7, 1]]);
  }
  // R/S read off the actual 3D coordinates (priorities: X or OH > ethyl > methyl > H)
  function configuration() {
    if (mode === "tert" || (GEO.sCO > 0.38 && GEO.sCO < 0.62)) return "";   // flat at the transition state: neither R nor S
    const c = atoms.C2.p, top = GEO.sCO > 0.5 ? atoms.O.p : atoms.X.p;
    const a = top.clone().sub(c), b = atoms.EtC.p.clone().sub(c), cc = atoms.MeC.p.clone().sub(c), d = atoms.H2.p.clone().sub(c);
    return new THREE.Vector3().crossVectors(b.clone().sub(a), cc.clone().sub(b)).dot(d) > 0 ? "R" : "S";
  }
  function layout() {
    Object.values(atoms).forEach((a) => a.m.position.copy(a.p));
    bonds.forEach((b) => {
      const p0 = atoms[b.a].p, p1 = atoms[b.b].p, mid = p0.clone().lerp(p1, 0.5), st = b.strength ? (b.strength === "CX" ? GEO.sCX : GEO.sCO) : 1;
      const solid = st > 0.92, dashed = st > 0.06 && !solid;
      b.half.forEach((h, i) => { h.visible = solid; if (solid) placeStick(h, i ? mid : p0, i ? p1 : mid, 0.1); });
      b.dashes.forEach((d, i) => { d.visible = dashed; if (dashed) placeStick(d, p0.clone().lerp(p1, (i + 0.15) / 5), p0.clone().lerp(p1, (i + 0.65) / 5), 0.065); });
      b.dashMat.opacity = 0.35 + 0.65 * Math.sin(Math.PI * st);
    });
  }

  /* orbitals, lone pairs, curly arrows, van der Waals shells */
  let sigma, lps = [], arrows = [], vdw = [];
  function lobe(color, op) { return new THREE.Mesh(sphereGeo, new THREE.MeshPhysicalMaterial({ color, transparent: true, opacity: op, roughness: 0.2, clearcoat: 1, depthWrite: false, side: THREE.DoubleSide, emissive: color, emissiveIntensity: 0.25 })); }
  function buildExtras() {
    sigma = new THREE.Group(); const big = lobe(0xffc040, 0.38), small = lobe(0x4f8dff, 0.38);
    big.scale.set(0.95, 0.62, 0.62); big.position.set(-0.95, 0, 0); small.scale.set(0.42, 0.36, 0.36); small.position.set(0.52, 0, 0); sigma.add(big, small); mol.add(sigma);
    lps = [0, 1, 2].map(() => { const l = lobe(0x7fd3ff, 0.32); l.scale.set(0.22, 0.22, 0.42); mol.add(l); return l; });
    arrows = [0, 1].map(() => { const g = new THREE.Group(), mat = new THREE.MeshBasicMaterial({ color: 0xffc040, transparent: true });
      const tube = new THREE.Mesh(new THREE.BufferGeometry(), mat), head = new THREE.Mesh(new THREE.ConeGeometry(0.16, 0.42, 16), mat);
      const e1 = new THREE.Mesh(sphereGeo, new THREE.MeshBasicMaterial({ color: 0xffffff })), e2 = new THREE.Mesh(sphereGeo, e1.material); e1.scale.setScalar(0.085); e2.scale.setScalar(0.085);
      g.add(tube, head, e1, e2); mol.add(g); return { g, tube, head, e1, e2, mat }; });
    vdw = []; Object.values(atoms).forEach((a) => { if (a.e === "H" && a.id !== "HO") { const s = lobe(0x9fb4ff, 0.07); s.scale.setScalar(1.1); s.userData.a = a.id; mol.add(s); vdw.push(s); } });
  }
  function setArrow(ar, from, to, lift, show) {
    ar.g.visible = show > 0.01; if (!ar.g.visible) return;
    const curve = new THREE.QuadraticBezierCurve3(from, from.clone().lerp(to, 0.5).add(lift), to);
    ar.tube.geometry.dispose(); ar.tube.geometry = new THREE.TubeGeometry(curve, 40, 0.05, 8, false);
    ar.head.position.copy(curve.getPoint(1)); ar.head.quaternion.setFromUnitVectors(UP, curve.getTangent(1));
    ar.mat.opacity = show; const t = (performance.now() / 1300) % 1;
    ar.e1.position.copy(curve.getPoint(t)).add(V(0, 0.07, 0)); ar.e2.position.copy(curve.getPoint(t)).add(V(0, -0.07, 0));
  }
  function extras(s, st) {
    const tert = mode === "tert", c = atoms.C2.p, O = atoms.O.p;
    const sv = st.sigma && !tert ? clamp(1 - (s - 0.36) / 0.12, 0, 1) : 0; sigma.visible = sv > 0.01; sigma.children.forEach((m) => m.material.opacity = 0.38 * sv); sigma.position.copy(c);
    const hDir = atoms.HO.p.clone().sub(O).normalize(); let best = 0, bd = -9;
    for (let k = 0; k < 36; k++) { const d = children(hDir.clone().negate(), 3, k / 36 * 2.094)[0]; if (d.x > bd) { bd = d.x; best = k / 36 * 2.094; } }
    const lv = st.lp ? clamp(1 - (GEO.sCO - 0.2) / 0.3, 0, 1) : 0;
    children(hDir.clone().negate(), 3, best).forEach((d, i) => { const l = lps[i]; l.visible = lv > 0.01; l.position.copy(O).addScaledVector(d, 0.52); l.quaternion.setFromUnitVectors(V(0, 0, 1), d);
      l.material.opacity = 0.34 * lv; l.material.color.set(i === 0 && s > 0.12 && st.arrows ? 0xffc040 : 0x7fd3ff); l.material.emissive.copy(l.material.color); });
    const a1 = st.arrows && st.arrows.includes(1) && !tert ? clamp((0.56 - s) / 0.08, 0, 1) : 0, a2 = st.arrows && st.arrows.includes(2) && !tert ? clamp((0.7 - s) / 0.08, 0, 1) : 0;
    setArrow(arrows[0], lps[0].position.clone().add(V(0.25, 0, 0)), O.clone().lerp(c, 0.62).add(V(0, 0.25, 0)), V(0, 1.4, 0.2), a1);
    const cb = c.clone().lerp(atoms.X.p, 0.5); setArrow(arrows[1], cb.clone().add(V(0, 0.15, 0)), atoms.X.p.clone().add(V(0.15, ELEM[X].r + 0.12, 0)), V(0, 1.15, 0.1), a2);
    vdw.forEach((v) => { v.visible = !!st.vdw; v.position.copy(atoms[v.userData.a].p); v.material.opacity = (st.vdw ? 0.07 : 0) * (tert && GEO.dO < 3.6 ? 1.8 : 1); v.material.color.set(tert && GEO.dO < 3.45 ? 0xff6b6b : 0x9fb4ff); });
  }

  /* energy profile */
  const E = (s) => (mode === "tert" ? 0.85 : 1) * Math.exp(-(((s - 0.5) / 0.17) ** 2)) - 0.32 * smooth((s - 0.3) / 0.45) * (mode === "tert" ? 0 : 1);
  const ex = (s) => 16 + s * 192, ey = (e) => 92 - e * 64;
  function drawEnergy() { let d = ""; for (let i = 0; i <= 80; i++) { const s = i / 80; d += (i ? "L" : "M") + ex(s).toFixed(1) + " " + ey(E(s)).toFixed(1); } R.ecurve.setAttribute("d", d); R.ets.setAttribute("y", (ey(E(0.5)) - 8).toFixed(1)); }

  /* camera */
  const cam = { t: V(0, 0, 0), d: 14, yaw: -50, pitch: 30 }, want = { t: V(0, 0, 0), d: 14, yaw: 0, pitch: 10 };
  let user = { yaw: 0, pitch: 0, z: 1 }, orbit = 0, drift = 0;
  function resize() { const w = stage.clientWidth, h = stage.clientHeight; if (!w || !h) return; renderer.setSize(w, h, false); camera.aspect = w / h; camera.updateProjectionMatrix(); }
  function aim(shot) { shot = shot || {}; user = { yaw: 0, pitch: 0, z: 1 }; want.t.set(...(shot.t || [-0.6, 0, 0])); want.yaw = shot.yaw ?? 0; want.pitch = shot.pitch ?? 10; orbit = shot.orbit || 0; want.d = (shot.d || 14) * (camera.aspect < 1 ? 1.45 : 1); }
  function camStep(dt) {
    const k = still.matches ? 1 : 1 - Math.exp(-dt / 0.7);
    cam.t.lerp(want.t, k); cam.d += (want.d - cam.d) * k; cam.yaw += (want.yaw - cam.yaw) * k; cam.pitch += (want.pitch - cam.pitch) * k;
    drift += dt; if (!still.matches) want.yaw += orbit * dt;
    const yaw = THREE.MathUtils.degToRad(cam.yaw + user.yaw + Math.sin(drift * 0.2) * 2.5), pitch = THREE.MathUtils.degToRad(clamp(cam.pitch + user.pitch + Math.sin(drift * 0.27) * 1.5, -80, 80)), d = cam.d / user.z;
    camera.position.set(cam.t.x + Math.sin(yaw) * Math.cos(pitch) * d, cam.t.y + Math.sin(pitch) * d, cam.t.z + Math.cos(yaw) * Math.cos(pitch) * d); camera.lookAt(cam.t);
  }
  let drag = false, px = 0, py = 0, pinch = 0;
  const on = (el, ev, fn, o) => { el.addEventListener(ev, fn, o); };
  on(stage, "pointerdown", (e) => { drag = true; px = e.clientX; py = e.clientY; try { stage.setPointerCapture(e.pointerId); } catch (_) {} });
  on(stage, "pointermove", (e) => { if (!drag) return; user.yaw -= (e.clientX - px) * 0.35; user.pitch = clamp(user.pitch + (e.clientY - py) * 0.3, -70, 70); px = e.clientX; py = e.clientY; });
  on(stage, "pointerup", () => { drag = false; }); on(stage, "pointercancel", () => { drag = false; });
  on(stage, "wheel", (e) => { e.preventDefault(); user.z = clamp(user.z * (1 - e.deltaY * 0.001), 0.5, 3); }, { passive: false });
  on(stage, "touchmove", (e) => { if (e.touches.length === 2) { const d = Math.hypot(e.touches[0].clientX - e.touches[1].clientX, e.touches[0].clientY - e.touches[1].clientY); if (pinch) user.z = clamp(user.z * d / pinch, 0.5, 3); pinch = d; } }, { passive: true });
  on(stage, "touchend", () => { pinch = 0; });

  /* labels in the 3D view */
  const GROUP_ATOMS = { Me: ["MeC", "MeH0", "MeH1", "MeH2"], Et: ["EtC", "EtC2", "EtH0", "EtH1", "EtC2H0", "EtC2H1", "EtC2H2"], H2: ["H2"], O: ["O", "HO"], C2: ["C2"], Br: ["X"] };
  const NAMES = () => ({ O: ["1", "Nucleophile · HO⁻", "O"], C2: ["3", "Electrophilic carbon", "C2"], Br: ["5", "Leaving group · " + X, "X"], Me: ["", "Methyl", "MeC"], Et: ["", "Ethyl", "EtC"], H2: ["", "Hydrogen", "H2"] });
  let lab = {};
  function el(cls, html) { const e = document.createElement("div"); e.className = cls; e.innerHTML = html; labelsEl.appendChild(e); return e; }
  function labelAt(e, p, dy = 0) { const v = p.clone().project(camera); e.style.transform = `translate(${((v.x + 1) / 2 * stage.clientWidth).toFixed(1)}px, ${((1 - v.y) / 2 * stage.clientHeight + dy).toFixed(1)}px)`; e.hidden = v.z > 1; }
  function charge(id, txt, show, off = 0.62) { const k = "q" + id + txt; lab[k] = lab[k] || el("mbx-q", txt); lab[k].style.opacity = show ? 1 : 0; if (atoms[id]) labelAt(lab[k], atoms[id].p.clone().add(V(0, off, 0.15))); }
  function labels(s, st) {
    const tert = mode === "tert", xo = ELEM[X].r + 0.3;
    charge("C2", "δ+", !tert && s < 0.4 && (st.charges || st.overview)); charge("X", "δ−", (s < 0.4 && (st.charges || st.overview)) || (s >= 0.4 && s < 0.66), xo);
    charge("O", "−", s < 0.32 || tert); charge("O", "δ−", !tert && s >= 0.32 && s < 0.66); charge("X", "−", !tert && s >= 0.66, xo);
    lab.ts = lab.ts || el("mbx-ts", "‡"); lab.ts.style.opacity = !tert && s > 0.42 && s < 0.58 ? 1 : 0; labelAt(lab.ts, V(0, 2.4, 0));
    lab.block = lab.block || el("mbx-block", "Blocked — no room behind carbon"); lab.block.style.opacity = tert && GEO.dO < 3.45 ? 1 : 0; labelAt(lab.block, V(-2.2, 1.8, 0));
    const cip = !!st.cip && !tert, top = GEO.sCO > 0.5 ? "O" : "X";
    [[top, "1"], ["EtC", "2"], ["MeC", "3"], ["H2", "4"]].forEach(([id, n], i) => { const k = "cip" + i; lab[k] = lab[k] || el("mbx-cip", ""); lab[k].textContent = n; lab[k].style.opacity = cip ? 1 : 0;
      if (atoms[id]) labelAt(lab[k], atoms[id].p.clone().add(V(0, -0.55, 0.3))); });
    const nm = NAMES();
    (st.focus || []).forEach((f) => { const k = "f" + f, n = nm[f]; if (!n || !atoms[n[2]]) return; lab[k] = lab[k] || el("mbx-tag", ""); lab[k].innerHTML = `${n[0] ? `<b>${n[0]}</b>` : ""}${esc(n[1])}`; labelAt(lab[k], atoms[n[2]].p, 46); });
    Object.keys(lab).filter((k) => k[0] === "f").forEach((k) => lab[k].style.opacity = (st.focus || []).includes(k.slice(1)) && !tert ? 1 : 0);
  }
  function glow(st, t) {
    const lit = new Set(); (st.focus || []).forEach((f) => (GROUP_ATOMS[f] || []).forEach((a) => lit.add(a)));
    Object.values(atoms).forEach((a) => a.m.material.emissiveIntensity = lit.has(a.id) ? 0.18 + 0.1 * Math.sin(t * 4) : 0);
  }

  /* mechanism figure, in sync */
  function drawFigure() {
    R.fig.innerHTML = T.figure(X);
    R.key.innerHTML = T.key(X).map((x, i) => `<li data-n="${i + 1}"><b>${i + 1}</b>${esc(x)}</li>`).join("");
    R.key.querySelectorAll("li").forEach((li) => li.onclick = () => { const n = +li.dataset.n, i = steps().findIndex((x) => (x.note || []).includes(n) && x.note.length < 4); if (i >= 0) go(i); });
  }
  function figFocus(nums) {
    const holes = R.fig.querySelector("#mbx-nholes"), rings = R.fig.querySelector("#mbx-nrings"), dim = R.fig.querySelector("#mbx-ndimrect"); if (!holes) return;
    holes.innerHTML = ""; rings.innerHTML = "";
    (nums || []).forEach((n) => { const r = T.regions[n]; if (!r) return;
      holes.insertAdjacentHTML("beforeend", `<ellipse cx="${r[0]}" cy="${r[1]}" rx="${r[2]}" ry="${r[3]}" filter="url(#mbx-nfeather)"/>`);
      rings.insertAdjacentHTML("beforeend", `<ellipse cx="${r[0]}" cy="${r[1]}" rx="${r[2]}" ry="${r[3]}"><animate attributeName="stroke-dashoffset" from="0" to="-26" dur="1s" repeatCount="indefinite"/></ellipse>`); });
    dim.setAttribute("opacity", nums && nums.length ? 0.55 : 0);
  }

  /* the lesson = the template's screenplay + this note's words */
  function steps() {
    return T.steps.map((st) => {
      const p = lesson && lesson.steps && lesson.steps[st.id];
      const o = Object.assign({}, st); if (p && p.say) o.say = p.say;
      if (st.quiz && lesson && lesson.quiz) { if (lesson.quiz.say) o.say = lesson.quiz.say; if (lesson.quiz.answer) o.answer = lesson.quiz.answer; }
      return o;
    });
  }
  function applyLesson(l) {
    lesson = l || null;
    const nx = (lesson && ELEM[lesson.lg] && ["Br", "Cl", "I"].includes(lesson.lg)) ? lesson.lg : "Br";
    const lines = (lesson && Array.isArray(lesson.lines) && lesson.lines.length) ? lesson.lines : T.lines;
    R.lineshd.textContent = lesson && lesson.personal ? "From your note" : "Key points";
    R.lines.innerHTML = lines.map((x) => `<li>${esc(x)}</li>`).join("");
    R.chaps.innerHTML = steps().map((x, i) => `<button data-i="${i}">${i + 1}. ${esc(x.title)}</button>`).join("");
    R.chaps.querySelectorAll("button").forEach((b) => b.onclick = () => go(+b.dataset.i));
    R.badge.textContent = lesson && lesson.personal ? "✓ Matched to your note" : "Drag to turn · pinch to zoom"; R.badge.classList.toggle("ok", !!(lesson && lesson.personal));
    if (nx !== X || !mode) { X = nx; const sv = mode || "normal"; buildMolecule(sv); drawFigure();
      R.bxl.textContent = "C–" + X; R.lgname.textContent = X; R.lgdot.style.background = "#" + ELEM[X].c.toString(16).padStart(6, "0"); }
    if (at >= 0) markStep();
  }

  /* playback of the reaction coordinate s ∈ [0,1] */
  let s = 0, play = null, pt = 0, slow = 1;
  function startPlay(p) { play = Object.assign({ from: 0, to: 0, dur: 1, loop: "none", hold: 0, delay: 0 }, p); pt = -0.8; play.pre = s; }
  function playStep(dt) {
    if (!play) return; pt += dt / slow;
    if (pt < 0) { s = play.pre + (play.from - play.pre) * smooth(1 + pt / 0.8); return; }
    const t = pt - play.delay; if (t < 0) { s = play.from; return; }
    const cyc = play.dur + play.hold + (play.loop === "repeat" ? 0.9 : 0);
    const u = clamp((play.loop !== "none" ? t % cyc : t) / play.dur, 0, 1);
    s = play.from + (play.to - play.from) * (play.loop === "repeat" ? u : smooth(u));
    if (play.wobble) s += Math.sin(t * 5) * play.wobble;
  }

  /* narration — the app's voice when given, the device voice otherwise */
  let sayId = 0, muted = false;
  const sentences = (t) => String(t || "").split(/(?<=[.!?])\s+/).filter(Boolean);
  function caption(text, k) { R.cap.innerHTML = sentences(text).map((x, i) => `<span class="${i === k ? "on" : ""}">${esc(x)}</span>`).join(" "); }
  function deviceSay(text, done) { try { const u = new SpeechSynthesisUtterance(text); u.lang = "en-GB"; u.onend = () => done && done(); u.onerror = () => done && done(); speechSynthesis.speak(u); } catch (_) { done && done(); } }
  function stopVoice() { try { if (opts.speak) opts.speak(null); else if (window.speechSynthesis) speechSynthesis.cancel(); } catch (_) {} }
  function speak(text, then) {
    const id = ++sayId, parts = sentences(text); stopVoice(); let i = 0;
    const next = () => {
      if (id !== sayId) return; if (i >= parts.length) return then && then(); caption(text, i);
      const line = parts[i++]; let fired = false; const done = () => { if (fired) return; fired = true; if (id === sayId) setTimeout(next, 120); };
      if (muted) return setTimeout(done, (900 + line.length * 60));
      setTimeout(done, 4000 + line.length * 140);   // watchdog: a hung voice must never freeze the lesson
      if (opts.speak) opts.speak(line, done); else deviceSay(line, done);
    };
    next();
  }
  function warmAround(i) { if (!opts.warm) return; const st = steps(); const lines = []; [i, i + 1].forEach((k) => { if (st[k]) lines.push(...sentences(st[k].say)); }); try { opts.warm(lines); } catch (_) {} }

  /* steps */
  let at = -1, playing = false, wait = 0, ST = T.steps[0];
  function markStep() {
    const st = steps()[at]; if (!st) return; ST = st;
    R.stepn.textContent = `Step ${at + 1} of ${T.steps.length}`; R.stept.textContent = st.title;
    R.chaps.querySelectorAll("button").forEach((b, k) => b.classList.toggle("on", k === at));
    R.key.querySelectorAll("li").forEach((li) => li.classList.toggle("on", (st.note || []).includes(+li.dataset.n)));
    R.lines.querySelectorAll("li").forEach((li, k) => li.classList.toggle("on", k === st.line));
    const cur = R.chaps.querySelector("button.on"); if (cur) R.chaps.scrollTo({ left: cur.offsetLeft - 40, behavior: "smooth" });
  }
  function go(i) {
    clearTimeout(wait); at = clamp(i, 0, T.steps.length - 1); markStep(); const st = ST;
    if ((st.mode || "normal") !== mode) { buildMolecule(st.mode || "normal"); s = st.play ? st.play.from : 0; drawEnergy(); }
    figFocus(st.note); aim(st.shot); startPlay(st.play || {});
    R.quiz.hidden = !st.quiz; R.reveal.hidden = true; warmAround(at);
    if (playing) speak(st.say, () => { if (playing && at === i && !st.quiz && at + 1 < T.steps.length) wait = setTimeout(() => go(at + 1), 900); else if (at + 1 >= T.steps.length) setPlay(false); });
    else caption(st.say, -1);
  }
  function setPlay(p) { playing = p; R.play.textContent = p ? "❚❚ Pause" : (at < 0 ? "▶ Start the lesson" : "▶ Resume"); if (!p) { sayId++; stopVoice(); } else go(at < 0 ? 0 : at); }
  R.play.onclick = () => setPlay(!playing);
  R.next.onclick = () => go(at + 1); R.prev.onclick = () => go(at - 1);
  R.mute.onclick = () => { muted = !muted; R.mute.textContent = muted ? "🔇" : "🔊"; if (playing) go(at); };
  R.slow.onclick = () => { slow = slow > 1 ? 1 : 3; R.slow.textContent = slow > 1 ? "Normal speed" : "Slow motion"; };
  R.revealbtn.onclick = () => { R.reveal.hidden = false; R.reveal.textContent = ST.answer || ""; if (playing && ST.answer) speak(ST.answer, () => {}); };

  /* loop — stops itself when the app navigates away (host detached) */
  let last = 0, lastCfg = "", raf = 0, dead = false;
  function frame(now) {
    if (dead) return;
    if (!host.isConnected) { destroy(); return; }
    raf = requestAnimationFrame(frame);
    const dt = last ? Math.min(0.1, (now - last) / 1000) : 0.016; last = now;
    if (!still.matches) playStep(dt); else if (play) s = play.to;
    const sc = clamp(s, 0, 1); geometry(sc); layout(); extras(sc, ST); glow(ST, now / 1000);
    R.edot.setAttribute("cx", ex(sc).toFixed(1)); R.edot.setAttribute("cy", ey(E(sc)).toFixed(1));
    const cfg = configuration(); if (cfg !== lastCfg) { lastCfg = cfg; R.cfg.textContent = cfg ? `(${cfg})` : "—"; R.cfg.classList.toggle("r", cfg === "R"); }
    R.bo.style.width = (GEO.sCO * 100).toFixed(0) + "%"; R.bb.style.width = (GEO.sCX * 100).toFixed(0) + "%";
    camStep(dt); labels(sc, ST); renderer.render(scene, camera);
  }
  const ro = new ResizeObserver(resize); ro.observe(stage);
  function destroy() {
    if (dead) return; dead = true; cancelAnimationFrame(raf); sayId++; stopVoice(); clearTimeout(wait); ro.disconnect();
    disposeMol(); sphereGeo.dispose(); cylGeo.dispose(); try { scene.environment && scene.environment.dispose(); pmrem.dispose(); } catch (_) {}
    renderer.dispose(); try { renderer.forceContextLoss(); } catch (_) {}
  }

  resize(); applyLesson(opts.lesson || null); drawEnergy(); aim(T.steps[0].shot); cam.d = want.d * 1.5;
  startPlay(T.steps[0].play); ST = steps()[0]; figFocus([]);
  caption("Press “Start the lesson”. Drag to turn the molecules, pinch to zoom.", -1);
  raf = requestAnimationFrame(frame);
  const api = { setLesson: applyLesson, destroy, go, setPlay, _s: () => s, _set: (v) => { play = null; s = v; }, _cfg: configuration,
    _settle: () => { cam.t.copy(want.t); cam.d = want.d; cam.yaw = want.yaw; cam.pitch = want.pitch; } };
  return api;
}

export { mount, TEMPLATES };
