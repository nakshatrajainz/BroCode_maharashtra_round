"use client";

import { useActionState } from "react";
import { categories } from "@/lib/categories";
import { submitRegistration, type RegisterState } from "./actions";

const initialState: RegisterState = {};

export function RegisterForm() {
  const [state, formAction, pending] = useActionState(submitRegistration, initialState);

  return (
    <form action={formAction} className="mt-10 grid gap-8">
      <label className="grid gap-2">
        <span className="text-sm">Company name</span>
        <input
          name="name"
          required
          minLength={2}
          placeholder="Aura Image"
          className="border border-line bg-white px-3 py-3 outline-none"
        />
      </label>

      <fieldset className="grid gap-3">
        <legend className="text-sm">What is this company allowed to do?</legend>
        {categories.map((category) => (
          <label key={category.id} className="grid grid-cols-[auto_1fr] gap-3 border border-line bg-white p-4">
            <input type="radio" name="category" value={category.id} required className="mt-1" />
            <span>
              <span className="block font-medium">
                {category.title}
                <span className="font-normal text-muted"> · {category.summary}</span>
              </span>
              <span className="mt-1 block text-sm leading-6 text-muted">{category.allowed}</span>
            </span>
          </label>
        ))}
      </fieldset>

      {state.error ? <p className="text-sm text-seal">{state.error}</p> : null}
      {state.notice ? <p className="text-sm leading-6 text-muted">{state.notice}</p> : null}

      <button
        type="submit"
        disabled={pending}
        className="w-fit bg-ink px-5 py-3 text-sm text-paper disabled:opacity-60"
      >
        {pending ? "Checking" : "Continue"}
      </button>
    </form>
  );
}
