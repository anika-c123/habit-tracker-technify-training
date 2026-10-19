"use client";

import { useActionState } from "react";
import { createGroup, joinGroup, type GroupFormState } from "./actions";

export function CreateGroupForm() {
  return (
    <OneFieldForm
      action={createGroup}
      title="Create a group"
      inputName="name"
      placeholder="e.g. Morning Runners"
      maxLength={50}
      submitLabel="Create"
    />
  );
}

export function JoinGroupForm() {
  return (
    <OneFieldForm
      action={joinGroup}
      title="Join with a code"
      inputName="code"
      placeholder="e.g. K7MXQ2"
      submitLabel="Join"
      autoCapitalize="characters"
    />
  );
}

type Props = {
  action: (state: GroupFormState, formData: FormData) => Promise<GroupFormState>;
  title: string;
  inputName: string;
  placeholder: string;
  submitLabel: string;
  maxLength?: number;
  autoCapitalize?: string;
};

// A labeled text input + button, with the action's error shown underneath.
function OneFieldForm({
  action,
  title,
  inputName,
  placeholder,
  submitLabel,
  maxLength,
  autoCapitalize,
}: Props) {
  const [state, formAction, pending] = useActionState(action, {});

  return (
    <form action={formAction} className="flex flex-col gap-2">
      <label htmlFor={inputName} className="text-sm font-medium">
        {title}
      </label>
      <div className="flex gap-2">
        <input
          id={inputName}
          name={inputName}
          required
          placeholder={placeholder}
          maxLength={maxLength}
          autoCapitalize={autoCapitalize}
          autoComplete="off"
          className="h-11 min-w-0 flex-1 rounded-lg border border-foreground/20 bg-transparent px-3 text-base outline-none focus:border-foreground"
        />
        <button
          disabled={pending}
          className="h-11 shrink-0 rounded-lg bg-foreground px-5 font-medium text-background disabled:opacity-60"
        >
          {pending ? "…" : submitLabel}
        </button>
      </div>
      {state.error && (
        <p aria-live="polite" className="text-sm text-red-600">
          {state.error}
        </p>
      )}
    </form>
  );
}
