// node tools/freemap.mjs <dir> [x0 y0 x1 y1]  → ASCII map of the stage at 8-unit cells: '#' tube/vessel, '+' other drawn, 'L' label, '.' free
import { readFileSync } from "node:fs"; import { join } from "node:path";
const [dir, ...bb] = process.argv.slice(2); const [X0, Y0, X1, Y1] = bb.length ? bb.map(Number) : [0, 0, 760, 640];
const pw = await import("/opt/npm-tools/node_modules/playwright/index.js"); const chromium = pw.chromium || pw.default.chromium;
const b = await chromium.launch(); const p = await b.newPage({ viewport: { width: 1300, height: 900 } });
await p.setContent(readFileSync(join(dir, "A.html"), "utf8"), { waitUntil: "load" }); await p.waitForTimeout(1500);
const rows = await p.evaluate(([X0, Y0, X1, Y1]) => { const svg = document.getElementById("stage"); const S = [], T = [];
  svg.querySelectorAll("g[data-layer]").forEach((g) => { const L = g.dataset.layer; if (["bg", "zones", "glow", "fx"].includes(L)) return;
    g.querySelectorAll(L === "labels" ? "text" : "path,circle,ellipse,rect,polygon,line").forEach((e) => { if (L === "labels") { const bx = e.getBBox(); if (e.textContent.trim()) T.push(bx); return; }
      const cs = getComputedStyle(e); let o = 1, q = e; while (q && q !== svg) { o *= +getComputedStyle(q).opacity; q = q.parentNode; } if (o < 0.3) return;
      const sw = parseFloat(cs.strokeWidth) || 0; S.push({ e, st: cs.stroke !== "none" && sw > 0, fi: cs.fill !== "none" && e.tagName !== "path", big: sw >= 2.5 || (cs.fill !== "none" && e.tagName !== "path"), L }); }); });
  const out = []; for (let y = Y0; y < Y1; y += 8) { let r = String(y).padStart(4) + " "; for (let x = X0; x < X1; x += 8) { const pt = svg.createSVGPoint(); pt.x = x + 4; pt.y = y + 4; let c = ".";
      if (T.some((t) => pt.x >= t.x && pt.x <= t.x + t.width && pt.y >= t.y && pt.y <= t.y + t.height)) c = "L";
      else for (const s of S) { let h = false; try { h = (s.st && s.e.isPointInStroke(pt)) || (s.fi && s.e.isPointInFill(pt)); } catch (_) {} if (h) { c = s.big ? "#" : "+"; if (c === "#") break; } }
      r += c; } out.push(r); } return out; }, [X0, Y0, X1, Y1]);
let hdr = "     "; for (let x = X0; x < X1; x += 8) hdr += (x % 80 === 0) ? String(x / 10 % 10) : " "; console.log(hdr + "   (each col = 8 units; digit = x/10 mod 10 at multiples of 80)"); rows.forEach((r) => console.log(r)); await b.close();
