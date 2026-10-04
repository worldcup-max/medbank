import { readFileSync } from "fs";
import vm from "vm";
class V3{constructor(x=0,y=0,z=0){this.x=x;this.y=y;this.z=z}set(x,y,z){this.x=x;this.y=y;this.z=z;return this}copy(v){return this.set(v.x,v.y,v.z)}clone(){return new V3(this.x,this.y,this.z)}add(v){this.x+=v.x;this.y+=v.y;this.z+=v.z;return this}sub(v){this.x-=v.x;this.y-=v.y;this.z-=v.z;return this}subVectors(a,b){return this.set(a.x-b.x,a.y-b.y,a.z-b.z)}addScaledVector(v,s){this.x+=v.x*s;this.y+=v.y*s;this.z+=v.z*s;return this}multiplyScalar(s){this.x*=s;this.y*=s;this.z*=s;return this}negate(){return this.multiplyScalar(-1)}dot(v){return this.x*v.x+this.y*v.y+this.z*v.z}lengthSq(){return this.dot(this)}length(){return Math.sqrt(this.lengthSq())}normalize(){const l=this.length()||1;return this.multiplyScalar(1/l)}crossVectors(a,b){return this.set(a.y*b.z-a.z*b.y,a.z*b.x-a.x*b.z,a.x*b.y-a.y*b.x)}distanceTo(v){return Math.sqrt(this.distanceToSquared(v))}distanceToSquared(v){const dx=this.x-v.x,dy=this.y-v.y,dz=this.z-v.z;return dx*dx+dy*dy+dz*dz}lerp(v,a){this.x+=(v.x-this.x)*a;this.y+=(v.y-this.y)*a;this.z+=(v.z-this.z)*a;return this}}
const sandbox={window:{THREE:{Vector3:V3},VizKit:{}},console,Math,isFinite,Object,Array,JSON};
sandbox.globalThis=sandbox; vm.createContext(sandbox);
vm.runInContext(readFileSync("models3d/render-kit.js","utf8"),sandbox,{filename:"render-kit.js"});
vm.runInContext(readFileSync("models3d/fetal-circulation.js","utf8"),sandbox,{filename:"fc.js"});
const M=sandbox.window.MB3D_MODELS[Object.keys(sandbox.window.MB3D_MODELS)[0]];
const names=["sat.uv","sat.ivc","sat.svc","sat.aoa","sat.aod","sat.ra","sat.la","sat.lv","sat.rv","sat.pa","sat.pv","flow.da","flow.fo","flow.plac","flow.pulm","derived.pulmonary_share"];
for(const variant of ["","pda:","pfc:"]){
  console.log("=== variant: "+(variant||"plain")+"  at t=1");
  for(const n of names){
    try{ const v=M.claimMeasure(variant+n,1); console.log("   "+n.padEnd(24)+" "+(typeof v==="number"?v.toFixed(4):String(v))); }
    catch(e){ console.log("   "+n.padEnd(24)+" ERR "+e.message.slice(0,50)); }
  }
}
console.log("=== plain at t=0 (fetal)");
for(const n of names){ try{ console.log("   "+n.padEnd(24)+" "+M.claimMeasure(n,0).toFixed(4)); }catch(e){ console.log("   "+n.padEnd(24)+" ERR"); } }
