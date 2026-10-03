"use server";

import { assertPng, normalizeToPng } from "@/lib/pictures";
import { checkPicture, type CheckResult } from "@/lib/verdict";

export type CheckState = {
  error?: string;
  result?: CheckResult;
};

export async function submitCheck(_previous: CheckState, formData: FormData): Promise<CheckState> {
  const uploaded = formData.get("picture");
  const claimedMaker = String(formData.get("claimedMaker") ?? "").trim();

  if (!(uploaded instanceof File) || uploaded.size === 0) {
    return { error: "Choose a picture to check." };
  }
  if (uploaded.size > 8 * 1024 * 1024) {
    return { error: "Keep the picture under 8 MB." };
  }

  let pngBytes: Buffer;
  try {
    const bytes = Buffer.from(await uploaded.arrayBuffer());
    try {
      // Keep stamped PNGs byte-for-byte so hidden id + exact fingerprint survive.
      assertPng(bytes);
      pngBytes = bytes;
    } catch {
      pngBytes = await normalizeToPng(bytes);
    }
  } catch {
    return { error: "Upload a PNG, JPEG, or WebP picture." };
  }

  try {
    const result = await checkPicture({
      pngBytes,
      claimedMaker: claimedMaker || undefined,
    });
    return { result };
  } catch {
    return { error: "The picture could not be checked. Try again." };
  }
}
