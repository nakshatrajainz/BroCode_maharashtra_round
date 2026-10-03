import { AuthForm } from "@/components/auth-form";

export default function SignInPage() {
  return (
    <main className="mx-auto w-full max-w-2xl flex-1 px-6 py-16">
      <p className="text-sm text-seal">Sign in</p>
      <h1 className="mt-3 font-serif text-4xl tracking-tight">Open your company account.</h1>
      <p className="mt-4 text-lg leading-8 text-muted">
        The account is how you create stamps. The stamp itself is not the password.
      </p>
      <AuthForm mode="sign-in" />
    </main>
  );
}
