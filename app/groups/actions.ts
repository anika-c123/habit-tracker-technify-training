"use server";

import { refresh } from "next/cache";
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

// Check off (done = true) or undo (done = false) one habit for one day.
// `date` is the user's local "YYYY-MM-DD", computed in the browser. The
// database only accepts dates within ±1 day of its own, and only for you.
export async function setCompletion(
  habitId: string,
  date: string,
  done: boolean,
): Promise<{ error?: string }> {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) {
    return { error: "Invalid date." };
  }

  const supabase = await createClient();
  const { data } = await supabase.auth.getClaims();
  if (!data?.claims) {
    return { error: "You've been logged out. Please log in again." };
  }

  if (done) {
    const { error } = await supabase
      .from("completions")
      .insert({ habit_id: habitId, completed_on: date });
    // 23505 = "already exists" (e.g. a double-tap). It's already done, so fine.
    if (error && error.code !== "23505") {
      return { error: "Couldn't save. Please try again." };
    }
  } else {
    const { error } = await supabase
      .from("completions")
      .delete()
      .eq("habit_id", habitId)
      .eq("user_id", data.claims.sub)
      .eq("completed_on", date);
    if (error) {
      return { error: "Couldn't undo. Please try again." };
    }
  }

  // Re-render the page on the server so it shows the saved state.
  refresh();
  return {};
}

// Leave a group by deleting your own membership row. RLS only lets you delete
// your own row. The database trigger from step 10 then hands ownership to the
// next member, or deletes the group if you were the last one.
export async function leaveGroup(
  groupId: string,
  // useActionState always passes the previous state; this action doesn't need it.
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  _prevState: GroupFormState,
): Promise<GroupFormState> {
  const supabase = await createClient();
  const { data } = await supabase.auth.getClaims();
  if (!data?.claims) {
    return { error: "You've been logged out. Please log in again." };
  }

  const { error } = await supabase
    .from("group_members")
    .delete()
    .eq("group_id", groupId)
    .eq("user_id", data.claims.sub);

  if (error) {
    return { error: "Couldn't leave the group. Please try again." };
  }

  redirect("/groups");
}
