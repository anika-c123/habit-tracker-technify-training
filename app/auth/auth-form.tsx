"use client";

// Shared form for /login and /signup. It's a Client Component because it
// shows errors and a "pending" state while the Server Action runs.

import Link from "next/link";
import { useActionState } from "react";
import { inputClass as baseInputClass, primaryButtonClass } from "@/app/ui/styles";
import type { AuthFormState } from "./actions";

type Props = {
  action: (state: AuthFormState, formData: FormData) => Promise<AuthFormState>;
  submitLabel: string;
  askDisplayName?: boolean;
  footer: { text: string; linkLabel: string; href: string };
};

const inputClass = `h-12 ${baseInputClass}`;
const labelClass = "flex flex-col gap-1.5 text-lg";

export function AuthForm({ action, submitLabel, askDisplayName, footer }: Props) {
  // useActionState gives us: the latest result from the action, a wrapped
  // action to put on the <form>, and whether a submit is in progress.
  const [state, formAction, pending] = useActionState(action, {});

  return (
    <form action={formAction} className="flex w-full flex-col gap-5">
      {askDisplayName && (
        <label className={labelClass}>
          Display name
          <input
            name="display_name"
            required
            maxLength={50}
            autoComplete="nickname"
            className={inputClass}
          />
        </label>
      )}
      <label className={labelClass}>
        Email
        <input
          name="email"
          type="email"
          required
          autoComplete="email"
          className={inputClass}
        />
      </label>
      <label className={labelClass}>
        Password
        <input
          name="password"
          type="password"
          required
          minLength={6}
          autoComplete={askDisplayName ? "new-password" : "current-password"}
          className={inputClass}
        />
      </label>

      <p aria-live="polite" className="min-h-6">
        {state.error && <span className="text-coral-ink">{state.error}</span>}
        {state.message && <span>{state.message}</span>}
      </p>

      <button
        disabled={pending}
        className={primaryButtonClass}
      >
        {pending ? "Please wait…" : submitLabel}
      </button>

      <p className="text-center text-muted">
        {footer.text}{" "}
        <Link
          href={footer.href}
          // inline-flex + min-h-11 makes the link a 44px-tall tap target.
          className="inline-flex min-h-11 items-center text-coral-ink"
        >
          <span className="border-b border-dashed border-coral-ink">{footer.linkLabel}</span>
        </Link>
      </p>
    </form>
  );
}
