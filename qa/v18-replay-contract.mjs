/* =====================================================================
 * QA — 02.3 REPLAY CONTRACT
 *
 * Proves four things:
 *   1. Each scheduler surface has its OWN namespace, and they move
 *      independently.
 *   2. Changing a ladder changes that surface's fingerprint.
 *   3. EVERY constant that changes scheduler output is fingerprinted —
 *      not merely the ladder. The Q-bank confidence thresholds and
 *      interval sentinels count.
 *   4. THE IMPORTANT ONE: the DECLARED Q-bank parameters agree with what
 *      the REAL qbSchedApply actually does, established by exercising it
 *      at conf = 0,1,2,3 and observing the reset/hold/advance boundary.
 *      MB_QB_PARAMS is descriptive, never authoritative — this test is
 *      what stops the two drifting apart.
 * ===================================================================== */
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const HERE = dirname(fileURLToPath(import.meta.url));
const APP  = readFileSync(join(HERE, '..', 'app.html'), 'utf8');

let pass = 0, fail = 0;
const ok = (name, cond, detail='') => {
  if (cond) { pass++; console.log(`PASS | ${name}${detail ? '  | ' + detail : ''}`); }
  else { fail++; console.log(`FAIL | ${name}${detail ? '  | ' + detail : ''}`); }
};

/* ---- extract the real source, so we test the shipped code ------------- */
function grab(re, what){
  const m = APP.match(re);
  if(!m) throw new Error('could not find ' + what + ' in app.html');
  return m;
}
const LADDER    = JSON.parse(grab(/const LADDER=(\[[\d,]+\])/, 'LADDER')[1]);
const QB_LADDER = JSON.parse(grab(/var QB_LADDER=(\[[\d,]+\])/, 'QB_LADDER')[1]);
const MB_SRS_ALGO = grab(/var MB_SRS_ALGO\s*=\s*'([^']+)'/, 'MB_SRS_ALGO')[1];
const MB_QB_ALGO  = grab(/var MB_QB_ALGO\s*=\s*'([^']+)'/, 'MB_QB_ALGO')[1];
const MB_QB_PARAMS = (() => {
  const src = grab(/var MB_QB_PARAMS\s*=\s*\{([^}]+)\}/, 'MB_QB_PARAMS')[1];
  const o = {};
  src.split(',').forEach(kv => { const [k,v] = kv.split(':').map(x=>x.trim()); if(k) o[k] = Number(v); });
  return o;
})();

/* ---- the version builders, mirroring app.html exactly ----------------- */
const fp = a => a.join('.');
const verCard  = (ladder=LADDER)              => `${MB_SRS_ALGO}@${fp(ladder)}`;
const verQbank = (ladder=QB_LADDER, p=MB_QB_PARAMS) =>
  `${MB_QB_ALGO}@${fp(ladder)}~${fp([p.confHi,p.confLo,p.resetInterval,p.graduate])}`;

console.log('--- shape ---');
ok('T1  flashcard version is algorithm@fingerprint', verCard() === 'srs-box-v1@1.3.7.7.7.14.14', verCard());
ok('T2  qbank version carries ladder AND params',    verQbank() === 'qb-retention-v1@1.3.7.14~2.1.1.99', verQbank());
ok('T3  surfaces occupy different namespaces',       MB_SRS_ALGO !== MB_QB_ALGO, `${MB_SRS_ALGO} vs ${MB_QB_ALGO}`);
ok('T4  neither version resembles an app/build version',
   !/^\d+\.\d+\.\d+$/.test(verCard()) && !/^v?\d+$/.test(verQbank()));

console.log('\n--- ladder changes move the fingerprint, independently ---');
const cardBefore = verCard(), qbBefore = verQbank();
const cardAfter  = verCard([1,3,7,7,7,14,21]);          // flashcard ladder edited
ok('T5  changing LADDER changes the flashcard version', cardAfter !== cardBefore, `${cardBefore} -> ${cardAfter}`);
ok('T6  ...and does NOT change the qbank version',      verQbank() === qbBefore);

const qbAfter = verQbank([1,3,7,21]);                    // qbank ladder edited
ok('T7  changing QB_LADDER changes the qbank version',  qbAfter !== qbBefore, `${qbBefore} -> ${qbAfter}`);
ok('T8  ...and does NOT change the flashcard version',  verCard() === cardBefore);

