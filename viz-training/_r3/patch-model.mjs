import { readFileSync, writeFileSync } from 'fs';
const F = process.argv[2];
let s = readFileSync(F, 'utf8');
const n0 = s.length;
function sub(a, b, label) {
  const i = s.indexOf(a);
  if (i < 0) throw new Error('anchor not found: ' + label);
  if (s.indexOf(a, i + 1) >= 0) throw new Error('anchor not unique: ' + label);
  s = s.slice(0, i) + b + s.slice(i + a.length);
}

/* ─── 1 · the yaw constant ─── */
sub(
"const ADU_CUT = Math.PI / 2;",
`const ADU_CUT = Math.PI / 2;
/* THE SEGMENT IS TURNED OFF THE CUT-PLANE NORMAL, because a median section viewed along its own
   normal is a flat chart. Review round 2 found beat 8 reading as "featureless grey rectangles with
   no three-dimensional form at all", and it was right about the cause: viz3d offers only the six
   world-axis cameras (VIEW_DIR, copied in section 13), \`lateral\` IS the median plane's normal, and
   there is no oblique camera and no per-view yaw to ask for — \`scene.camera.initialYaw\` is applied
   once to the whole scene, so using it would turn every other beat as well. The camera cannot move,
   so the SPECIMEN turns, which is what a demonstrator does with a hemisected spine on the bench.
   The rotation is about the segment's OWN long axis and is BAKED INTO THE VERTICES rather than left
   on the group, so it survives the adapter lifting each part out by key.
   WHY 45 DEGREES, measured on the built triangles rather than chosen by eye — see acceptance row AA
   and the figures in BUILD-LOG. Two numbers bracket it. Turn too little and the cut face still owns
   the whole picture (cutFaceProjShare 1.000 at 0 degrees, 0.966 at 20, 0.923 at 30); turn too far
   and the annulus's own near wall starts eating the nucleus, which is this beat's HIGHLIGHTed
   subject (its share of the frame in the player walk: 1.221% face-on, 1.008% at 45, 0.856% at 60).
   45 degrees puts the cut face at 0.80 of the projection, leaving a fifth of it to the uncut outer
   surface, and keeps the nucleus at 82.6% of its face-on coverage.
   NOTHING ANATOMICAL MOVES. The cut is still exactly the median plane and row T still measures it —
   now against the plane's own normal derived from the built triangles instead of against the x axis,
   which is the same assertion written so that it cannot be satisfied by a happy choice of frame. */
const ADU_YAW = 45 * Math.PI / 180;`, 'ADU_YAW const');

/* ─── 2 · bake the yaw ─── */
sub(
`      addPart(g, 'nucleus_pulposus', blob(0, y, 0, rN, hN / 2, rN), { outline: 0.012 });
  }
}`,
`      addPart(g, 'nucleus_pulposus', blob(0, y, 0, rN, hN / 2, rN), { outline: 0.012 });
  }
  /* turn the whole segment about its own long axis — see ADU_YAW. Baked into every geometry this
     function added, silhouette shells included, so a part lifted out by the adapter carries it. */
  if (ADU_YAW) {
    const M = new T.Matrix4().makeRotationY(ADU_YAW);
    g.traverse(c => {
      if (c.geometry && !c.geometry.userData.__yawed) {
        c.geometry.applyMatrix4(M);
        c.geometry.userData.__yawed = 1;
      }
    });
  }
}`, 'bake yaw');

/* ─── 3 · the cut plane's own normal, derived from the built triangles ─── */
sub(
"    /* ─ review round 1, beat 8: the median cut, and the void that is no longer in the disc ─ */\n    case 'adultCutMaxX': {",
`    /* ─ review round 1, beat 8: the median cut, and the void that is no longer in the disc ─ */
    case 'adultCutMaxX': {`, 'anchor cutMaxX');

sub(
`      const V = vertsByKey(u, opts).flat;
      let worst = -Infinity;
      for (const k of ['vertebral_body', 'annulus_fibrosus']) {
        const a = V[k]; if (!a) continue;
        for (let i = 0; i < a.length; i += 3) if (a[i] > worst) worst = a[i];
      }
      return worst === -Infinity ? 99 : worst / (ADU_R_BODY * ADU_SCALE);`,
`      /* MEASURED AGAINST THE CUT PLANE'S OWN NORMAL, not against the x axis. Before the segment was
         turned (ADU_YAW) those were the same vector and this read \`a[i]\`, the raw x; written that
         way it is a statement about the world frame rather than about the cut, and it would have
         gone red on a change that moved nothing anatomical. The normal is DERIVED from the built
         triangles by adultCutNormal() below — nothing here reads ADU_YAW — so at a yaw of zero this
         returns exactly what it returned before, and row T's assertion is unchanged in meaning. */
      const V = vertsByKey(u, opts).flat;
      const n = adultCutNormal(u, opts); if (!n) return 99;
      let worst = -Infinity;
      for (const k of ['vertebral_body', 'annulus_fibrosus']) {
        const a = V[k]; if (!a) continue;
        for (let i = 0; i < a.length; i += 3) {
          const d = a[i] * n.x + a[i + 1] * n.y + a[i + 2] * n.z;
          if (d > worst) worst = d;
        }
      }
      return worst === -Infinity ? 99 : worst / (ADU_R_BODY * ADU_SCALE);`, 'cutMaxX body');

