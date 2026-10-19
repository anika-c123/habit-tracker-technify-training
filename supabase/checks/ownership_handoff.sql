-- SPEC step 10 check: ownership hand-off when members leave.
--
-- How to run: paste this whole file into the Supabase dashboard's SQL Editor
-- and click Run (or: npx supabase db query --linked -f <this file>). Like the
-- other checks, it ends by raising an error on purpose so that all test data
-- is rolled back.
--   - Success looks like:  ERROR: ALL CHECKS PASSED (test data rolled back)
--   - A failure looks like: ERROR: assertion failed: <which check failed>

do $$
declare
  a uuid := gen_random_uuid();
  b uuid := gen_random_uuid();
  c uuid := gen_random_uuid();
  gid uuid;
  gid2 uuid;
  code text;
  code2 text;
  habit uuid;
  n int;
  blocked boolean;
begin
  insert into auth.users (id, email, raw_user_meta_data, aud, role) values
    (a, 'check-a@example.com', '{"display_name":"A"}', 'authenticated', 'authenticated'),
    (b, 'check-b@example.com', '{"display_name":"B"}', 'authenticated', 'authenticated'),
    (c, 'check-c@example.com', '{"display_name":"C"}', 'authenticated', 'authenticated');

  set local role authenticated;

  -- A creates a group with a habit and a check-off; B joins, then C.
  perform set_config('request.jwt.claims', json_build_object('sub', a)::text, true);
  gid := public.create_group('Check group');
  select invite_code into code from public.groups where id = gid;
  insert into public.habits (group_id, name) values (gid, 'Read') returning id into habit;
  insert into public.completions (habit_id, completed_on) values (habit, current_date);

  perform set_config('request.jwt.claims', json_build_object('sub', b)::text, true);
  perform public.join_group(code);
  perform set_config('request.jwt.claims', json_build_object('sub', c)::text, true);
  perform public.join_group(code);
  -- Make the join order unambiguous (all three happened in the same instant).
  reset role;
  update public.group_members set joined_at = now() - interval '2 days' where user_id = a;
  update public.group_members set joined_at = now() - interval '1 day' where user_id = b;
  set local role authenticated;

  -- ---- A (owner) leaves → B, the next to join, becomes owner ---------------
  perform set_config('request.jwt.claims', json_build_object('sub', a)::text, true);
  delete from public.group_members where group_id = gid and user_id = a;
  get diagnostics n = row_count;
  assert n = 1, 'owner can leave their group';

  perform set_config('request.jwt.claims', json_build_object('sub', b)::text, true);
  assert (select role from public.group_members where group_id = gid and user_id = b) = 'owner',
    'longest-standing remaining member becomes owner';
  assert (select role from public.group_members where group_id = gid and user_id = c) = 'member',
    'other members stay members';
  select count(*) into n from public.group_members where group_id = gid and role = 'owner';
  assert n = 1, 'exactly one owner after hand-off';

  -- ---- A non-owner leaving changes nothing else ----------------------------
  perform set_config('request.jwt.claims', json_build_object('sub', c)::text, true);
  delete from public.group_members where group_id = gid and user_id = c;
  perform set_config('request.jwt.claims', json_build_object('sub', b)::text, true);
  assert (select role from public.group_members where group_id = gid and user_id = b) = 'owner',
    'owner keeps their role when a member leaves';

  -- ---- Leaving still only works on your own row ----------------------------
  perform set_config('request.jwt.claims', json_build_object('sub', c)::text, true);
  delete from public.group_members where group_id = gid and user_id = b;
  get diagnostics n = row_count;
  assert n = 0, 'cannot remove someone else from a group';

  -- ---- Last member (B) leaves → the group and its data are gone ------------
  perform set_config('request.jwt.claims', json_build_object('sub', b)::text, true);
  delete from public.group_members where group_id = gid and user_id = b;

  reset role; -- look as the admin, so RLS can't hide anything
  assert not exists (select 1 from public.groups where id = gid), 'empty group is deleted';
  assert not exists (select 1 from public.habits where id = habit), 'its habits are deleted';
  assert not exists (select 1 from public.completions where habit_id = habit),
    'its completions are deleted';
  set local role authenticated;

  blocked := false;
  begin
    perform public.join_group(code);
  exception when others then blocked := true;
  end;
  assert blocked, 'deleted group''s invite code no longer works';

  -- ---- Account deletion: owner deletes their account → hand-off too --------
  perform set_config('request.jwt.claims', json_build_object('sub', a)::text, true);
  gid2 := public.create_group('Second group');
  select invite_code into code2 from public.groups where id = gid2;
  perform set_config('request.jwt.claims', json_build_object('sub', b)::text, true);
  perform public.join_group(code2);

  reset role;
  delete from auth.users where id = a; -- cascades: profiles → group_members
  assert (select role from public.group_members where group_id = gid2 and user_id = b) = 'owner',
    'deleting the owner''s account hands ownership to the next member';

  delete from auth.users where id = b; -- the last member's account
  assert not exists (select 1 from public.groups where id = gid2),
    'deleting the last member''s account deletes the group';

  raise exception 'ALL CHECKS PASSED (test data rolled back)';
end $$;
