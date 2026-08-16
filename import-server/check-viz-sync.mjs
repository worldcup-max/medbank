#!/usr/bin/env node
/* Drift guard: viz-assets.json is the single source of truth. The renderer in app.html must be
 * able to draw every asset the manifest declares and lay out every zone it declares. This asserts
 * the engine covers the manifest, so adding an asset/zone in only one place fails loudly.
 * Run: node import-server/check-viz-sync.mjs   (exit 1 on drift). */
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const here = dirname(fileURLToPath(import.meta.url));
const manifest = JSON.parse(readFileSync(join(here, "viz-assets.json"), "utf8"));
const app = readFileSync(join(here, "..", "app.html"), "utf8");

const problems = [];

// engine asset draw fns live in `var A={ name:function... }` — grab keys of that block
const aBlock = app.slice(app.indexOf("var A={"), app.indexOf("var TPL="));
const drawn = new Set([...aBlock.matchAll(/(\w+)\s*:\s*function/g)].map(m => m[1]));
for (const asset of Object.keys(manifest.assets || {}))
  if (!drawn.has(asset)) problems.push(`asset "${asset}" is in the manifest but has no draw fn in app.html (A={...})`);

// engine templates + zones live in `var TPL={ tpl:{ ... zones:{ zone:{...} } } }`
const tBlock = app.slice(app.indexOf("var TPL="), app.indexOf("var BP="));
for (const [tpl, cfg] of Object.entries(manifest.templates || {})) {
  if (!new RegExp("\\b" + tpl + "\\s*:\\s*\\{").test(tBlock))
    { problems.push(`template "${tpl}" is in the manifest but not in the engine TPL map`); continue; }
  for (const zone of Object.keys(cfg.zones || {}))
    if (!new RegExp("\\b" + zone + "\\s*:\\s*\\{").test(tBlock))
      problems.push(`zone "${zone}" (template ${tpl}) is in the manifest but not in the engine TPL zones`);
}

if (problems.length) {
  console.error("✗ manifest ↔ engine DRIFT:\n  - " + problems.join("\n  - "));
  process.exit(1);
}
console.log(`✓ manifest ↔ engine in sync — ${Object.keys(manifest.assets).length} assets, ` +
  `${Object.keys(manifest.templates).length} templates, all drawable.`);
