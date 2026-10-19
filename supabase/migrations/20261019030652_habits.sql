-- SPEC step 6: shared habits. Each habit belongs to exactly one group.

create table public.habits (
  id uuid primary key default gen_random_uuid(),
  group_id uuid not null references public.groups (id) on delete cascade,
  name text not null check (char_length(trim(name)) between 1 and 50),
  description text check (char_length(description) <= 200),
  -- Filled in automatically with whoever is logged in. Kept (as null) if
  -- that person ever deletes their account.
  created_by uuid default auth.uid() references public.profiles (id) on delete set null,
  created_at timestamptz not null default now(),
  -- "Archiving" hides a habit but keeps its history (set instead of deleting).
  archived_at timestamptz
);

create index habits_group_id_idx on public.habits (group_id);
create index habits_created_by_idx on public.habits (created_by);

alter table public.habits enable row level security;

-- Read: habits in your groups.
create policy "Members can read their groups' habits"
  on public.habits for select
  to authenticated
  using (public.is_group_member(group_id));

-- Create: any member can add a habit to their group, as themselves.
create policy "Members can add habits to their groups"
  on public.habits for insert
  to authenticated
  with check (
    public.is_group_member(group_id)
    and created_by = (select auth.uid())
  );

-- Update / delete: the habit's creator, or the group's owner — and only
-- while they're still in the group.
create policy "Creator or owner can update habits"
  on public.habits for update
  to authenticated
  using (
    public.is_group_member(group_id)
    and (
      created_by = (select auth.uid())
      or exists (
        select 1 from public.group_members
        where group_members.group_id = habits.group_id
          and group_members.user_id = (select auth.uid())
          and group_members.role = 'owner'
      )
    )
  );

create policy "Creator or owner can delete habits"
  on public.habits for delete
  to authenticated
  using (
    public.is_group_member(group_id)
    and (
      created_by = (select auth.uid())
      or exists (
        select 1 from public.group_members
        where group_members.group_id = habits.group_id
          and group_members.user_id = (select auth.uid())
          and group_members.role = 'owner'
      )
    )
  );

-- Updates may only change the text and the archived flag, not move a habit
-- to another group or change who created it.
revoke update on public.habits from anon, authenticated;
grant update (name, description, archived_at) on public.habits to authenticated;
