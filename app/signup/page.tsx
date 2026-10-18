import { AuthForm } from "@/app/auth/auth-form";
import { signUp } from "@/app/auth/actions";

export default function SignUpPage() {
  return (
    <main className="flex flex-1 flex-col items-center justify-center gap-6 px-4 py-12">
      <h1 className="text-2xl font-semibold tracking-tight">Create an account</h1>
      <AuthForm
        action={signUp}
        submitLabel="Sign up"
        askDisplayName
        footer={{ text: "Already have an account?", linkLabel: "Log in", href: "/login" }}
      />
    </main>
  );
}
