"use client";

import { useActionState } from "react";
import { createHabit } from "@/app/groups/actions";

const inputClass =
  "w-full rounded-lg border border-foreground/20 bg-transparent px-3 text-base outline-none focus:border-foreground";

export function NewHabitForm({ groupId }: { groupId: string }) {
  // .bind() pre-fills the first argument, so the action knows which group.
  const [state, formAction, pending] = useActionState(
    createHabit.bind(null, groupId),
    {},
  );

  return (
    <form action={formAction} className="flex flex-col gap-4">
      <label className="flex flex-col gap-1 text-sm font-medium">
        Habit
        <input
          name="name"
          required
          maxLength={50}
          placeholder="e.g. Drink 8 glasses of water"
          autoComplete="off"
          className={`h-11 ${inputClass}`}
        />
      </label>
      <label className="flex flex-col gap-1 text-sm font-medium">
        <span>
          Description <span className="font-normal text-foreground/60">(optional)</span>
        </span>
        <textarea
          name="description"
          maxLength={200}
          rows={3}
          className={`py-2 ${inputClass}`}
        />
      </label>

      {state.error && (
        <p aria-live="polite" className="text-sm text-red-600">
          {state.error}
        </p>
      )}

      <button
        disabled={pending}
        className="h-11 rounded-lg bg-foreground font-medium text-background disabled:opacity-60"
      >
        {pending ? "Adding…" : "Add habit"}
      </button>
    </form>
  );
}
