/* MedBank tour kit — the engine every guided-tour plate runs on.
 *
 * A tour plate (any topic: physiology, a disease with its management and drugs, a procedure) is four things,
 * assembled into one page by explainer/tours/build-tour.mjs:
 *   meta.json     title, header line, cases, timeline, sources        → the page skeleton
 *   tour.css      the shared layout (this folder) + the topic's palette.css
 *   tour-kit.js   this file: helpers, the part registry, and the bridge to the 3D Tutor
 *   tour.js       the topic: draws the stage and the lenses, lists the stops (notes, doses, tables, checks), runs the frame loop
 *
 * The topic script ends with TK.connect({...}). That gives explainer/studio/tutor-link.js what it needs to let the
 * student's own note drive the plate (window.__studio.api): stops become the tutor's "phases", TK.part() ids become
 * the parts it can spotlight and dim, and window.__tour is what build-tour.mjs turns into manifest.json.
 * See explainer/tours/README.md for the full contract a tour.js must meet.
 */
(function () {
  "use strict";
  if (window.TK) return;
  const errors = [];
  window.__studio = { ready: false, errors, frames: 0, kind: "tour" };
  window.addEventListener("error", (e) => { errors.push(String((e && e.message) || e)); });
  window.addEventListener("unhandledrejection", (e) => { errors.push("promise: " + String((e && e.reason && e.reason.message) || e.reason)); });

  const PARTS = {};
  const NS = "http://www.w3.org/2000/svg";
  const TK = (window.TK = {
    NS,
    /* register drawn elements as a named part the tutor can spotlight, dim and ask about: TK.part("placenta", pathEl) */
    part(id, ...els) { (PARTS[id] = PARTS[id] || []).push(...els.filter(Boolean)); return els[0]; },
    parts: () => PARTS,
    text: (h) => String(h || "").replace(/<[^>]+>/g, " ").replace(/&nbsp;/g, " ").replace(/&amp;/g, "&").replace(/&lt;/g, "<").replace(/&gt;/g, ">").replace(/&#?\w+;/g, " ").replace(/\s+/g, " ").trim(),
    connect,
  });
  window.K = { parts: () => PARTS, part: TK.part };

  /* what a stop is about, for the tutor's lesson writer: its lead (minus "drag/pick/watch…" instructions) and the headings it covers */
  function summaryOf(html) { const m = /<p class="lead">([\s\S]*?)<\/p>/.exec(html || "");
    const lead = TK.text(m ? m[1] : "").split(/(?<=[.!?])\s+/).filter((x) => !/^(drag|pick|watch|switch|try|tap|press|set|move|choose|click)\b/i.test(x)).slice(0, 2).join(" ");
    const heads = [...String(html || "").matchAll(/<h3>([\s\S]*?)<\/h3>/g)].map((x) => TK.text(x[1])).filter((h) => !/students mix up|check yourself/i.test(h));
    return [lead, heads.length ? "Covers: " + heads.join("; ") + "." : ""].filter(Boolean).join(" ").slice(0, 420); }

  /* T = { meta, parts:[{id,name,shows}], stops, goStop(k), setPlaying(bool), isPlaying(), current() } */
  function connect(T) {
    try {
      const stops = T.stops || [], stage = document.getElementById("stage");
      // the tutor's spotlight is a soft glow: url(#kGlow) on the parts it focuses
      if (stage && !document.getElementById("kGlow")) {
        let defs = stage.querySelector("defs"); if (!defs) { defs = document.createElementNS(NS, "defs"); stage.insertBefore(defs, stage.firstChild); }
        defs.insertAdjacentHTML("beforeend", '<filter id="kGlow" x="-30%" y="-30%" width="160%" height="160%"><feGaussianBlur stdDeviation="3" result="b"/><feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge></filter>');
      }
      const info = stops.map((s, k) => { let html = ""; try { html = typeof s.html === "function" ? s.html() : s.html || ""; } catch (_) {}
        return { k, title: s.title, chip: s.chip || s.title, kicker: s.kicker || "", grp: s.grp || "", lens: s.lensTitle || "", summary: s.summary || summaryOf(html), parts: (s.parts || []).filter((id) => PARTS[id]) }; });
      const titleOf = (k) => (stops[k] || {}).title;
      const find = (name) => { const n = String(name || "").toLowerCase().trim(); return stops.findIndex((s) => String(s.title).toLowerCase() === n || String(s.chip || "").toLowerCase() === n); };
      const api = {
        T: stops.length, N: stops.length,
        samples: info.map((s) => ({ phase: s.title, parts: Object.fromEntries(s.parts.map((id) => [id, { active: 1 }])) })),
        bands: info.map((s, k) => ({ name: s.title, a: k, b: k + 1 })),
        lesson: { steps: info.map((s) => ({ title: s.chip, phase: s.title, focus: s.parts, say: s.summary })) },
        isPlaying: () => !!T.isPlaying(), setPlaying: (p) => T.setPlaying(!!p),
        goPhase(name) { const k = find(name); if (k < 0) return false; if (k !== T.current()) T.goStop(k); return true; },
        seekTime() {}, setSpeed() {}, stopTutor() {},
        phaseAt: () => titleOf(T.current()) || null,
        stepPhase(dir) { T.goStop(Math.max(0, Math.min(stops.length - 1, T.current() + (dir > 0 ? 1 : -1)))); },
        before(name) { const ok = api.goPhase(name); T.setPlaying(false); return ok; },
        lens() {},   // every stop already shows its own lens
      };
      Object.assign(window.__studio, { api, ready: true });
      window.__tour = { meta: T.meta || {}, parts: (T.parts || []).filter((p) => PARTS[p.id]), registered: Object.keys(PARTS), stops: info };
      const count = () => { window.__studio.frames++; requestAnimationFrame(count); }; requestAnimationFrame(count);
    } catch (e) { errors.push("TK.connect: " + e.message); }
  }
})();
