import * as THREE from 'three';
import { readFileSync } from 'fs'; import vm from 'vm';
const sb={window:{THREE},console,Math,isFinite,Object,Array,JSON,Float32Array,Set,Map,Number,String,Boolean,Error};
sb.globalThis=sb; vm.createContext(sb);
vm.runInContext(readFileSync('models3d/render-kit.js','utf8'),sb);
vm.runInContext(readFileSync('models3d/cardiac-cycle-pumping.js','utf8'),sb);
const M=sb.window.MB3D_MODELS['cardiac-cycle-pumping'];
// sample points inside lv_blood and test how many fall inside rv_blood, by raycasting
const g=M.build(0.208, Object.assign({},M.FULL)); g.updateMatrixWorld(true);
const meshes={}; g.traverse(o=>{ if(o.isMesh&&o.userData&&!o.userData.outline) (meshes[o.userData.key]=meshes[o.userData.key]||[]).push(o); });
const ray=new THREE.Raycaster(); ray.firstHitOnly=false;
function inside(pt, list){ // parity test along +x
  ray.set(pt, new THREE.Vector3(1,0,0)); ray.far=1e4;
  let n=0; for(const m of list){ n += ray.intersectObject(m,false).length; } return n%2===1;
}
const box=new THREE.Box3(); for(const m of meshes.lv_blood) box.expandByObject(m);
let tot=0, both=0;
for(let i=0;i<12;i++)for(let j=0;j<12;j++)for(let k=0;k<12;k++){
  const p=new THREE.Vector3(
    box.min.x+(box.max.x-box.min.x)*(i+0.5)/12,
    box.min.y+(box.max.y-box.min.y)*(j+0.5)/12,
    box.min.z+(box.max.z-box.min.z)*(k+0.5)/12);
  if(!inside(p,meshes.lv_blood)) continue;
  tot++; if(inside(p,meshes.rv_blood)) both++;
}
console.log('LV cavity sample points:',tot,' also inside RV cavity:',both,
  ' ->', (100*both/Math.max(1,tot)).toFixed(1)+'% interpenetration');
const HEART=['lv','rv','la','ra','septum'];
const hb=new THREE.Box3();
g.traverse(o=>{ if(o.isMesh&&o.userData&&HEART.indexOf(o.userData.key)>=0) hb.expandByObject(o); });
const hs=hb.getSize(new THREE.Vector3());
console.log('heart (chambers only) bbox cm: transverse(x)',hs.x.toFixed(1),' cranio-caudal(y)',hs.y.toFixed(1),' antero-post(z)',hs.z.toFixed(1));
console.log('   real heart, roughly: 8.5 transverse, 12 long axis, 6 deep');
for(const k of ['lv','rv','la','ra','septum','lv_blood','rv_blood']){
  const b2=new THREE.Box3();
  g.traverse(o=>{ if(o.isMesh&&o.userData&&o.userData.key===k&&!o.userData.outline) b2.expandByObject(o); });
  if(b2.isEmpty()) continue;
  console.log('  ',k.padEnd(10),'x ['+b2.min.x.toFixed(2)+','+b2.max.x.toFixed(2)+']  y ['+b2.min.y.toFixed(2)+','+b2.max.y.toFixed(2)+']  z ['+b2.min.z.toFixed(2)+','+b2.max.z.toFixed(2)+']');
}
const R=M.acceptance().geometry;
console.log('RV tube R ed/es cm', R.rv_tube_R_ed_cm.toFixed(2), R.rv_tube_R_es_cm.toFixed(2),
 ' path', R.rv_path_length_cm.toFixed(1), ' wall ed/es mm', R.rv_wall_ed_mm.toFixed(1), R.rv_wall_es_mm.toFixed(1),
 ' rv mass g', R.rv_mass_g.toFixed(0));
