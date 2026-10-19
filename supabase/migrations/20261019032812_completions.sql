-- SPEC step 7: one row each time a person checks off a habit for a day.
-- Undo = delete that row. No row = not done.

create table public.completions (
  id uuid primary key default gen_random_uuid(),
  habit_id uuid not null references public.habits (id) on delete cascade,
  -- Filled in automatically with whoever is logged in.
  user_id uuid not null default auth.uid() references public.profiles (id) on delete cascade,
  -- The day it was done, in the user's local time zone (sent by the browser).
  completed_on date not null,
  created_at timestamptz not null default now(),
  -- A double-tap can't check off the same habit twice on the same day.
  unique (habit_id, user_id, completed_on)
);

-- The unique constraint above already speeds up lookups by habit_id.
create index completions_user_id_idx on public.completions (user_id);

alter table public.completions enable row level security;

-- Read: completions for habits in your groups (so you see your friends' too).
create policy "Members can read completions in their groups"
  on public.completions for select
  to authenticated
  using (
    exists (
      select 1 from public.habits
      where habits.id = completions.habit_id
        and public.is_group_member(habits.group_id)
    )
  );

-- Create: only for yourself, only on an active habit in one of your groups,
-- and only for a date within ±1 day of the server's date. Friends may be in
-- different time zones, so "today" can differ by a day — but nobody can
-- backfill last month.
create policy "Users can check off habits for themselves"
  on public.completions for insert
  to authenticated
  with check (
    user_id = (select auth.uid())
    and completed_on between current_date - 1 and current_date + 1
    and exists (
      select 1 from public.habits
      where habits.id = completions.habit_id
        and habits.archived_at is null
        and public.is_group_member(habits.group_id)
    )
  );

-- Delete (undo): only your own, and with the same date window, since editing
-- past days is out of scope for v1. There's no update policy: changing a
-- completion means deleting it.
create policy "Users can undo their own recent check-offs"
  on public.completions for delete
  to authenticated
  using (
    user_id = (select auth.uid())
    and completed_on between current_date - 1 and current_date + 1
  );
