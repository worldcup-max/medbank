#!/usr/bin/env node
/* Pull what students asked the 3D Tutor's instant builder for, and write the polished-build queue.
 *   MB_API=https://medbank-import.onrender.com MB_ADMIN_TOKEN=<an admin account's access token> node explainer/tools/queue.mjs
 * Writes explainer/BUILD-QUEUE.md (most-wanted first: failed + flagged weigh more than plain requests).
 * Hand each item to the build agent with explainer/BUILD-TASK-PROMPT.md. */
import { writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
const HERE = dirname(fileURLToPath(import.meta.url));
const api = (process.env.MB_API || "https://medbank-import.onrender.com").replace(/\/$/, ""), token = process.env.MB_ADMIN_TOKEN;
if (!token) { console.error("Set MB_ADMIN_TOKEN (sign in as an admin in the app, then in the console: (await __mbSB.auth.getSession()).data.session.access_token)"); process.exit(1); }
const r = await fetch(api + "/admin/explainer/queue", { headers: { authorization: "Bearer " + token } });
const j = await r.json(); if (!r.ok) { console.error(j); process.exit(1); }
const rows = j.queue || [];
const md = ["# 3D Tutor — polished-build queue", "", `Pulled ${new Date().toISOString()} from ${api}. Most-wanted first. Score = requests + built + 3×failed + 5×flagged.`, "",
  "| # | Mechanism | Score | Built | Failed | Flagged | Last topic |", "|---|---|---|---|---|---|---|",
  ...rows.slice(0, 40).map((x, i) => `| ${i + 1} | ${x.name} | ${x.score} | ${x.built || 0} | ${x.failed || 0} | ${x.flags || 0} | ${x.last_topic || ""} |`),
  "", "Build the top item with `explainer/BUILD-TASK-PROMPT.md`."].join("\n");
writeFileSync(join(HERE, "..", "BUILD-QUEUE.md"), md);
console.log(`wrote BUILD-QUEUE.md (${rows.length} mechanisms)`); rows.slice(0, 10).forEach((x, i) => console.log(`${i + 1}. ${x.name} (score ${x.score})`));
