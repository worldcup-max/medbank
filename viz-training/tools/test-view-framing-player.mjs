/* MedBank · viz-training · test-view-framing-player
 *
 * The per-view camera refit (engine__refit-camera-on-isolate), exercised in the REAL player rather
 * than in a harness with a camera of its own: MB3D.mountScene(), and the view chips a student clicks.
 * render-scene-views.mjs fits its own camera per view, so it would have shown this bug as already
 * fixed while the player was broken — the substrate is the point.
 *
 * The cardiac-looping scene has no traced and no isolating view, and those are the two paths the
 * change touches hardest, so two FIXTURE views are bolted onto an in-memory copy of it. Nothing in
 * the corpus is written.
 *
 * Checks: every structure resolves through the real adapter with geometry · an isolating view moves
 * the camera in and moves what it looks at · "Show all" pulls back out · a trace still flies, stop by
 * stop · eleven chips hammered 90ms apart settle exactly where the same view reached calmly settles
 * (no stale animation still owning the camera) · the loop is alive, drawing, and the console is empty.
 *
 * Runs in the build task's container, like render-scene-views.mjs, and wants the same chromium.
 *   node viz-training/tools/test-view-framing-player.mjs
 */
import { chromium } from 'playwright';
import { readFileSync } from 'fs';
import http from 'http'; import path from 'path'; import fs from 'fs';
const ROOT = process.cwd();
const MIME = { '.js':'text/javascript','.json':'application/json','.html':'text/html' };
const server = http.createServer((rq,rs)=>{const p=path.join(ROOT,decodeURIComponent(rq.url.split('?')[0]));
 fs.readFile(p,(e,b)=>{if(e){rs.writeHead(404);return rs.end('no');}rs.writeHead(200,{'content-type':MIME[path.extname(p)]||'application/octet-stream'});rs.end(b);});});
await new Promise(r=>server.listen(0,r));
const BASE=`http://127.0.0.1:${server.address().port}/`;
const scene=JSON.parse(readFileSync('viz-training/scenes/embryology__cardiovascular-development__cardiac-looping.json','utf8'));

/* A FIXTURE, not a corpus edit: this scene has no traced or isolating view, and those are the two
   code paths the change touches hardest. Bolt two on and drive them. */
const fx = JSON.parse(JSON.stringify(scene));
fx.views = fx.views.concat([
  { title:'FIXTURE isolate', mode:'isolate', narration:'', ops:[
    {op:'HIDE_STRUCTURE',target:'*'},
    {op:'SHOW_STRUCTURE',target:'sinus_c'},{op:'SHOW_STRUCTURE',target:'atrium_c'},
    {op:'SHOW_STRUCTURE',target:'ventricle_c'},{op:'SHOW_STRUCTURE',target:'bulbus_c'},
    {op:'ISOLATE_REGION',target:'ventricle_c'} ] },
  { title:'FIXTURE trace', mode:'trace', narration:'', ops:[
    {op:'HIDE_STRUCTURE',target:'*'},
    {op:'SHOW_STRUCTURE',target:'sinus_c'},{op:'SHOW_STRUCTURE',target:'atrium_c'},
    {op:'SHOW_STRUCTURE',target:'ventricle_c'},{op:'SHOW_STRUCTURE',target:'bulbus_c'},
    {op:'SHOW_STRUCTURE',target:'truncus_c'},
    {op:'ROTATE_TO_VIEW',view:'lateral'},
    {op:'TRACE_STRUCTURE',target:'ventricle_c',path:['sinus_c','atrium_c','ventricle_c','bulbus_c','truncus_c'],duration:6} ] }
]);

