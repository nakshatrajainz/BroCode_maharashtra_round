import "server-only";

import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";

export function accountProblem(email: string, password: string) {
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return "Enter a valid email address.";
  if (password.length < 8) return "Use a password of at least 8 characters.";
  if (!/[a-zA-Z]/.test(password) || !/[0-9]/.test(password)) {
    return "Use both letters and numbers in the password.";
  }
  return null;
}

export async function createAccount(
  email: string,
  password: string,
  confirm: string,
): Promise<{ userId: string } | { error: string }> {
  const problem = accountProblem(email, password);
  if (problem) return { error: problem };
  if (password !== confirm) return { error: "The two passwords do not match." };

  const admin = createAdminClient();
  const { error: createError } = await admin.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
  });

  if (createError) {
    if (/already registered|already been registered|already exists/i.test(createError.message)) {
      return { error: "That email already has an account. Sign in first, then register the company." };
    }
    return { error: "The account could not be created. Try again." };
  }

  return passwordSignIn(email, password);
}

export async function passwordSignIn(
  email: string,
  password: string,
): Promise<{ userId: string } | { error: string }> {
  const supabase = await createClient();
  const { data, error } = await supabase.auth.signInWithPassword({ email, password });
  if (error || !data.user) return { error: "Email or password is wrong." };
  return { userId: data.user.id };
}
