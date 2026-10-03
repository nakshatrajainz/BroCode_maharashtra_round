import { AuthForm } from "@/components/auth-form";

export default function SignUpPage() {
  return (
    <main className="mx-auto w-full max-w-2xl flex-1 px-6 py-16">
      <p className="text-sm text-seal">Create account</p>
      <h1 className="mt-3 font-serif text-4xl tracking-tight">Start a company account.</h1>
      <p className="mt-4 text-lg leading-8 text-muted">
        After this, you choose whether the company makes pictures, changes them, or posts them.
      </p>
      <AuthForm mode="sign-up" />
    </main>
  );
}
