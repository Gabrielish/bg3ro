begin;
alter table public.bg3ro_releases drop constraint bg3ro_releases_download_url_check;
alter table public.bg3ro_releases add constraint bg3ro_releases_download_url_check check (
  download_url ~ '^https://(github\.com/Gabrielish/bg3ro/releases/download/|raw\.githubusercontent\.com/Gabrielish/bg3ro/(main|[a-f0-9]{40})/Baldur''s%20Gate%203%20Romanian%20Translate/)[^?#[:space:]]+$'
);
grant update(file_name,file_bytes,download_url) on public.bg3ro_releases to authenticated;
commit;
