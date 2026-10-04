"use client";

import Link from "next/link";
import { startTransition, useActionState, useState, type FormEvent, type ReactNode } from "react";
import { categories, categoryTitle, type CategoryId } from "@/lib/categories";
import {
  createCompanyApiKey,
  submitRegistration,
  type ApiKeyState,
  type RegisterState,
} from "./actions";

export type Company = {
  id: string;
  name: string;
  category: CategoryId;
  stampAddress: string;
  onChain: boolean;
  apiKeyPrefix: string | null;
};

const initialState: RegisterState = {};
const initialApiKey: ApiKeyState = {};

const tagStyles: Record<CategoryId, string> = {
  maker: "bg-seal-soft text-seal",
  editor: "bg-leaf-soft text-leaf",
  publisher: "bg-line/70 text-ink",
};

export function RegisterFlow({ email, companies }: { email: string | null; companies: Company[] }) {
  const [adding, setAdding] = useState(companies.length === 0);
  const [state, formAction, pending] = useActionState(
    async (previous: RegisterState, formData: FormData) => {
      const next = await submitRegistration(previous, formData);
      if (next.created) setAdding(false);
      return next;
    },
    initialState,
  );
  const [openedWith, setOpenedWith] = useState<RegisterState>(initialState);

  const remaining = categories.filter(
    (category) => !companies.some((company) => company.category === category.id),
  );

  function open() {
    setOpenedWith(state);
    setAdding(true);
  }

  return (
    <div className="mt-10 grid gap-6">
      {companies.length > 0 ? (
        <ul className="grid gap-3">
          {companies.map((company) => (
            <CompanyCard key={company.id} company={company} />
          ))}
        </ul>
      ) : null}

      {state.created && !adding ? <CreatedNotice created={state.created} /> : null}

      {!adding && remaining.length > 0 ? (
        <div className="card flex flex-wrap items-center justify-between gap-4 p-5">
          <div>
            <p className="font-medium">Does your business do another job?</p>
            <p className="mt-1 text-sm leading-6 text-muted">
              Register a separate company (own name, own stamp, own API key). Still open:{" "}
              {remaining.map((category) => category.title).join(", ")}.
            </p>
          </div>
          <button type="button" onClick={open} className="button-quiet">
            Register another company
          </button>
        </div>
      ) : null}

      {!adding && remaining.length === 0 ? (
        <p className="text-sm leading-6 text-muted">
          This account has a Maker, an Editor, and a Publisher. That is the limit for one account.
        </p>
      ) : null}

      {adding ? (
        <RegisterForm
          email={email}
          companies={companies}
          error={state === openedWith ? undefined : state.error}
          pending={pending}
          onSubmit={(formData) => startTransition(() => formAction(formData))}
          onCancel={companies.length > 0 ? () => setAdding(false) : undefined}
        />
      ) : null}
    </div>
  );
}

