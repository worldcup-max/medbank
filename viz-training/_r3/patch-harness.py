import io
f='viz-training/tools/render-notochord.mjs'
s=io.open(f,encoding='utf-8').read()
anchor = "hdr('8 · the acceptance battery and its negative cases, in the page that loads the file');"
assert s.count(anchor)==1, s.count(anchor)
block = """/* ══════════════ 7b · AND THE PERTURBATION FOR ROW AA, WITH ITS OWN NEGATIVE CONTROL

   RENDER-STANDARD: "the check is a PERTURBATION: change the constant the geometry uses and the
   reported number must move. If it does not, the test is not measuring the model." Row AA's two
   numbers are read off a cut-plane normal DERIVED from the built triangles, so the thing to perturb
   is the yaw that turned them — and the thing to prove alongside it is that the ANATOMY did not move
   with the picture: the cut must still be exactly the median plane and the conservation the disc is
   built on must be untouched at every angle. That second half is the negative control, and it is the
   half that would catch a yaw implemented by moving the CUT instead of the SPECIMEN. */
hdr('7b · row AA\\'s measure moves with the yaw, and the anatomy does not move with it');
const yaw = await page.evaluate(m => {
  const M = window.MB3D_MODELS[m];
  const read = () => ({
    angle: M.claimMeasure('cutFaceAngle.lateral/adult', 0.90),
    share: M.claimMeasure('cutFaceProjShare.lateral/adult', 0.90),
    cutMaxX: M.claimMeasure('adultCutMaxX/adult', 0.90),
    boreTaper: M.claimMeasure('discBoreTaper/adult', 0.90),
    nucleusR: M.claimMeasure('nucleusRadiusFrac/adult', 1.00),
    between: M.claimMeasure('nucleusBetweenBodies/adult', 1.00),
  });
  const base = read(), runs = [];
  for (const deg of [0, 20, 30, 60, 75]) {
    M._setConst('ADU_YAW', deg * Math.PI / 180);
    runs.push({ deg, got: read() });
  }
  M._clearConst('ADU_YAW');
  return { base, runs, restored: read() };
}, MODEL);
console.log('         baseline  cut-face angle ' + n6(yaw.base.angle) + ' deg, and the flat cut faces ' +
            'own ' + n6(yaw.base.share) + ' of the segment\\'s projection on that camera');
for (const r of yaw.runs) {
  console.log('         ADU_YAW = ' + String(r.deg).padStart(2) + ' deg  angle ' + n6(r.got.angle) +
              '  share ' + n6(r.got.share) + '  cutMaxX ' + r.got.cutMaxX.toExponential(2) +
              '  boreTaper ' + n6(r.got.boreTaper) + '  nucleusR ' + n6(r.got.nucleusR));
}
say(yaw.runs.every(r => Math.abs(r.got.angle - r.deg) < 0.01),
    'the cut-face angle derived from the built triangles tracks ADU_YAW to within 0.01 degrees at ' +
    '0, 20, 30, 60 and 75 — so the normal row AA measures against IS the cut plane and not a ' +
    'restatement of the constant that turned it');
say(yaw.runs.find(r => r.deg === 0).got.share > yaw.base.share &&
    yaw.runs.find(r => r.deg === 60).got.share < yaw.base.share,
    'and the share of the projection those flat faces own falls as the segment turns — 1.0000 would ' +
    'be a picture with nothing in it but the cut');
/* THE TOLERANCE ON nucleusR IS THE FACETING'S OWN RESOLUTION, AND THIS RUN LEARNED IT THE RIGHT WAY
   ROUND — at 1e-3 the control FAILED, and the failure was real but was not about the anatomy. The
   nucleus is a polygonal sphere, and the extent of a POLYHEDRON depends on how it is turned: the
   measured radius runs 2.374678 at 0 and 45 degrees and 2.369594 at 20, 30, 60 and 75, a drift of
   0.0051, or 0.21%, which is 1 - cos(pi/N) for the blob's own ring count. It is the faceting step,
   the same kind of error bar FLOORS.CONSERVE carries for its quadrature and FLOORS.CUTX now carries
   for float32. The guard is set an order above the artefact and well below the signal it has to
   catch: claim B8-grown pins this same measure to +/-0.05, ten times this tolerance, so a yaw that
   actually changed the conservation would fail that claim and this control together. */
const anat = yaw.runs.every(r =>
  r.got.cutMaxX <= 1e-6 &&
  Math.abs(r.got.boreTaper - yaw.base.boreTaper) < 1e-4 &&
  Math.abs(r.got.nucleusR - yaw.base.nucleusR) < 0.01 &&
  r.got.between <= 0.02);
say(anat, 'and NOTHING ANATOMICAL MOVES WITH IT — at every one of those five angles the cut is still ' +
    'the median plane to within 1e-6 of a body radius, the annulus\\'s bore taper is unchanged, the ' +
    'nucleus\\'s conserved radius holds to within its own faceting step, and no nucleus has entered ' +
    'a vertebral body. That is the ' +
    'control: a yaw that turned the CUT rather than the SPECIMEN would pass the two rows above and ' +
    'fail this one');
say(Math.abs(yaw.restored.angle - yaw.base.angle) < 1e-9 &&
    Math.abs(yaw.restored.share - yaw.base.share) < 1e-9,
    '  and clearing ADU_YAW restores the model exactly');

"""
io.open(f,'w',encoding='utf-8').write(s.replace(anchor, block + anchor))
print('ok')
