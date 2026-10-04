"use client";

import { useActionState, useEffect, useRef, useState } from "react";
import { submitCheck, type CheckState } from "./actions";
import type { CheckLine, CheckResult, Verdict } from "@/lib/verdict-types";

const initialState: CheckState = {};

const verdictStyle: Record<
  Verdict,
  { shell: string; badge: string; label: string; plain: string }
> = {
  Trusted: {
    shell: "border-leaf/30 bg-leaf-soft",
    badge: "bg-leaf text-paper",
    label: "Trusted",
    plain: "This picture has a real stamp from an allowed company, and the file still matches.",
  },
  "Self-asserted": {
    shell: "border-warn/30 bg-warn-soft",
    badge: "bg-warn text-paper",
    label: "Self-asserted",
    plain: "Someone claimed a maker, but there is no matching allowed stamp on this file.",
  },
  Unverifiable: {
    shell: "border-danger/30 bg-danger-soft",
    badge: "bg-danger text-paper",
    label: "Unverifiable",
    plain: "We could not verify a complete stamped story for this file.",
  },
};

const actionLabel: Record<string, string> = {
  maker: "Created",
  editor: "Changed",
  publisher: "Posted",
};

export function CheckForm() {
  const [state, formAction, pending] = useActionState(submitCheck, initialState);
  const [fileName, setFileName] = useState<string | null>(null);
  const resultRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (state.result || state.error) {
      resultRef.current?.scrollIntoView({ behavior: "smooth", block: "nearest" });
    }
  }, [state.result, state.error]);

  return (
    <div className="mt-10 grid gap-6">
      <form action={formAction} className="card grid gap-5 p-6">
        <label className="grid gap-2 text-sm">
          <span className="font-medium">Upload a picture</span>
          <input
            type="file"
            name="picture"
            accept="image/png,image/jpeg,image/webp,.png,.jpg,.jpeg,.webp"
            className="field file:mr-3 file:rounded-lg file:border-0 file:bg-paper file:px-3 file:py-1.5"
            required
            onChange={(event) => setFileName(event.target.files?.[0]?.name ?? null)}
          />
          <span className="text-muted">
            {fileName ? `Selected: ${fileName}` : "PNG, JPEG, or WebP · under 8 MB"}
          </span>
        </label>

        <details className="rounded-xl border border-line bg-paper/60 px-4 py-3 text-sm">
          <summary className="cursor-pointer font-medium text-ink">Demo: fake claim (optional)</summary>
          <label className="mt-3 grid gap-2">
            <span className="text-muted">Claimed maker name</span>
            <input
              type="text"
              name="claimedMaker"
              className="field"
              placeholder="e.g. Aura Image"
              maxLength={80}
            />
            <span className="text-muted">
              Leave empty for a normal check. Fill this with an unstamped photo to demo Self-asserted.
            </span>
          </label>
        </details>

        {state.error ? (
          <p className="rounded-xl border border-danger/20 bg-danger-soft px-4 py-3 text-sm text-danger" role="alert">
            {state.error}
          </p>
        ) : null}

        <button type="submit" className="button" disabled={pending} aria-busy={pending}>
          {pending ? "Checking picture…" : "Check picture"}
        </button>
        {pending ? (
          <p className="text-sm text-muted" aria-live="polite">
            Reading the file and looking up the notebook…
          </p>
        ) : null}
      </form>

      <div ref={resultRef}>
        {state.result ? <ResultCard result={state.result} /> : null}
      </div>
    </div>
  );
}

function ResultCard({ result }: { result: CheckResult }) {
  const tone = verdictStyle[result.verdict];

  return (
    <section className={`result-in rounded-2xl border px-5 py-6 sm:px-7 ${tone.shell}`} aria-live="polite">
      <div className="flex flex-wrap items-center gap-3">
        <span className={`rounded-xl px-3 py-1.5 text-sm font-semibold tracking-wide ${tone.badge}`}>
          {tone.label}
        </span>
        <p className="text-sm text-ink/70">Check complete</p>
      </div>

      <h2 className="mt-4 font-serif text-3xl tracking-tight text-ink">{tone.plain}</h2>
      <p className="mt-3 max-w-xl text-sm leading-6 text-ink/80">{result.reason}</p>

      {result.lines.length > 0 ? (
        <div className="mt-6">
          <p className="text-sm font-medium text-ink">What happened to this picture</p>
          <ol className="mt-3 grid gap-2">
            {result.lines.map((line, index) => (
              <StoryStep key={line.lineId} line={line} step={index + 1} />
            ))}
          </ol>
        </div>
      ) : (
        <p className="mt-6 text-sm text-ink/70">No stamped company line was found for this file.</p>
      )}

      <details className="mt-6 rounded-xl border border-ink/10 bg-paper/50 px-4 py-3 text-sm text-ink/80">
        <summary className="cursor-pointer font-medium text-ink">Technical details</summary>
        <p className="mt-2 text-muted">
          For judges and developers. Everyday users do not need these values.
        </p>
        <dl className="mt-3 grid gap-3 text-xs">
          {result.hiddenId ? (
            <div>
              <dt className="font-medium text-ink">Hidden id</dt>
              <dd className="mt-1 break-all font-mono text-muted">{result.hiddenId}</dd>
            </div>
          ) : null}
          <div>
            <dt className="font-medium text-ink">Exact fingerprint</dt>
            <dd className="mt-1 break-all font-mono text-muted">{result.exactFingerprint}</dd>
          </div>
          <div>
            <dt className="font-medium text-ink">Look-alike fingerprint</dt>
            <dd className="mt-1 break-all font-mono text-muted">{result.lookalikeFingerprint}</dd>
          </div>
          {result.lines.map((line) => (
            <div key={`tech-${line.lineId}`}>
              <dt className="font-medium text-ink">
                Line · {line.companyName} ({line.action})
              </dt>
              <dd className="mt-1 break-all font-mono text-muted">{line.lineId}</dd>
            </div>
          ))}
        </dl>
      </details>
    </section>
  );
}

function StoryStep({ line, step }: { line: CheckLine; step: number }) {
  return (
    <li className="flex gap-3 rounded-xl border border-ink/10 bg-paper/70 px-4 py-3 text-sm text-ink">
      <span className="grid size-7 shrink-0 place-items-center rounded-lg bg-ink text-xs text-paper">
        {step}
      </span>
      <div className="min-w-0">
        <p className="font-medium">
          {actionLabel[line.action] ?? line.action} by {line.companyName}
        </p>
        <p className="mt-1 text-xs leading-5 text-muted">
          {line.aiModel ? (
            <>
              Model <span className="font-medium text-ink/80">{line.aiModel}</span>
              {" · "}
            </>
          ) : null}
          Stamped {formatStampTime(line.stampedAt)}
        </p>
        <p className="mt-1 text-xs text-muted">
          {line.onChain ? "Written on the public notebook" : "Saved locally for now"}
          {line.match === "exact"
            ? " · exact file match"
            : line.match === "lookalike"
              ? " · look-alike match"
              : " · found by hidden id"}
        </p>
      </div>
    </li>
  );
}

function formatStampTime(iso: string) {
  try {
    return new Intl.DateTimeFormat("en-IN", {
      dateStyle: "medium",
      timeStyle: "short",
      timeZone: "Asia/Kolkata",
    }).format(new Date(iso));
  } catch {
    return iso;
  }
}
