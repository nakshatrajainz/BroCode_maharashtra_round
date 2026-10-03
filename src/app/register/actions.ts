"use server";

import { isCategory } from "@/lib/categories";

export type RegisterState = {
  error?: string;
  notice?: string;
};

export async function submitRegistration(
  _previous: RegisterState,
  formData: FormData,
): Promise<RegisterState> {
  const name = String(formData.get("name") ?? "").trim();
  const category = String(formData.get("category") ?? "");

  if (name.length < 2) {
    return { error: "Enter the company name." };
  }

  if (!isCategory(category)) {
    return { error: "Choose what this company is allowed to do." };
  }

  return {
    notice:
      "The form is valid. Saving is not open yet, because the company login and the public notebook are not connected.",
  };
}
