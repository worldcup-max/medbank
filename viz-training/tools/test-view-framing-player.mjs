/* MedBank · viz-training · test-view-framing-player
 *
 * The per-view camera refit (engine__refit-camera-on-isolate), exercised in the REAL player rather
 * than in a harness with a camera of its own: MB3D.mountScene(), and the view chips a student clicks.
 * render-scene-views.mjs fits its own camera per view, so it would have shown this bug as already
 * fixed while the player was broken — the substrate is the point.
 *
 * THIS IS A GATE. It asserts, it prints one line per check, and it EXITS NON-ZERO when a check fails.
 * Rewritten 2026-09-10 after review round 2, which found it was neither:
 *
 *  · IT HAD NO ASSERTIONS. It printed a JSON blob and exited 0 whatever it found, so the proof section
 *    of the item it exists for could not be re-checked by running anything. BUILD-LOG recorded "Show
 *    all pulls back out (-> 7.24)" from reading that blob by eye.
 *  · AND THE BLOB WAS WRONG. Run as committed it printed showAll {dist: 2.089, pulledBack: false} —
 *    three times in a row. Diagnosed by the reviewer and confirmed here: with a single
 *    waitForTimeout() and no intervening page.evaluate, requestAnimationFrame is throttled in headless
 *    and the camera ease never advances. Sampling every 150ms shows the pull-back completing inside
 *    300ms and landing at 6.774; a 3000ms wait lands at 6.798. The product was fine; the harness was
 *    measuring a paused animation and reporting the pause as a result.
 *
 * SO NOTHING HERE WAITS BY SLEEPING. settle() polls the camera — each poll is a page.evaluate, which is
 * what keeps rAF running — until the position has stopped moving, and only then is anything read. A
 * fixed sleep in a headless browser is not a wait, it is a coin toss.
 *
 * The cardiac-looping scene has no traced and no isolating view, and those are the two paths the
 * change touches hardest, so two FIXTURE views are bolted onto an in-memory copy of it. Nothing in
 * the corpus is written.
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
   code paths the change touches hardest. Bolt them on and drive them.

   'FIXTURE isolate + name' is the round-2 case: a view that isolates ONE structure and then names two
   more after it. Framing on the isolate alone leaves the two named ones off the stage, which is the
   regression this item was sent back for, and it now has a test that fails when it returns. */
const fx = JSON.parse(JSON.stringify(scene));
fx.views = fx.views.concat([
  { title:'FIXTURE isolate', mode:'isolate', narration:'', ops:[
    {op:'HIDE_STRUCTURE',target:'*'},
    {op:'SHOW_STRUCTURE',target:'sinus_c'},{op:'SHOW_STRUCTURE',target:'atrium_c'},
    {op:'SHOW_STRUCTURE',target:'ventricle_c'},{op:'SHOW_STRUCTURE',target:'bulbus_c'},
    {op:'ISOLATE_REGION',target:'ventricle_c'} ] },
  { title:'FIXTURE isolate + name', mode:'isolate', narration:'', ops:[
    {op:'HIDE_STRUCTURE',target:'*'},
    {op:'SHOW_STRUCTURE',target:'sinus_c'},{op:'SHOW_STRUCTURE',target:'atrium_c'},
    {op:'SHOW_STRUCTURE',target:'ventricle_c'},{op:'SHOW_STRUCTURE',target:'bulbus_c'},
    {op:'ISOLATE_REGION',target:'ventricle_c'},
    {op:'SHOW_STRUCTURE',target:'sinus_c'},
    {op:'SHOW_RELATIONSHIP',from:'ventricle_c',to:'bulbus_c',kind:'bulboventricular sulcus'} ] },
  { title:'FIXTURE trace', mode:'trace', narration:'', ops:[
    {op:'HIDE_STRUCTURE',target:'*'},
    {op:'SHOW_STRUCTURE',target:'sinus_c'},{op:'SHOW_STRUCTURE',target:'atrium_c'},
    {op:'SHOW_STRUCTURE',target:'ventricle_c'},{op:'SHOW_STRUCTURE',target:'bulbus_c'},
    {op:'SHOW_STRUCTURE',target:'truncus_c'},
    {op:'ROTATE_TO_VIEW',view:'lateral'},
    {op:'TRACE_STRUCTURE',target:'ventricle_c',path:['sinus_c','atrium_c','ventricle_c','bulbus_c','truncus_c'],duration:6} ] }
]);
const N_FX = 3, I_ISO = fx.views.length - 3, I_ISO_NAMED = fx.views.length - 2, I_TRACE = fx.views.length - 1;

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
window.subject=function(){var p=MB3D.player();return p.viewSubject?p.viewSubject():null;};
window.controlsKind=function(){return MB3D.player().controls.constructor.name||(THREE.TrackballControls?'?':'none');};
window.usingTrackball=function(){return !!(THREE.TrackballControls && MB3D.player().controls instanceof THREE.TrackballControls);};
window.meshReport=function(){var p=MB3D.player(),out={loaded:0,noGeom:0,keys:[]};
  Object.keys(p.meshes).forEach(function(k){var m=p.meshes[k];var g=m&&m.geometry;var n=g&&g.attributes&&g.attributes.position?g.attributes.position.count:0;
    if(n>0)out.loaded++;else{out.noGeom++;out.keys.push(k);}});return out;};
