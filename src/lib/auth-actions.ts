"use server";

import { redirect } from "next/navigation";
import { accountProblem, passwordSignIn } from "@/lib/accounts";
import { createClient } from "@/lib/supabase/server";

export type AuthState = {
  error?: string;
};

export async function signIn(_previous: AuthState, formData: FormData): Promise<AuthState> {
  const email = String(formData.get("email") ?? "").trim().toLowerCase();
  const password = String(formData.get("password") ?? "");
  const problem = accountProblem(email, password);
  if (problem) return { error: problem };
  const result = await passwordSignIn(email, password);
  if ("error" in result) return { error: result.error };
  redirect("/register");
}

export async function signOut() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/");
}
