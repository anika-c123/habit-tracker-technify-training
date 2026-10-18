-- SPEC step 4 check: group privacy (RLS) and the create/join functions.
--
-- How to run: paste this whole file into the Supabase dashboard's SQL Editor
-- and click Run.
--
-- It creates three throwaway users (A, B and outsider C), acts as each one,
-- and checks what they can see and do. At the end it deliberately raises an
-- error so that EVERYTHING it did is rolled back, leaving no test data behind.
--   - Success looks like:  ERROR: ALL CHECKS PASSED (test data rolled back)
--   - A failure looks like: ERROR: assertion failed: <which check failed>

do $$
declare
  a uuid := gen_random_uuid();
  b uuid := gen_random_uuid();
  c uuid := gen_random_uuid();
  gid uuid;
  code text;
  n int;
  blocked boolean;
begin
  -- Three users. The sign-up trigger gives each a profile.
  insert into auth.users (id, email, raw_user_meta_data, aud, role) values
    (a, 'check-a@example.com', '{"display_name":"A"}', 'authenticated', 'authenticated'),
    (b, 'check-b@example.com', '{"display_name":"B"}', 'authenticated', 'authenticated'),
    (c, 'check-c@example.com', '{"display_name":"C"}', 'authenticated', 'authenticated');

  -- From here on, run as a logged-in user (RLS applies). Changing the "sub"
  -- claim switches which user we are.
  set local role authenticated;

  -- ---- A creates a group -------------------------------------------------
  perform set_config('request.jwt.claims', json_build_object('sub', a)::text, true);
  gid := public.create_group('  Morning Runners  ');
  select invite_code into code from public.groups where id = gid;

  assert code ~ '^[A-HJ-NP-Z2-9]{6}$', 'invite code has the right format';
  assert (select name from public.groups where id = gid) = 'Morning Runners',
    'group name is trimmed';
  assert (select role from public.group_members where group_id = gid and user_id = a) = 'owner',
    'creator becomes owner';

  blocked := false;
  begin
    perform public.create_group('   ');
  exception when others then blocked := true;
  end;
  assert blocked, 'blank group name is rejected';

  -- ---- B is not a member yet: sees nothing --------------------------------
  perform set_config('request.jwt.claims', json_build_object('sub', b)::text, true);
  select count(*) into n from public.groups;
  assert n = 0, 'B cannot see A''s group before joining';
  select count(*) into n from public.group_members;
  assert n = 0, 'B cannot see A''s group members before joining';
  select count(*) into n from public.profiles where id = a;
  assert n = 0, 'B cannot see A''s profile before joining';

  -- B tries to sneak in without the RPC.
  blocked := false;
  begin
    insert into public.group_members (group_id, user_id) values (gid, b);
  exception when others then blocked := true;
  end;
  assert blocked, 'B cannot add themselves with a direct insert';

  blocked := false;
  begin
    insert into public.groups (name, invite_code) values ('Sneaky', 'ABCDEF');
  exception when others then blocked := true;
  end;
  assert blocked, 'groups cannot be created with a direct insert';

  -- ---- B joins with the code ----------------------------------------------
  blocked := false;
  begin
    perform public.join_group('ZZZZZZ');
  exception when others then blocked := true;
  end;
  assert blocked, 'an invalid invite code is rejected';

  assert public.join_group('  ' || lower(code) || ' ') = gid,
    'join_group accepts lowercase codes with spaces';
  assert (select role from public.group_members where group_id = gid and user_id = b) = 'member',
    'joiner becomes a member';

  select count(*) into n from public.groups;
  assert n = 1, 'B can see the group after joining';
  select count(*) into n from public.group_members where group_id = gid;
  assert n = 2, 'B can see both members after joining';
  select count(*) into n from public.profiles where id = a;
  assert n = 1, 'B can see A''s profile after joining';

  -- Joining again changes nothing.
  perform public.join_group(code);
  select count(*) into n from public.group_members where group_id = gid;
  assert n = 2, 'joining twice does not add a second row';

  -- ---- A re-joining their own group keeps the owner role ------------------
  perform set_config('request.jwt.claims', json_build_object('sub', a)::text, true);
  perform public.join_group(code);
  assert (select role from public.group_members where group_id = gid and user_id = a) = 'owner',
    're-joining keeps the owner role';

  -- ---- Outsider C still sees nothing ---------------------------------------
  perform set_config('request.jwt.claims', json_build_object('sub', c)::text, true);
  select count(*) into n from public.groups;
  assert n = 0, 'C cannot see the group';
  select count(*) into n from public.profiles where id in (a, b);
  assert n = 0, 'C cannot see A''s or B''s profiles';

  -- ---- Leaving -------------------------------------------------------------
  perform set_config('request.jwt.claims', json_build_object('sub', b)::text, true);
  delete from public.group_members where group_id = gid and user_id = a;
  get diagnostics n = row_count;
  assert n = 0, 'B cannot remove A from the group';

  delete from public.group_members where group_id = gid and user_id = b;
  get diagnostics n = row_count;
  assert n = 1, 'B can leave the group';
  select count(*) into n from public.groups;
  assert n = 0, 'after leaving, B can no longer see the group';

  -- ---- Logged-out visitors -------------------------------------------------
  reset role;
  set local role anon;
  blocked := false;
  begin
    perform public.create_group('Anon group');
  exception when others then blocked := true;
  end;
  assert blocked, 'logged-out visitors cannot call create_group';

  reset role;
  raise exception 'ALL CHECKS PASSED (test data rolled back)';
end $$;
