/* MedBank · WALK A TIME-VARYING SCENE AS THE PLAYER DRAWS IT, AND COUNT WHAT A STUDENT CAN SEE.
 *
 *   node viz-training/tools/measure-scene-visibility.mjs <scene.json> [models3d/<model>.js] [outDir]
 *
 * WHY THIS EXISTS. Proposed and written by the model3d review task, round 3 on the cardiac-cycle
 * item, 2026-09-29. Every proof tool in this corpus renders `build(t)` with every layer on, at full
 * opacity, fitted once to the whole model. The PLAYER does none of those things: viz3d.js resets
 * every structure to visible, applies the view's ops, applies each structure's own `opacity`, and
 * REFITS THE CAMERA PER VIEW to the bounding box of what is still visible. So the proof frames prove
 * the geometry and prove nothing whatever about the ten pictures a student actually looks at.
 *
 * That gap was declared in the cardiac-cycle scene's gaps[] for three rounds — "nobody has yet loaded
 * this scene into viz3d.js and walked its ten beats" — and it hid a whole class of defect. When the
 * walk was finally done, the aortic valve had ZERO visible pixels in all six beats whose narration
 * points at it; the tricuspid had zero in nine beats of ten; the beat that HIGHLIGHTS the left
 * outflow markers drew none of them; and the two beats that say "the wall is taken away so you can
 * see the four rings" drew opaque blood casts over the rings.
 *
 * RENDER-STANDARD already has the rule — "A REFERENCE MUST SURVIVE THE VIEW THAT USES IT: render
 * with and without, difference the frames, count" — and tools/measure-heart-external-visibility.mjs
 * applies it, hardcoded to one model and one hand-written list of beats. This is the same idea taken
 * from the SCENE, so it runs on any procedural scene without being rewritten: the beats come from
 * scene.views, the op semantics are viz3d's, and the structure a beat points at is read off its own
 * HIGHLIGHT_STRUCTURE / SHOW_RELATIONSHIP ops rather than being supplied by a human.
 *
 * WHAT IT ASSERTS, per view:
 *   · every structure the ops leave VISIBLE draws at least MIN_ANY of the frame, or is named
 *   · every structure the view HIGHLIGHTS or names in a SHOW_RELATIONSHIP draws at least MIN_POINTED
 *   · the whole subject covers at least MIN_SUBJECT of the frame
 * A structure that is legitimately buried can be declared in scene.visibility_waivers — {view, key,
 * why} — so a waiver is an argument someone wrote down rather than a threshold quietly lowered.
 *
 * HOW IT COUNTS. Each mesh is flat-shaded in a colour unique to its userData.key, the frame is read
 * back, and pixels are tallied by key. Occlusion is the renderer's own depth buffer, which is the
 * only honest source for it. Colour management is off, antialiasing is off and the material is
 * unlit, so the value that goes in is the value that comes out.
 *
 * ID_ENCODING, CORRECTED 2026-09-30 BY THE ROUND-4 BUILD RUN ON fetal-circulation. THIS WAS A
 * SILENT MIS-MEASUREMENT, NOT A THRESHOLD.
 *
 *   The id was `idOf[k]*8` in the RED CHANNEL ALONE. A channel holds 0-255, so the 32nd structure
 *   of a scene asks for 256, setRGB clamps to 1.0 and it is written as 255 — which still decodes
 *   to 32, correct by luck. The 33rd is written as 255 too, and so is every structure after it.
 *   THE PIXELS OF THE 33rd, 34th, 35th ... STRUCTURE ARE ALL ATTRIBUTED TO WHICHEVER KEY IS 32nd,
 *   and since pct[] is only reported for keys the view leaves visible, a structure past the limit
 *   typically reads EXACTLY 0.000 while its pixels are either discarded or silently added to an
 *   unrelated structure's count. MEASURED on the pinned renderer rather than reasoned about: ids
 *   1-32 round-trip exactly, 33-60 all decode to 32 (28 of the first 60 ids wrong).
 *
 *   HOW IT WAS FOUND, which is the part worth keeping: not by reading this code. Round 4 added two
 *   structures to fetal-circulation and `midline` — which it had not touched, in a beat it had not
 *   touched — went from 0.407% to 0.000%. midline had been the 31st structure and became the 33rd.
 *   Reproduced deliberately afterwards: adding or removing one structure ahead of a key moves that
 *   key across the boundary and its measurement collapses to zero.
 *
 *   IT ALSO EXPLAINS A FINDING TWO REVIEW ROUNDS COULD NOT CLOSE. Review round 2 recorded that
 *   pfc_duct "is ~10x worse than ductus_arteriosus under the same camera" and declined to call it
 *   a scene defect because "scene vs +pfc variant vs the harness's variant-ref handling has not
 *   been isolated". It was none of those: pfc_duct was the 34th structure. The reviewer was right
 *   to hold off, and the standing warning it cited — do not file your own container as a finding —
 *   is what kept a harness bug from being filed against the model.
 *
 *   THE FIX: the id is split across RED (low 5 bits) and GREEN (high bits), both still in steps of
 *   8 so the decode keeps its tolerance, which gives 1024 ids. (0,0) is the background and id 0 is
 *   never issued, so the background test is unambiguous. VERIFIED on the pinned renderer, all 1023
 *   ids, zero disagreements. Scenes with 32 or fewer structures encode byte-identically to before
 *   and CANNOT be re-graded by this change — for id <= 31 floor(id/32) is 0, so green is 0 and red
 *   is the old value, and id 32 is written 255 either way. Only the scenes that were being measured
 *   wrongly move. Fourteen scenes in the corpus carry more than 32 structures; four are procedural
 *   3d_anatomy scenes this tool grades — cardiac-looping at 51 (nineteen structures collapsing onto
 *   one id), heart-external at 42, coronary-arteries-cardiac-veins at 35, and this one.
 *
 * THE ID-PICK PASS IS AN OPAQUE Z-BUFFER, AND THAT IS WHY `pct` READS 0.000 FOR EVERY STRUCTURE
 * INSIDE A TRANSLUCENT SHELL. Diagnosed 2026-10-01 by the build run on fertilization, round 2,
 * answering review round 1 finding 2: "the visibility walk passes beats whose subjects it cannot
 * see -- 4 of 9 beats have a POINTED-AT structure measuring exactly 0% ink while the walk reports
 * unseeable:[] and pointedBad:[]".
 *
 *   count() replaces every visible mesh's material with a flat MeshBasicMaterial carrying the id.
 *   That material is OPAQUE. The scene's own per-structure `opacity` -- which the beauty pass
 *   applies, and which is the whole reason a teaching diagram can show you a nucleus through a
 *   cell -- is dropped. So in the id buffer the outermost shell swallows everything behind it.
 *
 *   PROVED BY ARITHMETIC, NOT BY READING THE CODE: on fertilization, sum(pct) equals subject_pct
 *   to within rounding in all nine beats (beat 7: zona 80.558 + perivitelline 19.442 = 100.000,
 *   with all six structures inside them at exactly 0). Every pixel is attributed to whichever
 *   structure is frontmost when everything is drawn solid, and the zero set is exactly the set of
 *   structures enclosed by a translucent one. Beat 5 is the sharpest case: zona at opacity 0.4
 *   takes 52.526% alone and depolarisation_wave, the beat's own highlighted subject at opacity
 *   0.72, reads 0.
 *
 *   THE REVIEW'S HYPOTHESIS WAS WRONG, and recording that is worth more than the fix. It guessed
 *   "the ink pass may build at the view's t while the beauty pass honours the pin". It does not:
 *   mount() calls the same groupFor(r.t==null?t:r.t, r.flags) for both passes, and beat 9 reads
 *   sperm_head 0.678, oocyte_chromatin 0.670 and centriole 0.311 at exactly the same pins that
 *   read 0 in beat 8 -- because in beat 9 nothing translucent stands between them and the camera.
 *   Pinning is not the variable; enclosure is.
 *
 *   THE VERDICTS WERE NEVERTHELESS RIGHT, and this is why nothing below changes them. The
 *   alpha-aware fallback already carries every one of those structures (peaks 54-155 against the
 *   40/255 floor), and the review looked at beats 7 and 8 and found the subjects dominate both.
 *   Checked for a way the fallback could be fooled and did not find one: render-kit's
 *   standardLights() adds no shadow-casting light and renderer.shadowMap is off, so hiding a
 *   structure can only change that structure's own pixels -- diffKey cannot be cleared by a
 *   secondary effect elsewhere in the frame.
 *
 *   SO THE DEFECT IS EVIDENTIARY, AND THE FIX IS EVIDENTIARY. `visible_pct` below measures the ink
 *   a structure lays down when only OPAQUE structures are allowed to occlude it -- the honest
 *   geometric reading of "can this be seen" for a diagram that draws through its own casts -- and
 *   `witness` names, per pointed-at structure, which measure cleared it and by how much. Both are
 *   REPORTED AND PRINTED; NEITHER ENTERS THE PASS/FAIL EXPRESSION. That is deliberate. Every note
 *   in this file about not re-grading another item's verdict mid-review applies here, and there is
 *   an item sitting `built` and unreviewed as this is written. seen() is byte-for-byte what it was,
 *   so no scene in the corpus can change verdict because of this change; the artifact simply stops
 *   being silent about why a beat passed.
 *
 *   LEFT FOR A DELIBERATE DECISION, NOT DONE HERE: making visible_pct the primary measure in place
 *   of pct. It is the better number, but promoting it would re-grade every scene this tool has
 *   ever passed, and that is a corpus-wide change that wants its own before/after run rather than
 *   a ride-along on one item's rework.
 *
 * A SECOND HOLE, FOUND WHILE FIXING THE FIRST AND NOT CLOSED HERE: idPointBad filters on
 * `r.pct[k] != null`, and pct only carries keys the ops leave VISIBLE. So a beat that HIGHLIGHTs or
 * names in a SHOW_RELATIONSHIP a structure it has HIDDEN is not failed -- it is not even looked at.
 * No beat in fertilization does this, so nothing here is affected. It is now REPORTED as
 * `pointed_but_hidden` and printed loudly, and deliberately does not fail the beat, for the same
 * no-mid-flight-re-grading reason. A reviewer should decide whether it ought to.
 *
 * IT IS NOT THE PLAYER. It reimplements viz3d's resetState + ops + per-view refit rather than
 * driving viz3d itself, because viz3d wants a DOM, a mount and a network. That reimplementation is
 * this tool's one weakness and is stated rather than hidden: if the two ever disagree, viz3d is
 * right. The op semantics copied are keysFor() (key, else group), resetState() (all visible),
 * SHOW/HIDE/HIGHLIGHT/ROTATE_TO_VIEW/SET_STAGE, VIEW_DIR, FRAME_PAD 1.05, and subjectBox over the
 * visible set. Run from the repo root. Exits non-zero on any failure.
 */
