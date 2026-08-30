#!/usr/bin/env python3
# The overnight audit signed 33 gross scenes. Roughly one in three still taught something false.
# These are the corrections. Every edit asserts its target text is present before changing anything.
#
# The pattern behind most of them: the task fixed the INSTANCE, not the FACT. It corrected the
# sentence it was looking at and did not search the file for the other places the same fact appears,
# so three of these are the third copy of an error it had just repaired.
import io, json, sys, os

R = sys.argv[1] if len(sys.argv) > 1 else '.'
S = os.path.join(R, 'scenes')

FIX = [
 # ---- the superficial inguinal ring is MEDIAL to the pubic tubercle, not lateral ----
 # Stated wrongly in three scenes, each of which then teaches the correct hernia rule
 # ("a lump above and medial to the tubercle is inguinal") two paragraphs later.
 ('gross__anterior-abdominal-wall-inguinal-region__inguinal-canal',
  "And a triangular gap in it just above and lateral to the pubic tubercle is the superficial inguinal ring, the way out.",
  "And a triangular gap in it just above and medial to the pubic tubercle is the superficial inguinal ring, the way out. Medial — that is the whole basis of the bedside rule: an inguinal hernia comes out here, above and medial to the tubercle, and a femoral one below and lateral to it."),

 ('gross__anterior-abdominal-wall-inguinal-region__inguinal-canal',
  "The superficial ring is a triangular gap in the external oblique aponeurosis, medial, just above and lateral to the pubic tubercle.",
  "The superficial ring is a triangular gap in the external oblique aponeurosis, medial, just above and medial to the pubic tubercle."),

 ('gross__anterior-abdominal-wall-inguinal-region__flat-abdominal-muscles',
  "A triangular gap in the aponeurosis just above and lateral to the pubic tubercle is the superficial inguinal ring.",
  "A triangular gap in the aponeurosis just above and medial to the pubic tubercle is the superficial inguinal ring."),

 ('gross__anterior-abdominal-wall-inguinal-region__inguinal-ligament-landmarks',
  "A triangular defect in the same aponeurosis just above and lateral to the pubic tubercle is the superficial inguinal ring.",
  "A triangular defect in the same aponeurosis just above and medial to the pubic tubercle is the superficial inguinal ring."),

 # ---- the semilunar valves have no papillary muscles ----
 ('gross__heart-pericardium__heart',
  "Cut it open and the four chambers are defined by their doors: tricuspid and pulmonary on the right, mitral on the left, each held shut by the papillary muscles.",
  "Cut it open and the chambers are defined by their doors. Two kinds. The atrioventricular valves — tricuspid on the right, mitral on the left — are held down by chordae running to the papillary muscles, so they cannot blow back into the atrium. The semilunar valves — pulmonary here, and the aortic, which has no model in this set and sits behind and to its right — have no chordae and no papillary muscles at all; they snap shut on the back-pressure of the blood itself."),

 # ---- the clot of atrial fibrillation forms in the LEFT atrial appendage ----
 # This is the only place in the corpus that states it, so nothing corrects it.
 ('gross__heart-pericardium__heart-chambers',
  "Parallel muscle ridges like the teeth of a comb, in front of the crista and inside the auricle. Blood stagnates between them in atrial fibrillation, which is where the clot of a cardioembolic stroke forms.",
  "Parallel muscle ridges like the teeth of a comb, in front of the crista and inside the auricle. The same ridges line the left auricle, and it is there — not here — that blood stagnates in atrial fibrillation and the clot of a cardioembolic stroke forms. A clot on this side goes to the lungs, not the brain."),

 # ---- the caval opening is in the central tendon and is pulled OPEN on inspiration ----
 # The same file says so correctly three times; this was the first card a student clicks.
 ('gross__kidney-posterior-abdominal-wall__abdominal-aorta-ivc',
  "which is why the aorta is not compressed with each breath while the cava, which passes through the central tendon, is.",
  "which is why the aorta is not compressed with each breath, while the cava, which passes through the central tendon, is pulled open by it — so venous return rises on inspiration."),

 # ---- supracondylar fracture: the DISTAL fragment goes back, the PROXIMAL spike goes forward ----
 # Two scenes gave two different answers and neither was right.
 ('gross__arm__brachial-artery',
  "A child falls on the outstretched hand and the sharp lower fragment tears or presses the artery in front of it.",
  "A child falls on the outstretched hand. The lower fragment tilts backwards, which drives the sharp front edge of the upper fragment forwards into the artery and the median nerve lying in front of it."),

 ('gross__arm__humerus',
  "The brachial artery and the median nerve lie together on the front of it, so the sharp upper fragment tilts back and catches both.",
  "The brachial artery and the median nerve lie together on the front of it. The lower fragment tilts backwards and the sharp front edge of the upper fragment is driven forwards into both."),

 # ---- the apical group receives directly from the upper breast and the cephalic strip ----
 # Beat 3 and the limb card of the same file already said so.
 ('gross__axilla-brachial-plexus__axillary-lymph-nodes',
  "The other two groups take nothing from outside — they only take from each other.",
  "The central group takes nothing from outside — only from the first three. The apical group takes from the central group and from two direct routes: the upper part of the breast, and the strip of arm that follows the cephalic vein."),

 # ---- clavipectoral fascia: cephalic vein and lymphatics IN, thoracoacromial and nerve OUT ----
 ('gross__axilla-brachial-plexus__axillary-vein',
  "Three things pierce that fascia going out — the cephalic vein, the thoracoacromial vessels and the lateral pectoral nerve — and lymphatics from the apical nodes pierce it going in.",
  "Four things pierce that fascia, two each way. Going out: the thoracoacromial vessels and the lateral pectoral nerve. Going in: the cephalic vein, on its way to join the axillary vein, and the lymphatics travelling up to the apical nodes."),

 # ---- the deep head of flexor pollicis brevis is ULNAR ----
 # The run reported fixing this "twice" and called it the run's highest-value catch. A third copy
 # survived in the same file. The hypothenar claim in the same sentence is also wrong: the deep
 # branch gives its hypothenar twigs in Guyon's canal, before it reaches the hook.
 ('gross__forearm-hand__intrinsic-hand-muscles-arches',
  "A fractured hook of hamate can paralyse every ulnar-supplied muscle in the palm — the interossei, adductor pollicis, the medial two lumbricals and the hypothenar group — and leave sensation untouched. The three thenar muscles and the lateral two lumbricals are median and survive it.",
  "A fractured hook of hamate can paralyse the deep branch's territory in the palm — the interossei, adductor pollicis, the medial two lumbricals and the deep head of flexor pollicis brevis — and leave sensation untouched. The hypothenar muscles are usually spared, because their branches leave in Guyon's canal before the nerve reaches the hook, and that sparing is how you place the lesion. Abductor pollicis brevis, opponens pollicis, the superficial head of flexor pollicis brevis and the lateral two lumbricals are median and survive."),

 ('gross__forearm-hand__intrinsic-hand-muscles-arches',
  "It is the only muscle in the body that both begins on a bone and gives origin to another muscle inside a different segment.",
  "Flexor digitorum longus does the same for the lumbricals of the foot; this is the upper-limb half of that pair."),

 # ---- obturator internus leaves through the lesser foramen; the pudendal vessels come back in ----
 ('gross__gluteal-region-hip-joint__sciatic-nerve',
  "The nerve leaves above this level, through the greater foramen; the tendon of obturator internus comes back in below it.",
  "The nerve leaves above this level, through the greater foramen. Below it, through the lesser foramen, the tendon of obturator internus comes out — and the internal pudendal vessels and nerve go back in beside it."),

 # ---- the xiphoid is the T6 dermatome; T10 is the umbilicus ----
 ('gross__anterior-abdominal-wall-inguinal-region__rectus-abdominis',
  '"T9 dermatome"',
  '"T6 dermatome"'),

 # ---- the foveolar artery is the second source, as beat 8 of the same file says ----
 ('gross__gluteal-region-hip-joint__proximal-femur',
  "That is the third and smallest source of blood to the head.",
  "That is the second and smallest of the three sources of blood to the head, and the one that fails first."),

 # ---- the rectus INSERTS into the 5th, 6th and 7th cartilages; it arises from the pubis ----
 ('gross__anterior-abdominal-wall-inguinal-region__rectus-sheath',
  "One of the three cartilages the upper end of the rectus takes origin from and lies directly upon.",
  "One of the three cartilages the upper end of the rectus is inserted into and lies directly upon."),
 ('gross__anterior-abdominal-wall-inguinal-region__rectus-sheath',
  '"origin of rectus abdominis"',
  '"insertion of rectus abdominis"'),
]

