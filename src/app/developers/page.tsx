import Link from "next/link";

/** Optional docs — not in main nav. Website demo uses Companies + Stamp + Check. */
export default function DevelopersPage() {
  return (
    <main className="mx-auto w-full max-w-2xl flex-1 px-6 py-16">
      <p className="eyebrow">Optional · for engineers</p>
      <h1 className="mt-3 font-serif text-4xl tracking-tight">Company API (behind the demo)</h1>
      <p className="mt-4 text-lg leading-8 text-muted">
        You do not need this page for the normal demo. Register a company (you get an API key),
        stamp on the website, then Check. This page is only if someone asks how an app would call us.
      </p>
      <ul className="mt-8 grid gap-3 text-sm leading-6 text-muted">
        <li>
          <span className="font-medium text-ink">Stamp:</span>{" "}
          <code className="font-mono text-xs">POST /api/v1/stamp</code> with that company&apos;s
          Bearer key + picture + model
        </li>
        <li>
          <span className="font-medium text-ink">Check:</span>{" "}
          <code className="font-mono text-xs">POST /api/v1/check</code> — public, no key
        </li>
        <li>
          <span className="font-medium text-ink">Models:</span>{" "}
          <code className="font-mono text-xs">GET /api/v1/models</code> with Bearer key
        </li>
      </ul>
      <div className="mt-10 flex flex-wrap gap-3">
        <Link href="/register" className="button">
          Back to Companies
        </Link>
        <Link href="/check" className="button-quiet">
          Open Check
        </Link>
      </div>
    </main>
  );
}
