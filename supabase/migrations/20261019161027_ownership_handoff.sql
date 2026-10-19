-- SPEC step 10: what happens when someone leaves a group.
--
-- A membership row can be deleted two ways: the person leaves the group, or
-- they delete their account (which cascades through profiles to
-- group_members). Either way, this trigger runs afterwards and:
--   - deletes the group if nobody is left in it (its habits and completions
--     go with it, and its invite code stops working), or
--   - if the owner left, makes the longest-standing remaining member the
--     new owner, so every group always has one.

create function public.handle_member_removed()
returns trigger
language plpgsql
-- Runs with the function owner's rights: the person leaving isn't allowed to
-- change other people's roles or delete groups themselves.
security definer
set search_path = ''
as $$
begin
  if not exists (
    select 1 from public.group_members where group_id = old.group_id
  ) then
    delete from public.groups where id = old.group_id;
  elsif old.role = 'owner' then
    update public.group_members
    set role = 'owner'
    where (group_id, user_id) = (
      select group_id, user_id
      from public.group_members
      where group_id = old.group_id
      -- Earliest joiner first; user_id breaks ties so the choice is stable.
      order by joined_at, user_id
      limit 1
    );
  end if;

  return null; -- the return value of an "after" trigger is ignored
end;
$$;

create trigger on_member_removed
  after delete on public.group_members
  for each row execute function public.handle_member_removed();

-- Like handle_new_user(): only the trigger should run this, so don't expose
-- it at /rest/v1/rpc/handle_member_removed.
revoke execute on function public.handle_member_removed() from public, anon, authenticated;
