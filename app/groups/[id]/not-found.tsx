import Link from "next/link";

// Shown when notFound() is called for a group: a bad link, a deleted group,
// or a group you're not in (RLS hides those, so they look the same).
export default function GroupNotFound() {
  return (
    <main className="mx-auto flex w-full max-w-md flex-1 flex-col items-center justify-center gap-4 px-4 py-12 text-center">
      <h1 className="text-xl font-semibold">Group not found</h1>
      <p className="text-sm text-foreground/70">
        This group doesn&apos;t exist, or you&apos;re not a member. Ask a friend for
        the invite code to join.
      </p>
      <Link
        href="/groups"
        className="flex h-11 items-center rounded-lg bg-foreground px-5 font-medium text-background"
      >
        Back to your groups
      </Link>
    </main>
  );
}
