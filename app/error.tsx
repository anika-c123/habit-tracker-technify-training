"use client"; // Error boundaries must be Client Components.

import { useEffect } from "react";
import Link from "next/link";

// Shown instead of a page when something unexpected goes wrong while loading
// it (for example, the database can't be reached). The rest of the app keeps
// working; `retry` loads the page again.
export default function Error({ error, retry }: { error: unknown; retry: () => void }) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <main className="mx-auto flex w-full max-w-md flex-1 flex-col items-center justify-center gap-4 px-4 py-12 text-center">
      <h1 className="text-xl font-semibold">Something went wrong</h1>
      <p className="text-sm text-foreground/70">
        We couldn&apos;t load this page. Check your connection and try again.
      </p>
      <button
        type="button"
        onClick={() => retry()}
        className="h-11 rounded-lg bg-foreground px-5 font-medium text-background"
      >
        Try again
      </button>
      <Link href="/groups" className="flex h-11 items-center px-2 text-sm text-foreground/70">
        Back to your groups
      </Link>
    </main>
  );
}
