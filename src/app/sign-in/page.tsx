import { AuthForm } from "@/components/auth-form";

export default function SignInPage() {
  return (
    <main className="mx-auto w-full max-w-2xl flex-1 px-6 py-16">
      <p className="eyebrow">Sign in</p>
      <h1 className="mt-3 font-serif text-4xl tracking-tight">Open your account.</h1>
      <p className="mt-4 text-lg leading-8 text-muted">
        Your account holds your companies. Each company has its own stamp, and the stamp is not your password.
      </p>
      <AuthForm />
    </main>
  );
}
