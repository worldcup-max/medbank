import { chromium } from 'playwright';
import { readFileSync, existsSync, mkdirSync } from 'fs';
import http from 'http'; import path from 'path';
const ROOT=process.cwd(), OUT=path.join(ROOT,'viz-training','models-out','primitive-gut-tube');
mkdirSync(OUT,{recursive:true});
const W=1000,H=760;
const MIME={'.js':'text/javascript','.json':'application/json','.html':'text/html'};
const server=http.createServer((q,r)=>{if(/favicon/.test(q.url)){r.writeHead(204);r.end();return;}
 const p=path.join(ROOT,decodeURIComponent(q.url.split('?')[0]));
 if(!existsSync(p)){r.writeHead(404);r.end('no');return;}
 r.writeHead(200,{'content-type':MIME[path.extname(p)]||'application/octet-stream'});r.end(readFileSync(p));});
await new Promise(r=>server.listen(0,r));
const B=`http://127.0.0.1:${server.address().port}/`;
const html=`<!doctype html><html><head><meta charset=utf-8><style>html,body{margin:0;background:#101418}canvas{display:block}</style></head><body>
<canvas id=c width=${W} height=${H}></canvas>
<script src="${B}node_modules/three/build/three.js"><\/script>
<script src="${B}models3d/render-kit.js"><\/script>
<script src="${B}models3d/primitive-gut-tube.js"><\/script>
<script>
const renderer=new THREE.WebGLRenderer({canvas:document.getElementById('c'),antialias:true});
renderer.setPixelRatio(1);VizKit.configureRenderer(renderer);
const scene=new THREE.Scene();scene.background=VizKit.bg('#101418');VizKit.standardLights(scene);
const camera=new THREE.PerspectiveCamera(32,${W}/${H},0.1,200);
let group=null;const M=()=>window.MB3D_MODELS['primitive-gut-tube'];
window.buildKeep=function(t,keep,opts){
  if(group)scene.remove(group);
  group=M().build(t,opts||M().FULL);
  const drop=[];
  group.children.forEach(m=>{const k=m.userData.key;if(k&&keep.indexOf(k)<0)drop.push(m);});
  drop.forEach(m=>group.remove(m));
  scene.add(group);
  return group.children.filter(c=>!c.userData.outline).map(c=>c.userData.key);
};
window.shoot=function(dir){const d=new THREE.Vector3().fromArray(dir).normalize();
  const fit=VizKit.fitCamera(camera,group,1.08);
  camera.position.copy(fit.centre).addScaledVector(d,fit.distance);
  camera.up.set(0,1,0);camera.lookAt(fit.centre);renderer.render(scene,camera);return true;};
window.extentOfKey=function(t,key){const g=M().build(t,M().FULL);let r=null;
  g.children.forEach(m=>{if(m.userData.key!==key||m.userData.outline||!m.geometry)return;
    m.geometry.computeBoundingBox();const b=m.geometry.boundingBox;
    r={min:b.min.toArray(),max:b.max.toArray(),ext:[b.max.x-b.min.x,b.max.y-b.min.y,b.max.z-b.min.z]};});
  return r;};
<\/script></body></html>`;
const br=await chromium.launch({executablePath:'/opt/pw-browsers/chromium-1194/chrome-linux/chrome',args:['--use-gl=swiftshader','--no-sandbox']});
const pg=await br.newPage({viewport:{width:W,height:H}});
await pg.setContent(html,{waitUntil:'load'});
const KEEP=['midgut','hindgut','caecum','appendix','watershed','papilla','mesentery','sma','ima','aorta','coeliac'];
for(const t of [1,0.9]){
  const kept=await pg.evaluate(([t,k])=>window.buildKeep(t,k),[t,KEEP]);
  await pg.evaluate(d=>window.shoot(d),[0,0,1]);
  await pg.locator('#c').screenshot({path:path.join(OUT,`t${String(Math.round(t*100)).padStart(3,'0')}-abdomen-anterior.png`)});
  if(t===1){ await pg.evaluate(d=>window.shoot(d),[0.6,0.25,1]);
    await pg.locator('#c').screenshot({path:path.join(OUT,'t100-abdomen-oblique.png')}); }
  console.log('t',t,'kept',JSON.stringify(kept));
}
for(const k of ['duodenum','midgut','hindgut','stomach']){
  console.log(k, JSON.stringify(await pg.evaluate(key=>window.extentOfKey(1,key),k)));
}
await br.close(); server.close();
