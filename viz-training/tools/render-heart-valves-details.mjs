/* MedBank · detail frames for models3d/heart-valves.js
 *
 * Companion to render-heart-valves.mjs, which renders the frames the SCENE asks for. This one renders
 * one valve at a time, open and shut, so a reviewer can check each of the four against a textbook
 * plate without the other three in the way — and so the frames in models-out/heart-valves/d-*.png
 * have a tool behind them rather than being pictures nobody can reproduce.
 *
 * Run from the repo root:  node viz-training/tools/render-heart-valves-details.mjs
 * Same substrate caveat as render-heart-valves.mjs: chromium is not on the device VM, so this runs in
 * a cloud container against the repo's own files.
 */
import { chromium } from 'playwright';
import http from 'http'; import fs from 'fs'; import path from 'path';
const ROOT=process.cwd(); const MIME={'.js':'text/javascript','.html':'text/html'};
const srv=http.createServer((q,r)=>{const p=path.join(ROOT,decodeURIComponent(q.url.split('?')[0]));
 fs.readFile(p,(e,b)=>{if(e){r.writeHead(404);return r.end('no');}r.writeHead(200,{'content-type':MIME[path.extname(p)]||'application/octet-stream'});r.end(b);});});
await new Promise(r=>srv.listen(0,r)); const B=`http://127.0.0.1:${srv.address().port}/`;
const W=900,H=700;
fs.mkdirSync(ROOT+'/_d',{recursive:true});
fs.writeFileSync(ROOT+'/_d/s.html',`<!doctype html><meta charset=utf8><link rel=icon href="data:,"><body style="margin:0;background:#0e1626">
<canvas id=c width=${W} height=${H}></canvas>
<script src="${B}node_modules/three/build/three.js"><\/script>
<script src="${B}models3d/render-kit.js"><\/script>
<script src="${B}models3d/heart-valves.js"><\/script>
<script>
const rend=new THREE.WebGLRenderer({canvas:document.getElementById('c'),antialias:true});
rend.setSize(${W},${H},false);rend.setPixelRatio(1);VizKit.configureRenderer(rend);
const sc=new THREE.Scene();sc.background=VizKit.bg(0x0e1626);const L=VizKit.standardLights(sc);
const cam=new THREE.PerspectiveCamera(34,${W}/${H},0.1,400);const M=window.MB3D_MODELS['heart-valves'];
let g=null;
window.shot=function(t,opts,keys,eye){
  if(g)sc.remove(g);
  g=M.build(t,Object.assign({},M.FULL,opts||{}));
  if(keys)g.traverse(o=>{if(o.isMesh)o.visible=keys.some(k=>(o.userData.key||'').indexOf(k)===0);});
  g.updateMatrixWorld(true);sc.add(g);
  const box=new THREE.Box3();g.traverse(o=>{if(o.isMesh&&o.visible)box.expandByObject(o);});
  const s=box.getSize(new THREE.Vector3());
  const pr=new THREE.Mesh(new THREE.BoxGeometry(Math.max(.01,s.x),Math.max(.01,s.y),Math.max(.01,s.z)));
  box.getCenter(pr.position);pr.updateMatrixWorld(true);
  const f=VizKit.fitCamera(cam,pr,1.1);const d=new THREE.Vector3().fromArray(eye).normalize();
  cam.position.copy(f.centre).addScaledVector(d,f.distance);cam.up.set(0,1,0);
  if(Math.abs(d.y)>0.97)cam.up.set(0,0,-1);
  cam.lookAt(f.centre);L.key.position.copy(cam.position).add(new THREE.Vector3(4,7,5));
  rend.render(sc,cam);return true;};
<\/script>`);
const b=await chromium.launch({executablePath:'/opt/pw-browsers/chromium-1194/chrome-linux/chrome',args:['--use-gl=swiftshader','--enable-unsafe-swiftshader','--no-sandbox']});
const p=await b.newPage({viewport:{width:W,height:H}});
const errs=[];p.on('pageerror',e=>errs.push(String(e)));
await p.goto(B+'_d/s.html'); await p.waitForFunction('typeof window.shot==="function"');
const OUT='viz-training/models-out/heart-valves'; fs.mkdirSync(OUT,{recursive:true});
const jobs=[
 ['d-aortic-shut',0.80,{ghost:false},['aortic_','annulus_aortic','ostium'],[0.5,0.55,1]],
 ['d-aortic-open',0.35,{ghost:false},['aortic_','annulus_aortic','ostium'],[0.5,0.55,1]],
 ['d-aortic-open-top',0.35,{ghost:false},['aortic_','annulus_aortic','ostium'],[0,1,0.001]],
 ['d-pulm-shut',0.80,{ghost:false},['pulmonary_','annulus_pulmonary'],[0.5,0.55,1]],
 ['d-mitral-shut',0.35,{ghost:false},['mitral_','annulus_mitral','chordae_mitral','pap_'],[1,0.25,0.4]],
 ['d-mitral-open',0.80,{ghost:false},['mitral_','annulus_mitral','chordae_mitral','pap_'],[1,0.25,0.4]],
 ['d-tricuspid-shut',0.35,{ghost:false},['tricuspid_','annulus_tricuspid','chordae_tricuspid','papillary_rv'],[-1,0.25,0.4]],
 ['d-all-sup',0.80,{ghost:false,roots:false},null,[0,1,0.001]],
];
for(const [nm,t,o,k,eye] of jobs){ await p.evaluate(([t,o,k,e])=>window.shot(t,o,k,e),[t,o,k,eye]);
  await p.locator('#c').screenshot({path:`${OUT}/${nm}.png`}); }
console.log('errs',errs); await b.close(); srv.close();
