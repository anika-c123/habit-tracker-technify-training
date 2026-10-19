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
