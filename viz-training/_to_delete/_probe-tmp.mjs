import * as THREE from 'three';
import { readFileSync } from 'fs'; import vm from 'vm';
const sb = { window: { THREE }, console, Math, isFinite, Object, Array, JSON, Float32Array, Set, Map, Number, String, Boolean, Error };
sb.globalThis = sb; vm.createContext(sb);
vm.runInContext(readFileSync('models3d/render-kit.js','utf8'), sb);
vm.runInContext(readFileSync('models3d/cardiac-cycle-pumping.js','utf8'), sb);
const M = sb.window.MB3D_MODELS['cardiac-cycle-pumping'];
function probe(t){
  const g = M.build(t, Object.assign({}, M.FULL, (process.env.INTACT?{intact:true}:{}))); g.updateMatrixWorld(true);
  const rows=[]; const nm=new THREE.Matrix3();
  g.traverse(o=>{ if(!o.isMesh||!o.geometry) return; const u=o.userData||{}; if(u.outline) return;
    const geo=o.geometry.index?o.geometry.toNonIndexed():o.geometry;
    const p=geo.attributes.position,n=geo.attributes.normal; if(!n) return;
    const hull=(o.geometry.userData&&o.geometry.userData.hullCount)||0;
    nm.getNormalMatrix(o.matrixWorld);
    const c=new THREE.Vector3(),v=new THREE.Vector3(),w=new THREE.Vector3();
    for(let i=0;i<p.count;i++) c.add(v.fromBufferAttribute(p,i).applyMatrix4(o.matrixWorld));
    c.divideScalar(p.count);
    let out=0,outHull=0;
    for(let i=0;i<p.count;i++){ v.fromBufferAttribute(p,i).applyMatrix4(o.matrixWorld).sub(c);
      w.fromBufferAttribute(n,i).applyMatrix3(nm).normalize(); if(v.dot(w)>0){out++; if(i<hull)outHull++;} }
    let agree=0,tris=0; const a1=new THREE.Vector3(),b1=new THREE.Vector3(),c1=new THREE.Vector3();
    const e1=new THREE.Vector3(),e2=new THREE.Vector3(),fn=new THREE.Vector3(),vn=new THREE.Vector3();
    for(let i=0;i+2<p.count;i+=3){ a1.fromBufferAttribute(p,i);b1.fromBufferAttribute(p,i+1);c1.fromBufferAttribute(p,i+2);
      fn.copy(e1.subVectors(b1,a1).cross(e2.subVectors(c1,a1))); if(fn.lengthSq()<1e-16) continue; fn.normalize();
      vn.set(0,0,0); for(let k=0;k<3;k++){const q=new THREE.Vector3().fromBufferAttribute(n,i+k); vn.add(q);}
      if(vn.lengthSq()<1e-16) continue; vn.normalize(); tris++; if(fn.dot(vn)>0) agree++; }
    rows.push({key:u.key,outward:out/p.count,hullVerts:hull,outwardHull:hull?outHull/hull:null,tris,winding:tris?agree/tris:null});
  });
  return rows;
}
for(const t of [0.35]){
  const rows=probe(t); const by={};
  for(const r of rows)(by[r.key]=by[r.key]||[]).push(r);
  console.log('--- t='+t+' ---');
  for(const k of Object.keys(by).sort()){ const rs=by[k];
    const oh=rs.map(r=>r.outwardHull).filter(x=>x!=null), ow=rs.map(r=>r.outward), wi=rs.map(r=>r.winding).filter(x=>x!=null);
    console.log('  ',k.padEnd(15),'hull',(oh.length?Math.min(...oh).toFixed(3)+'-'+Math.max(...oh).toFixed(3):'  n/a  '),
      ' whole',Math.min(...ow).toFixed(3)+'-'+Math.max(...ow).toFixed(3),
      ' wind',Math.min(...wi).toFixed(3)+'-'+Math.max(...wi).toFixed(3),'('+rs.length+')');
  }
}
