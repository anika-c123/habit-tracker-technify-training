import { Suspense } from "react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { requireUser } from "@/lib/auth";
import { CopyCodeButton } from "./copy-code-button";

async function GroupDetails({ params }: Pick<PageProps<"/groups/[id]">, "params">) {
  const { id } = await params;
  const { supabase, userId } = await requireUser();

  // Run both queries at the same time. RLS returns nothing if you're not a
  // member, so outsiders get the same "not found" as a bad link.
  const [groupResult, habitsResult, membersResult] = await Promise.all([
    supabase.from("groups").select("name, invite_code").eq("id", id).maybeSingle(),
    supabase
      .from("habits")
      .select("id, name, description")
      .eq("group_id", id)
      .is("archived_at", null)
      .order("created_at"),
    supabase
      .from("group_members")
      // profiles(display_name) follows the user_id link to each member's profile.
      .select("user_id, role, profiles(display_name)")
      .eq("group_id", id)
      .order("joined_at"),
  ]);

  const group = groupResult.data;
  if (groupResult.error || !group) {
    notFound();
  }

  const habits = habitsResult.data ?? [];
  const members = membersResult.data ?? [];

  return (
    <>
      <h1 className="text-2xl font-semibold tracking-tight">{group.name}</h1>

      <section className="flex flex-col gap-2">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-medium text-foreground/70">
            Habits ({habits.length})
          </h2>
          <Link
            href={`/groups/${id}/habits/new`}
            className="-mr-2 flex h-11 items-center px-2 text-sm font-medium"
          >
            + Add habit
          </Link>
        </div>
        {habits.length === 0 ? (
          <p className="rounded-lg border border-dashed border-foreground/20 p-4 text-center text-sm text-foreground/70">
            No habits yet. Add the first one for your group.
          </p>
        ) : (
          <ul className="flex flex-col divide-y divide-foreground/10 rounded-lg border border-foreground/15">
            {habits.map((habit) => (
              <li key={habit.id} className="flex min-h-12 flex-col justify-center px-4 py-2">
                <span className="font-medium">{habit.name}</span>
                {habit.description && (
                  <span className="text-sm text-foreground/60">{habit.description}</span>
                )}
              </li>
            ))}
          </ul>
        )}
      </section>

      <CopyCodeButton code={group.invite_code} />

      <section className="flex flex-col gap-2">
        <h2 className="text-sm font-medium text-foreground/70">
          Members ({members.length})
        </h2>
        <ul className="flex flex-col divide-y divide-foreground/10 rounded-lg border border-foreground/15">
          {members.map((member) => (
            <li
              key={member.user_id}
              className="flex min-h-12 items-center justify-between px-4 py-2"
            >
              <span>
                {member.profiles?.display_name ?? "Unknown"}
                {member.user_id === userId && (
                  <span className="text-foreground/60"> (you)</span>
                )}
              </span>
              {member.role === "owner" && (
                <span className="text-xs text-foreground/60">Owner</span>
              )}
            </li>
          ))}
        </ul>
      </section>
    </>
  );
}

export default function GroupPage({ params }: PageProps<"/groups/[id]">) {
  return (
    <main className="mx-auto flex w-full max-w-md flex-1 flex-col gap-6 px-4 py-8">
      <Link
        href="/groups"
        className="-ml-2 flex h-11 w-fit items-center px-2 text-sm text-foreground/70 hover:text-foreground"
      >
        ← Your groups
      </Link>
      {/* The group id comes from the URL, which is request-time data. */}
      <Suspense fallback={<p className="text-sm text-foreground/60">Loading group…</p>}>
        <GroupDetails params={params} />
      </Suspense>
    </main>
  );
}
