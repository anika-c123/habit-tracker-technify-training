import { redirect } from "next/navigation";
import { connection } from "next/server";
import { createClient } from "@/lib/supabase/server";

// For Server Components: returns a Supabase client and the logged-in user's
// id, or sends logged-out visitors to /login. Call it inside <Suspense>.
export async function requireUser() {
  // getClaims() checks the token's expiry against the current time, which
  // Next can't bake into a prefetched page. connection() says "only render
  // this part during a real request".
  await connection();

  const supabase = await createClient();
  const { data } = await supabase.auth.getClaims();

  // proxy.ts already redirects logged-out users, but that's only a first
  // line of defense: pages check for themselves too.
  if (!data?.claims) {
    redirect("/login");
  }

  return { supabase, userId: data.claims.sub };
}
