-- SPEC step 6 check: habit privacy and permissions (RLS).
--
-- How to run: paste this whole file into the Supabase dashboard's SQL Editor
-- and click Run. Like groups_rls.sql, it ends by raising an error on purpose
-- so that all test data is rolled back.
--   - Success looks like:  ERROR: ALL CHECKS PASSED (test data rolled back)
--   - A failure looks like: ERROR: assertion failed: <which check failed>

do $$
declare
  owner_id uuid := gen_random_uuid();
  member_id uuid := gen_random_uuid();
  outsider_id uuid := gen_random_uuid();
  gid uuid;
  other_gid uuid;
  code text;
  owners_habit uuid;
  members_habit uuid;
  n int;
  blocked boolean;
begin
  insert into auth.users (id, email, raw_user_meta_data, aud, role) values
    (owner_id, 'check-owner@example.com', '{"display_name":"Owner"}', 'authenticated', 'authenticated'),
    (member_id, 'check-member@example.com', '{"display_name":"Member"}', 'authenticated', 'authenticated'),
    (outsider_id, 'check-outsider@example.com', '{"display_name":"Outsider"}', 'authenticated', 'authenticated');

  set local role authenticated;

  -- Owner creates a group and a habit. Outsider has a group of their own.
  perform set_config('request.jwt.claims', json_build_object('sub', outsider_id)::text, true);
  other_gid := public.create_group('Outsider group');

  perform set_config('request.jwt.claims', json_build_object('sub', owner_id)::text, true);
  gid := public.create_group('Check group');
  select invite_code into code from public.groups where id = gid;

  insert into public.habits (group_id, name) values (gid, 'Owner habit')
  returning id into owners_habit;
  assert (select created_by from public.habits where id = owners_habit) = owner_id,
    'created_by is filled in automatically';

  -- Member joins and sees the owner's habit.
  perform set_config('request.jwt.claims', json_build_object('sub', member_id)::text, true);
  select count(*) into n from public.habits where group_id = gid;
  assert n = 0, 'non-member cannot see the group''s habits';
  perform public.join_group(code);
  select count(*) into n from public.habits where group_id = gid;
  assert n = 1, 'a habit created by the owner appears for the member';

  -- Member adds a habit.
  insert into public.habits (group_id, name, description) values (gid, 'Member habit', 'Daily')
  returning id into members_habit;

  -- Member can't pretend someone else created it.
  blocked := false;
  begin
    insert into public.habits (group_id, name, created_by) values (gid, 'Fake', owner_id);
  exception when others then blocked := true;
  end;
  assert blocked, 'cannot create a habit as someone else';

  -- Member can't add habits to a group they're not in.
  blocked := false;
  begin
    insert into public.habits (group_id, name) values (other_gid, 'Intruder');
  exception when others then blocked := true;
  end;
  assert blocked, 'cannot add a habit to a group you are not in';

  -- Member can edit their own habit but not the owner's.
  update public.habits set name = 'Member habit (edited)' where id = members_habit;
  get diagnostics n = row_count;
  assert n = 1, 'creator can update their habit';
  update public.habits set name = 'Hijacked' where id = owners_habit;
  get diagnostics n = row_count;
  assert n = 0, 'a regular member cannot update someone else''s habit';
  delete from public.habits where id = owners_habit;
  get diagnostics n = row_count;
  assert n = 0, 'a regular member cannot delete someone else''s habit';

  -- Habits can't be moved to another group.
  blocked := false;
  begin
    update public.habits set group_id = other_gid where id = members_habit;
  exception when others then blocked := true;
  end;
  assert blocked, 'cannot move a habit to another group';

  -- The group owner can archive anyone's habit.
  perform set_config('request.jwt.claims', json_build_object('sub', owner_id)::text, true);
  update public.habits set archived_at = now() where id = members_habit;
  get diagnostics n = row_count;
  assert n = 1, 'group owner can update (archive) a member''s habit';

  -- The outsider sees none of it.
  perform set_config('request.jwt.claims', json_build_object('sub', outsider_id)::text, true);
  select count(*) into n from public.habits where group_id = gid;
  assert n = 0, 'outsider cannot see the group''s habits';
  delete from public.habits where group_id = gid;
  get diagnostics n = row_count;
  assert n = 0, 'outsider cannot delete the group''s habits';

  reset role;
  raise exception 'ALL CHECKS PASSED (test data rolled back)';
end $$;