n = 0
for f, old, new in FIX:
    p = os.path.join(S, f + '.json')
    raw = io.open(p, encoding='utf-8').read()
    if old not in raw:
        print('MISS  %s\n      %s' % (f, old[:90])); sys.exit(1)
    io.open(p, 'w', encoding='utf-8', newline='').write(raw.replace(old, new, 1))
    n += 1
    print('fixed %-56s %s' % (f[:56], old[:44]))

# ---- the canal is widest at the atlas; C4-C7 are wide, not widest ----
p = os.path.join(S, 'gross__back-vertebral-column__spinal-cord-in-vertebral-canal.json')
sc = json.load(io.open(p, encoding='utf-8'))
hit = 0
for st in sc['structures']:
    if st.get('narration') == "A cervical ring. The canal is widest and most triangular here, because the cervical enlargement of the cord sits at this level.":
        st['narration'] = ("A cervical ring. The canal is wide and triangular here, with the cervical enlargement of the "
                           "cord inside it. It is widest of all at the atlas, which is why the cord usually escapes a "
                           "fracture up there.")
        hit += 1
if hit != 4: print('MISS  spinal-cord c4-c7 matched %d of 4' % hit); sys.exit(1)
io.open(p, 'w', encoding='utf-8', newline='').write(json.dumps(sc, ensure_ascii=False, indent=2) + '\n')
n += hit
print('fixed %-56s %s' % ('spinal-cord-in-vertebral-canal', 'C4-C7 no longer each claim to be "widest"'))

