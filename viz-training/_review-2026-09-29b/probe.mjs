import { chromium } from 'playwright';
import { readFileSync, existsSync, readdirSync, writeFileSync } from 'fs';
import http from 'http'; import path from 'path'; import fs from 'fs';
const ROOT = process.cwd();
function findChromium(){const b='/opt/pw-browsers';for(const d of readdirSync(b))for(const r of ['chrome-linux/chrome','chrome-linux/headless_shell']){const p=path.join(b,d,r);if(existsSync(p))return p;}}
const MIME={'.js':'text/javascript','.json':'application/json','.html':'text/html'};
const server=http.createServer((req,res)=>{const p=path.join(ROOT,decodeURIComponent(req.url.split('?')[0]));fs.readFile(p,(e,buf)=>{if(e){res.writeHead(404);return res.end('no');}res.writeHead(200,{'content-type':MIME[path.extname(p)]||'application/octet-stream'});res.end(buf);});});
await new Promise(r=>server.listen(0,r));
const BASE=`http://127.0.0.1:${server.address().port}/`;
const html=`<!doctype html><meta charset=utf8><link rel=icon href="data:,"><body style="margin:0;background:#0e1626">
<canvas id=c width=1100 height=900></canvas>
<script src="${BASE}node_modules/three/build/three.js"><\/script>
<script src="${BASE}models3d/render-kit.js"><\/script>
<script src="${BASE}models3d/heart-valves.js"><\/script>
<script>
window.MEDBANK_CONFIG={MODEL_BASE:'${BASE}models3d/'};
const MOD=window.MB3D_MODELS['heart-valves'];
window.centroids=function(t){
  const g=MOD.build(t,Object.assign({},MOD.FULL));g.updateMatrixWorld(true);
  const out={};
  g.traverse(function(o){
    if(!o.isMesh||(o.userData||{}).outline)return;
    const k=o.userData.key;const pos=o.geometry.attributes.position;
    const v=new THREE.Vector3();let n=0,cx=0,cy=0,cz=0;
    const mn=[1e9,1e9,1e9],mx=[-1e9,-1e9,-1e9];
    for(let i=0;i<pos.count;i++){v.fromBufferAttribute(pos,i);o.localToWorld(v);
      cx+=v.x;cy+=v.y;cz+=v.z;n++;
      mn[0]=Math.min(mn[0],v.x);mn[1]=Math.min(mn[1],v.y);mn[2]=Math.min(mn[2],v.z);
      mx[0]=Math.max(mx[0],v.x);mx[1]=Math.max(mx[1],v.y);mx[2]=Math.max(mx[2],v.z);}
    if(!out[k])out[k]={n:0,cx:0,cy:0,cz:0,mn:[1e9,1e9,1e9],mx:[-1e9,-1e9,-1e9]};
    const O=out[k];O.n+=n;O.cx+=cx;O.cy+=cy;O.cz+=cz;
    for(let j=0;j<3;j++){O.mn[j]=Math.min(O.mn[j],mn[j]);O.mx[j]=Math.max(O.mx[j],mx[j]);}
  });
  const res={};for(const k in out){const O=out[k];res[k]={c:[O.cx/O.n,O.cy/O.n,O.cz/O.n],mn:O.mn,mx:O.mx,verts:O.n};}
  return res;
};
window.axes=MOD.AXES||null;
window.modelKeys=function(t){const g=MOD.build(t,Object.assign({},MOD.FULL));const s=new Set();g.traverse(o=>{if(o.isMesh&&!(o.userData||{}).outline)s.add(o.userData.key);});return [...s];};
window.claim=function(n,t){return MOD.claimMeasure?MOD.claimMeasure(n,t):null;};
<\/script>`;
const browser=await chromium.launch({executablePath:findChromium()});
const page=await browser.newPage();
const msgs=[];page.on('console',m=>msgs.push(m.type()+': '+m.text()));page.on('pageerror',e=>msgs.push('pageerror: '+e.message));
await page.setContent(html,{waitUntil:'networkidle'});
const out={};
out.axes=await page.evaluate('window.axes');
for(const t of [0.4,0.72]) out['c'+t]=await page.evaluate(`window.centroids(${t})`);
out.keys=await page.evaluate('window.modelKeys(0.4)');
out.console=msgs;
writeFileSync('_rev/centroids.json',JSON.stringify(out,null,1));
console.log('axes',JSON.stringify(out.axes));
console.log('console',msgs);
await browser.close();server.close();
