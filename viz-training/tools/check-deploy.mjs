#!/usr/bin/env node
/* MedBank · viz-training/tools/check-deploy.mjs
 *
 * Does the DEPLOYED site actually serve the 3D corpus?
 *
 * This exists because the failure is silent. sw.js answers a missing same-origin file with the app shell,
 * so a scene that did not deploy comes back as HTML with status 200 — the app just quietly never shows a 3D
 * tab, with nothing in the console to explain why. This asks the questions directly.
 *
 *   node viz-training/tools/check-deploy.mjs https://medbank.com.ng
 *   node viz-training/tools/check-deploy.mjs http://localhost:8080     # a local server works too
 *
 * Node 18+ (uses built-in fetch). No dependencies. Exit code 1 if anything is wrong.
 */
const base = (process.argv[2] || '').replace(/\/+$/, '');
if (!base) {
  console.error('usage: node viz-training/tools/check-deploy.mjs <site-url>');
  process.exit(2);
}

const results = [];
function record(what, ok, detail) { results.push({ what, ok, detail }); }

async function get(path) {
  const url = base + path;
  try {
    const r = await fetch(url, { redirect: 'follow' });
    const text = await r.text();
    return { status: r.status, text, type: r.headers.get('content-type') || '' };
  } catch (e) { return { status: 0, text: '', error: e.message }; }
}

const looksLikeHtml = t => /^\s*(<!doctype|<html)/i.test(t);

async function main() {
  console.log(`checking ${base}\n`);

  /* 1 — the player file itself */
  const viz = await get('/viz3d.js');
  record('viz3d.js served', viz.status === 200 && /window\.MB3D/.test(viz.text),
    viz.status === 200 ? `${(viz.text.length / 1024).toFixed(0)} KB` : `HTTP ${viz.status}${viz.error ? ' — ' + viz.error : ''}`);

  /* 2 — app.html actually references it */
  const app = await get('/app.html');
  record('app.html loads viz3d.js', app.status === 200 && /src="viz3d\.js"/.test(app.text),
    app.status === 200 ? '' : `HTTP ${app.status}`);

  /* 3 — the flag is present and readable */
  const cfg = await get('/config.js');
  const flag = (cfg.text.match(/MODEL3D:\s*(true|false)/) || [])[1];
  record('config.js has MODEL3D', !!flag, flag ? `currently ${flag}` : 'flag missing');

  /* 4 — the index, which is the file everything else hangs off */
  const idx = await get('/viz-training/scenes/index.json');
  let index = null;
  if (idx.status !== 200) record('scenes/index.json', false, `HTTP ${idx.status}`);
  else if (looksLikeHtml(idx.text)) record('scenes/index.json', false, 'served the APP SHELL — the file did not deploy');
  else {
    try { index = JSON.parse(idx.text); record('scenes/index.json', true, `${index.count} scenes, ${index.ready} ready`); }
    catch (e) { record('scenes/index.json', false, 'not valid JSON: ' + e.message); }
  }

  /* 5 — every scene the index promises */
  if (index) {
    for (const s of index.scenes || []) {
      const r = await get('/' + s.file);
      if (r.status !== 200) { record(`scene ${s.id}`, false, `HTTP ${r.status}`); continue; }
      if (looksLikeHtml(r.text)) { record(`scene ${s.id}`, false, 'served the APP SHELL — not deployed'); continue; }
      try {
        const scene = JSON.parse(r.text);
        const parts = (scene.structures || []).filter(x => x.role === 'part').length;
        record(`scene ${s.id}`, scene.id === s.id, `${parts} parts · ${scene.status}`);
      } catch (e) { record(`scene ${s.id}`, false, 'not valid JSON'); }
    }
  }

  /* 6 — the mesh CDN, from wherever this is run */
  const cdn = 'https://cdn.jsdelivr.net/gh/Kevin-Mattheus-Moerman/BodyParts3D@main/assets/BodyParts3D_data/stl/FMA37686.stl';
  try {
    const r = await fetch(cdn, { method: 'HEAD' });
    record('mesh CDN reachable', r.ok, r.ok ? 'FMA37686.stl 200' : `HTTP ${r.status}`);
  } catch (e) { record('mesh CDN reachable', false, e.message + ' (students still fine if their network allows it)'); }

  const pad = Math.max(...results.map(r => r.what.length));
  let bad = 0;
  for (const r of results) {
    if (!r.ok) bad++;
    console.log(`${r.ok ? '  ok  ' : '  FAIL'}  ${r.what.padEnd(pad)}  ${r.detail || ''}`);
  }
  console.log(`\n${results.length - bad}/${results.length} checks passed.`);
  if (bad) console.log('\nA scene served as the APP SHELL means the file is missing from the deploy — push it, do not debug the app.');
  process.exit(bad ? 1 : 0);
}
main();
