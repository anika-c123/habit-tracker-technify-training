import { AuthForm } from "@/app/auth/auth-form";
import { signUp } from "@/app/auth/actions";
import { SectionHeading } from "@/app/ui/section-heading";

export default function SignUpPage() {
  return (
    <main className="mx-auto flex w-full max-w-sm flex-1 flex-col justify-center gap-10 px-4 py-12">
      <div className="flex flex-col gap-3">
        <SectionHeading as="h1" color="lavender">
          Sign up
        </SectionHeading>
        <p className="italic text-muted">Keep up your daily habits with friends.</p>
      </div>
      <AuthForm
        action={signUp}
        submitLabel="Sign up"
        askDisplayName
        footer={{ text: "Already have an account?", linkLabel: "Log in", href: "/login" }}
      />
    </main>
  );
}