# ---- beat 2 says the ulnar exception is lit separately; the highlight pointed at a median muscle ----
p = os.path.join(S, 'gross__forearm-hand__intrinsic-hand-muscles-arches.json')
sc = json.load(io.open(p, encoding='utf-8'))
ops = sc['views'][1]['ops']
tgt = [o for o in ops if o.get('op') == 'HIGHLIGHT_STRUCTURE' and o.get('target') == 'opponens_pollicis']
if not tgt: print('MISS  intrinsic-hand beat 2 highlight'); sys.exit(1)
tgt[0]['target'] = 'fpb_deep'
io.open(p, 'w', encoding='utf-8', newline='').write(json.dumps(sc, ensure_ascii=False, indent=2) + '\n')
n += 1
print('fixed %-56s %s' % ('intrinsic-hand-muscles-arches', 'beat 2 now lights fpb_deep, the muscle it names'))

# ---- "LAD" in the search index resolved to a vein ----
p = os.path.join(S, 'gross__heart-pericardium__heart.json')
sc = json.load(io.open(p, encoding='utf-8'))
v = next((x for x in sc['structures'] if x.get('key') == 'great_cardiac_vein'), None)
if not v: print('MISS  great_cardiac_vein'); sys.exit(1)
if v.get('label') == 'Great cardiac vein':
    v['label'] = 'Great cardiac vein — the LAD runs beside it'
    v['narration'] = (v.get('narration', '') +
        " The anterior interventricular (left anterior descending) artery runs in this same groove and has no "
        "model in this set, so a search for LAD lands here: the vein marks the artery's course, and the artery "
        "itself is not drawn.")
    io.open(p, 'w', encoding='utf-8', newline='').write(json.dumps(sc, ensure_ascii=False, indent=2) + '\n')
    n += 1
    print('fixed %-56s %s' % ('heart', 'LAD search no longer lands on an unlabelled vein'))

for f in sorted({x[0] for x in FIX}):
    json.load(io.open(os.path.join(S, f + '.json'), encoding='utf-8'))
print('\n%d corrections applied; all files still parse.' % n)
