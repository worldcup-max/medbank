#!/usr/bin/env python3
# Repair backlog section 1 — put on screen the structures whose meshes were in the catalog all along.
#
# Each of these scenes narrates a structure it does not draw, because a single-spelling catalog search
# came back empty and the resulting gaps[] note was believed by every later run. The notes are already
# corrected; this adds the geometry they now point at.
import io, json, sys, os

R = sys.argv[1] if len(sys.argv) > 1 else '.'
S = os.path.join(R, 'scenes')

def load(f):
    return json.load(io.open(os.path.join(S, f + '.json'), encoding='utf-8'))

def save(f, sc):
    io.open(os.path.join(S, f + '.json'), 'w', encoding='utf-8', newline='').write(
        json.dumps(sc, ensure_ascii=False, indent=2) + '\n')

def add(f, after_key, st):
    """Insert a structure after the named key, or append if the key is absent."""
    sc = load(f)
    if any(x.get('key') == st['key'] for x in sc['structures']):
        print('  skip  %s already has %s' % (f, st['key'])); return sc
    i = next((n for n, x in enumerate(sc['structures']) if x.get('key') == after_key), None)
    if i is None:
        print('MISS  %s has no key %r' % (f, after_key)); sys.exit(1)
    sc['structures'].insert(i + 1, st)
    save(f, sc)
    print('  add   %-58s %-14s %s' % (f[:58], st['key'], st['refs']['bodyparts3d']))
    return sc

M = lambda k, name, label, group, layer, color, mid, terms, narr: {
    'key': k, 'name': name, 'label': label, 'role': 'part', 'group': group,
    'layer': layer, 'color': color, 'refs': {'bodyparts3d': mid},
    'terms': terms, 'narration': narr}

C = lambda k, name, label, group, layer, color, mid, terms, narr: {
    'key': k, 'name': name, 'label': label, 'role': 'context', 'group': group,
    'layer': layer, 'color': color, 'refs': {'bodyparts3d': mid},
    'terms': terms, 'narration': narr}

# ---------------------------------------------------------------- the vas deferens
# Three scenes recorded it absent. It is FMA19235/FMA19236, filed under the catalog's own
# name "deferent duct". Run 37 escalated it to a human as the corpus's cheapest high-value
# model request; it had been there the whole time.
VAS_N = ("The vas is the spine of the male tract: it runs from the tail of the epididymis, up through "
         "the inguinal canal in the spermatic cord, over the ureter and down to join the duct of the "
         "seminal vesicle as the ejaculatory duct. It is what makes testis, epididymis, ampulla and "
         "ejaculatory duct one continuous story, it is the structure a vasectomy divides, and it is the "
         "one that crosses above the ureter — water under the bridge, on the male side.")

add('gross__pelvis-perineum__internal-reproductive-organs', 'left_epididymis',
    M('right_vas', 'right deferent duct', 'Vas deferens (right)', 'Duct system', 'organ', '#e6b0aa',
      'FMA19235', ['vas deferens', 'ductus deferens', 'deferent duct', 'vasectomy', 'spermatic cord',
                   'ampulla of the vas', 'ejaculatory duct'], VAS_N))
add('gross__pelvis-perineum__internal-reproductive-organs', 'right_vas',
    M('left_vas', 'left deferent duct', 'Vas deferens (left)', 'Duct system', 'organ', '#d7a09a',
      'FMA19236', ['vas deferens', 'ductus deferens', 'deferent duct'],
      "The left vas, shown so the tract can be followed on both sides. Everything said of the right holds here."))

# Beat 1 traced sperm from epididymis straight to seminal vesicle with the connecting duct invisible;
# beat 4 drew "water under the bridge" from the seminal vesicle to the ureter because the vas was not
# there to draw it from. Both now use the real thing.
sc = load('gross__pelvis-perineum__internal-reproductive-organs')
for v in sc['views']:
    for o in v.get('ops', []):
        if o.get('op') == 'TRACE_STRUCTURE' and o.get('target') == 'concept:sperm':
            p = o['path']
            if 'right_vas' not in p:
                p.insert(p.index('right_seminal_vesicle'), 'right_vas')
                o['duration'] = o.get('duration', 9) + 1
                print('  wire  sperm path -> ' + ', '.join(p))
        if o.get('op') == 'SHOW_RELATIONSHIP' and o.get('from') == 'right_seminal_vesicle' \
           and o.get('to') == 'right_ureter':
            o['from'] = 'right_vas'
            o['kind'] = 'the vas crosses above the ureter — water under the bridge'
            print('  wire  vas-over-ureter relationship now drawn from the vas itself')
save('gross__pelvis-perineum__internal-reproductive-organs', sc)

