/* MedBank · two measurements about how the looped heart FITS, on the real built geometry.
 *
 *  1. PERICARDIAL FILL — how much of the sac the heart occupies at day 23, mid-loop and day 28.
 *     View 1's narration says the tube "is elongating faster than the pericardial cavity around it";
 *     this is the arithmetic behind that claim, and behind the peri_c view added for round-2
 *     finding 5. Note the HEIGHT fraction falls: the sac spans pole to pole and the poles converge,
 *     so tube and sac shorten together and the crowding this scene teaches is transverse.
 *
 *  2. SEGMENT NEAR-CONTACT — minimum surface distance between NON-ADJACENT segments. The torsion
 *     solve is free to tighten the loop until segments touch, and nothing else we run would notice.
 *     Sampled every 17th vertex, so treat it as an upper bound on how close they really are: a small
 *     positive number means look at the render for a seam, it does not mean there is none.
 *
 * Both were written for the 2026-09-10 round-2 rework and are kept so the numbers in BUILD-LOG.md
 * can be re-checked rather than believed.
 *
 * Run from the repo root:  node viz-training/tools/measure-loop-fit.mjs
 */
import { chromium } from 'playwright';
import { writeFileSync } from 'fs';
import http from 'http'; import path from 'path'; import fs from 'fs';
const ROOT=process.cwd(); const OUT='viz-training/models-out/cardiac-looping';
const MIME={'.js':'text/javascript','.json':'application/json','.html':'text/html'};
const server=http.createServer((rq,rs)=>{const q=path.join(ROOT,decodeURIComponent(rq.url.split('?')[0]));
 fs.readFile(q,(e,b)=>{if(e){rs.writeHead(404);return rs.end('no');}rs.writeHead(200,{'content-type':MIME[path.extname(q)]||'application/octet-stream'});rs.end(b);});});
await new Promise(r=>server.listen(0,r));
const BASE=`http://127.0.0.1:${server.address().port}/`;
const html=`<!doctype html><meta charset=utf8><link rel=icon href="data:,"><body>
<script src="${BASE}node_modules/three/build/three.js"><\/script>
<script src="${BASE}models3d/render-kit.js"><\/script>
<script src="${BASE}models3d/cardiac-looping.js"><\/script>
<script>
const MOD=window.MB3D_MODELS['cardiac-looping'];
function boxOf(g,pred){const b=new THREE.Box3();g.traverse(function(o){
 if(!o.isMesh||(o.userData||{}).outline||!o.userData.key)return; if(!pred(o.userData.key))return;
 o.updateMatrixWorld(true); b.expandByObject(o);}); return b;}
/* minimum surface distance between non-adjacent segments, sampled */
window.penetration=function(t){
 const grp=MOD.build(t,{});
 const segs={};
 grp.traverse(function(o){ if(!o.isMesh||(o.userData||{}).outline||!o.userData.key)return;
   (segs[o.userData.key]=segs[o.userData.key]||[]).push(o.geometry); });
 const order=['sinus','atrium','ventricle','bulbus','truncus'];
 const pts={};
 for(const k of order){ if(!segs[k])continue; const a=[];
   for(const gg of segs[k]){const p=gg.attributes.position;
     for(let i=0;i<p.count;i+=17)a.push(new THREE.Vector3(p.getX(i),p.getY(i),p.getZ(i)));}
   pts[k]=a; }
 const out=[];
 for(let i=0;i<order.length;i++)for(let j=i+2;j<order.length;j++){
   const A=pts[order[i]],B=pts[order[j]]; if(!A||!B)continue;
   let min=1e9; for(const a of A)for(const b of B){const d=a.distanceToSquared(b); if(d<min)min=d;}
   out.push({pair:order[i]+'/'+order[j],minDist:+Math.sqrt(min).toFixed(4)});
 }
 return out;};
window.fill=function(t){
 const g=MOD.build(t,{pericardium:true});
 g.updateMatrixWorld(true);
 const heart=boxOf(g,k=>['sinus','atrium','ventricle','bulbus','truncus'].indexOf(k)>=0);
 const sac=boxOf(g,k=>k==='pericardium');
 const hs=heart.getSize(new THREE.Vector3()), ss=sac.getSize(new THREE.Vector3());
 // arc length of the tube's centreline is the thing that grows; report it too
 return {t, heart:hs.toArray().map(x=>+x.toFixed(3)), sac:ss.toArray().map(x=>+x.toFixed(3)),
   fill:{width:+(hs.x/ss.x).toFixed(3), height:+(hs.y/ss.y).toFixed(3), depth:+(hs.z/ss.z).toFixed(3)}};
};
<\/script>`;
writeFileSync(`${OUT}/_loopfit.html`,html);
const b=await chromium.launch({executablePath:'/opt/pw-browsers/chromium-1194/chrome-linux/chrome',args:['--use-gl=swiftshader','--enable-unsafe-swiftshader','--no-sandbox']});
const p=await b.newPage();
const log=[];p.on('console',m=>log.push(m.type()+': '+m.text()));p.on('pageerror',e=>log.push('pageerror: '+e.message));
await p.goto(BASE+OUT+'/_loopfit.html'); await p.waitForFunction('typeof window.fill==="function"');
console.log('PERICARDIAL FILL — heart bounding box as a fraction of the sac');
for(const t of [0,0.65,1]) console.log(' ', JSON.stringify(await p.evaluate(tt=>window.fill(tt),t)));
console.log('SEGMENT NEAR-CONTACT — minimum surface distance between non-adjacent segments (sampled)');
for(const t of [0.65,1]) console.log('  t='+t, JSON.stringify(await p.evaluate(tt=>window.penetration(tt),t)));
console.log('console:', log.filter(l=>!/SwiftShader|GL Driver|fallback|ReadPixels/i.test(l)).join(' | ')||'clean');
await b.close();server.close();
