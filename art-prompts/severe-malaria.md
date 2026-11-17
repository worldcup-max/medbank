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

### m-child-phc-01 base
> Side view of a bay in a small Nigerian primary health centre: plain cream walls with a mint-green lower band and some peeling paint, a simple wooden bench against the back wall, terrazzo floor. A 4-year-old Nigerian boy (dark brown skin, short black hair, slim, faded yellow t-shirt and blue shorts) lies on his back on a narrow metal hospital bed, head on a pillow on the LEFT of the frame, feet to the right, a thin wrapper cloth over his legs. He looks unwell and tired: flushed face, half-closed eyes, sweaty forehead, lips slightly dry. Green privacy curtain on the far left, an empty IV pole beside the head of the bed, a barred window with a palm tree outside, a switched-off patient monitor on a stand at the RIGHT with a dark screen. No other people, no text, no logos. Camera at bed height, whole bed visible with some empty floor around it.
| f-child-gh-02 | girl, 2, pink dress, beaded braids | general hospital children's ward, cot-side bed, locker | respiratory distress from severe anaemia, frightened | very sick and drowsy, pale greyish, hand off mattress | blood transfusion + nasal oxygen prongs |

Note: Flow's minor-safety filter refused "collapsing / floppy / limp arm hanging" for a child. Use: "very sick and drowsy, in a deep sleep: dull pale greyish skin, pale lips, eyes closed, lying very still, one hand resting off the edge of the mattress".

## Flipbook frames (moving states)
Frames are edits of the set's distress picture (not the base), changing only the limb pose. Saved as `distress-f1..f4.webp` (f1 = distress). `tools/flipbook-preview.py <set dir> <out.mp4>` makes a review clip.

m-child-phc-01 frame prompts (wrapper: "Edit this exact image for a medical training animation frame. Keep the room, camera, bed, lighting, wrapper cloth and the boy's identity, clothes, face and body position on the bed exactly the same. Change only the pose of his limbs, as [another moment of the same seizure]: …"):
- f2: both arms straightened and pushed down along his sides with fists clenched, both legs straight and stiff, chin tilted slightly up.
- f3: right arm bent up towards his chest and left arm stretched out to the side, right knee bent up and left leg straight, head turned a little towards the camera.
- f4: both elbows bent with fists raised level with his shoulders, both knees bent and drawn up slightly higher, head pressed back into the pillow.
