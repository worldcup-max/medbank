import io
f='viz-training/tools/measure-fragments.mjs'
s=io.open(f,encoding='utf-8').read()
old="""    console.log((flagIt ? 'LOOK  ' : '      ') + 'beat ' + beat + '  ' + key +
      '  fragments ' + raw.length + ' raw, ' + cl.length + ' after the sub-4px hairline discount' +
      '   ink ' + (100 * ink / (r.W * r.H)).toFixed(3) + '% of frame, camera ' + r.dir + ' at t=' + r.t);"""
new="""    /* THE NUMBER THAT ACTUALLY ANSWERS THE QUESTION, reported beside the counts and never thresholded
       here: how much of the structure's ink is in its LARGEST piece. A count alone cannot tell a rod
       broken into four beads (shares near a quarter each) from a rod with three stray antialiased
       specks beside it (share 0.998), and both arrive as "4". A one-pixel component survives the
       closing — dilate then erode returns it unchanged — which is correct for a measure of CONNECTION
       and useless as a measure of what a student sees. No floor is applied, because picking one is
       picking an answer; read the share. */
    const biggest = raw.length ? raw[0].px / ink : 1;
    console.log((flagIt ? 'LOOK  ' : '      ') + 'beat ' + beat + '  ' + key +
      '  fragments ' + raw.length + ' raw, ' + cl.length + ' after the sub-4px hairline discount' +
      '   largest piece holds ' + (100 * biggest).toFixed(1) + '% of its ink' +
      '   ink ' + (100 * ink / (r.W * r.H)).toFixed(3) + '% of frame, camera ' + r.dir + ' at t=' + r.t);"""
assert s.count(old)==1
io.open(f,'w',encoding='utf-8').write(s.replace(old,new))
print('ok')
