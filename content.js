window.MEDBANK = {
 "subjects": [
  {
   "id": "pediatrics",
   "folder": "Pediatrics",
   "name": "Pediatrics",
   "short": "PED",
   "lecturers": [
    {
     "id": "pediatrics-dr-example",
     "name": "Dr Example",
     "topics": [
      {
       "id": "pediatrics-dr-example-neonatal-jaundice",
       "name": "Neonatal Jaundice",
       "note": "# Neonatal Jaundice\n\n## Definition\nNeonatal jaundice is the yellowish discoloration of the skin, sclera, and mucous membranes in a newborn, caused by raised levels of bilirubin in the blood (hyperbilirubinaemia). It becomes clinically visible when serum bilirubin exceeds roughly 85 micromol/L (5 mg/dL).\n\n## Bilirubin Metabolism (why it happens)\nBilirubin is the breakdown product of haem, mostly from old red blood cells. In the newborn:\n\n- Red cell lifespan is shorter (70–90 days vs 120 in adults), so more haem is broken down.\n- The liver enzyme **UDP-glucuronosyltransferase (UGT)**, which conjugates bilirubin to make it water-soluble, is immature at birth.\n- The gut has increased **enterohepatic circulation**, reabsorbing bilirubin back into the blood.\n\nTogether these make newborns prone to a temporary rise in unconjugated (indirect) bilirubin.\n\n## Classification\n1. **Physiological jaundice** — appears after 24 hours, peaks day 3–5, resolves by day 14. Benign, unconjugated.\n2. **Pathological jaundice** — any of: appears within the first 24 hours, bilirubin rising fast (>85 micromol/L/day), conjugated fraction high, or persisting beyond 14 days. Always needs a cause.\n\n## Causes by timing\n- **< 24 hours:** always pathological — haemolysis (Rhesus or ABO incompatibility, G6PD deficiency), congenital infection.\n- **24 hours – 14 days:** physiological, breastfeeding jaundice, sepsis, polycythaemia, bruising/cephalhaematoma.\n- **> 14 days (prolonged):** breast-milk jaundice, hypothyroidism, biliary atresia (conjugated — a surgical emergency), UTI, galactosaemia.\n\n## Clinical assessment\nAssess in good natural light. Jaundice progresses **cephalocaudally** (face first, then trunk, then limbs — Kramer's rule), so palms and soles being yellow indicates severe jaundice. Always measure bilirubin objectively — transcutaneous or serum — rather than relying on the eye.\n\n## Complication: Kernicterus\nUnconjugated bilirubin is fat-soluble and can cross the immature blood–brain barrier, depositing in the basal ganglia. This causes **acute bilirubin encephalopathy** (lethargy, poor feeding, high-pitched cry, hypertonia, opisthotonus) which can progress to **kernicterus** — permanent choreoathetoid cerebral palsy, sensorineural hearing loss, and gaze palsy. This is the outcome all treatment aims to prevent.\n\n## Management\n- **Phototherapy:** blue light (450–460 nm) converts bilirubin to water-soluble isomers excreted without conjugation. First-line, guided by age-specific threshold charts.\n- **Exchange transfusion:** for dangerously high or rapidly rising levels, or signs of encephalopathy.\n- **Treat the cause:** antibiotics for sepsis, surgery for biliary atresia, etc.\n- **IV immunoglobulin** in isoimmune haemolytic disease.\n\n## Key takeaways\nPhysiological jaundice is common and benign; the job is to spot the pathological patterns (first 24 hours, prolonged, or conjugated) and to prevent kernicterus.\n",
       "simplified": "# Neonatal Jaundice — Simplified\n\n**In one line:** baby turns yellow because bilirubin builds up in the blood.\n\n**Where bilirubin comes from:** old red blood cells break down → haem → bilirubin. Newborns make lots of it (their red cells die faster) and their liver is too immature to clear it fast. So it piles up.\n\n**Two kinds:**\n- **Normal (physiological):** shows up *after* day 1, peaks around day 3–5, gone by 2 weeks. No treatment usually.\n- **Not normal (pathological):** shows up in the *first 24 hours*, OR climbs very fast, OR lasts *beyond 2 weeks*. Always hunt for a cause.\n\n**Quick memory hook for timing:**\n- Day 1 = danger (haemolysis, infection)\n- Day 2–14 = usually normal\n- After 14 days = check for biliary atresia and hypothyroidism\n\n**How to check:** look in good light. Yellow spreads top-to-bottom (face → chest → legs). Yellow palms and soles = severe. Always confirm with a bilirubin measurement, not just your eyes.\n\n**Why we worry — kernicterus:** if bilirubin gets very high it crosses into the brain and causes permanent damage (cerebral palsy, deafness). Preventing this is the whole point of treatment.\n\n**Treatment:**\n- **Phototherapy** (blue light) — first thing we do. Light changes bilirubin into a form the baby can pee/poo out.\n- **Exchange transfusion** — for very high or dangerous levels.\n- **Fix the cause** — antibiotics if infection, surgery if biliary atresia.\n",
       "pdf": "content/Pediatrics/Dr%20Example/Neonatal%20Jaundice/note.pdf",
       "primer": [
        {
         "q": "What is neonatal jaundice?",
         "lecturer": "Yellowish discoloration of the skin, sclera and mucous membranes of a newborn due to raised serum bilirubin (hyperbilirubinaemia). Clinically visible above ~85 micromol/L (5 mg/dL).",
         "explain": "Start with the colour itself. Bilirubin is a yellow pigment, so when it accumulates in blood it stains tissues rich in elastin — sclera and skin — which is why the eyes often look yellow before the skin does.\n\nWhy the 85 micromol/L threshold? Below that, the pigment is present but too dilute for the human eye to detect against skin tone. So 'jaundice' is not the same as 'raised bilirubin' — every newborn has some rise; jaundice is simply the point at which that rise becomes visible. This distinction matters for the rest of the topic: your eyes are a late and unreliable detector, which is why we measure bilirubin rather than judge it.",
         "tie": "This definition sets up the whole lecture: everything that follows is about (1) why bilirubin rises in newborns specifically, and (2) how high is too high."
        },
        {
         "q": "Where does bilirubin come from, and why do newborns produce so much of it?",
         "lecturer": "Bilirubin is the breakdown product of haem, mostly from senescent red blood cells. Newborn red cell lifespan is 70–90 days versus 120 days in adults, so haem turnover is higher.",
         "explain": "Follow the chain backwards. Red cells die → haemoglobin is released → the globin (protein) is recycled, and the haem ring is opened by haem oxygenase into biliverdin → biliverdin reductase converts it to bilirubin.\n\nNow, why is the newborn different? Two reasons flow from fetal life. In the womb, oxygen tension is low, so the fetus compensates by carrying a high haematocrit packed with fetal haemoglobin. At birth the baby starts breathing air, oxygen tension jumps, and that surplus of red cells is suddenly unnecessary — so it is broken down. On top of this, fetal red cells are intrinsically shorter-lived.\n\nSo the newborn is simultaneously destroying an excess red cell mass AND destroying it faster than an adult would. The result is roughly twice the adult bilirubin production per kilogram.",
         "tie": "This is the 'supply' side of the equation. The next card covers the 'clearance' side — and jaundice happens because supply is high at exactly the moment clearance is weakest."
        },
        {
         "q": "Why is the newborn liver unable to clear bilirubin efficiently?",
         "lecturer": "The hepatic enzyme UDP-glucuronosyltransferase (UGT), which conjugates bilirubin, is immature at birth. There is also increased enterohepatic circulation of bilirubin in the newborn gut.",
         "explain": "Bilirubin coming from haem is unconjugated — fat-soluble, and therefore cannot be excreted in urine or bile. To get rid of it, the liver must attach glucuronic acid to it (conjugation) using UGT, which makes it water-soluble so it can go into bile and out through the gut.\n\nIn utero the fetus doesn't need this enzyme — the placenta clears fetal bilirubin using the mother's liver. So there is no evolutionary pressure to have UGT switched on before birth, and it only reaches adult activity around 6–14 weeks of age. The baby is therefore born with a clearance system running at a fraction of capacity.\n\nThe gut compounds it. Conjugated bilirubin reaching the intestine is normally converted by gut bacteria into urobilinogen and excreted. But a newborn gut is sterile at birth and has high levels of beta-glucuronidase, an enzyme that strips the glucuronic acid back off — reconverting it to unconjugated bilirubin, which is then reabsorbed into the blood. This loop is the enterohepatic circulation.",
         "tie": "Combine this card with the previous one and you have the complete mechanism: high production + low conjugation + reabsorption from the gut = the transient rise we call physiological jaundice."
        },
        {
         "q": "What is physiological jaundice, and what is its typical time course?",
         "lecturer": "Jaundice appearing after 24 hours of life, peaking on day 3–5, and resolving by day 14. It is unconjugated and benign.",
         "explain": "Every feature of this definition is explained by the mechanism above, which is why the timing is so useful clinically.\n\nWhy after 24 hours? Because it takes time for bilirubin to accumulate to a visible level from a normal rate of production. Anything visible in the first day means production is abnormally fast — i.e. haemolysis — not normal physiology.\n\nWhy peak at day 3–5? That is the point where the accumulated load is greatest and the liver has not yet caught up.\n\nWhy resolve by day 14? By then UGT activity has risen substantially and gut flora have colonised the intestine, breaking the enterohepatic loop. Jaundice persisting past 14 days means one of these normal processes has failed or something else is going on.\n\nSo physiological jaundice isn't a diagnosis you make by looking — it is a diagnosis you make by the timing fitting the physiology.",
         "tie": "This is the reference pattern. Pathological jaundice is defined entirely as deviation from it."
        },
        {
         "q": "What features make jaundice pathological rather than physiological?",
         "lecturer": "Onset within the first 24 hours; rapid rise (>85 micromol/L per day); a raised conjugated fraction; or persistence beyond 14 days.",
         "explain": "Each criterion is a mechanistic red flag, not an arbitrary cut-off.\n\n**First 24 hours** — normal production cannot reach visible levels this fast. Something is destroying red cells rapidly: Rhesus or ABO incompatibility, G6PD deficiency, or congenital infection.\n\n**Rapid rise** — the same logic expressed as a rate. Even if it started on day 2, a steep slope means production is outstripping physiology.\n\n**Raised conjugated fraction** — this one is qualitatively different. Conjugated bilirubin means the liver DID do its job, so the problem is downstream: the bile cannot get out. That points to obstruction, above all biliary atresia, which must be operated on within the first 8 weeks to save the liver. This is why 'is it conjugated?' is the single most important laboratory question in a jaundiced baby.\n\n**Beyond 14 days** — the normal resolving mechanisms should have taken over by now. Causes include hypothyroidism, breast-milk jaundice, UTI, and again biliary atresia.",
         "tie": "These four criteria are the practical filter the lecture is building towards: they convert 'this baby is yellow' into 'this baby needs investigation'."
        },
        {
         "q": "List the causes of jaundice by age of onset.",
         "lecturer": "<24 hours: haemolysis (Rh/ABO incompatibility, G6PD deficiency), congenital infection. 24 hours–14 days: physiological, breastfeeding jaundice, sepsis, polycythaemia, bruising/cephalhaematoma. >14 days: breast-milk jaundice, hypothyroidism, biliary atresia, UTI, galactosaemia.",
         "explain": "Don't memorise three lists — derive them from one idea: at each age, ask what could be adding bilirubin faster or clearing it slower than the normal curve predicts.\n\n**Day 1** must be excess production, because nothing else acts fast enough. Antibody-mediated destruction (Rh, ABO) and enzyme-deficient fragile cells (G6PD) both destroy red cells en masse.\n\n**Days 2–14** is the window where normal physiology already produces jaundice, so causes here are things that *add to* the normal load: extra blood being broken down (a cephalhaematoma is a bruise — trapped red cells being digested; polycythaemia is simply too many cells), or things that impair the liver and increase reabsorption (sepsis, poor feeding in breastfeeding jaundice which slows gut transit).\n\n**Beyond 14 days** the normal causes should be gone, so persistence points to a structural or metabolic block: bile can't get out (biliary atresia), metabolism is globally slowed (hypothyroidism), or a substance in breast milk continues to inhibit conjugation.",
         "tie": "This is where the definition, the mechanism, and the classification come together into an actual diagnostic approach."
        },
        {
         "q": "How is jaundice assessed clinically, and what is Kramer's rule?",
         "lecturer": "Assess in good natural light. Jaundice progresses cephalocaudally — face first, then trunk, then limbs (Kramer's rule). Yellow palms and soles indicate severe jaundice. Always confirm with transcutaneous or serum bilirubin.",
         "explain": "Why head-to-toe? Bilirubin binds to albumin in plasma and deposits in tissue as levels rise. The head is best perfused, so it stains first; the extremities are perfused last and least, so they only stain once levels are high enough to saturate everything proximal. That is why the palms and soles becoming yellow is a late and alarming sign — the gradient has run its whole course.\n\nWhy insist on measuring? Because visual assessment is unreliable in exactly the situations that matter: darker skin tones, artificial or fluorescent lighting, and anaemia (which pales the skin and masks the yellow). Kramer's rule tells you roughly how worried to be and how fast to act — it does not give you a number to plot against a treatment threshold.",
         "tie": "This links the pathophysiology to the bedside, and explains why the management section is built around measured levels rather than appearance."
        },
        {
         "q": "What is kernicterus, and why does unconjugated bilirubin cause it?",
         "lecturer": "Unconjugated bilirubin is fat-soluble and crosses the immature blood–brain barrier, depositing in the basal ganglia. Acute bilirubin encephalopathy presents with lethargy, poor feeding, high-pitched cry, hypertonia and opisthotonus, and can progress to kernicterus — permanent choreoathetoid cerebral palsy, sensorineural hearing loss and gaze palsy.",
         "explain": "This is the reason the whole topic exists. Follow the chemistry: unconjugated bilirubin is lipid-soluble, and cell membranes are lipid — so it can cross into tissue that water-soluble conjugated bilirubin cannot reach. Normally albumin binds it and keeps it in the circulation, but once binding sites are saturated (or displaced by acidosis, sepsis, prematurity, or certain drugs) free bilirubin is available to cross the neonatal blood–brain barrier, which is more permeable than an adult's.\n\nWhy the basal ganglia specifically? These are metabolically very active, richly perfused nuclei, so they take up the greatest bilirubin load — and 'kernicterus' literally means 'nuclear jaundice', from the yellow staining of these nuclei seen at autopsy.\n\nThe clinical picture follows the anatomy: basal ganglia damage produces the movement disorder (choreoathetoid cerebral palsy), the auditory pathway is unusually vulnerable (deafness), and the oculomotor nuclei give the gaze palsy — classically upward gaze.\n\nNote also the crucial asymmetry: conjugated bilirubin does NOT cause kernicterus, because it can't cross the barrier. So conjugated jaundice is dangerous for a completely different reason (the underlying obstruction), not because of brain injury.",
         "tie": "Everything in the management section is a means to one end: keeping unconjugated bilirubin below the level at which this happens."
        },
        {
         "q": "How does phototherapy work, and when is it used?",
         "lecturer": "Blue light at 450–460 nm converts bilirubin into water-soluble isomers that can be excreted without conjugation. It is first-line treatment, guided by age-specific threshold charts.",
         "explain": "Phototherapy is elegant because it bypasses the exact step the newborn cannot perform. Rather than waiting for an immature liver to conjugate bilirubin, light energy does the solubilising directly.\n\nWhy 450–460 nm? That is the peak absorption wavelength of bilirubin — the pigment is yellow precisely because it absorbs blue light. Energy absorbed at this wavelength drives photoisomerisation (bilirubin is rearranged into lumirubin and configurational isomers) which are water-soluble and can go straight out in bile and urine, no UGT required.\n\nThis explains the practical rules: maximise exposed skin area, minimise distance from the lamp, and cover the eyes (the retina is light-sensitive tissue, not because bilirubin is there).\n\nWhy age-specific charts rather than one number? Because the threshold for danger changes by the hour in the first days of life and is lower in premature or sick babies, whose albumin binding and blood–brain barrier are both weaker. A level of 250 micromol/L at 12 hours old is far more worrying than the same level at day 4.",
         "tie": "This is the direct therapeutic answer to the mechanism described in the metabolism cards — treat by replacing the missing step."
        },
        {
         "q": "When is exchange transfusion indicated, and what other treatments are used?",
         "lecturer": "Exchange transfusion is used for dangerously high or rapidly rising bilirubin, or signs of encephalopathy. Other measures: treat the underlying cause (antibiotics for sepsis, surgery for biliary atresia), and IV immunoglobulin in isoimmune haemolytic disease.",
         "explain": "Exchange transfusion is the emergency option because it is the only one that removes bilirubin immediately. The baby's blood is replaced in small aliquots with donor blood: this physically removes bilirubin from the circulation, removes the maternal antibody that is driving haemolysis, and removes the antibody-coated red cells that would otherwise continue to break down. Phototherapy, by contrast, works over hours — too slow when there are already neurological signs.\n\nIV immunoglobulin fits between the two. In Rh or ABO disease the destruction is antibody-mediated: maternal IgG coats fetal red cells, which are then engulfed via Fc receptors on splenic macrophages. Flooding the system with non-specific immunoglobulin saturates those Fc receptors, so the coated cells are not destroyed as fast. It slows the production of bilirubin, and can avert the need for exchange transfusion.\n\nAnd treating the cause is not optional background work: in biliary atresia, phototherapy is useless (the bilirubin is conjugated), and only surgery within the first weeks preserves the liver.",
         "tie": "This closes the loop of the lecture: prevent kernicterus by reducing production (IVIG), enhancing clearance (phototherapy), removing bilirubin outright (exchange), or fixing the cause."
        }
       ],
       "recall": [
        {
         "q": "Define neonatal jaundice.",
         "a": "Yellowish discoloration of skin, sclera and mucous membranes in a newborn due to raised serum bilirubin (hyperbilirubinaemia)."
        },
        {
         "q": "At roughly what serum bilirubin level does jaundice become clinically visible?",
         "a": "About 85 micromol/L (5 mg/dL)."
        },
        {
         "q": "What is bilirubin a breakdown product of?",
         "a": "Haem, mostly from senescent red blood cells."
        },
        {
         "q": "What is the newborn red cell lifespan compared to an adult's?",
         "a": "70–90 days in the newborn versus 120 days in the adult."
        },
        {
         "q": "Which hepatic enzyme conjugates bilirubin, and what is its state at birth?",
         "a": "UDP-glucuronosyltransferase (UGT); it is immature/low at birth."
        },
        {
         "q": "Why does increased enterohepatic circulation raise bilirubin in newborns?",
         "a": "Gut beta-glucuronidase deconjugates bilirubin, which is then reabsorbed into the blood."
        },
        {
         "q": "Define physiological jaundice by its time course.",
         "a": "Appears after 24 hours, peaks day 3–5, resolves by day 14; unconjugated and benign."
        },
        {
         "q": "List the four features that make jaundice pathological.",
         "a": "Onset within the first 24 hours; rapid rise (>85 micromol/L/day); raised conjugated fraction; persistence beyond 14 days."
        },
        {
         "q": "Give the causes of jaundice presenting within the first 24 hours.",
         "a": "Haemolysis (Rh or ABO incompatibility, G6PD deficiency) and congenital infection."
        },
        {
         "q": "Give causes of jaundice presenting between 24 hours and 14 days.",
         "a": "Physiological, breastfeeding jaundice, sepsis, polycythaemia, and bruising/cephalhaematoma."
        },
        {
         "q": "Give causes of prolonged jaundice (>14 days).",
         "a": "Breast-milk jaundice, hypothyroidism, biliary atresia, UTI, and galactosaemia."
        },
        {
         "q": "Which prolonged-jaundice cause is a surgical emergency, and why?",
         "a": "Biliary atresia — it is conjugated (obstructive) and needs surgery within the first weeks to preserve the liver."
        },
        {
         "q": "What is Kramer's rule?",
         "a": "Jaundice progresses cephalocaudally — face first, then trunk, then limbs."
        },
        {
         "q": "What does yellowing of the palms and soles indicate?",
         "a": "Severe jaundice (high bilirubin level)."
        },
        {
         "q": "Why must bilirubin be measured rather than judged by eye?",
         "a": "Visual assessment is unreliable with darker skin, artificial light, and anaemia; confirm with transcutaneous or serum bilirubin."
        },
        {
         "q": "What is kernicterus?",
         "a": "Permanent brain injury from unconjugated bilirubin deposition in the basal ganglia — choreoathetoid cerebral palsy, sensorineural hearing loss and gaze palsy."
        },
        {
         "q": "Why can unconjugated (not conjugated) bilirubin cause kernicterus?",
         "a": "It is fat-soluble and crosses the immature blood–brain barrier; conjugated bilirubin is water-soluble and cannot."
        },
        {
         "q": "List features of acute bilirubin encephalopathy.",
         "a": "Lethargy, poor feeding, high-pitched cry, hypertonia and opisthotonus."
        },
        {
         "q": "How does phototherapy work and what wavelength is used?",
         "a": "Blue light at 450–460 nm photoisomerises bilirubin into water-soluble forms excreted without conjugation."
        },
        {
         "q": "When is exchange transfusion indicated?",
         "a": "Dangerously high or rapidly rising bilirubin, or signs of encephalopathy."
        },
        {
         "q": "What is the role of IV immunoglobulin in neonatal jaundice?",
         "a": "In isoimmune haemolytic disease it saturates Fc receptors, slowing antibody-mediated red cell destruction and bilirubin production."
        }
       ]
      }
     ],
     "topicCount": 1
    }
   ],
   "topicCount": 1,
   "cardCount": 31
  },
  {
   "id": "og",
   "folder": "OG",
   "name": "Obstetrics & Gynaecology",
   "short": "O&G",
   "lecturers": [],
   "topicCount": 0,
   "cardCount": 0
  },
  {
   "id": "community-medicine",
   "folder": "Community Medicine",
   "name": "Community Medicine",
   "short": "COM",
   "lecturers": [],
   "topicCount": 0,
   "cardCount": 0
  }
 ],
 "stats": {
  "topics": 1,
  "primerCards": 10,
  "recallCards": 21,
  "lecturers": 1
 }
};
