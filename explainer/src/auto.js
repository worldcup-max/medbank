/* MedBank · 3D Tutor — auto-built lessons.
 * Plays any mechanism the server wrote from a student's note: a checked list of atom-mapped states and curly
 * arrows (import-server/chemspec.mjs), turned into real 3D geometry in the browser (import-server/chem3d.mjs).
 *
 *   MBMech.mountAuto(host, { lesson, speak, warm, onFlag }) → { destroy() }
 *   lesson = { kind:"auto", title, lines[], mechanism:{states,arrows,barriers}, names:{map:label}, steps:[...] }
 *   steps: {kind:"overview"|"step"|"state"|"summary"|"quiz", k?, s?, focus?:[maps], say, answer?} */
import * as THREE from "three";
import { RoomEnvironment } from "three/examples/jsm/environments/RoomEnvironment.js";
import { CSS } from "./ui.js";
import { validateMechanism } from "../../import-server/chemspec.mjs";
import { buildMechanism3D } from "../../import-server/chem3d.mjs";

const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
const smooth = (t) => { t = clamp(t, 0, 1); return t * t * (3 - 2 * t); };
const V3 = (a) => new THREE.Vector3(a[0], a[1], a[2]);
const esc = (s) => String(s == null ? "" : s).replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));
const COL = { H: 0xf2f3f5, C: 0x3a3f4b, N: 0x3d6bff, O: 0xff3b3b, F: 0x8fe36a, Cl: 0x22b35a, Br: 0xa5402e, I: 0x8a3fb0, S: 0xf2c94c, P: 0xff8c2a, B: 0xffb4a0, Li: 0xb07bff, Na: 0xb07bff, K: 0x9b5cff, Mg: 0x7fdc7f, Si: 0xd8b98c, Se: 0xffa13a, Al: 0xbfa6a6, Fe: 0xe06633, Zn: 0x7d80b0 };
const RAD = (el) => (el === "H" ? 0.23 : ["Br", "I", "K", "Na", "S", "P", "Cl", "Mg", "Si", "Se", "Al", "Fe", "Zn", "Li"].includes(el) ? 0.46 : 0.34);
const CH = (q) => (q > 0 ? (q > 1 ? q + "+" : "+") : q < 0 ? (q < -1 ? -q + "−" : "−") : "");

