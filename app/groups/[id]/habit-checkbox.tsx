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

type Props = {
  habitId: string;
  name: string;
  description: string | null;
  // The days (near today) on which I've done this habit.
  myDoneDates: string[];
};

export function HabitCheckbox({ habitId, name, description, myDoneDates }: Props) {
  const today = useToday();
  const done = today !== null && myDoneDates.includes(today);

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
    </div>
  );
}
