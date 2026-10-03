"use client";

import { useActionState } from "react";
import Link from "next/link";
import { signIn, signUp, type AuthState } from "@/lib/auth-actions";

const initialState: AuthState = {};

export function AuthForm({ mode }: { mode: "sign-in" | "sign-up" }) {
  const action = mode === "sign-in" ? signIn : signUp;
  const [state, formAction, pending] = useActionState(action, initialState);

  return (
    <form action={formAction} className="mt-10 grid max-w-md gap-5">
      <label className="grid gap-2">
        <span className="text-sm">Email</span>
        <input
          name="email"
          type="email"
          autoComplete="email"
          required
          className="border border-line bg-white px-3 py-3 outline-none"
        />
      </label>
      <label className="grid gap-2">
        <span className="text-sm">Password</span>
        <input
          name="password"
          type="password"
          autoComplete={mode === "sign-in" ? "current-password" : "new-password"}
          required
          minLength={8}
          className="border border-line bg-white px-3 py-3 outline-none"
        />
      </label>
      {mode === "sign-up" ? (
        <label className="grid gap-2">
          <span className="text-sm">Repeat password</span>
          <input
            name="confirm"
            type="password"
            autoComplete="new-password"
            required
            minLength={8}
            className="border border-line bg-white px-3 py-3 outline-none"
          />
        </label>
      ) : null}
      {state.error ? <p className="text-sm text-seal">{state.error}</p> : null}
      <button
        type="submit"
        disabled={pending}
        className="w-fit bg-ink px-5 py-3 text-sm text-paper disabled:opacity-60"
      >
        {pending ? "Working" : mode === "sign-in" ? "Sign in" : "Create account"}
      </button>
      {mode === "sign-in" ? (
        <p className="text-sm text-muted">
          New company? <Link href="/sign-up">Create an account</Link>
        </p>
      ) : (
        <p className="text-sm text-muted">
          Already registered? <Link href="/sign-in">Sign in</Link>
        </p>
      )}
    </form>
  );
}