add('gross__anterior-abdominal-wall-inguinal-region__inguinal-canal', 'testis_r' if
    any(x.get('key') == 'testis_r' for x in load('gross__anterior-abdominal-wall-inguinal-region__inguinal-canal')['structures'])
    else load('gross__anterior-abdominal-wall-inguinal-region__inguinal-canal')['structures'][-1]['key'],
    M('vas_r', 'right deferent duct', 'Vas deferens — the cord\'s main content', 'Contents & destination',
      'organ', '#e6b0aa', 'FMA19235',
      ['vas deferens', 'ductus deferens', 'deferent duct', 'spermatic cord', 'vasectomy'],
      "The principal content of the spermatic cord, and the one structure in it you can feel: rolled between "
      "finger and thumb at the neck of the scrotum it is a firm cord like a thin wire. It enters at the deep "
      "ring, runs the length of the canal, leaves at the superficial ring and hooks over the ureter into the "
      "pelvis."))

add('gross__kidney-posterior-abdominal-wall__ureters', 'bladder' if
    any(x.get('key') == 'bladder' for x in load('gross__kidney-posterior-abdominal-wall__ureters')['structures'])
    else load('gross__kidney-posterior-abdominal-wall__ureters')['structures'][-1]['key'],
    C('vas_r', 'right deferent duct', 'Vas deferens (right)', 'Pelvic organs', 'organ', '#e6b0aa',
      'FMA19235', ['vas deferens', 'deferent duct', 'water under the bridge'],
      "The male counterpart of the uterine artery's crossing. The vas passes above the ureter on its way to "
      "the base of the bladder — water under the bridge on this side too, and the reason the ureter is at "
      "risk in pelvic surgery in both sexes."))

# ---------------------------------------------------------------- interosseous membranes
IOM_ARM = ("The sheet between radius and ulna. It is what makes the forearm two compartments rather than one "
           "space, its fibres run downwards and medially from radius to ulna so that force landing on the hand "
           "is carried up to the ulna and the elbow, and both deep muscle layers take origin from it.")
for scene, after in [('gross__forearm-hand__flexor-compartment', 'ulna'),
                     ('gross__forearm-hand__extensor-compartment', 'ulna')]:
    keys = [x.get('key') for x in load(scene)['structures']]
    anchor = 'ulna' if 'ulna' in keys else keys[0]
    add(scene, anchor,
        C('iom', 'interosseous membrane of right forearm', 'Interosseous membrane', 'Bones', 'fascia',
          '#cbb9a0', 'FMA23707', ['interosseous membrane', 'interosseous border', 'compartment boundary',
                                  'force transmission'], IOM_ARM))

keys = [x.get('key') for x in load('gross__leg-foot__gastrocnemius-soleus')['structures']]
add('gross__leg-foot__gastrocnemius-soleus', 'fibula' if 'fibula' in keys else keys[0],
    C('iom', 'interosseous membrane of right leg', 'Interosseous membrane', 'Bony frame', 'fascia',
      '#c9bd93', 'FMA35192',
      ['interosseous membrane', 'compartment boundary', 'compartment syndrome', 'deep posterior compartment'],
      "The sheet between tibia and fibula, and the fourth wall of the box. Bone in front, membrane between the "
      "bones, deep fascia behind and the intermuscular septa at the sides — that is why pressure in the deep "
      "posterior compartment has nowhere to go, and why compartment syndrome is a surgical emergency here."))

# ---------------------------------------------------------------- levatores costarum
for k, mid, part, col in [('lev_longi', 'FMA74075', 'longi', '#9c4a2f'),
                          ('lev_breves', 'FMA74077', 'breves', '#8a4028')]:
    add('gross__thoracic-wall-diaphragm__intercostal-muscles',
        [x.get('key') for x in load('gross__thoracic-wall-diaphragm__intercostal-muscles')['structures']][-1],
        C(k, 'set of right levatores costarum ' + part,
          'Levatores costarum ' + part, 'Intercostal muscles', 'muscle', col, mid,
          ['levatores costarum', 'levator costae', 'transverse process', 'accessory muscle of inspiration'],
          "Small fan-shaped muscles running from the transverse processes down to the rib below — the breves to "
          "the next rib, the longi skipping one. They elevate the ribs and are why the back of the wall is "
          "thicker than a front-on view suggests. Dorsal rami, not intercostal nerves."))

# ---------------------------------------------------------------- the rest
add('gross__leg-foot__ankle-joint',
    'tib_ant' if any(x.get('key') == 'tib_ant' for x in load('gross__leg-foot__ankle-joint')['structures'])
    else load('gross__leg-foot__ankle-joint')['structures'][-1]['key'],
    M('ehl', 'right extensor hallucis longus', 'Extensor hallucis longus', 'Movers of the joint',
      'muscle', '#c9843f', 'FMA22546',
      ['extensor hallucis longus', 'deep fibular nerve', 'dorsiflexion', 'L5', 'great toe extension'],
      "The middle of the three tendons in front of the axis, between tibialis anterior medially and extensor "
      "digitorum longus laterally. Deep fibular nerve. Its power of extending the great toe is the cleanest "
      "single test of the L5 root at the bedside."))