/* ─── 4 · the two new measures ─── */
sub(
"    case 'stackAcross':    return stackAcross(u, opts, path[1] || 'inferior');",
`    case 'stackAcross':    return stackAcross(u, opts, path[1] || 'inferior');
    /* ─ review round 2, beat 8: is the median section seen face-on? §3.y — the claim is measured on
         the screen plane of the camera the beat rotates to, through the VIEW_DIR table copied from
         viz3d, so it moves when the beat's camera moves. ─ */
    case 'cutFaceAngle': {
      const n = adultCutNormal(u, opts); if (!n) return -1;
      const d = screenAxes(path[1] || 'lateral').dir;
      return Math.acos(Math.min(1, Math.abs(n.x * d.x + n.y * d.y + n.z * d.z))) * 180 / Math.PI;
    }
    case 'cutFaceProjShare': {
      /* WHAT THE ANGLE COSTS THE PICTURE. The share of the segment's projected area, on that
         camera, contributed by the flat cut faces themselves. A section seen along its own normal
         gives 1.000 — every other surface is edge-on and projects nothing, which IS the flat chart
         review round 2 found. Area-weighted over the built triangles of the two cut solids. */
      const n = adultCutNormal(u, opts); if (!n) return 1;
      const d = screenAxes(path[1] || 'lateral').dir;
      const V = vertsByKey(u, opts).flat;
      let cut = 0, all = 0;
      for (const k of ['vertebral_body', 'annulus_fibrosus']) {
        const a = V[k]; if (!a) continue;
        for (let i = 0; i + 8 < a.length; i += 9) {
          const ux = a[i + 3] - a[i], uy = a[i + 4] - a[i + 1], uz = a[i + 5] - a[i + 2];
          const vx = a[i + 6] - a[i], vy = a[i + 7] - a[i + 1], vz = a[i + 8] - a[i + 2];
          const nx = uy * vz - uz * vy, ny = uz * vx - ux * vz, nz = ux * vy - uy * vx;
          const two = Math.hypot(nx, ny, nz); if (two < 1e-12) continue;
          const proj = Math.abs(nx * d.x + ny * d.y + nz * d.z) / 2;   // area * |n . d|
          all += proj;
          const al = Math.abs((nx * n.x + ny * n.y + nz * n.z) / two);
          if (al > 0.999) cut += proj;
        }
      }
      return all < 1e-12 ? 1 : cut / all;
    }`, 'new measures');

/* ─── 5 · adultCutNormal helper, placed just before claimMeasure ─── */
sub(
"function claimMeasure(name, t) {",
`/** THE CUT PLANE'S OWN NORMAL, READ OFF THE BUILT TRIANGLES. The median cut leaves two coplanar
    rectangular faces on every vertebral body — one each side of the bore — and they share one
    outward normal, so their combined area is far the largest single planar area on the segment once
    the end plates (normal along the long axis) are excluded. Binning the triangle normals by area
    and taking the heaviest bin therefore recovers the cut plane without reading ADU_YAW, which is
    what lets row T and row AA both be assertions about the geometry rather than restatements of the
    constant that built it (RENDER-STANDARD, "an acceptance measurement must be a function of the
    built geometry"). */
function adultCutNormal(u, opts) {
  const V = vertsByKey(u, opts).flat.vertebral_body;
  if (!V) return null;
  const bins = new Map();
  for (let i = 0; i + 8 < V.length; i += 9) {
    const ux = V[i + 3] - V[i], uy = V[i + 4] - V[i + 1], uz = V[i + 5] - V[i + 2];
    const vx = V[i + 6] - V[i], vy = V[i + 7] - V[i + 1], vz = V[i + 8] - V[i + 2];
    let nx = uy * vz - uz * vy, ny = uz * vx - ux * vz, nz = ux * vy - uy * vx;
    const two = Math.hypot(nx, ny, nz); if (two < 1e-12) continue;
    nx /= two; ny /= two; nz /= two;
    if (Math.abs(ny) > 0.2) continue;                 // end plates and caps are not the cut
    const key = Math.round(nx * 100) + '|' + Math.round(nz * 100);
    const e = bins.get(key) || { a: 0, x: 0, y: 0, z: 0 };
    e.a += two / 2; e.x += nx * two / 2; e.y += ny * two / 2; e.z += nz * two / 2;
    bins.set(key, e);
  }
  let best = null;
  for (const e of bins.values()) if (!best || e.a > best.a) best = e;
  if (!best) return null;
  const L = Math.hypot(best.x, best.y, best.z);
  return L < 1e-12 ? null : { x: best.x / L, y: best.y / L, z: best.z / L };
}

function claimMeasure(name, t) {`, 'adultCutNormal');

