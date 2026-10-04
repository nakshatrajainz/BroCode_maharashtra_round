"use server";

import { revalidatePath } from "next/cache";
import type { CategoryId } from "@/lib/categories";
import { generateApiKey } from "@/lib/api-keys";
import { ledgerConfigured, setCompanyAllowedOnChain } from "@/lib/ledger";
import { openPrompt } from "@/lib/prompts";
import { stampPicture } from "@/lib/stamp-core";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";

export type CreateState = {
  error?: string;
  /** Short “what to do next” shown under the error. */
  errorNext?: string;
  created?: {
    companyName: string;
    action: CategoryId;
    aiModel: string | null;
    stampedAt: string;
    lineId: string;
    parentLineId: string | null;
    parentCompanyName: string | null;
    hiddenId: string;
    exactFingerprint: string;
    lookalikeFingerprint: string;
    sealedPromptHash: string;
    chainTx?: string;
    onChain: boolean;
    downloadName: string;
    downloadUrl: string;
  };
};

export type AddModelState = {
  error?: string;
  added?: { companyName: string; modelName: string };
};

export type ApiKeyState = {
  error?: string;
  created?: { companyName: string; apiKey: string; keyPrefix: string };
};

function fail(error: string, errorNext: string): CreateState {
  return { error, errorNext };
}

export type RevealState = {
  error?: string;
  sentence?: string;
  lineId?: string;
};

export type RevokeState = {
  error?: string;
  revoked?: { name: string; stampAddress: string; chainTx?: string };
};

export async function submitStamp(
  _previous: CreateState,
  formData: FormData,
): Promise<CreateState> {
  const companyId = String(formData.get("companyId") ?? "");
  const modelId = String(formData.get("modelId") ?? "").trim();
  const sentence = String(formData.get("sentence") ?? "").trim();

  if (!companyId) {
    return fail("No company selected.", "Pick Maker, Editor, or Publisher above, then try again.");
  }

  const supabase = await createClient();
  const { data: auth } = await supabase.auth.getUser();
  const user = auth.user;
  if (!user) {
    return fail("You are signed out.", "Sign in, then open Create again.");
  }

  const admin = createAdminClient();
  const { data: company, error: companyError } = await admin
    .from("companies")
    .select("id, name, category, stamp_address, chain_tx, allowed, revoked_at")
    .eq("id", companyId)
    .eq("owner_id", user.id)
    .maybeSingle();

  if (companyError || !company) {
    return fail("That company was not found on this account.", "Register the company again on Register.");
  }

  const usePrepared = String(formData.get("usePrepared") ?? "") === "on";
  const uploaded = formData.get("picture");
  let pictureBytes: Buffer | null = null;
  if (!usePrepared && uploaded instanceof File && uploaded.size > 0) {
    pictureBytes = Buffer.from(await uploaded.arrayBuffer());
  }

  const result = await stampPicture({
    company,
    sentence,
    modelId: modelId || null,
    pictureBytes,
    usePrepared,
  });

  if (!result.ok) {
    return fail(result.error, result.errorNext);
  }

  revalidatePath("/create");
  revalidatePath("/check");

  const { pngBytes: _png, ...created } = result.created;
  return { created };
}

/** Back-compat export name used earlier. */
export const submitMakerCreate = submitStamp;

export async function addApprovedModel(
  _previous: AddModelState,
  formData: FormData,
): Promise<AddModelState> {
  const companyId = String(formData.get("companyId") ?? "");
  const modelName = String(formData.get("modelName") ?? "").trim().replace(/\s+/g, " ");

  if (!companyId) return { error: "Choose a company." };
  if (modelName.length < 1 || modelName.length > 80) {
    return { error: "Model name must be 1–80 characters." };
  }

  const supabase = await createClient();
  const { data: auth } = await supabase.auth.getUser();
  if (!auth.user) return { error: "Sign in to approve a model." };

  const admin = createAdminClient();
  const { data: company } = await admin
    .from("companies")
    .select("id, name")
    .eq("id", companyId)
    .eq("owner_id", auth.user.id)
    .maybeSingle();

  if (!company) return { error: "That company was not found on this account." };

  const { error } = await admin.from("company_models").insert({
    company_id: company.id,
    name: modelName,
  });

  if (error) {
    if (error.code === "23505") {
      return { error: `${modelName} is already approved for ${company.name}.` };
    }
    return { error: "Could not save that model. Try again." };
  }

  revalidatePath("/create");
  revalidatePath("/register");
  return { added: { companyName: company.name, modelName } };
}

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

  // Revoke older active keys so the demo stays simple: one live key per company.
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

  revalidatePath("/create");
  revalidatePath("/developers");
  return {
    created: {
      companyName: company.name,
      apiKey: generated.apiKey,
      keyPrefix: generated.keyPrefix,
    },
  };
}

export async function revealSealedSentence(
  _previous: RevealState,
  formData: FormData,
): Promise<RevealState> {
  const lineId = String(formData.get("lineId") ?? "").trim().toLowerCase();
  if (!/^0x[0-9a-f]{64}$/.test(lineId)) {
    return { error: "Enter a valid line id." };
  }

  const supabase = await createClient();
  const { data: auth } = await supabase.auth.getUser();
  if (!auth.user) return { error: "Sign in to open a sealed sentence." };

  const admin = createAdminClient();
  const { data: line } = await admin
    .from("picture_lines")
    .select("line_id, company_id")
    .eq("line_id", lineId)
    .maybeSingle();

  if (!line) {
    return { error: "Only the company that wrote this line can open its sealed sentence." };
  }

  const { data: owned } = await admin
    .from("companies")
    .select("id")
    .eq("id", line.company_id)
    .eq("owner_id", auth.user.id)
    .maybeSingle();

  if (!owned) {
    return { error: "Only the company that wrote this line can open its sealed sentence." };
  }

  const { data: envelope } = await admin
    .from("prompt_envelopes")
    .select("sealed_blob")
    .eq("line_id", lineId)
    .maybeSingle();

  if (!envelope) return { error: "No sealed sentence was found for that line." };

  try {
    return { sentence: openPrompt(envelope.sealed_blob), lineId };
  } catch {
    return { error: "The sealed sentence could not be opened." };
  }
}

export async function revokeCompanyStamp(
  _previous: RevokeState,
  formData: FormData,
): Promise<RevokeState> {
  const companyId = String(formData.get("companyId") ?? "");
  if (!companyId) return { error: "Choose a company to revoke." };

  const supabase = await createClient();
  const { data: auth } = await supabase.auth.getUser();
  if (!auth.user) return { error: "Sign in to revoke a stamp." };

  const admin = createAdminClient();
  const { data: company } = await admin
    .from("companies")
    .select("id, name, stamp_address, chain_tx, allowed")
    .eq("id", companyId)
    .eq("owner_id", auth.user.id)
    .maybeSingle();

  if (!company) return { error: "That company was not found on this account." };
  if (company.allowed === false) return { error: `${company.name} is already revoked.` };

  let chainTx: string | undefined;
  if (ledgerConfigured() && company.chain_tx) {
    try {
      chainTx = await setCompanyAllowedOnChain(company.stamp_address, false);
    } catch {
      return { error: "The notebook revoke call failed. Try again." };
    }
  }

  const { error } = await admin
    .from("companies")
    .update({ allowed: false, revoked_at: new Date().toISOString() })
    .eq("id", company.id);

  if (error) return { error: "The company could not be revoked. Try again." };

  revalidatePath("/create");
  revalidatePath("/register");
  return { revoked: { name: company.name, stampAddress: company.stamp_address, chainTx } };
}
