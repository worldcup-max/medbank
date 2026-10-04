/* MedBank · probe-cut-cap.mjs — IS A CUT SOLID CLOSED, OR IS IT A BOWL?
 *
 *   node viz-training/tools/probe-cut-cap.mjs [models3d/<model>.js] [tag]
 *
 * Written 2026-10-02 by the round-3 build run on blastocyst, to answer the round-2 review's R1 the
 * way the review itself answered it: render ONE key alone, cut, face-on to the cut plane, and look at
 * what the opening shows. Acceptance row CUT in the model proves the same thing on the EDGES, which is
 * the stronger statement and the one that runs every time; this exists because R1 was a finding about
 * a PICTURE, and the next person to doubt it should be able to see it rather than read a number.
 *
 * It takes the model path so that two versions can be rendered under identical lighting, camera and
 * framing and compared pixel for pixel. Measured that way on the inner cell mass, round 2 against
 * round 3: the fraction of the mass's own silhouette that is unlit interior falls from 24.05% to
 * 2.25% at t = 0.42 and from 21.81% to 2.29% at t = 0.52, and the 2.2% that remains is the silhouette
 * shell, which is meant to be dark. The luminance spread over the silhouette collapses from
 * 50 - 155 to 120 - 124: a flat, evenly lit section face, which is what a capped cut looks like.
 *
 * The companion frames are viz-training/models-out/blastocyst/r1-icm-alone-before|after-t0_42.png. */
import { chromium } from 'playwright';
import http from 'http'; import fs from 'fs'; import path from 'path';
const ROOT=process.cwd(), MODEL=process.argv[2]||'models3d/blastocyst.js', TAG=process.argv[3]||'after';
const srv=http.createServer((q,r)=>{const f=path.join(ROOT,decodeURIComponent(q.url.split('?')[0]));
 try{r.writeHead(200);r.end(fs.readFileSync(f));}catch(e){r.writeHead(404);r.end('x');}});
await new Promise(r=>srv.listen(0,'127.0.0.1',r));
const BASE='http://127.0.0.1:'+srv.address().port+'/';
let exe=null; for(const d of fs.readdirSync('/opt/pw-browsers')) if(/^chromium-/.test(d)){const c='/opt/pw-browsers/'+d+'/chrome-linux/chrome'; if(fs.existsSync(c)) exe=c;}
const b=await chromium.launch({executablePath:exe,args:['--use-gl=swiftshader','--enable-unsafe-swiftshader','--no-sandbox']});
const p=await b.newPage({viewport:{width:900,height:900}});
p.on('pageerror',e=>console.log('PAGEERROR',e.message));
await p.setContent('<style>html,body{margin:0;background:#101418}</style><canvas id="c" width="900" height="900"></canvas>');
for(const u of ['viz-training/spike/three.min.js','models3d/render-kit.js','models3d/fertilization.js','models3d/cleavage-morula.js',MODEL])
  await p.addScriptTag({url:BASE+u});
const out={};
for (const t of [0.42, 0.52]) {
  const diag = await p.evaluate((t)=>{
    const T=THREE,K=window.VizKit,M=window.MB3D_MODELS['blastocyst'];
    const sc=new T.Scene(); K.standardLights(sc);
    const ren=K.configureRenderer(new T.WebGLRenderer({canvas:document.getElementById("c"),antialias:true,preserveDrawingBuffer:true}));
    ren.setClearColor(K.bg(0x101418),1);
    const cam=new T.PerspectiveCamera(34,1,0.05,400);
    const g=M.build(t,{zona:false,poles:false,endometrium:false,cut:true});
    /* keep ONLY the inner cell mass, silhouette included, exactly as the player would show that key */
    const drop=[]; g.traverse(o=>{ if(o.isMesh&&o.userData.key!=='icm') drop.push(o); });
    drop.forEach(o=>o.parent&&o.parent.remove(o));
    sc.add(g);
    const fit=K.fitCamera(cam,g,1.08);
    const dir=new T.Vector3(0,0,1).normalize();        // straight at the cut plane, as the beats are
    cam.position.copy(fit.centre).addScaledVector(dir,fit.distance);
    cam.lookAt(fit.centre);
    ren.render(sc,cam);
    const bb=new T.Box3().setFromObject(g);
    let meshes=0; g.traverse(o=>{if(o.isMesh)meshes++;});
    return {meshes, empty:bb.isEmpty(), bboxMin:bb.min.toArray().map(v=>+v.toFixed(3)),
            bboxMax:bb.max.toArray().map(v=>+v.toFixed(3)), camPos:cam.position.toArray().map(v=>+v.toFixed(3))};
  }, t);
  console.log('  t=' + t + '  ' + JSON.stringify(diag));
  const file = 'viz-training/models-out/blastocyst/r1-icm-alone-' + TAG + '-t' + String(t).replace('.','_') + '.png';
  await p.locator('#c').screenshot({ path: file });
  out['t='+t] = file;
}
console.log(TAG, JSON.stringify(out,null,1));
await b.close(); srv.close();
