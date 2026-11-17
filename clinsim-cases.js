/* =====================================================================
 * Clinical Simulation: built-in Quick Cases and Case of the Day puzzles.
 * Original MedBank content for Nigerian clinical students (400 to 600 level).
 * Every patient is fictional. A clinician must review these before
 * FEATURES.CLINICAL_SIM goes live (see CLINICAL-SIM.md).
 *
 * Quick case: id, title (presenting complaint, never the diagnosis), area,
 *   patient{name,age,sex}, stem, steps[{prompt, reveal, options[{t, pts, why}]}],
 *   mcqs[{stem, options[4], ans, why}], teaching[], refs[]
 *   pts: 10 = best (exactly one per step), 3 to 6 = weaker, 0 = useless,
 *   negative = harmful, -10 = dangerous (scored as a dangerous decision).
 * Daily puzzle: id, spec[], words, answer, aliases[], clues[6] (vaguest first), why
 * spec = specialties (matched to the student's course names), words = topic words
 *   (matched to their imported topic titles), diff = Foundation | Core | Advanced
 * ===================================================================== */
window.CLINSIM_QUICK = [
{
  id:'q-headache-pregnant', title:'Headache at 34 weeks of pregnancy', area:'Obstetrics',
  spec:['Obstetrics & Gynaecology'], words:'pre-eclampsia eclampsia hypertension pregnancy antenatal magnesium', diff:'Core',
  patient:{ name:'Ngozi Eze', age:'24', sex:'female' },
  stem:'Ngozi, in her first pregnancy at 34 weeks, comes to the antenatal clinic with a headache since morning and "stars" in front of her eyes. Her feet and face are swollen. The nurse records a BP of 168/112 mmHg.',
  steps:[
    { prompt:'What do you do first?', reveal:'Repeat BP 170/114 mmHg. Urine protein 3+. Brisk knee jerks. No fits so far. The fetal heart is 140/min.',
      options:[
        { t:'Repeat the BP, dip the urine and look for other severe features', pts:10, why:'Confirm severe-range BP and proteinuria and look for danger signs before you act.' },
        { t:'Give paracetamol for the headache and review her next week', pts:-10, why:'Headache with visual symptoms and BP this high are severe features. Sending her away risks eclampsia and stroke.' },
        { t:'Book an obstetric ultrasound scan and wait for the report', pts:3, why:'A scan helps later, but it is not the first step in a hypertensive emergency.' },
        { t:'Start oral amoxicillin for a possible urinary tract infection', pts:0, why:'Nothing points to infection. It wastes time.' }
      ] },
    { prompt:'She has pre-eclampsia with severe features. How do you prevent fits?', reveal:'You give the magnesium sulfate loading dose and start the maintenance regimen with hourly checks.',
      options:[
        { t:'Magnesium sulfate loading dose, then maintenance, with monitoring', pts:10, why:'Magnesium sulfate is the drug of choice to prevent and treat eclamptic fits.' },
        { t:'Diazepam injection now and repeat if she starts fitting', pts:3, why:'Diazepam is inferior to magnesium sulfate and sedates mother and baby.' },
        { t:'Phenytoin loading dose as for epilepsy', pts:0, why:'Phenytoin is less effective than magnesium sulfate in eclampsia.' },
        { t:'Nothing yet, as there is no need until she actually fits', pts:-10, why:'Severe pre-eclampsia needs prophylaxis. Waiting for a fit is dangerous.' }
      ] },
    { prompt:'Her BP is still 166/110 mmHg. How do you lower it?', reveal:'The BP comes down to 148/96 mmHg over the next hour.',
      options:[
        { t:'Fast-acting antihypertensive such as IV hydralazine or oral nifedipine', pts:10, why:'Severe-range BP needs a rapid-acting agent to cut the risk of stroke.' },
        { t:'Oral methyldopa only, as for chronic hypertension', pts:3, why:'Methyldopa is safe in pregnancy but acts too slowly for an emergency.' },
        { t:'IV furosemide to remove the swelling', pts:-5, why:'These women are often intravascularly dry. Diuretics are not used to treat the BP.' },
        { t:'Start lisinopril to protect her kidneys', pts:-10, why:'ACE inhibitors harm the fetus and are contraindicated in pregnancy.' }
      ] },
    { prompt:'She is stable on magnesium sulfate and her BP is controlled. What is the plan?', reveal:'You hand over to the obstetric team for delivery once she is stable.',
      options:[
        { t:'Plan delivery once she is stabilised, with the obstetric team', pts:10, why:'Delivery of the placenta is the definitive treatment of pre-eclampsia.' },
        { t:'Emergency caesarean section straight away before stabilising her', pts:3, why:'She may need delivery soon, but stabilise BP and start magnesium first.' },
        { t:'Discharge her once the BP settles, with clinic review in a week', pts:-10, why:'Severe pre-eclampsia can progress fast. She must stay in hospital.' },
        { t:'Continue the pregnancy to term with weekly clinic visits', pts:-10, why:'Prolonging a pregnancy with severe features risks eclampsia, abruption and death.' }
      ] }
  ],
  mcqs:[
    { stem:'A woman on magnesium sulfate becomes drowsy. Which sign usually appears first as magnesium levels rise?', options:['Loss of patellar reflexes','Respiratory arrest','Cardiac arrest','Pinpoint pupils'], ans:0, why:'Reflexes are lost before breathing is depressed, so check knee jerks before each dose.' },
    { stem:'Which drug reverses magnesium sulfate toxicity?', options:['Calcium gluconate','Naloxone','Flumazenil','Protamine sulfate'], ans:0, why:'10 mL of 10% calcium gluconate IV slowly is the antidote.' },
    { stem:'Above which BP is hypertension in pregnancy treated as severe and urgent?', options:['160/110 mmHg','140/90 mmHg','150/100 mmHg','180/120 mmHg'], ans:0, why:'A systolic of 160 or more, or diastolic of 110 or more, needs urgent treatment.' }
  ],
  teaching:[
    'Headache, visual disturbance, epigastric pain or BP of 160/110 or more make pre-eclampsia severe.',
    'Magnesium sulfate prevents and treats eclamptic fits. Monitor reflexes, breathing and urine output.',
    'Lower severe-range BP with a fast-acting drug. Avoid ACE inhibitors in pregnancy.',
    'Delivery is the cure. Stabilise first, then plan delivery with the obstetric team.'
  ],
  refs:['WHO recommendations for prevention and treatment of pre-eclampsia and eclampsia','FMOH Nigeria, National Guidelines on Maternal Health']
},
{
  id:'q-bone-pain-teen', title:'A teenager with severe leg and back pain', area:'Paediatrics',
  spec:['Paediatrics'], words:'sickle cell haemoglobinopathy crisis acute chest anaemia haematology', diff:'Core',
  patient:{ name:'Tunde Adeyemi', age:'14', sex:'male' },
  stem:'Tunde, who has sickle cell anaemia (HbSS), is carried in by his father. He has had severe pain in both thighs and his lower back since last night, after a football match in the sun. He is crying. Temperature 37.8 °C, SpO₂ 97% on air.',
  steps:[
    { prompt:'What do you do first?', reveal:'He scores his pain 9 out of 10. Within 30 minutes of analgesia it falls to 5.',
      options:[
        { t:'Score his pain and give strong analgesia within 30 minutes', pts:10, why:'Prompt, adequate analgesia is the first priority in a painful crisis.' },
        { t:'Wait for the full blood count before giving any analgesia', pts:0, why:'Results can come later. He should not wait in pain.' },
        { t:'Give routine IM pethidine', pts:3, why:'Pethidine is discouraged in sickle cell disease. Use oral or IV morphine where available.' },
        { t:'Send him home on oral paracetamol only', pts:-5, why:'Pain of 9/10 needs stronger analgesia and observation.' }
      ] },
    { prompt:'What about fluids?', reveal:'He drinks well and you start maintenance IV fluids while he is in pain.',
      options:[
        { t:'Encourage oral fluids and give maintenance IV fluids if needed', pts:10, why:'Dehydration worsens sickling. Hydrate to maintenance, not beyond.' },
        { t:'Give repeated large fluid boluses regardless of his status', pts:0, why:'Over-hydration can cause fluid overload and may contribute to chest problems.' },
        { t:'Restrict fluids to reduce the swelling', pts:-5, why:'Fluid restriction worsens sickling.' },
        { t:'No fluids are needed in a painful crisis', pts:-5, why:'He was exposed to heat and exercise. Hydration matters.' }
      ] },
    { prompt:'On day 2 he develops chest pain and a cough. SpO₂ is 91% and the chest X-ray shows a new right lower zone shadow. What now?', reveal:'He improves on oxygen, antibiotics and a top-up transfusion after senior review.',
      options:[
        { t:'Oxygen, broad antibiotics, senior review and consider transfusion', pts:10, why:'This is acute chest syndrome, a leading cause of death in sickle cell disease. Treat it aggressively.' },
        { t:'Incentive spirometry alone and review tomorrow', pts:3, why:'Spirometry helps prevent it but is not enough once it has developed.' },
        { t:'Chest physiotherapy only', pts:0, why:'It does not treat the hypoxia or infection.' },
        { t:'Continue analgesia and observe, as this is part of the crisis', pts:-10, why:'Missing acute chest syndrome can be fatal.' }
      ] },
    { prompt:'He is ready to go home. What do you advise?', reveal:'His father understands the plan and the danger signs.',
      options:[
        { t:'Folic acid, malaria prophylaxis, hydration, clinic follow-up and hydroxyurea', pts:10, why:'Hydroxyurea raises fetal haemoglobin and reduces crises. Prophylaxis prevents common triggers.' },
        { t:'Stop the folic acid, as he is no longer anaemic', pts:-5, why:'Chronic haemolysis means ongoing folate needs.' },
        { t:'Avoid all physical activity for the rest of his life', pts:0, why:'Activity is fine with hydration and avoiding extremes of heat and cold.' },
        { t:'Come back only if a crisis lasts more than a week', pts:-5, why:'Fever, chest pain, breathlessness or severe pain need same-day review.' }
      ] }
  ],
  mcqs:[
    { stem:'How does hydroxyurea reduce crises in sickle cell anaemia?', options:['It raises fetal haemoglobin','It lowers the white cell count only','It thins the blood like aspirin','It removes iron from the body'], ans:0, why:'More HbF means less HbS polymerisation and sickling.' },
    { stem:'Which defines acute chest syndrome?', options:['New lung infiltrate with fever or chest symptoms','Chest pain with a normal X-ray','Any cough in a sickle cell patient','A drop in haemoglobin of 1 g/dL'], ans:0, why:'A new infiltrate plus fever, chest pain, cough or hypoxia.' },
    { stem:'Which is NOT a common trigger of a painful crisis?', options:['A high-protein diet','Dehydration','Infection, including malaria','Exposure to cold'], ans:0, why:'Dehydration, infection, cold, stress and exertion are the common triggers.' }
  ],
  teaching:[
    'Give strong analgesia within 30 minutes of arrival in a painful crisis.',
    'Hydrate to maintenance. Watch for over-hydration.',
    'New chest symptoms with hypoxia and a new shadow mean acute chest syndrome. Escalate early.',
    'Long-term care: folic acid, malaria prophylaxis, vaccines, hydroxyurea and regular clinic follow-up.'
  ],
  refs:['FMOH Nigeria, National Guideline for the Control and Management of Sickle Cell Disease','WHO, Sickle cell disease fact sheet']
},
{
  id:'q-long-cough', title:'A cough that will not go away', area:'Medicine',
  spec:['Medicine'], words:'tuberculosis tb cough respiratory hiv chest infection', diff:'Core',
  patient:{ name:'Ibrahim Musa', age:'32', sex:'male' },
  stem:'Ibrahim, a trader at a busy market, has coughed for 5 weeks. He sweats at night and his clothes have become loose. Antibiotics from a chemist did not help. He lives in one room with his wife and two children aged 3 and 7.',
  steps:[
    { prompt:'What test do you send first?', reveal:'GeneXpert MTB/RIF: MTB detected, rifampicin resistance not detected.',
      options:[
        { t:'Sputum GeneXpert MTB/RIF', pts:10, why:'It confirms TB and checks rifampicin resistance in under 2 hours.' },
        { t:'A chest X-ray only', pts:3, why:'Supportive, but it does not confirm TB or show drug resistance.' },
        { t:'Another 2 weeks of amoxicillin, then review', pts:3, why:'Five weeks of cough with weight loss and night sweats needs a TB test now.' },
        { t:'Start TB drugs today without any test', pts:-3, why:'Test first wherever possible. Resistance changes the regimen.' }
      ] },
    { prompt:'What else do you offer him today?', reveal:'His HIV test is negative.',
      options:[
        { t:'An HIV test with counselling', pts:10, why:'Every person with TB should be offered an HIV test. It changes management.' },
        { t:'A hepatitis B vaccine only', pts:0, why:'Not the priority here.' },
        { t:'A stool test for ova and parasites', pts:0, why:'Not relevant to this presentation.' },
        { t:'Nothing else, as TB is the diagnosis', pts:-5, why:'Missing HIV co-infection is a serious gap in TB care.' }
      ] },
    { prompt:'How do you treat him?', reveal:'He starts treatment under directly observed therapy at the DOTS clinic.',
      options:[
        { t:'2 months of HRZE, then 4 months of HR', pts:10, why:'Standard first-line regimen for drug-sensitive pulmonary TB.' },
        { t:'Refer for drug-resistant TB treatment', pts:0, why:'Rifampicin resistance was not detected.' },
        { t:'Streptomycin injections for 6 months', pts:-5, why:'Not a regimen for new drug-sensitive TB.' },
        { t:'Isoniazid alone for 6 months', pts:-10, why:'Monotherapy for active TB breeds drug resistance.' }
      ] },
    { prompt:'What about his family?', reveal:'Both children are screened. The 3-year-old has no active TB and starts preventive treatment.',
      options:[
        { t:'Screen all household contacts and give preventive therapy as indicated', pts:10, why:'Children under 5 living with a TB case are at high risk and need TB preventive therapy once active TB is excluded.' },
        { t:'Give every family member the full 6-month TB regimen', pts:0, why:'Treat active TB only when it is found. Others get screening and preventive therapy.' },
        { t:'Keep him isolated at home for all 6 months', pts:0, why:'Infectiousness falls quickly on effective treatment.' },
        { t:'No action, as they have no symptoms', pts:-5, why:'Contacts, especially young children, can have TB infection without symptoms.' }
      ] }
  ],
  mcqs:[
    { stem:'Which TB drug commonly turns urine and tears orange-red?', options:['Rifampicin','Isoniazid','Ethambutol','Pyrazinamide'], ans:0, why:'Warn patients so they do not stop it.' },
    { stem:'Peripheral neuropathy from isoniazid is prevented by giving:', options:['Pyridoxine','Folic acid','Thiamine','Vitamin C'], ans:0, why:'Pyridoxine (vitamin B6) prevents isoniazid neuropathy.' },
    { stem:'Which TB drug can cause optic neuritis with red-green colour blindness?', options:['Ethambutol','Rifampicin','Isoniazid','Pyrazinamide'], ans:0, why:'Check visual acuity and colour vision on ethambutol.' }
  ],
  teaching:[
    'Cough over 2 weeks with weight loss, fever or night sweats: test for TB, ideally with GeneXpert.',
    'Offer every person with TB an HIV test.',
    'Drug-sensitive TB: 2HRZE then 4HR, taken under direct observation.',
    'Screen household contacts. Give preventive therapy to eligible contacts, especially children under 5.'
  ],
  refs:['National Tuberculosis and Leprosy Control Programme Nigeria, guidelines','WHO consolidated guidelines on tuberculosis']
},
{
  id:'q-yellow-baby', title:'A baby who has turned yellow', area:'Paediatrics',
  spec:['Paediatrics'], words:'neonatal jaundice neonate newborn bilirubin g6pd phototherapy', diff:'Core',
  patient:{ name:'Baby of Halima Bello', age:'2 days', sex:'male' },
  stem:'Halima brings her 2-day-old son, born at term at home. She noticed his eyes turning yellow yesterday. Today the yellow colour reaches his palms and soles. He is breastfeeding. Halima is blood group O positive.',
  steps:[
    { prompt:'What do you do first?', reveal:'Total serum bilirubin is 290 µmol/L, above the phototherapy line for his age on the chart.',
      options:[
        { t:'Measure the serum bilirubin and plot it on a treatment chart', pts:10, why:'Yellow palms and soles suggest a high level. Measure and plot against age in hours.' },
        { t:'Reassure her and advise morning sunlight at home', pts:-10, why:'Sunlight is not a safe treatment and severe jaundice can cause brain damage.' },
        { t:'Advise glucose water between feeds', pts:-5, why:'Glucose water does not lower bilirubin and reduces breastfeeding.' },
        { t:'Advise her to stop breastfeeding', pts:-5, why:'Continue breastfeeding. Good feeding helps clear bilirubin.' }
      ] },
    { prompt:'The bilirubin is above the phototherapy threshold. What next?', reveal:'He starts intensive phototherapy and keeps breastfeeding.',
      options:[
        { t:'Start phototherapy, continue breastfeeding and recheck bilirubin', pts:10, why:'Phototherapy is the treatment when the level crosses the line.' },
        { t:'Exchange blood transfusion straight away', pts:3, why:'Exchange is for levels at the exchange line or signs of brain injury.' },
        { t:'Oral phenobarbitone', pts:0, why:'It is not a treatment for acute neonatal jaundice.' },
        { t:'A traditional herbal bath', pts:-10, why:'It delays effective treatment and some herbs cause haemolysis.' }
      ] },
    { prompt:'What do you look for as the cause?', reveal:'The baby is group A positive with a positive direct Coombs test. G6PD screen: normal.',
      options:[
        { t:'Mother and baby blood groups, direct Coombs test and a G6PD screen', pts:10, why:'Jaundice on day 1 to 2 suggests haemolysis. ABO incompatibility and G6PD deficiency are common in Nigeria.' },
        { t:'Liver function tests only', pts:3, why:'Useful later if jaundice persists, but not the first workup for early jaundice.' },
        { t:'A urine culture only', pts:0, why:'Infection is possible, but haemolysis is more likely here.' },
        { t:'No workup, as all newborns get jaundiced', pts:-5, why:'Jaundice in the first 24 to 48 hours reaching the soles is not physiological.' }
      ] },
    { prompt:'Six hours later he is lethargic, sucks poorly and arches his back. What do you do?', reveal:'He has an exchange blood transfusion. The neonatal team follows his hearing and development.',
      options:[
        { t:'Urgent exchange blood transfusion', pts:10, why:'These are signs of acute bilirubin encephalopathy. Exchange is urgent.' },
        { t:'Continue phototherapy alone and recheck tomorrow', pts:-10, why:'Brain injury is progressing. Waiting risks kernicterus.' },
        { t:'Antibiotics only', pts:0, why:'Sepsis should be considered, but the urgent need is exchange transfusion.' },
        { t:'Discharge, as he is feeding less and tired', pts:-10, why:'Lethargy and arching in a jaundiced baby are an emergency.' }
      ] }
  ],
  mcqs:[
    { stem:'Jaundice appearing within the first 24 hours of life is:', options:['Always pathological until proven otherwise','Physiological','Due to breast milk','Normal in preterm babies only'], ans:0, why:'Early jaundice suggests haemolysis and needs investigation.' },
    { stem:'Which enzyme deficiency is a common cause of severe neonatal jaundice in Nigeria?', options:['G6PD','Pyruvate kinase','Hexokinase','Lactase'], ans:0, why:'G6PD deficiency is common and can cause sudden severe haemolysis.' },
    { stem:'Kernicterus results from bilirubin deposition in the:', options:['Basal ganglia','Cerebellar cortex only','Spinal cord','Optic nerve'], ans:0, why:'Unconjugated bilirubin damages the basal ganglia and brainstem nuclei.' }
  ],
  teaching:[
    'Yellow palms and soles suggest a high bilirubin. Measure it and plot it against the baby\'s age in hours.',
    'Phototherapy above the line, exchange transfusion at the exchange line or with signs of encephalopathy.',
    'Look for haemolysis: blood groups, direct Coombs test and G6PD.',
    'Continue breastfeeding. Avoid glucose water, sunlight treatment and herbal remedies.'
  ],
  refs:['WHO Pocket Book of Hospital Care for Children','Nigerian Society of Neonatal Medicine, neonatal jaundice guidance']
}
];

