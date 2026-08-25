/* WIRED extraction from app.html (tests the shipped gating layer) */
import { readFileSync } from 'node:fs';
const html=readFileSync('app.html','utf8');
function grab(name){ const re=new RegExp('function '+name+'\\s*\\('); const i=html.search(re); if(i<0)throw new Error('missing '+name);
  let j=html.indexOf('{',i),d=0,k=j; for(;k<html.length;k++){const c=html[k];if(c==='{')d++;else if(c==='}'){d--;if(!d){k++;break;}}} return html.slice(i,k); }
const SMART={MIN_EV:3,EV_MED:6,EV_HIGH:15};
function qbPct(b){ return b&&b.seen?Math.round(b.correct/b.seen*100):0; }
const RP_SEP=15;
const _f=new Function('SMART','qbPct','RP_SEP', grab('profileTier')+'\n'+grab('profileNarrative')+'\n return {profileTier, profileNarrative};')(SMART,qbPct,RP_SEP);
const profileTier=_f.profileTier, profileNarrative=_f.profileNarrative;
function profileClaim(band){ const tier=profileTier(band.seen); if(tier==='insufficient') return {tier,n:band.seen,text:'not enough data yet (n='+band.seen+')'}; const pct=qbPct(band); return {tier,pct,n:band.seen,text:pct+'% (n='+band.seen+')'+(tier==='tentative'?' — early':'')}; }

let pass=0, fail=0; const ok=(c,m)=>{ if(c)pass++; else{ fail++; console.log('  ✗ '+m); } };

// 1 tier boundaries
ok(profileTier(2)==='insufficient' && profileTier(3)==='tentative' && profileTier(6)==='measured' && profileTier(15)==='confident', 'R1 tier boundaries (2/3/6/15)');
// 2 claim under MIN_EV → insufficient, no %
{ const c=profileClaim({seen:2,correct:1}); ok(c.tier==='insufficient' && c.pct===undefined && /not enough/.test(c.text), 'R2 <MIN_EV → insufficient, no %'); }
// 3 claim at EV_MED → precise %
{ const c=profileClaim({seen:9,correct:5}); ok(c.tier==='measured' && c.pct===56 && /n=9/.test(c.text), 'R3 EV_MED → precise % with n'); }
// 4 narrative: all thin → none
{ const r=profileNarrative([{key:'Management',band:{seen:2,correct:0}},{key:'Diagnosis',band:{seen:1,correct:1}}], 70); ok(!r.ok && r.reason==='insufficient', 'R4 all thin → no narrative'); }
// 5 narrative: weakest not separated → none
{ const r=profileNarrative([{key:'Management',band:{seen:10,correct:7}},{key:'Diagnosis',band:{seen:10,correct:8}}], 76); ok(!r.ok && r.reason==='no clear pattern', 'R5 weakest not separated (70% vs 76% baseline) → no narrative'); }
// 6 narrative: weakest clearly below baseline AND measured → fires, descriptive
{ const r=profileNarrative([{key:'Management',band:{seen:12,correct:6}},{key:'Diagnosis',band:{seen:12,correct:10}}], 78);
  ok(r.ok && r.key==='Management' && r.pct===50 && /below your 78% overall/.test(r.text) && !/ability|weak reasoner/i.test(r.text), 'R6 separated+measured → descriptive narrative fires (no ability claim)'); }
// 7 combination cell n=1 → insufficient
ok(profileTier(1)==='insufficient', 'R7 combination cell (n=1) → insufficient (never a claim)');
// 8 no overreach: claim text never asserts ability
{ const c=profileClaim({seen:20,correct:8}); ok(!/ability|reasoner|intelligence/i.test(c.text) && /n=20/.test(c.text), 'R8 descriptive %, never an ability judgment'); }


// --- Frank's extra battery ---
// exactly-at-threshold: 3 (tentative), 6 (measured), 15 (confident)
ok(profileTier(3)==='tentative' && profileTier(6)==='measured' && profileTier(15)==='confident', 'X1 exact thresholds 3/6/15');
// baseline-separation boundary: exactly SEP below → fires; one under → no
{ const rAt=profileNarrative([{key:'Management',band:{seen:100,correct:65}}], 80);   // 65% vs 80 → gap 15 (= SEP) → fires
  ok(rAt.ok, 'X2 exactly SEP below baseline → narrative fires (65 vs 80)');
  const rU=profileNarrative([{key:'Management',band:{seen:100,correct:67}}], 80);        // 67% vs 80 → gap 13 (< SEP) → no fire
  ok(!rU.ok, 'X2 just under SEP → no narrative (67 vs 80)'); }
// language safety on the wired narrative text
{ const r=profileNarrative([{key:'Management',band:{seen:12,correct:6}}],80);
  ok(r.ok && !/(ability|reasoner|intelligence|you are weak|poor reasoning)/i.test(r.text) && /below your 80% overall/.test(r.text), 'X3 wired narrative is descriptive, no ability language'); }
// sparse: 0,1,2 all insufficient
ok(profileTier(0)==='insufficient' && profileTier(1)==='insufficient' && profileTier(2)==='insufficient', 'X4 sparse (0/1/2) insufficient');

console.log('\n'+pass+' passed, '+fail+' failed');
console.log('NOTE: pure evidence-gating framework — consolidates into the profile view on approval. No narrative/UI built yet.');
process.exit(fail?1:0);
