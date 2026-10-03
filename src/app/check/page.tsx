import { CheckForm } from "./check-form";

export default function CheckPage() {
  return (
    <main className="mx-auto w-full max-w-2xl flex-1 px-6 py-16">
      <p className="eyebrow">Check · public</p>
      <h1 className="mt-3 font-serif text-4xl tracking-tight">Is this picture’s story real?</h1>
      <p className="mt-4 text-lg leading-8 text-muted">
        Upload a file. Get one clear answer — no account, no wallet, no hex required.
      </p>

      <div className="mt-8 flex flex-wrap gap-2 text-sm">
        <span className="rounded-xl bg-leaf px-3 py-1.5 font-medium text-paper">Trusted</span>
        <span className="rounded-xl bg-warn px-3 py-1.5 font-medium text-paper">Self-asserted</span>
        <span className="rounded-xl bg-danger px-3 py-1.5 font-medium text-paper">Unverifiable</span>
      </div>

      <CheckForm />
    </main>
  );
}
