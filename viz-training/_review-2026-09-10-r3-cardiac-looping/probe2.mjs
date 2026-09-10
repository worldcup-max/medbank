import { chromium } from 'playwright';
import { readFileSync, writeFileSync, mkdirSync } from 'fs';
import http from 'http'; import path from 'path'; import fs from 'fs';
const ROOT='/home/claude/rev', OUT=ROOT+'/out';
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
const clog=[]; page.on('console',m=>clog.push({type:m.type(),text:m.text()}));
page.on('pageerror',e=>clog.push({type:'pageerror',text:String(e)}));
await page.goto(BASE+'out/probe.html');
await page.waitForFunction('window.__ready===true',{timeout:30000});

const r=await page.evaluate(()=>{
 const M=window.MB3D_MODELS['cardiac-looping']; const out={};
 // 1. acceptance, correctly, at several nseg
 out.acceptance = {};
 for(const n of [140,300,600]){ try{ const a=M.acceptance(n); out.acceptance[n]={measured:a.measured,pass:a.pass,allPass:a.allPass}; }catch(e){out.acceptance[n]='ERR '+e;} }
 // 2. INDEPENDENT reflection test: vertex sets, normal build vs mirror build
 function verts(g){ const by={}; g.updateMatrixWorld(true);
  g.traverse(o=>{ if(!o.isMesh||!o.geometry)return; let key=null,n=o; while(n){if(n.userData&&n.userData.key){key=n.userData.key;break;}n=n.parent;}
   if(!key)return; const pos=o.geometry.attributes.position,v=new THREE.Vector3();
   const arr=by[key]||(by[key]=[]); for(let i=0;i<pos.count;i++){v.fromBufferAttribute(pos,i);o.localToWorld(v);arr.push([v.x,v.y,v.z]);} });
  return by; }
 function idx(list){ const s=new Set(); for(const p of list) s.add(p.map(q=>Math.round(q*1000)).join(',')); return s; }
 const A=verts(M.build(1,Object.assign({},M.FULL)));
 const B=verts(M.build(1,Object.assign({},M.FULL,{mirror:true})));
 out.reflect={};
 for(const k in A){ if(!B[k]){out.reflect[k]='missing in mirror';continue;}
  const sB=idx(B[k]);
  let refl=0, rot=0, same=0;
  for(const p of A[k]){
   if(sB.has([-p[0],p[1],p[2]].map(q=>Math.round(q*1000)).join(',')))refl++;
   if(sB.has([-p[0],p[1],-p[2]].map(q=>Math.round(q*1000)).join(',')))rot++;
   if(sB.has(p.map(q=>Math.round(q*1000)).join(',')))same++;
  }
  const n=A[k].length;
  out.reflect[k]={n, reflectX:+(refl/n).toFixed(4), rotY180:+(rot/n).toFixed(4), identity:+(same/n).toFixed(4), nMirror:B[k].length};
 }
 // 3. MY OWN chirality: signed tetra volume from MESH centroids (not centreline)
 function cent(by,k){ const a=by[k]; let x=0,y=0,z=0; for(const p of a){x+=p[0];y+=p[1];z+=p[2];} return [x/a.length,y/a.length,z/a.length]; }
 function tetra(by){ const s=cent(by,'sinus'),a=cent(by,'atrium'),v=cent(by,'ventricle'),b=cent(by,'bulbus');
  const u=[a[0]-s[0],a[1]-s[1],a[2]-s[2]], w=[v[0]-s[0],v[1]-s[1],v[2]-s[2]], q=[b[0]-s[0],b[1]-s[1],b[2]-s[2]];
  return (u[0]*(w[1]*q[2]-w[2]*q[1]) - u[1]*(w[0]*q[2]-w[2]*q[0]) + u[2]*(w[0]*q[1]-w[1]*q[0]))/6; }
 out.myTetra = { D:tetra(A), L:tetra(B) }; out.myTetra.ratio = out.myTetra.L/out.myTetra.D;
 // 4. per-MESH normals detail for the chambers at t=1
 out.meshNormals=[];
 { const g=M.build(1,Object.assign({},M.FULL)); g.updateMatrixWorld(true);
   g.traverse(o=>{ if(!o.isMesh||!o.geometry||!o.geometry.attributes.normal)return;
    let key=null,n=o; while(n){if(n.userData&&n.userData.key){key=n.userData.key;break;}n=n.parent;}
    const pos=o.geometry.attributes.position,nor=o.geometry.attributes.normal;
    const v=new THREE.Vector3(),nv=new THREE.Vector3(); const N=pos.count;
    let cx=0,cy=0,cz=0; const P=[]; for(let i=0;i<N;i++){v.fromBufferAttribute(pos,i);o.localToWorld(v);P.push(v.x,v.y,v.z);cx+=v.x;cy+=v.y;cz+=v.z;}
    cx/=N;cy/=N;cz/=N;
    const nm=new THREE.Matrix3().getNormalMatrix(o.matrixWorld); let ow=0;
    for(let i=0;i<N;i++){nv.fromBufferAttribute(nor,i).applyMatrix3(nm).normalize();
     if(nv.x*(P[i*3]-cx)+nv.y*(P[i*3+1]-cy)+nv.z*(P[i*3+2]-cz)>0)ow++;}
    out.meshNormals.push({key:key||o.name||'?', matName:(o.material&&o.material.name)||'', side:(o.material&&o.material.side), verts:N, owFrac:+(ow/N).toFixed(4)});
   }); }
 return out;
});
writeFileSync(path.join(OUT,'probe2.json'),JSON.stringify({r,clog},null,1));
console.log('=== CONSOLE ===');for(const c of clog)console.log(' ['+c.type+'] '+c.text.slice(0,260));
console.log('\n=== ACCEPTANCE (correct call) ===');
for(const n in r.acceptance){const a=r.acceptance[n];
 console.log(' nseg='+n+' allPass='+a.allPass+' pass='+JSON.stringify(a.pass));
 const m=a.measured; if(m)console.log('   A'+m.A.toFixed(3)+" B'"+m.Bp.toFixed(3)+' bvx'+m.bvx.toFixed(3)+' C'+m.C.toFixed(3)+' D'+m.D.toFixed(3)+' E'+m.E.toFixed(3)+' F'+m.F.toFixed(3)+' G'+m.G.toFixed(3)+' H'+m.H.toFixed(3)+' H65'+m.H65.toFixed(3)+' I'+m.I.toFixed(3)+' M'+m.M);}
console.log('\n=== REFLECTION, per part (MY vertex match) ===');
for(const k in r.reflect){const e=r.reflect[k];console.log(' '+k.padEnd(13), typeof e==='string'?e:('reflectX='+e.reflectX+'  rotY180='+e.rotY180+'  identity='+e.identity+'  n='+e.n+'/'+e.nMirror));}
console.log('\n=== MY CHIRALITY (mesh centroids) ===', JSON.stringify(r.myTetra));
console.log('\n=== PER-MESH NORMALS t=1 ===');
for(const m of r.meshNormals)console.log(' '+String(m.key).padEnd(13),'verts='+String(m.verts).padEnd(7),'owFrac='+m.owFrac,'side='+m.side,m.matName);
await browser.close();server.close();
