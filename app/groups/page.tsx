import { Suspense } from "react";
import Link from "next/link";
import { requireUser } from "@/lib/auth";
import { logOut } from "@/app/auth/actions";
import { accentColor } from "@/app/ui/colors";
import { SectionHeading } from "@/app/ui/section-heading";
import { CreateGroupForm, JoinGroupForm } from "./group-forms";

async function MyGroups() {
  const { supabase } = await requireUser();

  // No "where am I a member" filter needed: RLS only returns my groups.
  // `group_members(count)` asks Supabase to count each group's members too.
  const { data: groups, error } = await supabase
    .from("groups")
    .select("id, name, group_members(count)")
    .order("name");

  if (error) {
    return <p className="text-coral-ink">Couldn&apos;t load your groups.</p>;
  }

  if (groups.length === 0) {
    return (
      <p className="rounded-2xl bg-white p-6 text-center italic text-muted">
        You&apos;re not in any groups yet. Start one below, or join with a code
        from a friend.
      </p>
    );
  }

  return (
    <ul className="flex flex-col gap-3">
      {groups.map((group, index) => {
        const memberCount = group.group_members[0]?.count ?? 0;
        return (
          <li key={group.id}>
            <Link
              href={`/groups/${group.id}`}
              className="flex min-h-18 items-center gap-4 rounded-2xl bg-white px-5 py-4"
            >
              <span
                aria-hidden
                className={`flex size-11 shrink-0 items-center justify-center rounded-full font-heading text-lg ${accentColor(index).avatar}`}
              >
                {group.name.charAt(0).toUpperCase()}
              </span>
              <span className="flex flex-1 flex-col">
                <span className="font-heading text-xl">{group.name}</span>
                <span className="italic text-muted">
                  {memberCount} {memberCount === 1 ? "member" : "members"}
                </span>
              </span>
              <span aria-hidden className="text-xl text-muted">
                →
              </span>
            </Link>
          </li>
        );
      })}
    </ul>
  );
}

export default function GroupsPage() {
  return (
    <main className="mx-auto flex w-full max-w-md flex-1 flex-col gap-12 px-4 py-8">
      <header className="flex items-start justify-between gap-4">
        <div className="flex flex-col gap-3">
          <h1 className="text-5xl font-medium tracking-tight">Your groups</h1>
          <p className="italic text-muted">Daily habits, with friends.</p>
        </div>
        <form action={logOut}>
          <button className="-mr-2 h-11 px-2 text-lg text-muted hover:text-foreground">
            Log out
          </button>
        </form>
      </header>

      {/* -mx-4 px-4 lets the pale blue panel reach the screen edges on phones. */}
      <section className="-mx-4 bg-sky-pale px-4 py-8">
        <Suspense
          fallback={
            // Pale placeholder cards while your groups load.
            <div aria-busy="true" className="flex animate-pulse flex-col gap-3">
              <span className="sr-only">Loading groups…</span>
              <div className="h-18 rounded-2xl bg-white" />
              <div className="h-18 rounded-2xl bg-white" />
            </div>
          }
        >
          <MyGroups />
        </Suspense>
      </section>

      <section className="flex flex-col gap-6">
        <SectionHeading color="lavender">Start a group</SectionHeading>
        <CreateGroupForm />
      </section>

      <section className="flex flex-col gap-6">
        <SectionHeading color="coral">Join a group</SectionHeading>
        <JoinGroupForm />
      </section>
    </main>
  );
}
