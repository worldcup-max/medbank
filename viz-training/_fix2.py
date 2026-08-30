#!/usr/bin/env python3
# Gross audit pass 2 — the false absence claims, and three labels that name the wrong object.
#
# A gap note that says "the catalog has no X" when the catalog has X is worse than no note:
# it is the reason nobody fetched the mesh, and it propagates — run 17's "no ligament at all"
# was still being quoted at run 18. Each of these was verified with a catalog lookup.
import io, json, sys, os

R = sys.argv[1] if len(sys.argv) > 1 else '.'
S = os.path.join(R, 'scenes')

FIX = [
 # ---- false absence claims ----
 ('gross__axilla-brachial-plexus__brachial-plexus',
  "Scalenus anterior, scalenus medius and the axillary artery have no entry in the catalog either; the first rib and clavicle do, which is one more reason to expect a 3D version of this scene eventually.",
  "The axillary artery has no entry in the catalog. Scalenus anterior (FMA13392) and scalenus medius (FMA13390) DO — an earlier note here said they did not, because the search used the spelling 'scalene' and the catalog spells it 'scalenus'. With the first rib and the clavicle, which also exist, the interscalene groove this scene teaches in beat 1 is renderable in 3D today, which is a reason to revisit the diagram routing rather than a reason to defer it."),

 ('gross__forearm-hand__flexor-compartment',
  "There is no mesh for the common flexor origin, the bicipital aponeurosis, the antebrachial fascia or the interosseous membrane, so those attachments and boundaries are described rather than shown.",
  "There is no mesh for the common flexor origin, the bicipital aponeurosis or the antebrachial fascia, so those attachments are described rather than shown. The interosseous membrane is NOT missing — FMA23707 is in the catalog and is authored as a part of the Radius & ulna scene — and it is the boundary this compartment is defined by, so it should be added here."),

 ('gross__forearm-hand__flexor-compartment',
  "Only the middle finger is present as phalanges, so the four-tendon fan of superficialis and profundus is shown on one digit and described for the rest.",
  "Only the middle finger is drawn as phalanges, so the four-tendon fan of superficialis and profundus is shown on one digit and described for the rest. That is a choice, not a limit: the catalog holds the proximal, middle and distal phalanges of all four fingers, and adding them would let the fan be shown on every digit the beat talks about."),

 ('gross__forearm-hand__extensor-compartment',
  "There is no mesh for the common extensor origin, the extensor expansions on the fingers, or the interosseous membrane, so the shared origin and the finger insertions are described rather than shown.",
  "There is no mesh for the common extensor origin or the extensor expansions on the fingers, so the shared origin and the finger insertions are described rather than shown. The interosseous membrane exists — FMA23707 — and beat 3 already narrates 'the membrane between them', so it should be drawn rather than described."),

 ('gross__leg-foot__gastrocnemius-soleus',
  "The deep fascia of the leg and the interosseous membrane are not modelled, so the walls that make the posterior compartments a closed box are described in the cross-section beat rather than drawn. This weakens the compartment-syndrome teaching more than any other gap in the scene.",
  "The deep fascia of the leg and the intermuscular septa are not modelled, so two of the walls that make the posterior compartments a closed box are described in the cross-section beat rather than drawn. The interosseous membrane is not one of them: FMA35192 is in the catalog and is authored in both the Tibia & fibula and Ankle joint scenes, so the fourth wall can be drawn here and should be."),

 ('gross__leg-foot__gastrocnemius-soleus',
  "There are no veins of the lower limb in the catalog.",
  "There is no vein of the lower limb below the external iliac in the catalog."),

 ('gross__thigh__femur',
  "There are no ligaments in the catalog.",
  "No ligament of the knee exists in the catalog — the only ligaments in it are the inguinal and the long plantar."),

 ('gross__gluteal-region-hip-joint__sciatic-nerve',
  "The sensory territory of the nerve cannot be shown: there is no skin model, so beats 8 and 9 describe the numb areas rather than lighting them.",
  "The sensory territory of the nerve cannot be shown. The only skin in the catalog is FMA7163, a single whole-body mesh with no regional divisions, so a dermatome patch cannot be lit on it and beats 8 and 9 describe the numb areas instead."),

 ('gross__thoracic-wall-diaphragm__intercostal-muscles',
  "Subcostal muscles and levatores costarum are not in the catalog and are not shown. They are minor, but their absence is why the posterior part of the wall looks thinner here than it is.",
  "Subcostal muscles are not in the catalog and are not shown. Levatores costarum ARE — FMA74075 and FMA74077 on the right, FMA74076 and FMA74078 on the left, as longi and breves sets — and an earlier note here wrongly said otherwise, which is why the posterior part of the wall looks thinner than it is. They should be added."),

 ('gross__leg-foot__arches-of-the-foot',
  "adductor hallucis exists only as its two separate heads, and the interossei appear as sets rather than individually, so the layered anatomy of the sole is summarised in the peel beat rather than shown layer by layer.",
  "and adductor hallucis exists only as its two separate heads, so the layered anatomy of the sole is summarised in the peel beat rather than shown layer by layer. The three plantar interossei do exist individually (FMA37741, FMA37743, FMA37745) and could carry the fourth layer; it is the dorsal interossei of the foot that have no meshes."),

 ('gross__leg-foot__arches-of-the-foot',
  "There is no model of the fibro-fatty heel pad or of the skin, so the covering that actually takes ground contact is described only.",
  "There is no model of the fibro-fatty heel pad, and the only skin in the catalog is one undivided whole-body mesh, so the covering that actually takes ground contact is described only."),

 ('gross__anterior-abdominal-wall-inguinal-region__inguinal-canal',
  "The spermatic cord, the vas deferens, the pampiniform plexus, the cremaster, the transversalis fascia, the conjoint tendon and the lacunar ligament are all absent.",
  "The spermatic cord, the pampiniform plexus, the cremaster, the transversalis fascia, the conjoint tendon and the lacunar ligament are all absent. The vas deferens is not: the catalog carries it as 'right deferent duct' FMA19235 and 'left deferent duct' FMA19236, and searching for 'vas deferens' rather than the catalog's own name is why three scenes recorded it as missing. It is the principal content of the cord and should be drawn."),

 ('gross__kidney-posterior-abdominal-wall__ureters',
  "There is no vas deferens in the catalog either, so the male counterpart of that crossing is narrated against the seminal vesicle and prostate.",
  "The male counterpart of that crossing is narrated against the seminal vesicle and prostate. It need not be: the vas is in the catalog under the name 'right deferent duct' (FMA19235), and adding it would let the vas-crosses-ureter relation be shown rather than described."),

 ('gross__pelvis-perineum__internal-reproductive-organs',
  "No vas deferens or ductus deferens mesh, which is the single most damaging omission here for the male half.",
  "The vas deferens is drawn nowhere in this scene, and it is the single most damaging omission for the male half. It is NOT absent from the catalog — 'right deferent duct' FMA19235 and 'left deferent duct' FMA19236 are both there, and were missed because the search used the clinical name rather than the catalog's."),

 ('gross__stomach-intestines__small-intestine',
  "There is no caecum and no colon of any kind in the catalog — 934 models and not one large-bowel mesh apart from the appendix and the rectum.",
  "There is no caecum and no colon wall of any kind in the catalog. The large-gut meshes that do exist are the three taeniae coli (FMA76891, FMA76892, FMA76893), the appendix, the rectum and the external anal sphincter — an earlier version of this note said only the appendix and the rectum, which the Large intestine scene disproved.")
  ,
 ('gross__stomach-intestines__gut-blood-supply',
  "Only the mesocolic taenia exists.",
  "The only large-gut meshes are the three taeniae coli, FMA76891, FMA76892 and FMA76893 — which, since they run the whole length of the colon, would let a 3D version trace the marginal artery along the bowel's actual course."),

 ('gross__back-vertebral-column__vertebral-column',
  "Only the five lumbar discs are included, as context for the load and cross-section beats. The full set of cervical and thoracic discs exists in the catalog and can be added without changing any op.",
  "All twenty-three intervertebral discs are included, C2/3 to L5/S1. An earlier version of this scene carried only the five lumbar ones and this note still said so after they were added."),

 ('gross__thoracic-wall-diaphragm__diaphragm',
  "The costal origin from ribs 7 to 10 is represented by ribs 11 and 12 plus the costal cartilages, to keep the scene readable. Ribs 7 to 10 exist in the catalog and could be added if the origin needs to be traced rib by rib.",
  "The costal origin from ribs 7 to 12 is represented by ribs 11 and 12 plus the costal cartilages, to keep the scene readable. Ribs 7 to 10 exist in the catalog and could be added if the origin needs to be traced rib by rib."),

 ('gross__anterior-abdominal-wall-inguinal-region__inguinal-canal',
  "Every wall in this scene is a real model.",
  "Three of the four walls are real models. The posterior wall is transversalis fascia, which has no mesh at all, so it is narrated over the muscles in front of it."),

 # ---- labels naming the wrong object ----
 ('gross__liver-biliary-tract-pancreas-spleen__biliary-tree-gallbladder',
  '"label": "Right ninth costal cartilage — the surface marking"',
  '"label": "Right ninth rib — the surface marking"'),
]

