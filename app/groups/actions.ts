"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export type GroupFormState = {
  error?: string;
};

// Both actions call database functions (RPCs) from step 4. The database
// checks who's logged in and validates the input; if it refuses, its error
// message (e.g. "No group found with that invite code.") is shown in the form.

export async function createGroup(
  _prevState: GroupFormState,
  formData: FormData,
): Promise<GroupFormState> {
  const name = String(formData.get("name") ?? "").trim();
  if (!name) {
    return { error: "Give your group a name." };
  }

  const supabase = await createClient();
  const { data: groupId, error } = await supabase.rpc("create_group", {
    group_name: name,
  });

  if (error) {
    return { error: error.message };
  }

  redirect(`/groups/${groupId}`);
}

export async function joinGroup(
  _prevState: GroupFormState,
  formData: FormData,
): Promise<GroupFormState> {
  const code = String(formData.get("code") ?? "").trim();
  if (!code) {
    return { error: "Enter an invite code." };
  }

  const supabase = await createClient();
  const { data: groupId, error } = await supabase.rpc("join_group", { code });

  if (error) {
    return { error: error.message };
  }

  redirect(`/groups/${groupId}`);
}

// groupId is filled in by the form with .bind(), so the browser could send
// any id here. That's fine: RLS refuses the insert unless you're a member.
export async function createHabit(
  groupId: string,
  _prevState: GroupFormState,
  formData: FormData,
): Promise<GroupFormState> {
  const name = String(formData.get("name") ?? "").trim();
  const description = String(formData.get("description") ?? "").trim();

  if (name.length < 1 || name.length > 50) {
    return { error: "Habit name must be 1–50 characters." };
  }
  if (description.length > 200) {
    return { error: "Description must be 200 characters or less." };
  }

  const supabase = await createClient();
  const { error } = await supabase.from("habits").insert({
    group_id: groupId,
    name,
    description: description || null,
  });

  if (error) {
    return { error: "Couldn't add that habit. Please try again." };
  }

  redirect(`/groups/${groupId}`);
}
