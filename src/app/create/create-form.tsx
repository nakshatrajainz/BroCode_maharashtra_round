"use client";

import Link from "next/link";
import { useActionState, useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { categoryTitle, type CategoryId } from "@/lib/categories";
import {
  addApprovedModel,
  revealSealedSentence,
  revokeCompanyStamp,
  submitStamp,
  type AddModelState,
  type CreateState,
  type RevealState,
  type RevokeState,
} from "./actions";

export type StampCompany = {
  id: string;
  name: string;
  category: CategoryId;
  stampAddress: string;
  onChain: boolean;
  allowed: boolean;
};

export type CompanyModel = {
  id: string;
  companyId: string;
  name: string;
};

export type RecentLine = {
  lineId: string;
  action: CategoryId;
  companyName: string;
  createdAt: string;
};

const initialCreate: CreateState = {};
const initialReveal: RevealState = {};
const initialRevoke: RevokeState = {};
const initialAddModel: AddModelState = {};

const roles: { id: CategoryId; step: string; title: string; needs: string; does: string }[] = [
  {
    id: "maker",
    step: "1",
    title: "Create",
    needs: "A fresh photo (never stamped)",
    does: "Writes the first line and gives you a stamped download",
  },
  {
    id: "editor",
    step: "2",
    title: "Edit",
    needs: "The stamped file from Create (download, not a screenshot)",
    does: "Resizes it and adds an Editor line that points at Create",
  },
  {
    id: "publisher",
    step: "3",
    title: "Publish",
    needs: "The stamped file from Edit (or Create)",
    does: "Records that it was posted and points at the previous line",
  },
];

export function CreateForm({
  email,
  companies: companiesProp,
  models: modelsProp,
  recentLines: recentLinesProp,
  ledgerReady,
}: {
  email: string | null;
  companies?: StampCompany[];
  models?: CompanyModel[];
  recentLines?: RecentLine[];
  ledgerReady: boolean;
}) {
  const companies = companiesProp ?? [];
  const models = modelsProp ?? [];
  const recentLines = recentLinesProp ?? [];

  const makers = useMemo(
    () => companies.filter((c) => c.category === "maker" && c.allowed),
    [companies],
  );
  const editors = useMemo(
    () => companies.filter((c) => c.category === "editor" && c.allowed),
    [companies],
  );
  const publishers = useMemo(
    () => companies.filter((c) => c.category === "publisher" && c.allowed),
    [companies],
  );

  const [role, setRole] = useState<CategoryId>("maker");

  const roleCompanies = useMemo(() => {
    if (role === "maker") return makers;
    if (role === "editor") return editors;
    return publishers;
  }, [role, makers, editors, publishers]);

  const [state, formAction, pending] = useActionState(submitStamp, initialCreate);
  const [usePrepared, setUsePrepared] = useState(false);
  const [fileName, setFileName] = useState<string | null>(null);
  const [companyId, setCompanyId] = useState("");
  const [modelId, setModelId] = useState("");
  const errorRef = useRef<HTMLDivElement>(null);
  const resultRef = useRef<HTMLDivElement>(null);

  const companyModels = useMemo(
    () => models.filter((model) => model.companyId === (companyId || roleCompanies[0]?.id)),
    [models, companyId, roleCompanies],
  );

  useEffect(() => {
    if (roleCompanies[0] && !roleCompanies.some((c) => c.id === companyId)) {
      setCompanyId(roleCompanies[0].id);
    }
  }, [role, roleCompanies, companyId]);

  useEffect(() => {
    if (companyModels[0] && !companyModels.some((model) => model.id === modelId)) {
      setModelId(companyModels[0].id);
    }
    if (companyModels.length === 0) setModelId("");
  }, [companyModels, modelId]);

  useEffect(() => {
    if (state.error) {
      errorRef.current?.scrollIntoView({ behavior: "smooth", block: "center" });
    }
    if (state.created) {
      resultRef.current?.scrollIntoView({ behavior: "smooth", block: "nearest" });
    }
  }, [state.error, state.created, state.errorNext]);

  if (!email) {
    return (
      <div className="card mt-10 p-6">
        <p className="font-medium">Sign in to stamp a picture.</p>
        <Link href="/sign-in" className="button mt-5">
          Sign in
        </Link>
      </div>
    );
  }

  if (companies.length === 0) {
    return (
      <div className="card mt-10 p-6">
        <p className="font-medium">No companies on this account.</p>
        <p className="mt-2 text-sm text-muted">
          Register a Maker first. Add Editor and Publisher when you need the next steps.
        </p>
        <Link href="/register" className="button mt-5">
          Register a company
        </Link>
      </div>
    );
  }

  const roleMeta = roles.find((item) => item.id === role)!;
  const selected = roleCompanies.find((c) => c.id === companyId) ?? roleCompanies[0];
  const missingRole = roleCompanies.length === 0;

  return (
    <div className="mt-10 grid gap-6">
      <section className="grid gap-3">
        <p className="text-sm font-medium text-ink">Which step are you on?</p>
        <div className="grid gap-3 sm:grid-cols-3">
          {roles.map((item) => {
            const count =
              item.id === "maker" ? makers.length : item.id === "editor" ? editors.length : publishers.length;
            const active = role === item.id;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => {
                  setRole(item.id);
                  setUsePrepared(false);
                  setFileName(null);
                }}
                className={`rounded-2xl border px-4 py-4 text-left transition ${
                  active
                    ? "border-ink bg-ink text-paper"
                    : "border-line bg-card text-ink hover:border-ink/30"
                }`}
              >
                <p className={`text-xs font-medium ${active ? "text-paper/70" : "text-muted"}`}>
                  Step {item.step}
                </p>
                <p className="mt-1 font-serif text-2xl">{item.title}</p>
                <p className={`mt-2 text-xs leading-5 ${active ? "text-paper/75" : "text-muted"}`}>
                  {count === 0 ? "No company yet — register first" : `${count} company ready`}
                </p>
              </button>
            );
          })}
        </div>
      </section>

      <div className="rounded-2xl border border-line bg-paper/70 px-5 py-4 text-sm leading-6 text-ink/80">
        <p className="font-medium text-ink">
          {roleMeta.title}: {roleMeta.does}
        </p>
        <p className="mt-1 text-muted">Upload needed: {roleMeta.needs}</p>
      </div>

      {!ledgerReady ? (
        <Alert tone="warn" title="Notebook not connected">
          Stamps can still save on this server, but they will not appear on the public BNB notebook until
          the ledger address is set.
        </Alert>
      ) : selected && !selected.onChain ? (
        <Alert tone="warn" title={`${selected.name} is not on the notebook`}>
          This company was registered before the chain deploy. Register a <span className="font-medium">new</span>{" "}
          {categoryTitle(role)} with a different name so Create can write on-chain.
        </Alert>
      ) : null}

      {missingRole ? (
        <Alert tone="danger" title={`No ${categoryTitle(role)} company`}>
          Register a {categoryTitle(role)} on the Register page, then come back to this step.
          <Link href="/register" className="mt-3 button inline-flex">
            Register {categoryTitle(role)}
          </Link>
        </Alert>
      ) : (
        <form action={formAction} className="card grid gap-5 p-6">
          <div ref={errorRef}>
            {state.error ? (
              <Alert tone="danger" title="What went wrong">
                <p>{state.error}</p>
                {state.errorNext ? (
                  <p className="mt-2 border-t border-danger/15 pt-2 text-danger/90">
                    <span className="font-medium">What to do: </span>
                    {state.errorNext}
                  </p>
                ) : null}
              </Alert>
            ) : null}
          </div>

          <label className="grid gap-2 text-sm">
            <span className="font-medium">{categoryTitle(role)} company</span>
            <select
              name="companyId"
              className="field"
              value={companyId || selected?.id || ""}
              onChange={(event) => setCompanyId(event.target.value)}
              required
            >
              {roleCompanies.map((company) => (
                <option key={company.id} value={company.id}>
                  {company.name}
                  {company.onChain ? "" : " — not on notebook yet"}
                </option>
              ))}
            </select>
          </label>

          <label className="grid gap-2 text-sm">
            <span className="font-medium">
              AI model {role === "maker" ? "(required)" : "(optional)"}
            </span>
            <select
              name="modelId"
              className="field"
              value={modelId}
              onChange={(event) => setModelId(event.target.value)}
              required={role === "maker"}
            >
              {role !== "maker" ? <option value="">No model on this step</option> : null}
              {companyModels.map((model) => (
                <option key={model.id} value={model.id}>
                  {model.name}
                </option>
              ))}
            </select>
            {role === "maker" && companyModels.length === 0 ? (
              <p className="rounded-xl bg-warn-soft px-3 py-2 text-xs leading-5 text-warn">
                No approved models yet. Add one under Approved models below (or re-register with models).
              </p>
            ) : (
              <span className="text-muted">
                Only pre-approved models for this company. In production the stamp API sends this automatically.
              </span>
            )}
          </label>

          <label className="grid gap-2 text-sm">
            <span className="font-medium">
              {role === "maker" ? "Fresh picture (unstamped)" : "Stamped parent file"}
            </span>
            <input
              type="file"
              name="picture"
              accept="image/png,image/jpeg,image/webp,.png,.jpg,.jpeg,.webp"
              className="field file:mr-3 file:rounded-lg file:border-0 file:bg-paper file:px-3 file:py-1.5"
              disabled={usePrepared && role === "maker"}
              required={!(usePrepared && role === "maker")}
              onChange={(event) => setFileName(event.target.files?.[0]?.name ?? null)}
            />
            {role === "maker" ? (
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
            ) : (
              <p className="rounded-xl bg-warn-soft px-3 py-2 text-xs leading-5 text-warn">
                Do not upload a phone photo or screenshot. Use the <span className="font-medium">Download
                stamped picture</span> file from step {role === "editor" ? "1" : "2"}.
              </p>
            )}
            <span className="text-muted">
              {usePrepared && role === "maker"
                ? "Using the built-in sample."
                : fileName
                  ? `Selected: ${fileName}`
                  : "PNG, JPEG, or WebP · under 8 MB"}
            </span>
          </label>

          <label className="grid gap-2 text-sm">
            <span className="font-medium">Private sentence (sealed)</span>
            <textarea
              key={role}
              name="sentence"
              className="field min-h-24 resize-y"
              defaultValue={
                role === "maker"
                  ? "Stamped with ModelLedger."
                  : role === "editor"
                    ? "Resized for delivery."
                    : "Posted to the channel."
              }
              maxLength={280}
              required
            />
            <span className="text-muted">Never shown on Check. Only you can reveal it later.</span>
          </label>

          <button type="submit" className="button" disabled={pending}>
            {pending
              ? "Working…"
              : role === "maker"
                ? "Stamp creation → download"
                : role === "editor"
                  ? "Resize + stamp → download"
                  : "Stamp as posted → download"}
          </button>
          {pending ? (
            <p className="text-sm text-muted" aria-live="polite">
              Stamping, saving the line, and building your download…
            </p>
          ) : null}
        </form>
      )}

      <div ref={resultRef}>{state.created ? <CreatedResult created={state.created} /> : null}</div>

      <ModelsPanel companies={companies.filter((company) => company.allowed)} models={models} />

      <details className="card p-5">
        <summary className="cursor-pointer font-medium">Advanced: reveal sentence / revoke stamp</summary>
        <div className="mt-5 grid gap-6">
          <RevealPanel recentLines={recentLines} />
          <RevokePanel companies={companies.filter((company) => company.allowed)} />
        </div>
      </details>
    </div>
  );
}

