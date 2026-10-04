/* probe: per-panel census of the `sections` variant. Measures F1 (crest in beat 5's folds panel)
   and F2 (notochord calibre per panel) as NUMBERS, and renders one crop per panel so the pixels
   can be counted where the student would see them. Not a check; an instrument. */
import { chromium } from 'playwright';
import { readFileSync, mkdirSync, writeFileSync, existsSync, readdirSync } from 'fs';
import http from 'http'; import path from 'path'; import fs from 'fs';
const ROOT = process.cwd(); const MODEL = 'neurulation-neural-plate-tube';
const OUT = 'viz-training/models-out/' + MODEL; mkdirSync(OUT, { recursive: true });
function findChromium() { const base='/opt/pw-browsers';
  if (existsSync(base)) for (const d of readdirSync(base)) for (const rel of ['chrome-linux/chrome','chrome-linux/headless_shell']) {
    const p=path.join(base,d,rel); if (existsSync(p)) return p; } return null; }
const MIME={'.js':'text/javascript','.json':'application/json','.html':'text/html'};
const server=http.createServer((q,r)=>{const u=q.url.split('?')[0];const p=path.join(ROOT,decodeURIComponent(u));
  fs.readFile(p,(e,b)=>{if(e){r.writeHead(404);return r.end('no');}r.writeHead(200,{'content-type':MIME[path.extname(p)]||'application/octet-stream'});r.end(b);});});
await new Promise(r=>server.listen(0,r)); const BASE=`http://127.0.0.1:${server.address().port}/`;
const T_ARG = Number(process.argv[2] || 0.583333);
const browser=await chromium.launch({executablePath:findChromium()||undefined,args:['--use-gl=swiftshader','--enable-unsafe-swiftshader','--no-sandbox']});
const page=await browser.newPage({viewport:{width:1100,height:900}});
page.on('console',m=>{ if(m.type()==='error') console.log('PAGE ERR',m.text()); });
writeFileSync(OUT+'/_probe.html','<!doctype html><meta charset="utf-8"><body style="margin:0;background:#101828"><canvas id="c" width="1100" height="900"></canvas></body>');
await page.goto(BASE+OUT+'/_probe.html');
await page.addScriptTag({url:BASE+'viz-training/spike/three.min.js'});
await page.addScriptTag({url:BASE+'models3d/render-kit.js'});
await page.addScriptTag({url:BASE+'models3d/'+MODEL+'.js'});
const res = await page.evaluate(([mod, t]) => {
  const T=window.THREE, M=window.MB3D_MODELS[mod];
  const g = M.build(t, Object.assign({}, M.FULL, {sections:true}));
  const meshesOf = root => { const o=[]; root.traverse(n=>{ if(n.isMesh && n.userData && n.userData.key) o.push(n); }); return o; };
  const panels = g.children.map((panel, idx) => {
    const by = {};
    for (const m of meshesOf(panel)) {
      const k = m.userData.key;
      const pos = m.geometry.getAttribute('position');
      let bb = by[k] || (by[k] = {bodies:0, verts:0, min:[1e9,1e9,1e9], max:[-1e9,-1e9,-1e9]});
      bb.bodies++; bb.verts += pos.count;
      for (let i=0;i<pos.count;i++){ const x=pos.getX(i),y=pos.getY(i),z=pos.getZ(i);
        bb.min[0]=Math.min(bb.min[0],x+panel.position.x); bb.max[0]=Math.max(bb.max[0],x+panel.position.x);
        bb.min[1]=Math.min(bb.min[1],y+panel.position.y); bb.max[1]=Math.max(bb.max[1],y+panel.position.y);
        bb.min[2]=Math.min(bb.min[2],z+panel.position.z); bb.max[2]=Math.max(bb.max[2],z+panel.position.z); }
    }
    for (const k of Object.keys(by)) { const b=by[k]; b.span=[b.max[0]-b.min[0], b.max[1]-b.min[1], b.max[2]-b.min[2]].map(x=>+x.toFixed(4)); }
    return { idx, pos:[+panel.position.x.toFixed(4),+panel.position.y.toFixed(4),+panel.position.z.toFixed(4)], keys: by };
  });
  return { sections: g.userData.sections, panels };
}, [MODEL, T_ARG]);
console.log('t =', T_ARG, 'stations:', JSON.stringify(res.sections.stations), 'present:', res.sections.present.join(','));
console.log('cols', res.sections.cols, 'rows', res.sections.rows, 'pitchX', res.sections.pitchX.toFixed(4), 'pitchZ', res.sections.pitchZ.toFixed(4));
for (const p of res.panels) {
  console.log('\nPANEL ' + p.idx + '  (' + (res.sections.present[p.idx]||'?') + ')  at x=' + p.pos[0] + ' y=' + p.pos[1] + ' z=' + p.pos[2]);
  for (const k of Object.keys(p.keys).sort()) { const b=p.keys[k];
    console.log('   ' + k.padEnd(20) + ' bodies ' + String(b.bodies).padStart(3) + '  verts ' + String(b.verts).padStart(6) + '  span ' + JSON.stringify(b.span)); }
}
const want = ['neural_crest','notochord'];
console.log('\nPER-PANEL SUMMARY for ' + want.join(', ') + ':');
for (const k of want) console.log('  ' + k.padEnd(14) + res.panels.map(p=>(res.sections.present[p.idx]||'?')+'='+((p.keys[k]&&p.keys[k].bodies)||0)).join('  '));
console.log('  notochord x-span ' + res.panels.map(p=>(res.sections.present[p.idx]||'?')+'='+((p.keys.notochord&&p.keys.notochord.span[0])||0)).join('  '));
await browser.close(); server.close();