console.log('\n--- EVERY output-changing constant is fingerprinted, not just the ladder ---');
for (const [k, alt] of [['confHi',3],['confLo',0],['resetInterval',2],['graduate',30]]) {
  const p = { ...MB_QB_PARAMS, [k]: alt };
  ok(`T9.${k}  changing ${k} changes the version`, verQbank(QB_LADDER, p) !== qbBefore,
     `${qbBefore} -> ${verQbank(QB_LADDER, p)}`);
}

/* =====================================================================
 * T10 — THE CONTRACT TEST
 * MB_QB_PARAMS claims the confidence boundary. qbSchedApply is the only
 * authority on it. Load the REAL function out of app.html and run it.
 * ===================================================================== */
console.log('\n--- declared parameters vs the real qbSchedApply ---');

const fnSrc = grab(/function qbSchedApply\(qh, ok, conf\)\{[\s\S]*?\n\}catch\(err\)\{\} \}/, 'qbSchedApply')[0];

// Minimal host: only what qbSchedApply touches. Nothing is stubbed that could
// change its decisions — the ladder and the literals come from the real source.
function runScheduler(conf, correct, seed){
  const store = { _sched: {}, _qmeta: {} };
  if (seed) store._sched['q:QH'] = { ...seed };
  const host = {
    QB_LADDER,
    qbStore:  () => store,
    qbSched:  () => store._sched,
    qbTargetOf: () => null,
    qbRetentionKey: qh => 'q:' + qh,
    qbLadderNext: iv => { for (let i=0;i<QB_LADDER.length;i++) if (QB_LADDER[i] > iv) return QB_LADDER[i]; return 99; },
    qbUniq: a => [...new Set((a||[]).filter(x=>x!=null))],
    dayNum: () => 1000,
    persist: () => {}
  };
  const factory = new Function(...Object.keys(host), `${fnSrc}; return qbSchedApply;`);
  factory(...Object.values(host))('QH', correct, conf);
  return store._sched['q:QH'];
}

// A schedule that already exists at interval 3, last moved on an earlier day,
// so the ladder is free to move once today.
const seed = { key:'q:QH', n:1, streak:1, interval:3, dueAt:1000, firstAt:990, servedQhs:['QH'], _day:999 };

const observed = {};
for (const conf of [0,1,2,3]) {
  const r = runScheduler(conf, true, seed);           // CORRECT answers isolate hold-vs-advance
  observed[conf] = r ? (r.interval === seed.interval ? 'hold' : 'advance') : 'graduated';
}
console.log('     observed on correct answers:', JSON.stringify(observed));

const declaredLo = MB_QB_PARAMS.confLo, declaredHi = MB_QB_PARAMS.confHi;
const holdConfs    = [0,1,2,3].filter(c => observed[c] === 'hold');
const advanceConfs = [0,1,2,3].filter(c => observed[c] === 'advance');

ok('T10a declared confLo matches the observed hold boundary',
   holdConfs.length > 0 && Math.max(...holdConfs) === declaredLo,
   `declared confLo=${declaredLo}, observed hold at conf ${JSON.stringify(holdConfs)}`);
ok('T10b declared confHi matches the observed advance boundary',
   advanceConfs.length > 0 && Math.min(...advanceConfs) === declaredHi,
   `declared confHi=${declaredHi}, observed advance at conf ${JSON.stringify(advanceConfs)}`);

// wrong answer must reset to the declared interval, whatever the confidence
const reset = runScheduler(3, false, seed);
ok('T10c declared resetInterval matches a real failure',
   reset && reset.interval === MB_QB_PARAMS.resetInterval,
   `declared=${MB_QB_PARAMS.resetInterval}, observed=${reset && reset.interval}`);
ok('T10d confident-wrong is flagged as a misconception', !!(reset && reset.miscon));

// past the top of the ladder, the real function graduates by deleting the row
const top = runScheduler(3, true, { ...seed, interval: QB_LADDER[QB_LADDER.length-1], _day:999 });
ok('T10e declared graduate sentinel matches real graduation',
   top === undefined && MB_QB_PARAMS.graduate === 99,
   `row deleted=${top === undefined}, declared sentinel=${MB_QB_PARAMS.graduate}`);

console.log('\n--- the fingerprint CANNOT see logic changes (why the prefix is hand-bumped) ---');
const logicChanged = fnSrc.replace("e.streak=0; e.interval=1;", "e.streak=0; e.interval=2;");
ok('T11  a control-flow edit leaves the fingerprint identical',
   logicChanged !== fnSrc && verQbank() === qbBefore,
   'so the semantic prefix is the ONLY guard against logic drift — bump it by hand');

console.log(`\n${pass} passed, ${fail} failed`);
process.exit(fail ? 1 : 0);
