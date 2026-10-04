import "server-only";

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
import { ledgerConfigured, writeLineOnChain } from "@/lib/ledger";
import { randomBytes32, sealPrompt } from "@/lib/prompts";
import { unsealPrivateKey } from "@/lib/stamps";
import { createAdminClient } from "@/lib/supabase/admin";

export type StampCompanyRow = {
  id: string;
  name: string;
  category: string;
  stamp_address: string;
  chain_tx: string | null;
  allowed: boolean | null;
  revoked_at: string | null;
};

export type StampSuccess = {
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
  pngBytes: Buffer;
};

export type StampFailure = {
  error: string;
  errorNext: string;
};

export type StampResult = { ok: true; created: StampSuccess } | { ok: false } & StampFailure;

export async function stampPicture(input: {
  company: StampCompanyRow;
  sentence: string;
  modelId?: string | null;
  modelName?: string | null;
  pictureBytes?: Buffer | null;
  usePrepared?: boolean;
}): Promise<StampResult> {
  const sentence = input.sentence.trim();
  if (sentence.length < 2 || sentence.length > 280) {
    return fail(
      "Private sentence must be 2–280 characters.",
      "This note is sealed on the server. Check never shows it.",
    );
  }

  if (!isCategory(input.company.category)) {
    return fail("This company has an unknown job.", "Register a Maker, Editor, or Publisher.");
  }
  if (input.company.allowed === false) {
    return fail(
      `${input.company.name} is revoked.`,
      "Old Trusted lines stay. Register a new company if you need to stamp again.",
    );
  }

  const action = input.company.category as CategoryId;
  const admin = createAdminClient();

  let selectedModel: { id: string; name: string } | null = null;
  if (input.modelId) {
    const { data: modelRow, error: modelError } = await admin
      .from("company_models")
      .select("id, name")
      .eq("id", input.modelId)
      .eq("company_id", input.company.id)
      .maybeSingle();
    if (modelError || !modelRow) {
      return fail(
        "That AI model is not approved for this company.",
        "Pick an approved model, or approve one first.",
      );
    }
    selectedModel = { id: modelRow.id as string, name: modelRow.name as string };
  } else if (input.modelName) {
    const name = input.modelName.trim().replace(/\s+/g, " ");
    const { data: modelRow, error: modelError } = await admin
      .from("company_models")
      .select("id, name")
      .eq("company_id", input.company.id)
      .ilike("name", name)
      .maybeSingle();
    if (modelError || !modelRow) {
      return fail(
        `Model “${name}” is not approved for this company.`,
        "Approve the model first, then call stamp again.",
      );
    }
    selectedModel = { id: modelRow.id as string, name: modelRow.name as string };
  } else if (action === "maker") {
    return fail(
      "Choose which AI model made this picture.",
      "Makers must stamp with an approved model.",
    );
  }

  const { data: keyRow, error: keyError } = await admin
    .from("stamp_keys")
    .select("sealed_private_key")
    .eq("company_id", input.company.id)
    .maybeSingle();

  if (keyError || !keyRow) {
    return fail("The stamp key could not be opened.", "Try again or re-register the company.");
  }

  let stampPrivateKey: Hex;
  try {
    stampPrivateKey = unsealPrivateKey(keyRow.sealed_private_key) as Hex;
  } catch {
    return fail("The stamp key could not be opened.", "Try again or re-register the company.");
  }

  let sourcePng: Buffer;
  if (input.usePrepared) {
    if (action !== "maker") {
      return fail(
        "Prepared sample is only for Makers.",
        `${categoryTitle(action)}s must upload the stamped PNG from the previous step.`,
      );
    }
    sourcePng = buildPreparedPng();
  } else if (input.pictureBytes && input.pictureBytes.length > 0) {
    if (input.pictureBytes.length > 8 * 1024 * 1024) {
      return fail("File is too large (max 8 MB).", "Compress the image or pick a smaller file.");
    }
    try {
      sourcePng = await readUploadAsPng(input.pictureBytes);
    } catch {
      return fail("That file type is not supported.", "Upload a PNG, JPEG, or WebP.");
    }
  } else {
    return fail(
      "No picture was uploaded.",
      action === "maker"
        ? "Send a fresh image, or use the prepared sample."
        : "Upload the stamped file from the previous step.",
    );
  }

  let parentLineId: Hex | null = null;
  let parentCompanyName: string | null = null;
  const existingHiddenId = extractHiddenId(sourcePng);

  if (action === "maker") {
    if (existingHiddenId) {
      return fail(
        "This picture is already stamped.",
        "Makers only stamp once. Continue as Editor or Publisher with this file.",
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
        "Do not create again. Continue as Editor or Publisher.",
      );
    }
  } else {
    if (!existingHiddenId) {
      return fail(
        `Wrong file for ${categoryTitle(action)}.`,
        `This upload has no stamp. Stamp as Maker first, then send that file here.`,
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
        "Use the exact stamped download — not a screenshot or re-export.",
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

  const { error: lineError } = await admin.from("picture_lines").insert({
    company_id: input.company.id,
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
  const onChain = ledgerConfigured() && Boolean(input.company.chain_tx);

  if (onChain) {
    try {
      chainTx = await writeLineOnChain({
        stampPrivateKey,
        lineId,
        parentId: parentLineId ?? zeroHash,
        stampAddress: input.company.stamp_address as `0x${string}`,
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
  }

  return {
    ok: true,
    created: {
      companyName: input.company.name,
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
      downloadName: toDownloadName(input.company.name),
      downloadUrl: bufferToDataUrl(stamped),
      pngBytes: stamped,
    },
  };
}

function fail(error: string, errorNext: string): StampResult {
  return { ok: false, error, errorNext };
}