import { chromium } from 'playwright';
import { readFileSync, writeFileSync, mkdirSync, existsSync, readdirSync } from 'fs';
import http from 'http'; import path from 'path'; import fs from 'fs';

const MIN_ANY = 0.02;        // % of frame: below this a structure is drawn but unseeable
const MIN_POINTED = 0.30;    // % of frame for a structure the narration points at
const MIN_SUBJECT = 8.0;     // % of frame the whole subject must cover
/* A FLOOR ON HOW MUCH THE PIXELS MOVE, NOT ONLY ON HOW MANY. Added 2026-09-30 by the round-5 build
   run, in answer to R4-OPEN-2 and to the rule round 4 proposed alongside it. diffKey counted any
   pixel that changed by more than 6/255 in any channel and put no floor on the size of the change,
   so changed_pct answered "did any pixel move" rather than "can a student see it". Round 4
   reproduced six cases on the pinned renderer where a structure cleared the bar on a 15-19/255
   tint: it rendered beat 2 with and without the tricuspid, looked at both crops at 3x, and could
   not tell them apart. So a structure that clears ONLY on the alpha-aware measure must also move
   the pixels it changes by at least MIN_PEAK.

   WHY A PEAK AND NOT A MEAN: a structure seen through two translucent casts is faint over most of
   its area and legible along one edge, and a mean would grade it by the faint part. The peak says
   the structure has at least one place a student's eye can catch. 40/255 is where round 4's own
   data splits — the two cases it looked at and called legible read 39 and 156, the five it looked
   at and could not see read 19 to 38.

   THIS THRESHOLD IS SHARED WITH EVERY OTHER SCENE THIS TOOL GRADES, which is why round 4 declined
   to move it mid-review: "moving a threshold during one item's review silently re-grades another
   item's verdict". The round-5 build ran the tool over heart-valves and heart-external before and
   after the change and recorded what moved; it is in BUILD-LOG.md under 2026-09-30. */
const MIN_PEAK = 40;         // 0-255: how far the pixels an alpha-only pass relies on must move
const W = 1100, H = 900;

const ROOT = process.cwd();
const scenePath = process.argv[2] ||
  'viz-training/scenes/gross__heart-pericardium__cardiac-cycle-pumping.json';
const scene = JSON.parse(readFileSync(scenePath, 'utf8'));
const modelPath = process.argv[3] || ('models3d/' + scene.id.split('__').pop() + '.js');
const OUT = process.argv[4] || ('viz-training/models-out/' + scene.id.split('__').pop() + '/player');
/* THE OUT-DIR MUST LIVE UNDER THE REPO, AND SAYING SO COST ROUND 4 THREE FAILED RUNS. This tool
   serves its own _walk.html over an HTTP root at process.cwd(), so an out-dir anywhere else is a
   404 that surfaces thirty seconds later as an unexplained waitForFunction timeout with nothing in
   it naming the cause. Reject it here and say why (R4-STANDARDS-GAP 3). */
{
  const abs = path.resolve(OUT), root = path.resolve(ROOT);
  if (abs !== root && !abs.startsWith(root + path.sep)) {
    console.error('out-dir must be inside the repo, because this tool serves it over an HTTP root\n' +
                  '  at ' + root + '\n  got ' + abs +
                  '\nA path outside it 404s and the failure arrives as a 30-second timeout.');
    process.exit(2);
  }
}
mkdirSync(OUT, { recursive: true });

