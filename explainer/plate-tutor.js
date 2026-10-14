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
 * Three lengths (feature 2): a start card asks "How long have you got?" — Continue (where they stopped), 2-minute overview
 * (key stops, one sentence each), Full walk-through (every stop), Exam revision (high-yield stops, a note-based question
 * after each; a wrong answer replays that stop). Progress per topic goes through loadProgress/saveProgress.
 *
 * Active learning (feature 3): prediction pauses (the plate freezes before a key event and the student taps the part they
 * expect), "what if" re-runs of the plate's own model (furosemide, no ADH …) offered only where the note mentions them —
 * at that stop and/or as switches — and plate questions at the end (tap a part, or move the parcel to a phase).
 *
 * Reviews (feature 4): when the student finishes the full walk-through or exam revision, the note's exam questions are
 * handed to the app (onCards) as review cards tied to their moment on the plate; MBPlate.replay() replays that moment.
 *
 *   MBPlate.mount(host, { plate, note, getLesson, speak, stopSpeak, warm, isDark, loadProgress, saveProgress, whatifUI, onCards })  → { destroy }
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
.mbp-len{border:0;background:transparent;color:var(--accent);font:600 12px system-ui;letter-spacing:0;text-transform:none;padding:6px 2px;cursor:pointer}
.mbp-pick{display:none;gap:9px}.mbp-note.pk .mbp-pick{display:grid}
.mbp-note.pk .mbp-cur,.mbp-note.pk .mbp-cap,.mbp-note.pk .mbp-more,.mbp-note.pk .mbp-bar,.mbp-note.pk .mbp-eb.mbp-now{display:none}
.mbp-sheet.pk{max-height:78vh;overflow:auto}.mbp-sheet.pk.up .mbp-all{display:none}
.mbp-h{font-size:11.5px;font-weight:700;letter-spacing:.06em;text-transform:uppercase;color:var(--dimmer)}
.mbp-c{display:flex;gap:12px;align-items:center;border:1px solid var(--line);border-radius:12px;padding:11px 13px;background:var(--panel);color:var(--text);text-align:left;width:100%;cursor:pointer;font:inherit}
.mbp-c:hover{border-color:color-mix(in srgb,var(--accent) 45%,var(--line))}.mbp-c.main{border:2px solid var(--accent);padding:10px 12px}
.mbp-c .ic{width:40px;height:40px;border-radius:10px;display:flex;align-items:center;justify-content:center;background:color-mix(in srgb,var(--accent) 12%,transparent);color:var(--accent);font:700 15px system-ui;flex:none}
.mbp-c .tx{flex:1;min-width:0;display:grid;gap:2px}.mbp-c b{font-size:14.5px}.mbp-c span{font-size:12.5px;color:var(--dim)}.mbp-c em{font-style:normal;font-size:12px;color:var(--dimmer);white-space:nowrap}
.mbp-c[aria-disabled="true"]{opacity:.55;cursor:default}.mbp-c .ok{color:#15803d;font-weight:700}
.mbp-pbar{height:6px;border-radius:3px;background:var(--line);overflow:hidden;margin-top:4px}.mbp-pbar i{display:block;height:100%;background:var(--accent);border-radius:3px}
.mbp-q p{margin:0;font-size:15px;line-height:1.45;color:var(--text);font-weight:600}
.mbp-opt{text-align:left;border:1px solid var(--line);border-radius:10px;padding:11px 12px;min-height:46px;background:var(--panel);color:var(--text);font:14.5px/1.35 system-ui;cursor:pointer;display:flex;gap:10px;align-items:center}
.mbp-opt .k{flex:none;width:24px;height:24px;border-radius:50%;border:1.5px solid var(--line);display:inline-flex;align-items:center;justify-content:center;font-size:12px;font-weight:700;color:var(--dim)}
.mbp-opt.right{border-color:#16a34a;background:color-mix(in srgb,#16a34a 12%,var(--panel))}.mbp-opt.right .k{border-color:#16a34a;color:#15803d}
.mbp-opt.wrong{border-color:#dc2626;background:color-mix(in srgb,#dc2626 10%,var(--panel))}.mbp-opt.wrong .k{border-color:#dc2626;color:#b91c1c}
.mbp-why{font-size:13.5px;line-height:1.45;color:var(--text);padding:9px 11px;border-radius:9px;background:color-mix(in srgb,var(--accent) 8%,transparent)}
.mbp-row{display:flex;gap:8px;flex-wrap:wrap}.mbp-btn{min-height:44px;border-radius:10px;border:1px solid var(--line);background:var(--panel);color:var(--text);font:600 14px system-ui;padding:0 16px;cursor:pointer}
.mbp-btn.p{background:var(--accent);border-color:var(--accent);color:#fff}
.mbp-wi{display:flex;gap:7px;overflow-x:auto;padding:1px 0 3px;align-items:center}.mbp-wi .lb{font-size:11.5px;font-weight:700;letter-spacing:.06em;text-transform:uppercase;color:var(--dimmer);white-space:nowrap}
.mbp-wi button{flex:none;min-height:38px;border-radius:99px;border:1px solid var(--line);background:var(--panel);color:var(--text);font:600 13px system-ui;padding:0 13px;cursor:pointer;white-space:nowrap}
.mbp-wi button[aria-pressed="true"]{background:var(--accent);border-color:var(--accent);color:#fff}.mbp-note.pk:not(.wion) .mbp-wi{display:none}
.mbp-tbl{display:grid;grid-template-columns:minmax(0,1fr) auto auto auto;gap:5px 10px;align-items:baseline;font-size:13.5px;color:var(--text)}.mbp-tbl .l{color:var(--dim)}.mbp-tbl b{font-variant-numeric:tabular-nums;text-align:right}.mbp-tbl .a{color:var(--dimmer)}
.mbp-tbl .up{color:#b91c1c}.mbp-tbl .dn{color:#1d4ed8}html[data-theme="dark"] .mbp-tbl .up{color:#f87171}html[data-theme="dark"] .mbp-tbl .dn{color:#93c5fd}
.mbp-offer{border:1px solid color-mix(in srgb,var(--accent) 35%,var(--line));background:color-mix(in srgb,var(--accent) 6%,var(--panel));border-radius:12px;padding:12px;display:grid;gap:8px}
.mbp-src{font-size:11.5px;color:var(--dimmer)}.mbp-live{font:600 14px system-ui;color:var(--text);padding:8px 10px;border-radius:9px;background:color-mix(in srgb,var(--text) 5%,transparent)}
html[data-theme="dark"] .mbp-c .ok{color:#4ade80}html[data-theme="dark"] .mbp-opt.right .k{color:#4ade80}html[data-theme="dark"] .mbp-opt.wrong .k{color:#f87171}
.mbp-rp{display:grid;gap:6px;max-width:560px;margin:0 auto;width:100%}.mbp-rpstage{position:relative;border:1px solid var(--line);border-radius:12px;overflow:hidden;background:var(--panel)}
.mbp-rpstage iframe{display:block;width:100%;height:220px;border:0;background:transparent}.mbp-rpstage .mbp-load{position:absolute;inset:0;display:flex;align-items:center;justify-content:center;color:var(--dim);font-size:13px;background:var(--panel)}
.mbp-rpbar{display:flex;align-items:center;gap:8px}.mbp-rpb{width:34px;height:34px;border-radius:9px;border:1px solid var(--line);background:var(--panel);color:var(--text);font-size:15px;cursor:pointer}
.mbp-rpt{font:600 12px system-ui;color:var(--dimmer);font-variant-numeric:tabular-nums}.mbp-rpcap{font-size:12.5px;color:var(--dim);line-height:1.4}
@media (prefers-reduced-motion:reduce){.mbp *{transition:none!important}}`;

  function mount(host, o) {
    if (!document.getElementById("mbp-css")) { const st = document.createElement("style"); st.id = "mbp-css"; st.textContent = CSS; document.head.appendChild(st); }
    const P = o.plate, lines = splitNote(o.note), LI = new Map(lines.map((l, i) => [l.id, i]));
    const ukey = "mbp-unlock:" + P.id;
    const st = { lesson: null, stops: [], k: -1, j: 0, playing: false, through: false, voice: o.voice !== false, token: 0, mode: "loading",
      manifest: null, linked: false, tier: "full", full: [], prog: null, exam: null, picking: false, phaseNow: null, wi: null, wiFrom: null, wiOffered: new Set(), predDone: new Set(), ask: null, endQ: null, unlocked: new Set(store.get(ukey, [])), flagSaid: new Set(), partLines: new Set(), tipOpen: null, fallback: null };
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
      const capHtml = `<div class="mbp-eb mbp-now"><span class="mbp-where"></span><span class="mbp-sp"></span><button class="mbp-len" data-a="lengths">Change length</button></div><div class="mbp-cap"></div>`;
      const barHtml = `<div class="mbp-bar"><button class="mbp-b" data-a="prev" aria-label="Previous stop"><svg width="18" height="18" viewBox="0 0 20 20" aria-hidden="true"><rect x="3" y="4" width="2.6" height="12" rx="1" fill="currentColor"/><path d="M17 4.5v11L7.5 10z" fill="currentColor"/></svg></button><button class="mbp-b p" data-a="play" aria-label="Play">▶</button><button class="mbp-b" data-a="next" aria-label="Next stop"><svg width="18" height="18" viewBox="0 0 20 20" aria-hidden="true"><rect x="14.4" y="4" width="2.6" height="12" rx="1" fill="currentColor"/><path d="M3 4.5v11L12.5 10z" fill="currentColor"/></svg></button><div class="mbp-dots" role="tablist" aria-label="Stops"></div><button class="mbp-b" data-a="voice" aria-label="Voice">🔈</button></div>`;
      if (spacer) { spacer.remove(); spacer = null; }
      if (wide) { aside.className = "mbp-note mbp-rail"; aside.innerHTML = `<div class="mbp-head"><div class="mbp-wi" hidden></div><div class="mbp-pick"></div>${capHtml}${barHtml}</div><div class="mbp-eb" style="padding:8px 6px 4px">Your note<span class="mbp-sp"></span><span class="mbp-sum" style="text-transform:none;letter-spacing:0;font-weight:500"></span></div><div class="mbp-all" style="display:grid;gap:2px"></div>`;
        under.innerHTML = ""; }
      else { aside.className = "mbp-note mbp-sheet"; aside.innerHTML = `<button class="mbp-grab" aria-label="Show your whole note"></button><div class="mbp-wi" hidden></div><div class="mbp-pick"></div>${capHtml.replace('<div class="mbp-cap"></div>', "")}<div class="mbp-cur"></div><div class="mbp-all"></div><div class="mbp-cap"></div><button class="mbp-more"></button>${barHtml}`;
        under.innerHTML = ""; spacer = document.createElement("div"); root.after(spacer); }
      wire(); renderLines(); renderDots(); renderNow(); renderPick(); renderChips(); sizeSpacer(); }
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
      if (m.type === "mbx-linked") { st.linked = true; st.linkWhatif = m.whatif !== false; st.fallback = m.lesson || null; const ld = root.querySelector(".mbp-load"); if (ld) ld.remove(); linkPlate(); if (st.mode === "fallback") useFallback(); }
      else if (m.type === "mbx-height") frame.style.height = Math.max(320, m.h) + "px";
      else if (m.type === "mbx-tap") { st.partLines = new Set((st.lesson && st.lesson.mentions && st.lesson.mentions[m.id]) || []);
        if (st.partLines.size) { haltSpeech(); st.mode = "part"; const nm = (st.manifest.parts.find((p) => p.id === m.id) || {}).name || m.id; where("Your note on the " + nm.toLowerCase()); caption(st.partLines.size + " line" + (st.partLines.size > 1 ? "s" : "") + " of your note about it — tap one to play it.", true); }
        renderLines(); }
      else if (m.type === "mbx-learn") learn(m.id, m.phase);
      else if (m.type === "mbx-pick") onPick(m.id);
      else if (m.type === "mbx-phase") { st.phaseNow = m.phase; const lv = aside.querySelector(".mbp-live"); if (lv) lv.textContent = "Now: " + (m.phase || "—"); } }
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
      closePick(); renderLines(); renderNow(); caption(s.say); saveProg({ k });
      if (play && st.tier === "full" && s.predict && !st.predDone.has(s.predict) && predictionOf(s.predict)) return predict(k);
      if (play) speak(); }
    function speak() { const s = st.stops[st.k]; if (!s) return; st.playing = true; renderNow();
      const parts = sentences(s.say); const f = st.tier === "overview" ? null : (st.lesson.flags || []).find((x) => s.lines.includes(x.line) && !st.flagSaid.has(x.line));
      if (f) parts.push(f.say);
      o.warm && o.warm(parts.slice(st.j, st.j + 3));
      const next = () => { if (st.j >= parts.length) { if (f) st.flagSaid.add(f.line);
          if (st.tier === "exam" && s.quiz && !s.replay) { st.playing = false; renderNow(); ask(st.k); return; }
          if (st.tier === "full" && s.whatif && /stop|both/.test(wiUI) && !st.wiOffered.has(s.whatif) && whatifOf(s.whatif)) { st.wiOffered.add(s.whatif); st.playing = false; renderNow(); offerWhatif(s.whatif); return; }
          s.replay = false;
          if (st.through && st.k + 1 < st.stops.length) { const tok = st.token; setTimeout(() => { if (tok === st.token) goStop(st.k + 1, true); }, 700); }
          else { st.playing = false; const end = st.k === st.stops.length - 1; st.through = false; renderNow(); if (end && st.mode === "lesson") finish(); } return; }
        const t = parts[st.j++]; caption(t); say(t, next); };
      next(); }
    function togglePlay() {
      if (st.mode === "loading") { caption("Still reading your note — the plate is yours to explore meanwhile.", true); return; }
      if (st.playing) { haltSpeech(); post({ type: "mbx-play", on: false }); renderNow(); return; }
      st.through = true;
      if (st.picking && st.k < 0) { const r = resumable(); if (r) return choose(r.tier, r.k); return choose(st.lesson && st.lesson.overview && st.lesson.overview.length && false ? "overview" : "full", 0); }
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
        else if (a === "lengths") { haltSpeech(); post({ type: "mbx-play", on: false }); openPick("start"); }
        else if (a === "voice") { st.voice = !st.voice; store.set("mbp-voice", st.voice); if (!st.voice) { try { o.stopSpeak && o.stopSpeak(); } catch (_) {} } renderNow(); } });
      aside.onclick = (e) => {
        const fl = e.target.closest("[data-flag]"); if (fl) { st.tipOpen = st.tipOpen === fl.dataset.flag ? null : fl.dataset.flag; renderLines(); e.stopPropagation(); return; }
        const ln = e.target.closest(".mbp-ln"); if (ln) { let k = stopOfLine(ln.dataset.l);
          if (k < 0 && st.tier !== "full" && st.full.some((x) => x.lines.includes(ln.dataset.l))) { setTier("full"); k = stopOfLine(ln.dataset.l); }
          if (k >= 0) { st.through = false; goStop(k, true); if (!wide && aside.classList.contains("up")) sheet(false); } return; }
        if (e.target.closest(".mbp-more")) sheet(!aside.classList.contains("up"));
        const c = e.target.closest("[data-pick]"); if (c && c.getAttribute("aria-disabled") !== "true") { const [t, k] = c.dataset.pick.split(":"); choose(t, +k || 0); }
        const op = e.target.closest("[data-opt]"); if (op && st.exam && st.exam.answered == null) answer(+op.dataset.opt);
        const pk = e.target.closest("[data-pickid]"); if (pk) onPick(pk.dataset.pickid);
        const ak = e.target.closest("[data-ask]"); if (ak) { const a = ak.dataset.ask, A = st.ask;
          if (a === "choices" && A) { A.choices = true; renderPick(); } else if (a === "skip" && A) { st.predDone.add(A.q.id); st.ask = null; post({ type: "mbx-ask-end" }); closePick(); const s = st.stops[A.k]; post({ type: "mbx-show", phase: s.phase, focus: s.focus, lens: s.lens || null, win: s.win || null, speed: s.speed, play: true }); st.j = 0; speak(); }
          else if (a === "next" || a === "skipq") { post({ type: "mbx-ask-end" }); st.endQ.i++; askEnd(); } else if (a === "check") checkSeek(); else if (a === "back" || a === "fwd") post({ type: "mbx-phase-step", dir: a === "fwd" ? 1 : -1 }); }
        const wb = e.target.closest("[data-wi]"); if (wb) { const v = wb.dataset.wi; if (v === "normal") normal(st.picking === "whatif" && st.wiFrom != null); else if (v === "skip") normal(true); else runWhatif(v); }
        const nx = e.target.closest("[data-next]"); if (nx) { const a = nx.dataset.next; if (a === "go") afterQuestion(); else if (a === "start") openPick("start"); else choose(a, 0); } };
      const d = root.querySelector(".mbp-dots"); if (d) d.onclick = (e) => { const b = e.target.closest("[data-k]"); if (b) { st.through = false; goStop(+b.dataset.k, true); } };
      const g = aside.querySelector(".mbp-grab"); if (g) { let y0 = null;
        g.onpointerdown = (e) => { y0 = e.clientY; g.setPointerCapture(e.pointerId); };
        g.onpointerup = (e) => { const dy = y0 == null ? 0 : e.clientY - y0; y0 = null; sheet(Math.abs(dy) < 8 ? !aside.classList.contains("up") : dy < 0); }; } }
    function sheet(upOn) { aside.classList.toggle("up", upOn); renderLines(); sizeSpacer(); if (upOn) setTimeout(scrollToOn, 30); }

    /* ---------- lesson ---------- */
    function useLesson(lesson) { st.lesson = lesson; st.full = lesson.steps || []; st.mode = "ready"; st.k = -1; setTier((loadProg() || {}).tier || "full"); linkPlate(); renderLines(); renderNow(); renderChips(); openPick("start"); }
    function useFallback(why) { if (why) st.fallbackWhy = why; st.mode = "fallback";
      if (st.fallback && st.fallback.steps) { st.lesson = { steps: st.fallback.steps.map((s) => ({ ...s, lines: [] })), mentions: null, flags: [], overview: [], exam: [] }; st.full = st.lesson.steps; setTier("full"); st.mode = "fallback"; }
      linkPlate(); renderLines(); renderNow(); if (st.full.length) openPick("start"); }

    /* ---------- lengths: overview · full · exam ---------- */
    const TIERS = { overview: "2-minute overview", full: "Full walk-through", exam: "Exam revision" };
    function stopsFor(tier) { const L = st.lesson || {}, F = st.full;
      if (tier === "overview" && (L.overview || []).length) return L.overview.filter((x) => F[x.stop]).map((x) => ({ ...F[x.stop], say: x.say, full: x.stop }));
      if (tier === "exam" && (L.exam || []).length) return L.exam.filter((x) => F[x.stop]).map((x) => ({ ...F[x.stop], quiz: x, full: x.stop }));
      return F.map((x, i) => ({ ...x, full: i })); }
    const has = (tier) => tier === "full" ? st.full.length > 0 : ((st.lesson || {})[tier] || []).length > 0;
    function setTier(tier) { st.tier = has(tier) ? tier : "full"; st.stops = stopsFor(st.tier); st.k = -1; renderDots(); }
    const minutes = (stops, tier) => Math.max(1, Math.round((stops.reduce((a, s) => a + String(s.say).split(/\s+/).length, 0) / 2.3 + stops.length * 3 + (tier === "exam" ? stops.length * 14 : 0)) / 60));
    /* progress per topic: the app keeps it in the student's synced data; standalone pages use this browser */
    const pkey = "mbp-prog:" + (o.progressKey || P.id);
    function loadProg() { if (st.prog) return st.prog; let p = null; try { p = o.loadProgress ? o.loadProgress() : null; } catch (_) {} st.prog = p || store.get(pkey, null); return st.prog; }
    function saveProg(patch) { if (st.mode === "fallback" && !st.full.length) return; const p = Object.assign({ done: {} }, loadProg() || {}, { tier: st.tier, n: st.stops.length, at: Date.now() }, patch);
      if (patch && patch.k != null) p.title = (st.stops[patch.k] || {}).title || ""; st.prog = p; store.set(pkey, p); try { o.saveProgress && o.saveProgress(p); } catch (_) {} }
    function resumable() { const p = loadProg(); if (!p || p.k == null || !has(p.tier)) return null; const n = stopsFor(p.tier).length;
      if (p.k <= 0 && !p.exam) return null; if (p.finished === p.tier || p.k >= n - 1 && p.finished === p.tier) return null; return { tier: p.tier, k: Math.min(p.k, n - 1), n, title: p.title || "" }; }
    function choose(tier, k) { setTier(tier); st.through = true; st.endQ = null; st.ask = null; if (st.wi) { post({ type: "mbx-params", params: {} }); st.wi = null; renderChips(); } if (tier === "exam") st.exam = { i: 0, right: k ? ((loadProg() || {}).exam || {}).right || 0 : 0, answered: null }; saveProg({ k, finished: null }); goStop(Math.min(k, st.stops.length - 1), true); }

    function openPick(kind) { st.picking = kind; aside.classList.add("pk"); aside.classList.toggle("wion", kind === "whatif" && /chips|both/.test(o.whatifUI || "both")); renderPick(); if (!wide) { aside.classList.remove("up"); } sizeSpacer(); }
    function closePick() { if (!st.picking) return; st.picking = false; aside.classList.remove("pk", "wion"); renderPick(); sizeSpacer(); }
    function card(pick, ic, title, sub, right, main, disabled, extra) { return `<button class="mbp-c${main ? " main" : ""}" data-pick="${pick}"${disabled ? ' aria-disabled="true"' : ""}><span class="ic" aria-hidden="true">${ic}</span><span class="tx"><b>${esc(title)}</b><span>${sub}</span>${extra || ""}</span>${right ? `<em>${right}</em>` : ""}</button>`; }
    function renderPick() { const box = aside.querySelector(".mbp-pick"); if (!box) return; if (!st.picking) { box.innerHTML = ""; return; }
      const p = loadProg() || { done: {} }, done = (t) => p.done && p.done[t] ? ' · <span class="ok">✓ done</span>' : "";
      if (st.picking === "start") {
        const r = resumable(), fb = st.mode === "fallback";
        let h = `<div class="mbp-h">${fb ? "Standard lesson · not matched to your note" : "How long have you got?"}</div>`;
        if (r) { const left = stopsFor(r.tier).slice(r.k); h += card(r.tier + ":" + r.k, "▶", "Continue the " + TIERS[r.tier].replace(/^\d-minute /, "").toLowerCase(), `Stop ${r.k + 1} of ${r.n}${r.title ? " · " + esc(r.title) : ""} · about ${minutes(left, r.tier)} min left`, "", true, false, `<span class="mbp-pbar" aria-hidden="true"><i style="width:${Math.round(100 * r.k / r.n)}%"></i></span>`); }
        if (!fb) h += card("overview:0", "2′", TIERS.overview, has("overview") ? `The big picture of your note in ${stopsFor("overview").length} stops` + done("overview") : "Not ready for this note yet", has("overview") ? minutes(stopsFor("overview")) + " min" : "", !r, !has("overview"));
        h += card("full:0", "≡", fb ? "Standard walk-through" : TIERS.full, (fb ? "The plate's own tour" : "Every line of your note, in order") + done("full"), minutes(stopsFor("full")) + " min", !r && fb, false);
        if (!fb) h += card("exam:0", "?", TIERS.exam, has("exam") ? `${stopsFor("exam").length} high-yield stops, a question after each` + (p.exam && p.exam.of ? ` · last time ${p.exam.right}/${p.exam.of}` : "") : "Not ready for this note yet", has("exam") ? minutes(stopsFor("exam"), "exam") + " min" : "", false, !has("exam"));
        box.innerHTML = h; }
      else if (st.picking === "question") { const s = st.stops[st.k], q = s.quiz, E = st.exam;
        box.innerHTML = `<div class="mbp-h">Question ${st.k + 1} of ${st.stops.length} · from your note</div><div class="mbp-q"><p>${esc(q.q)}</p></div>`
          + q.options.map((t, m) => `<button class="mbp-opt${E.answered == null ? "" : m === q.answer ? " right" : m === E.answered ? " wrong" : ""}" data-opt="${m}"${E.answered != null ? ' aria-disabled="true"' : ""}><span class="k">${"ABC"[m]}</span>${esc(t)}</button>`).join("")
          + (E.answered == null ? "" : `<div class="mbp-why">${E.answered === q.answer ? "<b>Right.</b> " : "<b>Not quite.</b> "}${esc(q.why)}</div>`
            + `<div class="mbp-row">${E.answered === q.answer || E.replayed ? `<button class="mbp-btn p" data-next="go">${st.k + 1 < st.stops.length ? "Next stop" : "See your score"}</button>` : `<span style="font-size:13px;color:var(--dim);align-self:center">Replaying that stop…</span>`}</div>`); }
      else if (st.picking === "predict" || st.picking === "tap" || st.picking === "seek") box.innerHTML = askHtml();
      else if (st.picking === "whatif-offer" || st.picking === "whatif") box.innerHTML = whatifHtml(st.picking === "whatif-offer");
      else if (st.picking === "done") { const t = st.tier, sc = t === "exam" && st.exam ? `You got <b>${st.exam.right} of ${st.stops.length}</b> right.` : st.endQ && st.endQ.of ? `Plate questions: <b>${st.endQ.right} of ${st.endQ.of}</b> right.` : "";
        box.innerHTML = `<div class="mbp-h">${TIERS[t]} · done ✓</div><div class="mbp-q"><p>${t === "exam" ? sc : "That's your note on this plate." + (sc ? " " + sc : "")}</p></div>`
          + `<div class="mbp-row">${t !== "exam" && has("exam") ? `<button class="mbp-btn p" data-next="exam">Exam revision</button>` : ""}${t === "exam" ? `<button class="mbp-btn p" data-next="exam">Try again</button>` : ""}<button class="mbp-btn" data-next="${t}">Replay</button><button class="mbp-btn" data-next="start">Other lengths</button></div>`; }
      if (!wide) sizeSpacer(); }
    function ask(k) { const s = st.stops[k]; st.exam = Object.assign(st.exam || { right: 0 }, { answered: null, replayed: false }); openPick("question"); post({ type: "mbx-play", on: false }); caption(s.quiz.q); say(s.quiz.q, () => {}); }
    function answer(m) { const s = st.stops[st.k], ok = m === s.quiz.answer; st.exam.answered = m; if (ok) st.exam.right++; (st.exam.log = st.exam.log || {})[s.full] = ok; renderPick();
      saveProg({ k: st.k, exam: { right: st.exam.right, of: st.stops.length, at: st.k } }); try { o.onAnswer && o.onAnswer({ stop: s.full, ok }); } catch (_) {}
      say((ok ? "Right. " : "Not quite. ") + s.quiz.why, () => { if (!ok && st.picking === "question") { const tok = st.token; setTimeout(() => { if (tok !== st.token) return; const k = st.k; st.stops[k].replay = true; replayThenAsk(k); }, 500); } }); }
    function replayThenAsk(k) { // a wrong answer replays that stop, then offers "Next stop"
      const s = st.stops[k]; haltSpeech(); st.k = k; st.j = 0; st.playing = true; s.replay = true;
      if (s.words) post({ type: "mbx-show", focus: [], lens: null, play: false }); else post({ type: "mbx-show", phase: s.phase, focus: s.focus, lens: s.lens || null, win: s.win || null, speed: s.speed, play: true });
      const parts = sentences(s.say); let j = 0; const next = () => { if (j >= parts.length) { s.replay = false; st.playing = false; st.exam.replayed = true; renderPick(); renderNow(); return; } caption(parts[j]); say(parts[j++], next); }; next(); }
    function afterQuestion() { closePick(); if (st.k + 1 < st.stops.length) { st.through = true; goStop(st.k + 1, true); } else finish(); }
    /* ---------- feature 3: predictions, what-ifs, plate questions ---------- */
    const wiUI = o.whatifUI || "both";
    const partName = (id) => ((st.manifest && st.manifest.parts.find((p) => p.id === id)) || {}).name || id;
    const predictionOf = (id) => st.manifest && (st.manifest.predictions || []).find((q) => q.id === id);
    const whatifOf = (id) => st.linkWhatif !== false && st.manifest && (st.manifest.whatifs || []).find((w) => w.id === id);
    function predict(k) { const s = st.stops[k], q = predictionOf(s.predict); st.ask = { kind: "predict", q, k, choices: false, result: null };
      post({ type: "mbx-ask", before: q.before, ring: q.choices, banner: "Predict before it plays: tap the part on the plate" }); openPick("predict"); caption(q.ask); say(q.ask, () => {}); }
    function onPick(id) { const A = st.ask; if (!A || A.result) return;
      if (A.kind === "predict") { const ok = A.q.answer.includes(id); A.result = { ok, id }; st.predDone.add(A.q.id);
        post({ type: "mbx-ask-end", mark: { right: A.q.answer, wrong: ok ? [] : [id] } }); renderPick();
        const msg = ok ? "Right. Watch it happen." : "Not quite: it's the " + partName(A.q.answer[0]).toLowerCase() + ". Watch.";
        try { o.onAnswer && o.onAnswer({ kind: "predict", id: A.q.id, ok }); } catch (_) {}
        say(msg, () => { if (st.ask !== A) return; st.ask = null; closePick(); const s = st.stops[A.k]; post({ type: "mbx-show", phase: s.phase, focus: s.focus, lens: s.lens || null, win: s.win || null, speed: s.speed, play: true }); st.j = 0; speak(); }); }
      else if (A.kind === "tap") { const ok = A.q.parts.includes(id); A.result = { ok, id }; if (ok) st.endQ.right++;
        post({ type: "mbx-ask-end", mark: { right: A.q.parts, wrong: ok ? [] : [id] } }); renderPick(); say(ok ? "Right." : "Not quite: it's the " + partName(A.q.parts[0]).toLowerCase() + ".", () => {}); } }
    function askEnd() { const E = st.endQ, all = st.lesson.end; if (E.i >= all.length) { E.of = all.length; st.ask = null; return finish(); }
      const q = all[E.i]; st.ask = { kind: q.type, q, result: null }; haltSpeech();
      if (q.type === "tap") post({ type: "mbx-ask", ring: [], banner: "Tap your answer on the plate" }); else post({ type: "mbx-show", focus: [], lens: null, play: true, speed: 0.5 });
      openPick(q.type); caption(q.q); say(q.q, () => {}); }
    function checkSeek() { const A = st.ask; if (!A || A.result) return; const ok = st.phaseNow === A.q.phase; A.result = { ok }; if (ok) st.endQ.right++;
      if (!ok) post({ type: "mbx-show", phase: A.q.phase, focus: [], lens: null, play: false }); else post({ type: "mbx-play", on: false });
      renderPick(); say(ok ? "Right." : "Not quite: it's in the " + A.q.phase.toLowerCase() + ".", () => {}); }
    function askHtml() { const A = st.ask; if (!A) return ""; const q = A.q, R = A.result, n = st.lesson.end ? st.lesson.end.length : 0;
      if (A.kind === "predict") return `<div class="mbp-h">Predict · from your note</div><div class="mbp-q"><p>${esc(q.ask)}</p></div>`
        + (R ? `<div class="mbp-why">${R.ok ? "<b>Right.</b> Watch it happen." : `<b>Not quite.</b> It's the ${esc(partName(q.answer[0]).toLowerCase())}. Watch.`}</div>`
          : A.choices ? q.choices.map((id, m) => `<button class="mbp-opt" data-pickid="${id}"><span class="k">${"ABC"[m]}</span>${esc(partName(id))}</button>`).join("")
          : `<p style="margin:0;font-size:13px;color:var(--dim)">Tap that part on the plate. The plate then plays and shows you.</p><div class="mbp-row"><button class="mbp-btn" data-ask="choices">Show choices</button><button class="mbp-btn" data-ask="skip">Skip</button></div>`);
      const head = `<div class="mbp-h">Check yourself · plate question ${st.endQ.i + 1} of ${n}</div><div class="mbp-q"><p>${esc(q.q)}</p></div>`, nx = `<div class="mbp-row"><button class="mbp-btn p" data-ask="next">${st.endQ.i + 1 < n ? "Next question" : "Finish"}</button></div>`;
      if (A.kind === "tap") return head + (R ? `<div class="mbp-why">${R.ok ? "<b>Right.</b>" : `<b>Not quite.</b> It's the ${esc(partName(q.parts[0]).toLowerCase())}.`}</div>` + nx : `<p style="margin:0;font-size:13px;color:var(--dim)">Tap it on the plate.</p><div class="mbp-row"><button class="mbp-btn" data-ask="skipq">Skip</button></div>`);
      return head + `<div class="mbp-live">Now: ${esc(st.phaseNow || "—")}</div>` + (R ? `<div class="mbp-why">${R.ok ? "<b>Right.</b>" : `<b>Not quite.</b> It's in the ${esc(q.phase.toLowerCase())}; the plate is there now.`}</div>` + nx
        : `<p style="margin:0;font-size:13px;color:var(--dim)">Move the parcel with these buttons or by dragging the plate's chart, then check.</p><div class="mbp-row"><button class="mbp-btn" data-ask="back">◀ Back</button><button class="mbp-btn" data-ask="fwd">Forward ▶</button><button class="mbp-btn p" data-ask="check">Check here</button></div>`); }
    /* what if: the plate re-runs its own model; the numbers are the model's, offered only where the note mentions the change */
    function offerWhatif(id) { st.wiFrom = st.k; st.wiCurrent = id; openPick("whatif-offer"); }
    function runWhatif(id) { const w = whatifOf(id); if (!w) return; haltSpeech(); st.wi = id; post({ type: "mbx-params", params: w.params });
      setTimeout(() => post({ type: "mbx-show", phase: w.at, focus: [], lens: null, speed: 0.6, play: true }), 60); st.wiCurrent = id; openPick("whatif"); renderChips(); say(w.shows, () => {}); }
    function normal(cont) { if (st.wi) post({ type: "mbx-params", params: {} }); st.wi = null; renderChips(); closePick();
      if (cont && st.wiFrom != null && st.through && st.wiFrom + 1 < st.stops.length) { const k = st.wiFrom; st.wiFrom = null; goStop(k + 1, true); } else { st.wiFrom = null; renderNow(); } }
    function whatifHtml(offer) { const w = whatifOf(st.wiCurrent); if (!w) return ""; const R = Object.fromEntries((st.manifest.readouts || []).map((r) => [r.key, r]));
      if (offer) { const ln = (st.stops[st.wiFrom] || {}).lines || []; const quote = lines.filter((l) => ln.includes(l.id) && (w.note || []).some((t) => l.text.toLowerCase().includes(t))).map((l) => l.text)[0];
        return `<div class="mbp-h">From your note</div>${quote ? `<p style="margin:0;font-size:14px;color:var(--text)">“${esc(quote)}”</p>` : ""}<div class="mbp-offer"><div class="mbp-q"><p>What if: ${esc(w.label.toLowerCase())}?</p></div><p style="margin:0;font-size:13px;color:var(--dim)">The plate re-runs with that change and shows you the numbers.</p><div class="mbp-row"><button class="mbp-btn p" data-wi="${w.id}">▶ Show me</button><button class="mbp-btn" data-wi="skip">Not now</button></div></div>`; }
      const f = (v) => (Math.abs(v) < 10 ? (+v).toFixed(1) : Math.round(v)), rows = Object.entries(w.effect).filter(([, v]) => v && v[1] != null).map(([key, [a, b]]) => { const [k, agg] = key.split(":"), r = R[k] || { label: k, unit: "" };
        return `<span class="l">${esc(r.label)}${agg === "max" ? " (peak)" : agg === "min" ? " (lowest)" : ""}${r.unit ? ", " + esc(r.unit) : ""}</span><b>${f(a)}</b><span class="a">→</span><b class="${b > a ? "up" : "dn"}">${f(b)}</b>`; }).join("");
      return `<div class="mbp-h">What if · ${esc(w.label)}</div><p style="margin:0;font-size:14px;line-height:1.45;color:var(--text)">${esc(w.shows)}</p><div class="mbp-src">From the plate's model (${esc(o.sourceLabel || "Guyton & Hall")}), not your note · ${st.manifest.kind === "journey" ? "at the end of the run" : "over one cycle"}</div>`
        + `<div class="mbp-tbl"><span></span><span class="a">normal</span><span></span><span class="a">${esc(w.label.toLowerCase())}</span>${rows}</div>`
        + `<div class="mbp-row"><button class="mbp-btn p" data-wi="${w.id}">▶ Watch again</button><button class="mbp-btn" data-wi="normal">Back to normal</button></div>`; }
    function renderChips() { const box = aside.querySelector(".mbp-wi"); if (!box) return; const ids = ((st.lesson || {}).whatifs || []).filter((id) => whatifOf(id));
      box.hidden = !(/chips|both/.test(wiUI) && ids.length && st.mode !== "loading");
      box.innerHTML = `<span class="lb">What if</span><button data-wi="normal" aria-pressed="${!st.wi}">Normal</button>` + ids.map((id) => `<button data-wi="${id}" aria-pressed="${st.wi === id}">${esc(whatifOf(id).label)}</button>`).join(""); sizeSpacer(); }

    /* review cards: the note's exam questions, each tied to its stop's moment on the plate (feature 4) */
    function giveCards(results) { if (!o.onCards || st.mode === "fallback" || !(st.lesson.exam || []).length) return;
      const cards = st.lesson.exam.map((x) => { const s = st.full[x.stop] || {}, line = (s.lines || []).map((id) => lines[LI.get(id)]).find((l) => l && !l.h);
        return { q: x.q, opts: x.options.slice(), ans: x.answer, a: x.why, src3d: P.id,
          plate: { id: P.id, phase: s.phase || null, focus: s.focus || [], lens: s.lens || null, win: s.win || null, speed: s.speed || 0.5 },
          caption: line ? "From your note: " + line.text : "", missed: results[x.stop] === false }; });
      try { o.onCards(cards); } catch (e) { console.warn("[plate] onCards", e); } }
    function finish() { if (st.tier === "full" && (st.lesson.end || []).length && st.endQ == null) { st.endQ = { i: 0, right: 0 }; return askEnd(); }
      if (st.tier === "full" || st.tier === "exam") giveCards(st.tier === "exam" && st.exam ? st.exam.log || {} : {});
      const p = loadProg() || {}; const d = Object.assign({}, p.done, { [st.tier]: true }); saveProg({ k: st.stops.length - 1, finished: st.tier, done: d }); openPick("done"); }
    st.voice = store.get("mbp-voice", st.voice);
    layout();
    fetch(P.manifest).then((r) => r.json()).then((m) => { st.manifest = m; linkPlate(); renderLines(); renderChips(); }).catch(() => {});
    Promise.resolve(o.lesson || (o.getLesson ? o.getLesson() : null)).then((l) => { if (destroyed) return;
      if (l && l.steps && l.steps.length) useLesson(l); else useFallback("Your note couldn't be matched to this plate right now, so this is the plate's standard walk-through.");
      if (st.mode === "fallback") { const ff = st.fallback; if (ff) useFallback(); } })
      .catch((e) => { if (!destroyed) useFallback((e && e.message) || ""); });

    function destroy() { if (destroyed) return; destroyed = true; haltSpeech(); clearInterval(watch); ro.disconnect(); mo.disconnect(); window.removeEventListener("message", onMsg); if (spacer) spacer.remove(); if (root.isConnected) host.innerHTML = ""; }
    const watch = setInterval(() => { if (!root.isConnected) destroy(); }, 800);   // the app re-renders pages by replacing HTML: stop talking when we're gone
    return { destroy, state: st, goStop, choose, openPick, ask, finish, runWhatif, offerWhatif, askEnd, onPick, lines };
  }

  /* ---------- review replay (feature 4): a stage-only plate that replays one moment for ~30 s, muted and data-light ----------
   * MBPlate.replay(host, { plate, stop: {phase, focus, lens, win, speed}, seconds, caption, isDark, onEnd }) → { stop() } */
  function replay(host, r) {
    if (!document.getElementById("mbp-css")) { const st = document.createElement("style"); st.id = "mbp-css"; st.textContent = CSS; document.head.appendChild(st); }
    const P = r.plate, secs = r.seconds || 30, s = r.stop || {};
    host.innerHTML = `<div class="mbp-rp"><div class="mbp-rpstage"><iframe title="${esc(P.title)} — replay" loading="lazy"></iframe><div class="mbp-load">Loading the replay…</div></div>
      <div class="mbp-rpbar"><button class="mbp-rpb" aria-label="Replay">↻</button><div class="mbp-pbar" style="flex:1;margin:0"><i style="width:0%"></i></div><span class="mbp-rpt">0:${String(secs).padStart(2, "0")}</span></div>
      ${r.caption ? `<div class="mbp-rpcap">${esc(r.caption)}</div>` : ""}</div>`;
    const frame = host.querySelector("iframe"), bar = host.querySelector(".mbp-pbar i"), tl = host.querySelector(".mbp-rpt"); let t0 = 0, timer = null, linked = false, gone = false;
    const post = (m) => { try { frame.contentWindow.postMessage(m, "*"); } catch (_) {} };
    function go() { if (!linked) return; post({ type: "mbx-show", phase: s.phase, focus: s.focus || [], lens: s.lens || null, win: s.win || null, speed: s.speed || 0.5, play: true }); t0 = Date.now(); clearInterval(timer);
      timer = setInterval(() => { const e = (Date.now() - t0) / 1000; bar.style.width = Math.min(100, 100 * e / secs) + "%"; tl.textContent = "0:" + String(Math.max(0, Math.ceil(secs - e))).padStart(2, "0");
        if (e >= secs) { clearInterval(timer); post({ type: "mbx-play", on: false }); r.onEnd && r.onEnd(); } }, 250); }
    frame.addEventListener("load", () => { try { const d = frame.contentDocument, sc = d.createElement("script"); sc.src = BASE + "studio/tutor-link.js"; d.head.appendChild(sc); } catch (_) {} });
    function onMsg(e) { if (e.source !== frame.contentWindow) return; const m = e.data || {};
      if (m.type === "mbx-linked") { linked = true; const ld = host.querySelector(".mbp-load"); if (ld) ld.remove(); post({ type: "mbx-link", parts: {}, unlocked: [], dark: r.isDark ? r.isDark() : false, mini: true }); setTimeout(go, 80); }
      else if (m.type === "mbx-height" && linked) frame.style.height = Math.max(160, m.h) + "px"; }
    window.addEventListener("message", onMsg); frame.src = P.src; frame.style.height = Math.round((host.clientWidth || 340) * 640 / 760 + 10) + "px";
    host.querySelector(".mbp-rpb").onclick = (e) => { e.stopPropagation(); go(); };
    const watch = setInterval(() => { if (!host.isConnected) stop(); }, 1000);
    function stop() { if (gone) return; gone = true; clearInterval(timer); clearInterval(watch); window.removeEventListener("message", onMsg); }
    return { stop, again: go };
  }

  window.MBPlate = { PLATES, match, splitNote, mount, replay };
})();
