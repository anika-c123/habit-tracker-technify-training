# CLAUDE.md

A mobile-first habit tracker for small friend groups: users join private groups via invite code, share daily habits, check them off, and see everyone's progress for today and the past week.

**`SPEC.md` is the source of truth** for scope, database design, permissions, and the ordered implementation steps. Read it before starting work.

## Stack

- Next.js 16 (App Router, Turbopack, `cacheComponents` on) + React 19 + TypeScript (strict mode). This version has APIs newer than most training data: check `node_modules/next/dist/docs/` before using an unfamiliar API (see `AGENTS.md`).
- Tailwind CSS v4 (configured in `app/globals.css`, no `tailwind.config` file)
- Supabase: Auth, Postgres, Row Level Security — via `@supabase/ssr`
- Hosted on Vercel; PWA support comes later (SPEC step 12)

## How to work in this repo

- Implement **one SPEC step at a time**. When a step is done, stop and summarize what changed and how to verify it. Don't start the next step until asked.
- The owner is learning. Briefly explain new concepts as you introduce them, and prefer simple, readable code over clever abstractions.
- Ask before adding any dependency not listed in the stack above.
- Don't build features from SPEC "Future ideas" unless asked.

## Commands

- `npm run dev` — local dev server at http://localhost:3000
- `npm run lint` — ESLint
- `npm run build` — production build + type check (run before calling a step done)
- `npx supabase migration new <name>` — create a new migration file
- `npx supabase db push` — apply migrations to the linked Supabase project

## Database rules

- Every schema change is a **new** file in `supabase/migrations/`. Never edit a migration that has already been applied.
- Every new table enables RLS **in the same migration** that creates it, with its policies.
- Group-scoped access checks use the `is_group_member(group_id)` helper.
- Writes that touch multiple rows/tables (creating or joining a group) go through RPC functions, not separate client inserts.

## Security rules

- Client code only ever uses the Supabase **anon** key. Never use or expose the `service_role` key in app code.
- Never commit `.env*` files except `.env.example`.
- Authorization lives in RLS. Hiding a button in the UI is not a permission check.

## Code conventions

- Prefer Server Components and Server Actions; use `"use client"` components only for interactivity (toggles, forms).
- Mobile-first Tailwind: design for ~375px wide first; tap targets at least 44px.
- Dates are `YYYY-MM-DD` strings in the user's local time zone, produced by one shared helper (don't scatter `new Date()` formatting).

## Git

- Small commits, one per SPEC step (or smaller).
- Don't push or deploy without asking.