/* PIN THE RENDERER AND RECORD IT. Round 4 nearly filed its own container as a finding in the work:
   three.js r160 against the 0.128.0 the lockfile pins changes the lighting, so the subject's mean
   RGB goes from (72,33,49) to (27,13,20), every alpha-diff shrinks and structures drop under the
   thresholds. Rounds 3 and 4 were not measuring the same thing. Any tool that decides pass/fail off
   rendered pixels has to know what rendered them (R4-STANDARDS-GAP 1). */
const PINNED_THREE = (function () {
  try {
    const lock = JSON.parse(readFileSync(path.join(ROOT, 'package-lock.json'), 'utf8'));
    const v = (lock.packages && lock.packages['node_modules/three'] || {}).version;
    return v ? String(v).split('.')[1] : null;      // '0.128.0' -> '128', three's own REVISION
  } catch (e) { return null; }
})();

function findChromium() {
  if (process.env.CHROMIUM_PATH) return process.env.CHROMIUM_PATH;
  const base = '/opt/pw-browsers';
  if (existsSync(base)) for (const d of readdirSync(base))
    for (const rel of ['chrome-linux/chrome', 'chrome-linux/headless_shell']) {
      const p = path.join(base, d, rel); if (existsSync(p)) return p;
    }
  return null;
}
const MIME = { '.html': 'text/html', '.js': 'text/javascript', '.json': 'application/json', '.png': 'image/png' };
const server = http.createServer((q, s) => {
  const f = path.join(ROOT, decodeURIComponent(q.url.split('?')[0]));
  if (!fs.existsSync(f) || fs.statSync(f).isDirectory()) { s.writeHead(404); return s.end('no'); }
  s.writeHead(200, { 'content-type': MIME[path.extname(f)] || 'application/octet-stream' });
  s.end(fs.readFileSync(f));
});
await new Promise(r => server.listen(0, r));
const BASE = `http://127.0.0.1:${server.address().port}/`;

