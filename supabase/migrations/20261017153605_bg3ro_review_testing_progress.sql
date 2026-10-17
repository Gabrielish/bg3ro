begin;
alter table public.bg3ro_project_status
  add column review_percent smallint not null default 20 check (review_percent between 0 and 100),
  add column testing_percent smallint not null default 20 check (testing_percent between 0 and 100);
-- Existing moderator-only UPDATE policy still applies to these columns.
grant update(review_percent,testing_percent) on public.bg3ro_project_status to authenticated;
commit;
