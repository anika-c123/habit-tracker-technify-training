"use client";

import { useActionState } from "react";
import { inputClass, primaryButtonClass } from "@/app/ui/styles";
import { createGroup, joinGroup, type GroupFormState } from "./actions";

export function CreateGroupForm() {
  return (
    <OneFieldForm
      action={createGroup}
      label="Group name"
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
      label="Invite code"
      inputName="code"
      placeholder="e.g. K7MXQ2"
      submitLabel="Join"
      autoCapitalize="characters"
    />
  );
}

type Props = {
  action: (state: GroupFormState, formData: FormData) => Promise<GroupFormState>;
  label: string;
  inputName: string;
  placeholder: string;
  submitLabel: string;
  maxLength?: number;
  autoCapitalize?: string;
};

// A text input + button, with the action's error shown underneath. The
// section heading above says what it's for, so the label is for screen
// readers only (sr-only hides it visually but keeps it accessible).
function OneFieldForm({
  action,
  label,
  inputName,
  placeholder,
  submitLabel,
  maxLength,
  autoCapitalize,
}: Props) {
  const [state, formAction, pending] = useActionState(action, {});

  return (
    <form action={formAction} className="flex flex-col gap-2">
      <label htmlFor={inputName} className="sr-only">
        {label}
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
          className={`h-12 min-w-0 flex-1 ${inputClass}`}
        />
        <button
          disabled={pending}
          className={`shrink-0 ${primaryButtonClass}`}
        >
          {pending ? "…" : submitLabel}
        </button>
      </div>
      {state.error && (
        <p aria-live="polite" className="text-coral-ink">
          {state.error}
        </p>
      )}
    </form>
  );
}
