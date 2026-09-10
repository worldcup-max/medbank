/* Canonical Topic Key — Section A (approved) ONLY. RETRIEVAL AID, NOT IDENTITY.
   canonicalTopicKey(name) returns a normalized key used to gather retrieval candidates across topic namespaces that
   should be searchable together. It NEVER changes a target's identity, merges targets, or writes anything — it is a
   pure string function. Removing/ignoring it restores raw-topic retrieval byte-for-byte (reversible).

   SCOPE = Section A of CANONICAL-TOPIC-MAP-PROPOSAL.md:
     - case-fold (all pure-case duplicates)
     - curated British→American clinical spelling stems (NOT blanket ae/oe — avoids thromboembolism-type false positives)
     - explicit aliases for the approved qualifier / synonym / plural entries ONLY
   Deliberately EXCLUDED (Section B, held): Neonatal Sepsis→Sepsis, Neonatal/Pediatric hematology→Hematology,
   Cor pulmonale→Pulmonary Hypertension, Mitral stenosis→…in pregnancy. There is NO generic "strip Pediatric/Neonatal"
   rule — only the two approved Pediatric aliases below — so Section B cannot be implemented by accident. */

// curated, word-boundary-safe UK→US clinical spelling stems (order-independent; each is a specific medical stem)
const SPELLING_RULES = [
  [/aemia/g,'emia'], [/aemic/g,'emic'], [/anaem/g,'anem'], [/ischaem/g,'ischem'], [/leukaem/g,'leukem'], [/leucaem/g,'leukem'],
  [/haem/g,'hem'], [/oedema/g,'edema'], [/oesophag/g,'esophag'], [/coeliac/g,'celiac'], [/foetal/g,'fetal'], [/foetus/g,'fetus'],
  [/diarrhoea/g,'diarrhea'], [/gonorrhoea/g,'gonorrhea'], [/oestrogen/g,'estrogen'], [/amoeb/g,'ameb'],
  [/paediatr/g,'pediatr'], [/\bpaed/g,'ped'], [/phaeo/g,'pheo'], [/gynaec/g,'gynec'], [/orthopaed/g,'orthoped'],
  [/aetiolog/g,'etiolog'], [/caesar/g,'cesar'], [/faec/g,'fec'], [/anaesth/g,'anesth'], [/apnoea/g,'apnea'], [/dyspnoea/g,'dyspnea'],
  [/tumour/g,'tumor'], [/colour/g,'color'], [/behaviour/g,'behavior']
];

// explicit approved aliases (applied AFTER case-fold + spelling). Keys are already lower-cased + spelling-normalized.
export const SECTION_A_ALIASES = {
  'pediatric pneumonia': 'pneumonia',
  'pediatric sickle cell disease': 'sickle cell disease',
  'primary aldosteronism': 'primary hyperaldosteronism',
  'febrile seizures': 'febrile seizure',
  'posterior urethral valves': 'posterior urethral valve'
};

function base(name){ return String(name==null?'':name).toLowerCase().replace(/\s+/g,' ').trim(); }   // case-fold + whitespace

export function canonicalTopicKey(name){
  let s = base(name);
  for(const [re,to] of SPELLING_RULES) s = s.replace(re,to);
  if(Object.prototype.hasOwnProperty.call(SECTION_A_ALIASES, s)) return SECTION_A_ALIASES[s];
  return s;
}
