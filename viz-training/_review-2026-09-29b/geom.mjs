import { chromium } from 'playwright';
import { existsSync, readdirSync, writeFileSync } from 'fs';
import http from 'http'; import path from 'path'; import fs from 'fs';
const ROOT=process.cwd();
function findChromium(){const b='/opt/pw-browsers';for(const d of readdirSync(b))for(const r of ['chrome-linux/chrome','chrome-linux/headless_shell']){const p=path.join(b,d,r);if(existsSync(p))return p;}}
const MIME={'.js':'text/javascript','.json':'application/json'};
const server=http.createServer((q,s)=>{const p=path.join(ROOT,decodeURIComponent(q.url.split('?')[0]));fs.readFile(p,(e,b)=>{if(e){s.writeHead(404);return s.end('no');}s.writeHead(200,{'content-type':MIME[path.extname(p)]||'application/octet-stream'});s.end(b);});});
await new Promise(r=>server.listen(0,r));
const B=`http://127.0.0.1:${server.address().port}/`;
const html=`<!doctype html><meta charset=utf8><link rel=icon href="data:,"><body>
<script src="${B}node_modules/three/build/three.js"><\/script>
<script src="${B}models3d/render-kit.js"><\/script>
<script src="${B}models3d/heart-valves.js"><\/script>
<script>
window.MEDBANK_CONFIG={MODEL_BASE:'${B}models3d/'};
const MOD=window.MB3D_MODELS['heart-valves'];
window.dump=function(t,keys){
 const g=MOD.build(t,Object.assign({},MOD.FULL));g.updateMatrixWorld(true);
 const out={};
 g.traverse(function(o){
  if(!o.isMesh||(o.userData||{}).outline)return;
  const k=o.userData.key; if(keys.indexOf(k)<0)return;
  const pos=o.geometry.attributes.position, idx=o.geometry.index;
  const v=new THREE.Vector3(), P=[];
  for(let i=0;i<pos.count;i++){v.fromBufferAttribute(pos,i);o.localToWorld(v);P.push(v.x,v.y,v.z);}
  const I=[]; if(idx){for(let i=0;i<idx.count;i++)I.push(idx.getX(i));}else{for(let i=0;i<pos.count;i++)I.push(i);}
  if(!out[k])out[k]={P:[],I:[]};
  const base=out[k].P.length/3;
  out[k].P=out[k].P.concat(P); out[k].I=out[k].I.concat(I.map(x=>x+base));
 });
 return out;
};
<\/script>`;
const br=await chromium.launch({executablePath:findChromium()});
const pg=await br.newPage();
await pg.setContent(html,{waitUntil:'networkidle'});
const keys=["pap_anterolateral","pap_posteromedial","aortic_root",'pulmonary_root','ostium_left','ostium_right','aortic_right','aortic_left','aortic_noncoronary','annulus_aortic','annulus_pulmonary','chamber_ghost','mitral_anterior','mitral_posterior','annulus_mitral'];
const d=await pg.evaluate(`window.dump(0.4,${JSON.stringify(keys)})`);
writeFileSync('_rev/geom_t040.json',JSON.stringify(d));
const d2=await pg.evaluate(`window.dump(0.72,${JSON.stringify(keys)})`);
writeFileSync('_rev/geom_t072.json',JSON.stringify(d2));
console.log(Object.keys(d).map(k=>k+':'+(d[k].P.length/3)+'v/'+(d[k].I.length/3)+'t').join(' '));
await br.close();server.close();
