/* Run a guided-tour plate page on the server, with no browser: linkedom gives it a DOM, small stubs stand in for
 * layout (getBoundingClientRect, getBBox, matchMedia…), every inline script runs in one vm context like a real page,
 * the frame loop is stepped, and every stop button is clicked. Returns the same report build-tour.mjs gets from
 * Playwright, so tourProblems() judges both the same way. It catches crashes, missing parts and empty stops; it
 * cannot judge how the drawing looks, which is why a draft is marked "draft" until the full build replaces it. */
import vm from "node:vm";
import { parseHTML } from "linkedom";

export function checkTourPage(html, { frames = 90, perStop = 12 } = {}) {
  const { window, document } = parseHTML(html);
  const errors = [], stopErrors = [], rafQ = [];
  const rect = { left: 0, top: 0, right: 760, bottom: 720, width: 760, height: 720, x: 0, y: 0 };
  const P = window.Element && window.Element.prototype;
  if (P) { P.getBoundingClientRect = () => rect; P.getBBox = () => ({ x: 0, y: 0, width: 40, height: 40 }); P.getTotalLength = () => 100; P.getPointAtLength = () => ({ x: 0, y: 0 });
    P.scrollIntoView = () => {}; P.setPointerCapture = () => {}; P.releasePointerCapture = () => {}; P.focus = P.focus || (() => {}); }
  const noop = () => {};
  const sandbox = {
    window, document, console: { log: noop, warn: noop, error: (...a) => errors.push(a.join(" ")) }, Math, JSON, Date, Number, String, Object, Array, Set, Map, WeakMap, Symbol, Promise, RegExp, Error, TypeError, isNaN, isFinite, parseFloat, parseInt, Intl,
    setTimeout: (f, ms) => { rafQ.push({ f: () => f(), at: ms || 0, timer: true }); return rafQ.length; }, clearTimeout: noop, setInterval: () => 0, clearInterval: noop,
    requestAnimationFrame: (f) => { rafQ.push({ f }); return rafQ.length; }, cancelAnimationFrame: noop, performance: { now: () => clock },
    matchMedia: () => ({ matches: false, addEventListener: noop, removeEventListener: noop, addListener: noop }),
    getComputedStyle: () => ({ position: "absolute", getPropertyValue: () => "", display: "block" }),
    IntersectionObserver: class { constructor(cb) { this.cb = cb; } observe() { try { this.cb([{ isIntersecting: true }]); } catch (_) {} } disconnect() {} unobserve() {} },
    ResizeObserver: class { observe() {} disconnect() {} unobserve() {} },
    history: { replaceState: noop, pushState: noop }, location: { hash: "", href: "about:blank", search: "" }, navigator: { userAgent: "node" }, speechSynthesis: { cancel: noop, speak: noop },
    innerWidth: 1366, innerHeight: 900, devicePixelRatio: 1, scrollX: 0, scrollY: 0, scrollTo: noop, addEventListener: (t, f) => { if (t === "error") onErr = f; }, removeEventListener: noop,
  };
  let clock = 0, onErr = null;
  sandbox.self = sandbox; sandbox.globalThis = sandbox;
  ["Node", "Element", "HTMLElement", "SVGElement", "Event", "CustomEvent", "KeyboardEvent", "PointerEvent", "MouseEvent", "DOMParser", "XMLSerializer", "HTMLInputElement"].forEach((k) => { if (window[k]) sandbox[k] = window[k]; });
  if (!sandbox.PointerEvent) sandbox.PointerEvent = sandbox.Event; if (!sandbox.KeyboardEvent) sandbox.KeyboardEvent = sandbox.Event;
  const ctx = vm.createContext(sandbox);
  // the scripts' window is the sandbox itself, so window.TK / window.__studio / window.__tour are their globals (linkedom's own window is a proxy we leave alone)
  vm.runInContext("window = globalThis;", ctx);
  const run = (fn, tag) => { try { fn(); } catch (e) { errors.push((tag ? tag + ": " : "") + (e && e.message || String(e))); } };
  for (const sc of [...document.querySelectorAll("script")]) { const code = sc.textContent || ""; if (!code.trim()) continue;
    run(() => vm.runInContext(code, ctx, { timeout: 4000 }), "script"); }
  const step = (n) => { for (let k = 0; k < n; k++) { const q = rafQ.splice(0, rafQ.length); clock += 16.7; q.forEach((x) => run(() => x.f(clock), "frame")); if (!q.length) break; } };
  step(frames);
  const btns = [...document.querySelectorAll("#stops button")];
  btns.forEach((b, k) => { const before = errors.length; run(() => { if (typeof b.onclick === "function") b.onclick({ currentTarget: b, target: b, preventDefault() {} }); else b.dispatchEvent(new window.Event("click")); }, `stop ${k + 1}`); step(perStop);
    if (errors.length > before) stopErrors.push(`stop ${k + 1}: ` + errors.splice(before).join(" | ")); });
  const st = sandbox.__studio || {}, tour = sandbox.__tour || null;
  return { ready: !!st.ready, errors: [...new Set([...(st.errors || []), ...errors])].slice(0, 20), frames: st.frames || 0, tour: tour && JSON.parse(JSON.stringify(tour)), stopErrors, buttons: btns.length };
}
