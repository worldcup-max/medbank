# Severe malaria (Paediatrics, 500L, broad)

Flow project: "Nov 17 - 09:26" (https://flow.google.com/project/bbee5edc-0624-4b98-bf00-726df11cd95f), Nano Banana 2.1.
Every state is an edit of the set's base picture (select the base in the history panel before each edit).

Shared style line (start of every base prompt):
> Wide 16:9 illustration for a medical training game, painterly semi-realistic storybook style, soft ink lines and watercolour texture, warm afternoon light.

Shared edit wrapper:
> Edit this exact image. Keep the room, camera, bed, lighting and the [patient]'s identity, clothes and position on the bed exactly the same. Change only: [change]. Do not add any people. Do not add text.

## Sets

| Set | Patient | Setting | Distress | Critical | Treated |
| --- | --- | --- | --- | --- | --- |
| m-child-phc-01 | boy, 4, yellow t-shirt | primary health centre, wooden bench, peeling paint | generalised seizure, eyes rolled up, froth | pale grey, unresponsive, limp arm off bed | IV bag + cannula on splint, damp cloth on forehead |
| f-child-gh-02 | girl, 2, pink dress, beaded braids | general hospital children's ward, cot-side bed, locker | respiratory distress from severe anaemia, frightened | very sick and drowsy, pale greyish, hand off mattress | blood transfusion + nasal oxygen prongs |
| m-child-private-03 | boy, 7, blue-white striped pyjamas | private hospital single room: pale blue walls, split AC unit, lagoon print, electric bed at 3/4 angle, wall oxygen, monitor | shaking chills (rigors) under sheet, teeth chattering | very sick and drowsy, faint yellow sclera, hand off mattress | IV infusion, cannula on left hand, monitor on with finger clip |

### m-child-phc-01 base
> Side view of a bay in a small Nigerian primary health centre: plain cream walls with a mint-green lower band and some peeling paint, a simple wooden bench against the back wall, terrazzo floor. A 4-year-old Nigerian boy (dark brown skin, short black hair, slim, faded yellow t-shirt and blue shorts) lies on his back on a narrow metal hospital bed, head on a pillow on the LEFT of the frame, feet to the right, a thin wrapper cloth over his legs. He looks unwell and tired: flushed face, half-closed eyes, sweaty forehead, lips slightly dry. Green privacy curtain on the far left, an empty IV pole beside the head of the bed, a barred window with a palm tree outside, a switched-off patient monitor on a stand at the RIGHT with a dark screen. No other people, no text, no logos. Camera at bed height, whole bed visible with some empty floor around it.

Note: Flow's minor-safety filter refused "collapsing / floppy / limp arm hanging" for a child. Use: "very sick and drowsy, in a deep sleep: dull pale greyish skin, pale lips, eyes closed, lying very still, one hand resting off the edge of the mattress".

## Flipbook frames (moving states)
Frames are edits of the set's distress picture (not the base), changing only the limb pose. Saved as `distress-f1..f4.webp` (f1 = distress). `tools/flipbook-preview.py <set dir> <out.mp4>` makes a review clip.

m-child-phc-01 frame prompts (wrapper: "Edit this exact image for a medical training animation frame. Keep the room, camera, bed, lighting, wrapper cloth and the boy's identity, clothes, face and body position on the bed exactly the same. Change only the pose of his limbs, as [another moment of the same seizure]: …"):
- f2: both arms straightened and pushed down along his sides with fists clenched, both legs straight and stiff, chin tilted slightly up.
- f3: right arm bent up towards his chest and left arm stretched out to the side, right knee bent up and left leg straight, head turned a little towards the camera.
- f4: both elbows bent with fists raised level with his shoulders, both knees bent and drawn up slightly higher, head pressed back into the pillow.

m-child-private-03 shiver frames (edits of distress, wrapper: "Edit this exact image for a medical training animation frame. Keep the room, camera, bed, lighting, white sheet and the boy's identity, clothes, face, sweat and body position on the bed exactly the same. Change only, as another instant of the same shaking chill: …"):
- f2: shoulders hunched higher, head tilted further right, hands gripping the sheet lower, sheet folds over the legs shifted.
- f3: head pressed back, eyes squeezed shut, fists pulled up under the chin, knees drawn up more.
- f4: head turned towards camera, jaw trembling, right hand on belly, body curled slightly towards camera.

## Extras per patient (Frank's picks 1, 3, 4, 5)
Files: `exam-eyes`, `exam-hands`, `exam-mouth`, `exam-skin`, `exam-abdomen`, `arrival`, `night`, `discharge` (.webp).
Close-up rule: same 5 sites for every patient. Topic signs only where relevant; other sites normal or with a harmless look-alike, varied per patient, so the menu never gives the answer away.
Close-up wrapper: "Using this exact [patient] as the reference for identity and skin tone, make a new wide 16:9 painterly semi-realistic storybook illustration with soft ink lines in the same style: a close-up examination view of …. Only the gloved hand, no other people. Do not add text."

| Set | Eyes | Hands | Mouth | Skin | Abdomen |
| --- | --- | --- | --- | --- | --- |
| m-child-phc-01 | normal pink lid lining, clear sclera, sleepy glassy eyes (normal) | mildly pale palms; uli dye pattern on one palm (distractor) | dry cracked lips + small tongue-bite mark with dried blood (sign of a recent fit) | shins: scratched mosquito bites + old shiny burn scar on calf (distractors) | soft full tummy, hand under left ribs, faded traditional scarification marks by the navel (distractor) |
| f-child-gh-02 | very pale lower-lid lining, clear white sclera (eye extreme close-up) | very pale palms and nails; red string bracelet (distractor) | new back tooth erupting + drool (look-alike), slightly pale tongue | shins: ashy dry patches + 2 healed insect bites (distractors) | lower-rib indrawing with fast breathing (sign) + small umbilical hernia (distractor) |
| m-child-private-03 | pale conjunctiva, faint yellow sclera | pale palms and nail beds; healed knuckle scratch (distractor) | dry cracked lips (look-alike), thin white tongue coat | shins: mosquito bites + old knee scar (distractors), no rash | soft, hand palpating left upper quadrant, old faded scar lower right (distractor) |

Night (m-child-private-03): same room, dark blue sky, palm in silhouette, blinds half down, warm reading lamp, AC glow; boy awake, restless, flushed.
Discharge (m-child-private-03): bed made and empty, boy well and smiling on the bed edge in yellow t-shirt, blue shorts, sandals; backpack, folded pyjamas, paper medicine bag; monitor off, IV pole empty.
Arrival (m-child-private-03): private hospital front desk (pale blue, curved wooden counter, wall clock, plant, blue chairs, glass doors), mother in green-gold ankara and head tie carrying the boy, nurse in light blue behind counter.

Note: the first hands close-up ("close-up of both his hands ... healed scratch") was refused by Flow's policy filter. This wording worked: "a doctor's examination view of a child's two hands lying open, palms facing up, on a white hospital bed sheet ... palms and fingernails are a pale, washed-out pinkish colour ... Calm, clinical teaching picture."

f-child-gh-02 extras: night = same ward, black-blue sky, palm silhouette, hurricane-style lamp on locker, girl awake and uneasy. Discharge = yellow dress, white sandals, cloth doll, folded pink dress, medicine bag, blanket folded. Arrival = government GH children's emergency waiting area (mint/cream walls, peeling paint, wooden triage desk with folders, bench with mothers and babies, ceiling fan), father in blue kaftan carrying her, nurse in white. Add "walls are completely bare: no signs, no posters, no notices, no writing anywhere" or Flow paints made-up words on signs.
f-child-gh-02 fast-breathing frames (edits of distress): f2 chest rising, mouth open, nostrils flared, shoulders lifted; f3 chest sunk, sub-rib indrawing, lips pursed, head tipped back; f4 head towards camera, hand on chest, mouth open, eyes wide.
Tip: close-ups come out best when the prompt says "extreme close-up of one eye filling most of the picture" / "close-up of only her lower face and open mouth filling the picture"; otherwise Flow returns a half-body view.

m-child-phc-01 extras: night = power cut, rechargeable lantern on the wooden bench, navy sky, palm silhouette. Discharge = standing by empty bed in green t-shirt, brown shorts, rubber slippers, plastic bag with tablets and syrup. Arrival = rural PHC front yard in late afternoon (cream/mint building, veranda, sandy yard, motorcycle taxi at the gate, mango tree), mother in orange wrapper carrying him up the steps, health worker in light blue scrubs.
