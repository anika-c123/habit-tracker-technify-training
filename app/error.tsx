"use client"; // Error boundaries must be Client Components.

import { useEffect } from "react";
import Link from "next/link";
import { primaryButtonClass } from "@/app/ui/styles";

// Shown instead of a page when something unexpected goes wrong while loading
// it (for example, the database can't be reached). The rest of the app keeps
// working; `retry` loads the page again.
export default function Error({ error, retry }: { error: unknown; retry: () => void }) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <main className="mx-auto flex w-full max-w-md flex-1 flex-col items-center justify-center gap-5 px-4 py-12 text-center">
      <h1 className="text-4xl font-medium tracking-tight">Something went wrong</h1>
      <p className="italic text-muted">
        We couldn&apos;t load this page. Check your connection and try again.
      </p>
      <button
        type="button"
        onClick={() => retry()}
        className={primaryButtonClass}
      >
        Try again
      </button>
      <Link href="/groups" className="flex h-11 items-center px-2 text-lg text-coral-ink">
        Back to your groups
      </Link>
    </main>
  );
}