/* ─── 6 · floors ─── */
sub(
"  BORECLEAR: 0.06,   // and at the equator the bore sits on the nucleus to within this fraction of\n                     // the nucleus's radius — the 4% clearance the build declares, plus quadrature",
`  BORECLEAR: 0.06,   // and at the equator the bore sits on the nucleus to within this fraction of
                     // the nucleus's radius — the 4% clearance the build declares, plus quadrature
  /* ─── the floor review round 2 added: beat 8 was a flat chart ─── */
  CUTANGLE: 30,      // degrees between the median cut's own normal and the camera beat 8 stands at.
                     // Zero is the defect: the section seen along its own normal. The floor is at 30
                     // rather than at a token few degrees because the SHARE below is what decides
                     // whether the picture reads, and 30 degrees is where that measure first leaves
                     // the flat band — see the measured curve at ADU_YAW.
  CUTSHARE: 0.85,    // and at most this share of the segment's projected area, on that same camera,
                     // may be the flat cut faces themselves. MEASURED on the built triangles:
                     // 1.0000 at a yaw of 0 (the chart), 0.9659 at 20 degrees, 0.9226 at 30, 0.7996
                     // at 45, 0.6487 at 60. The floor sits between 30 and 45 — it has to reject the
                     // two angles whose pictures were looked at and still read flat, and accept the
                     // one that does not.`, 'floors');

/* ─── 7 · the acceptance row ─── */
sub(
"    { id: 'Z', must: 'and neither window is a HOLE: the sheet plus its inlay covers the midline with no gap' },",
`    { id: 'Z', must: 'and neither window is a HOLE: the sheet plus its inlay covers the midline with no gap' },
    { id: 'AA', must: 'beat 8\\'s median section is not seen along its own normal: the cut plane, derived from the built triangles, stands at an angle to that beat\\'s camera and the flat cut faces do not own the whole projection' },`, 'row AA decl');

sub(
`  /* Y — review round 1, beat 3: a plateau, not a cone, at both t a beat shows the plate at */`,
`  /* AA — review round 2, beat 8: the section is seen obliquely, not along its own normal.
     RENDER-STANDARD §3.y: measured on the screen plane of the camera the beat rotates to. The
     camera is read from the SCENE's own ops by the render harness and asserted against the view
     named here, so the row cannot go on measuring a camera the beat has stopped standing at. */
  {
    const t = SCENE_T_MAX;
    m.AA_view = 'lateral';
    m.AA_angleDeg = claimMeasure('cutFaceAngle.lateral/adult', t);
    m.AA_cutShare = claimMeasure('cutFaceProjShare.lateral/adult', t);
    /* and the cut is STILL exactly the median plane — the same number row T asserts, repeated here
       so that a yaw introduced to fix the picture cannot quietly take the section with it */
    m.AA_cutMaxX = claimMeasure('adultCutMaxX/adult', t);
    ok.AA = m.AA_angleDeg >= F.CUTANGLE && m.AA_cutShare <= F.CUTSHARE && m.AA_cutMaxX <= F.CUTX;
  }
  /* Y — review round 1, beat 3: a plateau, not a cone, at both t a beat shows the plate at */`, 'row AA block');

/* ─── 8 · negatives ─── */
sub(
"  N('Y', 'the graded-response plate the review rejected (plateau 0.150) is rejected',",
`  N('AA', 'the face-on median section review round 2 found — the cut plane square to beat 8\\'s own camera — is rejected',
    () => !(0 >= F.CUTANGLE));
  N('AA2', 'and so is a turn too small to change the picture: at 20 degrees the cut faces still own 96.6% of the projection',
    () => !(0.9659 <= F.CUTSHARE));
  N('AA3', 'a yaw that took the cut off the median plane with it — half a body radius of overshoot — is rejected',
    () => !(0.5 <= F.CUTX));
  N('Y', 'the graded-response plate the review rejected (plateau 0.150) is rejected',`, 'negatives');

writeFileSync(F, s);
console.log('patched', F, n0, '->', s.length);
