-- Run once in YOUR Supabase SQL Editor. No passwords or service_role keys belong in the site.
-- Isolated names to avoid overwriting tables from other applications.
begin;
create schema if not exists bg3ro_private;
revoke all on schema bg3ro_private from public, anon, authenticated;

create table bg3ro_private.moderators (
  user_id uuid primary key references auth.users(id) on delete cascade
);
revoke all on bg3ro_private.moderators from public, anon, authenticated;
alter table bg3ro_private.moderators enable row level security;

create table bg3ro_private.submission_limits (
  user_id uuid not null references auth.users(id) on delete cascade,
  kind text not null,
  last_sent timestamptz not null,
  window_started timestamptz not null,
  submissions integer not null,
  primary key (user_id,kind)
);
revoke all on bg3ro_private.submission_limits from public, anon, authenticated;
alter table bg3ro_private.submission_limits enable row level security;

create function public.bg3ro_is_moderator() returns boolean
language sql stable security definer set search_path = '' as $$
  select exists(select 1 from bg3ro_private.moderators where user_id = (select auth.uid()));
$$;
revoke all on function public.bg3ro_is_moderator() from public;
grant execute on function public.bg3ro_is_moderator() to anon, authenticated;

create table public.bg3ro_project_status (
  id smallint primary key default 1 check (id = 1),
  translation_percent smallint not null check (translation_percent between 0 and 100),
  review_state text not null check (char_length(trim(review_state)) between 2 and 180),
  testing_state text not null check (char_length(trim(testing_state)) between 2 and 180)
);
insert into public.bg3ro_project_status values (1,80,'Actul I verificat, inclusiv variantele de gen','Verificarea Actului II urmează');

create table public.bg3ro_project_updates (
  id uuid primary key default gen_random_uuid(),
  author_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  title text not null check (char_length(trim(title)) between 2 and 160),
  body text not null check (char_length(trim(body)) between 10 and 12000),
  published_at timestamptz not null default now()
);

create table public.bg3ro_discussion_posts (
  id uuid primary key default gen_random_uuid(),
  author_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  author_name text not null check (char_length(trim(author_name)) between 2 and 40),
  title text not null check (char_length(trim(title)) between 2 and 120),
  body text not null check (char_length(trim(body)) between 10 and 4000),
  parent_id uuid references public.bg3ro_discussion_posts(id) on delete cascade,
  status text not null default 'pending' check (status in ('pending','approved','rejected')),
  created_at timestamptz not null default now()
);
create index bg3ro_posts_feed on public.bg3ro_discussion_posts(created_at desc,id desc);
create index bg3ro_posts_author on public.bg3ro_discussion_posts(author_id,created_at desc);
create index bg3ro_posts_parent on public.bg3ro_discussion_posts(parent_id);

create table public.bg3ro_bug_reports (
  id uuid primary key default gen_random_uuid(),
  author_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  title text not null check (char_length(trim(title)) between 5 and 160),
  body text not null check (char_length(trim(body)) between 20 and 6000),
  category text not null check (category in ('text','gender','technical','other')),
  platform text not null check (platform in ('windows','macos','linux','other')),
  mod_version text not null check (char_length(trim(mod_version)) between 1 and 80),
  game_version text not null default '' check (char_length(game_version) <= 80),
  status text not null default 'new' check (status in ('new','investigating','resolved','closed')),
  moderator_reply text not null default '' check (char_length(moderator_reply) <= 4000),
  created_at timestamptz not null default now()
);
create index bg3ro_reports_author on public.bg3ro_bug_reports(author_id,created_at desc);

-- Database-side limits; client-side disabled buttons are not a security boundary.
create function bg3ro_private.check_submission() returns trigger
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
    if tg_table_name = 'bg3ro_discussion_posts' then new.status := 'pending';
    else new.status := 'new'; new.moderator_reply := ''; end if;
  elsif tg_table_name = 'bg3ro_discussion_posts' then
    new.status := 'approved';
  end if;
  new.created_at := now();
  if tg_table_name = 'bg3ro_discussion_posts' then
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
create trigger bg3ro_check_post before insert on public.bg3ro_discussion_posts for each row execute function bg3ro_private.check_submission();
create trigger bg3ro_check_report before insert on public.bg3ro_bug_reports for each row execute function bg3ro_private.check_submission();

