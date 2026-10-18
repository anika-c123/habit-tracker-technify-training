# Habit Tracker — Spec (v1)

## 1. Overview

A mobile-first web app where small groups of friends keep each other accountable on shared daily habits.

**v1 goal:** sign up → create or join a private group → add a shared habit → check it off each day → see how everyone in the group is doing today and over the past week.

**Non-goals for v1:** push notifications, streaks/gamification, non-daily habits (e.g. "3× a week"), editing past days, public groups, native mobile apps.

**Decisions / defaults**

- Framework: Next.js (App Router) + TypeScript + Tailwind CSS.
- Auth: Supabase email + password.
- Habits are daily only.
- "Today" = the user's **local** calendar date (computed in the browser).

## 2. User stories & acceptance criteria

| # | Story | Done when… |
|---|---|---|
| 1 | Sign up / log in / log out | Email + password works. Logged-out users who visit app pages are redirected to `/login`. New users set a display name. |
| 2 | Create a group | User enters a name and gets a group with a unique 6-character invite code. The creator becomes the group's `owner`. |
| 3 | Join a group | Entering a valid invite code adds the user as a `member`. An invalid code shows a friendly error. Joining a group you're already in changes nothing. |
| 4 | Create a shared habit | Any group member can add a habit (name + optional description). All members see it. |
| 5 | Check off / undo today | One tap toggles today's completion for the current user only. The UI updates immediately. |
| 6 | See today | For each habit, show which members have and haven't completed it today. |
| 7 | See the past week | A 7-day grid (today + previous 6 days) of members × days, per habit. |
| 8 | Privacy | A user who isn't in a group cannot see that group's habits, members, or completions — even by calling the API directly. |

## 3. Screens (designed for ~375px wide phones first)

- `/login`, `/signup` — auth forms.
- `/groups` — list of my groups, plus "Create group" and "Join with code".
- `/groups/[id]` — group home with two tabs:
  - **Today**: each habit with my checkbox and avatars/initials of members who are done.
  - **Week**: a members × 7-days grid per habit.
  - Also shows the invite code (tap to copy) and the member list.
- `/groups/[id]/habits/new` — create a habit.

## 4. Tools, explained

| Tool | What it is | Why we use it |
|---|---|---|
| **Next.js** | A framework built on React. React lets you build UI out of reusable *components*; Next.js adds pages (each folder in `app/` becomes a URL) and lets you run code on the server too. | One project holds both the UI and the server logic, and it's what Vercel is built for. |
| **TypeScript** | JavaScript with *types* — you declare "this is a string", "this object has a `name`". | Your editor catches typos and wrong data shapes before you even run the app. |
| **Tailwind CSS** | Styling with small class names right in your markup, e.g. `p-4 text-lg rounded`. | Fast to build responsive, mobile-first layouts without juggling separate CSS files. |
| **Supabase** | A hosted backend service. | We don't have to build or run our own server/database. It gives us: |
| ↳ Auth | Sign-up, login, sessions, password resets. | We never store or handle passwords ourselves. |
| ↳ Postgres | A real SQL database. | All app data (groups, habits, check-offs) lives here permanently. |
| ↳ Row Level Security (RLS) | Rules attached to each table: "a user may only see/change rows where …". | The **database itself** enforces privacy, so even a buggy or tampered-with frontend can't read another group's data. |
| **Supabase CLI + migrations** | A command-line tool. Each database change is saved as a numbered `.sql` file in `supabase/migrations/`. | The database design is tracked in git like code, and can be re-created from scratch. |
| **Vercel** | Hosting for Next.js apps. | Push to GitHub → it deploys automatically. Each branch gets its own preview URL. |
| **PWA** (later) | "Progressive Web App": a manifest file + service worker. | Lets friends "Add to Home Screen" and open it like a native app. |

## 5. Database structure

### In plain English

Think of each table as a spreadsheet tab:

- **profiles** — one row per person (their display name). Linked 1:1 to Supabase's built-in user account.
- **groups** — one row per friend group (name + invite code).
- **group_members** — the "who's in which group" list. Each row says *"this person is in this group, with this role"*. A person can be in many groups; a group has many people.
- **habits** — one row per shared habit. Each habit belongs to exactly one group.
- **completions** — one row each time a person checks off a habit for a given day. **Undo = delete that row.** No row = not done.

```
auth.users ──1:1── profiles
profiles ──< group_members >── groups ──< habits ──< completions >── profiles
            (many-to-many)                (one-to-many)
```

### Tables

