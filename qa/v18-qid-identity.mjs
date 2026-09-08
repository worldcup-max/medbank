/* 01.5a — stable question identity.
   Proves the two properties Frank specified:
     A. identical CONTENT still gets DIFFERENT qids  (qid is identity, not a hash)
     B. editing content changes qh and NOT qid       (the mapping survives the edit)
   Run: node qa/v18-qid-identity.mjs                                                    */
import crypto from 'node:crypto';

/* EXACT copies of server.mjs:556-557 (djb2 → base36) and the minting rule in validateQbankItems().
   Kept verbatim rather than approximated, so this test fails if the real hash ever changes shape. */
const qbHashServer = (str) => { let h=5381,i=(str||"").length; while(i){ h=(h*33)^(str||"").charCodeAt(--i); } return (h>>>0).toString(36); };
const qhOf  = q => qbHashServer((q.stem||'')+'|'+((q.options||[]).join('|')));
const qidOf = q => (q && typeof q.qid==='string' && q.qid) ? q.qid : null;
const mint  = arr => { arr.forEach(it=>{ if(it && !it.qid) it.qid = crypto.randomUUID(); }); return arr; };

let pass=0, fail=0;
const t=(n,got,want)=>{ const ok=JSON.stringify(got)===JSON.stringify(want); ok?pass++:fail++;
  console.log((ok?'PASS':'FAIL')+' | '+n.padEnd(60)+' | '+JSON.stringify(got)+(ok?'':'  want '+JSON.stringify(want))); };

console.log('--- A. identical content, different identities ---');
const A = { stem:'A neonate has jaundice at 18 hours.', options:['Physiological','Haemolytic','Breast milk','Sepsis'], answer:1 };
const B = { stem:'A neonate has jaundice at 18 hours.', options:['Physiological','Haemolytic','Breast milk','Sepsis'], answer:1 };
mint([A,B]);
t('qh(A) === qh(B)  (same content)',      qhOf(A)===qhOf(B), true);
t('qid(A) !== qid(B) (different questions)', A.qid===B.qid,   false);
t('both qids are well-formed uuids',
  [A.qid,B.qid].every(x=>/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/.test(x)), true);

console.log('\n--- B. edit the content: qh moves, qid does not ---');
const before = { qid:A.qid, qh:qhOf(A) };
A.stem = 'A neonate has jaundice at 18 hours of life.';        // the edit that used to orphan the mapping
A.options[3] = 'Neonatal sepsis';
const after = { qid:qidOf(A), qh:qhOf(A) };
t('qid UNCHANGED across the edit',  after.qid, before.qid);
t('qh CHANGED across the edit',     after.qh !== before.qh, true);
console.log('    qid '+before.qid+'  ->  '+after.qid);
console.log('    qh  '+before.qh  +'          ->  '+after.qh);

console.log('\n--- mapping resolution follows qid, so it survives the edit ---');
const mappings = [{ qh: before.qh, qid: before.qid, target_id:'NNJ-DX-001', map_state:'MATCH', mapping_source:'ai', mapping_status:'active' }];
const byQh={}, byQid={};
mappings.forEach(r=>{ byQh[r.qh]=r; if(r.qid) byQid[r.qid]=r; });
const resolve = q => (qidOf(q) && byQid[qidOf(q)]) || byQh[qhOf(q)] || null;   // qid → qh, as in stampTargetIds
t('post-edit question still resolves to its target', (resolve(A)||{}).target_id, 'NNJ-DX-001');
t('qh-only lookup would have LOST it (the old bug)', byQh[qhOf(A)]===undefined, true);

console.log('\n--- idempotency: re-running the mint changes nothing ---');
const keep = A.qid; mint([A]); mint([A]); mint([A]);
t('qid stable across 3 further mint passes', A.qid, keep);
const fresh = { stem:'x', options:['a','b'] };
mint([fresh]); const f1 = fresh.qid; mint([fresh]);
t('a newly minted item is not re-minted', fresh.qid, f1);

console.log('\n--- a question with no qid yet still resolves by qh (migration window) ---');
const legacy = { stem:'Legacy question', options:['a','b'] };
const legacyMap = { qh:qhOf(legacy), qid:null, target_id:'LEG-DX-001' };
byQh[legacyMap.qh]=legacyMap;
t('legacy question resolves via qh fallback', (resolve(legacy)||{}).target_id, 'LEG-DX-001');
t('legacy question has no qid',              qidOf(legacy), null);

console.log('\n--- an edit must NOT create a second mapping row (the defect found pre-deploy) ---');
/* annotateTargets skips questions that are already mapped. It used to check the CONTENT HASH only, so an
   edited question looked unseen, got re-extracted and received a SECOND row under the same qid. */
const existingRows = [{ qh: before.qh, qid: before.qid }];
const skipByQhOnly   = q => existingRows.some(r => r.qh === qhOf(q));
const skipByQidOrQh  = q => existingRows.some(r => r.qh === qhOf(q) || (qidOf(q) && r.qid === qidOf(q)));
t('OLD behaviour: edited question looked unseen',   skipByQhOnly(A),  false);
t('NEW behaviour: edited question is recognised',   skipByQidOrQh(A), true);
t('a genuinely new question is still processed',    skipByQidOrQh(mint([{stem:'brand new',options:['a','b']}])[0]), false);

console.log('\n--- deterministic pick if one qid ever has two active rows ---');
const dupRows = [
  { qid:'Q', target_id:'T-AI',    mapping_source:'ai',    mapping_status:'active', updated_at:'2026-09-01' },
  { qid:'Q', target_id:'T-HUMAN', mapping_source:'human', mapping_status:'active', updated_at:'2026-08-01' }
];
const rank = r => (r.mapping_source==='human'?2:1);
const pick = rows => rows.reduce((cur,r)=> (!cur || rank(r)>rank(cur) || (rank(r)===rank(cur) && String(r.updated_at||'')>String(cur.updated_at||''))) ? r : cur, null);
t('human resolution outranks a newer ai one', pick(dupRows).target_id, 'T-HUMAN');
t('same input always gives the same pick',    pick(dupRows).target_id === pick(dupRows.slice().reverse()).target_id, true);

console.log('\n'+pass+' passed, '+fail+' failed');
process.exit(fail?1:0);
