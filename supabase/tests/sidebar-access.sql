begin;
select set_config('bg3ro.qa_a',gen_random_uuid()::text,true),set_config('bg3ro.qa_b',gen_random_uuid()::text,true);
insert into auth.users(id,email,aud,role) values(current_setting('bg3ro.qa_a')::uuid,'qa-'||current_setting('bg3ro.qa_a')||'@example.invalid','authenticated','authenticated'),(current_setting('bg3ro.qa_b')::uuid,'qa-'||current_setting('bg3ro.qa_b')||'@example.invalid','authenticated','authenticated');
select set_config('request.jwt.claim.sub',current_setting('bg3ro.qa_a'),true);
set local role authenticated;
insert into public.bg3ro_ratings(user_id,rating) values(auth.uid(),4) on conflict(user_id) do update set rating=excluded.rating;
insert into public.bg3ro_compatibility(user_id,works,platform,mod_version) values(auth.uid(),true,'windows','QA rollback');
do $$ begin
  begin insert into public.bg3ro_ratings(user_id,rating) values(auth.uid(),5);raise exception 'Duplicate rating allowed';exception when unique_violation then null;end;
  begin update public.bg3ro_ratings set rating=5 where user_id=auth.uid();raise exception 'Rate limit bypassed';exception when raise_exception then if sqlerrm not like '%10 secunde%' then raise;end if;end;
  begin update public.bg3ro_ratings set updated_at=now()-interval '1 day';raise exception 'Timestamp forging allowed';exception when insufficient_privilege then null;end;
end $$;
reset role;
select set_config('request.jwt.claim.sub',current_setting('bg3ro.qa_b'),true);
set local role authenticated;
do $$ begin
  if exists(select 1 from public.bg3ro_ratings where user_id=current_setting('bg3ro.qa_a')::uuid) then raise exception 'Other user reads identity';end if;
  update public.bg3ro_ratings set rating=1 where user_id=current_setting('bg3ro.qa_a')::uuid;
  if found then raise exception 'Other user updates rating';end if;
  begin insert into public.bg3ro_compatibility(user_id,works,platform) values(current_setting('bg3ro.qa_a')::uuid,false,'windows');raise exception 'Impersonation allowed';exception when insufficient_privilege then null;end;
  begin insert into public.bg3ro_ratings(user_id,rating) values(auth.uid(),6);raise exception 'Invalid rating allowed';exception when check_violation then null;end;
end $$;
reset role;
select set_config('request.jwt.claim.sub','',true);
set local role anon;
do $$ declare stats jsonb; begin
  stats:=public.bg3ro_sidebar_stats();
  if (stats->>'rating_count')::int<1 or (stats->>'works_count')::int<1 then raise exception 'Public aggregates unavailable';end if;
  if stats::text like '%user_id%' or stats::text like '%@example.invalid%' then raise exception 'Identity leaked in aggregate';end if;
  begin perform user_id from public.bg3ro_ratings;raise exception 'Anonymous identity read allowed';exception when insufficient_privilege then null;end;
  begin insert into public.bg3ro_ratings(user_id,rating) values(current_setting('bg3ro.qa_b')::uuid,4);raise exception 'Anonymous write allowed';exception when insufficient_privilege then null;end;
  perform rating from public.bg3ro_ratings;
end $$;
reset role;
rollback;
select 'PASS: sidebar one-vote ownership, upsert, anonymous aggregates without identities, bounds and rate limit. All QA records rolled back.' as result;
