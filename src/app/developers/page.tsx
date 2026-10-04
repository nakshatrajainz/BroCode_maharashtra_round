import Link from "next/link";
import type { ReactNode } from "react";

export default function DevelopersPage() {
  return (
    <main className="mx-auto w-full max-w-2xl flex-1 px-6 py-16">
      <p className="eyebrow">Developers · the real product</p>
      <h1 className="mt-3 font-serif text-4xl tracking-tight">This website is the demo remote.</h1>
      <p className="mt-4 text-lg leading-8 text-muted">
        In real life, an AI company does not click our forms. Their software calls our API when a
        picture is created, edited, or posted. Check is the only page normal people need.
      </p>

      <ol className="mt-10 grid gap-4">
        <HumanStep n="1" title="Company gets an API key">
          Sign in → Stamp → Company API key → Create API key. Copy it once.
        </HumanStep>
        <HumanStep n="2" title="Their app stamps a picture">
          After their model makes an image, they POST it to <code className="font-mono text-xs">/api/v1/stamp</code>{" "}
          with company + model + file.
        </HumanStep>
        <HumanStep n="3" title="Anyone can check later">
          Anyone (or any app) POSTs the file to <code className="font-mono text-xs">/api/v1/check</code>{" "}
          and gets Trusted / Self-asserted / Unverifiable.
        </HumanStep>
      </ol>

      <section className="card mt-10 grid gap-4 p-6">
        <h2 className="font-serif text-2xl">Stamp API</h2>
        <p className="text-sm leading-6 text-muted">
          Needs the company API key. Returns the stamped PNG as base64 plus company, model, and time.
        </p>
        <pre className="overflow-x-auto rounded-xl bg-ink px-4 py-4 text-xs leading-6 text-paper">
{`curl -X POST https://YOUR_SITE/api/v1/stamp \\
  -H "Authorization: Bearer ml_YOUR_KEY" \\
  -F "model=Flux 1.1" \\
  -F "sentence=Made for the demo." \\
  -F "picture=@photo.png"`}
        </pre>
        <p className="text-sm text-muted">
          Quick local demo without a file: add{" "}
          <code className="font-mono text-xs">-F "usePrepared=true"</code> (Maker only).
        </p>
      </section>

      <section className="card mt-6 grid gap-4 p-6">
        <h2 className="font-serif text-2xl">Check API</h2>
        <p className="text-sm leading-6 text-muted">
          Public. No API key. Same answer as the Check page.
        </p>
        <pre className="overflow-x-auto rounded-xl bg-ink px-4 py-4 text-xs leading-6 text-paper">
{`curl -X POST https://YOUR_SITE/api/v1/check \\
  -F "picture=@photo-stamped.png"`}
        </pre>
      </section>

      <section className="card mt-6 grid gap-4 p-6">
        <h2 className="font-serif text-2xl">List approved models</h2>
        <pre className="overflow-x-auto rounded-xl bg-ink px-4 py-4 text-xs leading-6 text-paper">
{`curl https://YOUR_SITE/api/v1/models \\
  -H "Authorization: Bearer ml_YOUR_KEY"`}
        </pre>
      </section>

      <div className="mt-10 flex flex-wrap gap-3">
        <Link href="/create" className="button">
          Get an API key
        </Link>
        <Link href="/check" className="button-quiet">
          Open Check
        </Link>
      </div>
    </main>
  );
}

function HumanStep({
  n,
  title,
  children,
}: {
  n: string;
  title: string;
  children: ReactNode;
}) {
  return (
    <li className="rounded-2xl border border-line bg-card px-5 py-4">
      <p className="text-xs font-medium text-seal">Step {n}</p>
      <p className="mt-1 font-medium">{title}</p>
      <p className="mt-1 text-sm leading-6 text-muted">{children}</p>
    </li>
  );
}
