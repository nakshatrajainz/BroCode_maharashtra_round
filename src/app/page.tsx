import Link from "next/link";

export default function Home() {
  return (
    <main className="mx-auto flex w-full max-w-5xl flex-1 flex-col px-6 py-16">
      <p className="eyebrow">ModelLedger · two doors</p>
      <h1 className="mt-4 max-w-2xl font-serif text-5xl leading-tight tracking-tight">
        ModelLedger
      </h1>
      <p className="mt-6 max-w-xl text-lg leading-8 text-muted">
        A company stamps its work. Later changes add the next line. Anyone can check whether the file still matches.
      </p>

      <div className="mt-14 grid gap-10 md:grid-cols-2">
        <section>
          <p className="eyebrow">For anyone</p>
          <h2 className="mt-3 font-serif text-3xl tracking-tight">Check a picture</h2>
          <p className="mt-3 max-w-md text-sm leading-6 text-muted">
            Upload a file. Get one answer: Trusted, Self-asserted, or Unverifiable. No account needed.
          </p>
          <Link href="/check" className="button mt-6 inline-flex">
            Open Check
          </Link>
        </section>

        <section>
          <p className="eyebrow">For companies</p>
          <h2 className="mt-3 font-serif text-3xl tracking-tight">Stamp your work</h2>
          <p className="mt-3 max-w-md text-sm leading-6 text-muted">
            Register as a Maker, Editor, or Publisher. Sign in later to add picture lines with your stamp.
          </p>
          <div className="mt-6 flex flex-wrap gap-3">
            <Link href="/register" className="button inline-flex">
              Register a company
            </Link>
            <Link href="/create" className="button-quiet inline-flex">
              Add a line
            </Link>
          </div>
        </section>
      </div>
    </main>
  );
}
