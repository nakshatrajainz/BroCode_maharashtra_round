"use server";

import { revalidatePath } from "next/cache";
import type { Hex } from "viem";
import { zeroHash } from "viem";
import type { CategoryId } from "@/lib/categories";
import { categoryTitle, isCategory } from "@/lib/categories";
import {
  bufferToDataUrl,
  buildPreparedPng,
  embedHiddenId,
  extractHiddenId,
  fingerprintsForPng,
  readUploadAsPng,
  resizePngHalf,
  toDownloadName,
} from "@/lib/pictures";
import { ledgerConfigured, setCompanyAllowedOnChain, writeLineOnChain } from "@/lib/ledger";
import { openPrompt, randomBytes32, sealPrompt } from "@/lib/prompts";
import { unsealPrivateKey } from "@/lib/stamps";
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
  if (sentence.length < 2 || sentence.length > 280) {
    return fail(
      "Private sentence must be 2–280 characters.",
      "This note is sealed on the server. Check never shows it.",
    );
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
  if (!isCategory(company.category)) {
    return fail("This company has an unknown job.", "Register a Maker, Editor, or Publisher.");
  }
  if (company.allowed === false) {
    return fail(
      `${company.name} is revoked.`,
      "Old Trusted lines stay. Register a new company if you need to stamp again.",
    );
  }

  const action = company.category as CategoryId;

  let selectedModel: { id: string; name: string } | null = null;
  if (modelId) {
    const { data: modelRow, error: modelError } = await admin
      .from("company_models")
      .select("id, name")
      .eq("id", modelId)
      .eq("company_id", company.id)
      .maybeSingle();
    if (modelError || !modelRow) {
      return fail(
        "That AI model is not approved for this company.",
        "Pick an approved model, or add one under Approved models below.",
      );
    }
    selectedModel = { id: modelRow.id as string, name: modelRow.name as string };
  } else if (action === "maker") {
    return fail(
      "Choose which AI model made this picture.",
      "Makers must stamp with an approved model. Add one on Register or under Approved models.",
    );
  }

  const { data: keyRow, error: keyError } = await admin
    .from("stamp_keys")
    .select("sealed_private_key")
    .eq("company_id", company.id)
    .maybeSingle();

  if (keyError || !keyRow) {
    return fail("The stamp key could not be opened.", "Try again. If it keeps failing, re-register the company.");
  }

  let stampPrivateKey: Hex;
  try {
    stampPrivateKey = unsealPrivateKey(keyRow.sealed_private_key) as Hex;
  } catch {
    return fail("The stamp key could not be opened.", "Try again. If it keeps failing, re-register the company.");
  }

  const usePrepared = String(formData.get("usePrepared") ?? "") === "on";
  const uploaded = formData.get("picture");

  let sourcePng: Buffer;
  if (usePrepared) {
    if (action !== "maker") {
      return fail(
        "Prepared sample is only for Makers.",
        `${categoryTitle(action)}s must upload the stamped PNG downloaded from the previous step.`,
      );
    }
    sourcePng = buildPreparedPng();
  } else if (uploaded instanceof File && uploaded.size > 0) {
    if (uploaded.size > 8 * 1024 * 1024) {
      return fail("File is too large (max 8 MB).", "Compress the image or pick a smaller file.");
    }
    try {
      // Keep stamped PNGs byte-for-byte — Sharp re-encode strips the hidden id.
      sourcePng = await readUploadAsPng(Buffer.from(await uploaded.arrayBuffer()));
    } catch {
      return fail("That file type is not supported.", "Upload a PNG, JPEG, or WebP.");
    }
  } else {
    return fail(
      "No picture was uploaded.",
      action === "maker"
        ? "Choose a fresh image, or tick “Use prepared sample”."
        : "Upload the stamped file you downloaded after the previous step.",
    );
  }

  let parentLineId: Hex | null = null;
  let parentCompanyName: string | null = null;
  const existingHiddenId = extractHiddenId(sourcePng);

  if (action === "maker") {
    if (existingHiddenId) {
      return fail(
        "This picture is already stamped.",
        "Makers only stamp once. Switch to an Editor or Publisher company and upload this same stamped file.",
      );
    }

    const preFingerprints = fingerprintsForPng(sourcePng);
    const { data: existingByExact } = await admin
      .from("picture_lines")
      .select("line_id")
      .eq("action", "maker")
      .eq("exact_fingerprint", preFingerprints.exactFingerprint)
      .maybeSingle();
    const { data: existingByLook } = existingByExact
      ? { data: existingByExact }
      : await admin
          .from("picture_lines")
          .select("line_id")
          .eq("action", "maker")
          .eq("lookalike_fingerprint", preFingerprints.lookalikeFingerprint)
          .maybeSingle();

    if (existingByExact || existingByLook) {
      return fail(
        "A Maker already stamped this picture.",
        "Do not create again. Download the stamped file and continue as Editor or Publisher.",
      );
    }
  } else {
    if (!existingHiddenId) {
      return fail(
        `Wrong file for ${categoryTitle(action)}.`,
        `This upload has no stamp. ${categoryTitle(action)}s cannot start a story. First: sign in as a Maker → stamp → download. Then come back here and upload that downloaded file. (On Check, this unstamped file would be Unverifiable.)`,
      );
    }
    const { data: parents, error: parentError } = await admin
      .from("picture_lines")
      .select("line_id, action, hidden_id, companies(name)")
      .eq("hidden_id", existingHiddenId)
      .order("created_at", { ascending: false })
      .limit(1);

    const parent = !parentError && parents?.[0] ? parents[0] : null;

    if (!parent) {
      return fail(
        "Stamp id found, but no matching notebook line.",
        "Use the exact file downloaded from Create after a successful stamp — not a screenshot or re-export.",
      );
    }
    parentLineId = parent.line_id as Hex;
    parentCompanyName = Array.isArray(parent.companies)
      ? (parent.companies[0]?.name ?? null)
      : ((parent.companies as { name?: string } | null)?.name ?? null);

    if (action === "editor") {
      try {
        sourcePng = await resizePngHalf(sourcePng);
      } catch {
        return fail("Resize failed.", "Try the stamped PNG download again.");
      }
    }
  }

  const hiddenId = randomBytes32();
  const lineId = randomBytes32();
  const stamped = embedHiddenId(sourcePng, hiddenId);
  if (extractHiddenId(stamped) !== hiddenId) {
    return fail("Could not write the stamp into the picture.", "Try another PNG/JPEG/WebP file.");
  }

  const { exactFingerprint, lookalikeFingerprint } = fingerprintsForPng(stamped);
  const { sealedBlob, sealedPromptHash } = sealPrompt(sentence);

  const stampedAt = new Date().toISOString();

  // Case 13 helper: two Makers stamping identical pixels → leave both; Check marks ambiguous.
  const { error: lineError } = await admin.from("picture_lines").insert({
    company_id: company.id,
    line_id: lineId,
    parent_line_id: parentLineId,
    action,
    exact_fingerprint: exactFingerprint,
    lookalike_fingerprint: lookalikeFingerprint,
    hidden_id: hiddenId,
    sealed_prompt_hash: sealedPromptHash,
    model_id: selectedModel?.id ?? null,
    ai_model: selectedModel?.name ?? null,
    created_at: stampedAt,
  });

  if (lineError) {
    return fail("Could not save the picture line.", `Database said: ${lineError.message}`);
  }

  const { error: envelopeError } = await admin.from("prompt_envelopes").insert({
    line_id: lineId,
    sealed_blob: sealedBlob,
  });

  if (envelopeError) {
    await admin.from("picture_lines").delete().eq("line_id", lineId);
    return fail("Could not save the sealed sentence.", `Database said: ${envelopeError.message}`);
  }

  let chainTx: string | undefined;
  const onChain = ledgerConfigured() && Boolean(company.chain_tx);

  if (onChain) {
    try {
      chainTx = await writeLineOnChain({
        stampPrivateKey,
        lineId,
        parentId: parentLineId ?? zeroHash,
        stampAddress: company.stamp_address as `0x${string}`,
        action,
        exactFingerprint,
        lookalikeFingerprint,
        hiddenId,
        sealedPrompt: sealedPromptHash,
      });
      await admin.from("picture_lines").update({ chain_tx: chainTx }).eq("line_id", lineId);
    } catch (cause) {
      await admin.from("prompt_envelopes").delete().eq("line_id", lineId);
      await admin.from("picture_lines").delete().eq("line_id", lineId);
      const detail = cause instanceof Error ? cause.message : "Unknown chain error";
      return fail(
        "Notebook write failed — nothing was kept.",
        `Check keeper tBNB balance and try again. Detail: ${detail}`,
      );
    }
  } else if (ledgerConfigured() && !company.chain_tx) {
    // Still succeed locally, but surface a clear warning in the success card via onChain=false.
  }

  revalidatePath("/create");
  revalidatePath("/check");

  return {
    created: {
      companyName: company.name,
      action,
      aiModel: selectedModel?.name ?? null,
      stampedAt,
      lineId,
      parentLineId,
      parentCompanyName,
      hiddenId,
      exactFingerprint,
      lookalikeFingerprint,
      sealedPromptHash,
      chainTx,
      onChain,
      downloadName: toDownloadName(company.name),
      downloadUrl: bufferToDataUrl(stamped),
    },
  };
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
