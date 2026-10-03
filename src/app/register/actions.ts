"use server";

import { revalidatePath } from "next/cache";
import { createAccount } from "@/lib/accounts";
import { categoryTitle, isCategory, type CategoryId } from "@/lib/categories";
import { ledgerConfigured, registerCompanyOnChain } from "@/lib/ledger";
import { createStamp } from "@/lib/stamps";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";

export type RegisterState = {
  error?: string;
  created?: {
    name: string;
    category: CategoryId;
    stampAddress: string;
    chainTx?: string;
  };
};

export async function submitRegistration(
  _previous: RegisterState,
  formData: FormData,
): Promise<RegisterState> {
  const name = String(formData.get("name") ?? "").trim().replace(/\s+/g, " ");
  const category = String(formData.get("category") ?? "");

  if (!isCategory(category)) {
    return { error: "Choose the one job this company does." };
  }
  if (name.length < 2 || name.length > 80) {
    return { error: "Enter a company name between 2 and 80 characters." };
  }

  const supabase = await createClient();
  const { data } = await supabase.auth.getUser();
  let ownerId = data.user?.id;

  if (!ownerId) {
    const email = String(formData.get("email") ?? "").trim().toLowerCase();
    const password = String(formData.get("password") ?? "");
    const confirm = String(formData.get("confirm") ?? "");
    const account = await createAccount(email, password, confirm);
    if ("error" in account) return { error: account.error };
    ownerId = account.userId;
    revalidatePath("/", "layout");
  }

  const admin = createAdminClient();
  const { data: existing, error: readError } = await admin
    .from("companies")
    .select("name, category")
    .eq("owner_id", ownerId);

  if (readError) {
    return { error: "Your companies could not be read. Try again." };
  }

  const sameJob = existing?.find((company) => company.category === category);
  if (sameJob) {
    return {
      error: `${sameJob.name} is already this account's ${categoryTitle(category)}. One account can hold only one ${categoryTitle(category)}. Use a different account for another one.`,
    };
  }

  const sameName = existing?.find((company) => company.name.toLowerCase() === name.toLowerCase());
  if (sameName) {
    return {
      error: `${sameName.name} is already registered as your ${categoryTitle(sameName.category as CategoryId)}. A company does one job, so give this ${categoryTitle(category)} its own name.`,
    };
  }

  const stamp = createStamp();
  const { data: company, error: companyError } = await admin
    .from("companies")
    .insert({
      owner_id: ownerId,
      name,
      category,
      stamp_address: stamp.address,
    })
    .select("id")
    .single();

  if (companyError || !company) {
    if (companyError?.code === "23505") {
      return { error: `This account already has a ${categoryTitle(category)}.` };
    }
    return { error: "The company could not be saved. Try again." };
  }

  const { error: keyError } = await admin.from("stamp_keys").insert({
    company_id: company.id,
    sealed_private_key: stamp.sealedPrivateKey,
  });

  if (keyError) {
    await admin.from("companies").delete().eq("id", company.id);
    return { error: "The stamp could not be saved. Try again." };
  }

  let chainTx: string | undefined;
  if (ledgerConfigured()) {
    try {
      chainTx = await registerCompanyOnChain({
        stampAddress: stamp.address,
        name,
        category,
      });
      await admin.from("companies").update({ chain_tx: chainTx }).eq("id", company.id);
    } catch {
      await admin.from("stamp_keys").delete().eq("company_id", company.id);
      await admin.from("companies").delete().eq("id", company.id);
      return {
        error: "The company was saved off-chain but could not be written to the BNB notebook. Try again.",
      };
    }
  }

  revalidatePath("/register");

  return { created: { name, category, stampAddress: stamp.address, chainTx } };
}
