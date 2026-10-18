-- SPEC step 3: one profile row per user, holding their display name.

create table public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  display_name text not null
    check (char_length(trim(display_name)) between 1 and 50),
  created_at timestamptz not null default now()
);

-- Row Level Security: with RLS on and no policy, nobody can touch a row.
-- Each policy below opens up exactly one kind of access.
alter table public.profiles enable row level security;

-- Read: for now you can only see yourself. Step 4 widens this to "anyone who
-- shares a group with you", once group_members exists.
create policy "Users can read their own profile"
  on public.profiles for select
  to authenticated
  using (id = (select auth.uid()));

-- Update: only your own row.
create policy "Users can update their own profile"
  on public.profiles for update
  to authenticated
  using (id = (select auth.uid()))
  with check (id = (select auth.uid()));

-- On top of the policy, only allow changing display_name (not id or created_at).
revoke update on public.profiles from anon, authenticated;
grant update (display_name) on public.profiles to authenticated;

-- No insert or delete policies: rows are created by the trigger below and
-- removed automatically (on delete cascade) when the auth user is deleted.

-- Sign-up trigger: when Supabase Auth creates a user, create their profile.
-- The display name comes from the sign-up form (sent as user metadata);
-- if it's missing, fall back to the part of the email before the "@".
-- `security definer` runs this as the function's owner so it can insert past
-- RLS; `search_path = ''` makes every table name explicit, which is safer.
create function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.profiles (id, display_name)
  values (
    new.id,
    left(
      coalesce(
        nullif(trim(new.raw_user_meta_data ->> 'display_name'), ''),
        split_part(new.email, '@', 1)
      ),
      50
    )
  );
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();
