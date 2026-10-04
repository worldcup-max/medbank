/* probe for review finding F4. The review's hypothesis: insideFrac decides containment by casting a
   ray along +x from each sampled vertex and counting parity, which is a knife edge for a vertex lying
   ON a shared surface. It said so explicitly as LIKELY MECHANISM, NOT PROVED. This measures it.
   For the two pairs the review saw fail, at the day it saw them fail: how many of the sampled
   vertices sit within epsilon of the other solid's surface, and what does parity do to them? */
import { chromium } from 'playwright';
import { mkdirSync, writeFileSync, existsSync, readdirSync } from 'fs';
import http from 'http'; import path from 'path'; import fs from 'fs';
const ROOT=process.cwd(), MODEL='neurulation-neural-plate-tube', OUT='viz-training/models-out/'+MODEL;
function findChromium(){const b='/opt/pw-browsers';if(existsSync(b))for(const d of readdirSync(b))for(const r of ['chrome-linux/chrome','chrome-linux/headless_shell']){const p=path.join(b,d,r);if(existsSync(p))return p;}return null;}
const MIME={'.js':'text/javascript','.json':'application/json','.html':'text/html'};
const s=http.createServer((q,r)=>{const p=path.join(ROOT,decodeURIComponent(q.url.split('?')[0]));fs.readFile(p,(e,b)=>{if(e){r.writeHead(404);return r.end('no');}r.writeHead(200,{'content-type':MIME[path.extname(p)]||'application/octet-stream'});r.end(b);});});
await new Promise(r=>s.listen(0,r)); const BASE=`http://127.0.0.1:${s.address().port}/`;
mkdirSync(OUT,{recursive:true});
writeFileSync(OUT+'/_probe.html','<!doctype html><meta charset=utf-8><body style="margin:0"><canvas id=c width=400 height=300></canvas></body>');
const br=await chromium.launch({executablePath:findChromium()||undefined,args:['--use-gl=swiftshader','--enable-unsafe-swiftshader','--no-sandbox']});
const pg=await br.newPage({viewport:{width:400,height:300}});
await pg.goto(BASE+OUT+'/_probe.html');
await pg.addScriptTag({url:BASE+'viz-training/spike/three.min.js'});
await pg.addScriptTag({url:BASE+'models3d/render-kit.js'});
await pg.addScriptTag({url:BASE+'models3d/'+MODEL+'.js'});
const PAIRS = [['lateral_mesoderm','notochord'],['notochord','lateral_mesoderm'],['lateral_mesoderm','somites'],['somites','lateral_mesoderm']];
const TS = (process.argv[2]||'').split(',').filter(Boolean).map(Number);
const r = await pg.evaluate(([mod,pairs,ts])=>{
  const M=window.MB3D_MODELS[mod];
  const RES=[];
  const TS = ts.length?ts:[M.tOfDay(25.0)];
  for (let ti=0; ti<TS.length; ti++) {
  const t = TS[ti];
  const by = M.vertsByKey(t, {}).by;
  function boxOf(P){const mn=[1e30,1e30,1e30],mx=[-1e30,-1e30,-1e30];
    for(let i=0;i<P.length;i+=3)for(let a=0;a<3;a++){const v=P[i+a];if(v<mn[a])mn[a]=v;if(v>mx[a])mx[a]=v;}
    return {min:mn,max:mx,size:[mx[0]-mn[0],mx[1]-mn[1],mx[2]-mn[2]]};}
  function triIndex(P){const b=boxOf(P),nb=24;
    const sy=Math.max(1e-9,b.size[1])/nb, sz=Math.max(1e-9,b.size[2])/nb, cells=new Map();
    for(let i=0;i+8<P.length;i+=9){let y0=1e30,y1=-1e30,z0=1e30,z1=-1e30;
      for(let k=0;k<3;k++){const y=P[i+k*3+1],z=P[i+k*3+2];if(y<y0)y0=y;if(y>y1)y1=y;if(z<z0)z0=z;if(z>z1)z1=z;}
      const a0=Math.floor((y0-b.min[1])/sy),a1=Math.floor((y1-b.min[1])/sy);
      const c0=Math.floor((z0-b.min[2])/sz),c1=Math.floor((z1-b.min[2])/sz);
      for(let jy=a0;jy<=a1;jy++)for(let jz=c0;jz<=c1;jz++){const k=jy+':'+jz;let a=cells.get(k);if(!a){a=[];cells.set(k,a);}a.push(i);}}
    return {P,box:b,sy,sz,cells};}
  const out=[];
  for (const [ka,kb] of pairs) {
    if(!by[ka]||!by[kb]) { out.push({pair:ka+'|'+kb, error:'a key is absent'}); continue; }
    const A=by[ka].P, ib=triIndex(by[kb].P), P=ib.P, b=ib.box;
    const step=Math.max(3,3*Math.ceil(A.length/3/1400));
    let tested=0, inside=0, near=[0,0,0,0,0];      // |hx-px| < 1e-12, 1e-9, 1e-6, 1e-4, 1e-2
    let insideAndNear=0, minAbs=Infinity;
    for(let i=0;i<A.length;i+=step){
      const px=A[i],py=A[i+1],pz=A[i+2];
      if(py<b.min[1]||py>b.max[1]||pz<b.min[2]||pz>b.max[2]||px>b.max[0]){tested++;continue;}
      const jy=Math.floor((py-b.min[1])/ib.sy), jz=Math.floor((pz-b.min[2])/ib.sz);
      const list=ib.cells.get(jy+':'+jz); tested++;
      if(!list) continue;
      let cross=0, best=Infinity;
      for(const o of list){
        const ay=P[o+1],az=P[o+2],bY=P[o+4],bz=P[o+5],cy=P[o+7],cz=P[o+8];
        const d=(bY-ay)*(cz-az)-(bz-az)*(cy-ay); if(Math.abs(d)<1e-14) continue;
        const w1=((py-ay)*(cz-az)-(pz-az)*(cy-ay))/d;
        const w2=((bY-ay)*(pz-az)-(bz-az)*(py-ay))/d;
        if(w1<0||w2<0||w1+w2>1) continue;
        const hx=P[o]+w1*(P[o+3]-P[o])+w2*(P[o+6]-P[o]);
        const ad=Math.abs(hx-px); if(ad<best) best=ad;
        if(hx>px+1e-9) cross++;
      }
      const isIn = cross%2===1;
      if(isIn) inside++;
      if(best<Infinity){ if(best<minAbs) minAbs=best;
        const tols=[1e-12,1e-9,1e-6,1e-4,1e-2];
        for(let k=0;k<5;k++) if(best<tols[k]) near[k]++;
        if(isIn && best<1e-4) insideAndNear++; }
    }
    out.push({pair:ka+'|'+kb, tested, inside, frac:+(inside/tested).toFixed(5),
              nearSurface:near, insideAndNear, minAbs: minAbs===Infinity?null:minAbs,
              overlapMax: M.FLOORS.OVERLAP_MAX});
  }
  RES.push({t:t, day:M.day(t), cacheKey:Math.round(t*1e6), somites:M.somiteCount(M.day(t)), out:out});
  }
  return RES;
},[MODEL,PAIRS,TS]);
for (const blk of r) {
  console.log('\n#### t=' + blk.t + '  day=' + blk.day + '  builtAt cache key=' + blk.cacheKey +
              '  somite pairs=' + blk.somites + '  NORMAL variant, OVERLAP_MAX=' + blk.out[0].overlapMax);
  for (const o of blk.out) {
    if (o.error) { console.log('  ' + o.pair + ': ' + o.error); continue; }
    console.log('  ' + o.pair);
    console.log('    sampled ' + o.tested + '   parity says INSIDE ' + o.inside + '   frac ' + o.frac +
                (o.frac > o.overlapMax ? '   <-- ABOVE OVERLAP_MAX' : '   (under the floor)'));
    console.log('    nearest crossing within  1e-12: ' + o.nearSurface[0] + '  1e-9: ' + o.nearSurface[1] +
                '  1e-6: ' + o.nearSurface[2] + '  1e-4: ' + o.nearSurface[3] + '  1e-2: ' + o.nearSurface[4]);
    console.log('    INSIDE and within 1e-4 of a crossing: ' + o.insideAndNear +
                '    smallest |hx - px|: ' + (o.minAbs==null?'-':o.minAbs.toExponential(3)));
  }
}
writeFileSync(OUT + '/_rowQ-knife-probe.json', JSON.stringify(r, null, 1));
await br.close(); s.close();
