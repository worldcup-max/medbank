/* Wiring-level boundary proof for the Section-A canonical topic key.
   Proves the ONLY effect of MEDBANK_TOPIC_CANON=on is to WIDEN the T2 candidate set in retrieveCandidates():
     - flag ON returns a SUPERSET of flag-OFF candidates (never removes one); the added ones are tier T2;
     - the approved alias (Pediatric Pneumonia↔Pneumonia) is what gets added; a distinct topic is NOT added;
     - identity decision (decide) and id minting (mintTargetId) are BYTE-IDENTICAL regardless of the flag;
     - flag OFF ⇒ t2TopicKey === tkey behaviour (reversibility). */
import { retrieveCandidates, decide, mintTargetId, t2TopicKey, topicCanonOn } from '../import-server/targets.mjs';

let pass=0, fail=0; const ok=(c,m)=>{ if(c)pass++; else{ fail++; console.log('  ✗ '+m); } };
const ids = arr => arr.map(c=>c.target_id).sort();

// targets: a Pneumonia target (different SKILL so T1 can't catch it) + an unrelated GBS target.
// statements deliberately share ~no >3-char tokens with the proposal so T3 (overlap>=0.40) does NOT retrieve them —
// isolating the effect to T2 topic matching.
const targets = [
  { target_id:'PNEUMO-DX-001', topic:'Pneumonia', skill:'diagnosis', status:'active',
    canonical_statement:'Streptococcus organism commonest cause lobar consolidation radiograph' },
  { target_id:'GBS-MGMT-001', topic:'Guillain-Barré syndrome', skill:'management', status:'active',
    canonical_statement:'Autonomic instability bradycardia atropine dysautonomia' }
];
const proposed = { topic:'Pediatric Pneumonia', skill:'management',
  knowledge_statement:'Admit and begin intravenous therapy when saturations fall below ninety two percent' };

process.env.MEDBANK_TOPIC_CANON='off';
ok(topicCanonOn()===false, 'flag OFF recognised');
ok(t2TopicKey('Pediatric Pneumonia') === t2TopicKey('Pediatric Pneumonia'), 'deterministic');
ok(t2TopicKey('Pediatric Pneumonia') !== t2TopicKey('Pneumonia'), 'OFF: Pediatric Pneumonia != Pneumonia (raw tkey)');
const off = retrieveCandidates(proposed, targets);
ok(!ids(off).includes('PNEUMO-DX-001'), 'OFF: Pneumonia target NOT retrieved (no T1/T2/T3 path)');

process.env.MEDBANK_TOPIC_CANON='on';
ok(topicCanonOn()===true, 'flag ON recognised');
ok(t2TopicKey('Pediatric Pneumonia') === t2TopicKey('Pneumonia'), 'ON: Pediatric Pneumonia == Pneumonia (canonical)');
const on = retrieveCandidates(proposed, targets);
ok(ids(on).includes('PNEUMO-DX-001'), 'ON: Pneumonia target IS retrieved via canonical T2');
const added = on.find(c=>c.target_id==='PNEUMO-DX-001');
ok(added && added._tier==='T2', 'ON: the added candidate is tier T2 (candidate expansion, not identity)');
ok(!ids(on).includes('GBS-MGMT-001'), 'ON: distinct topic (GBS) is NOT added — no over-retrieval');
// superset property: every OFF candidate is still present ON
ok(ids(off).every(id=>ids(on).includes(id)), 'ON is a SUPERSET of OFF (T2 only ADDS, never removes)');

// IDENTITY INVARIANT: decide() is byte-identical regardless of the flag (it never reads the key/flag)
const cands=[{target_id:'X-DX-001', topic:'Pneumonia', skill:'diagnosis', canonical_statement:'x', excludes:[], _tier:'T2'}];
const adj={ target_id:'X-DX-001', confidence:0.95, second_confidence:0 };
process.env.MEDBANK_TOPIC_CANON='off'; const dOff=JSON.stringify(decide(proposed,cands,adj));
process.env.MEDBANK_TOPIC_CANON='on';  const dOn =JSON.stringify(decide(proposed,cands,adj));
ok(dOff===dOn, 'IDENTITY: decide() output is byte-identical ON vs OFF (topic key never reaches identity)');

// MINT INVARIANT: mintTargetId uses the RAW topic — unchanged by the flag
process.env.MEDBANK_TOPIC_CANON='off'; const mOff=mintTargetId('Pediatric Pneumonia','management',[]);
process.env.MEDBANK_TOPIC_CANON='on';  const mOn =mintTargetId('Pediatric Pneumonia','management',[]);
ok(mOff===mOn, 'MINT: mintTargetId byte-identical ON vs OFF (uses raw topic, not the canonical key)');

process.env.MEDBANK_TOPIC_CANON='off';   // leave off
console.log('\n'+pass+' passed, '+fail+' failed');
if(fail) process.exit(1);
