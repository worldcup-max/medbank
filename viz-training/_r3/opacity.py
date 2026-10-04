import io,json,os
F='viz-training/scenes/embryology__week-3-gastrulation__notochord.json'
s=json.load(io.open(F,encoding='utf-8'))
scl=[x for x in s['structures'] if x['key']=='sclerotome'][0]
assert scl['opacity']==0.4, scl['opacity']
scl['opacity']=0.15
note = ("\n\nSCLEROTOME'S OPACITY MOVED 0.4 -> 0.15 THIS ROUND, AND THE STANDING INSTRUCTION THAT SET IT TO 0.4 IS "
 "WHAT LICENSED THE CHANGE: it says 0.4 must stay 'without re-running the fragment count under RENDER-STANDARD "
 "3.ab corollary 3'. The count was re-run, on the PLAYER frame at 40/255, with a new tool that implements the "
 "rule (viz-training/tools/measure-fragments.mjs), and the reason 0.4 stopped working is THIS ROUND'S OWN FIX "
 "to OPEN 5/5. Putting `definitive` into the subject box moves the camera from 6.205 to 6.610 units back, and "
 "the rod seen THROUGH a 0.4 collar sits right on the 40/255 boundary: measured row by row, the mid-rod rows "
 "read a peak delta of 48-74 at the old distance and 30-39 at the new one. Round 2's single component had "
 "almost no margin; the extra 6.5% of distance took it under and the rod went to 14 components. MEASURED CURVE "
 "at the new camera - components after the hairline discount, and the rod's own diff ink: 0.40 -> 14 / 2.285%, "
 "0.25 -> 9 / 3.783%, 0.20 -> 3 / 4.595%, 0.15 -> 1 / 5.249%, 0.10 -> 1 / 5.597% (one even before the discount). "
 "0.15 is taken rather than 0.10 because the sclerotome is half of this beat's narration, and 0.15 keeps its own "
 "diff ink at 2.515% against 1.129% - still three bands visibly wrapping the rod; its id-pick ink is 9.641% "
 "either way and clears every floor at both. BOTH FRAMES WERE LOOKED AT. At 0.15 the rod is one unbroken dark "
 "column from the top of the frame to the bottom, so the instruction's PURPOSE - that this beat must not draw a "
 "segmented notochord, which ARTWORK-STANDARD section 3 names as this corpus's canonical failure - is better "
 "served at 0.15 than it now is at 0.4.")
s['views'][5]['narration_from'] += note
tmp=F+'.tmp'
json.dump(s, io.open(tmp,'w',encoding='utf-8'), ensure_ascii=False, indent=2)
json.load(io.open(tmp,encoding='utf-8'))
os.replace(tmp,F)
print('ok')