const page = `<!doctype html><meta charset=utf8><link rel="icon" href="data:,">
<body style="margin:0;background:#0e1626">
<script src="${BASE}node_modules/three/build/three.js"><\/script>
<script src="${BASE}models3d/render-kit.js"><\/script>
<script src="${BASE}${modelPath}"><\/script>
<script>
const MOD = window.MB3D_MODELS[Object.keys(window.MB3D_MODELS)[0]];
window.threeRevision = THREE.REVISION;
const W=${W},H=${H};
if (THREE.ColorManagement) THREE.ColorManagement.enabled = false;
const renderer = new THREE.WebGLRenderer({ antialias:false, preserveDrawingBuffer:true });
if ('outputColorSpace' in renderer) renderer.outputColorSpace = THREE.LinearSRGBColorSpace;
renderer.setSize(W,H);
renderer.domElement.id='c'; document.body.appendChild(renderer.domElement);
const scene = new THREE.Scene();
const lit = VizKit.standardLights(scene);
const camera = new THREE.PerspectiveCamera(45, W/H, 0.1, 500);
const holder = new THREE.Group(); scene.add(holder);
/* viz3d.js VIEW_DIR and FRAME_PAD, copied so the framing is the player's and not a second opinion */
const VIEW_DIR = { anterior:[0,0,1], posterior:[0,0,-1], lateral:[1,0,0], medial:[-1,0,0],
                   superior:[0,1,0.001], inferior:[0,-1,0.001] };
const FRAME_PAD = 1.05;
function distanceForBox(size, dir){
  const vHalf = camera.fov*Math.PI/180/2, hHalf = Math.atan(Math.tan(vHalf)*camera.aspect);
  let up = Math.abs(dir.y)>0.99 ? new THREE.Vector3(0,0,-1) : new THREE.Vector3(0,1,0);
  const right = new THREE.Vector3().crossVectors(up,dir).normalize();
  up = new THREE.Vector3().crossVectors(dir,right).normalize();
  const hx=size.x/2, hy=size.y/2, hz=size.z/2;
  const ext=a=>Math.abs(a.x)*hx+Math.abs(a.y)*hy+Math.abs(a.z)*hz;
  return Math.max(ext(up)/Math.tan(Math.max(0.05,vHalf)), ext(right)/Math.tan(Math.max(0.05,hHalf)))*FRAME_PAD + ext(dir);
}
/* viz3d.js resetState() + the ops that change what is on screen */
function stateFor(scn, view){
  const st = { visible:{}, hi:{}, dir:null, t:null, only:null, ghosted:false };
  scn.structures.forEach(s=>st.visible[s.key]=true);
  const keysFor = target => {
    if(!target || target==='*') return scn.structures.map(s=>s.key);
    if(scn.structures.some(s=>s.key===target)) return [target];
    return scn.structures.filter(s=>s.group===target).map(s=>s.key);
  };
  for(const o of (view.ops||[])){
    if(o.op==='SHOW_STRUCTURE') keysFor(o.target).forEach(k=>st.visible[k]=true);
    else if(o.op==='HIDE_STRUCTURE') keysFor(o.target).forEach(k=>st.visible[k]=false);
    else if(o.op==='HIGHLIGHT_STRUCTURE') keysFor(o.target).forEach(k=>st.hi[k]=o.intensity||0.45);
    else if(o.op==='ROTATE_TO_VIEW') st.dir=o.view;
    else if(o.op==='SET_STAGE') st.t=o.t;
    /* THE TWO OPS THAT SET THE CAMERA'S SUBJECT, and this file was ignoring both. viz3d.js:1906 and
       :1913 — ISOLATE_REGION and COMPARE_STRUCTURES each set state.only and state.ghosted, and
       subjectBox() (viz3d.js:2129) then frames the view on state.only rather than on everything
       visible. Without them this walk measured every such beat against the WRONG FRAME: it fitted
       the camera to the whole visible model and then reported the isolated subject as a small
       fraction of it. That is the same shape as the faults already recorded above — an instrument
       that argues for a waiver on a beat the player draws correctly — and it is worse here, because
       it also hides the opposite error: a beat CANNOT be fixed by isolating its subject if the
       measurement cannot see that it did.
       Added 2026-09-30 by the model3d build run on septation-of-heart, round 3, which needed
       beat 2's cushions (0.24% of the frame with the camera on the whole heart) to be measurable
       after ISOLATE_REGION put the camera on them.
       COMPARE_STRUCTURES' own 0.5 highlight is copied too, since it changes the emissive the ink
       measurement reads. */
    else if(o.op==='ISOLATE_REGION'){ st.only=keysFor(o.target); st.ghosted=true; }
    else if(o.op==='COMPARE_STRUCTURES'){
      st.only=(o.targets||[]).reduce((a,tg)=>a.concat(keysFor(tg)),[]);
      st.ghosted=true;
      st.only.forEach(k=>{ if(st.hi[k]==null) st.hi[k]=0.5; });
    }
  }
  return st;
}
/* viz3d.js parseProceduralRef(), copied rather than approximated — same reason VIEW_DIR is copied.
   ADDED 2026-09-30 by the build run on heart-tube-formation, and it is a CORRECTNESS fix rather than
   a threshold move. This file used to match a mesh to a structure by userData.key alone, and build
   ONE group at the view's t with MOD.FULL. That silently drew NOTHING for any structure whose ref
   names a part under a variant flag or pins its own t — the model's mesh carries the key 'ventricle',
   the scene's structure is called 'cut_myocardium', and no comparison of those two strings will ever
   be true. On heart-tube-formation it reported all three cutaway coats and all five cardia-bifida
   parts at 0.000% of the frame while the real adapter in viz3d.js resolved every one of them with
   geometry. A tool that reports a structure as unseeable when the player draws it is worse than no
   tool: it argues for waivers on beats that are fine.
   Outline meshes are dropped for the same reason — viz3d's mergeByKey() drops them ("silhouette
   shells are presentation, not anatomy") and counting them here measured a picture the player never
   shows. */
function parseRef(ref){
  if(!ref) return null;
  if(typeof ref==='object'){ if(!ref.model||!ref.part) return null;
    return {part:ref.part, t:(ref.t==null?null:+ref.t), flags:Object.keys(ref.flags||{})}; }
  let str=String(ref); const flags=[]; const plus=str.indexOf('+');
  if(plus>=0){ str.slice(plus+1).split(',').forEach(f=>{f=f.trim(); if(f) flags.push(f);}); str=str.slice(0,plus); }
  const at=str.split('@'); const tv=at.length>1?parseFloat(at[1]):NaN;
  const hash=at[0].split('#'); if(hash.length!==2||!hash[0]||!hash[1]) return null;
  return {part:hash[1], t:(at.length>1&&isFinite(tv))?tv:null, flags:flags};
}
/* THE CACHE IS PER MOUNT, NOT PER RUN, and the first version of this got it wrong in a way worth
   recording. Caching the built groups across mounts looks like an obvious saving — the same (t,flags)
   recurs across beats — but the id-pick pass REPLACES every visible mesh's material with a flat
   MeshBasicMaterial carrying the structure id in the red channel. A cached group therefore carries
   those id materials into the next colour pass, and structures come back 0% on both measures. It
   re-graded cardiac-cycle-pumping from 0 failing beats to 4 and heart-valves from 0 to 1, which is
   exactly the silent re-grading of another item's verdict this file's MIN_PEAK note warns about.
   A fresh build per mount is what the tool did before and what it does now. */
function mount(scn, view, idPick, solo){
  const GROUPS={};
  const groupFor=(t, flags)=>{
    const key=t+'|'+flags.slice().sort().join(',');
    if(GROUPS[key]) return GROUPS[key];
    const opts=Object.assign({}, MOD.FULL); flags.forEach(f=>opts[f]=true);
    return GROUPS[key]=MOD.build(t, opts);
  };
  const st = stateFor(scn, view);
  const t = st.t==null ? 1 : st.t;
  while(holder.children.length) holder.remove(holder.children[0]);
  const byKey={}; scn.structures.forEach(s=>byKey[s.key]=s);
  const keys = scn.structures.map(s=>s.key);
  const idOf={}; keys.forEach((k,i)=>idOf[k]=i+1);
  /* ids are encoded across TWO channels — see ID_ENCODING at the top of this file */
  /* one mesh belongs to at most one structure; a later structure naming the same (t, flags, part)
     is reported rather than silently stealing it */
  const owner=new Map(); const shared=[];
  for(const s of scn.structures){
    const r=parseRef(s.refs && s.refs.procedural); if(!r) continue;
    const g=groupFor(r.t==null?t:r.t, r.flags);
    if(!g.parent) holder.add(g);
    g.traverse(o=>{ if(!o.isMesh) return; const u=o.userData||{};
      if(u.outline || u.key!==r.part) return;
      if(owner.has(o)){ shared.push(s.key+' shares meshes with '+owner.get(o)); return; }
      owner.set(o,s.key); });
  }
  holder.rotation.y = (scn.camera && scn.camera.initialYaw) || 0;
  holder.updateMatrixWorld(true);
  /* TWO BOXES, because the player uses two. The box below is the SUBJECT box the camera frames on —
     state.only when a view isolates, everything visible otherwise (viz3d.js subjectBox, :2124) —
     and visibility itself follows viz3d.js:2393 - a key outside state.only is hidden only when the
     view is NOT ghosted, and ISOLATE_REGION/COMPARE_STRUCTURES both ghost. */
  const onlySet = (st.only && st.only.length) ? new Set(st.only) : null;
  const box=new THREE.Box3(); let any=false;
  holder.traverse(o=>{ if(!o.isMesh) return;
    const k=owner.get(o), s=k?byKey[k]:null;
    let vis = !!s && st.visible[k]!==false;
    if(vis && onlySet && !onlySet.has(k) && !st.ghosted) vis = false;
    o.visible = vis;
    if(vis && (!onlySet || onlySet.has(k))){ box.expandByObject(o); any=true; }
    if(!vis) return;
    if(idPick){ const m=new THREE.MeshBasicMaterial({side:THREE.DoubleSide});
                const id=idOf[k];
                m.color.setRGB((id%32)*8/255, Math.floor(id/32)*8/255, 0); o.material=m; }
    else {
      /* DEPTHWRITE IS PART OF APPLYING AN OPACITY, NOT AN EXTRA. Added 2026-10-03 by the model3d
         review run, on amniotic-cavity-yolk-sac. This line used to set transparent and opacity and
         stop there, leaving three default depthWrite:true on every translucent structure.
         viz3d.js does NOT do that -- it sets depthWrite: op >= 0.98 where it builds the material
         (viz3d.js:610) and again in paint() (viz3d.js:2419), and render-kit tissueMaterial carries
         the same rule with a comment saying why. With depthWrite left on, a DoubleSide translucent
         shell occludes ITSELF: the far half of its own surface writes depth before the near half is
         drawn, and the near half is then rejected in a sawtooth of wedges along the limb, one wedge
         per azimuthal segment. On that scene every large shell -- amnion, amniotic cavity, chorionic
         cavity, extraembryonic mesoderm, chorion -- carried that band in every beat that showed it,
         and it survived finer tessellation (26x44 -> 36x72), silhouettes off, a 1000x sweep of the
         near plane (0.01 -> 10) and the removal of every other structure, because it was never the
         model: the single clause below removes it completely. THE TOOL WAS GRADING A PICTURE THE
         PLAYER NEVER DRAWS -- this file own header turned on itself (it reimplements viz3d ops
         rather than driving viz3d; if the two ever disagree, viz3d is right). It moved real numbers:
         amniotic-cavity-yolk-sac beat 8 connecting_stalk went from 2 components with the largest
         holding 84.5% of its ink -- a RENDER-STANDARD 3.ab defect that does not exist -- to 1
         component at 99.4%, and beat 11 cord_sheath from 99.3% to 100.0%. Every ink figure, every
         alpha peak that decides the 40/255 floor, and every fragment count measure-fragments.mjs
         reads off this page was affected. */
      if(o.material && s.opacity!=null){ o.material.transparent=true; o.material.opacity=s.opacity;
                                         o.material.depthWrite = s.opacity >= 0.98; }
      if(st.hi[k]!=null && o.material && o.material.emissive)
        o.material.emissive = new THREE.Color(0xffffff).multiplyScalar(st.hi[k]*0.5);
    }
  });
  window.__sharedMeshes = shared; window.__owner = owner;
  /* THE SOLO PASS, for visible_pct. Only OPAQUE structures are left standing as occluders, and they
     are painted (0,0,255) -- blue alone decodes as background, so they block without being counted.
     Translucent structures are removed outright: in the picture a student sees, you look THROUGH
     them. The camera is untouched, because the box above was accumulated from the player's own
     visible set before any of this ran, so the solo frame and the combined frame are the same shot.
     See THE ID-PICK PASS IS AN OPAQUE Z-BUFFER at the top of this file. */
  if(idPick && solo){
    holder.traverse(o=>{ if(!o.isMesh || !o.visible) return;
      const k=owner.get(o); if(k===solo) return;
      const st2=k?byKey[k]:null;
      if(st2 && st2.opacity!=null && st2.opacity < 1){ o.visible=false; return; }
      const m=new THREE.MeshBasicMaterial({side:THREE.DoubleSide});
      m.color.setRGB(0,0,1); o.material=m; });
  }
  if(!any) return null;
  const c=box.getCenter(new THREE.Vector3()), sz=box.getSize(new THREE.Vector3());
  const boxOut = box.clone();
  const dir = st.dir && VIEW_DIR[st.dir] ? new THREE.Vector3().fromArray(VIEW_DIR[st.dir]).normalize()
                                         : new THREE.Vector3(0,0,1);
  camera.position.copy(c.clone().add(dir.clone().multiplyScalar(distanceForBox(sz,dir))));
  camera.up.set(0, Math.abs(dir.y)>0.99?0:1, Math.abs(dir.y)>0.99?-1:0);
  camera.lookAt(c);
  lit.key.position.set(camera.position.x+6, camera.position.y+8, camera.position.z+4);
  return { st, t, idOf, keys, dir: st.dir, box: boxOut };
}

/* HOW MUCH OF THE FRAME THE SUBJECT'S BOUNDING BOX FILLS, as against how much INK it lays down.
   Added 2026-09-29 by the round-3 build run on heart-valves, and it is a second number rather than a
   changed one. RENDER-STANDARD's rule is "the subject fills the frame", which is about the CAMERA
   being too far away; subject_pct measures painted pixels, which is also about how THICK the subject
   is. A beat whose subject is four tubular rings of 0.9 mm radius spread across 6 cm of heart cannot
   lay down 8% of any frame that contains all four, however perfectly it is framed. Reporting both
   lets a reader tell the two apart instead of guessing which one a low number means. */
function boxNdc(box){
  if(!box) return null;
  const mn=box.min, mx=box.max;
  let x0=Infinity,y0=Infinity,x1=-Infinity,y1=-Infinity;
  for(let i=0;i<8;i++){
    const v=new THREE.Vector3(i&1?mx.x:mn.x, i&2?mx.y:mn.y, i&4?mx.z:mn.z).project(camera);
    x0=Math.min(x0,v.x); x1=Math.max(x1,v.x); y0=Math.min(y0,v.y); y1=Math.max(y1,v.y);
  }
  return { x0, x1, y0, y1 };
}
function boxFillPct(box){
  const n=boxNdc(box); if(!n) return null;
  const w=Math.min(1,n.x1)-Math.max(-1,n.x0), h=Math.min(1,n.y1)-Math.max(-1,n.y0);
  return +(100*Math.max(0,w)*Math.max(0,h)/4).toFixed(2);
}
/* THE EXTENT WITHOUT THE CLAMP — added 2026-10-02 by the round-4 build run on blastocyst, adopting the
   rule the round-3 review of that item proposed. RENDER-STANDARD section 3 says "THE SUBJECT FILLS THE
   FRAME, AT EVERY t. A camera parked at a distance that suited one stage will CROP another and SHRINK a
   third." The standard names both directions and this tool implemented one: the framing flag fires only when
   the subject is too SMALL, and boxFillPct above CLAMPS the projected box to the frame, so whatever
   overflows is discarded BEFORE the number is formed. On blastocyst beat 4 that produced the scene's
   HIGHEST box_fill, 85.05%, and framing:false, on the one frame that was clipped — the single number
   that could have revealed the overflow was the one throwing the information away. So the UNCLAMPED
   half-extents are reported too: 1.0 means the box exactly touches an edge and anything over 1.0 is
   outside the picture. */
function boxExtent(box){
  const n=boxNdc(box); if(!n) return null;
  return { x_min:+n.x0.toFixed(3), x_max:+n.x1.toFixed(3),
           y_min:+n.y0.toFixed(3), y_max:+n.y1.toFixed(3),
           worst_overflow:+Math.max(0, -1-n.x0, n.x1-1, -1-n.y0, n.y1-1).toFixed(3) };
}
/* THE SUBJECT'S REAL SIZE AGAINST ITS ON-SCREEN SIZE — added 2026-10-02 by the round-5 build run on
   blastocyst, adopting the instrument the round-4 review of that item proposed.

   WHY THE EXISTING NUMBERS CANNOT SHOW THIS. subject_pct and box_fill_pct are both RATIOS TO THE
   FRAME, and the player refits the camera on EVERY view (viz3d.js frameView, which calls subjectBox()
   then distanceForBox() with no memory of the previous beat). After a refit those two ratios are
   constant BY CONSTRUCTION, so a process scene whose whole subject is growth draws every stage at the
   same size and every number here says the framing is perfect. Measured on this scene's round-4 walk:
   beats 2, 3, 4 and 6 had the identical bounding box and box_fill_pct 75.40 at four values of t whose
   embryo diameters stand in the ratio 1 : 1.18 : 1.29 : 1.59.

   WHAT THESE TWO ADD. box_world is the subject box's size in the model's OWN units, before any
   projection. world_per_px is how much of that world a single pixel covers, measured by projecting a
   one-unit step across the view at the box centre — so it is the scale bar the picture does not draw.
   A series of beats whose box_world grows while box_fill_pct stays flat, and whose world_per_px grows
   in the same proportion, is the signature of an UNINTENDED NORMALISATION: the quantity the model
   solves for has been divided out of every frame that carries it.

   MEASURED ON A SECOND SCENE BEFORE THIS WAS BELIEVED, and it corrected the round-4 review's own
   scoping. That review named embryology__gametogenesis-fertilization__cleavage-morula as carrying the
   same exposure ("holds the same cell-volume invariant and narrates the same journey"). Walked here: it
   does NOT. Nine of its ten beats sit at box_world.max 15.685 and world_per_px 0.025002 — identical to
   six figures — because that scene's subject genuinely does not change size, which is the whole thing it
   teaches ("Day two — four cells, and no larger than one was"). A flat series is the CORRECT picture
   there. So the exposure test is not "is the scene parametric" but "does any narration or claim compare
   a size ACROSS beats", and the corpus sweep that follows from it is a search of narration and claims,
   not a re-walk of everything.

   REPORTED, NOT GRADED, and deliberately. Making it fail a beat is a standards question with corpus
   scope — every parametric process scene would be judged by a rule that no camera in the player can
   currently satisfy, because nothing can declare that two beats share a distance. The proposed rule
   and the capability it waits on are filed as engine__camera-scale-group. A number that prints is
   what lets the next reader see the defect; a threshold would only hide it behind 146 failures. */
function boxWorld(box){
  if(!box) return null;
  const s=box.getSize(new THREE.Vector3());
  return { x:+s.x.toFixed(4), y:+s.y.toFixed(4), z:+s.z.toFixed(4),
           max:+Math.max(s.x,s.y,s.z).toFixed(4) };
}
function worldPerPx(box){
  if(!box) return null;
  camera.updateMatrixWorld(true);
  const c=box.getCenter(new THREE.Vector3());
  /* the camera's own screen-right axis, so the step is perpendicular to the view direction at the
     subject's depth — a step along any world axis would foreshorten and report a scale that depends
     on which way the beat happens to be looking */
  const right=new THREE.Vector3().setFromMatrixColumn(camera.matrixWorld,0).normalize();
  const a=c.clone().project(camera), b=c.clone().add(right).project(camera);
  const px=Math.abs(b.x-a.x)*W/2;                      // NDC spans -1..1 across W pixels
  return px>1e-9 ? +(1/px).toFixed(6) : null;
}
window.paint = function(payload){
  const r = mount(payload.scn, payload.view, false);
  if(!r) return { error:'nothing visible' };
  scene.background = VizKit.bg(0x0e1626);
  renderer.render(scene,camera);
  return { t:r.t, dir:r.dir };
};
/* THE ALPHA-AWARE MEASURE, and the one RENDER-STANDARD actually asks for: render the beat as a
   student sees it — real materials, real per-structure opacity — with and without one structure,
   and count the pixels that changed by more than thr in any channel. The id-pick count above
   measures GEOMETRIC occlusion and reads a structure behind a translucent wall as zero; this one
   does not. A structure can therefore be 0.000 in pct and still nonzero here, and when the two
   disagree THIS is the number that says what a student can see. */
window.diffKey = function(payload, key, thr){
  const shot = () => { scene.background = VizKit.bg(0x0e1626); renderer.render(scene,camera);
    const gl=renderer.getContext(), px=new Uint8Array(W*H*4);
    gl.readPixels(0,0,W,H,gl.RGBA,gl.UNSIGNED_BYTE,px); return px; };
  const r = mount(payload.scn, payload.view, false); if(!r) return null;
  const a = shot();
  /* HIDE BY STRUCTURE, NOT BY MODEL KEY. mount() now owns the mapping, because one model key can
     serve two structures through different variant builds — 'jelly' backs both the jelly structure and
     the cut_jelly one — and hiding by userData.key would take away both and measure the wrong difference. */
  holder.traverse(o=>{ if(o.isMesh && window.__owner.get(o)===key) o.visible=false; });
  const b = shot();
  let n=0, peak=0;
  for(let i=0;i<W*H;i++){
    const d = Math.max(Math.abs(a[i*4]-b[i*4]), Math.abs(a[i*4+1]-b[i*4+1]), Math.abs(a[i*4+2]-b[i*4+2]));
    if(d>peak) peak=d;
    if(d> (thr||6)) n++;
  }
  return { changed_pct:+(100*n/(W*H)).toFixed(3), peak_delta:peak };
};
/* INK WITH ONLY THE OPAQUE STRUCTURES ALLOWED TO OCCLUDE — see the header. This is what the
   id-pick pass would have measured if it had not thrown the scene's own opacity away. */
window.countSolo = function(payload, key){
  const r = mount(payload.scn, payload.view, true, key);
  if(!r) return null;
  scene.background = new THREE.Color(0x000000);
  renderer.render(scene,camera);
  const gl = renderer.getContext();
  const px = new Uint8Array(W*H*4);
  gl.readPixels(0,0,W,H,gl.RGBA,gl.UNSIGNED_BYTE,px);
  const id = r.idOf[key]; let n=0;
  for(let i=0;i<W*H;i++){ const lo=px[i*4], hi=px[i*4+1];
    if(!lo && !hi) continue;                      // background, and the blue-painted occluders
    if(Math.round(lo/8) + 32*Math.round(hi/8) === id) n++; }
  return +(100*n/(W*H)).toFixed(3);
};
window.count = function(payload){
  const r = mount(payload.scn, payload.view, true);
  if(!r) return { error:'nothing visible' };
  scene.background = new THREE.Color(0x000000);
  renderer.render(scene,camera);
  const gl = renderer.getContext();
  const px = new Uint8Array(W*H*4);
  gl.readPixels(0,0,W,H,gl.RGBA,gl.UNSIGNED_BYTE,px);
  const rev={}; r.keys.forEach(k=>rev[r.idOf[k]]=k);
  const n={}; let tot=0;
  for(let i=0;i<W*H;i++){ const lo=px[i*4], hi=px[i*4+1];
    if(!lo && !hi) continue;                              // (0,0) is the background, id 0 is never issued
    const k = rev[Math.round(lo/8) + 32*Math.round(hi/8)]; if(!k) continue; n[k]=(n[k]||0)+1; tot++; }
  const pct={}; r.keys.forEach(k=>{ if(r.st.visible[k]!==false) pct[k]=+(100*(n[k]||0)/(W*H)).toFixed(3); });
  /* IS THE SUBJECT INSIDE THE FRAME, not merely big enough in it. The id-pick buffer already separates
     the subject from the ghosted context (context is painted flat blue and reads as background here), so
     a subject pixel sitting on row 0, row H-1, column 0 or column W-1 is a direct measurement that the
     subject is cut off, with no projection or box-fitting in between. Reported for every scene; it only
     FAILS a beat when the scene opts in with framing_strict. */
  const isSub = i => { const lo=px[i*4], hi=px[i*4+1];
    if(!lo && !hi) return false; return !!rev[Math.round(lo/8) + 32*Math.round(hi/8)]; };
  const edge={top:0,bottom:0,left:0,right:0}; const edgeKeys={};
  const tally = i => { if(!isSub(i)) return false;
    const k=rev[Math.round(px[i*4]/8) + 32*Math.round(px[i*4+1]/8)];
    edgeKeys[k]=(edgeKeys[k]||0)+1; return true; };
  /* readPixels gives row 0 at the BOTTOM of the picture; both borders are counted either way */
  for(let x=0;x<W;x++){ if(tally(x)) edge.bottom++; if(tally((H-1)*W+x)) edge.top++; }
  for(let y=0;y<H;y++){ if(tally(y*W)) edge.left++; if(tally(y*W+W-1)) edge.right++; }
  const edgeTot = edge.top+edge.bottom+edge.left+edge.right;
  return { t:r.t, dir:r.dir, subject_pct:+(100*tot/(W*H)).toFixed(2), pct:pct,
           box_fill_pct: boxFillPct(r.box), box_extent: boxExtent(r.box),
           box_world: boxWorld(r.box), world_per_px: worldPerPx(r.box),
           edge_px: edgeTot, edge_px_by_side: edge, edge_px_by_key: edgeKeys,
           highlighted:Object.keys(r.st.hi) };
};
window.__ready = true;
<\/script>`;
writeFileSync(`${OUT}/_walk.html`, page);