function Alert({
  tone,
  title,
  children,
}: {
  tone: "warn" | "danger";
  title: string;
  children: ReactNode;
}) {
  const styles =
    tone === "danger"
      ? "border-danger/25 bg-danger-soft text-danger"
      : "border-warn/25 bg-warn-soft text-warn";
  return (
    <div className={`result-in rounded-2xl border px-5 py-4 text-sm leading-6 ${styles}`} role="alert">
      <p className="font-semibold">{title}</p>
      <div className="mt-1">{children}</div>
    </div>
  );
}

function CreatedResult({ created }: { created: NonNullable<CreateState["created"]> }) {
  const verb =
    created.action === "maker" ? "created" : created.action === "editor" ? "resized" : "posted";
  const next =
    created.action === "maker"
      ? "Next: switch to Edit, upload this download, resize + stamp."
      : created.action === "editor"
        ? "Next: switch to Publish and upload this download."
        : "Next: open Check and upload this download — expect Trusted with the full path.";

  return (
    <section className="result-in rounded-2xl border border-leaf/30 bg-leaf-soft px-5 py-6 sm:px-7" aria-live="polite">
      <div className="flex flex-wrap items-center gap-3">
        <span className="rounded-xl bg-leaf px-3 py-1.5 text-sm font-semibold text-paper">Done</span>
        <p className="text-sm text-ink/70">{categoryTitle(created.action)} stamp complete</p>
      </div>
      <h2 className="mt-4 font-serif text-3xl tracking-tight text-ink">
        {created.companyName} {verb} this picture.
      </h2>
      <p className="mt-3 text-sm leading-6 text-ink/80">
        {created.aiModel ? (
          <>
            Model <span className="font-medium text-ink">{created.aiModel}</span>
            {" · "}
          </>
        ) : null}
        Stamped {formatStampTime(created.stampedAt)}
      </p>
      {created.parentCompanyName ? (
        <p className="mt-3 text-sm leading-6 text-ink/80">
          Continues the story after <span className="font-medium text-ink">{created.parentCompanyName}</span>.
          Check will show both steps when you upload this download.
        </p>
      ) : null}
      <p className="mt-3 text-sm leading-6 text-ink/80">{next}</p>
      {created.chainTx ? (
        <p className="mt-2 text-sm text-leaf">Written on the public notebook.</p>
      ) : (
        <p className="mt-2 text-sm text-warn">
          Saved on this server only — this company is not on the notebook yet. Register a new on-chain
          company for the demo if judges need a public tx.
        </p>
      )}
      <div className="mt-5 flex flex-wrap gap-3">
        <a href={created.downloadUrl} download={created.downloadName} className="button">
          Download stamped picture
        </a>
        <Link href="/check" className="button-quiet">
          Open Check
        </Link>
      </div>
    </section>
  );
}