alter table public.bg3ro_project_status enable row level security;
alter table public.bg3ro_project_updates enable row level security;
alter table public.bg3ro_discussion_posts enable row level security;
alter table public.bg3ro_bug_reports enable row level security;
revoke all on public.bg3ro_project_status, public.bg3ro_project_updates, public.bg3ro_discussion_posts, public.bg3ro_bug_reports from public, anon, authenticated;

grant select on public.bg3ro_project_status, public.bg3ro_project_updates, public.bg3ro_discussion_posts to anon, authenticated;
grant select on public.bg3ro_bug_reports to authenticated;
grant update(translation_percent,review_state,testing_state) on public.bg3ro_project_status to authenticated;
grant insert(author_id,title,body), delete on public.bg3ro_project_updates to authenticated;
grant insert(author_id,author_name,title,body,parent_id), delete on public.bg3ro_discussion_posts to authenticated;
grant update(status) on public.bg3ro_discussion_posts to authenticated;
grant insert(author_id,title,body,category,platform,mod_version,game_version), delete on public.bg3ro_bug_reports to authenticated;
grant update(status,moderator_reply) on public.bg3ro_bug_reports to authenticated;

create policy bg3ro_status_public on public.bg3ro_project_status for select to anon,authenticated using (true);
create policy bg3ro_status_moderator on public.bg3ro_project_status for update to authenticated using ((select public.bg3ro_is_moderator())) with check ((select public.bg3ro_is_moderator()));
create policy bg3ro_updates_public on public.bg3ro_project_updates for select to anon,authenticated using (published_at <= now());
create policy bg3ro_updates_insert on public.bg3ro_project_updates for insert to authenticated with check ((select public.bg3ro_is_moderator()) and author_id = (select auth.uid()));
create policy bg3ro_updates_delete on public.bg3ro_project_updates for delete to authenticated using ((select public.bg3ro_is_moderator()));
create policy bg3ro_posts_read on public.bg3ro_discussion_posts for select to anon,authenticated
  using (status = 'approved' or author_id = (select auth.uid()) or (select public.bg3ro_is_moderator()));
create policy bg3ro_posts_insert on public.bg3ro_discussion_posts for insert to authenticated
  with check (author_id = (select auth.uid()) and (status = 'pending' or (select public.bg3ro_is_moderator())));
create policy bg3ro_posts_moderate on public.bg3ro_discussion_posts for update to authenticated
  using ((select public.bg3ro_is_moderator())) with check ((select public.bg3ro_is_moderator()));
create policy bg3ro_posts_delete on public.bg3ro_discussion_posts for delete to authenticated
  using (author_id = (select auth.uid()) or (select public.bg3ro_is_moderator()));
create policy bg3ro_reports_read on public.bg3ro_bug_reports for select to authenticated
  using (author_id = (select auth.uid()) or (select public.bg3ro_is_moderator()));
create policy bg3ro_reports_insert on public.bg3ro_bug_reports for insert to authenticated
  with check (author_id = (select auth.uid()) and status = 'new' and moderator_reply = '');
create policy bg3ro_reports_moderate on public.bg3ro_bug_reports for update to authenticated
  using ((select public.bg3ro_is_moderator())) with check ((select public.bg3ro_is_moderator()));
create policy bg3ro_reports_delete on public.bg3ro_bug_reports for delete to authenticated
  using (author_id = (select auth.uid()) or (select public.bg3ro_is_moderator()));
commit;

-- After the owner signs in once, add their UUID from Authentication > Users:
-- insert into bg3ro_private.moderators(user_id) values ('OWNER-USER-UUID');