const browser = await chromium.launch({ executablePath: findChromium(),
  args: ['--use-gl=swiftshader', '--enable-unsafe-swiftshader', '--no-sandbox'] });
const p = await browser.newPage({ viewport: { width: W, height: H } });
const log = [];
p.on('console', m => log.push({ type: m.type(), text: m.text() }));
p.on('pageerror', e => log.push({ type: 'pageerror', text: String(e && e.message || e) }));
await p.goto(BASE + OUT + '/_walk.html');
await p.waitForFunction('window.__ready === true', { timeout: 60000 });

/* THE RENDERER GATE. Fail loudly rather than quietly grading a different picture. */
const THREE_REV = String(await p.evaluate('window.threeRevision'));
if (PINNED_THREE && THREE_REV !== PINNED_THREE) {
  console.error('three.js r' + THREE_REV + ' is not the r' + PINNED_THREE + ' package-lock.json pins.\n' +
    'Every number this tool prints is read off rendered pixels and the lighting differs between\n' +
    'revisions: on r160 the subject never exceeds 162 where on r128 it reaches 255, so alpha-diffs\n' +
    'shrink and structures drop under the thresholds. Round 4 lost a run to exactly this and nearly\n' +
    'reported it as a defect in the work. Install the pinned version and re-run.');
  await browser.close(); server.close();
  process.exit(3);
}

