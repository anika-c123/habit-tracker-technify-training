import { Suspense } from "react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { requireUser } from "@/lib/auth";
import { SectionHeading } from "@/app/ui/section-heading";
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
        className="-mb-6 -ml-2 flex h-11 w-fit items-center px-2 text-lg text-muted hover:text-foreground"
      >
        ← {group.name}
      </Link>
      <div className="flex flex-col gap-3">
        <SectionHeading as="h1" color="sky">
          New habit
        </SectionHeading>
        <p className="italic text-muted">Everyone in {group.name} will see it.</p>
      </div>
      <NewHabitForm groupId={id} />
    </>
  );
}

export default function NewHabitPage({ params }: PageProps<"/groups/[id]/habits/new">) {
  return (
    <main className="mx-auto flex w-full max-w-md flex-1 flex-col gap-10 px-4 py-8">
      <Suspense fallback={<p className="italic text-muted">Loading…</p>}>
        <NewHabit params={params} />
      </Suspense>
    </main>
  );
}
