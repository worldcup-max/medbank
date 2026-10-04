/* probe for review finding F4, second hypothesis: does row Q depend on WHAT RAN BEFORE IT in the
   same page? builtAt() caches by (t, flags) and NOT by PERT, so a perturbed build can be served
   back to an unperturbed reader. negatives() runs the perturbations. */
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
const br=await chromium.launch({executablePath:findChromium()||undefined,args:['--use-gl=swiftshader','--enable-unsafe-swiftshader','--no-sandbox']});
const pg=await br.newPage({viewport:{width:400,height:300}});
await pg.goto(BASE+OUT+'/_probe.html');
await pg.addScriptTag({url:BASE+'viz-training/spike/three.min.js'});
await pg.addScriptTag({url:BASE+'models3d/render-kit.js'});
await pg.addScriptTag({url:BASE+'models3d/'+MODEL+'.js'});
const r = await pg.evaluate(([mod])=>{
  const M=window.MB3D_MODELS[mod];
  const Q = () => { const a=M.acceptance();
    return { ok:a.pass.Q, bad:((a.measured&&a.measured.Q_bad)||[]).map(x=>x.pair+'@'+x.at+'/'+(x.variant||'normal')+'='+x.frac) }; };
  const out = {};
  out.before = Q();                 // clean page, nothing perturbed yet
  const n = M.negatives();          // this runs the three perturbations
  out.pertNames = Object.keys(n.perturbations||{});
  out.pertLeft = JSON.parse(JSON.stringify(M.PERT||{}));   // did they restore?
  out.after = Q();                  // same call, after the perturbations have run
  out.after2 = Q();
  return out;
},[MODEL]);
console.log('PERT left set after negatives():', JSON.stringify(r.pertLeft), ' perturbations run:', r.pertNames.join(','));
for (const k of ['before','after','after2'])
  console.log(k.padEnd(7)+' Q '+(r[k].ok?'pass':'FAIL')+(r[k].bad.length?'   '+r[k].bad.join('   '):''));
await br.close(); s.close();
