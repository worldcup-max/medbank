/* SN2 template — the fixed "screenplay" the 3D engine performs. The server (import-server/explainer.mjs)
 * only rewrites the narration and the note lines for each student's note; it can never change what the
 * 3D shows. Step ids here MUST match SN2_STEPS in import-server/explainer.mjs. */
const HALO = { Br: { name: "bromine", xo: "bromo", ion: "bromide" }, Cl: { name: "chlorine", xo: "chloro", ion: "chloride" }, I: { name: "iodine", xo: "iodo", ion: "iodide" } };
const FIG = `<svg class="mbx-fig" viewBox="0 0 960 300" xmlns="http://www.w3.org/2000/svg" font-family="'Segoe UI',Roboto,Helvetica,Arial,sans-serif">
  <defs>
    <marker id="mbx-ah" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse"><path d="M0,0 L10,5 L0,10 z" fill="#c0392b"/></marker>
    <marker id="mbx-ra" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="8" markerHeight="8" orient="auto"><path d="M0,0 L10,5 L0,10 z" fill="#222"/></marker>
    <pattern id="mbx-ruled" width="960" height="28" patternUnits="userSpaceOnUse"><line x1="0" y1="27.5" x2="960" y2="27.5" stroke="#dfe6f0" stroke-width="1"/></pattern>
    <mask id="mbx-ndim"><rect width="960" height="300" fill="white"/><g id="mbx-nholes" fill="black"></g></mask>
    <filter id="mbx-nfeather"><feGaussianBlur stdDeviation="7"/></filter>
  </defs>
  <rect width="960" height="300" fill="#fbfaf6"/>
  <rect width="960" height="300" fill="url(#mbx-ruled)"/>
  <line x1="44" y1="0" x2="44" y2="300" stroke="#f3b6b6" stroke-width="1.2"/>
  <g fill="#1d1d22" font-size="22" stroke-linecap="round">
    <!-- reactants: hydroxide + (S)-2-{xo}butane -->
    <text x="58" y="158">HO</text><text x="88" y="146" font-size="16">⊖</text>
    <circle cx="70" cy="132" r="2.4"/><circle cx="79" cy="132" r="2.4"/>
    <circle cx="70" cy="170" r="2.4"/><circle cx="79" cy="170" r="2.4"/>
    <path d="M86 128 C 120 70, 185 80, 206 136" fill="none" stroke="#c0392b" stroke-width="2.4" marker-end="url(#mbx-ah)"/>
    <text x="211" y="158">C</text>
    <text x="234" y="140" font-size="15" fill="#c0392b">δ+</text>
    <line x1="232" y1="151" x2="300" y2="151" stroke="#1d1d22" stroke-width="2.6"/>
    <text x="304" y="158">{X}</text>
    <text x="306" y="186" font-size="15" fill="#c0392b">δ−</text>
    <path d="M266 146 C 270 110, 316 104, 326 132" fill="none" stroke="#c0392b" stroke-width="2.4" marker-end="url(#mbx-ah)"/>
    <line x1="215" y1="138" x2="204" y2="96" stroke="#1d1d22" stroke-width="2.6"/>
    <text x="180" y="90">H₃C</text>
    <path d="M214 160 L 168 182 L 172 190 z" fill="#1d1d22"/>
    <text x="150" y="200">H</text>
    <g stroke="#1d1d22" stroke-width="2.2"><line x1="214" y1="165" x2="210" y2="170"/><line x1="208" y1="176" x2="204" y2="182"/><line x1="203" y1="188" x2="198" y2="194"/><line x1="196" y1="200" x2="192" y2="206"/></g>
    <text x="176" y="230">C₂H₅</text>
    <text x="70" y="270" font-size="14" fill="#555">(S)-2-{xo}butane</text>
    <!-- arrow -->
    <line x1="352" y1="151" x2="402" y2="151" stroke="#222" stroke-width="2.2" marker-end="url(#mbx-ra)"/>
    <!-- transition state -->
    <path d="M420 70 L 410 70 L 410 238 L 420 238" fill="none" stroke="#1d1d22" stroke-width="2.2"/>
    <text x="428" y="158">HO</text><text x="430" y="128" font-size="15" fill="#c0392b">δ−</text>
    <g stroke="#1d1d22" stroke-width="2.4" stroke-dasharray="3 6"><line x1="464" y1="151" x2="510" y2="151"/><line x1="536" y1="151" x2="584" y2="151"/></g>
    <text x="513" y="158">C</text>
    <text x="588" y="158">{X}</text><text x="594" y="128" font-size="15" fill="#c0392b">δ−</text>
    <line x1="521" y1="136" x2="521" y2="96" stroke="#1d1d22" stroke-width="2.6"/>
    <text x="500" y="90">CH₃</text>
    <path d="M517 162 L 496 198 L 504 201 z" fill="#1d1d22"/><text x="484" y="218">H</text>
    <g stroke="#1d1d22" stroke-width="2.2"><line x1="526" y1="164" x2="531" y2="169"/><line x1="534" y1="175" x2="539" y2="181"/><line x1="542" y1="187" x2="547" y2="193"/></g>
    <text x="536" y="214">C₂H₅</text>
    <path d="M622 70 L 632 70 L 632 238 L 622 238" fill="none" stroke="#1d1d22" stroke-width="2.2"/>
    <text x="638" y="84" font-size="24">‡</text><text x="652" y="76" font-size="16">⊖</text>
    <text x="456" y="270" font-size="14" fill="#555">transition state</text>
    <!-- arrow -->
    <line x1="664" y1="151" x2="712" y2="151" stroke="#222" stroke-width="2.2" marker-end="url(#mbx-ra)"/>
    <!-- product: (R)-butan-2-ol + bromide -->
    <text x="724" y="158">HO</text>
    <line x1="757" y1="151" x2="800" y2="151" stroke="#1d1d22" stroke-width="2.6"/>
    <text x="803" y="158">C</text>
    <line x1="818" y1="138" x2="829" y2="96" stroke="#1d1d22" stroke-width="2.6"/>
    <text x="816" y="90">CH₃</text>
    <path d="M820 160 L 862 182 L 858 190 z" fill="#1d1d22"/><text x="864" y="200">H</text>
    <g stroke="#1d1d22" stroke-width="2.2"><line x1="818" y1="165" x2="822" y2="170"/><line x1="825" y1="176" x2="829" y2="182"/><line x1="831" y1="188" x2="835" y2="194"/><line x1="837" y1="200" x2="841" y2="206"/></g>
    <text x="822" y="230">C₂H₅</text>
    <text x="882" y="158" font-size="20">+ {X}</text><text x="926" y="146" font-size="15">⊖</text>
    <text x="740" y="270" font-size="14" fill="#555">(R)-butan-2-ol</text>
    <!-- rate law -->
    <text x="356" y="292" font-size="16" fill="#1d4f91" font-style="italic">rate = k[R{X}][OH⁻]  (2nd order)</text>
  </g>
  <!-- the figure's own numbered key, as in a textbook figure -->
  <g font-size="13" font-weight="700" text-anchor="middle">
    <g transform="translate(60,112)"><circle r="11" fill="#1d1d22"/><text y="4.5" fill="#fff">1</text></g>
    <g transform="translate(148,72)"><circle r="11" fill="#1d1d22"/><text y="4.5" fill="#fff">2</text></g>
    <g transform="translate(244,182)"><circle r="11" fill="#1d1d22"/><text y="4.5" fill="#fff">3</text></g>
    <g transform="translate(296,100)"><circle r="11" fill="#1d1d22"/><text y="4.5" fill="#fff">4</text></g>
    <g transform="translate(350,176)"><circle r="11" fill="#1d1d22"/><text y="4.5" fill="#fff">5</text></g>
    <g transform="translate(660,232)"><circle r="11" fill="#1d1d22"/><text y="4.5" fill="#fff">6</text></g>
    <g transform="translate(912,232)"><circle r="11" fill="#1d1d22"/><text y="4.5" fill="#fff">7</text></g>
    <g transform="translate(340,287)"><circle r="11" fill="#1d1d22"/><text y="4.5" fill="#fff">8</text></g>
  </g>
  <rect id="mbx-ndimrect" width="960" height="300" fill="#0b0c12" opacity="0" mask="url(#mbx-ndim)" style="transition:opacity .6s"/>
  <g id="mbx-nrings" fill="none" stroke="#ffb000" stroke-width="3" stroke-dasharray="8 5"></g>
</svg>
`;
export const SN2 = {
  id: "sn2",
  title: "The SN2 reaction",
  subject: "Organic chemistry · Nucleophilic substitution",
  // the topic-matcher lives in app.html (mbxTemplateFor); keep the two in step
  halo: HALO,
  figure: (X) => { const h = HALO[X] || HALO.Br; return FIG.split("{X}").join(X).split("{xo}").join(h.xo); },
  regions: { 1: [76, 150, 34, 34], 2: [146, 98, 64, 36], 3: [224, 150, 28, 26], 4: [296, 122, 42, 28], 5: [318, 152, 30, 24],
    6: [521, 154, 122, 92], 7: [826, 160, 112, 82], 8: [470, 287, 128, 15] },
  key: (X) => ["Nucleophile (HO⁻)", "Curly arrow: lone pair attacks C", "δ+ carbon (electrophile)", `Curly arrow: C–${X} bond breaks`, `Leaving group (${X}⁻)`,
    "Transition state ‡", "Product: inverted (R)", `Rate = k[R${X}][OH⁻]`],
  lines: [
    "SN2 = Substitution, Nucleophilic, bimolecular. One step: the new bond forms as the old one breaks.",
    "C–Br is polar: carbon δ+ (the electrophile), bromine δ−.",
    "The nucleophile HO⁻ attacks the δ+ carbon using a lone pair.",
    "Attack is from the back: 180° from the leaving group (backside attack).",
    "Transition state [HO···C···Br]⁻: carbon partly bonded to both, the other 3 groups flat.",
    "The 3 groups flip like an umbrella: inversion of configuration (Walden inversion).",
    "(S)-2-bromobutane → (R)-butan-2-ol.",
    "Rate = k[RBr][OH⁻]: second order, both species in the one step.",
    "Methyl > 1° > 2°. 3° haloalkanes don't do SN2 (steric hindrance) → SN1.",
  ],
  steps: [
    { id: "overview", title: "The whole reaction", line: 0, note: [], overview: true, arrows: [1, 2], play: { from: 0, to: 1, dur: 7, loop: "repeat", hold: 1.4 },
      shot: { t: [-0.6, 0.2, 0], d: 11.5, yaw: 18, pitch: 14, orbit: 3 },
      say: "This is the SN2 mechanism, built as real molecules. On the left, hydroxide. In the middle, 2-bromobutane. Watch one whole reaction: hydroxide comes in from the back, bromide leaves from the front, and the molecule turns inside out. Then we'll slow it down, one number at a time." },
    { id: "polar", title: "3 & 5 · A polar C–X bond", line: 1, note: [3, 5], focus: ["C2", "Br"], charges: true, play: { from: 0, to: 0 },
      shot: { t: [0.9, 0, 0], d: 7.5, yaw: 25, pitch: 12, orbit: 5 },
      say: "Start with the substrate, (S)-2-bromobutane. Number three on the figure is the carbon holding the bromine. Bromine is more electronegative, so it pulls the shared electrons towards itself. That leaves carbon slightly positive, delta plus, and bromine slightly negative. The delta-plus carbon is the electrophile: the target." },
    { id: "nucleophile", title: "1 · The nucleophile", line: 2, note: [1], focus: ["O"], lp: true, play: { from: 0.12, to: 0.12 },
      shot: { t: [-3.6, 0.2, 0], d: 6, yaw: -30, pitch: 14, orbit: 6 },
      say: "Number one is hydroxide, the nucleophile. Oxygen carries three lone pairs, shown in blue, and a full negative charge. That's electron density looking for a positive centre. Nucleophile literally means nucleus-loving." },
    { id: "attack", title: "2 · Backside attack", line: 3, note: [2, 3], focus: ["O", "C2"], lp: true, sigma: true, arrows: [1], play: { from: 0.05, to: 0.4, dur: 6, delay: 1 },
      shot: { t: [-1.3, 0.4, 0], d: 10, yaw: -32, pitch: 24 },
      say: "Curly arrow two: a lone pair on oxygen attacks the carbon. But from where? Always from the back, exactly opposite the bromine. Two reasons. The empty orbital it has to fill, the carbon–bromine sigma-star, has its big lobe right here, behind the carbon. And coming from the back keeps the negative nucleophile away from the electron-rich bromine." },
    { id: "ts", title: "6 · The transition state", line: 4, note: [6], focus: ["O", "C2", "Br"], play: { from: 0.5, to: 0.5, wobble: 0.025 },
      shot: { t: [0.1, 0.2, 0], d: 9, yaw: 8, pitch: 10, orbit: 4 },
      say: "Number six, the transition state, the top of the energy hill. The oxygen–carbon bond is half made and the carbon–bromine bond is half broken, shown as dashed gold lines. Carbon briefly has five groups around it, and the other three lie flat in one plane. The negative charge is shared between oxygen and bromine. It lasts less than a picosecond: a moment, not an intermediate you could ever isolate." },
    { id: "leave", title: "4 & 5 · The leaving group goes", line: 0, note: [4, 5], focus: ["Br"], arrows: [2], play: { from: 0.4, to: 0.9, dur: 5, delay: 0.8 },
      shot: { t: [1.6, 0.2, 0], d: 10, yaw: 30, pitch: 14 },
      say: "Curly arrow four: the electrons of the carbon–bromine bond move onto bromine, and bromide, number five, leaves with them. The new bond forming and the old bond breaking happen in a single step. That's what concerted means." },
    { id: "umbrella", title: "The umbrella flips", line: 5, note: [6, 7], focus: ["Me", "Et", "H2"], play: { from: 0.2, to: 0.85, dur: 4.5, loop: "repeat", hold: 1.2 },
      shot: { t: [0, 0.3, 0], d: 8.5, yaw: 0, pitch: 6 },
      say: "Now watch the other three groups: methyl, ethyl and hydrogen. As hydroxide pushes in and bromide pulls out, they flip to the other side, like an umbrella turning inside out in the wind. This is Walden inversion. Every SN2 at a stereocentre inverts it." },
    { id: "cip", title: "7 · S becomes R", line: 6, note: [7], cip: true, play: { from: 0, to: 1, dur: 4, delay: 3.5 },
      shot: { t: [-0.3, 0.2, 0], d: 11, yaw: -10, pitch: 30 },
      say: "Check the priorities, shown in gold. In the starting material: bromine one, ethyl two, methyl three, hydrogen four. With hydrogen pointing away, one, two, three runs anticlockwise, so it's S. In the product, hydroxyl takes priority one, and the groups have flipped, so one, two, three now runs clockwise: R. Careful in exams: the letter only swaps because the nucleophile takes the same priority rank as the leaving group." },
    { id: "rate", title: "8 · Why it's second order", line: 7, note: [8], arrows: [1, 2], play: { from: 0, to: 1, dur: 6, loop: "repeat", hold: 1 },
      shot: { t: [-0.6, 0.2, 0], d: 12, yaw: -12, pitch: 12, orbit: -3 },
      say: "There is only one step, and both the haloalkane and the hydroxide are in it. So the rate depends on both concentrations: rate equals k, times haloalkane, times hydroxide. Double either one and the rate doubles. That's the two in SN2: bimolecular. Watch the energy profile: one hill, no valley in the middle." },
    { id: "tertiary", title: "Why tertiary can't", line: 8, note: [], mode: "tert", vdw: true, play: { from: 0, to: 1, dur: 4.5, loop: "repeat", hold: 0.4 },
      shot: { t: [-1.6, 0.2, 0], d: 12, yaw: -18, pitch: 12 },
      say: "Now swap in a tertiary haloalkane, with three methyl groups on the carbon. The clouds show how much room each hydrogen really takes up. Watch hydroxide try to reach the back of the carbon: there's no space, so it bounces off. That's steric hindrance. SN2 is fastest for methyl, then primary, then secondary, and essentially never happens at a tertiary carbon. Those react by SN1 instead." },
    { id: "quiz", title: "Check yourself", line: null, note: [7], quiz: true, play: { from: 0, to: 1, dur: 6, loop: "repeat", hold: 1 },
      shot: { t: [-0.6, 0.2, 0], d: 12, yaw: 12, pitch: 14, orbit: 3 },
      say: "Quick check. If you started with (R)-2-bromobutane instead, what would SN2 with hydroxide give you? Decide, then tap to reveal.",
      answer: "(S)-butan-2-ol. SN2 always inverts the stereocentre, and because OH takes the same priority rank the leaving group had, R becomes S." },
  ],
};
