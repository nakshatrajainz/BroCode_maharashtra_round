"use client";

import { useActionState } from "react";
import Link from "next/link";
import { signIn, type AuthState } from "@/lib/auth-actions";

const initialState: AuthState = {};

export function AuthForm() {
  const [state, formAction, pending] = useActionState(signIn, initialState);

  return (
    <form action={formAction} className="card mt-10 grid max-w-md gap-5 p-6">
      <label className="grid gap-2">
        <span className="text-sm font-medium">Email</span>
        <input name="email" type="email" autoComplete="email" required className="field" />
      </label>
      <label className="grid gap-2">
        <span className="text-sm font-medium">Password</span>
        <input
          name="password"
          type="password"
          autoComplete="current-password"
          required
          minLength={8}
          className="field"
        />
      </label>
      {state.error ? (
        <p className="rounded-xl bg-seal-soft px-4 py-3 text-sm text-seal">{state.error}</p>
      ) : null}
      <button type="submit" disabled={pending} className="button">
        {pending ? "Signing in" : "Sign in"}
      </button>
      <p className="text-sm text-muted">
        New here?{" "}
        <Link href="/register" className="text-seal underline-offset-4 hover:underline">
          Register a company
        </Link>{" "}
        and the account is made with it.
      </p>
    </form>
  );
}
