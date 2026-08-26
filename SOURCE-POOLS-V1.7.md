# V1.7 Source Pools — pilot families (cardio_renal, gi_hepatic, resp_cardiac)

Goal: ~20 GENUINELY DISTINCT source questions per family = several concepts × varied presentations, so the
transformer has independent reasoning starting points (the diversity layer rejects near-dups from thin sources).
Never pad to hit a number — 13 excellent > 25 repetitive.

How to use: each block below is a lecture. Add it via the app's **Add lecture** (paste text), tick **QBank**, build.
Combined with the existing SEED2 pools this reaches ~20 distinct sources/family. Then run the 60-candidate pilot
(20/family, reviewers + diversity + rebalancer frozen) and measure Unique Reasoning Yield vs the previous 100.

Existing pools already built: cardio_renal SEED2 (`1b5d05e4…`, ~6 q), gi_hepatic SEED2 (`68f67f9d…`, ~4 q),
resp_cardiac SEED (`09a42cbc…`, ~9 q).

---

## cardio_renal — add these concepts (target ~20 total)

### Concept: Renocardiac syndrome (type 3) — AKI driving cardiac decompensation
Renocardiac syndrome (cardiorenal type 3) is acute kidney injury precipitating cardiac dysfunction. AKI causes volume overload, metabolic acidosis, and hyperkalaemia; the hyperkalaemia (peaked T waves, widened QRS) and acidosis impair myocardial conduction and contractility, precipitating arrhythmia and decompensation, while uraemia can cause pericardial effusion and tamponade. Management is dictated by both organs: severe hyperkalaemia with ECG change needs immediate calcium gluconate for membrane stabilisation, then insulin-dextrose, then dialysis if refractory or oliguric with fluid overload; fluid removal must respect cardiac output. Interpreting a rising potassium or new arrhythmia in AKI is impossible without the renal picture, and cardiac instability changes the urgency of renal replacement. Presentations: oliguric pulmonary oedema; a peri-arrest hyperkalaemic ECG; a uraemic pericardial rub with hypotension.

### Concept: RAAS and MRA decisions in HF with CKD
RAAS blockade and mineralocorticoid antagonists reduce heart-failure mortality but interact dangerously with renal function and potassium. Starting or up-titrating an ACE inhibitor, ARB, or ARNI in CKD lowers intraglomerular pressure (renoprotective long-term) but can acutely raise creatinine and potassium; spironolactone or eplerenone add further hyperkalaemia risk, sharply so at low eGFR. Adding, holding, or stopping each agent depends jointly on cardiac benefit and the renal/potassium ceiling: potassium 5.5 with eGFR 25 makes an MRA unsafe, whereas an SGLT2 inhibitor gives cardiac and renal benefit without raising potassium. A creatinine rise under 30% after starting RAAS blockade is expected and tolerated; a larger rise suggests renovascular disease or over-diuresis. Presentations: choosing the fourth HF drug; responding to a rising potassium; interpreting a creatinine bump after initiation.

### Concept: Refractory congestion — diuretics vs ultrafiltration
Refractory congestion in cardiorenal syndrome forces a decision depending on both organs. Diuretic resistance arises from reduced renal perfusion, tubular sodium avidity, neurohormonal activation, and impaired loop-diuretic delivery. Escalation runs from high-dose IV loop diuretics, to sequential nephron blockade by adding a thiazide, to ultrafiltration when truly refractory; each step trades decongestion against a creatinine rise. Interpreting that rise is central: haemoconcentration with good urine output and a small creatinine rise indicates effective decongestion (good prognosis) and tolerates continuation, whereas a creatinine rise with poor output and falling blood pressure signals hypoperfusion needing inotropes, not more diuresis. Ultrafiltration removes isotonic fluid at a controlled rate but does not fix low output. Presentations: still congested despite escalating furosemide; creatinine climbing during diuresis; when ultrafiltration is justified.

### Concept: Contrast-associated AKI and the catheterisation decision
A patient with cardiac disease needing contrast (angiography, CT) and pre-existing CKD faces a joint risk: contrast-associated AKI versus the cardiac benefit of the procedure. The decision integrates the urgency of the cardiac indication (STEMI vs elective), baseline eGFR, volume status, and nephrotoxin exposure. Peri-procedure isotonic saline hydration reduces risk; nephrotoxic drugs (NSAIDs, high-dose diuretics) should be held; contrast volume minimised. In true emergency (STEMI) the cardiac indication overrides renal caution; in elective settings the renal risk may defer or modify the procedure. Metformin is held around contrast in advanced CKD (lactic acidosis risk). Presentations: weighing angiography in a CKD patient; choosing peri-contrast prophylaxis; managing a creatinine rise 48h after catheterisation.

---

## gi_hepatic — add these concepts (target ~20 total)

