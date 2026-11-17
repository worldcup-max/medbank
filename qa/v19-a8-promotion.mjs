/* Phase D — A8 Retest Pool → canonical promotion gate. Run: node qa/v19-a8-promotion.mjs */
import { a8PromotionGate, promotionRecord, A8_CFG } from '../import-server/a8.mjs';
import { readFileSync } from 'node:fs';
let pass=0, fail=0; const ok=(c,m)=>{ if(c) pass++; else { fail++; console.log('  ✗ '+m); } };
const good=()=>({ id:'r1', target_id:'HF-MGMT-001', qh:'abc', status:'served', served_count:4,
  validation:{ passed:true, reconciled_to:'HF-MGMT-001', confidence:0.95 }, content:{ stem:'A 70-year-old with heart failure and AKI on furosemide' } });
const ev=()=>({ attempts:10, correct:6, flags:0, canonicalStems:['Totally different stem about asthma inhaler technique'] });

ok(a8PromotionGate(good(), ev()).eligible===true, 'P0 a clean served, validated, well-attempted item is eligible');
// P1 target preserved
{ const g=a8PromotionGate(good(), ev()); const rec=promotionRecord(good(), g, 'frank');
  ok(rec.promotion.target_id==='HF-MGMT-001' && g.target_id==='HF-MGMT-001', 'P1 target_id preserved in gate + record'); }
// P2 validation
{ const r=good(); r.validation.passed=false; ok(!a8PromotionGate(r,ev()).eligible, 'P2 failed A7 validation → not eligible'); }
{ const r=good(); r.validation.reconciled_to='OTHER-001'; ok(!a8PromotionGate(r,ev()).eligible, 'P2 validated to another target → not eligible'); }
{ const r=good(); r.validation.confidence=0.86; ok(!a8PromotionGate(r,ev()).eligible, 'P2 confidence below '+A8_CFG.MATCH_FLOOR+' → not eligible'); }
// P3 evidence
{ const r=good(); r.served_count=2; ok(!a8PromotionGate(r,ev()).eligible, 'P3 served < MIN_SERVES'); }
{ const e=ev(); e.attempts=4; e.correct=2; const g=a8PromotionGate(good(),e); ok(!g.eligible && /not enough evidence/.test(g.reasons.join()), 'P3 attempts < MIN_ATTEMPTS'); }
{ const e=ev(); e.correct=10; ok(!a8PromotionGate(good(),e).eligible, 'P3 100% accuracy (too easy) → held'); }
{ const e=ev(); e.correct=1; ok(!a8PromotionGate(good(),e).eligible, 'P3 10% accuracy (likely broken) → held'); }
{ const e={ attempts:0, correct:0 }; ok(!a8PromotionGate(good(),e).eligible, 'P3 no evidence at all (LEARNING_EVENTS off) → never eligible'); }
// P4 status
for(const st of ['candidate','invalid','quarantined','expired']){ const r=good(); r.status=st; ok(!a8PromotionGate(r,ev()).eligible, 'P4 status '+st+' never eligible'); }
{ const e=ev(); e.flags=1; ok(!a8PromotionGate(good(),e).eligible, 'P4 student-flagged → held'); }
// P5 duplicate of canonical
{ const e=ev(); e.canonicalStems=['A 70-year-old with heart failure and AKI on furosemide']; ok(!a8PromotionGate(good(),e).eligible, 'P5 near-duplicate of canonical → not eligible'); }
// already promoted
{ const r=good(); r.promoted_at='2026-11-17'; ok(!a8PromotionGate(r,ev()).eligible, 'already promoted → not eligible again'); }
// human required, eligibility required
{ let threw=false; try{ promotionRecord(good(), a8PromotionGate(good(),ev()), ''); }catch(e){ threw=true; } ok(threw, 'H1 no reviewer → throws'); }
{ let threw=false; const r=good(); r.served_count=0; try{ promotionRecord(r, a8PromotionGate(r,ev()), 'frank'); }catch(e){ threw=true; } ok(threw, 'H2 ineligible → throws'); }
// P6 A7 status untouched: record never sets status; server route never updates status
{ const rec=promotionRecord(good(), a8PromotionGate(good(),ev()), 'frank'); ok(!('status' in rec), 'P6 promotion record does not touch status');
  const srv=readFileSync('import-server/server.mjs','utf8'); const r=srv.slice(srv.indexOf('app.post("/admin/a8/promote"')); const body=r.slice(0, r.indexOf('\n});')+4);
  ok(/requireAdmin/.test(body) && !/status:/.test(body.replace(/res\.status/g,'')), 'P6 promote route is admin-only and never writes status');
  ok(!/a8|promot/i.test(readFileSync('import-server/retestpool.mjs','utf8')), 'P6 frozen A7 core (retestpool.mjs) untouched by A8'); }
console.log('\n'+pass+' passed, '+fail+' failed'); process.exit(fail?1:0);
