"use client";

import { useActionState } from "react";
import { categories, type CategoryId } from "@/lib/categories";
import { submitRegistration, type RegisterState } from "./actions";

const initialState: RegisterState = {};

export function RegisterForm({ taken }: { taken: CategoryId[] }) {
  const [state, formAction, pending] = useActionState(submitRegistration, initialState);
  const remaining = categories.filter((category) => !taken.includes(category.id));

  if (remaining.length === 0) {
    return (
      <p className="mt-10 text-sm leading-6 text-muted">
        This account already has a Maker, an Editor, and a Publisher stamp.
      </p>
    );
  }

  return (
    <form action={formAction} className="mt-10 grid gap-8">
      <label className="grid gap-2">
        <span className="text-sm">Company name</span>
        <input
          name="name"
          required
          minLength={2}
          maxLength={80}
          placeholder="Aura Image"
          className="border border-line bg-white px-3 py-3 outline-none"
        />
      </label>

      <fieldset className="grid gap-3">
        <legend className="text-sm">What is this company allowed to do?</legend>
        {categories.map((category) => {
          const used = taken.includes(category.id);
          return (
            <label
              key={category.id}
              className={`grid grid-cols-[auto_1fr] gap-3 border border-line bg-white p-4 ${used ? "opacity-50" : ""}`}
            >
              <input
                type="radio"
                name="category"
                value={category.id}
                required
                disabled={used}
                className="mt-1"
              />
              <span>
                <span className="block font-medium">
                  {category.title}
                  <span className="font-normal text-muted"> · {category.summary}</span>
                </span>
                <span className="mt-1 block text-sm leading-6 text-muted">
                  {used ? "This account already has this stamp." : category.allowed}
                </span>
              </span>
            </label>
          );
        })}
      </fieldset>

      {state.error ? <p className="text-sm text-seal">{state.error}</p> : null}
      {state.notice ? <p className="text-sm leading-6 text-muted">{state.notice}</p> : null}

      <button
        type="submit"
        disabled={pending}
        className="w-fit bg-ink px-5 py-3 text-sm text-paper disabled:opacity-60"
      >
        {pending ? "Creating stamp" : "Create stamp"}
      </button>
    </form>
  );
}
