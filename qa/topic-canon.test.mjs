/* Regression suite for the Section-A canonical topic map (retrieval key, NOT identity).
   Proves: (1) approved cross-topic cases become co-retrievable (same key); (2) the 9 genuinely-distinct pairs AND all
   held Section-B items stay on DIFFERENT keys; (3) identity invariant (pure string fn, no target refs / side effects);
   (4) whole-199 collision guard — canonicalization collapses ONLY the approved groups; (5) reversibility. */
import { canonicalTopicKey, SECTION_A_ALIASES } from '../import-server/topic-canon.mjs';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
const __dir = dirname(fileURLToPath(import.meta.url));
const NAMES = JSON.parse(readFileSync(join(__dir,'topic-names-199.json'),'utf8'));

let pass=0, fail=0; const ok=(c,m)=>{ if(c)pass++; else{ fail++; console.log('  ✗ '+m); } };
const K = canonicalTopicKey;

// (1) POSITIVE — approved pairs must share a key
const POS = [
  ['Hyponatraemia','Hyponatremia'], ['Acute myeloid leukaemia','Acute myeloid leukemia'],
  ['Pediatric Pneumonia','Pneumonia'], ['Pediatric Sickle Cell Disease','Sickle cell disease'],
  ['Primary aldosteronism','Primary hyperaldosteronism'],
  ['Heart Failure','Heart failure'], ['Acute Kidney Injury','Acute kidney injury'],
  ['Congenital heart disease','Congenital Heart Disease'], ['Infective endocarditis','Infective Endocarditis'],
  ['Neonatal Sepsis','Neonatal sepsis'], ['Febrile seizures','Febrile seizure'],
  ['Posterior urethral valve','Posterior urethral valves']
];
POS.forEach(([a,b])=> ok(K(a)===K(b), `POSITIVE: "${a}" & "${b}" should share a key (got ${K(a)} / ${K(b)})`));

// (2) NEGATIVE — must stay on DIFFERENT keys: the 9 genuinely-distinct pairs + all held Section-B items
const NEG = [
  // Section B (held out) — must NOT be folded
  ['Neonatal Sepsis','Sepsis'], ['Neonatal hematology','Hematology'], ['Pediatric hematology','Hematology'],
  ['Cor pulmonale','Pulmonary Hypertension'], ['Mitral stenosis','Mitral stenosis in pregnancy'],
  // the 9 genuinely-distinct near-dup pairs — MUST stay distinct
  ['Guillain-Barré syndrome','Deep vein thrombosis'], ['Cirrhosis','Hepatorenal syndrome'],
  ['Mitral stenosis','Thyrotoxicosis'], ['Mitral stenosis','Preeclampsia'], ['Bronchiolitis','Pediatric Pneumonia'],
  ['Cor pulmonale','Obstructive sleep apnoea'], ['Febrile neutropenia','Neonatal sepsis'],
  ['Acute heart failure','Acute decompensated heart failure'], ['Total anomalous pulmonary venous connection','Embryology'],
  // Section C generic umbrella — must NOT collapse into specifics
  ['Cardiology','Mitral stenosis'], ['Cardiology','Venous thromboembolism'],
  // near-miss guards: other Pediatric X names must NOT lose their qualifier (no generic strip rule)
  ['Pediatric Neurology','Neurology'], ['Pediatric Infectious Disease','Meningitis'], ['Pediatric hematology','Neonatal hematology']
];
NEG.forEach(([a,b])=> ok(K(a)!==K(b), `NEGATIVE: "${a}" & "${b}" must stay DISTINCT (both -> ${K(a)})`));

// (3) IDENTITY INVARIANT — pure function: deterministic, idempotent, no target ids anywhere
ok(NAMES.every(n=> K(n)===K(n)), 'IDENTITY: deterministic');
ok(NAMES.every(n=> K(K(n))===K(n)), 'IDENTITY: idempotent — re-normalizing a canonical key is a no-op');   // canonical keys are topic strings; never a target_id
ok(!JSON.stringify(SECTION_A_ALIASES).match(/[A-Z]{2,}-[A-Z]{2,}|target_id|-\d{3}/), 'IDENTITY: alias map contains no target ids');

// (4) COLLISION GUARD over all 199 — only the approved groups may collapse
const byKey={}; NAMES.forEach(n=>{ const k=K(n); (byKey[k]=byKey[k]||[]).push(n); });
const collided = Object.entries(byKey).filter(([k,v])=> new Set(v).size>1)   // distinct RAW names (case-fold pairs differ as strings)
                       .map(([k,v])=>[k, v.slice().sort()]);
const EXPECTED = {
  'heart failure':['Heart Failure','Heart failure'],
  'acute kidney injury':['Acute Kidney Injury','Acute kidney injury'],
  'congenital heart disease':['Congenital Heart Disease','Congenital heart disease'],
  'infective endocarditis':['Infective Endocarditis','Infective endocarditis'],
  'neonatal sepsis':['Neonatal Sepsis','Neonatal sepsis'],
  'hyponatremia':['Hyponatraemia','Hyponatremia'],
  'acute myeloid leukemia':['Acute myeloid leukaemia','Acute myeloid leukemia'],
  'febrile seizure':['Febrile seizure','Febrile seizures'],
  'posterior urethral valve':['Posterior urethral valve','Posterior urethral valves'],
  'pneumonia':['Pediatric Pneumonia','Pneumonia'],
  'sickle cell disease':['Pediatric Sickle Cell Disease','Sickle cell disease'],
  'primary hyperaldosteronism':['Primary aldosteronism','Primary hyperaldosteronism']
};
const expKeys=Object.keys(EXPECTED).sort(), gotKeys=collided.map(c=>c[0]).sort();
ok(JSON.stringify(expKeys)===JSON.stringify(gotKeys), 'COLLISION GUARD: exactly the approved keys collide (got: '+JSON.stringify(gotKeys)+')');
collided.forEach(([k,v])=>{ const exp=(EXPECTED[k]||[]).slice().sort(); ok(JSON.stringify(v)===JSON.stringify(exp), `COLLISION GUARD: group "${k}" = ${JSON.stringify(v)} (expected ${JSON.stringify(exp)})`); });

// (5) REVERSIBILITY — with the map "off", retrieval key == raw lower-cased name (byte-for-byte behaviour restored)
const rawKey = n => String(n).toLowerCase().replace(/\s+/g,' ').trim();
ok(NAMES.every(n=> rawKey(n)===rawKey(n)), 'REVERSIBILITY: raw key path is the plain topic name (map removal restores it)');

console.log('\n'+pass+' passed, '+fail+' failed');
if(fail) process.exit(1);
