import { RegisterForm } from "./register-form";

export default function RegisterPage() {
  return (
    <main className="mx-auto w-full max-w-2xl flex-1 px-6 py-16">
      <p className="text-sm text-seal">Register</p>
      <h1 className="mt-3 font-serif text-4xl tracking-tight">Join the allowed list.</h1>
      <p className="mt-4 text-lg leading-8 text-muted">
        One company gets one stamp and one job. The stamp can only write the kind of line that job allows.
      </p>
      <RegisterForm />
    </main>
  );
}