function RegisterForm({
  email,
  companies,
  error,
  pending,
  onSubmit,
  onCancel,
}: {
  email: string | null;
  companies: Company[];
  error?: string;
  pending: boolean;
  onSubmit: (formData: FormData) => void;
  onCancel?: () => void;
}) {
  const [category, setCategory] = useState<CategoryId | null>(
    companies.length === 0 ? "maker" : null,
  );
  const [name, setName] = useState("");
  const chosen = categories.find((item) => item.id === category);
  const signedIn = email !== null;
  const isExtra = companies.length > 0;

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    onSubmit(new FormData(event.currentTarget));
  }

  return (
    <form onSubmit={handleSubmit} className="card grid gap-8 p-6 sm:p-8">
      {isExtra ? (
        <div className="rounded-xl bg-paper px-4 py-3 text-sm leading-6">
          <p className="font-medium">You are adding a new, separate company.</p>
          <p className="text-muted">
            It will not change{" "}
            {companies.map((company) => `${company.name} (${categoryTitle(company.category)})`).join(", ")}.
            It gets its own name, job, stamp, and API key.
          </p>
        </div>
      ) : null}

      <Step number={1} title="What does this company do?">
        <div className="grid gap-3">
          {categories.map((item) => {
            const holder = companies.find((company) => company.category === item.id);
            const selected = category === item.id;
            return (
              <label
                key={item.id}
                className={`grid grid-cols-[auto_1fr] gap-3 rounded-xl border p-4 transition ${
                  holder
                    ? "cursor-not-allowed border-line bg-paper/60 opacity-60"
                    : selected
                      ? "cursor-pointer border-seal/50 bg-seal-soft/40 ring-4 ring-seal/10"
                      : "cursor-pointer border-line hover:border-ink/25"
                }`}
              >
                <input
                  type="radio"
                  name="category"
                  value={item.id}
                  required
                  disabled={Boolean(holder)}
                  checked={selected}
                  onChange={() => setCategory(item.id)}
                  className="mt-1 accent-seal"
                />
                <span>
                  <span className="block font-medium">
                    {item.title}
                    <span className="font-normal text-muted"> · {item.summary}</span>
                  </span>
                  <span className="mt-1 block text-sm leading-6 text-muted">
                    {holder
                      ? `Taken by ${holder.name}. One account can hold only one ${item.title}.`
                      : item.allowed}
                  </span>
                </span>
              </label>
            );
          })}
        </div>
        <p className="text-sm text-muted">One company = one job = one stamp = one API key.</p>
      </Step>

      <Step number={2} title="Company name">
        <input
          name="name"
          required
          minLength={2}
          maxLength={80}
          value={name}
          onChange={(event) => setName(event.target.value)}
          placeholder={chosen?.example ?? "Aura Image"}
          className="field"
        />
      </Step>

      <Step number={3} title="Approved AI models">
        <textarea
          name="models"
          className="field min-h-24 resize-y"
          placeholder={
            category === "maker"
              ? "Flux 1.1\nImagen 3\nDALL·E 3"
              : "Optional — e.g. Photoshop Firefly, Topaz Gigapixel"
          }
          required={category === "maker"}
          defaultValue={category === "maker" ? "Flux 1.1" : ""}
          key={category ?? "none"}
        />
        <p className="text-sm text-muted">
          {category === "maker"
            ? "Which models this Maker may stamp. One name per line."
            : "Optional for Editor / Publisher."}
        </p>
      </Step>

      {signedIn ? null : (
        <Step number={4} title="Your account">
          <label className="grid gap-2">
            <span className="text-sm text-muted">Email</span>
            <input name="email" type="email" autoComplete="email" required className="field" />
          </label>
          <div className="grid gap-4 sm:grid-cols-2">
            <label className="grid gap-2">
              <span className="text-sm text-muted">Password</span>
              <input
                name="password"
                type="password"
                autoComplete="new-password"
                required
                minLength={8}
                className="field"
              />
            </label>
            <label className="grid gap-2">
              <span className="text-sm text-muted">Repeat password</span>
              <input
                name="confirm"
                type="password"
                autoComplete="new-password"
                required
                minLength={8}
                className="field"
              />
            </label>
          </div>
          <p className="text-sm text-muted">
            At least 8 characters with letters and numbers. Already have an account?{" "}
            <Link href="/sign-in" className="text-seal underline-offset-4 hover:underline">
              Sign in
            </Link>
          </p>
        </Step>
      )}

      <div className="grid gap-4 border-t border-line pt-6">
        <p className="text-sm leading-6">
          {chosen && name.trim().length >= 2 ? (
            <>
              You are registering <strong>{name.trim()}</strong> as {article(chosen.title)}{" "}
              <strong>{chosen.title}</strong>
              {signedIn ? "." : ", and making your account."} You will get an API key for this
              company.
            </>
          ) : (
            <span className="text-muted">Choose a job and a name to continue.</span>
          )}
        </p>

        {error ? (
          <p className="rounded-xl bg-seal-soft px-4 py-3 text-sm leading-6 text-seal">{error}</p>
        ) : null}

        <div className="flex flex-wrap items-center gap-3">
          <button type="submit" disabled={pending} className="button">
            {pending ? "Registering" : chosen ? `Register as ${chosen.title}` : "Register company"}
          </button>
          {onCancel ? (
            <button type="button" onClick={onCancel} className="text-sm text-muted hover:text-ink">
              Cancel
            </button>
          ) : null}
        </div>
      </div>
    </form>
  );
}

function Step({ number, title, children }: { number: number; title: string; children: ReactNode }) {
  return (
    <section className="grid gap-4">
      <h2 className="flex items-center gap-3 font-medium">
        <span className="grid size-7 place-items-center rounded-lg bg-ink text-xs text-paper">{number}</span>
        {title}
      </h2>
      {children}
    </section>
  );
}

