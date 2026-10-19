import { Suspense } from "react";
import Link from "next/link";
import { requireUser } from "@/lib/auth";
import { logOut } from "@/app/auth/actions";
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
    return <p className="text-sm text-red-600">Couldn&apos;t load your groups.</p>;
  }

  if (groups.length === 0) {
    return (
      <p className="rounded-lg border border-dashed border-foreground/20 p-4 text-center text-sm text-foreground/70">
        You&apos;re not in any groups yet. Create one, or join with a code from a
        friend.
      </p>
    );
  }

  return (
    <ul className="flex flex-col gap-2">
      {groups.map((group) => {
        const memberCount = group.group_members[0]?.count ?? 0;
        return (
          <li key={group.id}>
            <Link
              href={`/groups/${group.id}`}
              className="flex min-h-14 items-center justify-between rounded-lg border border-foreground/15 px-4 py-3 hover:bg-foreground/5"
            >
              <span className="font-medium">{group.name}</span>
              <span className="text-sm text-foreground/60">
                {memberCount} {memberCount === 1 ? "member" : "members"}
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
    <main className="mx-auto flex w-full max-w-md flex-1 flex-col gap-8 px-4 py-8">
      <header className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold tracking-tight">Your groups</h1>
        <form action={logOut}>
          <button className="h-11 rounded-lg px-3 text-sm text-foreground/70 hover:text-foreground">
            Log out
          </button>
        </form>
      </header>

      <Suspense
        fallback={
          // Grey placeholder rows while your groups load.
          <div aria-busy="true" className="flex animate-pulse flex-col gap-2">
            <span className="sr-only">Loading groups…</span>
            <div className="h-14 rounded-lg bg-foreground/10" />
            <div className="h-14 rounded-lg bg-foreground/10" />
          </div>
        }
      >
        <MyGroups />
      </Suspense>

      <section className="flex flex-col gap-6 border-t border-foreground/10 pt-6">
        <CreateGroupForm />
        <JoinGroupForm />
      </section>
    </main>
  );
}
