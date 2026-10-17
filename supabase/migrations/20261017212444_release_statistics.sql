create or replace function public.bg3ro_sidebar_stats() returns jsonb language sql stable security invoker set search_path='' as $$
  select jsonb_build_object(
    'rating_count',(select count(rating) from public.bg3ro_ratings),
    'rating_average',(select round(avg(rating),1) from public.bg3ro_ratings),
    'compatibility_count',(select count(works) from public.bg3ro_compatibility),
    'works_count',(select count(works) filter(where works) from public.bg3ro_compatibility),
    'last_update',greatest((select max(published_at) from public.bg3ro_project_updates),(select max(published_at) from public.bg3ro_releases)),
    'recent',coalesce((select jsonb_agg(to_jsonb(recent)) from (select works,platform,mod_version,updated_at from public.bg3ro_compatibility order by updated_at desc limit 10) recent),'[]'::jsonb)
  );
$$;
revoke all on function public.bg3ro_sidebar_stats() from public,anon,authenticated;
grant execute on function public.bg3ro_sidebar_stats() to anon;
notify pgrst,'reload schema';
