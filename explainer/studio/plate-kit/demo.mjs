/* Builds explainer/studio/samples/plate-tutor-demo.html: the 3D Tutor topic page exactly as the app draws it
 * (app.html's own stylesheet + chrome), with a library plate driven by a note. For trying the student experience
 * and for headless screenshots, without signing in or calling the server.
 *   node explainer/studio/plate-kit/demo.mjs
 * Page options: ?theme=dark  ?wi=stop|chips|both (what-if style)  ?flag=1 (a copy of the note with one disagreeing number)  ?fail=1 (no lesson → fallback) */
import { readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..", "..", "..");
const app = readFileSync(join(ROOT, "app.html"), "utf8");
const styles = app.slice(app.indexOf("<style>"), app.indexOf("<body>")).replace(/<script[\s\S]*?<\/script>/g, "");
const note = readFileSync(join(ROOT, "explainer/studio/samples/nephron-note.md"), "utf8");
const lesson = JSON.parse(readFileSync(join(ROOT, "explainer/studio/samples/nephron-note.tutor.json"), "utf8"));
const { splitNote, checkPlateTutor } = await import(join(ROOT, "import-server/plate-tutor.mjs"));
const M = JSON.parse(readFileSync(join(ROOT, "explainer/library/physiology/nephron-urine-journey/manifest.json"), "utf8"));
const lines = splitNote(note), ok = checkPlateTutor(JSON.stringify(lesson), M, lines);
if (ok.errors.length) { console.error("fixture lesson fails the server checks:", ok.errors); process.exit(1); }
// the "flag" variant: the same note with one number that disagrees with the plate, as DeepSeek would return it
const noteFlag = note.replace("concentrated urine (up to ~1200 mOsm/kg)", "concentrated urine (up to ~1000 mOsm/kg)");
const lf = JSON.parse(JSON.stringify(lesson)); const s9 = lf.steps.find((s) => s.lines.includes("L16"));
s9.say = s9.say.replace("about 1200 milliosmoles", "about 1000 milliosmoles");
lf.flags = [{ line: "L16", noteSays: "1000", plateSays: "1200", say: "One check: your note gives about 1000 here, while the plate, from Guyton, shows about 1200. Worth confirming with your lecturer." }];
const okF = checkPlateTutor(JSON.stringify(lf), M, splitNote(noteFlag));
if (okF.errors.length) { console.error("flag variant fails the server checks:", okF.errors); process.exit(1); }

const page = `<!doctype html><html lang="en" data-theme="light"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover">
<title>MedBank · 3D Tutor preview</title>
<script>(function(){var q=new URLSearchParams(location.search),t=q.get("theme");var d=t?t==="dark":matchMedia("(prefers-color-scheme: dark)").matches;document.documentElement.setAttribute("data-theme",d?"dark":"light");})()</script>
${styles}</head><body>
<button id="hamburger" aria-label="Menu">☰</button>
<div id="shell"><nav id="sidebar"><div class="brand"><img src="../../../icon.svg" alt="" width="26" height="26" style="border-radius:7px"> MedBank</div>
<button class="mbtheme" type="button" id="themeBtn"><span class="ic">☀</span><span class="lb">Light mode</span><span class="st">demo</span></button>
<div id="nav"><div class="navitem"><span class="ic">🏠</span><span>Home</span></div><div class="navitem"><span class="ic">📅</span><span>Today</span></div><div class="navitem"><span class="ic">🔁</span><span>Reviews</span></div><div class="navitem active"><span class="ic">🫘</span><span>Physiology</span></div></div></nav>
<main id="main">
<div class="crumb"><a>Home</a><span class="sep">›</span><a>Physiology</a><span class="sep">›</span><span>How the nephron makes urine</span></div>
<h1>How the nephron makes urine</h1><p class="sub">Renal physiology · Physiology</p>
<div id="tabs" style="display:flex;gap:7px;overflow-x:auto;-webkit-overflow-scrolling:touch;padding-bottom:5px;margin:8px 0 16px"></div>
<div id="mbpHost"></div>
</main></div>
<script src="../../plate-tutor.js"></script>
<script>
const Q = new URLSearchParams(location.search), FLAG = Q.get("flag") === "1";
const NOTE = ${JSON.stringify(note)}, NOTE_FLAG = ${JSON.stringify(noteFlag)};
const LESSON = Object.assign(${JSON.stringify(ok.lesson)}, {}), LESSON_FLAG = ${JSON.stringify(okF.lesson)};
const sw=(l,a)=>'<button style="flex:none;border:1px solid '+(a?'var(--accent)':'var(--line)')+';background:'+(a?'var(--accent)':'var(--panel)')+';color:'+(a?'#fff':'var(--text)')+';border-radius:10px;padding:8px 13px;font-weight:700;font-size:13px;white-space:nowrap">'+l+'</button>';
document.getElementById("tabs").innerHTML = sw("📖 Notes")+sw("📝 Simplified")+sw("🃏 Flashcards")+sw("✓ Quiz")+sw("⚗️ 3D Tutor",1)+sw("🎧 Podcast");
document.getElementById("themeBtn").onclick = () => { const d = document.documentElement.getAttribute("data-theme") !== "dark"; document.documentElement.setAttribute("data-theme", d ? "dark" : "light"); };
const voices = { speak(text, done) { try { speechSynthesis.cancel(); const u = new SpeechSynthesisUtterance(text); u.lang = "en-GB"; u.rate = 1.02; u.onend = done; u.onerror = done; speechSynthesis.speak(u); } catch (_) { setTimeout(done, 900 + text.length * 52); } },
  stopSpeak() { try { speechSynthesis.cancel(); } catch (_) {} } };
window.TUTOR = MBPlate.mount(document.getElementById("mbpHost"), {
  plate: MBPlate.PLATES.find((p) => p.id === "nephron-urine-journey"),
  note: FLAG ? NOTE_FLAG : NOTE,
  getLesson: () => new Promise((r) => setTimeout(() => r(Q.get("fail") === "1" ? null : FLAG ? LESSON_FLAG : LESSON), 700)),
  speak: voices.speak, stopSpeak: voices.stopSpeak, voice: Q.get("mute") !== "1", whatifUI: Q.get("wi") || "both",
  isDark: () => document.documentElement.getAttribute("data-theme") === "dark" });
</script></body></html>`;
writeFileSync(join(ROOT, "explainer/studio/samples/plate-tutor-demo.html"), page);
console.log("wrote explainer/studio/samples/plate-tutor-demo.html", (page.length / 1024).toFixed(0) + " KB; fixture stops:", ok.lesson.steps.length);
