/* ROUND-3 REVIEW · independent probe. Not the builder's prover. */
import { chromium } from 'playwright';
import { readFileSync, writeFileSync, mkdirSync } from 'fs';
import http from 'http'; import path from 'path'; import fs from 'fs';
const ROOT='/home/claude/rev', OUT=ROOT+'/out'; mkdirSync(OUT,{recursive:true});
const MIME={'.js':'text/javascript','.json':'application/json','.html':'text/html'};
const server=http.createServer((req,res)=>{const p=path.join(ROOT,decodeURIComponent(req.url.split('?')[0]));
 fs.readFile(p,(e,buf)=>{if(e){res.writeHead(404);return res.end('no');}
 res.writeHead(200,{'content-type':MIME[path.extname(p)]||'application/octet-stream'});res.end(buf);});});
await new Promise(r=>server.listen(0,r));
const PORT=server.address().port, BASE=`http://127.0.0.1:${PORT}/`;

const html=`<!doctype html><meta charset=utf8><link rel="icon" href="data:,">
<body style="margin:0;background:#0e1626"><canvas id=c width=900 height=900></canvas>
<script src="${BASE}node_modules/three/build/three.js"><\/script>
<script src="${BASE}models3d/render-kit.js"><\/script>
<script src="${BASE}models3d/cardiac-looping.js"><\/script>
<script>
window.MEDBANK_CONFIG={MODEL_BASE:'${BASE}models3d/'};
const renderer=new THREE.WebGLRenderer({canvas:document.getElementById('c'),antialias:true});
if(window.VizKit&&VizKit.configureRenderer)VizKit.configureRenderer(renderer);
window.__ready=true;
</script></body>`;
writeFileSync(path.join(OUT,'probe.html'),html);

const browser=await chromium.launch({executablePath:'/opt/pw-browsers/chromium-1194/chrome-linux/chrome',args:['--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader']});
const page=await browser.newPage();
const clog=[];
page.on('console',m=>clog.push({type:m.type(),text:m.text()}));
page.on('pageerror',e=>clog.push({type:'pageerror',text:String(e)}));
await page.goto(BASE+'out/probe.html');
try{await page.waitForFunction('window.__ready===true',{timeout:30000});}catch(e){console.log('NOT READY. console:');for(const c of clog)console.log(' ['+c.type+'] '+c.text.slice(0,500));await browser.close();server.close();process.exit(1);}

const result=await page.evaluate(()=>{
 const M=window.MB3D_MODELS['cardiac-looping'];
 const out={t:{},errors:[],keysPerT:{}};
 function stats(g){
  const byKey={}; g.updateMatrixWorld(true);
  g.traverse(o=>{
   if(!o.isMesh||!o.geometry||!o.geometry.attributes||!o.geometry.attributes.position)return;
   let key=null,n=o; while(n){ if(n.userData&&n.userData.key){key=n.userData.key;break;} n=n.parent; }
   if(!key){ n=o; while(n){ if(n.name){key=n.name;break;} n=n.parent; } }
   if(!key)key='(unkeyed)';
   const pos=o.geometry.attributes.position,nor=o.geometry.attributes.normal;
   const v=new THREE.Vector3(); const N=pos.count; const P=new Float64Array(N*3);
   let cx=0,cy=0,cz=0;
   for(let i=0;i<N;i++){v.fromBufferAttribute(pos,i);o.localToWorld(v);P[i*3]=v.x;P[i*3+1]=v.y;P[i*3+2]=v.z;cx+=v.x;cy+=v.y;cz+=v.z;}
   cx/=N;cy/=N;cz/=N;
   let ow=0;
   if(nor){const nv=new THREE.Vector3(),nm=new THREE.Matrix3().getNormalMatrix(o.matrixWorld);
    for(let i=0;i<N;i++){nv.fromBufferAttribute(nor,i).applyMatrix3(nm).normalize();
     if(nv.x*(P[i*3]-cx)+nv.y*(P[i*3+1]-cy)+nv.z*(P[i*3+2]-cz)>0)ow++;}}
   const e=byKey[key]||(byKey[key]={verts:0,tris:0,ax:0,ay:0,az:0,ow:0,min:[1e9,1e9,1e9],max:[-1e9,-1e9,-1e9],h:0});
   e.verts+=N; e.tris+=(o.geometry.index?o.geometry.index.count/3:N/3);
   e.ax+=cx*N;e.ay+=cy*N;e.az+=cz*N;e.ow+=ow;
   let hh=0;
   for(let i=0;i<N;i++){for(let k=0;k<3;k++){const val=P[i*3+k];if(val<e.min[k])e.min[k]=val;if(val>e.max[k])e.max[k]=val;}
     hh=(hh*31+Math.round(P[i*3]*1e4)+Math.round(P[i*3+1]*1e4)*7+Math.round(P[i*3+2]*1e4)*13)|0;}
   e.h=(e.h^hh)|0;
  });
  for(const k in byKey){const e=byKey[k];e.cx=e.ax/e.verts;e.cy=e.ay/e.verts;e.cz=e.az/e.verts;
   e.owFrac=e.ow/e.verts;delete e.ax;delete e.ay;delete e.az;}
  return byKey;
 }
 for(const t of [0,0.2,0.4,0.6,0.65,0.8,1.0]){
  try{const g=M.build(t,Object.assign({},M.FULL)); out.t[String(t)]=stats(g); out.keysPerT[String(t)]=Object.keys(out.t[String(t)]).sort(); }
  catch(e){out.errors.push('build t='+t+': '+String(e&&e.stack||e));}
 }
 try{const g=M.build(1.0,Object.assign({},M.FULL,{mirror:true}));out.mirror=stats(g);out.mirrorProof=M.mirrorProof&&M.mirrorProof();}
 catch(e){out.errors.push('mirror: '+String(e));}
 try{const g=M.build(0,Object.assign({},M.FULL,{mirror:true}));out.mirror_t0=stats(g);}catch(e){out.errors.push('mirror t0: '+String(e));}
 try{out.acceptance=M.acceptance(1.0);}catch(e){out.errors.push('acceptance: '+String(e));}
 out.SOLVED=M.SOLVED; out.ACCEPTANCE=M.ACCEPTANCE; out.LAYERS=M.LAYERS; out.VARIANTS=M.VARIANTS;
 return out;
});
writeFileSync(path.join(OUT,'probe.json'),JSON.stringify({result,clog},null,1));
console.log('=== CONSOLE ('+clog.length+' lines) ===');
for(const c of clog) console.log(' ['+c.type+'] '+c.text.slice(0,300));
console.log('=== ERRORS ===', JSON.stringify(result.errors));
console.log('=== KEYS @t=1 ===', (result.keysPerT['1']||[]).join(','));
console.log('=== KEYS @t=0 ===', (result.keysPerT['0']||[]).join(','));
console.log('=== mirrorProof ===', JSON.stringify(result.mirrorProof));
await browser.close(); server.close();