function ModelsPanel({
  companies,
  models,
}: {
  companies: StampCompany[];
  models: CompanyModel[];
}) {
  const [state, formAction, pending] = useActionState(addApprovedModel, initialAddModel);
  if (companies.length === 0) return null;

  return (
    <section className="card grid gap-4 p-5">
      <div>
        <h3 className="font-serif text-xl">Approved AI models</h3>
        <p className="mt-1 text-sm leading-6 text-muted">
          Companies pre-approve which models may stamp. Check shows company + model + stamp time.
        </p>
      </div>
      {models.length > 0 ? (
        <ul className="grid gap-2 text-sm">
          {models.map((model) => {
            const company = companies.find((item) => item.id === model.companyId);
            return (
              <li
                key={model.id}
                className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-line bg-paper/70 px-4 py-3"
              >
                <span className="font-medium">{model.name}</span>
                <span className="text-xs text-muted">
                  {company?.name ?? "Company"} · {company ? categoryTitle(company.category) : ""}
                </span>
              </li>
            );
          })}
        </ul>
      ) : (
        <p className="text-sm text-muted">No models yet. Add one for your Maker before Create.</p>
      )}
      <form action={formAction} className="grid gap-3 sm:grid-cols-[1fr_1fr_auto] sm:items-end">
        <label className="grid gap-2 text-sm">
          <span className="font-medium">Company</span>
          <select name="companyId" className="field" defaultValue={companies[0]?.id} required>
            {companies.map((company) => (
              <option key={company.id} value={company.id}>
                {company.name} · {categoryTitle(company.category)}
              </option>
            ))}
          </select>
        </label>
        <label className="grid gap-2 text-sm">
          <span className="font-medium">Model name</span>
          <input
            name="modelName"
            className="field"
            placeholder="e.g. Imagen 3"
            maxLength={80}
            required
          />
        </label>
        <button type="submit" className="button-quiet" disabled={pending}>
          {pending ? "Adding…" : "Approve model"}
        </button>
      </form>
      {state.error ? (
        <Alert tone="danger" title="Could not add model">
          {state.error}
        </Alert>
      ) : null}
      {state.added ? (
        <Alert tone="warn" title="Model approved">
          {state.added.modelName} is now approved for {state.added.companyName}.
        </Alert>
      ) : null}
    </section>
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

function RevealPanel({ recentLines }: { recentLines: RecentLine[] }) {
  const [state, formAction, pending] = useActionState(revealSealedSentence, initialReveal);

  return (
    <div className="grid gap-3">
      <h3 className="font-serif text-xl">Open a sealed sentence</h3>
      <form action={formAction} className="grid gap-3">
        <input
          name="lineId"
          className="field font-mono text-xs"
          placeholder="Line id 0x…"
          list="recent-lines"
          required
        />
        <datalist id="recent-lines">
          {recentLines.map((line) => (
            <option key={line.lineId} value={line.lineId}>
              {line.companyName} · {line.action}
            </option>
          ))}
        </datalist>
        {state.error ? (
          <Alert tone="danger" title="Reveal failed">
            {state.error}
          </Alert>
        ) : null}
        {state.sentence ? (
          <Alert tone="warn" title="Sealed sentence opened">
            {state.sentence}
          </Alert>
        ) : null}
        <button type="submit" className="button-quiet" disabled={pending}>
          {pending ? "Opening…" : "Reveal sentence"}
        </button>
      </form>
    </div>
  );
}

function RevokePanel({ companies }: { companies: StampCompany[] }) {
  const [state, formAction, pending] = useActionState(revokeCompanyStamp, initialRevoke);
  if (companies.length === 0) return null;

  return (
    <div className="grid gap-3">
      <h3 className="font-serif text-xl">Revoke a stamp</h3>
      <form action={formAction} className="grid gap-3">
        <select name="companyId" className="field" defaultValue={companies[0]?.id} required>
          {companies.map((company) => (
            <option key={company.id} value={company.id}>
              {company.name} · {categoryTitle(company.category)}
            </option>
          ))}
        </select>
        {state.error ? (
          <Alert tone="danger" title="Revoke failed">
            {state.error}
          </Alert>
        ) : null}
        {state.revoked ? (
          <Alert tone="danger" title="Stamp revoked">
            {state.revoked.name} can no longer make Trusted new lines.
          </Alert>
        ) : null}
        <button type="submit" className="button-quiet" disabled={pending}>
          {pending ? "Revoking…" : "Revoke stamp"}
        </button>
      </form>
    </div>
  );
}
