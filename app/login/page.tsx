import { Suspense } from "react";
import { AuthForm } from "@/app/auth/auth-form";
import { logIn } from "@/app/auth/actions";

// Shown when /auth/confirm couldn't verify an email link (?error=confirm).
// Reading searchParams is request-time data, so it renders inside <Suspense>.
async function ConfirmError({ searchParams }: PageProps<"/login">) {
  const { error } = await searchParams;
  if (error !== "confirm") return null;
  return (
    <p className="max-w-sm text-center text-sm text-red-600">
      That confirmation link is invalid or has expired. Try logging in, or sign
      up again to get a new link.
    </p>
  );
}

export default function LogInPage(props: PageProps<"/login">) {
  return (
    <main className="flex flex-1 flex-col items-center justify-center gap-6 px-4 py-12">
      <h1 className="text-2xl font-semibold tracking-tight">Log in</h1>
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
