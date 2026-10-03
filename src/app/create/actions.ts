"use server";

import { revalidatePath } from "next/cache";
import type { Hex } from "viem";
import { zeroHash } from "viem";
import {
  bufferToDataUrl,
  buildPreparedPng,
  embedHiddenId,
  fingerprintsForPng,
  toDownloadName,
} from "@/lib/pictures";
import { ledgerConfigured, writeLineOnChain } from "@/lib/ledger";
import { randomBytes32, sealPrompt } from "@/lib/prompts";
import { unsealPrivateKey } from "@/lib/stamps";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";

export type CreateState = {
  error?: string;
  created?: {
    companyName: string;
    lineId: string;
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

export async function submitMakerCreate(
  _previous: CreateState,
  formData: FormData,
): Promise<CreateState> {
  const companyId = String(formData.get("companyId") ?? "");
  const sentence = String(formData.get("sentence") ?? "").trim();

  if (!companyId) {
    return { error: "Choose which Maker company stamps this picture." };
  }
  if (sentence.length < 2 || sentence.length > 280) {
    return { error: "Enter a private sentence between 2 and 280 characters. It stays sealed." };
  }

  const supabase = await createClient();
  const { data: auth } = await supabase.auth.getUser();
  const user = auth.user;
  if (!user) {
    return { error: "Sign in to stamp a picture." };
  }

  const admin = createAdminClient();
  const { data: company, error: companyError } = await admin
    .from("companies")
    .select("id, name, category, stamp_address, chain_tx")
    .eq("id", companyId)
    .eq("owner_id", user.id)
    .maybeSingle();

  if (companyError || !company) {
    return { error: "That company was not found on this account." };
  }
  if (company.category !== "maker") {
    return { error: "Only a Maker can write the first creation line in this phase." };
  }

  const { data: keyRow, error: keyError } = await admin
    .from("stamp_keys")
    .select("sealed_private_key")
    .eq("company_id", company.id)
    .maybeSingle();

  if (keyError || !keyRow) {
    return { error: "The stamp key for this company could not be opened." };
  }

  let stampPrivateKey: Hex;
  try {
    stampPrivateKey = unsealPrivateKey(keyRow.sealed_private_key) as Hex;
  } catch {
    return { error: "The stamp key for this company could not be opened." };
  }

  const hiddenId = randomBytes32();
  const lineId = randomBytes32();
  const prepared = buildPreparedPng();
  const stamped = embedHiddenId(prepared, hiddenId);
  const { exactFingerprint, lookalikeFingerprint } = fingerprintsForPng(stamped);
  const { sealedBlob, sealedPromptHash } = sealPrompt(sentence);

  const { error: lineError } = await admin.from("picture_lines").insert({
    company_id: company.id,
    line_id: lineId,
    parent_line_id: null,
    action: "maker",
    exact_fingerprint: exactFingerprint,
    lookalike_fingerprint: lookalikeFingerprint,
    hidden_id: hiddenId,
    sealed_prompt_hash: sealedPromptHash,
  });

  if (lineError) {
    return { error: "The picture line could not be saved. Try again." };
  }

  const { error: envelopeError } = await admin.from("prompt_envelopes").insert({
    line_id: lineId,
    sealed_blob: sealedBlob,
  });

  if (envelopeError) {
    await admin.from("picture_lines").delete().eq("line_id", lineId);
    return { error: "The sealed sentence could not be saved. Try again." };
  }

  let chainTx: string | undefined;
  const onChain = ledgerConfigured() && Boolean(company.chain_tx);

  if (onChain) {
    try {
      chainTx = await writeLineOnChain({
        stampPrivateKey,
        lineId,
        parentId: zeroHash,
        stampAddress: company.stamp_address as `0x${string}`,
        action: "maker",
        exactFingerprint,
        lookalikeFingerprint,
        hiddenId,
        sealedPrompt: sealedPromptHash,
      });
      await admin.from("picture_lines").update({ chain_tx: chainTx }).eq("line_id", lineId);
    } catch {
      await admin.from("prompt_envelopes").delete().eq("line_id", lineId);
      await admin.from("picture_lines").delete().eq("line_id", lineId);
      return {
        error:
          "The line was prepared but could not be written to the BNB notebook. Check the keeper balance and try again.",
      };
    }
  }

  revalidatePath("/create");

  return {
    created: {
      companyName: company.name,
      lineId,
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
