-- ============================================================================
-- MedBank — 02.3 REPLAY CONTRACT  (additive DDL only)
-- Run in Supabase -> SQL Editor. Safe to re-run.
--
-- WHY THIS EXISTS
--   learning_events has no UPDATE and no DELETE policy — that absence is what
--   makes it a ledger. The consequence is that anything NOT captured at insert
--   time is unrecoverable forever. Three facts fall in that category:
--
--     local_day          the CLIENT's own day index (dayNum()). Both schedulers
--                        gate on the local calendar day — qbSchedApply advances
--                        the ladder at most once per attempt-day — and a UTC
--                        instant alone cannot recover it.
--     tz_offset          minutes from getTimezoneOffset(), so local_day is
--                        interpretable rather than an opaque integer.
--     scheduler_version  WHICH ALGORITHM produced this event. Two parts:
--                        prefix = hand-bumped semantic algorithm version,
--                        suffix = fingerprint of every constant that changes
--                        scheduler output. e.g.
--                            srs-box-v1@1.3.7.7.7.14.14
--                            qb-retention-v1@1.3.7.14~2.1.1.99
--                        An app/build version must NEVER be used here.
--
-- NULLABILITY IS DELIBERATE
--   The 14 rows written before 02.3 are Build-01 verification artifacts. They
--   are genuinely not replay-safe and are left NULL to preserve historical
--   truth. They must NOT be retrofitted with invented values. The contract is
--   therefore nullable at the database layer and MANDATORY at the application
--   layer (learning-events.js refuses a scheduler event without a version).
--
--   A non-scheduler event (note_read) legitimately has all three NULL — it has
--   no scheduler, and stamping one would be meaningless provenance.
--
-- IMMUTABILITY IS UNTOUCHED
--   ADD COLUMN is DDL, not a row update. No policy is added, altered or
--   dropped here. No row is written.
-- ============================================================================

alter table public.learning_events add column if not exists local_day         integer;
alter table public.learning_events add column if not exists tz_offset         smallint;
alter table public.learning_events add column if not exists scheduler_version text;

comment on column public.learning_events.local_day is
  'Client dayNum() at emit — the local calendar day the scheduler itself gated on. NULL for pre-02.3 rows and for non-scheduler events.';
comment on column public.learning_events.tz_offset is
  'Date.getTimezoneOffset() in minutes at emit, so local_day is interpretable. NULL for pre-02.3 rows and for non-scheduler events.';
comment on column public.learning_events.scheduler_version is
  'algorithm@constant-fingerprint identifying the exact scheduler that produced this event. NEVER an app/build version. NULL for pre-02.3 rows and for non-scheduler events.';

-- replay queries scan by algorithm; only scheduler events carry one
create index if not exists learning_events_sched_ver_idx
  on public.learning_events (scheduler_version, occurred_at desc)
  where scheduler_version is not null;

-- ---------------------------------------------------------------------------
-- Verification
-- ---------------------------------------------------------------------------
-- 1) the temporal boundary: pre-02.3 rows NULL, post-02.3 scheduler rows filled
--    select case when scheduler_version is null then 'pre-02.3 / non-scheduler'
--                else scheduler_version end as contract,
--           count(*), count(local_day) as with_day, count(tz_offset) as with_tz
--      from learning_events group by 1 order by 2 desc;
--
-- 2) contract violation — a scheduler event missing any field (must be 0 rows
--    for anything inserted after the 02.3 deploy)
--    select event_id, event_type, occurred_at from learning_events
--     where event_type in ('question_answered','card_reviewed')
--       and received_at > '2026-09-10'
--       and (local_day is null or tz_offset is null or scheduler_version is null);
--
-- 3) non-scheduler events must NOT have acquired a version
--    select event_type, count(*) from learning_events
--     where scheduler_version is not null
--       and event_type not in ('question_answered','card_reviewed') group by 1;
