import Link from "next/link";
import { primaryButtonClass } from "@/app/ui/styles";

// Shown when notFound() is called for a group: a bad link, a deleted group,
// or a group you're not in (RLS hides those, so they look the same).
export default function GroupNotFound() {
  return (
    <main className="mx-auto flex w-full max-w-md flex-1 flex-col items-center justify-center gap-5 px-4 py-12 text-center">
      <h1 className="text-4xl font-medium tracking-tight">Group not found</h1>
      <p className="italic text-muted">
        This group doesn&apos;t exist, or you&apos;re not a member. Ask a friend for
        the invite code to join.
      </p>
      <Link
        href="/groups"
        className={`flex items-center ${primaryButtonClass}`}
      >
        Back to your groups
      </Link>
    </main>
  );
}