### Concept: Hepatorenal syndrome — ascites/renal physiology
Hepatorenal syndrome (HRS) is functional renal failure in advanced cirrhosis, driven by splanchnic vasodilation reducing effective arterial volume, intense renal vasoconstriction, and a normal-looking kidney (bland urine, no proteinuria). It is a diagnosis of exclusion after volume challenge with albumin and withdrawal of diuretics/nephrotoxins. Treatment is a vasoconstrictor (terlipressin or noradrenaline) PLUS albumin — not fluids alone, which worsen ascites without correcting the arterial underfilling. Distinguishing HRS from pre-renal AKI (responds to volume) and acute tubular necrosis (muddy casts) changes management entirely. Presentations: rising creatinine in a cirrhotic after large-volume paracentesis; oliguria unresponsive to fluids; deciding between albumin+terlipressin and dialysis as a bridge to transplant.

### Concept: Drug clearance and dosing in hepatic failure
The cirrhotic liver transforms pharmacology. Reduced hepatic blood flow, portosystemic shunting, and hepatocyte loss lower first-pass metabolism and cytochrome P450 activity, raising bioavailability and half-life; hypoalbuminaemia raises the free fraction of protein-bound drugs. Sedatives and opioids are especially dangerous — normal doses precipitate or deepen hepatic encephalopathy because the impaired liver cannot clear them and the brain is sensitised to nitrogenous toxins. High-extraction drugs (e.g. propranolol) accumulate markedly with shunting. Dosing decisions require the hepatic assessment (Child-Pugh) to reclassify what "a normal dose" means. Presentations: an elevated drug level explained by shunting; choosing a safe analgesic/sedative in cirrhosis; a benzodiazepine precipitating encephalopathy.

### Concept: Spontaneous bacterial peritonitis — diagnosis and preventing HRS
Spontaneous bacterial peritonitis (SBP) in a cirrhotic with ascites presents subtly — a change in mental state, mild abdominal pain, or nothing. Diagnosis requires diagnostic paracentesis with an ascitic neutrophil count >250/mm³; treatment is a third-generation cephalosporin, and crucially albumin infusion to prevent SBP-precipitated hepatorenal syndrome. Missing SBP precipitates HRS and encephalopathy. The decision to tap, to give albumin, and to start antibiotics is created by the interaction of the infection and the failing liver's renal/cerebral vulnerability. Presentations: a cirrhotic with new confusion (tap before treating encephalopathy); interpreting an ascitic neutrophil count; the role of albumin alongside antibiotics.

### Concept: Hepatic encephalopathy — precipitants and management
Hepatic encephalopathy is neuropsychiatric dysfunction from the failing liver's inability to clear nitrogenous toxins. It is almost always precipitated: GI bleeding (a large nitrogen load), infection (including SBP), hypokalaemia and alkalosis (increase renal ammonia production and its transfer into the brain), constipation, dehydration/over-diuresis, and sedatives. Management is finding and correcting the precipitant plus lactulose (and rifaximin), not sedation. The key integrated insight: correcting a "minor" hypokalaemia or treating an occult infection can resolve the encephalopathy, so the same confused cirrhotic needs a hunt across GI, renal, and infectious precipitants. Presentations: a confused cirrhotic with hypokalaemia; encephalopathy after a variceal bleed; identifying the precipitant rather than just giving lactulose.

---

## resp_cardiac — control group (already strong; add 2–3 for breadth)

### Concept: Pulmonary hypertension classification changes treatment
Pulmonary hypertension is classified into groups that determine treatment: group 1 (pulmonary arterial hypertension) responds to pulmonary vasodilators (endothelin antagonists, PDE5 inhibitors, prostacyclins); group 3 (PH due to lung disease/hypoxia, e.g. COPD, ILD) is treated by correcting hypoxia (long-term oxygen) — and pulmonary vasodilators are HARMFUL there because they worsen ventilation-perfusion mismatch. Distinguishing the group requires integrating the respiratory diagnosis with the cardiac/haemodynamic finding of a raised pulmonary pressure. Presentations: a COPD patient with cor pulmonale (oxygen, not sildenafil); a young woman with idiopathic PAH (vasodilators); interpreting a raised RVSP in the context of lung disease.

### Concept: Massive PE with right heart strain
A large pulmonary embolism causes acute right ventricular pressure overload; the integrated decision is whether the right-heart strain (hypotension, raised troponin, RV dilation on echo) justifies thrombolysis versus anticoagulation alone. Haemodynamic instability (massive PE) mandates thrombolysis or embolectomy; a normotensive patient with RV strain (submassive) is a nuanced risk-benefit decision. Reading the ECG (S1Q3T3, right heart strain), the echo, and the blood pressure together drives the choice. Presentations: hypotensive PE (thrombolyse); normotensive PE with RV strain and raised troponin (risk-stratify); interpreting right-heart signs.

### Concept: Interstitial lung disease and right heart failure
Chronic interstitial lung disease (pulmonary fibrosis) causes progressive hypoxia and pulmonary vascular remodelling, leading to group-3 pulmonary hypertension and right heart failure with peripheral oedema and a raised JVP. The trap is attributing the oedema to left heart failure and diuresing/treating accordingly; the primary lesion is pulmonary, and management centres on oxygen and treating the lung disease, with cautious diuresis. Interpreting the right-sided signs requires the pulmonary diagnosis. Presentations: an ILD patient with new leg oedema; distinguishing cor pulmonale from left heart failure; the role of oxygen versus diuretics.
