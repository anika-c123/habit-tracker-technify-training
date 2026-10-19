-- SPEC step 7 check: completion privacy and permissions (RLS).
--
-- How to run: paste this whole file into the Supabase dashboard's SQL Editor
-- and click Run. Like the other checks, it ends by raising an error on
-- purpose so that all test data is rolled back.
--   - Success looks like:  ERROR: ALL CHECKS PASSED (test data rolled back)
--   - A failure looks like: ERROR: assertion failed: <which check failed>

do $$
declare
  a uuid := gen_random_uuid();
  b uuid := gen_random_uuid();
  outsider uuid := gen_random_uuid();
  gid uuid;
  code text;
  habit uuid;
  archived_habit uuid;
  n int;
  blocked boolean;
begin
  insert into auth.users (id, email, raw_user_meta_data, aud, role) values
    (a, 'check-a@example.com', '{"display_name":"A"}', 'authenticated', 'authenticated'),
    (b, 'check-b@example.com', '{"display_name":"B"}', 'authenticated', 'authenticated'),
    (outsider, 'check-outsider@example.com', '{"display_name":"Outsider"}', 'authenticated', 'authenticated');

  set local role authenticated;

  -- A creates a group with two habits (one archived); B joins.
  perform set_config('request.jwt.claims', json_build_object('sub', a)::text, true);
  gid := public.create_group('Check group');
  select invite_code into code from public.groups where id = gid;
  insert into public.habits (group_id, name) values (gid, 'Read') returning id into habit;
  insert into public.habits (group_id, name, archived_at) values (gid, 'Old', now())
  returning id into archived_habit;

  perform set_config('request.jwt.claims', json_build_object('sub', b)::text, true);
  perform public.join_group(code);

  -- ---- A checks off today --------------------------------------------------
  perform set_config('request.jwt.claims', json_build_object('sub', a)::text, true);
  insert into public.completions (habit_id, completed_on) values (habit, current_date);
  assert (select user_id from public.completions where habit_id = habit) = a,
    'user_id is filled in automatically';

  -- Same habit, same day again: refused (the "double-tap" rule).
  blocked := false;
  begin
    insert into public.completions (habit_id, completed_on) values (habit, current_date);
  exception when unique_violation then blocked := true;
  end;
  assert blocked, 'cannot check off the same habit twice on one day';

  -- Yesterday and tomorrow are allowed (time zones); further away is not.
  insert into public.completions (habit_id, completed_on) values (habit, current_date - 1);
  insert into public.completions (habit_id, completed_on) values (habit, current_date + 1);
  blocked := false;
  begin
    insert into public.completions (habit_id, completed_on) values (habit, current_date - 2);
  exception when others then blocked := true;
  end;
  assert blocked, 'cannot backfill two days ago';
  blocked := false;
  begin
    insert into public.completions (habit_id, completed_on) values (habit, current_date + 2);
  exception when others then blocked := true;
  end;
  assert blocked, 'cannot check off two days ahead';

  blocked := false;
  begin
    insert into public.completions (habit_id, completed_on) values (archived_habit, current_date);
  exception when others then blocked := true;
  end;
  assert blocked, 'cannot check off an archived habit';

  -- ---- B sees A's check-offs but can't act for A ---------------------------
  perform set_config('request.jwt.claims', json_build_object('sub', b)::text, true);
  select count(*) into n from public.completions where user_id = a;
  assert n = 3, 'group members can see each other''s completions';

  blocked := false;
  begin
    insert into public.completions (habit_id, user_id, completed_on) values (habit, a, current_date - 1);
  exception when others then blocked := true;
  end;
  assert blocked, 'cannot check off a habit for someone else';

  delete from public.completions where user_id = a;
  get diagnostics n = row_count;
  assert n = 0, 'cannot undo someone else''s check-off';

  -- ---- Outsider sees nothing and can't check off ---------------------------
  perform set_config('request.jwt.claims', json_build_object('sub', outsider)::text, true);
  select count(*) into n from public.completions;
  assert n = 0, 'outsider cannot see the group''s completions';
  blocked := false;
  begin
    insert into public.completions (habit_id, completed_on) values (habit, current_date);
  exception when others then blocked := true;
  end;
  assert blocked, 'outsider cannot check off the group''s habits';

  -- ---- A undoes today ------------------------------------------------------
  perform set_config('request.jwt.claims', json_build_object('sub', a)::text, true);
  delete from public.completions where habit_id = habit and completed_on = current_date;
  get diagnostics n = row_count;
  assert n = 1, 'can undo your own check-off';

  reset role;
  raise exception 'ALL CHECKS PASSED (test data rolled back)';
end $$;
