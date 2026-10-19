"use client";

import { useActionState, useState } from "react";
import { leaveGroup } from "@/app/groups/actions";

type Props = {
  groupId: string;
  groupName: string;
  isLastMember: boolean;
};

// Two taps to leave: the first asks "are you sure?", the second leaves.
export function LeaveGroupButton({ groupId, groupName, isLastMember }: Props) {
  const [confirming, setConfirming] = useState(false);
  // .bind() pre-fills the group id. On success the action redirects to
  // /groups; otherwise `state.error` says what went wrong.
  const [state, formAction, pending] = useActionState(
    leaveGroup.bind(null, groupId),
    {},
  );

  if (!confirming) {
    return (
      <button
        type="button"
        onClick={() => setConfirming(true)}
        className="-ml-2 h-11 self-start px-2 text-lg text-coral-ink hover:underline"
      >
        Leave group
      </button>
    );
  }

  return (
    <form action={formAction} className="flex flex-col gap-4 rounded-2xl bg-coral/10 p-5">
      <p>
        Leave <span className="font-medium">{groupName}</span>?{" "}
        {isLastMember
          ? "You're the last member, so the group and all its habits will be deleted."
          : "You can rejoin later with the invite code."}
      </p>
      <div className="flex gap-2">
        <button
          disabled={pending}
          className="h-11 flex-1 rounded-full bg-coral-ink text-lg text-white disabled:opacity-60"
        >
          {pending ? "Leaving…" : isLastMember ? "Leave and delete" : "Leave"}
        </button>
        <button
          type="button"
          onClick={() => setConfirming(false)}
          disabled={pending}
          className="h-11 flex-1 rounded-full bg-white text-lg"
        >
          Cancel
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
