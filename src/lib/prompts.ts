import "server-only";

import { createCipheriv, createDecipheriv, randomBytes, scryptSync } from "node:crypto";
import { keccak256, toBytes, toHex, type Hex } from "viem";

export function sealPrompt(plaintext: string) {
  const secret = process.env.STAMP_KEY_SECRET;
  if (!secret) {
    throw new Error("STAMP_KEY_SECRET is missing.");
  }

  const salt = randomBytes(16);
  const iv = randomBytes(12);
  const key = scryptSync(secret, salt, 32);
  const cipher = createCipheriv("aes-256-gcm", key, iv);
  const ciphertext = Buffer.concat([cipher.update(plaintext, "utf8"), cipher.final()]);
  const tag = cipher.getAuthTag();
  const sealedBlob = [salt, iv, tag, ciphertext].map((part) => part.toString("base64url")).join(".");

  return {
    sealedBlob,
    sealedPromptHash: keccak256(toBytes(sealedBlob)) as Hex,
  };
}

export function openPrompt(sealedBlob: string) {
  const secret = process.env.STAMP_KEY_SECRET;
  if (!secret) {
    throw new Error("STAMP_KEY_SECRET is missing.");
  }

  const [saltB64, ivB64, tagB64, ciphertextB64] = sealedBlob.split(".");
  if (!saltB64 || !ivB64 || !tagB64 || !ciphertextB64) {
    throw new Error("Sealed prompt is malformed.");
  }

  const salt = Buffer.from(saltB64, "base64url");
  const iv = Buffer.from(ivB64, "base64url");
  const tag = Buffer.from(tagB64, "base64url");
  const ciphertext = Buffer.from(ciphertextB64, "base64url");
  const key = scryptSync(secret, salt, 32);
  const decipher = createDecipheriv("aes-256-gcm", key, iv);
  decipher.setAuthTag(tag);
  return Buffer.concat([decipher.update(ciphertext), decipher.final()]).toString("utf8");
}

export function randomBytes32(): Hex {
  return toHex(randomBytes(32));
}