window.CLINSIM_DAILY = [
  { id:'d-lassa', spec:['Medicine'], words:'lassa viral haemorrhagic fever infectious', answer:'Lassa fever', aliases:['lassa','lassa haemorrhagic fever','lassa hemorrhagic fever'], clues:['An adult with fever for 6 days','Antimalarials and antibiotics have not helped','Sore throat and pain behind the breastbone','Lives in a rural part of Edo State','Facial swelling and bleeding from the gums','Rats were seen in the family\'s food store'], why:'Fever unresponsive to antimalarials, pharyngitis, bleeding and rodent exposure in an endemic state point to Lassa fever. Isolate, treat with ribavirin and trace contacts.' },
  { id:'d-typhoid', spec:['Medicine'], words:'typhoid enteric fever salmonella infectious', answer:'Typhoid fever', aliases:['typhoid','enteric fever'], clues:['Fever for 8 days','The fever climbs a little higher each day','Abdominal pain and constipation','Pulse slower than expected for the fever','Rose-coloured spots on the trunk','Blood culture grows Salmonella Typhi'], why:'Step-ladder fever, abdominal symptoms, relative bradycardia and rose spots are classic enteric fever.' },
  { id:'d-scd', spec:['Paediatrics'], words:'sickle cell haemoglobinopathy anaemia haematology', answer:'Sickle cell anaemia', aliases:['sickle cell disease','hbss','sickle cell','scd'], clues:['A child with repeated painful episodes','Painful swollen hands and feet as an infant','Yellow eyes during illnesses','Frontal bossing and a prominent upper jaw','Hb 7 g/dL with target cells on the film','Haemoglobin electrophoresis shows SS'], why:'Dactylitis, recurrent crises, chronic haemolysis and electrophoresis SS confirm sickle cell anaemia.' },
  { id:'d-preeclampsia', spec:['Obstetrics & Gynaecology'], words:'pre-eclampsia hypertension pregnancy antenatal', answer:'Pre-eclampsia', aliases:['preeclampsia','pre eclampsia','severe pre-eclampsia'], clues:['A woman in her first pregnancy','32 weeks pregnant','Frontal headache','Swelling of the face and hands','Flashing lights in front of her eyes','BP 164/110 mmHg and urine protein 3+'], why:'New hypertension after 20 weeks with proteinuria and severe features is pre-eclampsia.' },
  { id:'d-tb', spec:['Medicine'], words:'tuberculosis tb respiratory chest', answer:'Pulmonary tuberculosis', aliases:['tuberculosis','tb','ptb','pulmonary tb'], clues:['A man with a cough','The cough has lasted 6 weeks','He sweats at night','He has lost a lot of weight','Upper lobe cavity on chest X-ray','Sputum shows acid-fast bacilli'], why:'Chronic cough with weight loss, night sweats and an upper lobe cavity with AFB is pulmonary TB.' },
  { id:'d-burkitt', spec:['Paediatrics'], words:'burkitt lymphoma oncology tumour', answer:'Burkitt lymphoma', aliases:['burkitt','burkitts lymphoma','burkitt\'s lymphoma'], clues:['An 8-year-old boy','A swelling that has grown in weeks','He lives in a malaria-endemic area','A jaw mass loosening his teeth','"Starry sky" appearance on biopsy','Linked to Epstein-Barr virus and c-MYC translocation'], why:'A fast-growing jaw mass in a child in a malaria belt with a starry-sky biopsy is endemic Burkitt lymphoma.' },
  { id:'d-tetanus', spec:['Medicine'], words:'tetanus infectious wound', answer:'Tetanus', aliases:['lockjaw'], clues:['A farmer feeling stiff','A foot wound 10 days ago','Difficulty opening his mouth','A fixed grin on his face','Back-arching spasms','Spasms set off by noise and touch, fully conscious between them'], why:'Trismus, risus sardonicus and stimulus-triggered spasms after a dirty wound in an unimmunised person are tetanus.' },
  { id:'d-dka', spec:['Medicine'], words:'diabetes dka ketoacidosis endocrine', answer:'Diabetic ketoacidosis', aliases:['dka','ketoacidosis'], clues:['A teenager with vomiting and abdominal pain','Passing a lot of urine for 2 weeks','Weight loss despite eating well','Deep, sighing breathing','A fruity smell on the breath','RBG 28 mmol/L and urine ketones 3+'], why:'Polyuria, weight loss, Kussmaul breathing, ketotic breath and high glucose with ketones are DKA.' },
  { id:'d-nephrotic', spec:['Paediatrics'], words:'nephrotic renal kidney nephrology', answer:'Nephrotic syndrome', aliases:['nephrotic','minimal change disease'], clues:['A child with puffy eyes in the morning','The swelling spreads to the legs and belly','Frothy urine','Blood pressure is normal','Serum albumin 18 g/L','Urine protein 4+ and high cholesterol'], why:'Oedema, heavy proteinuria, low albumin and high lipids define nephrotic syndrome.' },
  { id:'d-rhd', spec:['Medicine'], words:'rheumatic heart cardiology valve mitral', answer:'Rheumatic heart disease', aliases:['rhd','mitral stenosis','rheumatic mitral stenosis'], clues:['A young woman breathless on walking','Frequent sore throats as a child','Joint pains that moved from joint to joint as a child','Palpitations and an irregularly irregular pulse','Low rumbling mid-diastolic murmur at the apex','Echo shows thickened mitral leaflets with stenosis'], why:'Childhood rheumatic fever leading to mitral stenosis and atrial fibrillation is rheumatic heart disease.' },
  { id:'d-ectopic', spec:['Obstetrics & Gynaecology'], words:'ectopic pregnancy gynaecology early pregnancy bleeding', answer:'Ectopic pregnancy', aliases:['ectopic','tubal pregnancy','ruptured ectopic pregnancy'], clues:['A woman of 26 with lower abdominal pain','Her last period was 7 weeks ago','Light vaginal bleeding','Pain at the tip of her shoulder','Pregnancy test positive','Empty uterus and free fluid on scan'], why:'Amenorrhoea, pain, bleeding, shoulder-tip pain, positive test and an empty uterus point to ectopic pregnancy.' },
  { id:'d-appendicitis', spec:['Surgery'], words:'appendicitis acute abdomen general surgery', answer:'Acute appendicitis', aliases:['appendicitis'], clues:['A young man with abdominal pain','The pain began around his navel','He lost his appetite and vomited once','The pain moved to the right lower abdomen','Tender at McBurney\'s point','Rebound tenderness and a positive Rovsing\'s sign'], why:'Periumbilical pain migrating to the right iliac fossa with anorexia and peritonism is acute appendicitis.' }
];
