import { createBrowserClient } from "@supabase/ssr";

// Supabase client for Client Components (code that runs in the browser).
// The session lives in cookies, so the server sees the same logged-in user.
export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
  );
}
