/* med-voice.mjs — STRICT medical pronunciation for every TTS clip.
 *
 * Two engines, two mechanisms, but NOTHING skips pronunciation prep:
 *   • Kokoro  → inline IPA via Markdown-link syntax  [word](/ipa/)   (exact phonemes)
 *   • Fish / OpenAI (no IPA support) → phonetic RESPELLING  e.g. "koh-luh-sis-TEK-tuh-mee"
 *
 * ttsClip() in server.mjs runs kokoroPrep() or sayPrep() on EVERY clip before it is
 * spoken, so a medical term can never be mispronounced through an un-prepped path.
 * Grow MED_IPA / MED_SAY whenever you hear a term said wrong. */

/* ---- IPA for Kokoro (American English) ---- */
export const MED_IPA = {
  "pneumonia":"nuˈmoʊniə","pneumothorax":"ˌnuməˈθɔːræks","dyspnoea":"dɪspˈniːə","dyspnea":"dɪspˈniːə",
  "haemoptysis":"hɪˈmɒptɪsɪs","hemoptysis":"hɪˈmɒptɪsɪs","haemorrhage":"ˈhɛmərɪdʒ","hemorrhage":"ˈhɛmərɪdʒ",
  "asthma":"ˈæzmə","bronchiolitis":"ˌbrɒŋkiəˈlaɪtɪs","bronchiectasis":"ˌbrɒŋkiˈɛktəsɪs","pertussis":"pərˈtʌsɪs",
  "empyema":"ˌɛmpaɪˈiːmə","pleurisy":"ˈplʊərɪsi","angina":"ænˈdʒaɪnə","ischaemia":"ɪsˈkiːmiə","ischemia":"ɪsˈkiːmiə",
  "myocardial":"ˌmaɪəˈkɑːrdiəl","infarction":"ɪnˈfɑːrkʃən","tachycardia":"ˌtækɪˈkɑːrdiə","bradycardia":"ˌbrædɪˈkɑːrdiə",
  "arrhythmia":"əˈrɪðmiə","cyanosis":"ˌsaɪəˈnoʊsɪs","aneurysm":"ˈænjərɪzəm","atheroma":"ˌæθəˈroʊmə",
  "cholecystectomy":"ˌkoʊlɪsɪsˈtɛktəmi","cholecystitis":"ˌkoʊlɪsɪsˈtaɪtɪs","cholangitis":"ˌkoʊlænˈdʒaɪtɪs",
  "jaundice":"ˈdʒɔːndɪs","bilirubin":"ˌbɪlɪˈruːbɪn","hepatomegaly":"ˌhɛpətoʊˈmɛɡəli","cirrhosis":"sɪˈroʊsɪs",
  "dysphagia":"dɪsˈfeɪdʒə","dyspepsia":"dɪsˈpɛpsiə","diarrhoea":"ˌdaɪəˈriːə","diarrhea":"ˌdaɪəˈriːə",
  "pyloric":"paɪˈlɔːrɪk","peritonitis":"ˌpɛrɪtəˈnaɪtɪs","appendicitis":"əˌpɛndɪˈsaɪtɪs","pancreatitis":"ˌpæŋkriəˈtaɪtɪs",
  "epiglottitis":"ˌɛpɪɡlɒˈtaɪtɪs","laryngotracheobronchitis":"ləˌrɪŋɡoʊˌtreɪkioʊbrɒŋˈkaɪtɪs","meningitis":"ˌmɛnɪnˈdʒaɪtɪs",
  "encephalitis":"ɛnˌsɛfəˈlaɪtɪs","kawasaki":"ˌkɑːwəˈsɑːki","eczema":"ˈɛksɪmə","pruritus":"prʊˈraɪtəs",
  "eclampsia":"ɪˈklæmpsiə","pre-eclampsia":"ˌpriːɪˈklæmpsiə","oxytocin":"ˌɒksɪˈtoʊsɪn","dysmenorrhoea":"dɪsˌmɛnəˈriːə",
  "anaphylaxis":"ˌænəfɪˈlæksɪs","sepsis":"ˈsɛpsɪs","septicaemia":"ˌsɛptɪˈsiːmiə","oedema":"ɪˈdiːmə","edema":"ɪˈdiːmə",
  "nephrotic":"nɛˈfrɒtɪk","nephritis":"nɛˈfraɪtɪs","glomerulonephritis":"ɡloʊˌmɛrjʊloʊnɛˈfraɪtɪs","haematuria":"ˌhiːməˈtjʊəriə",
  "diabetes":"ˌdaɪəˈbiːtiːz","ketoacidosis":"ˌkiːtoʊæsɪˈdoʊsɪs","hypoglycaemia":"ˌhaɪpoʊɡlaɪˈsiːmiə","hyperkalaemia":"ˌhaɪpərkəˈliːmiə",
  "hypokalaemia":"ˌhaɪpoʊkəˈliːmiə","hyponatraemia":"ˌhaɪpoʊnəˈtriːmiə","thyroid":"ˈθaɪrɔɪd","thyrotoxicosis":"ˌθaɪroʊtɒksɪˈkoʊsɪs",
  "adrenal":"əˈdriːnəl","phaeochromocytoma":"ˌfiːoʊˌkroʊmoʊsaɪˈtoʊmə","seizure":"ˈsiːʒər","epilepsy":"ˈɛpɪlɛpsi",
  "salbutamol":"salˈbjuːtəmɒl","paracetamol":"ˌpærəˈsiːtəmɒl","ibuprofen":"ˌaɪbjuːˈproʊfən","amoxicillin":"əˌmɒksɪˈsɪlɪn",
  "ceftriaxone":"ˌsɛftraɪˈæksoʊn","azithromycin":"əˌzɪθroʊˈmaɪsɪn","metronidazole":"ˌmɛtroʊˈnaɪdəzoʊl","furosemide":"fjʊəˈroʊsɪmaɪd",
  "frusemide":"ˈfruːsɪmaɪd","magnesium":"mæɡˈniːziəm","adrenaline":"əˈdrɛnəlɪn","dexamethasone":"ˌdɛksəˈmɛθəzoʊn",
  "warfarin":"ˈwɔːrfərɪn","heparin":"ˈhɛpərɪn","insulin":"ˈɪnsjəlɪn"
};

