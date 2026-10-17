begin;
create table public.bg3ro_releases (
  id uuid primary key default gen_random_uuid(),
  author_id uuid not null default auth.uid() references auth.users(id),
  author_name text not null default 'Gabrielish' check (char_length(author_name) between 2 and 40),
  kind text not null check (kind in ('translation','search','item_gender','combat_log')),
  version text not null check (char_length(btrim(version)) between 1 and 80),
  title text not null check (char_length(btrim(title)) between 1 and 160),
  file_name text not null check (char_length(file_name) between 1 and 240 and file_name !~ '[/\\]'),
  file_bytes bigint not null check (file_bytes > 0 and file_bytes <= 2147483648),
  download_url text not null check (download_url ~ '^https://(github\.com/Gabrielish/bg3ro/releases/download/|raw\.githubusercontent\.com/Gabrielish/bg3ro/main/Baldur''s%20Gate%203%20Romanian%20Translate/)[^?#[:space:]]+$'),
  tags text not null default '' check (char_length(tags) <= 240),
  description text not null check (char_length(btrim(description)) between 1 and 12000),
  published_at timestamptz not null default now(),
  unique(kind, version)
);
create index bg3ro_releases_published on public.bg3ro_releases(published_at desc);
create index bg3ro_releases_author on public.bg3ro_releases(author_id);
alter table public.bg3ro_releases enable row level security;
revoke all on public.bg3ro_releases from public, anon, authenticated;
grant select(id,author_name,kind,version,title,file_name,file_bytes,download_url,tags,description,published_at) on public.bg3ro_releases to anon,authenticated;
grant insert(kind,version,title,file_name,file_bytes,download_url,tags,description),
  update(title,tags,description) on public.bg3ro_releases to authenticated;
create policy bg3ro_releases_read on public.bg3ro_releases for select to anon,authenticated using (published_at <= now());
create policy bg3ro_releases_publish on public.bg3ro_releases for insert to authenticated
  with check ((select public.bg3ro_is_moderator()) and author_id = (select auth.uid()) and published_at <= now());
create policy bg3ro_releases_edit on public.bg3ro_releases for update to authenticated
  using ((select public.bg3ro_is_moderator()) and author_id = (select auth.uid()))
  with check ((select public.bg3ro_is_moderator()) and author_id = (select auth.uid()));
-- Regular news can also be edited by their moderator-author.
grant update(title,body) on public.bg3ro_project_updates to authenticated;
create policy bg3ro_updates_edit on public.bg3ro_project_updates for update to authenticated
  using ((select public.bg3ro_is_moderator()) and author_id = (select auth.uid()))
  with check ((select public.bg3ro_is_moderator()) and author_id = (select auth.uid()));
commit;
