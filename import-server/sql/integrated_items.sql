-- ============================================================================
-- V1.7 Integrated Content Pipeline — second content layer. AI proposes candidates; a human approves.
-- NEVER mutates the canonical question (topics.extras.qbank) — transformation stores a NEW row here with
-- source_question_ids[] provenance. Only review_status='approved' items are ever exposed / seen by A6.
-- ============================================================================
create table if not exists public.integrated_items (
  id                   uuid primary key default gen_random_uuid(),
  question_id          text,                              -- the source question's qh/id (provenance)
  primary_topic        text,
  target_id            text,                              -- primary Target (A6 identity) — set at approval
  integrated_topics    jsonb not null default '[]'::jsonb,-- analytics axis only, never a scheduling key
  integration_type     text,                              -- taxonomy tier: mechanistic|diagnostic|management|competing|longitudinal
  integration_family   text,                              -- e.g. cardio_renal
  integration_rationale text,
  integration_dependency text,                            -- WHY the secondary domain is necessary
  transformed_content  jsonb,                             -- new question content, if transformed (original untouched)
  source_question_ids  jsonb not null default '[]'::jsonb,
  dependency_evidence  jsonb,                             -- the adversarial reviewer's structured verdict
  review_status        text not null default 'candidate', -- candidate|ai_reviewed|pending|approved|rejected|needs_edit
  qa                   jsonb,                             -- QA score at human approval
  reviewer             text,
  reviewed_at          timestamptz,
  model                text,
  created_at           timestamptz not null default now()
);
create index if not exists integrated_items_status_idx on public.integrated_items (review_status);
create index if not exists integrated_items_family_idx on public.integrated_items (integration_family);
create index if not exists integrated_items_qid_idx on public.integrated_items (question_id);
