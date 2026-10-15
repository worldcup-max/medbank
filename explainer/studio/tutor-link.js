/* MedBank tutor-link — runs INSIDE a library plate page and turns it into a remote-controlled stage for the app's
 * note-driven tutor (explainer/plate-tutor.js). The parent (the app) owns the script: the student's note, the voice,
 * the order of stops. This file only does visual work on the plate and reports taps.
 *
 * Loaded by the parent into a same-origin plate iframe. Uses only what every built plate already exposes
 * (window.__studio.seek/openLens/closeLens, the global createModel, the page's own buttons), so shell.mjs is untouched.
 * Nothing of the plate is removed: stage, lenses, legend, ledger (phase, why, live numbers), controls and chart all
 * stay. Only the plate's own header and its built-in tutor panel are hidden while linked (the app shows its own).
 *
 * Messages IN  (parent → plate):
 *   {type:"mbx-link", parts:{id:{name, shows, covered, qs}}, unlocked:[ids], dark}   start linked mode (qs: ready questions for the part's popover)
 *   {type:"mbx-show", phase, focus:[ids], lens, win, speed, play}               move the stage to a stop (lens opens a close-up)
 *   {type:"mbx-play", on}  {type:"mbx-theme", dark}  {type:"mbx-unlock", id}  {type:"mbx-pop-close"}
 *   {type:"mbx-ask", before, ring:[ids], banner}   freeze just before phase 'before' (prediction) or anywhere (banner only); taps report mbx-pick
 *   {type:"mbx-ask-end", mark:{right:[ids], wrong:[ids]}}   clear the question; optionally colour the answer
 *   {type:"mbx-params", params}   what-if: re-run the model (window.__studio.setParams) · {type:"mbx-phase-step", dir}
 * Messages OUT (plate → parent):
 *   {type:"mbx-linked", parts:[ids], phases:[names], lesson:{steps}}   (lesson = the plate's default, used only as a fallback)  {type:"mbx-height", h}  {type:"mbx-playing", on}
 *   {type:"mbx-tap", id, covered}  {type:"mbx-learn", id, phase}  {type:"mbx-pick", id}  {type:"mbx-phase", phase}
 *   {type:"mbx-askq", id, q}  {type:"mbx-askown", id}   Ask the plate: a part's ready question was tapped / "or ask your own"
 */
