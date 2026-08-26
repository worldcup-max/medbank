# Seed Content Manifest (TEMPORARY — remove after Integrated Mode gate test)

Created in frankthewiz1's account to give the integration pipeline genuine cross-domain
source material. All topics titled "... (SEED)". Course: 5b5395c8-ca3d-4bfe-8a56-e10aaca35181.

Remove these topics (and their cards + integrated_items) when done.

| Family | Topic title | topic_id |
|---|---|---|
| cardio_renal | Cardiorenal Syndrome (SEED) | 7a0dfd0f-b5b9-458c-8a8f-a3c04b558769 |
| endocrine_renal | Diabetic Nephropathy (SEED) | 0e83ec30-f1a4-45c5-b434-66a0d945cc19 |
| cardio_endocrine | Diabetes and Heart Failure (SEED) | fc0a940d-b84e-45e4-81e9-339f52546ca4 |
| pregnancy_cardio | Peripartum Cardiomyopathy and Preeclampsia (SEED) | 5d8cf4d8-c86b-4703-988e-284b7fbcb4f0 |
| resp_cardiac | Cor Pulmonale (SEED) | 09a42cbc-b424-42d7-abfc-a0799c803aab |
| neuro_endocrine | SIADH, Hyponatremia and Seizures (SEED) | 61b44e62-36f7-4e03-9b86-6e0ee03eaf23 |
| hepatic_pharm | Cirrhosis and Drug Metabolism (SEED) | d5cb1820-3ee3-41af-9ecd-0b542e461a4e |
| onco_haem | Acute Leukemia and Tumor Lysis Syndrome (SEED) | 256cd0cb-278c-4401-b2a8-cb48564c2658 |
| gi_hepatic | Cirrhosis: Variceal Bleeding and Encephalopathy (SEED) | 541da27c-3f93-495c-9ed8-0d11efa554e5 |
| infect_immunology | Sepsis and the Dysregulated Immune Response (SEED) | 8a41807e-7c1d-478b-9c4b-64fff8c34c7c |

## Removal SQL (run when done)
```sql
-- integrated_items sourced from seed questions get cleared with the non-approved purge;
-- to remove the seed lectures themselves:
delete from cards where topic_id in (
 '7a0dfd0f-b5b9-458c-8a8f-a3c04b558769','0e83ec30-f1a4-45c5-b434-66a0d945cc19',
 'fc0a940d-b84e-45e4-81e9-339f52546ca4','5d8cf4d8-c86b-4703-988e-284b7fbcb4f0',
 '09a42cbc-b424-42d7-abfc-a0799c803aab','61b44e62-36f7-4e03-9b86-6e0ee03eaf23',
 'd5cb1820-3ee3-41af-9ecd-0b542e461a4e','256cd0cb-278c-4401-b2a8-cb48564c2658',
 '541da27c-3f93-495c-9ed8-0d11efa554e5','8a41807e-7c1d-478b-9c4b-64fff8c34c7c');
delete from topics where id in (
 '7a0dfd0f-b5b9-458c-8a8f-a3c04b558769','0e83ec30-f1a4-45c5-b434-66a0d945cc19',
 'fc0a940d-b84e-45e4-81e9-339f52546ca4','5d8cf4d8-c86b-4703-988e-284b7fbcb4f0',
 '09a42cbc-b424-42d7-abfc-a0799c803aab','61b44e62-36f7-4e03-9b86-6e0ee03eaf23',
 'd5cb1820-3ee3-41af-9ecd-0b542e461a4e','256cd0cb-278c-4401-b2a8-cb48564c2658',
 '541da27c-3f93-495c-9ed8-0d11efa554e5','8a41807e-7c1d-478b-9c4b-64fff8c34c7c');
```
