-- Rollback-only diagnostics; no fake releases/users are retained.
begin;
select set_config('bg3ro.qa_a',gen_random_uuid()::text,true),set_config('bg3ro.qa_m',gen_random_uuid()::text,true);
insert into auth.users(id,email,aud,role) values
 (current_setting('bg3ro.qa_a')::uuid,'qa-'||current_setting('bg3ro.qa_a')||'@example.invalid','authenticated','authenticated'),
 (current_setting('bg3ro.qa_m')::uuid,'qa-'||current_setting('bg3ro.qa_m')||'@example.invalid','authenticated','authenticated');
insert into bg3ro_private.moderators values(current_setting('bg3ro.qa_m')::uuid);
select set_config('request.jwt.claim.sub',current_setting('bg3ro.qa_a'),true);
set local role authenticated;
do $$ begin
 begin
  insert into public.bg3ro_releases(kind,version,title,file_name,file_bytes,download_url,description)
  values('translation','qa-test','QA title','qa.zip',1048576,'https://github.com/Gabrielish/bg3ro/releases/download/qa/qa.zip','QA description');
  raise exception 'Normal user published release';
 exception when insufficient_privilege then null; end;
end $$;
reset role;
select set_config('request.jwt.claim.sub',current_setting('bg3ro.qa_m'),true);
set local role authenticated;
do $$ declare release_id uuid; begin
 insert into public.bg3ro_releases(kind,version,title,file_name,file_bytes,download_url,description)
 values('translation','qa-test','QA title','qa.zip',1048576,'https://github.com/Gabrielish/bg3ro/releases/download/qa/qa.zip','QA description') returning id into release_id;
 perform set_config('bg3ro.qa_release',release_id::text,true);
 update public.bg3ro_releases set description='QA revised description' where id=release_id;
 if not found then raise exception 'Author cannot edit release'; end if;
 update public.bg3ro_releases set file_name='replacement.zip',file_bytes=2097152,
 download_url='https://raw.githubusercontent.com/Gabrielish/bg3ro/aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa/Baldur''s%20Gate%203%20Romanian%20Translate/replacement.zip' where id=release_id;
 if not found then raise exception 'Author cannot replace archive'; end if;
 begin
  update public.bg3ro_releases set published_at=now() where id=release_id;
  raise exception 'Publication date mutable from browser';
 exception when insufficient_privilege then null; end;
 begin
  insert into public.bg3ro_releases(kind,version,title,file_name,file_bytes,download_url,description)
  values('translation','qa-unsafe','QA title','qa.zip',1,'javascript:alert(1)','QA description');
  raise exception 'Unsafe archive URL accepted';
 exception when check_violation then null; end;
end $$;
reset role;
select set_config('request.jwt.claim.sub',current_setting('bg3ro.qa_a'),true);
set local role authenticated;
do $$ begin
 update public.bg3ro_releases set description='Attacker text' where id=current_setting('bg3ro.qa_release')::uuid;
 if found then raise exception 'Other user edited release'; end if;
 update public.bg3ro_releases set file_bytes=42 where id=current_setting('bg3ro.qa_release')::uuid;
 if found then raise exception 'Other user replaced archive'; end if;
end $$;
reset role;
select set_config('request.jwt.claim.sub','',true);
set local role anon;
do $$ begin
 if not exists(select 1 from public.bg3ro_releases where id=current_setting('bg3ro.qa_release')::uuid and description='QA revised description') then raise exception 'Public release inaccessible or edit lost'; end if;
 begin perform author_id from public.bg3ro_releases;raise exception 'Public author UUID exposed';exception when insufficient_privilege then null;end;
end $$;
reset role;
rollback;
select 'PASS: public release metadata, moderator publication, author-only edit, unsafe URLs blocked, file columns protected; QA rolled back.' as result;