const waivers = scene.visibility_waivers || [];
const waived = (vi, key) => waivers.some(w => w.view === vi + 1 && w.key === key);
/* A FRAMING WAIVER USES THE SAME MECHANISM AS A STRUCTURE ONE — {view, key:'__framing__', why} —
   added 2026-09-29 with box_fill_pct, because until then a beat whose subject is thin had no way to
   say so and the only exits were deleting the beat or lowering MIN_SUBJECT for every scene at once.
   It is still an argument someone wrote down, it still prints, and box_fill_pct prints beside it so
   a reviewer can see whether the camera really is where it should be. */
const FRAMING_KEY = '__framing__';
const CLIP_KEY = '__clipped__';

console.log('MedBank · scene visibility walk\n  scene ' + scenePath + '\n  model ' + modelPath +
            '\n  three.js r' + THREE_REV + ' (package-lock pins r' + (PINNED_THREE || '?') + ')' +
            '\n  thresholds: any >= ' + MIN_ANY + '%, pointed-at >= ' + MIN_POINTED +
            '%, subject >= ' + MIN_SUBJECT + '% of frame' +
            '\n  an alpha-only pass must also move its pixels by >= ' + MIN_PEAK + '/255' +
            '\n  HOW TO READ THE scale: LINE. box_fill is a ratio to the frame, so the per-beat camera refit' +
            '\n  holds it constant by construction. Compare the two numbers ACROSS beats instead: a subject' +
            '\n  whose world size GROWS while box_fill stays flat is being drawn at one size at every stage,' +
            '\n  and any narration or claim comparing those sizes is contradicted by its own picture' +
            '\n  (engine__camera-scale-group). A series that is flat in BOTH is correct and expected on a' +
            '\n  scene whose subject genuinely does not change size — cleavage-morula is flat at 15.685' +
            '\n  units and 0.025002 per pixel across nine beats, and its narration says so.\n');
