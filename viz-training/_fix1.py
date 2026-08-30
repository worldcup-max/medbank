#!/usr/bin/env python3
# Gross audit pass 1 — the nineteen places a student was being taught something false.
# Every edit is an exact string swap, asserted present before and absent after.
import io, json, sys, os

R = sys.argv[1] if len(sys.argv) > 1 else '.'
S = os.path.join(R, 'scenes')

FIX = [
 ('gross__pectoral-region-breast__clavicle',
  "The vein lies in front of the artery and slightly lower, separated from it by subclavius and by the scalene tubercle of the first rib.",
  "The vein lies in front of the artery and slightly lower, separated from it by scalenus anterior, which descends between the two to insert on the scalene tubercle of the first rib. Subclavius lies higher again, between both vessels and the bone."),

 ('gross__arm__brachial-artery',
  "That is why the vessel may be tied above the origin of the profunda brachii and the limb still lives",
  "That is why the vessel may be tied below the origin of the profunda brachii and the limb still lives"),

 ('gross__forearm-hand__intrinsic-hand-muscles-arches',
  "A fractured hook of hamate can paralyse every muscle in the palm and leave sensation untouched.",
  "A fractured hook of hamate can paralyse every ulnar-supplied muscle in the palm — the interossei, adductor pollicis, the medial two lumbricals and the hypothenar group — and leave sensation untouched. The three thenar muscles and the lateral two lumbricals are median and survive it."),

 ('gross__lungs-mediastinum__tracheobronchial-tree',
  "at the lower border of T4 in the living and T5 to T6 in the cadaver, because a dead body is not breathing in.",
  "at the lower border of T4 — the sternal angle — in the cadaver, descending to T5 or T6 in the living on deep inspiration, because a cadaver is not breathing in."),

 ('gross__lungs-mediastinum__tracheobronchial-tree',
  "A tracheostomy is made through the second to fourth rings, below the isthmus of the thyroid gland.",
  "A tracheostomy is made through the second to fourth rings, after the isthmus of the thyroid gland — which lies across exactly those rings — has been retracted or divided. A low tracheostomy, genuinely below the isthmus, goes through the fifth and sixth."),

 ('gross__stomach-intestines__large-intestine',
  "Only the upper third is covered by peritoneum in front, which is why the pouch of Douglas is within reach of a finger",
  "The upper third is covered by peritoneum in front and at the sides, the middle third in front only, and the lower third not at all, which is why the pouch of Douglas is within reach of a finger"),

 ('gross__stomach-intestines__small-intestine',
  "— the only place in the gut with glands in the submucosa.",
  "— one of only two places in the gut with glands in the submucosa. The other is the oesophagus."),

 ('gross__kidney-posterior-abdominal-wall__kidney',
  "An enlarged kidney is ballotable and you cannot get above it, because the diaphragm and the ribs are in the way; an enlarged spleen moves towards the right iliac fossa, has a notch, and you cannot get above it either but it is not ballotable.",
  "An enlarged kidney is ballotable, you can get above it, and there is a band of colonic resonance over it; an enlarged spleen moves towards the right iliac fossa, has a notch, is dull to percussion, is not ballotable, and you cannot get above it."),

 ('gross__kidney-posterior-abdominal-wall__kidney',
  " It also marks the level at which a horseshoe kidney is arrested during its ascent, though the classic hook is the inferior mesenteric artery lower down.",
  " It is not the hook that arrests an ascending horseshoe kidney — that is the inferior mesenteric artery, lower down."),

 ('gross__kidney-posterior-abdominal-wall__kidney',
  "which is why the medulla can concentrate urine and why the cortex is the layer that dies first in acute tubular necrosis from shock.",
  "which is why the medulla can concentrate urine, and why the outer medulla — where the straight proximal tubule and the thick ascending limb do the most work on the least oxygen — is the zone that dies first in ischaemic acute tubular necrosis."),

 ('gross__pelvis-perineum__pelvic-diaphragm-levator-ani',
  "Nerve supply is the ventral rami of S3 and S4 for levator ani, with the external anal sphincter taken by the pudendal nerve from the same roots — S3 and S4 keep the pelvis off the floor is the old and useful line.",
  "Nerve supply is the ventral rami of S3 and S4 for levator ani; the external anal sphincter is taken by the pudendal nerve, which is S2, S3 and S4 — S2, 3, 4 keeps the pelvis off the floor is the old and useful line."),

 ('gross__pelvis-perineum__pelvic-diaphragm-levator-ani',
  "and the pudendal nerve, from the same roots, reaches the external anal sphincter from below in the perineum.",
  "and the pudendal nerve, which is S2 to S4, reaches the external anal sphincter from below in the perineum."),

 ('gross__pelvis-perineum__internal-iliac-vessels',
  "A useful mnemonic for the anterior division is 'I Love Going Places In My Very Own Underwear'",
  "A useful mnemonic for all the branches of the internal iliac, both divisions together, is 'I Love Going Places In My Very Own Underwear'"),

 ('gross__gluteal-region-hip-joint__hip-joint',
  "so it is the only lateral rotator that passes in front of the axis of the neck.",
  "so it is the only one of the group that reaches the femur from below the neck rather than crossing straight across the back of the joint."),

 ('gross__thigh__hamstrings',
  "Root value L5, S1, S2.",
  "The sciatic nerve's own root value is L4 to S3; the hamstrings themselves draw mainly on L5, S1 and S2."),

 ('gross__gluteal-region-hip-joint__gluteal-vessels',
  "It matters here because its branches — the two circumflex femoral arteries — come round the femur",
  "It matters here because the profunda femoris, two steps down from it, gives the two circumflex femoral arteries, which come round the femur"),

 ('gross__thigh__adductor-canal',
  " Above the artery in the canal, below the artery in the popliteal fossa — that reversal is a classic question.",
  " Deep to the artery in the canal, superficial to it in the popliteal fossa — that reversal is a classic question."),

 ('gross__leg-foot__popliteal-fossa',
  "they drain the sole of the foot and the back of the leg, so an infected wound on the sole is felt for here and not in the groin first.",
  "they drain the small saphenous territory — the lateral border of the foot, the heel and the back of the leg — so a wound on the heel or the outer foot is felt for here, while the rest of the sole drains to the groin."),

 ('gross__lungs-mediastinum__great-vessels',
  "Everything distal to it is the isthmus, and coarctation is described as before or after this branch for a practical reason: a narrowing beyond it leaves",
  "The short segment between it and the ligamentum arteriosum is the isthmus, and coarctation is described as preductal or postductal — before or after the ligamentum, not before or after this branch. The distinction is practical: a postductal narrowing leaves"),
]

