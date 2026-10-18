-- SPEC step 4: groups, memberships, and the functions to create and join them.

-- ---------------------------------------------------------------------------
-- Tables
-- ---------------------------------------------------------------------------

create table public.groups (
  id uuid primary key default gen_random_uuid(),
  name text not null check (char_length(trim(name)) between 1 and 50),
  -- 6 characters from A–Z and 2–9, minus the look-alikes O, 0, I and 1.
  invite_code text not null unique check (invite_code ~ '^[A-HJ-NP-Z2-9]{6}$'),
  -- Kept (as null) if the creator ever deletes their account.
  created_by uuid references public.profiles (id) on delete set null,
  created_at timestamptz not null default now()
);

-- "Who is in which group." The two-column primary key makes it impossible to
-- be in the same group twice.
create table public.group_members (
  group_id uuid not null references public.groups (id) on delete cascade,
  user_id uuid not null references public.profiles (id) on delete cascade,
  role text not null default 'member' check (role in ('owner', 'member')),
  joined_at timestamptz not null default now(),
  primary key (group_id, user_id)
);

-- The primary key already makes lookups by group_id fast. These indexes do
-- the same for "which groups is this user in?" and for the created_by link.
create index group_members_user_id_idx on public.group_members (user_id);
create index groups_created_by_idx on public.groups (created_by);

alter table public.groups enable row level security;
alter table public.group_members enable row level security;

-- ---------------------------------------------------------------------------
-- Helper: is the logged-in user a member of this group?
-- ---------------------------------------------------------------------------
-- Policies on group_members can't simply query group_members (the policy
-- would trigger itself, forever). `security definer` runs this function as
-- its owner, which skips RLS, so it can check membership directly. It only
-- ever answers about the caller (auth.uid()), so it leaks nothing.

create function public.is_group_member(target_group_id uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.group_members
    where group_id = target_group_id
      and user_id = (select auth.uid())
  );
$$;

-- ---------------------------------------------------------------------------
-- Policies
-- ---------------------------------------------------------------------------

-- groups: read the groups you're in. No insert/update/delete policies, so
-- groups can only be created through create_group() below.
create policy "Members can read their groups"
  on public.groups for select
  to authenticated
  using (public.is_group_member(id));

-- group_members: read the member lists of your groups...
create policy "Members can read their groups' members"
  on public.group_members for select
  to authenticated
  using (public.is_group_member(group_id));

-- ...and delete your own row (leave a group). Rows are only added through
-- create_group() and join_group().
create policy "Users can leave groups"
  on public.group_members for delete
  to authenticated
  using (user_id = (select auth.uid()));

-- profiles: step 3 only let you read yourself. Now also allow reading anyone
-- who shares a group with you.
drop policy "Users can read their own profile" on public.profiles;

create policy "Users can read themselves and their groupmates"
  on public.profiles for select
  to authenticated
  using (
    id = (select auth.uid())
    or exists (
      select 1
      from public.group_members
      where group_members.user_id = profiles.id
        and public.is_group_member(group_members.group_id)
    )
  );

-- ---------------------------------------------------------------------------
-- RPC: create_group(group_name) → new group's id
-- ---------------------------------------------------------------------------
-- Inserts the group AND the creator's owner membership in one transaction:
-- if anything fails, neither row is saved.

create function public.create_group(group_name text)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  alphabet constant text := 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; -- 32 characters
  new_code text;
  new_group_id uuid;
begin
  if auth.uid() is null then
    raise exception 'You must be logged in.';
  end if;

  group_name := trim(group_name);
  if group_name is null or char_length(group_name) not between 1 and 50 then
    raise exception 'Group name must be 1–50 characters.';
  end if;

  -- Pick a random code. If it's already taken (very unlikely), try again.
  for attempt in 1..5 loop
    new_code := '';
    for i in 1..6 loop
      -- A cryptographically random byte (0–255), mapped onto the alphabet.
      -- 256 is a multiple of 32, so every character is equally likely.
      new_code := new_code || substr(
        alphabet,
        get_byte(extensions.gen_random_bytes(1), 0) % 32 + 1,
        1
      );
    end loop;

    begin
      insert into public.groups (name, invite_code, created_by)
      values (group_name, new_code, auth.uid())
      returning id into new_group_id;
      exit; -- success: leave the loop
    exception when unique_violation then
      -- Code already in use; loop around and try a new one.
    end;
  end loop;

  if new_group_id is null then
    raise exception 'Could not generate an invite code. Please try again.';
  end if;

  insert into public.group_members (group_id, user_id, role)
  values (new_group_id, auth.uid(), 'owner');

  return new_group_id;
end;
$$;

-- ---------------------------------------------------------------------------
-- RPC: join_group(code) → the group's id
-- ---------------------------------------------------------------------------
-- Before joining you're not a member, so RLS hides the group from you. This
-- function looks the code up on your behalf and adds only you.

create function public.join_group(code text)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  target_group_id uuid;
begin
  if auth.uid() is null then
    raise exception 'You must be logged in.';
  end if;

  select id into target_group_id
  from public.groups
  where invite_code = upper(trim(code));

  if target_group_id is null then
    raise exception 'No group found with that invite code.';
  end if;

  -- Already a member? Then nothing changes (and your role is kept).
  insert into public.group_members (group_id, user_id, role)
  values (target_group_id, auth.uid(), 'member')
  on conflict (group_id, user_id) do nothing;

  return target_group_id;
end;
$$;

-- ---------------------------------------------------------------------------
-- Who may call these functions
-- ---------------------------------------------------------------------------
-- New functions are callable by everyone by default, including logged-out
-- visitors (anon). Restrict all three to logged-in users.

revoke execute on function public.is_group_member(uuid) from public, anon;
revoke execute on function public.create_group(text) from public, anon;
revoke execute on function public.join_group(text) from public, anon;

grant execute on function public.is_group_member(uuid) to authenticated;
grant execute on function public.create_group(text) to authenticated;
grant execute on function public.join_group(text) to authenticated;
