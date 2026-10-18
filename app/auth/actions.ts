"use server";

// Server Actions: these functions run on the server when a form is submitted.
// The browser never sees this code, only the result it returns.

import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

// What a form shows after a submit that didn't redirect.
export type AuthFormState = {
  error?: string;
  message?: string;
};

export async function signUp(
  _prevState: AuthFormState,
  formData: FormData,
): Promise<AuthFormState> {
  const displayName = String(formData.get("display_name") ?? "").trim();
  const email = String(formData.get("email") ?? "").trim();
  const password = String(formData.get("password") ?? "");

  if (displayName.length < 1 || displayName.length > 50) {
    return { error: "Display name must be 1–50 characters." };
  }

  const supabase = await createClient();
  const origin = (await headers()).get("origin");
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      // Saved as user metadata; the database trigger copies it into profiles.
      data: { display_name: displayName },
      // Where the "confirm your email" link sends the user back to.
      emailRedirectTo: `${origin}/auth/confirm`,
    },
  });

  if (error) {
    return { error: error.message };
  }

  // If the project requires email confirmation, there's no session yet.
  if (!data.session) {
    return { message: "Check your email for a link to confirm your account." };
  }

  redirect("/groups");
}

export async function logIn(
  _prevState: AuthFormState,
  formData: FormData,
): Promise<AuthFormState> {
  const email = String(formData.get("email") ?? "").trim();
  const password = String(formData.get("password") ?? "");

  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword({ email, password });

  if (error) {
    return { error: error.message };
  }

  redirect("/groups");
}

export async function logOut() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/login");
}