for k, mid, name, ordn, col in [('plantar_io_1', 'FMA37745', 'first plantar interosseous of right foot', 'First', '#a8763f'),
                                ('plantar_io_2', 'FMA37743', 'second plantar interosseous of right foot', 'Second', '#98693a'),
                                ('plantar_io_3', 'FMA37741', 'third plantar interosseous of right foot', 'Third', '#8a5e35')]:
    add('gross__leg-foot__arches-of-the-foot',
        [x.get('key') for x in load('gross__leg-foot__arches-of-the-foot')['structures']][-1],
        C(k, name, ordn + ' plantar interosseous', 'Muscular support', 'muscle', col, mid,
          ['plantar interossei', 'interosseous', 'fourth layer of the sole', 'adduction of the toes', 'PAD'],
          "One of the three plantar interossei, the fourth layer of the sole. They adduct the toes towards the "
          "second — PAD, as in the hand — and with the other short muscles they are the active support of the "
          "arches, which is why the arch falls when the foot is tired and holds when it is working."))

IJV = ("The vein that comes down the neck inside the carotid sheath. Behind the sternoclavicular joint it meets "
       "the subclavian vein at the venous angle to form the brachiocephalic vein. That corner is where the "
       "lymphatic ducts empty — thoracic duct on the left, right lymphatic duct on the right — so the whole "
       "lymph of the body rejoins the blood at a junction you can point to.")
add('gross__pectoral-region-breast__clavicle', 'subclavian_vein',
    C('int_jugular', 'right internal jugular vein', 'Internal jugular vein', 'Danger behind the bone',
      'vessel', '#3a6f9e', 'FMA4754', ['internal jugular vein', 'venous angle', 'carotid sheath',
                                       'right lymphatic duct', 'central line'], IJV))
add('gross__pectoral-region-breast__clavicle', 'subclavius',
    C('scalenus_ant', 'right scalenus anterior', 'Scalenus anterior — the divider', 'What lies beneath',
      'muscle', '#b0503f', 'FMA13392',
      ['scalenus anterior', 'scalene tubercle', 'interscalene groove', 'subclavian artery', 'subclavian vein',
       'phrenic nerve', 'thoracic outlet'],
      "Descends from the cervical transverse processes to the scalene tubercle of the first rib, and it is the "
      "answer to the question examiners actually ask: the vein passes in FRONT of it, the artery and the trunks "
      "of the plexus BEHIND it. Subclavius lies higher again, between all of that and the clavicle. The phrenic "
      "nerve rides down its front surface."))

add('gross__pectoral-region-breast__axillary-vessels-lymph-nodes',
    'brachiocephalic_vein' if any(x.get('key') == 'brachiocephalic_vein'
        for x in load('gross__pectoral-region-breast__axillary-vessels-lymph-nodes')['structures'])
    else load('gross__pectoral-region-breast__axillary-vessels-lymph-nodes')['structures'][-1]['key'],
    C('int_jugular', 'right internal jugular vein', 'Internal jugular vein', 'The vein', 'vessel',
      '#3a6f9e', 'FMA4754', ['internal jugular vein', 'venous angle', 'right lymphatic duct'], IJV))

# ---------------------------------------------------------------- diagram scenes: regions, never refs
# These two are provider "svg". A model id in them would break the purity rule, so the missing pieces
# are added as drawn regions for the illustrator instead.
D = lambda k, label, group, layer, color, terms, narr: {
    'key': k, 'label': label, 'role': 'context', 'group': group,
    'layer': layer, 'color': color, 'terms': terms, 'narration': narr}

sc = load('gross__arm__brachial-artery')
have = {x.get('key') for x in sc['structures']}
for k, lab, col, terms, narr in [
    ('coracobrachialis', 'Coracobrachialis', '#b8503f', ['coracobrachialis', 'musculocutaneous nerve'],
     "The second of the three muscles behind the artery in the upper arm. The musculocutaneous nerve pierces it, which is how that nerve leaves the axilla."),
    ('triceps_medial', 'Triceps — medial head', '#a8443c', ['triceps brachii', 'medial head of triceps'],
     "The first of the three behind the artery. Highest up, the artery lies on it before coracobrachialis and then brachialis take over as the floor.")]:
    if k not in have:
        sc['structures'].append(D(k, lab, 'Relations', 'muscle', col, terms, narr))
        print('  add   %-58s %-14s (drawn region, no model — svg scene)' % ('gross__arm__brachial-artery', k))
save('gross__arm__brachial-artery', sc)

sc = load('gross__axilla-brachial-plexus__axillary-vein')
have = {x.get('key') for x in sc['structures']}
for k, lab, col, terms, narr in [
    ('pec_major', 'Pectoralis major', '#a8543f', ['pectoralis major', 'anterior axillary fold'],
     "The most superficial thing the knife meets in front of the axilla, and the first item to name when reading the cross-section from front to back."),
    ('subscapularis', 'Subscapularis', '#9a7f66', ['subscapularis', 'posterior wall of the axilla'],
     "The posterior wall at this level, lying on the front of the scapula. It is the last item in the front-to-back list and the back wall of the space the vein runs through.")]:
    if k not in have:
        sc['structures'].append(D(k, lab, 'Relations', 'muscle', col, terms, narr))
        print('  add   %-58s %-14s (drawn region, no model — svg scene)' % ('gross__axilla-brachial-plexus__axillary-vein', k))
save('gross__axilla-brachial-plexus__axillary-vein', sc)

print('\ndone')
