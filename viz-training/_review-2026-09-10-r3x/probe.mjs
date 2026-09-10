/* ROUND-3 REVIEW · independent mechanical+measurement probe.
   Written by the review run. Does NOT import the builder's provers. */
import { chromium } from 'playwright';
import { readFileSync, writeFileSync, mkdirSync } from 'fs';
import http from 'http'; import path from 'path'; import fs from 'fs';

const ROOT = process.cwd();
const OUT = 'viz-training/_review-2026-09-10-r3x';
mkdirSync(OUT, { recursive: true });
const MIME = { '.js':'text/javascript', '.json':'application/json', '.html':'text/html' };
const server = http.createServer((req,res)=>{
  const p = path.join(ROOT, decodeURIComponent(req.url.split('?')[0]));
  fs.readFile(p,(e,buf)=>{ if(e){res.writeHead(404);return res.end('no');}
    res.writeHead(200,{'content-type':MIME[path.extname(p)]||'application/octet-stream'}); res.end(buf); });
});
await new Promise(r=>server.listen(0,r));
const PORT = server.address().port, BASE = `http://127.0.0.1:${PORT}/`;

const scene = JSON.parse(readFileSync('viz-training/scenes/embryology__cardiovascular-development__cardiac-looping.json','utf8'));
const REFS = scene.structures.map(s=>({key:s.key, ref:s.refs&&s.refs.procedural})).filter(r=>r.ref);

const html = `<!doctype html><meta charset=utf8><link rel="icon" href="data:,">
<body style="margin:0;background:#0e1626"><canvas id=c width=900 height=900></canvas>
<script src="${BASE}node_modules/three/build/three.js"><\/script>
<script src="${BASE}models3d/render-kit.js"><\/script>
<script src="${BASE}models3d/cardiac-looping.js"><\/script>
<script>
window.MEDBANK_CONFIG = { MODEL_BASE: '${BASE}models3d/' };
const renderer = new THREE.WebGLRenderer({canvas:document.getElementById('c'),antialias:true});
VizKit.configureRenderer(renderer);
window.__ready = true;
</script></body>`;
writeFileSync(path.join(OUT,'probe.html'), html);

const browser = await chromium.launch({ args:['--use-gl=swiftshader','--enable-unsafe-swiftshader'] });
const page = await browser.newPage();
const console_log = [];
page.on('console', m => console_log.push({type:m.type(), text:m.text()}));
page.on('pageerror', e => console_log.push({type:'pageerror', text:String(e)}));
await page.goto(BASE + OUT + '/probe.html');
await page.waitForFunction('window.__ready===true');

const result = await page.evaluate(() => {
  const M = window.MB3D_MODELS['cardiac-looping'];
  const FULL = M.FULL;
  const out = { t:{}, parts:{}, errors:[] };

  function partStats(g){
    const byKey = {};
    g.updateMatrixWorld(true);
    g.traverse(o=>{
      if(!o.isMesh || !o.geometry || !o.geometry.attributes || !o.geometry.attributes.position) return;
      let key=null, n=o; while(n){ if(n.userData && n.userData.key){key=n.userData.key;break;} if(n.name && !n.name.startsWith('__')){key=n.name;} n=n.parent; }
      if(!key) key='(unkeyed)';
      const pos=o.geometry.attributes.position, nor=o.geometry.attributes.normal;
      const v=new THREE.Vector3(); let cx=0,cy=0,cz=0,N=pos.count;
      const P=[];
      for(let i=0;i<N;i++){ v.fromBufferAttribute(pos,i); o.localToWorld(v); P.push(v.x,v.y,v.z); cx+=v.x;cy+=v.y;cz+=v.z; }
      cx/=N;cy/=N;cz/=N;
      let out_=0;
      if(nor){ const nv=new THREE.Vector3(); const nm=new THREE.Matrix3().getNormalMatrix(o.matrixWorld);
        for(let i=0;i<N;i++){ nv.fromBufferAttribute(nor,i).applyMatrix3(nm).normalize();
          const dx=P[i*3]-cx, dy=P[i*3+1]-cy, dz=P[i*3+2]-cz;
          if(nv.x*dx+nv.y*dy+nv.z*dz>0) out_++; } }
      const e=byKey[key]||(byKey[key]={verts:0,tris:0,sx:0,sy:0,sz:0,outward:0,min:[1e9,1e9,1e9],max:[-1e9,-1e9,-1e9]});
      e.verts+=N; e.tris += (o.geometry.index? o.geometry.index.count/3 : N/3);
      e.sx+=cx*N; e.sy+=cy*N; e.sz+=cz*N; e.outward+=out_;
      for(let i=0;i<N;i++){ for(let k=0;k<3;k++){ const val=P[i*3+k]; if(val<e.min[k])e.min[k]=val; if(val>e.max[k])e.max[k]=val; } }
    });
    for(const k in byKey){ const e=byKey[k]; e.cx=e.sx/e.verts; e.cy=e.sy/e.verts; e.cz=e.sz/e.verts;
      e.outwardFrac=e.outward/e.verts; delete e.sx; delete e.sy; delete e.sz; }
    return byKey;
  }

  for (const t of [0,0.2,0.4,0.6,0.65,0.8,1.0]) {
    try {
      const g = M.build(t, Object.assign({}, FULL));
      out.t[String(t)] = partStats(g);
    } catch(e){ out.errors.push('build t='+t+': '+String(e)); }
  }
  try {
    const g = M.build(1.0, Object.assign({}, FULL, {mirror:true}));
    out.mirror = partStats(g);
    out.mirrorProof = M.mirrorProof();
  } catch(e){ out.errors.push('mirror build: '+String(e)); }
  try { out.acceptance = M.acceptance(1.0); } catch(e){ out.errors.push('acceptance: '+String(e)); }
  out.SOLVED = M.SOLVED;
  out.LAYERS = M.LAYERS;
  return out;
});

writeFileSync(path.join(OUT,'probe.json'), JSON.stringify({result, console_log, REFS}, null, 1));
console.log('CONSOLE LINES:', console_log.length);
for (const c of console_log) console.log('  ['+c.type+'] '+c.text.slice(0,400));
console.log('ERRORS:', JSON.stringify(result.errors));
const keysByT = {}; for (const t in result.t) keysByT[t] = Object.keys(result.t[t]).sort();
console.log('PART KEYS @t=1:', keysByT['1'] ? keysByT['1'].join(',') : '(none)');
console.log('PART KEYS @t=0:', keysByT['0'] ? keysByT['0'].join(',') : '(none)');
await browser.close(); server.close();
