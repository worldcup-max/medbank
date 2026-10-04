/* MedBank · REVIEW 2026-09-29 · independent id-pick harness for heart-external.
 * Not the builder's tool. Every mesh gets a unique FLAT colour, unlit, so a pixel count is an
 * unambiguous "how much of this frame is this structure" and the composite is a readable map.
 * Also renders each named structure alone against the bare shell to test legibility in its own beat. */
import { chromium } from 'playwright';
import { writeFileSync, mkdirSync, existsSync, readFileSync } from 'fs';
import http from 'http'; import path from 'path'; import fs from 'fs';
const ROOT = process.cwd();
const OUT = 'viz-training/_review-2026-09-29';
mkdirSync(OUT, { recursive: true });
const MIME = { '.js':'text/javascript', '.json':'application/json', '.html':'text/html' };
const server = http.createServer((req,res)=>{ const p=path.join(ROOT,decodeURIComponent(req.url.split('?')[0]));
  fs.readFile(p,(e,buf)=>{ if(e){res.writeHead(404);return res.end('no');} res.writeHead(200,{'content-type':MIME[path.extname(p)]||'application/octet-stream'}); res.end(buf); }); });
await new Promise(r=>server.listen(0,r));
const BASE = `http://127.0.0.1:${server.address().port}/`;
const W=900,H=900;
const html = `<!doctype html><meta charset=utf8><link rel="icon" href="data:,">
<body style="margin:0;background:#000"><canvas id=c width=${W} height=${H}></canvas>
<script src="${BASE}node_modules/three/build/three.js"><\/script>
<script src="${BASE}models3d/render-kit.js"><\/script>
<script src="${BASE}models3d/heart-external.js"><\/script>
<script>
const renderer=new THREE.WebGLRenderer({canvas:document.getElementById('c'),antialias:false});
renderer.setSize(${W},${H},false); renderer.setPixelRatio(1);
const scene=new THREE.Scene(); scene.background=new THREE.Color(0x000000);
const camera=new THREE.PerspectiveCamera(34,1,0.1,400);
const MOD=window.MB3D_MODELS['heart-external'];
const VIEW_DIR={anterior:[0,0,1],posterior:[0,0,-1],lateral:[1,0,0],medial:[-1,0,0],superior:[0,1,0.001],inferior:[0,-1,0.001]};
let ID2KEY={};
/* fit against a REFERENCE build so every frame of a series shares one camera — otherwise a pixel
   share compares two different zooms and the comparison is meaningless. */
window.idRender=function(view,opts,fitOpts){
  const g=MOD.build(1,Object.assign({},opts||{}));
  const gf=MOD.build(1,Object.assign({},fitOpts||opts||{}));
  g.updateMatrixWorld(true); gf.updateMatrixWorld(true);
  ID2KEY={}; let n=0;
  g.traverse(o=>{ if(!o.isMesh||!o.geometry) return; const u=o.userData||{};
    if(u.outline){o.visible=false;return;}
    n++; const id=n; ID2KEY[id]=u.key;
    const c=new THREE.Color(); c.setRGB(((id>>0)&15)/15,((id>>4)&15)/15,((id>>8)&15)/15);
    o.material=new THREE.MeshBasicMaterial({color:c,side:THREE.FrontSide});
  });
  while(scene.children.length) scene.remove(scene.children[0]);
  scene.add(g);
  const f=VizKit.fitCamera(camera,gf,1.06);
  const d=new THREE.Vector3().fromArray(VIEW_DIR[view]||[0,0,1]).normalize();
  camera.position.copy(f.centre).addScaledVector(d,f.distance);
  camera.up.set(0,1,0); camera.lookAt(f.centre);
  renderer.render(scene,camera);
  const gl=renderer.getContext(); const px=new Uint8Array(${W}*${H}*4);
  gl.readPixels(0,0,${W},${H},gl.RGBA,gl.UNSIGNED_BYTE,px);
  const counts={}; let lit=0;
  for(let i=0;i<px.length;i+=4){
    const id=Math.round(px[i]/255*15)|(Math.round(px[i+1]/255*15)<<4)|(Math.round(px[i+2]/255*15)<<8);
    if(!id) continue; lit++; const k=ID2KEY[id]||('?'+id); counts[k]=(counts[k]||0)+1;
  }
  return {counts,lit,total:${W}*${H}};
};
<\/script>`;
writeFileSync(`${OUT}/_id.html`, html);
function findChromium(){ const root='/opt/pw-browsers'; if(!existsSync(root)) return undefined;
  for(const d of fs.readdirSync(root)) for(const rel of ['chrome-linux/chrome','chrome-linux/headless_shell']){
    const full=path.join(root,d,rel); if(existsSync(full)) return full; } return undefined; }
const b=await chromium.launch({executablePath:findChromium(),args:['--use-gl=swiftshader','--enable-unsafe-swiftshader','--no-sandbox']});
const p=await b.newPage({viewport:{width:W,height:H}});
const log=[]; p.on('console',m=>log.push(m.type()+': '+m.text())); p.on('pageerror',e=>log.push('pageerror: '+e.message));
await p.goto(BASE+OUT+'/_id.html'); await p.waitForFunction('typeof window.idRender==="function"');

const JOBS = JSON.parse(readFileSync(process.argv[2],'utf8'));
const out={};
for (const j of JOBS){
  const r = await p.evaluate(([v,o,f])=>window.idRender(v,o,f), [j.view,j.opts,j.fit||j.opts]);
  if (j.png) await p.locator('#c').screenshot({path:`${OUT}/${j.name}.png`});
  const rows=Object.entries(r.counts).sort((a,b2)=>b2[1]-a[1])
    .map(([k,v])=>[k,+(100*v/r.lit).toFixed(2),+(100*v/r.total).toFixed(2)]);
  out[j.name]={view:j.view,opts:j.opts,litPctOfFrame:+(100*r.lit/r.total).toFixed(2),rows};
  console.log('\n== '+j.name+' ('+j.view+') lit='+out[j.name].litPctOfFrame+'% of frame');
  for(const [k,share,frame] of rows) console.log('   '+String(k).padEnd(30)+String(share).padStart(7)+'% of subject '+String(frame).padStart(7)+'% of frame');
}
writeFileSync(`${OUT}/idpick.json`, JSON.stringify(out,null,1));
console.log('\nCONSOLE: '+(log.length?log.join(' | '):'clean'));
await b.close(); server.close();
