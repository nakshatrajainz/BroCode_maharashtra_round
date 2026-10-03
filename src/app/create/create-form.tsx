"use client";

import Link from "next/link";
import { useActionState } from "react";
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

  if (!email) {
    return (
      <div className="card mt-10 p-6">
        <p className="font-medium">Sign in to stamp a picture.</p>
        <p className="mt-2 text-sm leading-6 text-muted">
          Create uses your Maker company stamp. The private half never reaches the browser.
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
          Register as a Maker, then come back here to write the first line on a prepared picture.
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
        <p className="rounded-2xl border border-line bg-card px-5 py-4 text-sm leading-6 text-muted">
          The BNB notebook is not connected yet. You can still stamp and download a picture; the public
          line will be written once the ledger contract is deployed.
        </p>
      ) : makers.some((maker) => !maker.onChain) ? (
        <p className="rounded-2xl border border-line bg-card px-5 py-4 text-sm leading-6 text-muted">
          Some Maker companies are saved off-chain only. New registrations after deploy will land on the
          notebook automatically.
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
          <span className="font-medium">Private sentence</span>
          <textarea
            name="sentence"
            className="field min-h-28 resize-y"
            placeholder="A sealed note about how this picture was made."
            defaultValue="Prepared demo picture for ModelLedger."
            maxLength={280}
            required
          />
          <span className="text-muted">
            This text is sealed on the server. The notebook only keeps a hash of the envelope.
          </span>
        </label>

        <p className="text-sm leading-6 text-muted">
          This phase stamps a prepared PNG. The file gets a hidden id, exact and look-alike fingerprints,
          and your Maker stamp.
        </p>

        {state.error ? <p className="text-sm text-seal">{state.error}</p> : null}

        <button type="submit" className="button" disabled={pending}>
          {pending ? "Stamping…" : "Stamp prepared picture"}
        </button>
      </form>

      {state.created ? <CreatedResult created={state.created} /> : null}
    </div>
  );
}

function CreatedResult({ created }: { created: NonNullable<CreateState["created"]> }) {
  return (
    <div className="rounded-2xl border border-leaf/20 bg-leaf-soft px-5 py-5 text-sm leading-6">
      <p className="font-medium text-leaf">{created.companyName} stamped a creation line.</p>
      <p className="mt-2 break-all text-ink/80">
        Line <span className="font-mono text-xs">{created.lineId}</span>
      </p>
      <p className="mt-1 break-all text-ink/80">
        Hidden id <span className="font-mono text-xs">{created.hiddenId}</span>
      </p>
      {created.chainTx ? (
        <p className="mt-1 break-all text-ink/80">
          Notebook tx <span className="font-mono text-xs">{created.chainTx}</span>
        </p>
      ) : (
        <p className="mt-1 text-ink/80">Saved off-chain for now. Notebook write waits on the ledger deploy.</p>
      )}
      <a href={created.downloadUrl} download={created.downloadName} className="button mt-4">
        Download stamped PNG
      </a>
    </div>
  );
}
