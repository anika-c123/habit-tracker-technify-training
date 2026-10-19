"use client";

import { useOptimistic, useState, useTransition } from "react";
import { setCompletion } from "@/app/groups/actions";
import { useToday } from "@/lib/use-today";
import { memberColor } from "./member-colors";

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
      // If it fails, the checkbox flips back on its own; say why.
      try {
        const result = await setCompletion(habitId, today, next);
        if (result.error) setError(result.error);
      } catch {
        // The request never reached the server (e.g. no signal).
        setError("Couldn't reach the server. Check your connection and try again.");
      }
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
    <div className="flex flex-col rounded-2xl bg-white">
      <button
        type="button"
        role="checkbox"
        aria-checked={optimisticDone}
        disabled={today === null}
        onClick={toggle}
        className="flex min-h-14 w-full items-start gap-4 px-5 pt-5 pb-3 text-left"
      >
        <span
          aria-hidden
          className={`mt-0.5 flex size-8 shrink-0 items-center justify-center rounded-full border-2 border-green text-white ${
            optimisticDone ? "bg-green" : "bg-transparent"
          }`}
        >
          {optimisticDone && "✓"}
        </span>
        <span className="flex flex-col">
          <span className="font-heading text-xl">{name}</span>
          {description && (
            <span className="italic text-lavender-ink">{description}</span>
          )}
        </span>
      </button>
      {error && (
        <p aria-live="polite" className="px-5 pb-2 pl-17 text-coral-ink">
          {error}
        </p>
      )}

      {/* Who's done today. Hidden until the browser knows what "today" is. */}
      {today !== null && (
        <div className="flex items-center justify-between gap-3 px-5 pb-5 pl-17">
          <ul className="flex flex-wrap gap-x-4 gap-y-1">
            {memberStatus.map((member, index) => (
              <li key={member.userId} className="flex items-center gap-1.5">
                <span
                  aria-hidden
                  className={`size-2.5 rounded-full border-[1.5px] ${memberColor(index).ring} ${
                    member.done ? memberColor(index).dot : "bg-transparent"
                  }`}
                />
                <span className={member.done ? "text-foreground" : "text-muted"}>
                  {member.userId === myUserId ? "You" : member.name}
                </span>
                <span className="sr-only">{member.done ? " (done)" : " (not yet)"}</span>
              </li>
            ))}
          </ul>
          <span className="shrink-0 rounded-full bg-green-pale px-3 py-0.5 text-green-ink">
            {doneCount} / {members.length} done
          </span>
        </div>
      )}
    </div>
  );
}
