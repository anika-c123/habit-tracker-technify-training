"use client";

import { useActionState } from "react";
import { createHabit } from "@/app/groups/actions";
import { inputClass, primaryButtonClass } from "@/app/ui/styles";

const labelClass = "flex flex-col gap-1.5 text-lg";

export function NewHabitForm({ groupId }: { groupId: string }) {
  // .bind() pre-fills the first argument, so the action knows which group.
  const [state, formAction, pending] = useActionState(
    createHabit.bind(null, groupId),
    {},
  );

  return (
    <form action={formAction} className="flex flex-col gap-6">
      <label className={labelClass}>
        Habit
        <input
          name="name"
          required
          maxLength={50}
          placeholder="e.g. Drink 8 glasses of water"
          autoComplete="off"
          className={`h-12 ${inputClass}`}
        />
      </label>
      <label className={labelClass}>
        <span>
          Description <span className="italic text-muted">(optional)</span>
        </span>
        <textarea
          name="description"
          maxLength={200}
          rows={3}
          className={`py-3 ${inputClass}`}
        />
      </label>

      {state.error && (
        <p aria-live="polite" className="text-coral-ink">
          {state.error}
        </p>
      )}

      <button
        disabled={pending}
        className={primaryButtonClass}
      >
        {pending ? "Adding…" : "Add habit"}
      </button>
    </form>
  );
}