/* Is any drawn geometry BEHIND the camera? The failure the round-2 review measured as a subject at
   2765% of frame height was exactly this, and in NDC it is unmistakable. */
window.anyBehindCamera=function(){var p=MB3D.player();var c=(p.controls.target||new THREE.Vector3()).clone();
  var dir=p.camera.position.clone().sub(c).normalize();var camS=p.camera.position.clone().sub(c).dot(dir);var n=0;
  Object.keys(p.meshes).forEach(function(k){var m=p.meshes[k];if(!m||!m.visible||!m.geometry)return;
    if(!m.geometry.boundingBox)m.geometry.computeBoundingBox();var bb=m.geometry.boundingBox;if(!bb)return;
    for(var i=0;i<8;i++){var v=new THREE.Vector3(i&1?bb.max.x:bb.min.x,i&2?bb.max.y:bb.min.y,i&4?bb.max.z:bb.min.z);
      m.localToWorld(v);if(v.sub(c).dot(dir)>camS){n++;break;}}});
  return n;};
window.clickChip=function(i){var c=document.querySelectorAll('.mb3d-chip');if(!c[i])return false;c[i].click();return true;};
window.chipCount=function(){return document.querySelectorAll('.mb3d-chip').length;};
window.showAll=function(){var b=[].slice.call(document.querySelectorAll('a,button')).filter(function(x){return /show all/i.test(x.textContent||'');})[0];if(b){b.click();return true;}return false;};
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

/* Poll until the camera stops moving. Each poll is a page.evaluate, which is what keeps rAF alive in
   headless — the whole reason this exists instead of a sleep. Returns the settled reading and how long
   it took, so a test that starts sleeping through its own animation shows up as a jump in `ms`. */
async function settle(page, { quiet = 3, step = 150, max = 8000 } = {}) {
  const t0 = Date.now();
  let prev = null, same = 0, last = null;
  while (Date.now() - t0 < max) {
    const c = await page.evaluate(() => window.cam());
    last = c;
    const key = c.pos.join() + '|' + c.tgt.join();
    if (key === prev) { if (++same >= quiet) break; } else { same = 0; prev = key; }
    await page.waitForTimeout(step);
  }
  return { ...last, settleMs: Date.now() - t0, settled: same >= quiet };
}

const checks = [];
const check = (name, pass, detail) => { checks.push({ name, pass: !!pass, detail }); };

await p.goto(BASE+'viz-training/models-out/_framing/_player-regress.html');
await p.waitForFunction('typeof window.mountIt === "function"');
await p.evaluate(sc=>window.mountIt(sc),fx);
await settle(p, { max: 12000 });          // includes the 3s opening spin

const meshes = await p.evaluate(()=>window.meshReport());
check('every structure resolves through the real adapter with geometry',
      meshes.noGeom === 0, `${meshes.loaded} with geometry, ${meshes.noGeom} without${meshes.noGeom ? ' — ' + meshes.keys.join(', ') : ''}`);

const n = await p.evaluate(()=>window.chipCount());
check('every view has a chip', n === fx.views.length, `${n} chips for ${fx.views.length} views`);

/* 1 · an isolating view moves the camera IN, and moves what it is looking at */
await p.evaluate(()=>window.clickChip(0)); const wide = await settle(p);
await p.evaluate(k=>window.clickChip(k), I_ISO); const iso = await settle(p);
check('an isolating view moves the camera in', iso.dist < wide.dist * 0.9, `wide ${wide.dist} -> isolate ${iso.dist}`);
check('an isolating view moves what the camera looks at', iso.tgt.join() !== wide.tgt.join(), `${wide.tgt.join()} -> ${iso.tgt.join()}`);

/* 2 · THE ROUND-2 REGRESSION. A view that isolates and then NAMES more must frame the named ones too:
       its subject box has to be bigger than the bare isolate's, and it must stand further back. */
