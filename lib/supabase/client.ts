import { createBrowserClient } from "@supabase/ssr";
import type { Database } from "@/lib/database.types";

// Supabase client for Client Components (code that runs in the browser).
// The session lives in cookies, so the server sees the same logged-in user.
export function createClient() {
  return createBrowserClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
  );
}
