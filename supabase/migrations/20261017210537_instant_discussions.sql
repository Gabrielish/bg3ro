begin;

-- Preserve the private anti-spam trigger and ownership checks.
create or replace function bg3ro_private.check_submission() returns trigger
language plpgsql security definer set search_path = '' as $$
declare limits bg3ro_private.submission_limits; parent_status text; parent_parent uuid;
begin
  if auth.uid() is null or new.author_id <> auth.uid() then
    raise exception 'Not authorized' using errcode = '42501';
  end if;
  if not public.bg3ro_is_moderator() then
    perform pg_advisory_xact_lock(hashtextextended(auth.uid()::text || tg_table_name, 0));
    select * into limits from bg3ro_private.submission_limits where user_id = auth.uid() and kind = tg_table_name;
    if limits.last_sent > now() - interval '30 seconds' then raise exception 'Așteaptă 30 de secunde.'; end if;
    if limits.window_started > now() - interval '1 day' and limits.submissions >= 20 then raise exception 'Ai atins limita zilnică.'; end if;
    insert into bg3ro_private.submission_limits(user_id,kind,last_sent,window_started,submissions)
      values(auth.uid(),tg_table_name,now(),now(),1)
      on conflict(user_id,kind) do update set last_sent = now(),
        window_started = case when submission_limits.window_started <= now() - interval '1 day' then now() else submission_limits.window_started end,
        submissions = case when submission_limits.window_started <= now() - interval '1 day' then 1 else submission_limits.submissions + 1 end;
    if tg_table_name <> 'bg3ro_discussion_posts' then new.status := 'new'; new.moderator_reply := ''; end if;
  end if;
  new.created_at := now();
  if tg_table_name = 'bg3ro_discussion_posts' then
    new.status := 'approved';
    if new.parent_id is not null then
      select status,parent_id into parent_status,parent_parent from public.bg3ro_discussion_posts where id = new.parent_id;
      if parent_status is distinct from 'approved' or parent_parent is not null then
        raise exception 'Reply must belong to an approved root discussion';
      end if;
    end if;
  end if;
  return new;
end;
$$;
revoke all on function bg3ro_private.check_submission() from public, anon, authenticated;
alter table public.bg3ro_discussion_posts alter column status set default 'approved';
alter policy bg3ro_posts_insert on public.bg3ro_discussion_posts
  with check (author_id = (select auth.uid()) and status = 'approved');
commit;
