import { createServerClient } from "@supabase/ssr";
import type { Database } from "@/lib/database.types";
import { NextResponse, type NextRequest } from "next/server";

// Runs before every page request (see /proxy.ts). It refreshes the user's
// login session if it has expired and writes the new cookie to the response.
export async function updateSession(request: NextRequest) {
  let response = NextResponse.next({ request });

  const supabase = createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet, headers) {
          // Update the cookies on the request (so the page sees them) and on
          // the response (so the browser stores them).
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value),
          );
          response = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options),
          );
          // Stop CDNs from caching a response that carries someone's session.
          Object.entries(headers ?? {}).forEach(([key, value]) =>
            response.headers.set(key, value),
          );
        },
      },
    },
  );

  // Don't put code between createServerClient and getClaims(): this call is
  // what triggers the session refresh.
  const { data } = await supabase.auth.getClaims();
  const isLoggedIn = Boolean(data?.claims);

  // Redirect logged-out users to /login, and logged-in users away from the
  // login/signup pages. This is a convenience, not security: pages still
  // check the user themselves, and RLS protects the data.
  const path = request.nextUrl.pathname;
  const isAuthPage = path === "/login" || path === "/signup";
  const isPublic = isAuthPage || path.startsWith("/auth/");

  if (!isLoggedIn && !isPublic) {
    return redirectTo("/login", request, response);
  }
  if (isLoggedIn && isAuthPage) {
    return redirectTo("/groups", request, response);
  }

  return response;
}

// Build a redirect that keeps any refreshed session cookies set above.
function redirectTo(path: string, request: NextRequest, from: NextResponse) {
  const redirect = NextResponse.redirect(new URL(path, request.url));
  from.cookies.getAll().forEach((cookie) => redirect.cookies.set(cookie));
  return redirect;
}
