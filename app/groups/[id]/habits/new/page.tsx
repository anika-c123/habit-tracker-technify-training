import { Suspense } from "react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { requireUser } from "@/lib/auth";
import { NewHabitForm } from "./new-habit-form";

async function NewHabit({ params }: Pick<PageProps<"/groups/[id]/habits/new">, "params">) {
  const { id } = await params;
  const { supabase } = await requireUser();

  // Also confirms you're a member: RLS hides groups you're not in.
  const { data: group, error } = await supabase
    .from("groups")
    .select("name")
    .eq("id", id)
    .maybeSingle();

  if (error || !group) {
    notFound();
  }

  return (
    <>
      <Link
        href={`/groups/${id}`}
        className="-ml-2 flex h-11 w-fit items-center px-2 text-sm text-foreground/70 hover:text-foreground"
      >
        ← {group.name}
      </Link>
      <h1 className="text-2xl font-semibold tracking-tight">New habit</h1>
      <NewHabitForm groupId={id} />
    </>
  );
}

export default function NewHabitPage({ params }: PageProps<"/groups/[id]/habits/new">) {
  return (
    <main className="mx-auto flex w-full max-w-md flex-1 flex-col gap-6 px-4 py-8">
      <Suspense fallback={<p className="text-sm text-foreground/60">Loading…</p>}>
        <NewHabit params={params} />
      </Suspense>
    </main>
  );
}
