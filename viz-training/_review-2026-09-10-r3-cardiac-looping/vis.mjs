import { chromium } from 'playwright';
import { writeFileSync } from 'fs';
import http from 'http'; import path from 'path'; import fs from 'fs';
const ROOT='/home/claude/rev', OUT=ROOT+'/out';
const MIME={'.js':'text/javascript','.json':'application/json','.html':'text/html'};
const server=http.createServer((q,s)=>{const p=path.join(ROOT,decodeURIComponent(q.url.split('?')[0]));
 fs.readFile(p,(e,b)=>{if(e){s.writeHead(404);return s.end('no');}s.writeHead(200,{'content-type':MIME[path.extname(p)]||'application/octet-stream'});s.end(b);});});
await new Promise(r=>server.listen(0,r));
const PORT=server.address().port,BASE=`http://127.0.0.1:${PORT}/`;
const W=760,H=900;
const html=`<!doctype html><meta charset=utf8><link rel="icon" href="data:,"><body style="margin:0;background:#0e1626">
<canvas id=c width=${W} height=${H}></canvas>
<script src="${BASE}node_modules/three/build/three.js"><\/script><script src="${BASE}models3d/render-kit.js"><\/script>
<script src="${BASE}models3d/cardiac-looping.js"><\/script><script>
window.MEDBANK_CONFIG={MODEL_BASE:'${BASE}models3d/'};
const renderer=new THREE.WebGLRenderer({canvas:document.getElementById('c'),antialias:false,preserveDrawingBuffer:true});
renderer.setSize(${W},${H},false);renderer.setPixelRatio(1);VizKit.configureRenderer(renderer);
const scene=new THREE.Scene();scene.background=VizKit.bg(0x0e1626);VizKit.standardLights(scene);
const cam=new THREE.PerspectiveCamera(36,${W}/${H},0.1,200);let cur=null;
window.__shot=function(t,opts,view,onlyKeys,fitKeys){
 if(cur)scene.remove(cur);
 const M=window.MB3D_MODELS['cardiac-looping'];const g=M.build(t,opts);cur=g;scene.add(g);
 g.traverse(o=>{let k=null,n=o;while(n){if(n.userData&&n.userData.key){k=n.userData.key;break;}n=n.parent;}
  if(o.isMesh&&onlyKeys&&onlyKeys.length)o.visible=onlyKeys.indexOf(k)>=0;});
 const box=new THREE.Box3();g.traverse(o=>{if(!o.isMesh)return;let k=null,n=o;while(n){if(n.userData&&n.userData.key){k=n.userData.key;break;}n=n.parent;}
  if(!fitKeys||fitKeys.indexOf(k)>=0){o.updateMatrixWorld(true);box.expandByObject(o);}});
 const c=box.getCenter(new THREE.Vector3()),s=box.getSize(new THREE.Vector3());
 const R=Math.max(s.x,s.y,s.z)*0.5,d=R/Math.tan(36*Math.PI/360)*1.35;
 const dirs={anterior:[0,0,1],lateral:[1,0,0],inferior:[0,-1,0.001],superior:[0,1,0.001]};
 const v=dirs[view]||dirs.anterior;
 cam.position.set(c.x+v[0]*d,c.y+v[1]*d,c.z+v[2]*d);cam.up.set(0,1,0);cam.lookAt(c);
 renderer.render(scene,cam);return true;};
window.__ready=true;</script></body>`;
writeFileSync(path.join(OUT,'vis.html'),html);
const b=await chromium.launch({executablePath:'/opt/pw-browsers/chromium-1194/chrome-linux/chrome',args:['--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader']});
const p=await b.newPage({viewport:{width:W,height:H}});
await p.goto(BASE+'out/vis.html');await p.waitForFunction('window.__ready===true');
const FIT=['sinus','atrium','ventricle','bulbus','truncus','veins','arches'];
// view 9 camera: mirror + midline, anterior
async function shot(name,t,opts,view,only,fit){await p.evaluate(a=>window.__shot(...a),[t,opts,view,only||null,fit||null]);await p.screenshot({path:path.join(OUT,name+'.png')});}
await shot('m9-all',1,{mirror:true,midline:true},'anterior',null,FIT);
await shot('m9-midonly',1,{mirror:true,midline:true},'anterior',['midline'],FIT);
await shot('sinus-inferior-b',0.65,{},'inferior',null,FIT);
await shot('truncus-superior-a',0,{},'superior',null,FIT);
await b.close();server.close();