(function () {
  if (window.__mbxLink) return; window.__mbxLink = true;
  const up = (m) => { try { window.parent.postMessage(m, "*"); } catch (_) {} };
  const ready = (cb) => { const go = () => (window.__studio && window.__studio.ready && window.K) ? cb() : setTimeout(go, 60); go(); };

  /* Lite mode for cheap phones (feature 5): 30 frames a second and no glow filters (an SVG blur is the slowest thing a weak GPU draws;
   * the focused part still stands out because everything else dims). On for Data Saver, 3 GB of memory or less, or 4 cores or fewer,
   * and switched on by itself if the first seconds run below about 45 fps. localStorage "mbp-lite" = "on" | "off" overrides.
   * window.__mbxLite says whether it is on and why. */
  (function lite() {
    let pref = null; try { pref = localStorage.getItem("mbp-lite"); } catch (_) {}
    if (pref === "off") { window.__mbxLite = { on: false, why: "off by choice" }; return; }
    const n = navigator, why = pref === "on" ? "on by choice" : n.connection && n.connection.saveData ? "data saver" : n.deviceMemory && n.deviceMemory <= 3 ? n.deviceMemory + " GB memory" : n.hardwareConcurrency && n.hardwareConcurrency <= 4 ? n.hardwareConcurrency + " cores" : null;
    window.__mbxLite = { on: false, why: "full quality" };
    const on = (w) => { if (window.__mbxLite.on) return; window.__mbxLite = { on: true, why: w };
      const st = document.createElement("style"); st.textContent = "svg *{filter:none!important}"; (document.head || document.documentElement).appendChild(st);
      const raf = window.requestAnimationFrame.bind(window); window.requestAnimationFrame = (cb) => raf(function half(t) { half.k = !half.k; if (half.k) raf(half); else cb(t); }); };
    if (why) return on(why);
    const raf = window.requestAnimationFrame.bind(window), ts = []; const probe = (t) => { ts.push(t); if (ts.length < 90) raf(probe); else {
      const d = ts.slice(1).map((x, i) => x - ts[i]).sort((x, y) => x - y), med = d[d.length >> 1]; if (!document.hidden && med > 22) on(Math.round(1000 / med) + " fps"); } };
    setTimeout(() => raf(probe), 1500);
  })();

  /* What the parent drives. Built from the plate's public bits (window.__studio.seek / openLens / closeLens, the global
   * createModel, the page's own buttons), so it works on every built plate without touching shell.mjs. */
  function plateApi() {
    if (window.__studio.api) return window.__studio.api;
    const doc = document, $ = (id) => doc.getElementById(id), M = createModel(), N = M.N || 600, T = M.T;
    const S = []; for (let i = 0; i < N; i++) S.push(M.sample(i * T / N));
    const bands = []; for (let i = 1, a = 0; i <= N; i++) if (i === N || S[i].phase !== S[a].phase) { bands.push({ name: S[a].phase, a, b: i }); a = i; }
    let lesson = null; try { for (const sc of doc.scripts) { const m = /runStudio\(createScene, (\{[\s\S]*\})\);\s*\}\s*catch/.exec(sc.textContent); if (m) { lesson = JSON.parse(m[1]); break; } } } catch (_) {}
    const isPlaying = () => $("play").getAttribute("aria-pressed") === "true";
    const setPlaying = (p) => { if (isPlaying() !== !!p) $("play").click(); };
    const seek = (f) => window.__studio.seek ? window.__studio.seek(f) : null;
    return { T, N, samples: S, bands, lesson, isPlaying, setPlaying,
      goPhase(name) { const b = bands.filter((x) => x.name === name).sort((x, y) => (y.b - y.a) - (x.b - x.a))[0]; if (b) seek((b.a + 2) / N); return !!b; },
      seekTime(t) { seek(Math.max(0, Math.min(1, t / T))); },
      setSpeed(v) { const bs = [...doc.querySelectorAll("#speed button")]; if (!bs.length) return; bs.sort((x, y) => Math.abs(+x.dataset.s - v) - Math.abs(+y.dataset.s - v))[0].click(); },
      stopTutor() { const b = $("tutor"); if (b && /stop/i.test(b.textContent)) b.click(); try { speechSynthesis.cancel(); } catch (_) {} },
      phaseAt() { const i = window.__studio.i || 0; const b = bands.find((x) => i >= x.a && i < x.b); return b ? b.name : null; },
      stepPhase(dir) { const i = window.__studio.i || 0; let k = bands.findIndex((x) => i >= x.a && i < x.b); k = Math.max(0, Math.min(bands.length - 1, k + (dir > 0 ? 1 : -1))); seek((bands[k].a + 2) / N); },
      before(name) { const b = bands.filter((x) => x.name === name).sort((x, y) => (y.b - y.a) - (x.b - x.a))[0]; if (b) seek(Math.max(0, b.a - 2) / N); return !!b; },
      lens(id) { try { if (id && window.__studio.openLens) window.__studio.openLens(id); else if (window.__studio.closeLens) window.__studio.closeLens(); } catch (_) {} } };
  }

  ready(function () {
    const A = plateApi(), K = window.K, doc = document, svg = doc.getElementById("stage");
    let PARTS = {}, unlocked = new Set(), focus = new Set(), linked = false, asking = null, marks = {};

    /* app dark mode: the plate's dark palette only answers prefers-color-scheme, so mirror it under [data-theme="dark"] */
    try { for (const sh of doc.styleSheets) for (const r of sh.cssRules) if (r.media && /dark/.test(r.conditionText || r.media.mediaText))
      for (const ir of r.cssRules) if (/:root:not\(\[data-theme="light"\]\)/.test(ir.selectorText || "")) sh.insertRule(':root[data-theme="dark"]{' + ir.style.cssText + "}", sh.cssRules.length); } catch (_) {}
    const theme = (dark) => doc.documentElement.setAttribute("data-theme", dark ? "dark" : "light");

    const css = doc.createElement("style");
    css.textContent = `
html.mbx-linked body{padding:6px 0 10px!important;background:transparent!important}
html.mbx-linked .wrap{gap:10px!important;max-width:none!important;grid-template-columns:minmax(0,1fr)}
html.mbx-linked .main{grid-template-columns:minmax(0,1fr)}@media (min-width:861px){html.mbx-linked .main{grid-template-columns:minmax(0,1.45fr) minmax(0,1fr)}}
html.mbx-linked .wrap>header,html.mbx-linked section.tutor{display:none!important}
html.mbx-linked #stage{cursor:pointer}
html.mbx-mini .ledger,html.mbx-mini .wrap>section:not(.main),html.mbx-mini .notes,html.mbx-mini .err,html.mbx-mini .legend,html.mbx-mini .lensbar{display:none!important}
html.mbx-mini .main{border:0!important;background:transparent!important}html.mbx-mini .stage{border:0!important;padding:0!important}html.mbx-mini body{padding:0!important}
.mbx-pop{position:absolute;z-index:20;width:min(250px,78%);background:var(--sheet);color:var(--ink);border:1px solid var(--hair);border-radius:12px;
 padding:11px 12px 12px;box-shadow:0 10px 30px rgba(0,0,0,.22);font:13px/1.45 var(--body)}
.mbx-pop b{font-size:14.5px;display:block;padding-right:22px}.mbx-pop p{margin:6px 0 0;color:var(--muted)}
.mbx-pop .tg{display:inline-block;margin-top:5px;font:600 11px var(--body);letter-spacing:.02em;border-radius:99px;padding:1px 8px}
.mbx-pop .tg.out{border:1px dashed var(--muted);color:var(--muted)}.mbx-pop .tg.in{background:color-mix(in srgb,var(--accent) 16%,transparent);color:var(--accent)}
.mbx-pop .go{margin-top:10px;width:100%;min-height:42px;border-radius:9px;border:1.5px solid var(--accent);color:var(--accent);background:transparent;font:600 14px var(--body)}
.mbx-banner{position:absolute;left:8px;right:8px;top:8px;z-index:25;background:rgba(109,40,217,.94);color:#fff;border-radius:10px;padding:8px 11px;font:600 13px/1.35 var(--body);pointer-events:none}
.mbx-pop .qs{display:grid;gap:6px;margin-top:9px}.mbx-pop .q{text-align:left;min-height:40px;border-radius:9px;border:1px solid var(--hair);background:transparent;color:var(--accent);font:600 13.5px var(--body);padding:8px 10px;line-height:1.3}
.mbx-pop .own{border:0;background:none;color:var(--muted);font:12.5px var(--body);text-align:left;padding:2px 2px 0}
.mbx-pop .x{position:absolute;top:4px;right:4px;width:34px;height:34px;border:0;background:transparent;color:var(--muted);font-size:18px;padding:0}`;
    doc.head.appendChild(css);

    /* ---- dimming: parts the note does not cover sit at 30% unless the student unlocked them; focused parts glow.
     * Elements the scene keeps invisible on purpose (glow strokes at opacity 0) are never touched. */
    const isGhost = (e) => e.getAttribute("opacity") === "0" || /kGlow/.test(e.getAttribute("filter") || "");
    function paint() { const P = K.parts();
      for (const id in P) { const dim = linked && PARTS[id] && !PARTS[id].covered && !unlocked.has(id) && !focus.has(id);
        P[id].forEach((e) => { if (isGhost(e)) return; e.style.transition = "opacity .45s, filter .45s";
          e.style.opacity = dim && !asking ? "0.3" : "";
          e.style.filter = marks[id] === "right" ? "drop-shadow(0 0 5px #16a34a) drop-shadow(0 0 2px #16a34a)" : marks[id] === "wrong" ? "drop-shadow(0 0 5px #dc2626) drop-shadow(0 0 2px #dc2626)"
            : asking && asking.ring.includes(id) ? "drop-shadow(0 0 5px #7c3aed) drop-shadow(0 0 2px #7c3aed)" : focus.has(id) ? "url(#kGlow)" : ""; }); } }
    let banner = null; const setBanner = (txt) => { if (banner) { banner.remove(); banner = null; } if (!txt) return; const host = doc.querySelector(".mainv") || svg.parentNode; host.style.position = "relative";
      banner = doc.createElement("div"); banner.className = "mbx-banner"; banner.textContent = txt; host.appendChild(banner); };

    /* ---- which part did a finger mean? tubes are a few px wide on a phone, so probe a ring around the touch and
     * prefer the most specific part (fewest drawn pixels), so a tap near a tube is not swallowed by the interstitium */
    const owner = new Map(); const index = () => { owner.clear(); const P = K.parts(); for (const id in P) P[id].forEach((e) => owner.set(e, id)); };
    const partAt = (el) => { for (let n = el; n && n !== svg; n = n.parentNode) if (owner.has(n)) return owner.get(n); return null; };
    const area = {}; function areaOf(id) { if (area[id] != null) return area[id]; let a = 0; (K.parts()[id] || []).forEach((e) => { try { const b = e.getBBox(); a += b.width * b.height; } catch (_) {} }); return (area[id] = a || 1e9); }
    function hit(x, y) { const votes = {}; const R = [0, 7, 14];
      R.forEach((r, ri) => { const n = r ? 8 : 1; for (let k = 0; k < n; k++) { const a = k / n * 2 * Math.PI, el = doc.elementFromPoint(x + r * Math.cos(a), y + r * Math.sin(a));
        const id = el && partAt(el); if (id) votes[id] = (votes[id] || 0) + (3 - ri); } });
      const ids = Object.keys(votes); if (!ids.length) return null;
      ids.sort((p, q) => (votes[q] / Math.sqrt(areaOf(q))) - (votes[p] / Math.sqrt(areaOf(p)))); return ids[0]; }

    /* the phase a part is busiest in — where "Learn it anyway" takes the stage */
    function phaseOf(id) { const S = A.samples, score = {}; S.forEach((s) => { const p = s.parts && s.parts[id]; const v = (p && (p.active || 0)) + (s.parcel && s.parcel.part === id ? 1 : 0); if (v) score[s.phase] = (score[s.phase] || 0) + v; });
      const best = Object.keys(score).sort((a, b) => score[b] - score[a])[0]; return best || null; }

    /* ---- popover */
    let pop = null; const closePop = () => { if (pop) { pop.remove(); pop = null; } };
    function showPop(id, x, y) { closePop(); const P = PARTS[id] || {}, host = svg.parentNode; host.style.position = "relative";
      const covered = P.covered || unlocked.has(id);
      pop = doc.createElement("div"); pop.className = "mbx-pop"; pop.setAttribute("role", "dialog");
      const qs = (P.qs || []).slice(0, 3);   // Ask the plate (feature 6): three ready questions about this part
      pop.innerHTML = "<button class='x' aria-label='Close'>×</button><b></b><span class='tg'></span><p></p>" + (qs.length ? "<div class='qs'>" + qs.map((q, i) => "<button class='q' data-i='" + i + "'></button>").join("") + "<button class='own'>or ask your own ↓</button></div>" : "") + (covered ? "" : "<button class='go'>Learn it anyway</button>");
      pop.querySelectorAll(".q").forEach((b) => { const q = qs[+b.dataset.i]; b.textContent = q; b.onclick = (e) => { e.stopPropagation(); closePop(); up({ type: "mbx-askq", id, q }); }; });
      const own = pop.querySelector(".own"); if (own) own.onclick = (e) => { e.stopPropagation(); closePop(); up({ type: "mbx-askown", id }); };
      pop.querySelector("b").textContent = P.name || id;
      const tg = pop.querySelector(".tg"); tg.className = "tg " + (P.covered ? "in" : "out"); tg.textContent = P.covered ? "In your note" : unlocked.has(id) ? "Extra · you opened this" : "Not in your note";
      pop.querySelector("p").textContent = P.covered ? "The lines about it are highlighted in your note." : (P.shows || "");
      pop.querySelector(".x").onclick = (e) => { e.stopPropagation(); closePop(); };
      const go = pop.querySelector(".go"); if (go) go.onclick = (e) => { e.stopPropagation(); unlocked.add(id); paint(); closePop(); up({ type: "mbx-learn", id, phase: phaseOf(id) }); };
      if (qs.length) {   // with questions the card needs room: place it on the whole page, not inside a narrow (lens-split) stage
        if (P.covered) pop.querySelector("p").remove();
        pop.style.width = Math.min(270, innerWidth - 16) + "px"; doc.body.appendChild(pop); const W = pop.offsetWidth, H = pop.offsetHeight;
        pop.style.left = (Math.max(8, Math.min(innerWidth - W - 8, x - W / 2)) + scrollX) + "px";
        pop.style.top = ((y - H - 14 > 4 ? y - H - 14 : y + 18) + scrollY) + "px"; return; }
      host.appendChild(pop);
      const hr = host.getBoundingClientRect(), W = pop.offsetWidth, H = pop.offsetHeight, lx = x - hr.left, ly = y - hr.top;
      pop.style.left = Math.max(6, Math.min(hr.width - W - 6, lx - W / 2)) + "px";
      pop.style.top = Math.max(4, ly - H - 14 > 4 ? ly - H - 14 : Math.min(hr.height - H - 4, ly + 18)) + "px"; }

    svg.addEventListener("click", (ev) => { if (!linked) return; const id = hit(ev.clientX, ev.clientY);
      if (asking) { if (id) up({ type: "mbx-pick", id }); return; }
      if (!id || !PARTS[id]) { closePop(); return; } showPop(id, ev.clientX, ev.clientY); up({ type: "mbx-tap", id, covered: !!PARTS[id].covered }); });

    /* ---- height + play state for the parent */
    // the content's own height (body), not scrollHeight: that never shrinks below the iframe's current height, so it could only ever grow
    const report = () => { const b = doc.body, cs = getComputedStyle(b); up({ type: "mbx-height", h: Math.ceil(b.getBoundingClientRect().height + parseFloat(cs.marginTop) + parseFloat(cs.marginBottom)) }); };
    try { new ResizeObserver(report).observe(doc.body); } catch (_) { setInterval(report, 1000); }
    let wasPlaying = null; setInterval(() => { const p = A.isPlaying(); if (p !== wasPlaying) { wasPlaying = p; up({ type: "mbx-playing", on: p }); } }, 250);

    window.addEventListener("message", (e) => { const m = e.data || {}; if (typeof m.type !== "string" || m.type.indexOf("mbx-") !== 0) return;
      if (m.type === "mbx-link") { linked = true; PARTS = m.parts || {}; unlocked = new Set(m.unlocked || []); theme(!!m.dark);
        doc.documentElement.classList.add("mbx-linked"); doc.documentElement.classList.toggle("mbx-mini", !!m.mini); A.stopTutor(); index(); paint(); setTimeout(report, 50); }
      else if (m.type === "mbx-show") { closePop(); A.stopTutor(); if (Array.isArray(m.win) && A.seekTime) A.seekTime(m.win[0]); else if (m.phase) A.goPhase(m.phase);
        if (A.lens) A.lens(m.lens || null); focus = new Set(m.focus || []); paint();
        if (m.speed) A.setSpeed(m.speed); A.setPlaying(m.play !== false); }
      else if (m.type === "mbx-play") A.setPlaying(!!m.on);
      else if (m.type === "mbx-theme") theme(!!m.dark);
      else if (m.type === "mbx-unlock") { unlocked.add(m.id); paint(); }
      else if (m.type === "mbx-pop-close") closePop();
      else if (m.type === "mbx-ask") { closePop(); A.stopTutor(); A.setPlaying(false); if (A.lens) A.lens(null); if (m.before && A.before) A.before(m.before); asking = { ring: m.ring || [] }; marks = {}; setBanner(m.banner || ""); paint(); }
      else if (m.type === "mbx-ask-end") { asking = null; setBanner(""); marks = {}; ((m.mark || {}).right || []).forEach((id) => (marks[id] = "right")); ((m.mark || {}).wrong || []).forEach((id) => (marks[id] = "wrong")); paint();
        if (Object.keys(marks).length) setTimeout(() => { marks = {}; paint(); }, 2600); }
      else if (m.type === "mbx-params") { try { window.__studio.setParams && window.__studio.setParams(m.params || {}); } catch (e) {} }
      else if (m.type === "mbx-phase-step") { if (A.stepPhase) A.stepPhase(m.dir); } });
    let lastPhase = null; setInterval(() => { const ph = A.phaseAt ? A.phaseAt() : null; if (ph !== lastPhase) { lastPhase = ph; up({ type: "mbx-phase", phase: ph }); } }, 200);

    const fallback = A.lesson && A.lesson.steps ? { steps: A.lesson.steps.map(({ title, phase, focus, speed, say }) => ({ title, phase, focus, speed, say })) } : null;   // the plate's default lesson, minus baked audio
    up({ type: "mbx-linked", whatif: !!window.__studio.setParams, parts: Object.keys(K.parts()), phases: [...new Set(A.bands.map((b) => b.name))], lesson: fallback });
  });
})();
