/* QA — 02.3 writer contract: which events must carry replay metadata. */
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
const HERE = dirname(fileURLToPath(import.meta.url));
const SRC  = readFileSync(join(HERE, '..', 'learning-events.js'), 'utf8');

let pass=0, fail=0;
const ok=(n,c,d='')=>{ if(c){pass++;console.log(`PASS | ${n}${d?'  | '+d:''}`);} else {fail++;console.log(`FAIL | ${n}${d?'  | '+d:''}`);} };

/* minimal browser host */
function load(){
  const store = new Map();
  const win = {
    MEDBANK_CONFIG:{ FEATURES:{ LEARNING_EVENTS:true } },
    dayNum: () => 20706,
    addEventListener(){}, setTimeout:()=>0, clearTimeout(){},
  };
  const g = {
    window: win,
    localStorage:{ getItem:k=>store.has(k)?store.get(k):null, setItem:(k,v)=>store.set(k,String(v)), removeItem:k=>store.delete(k) },
    document: undefined, navigator:{ onLine:false }, crypto,
    setTimeout:()=>0, clearTimeout:()=>{}, setInterval:()=>0,
  };
  new Function(...Object.keys(g), SRC)(...Object.values(g));
  return { E: win.MB_EVENTS, q: () => JSON.parse(store.get('mb_le_queue')||'[]'), s: () => JSON.parse(store.get('mb_le_stats')||'{}') };
}

console.log('--- scheduler events REQUIRE the contract ---');
{
  const { E, q } = load();
  const r = E.emit({ event_type:'card_reviewed', surface:'flashcard', object_id:'cid-1', correct:true,
                     scheduler_version:'srs-box-v1@1.3.7.7.7.14.14' });
  const row = q()[0];
  ok('T1  accepted with a version', r === true);
  ok('T2  scheduler_version persisted verbatim', row.scheduler_version === 'srs-box-v1@1.3.7.7.7.14.14', row.scheduler_version);
  ok('T3  local_day taken from the app dayNum()', row.local_day === 20706, String(row.local_day));
  ok('T4  tz_offset is a number', typeof row.tz_offset === 'number', String(row.tz_offset));
}
{
  const { E, q, s } = load();
  const r = E.emit({ event_type:'card_reviewed', surface:'flashcard', object_id:'cid-2', correct:true });
  ok('T5  REFUSED when scheduler_version is missing', r === false);
  ok('T6  ...and nothing was queued', q().length === 0);
  ok('T7  ...and the refusal is counted', s().refused === 1, JSON.stringify(s()));
}
{
  const { E, q } = load();
  E.emit({ event_type:'question_answered', surface:'qbank', object_id:'qh-1', correct:false, confidence:3,
           scheduler_version:'qb-retention-v1@1.3.7.14~2.1.1.99' });
  const row = q()[0];
  ok('T8  qbank event carries its own algorithm namespace',
     row.scheduler_version.startsWith('qb-retention-v1@'), row.scheduler_version);
  ok('T9  qbank event also carries temporal context',
     row.local_day === 20706 && typeof row.tz_offset === 'number');
}

console.log('\n--- non-scheduler events must NOT acquire a meaningless version ---');
{
  const { E, q } = load();
  const r = E.emit({ event_type:'note_read', surface:'note', object_id:'t-1' });
  const row = q()[0];
  ok('T10 accepted without a version', r === true);
  ok('T11 scheduler_version stays null', row.scheduler_version === null);
  ok('T12 local_day stays null',        row.local_day === null);
  ok('T13 tz_offset stays null',        row.tz_offset === null);
}
{
  const { E, q } = load();
  E.emit({ event_type:'note_read', surface:'note', object_id:'t-2', scheduler_version:'srs-box-v1@1.3' });
  ok('T14 a version offered to a non-scheduler event is IGNORED, not stored',
     q()[0].scheduler_version === null);
}

console.log('\n--- the client still never states who it is ---');
{
  const { E, q } = load();
  E.emit({ event_type:'card_reviewed', surface:'flashcard', object_id:'c', correct:true, scheduler_version:'srs-box-v1@1' });
  ok('T15 account_id absent from the payload', !('account_id' in q()[0]));
}

console.log(`\n${pass} passed, ${fail} failed`);
process.exit(fail?1:0);