# The C1/C2 pair needs a structural edit, not a string swap: the same sentence is pasted
# onto seven vertebrae and is only false on the top two.
VERT = {
 'c1': "A ring rather than a vertebra — no body, no spinous process, and it carries the skull. The canal is at its widest here, which is why the cord usually escapes in a fracture of the atlas. The cervical enlargement lies lower down.",
 'c2': "The dens rises from its body into the ring of the atlas above. The canal is still wide at this level. The cervical enlargement of the cord begins below it, from about C4.",
}

changed = {}
for f, old, new in FIX:
    p = os.path.join(S, f + '.json')
    raw = io.open(p, encoding='utf-8').read()
    if old not in raw:
        print('MISS  %s\n      %s' % (f, old[:80])); sys.exit(1)
    raw = raw.replace(old, new, 1)
    io.open(p, 'w', encoding='utf-8', newline='').write(raw)
    changed[f] = changed.get(f, 0) + 1
    print('fixed %-58s %s' % (f, old[:52].replace('\n', ' ')))

p = os.path.join(S, 'gross__back-vertebral-column__spinal-cord-in-vertebral-canal.json')
sc = json.load(io.open(p, encoding='utf-8'))
n = 0
for st in sc['structures']:
    if st.get('key') in VERT and 'cervical enlargement of the cord sits at this level' in (st.get('narration') or ''):
        st['narration'] = VERT[st['key']]; n += 1
if n != 2:
    print('MISS  spinal-cord c1/c2 (matched %d)' % n); sys.exit(1)
io.open(p, 'w', encoding='utf-8', newline='').write(json.dumps(sc, ensure_ascii=False, indent=2) + '\n')
print('fixed %-58s c1 and c2 no longer claim the cervical enlargement' % 'spinal-cord-in-vertebral-canal')

for f in sorted(changed):
    json.load(io.open(os.path.join(S, f + '.json'), encoding='utf-8'))
print('\n%d edits across %d files; all still parse as JSON.' % (len(FIX) + 2, len(changed) + 1))
