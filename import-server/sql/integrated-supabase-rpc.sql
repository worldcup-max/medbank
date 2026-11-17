-- ============================================================================
-- Integrated Mode + Case Mode WITHOUT the import server (Render).
-- Additive and safe to run more than once. Creates 4 functions only; no table, column or row is changed.
-- Run in the Supabase SQL editor. The app then reads the integrated bank straight from Supabase.
--
--  mb_int_gate()            the readiness gate, computed in the database (same rules as integrated.mjs readinessGate:
--                           ≥100 approved, ≥8 families, every family ≥10 and ≥3, top family ≤30%). Fails closed.
--  mb_int_bank()            signed-in users: the gate, plus the approved rows ONLY when the gate is ready.
--  mb_int_log(p)            signed-in users: one requested-vs-delivered row into integrated_serve_log.
--  mb_int_admin(action, p)  accounts.is_admin only: export, readiness, set_case, dissolve.
--
-- integrated_items keeps RLS on with no policies, so the table itself stays closed to the browser. These
-- functions run as their owner (security definer) and decide exactly what leaves the database.
-- ============================================================================

create or replace function public.mb_int_gate()
returns jsonb language plpgsql stable security definer set search_path = public as $$
declare
  min_approved int := 100; min_families int := 8; min_per_family int := 10; min_pair int := 3; max_share numeric := 0.30;
  by_family jsonb; deficits jsonb; total int; nf int; n_full int; n_pair int; biggest int; share numeric;
  c_total bool; c_fams bool; c_full bool; c_pair bool; c_dom bool; blockers jsonb := '[]'::jsonb; ready_pairs jsonb;
begin
  with fam as (select coalesce(integration_family,'?') f, count(*)::int n from integrated_items where review_status='approved' group by 1)
  select coalesce(jsonb_object_agg(f,n),'{}'::jsonb), coalesce(sum(n),0)::int, count(*)::int,
         (count(*) filter (where n>=min_per_family))::int, (count(*) filter (where n>=min_pair))::int, coalesce(max(n),0)::int,
         coalesce(jsonb_object_agg(f, greatest(0, min_per_family-n)),'{}'::jsonb),
         coalesce(jsonb_agg(f) filter (where n>=min_pair),'[]'::jsonb)
    into by_family, total, nf, n_full, n_pair, biggest, deficits, ready_pairs from fam;
  share := case when total>0 then biggest::numeric/total else 0 end;
  c_total := total>=min_approved;
  c_fams  := nf>=min_families;
  c_full  := c_fams and nf>0 and n_full=nf;
  c_pair  := c_fams and nf>0 and n_pair=nf;
  c_dom   := total>0 and share<=max_share;
  if not c_total then blockers := blockers || to_jsonb(total||' / '||min_approved||' approved'); end if;
  if not c_fams  then blockers := blockers || to_jsonb(nf||' / '||min_families||' families present'); end if;
  if not c_pair  then blockers := blockers || to_jsonb((nf-n_pair)||' pair(s) below '||min_pair); end if;
  if not c_full  then blockers := blockers || to_jsonb((nf-n_full)||' family(ies) below '||min_per_family); end if;
  if not c_dom   then blockers := blockers || to_jsonb('top family '||round(share*100)||'% > '||round(max_share*100)||'%'); end if;
  return jsonb_build_object(
    'ready', total>0 and c_total and c_fams and c_full and c_pair and c_dom,
    'total', total, 'families', nf, 'byFamily', by_family, 'biggest_family_share', round(share,2),
    'checks', jsonb_build_object('enough_total',c_total,'enough_families',c_fams,'every_family_full',c_full,'every_pair_ready',c_pair,'no_family_dominates',c_dom),
    'analytics_ready_families', ready_pairs, 'blockers', blockers, 'deficits', deficits,
    'gate', jsonb_build_object('minApproved',min_approved,'minFamilies',min_families,'minPerFamily',min_per_family,'maxFamilyShare',max_share,'minPerPairAnalytics',min_pair));
end $$;

create or replace function public.mb_int_bank()
returns jsonb language plpgsql stable security definer set search_path = public as $$
declare g jsonb; rows jsonb := '[]'::jsonb;
begin
  if auth.uid() is null then raise exception 'not signed in' using errcode = '28000'; end if;
  g := mb_int_gate();
  if (g->>'ready')::bool then
    select coalesce(jsonb_agg(jsonb_build_object(
             'id',id,'review_status',review_status,'transformed_content',transformed_content,'target_id',target_id,
             'primary_topic',primary_topic,'integrated_topics',integrated_topics,'integration_family',integration_family,
             'integration_type',integration_type,'integration_dependency',integration_dependency,'integration_rationale',integration_rationale,
             'case_id',case_id,'case_stage',case_stage,'case_title',case_title,'case_intro',case_intro) order by id),'[]'::jsonb)
      into rows from integrated_items where review_status='approved';
  end if;
  return jsonb_build_object('gate', g, 'rows', rows);   -- rows stay empty while the gate is locked (fail closed)
