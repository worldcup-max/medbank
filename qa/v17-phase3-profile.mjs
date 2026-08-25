/* V1.7 Phase 3 — Reasoning Profile evidence-framework tests (pure). Proves the discipline BEFORE any narrative
   is built: what the data can legitimately say, at what threshold, and what must remain "insufficient".
   These pure functions become the profile's gating layer on approval. */
const MIN_EV=3, EV_MED=6, EV_HIGH=15, SEP=15;   // mirror SMART tiers

function profileTier(seen){ if(seen<MIN_EV) return 'insufficient'; if(seen<EV_MED) return 'tentative'; if(seen<EV_HIGH) return 'measured'; return 'confident'; }
function profileClaim(band){ const tier=profileTier(band.seen);
  if(tier==='insufficient') return { tier, n:band.seen, text:'not enough data yet (n='+band.seen+')' };
  const pct=Math.round(band.correct/band.seen*100);
  return { tier, pct, n:band.seen, text:pct+'% (n='+band.seen+')'+(tier==='tentative'?' — early':'') }; }
/* narrative fires ONLY on a measured/confident dimension clearly separated from the learner's own baseline.
   Always returns measured performance, never an ability judgment. */
function profileNarrative(dims, baselinePct){
  const elig=dims.filter(d=>['measured','confident'].includes(profileTier(d.band.seen)))
                 .map(d=>({ key:d.key, pct:Math.round(d.band.correct/d.band.seen*100), n:d.band.seen }))
                 .sort((a,b)=>a.pct-b.pct);
  if(!elig.length) return { ok:false, reason:'insufficient' };
  const w=elig[0];
  if(baselinePct - w.pct < SEP) return { ok:false, reason:'no clear pattern' };
  return { ok:true, key:w.key, pct:w.pct, n:w.n, baseline:baselinePct,
           text:'You scored '+w.pct+'% on '+w.key+' (n='+w.n+'), below your '+baselinePct+'% overall.' }; }

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

console.log('\n'+pass+' passed, '+fail+' failed');
console.log('NOTE: pure evidence-gating framework — consolidates into the profile view on approval. No narrative/UI built yet.');
process.exit(fail?1:0);
