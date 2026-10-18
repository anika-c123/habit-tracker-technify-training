import { Suspense } from "react";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { logOut } from "@/app/auth/actions";

// Placeholder until step 5 builds the real groups list. For now it proves
// that log-in works and that the profile row was created on sign-up.
async function Welcome() {
  const supabase = await createClient();
  const { data } = await supabase.auth.getClaims();

  // proxy.ts already redirects logged-out users, but that's only a first
  // line of defense: the page checks for itself too.
  if (!data?.claims) {
    redirect("/login");
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("display_name")
    .eq("id", data.claims.sub)
    .single();

  return (
    <p className="text-foreground/70">
      Hi, {profile?.display_name ?? "there"}! Your groups will show up here.
    </p>
  );
}

export default function GroupsPage() {
  return (
    <main className="flex flex-1 flex-col items-center justify-center gap-6 px-4 py-12 text-center">
      <h1 className="text-2xl font-semibold tracking-tight">Your groups</h1>
      <Suspense fallback={<p className="text-foreground/60">Loading…</p>}>
        <Welcome />
      </Suspense>
      <form action={logOut}>
        <button className="h-11 rounded-lg border border-foreground/20 px-5 font-medium">
          Log out
        </button>
      </form>
    </main>
  );
}
