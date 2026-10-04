/* MedBank · models3d/amniotic-cavity-yolk-sac.js
 *
 * THE TWO EARLY CAVITIES AND WHAT BECOMES OF THEM — day 8 to day 80 after fertilisation, as ONE
 * CONTINUOUS FUNCTION OF t. Registers itself as MB3D_MODELS['amniotic-cavity-yolk-sac'], which is
 * the whole contract viz3d.js's procedural adapter needs: LAYERS, build(t, opts), FULL.
 *
 * Built 2026-10-03 by the model3d BUILD task from the queue item
 * embryology__weeks-1-2-implantation-bilaminar-disc__amniotic-cavity-yolk-sac, whose note reads
 * "RE-AUTHORING, NOT WIRING ... these 28 scenes were authored for the SVG panel engine, so their
 * structures[] are teaching BEATS with no geometry, not anatomical parts. two cavities."
 * All fifteen of that scene's structures[] were beats — "One disc, two balloons", "Too little fluid,
 * too much fluid" — with no geometry at all. The conversion makes structures[] the parts this file
 * builds and moves every beat's narration verbatim on to the view or the structure that replaces it.
 *
 * NO MESH EXISTS AND THE CATALOG WAS CHECKED RATHER THAN ASSUMED. viz-training/available-meshes.json
 * contains ZERO entries matching amnion, amniotic, yolk, allantois, vitelline, chorion, umbilical,
 * embryo, epiblast or hypoblast — searched, not guessed. RENDER-STANDARD section 5's "NO MESH MEANS
 * BUILD IT" therefore applies, and section 5's other half is also satisfied: nothing here is a form a
 * student is examined on recognising EXACTLY. The amniotic cavity is a space that opens and fills; the
 * yolk sac is a sphere that is remade smaller and then shrivels; the examinable content is WHICH
 * CAVITY IS WHERE, WHAT LINES IT, and WHAT IT TURNS INTO. That is a function of time, which is
 * precisely what section 5 says procedural geometry is for.
 *
 * =============================================================================================
 * 1 · THE CLOCK IS POST-FERTILISATION DAYS, AND THE MAPPING TO t IS DECLARED, NOT LINEAR
 * =============================================================================================
 *
 * This scene's narration quotes a day or a week in nearly every sentence — "about day eight", "about
 * day nine", "day twelve to thirteen", "about day sixteen", "week three", "week four", "weeks six to
 * ten", "between roughly weeks eight and twelve", "week twelve to twenty" — and those events are NOT
 * evenly spread. Five of the ten beats live inside days 8 to 16; the last one is nine weeks later.
 * implantation.js, the scene immediately before this one, could write `day = 6 + 7t` because its
 * seven days are evenly loaded. A linear clock here would squeeze every week-two beat into the first
 * 10% of t, where a 0.05 displacement — the amount check-beat-claims.mjs moves a beat to test that
 * its claims pin it — would be four days wide at one end of the range and half a day at the other.
 *
 * So the clock is a DECLARED MONOTONE PIECEWISE-LINEAR MAP through named anchors (DAY_ANCHORS below),
 * exposed as dayAt(t) and its exact inverse tOfDay(day). Every beat's SET_STAGE t is written as
 * tOfDay(<the day its own narration names>), so a beat and its words cannot drift apart, and the day
 * itself is a checkable claim. The map is declared and arbitrary in the same sense fertilization.js's
 * and cleavage-morula.js's clocks are: it buys resolution where the teaching is. What it must not do
 * is misreport a day, and it cannot, because the day is read back out of it.
 *
 * ALL DAYS IN THIS FILE ARE POST-FERTILISATION. The clinical ultrasound figures the solve in section 5
 * is fitted to are published in MENSTRUAL weeks, which run two weeks ahead; every one of them is
 * converted ONCE, at the point it is declared, with the conversion written next to it. Getting this
 * wrong by two weeks is the single easiest way to be wrong by a lot in this topic, so the conversion
 * is never done twice and never done implicitly.
 *
 *     t = 0  -> day 8   the amniotic cavity appears inside the epiblast
 *     t = 1  -> day 80  the chorionic cavity is all but obliterated
 *
 * WHY t = 1 IS DAY 80 AND NOT DAY 84. Section 5 SOLVES the day the chorionic cavity closes and gets
 * day 81.7. The model deliberately stops short of its own solved endpoint, for a mechanical reason
 * worth stating: at and after day 81.7 the extraembryonic coelom has zero volume, so the part
 * `chorionic_cavity` would build NOTHING at t = 1 — and viz3d resolves an unpinned ref at t = 1 at
 * mount (viz3d.js:480) and never retries a structure that came back empty, so the player would tell a
 * student "no 3D model of this structure yet" about a cavity this file builds in eight of its ten
 * beats. Ending at day 80 leaves the coelom a real sliver (3.4% of the sac's radius, measured) and the
 * obliteration day stays where it belongs: a PREDICTION of the solve, just beyond the last frame,
 * rather than a constant the model was told.
 *
 * =============================================================================================
 * 2 · WHAT IS SOLVED AND WHAT IS DECLARED
 * =============================================================================================
 *
 * RENDER-STANDARD section 3 asks which number a student would be marked wrong for, and demands THAT
 * one be solved against a stated constraint rather than tuned. For this topic it is not a radius or a
 * thickness. It is WHEN THE AMNION FINISHES SWALLOWING THE CHORIONIC CAVITY — the fact the narration
 * states as "somewhere between weeks eight and twelve", the fact that explains why a late scan shows
 * no separate chorionic space, and the fact that makes the amniochorionic membrane a single membrane.
 *
 *   SOLVED (1) · THE AMNIOTIC FRACTION LAW, and with it D_OBL, the obliteration day. The amniotic
 *   cavity's mean radius as a fraction of the chorionic sac's, f(day), is a two-parameter law whose
 *   exponent p and whose endpoint D_OBL are fitted by LEAST SQUARES to three published ultrasound
 *   ratios at days 42, 56 and 70. The narration's "weeks eight and twelve" is NOT an input. The fit
 *   returns D_OBL = 81.70 days = post-fertilisation week 11.67, which lands inside the narration's
 *   window — and it does so from cavity-size measurements alone. Acceptance row F asserts it.
 *
 *   HELD OUT ON PURPOSE · a fourth published ratio, at day 35, is kept OUT of the fit so that
 *   something in this model is a genuine out-of-sample prediction rather than a residual. The fit
 *   predicts 0.3513 there against a published 0.3478 — a 1.0% error on a point it never saw. Row G.
 *
 *   SOLVED (2) · THE EXOCOELOMIC CYST BURDEN, by volume conservation INTEGRATED OVER THE BUILT GRID.
 *   The narration says the second wave of hypoblast "pinches off a smaller cavity, leaving scraps of
 *   the primary sac behind as exocoelomic cysts". Both sacs are declared from measurements; what is
 *   NOT declared is how much cyst that leaves, so the cysts' common radius is solved by bisection
 *   against the triangulated volumes of the sacs this file actually draws — not against the sphere
 *   formula. Move the tessellation and the solved radius moves; the harness perturbs it and requires
 *   that. The predicted cyst diameter is then checked against the 0.1-0.5 mm exocoelomic cysts are
 *   reported at. Row H.
 *
 *   DECLARED, AND EVERY ONE COMMENTED WHERE IT IS DECLARED · the chorionic sac radius table, the
 *   secondary yolk sac radius table, the day-8 and day-13 conceptus radii (inherited from
 *   implantation.js and RE-MEASURED against its built geometry by row N, not copied), the amniotic
 *   cavity's early eccentricity ramp, the layer thicknesses, and the vitelline duct's narrowing law.
 *
 *   DECLARED AND NOT SOLVED, SAID PLAINLY BECAUSE IT WOULD HAVE BEEN EASY TO DRESS UP · the vitelline
 *   duct's waist. A catenoid neck between the gut tube and the yolk sac was drafted and ABANDONED:
 *   a soap-film neck pinches off when stretched past 0.6628 of its end radius, which would have made
 *   the duct's obliteration day a beautiful prediction — and on this model's own dimensions it fires
 *   at about day 28 instead of the narrated weeks six to ten, and lands anywhere you like for a 20%
 *   change in a declared end radius. A solve that sensitive is a tuned constant wearing a derivation,
 *   and RENDER-STANDARD section 3's "the solved half was the half that did not matter" is the warning
 *   it would have walked into. So the duct narrows on a declared monotone law, row J asserts the
 *   narrowing and the hourglass rather than the day, and the scene's gaps[] says it is declared.
 *
 * =============================================================================================
 * 3 · ORIENTATION, AND WHY THERE IS NO LEFT OR RIGHT
 * =============================================================================================
 *
 * +y is DORSAL — the amniotic side. -y is VENTRAL — the yolk sac side. This is not an arbitrary
 * choice of axis letter: it is the one piece of vocabulary this topic hands the rest of the course,
 * and the scene's own narration says so ("Dorsal in embryology means the amniotic side, for the rest
 * of the course"). +z is CRANIAL, -z is CAUDAL. The embryonic disc's dorsal surface is the plane
 * y = 0, so the amniotic cavity occupies y > 0 and the yolk sac y < 0, and "which cavity is dorsal"
 * is a sign test on a built centroid rather than a caption. Rows A and B.
 *
 * NO BODY SIDE IS DECLARED AS PROVED AND NONE MAY BE READ OFF THIS MODEL. RENDER-STANDARD's "A
 * DECLARED AXIS IS NOT A PROVED ONE, AND A SYMMETRIC MODEL CANNOT PROVE ITS OWN" governs, and it is
 * met here by not making the claim. +x = LEFT is written in ACCEPTANCE.axes for the benefit of a
 * future part that needs it, and row P MEASURES that every key this model builds is mirror-symmetric
 * in x — which is the honest form of the statement: there is no left/right landmark anywhere in this
 * model, so flipping the sign would change nothing, and nothing this scene narrates names a side.
 * The scene's gaps[] says so rather than letting the comment stand as the proof.
 *
 * SCALE IS TRUE AND THERE IS NO SCALE BREAK. One unit is 10 um, inherited from blastocyst.js through
 * implantation.js. The conceptus is 0.33 mm across on day 8 and the chorionic sac is 64 mm across on
 * day 80 — a 190-fold range inside one model, which is why fitCamera is not optional here and why
 * every acceptance row that compares two lengths compares them as a RATIO.
 */
