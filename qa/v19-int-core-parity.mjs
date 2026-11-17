/* Integrated Mode without the import server — parity tests.
 *  1. app.html carries a GENERATED copy of the pure serve core (integrated-serve.mjs + readinessGate). This test
 *     regenerates it and fails if the copy in app.html differs by a single byte (drift guard).
 *     `node qa/v19-int-core-parity.mjs --write` refreshes the copy after the module changes.
 *  2. The copy behaves exactly like the modules on random banks.
 *  3. If MB_PG is set (a psql connection, e.g. "-h /var/tmp/mbpg -p 55432 -U postgres") the database gate
 *     mb_int_gate() is checked against readinessGate() on random banks, and mb_int_bank/log/admin are exercised.
 */
import { readFileSync, writeFileSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
import * as SERVE from '../import-server/integrated-serve.mjs';
import { readinessGate } from '../import-server/integrated.mjs';

const ROOT = new URL('..', import.meta.url).pathname;
const BEGIN = '/* INT-CORE-BEGIN';
const END = '/* INT-CORE-END */';

export function generateCore(){
  const serve = readFileSync(ROOT+'import-server/integrated-serve.mjs','utf8').replace(/^export /gm,'');
  const integ = readFileSync(ROOT+'import-server/integrated.mjs','utf8');
  const a = integ.indexOf('export const READINESS'), b = integ.indexOf('\n}\n', integ.indexOf('export function readinessGate'));
  if(a<0 || b<0) throw new Error('readinessGate not found in integrated.mjs');
  const gate = integ.slice(a, b+3).replace(/^export /gm,'');
  return BEGIN+' — GENERATED from import-server/integrated-serve.mjs + readinessGate (integrated.mjs). Do not edit by hand:\n'
    +'   run `node qa/v19-int-core-parity.mjs --write`. Lets Integrated/Case Mode run from Supabase without the import server. */\n'
    +'window.MBIC=(function(){\n'+gate+serve
    +'return { READINESS, readinessGate, toServable, selectIntegrated, CASE_CFG, caseLeakage, assembleCases, caseScore };\n})();\n'+END;
}

let pass=0, fail=0;
function ok(c, m){ if(c){ pass++; } else { fail++; console.log('  ✗ '+m); } }
const same=(x,y)=>JSON.stringify(x)===JSON.stringify(y);

const html = readFileSync(ROOT+'app.html','utf8');
const i0 = html.indexOf(BEGIN), i1 = html.indexOf(END);
const core = generateCore();
if(process.argv.includes('--write')){
  if(i0<0 || i1<0) throw new Error('INT-CORE markers not found in app.html');
  writeFileSync(ROOT+'app.html', html.slice(0,i0)+core+html.slice(i1+END.length));
  console.log('app.html INT-CORE refreshed'); process.exit(0);
}

// 1 — drift guard
ok(i0>0 && i1>i0, 'P1 INT-CORE markers present in app.html');
ok(i0>0 && html.slice(i0, i1+END.length)===core, 'P2 app.html INT-CORE copy is identical to the modules (run with --write)');

// 2 — behaviour parity of the inline copy
const win = {}; new Function('window', core)(win); const C = win.MBIC;
ok(C && typeof C.readinessGate==='function' && typeof C.assembleCases==='function', 'P3 inline core loads');
let s=12345; const rnd=()=>{ s=(s*1103515245+12345)&0x7fffffff; return s/0x7fffffff; };
const FAMS=['cardio_renal','cardio_endocrine','endocrine_renal','resp_cardiac','neuro_endocrine','pregnancy_cardio','gi_hepatic','hepatic_pharm','infect_immunology','onco_haem'];
function bank(){ const rows=[]; const nf=1+Math.floor(rnd()*10); FAMS.slice(0,nf).forEach(f=>{ const n=Math.floor(rnd()*16); for(let k=0;k<n;k++) rows.push({ integration_family:f }); }); return rows; }
let gateSame=true; for(let t=0;t<400;t++){ const b=bank(); if(!same(C.readinessGate(b), readinessGate(b))) gateSame=false; }
ok(gateSame, 'P4 inline readinessGate == module on 400 random banks');
function row(id, fam, extra){ return Object.assign({ id, review_status:'approved', integration_family:fam, target_id:'t-'+id,
  transformed_content:{ stem:'Stem '+id, options:['Alpha option '+id,'Bravo option '+id,'Charlie option '+id,'Delta option '+id], answer:id.length%4, rationales:['a','b','c','d'] } }, extra||{}); }
const rows=[]; for(let k=0;k<60;k++) rows.push(row('q'+k, FAMS[k%7]));
const items=rows.map(C.toServable);
ok(same(items, rows.map(SERVE.toServable)), 'P5 inline toServable == module');
ok(same(C.selectIntegrated(items,{count:25,seed:'x'}), SERVE.selectIntegrated(items,{count:25,seed:'x'})), 'P6 inline selectIntegrated == module');
const caseRows=[row('c1','cardio_renal',{case_id:'k1',case_stage:1}), row('c2','cardio_renal',{case_id:'k1',case_stage:2}), row('d1','gi_hepatic',{case_id:'k2',case_stage:2})];
ok(same(C.assembleCases(caseRows), SERVE.assembleCases(caseRows)), 'P7 inline assembleCases == module');

// 3 — database gate parity + RPCs (only when a Postgres with the SQL loaded is available)
if(process.env.MB_PG){
  const args=process.env.MB_PG.split(/\s+/).filter(Boolean);
  const q=(sql, sub)=>execFileSync('psql',[...args,'-X','-q','-t','-A','-v','ON_ERROR_STOP=1','-c', (sub?"set request.jwt.sub='"+sub+"';":'')+sql],{encoding:'utf8'}).trim().split('\n').pop();
  const ADMIN='00000000-0000-0000-0000-00000000000a', USER='00000000-0000-0000-0000-00000000000b';
  q("truncate integrated_items; truncate integrated_serve_log; delete from accounts; insert into accounts values ('"+ADMIN+"',true),('"+USER+"',false);");
  let dbSame=true;
  for(let t=0;t<40;t++){
    const b=bank(); const vals=b.map(r=>"('approved','"+r.integration_family+"')").concat(["('ai_reviewed','cardio_renal')"]);
    q("truncate integrated_items; insert into integrated_items(review_status,integration_family) values "+vals.join(',')+";");
    const db=JSON.parse(q('select mb_int_gate()::text;')); const js=readinessGate(b);
    const norm=g=>({ ready:g.ready, total:g.total, families:g.families, byFamily:Object.fromEntries(Object.entries(g.byFamily).sort()), checks:Object.fromEntries(Object.entries(g.checks).sort()),
      blockers:g.blockers, deficits:Object.fromEntries(Object.entries(g.deficits).sort()), share:Number(g.biggest_family_share),
      pairs:[...g.analytics_ready_families].sort() });
    if(!same(norm(db), norm(js))){ dbSame=false; console.log('    db', JSON.stringify(norm(db)), '\n    js', JSON.stringify(norm(js))); break; }
  }
  ok(dbSame, 'D1 mb_int_gate() == readinessGate() on 40 random banks');
  // a ready bank: 10 families x 10
  const vals=[]; FAMS.forEach((f,fi)=>{ for(let k=0;k<10;k++) vals.push("('approved','"+f+"','{\"stem\":\"S"+fi+"-"+k+"\",\"options\":[\"a\",\"b\"],\"answer\":0}')"); });
  q("truncate integrated_items; insert into integrated_items(review_status,integration_family,transformed_content) values "+vals.join(',')+",('ai_reviewed','onco_haem','{}');");
  let denied=false; try{ q('select mb_int_bank()::text;'); }catch(e){ denied=true; }
  ok(denied, 'D2 mb_int_bank() refuses a caller who is not signed in');
  const bk=JSON.parse(q('select mb_int_bank()::text;', USER));
  ok(bk.gate.ready===true && bk.rows.length===100 && bk.rows.every(r=>r.review_status==='approved'), 'D3 ready bank returns exactly the 100 approved rows');
  q("delete from integrated_items where id in (select id from integrated_items where review_status='approved' limit 1);");
  const locked=JSON.parse(q('select mb_int_bank()::text;', USER));
  ok(locked.gate.ready===false && locked.rows.length===0, 'D4 at 99 approved the bank is locked and returns no rows (fail closed)');
  ok(q("select mb_int_log('{\"kind\":\"integrated\",\"requested\":20,\"delivered\":18,\"shortfall\":2}'::jsonb);", USER)==='t'
     && q("select count(*) from integrated_serve_log where account_id='"+USER+"' and shortfall=2;")==='1', 'D5 mb_int_log stores one row for the caller');
  let notAdmin=false; try{ q("select mb_int_admin('readiness');", USER); }catch(e){ notAdmin=true; }
  ok(notAdmin, 'D6 mb_int_admin refuses non-admins');
  const rd=JSON.parse(q("select mb_int_admin('readiness')::text;", ADMIN));
  ok(rd.by_status.approved===99 && rd.by_status.ai_reviewed===1 && rd.readiness.ready===false, 'D7 admin readiness counts by status');
  const ids=q("select string_agg(id::text, ',' order by id) from (select id from integrated_items where review_status='approved' order by id limit 3) x;").split(',');
  const sc=JSON.parse(q("select mb_int_admin('set_case', '{\"ids\":[\""+ids.join('","')+"\"],\"title\":\"T\",\"case_id\":\"k9\"}')::text;", ADMIN));
  ok(sc.ok && sc.stages===3 && q("select string_agg(case_stage::text, ',' order by case_stage) from integrated_items where case_id='k9';")==='1,2,3', 'D8 set_case writes stages 1..3 in the given order');
  const pend=q("select id from integrated_items where review_status<>'approved' limit 1;");
  let rej=false; try{ q("select mb_int_admin('set_case', '{\"ids\":[\""+ids[0]+"\",\""+pend+"\"]}');", ADMIN); }catch(e){ rej=true; }
  ok(rej, 'D9 set_case refuses an unapproved stage');
  let busy=false; try{ q("select mb_int_admin('set_case', '{\"ids\":[\""+ids[0]+"\",\""+ids[1]+"\"],\"case_id\":\"other\"}');", ADMIN); }catch(e){ busy=true; }
  ok(busy, 'D10 set_case refuses items that belong to another case');
  JSON.parse(q("select mb_int_admin('dissolve','{\"case_id\":\"k9\"}')::text;", ADMIN));
  ok(q("select count(*) from integrated_items where case_id is not null;")==='0', 'D11 dissolve clears only the case metadata');
  const ex=JSON.parse(q("select mb_int_admin('export','{\"status\":[\"approved\"]}')::text;", ADMIN));
  ok(ex.count===99 && ex.items.every(r=>r.review_status==='approved'), 'D12 export returns the requested statuses');
} else {
  console.log('  (MB_PG not set — database checks D1–D12 skipped)');
}

console.log((fail?'FAIL':'PASS')+' v19-int-core-parity: '+pass+' passed, '+fail+' failed');
process.exit(fail?1:0);
