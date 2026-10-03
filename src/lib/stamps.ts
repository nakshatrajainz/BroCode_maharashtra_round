import "server-only";

import { createCipheriv, createDecipheriv, randomBytes, scryptSync } from "node:crypto";
import { generatePrivateKey, privateKeyToAccount } from "viem/accounts";

export function createStamp() {
  const privateKey = generatePrivateKey();
  const account = privateKeyToAccount(privateKey);

  return {
    address: account.address.toLowerCase(),
    sealedPrivateKey: sealPrivateKey(privateKey),
  };
}

export function unsealPrivateKey(sealedPrivateKey: string) {
  const secret = process.env.STAMP_KEY_SECRET;
  if (!secret) {
    throw new Error("STAMP_KEY_SECRET is missing.");
  }

  const [saltB64, ivB64, tagB64, ciphertextB64] = sealedPrivateKey.split(".");
  if (!saltB64 || !ivB64 || !tagB64 || !ciphertextB64) {
    throw new Error("Sealed stamp key is malformed.");
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

function sealPrivateKey(privateKey: string) {
  const secret = process.env.STAMP_KEY_SECRET;
  if (!secret) {
    throw new Error("STAMP_KEY_SECRET is missing.");
  }

  const salt = randomBytes(16);
  const iv = randomBytes(12);
  const key = scryptSync(secret, salt, 32);
  const cipher = createCipheriv("aes-256-gcm", key, iv);
  const ciphertext = Buffer.concat([cipher.update(privateKey, "utf8"), cipher.final()]);
  const tag = cipher.getAuthTag();

  return [salt, iv, tag, ciphertext].map((part) => part.toString("base64url")).join(".");
}
