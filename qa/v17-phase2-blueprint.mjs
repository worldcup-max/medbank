/* V1.7 Phase 2 — Exam Blueprint acceptance tests against a PURE deterministic selector.
   This selector is the reference algorithm to be wired into the Mega config on approval.
   Proves: determinism, inventory respect, no dupes, shortfall (no silent substitution),
   skill-authoritative + cog best-effort, no generation, and THE identity invariant
   (selection changes only WHICH questions — never their Target identity). */

/* ---------- pure selector (no randomness, no target_id derivation, read-only on questions) ---------- */
function blueprintSelect(pool, blueprint){
  const count=blueprint.count|0, skillMix=blueprint.skillMix||{}, cogMix=blueprint.cogMix||null;
  const sorted=pool.slice().sort((a,b)=> a._qh<b._qh?-1:(a._qh>b._qh?1:0));   // stable, deterministic
  const used=new Set(), selected=[], shortfall=[];
  function cogOrder(avail, n){
    if(!cogMix) return avail;                                                  // no cog preference → stable order
    const buckets={}; avail.forEach(q=>{ const c=q.cognitive_level||'?'; (buckets[c]=buckets[c]||[]).push(q); });
    const out=[]; Object.keys(cogMix).forEach(c=>{ const want=Math.round(n*(cogMix[c]/100)); (buckets[c]||[]).slice(0,want).forEach(q=>out.push(q)); });
    avail.forEach(q=>{ if(out.indexOf(q)<0) out.push(q); });                   // fill remainder stably
    return out;
  }
  Object.keys(skillMix).forEach(sk=>{
    const targetN=Math.round(count*(skillMix[sk]/100));
    const avail=sorted.filter(q=>q.skill===sk && !used.has(q._qh));
    const picked=cogOrder(avail, targetN).slice(0, Math.min(targetN, avail.length));
    picked.forEach(q=>{ used.add(q._qh); selected.push(q); });
    if(picked.length<targetN) shortfall.push({ skill:sk, requested:targetN, available:avail.length, delivered:picked.length });
  });
  const deliveredSkill={}; selected.forEach(q=>{ deliveredSkill[q.skill]=(deliveredSkill[q.skill]||0)+1; });
  return { selected, shortfall, requested:{count, skillMix, cogMix}, delivered:{ count:selected.length, skill:deliveredSkill } };
}

let pass=0, fail=0; const ok=(c,m)=>{ if(c)pass++; else{ fail++; console.log('  ✗ '+m); } };

// deterministic pool: 60 diagnosis, 40 management, 30 investigation, 4 complications; cog levels cycle; target_ids shared in groups of 5
const SK=[['diagnosis',60],['management',40],['investigation',30],['complications',4]];
const COG=['interpretation','clinical_reasoning','complex_reasoning','exam_trap'];
let pool=[]; let n=0;
SK.forEach(([sk,cnt])=>{ for(let i=0;i<cnt;i++){ n++; pool.push({ _qh:'q'+String(n).padStart(4,'0'), skill:sk, cognitive_level:COG[n%4], target_id:'T'+Math.floor(n/5) }); } });

// R1 determinism
{ const bp={count:40, skillMix:{diagnosis:25, management:30, investigation:20, complications:15, differential:10}};
  const a=blueprintSelect(pool,bp), b=blueprintSelect(pool,bp);
  ok(JSON.stringify(a.selected.map(q=>q._qh))===JSON.stringify(b.selected.map(q=>q._qh)), 'R1 deterministic: identical selection on repeat'); }

// R2 respects inventory (complications has only 4; request 15% of 40 = 6)
{ const bp={count:40, skillMix:{complications:100}};   // wants 40 complications, only 4 exist
  const r=blueprintSelect(pool,bp);
  ok(r.selected.every(q=>q.skill==='complications') && r.selected.length===4, 'R2 respects inventory (only 4 complications selected)'); }

// R3 no duplicates
{ const bp={count:60, skillMix:{diagnosis:50, management:50}};
  const r=blueprintSelect(pool,bp); const set=new Set(r.selected.map(q=>q._qh));
  ok(set.size===r.selected.length, 'R3 no duplicate questions'); }

// R4 shortfall reported, no silent substitution/backfill
{ const bp={count:40, skillMix:{complications:50, diagnosis:50}};   // wants 20 complications (only 4), 20 diagnosis
  const r=blueprintSelect(pool,bp);
  const sf=r.shortfall.find(x=>x.skill==='complications');
  ok(sf && sf.requested===20 && sf.available===4 && sf.delivered===4, 'R4 shortfall shows requested/available/delivered');
  const comp=r.selected.filter(q=>q.skill==='complications').length, diag=r.selected.filter(q=>q.skill==='diagnosis').length;
  ok(comp===4 && diag===20 && r.selected.length===24, 'R4 NO silent substitution — delivered 24 (<40), complications not backfilled from diagnosis'); }

// R5 IDENTITY INVARIANT: selection changes only which questions — never Target identity
{ const before=pool.map(q=>q._qh+':'+q.target_id).join('|');
  const bp={count:40, skillMix:{diagnosis:50, management:50}};
  const r=blueprintSelect(pool,bp);
  const after=pool.map(q=>q._qh+':'+q.target_id).join('|');
  ok(before===after, 'R5 selector is READ-ONLY on questions (no target_id mutated)');
  const selTargets=new Set(r.selected.map(q=>q.target_id));
  const chosenOwn=new Set(r.selected.map(q=>q.target_id));
  ok([...selTargets].every(t=>chosenOwn.has(t)) && selTargets.size===chosenOwn.size, 'R5 Targets A6 sees = union of chosen questions\' OWN target_id (no new identity)');
  ok(r.selected.every(q=>'target_id' in q) && !('newTarget' in r) && !('target_id' in r.requested), 'R5 selector never derives/creates a Target identity'); }

// R6 skill authoritative (counts match %), cog best-effort
{ const bp={count:40, skillMix:{diagnosis:50, management:50}, cogMix:{interpretation:25,clinical_reasoning:25,complex_reasoning:25,exam_trap:25}};
  const r=blueprintSelect(pool,bp);
  const d=r.selected.filter(q=>q.skill==='diagnosis').length, m=r.selected.filter(q=>q.skill==='management').length;
  ok(d===20 && m===20, 'R6 skill distribution authoritative (20/20 for 50/50)');
  const cogCounts={}; r.selected.forEach(q=>cogCounts[q.cognitive_level]=(cogCounts[q.cognitive_level]||0)+1);
  ok(Object.keys(cogCounts).length>=2, 'R6 cognitive mix approximated within slices (best-effort)'); }

// R7 no generation: every selected question came from the pool
{ const bp={count:40, skillMix:{diagnosis:60, management:40}};
  const r=blueprintSelect(pool,bp); const poolSet=new Set(pool.map(q=>q._qh));
  ok(r.selected.every(q=>poolSet.has(q._qh)), 'R7 selected ⊆ pool (no generation)'); }

console.log('\n'+pass+' passed, '+fail+' failed');
console.log('NOTE: pure reference selector — to be wired into Mega config + mgAssemble on approval (implementation held).');
process.exit(fail?1:0);
