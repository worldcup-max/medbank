-- ============================================================================
-- 01.5a — STABLE QUESTION IDENTITY (qid)
-- Run in Supabase → SQL Editor. Additive and safe to re-run.
--
--   qid = identity of the QUESTION         (immutable, minted once, never recomputed)
--   qh  = identity of this CONTENT VERSION  (hash of stem+options; changes on edit)
--
-- Why: qh is a content hash and was never stored on the question, so editing a stem
-- silently re-keyed it and abandoned its target mapping (57 such orphans across 5
-- topics, plus 43 from deleted topics — those 100 stay orphaned; qid stops NEW ones).
--
-- WHAT THIS DOES NOT DO: it creates, deletes, merges or reinterprets NO target
-- mapping. qh remains the primary key for compatibility. Nothing about A6 stamping
-- policy, scheduling, or target definitions changes.
-- ============================================================================

alter table public.question_targets add column if not exists qid uuid;

create index if not exists question_targets_qid_idx on public.question_targets (qid) where qid is not null;

comment on column public.question_targets.qid is
  '01.5a: stable question identity, minted once into topics.extras.qbank[].qid. Survives content edits. Prefer this over qh when relating a question to its target; qh remains the PK for compatibility and now means "this content version".';
comment on column public.question_targets.qh is
  '01.5a: content-version hash of stem+options. Changes whenever the question is edited. Still the primary key; no longer the conceptual identity.';

-- Verification (run after the backfill):
--   select count(*) total, count(qid) with_qid, count(*)-count(qid) without_qid from question_targets;
--   select count(*) from (select qid from question_targets where qid is not null group by 1 having count(*)>1) d;  -- expect 0
