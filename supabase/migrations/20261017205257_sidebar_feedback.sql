-- One current rating and compatibility report per authenticated account.
-- Anonymous readers receive only explicitly public columns, never user UUIDs.
create table public.bg3ro_ratings (
  user_id uuid primary key references auth.users(id) on delete cascade,
  rating smallint not null check (rating between 1 and 5),
  updated_at timestamptz not null default now()
);
create table public.bg3ro_compatibility (
  user_id uuid primary key references auth.users(id) on delete cascade,
  works boolean not null,
  platform text not null check (platform in ('windows','macos','linux','ps5','other')),
  mod_version text not null default '' check (char_length(mod_version) <= 80),
  updated_at timestamptz not null default now()
);
create index bg3ro_compatibility_recent on public.bg3ro_compatibility(updated_at desc);
alter table public.bg3ro_ratings enable row level security;
alter table public.bg3ro_compatibility enable row level security;
revoke all on public.bg3ro_ratings, public.bg3ro_compatibility from public,anon,authenticated;
grant select(rating,updated_at) on public.bg3ro_ratings to anon;
grant select(works,platform,mod_version,updated_at) on public.bg3ro_compatibility to anon;
grant select on public.bg3ro_ratings, public.bg3ro_compatibility to authenticated;
grant insert(user_id,rating), update(user_id,rating) on public.bg3ro_ratings to authenticated;
grant insert(user_id,works,platform,mod_version), update(user_id,works,platform,mod_version) on public.bg3ro_compatibility to authenticated;
grant delete on public.bg3ro_ratings, public.bg3ro_compatibility to authenticated;
create policy ratings_public_columns on public.bg3ro_ratings for select to anon using (true);
create policy compatibility_public_columns on public.bg3ro_compatibility for select to anon using (true);
create policy ratings_own_read on public.bg3ro_ratings for select to authenticated using ((select auth.uid())=user_id);
create policy ratings_own_insert on public.bg3ro_ratings for insert to authenticated with check ((select auth.uid())=user_id);
create policy ratings_own_update on public.bg3ro_ratings for update to authenticated using ((select auth.uid())=user_id) with check ((select auth.uid())=user_id);
create policy ratings_own_delete on public.bg3ro_ratings for delete to authenticated using ((select auth.uid())=user_id);
create policy compatibility_own_read on public.bg3ro_compatibility for select to authenticated using ((select auth.uid())=user_id);
create policy compatibility_own_insert on public.bg3ro_compatibility for insert to authenticated with check ((select auth.uid())=user_id);
create policy compatibility_own_update on public.bg3ro_compatibility for update to authenticated using ((select auth.uid())=user_id) with check ((select auth.uid())=user_id);
create policy compatibility_own_delete on public.bg3ro_compatibility for delete to authenticated using ((select auth.uid())=user_id);
create function bg3ro_private.guard_feedback() returns trigger language plpgsql security invoker set search_path='' as $$
begin
  if (select auth.uid()) is null or new.user_id<>(select auth.uid()) then raise exception 'Not authorized' using errcode='42501'; end if;
  if tg_op='UPDATE' and old.updated_at > now()-interval '10 seconds' then raise exception 'Așteaptă 10 secunde înainte să modifici votul.' using errcode='P0001'; end if;
  new.updated_at:=now();
  return new;
end;
$$;
revoke all on function bg3ro_private.guard_feedback() from public,anon,authenticated;
create trigger bg3ro_rating_guard before insert or update on public.bg3ro_ratings for each row execute function bg3ro_private.guard_feedback();
create trigger bg3ro_compatibility_guard before insert or update on public.bg3ro_compatibility for each row execute function bg3ro_private.guard_feedback();
-- Public totals are deliberately requested WITHOUT an authenticated JWT.
-- SECURITY INVOKER uses anon's column grants; no RLS bypass or identity exposure.
create function public.bg3ro_sidebar_stats() returns jsonb language sql stable security invoker set search_path='' as $$
  select jsonb_build_object(
    'rating_count',(select count(rating) from public.bg3ro_ratings),
    'rating_average',(select round(avg(rating),1) from public.bg3ro_ratings),
    'compatibility_count',(select count(works) from public.bg3ro_compatibility),
    'works_count',(select count(works) filter(where works) from public.bg3ro_compatibility),
    'last_update',(select max(published_at) from public.bg3ro_project_updates),
    'recent',coalesce((select jsonb_agg(to_jsonb(recent)) from (select works,platform,mod_version,updated_at from public.bg3ro_compatibility order by updated_at desc limit 10) recent),'[]'::jsonb)
  );
$$;
revoke all on function public.bg3ro_sidebar_stats() from public,anon,authenticated;
grant execute on function public.bg3ro_sidebar_stats() to anon;
notify pgrst,'reload schema';
