/* Replay the scene's ops to get each beat's ACTUAL visible set and camera, then id-pick exactly that.
 * The point of the whole exercise: a number measured on any other composition is not about a beat. */
import { readFileSync, writeFileSync } from 'fs';
const s = JSON.parse(readFileSync('viz-training/scenes/gross__heart-pericardium__heart-external.json','utf8'));
const keys = s.structures.map(x=>x.key);
const groups={}; s.structures.forEach(x=>{(groups[x.group]=groups[x.group]||[]).push(x.key)});
const layerOf={}; s.structures.forEach(x=>layerOf[x.key]=x.layer);
const vis={}; keys.forEach(k=>vis[k]=true);
const beats=[];
s.views.forEach((v,i)=>{
  for(const o of v.ops){
    const exp = t => t==='*' ? keys.slice() : (groups[t]||[t]);
    if(o.op==='SHOW_STRUCTURE') exp(o.target).forEach(k=>vis[k]=true);
    if(o.op==='HIDE_STRUCTURE') exp(o.target).forEach(k=>vis[k]=false);
    if(o.op==='PEEL_LAYER') keys.forEach(k=>{ if(layerOf[k]===o.layer) vis[k]=false; });
  }
  const rot=(v.ops.find(o=>o.op==='ROTATE_TO_VIEW')||{}).view;
  const hi=v.ops.filter(o=>o.op==='HIGHLIGHT_STRUCTURE'||o.op==='COMPARE_STRUCTURES')
                .map(o=>o.target||(o.targets||[]).join('+')).join(',');
  const sect=v.ops.filter(o=>o.op==='CROSS_SECTION').map(o=>o.op+o.axis+o.offset).join(',');
  beats.push({ beat:i+1, view:rot||(beats.length?beats[beats.length-1].view:'anterior'),
               visible:keys.filter(k=>vis[k]), highlight:hi, section:sect });
});
/* A VIEW MUST CHANGE THE PICTURE — consecutive beats compared on visible set + highlight + rotation + section. */
const dup=[];
for(let i=1;i<beats.length;i++){
  const a=beats[i-1], b=beats[i];
  if(a.view===b.view && a.highlight===b.highlight && a.section===b.section &&
     a.visible.join('|')===b.visible.join('|')) dup.push(`${a.beat} and ${b.beat}`);
}
console.log('consecutive beats rendering the same frame:', dup.length?dup.join(', '):'none');
/* the opts each beat needs from the model, derived from what is visible */
const GATE={chambers:['ra','rv','la','lv'],surfaces:['surf_sternocostal','surf_diaphragmatic','surf_left_pulmonary'],
  borders:['border_right','border_left','border_inferior','border_superior'],
  sulci:['coronary_sulcus','ant_iv_sulcus','post_iv_sulcus'],poles:['apex','base'],
  pericardium:['pericardium_fibrous','pericardium_parietal_serous','pericardium_visceral_serous','pericardial_cavity'],
  context:['lung_r','lung_l','diaphragm','sternum','trachea_bronchi','oesophagus','desc_aorta'],
  nerves:['phrenic_r','phrenic_l'],
  vessels:['asc_aorta','aortic_arch','pulm_trunk','r_pa','l_pa','svc','ivc','pulm_veins_r','pulm_veins_l','lig_arteriosum'],
  auricles:['ra_auricle','la_auricle']};
const jobs=beats.map(b=>{
  const o={}; for(const g in GATE){ const on=GATE[g].some(k=>b.visible.includes(k));
    if(g==='vessels'||g==='auricles'){ if(!on) o[g]=false; } else if(on) o[g]=true; }
  return {name:'beat'+String(b.beat).padStart(2,'0'), view:b.view, opts:o, png:true,
          _visible:b.visible, _hi:b.highlight};
});
writeFileSync('/tmp/jobs_beats.json', JSON.stringify(jobs,null,1));
writeFileSync('viz-training/_review-2026-09-29/beats.json', JSON.stringify({beats,dup},null,1));
jobs.forEach(j=>console.log('  '+j.name+' '+String(j.view).padEnd(10)+JSON.stringify(j.opts)+'  hi='+j._hi));