const isoSubj = await p.evaluate(()=>window.subject());
await p.evaluate(k=>window.clickChip(k), I_ISO_NAMED); const isoNamed = await settle(p);
const namedSubj = await p.evaluate(()=>window.subject());
check('the player exposes what it framed on (viewSubject)', !!(isoSubj && namedSubj), 'player.viewSubject()');
if (isoSubj && namedSubj) {
  check('a view that names structures after isolating counts them as subject',
        namedSubj.named.length > 0 && namedSubj.keys.length > isoSubj.keys.length,
        `isolate ${isoSubj.keys.length} key(s) -> isolate+name ${namedSubj.keys.length}, named=${namedSubj.named.join(',')}`);
  const dIso = Math.max(...isoSubj.size), dNamed = Math.max(...namedSubj.size);
  check('and frames a bigger box because of it', dNamed > dIso * 1.05, `subject extent ${dIso} -> ${dNamed}`);
}
check('and stands further back than the bare isolate', isoNamed.dist > iso.dist,
      `isolate ${iso.dist} -> isolate+name ${isoNamed.dist}`);

/* 3 · nothing drawn may sit behind the camera, on any of these views */
for (const [label, idx] of [['wide', 0], ['isolate', I_ISO], ['isolate+name', I_ISO_NAMED]]) {
  await p.evaluate(k=>window.clickChip(k), idx); await settle(p);
  const behind = await p.evaluate(()=>window.anyBehindCamera());
  check(`no drawn geometry behind the camera (${label})`, behind === 0, `${behind} mesh(es) behind`);
}

/* 4 · "Show all" must pull back out again. This is the check that used to read 2.089/false. */
await p.evaluate(k=>window.clickChip(k), I_ISO); const iso2 = await settle(p);
await p.evaluate(()=>window.showAll()); const back = await settle(p);
check('"Show all" pulls the camera back out', back.dist > iso2.dist * 1.3, `isolate ${iso2.dist} -> show all ${back.dist} (settled in ${back.settleMs}ms)`);

/* 5 · the traced fixture keeps flying, and lands somewhere different at each stop */
await p.evaluate(k=>window.clickChip(k), I_TRACE);
const stops=[];
for(let i=0;i<5;i++){ await p.waitForTimeout(1900); stops.push(await p.evaluate(()=>window.cam())); }
const uniq=new Set(stops.map(s=>s.tgt.join()));
check('a trace keeps flying, stop by stop', uniq.size >= 3, `${uniq.size} distinct targets across 5 samples`);

/* 6 · hammer the chips — no stacked animations, and the same view reached calmly lands in the same
       place. Ending on the TRACE fixture would be measuring the trace, which is supposed to keep
       moving; end on a still view. */
for(let i=0;i<fx.views.length-N_FX;i++){ await p.evaluate(k=>window.clickChip(k),i); await p.waitForTimeout(90); }
await p.evaluate(()=>window.clickChip(2));
const hammered = await settle(p);
await p.evaluate(()=>window.clickChip(5)); await settle(p);
await p.evaluate(()=>window.clickChip(2)); const calm = await settle(p);
const drift = Math.hypot(calm.pos[0]-hammered.pos[0], calm.pos[1]-hammered.pos[1], calm.pos[2]-hammered.pos[2]);
check('eleven chips 90ms apart settle where the calm approach settles', drift < 0.01,
      `drift ${drift.toFixed(4)} — hammered ${hammered.pos.join()}, calm ${calm.pos.join()}`);
check('the camera actually stopped', hammered.settled && calm.settled, `settle ${hammered.settleMs}ms / ${calm.settleMs}ms`);

/* 7 · still drawing, and the console is empty */
const health = await p.evaluate(()=>window.cam());
check('the render loop is alive and drawing', health.alive && health.frames > 0 && !health.err,
      `alive=${health.alive} frames=${health.frames} err=${health.err || 'none'}`);
const noisy = log.filter(l=>!/GPU stall due to ReadPixels/.test(l.text) && l.type !== 'log' && l.type !== 'info' && l.type !== 'debug');
check('console clean', noisy.length === 0, noisy.length ? JSON.stringify(noisy.slice(0,6)) : 'no errors or warnings');

await b.close(); server.close();

let failed = 0;
for (const c of checks) { if (!c.pass) failed++; console.log(`${c.pass ? 'ok  ' : 'FAIL'}  ${c.name}${c.detail ? '  —  ' + c.detail : ''}`); }
console.log(`\n${checks.length - failed}/${checks.length} checks passed`);
process.exit(failed ? 1 : 0);