/* ---- Phonetic respelling for engines that don't take IPA (Fish, OpenAI) ---- */
export const MED_SAY = {
  "cholecystectomy":"koh-luh-sis-TEK-tuh-mee","cholecystitis":"koh-luh-sis-TY-tiss","cholangitis":"koh-lan-JY-tiss",
  "epiglottitis":"ep-ih-glot-EYE-tiss","laryngotracheobronchitis":"luh-ring-go-tray-kee-oh-brong-KY-tiss",
  "glomerulonephritis":"glo-mer-yoo-lo-nef-RY-tiss","phaeochromocytoma":"fee-oh-kro-mo-sy-TOH-muh",
  "ketoacidosis":"kee-toh-ass-ih-DOH-siss","thyrotoxicosis":"thy-ro-tok-sih-KOH-siss","septicaemia":"sep-tih-SEE-mee-uh",
  "hyperkalaemia":"hy-per-kuh-LEE-mee-uh","hypokalaemia":"hy-po-kuh-LEE-mee-uh","hyponatraemia":"hy-po-nuh-TREE-mee-uh",
  "hypoglycaemia":"hy-po-gly-SEE-mee-uh","pre-eclampsia":"pree-ee-KLAMP-see-uh","eclampsia":"ee-KLAMP-see-uh",
  "pneumothorax":"new-mo-THOR-aks","haemoptysis":"hee-MOP-tih-siss","hemoptysis":"hee-MOP-tih-siss",
  "bronchiectasis":"brong-kee-EK-tuh-siss","metronidazole":"met-ro-NY-duh-zohl","ceftriaxone":"sef-try-AK-sohn",
  "azithromycin":"az-ith-ro-MY-sin","furosemide":"fyoo-ROH-suh-mide","dexamethasone":"dek-suh-METH-uh-zohn",
  "kawasaki":"kah-wuh-SAH-kee","oxytocin":"ok-sih-TOH-sin","pruritus":"proo-RY-tuss","salbutamol":"sal-BYOO-tuh-mol"
};

function _rx(keys){
  const t = keys.slice().sort((a,b)=>b.length-a.length).map(k=>k.replace(/[-/\\^$*+?.()|[\]{}]/g,"\\$&"));
  return new RegExp("\\b("+t.join("|")+")\\b","gi");
}
const _rxIpa = _rx(Object.keys(MED_IPA));
const _rxSay = _rx(Object.keys(MED_SAY));

/* Kokoro: wrap known terms with IPA so they are pronounced exactly. */
export function kokoroPrep(text){
  if(!text) return "";
  return String(text).replace(_rxIpa, (m)=>{ const ipa = MED_IPA[m.toLowerCase()]; return ipa ? `[${m}](/${ipa}/)` : m; });
}
/* Fish / OpenAI: swap the hardest terms for a phonetic respelling. */
export function sayPrep(text){
  if(!text) return "";
  return String(text).replace(_rxSay, (m)=>{ const say = MED_SAY[m.toLowerCase()]; return say || m; });
}

export const KOKORO_DEFAULT = {
  A:    process.env.KOKORO_VOICE_A    || "af_heart",
  B:    process.env.KOKORO_VOICE_B    || "am_michael",
  read: process.env.KOKORO_VOICE_READ || "af_heart"
};
