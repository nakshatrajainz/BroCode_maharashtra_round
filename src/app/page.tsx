import Link from "next/link";

export default function Home() {
  return (
    <main className="relative flex-1 overflow-hidden">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_top_left,_rgba(140,47,42,0.14),_transparent_45%),radial-gradient(ellipse_at_bottom_right,_rgba(47,107,79,0.12),_transparent_40%),linear-gradient(180deg,_#f7f2e8_0%,_#efe6d6_100%)]"
      />
      <div className="relative mx-auto flex w-full max-w-5xl flex-col px-6 py-16 sm:py-20">
        <p className="eyebrow">BroCode · BNB · picture provenance</p>
        <h1 className="mt-4 max-w-3xl font-serif text-5xl leading-[1.05] tracking-tight sm:text-6xl">
          ModelLedger
        </h1>
        <p className="mt-6 max-w-2xl text-lg leading-8 text-muted">
          Allowed companies stamp a picture with the AI model that made it. Later edits add the next
          line. Anyone checks whether the file still matches that story.
        </p>

        <div className="mt-10 flex flex-wrap gap-3">
          <Link href="/check" className="button">
            Check a picture
          </Link>
          <Link href="/developers" className="button-quiet">
            Company API
          </Link>
          <Link href="/create" className="button-quiet">
            Stamp demo
          </Link>
        </div>

        <ol className="mt-14 grid gap-4 sm:grid-cols-3">
          <HomeStep
            n="1"
            title="Register"
            body="Maker, Editor, or Publisher — each with approved AI models and one stamp."
          />
          <HomeStep
            n="2"
            title="Stamp"
            body="Create → Edit → Publish. Company, model, and time go on the notebook."
          />
          <HomeStep
            n="3"
            title="Check"
            body="Upload the file. Get Trusted, Self-asserted, or Unverifiable — with the full story."
          />
        </ol>

        <div className="mt-12 grid gap-6 border-t border-line/80 pt-10 md:grid-cols-2">
          <section>
            <p className="eyebrow">For anyone</p>
            <h2 className="mt-3 font-serif text-3xl tracking-tight">Public check</h2>
            <p className="mt-3 max-w-md text-sm leading-6 text-muted">
              No login. Upload a PNG and see who stamped it, which model, when, and whether the chain
              still holds.
            </p>
            <Link href="/check" className="button mt-6 inline-flex">
              Open Check
            </Link>
          </section>

          <section>
            <p className="eyebrow">For companies</p>
            <h2 className="mt-3 font-serif text-3xl tracking-tight">Workspace</h2>
            <p className="mt-3 max-w-md text-sm leading-6 text-muted">
              Sign in → Companies (approve models) → Stamp. Demo of the company API that would sit in
              a real create/edit/publish pipeline.
            </p>
            <div className="mt-6 flex flex-wrap gap-3">
              <Link href="/sign-in" className="button inline-flex">
                Sign in
              </Link>
              <Link href="/register" className="button-quiet inline-flex">
                Companies
              </Link>
            </div>
          </section>
        </div>
      </div>
    </main>
  );
}

function HomeStep({ n, title, body }: { n: string; title: string; body: string }) {
  return (
    <li className="rounded-2xl border border-line/80 bg-card/80 px-5 py-5 shadow-[0_8px_24px_-16px_rgba(28,25,21,0.25)] backdrop-blur-sm">
      <p className="text-xs font-medium text-seal">Step {n}</p>
      <p className="mt-2 font-serif text-2xl tracking-tight">{title}</p>
      <p className="mt-2 text-sm leading-6 text-muted">{body}</p>
    </li>
  );
}
