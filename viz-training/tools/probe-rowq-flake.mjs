/* probe for review finding F4: row Q passed 6 of 7 identical harness runs. Is the instability
   ACROSS pages or WITHIN one page? If within, it is state the battery carries; if across, it is
   something outside the model. Reports Q_bad verbatim every time. */
import { chromium } from 'playwright';
import { mkdirSync, writeFileSync, existsSync, readdirSync } from 'fs';
import http from 'http'; import path from 'path'; import fs from 'fs';
const ROOT=process.cwd(), MODEL='neurulation-neural-plate-tube', OUT='viz-training/models-out/'+MODEL;
function findChromium(){const b='/opt/pw-browsers';if(existsSync(b))for(const d of readdirSync(b))for(const r of ['chrome-linux/chrome','chrome-linux/headless_shell']){const p=path.join(b,d,r);if(existsSync(p))return p;}return null;}
const MIME={'.js':'text/javascript','.json':'application/json','.html':'text/html'};
const s=http.createServer((q,r)=>{const p=path.join(ROOT,decodeURIComponent(q.url.split('?')[0]));fs.readFile(p,(e,b)=>{if(e){r.writeHead(404);return r.end('no');}r.writeHead(200,{'content-type':MIME[path.extname(p)]||'application/octet-stream'});r.end(b);});});
await new Promise(r=>s.listen(0,r)); const BASE=`http://127.0.0.1:${s.address().port}/`;
mkdirSync(OUT,{recursive:true});
writeFileSync(OUT+'/_probe.html','<!doctype html><meta charset=utf-8><body style="margin:0"><canvas id=c width=400 height=300></canvas></body>');
const REPS = Number(process.argv[2]||6);
const br=await chromium.launch({executablePath:findChromium()||undefined,args:['--use-gl=swiftshader','--enable-unsafe-swiftshader','--no-sandbox']});
async function newPage(){ const pg=await br.newPage({viewport:{width:400,height:300}});
  await pg.goto(BASE+OUT+'/_probe.html');
  await pg.addScriptTag({url:BASE+'viz-training/spike/three.min.js'});
  await pg.addScriptTag({url:BASE+'models3d/render-kit.js'});
  await pg.addScriptTag({url:BASE+'models3d/'+MODEL+'.js'});
  return pg; }
const runQ = pg => pg.evaluate(([mod])=>{ const a=window.MB3D_MODELS[mod].acceptance();
  const bad=(a.measured && a.measured.Q_bad) || [];
  return { ok:a.pass.Q, bad:bad.map(x=>x.pair+'@'+x.at+'/'+(x.variant||'')+'='+x.frac) }; },[MODEL]);
console.log('--- A: ' + REPS + ' evaluations in ONE page (same JS realm, module state carried) ---');
{ const pg=await newPage();
  for(let i=1;i<=REPS;i++){ const r=await runQ(pg); console.log('  run '+i+'  Q '+(r.ok?'pass':'FAIL')+(r.bad.length?'  '+r.bad.join('  '):'')); }
  await pg.close(); }
console.log('--- B: ' + REPS + ' evaluations each in a FRESH page ---');
for(let i=1;i<=REPS;i++){ const pg=await newPage(); const r=await runQ(pg);
  console.log('  run '+i+'  Q '+(r.ok?'pass':'FAIL')+(r.bad.length?'  '+r.bad.join('  '):'')); await pg.close(); }
await br.close(); s.close();
