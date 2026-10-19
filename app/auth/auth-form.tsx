"use client";

// Shared form for /login and /signup. It's a Client Component because it
// shows errors and a "pending" state while the Server Action runs.

import Link from "next/link";
import { useActionState } from "react";
import type { AuthFormState } from "./actions";

type Props = {
  action: (state: AuthFormState, formData: FormData) => Promise<AuthFormState>;
  submitLabel: string;
  askDisplayName?: boolean;
  footer: { text: string; linkLabel: string; href: string };
};

const inputClass =
  "h-11 w-full rounded-lg border border-foreground/20 bg-transparent px-3 text-base outline-none focus:border-foreground";

export function AuthForm({ action, submitLabel, askDisplayName, footer }: Props) {
  // useActionState gives us: the latest result from the action, a wrapped
  // action to put on the <form>, and whether a submit is in progress.
  const [state, formAction, pending] = useActionState(action, {});

  return (
    <form action={formAction} className="flex w-full max-w-sm flex-col gap-4">
      {askDisplayName && (
        <label className="flex flex-col gap-1 text-sm font-medium">
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
      <label className="flex flex-col gap-1 text-sm font-medium">
        Email
        <input
          name="email"
          type="email"
          required
          autoComplete="email"
          className={inputClass}
        />
      </label>
      <label className="flex flex-col gap-1 text-sm font-medium">
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

      <p aria-live="polite" className="min-h-5 text-sm">
        {state.error && <span className="text-red-600">{state.error}</span>}
        {state.message && <span>{state.message}</span>}
      </p>

      <button
        disabled={pending}
        className="h-11 rounded-lg bg-foreground font-medium text-background disabled:opacity-60"
      >
        {pending ? "Please wait…" : submitLabel}
      </button>

      <p className="text-center text-sm text-foreground/70">
        {footer.text}{" "}
        <Link
          href={footer.href}
          // inline-flex + min-h-11 makes the link a 44px-tall tap target.
          className="inline-flex min-h-11 items-center font-medium text-foreground underline"
        >
          {footer.linkLabel}
        </Link>
      </p>
    </form>
  );
}
