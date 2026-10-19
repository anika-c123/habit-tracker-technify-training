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
        className="-ml-3 h-11 self-start rounded-lg px-3 text-sm text-red-600 hover:bg-red-600/10"
      >
        Leave group
      </button>
    );
  }

  return (
    <form action={formAction} className="flex flex-col gap-3 rounded-lg border border-red-600/30 p-4">
      <p className="text-sm">
        Leave <span className="font-medium">{groupName}</span>?{" "}
        {isLastMember
          ? "You're the last member, so the group and all its habits will be deleted."
          : "You can rejoin later with the invite code."}
      </p>
      <div className="flex gap-2">
        <button
          disabled={pending}
          className="h-11 flex-1 rounded-lg bg-red-600 font-medium text-white disabled:opacity-60"
        >
          {pending ? "Leaving…" : isLastMember ? "Leave and delete" : "Leave"}
        </button>
        <button
          type="button"
          onClick={() => setConfirming(false)}
          disabled={pending}
          className="h-11 flex-1 rounded-lg border border-foreground/20 font-medium"
        >
          Cancel
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