const html=`<!doctype html><meta charset=utf8><link rel="icon" href="data:,"><body style="margin:0;background:#0e1626">
<div id="host" style="position:absolute;inset:0"></div>
<script>window.MEDBANK_CONFIG={MODEL_BASE:'${BASE}models3d/',FEATURES:{MODEL3D:true}};<\/script>
<script src="${BASE}node_modules/three/build/three.js"><\/script>
<script src="${BASE}node_modules/three/examples/js/controls/TrackballControls.js"><\/script>
<script src="${BASE}node_modules/three/examples/js/controls/OrbitControls.js"><\/script>
<script src="${BASE}node_modules/three/examples/js/loaders/STLLoader.js"><\/script>
<script src="${BASE}models3d/render-kit.js"><\/script>
<script src="${BASE}viz3d.js"><\/script>
<script>
window.mountIt=function(sc){return MB3D.mountScene(document.getElementById('host'),sc,{}).then(function(){return true;});};
window.cam=function(){var p=MB3D.player();return {pos:p.camera.position.toArray().map(function(n){return +n.toFixed(3);}),
  tgt:(p.controls.target||new THREE.Vector3()).toArray().map(function(n){return +n.toFixed(3);}),
  dist:+p.camera.position.distanceTo(p.controls.target||new THREE.Vector3()).toFixed(3),
  frames:p.frames(), alive:p.alive(), err:String(p.lastError()||'')};};
window.controlsKind=function(){return MB3D.player().controls.constructor.name||(THREE.TrackballControls?'?':'none');};
window.usingTrackball=function(){return !!(THREE.TrackballControls && MB3D.player().controls instanceof THREE.TrackballControls);};
window.meshReport=function(){var p=MB3D.player(),out={loaded:0,noGeom:0,keys:[]};
  Object.keys(p.meshes).forEach(function(k){var m=p.meshes[k];var g=m&&m.geometry;var n=g&&g.attributes&&g.attributes.position?g.attributes.position.count:0;
    if(n>0)out.loaded++;else{out.noGeom++;out.keys.push(k);}});return out;};
window.sizeOf=function(pre){var p=MB3D.player();var b=new THREE.Box3();var n=0;
  Object.keys(p.meshes).forEach(function(k){if(k.indexOf(pre)!==0)return;b.expandByObject(p.meshes[k]);n++;});
  var s=b.getSize(new THREE.Vector3());return {n:n,size:s.toArray().map(function(x){return +x.toFixed(3);}),diag:+s.length().toFixed(3)};};
window.centreOf=function(pre){var p=MB3D.player();var b=new THREE.Box3();
  Object.keys(p.meshes).forEach(function(k){if(k.indexOf(pre)!==0)return;b.expandByObject(p.meshes[k]);});
  return b.getCenter(new THREE.Vector3()).toArray().map(function(x){return +x.toFixed(3);});};
window.clickChip=function(i){var c=document.querySelectorAll('.mb3d-chip');if(!c[i])return false;c[i].click();return true;};
window.chipCount=function(){return document.querySelectorAll('.mb3d-chip').length;};
window.showAll=function(){document.getElementById('mb3d-showall')?0:0;var b=[].slice.call(document.querySelectorAll('a,button')).filter(function(x){return /show all/i.test(x.textContent||'');})[0];if(b){b.click();return true;}return false;};
<\/script>`;
fs.mkdirSync('viz-training/models-out/_framing',{recursive:true});
fs.writeFileSync('viz-training/models-out/_framing/_player-regress.html',html);

const b=await chromium.launch({executablePath:'/opt/pw-browsers/chromium-1194/chrome-linux/chrome',
  args:['--use-gl=swiftshader','--enable-unsafe-swiftshader','--no-sandbox']});
const p=await b.newPage({viewport:{width:1280,height:900}});
const log=[];
p.on('console',m=>log.push({type:m.type(),text:m.text()}));
p.on('pageerror',e=>log.push({type:'pageerror',text:String(e&&e.message||e)}));
p.on('response',r=>{if(r.status()>=400)log.push({type:'http'+r.status(),text:r.url()});});
await p.goto(BASE+'viz-training/models-out/_framing/_player-regress.html');
await p.waitForFunction('typeof window.mountIt === "function"');
await p.evaluate(sc=>window.mountIt(sc),fx);
await p.waitForTimeout(4200);

