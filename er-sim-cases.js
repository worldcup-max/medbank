/* =====================================================================
 * ER Sim cases — original MedBank content for Nigerian clinical students.
 * Every patient is fictional. Every case must be reviewed by a clinician
 * before FEATURES.ER_SIM goes live (see ER-SIM.md for the review checklist).
 *
 * Case shape (er-sim.js reads it):
 *   id, title (the presenting complaint, never the diagnosis), setting phc|gh|th,
 *   level, tutorial?, patient{name,age,sex,ageYears,weight}, speaker, persona,
 *   arrival, triage, background (extra facts for the AI patient),
 *   vitals{hr,sbp,dbp,rr,spo2,temp,gcs,rbg},
 *   history[{id,q,a,key?,k?}]  k = extra words for the offline matcher
 *   exam{system: "finding" | {r:"finding", fixed:{problemId:"finding once fixed"}}}
 *   keyExam[systems], tests{testId: "result" | {r, fixed:{problemId:"result"}}}
 *   problems[{id, cue, drift{vital: change per 10 min}, fixedBy[actionIds], need?,
 *             onFix{vital: change}, over?, latent?, preventable?, wakeText?, fixText?}]
 *   triggers[{after:actionId, delay, problem, unless[]}], timers[{at, problem, unless[]}]
 *   critical[{label, any[], by?, pts}], good[{label, any[], pts}],
 *   harmful[{label, any[], unless?[], repeat?, pts(negative), why}]
 *   dx{options[{id,label}], correct[], close[]}, dispo{best[], ok[], harm[], why}
 *   responses{actionId: "what happens / what the person says"}, teaching[], refs[]
 * ===================================================================== */