function CompanyCard({ company }: { company: Company }) {
  const [state, formAction, pending] = useActionState(createCompanyApiKey, initialApiKey);
  const showKey = state.created?.companyId === company.id ? state.created : null;

  return (
    <li className="card grid gap-4 p-5">
      <div className="flex items-start gap-4">
        <span
          className={`grid size-11 shrink-0 place-items-center rounded-xl font-serif text-xl ${tagStyles[company.category]}`}
        >
          {company.name.charAt(0).toUpperCase()}
        </span>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <p className="font-medium">{company.name}</p>
            <span className={`rounded-md px-2 py-0.5 text-xs font-medium ${tagStyles[company.category]}`}>
              {categoryTitle(company.category)}
            </span>
          </div>
          <p className="mt-2 text-sm leading-6 text-muted">
            This company stamps as a {categoryTitle(company.category)}. Its API key only does that
            job.
          </p>
          <p className="mt-2 text-xs text-muted">
            {company.onChain ? "On the public notebook" : "Saved here · notebook pending"}
            {company.apiKeyPrefix ? (
              <>
                {" · "}
                API key <span className="font-mono">{company.apiKeyPrefix}…</span>
              </>
            ) : (
              " · no live API key yet"
            )}
          </p>
        </div>
      </div>

      <form action={formAction} className="flex flex-wrap items-center gap-3 border-t border-line pt-4">
        <input type="hidden" name="companyId" value={company.id} />
        <button type="submit" className="button-quiet" disabled={pending}>
          {pending
            ? "Creating…"
            : company.apiKeyPrefix
              ? "Make a new API key"
              : "Create API key"}
        </button>
        <Link href="/create" className="text-sm text-muted underline-offset-2 hover:underline">
          Stamp with this company →
        </Link>
      </form>

      {state.error && !showKey ? (
        <p className="rounded-xl bg-danger-soft px-4 py-3 text-sm text-danger">{state.error}</p>
      ) : null}

      {showKey ? (
        <div className="rounded-xl border border-leaf/30 bg-leaf-soft px-4 py-4 text-sm leading-6">
          <p className="font-semibold text-leaf">Copy this key now — shown once.</p>
          <p className="mt-2 break-all font-mono text-xs text-ink">{showKey.apiKey}</p>
          <p className="mt-2 text-ink/80">
            Put this in {company.name}&apos;s server. For a click demo, use Stamp on the website
            instead.
          </p>
        </div>
      ) : null}
    </li>
  );
}

function CreatedNotice({ created }: { created: NonNullable<RegisterState["created"]> }) {
  return (
    <div className="result-in rounded-2xl border border-leaf/30 bg-leaf-soft px-5 py-5 text-sm leading-6">
      <div className="flex flex-wrap items-center gap-3">
        <span className="rounded-xl bg-leaf px-3 py-1.5 text-sm font-semibold text-paper">Done</span>
        <p className="text-sm text-ink/70">Company ready</p>
      </div>
      <p className="mt-3 font-serif text-2xl text-ink">
        {created.name} is now {article(categoryTitle(created.category))}{" "}
        {categoryTitle(created.category)}.
      </p>
      <p className="mt-2 text-ink/80">
        {created.chainTx
          ? "On the allowed list and written to the public notebook."
          : "Saved on this account. Notebook write needs the ledger for this company."}
      </p>
      {created.models.length > 0 ? (
        <p className="mt-2 text-ink/80">Approved models: {created.models.join(", ")}.</p>
      ) : null}
      <div className="mt-4 rounded-xl border border-ink/10 bg-paper/70 px-4 py-4">
        <p className="font-semibold text-ink">API key for this company (copy once)</p>
        <p className="mt-2 break-all font-mono text-xs text-ink">{created.apiKey}</p>
        <p className="mt-2 text-ink/80">
          Their app uses this key to stamp. You can also stamp from the website for the demo.
        </p>
      </div>
      <div className="mt-4 flex flex-wrap gap-3">
        <Link href="/create" className="button">
          Stamp a picture
        </Link>
      </div>
    </div>
  );
}

function article(word: string) {
  return /^[aeiou]/i.test(word) ? "an" : "a";
}
