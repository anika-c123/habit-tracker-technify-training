import { Suspense } from "react";
import { createClient } from "@/lib/supabase/server";

// Temporary check for SPEC step 2: proves the app can talk to Supabase and
// read the session. Replaced by real auth screens in step 3.
async function SessionStatus() {
  const supabase = await createClient();
  const { data, error } = await supabase.auth.getClaims();

  if (error) {
    return <p className="text-sm text-red-600">Supabase error: {error.message}</p>;
  }
  return (
    <p className="text-sm text-foreground/60">
      Supabase connected · {data?.claims ? "signed in" : "not signed in"}
    </p>
  );
}

export default function Home() {
  return (
    <main className="flex flex-1 flex-col items-center justify-center gap-4 px-4 py-16 text-center">
      <h1 className="text-3xl font-semibold tracking-tight">Habit Tracker</h1>
      <p className="max-w-xs text-foreground/70">
        Build daily habits together with your friends. Coming soon.
      </p>
      <Suspense fallback={<p className="text-sm text-foreground/60">Checking session…</p>}>
        <SessionStatus />
      </Suspense>
    </main>
  );
}