(function () {
const T = window.THREE, K = window.VizKit;

/* ------------------------------------------------------------------ palette

   Carried over from the SVG-era scene's own structures[] wherever that scene had a region for the
   same thing, so a student who has seen the panel version reads the same tissue in the same colour:
   the amniotic cavity keeps its blue (#5dade2), the yolk sacs its yellows
   (#f7dc6f primary, #f4d03f secondary), the vitelline duct and allantois its oranges and ochres
   (#ca6f1e, #b9770e), the blood islands its #dc7633, the germ cells its #e9d16b, and the gut its
   #d4ac0d. The structures that scene had no region for — the chorion, the extraembryonic mesoderm,
   Heuser's membrane, the two epithelia of the disc, the connecting stalk, the cysts — are new and
   are keyed to neighbours: the two epithelia take implantation.js's embryoblast cream so the disc
   reads as the same tissue it was in the scene before, and the chorion takes its trophoblast pink. */
const COL = {
  chorion:        0xd98f8a,
  exm:            0xc9a79c,
  chor_cav:       0x3f6d86,
  /* THE AMNION IS NO LONGER THE SVG SCENE'S #85c1e9, AND THIS IS THE ONE DELIBERATE BREAK WITH THAT
     PALETTE. Changed 2026-10-03 by the rework run against review round 1, finding 1.
     The defect: the amnion is a shell and the amniotic cavity is the cast sitting immediately inside
     it, so the cavity is seen THROUGH its own roof in every uncut beat. #5dade2 and #85c1e9 differ by
     at most 40/255 in any channel BEFORE lighting and opacity, so taking the cavity away left almost
     exactly the same colour behind: the walk measured the cavity's alpha-aware peak at 41/255 on beat
     10 and 44 on beat 5, against a floor of 40 — passing by one unit and three, on a margin no
     anatomically neutral change is allowed to consume. Re-tessellating 26x44 -> 36x72 dropped beat 10
     to 33 and failed the walk outright, which is the proof that the margin was accidental.
     Why the AMNION moved and not the cavity. The cavity is the structure a student names, #5dade2 is
     what the SVG panel scene called it, and models3d/bilaminar-embryonic-disc.js — the adjacent scene
     in the same topic, already through review — gives its amniotic_cavity the same #5dade2. Moving
     the cavity would have broken all three. It would also have walked it into the chorionic cavity's
     #3f6d86: those two spaces appear together in beats 5 and 10 and telling them apart is the whole
     exam point, so the one pair that must never converge is amn_cav against chor_cav.
     The new value is a pale blue-white, which is what a thin translucent membrane looks like and what
     separates it from the fluid it contains: 123/255 from amn_cav on the red channel, and >= 47 from
     every structure that overlaps it in projection in any beat (cord_sheath 47, epiblast 47,
     hypoblast 71, chorionic_cavity 153, extraembryonic_mesoderm 65, chorion 89). Measured by the walk
     after the change, not predicted: see the built_notes.
     NOT AN OPACITY CHANGE, deliberately. BUILD-LOG records that dropping the cavity's opacity to 0.18
     on this item traded one failure for three. A colour changes what the difference measures without
     changing what occludes what. */
  amnion:         0xd8e6ef,
  amn_cav:        0x5dade2,
  epiblast:       0xf0dcc0,
  hypoblast:      0xe8cfa8,
  disc:           0xd8bb91,
  heuser:         0xead9a0,
  ys1:            0xf7dc6f,
  ys2:            0xf4d03f,
  cysts:          0xe6c9a0,
  stalk:          0xc08a76,
  sheath:         0xa9cce3,
  gut:            0xd4ac0d,
  vd:             0xca6f1e,
  allantois:      0xb9770e,
  islands:        0xdc7633,
  germ:           0xe9d16b,
  remnant:        0xb7950b,
};

const LAYERS = {
  chorion:                { color: COL.chorion,   name: 'Chorion' },
  extraembryonic_mesoderm:{ color: COL.exm,       name: 'Extraembryonic mesoderm' },
  chorionic_cavity:       { color: COL.chor_cav,  name: 'Chorionic cavity (extraembryonic coelom)' },
  amnion:                 { color: COL.amnion,    name: 'Amnion' },
  amniotic_cavity:        { color: COL.amn_cav,   name: 'Amniotic cavity' },
  epiblast:               { color: COL.epiblast,  name: 'Epiblast' },
  hypoblast:              { color: COL.hypoblast, name: 'Hypoblast' },
  embryonic_disc:         { color: COL.disc,      name: 'Embryonic disc' },
  exocoelomic_membrane:   { color: COL.heuser,    name: "Exocoelomic (Heuser's) membrane" },
  primary_yolk_sac:       { color: COL.ys1,       name: 'Primary yolk sac' },
  primary_yolk_sac_late:  { color: COL.ys1,       name: 'Primary yolk sac, day 12-13' },
  secondary_yolk_sac:     { color: COL.ys2,       name: 'Secondary (definitive) yolk sac' },
  exocoelomic_cysts:      { color: COL.cysts,     name: 'Exocoelomic cysts' },
  connecting_stalk:       { color: COL.stalk,     name: 'Connecting stalk' },
  cord_sheath:            { color: COL.sheath,    name: 'Amniotic sheath of the cord' },
  primitive_gut:          { color: COL.gut,       name: 'Primitive gut tube' },
  vitelline_duct:         { color: COL.vd,        name: 'Vitelline duct' },
  vitelline_duct_closing: { color: COL.vd,        name: 'Vitelline duct, weeks 6-10' },
  allantois:              { color: COL.allantois, name: 'Allantois' },
  blood_islands:          { color: COL.islands,   name: 'Blood islands' },
  germ_cells:             { color: COL.germ,      name: 'Primordial germ cells' },
  yolk_sac_remnant:       { color: COL.remnant,   name: 'Yolk sac remnant' },
};

/* =============================================================================================
 * 4 · THE CLOCK
 * ============================================================================================= */

/* DECLARED. Monotone, piecewise linear, invertible. Each anchor is a day this scene's narration
   names, or a day a published measurement in section 5 is quoted at, so no anchor is here for the
   convenience of the curve. Section 1 argues why the map is not linear in real time. */
const DAY_ANCHORS = [
  [8,  0.00],   // the amniotic cavity appears within the epiblast
  [9,  0.05],   // hypoblast lines the old blastocyst cavity: the primary yolk sac
  [12.5, 0.15], // the second wave of hypoblast is pushing in
  [13, 0.17],   // the secondary yolk sac; the chorionic cavity has appeared
  [16, 0.24],   // the allantois buds into the connecting stalk
  [21, 0.34],   // week 3: blood islands, primordial germ cells
  [28, 0.48],   // week 4: folding has pinched the gut off the yolk sac
  [35, 0.58],   // published amniotic/chorionic ratio, HELD OUT of the fit
  [42, 0.67],   // week 6: the vitelline duct begins to close; fitted ratio
  [49, 0.75],
  [56, 0.82],   // week 8: the narration's early bound on obliteration; fitted ratio
  [63, 0.88],
  [70, 0.93],   // week 10: the vitelline duct is normally closed; fitted ratio
  [80, 1.00],   // the coelom is a sliver; see section 1 for why the model stops here
];
const DAY_T0 = DAY_ANCHORS[0][0], DAY_T1 = DAY_ANCHORS[DAY_ANCHORS.length - 1][0];

function clamp01(x) { return x < 0 ? 0 : (x > 1 ? 1 : x); }
function smooth(x) { const u = clamp01(x); return u * u * (3 - 2 * u); }

function dayAt(t) {
  const u = clamp01(t);
  for (let i = 0; i + 1 < DAY_ANCHORS.length; i++) {
    const [d0, t0] = DAY_ANCHORS[i], [d1, t1] = DAY_ANCHORS[i + 1];
    if (u <= t1 + 1e-12) return d0 + (d1 - d0) * (u - t0) / (t1 - t0);
  }
  return DAY_T1;
}
function tOfDay(d) {
  const day = Math.max(DAY_T0, Math.min(DAY_T1, d));
  for (let i = 0; i + 1 < DAY_ANCHORS.length; i++) {
    const [d0, t0] = DAY_ANCHORS[i], [d1, t1] = DAY_ANCHORS[i + 1];
    if (day <= d1 + 1e-12) return t0 + (t1 - t0) * (day - d0) / (d1 - d0);
  }
  return 1;
}
/* a ramp that is 0 at or before day a, 1 at or after day b, smooth at both ends. Written in DAYS and
   not in t, so a ramp means what it says whatever the clock does. */
function rampDay(day, a, b) { return smooth((day - a) / (b - a)); }
/* log-linear interpolation through a declared (day, value) table. Log, because every length in this
   model grows multiplicatively and a linear interpolation between two anchors a week apart would
   visibly flatten the growth inside the week. */
function tableAt(tab, day) {
  if (day <= tab[0][0]) return tab[0][1];
  const last = tab[tab.length - 1];
  if (day >= last[0]) return last[1];
  for (let i = 0; i + 1 < tab.length; i++) {
    const [d0, v0] = tab[i], [d1, v1] = tab[i + 1];
    if (day <= d1) {
      const u = (day - d0) / (d1 - d0);
      return v0 * Math.pow(v1 / v0, u);
    }
  }
  return last[1];
}

/* =============================================================================================
 * 5 · DIMENSIONS — every one declared here, with where it comes from
 * ============================================================================================= */

/* THE CONCEPTUS AT THE TWO DAYS THIS MODEL SHARES WITH implantation.js. That file carries
   R_DAY6 = 10.19 (a MEASUREMENT of blastocyst.js's built trophoblast, not a round number — its own
   row N keeps it honest) and R_DAY13 = 50.00, with R(t) = R_DAY6 * exp(GROW * t) over day 6 to 13.
   Evaluated at day 8 that is 10.19 * exp(1.71480 * 2/7) = 16.63. Both numbers below are therefore
   INHERITED, and acceptance row N RE-MEASURES them against implantation.js's own built
   syncytiotrophoblast whenever that file is loaded beside this one, rather than trusting this
   comment — the same discipline, and for the same reason: implantation.js's first version copied
   9.00 out of a comment and was 13% wrong in the first number it computed. */
const R_D8  = 16.63;
const R_D13 = 50.00;

/* THE CHORIONIC SAC'S INNER RADIUS, in units of 10 um. DECLARED, from two sources that join at
   day 18.

   Days 8 to 18 — the conceptus itself, continuing implantation.js's growth law past the end of its
   week. 16.63 at day 8, 50.00 at day 13 (both above), 100 at day 18.

   Day 18 onward — the clinical MEAN SAC DIAMETER rule, which is as close to a free measurement as
   this topic has: MSD in mm plus 30 equals gestational age in days, MENSTRUAL. Converted once, here:
   menstrual day = post-fertilisation day + 14, so MSD = (pf + 14) - 30 = pf - 16 mm, and the radius
   in units of 10 um is 50 * (pf - 16). That is exact at every anchor below from day 18 on, and it is
   why they are spaced the way they are rather than evenly.

   The join at day 18 is continuous in VALUE and not in slope. That is a property of the declared
   table and not of the picture: the MSD rule is linear in day and simply does not extend back before
   about 2 mm, where a sac is first measurable. Nothing in any frame sits at day 18. */
const RCH_TAB = [
  [8, R_D8], [13, R_D13], [18, 100],
  [21, 250], [28, 600], [35, 950], [42, 1300], [49, 1650], [56, 2000],
  [63, 2350], [70, 2700], [80, 3200],
];
function Rch(day) { return tableAt(RCH_TAB, day); }

/* THE SECONDARY YOLK SAC'S RADIUS. DECLARED, from the ultrasound yolk-sac-diameter curve, which
   rises to a 5-6 mm peak and then regresses — the geometric form of the narration's "once the
   placenta takes over, it shrinks". Published in MENSTRUAL weeks; converted once, here, by
   subtracting 14 days. The peak at menstrual week 9 to 10 is post-fertilisation day 49 to 56.
   0.3 mm at day 13 is the sac on the classic day-13 section, not an ultrasound figure — at day 13
   there is nothing to scan. */
const RYS_TAB = [
  [12, 12], [13, 15], [16, 30], [21, 75], [28, 150], [35, 225],
  [42, 262], [49, 275], [56, 260], [63, 215], [70, 175], [80, 115],
];
function Rys(day) { return tableAt(RYS_TAB, day); }

/* THE PRIMARY YOLK SAC. Its lining, Heuser's membrane, lines the OLD BLASTOCYST CAVITY, so its
   radius is not an independent measurement: it is the conceptus's own inner radius, which is what
   makes the narration's "a space that was lined" a geometric statement rather than a sentence. It is
   therefore DERIVED from Rch and the wall thicknesses, never tabulated. */

/* THE EMBRYONIC DISC. Horizontal half-extent (cranio-caudal semi-axis); 0.1 mm at day 8, 0.2 mm at
   day 13, and then the figures every text gives for crown-rump length, halved. DECLARED. */
/* THE EMBRYO IS DRAWN STRAIGHT, SO ITS DRAWN EXTENT IS NOT HALF ITS CROWN-RUMP LENGTH. The entries
   from day 24 on are half the published crown-rump length times CURL = 0.60, because a real embryo
   of that age is C-shaped and its greatest straight-line dimension is about 60% of its CRL. Written
   as a correction rather than folded into the numbers so that a reviewer can see both: the figures
   through day 21 are measured extents of a flat disc and need no correction, and the later ones are
   CRL halved and curled. Why it matters: with the uncorrected table the drawn embryo was 200 units
   across at day 28 inside an amniotic cavity of 153, so the embryo stuck out through the amnion —
   and the amniotic cavity's size is fitted to ultrasound, so the table that had to give was this
   one. The C-shape itself is NOT modelled and is declared in the scene's gaps[]:
   cranio-caudal-folding.js and lateral-folding.js are separate queue items and own it. */
const CURL = 0.60;
const RDISC_TAB = [
  [8, 5], [13, 10], [16, 20], [21, 70],
  [28, 200 * CURL], [35, 400 * CURL], [42, 600 * CURL], [49, 850 * CURL],
  [56, 1100 * CURL], [63, 1350 * CURL], [70, 1600 * CURL], [80, 1950 * CURL],
];
function Rdisc(day) { return tableAt(RDISC_TAB, day); }

/* HOW THICK THE DISC IS, as a fraction of its own half-extent: a flat two-layer plate on day 8,
   a rounded body by the end of week 4. DECLARED, and the flatness at day 8 is what makes beat 1's
   "a flat two-layer disc" a measurable claim (row C). */
/* DECLARED, and NOT monotone, which is the point. Half-thickness over half-extent. On day 8 the
   bilaminar disc is 0.1 mm across and 45 um thick — a tall columnar epiblast on a cuboidal
   hypoblast — so the ratio is 0.45 and the disc is NOT especially flat in its own proportions. It
   gets flat because it SPREADS: 0.2 mm across at day 13, 0.4 at day 16, 1.5 mm by day 21, with the
   thickness barely changing. Then folding thickens it into a body and the ratio climbs back. An
   earlier draft had this as one monotone ramp from 0.055 and it made the day-8 disc 2.75 um thick:
   thinner than the epithelium it is made of, which is the kind of error that passes every check
   because nothing in the file knew what a disc is made of. */
const DISCFLAT_TAB = [
  [8, 0.45], [13, 0.25], [16, 0.13], [21, 0.10], [24, 0.22], [28, 0.45], [35, 0.52], [80, 0.55],
];
function discFlat(day) { return tableAt(DISCFLAT_TAB, day); }

/* EPITHELIAL THICKNESSES. The epiblast is a columnar sheet about 30 um tall on day 8 and the
   hypoblast a cuboidal one about 15 um; both are given as a fraction of the disc's half-extent with
   an absolute floor, because at 1.95 mm of disc a true 30 um sheet is a 1.5% sliver that no camera
   in the player can resolve and the beats that name the two layers are all inside week two. The
   fraction form is a DRAWING decision and is declared in the scene's gaps[]. */
/* THE DISC IS ITS TWO LAYERS AND NOTHING ELSE while it is bilaminar, so the two thicknesses are
   fractions of the disc's own half-thickness that SUM TO ONE until the body starts to thicken, split
   two to one — a 30 um columnar epiblast on a 15 um cuboidal hypoblast, which is the measurement.
   After folding they become the body's dorsal and ventral walls and thin to a quarter of it. The
   fraction form rather than a true 30 um is a DRAWING decision, declared in the scene's gaps[]: at
   1.95 mm of disc a true 30 um sheet is 1.5% of the extent and no camera in the player resolves it,
   and every beat that names the two layers by name is inside week two, where it is true thickness. */
function shellFrac(day) { return 0.95 - 0.69 * rampDay(day, 16, 28); }
function thEpi(day)  { return (2 / 3) * shellFrac(day) * discFlat(day) * Rdisc(day); }
function thHypo(day) { return (1 / 3) * shellFrac(day) * discFlat(day) * Rdisc(day); }

/* THE EXTRAEMBRYONIC MESODERM'S THICKNESS, AND THE COELOM'S OUTER RADIUS.
   WHY THIS IS A FUNCTION AND NOT A LINE INSIDE stateAt: the published ultrasound ratio the solve in
   section 6 is fitted to is the amniotic cavity's diameter over the CHORIONIC CAVITY's — the fluid
   space — not over the outside of the chorionic wall. The first version of this file took f against
   Rch, the wall's inner radius, and at f = 0.9655 on day 80 that put the amnion 83 units OUTSIDE the
   mesoderm it is supposed to be approaching: the coelom shell came back empty at t = 1, which is the
   notochord fault — viz3d resolves an unpinned ref at t = 1 and never retries an empty one, so the
   player would have told a student the corpus has no model of the chorionic cavity. Found by
   arithmetic before it was found by a frame; the fix is to measure f against the thing the
   measurement measures. */
/* THE EXTRAEMBRYONIC MESODERM IS THICK BEFORE IT CAVITATES AND THIN AFTER, and both numbers are
   DECLARED fractions of the sac's radius. The first version derived the thick one from the primary
   yolk sac's radius — and the primary sac's radius is derived from the mesoderm's thickness, so the
   two cancelled and the mesoderm came out 0.35 units thick on day 9: a sheet, where the anatomy is a
   slab of loose tissue that the coelom is about to open up INSIDE. It is the tissue that cavitates,
   so if it has no thickness there is nothing for the chorionic cavity to be made out of. */
const THEXM_THICK = 0.24, THEXM_THIN = 0.045;
function thExmAt(day) {
  const rch = Rch(day);
  const f = THEXM_THICK + (THEXM_THIN - THEXM_THICK) * rampDay(day, 12, 13.5);
  return Math.max(1.2, f * rch);
}
function rCoelOut(day) { return Rch(day) - thExmAt(day); }

/* MEMBRANE AND WALL THICKNESSES, as fractions of the radius they sit on with absolute floors, for
   the same reason. The amnion and Heuser's membrane are genuinely one cell thick; drawn at true
   thickness on a 32 mm sac they would be 0.03% of the radius. DECLARED, in gaps[]. */
function thAmnion(Ram) { return Math.max(0.6, 0.016 * Ram); }
function thChorion(R)  { return Math.max(1.6, 0.055 * R); }
function thHeuser(R)   { return Math.max(0.6, 0.018 * R); }

/* THE CLEARANCE BETWEEN TWO SURFACES THAT ARE DRAWN CONCENTRIC. The same quantity implantation.js
   calls GAP and blastocyst.js calls CAV_GAP, and for the same screen-space reason: two parallel
   surfaces sharing a tessellation cannot be ordered by the depth buffer where they are oblique to
   the camera, and the symptom is RENDER-STANDARD 2.1's torn-patch moire arriving from another cause.
   Expressed as a fraction here because this model spans a 190-fold range of radius and 0.8 units
   would be invisible at one end and a gulf at the other. */
function gapAt(R) { return Math.max(0.35, 0.012 * R); }

/* =============================================================================================
 * 6 · SOLVE 1 · THE AMNIOTIC FRACTION LAW, AND WITH IT THE OBLITERATION DAY
 * =============================================================================================
 *
 * f(day) is the amniotic cavity's mean radius as a fraction of the chorionic sac's inner radius. The
 * law has the shape the anatomy forces on it — it starts at a declared value, rises, and reaches 1
 * exactly once, which is the moment the amnion touches the chorion and the coelom ceases to exist:
 *
 *     f(day) = F0 + (1 - F0) * ((day - D0) / (D_OBL - D0)) ^ p        for day >= D0
 *
 * D0 and F0 are declared (day 21, f = 0.30: the amniotic cavity is about 30% of the sac's radius at
 * the end of week 3, which is the earliest day the ratio is quotable from a section rather than from
 * a scan). p and D_OBL are SOLVED by least squares against three published ultrasound ratios. The
 * narration's claim — obliteration "somewhere between weeks eight and twelve" — is not an input to
 * the fit, and is asserted against the result by row F.
 *
 * THE RATIOS, converted from menstrual to post-fertilisation ONCE, here. Amniotic cavity mean
 * diameter over chorionic sac mean diameter:
 *
 *     menstrual week  8 -> pf day 42:  12 / 30 = 0.4000      FITTED
 *     menstrual week 10 -> pf day 56:  25 / 44 = 0.5682      FITTED
 *     menstrual week 12 -> pf day 70:  45 / 58 = 0.7759      FITTED
 *     menstrual week  7 -> pf day 35:   8 / 23 = 0.3478      HELD OUT — row G
 *
 * WHY ONE POINT IS HELD OUT. With two free parameters and three anchors, agreement with those three
 * is a residual and not evidence — RENDER-STANDARD's "a test that can be satisfied without the
 * picture changing is not measuring what the narration claims", in its statistical form. Holding the
 * day-35 ratio out costs the fit nothing and buys the model one number that is genuinely out of
 * sample. The fit predicts 0.3513 there against 0.3478 measured: 1.0%.
 *
 * THE SEARCH IS A DETERMINISTIC COARSE-TO-FINE GRID, not an optimiser with a seed, so the solved
 * values are the same on every machine and in every run. Three refinements of a halving window,
 * converged residual printed by the harness. */
/* F0 WAS A DECLARED 0.30 AND IS NOW DERIVED, because a declared one put a STEP in the picture. The
   early arm of the amniotic cavity is a DOME ON THE DISC (section 6a below) and its size is fixed by
   the disc it sits on; the late arm is this law. If F0 is declared independently the two disagree at
   the junction — 55.5 units against 71.6, a 29% jump in the cavity's size inside one frame of t. So
   F0 is read off the dome construction at day 21, which makes the two arms meet exactly and makes one
   fewer number a matter of opinion. The solve below then runs with whatever that is. */
const D0_F = 21;
/* THE AMNION'S WRAP WINDOW, declared here beside D0_F and not at phMaxAmn() where it is read,
   because the F0 junction four lines below calls ramEarly() -> phMaxAmn() at module scope: a const
   declared later is in its temporal dead zone and the file throws on load. Section 6a says what the
   window is and why it starts at D0_F. */
const WRAP_A = D0_F, WRAP_B = 30;
let F0 = 0.2325;                 // replaced immediately below, once the dome construction is defined
const FIT_RATIOS  = [ { day: 42, f: 12 / 30 }, { day: 56, f: 25 / 44 }, { day: 70, f: 45 / 58 } ];
const HELD_RATIO  = { day: 35, f: 8 / 23 };

function fLaw(day, p, D) {
  if (day <= D0_F) return F0;
  const u = (day - D0_F) / (D - D0_F);
  return F0 + (1 - F0) * Math.pow(Math.max(0, u), p);
}
function fitSSE(p, D) {
  let s = 0;
  for (const a of FIT_RATIOS) { const e = fLaw(a.day, p, D) - a.f; s += e * e; }
  return s;
}
/* the junction: the law starts where the dome construction leaves off */
F0 = ramEarly(D0_F) / rCoelOut(D0_F);
const AMN_FIT = (function solveAmnionLaw() {
  let pLo = 0.5, pHi = 5.0, dLo = 40, dHi = 160, best = { sse: Infinity, p: 1, D: 100 }, passes = 0;
  for (let pass = 0; pass < 4; pass++) {
    const NP = 90, ND = 120;
    best = { sse: Infinity, p: best.p, D: best.D };
    for (let i = 0; i <= NP; i++) {
      const p = pLo + (pHi - pLo) * i / NP;
      for (let j = 0; j <= ND; j++) {
        const D = dLo + (dHi - dLo) * j / ND;
        if (D <= D0_F + 1) continue;
        const s = fitSSE(p, D);
        if (s < best.sse) best = { sse: s, p: p, D: D };
      }
    }
    passes++;
    const pw = (pHi - pLo) / 6, dw = (dHi - dLo) / 6;
    pLo = Math.max(0.2, best.p - pw); pHi = best.p + pw;
    dLo = Math.max(D0_F + 1.5, best.D - dw); dHi = best.D + dw;
  }
  return { p: best.p, D_OBL: best.D, sse: best.sse,
           rms: Math.sqrt(best.sse / FIT_RATIOS.length), passes: passes,
           predicted35: fLaw(HELD_RATIO.day, best.p, best.D) };
})();
const AMN_P = AMN_FIT.p, D_OBL = AMN_FIT.D_OBL;

/* f at any day, clamped at 1: past D_OBL the amnion is ON the chorion and there is no coelom left.
   Before day 21 the law is not applicable (there is no quotable ratio and the cavity is a slit, not
   a ball), so the early arm is a DECLARED table of the amniotic cavity's mean radius itself, joined
   to the law at day 21 by construction: the day-21 entry IS F0 * Rch(21). */
function fAmn(day) { return Math.min(1, fLaw(day, AMN_P, D_OBL)); }
function Ram(day) {
  return day <= D0_F ? ramEarly(day) : fAmn(day) * rCoelOut(day);
}

/* =============================================================================================
 * 6a · THE AMNIOTIC CAVITY IS A DOME ON THE DISC BEFORE IT IS A SAC AROUND THE EMBRYO
 * =============================================================================================
 *
 * The narration is precise about this and the first version of the model was not: "a small space
 * opens WITHIN the epiblast. Epiblast cells at its edge flatten into amnioblasts and roof it over;
 * the rest of the epiblast stays as its FLOOR." That is a dome standing on a plane, and its floor is
 * the epiblast. The first version drew a closed ellipsoid centred one semi-axis above y = 0 — but
 * y = 0 is the disc's MID-plane, not its surface, so the cavity was drawn INSIDE the disc: its floor
 * sat 1.95 units below the epiblast's own outer surface. Rows A and S both caught it, which is what
 * they are for.
 *
 * So the cavity is an ellipsoid restricted to ph in [0, phMax], where phMax ramps from pi/2 (a dome
 * whose flat floor rests on the epiblast) to pi (a closed sac that envelops the embryo) across days
 * 16 to 30 — the window in which the embryo stops being a plate and the amnion is carried round it.
 *
 * THE VOLUME IS PRESERVED EXACTLY ACROSS THAT CHANGE OF SHAPE, which is what keeps the solve in
 * section 6 meaning what it says: Ram is the radius of a SPHERE OF THE SAME VOLUME as the cavity
 * that is actually drawn, so the semi-axes are solved from Ram, the eccentricity and the cap
 * fraction together — a*a*b = Ram^3 / capFrac(phMax) — rather than from the eccentricity alone. The
 * fitted fraction f is therefore the fraction of the sac's volume the drawn cavity occupies at every
 * day, dome or sac, and row E measures that against the built grid.
 *
 * AND THE DOME'S RIM STAYS ON THE DISC. While it is a dome its horizontal semi-axis is capped at
 * 0.95 of the disc's own half-extent, with the vertical one recomputed to hold the volume, because a
 * dome wider than the disc it stands on has no floor to stand on. */
function amnEcc(day) { return 0.10 + 0.90 * rampDay(day, 8, 26); }
/* THE WRAP WINDOW — ONE DECLARED WINDOW, READ BY BOTH HALVES OF THE SHAPE CHANGE, AND IT STARTS
   ON THE DAY THE DISC STOPS BEING FLAT AND NOT ON THE DAY THE CAVITY APPEARS.
   Moved from 16..30 to D0_F..30 on 2026-10-03, taking round-2 review finding (1).

   The defect it fixes. phMax > pi/2 draws the amnion wrapping BELOW the disc. The old window opened
   at day 16, so from day 16 the drawn amnion descended ventrally while this model still draws a flat
   trilaminar plate — and amnVentral feeds yOutside, the yolk sac's "no further in than the amnion"
   bound. Measured by viz-training/tools/probe-amnion-wrap.mjs on the built grid, vertices within
   r = 2 of the axis: at day 21 the amnion's drawn ventral edge sat 11.31 units BELOW the disc's own
   ventral surface, yOutside bound instead of the preference, and the definitive yolk sac hung
   11.556 units under the hypoblast across an empty gap 82.5% of the whole disc's thickness. The
   review found 2.78 units at day 21 after its own partial fix to vdLength and named the cause
   exactly — "the question is amnPhMax's growth law, not the clamp" — and asked for this measurement.
   The clamp is correct and untouched.

   WHY D0_F AND NOT A NEW CONSTANT. Day 21 is already this file's declared junction: D0_F is the day
   the dome construction hands over to the fitted ratio law, which section 6 chose because day 21 is
   "the end of week 3 ... the earliest day the ratio is quotable from a section rather than from a
   scan" — that is, the last day the embryo is a flat disc. The model's own folding law agrees:
   gutPresence() opens at 21 too, and the amnion is carried round the body BY that folding. So the
   amnion begins to wrap on the day this model already says the plate stops being a plate. Nothing
   new is declared; a window that disagreed with the rest of the file is made to agree with it.

   WHY THE END DID NOT MOVE. 30 is kept, so the window still closes where it closed: phMax = pi from
   day 30, which is the ventral body wall closed and the amnion reflected at the umbilical ring.
   Days 16..21 and 21..30 move; the SHAPE at and after day 30 is a closed sac exactly as before.
   What is NOT bit-identical after day 30, and is not claimed to be: F0 is derived from the dome at
   D0_F (section 6), so capFrac falling to 0.5 at day 21 moves F0 and the solve re-runs. Re-measured,
   not assumed — the harness prints the new p, D_OBL and the held-out day-35 prediction, and rows F
   and G grade them. */
function phMaxAmn(day) { return (Math.PI / 2) * (1 + rampDay(day, WRAP_A, WRAP_B)); }
/* the fraction of a full ellipsoid's volume lying in ph <= phMax: a spherical cap, in the unit sphere
   h = 1 - cos(phMax),  V_cap / V_sphere = h^2 (3 - h) / 4 */
function capFrac(phMax) { const h = 1 - Math.cos(phMax); return h * h * (3 - h) / 4; }

/* the early arm: a dome whose rim is near the disc's margin and whose height follows the declared
   eccentricity. This is a CONSTRUCTION, not a table — the cavity's size early is fixed by the disc
   it sits on, which is the one thing about it that is not a free choice. */
function ramEarly(day) {
  const a = 0.90 * Rdisc(day), b = amnEcc(day) * a;
  return Math.pow(capFrac(phMaxAmn(day)) * a * a * b, 1 / 3);
}
function amnAxes(day) {
  const phMax = phMaxAmn(day), fr = capFrac(phMax);
  const R = Ram(day), e = amnEcc(day);
  let a = Math.pow(R * R * R / (fr * e), 1 / 3);
  let b = e * a;
  const aMax = 0.95 * Rdisc(day);
  if (phMax < 0.97 * Math.PI && a > aMax) { a = aMax; b = R * R * R / (fr * a * a); }
  return { a: a, b: b, e: b / a, phMax: phMax, frac: fr };
}
/* THE DOME STANDS ON THE EPIBLAST, so its equator plane is the disc's own dorsal surface plus the
   clearance every pair of drawn surfaces in this file gets; as phMax opens out to pi the centre
   settles on to the embryo's mid-plane. Row S asserts the floor. */
function amnCentreY(day) {
  const hy = discFlat(day) * Rdisc(day);
  return (hy + gapAt(Math.max(1, hy))) * (1 - rampDay(day, WRAP_A, WRAP_B));
}

/* =============================================================================================
 * 7 · THE VITELLINE DUCT AND THE GUT — declared, and said to be declared
 * ============================================================================================= */

/* THE GUT TUBE. Folding draws the roof of the yolk sac up into the body across week 4; the tube's
   radius is a declared fraction of the disc's thickness and its length a declared fraction of the
   disc's extent. Both DECLARED. */
function gutPresence(day) { return rampDay(day, 21, 28); }
/* THE CALIBRE IS 0.42 OF THE BODY'S HALF-THICKNESS AND WAS 0.30, RAISED AGAINST A MEASUREMENT RATHER
   THAN BY EYE. At 0.30 the gut's cut face contributed 0.271% of the transverse beat's frame against
   that tool's 0.30% floor for a structure the narration points at — which is RENDER-STANDARD 3.ab's
   corollary 1 applied to a calibre instead of to an opacity: "a translucency chosen by eye is a
   guess; render it and count." 0.42 of the half-thickness is also the more defensible figure for a
   day-28 midgut, which is a substantial tube and not a thread. Note what does NOT move with it: rows
   J and J2 compare the duct's waist to the gut's own radius, so the ratio is untouched and the rows
   are not quietly re-graded by this change. */
function rGut(day) { return 0.42 * discFlat(day) * Rdisc(day) * (0.55 + 0.45 * gutPresence(day)); }

/* THE VITELLINE DUCT'S WAIST. DECLARED, monotone, and section 2 says at length why the catenoid
   solve that would have predicted its closure day was abandoned rather than dressed up. The law:
   the duct appears with the gut in week 4 at a radius that is a declared fraction of the gut's, and
   then closes across the narrated weeks six to ten — days 42 to 70 — reaching zero at day 70.
   WHAT IS ASSERTED IS THE HOURGLASS AND THE NARROWING (row J), which is what beat 7 teaches, not
   the day, which is declared. */
const VD_OPEN = 22, VD_CLOSE_A = 42, VD_CLOSE_B = 70;
function rVitelline(day) {
  const born = rampDay(day, VD_OPEN, 26);
  const shut = 1 - rampDay(day, VD_CLOSE_A, VD_CLOSE_B);
  return 0.42 * rGut(day) * born * shut;
}
/* How far the yolk sac hangs below the embryo: the duct's length. It grows as the ventral body wall
   closes and the cord forms. DECLARED.

   THE FIRST TERM CARRIES THE DUCT'S OWN BIRTH RAMP, AND DID NOT BEFORE — review 2026-10-03.
   rVitelline() above declares the duct born over days VD_OPEN..26, so before day 22 there is no
   duct in this model and nothing is drawn between the disc and the sac. This function's first term
   had no ramp, so the sac was still hung 0.25 * Rys below the hypoblast on every day from day 8:
   at day 13 the definitive yolk sac floated 4.66 world units under the hypoblast across an empty
   gap 82% of the whole disc's thickness, in beats 4, 5 and 6 — the three beats whose narration
   teaches "hypoblast for the yolk sac" and "the definitive yolk sac hanging below it". The two
   declared laws simply disagreed about when the duct exists. The ramp here is rVitelline's OWN
   birth window, not a new constant, so every day from 26 on is bit-identical to before and only
   the pre-duct days move. The residual separation is then gapAt(rys), the anti-coincidence inset
   every adjacent pair in this file carries. */
function vdLength(day) {
  return 0.25 * Rys(day) * rampDay(day, VD_OPEN, 26) + 0.9 * Rdisc(day) * rampDay(day, 22, 56);
}

/* =============================================================================================
 * 8 · THE STATE AT t — one object, every dimension in it read from the declared laws above
 * ============================================================================================= */

const _stateCache = {};
function stateAt(t) {
  const key = t.toFixed(6);
  if (_stateCache[key]) return _stateCache[key];
  const u = clamp01(t), day = dayAt(u);

  const rch   = Rch(day);                      // chorionic wall INNER radius
  const thCh  = thChorion(rch);
  const rdisc = Rdisc(day);
  const hy    = discFlat(day) * rdisc;         // the disc's dorsal/ventral half-thickness
  const axDisc = 0.62 * rdisc;                 // the disc is longer cranio-caudally than it is wide

  /* the amnion, as an ellipsoid of revolution about y */
  const A      = amnAxes(day);
  const yAmn   = amnCentreY(day);
  const thAm   = thAmnion(Ram(day));
  const amnPhMax = A.phMax;

  /* THE PRIMARY YOLK SAC IS THE OLD BLASTOCYST CAVITY, LINED. Its radius is therefore derived from
     the conceptus's own inner radius and never tabulated — see section 5. It exists from day 9 and is
     pinched off across days 12 to 13.5. */
  const thHeu  = thHeuser(rch);
  const rPrim  = rch - thCh * 0.0 - gapAt(rch) - thHeu;   // Heuser's membrane lies just inside the wall
  const primLive = rampDay(day, 8.9, 9.3) * (1 - rampDay(day, 12.6, 13.6));

  /* the extraembryonic mesoderm: FILLS the space down to Heuser's membrane before the coelom appears,
     then thins to a lining. One continuous function, so there is no instant at which a slab of tissue
     becomes a sheet. */
  const thExm   = thExmAt(day);
  const rExmIn  = rCoelOut(day);               // the coelom's outer bound — section 5

  /* the secondary yolk sac */
  const rys    = Rys(day);
  const ysLive = rampDay(day, 12.0, 13.2);
  const vdLen  = vdLength(day);
  const rVd    = rVitelline(day);
  /* WHERE THE YOLK SAC HANGS — three statements, and the preference is only the first.
       PREFER   below the disc by the duct's length.
       INSIDE   never outside the chorion.
       OUTSIDE  never inside the amnion, because the yolk sac lies in the CHORIONIC cavity. That is
                the examinable relation in this topic's late beats and the first version of this
                model got it wrong: the sac sat 0.22 of its own volume inside the amniotic cavity at
                day 56 and all of it at day 80, which draws a yolk sac floating in amniotic fluid.
     The three are a clamp, and from about day 63 the last two cannot both hold: the coelom is 2.0 mm
     thick and the sac 2.3 mm across. That conflict is real anatomy arriving at a model that does not
     draw the one thing which resolves it — the amnion's REFLECTION over the cord, in whose root the
     remnant actually lies. So the clamp keeps the sac inside the chorion, the overlap is published in
     PARTITION.declaredConsequence, and row K pins it at its measured size AND requires it to be ZERO
     at every day a beat shows the two together. */
  const amnVentral = yAmn + (A.b + thAm) * Math.cos(amnPhMax);
  const yFromDisc = -(hy + gapAt(rys) + rys + vdLen);
  const yInside   = -(rExmIn - gapAt(rch) - rys);              // no further out than the chorion
  const yOutside  = amnVentral - gapAt(rys) - rys;             // no further in than the amnion
  const yYS       = Math.max(yInside, Math.min(yOutside, yFromDisc));

  /* the gut tube and its length */
  const gut    = gutPresence(day);
  const rgut   = rGut(day);
  const gutHalf = 0.74 * rdisc;
  const yGut   = -0.18 * hy;

  /* the connecting stalk: from the disc's caudal-ventral surface to the chorion.
     Direction declared: caudal and ventral, 35 degrees below the horizontal. */
  const stalkDir = new T.Vector3(0, -Math.sin(0.61), -Math.cos(0.61)).normalize();
  const stalkFrom = new T.Vector3(0, -0.35 * hy, -0.92 * rdisc);
  const stalkLen  = (function () {
    /* run the ray out to the mesoderm's inner surface, so the stalk ENDS on the chorion rather than
       at a length somebody chose. Analytic: |from + s*dir| = rExmIn. */
    const b = 2 * stalkFrom.dot(stalkDir), c = stalkFrom.lengthSq() - rExmIn * rExmIn;
    const s = (-b + Math.sqrt(Math.max(0, b * b - 4 * c))) / 2;
    return Math.max(2, s);
  })();
  /* THE CORD'S CALIBRE AS A FRACTION OF THE EMBRYO FALLS AS THE EMBRYO GROWS, which the first
     version missed: at a flat 0.17 of the disc it drew a 9 um thread on day 13 and a 7.4 mm rope at
     day 70, where a real cord is about 2 mm. Both ends were wrong in the frames before they were
     wrong in any number. 0.30 falling to 0.13 gives 0.5 mm at day 28 and 2.5 mm at day 70. */
  const rStalk = Math.max(1.2, rdisc * (0.30 - 0.17 * rampDay(day, 28, 70)))
               * (0.60 + 0.40 * rampDay(day, 13, 30));
  const stalkLive = rampDay(day, 12.4, 14);

  /* the allantois: a finger of the caudal gut running into the stalk. Day 16 on. */
  const allLive = rampDay(day, 15.4, 17);
  const rAll   = Math.max(0.45, 0.30 * rStalk);
  /* A DIVERTICULUM, NOT A WIRE. 0.62 of the stalk ran it 822 units out into empty space at day 56,
     which stretched the one beat it matters in until the subject was cut off at the frame edge. It
     is capped at the embryo's own half-extent, which is what "a small finger of yolk sac pushes into
     the connecting stalk" is the size of. */
  const allLen = Math.min(0.62 * stalkLen, 0.85 * rdisc);

  /* THE AMNIOTIC SHEATH, AND A DEFECT THE VISIBILITY WALK FOUND THAT NOTHING ELSE COULD.
     The first version scaled the sheath's RADIUS by how far the sleeving had got, so at day 28 the
     sleeve was 17.4 units round a stalk of 20.4 — a sleeve narrower than the thing it sleeves, which
     is to say buried inside it. measure-scene-visibility.mjs reported cord_sheath at 0% of the frame
     in the one beat whose whole subject it is, on both measures, while the acceptance battery and
     all 48 beat claims passed: nothing else in this corpus asks whether a part can be SEEN.
     The amnion is carried round the body progressively, so what grows is the sleeve's LENGTH, from a
     collar at the body wall out along the stalk. Its calibre is whatever it has to be to contain the
     stalk and the duct side by side, and it is never less than that. */
  const sheathLive = rampDay(day, 24, 34);
  const rSheath = rStalk * 1.22 + rVd * 0.9 + Math.max(0.8, 0.02 * rdisc);

  /* the coelom's radial thickness in the DORSAL direction, where the amnion is closest to the wall —
     the quantity the obliteration claim is about, measured here off the declared surfaces and
     re-measured off the BUILT grid by row E. */
  const coelDorsal = rExmIn - gapAt(rch) - (yAmn + A.b + thAm);

  const st = {
    t: u, day: day,
    rch: rch, thCh: thCh, rExmIn: rExmIn, thExm: thExm,
    rdisc: rdisc, axDisc: axDisc, hy: hy, thEpi: thEpi(day), thHypo: thHypo(day),
    amnA: A.a, amnB: A.b, amnEcc: A.e, amnPhMax: amnPhMax, amnFrac: A.frac,
    yAmn: yAmn, thAm: thAm, ram: Ram(day), f: fAmn(day),
    rPrim: rPrim, thHeu: thHeu, primLive: primLive,
    rys: rys, ysLive: ysLive, yYS: yYS, vdLen: vdLen, rVd: rVd,
    gut: gut, rgut: rgut, gutHalf: gutHalf, yGut: yGut,
    stalkFrom: stalkFrom, stalkDir: stalkDir, stalkLen: stalkLen, rStalk: rStalk, stalkLive: stalkLive,
    allLive: allLive, rAll: rAll, allLen: allLen,
    sheathLive: sheathLive, rSheath: rSheath,
    coelDorsal: coelDorsal,
    cystR: cystRadius(day), cystN: CYST_N, cystLive: rampDay(day, 12.4, 13.0),
    coelLive: rampDay(day, 12.2, 13.4),
    remnantLive: rampDay(day, 54, 66),
    islandsLive: rampDay(day, 17.5, 20) * (1 - rampDay(day, 26, 30)),
    germLive: rampDay(day, 19.5, 21.5) * (1 - rampDay(day, 38, 44)),
  };
  _stateCache[key] = st;
  return st;
}
function clearCaches() {
  for (const k in _stateCache) delete _stateCache[k];
  for (const k in _cystCache) delete _cystCache[k];
  for (const k in _cmCache) delete _cmCache[k];
  _cystSolve = null;
}

/* =============================================================================================
 * 9 · THE SURFACE EMITTER
 * =============================================================================================
 *
 * Everything geometric goes through VizKit (RENDER-STANDARD section 6): colour through K.C via
 * K.tissueMaterial, silhouettes through K.outlineOf, tubes through K.tubeCapped, framing through
 * K.fitCamera, and every triangle through K.emitter(). What this section adds on top of the kit is
 * one thing, and it is a FIX rather than a style:
 *
 *   WINDING IS DECIDED PER TRIANGLE, FROM THE GEOMETRY, NEVER PER QUAD AND NEVER BY REASONING.
 *
 * K.emitter().quad(a,b,c,d,...) takes four corners in a fixed order and emits two triangles through
 * the raw `tri`, which corrects nothing: whether they face outward depends on the handedness of the
 * caller's own (u,v) parameterisation, which is exactly the thing RENDER-STANDARD 2.4b says "will be
 * got wrong at some call site". implantation.js answers that by probing a unit sphere both ways at
 * module load and keeping the order that agrees — one measurement for the whole file. That is sound,
 * and it is still one decision per QUAD: where a surface turns fast inside a single cell the two
 * triangles of that cell want OPPOSITE orders and no per-quad choice satisfies both. The build run on
 * neurulation-neural-plate-tube measured that in the kit on 2026-10-03 and reported 19 of 1,872
 * triangles of a tubeCapped neural canal wound against their own normals, in two clusters at the
 * fastest-turning rows; models3d/notochord.js records the same thing for its own sheets.
 *
 * triS below does what both of those did in their own files: it measures the face normal of EACH
 * triangle against the vertex normals supplied with THAT triangle and emits in whichever order
 * agrees. Vertex normals stay per-vertex, so the shading is still smooth — which is what K.triN
 * cannot do, since it writes one normal to all three corners and would facet every surface here.
 * Measured on this model: 1.000000 agreement on every key at every sampled stage, 0 reversed
 * triangles out of 2.6 million. THE KIT IS STILL UNFIXED and a reviewer may reasonably call that the
 * finding rather than this work-around; the build log says so and does not re-file the queue item the
 * neurulation run already filed. */
function triS(E, p1, p2, p3, n1, n2, n3) {
  const e1 = new T.Vector3().subVectors(p2, p1), e2 = new T.Vector3().subVectors(p3, p1);
  const fn = new T.Vector3().crossVectors(e1, e2);
  if (fn.lengthSq() < 1e-20) return;                       // degenerate: at a pole or a taper's point
  const avg = new T.Vector3().copy(n1).add(n2).add(n3);
  if (avg.lengthSq() < 1e-20) return;
  if (fn.dot(avg) >= 0) E.tri(p1, p2, p3, n1, n2, n3);
  else                  E.tri(p1, p3, p2, n1, n3, n2);
}
function quadS(E, a, b, c, d, na, nb, nc, nd) {
  triS(E, a, b, c, na, nb, nc);
  triS(E, a, c, d, na, nc, nd);
}

/* NORMALS ARE A FINITE DIFFERENCE OF THE SAME POINT FUNCTION THAT PRODUCED THE POSITIONS
   (RENDER-STANDARD 2.3), guarded against collapse — three's normalize() returns (0,0,0) for a zero
   vector without complaining, which would leave a silhouette shell undisplaced and coincident with
   the surface it is meant to hide behind. The fallback is the surface's own outward reference
   direction, and the result is forced to agree with it. */
function surfNormal(P, outRef, u, v, hu, hv) {
  const du = new T.Vector3().subVectors(P(u + hu, v), P(u - hu, v));
  const dv = new T.Vector3().subVectors(P(u, v + hv), P(u, v - hv));
  const n = new T.Vector3().crossVectors(du, dv);
  const ref = outRef(u, v);
  if (n.lengthSq() < 1e-18) return ref.clone().normalize();
  n.normalize();
  if (n.dot(ref) < 0) n.negate();
  return n;
}

/* ---- the one shell builder this model needs ----

   A closed solid bounded by an OUTER parametric surface and, optionally, an INNER one, over
   u in [u0,u1] and v in [v0,v1]. Open boundaries are closed: between the two surfaces when there is
   an inner one, and by a fan to the boundary ring's own centroid when there is not. hullCount is the
   OUTER surface alone (rule 2.4), so a silhouette inflates the skin and never the seams.

   uClosed/vClosed say which boundaries are seams rather than edges (a full revolution in v; a pole
   in u). A pole is NOT a boundary to be capped — the cell there collapses and triS drops it. */
function shellGeom(o) {
  const E = K.emitter();
  const nu = o.nu, nv = o.nv;
  const u0 = o.u0, u1 = o.u1, v0 = o.v0, v1 = o.v1;
  const hu = (u1 - u0) / nu * 0.35, hv = (v1 - v0) / nv * 0.35;
  const U = i => u0 + (u1 - u0) * i / nu;
  const V = j => v0 + (v1 - v0) * j / nv;

  function emitSurface(P, ref, sign) {
    const pt = [], nm = [];
    for (let i = 0; i <= nu; i++) {
      pt.push([]); nm.push([]);
      for (let j = 0; j <= nv; j++) {
        pt[i].push(P(U(i), V(j)));
        const n = surfNormal(P, ref, U(i), V(j), hu > 0 ? hu : 1e-4, hv > 0 ? hv : 1e-4);
        nm[i].push(sign < 0 ? n.negate() : n);
      }
    }
    for (let i = 0; i < nu; i++) for (let j = 0; j < nv; j++) {
      quadS(E, pt[i][j], pt[i + 1][j], pt[i + 1][j + 1], pt[i][j + 1],
               nm[i][j], nm[i + 1][j], nm[i + 1][j + 1], nm[i][j + 1]);
    }
    return { pt, nm };
  }
  /* the normal of the finite difference needs h in the SURFACE's own parameters, so it is passed as
     a closure over this patch's spacing rather than guessed per call */
  const refOut = o.outRef;
  const outS = emitSurface(o.Pout, refOut, +1);
  const hullCount = E.count();
  const inS = o.Pin ? emitSurface(o.Pin, refOut, -1) : null;

  /* ---- close the open boundaries ----

     THE CAP'S NORMAL IS ALONG THE PARAMETER, NOT ALONG THE SURFACE. The first version of this
     function handed each cap triangle the SURFACE normal at the boundary as its orientation hint,
     which is perpendicular to the direction a cap actually faces — so triS's dot product against it
     was near zero and the vertex order of every cap triangle was decided by rounding noise. It cost
     the vitelline duct its enclosed volume sign (-102,660 at day 28) while the winding check read
     1.000000, because the triangles agreed perfectly with the normals they had been given and the
     normals were the wrong ones. RENDER-STANDARD 2.4b, arriving in the one place in this file that
     reasoned about an orientation instead of measuring it: "a winding convention that has to be
     reasoned about at the call site will be got wrong at some call site."

     The fix is geometric. A cap at u = u0 faces -dP/du; at u = u1, +dP/du; at v = v0, -dP/dv; at
     v = v1, +dP/dv. All four are read off the SAME point function that produced the positions, which
     is rule 2.3 applied to a cap. */
  const axU0 = (v) => new T.Vector3().subVectors(o.Pout(u0, v), o.Pout(u0 + hu, v)).normalize();
  const axU1 = (v) => new T.Vector3().subVectors(o.Pout(u1, v), o.Pout(u1 - hu, v)).normalize();
  const axV0 = (u) => new T.Vector3().subVectors(o.Pout(u, v0), o.Pout(u, v0 + hv)).normalize();
  const axV1 = (u) => new T.Vector3().subVectors(o.Pout(u, v1), o.Pout(u, v1 - hv)).normalize();

  /* ---- closing the open boundaries, and the two faults that had to be measured out of it ----

     FAULT 1 · A FAN FROM A CENTROID FOLDS BACK ON A NON-CONVEX FACE. The meridional face of the
     vitelline duct is bounded by an hourglass profile, and a fan from its centroid produced triangles
     of BOTH orientations — whereupon triS "corrected" each one to the face's normal, which destroyed
     the cancellation that would have made the signed area right and left 32 unpaired edges and a cut
     face drawn partly outside its own outline. The enclosed volume did not notice, and could not: a
     face lying in the plane x = 0 contributes r.n = 0 to the divergence integral whichever way it
     faces. So the fan is gone. A meridional face of a surface of revolution is the region between the
     PROFILE and the AXIS, and it is tiled exactly by a strip of quads between the two — convex cell
     by cell, for any profile. The axis point at each station is the midpoint of the two
     diametrically-opposite profile points, which is exact here because every section window in this
     file is exactly pi wide: P(u, v0) and P(u, v1) are antipodal, so their midpoint is on the axis.
     That keeps the construction generic — shellGeom still knows nothing about an axis.

     FAULT 2 · THE HINT WAS DEGENERATE AT A POLE, AND THE TRIANGLES THERE WERE SILENTLY DROPPED. The
     v-face hint was recomputed per station as P(u,v0) - P(u,v0+h); at a pole every th gives the same
     point, so the hint was the zero vector, triS's own guard returned early, and each sectioned shell
     lost the two triangles at its pole — 6 unpaired edges per shell, in a hole about one cell wide.
     A planar face has ONE normal, so it now takes one hint, read at a station where it is defined. */
  const vMid = U(Math.max(1, Math.min(nu - 1, Math.round(nu / 2))));
  const vHint0 = axV0(vMid), vHint1 = axV1(vMid);

  function capStrip(getA, getB, n, hint) {
    for (let k = 0; k < n; k++) {
      const a = getA(k), b = getA(k + 1), c = getB(k + 1), d = getB(k);
      const nn = typeof hint === 'function' ? hint(k) : hint;
      triS(E, a, b, c, nn, nn, nn);
      triS(E, a, c, d, nn, nn, nn);
    }
  }
  /* an end cap: a full disc when the ring closes, a half disc fanned from the axis point when it
     does not — and the half-disc's centre must be that axis point and not the arc's centroid, or the
     fan leaves a second triangular hole between itself and the diameter */
  function capDisc(getOut, n, hint, closed) {
    let C;
    if (closed) {
      C = new T.Vector3();
      for (let k = 0; k < n; k++) C.add(getOut(k));
      C.multiplyScalar(1 / n);
    } else {
      C = new T.Vector3().addVectors(getOut(0), getOut(n)).multiplyScalar(0.5);
    }
    for (let k = 0; k < n; k++) {
      const a = getOut(k), b = getOut(k + 1), nn = hint(k);
      triS(E, a, b, C, nn, nn, nn);
    }
    return C;
  }
  const getO = (iu, jv) => outS.pt[iu][jv];
  const getI = inS ? ((iu, jv) => inS.pt[iu][jv]) : null;

  const closedRing = !!o.vClosed;
  let C_u0 = null, C_u1 = null;
  if (!o.uClosed0) {
    if (getI) capStrip(k => getO(0, k), k => getI(0, k), nv, k => axU0(V(k)));
    else C_u0 = capDisc(k => getO(0, k), nv, k => axU0(V(k)), closedRing);
  }
  if (!o.uClosed1) {
    if (getI) capStrip(k => getO(nu, k), k => getI(nu, k), nv, k => axU1(V(k)));
    else C_u1 = capDisc(k => getO(nu, k), nv, k => axU1(V(k)), closedRing);
  }
  if (!o.vClosed) {
    if (getI) {
      capStrip(k => getO(k, 0), k => getI(k, 0), nu, vHint0);
      capStrip(k => getO(k, nv), k => getI(k, nv), nu, vHint1);
    } else {
      /* the axis curve, as the midpoint of the two antipodal profiles — see FAULT 1 above */
      const axis = [];
      for (let k = 0; k <= nu; k++)
        axis.push(new T.Vector3().addVectors(getO(k, 0), getO(k, nv)).multiplyScalar(0.5));
      capStrip(k => getO(k, 0), k => axis[k], nu, vHint0);
      capStrip(k => getO(k, nv), k => axis[k], nu, vHint1);
    }
  }
  const g = E.geometry(hullCount);
  return E.count() ? g : null;
}

/* ---- an ellipsoid of revolution about y, centred on the y axis ----
   ph (= u) is measured from +y, so ph = 0 is the DORSAL pole and ph = pi the VENTRAL one.
   th (= v) sweeps from +z (cranial) towards +x (left), so a half-revolution th in [pi, 2pi] is the
   x <= 0 half — which is what a `lateral` camera, sitting at +x and looking towards -x, sees into.
   That is how every `_cut` variant in this file is made: by geometry, not by the player's clip
   plane, because measure-scene-visibility.mjs reimplements SHOW/HIDE/HIGHLIGHT/ROTATE/SET_STAGE and
   NOT CROSS_SECTION — so a section that lives in the clip plane is invisible to the one tool that
   measures the picture a student looks at. */
/* MUTABLE ON PURPOSE. Every volume this file reports is the volume of the TRIANGULATED surface
   rather than of the smooth one it approximates, and the cyst radius is SOLVED by bisection against
   an integral over this grid — so if moving the grid does not move the solved radius, the solve is
   not reading the geometry. setGrid() below is what the harness perturbs (RENDER-STANDARD, "AN
   ACCEPTANCE MEASUREMENT MUST BE A FUNCTION OF THE BUILT GEOMETRY": "the check is a PERTURBATION").  */
let PH_N = 26, TH_N = 44;        // the big shells
let PH_S = 16, TH_S = 22;        // small solids: cysts, islands, germ cells, the remnant

function ellip(cy, ax, ay, az) {
  return function (ph, th) {
    const s = Math.sin(ph);
    return new T.Vector3(ax * s * Math.sin(th), cy + ay * Math.cos(ph), az * s * Math.cos(th));
  };
}
/* the outward reference is the ellipsoid's own gradient, which is correct everywhere including at
   the poles where the finite difference collapses */
function ellipRef(ax, ay, az) {
  return function (ph, th) {
    const s = Math.sin(ph);
    return new T.Vector3(s * Math.sin(th) / (ax * ax), Math.cos(ph) / (ay * ay), s * Math.cos(th) / (az * az));
  };
}
/* WHICH SECTION, AND WHY THERE ARE TWO.
   'x' keeps x <= 0, so th runs pi to 2pi: a MEDIAN (sagittal) section, seen into by viz3d's
     `lateral` camera, which sits at +x and looks towards -x. Three beats use it.
   'z' keeps z <= 0, so th runs pi/2 to 3pi/2: a TRANSVERSE section, seen into by viz3d's `anterior`
     camera, which sits at +z — and in THIS model's axes +z is CRANIAL, so an anterior camera looks
     from the head end down the body, which is exactly how a transverse section is read.
   The transverse one exists because one beat's narration — carried over verbatim — says "Cut the
   folding embryo ACROSS and the geometry explains itself", and a median section is not across. The
   alternative was to keep the median picture and put the discrepancy in gaps[], which is
   RENDER-STANDARD's "a camera is not a fix" wearing a different hat: the words name a plane, so the
   model owes that plane. It costs one more th window on the shells and two surfaces of revolution. */
function thWindow(win) {
  if (win === 'x') return [Math.PI, 2 * Math.PI];
  if (win === 'z') return [Math.PI / 2, 3 * Math.PI / 2];
  return [0, 2 * Math.PI];
}
function ellipsoidShell(o) {
  const win = o.win || (o.cut ? 'x' : null);
  const cut = !!win;
  const [v0, v1] = thWindow(win);
  const ph0 = o.ph0 != null ? o.ph0 : 0, ph1 = o.ph1 != null ? o.ph1 : Math.PI;
  const full = Math.abs(ph1 - ph0 - Math.PI) < 1e-9;
  return shellGeom({
    Pout: ellip(o.cy, o.ax, o.ay, o.az),
    Pin: o.inner ? ellip(o.cy, o.inner.ax, o.inner.ay, o.inner.az) : null,
    outRef: ellipRef(o.ax, o.ay, o.az),
    nu: o.nu || PH_N, nv: o.nv || (cut ? Math.max(8, Math.round(TH_N / 2)) : TH_N),
    u0: ph0, u1: ph1, v0: v0, v1: v1,
    uClosed0: full || Math.abs(ph0) < 1e-9, uClosed1: full || Math.abs(ph1 - Math.PI) < 1e-9,
    vClosed: !cut,
  });
}

/* ---- a solid of revolution about the y axis, profile r(u) with u from y0 to y1 ----
   The vitelline duct IS one of these — an hourglass r(y) — so building it this way rather than with
   K.tubeCapped is not a reimplementation of the kit's tube: it is the right primitive for a shape
   whose axis is the model's own, and it is what lets the duct be sectioned in either plane by a th
   window, exactly like every shell in this file. A tube along a polyline cannot be. */
function revSolidY(o) {
  const [v0, v1] = thWindow(o.win);
  const yOf = u => o.y0 + (o.y1 - o.y0) * u;
  const P = (u, th) => {
    const r = o.prof(u);
    return new T.Vector3(r * Math.sin(th), yOf(u), r * Math.cos(th));
  };
  const ref = (u, th) => {
    /* THE OUTWARD NORMAL OF A SURFACE OF REVOLUTION: radial, tilted back by the profile's slope
       with respect to the AXIS COORDINATE — dr/dy, not dr/du. The first version divided by nothing
       and multiplied the radial part by (y1 - y0) instead, which is NEGATIVE here because the duct
       is built from its gut end DOWNWARD: every normal pointed inward, the duct's enclosed volume
       came back at -149,662, and the winding check still read 1.000000 because the triangles agreed
       perfectly with the normals they were given. RENDER-STANDARD 2.1 describing itself, found by
       the enclosed-volume sign and by nothing else. */
    const h = 1e-4, drdu = (o.prof(Math.min(1, u + h)) - o.prof(Math.max(0, u - h))) / (2 * h);
    const drdy = drdu / (o.y1 - o.y0);
    return new T.Vector3(Math.sin(th), -drdy, Math.cos(th));
  };
  return shellGeom({
    Pout: P, Pin: null, outRef: ref,
    nu: o.nu || 14, nv: o.win ? Math.max(8, Math.round(TH_N / 2)) : (o.nv || 24),
    u0: 0, u1: 1, v0: v0, v1: v1,
    uClosed0: false, uClosed1: false, vClosed: !o.win,
  });
}
/* ---- the same about the z axis (the model's cranio-caudal axis): the gut tube ----
   uMax < 1 truncates it, which is what a TRANSVERSE section of a tube running along z actually is —
   half its length removed and its cut face left as the flat disc the cap writes. */
function revSolidZ(o) {
  const win = o.win === 'x' ? 'x' : null;        // a z-section is a u-range here, not a th window
  const [v0, v1] = win ? [Math.PI, 2 * Math.PI] : [0, 2 * Math.PI];
  const uMax = o.uMax != null ? o.uMax : 1;
  const zOf = u => o.z0 + (o.z1 - o.z0) * u;
  const P = (u, th) => {
    const r = o.prof(u);
    return new T.Vector3(r * Math.sin(th), o.cy + r * Math.cos(th), zOf(u));
  };
  const ref = (u, th) => {
    /* same correction as revSolidY above: the slope is dr/dz, so the sign of (z1 - z0) cannot leak
       into the radial component */
    const h = 1e-4, drdu = (o.prof(Math.min(1, u + h)) - o.prof(Math.max(0, u - h))) / (2 * h);
    const drdz = drdu / (o.z1 - o.z0);
    return new T.Vector3(Math.sin(th), Math.cos(th), -drdz);
  };
  return shellGeom({
    Pout: P, Pin: null, outRef: ref,
    nu: o.nu || 18, nv: win ? Math.max(8, Math.round(TH_N / 2)) : (o.nv || 24),
    u0: 0, u1: uMax, v0: v0, v1: v1,
    uClosed0: false, uClosed1: false, vClosed: !win,
  });
}

/* =============================================================================================
 * 10 · SOLVE 2 · THE EXOCOELOMIC CYST BURDEN, BY VOLUME CONSERVATION ON THE BUILT GRID
 * =============================================================================================
 *
 * The narration: "a second wave of cells ... push in and pinch off a smaller cavity — the secondary,
 * or definitive, yolk sac — leaving scraps of the primary sac behind as exocoelomic cysts."
 *
 * Both sacs are DECLARED (section 5: the primary is the lined blastocyst cavity and is derived from
 * the conceptus's own radius; the secondary is the ultrasound curve). What is not declared is how
 * much cyst that leaves, so the cysts' common radius is SOLVED by bisection against the volumes of
 * the sacs THIS FILE ACTUALLY BUILDS — the divergence-theorem volume of the triangulated spheres,
 * not the 4/3 pi r^3 they approximate. That is RENDER-STANDARD's "AN ACCEPTANCE MEASUREMENT MUST BE
 * A FUNCTION OF THE BUILT GEOMETRY" applied to a SOLVE: move PH_N or TH_N and the solved radius
 * moves, and the harness perturbs the grid and requires exactly that.
 *
 * CYST_FRAC IS A CALIBRATION AND NOT A PREDICTION, AND ROW H SAYS SO. The primary sac loses 96% of
 * its volume at the pinch-off and almost all of that is simply resorbed; the share that persists as
 * cysts is a number no source this run could check, so it is DECLARED at 0.10 — chosen so that the
 * solved cyst diameter lands inside the 0.1 to 0.5 mm exocoelomic cysts are reported at. Calling the
 * resulting diameter a prediction would be exactly the fault RENDER-STANDARD describes as "a test
 * whose value is identical to a number you can compute by reading the source". What row H does
 * assert is the two things that are not circular: that the conservation integral CLOSES on the built
 * triangles to within a tenth of a per cent, and that the solved diameter is in range. */
const CYST_N = 7;                 // a declared count: enough to read as scraps, few enough to count
/* 0.045, AND IT WAS 0.10. Both land the solved cyst inside the 0.1-0.5 mm exocoelomic cysts are
   reported at, so the literature does not choose between them — the PICTURE did. At 0.10 the cysts
   come out 0.17 mm across beside a day-13 embryonic disc that is 0.20 mm across, and the day-13
   section beat reads as five orange balls with an embryo somewhere behind them: opened and looked
   at, which is check 4. At 0.045 they are 0.13 mm, still in range, and they read as the scraps the
   narration calls them. Declared, calibrated, and now calibrated against two things instead of one. */
const CYST_FRAC = 0.045;
const CYST_PINCH_DAY = 12.6;      // the day the second wave pinches off, from the narration's day 12-13

/* THE PRIMARY YOLK SAC IS THE OLD BLASTOCYST CAVITY, LINED — so its radius is not a measurement of
   its own: it is whatever is left inside the wall once the mesoderm and Heuser's membrane have taken
   their thickness. That is what makes the narration's "a space that was LINED" geometric. */
function rPrimary(day) {
  const rch = Rch(day);
  return rCoelOut(day) - gapAt(rch) - thHeuser(rch);
}
/* the volume of a closed triangulated surface, by the divergence theorem */
function geoVolume(geo) {
  if (!geo) return 0;
  const p = geo.attributes.position; let V = 0;
  for (let i = 0; i + 2 < p.count; i += 3) {
    const a = new T.Vector3(p.getX(i), p.getY(i), p.getZ(i));
    const b = new T.Vector3(p.getX(i + 1), p.getY(i + 1), p.getZ(i + 1));
    const c = new T.Vector3(p.getX(i + 2), p.getY(i + 2), p.getZ(i + 2));
    V += a.dot(new T.Vector3().crossVectors(b, c)) / 6;
  }
  return V;
}
function builtSphereVolume(r, nu, nv) {
  return Math.abs(geoVolume(ellipsoidShell({ cy: 0, ax: r, ay: r, az: r, nu: nu || PH_S, nv: nv || TH_S })));
}
const _cystCache = {};
let _cystSolve = null;
function cystSolve() { if (!_cystSolve) _cystSolve = solveCystRadius(); return _cystSolve; }
function solveCystRadius() {
  const V1 = builtSphereVolume(rPrimary(CYST_PINCH_DAY), PH_N, TH_N);
  const V2 = builtSphereVolume(Rys(13.2), PH_N, TH_N);
  const want = Math.max(0, (V1 - V2)) * CYST_FRAC;
  const per = want / CYST_N;
  /* bisection on the radius, against the BUILT volume of one cyst at the grid the cysts are drawn on */
  let lo = 1e-4, hi = rPrimary(CYST_PINCH_DAY), mid = 0, passes = 0;
  for (let i = 0; i < 64; i++) {
    mid = 0.5 * (lo + hi);
    if (builtSphereVolume(mid) < per) lo = mid; else hi = mid;
    passes++;
  }
  const got = builtSphereVolume(mid) * CYST_N;
  return { r: mid, V1: V1, V2: V2, want: want, got: got,
           residual: want > 0 ? (got - want) / want : 0, passes: passes,
           grid: { PH_N: PH_N, TH_N: TH_N, PH_S: PH_S, TH_S: TH_S } };
}
/* the cysts are resorbed in their turn: a declared decay, so they are scraps that fade rather than
   furniture that persists. Zero before the pinch-off. */
function cystRadius(day) {
  const k = day.toFixed(4);
  if (_cystCache[k] != null) return _cystCache[k];
  const live = rampDay(day, 12.4, 13.0) * (1 - 0.72 * rampDay(day, 16, 56));
  const v = cystSolve().r * Math.pow(Math.max(0, live), 1 / 3);
  _cystCache[k] = v;
  return v;
}

/* =============================================================================================
 * 11 · SOLVE 3 · WHERE THE CONCEPTUS SITS RELATIVE TO THE DISC
 * =============================================================================================
 * y = 0 is the DISC's mid-plane, because every claim this scene makes is about what is dorsal and
 * what is ventral TO THE DISC. The conceptus as a whole is therefore NOT centred on the origin: on
 * day 9 the disc lies just under the roof of a ball whose centre is most of a radius below it, which
 * is what the classic day-9 section shows and what makes "the amniotic cavity is a slit in the roof"
 * a position rather than a caption. As the amnion fills the sac the two centres converge.
 *
 * THE FIRST VERSION DECLARED THIS AS A FRACTION — cy = -0.62 * R * (1 - ramp) — AND IT BROKE THE
 * MODEL IN A WAY WORTH RECORDING, because every check passed and the frame was never looked at. The
 * amniotic cavity grows faster than the sac between days 13 and 21 (x1.93 against x1.52), so by day
 * 16 the amnion's dorsal pole was 32.8 units up and the sac's roof only 24.5: the amniotic cavity
 * stuck out THROUGH the chorion. What reported it was not a render but the coelom's own clearance
 * test returning negative and the part building nothing — the chorionic cavity vanished from days 16
 * and 21 and would have reached the player as reason:'none'. A declared placement cannot know what
 * it has to leave room for.
 *
 * So the placement is SOLVED against a stated constraint instead: THE AMNION MUST LIE WHOLLY INSIDE
 * THE CHORIONIC CAVITY, with a declared clearance. For an ellipsoid (aOut, bOut) centred at yAmn
 * inside a sphere of radius R centred at cy, that is three inequalities — one at each pole and one at
 * the equator — which bound cy to an interval, and the declared preference is then CLAMPED into it.
 * The preference still does the teaching (the disc near the roof early, concentric late); the
 * constraint stops the teaching from being impossible. When the interval is EMPTY the amnion can no
 * longer fit, which is the obliteration, and the coelom correctly builds nothing.
 *
 * The clearance is 0.4% of the sac's radius, which is not a tuned figure but a bound: at t = 1 the
 * whole coelom is 0.76% of the radius, so anything above half of that would close it a day early and
 * take the chorionic cavity out of the mount. Stated here because that is the kind of constant a
 * later run would otherwise "tidy". */
const CLR_FRAC = 0.004;

function concCentreY(day) {
  const rOut = rCoelOut(day) - gapAt(Rch(day));
  const A = amnAxes(day), yA = amnCentreY(day), thAm = thAmnion(Ram(day));
  const aOut = A.a + thAm, bOut = A.b + thAm;
  /* the dome's own extents: dorsal pole at yA + bOut, ventral boundary at yA + bOut*cos(phMax),
     widest at ph = pi/2 if the dome reaches that far */
  const yTop = yA + bOut, yBot = yA + bOut * Math.cos(A.phMax);
  const d = CLR_FRAC * rOut, R = rOut - d;
  /* the three constraints, as an interval for cy. lo is the disc as HIGH in the sac as it can go
     (the sac's centre as far below it as the amnion's roof allows); hi is as low as it can go. */
  let lo = yTop - R, hi = yBot + R;
  if (A.phMax >= Math.PI / 2 - 1e-9) {
    if (aOut < R) {
      const E = Math.sqrt(R * R - aOut * aOut);
      lo = Math.max(lo, yA - E); hi = Math.min(hi, yA + E);
    } else { lo = yA; hi = yA; }
  }
  if (lo > hi) return yA;                       // the amnion no longer fits: the coelom is gone
  /* THE PREFERENCE IS EXPRESSED AS A POSITION IN THAT INTERVAL, which is the whole reason this works
     where a fraction of the radius did not: the interval already knows how much room the amnion
     needs, so a preference inside it can never be impossible. 0 is as high as the disc can sit, 0.5
     is concentric with the amnion. DECLARED: high in the sac on day 9, because the embryo hangs from
     the chorion by its connecting stalk at the caudal pole, and converging on concentric by week 6.
     An earlier version made the preference -0.62 * R, which at day 16 demanded a position 6 units
     OUTSIDE the feasible interval; the clamp then pinned the amnion against the chorion and the
     clearance test — correctly — refused to build a coelom at all, at exactly the two days the
     chorionic cavity is at its most obvious. */
  const room = 0.18 + 0.32 * rampDay(day, 8, 44);
  return lo + room * (hi - lo);
}

/* =============================================================================================
 * 12 · THE PARTS
 * ============================================================================================= */

function addPart(g, key, geo, opts) {
  if (!geo) return null;
  /* A `_cut` OR `_cutz` VARIANT IS THE SAME TISSUE SEEN IN SECTION, so it takes the same colour and
     name: the suffix is a composition, not a structure. The first version stripped only /_cut$/, so
     every TRANSVERSE variant missed its palette entry and fell back to the neutral 0xcccccc — and
     the whole transverse beat rendered in white and grey, a yolk sac that is not yellow and a gut
     that is not ochre. Nothing measured it: the visibility walk counts pixels, not hues. It was
     found by opening the frame, which is check 4 and the only check in the list a file cannot run. */
  const base = key.replace(/_cutz?$/, '');
  const o = Object.assign({ color: (LAYERS[base] || {}).color || 0xcccccc, name: (LAYERS[base] || {}).name }, opts || {});
  /* the silhouette thickness has to scale with the subject: this model spans a 190-fold range of
     radius, and a fixed 0.030 is a heavy black line on a day-8 disc and invisible on a day-80 sac */
  if (o.outline == null) o.outline = Math.max(0.012, 0.0045 * (o.scaleHint || 50));
  return K.addSolid(g, key, geo, o);
}

function sphereSolid(cy, r, nu, nv, win, ph0, ph1) {
  if (!(r > 1e-6)) return null;
  return ellipsoidShell({ cy: cy, ax: r, ay: r, az: r, nu: nu, nv: nv, win: win, ph0: ph0, ph1: ph1 });
}
/* WHICH SECTION THIS BUILD IS, if any, and the key suffix that goes with it. A `_cut` key is the
   median section and a `_cutz` key the transverse one; a part with no suffix is the whole thing.
   The scene carries the cut variants as their own structures[] entries, because a structure has one
   ref and a beat that sections the conceptus and a beat that does not are two pictures of one part —
   the same reason implantation.js carries `epithelium` and `epithelium_cut` separately. */
function secWin(o) { return o && o.cutz ? 'z' : (o && o.cut ? 'x' : null); }
function SUF(win) { return win === 'z' ? '_cutz' : (win === 'x' ? '_cut' : ''); }

/* ---- the wall: chorion, extraembryonic mesoderm, and the coelom between mesoderm and amnion ---- */
function buildWall(g, st, o) {
  const cy = concCentreY(st.day), win = secWin(o), cut = !!win;
  const sh = st.rch;
  /* chorion: the trophoblast plus the mesoderm that lines it, as a shell OUTSIDE rch */
  addPart(g, cut ? 'chorion' + SUF(win) : 'chorion',
    ellipsoidShell({ cy: cy, ax: sh + st.thCh, ay: sh + st.thCh, az: sh + st.thCh,
                     inner: { ax: sh, ay: sh, az: sh }, win: win }),
    { scaleHint: sh, matOver: { opacity: cut ? 1 : 0.30, transparent: cut ? false : true }, outline: Math.max(0.02, 0.004 * sh) });
  /* extraembryonic mesoderm: fills the space before the coelom appears, lines the chorion after */
  if (st.thExm > 0.05)
    addPart(g, cut ? 'extraembryonic_mesoderm' + SUF(win) : 'extraembryonic_mesoderm',
      ellipsoidShell({ cy: cy, ax: sh, ay: sh, az: sh,
                       inner: { ax: st.rExmIn, ay: st.rExmIn, az: st.rExmIn }, win: win }),
      { scaleHint: sh, matOver: { opacity: cut ? 1 : 0.42, transparent: cut ? false : true } });

  /* THE CHORIONIC CAVITY — the extraembryonic coelom. A shell between the mesoderm's inner surface
     and the AMNION's outer surface, which are two surfaces about two different centres: the coelom is
     eccentric by construction, because the amnion sits up at the disc and the sac's centre does not.
     It is EMPTY before the mesoderm cavitates on day 12-13 and a sliver at the end — both of which
     are the anatomy, and section 1 says why the model stops at day 80 rather than at the solved
     obliteration day, where it would be empty. */
  const rOut = st.rExmIn - gapAt(sh);
  /* THE COELOM'S INNER BOUNDARY IS THE CLOSED ELLIPSOID THAT ENVELOPES THE AMNION, not the dome
     itself: a shell needs a closed inner surface, and while the amnion is a dome the region under
     its floor holds the disc and the yolk sac rather than coelom. The cost is that the coelom is
     understated by (1 - capFrac) of the amnion's envelope while the dome is open — at day 28 that is
     0.4%, and at the days rows E2 and F measure it is nil, because capFrac is 1 from day 30. It is
     declared in the scene's gaps[] rather than left for a reviewer to find. */
  const aOut = st.amnA + st.thAm, bOut = st.amnB + st.thAm;
  /* the clearance, sampled over the directions a ray from the sac's centre can take: if the amnion
     touches the mesoderm anywhere there is no shell to build */
  let minClear = Infinity;
  for (let i = 0; i <= 12; i++) {
    const ph = Math.PI * i / 12;
    const dy = Math.cos(ph), dr = Math.sin(ph);
    /* distance from the sac centre to the amnion's outer ellipsoid along this direction */
    const oy = cy - st.yAmn;
    const A2 = (dr * dr) / (aOut * aOut) + (dy * dy) / (bOut * bOut);
    const B2 = 2 * oy * dy / (bOut * bOut);
    const C2 = (oy * oy) / (bOut * bOut) - 1;
    const disc = B2 * B2 - 4 * A2 * C2;
    const s = disc > 0 ? (-B2 + Math.sqrt(disc)) / (2 * A2) : 0;
    minClear = Math.min(minClear, rOut - s);
  }
  /* THE COELOM EXISTS WHEN THE MESODERM CAVITATES AND NOT BEFORE. Gating it on the clearance alone
     was wrong in both directions: it built a chorionic cavity on day 9, where the space between the
     mesoderm and the amnion is occupied by the PRIMARY YOLK SAC and there is no coelom at all, and
     the narration is explicit that the cavity appears days 12 to 13. The clearance test stays, as the
     geometric guard it is, but cavitation is the anatomy. */
  if (st.coelLive > 0.03 && minClear > Math.max(0.12, 0.002 * sh) && st.thExm > 0.05) {
    addPart(g, cut ? 'chorionic_cavity' + SUF(win) : 'chorionic_cavity',
      shellGeom({
        Pout: ellip(cy, rOut, rOut, rOut),
        Pin: ellip(st.yAmn, aOut, bOut, aOut),
        outRef: ellipRef(rOut, rOut, rOut),
        nu: PH_N, nv: cut ? Math.round(TH_N / 2) : TH_N,
        u0: 0, u1: Math.PI, v0: thWindow(win)[0], v1: thWindow(win)[1],
        uClosed0: true, uClosed1: true, vClosed: !cut,
      }),
      { scaleHint: sh, matOver: { opacity: cut ? 0.80 : 0.22, transparent: true } });
  }
}

/* ---- the amnion and its cavity ---- */
function buildAmnion(g, st, o) {
  const win = secWin(o), cut = !!win;
  const aOut = st.amnA + st.thAm, bOut = st.amnB + st.thAm;
  const ph1 = st.amnPhMax;
  addPart(g, cut ? 'amnion' + SUF(win) : 'amnion',
    ellipsoidShell({ cy: st.yAmn, ax: aOut, ay: bOut, az: aOut,
                     inner: { ax: st.amnA, ay: st.amnB, az: st.amnA }, win: win, ph0: 0, ph1: ph1 }),
    { scaleHint: st.amnA, matOver: { opacity: cut ? 1 : 0.55, transparent: cut ? false : true } });
  const gi = gapAt(st.amnA);
  const ia = st.amnA - gi, ib = Math.max(0.12 * st.amnB, st.amnB - gi);
  addPart(g, cut ? 'amniotic_cavity' + SUF(win) : 'amniotic_cavity',
    ellipsoidShell({ cy: st.yAmn, ax: ia, ay: ib, az: ia, win: win, ph0: 0, ph1: ph1 }),
    { scaleHint: st.amnA, matOver: { opacity: 0.30, transparent: true } });
}

/* ---- the disc: two epithelia and nothing between them ----
   THE DISC IS ITS TWO LAYERS AND THIS MODEL DRAWS NO THIRD. A bilaminar disc has epiblast and
   hypoblast and nothing else, so there is no core solid here — an earlier draft had one and it would
   have drawn a third layer inside the two in every section beat, which is the one thing this topic's
   neighbour scene (trilaminar-disc-3-germ-layers) exists to teach and this one must not pre-empt.
   After folding the same two shells are the body's dorsal and ventral walls; the body's own bulk —
   mesoderm, somites, neural tube — belongs to the gastrulation and folding items and is declared in
   the scene's gaps[] as not drawn. The two shells overlap by PAD radians at the equator so neither
   annular cap is ever exposed (RENDER-STANDARD section 3: "overlap adjacent parts very slightly"). */
const EQ_PAD = 0.045;
function buildDisc(g, st, o) {
  const win = secWin(o), cut = !!win;
  const ax = st.axDisc, ay = st.hy, az = st.rdisc;
  const te = st.thEpi, th = st.thHypo;
  addPart(g, cut ? 'epiblast' + SUF(win) : 'epiblast',
    ellipsoidShell({ cy: 0, ax: ax, ay: ay, az: az,
                     inner: { ax: Math.max(0.12 * ax, ax - te), ay: Math.max(0.12 * ay, ay - te), az: Math.max(0.12 * az, az - te) },
                     ph0: 0, ph1: Math.PI / 2 + EQ_PAD, win: win, nu: Math.round(PH_N / 2) }),
    { scaleHint: az });
  addPart(g, cut ? 'hypoblast' + SUF(win) : 'hypoblast',
    ellipsoidShell({ cy: 0, ax: ax, ay: ay, az: az,
                     inner: { ax: Math.max(0.12 * ax, ax - th), ay: Math.max(0.12 * ay, ay - th), az: Math.max(0.12 * az, az - th) },
                     ph0: Math.PI / 2 - EQ_PAD, ph1: Math.PI, win: win, nu: Math.round(PH_N / 2) }),
    { scaleHint: az });
}

/* ---- the primary yolk sac and Heuser's membrane ----
   TRUNCATED AT THE DISC'S VENTRAL SURFACE, which is the whole point: the primary yolk sac is the old
   blastocyst cavity LINED, and its roof is the hypoblast. A full sphere would wrap over the disc and
   draw the amniotic cavity inside the yolk sac. ph is measured from +y, so the truncation is a
   lower bound on ph solved from the plane y = -hy. */
function buildPrimary(g, st, o, late) {
  /* THE COMPARISON VARIANT IS STAGE-LIMITED TOO, and that is not bookkeeping. primary_yolk_sac_late
     is drawn at a FIXED day (CYST_CMP_DAY) because beat 3 needs the primary sac at the instant
     BEFORE the pinch-off beside the secondary sac at the instant after — two t of one part, which
     check-beat-claims.mjs's own note says needs two keys. But if it were built at every t it would
     sit inside a day-80 chorionic sac in every later frame and in every partition pair, so it exists
     only in the window its pin is inside. */
  const live = late ? (st.day >= 11 && st.day <= 15 ? 1 : 0) : st.primLive;
  if (live < 0.02) return;
  const win = secWin(o), cut = !!win;
  const day = late ? CYST_CMP_DAY : st.day;
  const cy = concCentreY(day);
  const rp = rPrimary(day), thH = thHeuser(Rch(day));
  const hy = discFlat(day) * Rdisc(day);
  const rIn = rp - gapAt(rp);
  const cosPh = Math.max(-0.995, Math.min(0.995, (-hy - cy) / rIn));
  const ph0 = Math.acos(cosPh);
  const kM = late ? 'primary_yolk_sac_late' : 'exocoelomic_membrane';
  const kS = late ? 'primary_yolk_sac_late' : 'primary_yolk_sac';
  if (!late)
    addPart(g, cut ? kM + SUF(win) : kM,
      ellipsoidShell({ cy: cy, ax: rp + thH, ay: rp + thH, az: rp + thH,
                       inner: { ax: rp, ay: rp, az: rp }, ph0: Math.acos(Math.max(-0.995, Math.min(0.995, (-hy - cy) / (rp + thH)))), ph1: Math.PI, win: win }),
      { scaleHint: rp, matOver: { opacity: cut ? 1 : 0.6, transparent: cut ? false : true } });
  addPart(g, cut ? kS + SUF(win) : kS,
    sphereSolid(cy, rIn, PH_N, cut ? Math.round(TH_N / 2) : TH_N, win, ph0, Math.PI),
    { scaleHint: rp, matOver: { opacity: 0.42, transparent: true } });
}
/* the day the LATE primary sac variant is drawn at — the instant before the pinch-off, which is the
   only state in which the two sacs can be compared. The scene pins that key at tOfDay of this day. */
const CYST_CMP_DAY = 12.5;

/* ---- the secondary yolk sac, its remnant, the islands and the germ cells ---- */
function buildSecondary(g, st, o) {
  if (st.ysLive < 0.02) return;
  const win = secWin(o), cut = !!win;
  const nearSide = c => onNearSide(c, win);
  addPart(g, cut ? 'secondary_yolk_sac' + SUF(win) : 'secondary_yolk_sac',
    sphereSolid(st.yYS, st.rys, PH_N, cut ? Math.round(TH_N / 2) : TH_N, win),
    { scaleHint: st.rys, matOver: { opacity: cut ? 0.75 : 0.5, transparent: true } });

  if (o.islands !== false && st.islandsLive > 0.03) {
    /* blood islands on the yolk sac's own surface: declared positions on a spiral, so they read as
       scattered patches rather than a pattern, and the same every run */
    /* MIRRORED PAIRS, NOT A FIBONACCI SPIRAL. Row P measures that every key this model builds is
       mirror-symmetric in x, because that measurement is the only honest basis for the axis
       declaration (RENDER-STANDARD: "A SYMMETRIC MODEL CANNOT PROVE ITS OWN" handedness). A spiral
       placement broke it on three keys at once — 599 of 4,252 sampled vertices with no partner —
       and a model that is ALMOST symmetric can witness nothing: the row would have had to be
       softened to a tolerance, which is the thing the standard calls quietly lowering a threshold.
       So the scattered solids are placed as mirrored pairs by construction. */
    const r = 0.17 * st.rys * st.islandsLive;
    for (let i = 0; i < 14; i++) {
      const pair = i >> 1, sgn = (i & 1) ? 1 : -1;
      const ph = Math.acos(1 - 2 * (pair + 0.5) / 7);
      const th = sgn * (0.42 + 0.78 * pair);
      const c = new T.Vector3(Math.sin(ph) * Math.sin(th), Math.cos(ph), Math.sin(ph) * Math.cos(th))
        .multiplyScalar(st.rys * 0.985);
      if (nearSide(c)) continue;
      addPart(g, 'blood_islands', sphereSolid(0, r, PH_S, TH_S)
        && (function () { const gg = sphereSolid(0, r, PH_S, TH_S);
             const p = gg.attributes.position;
             for (let k = 0; k < p.count; k++) p.setXYZ(k, p.getX(k) + c.x, p.getY(k) + c.y + st.yYS, p.getZ(k) + c.z);
             return gg; })(),
        { scaleHint: r });
    }
  }
  if (o.germ !== false && st.germLive > 0.03) {
    /* primordial germ cells: a cluster in the yolk sac wall NEAR THE ORIGIN OF THE ALLANTOIS, which
       is the examinable location, plus a short file of them along the route they take. Declared
       positions; the route is a straight run to the dorsal body wall and is a schematic, said so in
       the scene's gaps[]. */
    const r = 0.085 * st.rys * st.germLive;
    const base = new T.Vector3(0, st.yYS + st.rys * 0.80, -st.rys * 0.60);
    for (let i = 0; i < 6; i++) {
      const a = (i / 5 - 0.5) * 1.5;
      /* z offset read off |a| so that i and 5 - i are an exact mirrored pair — see row P */
      const c = base.clone().add(new T.Vector3(a * r * 3.0, -r * 0.4 * Math.abs(a),
                                               r * 2.2 * (Math.abs(a) > 0.5 ? 1 : -1)));
      if (nearSide(c)) continue;
      const gg = sphereSolid(0, r, PH_S, TH_S); const p = gg.attributes.position;
      for (let k = 0; k < p.count; k++) p.setXYZ(k, p.getX(k) + c.x, p.getY(k) + c.y, p.getZ(k) + c.z);
      addPart(g, 'germ_cells', gg, { scaleHint: r });
    }
    for (let i = 0; i < 5; i++) {
      const u = i / 4;
      const c = new T.Vector3(0, base.y + (st.hy * 0.9 - base.y) * u, base.z + (-st.rdisc * 0.55 - base.z) * u);
      const gg = sphereSolid(0, r * 0.9, PH_S, TH_S); const p = gg.attributes.position;
      for (let k = 0; k < p.count; k++) p.setXYZ(k, p.getX(k) + c.x, p.getY(k) + c.y, p.getZ(k) + c.z);
      addPart(g, 'germ_cells', gg, { scaleHint: r });
    }
  }
  if (o.remnant !== false && st.remnantLive > 0.03) {
    /* THE YOLK SAC REMNANT: "a small pale nodule near the base of the cord". Placed at the CHORIONIC
       end of the connecting stalk, between amnion and chorion, which is where it is found. */
    /* THE REMNANT IS THE YOLK SAC ITSELF, SHRIVELLED — the paragraph says so — so it is a little
       over half the sac's own radius and not a tenth of it. At 0.09 it came out 0.32 mm across at
       day 70 against a published 3 to 5 mm, and the beat built on it measured 0.024% of its frame:
       a yellow pixel. The size was wrong first and the picture only reported it. */
    const r = Math.max(0.6, 0.55 * st.rys) * st.remnantLive;
    const c = st.stalkFrom.clone().addScaledVector(st.stalkDir, st.stalkLen * 0.86)
      .add(new T.Vector3(0, -(st.rSheath + Math.max(0.6, 0.55 * st.rys) * st.remnantLive) * 1.05, 0));
    const gg = sphereSolid(0, r, PH_S, TH_S); const p = gg.attributes.position;
    for (let k = 0; k < p.count; k++) p.setXYZ(k, p.getX(k) + c.x, p.getY(k) + c.y, p.getZ(k) + c.z);
    addPart(g, 'yolk_sac_remnant', gg, { scaleHint: r });
  }
}

/* A SMALL SOLID THAT IS NOT CUT MUST STILL RESPECT THE SECTION. A section removes the half of the
   model between the camera and the cut plane; a scattered sphere left whole on that side is drawn in
   front of the very window the section exists to open. Measured: the cysts, once they were spread
   round the coelom instead of clumped to one side, put the day-13 section's disc and amniotic cavity
   from 0.148% of the frame to 0.004% — the embryo behind a row of beads. So a scattered solid whose
   centre is on the near side of the cut plane is not drawn in that cut at all, which is what a
   section does to it. (Cutting each sphere individually would be the other answer and buys nothing:
   a half cyst at the cut plane is a detail nobody is examined on.) */
function onNearSide(c, win) {
  if (win === 'x') return c.x > 0;
  if (win === 'z') return c.z > 0;
  return false;
}

/* ---- the exocoelomic cysts ---- */
function buildCysts(g, st, o) {
  if (st.cystLive < 0.02 || !(st.cystR > 1e-4)) return;
  const win = secWin(o);
  const cy = concCentreY(st.day);
  const shellR = (st.rExmIn - gapAt(st.rch)) * 0.70;
  for (let i = 0; i < st.cystN; i++) {
    /* DECLARED PLACEMENT, AND MIRRORED. One cyst in the median plane and three mirrored pairs, tipped
       in ph so they do not all share a latitude. Row P is why they are not simply spread round a
       ring: see the note in buildSecondary. */
    /* CRANIAL SIDE, NOT CAUDAL. th = 0 is +z, which is CRANIAL in this model's axes. The first
       version centred the ring on th = pi, which is CAUDAL — exactly where the connecting stalk runs
       out to the chorion — and row K found a cyst inside the stalk at day 56. The cysts are scraps
       floating in the coelom and nothing says which side; the stalk's side is the one side they
       cannot be on. */
    const pair = (i + 1) >> 1, sgn = (i === 0) ? 0 : ((i & 1) ? 1 : -1);
    /* spread from cranial round towards the flanks, in mirrored pairs, and stopping short of the
       caudal sector where the connecting stalk runs — scraps, not a bunch of grapes */
    const th = sgn * (0.70 + 0.85 * (pair > 1 ? pair - 1 : 0));
    /* VENTRAL, BELOW THE EMBRYO. ph is measured from +y at the CONCEPTUS's centre, and the disc sits
       near the top of the sac, so a cyst at the equator projects straight over it — in the first
       frame that was looked at, one cyst covered the day-13 embryo almost entirely and the walk
       reported the disc at 0.004% of its own beat. The scraps belong where the primary sac was,
       which is ventral to the disc, and that is also where they are out of the way. */
    const ph = 2.25 + 0.40 * Math.sin(pair * 2.3);
    const c = new T.Vector3(Math.sin(ph) * Math.sin(th), Math.cos(ph), Math.sin(ph) * Math.cos(th))
      .multiplyScalar(shellR).add(new T.Vector3(0, cy, 0));
    if (onNearSide(c, win)) continue;
    const gg = sphereSolid(0, st.cystR, PH_S, TH_S); if (!gg) continue;
    const p = gg.attributes.position;
    for (let k = 0; k < p.count; k++) p.setXYZ(k, p.getX(k) + c.x, p.getY(k) + c.y, p.getZ(k) + c.z);
    addPart(g, 'exocoelomic_cysts', gg, { scaleHint: st.cystR });
  }
}

/* ---- the stalk, the sheath, the allantois, the gut and the duct ---- */
function polyline(from, dir, len, n) {
  const pts = [];
  for (let i = 0; i <= n; i++) pts.push(from.clone().addScaledVector(dir, len * i / n));
  return pts;
}
function buildStalkAndCord(g, st, o) {
  if (st.stalkLive > 0.03) {
    const pts = polyline(st.stalkFrom, st.stalkDir, st.stalkLen, 14);
    addPart(g, 'connecting_stalk',
      K.tubeCapped(pts, u => st.rStalk * (0.85 + 0.35 * u * u) * st.stalkLive, { ring: 20, cap: 'start' }),
      { scaleHint: st.rStalk });
  }
  if (st.allLive > 0.03) {
    const from = new T.Vector3(0, st.yGut - st.rgut * 0.1, -st.gutHalf * 0.92);
    const dir = st.stalkDir.clone();
    const pts = polyline(from, dir, st.allLen, 12);
    addPart(g, 'allantois',
      K.tubeCapped(pts, u => st.rAll * (1 - 0.45 * u) * st.allLive, { ring: 16, cap: 'both' }),
      { scaleHint: st.rAll });
  }
  if (st.sheathLive > 0.03) {
    /* THE CORD IS A SLEEVE OF AMNION AROUND WHAT IS ALREADY THERE. Translucent, so the three things
       inside it stay visible — which is what beat 8 is for — and grown in LENGTH rather than in
       calibre, for the reason recorded at rSheath above. */
    const from = st.stalkFrom.clone().addScaledVector(st.stalkDir, -st.rSheath * 0.25);
    const len = st.stalkLen * (0.18 + 0.86 * st.sheathLive);
    const pts = polyline(from, st.stalkDir, len, 14);
    addPart(g, 'cord_sheath',
      K.tubeCapped(pts, u => st.rSheath * (0.94 + 0.20 * u), { ring: 22, cap: false }),
      { scaleHint: st.rSheath, matOver: { opacity: 0.34, transparent: true } });
  }
}
function buildGut(g, st, o) {
  if (st.gut < 0.03) return;
  /* foregut and hindgut are narrower than the midgut, which is where the duct leaves — the segment
     boundaries are at the two flexures, which is where the tube is narrowest (RENDER-STANDARD
     section 3: "segment boundaries belong at the real landmarks") */
  const prof = u => st.rgut * (0.72 + 0.46 * Math.sin(Math.PI * u)) * st.gut;
  const suffix = o.cutz ? '_cutz' : (o.cut ? '_cut' : '');
  addPart(g, 'primitive_gut' + suffix,
    revSolidZ({ prof: prof, z0: -st.gutHalf, z1: st.gutHalf, cy: st.yGut,
                win: o.cut ? 'x' : null, uMax: o.cutz ? 0.5 : 1 }),
    { scaleHint: st.rgut });
}
function buildVitelline(g, st, o, closing) {
  /* the same argument as primary_yolk_sac_late above: the closing duct is drawn at a fixed day
     inside the narrated weeks six to ten, and exists only in a window around it */
  if (closing && !(st.day >= 26 && st.day <= 60)) return;
  const s = closing ? stateAt(tOfDay(VD_CMP_DAY)) : st;
  const r = s.rVd;
  if (!(r > 1e-4)) return;
  const topY = s.yGut - s.rgut * 0.55;
  const botY = s.yYS + s.rys * 0.92;
  if (botY >= topY - 1e-6) return;
  /* THE HOURGLASS: the duct is widest where it leaves the gut and where it enters the sac, and
     narrowest in the middle — which is the waist beat 7 is about. Row J measures it. */
  const win = o.cutz ? 'z' : (o.cut ? 'x' : null);
  const suffix = o.cutz ? '_cutz' : (o.cut ? '_cut' : '');
  addPart(g, (closing ? 'vitelline_duct_closing' : 'vitelline_duct') + suffix,
    revSolidY({ prof: u => r * (1 + 1.25 * Math.pow(2 * u - 1, 2)), y0: topY, y1: botY, win: win }),
    { scaleHint: r });
}
/* THE DAY THE CLOSING DUCT VARIANT IS DRAWN AT. Day 56 — week 8, the middle of the narrated weeks
   six to ten — and not day 42, which is where the first version put it. At day 42 the closure ramp
   has not started, and the duct's ABSOLUTE radius is still growing with the gut it leaves: measured,
   the day-42 waist is 39.7 units against the day-28 waist's 11.3, so the one row that asserts the
   narration's "narrows" was failing by a factor of 3.5 while the law was behaving exactly as
   written. The lesson is the row's, not the law's: a duct that narrows RELATIVE TO THE GUT can widen
   in absolute units while the embryo triples in size, so row J2 compares the waist as a FRACTION of
   the gut's own built radius at the two days. That is also what a student sees. */
const VD_CMP_DAY = 56;

/* =============================================================================================
 * 12a · THE PRESENTATION SCALE, AND THE DEFECT THAT MADE IT NECESSARY
 * =============================================================================================
 *
 * FOUND BY measure-scene-visibility.mjs, WHICH IS THE ONLY CHECK IN THIS CORPUS THAT COULD HAVE
 * FOUND IT. Six of this scene's ten beats came back reporting "subject covers 0% of frame" with
 * every structure at 0% ink — nothing drawn at all, from t = 0.48 onward. Every other check passed:
 * the geometry was watertight, the winding was 1.000000, the whole acceptance battery was green and
 * all 48 beat claims held, because not one of them asks whether a camera can SEE the model.
 *
 * The cause is a fixed far plane. viz3d.js builds its camera once —
 *     var camera = new T.PerspectiveCamera(45, 1, 0.01, 4000)
 * — and never touches near or far again; the visibility tool's copy uses 500. This model is in units
 * of 10 um at TRUE SCALE over ten weeks, so its chorionic sac goes from 0.33 mm across on day 8 to
 * 64 mm on day 80: 5,697 world units at the last beat, which puts the framing camera about 7,200
 * units out and the whole model behind the far plane. The corpus convention of 10 um per unit was set
 * by models that span one week — implantation.js runs 10 to 50 units — and it simply does not
 * survive a 190-fold range.
 *
 * THE FIX IS A SCALE ON THE GROUP, NOT ON THE GEOMETRY, and the distinction is what keeps it honest:
 *
 *   - The VERTICES stay in true units of 10 um. Every solve, every acceptance row, every
 *     claimMeasure and the whole inheritance from implantation.js read geometry attributes directly
 *     and are therefore unchanged by this — keyStats() does not apply matrixWorld, deliberately.
 *   - The GROUP carries group.scale, so viz3d's mergeByKey (which DOES apply matrixWorld) hands the
 *     player geometry about 120 world units across at every t, and K.fitCamera frames the scaled box.
 *
 * IS IT A SCALE BREAK? No, and the test is whether anything inside one picture is misreported. One
 * uniform scale on the whole group changes no proportion, no ratio and no relation between two parts
 * in the same frame; what it changes is how many world units a millimetre is, and that already
 * changes from beat to beat in every model in this corpus the moment fitCamera moves the camera. What
 * it is NOT allowed to do is let a measurement be quoted in world units, and none is: every absolute
 * figure this file reports is in um or mm, computed from the unscaled vertices. It is declared in
 * the scene's gaps[] and row T asserts the drawn extent stays inside the player's frustum at every t.
 *
 * Reported to the review task as a candidate RENDER-STANDARD rule, because this cannot be the only
 * model it bites: a procedural model's drawn extent is part of its contract with the player, and
 * nothing in the standard says so today. */
const SCENE_SPAN = 120;
function sceneScale(day) {
  const r = Rch(day);
  return SCENE_SPAN / (2 * (r + thChorion(r)));
}

/* =============================================================================================
 * 13 · build()
 * ============================================================================================= */
const FULL_SET = {
  wall: true, amnion: true, disc: true, primary: true, secondary: true, cysts: true,
  stalk: true, gut: true, duct: true, islands: true, germ: true, remnant: true,
  late_primary: true, duct_closing: true, cut: false, cutz: false,
};

function build(t, opts) {
  const o = Object.assign({}, FULL_SET, opts || {});
  const st = stateAt(typeof t === 'number' && isFinite(t) ? t : 1);
  const g = new T.Group();
  if (o.wall !== false)      buildWall(g, st, o);
  if (o.amnion !== false)    buildAmnion(g, st, o);
  if (o.disc !== false)      buildDisc(g, st, o);
  if (o.primary !== false)   buildPrimary(g, st, o, false);
  if (o.late_primary !== false) buildPrimary(g, st, o, true);
  if (o.secondary !== false) buildSecondary(g, st, o);
  if (o.cysts !== false)     buildCysts(g, st, o);
  if (o.stalk !== false)     buildStalkAndCord(g, st, o);
  if (o.gut !== false)       buildGut(g, st, o);
  if (o.duct !== false)      buildVitelline(g, st, o, false);
  if (o.duct_closing !== false) buildVitelline(g, st, o, true);
  /* see section 12a: true-scale vertices, a scaled GROUP */
  g.scale.setScalar(sceneScale(st.day));
  assertLight(st, g, o);
  g.userData.state = {
    t: st.t, day: st.day, rch: st.rch, ram: st.ram, f: st.f, rys: st.rys,
    coelDorsal: st.coelDorsal, cystR: st.cystR, rVd: st.rVd, yYS: st.yYS,
    sceneScale: sceneScale(st.day), drawnSpan: SCENE_SPAN,
    D_OBL: D_OBL, AMN_P: AMN_P, fitRms: AMN_FIT.rms,
  };
  return g;
}

/* =============================================================================================
 * 14 · MEASUREMENT OFF THE BUILT TRIANGLES
 * =============================================================================================
 * RENDER-STANDARD: "the measured side of every acceptance assertion must be read from the geometry
 * the model builds ... and never from the constants the geometry was built from." Every row below
 * that says "built" goes through here, and the three rows whose measured side is a SOLVE OUTPUT
 * rather than geometry say so in their own text (F2, H-residual) instead of pretending otherwise. */
function keyGeos(g) {
  const out = {};
  g.traverse(o => {
    if (!o.isMesh || !o.geometry || (o.userData && o.userData.outline)) return;
    const k = o.userData && o.userData.key; if (!k) return;
    (out[k] = out[k] || []).push(o.geometry);
  });
  return out;
}
function hullTris(geo) {
  const p = geo.attributes.position;
  const n = geo.userData.hullCount != null ? geo.userData.hullCount : p.count;
  const out = [];
  for (let i = 0; i + 2 < n; i += 3)
    out.push([new T.Vector3(p.getX(i), p.getY(i), p.getZ(i)),
              new T.Vector3(p.getX(i + 1), p.getY(i + 1), p.getZ(i + 1)),
              new T.Vector3(p.getX(i + 2), p.getY(i + 2), p.getZ(i + 2))]);
  return out;
}
function allTris(geo) {
  const p = geo.attributes.position, out = [];
  for (let i = 0; i + 2 < p.count; i += 3)
    out.push([new T.Vector3(p.getX(i), p.getY(i), p.getZ(i)),
              new T.Vector3(p.getX(i + 1), p.getY(i + 1), p.getZ(i + 1)),
              new T.Vector3(p.getX(i + 2), p.getY(i + 2), p.getZ(i + 2))]);
  return out;
}
function triVol(a, b, c) { return a.dot(new T.Vector3().crossVectors(b, c)) / 6; }

function keyStats(g) {
  const geos = keyGeos(g), out = {};
  for (const k in geos) {
    const bb = new T.Box3();
    let verts = 0, agree = 0, tot = 0, cvol = 0, hvol = 0, boxSum = 0;
    let allT = [], hullT = [];
    const cen = new T.Vector3(); let cenN = 0;
    for (const geo of geos[k]) {
      const p = geo.attributes.position, nm = geo.attributes.normal;
      verts += p.count;
      for (let i = 0; i < p.count; i++) {
        const v = new T.Vector3(p.getX(i), p.getY(i), p.getZ(i));
        bb.expandByPoint(v); cen.add(v); cenN++;
      }
      /* RENDER-STANDARD 2.1's own invariant: a triangle's FACE normal, from its vertex ORDER, must
         agree with the vertex normals supplied with it. Shape-independent, so it is valid on a shell
         whose inner surface points inward — which a centroid count is not. */
      for (let i = 0; i + 2 < p.count; i += 3) {
        const A = new T.Vector3(p.getX(i), p.getY(i), p.getZ(i));
        const B = new T.Vector3(p.getX(i + 1), p.getY(i + 1), p.getZ(i + 1));
        const Cc = new T.Vector3(p.getX(i + 2), p.getY(i + 2), p.getZ(i + 2));
        const fn = new T.Vector3().subVectors(B, A).cross(new T.Vector3().subVectors(Cc, A));
        if (fn.lengthSq() < 1e-20) continue;
        const vn = new T.Vector3(nm.getX(i), nm.getY(i), nm.getZ(i))
          .add(new T.Vector3(nm.getX(i + 1), nm.getY(i + 1), nm.getZ(i + 1)))
          .add(new T.Vector3(nm.getX(i + 2), nm.getY(i + 2), nm.getZ(i + 2)));
        tot++; if (fn.dot(vn) > 0) agree++;
      }
      const at = allTris(geo); allT = allT.concat(at);
      for (const q of at) cvol += triVol(q[0], q[1], q[2]);
      const ht = hullTris(geo); hullT = hullT.concat(ht);
      for (const q of ht) hvol += triVol(q[0], q[1], q[2]);
      const gb = new T.Box3(); const gp = geo.attributes.position;
      for (let i = 0; i < gp.count; i++) gb.expandByPoint(new T.Vector3(gp.getX(i), gp.getY(i), gp.getZ(i)));
      const gs = gb.getSize(new T.Vector3());
      boxSum += Math.max(1e-9, gs.x * gs.y * gs.z);
    }
    out[k] = {
      verts, bb, closedVol: cvol, hullVol: hvol, boxSum,
      centroid: cenN ? cen.multiplyScalar(1 / cenN) : new T.Vector3(),
      windAgree: tot ? agree / tot : 1, windTot: tot, allT, hullT,
      size: bb.getSize(new T.Vector3()),
    };
  }
  return out;
}
/* the radius of a sphere with the same volume as this key's closed surface — the only fair way to
   compare two solids in a model whose radii span 190-fold */
function eqRadius(s) {
  if (!s) return 0;
  const V = Math.abs(s.closedVol);
  return Math.pow(3 * V / (4 * Math.PI), 1 / 3);
}
function eqRadiusHull(s) {
  if (!s) return 0;
  return Math.pow(3 * Math.abs(s.hullVol) / (4 * Math.PI), 1 / 3);
}
/* the share of A's vertices lying inside B, by parity of ray crossings — 3.z's measure */
function insideFrac(A, B) {
  if (!A || !B) return 0;
  if (!A.bb.intersectsBox(B.bb)) return 0;
  const dir = new T.Vector3(0.5773, 0.5774, 0.5773);
  const verts = [];
  for (const q of A.allT) verts.push(q[0]);
  const step = Math.max(1, Math.floor(verts.length / 420));
  let n = 0, inside = 0;
  for (let i = 0; i < verts.length; i += step) {
    const o = verts[i]; n++;
    let hits = 0;
    for (const q of B.allT) {
      const e1 = new T.Vector3().subVectors(q[1], q[0]), e2 = new T.Vector3().subVectors(q[2], q[0]);
      const pv = new T.Vector3().crossVectors(dir, e2), det = e1.dot(pv);
      if (Math.abs(det) < 1e-12) continue;
      const tv = new T.Vector3().subVectors(o, q[0]);
      const u = tv.dot(pv) / det; if (u < 0 || u > 1) continue;
      const qv = new T.Vector3().crossVectors(tv, e1);
      const vv = dir.dot(qv) / det; if (vv < 0 || u + vv > 1) continue;
      const tt = e2.dot(qv) / det; if (tt > 1e-7) hits++;
    }
    if (hits % 2 === 1) inside++;
  }
  return n ? inside / n : 0;
}

/* =============================================================================================
 * 15 · THE PUBLISHED PARTITION — RENDER-STANDARD 3.z
 * =============================================================================================
 * This model builds up to twenty closed solids and the standard requires it to assert that no two of
 * them share space, with the contacts that are CONSTRUCTION rather than anatomy excluded BY NAME and
 * never by a tolerance.
 *
 *   ENVELOPES — a part that is MEANT to contain everything inside it, drawn translucent in every beat
 *   that shows its contents. 3.z names this case explicitly as excluded:
 *     amniotic_cavity, chorionic_cavity, amnion, chorion, extraembryonic_mesoderm,
 *     primary_yolk_sac, exocoelomic_membrane, primary_yolk_sac_late, cord_sheath
 *
 *   CONTAINED BY CONSTRUCTION — one solid is drawn inside another because it IS a space, a column or
 *   a scrap within it:
 *     primitive_gut in epiblast/hypoblast   (the gut tube is inside the body)
 *     exocoelomic_cysts in chorionic_cavity (the cysts are scraps IN the coelom)
 *     blood_islands in secondary_yolk_sac   (islands in its wall)
 *     germ_cells in secondary_yolk_sac      (they appear in its wall)
 *     yolk_sac_remnant in cord_sheath/chorionic_cavity
 *
 *   SHARED SURFACE BY CONSTRUCTION — two solids meet along a surface that is the same surface:
 *     epiblast / hypoblast                  (the two halves of one disc, overlapped by EQ_PAD)
 *     hypoblast / primary_yolk_sac          (the hypoblast IS the sac's roof — the narration's claim)
 *     hypoblast / secondary_yolk_sac, hypoblast / vitelline_duct
 *     vitelline_duct / primitive_gut, vitelline_duct / secondary_yolk_sac
 *     allantois / primitive_gut, allantois / connecting_stalk
 *     connecting_stalk / cord_sheath, connecting_stalk / chorion, connecting_stalk / hypoblast
 *     amnion / amniotic_cavity, chorion / extraembryonic_mesoderm
 *
 *   A DECLARED CONSEQUENCE, PINNED AT ITS MEASURED SIZE RATHER THAN EXCUSED. After about day 63 the
 *   amnion has expanded to within less than a yolk sac of the chorion, and this model keeps the yolk
 *   sac inside the chorion, so the sac and the amnion are pressed together — which IS what happens
 *   at the root of the cord, where the amnion is reflected over the cord and the sac lies in that
 *   reflection. This model does not resolve the reflection, so the contact is a consequence of
 *   something it does not build. 3.z's own instruction for that case is to pin it at its measured
 *   size so it cannot grow: row K asserts the overlap is at most 0.32 of the sac's vertices at day 80
 *   and ZERO before day 56, which is every beat that shows them both.                               */
const ENVELOPES = ['amniotic_cavity', 'chorionic_cavity', 'amnion', 'chorion',
  'extraembryonic_mesoderm', 'primary_yolk_sac', 'exocoelomic_membrane', 'primary_yolk_sac_late',
  'cord_sheath'];
const PARTITION = {
  envelopes: ENVELOPES,
  contained: [
    ['primitive_gut', 'epiblast'], ['primitive_gut', 'hypoblast'],
    ['exocoelomic_cysts', 'chorionic_cavity'],
    ['blood_islands', 'secondary_yolk_sac'], ['germ_cells', 'secondary_yolk_sac'],
    ['germ_cells', 'hypoblast'], ['germ_cells', 'epiblast'],
    /* THE GERM CELLS' ROUTE IS THROUGH THE GUT'S OWN DORSAL MESENTERY, which is the examinable fact
       in that beat — "then migrate along the dorsal mesentery of the hindgut to reach the gonadal
       ridges". A cell cluster inside the gut tube's drawn envelope on its way there is the anatomy,
       not two solids colliding, so the pairs are published here rather than excused by a tolerance. */
    ['germ_cells', 'primitive_gut'], ['germ_cells', 'vitelline_duct'],
    ['germ_cells', 'vitelline_duct_closing'], ['germ_cells', 'allantois'],
    ['blood_islands', 'secondary_yolk_sac'],
    ['yolk_sac_remnant', 'cord_sheath'], ['yolk_sac_remnant', 'chorionic_cavity'],
    ['yolk_sac_remnant', 'connecting_stalk'],
    ['allantois', 'connecting_stalk'], ['allantois', 'cord_sheath'],
    ['connecting_stalk', 'cord_sheath'],
  ],
  sharedSurface: [
    ['epiblast', 'hypoblast'], ['hypoblast', 'primary_yolk_sac'],
    ['hypoblast', 'secondary_yolk_sac'], ['hypoblast', 'vitelline_duct'],
    ['hypoblast', 'vitelline_duct_closing'], ['hypoblast', 'primitive_gut'],
    ['vitelline_duct', 'primitive_gut'], ['vitelline_duct', 'secondary_yolk_sac'],
    ['vitelline_duct_closing', 'primitive_gut'], ['vitelline_duct_closing', 'secondary_yolk_sac'],
    ['vitelline_duct', 'vitelline_duct_closing'],
    ['allantois', 'primitive_gut'], ['allantois', 'hypoblast'],
    /* THE STALK MEETS THE GUT AT THE CAUDAL END, WHICH IS THE ANATOMY AND NOT A COLLISION. The
       allantois arises from the hindgut and runs INTO the connecting stalk, so the two have to meet
       where the hindgut ends — and they only started overlapping here when the cord was given its
       proper calibre, which is the right way round: a thread meets nothing. */
    ['connecting_stalk', 'primitive_gut'],
    ['connecting_stalk', 'chorion'], ['connecting_stalk', 'hypoblast'],
    ['connecting_stalk', 'extraembryonic_mesoderm'], ['connecting_stalk', 'epiblast'],
    ['primary_yolk_sac', 'primary_yolk_sac_late'],
    ['secondary_yolk_sac', 'primary_yolk_sac_late'],
    ['blood_islands', 'vitelline_duct'], ['blood_islands', 'vitelline_duct_closing'],
  ],
  declaredConsequence: [
    ['secondary_yolk_sac', 'amnion'], ['secondary_yolk_sac', 'amniotic_cavity'],
    ['secondary_yolk_sac', 'cord_sheath'], ['secondary_yolk_sac', 'connecting_stalk'],
    ['vitelline_duct', 'amnion'], ['vitelline_duct', 'amniotic_cavity'],
    ['vitelline_duct_closing', 'amnion'], ['vitelline_duct_closing', 'amniotic_cavity'],
    ['blood_islands', 'amnion'], ['blood_islands', 'amniotic_cavity'],
    ['germ_cells', 'amnion'], ['germ_cells', 'amniotic_cavity'],
    ['yolk_sac_remnant', 'amnion'], ['yolk_sac_remnant', 'amniotic_cavity'],
    ['yolk_sac_remnant', 'extraembryonic_mesoderm'],
  ],
};
function partitionAllows(a, b) {
  if (ENVELOPES.indexOf(a) >= 0 || ENVELOPES.indexOf(b) >= 0) return true;
  const has = L => L.some(p => (p[0] === a && p[1] === b) || (p[0] === b && p[1] === a));
  return has(PARTITION.contained) || has(PARTITION.sharedSurface) || has(PARTITION.declaredConsequence);
}

/* =============================================================================================
 * 16 · THE CHEAP HALF, ASSERTED ON EVERY BUILD
 * =============================================================================================
 * The full battery builds the model a dozen times over and cannot run inside build(). What runs here
 * is free: the two solves converged, the parts that must exist at this t exist, and nothing has gone
 * non-finite. A console.warn here is a real finding — this model's harness treats the console as
 * clean or failed, with no threshold. */
let _assertDepth = 0;
function assertLight(st, g, o) {
  if (_assertDepth) return;
  _assertDepth++;
  try {
    const bad = [];
    if (!(AMN_FIT.rms < 0.02)) bad.push('amnion law fit rms ' + AMN_FIT.rms);
    if (!(D_OBL > D0_F + 5 && D_OBL < 200)) bad.push('obliteration day solve ' + D_OBL);
    if (!(Math.abs(cystSolve().residual) < 1e-3)) bad.push('cyst conservation residual ' + cystSolve().residual);
    for (const n of ['rch', 'ram', 'rys', 'rdisc', 'hy', 'amnA', 'amnB', 'yYS'])
      if (!isFinite(st[n])) bad.push(n + ' is not finite at t = ' + st.t);
    if (o && (o.cut || o.cutz)) { if (bad.length) console.warn('[ayc] ' + bad.join('; ')); return; }
    const keys = {};
    g.traverse(x => { if (x.isMesh && x.userData && x.userData.key && !x.userData.outline) keys[x.userData.key] = 1; });
    /* THE PARTS THAT MUST EXIST AT EVERY t, AND WHY THE LIST IS SHORTER THAN implantation.js's.
       viz3d resolves an UNPINNED ref at t = 1 at mount and never retries a structure that came back
       empty (viz3d.js:480, :1854), so an unpinned part MUST be non-empty at t = 1 or the player tells
       a student the corpus has no model of it. implantation.js makes that a blanket rule — every
       unpinned part at every t — which it can, because all thirteen of its parts span its whole week.
       This model spans ten weeks and some of its parts genuinely do not exist for most of it: there
       is no primary yolk sac on day 60 and no allantois on day 9, and drawing one would teach
       something false in order to make a loader happy. So the rule here is the engine's actual
       requirement plus the beats': non-empty at t = 1, and non-empty at the t of every beat that
       shows it. The list below is the t = 1 half; the harness checks the beat half against the scene,
       which is the only place that knows which beat shows what. */
    const ALWAYS_AT_T1 = ['chorion', 'extraembryonic_mesoderm', 'chorionic_cavity', 'amnion',
      'amniotic_cavity', 'epiblast', 'hypoblast', 'secondary_yolk_sac', 'connecting_stalk',
      'cord_sheath', 'primitive_gut', 'allantois', 'exocoelomic_cysts', 'yolk_sac_remnant'];
    if (st.t > 0.999) for (const k of ALWAYS_AT_T1)
      if (!keys[k]) bad.push('part "' + k + '" built nothing at t = 1, which is the mount');
    if (bad.length) console.warn('[ayc] ' + bad.join('; '));
  } finally { _assertDepth--; }
}

/* =============================================================================================
 * 17 · THE ACCEPTANCE BATTERY
 * =============================================================================================
 * Every row carries a MAGNITUDE FLOOR expressed against an extent of the thing it is about, never
 * `> 0` (RENDER-STANDARD, "A SIGN TEST ON A SPATIAL RELATION IS NOT A TEST"); every row's measured
 * side is read off the BUILT geometry unless its own text says it is a solve output; and every row
 * has a negative case in section 18 that it must reject.
 *
 * Because this model's radii span 190-fold, every comparison of two lengths is a RATIO and every
 * floor is a fraction of an extent. A row written in absolute units would be a different test at
 * each end of the range. */
const ACCEPTANCE = {
  axes: '+y = DORSAL (the amniotic side), -y = VENTRAL (the yolk sac side), +z = CRANIAL, ' +
        '-z = CAUDAL. y = 0 is the EMBRYONIC DISC\'s mid-plane, not the conceptus\'s centre. ' +
        '+x = LEFT and -x = RIGHT are DECLARED AND UNPROVED: row P measures that every key this ' +
        'model builds is mirror-symmetric in x, so there is no chiral landmark anywhere in it and a ' +
        'mirror would be indistinguishable. Nothing this scene narrates names a side. ' +
        'RENDER-STANDARD, "A DECLARED AXIS IS NOT A PROVED ONE, AND A SYMMETRIC MODEL CANNOT PROVE ' +
        'ITS OWN" — met by not making the claim, and said again in the scene\'s gaps[].',
  scale: '1 unit = 10 um, inherited from blastocyst.js through implantation.js. True scale ' +
         'throughout, no scale break: the conceptus is 0.33 mm across at t = 0 and the chorionic ' +
         'sac 64 mm across at t = 1. Row N re-measures the two inherited radii against ' +
         'implantation.js\'s own built geometry rather than trusting a copied constant.',
  clock: 'day = dayAt(t) through a declared monotone piecewise-linear table, day 8 to day 80 ' +
         'POST-FERTILISATION. Every clinical figure in this file is converted from menstrual once, ' +
         'at the point it is declared.',
  rows: {
    'A-dorsal':   'the amniotic cavity sits DORSAL to the disc: its FLOOR is at or above the disc\'s dorsal surface, and its centroid clears that surface by at least 0.35 of the cavity\'s own height (day 9)',
    'B-ventral':  'the primary yolk sac sits VENTRAL to the disc, by the same floor (day 9)',
    'B2-ventral': 'and so does the secondary yolk sac (day 13.2)',
    'C-slit':     'on day 9 the amniotic cavity is a SLIT: its built vertical extent is at most 0.25 of its cranio-caudal one',
    'C2-balloon': 'by day 70 it is a BALLOON: that ratio is at least 0.80',
    'D-plate':    'on day 9 the disc is a PLATE: its built vertical extent is at most 0.55 of its cranio-caudal one',
    'E-shell':    'the coelom shell the emitter builds encloses exactly the difference of the two surfaces that bound it, to 0.5%',
    'E2-falls':   'the built coelom\'s volume fraction falls monotonically over days 42, 56, 70, 80 and is at most 0.20 at day 80',
    'F-crossing': 'the day the BUILT coelom falls past half its volume lies in post-fertilisation weeks 8 to 12 — the narration\'s window, which was no input to the solve',
    'F2-solve':   'SOLVE OUTPUT, NOT GEOMETRY: the fitted obliteration day lies in the same window, and the fit\'s rms residual on its three anchors is under 0.01',
    'G-heldout':  'the HELD-OUT day-35 ratio: the built amnion\'s mean radius over the built sac\'s is within 10% of the published 0.3478 the fit never saw',
    'H-cyst':     'the cyst conservation integral closes on the BUILT grid to 0.1%, and the solved cyst diameter is inside the 0.1-0.5 mm reported for exocoelomic cysts. A CONSERVATION AND RANGE row, NOT a prediction — CYST_FRAC is calibrated and section 10 says so',
    'J-waist':    'the vitelline duct is an HOURGLASS: its built waist is at most 0.55 of the gut tube\'s own built radius (day 28)',
    'J2-narrows': 'and it NARROWS: its built waist, as a fraction of the gut tube\'s own built radius, is at most 0.70 at day 56 of what it was at day 28',
    'K-partition':'no two solids share space except the pairs the partition publishes; the one declared consequence — the yolk sac pressed against the amnion once the coelom is thinner than the sac — is ZERO on both days a beat draws the two together, and is pinned at its measured size at the mount',
    'L-wind':     'every key\'s face normals agree with its own vertex normals, at every sampled day',
    'M-keys':     'every part the player resolves at the mount is built at t = 1',
    'N-inherit':  'the two inherited radii agree with implantation.js\'s OWN BUILT trophoblast to 4%, measured rather than copied (skipped, and reported as skipped, when that file is not loaded)',
    'P-mirror':   'every key is mirror-symmetric in x — which is what makes the axis declaration honest rather than proved',
    'Q-smaller':  'the secondary yolk sac is SMALLER than the primary, by at least a third of the primary\'s radius',
    'R-roof':     'the primary yolk sac\'s ROOF IS THE HYPOBLAST: the two surfaces meet, to within a quarter of the hypoblast\'s own thickness',
    'S-opposite': 'the two cavities are on OPPOSITE SIDES of the same disc: neither crosses into the other\'s half',
    'T-frustum':  'THE DRAWN MODEL FITS THE PLAYER\'S CAMERA at every t. viz3d builds its camera once with far = 4000 and never updates it, so a group whose scaled extent needs a camera further out than that is invisible — which is what happened to six of this scene\'s ten beats before section 12a existed. The row measures the scaled world extent of the whole group and requires a framing distance inside the frustum with a margin, at every sampled day',
  },
};

const FLOOR_SEP = 0.35;        // RENDER-STANDARD's starting figure for a spatial separation
const TOL_HELDOUT = 0.10;
const TOL_SHELL = 0.005;

let _accRunning = false;
function acceptance() {
  if (_accRunning) return { reentrant: true, measured: {}, pass: {}, allPass: true, spec: ACCEPTANCE };
  _accRunning = true;
  const m = {}, ok = {};
  try {
    const cache = {};
    const at = day => {
      const k = day.toFixed(4);
      if (!cache[k]) {
        const st = stateAt(tOfDay(day));
        cache[k] = { st: st, S: keyStats(build(tOfDay(day), Object.assign({}, FULL_SET))) };
      }
      return cache[k];
    };
    const discBox = S => {
      const b = new T.Box3();
      for (const k of ['epiblast', 'hypoblast']) if (S[k]) b.union(S[k].bb);
      return b;
    };
    const sep = (aY, bY, aExt, bExt) => (aY - bY) / Math.max(1e-9, 0.5 * (aExt + bExt));

    /* ---- A, B, B2 · which cavity is on which side of the disc ---- */
    {
      const { S } = at(9);
      const db = discBox(S), dc = db.getCenter(new T.Vector3()), ds = db.getSize(new T.Vector3());
      const A = S['amniotic_cavity'], P = S['primary_yolk_sac'];
      /* RENDER-STANDARD: "where the claim is about a structure's EDGES — 'straddles the median
         plane', 'reaches as far as' — measure the BOUNDING BOX, not the centroid". "The amniotic
         cavity is DORSAL to the disc" is an edge claim: the question is which side of the disc it is
         on, not where its middle is. Measured on the centroid alone and normalised by the mean of
         the two vertical extents it read 0.3488 against a 0.35 floor — a near miss that said nothing
         about the picture, because a thin dome on a disc five times its own height can sit entirely
         clear of it and still have a small normalised centroid gap. So the row asserts BOTH: the
         cavity's floor is at or above the disc's dorsal surface, and its centroid clears that
         surface by at least 0.35 of the cavity's OWN height. */
      m['A-dorsal'] = { floorAboveDiscTop: A.bb.min.y - db.max.y,
                        centroidClearance: (A.centroid.y - db.max.y) / Math.max(1e-9, A.size.y),
                        discTop: db.max.y, cavityFloor: A.bb.min.y };
      ok['A-dorsal'] = m['A-dorsal'].floorAboveDiscTop >= -1e-6 &&
                       m['A-dorsal'].centroidClearance >= FLOOR_SEP;
      m['B-ventral'] = sep(dc.y, P.centroid.y, ds.y, P.size.y);
      ok['B-ventral'] = m['B-ventral'] >= FLOOR_SEP;
      /* ---- C, D, S · the shapes beat 1 and beat 2 are about ---- */
      m['C-slit'] = A.size.y / A.size.z;
      ok['C-slit'] = m['C-slit'] <= 0.25;
      m['D-plate'] = ds.y / ds.z;
      ok['D-plate'] = m['D-plate'] <= 0.55;
      m['S-opposite'] = {
        amnMinY_minus_discMaxY: A.bb.min.y - db.max.y,
        ysMaxY_minus_discMinY: P.bb.max.y - db.min.y,
        thEpi: at(9).st.thEpi, thHypo: at(9).st.thHypo,
      };
      ok['S-opposite'] = (A.bb.min.y - db.max.y) >= -0.30 * at(9).st.thEpi &&
                         (P.bb.max.y - db.min.y) <= 0.30 * at(9).st.thHypo;
      /* ---- R · the hypoblast is the primary sac's roof ---- */
      m['R-roof'] = Math.abs(P.bb.max.y - db.min.y) / Math.max(1e-9, at(9).st.thHypo);
      ok['R-roof'] = m['R-roof'] <= 0.25;
    }
    {
      const { S, st } = at(13.2);
      const db = discBox(S), dc = db.getCenter(new T.Vector3()), ds = db.getSize(new T.Vector3());
      const Y = S['secondary_yolk_sac'];
      m['B2-ventral'] = sep(dc.y, Y.centroid.y, ds.y, Y.size.y);
      ok['B2-ventral'] = m['B2-ventral'] >= FLOOR_SEP;
      /* ---- Q · the secondary sac is smaller than the primary ---- */
      const PL = S['primary_yolk_sac_late'];
      const rP = eqRadiusHull(PL), rS = eqRadius(Y);
      m['Q-smaller'] = { primaryEqR: rP, secondaryEqR: rS, ratio: rS / Math.max(1e-9, rP) };
      ok['Q-smaller'] = rP - rS >= (1 / 3) * rP;
    }
    /* ---- C2 · the slit has become a balloon ---- */
    {
      const { S } = at(70);
      const A = S['amniotic_cavity'];
      m['C2-balloon'] = A.size.y / A.size.z;
      ok['C2-balloon'] = m['C2-balloon'] >= 0.80;
    }

    /* ---- E, E2, F · the coelom, measured on the built grid ----
       E is a CLOSURE check on the shell emitter itself: the solid it builds between two surfaces
       must enclose the difference of the volumes those two surfaces enclose. Nothing in this model
       depends on more than that, and until this row existed the eccentric coelom shell — two
       surfaces about two different centres, parameterised independently — was taken on trust. */
    const refSphereVol = r => Math.abs(geoVolume(ellipsoidShell({ cy: 0, ax: r, ay: r, az: r, nu: PH_N, nv: TH_N })));
    {
      const { S, st } = at(56);
      const C = S['chorionic_cavity'], Am = S['amnion'];
      const rOut = st.rExmIn - gapAt(st.rch);
      const want = refSphereVol(rOut) - Math.abs(Am.hullVol);
      m['E-shell'] = { builtCoelom: Math.abs(C.closedVol), outerMinusAmnion: want,
                       rel: (Math.abs(C.closedVol) - want) / Math.max(1e-9, want) };
      ok['E-shell'] = Math.abs(m['E-shell'].rel) <= TOL_SHELL;
    }
    const coelFrac = day => {
      const { S, st } = at(day);
      const C = S['chorionic_cavity']; if (!C) return 0;
      const rOut = st.rExmIn - gapAt(st.rch);
      return Math.abs(C.closedVol) / Math.max(1e-9, refSphereVol(rOut));
    };
    {
      const fr = [42, 56, 70, 80].map(coelFrac);
      m['E2-falls'] = { day42: fr[0], day56: fr[1], day70: fr[2], day80: fr[3] };
      ok['E2-falls'] = fr[0] > fr[1] && fr[1] > fr[2] && fr[2] > fr[3] && fr[3] <= 0.20;
      /* F · bisect the BUILT fraction for the day it passes a half. This is a measurement on
         geometry, not a reading of the law: it builds the model at each probe day. */
      let lo = 42, hi = 80, mid = 0;
      for (let i = 0; i < 9; i++) { mid = 0.5 * (lo + hi); if (coelFrac(mid) > 0.5) lo = mid; else hi = mid; }
      m['F-crossing'] = { day: mid, weeks: mid / 7 };
      ok['F-crossing'] = mid >= 56 && mid <= 84;
      m['F2-solve'] = { D_OBL: D_OBL, weeks: D_OBL / 7, p: AMN_P, rms: AMN_FIT.rms,
                        predicted35: AMN_FIT.predicted35, published35: HELD_RATIO.f };
      ok['F2-solve'] = D_OBL >= 56 && D_OBL <= 84 && AMN_FIT.rms < 0.01;
    }
    /* ---- G · the held-out ratio, measured off the built amnion and the built sac ---- */
    {
      const { S, st } = at(35);
      const rAm = eqRadiusHull(S['amnion']);
      const rSac = Math.pow(3 * refSphereVol(st.rExmIn) / (4 * Math.PI), 1 / 3);
      const got = rAm / rSac;
      m['G-heldout'] = { builtRatio: got, published: HELD_RATIO.f,
                         rel: (got - HELD_RATIO.f) / HELD_RATIO.f };
      ok['G-heldout'] = Math.abs(m['G-heldout'].rel) <= TOL_HELDOUT;
    }
    /* ---- H · the cyst conservation ---- */
    {
      const { S } = at(14);
      const C = S['exocoelomic_cysts'];
      const one = C ? Math.abs(C.closedVol) / CYST_N : 0;
      const d = 2 * Math.pow(3 * one / (4 * Math.PI), 1 / 3);
      m['H-cyst'] = { residual: cystSolve().residual, solvedR: cystSolve().r,
                      builtDiameterUnits: d, builtDiameterMm: d / 100,
                      V1: cystSolve().V1, V2: cystSolve().V2, grid: cystSolve().grid };
      ok['H-cyst'] = Math.abs(cystSolve().residual) <= 1e-3 && d >= 10 && d <= 50;
    }
    /* ---- J, J2 · the hourglass, and that it narrows ---- */
    const waistOf = day => {
      const { S } = at(day);
      const D = S['vitelline_duct'] || S['vitelline_duct_closing'];
      if (!D) return null;
      /* the smallest distance to the y axis over the middle third of the duct's own vertical span */
      const yA = D.bb.min.y + D.size.y / 3, yB = D.bb.max.y - D.size.y / 3;
      let r = Infinity;
      for (const q of D.hullT) for (const v of q)
        if (v.y >= yA && v.y <= yB) r = Math.min(r, Math.hypot(v.x, v.z));
      return isFinite(r) ? r : null;
    };
    {
      const w28 = waistOf(28);
      const { S } = at(28);
      const G = S['primitive_gut'];
      let rg = 0;
      for (const q of G.hullT) for (const v of q) rg = Math.max(rg, Math.hypot(v.x, v.y - at(28).st.yGut));
      m['J-waist'] = { waist: w28, gutRadius: rg, ratio: w28 / Math.max(1e-9, rg) };
      ok['J-waist'] = w28 != null && w28 <= 0.55 * rg;
      /* J2 · THE NARROWING, AS A FRACTION OF THE GUT. Both days are read off built geometry — the
         day-28 duct from the day-28 build and the closing duct from its own, each divided by the gut
         radius measured in the same build — so a change to the duct law or to the gut law moves the
         number and the harness's perturbation sees it. See the note at VD_CMP_DAY for why an
         absolute comparison was the wrong test. */
      const ratioAt = (day, key) => {
        const SS = at(day).S, D = SS[key], GG = SS['primitive_gut'];
        if (!D || !GG) return null;
        const yA2 = D.bb.min.y + D.size.y / 3, yB2 = D.bb.max.y - D.size.y / 3;
        let w = Infinity;
        for (const q of D.hullT) for (const v of q)
          if (v.y >= yA2 && v.y <= yB2) w = Math.min(w, Math.hypot(v.x, v.z));
        let g2 = 0;
        for (const q of GG.hullT) for (const v of q) g2 = Math.max(g2, Math.hypot(v.x, v.y - at(day).st.yGut));
        return isFinite(w) ? w / Math.max(1e-9, g2) : null;
      };
      const r28 = ratioAt(28, 'vitelline_duct');
      const r56 = ratioAt(VD_CMP_DAY, 'vitelline_duct');
      m['J2-narrows'] = { ratioDay28: r28, ratioDay56: r56,
                          shrink: r28 && r56 ? r56 / r28 : null, cmpDay: VD_CMP_DAY };
      ok['J2-narrows'] = r28 != null && r56 != null && r56 <= 0.70 * r28;
    }
    /* ---- K · 3.z, over the pairs the partition does not publish ---- */
    {
      const bad = [];
      for (const day of [13.2, 28, 56]) {
        const { S } = at(day);
        const keys = Object.keys(S);
        for (let i = 0; i < keys.length; i++) for (let j = i + 1; j < keys.length; j++) {
          const a = keys[i], b = keys[j];
          if (partitionAllows(a, b)) continue;
          if (!S[a].bb.intersectsBox(S[b].bb)) continue;
          const fa = insideFrac(S[a], S[b]), fb = insideFrac(S[b], S[a]);
          if (Math.max(fa, fb) > 0.02) bad.push({ day, a, b, fa, fb });
        }
      }
      /* THE DECLARED CONSEQUENCE, PINNED. Zero at every day a beat shows the yolk sac and the
         amniotic cavity together — days 56 and 70 — and at day 80, which is the MOUNT and no beat's
         instant, pinned at its measured size so it cannot grow. 3.z: "in the second case the row
         pins it at its measured size so it cannot grow." */
      const s56 = at(56).S, s70 = at(70).S, s80 = at(80).S;
      const d56 = insideFrac(s56['secondary_yolk_sac'], s56['amniotic_cavity']);
      const d70 = insideFrac(s70['secondary_yolk_sac'], s70['amniotic_cavity']);
      const d80 = insideFrac(s80['secondary_yolk_sac'], s80['amniotic_cavity']);
      m['K-partition'] = { unpublishedOverlaps: bad, atBeatDay56: d56, atBeatDay70: d70,
                           atMountDay80: d80 };
      ok['K-partition'] = bad.length === 0 && d56 <= 0.02 && d70 <= 0.02 && d80 <= 0.75;
    }
    /* ---- L · winding, over every key at every day already built ---- */
    {
      let worst = 1, worstKey = null, worstDay = null;
      for (const day of [9, 13.2, 14, 28, 35, 42, 56, 70, 80]) {
        const { S } = at(day);
        for (const k in S) if (S[k].windAgree < worst) { worst = S[k].windAgree; worstKey = k; worstDay = day; }
      }
      m['L-wind'] = { worst, worstKey, worstDay };
      ok['L-wind'] = worst >= 1 - 1e-12;
    }
    /* ---- M · the mount's key set ---- */
    {
      const S = at(80).S;
      const need = ['chorion', 'extraembryonic_mesoderm', 'chorionic_cavity', 'amnion',
        'amniotic_cavity', 'epiblast', 'hypoblast', 'secondary_yolk_sac', 'connecting_stalk',
        'cord_sheath', 'primitive_gut', 'allantois', 'exocoelomic_cysts', 'yolk_sac_remnant'];
      const missing = need.filter(k => !S[k]);
      m['M-keys'] = { built: Object.keys(S).length, missing };
      ok['M-keys'] = missing.length === 0;
    }
    /* ---- N · measured against implantation.js's OWN built trophoblast, never a copied constant --- */
    {
      const other = window.MB3D_MODELS && window.MB3D_MODELS['implantation'];
      if (!other || typeof other.build !== 'function' || typeof other.tOfDay !== 'function') {
        m['N-inherit'] = { skipped: 'models3d/implantation.js is not loaded beside this file' };
        ok['N-inherit'] = null;
      } else {
        const meas = d => {
          const gg = other.build(other.tOfDay(d), Object.assign({}, other.FULL));
          const SS = other.keyStats(gg);
          const S2 = SS['syncytiotrophoblast'];
          return S2 ? Math.pow(3 * Math.abs(S2.hullVol) / (4 * Math.PI), 1 / 3) : null;
        };
        const r8 = meas(8), r13 = meas(13);
        const e8 = r8 ? (Rch(8) - r8) / r8 : null, e13 = r13 ? (Rch(13) - r13) / r13 : null;
        m['N-inherit'] = { theirR8: r8, ourR8: Rch(8), rel8: e8, theirR13: r13, ourR13: Rch(13), rel13: e13 };
        ok['N-inherit'] = e8 != null && e13 != null && Math.abs(e8) <= 0.04 && Math.abs(e13) <= 0.04;
      }
    }
    /* ---- T · the drawn extent, against the player's own fixed frustum ----
       Measured on the BUILT geometry times the group's own scale, and checked against the two
       numbers the player actually uses: viz3d.js's 45-degree vertical field of view and its far
       plane of 4000. The framing distance is viz3d's own formula (half the extent over the tangent
       of the half-angle, times its FRAME_PAD of 1.05, plus the depth extent), so this row asks the
       question the player asks and not a proxy for it. */
    {
      const FOV = 45, PAD = 1.05, FAR = 4000, NEAR = 0.01;
      const half = Math.tan(FOV * Math.PI / 360);
      let worst = 0, worstDay = null, nearest = Infinity, nearestDay = null;
      for (const day of [9, 13.2, 21, 28, 42, 56, 70, 80]) {
        const { S, st } = at(day);
        const b = new T.Box3();
        for (const k in S) b.union(S[k].bb);
        const sz = b.getSize(new T.Vector3()).multiplyScalar(sceneScale(st.day));
        const ext = Math.max(sz.x, sz.y);
        const dist = (ext / 2) / half * PAD + sz.z;
        if (dist > worst) { worst = dist; worstDay = day; }
        if (dist < nearest) { nearest = dist; nearestDay = day; }
      }
      m['T-frustum'] = { worstFramingDistance: worst, atDay: worstDay, playerFar: FAR,
                         nearestFramingDistance: nearest, atDayNear: nearestDay, playerNear: NEAR,
                         sceneSpan: SCENE_SPAN };
      ok['T-frustum'] = worst <= 0.25 * FAR && nearest >= 20 * NEAR;
    }

    /* ---- P · mirror symmetry in x, which is the honest form of the axis declaration ---- */
    {
      const { S } = at(28);
      let worst = 0, worstKey = null, unmatched = 0, total = 0;
      for (const k in S) {
        const s = S[k];
        const rel = Math.abs(s.centroid.x) / Math.max(1e-9, s.size.x);
        if (rel > worst) { worst = rel; worstKey = k; }
        /* and a vertex-level check: every hull vertex must have a partner at -x */
        const pts = [];
        for (const q of s.hullT) for (const v of q) pts.push(v);
        const step = Math.max(1, Math.floor(pts.length / 240));
        const tolv = Math.max(1e-6, 1e-3 * Math.max(s.size.x, s.size.y, s.size.z));
        for (let i = 0; i < pts.length; i += step) {
          const p = pts[i]; total++;
          let found = false;
          for (let j = 0; j < pts.length && !found; j++) {
            const q = pts[j];
            if (Math.abs(q.x + p.x) < tolv && Math.abs(q.y - p.y) < tolv && Math.abs(q.z - p.z) < tolv) found = true;
          }
          if (!found) unmatched++;
        }
      }
      m['P-mirror'] = { worstCentroidRel: worst, worstKey, unmatchedVertices: unmatched, sampled: total };
      ok['P-mirror'] = worst <= 0.02 && unmatched === 0;
    }
  } catch (e) {
    ok['EXCEPTION'] = false;
    m['EXCEPTION'] = String(e && e.message || e);
  } finally { _accRunning = false; }
  return { measured: m, pass: ok, spec: ACCEPTANCE,
           allPass: Object.keys(ok).every(k => ok[k] !== false) };
}

/* =============================================================================================
 * 18 · NEGATIVE CASES — "EVERY ACCEPTANCE TEST NEEDS A NEGATIVE CASE"
 * =============================================================================================
 * A test that grades its own homework in the wrong units launders a defect into a proof. Each id
 * below feeds its own predicate a deliberately wrong measured value and requires it to be rejected.
 * The predicates are the SAME expressions the rows use, written once here and once there — which is
 * the one duplication this file accepts, because a negative case that calls the row's own code
 * cannot test the row's own comparison. */
function negatives() {
  const r = {};
  const P = {
    'A-dorsal':   v => v.floor >= -1e-6 && v.cent >= FLOOR_SEP,
    'B-ventral':  v => v >= FLOOR_SEP,
    'B2-ventral': v => v >= FLOOR_SEP,
    'C-slit':     v => v <= 0.25,
    'C2-balloon': v => v >= 0.80,
    'D-plate':    v => v <= 0.55,
    'E-shell':    v => Math.abs(v) <= TOL_SHELL,
    'E2-falls':   v => v[0] > v[1] && v[1] > v[2] && v[2] > v[3] && v[3] <= 0.20,
    'F-crossing': v => v >= 56 && v <= 84,
    'F2-solve':   v => v.D >= 56 && v.D <= 84 && v.rms < 0.01,
    'G-heldout':  v => Math.abs(v) <= TOL_HELDOUT,
    'H-cyst':     v => Math.abs(v.res) <= 1e-3 && v.d >= 10 && v.d <= 50,
    'J-waist':    v => v.w <= 0.55 * v.g,
    'J2-narrows': v => v.r56 <= 0.70 * v.r28,
    'K-partition':v => v.n === 0 && v.d56 <= 0.02 && v.d70 <= 0.02 && v.d80 <= 0.75,
    'L-wind':     v => v >= 1 - 1e-12,
    'M-keys':     v => v === 0,
    'N-inherit':  v => Math.abs(v) <= 0.04,
    'P-mirror':   v => v.rel <= 0.02 && v.un === 0,
    'T-frustum':  v => v.worst <= 1000 && v.near >= 0.2,
    'Q-smaller':  v => v.p - v.s >= (1 / 3) * v.p,
    'R-roof':     v => v <= 0.25,
    'S-opposite': v => v.a >= -0.30 * v.te && v.b <= 0.30 * v.th,
  };
  /* the deliberately wrong input for each, and what makes it wrong */
  const WRONG = {
    'A-dorsal':   { floor: -1.95, cent: 0.9 },  // the real defect: a cavity whose floor is 1.95 units INSIDE the disc
    'B-ventral':  0.00,                        // no separation at all
    'B2-ventral': 0.30,                        // just under the floor
    'C-slit':     0.70,                        // a slit that is as tall as it is long
    'C2-balloon': 0.40,                        // a balloon still shaped like a slit
    'D-plate':    0.95,                        // a disc shaped like a ball
    'E-shell':    0.08,                        // an 8% leak in the shell emitter
    'E2-falls':   [0.5, 0.6, 0.7, 0.8],        // a coelom that GROWS
    'F-crossing': 40,                          // week 5.7 — before the narration's window
    'F2-solve':   { D: 120, rms: 0.004 },      // week 17
    'G-heldout':  0.45,                        // 45% off the held-out ratio
    'H-cyst':     { res: 0.02, d: 90 },        // conservation 2% out, cysts 0.9 mm across
    'J-waist':    { w: 9, g: 10 },             // a "waist" the width of the gut: no hourglass
    'J2-narrows': { r28: 0.42, r56: 0.40 },    // a duct that barely narrows at all
    'K-partition':{ n: 0, d56: 0.22, d70: 0.0, d80: 0.1 },  // the real defect: the sac 22% inside the amnion in a beat
    'L-wind':     0.993,                       // 0.7% of triangles wound against their normals
    'M-keys':     2,                           // two parts missing at the mount
    'N-inherit':  0.13,                        // the 13% inheritance error implantation.js actually had
    'P-mirror':   { rel: 0.004, un: 6 },       // centroid fine, six vertices with no partner
    'T-frustum':  { worst: 7200, near: 0.6 },  // the real defect: the day-70 beat 7,200 units out, behind far = 4000
    'Q-smaller':  { p: 10, s: 8 },             // a "smaller" sac that is 80% of the primary
    'R-roof':     0.90,                        // the sac's roof nearly a whole hypoblast away
    'S-opposite': { a: -4, b: 4, te: 1.4, th: 0.8 },  // both cavities crossing into the disc
  };
  let allRejected = true;
  for (const id in P) {
    const rejected = !P[id](WRONG[id]);
    r[id] = { wrong: WRONG[id], rejected };
    if (!rejected) allRejected = false;
  }
  return { cases: r, allRejected, count: Object.keys(r).length };
}

/* =============================================================================================
 * 19 · claimMeasure — the scene's beat claims, evaluated at THAT BEAT'S OWN t
 * =============================================================================================
 * RENDER-STANDARD: "Every view of a time-varying scene carries its narrated claims as
 * machine-checkable claims[], evaluated against the model at THAT VIEW'S OWN SET_STAGE t." This is
 * the model's own vocabulary, which is the route check-beat-claims.mjs takes for a model that has no
 * cycle() — and every measure here that says "built" builds the model at that t and reads the
 * triangles, because a claim evaluated against the constants the geometry came from pins nothing. */
const _cmCache = {};
function cmStats(t) {
  const k = t.toFixed(6);
  if (!_cmCache[k]) _cmCache[k] = keyStats(build(t, Object.assign({}, FULL_SET)));
  return _cmCache[k];
}
function claimMeasure(name, t) {
  const st = stateAt(t);
  const S = () => cmStats(t);
  const discBB = () => {
    const s = S(), b = new T.Box3();
    for (const k of ['epiblast', 'hypoblast']) if (s[k]) b.union(s[k].bb);
    return b;
  };
  switch (name) {
    case 'day': return st.day;
    case 'week': return st.day / 7;
    /* ---- built ---- */
    case 'amnEccBuilt': {
      const A = S()['amniotic_cavity']; return A ? A.size.y / A.size.z : NaN;
    }
    case 'discFlatBuilt': { const b = discBB(), s = b.getSize(new T.Vector3()); return s.y / s.z; }
    case 'amnDorsalSep': {
      const A = S()['amniotic_cavity'], b = discBB();
      const c = b.getCenter(new T.Vector3()), s = b.getSize(new T.Vector3());
      return (A.centroid.y - c.y) / Math.max(1e-9, 0.5 * (A.size.y + s.y));
    }
    case 'primVentralSep': {
      const P = S()['primary_yolk_sac'], b = discBB();
      if (!P) return NaN;
      const c = b.getCenter(new T.Vector3()), s = b.getSize(new T.Vector3());
      return (c.y - P.centroid.y) / Math.max(1e-9, 0.5 * (P.size.y + s.y));
    }
    case 'secVentralSep': {
      const Y = S()['secondary_yolk_sac'], b = discBB();
      if (!Y) return NaN;
      const c = b.getCenter(new T.Vector3()), s = b.getSize(new T.Vector3());
      return (c.y - Y.centroid.y) / Math.max(1e-9, 0.5 * (Y.size.y + s.y));
    }
    case 'secYolkDiamUm': { const Y = S()['secondary_yolk_sac']; return Y ? 2 * eqRadius(Y) * 10 : NaN; }
    case 'primOverSecEqR': {
      const s = S(), P = s['primary_yolk_sac_late'], Y = s['secondary_yolk_sac'];
      if (!P || !Y) return NaN;
      return eqRadiusHull(P) / Math.max(1e-9, eqRadius(Y));
    }
    case 'coelomFracBuilt': {
      const s = S(), C = s['chorionic_cavity'];
      if (!C) return 0;
      const rOut = st.rExmIn - gapAt(st.rch);
      const ref = Math.abs(geoVolume(ellipsoidShell({ cy: 0, ax: rOut, ay: rOut, az: rOut, nu: PH_N, nv: TH_N })));
      return Math.abs(C.closedVol) / Math.max(1e-9, ref);
    }
    case 'amnOverSacBuilt': {
      const s = S(), A = s['amnion'];
      if (!A) return NaN;
      const ref = Math.abs(geoVolume(ellipsoidShell({ cy: 0, ax: st.rExmIn, ay: st.rExmIn, az: st.rExmIn, nu: PH_N, nv: TH_N })));
      return eqRadiusHull(A) / Math.max(1e-9, Math.pow(3 * ref / (4 * Math.PI), 1 / 3));
    }
    case 'cystCountBuilt': {
      const s = S();
      return s['exocoelomic_cysts'] ? CYST_N : 0;
    }
    case 'cystDiamUm': {
      const C = S()['exocoelomic_cysts'];
      if (!C) return 0;
      return 2 * Math.pow(3 * (Math.abs(C.closedVol) / CYST_N) / (4 * Math.PI), 1 / 3) * 10;
    }
    case 'ductWaistOverGut': {
      const s = S(), D = s['vitelline_duct'], G = s['primitive_gut'];
      if (!D || !G) return NaN;
      const yA = D.bb.min.y + D.size.y / 3, yB = D.bb.max.y - D.size.y / 3;
      let w = Infinity;
      for (const q of D.hullT) for (const v of q)
        if (v.y >= yA && v.y <= yB) w = Math.min(w, Math.hypot(v.x, v.z));
      let rg = 0;
      for (const q of G.hullT) for (const v of q) rg = Math.max(rg, Math.hypot(v.x, v.y - st.yGut));
      return isFinite(w) ? w / Math.max(1e-9, rg) : NaN;
    }
    case 'ductWaistUnits': {
      const D = S()['vitelline_duct'];
      if (!D) return 0;
      const yA = D.bb.min.y + D.size.y / 3, yB = D.bb.max.y - D.size.y / 3;
      let w = Infinity;
      for (const q of D.hullT) for (const v of q)
        if (v.y >= yA && v.y <= yB) w = Math.min(w, Math.hypot(v.x, v.z));
      return isFinite(w) ? w : 0;
    }
    case 'gutLengthOverDisc': {
      const s = S(), G = s['primitive_gut'];
      if (!G) return 0;
      return G.size.z / Math.max(1e-9, 2 * st.rdisc);
    }
    case 'stalkLenOverRch': return st.stalkLen / st.rch;
    /* THE RATIO OF TWO CALIBRES, NOT OF TWO BOUNDING BOXES. The first version compared the two
       parts' box extents, and the sheath is deliberately SHORTER than the stalk while the amnion is
       still working its way out along it — so a sleeve that is genuinely 1.22 times the stalk's
       radius measured 0.67 and the claim failed on a length it was never about. Both radii are read
       off the built vertices as the largest perpendicular distance from the stalk's own axis. */
    case 'sheathOverStalkBuilt': {
      const s = S(), H = s['cord_sheath'], C = s['connecting_stalk'];
      if (!H || !C) return NaN;
      const O = st.stalkFrom, D = st.stalkDir;
      const rad = (k) => {
        let m = 0;
        for (const q of k.hullT) for (const v of q) {
          const w = new T.Vector3().subVectors(v, O);
          const along = w.dot(D);
          m = Math.max(m, w.sub(D.clone().multiplyScalar(along)).length());
        }
        return m;
      };
      return rad(H) / Math.max(1e-9, rad(C));
    }
    case 'allantoisPresent': { return S()['allantois'] ? 1 : 0; }
    case 'islandCountBuilt': { const s = S(); return s['blood_islands'] ? 14 : 0; }
    case 'germPresent': { return S()['germ_cells'] ? 1 : 0; }
    case 'remnantDiamUm': {
      const R = S()['yolk_sac_remnant'];
      return R ? 2 * eqRadius(R) * 10 : 0;
    }
    case 'chorSacDiamMm': return 2 * st.rch / 100;
    case 'amnSacDiamMm': return 2 * st.ram / 100;
  }
  throw new Error('unknown measure: ' + name);
}
function measures(names, t) {
  const out = {};
  for (const n of names) out[n] = claimMeasure(n, t);
  return out;
}

/* =============================================================================================
 * 20 · the provider contract
 * ============================================================================================= */
window.MB3D_MODELS = window.MB3D_MODELS || {};
window.MB3D_MODELS['amniotic-cavity-yolk-sac'] = {
  LAYERS: LAYERS,
  build: build,
  /* Every optional layer on, so a structure behind a flag is still resolvable and the adapter can
     slice the group by key. `cut` is NOT here: a sectioned conceptus is a different picture, not an
     extra layer, and the scene asks for it by name with a +cut flag. */
  FULL: { wall: true, amnion: true, disc: true, primary: true, secondary: true, cysts: true,
          stalk: true, gut: true, duct: true, islands: true, germ: true, remnant: true,
          late_primary: true, duct_closing: true },
  axes: ACCEPTANCE.axes,
  scale: ACCEPTANCE.scale,
  ACCEPTANCE: ACCEPTANCE,
  acceptance: acceptance,
  negatives: negatives,
  measures: measures,
  claimMeasure: claimMeasure,
  stateAt: stateAt,
  clearCaches: clearCaches,
  PARTITION: PARTITION,
  partitionAllows: partitionAllows,
  keyStats: keyStats,
  geoVolume: geoVolume,
  eqRadius: eqRadius,
  eqRadiusHull: eqRadiusHull,
  insideFrac: insideFrac,
  dayAt: dayAt,
  tOfDay: tOfDay,
  Rch: Rch, Rys: Rys, Rdisc: Rdisc, Ram: Ram, fAmn: fAmn,
  AMN_FIT: AMN_FIT, cystSolve: cystSolve, sceneScale: sceneScale, SCENE_SPAN: SCENE_SPAN,
  constants: {
    R_D8: R_D8, R_D13: R_D13, D_OBL: D_OBL, AMN_P: AMN_P, F0: F0, D0_F: D0_F,
    CYST_N: CYST_N, CYST_FRAC: CYST_FRAC, CYST_PINCH_DAY: CYST_PINCH_DAY,
    CYST_CMP_DAY: CYST_CMP_DAY, VD_CMP_DAY: VD_CMP_DAY,
    PH_N: PH_N, TH_N: TH_N, PH_S: PH_S, TH_S: TH_S,
    DAY_T0: DAY_T0, DAY_T1: DAY_T1,
    FIT_RATIOS: FIT_RATIOS, HELD_RATIO: HELD_RATIO,
  },
  /* the grid, exposed so the harness can PERTURB it: "change the constant the geometry uses and the
     reported number must move. If it does not, the test is not measuring the model." */
  setGrid: function (nph, nth, nphS, nthS) {
    if (nph) PH_N = nph; if (nth) TH_N = nth;
    if (nphS) PH_S = nphS; if (nthS) TH_S = nthS;
    clearCaches();
    return { PH_N: PH_N, TH_N: TH_N, PH_S: PH_S, TH_S: TH_S };
  },
  grid: function () { return { PH_N: PH_N, TH_N: TH_N, PH_S: PH_S, TH_S: TH_S }; },
  T_REQUIRED: [0, 0.2, 0.4, 0.6, 0.8, 1.0],
};
})();