export function mountAuto(host, opts) {
  opts = opts || {}; const L = opts.lesson; if (!L || !L.mechanism) throw new Error("no mechanism to play");
  const check = validateMechanism(L.mechanism); if (!check.ok) throw new Error("This lesson didn't pass the chemistry check: " + check.errors[0]);
  const M = buildMechanism3D(L.mechanism), NT = M.frames.length - 1, mapIdx = {}; M.atoms.forEach((a, i) => { if (a.map) mapIdx[a.map] = i; });
  if (!document.getElementById("mbx-css")) { const st = document.createElement("style"); st.id = "mbx-css"; st.textContent = CSS; document.head.appendChild(st); }
  const steps = (L.steps || []).filter((s) => s && s.say);
  host.innerHTML = `<div class="mbx">
    <div class="mbx-stage"><canvas></canvas><div class="mbx-labels"></div>
      <div class="mbx-hud"><div class="mbx-chip"><small data-r="stepn">3D Tutor · auto-built</small><b data-r="stept">${esc(L.title || "Mechanism")}</b></div>
        <div class="mbx-chip mbx-energy"><small>Energy profile</small><svg viewBox="0 0 224 116"><line x1="14" y1="104" x2="214" y2="104" stroke="#3a3f58"/><line x1="14" y1="104" x2="14" y2="8" stroke="#3a3f58"/>
          <path data-r="ecurve" fill="none" stroke="#8fb2ff" stroke-width="2.2"/><g data-r="elabels"></g><circle data-r="edot" r="5.5" fill="#ffc040" stroke="#fff" stroke-width="1.5"/></svg></div></div>
      <div class="mbx-meters"><div class="mbx-chip"><small>Now</small><b data-r="statenow" style="font-size:13.5px">—</b></div></div>
      <div class="mbx-badge" data-r="badge">Auto-built · check with your notes</div></div>
    <div class="mbx-card"><div class="mbx-cap" data-r="cap"></div>
      <div class="mbx-quiz" data-r="quiz" hidden><button data-r="revealbtn">Tap to reveal</button><div class="mbx-reveal" data-r="reveal" hidden></div></div>
      <div class="mbx-ctl"><button class="mbx-play" data-r="play">▶ Start the lesson</button><button data-r="prev" aria-label="Previous step">◀</button><button data-r="next" aria-label="Next step">▶</button>
        <span class="sp"></span><button data-r="slow">Slow motion</button><button data-r="mute" aria-label="Mute">🔊</button></div>
      <div class="mbx-chaps" data-r="chaps" style="margin-top:10px"></div></div>
    <div class="mbx-card"><h4>The mechanism, state by state</h4><div class="mbx-chaps" data-r="states"></div>
      <input type="range" data-r="scrub" min="0" max="${NT * 1000}" value="0" style="width:100%;margin-top:10px" aria-label="Run the reaction yourself">
      <div style="font-size:12px;color:var(--dim,#9aa0b4)">Drag to run the reaction yourself.</div></div>
    <div class="mbx-card"><h4>From your note</h4><ol class="mbx-lines" data-r="lines"></ol>
      <div style="margin-top:10px"><button data-r="flag" style="font:inherit;font-size:12.5px;border:1px solid var(--line,#232739);background:transparent;color:var(--dim,#9aa0b4);border-radius:9px;padding:6px 10px;cursor:pointer">Something looks wrong?</button></div></div>
  </div>`;
  const R = {}; host.querySelectorAll("[data-r]").forEach((e) => R[e.dataset.r] = e);
  const stage = host.querySelector(".mbx-stage"), canvas = stage.querySelector("canvas"), labelsEl = stage.querySelector(".mbx-labels");
  const still = matchMedia("(prefers-reduced-motion: reduce)");

  /* scene */
  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true });
  renderer.setPixelRatio(Math.min(2, window.devicePixelRatio || 1)); renderer.outputColorSpace = THREE.SRGBColorSpace; renderer.toneMapping = THREE.NeutralToneMapping; renderer.toneMappingExposure = 1.05;
  const scene = new THREE.Scene(); const pmrem = new THREE.PMREMGenerator(renderer); scene.environment = pmrem.fromScene(new RoomEnvironment(), 0.04).texture; scene.environmentIntensity = 0.75;
  const camera = new THREE.PerspectiveCamera(34, 1, 0.1, 300);
  scene.add(new THREE.HemisphereLight(0xffffff, 0x283044, 0.8));
  const key = new THREE.DirectionalLight(0xffffff, 1.8); key.position.set(-4, 8, 9); scene.add(key);
  const rim = new THREE.DirectionalLight(0x8fb2ff, 1.2); rim.position.set(6, 2, -8); scene.add(rim);
  const sphereGeo = new THREE.SphereGeometry(1, 32, 22), cylGeo = new THREE.CylinderGeometry(1, 1, 1, 14, 1), UP = new THREE.Vector3(0, 1, 0);
  const atomMesh = M.atoms.map((a) => { const m = new THREE.Mesh(sphereGeo, new THREE.MeshPhysicalMaterial({ color: COL[a.el] || 0xcccccc, roughness: 0.3, clearcoat: 0.6, clearcoatRoughness: 0.2, emissive: 0xffb000, emissiveIntensity: 0 })); m.scale.setScalar(RAD(a.el)); scene.add(m); return m; });
  // every bond that exists in any state, with up to 3 sticks (for double/triple) plus a dashed gold version
  const bondsAll = {}; M.states.forEach((st, k) => st.bonds.forEach((b) => { const kk = Math.min(b.i, b.j) + "-" + Math.max(b.i, b.j); (bondsAll[kk] = bondsAll[kk] || { i: Math.min(b.i, b.j), j: Math.max(b.i, b.j), order: [] }).order[k] = b.order; }));
  const dashMat = new THREE.MeshBasicMaterial({ color: 0xffc040, transparent: true });
  const BONDS = Object.values(bondsAll).map((b) => {
    for (let k = 0; k <= NT; k++) b.order[k] = b.order[k] || 0;
    b.sticks = [0, 1, 2].map(() => [b.i, b.j].map((ix) => { const m = new THREE.Mesh(cylGeo, new THREE.MeshPhysicalMaterial({ color: COL[M.atoms[ix].el] || 0xcccccc, roughness: 0.35, clearcoat: 0.4 })); scene.add(m); return m; }));
    b.dash = [0, 1, 2, 3, 4].map(() => { const m = new THREE.Mesh(cylGeo, dashMat); scene.add(m); return m; });
    return b;
  });
  const _d = new THREE.Vector3();
  function stick(mesh, p0, p1, r) { _d.subVectors(p1, p0); const len = _d.length(); mesh.visible = true; mesh.position.addVectors(p0, p1).multiplyScalar(0.5); mesh.quaternion.setFromUnitVectors(UP, _d.normalize()); mesh.scale.set(r, len, r); }
  // curly arrows + lone-pair lobes
  const arrowMat = new THREE.MeshBasicMaterial({ color: 0xffc040, transparent: true });
  const ARROWS = [0, 1, 2, 3].map(() => { const tube = new THREE.Mesh(new THREE.BufferGeometry(), arrowMat), head = new THREE.Mesh(new THREE.ConeGeometry(0.15, 0.4, 14), arrowMat);
    const e1 = new THREE.Mesh(sphereGeo, new THREE.MeshBasicMaterial({ color: 0xffffff })), e2 = new THREE.Mesh(sphereGeo, e1.material); e1.scale.setScalar(0.08); e2.scale.setScalar(0.08);
    const g = new THREE.Group(); g.add(tube, head, e1, e2); scene.add(g); return { g, tube, head, e1, e2 }; });
  const LOBES = [0, 1, 2, 3].map(() => { const m = new THREE.Mesh(sphereGeo, new THREE.MeshPhysicalMaterial({ color: 0xffc040, transparent: true, opacity: 0.35, depthWrite: false, emissive: 0xffc040, emissiveIntensity: 0.3 })); m.scale.set(0.2, 0.2, 0.42); scene.add(m); return m; });

  /* geometry at timeline position T ∈ [0, NT] */
  const pos = M.atoms.map(() => new THREE.Vector3());
  function posAt(T) { const k = Math.min(NT - 1, Math.floor(T)), u = smooth(T - k), A = M.frames[k], B = M.frames[Math.min(NT, k + 1)]; pos.forEach((p, i) => p.set(A[i][0] + (B[i][0] - A[i][0]) * u, A[i][1] + (B[i][1] - A[i][1]) * u, A[i][2] + (B[i][2] - A[i][2]) * u)); return { k, u }; }
  function perp(b, P) { const ax = new THREE.Vector3().subVectors(P[b.j], P[b.i]).normalize(); const nb = BONDS.find((x) => x !== b && (x.i === b.i || x.j === b.i)); let ref = nb ? new THREE.Vector3().subVectors(P[nb.i === b.i ? nb.j : nb.i], P[b.i]) : new THREE.Vector3(0, 0, 1); let n = new THREE.Vector3().crossVectors(ax, ref); if (n.lengthSq() < 1e-4) n = new THREE.Vector3().crossVectors(ax, new THREE.Vector3(0, 1, 0)); return new THREE.Vector3().crossVectors(n.normalize(), ax).normalize(); }
  function layout(T) {
    const { k, u } = posAt(T);
    atomMesh.forEach((m, i) => m.position.copy(pos[i]));
    BONDS.forEach((b) => {
      const o0 = b.order[k], o1 = b.order[Math.min(NT, k + 1)], o = o0 + (o1 - o0) * u, changing = Math.abs(o0 - o1) > 0.01 && u > 0.02 && u < 0.98;
      const solidN = changing ? Math.floor(Math.min(o0, o1) + 0.01) : Math.round(o0 + (o1 - o0) * Math.round(u)), p0 = pos[b.i], p1 = pos[b.j], mid = p0.clone().lerp(p1, 0.5);
      const off = solidN > 1 || changing ? perp(b, pos) : null, gap = solidN === 3 ? 0.16 : 0.12;
      b.sticks.forEach((pair, n) => pair.forEach((m, h) => {
        if (n >= Math.max(1, solidN) || (solidN === 0)) { m.visible = false; return; }
        const sh = solidN === 1 ? 0 : solidN === 2 ? (n ? gap : -gap) : (n - 1) * gap * 1.4; const d = off ? off.clone().multiplyScalar(sh) : new THREE.Vector3();
        stick(m, (h ? mid : p0).clone().add(d), (h ? p1 : mid).clone().add(d), solidN > 1 ? 0.06 : 0.1);
      }));
      const showDash = changing && Math.abs(o0 - o1) > 0.01; const dOff = off && solidN >= 1 ? off.clone().multiplyScalar(0.16) : new THREE.Vector3();
      b.dash.forEach((m, n) => { if (!showDash) { m.visible = false; return; } stick(m, p0.clone().lerp(p1, (n + 0.15) / 5).add(dOff), p0.clone().lerp(p1, (n + 0.65) / 5).add(dOff), 0.065); });
    });
    dashMat.opacity = 0.9;
    return { k, u };
  }
  function bez(a, b, lift) { return new THREE.QuadraticBezierCurve3(a, a.clone().lerp(b, 0.5).add(lift), b); }
  function drawArrows(k, u, on) {
    const list = on ? ((L.mechanism.arrows || [])[k] || []) : []; let lobe = 0; const cen = new THREE.Vector3(); pos.forEach((p) => cen.add(p)); cen.multiplyScalar(1 / pos.length);
    ARROWS.forEach((A, n) => {
      const ar = list[n], show = ar && u < 0.6 ? clamp((0.6 - u) / 0.15, 0, 1) : 0; A.g.visible = show > 0.01; if (!A.g.visible) return;
      const P = (m) => pos[mapIdx[m]]; if (ar.from.some((m) => mapIdx[m] === undefined) || ar.to.some((m) => mapIdx[m] === undefined)) { A.g.visible = false; return; }
      const end = ar.to.length === 2 ? P(ar.to[0]).clone().lerp(P(ar.to[1]), 0.5) : P(ar.to[0]).clone().add(new THREE.Vector3(0, RAD(M.atoms[mapIdx[ar.to[0]]].el) + 0.15, 0));
      let start;
      if (ar.from.length === 1) { const a = P(ar.from[0]); const dir = end.clone().sub(a).normalize(); start = a.clone().addScaledVector(dir, 0.55);
        if (lobe < LOBES.length) { const lb = LOBES[lobe++]; lb.visible = true; lb.position.copy(a).addScaledVector(dir, 0.45); lb.quaternion.setFromUnitVectors(new THREE.Vector3(0, 0, 1), dir); lb.material.opacity = 0.35 * show; } }
      else start = P(ar.from[0]).clone().lerp(P(ar.from[1]), 0.5);
      const seg = end.clone().sub(start); const away = start.clone().lerp(end, 0.5).sub(cen); let lift = new THREE.Vector3().crossVectors(seg, new THREE.Vector3(0, 0, 1)); if (lift.dot(away) < 0) lift.negate(); if (lift.lengthSq() < 1e-4) lift.set(0, 1, 0);
      lift.normalize().multiplyScalar(Math.max(0.7, seg.length() * 0.45)).add(new THREE.Vector3(0, 0.35, 0));
      const c = bez(start, end, lift); A.tube.geometry.dispose(); A.tube.geometry = new THREE.TubeGeometry(c, 36, 0.045, 8, false);
      A.head.position.copy(c.getPoint(1)); A.head.quaternion.setFromUnitVectors(UP, c.getTangent(1)); arrowMat.opacity = show;
      const t = (performance.now() / 1300) % 1; A.e1.position.copy(c.getPoint(t)).add(new THREE.Vector3(0, 0.07, 0)); A.e2.position.copy(c.getPoint(t)).add(new THREE.Vector3(0, -0.07, 0));
    });
    LOBES.slice(lobe).forEach((l) => l.visible = false);
  }

  /* energy profile from the states' energies and the step barriers */
  const E0 = L.mechanism.states.map((s) => (typeof s.energy === "number" ? clamp(s.energy, -1, 1) : 0)), BAR = (L.mechanism.barriers || []).map((b) => clamp(+b || 0.6, 0.05, 1.2));
  const Eat = (T) => { const k = Math.min(NT - 1, Math.floor(T)), u = T - k, a = E0[k], b = E0[k + 1], top = Math.max(a, b) + (BAR[k] ?? 0.6) * 0.6; return u < 0.5 ? a + (top - a) * smooth(u * 2) : top + (b - top) * smooth((u - 0.5) * 2); };
  const lo = Math.min(...E0) - 0.1, hi = Math.max(...E0.map((e, k) => (k < NT ? Math.max(e, E0[k + 1]) + (BAR[k] ?? 0.6) * 0.6 : e))) + 0.05;
  const ex = (T) => 16 + (T / NT) * 192, ey = (e) => 100 - ((e - lo) / (hi - lo || 1)) * 88;
  { let d = ""; for (let i = 0; i <= 120; i++) { const T = (i / 120) * NT; d += (i ? "L" : "M") + ex(T).toFixed(1) + " " + ey(Eat(T)).toFixed(1); } R.ecurve.setAttribute("d", d);
    R.elabels.innerHTML = E0.map((e, k) => `<text x="${ex(k).toFixed(1)}" y="${Math.min(113, ey(e) + 11).toFixed(1)}" font-size="8" text-anchor="middle" fill="#6b7086">${k + 1}</text>`).join(""); }

  /* camera */
  const cam = { t: new THREE.Vector3(), d: 14, yaw: -40, pitch: 25 }, want = { t: new THREE.Vector3(), d: 12, yaw: 15, pitch: 14 };
  let user = { yaw: 0, pitch: 0, z: 1 }, orbit = 2, drift = 0;
  function resize() { const w = stage.clientWidth, h = stage.clientHeight; if (!w || !h) return; renderer.setSize(w, h, false); camera.aspect = w / h; camera.updateProjectionMatrix(); }
  function frameOn(idxs, frames) {
    const pts = []; frames.forEach((f) => idxs.forEach((i) => pts.push(M.frames[f][i]))); if (!pts.length) return;
    const c = pts.reduce((t, p) => [t[0] + p[0], t[1] + p[1], t[2] + p[2]], [0, 0, 0]).map((x) => x / pts.length); let r = 1.5; pts.forEach((p) => { r = Math.max(r, Math.hypot(p[0] - c[0], p[1] - c[1], p[2] - c[2])); });
    want.t.set(c[0], c[1], c[2]); want.d = (r + 1.6) / Math.tan(THREE.MathUtils.degToRad(17)) * (camera.aspect < 1 ? 1.35 : 0.95);
  }
  function aim(st) {
    user = { yaw: 0, pitch: 0, z: 1 };
    const heavy = M.atoms.map((a, i) => i).filter((i) => M.atoms[i].el !== "H");
    if (st.kind === "step") { const ch = new Set(); const A = M.states[st.k].bonds, B = M.states[st.k + 1].bonds, s = (b) => Math.min(b.i, b.j) + "-" + Math.max(b.i, b.j);
      const a = new Map(A.map((b) => [s(b), b.order])), b2 = new Map(B.map((b) => [s(b), b.order])); new Set([...a.keys(), ...b2.keys()]).forEach((kk) => { if ((a.get(kk) || 0) !== (b2.get(kk) || 0)) kk.split("-").forEach((x) => ch.add(+x)); });
      const near = new Set(ch); ch.forEach((i) => BONDS.forEach((b) => { if (b.i === i) near.add(b.j); if (b.j === i) near.add(b.i); }));
      frameOn([...near].filter((i) => M.atoms[i].el !== "H" || ch.has(i)), [st.k, st.k + 1]); want.yaw = 20 * ((st.k % 2) ? -1 : 1); want.pitch = 16; orbit = 0; }
    else if (st.kind === "state") { frameOn(heavy, [st.s]); want.yaw = -15; want.pitch = 20; orbit = 4; }
    else { frameOn(heavy, M.frames.map((_, f) => f)); want.yaw = 15; want.pitch = 14; orbit = 3; }
  }
  function camStep(dt) {
    const k = still.matches ? 1 : 1 - Math.exp(-dt / 0.7);
    cam.t.lerp(want.t, k); cam.d += (want.d - cam.d) * k; cam.yaw += (want.yaw - cam.yaw) * k; cam.pitch += (want.pitch - cam.pitch) * k; drift += dt; if (!still.matches) want.yaw += orbit * dt;
    const yaw = THREE.MathUtils.degToRad(cam.yaw + user.yaw + Math.sin(drift * 0.2) * 2.5), pitch = THREE.MathUtils.degToRad(clamp(cam.pitch + user.pitch, -80, 80)), d = cam.d / user.z;
    camera.position.set(cam.t.x + Math.sin(yaw) * Math.cos(pitch) * d, cam.t.y + Math.sin(pitch) * d, cam.t.z + Math.cos(yaw) * Math.cos(pitch) * d); camera.lookAt(cam.t);
  }
  let drag = false, px = 0, py = 0, pinch = 0;
  stage.addEventListener("pointerdown", (e) => { drag = true; px = e.clientX; py = e.clientY; try { stage.setPointerCapture(e.pointerId); } catch (_) {} });
  stage.addEventListener("pointermove", (e) => { if (!drag) return; user.yaw -= (e.clientX - px) * 0.35; user.pitch = clamp(user.pitch + (e.clientY - py) * 0.3, -70, 70); px = e.clientX; py = e.clientY; });
  stage.addEventListener("pointerup", () => { drag = false; }); stage.addEventListener("pointercancel", () => { drag = false; });
  stage.addEventListener("wheel", (e) => { e.preventDefault(); user.z = clamp(user.z * (1 - e.deltaY * 0.001), 0.4, 3); }, { passive: false });
  stage.addEventListener("touchmove", (e) => { if (e.touches.length === 2) { const d = Math.hypot(e.touches[0].clientX - e.touches[1].clientX, e.touches[0].clientY - e.touches[1].clientY); if (pinch) user.z = clamp(user.z * d / pinch, 0.4, 3); pinch = d; } }, { passive: true });
  stage.addEventListener("touchend", () => { pinch = 0; });

  /* labels: charges and the names of the atoms the step is about */
  const lab = {};
  function el(cls, html) { const e = document.createElement("div"); e.className = cls; e.innerHTML = html; labelsEl.appendChild(e); return e; }
  function place(e, p, dy = 0) { const v = p.clone().project(camera); e.style.transform = `translate(${((v.x + 1) / 2 * stage.clientWidth).toFixed(1)}px, ${((1 - v.y) / 2 * stage.clientHeight + dy).toFixed(1)}px)`; e.hidden = v.z > 1; }
  function labels(k, u, st) {
    M.atoms.forEach((a, i) => {
      const q0 = M.states[k].charge[i], q1 = M.states[Math.min(NT, k + 1)].charge[i]; const kk = "q" + i;
      const txt = q0 === q1 ? CH(q0) : u < 0.3 ? CH(q0) : u > 0.7 ? CH(q1) : "δ" + (q0 + q1 > 0 || q1 > q0 ? "+" : "−");
      if (!txt) { if (lab[kk]) lab[kk].style.opacity = 0; return; }
      lab[kk] = lab[kk] || el("mbx-q", ""); lab[kk].textContent = txt; lab[kk].style.opacity = 1; place(lab[kk], pos[i].clone().add(new THREE.Vector3(0, RAD(a.el) + 0.3, 0.1)));
    });
    const names = L.names || {}, focus = (st.focus || []).filter((m) => mapIdx[m] !== undefined);
    Object.keys(lab).filter((x) => x[0] === "f").forEach((x) => lab[x].style.opacity = 0);
    focus.forEach((m) => { const kk = "f" + m; lab[kk] = lab[kk] || el("mbx-tag", ""); lab[kk].innerHTML = esc(names[m] || (M.atoms[mapIdx[m]].el)); lab[kk].style.opacity = 1; place(lab[kk], pos[mapIdx[m]], 30); });
    const lit = new Set(focus.map((m) => mapIdx[m])); atomMesh.forEach((m, i) => m.material.emissiveIntensity = lit.has(i) ? 0.2 + 0.1 * Math.sin(performance.now() / 250) : 0);
  }

  /* narration (the app's voice when given) */
  let sayId = 0, muted = false;
  const sentences = (t) => String(t || "").split(/(?<=[.!?])\s+/).filter(Boolean);
  function caption(text, k) { R.cap.innerHTML = sentences(text).map((x, i) => `<span class="${i === k ? "on" : ""}">${esc(x)}</span>`).join(" "); }
  function stopVoice() { try { if (opts.speak) opts.speak(null); else if (window.speechSynthesis) speechSynthesis.cancel(); } catch (_) {} }
  function deviceSay(t, done) { try { const u = new SpeechSynthesisUtterance(t); u.lang = "en-GB"; u.onend = done; u.onerror = done; speechSynthesis.speak(u); } catch (_) { done(); } }
  function speak(text, then) {
    const id = ++sayId, parts = sentences(text); stopVoice(); let i = 0;
    const next = () => { if (id !== sayId) return; if (i >= parts.length) return then && then(); caption(text, i); const line = parts[i++]; let fired = false;
      const done = () => { if (fired) return; fired = true; if (id === sayId) setTimeout(next, 120); };
      if (muted) return setTimeout(done, 900 + line.length * 60); setTimeout(done, 4000 + line.length * 140);
      if (opts.speak) opts.speak(line, done); else deviceSay(line, done); };
    next();
  }

  /* playback */
  let T = 0, play = null, slow = 1, at = -1, playing = false, wait = 0, ST = steps[0] || { kind: "overview" }, scrubbing = false;
  function playFor(st) {
    if (st.kind === "step") return { from: st.k, to: st.k + 1, dur: 4.5, loop: true, hold: 1.4 };
    if (st.kind === "state") return { from: st.s, to: st.s, dur: 1 };
    return { from: 0, to: NT, dur: 3.2 * NT + 1, loop: true, hold: 1.5 };
  }
  let pt = 0; function startPlay(p) { play = Object.assign({ hold: 0 }, p); play.pre = T; pt = -0.8; }
  function tick(dt) {
    if (!play || scrubbing) return; pt += dt / slow;
    if (pt < 0) { T = play.pre + (play.from - play.pre) * smooth(1 + pt / 0.8); return; }
    const cyc = play.dur + play.hold + (play.loop ? 0.6 : 0), t = play.loop ? pt % cyc : pt; T = play.from + (play.to - play.from) * clamp(t / play.dur, 0, 1);
  }
  function mark() {
    R.stepn.textContent = `Step ${at + 1} of ${steps.length} · auto-built`; R.stept.textContent = ST.title || (ST.kind === "step" ? `Step ${ST.k + 1}` : ST.kind === "state" ? (M.states[ST.s].name || "State " + (ST.s + 1)) : ST.kind === "quiz" ? "Check yourself" : L.title || "Mechanism");
    R.chaps.querySelectorAll("button").forEach((b, k) => b.classList.toggle("on", k === at));
    const cur = R.chaps.querySelector("button.on"); if (cur) R.chaps.scrollTo({ left: cur.offsetLeft - 40, behavior: "smooth" });
  }
  function go(i) {
    clearTimeout(wait); at = clamp(i, 0, steps.length - 1); ST = steps[at]; mark(); aim(ST); startPlay(playFor(ST));
    R.quiz.hidden = ST.kind !== "quiz"; R.reveal.hidden = true;
    if (opts.warm) { const lines = []; [at, at + 1].forEach((k) => { if (steps[k]) lines.push(...sentences(steps[k].say)); }); try { opts.warm(lines); } catch (_) {} }
    if (playing) speak(ST.say, () => { if (playing && at === i && ST.kind !== "quiz" && at + 1 < steps.length) wait = setTimeout(() => go(at + 1), 900); else if (at + 1 >= steps.length) setPlay(false); });
    else caption(ST.say, -1);
  }
  function setPlay(p) { playing = p; R.play.textContent = p ? "❚❚ Pause" : (at < 0 ? "▶ Start the lesson" : "▶ Resume"); if (!p) { sayId++; stopVoice(); } else go(at < 0 ? 0 : at); }
  R.play.onclick = () => setPlay(!playing); R.next.onclick = () => go(at + 1); R.prev.onclick = () => go(at - 1);
  R.mute.onclick = () => { muted = !muted; R.mute.textContent = muted ? "🔇" : "🔊"; if (playing) go(at); };
  R.slow.onclick = () => { slow = slow > 1 ? 1 : 3; R.slow.textContent = slow > 1 ? "Normal speed" : "Slow motion"; };
  R.revealbtn.onclick = () => { R.reveal.hidden = false; R.reveal.textContent = ST.answer || ""; if (playing && ST.answer) speak(ST.answer, () => {}); };
  R.chaps.innerHTML = steps.map((s, i) => `<button>${i + 1}. ${esc(s.title || (s.kind === "step" ? "Step " + (s.k + 1) : s.kind === "state" ? (M.states[s.s].name || "State") : s.kind === "quiz" ? "Check yourself" : s.kind === "summary" ? "Summary" : "Overview"))}</button>`).join("");
  R.chaps.querySelectorAll("button").forEach((b, i) => b.onclick = () => go(i));
  R.states.innerHTML = M.states.map((s, k) => `<button data-s="${k}">${k + 1}. ${esc(s.name || "State " + (k + 1))}</button>`).join("");
  R.states.querySelectorAll("button").forEach((b) => b.onclick = () => { scrubbing = false; startPlay({ from: +b.dataset.s, to: +b.dataset.s, dur: 1 }); frameOn(M.atoms.map((a, i) => i).filter((i) => M.atoms[i].el !== "H"), [+b.dataset.s]); });
  R.scrub.oninput = () => { scrubbing = true; T = +R.scrub.value / 1000; };
  R.scrub.onchange = () => { setTimeout(() => { scrubbing = false; startPlay({ from: T, to: T, dur: 1 }); }, 50); };
  R.lines.innerHTML = (L.lines || []).map((x) => `<li>${esc(x)}</li>`).join("") || "<li>—</li>";
  R.flag.onclick = () => { R.flag.disabled = true; R.flag.textContent = "Thanks — we'll check this lesson."; try { opts.onFlag && opts.onFlag(); } catch (_) {} };

  /* loop */
  let last = 0, raf = 0, dead = false;
  const ro = new ResizeObserver(resize); ro.observe(stage);
  function frame(now) {
    if (dead) return; if (!host.isConnected) { destroy(); return; }
    raf = requestAnimationFrame(frame); const dt = last ? Math.min(0.1, (now - last) / 1000) : 0.016; last = now;
    if (!still.matches) tick(dt); else if (play) T = play.to;
    T = clamp(T, 0, NT); const { k, u } = layout(T);
    drawArrows(k, u, ST.kind === "step" ? ST.k === k : ST.kind === "overview");
    R.edot.setAttribute("cx", ex(T).toFixed(1)); R.edot.setAttribute("cy", ey(Eat(T)).toFixed(1));
    if (!scrubbing) R.scrub.value = String(Math.round(T * 1000));
    const near = Math.round(T); R.statenow.textContent = Math.abs(T - near) < 0.08 ? (M.states[near].name || "State " + (near + 1)) : `${k + 1} → ${k + 2}`;
    R.states.querySelectorAll("button").forEach((b, s) => b.classList.toggle("on", Math.abs(T - s) < 0.08));
    camStep(dt); labels(k, u, ST); renderer.render(scene, camera);
  }
  function destroy() {
    if (dead) return; dead = true; cancelAnimationFrame(raf); sayId++; stopVoice(); clearTimeout(wait); ro.disconnect();
    scene.traverse((o) => { if (o.material) o.material.dispose && o.material.dispose(); if (o.geometry && o.geometry !== sphereGeo && o.geometry !== cylGeo) o.geometry.dispose(); });
    sphereGeo.dispose(); cylGeo.dispose(); try { scene.environment.dispose(); pmrem.dispose(); } catch (_) {} renderer.dispose(); try { renderer.forceContextLoss(); } catch (_) {}
  }
  resize(); aim(ST); cam.t.copy(want.t); cam.d = want.d * 1.4; startPlay(playFor({ kind: "overview" }));
  caption("Press “Start the lesson”. Drag to turn the molecules, or drag the slider to run the reaction yourself.", -1);
  raf = requestAnimationFrame(frame);
  return { destroy, go, setPlay, _T: () => T, _set: (v) => { scrubbing = true; T = v; }, _settle: () => { cam.t.copy(want.t); cam.d = want.d; cam.yaw = want.yaw; cam.pitch = want.pitch; }, warnings: M.warnings };
}
