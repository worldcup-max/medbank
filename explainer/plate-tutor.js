/* MedBank · 3D Tutor for LIBRARY PLATES — the student's note drives the tutor.
 *
 * The plate (explainer/library/<course>/<id>/<id>.html) is the stage; the student's note is the script.
 * The lesson comes from POST /explainer/plate (import-server/plate-tutor.mjs): stops in note order, each citing note
 * lines L1…Ln and pointing at real manifest phases/parts. This file shows the note beside the plate and links them
 * both ways:
 *   · the line being explained is highlighted while the plate shows it
 *   · tap a note line → the plate jumps there;  tap a part → the note lines about it light up
 *   · parts the note never mentions are dimmed and silent; tapping one offers "Learn it anyway"
 *   · a number in the note that disagrees with the plate is underlined, and the tutor says so once (never corrects silently)
 * Phone: plate on top, note in a bottom sheet (current line + controls; pull up for the whole note).
 * Laptop: note in a rail on the right. The plate keeps ALL its own content (lenses, legend, ledger, live numbers, chart).
 *
 *   MBPlate.mount(host, { plate, note, getLesson, speak, stopSpeak, warm, isDark })  → { destroy }
 *   MBPlate.match(text) → plate entry or null
 */
(function () {
  const BASE = (document.currentScript && document.currentScript.src) ? new URL(".", document.currentScript.src).href : "explainer/";
  /* library plates the app can open (keep in step with explainer/library/<course>.json "built" entries) */
  const PLATES = [
    { id: "nephron-urine-journey", course: "physiology", title: "How the nephron makes urine",
      re: /\bnephron|urine (formation|concentration)|loop of henle|countercurrent|tubular (reabsorption|function)|glomerular filtration\b/i },
    { id: "cardiac-cycle-wiggers", course: "physiology", title: "The cardiac cycle",
      re: /\bcardiac cycle|wiggers|heart sounds|pressure.volume loop|systole and diastole\b/i },
  ].map((p) => ({ ...p, src: BASE + "library/" + p.course + "/" + p.id + "/" + p.id + ".html", manifest: BASE + "library/" + p.course + "/" + p.id + "/manifest.json" }));
  const match = (text) => PLATES.find((p) => p.re.test(String(text || ""))) || null;

  /* keep identical to splitNote in import-server/plate-tutor.mjs: line ids are the contract */
  function splitNote(md) {
    const out = []; let n = 0;
    const push = (text, h) => { text = text.replace(/\*\*|__|`/g, "").replace(/\s+/g, " ").trim(); if (text.length > 1) out.push({ id: "L" + (++n), h: !!h, text }); };
    for (const raw of String(md || "").replace(/\r/g, "").split("\n")) {
      const s = raw.trim(); if (!s || /^#\s/.test(s) || /^[-*_]{3,}$/.test(s)) continue;
      if (/^#{2,6}\s/.test(s)) { push(s.replace(/^#+\s*/, ""), true); continue; }
      const body = s.replace(/^([-*+•]|\d+[.)])\s+/, "");
      if (body.length <= 260) { push(body); continue; }
      let buf = ""; for (const sen of body.split(/(?<=[.!?])\s+(?=[A-Z(])/)) { if (buf && (buf + " " + sen).length > 240) { push(buf); buf = sen; } else buf = buf ? buf + " " + sen : sen; } push(buf);
      if (n >= 400) break;
    }
    return out;
  }

  const esc = (s) => String(s == null ? "" : s).replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));
  const sentences = (x) => String(x || "").split(/(?<=[.!?])\s+/).filter(Boolean);
  const store = { get(k, d) { try { const v = localStorage.getItem(k); return v ? JSON.parse(v) : d; } catch (_) { return d; } }, set(k, v) { try { localStorage.setItem(k, JSON.stringify(v)); } catch (_) {} } };

  const CSS = `
.mbp{--mbp-hl:color-mix(in srgb,var(--accent) 15%,transparent);display:grid;gap:12px;position:relative}
.mbp.wide{grid-template-columns:minmax(0,1.6fr) minmax(280px,1fr);align-items:start}
.mbp-stage{border:1px solid var(--line);border-radius:14px;background:var(--panel);overflow:hidden;position:relative}
.mbp-stage iframe{display:block;width:100%;height:520px;border:0;background:transparent}
.mbp-stage .mbp-load{position:absolute;inset:0;display:flex;align-items:center;justify-content:center;color:var(--dim);font-size:14px;background:var(--panel)}
.mbp-eb{font-size:11.5px;font-weight:700;letter-spacing:.06em;text-transform:uppercase;color:var(--dimmer);display:flex;align-items:center;gap:8px}
.mbp-eb .mbp-sp{flex:1}
.mbp-cap{font-size:15px;line-height:1.5;color:var(--text);min-height:1.5em}
.mbp-cap.dim{color:var(--dim)}
.mbp-ln{display:flex;gap:8px;align-items:flex-start;padding:7px 10px;border-radius:9px;font-size:14px;line-height:1.45;color:var(--dim);cursor:pointer;-webkit-tap-highlight-color:transparent}
.mbp-ln:hover{background:color-mix(in srgb,var(--text) 5%,transparent)}
.mbp-ln.h{font-weight:700;color:var(--text);font-size:13.5px;padding-top:13px}
.mbp-ln.on{background:var(--mbp-hl);color:var(--text);box-shadow:inset 3px 0 0 var(--accent)}
.mbp-ln.pt{background:color-mix(in srgb,var(--accent) 8%,transparent);color:var(--text);box-shadow:inset 3px 0 0 color-mix(in srgb,var(--accent) 45%,transparent)}
.mbp-ln.skip{opacity:.62}
.mbp-ln .mbp-tx{flex:1;min-width:0}
.mbp-badge{flex:none;font-size:11px;font-weight:600;color:var(--dimmer);border:1px solid var(--line);border-radius:99px;padding:0 8px;margin-top:2px;white-space:nowrap}
.mbp-flag{text-decoration:underline wavy #d97706;text-decoration-thickness:1.5px;text-underline-offset:2px;text-decoration-skip-ink:none;background:color-mix(in srgb,#d97706 14%,transparent);border-radius:4px;padding:0 2px;cursor:pointer}
.mbp-tip{margin:2px 10px 6px 13px;padding:8px 10px;border-radius:9px;font-size:13px;line-height:1.45;background:color-mix(in srgb,#d97706 12%,transparent);color:var(--text)}
.mbp-tip b{font-weight:700}
.mbp-bar{display:flex;align-items:center;gap:8px;min-width:0}
.mbp-b{flex:none;width:46px;height:46px;border-radius:12px;border:1px solid var(--line);background:var(--panel);color:var(--text);font-size:17px;display:inline-flex;align-items:center;justify-content:center;cursor:pointer;padding:0}
.mbp-b.p{background:var(--accent);border-color:var(--accent);color:#fff;width:58px}
.mbp-dots{flex:1;display:flex;justify-content:safe center;align-items:center;min-width:0;overflow:hidden}
.mbp-dots button{flex:none;border:0;background:transparent;padding:10px 2.5px;cursor:pointer;display:inline-flex}
.mbp-dots i{display:block;width:7px;height:7px;border-radius:4px;background:var(--line);transition:width .2s}
.mbp-dots .d i{background:color-mix(in srgb,var(--accent) 45%,transparent)}.mbp-dots .on i{background:var(--accent);width:18px}
.mbp-dots .w i{border-radius:1px}
.mbp-rail{grid-template-columns:minmax(0,1fr);border:1px solid var(--line);border-radius:14px;background:var(--panel);padding:12px 10px 12px;position:sticky;top:12px;max-height:calc(100vh - 24px);overflow:auto;display:grid;gap:2px;align-content:start}
.mbp-under{display:grid;gap:10px}.mbp-under:empty{display:none}
.mbp-head{position:sticky;top:-12px;z-index:2;background:var(--panel);margin:-12px -10px 0;min-width:0;padding:12px 12px 12px;border-bottom:1px solid var(--line);display:grid;grid-template-columns:minmax(0,1fr);gap:8px}
.mbp-head .mbp-cap{font-size:14.5px}
.mbp-head .mbp-bar{flex-wrap:wrap;row-gap:2px}.mbp-head .mbp-dots{order:9;flex:1 0 100%;justify-content:flex-start}.mbp-head [data-a="voice"]{margin-left:auto}
.mbp-sheet{grid-template-columns:minmax(0,1fr);position:fixed;left:0;right:0;bottom:0;z-index:60;background:var(--panel);border-top:1px solid var(--line);border-radius:18px 18px 0 0;
 box-shadow:0 -10px 30px rgba(0,0,0,.14);padding:6px 14px calc(12px + env(safe-area-inset-bottom,0px));display:grid;gap:9px;max-width:100vw}
.mbp-grab{justify-self:center;width:64px;height:22px;border:0;background:transparent;cursor:grab;display:flex;align-items:center;justify-content:center;touch-action:none}
.mbp-grab::before{content:"";width:40px;height:4px;border-radius:2px;background:var(--line)}
.mbp-cur{display:grid;gap:2px;max-height:24vh;overflow:auto}
.mbp-sheet .mbp-cap{font-size:13.5px;line-height:1.45;color:var(--dim);display:-webkit-box;-webkit-line-clamp:3;-webkit-box-orient:vertical;overflow:hidden;min-height:0}
.mbp-sheet .mbp-cap.dim{color:var(--dimmer)}
.mbp-more{border:0;background:transparent;color:var(--dim);font-size:13px;padding:2px;cursor:pointer;justify-self:center}
.mbp-sheet .mbp-all{display:none}
.mbp-sheet.up{top:9vh}.mbp-sheet.up .mbp-all{display:grid;gap:2px;overflow:auto;align-content:start}.mbp-sheet.up .mbp-cur{display:none}
.mbp-sheet.up{grid-template-rows:auto auto minmax(0,1fr) auto auto auto}
html[data-theme="dark"] .mbp-sheet{box-shadow:0 -10px 30px rgba(0,0,0,.5)}
@media (prefers-reduced-motion:reduce){.mbp *{transition:none!important}}`;

  function mount(host, o) {
    if (!document.getElementById("mbp-css")) { const st = document.createElement("style"); st.id = "mbp-css"; st.textContent = CSS; document.head.appendChild(st); }
    const P = o.plate, lines = splitNote(o.note), LI = new Map(lines.map((l, i) => [l.id, i]));
    const ukey = "mbp-unlock:" + P.id;
    const st = { lesson: null, stops: [], k: -1, j: 0, playing: false, through: false, voice: o.voice !== false, token: 0, mode: "loading",
      manifest: null, linked: false, unlocked: new Set(store.get(ukey, [])), flagSaid: new Set(), partLines: new Set(), tipOpen: null, fallback: null };
    let destroyed = false;

    host.innerHTML = `<div class="mbp">
      <div class="mbp-main" style="display:grid;gap:10px;min-width:0">
        <div class="mbp-stage"><iframe title="${esc(P.title)} — interactive plate" loading="eager"></iframe><div class="mbp-load">Opening the plate…</div></div>
        <div class="mbp-under"></div>
      </div>
      <aside class="mbp-note"></aside></div>`;
    const root = host.firstElementChild, frame = root.querySelector("iframe"), under = root.querySelector(".mbp-under"), aside = root.querySelector(".mbp-note");
    const post = (m) => { try { frame.contentWindow.postMessage(m, "*"); } catch (_) {} };

    /* ---------- layout: rail on wide hosts, bottom sheet on phones ---------- */
    let wide = null, spacer = null;
    function layout() { const w = host.clientWidth >= 860; if (w === wide) return; wide = w; root.classList.toggle("wide", w); build(); }
    function build() {
      const capHtml = `<div class="mbp-eb"><span class="mbp-where"></span><span class="mbp-sp"></span></div><div class="mbp-cap"></div>`;
      const barHtml = `<div class="mbp-bar"><button class="mbp-b" data-a="prev" aria-label="Previous stop"><svg width="18" height="18" viewBox="0 0 20 20" aria-hidden="true"><rect x="3" y="4" width="2.6" height="12" rx="1" fill="currentColor"/><path d="M17 4.5v11L7.5 10z" fill="currentColor"/></svg></button><button class="mbp-b p" data-a="play" aria-label="Play">▶</button><button class="mbp-b" data-a="next" aria-label="Next stop"><svg width="18" height="18" viewBox="0 0 20 20" aria-hidden="true"><rect x="14.4" y="4" width="2.6" height="12" rx="1" fill="currentColor"/><path d="M3 4.5v11L12.5 10z" fill="currentColor"/></svg></button><div class="mbp-dots" role="tablist" aria-label="Stops"></div><button class="mbp-b" data-a="voice" aria-label="Voice">🔈</button></div>`;
      if (spacer) { spacer.remove(); spacer = null; }
      if (wide) { aside.className = "mbp-note mbp-rail"; aside.innerHTML = `<div class="mbp-head">${capHtml}${barHtml}</div><div class="mbp-eb" style="padding:8px 6px 4px">Your note<span class="mbp-sp"></span><span class="mbp-sum" style="text-transform:none;letter-spacing:0;font-weight:500"></span></div><div class="mbp-all" style="display:grid;gap:2px"></div>`;
        under.innerHTML = ""; }
      else { aside.className = "mbp-note mbp-sheet"; aside.innerHTML = `<button class="mbp-grab" aria-label="Show your whole note"></button>${capHtml.replace('<div class="mbp-cap"></div>', "")}<div class="mbp-cur"></div><div class="mbp-all"></div><div class="mbp-cap"></div><button class="mbp-more"></button>${barHtml}`;
        under.innerHTML = ""; spacer = document.createElement("div"); root.after(spacer); }
      wire(); renderLines(); renderDots(); renderNow(); sizeSpacer(); }
    const sizeSpacer = () => { if (spacer) spacer.style.height = (aside.classList.contains("up") ? 260 : aside.offsetHeight + 16) + "px"; };
    const ro = new ResizeObserver(() => { layout(); sizeSpacer(); }); ro.observe(host);

    /* ---------- the note ---------- */
    const stopOfLine = (id) => st.stops.findIndex((s) => (s.lines || []).includes(id));
    const wordsLines = () => new Set(st.stops.filter((s) => s.words).flatMap((s) => s.lines));
    function lineHtml(l) {
      const f = (st.lesson && st.lesson.flags || []).find((x) => x.line === l.id);
      let tx = esc(l.text);
      if (f) tx = tx.replace(new RegExp("(~|≈|about )?" + f.noteSays.replace(".", "\\."), ""), (m) => `<span class="mbp-flag" data-flag="${l.id}" role="button" tabindex="0" aria-label="Check this number">${m}</span>`);
      const k = stopOfLine(l.id), cur = st.k >= 0 && st.stops[st.k] && st.stops[st.k].lines.includes(l.id);
      const cls = ["mbp-ln", l.h ? "h" : "", cur ? "on" : "", !cur && st.partLines.has(l.id) ? "pt" : "", st.lesson && !l.h && k < 0 && !st.partLines.has(l.id) ? "skip" : ""].join(" ");
      const badge = wordsLines().has(l.id) && !l.h ? `<span class="mbp-badge" title="The plate can't show this; the tutor explains it in words">in words</span>` : "";
      const tip = f && st.tipOpen === l.id ? `<div class="mbp-tip">Your note: <b>~${esc(f.noteSays)}</b> · Plate (${esc(o.sourceLabel || "Guyton & Hall")}): <b>~${esc(f.plateSays)}</b>. Worth checking with your lecturer — the plate never overrides your note.</div>` : "";
      return `<div class="${cls}" data-l="${l.id}"><span class="mbp-tx">${tx}</span>${badge}</div>${tip}`; }
    function renderLines() {
      const all = aside.querySelector(".mbp-all"); if (all) all.innerHTML = lines.map(lineHtml).join("");
      const sum = aside.querySelector(".mbp-sum"); if (sum) sum.textContent = summary();
      const cur = aside.querySelector(".mbp-cur"); if (cur) { const s = st.stops[st.k]; let ids = s ? s.lines.filter((x) => !lines[LI.get(x)].h) : [];
        if (st.partLines.size && (!s || st.mode === "part")) ids = [...st.partLines];
        if (!ids.length) ids = lines.filter((l) => !l.h).slice(0, 1).map((l) => l.id);
        cur.innerHTML = ids.slice(0, 3).map((x) => lineHtml(lines[LI.get(x)])).join(""); }
      const more = aside.querySelector(".mbp-more"); if (more) more.textContent = aside.classList.contains("up") ? "⌄ Back to the plate" : "⌃ Your whole note" + (summary() ? " · " + summary() : "");
      scrollToOn(); }
    function summary() { if (!st.manifest || !st.lesson || st.mode === "fallback") return ""; const n = uncovered().length; return n ? n + " plate part" + (n > 1 ? "s" : "") + " not in it" : ""; }
    function scrollToOn() { const box = wide ? aside : aside.querySelector(aside.classList.contains("up") ? ".mbp-all" : ".mbp-cur"); const on = box && box.querySelector(".mbp-ln.on, .mbp-ln.pt");
      if (!on || box.scrollHeight <= box.clientHeight) return; const top = on.getBoundingClientRect().top - box.getBoundingClientRect().top + box.scrollTop - 24 - (wide ? (aside.querySelector(".mbp-head") || {}).offsetHeight || 0 : 0);
      box.scrollTo({ top, behavior: matchMedia("(prefers-reduced-motion: reduce)").matches ? "auto" : "smooth" }); }

    /* ---------- now-playing ---------- */
    function where(txt) { aside.closest(".mbp").querySelectorAll(".mbp-where").forEach((e) => (e.textContent = txt)); }
    function caption(txt, dim) { root.querySelectorAll(".mbp-cap").forEach((e) => { e.textContent = txt; e.classList.toggle("dim", !!dim); }); }
    function sectionOf(id) { for (let i = LI.get(id); i >= 0; i--) if (lines[i].h) return lines[i].text.replace(/^\d+[.)]\s*/, "").replace(/\s+[—–-].*$/, ""); return ""; }
    function renderNow() {
      const s = st.stops[st.k];
      if (st.mode === "loading") { where("Your note"); caption("Matching your note to the plate…", true); }
      else if (st.mode === "learn") {}
      else if (st.mode === "part") {}
      else if (!s) { where(st.mode === "fallback" ? "Standard lesson · not matched to your note" : "Your note on this plate"); caption(st.mode === "fallback" ? (st.fallbackWhy || "Press play for the standard walk-through.") : "Press play and the tutor walks through your note on the plate — or tap any line.", true); }
      else where((s.words ? "In words · " : "From your note · ") + (sectionOf(s.lines[0]) || s.title));
      const pb = root.querySelector('[data-a="play"]'); if (pb) { pb.textContent = st.playing ? "❚❚" : "▶"; pb.setAttribute("aria-label", st.playing ? "Pause" : "Play"); }
      const vb = root.querySelector('[data-a="voice"]'); if (vb) { vb.textContent = st.voice ? "🔈" : "🔇"; vb.setAttribute("aria-pressed", String(!st.voice)); vb.title = st.voice ? "Voice on" : "Voice off (captions only)"; }
      renderDots(); }
    function renderDots() { const d = root.querySelector(".mbp-dots"); if (!d) return;
      d.innerHTML = st.stops.map((s, k) => `<button role="tab" aria-label="Stop ${k + 1}: ${esc(s.title)}" aria-selected="${k === st.k}" class="${k < st.k ? "d" : k === st.k ? "on" : ""} ${s.words ? "w" : ""}" data-k="${k}"><i></i></button>`).join(""); }

    /* ---------- the plate ---------- */
    const uncovered = () => !st.manifest || !st.lesson || st.mode === "fallback" ? [] : st.manifest.parts.map((p) => p.id).filter((id) => !(st.lesson && st.lesson.mentions && st.lesson.mentions[id]));
    function linkPlate() { if (!st.linked || !st.manifest) return; const un = new Set(uncovered()), parts = {};
      st.manifest.parts.forEach((p) => { parts[p.id] = { name: p.name, shows: p.shows, covered: !un.has(p.id) }; });
      post({ type: "mbx-link", parts, unlocked: [...st.unlocked], dark: o.isDark ? o.isDark() : false }); }
    frame.addEventListener("load", () => { try { const d = frame.contentDocument, s = d.createElement("script"); s.src = BASE + "studio/tutor-link.js"; d.head.appendChild(s); } catch (e) { console.warn("[plate] tutor-link not injected", e); } });
    frame.src = P.src;
    function onMsg(e) { if (e.source !== frame.contentWindow) return; const m = e.data || {};
      if (m.type === "mbx-linked") { st.linked = true; st.fallback = m.lesson || null; const ld = root.querySelector(".mbp-load"); if (ld) ld.remove(); linkPlate(); if (st.mode === "fallback") useFallback(); }
      else if (m.type === "mbx-height") frame.style.height = Math.max(320, m.h) + "px";
      else if (m.type === "mbx-tap") { st.partLines = new Set((st.lesson && st.lesson.mentions && st.lesson.mentions[m.id]) || []);
        if (st.partLines.size) { haltSpeech(); st.mode = "part"; const nm = (st.manifest.parts.find((p) => p.id === m.id) || {}).name || m.id; where("Your note on the " + nm.toLowerCase()); caption(st.partLines.size + " line" + (st.partLines.size > 1 ? "s" : "") + " of your note about it — tap one to play it.", true); }
        renderLines(); }
      else if (m.type === "mbx-learn") learn(m.id, m.phase); }
    window.addEventListener("message", onMsg);
    const mo = new MutationObserver(() => post({ type: "mbx-theme", dark: o.isDark ? o.isDark() : false })); mo.observe(document.documentElement, { attributes: true, attributeFilter: ["data-theme"] });

    /* ---------- playing a stop ---------- */
    function haltSpeech() { st.token++; st.playing = false; try { o.stopSpeak && o.stopSpeak(); } catch (_) {} }
    function say(text, done) { const tok = st.token, fin = () => { if (tok === st.token && !destroyed) done(); };
      if (!st.voice || !o.speak) return setTimeout(fin, 900 + text.length * 52);
      let called = false; const once = () => { if (!called) { called = true; fin(); } }; try { o.speak(text, once); } catch (_) { setTimeout(once, 900 + text.length * 52); } }
    function goStop(k, play) {
      const s = st.stops[k]; if (!s) return; haltSpeech(); st.mode = "lesson"; st.k = k; st.j = 0; st.partLines = new Set(); st.playing = !!play;
      if (s.words) post({ type: "mbx-show", focus: [], lens: null, play: false }); else post({ type: "mbx-show", phase: s.phase, focus: s.focus, lens: s.lens || null, win: s.win || null, speed: s.speed, play: true });
      renderLines(); renderNow(); caption(s.say); if (play) speak(); }
    function speak() { const s = st.stops[st.k]; if (!s) return; st.playing = true; renderNow();
      const parts = sentences(s.say); const f = (st.lesson.flags || []).find((x) => s.lines.includes(x.line) && !st.flagSaid.has(x.line));
      if (f) parts.push(f.say);
      o.warm && o.warm(parts.slice(st.j, st.j + 3));
      const next = () => { if (st.j >= parts.length) { if (f) st.flagSaid.add(f.line);
          if (st.through && st.k + 1 < st.stops.length) { const tok = st.token; setTimeout(() => { if (tok === st.token) goStop(st.k + 1, true); }, 700); }
          else { st.playing = false; st.through = false; renderNow(); } return; }
        const t = parts[st.j++]; caption(t); say(t, next); };
      next(); }
    function togglePlay() {
      if (st.mode === "loading") { caption("Still reading your note — the plate is yours to explore meanwhile.", true); return; }
      if (st.playing) { haltSpeech(); post({ type: "mbx-play", on: false }); renderNow(); return; }
      st.through = true;
      if (st.k < 0 || st.mode !== "lesson" || st.j >= sentences(st.stops[st.k].say).length + 1) goStop(st.k < 0 || st.mode !== "lesson" ? Math.max(0, st.k) : (st.k + 1) % st.stops.length, true);
      else { post({ type: "mbx-play", on: !st.stops[st.k].words }); st.j = Math.max(0, st.j - 1); speak(); } }
    function learn(id, phase) {
      const p = st.manifest && st.manifest.parts.find((x) => x.id === id); if (!p) return;
      haltSpeech(); st.mode = "learn"; st.unlocked.add(id); store.set(ukey, [...st.unlocked]);
      post({ type: "mbx-show", phase, focus: [id], lens: null, speed: 0.5, play: true }); where("Extra · not in your note · " + p.name); renderLines(); renderNow();
      const text = p.shows; caption(text); st.playing = true; renderNow(); say(text, () => { st.playing = false; renderNow(); }); }

    /* ---------- events ---------- */
    function wire() {
      root.querySelectorAll("[data-a]").forEach((b) => b.onclick = () => { const a = b.dataset.a;
        if (a === "play") togglePlay();
        else if (a === "prev") { st.through = false; goStop(Math.max(0, st.k - 1), true); }
        else if (a === "next") { st.through = false; goStop(Math.min(st.stops.length - 1, st.k + 1), true); }
        else if (a === "voice") { st.voice = !st.voice; store.set("mbp-voice", st.voice); if (!st.voice) { try { o.stopSpeak && o.stopSpeak(); } catch (_) {} } renderNow(); } });
      aside.onclick = (e) => {
        const fl = e.target.closest("[data-flag]"); if (fl) { st.tipOpen = st.tipOpen === fl.dataset.flag ? null : fl.dataset.flag; renderLines(); e.stopPropagation(); return; }
        const ln = e.target.closest(".mbp-ln"); if (ln) { const k = stopOfLine(ln.dataset.l); if (k >= 0) { st.through = false; goStop(k, true); if (!wide && aside.classList.contains("up")) sheet(false); } return; }
        if (e.target.closest(".mbp-more")) sheet(!aside.classList.contains("up")); };
      const d = root.querySelector(".mbp-dots"); if (d) d.onclick = (e) => { const b = e.target.closest("[data-k]"); if (b) { st.through = false; goStop(+b.dataset.k, true); } };
      const g = aside.querySelector(".mbp-grab"); if (g) { let y0 = null;
        g.onpointerdown = (e) => { y0 = e.clientY; g.setPointerCapture(e.pointerId); };
        g.onpointerup = (e) => { const dy = y0 == null ? 0 : e.clientY - y0; y0 = null; sheet(Math.abs(dy) < 8 ? !aside.classList.contains("up") : dy < 0); }; } }
    function sheet(upOn) { aside.classList.toggle("up", upOn); renderLines(); sizeSpacer(); if (upOn) setTimeout(scrollToOn, 30); }

    /* ---------- lesson ---------- */
    function useLesson(lesson) { st.lesson = lesson; st.stops = lesson.steps || []; st.mode = "ready"; st.k = -1; linkPlate(); renderLines(); renderNow(); sizeSpacer(); }
    function useFallback(why) { if (why) st.fallbackWhy = why; st.mode = "fallback";
      if (st.fallback && st.fallback.steps) { st.lesson = { steps: st.fallback.steps.map((s) => ({ ...s, lines: [] })), mentions: null, flags: [] }; st.stops = st.lesson.steps; st.mode = "fallback"; }
      linkPlate(); renderLines(); renderNow(); }
    st.voice = store.get("mbp-voice", st.voice);
    layout();
    fetch(P.manifest).then((r) => r.json()).then((m) => { st.manifest = m; linkPlate(); renderLines(); }).catch(() => {});
    Promise.resolve(o.lesson || (o.getLesson ? o.getLesson() : null)).then((l) => { if (destroyed) return;
      if (l && l.steps && l.steps.length) useLesson(l); else useFallback("Your note couldn't be matched to this plate right now, so this is the plate's standard walk-through.");
      if (st.mode === "fallback") { const ff = st.fallback; if (ff) useFallback(); } })
      .catch((e) => { if (!destroyed) useFallback((e && e.message) || ""); });

    function destroy() { if (destroyed) return; destroyed = true; haltSpeech(); clearInterval(watch); ro.disconnect(); mo.disconnect(); window.removeEventListener("message", onMsg); if (spacer) spacer.remove(); if (root.isConnected) host.innerHTML = ""; }
    const watch = setInterval(() => { if (!root.isConnected) destroy(); }, 800);   // the app re-renders pages by replacing HTML: stop talking when we're gone
    return { destroy, state: st, goStop, lines };
  }

  window.MBPlate = { PLATES, match, splitNote, mount };
})();
