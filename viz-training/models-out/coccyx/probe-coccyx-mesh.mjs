import { chromium } from 'playwright';
import http from 'http'; import fs from 'fs'; import path from 'path';
const ROOT='/home/claude/coccyx';
const MIME={'.js':'text/javascript','.json':'application/json','.html':'text/html','.stl':'application/octet-stream'};
const server=http.createServer((req,res)=>{const p=path.join(ROOT,decodeURIComponent(req.url.split('?')[0]));
 fs.readFile(p,(e,b)=>{if(e){res.writeHead(404);return res.end('no');}res.writeHead(200,{'content-type':MIME[path.extname(p)]||'application/octet-stream'});res.end(b);});});
await new Promise(r=>server.listen(0,r));
const BASE=`http://127.0.0.1:${server.address().port}/`;
const W=760,H=1000;
const html=`<!doctype html><meta charset=utf8><link rel=icon href="data:,"><body style="margin:0;background:#0e1626">
<canvas id=c width=${W} height=${H}></canvas>
<script src="${BASE}node_modules/three/build/three.js"><\/script>
<script src="${BASE}models3d/render-kit.js"><\/script>
<script>
const T=THREE, K=window.VizKit;
const renderer=new T.WebGLRenderer({canvas:document.getElementById('c'),antialias:true,preserveDrawingBuffer:true});
renderer.setSize(${W},${H},false); renderer.setPixelRatio(1);
K.configureRenderer(renderer);
const scene=new T.Scene(); scene.background=K.bg(0x0e1626);
K.standardLights(scene);
const camera=new T.PerspectiveCamera(32,${W}/${H},0.1,4000);
function parseSTL(buf){
  const dv=new DataView(buf); const n=dv.getUint32(80,true); const pos=new Float32Array(n*9);
  let o=84,k=0;
  for(let i=0;i<n;i++){o+=12;for(let j=0;j<3;j++){pos[k++]=dv.getFloat32(o,true);pos[k++]=dv.getFloat32(o+4,true);pos[k++]=dv.getFloat32(o+8,true);o+=12;}o+=2;}
  const g=new T.BufferGeometry(); g.setAttribute('position',new T.BufferAttribute(pos,3)); g.computeVertexNormals(); return g;
}
window.report={};
window.go=async function(mode){
  while(scene.children.length){const c=scene.children[scene.children.length-1]; if(c.isLight)break; scene.remove(c);} 
  scene.clear(); K.standardLights(scene); scene.background=K.bg(0x0e1626);
  const buf=await fetch('${BASE}viz-training/meshes/FMA16202.stl').then(r=>r.arrayBuffer());
  const g=parseSTL(buf);
  g.computeBoundingBox();
  const bb=g.boundingBox, size=bb.getSize(new T.Vector3());
  const span=Math.max(size.x,size.y,size.z);
  window.report.bbox={min:bb.min.toArray(),max:bb.max.toArray(),size:size.toArray(),span:span};
  const pos=g.getAttribute('position'); const n=pos.count;
  const col=new Float32Array(n*3);
  const baseC=K.C('#cdc3a6');
  // anchor as the scene declares it
  const uvw=[0.4908,0.8217,0.1471];
  const cx=bb.min.x+size.x*uvw[0], cy=bb.min.y+size.y*uvw[1], cz=bb.min.z+size.z*uvw[2];
  window.report.anchorWorld=[cx,cy,cz];
  const R=Math.max(span*0.05*3.0, span*0.045); window.report.patchRadius=R;
  const patchC=K.C('#ffcf5c'), cutC=K.C('#ff5ca8');
  const CUT=825.5;
  let nPatch=0,nBelowCut=0,nPatchAboveCut=0,nCoccyxMissedByPatch=0;
  for(let i=0;i<n;i++){
    const x=pos.getX(i),y=pos.getY(i),z=pos.getZ(i);
    let c=baseC;
    const d2=(x-cx)*(x-cx)+(y-cy)*(y-cy)+(z-cz)*(z-cz);
    const inPatch=d2<=R*R;
    const isCoccyx=z<CUT;
    if(inPatch)nPatch++;
    if(isCoccyx)nBelowCut++;
    if(inPatch&&!isCoccyx)nPatchAboveCut++;
    if(isCoccyx&&!inPatch)nCoccyxMissedByPatch++;
    if(mode==='cut') c=isCoccyx?cutC:baseC;
    else if(mode==='patch') c=inPatch?patchC:baseC;
    col[i*3]=c.r; col[i*3+1]=c.g; col[i*3+2]=c.b;
  }
  window.report.counts={n,nPatch,nBelowCut,nPatchAboveCut,nCoccyxMissedByPatch};
  g.setAttribute('color',new T.BufferAttribute(col,3));
  const m=new T.Mesh(g,new T.MeshStandardMaterial({vertexColors:true,roughness:0.62,metalness:0.0,side:T.DoubleSide}));
  scene.add(m); window.__m=m;
  if(mode==='anchor'){
    // exactly as viz3d.js placeAnchors() builds it
    const col=K.C('#ffcf5c');
    const sph=new T.Mesh(new T.SphereGeometry(1,20,16),
      new T.MeshStandardMaterial({color:col,emissive:col,emissiveIntensity:0.65,transparent:true,depthTest:false}));
    sph.renderOrder=5;
    sph.position.set(cx,cy,cz);
    sph.scale.setScalar(0.05*span);
    scene.add(sph);
    window.report.markerRadiusMm=0.05*span;
  }
  return window.report;
};
window.shoot=function(dirName,yaw){
  const bb=new T.Box3().setFromObject(scene);
  K.fitCamera(camera,scene,{dir:dirName});
  renderer.render(scene,camera);
};
window.aim=function(dx,dy,dz){
  const box=new T.Box3().setFromObject(window.__m); const c=box.getCenter(new T.Vector3()); const s=box.getSize(new T.Vector3());
  const r=Math.max(s.x,s.y,s.z)*0.5;
  const d=new T.Vector3(dx,dy,dz).normalize();
  const dist=r/Math.tan(camera.fov*Math.PI/360)*1.25;
  camera.position.copy(c).addScaledVector(d,dist);
  camera.up.set(0,0,1);
  camera.lookAt(c); camera.near=dist*0.01; camera.far=dist*10; camera.updateProjectionMatrix();
  renderer.render(scene,camera);
  const gl=renderer.getContext(); const px=new Uint8Array(16);
  gl.readPixels(380,500,2,2,gl.RGBA,gl.UNSIGNED_BYTE,px);
  return {camPos:camera.position.toArray(),centre:c.toArray(),size:s.toArray(),dist:dist,
    children:scene.children.map(o=>o.type),px:Array.from(px).slice(0,8)};
};
<\/script>`;
fs.writeFileSync(ROOT+'/probe.html',html);
const browser=await chromium.launch({executablePath:'/opt/pw-browsers/chromium-1194/chrome-linux/chrome',args:['--use-gl=swiftshader','--enable-unsafe-swiftshader']});
const page=await browser.newPage({viewport:{width:W,height:H}});
const msgs=[];
page.on('console',m=>msgs.push(m.type()+': '+m.text()));
page.on('pageerror',e=>msgs.push('PAGEERROR: '+e.message));
await page.goto(BASE+'probe.html');
await page.waitForFunction('window.go!==undefined');
for(const mode of ['cut','patch','plain','anchor']){
  const rep=await page.evaluate(m=>window.go(m),mode);
  if(mode==='cut'||mode==='anchor')console.log(mode,JSON.stringify(rep.counts||{}),'marker_mm',rep.markerRadiusMm||'-');
  for(const [name,d] of [['anterior',[0,-1,0]],['posterior',[0,1,0]],['lateral',[1,0,0]],['oblique',[0.75,-0.6,0.2]]]){
    const dg=await page.evaluate(v=>window.aim(v[0],v[1],v[2]),d);
    if(mode==='cut')console.log('AIM',name,JSON.stringify(dg));
    await page.screenshot({path:`/home/claude/coccyx/out/${mode}-${name}.png`});
  }
}
console.log('--- console ---'); msgs.forEach(m=>console.log(m)); if(!msgs.length)console.log('(clean)');
await browser.close(); server.close();
