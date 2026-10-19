import { useSyncExternalStore } from "react";
import { toDateString } from "@/lib/dates";

// "Today" must come from the user's own clock, which only the browser knows.
// While rendering on the server this returns null; React then re-renders in
// the browser with the real date (without a hydration mismatch).
// Only call this from Client Components ("use client" files).
export function useToday(): string | null {
  return useSyncExternalStore(
    () => () => {}, // nothing to subscribe to
    () => toDateString(new Date()), // in the browser
    () => null, // on the server
  );
}
