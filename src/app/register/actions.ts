"use server";

import { revalidatePath } from "next/cache";
import { createAccount } from "@/lib/accounts";
import { generateApiKey } from "@/lib/api-keys";
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
    models: string[];
    apiKey: string;
  };
};

export type ApiKeyState = {
  error?: string;
  created?: { companyId: string; companyName: string; apiKey: string; keyPrefix: string };
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

  const modelNames = String(formData.get("models") ?? "")
    .split(/[\n,]/)
    .map((item) => item.trim().replace(/\s+/g, " "))
    .filter((item) => item.length >= 1 && item.length <= 80)
    .filter((item, index, all) => all.findIndex((other) => other.toLowerCase() === item.toLowerCase()) === index)
    .slice(0, 12);

  if (category === "maker" && modelNames.length === 0) {
    return {
      error: "Add at least one approved AI model name for this Maker (for example Flux 1.1 or Imagen 3).",
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

  if (modelNames.length > 0) {
    const { error: modelError } = await admin.from("company_models").insert(
      modelNames.map((modelName) => ({
        company_id: company.id,
        name: modelName,
      })),
    );
    if (modelError) {
      await admin.from("stamp_keys").delete().eq("company_id", company.id);
      await admin.from("companies").delete().eq("id", company.id);
      return { error: "The approved models could not be saved. Try again." };
    }
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

  const generated = generateApiKey();
  const { error: apiKeyError } = await admin.from("company_api_keys").insert({
    company_id: company.id,
    key_prefix: generated.keyPrefix,
    key_hash: generated.keyHash,
  });
  if (apiKeyError) {
    await admin.from("stamp_keys").delete().eq("company_id", company.id);
    await admin.from("companies").delete().eq("id", company.id);
    return { error: "The company API key could not be saved. Try again." };
  }

  revalidatePath("/register");
  revalidatePath("/create");

  return {
    created: {
      name,
      category,
      stampAddress: stamp.address,
      chainTx,
      models: modelNames,
      apiKey: generated.apiKey,
    },
  };
}

/** Rotate / create a live API key for one company (shown once). */
export async function createCompanyApiKey(
  _previous: ApiKeyState,
  formData: FormData,
): Promise<ApiKeyState> {
  const companyId = String(formData.get("companyId") ?? "");
  if (!companyId) return { error: "Choose a company." };

  const supabase = await createClient();
  const { data: auth } = await supabase.auth.getUser();
  if (!auth.user) return { error: "Sign in to create an API key." };

  const admin = createAdminClient();
  const { data: company } = await admin
    .from("companies")
    .select("id, name")
    .eq("id", companyId)
    .eq("owner_id", auth.user.id)
    .maybeSingle();

  if (!company) return { error: "That company was not found on this account." };

  await admin
    .from("company_api_keys")
    .update({ revoked_at: new Date().toISOString() })
    .eq("company_id", company.id)
    .is("revoked_at", null);

  const generated = generateApiKey();
  const { error } = await admin.from("company_api_keys").insert({
    company_id: company.id,
    key_prefix: generated.keyPrefix,
    key_hash: generated.keyHash,
  });

  if (error) return { error: "Could not create an API key. Try again." };

  revalidatePath("/register");
  return {
    created: {
      companyId: company.id,
      companyName: company.name,
      apiKey: generated.apiKey,
      keyPrefix: generated.keyPrefix,
    },
  };
}
