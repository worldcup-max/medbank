import { chromium } from 'playwright';
import { writeFileSync, mkdirSync } from 'fs';
import http from 'http'; import path from 'path'; import fs from 'fs';
const ROOT='/home/claude/rev', OUT=ROOT+'/out'; mkdirSync(OUT,{recursive:true});
const MIME={'.js':'text/javascript','.json':'application/json','.html':'text/html'};
const server=http.createServer((req,res)=>{const p=path.join(ROOT,decodeURIComponent(req.url.split('?')[0]));
 fs.readFile(p,(e,buf)=>{if(e){res.writeHead(404);return res.end('no');}
 res.writeHead(200,{'content-type':MIME[path.extname(p)]||'application/octet-stream'});res.end(buf);});});
await new Promise(r=>server.listen(0,r));
const PORT=server.address().port, BASE=`http://127.0.0.1:${PORT}/`;
const W=760,H=900;
const html=`<!doctype html><meta charset=utf8><link rel="icon" href="data:,">
<body style="margin:0;background:#0e1626"><canvas id=c width=${W} height=${H}></canvas>
<script src="${BASE}node_modules/three/build/three.js"><\/script>
<script src="${BASE}models3d/render-kit.js"><\/script>
<script src="${BASE}models3d/cardiac-looping.js"><\/script>
<script>
window.MEDBANK_CONFIG={MODEL_BASE:'${BASE}models3d/'};
const renderer=new THREE.WebGLRenderer({canvas:document.getElementById('c'),antialias:true});
renderer.setSize(${W},${H},false); renderer.setPixelRatio(1);
VizKit.configureRenderer(renderer);
const scene=new THREE.Scene(); scene.background=VizKit.bg(0x0e1626);
VizKit.standardLights(scene);
const cam=new THREE.PerspectiveCamera(36,${W}/${H},0.1,200);
let current=null;
window.__render=function(t,opts,view,hide){
  if(current){scene.remove(current);}
  const M=window.MB3D_MODELS['cardiac-looping'];
  const g=M.build(t,opts); current=g; scene.add(g);
  if(hide&&hide.length){ g.traverse(o=>{ let k=null,n=o; while(n){if(n.userData&&n.userData.key){k=n.userData.key;break;}n=n.parent;} if(k&&hide.indexOf(k)>=0)o.visible=false; }); }
  const box=new THREE.Box3(); g.traverse(o=>{ if(o.isMesh&&o.visible){ o.updateMatrixWorld(true); box.expandByObject(o);} });
  const c=box.getCenter(new THREE.Vector3()), s=box.getSize(new THREE.Vector3());
  const R=Math.max(s.x,s.y,s.z)*0.5, d=R/Math.tan(36*Math.PI/360)*1.35;
  const dirs={anterior:[0,0,1],lateral:[1,0,0],left:[1,0,0],posterior:[0,0,-1],superior:[0,1,0.001]};
  const v=dirs[view]||dirs.anterior;
  cam.position.set(c.x+v[0]*d,c.y+v[1]*d,c.z+v[2]*d); cam.up.set(0,1,0); cam.lookAt(c);
  renderer.render(scene,cam);
  // frame fill: fraction of pixels that are not background
  const gl=renderer.getContext();
  return {box:{min:box.min.toArray(),max:box.max.toArray()},size:s.toArray(),center:c.toArray()};
};
window.__ready=true;
</script></body>`;
writeFileSync(path.join(OUT,'render.html'),html);
const browser=await chromium.launch({executablePath:'/opt/pw-browsers/chromium-1194/chrome-linux/chrome',args:['--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader']});
const page=await browser.newPage({viewport:{width:W,height:H}});
const clog=[];page.on('console',m=>clog.push(m.type()+': '+m.text()));
page.on('pageerror',e=>clog.push('pageerror: '+e));
await page.goto(BASE+'out/render.html'); await page.waitForFunction('window.__ready===true',{timeout:30000});
const FULL={endocardium:false,pericardium:false,mesocardium:false,midline:false};
const SHOTS=[
 ['v1-stage-a-anterior', 0,    {mesocardium:true,pericardium:true}, 'anterior', []],
 ['v2-stage-a-lateral',  0,    {mesocardium:true},                  'lateral',  []],
 ['v3v4-stage-b-anterior',0.65,{},                                  'anterior', []],
 ['v5-stage-c-lateral',  1,    {},                                  'lateral',  []],
 ['v6-stage-c-anterior', 1,    {pericardium:true},                  'anterior', []],
 ['v6b-stage-c-anterior-nosac',1,{},                                'anterior', []],
 ['v9-mirror-anterior',  1,    {mirror:true,midline:true},          'anterior', []],
 ['x-stage-c-superior',  1,    {},                                  'superior', []],
 ['x-stage-c-posterior', 1,    {},                                  'posterior',[]],
];
const meta={};
for(const [name,t,opts,view,hide] of SHOTS){
  const m=await page.evaluate(([t,opts,view,hide])=>window.__render(t,opts,view,hide),[t,opts,view,hide]);
  meta[name]={t,opts,view,...m};
  await page.screenshot({path:path.join(OUT,name+'.png')});
}
writeFileSync(path.join(OUT,'render-meta.json'),JSON.stringify(meta,null,1));
console.log('console:',clog.length?clog.join('\n'):'(clean)');
for(const k in meta)console.log(k.padEnd(28),'size=['+meta[k].size.map(n=>n.toFixed(2)).join(', ')+']');
await browser.close();server.close();
