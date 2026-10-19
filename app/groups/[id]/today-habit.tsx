"use client";

import { useOptimistic, useState, useSyncExternalStore, useTransition } from "react";
import { setCompletion } from "@/app/groups/actions";
import { toDateString } from "@/lib/dates";

// "Today" must come from the user's own clock, which only the browser knows.
// While rendering on the server this returns null; React then re-renders in
// the browser with the real date (without a hydration mismatch).
function useToday(): string | null {
  return useSyncExternalStore(
    () => () => {}, // nothing to subscribe to
    () => toDateString(new Date()), // in the browser
    () => null, // on the server
  );
}

export type Member = { userId: string; name: string };
export type Completion = { userId: string; date: string };

type Props = {
  habitId: string;
  name: string;
  description: string | null;
  members: Member[];
  myUserId: string;
  // Everyone's check-offs for this habit on the days near today.
  completions: Completion[];
};

export function TodayHabit({
  habitId,
  name,
  description,
  members,
  myUserId,
  completions,
}: Props) {
  const today = useToday();
  const isDone = (userId: string) =>
    completions.some((c) => c.userId === userId && c.date === today);
  const done = today !== null && isDone(myUserId);

  // Optimistic UI: show the new state immediately, before the server answers.
  // While the save is in progress, `optimisticDone` is what we display; when
  // it finishes, it goes back to following `done` (now fresh from the server).
  const [optimisticDone, setOptimisticDone] = useOptimistic(done);
  const [, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  function toggle() {
    if (today === null) return;
    const next = !optimisticDone;
    setError(null);
    startTransition(async () => {
      setOptimisticDone(next);
      const result = await setCompletion(habitId, today, next);
      // If it failed, the checkbox flips back on its own; say why.
      if (result.error) setError(result.error);
    });
  }

  // My own chip follows the checkbox (optimistic); everyone else's comes
  // from the server.
  const memberStatus = members.map((member) => ({
    ...member,
    done: member.userId === myUserId ? optimisticDone : isDone(member.userId),
  }));
  const doneCount = memberStatus.filter((m) => m.done).length;

  return (
    <div className="flex flex-col">
      <button
        type="button"
        role="checkbox"
        aria-checked={optimisticDone}
        disabled={today === null}
        onClick={toggle}
        className="flex min-h-14 w-full items-center gap-3 px-4 py-2 text-left hover:bg-foreground/5"
      >
        <span
          aria-hidden
          className={`flex size-7 shrink-0 items-center justify-center rounded-full border-2 text-sm font-bold ${
            optimisticDone
              ? "border-green-600 bg-green-600 text-white"
              : "border-foreground/30"
          }`}
        >
          {optimisticDone && "✓"}
        </span>
        <span className="flex flex-col">
          <span className="font-medium">{name}</span>
          {description && (
            <span className="text-sm text-foreground/60">{description}</span>
          )}
        </span>
      </button>
      {error && (
        <p aria-live="polite" className="px-4 pb-2 text-sm text-red-600">
          {error}
        </p>
      )}

      {/* Who's done today. Hidden until the browser knows what "today" is. */}
      {today !== null && (
        <div className="flex flex-col gap-1.5 px-4 pb-3 pl-14">
          <p className="text-xs text-foreground/60">
            {doneCount} of {members.length} done today
          </p>
          <ul className="flex flex-wrap gap-1.5">
            {memberStatus.map((member) => (
              <li
                key={member.userId}
                className={`rounded-full px-2.5 py-0.5 text-xs ${
                  member.done
                    ? "bg-green-600/15 text-green-700 dark:text-green-400"
                    : "border border-dashed border-foreground/25 text-foreground/50"
                }`}
              >
                {member.done && <span aria-hidden>✓ </span>}
                {member.userId === myUserId ? "You" : member.name}
                <span className="sr-only">{member.done ? " (done)" : " (not yet)"}</span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