const R={};
R.usingTrackball=await p.evaluate(()=>window.usingTrackball());
R.controls=await p.evaluate(()=>window.controlsKind());
R.meshes=await p.evaluate(()=>window.meshReport());
R.dLoopSize=await p.evaluate(()=>window.sizeOf('d_'));
R.lLoopSize=await p.evaluate(()=>window.sizeOf('l_'));
R.dCentre=await p.evaluate(()=>window.centreOf('d_'));
R.lCentre=await p.evaluate(()=>window.centreOf('l_'));

const n=await p.evaluate(()=>window.chipCount());
R.chips=n;

/* 1 · the isolate fixture: the camera must actually travel */
await p.evaluate(()=>window.clickChip(0)); await p.waitForTimeout(1500);
const wide=await p.evaluate(()=>window.cam());
await p.evaluate(k=>window.clickChip(k), n-2); await p.waitForTimeout(1800);
const iso=await p.evaluate(()=>window.cam());
R.isolate={wideDist:wide.dist,isoDist:iso.dist,movedIn:iso.dist<wide.dist*0.9,targetMoved:iso.tgt.join()!==wide.tgt.join()};

/* 2 · "Show all" must pull back out again */
await p.evaluate(()=>window.showAll()); await p.waitForTimeout(1200);
const back=await p.evaluate(()=>window.cam());
R.showAll={dist:back.dist, pulledBack: back.dist>iso.dist*1.3};

/* 3 · the traced fixture: the trace must keep flying, and land somewhere different each stop */
await p.evaluate(k=>window.clickChip(k), n-1);
const stops=[];
for(let i=0;i<5;i++){ await p.waitForTimeout(1900); stops.push(await p.evaluate(()=>window.cam())); }
const uniq=new Set(stops.map(s=>s.tgt.join()));
R.trace={stops:stops.map(s=>({tgt:s.tgt,dist:s.dist})),distinctTargets:uniq.size, keptFlying:uniq.size>=3};

/* 4 · hammer the chips — no stacked animations, and the last one still lands. Ending on the TRACE
   fixture would be measuring the trace, which is supposed to keep moving; end on a still view. */
for(let i=0;i<n-2;i++){ await p.evaluate(k=>window.clickChip(k),i); await p.waitForTimeout(90); }
await p.evaluate(()=>window.clickChip(2));
await p.waitForTimeout(1600);
const settledA=await p.evaluate(()=>window.cam());
await p.waitForTimeout(900);
const settledB=await p.evaluate(()=>window.cam());
const drift=[];
let prev=settledA;
for(let i=0;i<6;i++){ await p.waitForTimeout(800); const c=await p.evaluate(()=>window.cam());
  drift.push(+Math.hypot(c.pos[0]-prev.pos[0],c.pos[1]-prev.pos[1],c.pos[2]-prev.pos[2]).toFixed(4)); prev=c; }
/* and the same view reached calmly must end in the same place — proof the hammering did not leave
   a stale animation owning the camera */
await p.evaluate(()=>window.clickChip(5)); await p.waitForTimeout(1400);
await p.evaluate(()=>window.clickChip(2)); await p.waitForTimeout(1600);
const calm=await p.evaluate(()=>window.cam());
R.rapidChips={settled: settledA.pos.join()===settledB.pos.join(), driftPerSample:drift,
              finalDrift: drift[drift.length-1],
              sameAsCalmApproach: Math.hypot(calm.pos[0]-prev.pos[0],calm.pos[1]-prev.pos[1],calm.pos[2]-prev.pos[2]) < 0.01,
              hammered:prev.pos, calm:calm.pos};

/* 5 · still drawing, no thrown loop */
R.health=await p.evaluate(()=>window.cam());
R.console=log.filter(l=>!/GPU stall due to ReadPixels/.test(l.text));
console.log(JSON.stringify(R,null,2));
await b.close(); server.close();