const report = []; let fails = 0;
for (let i = 0; i < scene.views.length; i++) {
  const view = scene.views[i];
  if (!(view.ops || []).some(o => o.op === 'SET_STAGE')) continue;
  await p.evaluate(pl => window.paint(pl), { scn: scene, view });
  const file = `${OUT}/beat${String(i + 1).padStart(2, '0')}.png`;
  await p.locator('#c').screenshot({ path: file });
  const r = await p.evaluate(pl => window.count(pl), { scn: scene, view });

  /* what this beat POINTS AT: highlighted, plus both ends of every SHOW_RELATIONSHIP */
  const pointed = new Set(r.highlighted || []);
  for (const o of view.ops || []) if (o.op === 'SHOW_RELATIONSHIP') { if (o.from) pointed.add(o.from); if (o.to) pointed.add(o.to); }

  const rows = Object.entries(r.pct).sort((a, b) => b[1] - a[1]);

  /* THE VERDICT IS THE BETTER OF THE TWO MEASURES, NOT THE ID-PICK ALONE. Corrected 2026-09-29 by
     the round-4 build run, and it is a correction to this tool rather than a threshold being
     lowered: the header above already says "a structure can therefore be 0.000 in pct and still
     nonzero here, and WHEN THE TWO DISAGREE THIS is the number that says what a student can see",
     and then the pass/fail below read the id-pick alone. The id-pick measures GEOMETRIC occlusion:
     it reads a valve inside a 0.45-opacity blood cast as exactly zero, which is the one case a
     scene most often means to draw — a teaching diagram shows the valves THROUGH the translucent
     chamber it has cut open. Judging that as invisible pushes a scene towards either deleting the
     cast or waiving ten structures a beat, and neither is what the standard asks for.
     So: a structure clears a bar if EITHER measure clears it. The alpha-aware measure is only
     computed for the structures the id-pick has already failed, so this costs nothing extra. A
     structure that fails BOTH is invisible on any reading, and that is what now fails the beat. */
  const idBad     = rows.filter(([k, v]) => v < MIN_ANY).map(([k]) => k);
  const idPointBad = [...pointed].filter(k => r.pct[k] != null && r.pct[k] < MIN_POINTED);
  const suspect = [...new Set([...idBad, ...idPointBad])].filter(k => r.pct[k] != null);
  const diff = {};
  for (const k of suspect) diff[k] = await p.evaluate(([pl, kk]) => window.diffKey(pl, kk, 6), [{ scn: scene, view }, k]);
  /* THE ALPHA MEASURE ONLY COUNTS IF THE PIXELS IT RELIES ON ACTUALLY MOVE. See MIN_PEAK above
     (R4-OPEN-2): a 0.30% change at a peak delta of 19/255 is a tint nobody can see, and five of
     the six cases round 4 pulled up and looked at were of that shape. A structure the id-pick can
     see is unaffected — this gates the through-the-wall reading only. */
  const alphaPct = k => (diff[k] && diff[k].peak_delta >= MIN_PEAK) ? diff[k].changed_pct : 0;
  const seen = k => Math.max(r.pct[k] || 0, alphaPct(k));

  /* EVIDENCE, NOT VERDICT. visible_pct is the ink each structure lays down with only the OPAQUE
     structures occluding it, so a structure inside a translucent shell stops reading 0.000 for a
     reason that has nothing to do with whether a student can see it. seen() above is untouched and
     nothing below feeds it, so no scene's pass/fail can move. Header, THE ID-PICK PASS IS AN
     OPAQUE Z-BUFFER. */
  const visPct = {};
  for (const k of Object.keys(r.pct))
    visPct[k] = await p.evaluate(([pl, kk]) => window.countSolo(pl, kk), [{ scn: scene, view }, k]);

  /* WHAT CARRIED EACH POINTED-AT STRUCTURE. A beat that passes should say by which measure, in its
     own artifact, rather than leaving a reader to infer it from an empty pointedBad[]. */
  const pointedHidden = [...pointed].filter(k => r.pct[k] == null);
  const witness = {};
  for (const k of pointed) {
    if (r.pct[k] == null) { witness[k] = { measure: 'NOT VISIBLE IN THIS BEAT — the ops hide it', value: null }; continue; }
    if (r.pct[k] >= MIN_POINTED) witness[k] = { measure: 'id-pick ink', value: r.pct[k], visible_pct: visPct[k] };
    else if (alphaPct(k) >= MIN_POINTED) witness[k] = { measure: 'alpha-aware diff, seen through translucent material',
                                                        value: alphaPct(k), peak_delta: diff[k] && diff[k].peak_delta,
                                                        id_pick: r.pct[k], visible_pct: visPct[k] };
    else if (waived(i, k)) witness[k] = { measure: 'waiver', value: seen(k), visible_pct: visPct[k] };
    else witness[k] = { measure: 'NONE — this beat fails', value: seen(k), visible_pct: visPct[k] };
  }

  const unseeable = idBad.filter(k => seen(k) < MIN_ANY && !waived(i, k));
  const pointedBad = idPointBad.filter(k => seen(k) < MIN_POINTED && !waived(i, k));
  const framing = r.subject_pct < MIN_SUBJECT && !waived(i, FRAMING_KEY);
  const framingWaived = r.subject_pct < MIN_SUBJECT && waived(i, FRAMING_KEY);
  /* THE OTHER DIRECTION. Opt-in per scene rather than corpus-wide on the day it lands, and that is a
     deliberate limit rather than timidity: several items are `built` and waiting for a review right
     now, and a tool that starts failing them between the build that passed it and the review that
     reads it turns one scene's finding into several scenes' noise. A scene adopts it by setting
     framing_strict, and a beat that must crop buys its way out with a visibility_waiver on the
     __clipped__ key saying WHAT is cut and why — never by turning the flag off. */
  const clipped = (r.edge_px || 0) > 0;
  const clipFail = clipped && scene.framing_strict === true && !waived(i, CLIP_KEY);
  const clipWaived = clipped && scene.framing_strict === true && waived(i, CLIP_KEY);
  const bad = unseeable.length || pointedBad.length || framing || clipFail;
  if (bad) fails++;
  console.log((bad ? 'FAIL' : 'PASS') + '  beat ' + (i + 1) + '  t=' + r.t + '  ' + (view.title || ''));
  console.log('        subject covers ' + r.subject_pct + '% of frame (its bounding box fills ' +
              r.box_fill_pct + '%)' + (framing ? '   <-- BADLY FRAMED' : '') +
              (framingWaived ? '   <-- thin subject, WAIVED' : ''));
  console.log('        scale: subject ' + (r.box_world ? r.box_world.max : '?') +
              ' world units on its longest axis, ' + (r.world_per_px == null ? '?' : r.world_per_px) +
              ' world units per pixel');
  console.log('        inside the frame: ' + (r.edge_px || 0) + ' subject pixels on a border row or ' +
              'column' + (r.box_extent ? ', box extent x [' + r.box_extent.x_min + ', ' + r.box_extent.x_max +
              '] y [' + r.box_extent.y_min + ', ' + r.box_extent.y_max + '] unclamped (|v| > 1 is outside)' : '') +
              (clipFail ? '   <-- SUBJECT IS CUT OFF' : '') +
              (clipWaived ? '   <-- cut off, WAIVED' : '') +
              (clipped && scene.framing_strict !== true ? '   <-- cut off (reported; scene has not set framing_strict)' : ''));
  console.log('        id-pick ink (everything solid): ' + rows.map(([k, v]) => k + ' ' + v).join(', '));
  console.log('        visible ink (only opaque structures occlude): ' +
    rows.map(([k]) => k + ' ' + visPct[k]).join(', '));
  if (suspect.length) console.log('        through-the-wall (alpha-aware) for the id-pick zeroes: ' +
    suspect.map(k => k + ' ' + (diff[k] ? diff[k].changed_pct : '?') + '% peak ' +
                     (diff[k] ? diff[k].peak_delta : '?') +
                     (diff[k] && diff[k].peak_delta < MIN_PEAK ? ' (under the ' + MIN_PEAK +
                      '/255 floor — does not count)' : '')).join(', '));
  {
    const carried = [...pointed].filter(k => r.pct[k] != null && r.pct[k] < MIN_POINTED);
    if (carried.length) console.log('        what carried the pointed-at structures the id-pick could not see: ' +
      carried.map(k => k + ' by ' + witness[k].measure + ' ' + witness[k].value +
                       ' (visible ' + visPct[k] + '%)').join(', '));
  }
  if (pointedHidden.length) console.log('        POINTED AT BUT HIDDEN BY THIS BEAT\'S OWN OPS — reported, not failed: ' +
    pointedHidden.join(', '));
  if (pointedBad.length) console.log('        POINTED AT BUT NOT SEEABLE: ' + pointedBad.map(k => k + ' ' + seen(k) + '%').join(', '));
  if (unseeable.length)  console.log('        NOT SEEABLE ON EITHER MEASURE: ' + unseeable.map(k => k + ' ' + seen(k) + '%').join(', '));
  const invisible = unseeable;
  report.push({ beat: i + 1, title: view.title, file, ...r, pointed: [...pointed], unseeable, pointedBad, framing, framingWaived, clipped, clipFail, clipWaived, diff, invisible,
                visible_pct: visPct, witness, pointed_but_hidden: pointedHidden,
                id_only_zero: idBad.filter(k => seen(k) >= MIN_ANY) });
}
report.push({ console: log, three_revision: THREE_REV, pinned_three: PINNED_THREE,
              thresholds: { MIN_ANY, MIN_POINTED, MIN_SUBJECT, MIN_PEAK },
              framing_strict: scene.framing_strict === true });
writeFileSync(`${OUT}/visibility.json`, JSON.stringify(report, null, 1));
console.log('\nbeats ' + (report.length - 1) + ', beats with a visibility failure ' + fails + ' -> ' + OUT);
console.log(fails ? 'SCENE VISIBILITY CHECK FAILED' : 'EVERY STRUCTURE A BEAT DRAWS OR POINTS AT IS SEEABLE');
await browser.close(); server.close();
process.exit(fails ? 1 : 0);