window.ERSIM_CASES = [

/* ------------------------------------------------------------- 1 · tutorial */
{
  id:'fever-body-pains', title:'Fever and body pains', setting:'gh', level:'Beginner', tutorial:true,
  patient:{ name:'Chidi Okonkwo', age:'23', ageYears:23, sex:'male', weight:'68 kg' },
  speaker:'Chidi', persona:'A tired but chatty final-year engineering student. Speaks Nigerian English, answers clearly.',
  arrival:'Chidi walks in with his roommate. "Doctor, this fever has refused to go."',
  triage:'Triage nurse: alert, walking, febrile. Category: yellow.',
  background:'Lives in a hostel off campus. Mosquito net at home in the village, not in the hostel. No travel. No chronic illness. No allergies. Took paracetamol from a chemist yesterday.',
  vitals:{ hr:104, sbp:118, dbp:74, rr:18, spo2:98, temp:38.9, gcs:15, rbg:5.6 },
  history:[
    { id:'onset', q:'When did the fever start?', a:'Three days ago. It comes with cold and shivering, then I sweat.', key:true, k:'long days start begin' },
    { id:'headache', q:'Any headache or body pains?', a:'Yes, headache and my whole body is paining me, especially my joints.', key:true },
    { id:'vomit', q:'Any vomiting? Can you keep food down?', a:'I vomited once this morning, but I can drink water and I ate bread.', key:true, k:'eat drink food' },
    { id:'danger', q:'Any confusion, fits, dark urine, yellow eyes or breathlessness?', a:'No, none of that.', key:true, k:'convulsion seizure jaundice urine breath' },
    { id:'neck', q:'Any neck stiffness or pain looking at light?', a:'No. My neck is fine.', k:'photophobia' },
    { id:'cough', q:'Any cough, sore throat or diarrhoea?', a:'No cough, no diarrhoea.', k:'stool throat' },
    { id:'net', q:'Do you sleep under a mosquito net?', a:'Not in the hostel. There are plenty mosquitoes there.', key:true, k:'mosquito itn' },
    { id:'drugs', q:'Have you taken any medicine?', a:'Paracetamol from the chemist yesterday. It helped small.', k:'medication tablet chemist' },
    { id:'pmh', q:'Any medical problems or allergies?', a:'No medical problems, no allergies.', k:'allergy illness' }
  ],
  exam:{
    general:{ r:'Looks unwell but comfortable, hot to touch, not pale, not jaundiced, well hydrated.', fixed:{ fever:'Comfortable and sitting up. Not pale, not jaundiced, well hydrated.' } },
    airway:'Talking normally.',
    breathing:'Chest clear, no added sounds.',
    circulation:'Pulse regular, warm peripheries, capillary refill under 2 s.',
    abdomen:'Soft. Tip of the spleen just palpable. No liver enlargement.',
    neuro:'Fully alert. No neck stiffness. Kernig\'s sign negative.',
    skin:'No rash, no bleeding.'
  },
  keyExam:['general','abdomen','neuro'],
  tests:{
    mrdt:'POSITIVE (P. falciparum HRP2 band)',
    mp_film:'Plasmodium falciparum trophozoites seen, parasitaemia 0.6%. No schizonts.',
    pcv:'40%',
    fbc:'Hb 13.1 g/dL · WBC 6.2 ×10⁹/L · platelets 128 ×10⁹/L',
    rbg:'5.6 mmol/L'
  },
  problems:[
    { id:'fever', cue:'Feverish and shivering.', fixedBy:['paracetamol','cool'], onFix:{ temp:-1.6, hr:-14 }, over:30 },
    { id:'malaria', fixedBy:['act','artesunate'] }
  ],
  critical:[
    { label:'Confirmed malaria with a test before treating', any:['mrdt','mp_film'], pts:15, why:'WHO: test every suspected case before treating.' },
    { label:'Gave an oral ACT', any:['act'], pts:15 }
  ],
  good:[
    { label:'Treated the fever', any:['paracetamol','cool'], pts:5 }
  ],
  harmful:[
    { label:'Started antimalarials before any test result', any:['act','artesunate'], unless:['mrdt','mp_film'], pts:-5, why:'Testing first avoids treating every fever as malaria.' },
    { label:'Gave antibiotics with no sign of bacterial infection', any:['ceftriaxone'], pts:-3, why:'Unnecessary antibiotics drive resistance.' },
    { label:'Used injectable artesunate for uncomplicated malaria', any:['artesunate'], pts:-3, why:'He has no danger signs and can take oral drugs. Keep injectables for severe malaria.' }
  ],
  dx:{ options:[
    { id:'uncomplicated', label:'Uncomplicated falciparum malaria' },
    { id:'severe', label:'Severe malaria' },
    { id:'typhoid', label:'Typhoid (enteric) fever' },
    { id:'meningitis', label:'Bacterial meningitis' },
    { id:'viral', label:'Viral fever' },
    { id:'lassa', label:'Lassa fever' }
  ], correct:['uncomplicated'], close:['severe'] },
  dispo:{ best:['discharge'], ok:['admit_ward'], why:'No danger signs and able to take oral medicine: treat at home with an ACT and clear safety-net advice.' },
  responses:{
    act:'You write artemether–lumefantrine for 3 days and tell him to take each dose with some fatty food or milk.',
    call_senior:'Your senior says: "Confirm it, treat with an ACT, check for danger signs and send him home with advice."'
  },
  tutorialSteps:[
    { ask:['onset'], hint:'Start in the History tab. Ask when the fever started.' },
    { ask:['danger'], hint:'Ask about danger signs: confusion, fits, dark urine, yellow eyes, breathlessness. Their absence matters.' },
    { exam:['abdomen'], hint:'Open Examine and check the abdomen. In malaria you may feel the spleen.' },
    { act:['mrdt','mp_film'], hint:'Go to Tests and send a malaria RDT. Every action moves the clock on, so watch the timer.' },
    { act:['paracetamol','cool'], hint:'While the test runs, treat the fever under Treat → Drugs → Paracetamol.' },
    { act:['act'], hint:'When the result is back (see Results), give the oral ACT.' },
    { end:true, hint:'Open Decide, choose your diagnosis and where he goes, then hand over to see your score.' }
  ],
  teaching:[
    'Test before you treat: an RDT or blood film should confirm malaria before giving antimalarials.',
    'Uncomplicated malaria in Nigeria is treated with an oral ACT, first-line artemether–lumefantrine twice daily for 3 days, taken with fatty food.',
    'Look for danger signs that make it severe: impaired consciousness, convulsions, prostration, repeated vomiting, jaundice, dark urine, breathing difficulty, bleeding, or severe anaemia.',
    'Safety-net: return at once if he cannot keep the tablets down, becomes confused, or the fever is still there after 3 days.',
    'Prevention counts: an insecticide-treated net every night.'
  ],
  refs:['WHO Guidelines for Malaria (current edition)','Federal Ministry of Health, National Guidelines for Diagnosis and Treatment of Malaria']
},

/* -------------------------------------------- 2 · PHC fitting febrile child */
{
  id:'child-fever-fit', title:'A child with fever who is fitting', setting:'phc', level:'Core',
  patient:{ name:'Aisha Lawal', age:'3', ageYears:3, sex:'female', weight:'13 kg' },
  speaker:'Aisha\'s mother', persona:'Aisha\'s mother, frightened, speaks Hausa; a community health worker translates in short sentences. She answers what she is asked.',
  arrival:'A mother runs in carrying a limp child who is jerking. The CHEW translates: "She has been fitting since they left the house."',
  triage:'Emergency: child convulsing on arrival.',
  background:'Village 40 minutes away by motorbike. Child well until 2 days ago. Siblings well. Mother gave chemist paracetamol and a herbal drink. Child had no food today and vomited all drinks. Immunisations up to date per card.',
  vitals:{ hr:168, sbp:84, dbp:50, rr:44, spo2:90, temp:40.1, gcs:7, rbg:1.9 },
  history:[
    { id:'fitlen', q:'How long has she been fitting?', a:'It started at home about fifteen minutes ago. It has not stopped.', key:true, k:'convulsion seizure long minutes' },
    { id:'fever', q:'How long has she had fever?', a:'Two days. Very hot at night.', key:true, k:'hot days' },
    { id:'feeding', q:'Has she eaten or been able to drink today?', a:'Nothing today. Everything she drinks comes out again.', key:true, k:'eat drink food vomit vomiting' },
    { id:'before', q:'Has she ever fitted before?', a:'Never. This is the first time.', key:true, k:'previous before first epilepsy' },
    { id:'meds', q:'What medicine has she taken?', a:'Paracetamol from the chemist and a herb drink from her grandmother.', k:'drugs medication chemist herbs agbo' },
    { id:'net', q:'Does she sleep under a mosquito net?', a:'We have one, but it is torn.', k:'mosquito itn' },
    { id:'other', q:'Any cough, diarrhoea or rash?', a:'No cough. No diarrhoea. No rash.', k:'stool' },
    { id:'urine', q:'Has she passed urine today? What colour?', a:'Only a little this morning. It was dark.', k:'pee wee colour' },
    { id:'trauma', q:'Did she fall or hit her head?', a:'No, she did not fall.', k:'fall head injury' },
    { id:'imm', q:'Are her immunisations complete?', a:'Yes, the card is complete.', k:'vaccine immunization card' }
  ],
  exam:{
    general:{ r:'Floppy child, generalised jerking, very hot, pale palms.', fixed:{ seizure:'Post-ictal and drowsy, very pale, hot.' } },
    airway:{ r:'Frothy secretions in the mouth. Airway at risk while fitting.', fixed:{ seizure:'Airway clear with positioning. Snoring stops in the recovery position.' } },
    breathing:'RR 44, deep breathing, no crackles or wheeze.',
    circulation:'Pulse fast, capillary refill 3 s, cool hands, no murmur.',
    abdomen:'Soft. Spleen 3 cm below the costal margin.',
    neuro:{ r:'Generalised tonic-clonic seizure in progress. Pupils equal and reactive.', fixed:{ seizure:'No longer fitting. Responds to pain only. No neck stiffness. Pupils equal.' } },
    skin:'Marked palmar pallor. No rash, no jaundice.'
  },
  keyExam:['airway','neuro','abdomen','skin'],
  tests:{
    rbg:{ r:'1.9 mmol/L (34 mg/dL), LOW', fixed:{ hypo:'6.4 mmol/L' } },
    mrdt:'POSITIVE (P. falciparum)',
    pcv:'21%',
    urinalysis:'Unable to obtain: no urine passed yet.'
  },
  problems:[
    { id:'seizure', cue:'Still convulsing.', drift:{ spo2:-3, hr:2 }, fixedBy:['benzo'], onFix:{ spo2:4, hr:-14, gcs:2 }, fixText:'The jerking stops. She is post-ictal.' },
    { id:'hypo', drift:{ gcs:-0.8, rbg:-0.3 }, fixedBy:['dextrose10'], onFix:{ gcs:3, rbg:4.6 }, over:10, fixText:'After the dextrose she starts to move and moan.' },
    { id:'hypoxia', fixedBy:['o2_nasal','o2_mask'], onFix:{ spo2:5 } },
    { id:'fever', fixedBy:['paracetamol','cool'], onFix:{ temp:-1.4, hr:-10 }, over:30 },
    { id:'malaria', fixedBy:['artesunate','artesunate_pr'] }
  ],
  critical:[
    { label:'Stopped the fit with a benzodiazepine', any:['benzo'], by:10, pts:15 },
    { label:'Checked the blood glucose', any:['rbg'], by:10, pts:12 },
    { label:'Corrected hypoglycaemia with 10% dextrose', any:['dextrose10'], by:20, pts:15 },
    { label:'Gave artesunate (injectable, or rectal before referral)', any:['artesunate','artesunate_pr'], by:60, pts:12 }
  ],
  good:[
    { label:'Positioned and protected the airway', any:['position','suction'], pts:5 },
    { label:'Gave oxygen', any:['o2_nasal','o2_mask'], pts:4 },
    { label:'Confirmed malaria with an RDT', any:['mrdt'], pts:4 },
    { label:'Treated the fever', any:['paracetamol','cool'], pts:3 },
    { label:'Gave a pre-referral antibiotic (meningitis not excluded)', any:['ceftriaxone'], pts:3 }
  ],
  harmful:[
    { label:'Gave oral ACT to a fitting, vomiting child', any:['act'], pts:-10, why:'Severe malaria needs parenteral or rectal artesunate. She cannot swallow safely.' },
    { label:'More than two benzodiazepine doses', any:['benzo'], repeat:2, pts:-6, why:'After two doses, move to a second-line drug: repeated benzodiazepines cause respiratory depression.' }
  ],
  dx:{ options:[
    { id:'severe-malaria', label:'Severe malaria with convulsions and hypoglycaemia' },
    { id:'febrile', label:'Simple febrile seizure' },
    { id:'meningitis', label:'Bacterial meningitis' },
    { id:'epilepsy', label:'New-onset epilepsy' },
    { id:'sepsis', label:'Sepsis' },
    { id:'hypo-only', label:'Hypoglycaemia from not eating' }
  ], correct:['severe-malaria'], close:['meningitis','hypo-only'] },
  dispo:{ best:['refer'], harm:['discharge'], why:'A PHC cannot run IV artesunate doses, transfusion or overnight monitoring. Stabilise, give the first doses, and refer with a note.' },
  responses:{
    call_senior:'The officer-in-charge says: "Glucose, stop the fit, artesunate, then we refer to the General Hospital. I\'ll call for the ambulance."',
    notify_dsno:'Noted. Malaria is reportable through routine returns, but this child needs treatment and referral now.',
    benzo:'You give rectal diazepam 0.5 mg/kg.',
    dextrose10:'You give 65 mL of 10% dextrose (5 mL/kg) through the cannula.'
  },
  teaching:[
    'Check glucose in every fitting, drowsy or severely ill child. Hypoglycaemia is common in severe malaria and kills fast.',
    'Treat hypoglycaemia (under 2.5 mmol/L, or under 3 in a sick child) with 10% dextrose 5 mL/kg IV, then recheck.',
    'A fit lasting over 5 minutes needs a benzodiazepine. If it continues after two doses, give a second-line drug such as phenobarbital.',
    'Severe malaria is treated with IV or IM artesunate. Where injections cannot be given before referral, a single dose of rectal artesunate (10 mg/kg) saves lives.',
    'Refer with IV access, a glucose plan, the drugs given and the times, written down.'
  ],
  refs:['WHO Guidelines for Malaria','WHO Pocket Book of Hospital Care for Children (2nd ed.)','WHO Emergency Triage Assessment and Treatment (ETAT)']
},

/* ---------------------------------------------------- 3 · GH sickle cell ACS */
{
  id:'scd-chest-pain', title:'Chest pain and fast breathing in a teenager', setting:'gh', level:'Core',
  patient:{ name:'Tobi Adeyemi', age:'16', ageYears:16, sex:'female', weight:'42 kg' },
  speaker:'Tobi (her mother sometimes adds details)', persona:'A 16-year-old girl in pain who speaks in short phrases because she is breathless. Her mother is anxious and helpful.',
  arrival:'Tobi is wheeled in, holding her right side. Her mother says: "Her crisis started in her legs, now she can\'t breathe well."',
  triage:'Triage: tachypnoeic, SpO₂ 88% on air. Category: orange.',
  background:'Known HbSS, diagnosed age 1. Attends the haematology clinic. On folic acid and proguanil. Two admissions last year for painful crises. Baseline Hb about 7.5 g/dL. Never had a stroke. Last transfusion 2 years ago.',
  vitals:{ hr:122, sbp:110, dbp:68, rr:32, spo2:88, temp:38.6, gcs:15, rbg:6.0 },
  history:[
    { id:'pain', q:'Where is the pain and when did it start?', a:'My legs started paining me two days ago. This morning my right chest started. It hurts to breathe in.', key:true, k:'chest start began' },
    { id:'sickle', q:'Do you have sickle cell disease?', a:'Yes, I am SS.', key:true, k:'genotype ss sickle' },
    { id:'cough', q:'Any cough or fever?', a:'Cough since yesterday, and hot body.', key:true, k:'fever hot' },
    { id:'baseline', q:'What is your usual blood level (Hb or PCV)?', a:'(Mother) The clinic said her Hb is usually around seven and a half.', key:true, k:'pcv hb haemoglobin level' },
    { id:'analgesia', q:'What have you taken for the pain?', a:'Paracetamol and ibuprofen at home. It didn\'t help.', key:true, k:'drugs medicine painkiller' },
    { id:'meds', q:'What drugs do you take regularly?', a:'Folic acid and proguanil every day.', k:'routine daily' },
    { id:'transfusion', q:'Have you been transfused before?', a:'(Mother) Yes, twice. The last was two years ago. No reaction.', k:'blood' },
    { id:'neuro', q:'Any weakness, headache or problems speaking?', a:'No.', k:'stroke weakness speech' },
    { id:'urine', q:'Are you passing urine well? Any priapism or belly pain?', a:'Urine is fine. No belly pain.', k:'abdomen' }
  ],
  exam:{
    general:'Distressed, splinting the right chest, mildly jaundiced, pale.',
    airway:'Talking in short sentences.',
    breathing:'Reduced air entry and bronchial breathing at the right base, dull to percussion there.',
    circulation:'Tachycardic, soft flow murmur, capillary refill 2 s.',
    abdomen:'Liver edge 3 cm. Spleen not palpable.',
    neuro:'Alert, no focal deficit.',
    skin:'Scleral icterus. No leg ulcers.'
  },
  keyExam:['breathing','circulation','abdomen','neuro'],
  tests:{
    fbc:'Hb 5.6 g/dL (baseline 7.5) · WBC 22.1 ×10⁹/L · platelets 104 ×10⁹/L',
    pcv:'17%',
    cxr:'New consolidation in the right lower zone with a small effusion.',
    mrdt:'Negative',
    eucr:'Na 136 · K 4.3 · urea 4.0 · creatinine 54',
    gxm:'2 units crossmatched and ready',
    bcult:'Pending',
    ecg:'Sinus tachycardia',
    rbg:'6.0 mmol/L'
  },
  problems:[
    { id:'hypoxia', cue:'Breathing fast, SpO₂ low.', drift:{ spo2:-1.5, rr:1 }, fixedBy:['o2_nasal','o2_mask'], onFix:{ spo2:8, rr:-4 } },
    { id:'pain', cue:'Crying with pain.', drift:{ hr:1 }, fixedBy:['morphine'], onFix:{ hr:-12, rr:-4 }, fixText:'The pain settles. She can take deeper breaths.' },
    { id:'infection', fixedBy:['ceftriaxone'], onFix:{ temp:-0.8 }, over:60 },
    { id:'anaemia', drift:{ spo2:-0.4, hr:0.5 }, fixedBy:['blood'], onFix:{ hr:-8, spo2:2 }, over:30 }
  ],
  critical:[
    { label:'Gave oxygen for SpO₂ under 94%', any:['o2_nasal','o2_mask'], by:10, pts:12 },
    { label:'Gave strong (opioid) pain relief within 30 minutes', any:['morphine'], by:30, pts:12 },
    { label:'Got a chest X-ray', any:['cxr'], pts:8 },
    { label:'Started antibiotics', any:['ceftriaxone'], by:60, pts:10 },
    { label:'Transfused for a fall in Hb of 2 g/dL below baseline', any:['blood'], pts:10 }
  ],
  good:[
    { label:'Full blood count', any:['fbc','pcv'], pts:4 },
    { label:'Covered atypical organisms with a macrolide', any:['azithro'], pts:4 },
    { label:'Maintenance fluids (not boluses)', any:['maint'], pts:3 },
    { label:'Group and crossmatch', any:['gxm'], pts:3 },
    { label:'Called haematology / medicine', any:['consult_med','call_senior'], pts:3 }
  ],
  harmful:[
    { label:'Gave repeated fluid boluses', any:['ns_bolus'], pts:-5, why:'She isn\'t shocked. Over-hydration worsens lung injury in acute chest syndrome. Aim for maintenance.' },
    { label:'Gave furosemide', any:['furosemide'], pts:-3, why:'Dehydration promotes sickling. There was no fluid overload.' }
  ],
  dx:{ options:[
    { id:'acs', label:'Acute chest syndrome' },
    { id:'voc', label:'Vaso-occlusive (painful) crisis only' },
    { id:'cap', label:'Community-acquired pneumonia' },
    { id:'pe', label:'Pulmonary embolism' },
    { id:'sequestration', label:'Splenic sequestration crisis' },
    { id:'hf', label:'Heart failure from anaemia' }
  ], correct:['acs'], close:['cap','voc'] },
  dispo:{ best:['admit_hdu'], ok:['admit_ward'], harm:['discharge'], why:'Acute chest syndrome can worsen within hours. She needs close monitoring of oxygen, Hb and breathing, ideally in HDU.' },
  responses:{
    consult_med:'The medical registrar says: "Treat as acute chest syndrome. Oxygen, opioids, antibiotics with a macrolide, incentive spirometry, and transfuse to correct the anaemia. Bring her up to HDU."',
    call_senior:'Your senior asks: "What\'s her Hb against baseline? Has she had a chest X-ray? Don\'t drown her with fluids."',
    blood:'You transfuse 10 mL/kg of crossmatched red cells.'
  },
  teaching:[
    'Acute chest syndrome = a new infiltrate on chest X-ray plus fever, chest pain or respiratory symptoms in someone with sickle cell disease. It is a leading cause of death in SCD.',
    'Give oxygen to keep SpO₂ 94–98%. Hypoxia drives further sickling.',
    'Give opioid analgesia within 30 minutes of arrival and reassess often. Good pain control lets her breathe deeply and prevents atelectasis.',
    'Antibiotics should cover typical and atypical organisms: a cephalosporin plus a macrolide.',
    'Top-up transfusion if Hb falls more than about 2 g/dL below baseline. Exchange transfusion for severe or progressing ACS.',
    'Maintenance fluids only. Avoid over-hydration. Use incentive spirometry.'
  ],
  refs:['British Society for Haematology: Guideline on the management of acute chest syndrome in sickle cell disease','NICE CG143: Sickle cell disease, managing acute painful episodes in hospital']
},

/* ------------------------------------------------------ 4 · GH viper snakebite */
{
  id:'farm-snakebite', title:'Bitten on the foot at the farm', setting:'gh', level:'Core',
  patient:{ name:'Musa Ibrahim', age:'34', ageYears:34, sex:'male', weight:'70 kg' },
  speaker:'Musa (his brother sometimes speaks)', persona:'A groundnut farmer in pain and frightened, speaks Hausa-accented English. His brother brought him and helps.',
  arrival:'Musa limps in supported by his brother. A rope is tied tightly above his right knee. "A snake bite me in the farm."',
  triage:'Triage: snakebite, bleeding from the gums. Category: orange.',
  background:'Bitten at dusk 6 hours ago while harvesting groundnuts in north-eastern Nigeria. Saw a small brown snake with pale markings; it escaped. The family tied a rope, rubbed a black stone on the bite and gave a herbal drink. Travelled 3 hours to the hospital. No previous bites. No allergies. No medical problems.',
  vitals:{ hr:112, sbp:104, dbp:66, rr:20, spo2:97, temp:37.2, gcs:15, rbg:5.8 },
  history:[
    { id:'when', q:'When and where were you bitten?', a:'About six hours ago, at sunset, in my groundnut farm.', key:true, k:'time hours where' },
    { id:'snake', q:'What did the snake look like?', a:'Small, brown, with light marks on its back. It ran away.', key:true, k:'colour describe' },
    { id:'bleeding', q:'Any bleeding from anywhere?', a:'My gum is bleeding and my urine is red like tea.', key:true, k:'blood gums urine' },
    { id:'firstaid', q:'What was done before you came?', a:'My brother tied the rope and the herbalist put a black stone. They gave me a drink.', key:true, k:'tourniquet stone herbal treatment' },
    { id:'neuro', q:'Any drooping eyelids, double vision or trouble swallowing?', a:'No, my eyes are fine. I can swallow.', key:true, k:'ptosis eyes swallow breathing weakness' },
    { id:'pain', q:'How is the pain and swelling?', a:'Very painful. The swelling is climbing up my leg.', k:'swelling' },
    { id:'allergy', q:'Any allergies or previous antivenom?', a:'No allergy. I have never had antivenom.', k:'allergic' },
    { id:'tetanus', q:'When was your last tetanus injection?', a:'I don\'t remember ever having it.', k:'tetanus vaccine' }
  ],
  exam:{
    general:'Anxious, oozing blood from the gums.',
    airway:'Talking normally. No ptosis.',
    breathing:'Chest clear.',
    circulation:'Pulse 112, BP 104/66, capillary refill 2 s.',
    abdomen:'Soft, non-tender.',
    neuro:'No ptosis, no bulbar weakness, normal power.',
    skin:'Bruising around the bite. No blisters yet.',
    local:{ r:'Two fang marks on the top of the right foot, still oozing. Tender swelling to mid-calf. A tight rope is tied above the knee.', fixed:{ tourniquet:'Fang marks on the foot still oozing. Swelling to mid-calf. The rope has been removed.' } }
  },
  keyExam:['local','neuro','general'],
  tests:{
    wbct20:'UNCLOTTED at 20 minutes: venom-induced coagulopathy.',
    urinalysis:'Blood +++, protein +',
    fbc:'Hb 11.0 g/dL · WBC 13.2 ×10⁹/L · platelets 84 ×10⁹/L',
    eucr:'Na 137 · K 4.6 · urea 8.1 · creatinine 136',
    coag:'PT unclottable · aPTT unclottable',
    gxm:'2 units crossmatched',
    rbg:'5.8 mmol/L'
  },
  problems:[
    { id:'coagulopathy', cue:'Oozing blood from the gums and the bite.', drift:{ sbp:-2.5, hr:2 }, fixedBy:['antivenom'], onFix:{ sbp:10, hr:-10 }, over:30, fixText:'The oozing from the gums slows.' },
    { id:'tourniquet', cue:'A tight rope is still tied round the leg.', fixedBy:['remove_tourniquet'] },
    { id:'pain', fixedBy:['paracetamol','morphine'], onFix:{ hr:-6 } },
    { id:'reaction', latent:true, cue:'Itchy rash, wheeze and dropping BP after the antivenom.', wakeText:'Fifteen minutes into the antivenom he becomes itchy with hives, wheezes and his BP falls.',
      drift:{ sbp:-8, spo2:-3, hr:4 }, fixedBy:['adrenaline_im'], onFix:{ sbp:22, spo2:5, hr:-12 }, fixText:'The rash and wheeze settle after the adrenaline.' }
  ],
  triggers:[ { after:'antivenom', delay:15, problem:'reaction' } ],
  critical:[
    { label:'Did a 20-minute whole blood clotting test', any:['wbct20'], by:30, pts:12 },
    { label:'Gave antivenom for venom-induced coagulopathy', any:['antivenom'], by:60, pts:18 },
    { label:'Prepared for and treated an antivenom reaction', any:['adrenaline_im'], pts:10, why:'Early anaphylactic reactions to antivenom are common. Have adrenaline ready.' }
  ],
  good:[
    { label:'Removed the tight tourniquet safely', any:['remove_tourniquet'], pts:5 },
    { label:'Immobilised the limb', any:['immobilise'], pts:3 },
    { label:'IV access', any:['iv_access'], pts:3 },
    { label:'Had adrenaline drawn up before starting', any:['prep_anaphylaxis'], pts:4 },
    { label:'Tetanus prophylaxis', any:['tetanus'], pts:3 },
    { label:'Checked kidney function', any:['eucr'], pts:3 }
  ],
  harmful:[
    { label:'Applied a tourniquet', any:['tourniquet'], pts:-8, why:'Tight tourniquets cause ischaemia and gangrene and don\'t stop venom spreading.' },
    { label:'Cut or sucked the wound', any:['incise'], pts:-10, why:'Incision causes bleeding (worse with coagulopathy) and infection.' },
    { label:'Gave an NSAID or aspirin to a patient who is bleeding', any:['nsaid','aspirin'], pts:-8, why:'These worsen bleeding. Use paracetamol or an opioid.' },
    { label:'IM tetanus before the coagulopathy was reversed', any:['tetanus'], unless:['antivenom'], pts:-2, why:'IM injections cause haematomas when blood is not clotting. Give it after antivenom has restored clotting.' }
  ],
  dx:{ options:[
    { id:'viper', label:'Carpet viper (Echis) envenoming with venom-induced coagulopathy' },
    { id:'cobra', label:'Cobra (neurotoxic) envenoming' },
    { id:'dry', label:'Dry bite' },
    { id:'cellulitis', label:'Cellulitis' },
    { id:'dic-sepsis', label:'DIC from sepsis' },
    { id:'haemophilia', label:'Haemophilia' }
  ], correct:['viper'], close:[] },
  dispo:{ best:['admit_ward'], ok:['admit_hdu'], harm:['discharge'], why:'He needs a 20WBCT every 6 hours, more antivenom if still unclotted, and monitoring of the kidneys and limb.' },
  responses:{
    antivenom:'You start polyvalent antivenom IV over 30–60 minutes and watch him closely.',
    remove_tourniquet:'You loosen the rope slowly with antivenom ready, watching for any deterioration.',
    call_senior:'Your senior says: "Check the 20-minute clotting test. If it\'s unclotted, give antivenom with adrenaline ready. No tourniquets, no cutting, no NSAIDs."',
    consult_med:'Medicine says: "Admit after the first dose. Repeat the 20WBCT 6 hours after antivenom and give another dose if he\'s still unclotted. Watch his creatinine."'
  },
  teaching:[
    'In the northern Nigerian savanna the carpet viper (Echis ocellatus) causes most snakebite deaths, through bleeding from venom-induced coagulopathy.',
    'The 20-minute whole blood clotting test is the bedside test: 2 mL of blood in a clean, dry glass tube, left for 20 minutes. If it hasn\'t clotted, give antivenom.',
    'Give antivenom IV with adrenaline drawn up. Treat early reactions with IM adrenaline 0.5 mg, then an antihistamine and steroid.',
    'Repeat the 20WBCT 6 hours after antivenom and give another dose if it is still unclotted.',
    'No tourniquets, cutting, suction, black stones or herbal drinks. Immobilise the limb. Avoid NSAIDs and IM injections while the blood isn\'t clotting.'
  ],
  refs:['WHO Guidelines for the Prevention and Clinical Management of Snakebite in Africa','WHO Snakebite Envenoming strategy']
},

/* --------------------------------------------------------- 5 · GH eclampsia */
{
  id:'pregnant-fit', title:'A pregnant woman with headache who had a fit', setting:'gh', level:'Core',
  patient:{ name:'Blessing Eze', age:'24', ageYears:24, sex:'female', weight:'68 kg' },
  speaker:'Blessing\'s husband (Blessing is drowsy)', persona:'Her husband, worried, speaks Nigerian English. Blessing is drowsy and answers only simple questions.',
  arrival:'Her husband brings Blessing in a taxi. "She fell down and was shaking in the house. She is pregnant."',
  triage:'Triage: pregnant, post-convulsion, BP very high. Category: red.',
  background:'First pregnancy, about 35 weeks by dates. Booked at the PHC at 28 weeks; BP was normal then. Missed the last two clinic visits. No epilepsy, no diabetes. No medications except routine haematinics.',
  vitals:{ hr:98, sbp:172, dbp:116, rr:20, spo2:95, temp:36.9, gcs:13, rbg:5.1 },
  history:[
    { id:'fit', q:'What happened? How long did the fit last?', a:'She fell and was shaking all over for about two minutes, about thirty minutes ago. She bit her tongue.', key:true, k:'convulsion seizure shaking' },
    { id:'gest', q:'How many weeks pregnant is she? Is this her first?', a:'About eight months. Thirty-five weeks, the nurse said. It is our first.', key:true, k:'weeks gestation months first' },
    { id:'headache', q:'Has she had headache, blurred vision or upper belly pain?', a:'Headache for two days, and she said her eyes were not clear. She complained of pain here (points to the epigastrium).', key:true, k:'vision eyes epigastric' },
    { id:'swelling', q:'Any swelling of face, hands or legs?', a:'Her face and hands have been swelling this week.', k:'oedema' },
    { id:'epilepsy', q:'Has she ever had fits before?', a:'Never.', key:true, k:'epilepsy previous' },
    { id:'anc', q:'Has she been attending antenatal clinic? Any BP problems?', a:'She booked late at the health centre. BP was normal then. She missed the last two visits.', key:true, k:'antenatal clinic blood pressure' },
    { id:'baby', q:'Is the baby moving? Any bleeding or water breaking?', a:'(Blessing) The baby is moving. No bleeding, no water.', k:'fetal movement bleeding liquor' },
    { id:'meds', q:'Any medicines or allergies?', a:'Only the blood tonic from the clinic. No allergy.', k:'drugs allergy' }
  ],
  exam:{
    general:'Drowsy but rousable. Face and hands swollen. Tongue bitten.',
    airway:'Airway patent. Some blood-stained saliva.',
    breathing:'Chest clear. RR 20.',
    circulation:'BP 172/116 on repeat. Pulse 98, regular.',
    abdomen:'Mild epigastric tenderness.',
    neuro:'Drowsy (GCS 13). Brisk reflexes with 3 beats of ankle clonus. No focal deficit.',
    skin:'Pitting oedema to the knees.',
    obstetric:'Fundal height 34 cm, cephalic, 4/5 palpable. Uterus soft, no contractions. No vaginal bleeding.'
  },
  keyExam:['neuro','obstetric','circulation'],
  tests:{
    urinalysis:'Protein +++',
    fbc:'Hb 11.4 g/dL · WBC 10.8 ×10⁹/L · platelets 94 ×10⁹/L',
    lft:'ALT 182 · AST 214 · bilirubin 22',
    eucr:'Na 136 · K 4.0 · urea 5.8 · creatinine 98',
    coag:'PT 13 s · aPTT 32 s',
    fetal_heart:'FHR 146 bpm, regular',
    gxm:'2 units crossmatched',
    rbg:'5.1 mmol/L',
    mrdt:'Negative',
    upt:'Positive (known pregnancy)'
  },
  problems:[
    { id:'bp', cue:'Blood pressure dangerously high.', drift:{ sbp:1.5, dbp:1 }, fixedBy:['hydralazine','labetalol','nifedipine'], onFix:{ sbp:-26, dbp:-14 } },
    { id:'refit', latent:true, preventable:true, fixedBy:['mgso4'], cue:'Convulsing again.', wakeText:'She starts to convulse again.', drift:{ spo2:-5, hr:3 }, onFix:{ spo2:6, hr:-8 }, fixText:'The fit stops.' }
  ],
  timers:[ { at:14, problem:'refit', unless:['mgso4'] } ],
  critical:[
    { label:'Gave the magnesium sulphate loading dose', any:['mgso4'], by:15, pts:18 },
    { label:'Lowered the BP with an antihypertensive', any:['hydralazine','labetalol','nifedipine'], by:30, pts:12 },
    { label:'Called obstetrics', any:['consult_og'], by:30, pts:8 }
  ],
  good:[
    { label:'Left-lateral position and airway protection', any:['position','suction'], pts:4 },
    { label:'Oxygen', any:['o2_nasal','o2_mask'], pts:3 },
    { label:'Urinary catheter to monitor output on magnesium', any:['catheter'], pts:4 },
    { label:'Checked urine protein', any:['urinalysis'], pts:3 },
    { label:'Checked platelets and liver enzymes (HELLP)', any:['fbc','lft'], pts:3 },
    { label:'Checked the fetal heart', any:['fetal_heart'], pts:3 }
  ],
  harmful:[
    { label:'Gave ergometrine', any:['ergometrine'], pts:-10, why:'Ergometrine raises BP and is contraindicated in pre-eclampsia.' },
    { label:'Used diazepam instead of magnesium sulphate', any:['benzo'], unless:['mgso4'], pts:-5, why:'Magnesium sulphate prevents recurrent fits far better than diazepam in eclampsia.' },
    { label:'Gave furosemide', any:['furosemide'], pts:-4, why:'These women are often intravascularly dry. Diuretics are only for pulmonary oedema.' }
  ],
  dx:{ options:[
    { id:'eclampsia', label:'Eclampsia' },
    { id:'severe-pet', label:'Severe pre-eclampsia (no seizure)' },
    { id:'epilepsy', label:'Epilepsy in pregnancy' },
    { id:'cerebral-malaria', label:'Cerebral malaria' },
    { id:'meningitis', label:'Meningitis' },
    { id:'hypoglycaemia', label:'Hypoglycaemic seizure' }
  ], correct:['eclampsia'], close:['severe-pet'] },
  dispo:{ best:['admit_hdu'], ok:['theatre'], harm:['discharge','refer'], why:'Stabilise first (magnesium, BP control) in a high-dependency area on the labour ward, then deliver. Delivery is the cure, but not before she is stable.' },
  responses:{
    consult_og:'The O&G registrar says: "Load with magnesium now. Pritchard regimen. Get the BP under 160/110. Catheterise. Bloods for HELLP. We\'ll plan delivery once she\'s stable."',
    mgso4:'You give 4 g of 20% MgSO₄ IV over 5–10 minutes and 5 g of 50% MgSO₄ deep IM into each buttock.',
    call_senior:'Your senior says: "Magnesium first, then the BP. Then call O&G."'
  },
  teaching:[
    'Eclampsia = seizures in a woman with pre-eclampsia. It can happen before, during or after delivery.',
    'Magnesium sulphate is the drug of choice. Pritchard regimen (widely used in Nigeria): 4 g IV over 5–10 min plus 5 g IM into each buttock, then 5 g IM every 4 hours in alternate buttocks for 24 hours.',
    'Before each maintenance dose, check that the patellar reflex is present, RR is over 16 and urine output is over 30 mL/hour. The antidote is 10% calcium gluconate 10 mL IV.',
    'Treat severe hypertension (≥160/110) with hydralazine, labetalol or oral nifedipine.',
    'Delivery is the definitive treatment, once the mother is stable.'
  ],
  refs:['WHO recommendations for the prevention and treatment of pre-eclampsia and eclampsia','Federal Ministry of Health, National Guidelines on pre-eclampsia and eclampsia (task-shifting MgSO₄)']
},

/* ----------------------------------------------- 6 · TH okada chest trauma */
{
  id:'okada-crash', title:'Motorbike crash, struggling to breathe', setting:'th', level:'Advanced',
  patient:{ name:'Emeka Nwosu', age:'29', ageYears:29, sex:'male', weight:'75 kg' },
  speaker:'Emeka (very breathless)', persona:'A commercial motorcycle rider, very breathless, answers in one or two words. A bystander who brought him adds details.',
  arrival:'Emeka is carried in by bystanders. "Car jam his okada. He no fit breathe well."',
  triage:'Triage: trauma, RR 36, SpO₂ 84%. Category: red.',
  background:'Rider, no helmet. Hit by a car on the left side 40 minutes ago, thrown onto the road. No loss of consciousness reported. No medical problems. No allergies.',
  vitals:{ hr:134, sbp:86, dbp:58, rr:36, spo2:84, temp:36.4, gcs:14, rbg:6.4 },
  history:[
    { id:'mech', q:'What happened?', a:'(Bystander) A car hit his okada from the left. He fell on the road. Forty minutes ago.', key:true, k:'accident crash mechanism' },
    { id:'breath', q:'Is your breathing getting worse?', a:'Yes… worse… left side pain.', key:true, k:'breathing worse' },
    { id:'loc', q:'Did he lose consciousness?', a:'(Bystander) No, he was talking.', key:true, k:'unconscious head' },
    { id:'pain', q:'Where do you have pain?', a:'Left chest… very bad.', k:'pain hurt' },
    { id:'neck', q:'Any neck pain or numbness?', a:'No… neck fine.', k:'neck numb weakness' },
    { id:'ample', q:'Any allergies, medicines or illnesses? When did you last eat?', a:'None… ate in the morning.', k:'allergy meal medication' }
  ],
  exam:{
    general:'Distressed, sweating, sitting up.',
    airway:'Talking in single words. Airway patent.',
    breathing:{ r:'Trachea deviated to the RIGHT. LEFT chest barely moving, hyper-resonant, absent breath sounds. Surgical emphysema over the left chest.', fixed:{ tension:'Air hissed out on decompression. Breath sounds now present but reduced on the left. Trachea central.' } },
    circulation:{ r:'Weak, fast radial pulse. Neck veins distended. Capillary refill 4 s.', fixed:{ tension:'Pulse stronger. Neck veins no longer distended. Capillary refill 3 s.' } },
    abdomen:'Soft, not distended, non-tender.',
    neuro:'GCS 14 (confused). Pupils equal and reactive. Moves all limbs.',
    skin:'Abrasions and bruising over the left chest wall and left arm.'
  },
  keyExam:['airway','breathing','circulation','neuro'],
  tests:{
    cxr:{ r:'Large LEFT pneumothorax with mediastinal shift to the right. Fractured left ribs 4–6.', fixed:{ drain:'Left lung re-expanded with the drain in place. Fractured left ribs 4–6.', tension:'Partially re-expanded left lung after decompression. Fractured left ribs 4–6.' } },
    efast:{ r:'No lung sliding on the left. No free fluid in the abdomen. No pericardial fluid.', fixed:{ drain:'Lung sliding back on the left. No free fluid. No pericardial fluid.' } },
    abg:{ r:'pH 7.28 · PaO₂ 7.0 kPa · PaCO₂ 6.4 kPa · lactate 4.2', fixed:{ tension:'pH 7.34 · PaO₂ 11.2 kPa · PaCO₂ 5.4 kPa · lactate 2.8' } },
    fbc:'Hb 12.4 g/dL · WBC 14.0 ×10⁹/L · platelets 230 ×10⁹/L',
    gxm:'Group A RhD positive · 2 units crossmatched',
    ct_head:'No intracranial injury.',
    ecg:'Sinus tachycardia',
    rbg:'6.4 mmol/L'
  },
  problems:[
    { id:'tension', cue:'Getting more breathless, neck veins distended.', drift:{ spo2:-4, sbp:-6, hr:5, rr:1 }, fixedBy:['needle_decomp','chest_drain'], onFix:{ spo2:10, sbp:26, hr:-22, rr:-10 }, over:10, fixText:'There\'s a hiss of air. His colour and breathing improve.' },
    { id:'hypoxia', fixedBy:['o2_mask','o2_nasal'], onFix:{ spo2:4 } },
    { id:'bleed', drift:{ sbp:-0.8, hr:0.6 }, fixedBy:['blood','ns_bolus'], onFix:{ sbp:8, hr:-8 } },
    { id:'pain', fixedBy:['morphine'], onFix:{ hr:-6, rr:-3 } },
    { id:'reaccumulate', latent:true, preventable:true, cue:'Breathless again: the pneumothorax is re-accumulating.', wakeText:'His breathing worsens again. The cannula has kinked.', drift:{ spo2:-3, sbp:-4, hr:3 }, fixedBy:['chest_drain'], onFix:{ spo2:8, sbp:16, hr:-14 } },
    { id:'drain', latent:true, preventable:true, fixedBy:['chest_drain'] }
  ],
  triggers:[ { after:'needle_decomp', delay:25, problem:'reaccumulate', unless:['chest_drain'] } ],
  critical:[
    { label:'Gave high-flow oxygen', any:['o2_mask'], by:5, pts:8 },
    { label:'Needle-decompressed the tension pneumothorax', any:['needle_decomp','chest_drain'], by:10, pts:20 },
    { label:'Inserted a chest drain', any:['chest_drain'], by:45, pts:12 }
  ],
  good:[
    { label:'Protected the cervical spine', any:['cspine'], pts:4 },
    { label:'Two wide-bore cannulae and bloods', any:['iv_access'], pts:3 },
    { label:'Group and crossmatch', any:['gxm'], pts:3 },
    { label:'eFAST scan', any:['efast'], pts:3 },
    { label:'Analgesia for rib fractures', any:['morphine'], pts:3 },
    { label:'Called the trauma surgeons', any:['consult_surg'], pts:3 },
    { label:'Tetanus prophylaxis', any:['tetanus'], pts:2 }
  ],
  harmful:[
    { label:'Waited for a chest X-ray before decompressing', any:['cxr'], unless:['needle_decomp','chest_drain'], pts:-10, why:'Tension pneumothorax is a clinical diagnosis. Decompress first, X-ray later.' },
    { label:'Intubated and ventilated before decompressing', any:['intubate','bvm'], unless:['needle_decomp','chest_drain'], pts:-8, why:'Positive-pressure ventilation makes a tension pneumothorax worse fast.' }
  ],
  dx:{ options:[
    { id:'tension', label:'Left tension pneumothorax' },
    { id:'simple', label:'Simple pneumothorax' },
    { id:'haemothorax', label:'Massive haemothorax' },
    { id:'tamponade', label:'Cardiac tamponade' },
    { id:'flail', label:'Flail chest' },
    { id:'abdo-bleed', label:'Haemorrhagic shock from abdominal injury' }
  ], correct:['tension'], close:['simple'] },
  dispo:{ best:['admit_hdu'], ok:['admit_ward'], harm:['discharge'], why:'After the chest drain he needs close monitoring for re-accumulation, bleeding and rib-fracture pain.' },
  responses:{
    needle_decomp:'You insert a large-bore cannula into the left chest.',
    chest_drain:'You insert a 28F chest drain in the left 5th intercostal space, mid-axillary line. It bubbles and swings.',
    consult_surg:'The surgical registrar says: "Decompress now if you haven\'t, then put a drain in. I\'m coming down. Get a trauma series once he\'s stable."',
    call_senior:'Your senior says: "ABC. What\'s his trachea doing? If it\'s tension, decompress. Don\'t wait for the X-ray."'
  },
  teaching:[
    'Tension pneumothorax: respiratory distress, hypoxia, hypotension, tracheal deviation away from the affected side, absent breath sounds, hyper-resonance and distended neck veins.',
    'It is a clinical diagnosis. Decompress immediately. Do not wait for a chest X-ray.',
    'Needle decompression is a temporary fix. In adults ATLS now suggests the 4th–5th intercostal space at the mid-axillary line. Follow it with a chest drain.',
    'Work through the primary survey (ABCDE) with c-spine protection in every motorcycle crash.',
    'Positive-pressure ventilation before decompression can turn a pneumothorax into a fatal tension.'
  ],
  refs:['ATLS (Advanced Trauma Life Support) Student Course Manual, 10th ed.','Primary Trauma Care manual']
},

/* -------------------------------------------------------------- 7 · GH DKA */
{
  id:'diabetic-vomiting', title:'Vomiting and belly pain in a young diabetic', setting:'gh', level:'Core',
  patient:{ name:'Fatima Bello', age:'19', ageYears:19, sex:'female', weight:'52 kg' },
  speaker:'Fatima (her aunt adds details)', persona:'A 19-year-old student, drowsy and breathing deeply. Her aunt answers when Fatima is too tired.',
  arrival:'Fatima\'s aunt helps her in. "She has been vomiting since yesterday. She has sugar disease."',
  triage:'Triage: drowsy, deep rapid breathing, glucometer reads HI. Category: orange.',
  background:'Type 1 diabetes since age 12 on twice-daily premixed insulin. Ran out of insulin 3 days ago because of the cost and couldn\'t buy more. Thirst and passing a lot of urine for 3 days. Vomiting since yesterday. No fever. Last menstrual period 2 weeks ago.',
  vitals:{ hr:128, sbp:92, dbp:58, rr:32, spo2:98, temp:37.4, gcs:14, rbg:33 },
  history:[
    { id:'dm', q:'Do you have diabetes? What insulin do you use?', a:'Type 1 since I was twelve. Mixtard, morning and night.', key:true, k:'diabetes insulin sugar' },
    { id:'missed', q:'Have you missed any insulin doses?', a:'(Aunt) The insulin finished three days ago. We didn\'t have money to buy another.', key:true, k:'doses missed run out' },
    { id:'symptoms', q:'Thirst, passing a lot of urine, weight loss?', a:'Very thirsty. I\'ve been urinating all the time.', key:true, k:'thirst polyuria urine' },
    { id:'vomit', q:'How much vomiting? Any abdominal pain?', a:'Many times since yesterday. My belly is paining me all over.', key:true, k:'vomiting abdomen belly pain' },
    { id:'infection', q:'Any fever, cough, burning urine or other infection?', a:'No fever, no cough. No burning urine.', key:true, k:'fever cough infection dysuria' },
    { id:'lmp', q:'When was your last period? Could you be pregnant?', a:'Two weeks ago. I\'m not pregnant.', k:'period menstrual pregnant' },
    { id:'previous', q:'Have you had this before?', a:'Once, when I was first diagnosed.', k:'before previous dka' }
  ],
  exam:{
    general:'Drowsy, dry mouth, sunken eyes, sweet fruity smell on the breath.',
    airway:'Airway patent.',
    breathing:'Deep, sighing (Kussmaul) breathing. Chest clear.',
    circulation:{ r:'Pulse 128, weak. Capillary refill 3 s. Cool peripheries.', fixed:{ dehydration:'Pulse slower and stronger. Capillary refill 2 s.' } },
    abdomen:'Diffusely tender, no guarding, bowel sounds present.',
    neuro:'GCS 14, drowsy but oriented.',
    skin:'Reduced skin turgor. No injection-site infection.'
  },
  keyExam:['general','breathing','circulation','abdomen'],
  tests:{
    rbg:{ r:'HI (above 33 mmol/L)', fixed:{ ketoacidosis:'19.6 mmol/L and falling' } },
    urinalysis:'Glucose ++++ · ketones +++ · no nitrites or leucocytes',
    vbg:{ r:'pH 7.06 · HCO₃ 6 · lactate 2.0 · K 5.4', fixed:{ ketoacidosis:'pH 7.21 · HCO₃ 11 · K 4.1' } },
    eucr:{ r:'Na 131 · K 5.4 · urea 11.8 · creatinine 142 · HCO₃ 7', fixed:{ ketoacidosis:'Na 136 · K 3.6 · urea 9.0 · creatinine 110 · HCO₃ 12' } },
    fbc:'Hb 13.9 g/dL · WBC 16.1 ×10⁹/L (stress response) · platelets 310 ×10⁹/L',
    ecg:'Sinus tachycardia. Slightly peaked T waves.',
    upt:'Negative',
    mrdt:'Negative',
    bcult:'Pending'
  },
  problems:[
    { id:'dehydration', cue:'Dry, weak fast pulse.', drift:{ sbp:-2, hr:2 }, fixedBy:['ns_bolus'], onFix:{ sbp:16, hr:-16 }, over:30, fixText:'Her pulse settles a little with the fluids.' },
    { id:'ketoacidosis', cue:'Deep sighing breaths.', drift:{ gcs:-0.4, rr:0.6 }, fixedBy:['insulin_frii'], onFix:{ rr:-10, gcs:1, rbg:-14 }, over:90 },
    { id:'hypok', latent:true, preventable:true, cue:'Potassium is falling with insulin: arrhythmia risk.', wakeText:'The monitor shows ectopic beats. Potassium is falling.', drift:{ sbp:-5, hr:-3 }, fixedBy:['kcl'], onFix:{ sbp:10, hr:4 } },
    { id:'vomit', fixedBy:['ngt'] }
  ],
  triggers:[ { after:'insulin_frii', delay:60, problem:'hypok', unless:['kcl'] } ],
  critical:[
    { label:'Checked the blood glucose', any:['rbg'], by:5, pts:6 },
    { label:'Confirmed ketosis / acidosis', any:['urinalysis','vbg'], by:20, pts:8 },
    { label:'Started IV 0.9% saline promptly', any:['ns_bolus'], by:15, pts:14 },
    { label:'Started a fixed-rate insulin infusion', any:['insulin_frii'], by:60, pts:14 },
    { label:'Checked potassium', any:['eucr','vbg'], by:60, pts:8 },
    { label:'Replaced potassium once insulin was running', any:['kcl'], pts:8 }
  ],
  good:[
    { label:'IV access', any:['iv_access'], pts:2 },
    { label:'Cardiac monitor', any:['monitor'], pts:2 },
    { label:'Pregnancy test in a young woman', any:['upt'], pts:2 },
    { label:'ECG for potassium effects', any:['ecg'], pts:2 },
    { label:'Called medicine', any:['consult_med'], pts:2 }
  ],
  harmful:[
    { label:'Started insulin before any IV fluid', any:['insulin_frii','insulin_bolus'], unless:['ns_bolus'], pts:-6, why:'Insulin moves glucose and water into cells. In a dry patient that can drop the BP. Start fluids first.' },
    { label:'Gave an IV insulin bolus', any:['insulin_bolus'], pts:-3, why:'A fixed-rate infusion at 0.1 unit/kg/h is enough. A bolus raises the risk of hypokalaemia.' }
  ],
  dx:{ options:[
    { id:'dka', label:'Diabetic ketoacidosis' },
    { id:'hhs', label:'Hyperosmolar hyperglycaemic state' },
    { id:'gastro', label:'Acute gastroenteritis' },
    { id:'pancreatitis', label:'Acute pancreatitis' },
    { id:'sepsis', label:'Sepsis' },
    { id:'appendicitis', label:'Acute appendicitis' }
  ], correct:['dka'], close:['hhs'] },
  dispo:{ best:['admit_hdu'], ok:['admit_ward'], harm:['discharge'], why:'Severe DKA (pH under 7.1) needs hourly glucose and ketone checks, frequent potassium checks and close fluid monitoring.' },
  responses:{
    consult_med:'The medical registrar says: "Fluids first: a litre of saline over the first hour. Fixed-rate insulin at 0.1 unit/kg/h. Potassium in the bags once K is under 5.5 and she\'s passing urine. Add 10% dextrose when glucose is under 14."',
    call_senior:'Your senior asks: "Glucose, ketones, gas, potassium? Fluids running? Then insulin."',
    insulin_frii:'You start soluble insulin at 5 units/hour (0.1 unit/kg/h) on a pump.'
  },
  teaching:[
    'DKA = glucose over 11 mmol/L (or known diabetes) + ketonaemia ≥3 mmol/L or ketonuria ++ + pH under 7.3 or bicarbonate under 15.',
    'Fluids first: 0.9% saline, about 1 L in the first hour for an adult, then reassess.',
    'Fixed-rate IV insulin at 0.1 unit/kg/h. No bolus needed. Add 10% dextrose once glucose is under 14 mmol/L and continue insulin until the ketones clear.',
    'Insulin drives potassium into cells. Add 40 mmol/L KCl when K⁺ is 3.5–5.5 and the patient is passing urine. Check K⁺ often.',
    'Find the trigger. Running out of insulin because of cost is common. Plan affordable supply before discharge.'
  ],
  refs:['Joint British Diabetes Societies (JBDS-IP): Management of diabetic ketoacidosis in adults','ISPAD Clinical Practice Consensus Guidelines: DKA']
},

/* ---------------------------------------------------------- 8 · PHC cholera */
{
  id:'watery-diarrhoea', title:'Watery diarrhoea during the rainy season', setting:'phc', level:'Core',
  patient:{ name:'Halima Yusuf', age:'27', ageYears:27, sex:'female', weight:'55 kg' },
  speaker:'Halima (her husband helps)', persona:'A trader, weak and lethargic, speaks slowly. Her husband is worried and mentions that neighbours are also sick.',
  arrival:'Her husband carries Halima in. "She has been passing water like rice water since morning. Many people in our area are sick like this."',
  triage:'Triage: lethargic, weak pulse. Category: red.',
  background:'Rainy season. Family drinks water from a shared well. Several neighbours have had diarrhoea and one elderly man died this week. Not pregnant. No chronic illness. Diarrhoea began at dawn, more than 10 times, plus vomiting and leg cramps.',
  vitals:{ hr:138, sbp:78, dbp:44, rr:28, spo2:97, temp:36.6, gcs:14, rbg:4.8 },
  history:[
    { id:'stool', q:'How many times has she passed stool? What does it look like?', a:'More than ten times since dawn. Like water from washing rice.', key:true, k:'diarrhoea stool times' },
    { id:'vomit', q:'Any vomiting? Can she drink?', a:'She vomits and is too weak to drink well.', key:true, k:'drink vomiting' },
    { id:'urine', q:'When did she last pass urine?', a:'Not since morning.', key:true, k:'urine pee' },
    { id:'contacts', q:'Is anyone else sick? Where do you get drinking water?', a:'Many neighbours have the same thing. One old man died. We all use the same well.', key:true, k:'neighbours water well community outbreak' },
    { id:'blood', q:'Any blood in the stool or fever?', a:'No blood. No fever.', key:true, k:'bloody fever' },
    { id:'cramps', q:'Any cramps or weakness?', a:'Her legs are cramping.', k:'muscle' },
    { id:'preg', q:'Is she pregnant?', a:'No.', k:'pregnancy' }
  ],
  exam:{
    general:{ r:'Lethargic. Very sunken eyes. Unable to drink well.', fixed:{ dehydration:'More alert. Asking for water. Eyes still a little sunken.' } },
    airway:'Airway patent.',
    breathing:'Chest clear, breathing a little fast.',
    circulation:{ r:'Radial pulse weak and fast. Cold hands. Capillary refill 5 s.', fixed:{ dehydration:'Radial pulse easily felt. Warm hands. Capillary refill 2 s.' } },
    abdomen:'Soft, non-tender. Very active bowel sounds.',
    neuro:'Lethargic but rousable. No neck stiffness.',
    skin:{ r:'Skin pinch goes back very slowly (over 2 s).', fixed:{ dehydration:'Skin pinch goes back quickly.' } }
  },
  keyExam:['general','circulation','skin'],
  tests:{
    cholera_rdt:'POSITIVE (Vibrio cholerae O1)',
    rbg:'4.8 mmol/L',
    mrdt:'Negative',
    pcv:'52% (haemoconcentrated)',
    urinalysis:'No urine passed yet',
    upt:'Negative'
  },
  problems:[
    { id:'dehydration', cue:'Severe dehydration: weak pulse, cold hands.', drift:{ sbp:-3, hr:3, gcs:-0.2 }, fixedBy:['rl_planc','ns_bolus'], need:1, onFix:{ sbp:32, hr:-36, gcs:1 }, over:45, fixText:'Her pulse becomes stronger as the Ringer\'s lactate runs in.' },
    { id:'ongoing', fixedBy:['ors','doxy'] }
  ],
  critical:[
    { label:'Got IV access quickly', any:['iv_access','io_access'], by:10, pts:8 },
    { label:'Started rapid IV Ringer\'s lactate (WHO Plan C)', any:['rl_planc'], by:15, pts:20 },
    { label:'Gave a single dose of doxycycline', any:['doxy'], pts:8 },
    { label:'Started ORS once she could drink', any:['ors'], pts:8 },
    { label:'Notified the LGA disease surveillance officer', any:['notify_dsno'], pts:8 }
  ],
  good:[
    { label:'Cholera rapid test', any:['cholera_rdt'], pts:4 },
    { label:'Checked blood glucose', any:['rbg'], pts:2 },
    { label:'Called your senior', any:['call_senior'], pts:2 }
  ],
  harmful:[
    { label:'Gave an anti-diarrhoeal', any:['loperamide'], pts:-6, why:'Anti-motility drugs don\'t help in cholera and can cause harm. Replace losses instead.' },
    { label:'Gave an unnecessary broad-spectrum antibiotic', any:['ceftriaxone'], pts:-2, why:'A single dose of doxycycline is enough for cholera.' },
    { label:'Gave only a saline bolus instead of full rehydration', any:['ns_bolus'], unless:['rl_planc'], pts:-2, why:'Ringer\'s lactate is preferred, at 100 mL/kg over 3 hours for adults.' }
  ],
  dx:{ options:[
    { id:'cholera', label:'Cholera with severe dehydration' },
    { id:'gastro-some', label:'Acute gastroenteritis with some dehydration' },
    { id:'typhoid', label:'Typhoid fever' },
    { id:'severe-malaria', label:'Severe malaria' },
    { id:'food', label:'Food poisoning' },
    { id:'lassa', label:'Lassa fever' }
  ], correct:['cholera'], close:['gastro-some'] },
  dispo:{ best:['admit_ward'], ok:['refer'], harm:['discharge'], why:'Keep her in the cholera treatment area for observation and ongoing ORS until the diarrhoea settles. Moving an unresuscitated patient is dangerous.' },
  responses:{
    notify_dsno:'The DSNO thanks you: "That\'s the sixth case from that ward this week. We\'re sending a rapid response team to chlorinate the wells."',
    rl_planc:'You run Ringer\'s lactate fast: 1.65 L over the first 30 minutes (30 mL/kg), then 3.85 L over the next 2½ hours.',
    call_senior:'The officer-in-charge says: "Plan C now. Two lines if you can. Doxycycline. Notify the DSNO. Isolate her and use chlorine."',
    doxy:'You give doxycycline 300 mg once.'
  },
  teaching:[
    'In an outbreak, profuse painless rice-water diarrhoea with severe dehydration is cholera until proven otherwise.',
    'WHO Plan C for severe dehydration: IV Ringer\'s lactate 100 mL/kg. Adults: 30 mL/kg in 30 minutes, then 70 mL/kg over 2½ hours. Reassess every 15–30 minutes.',
    'Start ORS as soon as she can drink. Single-dose doxycycline shortens the illness. Give children zinc.',
    'Report every suspected case to the LGA disease surveillance and notification officer (DSNO) or NCDC. Isolate, use chlorine and trace the water source.'
  ],
  refs:['WHO / Global Task Force on Cholera Control: cholera outbreak response field manual','NCDC Cholera guidelines']
}

];

/* These scripts load after the app's first render. If the student opened #/ersim directly,
 * draw it now; otherwise just refresh the nav so the ER Sim entry appears. */
(function(){ try{
  if(/^#\/ersim/.test(location.hash) && typeof render==='function') render();
  else if(typeof renderNav==='function') renderNav();
}catch(e){} })();
