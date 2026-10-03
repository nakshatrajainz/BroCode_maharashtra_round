"use client";

import Link from "next/link";
import { useActionState, useEffect, useRef, useState } from "react";
import { submitMakerCreate, type CreateState } from "./actions";

export type MakerCompany = {
  id: string;
  name: string;
  stampAddress: string;
  onChain: boolean;
};

const initialState: CreateState = {};

export function CreateForm({
  email,
  makers,
  ledgerReady,
}: {
  email: string | null;
  makers: MakerCompany[];
  ledgerReady: boolean;
}) {
  const [state, formAction, pending] = useActionState(submitMakerCreate, initialState);
  const [usePrepared, setUsePrepared] = useState(false);
  const [fileName, setFileName] = useState<string | null>(null);
  const resultRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (state.created || state.error) {
      resultRef.current?.scrollIntoView({ behavior: "smooth", block: "nearest" });
    }
  }, [state.created, state.error]);

  if (!email) {
    return (
      <div className="card mt-10 p-6">
        <p className="font-medium">Sign in to stamp a picture.</p>
        <p className="mt-2 text-sm leading-6 text-muted">
          Your company stamp stays on the server. The browser never sees the private key.
        </p>
        <Link href="/sign-in" className="button mt-5">
          Sign in
        </Link>
      </div>
    );
  }

  if (makers.length === 0) {
    return (
      <div className="card mt-10 p-6">
        <p className="font-medium">You need a Maker company first.</p>
        <p className="mt-2 text-sm leading-6 text-muted">
          Register as a Maker, then come back here to stamp a picture before you send it out.
        </p>
        <Link href="/register" className="button mt-5">
          Register a Maker
        </Link>
      </div>
    );
  }

  return (
    <div className="mt-10 grid gap-6">
      {!ledgerReady ? (
        <p className="rounded-2xl border border-warn/25 bg-warn-soft px-5 py-4 text-sm leading-6 text-warn">
          Notebook not connected yet. You can still stamp and download; the public line will sync after
          deploy.
        </p>
      ) : makers.some((maker) => !maker.onChain) ? (
        <p className="rounded-2xl border border-warn/25 bg-warn-soft px-5 py-4 text-sm leading-6 text-warn">
          Some Maker companies are off-chain only. Register a new Maker after deploy to write on the
          notebook.
        </p>
      ) : null}

      <form action={formAction} className="card grid gap-5 p-6">
        <label className="grid gap-2 text-sm">
          <span className="font-medium">Maker company</span>
          <select name="companyId" className="field" defaultValue={makers[0]?.id} required>
            {makers.map((maker) => (
              <option key={maker.id} value={maker.id}>
                {maker.name}
                {maker.onChain ? "" : " (off-chain for now)"}
              </option>
            ))}
          </select>
        </label>

        <label className="grid gap-2 text-sm">
          <span className="font-medium">Picture to stamp</span>
          <input
            type="file"
            name="picture"
            accept="image/png,image/jpeg,image/webp,.png,.jpg,.jpeg,.webp"
            className="field file:mr-3 file:rounded-lg file:border-0 file:bg-paper file:px-3 file:py-1.5"
            disabled={usePrepared}
            required={!usePrepared}
            onChange={(event) => setFileName(event.target.files?.[0]?.name ?? null)}
          />
          <label className="flex items-center gap-2 text-muted">
            <input
              type="checkbox"
              name="usePrepared"
              checked={usePrepared}
              onChange={(event) => {
                setUsePrepared(event.target.checked);
                if (event.target.checked) setFileName(null);
              }}
            />
            Use prepared sample instead
          </label>
          <span className="text-muted">
            {usePrepared
              ? "Using the built-in sample picture."
              : fileName
                ? `Selected: ${fileName}`
                : "PNG, JPEG, or WebP. Download will be a stamped PNG."}
          </span>
        </label>

        <label className="grid gap-2 text-sm">
          <span className="font-medium">Private sentence</span>
          <textarea
            name="sentence"
            className="field min-h-28 resize-y"
            placeholder="A sealed note about how this picture was made."
            defaultValue="Stamped with ModelLedger."
            maxLength={280}
            required
          />
          <span className="text-muted">Sealed on the server. Not shown on Check.</span>
        </label>

        {state.error ? (
          <p className="rounded-xl border border-danger/20 bg-danger-soft px-4 py-3 text-sm text-danger" role="alert">
            {state.error}
          </p>
        ) : null}

        <button type="submit" className="button" disabled={pending} aria-busy={pending}>
          {pending ? "Stamping…" : "Stamp picture"}
        </button>
        {pending ? (
          <p className="text-sm text-muted" aria-live="polite">
            Embedding the stamp, sealing the sentence, and writing the notebook line…
          </p>
        ) : null}
      </form>

      <div ref={resultRef}>{state.created ? <CreatedResult created={state.created} /> : null}</div>
    </div>
  );
}

function CreatedResult({ created }: { created: NonNullable<CreateState["created"]> }) {
  return (
    <section className="result-in rounded-2xl border border-leaf/30 bg-leaf-soft px-5 py-6 sm:px-7" aria-live="polite">
      <div className="flex flex-wrap items-center gap-3">
        <span className="rounded-xl bg-leaf px-3 py-1.5 text-sm font-semibold text-paper">Done</span>
        <p className="text-sm text-ink/70">Stamp complete</p>
      </div>

      <h2 className="mt-4 font-serif text-3xl tracking-tight text-ink">
        {created.companyName} stamped this picture.
      </h2>
      <p className="mt-3 max-w-xl text-sm leading-6 text-ink/80">
        Download the stamped file and send <span className="font-medium text-ink">that</span> copy to your
        user. Anyone can upload it on Check to get Trusted.
      </p>

      {created.chainTx ? (
        <p className="mt-3 text-sm text-leaf">Saved on the public notebook.</p>
      ) : (
        <p className="mt-3 text-sm text-warn">Saved for now. Notebook write is pending for this company.</p>
      )}

      <div className="mt-5 flex flex-wrap gap-3">
        <a href={created.downloadUrl} download={created.downloadName} className="button">
          Download stamped picture
        </a>
        <Link href="/check" className="button-quiet">
          Open Check
        </Link>
      </div>

      <details className="mt-6 rounded-xl border border-ink/10 bg-paper/50 px-4 py-3 text-sm text-ink/80">
        <summary className="cursor-pointer font-medium text-ink">Technical details</summary>
        <p className="mt-2 text-muted">Hidden from the normal flow. Useful for demos and debugging.</p>
        <dl className="mt-3 grid gap-3 text-xs">
          <div>
            <dt className="font-medium text-ink">Line id</dt>
            <dd className="mt-1 break-all font-mono text-muted">{created.lineId}</dd>
          </div>
          <div>
            <dt className="font-medium text-ink">Hidden id</dt>
            <dd className="mt-1 break-all font-mono text-muted">{created.hiddenId}</dd>
          </div>
          <div>
            <dt className="font-medium text-ink">Exact fingerprint</dt>
            <dd className="mt-1 break-all font-mono text-muted">{created.exactFingerprint}</dd>
          </div>
          {created.chainTx ? (
            <div>
              <dt className="font-medium text-ink">Notebook tx</dt>
              <dd className="mt-1 break-all font-mono text-muted">{created.chainTx}</dd>
            </div>
          ) : null}
        </dl>
      </details>
    </section>
  );
}
