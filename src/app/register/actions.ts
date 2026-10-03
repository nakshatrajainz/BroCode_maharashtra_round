"use server";

import { revalidatePath } from "next/cache";
import { isCategory, type CategoryId } from "@/lib/categories";
import { createStamp } from "@/lib/stamps";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";

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

  if (name.length < 2 || name.length > 80) {
    return { error: "Enter a company name between 2 and 80 characters." };
  }
  if (!isCategory(category)) {
    return { error: "Choose what this company is allowed to do." };
  }

  const supabase = await createClient();
  const { data, error: userError } = await supabase.auth.getUser();
  if (userError || !data.user) {
    return { error: "Sign in before creating a stamp." };
  }

  const stamp = createStamp();
  const admin = createAdminClient();
  const { data: company, error: companyError } = await admin
    .from("companies")
    .insert({
      owner_id: data.user.id,
      name,
      category,
      stamp_address: stamp.address,
    })
    .select("id")
    .single();

  if (companyError || !company) {
    if (companyError?.code === "23505") {
      return { error: `This account already has a ${label(category)} stamp.` };
    }
    if (companyError?.code === "PGRST205") {
      return { error: "The company list is not ready yet." };
    }
    return { error: "The stamp could not be saved. Try again." };
  }

  const { error: keyError } = await admin.from("stamp_keys").insert({
    company_id: company.id,
    sealed_private_key: stamp.sealedPrivateKey,
  });

  if (keyError) {
    await admin.from("companies").delete().eq("id", company.id);
    return { error: "The stamp could not be saved. Try again." };
  }

  revalidatePath("/register");

  return {
    notice: `${name} is on the list as a ${label(category)}. Public stamp: ${stamp.address}`,
  };
}

function label(category: CategoryId) {
  if (category === "maker") return "Maker";
  if (category === "editor") return "Editor";
  return "Publisher";
}
