import { Suspense } from "react";
import { AuthForm } from "@/app/auth/auth-form";
import { logIn } from "@/app/auth/actions";
import { SectionHeading } from "@/app/ui/section-heading";

// Shown when /auth/confirm couldn't verify an email link (?error=confirm).
// Reading searchParams is request-time data, so it renders inside <Suspense>.
async function ConfirmError({ searchParams }: PageProps<"/login">) {
  const { error } = await searchParams;
  if (error !== "confirm") return null;
  return (
    <p className="text-coral-ink">
      That confirmation link is invalid or has expired. Try logging in, or sign
      up again to get a new link.
    </p>
  );
}

export default function LogInPage(props: PageProps<"/login">) {
  return (
    <main className="mx-auto flex w-full max-w-sm flex-1 flex-col justify-center gap-10 px-4 py-12">
      <div className="flex flex-col gap-3">
        <SectionHeading as="h1" color="sky">
          Log in
        </SectionHeading>
        <p className="italic text-muted">Welcome back. Your friends are waiting.</p>
      </div>
      <Suspense>
        <ConfirmError {...props} />
      </Suspense>
      <AuthForm
        action={logIn}
        submitLabel="Log in"
        footer={{ text: "New here?", linkLabel: "Create an account", href: "/signup" }}
      />
    </main>
  );
}
