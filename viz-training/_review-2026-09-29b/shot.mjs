import { chromium } from 'playwright';
import { existsSync, readdirSync, writeFileSync, readFileSync } from 'fs';
import http from 'http'; import path from 'path'; import fs from 'fs';
const ROOT=process.cwd();
function findChromium(){const b='/opt/pw-browsers';for(const d of readdirSync(b))for(const r of ['chrome-linux/chrome','chrome-linux/headless_shell']){const p=path.join(b,d,r);if(existsSync(p))return p;}}
const MIME={'.js':'text/javascript','.json':'application/json'};
const server=http.createServer((q,s)=>{const p=path.join(ROOT,decodeURIComponent(q.url.split('?')[0]));fs.readFile(p,(e,b)=>{if(e){s.writeHead(404);return s.end('no');}s.writeHead(200,{'content-type':MIME[path.extname(p)]||'application/octet-stream'});s.end(b);});});
await new Promise(r=>server.listen(0,r));
const B=`http://127.0.0.1:${server.address().port}/`;
const W=1100,H=900;
const html=`<!doctype html><meta charset=utf8><link rel=icon href="data:,"><body style="margin:0;background:#0e1626">
<canvas id=c width=${W} height=${H}></canvas>
<script src="${B}node_modules/three/build/three.js"><\/script>
<script src="${B}models3d/render-kit.js"><\/script>
<script src="${B}models3d/heart-valves.js"><\/script>
<script>
window.MEDBANK_CONFIG={MODEL_BASE:'${B}models3d/'};
const renderer=new THREE.WebGLRenderer({canvas:document.getElementById('c'),antialias:true});
renderer.setSize(${W},${H},false);renderer.setPixelRatio(1);VizKit.configureRenderer(renderer);
const scene=new THREE.Scene();scene.background=VizKit.bg(0x0e1626);
const L=VizKit.standardLights(scene);
const camera=new THREE.PerspectiveCamera(34,${W}/${H},0.1,400);
const MOD=window.MB3D_MODELS['heart-valves'];let group=null;
window.shot=function(t,keys,eye){
 if(group)scene.remove(group);
 group=MOD.build(t,Object.assign({},MOD.FULL));group.updateMatrixWorld(true);
 group.traverse(function(o){if(!o.isMesh)return;o.visible=!keys||keys.indexOf(o.userData.key)>=0;});
 scene.add(group);
 const box=new THREE.Box3();group.traverse(function(o){if(o.isMesh&&o.visible&&!(o.userData||{}).outline)box.expandByObject(o);});
 const s=box.getSize(new THREE.Vector3()),c=box.getCenter(new THREE.Vector3());
 const proxy=new THREE.Mesh(new THREE.BoxGeometry(Math.max(0.01,s.x),Math.max(0.01,s.y),Math.max(0.01,s.z)));
 proxy.position.copy(c);proxy.updateMatrixWorld(true);
 const f=VizKit.fitCamera(camera,proxy,1.08);
 const dir=new THREE.Vector3().fromArray(eye).normalize();
 camera.position.copy(f.centre).addScaledVector(dir,f.distance);
 camera.up.set(0,1,0); if(Math.abs(dir.y)>0.97)camera.up.set(0,0,-1);
 camera.lookAt(f.centre);
 L.key.position.copy(camera.position).add(new THREE.Vector3(4,7,5));
 L.rim.position.copy(f.centre).addScaledVector(dir,-f.distance).add(new THREE.Vector3(-3,4,0));
 renderer.render(scene,camera);return true;
};
<\/script>`;
const br=await chromium.launch({executablePath:findChromium()});
const pg=await br.newPage({viewport:{width:W,height:H}});
await pg.setContent(html,{waitUntil:'networkidle'});
const shots=JSON.parse(readFileSync('_rev/shots.json','utf8'));
for(const s of shots){
  await pg.evaluate(`window.shot(${s.t},${JSON.stringify(s.keys)},${JSON.stringify(s.eye)})`);
  await pg.locator('#c').screenshot({path:'_rev/'+s.name+'.png'});
  console.log('wrote',s.name);
}
await br.close();server.close();
