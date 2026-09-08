/* 01.5c — regression tests for topic-key acronym normalisation.
   The fix must MERGE "X (ACRONYM)" with "X", and must NOT merge anything else.
   Run: node qa/v18-tkey-normalisation.mjs                                        */
import { stripAcronym, retrieveCandidates, candidateFilter } from '../import-server/targets.mjs';

let pass=0, fail=0;
const t = (name, got, want) => {
  const ok = JSON.stringify(got)===JSON.stringify(want);
  ok ? pass++ : fail++;
  console.log((ok?'PASS':'FAIL')+' | '+name.padEnd(62)+' | got '+JSON.stringify(got)+(ok?'':' want '+JSON.stringify(want)));
};
const norm = s => stripAcronym(s).toLowerCase().replace(/[^a-z0-9]+/g,' ').trim();
const same = (a,b) => norm(a)===norm(b);

console.log('--- MUST MERGE (acronym is the initials of the preceding words) ---');
t('SIRS: the real production case', same('Systemic inflammatory response syndrome (SIRS)','Systemic Inflammatory Response Syndrome'), true);
t('SIRS: casing is irrelevant',      same('SYSTEMIC INFLAMMATORY RESPONSE SYNDROME (sirs)','Systemic inflammatory response syndrome'), true);
t('Tetralogy of Fallot (TOF) — initials skipping "of"', same('Tetralogy of Fallot (TOF)','Tetralogy of Fallot'), true);
t('Tetralogy of Fallot (TF) — initials of kept words',  same('Tetralogy of Fallot (TF)','Tetralogy of Fallot'), true);
t('Acute kidney injury (AKI)',       same('Acute kidney injury (AKI)','Acute Kidney Injury'), true);

console.log('\n--- MUST NOT MERGE (a false merge is worse than a duplicate) ---');
t('type 1 vs type 2 diabetes',       same('Diabetes mellitus (type 1)','Diabetes mellitus (type 2)'), false);
t('a qualifier is not an acronym',   same('Anaemia (severe)','Anaemia (mild)'), false);
t('non-matching acronym is kept',    same('Neonatal sepsis (XYZ)','Neonatal sepsis'), false);
t('digits in parens are kept',       same('Stage (2) hypertension','Stage hypertension'), false);
t('different topics stay different', same('Neonatal sepsis','Neonatal jaundice'), false);
t('early-onset stays distinct',      same('Early-onset neonatal sepsis','Neonatal sepsis'), false);

console.log('\n--- stripAcronym is a no-op where it should be ---');
t('plain topic untouched',           stripAcronym('Bronchiolitis'), 'Bronchiolitis');
t('mid-string parens untouched',     stripAcronym('Sepsis (SIRS) in neonates'), 'Sepsis (SIRS) in neonates');
t('empty input safe',                stripAcronym(''), '');
t('null input safe',                 stripAcronym(null), '');

console.log('\n--- retrieval now finds the SIRS twin (T1) ---');
const targets = [
  { target_id:'SIRS-DX-001', topic:'Systemic Inflammatory Response Syndrome', skill:'diagnosis',
    canonical_statement:'SIRS in neonates is defined by abnormalities in temperature, heart rate, respiratory rate and leukocyte count.', status:'active' },
  { target_id:'DM1-DX-001',  topic:'Diabetes mellitus (type 1)', skill:'diagnosis',
    canonical_statement:'Type 1 diabetes is diagnosed by hyperglycaemia with ketosis and autoantibodies.', status:'active' }
];
const proposedSirs = { topic:'Systemic inflammatory response syndrome (SIRS)', skill:'diagnosis',
  knowledge_statement:'In neonates, SIRS is defined by at least two of: abnormal temperature, tachycardia, tachypnea or abnormal leukocyte count.' };
const got = retrieveCandidates(proposedSirs, targets).map(c=>c.target_id+':'+c._tier);
t('SIRS proposal retrieves SIRS-DX-001 via T1', got.includes('SIRS-DX-001:T1'), true);
t('SIRS proposal does NOT retrieve the diabetes target', got.some(x=>x.startsWith('DM1')), false);

const proposedDm2 = { topic:'Diabetes mellitus (type 2)', skill:'diagnosis',
  knowledge_statement:'Type 2 diabetes is diagnosed by fasting hyperglycaemia without ketosis.' };
t('type 2 does NOT match the type 1 target', candidateFilter(proposedDm2, targets).length, 0);

console.log('\n'+pass+' passed, '+fail+' failed');
process.exit(fail ? 1 : 0);