| Table | Columns | Notes |
|---|---|---|
| `profiles` | `id uuid PK → auth.users.id`, `display_name text`, `created_at timestamptz` | Created automatically by a database trigger when someone signs up. |
| `groups` | `id uuid PK`, `name text`, `invite_code text UNIQUE`, `created_by uuid → profiles`, `created_at` | Invite code: 6 chars from `A–Z` and `2–9`, excluding look-alikes (`O`, `0`, `I`, `1`). |
| `group_members` | `group_id uuid → groups`, `user_id uuid → profiles`, `role text` (`'owner'` or `'member'`), `joined_at`; **primary key (group_id, user_id)** | The two-column key makes it impossible to be in the same group twice. |
| `habits` | `id uuid PK`, `group_id uuid → groups`, `name text`, `description text null`, `created_by uuid → profiles`, `created_at`, `archived_at timestamptz null` | "Archiving" hides a habit but keeps its history. |
| `completions` | `id uuid PK`, `habit_id uuid → habits`, `user_id uuid → profiles`, `completed_on date`, `created_at`; **UNIQUE (habit_id, user_id, completed_on)** | The unique rule means a double-tap can't create duplicate check-offs. |

**Why `completed_on` is a date sent from the browser:** friends may be in different time zones. If the server decided what "today" is, someone's day might roll over at 5pm. The browser sends its local date (`YYYY-MM-DD`), and the database only accepts dates within ±1 day of the server's date — so nobody can backfill last month.

## 6. Permissions (RLS rules)

A helper function `is_group_member(group_id)` returns true if the logged-in user (`auth.uid()`) is in that group. It's marked `security definer` so it can check `group_members` without tripping over that table's own rules. Every policy below uses it.

| Table | Read | Create | Update / Delete |
|---|---|---|---|
| `profiles` | Yourself + anyone who shares a group with you | (trigger only) | Update your own only |
| `groups` | Groups you're a member of | Only via `create_group(name)` RPC | — |
| `group_members` | Member lists of your groups | Only via `create_group` / `join_group(code)` RPCs | Delete your own row (leave group) |
| `habits` | Habits in your groups | Members of that group | Creator or group owner |
| `completions` | Completions for habits in your groups | Only `user_id = you`, habit in your group, date within ±1 day | Delete only your own |

**Why RPCs (database functions) for create/join?**

- `create_group(name)` must insert the group *and* your owner membership together — if one failed, you'd have an orphan group. A function does both in one transaction.
- `join_group(code)`: before joining, you aren't a member, so RLS won't let you look up the group by its code. The function safely does that lookup on your behalf and adds only you.

## 7. Implementation steps

Each step is small, ends with something you can see or test, and gets its own commit. Do them in order.

1. **Scaffold** — `create-next-app` (TypeScript, Tailwind, App Router, ESLint); placeholder home page; push to GitHub; connect the repo to Vercel.
   *Check:* the Vercel URL shows the placeholder page.
2. **Supabase setup** — create a Supabase project; install the Supabase CLI and `@supabase/ssr`; add `.env.local` (git-ignored) and `.env.example`; create client helpers for browser, server, and middleware.
   *Check:* app runs locally and can read the (empty) session without errors.
3. **Profiles + auth** — migration `profiles` (table, sign-up trigger, RLS); sign-up / log-in / log-out pages; middleware that redirects logged-out users.
   *Check:* sign up → a `profiles` row appears; visiting `/groups` while logged out redirects to `/login`.
4. **Groups schema** — migration `groups` (`groups`, `group_members`, `is_group_member`, RLS, `create_group`, `join_group`).
   *Check:* SQL tests show user B can't read user A's group until B joins with the code.
5. **Groups UI** — `/groups` list, create form, join-by-code form, group page with invite code + members.
   *Check:* using two browsers (or a private window), two accounts end up in the same group.
6. **Habits** — migration `habits` + RLS; create-habit form; habit list on the group page.
   *Check:* a habit created by user A appears for user B.
7. **Completions** — migration `completions` + RLS; today's checkbox with instant (optimistic) update and undo.
   *Check:* tap → refresh → still checked; tap again → row deleted.
8. **Today view** — per habit, show who's done and who isn't.
   *Check:* both users see each other's check-offs.
9. **Week view** — 7-day grid, loaded with a single date-range query.
   *Check:* grid matches the rows in the `completions` table.
10. **Polish** — empty, loading, and error states; test on a real phone; tap targets ≥ 44px.
11. **Production deploy** — set env vars in Vercel; add the Vercel URL to Supabase Auth redirect URLs.
    *Check:* the full flow works on the live site from a phone.
12. **PWA** (later) — `app/manifest.ts`, app icons, theme color, minimal service worker.
    *Check:* "Add to Home Screen" works on iOS and Android and opens full-screen.

## 8. Future ideas (not v1)

Streaks, reminders/push notifications, weekly-target habits, regenerating invite codes, removing members, avatars, editing past days.