# Two scenes label an upper-lobe mesh as a whole lung. Every other scene in the corpus
# labels these correctly, so this is a slip, not a convention.
LOBE = [
 ('gross__lungs-mediastinum__great-vessels',   'FMA7333', 'Right upper lobe'),
 ('gross__lungs-mediastinum__great-vessels',   'FMA7370', 'Left upper lobe'),
 ('gross__lungs-mediastinum__mediastinum',     'FMA7333', 'Right upper lobe'),
 ('gross__lungs-mediastinum__mediastinum',     'FMA7370', 'Left upper lobe'),
 ('gross__forearm-hand__carpal-tunnel',        'FMA38619', 'Flexor carpi ulnaris — ulnar head'),
]

n = 0
for f, old, new in FIX:
    p = os.path.join(S, f + '.json')
    raw = io.open(p, encoding='utf-8').read()
    if old not in raw:
        print('MISS  %s\n      %s' % (f, old[:80])); sys.exit(1)
    io.open(p, 'w', encoding='utf-8', newline='').write(raw.replace(old, new, 1))
    n += 1
    print('fixed %-56s %s' % (f[:56], old[:46]))

for f, mid, label in LOBE:
    p = os.path.join(S, f + '.json')
    sc = json.load(io.open(p, encoding='utf-8'))
    hit = 0
    for st in sc['structures']:
        if (st.get('refs') or {}).get('bodyparts3d') == mid:
            print('label %-56s %-22s %r -> %r' % (f[:56], mid, st.get('label'), label))
            st['label'] = label; hit += 1
    if hit != 1:
        print('MISS  %s %s matched %d' % (f, mid, hit)); sys.exit(1)
    io.open(p, 'w', encoding='utf-8', newline='').write(json.dumps(sc, ensure_ascii=False, indent=2) + '\n')
    n += 1

print('\n%d corrections applied.' % n)