end $$;

create or replace function public.mb_int_log(p jsonb)
returns boolean language plpgsql volatile security definer set search_path = public as $$
begin
  if auth.uid() is null then return false; end if;
  insert into integrated_serve_log (account_id, kind, requested, delivered, shortfall, requested_families, delivered_by_family, case_id, answered, correct)
  values (auth.uid(),
          case when p->>'kind'='case' then 'case' else 'integrated' end,
          greatest(0, least(1000, coalesce((p->>'requested')::int,0))), greatest(0, least(1000, coalesce((p->>'delivered')::int,0))),
          greatest(0, least(1000, coalesce((p->>'shortfall')::int,0))),
          case when jsonb_typeof(p->'requested_families')='array' then p->'requested_families' else '[]'::jsonb end,
          case when jsonb_typeof(p->'delivered_by_family')='object' then p->'delivered_by_family' else '{}'::jsonb end,
          left(p->>'case_id', 120),
          greatest(0, least(1000, coalesce((p->>'answered')::int,0))), greatest(0, least(1000, coalesce((p->>'correct')::int,0))));
  return true;
exception when others then return false;   -- analytics never breaks a session
end $$;

create or replace function public.mb_int_admin(p_action text, p jsonb default '{}'::jsonb)
returns jsonb language plpgsql volatile security definer set search_path = public as $$
declare
  is_adm bool; st text[]; out jsonb; ids uuid[]; cid text; n int; found_n int; bad int; busy int; i int;
begin
  select a.is_admin into is_adm from accounts a where a.id = auth.uid();
  if not coalesce(is_adm,false) then raise exception 'admins only' using errcode = '42501'; end if;

  if p_action = 'export' then
    select coalesce(array_agg(x), array['ai_reviewed','needs_edit']) into st from jsonb_array_elements_text(coalesce(p->'status','[]'::jsonb)) x;
    select coalesce(jsonb_agg(to_jsonb(it) order by it.created_at),'[]'::jsonb) into out from integrated_items it where it.review_status = any(st);
    return jsonb_build_object('ok',true,'exported_at',now(),'statuses',to_jsonb(st),'count',jsonb_array_length(out),'items',out);

  elsif p_action = 'readiness' then
    select coalesce(jsonb_object_agg(review_status,cnt),'{}'::jsonb) into out
      from (select review_status, count(*)::int cnt from integrated_items group by 1) s;
    return jsonb_build_object('ok',true,'readiness',mb_int_gate(),'by_status',out);

  elsif p_action = 'dissolve' then
    cid := nullif(trim(p->>'case_id'),'');
    if cid is null then raise exception 'case_id required'; end if;
    update integrated_items set case_id=null, case_stage=null, case_title=null, case_intro=null where case_id=cid;
    return jsonb_build_object('ok',true,'dissolved',cid);

  elsif p_action = 'set_case' then
    -- Writes ONLY case metadata on approved rows (never content, never target_id). The app has already run the
    -- same assembleCases() check (stage order, 2–6 stages, no answer leaks) the student side uses at serve time.
    select array_agg(x::uuid order by o) into ids from jsonb_array_elements_text(coalesce(p->'ids','[]'::jsonb)) with ordinality t(x,o);
    n := coalesce(array_length(ids,1),0);
    if n < 2 or n > 6 then raise exception 'a case needs 2–6 stages'; end if;
    if (select count(distinct x) from unnest(ids) x) <> n then raise exception 'the same question is listed twice'; end if;
    cid := coalesce(nullif(trim(p->>'case_id'),''), 'case-'||to_char(clock_timestamp(),'YYYYMMDDHH24MISSMS'));
    select count(*), count(*) filter (where review_status<>'approved'), count(*) filter (where case_id is not null and case_id<>cid)
      into found_n, bad, busy from integrated_items where id = any(ids);
    if found_n <> n then raise exception 'some ids not found'; end if;
    if bad > 0 then raise exception '% stage(s) not approved', bad; end if;
    if busy > 0 then raise exception '% item(s) already belong to another case', busy; end if;
    update integrated_items set case_id=null, case_stage=null, case_title=null, case_intro=null where case_id=cid and not (id = any(ids));
    for i in 1..n loop
      update integrated_items set case_id=cid, case_stage=i, case_title=nullif(p->>'title',''), case_intro=nullif(p->>'intro','') where id=ids[i];
    end loop;
    return jsonb_build_object('ok',true,'case_id',cid,'stages',n);
  end if;
  raise exception 'unknown action %', p_action;
end $$;

revoke all on function public.mb_int_gate() from public, anon, authenticated;
revoke all on function public.mb_int_bank() from public, anon;
revoke all on function public.mb_int_log(jsonb) from public, anon;
revoke all on function public.mb_int_admin(text, jsonb) from public, anon;
grant execute on function public.mb_int_bank() to authenticated;
grant execute on function public.mb_int_log(jsonb) to authenticated;
grant execute on function public.mb_int_admin(text, jsonb) to authenticated;
