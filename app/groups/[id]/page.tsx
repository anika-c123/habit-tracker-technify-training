import { Suspense } from "react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { requireUser } from "@/lib/auth";
import { SectionHeading } from "@/app/ui/section-heading";
import { addDays, toDateString } from "@/lib/dates";
import { CopyCodeButton } from "./copy-code-button";
import { LeaveGroupButton } from "./leave-group-button";
import { accentColor } from "@/app/ui/colors";
import { TodayHabit } from "./today-habit";
import { ViewTabs } from "./view-tabs";
import { WeekHabit } from "./week-habit";

async function GroupDetails({ params }: Pick<PageProps<"/groups/[id]">, "params">) {
  const { id } = await params;
  const { supabase, userId } = await requireUser();

  // Group ids are UUIDs. Anything else is a broken link, not a server error
  // (the database would reject it as invalid input).
  if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id)) {
    notFound();
  }

  // The server doesn't know the user's time zone, but the user's "today" is
  // always within a day of the server's. So one query for everyone's
  // check-offs from 7 days ago to tomorrow (server time) covers both views:
  // today, and the 7 days ending today. The browser picks out what it needs.
  const serverToday = toDateString(new Date());

  // Run the queries at the same time. RLS returns nothing if you're not a
  // member, so outsiders get the same "not found" as a bad link.
  const [groupResult, habitsResult, membersResult, completionsResult] = await Promise.all([
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
    supabase
      .from("completions")
      // completions has no group_id, so join to habits and filter on theirs.
      // "!inner" means: only keep completions whose habit matches the filter.
      .select("habit_id, user_id, completed_on, habits!inner(group_id)")
      .eq("habits.group_id", id)
      .gte("completed_on", addDays(serverToday, -7))
      .lte("completed_on", addDays(serverToday, 1)),
  ]);

  // A query that fails (e.g. the network drops) is different from "no rows":
  // show the error page with "Try again" instead of a misleading empty page.
  const failed = [groupResult, habitsResult, membersResult, completionsResult].find(
    (result) => result.error,
  );
  if (failed) {
    throw new Error(`Couldn't load group: ${failed.error?.message}`);
  }

  const group = groupResult.data;
  if (!group) {
    notFound();
  }

  const habits = habitsResult.data ?? [];
  const members = membersResult.data ?? [];
  const completions = completionsResult.data ?? [];
  const memberNames = members.map((member) => ({
    userId: member.user_id,
    name: member.profiles?.display_name ?? "Unknown",
  }));
  const completionsFor = (habitId: string) =>
    completions
      .filter((c) => c.habit_id === habitId)
      .map((c) => ({ userId: c.user_id, date: c.completed_on }));
  const plural = (n: number, word: string) => `${n} ${word}${n === 1 ? "" : "s"}`;

  return (
    <>
      <header className="flex flex-col gap-1">
        <h1 className="text-5xl font-medium tracking-tight">{group.name}</h1>
        <p className="italic text-muted">
          {plural(members.length, "member")} · {plural(habits.length, "habit")}
        </p>
      </header>

      {/* -mx-4 px-4 lets the pale blue panel reach the screen edges on phones. */}
      <section className="-mx-4 flex flex-col gap-6 bg-sky-pale px-4 py-8">
        <div className="flex items-start justify-between">
          <SectionHeading color="sky">Habits</SectionHeading>
          <Link
            href={`/groups/${id}/habits/new`}
            className="-mr-2 flex h-11 items-center px-2 text-lg text-coral-ink"
          >
            + Add habit
          </Link>
        </div>
        {habits.length === 0 ? (
          <p className="rounded-2xl bg-white p-6 text-center italic text-muted">
            No habits yet. Add the first one for your group.
          </p>
        ) : (
          <ViewTabs
            today={
              <div className="flex flex-col gap-4">
                <ul className="flex flex-col gap-3">
                  {habits.map((habit) => (
                    <li key={habit.id}>
                      <TodayHabit
                        habitId={habit.id}
                        name={habit.name}
                        description={habit.description}
                        members={memberNames}
                        myUserId={userId}
                        completions={completionsFor(habit.id)}
                      />
                    </li>
                  ))}
                </ul>
                <p className="italic text-muted">Tap a habit to check it off for today.</p>
              </div>
            }
            week={
              <ul className="flex flex-col gap-3">
                {habits.map((habit) => (
                  <li key={habit.id}>
                    <WeekHabit
                      name={habit.name}
                      members={memberNames}
                      myUserId={userId}
                      completions={completionsFor(habit.id)}
                    />
                  </li>
                ))}
              </ul>
            }
          />
        )}
      </section>

      <section className="flex flex-col gap-6">
        <SectionHeading color="lavender">Invite friends</SectionHeading>
        {members.length === 1 && (
          <p className="italic text-muted">
            It&apos;s just you so far. Share the invite code so friends can join.
          </p>
        )}
        <CopyCodeButton code={group.invite_code} />
      </section>

      <section className="flex flex-col gap-4">
        <SectionHeading color="coral">Members</SectionHeading>
        <ul className="flex flex-col divide-y divide-dashed divide-muted/30">
          {members.map((member, index) => {
            const name = member.profiles?.display_name ?? "Unknown";
            return (
              <li key={member.user_id} className="flex min-h-18 items-center gap-4 py-3">
                <span
                  aria-hidden
                  className={`flex size-11 shrink-0 items-center justify-center rounded-full font-heading text-lg ${accentColor(index).avatar}`}
                >
                  {name.charAt(0).toUpperCase()}
                </span>
                <span className="flex-1 text-lg">
                  {name}
                  {member.user_id === userId && (
                    <span className="italic text-muted"> (you)</span>
                  )}
                </span>
                {member.role === "owner" && (
                  <span className="italic text-coral-ink">owner</span>
                )}
              </li>
            );
          })}
        </ul>
      </section>

      <LeaveGroupButton
        groupId={id}
        groupName={group.name}
        isLastMember={members.length === 1}
      />
    </>
  );
}

// Pale placeholder shapes shown while the group loads, roughly matching the
// real layout so the page doesn't jump around when it arrives.
function GroupSkeleton() {
  return (
    <div aria-busy="true" className="flex animate-pulse flex-col gap-10">
      <span className="sr-only">Loading group…</span>
      <div className="flex flex-col gap-2">
        <div className="h-12 w-2/3 rounded-md bg-muted/15" />
        <div className="h-5 w-1/3 rounded-md bg-muted/15" />
      </div>
      <div className="-mx-4 h-72 bg-sky-pale" />
      <div className="h-20 rounded-2xl bg-lavender-pale" />
    </div>
  );
}

export default function GroupPage({ params }: PageProps<"/groups/[id]">) {
  return (
    <main className="mx-auto flex w-full max-w-md flex-1 flex-col gap-12 px-4 py-8">
      <Link
        href="/groups"
        className="-mb-8 -ml-2 flex h-11 w-fit items-center px-2 text-lg text-muted hover:text-foreground"
      >
        ← Your groups
      </Link>
      {/* The group id comes from the URL, which is request-time data. */}
      <Suspense fallback={<GroupSkeleton />}>
        <GroupDetails params={params} />
      </Suspense>
    </main>
  );
}
