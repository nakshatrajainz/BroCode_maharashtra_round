import "server-only";

import { createCipheriv, randomBytes, scryptSync } from "node:crypto";
import { generatePrivateKey, privateKeyToAccount } from "viem/accounts";

export function createStamp() {
  const privateKey = generatePrivateKey();
  const account = privateKeyToAccount(privateKey);

  return {
    address: account.address.toLowerCase(),
    sealedPrivateKey: sealPrivateKey(privateKey),
  };
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
