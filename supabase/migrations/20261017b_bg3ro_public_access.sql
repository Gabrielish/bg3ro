begin;
-- Anonymous readers only need approved messages, not the moderator helper RPC.
drop policy bg3ro_posts_read on public.bg3ro_discussion_posts;
create policy bg3ro_posts_public on public.bg3ro_discussion_posts for select to anon using (status = 'approved');
create policy bg3ro_posts_members on public.bg3ro_discussion_posts for select to authenticated
  using (status = 'approved' or author_id = (select auth.uid()) or (select public.bg3ro_is_moderator()));
revoke execute on function public.bg3ro_is_moderator() from anon;
commit;
